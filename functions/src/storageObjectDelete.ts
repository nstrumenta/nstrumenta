import { Firestore } from '@google-cloud/firestore';
import { Storage } from '@google-cloud/storage';
import { CloudFunctionsContext } from '@google-cloud/functions-framework';
import path from 'path';
import crypto from 'crypto';

const serviceKeyJson = process.env.GCLOUD_SERVICE_KEY;
if (serviceKeyJson == undefined) throw new Error('GCLOUD_SERVICE_KEY undefined');
const serviceAccount = JSON.parse(serviceKeyJson);

const firestore = new Firestore({
  projectId: serviceAccount.project_id,
  credentials: {
    client_email: serviceAccount.client_email,
    private_key: serviceAccount.private_key,
  },
});

export const storage = new Storage({
  projectId: serviceAccount.project_id,
  credentials: {
    client_email: serviceAccount.client_email,
    private_key: serviceAccount.private_key,
  },
});

function generateHash(input: string): { dirname: string; documentPath: string } {
  const hash = crypto.createHash('sha256').update(input).digest('hex');

  // dirname is the directory of the file relative to the project data folder
  const segments = input.split(path.sep);
  const basePath = path.join(segments[0], segments[1], segments[2]);
  const dirname = path.relative(basePath, path.dirname(input));

  const documentPath = path.join(basePath, hash);

  return { dirname, documentPath };
}

export const storageObjectDelete = async (
  file: { name: string; bucket: string },
  context: CloudFunctionsContext
) => {
  // delete triggers when overwriting in gcsfuse
  // check to see if the file exists before removing the firestore doc
  const exists = (await storage.bucket(file.bucket).file(file.name).exists())[0];
  const { documentPath } = generateHash(file.name);
  if (!exists) {
    console.log(`file ${file.name} doesn't exist, deleting`);
    await firestore.doc(documentPath).delete();
  } else {
    console.log(`file ${file.name} exists, ignoring overwrite`);
  }
};
