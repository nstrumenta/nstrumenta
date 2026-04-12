const admin = require('firebase-admin');
const crypto = require('crypto');

// Ensures the local emulator is initialized with a robust, persistent "Dev" user
// and a ready-to-use project with proper slugs and organization mapping,
// mimicking a production sign-up flow precisely.

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault()
  });
}

const auth = admin.auth();
const db = admin.firestore();

async function seedLocalDev() {
  const email = process.env.NST_DEV_EMAIL;
  const password = process.env.NST_DEV_PASSWORD;
  const username = process.env.NST_DEV_USERNAME;
  const projectId = process.env.NST_DEV_PROJECT;
  const apiUrl = process.env.NST_API_URL;

  if (!email || !password || !username || !projectId || !apiUrl) {
    console.error('Error: Required environment variables are missing.');
    console.error('Please ensure the following are set:');
    console.error('- NST_DEV_EMAIL');
    console.error('- NST_DEV_PASSWORD');
    console.error('- NST_DEV_USERNAME');
    console.error('- NST_DEV_PROJECT');
    console.error('- NST_API_URL');
    process.exit(1);
  }

  console.log(`Ensuring persistent dev environment for: ${email}`);

  // 1. Setup Auth
  let user;
  try {
    user = await auth.getUserByEmail(email);
    await auth.updateUser(user.uid, { password });
  } catch (e) {
    user = await auth.createUser({
      email,
      password,
      emailVerified: true,
      displayName: 'Dev Engineer'
    });
  }
  const uid = user.uid;

  // 2. Setup robust Firestore relationships (User, Org, Slugs, Project)
  const timestamp = Date.now();
  const orgId = username; // For local dev predictability

  await db.runTransaction(async (tx) => {
    // User slug
    tx.set(db.doc(`slugs/${username}`), { type: 'user', id: uid });
    
    // Personal Org
    tx.set(db.doc(`organizations/${orgId}`), {
      name: username,
      slug: username,
      type: 'personal',
      createdAt: timestamp,
      createdBy: uid,
    });
    tx.set(db.doc(`organizations/${orgId}/members/${uid}`), {
      role: 'owner',
      addedAt: timestamp,
      addedBy: uid,
    });
    
    // User Profile
    tx.set(db.doc(`users/${uid}`), {
      username,
      personalOrgId: orgId,
      status: 'approved',
      email,
      createdAt: timestamp,
    }, { merge: true });
    tx.set(db.doc(`users/${uid}/organizations/${orgId}`), {
      name: username,
      slug: username,
      role: 'owner',
    });

    // Dev Project
    const projectRef = db.doc(`projects/${projectId}`);
    tx.set(projectRef, {
      name: projectId,
      members: { [uid]: 'owner' },
      createdAt: new Date().toISOString(),
      createdBy: uid,
      apiUrl,
      apiKeys: {}
    }, { merge: true });

    // Project Slug for Frontend Resolution (localhost:5008/devaccount/dev-flyimal)
    tx.set(db.doc(`project-slugs/${username}:${projectId}`), {
      projectId: projectId
    });
    
    // Bind project to User's subcollection
    tx.set(db.doc(`users/${uid}/projects/${projectId}`), {
      role: 'owner',
      name: projectId
    }, { merge: true });
  });

  // 3. Setup Predictable/Persistent CLI Access Key
  // Normally crypto random, but for persistent local workflow we can maintain the same signature
  // or just generate a fresh one each time the seeder runs. We'll generate a fresh one here.
  const accessKeyId = crypto.randomBytes(8).toString('hex');
  const secretAccessKey = crypto.randomBytes(16).toString('hex');
  const key = `${accessKeyId}${secretAccessKey}`;
  const salt = crypto.randomBytes(16).toString('hex');
  const pepper = process.env.NSTRUMENTA_API_KEY_PEPPER || '';
  const hash = crypto.scryptSync(secretAccessKey, salt + pepper, 64).toString('hex');
  const now = Date.now();
  const expiresAt = now + 1000 * 60 * 60 * 24; // 24 hours

  await db.collection('keys').doc(accessKeyId).set({
    projectId,
    createdAt: now,
    expiresAt,
    salt,
    hash,
    version: 'v2'
  });

  await db.doc(`projects/${projectId}`).update({
    [`apiKeys.${accessKeyId}`]: { createdAt: now, expiresAt, createdBy: uid }
  });

  const keyWithUrl = `${key}:${Buffer.from(apiUrl).toString('base64')}`;

  console.log('\n✅ [SUCCESS] Local Workflow Environment Seeded!');
  console.log(`-----------------------------------------------`);
  console.log(`URL:      http://localhost:5008/${username}/${projectId}`);
  console.log(`Login:    ${email}  /  ${password}`);
  console.log(`API_KEY:  ${keyWithUrl}`);
  console.log(`-----------------------------------------------\n`);
}

seedLocalDev().catch(console.error);
