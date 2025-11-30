const admin = require('firebase-admin');
const crypto = require('crypto');

if (process.argv.length !== 4) {
  console.log('Usage: node create-api-key.js <projectId> <apiUrl>');
  process.exit(1);
}

const projectId = process.argv[2];
const apiUrl = process.argv[3];

const serviceAccount = JSON.parse(process.env.GCLOUD_SERVICE_KEY);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const firestore = admin.firestore();

async function createApiKey() {
  // New Key Format: accessKeyId (16 hex) + secretAccessKey (32 hex)
  const accessKeyId = crypto.randomBytes(8).toString('hex');
  const secretAccessKey = crypto.randomBytes(16).toString('hex');
  const key = `${accessKeyId}${secretAccessKey}`;
  
  // Salt for scrypt
  const salt = crypto.randomBytes(16).toString('hex');
  const pepper = process.env.NSTRUMENTA_API_KEY_PEPPER || '';
  
  // Hash the secret part
  const hash = crypto.scryptSync(secretAccessKey, salt + pepper, 64).toString('hex');

  const createdAt = Date.now();

  try {
    // Store under accessKeyId (public ID)
    await firestore.collection('keys').doc(accessKeyId).set({
      projectId,
      createdAt,
      salt,
      hash,
      version: 'v2'
    });

    const projectPath = `/projects/${projectId}`;
    const projectDoc = await firestore.doc(projectPath).get();
    
    if (!projectDoc.exists) {
        // Create the project if it doesn't exist
        await firestore.doc(projectPath).set({
            name: projectId,
            members: {
              'ci-user': 'owner'
            },
            agentType: 'main',
            createdAt: new Date().toISOString(),
            createdBy: 'ci-user',
            apiKeys: {}
        });
        console.error(`Project ${projectId} created`);
    }

    // Re-fetch to ensure we have the data (or just use what we set)
    const projectData = (await firestore.doc(projectPath).get()).data();
    const apiKeys = projectData.apiKeys || {};
    apiKeys[accessKeyId] = { createdAt };

    await firestore.doc(projectPath).update({ apiKeys });

    const keyWithUrl = `${key}:${btoa(apiUrl)}`;
    console.log(keyWithUrl);
  } catch (error) {
    console.error('Error creating API key:', error);
    process.exit(1);
  }
}

createApiKey();
