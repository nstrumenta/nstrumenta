import axios from 'axios';
import { resolveApiKey } from '../cli';
import { NstrumentaServer } from '../lib/server';
import { DEFAULT_HOST_PORT, endpoints } from '../shared';

export const Start = async function (options: { port: string; tag?: string }): Promise<void> {
  const { port, tag } = options;
  const apiKey = resolveApiKey();

  const server = new NstrumentaServer({ apiKey, port: port || DEFAULT_HOST_PORT, tag });

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

export const SetAction = async (agentId: string, options: { action: string; tag: string }) => {
  const { action: actionString, tag } = options;
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
      data: { action, agentId, tag },
    });

    const actionId: string | undefined =
      response.data?._path?.segments[response.data?._path?.segments.length - 1];
    console.log(`created action: ${actionId} on agent ${agentId}`, action);
  } catch (err) {
    console.error('Error:', (err as Error).message);
  }
};

export const CleanActions = async (agentId: string) => {
  const apiKey = resolveApiKey();

  try {
    await axios({
      method: 'POST',
      url: endpoints.CLEAN_AGENT_ACTIONS,
      headers: {
        contentType: 'application/json',
        'x-api-key': apiKey,
      },
      data: { agentId },
    });
  } catch (err) {
    console.error('Error:', (err as Error).message);
  }
};
