import { Module, ModuleTypes } from '../commands/publish';
import fs from 'fs/promises';
import Inquirer from 'inquirer';
import { asyncSpawn, getTmpDir } from '../cli/utils';
import { blue, red } from 'colors';
import Conf from 'conf';
import { Keys } from '../cli';
import { getCurrentContext } from '../lib/context';

const prompt = Inquirer.createPromptModule();
const config = new Conf(schema as any);

const inquiryForSelectModule = async (choices: string[]): Promise<string> => {
  const { projectId } = await prompt([
    { type: 'list', name: 'projectId', message: 'Project ID', choices },
  ]);
  return projectId;
};

export const Agent = async function ({
  name,
  noBackplane,
}: {
  name?: string;
  noBackplane?: boolean;
}): Promise<void> {
  let module;

  switch (noBackplane) {
    case true:
      module = await useLocalModule(name);
      break;
    default:
      module = await getModuleFromStorage(name);
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
  if (moduleName === undefined) {
    moduleName = await inquiryForSelectModule(modules.map((module) => module.name));
  }

  return modules.find((module) => module.name === moduleName);
};

const getModuleFromStorage = async (name?: string) => {
  if (name === undefined) {
    throw new Error(
      `module name required; for now use ${red('--name')} option, or ${red(
        '--noBackplane'
      )} to use local modules`
    );
  }

  const apiKey = (config.get('keys') as Keys)[getCurrentContext().projectId];

  console.log(`get [${blue(name)}] from storage`);
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

    const filename = `${getTmpDir()}/${module.folder}/${module.entry}`;
    let result;
    try {
      const cwd = `./${module.folder}`;
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
