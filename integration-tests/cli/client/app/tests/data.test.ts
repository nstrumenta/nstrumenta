import { mkdir, writeFile } from 'fs/promises';
import { randomUUID } from 'node:crypto';
import { asyncSpawn } from '../utils/AsyncSpawn';
import { pollNstrumenta } from '../utils/PollNstrumenta';

const testId = process.env.TEST_ID || randomUUID();

describe('Data', () => {
  const testFolderBase = `./temp/${testId}/Data`;
  let testFile;
  let testFile2;
  let testFile3;

  beforeAll(async () => {
    testFile = `test-${testId}.txt`;
    testFile2 = `test2-${testId}.log`;
    testFile3 = `test3-${testId}.log`;

    await mkdir(`./${testFolderBase}`, { recursive: true });

    await writeFile(`${testFolderBase}/${testFile}`, `text file`, { encoding: 'utf8' });
    await writeFile(`${testFolderBase}/${testFile2}`, `${Date.now()}: test2`, { encoding: 'utf8' });
    await writeFile(`${testFolderBase}/${testFile3}`, `${Date.now()}: test3`, { encoding: 'utf8' });
  });

  describe('Upload', () => {
    test('single file', async () => {
      const result = await asyncSpawn(
        'nst',
        `data upload ${testFile} -t test-id-${testId}`.split(' '),
        { cwd: testFolderBase }
      );
      expect(result).toContain(`test-id-${testId}`);
    });

    test('multiple files', async () => {
      await asyncSpawn(
        'nst',
        `data upload ${testFile2} ${testFile3} --tags test-id-${testId}`.split(' '),
        { cwd: testFolderBase }
      );

      await pollNstrumenta({ matchString: testFile2 });
      await pollNstrumenta({ matchString: testFile3 });
    });
  });
});
