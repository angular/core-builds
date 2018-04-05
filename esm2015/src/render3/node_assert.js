/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { assertEqual, assertNotNull } from './assert';
/**
 * @param {?} node
 * @param {?} type
 * @return {?}
 */
export function assertNodeType(node, type) {
    assertNotNull(node, 'should be called with a node');
    assertEqual(node.type, type, `should be a ${typeName(type)}`);
}
/**
 * @param {?} node
 * @param {...?} types
 * @return {?}
 */
export function assertNodeOfPossibleTypes(node, ...types) {
    assertNotNull(node, 'should be called with a node');
    const /** @type {?} */ found = types.some(type => node.type === type);
    assertEqual(found, true, `Should be one of ${types.map(typeName).join(', ')}`);
}
/**
 * @param {?} type
 * @return {?}
 */
function typeName(type) {
    if (type == 1 /* Projection */)
        return 'Projection';
    if (type == 0 /* Container */)
        return 'Container';
    if (type == 2 /* View */)
        return 'View';
    if (type == 3 /* Element */)
        return 'Element';
    return '<unknown>';
}
//# sourceMappingURL=node_assert.js.map