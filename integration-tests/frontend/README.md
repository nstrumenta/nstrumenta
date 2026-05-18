# Frontend E2E Tests

## Playwright Browser Tests (`tests/`)

Browser-based tests running against the nstrumenta server via Docker Compose.

- `auth.spec.js` - sign-in flow
- `projects.spec.js` - project CRUD
- `upload.spec.js` - file upload

## MCP Integration Tests (`mcp-client.test.js`)

JSON-RPC 2.0 API tests for the MCP endpoint.

## Running

```bash
# Full CI-like run from integration-tests/
cd /workspaces/nstrumenta/integration-tests
source ../credentials/activate.sh
./frontend-e2e.sh

# Watch mode for fast frontend iteration
./frontend-e2e-watch.sh up
./frontend-e2e-watch.sh tests/auth.spec.js
./frontend-e2e-watch.sh down

# MCP tests standalone (requires running server + NSTRUMENTA_API_KEY)
cd /workspaces/nstrumenta/integration-tests/frontend
npm install
npx vitest run mcp-client.test.js
```

Run `frontend-e2e.sh` from `/workspaces/nstrumenta/integration-tests` after `source ../credentials/activate.sh`.

`frontend-e2e-watch.sh` loads credentials internally for both `up` and test execution.

## Environment Variables

- `FRONTEND_URL` - Server URL for Playwright (default: http://localhost:5999)
- `TEST_USER_EMAIL` - Test user email (created by frontend-e2e.sh)
- `TEST_USER_PASSWORD` - Test user password (created by frontend-e2e.sh)
- `NSTRUMENTA_API_KEY` - API key for MCP tests
