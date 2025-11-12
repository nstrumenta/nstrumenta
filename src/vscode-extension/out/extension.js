"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = require("vscode");
function activate(context) {
    console.log('nstrumenta extension activated');
    const commands = [
        vscode.commands.registerCommand('nstrumenta.auth.login', async () => {
            vscode.window.showInformationMessage('Login command - TODO: implement');
        }),
        vscode.commands.registerCommand('nstrumenta.auth.logout', async () => {
            vscode.window.showInformationMessage('Logout command - TODO: implement');
        }),
        vscode.commands.registerCommand('nstrumenta.project.select', async () => {
            vscode.window.showInformationMessage('Select Project - TODO: implement');
        }),
        vscode.commands.registerCommand('nstrumenta.project.info', async () => {
            vscode.window.showInformationMessage('Show Project Info - TODO: implement');
        }),
        vscode.commands.registerCommand('nstrumenta.module.list', async () => {
            vscode.window.showInformationMessage('List Modules - TODO: implement');
        }),
        vscode.commands.registerCommand('nstrumenta.module.run', async () => {
            vscode.window.showInformationMessage('Run Module - TODO: implement');
        }),
        vscode.commands.registerCommand('nstrumenta.module.publish', async () => {
            vscode.window.showInformationMessage('Publish Modules - TODO: implement');
        }),
        vscode.commands.registerCommand('nstrumenta.data.list', async () => {
            vscode.window.showInformationMessage('List Data - TODO: implement');
        }),
        vscode.commands.registerCommand('nstrumenta.agent.list', async () => {
            vscode.window.showInformationMessage('List Agents - TODO: implement');
        })
    ];
    context.subscriptions.push(...commands);
}
exports.activate = activate;
function deactivate() {
    console.log('nstrumenta extension deactivated');
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map