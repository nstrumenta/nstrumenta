import axios, { AxiosRequestConfig } from 'axios';
import { createWriteStream } from 'fs';
import { access, mkdir, readFile, rm, rmdir, stat, writeFile } from 'fs/promises';
import { pipeline as streamPipeline } from 'stream';
import { promisify } from 'util';
import { QueryOptions } from '../../shared';
import { asyncSpawn, endpoints, resolveApiKey } from '../utils';
import ErrnoException = NodeJS.ErrnoException;

const pipeline = promisify(streamPipeline);

export interface ModuleMeta {
  filePath: string;
  name: string;
  size: number; // make sure we're actually getting a number, not a string
  lastModified: number; // make sure we're actually getting a number, not a string
}

export interface DataListOptions {}

export const List = async (_: unknown, options: DataListOptions) => {
  const apiKey = resolveApiKey();

  const config: AxiosRequestConfig = {
    method: 'post',
    headers: { 'x-api-key': apiKey, 'content-type': 'application/json' },
    data: { type: 'data' },
  };
  let response = await axios(endpoints.LIST_STORAGE_OBJECTS, config);

  const data = response.data;

  console.log(JSON.stringify(data, undefined, 2));
};

export interface DataMountOptions {}
export const Mount = async (_: unknown, options: DataMountOptions) => {
  const apiKey = resolveApiKey();

  const config: AxiosRequestConfig = {
    method: 'post',
    headers: { 'x-api-key': apiKey, 'content-type': 'application/json' },
  };
  let response = await axios(endpoints.GET_DATA_MOUNT, config);

  const { keyFile, bucket, projectId } = response.data;

  if (keyFile === undefined || bucket === undefined) {
    throw new Error('keyFile or bucket undefined in response from getDataMount');
  }

  // check for gcsfuse
  await asyncSpawn('gcsfuse', ['-v'], { quiet: true });

  await mkdir(`${projectId}/data`, { recursive: true });
  await writeFile(`${projectId}/.gitignore`, 'keyfile.json\ndata');
  const keyfilePath = `${projectId}/keyfile.json`;
  await writeFile(keyfilePath, keyFile);
  await asyncSpawn(
    'gcsfuse',
    [
      `--implicit-dirs`,
      `--only-dir=projects/${projectId}/data`,
      `--key-file=${keyfilePath}`,
      `${bucket}`,
      `${projectId}/data`,
    ],
    { quiet: true }
  );
};

export interface DataUnmountOptions {}
export const Unmount = async (_: unknown, options: DataUnmountOptions) => {
  const apiKey = resolveApiKey();

  const config: AxiosRequestConfig = {
    method: 'post',
    headers: { 'x-api-key': apiKey, 'content-type': 'application/json' },
    data: { type: 'data' },
  };
  let response = await axios(endpoints.GET_DATA_MOUNT, config);

  const { keyFile, bucket, projectId } = response.data;

  if (keyFile === undefined || bucket === undefined) {
    throw new Error('keyFile or bucket undefined in response from getDataMount');
  }

  // check for gcsfuse
  await asyncSpawn('gcsfuse', ['-v'], { quiet: true });
  const keyfilePath = `${projectId}/keyfile.json`;
  await rm(keyfilePath);
  await rm(`${projectId}/.gitignore`);
  await asyncSpawn('fusermount', ['-u', `${projectId}/data`], { quiet: true });
  await rmdir(`${projectId}/data`);
  await rmdir(`${projectId}`);
};

export const Upload = async (
  filenames: string[],
  { tags, overwrite }: { tags?: string[]; overwrite?: boolean }
) => {
  if (filenames.length === 0) {
    return console.log('Please specify at least one filename');
  }

  try {
    for (const file of filenames) {
      await stat(file);
    }
  } catch (error) {
    if ((error as ErrnoException).code === 'ENOENT') {
      console.warn(`Request canceled: ${(error as ErrnoException).path} does not exist`);
      return;
    }
    throw error;
  }

  let results = [];

  for (const filename of filenames) {
    try {
      console.log('upload', { filename, tags });
      const response = await uploadFile({ filename, tags, overwrite });
      results.push(response);
    } catch (error) {
      return console.log(`Error uploading ${filename}: ${(error as Error).message}`);
    }
  }

  console.log(results);
};

interface UploadResponse {
  filename: string;
  remoteFilePath: string;
}

export const uploadFile = async ({
  filename,
  dataId,
  tags,
  overwrite,
}: {
  filename: string;
  dataId?: string;
  tags?: string[];
  overwrite?: boolean;
}): Promise<UploadResponse> => {
  const apiKey = resolveApiKey();
  let fileBuffer;
  let size;
  let url;
  let remoteFilePath;

  fileBuffer = await readFile(filename);
  size = fileBuffer.length;
  const name = filename.split('/').pop();

  const config: AxiosRequestConfig = {
    method: 'post',
    headers: { 'x-api-key': apiKey },
    data: {
      name,
      size,
      metadata: { tags },
      overwrite,
    },
  };
  let response = await axios(endpoints.GET_UPLOAD_DATA_URL, config);

  url = response.data?.uploadUrl;
  remoteFilePath = response.data?.remoteFilePath;

  await axios.put(url, fileBuffer, {
    maxBodyLength: Infinity,
    maxContentLength: Infinity,
    headers: {
      contentLength: `${size}`,
      contentLengthRange: `bytes 0-${size - 1}/${size}`,
    },
  });

  return { filename, remoteFilePath };
};

export const query = async ({
  field,
  comparison,
  compareValue,
  limit,
  collection,
}: QueryOptions): Promise<Array<Record<string, unknown>>> => {
  const apiKey = resolveApiKey();

  const config: AxiosRequestConfig = {
    method: 'post',
    headers: { 'x-api-key': apiKey },
    data: { field, comparison, compareValue, limit, collection },
  };

  try {
    const response = await axios(endpoints.QUERY_COLLECTION, config);

    return response.data;
  } catch (error) {
    console.log(`Something went wrong: ${(error as Error).message}`);

    return [];
  }
};

export const QueryData = async (options: QueryOptions) => {
  const results = await query({ collection: 'data', ...options });
  console.log(results);
};

export const QueryModules = async (options: QueryOptions) => {
  console.log('QueryModules', options);
  const results = await query({ collection: 'modules', ...options });
  console.log(results);
};

export const Get = async (options: QueryOptions & { output?: string }) => {
  const { output } = options;
  const data = await query(options);
  const downloads = data.map(async (value) => {
    const { filePath } = value as { filePath: string };

    // Create directory if output specified
    const dataIdFolder = `${output ? output : '.'}/`;
    try {
      await access(dataIdFolder);
    } catch {
      await mkdir(dataIdFolder, { recursive: true });
    }

    const filename = filePath.split('/').pop();
    const remotePathInProject = filePath.replace(/^projects\/[^/]+\//, '');
    const localFilePath = `${dataIdFolder}/${filename}`;
    try {
      await stat(localFilePath!);
      console.log(`local file already exists: ${localFilePath}`);
      return localFilePath;
    } catch {
      const downloadUrlData = { path: remotePathInProject };
      const downloadUrlConfig = {
        headers: { 'x-api-key': resolveApiKey(), 'content-type': 'application/json' },
      };
      const getDownloadUrl = await axios.post(
        endpoints.GET_PROJECT_DOWNLOAD_URL,
        downloadUrlData,
        downloadUrlConfig
      );
      const downloadUrl = getDownloadUrl.data.replace(/^\/?projects\/(\w)+\/?/, '');

      const download = await axios.get(downloadUrl, { responseType: 'stream' });

      let writeStream;
      writeStream = createWriteStream(localFilePath);
      await pipeline(download.data, writeStream);
      return localFilePath;
    }
  });

  const results = await Promise.all(downloads);
  console.log(JSON.stringify(results, undefined, 2));
};
