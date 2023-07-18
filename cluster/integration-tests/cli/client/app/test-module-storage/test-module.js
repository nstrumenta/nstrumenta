import { Blob } from 'node:buffer';
import { Readable } from 'node:stream';
import { NstrumentaClient } from 'nstrumenta';
import { ClientStatus } from "nstrumenta/dist/shared/index.js";

const run = new Promise(async (resolve, reject) => {
  const nstrumenta = new NstrumentaClient({ apiKey: process.env.NSTRUMENTA_API_KEY });

  console.log('process.argv', JSON.stringify(process.argv));
  if (process.argv.length != 4) {
    console.log('usage: node test-module.js [testId] [uploadFileName]');
    return;
  }
  const testId = process.argv[2];
  const uploadFileName = process.argv[3]

  nstrumenta.addListener('close', () => {
    console.log('close');
  });

  try {
    // now upload a file to watch for in the jest
    console.log('create config');
    const blob = new Blob([new TextEncoder().encode(JSON.stringify({ testId }, null, 2))], { type: 'application/json' });
    const data = Readable.from(blob.stream());
    const config = {
      filename: uploadFileName,
      data,
      meta: { testId },
      dataId: testId,
    };
    console.log('uploading file', config);
    try {
      await nstrumenta.storage.upload(config);
    } catch (e) {
      console.log('upload error', e);
    }
    console.log('upload complete');
    resolve(nstrumenta.shutdown());
  } catch (err) {
    reject(ClientStatus[err.message]);
  }
});

run.catch((err) => {
  console.log('error >', err);
});
