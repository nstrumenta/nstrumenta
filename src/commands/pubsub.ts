import { WebSocket } from 'ws';
import {
  BusMessageType,
  deserializeWireMessage,
  makeBusMessageFromBuffer,
  makeBusMessageFromJsonObject,
} from '../lib/busMessage';
import { getCurrentContext } from '../lib/context';

const red = (text: string) => {
  return text;
};

export const Send = async (url: string, { channel }: { channel: string }) => {
  const { wsHost: contextWsHost, channel: contextChannel } = getCurrentContext();
  url = url ? url : contextWsHost;
  channel = channel ? channel : contextChannel;

  if (!url) {
    console.log(red('no ws host specified either as argument or in current context'));
    return;
  }

  if (!channel) {
    console.log(red('no ws channel specified either as cli option or in current context'));
    return;
  }

  const ws = new WebSocket(url);

  ws.addEventListener('open', () => {
    console.log('connected to ', url, channel);

    process.stdin.on('data', (buffer) => {
      ws.send(makeBusMessageFromBuffer(channel, buffer));
    });
  });
};

export const Subscribe = async (
  url: string,
  { channel, messageOnly }: { channel?: string; messageOnly?: boolean }
) => {
  const { wsHost: contextWsHost, channel: contextChannel } = getCurrentContext();
  url = url ? url : contextWsHost;
  channel = channel ? channel : contextChannel;

  if (!url) {
    console.log(red('no ws host specified either as argument or in current context'));
    return;
  }

  if (!channel) {
    console.log(red('no ws channel specified either as cli option or in current context'));
    return;
  }

  const ws = new WebSocket(url);

  ws.addEventListener('open', () => {
    ws.send(makeBusMessageFromJsonObject('_command', { command: 'subscribe', channel }));
  });

  ws.addEventListener('message', (ev) => {
    const { channel, busMessageType, contents } = deserializeWireMessage(ev.data as ArrayBuffer);

    switch (busMessageType) {
      case BusMessageType.Json:
        if (messageOnly) {
          process.stdout.write(contents.message);
        } else {
          process.stdout.write(contents.toString() + '\n');
        }
        break;
      case BusMessageType.Buffer:
        process.stdout.write(contents);
        break;
    }
  });
};
