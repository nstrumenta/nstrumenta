import { NstrumentaBrowserClient } from 'nstrumenta/browser';
import type { NstrumentaClientEvent } from 'nstrumenta';

const client = new NstrumentaBrowserClient();

const init = async () => {
  if (document.readyState !== 'complete') {
    return;
  }

  const $textarea = document.getElementById('outputTextArea') as HTMLTextAreaElement;
  client.addListener('open', () => {
    let agentLogSubscription = false;
    console.log('client open');

    client.addSubscription('__event', (message) => {
      switch (message.event as NstrumentaClientEvent) {
        case 'health':
          const healthEl = document.getElementById('health');
          if (healthEl) healthEl.innerText = new Date(Date.now()).toLocaleString();
          break;
        default:
          break;
      }
    });
    client.addSubscription('_status', (message) => {
      const { agentId } = message;
      const statusEl = document.getElementById('status');
      if (statusEl) statusEl.innerText = JSON.stringify(message);
      if (agentId && !agentLogSubscription) {
        agentLogSubscription = true;
        client.addSubscription(`_${agentId}/stdout`, (buffer) => {
          const message = new TextDecoder().decode(buffer);
          $textarea.textContent += `${message}\n`;
        });
      }
    });
  });

  // use apiKey from search params , wsUrl from search params or location
  const params = new URL(window.location.href).searchParams;
  const wsUrlParam = params.get('wsUrl');
  const wsUrl = wsUrlParam ? wsUrlParam : window.location.origin.replace('http', 'ws');
  const apiKeyParam = params.get('apiKey');
  if (apiKeyParam) {
    localStorage.setItem('apiKey', apiKeyParam);
  }
  const apiLocalStore = localStorage.getItem('apiKey');
  const apiKey = apiKeyParam ? apiKeyParam : apiLocalStore;

  await client.connect({ apiKey: apiKey || undefined, wsUrl });
};

document.addEventListener('readystatechange', init);
