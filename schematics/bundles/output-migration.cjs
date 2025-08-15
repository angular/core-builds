'use strict';
/**
 * @license Angular v21.0.0-next.0+sha-5b3933f
 * (c) 2010-2025 Google LLC. https://angular.io/
 * License: MIT
 */
'use strict';

var ts = require('typescript');
require('os');
var project_tsconfig_paths = require('./project_tsconfig_paths-DtmVce5c.cjs');
var index$1 = require('./index-CemzBQg4.cjs');
require('path');
require('node:path');
var project_paths = require('./project_paths-DGXGVgq0.cjs');
var apply_import_manager = require('./apply_import_manager-CVMm1tCA.cjs');
var index = require('./index-Bz0SM_tp.cjs');
require('@angular-devkit/core');
require('node:path/posix');
require('fs');
require('module');
require('url');
require('@angular-devkit/schematics');

function isOutputDeclarationEligibleForMigration(node) {
    return (node.initializer !== undefined &&
        ts.isNewExpression(node.initializer) &&
        ts.isIdentifier(node.initializer.expression) &&
        node.initializer.expression.text === 'EventEmitter');
}
function isPotentialOutputCallUsage(node, name) {
    if (ts.isCallExpression(node) &&
        ts.isPropertyAccessExpression(node.expression) &&
        ts.isIdentifier(node.expression.name)) {
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
        if (!ts.isIdentifier(node.name) ||
            !ts.isClassDeclaration(node.parent) ||
            node.parent.name === undefined) {
            return false;
        }
        const ref = new project_tsconfig_paths.Reference(node.parent);
        const directiveMeta = dtsReader.getDirectiveMetadata(ref);
        return !!directiveMeta?.outputs.getByClassPropertyName(node.name.text);
    }
    // `.ts` file, so we check for the `@Output()` decorator.
    return getOutputDecorator(node, reflector) !== null;
}
function getTargetPropertyDeclaration(targetSymbol) {
    const valDeclaration = targetSymbol.valueDeclaration;
    if (valDeclaration !== undefined && ts.isPropertyDeclaration(valDeclaration)) {
        return valDeclaration;
    }
    return null;
}
/** Returns Angular `@Output` decorator or null when a given property declaration is not an @Output */
function getOutputDecorator(node, reflector) {
    const decorators = reflector.getDecoratorsOfDeclaration(node);
    const ngDecorators = decorators !== null ? project_tsconfig_paths.getAngularDecorators(decorators, ['Output'], /* isCore */ false) : [];
    return ngDecorators.length > 0 ? ngDecorators[0] : null;
}
// THINK: this utility + type is not specific to @Output, really, maybe move it to tsurge?
/** Computes an unique ID for a given Angular `@Output` property. */
function getUniqueIdForProperty(info, prop) {
    const { id } = project_paths.projectFile(prop.getSourceFile(), info);
    id.replace(/\.d\.ts$/, '.ts');
    return `${id}@@${prop.parent.name ?? 'unknown-class'}@@${prop.name.getText()}`;
}
function isTestRunnerImport(node) {
    if (ts.isImportDeclaration(node)) {
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
    if (!(parentRead instanceof project_tsconfig_paths.PropertyRead) || parentRead.name !== fieldName) {
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

const printer = ts.createPrinter();
function calculateDeclarationReplacement(info, node, aliasParam) {
    const sf = node.getSourceFile();
    let payloadTypes;
    if (node.initializer && ts.isNewExpression(node.initializer) && node.initializer.typeArguments) {
        payloadTypes = node.initializer.typeArguments;
    }
    else if (node.type && ts.isTypeReferenceNode(node.type) && node.type.typeArguments) {
        payloadTypes = ts.factory.createNodeArray(node.type.typeArguments);
    }
    const outputCall = ts.factory.createCallExpression(ts.factory.createIdentifier('output'), payloadTypes, aliasParam !== undefined
        ? [
            ts.factory.createObjectLiteralExpression([
                ts.factory.createPropertyAssignment('alias', ts.factory.createStringLiteral(aliasParam, true)),
            ], false),
        ]
        : []);
    const existingModifiers = (node.modifiers ?? []).filter((modifier) => !ts.isDecorator(modifier) && modifier.kind !== ts.SyntaxKind.ReadonlyKeyword);
    const updatedOutputDeclaration = ts.factory.createPropertyDeclaration(
    // Think: this logic of dealing with modifiers is applicable to all signal-based migrations
    ts.factory.createNodeArray([
        ...existingModifiers,
        ts.factory.createModifier(ts.SyntaxKind.ReadonlyKeyword),
    ]), node.name, undefined, undefined, outputCall);
    return prepareTextReplacementForNode(info, node, printer.printNode(ts.EmitHint.Unspecified, updatedOutputDeclaration, sf));
}
function calculateImportReplacements(info, sourceFiles) {
    const importReplacements = {};
    for (const sf of sourceFiles) {
        const importManager = new project_tsconfig_paths.ImportManager();
        const addOnly = [];
        const addRemove = [];
        const file = project_paths.projectFile(sf, info);
        importManager.addImport({
            requestedFile: sf,
            exportModuleSpecifier: '@angular/core',
            exportSymbolName: 'output',
        });
        apply_import_manager.applyImportManagerChanges(importManager, addOnly, [sf], info);
        importManager.removeImport(sf, 'Output', '@angular/core');
        importManager.removeImport(sf, 'EventEmitter', '@angular/core');
        apply_import_manager.applyImportManagerChanges(importManager, addRemove, [sf], info);
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
    if (ts.isPropertyAccessExpression(node.expression)) {
        const sf = node.getSourceFile();
        const importManager = new project_tsconfig_paths.ImportManager();
        const outputToObservableIdent = importManager.addImport({
            requestedFile: sf,
            exportModuleSpecifier: '@angular/core/rxjs-interop',
            exportSymbolName: 'outputToObservable',
        });
        const toObsCallExp = ts.factory.createCallExpression(outputToObservableIdent, undefined, [
            node.expression.expression,
        ]);
        const pipePropAccessExp = ts.factory.updatePropertyAccessExpression(node.expression, toObsCallExp, node.expression.name);
        const pipeCallExp = ts.factory.updateCallExpression(node, pipePropAccessExp, [], node.arguments);
        const replacements = [
            prepareTextReplacementForNode(info, node, printer.printNode(ts.EmitHint.Unspecified, pipeCallExp, sf)),
        ];
        apply_import_manager.applyImportManagerChanges(importManager, replacements, [sf], info);
        return replacements;
    }
    else {
        // TODO: assert instead?
        throw new Error(`Unexpected call expression for .pipe - expected a property access but got "${node.getText()}"`);
    }
}
function prepareTextReplacementForNode(info, node, replacement, start) {
    const sf = node.getSourceFile();
    return new project_paths.Replacement(project_paths.projectFile(sf, info), new project_paths.TextUpdate({
        position: start ?? node.getStart(),
        end: node.getEnd(),
        toInsert: replacement,
    }));
}
function prepareTextReplacement(file, replacement, start, end) {
    return new project_paths.Replacement(file, new project_paths.TextUpdate({
        position: start,
        end: end,
        toInsert: replacement,
    }));
}

class OutputMigration extends project_paths.TsurgeFunnelMigration {
    config;
    constructor(config = {}) {
        super();
        this.config = config;
    }
    async analyze(info) {
        const { sourceFiles, program } = info;
        const outputFieldReplacements = {};
        const problematicUsages = {};
        let problematicDeclarationCount = 0;
        const filesWithOutputDeclarations = new Set();
        const checker = program.getTypeChecker();
        const reflector = new project_tsconfig_paths.TypeScriptReflectionHost(checker);
        const dtsReader = new index$1.DtsMetadataReader(checker, reflector);
        const evaluator = new index$1.PartialEvaluator(reflector, checker, null);
        const resourceLoader = info.ngCompiler?.['resourceManager'] ?? null;
        // Pre-analyze the program and get access to the template type checker.
        // If we are processing a non-Angular target, there is no template info.
        const { templateTypeChecker } = info.ngCompiler?.['ensureAnalyzed']() ?? {
            templateTypeChecker: null,
        };
        const knownFields = {
            // Note: We don't support cross-target migration of `Partial<T>` usages.
            // This is an acceptable limitation for performance reasons.
            shouldTrackClassReference: () => false,
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
            if (ts.isPropertyDeclaration(node)) {
                const outputDecorator = getOutputDecorator(node, reflector);
                if (outputDecorator !== null) {
                    if (isOutputDeclarationEligibleForMigration(node)) {
                        const outputDef = {
                            id: getUniqueIdForProperty(info, node),
                            aliasParam: outputDecorator.args?.at(0),
                        };
                        const outputFile = project_paths.projectFile(node.getSourceFile(), info);
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
            if (isPotentialNextCallUsage(node) && ts.isPropertyAccessExpression(node.expression)) {
                const propertyDeclaration = isTargetOutputDeclaration(node.expression.expression, checker, reflector, dtsReader);
                if (propertyDeclaration !== null) {
                    const id = getUniqueIdForProperty(info, propertyDeclaration);
                    const outputFile = project_paths.projectFile(node.getSourceFile(), info);
                    addOutputReplacement(outputFieldReplacements, id, outputFile, calculateNextFnReplacement(info, node.expression.name));
                }
            }
            // detect .complete usages that should be removed
            if (isPotentialCompleteCallUsage(node) && ts.isPropertyAccessExpression(node.expression)) {
                const propertyDeclaration = isTargetOutputDeclaration(node.expression.expression, checker, reflector, dtsReader);
                if (propertyDeclaration !== null) {
                    const id = getUniqueIdForProperty(info, propertyDeclaration);
                    const outputFile = project_paths.projectFile(node.getSourceFile(), info);
                    if (ts.isExpressionStatement(node.parent)) {
                        addOutputReplacement(outputFieldReplacements, id, outputFile, calculateCompleteCallReplacement(info, node.parent));
                    }
                    else {
                        problematicUsages[id] = true;
                    }
                }
            }
            addCommentForEmptyEmit(node, info, checker, reflector, dtsReader, outputFieldReplacements);
            // detect imports of test runners
            if (isTestRunnerImport(node)) {
                isTestFile = true;
            }
            // detect unsafe access of the output property
            if (isPotentialPipeCallUsage(node) && ts.isPropertyAccessExpression(node.expression)) {
                const propertyDeclaration = isTargetOutputDeclaration(node.expression.expression, checker, reflector, dtsReader);
                if (propertyDeclaration !== null) {
                    const id = getUniqueIdForProperty(info, propertyDeclaration);
                    if (isTestFile) {
                        const outputFile = project_paths.projectFile(node.getSourceFile(), info);
                        addOutputReplacement(outputFieldReplacements, id, outputFile, ...calculatePipeCallReplacement(info, node));
                    }
                    else {
                        problematicUsages[id] = true;
                    }
                }
            }
            ts.forEachChild(node, outputMigrationVisitor);
        };
        // calculate output migration replacements
        for (const sf of sourceFiles) {
            isTestFile = false;
            ts.forEachChild(sf, outputMigrationVisitor);
        }
        // take care of the references in templates and host bindings
        const referenceResult = { references: [] };
        const { visitor: templateHostRefVisitor } = index.createFindAllSourceFileReferencesVisitor(info, checker, reflector, resourceLoader, evaluator, templateTypeChecker, knownFields, null, // TODO: capture known output names as an optimization
        referenceResult);
        // calculate template / host binding replacements
        for (const sf of sourceFiles) {
            ts.forEachChild(sf, templateHostRefVisitor);
        }
        for (const ref of referenceResult.references) {
            // detect .next usages that should be migrated to .emit in template and host binding expressions
            if (ref.kind === index.ReferenceKind.InTemplate) {
                const callExpr = checkNonTsReferenceCallsField(ref, 'next');
                // TODO: here and below for host bindings, we should ideally filter in the global meta stage
                // (instead of using the `outputFieldReplacements` map)
                //  as technically, the call expression could refer to an output
                //  from a whole different compilation unit (e.g. tsconfig.json).
                if (callExpr !== null && outputFieldReplacements[ref.target.key] !== undefined) {
                    addOutputReplacement(outputFieldReplacements, ref.target.key, ref.from.templateFile, calculateNextFnReplacementInTemplate(ref.from.templateFile, callExpr.nameSpan));
                }
            }
            else if (ref.kind === index.ReferenceKind.InHostBinding) {
                const callExpr = checkNonTsReferenceCallsField(ref, 'next');
                if (callExpr !== null && outputFieldReplacements[ref.target.key] !== undefined) {
                    addOutputReplacement(outputFieldReplacements, ref.target.key, ref.from.file, calculateNextFnReplacementInHostBinding(ref.from.file, ref.from.hostPropertyNode.getStart() + 1, callExpr.nameSpan));
                }
            }
        }
        // calculate import replacements but do so only for files that have output declarations
        const importReplacements = calculateImportReplacements(info, filesWithOutputDeclarations);
        return project_paths.confirmAsSerializable({
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
        return project_paths.confirmAsSerializable({
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
        return project_paths.confirmAsSerializable(combinedData);
    }
    async stats(globalMetadata) {
        const detectedOutputs = new Set(Object.keys(globalMetadata.outputFields)).size +
            globalMetadata.problematicDeclarationCount;
        const problematicOutputs = new Set(Object.keys(globalMetadata.problematicUsages)).size +
            globalMetadata.problematicDeclarationCount;
        const successRate = detectedOutputs > 0 ? (detectedOutputs - problematicOutputs) / detectedOutputs : 1;
        return project_paths.confirmAsSerializable({
            detectedOutputs,
            problematicOutputs,
            successRate,
        });
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
function addCommentForEmptyEmit(node, info, checker, reflector, dtsReader, outputFieldReplacements) {
    if (!isEmptyEmitCall(node))
        return;
    const propertyAccess = getPropertyAccess(node);
    if (!propertyAccess)
        return;
    const symbol = checker.getSymbolAtLocation(propertyAccess.name);
    if (!symbol || !symbol.declarations?.length)
        return;
    const propertyDeclaration = isTargetOutputDeclaration(propertyAccess, checker, reflector, dtsReader);
    if (!propertyDeclaration)
        return;
    const eventEmitterType = getEventEmitterArgumentType(propertyDeclaration);
    if (!eventEmitterType)
        return;
    const id = getUniqueIdForProperty(info, propertyDeclaration);
    const file = project_paths.projectFile(node.getSourceFile(), info);
    const formatter = getFormatterText(node);
    const todoReplacement = new project_paths.TextUpdate({
        toInsert: `${formatter.indent}// TODO: The 'emit' function requires a mandatory ${eventEmitterType} argument\n`,
        end: formatter.lineStartPos,
        position: formatter.lineStartPos,
    });
    addOutputReplacement(outputFieldReplacements, id, file, new project_paths.Replacement(file, todoReplacement));
}
function isEmptyEmitCall(node) {
    return (ts.isCallExpression(node) &&
        ts.isPropertyAccessExpression(node.expression) &&
        node.expression.name.text === 'emit' &&
        node.arguments.length === 0);
}
function getPropertyAccess(node) {
    const propertyAccessExpression = node.expression.expression;
    return ts.isPropertyAccessExpression(propertyAccessExpression) ? propertyAccessExpression : null;
}
function getEventEmitterArgumentType(propertyDeclaration) {
    const initializer = propertyDeclaration.initializer;
    if (!initializer || !ts.isNewExpression(initializer))
        return null;
    const isEventEmitter = ts.isIdentifier(initializer.expression) && initializer.expression.getText() === 'EventEmitter';
    if (!isEventEmitter)
        return null;
    const [typeArg] = initializer.typeArguments ?? [];
    return typeArg ? typeArg.getText() : null;
}
function getFormatterText(node) {
    const sourceFile = node.getSourceFile();
    const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
    const lineStartPos = sourceFile.getPositionOfLineAndCharacter(line, 0);
    const indent = sourceFile.text.slice(lineStartPos, node.getStart());
    return { indent, lineStartPos };
}

function migrate(options) {
    return async (tree, context) => {
        await project_paths.runMigrationInDevkit({
            tree,
            getMigration: (fs) => new OutputMigration({
                shouldMigrate: (_, file) => {
                    return (file.rootRelativePath.startsWith(fs.normalize(options.path)) &&
                        !/(^|\/)node_modules\//.test(file.rootRelativePath));
                },
            }),
            beforeProgramCreation: (tsconfigPath, stage) => {
                if (stage === project_paths.MigrationStage.Analysis) {
                    context.logger.info(`Preparing analysis for: ${tsconfigPath}...`);
                }
                else {
                    context.logger.info(`Running migration for: ${tsconfigPath}...`);
                }
            },
            afterProgramCreation: (info, fs) => {
                const analysisPath = fs.resolve(options.analysisDir);
                // Support restricting the analysis to subfolders for larger projects.
                if (analysisPath !== '/') {
                    info.sourceFiles = info.sourceFiles.filter((sf) => sf.fileName.startsWith(analysisPath));
                    info.fullProgramSourceFiles = info.fullProgramSourceFiles.filter((sf) => sf.fileName.startsWith(analysisPath));
                }
            },
            beforeUnitAnalysis: (tsconfigPath) => {
                context.logger.info(`Scanning for outputs: ${tsconfigPath}...`);
            },
            afterAllAnalyzed: () => {
                context.logger.info(``);
                context.logger.info(`Processing analysis data between targets...`);
                context.logger.info(``);
            },
            afterAnalysisFailure: () => {
                context.logger.error('Migration failed unexpectedly with no analysis data');
            },
            whenDone: ({ detectedOutputs, problematicOutputs, successRate }) => {
                const migratedOutputs = detectedOutputs - problematicOutputs;
                const successRatePercent = (successRate * 100).toFixed(2);
                context.logger.info('');
                context.logger.info(`Successfully migrated to outputs as functions 🎉`);
                context.logger.info(`  -> Migrated ${migratedOutputs} out of ${detectedOutputs} detected outputs (${successRatePercent} %).`);
            },
        });
    };
}

exports.migrate = migrate;
