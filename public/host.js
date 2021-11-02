const websocketUrl = window.location.toString().replace('http', 'ws');
const ws = new WebSocket(websocketUrl);

window.addEventListener('message', (e) => {
  ws.send(e.data);
});

ws.onopen = (event) => {
  console.log('connected', event);
};

ws.onmessage = async (ev) => {
  sandboxFrameElement.contentWindow.postMessage(ev.data, '*');
};
