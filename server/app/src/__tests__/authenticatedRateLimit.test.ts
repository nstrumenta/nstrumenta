import { describe, expect, it } from 'vitest'

import {
  consumeAuthenticatedRateLimit,
  firebaseRateLimitIdentity,
  projectRateLimitIdentity,
} from '../rateLimit'

describe('authenticated rate limiting', () => {
  it('tracks firebase users independently from project identities', () => {
    const now = Date.now()

    const firebaseResult = consumeAuthenticatedRateLimit(firebaseRateLimitIdentity('user-1'), now)
    const projectResult = consumeAuthenticatedRateLimit(projectRateLimitIdentity('org/project'), now)

    expect(firebaseResult.allowed).toBe(true)
    expect(projectResult.allowed).toBe(true)
    expect(firebaseResult.remaining).toBe(projectResult.remaining)
  })

  it('resets an identity after the window expires', () => {
    const now = Date.now()
    const identity = firebaseRateLimitIdentity('user-reset')

    const first = consumeAuthenticatedRateLimit(identity, now)
    const second = consumeAuthenticatedRateLimit(identity, first.resetAt + 1)

    expect(first.allowed).toBe(true)
    expect(second.allowed).toBe(true)
    expect(second.remaining).toBe(first.remaining)
  })
})