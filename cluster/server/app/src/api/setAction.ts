import { Firestore } from '@google-cloud/firestore'
import fs from 'fs'
import { v4 as uuid } from 'uuid'
import { APIEndpoint, withAuth } from '../authentication'

const keyfile = process.env.GOOGLE_APPLICATION_CREDENTIALS
if (keyfile == undefined)
  throw new Error('GOOGLE_APPLICATION_CREDENTIALS not set to path of keyfile')
const serviceAccount = JSON.parse(fs.readFileSync(keyfile, 'utf8'))
// @ts-ignore
const firestore = new Firestore({
  projectId: serviceAccount.project_id,
  credentials: {
    client_email: serviceAccount.client_email,
    private_key: serviceAccount.private_key,
  },
})

export interface SetActionArgs {
  projectId: string
}

const setActionBase: APIEndpoint<SetActionArgs> = async (req, res, args) => {
  const { projectId } = args
  const { action } = req.body
  try {
    const actionPath = `projects/${projectId}/actions`
    const actionId = uuid()
    await firestore
      .collection(actionPath)
      .doc(actionId)
      .create({ createdAt: Date.now(), lastModified: Date.now(), ...action })

    return res.status(200).send(actionId)
  } catch (error) {
    res.status(500).send(`Something went wrong: ${(error as Error).message}`)
  }
}

export const setAction = withAuth(setActionBase)
