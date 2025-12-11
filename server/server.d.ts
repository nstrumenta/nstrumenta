export interface NstrumentaServerOptions {
    apiKey: string;
    port?: string;
    debug?: boolean;
}
export declare class NstrumentaServer {
    private options;
    private cwd;
    constructor(options: NstrumentaServerOptions);
    run(): Promise<import("http").Server<typeof import("http").IncomingMessage, typeof import("http").ServerResponse>>;
}
