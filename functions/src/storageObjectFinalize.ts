import { Firestore } from '@google-cloud/firestore';
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

function generateHash(input: string): { dirname: string; documentPath: string } {
  const hash = crypto.createHash('sha256').update(input).digest('hex');

  // dirname is the directory of the file relative to the project data folder
  const segments = input.split(path.sep);
  const basePath = path.join(segments[0], segments[1], segments[2]);
  const dirname = path.relative(basePath, path.dirname(input));

  const documentPath = path.join(basePath, hash);

  return { dirname, documentPath };
}

export const storageObjectFinalize = async (
  file: { name: string },
  context: CloudFunctionsContext
) => {
  if (context.eventType === 'google.storage.object.finalize') {
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
      size: (file as any).size,
      file,
    });
  }
};
