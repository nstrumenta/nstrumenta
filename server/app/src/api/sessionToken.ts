import * as jwt from 'jsonwebtoken'
import { APIEndpoint, withAuth } from '../authentication'

const SESSION_SECRET = process.env.SESSION_SECRET ?? 'session-secret'

interface getTokenArgs {
  projectId: string
  allowCrossProjectApiKey?: boolean
}

interface verifyTokenArgs {
  projectId: string
  allowCrossProjectApiKey: true
}

const getTokenBase: APIEndpoint<getTokenArgs> = async (req, res, args) => {
  const { projectId } = args
  const token = jwt.sign({ projectId }, SESSION_SECRET)
  return res.status(200).send({ token })
}

export const getToken = withAuth(getTokenBase)

const verifyTokenBase: APIEndpoint<verifyTokenArgs> = async (
  req,
  res,
  args,
) => {
  const { projectId } = args
  try {
    const { token, allowCrossProjectApiKey } = req.body
    const { projectId: tokenProjectId } = jwt.verify(token, SESSION_SECRET) as {
      projectId: string
    }
    if (!allowCrossProjectApiKey && projectId !== tokenProjectId)
      throw new TypeError('wrong projectId in token')
    return res.status(200).send()
  } catch (e) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
}

export const verifyToken = withAuth(verifyTokenBase)
