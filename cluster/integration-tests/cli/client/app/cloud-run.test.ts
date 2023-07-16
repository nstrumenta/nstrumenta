import { chmod, mkdir, writeFile } from 'fs/promises';
import { randomUUID } from 'node:crypto';
import { asyncSpawn } from './AsyncSpawn';
import { pollNstrumenta } from './data.test';

const testId = process.env.TEST_ID || randomUUID();

console.log('testId', testId);

describe('CloudRun', () => {
  const testFolderBase = './temp';
  const moduleName = `module-${testId}`;

  if (!process.env.NSTRUMENTA_API_KEY) return;

  beforeAll(async () => {
    const version = `0.0.${Date.now()}`;

    // Write a config.json file
    await mkdir(`${testFolderBase}/.nstrumenta`, { recursive: true });
    await writeFile(
      `${testFolderBase}/.nstrumenta/config.json`,
      `{
      "modules": [
        {
          "folder": "./${testId}",
          "name": "${moduleName}"
        }
      ]
    }
    `,
      { encoding: 'utf8' }
    );

    // module (with connection)
    await mkdir(`${testFolderBase}/${testId}`, { recursive: true });

    // Write a module file
    await writeFile(
      `${testFolderBase}/${testId}/module.json`,
      `{
          "$schema": "https://raw.githubusercontent.com/nstrumenta/nstrumenta/main/module.schema.json",
          "type": "script",
          "name": "${moduleName}",
          "version": "${version}",
          "entry": "./script.sh"
        }`,
      { encoding: 'utf8' }
    );

    // Write a script
    await writeFile(
      `${testFolderBase}/${testId}/script.sh`,
      `#!/bin/bash
nst -v
nst data mount
echo "Hello World!" > b/data/$2
nst data unmount
      `,
      { encoding: 'utf8' }
    );
    await chmod(`${testFolderBase}/${testId}/script.sh`, '755');
  });

  afterAll(async () => {
    //    await rm(`${testFolderBase}`, { recursive: true });
  });

  test('nst version', async () => {
    const output = await asyncSpawn('nst', ['-v'], { env: process.env });
    expect(output).toBeTruthy();
  });

  test('publish', async () => {
    console.log(`api key: ${process.env.NSTRUMENTA_API_KEY}`)
    const output = await asyncSpawn('nst', 'module publish'.split(' '), {
      cwd: testFolderBase,
      env: process.env,
    });
    console.log(output);
    expect(output).not.toContain('Request failed');

    const result = await pollNstrumenta(moduleName, 20_000, 'module list');
    expect(result).toEqual(expect.stringMatching(new RegExp(`modules.*${moduleName}`)));
  }, 20_000);

  test('cloud-run-module', async () => {
    const uploadFileName = `cloud-run-module-${testId}`;
    console.log(`nst module cloud-run ${moduleName} -- ${testId} ${uploadFileName}`);
    await asyncSpawn(
      'nst',
      `module cloud-run ${moduleName} -- ${testId} ${uploadFileName}`.split(' '),
      { cwd: testFolderBase, quiet: true }
    );

    const result = await pollNstrumenta(uploadFileName, 60_000);
    await expect(result).toBeTruthy();
  }, 60_000);
});
