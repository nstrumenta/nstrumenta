import axios, { AxiosError } from 'axios';
import { Command } from 'commander';
import fs from 'fs/promises';
import semver from 'semver';
import tar from 'tar';
import { nstrumentaVersion } from '..';
import {
  asyncSpawn,
  endpoints,
  getModuleFromStorage,
  getNearestConfigJson,
  getNstDir,
  getVersionFromPath,
  resolveApiKey,
} from '../utils';

const blue = (text: string) => {
  return text;
};

export const Run = async function (
  name: string,
  {
    version,
  }: {
    version?: string;
  },
  { args }: Command
): Promise<void> {
  let module: ModuleExtended;

  console.log('Running module', name, 'version', version ?? 'not specified, using latest');

  module = await getModuleFromStorage({ name, version });

  switch (module.nstrumentaModuleType) {
    case 'nodejs':
      {
        console.log(`${module.name} in ${module.folder} with args`, args);
        const cwd = `${module.folder}`;
        const { entry = `npm run start -- ` } = module;
        const [command, ...entryArgs] = entry.split(' ');
        console.log(`::: start the module...`, command, entryArgs, { entry });
        await asyncSpawn(command, [...entryArgs, ...args], {
          cwd,
          stdio: 'inherit',
          shell: true,
        });
      }
      break;
    default: {
      console.log(`${module.name} in ${module.folder} with args`, args);
      const cwd = `${module.folder}`;
      const { entry } = module;
      if (entry) {
        const [command, ...entryArgs] = entry.split(' ');
        console.log(command, entryArgs, { entry });
        await process.nextTick(() => {});
        await asyncSpawn(command, [...entryArgs, ...args], {
          cwd,
          stdio: 'inherit',
          shell: true,
        });
      }
    }
  }
};

export const SetAction = async (options: { action: string; tag?: string }) => {
  const { action: actionString, tag } = options;
  const action = JSON.parse(actionString);
  const apiKey = resolveApiKey();

  try {
    const response: { data: string } = await axios({
      method: 'POST',
      url: endpoints.SET_ACTION,
      headers: {
        contentType: 'application/json',
        'x-api-key': apiKey,
      },
      data: { action },
    });

    const actionId = response.data;
    console.log(`created action: ${actionId} `, action);
  } catch (err) {
    console.error('Error:', (err as AxiosError).response?.data);
  }
};

export const Host = async function (
  moduleName: string,
  {
    version,
  }: {
    version?: string;
  },
  { args }: Command
): Promise<void> {
  if (moduleName == undefined) {
    console.log('no moduleName specified');
    return;
  }
  console.log('Finding ', moduleName);
  let modules: string[] = [];
  try {
    const apiKey = resolveApiKey();
    let response = await axios(endpoints.LIST_MODULES, {
      method: 'post',
      headers: { 'x-api-key': apiKey, 'content-type': 'application/json' },
    });
    modules = response.data;
  } catch (error) {
    console.log(`Problem fetching data ${(error as Error).name}`);
  }

  const matches = modules
    .map((nameObjectPairs) => nameObjectPairs[0])
    .filter((module) => module.startsWith(moduleName))
    .map((module) => {
      return {
        name: moduleName,
        filePath: module,
        version: getVersionFromPath(module),
      };
    });

  const specificModule = version
    ? matches.find((match) => semver.eq(version, match.version))
    : matches
        .sort((a, b) => semver.compare(a.version, b.version))
        .reverse()
        .shift();

  if (!specificModule) throw new Error(`unable to find a matching version for ${moduleName}`);
  console.log('found moduleId: ', specificModule?.name);

  const action = JSON.stringify({
    task: 'hostModule',
    status: 'pending',
    data: { module: specificModule, args },
  });

  SetAction({ action });
};

export const CloudRun = async function (
  moduleName: string,
  {
    version,
  }: {
    version?: string;
  },
  { args }: Command
): Promise<void> {
  console.log('Finding ', moduleName);
  let modules: string[] = [];
  try {
    const apiKey = resolveApiKey();
    let response = await axios(endpoints.LIST_MODULES, {
      method: 'post',
      headers: { 'x-api-key': apiKey, 'content-type': 'application/json' },
    });
    modules = response.data;
  } catch (error) {
    console.log(`Problem fetching data ${(error as Error).name}`);
  }
  const matches = modules
    .filter((module) => module.startsWith(moduleName))
    .map((module) => {
      return {
        name: moduleName,
        filePath: module,
        version: getVersionFromPath(module),
      };
    });

  console.log(modules, matches);
  const specificModule = version
    ? matches.find((match) => semver.eq(version, match.version))
    : matches
        .sort((a, b) => semver.compare(a.version, b.version))
        .reverse()
        .shift();

  if (!specificModule) throw new Error(`unable to find a matching version for ${moduleName}`);
  console.log('found moduleId: ', specificModule?.name);

  const action = JSON.stringify({
    task: 'cloudRun',
    status: 'pending',
    data: { module: specificModule, args },
  });

  SetAction({ action });
};

export type ModuleTypes = 'sandbox' | 'web' | 'nodejs' | 'script' | 'algorithm';

export interface Module {
  name: string;
  version: string;
  nstrumentaModuleType: ModuleTypes;
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

const readModuleConfigs = async (moduleMetas: ModuleMeta[]): Promise<ModuleExtended[]> => {
  const promises = moduleMetas.map(async (moduleMeta) => {
    const { folder } = moduleMeta;
    let moduleConfig: Module | undefined;
    const nstrumentaModulePath = `${folder}/nstrumentaModule.json`;
    try {
      moduleConfig = JSON.parse(await fs.readFile(nstrumentaModulePath, { encoding: 'utf8' }));
    } catch (err) {
      console.log(`Couldn't read ${nstrumentaModulePath}`);
      console.log({ moduleMeta });
      console.log({ moduleConfig });
    }
    let packageConfig: Record<string, unknown> | undefined;
    if (
      moduleConfig?.nstrumentaModuleType == 'nodejs' ||
      moduleConfig?.nstrumentaModuleType == 'web'
    ) {
      try {
        packageConfig = JSON.parse(
          await fs.readFile(`${folder}/package.json`, { encoding: 'utf8' })
        );
      } catch (err) {
        console.log(`no ${folder}/package.json`);
      }
    }
    return {
      nstrumentaVersion,
      ...moduleMeta,
      ...moduleConfig,
      ...packageConfig,
    } as ModuleExtended;
  });
  return Promise.all(promises);
};

export const Publish = async () => {
  let moduleMetas: ModuleMeta[];
  let modules: ModuleExtended[] = [];

  // First, let's check the nst project configuration for modules
  try {
    const { file, cwd } = await getNearestConfigJson();

    // For the rest of this run, we'll want to chdir to the main project folder
    process.chdir(cwd);
    console.log(`cwd: ${process.cwd()}`);
    const { modules: modulesFromFile }: { [key: string]: unknown; modules: ModuleMeta[] } =
      JSON.parse(file);
    moduleMetas = modulesFromFile;
  } catch (error) {
    throw Error(error as string);
  }

  // Now, check for and read the configs

  const results = await readModuleConfigs(moduleMetas);
  modules = results.filter((m): m is ModuleExtended => Boolean(m));

  console.log(`publishing:`, modules);

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
  }
};

export const publishModule = async (module: ModuleExtended) => {
  const { version, folder, name, includes = ['.'], excludes = [], prePublishCommand } = module;

  if (!version) {
    throw new Error(`module [${name}] requires version!`);
  }

  const fileName = `${name}-${version}.tar.gz`;
  const downloadLocation = `${await getNstDir(process.cwd())}/${fileName}`;
  const remoteFileLocation = `modules/${fileName}`;
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
          // also excludes .nstrumenta folder to avoid leaking credential
          ['.nstrumenta/', ...excludes].findIndex((p) => {
            return path.includes(p);
          }) === -1
        );
      },
    };
    await tar.create(options, ['nstrumentaModule.json', ...includes]);
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
        return fileName;
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
  return fileName;
};

export const List = async (options: { filter: string; depth?: number | null }) => {
  const apiKey = resolveApiKey();
  const { filter, depth = 2 } = options;

  try {
    let response = await axios(endpoints.LIST_MODULES, {
      method: 'post',
      headers: { 'x-api-key': apiKey, 'content-type': 'application/json' },
    });
    const filteredModules = filter
      ? response.data.filter((module: any) => JSON.stringify(module).includes(filter))
      : response.data;

    console.dir(filteredModules, { depth });
  } catch (error) {
    console.log(`Problem fetching data ${(error as Error).name}`);
  }
};
