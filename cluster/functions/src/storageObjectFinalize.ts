import { CloudFunctionsContext } from '@google-cloud/functions-framework';
import { Firestore } from '@google-cloud/firestore';
import { File } from '@google-cloud/storage';
import path from 'path';

const serviceAccount = JSON.parse(atob(process.env.SERVICE_ACCOUNT_CREDENTIALS!))

;

export const storageObjectFinalize = async (file: File, context: CloudFunctionsContext) => {
  if (context.eventType === 'google.storage.object.finalize') {
    await firestore
      .doc(file.name)
      .set({
        name: path.basename(file.name),
        lastModified: Date.now(),
        filePath: file.name,
        size: (file as any).size,
        file,
      });
  }
};
