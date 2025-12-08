import { spawn } from 'child_process';
import { Command } from 'commander';
import * as path from 'path';
import { AgentClient } from '../../agent/client';
import { NstrumentaServer } from '../../server/server';

import { McpClient } from '../mcp';
import { endpoints, getVersionFromPath, inquiryForSelectModule, resolveApiKey } from '../utils';
import { Module, Run } from './module';

export const Start = async function (options: {
  port: string;
  tag?: string;
  debug?: boolean;
}): Promise<void> {
  const { port, tag, debug } = options;
  const apiKey = resolveApiKey();

  // Start the local WebSocket server for sensor data
  const server = new NstrumentaServer({
    apiKey,
    port: port ?? 8088,
    debug,
  });

  // If tag is provided, also start the agent client
  if (tag || process.env.HOST_INSTANCE_ID) {
    const agentClient = new AgentClient({
      apiKey,
      tag: tag || process.env.HOST_INSTANCE_ID,
      debug,
      moduleRunner: Run, // Inject the CLI module runner
    });
    
    // Connect agent in parallel with server startup
    agentClient.connect().catch((err) => {
      console.error('Agent client connection failed:', err);
    });
  }

  await server.run();
};

export const List = async () => {
  try {
    const mcp = new McpClient();
    const { agents } = await mcp.listAgents();
    console.log(agents);
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

    const modules = (await response.json()) as Module[];

    modules
      .map((module) => module.name)
      .forEach((path) => {
        console.log({ path });
        const name = path.split('#')[0];
        serverModules.add(name);
      });

    module = await inquiryForSelectModule(Array.from(serverModules));

    const moduleVersions = modules
      .map((module) => module.name)
      .filter((path) => path.startsWith(module))
      .map((path) => getVersionFromPath(path));
    console.log(moduleVersions);

    version = await inquiryForSelectModule(moduleVersions);
  }

  const resolvedAgentId = agentId
    ? agentId
    : tag
    ? await getAgentIdByTag(apiKey, tag)
    : null;

  if (!resolvedAgentId) {
    console.error(`Agent id required`);
    return;
  }

  try {
    const mcp = new McpClient();
    const { actionId } = await mcp.runModule(resolvedAgentId, module, {
      version,
      args,
    });
    console.log(`created action: ${actionId} on agent ${resolvedAgentId}`);
  } catch (err) {
    console.error('Error:', (err as Error).message);
  }
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
  const apiKey = resolveApiKey();

  const agentId = agentIdArg ? agentIdArg : tag ? await getAgentIdByTag(apiKey, tag) : null;

  if (!agentId) {
    console.error(`Agent id required`);
    return;
  }

  try {
    const mcp = new McpClient();
    const { actionId } = await mcp.setAgentAction(agentId, actionString);
    console.log(`created action: ${actionId} on agent ${agentId}`, JSON.parse(actionString));
  } catch (err) {
    console.error('Error:', (err as Error).message);
  }
};

export const CleanActions = async (agentId: string) => {
  try {
    const mcp = new McpClient();
    await mcp.cleanAgentActions(agentId);
    console.log('Agent actions cleaned successfully');
  } catch (err) {
    console.error('Error:', (err as Error).message);
  }
};
