const admin = require('firebase-admin');
const crypto = require('crypto');

// Creates a unique ephemeral test user for each e2e run.
// A random suffix avoids Firebase Auth per-account rate limits that occur
// when the same email is hammered with password resets across CI runs.
// Outputs JSON with email, password, and uid to stdout.
// Uses ADC — no secrets needed.
//
// Usage:
//   node create-test-user.js           # regular approved user
//   node create-test-user.js --admin   # approved user with role=admin

const isAdmin = process.argv.includes('--admin');
const suffix = crypto.randomBytes(4).toString('hex');
const prefix = isAdmin ? 'ci-pw-admin' : 'ci-pw';
const email = `${prefix}-${suffix}@nstrumenta.test`;
const username = `${prefix}-${suffix}`;

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: process.env.GOOGLE_CLOUD_PROJECT,
  });
}

const auth = admin.auth();
const db = admin.firestore();

async function setupUsernameAndOrg(uid) {
  const slugRef = db.doc(`slugs/${username}`);
  const orgId = db.collection('organizations').doc().id;
  const timestamp = Date.now();

  await db.runTransaction(async (tx) => {
    tx.set(slugRef, { type: 'user', id: uid });
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
    tx.set(db.doc(`users/${uid}`), {
      username,
      personalOrgId: orgId,
      status: 'approved',
      email,
      ...(isAdmin ? { role: 'admin' } : {}),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
    tx.set(db.doc(`users/${uid}/organizations/${orgId}`), {
      name: username,
      slug: username,
      role: 'owner',
    });
  });

  console.error(`Set up username '${username}' and personal org for uid ${uid}`);
}

async function createTestUser() {
  const password = crypto.randomBytes(24).toString('base64url');

  const created = await auth.createUser({
    email,
    password,
    emailVerified: true,
    displayName: isAdmin ? 'CI Playwright Admin' : 'CI Playwright',
  });
  const uid = created.uid;
  console.error(`Created test user ${email} (uid: ${uid})`);

  await setupUsernameAndOrg(uid);

  process.stdout.write(JSON.stringify({ email, password, uid }) + '\n');
}

createTestUser().catch((error) => {
  console.error('Failed to create test user:', error);
  process.exit(1);
});
