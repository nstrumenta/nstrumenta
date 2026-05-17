# Frontend

Angular web application for project management, data visualization, and real-time sensor monitoring.

## Code Conventions

- **Signals everywhere**: use `signal()`, `computed()`, `effect()`, and `input()` for all state. No `BehaviorSubject` in components or services — observables only where Angular APIs require them (guards use `CanActivateFn` which must return an observable/promise).
- **Services cache via signals**: services that fetch remote data (e.g. org membership) should store results in a `signal` and fetch once on auth change, not on every subscriber call. This keeps the UI fast and predictable.
- **Auth boundary**: `AuthService` exposes `currentUser`, `authResolved`, and `userStatus` as signals. Observable aliases (`user$`, `authResolved$`) exist only for route guards.

## Development

If you are an agent, use one of these paths:

- Full-stack hot reload: run `./dev.sh` from the repo root. This is the default when you may touch both frontend and server code.
- Frontend only: run `npm run serve` in `frontend/` when you only need the Angular app on `http://localhost:5008`.
- Playwright watch mode: use `frontend-dev` only for E2E iteration.

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

This stack hot-reloads the Angular app for Playwright and depends on a separate `server` container. It is not the primary full-stack `./dev.sh` workflow.

Start the watch stack once with the wrapper script. It handles credential activation for you:

```shell
cd /workspaces/nstrumenta/integration-tests
./frontend-e2e-watch.sh up
```

Then use `frontend-e2e-watch.sh` to run tests. The stack stays running between runs:

```shell
/workspaces/nstrumenta/integration-tests/frontend-e2e-watch.sh tests/record.spec.js
```

`frontend-e2e-watch.sh` starts the watch stack, sets up test credentials, runs Playwright, and prints timing and a report link. The watch stack persists between runs — tear it down with the wrapper when done:

```shell
cd /workspaces/nstrumenta/integration-tests
./frontend-e2e-watch.sh down
```

### Full run (same as CI)

Rebuilds the server image from scratch with the frontend baked in — identical to what runs in GitHub Actions:

```shell
source /workspaces/nstrumenta/credentials/activate.sh
/workspaces/nstrumenta/integration-tests/frontend-e2e.sh
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
