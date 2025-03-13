'use strict';
/**
 * @license Angular v20.0.0-next.2+sha-55ba1ed
 * (c) 2010-2025 Google LLC. https://angular.io/
 * License: MIT
 */
'use strict';

var schematics = require('@angular-devkit/schematics');
var project_tsconfig_paths = require('./project_tsconfig_paths-CDVxT6Ov.js');
var project_paths = require('./project_paths-Jtbi76Bs.js');
require('os');
var ts = require('typescript');
var checker = require('./checker-DF8ZaFW5.js');
require('./program-BZk27Ndu.js');
require('path');
var apply_import_manager = require('./apply_import_manager-CyRT0UvU.js');
var imports = require('./imports-CIX-JgAN.js');
require('@angular-devkit/core');
require('node:path/posix');
require('fs');
require('module');
require('url');

/** Mapping between `InjectFlag` enum members to their object literal equvalients. */
const FLAGS_TO_FIELDS = {
    'Default': 'default',
    'Host': 'host',
    'Optional': 'optional',
    'Self': 'self',
    'SkipSelf': 'skipSelf',
};
/** Migration that replaces `InjectFlags` usages with object literals. */
class InjectFlagsMigration extends project_paths.TsurgeFunnelMigration {
    async analyze(info) {
        const locations = {};
        const importRemovals = {};
        for (const sourceFile of info.sourceFiles) {
            const specifier = imports.getImportSpecifier(sourceFile, '@angular/core', 'InjectFlags');
            if (specifier === null) {
                continue;
            }
            const file = project_paths.projectFile(sourceFile, info);
            const importManager = new checker.ImportManager();
            const importReplacements = [];
            // Always remove the `InjectFlags` since it has been removed from Angular.
            // Note that it be better to do this inside of `migrate`, but we don't have AST access there.
            importManager.removeImport(sourceFile, 'InjectFlags', '@angular/core');
            apply_import_manager.applyImportManagerChanges(importManager, importReplacements, [sourceFile], info);
            importRemovals[file.id] = importReplacements;
            sourceFile.forEachChild(function walk(node) {
                if (
                // Note: we don't use the type checker for matching here, because
                // the `InjectFlags` will be removed which can break the lookup.
                ts.isPropertyAccessExpression(node) &&
                    ts.isIdentifier(node.expression) &&
                    node.expression.text === specifier.name.text &&
                    FLAGS_TO_FIELDS.hasOwnProperty(node.name.text)) {
                    const root = getInjectFlagsRootExpression(node);
                    if (root !== null) {
                        const flagName = FLAGS_TO_FIELDS[node.name.text];
                        const id = getNodeID(file, root);
                        locations[id] ??= { file, flags: [], position: root.getStart(), end: root.getEnd() };
                        // The flags can't be a set here, because they need to be serializable.
                        if (!locations[id].flags.includes(flagName)) {
                            locations[id].flags.push(flagName);
                        }
                    }
                }
                else {
                    node.forEachChild(walk);
                }
            });
        }
        return project_paths.confirmAsSerializable({ locations, importRemovals });
    }
    async migrate(globalData) {
        const replacements = [];
        for (const removals of Object.values(globalData.importRemovals)) {
            replacements.push(...removals);
        }
        for (const { file, position, end, flags } of Object.values(globalData.locations)) {
            // Declare a property for each flag, except for `default` which does not have a flag.
            const properties = flags.filter((flag) => flag !== 'default').map((flag) => `${flag}: true`);
            const toInsert = properties.length ? `{ ${properties.join(', ')} }` : '{}';
            replacements.push(new project_paths.Replacement(file, new project_paths.TextUpdate({ position, end, toInsert })));
        }
        return project_paths.confirmAsSerializable({ replacements });
    }
    async combine(unitA, unitB) {
        return project_paths.confirmAsSerializable({
            locations: {
                ...unitA.locations,
                ...unitB.locations,
            },
            importRemovals: {
                ...unitA.importRemovals,
                ...unitB.importRemovals,
            },
        });
    }
    async globalMeta(combinedData) {
        return project_paths.confirmAsSerializable(combinedData);
    }
    async stats() {
        return { counters: {} };
    }
}
/** Gets an ID that can be used to look up a node based on its location. */
function getNodeID(file, node) {
    return `${file.id}/${node.getStart()}/${node.getWidth()}`;
}
/**
 * Gets the root expression of an `InjectFlags` usage. For example given `InjectFlags.Optional`.
 * in `InjectFlags.Host | InjectFlags.Optional | InjectFlags.SkipSelf`, the function will return
 * the top-level binary expression.
 * @param start Node from which to start searching.
 */
function getInjectFlagsRootExpression(start) {
    let current = start;
    let parent = current?.parent;
    while (parent && (ts.isBinaryExpression(parent) || ts.isParenthesizedExpression(parent))) {
        current = parent;
        parent = current.parent;
    }
    // Only allow allow expressions that are call parameters, variable initializer or parameter
    // initializers which are the only officially supported usages of `InjectFlags`.
    if (current &&
        parent &&
        ((ts.isCallExpression(parent) && parent.arguments.includes(current)) ||
            (ts.isVariableDeclaration(parent) && parent.initializer === current) ||
            (ts.isParameter(parent) && parent.initializer === current))) {
        return current;
    }
    return null;
}

function migrate() {
    return async (tree) => {
        const { buildPaths, testPaths } = await project_tsconfig_paths.getProjectTsConfigPaths(tree);
        if (!buildPaths.length && !testPaths.length) {
            throw new schematics.SchematicsException('Could not find any tsconfig file. Cannot replace `InjectFlags` usages.');
        }
        const fs = new project_paths.DevkitMigrationFilesystem(tree);
        checker.setFileSystem(fs);
        const migration = new InjectFlagsMigration();
        const unitResults = [];
        const programInfos = [...buildPaths, ...testPaths].map((tsconfigPath) => {
            const baseInfo = migration.createProgram(tsconfigPath, fs);
            const info = migration.prepareProgram(baseInfo);
            return { info, tsconfigPath };
        });
        for (const { info } of programInfos) {
            unitResults.push(await migration.analyze(info));
        }
        const combined = await project_paths.synchronouslyCombineUnitData(migration, unitResults);
        if (combined === null) {
            return;
        }
        const globalMeta = await migration.globalMeta(combined);
        const replacementsPerFile = new Map();
        const { replacements } = await migration.migrate(globalMeta);
        const changesPerFile = project_paths.groupReplacementsByFile(replacements);
        for (const [file, changes] of changesPerFile) {
            if (!replacementsPerFile.has(file)) {
                replacementsPerFile.set(file, changes);
            }
        }
        for (const [file, changes] of replacementsPerFile) {
            const recorder = tree.beginUpdate(file);
            for (const c of changes) {
                recorder
                    .remove(c.data.position, c.data.end - c.data.position)
                    .insertRight(c.data.position, c.data.toInsert);
            }
            tree.commitUpdate(recorder);
        }
    };
}

exports.migrate = migrate;
