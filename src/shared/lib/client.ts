import { WebSocket } from 'ws';
import {
  DataQueryOptions,
  DataQueryResponse,
  RPC,
  Subscribe,
  makeBusMessageFromJsonObject,
} from '../index';
import { v4 as randomUUID } from 'uuid';

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
  subscriptions: Map<string, Map<string, SubscriptionCallback>>;

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

export interface StorageUploadParameters {
  filename: string;
  data: Blob;
  meta: Record<string, string>;
  dataId?: string;
}

export interface BaseStorageService {
  list(type: string): Promise<string[]>;

  upload({ filename, data, meta, dataId }: StorageUploadParameters): Promise<void>;

  download<T>(type: string, path: string): Promise<T>;

  download(type: string, path: string): Promise<unknown>;

  query(options: DataQueryOptions): Promise<DataQueryResponse>;
}

export const callRPC = <T extends RPC>(
  send: (data: string | ArrayBufferLike | Blob | ArrayBufferView) => void,
  subscriptions: Map<string, Map<string, SubscriptionCallback>>,
  type: T['type'],
  requestPayload: T['request']
) => {
  console.log('callRPC', type, requestPayload);
  const rpcId = randomUUID();
  const rpcChannelBase = `__rpc/${type}/${rpcId}`;
  const requestChannel = `${rpcChannelBase}/request`;
  const responseChannel = `${rpcChannelBase}/response`;
  return new Promise<T['response']>(async (r) => {
    // first subscribe to the responseChannel
    const channelSubscriptions = subscriptions.get(responseChannel) || new Map();
    channelSubscriptions.set(rpcId, (response: Subscribe['response']) => {
      // await this.callRPC<Unsubscribe>({subscriptionId});
      channelSubscriptions?.delete(rpcId);
      r(response);
    });
    // is channelSubscriptions modified in place?
    subscriptions.set(responseChannel, channelSubscriptions);

    // then send on requestChannel
    send(makeBusMessageFromJsonObject(requestChannel, requestPayload));
  });
};
