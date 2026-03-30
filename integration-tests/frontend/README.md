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
# From repo root (runs via Docker Compose)
npm run test:e2e

# MCP tests standalone (requires running server + NSTRUMENTA_API_KEY)
cd integration-tests/frontend
npm install
npx vitest run mcp-client.test.js
```

## Environment Variables

- `FRONTEND_URL` - Server URL for Playwright (default: http://localhost:5999)
- `TEST_USER_EMAIL` - Test user email (created by e2e.sh)
- `TEST_USER_PASSWORD` - Test user password (created by e2e.sh)
- `NSTRUMENTA_API_KEY` - API key for MCP tests
