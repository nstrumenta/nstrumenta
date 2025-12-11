export declare class McpClient {
    private apiKey;
    private serverUrl;
    constructor();
    private callTool;
    runModule(agentId: string, moduleName: string, options?: {
        version?: string;
        args?: string[];
    }): Promise<{
        actionId: string;
    }>;
    listModules(filter?: string): Promise<{
        modules: any[];
    }>;
    listAgents(): Promise<{
        agents: [string, any][];
    }>;
    hostModule(moduleName: string, options?: {
        version?: string;
        args?: string[];
    }): Promise<{
        actionId: string;
    }>;
    cloudRun(moduleName: string, options?: {
        version?: string;
        args?: string[];
        image?: string;
    }): Promise<{
        actionId: string;
    }>;
    setAgentAction(agentId: string, action: string): Promise<{
        actionId: string;
    }>;
    cleanAgentActions(agentId: string): Promise<{
        success: boolean;
    }>;
    listData(type?: string): Promise<{
        objects: any[];
    }>;
    getAgentActions(agentId: string, status?: string): Promise<{
        actions: any[];
    }>;
    updateAgentAction(agentId: string, actionId: string, status: string, error?: string): Promise<{
        success: boolean;
    }>;
}
