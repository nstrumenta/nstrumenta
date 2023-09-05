import { Firestore } from '@google-cloud/firestore';
import { CloudFunctionsContext } from '@google-cloud/functions-framework';
import { File } from '@google-cloud/storage';

const serviceAccount = JSON.parse(atob(process.env.SERVICE_ACCOUNT_CREDENTIALS!));

const firestore = new Firestore({
  projectId: serviceAccount.project_id,
  credentials: {
    client_email: serviceAccount.client_email,
    private_key: serviceAccount.private_key,
  },
});

export const storageObjectDelete = async (file: File, context: CloudFunctionsContext) => {
  if (context.eventType === 'google.storage.object.delete') {
    await firestore.doc(file.name).delete();
  }
};
