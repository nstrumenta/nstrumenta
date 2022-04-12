import axios from 'axios';
import { ChildProcess } from 'child_process';
import express from 'express';
import { createWriteStream } from 'fs';
import fs from 'fs/promises';
import serveIndex from 'serve-index';
import { Writable } from 'stream';
import { WebSocket, WebSocketServer } from 'ws';
import { asyncSpawn, createLogger, getNstDir } from '../cli/utils';
import { DEFAULT_HOST_PORT, endpoints } from '../shared';
import {
  deserializeWireMessage,
  makeBusMessageFromBuffer,
  makeBusMessageFromJsonObject,
} from './busMessage';
import { NstrumentaClient } from './client';
import { verifyToken } from './sessionToken';

const logger = createLogger();

type ListenerCallback = (event?: any) => void;

export type ServerStatus = {
  clientsCount: number;
  subscribedChannels: { [key: string]: { count: number } };
  activeChannels: { [key: string]: { timestamp: number } };
  children: number;
  agentId?: string;
};

export interface CommandRunModuleData {
  module: string;
  actionId: string;
  args?: string[];
}

export interface CommandStopModuleData {
  module: string;
}

export type AgentActionStatus = 'pending' | 'complete';

export type BackplaneCommand =
  | {
      task: 'runModule';
      actionId: string;
      status: AgentActionStatus;
      data: CommandRunModuleData;
    }
  | {
      task: 'stopModule';
      actionId: string;
      status: AgentActionStatus;
      data: CommandStopModuleData;
    };

export interface NstrumentaServerOptions {
  apiKey: string;
  port?: string;
  tag?: string;
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
  children: Map<string, ChildProcess> = new Map();
  cwd = process.cwd();
  logStreams?: Writable[];

  constructor(options: NstrumentaServerOptions) {
    this.options = options;
    this.listeners = new Map();
    logger.log('starting NstrumentaServer');
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

    const status: ServerStatus = {
      clientsCount: 0,
      subscribedChannels: {},
      activeChannels: {},
      children: this.children.size,
    };

    // server makes a local .nst folder at the cwd
    // this allows multiple servers and working directories on the same machine
    const cwdNstDir = `${this.cwd}/.nst`;
    await fs.mkdir(cwdNstDir, { recursive: true });

    logger.log(`nstrumenta working directory: ${cwdNstDir}`);

    const logFile = createWriteStream(`${cwdNstDir}/${Date.now()}-log.txt`);
    this.logStreams = [logFile];

    if (this.backplaneClient) {
      try {
        //get backplane url
        const data = this.options.tag ? { tag: this.options.tag } : undefined;
        let response = await axios(endpoints.REGISTER_AGENT, {
          method: 'post',
          headers: { 'x-api-key': apiKey, 'content-type': 'application/json' },
          data,
        });
        const {
          backplaneUrl,
          agentId,
          actionsCollectionPath,
        }: { backplaneUrl: string; agentId: string; actionsCollectionPath: string } = response.data;

        logger.setPrefix(`[agent ${this.options.tag || `${agentId.substring(0, 5)}...`}]`);
        status.agentId = agentId;
        if (backplaneUrl) {
          this.backplaneClient.addListener('open', () => {
            logger.log('Connected to backplane');
            const agentBackplaneStream = new Writable();
            agentBackplaneStream._write = (chunk, enc, next) => {
              this.backplaneClient?.send(`${agentId}/stdout`, chunk);
              next();
            };
            this.logStreams?.push(agentBackplaneStream);
            this.backplaneClient?.addSubscription(agentId, async (message: BackplaneCommand) => {
              const { task, actionId } = message;
              switch (task) {
                case 'runModule':
                  if (!message.data || !message.data.module) {
                    logger.log('Aborting: runModule command needs to specify data.module');
                    return;
                  }
                  const {
                    data: { module: moduleName, args },
                  } = message;

                  const logPath = `${await getNstDir(this.cwd)}/${moduleName}-${actionId}.txt`;
                  const stream = createWriteStream(logPath);
                  const backplaneStream = new Writable();
                  backplaneStream._write = (chunk, enc, next) => {
                    this.backplaneClient?.send(`${actionId}/stdout`, chunk);
                    next();
                  };

                  const process = await asyncSpawn(
                    'nstrumenta',
                    [
                      'module',
                      'run',
                      `--name=${moduleName}`,
                      '--non-interactive',
                      '--',
                      ...(args ? args : []),
                    ],
                    undefined,
                    undefined,
                    [stream, backplaneStream]
                  );
                  this.children.set(String(process.pid), process);
                  process.on('disconnect', () => this.children.delete(String(process.pid)));
                  break;
                case 'stopModule':
                  break;
                default:
                  logger.log('message from backplane', message);
              }
            });
            this.backplaneClient?.send('_nstrumenta', {
              command: 'registerAgent',
              agentId,
              actionsCollectionPath,
              tag: this.options.tag,
            });
          });

          await this.backplaneClient.connect({
            apiKey,
            nodeWebSocket: WebSocket as any,
            wsUrl: backplaneUrl,
          });
        }
      } catch (err) {
        logger.warn('failed to get backplaneUrl');
      }
    }

    const app = express();
    app.set('views', __dirname + '/../..');
    app.set('view engine', 'ejs');

    const server = require('http').Server(app);

    const wss = new WebSocketServer({ server: server });

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

    // serves from npm path for admin page
    app.use(express.static(__dirname + '/../../public'));
    app.use('/logs', express.static('logs'), serveIndex('logs', { icons: false }));

    //serves public subfolder from execution path for serving sandboxes
    const sandboxPath = `${await getNstDir(this.cwd)}/modules`;
    app.use('/modules', express.static(sandboxPath), serveIndex(sandboxPath, { icons: false }));

    app.get('/', (req, res) => {
      res.render('index', {
        apiKey,
        wsUrl: `ws://localhost:${port}`,
      });
    });

    app.get('/health', function (req, res) {
      res.status(200).send('OK');
    });

    const verifiedConnections: Map<string, WebSocket> = new Map();
    const subscriptions: Map<WebSocket, Set<string>> = new Map();

    setInterval(() => {
      updateStatus();
      this.listeners.get('status')?.forEach((callback) => callback(status));
      subscriptions.forEach((subChannels, subWebSocket) => {
        if (subChannels.has('_status')) {
          subWebSocket.send(makeBusMessageFromJsonObject('_status', status));
        }
      });
    }, 3000);

    setInterval(() => {
      verifiedConnections.forEach((connection) => {
        connection.send(
          makeBusMessageFromJsonObject('_nstrumenta', { type: 'health', sendTimestamp: Date.now() })
        );
      });
    }, 30000);

    wss.on('connection', async (ws, req) => {
      logger.log(req.headers);
      const clientId: string = req.headers['sec-websocket-key']!;

      logger.log('a user connected - clientsCount = ' + wss.clients.size);
      ws.on('message', async (busMessage: Buffer) => {
        if (!verifiedConnections.has(clientId)) {
          logger.log('attempting to verify token');
          // first message from a connected websocket must be a token
          const allowCrossProjectApiKey = this.allowCrossProjectApiKey;
          verifyToken({ token: busMessage.toString(), apiKey, allowCrossProjectApiKey })
            .then(() => {
              logger.log('verified', clientId, req.socket.remoteAddress);
              verifiedConnections.set(clientId, ws);
              ws.send(makeBusMessageFromJsonObject('_nstrumenta', { verified: true }));
              this.listeners
                .get('clients')
                ?.forEach((callback) => callback([...verifiedConnections.keys()]));
            })
            .catch((err) => {
              logger.log('unable to verify client, invalid token, closing connection', err.message);
              ws.send(
                makeBusMessageFromJsonObject('_nstrumenta', {
                  error: 'unable to verify client, invalid token, closing connection',
                })
              );
              ws.close();
            });
          return;
        }
        logger.log('busmessage', busMessage.toString('utf8'));

        let deserializedMessage;
        try {
          deserializedMessage = deserializeWireMessage(busMessage);
        } catch (error) {
          logger.log(`Couldn't handle ${(error as Error).message}`);
          return;
        }
        const { channel, busMessageType, contents } = deserializedMessage;

        if (contents?.command == 'subscribe') {
          const { channel } = contents;
          logger.log(`[nstrumenta] <subscribe> ${channel}`);
          if (!subscriptions.get(ws)) {
            subscriptions.set(ws, new Set([channel]));
          } else {
            subscriptions.get(ws)!.add(channel);
          }
          this.listeners.get('subscriptions')?.forEach((callback) => callback(subscriptions));
        }

        subscriptions.forEach((subChannels, subWebSocket) => {
          if (subChannels.has(channel)) {
            logger.log(`sending to subscription ${channel}`);
            subWebSocket.send(busMessage);
          }
        });

        if (debug) {
          logger.log(channel, busMessageType, contents);
        }
      });
      ws.on('close', function () {
        logger.log('client disconnected - clientsCount = ', wss.clients.size);
        subscriptions.delete(ws);
      });
    });

    const agentStream = new Writable();
    agentStream._write = (chunk, enc, next) => {
      subscriptions.forEach((subChannels, subWebSocket) => {
        const channel = `_${status.agentId}/stdout`;
        if (status.agentId && subChannels.has(channel)) {
          subWebSocket.send(makeBusMessageFromBuffer(channel, chunk));
        }
      });
      next();
    };
    this.logStreams.push(agentStream);
    this.logStreams.forEach((logStream) => {
      logger.logStream.pipe(logStream);
    });

    server.listen(port, function () {
      logger.log('listening on *:' + port);
    });
  }
}
