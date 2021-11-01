var nstrumenta;

function initNstrumenta() {
  console.log('initNstrumenta');
  nstrumenta = new Nstrumenta.SandboxClient();

  console.log('subscribing to _host-status');
  nstrumenta.subscribe('_host-status', (message) => {
    console.log('sandbox index.js subscribe', message);
    document.getElementById('host-status').innerText = JSON.stringify(message);
  });
}

function send() {
  const channel = document.getElementById('channel').value;
  const message = document.getElementById('message').value;

  nstrumenta.send(channel, message);
}

const receivedMessages = [];
function subscribe() {
  const channel = document.getElementById('subscribeChannel').value;
  nstrumenta.subscribe(channel, (contents) => {
    const message =
      contents instanceof ArrayBuffer
        ? new TextDecoder('utf-8').decode(contents)
        : JSON.stringify(contents);

    receivedMessages.push(message);
    document.getElementById('outputTextArea').value = receivedMessages.slice(-100).join('\n');
  });
}
