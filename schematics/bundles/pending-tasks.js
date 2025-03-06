'use strict';
/**
 * @license Angular v20.0.0-next.1+sha-81fe053
 * (c) 2010-2025 Google LLC. https://angular.io/
 * License: MIT
 */
'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var schematics = require('@angular-devkit/schematics');
var p = require('path');
var project_tsconfig_paths = require('./project_tsconfig_paths-b558633b.js');
var compiler_host = require('./compiler_host-5a29293c.js');
var ts = require('typescript');
var imports = require('./imports-047fbbc8.js');
require('@angular-devkit/core');
require('./checker-af521da6.js');
require('os');
require('fs');
require('module');
require('url');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var ts__default = /*#__PURE__*/_interopDefaultLegacy(ts);

const CORE = '@angular/core';
const EXPERIMENTAL_PENDING_TASKS = 'ExperimentalPendingTasks';
function migrateFile(sourceFile, typeChecker, rewriteFn) {
    const changeTracker = new compiler_host.ChangeTracker(ts__default["default"].createPrinter());
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
    if (!ts__default["default"].isIdentifier(nodeToReplace)) {
        return;
    }
    changeTracker.replaceNode(nodeToReplace, ts__default["default"].factory.createIdentifier('PendingTasks'));
    ts__default["default"].forEachChild(sourceFile, function visit(node) {
        // import handled above
        if (ts__default["default"].isImportDeclaration(node)) {
            return;
        }
        if (ts__default["default"].isIdentifier(node) &&
            node.text === EXPERIMENTAL_PENDING_TASKS &&
            imports.getImportOfIdentifier(typeChecker, node)?.name === EXPERIMENTAL_PENDING_TASKS) {
            changeTracker.replaceNode(node, ts__default["default"].factory.createIdentifier('PendingTasks'));
        }
        ts__default["default"].forEachChild(node, visit);
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
