# Integration Tests

End-to-end tests for nstrumenta, running in isolated Docker Compose environments.

## Prerequisites

- Docker (DinD in devcontainer, or native)
- ADC configured (`gcloud auth application-default login`)
- Environment variables from `source credentials/activate.sh`

## Local Dev Seeding

Before running the local stack for the first time, seed a persistent dev user and project:

```shell
# Set required env vars (add to credentials/local.env or export manually)
# NST_DEV_EMAIL, NST_DEV_PASSWORD, NST_DEV_USERNAME, NST_DEV_PROJECT, NSTRUMENTA_API_URL

cd integration-tests && npm run seed
```

This creates the Firebase Auth user, org, project, and a 24-hour API key.
Credentials are written to `integration-tests/.seed-output` (gitignored, mode 0600).

## Running Tests

```shell
source credentials/activate.sh && npm run test:e2e -- --rebuild-frontend
```

The `--rebuild-frontend` flag forces a frontend build before running. Omit it in CI where `frontend/dist` is built fresh as part of the pipeline.

Each test run creates an ephemeral user with randomised credentials via `globalSetup.ts`
and deletes them on teardown — no manual seeding required for CI.

## Architecture

`docker-compose.e2e.yml` defines two services:

- **server** builds from `server/Dockerfile`, mounts `~/.config/gcloud` for ADC
- **playwright** builds from `ci/Dockerfile` (Playwright + Chromium), runs browser tests

ADC is mounted from the host gcloud config directory. No credential files are copied or staged.

## Test Suites

### Playwright Browser Tests (`frontend/tests/`)
- `data-table.spec.ts` - data file listing and upload
- `data-detail.spec.ts` - data file detail view

### CLI Tests (`cli/client/app/`)
Tests nstrumenta CLI commands against a running server. Run in CI via GitHub Actions.
`globalSetup.ts` creates an ephemeral user/project and sets `NSTRUMENTA_API_KEY` for the test run.

### MCP Tests (`frontend/mcp-client.test.js`)
JSON-RPC 2.0 API integration tests. Run in CI via GitHub Actions.
