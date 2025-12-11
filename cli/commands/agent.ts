import { spawn } from 'child_process';
import { Command } from 'commander';
import * as path from 'path';
import { AgentClient } from '../../agent/client';
import { NstrumentaServer } from '../../server/server';

import { McpClient } from '../mcp';
import { getVersionFromPath, inquiryForSelectModule, resolveApiKey } from '../utils';
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
  let version;
  let serverModules = new Set<string>();

  if (!module) {
    const mcp = new McpClient();
    const { modules } = await mcp.listModules();

    modules
      .map((module: any) => module.name)
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
    ? await getAgentIdByTag(tag)
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

const getAgentIdByTag = async (tag: string): Promise<string | undefined> => {
  try {
    const mcp = new McpClient();
    const { agents } = await mcp.listAgents();
    // Find agent with matching tag
    const match = agents.find(([_, agentData]: [string, any]) => agentData.tag === tag);
    return match ? match[0] : undefined;
  } catch (error) {
    console.error((error as Error).message);
    return undefined;
  }
};

export const SetAction = async (
  agentIdArg: string | undefined,
  options: { action: string; tag?: string }
) => {
  const { action: actionString, tag } = options;

  const agentId = agentIdArg ? agentIdArg : tag ? await getAgentIdByTag(tag) : null;

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
