import { Command } from 'commander';
import Conf from 'conf';
import { Keys } from '../cli';
import { getCurrentContext } from '../lib/context';
import { NstrumentaServer } from '../lib/server';
import { schema } from '../schema';
import { DEFAULT_HOST_PORT } from '../shared';

const config = new Conf(schema as any);

export const Start = async function (
  options: { port: string; project: string; debug: boolean },
  { args }: Command
): Promise<void> {
  console.log(options);
  const { port } = options;
  let apiKey = process.env.NSTRUMENTA_API_KEY;
  if (!apiKey) {
    try {
      apiKey = (config.get('keys') as Keys)[getCurrentContext().projectId];
    } catch {}
  } else {
    console.log('using NSTRUMENTA_API_KEY from environment variable');
  }

  if (!apiKey)
    throw new Error(
      'nstrumenta api key is not set, use "nst auth" or set the NSTRUMENTA_API_KEY environment variable, get a key from your nstrumenta project settings https://nstrumenta.com/projects/ *your projectId here* /settings'
    );

  const server = new NstrumentaServer({ apiKey, port: port || DEFAULT_HOST_PORT });

  await server.run();
};
