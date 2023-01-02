import { Mcap0Types } from '@mcap/core';
import axios, { AxiosRequestConfig } from 'axios';
import { v4 as randomUUID } from 'uuid';
import type WebSocket from 'ws';
import {
  DataQueryOptions,
  DataQueryResponse,
  Ping,
  RPC,
  Subscribe,
  getEndpoints,
  makeBusMessageFromJsonObject,
} from '../index';
import { makeBusMessageFromBuffer } from './busMessage';

export interface LogConfig {
  header: Mcap0Types.Header;
  channels: Array<{
    schema: { title: string; type: 'object'; properties: Record<string, unknown> };
    channel: Omit<Mcap0Types.Channel, 'id' | 'schemaId' | 'metadata'>;
  }>;
}

export type ListenerCallback = (event?: any) => void;
export type SubscriptionCallback = (message?: any) => void;

export type WebSocketLike = WebSocket;

export interface ConnectOptions {
  nodeWebSocket?: new (url: string) => WebSocketLike;
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

export type Reconnection = {
  hasVerified: boolean;
  attempts: number;
  timeout: ReturnType<typeof setTimeout> | null;
};

export const getToken = async (apiKey: string): Promise<string> => {
  const headers = {
    'x-api-key': apiKey,
    'Content-Type': 'application/json',
  };
  try {
    // https://stackoverflow.com/questions/69169492/async-external-function-leaves-open-handles-jest-supertest-express
    const { data } = await axios.get<{ token: string }>(getEndpoints('prod').GET_TOKEN, {
      headers,
    });
    return data.token;
  } catch (err) {
    const message = `Problem getting token, check api key, err: ${(err as Error).message}`;
    throw new Error(message);
  }
};

export abstract class NstrumentaClientBase {
  public ws: WebSocketLike | null = null;
  public apiKey: string | null = null;
  public listeners: Map<string, Array<ListenerCallback>>;
  public subscriptions: Map<string, Map<string, SubscriptionCallback>>;
  public reconnection: Reconnection = { hasVerified: false, attempts: 0, timeout: null };
  public messageBuffer: Array<ArrayBufferLike>;
  private datalogs: Map<string, Array<string>>;
  public clientId: string | null = null;
  private endpoints;

  public connection: Connection = { status: ClientStatus.INIT };

  constructor() {
    this.listeners = new Map();
    this.subscriptions = new Map();
    this.datalogs = new Map();
    this.messageBuffer = [];
    this.endpoints = getEndpoints('prod');
    this.addSubscription = this.addSubscription.bind(this);
    this.addListener = this.addListener.bind(this);
    this.connect = this.connect.bind(this);
  }

  async shutdown() {
    this.listeners.clear();
    this.subscriptions.clear();
    this.datalogs.clear();
    this.messageBuffer = [];
    if (this.reconnection.timeout) {
      clearTimeout(this.reconnection.timeout);
      this.reconnection.timeout = null;
    }
    this.ws?.removeAllListeners();
    this.ws?.close();
    return;
  }

  public abstract connect(connectOptions?: ConnectOptions): Promise<Connection>;

  public rollOff(attempts: number) {
    if (attempts == 0) return 0;
    // rolls off exponentially until a max of 30 minutes
    // 100 attempts is about 1.5 days
    return Math.min(Math.pow(attempts, 2) * 1000, 30 * 60 * 1000);
  }

  public send(channel: string, message: Record<string, unknown>) {
    this.bufferedSend(makeBusMessageFromJsonObject(channel, message));
  }

  public sendBuffer(channel: string, buffer: ArrayBufferLike) {
    this.bufferedSend(makeBusMessageFromBuffer(channel, buffer));
  }

  private bufferedSend(message: ArrayBufferLike) {
    // buffers messages sent before initial connection
    if (!(this.ws?.readyState === this.ws?.OPEN)) {
      console.log('adding to messageBuffer, length:', this.messageBuffer.length);
      this.messageBuffer.push(message);
    } else {
      this.ws?.send(message);
    }
  }

  public addSubscription = async (channel: string, callback: SubscriptionCallback) => {
    const { subscriptionId } = await callRPC<Subscribe>(
      this.ws!.send.bind(this.ws),
      this.subscriptions,
      'subscribe',
      { channel }
    );
    console.log(`Nstrumenta client subscribe <${channel}> subscriptionId:${subscriptionId}`);
    const channelSubscriptions = this.subscriptions.get(channel) || new Map();
    channelSubscriptions.set(subscriptionId, callback);
    this.subscriptions.set(channel, channelSubscriptions);

    return () => {
      // await this.callRPC<Unsubscribe>({subscriptionId});
      this.subscriptions.get(channel)?.delete(subscriptionId);
    };
  };

  public addListener(eventType: 'open' | 'close', callback: ListenerCallback) {
    if (!this.listeners.get(eventType)) {
      this.listeners.set(eventType, []);
    }
    const listenerCallbacks = this.listeners.get(eventType);
    if (listenerCallbacks) {
      listenerCallbacks.push(callback);
    }
  }

  public addStringToDataLog(logName: string, entry: string) {
    const log = this.datalogs.get(logName);
    if (!log) {
      console.log(`starting new log: ${logName}`);
      this.datalogs.set(logName, [entry]);
    } else {
      log.push(entry);
    }
  }

  public async uploadData(path: string, data: Blob, meta: Record<string, string>) {
    const size = data.size;
    let url;
    const response = await axios.post(
      this.endpoints.GET_UPLOAD_URL,
      {
        path,
        size,
        meta,
      },
      {
        headers: {
          contentType: 'application/json',
          'x-api-key': this.apiKey!,
        },
      }
    );

    url = response.data?.uploadUrl;

    await axios.put(url, data, {
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
      headers: {
        contentType: 'application/octet-stream',
        contentLength: `${size}`,
        contentLengthRange: `bytes 0-${size - 1}/${size}`,
      },
    });
  }
  public async ping() {
    return callRPC<Ping>(this.ws!.send.bind(this.ws), this.subscriptions, 'ping', {
      sendTimestamp: Date.now(),
    });
  }

  public async startLog(name: string, channels: string[], config?: LogConfig) {
    this.send('_nstrumenta', { command: 'startLog', name, channels, config });
  }

  public async finishLog(name: string) {
    console.log('finish log');
    this.send('_nstrumenta', { command: 'finishLog', name });
  }

  storage?: StorageService;
}

export interface StorageUploadParameters {
  filename: string;
  data: Blob;
  meta: Record<string, string>;
  dataId?: string;
}

export class StorageService {
  private apiKey: string;
  private endpoints;

  constructor(props: { apiKey: string }) {
    this.apiKey = props.apiKey;
    this.endpoints = getEndpoints('prod');
  }

  async download(path: string): Promise<Blob> {
    const response = await axios(this.endpoints.GET_PROJECT_DOWNLOAD_URL, {
      method: 'post',
      headers: { 'x-api-key': this.apiKey, 'content-type': 'application/json' },
      data: { path },
    });
    console.log('REQ:', response.request);

    const { data: fetched } = await axios(response.data, {
      method: 'GET',
      responseType: 'blob',
    });

    return fetched;
  }

  async query({
    filenames,
    tag: tags,
    before,
    after,
    limit = 1,
    metadata: metadataOriginal,
  }: DataQueryOptions): Promise<DataQueryResponse> {
    const metadata =
      typeof metadataOriginal === 'string'
        ? JSON.parse(metadataOriginal)
        : typeof metadataOriginal === 'object'
        ? metadataOriginal
        : {};

    const data = { tags, before, after, limit, filenames, metadata };

    const config: AxiosRequestConfig = {
      method: 'post',
      headers: { 'x-api-key': this.apiKey },
      data,
    };

    try {
      const response = await axios(this.endpoints.QUERY_DATA, config);

      return response.data;
    } catch (error) {
      console.log(`Something went wrong: ${(error as Error).message}`);

      return [];
    }
  }

  async list(type: string): Promise<string[]> {
    let response = await axios(this.endpoints.LIST_STORAGE_OBJECTS, {
      method: 'post',
      headers: { 'x-api-key': this.apiKey, 'content-type': 'application/json' },
      data: { type },
    });

    return response.data;
  }

  public async upload({ filename, data, meta, dataId: explicitDataId }: StorageUploadParameters) {
    const size = data.size;
    let url;
    let dataId = explicitDataId;

    if (!dataId) {
      const res = await axios(this.endpoints.GENERATE_DATA_ID, {
        headers: { 'x-api-key': this.apiKey!, method: 'post' },
      });
      dataId = res.data.dataId;
    }
    const config: AxiosRequestConfig = {
      method: 'post',
      headers: {
        'x-api-key': this.apiKey!,
        'Content-Type': 'application/json',
      },
      data: {
        name: filename,
        dataId,
        size,
        metadata: meta,
      },
    };

    let response = await axios(this.endpoints.GET_UPLOAD_DATA_URL, config);

    url = response.data?.uploadUrl;
    if (!url) {
      console.warn(`no upload url returned, can't upload ${filename}`);
      console.log(response.data);
      return;
    }

    const remoteFilePath = response.data?.remoteFilePath;
    // const buffer = await data.arrayBuffer();
    const uploadConfig: AxiosRequestConfig = {
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
      headers: {
        contentLength: `${size}`,
        contentLengthRange: `bytes 0-${size - 1}/${size}`,
        'content-type': 'application/octet-stream',
      },
      url,
      method: 'PUT',
      data,
    };
    console.log({ remoteFilePath, uploadConfig });
    await axios(uploadConfig);
  }
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
      channelSubscriptions?.delete(rpcId);
      r(response);
    });
    subscriptions.set(responseChannel, channelSubscriptions);

    // then send on requestChannel
    send(makeBusMessageFromJsonObject(requestChannel, requestPayload));
  });
};
