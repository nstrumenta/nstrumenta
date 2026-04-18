import { mkdir, writeFile } from 'fs/promises';
import { randomUUID } from 'node:crypto';
import { asyncSpawn } from '../utils/AsyncSpawn';

const testId = process.env.TEST_ID || randomUUID();

describe('web', () => {
  const testFolderBase = `./temp/${testId}/web`;
  const moduleName = `web-module-${testId}`;
  let projectId: string;
  let version: string;

  beforeAll(async () => {
    version = `0.0.${Date.now()}`;
    await mkdir(`${testFolderBase}/.nstrumenta`, { recursive: true });

    projectId = (
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
    expect(output).toContain('complete'); // Module upload completed
    
    // Verify module is available
    const result = await asyncSpawn('nst', `module list --filter ${moduleName}`.split(' '), { quiet: true });
    expect(result).toEqual(expect.stringMatching(moduleName));
  }, 10_000);

  test('host serves html from GCS', async () => {
    const hostOutput = await asyncSpawn('nst', `module host ${moduleName}`.split(' '), {
      cwd: testFolderBase,
    });
    console.log(hostOutput);
    expect(hostOutput).toContain('created action');

    // Poll module list until the url field is populated by the host action
    let hostedUrl = '';
    for (let i = 0; i < 30; i++) {
      const listOutput = await asyncSpawn('nst', 'module list --json'.split(' '), {
        cwd: testFolderBase,
        quiet: true,
      });
      const modules = JSON.parse(listOutput);
      const match = modules.find((m: any) => m.name === moduleName && m.url);
      if (match) {
        hostedUrl = match.url;
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    expect(hostedUrl).toBeTruthy();
    console.log(`hosted URL: ${hostedUrl}`);

    const response = await fetch(hostedUrl);
    expect(response.status).toBe(200);
    const htmlText = await response.text();
    expect(htmlText).toContain(`<title>${testId}</title>`);
  }, 90_000);
});
