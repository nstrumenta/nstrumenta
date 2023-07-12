import { spawn } from 'child_process';
import { chmod, mkdir, writeFile } from 'fs/promises';
import { randomUUID } from 'node:crypto';
import { pollNstrumenta } from './data.test';

const nstVersion = require('./node_modules/nstrumenta/package.json').version;

const testId = process.env.TEST_ID || randomUUID();

console.log('testId', testId);

export async function asyncSpawn(
  cmd: string,
  args?: string[],
  options?: { cwd?: string; env?: Record<string, string>; quiet?: boolean },
  errCB?: (code: number) => void
) {
  if (!options?.quiet) console.log(`spawn [${cmd} ${args?.join(' ')}]`);
  const process = spawn(cmd, args || [], options);

  let output = '';
  for await (const chunk of process.stdout) {
    output += chunk;
  }
  let error = '';
  for await (const chunk of process.stderr) {
    error += chunk;
  }
  const code: number = await new Promise((resolve) => {
    process.on('close', resolve);
  });
  if (code) {
    if (errCB) {
      errCB(code);
    }

    throw new Error(`spawned process ${cmd} error code ${code}, ${error}`);
  }
  if (!options?.quiet) {
    console.log(`spawn ${cmd} output: ${output} stderr: ${error}`);
  }
  return output;
}

describe('Module', () => {
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
    const output = await asyncSpawn('npx', ['nst', '-v'], { env: process.env });
    expect(output).toContain(nstVersion);
  });

  describe('CloudRun', () => {
    test('publish', async () => {
      expect.assertions(1);

      const output = await asyncSpawn('npx', 'nst module publish'.split(' '), {
        cwd: testFolderBase,
        env: process.env,
      });
      const result = await pollNstrumenta(moduleName, 120_000, 'nst module list');
      expect(output).toEqual(expect.stringMatching(new RegExp(`modules.*${moduleName}`)));
    }, 60_000);

    test('cloud-run-module', async () => {
      const uploadFileName = `cloud-run-module-${testId}`;
      console.log(`nst module cloud-run ${moduleName} -- ${testId} ${uploadFileName}`);
      await asyncSpawn(
        'npx',
        `nst module cloud-run ${moduleName} -- ${testId} ${uploadFileName}`.split(' '),
        { cwd: testFolderBase, quiet: true }
      );

      const result = await pollNstrumenta(uploadFileName, 120_000);
      await expect(result).toBeTruthy();
    }, 60_000);
  });
});
