// Fetches Firebase web app config for the current GCP project using ADC.
// Outputs shell export statements to stdout so e2e.sh can eval them.
// Usage: eval "$(node get-project-config.js)"

const admin = require('firebase-admin');

const projectId = process.env.GOOGLE_CLOUD_PROJECT;
if (!projectId) {
  console.error('GOOGLE_CLOUD_PROJECT is not set');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  projectId,
});

async function getFirebaseConfig() {
  const { access_token } = await admin.credential.applicationDefault().getAccessToken();
  const headers = {
    'Authorization': `Bearer ${access_token}`,
    'x-goog-user-project': projectId,
  };

  const appsRes = await fetch(
    `https://firebase.googleapis.com/v1beta1/projects/${projectId}/webApps`,
    { headers }
  );
  const { apps } = await appsRes.json();
  if (!apps?.length) throw new Error(`No Firebase web apps found in project ${projectId}`);

  const appId = apps[0].appId;

  const configRes = await fetch(
    `https://firebase.googleapis.com/v1beta1/projects/${projectId}/webApps/${appId}/config`,
    { headers }
  );
  const config = await configRes.json();
  if (!config.apiKey) throw new Error(`No apiKey in Firebase web app config for ${projectId}`);

  // CodeQL: Output data using process.stdout.write instead of console.log to avoid logging sensitive variables.
  process.stdout.write(`export FIREBASE_API_KEY=${config.apiKey}\n`);
  process.stdout.write(`export FIREBASE_APP_ID=${config.appId}\n`);
}

getFirebaseConfig().catch(e => {
  console.error('Failed to get Firebase config:', e.message);
  process.exit(1);
});
