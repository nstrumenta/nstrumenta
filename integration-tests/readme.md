# Integration Tests

End-to-end tests for CLI, agents, frontend, and web features using Docker Compose.

## Running Tests

```shell
# Run all tests with local credentials
ENVFILE=../credentials/local.env ./e2e.sh

# Run specific test suite
ENVFILE=../credentials/local.env ./e2e.sh cli
ENVFILE=../credentials/local.env ./e2e.sh frontend

# Run multiple test suites
ENVFILE=../credentials/local.env ./e2e.sh cli frontend
```

## Test Suites

### CLI Tests (`cli/`)
Tests the nstrumenta CLI commands against a running server instance.

### Frontend Tests (`frontend/`)
Tests the frontend application end-to-end:
- **MCP client tests**: JSON-RPC 2.0 API integration with API key authentication
- **Playwright UI tests**: Full browser testing with Firebase authentication
  - User sign-in flow
  - Project creation and management
  - UI navigation

See [frontend/README.md](frontend/README.md) for details.

## Requirements

- Docker and Docker Compose
- Node.js (for test utilities)
- Valid Firebase credentials in `../credentials/local.env`
- Test user credentials for frontend tests

Tests are written with Vitest. Each subfolder contains a `docker-compose.yml` that spins up the necessary services.
