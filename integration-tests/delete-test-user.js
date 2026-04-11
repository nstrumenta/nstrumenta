const admin = require('firebase-admin');

// Deletes an ephemeral test user created by create-test-user.js.
// Usage: node delete-test-user.js <uid>

const uid = process.argv[2];
if (!uid) {
  console.error('Usage: node delete-test-user.js <uid>');
  process.exit(1);
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: process.env.GOOGLE_CLOUD_PROJECT,
  });
}

const auth = admin.auth();
const db = admin.firestore();

async function deleteTestUser() {
  const userDoc = await db.collection('users').doc(uid).get();
  const userData = userDoc.data() || {};
  const username = userData.username;
  const orgId = userData.personalOrgId;

  const batch = db.batch();

  if (username) {
    batch.delete(db.doc(`slugs/${username}`));
  }
  if (orgId) {
    batch.delete(db.doc(`organizations/${orgId}/members/${uid}`));
    batch.delete(db.doc(`organizations/${orgId}`));
    batch.delete(db.doc(`users/${uid}/organizations/${orgId}`));
  }
  batch.delete(db.doc(`users/${uid}`));

  await batch.commit();
  await auth.deleteUser(uid);
  console.error(`Deleted test user ${uid}` + (username ? ` (${username})` : ''));
}

deleteTestUser().catch((error) => {
  console.error('Failed to delete test user:', error);
  process.exit(1);
});
