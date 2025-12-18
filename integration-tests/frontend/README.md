# Frontend E2E Tests

End-to-end tests for the nstrumenta frontend application against the MCP server.

## Tests

### MCP Client Tests (`mcp-client.test.js`)
Tests the MCP JSON-RPC 2.0 integration that the frontend uses:
- Listing modules via `list_modules` tool
- Listing agents via `list_agents` tool
- Listing data via `list_data` tool
- Getting project info via `get_project` tool
- Authentication error handling

### Playwright UI Tests (`tests/*.spec.js`)
Full browser-based tests using Playwright:
- **auth.spec.js**: User authentication flow with Firebase
- **projects.spec.js**: Project creation and management UI

## Running Tests

### Local Development
```bash
# From integration-tests/frontend directory
npm install
npm test
```

### With Docker Compose
```bash
# From integration-tests directory
ENVFILE=../credentials/local.env docker-compose -f frontend/docker-compose.yml up --abort-on-container-exit
```

### Full Integration Test Suite
```bash
# From integration-tests directory
ENVFILE=../credentials/local.env ./e2e.sh frontend
```

## Environment Variables

Required for tests:
- `NSTRUMENTA_API_KEY` - API key for MCP authentication
- `TEST_USER_EMAIL` - Test user email for Playwright tests  
- `TEST_USER_PASSWORD` - Test user password for Playwright tests
- `API_URL` - Server URL (default: http://localhost:5999)
- `FRONTEND_URL` - Frontend URL (default: http://localhost:4200)
- `GCLOUD_SERVICE_KEY` - Service account key (loaded from ENVFILE)
- `NSTRUMENTA_API_KEY_PEPPER` - API key pepper (loaded from ENVFILE)
