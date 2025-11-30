import { randomUUID } from 'node:crypto';
import { NstrumentaClient } from 'nstrumenta';

describe('NodeJS client', () => {
  let testId;

  beforeAll(() => {
    testId = process.env.TEST_ID || randomUUID();
    console.log({ testId, wsUrl: process.env.NSTRUMENTA_WS_URL });
  });

  describe('connection', () => {
    test('client connects and opens', async () => {
      expect(
        await new Promise((resolve, reject) => {
          console.debug('instantiating nstClient');
          const nstClient = new NstrumentaClient();
          nstClient.addListener('open', () => {
            console.debug('client open');
            nstClient.shutdown();
            return resolve(true);
          });
          nstClient.addListener('close', () => {
            console.debug('client closed');
            nstClient.shutdown();
            return reject();
          });
          console.debug('calling nstClient.connect');
          nstClient.connect({
            wsUrl: process.env.NSTRUMENTA_WS_URL,
          });
        })
      ).toBe(true);
    });

    test('client connects and receives status', async () => {
      expect(
        await new Promise((resolve, reject) => {
          console.debug('instantiating nstClient');
          const nstClient = new NstrumentaClient();
          nstClient.addListener('open', () => {
            console.debug('client open');
            nstClient.addSubscription('_status', (status) => {
              console.log({ status });
              nstClient.shutdown();
              return resolve(status);
            });
          });
          nstClient.addListener('close', () => {
            console.debug('client closed');
            nstClient.shutdown();
            return reject();
          });
          console.debug('calling nstClient.connect');
          nstClient.connect({
            wsUrl: process.env.NSTRUMENTA_WS_URL,
          });
        })
      ).toBeDefined();
    });
    test('ping', async () => {
      expect(
        await new Promise((resolve, reject) => {
          console.debug('instantiating nstClient');
          const nstClient = new NstrumentaClient();
          nstClient.addListener('open', async () => {
            console.debug('client open');
            const ping = await nstClient.ping();
            console.log(ping);
            nstClient.shutdown();
            return resolve(ping);
          });
          nstClient.addListener('close', () => {
            console.debug('client closed');
            nstClient.shutdown();
            return reject();
          });
          console.debug('calling nstClient.connect');
          nstClient.connect({
            wsUrl: process.env.NSTRUMENTA_WS_URL,
          });
        })
      ).toBeDefined();
    });
  });

  describe('logging', () => {
    test('creates a log', async () => {
      expect(
        await new Promise((resolve, reject) => {
          console.debug('instantiating nstClient');
          const nstClient = new NstrumentaClient();
          nstClient.addListener('open', async () => {
            console.debug('client open');
            const logName = `${Date.now()}.log`;
            await nstClient.startLog(logName, ['a', 'b']);

            // wait for log to start
            setTimeout(() => {
              [1, 2, 3, 4, 5].forEach((i) => {
                nstClient.send('a', { message: `${i} a` });
                nstClient.send('b', { message: `${i} b` });
              });
              nstClient.finishLog(logName);
              nstClient.shutdown();
              return resolve(true);
            }, 1000);
          });
          nstClient.addListener('close', () => {
            console.debug('client closed');
            return reject();
          });
          console.debug('calling nstClient.connect');
          nstClient.connect({
            wsUrl: process.env.NSTRUMENTA_WS_URL,
          });
        })
      ).toBeDefined();
    });

    test('creates an mcap log with ms timestamps', async () => {
      expect(
        await new Promise((resolve, reject) => {
          console.debug('instantiating nstClient');
          const nstClient = new NstrumentaClient();
          nstClient.addListener('open', async () => {
            console.debug('client open');
            const logName = `ms_timestamps_${Date.now()}.mcap`;
            await nstClient.startLog(logName, ['a', 'b'], {
              header: { profile: '', library: 'nodejs-client test' },
              channels: [
                {
                  schema: {
                    title: 'a',
                    type: 'object',
                    properties: { value: { type: 'string' } },
                  },
                  channel: {
                    topic: 'a',
                    messageEncoding: 'json',
                  },
                },
                {
                  schema: {
                    title: 'b',
                    type: 'object',
                    properties: { value: { type: 'string' } },
                  },
                  channel: {
                    topic: 'b',
                    messageEncoding: 'json',
                  },
                },
              ],
            });

            // wait for log to start
            setTimeout(() => {
              [1, 2, 3, 4, 5].forEach((i) => {
                nstClient.send('a', { value: i, timestamp: i });
                nstClient.send('b', { value: i + 2, timestamp: i });
              });
              nstClient.finishLog(logName);
              nstClient.shutdown();
              return resolve(true);
            }, 100);
          });
          nstClient.addListener('close', () => {
            console.debug('client closed');
            return reject();
          });
          console.debug('calling nstClient.connect');
          nstClient.connect({
            wsUrl: process.env.NSTRUMENTA_WS_URL,
          });
        })
      ).toBeDefined();
    });

    test('creates an mcap log with {s,ns} timestamps', async () => {
      expect(
        await new Promise((resolve, reject) => {
          console.debug('instantiating nstClient');
          const nstClient = new NstrumentaClient();
          nstClient.addListener('open', async () => {
            console.debug('client open');
            const logName = `ns_timestamps${Date.now()}.mcap`;
            await nstClient.startLog(logName, ['a', 'b'], {
              header: { profile: '', library: 'nodejs-client test' },
              channels: [
                {
                  schema: {
                    title: 'a',
                    type: 'object',
                    properties: { value: { type: 'string' } },
                  },
                  channel: {
                    topic: 'a',
                    messageEncoding: 'json',
                  },
                },
                {
                  schema: {
                    title: 'b',
                    type: 'object',
                    properties: { value: { type: 'string' } },
                  },
                  channel: {
                    topic: 'b',
                    messageEncoding: 'json',
                  },
                },
              ],
            });

            // wait for log to start
            setTimeout(() => {
              [1, 2, 3, 4, 5].forEach((i) => {
                nstClient.send('a', { value: i, timestamp: { sec: 100, nsec: i } });
                nstClient.send('b', { value: i + 2, timestamp: { sec: 100, nsec: i } });
              });
              nstClient.finishLog(logName);
              nstClient.shutdown();
              return resolve(true);
            }, 100);
          });
          nstClient.addListener('close', () => {
            console.debug('client closed');
            return reject();
          });
          console.debug('calling nstClient.connect');
          nstClient.connect({
            wsUrl: process.env.NSTRUMENTA_WS_URL,
          });
        })
      ).toBeDefined();
    });

  });
  describe('data', () => {
    test('query', async () => {
      // Init
      const nstClient = new NstrumentaClient();
      await nstClient.connect({
        wsUrl: process.env.NSTRUMENTA_WS_URL,
      });

      const filename = `data-query-${testId}.txt`;
      // Set up test data
      await nstClient.storage.upload({
        filename,
        data: Buffer.from('hello world') as unknown as Blob,
        meta: { testId },
      });
      await new Promise((res) => setTimeout(res, 2000));

      // Assert
      const queryData = await nstClient.storage.query({
        field: 'name',
        comparison: '==',
        compareValue: filename,
      });

      expect(queryData).toBeDefined();
      expect(queryData.length).toBeGreaterThan(0);

      await nstClient.shutdown();
    }, 30000);
  });
});
