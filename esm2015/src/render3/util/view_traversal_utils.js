/**
 * @fileoverview added by tsickle
 * Generated from: packages/core/src/render3/util/view_traversal_utils.ts
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { assertDefined } from '../../util/assert';
import { assertLView } from '../assert';
import { isLContainer, isLView } from '../interfaces/type_checks';
import { CONTEXT, FLAGS, PARENT } from '../interfaces/view';
import { readPatchedLView } from './view_utils';
/**
 * Gets the parent LView of the passed LView, if the PARENT is an LContainer, will get the parent of
 * that LContainer, which is an LView
 * @param {?} lView the lView whose parent to get
 * @return {?}
 */
export function getLViewParent(lView) {
    ngDevMode && assertLView(lView);
    /** @type {?} */
    const parent = lView[PARENT];
    return isLContainer(parent) ? (/** @type {?} */ (parent[PARENT])) : parent;
}
/**
 * Retrieve the root view from any component or `LView` by walking the parent `LView` until
 * reaching the root `LView`.
 *
 * @param {?} componentOrLView any component or `LView`
 * @return {?}
 */
export function getRootView(componentOrLView) {
    ngDevMode && assertDefined(componentOrLView, 'component');
    /** @type {?} */
    let lView = isLView(componentOrLView) ? componentOrLView : (/** @type {?} */ (readPatchedLView(componentOrLView)));
    while (lView && !(lView[FLAGS] & 512 /* IsRoot */)) {
        lView = (/** @type {?} */ (getLViewParent(lView)));
    }
    ngDevMode && assertLView(lView);
    return lView;
}
/**
 * Returns the `RootContext` instance that is associated with
 * the application where the target is situated. It does this by walking the parent views until it
 * gets to the root view, then getting the context off of that.
 *
 * @param {?} viewOrComponent the `LView` or component to get the root context for.
 * @return {?}
 */
export function getRootContext(viewOrComponent) {
    /** @type {?} */
    const rootView = getRootView(viewOrComponent);
    ngDevMode &&
        assertDefined(rootView[CONTEXT], 'RootView has no context. Perhaps it is disconnected?');
    return (/** @type {?} */ (rootView[CONTEXT]));
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlld190cmF2ZXJzYWxfdXRpbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL3V0aWwvdmlld190cmF2ZXJzYWxfdXRpbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBUUEsT0FBTyxFQUFDLGFBQWEsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQ2hELE9BQU8sRUFBQyxXQUFXLEVBQUMsTUFBTSxXQUFXLENBQUM7QUFDdEMsT0FBTyxFQUFDLFlBQVksRUFBRSxPQUFPLEVBQUMsTUFBTSwyQkFBMkIsQ0FBQztBQUNoRSxPQUFPLEVBQUMsT0FBTyxFQUFFLEtBQUssRUFBcUIsTUFBTSxFQUFjLE1BQU0sb0JBQW9CLENBQUM7QUFDMUYsT0FBTyxFQUFDLGdCQUFnQixFQUFDLE1BQU0sY0FBYyxDQUFDOzs7Ozs7O0FBUTlDLE1BQU0sVUFBVSxjQUFjLENBQUMsS0FBWTtJQUN6QyxTQUFTLElBQUksV0FBVyxDQUFDLEtBQUssQ0FBQyxDQUFDOztVQUMxQixNQUFNLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQztJQUM1QixPQUFPLFlBQVksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsbUJBQUEsTUFBTSxDQUFDLE1BQU0sQ0FBQyxFQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQztBQUN6RCxDQUFDOzs7Ozs7OztBQVFELE1BQU0sVUFBVSxXQUFXLENBQUMsZ0JBQTBCO0lBQ3BELFNBQVMsSUFBSSxhQUFhLENBQUMsZ0JBQWdCLEVBQUUsV0FBVyxDQUFDLENBQUM7O1FBQ3RELEtBQUssR0FBRyxPQUFPLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLG1CQUFBLGdCQUFnQixDQUFDLGdCQUFnQixDQUFDLEVBQUM7SUFDOUYsT0FBTyxLQUFLLElBQUksQ0FBQyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsbUJBQW9CLENBQUMsRUFBRTtRQUNuRCxLQUFLLEdBQUcsbUJBQUEsY0FBYyxDQUFDLEtBQUssQ0FBQyxFQUFDLENBQUM7S0FDaEM7SUFDRCxTQUFTLElBQUksV0FBVyxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ2hDLE9BQU8sS0FBSyxDQUFDO0FBQ2YsQ0FBQzs7Ozs7Ozs7O0FBU0QsTUFBTSxVQUFVLGNBQWMsQ0FBQyxlQUF5Qjs7VUFDaEQsUUFBUSxHQUFHLFdBQVcsQ0FBQyxlQUFlLENBQUM7SUFDN0MsU0FBUztRQUNMLGFBQWEsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLEVBQUUsc0RBQXNELENBQUMsQ0FBQztJQUM3RixPQUFPLG1CQUFBLFFBQVEsQ0FBQyxPQUFPLENBQUMsRUFBZSxDQUFDO0FBQzFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7YXNzZXJ0RGVmaW5lZH0gZnJvbSAnLi4vLi4vdXRpbC9hc3NlcnQnO1xuaW1wb3J0IHthc3NlcnRMVmlld30gZnJvbSAnLi4vYXNzZXJ0JztcbmltcG9ydCB7aXNMQ29udGFpbmVyLCBpc0xWaWV3fSBmcm9tICcuLi9pbnRlcmZhY2VzL3R5cGVfY2hlY2tzJztcbmltcG9ydCB7Q09OVEVYVCwgRkxBR1MsIExWaWV3LCBMVmlld0ZsYWdzLCBQQVJFTlQsIFJvb3RDb250ZXh0fSBmcm9tICcuLi9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHtyZWFkUGF0Y2hlZExWaWV3fSBmcm9tICcuL3ZpZXdfdXRpbHMnO1xuXG5cbi8qKlxuICogR2V0cyB0aGUgcGFyZW50IExWaWV3IG9mIHRoZSBwYXNzZWQgTFZpZXcsIGlmIHRoZSBQQVJFTlQgaXMgYW4gTENvbnRhaW5lciwgd2lsbCBnZXQgdGhlIHBhcmVudCBvZlxuICogdGhhdCBMQ29udGFpbmVyLCB3aGljaCBpcyBhbiBMVmlld1xuICogQHBhcmFtIGxWaWV3IHRoZSBsVmlldyB3aG9zZSBwYXJlbnQgdG8gZ2V0XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRMVmlld1BhcmVudChsVmlldzogTFZpZXcpOiBMVmlld3xudWxsIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydExWaWV3KGxWaWV3KTtcbiAgY29uc3QgcGFyZW50ID0gbFZpZXdbUEFSRU5UXTtcbiAgcmV0dXJuIGlzTENvbnRhaW5lcihwYXJlbnQpID8gcGFyZW50W1BBUkVOVF0hIDogcGFyZW50O1xufVxuXG4vKipcbiAqIFJldHJpZXZlIHRoZSByb290IHZpZXcgZnJvbSBhbnkgY29tcG9uZW50IG9yIGBMVmlld2AgYnkgd2Fsa2luZyB0aGUgcGFyZW50IGBMVmlld2AgdW50aWxcbiAqIHJlYWNoaW5nIHRoZSByb290IGBMVmlld2AuXG4gKlxuICogQHBhcmFtIGNvbXBvbmVudE9yTFZpZXcgYW55IGNvbXBvbmVudCBvciBgTFZpZXdgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRSb290Vmlldyhjb21wb25lbnRPckxWaWV3OiBMVmlld3x7fSk6IExWaWV3IHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQoY29tcG9uZW50T3JMVmlldywgJ2NvbXBvbmVudCcpO1xuICBsZXQgbFZpZXcgPSBpc0xWaWV3KGNvbXBvbmVudE9yTFZpZXcpID8gY29tcG9uZW50T3JMVmlldyA6IHJlYWRQYXRjaGVkTFZpZXcoY29tcG9uZW50T3JMVmlldykhO1xuICB3aGlsZSAobFZpZXcgJiYgIShsVmlld1tGTEFHU10gJiBMVmlld0ZsYWdzLklzUm9vdCkpIHtcbiAgICBsVmlldyA9IGdldExWaWV3UGFyZW50KGxWaWV3KSE7XG4gIH1cbiAgbmdEZXZNb2RlICYmIGFzc2VydExWaWV3KGxWaWV3KTtcbiAgcmV0dXJuIGxWaWV3O1xufVxuXG4vKipcbiAqIFJldHVybnMgdGhlIGBSb290Q29udGV4dGAgaW5zdGFuY2UgdGhhdCBpcyBhc3NvY2lhdGVkIHdpdGhcbiAqIHRoZSBhcHBsaWNhdGlvbiB3aGVyZSB0aGUgdGFyZ2V0IGlzIHNpdHVhdGVkLiBJdCBkb2VzIHRoaXMgYnkgd2Fsa2luZyB0aGUgcGFyZW50IHZpZXdzIHVudGlsIGl0XG4gKiBnZXRzIHRvIHRoZSByb290IHZpZXcsIHRoZW4gZ2V0dGluZyB0aGUgY29udGV4dCBvZmYgb2YgdGhhdC5cbiAqXG4gKiBAcGFyYW0gdmlld09yQ29tcG9uZW50IHRoZSBgTFZpZXdgIG9yIGNvbXBvbmVudCB0byBnZXQgdGhlIHJvb3QgY29udGV4dCBmb3IuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRSb290Q29udGV4dCh2aWV3T3JDb21wb25lbnQ6IExWaWV3fHt9KTogUm9vdENvbnRleHQge1xuICBjb25zdCByb290VmlldyA9IGdldFJvb3RWaWV3KHZpZXdPckNvbXBvbmVudCk7XG4gIG5nRGV2TW9kZSAmJlxuICAgICAgYXNzZXJ0RGVmaW5lZChyb290Vmlld1tDT05URVhUXSwgJ1Jvb3RWaWV3IGhhcyBubyBjb250ZXh0LiBQZXJoYXBzIGl0IGlzIGRpc2Nvbm5lY3RlZD8nKTtcbiAgcmV0dXJuIHJvb3RWaWV3W0NPTlRFWFRdIGFzIFJvb3RDb250ZXh0O1xufVxuIl19