"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.List = exports.publishModule = exports.Publish = exports.SetAction = exports.CloudRun = exports.Host = exports.Run = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const tar_1 = __importDefault(require("tar"));
const mcp_1 = require("../mcp");
const utils_1 = require("../utils");
const blue = (text) => {
    return text;
};
const Run = async function (moduleName, { moduleVersion, commandArgs, }, command) {
    try {
        const module = await (0, utils_1.getModuleFromStorage)({ name: moduleName, version: moduleVersion });
        console.log(`Running module ${module.name} version ${module.version} from ${module.folder}`);
        const entry = module.entry;
        if (!entry) {
            throw new Error('Module has no entry point defined');
        }
        const [cmd, ...entryArgs] = entry.split(' ');
        const args = [...entryArgs, ...(commandArgs || [])];
        await (0, utils_1.asyncSpawn)(cmd, args, {
            cwd: module.folder,
            stdio: 'inherit',
            env: {
                ...process.env,
            },
        });
    }
    catch (err) {
        console.error('Error running module:', err.message);
        process.exit(1);
    }
};
exports.Run = Run;
const Host = async function (moduleName, { version, }, { args }) {
    try {
        const mcp = new mcp_1.McpClient();
        const { actionId } = await mcp.hostModule(moduleName, { version, args });
        console.log(`created action: ${actionId} to host ${moduleName}`);
    }
    catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
};
exports.Host = Host;
const CloudRun = async function (moduleName, { moduleVersion, commandArgs, image, }) {
    const args = commandArgs ?? [];
    try {
        const mcp = new mcp_1.McpClient();
        const { actionId } = await mcp.cloudRun(moduleName, {
            version: moduleVersion,
            args,
            image,
        });
        console.log(`created action: ${actionId} to cloud run ${moduleName}`);
        if (actionId) {
            await waitForAction(actionId);
        }
    }
    catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
};
exports.CloudRun = CloudRun;
const SetAction = async (options) => {
    const { action: actionString, tag } = options;
    const action = JSON.parse(actionString);
    const apiKey = (0, utils_1.resolveApiKey)();
    try {
        const response = await fetch(utils_1.endpoints.SET_ACTION, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
            },
            body: JSON.stringify({ action }),
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const actionId = await response.text();
        console.log(`created action: ${actionId} `, action);
        return actionId;
    }
    catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
};
exports.SetAction = SetAction;
const readModuleConfigs = async (moduleMetas) => {
    const promises = moduleMetas.map(async (moduleMeta) => {
        const { folder } = moduleMeta;
        let moduleConfig;
        const nstrumentaModulePath = `${folder}/nstrumentaModule.json`;
        try {
            moduleConfig = JSON.parse(await promises_1.default.readFile(nstrumentaModulePath, { encoding: 'utf8' }));
        }
        catch (err) {
            console.log(`Couldn't read ${nstrumentaModulePath}`);
            console.log({ moduleMeta });
            console.log({ moduleConfig });
        }
        let packageConfig;
        if (moduleConfig?.nstrumentaModuleType == 'nodejs' ||
            moduleConfig?.nstrumentaModuleType == 'web') {
            try {
                packageConfig = JSON.parse(await promises_1.default.readFile(`${folder}/package.json`, { encoding: 'utf8' }));
            }
            catch (err) {
                console.log(`no ${folder}/package.json`);
            }
        }
        return {
            ...moduleMeta,
            ...moduleConfig,
            ...packageConfig,
        };
    });
    return Promise.all(promises);
};
const waitForModule = async (name, version) => {
    const apiKey = (0, utils_1.resolveApiKey)();
    const maxRetries = 20;
    const interval = 1000;
    console.log(`Waiting for module ${name} version ${version} to be indexed...`);
    for (let i = 0; i < maxRetries; i++) {
        try {
            const response = await fetch(utils_1.endpoints.LIST_MODULES, {
                method: 'POST',
                headers: {
                    'x-api-key': apiKey,
                    'content-type': 'application/json',
                },
            });
            if (response.ok) {
                const modules = (await response.json());
                const match = modules.find((m) => m.name === `${name}-${version}.tar.gz` ||
                    (m.name.startsWith(name) && (0, utils_1.getVersionFromPath)(m.name) === version));
                if (match) {
                    console.log(`Module ${name} version ${version} is ready.`);
                    return;
                }
            }
        }
        catch (e) {
            console.log('Error checking module status:', e);
        }
        await new Promise((resolve) => setTimeout(resolve, interval));
    }
    throw new Error(`Timeout waiting for module ${name} version ${version} to be indexed.`);
};
const waitForAction = async (actionId) => {
    const apiKey = (0, utils_1.resolveApiKey)();
    const maxRetries = 300; // 5 minutes for cloud run
    const interval = 2000;
    console.log(`Waiting for action ${actionId} to complete...`);
    for (let i = 0; i < maxRetries; i++) {
        try {
            const response = await fetch(utils_1.endpoints.GET_ACTION, {
                method: 'POST',
                headers: {
                    'x-api-key': apiKey,
                    'content-type': 'application/json',
                },
                body: JSON.stringify({ actionId }),
            });
            if (response.ok) {
                const action = (await response.json());
                if (action.status === 'complete') {
                    console.log(`Action ${actionId} completed.`);
                    return;
                }
                if (action.status === 'error') {
                    throw new Error(`Action ${actionId} failed: ${action.error}`);
                }
                console.log(`Action status: ${action.status}`);
            }
        }
        catch (e) {
            console.log('Error checking action status:', e);
        }
        await new Promise((resolve) => setTimeout(resolve, interval));
    }
    throw new Error(`Timeout waiting for action ${actionId} to complete.`);
};
const Publish = async () => {
    let moduleMetas;
    let modules = [];
    // First, let's check the nst project configuration for modules
    try {
        const { file, cwd } = await (0, utils_1.getNearestConfigJson)();
        // For the rest of this run, we'll want to chdir to the main project folder
        process.chdir(cwd);
        console.log(`cwd: ${process.cwd()}`);
        const { modules: modulesFromFile } = JSON.parse(file);
        moduleMetas = modulesFromFile;
    }
    catch (error) {
        throw Error(error);
    }
    // Now, check for and read the configs
    const results = await readModuleConfigs(moduleMetas);
    modules = results.filter((m) => Boolean(m));
    console.log(`publishing:`, modules);
    try {
        const promises = modules.map((module) => (0, exports.publishModule)({
            ...module,
        }));
        const results = await Promise.all(promises);
        console.log(results);
        for (const module of modules) {
            await waitForModule(module.name, module.version);
        }
    }
    catch (err) {
        console.error(err.message);
        process.exit(1);
    }
};
exports.Publish = Publish;
const publishModule = async (module) => {
    const { version, folder, name, includes = ['.'], excludes = [], prePublishCommand } = module;
    if (!version) {
        throw new Error(`module [${name}] requires version!`);
    }
    const fileName = `${name}-${version}.tar.gz`;
    const downloadLocation = `${await (0, utils_1.getNstDir)(process.cwd())}/${fileName}`;
    const remoteFileLocation = `modules/${fileName}`;
    let url = '';
    let size = 0;
    if (prePublishCommand) {
        try {
            const cwd = folder;
            console.log(blue(`[cwd: ${cwd}] pre-publish build step`));
            const [cmd, ...args] = prePublishCommand.split(' ');
            await (0, utils_1.asyncSpawn)(cmd, args, { cwd });
        }
        catch (err) {
            console.log(`Failed on pre-publish command: ${err.message}`);
            throw err;
        }
    }
    // first, make tarball
    try {
        const options = {
            gzip: true,
            file: downloadLocation,
            cwd: folder,
            filter: (path) => {
                return (
                // basic filtering of exact string items in the 'exclude' array
                // also excludes .nstrumenta folder to avoid leaking credential
                ['.nstrumenta/', ...excludes].findIndex((p) => {
                    return path.includes(p);
                }) === -1);
            },
        };
        console.log('creating tar', fileName, downloadLocation, `includes.length: ${includes.length}`);
        await tar_1.default.create(options, ['nstrumentaModule.json', ...includes]);
        size = (await promises_1.default.stat(downloadLocation)).size;
    }
    catch (e) {
        console.warn(`Error: problem creating ${fileName} from ${folder}`);
        throw e;
    }
    // then, get an upload url to put the tarball into storage
    try {
        const apiKey = (0, utils_1.resolveApiKey)();
        const response = await fetch(utils_1.endpoints.GET_UPLOAD_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
            },
            body: JSON.stringify({
                path: remoteFileLocation,
                size,
                meta: module,
            }),
        });
        if (!response.ok) {
            if (response.status === 409) {
                console.log(`Conflict: version ${version} exists, using server version`);
                return fileName;
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = (await response.json());
        url = data.uploadUrl;
    }
    catch (e) {
        let message = `can't upload ${name}`;
        if (e instanceof Error) {
            message = `${message} [${e.message}]`;
        }
        throw new Error(message);
    }
    const fileBuffer = await promises_1.default.readFile(downloadLocation);
    // start the request, return promise
    try {
        const response = await fetch(url, {
            method: 'PUT',
            body: fileBuffer,
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
    }
    catch (error) {
        console.error(`Error uploading file: ${error.message}`);
    }
    return fileName;
};
exports.publishModule = publishModule;
const List = async (options) => {
    const { filter, json, depth = 2 } = options;
    try {
        const mcp = new mcp_1.McpClient();
        const { modules } = await mcp.listModules(filter);
        if (json) {
            return modules;
        }
        else {
            console.dir(modules, { depth });
        }
    }
    catch (error) {
        console.log(`Problem fetching data ${error.name}`);
    }
};
exports.List = List;
//# sourceMappingURL=module.js.map