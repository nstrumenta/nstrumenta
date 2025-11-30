import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Request, Response } from 'express'
import crypto from 'crypto'

// Mock Firestore
const { mockGet, mockUpdate, mockDoc, mockCollection } = vi.hoisted(() => {
  const mockGet = vi.fn()
  const mockUpdate = vi.fn().mockResolvedValue({})
  const mockDoc = vi.fn(() => ({ get: mockGet, update: mockUpdate }))
  const mockCollection = vi.fn(() => ({ doc: mockDoc }))
  return { mockGet, mockUpdate, mockDoc, mockCollection }
})

vi.mock('../authentication/ServiceAccount', () => ({
  firestore: {
    collection: mockCollection,
    doc: mockDoc
  }
}))

import { auth } from '../authentication/index'

describe('Authentication V2', () => {
  let req: Partial<Request>
  let res: Partial<Response>

  beforeEach(() => {
    req = {
      headers: {}
    }
    res = {}
    vi.clearAllMocks()
    process.env.NSTRUMENTA_API_KEY_PEPPER = 'test-pepper'
  })

  it('should authenticate valid V2 key', async () => {
    const accessKeyId = '1234567890abcdef' // 16 hex
    const secretAccessKey = '1234567890abcdef1234567890abcdef' // 32 hex
    const apiKey = `${accessKeyId}${secretAccessKey}`
    const salt = 'test-salt'
    const pepper = 'test-pepper'
    const hash = crypto.scryptSync(secretAccessKey, salt + pepper, 64).toString('hex')

    req.headers = { 'x-api-key': apiKey }

    mockGet.mockResolvedValue({
      data: () => ({
        projectId: 'test-project',
        version: 'v2',
        salt,
        hash
      })
    })

    const result = await auth(req as Request, res as Response)

    expect(result.authenticated).toBe(true)
    expect((result as any).projectId).toBe('test-project')
    expect(mockCollection).toHaveBeenCalledWith('keys')
    expect(mockDoc).toHaveBeenCalledWith(accessKeyId)
  })

  it('should reject invalid V2 key secret', async () => {
    const accessKeyId = '1234567890abcdef'
    const secretAccessKey = '1234567890abcdef1234567890abcdef'
    const apiKey = `${accessKeyId}${secretAccessKey}`
    const salt = 'test-salt'
    const pepper = 'test-pepper'
    const hash = crypto.scryptSync(secretAccessKey, salt + pepper, 64).toString('hex')

    req.headers = { 'x-api-key': apiKey }

    mockGet.mockResolvedValue({
      data: () => ({
        projectId: 'test-project',
        version: 'v2',
        salt,
        hash: 'wrong-hash'
      })
    })

    const result = await auth(req as Request, res as Response)

    expect(result.authenticated).toBe(false)
    expect(result.message).toBe('invalid key')
  })
})
