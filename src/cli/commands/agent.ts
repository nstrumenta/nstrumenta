import { Command } from 'commander';
import { NstrumentaServer } from '../../nodejs/server';

import { endpoints, getVersionFromPath, inquiryForSelectModule, resolveApiKey } from '../utils';

export const Start = async function (options: {
  port: string;
  tag?: string;
  debug?: string;
}): Promise<void> {
  const { port, tag, debug } = options;
  const apiKey = resolveApiKey();

  const server = new NstrumentaServer({
    apiKey,
    port: port ?? 8088,
    tag: tag ? tag : process.env.HOST_INSTANCE_ID,
    debug: debug === 'true',
  });

  await server.run();
};

export const List = async () => {
  const apiKey = resolveApiKey();

  try {
    const response = await fetch(endpoints.LIST_AGENTS, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log(data);
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
    let response = await fetch(endpoints.LIST_MODULES, {
      method: 'POST',
      headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' },
    });

    let data = await response.json();

    (data as [string, Object][])
      .map((nameObjectPair) => nameObjectPair[0])
      .forEach((path) => {
        console.log({ path });
        const name = path.split('#')[0];
        serverModules.add(name);
      });

    module = await inquiryForSelectModule(Array.from(serverModules));

    const moduleVersions = (data as [string, Object][])
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
    const response = await fetch(endpoints.GET_AGENT_ID_BY_TAG, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify({ tag }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    agentId = data as string | undefined;
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
    const response = await fetch(endpoints.SET_AGENT_ACTION, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify({ action, agentId }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const actionId = data;
    console.log(`created action: ${actionId} on agent ${agentId}`, action);
  } catch (err) {
    console.error('Error:', (err as Error).message);
  }
};

export const CleanActions = async (agentId: string) => {
  const apiKey = resolveApiKey();

  try {
    const response = await fetch(endpoints.CLEAN_AGENT_ACTIONS, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify({ agentId }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    console.log('Agent actions cleaned successfully');
  } catch (err) {
    console.error('Error:', (err as Error).message);
  }
};
