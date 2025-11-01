import { McpServer } from '@modelcontextprotocol/sdk/server';
import { z } from 'zod';
import { List } from '../cli/commands/module';

const server = new McpServer({
  name: 'nstrumenta',
  version: '0.0.1',
  tools: {
    list_modules: {
      input: z.object({ filter: z.string().optional() }),
      output: z.any(),
      run: async ({ input }) => {
        const modules = await List({ filter: input.filter, json: true, depth: null });
        return {
          content: [{ type: 'text', text: JSON.stringify(modules) }],
          structuredContent: modules,
        };
      },
    },
  },
});

server.listen();
