import axios, { Axios, AxiosRequestConfig } from 'axios';
import { resolveApiKey } from '../utils';
import { endpoints, ObjectTypes } from '../../shared';
import { readFile } from 'fs/promises';

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

export const Upload = async (filename: string) => {
  if (!filename) {
    return console.log('Please pass filename as first argument');
  }
  const apiKey = resolveApiKey();
  let fileBuffer;
  let size;
  let url;
  let remoteFilePath;

  try {
    fileBuffer = await readFile(filename);
    size = fileBuffer.length;
  } catch (error) {
    console.error(`Problem reading file ${filename}:` + (error as Error).message);
    return;
  }

  try {
    const config: AxiosRequestConfig = {
      method: 'post',
      headers: { 'x-api-key': apiKey },
      data: { name: filename, size },
    };
    let response = await axios(endpoints.GET_UPLOAD_DATA_URL, config);

    url = response.data?.uploadUrl;
    remoteFilePath = response.data?.remoteFilePath;
  } catch (error) {
    console.log(`Problem uploading data ${(error as Error).message}`);
    return;
  }

  try {
    const response = await axios.put(url, fileBuffer, {
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
      headers: {
        contentLength: `${size}`,
        contentLengthRange: `bytes 0-${size - 1}/${size}`,
      },
    });
  } catch (error) {
    console.log(`Problem uploading data ${(error as Error).message}`);
    return;
  }

  console.log(`{ name: ${filename}, remoteFilePath: ${remoteFilePath} }`);
};
