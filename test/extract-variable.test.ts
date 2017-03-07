import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as assert from 'assert';

import * as vscode from 'vscode';

import { extractVariable } from '../src/extract-variable';

type Range = [[number, number], [number, number]];

interface Case {
    input: string;
    range: Range;
    output: string;
}

const cases: Case[] = [{
    input:
`.foo {
    background-color: #f8f8f8;
}`,
    range: [[1, 23], [1, 29]],
    output:
`$foo-bg-color: #f8f8f8;

.foo {
    background-color: $foo-bg-color;
}`
}, {
    input:
`@import "common";

.foo {
    background-color: #f8f8f8;
}`,
    range: [[3, 23], [3, 29]],
    output:
`@import "common";

$foo-bg-color: #f8f8f8;

.foo {
    background-color: $foo-bg-color;
}`
}, {
    input:
`@import "common";

$foo-text-color: #333;

.foo {
    color: $foo-text-color;
    background-color: #f8f8f8;
}`,
    range: [[6, 23], [6, 29]],
    output:
`@import "common";

$foo-text-color: #333;
$foo-bg-color: #f8f8f8;

.foo {
    color: $foo-text-color;
    background-color: $foo-bg-color;
}`
}, {
    input:
`.l-menu {
    &__item {
        color: #f8f8f8;
    }
}`,
    range: [[2, 15], [2, 22]],
    output:
`$menu-item-text-color: #f8f8f8;

.l-menu {
    &__item {
        color: $menu-item-text-color;
    }
}`
}, {
    input:
`.l-menu {
    &__header {
        border-radius: 3px;
    }
    &__item {
        color: #f8f8f8;
    }
}`,
    range: [[5, 15], [5, 22]],
    output:
`$menu-item-text-color: #f8f8f8;

.l-menu {
    &__header {
        border-radius: 3px;
    }
    &__item {
        color: $menu-item-text-color;
    }
}`
}, {
    input:
`#menu {
    &.active:hover a {
        font-weight: bold;
    }
}`,
    range: [[2, 21], [2, 25]],
    output:
`$menu-active-hover-link-font-weight: bold;

#menu {
    &.active:hover a {
        font-weight: $menu-active-hover-link-font-weight;
    }
}`
}, {
    input:
`.l-menu {
    &--sticky &__item {
        color: #f8f8f8;
    }
}`,
    range: [[2, 15], [2, 22]],
    output:
`$menu-sticky-item-text-color: #f8f8f8;

.l-menu {
    &--sticky &__item {
        color: $menu-sticky-item-text-color;
    }
}`
}];

function extract(input: string, range: Range) {
    let testFilePath = path.join(os.tmpdir(), 'extract-variable-' + (Math.random() * 100000) + '.scss');

    fs.writeFileSync(testFilePath, input);

    return vscode.workspace.openTextDocument(testFilePath).then((document) => {
        return vscode.window.showTextDocument(document).then((editor) => {
            editor.selection = new vscode.Selection(new vscode.Position(range[0][0], range[0][1]), new vscode.Position(range[1][0], range[1][1]));

            return extractVariable(true).then(() => {
                return new Promise((resolve) => {
                    setTimeout(resolve, 200);
                });
            }).then(() => {
                return editor.document.getText();
            });
        });
    });
}

suite('extractVariable', () => {
    test('extractVariable', () => {
        return cases.reduce((p, c) => {
            return p.then(() => {
                return extract(c.input, c.range).then(output => {
                    assert.equal(output, c.output);
                });
            })
        }, Promise.resolve());
    });
});
