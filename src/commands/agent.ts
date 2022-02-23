import Conf from 'conf';
import axios from 'axios';
import { Keys } from '../cli';
import { getCurrentContext } from '../lib/context';
import { NstrumentaServer } from '../lib/server';
import { schema } from '../schema';
import { DEFAULT_HOST_PORT, endpoints } from '../shared';

const config = new Conf(schema as any);

export interface AgentSubCommandOptions {
  project: string;
  debug: boolean;
}

export type ListAgentsResponse = [string, object][];

const resolveApiKey = (project?: string) => {
  let apiKey = process.env.NSTRUMENTA_API_KEY;
  if (!apiKey) {
    try {
      apiKey = Boolean(project)
        ? project
        : (config.get('keys') as Keys)[getCurrentContext().projectId];
    } catch {}
  } else {
    console.log('using NSTRUMENTA_API_KEY from environment variable');
  }

  if (!apiKey)
    throw new Error(
      'nstrumenta api key is not set, use "nst auth" or set the NSTRUMENTA_API_KEY environment variable, get a key from your nstrumenta project settings https://nstrumenta.com/projects/ *your projectId here* /settings'
    );

  return apiKey;
};

export const Start = async function (
  options: AgentSubCommandOptions & { port: string }
): Promise<void> {
  console.log({ options });
  const { port } = options;
  const apiKey = resolveApiKey(options.project);

  const server = new NstrumentaServer({ apiKey, port: port || DEFAULT_HOST_PORT });

  await server.run();
};

export const List = async (options: AgentSubCommandOptions) => {
  const apiKey = resolveApiKey(options.project);

  try {
    const response = await axios({
      method: 'GET',
      url: endpoints.LIST_AGENTS,
      headers: {
        contentType: 'application/json',
        'x-api-key': apiKey,
      },
    });

    console.log(response);
  } catch (err) {
    console.error('Error:', (err as Error).message);
  }
};
