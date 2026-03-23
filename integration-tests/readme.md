# Integration Tests

End-to-end tests for nstrumenta, running in isolated Docker Compose environments.

## Prerequisites

- Docker (DinD in devcontainer, or native)
- ADC configured (`gcloud auth application-default login`)
- Environment variables from `source credentials/activate.sh`

## Running Tests

```shell
# From repo root
npm run test:e2e

# Or directly
cd integration-tests && ./e2e.sh playwright
```

This will:
1. Check for ADC credentials at the well-known gcloud path
2. Build server and frontend artifacts if missing
3. Create an ephemeral test user via Firebase Admin
4. Start server + Playwright containers via Docker Compose
5. Run Playwright browser tests against the server

## Architecture

`docker-compose.e2e.yml` defines two services:

- **server** builds from `server/Dockerfile`, mounts `~/.config/gcloud` for ADC
- **playwright** builds from `ci/Dockerfile` (Playwright + Chromium), runs browser tests

ADC is mounted from the host gcloud config directory. No credential files are copied or staged.

## Test Suites

### Playwright Browser Tests (`frontend/tests/`)
- `auth.spec.js` - sign-in flow
- `projects.spec.js` - project CRUD
- `upload.spec.js` - file upload

### CLI Tests (`cli/client/app/`)
Tests nstrumenta CLI commands against a running server. Run in CI via GitHub Actions.

### MCP Tests (`frontend/mcp-client.test.js`)
JSON-RPC 2.0 API integration tests. Run in CI via GitHub Actions.
