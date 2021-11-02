import {
  BusMessage,
  deserializeBlob,
  deserializeWireMessage,
  makeBusMessageFromJsonObject,
} from '../models/BusMessage';
import { DEFAULT_HOST_PORT } from '../index';

type ListenerCallback = (event?: any) => void;
type SubscriptionCallback = (message?: any) => void;

export interface NstrumentaClientOptions {
  apiKey: string;
  hostUrl?: string;
  projectId: string;
}

export class Nstrumenta {
  host: URL = new URL(`ws://localhost:${DEFAULT_HOST_PORT}`);
  listeners: Map<string, Array<ListenerCallback>>;
  subscriptions: Map<string, Array<SubscriptionCallback>>;
  ws: WebSocket;

  constructor({ apiKey, hostUrl, projectId }: NstrumentaClientOptions) {
    // TODO: validation of apiKey and projectId
    this.listeners = new Map();
    this.subscriptions = new Map();
    this.host = new URL(hostUrl ? hostUrl : this.host);
    this.ws = new WebSocket(this.host);
    this.subscribe = this.subscribe.bind(this);

    // messages from nstrumenta web app
    addEventListener('message', async (e) => {
      try {
        const { channel, contents } =
          typeof Blob !== 'undefined' && e.data instanceof Blob
            ? await deserializeBlob(e.data)
            : deserializeWireMessage(e.data);

        if (channel === '_command') {
          if (contents.command === 'reload') {
            console.log('reloading sandbox');
            window.location.reload();
          }
        }

        this.subscriptions.get(channel)?.forEach((callback) => {
          callback(contents);
        });
      } catch (e) {
        console.error('sandbox-client message error', e);
      }
    });
  }

  send(channel: string, message: Record<string, unknown>) {
    //buffer to handle messages before initial connection with parent
    console.log('sandbox-client send', channel, message);
    // this.ws.send(makeBusMessageFromJsonObject(channel, message));
    this.ws.send(`placeholder : send <${channel}> | ${message}`);
  }

  subscribe(channel: string, callback: SubscriptionCallback) {
    console.log(`Nstrumenta client subscribe <[>${channel}>`);
    const channelSubscriptions = this.subscriptions.get(channel) || [];
    channelSubscriptions.push(callback);

    // this.ws.send(makeBusMessageFromJsonObject('_command', { command: 'subscribe', channel }));
    this.ws.send(`placeholder for command <_command'> | ${{ command: 'subscribe', channel }}`);
  }

  addListener(eventType: string, callback: ListenerCallback) {
    if (!this.listeners.get(eventType)) {
      this.listeners.set(eventType, []);
    }
    const listenerCallbacks = this.listeners.get(eventType);
    if (listenerCallbacks) {
      listenerCallbacks.push(callback);
    }
  }
}
