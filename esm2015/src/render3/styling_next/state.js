/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
* @license
* Copyright Google Inc. All Rights Reserved.
*
* Use of this source code is governed by an MIT-style license that can be
* found in the LICENSE file at https://angular.io/license
*/
/** @enum {number} */
const RuntimeStylingMode = {
    UseOld: 0,
    UseBothOldAndNew: 1,
    UseNew: 2,
};
export { RuntimeStylingMode };
/** @type {?} */
let _stylingMode = 0;
/**
 * Temporary function used to inform the existing styling algorithm
 * code to delegate all styling instruction calls to the new refactored
 * styling code.
 * @param {?} mode
 * @return {?}
 */
export function runtimeSetStylingMode(mode) {
    _stylingMode = mode;
}
/**
 * @return {?}
 */
export function runtimeIsNewStylingInUse() {
    return _stylingMode > 0 /* UseOld */;
}
/**
 * @return {?}
 */
export function runtimeAllowOldStyling() {
    return _stylingMode < 2 /* UseNew */;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhdGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL3N0eWxpbmdfbmV4dC9zdGF0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7O0lBY0UsU0FBVTtJQUNWLG1CQUFvQjtJQUNwQixTQUFVOzs7O0lBR1IsWUFBWSxHQUFHLENBQUM7Ozs7Ozs7O0FBT3BCLE1BQU0sVUFBVSxxQkFBcUIsQ0FBQyxJQUF3QjtJQUM1RCxZQUFZLEdBQUcsSUFBSSxDQUFDO0FBQ3RCLENBQUM7Ozs7QUFFRCxNQUFNLFVBQVUsd0JBQXdCO0lBQ3RDLE9BQU8sWUFBWSxpQkFBNEIsQ0FBQztBQUNsRCxDQUFDOzs7O0FBRUQsTUFBTSxVQUFVLHNCQUFzQjtJQUNwQyxPQUFPLFlBQVksaUJBQTRCLENBQUM7QUFDbEQsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuKiBAbGljZW5zZVxuKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbipcbiogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuKi9cblxuLyoqXG4gKiBBIHRlbXBvcmFyeSBlbnVtIG9mIHN0YXRlcyB0aGF0IGluZm9ybSB0aGUgY29yZSB3aGV0aGVyIG9yIG5vdFxuICogdG8gZGVmZXIgYWxsIHN0eWxpbmcgaW5zdHJ1Y3Rpb24gY2FsbHMgdG8gdGhlIG9sZCBvciBuZXdcbiAqIHN0eWxpbmcgaW1wbGVtZW50YXRpb24uXG4gKi9cbmV4cG9ydCBjb25zdCBlbnVtIFJ1bnRpbWVTdHlsaW5nTW9kZSB7XG4gIFVzZU9sZCA9IDAsXG4gIFVzZUJvdGhPbGRBbmROZXcgPSAxLFxuICBVc2VOZXcgPSAyLFxufVxuXG5sZXQgX3N0eWxpbmdNb2RlID0gMDtcblxuLyoqXG4gKiBUZW1wb3JhcnkgZnVuY3Rpb24gdXNlZCB0byBpbmZvcm0gdGhlIGV4aXN0aW5nIHN0eWxpbmcgYWxnb3JpdGhtXG4gKiBjb2RlIHRvIGRlbGVnYXRlIGFsbCBzdHlsaW5nIGluc3RydWN0aW9uIGNhbGxzIHRvIHRoZSBuZXcgcmVmYWN0b3JlZFxuICogc3R5bGluZyBjb2RlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcnVudGltZVNldFN0eWxpbmdNb2RlKG1vZGU6IFJ1bnRpbWVTdHlsaW5nTW9kZSkge1xuICBfc3R5bGluZ01vZGUgPSBtb2RlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcnVudGltZUlzTmV3U3R5bGluZ0luVXNlKCkge1xuICByZXR1cm4gX3N0eWxpbmdNb2RlID4gUnVudGltZVN0eWxpbmdNb2RlLlVzZU9sZDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJ1bnRpbWVBbGxvd09sZFN0eWxpbmcoKSB7XG4gIHJldHVybiBfc3R5bGluZ01vZGUgPCBSdW50aW1lU3R5bGluZ01vZGUuVXNlTmV3O1xufVxuIl19