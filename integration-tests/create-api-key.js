const admin = require('firebase-admin');
const crypto = require('crypto');

if (process.argv.length !== 4) {
  console.log('Usage: node create-api-key.js <projectId> <apiUrl>');
  process.exit(1);
}

const projectId = process.argv[2];
const apiUrl = process.argv[3];
const projectOwnerUid = process.env.TEST_USER_UID;
const pepper = process.env.NSTRUMENTA_API_KEY_PEPPER;

if (!projectId.includes('/') || projectId.split('/').length !== 2) {
  console.error(`Error: projectId must be in 'orgSlug/projectSlug' format. Got: '${projectId}'`);
  process.exit(1);
}

if (!projectOwnerUid) {
  console.error('Error: TEST_USER_UID is required to create the seeded CI project');
  process.exit(1);
}

if (!pepper) {
  console.error('Error: NSTRUMENTA_API_KEY_PEPPER is required to create a CI API key');
  process.exit(1);
}

const [orgSlug, projectSlug] = projectId.split('/');
const userProjectMembershipDocId = `${orgSlug}__${projectSlug}`;

admin.initializeApp({
  credential: admin.credential.applicationDefault()
});

const firestore = admin.firestore();

async function createApiKey() {
  // New Key Format: accessKeyId (16 hex) + secretAccessKey (32 hex)
  const accessKeyId = crypto.randomBytes(8).toString('hex');
  const secretAccessKey = crypto.randomBytes(16).toString('hex');
  const key = `${accessKeyId}${secretAccessKey}`;
  
  // Salt for scrypt
  const salt = crypto.randomBytes(16).toString('hex');
  console.error(`Pepper present: ${pepper.length > 0}`);
  
  // Hash the secret part
  const hash = crypto.scryptSync(secretAccessKey, salt + pepper, 64).toString('hex');

  const now = Date.now();
  const expiresAt = now + 1000 * 60 * 60 * 2; // 2 hours for CI tests

  try {
    // Store under accessKeyId (public ID)
    await firestore.collection('keys').doc(accessKeyId).set({
      projectId,
      createdAt: now,
      expiresAt,
      salt,
      hash,
      version: 'v2'
    });

    const projectPath = `organizations/${orgSlug}/projects/${projectSlug}`;
    
    const projectDoc = await firestore.doc(projectPath).get();
    const userProjectMembershipPath = `users/${projectOwnerUid}/projects/${userProjectMembershipDocId}`;
    
    if (!projectDoc.exists) {
        // Create the project if it doesn't exist
        await firestore.doc(projectPath).set({
            name: projectSlug,
            slug: projectSlug,
            orgSlug,
            members: {
              [projectOwnerUid]: 'owner'
            },
            createdAt: new Date().toISOString(),
            createdBy: projectOwnerUid,
            apiKeys: {},
            apiUrl: apiUrl
        });
        console.error(`Project ${projectId} created`);
    } else {
        // Update apiUrl if project exists
        await firestore.doc(projectPath).update({ apiUrl });
    }

      await firestore.doc(userProjectMembershipPath).set({
        projectId,
        addedAt: now,
      }, { merge: true });

    // Re-fetch to ensure we have the data (or just use what we set)
    const projectData = (await firestore.doc(projectPath).get()).data();
    const apiKeys = projectData.apiKeys || {};
    apiKeys[accessKeyId] = { createdAt: now, expiresAt, createdBy: projectOwnerUid };
    const keyWithUrl = `${key}:${btoa(apiUrl)}`;
    console.log(keyWithUrl);
  } catch (error) {
    console.error('Error creating API key:', error);
    process.exit(1);
  }
}

createApiKey();
