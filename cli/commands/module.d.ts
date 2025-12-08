import { Command } from 'commander';
export declare const Run: (moduleName: string, { moduleVersion, commandArgs, }: {
    moduleVersion?: string;
    commandArgs?: string[];
}, command?: Command) => Promise<void>;
export declare const Host: (moduleName: string, { version, }: {
    version?: string;
}, { args }: Command) => Promise<void>;
export declare const CloudRun: (moduleName: string, { moduleVersion, commandArgs, image, }: {
    moduleVersion?: string;
    commandArgs?: string[];
    image?: string;
}) => Promise<void>;
export declare const SetAction: (options: {
    action: string;
    tag?: string;
}) => Promise<string>;
export type ModuleTypes = 'sandbox' | 'web' | 'nodejs' | 'script' | 'algorithm';
export interface Module {
    name: string;
    version: string;
    nstrumentaModuleType: ModuleTypes;
    excludes?: string[];
    includes?: string[];
    entry: string;
    prePublishCommand?: string;
}
export interface ModuleMeta {
    name: string;
    folder: string;
}
export type ModuleExtended = Module & ModuleMeta;
export declare const Publish: () => Promise<void>;
export declare const publishModule: (module: ModuleExtended) => Promise<string>;
export declare const List: (options: {
    filter: string;
    depth?: number | null;
    json?: boolean;
}) => Promise<ModuleExtended[] | void>;
