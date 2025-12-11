"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageService = exports.getToken = void 0;
/**
 * Get authentication token for API key
 */
const getToken = async (apiKey) => {
    const serverUrl = Buffer.from(apiKey.split(':')[1] || '', 'base64').toString().trim();
    const headers = {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
    };
    try {
        // https://stackoverflow.com/questions/69169492/async-external-function-leaves-open-handles-jest-supertest-express
        if (typeof process !== 'undefined')
            await process.nextTick(() => { });
        const response = await fetch(`${serverUrl}/getToken`, {
            method: 'GET',
            headers,
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = (await response.json());
        return data.token;
    }
    catch (err) {
        const message = `Problem getting token, check api key, err: ${err.message}`;
        throw new Error(message);
    }
};
exports.getToken = getToken;
/**
 * Service for uploading and downloading files from cloud storage
 */
class StorageService {
    constructor(props) {
        this.apiKey = props.apiKey;
        this.apiKeyHeader = this.apiKey?.split(':')[0];
        this.serverUrl = Buffer.from(this.apiKey.split(':')[1] || '', 'base64').toString().trim();
    }
    async getDownloadUrl(path) {
        if (!this.apiKey) {
            throw new Error('apiKey not set');
        }
        const response = await fetch(`${this.serverUrl}/getProjectDownloadUrl`, {
            method: 'POST',
            headers: {
                'x-api-key': this.apiKeyHeader,
                'content-type': 'application/json',
            },
            body: JSON.stringify({ path }),
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        console.log('REQ:', response);
        const data = (await response.json());
        return data.url;
    }
    async download(path) {
        if (!this.apiKey) {
            throw new Error('apiKey not set');
        }
        const url = await this.getDownloadUrl(path);
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.blob();
    }
    async upload(params) {
        const { filename, data, meta, dataId, overwrite } = params;
        if (!this.apiKey) {
            throw new Error('apiKey not set');
        }
        const response = await fetch(`${this.serverUrl}/setStorageObject`, {
            method: 'POST',
            headers: {
                'x-api-key': this.apiKeyHeader,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                filename,
                size: data.size,
                meta,
                dataId,
                overwrite,
            }),
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const { uploadUrl } = (await response.json());
        const putResponse = await fetch(uploadUrl, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/octet-stream',
            },
            body: data,
        });
        if (!putResponse.ok) {
            throw new Error(`HTTP error! status: ${putResponse.status}`);
        }
    }
    async uploadData(path, data, meta) {
        const size = data.size;
        if (!this.apiKey) {
            throw new Error('apiKey not set');
        }
        const response = await fetch(`${this.serverUrl}/getUploadUrl`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': this.apiKeyHeader,
            },
            body: JSON.stringify({
                path,
                size,
                meta,
            }),
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const responseData = (await response.json());
        const url = responseData?.uploadUrl;
        const putResponse = await fetch(url, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/octet-stream',
            },
            body: data,
        });
        if (!putResponse.ok) {
            throw new Error(`HTTP error! status: ${putResponse.status}`);
        }
    }
}
exports.StorageService = StorageService;
//# sourceMappingURL=storage.js.map