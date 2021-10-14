import {
  BusMessageType,
  deserializeWireMessage,
  makeBusMessageFromBuffer,
  makeBusMessageFromJsonObject,
} from '../models/BusMessage';
import { WebSocket } from 'ws';

export const Publish = async (url: string, channel: string) => {
  const ws = new WebSocket(url);

  ws.onopen = () => {
    console.log('connected to ', url, channel);

    process.stdin.on('data', (buffer) => {
      ws.send(makeBusMessageFromBuffer(channel, buffer).buffer);
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
    ws.send(makeBusMessageFromJsonObject('_command', { command: 'subscribe', channel }).buffer);
  };

  ws.onmessage = (ev) => {
    const { channel, busMessageType, contents } = deserializeWireMessage(ev.data as ArrayBuffer);

    switch (busMessageType) {
      case BusMessageType.Json:
        if (options.messageOnly) {
          process.stdout.write(contents.message);
        } else {
          process.stdout.write(contents.toString() + '\n');
        }
        break;
      case BusMessageType.Buffer:
        process.stdout.write(contents);
        break;
    }
  };
};
