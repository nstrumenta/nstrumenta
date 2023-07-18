import { v4 as uuid } from 'uuid'
import { APIEndpoint, withAuth } from '../authentication'
import { firestore } from '../authentication/ServiceAccount'

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
