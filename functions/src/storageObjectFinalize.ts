import { Firestore } from '@google-cloud/firestore';
import { CloudEvent, cloudEvent } from '@google-cloud/functions-framework';
import path from 'path';
import crypto from 'crypto';

const firestore = new Firestore();

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
  size?: string;
  contentType?: string;
  bucket?: string;
  [key: string]: unknown;
}

export const storageObjectFinalize = cloudEvent<StorageObjectData>(
  'storageObjectFinalize',
  async (event: CloudEvent<StorageObjectData>) => {
    const file = event.data;
    if (!file?.name) {
      console.log('No file name in event data, skipping.');
      return;
    }
    if (file.name.endsWith('/')) {
      console.log('The trigger file is a directory. Skipping processing.');
      return;
    }
    const firestorePath = firestorePathForStorageObject(file.name);
    await firestore.doc(firestorePath).set({
      name: path.basename(file.name),
      filePath: file.name,
      lastModified: Date.now(),
      size: file.size ? parseInt(file.size, 10) : undefined,
      contentType: file.contentType,
    });
  }
);
