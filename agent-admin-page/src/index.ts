import { NstrumentaClient } from 'nstrumenta';

const client = new NstrumentaClient();

const init = async () => {
  const $textarea = document.getElementById('outputTextArea') as HTMLTextAreaElement;
  if (document.readyState !== 'complete') {
    return;
  }

  client.addListener('open', () => {
    console.log('client open');

    client.addSubscription('_nstrumenta', (message) => {
      switch (message.type) {
        case 'health':
          document.getElementById('health').innerText = new Date(Date.now()).toLocaleString();
          break;
        default:
          $textarea.value += `${JSON.stringify(message)}\n`;
          break;
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

  await client.connect({ apiKey, wsUrl });
};

document.addEventListener('readystatechange', init);
