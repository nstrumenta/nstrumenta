import axios, { Axios, AxiosRequestConfig } from 'axios';
import { resolveApiKey } from '../utils';
import { endpoints, ObjectTypes } from '../../shared';
import { readFile, stat } from 'fs/promises';
import ErrnoException = NodeJS.ErrnoException;

export interface ModuleMeta {
  filePath: string;
  name: string;
  size: number; // make sure we're actually getting a number, not a string
  lastModified: number; // make sure we're actually getting a number, not a string
}

export interface DataListOptions {}

export const List = async (_: unknown, options: DataListOptions) => {
  const apiKey = resolveApiKey();

  try {
    const config: AxiosRequestConfig = {
      method: 'post',
      headers: { 'x-api-key': apiKey, 'content-type': 'application/json' },
      data: { type: ObjectTypes.DATA },
    };
    let response = await axios(endpoints.LIST_STORAGE_OBJECTS, config);

    const data = response.data;

    console.log(data);
  } catch (error) {
    console.log(`Problem fetching data ${(error as Error).name}`);
  }
};

export const Upload = async (filenames: string[]) => {
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

  let dataId: string | undefined;
  let results = [];
  for (const filename of filenames) {
    console.log('upload', { filename, dataId });
    const response = await uploadFile({ filename, dataId });
    results.push(response);
    if (!dataId) {
      dataId = response.dataId;
    }
  }
};

interface UploadResponse {
  filename: string;
  remoteFilePath: string;
  dataId: string;
}

export const uploadFile = async ({
  filename,
  dataId,
}: {
  filename: string;
  dataId?: string;
}): Promise<UploadResponse> => {
  const apiKey = resolveApiKey();
  let fileBuffer;
  let size;
  let url;
  let remoteFilePath;

  fileBuffer = await readFile(filename);
  size = fileBuffer.length;

  const config: AxiosRequestConfig = {
    method: 'post',
    headers: { 'x-api-key': apiKey },
    data: { name: filename, size, dataId },
  };
  let response = await axios(endpoints.GET_UPLOAD_DATA_URL, config);

  url = response.data?.uploadUrl;
  remoteFilePath = response.data?.remoteFilePath;
  dataId = response.data?.dataId;
  if (typeof dataId === 'undefined') {
    throw new Error('dataId is invalid');
  }

  await axios.put(url, fileBuffer, {
    maxBodyLength: Infinity,
    maxContentLength: Infinity,
    headers: {
      contentLength: `${size}`,
      contentLengthRange: `bytes 0-${size - 1}/${size}`,
    },
  });

  return { filename, remoteFilePath, dataId };
};
