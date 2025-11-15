import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import express from 'express';
import { z } from 'zod';
import { List as ListModules, Publish as PublishModule, Run as RunModule } from '../cli/commands/module.js';
import { List as ListData } from '../cli/commands/data.js';
import { List as ListAgents } from '../cli/commands/agent.js';
import { Info as ProjectInfo, ProjectId } from '../cli/commands/project.js';

const PORT = parseInt(process.env.MCP_PORT || '3100');

const server = new McpServer({
  name: 'nstrumenta',
  version: '0.0.1',
});

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
            const modules = await ListModules({ filter: filter ?? '', json: true, depth: null });
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
            await PublishModule();
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
            await RunModule(name, { moduleVersion: version, commandArgs: args });
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
            await ListData(null, {});
            return {
                content: [{ type: 'text', text: 'Data files listed (check console output)' }],
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
            await ListAgents();
            return {
                content: [{ type: 'text', text: 'Agents listed (check console output)' }],
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
            await ProjectInfo();
            return {
                content: [{ type: 'text', text: 'Project info retrieved (check console output)' }],
                structuredContent: { info: {} },
            };
        } catch (error) {
            const message = error instanceof Error ? error.message : 'An unknown error occurred';
            throw new Error(`Failed to get project info: ${message}`);
        }
    }
);

// Resources
server.registerResource(
    'Available Modules',
    'nstrumenta://modules/list',
    {
        description: 'List of all available modules in the project',
        mimeType: 'application/json',
    },
    async () => {
        try {
            const modules = await ListModules({ filter: '', json: true, depth: null });
            return {
                contents: [{
                    uri: 'nstrumenta://modules/list',
                    mimeType: 'application/json',
                    text: JSON.stringify(modules, null, 2),
                }]
            };
        } catch (error) {
            const message = error instanceof Error ? error.message : 'An unknown error occurred';
            throw new Error(`Failed to get modules resource: ${message}`);
        }
    }
);

server.registerResource(
    'Project Configuration',
    'nstrumenta://project/config',
    {
        description: 'Current project configuration and metadata',
        mimeType: 'application/json',
    },
    async () => {
        try {
            const projectId = await ProjectId();
            return {
                contents: [{
                    uri: 'nstrumenta://project/config',
                    mimeType: 'application/json',
                    text: JSON.stringify({ projectId }, null, 2),
                }]
            };
        } catch (error) {
            const message = error instanceof Error ? error.message : 'An unknown error occurred';
            throw new Error(`Failed to get project config resource: ${message}`);
        }
    }
);

async function main() {
    const app = express();
    app.use(express.json());
    
    // Health check
    app.get('/health', (req, res) => {
        res.json({ status: 'ok', service: 'nstrumenta-mcp-server' });
    });
    
    // MCP endpoint - creates new transport per request (stateless mode)
    app.post('/mcp', async (req, res) => {
        try {
            // Extract API key from Authorization header
            const authHeader = req.headers.authorization;
            if (authHeader && authHeader.startsWith('Bearer ')) {
                const apiKey = authHeader.substring(7);
                // Set API key in environment for this request's CLI commands
                process.env.NSTRUMENTA_API_KEY = apiKey;
            } else if (!process.env.NSTRUMENTA_API_KEY) {
                // If no auth header and no env var, return error
                return res.status(401).json({
                    jsonrpc: '2.0',
                    error: {
                        code: -32001,
                        message: 'Authentication required: Missing API key'
                    },
                    id: null
                });
            }

            const transport = new StreamableHTTPServerTransport({
                sessionIdGenerator: undefined,
                enableJsonResponse: true
            });

            res.on('close', () => {
                transport.close();
            });

            await server.connect(transport);
            await transport.handleRequest(req, res, req.body);
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
    });
    
    app.listen(PORT, () => {
        console.log(`Nstrumenta MCP server listening on http://localhost:${PORT}`);
        console.log(`MCP endpoint: http://localhost:${PORT}/mcp`);
        console.log(`Health check: http://localhost:${PORT}/health`);
    });
}

main().catch(console.error);
