// One-off script to backfill slug/orgSlug/name on legacy user project docs.
// Reads /users/{uid}/projects, finds docs missing slug or orgSlug,
// fetches the main /projects/{id} doc for the authoritative data, and patches.
//
// Usage: node scripts/fix-legacy-project-slugs.mjs [uid]
//   If uid is omitted, patches all users.

import admin from '../integration-tests/node_modules/firebase-admin/lib/index.js';

const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT || 'nst-ci-nst-048bb3e0';
const TARGET_UID = process.argv[2] || null;

admin.initializeApp({ credential: admin.credential.applicationDefault(), projectId: PROJECT_ID });
const db = admin.firestore();

async function fixUser(uid) {
  const projectsSnap = await db.collection(`users/${uid}/projects`).get();
  if (projectsSnap.empty) return;

  for (const projDoc of projectsSnap.docs) {
    const data = projDoc.data();
    const isLegacy = !data.slug || !data.orgSlug || data.orgSlug === 'projects';
    if (!isLegacy) {
      console.log(`  [${projDoc.id}] already routable (${data.orgSlug}/${data.slug}), skipping`);
      continue;
    }

    const mainDoc = await db.doc(`projects/${projDoc.id}`).get();
    if (!mainDoc.exists) {
      console.log(`  [${projDoc.id}] no main project doc — cannot fix`);
      continue;
    }

    const main = mainDoc.data();
    if (!main.slug || !main.orgSlug) {
      console.log(`  [${projDoc.id}] main doc also missing slug/orgSlug — cannot fix (name: ${main.name})`);
      continue;
    }

    const patch = {};
    if (!data.slug)    patch.slug    = main.slug;
    if (!data.orgSlug || data.orgSlug === 'projects') patch.orgSlug = main.orgSlug;
    if (!data.name)    patch.name    = main.name;

    await projDoc.ref.update(patch);
    console.log(`  [${projDoc.id}] patched -> ${patch.orgSlug || data.orgSlug}/${patch.slug || data.slug} (${patch.name || data.name})`);
  }
}

async function main() {
  if (TARGET_UID) {
    console.log(`Fixing user: ${TARGET_UID}`);
    await fixUser(TARGET_UID);
  } else {
    const usersSnap = await db.collection('users').get();
    for (const userDoc of usersSnap.docs) {
      console.log(`\nUser: ${userDoc.id}`);
      await fixUser(userDoc.id);
    }
  }
  console.log('\nDone.');
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
