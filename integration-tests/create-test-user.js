const admin = require('firebase-admin');
const crypto = require('crypto');

// Creates or resets an ephemeral test user for Playwright e2e tests.
// Outputs JSON with email and password to stdout.
// Uses ADC — no secrets needed.
//
// Usage: node create-test-user.js [email]

const email = process.argv[2] || 'ci-playwright@nstrumenta.test';
const TEST_USERNAME = 'ci-playwright';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: process.env.GOOGLE_CLOUD_PROJECT,
  });
}

const auth = admin.auth();
const db = admin.firestore();

async function ensureUsernameSetup(uid) {
  const userDoc = await db.collection('users').doc(uid).get();
  const userData = userDoc.data() || {};

  if (userData.username && userData.personalOrgId) {
    return; // already set up
  }

  // Check if slug is already claimed by this user or unclaimed
  const slugRef = db.doc(`slugs/${TEST_USERNAME}`);
  const slugDoc = await slugRef.get();
  if (slugDoc.exists && slugDoc.data().id !== uid) {
    // Claimed by someone else — nothing we can do
    console.error(`Slug '${TEST_USERNAME}' already claimed by another user`);
    return;
  }

  const orgId = userData.personalOrgId || db.collection('organizations').doc().id;
  const timestamp = Date.now();

  await db.runTransaction(async (tx) => {
    tx.set(slugRef, { type: 'user', id: uid });
    tx.set(db.doc(`organizations/${orgId}`), {
      name: TEST_USERNAME,
      slug: TEST_USERNAME,
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
      username: TEST_USERNAME,
      personalOrgId: orgId,
    }, { merge: true });
    // Add user to their own org subcollection for listUserOrgs
    tx.set(db.doc(`users/${uid}/organizations/${orgId}`), {
      name: TEST_USERNAME,
      slug: TEST_USERNAME,
      role: 'owner',
    });
  });

  console.error(`Set up username '${TEST_USERNAME}' and personal org for uid ${uid}`);
}

async function createTestUser() {
  const password = crypto.randomBytes(24).toString('base64url');
  let uid = null;

  try {
    const existing = await auth.getUserByEmail(email);
    uid = existing.uid;
    await auth.updateUser(existing.uid, { password });
    console.error(`Reset password for existing test user ${email} (uid: ${existing.uid})`);
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      const created = await auth.createUser({
        email,
        password,
        emailVerified: true,
        displayName: 'CI Playwright',
      });
      uid = created.uid;
      console.error(`Created test user ${email} (uid: ${created.uid})`);
    } else {
      throw error;
    }
  }

  // Ensure test user bypasses waitlist
  if (uid) {
    await db.collection('users').doc(uid).set({
      status: 'approved',
      email: email,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
    console.error(`Set status to 'approved' in Firestore for uid ${uid}`);

    await ensureUsernameSetup(uid);
  }

  // Output credentials as JSON to stdout (stderr used for logs above)
  const result = { email, password };
  process.stdout.write(JSON.stringify(result) + '\n');
}

createTestUser().catch((error) => {
  console.error('Failed to create test user:', error);
  process.exit(1);
});
