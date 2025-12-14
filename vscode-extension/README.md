# nstrumenta-vscode

VS Code extension for [nstrumenta.com](https://nstrumenta.com).

## Features

- **API Key Management**: Store and manage nstrumenta API keys
- **Module Management**: List, run, and publish modules
- **Data Explorer**: Browse sensor data
- **Agent Monitoring**: View connected agents
- **MCP Integration**: AI-assisted development via Model Context Protocol

## Commands

- `Nstrumenta: Set API Key` - Configure your API key
- `Nstrumenta: Clear API Key` - Remove stored key
- `Nstrumenta: Show Status` - Display connection status
- `Nstrumenta: List Modules` - View project modules
- `Nstrumenta: Run Module` - Execute a module
- `Nstrumenta: Publish Modules` - Deploy to cloud
- `Nstrumenta: List Data` - Browse data files
- `Nstrumenta: List Agents` - View active agents

## Setup

1. Start the nstrumenta server (locally or remote)
2. Run `Nstrumenta: Set API Key` with your `keyId:base64(serverUrl)` credential
3. Open a project directory containing `nstrumenta.json`

## Development

Open `vscode-extension/` as workspace root, then press F5 to launch the Extension Development Host.

## Requirements

- VS Code 1.80.0+
- nstrumenta server running
- Valid API key
