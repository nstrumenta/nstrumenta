const admin = require('firebase-admin');
const crypto = require('crypto');

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
  const projectSlug = process.env.NST_DEV_PROJECT;
  const apiUrl = process.env.NSTRUMENTA_API_URL;

  if (!email || !password || !username || !projectSlug || !apiUrl) {
    console.error('Missing required env vars: NST_DEV_EMAIL, NST_DEV_PASSWORD, NST_DEV_USERNAME, NST_DEV_PROJECT, NSTRUMENTA_API_URL');
    process.exit(1);
  }

  const projectId = `${username}/${projectSlug}`;
  console.log(`Seeding local dev environment: ${projectId}`);

  // 1. Upsert Firebase Auth user
  let user;
  try {
    user = await auth.getUserByEmail(email);
    await auth.updateUser(user.uid, { password });
  } catch (e) {
    user = await auth.createUser({ email, password, emailVerified: true, displayName: 'Dev Engineer' });
  }
  const uid = user.uid;

  const timestamp = Date.now();

  // 2. Mirror setupUsername: org doc keyed by slug, claim global slug
  await db.runTransaction(async (tx) => {
    tx.set(db.doc(`slugs/${username}`), { type: 'user', id: uid });

    tx.set(db.doc(`organizations/${username}`), {
      name: username,
      slug: username,
      type: 'personal',
      createdAt: timestamp,
      createdBy: uid,
    });
    tx.set(db.doc(`organizations/${username}/members/${uid}`), {
      role: 'owner',
      addedAt: timestamp,
      addedBy: uid,
    });

    tx.set(db.doc(`users/${uid}`), {
      username,
      personalOrgId: username,
      status: 'approved',
      email,
      createdAt: timestamp,
    }, { merge: true });
    tx.set(db.doc(`users/${uid}/organizations/${username}`), {
      name: username,
      slug: username,
      role: 'owner',
    });

    // 3. Mirror create_project: project under org
    tx.set(db.doc(`organizations/${username}/projects/${projectSlug}`), {
      name: projectSlug,
      slug: projectSlug,
      orgSlug: username,
      members: { [uid]: 'owner' },
      createdAt: timestamp,
      createdBy: uid,
      apiUrl,
      apiKeys: {},
    }, { merge: true });
  });

  // 4. Generate CLI access key
  const accessKeyId = crypto.randomBytes(8).toString('hex');
  const secretAccessKey = crypto.randomBytes(16).toString('hex');
  const key = `${accessKeyId}${secretAccessKey}`;
  const salt = crypto.randomBytes(16).toString('hex');
  const pepper = process.env.NSTRUMENTA_API_KEY_PEPPER || '';
  const hash = crypto.scryptSync(secretAccessKey, salt + pepper, 64).toString('hex');
  const now = Date.now();
  const expiresAt = now + 1000 * 60 * 60 * 24;

  await db.collection('keys').doc(accessKeyId).set({
    projectId,
    orgSlug: username,
    projectSlug,
    createdAt: now,
    expiresAt,
    salt,
    hash,
    version: 'v2',
  });

  await db.doc(`organizations/${username}/projects/${projectSlug}`).update({
    [`apiKeys.${accessKeyId}`]: { createdAt: now, expiresAt, createdBy: uid },
  });

  const keyWithUrl = `${key}:${Buffer.from(apiUrl).toString('base64')}`;

  console.log(`URL:      http://localhost:5008/${username}/${projectSlug}`);
  console.log(`Login:    ${email}  /  ${password}`);
  console.log(`API_KEY:  ${keyWithUrl}`);
}

seedLocalDev().catch(console.error);

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
