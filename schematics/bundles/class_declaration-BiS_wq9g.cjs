'use strict';
/**
 * @license Angular v22.1.0-rc.0+sha-125a794
 * (c) 2010-2026 Google LLC. https://angular.dev/
 * License: MIT
 */
'use strict';

var ts = require('typescript');

/** Determines the base type identifiers of a specified class declaration. */
function getBaseTypeIdentifiers(node) {
    if (!node.heritageClauses) {
        return null;
    }
    return node.heritageClauses
        .filter((clause) => clause.token === ts.SyntaxKind.ExtendsKeyword)
        .reduce((types, clause) => types.concat(clause.types), [])
        .map((typeExpression) => typeExpression.expression)
        .filter(ts.isIdentifier);
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

exports.findClassDeclaration = findClassDeclaration;
exports.getBaseTypeIdentifiers = getBaseTypeIdentifiers;
