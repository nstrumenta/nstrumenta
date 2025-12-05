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
    echo "Hello World!" > $2
    nst data upload --overwrite $2
    ;;
*)
    echo 'usage: ./script.sh [create] filename'
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
    const output = await asyncSpawn('nst', 'module publish'.split(' '), {
      cwd: testFolderBase,
      env: process.env,
    });
    console.log(output);
    expect(output).not.toContain('Request failed');

    const result = await asyncSpawn('nst', 'module list --json'.split(' '), {
      cwd: testFolderBase,
      env: process.env,
      quiet: true,
    });
    const modules = JSON.parse(result);
    const match = modules.find((m: any) => m.name.includes(moduleName));
    expect(match).toBeTruthy();
  }, 60_000);

  test('cloud-run-module', async () => {
    const uploadFileName = `cloud-run-module-${testId}.txt`;
    const imageRepository = process.env.IMAGE_REPOSITORY;
    const imageVersionTag = process.env.IMAGE_VERSION_TAG;
    let imageArg = '';
    if (imageRepository && imageVersionTag) {
      imageArg = `--image ${imageRepository}/data-job-runner:${imageVersionTag}`;
    }

    console.log(
      `nst module cloud-run ${moduleName} --command-args create ${uploadFileName} ${imageArg}`
    );
    await asyncSpawn(
      'nst',
      `module cloud-run ${moduleName} --command-args create ${uploadFileName} ${imageArg}`.split(
        ' '
      ),
      { cwd: testFolderBase }
    );

    const result = await pollNstrumenta({
      matchString: uploadFileName,
      command: 'data list',
      interval: 5000,
      timeout: 600_000,
    });
    await expect(result).toEqual(expect.stringMatching(uploadFileName));
  }, 600_000);
});
