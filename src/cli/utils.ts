import axios from 'axios';
import { spawn } from 'child_process';
import Conf from 'conf';
import { createWriteStream } from 'fs';
import fs from 'fs/promises';
import Inquirer from 'inquirer';
import inspector from 'node:inspector';
import nodePath from 'node:path';
import path from 'path';
import semver from 'semver';
import { Duplex, pipeline as streamPipeline, Writable } from 'stream';
import tar from 'tar';
import util, { promisify } from 'util';
import { getCurrentContext } from '../shared/lib/context';
import { schema } from '../shared/schema';
import { Module, ModuleExtended } from './commands/module';

import { getEndpoints } from '../shared';

const endpoints = getEndpoints(process.env.NSTRUMENTA_API_URL);

const pipeline = promisify(streamPipeline);

const prompt = Inquirer.createPromptModule();

export interface Keys {
  [key: string]: string;
}

const _createLogStream = () => {
  const duplex = new Duplex({ encoding: 'utf-8' });
  duplex._read = () => undefined;
  duplex._write = (chunk, encoding, next) => {
    duplex.push(chunk, encoding);
    next();
  };
  return duplex;
};

interface CreateLoggerOptions {
  silent?: boolean;
}

export const createLogger = ({ silent }: CreateLoggerOptions = {}) => {
  let prefix: string;
  const logStream = _createLogStream();
  logStream.on('end', () => {
    const stream = _createLogStream();
    logger.logStream = stream;
  });

  const log = (...args: unknown[]) => {
    const chunk = `${util.format.apply(logger, [prefix || '', ...args])}\n`;
    // send log to any active debug inspectors
    // @ts-ignore
    inspector.console.log(chunk);
    logger.logStream.push(chunk, 'utf-8');
  };

  const setPrefix = (value: string) => {
    prefix = value;
  };

  const logger: {
    logStream: Duplex;
    log: (...args: unknown[]) => void;
    error: (...args: unknown[]) => void;
    warn: (...args: unknown[]) => void;
    setPrefix: (value: string) => void;
  } = {
    logStream,
    log,
    error: log,
    warn: log,
    setPrefix,
  };

  if (!silent) {
    logStream.pipe(process.stdout);
  }

  return logger;
};

const config = new Conf(schema as any);

export const resolveApiKey = () => {
  let apiKey = process.env.NSTRUMENTA_API_KEY;
  if (!apiKey) {
    try {
      apiKey = (config.get('keys') as Keys)[getCurrentContext().projectId];
    } catch { }
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
  streams: Writable[] = []
) {
  console.log(`spawn [${cmd} ${args?.join(' ')}]`);
  args = args || [];
  options = { ...options };
  const childProcess = spawn(cmd, args, options);

  let output = '';
  let error = '';
  [...streams, process.stdout].map((stream) => childProcess.stdout?.pipe(stream));
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

  console.log(`spawn ${cmd} output: ${output} stderr: ${error}`);
  return childProcess;
}

export const getFolderFromStorage = async (
  storagePath: string,
  options: { apiKey: string; baseDir?: string }
) => {
  const { apiKey, baseDir = '' } = options;
  const nstDir = await getNstDir(process.cwd());
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
        endpoints.GET_PROJECT_DOWNLOAD_URL,
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
  version: versionString,
}: {
  name?: string;
  path?: string;
  nonInteractive?: boolean;
  version?: string;
}): Promise<ModuleExtended> => {
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
    serverModules[name].push({ path: `modules/${path}`, version });
  });

  try {
    if (name) {
      console.log(name, serverModules[name]);
      const version = versionString
        ? versionString
        : serverModules[name]
          .map(({ version }) => version)
          .sort(semver.compare)
          .reverse()
          .shift();
      path = serverModules[name].find((module) => module.version === version)?.path;
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
    path = `${serverModules[name].find((module) => module.version === chosenVersion)?.path}`;
  }

  if (!path) {
    throw new Error('no module and version chosen, or no path specified');
  }

  const folder = await getFolderFromStorage(path, { apiKey, baseDir: 'modules' });
  console.log(`saved ${moduleName} to ${folder}`);

  let moduleConfig: Module;
  try {
    const file = await fs.readFile(`${folder}/module.json`, { encoding: 'utf8' });
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
