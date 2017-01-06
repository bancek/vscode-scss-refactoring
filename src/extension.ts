'use strict';

import * as vscode from 'vscode';

import { extractVariable } from './extract-variable';

export function activate(context: vscode.ExtensionContext) {
    let disposable = vscode.commands.registerCommand('extension.scssRefactoringExtractVariable', () => {
        return extractVariable().catch(err => {
            vscode.window.showErrorMessage('Extract variable error: ' + err);
            console.log(err);
            console.log(err.stack);

            return Promise.reject(err);
        });
    });

    context.subscriptions.push(disposable);
}

export function deactivate() {
}
