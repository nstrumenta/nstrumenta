# Integration Tests

End-to-end tests for CLI and MCP integration, running directly against a server URL.

## Running Tests

```shell
# Run all tests (defaults to http://localhost:5999)
./e2e.sh

# Run specific test suite
./e2e.sh cli
./e2e.sh frontend

# Run against a remote server
API_URL=https://your-server.run.app ./e2e.sh
```

Or from the repo root:

```shell
npm run test:e2e
npm run test:e2e:cli
npm run test:e2e:frontend
```

## Test Suites

### CLI Tests (`cli/client/app/`)
Tests the nstrumenta CLI commands (module publish, module host, data operations) against a running server.

### Frontend/MCP Tests (`frontend/`)
- **MCP client tests**: JSON-RPC 2.0 API integration with API key authentication

See [frontend/README.md](frontend/README.md) for details.

## Prerequisites

- Node.js >= 18
- A running nstrumenta server (local via docker compose, or Cloud Run)
- `NSTRUMENTA_API_KEY` set, or ADC configured so e2e.sh can generate one

## How It Works

`e2e.sh` generates a temporary API key (via ADC + Firestore), runs the test suites against the server URL, then cleans up. No Docker Compose or container orchestration is needed for the tests themselves.
