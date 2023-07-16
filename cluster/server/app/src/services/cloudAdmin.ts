import { Firestore } from '@google-cloud/firestore'
import { uuid4 } from '@temporalio/workflow'
import { ChildProcessWithoutNullStreams } from 'child_process'
import { ActionData } from '../index'
import { readFile, rm, writeFile } from 'fs/promises'
import { readFileSync } from 'fs'
import { serviceAccount } from '../authentication/ServiceAccount'

const adminServiceAccount = serviceAccount
const GCP_PROJECT = adminServiceAccount.project_id

export interface CloudAdminService {
  createServiceAccount(
    actionPath: string,
    projectId: string,
    data: ActionData,
  ): Promise<void>
}

export interface CloudAdminServiceDependencies {
  firestore: Firestore
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

  async function createServiceAccount(
    actionPath: string,
    projectId: string,
    data: ActionData,
  ) {
    console.log({ projectId })

    if (
      (await firestore.doc(`/projects/${projectId}`).get()).data()?.keyFile !=
      undefined
    ) {
      console.log(`keyFile already exists on ${projectId}`)
    } else {
      const nonAdminServiceAccount = `${projectId.slice(
        0,
        20,
      )}-${uuid4().replaceAll('-', '')}`
        .slice(0, 30)
        .toLowerCase()
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
        .set({ keyFile, bucket: bucketName }, { merge: true })

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
  }
}
