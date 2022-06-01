import axios, { Axios, AxiosRequestConfig } from 'axios';
import { resolveApiKey } from '../utils';
import { endpoints, ObjectTypes } from '../../shared';

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

    const data = response.data.map(({ id }: { id: string }) => id);

    console.log(data);
  } catch (error) {
    console.log(`Problem fetching data ${(error as Error).name}`);
  }
};
