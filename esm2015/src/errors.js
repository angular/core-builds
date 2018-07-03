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
export const /** @type {?} */ ERROR_TYPE = 'ngType';
export const /** @type {?} */ ERROR_DEBUG_CONTEXT = 'ngDebugContext';
export const /** @type {?} */ ERROR_ORIGINAL_ERROR = 'ngOriginalError';
export const /** @type {?} */ ERROR_LOGGER = 'ngErrorLogger';
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
function defaultErrorLogger(console, ...values) {
    (/** @type {?} */ (console.error))(...values);
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXJyb3JzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvZXJyb3JzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBVUEsTUFBTSxDQUFDLHVCQUFNLFVBQVUsR0FBRyxRQUFRLENBQUM7QUFDbkMsTUFBTSxDQUFDLHVCQUFNLG1CQUFtQixHQUFHLGdCQUFnQixDQUFDO0FBQ3BELE1BQU0sQ0FBQyx1QkFBTSxvQkFBb0IsR0FBRyxpQkFBaUIsQ0FBQztBQUN0RCxNQUFNLENBQUMsdUJBQU0sWUFBWSxHQUFHLGVBQWUsQ0FBQzs7Ozs7QUFHNUMsTUFBTSxrQkFBa0IsS0FBWTtJQUNsQyxPQUFPLG1CQUFDLEtBQVksRUFBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDO0NBQ25DOzs7OztBQUVELE1BQU0sMEJBQTBCLEtBQVk7SUFDMUMsT0FBTyxtQkFBQyxLQUFZLEVBQUMsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO0NBQzVDOzs7OztBQUVELE1BQU0sMkJBQTJCLEtBQVk7SUFDM0MsT0FBTyxtQkFBQyxLQUFZLEVBQUMsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO0NBQzdDOzs7OztBQUVELE1BQU0seUJBQXlCLEtBQVk7SUFDekMsT0FBTyxtQkFBQyxLQUFZLEVBQUMsQ0FBQyxZQUFZLENBQUMsSUFBSSxrQkFBa0IsQ0FBQztDQUMzRDs7Ozs7O0FBR0QsNEJBQTRCLE9BQWdCLEVBQUUsR0FBRyxNQUFhO0lBQzVELG1CQUFNLE9BQU8sQ0FBQyxLQUFLLEVBQUMsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxDQUFDO0NBQ2pDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0RlYnVnQ29udGV4dH0gZnJvbSAnLi92aWV3JztcblxuZXhwb3J0IGNvbnN0IEVSUk9SX1RZUEUgPSAnbmdUeXBlJztcbmV4cG9ydCBjb25zdCBFUlJPUl9ERUJVR19DT05URVhUID0gJ25nRGVidWdDb250ZXh0JztcbmV4cG9ydCBjb25zdCBFUlJPUl9PUklHSU5BTF9FUlJPUiA9ICduZ09yaWdpbmFsRXJyb3InO1xuZXhwb3J0IGNvbnN0IEVSUk9SX0xPR0dFUiA9ICduZ0Vycm9yTG9nZ2VyJztcblxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0VHlwZShlcnJvcjogRXJyb3IpOiBGdW5jdGlvbiB7XG4gIHJldHVybiAoZXJyb3IgYXMgYW55KVtFUlJPUl9UWVBFXTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldERlYnVnQ29udGV4dChlcnJvcjogRXJyb3IpOiBEZWJ1Z0NvbnRleHQge1xuICByZXR1cm4gKGVycm9yIGFzIGFueSlbRVJST1JfREVCVUdfQ09OVEVYVF07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRPcmlnaW5hbEVycm9yKGVycm9yOiBFcnJvcik6IEVycm9yIHtcbiAgcmV0dXJuIChlcnJvciBhcyBhbnkpW0VSUk9SX09SSUdJTkFMX0VSUk9SXTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEVycm9yTG9nZ2VyKGVycm9yOiBFcnJvcik6IChjb25zb2xlOiBDb25zb2xlLCAuLi52YWx1ZXM6IGFueVtdKSA9PiB2b2lkIHtcbiAgcmV0dXJuIChlcnJvciBhcyBhbnkpW0VSUk9SX0xPR0dFUl0gfHwgZGVmYXVsdEVycm9yTG9nZ2VyO1xufVxuXG5cbmZ1bmN0aW9uIGRlZmF1bHRFcnJvckxvZ2dlcihjb25zb2xlOiBDb25zb2xlLCAuLi52YWx1ZXM6IGFueVtdKSB7XG4gICg8YW55PmNvbnNvbGUuZXJyb3IpKC4uLnZhbHVlcyk7XG59Il19