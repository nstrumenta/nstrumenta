import axios from 'axios';
import Conf from 'conf';
import { createWriteStream } from 'fs';
import fs from 'fs/promises';
import Inquirer from 'inquirer';
import semver from 'semver';
import { pipeline as streamPipeline } from 'stream';
import tar from 'tar';
import { promisify } from 'util';
import { Keys } from '../cli';
import { asyncSpawn, getTmpDir } from '../cli/utils';
import { Module, ModuleConfig, ModuleTypes } from '../commands/publish';
import { getCurrentContext } from '../lib/context';
import { schema } from '../schema';
import { endpoints } from '../shared';
import { Command } from 'commander';

const pipeline = promisify(streamPipeline);

const prompt = Inquirer.createPromptModule();
const config = new Conf(schema as any);

const blue = (text: string) => {
  return text;
};

const inquiryForSelectModule = async (choices: string[]): Promise<string> => {
  const { module } = await prompt([{ type: 'list', name: 'module', message: 'Module', choices }]);
  return module;
};

export const Agent = async function (
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

const getModuleFromStorage = async ({
  name: moduleName,
  path,
}: {
  name?: string;
  path?: string;
}): Promise<Module> => {
  let serverModules: Record<string, { path: string; version: string }[]> = {};
  let name = moduleName;
  const apiKey = (config.get('keys') as Keys)[getCurrentContext().projectId];

  // expected response shape: '["modulename/modulename-x.x.x.tar.gz", ...]'
  let response = await axios(endpoints.LIST_MODULES, {
    method: 'post',
    headers: { 'x-api-key': apiKey, 'content-type': 'application/json' },
  });

  response.data.forEach((path: string) => {
    const name = path.split('/')[0];
    const match = /(\d+)\.(\d+).(\d+)/.exec(path);
    const version: string = match ? match[0] : '';
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

  // make sure we have a path to save to
  const tmp = await getTmpDir();
  const file = `${tmp}/tmp.tar.gz`;
  const folder = `${tmp}/${path.replace('.tar.gz', '')}`;
  try {
    await fs.mkdir(folder, { recursive: true });
  } catch (err) {
    console.log('error making dir, probably exists');
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
    // Could make tmp directoy at __dirname__, where the script is located?
    const options = {
      gzip: true,
      file: file,
      cwd: folder,
    };
    const mytar = await tar.extract(options);
  } catch (err) {
    console.warn(`Error, problem extracting tar ${file} to ${folder}`);
    throw err;
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
      const apiKey = (config.get('keys') as Keys)[getCurrentContext().projectId];

      const { entry = `npm run start -- --apiKey=${apiKey}` } = module;
      const [command, ...entryArgs] = entry.split(' ');
      // for now passing apiKey to nodejs module as a command line arg
      // this may be replaced by messages from the backplane
      result = await asyncSpawn(command, [...entryArgs, ...args], {
        cwd,
        stdio: 'inherit',
        shell: true,
        env: { ...process.env, API_KEY: apiKey },
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
