# nstrumenta-vscode

Visual Studio Code extension for [nstrumenta.com](https://nstrumenta.com)

## Features

- **API Key Management**: Securely store and manage your nstrumenta API keys
- **Module Management**: List, run, and publish modules directly from VS Code
- **Data Explorer**: Browse and manage your sensor data
- **Agent Monitoring**: View and manage connected agents
- **MCP Integration**: Connect to nstrumenta's Model Context Protocol server for AI-assisted development

## Commands

- \`Nstrumenta: Set API Key\` - Configure your nstrumenta API key
- \`Nstrumenta: Clear API Key\` - Remove stored API key
- \`Nstrumenta: Show Status\` - Display connection status
- \`Nstrumenta: List Modules\` - View all modules in your project
- \`Nstrumenta: Run Module\` - Execute a module
- \`Nstrumenta: Publish Modules\` - Deploy modules to the cloud
- \`Nstrumenta: List Data\` - Browse sensor data
- \`Nstrumenta: List Agents\` - View connected agents

## Development & Testing

### Architecture

The extension connects to the nstrumenta server's MCP endpoint:
- **Server**: \`cluster/server/app\` (runs on port 5999)
- **MCP Endpoint**: \`POST http://localhost:5999/mcp\`
- **Extension**: \`src/vscode-extension/\` (this directory)

### Setup for Development

#### 1. Start the nstrumenta server

From the repository root:

\`\`\`bash
cd cluster
docker compose up server
\`\`\`

Or run the server directly:

\`\`\`bash
cd cluster/server/app
npm run dev
\`\`\`

The server will start on port 5999 with the MCP endpoint at \`/mcp\`.

#### 2. Build and run the extension

**Option A: Debug mode (recommended)**

1. Open the \`nstrumenta\` repository in VSCode
2. Navigate to \`src/vscode-extension/\` in the file tree
3. Press \`F5\` or Run > Start Debugging
4. A new "Extension Development Host" VSCode window will open
5. In that window, open your nstrumenta project directory

**Option B: Watch mode for continuous development**

\`\`\`bash
cd src/vscode-extension
npm run watch
\`\`\`

Then press F5 to launch the Extension Development Host.

**Option C: Install as local extension**

\`\`\`bash
cd src/vscode-extension
npm install -g @vscode/vsce
vsce package
code --install-extension nstrumenta-vscode-2.0.0.vsix
\`\`\`

#### 3. Configure API Key

The extension requires a properly formatted API key that includes the server URL.

**Format**: `<uuid>:<base64-encoded-server-url>`

Example for local development (server on port 5999):
```bash
TEST_UUID="00000000-0000-0000-0000-000000000001"
SERVER_URL="http://localhost:5999"
ENCODED_URL=$(echo -n "$SERVER_URL" | base64)
API_KEY="${TEST_UUID}:${ENCODED_URL}"
echo $API_KEY
```

Result: `00000000-0000-0000-0000-000000000001:aHR0cDovL2xvY2FsaG9zdDo1OTk5`

Set the API key in VSCode:
1. Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows/Linux)
2. Run: `Nstrumenta: Set API Key`
3. Paste your API key (must include both UUID and base64-encoded server URL)

### Testing Checklist

#### Extension Activation
- [ ] Extension activates on VSCode startup
- [ ] Status bar item appears (key icon when not configured)
- [ ] No errors in Output > Extension Host

#### API Key Management
- [ ] Set API Key command works
- [ ] Status bar shows checkmark when connected
- [ ] Show Status displays connection info
- [ ] Clear API Key command works

#### Commands (in nstrumenta project)
- [ ] List Modules - displays project modules
- [ ] Run Module - prompts for module name and executes
- [ ] Publish Modules - publishes to cloud storage
- [ ] List Data - shows data files
- [ ] List Agents - shows active agents

### Debugging

#### Server logs
\`\`\`bash
# Check server is running
curl http://localhost:5999/

# Test MCP endpoint
curl -X POST http://localhost:5999/mcp \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: <your-api-key>" \\
  -d '{"jsonrpc":"2.0","method":"tools/list","id":1}'
\`\`\`

#### Extension logs
1. In Extension Development Host window
2. View > Output
3. Select "Extension Host" from dropdown
4. Look for "nstrumenta extension activated"

#### Set breakpoints
1. Open \`src/vscode-extension/src/extension.ts\` or \`mcpClient.ts\`
2. Set breakpoints
3. Press F5 to start debugging
4. Run extension commands to hit breakpoints

### Common Issues

**"Please set API key first"** or **"Server URL is required"**
- API key not set or missing server URL in format
- Run `Nstrumenta: Show Status` to check configuration
- Verify format: `uuid:base64url` (both parts required)

**Connection errors**
- Check server is running at the URL encoded in your API key
- Verify API key format includes both UUID and base64-encoded server URL
- Check Extension Host output for detailed error messages

**"Failed to list modules"**
- Must be in a nstrumenta project directory
- Check \`nstrumenta.json\` exists
- Verify \`NSTRUMENTA_API_KEY\` is set on server

**Extension doesn't activate**
- Check for TypeScript errors
- Rebuild: \`npm run compile\`
- Check Extension Host output

### File Structure

\`\`\`
src/vscode-extension/
 src/
   ├── extension.ts      # Main extension entry point
   └── mcpClient.ts      # MCP protocol client
 package.json          # Extension manifest
 tsconfig.json         # TypeScript config
 .vscode/
   ├── launch.json       # Debug configurations
   └── tasks.json        # Build tasks
 README.md            # This file
\`\`\`

## Configuration

The extension requires an API key in the format `uuid:base64(server-url)`. The server URL is extracted from the API key - no fallback or hardcoded URLs are used. If the API key is invalid or missing the server URL, commands will fail with an error.

## Requirements

- VS Code 1.80.0 or higher
- nstrumenta server running (locally on port 5999 or remote)
- Valid nstrumenta API key

## Getting Started

1. Install the extension
2. Start the nstrumenta server
3. Run \`Nstrumenta: Set API Key\` to configure your credentials
4. Open a nstrumenta project directory
5. Start using the commands!

## More Information

- [Documentation](https://nstrumenta.com/docs)
- [GitHub Repository](https://github.com/nstrumenta/nstrumenta)
- [Website](https://nstrumenta.com)
