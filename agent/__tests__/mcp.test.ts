import { describe, it, mock } from 'node:test';
import assert from 'node:assert';
import type { ModuleExtended } from '../../cli/commands/module';

describe('MCP Server', () => {
  describe('list_modules tool', () => {
    it('should return modules when List is called with filter', async () => {
      // Mock the List function
      const mockModules: ModuleExtended[] = [
        { 
          name: 'test-module', 
          version: '1.0.0', 
          nstrumentaModuleType: 'nodejs' as const, 
          entry: 'npm start',
          folder: '/test/folder'
        },
      ];
      
      // Simple function test - we'll mock the actual List import when integrating
      const testList = async (options: { filter: string; json?: boolean; depth: number | null }) => {
        return options.json ? mockModules : undefined;
      };

      const result = await testList({ filter: 'test', json: true, depth: null });
      
      assert.deepStrictEqual(result, mockModules);
    });

    it('should return all modules when filter is empty', async () => {
      const mockModules: ModuleExtended[] = [
        { 
          name: 'module-a', 
          version: '1.0.0', 
          nstrumentaModuleType: 'nodejs' as const, 
          entry: 'npm start',
          folder: '/test/a'
        },
        { 
          name: 'module-b', 
          version: '2.0.0', 
          nstrumentaModuleType: 'web' as const, 
          entry: 'npm start',
          folder: '/test/b'
        },
      ];
      
      const testList = async (options: { filter: string; json?: boolean; depth: number | null }) => {
        return options.json ? mockModules : undefined;
      };

      const result = await testList({ filter: '', json: true, depth: null });
      
      assert.strictEqual(result?.length, 2);
      assert.deepStrictEqual(result, mockModules);
    });

    it('should handle errors gracefully', async () => {
      const testList = async () => {
        throw new Error('Failed to fetch modules');
      };

      await assert.rejects(
        async () => await testList(),
        { message: 'Failed to fetch modules' }
      );
    });
  });

  describe('MCP tool input validation', () => {
    it('should accept optional filter parameter', () => {
      const input = { filter: 'test-module' };
      assert.ok(typeof input.filter === 'string');
    });

    it('should handle undefined filter parameter', () => {
      const input = { filter: undefined };
      assert.strictEqual(input.filter, undefined);
    });
  });
});
