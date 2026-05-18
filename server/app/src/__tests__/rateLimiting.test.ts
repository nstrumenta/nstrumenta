import { describe, expect, it } from 'vitest'
import { Request } from 'express'

import { isAuthenticatedRequest } from '../rateLimiting'

function makeRequest(headers: Record<string, string | string[] | undefined>): Request {
  return { headers } as Request
}

describe('isAuthenticatedRequest', () => {
  it('returns true for bearer-authenticated requests', () => {
    expect(
      isAuthenticatedRequest(
        makeRequest({ authorization: 'Bearer firebase-token' }),
      ),
    ).toBe(true)
  })

  it('returns true for API key-authenticated requests', () => {
    expect(
      isAuthenticatedRequest(
        makeRequest({ 'x-api-key': '0123456789abcdef0123456789abcdef0123456789abcdef' }),
      ),
    ).toBe(true)
  })

  it('returns false when authentication headers are absent', () => {
    expect(isAuthenticatedRequest(makeRequest({}))).toBe(false)
  })

  it('returns false for blank authentication headers', () => {
    expect(
      isAuthenticatedRequest(
        makeRequest({ authorization: '   ', 'x-api-key': '' }),
      ),
    ).toBe(false)
  })
})