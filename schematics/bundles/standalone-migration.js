'use strict';
/**
 * @license Angular v20.0.0-next.3+sha-dcfa8a0
 * (c) 2010-2025 Google LLC. https://angular.io/
 * License: MIT
 */
'use strict';

var schematics = require('@angular-devkit/schematics');
var index = require('./index-B4OAlHh8.js');
var fs = require('fs');
var p = require('path');
var ts = require('typescript');
var compiler_host = require('./compiler_host-DwM3ugW3.js');
var project_tsconfig_paths = require('./project_tsconfig_paths-CDVxT6Ov.js');
var ng_decorators = require('./ng_decorators-DznZ5jMl.js');
var nodes = require('./nodes-B16H9JUd.js');
var symbol = require('./symbol-VPWguRxr.js');
var imports = require('./imports-CIX-JgAN.js');
var checker = require('./checker-k591b6WQ.js');
require('os');
require('@angular-devkit/core');
require('module');
require('url');

function createProgram({ rootNames, options, host, oldProgram, }) {
    return new index.NgtscProgram(rootNames, options, host, oldProgram);
}

/*!
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */
/** Utility class used to track a one-to-many relationship where all the items are unique. */
class UniqueItemTracker {
    _nodes = new Map();
    track(key, item) {
        const set = this._nodes.get(key);
        if (set) {
            set.add(item);
        }
        else {
            this._nodes.set(key, new Set([item]));
        }
    }
    get(key) {
        return this._nodes.get(key);
    }
    getEntries() {
        return this._nodes.entries();
    }
    isEmpty() {
        return this._nodes.size === 0;
    }
}
/** Resolves references to nodes. */
class ReferenceResolver {
    _program;
    _host;
    _rootFileNames;
    _basePath;
    _excludedFiles;
    _languageService;
    /**
     * If set, allows the language service to *only* read a specific file.
     * Used to speed up single-file lookups.
     */
    _tempOnlyFile = null;
    constructor(_program, _host, _rootFileNames, _basePath, _excludedFiles) {
        this._program = _program;
        this._host = _host;
        this._rootFileNames = _rootFileNames;
        this._basePath = _basePath;
        this._excludedFiles = _excludedFiles;
    }
    /** Finds all references to a node within the entire project. */
    findReferencesInProject(node) {
        const languageService = this._getLanguageService();
        const fileName = node.getSourceFile().fileName;
        const start = node.getStart();
        let referencedSymbols;
        // The language service can throw if it fails to read a file.
        // Silently continue since we're making the lookup on a best effort basis.
        try {
            referencedSymbols = languageService.findReferences(fileName, start) || [];
        }
        catch (e) {
            console.error('Failed reference lookup for node ' + node.getText(), e.message);
            referencedSymbols = [];
        }
        const results = new Map();
        for (const symbol of referencedSymbols) {
            for (const ref of symbol.references) {
                if (!ref.isDefinition || symbol.definition.kind === ts.ScriptElementKind.alias) {
                    if (!results.has(ref.fileName)) {
                        results.set(ref.fileName, []);
                    }
                    results
                        .get(ref.fileName)
                        .push([ref.textSpan.start, ref.textSpan.start + ref.textSpan.length]);
                }
            }
        }
        return results;
    }
    /** Finds all references to a node within a single file. */
    findSameFileReferences(node, fileName) {
        // Even though we're only passing in a single file into `getDocumentHighlights`, the language
        // service ends up traversing the entire project. Prevent it from reading any files aside from
        // the one we're interested in by intercepting it at the compiler host level.
        // This is an order of magnitude faster on a large project.
        this._tempOnlyFile = fileName;
        const nodeStart = node.getStart();
        const results = [];
        let highlights;
        // The language service can throw if it fails to read a file.
        // Silently continue since we're making the lookup on a best effort basis.
        try {
            highlights = this._getLanguageService().getDocumentHighlights(fileName, nodeStart, [
                fileName,
            ]);
        }
        catch (e) {
            console.error('Failed reference lookup for node ' + node.getText(), e.message);
        }
        if (highlights) {
            for (const file of highlights) {
                // We are pretty much guaranteed to only have one match from the current file since it is
                // the only one being passed in `getDocumentHighlight`, but we check here just in case.
                if (file.fileName === fileName) {
                    for (const { textSpan: { start, length }, kind, } of file.highlightSpans) {
                        if (kind !== ts.HighlightSpanKind.none) {
                            results.push([start, start + length]);
                        }
                    }
                }
            }
        }
        // Restore full project access to the language service.
        this._tempOnlyFile = null;
        return results;
    }
    /** Used by the language service  */
    _readFile(path) {
        if ((this._tempOnlyFile !== null && path !== this._tempOnlyFile) ||
            this._excludedFiles?.test(path)) {
            return '';
        }
        return this._host.readFile(path);
    }
    /** Gets a language service that can be used to perform lookups. */
    _getLanguageService() {
        if (!this._languageService) {
            const rootFileNames = this._rootFileNames.slice();
            this._program
                .getTsProgram()
                .getSourceFiles()
                .forEach(({ fileName }) => {
                if (!this._excludedFiles?.test(fileName) && !rootFileNames.includes(fileName)) {
                    rootFileNames.push(fileName);
                }
            });
            this._languageService = ts.createLanguageService({
                getCompilationSettings: () => this._program.getTsProgram().getCompilerOptions(),
                getScriptFileNames: () => rootFileNames,
                // The files won't change so we can return the same version.
                getScriptVersion: () => '0',
                getScriptSnapshot: (path) => {
                    const content = this._readFile(path);
                    return content ? ts.ScriptSnapshot.fromString(content) : undefined;
                },
                getCurrentDirectory: () => this._basePath,
                getDefaultLibFileName: (options) => ts.getDefaultLibFilePath(options),
                readFile: (path) => this._readFile(path),
                fileExists: (path) => this._host.fileExists(path),
            }, ts.createDocumentRegistry(), ts.LanguageServiceMode.PartialSemantic);
        }
        return this._languageService;
    }
}
/** Creates a NodeLookup object from a source file. */
function getNodeLookup(sourceFile) {
    const lookup = new Map();
    sourceFile.forEachChild(function walk(node) {
        const nodesAtStart = lookup.get(node.getStart());
        if (nodesAtStart) {
            nodesAtStart.push(node);
        }
        else {
            lookup.set(node.getStart(), [node]);
        }
        node.forEachChild(walk);
    });
    return lookup;
}
/**
 * Converts node offsets to the nodes they correspond to.
 * @param lookup Data structure used to look up nodes at particular positions.
 * @param offsets Offsets of the nodes.
 * @param results Set in which to store the results.
 */
function offsetsToNodes(lookup, offsets, results) {
    for (const [start, end] of offsets) {
        const match = lookup.get(start)?.find((node) => node.getEnd() === end);
        if (match) {
            results.add(match);
        }
    }
    return results;
}
/**
 * Finds the class declaration that is being referred to by a node.
 * @param reference Node referring to a class declaration.
 * @param typeChecker
 */
function findClassDeclaration(reference, typeChecker) {
    return (typeChecker
        .getTypeAtLocation(reference)
        .getSymbol()
        ?.declarations?.find(ts.isClassDeclaration) || null);
}
/** Finds a property with a specific name in an object literal expression. */
function findLiteralProperty(literal, name) {
    return literal.properties.find((prop) => prop.name && ts.isIdentifier(prop.name) && prop.name.text === name);
}
/** Gets a relative path between two files that can be used inside a TypeScript import. */
function getRelativeImportPath(fromFile, toFile) {
    let path = p.relative(p.dirname(fromFile), toFile).replace(/\.ts$/, '');
    // `relative` returns paths inside the same directory without `./`
    if (!path.startsWith('.')) {
        path = './' + path;
    }
    // Using the Node utilities can yield paths with forward slashes on Windows.
    return compiler_host.normalizePath(path);
}
/** Function used to remap the generated `imports` for a component to known shorter aliases. */
function knownInternalAliasRemapper(imports) {
    return imports.map((current) => current.moduleSpecifier === '@angular/common' && current.symbolName === 'NgForOf'
        ? { ...current, symbolName: 'NgFor' }
        : current);
}
/**
 * Gets the closest node that matches a predicate, including the node that the search started from.
 * @param node Node from which to start the search.
 * @param predicate Predicate that the result needs to pass.
 */
function closestOrSelf(node, predicate) {
    return predicate(node) ? node : nodes.closestNode(node, predicate);
}
/**
 * Checks whether a node is referring to a specific class declaration.
 * @param node Node that is being checked.
 * @param className Name of the class that the node might be referring to.
 * @param moduleName Name of the Angular module that should contain the class.
 * @param typeChecker
 */
function isClassReferenceInAngularModule(node, className, moduleName, typeChecker) {
    const symbol = typeChecker.getTypeAtLocation(node).getSymbol();
    const externalName = `@angular/${moduleName}`;
    const internalName = `angular2/rc/packages/${moduleName}`;
    return !!symbol?.declarations?.some((decl) => {
        const closestClass = closestOrSelf(decl, ts.isClassDeclaration);
        const closestClassFileName = closestClass?.getSourceFile().fileName;
        if (!closestClass ||
            !closestClassFileName ||
            !closestClass.name ||
            !ts.isIdentifier(closestClass.name) ||
            (!closestClassFileName.includes(externalName) && !closestClassFileName.includes(internalName))) {
            return false;
        }
        return typeof className === 'string'
            ? closestClass.name.text === className
            : className.test(closestClass.name.text);
    });
}
/**
 * Finds the imports of testing libraries in a file.
 */
function getTestingImports(sourceFile) {
    return {
        testBed: imports.getImportSpecifier(sourceFile, '@angular/core/testing', 'TestBed'),
        catalyst: imports.getImportSpecifier(sourceFile, /testing\/catalyst(\/(fake_)?async)?$/, 'setupModule'),
    };
}
/**
 * Determines if a node is a call to a testing API.
 * @param typeChecker Type checker to use when resolving references.
 * @param node Node to check.
 * @param testBedImport Import of TestBed within the file.
 * @param catalystImport Import of Catalyst within the file.
 */
function isTestCall(typeChecker, node, testBedImport, catalystImport) {
    const isObjectLiteralCall = ts.isCallExpression(node) &&
        node.arguments.length > 0 &&
        // `arguments[0]` is the testing module config.
        ts.isObjectLiteralExpression(node.arguments[0]);
    const isTestBedCall = isObjectLiteralCall &&
        testBedImport &&
        ts.isPropertyAccessExpression(node.expression) &&
        node.expression.name.text === 'configureTestingModule' &&
        symbol.isReferenceToImport(typeChecker, node.expression.expression, testBedImport);
    const isCatalystCall = isObjectLiteralCall &&
        catalystImport &&
        ts.isIdentifier(node.expression) &&
        symbol.isReferenceToImport(typeChecker, node.expression, catalystImport);
    return !!(isTestBedCall || isCatalystCall);
}

/*!
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */
/**
 * Converts all declarations in the specified files to standalone.
 * @param sourceFiles Files that should be migrated.
 * @param program
 * @param printer
 * @param fileImportRemapper Optional function that can be used to remap file-level imports.
 * @param declarationImportRemapper Optional function that can be used to remap declaration-level
 * imports.
 */
function toStandalone(sourceFiles, program, printer, fileImportRemapper, declarationImportRemapper) {
    const templateTypeChecker = program.compiler.getTemplateTypeChecker();
    const typeChecker = program.getTsProgram().getTypeChecker();
    const modulesToMigrate = new Set();
    const testObjectsToMigrate = new Set();
    const declarations = new Set();
    const tracker = new compiler_host.ChangeTracker(printer, fileImportRemapper);
    for (const sourceFile of sourceFiles) {
        const modules = findNgModuleClassesToMigrate(sourceFile, typeChecker);
        const testObjects = findTestObjectsToMigrate(sourceFile, typeChecker);
        for (const module of modules) {
            const allModuleDeclarations = extractDeclarationsFromModule(module, templateTypeChecker);
            const unbootstrappedDeclarations = filterNonBootstrappedDeclarations(allModuleDeclarations, module, templateTypeChecker, typeChecker);
            if (unbootstrappedDeclarations.length > 0) {
                modulesToMigrate.add(module);
                unbootstrappedDeclarations.forEach((decl) => declarations.add(decl));
            }
        }
        testObjects.forEach((obj) => testObjectsToMigrate.add(obj));
    }
    for (const declaration of declarations) {
        convertNgModuleDeclarationToStandalone(declaration, declarations, tracker, templateTypeChecker, declarationImportRemapper);
    }
    for (const node of modulesToMigrate) {
        migrateNgModuleClass(node, declarations, tracker, typeChecker, templateTypeChecker);
    }
    migrateTestDeclarations(testObjectsToMigrate, declarations, tracker, templateTypeChecker, typeChecker);
    return tracker.recordChanges();
}
/**
 * Converts a single declaration defined through an NgModule to standalone.
 * @param decl Declaration being converted.
 * @param tracker Tracker used to track the file changes.
 * @param allDeclarations All the declarations that are being converted as a part of this migration.
 * @param typeChecker
 * @param importRemapper
 */
function convertNgModuleDeclarationToStandalone(decl, allDeclarations, tracker, typeChecker, importRemapper) {
    const directiveMeta = typeChecker.getDirectiveMetadata(decl);
    if (directiveMeta && directiveMeta.decorator && !directiveMeta.isStandalone) {
        let decorator = markDecoratorAsStandalone(directiveMeta.decorator);
        if (directiveMeta.isComponent) {
            const importsToAdd = getComponentImportExpressions(decl, allDeclarations, tracker, typeChecker, importRemapper);
            if (importsToAdd.length > 0) {
                const hasTrailingComma = importsToAdd.length > 2 &&
                    !!extractMetadataLiteral(directiveMeta.decorator)?.properties.hasTrailingComma;
                decorator = setPropertyOnAngularDecorator(decorator, 'imports', ts.factory.createArrayLiteralExpression(
                // Create a multi-line array when it has a trailing comma.
                ts.factory.createNodeArray(importsToAdd, hasTrailingComma), hasTrailingComma));
            }
        }
        tracker.replaceNode(directiveMeta.decorator, decorator);
    }
    else {
        const pipeMeta = typeChecker.getPipeMetadata(decl);
        if (pipeMeta && pipeMeta.decorator && !pipeMeta.isStandalone) {
            tracker.replaceNode(pipeMeta.decorator, markDecoratorAsStandalone(pipeMeta.decorator));
        }
    }
}
/**
 * Gets the expressions that should be added to a component's
 * `imports` array based on its template dependencies.
 * @param decl Component class declaration.
 * @param allDeclarations All the declarations that are being converted as a part of this migration.
 * @param tracker
 * @param typeChecker
 * @param importRemapper
 */
function getComponentImportExpressions(decl, allDeclarations, tracker, typeChecker, importRemapper) {
    const templateDependencies = findTemplateDependencies(decl, typeChecker);
    const usedDependenciesInMigration = new Set(templateDependencies.filter((dep) => allDeclarations.has(dep.node)));
    const seenImports = new Set();
    const resolvedDependencies = [];
    for (const dep of templateDependencies) {
        const importLocation = findImportLocation(dep, decl, usedDependenciesInMigration.has(dep)
            ? checker.PotentialImportMode.ForceDirect
            : checker.PotentialImportMode.Normal, typeChecker);
        if (importLocation && !seenImports.has(importLocation.symbolName)) {
            seenImports.add(importLocation.symbolName);
            resolvedDependencies.push(importLocation);
        }
    }
    return potentialImportsToExpressions(resolvedDependencies, decl.getSourceFile(), tracker, importRemapper);
}
/**
 * Converts an array of potential imports to an array of expressions that can be
 * added to the `imports` array.
 * @param potentialImports Imports to be converted.
 * @param component Component class to which the imports will be added.
 * @param tracker
 * @param importRemapper
 */
function potentialImportsToExpressions(potentialImports, toFile, tracker, importRemapper) {
    const processedDependencies = importRemapper
        ? importRemapper(potentialImports)
        : potentialImports;
    return processedDependencies.map((importLocation) => {
        if (importLocation.moduleSpecifier) {
            return tracker.addImport(toFile, importLocation.symbolName, importLocation.moduleSpecifier);
        }
        const identifier = ts.factory.createIdentifier(importLocation.symbolName);
        if (!importLocation.isForwardReference) {
            return identifier;
        }
        const forwardRefExpression = tracker.addImport(toFile, 'forwardRef', '@angular/core');
        const arrowFunction = ts.factory.createArrowFunction(undefined, undefined, [], undefined, undefined, identifier);
        return ts.factory.createCallExpression(forwardRefExpression, undefined, [arrowFunction]);
    });
}
/**
 * Moves all of the declarations of a class decorated with `@NgModule` to its imports.
 * @param node Class being migrated.
 * @param allDeclarations All the declarations that are being converted as a part of this migration.
 * @param tracker
 * @param typeChecker
 * @param templateTypeChecker
 */
function migrateNgModuleClass(node, allDeclarations, tracker, typeChecker, templateTypeChecker) {
    const decorator = templateTypeChecker.getNgModuleMetadata(node)?.decorator;
    const metadata = decorator ? extractMetadataLiteral(decorator) : null;
    if (metadata) {
        moveDeclarationsToImports(metadata, allDeclarations, typeChecker, templateTypeChecker, tracker);
    }
}
/**
 * Moves all the symbol references from the `declarations` array to the `imports`
 * array of an `NgModule` class and removes the `declarations`.
 * @param literal Object literal used to configure the module that should be migrated.
 * @param allDeclarations All the declarations that are being converted as a part of this migration.
 * @param typeChecker
 * @param tracker
 */
function moveDeclarationsToImports(literal, allDeclarations, typeChecker, templateTypeChecker, tracker) {
    const declarationsProp = findLiteralProperty(literal, 'declarations');
    if (!declarationsProp) {
        return;
    }
    const declarationsToPreserve = [];
    const declarationsToCopy = [];
    const properties = [];
    const importsProp = findLiteralProperty(literal, 'imports');
    const hasAnyArrayTrailingComma = literal.properties.some((prop) => ts.isPropertyAssignment(prop) &&
        ts.isArrayLiteralExpression(prop.initializer) &&
        prop.initializer.elements.hasTrailingComma);
    // Separate the declarations that we want to keep and ones we need to copy into the `imports`.
    if (ts.isPropertyAssignment(declarationsProp)) {
        // If the declarations are an array, we can analyze it to
        // find any classes from the current migration.
        if (ts.isArrayLiteralExpression(declarationsProp.initializer)) {
            for (const el of declarationsProp.initializer.elements) {
                if (ts.isIdentifier(el)) {
                    const correspondingClass = findClassDeclaration(el, typeChecker);
                    if (!correspondingClass ||
                        // Check whether the declaration is either standalone already or is being converted
                        // in this migration. We need to check if it's standalone already, in order to correct
                        // some cases where the main app and the test files are being migrated in separate
                        // programs.
                        isStandaloneDeclaration(correspondingClass, allDeclarations, templateTypeChecker)) {
                        declarationsToCopy.push(el);
                    }
                    else {
                        declarationsToPreserve.push(el);
                    }
                }
                else {
                    declarationsToCopy.push(el);
                }
            }
        }
        else {
            // Otherwise create a spread that will be copied into the `imports`.
            declarationsToCopy.push(ts.factory.createSpreadElement(declarationsProp.initializer));
        }
    }
    // If there are no `imports`, create them with the declarations we want to copy.
    if (!importsProp && declarationsToCopy.length > 0) {
        properties.push(ts.factory.createPropertyAssignment('imports', ts.factory.createArrayLiteralExpression(ts.factory.createNodeArray(declarationsToCopy, hasAnyArrayTrailingComma && declarationsToCopy.length > 2))));
    }
    for (const prop of literal.properties) {
        if (!isNamedPropertyAssignment(prop)) {
            properties.push(prop);
            continue;
        }
        // If we have declarations to preserve, update the existing property, otherwise drop it.
        if (prop === declarationsProp) {
            if (declarationsToPreserve.length > 0) {
                const hasTrailingComma = ts.isArrayLiteralExpression(prop.initializer)
                    ? prop.initializer.elements.hasTrailingComma
                    : hasAnyArrayTrailingComma;
                properties.push(ts.factory.updatePropertyAssignment(prop, prop.name, ts.factory.createArrayLiteralExpression(ts.factory.createNodeArray(declarationsToPreserve, hasTrailingComma && declarationsToPreserve.length > 2))));
            }
            continue;
        }
        // If we have an `imports` array and declarations
        // that should be copied, we merge the two arrays.
        if (prop === importsProp && declarationsToCopy.length > 0) {
            let initializer;
            if (ts.isArrayLiteralExpression(prop.initializer)) {
                initializer = ts.factory.updateArrayLiteralExpression(prop.initializer, ts.factory.createNodeArray([...prop.initializer.elements, ...declarationsToCopy], prop.initializer.elements.hasTrailingComma));
            }
            else {
                initializer = ts.factory.createArrayLiteralExpression(ts.factory.createNodeArray([ts.factory.createSpreadElement(prop.initializer), ...declarationsToCopy], 
                // Expect the declarations to be greater than 1 since
                // we have the pre-existing initializer already.
                hasAnyArrayTrailingComma && declarationsToCopy.length > 1));
            }
            properties.push(ts.factory.updatePropertyAssignment(prop, prop.name, initializer));
            continue;
        }
        // Retain any remaining properties.
        properties.push(prop);
    }
    tracker.replaceNode(literal, ts.factory.updateObjectLiteralExpression(literal, ts.factory.createNodeArray(properties, literal.properties.hasTrailingComma)), ts.EmitHint.Expression);
}
/** Sets a decorator node to be standalone. */
function markDecoratorAsStandalone(node) {
    const metadata = extractMetadataLiteral(node);
    if (metadata === null || !ts.isCallExpression(node.expression)) {
        return node;
    }
    const standaloneProp = metadata.properties.find((prop) => {
        return isNamedPropertyAssignment(prop) && prop.name.text === 'standalone';
    });
    // In v19 standalone is the default so don't do anything if there's no `standalone`
    // property or it's initialized to anything other than `false`.
    if (!standaloneProp || standaloneProp.initializer.kind !== ts.SyntaxKind.FalseKeyword) {
        return node;
    }
    const newProperties = metadata.properties.filter((element) => element !== standaloneProp);
    // Use `createDecorator` instead of `updateDecorator`, because
    // the latter ends up duplicating the node's leading comment.
    return ts.factory.createDecorator(ts.factory.createCallExpression(node.expression.expression, node.expression.typeArguments, [
        ts.factory.createObjectLiteralExpression(ts.factory.createNodeArray(newProperties, metadata.properties.hasTrailingComma), newProperties.length > 1),
    ]));
}
/**
 * Sets a property on an Angular decorator node. If the property
 * already exists, its initializer will be replaced.
 * @param node Decorator to which to add the property.
 * @param name Name of the property to be added.
 * @param initializer Initializer for the new property.
 */
function setPropertyOnAngularDecorator(node, name, initializer) {
    // Invalid decorator.
    if (!ts.isCallExpression(node.expression) || node.expression.arguments.length > 1) {
        return node;
    }
    let literalProperties;
    let hasTrailingComma = false;
    if (node.expression.arguments.length === 0) {
        literalProperties = [ts.factory.createPropertyAssignment(name, initializer)];
    }
    else if (ts.isObjectLiteralExpression(node.expression.arguments[0])) {
        const literal = node.expression.arguments[0];
        const existingProperty = findLiteralProperty(literal, name);
        hasTrailingComma = literal.properties.hasTrailingComma;
        if (existingProperty && ts.isPropertyAssignment(existingProperty)) {
            literalProperties = literal.properties.slice();
            literalProperties[literalProperties.indexOf(existingProperty)] =
                ts.factory.updatePropertyAssignment(existingProperty, existingProperty.name, initializer);
        }
        else {
            literalProperties = [
                ...literal.properties,
                ts.factory.createPropertyAssignment(name, initializer),
            ];
        }
    }
    else {
        // Unsupported case (e.g. `@Component(SOME_CONST)`). Return the original node.
        return node;
    }
    // Use `createDecorator` instead of `updateDecorator`, because
    // the latter ends up duplicating the node's leading comment.
    return ts.factory.createDecorator(ts.factory.createCallExpression(node.expression.expression, node.expression.typeArguments, [
        ts.factory.createObjectLiteralExpression(ts.factory.createNodeArray(literalProperties, hasTrailingComma), literalProperties.length > 1),
    ]));
}
/** Checks if a node is a `PropertyAssignment` with a name. */
function isNamedPropertyAssignment(node) {
    return ts.isPropertyAssignment(node) && node.name && ts.isIdentifier(node.name);
}
/**
 * Finds the import from which to bring in a template dependency of a component.
 * @param target Dependency that we're searching for.
 * @param inContext Component in which the dependency is used.
 * @param importMode Mode in which to resolve the import target.
 * @param typeChecker
 */
function findImportLocation(target, inContext, importMode, typeChecker) {
    const importLocations = typeChecker.getPotentialImportsFor(target, inContext, importMode);
    let firstSameFileImport = null;
    let firstModuleImport = null;
    for (const location of importLocations) {
        // Prefer a standalone import, if we can find one.
        // Otherwise fall back to the first module-based import.
        if (location.kind === checker.PotentialImportKind.Standalone) {
            return location;
        }
        if (!location.moduleSpecifier && !firstSameFileImport) {
            firstSameFileImport = location;
        }
        if (location.kind === checker.PotentialImportKind.NgModule &&
            !firstModuleImport &&
            // ɵ is used for some internal Angular modules that we want to skip over.
            !location.symbolName.startsWith('ɵ')) {
            firstModuleImport = location;
        }
    }
    return firstSameFileImport || firstModuleImport || importLocations[0] || null;
}
/**
 * Checks whether a node is an `NgModule` metadata element with at least one element.
 * E.g. `declarations: [Foo]` or `declarations: SOME_VAR` would match this description,
 * but not `declarations: []`.
 */
function hasNgModuleMetadataElements(node) {
    return (ts.isPropertyAssignment(node) &&
        (!ts.isArrayLiteralExpression(node.initializer) || node.initializer.elements.length > 0));
}
/** Finds all modules whose declarations can be migrated. */
function findNgModuleClassesToMigrate(sourceFile, typeChecker) {
    const modules = [];
    if (imports.getImportSpecifier(sourceFile, '@angular/core', 'NgModule')) {
        sourceFile.forEachChild(function walk(node) {
            if (ts.isClassDeclaration(node)) {
                const decorator = ng_decorators.getAngularDecorators(typeChecker, ts.getDecorators(node) || []).find((current) => current.name === 'NgModule');
                const metadata = decorator ? extractMetadataLiteral(decorator.node) : null;
                if (metadata) {
                    const declarations = findLiteralProperty(metadata, 'declarations');
                    if (declarations != null && hasNgModuleMetadataElements(declarations)) {
                        modules.push(node);
                    }
                }
            }
            node.forEachChild(walk);
        });
    }
    return modules;
}
/** Finds all testing object literals that need to be migrated. */
function findTestObjectsToMigrate(sourceFile, typeChecker) {
    const testObjects = [];
    const { testBed, catalyst } = getTestingImports(sourceFile);
    if (testBed || catalyst) {
        sourceFile.forEachChild(function walk(node) {
            if (isTestCall(typeChecker, node, testBed, catalyst)) {
                const config = node.arguments[0];
                const declarations = findLiteralProperty(config, 'declarations');
                if (declarations &&
                    ts.isPropertyAssignment(declarations) &&
                    ts.isArrayLiteralExpression(declarations.initializer) &&
                    declarations.initializer.elements.length > 0) {
                    testObjects.push(config);
                }
            }
            node.forEachChild(walk);
        });
    }
    return testObjects;
}
/**
 * Finds the classes corresponding to dependencies used in a component's template.
 * @param decl Component in whose template we're looking for dependencies.
 * @param typeChecker
 */
function findTemplateDependencies(decl, typeChecker) {
    const results = [];
    const usedDirectives = typeChecker.getUsedDirectives(decl);
    const usedPipes = typeChecker.getUsedPipes(decl);
    if (usedDirectives !== null) {
        for (const dir of usedDirectives) {
            if (ts.isClassDeclaration(dir.ref.node)) {
                results.push(dir.ref);
            }
        }
    }
    if (usedPipes !== null) {
        const potentialPipes = typeChecker.getPotentialPipes(decl);
        for (const pipe of potentialPipes) {
            if (ts.isClassDeclaration(pipe.ref.node) &&
                usedPipes.some((current) => pipe.name === current)) {
                results.push(pipe.ref);
            }
        }
    }
    return results;
}
/**
 * Removes any declarations that are a part of a module's `bootstrap`
 * array from an array of declarations.
 * @param declarations Anaalyzed declarations of the module.
 * @param ngModule Module whote declarations are being filtered.
 * @param templateTypeChecker
 * @param typeChecker
 */
function filterNonBootstrappedDeclarations(declarations, ngModule, templateTypeChecker, typeChecker) {
    const metadata = templateTypeChecker.getNgModuleMetadata(ngModule);
    const metaLiteral = metadata && metadata.decorator ? extractMetadataLiteral(metadata.decorator) : null;
    const bootstrapProp = metaLiteral ? findLiteralProperty(metaLiteral, 'bootstrap') : null;
    // If there's no `bootstrap`, we can't filter.
    if (!bootstrapProp) {
        return declarations;
    }
    // If we can't analyze the `bootstrap` property, we can't safely determine which
    // declarations aren't bootstrapped so we assume that all of them are.
    if (!ts.isPropertyAssignment(bootstrapProp) ||
        !ts.isArrayLiteralExpression(bootstrapProp.initializer)) {
        return [];
    }
    const bootstrappedClasses = new Set();
    for (const el of bootstrapProp.initializer.elements) {
        const referencedClass = ts.isIdentifier(el) ? findClassDeclaration(el, typeChecker) : null;
        // If we can resolve an element to a class, we can filter it out,
        // otherwise assume that the array isn't static.
        if (referencedClass) {
            bootstrappedClasses.add(referencedClass);
        }
        else {
            return [];
        }
    }
    return declarations.filter((ref) => !bootstrappedClasses.has(ref));
}
/**
 * Extracts all classes that are referenced in a module's `declarations` array.
 * @param ngModule Module whose declarations are being extraced.
 * @param templateTypeChecker
 */
function extractDeclarationsFromModule(ngModule, templateTypeChecker) {
    const metadata = templateTypeChecker.getNgModuleMetadata(ngModule);
    return metadata
        ? metadata.declarations
            .filter((decl) => ts.isClassDeclaration(decl.node))
            .map((decl) => decl.node)
        : [];
}
/**
 * Migrates the `declarations` from a unit test file to standalone.
 * @param testObjects Object literals used to configure the testing modules.
 * @param declarationsOutsideOfTestFiles Non-testing declarations that are part of this migration.
 * @param tracker
 * @param templateTypeChecker
 * @param typeChecker
 */
function migrateTestDeclarations(testObjects, declarationsOutsideOfTestFiles, tracker, templateTypeChecker, typeChecker) {
    const { decorators, componentImports } = analyzeTestingModules(testObjects, typeChecker);
    const allDeclarations = new Set(declarationsOutsideOfTestFiles);
    for (const decorator of decorators) {
        const closestClass = nodes.closestNode(decorator.node, ts.isClassDeclaration);
        if (decorator.name === 'Pipe' || decorator.name === 'Directive') {
            tracker.replaceNode(decorator.node, markDecoratorAsStandalone(decorator.node));
            if (closestClass) {
                allDeclarations.add(closestClass);
            }
        }
        else if (decorator.name === 'Component') {
            const newDecorator = markDecoratorAsStandalone(decorator.node);
            const importsToAdd = componentImports.get(decorator.node);
            if (closestClass) {
                allDeclarations.add(closestClass);
            }
            if (importsToAdd && importsToAdd.size > 0) {
                const hasTrailingComma = importsToAdd.size > 2 &&
                    !!extractMetadataLiteral(decorator.node)?.properties.hasTrailingComma;
                const importsArray = ts.factory.createNodeArray(Array.from(importsToAdd), hasTrailingComma);
                tracker.replaceNode(decorator.node, setPropertyOnAngularDecorator(newDecorator, 'imports', ts.factory.createArrayLiteralExpression(importsArray)));
            }
            else {
                tracker.replaceNode(decorator.node, newDecorator);
            }
        }
    }
    for (const obj of testObjects) {
        moveDeclarationsToImports(obj, allDeclarations, typeChecker, templateTypeChecker, tracker);
    }
}
/**
 * Analyzes a set of objects used to configure testing modules and returns the AST
 * nodes that need to be migrated and the imports that should be added to the imports
 * of any declared components.
 * @param testObjects Object literals that should be analyzed.
 */
function analyzeTestingModules(testObjects, typeChecker) {
    const seenDeclarations = new Set();
    const decorators = [];
    const componentImports = new Map();
    for (const obj of testObjects) {
        const declarations = extractDeclarationsFromTestObject(obj, typeChecker);
        if (declarations.length === 0) {
            continue;
        }
        const importsProp = findLiteralProperty(obj, 'imports');
        const importElements = importsProp &&
            hasNgModuleMetadataElements(importsProp) &&
            ts.isArrayLiteralExpression(importsProp.initializer)
            ? importsProp.initializer.elements.filter((el) => {
                // Filter out calls since they may be a `ModuleWithProviders`.
                return (!ts.isCallExpression(el) &&
                    // Also filter out the animations modules since they throw errors if they're imported
                    // multiple times and it's common for apps to use the `NoopAnimationsModule` to
                    // disable animations in screenshot tests.
                    !isClassReferenceInAngularModule(el, /^BrowserAnimationsModule|NoopAnimationsModule$/, 'platform-browser/animations', typeChecker));
            })
            : null;
        for (const decl of declarations) {
            if (seenDeclarations.has(decl)) {
                continue;
            }
            const [decorator] = ng_decorators.getAngularDecorators(typeChecker, ts.getDecorators(decl) || []);
            if (decorator) {
                seenDeclarations.add(decl);
                decorators.push(decorator);
                if (decorator.name === 'Component' && importElements) {
                    // We try to de-duplicate the imports being added to a component, because it may be
                    // declared in different testing modules with a different set of imports.
                    let imports = componentImports.get(decorator.node);
                    if (!imports) {
                        imports = new Set();
                        componentImports.set(decorator.node, imports);
                    }
                    importElements.forEach((imp) => imports.add(imp));
                }
            }
        }
    }
    return { decorators, componentImports };
}
/**
 * Finds the class declarations that are being referred
 * to in the `declarations` of an object literal.
 * @param obj Object literal that may contain the declarations.
 * @param typeChecker
 */
function extractDeclarationsFromTestObject(obj, typeChecker) {
    const results = [];
    const declarations = findLiteralProperty(obj, 'declarations');
    if (declarations &&
        hasNgModuleMetadataElements(declarations) &&
        ts.isArrayLiteralExpression(declarations.initializer)) {
        for (const element of declarations.initializer.elements) {
            const declaration = findClassDeclaration(element, typeChecker);
            // Note that we only migrate classes that are in the same file as the testing module,
            // because external fixture components are somewhat rare and handling them is going
            // to involve a lot of assumptions that are likely to be incorrect.
            if (declaration && declaration.getSourceFile().fileName === obj.getSourceFile().fileName) {
                results.push(declaration);
            }
        }
    }
    return results;
}
/** Extracts the metadata object literal from an Angular decorator. */
function extractMetadataLiteral(decorator) {
    // `arguments[0]` is the metadata object literal.
    return ts.isCallExpression(decorator.expression) &&
        decorator.expression.arguments.length === 1 &&
        ts.isObjectLiteralExpression(decorator.expression.arguments[0])
        ? decorator.expression.arguments[0]
        : null;
}
/**
 * Checks whether a class is a standalone declaration.
 * @param node Class being checked.
 * @param declarationsInMigration Classes that are being converted to standalone in this migration.
 * @param templateTypeChecker
 */
function isStandaloneDeclaration(node, declarationsInMigration, templateTypeChecker) {
    if (declarationsInMigration.has(node)) {
        return true;
    }
    const metadata = templateTypeChecker.getDirectiveMetadata(node) || templateTypeChecker.getPipeMetadata(node);
    return metadata != null && metadata.isStandalone;
}

/*!
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */
function pruneNgModules(program, host, basePath, rootFileNames, sourceFiles, printer, importRemapper, referenceLookupExcludedFiles, declarationImportRemapper) {
    const filesToRemove = new Set();
    const tracker = new compiler_host.ChangeTracker(printer, importRemapper);
    const tsProgram = program.getTsProgram();
    const typeChecker = tsProgram.getTypeChecker();
    const templateTypeChecker = program.compiler.getTemplateTypeChecker();
    const referenceResolver = new ReferenceResolver(program, host, rootFileNames, basePath, referenceLookupExcludedFiles);
    const removalLocations = {
        arrays: new UniqueItemTracker(),
        imports: new UniqueItemTracker(),
        exports: new UniqueItemTracker(),
        unknown: new Set(),
    };
    const classesToRemove = new Set();
    const barrelExports = new UniqueItemTracker();
    const componentImportArrays = new UniqueItemTracker();
    const testArrays = new UniqueItemTracker();
    const nodesToRemove = new Set();
    sourceFiles.forEach(function walk(node) {
        if (ts.isClassDeclaration(node) && canRemoveClass(node, typeChecker)) {
            collectChangeLocations(node, removalLocations, componentImportArrays, testArrays, templateTypeChecker, referenceResolver, program);
            classesToRemove.add(node);
        }
        else if (ts.isExportDeclaration(node) &&
            !node.exportClause &&
            node.moduleSpecifier &&
            ts.isStringLiteralLike(node.moduleSpecifier) &&
            node.moduleSpecifier.text.startsWith('.')) {
            const exportedSourceFile = typeChecker
                .getSymbolAtLocation(node.moduleSpecifier)
                ?.valueDeclaration?.getSourceFile();
            if (exportedSourceFile) {
                barrelExports.track(exportedSourceFile, node);
            }
        }
        node.forEachChild(walk);
    });
    replaceInComponentImportsArray(componentImportArrays, classesToRemove, tracker, typeChecker, templateTypeChecker, declarationImportRemapper);
    replaceInTestImportsArray(testArrays, removalLocations, classesToRemove, tracker, typeChecker, templateTypeChecker, declarationImportRemapper);
    // We collect all the places where we need to remove references first before generating the
    // removal instructions since we may have to remove multiple references from one node.
    removeArrayReferences(removalLocations.arrays, tracker);
    removeImportReferences(removalLocations.imports, tracker);
    removeExportReferences(removalLocations.exports, tracker);
    addRemovalTodos(removalLocations.unknown, tracker);
    // Collect all the nodes to be removed before determining which files to delete since we need
    // to know it ahead of time when deleting barrel files that export other barrel files.
    (function trackNodesToRemove(nodes) {
        for (const node of nodes) {
            const sourceFile = node.getSourceFile();
            if (!filesToRemove.has(sourceFile) && canRemoveFile(sourceFile, nodes)) {
                const barrelExportsForFile = barrelExports.get(sourceFile);
                nodesToRemove.add(node);
                filesToRemove.add(sourceFile);
                barrelExportsForFile && trackNodesToRemove(barrelExportsForFile);
            }
            else {
                nodesToRemove.add(node);
            }
        }
    })(classesToRemove);
    for (const node of nodesToRemove) {
        const sourceFile = node.getSourceFile();
        if (!filesToRemove.has(sourceFile) && canRemoveFile(sourceFile, nodesToRemove)) {
            filesToRemove.add(sourceFile);
        }
        else {
            tracker.removeNode(node);
        }
    }
    return { pendingChanges: tracker.recordChanges(), filesToRemove };
}
/**
 * Collects all the nodes that a module needs to be removed from.
 * @param ngModule Module being removed.
 * @param removalLocations Tracks the different places from which the class should be removed.
 * @param componentImportArrays Set of `imports` arrays of components that need to be adjusted.
 * @param testImportArrays Set of `imports` arrays of tests that need to be adjusted.
 * @param referenceResolver
 * @param program
 */
function collectChangeLocations(ngModule, removalLocations, componentImportArrays, testImportArrays, templateTypeChecker, referenceResolver, program) {
    const refsByFile = referenceResolver.findReferencesInProject(ngModule.name);
    const tsProgram = program.getTsProgram();
    const typeChecker = tsProgram.getTypeChecker();
    const nodes$1 = new Set();
    for (const [fileName, refs] of refsByFile) {
        const sourceFile = tsProgram.getSourceFile(fileName);
        if (sourceFile) {
            offsetsToNodes(getNodeLookup(sourceFile), refs, nodes$1);
        }
    }
    for (const node of nodes$1) {
        const closestArray = nodes.closestNode(node, ts.isArrayLiteralExpression);
        if (closestArray) {
            const closestAssignment = nodes.closestNode(closestArray, ts.isPropertyAssignment);
            if (closestAssignment && isInImportsArray(closestAssignment, closestArray)) {
                const closestCall = nodes.closestNode(closestAssignment, ts.isCallExpression);
                if (closestCall) {
                    const closestDecorator = nodes.closestNode(closestCall, ts.isDecorator);
                    const closestClass = closestDecorator
                        ? nodes.closestNode(closestDecorator, ts.isClassDeclaration)
                        : null;
                    const directiveMeta = closestClass
                        ? templateTypeChecker.getDirectiveMetadata(closestClass)
                        : null;
                    // If the module was flagged as being removable, but it's still being used in a
                    // standalone component's `imports` array, it means that it was likely changed
                    // outside of the  migration and deleting it now will be breaking. Track it
                    // separately so it can be handled properly.
                    if (directiveMeta && directiveMeta.isComponent && directiveMeta.isStandalone) {
                        componentImportArrays.track(closestArray, node);
                        continue;
                    }
                    // If the module is removable and used inside a test's `imports`,
                    // we track it separately so it can be replaced with its `exports`.
                    const { testBed, catalyst } = getTestingImports(node.getSourceFile());
                    if (isTestCall(typeChecker, closestCall, testBed, catalyst)) {
                        testImportArrays.track(closestArray, node);
                        continue;
                    }
                }
            }
            removalLocations.arrays.track(closestArray, node);
            continue;
        }
        const closestImport = nodes.closestNode(node, ts.isNamedImports);
        if (closestImport) {
            removalLocations.imports.track(closestImport, node);
            continue;
        }
        const closestExport = nodes.closestNode(node, ts.isNamedExports);
        if (closestExport) {
            removalLocations.exports.track(closestExport, node);
            continue;
        }
        removalLocations.unknown.add(node);
    }
}
/**
 * Replaces all the leftover modules in component `imports` arrays with their exports.
 * @param componentImportArrays All the imports arrays and their nodes that represent NgModules.
 * @param classesToRemove Set of classes that were marked for removal.
 * @param tracker
 * @param typeChecker
 * @param templateTypeChecker
 * @param importRemapper
 */
function replaceInComponentImportsArray(componentImportArrays, classesToRemove, tracker, typeChecker, templateTypeChecker, importRemapper) {
    for (const [array, toReplace] of componentImportArrays.getEntries()) {
        const closestClass = nodes.closestNode(array, ts.isClassDeclaration);
        if (!closestClass) {
            continue;
        }
        const replacements = new UniqueItemTracker();
        const usedImports = new Set(findTemplateDependencies(closestClass, templateTypeChecker).map((ref) => ref.node));
        for (const node of toReplace) {
            const moduleDecl = findClassDeclaration(node, typeChecker);
            if (moduleDecl) {
                const moduleMeta = templateTypeChecker.getNgModuleMetadata(moduleDecl);
                if (moduleMeta) {
                    moduleMeta.exports.forEach((exp) => {
                        if (usedImports.has(exp.node)) {
                            replacements.track(node, exp);
                        }
                    });
                }
                else {
                    // It's unlikely not to have module metadata at this point, but just in
                    // case unmark the class for removal to reduce the chance of breakages.
                    classesToRemove.delete(moduleDecl);
                }
            }
        }
        replaceModulesInImportsArray(array, replacements, tracker, templateTypeChecker, importRemapper);
    }
}
/**
 * Replaces all the leftover modules in testing `imports` arrays with their exports.
 * @param testImportArrays All test `imports` arrays and their nodes that represent modules.
 * @param classesToRemove Classes marked for removal by the migration.
 * @param tracker
 * @param typeChecker
 * @param templateTypeChecker
 * @param importRemapper
 */
function replaceInTestImportsArray(testImportArrays, removalLocations, classesToRemove, tracker, typeChecker, templateTypeChecker, importRemapper) {
    for (const [array, toReplace] of testImportArrays.getEntries()) {
        const replacements = new UniqueItemTracker();
        for (const node of toReplace) {
            const moduleDecl = findClassDeclaration(node, typeChecker);
            if (moduleDecl) {
                const moduleMeta = templateTypeChecker.getNgModuleMetadata(moduleDecl);
                if (moduleMeta) {
                    // Since we don't have access to the template type checker in tests,
                    // we copy over all the `exports` that aren't flagged for removal.
                    const exports = moduleMeta.exports.filter((exp) => !classesToRemove.has(exp.node));
                    if (exports.length > 0) {
                        exports.forEach((exp) => replacements.track(node, exp));
                    }
                    else {
                        removalLocations.arrays.track(array, node);
                    }
                }
                else {
                    // It's unlikely not to have module metadata at this point, but just in
                    // case unmark the class for removal to reduce the chance of breakages.
                    classesToRemove.delete(moduleDecl);
                }
            }
        }
        replaceModulesInImportsArray(array, replacements, tracker, templateTypeChecker, importRemapper);
    }
}
/**
 * Replaces any leftover modules in an `imports` arrays with a set of specified exports
 * @param array Imports array which is being migrated.
 * @param replacements Map of NgModule references to their exports.
 * @param tracker
 * @param templateTypeChecker
 * @param importRemapper
 */
function replaceModulesInImportsArray(array, replacements, tracker, templateTypeChecker, importRemapper) {
    if (replacements.isEmpty()) {
        return;
    }
    const newElements = [];
    const identifiers = new Set();
    for (const element of array.elements) {
        if (ts.isIdentifier(element)) {
            identifiers.add(element.text);
        }
    }
    for (const element of array.elements) {
        const replacementRefs = replacements.get(element);
        if (!replacementRefs) {
            newElements.push(element);
            continue;
        }
        const potentialImports = [];
        for (const ref of replacementRefs) {
            const importLocation = findImportLocation(ref, array, checker.PotentialImportMode.Normal, templateTypeChecker);
            if (importLocation) {
                potentialImports.push(importLocation);
            }
        }
        potentialImportsToExpressions(potentialImports, array.getSourceFile(), tracker, importRemapper).forEach((expr) => {
            if (!ts.isIdentifier(expr) || !identifiers.has(expr.text)) {
                newElements.push(expr);
            }
        });
    }
    tracker.replaceNode(array, ts.factory.updateArrayLiteralExpression(array, newElements));
}
/**
 * Removes all tracked array references.
 * @param locations Locations from which to remove the references.
 * @param tracker Tracker in which to register the changes.
 */
function removeArrayReferences(locations, tracker) {
    for (const [array, toRemove] of locations.getEntries()) {
        const newElements = filterRemovedElements(array.elements, toRemove);
        tracker.replaceNode(array, ts.factory.updateArrayLiteralExpression(array, ts.factory.createNodeArray(newElements, array.elements.hasTrailingComma)));
    }
}
/**
 * Removes all tracked import references.
 * @param locations Locations from which to remove the references.
 * @param tracker Tracker in which to register the changes.
 */
function removeImportReferences(locations, tracker) {
    for (const [namedImports, toRemove] of locations.getEntries()) {
        const newElements = filterRemovedElements(namedImports.elements, toRemove);
        // If no imports are left, we can try to drop the entire import.
        if (newElements.length === 0) {
            const importClause = nodes.closestNode(namedImports, ts.isImportClause);
            // If the import clause has a name we can only drop then named imports.
            // e.g. `import Foo, {ModuleToRemove} from './foo';` becomes `import Foo from './foo';`.
            if (importClause && importClause.name) {
                tracker.replaceNode(importClause, ts.factory.updateImportClause(importClause, importClause.isTypeOnly, importClause.name, undefined));
            }
            else {
                // Otherwise we can drop the entire declaration.
                const declaration = nodes.closestNode(namedImports, ts.isImportDeclaration);
                if (declaration) {
                    tracker.removeNode(declaration);
                }
            }
        }
        else {
            // Otherwise we just drop the imported symbols and keep the declaration intact.
            tracker.replaceNode(namedImports, ts.factory.updateNamedImports(namedImports, newElements));
        }
    }
}
/**
 * Removes all tracked export references.
 * @param locations Locations from which to remove the references.
 * @param tracker Tracker in which to register the changes.
 */
function removeExportReferences(locations, tracker) {
    for (const [namedExports, toRemove] of locations.getEntries()) {
        const newElements = filterRemovedElements(namedExports.elements, toRemove);
        // If no exports are left, we can drop the entire declaration.
        if (newElements.length === 0) {
            const declaration = nodes.closestNode(namedExports, ts.isExportDeclaration);
            if (declaration) {
                tracker.removeNode(declaration);
            }
        }
        else {
            // Otherwise we just drop the exported symbols and keep the declaration intact.
            tracker.replaceNode(namedExports, ts.factory.updateNamedExports(namedExports, newElements));
        }
    }
}
/**
 * Determines whether an `@NgModule` class is safe to remove. A module is safe to remove if:
 * 1. It has no `declarations`.
 * 2. It has no `providers`.
 * 3. It has no `bootstrap` components.
 * 4. It has no `ModuleWithProviders` in its `imports`.
 * 5. It has no class members. Empty construstors are ignored.
 * @param node Class that is being checked.
 * @param typeChecker
 */
function canRemoveClass(node, typeChecker) {
    const decorator = findNgModuleDecorator(node, typeChecker)?.node;
    // We can't remove a declaration if it's not a valid `NgModule`.
    if (!decorator || !ts.isCallExpression(decorator.expression)) {
        return false;
    }
    // Unsupported case, e.g. `@NgModule(SOME_VALUE)`.
    if (decorator.expression.arguments.length > 0 &&
        !ts.isObjectLiteralExpression(decorator.expression.arguments[0])) {
        return false;
    }
    // We can't remove modules that have class members. We make an exception for an
    // empty constructor which may have been generated by a tool and forgotten.
    if (node.members.length > 0 && node.members.some((member) => !isEmptyConstructor(member))) {
        return false;
    }
    // An empty `NgModule` call can be removed.
    if (decorator.expression.arguments.length === 0) {
        return true;
    }
    const literal = decorator.expression.arguments[0];
    const imports = findLiteralProperty(literal, 'imports');
    if (imports && isNonEmptyNgModuleProperty(imports)) {
        // We can't remove the class if at least one import isn't identifier, because it may be a
        // `ModuleWithProviders` which is the equivalent of having something in the `providers` array.
        for (const dep of imports.initializer.elements) {
            if (!ts.isIdentifier(dep)) {
                return false;
            }
            const depDeclaration = findClassDeclaration(dep, typeChecker);
            const depNgModule = depDeclaration
                ? findNgModuleDecorator(depDeclaration, typeChecker)
                : null;
            // If any of the dependencies of the class is an `NgModule` that can't be removed, the class
            // itself can't be removed either, because it may be part of a transitive dependency chain.
            if (depDeclaration !== null &&
                depNgModule !== null &&
                !canRemoveClass(depDeclaration, typeChecker)) {
                return false;
            }
        }
    }
    // We can't remove classes that have any `declarations`, `providers` or `bootstrap` elements.
    // Also err on the side of caution and don't remove modules where any of the aforementioned
    // properties aren't initialized to an array literal.
    for (const prop of literal.properties) {
        if (isNonEmptyNgModuleProperty(prop) &&
            (prop.name.text === 'declarations' ||
                prop.name.text === 'providers' ||
                prop.name.text === 'bootstrap')) {
            return false;
        }
    }
    return true;
}
/**
 * Checks whether a node is a non-empty property from an NgModule's metadata. This is defined as a
 * property assignment with a static name, initialized to an array literal with more than one
 * element.
 * @param node Node to be checked.
 */
function isNonEmptyNgModuleProperty(node) {
    return (ts.isPropertyAssignment(node) &&
        ts.isIdentifier(node.name) &&
        ts.isArrayLiteralExpression(node.initializer) &&
        node.initializer.elements.length > 0);
}
/**
 * Determines if a file is safe to delete. A file is safe to delete if all it contains are
 * import statements, class declarations that are about to be deleted and non-exported code.
 * @param sourceFile File that is being checked.
 * @param nodesToBeRemoved Nodes that are being removed as a part of the migration.
 */
function canRemoveFile(sourceFile, nodesToBeRemoved) {
    for (const node of sourceFile.statements) {
        if (ts.isImportDeclaration(node) || nodesToBeRemoved.has(node)) {
            continue;
        }
        if (ts.isExportDeclaration(node) ||
            (ts.canHaveModifiers(node) &&
                ts.getModifiers(node)?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword))) {
            return false;
        }
    }
    return true;
}
/**
 * Gets whether an AST node contains another AST node.
 * @param parent Parent node that may contain the child.
 * @param child Child node that is being checked.
 */
function contains(parent, child) {
    return (parent === child ||
        (parent.getSourceFile().fileName === child.getSourceFile().fileName &&
            child.getStart() >= parent.getStart() &&
            child.getStart() <= parent.getEnd()));
}
/**
 * Removes AST nodes from a node array.
 * @param elements Array from which to remove the nodes.
 * @param toRemove Nodes that should be removed.
 */
function filterRemovedElements(elements, toRemove) {
    return elements.filter((el) => {
        for (const node of toRemove) {
            // Check that the element contains the node, despite knowing with relative certainty that it
            // does, because this allows us to unwrap some nodes. E.g. if we have `[((toRemove))]`, we
            // want to remove the entire parenthesized expression, rather than just `toRemove`.
            if (contains(el, node)) {
                return false;
            }
        }
        return true;
    });
}
/** Returns whether a node as an empty constructor. */
function isEmptyConstructor(node) {
    return (ts.isConstructorDeclaration(node) &&
        node.parameters.length === 0 &&
        (node.body == null || node.body.statements.length === 0));
}
/**
 * Adds TODO comments to nodes that couldn't be removed manually.
 * @param nodes Nodes to which to add the TODO.
 * @param tracker Tracker in which to register the changes.
 */
function addRemovalTodos(nodes, tracker) {
    for (const node of nodes) {
        // Note: the comment is inserted using string manipulation, instead of going through the AST,
        // because this way we preserve more of the app's original formatting.
        // Note: in theory this can duplicate comments if the module pruning runs multiple times on
        // the same node. In practice it is unlikely, because the second time the node won't be picked
        // up by the language service as a reference, because the class won't exist anymore.
        tracker.insertText(node.getSourceFile(), node.getFullStart(), ` /* TODO(standalone-migration): clean up removed NgModule reference manually. */ `);
    }
}
/** Finds the `NgModule` decorator in a class, if it exists. */
function findNgModuleDecorator(node, typeChecker) {
    const decorators = ng_decorators.getAngularDecorators(typeChecker, ts.getDecorators(node) || []);
    return decorators.find((decorator) => decorator.name === 'NgModule') || null;
}
/**
 * Checks whether a node is used inside of an `imports` array.
 * @param closestAssignment The closest property assignment to the node.
 * @param closestArray The closest array to the node.
 */
function isInImportsArray(closestAssignment, closestArray) {
    return (closestAssignment.initializer === closestArray &&
        (ts.isIdentifier(closestAssignment.name) || ts.isStringLiteralLike(closestAssignment.name)) &&
        closestAssignment.name.text === 'imports');
}

/*!
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */
function toStandaloneBootstrap(program, host, basePath, rootFileNames, sourceFiles, printer, importRemapper, referenceLookupExcludedFiles, declarationImportRemapper) {
    const tracker = new compiler_host.ChangeTracker(printer, importRemapper);
    const typeChecker = program.getTsProgram().getTypeChecker();
    const templateTypeChecker = program.compiler.getTemplateTypeChecker();
    const referenceResolver = new ReferenceResolver(program, host, rootFileNames, basePath, referenceLookupExcludedFiles);
    const bootstrapCalls = [];
    const testObjects = new Set();
    const allDeclarations = new Set();
    // `bootstrapApplication` doesn't include Protractor support by default
    // anymore so we have to opt the app in, if we detect it being used.
    const additionalProviders = hasImport(program, rootFileNames, 'protractor')
        ? new Map([['provideProtractorTestingSupport', '@angular/platform-browser']])
        : null;
    for (const sourceFile of sourceFiles) {
        sourceFile.forEachChild(function walk(node) {
            if (ts.isCallExpression(node) &&
                ts.isPropertyAccessExpression(node.expression) &&
                node.expression.name.text === 'bootstrapModule' &&
                isClassReferenceInAngularModule(node.expression, 'PlatformRef', 'core', typeChecker)) {
                const call = analyzeBootstrapCall(node, typeChecker, templateTypeChecker);
                if (call) {
                    bootstrapCalls.push(call);
                }
            }
            node.forEachChild(walk);
        });
        findTestObjectsToMigrate(sourceFile, typeChecker).forEach((obj) => testObjects.add(obj));
    }
    for (const call of bootstrapCalls) {
        call.declarations.forEach((decl) => allDeclarations.add(decl));
        migrateBootstrapCall(call, tracker, additionalProviders, referenceResolver, typeChecker, printer);
    }
    // The previous migrations explicitly skip over bootstrapped
    // declarations so we have to migrate them now.
    for (const declaration of allDeclarations) {
        convertNgModuleDeclarationToStandalone(declaration, allDeclarations, tracker, templateTypeChecker, declarationImportRemapper);
    }
    migrateTestDeclarations(testObjects, allDeclarations, tracker, templateTypeChecker, typeChecker);
    return tracker.recordChanges();
}
/**
 * Extracts all of the information from a `bootstrapModule` call
 * necessary to convert it to `bootstrapApplication`.
 * @param call Call to be analyzed.
 * @param typeChecker
 * @param templateTypeChecker
 */
function analyzeBootstrapCall(call, typeChecker, templateTypeChecker) {
    if (call.arguments.length === 0 || !ts.isIdentifier(call.arguments[0])) {
        return null;
    }
    const declaration = findClassDeclaration(call.arguments[0], typeChecker);
    if (!declaration) {
        return null;
    }
    const decorator = ng_decorators.getAngularDecorators(typeChecker, ts.getDecorators(declaration) || []).find((decorator) => decorator.name === 'NgModule');
    if (!decorator ||
        decorator.node.expression.arguments.length === 0 ||
        !ts.isObjectLiteralExpression(decorator.node.expression.arguments[0])) {
        return null;
    }
    const metadata = decorator.node.expression.arguments[0];
    const bootstrapProp = findLiteralProperty(metadata, 'bootstrap');
    if (!bootstrapProp ||
        !ts.isPropertyAssignment(bootstrapProp) ||
        !ts.isArrayLiteralExpression(bootstrapProp.initializer) ||
        bootstrapProp.initializer.elements.length === 0 ||
        !ts.isIdentifier(bootstrapProp.initializer.elements[0])) {
        return null;
    }
    const component = findClassDeclaration(bootstrapProp.initializer.elements[0], typeChecker);
    if (component && component.name && ts.isIdentifier(component.name)) {
        return {
            module: declaration,
            metadata,
            component: component,
            call,
            declarations: extractDeclarationsFromModule(declaration, templateTypeChecker),
        };
    }
    return null;
}
/**
 * Converts a `bootstrapModule` call to `bootstrapApplication`.
 * @param analysis Analysis result of the call.
 * @param tracker Tracker in which to register the changes.
 * @param additionalFeatures Additional providers, apart from the auto-detected ones, that should
 * be added to the bootstrap call.
 * @param referenceResolver
 * @param typeChecker
 * @param printer
 */
function migrateBootstrapCall(analysis, tracker, additionalProviders, referenceResolver, typeChecker, printer) {
    const sourceFile = analysis.call.getSourceFile();
    const moduleSourceFile = analysis.metadata.getSourceFile();
    const providers = findLiteralProperty(analysis.metadata, 'providers');
    const imports = findLiteralProperty(analysis.metadata, 'imports');
    const nodesToCopy = new Set();
    const providersInNewCall = [];
    const moduleImportsInNewCall = [];
    let nodeLookup = null;
    // Comment out the metadata so that it'll be removed when we run the module pruning afterwards.
    // If the pruning is left for some reason, the user will still have an actionable TODO.
    tracker.insertText(moduleSourceFile, analysis.metadata.getStart(), '/* TODO(standalone-migration): clean up removed NgModule class manually. \n');
    tracker.insertText(moduleSourceFile, analysis.metadata.getEnd(), ' */');
    if (providers && ts.isPropertyAssignment(providers)) {
        nodeLookup = nodeLookup || getNodeLookup(moduleSourceFile);
        if (ts.isArrayLiteralExpression(providers.initializer)) {
            providersInNewCall.push(...providers.initializer.elements);
        }
        else {
            providersInNewCall.push(ts.factory.createSpreadElement(providers.initializer));
        }
        addNodesToCopy(sourceFile, providers, nodeLookup, tracker, nodesToCopy, referenceResolver);
    }
    if (imports && ts.isPropertyAssignment(imports)) {
        nodeLookup = nodeLookup || getNodeLookup(moduleSourceFile);
        migrateImportsForBootstrapCall(sourceFile, imports, nodeLookup, moduleImportsInNewCall, providersInNewCall, tracker, nodesToCopy, referenceResolver, typeChecker);
    }
    if (additionalProviders) {
        additionalProviders.forEach((moduleSpecifier, name) => {
            providersInNewCall.push(ts.factory.createCallExpression(tracker.addImport(sourceFile, name, moduleSpecifier), undefined, undefined));
        });
    }
    if (nodesToCopy.size > 0) {
        let text = '\n\n';
        nodesToCopy.forEach((node) => {
            const transformedNode = remapDynamicImports(sourceFile.fileName, node);
            // Use `getText` to try an preserve the original formatting. This only works if the node
            // hasn't been transformed. If it has, we have to fall back to the printer.
            if (transformedNode === node) {
                text += transformedNode.getText() + '\n';
            }
            else {
                text += printer.printNode(ts.EmitHint.Unspecified, transformedNode, node.getSourceFile());
            }
        });
        text += '\n';
        tracker.insertText(sourceFile, getLastImportEnd(sourceFile), text);
    }
    replaceBootstrapCallExpression(analysis, providersInNewCall, moduleImportsInNewCall, tracker);
}
/**
 * Replaces a `bootstrapModule` call with `bootstrapApplication`.
 * @param analysis Analysis result of the `bootstrapModule` call.
 * @param providers Providers that should be added to the new call.
 * @param modules Modules that are being imported into the new call.
 * @param tracker Object keeping track of the changes to the different files.
 */
function replaceBootstrapCallExpression(analysis, providers, modules, tracker) {
    const sourceFile = analysis.call.getSourceFile();
    const componentPath = getRelativeImportPath(sourceFile.fileName, analysis.component.getSourceFile().fileName);
    const args = [tracker.addImport(sourceFile, analysis.component.name.text, componentPath)];
    const bootstrapExpression = tracker.addImport(sourceFile, 'bootstrapApplication', '@angular/platform-browser');
    if (providers.length > 0 || modules.length > 0) {
        const combinedProviders = [];
        if (modules.length > 0) {
            const importProvidersExpression = tracker.addImport(sourceFile, 'importProvidersFrom', '@angular/core');
            combinedProviders.push(ts.factory.createCallExpression(importProvidersExpression, [], modules));
        }
        // Push the providers after `importProvidersFrom` call for better readability.
        combinedProviders.push(...providers);
        const providersArray = ts.factory.createNodeArray(combinedProviders, analysis.metadata.properties.hasTrailingComma && combinedProviders.length > 2);
        const initializer = remapDynamicImports(sourceFile.fileName, ts.factory.createArrayLiteralExpression(providersArray, combinedProviders.length > 1));
        args.push(ts.factory.createObjectLiteralExpression([ts.factory.createPropertyAssignment('providers', initializer)], true));
    }
    tracker.replaceNode(analysis.call, ts.factory.createCallExpression(bootstrapExpression, [], args), 
    // Note: it's important to pass in the source file that the nodes originated from!
    // Otherwise TS won't print out literals inside of the providers that we're copying
    // over from the module file.
    undefined, analysis.metadata.getSourceFile());
}
/**
 * Processes the `imports` of an NgModule so that they can be used in the `bootstrapApplication`
 * call inside of a different file.
 * @param sourceFile File to which the imports will be moved.
 * @param imports Node declaring the imports.
 * @param nodeLookup Map used to look up nodes based on their positions in a file.
 * @param importsForNewCall Array keeping track of the imports that are being added to the new call.
 * @param providersInNewCall Array keeping track of the providers in the new call.
 * @param tracker Tracker in which changes to files are being stored.
 * @param nodesToCopy Nodes that should be copied to the new file.
 * @param referenceResolver
 * @param typeChecker
 */
function migrateImportsForBootstrapCall(sourceFile, imports, nodeLookup, importsForNewCall, providersInNewCall, tracker, nodesToCopy, referenceResolver, typeChecker) {
    if (!ts.isArrayLiteralExpression(imports.initializer)) {
        importsForNewCall.push(imports.initializer);
        return;
    }
    for (const element of imports.initializer.elements) {
        // If the reference is to a `RouterModule.forRoot` call, we can try to migrate it.
        if (ts.isCallExpression(element) &&
            ts.isPropertyAccessExpression(element.expression) &&
            element.arguments.length > 0 &&
            element.expression.name.text === 'forRoot' &&
            isClassReferenceInAngularModule(element.expression.expression, 'RouterModule', 'router', typeChecker)) {
            const options = element.arguments[1];
            const features = options ? getRouterModuleForRootFeatures(sourceFile, options, tracker) : [];
            // If the features come back as null, it means that the router
            // has a configuration that can't be migrated automatically.
            if (features !== null) {
                providersInNewCall.push(ts.factory.createCallExpression(tracker.addImport(sourceFile, 'provideRouter', '@angular/router'), [], [element.arguments[0], ...features]));
                addNodesToCopy(sourceFile, element.arguments[0], nodeLookup, tracker, nodesToCopy, referenceResolver);
                if (options) {
                    addNodesToCopy(sourceFile, options, nodeLookup, tracker, nodesToCopy, referenceResolver);
                }
                continue;
            }
        }
        if (ts.isIdentifier(element)) {
            // `BrowserAnimationsModule` can be replaced with `provideAnimations`.
            const animationsModule = 'platform-browser/animations';
            const animationsImport = `@angular/${animationsModule}`;
            if (isClassReferenceInAngularModule(element, 'BrowserAnimationsModule', animationsModule, typeChecker)) {
                providersInNewCall.push(ts.factory.createCallExpression(tracker.addImport(sourceFile, 'provideAnimations', animationsImport), [], []));
                continue;
            }
            // `NoopAnimationsModule` can be replaced with `provideNoopAnimations`.
            if (isClassReferenceInAngularModule(element, 'NoopAnimationsModule', animationsModule, typeChecker)) {
                providersInNewCall.push(ts.factory.createCallExpression(tracker.addImport(sourceFile, 'provideNoopAnimations', animationsImport), [], []));
                continue;
            }
            // `HttpClientModule` can be replaced with `provideHttpClient()`.
            const httpClientModule = 'common/http';
            const httpClientImport = `@angular/${httpClientModule}`;
            if (isClassReferenceInAngularModule(element, 'HttpClientModule', httpClientModule, typeChecker)) {
                const callArgs = [
                    // we add `withInterceptorsFromDi()` to the call to ensure that class-based interceptors
                    // still work
                    ts.factory.createCallExpression(tracker.addImport(sourceFile, 'withInterceptorsFromDi', httpClientImport), [], []),
                ];
                providersInNewCall.push(ts.factory.createCallExpression(tracker.addImport(sourceFile, 'provideHttpClient', httpClientImport), [], callArgs));
                continue;
            }
        }
        const target = 
        // If it's a call, it'll likely be a `ModuleWithProviders`
        // expression so the target is going to be call's expression.
        ts.isCallExpression(element) && ts.isPropertyAccessExpression(element.expression)
            ? element.expression.expression
            : element;
        const classDeclaration = findClassDeclaration(target, typeChecker);
        const decorators = classDeclaration
            ? ng_decorators.getAngularDecorators(typeChecker, ts.getDecorators(classDeclaration) || [])
            : undefined;
        if (!decorators ||
            decorators.length === 0 ||
            decorators.every(({ name }) => name !== 'Directive' && name !== 'Component' && name !== 'Pipe')) {
            importsForNewCall.push(element);
            addNodesToCopy(sourceFile, element, nodeLookup, tracker, nodesToCopy, referenceResolver);
        }
    }
}
/**
 * Generates the call expressions that can be used to replace the options
 * object that is passed into a `RouterModule.forRoot` call.
 * @param sourceFile File that the `forRoot` call is coming from.
 * @param options Node that is passed as the second argument to the `forRoot` call.
 * @param tracker Tracker in which to track imports that need to be inserted.
 * @returns Null if the options can't be migrated, otherwise an array of call expressions.
 */
function getRouterModuleForRootFeatures(sourceFile, options, tracker) {
    // Options that aren't a static object literal can't be migrated.
    if (!ts.isObjectLiteralExpression(options)) {
        return null;
    }
    const featureExpressions = [];
    const configOptions = [];
    const inMemoryScrollingOptions = [];
    const features = new UniqueItemTracker();
    for (const prop of options.properties) {
        // We can't migrate options that we can't easily analyze.
        if (!ts.isPropertyAssignment(prop) ||
            (!ts.isIdentifier(prop.name) && !ts.isStringLiteralLike(prop.name))) {
            return null;
        }
        switch (prop.name.text) {
            // `preloadingStrategy` maps to the `withPreloading` function.
            case 'preloadingStrategy':
                features.track('withPreloading', prop.initializer);
                break;
            // `enableTracing: true` maps to the `withDebugTracing` feature.
            case 'enableTracing':
                if (prop.initializer.kind === ts.SyntaxKind.TrueKeyword) {
                    features.track('withDebugTracing', null);
                }
                break;
            // `initialNavigation: 'enabled'` and `initialNavigation: 'enabledBlocking'` map to the
            // `withEnabledBlockingInitialNavigation` feature, while `initialNavigation: 'disabled'` maps
            // to the `withDisabledInitialNavigation` feature.
            case 'initialNavigation':
                if (!ts.isStringLiteralLike(prop.initializer)) {
                    return null;
                }
                if (prop.initializer.text === 'enabledBlocking' || prop.initializer.text === 'enabled') {
                    features.track('withEnabledBlockingInitialNavigation', null);
                }
                else if (prop.initializer.text === 'disabled') {
                    features.track('withDisabledInitialNavigation', null);
                }
                break;
            // `useHash: true` maps to the `withHashLocation` feature.
            case 'useHash':
                if (prop.initializer.kind === ts.SyntaxKind.TrueKeyword) {
                    features.track('withHashLocation', null);
                }
                break;
            // `errorHandler` maps to the `withNavigationErrorHandler` feature.
            case 'errorHandler':
                features.track('withNavigationErrorHandler', prop.initializer);
                break;
            // `anchorScrolling` and `scrollPositionRestoration` arguments have to be combined into an
            // object literal that is passed into the `withInMemoryScrolling` feature.
            case 'anchorScrolling':
            case 'scrollPositionRestoration':
                inMemoryScrollingOptions.push(prop);
                break;
            // All remaining properties can be passed through the `withRouterConfig` feature.
            default:
                configOptions.push(prop);
                break;
        }
    }
    if (inMemoryScrollingOptions.length > 0) {
        features.track('withInMemoryScrolling', ts.factory.createObjectLiteralExpression(inMemoryScrollingOptions));
    }
    if (configOptions.length > 0) {
        features.track('withRouterConfig', ts.factory.createObjectLiteralExpression(configOptions));
    }
    for (const [feature, featureArgs] of features.getEntries()) {
        const callArgs = [];
        featureArgs.forEach((arg) => {
            if (arg !== null) {
                callArgs.push(arg);
            }
        });
        featureExpressions.push(ts.factory.createCallExpression(tracker.addImport(sourceFile, feature, '@angular/router'), [], callArgs));
    }
    return featureExpressions;
}
/**
 * Finds all the nodes that are referenced inside a root node and would need to be copied into a
 * new file in order for the node to compile, and tracks them.
 * @param targetFile File to which the nodes will be copied.
 * @param rootNode Node within which to look for references.
 * @param nodeLookup Map used to look up nodes based on their positions in a file.
 * @param tracker Tracker in which changes to files are stored.
 * @param nodesToCopy Set that keeps track of the nodes being copied.
 * @param referenceResolver
 */
function addNodesToCopy(targetFile, rootNode, nodeLookup, tracker, nodesToCopy, referenceResolver) {
    const refs = findAllSameFileReferences(rootNode, nodeLookup, referenceResolver);
    for (const ref of refs) {
        const importSpecifier = closestOrSelf(ref, ts.isImportSpecifier);
        const importDeclaration = importSpecifier
            ? nodes.closestNode(importSpecifier, ts.isImportDeclaration)
            : null;
        // If the reference is in an import, we need to add an import to the main file.
        if (importDeclaration &&
            importSpecifier &&
            ts.isStringLiteralLike(importDeclaration.moduleSpecifier)) {
            const moduleName = importDeclaration.moduleSpecifier.text.startsWith('.')
                ? remapRelativeImport(targetFile.fileName, importDeclaration.moduleSpecifier)
                : importDeclaration.moduleSpecifier.text;
            const symbolName = importSpecifier.propertyName
                ? importSpecifier.propertyName.text
                : importSpecifier.name.text;
            const alias = importSpecifier.propertyName ? importSpecifier.name.text : undefined;
            tracker.addImport(targetFile, symbolName, moduleName, alias);
            continue;
        }
        const variableDeclaration = closestOrSelf(ref, ts.isVariableDeclaration);
        const variableStatement = variableDeclaration
            ? nodes.closestNode(variableDeclaration, ts.isVariableStatement)
            : null;
        // If the reference is a variable, we can attempt to import it or copy it over.
        if (variableDeclaration && variableStatement && ts.isIdentifier(variableDeclaration.name)) {
            if (isExported(variableStatement)) {
                tracker.addImport(targetFile, variableDeclaration.name.text, getRelativeImportPath(targetFile.fileName, ref.getSourceFile().fileName));
            }
            else {
                nodesToCopy.add(variableStatement);
            }
            continue;
        }
        // Otherwise check if the reference is inside of an exportable declaration, e.g. a function.
        // This code that is safe to copy over into the new file or import it, if it's exported.
        const closestExportable = closestOrSelf(ref, isExportableDeclaration);
        if (closestExportable) {
            if (isExported(closestExportable) && closestExportable.name) {
                tracker.addImport(targetFile, closestExportable.name.text, getRelativeImportPath(targetFile.fileName, ref.getSourceFile().fileName));
            }
            else {
                nodesToCopy.add(closestExportable);
            }
        }
    }
}
/**
 * Finds all the nodes referenced within the root node in the same file.
 * @param rootNode Node from which to start looking for references.
 * @param nodeLookup Map used to look up nodes based on their positions in a file.
 * @param referenceResolver
 */
function findAllSameFileReferences(rootNode, nodeLookup, referenceResolver) {
    const results = new Set();
    const traversedTopLevelNodes = new Set();
    const excludeStart = rootNode.getStart();
    const excludeEnd = rootNode.getEnd();
    (function walk(node) {
        if (!isReferenceIdentifier(node)) {
            node.forEachChild(walk);
            return;
        }
        const refs = referencesToNodeWithinSameFile(node, nodeLookup, excludeStart, excludeEnd, referenceResolver);
        if (refs === null) {
            return;
        }
        for (const ref of refs) {
            if (results.has(ref)) {
                continue;
            }
            results.add(ref);
            const closestTopLevel = nodes.closestNode(ref, isTopLevelStatement);
            // Avoid re-traversing the same top-level nodes since we know what the result will be.
            if (!closestTopLevel || traversedTopLevelNodes.has(closestTopLevel)) {
                continue;
            }
            // Keep searching, starting from the closest top-level node. We skip import declarations,
            // because we already know about them and they may put the search into an infinite loop.
            if (!ts.isImportDeclaration(closestTopLevel) &&
                isOutsideRange(excludeStart, excludeEnd, closestTopLevel.getStart(), closestTopLevel.getEnd())) {
                traversedTopLevelNodes.add(closestTopLevel);
                walk(closestTopLevel);
            }
        }
    })(rootNode);
    return results;
}
/**
 * Finds all the nodes referring to a specific node within the same file.
 * @param node Node whose references we're lookip for.
 * @param nodeLookup Map used to look up nodes based on their positions in a file.
 * @param excludeStart Start of a range that should be excluded from the results.
 * @param excludeEnd End of a range that should be excluded from the results.
 * @param referenceResolver
 */
function referencesToNodeWithinSameFile(node, nodeLookup, excludeStart, excludeEnd, referenceResolver) {
    const offsets = referenceResolver
        .findSameFileReferences(node, node.getSourceFile().fileName)
        .filter(([start, end]) => isOutsideRange(excludeStart, excludeEnd, start, end));
    if (offsets.length > 0) {
        const nodes = offsetsToNodes(nodeLookup, offsets, new Set());
        if (nodes.size > 0) {
            return nodes;
        }
    }
    return null;
}
/**
 * Transforms a node so that any dynamic imports with relative file paths it contains are remapped
 * as if they were specified in a different file. If no transformations have occurred, the original
 * node will be returned.
 * @param targetFileName File name to which to remap the imports.
 * @param rootNode Node being transformed.
 */
function remapDynamicImports(targetFileName, rootNode) {
    let hasChanged = false;
    const transformer = (context) => {
        return (sourceFile) => ts.visitNode(sourceFile, function walk(node) {
            if (ts.isCallExpression(node) &&
                node.expression.kind === ts.SyntaxKind.ImportKeyword &&
                node.arguments.length > 0 &&
                ts.isStringLiteralLike(node.arguments[0]) &&
                node.arguments[0].text.startsWith('.')) {
                hasChanged = true;
                return context.factory.updateCallExpression(node, node.expression, node.typeArguments, [
                    context.factory.createStringLiteral(remapRelativeImport(targetFileName, node.arguments[0])),
                    ...node.arguments.slice(1),
                ]);
            }
            return ts.visitEachChild(node, walk, context);
        });
    };
    const result = ts.transform(rootNode, [transformer]).transformed[0];
    return hasChanged ? result : rootNode;
}
/**
 * Checks whether a node is a statement at the top level of a file.
 * @param node Node to be checked.
 */
function isTopLevelStatement(node) {
    return node.parent != null && ts.isSourceFile(node.parent);
}
/**
 * Asserts that a node is an identifier that might be referring to a symbol. This excludes
 * identifiers of named nodes like property assignments.
 * @param node Node to be checked.
 */
function isReferenceIdentifier(node) {
    return (ts.isIdentifier(node) &&
        ((!ts.isPropertyAssignment(node.parent) && !ts.isParameter(node.parent)) ||
            node.parent.name !== node));
}
/**
 * Checks whether a range is completely outside of another range.
 * @param excludeStart Start of the exclusion range.
 * @param excludeEnd End of the exclusion range.
 * @param start Start of the range that is being checked.
 * @param end End of the range that is being checked.
 */
function isOutsideRange(excludeStart, excludeEnd, start, end) {
    return (start < excludeStart && end < excludeStart) || start > excludeEnd;
}
/**
 * Remaps the specifier of a relative import from its original location to a new one.
 * @param targetFileName Name of the file that the specifier will be moved to.
 * @param specifier Specifier whose path is being remapped.
 */
function remapRelativeImport(targetFileName, specifier) {
    return getRelativeImportPath(targetFileName, p.join(p.dirname(specifier.getSourceFile().fileName), specifier.text));
}
/**
 * Whether a node is exported.
 * @param node Node to be checked.
 */
function isExported(node) {
    return ts.canHaveModifiers(node) && node.modifiers
        ? node.modifiers.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword)
        : false;
}
/**
 * Asserts that a node is an exportable declaration, which means that it can either be exported or
 * it can be safely copied into another file.
 * @param node Node to be checked.
 */
function isExportableDeclaration(node) {
    return (ts.isEnumDeclaration(node) ||
        ts.isClassDeclaration(node) ||
        ts.isFunctionDeclaration(node) ||
        ts.isInterfaceDeclaration(node) ||
        ts.isTypeAliasDeclaration(node));
}
/**
 * Gets the index after the last import in a file. Can be used to insert new code into the file.
 * @param sourceFile File in which to search for imports.
 */
function getLastImportEnd(sourceFile) {
    let index = 0;
    for (const statement of sourceFile.statements) {
        if (ts.isImportDeclaration(statement)) {
            index = Math.max(index, statement.getEnd());
        }
        else {
            break;
        }
    }
    return index;
}
/** Checks if any of the program's files has an import of a specific module. */
function hasImport(program, rootFileNames, moduleName) {
    const tsProgram = program.getTsProgram();
    const deepImportStart = moduleName + '/';
    for (const fileName of rootFileNames) {
        const sourceFile = tsProgram.getSourceFile(fileName);
        if (!sourceFile) {
            continue;
        }
        for (const statement of sourceFile.statements) {
            if (ts.isImportDeclaration(statement) &&
                ts.isStringLiteralLike(statement.moduleSpecifier) &&
                (statement.moduleSpecifier.text === moduleName ||
                    statement.moduleSpecifier.text.startsWith(deepImportStart))) {
                return true;
            }
        }
    }
    return false;
}

var MigrationMode;
(function (MigrationMode) {
    MigrationMode["toStandalone"] = "convert-to-standalone";
    MigrationMode["pruneModules"] = "prune-ng-modules";
    MigrationMode["standaloneBootstrap"] = "standalone-bootstrap";
})(MigrationMode || (MigrationMode = {}));
function migrate(options) {
    return async (tree, context) => {
        const { buildPaths, testPaths } = await project_tsconfig_paths.getProjectTsConfigPaths(tree);
        const basePath = process.cwd();
        const allPaths = [...buildPaths, ...testPaths];
        // TS and Schematic use paths in POSIX format even on Windows. This is needed as otherwise
        // string matching such as `sourceFile.fileName.startsWith(pathToMigrate)` might not work.
        const pathToMigrate = compiler_host.normalizePath(p.join(basePath, options.path));
        let migratedFiles = 0;
        if (!allPaths.length) {
            throw new schematics.SchematicsException('Could not find any tsconfig file. Cannot run the standalone migration.');
        }
        for (const tsconfigPath of allPaths) {
            migratedFiles += standaloneMigration(tree, tsconfigPath, basePath, pathToMigrate, options);
        }
        if (migratedFiles === 0) {
            throw new schematics.SchematicsException(`Could not find any files to migrate under the path ${pathToMigrate}. Cannot run the standalone migration.`);
        }
        context.logger.info('🎉 Automated migration step has finished! 🎉');
        context.logger.info('IMPORTANT! Please verify manually that your application builds and behaves as expected.');
        context.logger.info(`See https://angular.dev/reference/migrations/standalone for more information.`);
    };
}
function standaloneMigration(tree, tsconfigPath, basePath, pathToMigrate, schematicOptions, oldProgram) {
    if (schematicOptions.path.startsWith('..')) {
        throw new schematics.SchematicsException('Cannot run standalone migration outside of the current project.');
    }
    const { host, options, rootNames } = compiler_host.createProgramOptions(tree, tsconfigPath, basePath, undefined, undefined, {
        _enableTemplateTypeChecker: true, // Required for the template type checker to work.
        compileNonExportedClasses: true, // We want to migrate non-exported classes too.
        // Avoid checking libraries to speed up the migration.
        skipLibCheck: true,
        skipDefaultLibCheck: true,
    });
    const referenceLookupExcludedFiles = /node_modules|\.ngtypecheck\.ts/;
    const program = createProgram({ rootNames, host, options, oldProgram });
    const printer = ts.createPrinter();
    if (fs.existsSync(pathToMigrate) && !fs.statSync(pathToMigrate).isDirectory()) {
        throw new schematics.SchematicsException(`Migration path ${pathToMigrate} has to be a directory. Cannot run the standalone migration.`);
    }
    const sourceFiles = program
        .getTsProgram()
        .getSourceFiles()
        .filter((sourceFile) => sourceFile.fileName.startsWith(pathToMigrate) &&
        compiler_host.canMigrateFile(basePath, sourceFile, program.getTsProgram()));
    if (sourceFiles.length === 0) {
        return 0;
    }
    let pendingChanges;
    let filesToRemove = null;
    if (schematicOptions.mode === MigrationMode.pruneModules) {
        const result = pruneNgModules(program, host, basePath, rootNames, sourceFiles, printer, undefined, referenceLookupExcludedFiles, knownInternalAliasRemapper);
        pendingChanges = result.pendingChanges;
        filesToRemove = result.filesToRemove;
    }
    else if (schematicOptions.mode === MigrationMode.standaloneBootstrap) {
        pendingChanges = toStandaloneBootstrap(program, host, basePath, rootNames, sourceFiles, printer, undefined, referenceLookupExcludedFiles, knownInternalAliasRemapper);
    }
    else {
        // This shouldn't happen, but default to `MigrationMode.toStandalone` just in case.
        pendingChanges = toStandalone(sourceFiles, program, printer, undefined, knownInternalAliasRemapper);
    }
    for (const [file, changes] of pendingChanges.entries()) {
        // Don't attempt to edit a file if it's going to be deleted.
        if (filesToRemove?.has(file)) {
            continue;
        }
        const update = tree.beginUpdate(p.relative(basePath, file.fileName));
        changes.forEach((change) => {
            if (change.removeLength != null) {
                update.remove(change.start, change.removeLength);
            }
            update.insertRight(change.start, change.text);
        });
        tree.commitUpdate(update);
    }
    if (filesToRemove) {
        for (const file of filesToRemove) {
            tree.delete(p.relative(basePath, file.fileName));
        }
    }
    // Run the module pruning after the standalone bootstrap to automatically remove the root module.
    // Note that we can't run the module pruning internally without propagating the changes to disk,
    // because there may be conflicting AST node changes.
    if (schematicOptions.mode === MigrationMode.standaloneBootstrap) {
        return (standaloneMigration(tree, tsconfigPath, basePath, pathToMigrate, { ...schematicOptions, mode: MigrationMode.pruneModules }, program) + sourceFiles.length);
    }
    return sourceFiles.length;
}

exports.migrate = migrate;
