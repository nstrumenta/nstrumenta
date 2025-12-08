import { ModuleExtended } from './commands/module';
export declare const resolveApiKey: () => string;
export declare const resolveApiUrl: () => string | undefined;
export interface Keys {
    [key: string]: string;
}
export declare const serverUrl: string;
export declare const endpoints: {
    GET_PROJECT_DOWNLOAD_URL: string;
    LIST_MODULES: string;
    GET_AGENT_ID_BY_TAG: string;
    GET_CLOUD_RUN_SERVICES: string;
    GET_MACHINES: string;
    GET_DATA_MOUNT: string;
    GET_UPLOAD_DATA_URL: string;
    QUERY_COLLECTION: string;
    GET_PROJECT: string;
    SET_ACTION: string;
    GET_ACTION: string;
    GET_UPLOAD_URL: string;
};
export declare function asyncSpawn(cmd: string, args?: string[], options?: {
    cwd?: string;
    shell?: boolean;
    stdio?: 'pipe' | 'inherit';
    env?: Record<string, string>;
    quiet?: boolean;
}, errCB?: (code: number) => void): Promise<import("child_process").ChildProcess>;
export declare const getFolderFromStorage: (moduleTarName: string, options: {
    apiKey: string;
}) => Promise<string>;
export declare const inquiryForSelectModule: (choices: string[]) => Promise<string>;
export declare const getModuleFromStorage: ({ name, version: versionArg, }: {
    name: string;
    version?: string;
}) => Promise<ModuleExtended>;
export declare function getVersionFromPath(path: string): string;
export declare const getNstDir: (cwd: string) => Promise<string>;
export declare const getNearestConfigJson: () => Promise<{
    file: string;
    cwd: string;
}>;
export declare function walkDirectory(dir: string, { maxDepth }?: {
    maxDepth?: number;
}): AsyncGenerator<string>;
