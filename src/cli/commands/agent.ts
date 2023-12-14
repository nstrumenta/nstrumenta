import axios, { AxiosError } from 'axios';
import { Command } from 'commander';
import { NstrumentaServer } from '../../nodejs/server';

import { endpoints, getVersionFromPath, inquiryForSelectModule, resolveApiKey } from '../utils';

export const Start = async function (options: {
  port: string;
  tag?: string;
  debug?: boolean;
}): Promise<void> {
  const { port, tag, debug } = options;
  const apiKey = resolveApiKey();

  const server = new NstrumentaServer({
    apiKey,
    port: port ?? 8088,
    tag: tag ? tag : process.env.HOST_INSTANCE_ID,
    debug,
  });

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
    module,
  }: {
    tag?: string;
    module: string;
    agentId: string | undefined;
  },
  { args }: Command
) => {
  const apiKey = resolveApiKey();
  let version;
  let serverModules = new Set<string>();

  if (!module) {
    let response = await axios(endpoints.LIST_MODULES, {
      method: 'post',
      headers: { 'x-api-key': apiKey, 'content-type': 'application/json' },
    });

    (response.data as [string, Object][])
      .map((nameObjectPair) => nameObjectPair[0])
      .forEach((path) => {
        console.log({ path });
        const name = path.split('#')[0];
        serverModules.add(name);
      });

    module = await inquiryForSelectModule(Array.from(serverModules));

    const moduleVersions = (response.data as [string, Object][])
      .map((nameObjectPair: any) => nameObjectPair[0])
      .filter((path) => path.startsWith(module))
      .map(({ id: path }: { id: string }) => getVersionFromPath(path));
    console.log(moduleVersions);

    version = await inquiryForSelectModule(moduleVersions);
  }

  const action = JSON.stringify({
    task: 'runModule',
    status: 'pending',
    data: { module, tag, args, version },
  });

  SetAction(agentId, { action, tag });
};

const getAgentIdByTag = async (apiKey: string, tag: string): Promise<string | undefined> => {
  let agentId: string | undefined;

  try {
    const response: { data: string } = await axios({
      method: 'POST',
      url: endpoints.GET_AGENT_ID_BY_TAG,
      headers: {
        contentType: 'application/json',
        'x-api-key': apiKey,
      },
      data: { tag },
    });

    agentId = response.data;
  } catch (error) {
    console.error((error as Error).message);
  }

  return agentId;
};

export const SetAction = async (
  agentIdArg: string | undefined,
  options: { action: string; tag?: string }
) => {
  const { action: actionString, tag } = options;
  const action = JSON.parse(actionString);
  const apiKey = resolveApiKey();

  const agentId = agentIdArg ? agentIdArg : tag ? await getAgentIdByTag(apiKey, tag) : null;

  if (!agentId) {
    console.error(`Agent id required`);
    return;
  }

  try {
    const response: { data: string } = await axios({
      method: 'POST',
      url: endpoints.SET_AGENT_ACTION,
      headers: {
        contentType: 'application/json',
        'x-api-key': apiKey,
      },
      data: { action, agentId },
    });

    const actionId = response.data;
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
