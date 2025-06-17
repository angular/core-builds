'use strict';
/**
 * @license Angular v20.1.0-next.1+sha-2e0c98b
 * (c) 2010-2025 Google LLC. https://angular.io/
 * License: MIT
 */
'use strict';

var ts = require('typescript');

/** Find the closest parent node of a particular kind. */
function closestNode(node, predicate) {
    let current = node.parent;
    while (current && !ts.isSourceFile(current)) {
        if (predicate(current)) {
            return current;
        }
        current = current.parent;
    }
    return null;
}

exports.closestNode = closestNode;
