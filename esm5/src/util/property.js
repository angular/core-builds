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
 * @template T
 * @param {?} objWithPropertyToExtract
 * @param {?} target
 * @return {?}
 */
export function getClosureSafeProperty(objWithPropertyToExtract, target) {
    for (var /** @type {?} */ key in objWithPropertyToExtract) {
        if (objWithPropertyToExtract[key] === target) {
            return key;
        }
    }
    throw Error('Could not find renamed property on target object.');
}
//# sourceMappingURL=property.js.map