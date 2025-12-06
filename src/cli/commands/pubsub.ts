import { WebSocket } from 'ws';
import { getToken } from '../../shared';
import {
  BusMessageType,
  deserializeWireMessage,
  makeBusMessageFromBuffer,
  makeBusMessageFromJsonObject,
} from '../../shared/lib/busMessage';
import { resolveApiKey } from '../utils';

const red = (text: string) => {
  return text;
};

export const Send = async (url: string, { channel }: { channel: string }) => {
  const apiKey = resolveApiKey();

  if (!url) {
    console.log(red('no ws host specified'));
    return;
  }

  if (!channel) {
    console.log(red('no ws channel specified'));
    return;
  }

  let token = 'unverified';
  try {
    token = await getToken(apiKey);
  } catch (error) {
    console.error((error as Error).message);
    throw error;
  }

  const ws = new WebSocket(url);

  ws.addEventListener('open', () => {
    console.log('connected to ', url, channel);

    // first message is always the token
    ws.send(token);

    process.nextTick(function () {
      process.stdin.on('data', (buffer: Buffer) => {
        ws.send(makeBusMessageFromBuffer(channel, buffer));
      });
    });
  });
};

export const Subscribe = async (
  url: string,
  { channel, messageOnly }: { channel?: string; messageOnly?: boolean }
) => {
  if (!url) {
    console.log(red('no ws host specified'));
    return;
  }

  if (!channel) {
    console.log(red('no ws channel'));
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
