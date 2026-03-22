# Frontend E2E Tests

MCP integration tests for the nstrumenta server.

## Tests

### MCP Client Tests (`mcp-client.test.js`)
Tests the MCP JSON-RPC 2.0 integration:
- Listing modules via `list_modules` tool
- Listing agents via `list_agents` tool
- Listing data via `list_data` tool
- Getting project info via `get_project` tool
- Authentication error handling

## Running Tests

```bash
# From integration-tests/frontend directory
npm install
npx vitest run mcp-client.test.js
```

Or via the e2e runner:

```bash
# From integration-tests directory
./e2e.sh frontend
```

## Environment Variables

- `NSTRUMENTA_API_KEY` - API key for MCP authentication
- `API_URL` - Server URL (default: http://localhost:5999)
