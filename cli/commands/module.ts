import { Command } from 'commander';
import fs from 'fs/promises';
import semver from 'semver';
import tar from 'tar';
import { McpClient } from '../mcp';
import {
  asyncSpawn,
  endpoints,
  getModuleFromStorage,
  getNearestConfigJson,
  getNstDir,
  getVersionFromPath,
  resolveApiKey,
  resolveApiUrl,
} from '../utils';

const blue = (text: string) => {
  return text;
};

export const Run = async function (
  moduleName: string,
  {
    moduleVersion,
    commandArgs,
  }: {
    moduleVersion?: string;
    commandArgs?: string[];
  },
  command?: Command
): Promise<void> {
  try {
    const module = await getModuleFromStorage({ name: moduleName, version: moduleVersion });
    console.log(`Running module ${module.name} version ${module.version} from ${module.folder}`);

    const entry = module.entry;
    if (!entry) {
      throw new Error('Module has no entry point defined');
    }

    const [cmd, ...entryArgs] = entry.split(' ');
    const args = [...entryArgs, ...(commandArgs || [])];

    await asyncSpawn(cmd, args, {
      cwd: module.folder,
      stdio: 'inherit',
      env: {
        ...(process.env as Record<string, string>),
      },
    });
  } catch (err) {
    console.error('Error running module:', (err as Error).message);
    process.exit(1);
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
  try {
    const mcp = new McpClient();
    const { actionId } = await mcp.hostModule(moduleName, { version, args });
    console.log(`created action: ${actionId} to host ${moduleName}`);
  } catch (err) {
    console.error('Error:', (err as Error).message);
    process.exit(1);
  }
};

export const CloudRun = async function (
  moduleName: string,
  {
    moduleVersion,
    commandArgs,
    image,
  }: {
    moduleVersion?: string;
    commandArgs?: string[];
    image?: string;
  }
): Promise<void> {
  const args: string[] = commandArgs ?? [];
  try {
    const mcp = new McpClient();
    const { actionId } = await mcp.cloudRun(moduleName, {
      version: moduleVersion,
      args,
      image,
    });
    console.log(`created action: ${actionId} to cloud run ${moduleName}`);
    if (actionId) {
      await waitForAction(actionId);
    }
  } catch (err) {
    console.error('Error:', (err as Error).message);
    process.exit(1);
  }
};


export const SetAction = async (options: { action: string; tag?: string }) => {
  const { action: actionString, tag } = options;
  const action = JSON.parse(actionString);
  const apiKey = resolveApiKey();

  try {
    const response = await fetch(endpoints.SET_ACTION, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify({ action }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const actionId = await response.text();
    console.log(`created action: ${actionId} `, action);
    return actionId;
  } catch (err) {
    console.error('Error:', (err as Error).message);
    process.exit(1);
  }
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
      ...moduleMeta,
      ...moduleConfig,
      ...packageConfig,
    } as ModuleExtended;
  });
  return Promise.all(promises);
};

const waitForModule = async (name: string, version: string) => {
  const apiKey = resolveApiKey();
  const maxRetries = 20;
  const interval = 1000;
  console.log(`Waiting for module ${name} version ${version} to be indexed...`);
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(endpoints.LIST_MODULES, {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'content-type': 'application/json',
        },
      });
      if (response.ok) {
        const modules = (await response.json()) as Module[];
        const match = modules.find(
          (m) =>
            m.name === `${name}-${version}.tar.gz` ||
            (m.name.startsWith(name) && getVersionFromPath(m.name) === version)
        );
        if (match) {
          console.log(`Module ${name} version ${version} is ready.`);
          return;
        }
      }
    } catch (e) {
      console.log('Error checking module status:', e);
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }
  throw new Error(`Timeout waiting for module ${name} version ${version} to be indexed.`);
};

const waitForAction = async (actionId: string) => {
  const apiKey = resolveApiKey();
  const maxRetries = 300; // 5 minutes for cloud run
  const interval = 2000;
  console.log(`Waiting for action ${actionId} to complete...`);
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(endpoints.GET_ACTION, {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'content-type': 'application/json',
        },
        body: JSON.stringify({ actionId }),
      });
      if (response.ok) {
        const action = (await response.json()) as { status: string; error?: string };
        if (action.status === 'complete') {
          console.log(`Action ${actionId} completed.`);
          return;
        }
        if (action.status === 'error') {
          throw new Error(`Action ${actionId} failed: ${action.error}`);
        }
        console.log(`Action status: ${action.status}`);
      }
    } catch (e) {
      console.log('Error checking action status:', e);
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }
  throw new Error(`Timeout waiting for action ${actionId} to complete.`);
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

    for (const module of modules) {
      await waitForModule(module.name, module.version);
    }
  } catch (err) {
    console.error((err as Error).message);
    process.exit(1);
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
    console.log('creating tar', fileName, downloadLocation, `includes.length: ${includes.length}`);
    await tar.create(options, ['nstrumentaModule.json', ...includes]);
    size = (await fs.stat(downloadLocation)).size;
  } catch (e) {
    console.warn(`Error: problem creating ${fileName} from ${folder}`);
    throw e;
  }

  // then, get an upload url to put the tarball into storage
  try {
    const mcp = new McpClient();
    const result = await mcp.callTool('get_upload_url', {
      path: remoteFileLocation,
      metadata: {
        size: size.toString(),
        version,
        name,
        ...module,
      },
    });
    url = result.uploadUrl;
  } catch (e) {
    if (e instanceof Error && e.message.includes('exists')) {
      console.log(`Conflict: version ${version} exists, using server version`);
      return fileName;
    }
    let message = `can't upload ${name}`;
    if (e instanceof Error) {
      message = `${message} [${e.message}]`;
    }
    throw new Error(message);
  }

  const fileBuffer = await fs.readFile(downloadLocation);

  // start the request, return promise
  try {
    const response = await fetch(url, {
      method: 'PUT',
      body: fileBuffer,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  } catch (error) {
    console.error(`Error uploading file: ${(error as Error).message}`);
  }
  return fileName;
};

export const List = async (options: {
  filter: string;
  depth?: number | null;
  json?: boolean;
}): Promise<ModuleExtended[] | void> => {
  const { filter, json, depth = 2 } = options;

  try {
    const mcp = new McpClient();
    const { modules } = await mcp.listModules(filter);

    if (json) {
      return modules as ModuleExtended[];
    } else {
      console.dir(modules, { depth });
    }
  } catch (error) {
    console.log(`Problem fetching data ${(error as Error).name}`);
  }
};
