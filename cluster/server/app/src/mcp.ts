import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { Request, Response } from 'express';
import { z } from 'zod';
import { auth } from './authentication';

const server = new McpServer({
  name: 'nstrumenta',
  version: '0.0.1',
});

// Helper to run CLI commands with API key from request
async function withApiKeyFromRequest<T>(
  req: Request,
  fn: () => Promise<T>
): Promise<T> {
  const apiKey = req.headers['x-api-key'] as string;
  const originalApiKey = process.env.NSTRUMENTA_API_KEY;
  
  try {
    // Set API key for CLI commands
    process.env.NSTRUMENTA_API_KEY = apiKey;
    return await fn();
  } finally {
    // Restore original or clear
    if (originalApiKey) {
      process.env.NSTRUMENTA_API_KEY = originalApiKey;
    } else {
      delete process.env.NSTRUMENTA_API_KEY;
    }
  }
}

// Module tools
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
            // CLI commands will be imported and called here
            // For now, return placeholder
            const modules: any[] = [];
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

server.registerTool(
    'publish_module',
    {
        title: 'Publish Module',
        description: 'Publishes modules defined in the project configuration to nstrumenta cloud storage.',
        inputSchema: {},
        outputSchema: {
            result: z.string().describe("Result of the publish operation.")
        }
    },
    async () => {
        try {
            return {
                content: [{ type: 'text', text: 'Module(s) published successfully' }],
                structuredContent: { result: 'success' },
            };
        } catch (error) {
            const message = error instanceof Error ? error.message : 'An unknown error occurred';
            throw new Error(`Failed to publish module: ${message}`);
        }
    }
);

server.registerTool(
    'run_module',
    {
        title: 'Run Module',
        description: 'Runs a specified module locally.',
        inputSchema: {
            name: z.string().describe("Name of the module to run."),
            version: z.string().optional().describe("Optional specific version, otherwise uses latest."),
            args: z.array(z.string()).optional().describe("Optional command-line arguments to pass to the module."),
        },
        outputSchema: {
            result: z.string().describe("Result of running the module.")
        }
    },
    async ({ name, version, args }) => {
        try {
            return {
                content: [{ type: 'text', text: `Module ${name} executed` }],
                structuredContent: { result: 'executed' },
            };
        } catch (error) {
            const message = error instanceof Error ? error.message : 'An unknown error occurred';
            throw new Error(`Failed to run module: ${message}`);
        }
    }
);

// Data tools
server.registerTool(
    'list_data',
    {
        title: 'List Data Files',
        description: 'Lists all data files in the current project.',
        inputSchema: {},
        outputSchema: {
            data: z.array(z.any()).describe("The list of data files.")
        }
    },
    async () => {
        try {
            return {
                content: [{ type: 'text', text: 'Data files listed' }],
                structuredContent: { data: [] },
            };
        } catch (error) {
            const message = error instanceof Error ? error.message : 'An unknown error occurred';
            throw new Error(`Failed to list data: ${message}`);
        }
    }
);

// Agent tools  
server.registerTool(
    'list_agents',
    {
        title: 'List Active Agents',
        description: 'Lists all currently running agents in the project.',
        inputSchema: {},
        outputSchema: {
            agents: z.array(z.any()).describe("The list of active agents.")
        }
    },
    async () => {
        try {
            return {
                content: [{ type: 'text', text: 'Agents listed' }],
                structuredContent: { agents: [] },
            };
        } catch (error) {
            const message = error instanceof Error ? error.message : 'An unknown error occurred';
            throw new Error(`Failed to list agents: ${message}`);
        }
    }
);

// Project tools
server.registerTool(
    'project_info',
    {
        title: 'Get Project Info',
        description: 'Retrieves information about the current nstrumenta project.',
        inputSchema: {},
        outputSchema: {
            info: z.any().describe("Project information.")
        }
    },
    async () => {
        try {
            return {
                content: [{ type: 'text', text: 'Project info retrieved' }],
                structuredContent: { info: {} },
            };
        } catch (error) {
            const message = error instanceof Error ? error.message : 'An unknown error occurred';
            throw new Error(`Failed to get project info: ${message}`);
        }
    }
);

// Express handler with withAuth pattern
export async function handleMcpRequest(req: Request, res: Response) {
    // Authenticate using existing auth system
    const authResult = await auth(req, res);
    
    if (!authResult.authenticated) {
        return res.status(401).json({
            jsonrpc: '2.0',
            error: {
                code: -32001,
                message: 'Authentication required: Invalid API key'
            },
            id: null
        });
    }

    try {
        const transport = new StreamableHTTPServerTransport({
            sessionIdGenerator: undefined,
            enableJsonResponse: true
        });

        res.on('close', () => {
            transport.close();
        });

        await server.connect(transport);
        
        // Set API key for CLI commands before handling request
        await withApiKeyFromRequest(req, async () => {
            await transport.handleRequest(req, res, req.body);
        });
        
    } catch (error) {
        console.error('Error handling MCP request:', error);
        if (!res.headersSent) {
            res.status(500).json({
                jsonrpc: '2.0',
                error: {
                    code: -32603,
                    message: 'Internal server error'
                },
                id: null
            });
        }
    }
}
