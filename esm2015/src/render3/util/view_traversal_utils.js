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
import { assertDefined } from '../../util/assert';
import { assertLView } from '../assert';
import { isLContainer, isLView } from '../interfaces/type_checks';
import { CONTEXT, DECLARATION_VIEW, FLAGS, PARENT, T_HOST } from '../interfaces/view';
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
 * Given an `LView`, find the closest declaration view which is not an embedded view.
 *
 * This method searches for the `LView` associated with the component which declared the `LView`.
 *
 * This function may return itself if the `LView` passed in is not an embedded `LView`. Otherwise
 * it walks the declaration parents until it finds a component view (non-embedded-view.)
 *
 * @param {?} lView LView for which we want a host element node
 * @return {?} The host node
 */
export function findComponentView(lView) {
    /** @type {?} */
    let rootTNode = lView[T_HOST];
    /** @type {?} */
    let declaredView;
    while (rootTNode !== null && rootTNode.type === 2 /* View */ &&
        (declaredView = lView[DECLARATION_VIEW]) !== null) {
        lView = declaredView;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlld190cmF2ZXJzYWxfdXRpbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL3V0aWwvdmlld190cmF2ZXJzYWxfdXRpbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFRQSxPQUFPLEVBQUMsYUFBYSxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDaEQsT0FBTyxFQUFDLFdBQVcsRUFBQyxNQUFNLFdBQVcsQ0FBQztBQUV0QyxPQUFPLEVBQUMsWUFBWSxFQUFFLE9BQU8sRUFBQyxNQUFNLDJCQUEyQixDQUFDO0FBQ2hFLE9BQU8sRUFBQyxPQUFPLEVBQUUsZ0JBQWdCLEVBQUUsS0FBSyxFQUFxQixNQUFNLEVBQWUsTUFBTSxFQUFDLE1BQU0sb0JBQW9CLENBQUM7QUFFcEgsT0FBTyxFQUFDLGdCQUFnQixFQUFDLE1BQU0sY0FBYyxDQUFDOzs7Ozs7O0FBUzlDLE1BQU0sVUFBVSxjQUFjLENBQUMsS0FBWTtJQUN6QyxTQUFTLElBQUksV0FBVyxDQUFDLEtBQUssQ0FBQyxDQUFDOztVQUMxQixNQUFNLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQztJQUM1QixPQUFPLFlBQVksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsbUJBQUEsTUFBTSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQztBQUMxRCxDQUFDOzs7Ozs7OztBQVFELE1BQU0sVUFBVSxXQUFXLENBQUMsZ0JBQTRCO0lBQ3RELFNBQVMsSUFBSSxhQUFhLENBQUMsZ0JBQWdCLEVBQUUsV0FBVyxDQUFDLENBQUM7O1FBQ3RELEtBQUssR0FBRyxPQUFPLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLG1CQUFBLGdCQUFnQixDQUFDLGdCQUFnQixDQUFDLEVBQUU7SUFDL0YsT0FBTyxLQUFLLElBQUksQ0FBQyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsbUJBQW9CLENBQUMsRUFBRTtRQUNuRCxLQUFLLEdBQUcsbUJBQUEsY0FBYyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUM7S0FDakM7SUFDRCxTQUFTLElBQUksV0FBVyxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ2hDLE9BQU8sS0FBSyxDQUFDO0FBQ2YsQ0FBQzs7Ozs7Ozs7Ozs7O0FBYUQsTUFBTSxVQUFVLGlCQUFpQixDQUFDLEtBQVk7O1FBQ3hDLFNBQVMsR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDOztRQUN6QixZQUF3QjtJQUM1QixPQUFPLFNBQVMsS0FBSyxJQUFJLElBQUksU0FBUyxDQUFDLElBQUksaUJBQW1CO1FBQ3ZELENBQUMsWUFBWSxHQUFHLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLEtBQUssSUFBSSxFQUFFO1FBQ3hELEtBQUssR0FBRyxZQUFZLENBQUM7UUFDckIsU0FBUyxHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQztLQUMzQjtJQUNELFNBQVMsSUFBSSxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDaEMsT0FBTyxLQUFLLENBQUM7QUFDZixDQUFDOzs7Ozs7Ozs7QUFTRCxNQUFNLFVBQVUsY0FBYyxDQUFDLGVBQTJCOztVQUNsRCxRQUFRLEdBQUcsV0FBVyxDQUFDLGVBQWUsQ0FBQztJQUM3QyxTQUFTO1FBQ0wsYUFBYSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsRUFBRSxzREFBc0QsQ0FBQyxDQUFDO0lBQzdGLE9BQU8sbUJBQUEsUUFBUSxDQUFDLE9BQU8sQ0FBQyxFQUFlLENBQUM7QUFDMUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHthc3NlcnREZWZpbmVkfSBmcm9tICcuLi8uLi91dGlsL2Fzc2VydCc7XG5pbXBvcnQge2Fzc2VydExWaWV3fSBmcm9tICcuLi9hc3NlcnQnO1xuaW1wb3J0IHtUTm9kZVR5cGV9IGZyb20gJy4uL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge2lzTENvbnRhaW5lciwgaXNMVmlld30gZnJvbSAnLi4vaW50ZXJmYWNlcy90eXBlX2NoZWNrcyc7XG5pbXBvcnQge0NPTlRFWFQsIERFQ0xBUkFUSU9OX1ZJRVcsIEZMQUdTLCBMVmlldywgTFZpZXdGbGFncywgUEFSRU5ULCBSb290Q29udGV4dCwgVF9IT1NUfSBmcm9tICcuLi9pbnRlcmZhY2VzL3ZpZXcnO1xuXG5pbXBvcnQge3JlYWRQYXRjaGVkTFZpZXd9IGZyb20gJy4vdmlld191dGlscyc7XG5cblxuXG4vKipcbiAqIEdldHMgdGhlIHBhcmVudCBMVmlldyBvZiB0aGUgcGFzc2VkIExWaWV3LCBpZiB0aGUgUEFSRU5UIGlzIGFuIExDb250YWluZXIsIHdpbGwgZ2V0IHRoZSBwYXJlbnQgb2ZcbiAqIHRoYXQgTENvbnRhaW5lciwgd2hpY2ggaXMgYW4gTFZpZXdcbiAqIEBwYXJhbSBsVmlldyB0aGUgbFZpZXcgd2hvc2UgcGFyZW50IHRvIGdldFxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0TFZpZXdQYXJlbnQobFZpZXc6IExWaWV3KTogTFZpZXd8bnVsbCB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRMVmlldyhsVmlldyk7XG4gIGNvbnN0IHBhcmVudCA9IGxWaWV3W1BBUkVOVF07XG4gIHJldHVybiBpc0xDb250YWluZXIocGFyZW50KSA/IHBhcmVudFtQQVJFTlRdICEgOiBwYXJlbnQ7XG59XG5cbi8qKlxuICogUmV0cmlldmUgdGhlIHJvb3QgdmlldyBmcm9tIGFueSBjb21wb25lbnQgb3IgYExWaWV3YCBieSB3YWxraW5nIHRoZSBwYXJlbnQgYExWaWV3YCB1bnRpbFxuICogcmVhY2hpbmcgdGhlIHJvb3QgYExWaWV3YC5cbiAqXG4gKiBAcGFyYW0gY29tcG9uZW50T3JMVmlldyBhbnkgY29tcG9uZW50IG9yIGBMVmlld2BcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldFJvb3RWaWV3KGNvbXBvbmVudE9yTFZpZXc6IExWaWV3IHwge30pOiBMVmlldyB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKGNvbXBvbmVudE9yTFZpZXcsICdjb21wb25lbnQnKTtcbiAgbGV0IGxWaWV3ID0gaXNMVmlldyhjb21wb25lbnRPckxWaWV3KSA/IGNvbXBvbmVudE9yTFZpZXcgOiByZWFkUGF0Y2hlZExWaWV3KGNvbXBvbmVudE9yTFZpZXcpICE7XG4gIHdoaWxlIChsVmlldyAmJiAhKGxWaWV3W0ZMQUdTXSAmIExWaWV3RmxhZ3MuSXNSb290KSkge1xuICAgIGxWaWV3ID0gZ2V0TFZpZXdQYXJlbnQobFZpZXcpICE7XG4gIH1cbiAgbmdEZXZNb2RlICYmIGFzc2VydExWaWV3KGxWaWV3KTtcbiAgcmV0dXJuIGxWaWV3O1xufVxuXG4vKipcbiAqIEdpdmVuIGFuIGBMVmlld2AsIGZpbmQgdGhlIGNsb3Nlc3QgZGVjbGFyYXRpb24gdmlldyB3aGljaCBpcyBub3QgYW4gZW1iZWRkZWQgdmlldy5cbiAqXG4gKiBUaGlzIG1ldGhvZCBzZWFyY2hlcyBmb3IgdGhlIGBMVmlld2AgYXNzb2NpYXRlZCB3aXRoIHRoZSBjb21wb25lbnQgd2hpY2ggZGVjbGFyZWQgdGhlIGBMVmlld2AuXG4gKlxuICogVGhpcyBmdW5jdGlvbiBtYXkgcmV0dXJuIGl0c2VsZiBpZiB0aGUgYExWaWV3YCBwYXNzZWQgaW4gaXMgbm90IGFuIGVtYmVkZGVkIGBMVmlld2AuIE90aGVyd2lzZVxuICogaXQgd2Fsa3MgdGhlIGRlY2xhcmF0aW9uIHBhcmVudHMgdW50aWwgaXQgZmluZHMgYSBjb21wb25lbnQgdmlldyAobm9uLWVtYmVkZGVkLXZpZXcuKVxuICpcbiAqIEBwYXJhbSBsVmlldyBMVmlldyBmb3Igd2hpY2ggd2Ugd2FudCBhIGhvc3QgZWxlbWVudCBub2RlXG4gKiBAcmV0dXJucyBUaGUgaG9zdCBub2RlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBmaW5kQ29tcG9uZW50VmlldyhsVmlldzogTFZpZXcpOiBMVmlldyB7XG4gIGxldCByb290VE5vZGUgPSBsVmlld1tUX0hPU1RdO1xuICBsZXQgZGVjbGFyZWRWaWV3OiBMVmlld3xudWxsO1xuICB3aGlsZSAocm9vdFROb2RlICE9PSBudWxsICYmIHJvb3RUTm9kZS50eXBlID09PSBUTm9kZVR5cGUuVmlldyAmJlxuICAgICAgICAgKGRlY2xhcmVkVmlldyA9IGxWaWV3W0RFQ0xBUkFUSU9OX1ZJRVddKSAhPT0gbnVsbCkge1xuICAgIGxWaWV3ID0gZGVjbGFyZWRWaWV3O1xuICAgIHJvb3RUTm9kZSA9IGxWaWV3W1RfSE9TVF07XG4gIH1cbiAgbmdEZXZNb2RlICYmIGFzc2VydExWaWV3KGxWaWV3KTtcbiAgcmV0dXJuIGxWaWV3O1xufVxuXG4vKipcbiAqIFJldHVybnMgdGhlIGBSb290Q29udGV4dGAgaW5zdGFuY2UgdGhhdCBpcyBhc3NvY2lhdGVkIHdpdGhcbiAqIHRoZSBhcHBsaWNhdGlvbiB3aGVyZSB0aGUgdGFyZ2V0IGlzIHNpdHVhdGVkLiBJdCBkb2VzIHRoaXMgYnkgd2Fsa2luZyB0aGUgcGFyZW50IHZpZXdzIHVudGlsIGl0XG4gKiBnZXRzIHRvIHRoZSByb290IHZpZXcsIHRoZW4gZ2V0dGluZyB0aGUgY29udGV4dCBvZmYgb2YgdGhhdC5cbiAqXG4gKiBAcGFyYW0gdmlld09yQ29tcG9uZW50IHRoZSBgTFZpZXdgIG9yIGNvbXBvbmVudCB0byBnZXQgdGhlIHJvb3QgY29udGV4dCBmb3IuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRSb290Q29udGV4dCh2aWV3T3JDb21wb25lbnQ6IExWaWV3IHwge30pOiBSb290Q29udGV4dCB7XG4gIGNvbnN0IHJvb3RWaWV3ID0gZ2V0Um9vdFZpZXcodmlld09yQ29tcG9uZW50KTtcbiAgbmdEZXZNb2RlICYmXG4gICAgICBhc3NlcnREZWZpbmVkKHJvb3RWaWV3W0NPTlRFWFRdLCAnUm9vdFZpZXcgaGFzIG5vIGNvbnRleHQuIFBlcmhhcHMgaXQgaXMgZGlzY29ubmVjdGVkPycpO1xuICByZXR1cm4gcm9vdFZpZXdbQ09OVEVYVF0gYXMgUm9vdENvbnRleHQ7XG59XG4iXX0=