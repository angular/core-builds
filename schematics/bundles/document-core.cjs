'use strict';
/**
 * @license Angular v20.3.5+sha-69dabdb
 * (c) 2010-2025 Google LLC. https://angular.io/
 * License: MIT
 */
'use strict';

var project_tsconfig_paths = require('./project_tsconfig_paths-tTmeFlcz.cjs');
require('typescript');
require('os');
var apply_import_manager = require('./apply_import_manager-_3Mx7H7A.cjs');
require('./index-BDeOF3Gn.cjs');
require('path');
require('node:path');
var project_paths = require('./project_paths-C8LDPZ5A.cjs');
var imports = require('./imports-CIX-JgAN.cjs');
require('@angular-devkit/core');
require('node:path/posix');
require('fs');
require('module');
require('url');
require('@angular-devkit/schematics');

/** Migration that moves the import of `DOCUMENT` from `core` to `common`. */
class DocumentCoreMigration extends project_paths.TsurgeFunnelMigration {
    async analyze(info) {
        const replacements = [];
        let importManager = null;
        for (const sourceFile of info.sourceFiles) {
            const specifier = imports.getImportSpecifier(sourceFile, '@angular/common', 'DOCUMENT');
            if (specifier === null) {
                continue;
            }
            importManager ??= new project_tsconfig_paths.ImportManager({
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
            getMigration: () => new DocumentCoreMigration(),
        });
    };
}

exports.migrate = migrate;
