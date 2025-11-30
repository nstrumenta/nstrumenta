import { describe, it } from 'node:test';
import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

describe('MCPClient compilation', () => {
  it('should compile mcpClient.ts to mcpClient.js', () => {
    const mcpClientJs = readFileSync(join(__dirname, '../../out/mcpClient.js'), 'utf-8');
    assert.ok(mcpClientJs.length > 0);
    assert.ok(mcpClientJs.includes('MCPClient'));
  });

  it('should export MCPClient class', () => {
    const mcpClientJs = readFileSync(join(__dirname, '../../out/mcpClient.js'), 'utf-8');
    assert.ok(mcpClientJs.includes('exports.MCPClient'));
  });

  it('should have all required methods', () => {
    const mcpClientJs = readFileSync(join(__dirname, '../../out/mcpClient.js'), 'utf-8');
    assert.ok(mcpClientJs.includes('listModules'));
    assert.ok(mcpClientJs.includes('publishModule'));
    assert.ok(mcpClientJs.includes('runModule'));
    assert.ok(mcpClientJs.includes('listData'));
    assert.ok(mcpClientJs.includes('getData'));
    assert.ok(mcpClientJs.includes('uploadData'));
    assert.ok(mcpClientJs.includes('listAgents'));
    assert.ok(mcpClientJs.includes('startAgent'));
    assert.ok(mcpClientJs.includes('getProjectInfo'));
  });

  it('should call tools via HTTP', () => {
    const mcpClientJs = readFileSync(join(__dirname, '../../out/mcpClient.js'), 'utf-8');
    assert.ok(mcpClientJs.includes('callTool'));
    assert.ok(mcpClientJs.includes('tools/call'));
  });
});
