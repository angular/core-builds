'use strict';
/**
 * @license Angular v21.0.0-next.8+sha-e039c6b
 * (c) 2010-2025 Google LLC. https://angular.io/
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
/**
 * Gets the relative path between two files.
 * @param from Path of the file that is importing from another file.
 * @param to Path of the file that is being imported.
 */
function getRelativePath(from, to) {
    const fromParts = from.split('/').slice(0, -1);
    const toParts = to.split('/');
    while (fromParts.length > 0 && toParts.length > 0 && fromParts[0] === toParts[0]) {
        fromParts.shift();
        toParts.shift();
    }
    let relativePath = fromParts.map(() => '..').join('/') + (fromParts.length > 0 ? '/' : '') + toParts.join('/');
    if (relativePath.endsWith('.ts')) {
        relativePath = relativePath.slice(0, -3);
    }
    if (!relativePath.startsWith('.')) {
        relativePath = './' + relativePath;
    }
    return relativePath;
}

exports.getImportOfIdentifier = getImportOfIdentifier;
exports.getImportSpecifier = getImportSpecifier;
exports.getImportSpecifiers = getImportSpecifiers;
exports.getNamedImports = getNamedImports;
exports.getRelativePath = getRelativePath;
