'use strict';
/**
 * @license Angular v21.1.0-next.0+sha-13d8ccc
 * (c) 2010-2025 Google LLC. https://angular.io/
 * License: MIT
 */
'use strict';

require('@angular-devkit/core');
require('node:path/posix');
var project_paths = require('./project_paths-C8H7KDJ3.cjs');
require('os');
var ts = require('typescript');
var project_tsconfig_paths = require('./project_tsconfig_paths-CiBzGSIa.cjs');
require('./index-Dvqnp6JS.cjs');
require('path');
require('node:path');
var apply_import_manager = require('./apply_import_manager-CoeTX_Ob.cjs');
require('@angular-devkit/schematics');
require('fs');
require('module');
require('url');

const ROUTER_TESTING_MODULE = 'RouterTestingModule';
const SPY_LOCATION = 'SpyLocation';
const ROUTER_MODULE = 'RouterModule';
const PROVIDE_LOCATION_MOCKS = 'provideLocationMocks';
const ANGULAR_ROUTER_TESTING = '@angular/router/testing';
const ANGULAR_ROUTER = '@angular/router';
const ANGULAR_COMMON_TESTING = '@angular/common/testing';
const IMPORTS_PROPERTY = 'imports';
const PROVIDERS_PROPERTY = 'providers';
const WITH_ROUTES_STATIC_METHOD = 'withRoutes';
const TESTBED_IDENTIFIER = 'TestBed';
const CONFIGURE_TESTING_MODULE = 'configureTestingModule';
function hasImportFromModule(sourceFile, modulePath, ...symbolNames) {
    const symbolSet = new Set(symbolNames);
    let hasImport = false;
    ts.forEachChild(sourceFile, (node) => {
        if (ts.isImportDeclaration(node) &&
            ts.isStringLiteral(node.moduleSpecifier) &&
            node.moduleSpecifier.text === modulePath &&
            node.importClause?.namedBindings &&
            ts.isNamedImports(node.importClause.namedBindings)) {
            for (const element of node.importClause.namedBindings.elements) {
                if (symbolSet.has(element.name.text)) {
                    hasImport = true;
                    break;
                }
            }
        }
    });
    return hasImport;
}
function detectSpyLocationUrlChangesUsage(sourceFile) {
    const hasSpyLocationImport = hasImportFromModule(sourceFile, ANGULAR_COMMON_TESTING, SPY_LOCATION);
    let usesUrlChangesFeature = false;
    function walk(node) {
        if (usesUrlChangesFeature) {
            return;
        }
        if (ts.isPropertyAccessExpression(node) &&
            ts.isIdentifier(node.name) &&
            node.name.text === 'urlChanges') {
            usesUrlChangesFeature = true;
            return;
        }
        node.forEachChild(walk);
    }
    walk(sourceFile);
    return hasSpyLocationImport && usesUrlChangesFeature;
}
function createArrayLiteralReplacement(file, arrayLiteral, newElements, sourceFile) {
    const elementNodes = newElements.map((element) => {
        if (typeof element === 'string') {
            return parseStringToExpression(element);
        }
        return element;
    });
    const newArray = ts.factory.updateArrayLiteralExpression(arrayLiteral, elementNodes);
    const printer = ts.createPrinter({
        newLine: ts.NewLineKind.LineFeed,
    });
    const newText = printer.printNode(ts.EmitHint.Unspecified, newArray, sourceFile);
    return new project_paths.Replacement(file, new project_paths.TextUpdate({
        position: arrayLiteral.getStart(),
        end: arrayLiteral.getEnd(),
        toInsert: newText,
    }));
}
function createImportRemovalReplacement(file, importDeclaration, namedBindings, symbolToRemove, sourceFile) {
    const otherImports = namedBindings.elements.filter((el) => el.name.text !== symbolToRemove);
    if (otherImports.length === 0) {
        return new project_paths.Replacement(file, new project_paths.TextUpdate({
            position: importDeclaration.getStart(),
            end: importDeclaration.getEnd() + 1,
            toInsert: '',
        }));
    }
    else {
        const newNamedBindings = ts.factory.updateNamedImports(namedBindings, otherImports);
        const printer = ts.createPrinter();
        const newText = printer.printNode(ts.EmitHint.Unspecified, newNamedBindings, sourceFile);
        return new project_paths.Replacement(file, new project_paths.TextUpdate({
            position: namedBindings.getStart(),
            end: namedBindings.getEnd(),
            toInsert: newText,
        }));
    }
}
function isEmptyArrayExpression(expression) {
    return ts.isArrayLiteralExpression(expression) && expression.elements.length === 0;
}
function getRoutesArgumentForMigration(routesNode, optionsNode) {
    if (!routesNode) {
        return undefined;
    }
    if (!isEmptyArrayExpression(routesNode)) {
        return routesNode;
    }
    return optionsNode ? routesNode : undefined;
}
function createRouterModuleExpression(routesArg, optionsArg) {
    const routerModuleIdentifier = ts.factory.createIdentifier(ROUTER_MODULE);
    if (routesArg) {
        // Build args list and include options if present
        const args = [routesArg];
        if (optionsArg) {
            args.push(optionsArg);
        }
        // Create RouterModule.forRoot(routes, options?) expression
        return ts.factory.createCallExpression(ts.factory.createPropertyAccessExpression(routerModuleIdentifier, ts.factory.createIdentifier('forRoot')), undefined, args);
    }
    return routerModuleIdentifier;
}
function createProviderCallExpression(functionName, argument) {
    return ts.factory.createCallExpression(ts.factory.createIdentifier(functionName), undefined, []);
}
function createArrayLiteralFromExpressions(expressions) {
    return ts.factory.createArrayLiteralExpression(Array.from(expressions), true);
}
function parseStringToExpression(text) {
    const wrapped = `(${text})`;
    const sourceFile = ts.createSourceFile('temp.ts', wrapped, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
    if (sourceFile.statements.length === 1) {
        const statement = sourceFile.statements[0];
        if (ts.isExpressionStatement(statement) && ts.isParenthesizedExpression(statement.expression)) {
            return statement.expression.expression;
        }
    }
    return parseExpressionWithPatternRecognition(text);
}
function parseExpressionWithPatternRecognition(text) {
    const callPattern = analyzeCallPattern(text);
    if (callPattern) {
        return ts.factory.createCallExpression(callPattern.expression, undefined, Array.from(callPattern.arguments));
    }
    const arrayPattern = analyzeArrayPattern(text);
    if (arrayPattern) {
        return ts.factory.createArrayLiteralExpression(Array.from(arrayPattern.elements), true);
    }
    const literalPattern = analyzeLiteralPattern(text);
    if (literalPattern) {
        return literalPattern.expression;
    }
    return ts.factory.createIdentifier(text);
}
function analyzeCallPattern(text) {
    const testExpression = `(${text})`;
    const sourceFile = ts.createSourceFile('temp.ts', testExpression, ts.ScriptTarget.Latest, true);
    if (sourceFile.statements.length === 1) {
        const statement = sourceFile.statements[0];
        if (ts.isExpressionStatement(statement) &&
            ts.isParenthesizedExpression(statement.expression) &&
            ts.isCallExpression(statement.expression.expression)) {
            const callExpr = statement.expression.expression;
            return {
                type: 'call',
                expression: callExpr.expression,
                arguments: callExpr.arguments,
            };
        }
    }
    return null;
}
function analyzeArrayPattern(text) {
    const sourceFile = ts.createSourceFile('temp.ts', text, ts.ScriptTarget.Latest, true);
    if (sourceFile.statements.length === 1) {
        const statement = sourceFile.statements[0];
        if (ts.isExpressionStatement(statement) && ts.isArrayLiteralExpression(statement.expression)) {
            return {
                type: 'array',
                elements: statement.expression.elements,
            };
        }
    }
    return null;
}
function analyzeLiteralPattern(text) {
    const sourceFile = ts.createSourceFile('temp.ts', text, ts.ScriptTarget.Latest, true);
    if (sourceFile.statements.length === 1) {
        const statement = sourceFile.statements[0];
        if (ts.isExpressionStatement(statement)) {
            const expr = statement.expression;
            if (ts.isStringLiteral(expr) || ts.isNumericLiteral(expr) || ts.isLiteralExpression(expr)) {
                return {
                    type: 'literal',
                    expression: expr,
                };
            }
        }
    }
    return null;
}
function removeRouterTestingModuleImport(sourceFile, file, replacements) {
    ts.forEachChild(sourceFile, (node) => {
        if (ts.isImportDeclaration(node) &&
            ts.isStringLiteral(node.moduleSpecifier) &&
            node.moduleSpecifier.text === ANGULAR_ROUTER_TESTING &&
            node.importClause?.namedBindings &&
            ts.isNamedImports(node.importClause.namedBindings)) {
            const namedBindings = node.importClause.namedBindings;
            replacements.push(createImportRemovalReplacement(file, node, namedBindings, ROUTER_TESTING_MODULE, sourceFile));
        }
    });
}
function migrateToRouterModule(usage, file, routesNode, optionsNode, replacements) {
    const neededImportsExpressions = new Set();
    const neededProvidersExpressions = new Set();
    const optionsExpression = optionsNode ? optionsNode : undefined;
    const routesExpression = getRoutesArgumentForMigration(routesNode, optionsNode);
    const routerModuleExpression = createRouterModuleExpression(routesExpression, optionsExpression);
    neededImportsExpressions.add(routerModuleExpression);
    if (usage.usesSpyLocationUrlChanges) {
        const provideLocationMocksExpression = createProviderCallExpression(PROVIDE_LOCATION_MOCKS);
        neededProvidersExpressions.add(provideLocationMocksExpression);
    }
    if (usage.importsProperty && ts.isArrayLiteralExpression(usage.importsProperty.initializer)) {
        const importsArray = usage.importsProperty.initializer;
        const otherImportExpressions = usage.importsArrayElements.filter((el) => el !== usage.routerTestingModuleElement);
        const allImportExpressions = [
            ...otherImportExpressions,
            ...Array.from(neededImportsExpressions),
        ];
        replacements.push(createArrayLiteralReplacement(file, importsArray, allImportExpressions, usage.sourceFile));
    }
    if (neededProvidersExpressions.size > 0) {
        if (usage.providersProperty &&
            ts.isArrayLiteralExpression(usage.providersProperty.initializer)) {
            const existingProvidersArray = usage.providersProperty.initializer;
            const allProviderExpressions = [
                ...existingProvidersArray.elements,
                ...Array.from(neededProvidersExpressions),
            ];
            replacements.push(createArrayLiteralReplacement(file, existingProvidersArray, allProviderExpressions, usage.sourceFile));
        }
        else {
            const providersArray = createArrayLiteralFromExpressions(neededProvidersExpressions);
            const printer = ts.createPrinter();
            const providersText = printer.printNode(ts.EmitHint.Unspecified, providersArray, usage.sourceFile);
            const insertPosition = usage.importsProperty.getEnd();
            replacements.push(new project_paths.Replacement(file, new project_paths.TextUpdate({
                position: insertPosition,
                end: insertPosition,
                toInsert: `,\n  ${PROVIDERS_PROPERTY}: ${providersText}`,
            })));
        }
    }
}
function analyzeRouterTestingModuleUsage(usage) {
    const neededProviders = new Set();
    const neededImports = new Set();
    let hasLocationMocks = false;
    const optionsExpression = usage.optionsNode ? usage.optionsNode : undefined;
    const routesExpression = getRoutesArgumentForMigration(usage.routesNode, usage.optionsNode);
    // Add RouterModule to imports (preserve options when present)
    const routerModuleExpression = createRouterModuleExpression(routesExpression, optionsExpression);
    neededImports.add(routerModuleExpression);
    // Add location mocks ONLY if:
    // 1. SpyLocation is imported from @angular/common/testing, AND
    // 2. urlChanges property is accessed in the test
    // 3. provideLocationMocks() is not already present
    if (usage.usesSpyLocationUrlChanges) {
        const provideLocationMocksExpression = createProviderCallExpression(PROVIDE_LOCATION_MOCKS);
        neededProviders.add(provideLocationMocksExpression);
        hasLocationMocks = true;
    }
    return {
        neededProviders,
        neededImports,
        canRemoveRouterTestingModule: true,
        replacementCount: 1,
        hasLocationMocks,
    };
}
function findRouterTestingModuleUsages(sourceFile) {
    const usages = [];
    const hasRouterTestingModule = hasImportFromModule(sourceFile, ANGULAR_ROUTER_TESTING, ROUTER_TESTING_MODULE);
    const usesSpyLocationUrlChanges = detectSpyLocationUrlChangesUsage(sourceFile);
    if (!hasRouterTestingModule) {
        return usages;
    }
    function walk(node) {
        if (ts.isCallExpression(node) &&
            ts.isPropertyAccessExpression(node.expression) &&
            node.expression.name.text === CONFIGURE_TESTING_MODULE &&
            ts.isIdentifier(node.expression.expression) &&
            node.expression.expression.text === TESTBED_IDENTIFIER &&
            node.arguments.length > 0 &&
            ts.isObjectLiteralExpression(node.arguments[0])) {
            const config = node.arguments[0];
            let importsProperty = null;
            let providersProperty = null;
            for (const prop of config.properties) {
                if (ts.isPropertyAssignment(prop) && ts.isIdentifier(prop.name)) {
                    if (prop.name.text === IMPORTS_PROPERTY) {
                        importsProperty = prop;
                    }
                    else if (prop.name.text === PROVIDERS_PROPERTY) {
                        providersProperty = prop;
                    }
                }
            }
            if (!importsProperty || !ts.isArrayLiteralExpression(importsProperty.initializer)) {
                node.forEachChild(walk);
                return;
            }
            const importsArray = importsProperty.initializer;
            let routerTestingModuleElement = null;
            let routesNode = null;
            let optionsNode = null;
            for (const element of importsArray.elements) {
                if (ts.isIdentifier(element) && element.text === ROUTER_TESTING_MODULE) {
                    routerTestingModuleElement = element;
                    break;
                }
                else if (ts.isCallExpression(element) &&
                    ts.isPropertyAccessExpression(element.expression) &&
                    ts.isIdentifier(element.expression.expression) &&
                    element.expression.expression.text === ROUTER_TESTING_MODULE &&
                    element.expression.name.text === WITH_ROUTES_STATIC_METHOD) {
                    routerTestingModuleElement = element;
                    if (element.arguments.length > 0) {
                        routesNode = element.arguments[0];
                    }
                    if (element.arguments.length > 1) {
                        optionsNode = element.arguments[1];
                    }
                    break;
                }
            }
            if (routerTestingModuleElement) {
                usages.push({
                    sourceFile,
                    configObject: config,
                    importsProperty,
                    providersProperty,
                    routerTestingModuleElement,
                    routesNode,
                    optionsNode,
                    importsArrayElements: Array.from(importsArray.elements),
                    usesSpyLocationUrlChanges,
                });
            }
        }
        node.forEachChild(walk);
    }
    walk(sourceFile);
    return usages;
}
function processRouterTestingModuleUsage(usage, sourceFile, info, importManager, replacements) {
    const file = project_paths.projectFile(sourceFile, info);
    const routesNode = usage.routesNode;
    const optionsNode = usage.optionsNode;
    const analysis = analyzeRouterTestingModuleUsage(usage);
    migrateToRouterModule(usage, file, routesNode, optionsNode, replacements);
    importManager.addImport({
        exportModuleSpecifier: ANGULAR_ROUTER,
        exportSymbolName: ROUTER_MODULE,
        requestedFile: sourceFile,
    });
    if (analysis.hasLocationMocks) {
        importManager.addImport({
            exportModuleSpecifier: ANGULAR_COMMON_TESTING,
            exportSymbolName: PROVIDE_LOCATION_MOCKS,
            requestedFile: sourceFile,
        });
    }
    removeRouterTestingModuleImport(sourceFile, file, replacements);
}

/**
 * Migration that converts RouterTestingModule usages to the recommended API:
 * - Replace RouterTestingModule with RouterModule for all tests (respecting existing imports)
 * - Adds provideLocationMocks only when needed and not conflicting
 */
class RouterTestingModuleMigration extends project_paths.TsurgeFunnelMigration {
    config;
    constructor(config = {}) {
        super();
        this.config = config;
    }
    async analyze(info) {
        const replacements = [];
        const migratedUsages = [];
        const filesWithLocationMocks = new Map();
        const importManager = new project_tsconfig_paths.ImportManager({
            shouldUseSingleQuotes: () => true,
        });
        for (const sourceFile of info.sourceFiles) {
            const file = project_paths.projectFile(sourceFile, info);
            if (this.config.shouldMigrate && !this.config.shouldMigrate(file)) {
                continue;
            }
            const usages = findRouterTestingModuleUsages(sourceFile);
            for (const usage of usages) {
                processRouterTestingModuleUsage(usage, sourceFile, info, importManager, replacements);
                migratedUsages.push(usage);
                if (usage.usesSpyLocationUrlChanges) {
                    filesWithLocationMocks.set(sourceFile.fileName, true);
                }
            }
        }
        apply_import_manager.applyImportManagerChanges(importManager, replacements, info.sourceFiles, info);
        return project_paths.confirmAsSerializable({
            replacements,
            migratedUsages,
            filesWithLocationMocks,
        });
    }
    async migrate(globalData) {
        return {
            replacements: globalData.replacements,
        };
    }
    async combine(unitA, unitB) {
        const combinedFilesWithLocationMocks = new Map(unitA.filesWithLocationMocks);
        for (const [fileName, hasLocationMocks] of unitB.filesWithLocationMocks) {
            combinedFilesWithLocationMocks.set(fileName, hasLocationMocks || combinedFilesWithLocationMocks.get(fileName) || false);
        }
        return project_paths.confirmAsSerializable({
            replacements: [...unitA.replacements, ...unitB.replacements],
            migratedUsages: [...unitA.migratedUsages, ...unitB.migratedUsages],
            filesWithLocationMocks: combinedFilesWithLocationMocks,
        });
    }
    async globalMeta(combinedData) {
        return project_paths.confirmAsSerializable(combinedData);
    }
    async stats(globalMetadata) {
        const stats = {
            counters: {
                replacements: globalMetadata.replacements.length,
                migratedUsages: globalMetadata.migratedUsages.length,
                filesWithLocationMocks: globalMetadata.filesWithLocationMocks.size,
                totalFiles: new Set(globalMetadata.migratedUsages.map((usage) => usage.sourceFile.fileName))
                    .size,
            },
        };
        return stats;
    }
}

/*!
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */
function migrate(options) {
    return async (tree, context) => {
        await project_paths.runMigrationInDevkit({
            tree,
            getMigration: (fs) => new RouterTestingModuleMigration({
                shouldMigrate: (file) => {
                    return (file.rootRelativePath.startsWith(fs.normalize(options.path)) &&
                        !/(^|\/)node_modules\//.test(file.rootRelativePath) &&
                        /\.spec\.ts$/.test(file.rootRelativePath));
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
            beforeUnitAnalysis: (tsconfigPath) => {
                context.logger.info(`Scanning for RouterTestingModule usage: ${tsconfigPath}...`);
            },
            afterAllAnalyzed: () => {
                context.logger.info(``);
                context.logger.info(`Processing analysis data between targets...`);
                context.logger.info(``);
            },
            afterAnalysisFailure: () => {
                context.logger.error('Migration failed unexpectedly with no analysis data');
            },
            whenDone: (stats) => {
                context.logger.info('');
                context.logger.info(`Successfully migrated RouterTestingModule to RouterModule 🎉`);
                context.logger.info(`  -> Migrated ${stats.counters.migratedUsages} RouterTestingModule usages in ${stats.counters.totalFiles} test files.`);
                if (stats.counters.filesWithLocationMocks > 0) {
                    context.logger.info(`  -> Added provideLocationMocks() to ${stats.counters.filesWithLocationMocks} files with SpyLocation.urlChanges usage.`);
                }
            },
        });
    };
}

exports.migrate = migrate;
