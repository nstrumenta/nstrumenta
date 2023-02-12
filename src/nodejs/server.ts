import { Mcap0Writer as McapWriter } from '@mcap/core';
import axios from 'axios';
import { ChildProcess } from 'child_process';
import { randomUUID } from 'crypto';
import express from 'express';
import { createWriteStream } from 'fs';
import fs from 'fs/promises';
import serveIndex from 'serve-index';
import { Readable, Transform, Writable } from 'stream';
import { WebSocket, WebSocketServer } from 'ws';
import { asyncSpawn, createLogger, getNstDir, resolveApiKey } from '../cli/utils';
import {
  webrtcAnswer,
  webrtcCandidate,
  DEFAULT_HOST_PORT,
  webrtcJoin,
  LogConfig,
  Ping,
  webrtcPublish,
  RPC,
  Subscribe,
  Unsubscribe,
  getEndpoints,
} from '../shared';

import {
  BusMessageType,
  deserializeWireMessage,
  makeBusMessageFromBuffer,
  makeBusMessageFromJsonObject,
} from '../shared/lib/busMessage';
import { verifyToken } from '../shared/lib/sessionToken';
import { NstrumentaClient } from './client';
import { FileHandleWritable } from './fileHandleWriteable';
import WritableStream = NodeJS.WritableStream;
import {
  handleAnswer,
  handleCandidate,
  handleJoin,
  handlePublish,
} from './video/examples/server-demo/src/handler';
import { createContext } from './video/examples/server-demo/src/context/context';

const endpoints = process.env.NSTRUMENTA_LOCAL ? getEndpoints('local') : getEndpoints('prod');

const createPrefixTransform = (prefix: string) =>
  new Transform({
    transform(chunk, encoding, callback) {
      const str = `${prefix} ${chunk}`;
      callback(null, str);
    },
  });

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
  version?: string;
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

export type DataLog =
  | {
      type: 'stream';
      localPath: string;
      channels: string[];
      stream: WritableStream;
    }
  | {
      type: 'mcap';
      localPath: string;
      channels: string[];
      channelIds: Map<string, number>;
      mcapWriter: McapWriter;
    };

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
  dataLogs: Map<string, DataLog> = new Map();
  status: ServerStatus;

  constructor(options: NstrumentaServerOptions) {
    this.options = options;
    this.listeners = new Map();
    logger.log(`starting NstrumentaServer`);
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

        logger.setPrefix(
          `(${new Date()})[agent ${this.options.tag || `${agentId.substring(0, 5)}...`}]`
        );
        this.status.agentId = agentId;
        if (backplaneUrl) {
          this.backplaneClient.addListener('open', () => {
            logger.log(`Connected to backplane ${backplaneUrl}`);
            const agentBackplaneStream = new Writable();
            agentBackplaneStream._write = (chunk, enc, next) => {
              this.backplaneClient?.send(`${agentId}/stdout`, chunk);
              next();
            };
            this.logStreams?.push(agentBackplaneStream);
            this.backplaneClient?.addSubscription(agentId, async (message: BackplaneCommand) => {
              if (debug) {
                logger.log(message);
              }
              const { task, actionId } = message;
              switch (task) {
                case 'runModule':
                  if (!message.data || !message.data.module) {
                    logger.log('Aborting: runModule command needs to specify data.module');
                    return;
                  }
                  const {
                    data: { module: moduleName, args, version },
                  } = message;

                  const logPath = `${await getNstDir(this.cwd)}/${moduleName}-${actionId}.txt`;
                  const stream = createWriteStream(logPath);
                  const backplaneStream = new Writable();
                  backplaneStream._write = (chunk, enc, next) => {
                    this.backplaneClient?.send(`${actionId}/stdout`, chunk);
                    next();
                  };

                  console.log('running module', moduleName, version);
                  const childProcess = await asyncSpawn(
                    'nstrumenta',
                    [
                      'module',
                      'run',
                      `--name=${moduleName}`,
                      version ? `--module-version=${version}` : '',
                      '--non-interactive',
                      '--',
                      ...(args ? args : []),
                    ],
                    { stdio: 'pipe' },
                    undefined,
                    [stream, backplaneStream]
                  );
                  this.children.set(String(childProcess.pid), childProcess);
                  childProcess.on('disconnect', () =>
                    this.children.delete(String(childProcess.pid))
                  );
                  const transform = createPrefixTransform(`${moduleName}/${actionId}`);
                  childProcess.stdout = childProcess.stdout?.pipe(transform) as Readable;
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

          const storageStream = getStorageUploadIntervalStream(agentId);
          this.logStreams.push(storageStream);
        }
      } catch (err) {
        logger.warn('failed to get backplaneUrl');
      }
    }

    const app = express();
    app.set('views', __dirname + '/../..');

    const server = require('http').Server(app);

    // webrtc begin
    const weriftCtx = createContext();
    // webrtc end

    const wss = new WebSocketServer({ server: server });

    const updateStatus = () => {
      this.status.clientsCount = wss.clients.size;
      this.status.subscribedChannels = {};
      subscriptions.forEach((channels) => {
        channels.forEach((ids, channel) => {
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

    //serves public subfolder from execution path for serving sandboxes
    const sandboxPath = `${await getNstDir(this.cwd)}/modules`;
    app.use('/modules', express.static(sandboxPath), serveIndex(sandboxPath, { icons: false }));

    app.get('/health', function (req, res) {
      res.status(200).send('OK');
    });

    const verifiedConnections: Map<string, WebSocket> = new Map();
    const subscriptions: Map<WebSocket, Map<string, Set<string>>> = new Map();

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
            ws.send(makeBusMessageFromJsonObject('_nstrumenta', { verified: true, clientId }));
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

        let deserializedMessage;
        try {
          deserializedMessage = deserializeWireMessage(busMessage);
        } catch (error) {
          logger.log(`Couldn't handle ${(error as Error).message}`);
          return;
        }
        const { channel, busMessageType, contents } = deserializedMessage;

        // RPCs from clients
        if (channel.startsWith('__rpc')) {
          const [base, type, id] = channel.split('/');
          const responseChannel = `${base}/${type}/${id}/response`;
          switch (type) {
            case 'subscribe':
              {
                const { channel } = contents as Subscribe['request'];
                const subscriptionId = randomUUID();
                logger.log(`[nstrumenta] <subscribe> ${channel}`);
                if (!subscriptions.get(ws)) {
                  subscriptions.set(ws, new Map());
                }
                const channelSubscriptions = subscriptions.get(ws)!;
                if (!channelSubscriptions.get(channel)) {
                  channelSubscriptions.set(channel, new Set());
                }
                channelSubscriptions.get(channel)!.add(subscriptionId);

                this.respondRPC<Subscribe>(ws, responseChannel, { subscriptionId });
              }
              break;
            case 'unsubscribe':
              {
                const { channel, subscriptionId } = contents as Unsubscribe['request'];
                logger.log(`[nstrumenta] <unsubscribe> ${channel} ${subscriptionId}`);
                subscriptions.get(ws)?.get(channel)?.delete(subscriptionId);
                if (
                  subscriptions.get(ws)?.get(channel)?.size &&
                  subscriptions.get(ws)!.get(channel)!.size <= 1
                ) {
                  //remove subscription channel if all subscriptionIds are cleared
                  subscriptions.get(ws)!.delete(channel);
                }
                this.respondRPC<Unsubscribe>(ws, responseChannel, undefined);
              }
              break;
            case 'ping':
              {
                const { sendTimestamp } = contents as Ping['request'];
                this.respondRPC<Ping>(ws, responseChannel, {
                  sendTimestamp,
                  serverTimestamp: Date.now(),
                });
              }
              break;
            case 'webrtcJoin':
              {
                {
                  const { peerId, offer } = await handleJoin(weriftCtx);
                  this.respondRPC<webrtcJoin>(ws, responseChannel, { peerId, offer });
                }
              }
              break;
            case 'webrtcAnswer':
              {
                const { peerId, answer } = contents as webrtcAnswer['request'];
                {
                  await handleAnswer(weriftCtx, peerId, answer);
                  this.respondRPC<webrtcAnswer>(ws, responseChannel, {});
                }
              }
              break;
            case 'webrtcPublish':
              {
                const { peerId, track, simulcast, kind } = contents as webrtcPublish['request'];
                {
                  await handlePublish(weriftCtx, peerId, track, simulcast || false, kind);
                  this.respondRPC<webrtcPublish>(ws, responseChannel, {});
                }
              }
              break;
            case 'webrtcCandidate':
              {
                const { peerId, candidate } = contents as webrtcCandidate['request'];
                {
                  await handleCandidate(weriftCtx, peerId, candidate);
                  this.respondRPC<webrtcAnswer>(ws, responseChannel, {});
                }
              }
              break;
          }
        }

        // commands from clients
        // TODO replace with RPCs

        if (contents?.command == 'startLog') {
          const { channels, name, config } = contents;
          logger.log(`[nstrumenta] <startLog> ${channels} ${JSON.stringify(config)}`);
          try {
            await this.startLog(name, channels, config);
          } catch (error) {
            logger.log((error as Error).message);
          }
        }

        if (contents?.command == 'finishLog') {
          const { name } = contents;
          logger.log(`[nstrumenta] <finishLog>`);
          await this.finishLog(name);
        }

        if (contents?.command == 'subscribe') {
          const { channel } = contents;
          logger.log(`[nstrumenta] <subscribe> ${channel}`);
          const subscriptionId = randomUUID();
          if (!subscriptions.get(ws)) {
            subscriptions.set(ws, new Map());
          }
          const channelSubscriptions = subscriptions.get(ws)!;
          if (!channelSubscriptions.get(channel)) {
            channelSubscriptions.set(channel, new Set());
          }
          channelSubscriptions.get(channel)!.add(subscriptionId);

          this.listeners.get('subscriptions')?.forEach((callback) => callback(subscriptions));
        }

        // send busmessage to clients with relevant channel subscriptions

        subscriptions.forEach((subChannels, subWebSocket) => {
          if (subChannels.has(channel)) {
            subWebSocket.send(busMessage);
          }
        });

        this.dataLogs.forEach(async (dataLog) => {
          if (dataLog.channels.includes(channel)) {
            switch (dataLog.type) {
              case 'stream':
                {
                  if (busMessageType === BusMessageType.Json) {
                    dataLog.stream.write(JSON.stringify({ channel, contents }) + '\n');
                  } else {
                    dataLog.stream.write(busMessage);
                  }
                }
                break;
              case 'mcap': {
                const channelId = dataLog.channelIds.get(channel);
                if (channelId === undefined)
                  throw new Error(
                    `attempting to log unregistered mcap channel ${channel} - be sure to add channel to LogConfig`
                  );

                const logTime =
                  contents.timestamp !== undefined
                    ? contents.timestamp.sec !== undefined
                      ? BigInt(contents.timestamp.sec) * BigInt(1_000_000_000) +
                        BigInt(contents.timestamp.nsec)
                      : BigInt(contents.timestamp) * BigInt(1_000_000)
                    : BigInt(Date.now()) * BigInt(1_000_000);

                await dataLog.mcapWriter.addMessage({
                  channelId,
                  sequence: 0,
                  publishTime: logTime,
                  logTime: logTime,
                  data: Buffer.from(JSON.stringify(contents)),
                });
              }
            }
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

  private async respondRPC<T extends RPC>(ws: WebSocket, channel: string, response: T['response']) {
    await ws.send(makeBusMessageFromJsonObject(channel, response as Record<string, unknown>));
  }

  public async startLog(name: string, channels: string[], config?: LogConfig) {
    logger.log('[server] <startLog>', { channels });
    const nstDir = await getNstDir(this.cwd);
    await fs.mkdir(`${nstDir}/data`, { recursive: true }); // mkdir in case data dir doesn't yet exist
    const localPath = `${nstDir}/data/${randomUUID()}`;
    logger.log({ name, cwdNstDir: nstDir, localPath });
    if (config) {
      const type = 'mcap';
      const fileHandle = await fs.open(localPath, 'w');
      const fileHandleWritable = new FileHandleWritable(fileHandle);
      const mcapWriter = new McapWriter({
        writable: fileHandleWritable,
        useStatistics: true,
        useChunks: true,
        useChunkIndex: true,
      });
      await mcapWriter.start(config.header);

      const channelIds = new Map();
      await Promise.all(
        config.channels.map(async (c) => {
          const schemaId = await mcapWriter.registerSchema({
            name: c.schema.title,
            encoding: 'jsonschema',
            data: Buffer.from(JSON.stringify(c.schema)),
          });

          const channelId = await mcapWriter.registerChannel({
            schemaId,
            metadata: new Map(),
            ...c.channel,
          });
          return channelIds.set(c.channel.topic, channelId);
        })
      );

      this.dataLogs.set(name, { type, localPath, channels, channelIds, mcapWriter });
    } else {
      const type = 'stream';
      const stream = await createWriteStream(localPath);
      this.dataLogs.set(name, { type, localPath, channels, stream });
    }

    return this.dataLogs;
  }

  public async finishLog(name: string) {
    logger.log(`<finishLog>: ${name}`);
    const dataLog = this.dataLogs.get(name);
    if (!dataLog) throw new Error('log name not found');
    const { localPath } = dataLog;
    logger.log(`Finishing log: ${dataLog?.localPath}`);
    switch (dataLog?.type) {
      case 'stream':
        dataLog.stream.end();
        break;
      case 'mcap':
        dataLog.mcapWriter.end();
    }

    this.dataLogs.delete(name);

    try {
      const remoteFileLocation = await this.uploadLog({ localPath, name });
      logger.log(`uploaded ${remoteFileLocation}`);
    } catch (error) {
      logger.log(`Problem uploading log: ${name}, localPath: ${localPath}`);
    }
  }

  // @ts-ignore
  public async uploadLog({ localPath, name }: { localPath: string; name: string }) {
    let url = '';
    let size = 0;

    try {
      const apiKey = resolveApiKey();
      size = (await fs.stat(localPath)).size;

      const data = {
        name,
        size,
      };
      const response = await axios.post(endpoints.GET_UPLOAD_DATA_URL, data, {
        headers: {
          contentType: 'application/json',
          'x-api-key': apiKey,
        },
      });

      console.log('getUploadDataUrl response.data:', response.data);
      url = response.data?.uploadUrl;
    } catch (e) {
      let message = `can't upload ${localPath}`;
      if (axios.isAxiosError(e)) {
        if (e.response?.status === 409) {
          logger.log(`Conflict: file exists`);
        }
        message = `${message} [${(e as Error).message}]`;
      }
      throw new Error(message);
    }

    const fileBuffer = await fs.readFile(localPath);

    // start the request, return promise
    await axios.put(url, fileBuffer, {
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
      headers: {
        contentLength: `${size}`,
        contentLengthRange: `bytes 0-${size - 1}/${size}`,
      },
    });

    return name;
  }
}

const getStorageUploadIntervalStream = (agentId: string) => {
  const stream = new Writable();
  const buffer = { current: '' };
  stream._write = (chunk, enc, next) => {
    buffer.current += chunk;
    next();
  };

  const LOG_UPLOAD_INTERVAL = 15000;
  const interval = setInterval(async () => {
    if (buffer.current === '') return;

    const string = buffer.current;
    buffer.current = '';
    const logName = Date.now().toString();
    const path = `agents/${agentId}/logs/${logName}`;
    const response = await uploadString(path, string);
    console.log(`agent ${agentId} upload log [${logName}] response:`, response.status);
  }, LOG_UPLOAD_INTERVAL);

  stream.on('close', () => {
    console.log('*** END of LOG STREAM STORAGE! ***');
    clearInterval(interval);
  });

  return stream;
};

const uploadString = async (path: string, str: string) => {
  let url = '';
  const buffer = Buffer.from(str);
  let size = buffer.length;

  try {
    const apiKey = resolveApiKey();

    const data = {
      path,
      size,
    };
    const response = await axios.post(endpoints.GET_UPLOAD_URL, data, {
      headers: {
        contentType: 'application/json',
        'x-api-key': apiKey,
      },
    });

    url = response.data?.uploadUrl;
  } catch (e) {
    let message = `can't upload`;
    if (axios.isAxiosError(e)) {
      if (e.response?.status === 409) {
        logger.log(`Conflict: file exists`);
      }
      message = `${message} [${(e as Error).message}]`;
    }
    throw new Error(message);
  }

  // start the request, return promise
  return await axios.put(url, buffer, {
    maxBodyLength: Infinity,
    maxContentLength: Infinity,
    headers: {
      contentLength: `${size}`,
      contentLengthRange: `bytes 0-${size - 1}/${size}`,
    },
  });
};
