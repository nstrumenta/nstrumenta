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

export const Subscribe = async (
  url: string,
  channel: string,
  options: { messageOnly?: boolean }
) => {
  const ws = new WebSocket(url);

  ws.onopen = () => {
    ws.send(JSON.stringify({ type: 'subscribe', payload: { channel } }));
  };

  ws.onmessage = (ev) => {
    const messageObject: {
      channel: string;
      message?: string;
      payload?: Buffer;
      event?: Record<string, unknown>;
    } = JSON.parse(ev.data.toString());
    // if is object with buffer in payload, write just the buffer
    // otherwise pass payload as string
    if (messageObject.payload) {
      process.stdout.write(Buffer.from(messageObject.payload));
    } else {
      if (options.messageOnly && messageObject.message) {
        process.stdout.write(messageObject.message);
      } else {
        process.stdout.write(ev.data.toString() + '\n');
      }
    }
  };
};
