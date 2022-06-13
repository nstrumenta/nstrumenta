import axios from 'axios';
import {
  BaseStorageService,
  ClientStatus,
  Connection,
  ConnectOptions,
  endpoints,
  ListenerCallback,
  NstrumentaClientBase,
  SubscriptionCallback,
} from '../shared';
import {
  deserializeWireMessage,
  makeBusMessageFromBuffer,
  makeBusMessageFromJsonObject,
} from '../shared/lib/busMessage';
import { getToken } from '../shared/lib/sessionToken';
import { WebSocket } from 'ws';

export class NstrumentaBrowserClient implements NstrumentaClientBase {
  private ws: WebSocket | null = null;
  private apiKey: string | null = null;
  private listeners: Map<string, Array<ListenerCallback>>;
  private subscriptions: Map<string, SubscriptionCallback[]>;
  private reconnection = { hasVerified: false, attempts: 0 };
  private messageBuffer: Array<ArrayBufferLike>;
  private datalogs: Map<string, Array<string>>;
  public clientId: string | null = null;

  public connection: Connection = { status: ClientStatus.INIT };

  constructor() {
    this.listeners = new Map();
    this.subscriptions = new Map();
    this.datalogs = new Map();
    this.messageBuffer = [];
    this.addSubscription = this.addSubscription.bind(this);
    this.addListener = this.addListener.bind(this);
    this.connect = this.connect.bind(this);
  }

  async shutdown(): Promise<void> {
    this.listeners.clear();
    this.subscriptions.clear();
    this.datalogs.clear();
    this.messageBuffer = [];
    this.ws?.close();
    return;
  }

  public async connect(connectOptions: ConnectOptions) {
    const { wsUrl, apiKey, verify = true } = connectOptions;
    if (this.reconnection.attempts > 100) {
      throw new Error('Too many reconnection attempts, stopping');
    }
    // intentionally not using cli resolveApiKey here since we
    // support browser clients that don't import the Conf lib
    const nstrumentaApiKey = apiKey || process.env.NSTRUMENTA_API_KEY;
    if (!nstrumentaApiKey) {
      throw new Error(
        'nstrumenta api key is missing, pass it as an argument to NstrumentaClient.connect({apiKey: "your key"}) for javascript clients in the browser, or set the NSTRUMENTA_API_KEY environment variable get a key from your nstrumenta project settings https://nstrumenta.com/projects/ *your projectId here* /settings'
      );
    }

    this.apiKey = nstrumentaApiKey;
    let token = 'unverified';
    if (verify) {
      try {
        token = await getToken(nstrumentaApiKey);
        // initiate the storage service for file upload/download
        this.storage = new StorageService({ apiKey: this.apiKey });
      } catch (error) {
        console.error((error as Error).message);
        throw error;
      }
    }
    this.ws = new WebSocket(wsUrl);
    this.ws.binaryType = 'arraybuffer';
    this.ws.addEventListener('open', async () => {
      console.log(`client websocket opened <${wsUrl}>`);
      this.ws?.send(token);
      this.reconnection.attempts = 0;
      this.connection.status = ClientStatus.CONNECTING;
    });
    this.ws.addEventListener('close', (status) => {
      this.connection.status = ClientStatus.DISCONNECTED;
      this.listeners.get('close')?.forEach((callback) => callback());
      console.log(
        `client websocket closed ${wsUrl} code:${status.code} wasClean:${status.wasClean}`
      );
      this.subscriptions.clear();
      // reconnect on close
      if (this.reconnection.hasVerified) {
        setTimeout(() => {
          console.log(`attempting to reconnect, attempts: ${this.reconnection.attempts}`);
          this.connect(connectOptions);
        }, this.rollOff(this.reconnection.attempts));
        this.reconnection.attempts += 1;
      }
    });
    this.ws.addEventListener('error', () => {
      console.log(`Error in websocket connection`);
      this.connection.status = ClientStatus.ERROR;
    });
    this.ws.addEventListener('message', (event) => {
      const wireMessage = event.data as ArrayBuffer;
      //console.log('nstClient received message', wireMessage);
      let deserializedMessage;
      try {
        deserializedMessage = deserializeWireMessage(wireMessage as ArrayBuffer);
      } catch (error) {
        console.log(`Couldn't deserialize message ${JSON.stringify(error)}`);
        return;
      }
      const { channel, contents } = deserializedMessage;
      if (channel == '_nstrumenta') {
        const { verified, error, clientId } = contents;
        if (error) {
          console.error(error);
        }
        if (verified) {
          this.connection.status = ClientStatus.CONNECTED;
          this.reconnection.hasVerified = true;
          this.listeners.get('open')?.forEach((callback) => callback());
          this.messageBuffer.forEach((message) => {
            this.ws?.send(message);
          });
          this.messageBuffer = [];
          this.clientId = clientId;
        }
      }

      this.subscriptions.get(channel)?.forEach((subscription) => {
        subscription(contents);
      });
    });

    return this.connection;
  }

  private rollOff(attempts: number) {
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

  public addSubscription(channel: string, callback: SubscriptionCallback) {
    console.log(`Nstrumenta client subscribe <${channel}>`);
    const channelSubscriptions = this.subscriptions.get(channel) || [];
    channelSubscriptions.push(callback);
    this.subscriptions.set(channel, channelSubscriptions);

    this.bufferedSend(makeBusMessageFromJsonObject('_command', { command: 'subscribe', channel }));
  }

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

  public finishDataLog(logName: string) {
    const log = this.datalogs.get(logName);
    if (log) {
      this.uploadData(`data/${logName}`, new Blob(log), {});
      this.datalogs.delete(logName);
    }
  }

  public async uploadData(path: string, data: Blob, meta: Record<string, string>) {
    const size = data.size;
    let url;
    const response = await axios.post(
      endpoints.GET_UPLOAD_URL,
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

  public async startLog(name: string, channels: string[]) {
    // TODO error on slashes ?
    this.send('_nstrumenta', { command: 'startLog', name, channels });
  }

  public async finishLog(name: string) {
    console.log('finish log');
    this.send('_nstrumenta', { command: 'finishLog', name });
  }

  storage?: StorageService;
}

class StorageService implements BaseStorageService {
  private apiKey: string;

  constructor(props: { apiKey: string }) {
    this.apiKey = props.apiKey;
  }
  async download(path: string): Promise<unknown> {
    const response = await axios(endpoints.GET_PROJECT_DOWNLOAD_URL, {
      method: 'post',
      headers: { 'x-api-key': this.apiKey, 'content-type': 'application/json' },
      data: { path },
    });
    console.log('REQ:', response.request);

    return response;
  }
  async list(type: string): Promise<string[]> {
    let response = await axios(endpoints.LIST_STORAGE_OBJECTS, {
      method: 'post',
      headers: { 'x-api-key': this.apiKey, 'content-type': 'application/json' },
      data: { type },
    });

    return response.data;
  }
  async upload(type: string, path: string, file: Buffer | Blob): Promise<void> {
    console.log('placeholder');
    return;
  }
}
