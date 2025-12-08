"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.McpClient = void 0;
class McpClient {
    constructor() {
        // Get API key from environment (allow empty for testing)
        const apiKey = process.env.NSTRUMENTA_API_KEY || process.env.NST_API_KEY || '';
        this.apiKey = apiKey;
        // Get URL from environment or decode from API key
        const apiUrl = process.env.NSTRUMENTA_API_URL || process.env.NST_API_URL;
        if (apiUrl) {
            this.serverUrl = apiUrl;
        }
        else if (apiKey) {
            this.serverUrl = Buffer.from(apiKey.split(':')[1] || '', 'base64').toString().trim();
        }
        else {
            this.serverUrl = '';
        }
    }
    async callTool(toolName, args) {
        const response = await fetch(`${this.serverUrl}/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json, text/event-stream',
                'x-api-key': this.apiKey,
            },
            body: JSON.stringify({
                jsonrpc: '2.0',
                method: 'tools/call',
                params: {
                    name: toolName,
                    arguments: args,
                },
                id: Date.now(),
            }),
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`MCP request failed: ${response.status} ${errorText}`);
        }
        const result = (await response.json());
        if (result.error) {
            throw new Error(`MCP error: ${result.error.message || 'Unknown error'}`);
        }
        const toolResult = result.result;
        if (toolResult.isError) {
            throw new Error(`Tool error: ${toolResult.content?.[0]?.text || 'Unknown error'}`);
        }
        // Return structured content if available, otherwise parse text content
        if (toolResult.structuredContent) {
            return toolResult.structuredContent;
        }
        return toolResult.content?.[0]?.text
            ? JSON.parse(toolResult.content[0].text)
            : toolResult;
    }
    async runModule(agentId, moduleName, options = {}) {
        return this.callTool('run_module', {
            agentId,
            moduleName,
            moduleVersion: options.version,
            args: options.args,
        });
    }
    async listModules(filter) {
        return this.callTool('list_modules', { filter });
    }
    async listAgents() {
        return this.callTool('list_agents', {});
    }
    async hostModule(moduleName, options = {}) {
        return this.callTool('host_module', {
            moduleName,
            moduleVersion: options.version,
            args: options.args,
        });
    }
    async cloudRun(moduleName, options = {}) {
        return this.callTool('cloud_run', {
            moduleName,
            moduleVersion: options.version,
            args: options.args,
            image: options.image,
        });
    }
    async setAgentAction(agentId, action) {
        return this.callTool('set_agent_action', {
            agentId,
            action,
        });
    }
    async cleanAgentActions(agentId) {
        return this.callTool('clean_agent_actions', {
            agentId,
        });
    }
    async listData(type = 'data') {
        return this.callTool('list_data', { type });
    }
    async getAgentActions(agentId, status = 'pending') {
        return this.callTool('get_agent_actions', {
            agentId,
            status,
        });
    }
    async updateAgentAction(agentId, actionId, status, error) {
        return this.callTool('update_agent_action', {
            agentId,
            actionId,
            status,
            error,
        });
    }
}
exports.McpClient = McpClient;
//# sourceMappingURL=mcp.js.map