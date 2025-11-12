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
      const serverUrl = getMcpServerUrl();
      
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
        const modules = await mcpClient.listModules();
        
        if (modules.length === 0) {
          vscode.window.showInformationMessage('No modules found');
          return;
        }

        const items = modules.map(m => `${m.name} (v${m.version})`);
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
        const moduleName = await vscode.window.showInputBox({
          prompt: 'Enter module name to run',
          placeHolder: 'module-name'
        });

        if (!moduleName) {
          return;
        }

        const result = await mcpClient.runModule(moduleName);
        vscode.window.showInformationMessage(`Module started: ${result.jobId}`);
      } catch (error) {
        vscode.window.showErrorMessage(`Failed to run module: ${error}`);
      }
    }),

    vscode.commands.registerCommand('nstrumenta.module.publish', async () => {
      if (!mcpClient) {
        vscode.window.showWarningMessage('Please set API key first');
        return;
      }

      try {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
          vscode.window.showErrorMessage('No workspace folder open');
          return;
        }

        const modulePath = workspaceFolders[0].uri.fsPath;
        const result = await mcpClient.publishModule(modulePath);
        
        vscode.window.showInformationMessage(
          `Module published successfully${result.version ? ` (v${result.version})` : ''}`
        );
      } catch (error) {
        vscode.window.showErrorMessage(`Failed to publish module: ${error}`);
      }
    }),

    vscode.commands.registerCommand('nstrumenta.data.list', async () => {
      if (!mcpClient) {
        vscode.window.showWarningMessage('Please set API key first');
        return;
      }

      try {
        const dataItems = await mcpClient.listData();
        
        if (dataItems.length === 0) {
          vscode.window.showInformationMessage('No data files found');
          return;
        }

        const items = dataItems.map(d => `${d.path} (${d.size} bytes)`);
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
        const agents = await mcpClient.listAgents();
        
        if (agents.length === 0) {
          vscode.window.showInformationMessage('No agents found');
          return;
        }

        const items = agents.map(a => `${a.name || a.id} - ${a.status}`);
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
    const serverUrl = getMcpServerUrl();
    mcpClient = new MCPClient({ apiKey, serverUrl });
    updateStatusBar(true);
  } else {
    mcpClient = null;
    updateStatusBar(false);
  }
}

function getMcpServerUrl(): string {
  const configured = vscode.workspace.getConfiguration('nstrumenta').get<string>('mcpServer.url');
  return configured || 'http://localhost:5999';
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
