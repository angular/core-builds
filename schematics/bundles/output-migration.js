'use strict';
/**
 * @license Angular v19.0.0-rc.2+sha-ee49947
 * (c) 2010-2024 Google LLC. https://angular.io/
 * License: MIT
 */
'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var schematics = require('@angular-devkit/schematics');
var project_tsconfig_paths = require('./project_tsconfig_paths-e9ccccbf.js');
var combine_units = require('./combine_units-528c4a5d.js');
require('os');
var ts = require('typescript');
var checker = require('./checker-cd95ebda.js');
var program = require('./program-8f30df93.js');
require('path');
require('@angular-devkit/core');
require('node:path/posix');
require('fs');
require('module');
require('url');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var ts__default = /*#__PURE__*/_interopDefaultLegacy(ts);

function isOutputDeclarationEligibleForMigration(node) {
    return (node.initializer !== undefined &&
        ts__default["default"].isNewExpression(node.initializer) &&
        ts__default["default"].isIdentifier(node.initializer.expression) &&
        node.initializer.expression.text === 'EventEmitter');
}
function isPotentialOutputCallUsage(node, name) {
    if (ts__default["default"].isCallExpression(node) &&
        ts__default["default"].isPropertyAccessExpression(node.expression) &&
        ts__default["default"].isIdentifier(node.expression.name)) {
        return node.expression?.name.text === name;
    }
    else {
        return false;
    }
}
function isPotentialPipeCallUsage(node) {
    return isPotentialOutputCallUsage(node, 'pipe');
}
function isPotentialNextCallUsage(node) {
    return isPotentialOutputCallUsage(node, 'next');
}
function isPotentialCompleteCallUsage(node) {
    return isPotentialOutputCallUsage(node, 'complete');
}
function isTargetOutputDeclaration(node, checker, reflector, dtsReader) {
    const targetSymbol = checker.getSymbolAtLocation(node);
    if (targetSymbol !== undefined) {
        const propertyDeclaration = getTargetPropertyDeclaration(targetSymbol);
        if (propertyDeclaration !== null &&
            isOutputDeclaration(propertyDeclaration, reflector, dtsReader)) {
            return propertyDeclaration;
        }
    }
    return null;
}
/** Gets whether the given property is an Angular `@Output`. */
function isOutputDeclaration(node, reflector, dtsReader) {
    // `.d.ts` file, so we check the `static ecmp` metadata on the `declare class`.
    if (node.getSourceFile().isDeclarationFile) {
        if (!ts__default["default"].isIdentifier(node.name) ||
            !ts__default["default"].isClassDeclaration(node.parent) ||
            node.parent.name === undefined) {
            return false;
        }
        const ref = new checker.Reference(node.parent);
        const directiveMeta = dtsReader.getDirectiveMetadata(ref);
        return !!directiveMeta?.outputs.getByClassPropertyName(node.name.text);
    }
    // `.ts` file, so we check for the `@Output()` decorator.
    return getOutputDecorator(node, reflector) !== null;
}
function getTargetPropertyDeclaration(targetSymbol) {
    const valDeclaration = targetSymbol.valueDeclaration;
    if (valDeclaration !== undefined && ts__default["default"].isPropertyDeclaration(valDeclaration)) {
        return valDeclaration;
    }
    return null;
}
/** Returns Angular `@Output` decorator or null when a given property declaration is not an @Output */
function getOutputDecorator(node, reflector) {
    const decorators = reflector.getDecoratorsOfDeclaration(node);
    const ngDecorators = decorators !== null ? checker.getAngularDecorators(decorators, ['Output'], /* isCore */ false) : [];
    return ngDecorators.length > 0 ? ngDecorators[0] : null;
}
// THINK: this utility + type is not specific to @Output, really, maybe move it to tsurge?
/** Computes an unique ID for a given Angular `@Output` property. */
function getUniqueIdForProperty(info, prop) {
    const { id } = combine_units.projectFile(prop.getSourceFile(), info);
    id.replace(/\.d\.ts$/, '.ts');
    return `${id}@@${prop.parent.name ?? 'unknown-class'}@@${prop.name.getText()}`;
}
function isTestRunnerImport(node) {
    if (ts__default["default"].isImportDeclaration(node)) {
        const moduleSpecifier = node.moduleSpecifier.getText();
        return moduleSpecifier.includes('jasmine') || moduleSpecifier.includes('catalyst');
    }
    return false;
}
// TODO: code duplication with signals migration - sort it out
/**
 * Gets whether the given read is used to access
 * the specified field.
 *
 * E.g. whether `<my-read>.toArray` is detected.
 */
function checkNonTsReferenceAccessesField(ref, fieldName) {
    const readFromPath = ref.from.readAstPath.at(-1);
    const parentRead = ref.from.readAstPath.at(-2);
    if (ref.from.read !== readFromPath) {
        return null;
    }
    if (!(parentRead instanceof checker.PropertyRead) || parentRead.name !== fieldName) {
        return null;
    }
    return parentRead;
}
/**
 * Gets whether the given reference is accessed to call the
 * specified function on it.
 *
 * E.g. whether `<my-read>.toArray()` is detected.
 */
function checkNonTsReferenceCallsField(ref, fieldName) {
    const propertyAccess = checkNonTsReferenceAccessesField(ref, fieldName);
    if (propertyAccess === null) {
        return null;
    }
    const accessIdx = ref.from.readAstPath.indexOf(propertyAccess);
    if (accessIdx === -1) {
        return null;
    }
    const potentialRead = ref.from.readAstPath[accessIdx];
    if (potentialRead === undefined) {
        return null;
    }
    return potentialRead;
}

const printer = ts__default["default"].createPrinter();
function calculateDeclarationReplacement(info, node, aliasParam) {
    const sf = node.getSourceFile();
    const payloadTypes = node.initializer !== undefined && ts__default["default"].isNewExpression(node.initializer)
        ? node.initializer?.typeArguments
        : undefined;
    const outputCall = ts__default["default"].factory.createCallExpression(ts__default["default"].factory.createIdentifier('output'), payloadTypes, aliasParam !== undefined
        ? [
            ts__default["default"].factory.createObjectLiteralExpression([
                ts__default["default"].factory.createPropertyAssignment('alias', ts__default["default"].factory.createStringLiteral(aliasParam, true)),
            ], false),
        ]
        : []);
    const existingModifiers = (node.modifiers ?? []).filter((modifier) => !ts__default["default"].isDecorator(modifier) && modifier.kind !== ts__default["default"].SyntaxKind.ReadonlyKeyword);
    const updatedOutputDeclaration = ts__default["default"].factory.createPropertyDeclaration(
    // Think: this logic of dealing with modifiers is applicable to all signal-based migrations
    ts__default["default"].factory.createNodeArray([
        ...existingModifiers,
        ts__default["default"].factory.createModifier(ts__default["default"].SyntaxKind.ReadonlyKeyword),
    ]), node.name, undefined, undefined, outputCall);
    return prepareTextReplacementForNode(info, node, printer.printNode(ts__default["default"].EmitHint.Unspecified, updatedOutputDeclaration, sf));
}
function calculateImportReplacements(info, sourceFiles) {
    const importReplacements = {};
    for (const sf of sourceFiles) {
        const importManager = new checker.ImportManager();
        const addOnly = [];
        const addRemove = [];
        const file = combine_units.projectFile(sf, info);
        importManager.addImport({
            requestedFile: sf,
            exportModuleSpecifier: '@angular/core',
            exportSymbolName: 'output',
        });
        combine_units.applyImportManagerChanges(importManager, addOnly, [sf], info);
        importManager.removeImport(sf, 'Output', '@angular/core');
        importManager.removeImport(sf, 'EventEmitter', '@angular/core');
        combine_units.applyImportManagerChanges(importManager, addRemove, [sf], info);
        importReplacements[file.id] = {
            add: addOnly,
            addAndRemove: addRemove,
        };
    }
    return importReplacements;
}
function calculateNextFnReplacement(info, node) {
    return prepareTextReplacementForNode(info, node, 'emit');
}
function calculateNextFnReplacementInTemplate(file, span) {
    return prepareTextReplacement(file, 'emit', span.start, span.end);
}
function calculateNextFnReplacementInHostBinding(file, offset, span) {
    return prepareTextReplacement(file, 'emit', offset + span.start, offset + span.end);
}
function calculateCompleteCallReplacement(info, node) {
    return prepareTextReplacementForNode(info, node, '', node.getFullStart());
}
function calculatePipeCallReplacement(info, node) {
    if (ts__default["default"].isPropertyAccessExpression(node.expression)) {
        const sf = node.getSourceFile();
        const importManager = new checker.ImportManager();
        const outputToObservableIdent = importManager.addImport({
            requestedFile: sf,
            exportModuleSpecifier: '@angular/core/rxjs-interop',
            exportSymbolName: 'outputToObservable',
        });
        const toObsCallExp = ts__default["default"].factory.createCallExpression(outputToObservableIdent, undefined, [
            node.expression.expression,
        ]);
        const pipePropAccessExp = ts__default["default"].factory.updatePropertyAccessExpression(node.expression, toObsCallExp, node.expression.name);
        const pipeCallExp = ts__default["default"].factory.updateCallExpression(node, pipePropAccessExp, [], node.arguments);
        const replacements = [
            prepareTextReplacementForNode(info, node, printer.printNode(ts__default["default"].EmitHint.Unspecified, pipeCallExp, sf)),
        ];
        combine_units.applyImportManagerChanges(importManager, replacements, [sf], info);
        return replacements;
    }
    else {
        // TODO: assert instead?
        throw new Error(`Unexpected call expression for .pipe - expected a property access but got "${node.getText()}"`);
    }
}
function prepareTextReplacementForNode(info, node, replacement, start) {
    const sf = node.getSourceFile();
    return new combine_units.Replacement(combine_units.projectFile(sf, info), new combine_units.TextUpdate({
        position: start ?? node.getStart(),
        end: node.getEnd(),
        toInsert: replacement,
    }));
}
function prepareTextReplacement(file, replacement, start, end) {
    return new combine_units.Replacement(file, new combine_units.TextUpdate({
        position: start,
        end: end,
        toInsert: replacement,
    }));
}

class OutputMigration extends combine_units.TsurgeFunnelMigration {
    config;
    constructor(config = {}) {
        super();
        this.config = config;
    }
    async analyze(info) {
        const { sourceFiles, program: program$1 } = info;
        const outputFieldReplacements = {};
        const problematicUsages = {};
        let problematicDeclarationCount = 0;
        const filesWithOutputDeclarations = new Set();
        const checker$1 = program$1.getTypeChecker();
        const reflector = new checker.TypeScriptReflectionHost(checker$1);
        const dtsReader = new program.DtsMetadataReader(checker$1, reflector);
        const evaluator = new program.PartialEvaluator(reflector, checker$1, null);
        const resourceLoader = info.ngCompiler?.['resourceManager'] ?? null;
        // Pre-analyze the program and get access to the template type checker.
        // If we are processing a non-Angular target, there is no template info.
        const { templateTypeChecker } = info.ngCompiler?.['ensureAnalyzed']() ?? {
            templateTypeChecker: null,
        };
        const knownFields = {
            // Note: We don't support cross-target migration of `Partial<T>` usages.
            // This is an acceptable limitation for performance reasons.
            shouldTrackClassReference: (node) => false,
            attemptRetrieveDescriptorFromSymbol: (s) => {
                const propDeclaration = getTargetPropertyDeclaration(s);
                if (propDeclaration !== null) {
                    const classFieldID = getUniqueIdForProperty(info, propDeclaration);
                    if (classFieldID !== null) {
                        return {
                            node: propDeclaration,
                            key: classFieldID,
                        };
                    }
                }
                return null;
            },
        };
        let isTestFile = false;
        const outputMigrationVisitor = (node) => {
            // detect output declarations
            if (ts__default["default"].isPropertyDeclaration(node)) {
                const outputDecorator = getOutputDecorator(node, reflector);
                if (outputDecorator !== null) {
                    if (isOutputDeclarationEligibleForMigration(node)) {
                        const outputDef = {
                            id: getUniqueIdForProperty(info, node),
                            aliasParam: outputDecorator.args?.at(0),
                        };
                        const outputFile = combine_units.projectFile(node.getSourceFile(), info);
                        if (this.config.shouldMigrate === undefined ||
                            this.config.shouldMigrate({
                                key: outputDef.id,
                                node: node,
                            }, outputFile)) {
                            const aliasParam = outputDef.aliasParam;
                            const aliasOptionValue = aliasParam ? evaluator.evaluate(aliasParam) : undefined;
                            if (aliasOptionValue == undefined || typeof aliasOptionValue === 'string') {
                                filesWithOutputDeclarations.add(node.getSourceFile());
                                addOutputReplacement(outputFieldReplacements, outputDef.id, outputFile, calculateDeclarationReplacement(info, node, aliasOptionValue?.toString()));
                            }
                            else {
                                problematicUsages[outputDef.id] = true;
                                problematicDeclarationCount++;
                            }
                        }
                    }
                    else {
                        problematicDeclarationCount++;
                    }
                }
            }
            // detect .next usages that should be migrated to .emit
            if (isPotentialNextCallUsage(node) && ts__default["default"].isPropertyAccessExpression(node.expression)) {
                const propertyDeclaration = isTargetOutputDeclaration(node.expression.expression, checker$1, reflector, dtsReader);
                if (propertyDeclaration !== null) {
                    const id = getUniqueIdForProperty(info, propertyDeclaration);
                    const outputFile = combine_units.projectFile(node.getSourceFile(), info);
                    addOutputReplacement(outputFieldReplacements, id, outputFile, calculateNextFnReplacement(info, node.expression.name));
                }
            }
            // detect .complete usages that should be removed
            if (isPotentialCompleteCallUsage(node) && ts__default["default"].isPropertyAccessExpression(node.expression)) {
                const propertyDeclaration = isTargetOutputDeclaration(node.expression.expression, checker$1, reflector, dtsReader);
                if (propertyDeclaration !== null) {
                    const id = getUniqueIdForProperty(info, propertyDeclaration);
                    const outputFile = combine_units.projectFile(node.getSourceFile(), info);
                    if (ts__default["default"].isExpressionStatement(node.parent)) {
                        addOutputReplacement(outputFieldReplacements, id, outputFile, calculateCompleteCallReplacement(info, node.parent));
                    }
                    else {
                        problematicUsages[id] = true;
                    }
                }
            }
            // detect imports of test runners
            if (isTestRunnerImport(node)) {
                isTestFile = true;
            }
            // detect unsafe access of the output property
            if (isPotentialPipeCallUsage(node) && ts__default["default"].isPropertyAccessExpression(node.expression)) {
                const propertyDeclaration = isTargetOutputDeclaration(node.expression.expression, checker$1, reflector, dtsReader);
                if (propertyDeclaration !== null) {
                    const id = getUniqueIdForProperty(info, propertyDeclaration);
                    if (isTestFile) {
                        const outputFile = combine_units.projectFile(node.getSourceFile(), info);
                        addOutputReplacement(outputFieldReplacements, id, outputFile, ...calculatePipeCallReplacement(info, node));
                    }
                    else {
                        problematicUsages[id] = true;
                    }
                }
            }
            ts__default["default"].forEachChild(node, outputMigrationVisitor);
        };
        // calculate output migration replacements
        for (const sf of sourceFiles) {
            isTestFile = false;
            ts__default["default"].forEachChild(sf, outputMigrationVisitor);
        }
        // take care of the references in templates and host bindings
        const referenceResult = { references: [] };
        const { visitor: templateHostRefVisitor } = combine_units.createFindAllSourceFileReferencesVisitor(info, checker$1, reflector, resourceLoader, evaluator, templateTypeChecker, knownFields, null, // TODO: capture known output names as an optimization
        referenceResult);
        // calculate template / host binding replacements
        for (const sf of sourceFiles) {
            ts__default["default"].forEachChild(sf, templateHostRefVisitor);
        }
        for (const ref of referenceResult.references) {
            // detect .next usages that should be migrated to .emit in template and host binding expressions
            if (ref.kind === combine_units.ReferenceKind.InTemplate) {
                const callExpr = checkNonTsReferenceCallsField(ref, 'next');
                if (callExpr !== null) {
                    addOutputReplacement(outputFieldReplacements, ref.target.key, ref.from.templateFile, calculateNextFnReplacementInTemplate(ref.from.templateFile, callExpr.nameSpan));
                }
            }
            else if (ref.kind === combine_units.ReferenceKind.InHostBinding) {
                const callExpr = checkNonTsReferenceCallsField(ref, 'next');
                if (callExpr !== null) {
                    addOutputReplacement(outputFieldReplacements, ref.target.key, ref.from.file, calculateNextFnReplacementInHostBinding(ref.from.file, ref.from.hostPropertyNode.getStart() + 1, callExpr.nameSpan));
                }
            }
        }
        // calculate import replacements but do so only for files that have output declarations
        const importReplacements = calculateImportReplacements(info, filesWithOutputDeclarations);
        return combine_units.confirmAsSerializable({
            problematicDeclarationCount,
            outputFields: outputFieldReplacements,
            importReplacements,
            problematicUsages,
        });
    }
    async combine(unitA, unitB) {
        const outputFields = {};
        const importReplacements = {};
        const problematicUsages = {};
        let problematicDeclarationCount = 0;
        for (const unit of [unitA, unitB]) {
            for (const declIdStr of Object.keys(unit.outputFields)) {
                const declId = declIdStr;
                // THINK: detect clash? Should we have an utility to merge data based on unique IDs?
                outputFields[declId] = unit.outputFields[declId];
            }
            for (const fileIDStr of Object.keys(unit.importReplacements)) {
                const fileID = fileIDStr;
                importReplacements[fileID] = unit.importReplacements[fileID];
            }
            problematicDeclarationCount += unit.problematicDeclarationCount;
        }
        for (const unit of [unitA, unitB]) {
            for (const declIdStr of Object.keys(unit.problematicUsages)) {
                const declId = declIdStr;
                problematicUsages[declId] = unit.problematicUsages[declId];
            }
        }
        return combine_units.confirmAsSerializable({
            problematicDeclarationCount,
            outputFields,
            importReplacements,
            problematicUsages,
        });
    }
    async globalMeta(combinedData) {
        const globalMeta = {
            importReplacements: combinedData.importReplacements,
            outputFields: combinedData.outputFields,
            problematicDeclarationCount: combinedData.problematicDeclarationCount,
            problematicUsages: {},
        };
        for (const keyStr of Object.keys(combinedData.problematicUsages)) {
            const key = keyStr;
            // it might happen that a problematic usage is detected but we didn't see the declaration - skipping those
            if (globalMeta.outputFields[key] !== undefined) {
                globalMeta.problematicUsages[key] = true;
            }
        }
        // Noop here as we don't have any form of special global metadata.
        return combine_units.confirmAsSerializable(combinedData);
    }
    async stats(globalMetadata) {
        const detectedOutputs = new Set(Object.keys(globalMetadata.outputFields)).size +
            globalMetadata.problematicDeclarationCount;
        const problematicOutputs = new Set(Object.keys(globalMetadata.problematicUsages)).size +
            globalMetadata.problematicDeclarationCount;
        const successRate = detectedOutputs > 0 ? (detectedOutputs - problematicOutputs) / detectedOutputs : 1;
        return {
            counters: {
                detectedOutputs,
                problematicOutputs,
                successRate,
            },
        };
    }
    async migrate(globalData) {
        const migratedFiles = new Set();
        const problematicFiles = new Set();
        const replacements = [];
        for (const declIdStr of Object.keys(globalData.outputFields)) {
            const declId = declIdStr;
            const outputField = globalData.outputFields[declId];
            if (!globalData.problematicUsages[declId]) {
                replacements.push(...outputField.replacements);
                migratedFiles.add(outputField.file.id);
            }
            else {
                problematicFiles.add(outputField.file.id);
            }
        }
        for (const fileIDStr of Object.keys(globalData.importReplacements)) {
            const fileID = fileIDStr;
            if (migratedFiles.has(fileID)) {
                const importReplacements = globalData.importReplacements[fileID];
                if (problematicFiles.has(fileID)) {
                    replacements.push(...importReplacements.add);
                }
                else {
                    replacements.push(...importReplacements.addAndRemove);
                }
            }
        }
        return { replacements };
    }
}
function addOutputReplacement(outputFieldReplacements, outputId, file, ...replacements) {
    let existingReplacements = outputFieldReplacements[outputId];
    if (existingReplacements === undefined) {
        outputFieldReplacements[outputId] = existingReplacements = {
            file: file,
            replacements: [],
        };
    }
    existingReplacements.replacements.push(...replacements);
}

function migrate(options) {
    return async (tree, context) => {
        const { buildPaths, testPaths } = await project_tsconfig_paths.getProjectTsConfigPaths(tree);
        if (!buildPaths.length && !testPaths.length) {
            throw new schematics.SchematicsException('Could not find any tsconfig file. Cannot run output migration.');
        }
        const fs = new combine_units.DevkitMigrationFilesystem(tree);
        checker.setFileSystem(fs);
        const migration = new OutputMigration({
            shouldMigrate: (_, file) => {
                return (file.rootRelativePath.startsWith(fs.normalize(options.path)) &&
                    !/(^|\/)node_modules\//.test(file.rootRelativePath));
            },
        });
        const analysisPath = fs.resolve(options.analysisDir);
        const unitResults = [];
        const programInfos = [...buildPaths, ...testPaths].map((tsconfigPath) => {
            context.logger.info(`Preparing analysis for: ${tsconfigPath}..`);
            const baseInfo = migration.createProgram(tsconfigPath, fs);
            const info = migration.prepareProgram(baseInfo);
            // Support restricting the analysis to subfolders for larger projects.
            if (analysisPath !== '/') {
                info.sourceFiles = info.sourceFiles.filter((sf) => sf.fileName.startsWith(analysisPath));
                info.fullProgramSourceFiles = info.fullProgramSourceFiles.filter((sf) => sf.fileName.startsWith(analysisPath));
            }
            return { info, tsconfigPath };
        });
        // Analyze phase. Treat all projects as compilation units as
        // this allows us to support references between those.
        for (const { info, tsconfigPath } of programInfos) {
            context.logger.info(`Scanning for outputs: ${tsconfigPath}..`);
            unitResults.push(await migration.analyze(info));
        }
        context.logger.info(``);
        context.logger.info(`Processing analysis data between targets..`);
        context.logger.info(``);
        const combined = await combine_units.synchronouslyCombineUnitData(migration, unitResults);
        if (combined === null) {
            context.logger.error('Migration failed unexpectedly with no analysis data');
            return;
        }
        const globalMeta = await migration.globalMeta(combined);
        const replacementsPerFile = new Map();
        for (const { info, tsconfigPath } of programInfos) {
            context.logger.info(`Migrating: ${tsconfigPath}..`);
            const { replacements } = await migration.migrate(globalMeta);
            const changesPerFile = combine_units.groupReplacementsByFile(replacements);
            for (const [file, changes] of changesPerFile) {
                if (!replacementsPerFile.has(file)) {
                    replacementsPerFile.set(file, changes);
                }
            }
        }
        context.logger.info(`Applying changes..`);
        for (const [file, changes] of replacementsPerFile) {
            const recorder = tree.beginUpdate(file);
            for (const c of changes) {
                recorder
                    .remove(c.data.position, c.data.end - c.data.position)
                    .insertLeft(c.data.position, c.data.toInsert);
            }
            tree.commitUpdate(recorder);
        }
        const { counters: { detectedOutputs, problematicOutputs, successRate }, } = await migration.stats(globalMeta);
        const migratedOutputs = detectedOutputs - problematicOutputs;
        const successRatePercent = (successRate * 100).toFixed(2);
        context.logger.info('');
        context.logger.info(`Successfully migrated to outputs as functions 🎉`);
        context.logger.info(`  -> Migrated ${migratedOutputs} out of ${detectedOutputs} detected outputs (${successRatePercent} %).`);
    };
}

exports.migrate = migrate;
