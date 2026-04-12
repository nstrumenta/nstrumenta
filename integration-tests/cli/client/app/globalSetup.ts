import { randomBytes, scryptSync } from 'crypto';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { initializeApp, applicationDefault, getApps, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const SERVER_URL = process.env.NSTRUMENTA_SERVER_URL ?? 'http://server:5999';

function getAdminApp(): App {
  if (getApps().length > 0) return getApps()[0];
  return initializeApp({
    credential: applicationDefault(),
    projectId: process.env.GOOGLE_CLOUD_PROJECT,
  });
}

async function createApiKey(projectId: string, serverUrl: string, uid: string): Promise<string> {
  const [orgSlug, projectSlug] = projectId.split('/');
  const firestore = getFirestore();

  const accessKeyId = randomBytes(8).toString('hex');
  const secretAccessKey = randomBytes(16).toString('hex');
  const key = `${accessKeyId}${secretAccessKey}`;

  const salt = randomBytes(16).toString('hex');
  const pepper = process.env.NSTRUMENTA_API_KEY_PEPPER ?? '';
  const hash = scryptSync(secretAccessKey, salt + pepper, 64).toString('hex');

  const now = Date.now();
  const expiresAt = now + 1000 * 60 * 60 * 2; // 2 hours

  await firestore.collection('keys').doc(accessKeyId).set({
    projectId,
    createdAt: now,
    expiresAt,
    salt,
    hash,
    version: 'v2',
  });

  const projectPath = `organizations/${orgSlug}/projects/${projectSlug}`;
  const projectDoc = await firestore.doc(projectPath).get();
  if (!projectDoc.exists) {
    await firestore.doc(projectPath).set({
      orgSlug,
      projectSlug,
      projectId,
      owner: uid,
      createdAt: new Date().toISOString(),
      apiUrl: serverUrl,
    });
  } else {
    await firestore.doc(projectPath).update({ apiUrl: serverUrl });
  }

  const existingKeys = (projectDoc.data()?.apiKeys as Record<string, unknown>) ?? {};
  existingKeys[accessKeyId] = { createdAt: now, expiresAt, createdBy: uid };
  await firestore.doc(projectPath).update({ apiKeys: existingKeys });

  const keyWithUrl = `${key}:${Buffer.from(serverUrl).toString('base64')}`;
  return keyWithUrl;
}

export async function setup(): Promise<() => Promise<void>> {
  getAdminApp();
  const auth = getAuth();
  const firestore = getFirestore();

  const suffix = randomBytes(4).toString('hex');
  const username = `ci-cli-${suffix}`;
  const email = `${username}@nstrumenta.test`;
  const password = randomBytes(24).toString('base64url');

  const created = await auth.createUser({
    email,
    password,
    emailVerified: true,
    displayName: 'CI CLI',
  });
  const uid = created.uid;

  const timestamp = Date.now();
  await firestore.runTransaction(async (tx) => {
    tx.set(firestore.doc(`slugs/${username}`), { type: 'user', id: uid });
    tx.set(firestore.doc(`organizations/${username}`), {
      name: username,
      slug: username,
      type: 'personal',
      createdAt: timestamp,
      createdBy: uid,
    });
    tx.set(firestore.doc(`organizations/${username}/members/${uid}`), {
      role: 'owner',
      addedAt: timestamp,
      addedBy: uid,
    });
    tx.set(
      firestore.doc(`users/${uid}`),
      {
        username,
        personalOrgId: username,
        status: 'approved',
        email,
        createdAt: new Date(),
      },
      { merge: true }
    );
    tx.set(firestore.doc(`users/${uid}/organizations/${username}`), {
      name: username,
      slug: username,
      role: 'owner',
    });
  });

  const projectId = `${username}/ci`;
  const apiKey = await createApiKey(projectId, SERVER_URL, uid);
  process.env.NSTRUMENTA_API_KEY = apiKey;

  return async () => {
    await firestore.recursiveDelete(firestore.doc(`organizations/${username}`));
    await firestore.recursiveDelete(firestore.doc(`users/${uid}`));
    await firestore.doc(`slugs/${username}`).delete();
    await auth.deleteUser(uid);
  };
}

export async function seedLocalDev(): Promise<void> {
  const email = process.env.NST_DEV_EMAIL;
  const password = process.env.NST_DEV_PASSWORD;
  const username = process.env.NST_DEV_USERNAME;
  const projectSlug = process.env.NST_DEV_PROJECT;

  if (!email || !password || !username || !projectSlug) {
    console.error('Missing required env vars: NST_DEV_EMAIL, NST_DEV_PASSWORD, NST_DEV_USERNAME, NST_DEV_PROJECT');
    process.exit(1);
  }

  getAdminApp();
  const auth = getAuth();
  const firestore = getFirestore();

  let uid: string;
  try {
    const existing = await auth.getUserByEmail(email);
    await auth.updateUser(existing.uid, { password });
    uid = existing.uid;
  } catch {
    const created = await auth.createUser({ email, password, emailVerified: true, displayName: 'Dev Engineer' });
    uid = created.uid;
  }

  const timestamp = Date.now();
  await firestore.runTransaction(async (tx) => {
    tx.set(firestore.doc(`slugs/${username}`), { type: 'user', id: uid });
    tx.set(firestore.doc(`organizations/${username}`), {
      name: username, slug: username, type: 'personal', createdAt: timestamp, createdBy: uid,
    });
    tx.set(firestore.doc(`organizations/${username}/members/${uid}`), {
      role: 'owner', addedAt: timestamp, addedBy: uid,
    });
    tx.set(firestore.doc(`users/${uid}`), {
      username, personalOrgId: username, status: 'approved', email, createdAt: timestamp,
    }, { merge: true });
    tx.set(firestore.doc(`users/${uid}/organizations/${username}`), {
      name: username, slug: username, role: 'owner',
    });
    tx.set(firestore.doc(`organizations/${username}/projects/${projectSlug}`), {
      name: projectSlug, slug: projectSlug, orgSlug: username,
      members: { [uid]: 'owner' }, createdAt: timestamp, createdBy: uid,
      apiUrl: SERVER_URL, apiKeys: {},
    }, { merge: true });
  });

  const projectId = `${username}/${projectSlug}`;
  const keyWithUrl = await createApiKey(projectId, SERVER_URL, uid);

  const outputPath = join(__dirname, '..', '..', '..', '..', '.seed-output');
  writeFileSync(outputPath, [
    `URL:      http://localhost:5008/${username}/${projectSlug}`,
    `Login:    ${email}`,
    `API_KEY:  ${keyWithUrl}`,
  ].join('\n') + '\n', { mode: 0o600 });

  console.log('Seed complete. Credentials written to .seed-output');
}

if (process.argv.includes('--seed')) {
  seedLocalDev().catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
}
