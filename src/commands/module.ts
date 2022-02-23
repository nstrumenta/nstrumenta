import axios from 'axios';
import { Command } from 'commander';
import { createWriteStream } from 'fs';
import fs from 'fs/promises';
import Inquirer from 'inquirer';
import path from 'path';
import semver from 'semver';
import { pipeline as streamPipeline } from 'stream';
import tar from 'tar';
import { promisify } from 'util';
import { resolveApiKey } from '../cli';
import { asyncSpawn, getTmpDir } from '../cli/utils';
import { getCurrentContext } from '../lib/context';
import { endpoints } from '../shared';

const pipeline = promisify(streamPipeline);

const prompt = Inquirer.createPromptModule();

const blue = (text: string) => {
  return text;
};

const inquiryForSelectModule = async (choices: string[]): Promise<string> => {
  const { module } = await prompt([{ type: 'list', name: 'module', message: 'Module', choices }]);
  return module;
};

export const Run = async function (
  {
    name,
    local,
    path,
  }: {
    name?: string;
    local?: boolean;
    path?: string;
  },
  { args }: Command
): Promise<void> {
  let module: Module;

  switch (local) {
    case true:
      module = await useLocalModule(name);
      break;
    default:
      module = await getModuleFromStorage({ name, path });
  }

  if (module === undefined) {
    throw new Error(
      `module: ${blue(name || '--')} isn't defined ${local ? 'in nstrumenta config' : 'in project'}`
    );
  }

  const result = await adapters[module.type](module, args);

  console.log('=>', result);
};

const useLocalModule = async (moduleName?: string): Promise<Module> => {
  let config: { [key: string]: unknown; modules: Module[] };
  let name = moduleName;

  // Locate the module config via the .nstrumenta/config.json
  try {
    config = JSON.parse(
      await fs.readFile(`.nstrumenta/config.json`, {
        encoding: 'utf8',
      })
    );
  } catch (error) {
    throw Error(error as string);
  }

  // Read the module configs
  const promises = config.modules.map(async (moduleMeta) => {
    const { folder } = moduleMeta;
    let moduleConfig: ModuleConfig | undefined;
    try {
      moduleConfig = JSON.parse(await fs.readFile(`${folder}/module.json`, { encoding: 'utf8' }));
    } catch (err) {
      console.warn(`Couldn't read ${folder}/module.json`);
    }
    return { ...moduleMeta, ...moduleConfig };
  });

  // Sort the module version
  const modules: Module[] = await Promise.all(promises);
  if (name === undefined) {
    name = await inquiryForSelectModule(
      modules
        .sort((a, b) => semver.compare(a.version, b.version))
        .reverse()
        .map((module) => module.name)
    );
  }

  // Find the particular module we need
  // TODO: Allow choosing a version; For now, this just grabs the latest version
  const module: Module | undefined = modules.find((module) => module.name === name);
  if (module === undefined) {
    throw new Error('problem finding module in config');
  }

  const folder = `${process.cwd()}/${module.folder}`;

  return {
    ...module,
    folder,
  };
};

function getVersionFromPath(path: string) {
  const match = /(\d+)\.(\d+).(\d+)/.exec(path);
  const version: string = match ? match[0] : '';
  return version;
}

const getModuleFromStorage = async ({
  name: moduleName,
  path,
}: {
  name?: string;
  path?: string;
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

  // make sure we have a path to save to
  const tmp = await getTmpDir();
  const file = `${tmp}/tmp.tar.gz`;
  const folder = `${tmp}/${path.replace('.tar.gz', '')}`;
  let exists: boolean = false;
  try {
    await fs.access(folder);
    exists = true;
    console.log(`using cached version`);
  } catch {
    await fs.mkdir(folder, { recursive: true });
  }

  if (!exists) {
    console.log(`get [${blue(path)}] from storage`);

    // get the download url
    let url;
    try {
      const downloadUrlConfig = {
        headers: { 'x-api-key': apiKey, 'content-type': 'application/json' },
      };
      const downloadUrlData = { path };
      const downloadUrlResponse = await axios.post(
        endpoints.GET_DOWNLOAD_URL,
        downloadUrlData,
        downloadUrlConfig
      );
      url = downloadUrlResponse.data;
    } catch (err) {
      throw new Error(`bad times, path: ${path}`);
    }

    try {
      // get the file, write to the temp directory
      console.log('get url', url);
      const download = await axios.get(url, { responseType: 'stream' });
      const writeStream = createWriteStream(file);

      await pipeline(download.data, writeStream);
      console.log(`file written to ${file}`);
    } catch (err) {
      console.log(':(');
    }

    // extract tar into subdir of tmp
    await asyncSpawn('tar', ['-xzf', file, '-C', folder]);

    try {
      const options = {
        gzip: true,
        file: file,
        cwd: folder,
      };
      await tar.extract(options);
    } catch (err) {
      console.warn(`Error, problem extracting tar ${file} to ${folder}`);
      throw err;
    }
  }

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

// adapters/handlers for each type of module, run files (maybe memory??) in the
// running agent's environment

// Assumes that the files are already in place
// TODO: Accept a well-defined runnable module definition object, specifically with the actual
//  tmp file location defined, rather than constructing the tmp file location again here
const adapters: Record<ModuleTypes, (module: Module, args?: string[]) => Promise<unknown>> = {
  // For now, run a script with npm dependencies in an environment that has node/npm
  nodejs: async (module, args: string[] = []) => {
    console.log(`adapt ${module.name} in ${module.folder} with args ${{ args }}`);

    let result;
    try {
      const cwd = `${module.folder}`;
      console.log(blue(`[cwd: ${cwd}] npm install...`));
      await asyncSpawn('npm', ['install'], { cwd });
      console.log(blue(`start the module...`));
      const apiKey = resolveApiKey();

      const { entry = `npm run start -- --apiKey=${apiKey}` } = module;
      const [command, ...entryArgs] = entry.split(' ');
      // for now passing apiKey to nodejs module as a command line arg
      // this may be replaced by messages from the backplane
      result = await asyncSpawn(command, [...entryArgs, ...args], {
        cwd,
        stdio: 'inherit',
        shell: true,
      });
    } catch (err) {
      console.log('problem', err);
    }
    return result;
  },
  sandbox: async (module) => {
    console.log('adapt', module.name);
    return '';
  },
  algorithm: async (module) => {
    console.log('adapt', module.name);
    return '';
  },
};

export type ModuleTypes = 'sandbox' | 'nodejs' | 'algorithm';

export interface ModuleConfig {
  version: string;
  type: ModuleTypes;
  exclude?: string[];
  entry: string;
}

export interface ModuleMeta {
  name: string;
  folder: string; // relative dir to the module
}

export type Module = ModuleConfig & ModuleMeta;

export const Publish = async ({ name }: { name?: string }) => {
  let modulesMeta: ModuleMeta[];
  let modules: Module[] = [];

  // First, let's check the nst project configuration for modules
  try {
    const file = await fs.readFile(`.nstrumenta/config.json`, {
      encoding: 'utf8',
    });
    const { modules: modulesFromFile }: { [key: string]: unknown; modules: ModuleMeta[] } =
      JSON.parse(file);
    modulesMeta = modulesFromFile;
    console.log(`nst project defines ${modulesMeta.length} modules...`);
  } catch (error) {
    throw Error(error as string);
  }

  // Now, check for and read the configs
  // Check each given module for config file
  const promises = modulesMeta.map(async (meta) => {
    const { name } = meta;
    const folder = path.resolve(meta.folder);

    try {
      const moduleConfig: ModuleConfig = JSON.parse(
        await fs.readFile(`${path.resolve(folder)}/module.json`, { encoding: 'utf8' })
      );
      return { ...moduleConfig, name, folder };
    } catch (e) {
      console.log(`No config file found in ${path.resolve(folder)}\n`);
    }
  });

  const results = await Promise.all(promises);
  modules = results.filter((m): m is Module => Boolean(m));

  console.log(
    `publish ${modules.length} modules: [${modules
      .map(({ name }) => name)
      .join(', ')}] to project ${getCurrentContext().projectId}\n`
  );

  try {
    const promises = modules.map((module) =>
      publishModule({
        ...module,
      })
    );
    const results = await Promise.all(promises);

    console.log(results);
  } catch (err) {
    console.log((err as Error).message);
  } finally {
    // let's not clean up files here, keep them as a cache
    // TODO check for existence of the download before downloading
    // TODO add a clear cache / clean command
  }
};

export const publishModule = async (module: Module) => {
  const { version, folder, name, exclude = ['node_modules'] } = module;

  if (!version) {
    throw new Error(`module [${name}] requires version`);
  }

  const fileName = `${name}-${version}.tar.gz`;
  const downloadLocation = `${await getTmpDir()}/${fileName}`;
  const remoteFileLocation = `modules/${name}/${fileName}`;
  let url = '';
  let size = 0;

  // first, make tarball
  try {
    // Could make tmp directoy at __dirname__, where the script is located?
    const options = {
      gzip: true,
      file: downloadLocation,
      cwd: folder,
      filter: (path: string) => {
        return (
          // basic filtering of exact string items in the 'exclude' array
          exclude.findIndex((p) => {
            return path.includes(p);
          }) === -1
        );
      },
    };
    await tar.create(options, ['.']);
    size = (await fs.stat(downloadLocation)).size;
  } catch (e) {
    console.warn(`Error: problem creating ${fileName} from ${folder}`);
    throw e;
  }

  // then, get an upload url to put the tarball into storage
  try {
    const apiKey = resolveApiKey();
    const response = await axios.post(
      endpoints.GET_UPLOAD_URL,
      {
        path: remoteFileLocation,
        size,
      },
      {
        headers: {
          contentType: 'application/json',
          'x-api-key': apiKey,
        },
      }
    );

    url = response.data?.uploadUrl;
  } catch (e) {
    let message = `can't upload ${name}`;
    if (axios.isAxiosError(e)) {
      if (e.response?.status === 409) {
        message = `${message}: Conflict: version ${version} exists`;
      }
      message = `${message} [${(e as Error).message}]`;
    }
    throw new Error(message);
  }

  // this could be streamed...
  const fileBuffer = await fs.readFile(downloadLocation);

  // start the request, return promise
  await axios.put(url, fileBuffer, {
    maxBodyLength: Infinity,
    maxContentLength: Infinity,
    headers: {
      contentLength: `${size}`,
      contentLengthRange: `bytes 0-${size - 1}/${size}`,
    },
  });
  return remoteFileLocation;
};

export const getTmpFileLocation = async () => {
  return `${await getTmpDir()}/tmp.tar.gz`;
};
