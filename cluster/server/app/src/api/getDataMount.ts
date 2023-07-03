import { Firestore } from '@google-cloud/firestore'
import fs from 'fs'
import { APIEndpoint, withAuth } from '../authentication'

const keyfile = process.env.GOOGLE_APPLICATION_CREDENTIALS
if (keyfile == undefined)
  throw new Error('GOOGLE_APPLICATION_CREDENTIALS not set to path of keyfile')
const serviceAccount = JSON.parse(fs.readFileSync(keyfile, 'utf8'))

const firestore = new Firestore({
  projectId: serviceAccount.project_id,
  credentials: {
    client_email: serviceAccount.client_email,
    private_key: serviceAccount.private_key,
  },
})

export interface GetDataMountArgs {
  projectId: string
}

const getDataMountBase: APIEndpoint<GetDataMountArgs> = async (
  req,
  res,
  args,
) => {
  const { projectId } = args

  try {
    console.log('getDataMount', { projectId })
    const projectPath = `projects/${projectId}`
    const project = await (await firestore.doc(projectPath).get()).data()

    if (!project?.keyFile) {
      return res.status(401).send(`Failed, no keyFile in project ${projectId}`)
    }
    const bucket = project?.bucket
    return res.status(200).send({ keyFile: project.keyFile, bucket, projectId })
  } catch (error) {
    res.status(500).send(`Something went wrong`)
  }
}

export const getDataMount = withAuth(getDataMountBase)
