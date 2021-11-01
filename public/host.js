const websocketUrl = window.location.toString().replace('http', 'ws');
console.log(window.location, websocketUrl);
const ws = new WebSocket(websocketUrl);

const emptyMessage = new Uint8Array([0, 0, 0, 102, 0, 0, 0, 1, 0, 0, 0, 0]);
const sandboxFrameElement = document.getElementById('sandboxFrame');

let hasReceivedMessageFromClient = false;
let buffer = [];

const bufferedSend = (message) => {
  //buffers messages sent before initial connection
  if (!ws.readyState == WebSocket.OPEN) {
    console.log('adding to messageBuffer, length:', this.messageBuffer.length);
    this.message.push(message);
  } else {
    ws.send(message);
  }
};

window.addEventListener('message', (e) => {
  hasReceivedMessageFromClient = true;
  bufferedSend(e.data);
});

const handshakeInterval = window.setInterval(() => {
  console.log(ws.readyState, hasReceivedMessageFromClient);
  if (hasReceivedMessageFromClient) {
    console.log('clearing interval');
    window.clearInterval(handshakeInterval);
  } else {
    sandboxFrameElement.contentWindow.postMessage(emptyMessage.buffer, '*');
  }
}, 1000);

ws.onopen = (event) => {
  console.log('connected', event);
  buffer.forEach((message) => {
    ws.send(message);
  });
  buffer = [];
  sandboxFrameElement.contentWindow.postMessage(emptyMessage.buffer, '*');
};

ws.onmessage = async (ev) => {
  sandboxFrameElement.contentWindow.postMessage(ev.data, '*');
};
