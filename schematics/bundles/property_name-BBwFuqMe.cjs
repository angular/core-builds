'use strict';
/**
 * @license Angular v20.2.0-next.3+sha-3e6e1c1
 * (c) 2010-2025 Google LLC. https://angular.io/
 * License: MIT
 */
'use strict';

var ts = require('typescript');

/**
 * Gets the text of the given property name. Returns null if the property
 * name couldn't be determined statically.
 */
function getPropertyNameText(node) {
    if (ts.isIdentifier(node) || ts.isStringLiteralLike(node)) {
        return node.text;
    }
    return null;
}
/** Finds a property with a specific name in an object literal expression. */
function findLiteralProperty(literal, name) {
    return literal.properties.find((prop) => prop.name && ts.isIdentifier(prop.name) && prop.name.text === name);
}

exports.findLiteralProperty = findLiteralProperty;
exports.getPropertyNameText = getPropertyNameText;
