import { Mcap0Types } from '@mcap/core';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import { v4 as randomUUID } from 'uuid';
import type WebSocket from 'ws';
import {
  Ping,
  QueryOptions,
  RPC,
  StartRecording,
  StopRecording,
  Subscribe,
  Unsubscribe,
  getEndpoints,
  makeBusMessageFromJsonObject,
} from '../index';
import { makeBusMessageFromBuffer } from './busMessage';
import { z } from 'zod';

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

export type NstrumentaClientEvent =
  | 'open'
  | 'close'
  | 'status'
  | 'clients'
  | 'health'
  | 'subscriptions'
  | 'webrtcAnswer'
  | 'webrtcConnect';

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
    if (typeof process !== 'undefined') await process.nextTick(() => {});
    const response = await fetch(getEndpoints(apiKey).GET_TOKEN, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = (await response.json()) as { token: string };
    return data.token;
  } catch (err) {
    const message = `Problem getting token, check api key, err: ${(err as Error).message}`;
    throw new Error(message);
  }
};

export abstract class NstrumentaClientBase {
  public ws: WebSocketLike | null = null;
  public apiKey?: string;
  public mcp?: Client;
  private resourceSubscriptions: Map<string, Array<(uri: string) => void>> = new Map();
  public listeners: Map<string, Array<ListenerCallback>>;
  public subscriptions: Map<string, Map<string, SubscriptionCallback>>;
  public reconnection: Reconnection = { hasVerified: false, attempts: 0, timeout: null };
  public messageBuffer: Array<ArrayBufferLike | Buffer | Uint8Array>;
  public storage: StorageService;
  private datalogs: Map<string, Array<string>>;
  public clientId: string | null = null;
  private endpoints;

  public connection: Connection = { status: ClientStatus.INIT };
  private clientInfo: { name: string; version: string };

  constructor(apiKey?: string, clientInfo: { name: string; version: string } = { name: "nstrumenta-client", version: "1.0.0" }) {
    this.apiKey = apiKey;
    this.clientInfo = clientInfo;
    this.listeners = new Map();
    this.subscriptions = new Map();
    this.datalogs = new Map();
    this.messageBuffer = [];
    this.endpoints = apiKey ? getEndpoints(apiKey) : getEndpoints('http://localhost:5999');
    this.addSubscription = this.addSubscription.bind(this);
    this.addListener = this.addListener.bind(this);
    this.connect = this.connect.bind(this);
    this.storage = new StorageService({ apiKey: apiKey ?? '' });
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

  private bufferedSend(message: ArrayBufferLike | Buffer | Uint8Array) {
    // buffers messages sent before initial connection
    if (!(this.ws?.readyState === this.ws?.OPEN)) {
      console.log('adding to messageBuffer, length:', this.messageBuffer.length);
      this.messageBuffer.push(message);
    } else {
      this.ws?.send(message);
    }
  }

  public addSubscription = async (channel: string, callback: SubscriptionCallback) => {
    const { subscriptionId } = await this.callRPC<Subscribe>('subscribe', { channel });
    console.log(`Nstrumenta client subscribe <${channel}> subscriptionId:${subscriptionId}`);
    const channelSubscriptions = this.subscriptions.get(channel) || new Map();
    channelSubscriptions.set(subscriptionId, callback);
    this.subscriptions.set(channel, channelSubscriptions);

    return async () => {
      await this.callRPC<Unsubscribe>('unsubscribe', { channel, subscriptionId });
      this.subscriptions.get(channel)?.delete(subscriptionId);
    };
  };

  public addListener(eventType: NstrumentaClientEvent, callback: ListenerCallback) {
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

    const response = await fetch(this.endpoints.GET_UPLOAD_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey?.split(':')[0]!,
      },
      body: JSON.stringify({
        path,
        size,
        meta,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const responseData = (await response.json()) as { uploadUrl: string };
    url = responseData?.uploadUrl;

    const putResponse = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/octet-stream',
      },
      body: data,
    });

    if (!putResponse.ok) {
      throw new Error(`HTTP error! status: ${putResponse.status}`);
    }
  }
  public async ping() {
    return this.callRPC<Ping>('ping', {
      sendTimestamp: Date.now(),
    });
  }

  public async startLog(name: string, channels: string[], config?: LogConfig) {
    this.send('_nstrumenta', { command: 'startLog', name, channels, config });
  }

  public async startRecording(name: string, channels: string[], config?: LogConfig) {
    return this.callRPC<StartRecording>('startRecording', { name, channels, config });
  }

  public async stopRecording(name: string) {
    return this.callRPC<StopRecording>('stopRecording', { name });
  }

  public async finishLog(name: string) {
    console.log('finish log');
    this.send('_nstrumenta', { command: 'finishLog', name });
  }

  public async connectMcp() {
    if (!this.apiKey) throw new Error('apiKey required for MCP');
    
    const transport = new SSEClientTransport(
      new URL(`${this.endpoints.MCP_SSE}?apiKey=${this.apiKey.split(':')[0]}`)
    );
    
    this.mcp = new Client(this.clientInfo, {
      capabilities: {}
    });

    this.mcp.setNotificationHandler(
        z.object({ method: z.literal("notifications/resources/updated"), params: z.object({ uri: z.string() }) }),
        async (notification) => {
            const uri = notification.params.uri;
            const subs = this.resourceSubscriptions.get(uri);
            subs?.forEach(cb => cb(uri));
        }
    );

    await this.mcp.connect(transport);
  }

  public async subscribeToMcpResource(uri: string, callback: (uri: string) => void) {
      if (!this.mcp) await this.connectMcp();
      
      let subs = this.resourceSubscriptions.get(uri);
      if (!subs) {
          subs = [];
          this.resourceSubscriptions.set(uri, subs);
          await this.mcp!.request({
              method: "resources/subscribe",
              params: { uri }
          }, z.any());
      }
      subs.push(callback);
  }

  public async subscribeToAction(projectId: string, actionId: string, callback: (data: any) => void) {
      const uri = `projects://${projectId}/actions/${actionId}`;
      await this.subscribeToMcpResource(uri, async (_u) => {
          const result = await this.mcp!.request({
              method: "resources/read",
              params: { uri }
          }, z.any());
          
          // @ts-ignore
          const content = result.contents?.[0];
          if (content && content.text) {
              callback(JSON.parse(content.text));
          }
      });
  }

  public async callMcpTool<T>(toolName: string, args: Record<string, any>): Promise<T> {
    if (!this.apiKey) {
      throw new Error('apiKey not set');
    }
    const response = await fetch(this.endpoints.MCP, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'tools/call',
        params: {
          name: toolName,
          arguments: args,
        },
        id: Date.now(),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`MCP request failed: ${response.status} ${errorText}`);
    }

    const result = (await response.json()) as any;

    if (result.error) {
      throw new Error(`MCP error: ${result.error.message || 'Unknown error'}`);
    }

    const toolResult = result.result;
    if (toolResult.isError) {
      throw new Error(`Tool error: ${toolResult.content?.[0]?.text || 'Unknown error'}`);
    }

    if (toolResult.structuredContent) {
      return toolResult.structuredContent as T;
    }

    return toolResult.content?.[0]?.text
      ? JSON.parse(toolResult.content[0].text)
      : (toolResult as T);
  }

  async callRPC<T extends RPC>(type: T['type'], requestPayload: T['request']) {
    console.log('callRPC', type, requestPayload);
    const rpcId = randomUUID();
    const rpcChannelBase = `__rpc/${type}/${rpcId}`;
    const requestChannel = `${rpcChannelBase}/request`;
    const responseChannel = `${rpcChannelBase}/response`;
    return new Promise<T['response']>(async (r) => {
      // first subscribe to the responseChannel
      const channelSubscriptions = this.subscriptions.get(responseChannel) || new Map();
      channelSubscriptions.set(rpcId, (response: Subscribe['response']) => {
        channelSubscriptions?.delete(rpcId);
        r(response);
      });
      this.subscriptions.set(responseChannel, channelSubscriptions);

      // then send on requestChannel
      this.ws?.send(makeBusMessageFromJsonObject(requestChannel, requestPayload));
    });
  }
}

export interface StorageUploadParameters {
  filename: string;
  data: Blob;
  meta: Record<string, string>;
  dataId?: string;
  overwrite?: boolean;
}

export class StorageService {
  private apiKey?: string;
  private apiKeyHeader: string;
  private endpoints;

  constructor(props: { apiKey: string }) {
    this.apiKey = props.apiKey;
    this.apiKeyHeader = this.apiKey?.split(':')[0]!;
    this.endpoints = getEndpoints(this.apiKey);
  }

  async getDownloadUrl(path: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error('apiKey not set');
    }
    const response = await fetch(this.endpoints.GET_PROJECT_DOWNLOAD_URL, {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKeyHeader,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ path }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    console.log('REQ:', response);
    const data = (await response.json()) as { url: string };
    return data.url;
  }

  async download(path: string): Promise<Blob> {
    if (!this.apiKey) {
      throw new Error('apiKey not set');
    }
    const response = await fetch(this.endpoints.GET_PROJECT_DOWNLOAD_URL, {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKeyHeader,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ path }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const responseData = (await response.json()) as { url: string };
    console.log('REQ:', response);

    const fetchedResponse = await fetch(responseData.url, {
      method: 'GET',
    });

    if (!fetchedResponse.ok) {
      throw new Error(`HTTP error! status: ${fetchedResponse.status}`);
    }

    const fetched = await fetchedResponse.blob();
    return fetched;
  }

  async query({
    field,
    comparison,
    compareValue,
  }: QueryOptions): Promise<Array<Record<string, unknown>>> {
    if (!this.apiKey) {
      throw new Error('apiKey not set');
    }

    const data = {
      field,
      comparison,
      compareValue,
    };

    const config = {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKeyHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    };

    try {
      const response = await fetch(this.endpoints.QUERY_COLLECTION, config);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseData = (await response.json()) as Array<Record<string, unknown>>;
      return responseData;
    } catch (error) {
      console.log(`Something went wrong: ${(error as Error).message}`);
      return [];
    }
  }

  async list(type: string): Promise<string[]> {
    if (!this.apiKey) {
      throw new Error('apiKey not set');
    }

    const response = await fetch(this.endpoints.LIST_STORAGE_OBJECTS, {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKeyHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ type }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = (await response.json()) as string[];
    return data;
  }

  public async upload({ filename, data, meta, overwrite }: StorageUploadParameters) {
    const size = data.size || (data as any).length;
    let url;

    const config = {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKeyHeader!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: filename,
        size,
        metadata: meta,
        overwrite,
      }),
    };

    let response = await fetch(this.endpoints.GET_UPLOAD_DATA_URL, config);

    if (!response.ok) {
      console.warn(`HTTP error! status: ${response.status}`);
      return;
    }

    const responseData = (await response.json()) as { uploadUrl: string; remoteFilePath: string };
    url = responseData?.uploadUrl;
    if (!url) {
      console.warn(`no upload url returned, can't upload ${filename}`);
      console.log(responseData);
      return;
    }

    const remoteFilePath = responseData?.remoteFilePath;
    const uploadConfig = {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/octet-stream',
      },
      body: data,
    };

    console.log({ remoteFilePath, uploadConfig });
    const uploadResponse = await fetch(url, uploadConfig);

    if (!uploadResponse.ok) {
      console.warn(`HTTP error! status: ${uploadResponse.status}`);
      return;
    }
  }
}
