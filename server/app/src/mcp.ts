import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { AsyncLocalStorage } from 'async_hooks';
import { Request, Response } from 'express';
import { z } from 'zod';
import { auth } from './authentication';
import { firebaseAuth } from './authentication/firebaseAuth';
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
    userId?: string;
    authType: 'apiKey' | 'firebase';
};

const requestContext = new AsyncLocalStorage<McpRequestContext>();

function getProjectId(): string {
    const context = requestContext.getStore();
    if (!context?.projectId) {
        throw new Error('Project context missing for MCP request');
    }

    return context.projectId;
}

function getUserId(): string | undefined {
    const context = requestContext.getStore();
    return context?.userId;
}

function getAuthType(): 'apiKey' | 'firebase' {
    const context = requestContext.getStore();
    return context?.authType || 'apiKey';
}

type UnifiedAuthResult = 
    | { authenticated: false; projectId: string; message?: string }
    | { authenticated: true; projectId: string; userId?: string; authType: 'apiKey' | 'firebase'; message?: string };

async function unifiedAuth(req: Request, res: Response): Promise<UnifiedAuthResult> {
    const apiKeyResult = await auth(req, res);
    if (apiKeyResult.authenticated) {
        return { ...apiKeyResult, authType: 'apiKey' };
    }

    const firebaseResult = await firebaseAuth(req, res);
    if (firebaseResult.authenticated) {
        const projectDoc = await firestore.collection('projects')
            .where(`members.${firebaseResult.userId}`, '!=', null)
            .limit(1)
            .get();
        
        if (!projectDoc.empty) {
            const projectId = projectDoc.docs[0].id;
            return {
                authenticated: true,
                projectId,
                userId: firebaseResult.userId,
                authType: 'firebase'
            };
        }
        
        return {
            authenticated: false,
            projectId: '',
            message: 'No project found for authenticated user'
        };
    }

    return {
        authenticated: false,
        projectId: '',
        message: 'Authentication required: provide either x-api-key or Authorization Bearer token'
    };
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

server.resource(
    "agent-actions",
    "projects://{projectId}/agents/{agentId}/actions",
    async (uri, params: any) => {
        const { projectId, agentId } = params;
        try {
            const actionsPath = `projects/${projectId}/agents/${agentId}/actions`;
            const snapshot = await firestore.collection(actionsPath)
                .where('status', '==', 'pending')
                .get();
            
            const actions = snapshot.docs.map((doc) => ({
                actionId: doc.id,
                ...doc.data(),
            }));

            return {
                contents: [{
                    uri: uri.href,
                    mimeType: "application/json",
                    text: JSON.stringify(actions, null, 2)
                }]
            };
        } catch (error) {
            throw new Error(`Failed to read agent actions resource: ${error instanceof Error ? error.message : String(error)}`);
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

server.registerTool(
    'get_agent_actions',
    {
        title: 'Get Agent Actions',
        description: 'Gets pending actions for an agent (replaces backplane polling).',
        inputSchema: {
            agentId: z.string().describe('ID of the agent'),
            status: z
                .string()
                .optional()
                .default('pending')
                .describe('Filter by action status (pending, complete, started, error)'),
        },
        outputSchema: {
            actions: z
                .array(
                    z.object({
                        actionId: z.string(),
                        task: z.string(),
                        status: z.string(),
                        data: z.any(),
                        createdAt: z.number().optional(),
                        lastModified: z.number().optional(),
                    }),
                )
                .describe('Array of actions for this agent'),
        },
    },
    async ({ agentId, status }) => {
        try {
            const projectId = getProjectId();
            const actionsPath = `projects/${projectId}/agents/${agentId}/actions`;
            let query = firestore.collection(actionsPath);
            
            if (status) {
                query = query.where('status', '==', status) as any;
            }
            
            const snapshot = await query.get();
            const actions = snapshot.docs.map((doc) => ({
                actionId: doc.id,
                ...doc.data(),
            }));

            return {
                content: [{ type: 'text', text: JSON.stringify(actions, null, 2) }],
                structuredContent: { actions },
            };
        } catch (error) {
            const message =
                error instanceof Error ? error.message : 'An unknown error occurred';
            throw new Error(`Failed to get agent actions: ${message}`);
        }
    },
);

server.registerTool(
    'update_agent_action',
    {
        title: 'Update Agent Action',
        description: 'Updates the status of an agent action (replaces backplane status updates).',
        inputSchema: {
            agentId: z.string().describe('ID of the agent'),
            actionId: z.string().describe('ID of the action'),
            status: z
                .string()
                .describe('New status (started, complete, error)'),
            error: z
                .string()
                .optional()
                .describe('Error message if status is error'),
        },
        outputSchema: {
            success: z.boolean(),
        },
    },
    async ({ agentId, actionId, status, error }) => {
        try {
            const projectId = getProjectId();
            const actionPath = `projects/${projectId}/agents/${agentId}/actions/${actionId}`;
            const updateData: any = {
                status,
                lastModified: Date.now(),
            };
            
            if (error) {
                updateData.error = error;
            }
            
            await firestore.doc(actionPath).update(updateData);

            return {
                content: [
                    {
                        type: 'text',
                        text: `Action ${actionId} updated to status: ${status}`,
                    },
                ],
                structuredContent: { success: true },
            };
        } catch (error) {
            const message =
                error instanceof Error ? error.message : 'An unknown error occurred';
            throw new Error(`Failed to update agent action: ${message}`);
        }
    },
);

// New MCP tools for complete API replacement

server.registerTool(
    'create_project',
    {
        title: 'Create Project',
        description: 'Creates a new project (requires Firebase authentication).',
        inputSchema: {
            name: z.string().describe('Project name'),
            projectIdBase: z.string().optional().describe('Optional project ID base'),
        },
        outputSchema: {
            id: z.string().describe('Created project ID'),
            name: z.string(),
            message: z.string(),
        },
    },
    async ({ name, projectIdBase: rawProjectIdBase }) => {
        try {
            const userId = getUserId();
            if (!userId || getAuthType() !== 'firebase') {
                throw new Error('Firebase authentication required for project creation');
            }

            const { v4: uuid } = require('uuid');
            const projectIdBase = rawProjectIdBase || encodeURIComponent(
                name.toLowerCase().replace(/ +/g, '-').replace(/[^a-z0-9 _-]+/gi, '-')
            );

            let confirmedUnique = false;
            let suffix = '';
            let projectId = projectIdBase;
            
            while (!confirmedUnique) {
                const doc = await firestore.collection('projects').doc(projectId).get();
                if (!doc.exists) {
                    confirmedUnique = true;
                } else {
                    suffix = uuid().split('-')[0];
                    projectId = `${projectIdBase}-${suffix}`;
                }
            }

            const timestamp = Date.now();
            const projectData = {
                name,
                createdAt: timestamp,
                lastModified: timestamp,
                members: { [userId]: { role: 'owner', addedAt: timestamp } },
            };

            await firestore.collection('projects').doc(projectId).set(projectData);

            return {
                content: [{
                    type: 'text',
                    text: `Project created: ${projectId}`
                }],
                structuredContent: {
                    id: projectId,
                    name,
                    message: 'Project created successfully'
                },
            };
        } catch (error) {
            const message = error instanceof Error ? error.message : 'An unknown error occurred';
            throw new Error(`Failed to create project: ${message}`);
        }
    },
);

server.registerTool(
    'create_api_key',
    {
        title: 'Create API Key',
        description: 'Creates an API key for a project (requires Firebase authentication and project ownership).',
        inputSchema: {
            projectId: z.string().describe('Project ID'),
            apiUrl: z.string().optional().describe('Optional API URL to encode in key'),
        },
        outputSchema: {
            key: z.string().describe('Generated API key'),
            keyId: z.string().describe('Key ID'),
            createdAt: z.number(),
            message: z.string(),
        },
    },
    async ({ projectId, apiUrl }) => {
        try {
            const userId = getUserId();
            if (!userId || getAuthType() !== 'firebase') {
                throw new Error('Firebase authentication required for API key creation');
            }

            const projectDoc = await firestore.collection('projects').doc(projectId).get();
            if (!projectDoc.exists) {
                throw new Error('Project not found');
            }

            const project = projectDoc.data();
            if (!project || !project.members || !project.members[userId]) {
                throw new Error('Permission denied: not a project member');
            }

            const { CreateApiKeyService } = require('./services/ApiKeyService');
            const apiKeyService = CreateApiKeyService({ firestore });
            const result = await apiKeyService.createApiKey(projectId, apiUrl);

            return {
                content: [{
                    type: 'text',
                    text: `API key created: ${result.keyId}`
                }],
                structuredContent: result,
            };
        } catch (error) {
            const message = error instanceof Error ? error.message : 'An unknown error occurred';
            throw new Error(`Failed to create API key: ${message}`);
        }
    },
);

server.registerTool(
    'get_upload_url',
    {
        title: 'Get Upload URL',
        description: 'Gets a signed URL for uploading a module file to cloud storage.',
        inputSchema: {
            path: z.string().describe('File path relative to project'),
            metadata: z.record(z.string(), z.string()).optional().describe('Optional file metadata'),
        },
        outputSchema: {
            uploadUrl: z.string().describe('Signed URL for upload'),
        },
    },
    async ({ path: originalPath, metadata }) => {
        try {
            const projectId = getProjectId();
            const { generateV4UploadSignedUrl } = require('./shared/utils');
            
            const path = originalPath.replace(/^(\/)*/, '/');
            const storagePathBase = `projects/${projectId}`;
            const uploadUrl = await generateV4UploadSignedUrl(`${storagePathBase}${path}`, metadata);

            return {
                content: [{ type: 'text', text: uploadUrl }],
                structuredContent: { uploadUrl },
            };
        } catch (error) {
            const message = error instanceof Error ? error.message : 'An unknown error occurred';
            throw new Error(`Failed to get upload URL: ${message}`);
        }
    },
);

server.registerTool(
    'get_upload_data_url',
    {
        title: 'Get Upload Data URL',
        description: 'Gets a signed URL for uploading a data file to cloud storage.',
        inputSchema: {
            name: z.string().describe('File name'),
            overwrite: z.boolean().optional().default(false).describe('Allow overwriting existing files'),
        },
        outputSchema: {
            uploadUrl: z.string().describe('Signed URL for upload'),
            filePath: z.string().describe('Storage path for the file'),
        },
    },
    async ({ name, overwrite }) => {
        try {
            const projectId = getProjectId();
            const { generateV4UploadSignedUrl } = require('./shared/utils');
            const { v4: uuid } = require('uuid');
            const { storage } = require('./authentication/ServiceAccount');
            
            const timestamp = Date.now();
            const dataId = uuid();
            const filePath = `projects/${projectId}/data/${dataId}/${name}`;
            
            const bucket = storage.bucket();
            const file = bucket.file(filePath);
            
            if (!overwrite) {
                const [exists] = await file.exists();
                if (exists) {
                    throw new Error('file exists');
                }
            }
            
            const uploadUrl = await generateV4UploadSignedUrl(filePath);

            return {
                content: [{ type: 'text', text: uploadUrl }],
                structuredContent: { uploadUrl, filePath },
            };
        } catch (error) {
            if (error instanceof Error && error.message === 'file exists') {
                throw new Error('The resource already exists');
            }
            const message = error instanceof Error ? error.message : 'An unknown error occurred';
            throw new Error(`Failed to get upload data URL: ${message}`);
        }
    },
);

server.registerTool(
    'get_download_url',
    {
        title: 'Get Download URL',
        description: 'Gets a signed URL for downloading a file from cloud storage.',
        inputSchema: {
            path: z.string().describe('File path in storage'),
        },
        outputSchema: {
            downloadUrl: z.string().describe('Signed URL for download'),
        },
    },
    async ({ path }) => {
        try {
            const projectId = getProjectId();
            const { generateV4ReadSignedUrl } = require('./shared/utils');
            
            const fullPath = path.startsWith('projects/') ? path : `projects/${projectId}/${path}`;
            const downloadUrl = await generateV4ReadSignedUrl(fullPath);

            return {
                content: [{ type: 'text', text: downloadUrl }],
                structuredContent: { downloadUrl },
            };
        } catch (error) {
            const message = error instanceof Error ? error.message : 'An unknown error occurred';
            throw new Error(`Failed to get download URL: ${message}`);
        }
    },
);

server.registerTool(
    'register_agent',
    {
        title: 'Register Agent',
        description: 'Registers an agent with a tag for the project.',
        inputSchema: {
            tag: z.string().describe('Agent tag/identifier'),
        },
        outputSchema: {
            agentId: z.string().describe('Registered agent ID'),
        },
    },
    async ({ tag }) => {
        try {
            const projectId = getProjectId();
            const { v4: uuid } = require('uuid');
            
            const agentsPath = `projects/${projectId}/agents`;
            const agentId = uuid();
            const timestamp = Date.now();
            
            const agentData = {
                tag,
                createdAt: timestamp,
                lastModified: timestamp,
                status: 'active',
            };

            await firestore.collection(agentsPath).doc(agentId).set(agentData);

            return {
                content: [{
                    type: 'text',
                    text: `Agent registered: ${agentId} (tag: ${tag})`
                }],
                structuredContent: { agentId },
            };
        } catch (error) {
            const message = error instanceof Error ? error.message : 'An unknown error occurred';
            throw new Error(`Failed to register agent: ${message}`);
        }
    },
);

server.registerTool(
    'get_machines',
    {
        title: 'Get Machines',
        description: 'Lists Google Compute Engine instances for the project.',
        inputSchema: {},
        outputSchema: {
            machines: z.array(z.any()).describe('Array of GCE instance information'),
        },
    },
    async () => {
        try {
            const projectId = getProjectId();
            const compute = require('@google-cloud/compute');
            const { serviceAccount } = require('./authentication/ServiceAccount');
            
            const computeClient = new compute.InstancesClient(serviceAccount);
            const project = serviceAccount.project_id;
            
            const aggListRequest = computeClient.aggregatedListAsync({ project });
            const machines: any[] = [];
            
            for await (const [zone, instancesObject] of aggListRequest) {
                const instances = instancesObject.instances || [];
                for (const instance of instances) {
                    machines.push({
                        name: instance.name,
                        zone,
                        status: instance.status,
                        machineType: instance.machineType,
                    });
                }
            }

            return {
                content: [{ type: 'text', text: JSON.stringify(machines, null, 2) }],
                structuredContent: { machines },
            };
        } catch (error) {
            const message = error instanceof Error ? error.message : 'An unknown error occurred';
            throw new Error(`Failed to get machines: ${message}`);
        }
    },
);

server.registerTool(
    'get_cloud_run_services',
    {
        title: 'Get Cloud Run Services',
        description: 'Lists Google Cloud Run services for the project.',
        inputSchema: {},
        outputSchema: {
            services: z.array(z.any()).describe('Array of Cloud Run service information'),
        },
    },
    async () => {
        try {
            const projectId = getProjectId();
            const { serviceAccount } = require('./authentication/ServiceAccount');
            const util = require('util');
            const exec = util.promisify(require('child_process').exec);
            
            const cmd = `gcloud run services list --project=${serviceAccount.project_id} --format=json`;
            const { stdout } = await exec(cmd);
            const services = JSON.parse(stdout);

            return {
                content: [{ type: 'text', text: JSON.stringify(services, null, 2) }],
                structuredContent: { services },
            };
        } catch (error) {
            const message = error instanceof Error ? error.message : 'An unknown error occurred';
            throw new Error(`Failed to get Cloud Run services: ${message}`);
        }
    },
);

server.registerTool(
    'query_collection',
    {
        title: 'Query Collection',
        description: 'Performs a generic Firestore query on a collection.',
        inputSchema: {
            collection: z.string().describe('Collection type (data, modules, etc.)'),
            limit: z.number().optional().describe('Limit number of results'),
            field: z.string().optional().describe('Field to filter on'),
            comparison: z.string().optional().describe('Comparison operator'),
            value: z.any().optional().describe('Value to compare against'),
        },
        outputSchema: {
            results: z.array(z.any()).describe('Query results'),
        },
    },
    async ({ collection, limit, field, comparison, value }) => {
        try {
            const projectId = getProjectId();
            const collectionPath = `projects/${projectId}/${collection}`;
            let query: any = firestore.collection(collectionPath);
            
            if (field && comparison && value !== undefined) {
                query = query.where(field, comparison as any, value);
            }
            
            if (limit) {
                query = query.limit(limit);
            }
            
            const snapshot = await query.get();
            const results = snapshot.docs.map((doc: any) => ({
                id: doc.id,
                ...doc.data(),
            }));

            return {
                content: [{ type: 'text', text: JSON.stringify(results, null, 2) }],
                structuredContent: { results },
            };
        } catch (error) {
            const message = error instanceof Error ? error.message : 'An unknown error occurred';
            throw new Error(`Failed to query collection: ${message}`);
        }
    },
);

server.registerTool(
    'set_data_metadata',
    {
        title: 'Set Data Metadata',
        description: 'Updates metadata for a data object in Firestore.',
        inputSchema: {
            dataId: z.string().describe('Data object ID'),
            metadata: z.record(z.string(), z.any()).describe('Metadata to set'),
        },
        outputSchema: {
            success: z.boolean(),
        },
    },
    async ({ dataId, metadata }) => {
        try {
            const projectId = getProjectId();
            const dataPath = `projects/${projectId}/data/${dataId}`;
            
            await firestore.doc(dataPath).set(metadata, { merge: true });

            return {
                content: [{
                    type: 'text',
                    text: `Metadata updated for ${dataId}`
                }],
                structuredContent: { success: true },
            };
        } catch (error) {
            const message = error instanceof Error ? error.message : 'An unknown error occurred';
            throw new Error(`Failed to set data metadata: ${message}`);
        }
    },
);

server.registerTool(
    'get_data_metadata',
    {
        title: 'Get Data Metadata',
        description: 'Retrieves metadata for a data object from Firestore.',
        inputSchema: {
            dataId: z.string().describe('Data object ID'),
        },
        outputSchema: {
            metadata: z.record(z.string(), z.any()).describe('Data metadata'),
        },
    },
    async ({ dataId }) => {
        try {
            const projectId = getProjectId();
            const dataPath = `projects/${projectId}/data/${dataId}`;
            
            const doc = await firestore.doc(dataPath).get();
            if (!doc.exists) {
                throw new Error('Data not found');
            }
            
            const metadata = doc.data();

            return {
                content: [{ type: 'text', text: JSON.stringify(metadata, null, 2) }],
                structuredContent: { metadata },
            };
        } catch (error) {
            const message = error instanceof Error ? error.message : 'An unknown error occurred';
            throw new Error(`Failed to get data metadata: ${message}`);
        }
    },
);

server.registerTool(
    'verify_api_key',
    {
        title: 'Verify API Key',
        description: 'Verifies an API key is valid.',
        inputSchema: {
            apiKey: z.string().describe('API key to verify'),
        },
        outputSchema: {
            valid: z.boolean(),
            projectId: z.string().optional(),
        },
    },
    async ({ apiKey }) => {
        try {
            const key = apiKey.split(':')[0];
            const rawKey = key;
            
            if (rawKey.length !== 48 || !/^[0-9a-f]+$/i.test(rawKey)) {
                return {
                    content: [{ type: 'text', text: 'Invalid API key format' }],
                    structuredContent: { valid: false },
                };
            }
            
            const docId = rawKey.substring(0, 16);
            const docData = await (await firestore.collection('keys').doc(docId).get()).data();
            
            if (!docData) {
                return {
                    content: [{ type: 'text', text: 'API key not found' }],
                    structuredContent: { valid: false },
                };
            }

            return {
                content: [{ type: 'text', text: `Valid API key for project ${docData.projectId}` }],
                structuredContent: { valid: true, projectId: docData.projectId },
            };
        } catch (error) {
            const message = error instanceof Error ? error.message : 'An unknown error occurred';
            throw new Error(`Failed to verify API key: ${message}`);
        }
    },
);

// Express handler with unified auth (API key or Firebase)
export async function handleMcpRequest(req: Request, res: Response) {
    try {
        const authResult = await unifiedAuth(req, res);
        if (!authResult.authenticated) {
            return respondUnauthorized(
                res,
                authResult.message || 'Authentication required',
            );
        }

        await requestContext.run({
            projectId: authResult.projectId,
            userId: authResult.userId,
            authType: authResult.authType
        }, async () => {
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
        const authResult = await unifiedAuth(req, res);
        if (!authResult.authenticated) {
             return respondUnauthorized(res, authResult.message || 'Authentication required');
        }
        
        const transport = new SSEServerTransport("/mcp/messages", res);
        const sessionId = transport.sessionId;
        transports.set(sessionId, transport);

        transport.onclose = () => {
            transports.delete(sessionId);
        };

        await requestContext.run({
            projectId: authResult.projectId,
            userId: authResult.userId,
            authType: authResult.authType
        }, async () => {
            await server.connect(transport);
        });
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

export async function notifyAgentActionsUpdate(projectId: string, agentId: string) {
    const uri = `projects://${projectId}/agents/${agentId}/actions`;
    if (server.server) {
        try {
            await server.server.sendResourceUpdated({ uri });
        } catch (error) {
            // Ignore "Not connected" error as it just means no clients are listening
            if ((error as Error).message !== 'Not connected') {
                console.error('Error sending agent actions update:', error);
            }
        }
    }
}
