'use strict';
/**
 * @license Angular v21.1.0+sha-e664249
 * (c) 2010-2026 Google LLC. https://angular.dev/
 * License: MIT
 */
'use strict';

var migrations = require('@angular/compiler-cli/private/migrations');
var apply_import_manager = require('./apply_import_manager-CxA_YYgB.cjs');
require('@angular/compiler-cli');
require('typescript');
require('node:path');
var project_paths = require('./project_paths-D2V-Uh2L.cjs');
var imports = require('./imports-CVmcbVA9.cjs');
require('@angular-devkit/core');
require('node:path/posix');
require('@angular-devkit/schematics');
require('./project_tsconfig_paths-DkkMibv-.cjs');

/** Migration that moves the import of `ApplicationConfig` from `platform-browser` to `core`. */
class ApplicationConfigCoreMigration extends project_paths.TsurgeFunnelMigration {
    async analyze(info) {
        const replacements = [];
        let importManager = null;
        for (const sourceFile of info.sourceFiles) {
            const specifier = imports.getImportSpecifier(sourceFile, '@angular/platform-browser', 'ApplicationConfig');
            if (!specifier) {
                continue;
            }
            importManager ??= new migrations.ImportManager({
                // Prevent the manager from trying to generate a non-conflicting import.
                generateUniqueIdentifier: () => null,
                shouldUseSingleQuotes: () => true,
            });
            importManager.removeImport(sourceFile, 'ApplicationConfig', '@angular/platform-browser');
            importManager.addImport({
                exportSymbolName: 'ApplicationConfig',
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

function migrate() {
    return async (tree) => {
        await project_paths.runMigrationInDevkit({
            tree,
            getMigration: () => new ApplicationConfigCoreMigration(),
        });
    };
}

exports.migrate = migrate;
