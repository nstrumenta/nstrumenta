import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { generateV4UploadSignedUrl } from '../utils'

// Mock dependencies
const mockFile = {
  exists: vi.fn(),
  getSignedUrl: vi.fn(),
  generateSignedPostPolicyV4: vi.fn(),
}

const mockBucket = {
  file: vi.fn(() => mockFile),
}

const mockStorage = {
  bucket: vi.fn(() => mockBucket),
}

// Mock ServiceAccount
vi.mock('../../authentication/ServiceAccount', () => ({
  storage: mockStorage,
  bucketName: 'test-bucket',
}))

describe('generateV4UploadSignedUrl', () => {
  const mockFetch = vi.fn()
  const originalFetch = global.fetch

  beforeEach(() => {
    global.fetch = mockFetch
    mockFile.exists.mockResolvedValue([false])
    mockFile.getSignedUrl.mockResolvedValue(['https://signed-url.com'])
    mockFetch.mockResolvedValue({
      ok: true,
      headers: {
        get: () => 'https://resumable-session-url.com',
      },
    })
    
    vi.clearAllMocks()
  })

  afterEach(() => {
    global.fetch = originalFetch
  })

  it('should generate signed URL with default content type', async () => {
    const url = await generateV4UploadSignedUrl('test.txt')

    expect(mockFile.getSignedUrl).toHaveBeenCalledWith(
      expect.objectContaining({
        contentType: 'application/octet-stream',
      })
    )
    expect(url).toBe('https://resumable-session-url.com')
  })

  it('should respect provided content type', async () => {
    await generateV4UploadSignedUrl(
      'test.jpg',
      undefined,
      undefined,
      false,
      'image/jpeg'
    )

    expect(mockFile.getSignedUrl).toHaveBeenCalledWith(
      expect.objectContaining({
        contentType: 'image/jpeg',
      })
    )
  })

  it('should pull content type from metadata', async () => {
    await generateV4UploadSignedUrl('test.png', {
      contentType: 'image/png',
      customKey: 'customValue',
    })

    // Should use the type from metadata
    expect(mockFile.getSignedUrl).toHaveBeenCalledWith(
      expect.objectContaining({
        contentType: 'image/png',
      })
    )
    
    // Should pass other metadata as extension headers
    expect(mockFile.getSignedUrl).toHaveBeenCalledWith(
      expect.objectContaining({
        extensionHeaders: {
          'x-goog-meta-customKey': 'customValue',
        },
      })
    )
  })

  it('should set Content-Disposition header when provided', async () => {
    const disposition = 'attachment; filename="test.pdf"'
    await generateV4UploadSignedUrl(
      'test.pdf',
      undefined,
      undefined,
      false,
      'application/pdf',
      disposition
    )

    // Verify it was passed in the fetch headers for session initiation
    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          'Content-Disposition': disposition,
        }),
      })
    )
  })

  it('should pull content disposition from metadata', async () => {
    const disposition = 'attachment; filename="data.json"'
    await generateV4UploadSignedUrl('data.json', {
      contentDisposition: disposition,
    })

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          'Content-Disposition': disposition,
        }),
      })
    )
  })

  it('should handle existing files overwrite flag', async () => {
    mockFile.exists.mockResolvedValue([true])

    // Should throw if overwrite is false/undefined
    await expect(generateV4UploadSignedUrl('exists.txt')).rejects.toThrow(
      'file exists'
    )

    // Should proceed if overwrite is true
    await expect(
      generateV4UploadSignedUrl('exists.txt', undefined, undefined, true)
    ).resolves.toBeDefined()
  })
})
