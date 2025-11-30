import { describe, it } from 'node:test';
import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

describe('Extension compilation', () => {
  it('should compile extension.ts to extension.js', () => {
    const extensionJs = readFileSync(join(__dirname, '../../out/extension.js'), 'utf-8');
    assert.ok(extensionJs.length > 0);
    assert.ok(extensionJs.includes('activate'));
    assert.ok(extensionJs.includes('deactivate'));
  });

  it('should export activate and deactivate in compiled code', () => {
    const extensionJs = readFileSync(join(__dirname, '../../out/extension.js'), 'utf-8');
    assert.ok(extensionJs.includes('exports.activate'));
    assert.ok(extensionJs.includes('exports.deactivate'));
  });

  it('should register all commands', () => {
    const extensionJs = readFileSync(join(__dirname, '../../out/extension.js'), 'utf-8');
    assert.ok(extensionJs.includes('nstrumenta.setApiKey'));
    assert.ok(extensionJs.includes('nstrumenta.clearApiKey'));
    assert.ok(extensionJs.includes('nstrumenta.status'));
    assert.ok(extensionJs.includes('nstrumenta.module.list'));
    assert.ok(extensionJs.includes('nstrumenta.module.run'));
    assert.ok(extensionJs.includes('nstrumenta.module.publish'));
    assert.ok(extensionJs.includes('nstrumenta.data.list'));
    assert.ok(extensionJs.includes('nstrumenta.agent.list'));
  });

  it('should extract server URL from API key', () => {
    const extensionJs = readFileSync(join(__dirname, '../../out/extension.js'), 'utf-8');
    assert.ok(extensionJs.includes('extractServerUrl'));
  });
});
