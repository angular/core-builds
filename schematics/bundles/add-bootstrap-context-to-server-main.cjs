'use strict';
/**
 * @license Angular v19.2.15+sha-b2c7979
 * (c) 2010-2025 Google LLC. https://angular.io/
 * License: MIT
 */
'use strict';

var schematics = require('@angular-devkit/schematics');
var p = require('path');
var project_tsconfig_paths = require('./project_tsconfig_paths-CDVxT6Ov.cjs');
var compiler_host = require('./compiler_host-CAfDJO3W.cjs');
var checker = require('./checker-BwV9MjSQ.cjs');
var ts = require('typescript');
require('os');
require('@angular-devkit/core');
require('fs');
require('module');
require('url');

/*!
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */
function findArrowFunction(node) {
    let current = node;
    while (current) {
        if (ts.isArrowFunction(current)) {
            return current;
        }
        current = current.parent;
    }
    return undefined;
}
function migrateFile(sourceFile, rewriter) {
    if (!sourceFile.fileName.endsWith('main.server.ts')) {
        return;
    }
    const bootstrapAppCalls = [];
    ts.forEachChild(sourceFile, function findCalls(node) {
        if (ts.isCallExpression(node) &&
            ts.isIdentifier(node.expression) &&
            node.expression.text === 'bootstrapApplication' &&
            node.arguments.length < 3) {
            bootstrapAppCalls.push(node);
        }
        ts.forEachChild(node, findCalls);
    });
    if (bootstrapAppCalls.length === 0) {
        return;
    }
    const importManager = new checker.ImportManager({
        generateUniqueIdentifier: () => null,
        shouldUseSingleQuotes: () => true,
    });
    for (const node of bootstrapAppCalls) {
        const end = node.arguments[node.arguments.length - 1].getEnd();
        rewriter(end, 0, ', context');
        const arrowFunction = findArrowFunction(node);
        if (arrowFunction && arrowFunction.parameters.length === 0) {
            const pos = arrowFunction.parameters.end;
            rewriter(pos, 0, 'context: BootstrapContext');
        }
    }
    importManager.addImport({
        exportSymbolName: 'BootstrapContext',
        exportModuleSpecifier: '@angular/platform-browser',
        requestedFile: sourceFile,
    });
    const finalization = importManager.finalize();
    const printer = ts.createPrinter();
    for (const [oldBindings, newBindings] of finalization.updatedImports) {
        const newText = printer.printNode(ts.EmitHint.Unspecified, newBindings, sourceFile);
        const start = oldBindings.getStart();
        const width = oldBindings.getWidth();
        rewriter(start, width, newText);
    }
}

/*!
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */
function migrate() {
    return async (tree) => {
        const { buildPaths, testPaths } = await project_tsconfig_paths.getProjectTsConfigPaths(tree);
        const basePath = process.cwd();
        const allPaths = [...buildPaths, ...testPaths];
        if (!allPaths.length) {
            throw new schematics.SchematicsException('Could not find any tsconfig file. Cannot run the add-bootstrap-context-to-server-main migration.');
        }
        for (const tsconfigPath of allPaths) {
            runMigration(tree, tsconfigPath, basePath);
        }
    };
}
function runMigration(tree, tsconfigPath, basePath) {
    const program = compiler_host.createMigrationProgram(tree, tsconfigPath, basePath);
    const sourceFiles = program
        .getSourceFiles()
        .filter((sourceFile) => compiler_host.canMigrateFile(basePath, sourceFile, program));
    for (const sourceFile of sourceFiles) {
        let update = null;
        const rewriter = (startPos, width, text) => {
            if (update === null) {
                // Lazily initialize update, because most files will not require migration.
                update = tree.beginUpdate(p.relative(basePath, sourceFile.fileName));
            }
            update.remove(startPos, width);
            if (text !== null) {
                update.insertLeft(startPos, text);
            }
        };
        migrateFile(sourceFile, rewriter);
        if (update !== null) {
            tree.commitUpdate(update);
        }
    }
}

exports.migrate = migrate;
