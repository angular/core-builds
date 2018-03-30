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
/**
 * Linked list of projected nodes (using the pNextOrParent property).
 * @record
 */
export function LProjection() { }
function LProjection_tsickle_Closure_declarations() {
    /** @type {?} */
    LProjection.prototype.head;
    /** @type {?} */
    LProjection.prototype.tail;
}
/** @enum {number} */
const SelectorFlags = {
    /** Indicates this is the beginning of a new negative selector */
    NOT: 1,
    /** Mode for matching attributes */
    ATTRIBUTE: 2,
    /** Mode for matching tag names */
    ELEMENT: 4,
    /** Mode for matching class names */
    CLASS: 8,
};
export { SelectorFlags };
export const /** @type {?} */ NG_PROJECT_AS_ATTR_NAME = 'ngProjectAs';
// Note: This hack is necessary so we don't erroneously get a circular dependency
// failure based on types.
export const /** @type {?} */ unusedValueExportToPlacateAjd = 1;
//# sourceMappingURL=projection.js.map