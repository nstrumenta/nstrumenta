import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { AsyncLocalStorage } from 'async_hooks';
import { Request, Response } from 'express';
import { z } from 'zod';
import { auth } from './authentication';
import { firestore } from './authentication/ServiceAccount';
import { getModulesList } from './api/listModules';
import { getAgentsList } from './api/listAgents';
import { getDataList } from './api/listStorageObjects';
import { getProjectInfo } from './api/getProject';
import { createAgentAction } from './api/setAgentAction';
import { cancelAgentActions } from './api/closePendingAgentActions';
import { createProjectAction } from './api/setAction';

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

server.resource(
    "action",
    "projects://{projectId}/actions/{actionId}",
    async (uri, params: any) => {
        const { projectId, actionId } = params;
        try {
            // Check project context if available, or validate projectId matches auth
            // For now, we trust the URI params but we should probably verify access
            
            const doc = await firestore.doc(`projects/${projectId}/actions/${actionId}`).get();
            if (!doc.exists) {
                throw new Error(`Action ${actionId} not found`);
            }
            const data = doc.data();
            return {
                contents: [{
                    uri: uri.href,
                    mimeType: "application/json",
                    text: JSON.stringify(data, null, 2)
                }]
            };
        } catch (error) {
            throw new Error(`Failed to read action resource: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
);

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
                    module: moduleName,
                    version: moduleVersion,
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

server.registerTool(
    'host_module',
    {
        title: 'Host Module',
        description: 'Hosts a module in the cloud.',
        inputSchema: {
            moduleName: z.string().describe('Name of the module to host'),
            moduleVersion: z.string().optional().describe('Version of the module'),
            args: z.array(z.string()).optional().describe('Arguments'),
        },
        outputSchema: {
            actionId: z.string(),
        },
    },
    async ({ moduleName, moduleVersion, args }) => {
        try {
            const projectId = getProjectId();
            const modules = await getModulesList(projectId);
            const module = modules.find((m: any) => 
                m.name.startsWith(moduleName) && (!moduleVersion || m.version === moduleVersion)
            );

            if (!module) {
                throw new Error(`Module ${moduleName} ${moduleVersion ? `v${moduleVersion}` : ''} not found`);
            }

            const action = {
                task: 'hostModule',
                status: 'pending',
                data: {
                    module,
                    args: args || [],
                },
            };
            const actionId = await createProjectAction(projectId, action);

            return {
                content: [
                    {
                        type: 'text',
                        text: `Action ${actionId} created to host ${moduleName}`,
                    },
                ],
                structuredContent: { actionId },
            };
        } catch (error) {
            const message =
                error instanceof Error ? error.message : 'An unknown error occurred';
            throw new Error(`Failed to host module: ${message}`);
        }
    },
);

server.registerTool(
    'cloud_run',
    {
        title: 'Cloud Run',
        description: 'Runs a module in the cloud.',
        inputSchema: {
            moduleName: z.string().describe('Name of the module to run'),
            moduleVersion: z.string().optional().describe('Version of the module'),
            args: z.array(z.string()).optional().describe('Arguments'),
            image: z.string().optional().describe('Docker image to use'),
        },
        outputSchema: {
            actionId: z.string(),
        },
    },
    async ({ moduleName, moduleVersion, args, image }) => {
        try {
            console.log('Cloud Run request:', { moduleName, moduleVersion, args, image });
            const projectId = getProjectId();
            const modules = await getModulesList(projectId);
            const module = modules.find((m: any) => 
                m.name.startsWith(moduleName) && (!moduleVersion || m.version === moduleVersion)
            );

            if (!module) {
                throw new Error(`Module ${moduleName} ${moduleVersion ? `v${moduleVersion}` : ''} not found`);
            }

            const action = {
                task: 'cloudRun',
                status: 'pending',
                data: {
                    module,
                    args: args || [],
                    ...(image ? { image } : {}),
                },
            };
            console.log('Creating action:', JSON.stringify(action, null, 2));
            const actionId = await createProjectAction(projectId, action);

            return {
                content: [
                    {
                        type: 'text',
                        text: `Action ${actionId} created to cloud run ${moduleName}`,
                    },
                ],
                structuredContent: { actionId },
            };
        } catch (error) {
            const message =
                error instanceof Error ? error.message : 'An unknown error occurred';
            throw new Error(`Failed to cloud run module: ${message}`);
        }
    },
);

server.registerTool(
    'set_agent_action',
    {
        title: 'Set Agent Action',
        description: 'Sets a generic action on an agent.',
        inputSchema: {
            agentId: z.string().describe('ID of the agent'),
            action: z.string().describe('JSON string of the action object'),
        },
        outputSchema: {
            actionId: z.string().describe('ID of the created action'),
        },
    },
    async ({ agentId, action }) => {
        try {
            const projectId = getProjectId();
            let actionObj;
            try {
                actionObj = JSON.parse(action);
            } catch (e) {
                throw new Error('Invalid JSON string for action');
            }
            
            const actionId = await createAgentAction(projectId, agentId, actionObj);

            return {
                content: [
                    {
                        type: 'text',
                        text: `Action ${actionId} created on agent ${agentId}`,
                    },
                ],
                structuredContent: { actionId },
            };
        } catch (error) {
            const message =
                error instanceof Error ? error.message : 'An unknown error occurred';
            throw new Error(`Failed to set agent action: ${message}`);
        }
    },
);

server.registerTool(
    'clean_agent_actions',
    {
        title: 'Clean Agent Actions',
        description: 'Cancels all pending actions for an agent.',
        inputSchema: {
            agentId: z.string().describe('ID of the agent'),
        },
        outputSchema: {
            success: z.boolean(),
        },
    },
    async ({ agentId }) => {
        try {
            const projectId = getProjectId();
            await cancelAgentActions(projectId, agentId);

            return {
                content: [
                    {
                        type: 'text',
                        text: `Actions cleaned for agent ${agentId}`,
                    },
                ],
                structuredContent: { success: true },
            };
        } catch (error) {
            const message =
                error instanceof Error ? error.message : 'An unknown error occurred';
            throw new Error(`Failed to clean agent actions: ${message}`);
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

// SSE Handling
const transports = new Map<string, SSEServerTransport>();

export async function handleMcpSseRequest(req: Request, res: Response) {
    try {
        const apiKeyAuth = await auth(req, res);
        if (!apiKeyAuth.authenticated) {
             return respondUnauthorized(res, apiKeyAuth.message || 'Authentication required');
        }
        
        const transport = new SSEServerTransport("/mcp/messages", res);
        const sessionId = transport.sessionId;
        transports.set(sessionId, transport);

        transport.onclose = () => {
            transports.delete(sessionId);
        };

        await server.connect(transport);
    } catch (error) {
        console.error('Error handling MCP SSE request:', error);
        if (!res.headersSent) respondServerError(res);
    }
}

export async function handleMcpSseMessage(req: Request, res: Response) {
    const sessionId = req.query.sessionId as string;
    const transport = transports.get(sessionId);
    if (!transport) {
        return res.status(404).send("Session not found");
    }
    
    await transport.handlePostMessage(req, res, req.body);
}

export async function notifyActionUpdate(projectId: string, actionId: string) {
    const uri = `projects://${projectId}/actions/${actionId}`;
    if (server.server) {
        try {
            await server.server.sendResourceUpdated({ uri });
        } catch (error) {
            // Ignore "Not connected" error as it just means no clients are listening
            if ((error as Error).message !== 'Not connected') {
                console.error('Error sending resource update:', error);
            }
        }
    }
}
