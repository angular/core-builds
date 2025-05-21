'use strict';
/**
 * @license Angular v19.2.11+sha-0104a69
 * (c) 2010-2025 Google LLC. https://angular.io/
 * License: MIT
 */
'use strict';

var schematics = require('@angular-devkit/schematics');
var p = require('path');
var project_tsconfig_paths = require('./project_tsconfig_paths-CDVxT6Ov.cjs');
var compiler_host = require('./compiler_host-CMQhOE1J.cjs');
var ts = require('typescript');
var imports = require('./imports-CIX-JgAN.cjs');
require('@angular-devkit/core');
require('./checker-WzomkuMa.cjs');
require('os');
require('fs');
require('module');
require('url');

const CORE = '@angular/core';
const EXPERIMENTAL_PENDING_TASKS = 'ExperimentalPendingTasks';
function migrateFile(sourceFile, typeChecker, rewriteFn) {
    const changeTracker = new compiler_host.ChangeTracker(ts.createPrinter());
    // Check if there are any imports of the `AfterRenderPhase` enum.
    const coreImports = imports.getNamedImports(sourceFile, CORE);
    if (!coreImports) {
        return;
    }
    const importSpecifier = imports.getImportSpecifier(sourceFile, CORE, EXPERIMENTAL_PENDING_TASKS);
    if (!importSpecifier) {
        return;
    }
    const nodeToReplace = importSpecifier.propertyName ?? importSpecifier.name;
    if (!ts.isIdentifier(nodeToReplace)) {
        return;
    }
    changeTracker.replaceNode(nodeToReplace, ts.factory.createIdentifier('PendingTasks'));
    ts.forEachChild(sourceFile, function visit(node) {
        // import handled above
        if (ts.isImportDeclaration(node)) {
            return;
        }
        if (ts.isIdentifier(node) &&
            node.text === EXPERIMENTAL_PENDING_TASKS &&
            imports.getImportOfIdentifier(typeChecker, node)?.name === EXPERIMENTAL_PENDING_TASKS) {
            changeTracker.replaceNode(node, ts.factory.createIdentifier('PendingTasks'));
        }
        ts.forEachChild(node, visit);
    });
    // Write the changes.
    for (const changesInFile of changeTracker.recordChanges().values()) {
        for (const change of changesInFile) {
            rewriteFn(change.start, change.removeLength ?? 0, change.text);
        }
    }
}

function migrate() {
    return async (tree) => {
        const { buildPaths, testPaths } = await project_tsconfig_paths.getProjectTsConfigPaths(tree);
        const basePath = process.cwd();
        const allPaths = [...buildPaths, ...testPaths];
        if (!allPaths.length) {
            throw new schematics.SchematicsException('Could not find any tsconfig file. Cannot run the afterRender phase migration.');
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
        migrateFile(sourceFile, program.getTypeChecker(), rewriter);
        if (update !== null) {
            tree.commitUpdate(update);
        }
    }
}

exports.migrate = migrate;
