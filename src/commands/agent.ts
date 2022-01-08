import { Module, ModuleTypes } from '../commands/publish';
import fs from 'fs/promises';
import { createWriteStream, WriteStream } from 'fs';
import { pipeline as streamPipeline, Stream } from 'stream';
import { promisify } from 'util';
import Inquirer from 'inquirer';
import { asyncSpawn, getTmpDir } from '../cli/utils';
import { blue, red } from 'colors';
import Conf from 'conf';
import { Keys } from '../cli';
import { getCurrentContext } from '../lib/context';
import { schema } from '../schema';
import axios from 'axios';
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
  noBackplane,
  path,
}: {
  name?: string;
  noBackplane?: boolean;
  path?: string;
}): Promise<void> {
  let module;

  switch (noBackplane) {
    case true:
      module = await useLocalModule(name);
      break;
    default:
      module = await getModuleFromStorage({ name, path });
  }

  if (module === undefined) {
    throw new Error(
      `module: ${blue(name || '--')} isn't defined ${
        noBackplane ? 'in nstrumenta config' : 'in project'
      }`
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
    name = await inquiryForSelectModule(modules.map((module) => module.name));
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
  let modules: Record<string, string[]>;
  let name = moduleName;
  const apiKey = (config.get('keys') as Keys)[getCurrentContext().projectId];

  // expected response shape: '["modulename/modulename-x.x.x.tar.gz", ...]'
  let response = await axios(endpoints.LIST_MODULES, {
    method: 'post',
    headers: { 'x-api-key': apiKey, 'content-type': 'application/json' },
  });

  // TODO: This mess transforms a list of modules in storage into a record
  //  of module name keys assigned as value a list of the available versions
  //  maybe it should live somewhere shared
  modules = response.data.reduce((acc: Record<string, string[]>, next: string) => {
    const nextAccumulator = { ...acc };
    const match = /^([^/]+)\/(.*)/.exec(next);
    const [, module] = match ? match : [];
    if (module) {
      nextAccumulator[module] = [...(nextAccumulator[module] ? nextAccumulator[module] : []), next];
    }
    return nextAccumulator;
  }, {});

  if (name === undefined && path === undefined) {
    // If user hasn't specified module name, ask for it here
    name = await inquiryForSelectModule(Object.keys(modules));
    const chosenModule = await inquiryForSelectModule(modules[name]);
    path = chosenModule;
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
    entry: 'index.js',
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

    const filename = `${module.folder}/${module.entry}`;
    let result;
    try {
      const cwd = `${module.folder}`;
      console.log(blue(`[cwd: ${cwd}] npm install...`));
      await asyncSpawn('npm', ['install'], { cwd });
      console.log(blue(`start the module...`));
      result = await asyncSpawn('node', [filename]);
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
