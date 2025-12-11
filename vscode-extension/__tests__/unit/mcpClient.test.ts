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
    assert.ok(mcpClientJs.includes('runModule'));
    assert.ok(mcpClientJs.includes('hostModule'));
    assert.ok(mcpClientJs.includes('cloudRun'));
    assert.ok(mcpClientJs.includes('listData'));
    assert.ok(mcpClientJs.includes('listAgents'));
    assert.ok(mcpClientJs.includes('setAgentAction'));
    assert.ok(mcpClientJs.includes('cleanAgentActions'));
    assert.ok(mcpClientJs.includes('getAgentActions'));
    assert.ok(mcpClientJs.includes('updateAgentAction'));
  });

  it('should call tools via HTTP', () => {
    const mcpClientJs = readFileSync(join(__dirname, '../../out/mcpClient.js'), 'utf-8');
    assert.ok(mcpClientJs.includes('callTool'));
    assert.ok(mcpClientJs.includes('tools/call'));
  });
});
