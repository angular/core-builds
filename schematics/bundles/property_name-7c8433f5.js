'use strict';
/**
 * @license Angular v19.2.0+sha-1b3b05b
 * (c) 2010-2024 Google LLC. https://angular.io/
 * License: MIT
 */
'use strict';

var ts = require('typescript');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var ts__default = /*#__PURE__*/_interopDefaultLegacy(ts);

/**
 * Gets the text of the given property name. Returns null if the property
 * name couldn't be determined statically.
 */
function getPropertyNameText(node) {
    if (ts__default["default"].isIdentifier(node) || ts__default["default"].isStringLiteralLike(node)) {
        return node.text;
    }
    return null;
}
/** Finds a property with a specific name in an object literal expression. */
function findLiteralProperty(literal, name) {
    return literal.properties.find((prop) => prop.name && ts__default["default"].isIdentifier(prop.name) && prop.name.text === name);
}

exports.findLiteralProperty = findLiteralProperty;
exports.getPropertyNameText = getPropertyNameText;
