import { WebSocket } from 'ws';

export const Publish = async (url: string, channel: string) => {
  const ws = new WebSocket(url);

  ws.onopen = () => {
    console.log('connected to ', url, channel);

    process.stdin.on('data', (payload) => {
      console.log(String(payload));
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
    process.stdout.write(Buffer.from(JSON.parse(message.data.toString()).payload));
  };
};
