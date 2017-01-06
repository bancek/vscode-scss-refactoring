'use strict';

import * as vscode from 'vscode';

import { extractVariable } from './extract-variable';

export function activate(context: vscode.ExtensionContext) {
    let disposable = vscode.commands.registerCommand('extension.scssRefactoringExtractVariable', () => {
        extractVariable();
    });

    context.subscriptions.push(disposable);
}

export function deactivate() {
}
