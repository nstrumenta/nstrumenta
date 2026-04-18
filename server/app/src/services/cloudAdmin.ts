import { CloudBuildClient } from '@google-cloud/cloudbuild'
import { Firestore } from '@google-cloud/firestore'
import { ServicesClient } from '@google-cloud/run'
import { Storage } from '@google-cloud/storage'
import { bucketName, projectId } from '../authentication/ServiceAccount'
import { ActionData } from '../index'
import { parseOrgProject } from '../shared/utils'

const PREVIEW_IMAGE_REGISTRY = process.env.PREVIEW_IMAGE_REGISTRY
const PREVIEW_REGION = 'us-west1'

export interface CloudAdminService {
  hostModule(
    actionPath: string,
    projectId: string,
    data: ActionData,
  ): Promise<void>
}

export interface CloudAdminServiceDependencies {
  firestore: Firestore
  storage: Storage
}

export const createCloudAdminService = ({ firestore, storage }: CloudAdminServiceDependencies): CloudAdminService => {
  const cloudBuild = new CloudBuildClient()
  const cloudRun = new ServicesClient()

  function previewServiceName(nstProjectId: string): string {
    const { orgSlug, projectSlug } = parseOrgProject(nstProjectId)
    return `preview-${orgSlug}-${projectSlug}`.toLowerCase().replace(/[^a-z0-9-]/g, '-').slice(0, 49)
  }

  function buildDockerfile(moduleName: string, previousImage: string | null): string {
    if (previousImage) {
      return [
        `FROM ${previousImage} AS previous`,
        `FROM alpine:latest AS builder`,
        `COPY --from=previous /usr/share/nginx/html/ /html/`,
        `ADD ${moduleName}.tar.gz /html/${moduleName}/`,
        `FROM nginx:alpine`,
        `COPY --from=builder /html/ /usr/share/nginx/html/`,
      ].join('\n')
    }
    return [
      `FROM alpine:latest AS builder`,
      `RUN mkdir -p /html`,
      `ADD ${moduleName}.tar.gz /html/${moduleName}/`,
      `FROM nginx:alpine`,
      `COPY --from=builder /html/ /usr/share/nginx/html/`,
    ].join('\n')
  }

  async function getPreviousImage(nstProjectId: string): Promise<string | null> {
    const serviceName = previewServiceName(nstProjectId)
    const projectPath = `projects/${projectId}/locations/${PREVIEW_REGION}/services/${serviceName}`
    try {
      const [service] = await cloudRun.getService({ name: projectPath })
      const image = service.template?.containers?.[0]?.image
      return image ?? null
    } catch {
      return null
    }
  }

  async function waitForBuild(buildId: string): Promise<void> {
    let attempts = 0
    while (attempts < 120) {
      const [build] = await cloudBuild.getBuild({ projectId, id: buildId })
      const status = build.status
      if (status === 'SUCCESS') return
      if (status === 'FAILURE' || status === 'CANCELLED' || status === 'TIMEOUT' || status === 'INTERNAL_ERROR') {
        throw new Error(`Cloud Build ${buildId} ended with status: ${status}`)
      }
      await new Promise((resolve) => setTimeout(resolve, 5000))
      attempts++
    }
    throw new Error(`Cloud Build ${buildId} timed out after 10 minutes`)
  }

  async function deployPreviewService(nstProjectId: string, imageUri: string): Promise<string> {
    const serviceName = previewServiceName(nstProjectId)
    const parent = `projects/${projectId}/locations/${PREVIEW_REGION}`
    const fullServiceName = `${parent}/services/${serviceName}`

    const serviceConfig = {
      template: {
        containers: [{ image: imageUri, ports: [{ containerPort: 80 }] }],
        scaling: { minInstanceCount: 0, maxInstanceCount: 3 },
      },
    }

    let uri: string
    try {
      const [existingService] = await cloudRun.getService({ name: fullServiceName })
      const [operation] = await cloudRun.updateService({
        service: { ...existingService, ...serviceConfig, name: fullServiceName },
        updateMask: { paths: ['template'] },
      })
      const [updatedService] = await operation.promise()
      uri = updatedService.uri ?? ''
    } catch (err: any) {
      if (err.code === 5) {
        const [operation] = await cloudRun.createService({
          parent,
          serviceId: serviceName,
          service: serviceConfig,
        })
        const [createdService] = await operation.promise()
        uri = createdService.uri ?? ''

        await cloudRun.setIamPolicy({
          resource: fullServiceName,
          policy: {
            bindings: [{ role: 'roles/run.invoker', members: ['allUsers'] }],
          },
        })
      } else {
        throw err
      }
    }

    return uri
  }

  async function hostModule(
    actionPath: string,
    nstProjectId: string,
    data: ActionData,
  ) {
    console.log({ nstProjectId }, 'hostModule')
    if (!PREVIEW_IMAGE_REGISTRY) {
      throw new Error('PREVIEW_IMAGE_REGISTRY env var is required for hostModule')
    }

    try {
      await firestore.doc(actionPath).set({ status: 'started' }, { merge: true })

      const { name, path: modulePath, moduleDocumentPath } = data.data.module
      const moduleName = name
      const { orgSlug, projectSlug } = parseOrgProject(nstProjectId)
      const storagePrefix = `${orgSlug}/${projectSlug}`
      const tarGcsPath = `${storagePrefix}/${modulePath}`

      const previousImage = await getPreviousImage(nstProjectId)
      const newImageTag = `${PREVIEW_IMAGE_REGISTRY}/${previewServiceName(nstProjectId)}:latest`
      const dockerfile = buildDockerfile(moduleName, previousImage)

      const [buildOperation] = await cloudBuild.createBuild({
        projectId,
        build: {
          steps: [
            {
              name: 'gcr.io/google.com/cloudsdktool/cloud-sdk',
              args: ['gcloud', 'storage', 'cp', `gs://${bucketName}/${tarGcsPath}`, `${moduleName}.tar.gz`],
            },
            {
              name: 'bash',
              args: ['-c', `cat > Dockerfile.preview << 'DOCKEREOF'\n${dockerfile}\nDOCKEREOF`],
            },
            {
              name: 'gcr.io/cloud-builders/docker',
              args: ['build', '-t', newImageTag, '-f', 'Dockerfile.preview', '.'],
            },
          ],
          images: [newImageTag],
          options: {
            logging: 'CLOUD_LOGGING_ONLY',
          },
        },
      })

      const buildMetadata = buildOperation.metadata as any
      const buildId = buildMetadata?.build?.id
      if (!buildId) throw new Error('Cloud Build did not return a build ID')

      console.log(`[hostModule] Cloud Build ${buildId} started for ${moduleName}`)
      await waitForBuild(buildId)
      console.log(`[hostModule] Cloud Build ${buildId} complete`)

      const serviceUri = await deployPreviewService(nstProjectId, newImageTag)
      const url = `${serviceUri}/${moduleName}/`
      console.log(`[hostModule] deployed preview at ${url}`)

      await firestore.doc(moduleDocumentPath).set(
        { url, lastModified: Date.now() },
        { merge: true },
      )

      await firestore.doc(actionPath).set({ status: 'complete' }, { merge: true })
    } catch (err: any) {
      console.error('[hostModule] error:', err)
      await firestore
        .doc(actionPath)
        .set({ status: 'error', error: err.message ?? JSON.stringify(err) }, { merge: true })
    }
  }

  return {
    hostModule,
  }
}
