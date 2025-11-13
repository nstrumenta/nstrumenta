# nstrumenta-vscode

Visual Studio Code extension for [nstrumenta.com](https://nstrumenta.com)

## Features

- **API Key Management**: Securely store and manage your nstrumenta API keys
- **Module Management**: List, run, and publish modules directly from VS Code
- **Data Explorer**: Browse and manage your sensor data
- **Agent Monitoring**: View and manage connected agents
- **MCP Integration**: Connect to nstrumenta's Model Context Protocol server for AI-assisted development

## Commands

- `Nstrumenta: Set API Key` - Configure your nstrumenta API key
- `Nstrumenta: Clear API Key` - Remove stored API key
- `Nstrumenta: Show Status` - Display connection status
- `Nstrumenta: List Modules` - View all modules in your project
- `Nstrumenta: Run Module` - Execute a module
- `Nstrumenta: Publish Modules` - Deploy modules to the cloud
- `Nstrumenta: List Data` - Browse sensor data
- `Nstrumenta: List Agents` - View connected agents

## Configuration

The extension connects to your local nstrumenta server by default. You can configure the MCP server URL in settings:

```json
{
  "nstrumenta.mcpServer.url": "http://localhost:5999"
}
```

## Requirements

- VS Code 1.80.0 or higher
- nstrumenta server running locally or accessible remotely
- Valid nstrumenta API key

## Getting Started

1. Install the extension
2. Open a workspace
3. Run `Nstrumenta: Set API Key` to configure your credentials
4. Start exploring your nstrumenta projects!

## More Information

- [Documentation](https://nstrumenta.com/docs)
- [GitHub Repository](https://github.com/nstrumenta/nstrumenta)
- [Website](https://nstrumenta.com)
