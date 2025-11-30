import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { AsyncLocalStorage } from 'async_hooks';
import { Request, Response } from 'express';
import { z } from 'zod';
import { auth } from './authentication';
import { getModulesList } from './api/listModules';
import { getAgentsList } from './api/listAgents';
import { getDataList } from './api/listStorageObjects';
import { getProjectInfo } from './api/getProject';
import { createAgentAction } from './api/setAgentAction';

const server = new McpServer({
  name: 'nstrumenta',
  version: '0.0.1',
});

type McpRequestContext = {
    projectId: string;
};

const requestContext = new AsyncLocalStorage<McpRequestContext>();

function getProjectId(): string {
    const context = requestContext.getStore();
    if (!context?.projectId) {
        throw new Error('Project context missing for MCP request');
    }

    return context.projectId;
}

server.registerTool(
    'list_modules',
    {
        title: 'List Modules',
        description: 'Lists all modules in the project',
        inputSchema: {
            filter: z
                .string()
                .optional()
                .describe('Optional filter string to match against module data'),
        },
        outputSchema: {
            modules: z
                .array(z.any())
                .describe('Array of module objects with metadata'),
        },
    },
    async ({ filter }) => {
        try {
            const projectId = getProjectId();
            let modules = await getModulesList(projectId);

            if (filter) {
                modules = modules.filter((m) =>
                    JSON.stringify(m).toLowerCase().includes(filter.toLowerCase()),
                );
            }

            return {
                content: [{ type: 'text', text: JSON.stringify(modules, null, 2) }],
                structuredContent: { modules },
            };
        } catch (error) {
            const message =
                error instanceof Error ? error.message : 'An unknown error occurred';
            throw new Error(`Failed to list modules: ${message}`);
        }
    },
);

server.registerTool(
    'run_module',
    {
        title: 'Run Module',
        description: 'Triggers an agent to run a specified module.',
        inputSchema: {
            agentId: z.string().describe('ID of the agent to run the module on'),
            moduleName: z.string().describe('Name of the module to run'),
            moduleVersion: z
                .string()
                .optional()
                .describe('Optional specific version, otherwise uses latest'),
            args: z
                .array(z.string())
                .optional()
                .describe('Optional command-line arguments'),
        },
        outputSchema: {
            actionId: z.string().describe('ID of the created action'),
        },
    },
    async ({ agentId, moduleName, moduleVersion, args }) => {
        try {
            const projectId = getProjectId();
            const action = {
                task: 'runModule',
                status: 'pending',
                data: {
                    moduleName,
                    moduleVersion,
                    args: args || [],
                },
            };
            const actionId = await createAgentAction(projectId, agentId, action);

            return {
                content: [
                    {
                        type: 'text',
                        text: `Action ${actionId} created to run ${moduleName} on agent ${agentId}`,
                    },
                ],
                structuredContent: { actionId },
            };
        } catch (error) {
            const message =
                error instanceof Error ? error.message : 'An unknown error occurred';
            throw new Error(`Failed to run module: ${message}`);
        }
    },
);

server.registerTool(
    'list_data',
    {
        title: 'List Data',
        description: 'Lists data objects in the current project.',
        inputSchema: {
            type: z
                .string()
                .optional()
                .default('data')
                .describe("Type of objects to list (e.g., 'data', 'modules')"),
        },
        outputSchema: {
            objects: z
                .array(z.any())
                .describe('List of data objects with id and metadata'),
        },
    },
    async ({ type }) => {
        try {
            const projectId = getProjectId();
            const objects = await getDataList(projectId, type);

            return {
                content: [{ type: 'text', text: JSON.stringify(objects, null, 2) }],
                structuredContent: { objects },
            };
        } catch (error) {
            const message =
                error instanceof Error ? error.message : 'An unknown error occurred';
            throw new Error(`Failed to list data: ${message}`);
        }
    },
);

server.registerTool(
    'list_agents',
    {
        title: 'List Agents',
        description: 'Lists all agents in the project',
        inputSchema: {},
        outputSchema: {
            agents: z
                .array(z.tuple([z.string(), z.any()]))
                .describe('Array of [agentId, agentData] tuples'),
        },
    },
    async () => {
        try {
            const projectId = getProjectId();
            const agents = await getAgentsList(projectId);

            return {
                content: [{ type: 'text', text: JSON.stringify(agents, null, 2) }],
                structuredContent: { agents },
            };
        } catch (error) {
            const message =
                error instanceof Error ? error.message : 'An unknown error occurred';
            throw new Error(`Failed to list agents: ${message}`);
        }
    },
);

server.registerTool(
    'get_project',
    {
        title: 'Get Project',
        description: 'Retrieves information about the current project.',
        inputSchema: {},
        outputSchema: {
            project: z
                .object({
                    id: z.string(),
                })
                .passthrough()
                .describe('Project information'),
        },
    },
    async () => {
        try {
            const projectId = getProjectId();
            const project = await getProjectInfo(projectId);

            return {
                content: [{ type: 'text', text: JSON.stringify(project, null, 2) }],
                structuredContent: { project },
            };
        } catch (error) {
            const message =
                error instanceof Error ? error.message : 'An unknown error occurred';
            throw new Error(`Failed to get project: ${message}`);
        }
    },
);

// Express handler with auth
export async function handleMcpRequest(req: Request, res: Response) {
    try {
        const apiKeyAuth = await auth(req, res);
        if (!apiKeyAuth.authenticated) {
            return respondUnauthorized(
                res,
                apiKeyAuth.message || 'Authentication required: invalid API key',
            );
        }

        await requestContext.run({ projectId: apiKeyAuth.projectId }, async () => {
            await dispatchMcpRequest(req, res);
        });
    } catch (error) {
        console.error('Error handling MCP request:', error);
        if (!res.headersSent) {
            respondServerError(res);
        }
    }
}

async function dispatchMcpRequest(req: Request, res: Response) {
    const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
        enableJsonResponse: true,
    });

    res.on('close', () => {
        transport.close();
    });

    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
}

function respondJsonRpcError(res: Response, status: number, message: string, code = -32001) {
    return res.status(status).json({
        jsonrpc: '2.0',
        error: {
            code,
            message,
        },
        id: null,
    });
}

function respondUnauthorized(res: Response, message: string) {
    res.setHeader(
        'WWW-Authenticate',
        `ApiKey realm="nstrumenta", error="invalid_api_key", error_description="${message}"`,
    );
    return respondJsonRpcError(res, 401, message);
}

function respondServerError(res: Response) {
    return respondJsonRpcError(res, 500, 'Internal server error', -32603);
}
