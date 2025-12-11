import { AddressInfo } from 'net'
import express from 'express'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  __resetOAuthStateForTests,
  buildAuthorizeRedirect,
  isAllowedRedirectUri,
  registerOAuthRoutes,
} from './oauth'

vi.mock('./authentication', () => ({
  auth: vi.fn(async () => ({
    authenticated: true,
    projectId: 'projects/test-project',
    apiKey: 'key-id:key-secret',
  })),
}))

async function withOAuthServer(
  testFn: (baseUrl: string) => Promise<void>,
): Promise<void> {
  const app = express()
  app.use(express.json())
  app.use(express.urlencoded({ extended: true }))

  // Mock limiters
  const mockLimiter = (req: any, res: any, next: any) => next()

  registerOAuthRoutes(app, mockLimiter, mockLimiter, mockLimiter)

  const server = await new Promise<ReturnType<typeof app.listen>>((resolve) =>
    resolve(app.listen(0)),
  )

  const address = server.address() as AddressInfo
  const baseUrl = `http://127.0.0.1:${address.port}`

  try {
    await testFn(baseUrl)
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((err) => {
        if (err) reject(err)
        else resolve()
      })
    })
  }
}

describe('oauth helpers', () => {
  it('allows 127.0.0.1 loopback redirects with port', () => {
    expect(isAllowedRedirectUri('http://127.0.0.1:12345/callback')).toBe(true)
  })

  it('allows vscode.dev redirect endpoint', () => {
    expect(isAllowedRedirectUri('https://vscode.dev/redirect')).toBe(true)
  })

  it('rejects non-loopback redirects', () => {
    expect(isAllowedRedirectUri('http://localhost:3000/callback')).toBe(false)
  })

  it('builds authorize redirect preserving state and params', () => {
    const result = buildAuthorizeRedirect(
      'http://127.0.0.1:3000/callback?existing=value',
      'abc123',
      'state123',
    )

    expect(result).toContain('code=abc123')
    expect(result).toContain('state=state123')
    expect(result).toContain('existing=value')
  })
})

describe('oauth endpoints', () => {
  beforeEach(() => {
    __resetOAuthStateForTests()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('publishes registration endpoint in discovery', async () => {
    await withOAuthServer(async (baseUrl) => {
      const response = await fetch(
        `${baseUrl}/.well-known/openid-configuration`,
      )
      expect(response.status).toBe(200)
      const payload = (await response.json()) as {
        registration_endpoint: string
      }
      expect(payload.registration_endpoint).toBe(
        `${baseUrl}/oauth/register`,
      )
    })
  })

  it('registers a client and completes the auth code exchange', async () => {
    await withOAuthServer(async (baseUrl) => {
      const redirectUri = 'http://127.0.0.1:45678/callback'

      const registerResponse = await fetch(`${baseUrl}/oauth/register`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          redirect_uris: [redirectUri],
          client_name: 'vitest-client',
        }),
      })

      expect(registerResponse.status).toBe(201)
      const registration = (await registerResponse.json()) as {
        client_id: string
      }
      expect(registration.client_id).toBeTruthy()

      const authorizeResponse = await fetch(
        `${baseUrl}/oauth/authorize?client_id=${registration.client_id}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&state=test-state`,
        {
          headers: { 'X-Api-Key': 'key-id:key-secret' },
          redirect: 'manual',
        },
      )

      expect(authorizeResponse.status).toBe(302)
      const location = authorizeResponse.headers.get('location')
      expect(location).toBeTruthy()
      const code = new URL(location ?? '', 'http://127.0.0.1').searchParams.get(
        'code',
      )
      expect(code).toBeTruthy()

      const tokenResponse = await fetch(`${baseUrl}/oauth/token`, {
        method: 'POST',
        headers: {
          'content-type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code: code ?? '',
          redirect_uri: redirectUri,
          client_id: registration.client_id,
        }).toString(),
      })

      expect(tokenResponse.status).toBe(200)
      const tokenPayload = (await tokenResponse.json()) as {
        access_token: string
        token_type: string
        project_id: string
      }
      expect(tokenPayload.access_token).toBe('key-id:key-secret')
      expect(tokenPayload.token_type).toBe('Bearer')
      expect(tokenPayload.project_id).toBe('projects/test-project')
    })
  })
})
