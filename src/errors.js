/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
export var /** @type {?} */ ERROR_TYPE = 'ngType';
export var /** @type {?} */ ERROR_COMPONENT_TYPE = 'ngComponentType';
export var /** @type {?} */ ERROR_DEBUG_CONTEXT = 'ngDebugContext';
export var /** @type {?} */ ERROR_ORIGINAL_ERROR = 'ngOriginalError';
/**
 * @param {?} error
 * @return {?}
 */
export function getType(error) {
    return ((error))[ERROR_TYPE];
}
/**
 * @param {?} error
 * @return {?}
 */
export function getDebugContext(error) {
    return ((error))[ERROR_DEBUG_CONTEXT];
}
/**
 * @param {?} error
 * @return {?}
 */
export function getOriginalError(error) {
    return ((error))[ERROR_ORIGINAL_ERROR];
}
//# sourceMappingURL=errors.js.map