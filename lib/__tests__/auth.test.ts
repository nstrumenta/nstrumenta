import { describe, it, mock } from 'node:test';
import assert from 'node:assert';
import crypto from 'crypto';
import { validateApiKey } from '../auth.ts';

describe('Auth Utilities', () => {
  describe('validateApiKey', () => {
    it('should reject empty API key', async () => {
      const mockFirestore = {};
      
      const result = await validateApiKey('', mockFirestore);
      
      assert.strictEqual(result.authenticated, false);
      assert.strictEqual(result.message, 'missing key');
      assert.strictEqual(result.projectId, '');
    });

    it('should reject API key with invalid format (too short)', async () => {
      const mockFirestore = {};
      
      const result = await validateApiKey('tooshort:url', mockFirestore);
      
      assert.strictEqual(result.authenticated, false);
      assert.strictEqual(result.message, 'invalid key format');
    });

    it('should reject API key with invalid format (non-hex)', async () => {
      const mockFirestore = {};
      const invalidKey = 'g'.repeat(48) + ':url'; // non-hex characters
      
      const result = await validateApiKey(invalidKey, mockFirestore);
      
      assert.strictEqual(result.authenticated, false);
      assert.strictEqual(result.message, 'invalid key format');
    });

    it('should reject API key if document does not exist', async () => {
      const validKey = 'a'.repeat(48) + ':url';
      const mockFirestore = {
        collection: mock.fn(() => ({
          doc: mock.fn(() => ({
            get: mock.fn(async () => ({
              data: () => undefined
            }))
          }))
        }))
      };
      
      const result = await validateApiKey(validKey, mockFirestore);
      
      assert.strictEqual(result.authenticated, false);
      assert.strictEqual(result.message, 'invalid key');
    });

    it('should reject API key with invalid version', async () => {
      const validKey = 'a'.repeat(48) + ':url';
      const mockFirestore = {
        collection: mock.fn(() => ({
          doc: mock.fn(() => ({
            get: mock.fn(async () => ({
              data: () => ({ version: 'v1', projectId: 'test-project' })
            }))
          }))
        }))
      };
      
      const result = await validateApiKey(validKey, mockFirestore);
      
      assert.strictEqual(result.authenticated, false);
      assert.strictEqual(result.message, 'invalid key version');
    });

    it('should validate correct API key and return projectId', async () => {
      const docId = 'a'.repeat(16);
      const secretAccessKey = 'b'.repeat(32);
      const validKey = docId + secretAccessKey + ':url';
      
      const salt = 'test-salt';
      const pepper = process.env.NSTRUMENTA_API_KEY_PEPPER || '';
      const expectedHash = crypto.scryptSync(secretAccessKey, salt + pepper, 64).toString('hex');
      
      const mockUpdate = mock.fn(async () => {});
      const mockFirestore = {
        collection: mock.fn(() => ({
          doc: mock.fn(() => ({
            get: mock.fn(async () => ({
              data: () => ({
                version: 'v2',
                salt: salt,
                hash: expectedHash,
                projectId: 'test-project-123'
              })
            }))
          }))
        })),
        doc: mock.fn(() => ({
          update: mockUpdate
        }))
      };
      
      const result = await validateApiKey(validKey, mockFirestore);
      
      assert.strictEqual(result.authenticated, true);
      assert.strictEqual(result.projectId, 'test-project-123');
      
      // Verify lastUsed timestamp was updated
      await new Promise(resolve => setTimeout(resolve, 10));
      assert.strictEqual((mockUpdate as any).mock.calls.length, 1);
    });

    it('should reject API key with incorrect hash', async () => {
      const docId = 'a'.repeat(16);
      const secretAccessKey = 'b'.repeat(32);
      const validKey = docId + secretAccessKey + ':url';
      
      const mockFirestore = {
        collection: mock.fn(() => ({
          doc: mock.fn(() => ({
            get: mock.fn(async () => ({
              data: () => ({
                version: 'v2',
                salt: 'test-salt',
                hash: 'wrong-hash',
                projectId: 'test-project'
              })
            }))
          }))
        }))
      };
      
      const result = await validateApiKey(validKey, mockFirestore);
      
      assert.strictEqual(result.authenticated, false);
      assert.strictEqual(result.message, 'invalid key');
    });

    it('should handle errors gracefully', async () => {
      const validKey = 'a'.repeat(48) + ':url';
      const mockFirestore = {
        collection: mock.fn(() => ({
          doc: mock.fn(() => ({
            get: mock.fn(async () => {
              throw new Error('Database error');
            })
          }))
        }))
      };
      
      const result = await validateApiKey(validKey, mockFirestore);
      
      assert.strictEqual(result.authenticated, false);
      assert.strictEqual(result.message, 'error');
    });

    it('should extract correct docId from API key', async () => {
      const docId = '0123456789abcdef';
      const secretAccessKey = 'c'.repeat(32);
      const validKey = docId + secretAccessKey + ':url';
      
      let capturedDocId: string | undefined;
      const mockFirestore = {
        collection: mock.fn(() => ({
          doc: mock.fn((id: string) => {
            capturedDocId = id;
            return {
              get: mock.fn(async () => ({
                data: () => undefined
              }))
            };
          })
        }))
      };
      
      await validateApiKey(validKey, mockFirestore);
      
      assert.strictEqual(capturedDocId, docId);
    });

    it('should handle lastUsed update failure gracefully', async () => {
      const docId = 'a'.repeat(16);
      const secretAccessKey = 'b'.repeat(32);
      const validKey = docId + secretAccessKey + ':url';
      
      const salt = 'test-salt';
      const pepper = process.env.NSTRUMENTA_API_KEY_PEPPER || '';
      const expectedHash = crypto.scryptSync(secretAccessKey, salt + pepper, 64).toString('hex');
      
      const mockUpdate = mock.fn(async () => {
        throw new Error('Update failed');
      });
      const mockFirestore = {
        collection: mock.fn(() => ({
          doc: mock.fn(() => ({
            get: mock.fn(async () => ({
              data: () => ({
                version: 'v2',
                salt: salt,
                hash: expectedHash,
                projectId: 'test-project-123'
              })
            }))
          }))
        })),
        doc: mock.fn(() => ({
          update: mockUpdate
        }))
      };
      
      // Should still authenticate even if update fails
      const result = await validateApiKey(validKey, mockFirestore);
      
      assert.strictEqual(result.authenticated, true);
      assert.strictEqual(result.projectId, 'test-project-123');
    });
  });
});
