import axios from 'axios';
import express from 'express';
import serveIndex from 'serve-index';
import { WebSocket, WebSocketServer } from 'ws';
import { DEFAULT_HOST_PORT, endpoints } from '../shared';
import { deserializeWireMessage, makeBusMessageFromJsonObject } from './busMessage';
import { NstrumentaClient } from './client';
import { verifyToken } from './sessionToken';

type ListenerCallback = (event?: any) => void;
export interface ServerStatus {
  clientsCount: number;
  subscribedChannels: { [key: string]: { count: number } };
  activeChannels: { [key: string]: { timestamp: number } };
}

export interface NstrumentaServerOptions {
  apiKey: string;
  port?: string;
  debug?: boolean;
  noBackplane?: boolean;
  allowCrossProjectApiKey?: boolean;
}

export class NstrumentaServer {
  options: NstrumentaServerOptions;
  backplaneClient?: NstrumentaClient;
  allowCrossProjectApiKey: boolean;
  listeners: Map<string, Array<ListenerCallback>>;
  idIncrement = 0;

  constructor(options: NstrumentaServerOptions) {
    this.options = options;
    this.listeners = new Map();
    console.log('starting NstrumentaServer');
    this.run = this.run.bind(this);
    if (!options.noBackplane) {
      this.backplaneClient = new NstrumentaClient();
    }
    this.allowCrossProjectApiKey =
      options.allowCrossProjectApiKey !== undefined ? options.allowCrossProjectApiKey : false;
  }

  public addListener(
    eventType: 'clients' | 'subscriptions' | 'status',
    callback: ListenerCallback
  ) {
    if (!this.listeners.get(eventType)) {
      this.listeners.set(eventType, []);
    }
    const listenerCallbacks = this.listeners.get(eventType);
    if (listenerCallbacks) {
      listenerCallbacks.push(callback);
    }
  }

  public async run() {
    const { apiKey, debug } = this.options;
    const port = this.options.port || DEFAULT_HOST_PORT;

    if (this.backplaneClient) {
      try {
        //get backplane url
        let response = await axios(endpoints.REGISTER_AGENT, {
          method: 'post',
          headers: { 'x-api-key': apiKey, 'content-type': 'application/json' },
        });
        const { backplaneUrl, agentId, actionsCollectionPath } = response.data;
        if (backplaneUrl) {
          this.backplaneClient.addListener('open', () => {
            console.log('Connected to backplane');
            this.backplaneClient?.addSubscription(agentId, (message) => {
              console.log('message from backplane', message);
            });
            this.backplaneClient?.send('_nstrumenta', {
              command: 'registerAgent',
              agentId,
              actionsCollectionPath,
            });
          });

          this.backplaneClient.connect({
            apiKey,
            nodeWebSocket: WebSocket as any,
            wsUrl: backplaneUrl,
          });
        }
      } catch (err) {
        console.warn('failed to get backplaneUrl');
      }
    }

    const app = express();
    app.set('views', __dirname + '/../..');
    app.set('view engine', 'ejs');

    const server = require('http').Server(app);

    const wss = new WebSocketServer({ server: server });

    let src: string | undefined = undefined;

    let status: ServerStatus = {
      clientsCount: wss.clients.size as number,
      subscribedChannels: {},
      activeChannels: {},
    };

    function updateStatus() {
      status.clientsCount = wss.clients.size;
      status.subscribedChannels = {};
      subscriptions.forEach((channels) => {
        channels.forEach((channel) => {
          if (!status.subscribedChannels[channel]) {
            status.subscribedChannels[channel] = { count: 1 };
          } else {
            status.subscribedChannels[channel].count += 1;
          }
        });
      });

      //check for disconnected sensors
      for (const key in status.activeChannels) {
        if (status.activeChannels.hasOwnProperty(key)) {
          const element = status.activeChannels[key];
          //remove channel after 3s
          if (Date.now() - element.timestamp > 3e3) {
            delete status.activeChannels[key];
          }
        }
      }
    }

    setInterval(() => {
      updateStatus();
      this.listeners.get('status')?.forEach((callback) => callback(status));
    }, 3000);

    // serves from npm path for admin page
    app.use(express.static(__dirname + '/../../public'));
    app.use('/logs', express.static('logs'), serveIndex('logs', { icons: false }));

    //serves public subfolder from execution path for serving sandboxes
    app.use('/sandbox', express.static('public'), serveIndex('public', { icons: false }));

    app.get('/', function (req, res) {
      res.render('index', { src: src || 'placeholder.html' });
    });

    app.get('/health', function (req, res) {
      res.status(200).send('OK');
    });

    const verifiedConnections: Map<string, WebSocket> = new Map();
    const subscriptions: Map<WebSocket, Set<string>> = new Map();

    wss.on('connection', async (ws, req) => {
      console.log(req.headers);
      const clientId: string = req.headers['sec-websocket-key']!;

      console.log('a user connected - clientsCount = ' + wss.clients.size);
      ws.on('message', async (busMessage: Buffer) => {
        if (!verifiedConnections.has(clientId)) {
          console.log('attempting to verify token');
          // first message from a connected websocket must be a token
          const allowCrossProjectApiKey = this.allowCrossProjectApiKey;
          verifyToken({ token: busMessage.toString(), apiKey, allowCrossProjectApiKey })
            .then(() => {
              console.log('verified', clientId, req.socket.remoteAddress);
              verifiedConnections.set(clientId, ws);
              ws.send(makeBusMessageFromJsonObject('_nstrumenta', { verified: true }));
              this.listeners
                .get('clients')
                ?.forEach((callback) => callback([...verifiedConnections.keys()]));
            })
            .catch((err) => {
              console.log('unable to verify client, invalid token, closing connection', err);
              ws.close();
            });
          return;
        }
        console.log(busMessage);

        let deserializedMessage;
        try {
          deserializedMessage = deserializeWireMessage(busMessage);
        } catch (error) {
          console.log(`Couldn't handle ${(error as Error).message}`);
          return;
        }
        const { channel, busMessageType, contents } = deserializedMessage;

        if (contents?.command == 'subscribe') {
          const { channel } = contents;
          console.log(`[nstrumenta] <subscribe> ${channel}`);
          if (!subscriptions.get(ws)) {
            subscriptions.set(ws, new Set([channel]));
          } else {
            subscriptions.get(ws)!.add(channel);
          }
          this.listeners.get('subscriptions')?.forEach((callback) => callback(subscriptions));
        }

        subscriptions.forEach((subChannels, subWebSocket) => {
          if (subChannels.has(channel)) {
            console.log(`sending to subscription ${channel}`);
            subWebSocket.send(busMessage);
          }
        });

        if (debug) {
          console.log(channel, busMessageType, contents);
        }
      });
      ws.on('close', function () {
        console.log('client disconnected - clientsCount = ', wss.clients.size);
        subscriptions.delete(ws);
      });
    });

    server.listen(port, function () {
      console.log('listening on *:' + port);
    });
  }
}
