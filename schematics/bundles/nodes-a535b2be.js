'use strict';
/**
 * @license Angular v19.2.0-rc.0+sha-ce3a9a2
 * (c) 2010-2024 Google LLC. https://angular.io/
 * License: MIT
 */
'use strict';

var ts = require('typescript');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var ts__default = /*#__PURE__*/_interopDefaultLegacy(ts);

/** Find the closest parent node of a particular kind. */
function closestNode(node, predicate) {
    let current = node.parent;
    while (current && !ts__default["default"].isSourceFile(current)) {
        if (predicate(current)) {
            return current;
        }
        current = current.parent;
    }
    return null;
}

exports.closestNode = closestNode;
