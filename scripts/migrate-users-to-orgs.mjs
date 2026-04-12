// Migration: backfill org structure for users who have `username` set
// but are missing the corresponding organization, member doc, or org projects.
//
// For each user with a `username`:
//   1. Ensure `organizations/${username}` exists (personal org)
//   2. Ensure `organizations/${username}/members/${uid}` exists (owner member doc)
//   3. Ensure `slugs/${username}` exists pointing to the user
//   4. Ensure `users/${uid}/organizations/${username}` exists (reverse index)
//   5. For each `users/${uid}/projects` doc with orgSlug == username,
//      ensure the canonical `organizations/${username}/projects/${slug}` doc exists
//
// Usage:
//   node scripts/migrate-users-to-orgs.mjs [--dry-run] [uid]
//
//   --dry-run   Print what would change without writing anything
//   uid         Optionally scope to a single user

import admin from '../integration-tests/node_modules/firebase-admin/lib/index.js';

const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT;
if (!PROJECT_ID) {
  console.error('GOOGLE_CLOUD_PROJECT must be set');
  process.exit(1);
}

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const TARGET_UID = args.find((a) => !a.startsWith('--')) ?? null;

admin.initializeApp({ credential: admin.credential.applicationDefault(), projectId: PROJECT_ID });
const db = admin.firestore();

const INITIAL_CREDIT_CENTS = 2500;

const EPHEMERAL_CI_PATTERNS = [/^ci-playwright/, /^ci-pw-/, /^ci-cli-/];

function isEphemeralCIUser(username) {
  return EPHEMERAL_CI_PATTERNS.some((p) => p.test(username));
}

async function deleteEphemeralUser(uid, username) {
  console.log(`  [${uid}] ${username} — deleting (ephemeral CI user)`);
  if (DRY_RUN) return;
  await db.recursiveDelete(db.doc(`organizations/${username}`));
  await db.recursiveDelete(db.doc(`users/${uid}`));
  await db.doc(`slugs/${username}`).delete();
  try {
    await admin.auth().deleteUser(uid);
  } catch (e) {
    if (e.code !== 'auth/user-not-found') throw e;
  }
}

async function migrateUser(uid) {
  const userSnap = await db.doc(`users/${uid}`).get();
  if (!userSnap.exists) {
    console.log(`  [${uid}] no user doc — skipping`);
    return;
  }

  const userData = userSnap.data();
  const username = userData.username;
  if (!username) {
    console.log(`  [${uid}] no username set — skipping (status: ${userData.status ?? 'unknown'})`);
    return;
  }

  if (isEphemeralCIUser(username)) {
    await deleteEphemeralUser(uid, username);
    return;
  }

  const now = Date.now();
  const writes = [];

  // 1. Organization doc
  const orgSnap = await db.doc(`organizations/${username}`).get();
  if (!orgSnap.exists) {
    writes.push({ path: `organizations/${username}`, op: 'set', data: {
      name: username,
      slug: username,
      type: 'personal',
      createdAt: now,
      createdBy: uid,
    }});
  }

  // 2. Member doc
  const memberSnap = await db.doc(`organizations/${username}/members/${uid}`).get();
  if (!memberSnap.exists) {
    writes.push({ path: `organizations/${username}/members/${uid}`, op: 'set', data: {
      role: 'owner',
      addedAt: now,
      addedBy: uid,
    }});
  }

  // 3. Billing doc (only if org was also missing — new orgs need billing initialized)
  if (!orgSnap.exists) {
    const billingSnap = await db.doc(`organizations/${username}/billing/current`).get();
    if (!billingSnap.exists) {
      writes.push({ path: `organizations/${username}/billing/current`, op: 'set', data: {
        plan: 'free_trial',
        creditBalanceCents: INITIAL_CREDIT_CENTS,
        paymentMethodAttached: false,
        createdAt: now,
        updatedAt: now,
      }});
    }
  }

  // 4. Slug claim
  const slugSnap = await db.doc(`slugs/${username}`).get();
  if (!slugSnap.exists) {
    writes.push({ path: `slugs/${username}`, op: 'set', data: { type: 'user', id: uid }});
  } else if (slugSnap.data().id !== uid) {
    console.log(`  [${uid}] slug ${username} claimed by different uid ${slugSnap.data().id} — skipping slug`);
  }

  // 5. Reverse org index on user
  const userOrgSnap = await db.doc(`users/${uid}/organizations/${username}`).get();
  if (!userOrgSnap.exists) {
    writes.push({ path: `users/${uid}/organizations/${username}`, op: 'set', data: {
      name: username,
      slug: username,
      role: 'owner',
    }});
  }

  // 6. Canonical org project docs from users/${uid}/projects
  const userProjectsSnap = await db.collection(`users/${uid}/projects`).get();
  for (const projDoc of userProjectsSnap.docs) {
    const p = projDoc.data();
    const orgSlug = p.orgSlug;
    const projectSlug = p.slug;

    if (!orgSlug || !projectSlug) {
      console.log(`    [project ${projDoc.id}] no orgSlug/slug — deleting stale users/${uid}/projects doc`);
      if (!DRY_RUN) await projDoc.ref.delete();
      continue;
    }

    const canonicalPath = `organizations/${orgSlug}/projects/${projectSlug}`;
    const canonicalSnap = await db.doc(canonicalPath).get();
    if (!canonicalSnap.exists) {
      const mainSnap = await db.doc(`projects/${projDoc.id}`).get();
      const mainData = mainSnap.exists ? mainSnap.data() : {};
      writes.push({ path: canonicalPath, op: 'set', data: {
        name: p.name ?? mainData.name ?? projectSlug,
        slug: projectSlug,
        orgSlug,
        orgId: orgSlug,
        members: { [uid]: 'owner' },
        createdAt: p.createdAt ?? mainData.createdAt ?? now,
        createdBy: uid,
        visibility: mainData.visibility ?? 'private',
      }});
    }
  }

  if (writes.length === 0) {
    console.log(`  [${uid}] ${username} — already complete`);
    return;
  }

  console.log(`  [${uid}] ${username} — ${writes.length} write(s):`);
  for (const w of writes) {
    console.log(`    ${w.op} ${w.path}`);
  }

  if (!DRY_RUN) {
    const batch = db.batch();
    for (const w of writes) {
      const ref = db.doc(w.path);
      if (w.op === 'set') batch.set(ref, w.data);
    }
    await batch.commit();
  }
}

async function main() {
  if (DRY_RUN) console.log('DRY RUN — no writes will be made\n');

  if (TARGET_UID) {
    console.log(`Migrating user: ${TARGET_UID}`);
    await migrateUser(TARGET_UID);
  } else {
    const usersSnap = await db.collection('users').get();
    console.log(`Found ${usersSnap.size} users\n`);
    for (const userDoc of usersSnap.docs) {
      await migrateUser(userDoc.id);
    }
  }

  console.log('\nDone.');
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
