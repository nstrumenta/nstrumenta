import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

describe('listComputeInstances', () => {
  const originalFetch = global.fetch

  afterEach(() => {
    global.fetch = originalFetch
    vi.restoreAllMocks()
  })

  it('should call the aggregatedList REST API with a bearer token', async () => {
    const mockToken = 'ya29.test-access-token'
    const mockInstances = {
      items: {
        'zones/us-central1-a': {
          instances: [
            {
              name: 'agent-1',
              status: 'RUNNING',
              machineType: 'zones/us-central1-a/machineTypes/e2-medium',
              zone: 'https://www.googleapis.com/compute/v1/projects/test/zones/us-central1-a',
            },
          ],
        },
        'zones/us-east1-b': {
          warning: { code: 'NO_RESULTS_ON_PAGE' },
        },
      },
    }

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockInstances,
    })

    const { listComputeInstances } = await import('../computeInstances.js')

    const result = await listComputeInstances('test-project', {
      getAccessToken: async () => ({ token: mockToken }),
    } as any)

    expect(global.fetch).toHaveBeenCalledOnce()
    const [url, options] = (global.fetch as any).mock.calls[0]
    expect(url).toBe(
      'https://compute.googleapis.com/compute/v1/projects/test-project/aggregated/instances'
    )
    expect(options.headers['Authorization']).toBe(`Bearer ${mockToken}`)

    expect(result).toEqual([
      {
        name: 'agent-1',
        zone: 'zones/us-central1-a',
        status: 'RUNNING',
        machineType: 'zones/us-central1-a/machineTypes/e2-medium',
      },
    ])
  })

  it('should return empty array when no instances exist', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        items: {
          'zones/us-central1-a': {
            warning: { code: 'NO_RESULTS_ON_PAGE' },
          },
        },
      }),
    })

    const { listComputeInstances } = await import('../computeInstances.js')

    const result = await listComputeInstances('test-project', {
      getAccessToken: async () => ({ token: 'tok' }),
    } as any)

    expect(result).toEqual([])
  })

  it('should throw on HTTP error', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      text: async () => 'Forbidden',
    })

    const { listComputeInstances } = await import('../computeInstances.js')

    await expect(
      listComputeInstances('test-project', {
        getAccessToken: async () => ({ token: 'tok' }),
      } as any)
    ).rejects.toThrow('Failed to list compute instances: 403 Forbidden')
  })

  it('should handle paginated responses', async () => {
    const page1 = {
      items: {
        'zones/us-central1-a': {
          instances: [{ name: 'vm-1', status: 'RUNNING', machineType: 'e2-micro', zone: 'z' }],
        },
      },
      nextPageToken: 'page2token',
    }
    const page2 = {
      items: {
        'zones/us-east1-b': {
          instances: [{ name: 'vm-2', status: 'TERMINATED', machineType: 'e2-small', zone: 'z' }],
        },
      },
    }

    let callCount = 0
    global.fetch = vi.fn().mockImplementation(async (url: string) => {
      callCount++
      return {
        ok: true,
        json: async () => (callCount === 1 ? page1 : page2),
      }
    })

    const { listComputeInstances } = await import('../computeInstances.js')

    const result = await listComputeInstances('test-project', {
      getAccessToken: async () => ({ token: 'tok' }),
    } as any)

    expect(result).toHaveLength(2)
    expect(result[0].name).toBe('vm-1')
    expect(result[1].name).toBe('vm-2')

    const secondCallUrl = (global.fetch as any).mock.calls[1][0]
    expect(secondCallUrl).toContain('pageToken=page2token')
  })
})
