import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { List } from '../cli/commands/module';

const server = new McpServer({
  name: 'nstrumenta',
  version: '0.0.1',
});

server.registerTool(
    'list_modules',
    {
        title: 'List Nstrumenta Modules',
        description: 'Lists all available modules in the current project.',
        inputSchema: {
            filter: z.string().optional().describe("A string to filter the list of modules by."),
        },
        outputSchema: {
            modules: z.array(z.any()).describe("The list of modules.")
        }
    },
    async ({ filter }) => {
        try {
            const modules = await List({ filter: filter ?? '', json: true, depth: null });
            return {
                content: [{ type: 'text', text: JSON.stringify(modules, null, 2) }],
                structuredContent: { modules },
            };
        } catch (error) {
            const message = error instanceof Error ? error.message : 'An unknown error occurred';
            throw new Error(`Failed to list modules: ${message}`);
        }
    }
);

async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
}

main();
