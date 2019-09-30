/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { global } from '../util/global';
/**
 * Used to inform TS about the `Proxy` class existing globally.
 * @record
 */
function GlobalWithProxy() { }
if (false) {
    /** @type {?} */
    GlobalWithProxy.prototype.Proxy;
}
/**
 * Creates an instance of a `Proxy` and creates with an empty target object and binds it to the
 * provided handler.
 *
 * The reason why this function exists is because IE doesn't support
 * the `Proxy` class. For this reason an error must be thrown.
 * @param {?} handler
 * @return {?}
 */
export function createProxy(handler) {
    /** @type {?} */
    const g = (/** @type {?} */ ((/** @type {?} */ (global))));
    if (!g.Proxy) {
        throw new Error('Proxy is not supported in this browser');
    }
    return new g.Proxy({}, handler);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJveHkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9kZWJ1Zy9wcm94eS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQU9BLE9BQU8sRUFBQyxNQUFNLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQzs7Ozs7QUFLdEMsOEJBRUM7OztJQURDLGdDQUFvQjs7Ozs7Ozs7Ozs7QUFVdEIsTUFBTSxVQUFVLFdBQVcsQ0FBQyxPQUEwQjs7VUFDOUMsQ0FBQyxHQUFHLG1CQUFBLG1CQUFBLE1BQU0sRUFBTyxFQUFtQjtJQUMxQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEtBQUssRUFBRTtRQUNaLE1BQU0sSUFBSSxLQUFLLENBQUMsd0NBQXdDLENBQUMsQ0FBQztLQUMzRDtJQUNELE9BQU8sSUFBSSxDQUFDLENBQUMsS0FBSyxDQUFDLEVBQUUsRUFBRSxPQUFPLENBQUMsQ0FBQztBQUNsQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0IHtnbG9iYWx9IGZyb20gJy4uL3V0aWwvZ2xvYmFsJztcblxuLyoqXG4gKiBVc2VkIHRvIGluZm9ybSBUUyBhYm91dCB0aGUgYFByb3h5YCBjbGFzcyBleGlzdGluZyBnbG9iYWxseS5cbiAqL1xuaW50ZXJmYWNlIEdsb2JhbFdpdGhQcm94eSB7XG4gIFByb3h5OiB0eXBlb2YgUHJveHk7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhbiBpbnN0YW5jZSBvZiBhIGBQcm94eWAgYW5kIGNyZWF0ZXMgd2l0aCBhbiBlbXB0eSB0YXJnZXQgb2JqZWN0IGFuZCBiaW5kcyBpdCB0byB0aGVcbiAqIHByb3ZpZGVkIGhhbmRsZXIuXG4gKlxuICogVGhlIHJlYXNvbiB3aHkgdGhpcyBmdW5jdGlvbiBleGlzdHMgaXMgYmVjYXVzZSBJRSBkb2Vzbid0IHN1cHBvcnRcbiAqIHRoZSBgUHJveHlgIGNsYXNzLiBGb3IgdGhpcyByZWFzb24gYW4gZXJyb3IgbXVzdCBiZSB0aHJvd24uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVQcm94eShoYW5kbGVyOiBQcm94eUhhbmRsZXI8YW55Pik6IHt9IHtcbiAgY29uc3QgZyA9IGdsb2JhbCBhcyBhbnkgYXMgR2xvYmFsV2l0aFByb3h5O1xuICBpZiAoIWcuUHJveHkpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ1Byb3h5IGlzIG5vdCBzdXBwb3J0ZWQgaW4gdGhpcyBicm93c2VyJyk7XG4gIH1cbiAgcmV0dXJuIG5ldyBnLlByb3h5KHt9LCBoYW5kbGVyKTtcbn1cbiJdfQ==