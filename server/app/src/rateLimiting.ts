import { Request } from 'express'

function headerHasValue(value: string | string[] | undefined): boolean {
  if (typeof value === 'string') {
    return value.trim().length > 0
  }

  if (Array.isArray(value)) {
    return value.some((item) => item.trim().length > 0)
  }

  return false
}

export function isAuthenticatedRequest(req: Request): boolean {
  return (
    headerHasValue(req.headers.authorization) ||
    headerHasValue(req.headers['x-api-key'])
  )
}