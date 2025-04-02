'use strict';
/**
 * @license Angular v20.0.0-next.4+sha-6acce7c
 * (c) 2010-2025 Google LLC. https://angular.io/
 * License: MIT
 */
'use strict';

require('./compiler-BS3Yj0wy.js');
require('typescript');
var checker = require('./checker-dMKqtsQe.js');
require('os');
var apply_import_manager = require('./apply_import_manager-DSpxOvZ6.js');
require('./index-CvyQAaeH.js');
require('path');
var run_in_devkit = require('./run_in_devkit-BMuWdULa.js');
var imports = require('./imports-CIX-JgAN.js');
require('@angular-devkit/core');
require('node:path/posix');
require('fs');
require('module');
require('url');
require('@angular-devkit/schematics');
require('./project_tsconfig_paths-CDVxT6Ov.js');

/** Migration that moves the import of `DOCUMENT` from `core` to `common`. */
class DocumentCoreMigration extends run_in_devkit.TsurgeFunnelMigration {
    async analyze(info) {
        const replacements = [];
        let importManager = null;
        for (const sourceFile of info.sourceFiles) {
            const specifier = imports.getImportSpecifier(sourceFile, '@angular/common', 'DOCUMENT');
            if (specifier === null) {
                continue;
            }
            importManager ??= new checker.ImportManager({
                // Prevent the manager from trying to generate a non-conflicting import.
                generateUniqueIdentifier: () => null,
                shouldUseSingleQuotes: () => true,
            });
            importManager.removeImport(sourceFile, 'DOCUMENT', '@angular/common');
            importManager.addImport({
                exportSymbolName: 'DOCUMENT',
                exportModuleSpecifier: '@angular/core',
                requestedFile: sourceFile,
                unsafeAliasOverride: specifier.propertyName ? specifier.name.text : undefined,
            });
        }
        if (importManager !== null) {
            apply_import_manager.applyImportManagerChanges(importManager, replacements, info.sourceFiles, info);
        }
        return run_in_devkit.confirmAsSerializable({ replacements });
    }
    async migrate(globalData) {
        return run_in_devkit.confirmAsSerializable(globalData);
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
        return run_in_devkit.confirmAsSerializable({ replacements: combined });
    }
    async globalMeta(combinedData) {
        return run_in_devkit.confirmAsSerializable(combinedData);
    }
    async stats() {
        return { counters: {} };
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
        await run_in_devkit.runMigrationInDevkit({
            tree,
            getMigration: () => new DocumentCoreMigration(),
        });
    };
}

exports.migrate = migrate;
