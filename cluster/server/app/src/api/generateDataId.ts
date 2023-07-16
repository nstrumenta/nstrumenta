import { Firestore } from '@google-cloud/firestore'
import fs from 'fs'
import { randomUUID } from 'node:crypto'
import { APIEndpoint, withAuth } from '../authentication'





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
