# Nstrumenta MCP Server

The nstrumenta MCP (Model Context Protocol) server exposes nstrumenta functionality to AI assistants and tools that support the MCP protocol.

## Available Tools

### Module Management
- **list_modules** - List all available modules in the current project
  - Optional `filter` parameter to search modules
- **publish_module** - Publish modules defined in project configuration
- **run_module** - Run a module locally
  - Parameters: `name`, `version` (optional), `args` (optional array)

### Data Management
- **list_data** - List all data files in the project

### Agent Management
- **list_agents** - List all currently running agents

### Project Information
- **project_info** - Get information about the current nstrumenta project

## Available Resources

Resources provide read-only contextual data that can be referenced by URI:

- **nstrumenta://modules/list** - JSON list of all available modules
- **nstrumenta://project/config** - Project configuration and metadata

Resources can be accessed by MCP clients for context without executing tools.

## Development

### Running the MCP Server in Development Mode

```bash
# Start MCP server with hot-reload
npm run dev:mcp
```

This uses Node's `--watch` flag to automatically restart the server when source files change.

### Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

Tests use Node's built-in test runner with TypeScript support (`--experimental-strip-types`).

## Connecting MCP Clients

### Claude Desktop

Add to your Claude Desktop configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "nstrumenta": {
      "command": "node",
      "args": [
        "/absolute/path/to/nstrumenta/dist/nodejs/nodejs/mcp.js"
      ],
      "env": {
        "NSTRUMENTA_API_KEY": "your-api-key-here",
        "NSTRUMENTA_API_URL": "https://api.nstrumenta.com"
      }
    }
  }
}
```

**Important**: 
- Use absolute paths to the compiled `mcp.js` file
- Ensure you've run `npm run build:nodejs` to generate the dist files
- Set your nstrumenta API key in the environment

### Cline (VS Code Extension)

Add to Cline's MCP settings in VS Code:

1. Open VS Code settings
2. Search for "Cline: MCP Settings"
3. Add the nstrumenta server configuration:

```json
{
  "mcpServers": {
    "nstrumenta": {
      "command": "node",
      "args": [
        "/absolute/path/to/nstrumenta/dist/nodejs/nodejs/mcp.js"
      ],
      "env": {
        "NSTRUMENTA_API_KEY": "your-api-key-here",
        "NSTRUMENTA_API_URL": "https://api.nstrumenta.com"
      }
    }
  }
}
```

### Other MCP Clients

Any MCP-compatible client can connect using the stdio transport. The server requires:
- Node.js 18+ (Node.js 24+ recommended for optimal TypeScript support)
- Environment variables: `NSTRUMENTA_API_KEY` and optionally `NSTRUMENTA_API_URL`
- The `node` command pointing to the compiled `mcp.js` file

## Environment Variables

- **NSTRUMENTA_API_KEY** (required) - Your nstrumenta API key
- **NSTRUMENTA_API_URL** (optional) - Override the default API URL

## Architecture

The MCP server wraps existing nstrumenta CLI commands, making them available through the MCP protocol. Each tool:
- Uses zod schemas for input validation
- Returns both text content and structured data
- Handles errors gracefully with descriptive messages

The server runs over stdio transport, making it compatible with any MCP client that supports process-based servers.
