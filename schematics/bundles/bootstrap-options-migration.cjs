'use strict';
/**
 * @license Angular v21.0.0-next.7+sha-c0510cd
 * (c) 2010-2025 Google LLC. https://angular.io/
 * License: MIT
 */
'use strict';

require('@angular-devkit/core');
require('node:path/posix');
var project_paths = require('./project_paths-DD8D80ol.cjs');
require('os');
var ts = require('typescript');
var project_tsconfig_paths = require('./project_tsconfig_paths-BP6O7cP-.cjs');
var index = require('./index-B0Y9T7t-.cjs');
require('path');
require('node:path');
var apply_import_manager = require('./apply_import_manager-K89F15h7.cjs');
var property_name = require('./property_name-BBwFuqMe.cjs');
var imports = require('./imports-DwPXlGFl.cjs');
var symbol = require('./symbol-BObKoqes.cjs');
require('@angular-devkit/schematics');
require('fs');
require('module');
require('url');

const CORE_PACKAGE = '@angular/core';
const PROVIDE_ZONE_CHANGE_DETECTION = 'provideZoneChangeDetection';
const ZONE_CD_PROVIDER = `${PROVIDE_ZONE_CHANGE_DETECTION}()`;
class BootstrapOptionsMigration extends project_paths.TsurgeFunnelMigration {
    async analyze(info) {
        let replacements = [];
        const importManager = new project_tsconfig_paths.ImportManager();
        for (const sourceFile of info.sourceFiles) {
            // We need to migration either
            // * `bootstrapApplication(App)
            // * `platformBrowser().bootstrapModule(AppModule)`
            // * `platformBrowserDynamic().bootstrapModule(AppModule)`
            // * `TestBed.initTestEnvironment([AppModule], platformBrowserTesting())`
            // * `getTestBed.initTestEnvironment([AppModule], platformBrowserTesting())`
            const specifiers = getSpecifiers(sourceFile);
            // If none of the imports related to bootstraping are present, we can skip the file.
            if (specifiers === null)
                continue;
            const { bootstrapAppSpecifier, platformBrowserDynamicSpecifier, platformBrowserSpecifier, testBedSpecifier, createApplicationSpecifier, getTestBedSpecifier, } = specifiers;
            const typeChecker = info.program.getTypeChecker();
            const isCreateApplicationNode = (node) => {
                return (ts.isCallExpression(node) &&
                    createApplicationSpecifier !== null &&
                    symbol.isReferenceToImport(typeChecker, node.expression, createApplicationSpecifier));
            };
            const isBootstrapAppNode = (node) => {
                return (ts.isCallExpression(node) &&
                    bootstrapAppSpecifier !== null &&
                    symbol.isReferenceToImport(typeChecker, node.expression, bootstrapAppSpecifier));
            };
            const isBootstrapModuleNode = (node) => {
                return (ts.isCallExpression(node) &&
                    ts.isPropertyAccessExpression(node.expression) &&
                    node.expression.name.text === 'bootstrapModule' &&
                    ts.isCallExpression(node.expression.expression) &&
                    (symbol.isReferenceToImport(typeChecker, node.expression.expression.expression, platformBrowserSpecifier) ||
                        symbol.isReferenceToImport(typeChecker, node.expression.expression.expression, platformBrowserDynamicSpecifier)));
            };
            const isTestBedInitEnvironmentNode = (node) => {
                return (ts.isCallExpression(node) &&
                    ts.isPropertyAccessExpression(node.expression) &&
                    node.expression.name.text === 'initTestEnvironment' &&
                    (symbol.isReferenceToImport(typeChecker, node.expression.expression, testBedSpecifier) ||
                        symbol.isReferenceToImport(typeChecker, node.expression.expression, getTestBedSpecifier)));
            };
            const reflector = new project_tsconfig_paths.TypeScriptReflectionHost(typeChecker);
            const evaluator = new index.PartialEvaluator(reflector, typeChecker, null);
            const walk = (node) => {
                if (isBootstrapAppNode(node)) {
                    this.analyzeBootstrapApplication(node, sourceFile, info, typeChecker, importManager, replacements);
                }
                else if (isCreateApplicationNode(node)) {
                    this.analyzeCreateApplication(node, sourceFile, info, typeChecker, importManager, replacements);
                }
                else if (isBootstrapModuleNode(node)) {
                    this.analyzeBootstrapModule(node, sourceFile, reflector, evaluator, info, typeChecker, importManager, replacements);
                }
                else if (isTestBedInitEnvironmentNode(node)) {
                    this.analyzeTestBedInitEnvironment(node, sourceFile, info, typeChecker, importManager, replacements);
                }
                node.forEachChild(walk);
            };
            sourceFile.forEachChild(walk);
        }
        // The combine method might not run when there is a single target.
        // So we deduplicate here
        replacements = deduplicateReplacements(replacements);
        apply_import_manager.applyImportManagerChanges(importManager, replacements, info.sourceFiles, info);
        return project_paths.confirmAsSerializable({ replacements });
    }
    async combine(unitA, unitB) {
        const combined = [...unitA.replacements, ...unitB.replacements];
        return project_paths.confirmAsSerializable({ replacements: deduplicateReplacements(combined) });
    }
    async globalMeta(data) {
        return project_paths.confirmAsSerializable(data);
    }
    async stats(data) {
        return project_paths.confirmAsSerializable({});
    }
    async migrate(data) {
        return { replacements: data.replacements };
    }
    analyzeBootstrapApplication(node, sourceFile, info, typeChecker, importManager, replacements) {
        const hasExistingChangeDetectionProvider = hasChangeDetectionProvider(node, typeChecker);
        if (hasExistingChangeDetectionProvider)
            return;
        const providerFn = 'provideZoneChangeDetection()';
        const optionsNode = node.arguments[1];
        const currentProjectFile = project_paths.projectFile(sourceFile, info);
        if (optionsNode) {
            let optionProjectFile = currentProjectFile;
            let optionLiteral;
            if (ts.isObjectLiteralExpression(optionsNode)) {
                optionLiteral = optionsNode;
                addProvidersToBootstrapOption(optionProjectFile, optionLiteral, providerFn, replacements);
            }
            else if (ts.isIdentifier(optionsNode)) {
                // This case handled both `bootstrapApplication(App, appConfig)` and the server () => bootstrapApplication(App, appConfig)
                // where appConfig is the result of a `mergeApplicationConfig` call.
                // This is tricky case to handle, in G3 we're might not be able to resolve the identifier's value
                // Our best alternative is to assume there is not CD providers set and add the ZoneChangeDetection provider
                // In the cases where it is, we'll just override the zone provider we just set by re-used inthe appConfig providers
                // TODO: Should we insert a TODO to clean this up ?
                const text = `{...${optionsNode.getText()}, providers: [${providerFn}, ...${optionsNode.getText()}.providers]}`;
                replacements.push(new project_paths.Replacement(currentProjectFile, new project_paths.TextUpdate({
                    position: optionsNode.getStart(),
                    end: optionsNode.getEnd(),
                    toInsert: text,
                })));
            }
            else {
                throw new Error('unsupported optionsNode: ' + optionsNode.getText());
            }
        }
        else {
            // No options object, add it.
            const text = `, {providers: [${providerFn}]}`;
            const component = node.arguments[0];
            replacements.push(new project_paths.Replacement(currentProjectFile, new project_paths.TextUpdate({ position: component.getEnd(), end: component.getEnd(), toInsert: text })));
        }
        importManager.addImport({
            exportModuleSpecifier: CORE_PACKAGE,
            exportSymbolName: 'provideZoneChangeDetection',
            requestedFile: sourceFile,
        });
    }
    analyzeCreateApplication(node, sourceFile, info, typeChecker, importManager, replacements) {
        const hasExistingChangeDetectionProvider = hasChangeDetectionProvider(node, typeChecker);
        if (hasExistingChangeDetectionProvider)
            return;
        const providerFn = 'provideZoneChangeDetection()';
        const optionsNode = node.arguments[0];
        const currentProjectFile = project_paths.projectFile(sourceFile, info);
        if (optionsNode) {
            let optionProjectFile = currentProjectFile;
            let optionLiteral;
            if (ts.isObjectLiteralExpression(optionsNode)) {
                optionLiteral = optionsNode;
                addProvidersToBootstrapOption(optionProjectFile, optionLiteral, providerFn, replacements);
            }
            else if (ts.isIdentifier(optionsNode) ||
                ts.isCallExpression(optionsNode) ||
                ts.isPropertyAccessExpression(optionsNode)) {
                // This is tricky case to handle, in G3 we're might not be able to resolve the identifier's value
                // Our best alternative is to assume there is no CD providers set and add the ZoneChangeDetection provider
                // In the cases where it is, we'll just override the zone provider we just set by re-used inthe appConfig providers
                // TODO: Should we insert a TODO to clean this up ?
                const text = `{...${optionsNode.getText()}, providers: [${providerFn}, ...${optionsNode.getText()}.providers]}`;
                replacements.push(new project_paths.Replacement(currentProjectFile, new project_paths.TextUpdate({
                    position: optionsNode.getStart(),
                    end: optionsNode.getEnd(),
                    toInsert: text,
                })));
            }
            else {
                throw new Error('unsupported optionsNode: ' + optionsNode.getText());
            }
        }
        else {
            // No options object, add it.
            const text = `{providers: [${providerFn}]}`;
            replacements.push(new project_paths.Replacement(currentProjectFile, new project_paths.TextUpdate({
                position: node.expression.getEnd() + 1,
                end: node.expression.getEnd() + 1,
                toInsert: text,
            })));
        }
        importManager.addImport({
            exportModuleSpecifier: CORE_PACKAGE,
            exportSymbolName: 'provideZoneChangeDetection',
            requestedFile: sourceFile,
        });
    }
    analyzeBootstrapModule(node, sourceFile, reflector, evaluator, info, typeChecker, importManager, replacements) {
        const moduleIdentifier = node.arguments[0];
        const moduleType = evaluator.evaluate(moduleIdentifier);
        if (!(moduleType instanceof project_tsconfig_paths.Reference) || !ts.isClassDeclaration(moduleType.node)) {
            return;
        }
        const moduleClass = moduleType.node;
        const ngModule = findNgModule(moduleClass, reflector);
        if (!ngModule) {
            return;
        }
        const moduleSourceFile = moduleClass.getSourceFile();
        const moduleProjectFile = project_paths.projectFile(moduleSourceFile, info);
        if (moduleSourceFile.getText().includes('ZoneChangeDetectionModule')) {
            // If the file already contains the ZoneChangeDetectionModule, we can skip it.
            return;
        }
        // Always remove the options argument
        replacements.push(new project_paths.Replacement(project_paths.projectFile(sourceFile, info), new project_paths.TextUpdate({ position: moduleIdentifier.getEnd(), end: node.getEnd() - 1, toInsert: '' })));
        const hasExistingChangeDetectionProvider = hasChangeDetectionProvider(ngModule, typeChecker);
        if (hasExistingChangeDetectionProvider) {
            return;
        }
        // Let's try to understand the bootstrap options.
        const optionsNode = node.arguments[1];
        const options = optionsNode && ts.isObjectLiteralExpression(optionsNode)
            ? evaluator.evaluate(optionsNode)
            : null;
        let zoneCdProvider = ZONE_CD_PROVIDER;
        let zoneInstanceProvider = null;
        if (options instanceof Map) {
            const ngZoneOption = options.get('ngZone');
            if (options.has('ngZoneRunCoalescing') || options.has('ngZoneEventCoalescing')) {
                const config = [];
                if (options.get('ngZoneRunCoalescing')) {
                    config.push('runCoalescing: true');
                }
                if (options.get('ngZoneEventCoalescing')) {
                    config.push('eventCoalescing: true');
                }
                zoneCdProvider = `${PROVIDE_ZONE_CHANGE_DETECTION}(${config.length > 0 ? `{ ${config.join(', ')} }` : ''})`;
            }
            if (ngZoneOption instanceof project_tsconfig_paths.Reference) {
                importManager.addImport({
                    exportModuleSpecifier: CORE_PACKAGE,
                    exportSymbolName: 'NgZone',
                    requestedFile: moduleSourceFile,
                });
                const clazz = ngZoneOption.node;
                if (ts.isClassDeclaration(clazz) && clazz.name) {
                    const customZoneSourceFile = clazz.getSourceFile();
                    const exportModuleSpecifier = ngZoneOption.bestGuessOwningModule?.specifier ??
                        imports.getRelativePath(moduleSourceFile.fileName, customZoneSourceFile.fileName);
                    importManager.addImport({
                        exportModuleSpecifier,
                        exportSymbolName: clazz.name.text,
                        requestedFile: moduleSourceFile,
                    });
                    zoneInstanceProvider = `{provide: NgZone, useClass: ${clazz.name.text}}`;
                }
            }
            else if (typeof ngZoneOption === 'string' && ngZoneOption === 'noop') {
                return;
            }
            else if (ngZoneOption && typeof ngZoneOption !== 'string') {
                // This is a case where we're not able to migrate automatically
                // The migration fails gracefully, keeps the ngZone option and adds a TODO.
                let ngZoneValue;
                optionsNode.properties.forEach((p) => {
                    if (ts.isPropertyAssignment(p) && ts.isIdentifier(p.name) && p.name.text === 'ngZone') {
                        ngZoneValue = p.initializer.getText();
                    }
                    else if (ts.isShorthandPropertyAssignment(p) && p.name.text === 'ngZone') {
                        ngZoneValue = p.name.text;
                    }
                });
                if (ngZoneValue) {
                    // We re-add the ngZone option
                    replacements.push(new project_paths.Replacement(project_paths.projectFile(sourceFile, info), new project_paths.TextUpdate({
                        position: moduleIdentifier.getEnd(),
                        end: node.getEnd() - 1,
                        toInsert: `, {ngZone: ${ngZoneValue}}`,
                    })));
                }
                // And add the TODO
                replacements.push(new project_paths.Replacement(project_paths.projectFile(sourceFile, info), new project_paths.TextUpdate({
                    position: node.getStart() - 1,
                    end: node.getStart() - 1,
                    toInsert: '// TODO: BootstrapOptions are deprecated & ignored. Configure NgZone in the providers array of the application module instead.',
                })));
            }
        }
        const providers = [zoneCdProvider];
        if (zoneInstanceProvider) {
            providers.push(zoneInstanceProvider);
        }
        if (providers.length > 0) {
            importManager.addImport({
                exportModuleSpecifier: CORE_PACKAGE,
                exportSymbolName: PROVIDE_ZONE_CHANGE_DETECTION,
                requestedFile: moduleSourceFile,
            });
            addProvidersToNgModule(moduleProjectFile, moduleSourceFile, ngModule, providers.join(',\n'), replacements);
        }
    }
    analyzeTestBedInitEnvironment(callExpr, sourceFile, info, typeChecker, importManager, replacements) {
        const hasExistingChangeDetectionProvider = hasChangeDetectionProvider(callExpr, typeChecker);
        if (hasExistingChangeDetectionProvider)
            return;
        const ngModules = callExpr.arguments[0];
        const moduleProjectFile = project_paths.projectFile(sourceFile, info);
        importManager.addImport({
            exportModuleSpecifier: CORE_PACKAGE,
            exportSymbolName: PROVIDE_ZONE_CHANGE_DETECTION,
            requestedFile: sourceFile,
        });
        let tmpNode = callExpr;
        let insertPosition = 0;
        while (tmpNode.parent.kind !== ts.SyntaxKind.SourceFile) {
            insertPosition = tmpNode.parent.getStart(sourceFile, true) - 1;
            tmpNode = tmpNode.parent;
        }
        importManager.addImport({
            exportModuleSpecifier: CORE_PACKAGE,
            exportSymbolName: 'NgModule',
            requestedFile: sourceFile,
        });
        addZoneCDModule(ZONE_CD_PROVIDER, moduleProjectFile, insertPosition, replacements);
        insertZoneCDModule(ngModules, moduleProjectFile, replacements, 'ZoneChangeDetectionModule');
    }
}
function addProvidersToNgModule(projectFile, moduleSourceFile, ngModule, providersText, replacements) {
    //                             ObjLiteral => callExp => Decorator => ClassExpression
    const moduleClassDeclaration = ngModule.parent.parent.parent;
    const insertPosition = moduleClassDeclaration.getStart(moduleSourceFile, true) - 1;
    addZoneCDModule(providersText, projectFile, insertPosition, replacements);
    const importsNode = property_name.findLiteralProperty(ngModule, 'imports');
    if (importsNode && ts.isPropertyAssignment(importsNode)) {
        insertZoneCDModule(importsNode.initializer, projectFile, replacements, 'ZoneChangeDetectionModule');
    }
    else {
        const text = `imports: [ZoneChangeDetectionModule]`;
        const toInsert = `${text},\n`;
        let position = ngModule.getStart() + 1;
        if (ngModule.properties.length > 0) {
            const firstProperty = ngModule.properties[0];
            position = firstProperty.getStart();
        }
        replacements.push(new project_paths.Replacement(projectFile, new project_paths.TextUpdate({
            position,
            end: position,
            toInsert,
        })));
    }
}
function addZoneCDModule(providersText, projectFile, location, replacements) {
    const newModuleText = `\n@NgModule({ providers: [ ${providersText} ] })
export class ZoneChangeDetectionModule {}\n\n`;
    if (replacementsHaveZoneCdModule(projectFile.rootRelativePath, replacements, newModuleText)) {
        return;
    }
    replacements.push(new project_paths.Replacement(projectFile, new project_paths.TextUpdate({
        position: location,
        end: location,
        toInsert: newModuleText,
    })));
}
function insertZoneCDModule(node, projectFile, replacements, importedModule) {
    if (ts.isArrayLiteralExpression(node)) {
        const literal = node;
        replacements.push(new project_paths.Replacement(projectFile, new project_paths.TextUpdate({
            position: literal.elements[0]?.getStart() ?? literal.getEnd() - 1,
            end: literal.elements[0]?.getStart() ?? literal.getEnd() - 1,
            toInsert: importedModule + ',',
        })));
    }
    else if (ts.isIdentifier(node)) {
        // This should be a good enough heuristic to determine if the identifier is not array
        let isArray = !node.text.endsWith('Module');
        // Because if it's an array, we need to spread it
        const newImports = `[${importedModule}, ${isArray ? '...' : ''}${node.text}]`;
        replacements.push(new project_paths.Replacement(projectFile, new project_paths.TextUpdate({
            position: node.getStart(),
            end: node.getEnd(),
            toInsert: newImports,
        })));
    }
    else {
        throw new Error('unsupported importsNode: ' + node.getText());
    }
}
function addProvidersToBootstrapOption(projectFile, optionsNode, providersText, replacements) {
    const providersProp = property_name.findLiteralProperty(optionsNode, 'providers');
    if (providersProp && ts.isPropertyAssignment(providersProp)) {
        // Can be bootstrap(App, {providers: [...]}), bootstrap(App, {providers}), bootstrap(App, {...appConfig, providers}) etc.
        if (ts.isArrayLiteralExpression(providersProp.initializer)) {
            const initializer = providersProp.initializer;
            const text = `${providersText},`;
            replacements.push(new project_paths.Replacement(projectFile, new project_paths.TextUpdate({
                position: initializer.elements[0]?.getStart() ?? initializer.getEnd() - 1,
                end: initializer.elements[0]?.getStart() ?? initializer.getEnd() - 1,
                toInsert: text,
            })));
        }
        else if (ts.isIdentifier(providersProp.initializer)) {
            const newProviders = `[${providersText}, ...${providersProp.initializer.text}]`;
            replacements.push(new project_paths.Replacement(projectFile, new project_paths.TextUpdate({
                position: providersProp.initializer.getStart(),
                end: providersProp.initializer.getEnd(),
                toInsert: newProviders,
            })));
        }
        else {
            const newProviders = `[${providersText}, ...`;
            replacements.push(new project_paths.Replacement(projectFile, new project_paths.TextUpdate({
                position: providersProp.initializer.getStart(),
                end: providersProp.initializer.getStart(),
                toInsert: newProviders,
            })));
            replacements.push(new project_paths.Replacement(projectFile, new project_paths.TextUpdate({
                position: providersProp.initializer.getEnd(),
                end: providersProp.initializer.getEnd(),
                toInsert: ']',
            })));
        }
    }
    else if (providersProp && ts.isShorthandPropertyAssignment(providersProp)) {
        const newProviders = `providers: [${providersText}, ...${providersProp.name.text}]`;
        replacements.push(new project_paths.Replacement(projectFile, new project_paths.TextUpdate({
            position: providersProp.getStart(),
            end: providersProp.getEnd(),
            toInsert: newProviders,
        })));
    }
    else if (optionsNode.properties.length === 1 &&
        ts.isSpreadAssignment(optionsNode.properties[0])) {
        const spread = optionsNode.properties[0];
        const newProviders = `, providers: [${providersText}, ...${spread.expression.getText()}.providers]`;
        replacements.push(new project_paths.Replacement(projectFile, new project_paths.TextUpdate({
            position: spread.getEnd(),
            end: spread.getEnd(),
            toInsert: newProviders,
        })));
    }
    else {
        const text = `providers: [${providersText}]`;
        let toInsert;
        let position;
        if (optionsNode.properties.length > 0) {
            const lastProperty = optionsNode.properties[optionsNode.properties.length - 1];
            toInsert = `,\n  ${text}`;
            position = lastProperty.getEnd();
        }
        else {
            toInsert = `\n  ${text}\n`;
            position = optionsNode.getStart() + 1;
        }
        replacements.push(new project_paths.Replacement(projectFile, new project_paths.TextUpdate({
            position,
            end: position,
            toInsert,
        })));
    }
}
function findNgModule(node, reflector) {
    const decorators = reflector.getDecoratorsOfDeclaration(node);
    if (decorators) {
        const ngModuleDecorator = project_tsconfig_paths.getAngularDecorators(decorators, ['NgModule'], true)[0];
        if (ngModuleDecorator &&
            ngModuleDecorator.args &&
            ngModuleDecorator.args.length > 0 &&
            ts.isObjectLiteralExpression(ngModuleDecorator.args[0])) {
            return ngModuleDecorator.args[0];
        }
    }
    return null;
}
function hasChangeDetectionProvider(expression, // either the bootstrapApplication or platformBrowserDynamic().bootstrapModule()
typeChecker) {
    let literal;
    if (ts.isCallExpression(expression)) {
        let optionsNode = expression.arguments[1];
        if (!optionsNode &&
            symbol.isReferenceToImport(typeChecker, expression.expression, imports.getImportSpecifier(expression.getSourceFile(), '@angular/core', 'createApplication'))) {
            optionsNode = expression.arguments[0];
        }
        if (!optionsNode)
            return false;
        if (ts.isIdentifier(optionsNode)) {
            literal = getObjectLiteralFromIdentifier(optionsNode, typeChecker);
        }
        else {
            literal = optionsNode;
        }
    }
    else {
        literal = expression;
    }
    if (!literal) {
        return false;
    }
    const provideZoneCdSpecifier = imports.getImportSpecifier(literal.getSourceFile(), '@angular/core', 'provideZoneChangeDetection');
    const provideZonelessCdSpecifier = imports.getImportSpecifier(literal.getSourceFile(), '@angular/core', 'provideZonelessChangeDetection');
    if (provideZoneCdSpecifier === null && provideZonelessCdSpecifier === null) {
        return false;
    }
    const found = ts.forEachChild(literal, function walk(node) {
        if (ts.isCallExpression(node)) {
            if (provideZonelessCdSpecifier &&
                node.getText().includes(provideZonelessCdSpecifier.getText())) {
                return true;
            }
            if (provideZoneCdSpecifier && node.getText().includes(provideZoneCdSpecifier.getText())) {
                return true;
            }
        }
        return ts.forEachChild(node, walk);
    });
    return !!found;
}
function getObjectLiteralFromIdentifier(identifier, typeChecker) {
    let symbol = typeChecker.getSymbolAtLocation(identifier);
    if (!symbol)
        return;
    // Follow aliases (for imported symbols)
    if ((symbol.flags & ts.SymbolFlags.Alias) !== 0) {
        symbol = typeChecker.getAliasedSymbol(symbol);
    }
    const declarations = symbol.getDeclarations();
    if (!declarations)
        return;
    for (const decl of declarations) {
        if (ts.isVariableDeclaration(decl) &&
            decl.initializer &&
            ts.isObjectLiteralExpression(decl.initializer)) {
            return decl.initializer;
        }
    }
    return;
}
/**
 * Extracts the import specifiers related to bootstraping from the source file.
 * Returns null if no relevant specifiers are found.
 */
function getSpecifiers(sourceFile) {
    const createApplicationSpecifier = imports.getImportSpecifier(sourceFile, '@angular/core', 'createApplication');
    const bootstrapAppSpecifier = imports.getImportSpecifier(sourceFile, '@angular/platform-browser', 'bootstrapApplication');
    const platformBrowserDynamicSpecifier = imports.getImportSpecifier(sourceFile, '@angular/platform-browser-dynamic', 'platformBrowserDynamic');
    const platformBrowserSpecifier = imports.getImportSpecifier(sourceFile, '@angular/platform-browser', 'platformBrowser');
    const testBedSpecifier = imports.getImportSpecifier(sourceFile, '@angular/core/testing', 'TestBed');
    const getTestBedSpecifier = imports.getImportSpecifier(sourceFile, '@angular/core/testing', 'getTestBed');
    const ngModuleSpecifier = imports.getImportSpecifier(sourceFile, '@angular/core', 'NgModule');
    if (!createApplicationSpecifier &&
        !bootstrapAppSpecifier &&
        !platformBrowserDynamicSpecifier &&
        !platformBrowserSpecifier &&
        !testBedSpecifier &&
        !ngModuleSpecifier &&
        !getTestBedSpecifier) {
        return null;
    }
    return {
        createApplicationSpecifier,
        bootstrapAppSpecifier,
        platformBrowserDynamicSpecifier,
        platformBrowserSpecifier,
        testBedSpecifier,
        ngModuleSpecifier,
        getTestBedSpecifier,
    };
}
/**
 * Removes duplicate replacements and for replacements at the same position, takes the longest one.
 */
function deduplicateReplacements(replacements) {
    if (replacements.length <= 1) {
        return replacements;
    }
    // Group replacements by file and position
    const groupedByFileAndPosition = new Map();
    for (const replacement of replacements) {
        const fileKey = replacement.projectFile.id;
        const position = replacement.update.data.position;
        if (!groupedByFileAndPosition.has(fileKey)) {
            groupedByFileAndPosition.set(fileKey, new Map());
        }
        const fileReplacements = groupedByFileAndPosition.get(fileKey);
        if (!fileReplacements.has(position)) {
            fileReplacements.set(position, []);
        }
        fileReplacements.get(position).push(replacement);
    }
    const result = [];
    for (const fileReplacements of groupedByFileAndPosition.values()) {
        for (const positionReplacements of fileReplacements.values()) {
            if (positionReplacements.length === 1) {
                result.push(positionReplacements[0]);
            }
            else {
                // For multiple replacements at the same position, take the one with the longest content
                const longestReplacement = positionReplacements.reduce((longest, current) => {
                    const longestLength = longest.update.data.toInsert.length;
                    const currentLength = current.update.data.toInsert.length;
                    return currentLength > longestLength ? current : longest;
                });
                result.push(longestReplacement);
            }
        }
    }
    return result;
}
/**
 * In the case we're looking to insert a new ZoneChangeDetectionModule, we need to check if we already inserted one.
 *
 * This function also checks if the existing one has fewer options (shorter text length), which means the previous migration strategy inserted one
 * but the following one is more complete and we should still add it (the dedup function will take care of the cleanup).
 */
function replacementsHaveZoneCdModule(rootRelativePath, replacements, text) {
    return replacements.some((replacement) => {
        const exisitingText = replacement.update.data.toInsert;
        const isSameFile = replacement.projectFile.rootRelativePath === rootRelativePath;
        return (isSameFile &&
            text.includes('ZoneChangeDetectionModule') &&
            exisitingText.length >= text.length);
    });
}

function migrate() {
    return async (tree) => {
        await project_paths.runMigrationInDevkit({
            tree,
            getMigration: () => new BootstrapOptionsMigration(),
        });
    };
}

exports.migrate = migrate;
