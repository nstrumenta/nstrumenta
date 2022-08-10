import { WebSocket } from 'ws';

export type ListenerCallback = (event?: any) => void;
export type SubscriptionCallback = (message?: any) => void;

export interface ConnectOptions {
  nodeWebSocket?: new (url: string) => WebSocket;
  wsUrl: string;
  apiKey?: string;
  verify?: boolean;
  id?: string;
}

export enum ClientStatus {
  INIT = 0,
  READY = 1,
  CONNECTED = 2,
  DISCONNECTED = 3,
  CONNECTING = 4,
  ERROR = 5,
}

export interface Connection {
  status: ClientStatus;
}

export interface NstrumentaClientBase {
  connection: Connection;

  shutdown(): Promise<void>;

  connect(connectOptions: ConnectOptions): Promise<Connection>;

  send(channel: string, message: Record<string, unknown>): void;

  sendBuffer(channel: string, buffer: ArrayBufferLike): void;

  addSubscription(channel: string, callback: SubscriptionCallback): void;

  addListener(eventType: 'open' | 'close', callback: ListenerCallback): void;

  startLog(name: string, channels: string[]): Promise<void>;

  finishLog(name: string): Promise<void>;

  storage?: BaseStorageService;
}

export interface BaseStorageService {
  list(type: string): Promise<string[]>;

  upload(path: string, data: Blob, meta: Record<string, string>): Promise<void>;

  download<T>(type: string, path: string): Promise<T>;

  download(type: string, path: string): Promise<unknown>;
}
