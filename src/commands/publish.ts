import axios from 'axios';
import Conf from 'conf';
import fs from 'fs/promises';
import { Keys } from '../cli';
import { asyncSpawn, getTmpDir } from '../cli/utils';
import { getCurrentContext } from '../lib/context';
import { schema } from '../schema';
import { endpoints } from '../shared';

const config = new Conf(schema as any);

export type ModuleTypes = 'sandbox' | 'nodejs' | 'algorithm';

// TODO: (*) redefine Module, as nst-config.json within each module folder won't need the 'folder' property
export interface Module {
  version: string;
  type: ModuleTypes;
  name: string;
  folder: string;
  excludes?: string[];
}

export const Publish = async ({ name }: { name?: string }) => {
  let nstrumentaConfig: { [key: string]: unknown; modules: Module[] };
  try {
    // TODO: (*) scan subdirectories for nst-config.json files for module defs
    nstrumentaConfig = JSON.parse(
      await fs.readFile(`.nstrumenta/config.json`, {
        encoding: 'utf8',
      })
    );
  } catch (error) {
    throw Error(error as string);
  }

  // TODO: (*) scan subdirectories for nst-config.json files for module defs
  const modules = name
    ? nstrumentaConfig.modules.filter((m) => m.name === name)
    : nstrumentaConfig.modules;
  console.log(
    `publish modules ${modules.map(({ name }) => name).join(', ')} to project ${
      getCurrentContext().projectId
    }`
  );

  // TODO: (*) scan subdirectories for nst-config.json files for module defs
  try {
    const promises = modules.map(publishModule);
    const results = await Promise.all(promises);

    console.log(results);
  } catch (err) {
    console.log('error', (err as Error).message);
  } finally {
    // let's not clean up files here, keep them as a cache
    // TODO check for existence of the download before downloading
    // TODO add a clear cache / clean command
  }
};

export const publishModule = async (module: Module) => {
  const { version, folder, name, excludes } = module;

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
    const excludeArgs = excludes
      ? excludes.map((pattern) => `--exclude="${pattern}"`)
      : ['--exclude="./node_modules"'];
    const args = [...excludeArgs, '-czvf', downloadLocation, '-C', folder, '.'];
    await asyncSpawn('tar', args, { cwd: process.cwd(), shell: true });
    size = (await fs.stat(downloadLocation)).size;
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
    if (axios.isAxiosError(e)) {
      return `${fileName} ${e.response?.data}`;
    }
    throw new Error(`Can't upload: unknown error`);
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
