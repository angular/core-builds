'use strict';
/**
 * @license Angular v20.0.0-next.1+sha-3602c53
 * (c) 2010-2025 Google LLC. https://angular.io/
 * License: MIT
 */
'use strict';

var ts = require('typescript');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var ts__default = /*#__PURE__*/_interopDefaultLegacy(ts);

/** Gets import information about the specified identifier by using the Type checker. */
function getImportOfIdentifier(typeChecker, node) {
    const symbol = typeChecker.getSymbolAtLocation(node);
    if (!symbol || symbol.declarations === undefined || !symbol.declarations.length) {
        return null;
    }
    const decl = symbol.declarations[0];
    if (!ts__default["default"].isImportSpecifier(decl)) {
        return null;
    }
    const importDecl = decl.parent.parent.parent;
    if (!ts__default["default"].isImportDeclaration(importDecl) || !ts__default["default"].isStringLiteral(importDecl.moduleSpecifier)) {
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
function getImportSpecifiers(sourceFile, moduleName, specifierOrSpecifiers) {
    const matches = [];
    for (const node of sourceFile.statements) {
        if (!ts__default["default"].isImportDeclaration(node) || !ts__default["default"].isStringLiteral(node.moduleSpecifier)) {
            continue;
        }
        const namedBindings = node.importClause?.namedBindings;
        const isMatch = typeof moduleName === 'string'
            ? node.moduleSpecifier.text === moduleName
            : moduleName.test(node.moduleSpecifier.text);
        if (!isMatch || !namedBindings || !ts__default["default"].isNamedImports(namedBindings)) {
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
        if (ts__default["default"].isImportDeclaration(node) && ts__default["default"].isStringLiteral(node.moduleSpecifier)) {
            const isMatch = typeof moduleName === 'string'
                ? node.moduleSpecifier.text === moduleName
                : moduleName.test(node.moduleSpecifier.text);
            const namedBindings = node.importClause?.namedBindings;
            if (isMatch && namedBindings && ts__default["default"].isNamedImports(namedBindings)) {
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
    if (!ts__default["default"].isCallExpression(decorator.expression) ||
        !ts__default["default"].isIdentifier(decorator.expression.expression)) {
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
exports.getNamedImports = getNamedImports;
