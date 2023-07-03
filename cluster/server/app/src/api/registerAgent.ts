import { Firestore, FieldValue, QuerySnapshot } from '@google-cloud/firestore'
import fs from 'fs'
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

export interface RegisterAgentArgs {
  projectId: string
}

export interface RegisterAgentBody {
  tag?: string
}

interface TagAgentArgs {
  projectId: string
  agentId: string
  tag: string
}

const tagAgent = async ({ projectId, agentId, tag }: TagAgentArgs) => {
  const projectAgentsPath = `/projects/${projectId}/agents`
  const querySnapshot: QuerySnapshot = await firestore
    .collection(projectAgentsPath)
    .where('tag', '==', tag)
    .get()

  // First, we'll clear this tag from all other agents in the project
  try {
    const promises = querySnapshot.docs.map((doc) => {
      return doc.ref.update({ tag: '' })
    })
    const res = await Promise.all(promises)
  } catch (error) {
    console.log((error as Error).message)
  }

  // Then update the one we want to tag
  await firestore.collection(projectAgentsPath).doc(agentId).update({ tag })
}

const registerAgentBase: APIEndpoint<RegisterAgentArgs> = async (
  req,
  res,
  args,
) => {
  console.log('args', args)
  const { projectId } = args
  const { tag } = req.body
  try {
    const projectPath = `/projects/${projectId}`
    const project = await (await firestore.doc(projectPath).get()).data()
    const backplaneUrl = project?.backplaneUrl

    const agentDoc = {
      projectId,
      backplaneUrl,
      createdAt: Date.now(),
    }

    const projectAgentsPath = `${projectPath}/agents`
    const documentReference = await firestore
      .collection(projectAgentsPath)
      .add(agentDoc)
    const agentId = documentReference.id
    const actionsCollectionPath = `${projectAgentsPath}/${agentId}/actions`

    if (Boolean(tag)) {
      await tagAgent({ projectId, agentId, tag })
    }

    return res
      .status(200)
      .send({ agentId, backplaneUrl, actionsCollectionPath })
  } catch (error) {
    console.error(error)
    res.status(404).send(`Error fetching hosts`)
  }
}

export const registerAgent = withAuth(registerAgentBase)
