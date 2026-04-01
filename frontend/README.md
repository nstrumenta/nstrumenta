# Frontend

Angular web application for project management, data visualization, and real-time sensor monitoring.

## Development

```shell
npm install
npm run serve
```

Open http://localhost:5008. Add `localhost` to Firebase authorized domains.

## Unit Tests

```shell
npm test
```

Runs Karma/Jasmine unit tests in a headless Chrome browser.

## E2E Tests (Playwright)

E2E tests live in `integration-tests/frontend/tests/` and run against a full server stack in Docker.

### Fast iteration (watch mode — recommended for frontend work)

Start the watch stack once (`pw.sh` handles credentials automatically after this):

```shell
cd /workspaces/nstrumenta/integration-tests
docker compose -f docker-compose.e2e.yml -f docker-compose.e2e.watch.yml up -d server frontend-dev
```

Then use `pw.sh` to run tests. The stack stays running between runs:

```shell
/workspaces/nstrumenta/integration-tests/pw.sh tests/record.spec.js
```

`pw.sh` builds the frontend, sets up test credentials, runs Playwright, and prints timing and a report link. The server container persists between runs — tear it down manually when done:

```shell
cd /workspaces/nstrumenta/integration-tests
docker compose -f docker-compose.e2e.yml -f docker-compose.e2e.watch.yml down
```

### Full run (same as CI)

Rebuilds the server image from scratch with the frontend baked in — identical to what runs in GitHub Actions:

```shell
source /workspaces/nstrumenta/credentials/activate.sh
/workspaces/nstrumenta/integration-tests/e2e.sh
```

### View the Playwright HTML report

```shell
open integration-tests/frontend/playwright-report/index.html
```

## Deploy

The frontend is deployed to Firebase Hosting via GitHub Actions on pushes to `main` (CI environment) and version tags (`v*`) (production). Terraform manages the Firebase Hosting site and custom domain configuration.

Manual deploy (if needed):

```shell
npm run build
export FIREBASE_PROJECT_ID=<your-project-id>
node makeFirebaseDeployConfig.js
npx firebase use $FIREBASE_PROJECT_ID
npx firebase deploy --only hosting
```

## Firebase Authentication

Update Firebase authorized domains in the Firebase Console:
- Navigate to Authentication > Settings > Authorized domains
- Add your custom domain (e.g. `nstrumenta.com`)

## CORS

CORS on the default appspot bucket is managed by Terraform. No manual steps required.
