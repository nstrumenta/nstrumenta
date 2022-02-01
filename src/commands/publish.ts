import axios from 'axios';
import Conf from 'conf';
import fs from 'fs/promises';
import path from 'path';
import tar from 'tar';
import { Keys } from '../cli';
import { getTmpDir } from '../cli/utils';
import { getCurrentContext } from '../lib/context';
import { schema } from '../schema';
import { endpoints } from '../shared';

const config = new Conf(schema as any);

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
    const mytar = await tar.create(options, ['.']);
    size = (await fs.stat(downloadLocation)).size;
    console.log({ size, mytar });
  } catch (e) {
    console.warn(`Error: problem creating ${fileName} from ${folder}`);
    throw e;
  }

  // then, get an upload url to put the tarball into storage
  try {
    const apiKey = (config.get('keys') as Keys)[getCurrentContext().projectId];
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
  axios.interceptors.request.use((r) => {
    r.headers.contentLength = `${size}`;
    r.headers.contentLengthRange = `bytes 0-${size - 1}/${size}`;
    return r;
  });
  await axios.put(url, fileBuffer);
  return remoteFileLocation;
};

export const getTmpFileLocation = async () => {
  return `${await getTmpDir()}/tmp.tar.gz`;
};
