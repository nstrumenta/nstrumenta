/**
 * Get authentication token for API key
 */
export declare const getToken: (apiKey: string) => Promise<string>;
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
export declare class StorageService {
    private apiKey?;
    private apiKeyHeader;
    private serverUrl;
    constructor(props: {
        apiKey: string;
    });
    getDownloadUrl(path: string): Promise<string>;
    download(path: string): Promise<Blob>;
    upload(params: StorageUploadParameters): Promise<void>;
    uploadData(path: string, data: Blob, meta: Record<string, string>): Promise<void>;
}
