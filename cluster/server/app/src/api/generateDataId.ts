import { Firestore } from '@google-cloud/firestore'
import fs from 'fs'
import { randomUUID } from 'node:crypto'
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

export interface GenerateDataIdArgs {
  projectId: string
}

export interface GenerateDataIdBody {
  startTime?: number
  endTime?: number
}

const generateDataIdBase: APIEndpoint<GenerateDataIdArgs> = async (
  req,
  res,
  args,
) => {
  try {
    const id = randomUUID()

    return res.status(200).send({ dataId: id })
  } catch (error) {
    console.error(error)
    res.status(404).send(`Error generating dataId: ${(error as Error).message}`)
  }
}

export const generateDataId = withAuth(generateDataIdBase)
