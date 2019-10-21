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
import { TYPE } from './container';
import { FLAGS } from './view';
/**
 * True if `value` is `LView`.
 * @param {?} value wrapped value of `RNode`, `LView`, `LContainer`
 * @return {?}
 */
export function isLView(value) {
    return Array.isArray(value) && typeof value[TYPE] === 'object';
}
/**
 * True if `value` is `LContainer`.
 * @param {?} value wrapped value of `RNode`, `LView`, `LContainer`
 * @return {?}
 */
export function isLContainer(value) {
    return Array.isArray(value) && value[TYPE] === true;
}
/**
 * @param {?} tNode
 * @return {?}
 */
export function isContentQueryHost(tNode) {
    return (tNode.flags & 8 /* hasContentQuery */) !== 0;
}
/**
 * @param {?} tNode
 * @return {?}
 */
export function isComponentHost(tNode) {
    return (tNode.flags & 2 /* isComponentHost */) === 2 /* isComponentHost */;
}
/**
 * @param {?} tNode
 * @return {?}
 */
export function isDirectiveHost(tNode) {
    return (tNode.flags & 1 /* isDirectiveHost */) === 1 /* isDirectiveHost */;
}
/**
 * @template T
 * @param {?} def
 * @return {?}
 */
export function isComponentDef(def) {
    return ((/** @type {?} */ (def))).template !== null;
}
/**
 * @param {?} target
 * @return {?}
 */
export function isRootView(target) {
    return (target[FLAGS] & 512 /* IsRoot */) !== 0;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHlwZV9jaGVja3MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2ludGVyZmFjZXMvdHlwZV9jaGVja3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFVQSxPQUFPLEVBQWEsSUFBSSxFQUFDLE1BQU0sYUFBYSxDQUFDO0FBRzdDLE9BQU8sRUFBQyxLQUFLLEVBQW9CLE1BQU0sUUFBUSxDQUFDOzs7Ozs7QUFPaEQsTUFBTSxVQUFVLE9BQU8sQ0FBQyxLQUE2QztJQUNuRSxPQUFPLEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLElBQUksT0FBTyxLQUFLLENBQUMsSUFBSSxDQUFDLEtBQUssUUFBUSxDQUFDO0FBQ2pFLENBQUM7Ozs7OztBQU1ELE1BQU0sVUFBVSxZQUFZLENBQUMsS0FBNkM7SUFDeEUsT0FBTyxLQUFLLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxJQUFJLEtBQUssQ0FBQyxJQUFJLENBQUMsS0FBSyxJQUFJLENBQUM7QUFDdEQsQ0FBQzs7Ozs7QUFFRCxNQUFNLFVBQVUsa0JBQWtCLENBQUMsS0FBWTtJQUM3QyxPQUFPLENBQUMsS0FBSyxDQUFDLEtBQUssMEJBQTZCLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDMUQsQ0FBQzs7Ozs7QUFFRCxNQUFNLFVBQVUsZUFBZSxDQUFDLEtBQVk7SUFDMUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxLQUFLLDBCQUE2QixDQUFDLDRCQUErQixDQUFDO0FBQ25GLENBQUM7Ozs7O0FBRUQsTUFBTSxVQUFVLGVBQWUsQ0FBQyxLQUFZO0lBQzFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsS0FBSywwQkFBNkIsQ0FBQyw0QkFBK0IsQ0FBQztBQUNuRixDQUFDOzs7Ozs7QUFFRCxNQUFNLFVBQVUsY0FBYyxDQUFJLEdBQW9CO0lBQ3BELE9BQU8sQ0FBQyxtQkFBQSxHQUFHLEVBQW1CLENBQUMsQ0FBQyxRQUFRLEtBQUssSUFBSSxDQUFDO0FBQ3BELENBQUM7Ozs7O0FBRUQsTUFBTSxVQUFVLFVBQVUsQ0FBQyxNQUFhO0lBQ3RDLE9BQU8sQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLG1CQUFvQixDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQ25ELENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7Q29tcG9uZW50RGVmLCBEaXJlY3RpdmVEZWZ9IGZyb20gJy4uJztcblxuaW1wb3J0IHtMQ29udGFpbmVyLCBUWVBFfSBmcm9tICcuL2NvbnRhaW5lcic7XG5pbXBvcnQge1ROb2RlLCBUTm9kZUZsYWdzfSBmcm9tICcuL25vZGUnO1xuaW1wb3J0IHtSTm9kZX0gZnJvbSAnLi9yZW5kZXJlcic7XG5pbXBvcnQge0ZMQUdTLCBMVmlldywgTFZpZXdGbGFnc30gZnJvbSAnLi92aWV3JztcblxuXG4vKipcbiogVHJ1ZSBpZiBgdmFsdWVgIGlzIGBMVmlld2AuXG4qIEBwYXJhbSB2YWx1ZSB3cmFwcGVkIHZhbHVlIG9mIGBSTm9kZWAsIGBMVmlld2AsIGBMQ29udGFpbmVyYFxuKi9cbmV4cG9ydCBmdW5jdGlvbiBpc0xWaWV3KHZhbHVlOiBSTm9kZSB8IExWaWV3IHwgTENvbnRhaW5lciB8IHt9IHwgbnVsbCk6IHZhbHVlIGlzIExWaWV3IHtcbiAgcmV0dXJuIEFycmF5LmlzQXJyYXkodmFsdWUpICYmIHR5cGVvZiB2YWx1ZVtUWVBFXSA9PT0gJ29iamVjdCc7XG59XG5cbi8qKlxuICogVHJ1ZSBpZiBgdmFsdWVgIGlzIGBMQ29udGFpbmVyYC5cbiAqIEBwYXJhbSB2YWx1ZSB3cmFwcGVkIHZhbHVlIG9mIGBSTm9kZWAsIGBMVmlld2AsIGBMQ29udGFpbmVyYFxuICovXG5leHBvcnQgZnVuY3Rpb24gaXNMQ29udGFpbmVyKHZhbHVlOiBSTm9kZSB8IExWaWV3IHwgTENvbnRhaW5lciB8IHt9IHwgbnVsbCk6IHZhbHVlIGlzIExDb250YWluZXIge1xuICByZXR1cm4gQXJyYXkuaXNBcnJheSh2YWx1ZSkgJiYgdmFsdWVbVFlQRV0gPT09IHRydWU7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0NvbnRlbnRRdWVyeUhvc3QodE5vZGU6IFROb2RlKTogYm9vbGVhbiB7XG4gIHJldHVybiAodE5vZGUuZmxhZ3MgJiBUTm9kZUZsYWdzLmhhc0NvbnRlbnRRdWVyeSkgIT09IDA7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0NvbXBvbmVudEhvc3QodE5vZGU6IFROb2RlKTogYm9vbGVhbiB7XG4gIHJldHVybiAodE5vZGUuZmxhZ3MgJiBUTm9kZUZsYWdzLmlzQ29tcG9uZW50SG9zdCkgPT09IFROb2RlRmxhZ3MuaXNDb21wb25lbnRIb3N0O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNEaXJlY3RpdmVIb3N0KHROb2RlOiBUTm9kZSk6IGJvb2xlYW4ge1xuICByZXR1cm4gKHROb2RlLmZsYWdzICYgVE5vZGVGbGFncy5pc0RpcmVjdGl2ZUhvc3QpID09PSBUTm9kZUZsYWdzLmlzRGlyZWN0aXZlSG9zdDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzQ29tcG9uZW50RGVmPFQ+KGRlZjogRGlyZWN0aXZlRGVmPFQ+KTogZGVmIGlzIENvbXBvbmVudERlZjxUPiB7XG4gIHJldHVybiAoZGVmIGFzIENvbXBvbmVudERlZjxUPikudGVtcGxhdGUgIT09IG51bGw7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc1Jvb3RWaWV3KHRhcmdldDogTFZpZXcpOiBib29sZWFuIHtcbiAgcmV0dXJuICh0YXJnZXRbRkxBR1NdICYgTFZpZXdGbGFncy5Jc1Jvb3QpICE9PSAwO1xufVxuIl19