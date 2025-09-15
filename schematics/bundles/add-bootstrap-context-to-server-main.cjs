'use strict';
/**
 * @license Angular v21.0.0-next.3+sha-420703f
 * (c) 2010-2025 Google LLC. https://angular.io/
 * License: MIT
 */
'use strict';

require('@angular-devkit/core');
require('node:path/posix');
var project_paths = require('./project_paths-BI1-KH_O.cjs');
var project_tsconfig_paths = require('./project_tsconfig_paths-DhD8nPO0.cjs');
var ts = require('typescript');
require('os');
var apply_import_manager = require('./apply_import_manager-WmN7W348.cjs');
require('./index-BVNCudfT.cjs');
require('path');
require('node:path');
require('@angular-devkit/schematics');
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
class AddBootstrapContextToServerMainMigration extends project_paths.TsurgeFunnelMigration {
    async analyze(info) {
        const replacements = [];
        let importManager = null;
        for (const sourceFile of info.sourceFiles) {
            if (!sourceFile.fileName.endsWith('main.server.ts')) {
                continue;
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
                continue;
            }
            for (const node of bootstrapAppCalls) {
                const end = node.arguments[node.arguments.length - 1].getEnd();
                replacements.push(new project_paths.Replacement(project_paths.projectFile(sourceFile, info), new project_paths.TextUpdate({
                    position: end,
                    end: end,
                    toInsert: ', context',
                })));
                const arrowFunction = findArrowFunction(node);
                if (arrowFunction && arrowFunction.parameters.length === 0) {
                    replacements.push(new project_paths.Replacement(project_paths.projectFile(sourceFile, info), new project_paths.TextUpdate({
                        position: arrowFunction.parameters.end,
                        end: arrowFunction.parameters.end,
                        toInsert: 'context: BootstrapContext',
                    })));
                }
            }
            importManager ??= new project_tsconfig_paths.ImportManager({
                generateUniqueIdentifier: () => null,
                shouldUseSingleQuotes: () => true,
            });
            importManager.addImport({
                exportSymbolName: 'BootstrapContext',
                exportModuleSpecifier: '@angular/platform-browser',
                requestedFile: sourceFile,
            });
        }
        if (importManager !== null) {
            apply_import_manager.applyImportManagerChanges(importManager, replacements, info.sourceFiles, info);
        }
        return project_paths.confirmAsSerializable({ replacements });
    }
    async migrate(globalData) {
        return project_paths.confirmAsSerializable(globalData);
    }
    async combine(unitA, unitB) {
        const seen = new Set();
        const combined = [];
        [unitA.replacements, unitB.replacements].forEach((replacements) => {
            replacements.forEach((current) => {
                const { position, end, toInsert } = current.update.data;
                const key = current.projectFile.id + '/' + position + '/' + end + '/' + toInsert;
                if (!seen.has(key)) {
                    seen.add(key);
                    combined.push(current);
                }
            });
        });
        return project_paths.confirmAsSerializable({ replacements: combined });
    }
    async globalMeta(combinedData) {
        return project_paths.confirmAsSerializable(combinedData);
    }
    async stats() {
        return project_paths.confirmAsSerializable({});
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
        await project_paths.runMigrationInDevkit({
            tree,
            getMigration: () => new AddBootstrapContextToServerMainMigration(),
        });
    };
}

exports.migrate = migrate;
