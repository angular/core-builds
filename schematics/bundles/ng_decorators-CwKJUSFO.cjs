'use strict';
/**
 * @license Angular v22.0.0-next.0+sha-078da3c
 * (c) 2010-2026 Google LLC. https://angular.dev/
 * License: MIT
 */
'use strict';

var ts = require('typescript');

/** Gets import information about the specified identifier by using the Type checker. */
function getImportOfIdentifier(typeChecker, node) {
    const symbol = typeChecker.getSymbolAtLocation(node);
    if (!symbol || symbol.declarations === undefined || !symbol.declarations.length) {
        return null;
    }
    const decl = symbol.declarations[0];
    if (!ts.isImportSpecifier(decl)) {
        return null;
    }
    const importDecl = decl.parent.parent.parent;
    if (!ts.isImportDeclaration(importDecl) || !ts.isStringLiteral(importDecl.moduleSpecifier)) {
        return null;
    }
    return {
        // Handles aliased imports: e.g. "import {Component as myComp} from ...";
        name: decl.propertyName ? decl.propertyName.text : decl.name.text,
        importModule: importDecl.moduleSpecifier.text,
        node: importDecl,
    };
}
/**
 * Gets a top-level import specifier with a specific name that is imported from a particular module.
 * E.g. given a file that looks like:
 *
 * ```ts
 * import { Component, Directive } from '@angular/core';
 * import { Foo } from './foo';
 * ```
 *
 * Calling `getImportSpecifier(sourceFile, '@angular/core', 'Directive')` will yield the node
 * referring to `Directive` in the top import.
 *
 * @param sourceFile File in which to look for imports.
 * @param moduleName Name of the import's module.
 * @param specifierName Original name of the specifier to look for. Aliases will be resolved to
 *    their original name.
 */
function getImportSpecifier(sourceFile, moduleName, specifierName) {
    return getImportSpecifiers(sourceFile, moduleName, specifierName)[0] ?? null;
}
/**
 * Note: returns only matching imports specifiers,
 * Unmatched imports will be ignored (you won't get undefined), but a shorter array.
 */
function getImportSpecifiers(sourceFile, moduleName, specifierOrSpecifiers) {
    const matches = [];
    for (const node of sourceFile.statements) {
        if (!ts.isImportDeclaration(node) || !ts.isStringLiteral(node.moduleSpecifier)) {
            continue;
        }
        const namedBindings = node.importClause?.namedBindings;
        const isMatch = typeof moduleName === 'string'
            ? node.moduleSpecifier.text === moduleName
            : moduleName.test(node.moduleSpecifier.text);
        if (!isMatch || !namedBindings || !ts.isNamedImports(namedBindings)) {
            continue;
        }
        if (typeof specifierOrSpecifiers === 'string') {
            const match = findImportSpecifier(namedBindings.elements, specifierOrSpecifiers);
            if (match) {
                matches.push(match);
            }
        }
        else {
            for (const specifierName of specifierOrSpecifiers) {
                const match = findImportSpecifier(namedBindings.elements, specifierName);
                if (match) {
                    matches.push(match);
                }
            }
        }
    }
    return matches;
}
function getNamedImports(sourceFile, moduleName) {
    for (const node of sourceFile.statements) {
        if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
            const isMatch = node.moduleSpecifier.text === moduleName
                ;
            const namedBindings = node.importClause?.namedBindings;
            if (isMatch && namedBindings && ts.isNamedImports(namedBindings)) {
                return namedBindings;
            }
        }
    }
    return null;
}
/** Finds an import specifier with a particular name. */
function findImportSpecifier(nodes, specifierName) {
    return nodes.find((element) => {
        const { name, propertyName } = element;
        return propertyName ? propertyName.text === specifierName : name.text === specifierName;
    });
}

function getCallDecoratorImport(typeChecker, decorator) {
    // Note that this does not cover the edge case where decorators are called from
    // a namespace import: e.g. "@core.Component()". This is not handled by Ngtsc either.
    if (!ts.isCallExpression(decorator.expression) ||
        !ts.isIdentifier(decorator.expression.expression)) {
        return null;
    }
    const identifier = decorator.expression.expression;
    return getImportOfIdentifier(typeChecker, identifier);
}

/**
 * Gets all decorators which are imported from an Angular package (e.g. "@angular/core")
 * from a list of decorators.
 */
function getAngularDecorators(typeChecker, decorators) {
    return decorators
        .map((node) => ({ node, importData: getCallDecoratorImport(typeChecker, node) }))
        .filter(({ importData }) => importData && importData.importModule.startsWith('@angular/'))
        .map(({ node, importData }) => ({
        node: node,
        name: importData.name,
        moduleName: importData.importModule,
        importNode: importData.node,
    }));
}

exports.getAngularDecorators = getAngularDecorators;
exports.getImportOfIdentifier = getImportOfIdentifier;
exports.getImportSpecifier = getImportSpecifier;
exports.getImportSpecifiers = getImportSpecifiers;
exports.getNamedImports = getNamedImports;
