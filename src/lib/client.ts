import {
  deserializeWireMessage,
  makeBusMessageFromBuffer,
  makeBusMessageFromJsonObject,
} from './busMessage';
import { getToken } from './sessionToken';

type ListenerCallback = (event?: any) => void;
type SubscriptionCallback = (message?: any) => void;

export interface ConnectOptions {
  nodeWebSocket?: new (url: string | URL) => WebSocket;
  wsUrl: URL;
  apiKey?: string;
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
export class NstrumentaClient {
  private ws: WebSocket | null = null;
  private listeners: Map<string, Array<ListenerCallback>>;
  private subscriptions: Map<string, SubscriptionCallback[]>;
  private reconnection = { hasVerified: false, attempts: 0 };
  private messageBuffer: Array<ArrayBufferLike>;

  public connection: Connection = { status: ClientStatus.CONNECTED };

  constructor() {
    this.listeners = new Map();
    this.subscriptions = new Map();
    this.messageBuffer = [];
    this.addSubscription = this.addSubscription.bind(this);
    this.addListener = this.addListener.bind(this);
    this.connect = this.connect.bind(this);
  }

  public async connect(connectOptions: ConnectOptions) {
    const { nodeWebSocket, wsUrl, apiKey } = connectOptions;
    if (this.reconnection.attempts > 100) {
      throw new Error('Too many reconnection attempts, stopping');
    }
    const nstrumentaApiKey = apiKey || process.env.NSTRUMENTA_API_KEY;
    if (!nstrumentaApiKey) {
      throw new Error(
        'nstrumenta api key is missing, pass it as an argument to NsrumentaClient.connect({apiKey: "your key"}) for javascript clients in the browser, or set the NSTRUMENTA_API_KEY environment variable get a key from your nstrumenta project settings https://nstrumenta.com/projects/ *your projectId here* /settings'
      );
    }
    const token = await getToken(nstrumentaApiKey);

    this.ws = nodeWebSocket ? new nodeWebSocket(wsUrl) : new WebSocket(wsUrl);
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
      console.log(`client websocket closed <${wsUrl}>`, status);
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
    this.ws.addEventListener('error', (err) => {
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
      const { channel, busMessageType, contents } = deserializedMessage;
      if (channel == '_nstrumenta') {
        const { verified } = contents;
        if (verified) {
          this.connection.status = ClientStatus.CONNECTED;
          this.reconnection.hasVerified = true;
          this.listeners.get('open')?.forEach((callback) => callback());
          this.messageBuffer.forEach((message) => {
            this.ws?.send(message);
          });
          this.messageBuffer = [];
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
    //buffers messages sent before initial connection
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
}
