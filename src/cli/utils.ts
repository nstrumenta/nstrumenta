import axios from 'axios';
import { spawn } from 'child_process';
import fs from 'fs/promises';
import Inquirer from 'inquirer';
import nodePath from 'node:path';
import path from 'path';
import semver from 'semver';
import tar from 'tar';
import { Module, ModuleExtended } from './commands/module';

import { getEndpoints } from '../shared';

export const apiUrl = process.env.NSTRUMENTA_API_KEY
  ? atob(process.env.NSTRUMENTA_API_KEY?.split(':')[1]!)
  : undefined;
export const endpoints = getEndpoints(apiUrl);

const prompt = Inquirer.createPromptModule();

export interface Keys {
  [key: string]: string;
}

export const resolveApiKey = () => {
  let apiKey = process.env.NSTRUMENTA_API_KEY?.split(':')[0];

  if (!apiKey) {
    throw new Error(
      'nstrumenta api key is not set, set the NSTRUMENTA_API_KEY environment variable, get a key from your nstrumenta project settings https://nstrumenta.com/projects/ *your projectId here* /settings'
    );
  }

  return apiKey;
};

export async function asyncSpawn(
  cmd: string,
  args?: string[],
  options?: {
    cwd?: string;
    shell?: boolean;
    stdio?: 'pipe' | 'inherit';
    env?: Record<string, string>;
    quiet?: boolean;
  },
  errCB?: (code: number) => void
) {
  if (!options?.quiet) {
    console.log(`${cmd} ${args?.join(' ')}`);
  }
  args = args || [];
  options = { ...options };
  const childProcess = spawn(cmd, args, options);

  let output = '';
  let error = '';
  if (childProcess.stdout && childProcess.stderr) {
    for await (const chunk of childProcess.stdout) {
      output += chunk;
    }
    for await (const chunk of childProcess.stderr) {
      error += chunk;
    }
  }
  const code: number = await new Promise((resolve) => {
    childProcess.on('close', resolve);
  });
  if (code) {
    if (errCB) {
      errCB(code);
    }

    throw new Error(`spawned process ${cmd} error code ${code}, ${error}`);
  }

  if (!options?.quiet) {
    console.log(`${cmd} ${args?.join(' ')}`, output, error);
  }
  return childProcess;
}

export const getFolderFromStorage = async (moduleTarName: string, options: { apiKey: string }) => {
  const { apiKey } = options;
  const nstDir = await getNstDir(process.cwd());
  const file = `${nodePath.join(nstDir, moduleTarName)}`;
  const extractFolder = nodePath.join(nstDir, moduleTarName.replace('.tar.gz', ''));
  try {
    await fs.access(extractFolder);
  } catch {
    await fs.mkdir(extractFolder, { recursive: true });
  }

  try {
    await fs.stat(file);
    console.log(`using cached version of ${file}`);
  } catch {
    console.log(`get ${moduleTarName} from storage`);

    // get the download url
    let url;
    const downloadUrlConfig = {
      headers: { 'x-api-key': apiKey, 'content-type': 'application/json' },
    };
    const downloadUrlData = { path: `modules/${moduleTarName}` };
    try {
      const downloadUrlResponse = await axios.post(
        endpoints.GET_PROJECT_DOWNLOAD_URL,
        downloadUrlData,
        downloadUrlConfig
      );
      url = downloadUrlResponse.data;
    } catch (error) {
      throw new Error(error as string);
    }

    // get the file, write to the nst directory
    console.log('get url', url);
    const res = await axios.get(url, { responseType: 'arraybuffer' });
    await fs.writeFile(file, res.data);

    console.log(`file written to ${file}`);
  }

  try {
    await asyncSpawn('tar', ['-zxvf', file], { cwd: extractFolder, quiet: true });
  } catch {
    try {
      const options = {
        gzip: true,
        file: file,
        cwd: extractFolder,
      };
      await tar.extract(options);
    } catch (err) {
      console.warn(`Error, problem extracting tar ${file} to ${extractFolder}`);
      throw err;
    }
  }

  return extractFolder;
};

export const inquiryForSelectModule = async (choices: string[]): Promise<string> => {
  const { module } = await prompt([{ type: 'list', name: 'module', message: 'Module', choices }]);
  return module;
};

export const getModuleFromStorage = async ({
  name,
  version: versionArg,
}: {
  name: string;
  version?: string;
}): Promise<ModuleExtended> => {
  const apiKey = resolveApiKey();

  const response = await axios(endpoints.LIST_MODULES, {
    method: 'post',
    headers: { 'x-api-key': apiKey, 'content-type': 'application/json' },
  });

  const serverModules = (response.data as string[])
    .filter((moduleTarName) => moduleTarName.startsWith(name))
    .map((match) => {
      return {
        moduleTarName: match,
        version: match.replace(`${name}-`, '').replace('.tar.gz', ''),
      };
    });

  const version = versionArg
    ? versionArg
    : serverModules
        .map(({ version }) => version)
        .sort(semver.compare)
        .reverse()
        .shift();

  const path = `${name}-${version}.tar.gz`;

  const folder = await getFolderFromStorage(path, { apiKey });

  let moduleConfig: Module;
  try {
    const file = await fs.readFile(`${folder}/nstrumentaModule.json`, { encoding: 'utf8' });
    moduleConfig = JSON.parse(file);
  } catch (err) {
    console.warn(`Error, can't find or parse the module's config file`);
    throw err;
  }

  return {
    folder: folder,
    ...moduleConfig,
  };
};

export function getVersionFromPath(path: string) {
  const match = /(\d+)\.(\d+).(\d+)/.exec(path);
  const version: string = match ? match[0] : '';
  return version;
}

export const getNstDir = async (cwd: string) => {
  // first look for .nst in cwd
  // agent run creates .nst in it's cwd for supporting
  // multiple independent agents on the same machine
  const cwdNstDir = `${cwd}/.nst`;
  try {
    const stat = await fs.stat(cwdNstDir);
    if (stat.isDirectory()) {
      return cwdNstDir;
    }
  } catch {
    // no cwd /.nst found, use __dirname/.nst below
  }

  // use __dirname/.nst , which is the location of installed .js
  // this is the typical case for running e.g. module publish
  // as a developer

  const nstDir = `${__dirname}/.nst`;
  await fs.mkdir(nstDir, { recursive: true });

  try {
    const stat = await fs.stat(nstDir);
    if (!stat.isDirectory()) {
      throw new Error('no .nst temp dir');
    }
  } catch (err) {
    console.warn((err as Error).message);
    throw err;
  }
  return nstDir;
};

export const getNearestConfigJson = async () => {
  let currentDir = '';
  let nextDir = process.cwd();
  let file;

  while (!file && currentDir !== nextDir) {
    try {
      currentDir = nextDir;
      file = await fs.readFile(path.join(currentDir, `.nstrumenta/config.json`), {
        encoding: 'utf8',
      });
    } catch (error) {
      nextDir = path.join(currentDir, '..');
    }
  }

  if (file === undefined) {
    throw new Error('No nstrumenta config found');
  }
  return { file, cwd: currentDir };
};

export async function* walkDirectory(
  dir: string,
  { maxDepth }: { maxDepth?: number } = {}
): AsyncGenerator<string> {
  const max = maxDepth ? maxDepth : Infinity;
  for await (const file of await fs.opendir(dir)) {
    if (max < 1) continue;
    const entry = path.join(dir, file.name);
    if (file.isDirectory()) yield* walkDirectory(entry, { maxDepth: max - 1 });
    else if (file.isFile()) yield entry;
  }
}
