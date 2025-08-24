export interface UploadResult {
  storagePath: string;
  downloadURL: string;
}

export interface StorageAdapter {
  upload(path: string, file: Blob, metadata?: any): Promise<UploadResult>;
  getDownloadURL(path: string): Promise<string>;
  updateMetadata(path: string, metadata: any): Promise<any>;
  deleteObject(path: string): Promise<void>;
}
