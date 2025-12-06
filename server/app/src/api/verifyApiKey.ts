import { APIEndpoint, withAuth } from '../authentication'

const verifyApiKeyBase: APIEndpoint<{}> = async (req, res, args) => {
  const { projectId } = args
  try {
    return res.status(200).send(projectId)
  } catch (error) {
    res.status(500).send(`Something went wrong`)
  }
}

export const verifyApiKey = withAuth(verifyApiKeyBase)
