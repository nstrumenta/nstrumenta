import axios from 'axios';
import { resolveApiKey } from '../cli';
import { NstrumentaServer } from '../lib/server';
import { DEFAULT_HOST_PORT, endpoints } from '../shared';

export type ListAgentsResponse = [string, object][];

export const Start = async function (options: { port: string }): Promise<void> {
  console.log({ options });
  const { port } = options;
  const apiKey = resolveApiKey();

  const server = new NstrumentaServer({ apiKey, port: port || DEFAULT_HOST_PORT });

  await server.run();
};

export const List = async () => {
  const apiKey = resolveApiKey();

  try {
    const response = await axios({
      method: 'GET',
      url: endpoints.LIST_AGENTS,
      headers: {
        contentType: 'application/json',
        'x-api-key': apiKey,
      },
    });

    console.log(response.data);
  } catch (err) {
    console.error('Error:', (err as Error).message);
  }
};

export const SetAction = async (agentId: string, options: { action: string }) => {
  const { action: actionString } = options;
  const action = JSON.parse(actionString);
  const apiKey = resolveApiKey();

  try {
    const response = await axios({
      method: 'POST',
      url: endpoints.SET_AGENT_ACTION,
      headers: {
        contentType: 'application/json',
        'x-api-key': apiKey,
      },
      data: { agentId, action },
    });

    console.log(response.data);
  } catch (err) {
    console.error('Error:', (err as Error).message);
  }
};
