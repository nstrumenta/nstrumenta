/**
 * Get authentication token for API key
 */
export const getToken = async (apiKey: string): Promise<string> => {
  const serverUrl = Buffer.from(apiKey.split(':')[1] || '', 'base64').toString().trim();
  const headers = {
    'x-api-key': apiKey,
    'Content-Type': 'application/json',
  };
  try {
    // https://stackoverflow.com/questions/69169492/async-external-function-leaves-open-handles-jest-supertest-express
    if (typeof process !== 'undefined') await process.nextTick(() => {});
    const response = await fetch(`${serverUrl}/getToken`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = (await response.json()) as { token: string };
    return data.token;
  } catch (err) {
    const message = `Problem getting token, check api key, err: ${(err as Error).message}`;
    throw new Error(message);
  }
};

export interface StorageUploadParameters {
  filename: string;
  data: Blob;
  meta: Record<string, string>;
  dataId?: string;
  overwrite?: boolean;
}

/**
 * Service for uploading and downloading files from cloud storage
 */
export class StorageService {
  private apiKey?: string;
  private apiKeyHeader: string;
  private serverUrl: string;

  constructor(props: { apiKey: string }) {
    this.apiKey = props.apiKey;
    this.apiKeyHeader = this.apiKey?.split(':')[0]!;
    this.serverUrl = Buffer.from(this.apiKey.split(':')[1] || '', 'base64').toString().trim();
  }

  async getDownloadUrl(path: string): Promise<string> {
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
    const data = (await response.json()) as { url: string };
    return data.url;
  }

  async download(path: string): Promise<Blob> {
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

  async upload(params: StorageUploadParameters): Promise<void> {
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

    const { uploadUrl } = (await response.json()) as { uploadUrl: string };

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

  async uploadData(path: string, data: Blob, meta: Record<string, string>): Promise<void> {
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

    const responseData = (await response.json()) as { uploadUrl: string };
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
