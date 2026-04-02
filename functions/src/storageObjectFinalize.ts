import { Firestore } from '@google-cloud/firestore';
import { CloudEvent, cloudEvent } from '@google-cloud/functions-framework';
import path from 'path';
import crypto from 'crypto';

const firestore = new Firestore();

function generateHash(input: string): { dirname: string; documentPath: string } {
  const hash = crypto.createHash('sha256').update(input).digest('hex');

  // dirname is the directory of the file relative to the project data folder
  const segments = input.split(path.sep);
  const basePath = path.join(segments[0], segments[1], segments[2]);
  const dirname = path.relative(basePath, path.dirname(input));

  const documentPath = path.join(basePath, hash);

  return { dirname, documentPath };
}

interface StorageObjectData {
  name: string;
  size?: string;
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
    const { documentPath, dirname } = generateHash(file.name);
    await firestore.doc(documentPath).set({
      name: path.basename(file.name),
      dirname,
      lastModified: Date.now(),
      filePath: file.name,
      size: file.size ? parseInt(file.size, 10) : undefined,
      file,
    });
  }
);
