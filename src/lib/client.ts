import axios from 'axios';
import { endpoints } from '../shared';
import {
  deserializeBlob,
  deserializeWireMessage,
  makeBusMessageFromBuffer,
  makeBusMessageFromJsonObject,
} from './busMessage';

const DEFAULT_HOST_PORT = 8088;

type ListenerCallback = (event?: any) => void;
type SubscriptionCallback = (message?: any) => void;

export interface NstrumentaClientOptions {
  apiKey: string;
  wsUrl?: string;
}

export class NstrumentaClient {
  host: URL = new URL(`ws://localhost:${DEFAULT_HOST_PORT}`);
  apiKey: string;
  listeners: Map<string, Array<ListenerCallback>>;
  subscriptions: Map<string, SubscriptionCallback[]>;
  ws: WebSocket | null = null;

  constructor({ apiKey, wsUrl }: NstrumentaClientOptions) {
    this.apiKey = apiKey;
    this.listeners = new Map();
    this.subscriptions = new Map();
    this.host = new URL(wsUrl ? wsUrl : this.host);
    this.subscribe = this.subscribe.bind(this);
    this.init = this.init.bind(this);
  }

  async init(nodeWebSocket?: new (url: string | URL) => WebSocket) {
    const headers = {
      'x-api-key': this.apiKey,
      'Content-Type': 'application/json',
    };
    //TODO use the returned token
    axios
      .get<{ token: string }>(endpoints.GET_TOKEN, {
        headers,
      })
      .then((res) => {
        console.log('getToken', res);
      });

    this.ws = nodeWebSocket ? new nodeWebSocket(this.host) : new WebSocket(this.host);
    this.ws.addEventListener('open', () => {
      console.log(`client websocket opened <${this.host}>`);
      this.listeners.get('open')?.forEach((callback) => callback());
    });
    this.ws.addEventListener('close', () => {
      this.listeners.get('close')?.forEach((callback) => callback());
      console.log(`client websocket closed <${this.host}>`);
    });
    // messages from nstrumenta web app
    this.ws.addEventListener('message', async (e) => {
      try {
        const { channel, contents } =
          typeof Blob !== 'undefined' && e.data instanceof Blob
            ? await deserializeBlob(e.data)
            : deserializeWireMessage(e.data);

        this.subscriptions.get(channel)?.forEach((callback) => {
          callback(contents);
        });
      } catch (e) {
        console.error('nstrumenta client message error', e);
      }
    });
  }

  send(channel: string, message: Record<string, unknown>) {
    //buffer to handle messages before initial connection with parent
    console.log('sandbox-client send', channel, message);
    this.ws?.send(makeBusMessageFromJsonObject(channel, message).buffer);
  }

  sendBuffer(channel: string, buffer: ArrayBufferLike) {
    //buffer to handle messages before initial connection with parent
    console.log('sandbox-client sendBuffer', channel, buffer);
    this.ws?.send(makeBusMessageFromBuffer(channel, buffer));
  }

  subscribe(channel: string, callback: SubscriptionCallback) {
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
