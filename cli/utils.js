"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNearestConfigJson = exports.getNstDir = exports.getModuleFromStorage = exports.inquiryForSelectModule = exports.getFolderFromStorage = exports.endpoints = exports.serverUrl = exports.resolveApiUrl = exports.resolveApiKey = void 0;
exports.asyncSpawn = asyncSpawn;
exports.getVersionFromPath = getVersionFromPath;
exports.walkDirectory = walkDirectory;
const child_process_1 = require("child_process");
const promises_1 = __importDefault(require("fs/promises"));
const inquirer_1 = __importDefault(require("inquirer"));
const node_path_1 = __importDefault(require("node:path"));
const path_1 = __importDefault(require("path"));
const semver_1 = __importDefault(require("semver"));
const tar_1 = __importDefault(require("tar"));
// Inline API key and URL resolution
const resolveApiKey = () => {
    const apiKey = process.env.NSTRUMENTA_API_KEY || process.env.NST_API_KEY;
    if (!apiKey) {
        console.warn('Warning: NSTRUMENTA_API_KEY environment variable not set');
        return '';
    }
    return apiKey;
};
exports.resolveApiKey = resolveApiKey;
const resolveApiUrl = () => {
    return process.env.NSTRUMENTA_API_URL || process.env.NST_API_URL;
};
exports.resolveApiUrl = resolveApiUrl;
const prompt = inquirer_1.default.createPromptModule();
// Get server URL from environment or decode from API key
const getServerUrl = () => {
    const apiUrl = (0, exports.resolveApiUrl)();
    if (apiUrl)
        return apiUrl;
    const apiKey = (0, exports.resolveApiKey)();
    if (!apiKey)
        return '';
    return Buffer.from(apiKey.split(':')[1] || '', 'base64').toString().trim();
};
exports.serverUrl = getServerUrl();
// Endpoint helper for backward compatibility
exports.endpoints = {
    GET_PROJECT_DOWNLOAD_URL: `${exports.serverUrl}/getProjectDownloadUrl`,
    LIST_MODULES: `${exports.serverUrl}/listModules`,
    GET_AGENT_ID_BY_TAG: `${exports.serverUrl}/getAgentIdByTag`,
    GET_CLOUD_RUN_SERVICES: `${exports.serverUrl}/getCloudRunServices`,
    GET_MACHINES: `${exports.serverUrl}/getMachines`,
    GET_DATA_MOUNT: `${exports.serverUrl}/getDataMount`,
    GET_UPLOAD_DATA_URL: `${exports.serverUrl}/getUploadDataUrl`,
    QUERY_COLLECTION: `${exports.serverUrl}/queryCollection`,
    GET_PROJECT: `${exports.serverUrl}/getProject`,
    SET_ACTION: `${exports.serverUrl}/setAction`,
    GET_ACTION: `${exports.serverUrl}/getAction`,
    GET_UPLOAD_URL: `${exports.serverUrl}/getUploadUrl`,
};
async function asyncSpawn(cmd, args, options, errCB) {
    if (!options?.quiet) {
        console.log(`${cmd} ${args?.join(' ')}`);
    }
    args = args || [];
    options = { ...options };
    const childProcess = (0, child_process_1.spawn)(cmd, args, options);
    let output = '';
    let error = '';
    if (childProcess.stdout && childProcess.stderr) {
        for await (const chunk of childProcess.stdout) {
            output += chunk;
        }
        for await (const chunk of childProcess.stderr) {
            error += chunk;
        }
    }
    const code = await new Promise((resolve, reject) => {
        childProcess.on('close', resolve);
        childProcess.on('error', reject);
    });
    if (code) {
        if (errCB) {
            errCB(code);
        }
        throw new Error(`spawned process ${cmd} error code ${code}, ${error}`);
    }
    if (!options?.quiet) {
        console.log(`${cmd} ${args?.join(' ')}`, output, error);
    }
    return childProcess;
}
const getFolderFromStorage = async (moduleTarName, options) => {
    const { apiKey } = options;
    const nstDir = await (0, exports.getNstDir)(process.cwd());
    const file = `${node_path_1.default.join(nstDir, moduleTarName)}`;
    const extractFolder = node_path_1.default.join(nstDir, moduleTarName.replace('.tar.gz', ''));
    try {
        await promises_1.default.access(extractFolder);
    }
    catch {
        await promises_1.default.mkdir(extractFolder, { recursive: true });
    }
    try {
        await promises_1.default.stat(file);
        console.log(`using cached version of ${file}`);
    }
    catch {
        console.log(`get ${moduleTarName} from storage`);
        // get the download url
        let url = '';
        const downloadUrlConfig = {
            headers: { 'x-api-key': apiKey, 'content-type': 'application/json' },
        };
        const downloadUrlData = { path: `modules/${moduleTarName}` };
        try {
            const downloadUrlResponse = await fetch(exports.endpoints.GET_PROJECT_DOWNLOAD_URL, {
                method: 'POST',
                headers: downloadUrlConfig.headers,
                body: JSON.stringify(downloadUrlData),
            });
            if (!downloadUrlResponse.ok) {
                throw new Error(`HTTP error! status: ${downloadUrlResponse.status}`);
            }
            url = await downloadUrlResponse.text();
        }
        catch (error) {
            throw new Error(error);
        }
        // get the file, write to the nst directory
        console.log('get url', url);
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        await promises_1.default.writeFile(file, new Uint8Array(arrayBuffer));
        console.log(`file written to ${file}`);
    }
    try {
        await asyncSpawn('tar', ['-zxvf', file], { cwd: extractFolder, quiet: true });
    }
    catch {
        try {
            const options = {
                gzip: true,
                file: file,
                cwd: extractFolder,
            };
            await tar_1.default.extract(options);
        }
        catch (err) {
            console.warn(`Error, problem extracting tar ${file} to ${extractFolder}`);
            throw err;
        }
    }
    return extractFolder;
};
exports.getFolderFromStorage = getFolderFromStorage;
const inquiryForSelectModule = async (choices) => {
    const { module } = await prompt([{ type: 'list', name: 'module', message: 'Module', choices }]);
    return module;
};
exports.inquiryForSelectModule = inquiryForSelectModule;
const getModuleFromStorage = async ({ name, version: versionArg, }) => {
    const apiKey = (0, exports.resolveApiKey)();
    const response = await fetch(exports.endpoints.LIST_MODULES, {
        method: 'POST',
        headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' },
    });
    const data = await response.json();
    const serverModules = data
        .map((module) => module.name)
        .filter((moduleName) => moduleName?.startsWith(name))
        .map((match) => {
        return {
            moduleTarName: match,
            version: match.replace(`${name}-`, '').replace('.tar.gz', ''),
        };
    });
    const version = versionArg
        ? versionArg
        : serverModules
            .map(({ version }) => version)
            .sort(semver_1.default.compare)
            .reverse()
            .shift();
    const path = `${name}-${version}.tar.gz`;
    const folder = await (0, exports.getFolderFromStorage)(path, { apiKey });
    let moduleConfig;
    try {
        const file = await promises_1.default.readFile(`${folder}/nstrumentaModule.json`, { encoding: 'utf8' });
        moduleConfig = JSON.parse(file);
    }
    catch (err) {
        console.warn(`Error, can't find or parse the module's config file`);
        throw err;
    }
    return {
        folder: folder,
        ...moduleConfig,
    };
};
exports.getModuleFromStorage = getModuleFromStorage;
function getVersionFromPath(path) {
    const match = /(\d+)\.(\d+).(\d+)/.exec(path);
    const version = match ? match[0] : '';
    return version;
}
const getNstDir = async (cwd) => {
    // first look for .nst in cwd
    // agent run creates .nst in it's cwd for supporting
    // multiple independent agents on the same machine
    const cwdNstDir = `${cwd}/.nst`;
    try {
        const stat = await promises_1.default.stat(cwdNstDir);
        if (stat.isDirectory()) {
            return cwdNstDir;
        }
    }
    catch {
        // no cwd /.nst found, use __dirname/.nst below
    }
    // use __dirname/.nst , which is the location of installed .js
    // this is the typical case for running e.g. module publish
    // as a developer
    const nstDir = `${__dirname}/.nst`;
    await promises_1.default.mkdir(nstDir, { recursive: true });
    try {
        const stat = await promises_1.default.stat(nstDir);
        if (!stat.isDirectory()) {
            throw new Error('no .nst temp dir');
        }
    }
    catch (err) {
        console.warn(err.message);
        throw err;
    }
    return nstDir;
};
exports.getNstDir = getNstDir;
const getNearestConfigJson = async () => {
    let currentDir = '';
    let nextDir = process.cwd();
    let file;
    while (!file && currentDir !== nextDir) {
        try {
            currentDir = nextDir;
            file = await promises_1.default.readFile(path_1.default.join(currentDir, `.nstrumenta/config.json`), {
                encoding: 'utf8',
            });
        }
        catch (error) {
            nextDir = path_1.default.join(currentDir, '..');
        }
    }
    if (file === undefined) {
        throw new Error('No nstrumenta config found');
    }
    return { file, cwd: currentDir };
};
exports.getNearestConfigJson = getNearestConfigJson;
async function* walkDirectory(dir, { maxDepth } = {}) {
    const max = maxDepth ? maxDepth : Infinity;
    for await (const file of await promises_1.default.opendir(dir)) {
        if (max < 1)
            continue;
        const entry = path_1.default.join(dir, file.name);
        if (file.isDirectory())
            yield* walkDirectory(entry, { maxDepth: max - 1 });
        else if (file.isFile())
            yield entry;
    }
}
//# sourceMappingURL=utils.js.map