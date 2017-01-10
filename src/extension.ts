'use strict';

import * as vscode from 'vscode';

import { extractVariable } from './extract-variable';
import { formatVariables } from './format-variables';

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

    disposable = vscode.commands.registerCommand('extension.scssRefactoringFormatVariables', () => {
        return formatVariables().catch(err => {
            vscode.window.showErrorMessage('Format variables error: ' + err);
            console.log(err);
            console.log(err.stack);

            return Promise.reject(err);
        });
    });

    context.subscriptions.push(disposable);
}

export function deactivate() {
}
