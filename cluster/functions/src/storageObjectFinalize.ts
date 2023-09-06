import { Firestore } from '@google-cloud/firestore';
import { CloudFunctionsContext } from '@google-cloud/functions-framework';
import path from 'path';

const serviceAccount = JSON.parse(atob(process.env.SERVICE_ACCOUNT_CREDENTIALS!));

const firestore = new Firestore({
  projectId: serviceAccount.project_id,
  credentials: {
    client_email: serviceAccount.client_email,
    private_key: serviceAccount.private_key,
  },
});

export const storageObjectFinalize = async (
  file: { name: string },
  context: CloudFunctionsContext
) => {
  if (context.eventType === 'google.storage.object.finalize') {
    await firestore.doc(file.name).set({
      name: path.basename(file.name),
      lastModified: Date.now(),
      filePath: file.name,
      size: (file as any).size,
      file,
    });
  }
};
