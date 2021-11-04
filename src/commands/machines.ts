import Conf from 'conf';
import axios from 'axios';
import Colors, { blue } from 'colors';
import { getContextProperty } from '../lib';

const { red } = Colors;

// TODO: add a local bool to context to handle this; or something like that
const endpoints = process.env.LOCAL
  ? {
      GET_MACHINES: 'http://localhost:8080',
    }
  : {
      GET_MACHINES: 'https://us-central1-macro-coil-194519.cloudfunctions.net/getMachines',
    };

const config = new Conf();

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
  const currentProjectId = getContextProperty('currentProjectId');
  if (!currentProjectId) {
    return console.log("No project set - use 'auth set [[projectId]]' first");
  }

  const key = config.get(`keys.${currentProjectId}`, '') as string;
  const headers = {
    'x-api-key': key,
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
    console.log(blue(JSON.stringify(response?.data)));
  } catch (error) {
    console.log(red('something went wrong'));
  }
};
