import axios, { AxiosError } from 'axios';
import { endpoints } from '../shared';
import { getToken } from './sessionToken';
import { makeBusMessageFromBuffer, makeBusMessageFromJsonObject } from './busMessage';

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

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.listeners = new Map();
    this.subscriptions = new Map();
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
    this.ws.addEventListener('open', () => {
      console.log(`client websocket opened <${wsUrl}>`);
      this.ws?.send(token);
      this.reconnectionAttempts = 0;
      this.connection.status = ClientStatus.CONNECTED;
      this.listeners.get('open')?.forEach((callback) => callback());
    });
    this.ws.addEventListener('close', (status) => {
      this.connection.status = ClientStatus.DISCONNECTED;
      this.listeners.get('close')?.forEach((callback) => callback());
      console.log(`client websocket closed <${wsUrl}>`, status);
      // reconnect on close
      this.reconnectionAttempts += 1;
      //this.connect({ nodeWebSocket, wsUrl });
    });

    return this.connection;
  }

  send(channel: string, message: Record<string, unknown>) {
    this.ws?.send(makeBusMessageFromJsonObject(channel, message).buffer);
  }

  sendBuffer(channel: string, buffer: ArrayBufferLike) {
    this.ws?.send(makeBusMessageFromBuffer(channel, buffer));
  }

  addSubscription(channel: string, callback: SubscriptionCallback) {
    console.log(`Nstrumenta client subscribe <${channel}>`);
    const channelSubscriptions = this.subscriptions.get(channel) || [];
    channelSubscriptions.push(callback);
    this.subscriptions.set(channel, channelSubscriptions);

    this.ws?.send(
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
