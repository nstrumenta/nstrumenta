import axios from 'axios';
import { spawn } from 'child_process';
import { Module, ModuleConfig } from 'commands/module';
import Conf from 'conf';
import { createWriteStream } from 'fs';
import { Writable } from 'stream';
import fs from 'fs/promises';
import Inquirer from 'inquirer';
import nodePath from 'node:path';
import path from 'path';
import semver from 'semver';
import { pipeline as streamPipeline } from 'stream';
import tar from 'tar';
import { promisify } from 'util';
import { getCurrentContext } from '../lib/context';
import { schema } from '../schema';
import { endpoints } from '../shared';

const pipeline = promisify(streamPipeline);

const prompt = Inquirer.createPromptModule();

export interface Keys {
  [key: string]: string;
}

const config = new Conf(schema as any);

export const resolveApiKey = () => {
  let apiKey = process.env.NSTRUMENTA_API_KEY;
  if (!apiKey) {
    try {
      apiKey = (config.get('keys') as Keys)[getCurrentContext().projectId];
    } catch {}
  } else {
    console.log('using NSTRUMENTA_API_KEY from environment variable');
  }

  if (!apiKey)
    throw new Error(
      'nstrumenta api key is not set, use "nst auth" or set the NSTRUMENTA_API_KEY environment variable, get a key from your nstrumenta project settings https://nstrumenta.com/projects/ *your projectId here* /settings'
    );

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
  },
  errCB?: (code: number) => void,
  stream?: WriteStream
) {
  console.log(`spawn [${cmd} ${args?.join(' ')}]`);
  args = args || [];
  options = { ...options };
  const childProcess = spawn(cmd, args, options);

  let output = '';
  let error = '';
  if (stream) {
    childProcess.stdout?.pipe(stream);
    childProcess.stdout?.pipe(process.stdout);
  }
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

  console.log(`spawn ${cmd} output ${output}`);
  return childProcess;
}

export const getFolderFromStorage = async (
  storagePath: string,
  options: { apiKey: string; baseDir?: string }
) => {
  const { apiKey, baseDir = '' } = options;
  const nstDir = await getNstDir();
  const file = `${nodePath.join(nstDir, baseDir, storagePath)}`;
  const extractFolder = nodePath.join(nstDir, baseDir, storagePath.replace('.tar.gz', ''));
  try {
    await fs.access(extractFolder);
  } catch {
    await fs.mkdir(extractFolder, { recursive: true });
  }

  try {
    await fs.stat(file);
    console.log(`using cached version of ${file}`);
  } catch {
    console.log(`get ${storagePath} from storage`);

    // get the download url
    let url;
    try {
      const downloadUrlConfig = {
        headers: { 'x-api-key': apiKey, 'content-type': 'application/json' },
      };
      const downloadUrlData = { path: storagePath };
      const downloadUrlResponse = await axios.post(
        endpoints.GET_DOWNLOAD_URL,
        downloadUrlData,
        downloadUrlConfig
      );
      url = downloadUrlResponse.data;
    } catch (err) {
      throw new Error(`bad times, path: ${storagePath}`);
    }

    try {
      // get the file, write to the nst directory
      console.log('get url', url);
      const download = await axios.get(url, { responseType: 'stream' });
      const writeStream = createWriteStream(file);

      await pipeline(download.data, writeStream);
      console.log(`file written to ${file}`);
    } catch (err) {
      console.log(':(', err);
    }

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
  name: moduleName,
  path,
  nonInteractive,
}: {
  name?: string;
  path?: string;
  nonInteractive?: boolean;
}): Promise<Module> => {
  let serverModules: Record<string, { path: string; version: string }[]> = {};
  let name = moduleName;
  const apiKey = resolveApiKey();

  // expected response shape: '["modulename/modulename-x.x.x.tar.gz", ...]'
  let response = await axios(endpoints.LIST_MODULES, {
    method: 'post',
    headers: { 'x-api-key': apiKey, 'content-type': 'application/json' },
  });

  response.data.forEach((path: string) => {
    const name = path.split('/')[0];
    const version = getVersionFromPath(path);
    if (!serverModules[name]) {
      serverModules[name] = [];
    }
    serverModules[name].push({ path, version });
  });

  try {
    if (nonInteractive) {
      console.log(name, serverModules[name!]);
      const version = serverModules[name!]
        .map(({ version }) => version)
        .sort(semver.compare)
        .shift();
      path = serverModules[name!].find((module) => module.version === version)?.path;
    }
  } catch (error) {
    console.warn(`name ${name} not found in`, Object.keys(serverModules));
    throw new Error('invalid module name');
  }

  if (name === undefined && path === undefined) {
    // If user hasn't specified module name, ask for it here
    name = await inquiryForSelectModule(Object.keys(serverModules));
    const chosenVersion = await inquiryForSelectModule(
      serverModules[name]
        .map((module) => module.version)
        .sort(semver.compare)
        .reverse()
    );
    path = serverModules[name].find((module) => module.version === chosenVersion)?.path;
  }

  if (!path) {
    throw new Error('no module and version chosen, or no path specified');
  }

  const folder = await getFolderFromStorage(path, { apiKey, baseDir: 'modules' });
  console.log(`saved ${moduleName} to ${folder}`);

  let moduleConfig: ModuleConfig;
  try {
    const file = await fs.readFile(`${folder}/module.json`, { encoding: 'utf8' });
    moduleConfig = JSON.parse(file);
  } catch (err) {
    console.warn(`Error, can't find or parse the module's config file`);
    throw err;
  }

  return {
    name: name ? name : '',
    folder: folder,
    ...moduleConfig,
  };
};

export function getVersionFromPath(path: string) {
  const match = /(\d+)\.(\d+).(\d+)/.exec(path);
  const version: string = match ? match[0] : '';
  return version;
}

export const getNstDir = async () => {
  const cwd = `${__dirname}/.nst`;

  await fs.mkdir(cwd, { recursive: true });

  try {
    const stat = await fs.stat(cwd);
    if (!stat.isDirectory()) {
      throw new Error('no .nst temp dir');
    }
  } catch (err) {
    console.warn((err as Error).message);
    throw err;
  }
  return cwd;
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
