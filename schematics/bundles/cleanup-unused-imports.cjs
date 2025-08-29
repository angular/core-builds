'use strict';
/**
 * @license Angular v20.2.3+sha-8dbeac1
 * (c) 2010-2025 Google LLC. https://angular.io/
 * License: MIT
 */
'use strict';

require('@angular-devkit/core');
require('node:path/posix');
var project_paths = require('./project_paths-BUuKobrE.cjs');
var ts = require('typescript');
require('os');
var project_tsconfig_paths = require('./project_tsconfig_paths-x7xrmbI9.cjs');
var index = require('./index-CAfBb4YL.cjs');
require('path');
require('node:path');
var apply_import_manager = require('./apply_import_manager-BTXb3nRr.cjs');
require('@angular-devkit/schematics');
require('fs');
require('module');
require('url');

/** Migration that cleans up unused imports from a project. */
class UnusedImportsMigration extends project_paths.TsurgeFunnelMigration {
    printer = ts.createPrinter();
    createProgram(tsconfigAbsPath, fs) {
        return super.createProgram(tsconfigAbsPath, fs, {
            extendedDiagnostics: {
                checks: {
                    // Ensure that the diagnostic is enabled.
                    unusedStandaloneImports: index.DiagnosticCategoryLabel.Warning,
                },
            },
        });
    }
    async analyze(info) {
        const nodePositions = new Map();
        const replacements = [];
        let removedImports = 0;
        let changedFiles = 0;
        info.ngCompiler?.getDiagnostics().forEach((diag) => {
            if (diag.file !== undefined &&
                diag.start !== undefined &&
                diag.length !== undefined &&
                diag.code === project_tsconfig_paths.ngErrorCode(project_tsconfig_paths.ErrorCode.UNUSED_STANDALONE_IMPORTS)) {
                // Skip files that aren't owned by this compilation unit.
                if (!info.sourceFiles.includes(diag.file)) {
                    return;
                }
                if (!nodePositions.has(diag.file)) {
                    nodePositions.set(diag.file, new Set());
                }
                nodePositions.get(diag.file).add(this.getNodeKey(diag.start, diag.length));
            }
        });
        nodePositions.forEach((locations, sourceFile) => {
            const resolvedLocations = this.resolveRemovalLocations(sourceFile, locations);
            const usageAnalysis = this.analyzeUsages(sourceFile, resolvedLocations);
            if (resolvedLocations.allRemovedIdentifiers.size > 0) {
                removedImports += resolvedLocations.allRemovedIdentifiers.size;
                changedFiles++;
            }
            this.generateReplacements(sourceFile, resolvedLocations, usageAnalysis, info, replacements);
        });
        return project_paths.confirmAsSerializable({ replacements, removedImports, changedFiles });
    }
    async migrate(globalData) {
        return project_paths.confirmAsSerializable(globalData);
    }
    async combine(unitA, unitB) {
        return project_paths.confirmAsSerializable({
            replacements: [...unitA.replacements, ...unitB.replacements],
            removedImports: unitA.removedImports + unitB.removedImports,
            changedFiles: unitA.changedFiles + unitB.changedFiles,
        });
    }
    async globalMeta(combinedData) {
        return project_paths.confirmAsSerializable(combinedData);
    }
    async stats(globalMetadata) {
        return project_paths.confirmAsSerializable({
            removedImports: globalMetadata.removedImports,
            changedFiles: globalMetadata.changedFiles,
        });
    }
    /** Gets a key that can be used to look up a node based on its location. */
    getNodeKey(start, length) {
        return `${start}/${length}`;
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
            if (!ts.isIdentifier(node)) {
                node.forEachChild(walk);
                return;
            }
            // The TS typings don't reflect that the parent can be undefined.
            const parent = node.parent;
            if (!parent) {
                return;
            }
            if (locations.has(this.getNodeKey(node.getStart(), node.getWidth()))) {
                // When the entire array needs to be cleared, the diagnostic is
                // reported on the property assignment, rather than an array element.
                if (ts.isPropertyAssignment(parent) &&
                    parent.name === node &&
                    ts.isArrayLiteralExpression(parent.initializer)) {
                    result.fullRemovals.add(parent.initializer);
                    parent.initializer.elements.forEach((element) => {
                        if (ts.isIdentifier(element)) {
                            result.allRemovedIdentifiers.add(element.text);
                        }
                    });
                }
                else if (ts.isArrayLiteralExpression(parent)) {
                    if (!result.partialRemovals.has(parent)) {
                        result.partialRemovals.set(parent, new Set());
                    }
                    result.partialRemovals.get(parent).add(node);
                    result.allRemovedIdentifiers.add(node.text);
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
            if (ts.isIdentifier(node) &&
                node.parent &&
                // Don't track individual identifiers marked for removal.
                (!ts.isArrayLiteralExpression(node.parent) ||
                    !partialRemovals.has(node.parent) ||
                    !partialRemovals.get(node.parent).has(node))) {
                result.identifierCounts.set(node.text, (result.identifierCounts.get(node.text) ?? 0) + 1);
            }
            // Don't track identifiers in array literals that are about to be removed.
            if (ts.isArrayLiteralExpression(node) && fullRemovals.has(node)) {
                return;
            }
            if (ts.isImportDeclaration(node)) {
                const namedBindings = node.importClause?.namedBindings;
                const moduleName = ts.isStringLiteral(node.moduleSpecifier)
                    ? node.moduleSpecifier.text
                    : null;
                if (namedBindings && ts.isNamedImports(namedBindings) && moduleName !== null) {
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
        const importManager = new project_tsconfig_paths.ImportManager();
        const sourceText = sourceFile.getFullText();
        // Replace full arrays with empty ones. This allows preserves more of the user's formatting.
        fullRemovals.forEach((node) => {
            replacements.push(new project_paths.Replacement(project_paths.projectFile(sourceFile, info), new project_paths.TextUpdate({
                position: node.getStart(),
                end: node.getEnd(),
                toInsert: '[]',
            })));
        });
        // Filter out the unused identifiers from an array.
        partialRemovals.forEach((toRemove, parent) => {
            toRemove.forEach((node) => {
                replacements.push(new project_paths.Replacement(project_paths.projectFile(sourceFile, info), getArrayElementRemovalUpdate(node, sourceText)));
            });
            stripTrailingSameLineCommas(parent, toRemove, sourceText)?.forEach((update) => {
                replacements.push(new project_paths.Replacement(project_paths.projectFile(sourceFile, info), update));
            });
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
                if (allRemovedIdentifiers.has(localName) && !identifierCounts.get(localName)) {
                    importManager.removeImport(sourceFile, symbolName, moduleName);
                }
            });
        });
        apply_import_manager.applyImportManagerChanges(importManager, replacements, [sourceFile], info);
    }
}
/** Generates a `TextUpdate` for the removal of an array element. */
function getArrayElementRemovalUpdate(node, sourceText) {
    let position = node.getStart();
    let end = node.getEnd();
    let toInsert = '';
    const whitespaceOrLineFeed = /\s/;
    // Usually the way we'd remove the nodes would be to recreate the `parent` while excluding
    // the nodes that should be removed. The problem with this is that it'll strip out comments
    // inside the array which can have special meaning internally. We work around it by removing
    // only the node's own offsets. This comes with another problem in that it won't remove the commas
    // that separate array elements which in turn can look weird if left in place (e.g.
    // `[One, Two, Three, Four]` can turn into `[One,,Four]`). To account for them, we start with the
    // node's end offset and then expand it to include trailing commas, whitespace and line breaks.
    for (let i = end; i < sourceText.length; i++) {
        if (sourceText[i] === ',' || whitespaceOrLineFeed.test(sourceText[i])) {
            end++;
        }
        else {
            break;
        }
    }
    return new project_paths.TextUpdate({ position, end, toInsert });
}
/** Returns `TextUpdate`s that will remove any leftover trailing commas on the same line. */
function stripTrailingSameLineCommas(node, toRemove, sourceText) {
    let updates = null;
    for (let i = 0; i < node.elements.length; i++) {
        // Skip over elements that are being removed already.
        if (toRemove.has(node.elements[i])) {
            continue;
        }
        // An element might have a trailing comma if all elements after it have been removed.
        const mightHaveTrailingComma = node.elements.slice(i + 1).every((e) => toRemove.has(e));
        if (!mightHaveTrailingComma) {
            continue;
        }
        const position = node.elements[i].getEnd();
        let end = position;
        // If the item might have a trailing comma, start looking after it until we hit a line break.
        for (let charIndex = position; charIndex < node.getEnd(); charIndex++) {
            const char = sourceText[charIndex];
            if (char === ',' || char === ' ') {
                end++;
            }
            else {
                if (char !== '\n' && position !== end) {
                    updates ??= [];
                    updates.push(new project_paths.TextUpdate({ position, end, toInsert: '' }));
                }
                break;
            }
        }
    }
    return updates;
}

function migrate() {
    return async (tree, context) => {
        await project_paths.runMigrationInDevkit({
            getMigration: () => new UnusedImportsMigration(),
            tree,
            beforeProgramCreation: (tsconfigPath, stage) => {
                if (stage === project_paths.MigrationStage.Analysis) {
                    context.logger.info(`Preparing analysis for: ${tsconfigPath}...`);
                }
                else {
                    context.logger.info(`Running migration for: ${tsconfigPath}...`);
                }
            },
            beforeUnitAnalysis: (tsconfigPath) => {
                context.logger.info(`Scanning for unused imports using ${tsconfigPath}`);
            },
            afterAnalysisFailure: () => {
                context.logger.error('Schematic failed unexpectedly with no analysis data');
            },
            whenDone: ({ removedImports, changedFiles }) => {
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
            },
        });
    };
}

exports.migrate = migrate;
