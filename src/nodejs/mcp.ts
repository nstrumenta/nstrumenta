import { createMcpServer } from '@mcp/server';
import { z } from 'zod';
import { List } from '../cli/commands/module';

const server = createMcpServer({
  tools: {
    list_modules: {
      input: z.object({ filter: z.string().optional() }),
      output: z.any(),
      run: async ({ input }) => {
        const modules = await List({ filter: input.filter, json: true });
        return modules;
      },
    },
  },
});

server.listen();
