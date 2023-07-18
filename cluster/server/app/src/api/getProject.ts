import { APIEndpoint, withAuth } from '../authentication'
import { firestore } from '../authentication/ServiceAccount'

const getProjectBase: APIEndpoint<{
  projectId: string
}> = async (req, res, args) => {
  const { projectId } = args

  try {
    console.log('getProject', { projectId })
    const projectPath = `projects/${projectId}`
    const project = await (await firestore.doc(projectPath).get()).data()

    const { keyFile, apiKeys, ...projectWithoutKeys } = project as {
      keyFile: unknown
      apiKeys: unknown
      [key: string]: any
    }

    return res.status(200).send(projectWithoutKeys)
  } catch (error) {
    res.status(500).send(`Something went wrong`)
  }
}

export const getProject = withAuth(getProjectBase)
