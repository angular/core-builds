/**
 * @fileoverview added by tsickle
 * Generated from: packages/core/src/profile/wtf_impl.ts
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
 * A scope function for the Web Tracing Framework (WTF).
 *
 * \@publicApi
 * @deprecated the Web Tracing Framework is no longer supported in Angular
 * @record
 */
export function WtfScopeFn() { }
/**
 * @record
 */
function WTF() { }
if (false) {
    /** @type {?} */
    WTF.prototype.trace;
}
/**
 * @record
 */
function Trace() { }
if (false) {
    /** @type {?} */
    Trace.prototype.events;
    /**
     * @param {?} scope
     * @param {?} returnValue
     * @return {?}
     */
    Trace.prototype.leaveScope = function (scope, returnValue) { };
    /**
     * @param {?} rangeType
     * @param {?} action
     * @return {?}
     */
    Trace.prototype.beginTimeRange = function (rangeType, action) { };
    /**
     * @param {?} range
     * @return {?}
     */
    Trace.prototype.endTimeRange = function (range) { };
}
/**
 * @record
 */
export function Range() { }
/**
 * @record
 */
function Events() { }
if (false) {
    /**
     * @param {?} signature
     * @param {?} flags
     * @return {?}
     */
    Events.prototype.createScope = function (signature, flags) { };
}
/**
 * @record
 */
export function Scope() { }
/** @type {?} */
let trace;
/** @type {?} */
let events;
/**
 * @return {?}
 */
export function detectWTF() {
    /** @type {?} */
    const wtf = ((/** @type {?} */ (global)))['wtf'];
    if (wtf) {
        trace = wtf['trace'];
        if (trace) {
            events = trace['events'];
            return true;
        }
    }
    return false;
}
/**
 * @param {?} signature
 * @param {?=} flags
 * @return {?}
 */
export function createScope(signature, flags = null) {
    return events.createScope(signature, flags);
}
/**
 * @template T
 * @param {?} scope
 * @param {?=} returnValue
 * @return {?}
 */
export function leave(scope, returnValue) {
    trace.leaveScope(scope, returnValue);
    return returnValue;
}
/**
 * @param {?} rangeType
 * @param {?} action
 * @return {?}
 */
export function startTimeRange(rangeType, action) {
    return trace.beginTimeRange(rangeType, action);
}
/**
 * @param {?} range
 * @return {?}
 */
export function endTimeRange(range) {
    trace.endTimeRange(range);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid3RmX2ltcGwuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9wcm9maWxlL3d0Zl9pbXBsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQVFBLE9BQU8sRUFBQyxNQUFNLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQzs7Ozs7Ozs7QUFRdEMsZ0NBQThEOzs7O0FBRTlELGtCQUVDOzs7SUFEQyxvQkFBYTs7Ozs7QUFHZixvQkFLQzs7O0lBSkMsdUJBQWU7Ozs7OztJQUNmLCtEQUFrRTs7Ozs7O0lBQ2xFLGtFQUF5RDs7Ozs7SUFDekQsb0RBQWtEOzs7OztBQUdwRCwyQkFBeUI7Ozs7QUFFekIscUJBRUM7Ozs7Ozs7SUFEQywrREFBa0Q7Ozs7O0FBR3BELDJCQUFtRTs7SUFFL0QsS0FBWTs7SUFDWixNQUFjOzs7O0FBRWxCLE1BQU0sVUFBVSxTQUFTOztVQUNqQixHQUFHLEdBQVEsQ0FBQyxtQkFBQSxNQUFNLEVBQU8sQ0FBbUIsQ0FBQyxLQUFLLENBQUM7SUFDekQsSUFBSSxHQUFHLEVBQUU7UUFDUCxLQUFLLEdBQUcsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ3JCLElBQUksS0FBSyxFQUFFO1lBQ1QsTUFBTSxHQUFHLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUN6QixPQUFPLElBQUksQ0FBQztTQUNiO0tBQ0Y7SUFDRCxPQUFPLEtBQUssQ0FBQztBQUNmLENBQUM7Ozs7OztBQUVELE1BQU0sVUFBVSxXQUFXLENBQUMsU0FBaUIsRUFBRSxRQUFhLElBQUk7SUFDOUQsT0FBTyxNQUFNLENBQUMsV0FBVyxDQUFDLFNBQVMsRUFBRSxLQUFLLENBQUMsQ0FBQztBQUM5QyxDQUFDOzs7Ozs7O0FBSUQsTUFBTSxVQUFVLEtBQUssQ0FBSSxLQUFZLEVBQUUsV0FBaUI7SUFDdEQsS0FBSyxDQUFDLFVBQVUsQ0FBQyxLQUFLLEVBQUUsV0FBVyxDQUFDLENBQUM7SUFDckMsT0FBTyxXQUFXLENBQUM7QUFDckIsQ0FBQzs7Ozs7O0FBRUQsTUFBTSxVQUFVLGNBQWMsQ0FBQyxTQUFpQixFQUFFLE1BQWM7SUFDOUQsT0FBTyxLQUFLLENBQUMsY0FBYyxDQUFDLFNBQVMsRUFBRSxNQUFNLENBQUMsQ0FBQztBQUNqRCxDQUFDOzs7OztBQUVELE1BQU0sVUFBVSxZQUFZLENBQUMsS0FBWTtJQUN2QyxLQUFLLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQzVCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7Z2xvYmFsfSBmcm9tICcuLi91dGlsL2dsb2JhbCc7XG5cbi8qKlxuICogQSBzY29wZSBmdW5jdGlvbiBmb3IgdGhlIFdlYiBUcmFjaW5nIEZyYW1ld29yayAoV1RGKS5cbiAqXG4gKiBAcHVibGljQXBpXG4gKiBAZGVwcmVjYXRlZCB0aGUgV2ViIFRyYWNpbmcgRnJhbWV3b3JrIGlzIG5vIGxvbmdlciBzdXBwb3J0ZWQgaW4gQW5ndWxhclxuICovXG5leHBvcnQgaW50ZXJmYWNlIFd0ZlNjb3BlRm4geyAoYXJnMD86IGFueSwgYXJnMT86IGFueSk6IGFueTsgfVxuXG5pbnRlcmZhY2UgV1RGIHtcbiAgdHJhY2U6IFRyYWNlO1xufVxuXG5pbnRlcmZhY2UgVHJhY2Uge1xuICBldmVudHM6IEV2ZW50cztcbiAgbGVhdmVTY29wZShzY29wZTogU2NvcGUsIHJldHVyblZhbHVlOiBhbnkpOiBhbnkgLyoqIFRPRE8gIzkxMDAgKi87XG4gIGJlZ2luVGltZVJhbmdlKHJhbmdlVHlwZTogc3RyaW5nLCBhY3Rpb246IHN0cmluZyk6IFJhbmdlO1xuICBlbmRUaW1lUmFuZ2UocmFuZ2U6IFJhbmdlKTogYW55IC8qKiBUT0RPICM5MTAwICovO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFJhbmdlIHt9XG5cbmludGVyZmFjZSBFdmVudHMge1xuICBjcmVhdGVTY29wZShzaWduYXR1cmU6IHN0cmluZywgZmxhZ3M6IGFueSk6IFNjb3BlO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFNjb3BlIHsgKC4uLmFyZ3M6IGFueVtdIC8qKiBUT0RPICM5MTAwICovKTogYW55OyB9XG5cbmxldCB0cmFjZTogVHJhY2U7XG5sZXQgZXZlbnRzOiBFdmVudHM7XG5cbmV4cG9ydCBmdW5jdGlvbiBkZXRlY3RXVEYoKTogYm9vbGVhbiB7XG4gIGNvbnN0IHd0ZjogV1RGID0gKGdsb2JhbCBhcyBhbnkgLyoqIFRPRE8gIzkxMDAgKi8pWyd3dGYnXTtcbiAgaWYgKHd0Zikge1xuICAgIHRyYWNlID0gd3RmWyd0cmFjZSddO1xuICAgIGlmICh0cmFjZSkge1xuICAgICAgZXZlbnRzID0gdHJhY2VbJ2V2ZW50cyddO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9XG4gIHJldHVybiBmYWxzZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVNjb3BlKHNpZ25hdHVyZTogc3RyaW5nLCBmbGFnczogYW55ID0gbnVsbCk6IGFueSB7XG4gIHJldHVybiBldmVudHMuY3JlYXRlU2NvcGUoc2lnbmF0dXJlLCBmbGFncyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBsZWF2ZTxUPihzY29wZTogU2NvcGUpOiB2b2lkO1xuZXhwb3J0IGZ1bmN0aW9uIGxlYXZlPFQ+KHNjb3BlOiBTY29wZSwgcmV0dXJuVmFsdWU/OiBUKTogVDtcbmV4cG9ydCBmdW5jdGlvbiBsZWF2ZTxUPihzY29wZTogU2NvcGUsIHJldHVyblZhbHVlPzogYW55KTogYW55IHtcbiAgdHJhY2UubGVhdmVTY29wZShzY29wZSwgcmV0dXJuVmFsdWUpO1xuICByZXR1cm4gcmV0dXJuVmFsdWU7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzdGFydFRpbWVSYW5nZShyYW5nZVR5cGU6IHN0cmluZywgYWN0aW9uOiBzdHJpbmcpOiBSYW5nZSB7XG4gIHJldHVybiB0cmFjZS5iZWdpblRpbWVSYW5nZShyYW5nZVR5cGUsIGFjdGlvbik7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBlbmRUaW1lUmFuZ2UocmFuZ2U6IFJhbmdlKTogdm9pZCB7XG4gIHRyYWNlLmVuZFRpbWVSYW5nZShyYW5nZSk7XG59XG4iXX0=