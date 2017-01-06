'use strict';

import * as vscode from 'vscode';

export function extractVariable() {
    return new Promise((resolve, reject) => {
        try {
            let editor = vscode.window.activeTextEditor;

            if (editor.selection.start.isEqual(editor.selection.end)) {
                return;
            }

            let oldSelection = editor.selection;

            if (oldSelection.start.character != 0) {
                let prevCharPosition = new vscode.Position(oldSelection.start.line, oldSelection.start.character - 1);
                let withPrevChar = editor.document.getText(new vscode.Range(prevCharPosition, oldSelection.end));

                if (withPrevChar[0] === '#') {
                    editor.selection = oldSelection = new vscode.Selection(prevCharPosition, oldSelection.end);
                }
            }

            let text = editor.document.getText(oldSelection);

            let propertyMatch = editor.document.lineAt(editor.selection.start.line).text.match(/^[\s]+([\w\-]+):/);
            let property = propertyMatch != null ? propertyMatch[1] : null;
            let isColor = text.startsWith('#');

            let variableLine: number = 0;
            let lastVariableLine = -1;
            let lastImportLine = -1;
            let namesDepths: [string, number][] = [];
            let depth = 0;

            for (let i = 0; i < oldSelection.start.line; i++) {
                let line = editor.document.lineAt(i);
                let lineText = line.text;

                if (/^\$/.test(lineText)) {
                    if (i > lastVariableLine) {
                        lastVariableLine = i;
                    }
                    continue;
                }

                if (/^\@import/.test(lineText)) {
                    if (i > lastImportLine) {
                        lastImportLine = i;
                    }
                    continue;
                }

                lineText.trim().split(' ').forEach(part => {
                    if (/^\./.test(part)) {
                        let match = part.match(/^\.([\w+\-]+)/);
                        if (match != null) {
                            namesDepths.push([match[1], depth]);
                        }
                    } else if (/^&\./.test(part)) {
                        let match = part.match(/^&\.([\w+\-]+)/);
                        if (match != null) {
                            namesDepths.push([match[1], depth]);
                        }
                    } else if (/^&__/.test(part)) {
                        let match = part.match(/^&__([\w+\-]+)/);
                        if (match != null) {
                            namesDepths.push([match[1], depth]);
                        }
                    } else if (/^a\b/.test(part)) {
                        namesDepths.push(['link', depth]);
                    } else if (/:hover/.test(part)) {
                        namesDepths.push(['hover', depth]);
                    }
                });

                for (let j = 0; j < lineText.length; j++) {
                    if (lineText[j] === '{') {
                        depth++;
                    } else if (lineText[j] === '}') {
                        depth--;
                    }
                }

                while (namesDepths.length > 0 && namesDepths[namesDepths.length - 1][1] >= depth) {
                    namesDepths.pop();
                }
            }

            let names: string[] = [];

            const pushName = (name: string) => {
                name.split('-').forEach(part => {
                    if (names.length > 0 && names[names.length - 1] === part) {
                        return;
                    }
                    if (part === '') {
                        return;
                    }
                    if (part === 'background') {
                        part = 'bg';
                    }
                    names.push(part);
                });
            };

            namesDepths.forEach(([name, depth]) => {
                if (/^l-/.test(name)) {
                    name = name.slice(2);
                }

                pushName(name);
            });

            if (property != null) {
                if (property === 'color') {
                    pushName('text-color');
                } else {
                    pushName(property);
                }
            }

            if ((property == null || !/color/.test(property)) && isColor) {
                pushName('color');
            }

            let defaultVariableName = names.join('-');

            return vscode.window.showInputBox({
                prompt: `Variable name for '${text}':`,
                value: defaultVariableName
            }).then(variableName => {
                if (!variableName) {
                    return;
                }

                let variableFullName = `$${variableName}`;
                let variableText = `${variableFullName}: ${text};\n`;

                editor.edit(editBuilder => {
                    editBuilder.replace(oldSelection, variableFullName);

                    let extraLines = 0;

                    if (lastVariableLine > -1) {
                        editBuilder.insert(new vscode.Position(lastVariableLine + 1, 0), variableText);
                        extraLines = 1;
                    } else if (lastImportLine > -1) {
                        editBuilder.insert(new vscode.Position(lastImportLine + 1, 0), '\n' + variableText);
                        extraLines = 3;
                    } else {
                        editBuilder.insert(new vscode.Position(0, 0), variableText + '\n');
                        extraLines = 2;
                    }
                });
            });
        } catch (err) {
            reject(err);
        }
    }).catch(err => {
        vscode.window.showErrorMessage('Extract variable error: ' + err);
        console.log(err);
        console.log(err.stack);

        return Promise.reject(err);
    });
}
