import { endpoints, resolveApiKey } from '../utils';

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

  const config = {
    method: 'POST',
    headers: headers,
    body: JSON.stringify({}),
  };

  try {
    const response = await fetch(endpoints.GET_MACHINES, config);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: Array<Machine> = (await response.json()) as Array<Machine>;
    return data;
  } catch (error) {
    console.error(`Something went wrong: ${(error as Error).message}`);
    return [];
  }
};

export const ListMachines = async () => {
  try {
    const response = await GetMachines();
    console.log(response);
  } catch (error) {
    console.error(error);
  }
};
