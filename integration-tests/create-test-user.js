const admin = require('firebase-admin');
const crypto = require('crypto');

// Creates or resets an ephemeral test user for Playwright e2e tests.
// Outputs JSON with email and password to stdout.
// Uses ADC — no secrets needed.
//
// Usage: node create-test-user.js [email]

const email = process.argv[2] || 'ci-playwright@nstrumenta.test';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: process.env.GOOGLE_CLOUD_PROJECT,
  });
}

const auth = admin.auth();

async function createTestUser() {
  const password = crypto.randomBytes(24).toString('base64url');

  try {
    const existing = await auth.getUserByEmail(email);
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
      console.error(`Created test user ${email} (uid: ${created.uid})`);
    } else {
      throw error;
    }
  }

  // Output credentials as JSON to stdout (stderr used for logs above)
  console.log(JSON.stringify({ email, password }));
}

createTestUser().catch((error) => {
  console.error('Failed to create test user:', error);
  process.exit(1);
});
