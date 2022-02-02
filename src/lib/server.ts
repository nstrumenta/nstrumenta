import axios, { AxiosError } from 'axios';
import { DEFAULT_HOST_PORT, endpoints } from '../shared';
import { WebSocket, WebSocketServer } from 'ws';
import express from 'express';
import { deserializeWireMessage, makeBusMessageFromJsonObject } from './busMessage';
import serveIndex from 'serve-index';

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
    if (!process.env.NODE)
      throw new Error(
        'NstrumentaServer requires a node environment (browser does not support running a Websocket Server)'
      );
    this.options = options;
    console.log('starting NstrumentaServer');
    this.run = this.run.bind(this);
  }

  async run() {
    const { apiKey, debug } = this.options;
    const port = this.options.port || DEFAULT_HOST_PORT;
    const headers = {
      'x-api-key': apiKey,
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

      //send host status to all subscribers
      const channel = '_host-status';
      subscriptions.forEach((subChannels, subWebSocket) => {
        if (subChannels.has(channel)) {
          console.log(`sending to subscription ${channel} ${subWebSocket.url}`);
          const busMessage = makeBusMessageFromJsonObject(
            '_host-status',
            JSON.parse(JSON.stringify(status))
          );
          subWebSocket.send(busMessage.buffer);
        }
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

    const subscriptions: Map<WebSocket, Set<string>> = new Map();

    wss.on('connection', function connection(ws) {
      console.log('a user connected - clientsCount = ' + wss.clients.size);

      ws.on('message', function incoming(busMessage: Buffer) {
        console.log(busMessage);
        let deserializedMessed;
        try {
          deserializedMessed = deserializeWireMessage(busMessage);
        } catch (error) {
          console.log(`Couldn't handle ${(error as Error).message}`);
          return;
        }
        const { channel, busMessageType, contents } = deserializedMessed;

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
