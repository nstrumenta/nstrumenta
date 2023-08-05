import { Firestore } from '@google-cloud/firestore'
import { ChildProcessWithoutNullStreams } from 'child_process'
import { mkdir, readFile, readdir, rm, stat, writeFile } from 'fs/promises'
import { v4 as uuid } from 'uuid'
import { bucketName, serviceAccount } from '../authentication/ServiceAccount'
import { ActionData } from '../index'
import { Storage } from '@google-cloud/storage'
import path from 'path'

const adminServiceAccount = serviceAccount
const GCP_PROJECT = adminServiceAccount.project_id

export interface CloudAdminService {
  createServiceAccount(
    actionPath: string,
    projectId: string,
    data: ActionData,
  ): Promise<void>
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
  timeout?: number
}

export const createCloudAdminService = ({
  firestore,
  spawn,
  storage,
}: CloudAdminServiceDependencies): CloudAdminService => {
  async function asyncSpawn(
    cmd: string,
    args?: string[],
    options?: { cwd?: string },
    errCB?: (code: number) => void,
  ) {
    console.log(`spawn [${cmd} ${args?.join(' ')}]`)
    const process = spawn(cmd, args || [], options)

    let output = ''
    for await (const chunk of process.stdout) {
      output += chunk
    }
    let error = ''
    for await (const chunk of process.stderr) {
      error += chunk
    }
    const code: number = await new Promise((resolve) => {
      process.on('close', resolve)
    })
    if (code) {
      if (errCB) {
        errCB(code)
      }

      throw new Error(`spawned process ${cmd} error code ${code}, ${error}`)
    }

    console.log(`spawn ${cmd} output ${output}`)
    return output
  }

  function uniqueName(id: string): string {
    // returns a unique name less than 30 chars
    // appends part of a uuid to a name, not exceeding 20 chars from the prefix
    return `${GCP_PROJECT.split('-')[0]}-${id.slice(0, 20)}-${uuid().replaceAll(
      '-',
      '',
    )}`
      .slice(0, 30)
      .toLowerCase()
  }

  async function hostModule(
    actionPath: string,
    projectId: string,
    data: ActionData,
  ) {
    console.log({ projectId }, 'hostModule')
    try {
      //mark action as started
      await firestore
        .doc(actionPath)
        .set({ status: 'started' }, { merge: true })

      // check if we need to make a bucket
      const projectData = (
        await firestore.doc(`/projects/${projectId}`).get()
      ).data()

      let hostingBucket = projectData?.hostingBucket

      if (hostingBucket != undefined) {
        console.log(`hosting bucket ${hostingBucket} exists on ${projectId}`)
      } else {
        // mark action as started
        const hostingBucket = uniqueName(projectId)
        await firestore
          .doc(actionPath)
          .set({ status: 'started' }, { merge: true })
        const adminKeyFilePath = './credentials.json'
        process.env['GOOGLE_APPLICATION_CREDENTIALS'] = adminKeyFilePath
        await writeFile(
          adminKeyFilePath,
          JSON.stringify(serviceAccount),
          'utf-8',
        )
        await asyncSpawn(
          'gcloud',
          `auth activate-service-account --key-file ${adminKeyFilePath}`.split(
            ' ',
          ),
        )
        await asyncSpawn(
          'gcloud',
          `config set core/project ${serviceAccount.project_id}`.split(' '),
        )
        const region = projectData?.region ?? 'europe-west3'
        await asyncSpawn('gcloud', `config set run/region ${region}`.split(' '))
        await asyncSpawn(
          'gcloud',
          `storage buckets create gs://${hostingBucket} --default-storage-class=standard --uniform-bucket-level-access`.split(
            ' ',
          ),
        )
        await asyncSpawn(
          'gcloud',
          `storage buckets add-iam-policy-binding gs://${hostingBucket} --member=allUsers --role=roles/storage.objectViewer`.split(
            ' ',
          ),
        )

        await firestore
          .doc(`/projects/${projectId}`)
          .set({ hostingBucket }, { merge: true })

        //set cors on the bucket
        await asyncSpawn(
          'gcloud',
          `storage buckets update gs://${hostingBucket} --cors-file=./src/cors.json`.split(
            ' ',
          ),
        )
      }

      // get module / untar / upload
      console.log(data)
      const modulePath = data.data.module.filePath
      const moduleDocumentPath = `projects/${projectId}/modules/${modulePath}`
      const moduleName = modulePath.replace('.tar.gz', '')
      const workingDirectory = `${__dirname}/temp/modules`
      const extractFolder = `${workingDirectory}/${moduleName}`
      await mkdir(extractFolder, { recursive: true })
      const tarFilePath = `${workingDirectory}/${modulePath}`
      await storage
        .bucket(bucketName)
        .file(`projects/${projectId}/modules/${modulePath}`)
        .download({ destination: tarFilePath })

      await asyncSpawn('tar', ['-zxvf', tarFilePath], {
        cwd: extractFolder,
      })

      const nstModule = JSON.parse(
        await readFile(`${extractFolder}/nstrumentaModule.json`, 'utf-8'),
      )
      const entry = nstModule?.entry ?? 'index.html'
      const url = `https://storage.googleapis.com/${hostingBucket}/${moduleName}/${entry}`

      await asyncSpawn(
        'gsutil',
        `-m cp -r ${moduleName} gs://${hostingBucket}/${moduleName}`.split(' '),
        {
          cwd: workingDirectory,
        },
      )

      await firestore
        .doc(moduleDocumentPath)
        .set(
          { module: nstModule, url, lastModified: Date.now() },
          { merge: true },
        )

      //mark action as complete
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

  async function createServiceAccount(actionPath: string, projectId: string) {
    console.log({ projectId })

    if (
      (await firestore.doc(`/projects/${projectId}`).get()).data()?.keyFile !=
      undefined
    ) {
      console.log(`keyFile already exists on ${projectId}`)
    } else {
      const nonAdminServiceAccount = uniqueName(projectId)
      const keyfileName = `${nonAdminServiceAccount}.json`
      const bucketName = `${GCP_PROJECT}.appspot.com`
      // mark action as started
      await firestore
        .doc(actionPath)
        .set({ status: 'started' }, { merge: true })
      const adminKeyFilePath = './credentials.json'
      process.env['GOOGLE_APPLICATION_CREDENTIALS'] = adminKeyFilePath
      await writeFile(adminKeyFilePath, JSON.stringify(serviceAccount), 'utf-8')
      await asyncSpawn(
        'gcloud',
        `auth activate-service-account --key-file ${adminKeyFilePath}`.split(
          ' ',
        ),
      )
      await asyncSpawn(
        'gcloud',
        `iam service-accounts create ${nonAdminServiceAccount} --project ${GCP_PROJECT}`.split(
          ' ',
        ),
      )

      await asyncSpawn(
        'gcloud',
        `iam service-accounts keys create ${keyfileName} --iam-account ${nonAdminServiceAccount}@${GCP_PROJECT}.iam.gserviceaccount.com --project ${GCP_PROJECT}`.split(
          ' ',
        ),
      )
      const keyFile = await readFile(keyfileName, 'utf-8')
      await rm(keyfileName)
      await firestore
        .doc(`/projects/${projectId}`)
        .set({ keyFile }, { merge: true })

      // TODO cloud function should only be deployed once per bucket
      // upload cloud function zip (built in nstrumenta/cluster/functions)
      await asyncSpawn(
        'gcloud',
        `storage cp /app/functionZip/storageObjectFinalizeFunction.zip gs://${bucketName}/functionZip/storageObjectFinalizeFunction.zip`.split(
          ' ',
        ),
      )

      // deploy cloud function
      const adminCredentialsForCloudFunction = btoa(
        JSON.stringify({
          project_id: adminServiceAccount.project_id,
          client_email: adminServiceAccount.client_email,
          private_key: adminServiceAccount.private_key,
        }),
      )
      await asyncSpawn(
        'gcloud',
        `functions deploy ${nonAdminServiceAccount} --entry-point storageObjectFinalize --runtime nodejs16 --trigger-resource gs://${bucketName} --trigger-event google.storage.object.finalize --project=${GCP_PROJECT} --source gs://${bucketName}/functionZip/storageObjectFinalizeFunction.zip --set-env-vars SERVICE_ACCOUNT_CREDENTIALS=${adminCredentialsForCloudFunction}`.split(
          ' ',
        ),
      )

      //set cors on the bucket
      await asyncSpawn(
        'gcloud',
        `storage buckets update gs://${bucketName} --cors-file=./src/cors.json`.split(
          ' ',
        ),
      )

      // set access to the bucket for the new serviceAccount
      await asyncSpawn(
        'gsutil',
        `iam ch serviceAccount:${nonAdminServiceAccount}@${GCP_PROJECT}.iam.gserviceaccount.com:legacyBucketWriter gs://${bucketName}`.split(
          ' ',
        ),
      )
    }
    //mark action as complete
    await firestore.doc(actionPath).set({ status: 'complete' }, { merge: true })
  }

  return {
    createServiceAccount,
    hostModule,
  }
}
