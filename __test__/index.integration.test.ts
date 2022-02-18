// import { asyncSpawn } from '../src/cli/utils';
import { ClientStatus, NstrumentaClient, SubscriptionCallback } from '../src/lib/client';
import { NstrumentaServer, NstrumentaServerOptions } from '../src/lib/server';
import ws from 'ws';
import { URL } from 'url';

process.stdout;

const VALID_API_KEY = '1dc6be5e-3000-4dc6-ae61-218c3472b662';
const PORT = '8888'; // Change asap; parallel jest tests will be not good

const urlString = `ws://localhost:${PORT}`;
const url = new URL(urlString);

// const minimalPath = './fixtures/nodejs/index.ts';
const serverOptions: NstrumentaServerOptions = { apiKey: VALID_API_KEY, port: PORT };

const createClientTest =
  ({
    subscriptions,
    data,
    port,
  }: {
    subscriptions: [channel: string, cb: SubscriptionCallback][];
    data: any;
    port: number;
  }) =>
  async () => {
    const nstClient = new NstrumentaClient();

    nstClient.addListener('open', () => {
      console.log(`nstClient OPEN: ${{ status: nstClient.connection.status }}`);
      subscriptions.forEach(([channel, cb]) => nstClient.addSubscription(channel, cb));
    });

    await nstClient.connect({
      apiKey: VALID_API_KEY,
      nodeWebSocket: ws as any,
      wsUrl: url,
    });

    console.log(`nstClient.connect run, status: ${nstClient.connection.status}`);
    nstClient.send('time', data);

    return nstClient;
  };

const closeNstrumentas = async ({
  client,
  server,
}: {
  client: NstrumentaClient;
  server: NstrumentaServer;
}) => {
  await client.close();
  await server.close();
  console.log(`client status after close: ${client.connection.status}`);
};

test('connect client to server and send message', async () => {
  let receivedMessage; // we'll assign this the received message on the client
  const data: Record<string, string> = { message: 'hi' };

  // Start the server for the client to listen to
  const server = new NstrumentaServer(serverOptions);
  await server.run();
  console.log(`server running on port ${server.runningPort}`);

  const subscriptions: [string, SubscriptionCallback][] = [
    [
      'time',
      (message) => {
        receivedMessage = message;
      },
    ],
  ];

  const run = createClientTest({ subscriptions, data, port: server.runningPort });
  // const spawned = await asyncSpawn('nst', ['agent', 'start'], {
  //   env: { NSTRUMENTA_API_KEY: VALID_API_KEY, NSTRUMENTA_PORT: PORT },
  // });

  const client = await run();
  try {
    // expect(receivedMessage).toEqual(data);
    expect(client.connection.status).toBe(ClientStatus.CONNECTED);
  } finally {
    await closeNstrumentas({ client, server });
  }
});
