import axios from 'axios';
import { resolveApiKey } from '../cli';
import { getContextProperty } from '../lib/context';
import { endpoints } from '../shared';

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
  const projectId = getContextProperty('projectId');
  if (!projectId) {
    return console.log("No project set - use 'auth set [[projectId]]' first");
  }

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
