"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MCPClient = void 0;
const vscode = require("vscode");
class MCPClient {
    constructor(config) {
        this.apiKey = config.apiKey;
        const configuredUrl = vscode.workspace.getConfiguration('nstrumenta').get('mcpServer.url');
        if (configuredUrl && configuredUrl !== 'http://localhost:3100') {
            this.serverUrl = configuredUrl;
        }
        else if (config.serverUrl) {
            this.serverUrl = config.serverUrl;
        }
        else if (config.apiKey) {
            this.serverUrl = this.extractServerUrlFromApiKey(config.apiKey);
        }
        else {
            this.serverUrl = 'http://localhost:3100';
        }
    }
    extractServerUrlFromApiKey(apiKey) {
        try {
            const parts = apiKey.split('.');
            if (parts.length >= 2) {
                const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
                if (payload.mcpServerUrl) {
                    return payload.mcpServerUrl;
                }
            }
        }
        catch (error) {
            console.error('Failed to parse API key:', error);
        }
        return 'http://localhost:3100';
    }
    async callTool(toolName, args) {
        const response = await fetch(`${this.serverUrl}/mcp/tools/call`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(this.apiKey ? { 'Authorization': `Bearer ${this.apiKey}` } : {})
            },
            body: JSON.stringify({
                name: toolName,
                arguments: args
            })
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`MCP tool call failed: ${response.status} ${errorText}`);
        }
        const result = await response.json();
        if (result.isError) {
            throw new Error(`MCP tool error: ${result.content?.[0]?.text || 'Unknown error'}`);
        }
        return result.content?.[0]?.text ? JSON.parse(result.content[0].text) : result;
    }
    async listModules() {
        return this.callTool('list_modules', {});
    }
    async publishModule(modulePath) {
        return this.callTool('publish_module', { modulePath });
    }
    async runModule(moduleName, args) {
        return this.callTool('run_module', { moduleName, args: args || {} });
    }
    async listData(prefix) {
        return this.callTool('list_data', { prefix: prefix || '' });
    }
    async getData(path) {
        return this.callTool('get_data', { path });
    }
    async uploadData(localPath, remotePath) {
        return this.callTool('upload_data', { localPath, remotePath });
    }
    async listAgents() {
        return this.callTool('list_agents', {});
    }
    async startAgent(agentId) {
        return this.callTool('agent_start', { agentId });
    }
    async getProjectInfo() {
        return this.callTool('project_info', {});
    }
}
exports.MCPClient = MCPClient;
//# sourceMappingURL=mcpClient.js.map