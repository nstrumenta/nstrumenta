import {
  deserializeWireMessage,
  makeBusMessageFromBuffer,
  makeBusMessageFromJsonObject
} from './busMessage';
import { getToken } from './sessionToken';

type ListenerCallback = (event?: any) => void;
type SubscriptionCallback = (message?: any) => void;

export interface ConnectOptions {
  nodeWebSocket?: new (url: string | URL) => WebSocket;
  wsUrl: URL;
}

export enum ClientStatus {
  INIT = 0,
  READY = 1,
  CONNECTED = 2,
  DISCONNECTED = 3,
  CONNECTING = 4,
}

export interface Connection {
  status: ClientStatus;
}

export class NstrumentaClient {
  apiKey: string;
  ws: WebSocket | null = null;
  reconnectionAttempts = 0;

  listeners: Map<string, Array<ListenerCallback>>;
  subscriptions: Map<string, SubscriptionCallback[]>;
  connection: Connection = { status: ClientStatus.CONNECTED };
  messageBuffer: Array<ArrayBufferLike>;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.listeners = new Map();
    this.subscriptions = new Map();
    this.messageBuffer = [];
    this.addSubscription = this.addSubscription.bind(this);
    this.addListener = this.addListener.bind(this);
    this.connect = this.connect.bind(this);
  }

  async connect({ nodeWebSocket, wsUrl }: ConnectOptions) {
    if (this.reconnectionAttempts > 10) {
      throw new Error('Too many reconnection attempts, stopping');
    }
    const token = await getToken(this.apiKey);
    console.log(token);

    this.ws = nodeWebSocket ? new nodeWebSocket(wsUrl) : new WebSocket(wsUrl);
    this.ws.addEventListener('open', async () => {
      console.log(`client websocket opened <${wsUrl}>`);
      this.ws?.send(token);
      this.reconnectionAttempts = 0;
    });
    this.ws.addEventListener('close', (status) => {
      this.connection.status = ClientStatus.DISCONNECTED;
      this.listeners.get('close')?.forEach((callback) => callback());
      console.log(`client websocket closed <${wsUrl}>`, status);
      // reconnect on close
      this.reconnectionAttempts += 1;
      //this.connect({ nodeWebSocket, wsUrl });
    });
    this.ws.addEventListener('message', (event) => {
      const busMessage: ArrayBuffer = event.data;
      console.log('nstClient received message', busMessage);
      let deserializedMessage;
      try {
        deserializedMessage = deserializeWireMessage(busMessage);
      } catch (error) {
        console.log(`Couldn't handle ${(error as Error).message}`);
        return;
      }
      const { channel, busMessageType, contents } = deserializedMessage;
      if (channel == '_nstrumenta') {
        const { verified } = contents;
        if (verified) {
          this.connection.status = ClientStatus.CONNECTED;
          this.listeners.get('open')?.forEach((callback) => callback());
          this.messageBuffer.forEach((message) => {
            this.ws?.send(message);
          });
          this.messageBuffer = [];
        }
      }

      this.subscriptions.get(channel)?.forEach((subscription) => () => {
        subscription(contents);
      });
    });

    return this.connection;
  }

  send(channel: string, message: Record<string, unknown>) {
    this.bufferedSend(makeBusMessageFromJsonObject(channel, message).buffer);
  }

  sendBuffer(channel: string, buffer: ArrayBufferLike) {
    this.bufferedSend(makeBusMessageFromBuffer(channel, buffer));
  }

  bufferedSend(message: ArrayBufferLike) {
    //buffers messages sent before initial connection
    if (!(this.ws?.readyState === this.ws?.OPEN)) {
      console.log('adding to messageBuffer, length:', this.messageBuffer.length);
      this.messageBuffer.push(message);
    } else {
      this.ws?.send(message);
    }
  }

  addSubscription(channel: string, callback: SubscriptionCallback) {
    console.log(`Nstrumenta client subscribe <${channel}>`);
    const channelSubscriptions = this.subscriptions.get(channel) || [];
    channelSubscriptions.push(callback);
    this.subscriptions.set(channel, channelSubscriptions);

    this.bufferedSend(
      makeBusMessageFromJsonObject('_command', { command: 'subscribe', channel }).buffer
    );
  }

  addListener(eventType: 'open' | 'close', callback: ListenerCallback) {
    if (!this.listeners.get(eventType)) {
      this.listeners.set(eventType, []);
    }
    const listenerCallbacks = this.listeners.get(eventType);
    if (listenerCallbacks) {
      listenerCallbacks.push(callback);
    }
  }
}
