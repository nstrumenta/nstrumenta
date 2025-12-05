import { Mcap0Writer as McapWriter } from '@mcap/core';
import { ChildProcess } from 'child_process';
import { randomUUID } from 'crypto';
import express from 'express';
import { createWriteStream, WriteStream } from 'fs';
import { mkdir, open, readFile, stat } from 'fs/promises';
import serveIndex from 'serve-index';
import { WebSocket, WebSocketServer } from 'ws';
import { endpoints, getNstDir, resolveApiKey } from '../cli/utils';
import {
  LogConfig,
  NstrumentaClientEvent,
  NstrumentaRPCType,
  Ping,
  RPC,
  Subscribe,
  Unsubscribe,
} from '../shared';

import {
  BusMessageType,
  deserializeWireMessage,
  makeBusMessageFromJsonObject,
} from '../shared/lib/busMessage';
import { verifyToken } from '../shared/lib/sessionToken';
import { NstrumentaClient } from './client';
import { FileHandleWritable } from './fileHandleWriteable';

type ListenerCallback = (event?: any) => void;

export type ServerStatus = {
  clientsCount: number;
  subscribedChannels: { [key: string]: { count: number } };
  activeChannels: { [key: string]: { timestamp: number } };
  children: number;
};

export interface NstrumentaServerOptions {
  apiKey: string;
  port?: string;
  debug?: boolean;
  allowCrossProjectApiKey?: boolean;
  allowUnverifiedConnection?: boolean;
}

export type DataLog =
  | {
      type: 'stream';
      localPath: string;
      channels: string[];
      stream: WriteStream;
    }
  | {
      type: 'mcap';
      localPath: string;
      channels: string[];
      channelIds: Map<string, number>;
      mcapWriter: McapWriter;
    };

type TrackRecording = {
  filePath: string;
  stop: () => void;
};

export class NstrumentaServer {
  options: NstrumentaServerOptions;
  allowCrossProjectApiKey?: boolean;
  allowUnverifiedConnection: boolean;
  listeners: Map<NstrumentaClientEvent, Array<ListenerCallback>>;
  idIncrement = 0;
  children: Map<string, ChildProcess> = new Map();
  cwd = process.cwd() === '/' ? '' : process.cwd();
  dataLogs: Map<string, DataLog> = new Map();
  trackRecordings: Map<string, TrackRecording> = new Map();
  status: ServerStatus;

  constructor(options: NstrumentaServerOptions) {
    this.options = options;
    this.listeners = new Map();
    console.log(`starting NstrumentaServer`);
    this.run = this.run.bind(this);
    this.allowCrossProjectApiKey = options.allowCrossProjectApiKey;
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
    const port = this.options.port ?? 8088;
    // server makes a local .nst folder at the cwd
    // this allows multiple servers and working directories on the same machine
    const cwdNstDir = `${this.cwd}/.nst`;
    await mkdir(cwdNstDir, { recursive: true });

    console.log(`nstrumenta working directory: ${cwdNstDir}`);

    const app = express();
    app.set('views', __dirname + '/../..');

    const server = require('http').Server(app);

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

    const broadcastEventToClients = (event: NstrumentaClientEvent) => {
      verifiedConnections.forEach((connection) => {
        connection.send(makeBusMessageFromJsonObject('__event', { event, timestamp: Date.now() }));
      });
    };

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
      broadcastEventToClients('health');
    }, 30000);

    wss.on('connection', async (ws, req) => {
      console.log(req.headers);
      const clientId: string = req.headers['sec-websocket-key']!;

      console.log('a user connected - clientsCount = ' + wss.clients.size);
      ws.on('message', async (busMessage: Buffer) => {
        if (!verifiedConnections.has(clientId)) {
          try {
            if (!this.allowUnverifiedConnection) {
              console.log('attempting to verify token');
              // first message from a connected websocket must be a token
              await verifyToken({ token: busMessage.toString(), apiKey, allowCrossProjectApiKey: this.allowCrossProjectApiKey });
            }
            console.log(
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
            console.log(
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
          console.log(`Couldn't handle ${(error as Error).message}`);
          return;
        }
        const { channel, busMessageType, contents } = deserializedMessage;

        // RPCs from clients
        if (channel.startsWith('__rpc')) {
          const [base, type, id] = channel.split('/');
          const responseChannel = `${base}/${type}/${id}/response`;
          switch (type as NstrumentaRPCType) {
            case 'subscribe':
              {
                const { channel } = contents as Subscribe['request'];
                const subscriptionId = randomUUID();
                console.log(`[nstrumenta] <subscribe> ${channel}`);
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
                console.log(`[nstrumenta] <unsubscribe> ${channel} ${subscriptionId}`);
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
          }
        }

        // commands from clients
        // TODO replace with RPCs

        if (contents?.command == 'startLog') {
          const { channels, name, config } = contents;
          console.log(`[nstrumenta] <startLog> ${channels} ${JSON.stringify(config)}`);
          try {
            await this.startLog(name, channels, config);
          } catch (error) {
            console.log((error as Error).message);
          }
        }

        if (contents?.command == 'finishLog') {
          const { name } = contents;
          console.log(`[nstrumenta] <finishLog>`);
          await this.finishLog(name);
        }

        if (contents?.command == 'subscribe') {
          const { channel } = contents;
          console.log(`[nstrumenta] <subscribe> ${channel}`);
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
          if (dataLog.channels?.includes(channel)) {
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
                  data: new Uint8Array(Buffer.from(JSON.stringify(contents))),
                });
              }
            }
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

  private async respondRPC<T extends RPC>(ws: WebSocket, channel: string, response: T['response']) {
    await ws.send(makeBusMessageFromJsonObject(channel, response as Record<string, unknown>));
  }

  public async startLog(name: string, channels: string[], config?: LogConfig) {
    console.log('[server] <startLog>', { channels });
    const nstDir = await getNstDir(this.cwd);
    await mkdir(`${nstDir}/data`, { recursive: true }); // mkdir in case data dir doesn't yet exist
    const localPath = `${nstDir}/data/${randomUUID()}`;
    console.log({ name, cwdNstDir: nstDir, localPath });

    // set up dataLogs
    if (config) {
      const type = 'mcap';
      const fileHandle = await open(localPath, 'w');
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
            data: new Uint8Array(Buffer.from(JSON.stringify(c.schema))),
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
  }

  public async finishLog(name: string) {
    console.log(`<finishLog>: ${name}`);
    const dataLog = this.dataLogs.get(name);
    if (!dataLog) {
      console.warn('log name not found');
      return;
    }
    const { localPath } = dataLog;
    console.log(`Finishing log: ${dataLog?.localPath}`);
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
      console.log(`uploaded ${remoteFileLocation}`);
    } catch (error) {
      console.log(`Problem uploading log: ${name}, localPath: ${localPath}`);
    }
  }

  public async uploadLog({ localPath, name }: { localPath: string; name: string }) {
    let url = '';
    let size = 0;

    try {
      const apiKey = resolveApiKey();
      size = (await stat(localPath)).size;

      const data = {
        name,
        size,
      };

      const response = await fetch(endpoints.GET_UPLOAD_DATA_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseData = await response.json() as { uploadUrl: string; remoteFilePath: string };
      console.log('getUploadDataUrl response.data:', responseData);
      url = responseData?.uploadUrl;
    } catch (e) {
      let message = `can't upload ${localPath}`;
      if (e instanceof Error) {
        if (e.message.includes('409')) {
          console.log(`Conflict: file exists`);
        }
        message = `${message} [${e.message}]`;
      }
      throw new Error(message);
    }

    const fileBuffer = await readFile(localPath);

    // start the request, return promise
    try {
      const putResponse = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/octet-stream',
        },
        body: new Uint8Array(fileBuffer.buffer, fileBuffer.byteOffset, fileBuffer.byteLength),
      });

      if (!putResponse.ok) {
        throw new Error(`HTTP error! status: ${putResponse.status}`);
      }
    } catch (e) {
      console.error(`Error uploading file: ${(e as Error).message}`);
    }

    return name;
  }
}
