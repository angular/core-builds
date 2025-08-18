'use strict';
/**
 * @license Angular v21.0.0-next.0+sha-5115050
 * (c) 2010-2025 Google LLC. https://angular.io/
 * License: MIT
 */
'use strict';

var ts = require('typescript');

/** Checks whether a node is referring to a specific import specifier. */
function isReferenceToImport(typeChecker, node, importSpecifier) {
    // If this function is called on an identifier (should be most cases), we can quickly rule out
    // non-matches by comparing the identifier's string and the local name of the import specifier
    // which saves us some calls to the type checker.
    if (ts.isIdentifier(node) && node.text !== importSpecifier.name.text) {
        return false;
    }
    const nodeSymbol = typeChecker.getTypeAtLocation(node).getSymbol();
    const importSymbol = typeChecker.getTypeAtLocation(importSpecifier).getSymbol();
    return (!!(nodeSymbol?.declarations?.[0] && importSymbol?.declarations?.[0]) &&
        nodeSymbol.declarations[0] === importSymbol.declarations[0]);
}

exports.isReferenceToImport = isReferenceToImport;
