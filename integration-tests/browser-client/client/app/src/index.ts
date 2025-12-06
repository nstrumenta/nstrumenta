import { NstrumentaBrowserClient } from 'nstrumenta';

const client = new NstrumentaBrowserClient();

const init = async () => {
  if (document.readyState !== 'complete') {
    return;
  }

  // Read connection parameters from URL query string
  const urlParams = new URLSearchParams(window.location.search);
  const wsUrl = urlParams.get('wsUrl');
  const apiKey = urlParams.get('apiKey');

  const outputTextAreaElement = document.getElementById('outputTextArea') as HTMLTextAreaElement;
  const healthElement = document.getElementById('health');
  const statusElement = document.getElementById('status');
  const pingButton = document.getElementById('ping-button');
  const pingResult = document.getElementById('ping-result');

  pingButton!.onclick = async () => {
    console.log('ping clicked!');
    const ping = await client.ping();
    console.log(ping);
    pingResult!.innerText = `delta: ${Date.now() - ping.sendTimestamp} \n ${JSON.stringify(ping)}`;
  };

  client.addListener('open', () => {
    let agentLogSubscription = false;
    console.log('client open');
    // client.addSubscription('ping', (message) => {
    //   ping = { ...message, receiveTimestamp: Date.now() };
    //   console.log('ping', ping);
    //   pingResult!.innerText = `delta: ${ping.receiveTimestamp! - ping.sendTimestamp!}`;
    // });

    client.addSubscription('_nstrumenta', (message: any) => {
      switch (message.type) {
        case 'health':
          healthElement!.innerText = new Date(Date.now()).toLocaleString();

          break;
        default:
          break;
      }
    });
    client.addSubscription('_status', (message: any) => {
      const { agentId } = message;
      statusElement!.innerText = JSON.stringify(message);

      if (agentId && !agentLogSubscription) {
        agentLogSubscription = true;
        client.addSubscription(`_${agentId}/stdout`, (buffer: any) => {
          const message = new TextDecoder().decode(buffer);
          outputTextAreaElement.textContent += `${message}\n`;
        });
      }
    });
  });

  await client.connect({ wsUrl: wsUrl!, apiKey: apiKey! });
};

document.addEventListener('readystatechange', init);
