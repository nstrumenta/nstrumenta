import { NstrumentaClient } from 'nstrumenta';

const client = new NstrumentaClient();

const init = async () => {
  let $textarea = document.getElementById('outputTextArea') || document;
  const $status = document.getElementById('host-status');
  if (document.readyState !== 'complete') {
    return;
  }

  client.addListener('open', () => {
    console.log('yay subbed');

    client.addSubscription('_nstrumenta', (message) => {
      switch (message.type) {
        case 'children':
          const { children } = message;
          if (!children || children.length < 1) {
            return;
          }
          children.forEach((id: string) =>
            client.addSubscription(`${id}/stdout`, (message) => {
              console.log(`[${id}:stdout]`, message);
              const $li = document.createElement('li');
              $li.innerText = `[${id}] ${message}`;
              $li.className = 'mdl-list__-item';
              $textarea.appendChild($li);
            })
          );
          break;
        case 'status':
          const { status } = message;
          $status ? ($status.innerText = status) : null;
          break;
        case 'health':
          document.getElementById('health').innerText += '*';
          break;
        default:
          break;
      }
    });

    document.getElementById('send-data').addEventListener('click', async () => {
      const $el = document.getElementById('data') as HTMLInputElement;
      if (!$el) return;
      const { value } = $el;
      const data = new Blob([value]);
      await client.uploadData(data, { some: 'metadata' });
    });
  });

  // The nstrumenta server run on agent start will provide keys and urls via ejs
  let apiKey = '';
  let wsUrl = '';

  const $data = document.getElementById('agent-data');
  if ($data) {
    apiKey = $data.dataset.apikey || '';
    wsUrl = $data.dataset.wsurl || '';
  }

  await client.connect({ apiKey, wsUrl });
};

document.addEventListener('readystatechange', init);
