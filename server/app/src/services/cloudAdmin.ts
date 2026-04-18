import { Firestore } from '@google-cloud/firestore'
import { Storage } from '@google-cloud/storage'
import { ChildProcessWithoutNullStreams } from 'child_process'
import { mkdir, readdir, readFile } from 'fs/promises'
import { join } from 'path'
import { v4 as uuid } from 'uuid'
import { bucketName, projectId } from '../authentication/ServiceAccount'
import { ActionData } from '../index'
import { orgProjectPath, parseOrgProject } from '../shared/utils'

const CORS_CONFIG = [
  {
    maxAgeSeconds: 3600,
    method: ['PUT', 'POST', 'GET', 'OPTIONS'],
    origin: ['*'],
    responseHeader: [
      'Access-Control-Allow-Origin',
      'X-Requested-With',
      'Content-Type',
      'Range',
      'Accept-Ranges',
      'Content-Range',
      'Content-Encoding',
      'Content-Length',
    ],
  },
]

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
  spawn: (
    command: string,
    args: string[],
    options?: any,
  ) => ChildProcessWithoutNullStreams
}

export const createCloudAdminService = ({
  firestore,
  spawn,
  storage,
}: CloudAdminServiceDependencies): CloudAdminService => {
  async function tarExtract(
    tarFilePath: string,
    extractFolder: string,
  ): Promise<void> {
    const process = spawn('tar', ['-zxvf', tarFilePath], {
      cwd: extractFolder,
    })
    let error = ''
    for await (const chunk of process.stderr) {
      error += chunk
    }
    const code: number = await new Promise((resolve) => {
      process.on('close', resolve)
    })
    if (code) {
      throw new Error(`tar extract error code ${code}, ${error}`)
    }
  }

  async function uploadDirectory(
    bucket: ReturnType<Storage['bucket']>,
    localDir: string,
    prefix: string,
  ): Promise<void> {
    const entries = await readdir(localDir, { withFileTypes: true })
    const uploadPromises: Promise<any>[] = []

    for (const entry of entries) {
      const localPath = join(localDir, entry.name)
      const remotePath = prefix ? `${prefix}/${entry.name}` : entry.name

      if (entry.isDirectory()) {
        uploadPromises.push(uploadDirectory(bucket, localPath, remotePath))
      } else {
        uploadPromises.push(
          bucket.upload(localPath, { destination: remotePath }),
        )
      }
    }

    await Promise.all(uploadPromises)
  }

  function uniqueName(id: string): string {
    const sanitizedId = id.replace(/[^a-z0-9-]/gi, '-');
    return `${projectId.split('-')[0]}-${sanitizedId.slice(0, 20)}-${uuid().replace(
      /-/g,
      '',
    )}`
      .slice(0, 30)
      .toLowerCase()
  }

  async function hostModule(
    actionPath: string,
    nstProjectId: string,
    data: ActionData,
  ) {
    console.log({ nstProjectId }, 'hostModule')
    try {
      await firestore
        .doc(actionPath)
        .set({ status: 'started' }, { merge: true })

      const projectPath = orgProjectPath(nstProjectId)
      
      const projectData = (
        await firestore.doc(projectPath).get()
      ).data()

      let hostingBucket = projectData?.hostingBucket

      if (hostingBucket != undefined) {
        console.log(`hosting bucket ${hostingBucket} exists on ${nstProjectId}`)
      } else {
        hostingBucket = uniqueName(nstProjectId)

        const region = projectData?.region ?? 'europe-west3'
        console.log(
          `[cloudAdmin] creating bucket ${hostingBucket} in ${region}`,
        )

        await storage.createBucket(hostingBucket, {
          location: region,
          storageClass: 'standard',
          uniformBucketLevelAccess: { enabled: true },
        })

        const bucket = storage.bucket(hostingBucket)

        await bucket.iam.setPolicy({
          bindings: [
            {
              role: 'roles/storage.objectViewer',
              members: ['allUsers'],
            },
          ],
        })

        await bucket.setCorsConfiguration(CORS_CONFIG)

        await firestore
          .doc(projectPath)
          .set({ hostingBucket }, { merge: true })
      }

      console.log(data)
      const { name, moduleDocumentPath } = data.data.module
      const moduleName = name.replace('.tar.gz', '')
      const workingDirectory = `${__dirname}/temp/modules`
      const extractFolder = `${workingDirectory}/${moduleName}`
      await mkdir(extractFolder, { recursive: true })
      const tarFilePath = `${workingDirectory}/${name}`
      const { orgSlug, projectSlug } = parseOrgProject(nstProjectId)
      const storagePrefix = `${orgSlug}/${projectSlug}`
      await storage
        .bucket(bucketName)
        .file(`${storagePrefix}/modules/${name}`)
        .download({ destination: tarFilePath })

      await tarExtract(tarFilePath, extractFolder)

      const nstModule = JSON.parse(
        await readFile(`${extractFolder}/nstrumentaModule.json`, 'utf-8'),
      )
      const entry = nstModule?.entry ?? 'index.html'
      const url = `https://storage.googleapis.com/${hostingBucket}/${moduleName}/${entry}`

      const hostBucket = storage.bucket(hostingBucket)
      await uploadDirectory(
        hostBucket,
        `${workingDirectory}/${moduleName}`,
        moduleName,
      )

      await firestore
        .doc(moduleDocumentPath)
        .set(
          { module: nstModule, url, lastModified: Date.now() },
          { merge: true },
        )

      await firestore
        .doc(actionPath)
        .set({ status: 'complete' }, { merge: true })
    } catch (err: any) {
      firestore
        .doc(actionPath)
        .set({ status: 'error', error: JSON.stringify(err) }, { merge: true })
      console.log(err)
    }
  }

  return {
    hostModule,
  }
}
