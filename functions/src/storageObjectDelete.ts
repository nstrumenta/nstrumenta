import { Firestore } from '@google-cloud/firestore';
import { Storage } from '@google-cloud/storage';
import { CloudEvent, cloudEvent } from '@google-cloud/functions-framework';
import crypto from 'crypto';

const firestore = new Firestore();
export const storage = new Storage();

function firestorePathForStorageObject(filePath: string): string {
  const segments = filePath.split('/');
  if (segments.length < 3) {
    throw new Error(`Unexpected GCS path format: ${filePath}`);
  }
  const orgSlug = segments[0];
  const projectSlug = segments[1];
  const hash = crypto.createHash('sha256').update(filePath).digest('hex');
  return `organizations/${orgSlug}/projects/${projectSlug}/data/${hash}`;
}

interface StorageObjectData {
  name: string;
  bucket: string;
  [key: string]: unknown;
}

export const storageObjectDelete = cloudEvent<StorageObjectData>(
  'storageObjectDelete',
  async (event: CloudEvent<StorageObjectData>) => {
    const file = event.data;
    if (!file?.name) {
      console.log('No file name in event data, skipping.');
      return;
    }
    // delete triggers when overwriting in gcsfuse
    // check to see if the file exists before removing the firestore doc
    const exists = (await storage.bucket(file.bucket).file(file.name).exists())[0];
    const firestorePath = firestorePathForStorageObject(file.name);
    if (!exists) {
      console.log(`file ${file.name} doesn't exist, deleting`);
      await firestore.doc(firestorePath).delete();
    } else {
      console.log(`file ${file.name} exists, ignoring overwrite`);
    }
  }
);
