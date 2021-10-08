import { WebSocket } from 'ws';

export const Publish = async (url: string, channel: string) => {
  const ws = new WebSocket(url);

  ws.onopen = () => {
    console.log('connected to ', url, channel);

    process.stdin.on('data', (payload) => {
      ws.send(JSON.stringify({ channel, payload }));
    });
  };
};

export const Subscribe = async (url: string, channel: string) => {
  const ws = new WebSocket(url);

  ws.onopen = () => {
    ws.send(JSON.stringify({ type: 'subscribe', payload: { channel } }));
  };

  ws.onmessage = (message) => {
    const messageObject: { channel: string; payload?: Buffer; event?: Record<string, unknown> } =
      JSON.parse(message.data.toString());
    // if is object with buffer in payload, write just the buffer
    // otherwise pass payload as string
    const out = messageObject.payload
      ? Buffer.from(messageObject.payload)
      : messageObject.event
      ? JSON.stringify(messageObject.event) + '\n'
      : message.data.toString() + '\n';

    process.stdout.write(out);
  };
};
