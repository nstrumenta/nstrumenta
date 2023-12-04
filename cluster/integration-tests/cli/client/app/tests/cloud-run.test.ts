import { chmod, mkdir, writeFile } from 'fs/promises';
import { randomUUID } from 'node:crypto';
import { asyncSpawn } from '../utils/AsyncSpawn';
import { pollNstrumenta } from '../utils/PollNstrumenta';

const testId = process.env.TEST_ID || randomUUID();

describe('CloudRun', () => {
  const testFolderBase = `./temp/${testId}/CloudRun`;
  const moduleName = `module-${testId}`;

  beforeAll(async () => {
    const version = `0.0.${Date.now()}`;

    await mkdir(`./${testFolderBase}`, { recursive: true });

    const projectId = (
      await asyncSpawn('nst', `project id`.split(' '), {
        cwd: testFolderBase,
        quiet: true,
      })
    ).trim();

    console.log({ projectId });

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
      `${testFolderBase}/${testId}/nstrumentaModule.json`,
      `{
          "$schema": "https://raw.githubusercontent.com/nstrumenta/nstrumenta/main/module.schema.json",
          "nstrumentaModuleType": "script",
          "name": "${moduleName}",
          "version": "${version}",
          "entry": "./script.sh"
        }`,
      { encoding: 'utf8' }
    );

    // Write a script
    await writeFile(
      `${testFolderBase}/${testId}/script.sh`,
      `#!/bin/bash -xe
case $1 in
create)
    echo creating $2
    nst -v
    nst data mount
    echo "Hello World!" > ${projectId}/data/$2
    nst data unmount
    ;;
delete)
    echo deleting $2
    nst -v
    nst data mount
    rm ${projectId}/data/$2
    nst data unmount
    ;;
*)
    echo 'usage: ./script.sh [create|delete] filename'
    ;;
esac
    

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
    console.log(`api key: ${process.env.NSTRUMENTA_API_KEY}`);
    const output = await asyncSpawn('nst', 'module publish'.split(' '), {
      cwd: testFolderBase,
      env: process.env,
    });
    console.log(output);
    expect(output).not.toContain('Request failed');

    const result = await pollNstrumenta({
      matchString: moduleName,
      interval: 1_000,
      timeout: 20_000,
      command: 'module list',
    });
    expect(result).toEqual(expect.stringMatching(moduleName));
  }, 20_000);

  test('cloud-run-module', async () => {
    const uploadFileName = `cloud-run-module-${testId}.txt`;
    console.log(`nst module cloud-run ${moduleName} -- ${uploadFileName}`);
    await asyncSpawn(
      'nst',
      `module cloud-run ${moduleName} --command-args create ${uploadFileName}`.split(' '),
      { cwd: testFolderBase, quiet: true }
    );

    const result = await pollNstrumenta({
      matchString: uploadFileName,
      interval: 5_000,
      timeout: 30_000,
    });
    await expect(result).toBeTruthy();

    await asyncSpawn(
      'nst',
      `module cloud-run ${moduleName} --command-args delete ${uploadFileName}`.split(' '),
      { cwd: testFolderBase, quiet: true }
    );

    const deleteResult = await pollNstrumenta({
      matchString: uploadFileName,
      interval: 5_000,
      timeout: 30_000,
      inverseMatch: true,
    });
    await expect(deleteResult).toBeTruthy();
  }, 60_000);
});
