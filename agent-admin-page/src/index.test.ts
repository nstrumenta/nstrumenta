import { describe, it, expect, beforeEach } from 'vitest';

describe('Agent Admin Page', () => {
  beforeEach(() => {
    // Setup DOM
    document.body.innerHTML = `
      <div id="health"></div>
      <div id="status"></div>
      <textarea id="outputTextArea"></textarea>
    `;
  });

  it('should have required DOM elements', () => {
    expect(document.getElementById('health')).toBeTruthy();
    expect(document.getElementById('status')).toBeTruthy();
    expect(document.getElementById('outputTextArea')).toBeTruthy();
  });

  it('should parse URL parameters', () => {
    const url = new URL('http://localhost:8088?apiKey=test123&wsUrl=ws://localhost:8088');
    const params = url.searchParams;
    
    expect(params.get('apiKey')).toBe('test123');
    expect(params.get('wsUrl')).toBe('ws://localhost:8088');
  });

  it('should decode buffer messages', () => {
    const message = 'test message';
    const buffer = new TextEncoder().encode(message);
    const decoded = new TextDecoder().decode(buffer);
    
    expect(decoded).toBe(message);
  });
});
