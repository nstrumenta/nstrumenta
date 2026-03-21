interface ComputeInstance {
  name: string
  zone: string
  status: string
  machineType: string
}

interface AuthClient {
  getAccessToken(): Promise<{ token: string | null | undefined }>
}

export async function listComputeInstances(
  projectId: string,
  authClient: AuthClient
): Promise<ComputeInstance[]> {
  const { token } = await authClient.getAccessToken()
  const machines: ComputeInstance[] = []
  let pageToken: string | undefined

  do {
    const url = new URL(
      `https://compute.googleapis.com/compute/v1/projects/${projectId}/aggregated/instances`
    )
    if (pageToken) {
      url.searchParams.set('pageToken', pageToken)
    }

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(
        `Failed to list compute instances: ${response.status} ${errorText}`
      )
    }

    const data = (await response.json()) as { items?: Record<string, any>; nextPageToken?: string }

    for (const [zone, zoneData] of Object.entries<any>(data.items || {})) {
      for (const instance of zoneData.instances || []) {
        machines.push({
          name: instance.name,
          zone,
          status: instance.status,
          machineType: instance.machineType,
        })
      }
    }

    pageToken = data.nextPageToken
  } while (pageToken)

  return machines
}
