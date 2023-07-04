import { Firestore } from '@google-cloud/firestore'
import { uuid4 } from '@temporalio/workflow'
import { ChildProcessWithoutNullStreams } from 'child_process'
import { ActionData } from '../index'
import { readFile, rm, writeFile } from 'fs/promises'

const GCP_PROJECT = 'macro-coil-194519'

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
      const serviceAccount = `${projectId.slice(0, 20)}-${uuid4().replaceAll(
        '-',
        '',
      )}`
        .slice(0, 30)
        .toLowerCase()
      const keyfileName = `${serviceAccount}.json`
      const bucketName = serviceAccount
      // mark action as started
      await firestore
        .doc(actionPath)
        .set({ status: 'started' }, { merge: true })
      await asyncSpawn(
        'gcloud',
        `iam service-accounts create ${serviceAccount} --project ${GCP_PROJECT}`.split(
          ' ',
        ),
      )

      await asyncSpawn(
        'gcloud',
        `iam service-accounts keys create ${keyfileName} --iam-account ${serviceAccount}@${GCP_PROJECT}.iam.gserviceaccount.com --project ${GCP_PROJECT}`.split(
          ' ',
        ),
      )
      const keyFile = await readFile(keyfileName, 'utf-8')
      await rm(keyfileName)
      await firestore
        .doc(`/projects/${projectId}`)
        .set({ keyFile, bucket: bucketName }, { merge: true })

      await asyncSpawn(
        'gsutil',
        `mb -p ${GCP_PROJECT} -c regional -l us-west1 gs://${bucketName}`.split(
          ' ',
        ),
      )

      await asyncSpawn(
        'gsutil',
        `iam ch serviceAccount:${serviceAccount}@${GCP_PROJECT}.iam.gserviceaccount.com:legacyBucketWriter gs://${bucketName}`.split(
          ' ',
        ),
      )
      //deploy cloud function
      await asyncSpawn(
        'gcloud',
        `functions deploy ${serviceAccount} --entry-point storageObjectFinalize --runtime nodejs16 --trigger-resource gs://${bucketName} --trigger-event google.storage.object.finalize --project=${GCP_PROJECT} --source gs://nstrumenta-dev.appspot.com/functions/storageObjectFinalize-function-source.zip`.split(
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