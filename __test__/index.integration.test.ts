// import { asyncSpawn } from '../src/cli/utils';
import { ClientStatus, NstrumentaClient } from '../src/lib/client';
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

// test data
const data: Record<string, string> = { message: 'hi' };

const createClientTest = () => async () => {
  const nstClient = new NstrumentaClient();
  let result;

  nstClient.addListener('open', () => {
    nstClient.addSubscription('time', (message) => {
      result = message;
    });
  });

  await nstClient.connect({
    apiKey: VALID_API_KEY,
    nodeWebSocket: ws as any,
    wsUrl: url,
  });

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
};

test('connect client to server and send message', async () => {
  try {
    const run = createClientTest();
    // const spawned = await asyncSpawn('nst', ['agent', 'start'], {
    //   env: { NSTRUMENTA_API_KEY: VALID_API_KEY, NSTRUMENTA_PORT: PORT },
    // });

    // Start the server for the client to listen to
    const server = new NstrumentaServer(serverOptions);
    server.run();

    const client = await run();
    // expect(result).toEqual(data);
    expect(client.connection.status).toBe(ClientStatus.CONNECTED);
    await closeNstrumentas({ client, server });
  } catch (e) {
    console.log('errer');
  }
});
