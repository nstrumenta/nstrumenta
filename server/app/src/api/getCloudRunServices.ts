import { writeFile } from 'fs/promises'
import { APIEndpoint, withAuth } from '../authentication'
import { serviceAccount } from '../authentication/ServiceAccount'
import { asyncSpawn } from '../shared/utils'

export interface GetCloudRunServicesArgs {
  projectId: string
}

const getCloudRunServicesBase: APIEndpoint<GetCloudRunServicesArgs> = async (
  req,
  res,
  args,
) => {
  console.log('args', args)
  const { projectId } = args
  try {
    const keyfile = './credentials.json'
    await writeFile(keyfile, JSON.stringify(serviceAccount), 'utf-8')
    await asyncSpawn(
      'gcloud',
      `auth activate-service-account --key-file ${keyfile}`.split(' '),
    )
    await asyncSpawn(
      'gcloud',
      `config set core/project ${serviceAccount.project_id}`.split(' '),
    )

    const services = await asyncSpawn(
      'gcloud',
      `run services list --format=json`.split(' '),
    )

    return res.status(200).send(JSON.stringify(services))
  } catch (error) {
    console.error(error)
    res.status(404).send(`Error fetching services`)
  }
}

export const getCloudRunServices = withAuth(getCloudRunServicesBase)
