import axios, { AxiosError } from 'axios';
import { endpoints } from '../shared';
import {
  deserializeBlob,
  deserializeWireMessage,
  makeBusMessageFromBuffer,
  makeBusMessageFromJsonObject,
} from './busMessage';

type ListenerCallback = (event?: any) => void;
type SubscriptionCallback = (message?: any) => void;

export interface NstrumentaClientOptions {
  apiKey: string;
  wsUrl: string;
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
  private host: URL;
  private apiKey: string;
  private ws: WebSocket | null = null;

  public listeners: Map<string, Array<ListenerCallback>>;
  public subscriptions: Map<string, SubscriptionCallback[]>;
  public connection: Connection = { status: ClientStatus.CONNECTED };

  constructor({ apiKey, wsUrl }: NstrumentaClientOptions) {
    this.apiKey = apiKey;
    this.listeners = new Map();
    this.subscriptions = new Map();
    try {
      this.host = new URL(wsUrl);
    } catch (e) {
      console.warn('Problem with the given websocket url');
      throw e;
    }
    this.subscribe = this.subscribe.bind(this);
    this.init = this.init.bind(this);
  }

  async init(nodeWebSocket?: new (url: string | URL) => WebSocket) {
    const headers = {
      'x-api-key': this.apiKey,
      'Content-Type': 'application/json',
    };

    // TODO: use the returned token
    let token;
    try {
      const { data } = await axios.get<{ token: string }>(endpoints.GET_TOKEN, {
        headers,
      });
      token = data.token;
    } catch (err) {
      const message = 'Failure to connect to nstrumenta';
      if (err && (err as AxiosError).response) {
        const { data, status } = (err as AxiosError).response!;
        console.log(message, { data, status });
      } else if (err && (err as AxiosError).request) {
        console.log(message, (err as AxiosError).request);
      }
      console.log(message, err);
      throw err;
    }

    this.ws = nodeWebSocket ? new nodeWebSocket(this.host) : new WebSocket(this.host);
    this.ws.addEventListener('open', () => {
      console.log(`client websocket opened <${this.host}>`);
      this.connection.status = ClientStatus.CONNECTED;
      this.listeners.get('open')?.forEach((callback) => callback());
    });
    this.ws.addEventListener('close', (status) => {
      this.connection.status = ClientStatus.DISCONNECTED;
      this.listeners.get('close')?.forEach((callback) => callback());
      console.log(`client websocket closed <${this.host}>`, status);
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

    return this.connection;
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
