import crypto from 'crypto'
import { Application, Request, Response } from 'express'
import { auth } from './authentication'

const AUTH_CODE_TTL_MS = 5 * 60 * 1000
const ACCESS_TOKEN_TTL_SECONDS = 60 * 60
const STATIC_VSCODE_CLIENT_ID = 'vscode'

type AuthorizationCodeRecord = {
  apiKey: string
  projectId: string
  clientId: string
  redirectUri: string
  expiresAt: number
}

type ClientRegistration = {
  clientId: string
  redirectUris: string[]
  createdAt: number
  allowAnyAllowedRedirect?: boolean
}

const authorizationCodes = new Map<string, AuthorizationCodeRecord>()
const registeredClients = new Map<string, ClientRegistration>()

seedDefaultClients()

export function registerOAuthRoutes(app: Application) {
  app.get('/.well-known/openid-configuration', handleDiscovery)
  app.get('/oauth/authorize', handleAuthorize)
  app.post('/oauth/token', handleToken)
  app.post('/oauth/register', handleClientRegistration)
}

function handleDiscovery(req: Request, res: Response) {
  const baseUrl = getBaseUrl(req)

  res.json({
    issuer: baseUrl,
    authorization_endpoint: `${baseUrl}/oauth/authorize`,
    token_endpoint: `${baseUrl}/oauth/token`,
    registration_endpoint: `${baseUrl}/oauth/register`,
    response_types_supported: ['code'],
    grant_types_supported: ['authorization_code'],
    token_endpoint_auth_methods_supported: ['none'],
  })
}

async function handleAuthorize(req: Request, res: Response) {
  const clientId = getQueryParam(req, 'client_id')
  const redirectUri = getQueryParam(req, 'redirect_uri')
  const state = getQueryParam(req, 'state')
  const responseType = getQueryParam(req, 'response_type')

  logOAuth('authorize.request', {
    clientId,
    redirectUri,
    responseType,
    hasState: Boolean(state),
    ip: req.ip,
  })

  if (!clientId) {
    logOAuth('authorize.reject', { reason: 'missing_client_id' })
    return respondOAuthError(res, 'invalid_request', 'Missing client_id')
  }

  const clientRegistration = getClientRegistration(clientId)
  if (!clientRegistration) {
    logOAuth('authorize.reject', { reason: 'unknown_client', clientId })
    return respondOAuthError(res, 'unauthorized_client', 'Unknown client_id')
  }

  if (responseType !== 'code') {
    logOAuth('authorize.reject', {
      reason: 'unsupported_response_type',
      responseType,
    })
    return respondOAuthError(
      res,
      'unsupported_response_type',
      'Only response_type=code is supported',
    )
  }

  if (
    !redirectUri ||
    !isAllowedRedirectUri(redirectUri) ||
    (!clientRegistration.allowAnyAllowedRedirect &&
      !clientRegistration.redirectUris.includes(redirectUri))
  ) {
    logOAuth('authorize.reject', {
      reason: 'invalid_redirect',
      clientId,
      redirectUri,
    })
    return respondOAuthError(res, 'invalid_request', 'Invalid redirect_uri')
  }

  const authResult = await auth(req, res)
  if (!authResult.authenticated) {
    logOAuth('authorize.reject', {
      reason: 'unauthenticated_api_key',
      clientId,
      message: authResult.message,
    })
    return respondOAuthError(
      res,
      'access_denied',
      authResult.message || 'Authentication required',
      401,
    )
  }

  const code = generateAuthorizationCode()
  const expiresAt = Date.now() + AUTH_CODE_TTL_MS
  authorizationCodes.set(code, {
    apiKey: authResult.apiKey,
    projectId: authResult.projectId,
    clientId,
    redirectUri,
    expiresAt,
  })

  const redirectTarget = buildAuthorizeRedirect(redirectUri, code, state)
  logOAuth('authorize.success', {
    clientId,
    redirectUri,
    code,
    expiresAt,
  })
  return res.redirect(302, redirectTarget)
}

async function handleToken(req: Request, res: Response) {
  const grantType = getBodyParam(req, 'grant_type')
  const code = getBodyParam(req, 'code')
  const redirectUri = getBodyParam(req, 'redirect_uri')
  const clientId = getBodyParam(req, 'client_id')

  logOAuth('token.request', {
    grantType,
    hasCode: Boolean(code),
    redirectUri,
    clientId,
    ip: req.ip,
  })

  if (grantType !== 'authorization_code') {
    logOAuth('token.reject', {
      reason: 'unsupported_grant_type',
      grantType,
    })
    return respondOAuthError(
      res,
      'unsupported_grant_type',
      'Only authorization_code grants are supported',
    )
  }

  if (!code || !redirectUri || !clientId) {
    logOAuth('token.reject', {
      reason: 'missing_params',
      hasCode: Boolean(code),
      hasRedirect: Boolean(redirectUri),
      hasClient: Boolean(clientId),
    })
    return respondOAuthError(
      res,
      'invalid_request',
      'Missing code, client_id, or redirect_uri',
    )
  }

  const clientRegistration = getClientRegistration(clientId)
  if (!clientRegistration) {
    logOAuth('token.reject', { reason: 'unknown_client', clientId })
    return respondOAuthError(res, 'unauthorized_client', 'Unknown client_id')
  }

  pruneExpiredCodes()
  const record = authorizationCodes.get(code)

  if (!record) {
    logOAuth('token.reject', { reason: 'code_not_found', clientId })
    return respondOAuthError(res, 'invalid_grant', 'Authorization code not found')
  }

  if (record.redirectUri !== redirectUri) {
    logOAuth('token.reject', {
      reason: 'redirect_mismatch',
      redirectUri,
      expected: record.redirectUri,
    })
    return respondOAuthError(
      res,
      'invalid_grant',
      'redirect_uri does not match authorization request',
    )
  }

  if (record.expiresAt <= Date.now()) {
    authorizationCodes.delete(code)
    logOAuth('token.reject', { reason: 'code_expired', clientId })
    return respondOAuthError(res, 'invalid_grant', 'Authorization code expired')
  }

  authorizationCodes.delete(code)

  if (record.clientId !== clientId) {
    logOAuth('token.reject', {
      reason: 'client_mismatch',
      claimed: clientId,
      owner: record.clientId,
    })
    return respondOAuthError(res, 'invalid_grant', 'Client mismatch for code')
  }

  logOAuth('token.success', {
    clientId,
    projectId: record.projectId,
  })

  return res.json({
    access_token: record.apiKey,
    token_type: 'Bearer',
    expires_in: ACCESS_TOKEN_TTL_SECONDS,
    project_id: record.projectId,
  })
}

async function handleClientRegistration(req: Request, res: Response) {
  const metadata = req.body ?? {}
  const redirectUris = Array.isArray(metadata.redirect_uris)
    ? metadata.redirect_uris.filter((uri: unknown): uri is string =>
        typeof uri === 'string',
      )
    : []

  if (!redirectUris.length) {
    return respondOAuthError(
      res,
      'invalid_client_metadata',
      'redirect_uris is required',
    )
  }

  const invalidRedirect = redirectUris.find((uri: string) => {
    return !isAllowedRedirectUri(uri)
  })

  if (invalidRedirect) {
    return respondOAuthError(
      res,
      'invalid_client_metadata',
      `redirect_uri ${invalidRedirect} is not permitted`,
    )
  }

  const clientId = generateClientId()
  const createdAt = Date.now()

  registeredClients.set(clientId, {
    clientId,
    redirectUris,
    createdAt,
  })

  logOAuth('register.success', { clientId, redirectUris })

  return res.status(201).json({
    client_id: clientId,
    client_id_issued_at: Math.floor(createdAt / 1000),
    redirect_uris: redirectUris,
    token_endpoint_auth_method: 'none',
  })
}

function respondOAuthError(
  res: Response,
  error: string,
  description: string,
  status = 400,
) {
  return res.status(status).json({
    error,
    error_description: description,
  })
}

function getBaseUrl(req: Request) {
  const host = req.get('host') ?? 'localhost:5999'
  const protocol = req.protocol ?? 'http'
  return `${protocol}://${host}`
}

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key]
  if (Array.isArray(value)) {
    const first = value[0]
    return typeof first === 'string' ? first : undefined
  }
  if (typeof value === 'string') {
    return value
  }
  return undefined
}

function getBodyParam(req: Request, key: string): string | undefined {
  const value = req.body?.[key]
  if (Array.isArray(value)) {
    const first = value[0]
    return typeof first === 'string' ? first : undefined
  }
  if (typeof value === 'string') {
    return value
  }
  return undefined
}

function generateAuthorizationCode() {
  return crypto.randomBytes(24).toString('hex')
}

function generateClientId() {
  return crypto.randomBytes(16).toString('hex')
}

function getClientRegistration(clientId: string): ClientRegistration | undefined {
  const stored = registeredClients.get(clientId)
  if (stored) {
    return stored
  }

  if (clientId === STATIC_VSCODE_CLIENT_ID) {
    return registeredClients.get(STATIC_VSCODE_CLIENT_ID)
  }

  return undefined
}

function seedDefaultClients() {
  registeredClients.set(STATIC_VSCODE_CLIENT_ID, {
    clientId: STATIC_VSCODE_CLIENT_ID,
    redirectUris: ['https://vscode.dev/redirect'],
    allowAnyAllowedRedirect: true,
    createdAt: Date.now(),
  })
}

export function __resetOAuthStateForTests() {
  authorizationCodes.clear()
  registeredClients.clear()
  seedDefaultClients()
}

export function isAllowedRedirectUri(uri: string) {
  try {
    const url = new URL(uri)

    const isLocalRedirect =
      url.protocol === 'http:' &&
      url.hostname === '127.0.0.1' &&
      Boolean(url.port)

    const isVsCodeRedirect =
      url.protocol === 'https:' &&
      url.hostname === 'vscode.dev' &&
      url.pathname === '/redirect'

    return isLocalRedirect || isVsCodeRedirect
  } catch {
    return false
  }
}

export function buildAuthorizeRedirect(
  redirectUri: string,
  code: string,
  state?: string,
) {
  const url = new URL(redirectUri)
  url.searchParams.set('code', code)
  if (state) {
    url.searchParams.set('state', state)
  }

  return url.toString()
}

function pruneExpiredCodes() {
  const now = Date.now()
  for (const [code, record] of authorizationCodes.entries()) {
    if (record.expiresAt <= now) {
      authorizationCodes.delete(code)
    }
  }
}

function logOAuth(event: string, details: Record<string, unknown>) {
  try {
    console.log(`[oauth] ${event}`, details)
  } catch (error) {
    console.log('[oauth] log failure', error)
  }
}