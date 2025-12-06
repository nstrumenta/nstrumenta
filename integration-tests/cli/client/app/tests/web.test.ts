import { mkdir, writeFile } from 'fs/promises';
import { randomUUID } from 'node:crypto';
import { asyncSpawn } from '../utils/AsyncSpawn';
import { pollNstrumenta } from '../utils/PollNstrumenta';

const testId = process.env.TEST_ID || randomUUID();

describe('web', () => {
  const testFolderBase = `./temp/${testId}/web`;
  const moduleName = `web-module-${testId}`;

  beforeAll(async () => {
    const version = `0.0.${Date.now()}`;
    await mkdir(`${testFolderBase}/.nstrumenta`, { recursive: true });

    const projectId = (
      await asyncSpawn('nst', `project id`.split(' '), {
        cwd: testFolderBase,
      })
    ).trim();

    console.log({ projectId });

    // Write a config.json file
    await writeFile(
      `${testFolderBase}/.nstrumenta/config.json`,
      `{
      "modules": [
        {
          "folder": "./web-module"
        }
      ]
    }
    `,
      { encoding: 'utf8' }
    );

    // module (with connection)
    await mkdir(`${testFolderBase}/web-module`, { recursive: true });

    // Write a module file
    await writeFile(
      `${testFolderBase}/web-module/nstrumentaModule.json`,
      `{
          "nstrumentaModuleType": "web",
          "version": "${version}",
          "name": "${moduleName}"
        }`,
      { encoding: 'utf8' }
    );

    // Write a script
    await writeFile(
      `${testFolderBase}/web-module/index.html`,
      `<!doctype html>
<html lang=en>
  <head>
    <meta charset=utf-8>
    <title>${testId}</title>
  </head>
  <body>
  </body>
</html>
      `,
      { encoding: 'utf8' }
    );
  });

  test('publish', async () => {
    const output = await asyncSpawn('nst', 'module publish'.split(' '), {
      cwd: testFolderBase,
      env: process.env,
    });
    console.log(output);
    expect(output).not.toContain('Request failed');

    const result = await pollNstrumenta({
      matchString: moduleName,
      interval: 1_000,
      timeout: 8_000,
      command: `module list --filter ${moduleName}`,
    });
    expect(result).toEqual(expect.stringMatching(moduleName));
  }, 10_000);

  test('host', async () => {
    console.log(`nst module host ${moduleName}`);
    const output = await asyncSpawn('nst', `module host ${moduleName} -- ${testId}`.split(' '), {
      cwd: testFolderBase,
    });

    expect(output).toBeTruthy();
  }, 5_000);
});
