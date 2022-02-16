import axios from 'axios';
import { Command } from 'commander';
import Conf from 'conf';
import * as crypto from 'crypto';
import express from 'express';
import * as fs from 'fs';
import serveIndex from 'serve-index';
import { DEFAULT_HOST_PORT } from '../shared';
import { WebSocket, WebSocketServer } from 'ws';
import { Keys } from '../cli';
import { deserializeWireMessage, makeBusMessageFromJsonObject } from '../lib/busMessage';
import { getCurrentContext } from '../lib/context';
import { NstrumentaServer } from '../lib/server';
import { schema } from '../schema';

const config = new Conf(schema as any);

export const Start = async function (
  options: { port: string; project: string; debug: boolean },
  { args }: Command
): Promise<void> {
  console.log(options);
  const { port } = options;
  let apiKey = process.env.NSTRUMENTA_API_KEY;
  if (!apiKey) {
    try {
      apiKey = (config.get('keys') as Keys)[getCurrentContext().projectId];
    } catch {}
  } else {
    console.log('using NSTRUMENTA_API_KEY from environment variable');
  }

  if (!apiKey)
    throw new Error(
      'nstrumenta api key is not set, use "nst auth" or set the NSTRUMENTA_API_KEY environment variable, get a key from your nstrumenta project settings https://nstrumenta.com/projects/ *your projectId here* /settings'
    );

  const server = new NstrumentaServer({ apiKey, port: port || DEFAULT_HOST_PORT });

  await server.run();
};

const FormData = require('form-data');

export interface ServerStatus {
  clientsCount: number;
  subscribedChannels: { [key: string]: { count: number } };
  activeChannels: { [key: string]: { timestamp: number } };
}

export const Serve = async (options: { port: string; project: string; debug: boolean }) => {
  const { projectId: contextProjectId, wsHost: contextWSHost } = getCurrentContext();
  const contextWSPortRegExResult = /.*\:(\d+)$/.exec(contextWSHost);

  const port = Number(
    options.port ? options.port : contextWSPortRegExResult ? contextWSPortRegExResult[1] : 8088
  );
  console.log('port: ', port);

  const projectId = options.project ? options.project : contextProjectId;
  if (options.debug) console.log(options, port, projectId);

  const app = express();
  app.set('views', __dirname + '/../..');
  app.set('view engine', 'ejs');

  const server = require('http').Server(app);

  const wss = new WebSocketServer({ server: server });

  let src: string | undefined = undefined;

  //file stream
  let logfileWriter: fs.WriteStream | null = null;

  function appendToLog(event: unknown) {
    if (logfileWriter == null) {
      if (!fs.existsSync('./logs')) {
        fs.mkdirSync('./logs');
      }
      const dataDirectory = './logs/';
      const fileName = `nst${Date.now()}.ldjson`;
      const filePath = dataDirectory + fileName;
      logfileWriter = fs.createWriteStream(filePath, { flags: 'a' });
      console.log('starting log', fileName);

      logfileWriter.on('finish', () => {
        console.log(filePath, 'write finished');
        if (projectId) {
          console.log(`posting file ${filePath} to projectId ${projectId}`);
          const nstrumentaProjectUrl = `https://us-central1-nstrumenta-dev.cloudfunctions.net/uploadFile?projectId=${projectId}`;

          const form = new FormData();
          form.append('file', fs.readFileSync(filePath), fileName);
          const formHeaders = form.getHeaders();
          const request_config = {
            headers: {
              ...formHeaders,
              'Content-Type': 'multipart/form-data',
            },
          };
          axios.post(nstrumentaProjectUrl, form, request_config).catch((err) => {
            console.log(err);
          });
        }
      });
    }
    if (logfileWriter != null) {
      const data = JSON.stringify(event) + '\n';
      logfileWriter.write(data);
    }
  }

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
        subWebSocket.send(busMessage);
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

      if (channel) {
        appendToLog(contents);
        status.activeChannels[channel] = { timestamp: Date.now() };
      }

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

      if (options.debug) {
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
    broadcastStatus();
  });
};

const broadcastStatus = () => {
  if (!process.env.PROJECT_ID) return;

  const hostMachineWebhooksUrl = `https://us-central1-macro-coil-194519.cloudfunctions.net/hostMachineWebhooks`;

  const data = {
    sandboxId: process.env.SANDBOX_ID,
    sandboxInstanceId: process.env.SANDBOX_INSTANCE_ID,
    projectId: process.env.PROJECT_ID,
    hostInstanceId: process.env.HOST_INSTANCE_ID,
  };

  console.log('make webhook request with data', data);

  const digest = crypto
    .createHmac('sha1', 'nstrumenta') // TODO: make secret; but this webhook is also limiting to vpc internal traffix
    .update(JSON.stringify(data))
    .digest('hex');

  const config = {
    headers: {
      'x-hub-signature': `sha1=${digest}`,
    },
  };

  axios
    .post(hostMachineWebhooksUrl, data, config)
    .then(() => console.log('triggered hostMachines webhook'))
    .catch((err) => {
      console.log(err);
    });
};
