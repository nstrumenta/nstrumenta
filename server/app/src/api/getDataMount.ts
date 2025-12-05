import { APIEndpoint, withAuth } from '../authentication'
import { bucketName } from '../authentication/ServiceAccount'





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

    return res.status(200).send({ bucket: bucketName, projectId })
  } catch (error) {
    res.status(500).send(`Something went wrong`)
  }
}

export const getDataMount = withAuth(getDataMountBase)
