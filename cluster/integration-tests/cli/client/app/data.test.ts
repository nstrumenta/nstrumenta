import { mkdir, writeFile } from 'fs/promises';
import { randomUUID } from 'node:crypto';
import { asyncSpawn } from './AsyncSpawn';

const tempDir = './temp';
const testId = process.env.TEST_ID || randomUUID();

export const pollNstrumenta = async ({
  matchString,
  interval = 1000,
  timeout = 10000,
  command = 'data list',
}): Promise<string> => {
  const start = Date.now();
  let lastPollTime = start;
  console.log('starting polling for data...', { matchString });

  const response = await new Promise<string>(async function poll(resolve, reject) {
    await process.nextTick(() => {});
    const result = await asyncSpawn('nst', command.split(' '), { quiet: true });
    if (result.match(matchString)) {
      resolve(result);
      return;
    } else {
      if (Date.now() - start < timeout) {
        await new Promise((resolve) =>
          // wait enough time to fill the interval
          setTimeout(resolve, Math.max(0, interval - (Date.now() - lastPollTime)))
        );
        lastPollTime = Date.now();
        poll(resolve, reject);
      } else {
        console.error('exceeded timeout ', timeout);
        reject();
        return;
      }
    }
  });

  console.log('polling done', {
    requiredString: matchString,
    elapsed: Date.now() - start,
  });
  return response;
};

describe('Data', () => {
  let testFile;
  let testFile2;
  let testFile3;

  beforeAll(async () => {
    testFile = `test-${testId}.txt`;
    testFile2 = `test2-${testId}.log`;
    testFile3 = `test3-${testId}.log`;

    await mkdir(`./${tempDir}`, { recursive: true });

    await writeFile(`${tempDir}/${testFile}`, `text file`, { encoding: 'utf8' });
    await writeFile(`${tempDir}/${testFile2}`, `${Date.now()}: test2`, { encoding: 'utf8' });
    await writeFile(`${tempDir}/${testFile3}`, `${Date.now()}: test3`, { encoding: 'utf8' });
  });

  afterAll(async () => {
    // try {
    //   await rm(`./${tempDir}`, { recursive: true });
    // } catch (e) {}
  });

  describe('Upload', () => {
    test('single file', async () => {
      const result = await asyncSpawn(
        'nst',
        `data upload ${testFile} -t test-id-${testId}`.split(' '),
        { cwd: tempDir }
      );
      expect(result).toContain(`test-id-${testId}`);
    });

    test('multiple files', async () => {
      await asyncSpawn(
        'nst',
        `data upload ${testFile2} ${testFile3} --tags test-id-${testId}`.split(' '),
        { cwd: tempDir }
      );

      await pollNstrumenta({ matchString: testFile2 });
      await pollNstrumenta({ matchString: testFile3 });
    });
  });
});
