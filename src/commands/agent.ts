import axios from 'axios';
import { blue } from 'colors';
import Conf from 'conf';
import { createWriteStream } from 'fs';
import fs from 'fs/promises';
import Inquirer from 'inquirer';
import semver from 'semver';
import { pipeline as streamPipeline } from 'stream';
import { promisify } from 'util';
import { Keys } from '../cli';
import { asyncSpawn, getTmpDir } from '../cli/utils';
import { Module, ModuleTypes } from '../commands/publish';
import { getCurrentContext } from '../lib/context';
import { schema } from '../schema';
import { endpoints } from '../shared';

const pipeline = promisify(streamPipeline);

const prompt = Inquirer.createPromptModule();
const config = new Conf(schema as any);

const inquiryForSelectModule = async (choices: string[]): Promise<string> => {
  const { module } = await prompt([{ type: 'list', name: 'module', message: 'Module', choices }]);
  return module;
};

export const Agent = async function ({
  name,
  local,
  path,
}: {
  name?: string;
  local?: boolean;
  path?: string;
}): Promise<void> {
  let module;

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

  // By this point, we need to have the files in place in
  const result = await adapters[module.type](module);

  console.log('=>', result);
};

const useLocalModule = async (moduleName?: string) => {
  let config: { [key: string]: unknown; modules: Module[] };
  let name = moduleName;

  try {
    config = JSON.parse(
      await fs.readFile(`.nstrumenta/config.json`, {
        encoding: 'utf8',
      })
    );
  } catch (error) {
    throw Error(error as string);
  }

  const modules: Module[] = config.modules;
  if (name === undefined) {
    name = await inquiryForSelectModule(
      modules
        .sort((a, b) => semver.compare(a.version, b.version))
        .reverse()
        .map((module) => module.name)
    );
  }

  // TODO: (*) get module def from nst-config.json within the module folder
  const module = modules.find((module) => module.name === name);
  if (!module) {
    throw new Error('problem finding module in config');
  }
  return {
    ...module,
    folder: `${process.cwd()}/${module.folder}`,
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

  // TODO: update 'publish' to publish Module config as metadata; pull that in here
  return {
    name: 'whatever',
    type: 'nodejs',
    folder,
    version: 'x.x.x',
  };
};

// adapters/handlers for each type of module, run files (maybe memory??) in the
// running agent's environment
//
// Assumes that the files are already in place
// TODO: Accept a well-defined runnable module definition object, specifically with the actual
//  tmp file location defined, rather than constructing the tmp file location again here
const adapters: Record<ModuleTypes, (module: Module) => Promise<unknown>> = {
  // For now, run a script with npm dependencies in an environment that has node/npm
  nodejs: async (module) => {
    console.log(`adapt ${module.name} in ${module.folder}`);
    let result;
    try {
      const cwd = `${module.folder}`;
      console.log(blue(`[cwd: ${cwd}] npm install...`));
      await asyncSpawn('npm', ['install'], { cwd });
      console.log(blue(`start the module...`));
      const apiKey = (config.get('keys') as Keys)[getCurrentContext().projectId];
      // for now passing apiKey to nodejs module as a command line arg
      // this may be replaced by messages from the backplane 
      result = await asyncSpawn(
        'npm',
        ['run', 'start', '--', `--apiKey=${apiKey}`],
        { cwd, stdio: 'inherit', shell: true }
      );
    } catch (err) {
      console.log('problem', err);
    }
    return result;
  },
  sandbox: async (module) => {
    console.log('adapt', module);
    return '';
  },
  algorithm: async (module) => {
    console.log('adapt', module);
    return '';
  },
};
