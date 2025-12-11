import * as vscode from 'vscode';
import { MCPClient } from './mcpClient';

let mcpClient: MCPClient | null = null;
let statusBarItem: vscode.StatusBarItem;

export async function activate(context: vscode.ExtensionContext) {
  console.log('nstrumenta extension activated');

  // Create status bar item
  statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    100
  );
  statusBarItem.command = 'nstrumenta.setApiKey';
  context.subscriptions.push(statusBarItem);

  // Try to restore API key and initialize
  await initializeClient(context);

  const commands = [
    vscode.commands.registerCommand('nstrumenta.setApiKey', async () => {
      const apiKey = await vscode.window.showInputBox({
        prompt: 'Enter your Nstrumenta API key',
        password: true,
        placeHolder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx:base64encodedurl'
      });

      if (apiKey) {
        await context.secrets.store('nstrumenta.apiKey', apiKey);
        await initializeClient(context);
        vscode.window.showInformationMessage('API key saved successfully');
      }
    }),

    vscode.commands.registerCommand('nstrumenta.clearApiKey', async () => {
      await context.secrets.delete('nstrumenta.apiKey');
      mcpClient = null;
      updateStatusBar(false);
      vscode.window.showInformationMessage('API key cleared');
    }),

    vscode.commands.registerCommand('nstrumenta.status', async () => {
      const apiKey = await context.secrets.get('nstrumenta.apiKey');
      const hasApiKey = !!apiKey;
      const serverUrl = apiKey ? extractServerUrl(apiKey) : 'Not configured';
      
      const info = [
        `API Key: ${hasApiKey ? 'Set ✓' : 'Not set ✗'}`,
        `MCP Server: ${serverUrl}`,
        `Status: ${mcpClient ? 'Connected ✓' : 'Not connected ✗'}`,
      ].join('\n');
      
      vscode.window.showInformationMessage(info, { modal: true });
    }),

    vscode.commands.registerCommand('nstrumenta.module.list', async () => {
      if (!mcpClient) {
        vscode.window.showWarningMessage('Please set API key first');
        return;
      }

      try {
        const result = await mcpClient.listModules();
        
        if (!result.modules || result.modules.length === 0) {
          vscode.window.showInformationMessage('No modules found');
          return;
        }

        const items = result.modules.map(m => `${m.name} (v${m.version})`);
        vscode.window.showQuickPick(items, {
          placeHolder: 'Available modules',
          canPickMany: false
        });
      } catch (error) {
        vscode.window.showErrorMessage(`Failed to list modules: ${error}`);
      }
    }),

    vscode.commands.registerCommand('nstrumenta.module.run', async () => {
      if (!mcpClient) {
        vscode.window.showWarningMessage('Please set API key first');
        return;
      }

      try {
        const agentId = await vscode.window.showInputBox({
          prompt: 'Enter agent ID',
          placeHolder: 'agent-id'
        });

        if (!agentId) {
          return;
        }

        const moduleName = await vscode.window.showInputBox({
          prompt: 'Enter module name to run',
          placeHolder: 'module-name'
        });

        if (!moduleName) {
          return;
        }

        const result = await mcpClient.runModule(agentId, moduleName);
        vscode.window.showInformationMessage(`Module started: ${result.actionId}`);
      } catch (error) {
        vscode.window.showErrorMessage(`Failed to run module: ${error}`);
      }
    }),

    vscode.commands.registerCommand('nstrumenta.data.list', async () => {
      if (!mcpClient) {
        vscode.window.showWarningMessage('Please set API key first');
        return;
      }

      try {
        const result = await mcpClient.listData();
        
        if (!result.objects || result.objects.length === 0) {
          vscode.window.showInformationMessage('No data files found');
          return;
        }

        const items = result.objects.map(d => `${d.path} (${d.size} bytes)`);
        vscode.window.showQuickPick(items, {
          placeHolder: 'Data files',
          canPickMany: false
        });
      } catch (error) {
        vscode.window.showErrorMessage(`Failed to list data: ${error}`);
      }
    }),

    vscode.commands.registerCommand('nstrumenta.agent.list', async () => {
      if (!mcpClient) {
        vscode.window.showWarningMessage('Please set API key first');
        return;
      }

      try {
        const result = await mcpClient.listAgents();
        
        if (!result.agents || result.agents.length === 0) {
          vscode.window.showInformationMessage('No agents found');
          return;
        }

        const items = result.agents.map(([id, data]) => `${data.name || id} - ${data.status || 'unknown'}`);
        vscode.window.showQuickPick(items, {
          placeHolder: 'Active agents',
          canPickMany: false
        });
      } catch (error) {
        vscode.window.showErrorMessage(`Failed to list agents: ${error}`);
      }
    })
  ];

  context.subscriptions.push(...commands);
}

export function deactivate() {
  console.log('nstrumenta extension deactivated');
}

async function initializeClient(context: vscode.ExtensionContext) {
  const apiKey = await context.secrets.get('nstrumenta.apiKey');
  
  if (apiKey) {
    const serverUrl = extractServerUrl(apiKey);
    mcpClient = new MCPClient({ apiKey, serverUrl });
    updateStatusBar(true);
  } else {
    mcpClient = null;
    updateStatusBar(false);
  }
}

function extractServerUrl(apiKey: string): string {
  const parts = apiKey.split(':');
  if (parts.length !== 2) {
    throw new Error('Invalid API key format. Expected: uuid:base64encodedurl');
  }
  
  const decoded = Buffer.from(parts[1], 'base64').toString('utf-8');
  return decoded;
}

function updateStatusBar(connected: boolean) {
  if (connected) {
    statusBarItem.text = '$(check) Nstrumenta';
    statusBarItem.tooltip = 'Connected to Nstrumenta';
    statusBarItem.backgroundColor = undefined;
  } else {
    statusBarItem.text = '$(key) Nstrumenta';
    statusBarItem.tooltip = 'Click to set API key';
    statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
  }
  statusBarItem.show();
}
