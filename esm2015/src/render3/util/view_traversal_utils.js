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
import { assertDefined } from '../../util/assert';
import { assertLView } from '../assert';
import { CONTEXT, DECLARATION_VIEW, FLAGS, PARENT, T_HOST } from '../interfaces/view';
import { isLContainer, isLView, readPatchedLView } from './view_utils';
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
 * Given a current view, finds the nearest component's host (LElement).
 *
 * @param {?} lView LView for which we want a host element node
 * @return {?} The host node
 */
export function findComponentView(lView) {
    /** @type {?} */
    let rootTNode = lView[T_HOST];
    while (rootTNode !== null && rootTNode.type === 2 /* View */) {
        ngDevMode && assertDefined(lView[DECLARATION_VIEW], 'lView[DECLARATION_VIEW]');
        lView = (/** @type {?} */ (lView[DECLARATION_VIEW]));
        rootTNode = lView[T_HOST];
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlld190cmF2ZXJzYWxfdXRpbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL3V0aWwvdmlld190cmF2ZXJzYWxfdXRpbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFRQSxPQUFPLEVBQUMsYUFBYSxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDaEQsT0FBTyxFQUFDLFdBQVcsRUFBQyxNQUFNLFdBQVcsQ0FBQztBQUV0QyxPQUFPLEVBQUMsT0FBTyxFQUFFLGdCQUFnQixFQUFFLEtBQUssRUFBcUIsTUFBTSxFQUFlLE1BQU0sRUFBQyxNQUFNLG9CQUFvQixDQUFDO0FBRXBILE9BQU8sRUFBQyxZQUFZLEVBQUUsT0FBTyxFQUFFLGdCQUFnQixFQUFDLE1BQU0sY0FBYyxDQUFDOzs7Ozs7O0FBUXJFLE1BQU0sVUFBVSxjQUFjLENBQUMsS0FBWTtJQUN6QyxTQUFTLElBQUksV0FBVyxDQUFDLEtBQUssQ0FBQyxDQUFDOztVQUMxQixNQUFNLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQztJQUM1QixPQUFPLFlBQVksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsbUJBQUEsTUFBTSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQztBQUMxRCxDQUFDOzs7Ozs7OztBQVFELE1BQU0sVUFBVSxXQUFXLENBQUMsZ0JBQTRCO0lBQ3RELFNBQVMsSUFBSSxhQUFhLENBQUMsZ0JBQWdCLEVBQUUsV0FBVyxDQUFDLENBQUM7O1FBQ3RELEtBQUssR0FBRyxPQUFPLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLG1CQUFBLGdCQUFnQixDQUFDLGdCQUFnQixDQUFDLEVBQUU7SUFDL0YsT0FBTyxLQUFLLElBQUksQ0FBQyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsbUJBQW9CLENBQUMsRUFBRTtRQUNuRCxLQUFLLEdBQUcsbUJBQUEsY0FBYyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUM7S0FDakM7SUFDRCxTQUFTLElBQUksV0FBVyxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ2hDLE9BQU8sS0FBSyxDQUFDO0FBQ2YsQ0FBQzs7Ozs7OztBQVFELE1BQU0sVUFBVSxpQkFBaUIsQ0FBQyxLQUFZOztRQUN4QyxTQUFTLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQztJQUM3QixPQUFPLFNBQVMsS0FBSyxJQUFJLElBQUksU0FBUyxDQUFDLElBQUksaUJBQW1CLEVBQUU7UUFDOUQsU0FBUyxJQUFJLGFBQWEsQ0FBQyxLQUFLLENBQUMsZ0JBQWdCLENBQUMsRUFBRSx5QkFBeUIsQ0FBQyxDQUFDO1FBQy9FLEtBQUssR0FBRyxtQkFBQSxLQUFLLENBQUMsZ0JBQWdCLENBQUMsRUFBRSxDQUFDO1FBQ2xDLFNBQVMsR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7S0FDM0I7SUFDRCxTQUFTLElBQUksV0FBVyxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ2hDLE9BQU8sS0FBSyxDQUFDO0FBQ2YsQ0FBQzs7Ozs7Ozs7O0FBU0QsTUFBTSxVQUFVLGNBQWMsQ0FBQyxlQUEyQjs7VUFDbEQsUUFBUSxHQUFHLFdBQVcsQ0FBQyxlQUFlLENBQUM7SUFDN0MsU0FBUztRQUNMLGFBQWEsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLEVBQUUsc0RBQXNELENBQUMsQ0FBQztJQUM3RixPQUFPLG1CQUFBLFFBQVEsQ0FBQyxPQUFPLENBQUMsRUFBZSxDQUFDO0FBQzFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7YXNzZXJ0RGVmaW5lZH0gZnJvbSAnLi4vLi4vdXRpbC9hc3NlcnQnO1xuaW1wb3J0IHthc3NlcnRMVmlld30gZnJvbSAnLi4vYXNzZXJ0JztcbmltcG9ydCB7VE5vZGVUeXBlfSBmcm9tICcuLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtDT05URVhULCBERUNMQVJBVElPTl9WSUVXLCBGTEFHUywgTFZpZXcsIExWaWV3RmxhZ3MsIFBBUkVOVCwgUm9vdENvbnRleHQsIFRfSE9TVH0gZnJvbSAnLi4vaW50ZXJmYWNlcy92aWV3JztcblxuaW1wb3J0IHtpc0xDb250YWluZXIsIGlzTFZpZXcsIHJlYWRQYXRjaGVkTFZpZXd9IGZyb20gJy4vdmlld191dGlscyc7XG5cblxuLyoqXG4gKiBHZXRzIHRoZSBwYXJlbnQgTFZpZXcgb2YgdGhlIHBhc3NlZCBMVmlldywgaWYgdGhlIFBBUkVOVCBpcyBhbiBMQ29udGFpbmVyLCB3aWxsIGdldCB0aGUgcGFyZW50IG9mXG4gKiB0aGF0IExDb250YWluZXIsIHdoaWNoIGlzIGFuIExWaWV3XG4gKiBAcGFyYW0gbFZpZXcgdGhlIGxWaWV3IHdob3NlIHBhcmVudCB0byBnZXRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldExWaWV3UGFyZW50KGxWaWV3OiBMVmlldyk6IExWaWV3fG51bGwge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0TFZpZXcobFZpZXcpO1xuICBjb25zdCBwYXJlbnQgPSBsVmlld1tQQVJFTlRdO1xuICByZXR1cm4gaXNMQ29udGFpbmVyKHBhcmVudCkgPyBwYXJlbnRbUEFSRU5UXSAhIDogcGFyZW50O1xufVxuXG4vKipcbiAqIFJldHJpZXZlIHRoZSByb290IHZpZXcgZnJvbSBhbnkgY29tcG9uZW50IG9yIGBMVmlld2AgYnkgd2Fsa2luZyB0aGUgcGFyZW50IGBMVmlld2AgdW50aWxcbiAqIHJlYWNoaW5nIHRoZSByb290IGBMVmlld2AuXG4gKlxuICogQHBhcmFtIGNvbXBvbmVudE9yTFZpZXcgYW55IGNvbXBvbmVudCBvciBgTFZpZXdgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRSb290Vmlldyhjb21wb25lbnRPckxWaWV3OiBMVmlldyB8IHt9KTogTFZpZXcge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChjb21wb25lbnRPckxWaWV3LCAnY29tcG9uZW50Jyk7XG4gIGxldCBsVmlldyA9IGlzTFZpZXcoY29tcG9uZW50T3JMVmlldykgPyBjb21wb25lbnRPckxWaWV3IDogcmVhZFBhdGNoZWRMVmlldyhjb21wb25lbnRPckxWaWV3KSAhO1xuICB3aGlsZSAobFZpZXcgJiYgIShsVmlld1tGTEFHU10gJiBMVmlld0ZsYWdzLklzUm9vdCkpIHtcbiAgICBsVmlldyA9IGdldExWaWV3UGFyZW50KGxWaWV3KSAhO1xuICB9XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRMVmlldyhsVmlldyk7XG4gIHJldHVybiBsVmlldztcbn1cblxuLyoqXG4gKiBHaXZlbiBhIGN1cnJlbnQgdmlldywgZmluZHMgdGhlIG5lYXJlc3QgY29tcG9uZW50J3MgaG9zdCAoTEVsZW1lbnQpLlxuICpcbiAqIEBwYXJhbSBsVmlldyBMVmlldyBmb3Igd2hpY2ggd2Ugd2FudCBhIGhvc3QgZWxlbWVudCBub2RlXG4gKiBAcmV0dXJucyBUaGUgaG9zdCBub2RlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBmaW5kQ29tcG9uZW50VmlldyhsVmlldzogTFZpZXcpOiBMVmlldyB7XG4gIGxldCByb290VE5vZGUgPSBsVmlld1tUX0hPU1RdO1xuICB3aGlsZSAocm9vdFROb2RlICE9PSBudWxsICYmIHJvb3RUTm9kZS50eXBlID09PSBUTm9kZVR5cGUuVmlldykge1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKGxWaWV3W0RFQ0xBUkFUSU9OX1ZJRVddLCAnbFZpZXdbREVDTEFSQVRJT05fVklFV10nKTtcbiAgICBsVmlldyA9IGxWaWV3W0RFQ0xBUkFUSU9OX1ZJRVddICE7XG4gICAgcm9vdFROb2RlID0gbFZpZXdbVF9IT1NUXTtcbiAgfVxuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0TFZpZXcobFZpZXcpO1xuICByZXR1cm4gbFZpZXc7XG59XG5cbi8qKlxuICogUmV0dXJucyB0aGUgYFJvb3RDb250ZXh0YCBpbnN0YW5jZSB0aGF0IGlzIGFzc29jaWF0ZWQgd2l0aFxuICogdGhlIGFwcGxpY2F0aW9uIHdoZXJlIHRoZSB0YXJnZXQgaXMgc2l0dWF0ZWQuIEl0IGRvZXMgdGhpcyBieSB3YWxraW5nIHRoZSBwYXJlbnQgdmlld3MgdW50aWwgaXRcbiAqIGdldHMgdG8gdGhlIHJvb3QgdmlldywgdGhlbiBnZXR0aW5nIHRoZSBjb250ZXh0IG9mZiBvZiB0aGF0LlxuICpcbiAqIEBwYXJhbSB2aWV3T3JDb21wb25lbnQgdGhlIGBMVmlld2Agb3IgY29tcG9uZW50IHRvIGdldCB0aGUgcm9vdCBjb250ZXh0IGZvci5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldFJvb3RDb250ZXh0KHZpZXdPckNvbXBvbmVudDogTFZpZXcgfCB7fSk6IFJvb3RDb250ZXh0IHtcbiAgY29uc3Qgcm9vdFZpZXcgPSBnZXRSb290Vmlldyh2aWV3T3JDb21wb25lbnQpO1xuICBuZ0Rldk1vZGUgJiZcbiAgICAgIGFzc2VydERlZmluZWQocm9vdFZpZXdbQ09OVEVYVF0sICdSb290VmlldyBoYXMgbm8gY29udGV4dC4gUGVyaGFwcyBpdCBpcyBkaXNjb25uZWN0ZWQ/Jyk7XG4gIHJldHVybiByb290Vmlld1tDT05URVhUXSBhcyBSb290Q29udGV4dDtcbn1cbiJdfQ==