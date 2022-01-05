import axios from 'axios';
import Conf from 'conf';
import fs from 'fs/promises';
import { endpoints } from '../shared';
import { Keys } from '../cli';
import { asyncSpawn, getTmpDir } from '../cli/utils';
import { getCurrentContext } from '../lib/context';
import { schema } from '../schema';

const config = new Conf(schema as any);

export type ModuleTypes = 'sandbox' | 'nodejs' | 'algorithm';

export interface Module {
  version: string;
  type: ModuleTypes;
  name: string;
  folder: string;
  entry: string;
}

export const Publish = async ({ name }: { name?: string }) => {
  let nstrumentaConfig: { [key: string]: unknown; modules: Module[] };
  try {
    nstrumentaConfig = JSON.parse(
      await fs.readFile(`.nstrumenta/config.json`, {
        encoding: 'utf8',
      })
    );
  } catch (error) {
    throw Error(error as string);
  }

  const modules = name
    ? nstrumentaConfig.modules.filter((m) => m.name === name)
    : nstrumentaConfig.modules;
  console.log(
    `publish modules ${modules.map(({ name }) => name).join(', ')} to project ${
      getCurrentContext().projectId
    }`
  );

  const promises = modules.map(publishModule);
  const results = await Promise.all(promises);

  console.log(results.map((p) => p.status));
};

export const publishModule = async (module: Module) => {
  const { version, folder, name } = module;

  if (!version) {
    throw new Error(`module [${name}] requires version`);
  }

  const fileName = `${name}-${version}.tar.gz`;
  const tmpFileLocation = `${await getTmpDir()}/${fileName}`;
  const remoteFileLocation = `modules/${name}/${fileName}`;
  let url = '';
  let size = 0;

  // first, make tarball
  try {
    // Could make tmp directoy at __dirname__, where the script is located?
    await asyncSpawn('tar', ['-czvf', tmpFileLocation, folder], { cwd: process.cwd() });
    size = (await fs.stat(tmpFileLocation)).size;
  } catch (e) {
    console.warn(`Error: problem creating ${fileName} from ${folder}`);
    throw e;
  }

  // then, get an upload url to put the tarball into storage
  try {
    const apiKey = (config.get('keys') as Keys)[getCurrentContext().projectId];
    console.log(endpoints.GET_UPLOAD_URL, apiKey);
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
    // @ts-ignore
    console.log('::>');
    throw new Error(`Can't upload`);
  }

  const fileBuffer = await fs.readFile(tmpFileLocation);

  // start the request, return promise
  axios.interceptors.request.use((r) => {
    r.headers.contentLength = `${size}`;
    r.headers.contentLengthRange = `bytes 0-${size - 1}/${size}`;
    return r;
  });
  return axios.put(url, fileBuffer);
};
