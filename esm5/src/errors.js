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
export var /** @type {?} */ ERROR_TYPE = 'ngType';
export var /** @type {?} */ ERROR_DEBUG_CONTEXT = 'ngDebugContext';
export var /** @type {?} */ ERROR_ORIGINAL_ERROR = 'ngOriginalError';
export var /** @type {?} */ ERROR_LOGGER = 'ngErrorLogger';
/**
 * @param {?} error
 * @return {?}
 */
export function getType(error) {
    return (/** @type {?} */ (error))[ERROR_TYPE];
}
/**
 * @param {?} error
 * @return {?}
 */
export function getDebugContext(error) {
    return (/** @type {?} */ (error))[ERROR_DEBUG_CONTEXT];
}
/**
 * @param {?} error
 * @return {?}
 */
export function getOriginalError(error) {
    return (/** @type {?} */ (error))[ERROR_ORIGINAL_ERROR];
}
/**
 * @param {?} error
 * @return {?}
 */
export function getErrorLogger(error) {
    return (/** @type {?} */ (error))[ERROR_LOGGER] || defaultErrorLogger;
}
/**
 * @param {?} console
 * @param {...?} values
 * @return {?}
 */
function defaultErrorLogger(console) {
    var values = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        values[_i - 1] = arguments[_i];
    }
    console.error.apply(console, values);
}
//# sourceMappingURL=errors.js.map