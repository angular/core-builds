'use strict';
/**
 * @license Angular v20.0.3+sha-b24d540
 * (c) 2010-2025 Google LLC. https://angular.io/
 * License: MIT
 */
'use strict';

var ts = require('typescript');
require('os');
var checker = require('./checker-Bu1Wu4f7.cjs');
require('./index-CCX_cTPD.cjs');
require('path');
var project_paths = require('./project_paths-BjQra9mv.cjs');
var apply_import_manager = require('./apply_import_manager-DT15wSJs.cjs');
var imports = require('./imports-CIX-JgAN.cjs');
require('@angular-devkit/core');
require('node:path/posix');
require('fs');
require('module');
require('url');
require('@angular-devkit/schematics');
require('./project_tsconfig_paths-CDVxT6Ov.cjs');

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
        return project_paths.confirmAsSerializable({});
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
        await project_paths.runMigrationInDevkit({
            tree,
            getMigration: () => new InjectFlagsMigration(),
        });
    };
}

exports.migrate = migrate;
