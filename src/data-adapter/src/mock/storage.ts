import { StorageAdapter, UploadResult } from '../../storage';

export class MockStorageAdapter implements StorageAdapter {
  upload(path: string, file: Blob, metadata?: any): Promise<UploadResult> {
    console.log(`Mock upload of a file to ${path}`);
    return Promise.resolve({
      storagePath: path,
      downloadURL: `https://mock-storage.com/${path}`,
    });
  }

  getDownloadURL(path: string): Promise<string> {
    return Promise.resolve(`https://mock-storage.com/${path}`);
  }

  updateMetadata(path: string, metadata: any): Promise<any> {
    console.log(`Mock updateMetadata for ${path} with`, metadata);
    return Promise.resolve();
  }

  deleteObject(path: string): Promise<void> {
    console.log(`Mock deleteObject for ${path}`);
    return Promise.resolve();
  }
}
