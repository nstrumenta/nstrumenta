import axios from 'axios';
import { ChildProcess } from 'child_process';
import express from 'express';
import { createWriteStream } from 'fs';
import fs from 'fs/promises';
import serveIndex from 'serve-index';
import { Writable } from 'stream';
import { WebSocket, WebSocketServer } from 'ws';
import { asyncSpawn, createLogger, getNstDir, resolveApiKey } from '../cli/utils';
import { DEFAULT_HOST_PORT, endpoints } from '../shared';
import {
  deserializeWireMessage,
  makeBusMessageFromBuffer,
  makeBusMessageFromJsonObject,
} from '../shared/lib/busMessage';
import { verifyToken } from '../shared/lib/sessionToken';
import { NstrumentaClient } from './client';
import WritableStream = NodeJS.WritableStream;

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
  allowUnverifiedConnection?: boolean;
}

export class NstrumentaServer {
  options: NstrumentaServerOptions;
  backplaneClient?: NstrumentaClient;
  allowCrossProjectApiKey: boolean;
  allowUnverifiedConnection: boolean;
  listeners: Map<string, Array<ListenerCallback>>;
  idIncrement = 0;
  children: Map<string, ChildProcess> = new Map();
  cwd = process.cwd();
  logStreams?: Writable[];
  activeChannelLogs: Map<string, { path: string; stream: WritableStream }> = new Map();
  status: ServerStatus;

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
    this.allowUnverifiedConnection =
      options.allowUnverifiedConnection !== undefined ? options.allowUnverifiedConnection : false;
    this.status = {
      clientsCount: 0,
      subscribedChannels: {},
      activeChannels: {},
      children: this.children.size,
    };
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
        this.status.agentId = agentId;
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

    const server = require('http').Server(app);

    const wss = new WebSocketServer({ server: server });

    const updateStatus = () => {
      this.status.clientsCount = wss.clients.size;
      this.status.subscribedChannels = {};
      subscriptions.forEach((channels) => {
        channels.forEach((channel) => {
          if (!this.status.subscribedChannels[channel]) {
            this.status.subscribedChannels[channel] = { count: 1 };
          } else {
            this.status.subscribedChannels[channel].count += 1;
          }
        });
      });

      //check for disconnected sensors
      for (const key in this.status.activeChannels) {
        if (this.status.activeChannels.hasOwnProperty(key)) {
          const element = this.status.activeChannels[key];
          //remove channel after 3s
          if (Date.now() - element.timestamp > 3e3) {
            delete this.status.activeChannels[key];
          }
        }
      }
    };

    // serves from npm path for admin page
    app.use(express.static(__dirname + '/../../public'));
    app.use('/logs', express.static('logs'), serveIndex('logs', { icons: false }));

    //serves public subfolder from execution path for serving sandboxes
    const sandboxPath = `${await getNstDir(this.cwd)}/modules`;
    app.use('/modules', express.static(sandboxPath), serveIndex(sandboxPath, { icons: false }));

    app.get('/health', function (req, res) {
      res.status(200).send('OK');
    });

    const verifiedConnections: Map<string, WebSocket> = new Map();
    const subscriptions: Map<WebSocket, Set<string>> = new Map();

    setInterval(() => {
      updateStatus();
      this.listeners.get('status')?.forEach((callback) => callback(this.status));
      subscriptions.forEach((subChannels, subWebSocket) => {
        if (subChannels.has('_status')) {
          subWebSocket.send(makeBusMessageFromJsonObject('_status', this.status));
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
          const allowCrossProjectApiKey = this.allowCrossProjectApiKey;
          try {
            if (!this.allowUnverifiedConnection) {
              logger.log('attempting to verify token');
              // first message from a connected websocket must be a token
              await verifyToken({ token: busMessage.toString(), apiKey, allowCrossProjectApiKey });
            }
            logger.log(
              this.allowUnverifiedConnection ? 'allowed unverified' : 'verified',
              clientId,
              req.socket.remoteAddress
            );
            verifiedConnections.set(clientId, ws);
            ws.send(makeBusMessageFromJsonObject('_nstrumenta', { verified: true }));
            this.listeners
              .get('clients')
              ?.forEach((callback) => callback([...verifiedConnections.keys()]));
          } catch (error) {
            logger.log(
              'unable to verify client, invalid token, closing connection',
              (error as Error).message
            );
            ws.send(
              makeBusMessageFromJsonObject('_nstrumenta', {
                error: 'unable to verify client, invalid token, closing connection',
              })
            );
            ws.close();
          }

          if (!this.allowUnverifiedConnection) {
            return;
          }
        }
        logger.log('[busmessage]', busMessage.toString('utf8'));

        let deserializedMessage;
        try {
          deserializedMessage = deserializeWireMessage(busMessage);
        } catch (error) {
          logger.log(`Couldn't handle ${(error as Error).message}`);
          return;
        }
        const { channel, busMessageType, contents } = deserializedMessage;

        // commands from clients

        if (contents?.command == 'startLog') {
          const { channels } = contents;
          logger.log(`[nstrumenta] <startLog> ${channels}`);
          try {
            await this.startLog(channels);
          } catch (error) {
            logger.log((error as Error).message);
          }
        }

        if (contents?.command == 'finishLog') {
          const { channels } = contents;
          logger.log(`[nstrumenta] <finishLog>`);
          await this.finishLog();
        }

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

        // send busmessage to clients with relevant channel subscriptions

        subscriptions.forEach((subChannels, subWebSocket) => {
          if (subChannels.has(channel)) {
            logger.log(`sending to subscription ${channel}`);
            subWebSocket.send(busMessage);
          }
        });

        this.activeChannelLogs.get(channel)?.stream.write(busMessage);

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
        const channel = `_${this.status.agentId}/stdout`;
        if (this.status.agentId && subChannels.has(channel)) {
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

  public async startLog(channels: string[]) {
    if (this.activeChannelLogs.size > 0) {
      throw new Error(`logs already running ${this.activeChannelLogs.keys().toString()}`);
    }

    logger.log('[server] <startLog>', { channels });
    for (const channel of channels) {
      const cwdNstDir = `${this.cwd}/.nst`;
      const dir = `${cwdNstDir}/logs`;
      await fs.mkdir(dir, { recursive: true });
      const path = `${dir}/${channel}-${Date.now()}.txt`;
      logger.log({ channel, cwdNstDir, path });
      const stream = await createWriteStream(path);
      this.activeChannelLogs.set(channel, { path, stream });
    }
    return this.activeChannelLogs;
  }

  public async finishLog() {
    logger.log(`<finishLog>: ${this.activeChannelLogs.keys()}`);
    for (const [channel, { path, stream }] of this.activeChannelLogs) {
      logger.log(`Ending stream: ${path}`);
      stream.end();
      this.activeChannelLogs.delete(channel);

      try {
        const remoteFileLocation = await this.uploadLog(path);
        logger.log(`uploaded ${remoteFileLocation}`);
      } catch (error) {
        logger.log(`Problem uploading log: ${path}`);
      }
    }
  }

  public async uploadLog(path: string) {
    let url = '';
    let size = 0;
    const cwdNstDir = `${this.cwd}/.nst`;
    const { agentId } = this.status;
    const remoteFileLocation = `agents/${agentId}/${path.replace(`${cwdNstDir}/`, '')}`;

    try {
      const apiKey = resolveApiKey();
      size = (await fs.stat(path)).size;

      const response = await axios.post(
        endpoints.GET_UPLOAD_URL,
        {
          path: remoteFileLocation,
          size,
        },
        {
          headers: {
            contentType: 'application/json',
            'x-api-key': apiKey,
          },
        }
      );

      url = response.data?.uploadUrl;
    } catch (e) {
      let message = `can't upload ${path}`;
      if (axios.isAxiosError(e)) {
        if (e.response?.status === 409) {
          logger.log(`Conflict: file exists`);
        }
        message = `${message} [${(e as Error).message}]`;
      }
      throw new Error(message);
    }

    const fileBuffer = await fs.readFile(path);

    // start the request, return promise
    await axios.put(url, fileBuffer, {
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
      headers: {
        contentLength: `${size}`,
        contentLengthRange: `bytes 0-${size - 1}/${size}`,
      },
    });
    return remoteFileLocation;
  }
}
