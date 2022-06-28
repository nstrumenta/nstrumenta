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

    console.log(JSON.stringify(data, undefined, 2));
  } catch (error) {
    console.log(`Problem fetching data ${(error as Error).name}`);
  }
};

export const Upload = async (filenames: string[], { tags }: { tags?: string[] }) => {
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

  // First upload the files to a new dataId
  for (const filename of filenames) {
    try {
      console.log('upload', { filename, dataId, tags });
      const response = await uploadFile({ filename, dataId, tags });
      results.push(response);
      if (!dataId) {
        dataId = response.dataId;
      }
    } catch (error) {
      return console.log(`Error uploading ${filename}: ${(error as Error).message}`);
    }
  }

  // Now that we have the dataId, update this bucket's metadata
  try {
    const apiKey = resolveApiKey();

    const metadata = { tags, filenames };
    await axios(endpoints.SET_DATA_METADATA, {
      method: 'post',
      data: { metadata, merge: true, dataId },
      headers: { 'x-api-key': apiKey },
    });
  } catch (error) {
    return console.log(`Problem setting metadata, transaction failed: ${(error as Error).message}`);
  }

  return console.log({ dataId });
};

interface UploadResponse {
  filename: string;
  remoteFilePath: string;
  dataId: string;
}

export const uploadFile = async ({
  filename,
  dataId,
  tags,
}: {
  filename: string;
  dataId?: string;
  tags?: string[];
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
    data: {
      name: filename,
      size,
      dataId,
    },
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

export interface DataGetOptions {
  tag?: string[];
  before?: number;
  after?: number;
  limit?: number;
}
export const Get = async (
  filenames: string[],
  { tag: tags, before, after, limit = 1 }: DataGetOptions
) => {
  const apiKey = resolveApiKey();

  const data = {};
  const config: AxiosRequestConfig = {
    method: 'post',
    headers: { 'x-api-key': apiKey },
    data: {
      tags,
      limit,
      filenames,
    },
  };

  try {
    const results = await axios(endpoints.QUERY_DATA, config);

    console.log(results);
  } catch (error) {
    console.log('Something went wrong');
  }
};
