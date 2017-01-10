import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as assert from 'assert';

import * as vscode from 'vscode';

import { formatVariables } from '../src/format-variables';

type Range = [[number, number], [number, number]];

interface Case {
    input: string;
    range: Range | null;
    output: string;
}

const cases: Case[] = [{
    input:
`$foo-text-color: #333;
$foo-bg-color: #ffffff;`,
    range: null,
    output:
`$foo-text-color: #333;
$foo-bg-color:   #ffffff;`
}, {
    input:
`@import "variables";

$foo-text-color: #333;
$foo-bg-color: #ffffff;

.foo {
    color: $foo-text-color;
    background-color: $foo-bg-color;
}`,
    range: null,
    output:
`@import "variables";

$foo-text-color: #333;
$foo-bg-color:   #ffffff;

.foo {
    color: $foo-text-color;
    background-color: $foo-bg-color;
}`
}];

function format(input: string, range: Range) {
    let testFilePath = path.join(os.tmpdir(), 'format-variables-' + (Math.random() * 100000) + '.scss');

    fs.writeFileSync(testFilePath, input);

    return vscode.workspace.openTextDocument(testFilePath).then((document) => {
        return vscode.window.showTextDocument(document).then((editor) => {
            if (range != null) {
                editor.selection = new vscode.Selection(new vscode.Position(range[0][0], range[0][1]), new vscode.Position(range[1][0], range[1][1]));
            }

            return formatVariables().then(() => {
                return new Promise((resolve) => {
                    setTimeout(resolve, 200);
                });
            }).then(() => {
                return editor.document.getText();
            });
        });
    });
}

suite('formatVariables', () => {
    test('formatVariables', () => {
        return cases.reduce((p, c) => {
            return p.then(() => {
                return format(c.input, c.range).then(output => {
                    assert.equal(output, c.output);
                });
            })
        }, Promise.resolve());
    });
});
