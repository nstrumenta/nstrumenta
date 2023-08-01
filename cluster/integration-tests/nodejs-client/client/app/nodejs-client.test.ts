import { createCanvas } from 'canvas';
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

    test('creates an mcap log with images', async () => {
      expect(
        await new Promise(async (resolve, reject) => {
          console.debug('instantiating nstClient');
          const nstClient = new NstrumentaClient();
          nstClient.addListener('close', () => {
            console.debug('client closed');
            return reject();
          });
          console.debug('calling nstClient.connect');
          await nstClient.connect({
            wsUrl: process.env.NSTRUMENTA_WS_URL,
          });

          console.debug('client open');
          const logName = `images_${Date.now()}.mcap`;
          await nstClient.startLog(logName, ['a', 'b', 'camera'], {
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
              {
                schema: {
                  title: 'foxglove.CompressedImage',
                  type: 'object',
                  properties: {
                    timestamp: {
                      type: 'object',
                      title: 'time',
                      properties: {
                        sec: {
                          type: 'integer',
                          minimum: 0,
                        },
                        nsec: {
                          type: 'integer',
                          minimum: 0,
                          maximum: 999999999,
                        },
                      },
                      description: 'Timestamp of image',
                    },
                    frame_id: {
                      type: 'string',
                      description:
                        'Frame of reference for the image. The origin of the frame is the optical center of the camera. +x points to the right in the image, +y points down, and +z points into the plane of the image.',
                    },
                    data: {
                      type: 'string',
                      contentEncoding: 'base64',
                      description: 'Compressed image data',
                    },
                    format: {
                      type: 'string',
                      description: 'Image format',
                    },
                  },
                },
                channel: {
                  topic: 'camera',
                  messageEncoding: 'json',
                },
              },
            ],
          });

          // wait for log to start
          setTimeout(() => {
            [1, 2, 3, 4, 5].forEach((i) => {
              //make image with canvas
              const width = 1920;
              const height = 1080;
              const canvas = createCanvas(width, height);
              const ctx = canvas.getContext('2d');

              ctx.textAlign = 'center';
              ctx.fillStyle = '#fff';
              ctx.font = 'bold 70pt Menlo';
              ctx.fillText(`image:${i}`, width / 2, height / 2);

              const timestamp = { sec: i, nsec: i * 1e6 };
              nstClient.send('a', { value: i, timestamp });
              nstClient.send('b', { value: i + 2, timestamp });
              nstClient.send('camera', {
                data: canvas.toBuffer('image/jpeg').toString('base64'),
                frame_id: `${i}`,
                format: 'image/jpeg',
                timestamp,
              });
            });
            nstClient.finishLog(logName);
            nstClient.shutdown();
            return resolve(true);
          }, 100);
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
        data: 'hello world' as unknown as Blob,
        meta: { testId },
      });
      await new Promise((res) => setTimeout(res, 2000));

      // Assert
      const queryData = await nstClient.storage.query({
        field: 'name',
        comparison: '==',
        compareValue: filename,
      });

      expect(queryData).toMatchObject < Array<Record<string, unknown>>;

      await nstClient.shutdown();
    }, 30000);
  });
});
