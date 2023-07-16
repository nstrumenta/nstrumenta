import axios from 'axios';
import { resolveApiKey } from '../utils';
import { getEndpoints } from '../../shared';

const endpoints = getEndpoints(process.env.NSTRUMENTA_API_URL);

export interface Machine {
  name: string;
  status: string;
  createdAt: string;
  downloadUrl: string;
  serverStatus: string;
  sandboxes: string[];
  url: string;
  wsUrl: string;
}

export const GetMachines = async () => {
  const apiKey = resolveApiKey();
  const headers = {
    'x-api-key': apiKey,
    'Content-Type': 'application/json',
  };
  return axios.post<Array<Machine>>(
    endpoints.GET_MACHINES,
    {},
    {
      headers,
    }
  );
};

export const ListMachines = async () => {
  try {
    const response = await GetMachines();
    console.log(response?.data);
  } catch (error) {
    console.error(error);
  }
};
