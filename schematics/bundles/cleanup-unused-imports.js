'use strict';
/**
 * @license Angular v19.2.0-next.0+sha-3f53dd1
 * (c) 2010-2024 Google LLC. https://angular.io/
 * License: MIT
 */
'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var schematics = require('@angular-devkit/schematics');
var project_tsconfig_paths = require('./project_tsconfig_paths-e9ccccbf.js');
var apply_import_manager = require('./apply_import_manager-deecd687.js');
require('os');
var ts = require('typescript');
var checker = require('./checker-78667e44.js');
var program = require('./program-b0d98952.js');
require('path');
require('./index-de135c2f.js');
require('@angular-devkit/core');
require('node:path/posix');
require('fs');
require('module');
require('url');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var ts__default = /*#__PURE__*/_interopDefaultLegacy(ts);

/** Migration that cleans up unused imports from a project. */
class UnusedImportsMigration extends apply_import_manager.TsurgeFunnelMigration {
    printer = ts__default["default"].createPrinter();
    createProgram(tsconfigAbsPath, fs) {
        return super.createProgram(tsconfigAbsPath, fs, {
            extendedDiagnostics: {
                checks: {
                    // Ensure that the diagnostic is enabled.
                    unusedStandaloneImports: program.DiagnosticCategoryLabel.Warning,
                },
            },
        });
    }
    async analyze(info) {
        const nodePositions = new Map();
        const replacements = [];
        const removedIdentifiers = [];
        let changedFiles = 0;
        info.ngCompiler?.getDiagnostics().forEach((diag) => {
            if (diag.file !== undefined &&
                diag.start !== undefined &&
                diag.length !== undefined &&
                diag.code === checker.ngErrorCode(checker.ErrorCode.UNUSED_STANDALONE_IMPORTS)) {
                if (!nodePositions.has(diag.file)) {
                    nodePositions.set(diag.file, new Set());
                }
                nodePositions.get(diag.file).add(this.getNodeID(diag.start, diag.length));
            }
        });
        nodePositions.forEach((locations, sourceFile) => {
            const resolvedLocations = this.resolveRemovalLocations(sourceFile, locations);
            const usageAnalysis = this.analyzeUsages(sourceFile, resolvedLocations);
            if (resolvedLocations.allRemovedIdentifiers.size > 0) {
                changedFiles++;
                resolvedLocations.allRemovedIdentifiers.forEach((identifier) => {
                    removedIdentifiers.push(this.getNodeID(identifier.getStart(), identifier.getWidth()));
                });
            }
            this.generateReplacements(sourceFile, resolvedLocations, usageAnalysis, info, replacements);
        });
        return apply_import_manager.confirmAsSerializable({ replacements, removedIdentifiers, changedFiles });
    }
    async migrate(globalData) {
        return apply_import_manager.confirmAsSerializable(globalData);
    }
    async combine(unitA, unitB) {
        const combinedReplacements = [];
        const combinedRemovedIdentifiers = [];
        const seenReplacements = new Set();
        const seenIdentifiers = new Set();
        const changedFileIds = new Set();
        [unitA, unitB].forEach((unit) => {
            for (const replacement of unit.replacements) {
                const key = this.getReplacementID(replacement);
                changedFileIds.add(replacement.projectFile.id);
                if (!seenReplacements.has(key)) {
                    seenReplacements.add(key);
                    combinedReplacements.push(replacement);
                }
            }
            for (const identifier of unit.removedIdentifiers) {
                if (!seenIdentifiers.has(identifier)) {
                    seenIdentifiers.add(identifier);
                    combinedRemovedIdentifiers.push(identifier);
                }
            }
        });
        return apply_import_manager.confirmAsSerializable({
            replacements: combinedReplacements,
            removedIdentifiers: combinedRemovedIdentifiers,
            changedFiles: changedFileIds.size,
        });
    }
    async globalMeta(combinedData) {
        return apply_import_manager.confirmAsSerializable(combinedData);
    }
    async stats(globalMetadata) {
        return {
            counters: {
                removedImports: globalMetadata.removedIdentifiers.length,
                changedFiles: globalMetadata.changedFiles,
            },
        };
    }
    /** Gets an ID that can be used to look up a node based on its location. */
    getNodeID(start, length) {
        return `${start}/${length}`;
    }
    /** Gets a unique ID for a replacement. */
    getReplacementID(replacement) {
        const { position, end, toInsert } = replacement.update.data;
        return replacement.projectFile.id + '/' + position + '/' + end + '/' + toInsert;
    }
    /**
     * Resolves a set of node locations to the actual AST nodes that need to be migrated.
     * @param sourceFile File in which to resolve the locations.
     * @param locations Location keys that should be resolved.
     */
    resolveRemovalLocations(sourceFile, locations) {
        const result = {
            fullRemovals: new Set(),
            partialRemovals: new Map(),
            allRemovedIdentifiers: new Set(),
        };
        const walk = (node) => {
            if (!ts__default["default"].isIdentifier(node)) {
                node.forEachChild(walk);
                return;
            }
            // The TS typings don't reflect that the parent can be undefined.
            const parent = node.parent;
            if (!parent) {
                return;
            }
            if (locations.has(this.getNodeID(node.getStart(), node.getWidth()))) {
                // When the entire array needs to be cleared, the diagnostic is
                // reported on the property assignment, rather than an array element.
                if (ts__default["default"].isPropertyAssignment(parent) &&
                    parent.name === node &&
                    ts__default["default"].isArrayLiteralExpression(parent.initializer)) {
                    result.fullRemovals.add(parent.initializer);
                    parent.initializer.elements.forEach((element) => {
                        if (ts__default["default"].isIdentifier(element)) {
                            result.allRemovedIdentifiers.add(element);
                        }
                    });
                }
                else if (ts__default["default"].isArrayLiteralExpression(parent)) {
                    if (!result.partialRemovals.has(parent)) {
                        result.partialRemovals.set(parent, new Set());
                    }
                    result.partialRemovals.get(parent).add(node);
                    result.allRemovedIdentifiers.add(node);
                }
            }
        };
        walk(sourceFile);
        return result;
    }
    /**
     * Analyzes how identifiers are used across a file.
     * @param sourceFile File to be analyzed.
     * @param locations Locations that will be changed as a part of this migration.
     */
    analyzeUsages(sourceFile, locations) {
        const { partialRemovals, fullRemovals } = locations;
        const result = {
            importedSymbols: new Map(),
            identifierCounts: new Map(),
        };
        const walk = (node) => {
            if (ts__default["default"].isIdentifier(node) &&
                node.parent &&
                // Don't track individual identifiers marked for removal.
                (!ts__default["default"].isArrayLiteralExpression(node.parent) ||
                    !partialRemovals.has(node.parent) ||
                    !partialRemovals.get(node.parent).has(node))) {
                result.identifierCounts.set(node.text, (result.identifierCounts.get(node.text) ?? 0) + 1);
            }
            // Don't track identifiers in array literals that are about to be removed.
            if (ts__default["default"].isArrayLiteralExpression(node) && fullRemovals.has(node)) {
                return;
            }
            if (ts__default["default"].isImportDeclaration(node)) {
                const namedBindings = node.importClause?.namedBindings;
                const moduleName = ts__default["default"].isStringLiteral(node.moduleSpecifier)
                    ? node.moduleSpecifier.text
                    : null;
                if (namedBindings && ts__default["default"].isNamedImports(namedBindings) && moduleName !== null) {
                    namedBindings.elements.forEach((imp) => {
                        if (!result.importedSymbols.has(moduleName)) {
                            result.importedSymbols.set(moduleName, new Map());
                        }
                        const symbolName = (imp.propertyName || imp.name).text;
                        const localName = imp.name.text;
                        result.importedSymbols.get(moduleName).set(localName, symbolName);
                    });
                }
                // Don't track identifiers in imports.
                return;
            }
            // Track identifiers in all other node kinds.
            node.forEachChild(walk);
        };
        walk(sourceFile);
        return result;
    }
    /**
     * Generates text replacements based on the data produced by the migration.
     * @param sourceFile File being migrated.
     * @param removalLocations Data about nodes being removed.
     * @param usages Data about identifier usage.
     * @param info Information about the current program.
     * @param replacements Array tracking all text replacements.
     */
    generateReplacements(sourceFile, removalLocations, usages, info, replacements) {
        const { fullRemovals, partialRemovals, allRemovedIdentifiers } = removalLocations;
        const { importedSymbols, identifierCounts } = usages;
        const importManager = new checker.ImportManager();
        // Replace full arrays with empty ones. This allows preserves more of the user's formatting.
        fullRemovals.forEach((node) => {
            replacements.push(new apply_import_manager.Replacement(apply_import_manager.projectFile(sourceFile, info), new apply_import_manager.TextUpdate({
                position: node.getStart(),
                end: node.getEnd(),
                toInsert: '[]',
            })));
        });
        // Filter out the unused identifiers from an array.
        partialRemovals.forEach((toRemove, node) => {
            const newNode = ts__default["default"].factory.updateArrayLiteralExpression(node, node.elements.filter((el) => !toRemove.has(el)));
            replacements.push(new apply_import_manager.Replacement(apply_import_manager.projectFile(sourceFile, info), new apply_import_manager.TextUpdate({
                position: node.getStart(),
                end: node.getEnd(),
                toInsert: this.printer.printNode(ts__default["default"].EmitHint.Unspecified, newNode, sourceFile),
            })));
        });
        // Attempt to clean up unused import declarations. Note that this isn't foolproof, because we
        // do the matching based on identifier text, rather than going through the type checker which
        // can be expensive. This should be enough for the vast majority of cases in this schematic
        // since we're dealing exclusively with directive/pipe class names which tend to be very
        // specific. In the worst case we may end up not removing an import declaration which would
        // still be valid code that the user can clean up themselves.
        importedSymbols.forEach((names, moduleName) => {
            names.forEach((symbolName, localName) => {
                // Note that in the `identifierCounts` lookup both zero and undefined
                // are valid and mean that the identifiers isn't being used anymore.
                if (!identifierCounts.get(localName)) {
                    for (const identifier of allRemovedIdentifiers) {
                        if (identifier.text === localName) {
                            importManager.removeImport(sourceFile, symbolName, moduleName);
                            break;
                        }
                    }
                }
            });
        });
        apply_import_manager.applyImportManagerChanges(importManager, replacements, [sourceFile], info);
    }
}

function migrate() {
    return async (tree, context) => {
        const { buildPaths, testPaths } = await project_tsconfig_paths.getProjectTsConfigPaths(tree);
        if (!buildPaths.length && !testPaths.length) {
            throw new schematics.SchematicsException('Could not find any tsconfig file. Cannot clean up unused imports.');
        }
        const fs = new apply_import_manager.DevkitMigrationFilesystem(tree);
        checker.setFileSystem(fs);
        const migration = new UnusedImportsMigration();
        const unitResults = [];
        const programInfos = [...buildPaths, ...testPaths].map((tsconfigPath) => {
            context.logger.info(`Preparing analysis for ${tsconfigPath}`);
            const baseInfo = migration.createProgram(tsconfigPath, fs);
            const info = migration.prepareProgram(baseInfo);
            return { info, tsconfigPath };
        });
        for (const { info, tsconfigPath } of programInfos) {
            context.logger.info(`Scanning for unused imports using ${tsconfigPath}`);
            unitResults.push(await migration.analyze(info));
        }
        const combined = await apply_import_manager.synchronouslyCombineUnitData(migration, unitResults);
        if (combined === null) {
            context.logger.error('Schematic failed unexpectedly with no analysis data');
            return;
        }
        const globalMeta = await migration.globalMeta(combined);
        const replacementsPerFile = new Map();
        const { replacements } = await migration.migrate(globalMeta);
        const changesPerFile = apply_import_manager.groupReplacementsByFile(replacements);
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
        const { counters: { removedImports, changedFiles }, } = await migration.stats(globalMeta);
        let statsMessage;
        if (removedImports === 0) {
            statsMessage = 'Schematic could not find unused imports in the project';
        }
        else {
            statsMessage =
                `Removed ${removedImports} import${removedImports !== 1 ? 's' : ''} ` +
                    `in ${changedFiles} file${changedFiles !== 1 ? 's' : ''}`;
        }
        context.logger.info('');
        context.logger.info(statsMessage);
    };
}

exports.migrate = migrate;
