import axios, { AxiosRequestConfig } from 'axios';
import { createWriteStream } from 'fs';
import { access, mkdir, readFile, rm, rmdir, stat, writeFile } from 'fs/promises';
import { pipeline as streamPipeline } from 'stream';
import { promisify } from 'util';
import { DataQueryOptionsCLI, DataQueryResponse, ObjectTypes, getEndpoints } from '../../shared';
import { asyncSpawn, resolveApiKey } from '../utils';
import ErrnoException = NodeJS.ErrnoException;

const endpoints = getEndpoints(process.env.NSTRUMENTA_API_URL);
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
    data: { type: ObjectTypes.DATA },
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
    data: { type: ObjectTypes.DATA },
  };
  let response = await axios(endpoints.GET_DATA_MOUNT, config);

  const { keyFile, bucket, projectId } = response.data;

  if (keyFile === undefined || bucket === undefined) {
    throw new Error('keyFile or bucket undefined in response from getDataMount');
  }

  // check for gcsfuse
  await asyncSpawn('gcsfuse', ['-v']);

  await mkdir(`${projectId}/data`, { recursive: true });
  await writeFile(`${projectId}/.gitignore`, 'keyfile.json\ndata');
  const keyfilePath = `${projectId}/keyfile.json`;
  await writeFile(keyfilePath, keyFile);
  await asyncSpawn('gcsfuse', [
    `--implicit-dirs`,
    `--only-dir=projects/${projectId}/data`,
    `--key-file=${keyfilePath}`,
    `${bucket}`,
    `${projectId}/data`,
  ]);
};

export interface DataUnmountOptions {}
export const Unmount = async (_: unknown, options: DataUnmountOptions) => {
  const apiKey = resolveApiKey();

  const config: AxiosRequestConfig = {
    method: 'post',
    headers: { 'x-api-key': apiKey, 'content-type': 'application/json' },
    data: { type: ObjectTypes.DATA },
  };
  let response = await axios(endpoints.GET_DATA_MOUNT, config);

  const { keyFile, bucket, projectId } = response.data;

  if (keyFile === undefined || bucket === undefined) {
    throw new Error('keyFile or bucket undefined in response from getDataMount');
  }

  // check for gcsfuse
  await asyncSpawn('gcsfuse', ['-v']);
  const keyfilePath = `${projectId}/keyfile.json`;
  await rm(keyfilePath);
  await rm(`${projectId}/.gitignore`);
  await asyncSpawn('fusermount', ['-u', `${projectId}/data`]);
  await rmdir(`${projectId}/data`);
  await rmdir(`${projectId}`);
};

export const Upload = async (
  filenames: string[],
  { tags, dataId, overwrite }: { tags?: string[]; dataId?: string; overwrite?: boolean }
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

  const apiKey = resolveApiKey();
  if (!dataId) {
    const res = await axios(endpoints.GENERATE_DATA_ID, {
      method: 'post',
      headers: { 'x-api-key': apiKey },
    });
    const { data } = res;
    dataId = data.dataId;
  }

  let results = [];

  // First upload the files to a new dataId
  for (const filename of filenames) {
    try {
      console.log('upload', { filename, dataId, tags });
      const response = await uploadFile({ filename, dataId, tags, overwrite });
      results.push(response);
    } catch (error) {
      return console.log(`Error uploading ${filename}: ${(error as Error).message}`);
    }
  }

  return console.log({ dataId });
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
  filenames,
  id,
  tag: tags,
  before: b,
  after: a,
  limit: l = '1',
  metadata: metadataString,
}: DataQueryOptionsCLI): Promise<DataQueryResponse> => {
  const apiKey = resolveApiKey();
  const before = b ? parseInt(b, 10) : undefined;
  const after = a ? parseInt(a, 10) : undefined;
  const limit = l ? parseInt(l, 10) : undefined;
  const metadata = metadataString ? JSON.parse(metadataString) : {};

  const data = { id, tags, before, after, limit, filenames, metadata };

  const config: AxiosRequestConfig = {
    method: 'post',
    headers: { 'x-api-key': apiKey },
    data,
  };

  try {
    const response = await axios(endpoints.QUERY_DATA, config);

    return response.data;
  } catch (error) {
    console.log(`Something went wrong: ${(error as Error).message}`);

    return [];
  }
};

export const Query = async (options: DataQueryOptionsCLI) => {
  const data = await query(options);
  console.log(JSON.stringify(data, undefined, 2));
};

export const Get = async (options: DataQueryOptionsCLI & { output?: string }) => {
  const { output } = options;
  const data = await query(options);
  const downloads = data.map(async (value) => {
    const { id, filePath } = value;

    // Create directory for this dataId
    const dataIdFolder = `${output ? output : '.'}/${id}`;
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
