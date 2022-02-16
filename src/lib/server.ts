import express from 'express';
import serveIndex from 'serve-index';
import { WebSocket, WebSocketServer } from 'ws';
import { DEFAULT_HOST_PORT } from '../shared';
import { deserializeWireMessage, makeBusMessageFromJsonObject } from './busMessage';
import { verifyToken } from './sessionToken';

export interface ServerStatus {
  clientsCount: number;
  subscribedChannels: { [key: string]: { count: number } };
  activeChannels: { [key: string]: { timestamp: number } };
}

export interface NstrumentaServerOptions {
  apiKey: string;
  port?: string;
  debug?: boolean;
}

export class NstrumentaServer {
  options: NstrumentaServerOptions;

  constructor(options: NstrumentaServerOptions) {
    this.options = options;
    console.log('starting NstrumentaServer');
    this.run = this.run.bind(this);
  }

  async run() {
    const { apiKey, debug } = this.options;
    const port = this.options.port || DEFAULT_HOST_PORT;

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

    const verifiedConnections: Array<WebSocket> = [];
    const subscriptions: Map<WebSocket, Set<string>> = new Map();

    wss.on('connection', async function connection(ws, req) {
      console.log('a user connected - clientsCount = ' + wss.clients.size);
      ws.on('message', async function incoming(busMessage: Buffer) {
        if (!verifiedConnections.includes(ws)) {
          console.log('attempting to verify token');
          // first message from a connected websocket must be a token
          verifyToken({ token: busMessage.toString(), apiKey })
            .then(() => {
              console.log('verified', req.socket.remoteAddress);
              verifiedConnections.push(ws);
              ws.send(makeBusMessageFromJsonObject('_nstrumenta', { verified: true }));
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
