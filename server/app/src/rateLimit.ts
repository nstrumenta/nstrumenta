import { Response } from 'express'
import rateLimit from 'express-rate-limit'

const WINDOW_MS = 15 * 60 * 1000
const AUTHENTICATED_MAX = 1000

type AuthenticatedRateLimitState = {
  count: number
  resetAt: number
}

const authenticatedRateLimitStates = new Map<string, AuthenticatedRateLimitState>()
let authenticatedRateLimitChecks = 0

function setRateLimitHeader(res: Response, name: string, value: string) {
  if (typeof res.setHeader === 'function') {
    res.setHeader(name, value)
    return
  }

  if (typeof res.set === 'function') {
    res.set(name, value)
  }
}

function cleanupExpiredAuthenticatedRateLimits(now: number) {
  for (const [identity, state] of authenticatedRateLimitStates.entries()) {
    if (state.resetAt <= now) {
      authenticatedRateLimitStates.delete(identity)
    }
  }
}

export const publicIpLimiter = rateLimit({
  windowMs: WINDOW_MS,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === 'OPTIONS',
})

export function consumeAuthenticatedRateLimit(identity: string, now = Date.now()) {
  authenticatedRateLimitChecks += 1
  if (authenticatedRateLimitChecks % 100 === 0) {
    cleanupExpiredAuthenticatedRateLimits(now)
  }

  const existingState = authenticatedRateLimitStates.get(identity)
  if (!existingState || existingState.resetAt <= now) {
    const state = {
      count: 1,
      resetAt: now + WINDOW_MS,
    }
    authenticatedRateLimitStates.set(identity, state)
    return {
      allowed: true,
      limit: AUTHENTICATED_MAX,
      remaining: AUTHENTICATED_MAX - state.count,
      resetAt: state.resetAt,
    }
  }

  if (existingState.count >= AUTHENTICATED_MAX) {
    return {
      allowed: false,
      limit: AUTHENTICATED_MAX,
      remaining: 0,
      resetAt: existingState.resetAt,
    }
  }

  existingState.count += 1
  return {
    allowed: true,
    limit: AUTHENTICATED_MAX,
    remaining: AUTHENTICATED_MAX - existingState.count,
    resetAt: existingState.resetAt,
  }
}

export function applyAuthenticatedRateLimit(res: Response, identity: string, now = Date.now()): boolean {
  const result = consumeAuthenticatedRateLimit(identity, now)
  const resetInSeconds = Math.max(0, Math.ceil((result.resetAt - now) / 1000))

  setRateLimitHeader(res, 'RateLimit-Limit', String(result.limit))
  setRateLimitHeader(res, 'RateLimit-Remaining', String(result.remaining))
  setRateLimitHeader(res, 'RateLimit-Reset', String(resetInSeconds))

  if (result.allowed) {
    return true
  }

  setRateLimitHeader(res, 'Retry-After', String(resetInSeconds))
  res.status(429).json({ message: 'Too many requests' })
  return false
}

export function firebaseRateLimitIdentity(userId: string): string {
  return `firebase:${userId}`
}

export function projectRateLimitIdentity(projectId: string): string {
  return `project:${projectId}`
}