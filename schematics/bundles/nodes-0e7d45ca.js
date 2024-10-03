'use strict';
/**
 * @license Angular v19.0.0-next.8+sha-9213216
 * (c) 2010-2024 Google LLC. https://angular.io/
 * License: MIT
 */
'use strict';

var ts = require('typescript');
var imports = require('./imports-4ac08251.js');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var ts__default = /*#__PURE__*/_interopDefaultLegacy(ts);

function getCallDecoratorImport(typeChecker, decorator) {
    // Note that this does not cover the edge case where decorators are called from
    // a namespace import: e.g. "@core.Component()". This is not handled by Ngtsc either.
    if (!ts__default["default"].isCallExpression(decorator.expression) ||
        !ts__default["default"].isIdentifier(decorator.expression.expression)) {
        return null;
    }
    const identifier = decorator.expression.expression;
    return imports.getImportOfIdentifier(typeChecker, identifier);
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
exports.getAngularDecorators = getAngularDecorators;
