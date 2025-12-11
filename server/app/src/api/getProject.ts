import { APIEndpoint, withAuth } from '../authentication'
import { firestore } from '../authentication/ServiceAccount'

export async function getProjectInfo(projectId: string) {
  const projectPath = `projects/${projectId}`
  const project = await (await firestore.doc(projectPath).get()).data()
  
  if (!project) {
    throw new Error(`Project ${projectId} not found`)
  }

  const { keyFile, apiKeys, ...projectWithoutKeys } = project as {
    keyFile: unknown
    apiKeys: unknown
    [key: string]: any
  }

  return { id: projectId, ...projectWithoutKeys }
}

const getProjectBase: APIEndpoint<{
  projectId: string
}> = async (req, res, args) => {
  const { projectId } = args

  try {
    console.log('getProject', { projectId })
    const info = await getProjectInfo(projectId)
    return res.status(200).send(info)
  } catch (error) {
    res.status(500).send(`Something went wrong`)
  }
}

export const getProject = withAuth(getProjectBase)
