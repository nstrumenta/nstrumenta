import axios, { AxiosError } from 'axios';
import { Command } from 'commander';
import { inquiryForSelectModule, resolveApiKey } from '../cli/utils';
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

export const RunModule = async (
  {
    agentId,
    tag,
    module: moduleName,
  }: {
    tag?: string;
    module: string;
    agentId: string | undefined;
  },
  { args }: Command
) => {
  const apiKey = resolveApiKey();
  let module = moduleName;
  let serverModules = new Set<string>();

  if (!module) {
    let response = await axios(endpoints.LIST_MODULES, {
      method: 'post',
      headers: { 'x-api-key': apiKey, 'content-type': 'application/json' },
    });

    response.data.forEach((path: string) => {
      const name = path.split('/')[0];
      serverModules.add(name);
    });

    module = await inquiryForSelectModule(Array.from(serverModules));
  }

  const action = JSON.stringify({
    task: 'runModule',
    status: 'pending',
    data: { module, tag, args },
  });

  SetAction(agentId, { action, tag });
};

export const SetAction = async (
  agentId: string | undefined,
  options: { action: string; tag?: string }
) => {
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
    console.error('Error:', (err as AxiosError).response?.data);
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
