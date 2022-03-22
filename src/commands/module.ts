import axios from 'axios';
import { Command } from 'commander';
import fs from 'fs/promises';
import path from 'path';
import semver from 'semver';
import tar from 'tar';
import {
  asyncSpawn,
  getModuleFromStorage,
  getNearestConfigJson,
  getNstDir,
  inquiryForSelectModule,
  resolveApiKey,
} from '../cli/utils';
import { getCurrentContext } from '../lib/context';
import { endpoints } from '../shared';

const blue = (text: string) => {
  return text;
};

export const Run = async function (
  {
    name,
    local,
    path,
    nonInteractive,
  }: {
    name?: string;
    local?: boolean;
    path?: string;
    nonInteractive?: boolean;
  },
  { args }: Command
): Promise<void> {
  let module: ModuleExtended;

  if (nonInteractive) {
    if (!name) {
      throw new Error('module name required for non-interactive mode');
    }

    if (local) {
      console.log('non-interactive overrides local, fetches latest version from server');
    }
  }

  switch (nonInteractive) {
    case false:
      if (Boolean(local)) {
        module = await useLocalModule(name);
        break;
      }
    default:
      module = await getModuleFromStorage({ name, path, nonInteractive });
  }

  if (module === undefined) {
    throw new Error(
      `module: ${blue(name || '--')} isn't defined ${local ? 'in nstrumenta config' : 'in project'}`
    );
  }

  const result = await adapters[module.type](module, args);

  console.log('=>', result);
};

const useLocalModule = async (moduleName?: string): Promise<ModuleExtended> => {
  let config: { [key: string]: unknown; modules: ModuleExtended[] };
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
    let moduleConfig: Module | undefined;
    try {
      moduleConfig = JSON.parse(await fs.readFile(`${folder}/module.json`, { encoding: 'utf8' }));
    } catch (err) {
      console.warn(`Couldn't read ${folder}/module.json`);
    }
    return { ...moduleMeta, ...moduleConfig };
  });

  // Sort the module version
  const modules: ModuleExtended[] = await Promise.all(promises);
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
  const module: ModuleExtended | undefined = modules.find((module) => module.name === name);
  if (module === undefined) {
    throw new Error('problem finding module in config');
  }

  const folder = `${process.cwd()}/${module.folder}`;

  return {
    ...module,
    folder,
  };
};

// adapters/handlers for each type of module, run files (maybe memory??) in the
// running agent's environment

// Assumes that the files are already in place
// TODO: Accept a well-defined runnable module definition object, specifically with the actual
//  tmp file location defined, rather than constructing the tmp file location again here
const adapters: Record<ModuleTypes, (module: ModuleExtended, args?: string[]) => Promise<unknown>> =
  {
    // For now, run a script with npm dependencies in an environment that has node/npm
    nodejs: async (module, args: string[] = []) => {
      console.log(`adapt ${module.name} in ${module.folder} with args`, args);

      let result;
      try {
        const cwd = `${module.folder}`;
        console.log(blue(`[cwd: ${cwd}] npm install...`));
        await asyncSpawn('npm', ['install'], { cwd });
        console.log(blue(`start the module...`));

        // module will resolve NSTRUMENTA_API_KEY from env var
        const { entry = `npm run start -- ` } = module;
        const [command, ...entryArgs] = entry.split(' ');
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
      const { folder } = await getModuleFromStorage({ name: module.name, nonInteractive: true });
      return '';
    },
    algorithm: async (module) => {
      console.log('adapt', module.name);
      return '';
    },
  };

export type ModuleTypes = 'sandbox' | 'nodejs' | 'algorithm';

export interface Module {
  name: string;
  version: string;
  type: ModuleTypes;
  excludes?: string[];
  includes?: string[];
  entry: string;
  prePublishCommand?: string;
}

export interface ModuleMeta {
  name: string;
  folder: string; // relative dir to the module
}

export type ModuleExtended = Module & ModuleMeta;

export const Publish = async () => {
  let modulesMeta: ModuleMeta[];
  let modules: ModuleExtended[] = [];

  // First, let's check the nst project configuration for modules
  try {
    const { file, cwd } = await getNearestConfigJson();

    // For the rest of this run, we'll want to chdir to the main project folder
    process.chdir(cwd);
    console.log({ cwd });
    console.log(`cwd: ${process.cwd()}`);
    const { modules: modulesFromFile }: { [key: string]: unknown; modules: ModuleMeta[] } =
      JSON.parse(file);
    modulesMeta = modulesFromFile;
  } catch (error) {
    throw Error(error as string);
  }

  // Now, check for and read the configs
  // Check each given module for config file
  const promises = modulesMeta.map(async (meta) => {
    const { name } = meta;
    const folder = path.resolve(meta.folder);

    try {
      const moduleConfig: Module = JSON.parse(
        await fs.readFile(`${path.resolve(folder)}/module.json`, { encoding: 'utf8' })
      );
      return { ...moduleConfig, name, folder };
    } catch (e) {
      console.log(`No config file found in ${path.resolve(folder)}\n`);
    }
  });

  const results = await Promise.all(promises);
  modules = results.filter((m): m is ModuleExtended => Boolean(m));

  console.log(
    `publishing ${modules.length} modules: [${modules
      .map(({ name }) => name)
      .join(', ')}] to project ${getCurrentContext().projectId}\n`
  );

  try {
    console.log(modules.map(({ folder }) => folder));
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

export const publishModule = async (module: ModuleExtended) => {
  const {
    version,
    folder,
    name,
    includes = ['.'],
    excludes = ['node_modules'],
    prePublishCommand,
  } = module;

  if (!version) {
    throw new Error(`module [${name}] requires version`);
  }

  const fileName = `${name}-${version}.tar.gz`;
  const downloadLocation = `${await getNstDir()}/${fileName}`;
  const remoteFileLocation = `modules/${name}/${fileName}`;
  let url = '';
  let size = 0;

  if (prePublishCommand) {
    try {
      const cwd = folder;
      console.log(blue(`[cwd: ${cwd}] pre-publish build step`));
      const [cmd, ...args] = prePublishCommand.split(' ');
      await asyncSpawn(cmd, args, { cwd });
    } catch (err) {
      console.log(`Failed on pre-publish command: ${(err as Error).message}`);
      throw err;
    }
  }

  // first, make tarball
  try {
    const options = {
      gzip: true,
      file: downloadLocation,
      cwd: folder,
      filter: (path: string) => {
        return (
          // basic filtering of exact string items in the 'exclude' array
          excludes.findIndex((p) => {
            return path.includes(p);
          }) === -1
        );
      },
    };
    await tar.create(options, ['module.json', ...includes]);
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
        meta: module,
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
        console.log(`Conflict: version ${version} exists, using server version`);
        return remoteFileLocation;
      }
      message = `${message} [${(e as Error).message}]`;
    }
    throw new Error(message);
  }

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
