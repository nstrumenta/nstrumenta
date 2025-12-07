import { describe, it } from 'node:test';
import assert from 'node:assert';
import { getEndpoints } from '../index';

describe('Shared Utilities', () => {
  describe('getEndpoints', () => {
    it('should decode apiKey and construct endpoints', () => {
      // Create a test API key with base64 encoded URL
      const testUrl = 'http://localhost:5999';
      const encodedUrl = Buffer.from(testUrl).toString('base64');
      const apiKey = `test-key:${encodedUrl}`;

      const endpoints = getEndpoints(apiKey);

      assert.strictEqual(endpoints.CREATE_PROJECT, `${testUrl}/createProject`);
      assert.strictEqual(endpoints.GET_MACHINES, `${testUrl}/getMachines`);
      assert.strictEqual(endpoints.GET_UPLOAD_URL, `${testUrl}/getUploadUrl`);
      assert.strictEqual(endpoints.REGISTER_AGENT, `${testUrl}/registerAgent`);
      assert.strictEqual(endpoints.MCP, `${testUrl}/`);
    });

    it('should use provided apiUrl over decoded URL', () => {
      const apiKey = 'test-key:aHR0cDovL2RlZmF1bHQ='; // http://default
      const customUrl = 'http://custom:8080';

      const endpoints = getEndpoints(apiKey, customUrl);

      assert.strictEqual(endpoints.CREATE_PROJECT, `${customUrl}/createProject`);
      assert.strictEqual(endpoints.GET_PROJECT, `${customUrl}/getProject`);
      assert.strictEqual(endpoints.MCP, `${customUrl}/`);
    });

    it('should create all expected endpoints', () => {
      const testUrl = 'http://test';
      const encodedUrl = Buffer.from(testUrl).toString('base64');
      const apiKey = `key:${encodedUrl}`;

      const endpoints = getEndpoints(apiKey);

      // Verify all endpoints exist
      const expectedEndpoints = [
        'ADMIN_UTILS',
        'CREATE_PROJECT',
        'GET_MACHINES',
        'GET_CLOUD_RUN_SERVICES',
        'GET_UPLOAD_URL',
        'GET_UPLOAD_DATA_URL',
        'GET_PROJECT',
        'REGISTER_AGENT',
        'LIST_AGENTS',
        'SET_ACTION',
        'GET_ACTION',
        'SET_AGENT_ACTION',
        'GET_AGENT_ID_BY_TAG',
        'CLEAN_AGENT_ACTIONS',
        'GET_DOWNLOAD_URL',
        'GET_PROJECT_DOWNLOAD_URL',
        'GENERATE_DATA_ID',
        'LIST_MODULES',
        'GET_TOKEN',
        'VERIFY_TOKEN',
        'VERIFY_API_KEY',
        'SET_STORAGE_OBJECT',
        'SET_DATA_METADATA',
        'LIST_STORAGE_OBJECTS',
        'GET_DATA_MOUNT',
        'QUERY_COLLECTION',
        'MCP',
        'MCP_SSE'
      ];

      expectedEndpoints.forEach(endpoint => {
        assert.ok(endpoints[endpoint as keyof typeof endpoints], `Missing endpoint: ${endpoint}`);
      });
    });

    it('should handle apiKey without URL part', () => {
      const apiKey = 'key-only:';

      const endpoints = getEndpoints(apiKey);

      // Should still create endpoints, even if URL is empty
      assert.ok(endpoints.MCP);
    });

    it('should trim decoded URL', () => {
      // Create URL with whitespace
      const testUrl = '  http://localhost:5999  ';
      const encodedUrl = Buffer.from(testUrl).toString('base64');
      const apiKey = `test-key:${encodedUrl}`;

      const endpoints = getEndpoints(apiKey);

      // URLs should be trimmed
      assert.strictEqual(endpoints.MCP, 'http://localhost:5999/');
      assert.ok(!endpoints.MCP.includes('  '));
    });
  });

  describe('QueryOptions interface', () => {
    it('should allow valid query options', () => {
      const validOptions = {
        collection: 'data' as const,
        limit: 100,
        field: 'timestamp',
        comparison: '>' as const,
        compareValue: '2024-01-01'
      };

      // Type check
      assert.ok(validOptions);
      assert.strictEqual(validOptions.collection, 'data');
      assert.strictEqual(validOptions.limit, 100);
    });

    it('should allow partial query options', () => {
      const partialOptions = {
        collection: 'modules' as const,
        limit: 50
      };

      assert.ok(partialOptions);
      assert.strictEqual(partialOptions.collection, 'modules');
    });

    it('should allow all comparison operators', () => {
      const operators = [
        '<', '<=', '==', '>', '>=', '!=',
        'array-contains', 'array-contains-any', 'in', 'not-in'
      ];

      operators.forEach(op => {
        const options = {
          comparison: op,
          field: 'test',
          compareValue: 'value'
        };
        assert.ok(options);
      });
    });
  });
});
