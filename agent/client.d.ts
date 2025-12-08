export type ModuleRunner = (moduleName: string, options: {
    moduleVersion?: string;
    commandArgs?: string[];
}) => Promise<void>;
export interface AgentClientOptions {
    apiKey: string;
    tag?: string;
    debug?: boolean;
    moduleRunner?: ModuleRunner;
}
export declare class AgentClient {
    private apiKey;
    private tag?;
    private debug;
    private agentId?;
    private moduleRunner?;
    private serverUrl;
    constructor(options: AgentClientOptions);
    connect(): Promise<void>;
    getAgentId(): string | undefined;
    private registerAgent;
    private startActionPolling;
    private subscribeToResource;
    private fetchAndProcessActions;
    private updateActionStatus;
}
