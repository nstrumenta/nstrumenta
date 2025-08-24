import {
  Storage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
  updateMetadata,
  deleteObject,
} from '@angular/fire/storage';
import { StorageAdapter, UploadResult } from '../../storage';

export class FirebaseStorageAdapter implements StorageAdapter {
  constructor(private storage: Storage) {}

  upload(path: string, file: Blob, metadata?: any): Promise<UploadResult> {
    const storageRef = ref(this.storage, path);
    const uploadTask = uploadBytesResumable(storageRef, file, metadata);

    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          // can be used to display progress
        },
        (error) => {
          reject(error);
        },
        () => {
          getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
            resolve({
              storagePath: path,
              downloadURL: downloadURL,
            });
          });
        }
      );
    });
  }

  getDownloadURL(path: string): Promise<string> {
    const storageRef = ref(this.storage, path);
    return getDownloadURL(storageRef);
  }

  updateMetadata(path: string, metadata: any): Promise<any> {
    const storageRef = ref(this.storage, path);
    return updateMetadata(storageRef, metadata);
  }

  deleteObject(path: string): Promise<void> {
    const storageRef = ref(this.storage, path);
    return deleteObject(storageRef);
  }
}
