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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlld190cmF2ZXJzYWxfdXRpbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL3V0aWwvdmlld190cmF2ZXJzYWxfdXRpbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFRQSxPQUFPLEVBQUMsYUFBYSxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDaEQsT0FBTyxFQUFDLFdBQVcsRUFBQyxNQUFNLFdBQVcsQ0FBQztBQUN0QyxPQUFPLEVBQUMsWUFBWSxFQUFFLE9BQU8sRUFBQyxNQUFNLDJCQUEyQixDQUFDO0FBQ2hFLE9BQU8sRUFBQyxPQUFPLEVBQUUsS0FBSyxFQUFxQixNQUFNLEVBQWMsTUFBTSxvQkFBb0IsQ0FBQztBQUMxRixPQUFPLEVBQUMsZ0JBQWdCLEVBQUMsTUFBTSxjQUFjLENBQUM7Ozs7Ozs7QUFROUMsTUFBTSxVQUFVLGNBQWMsQ0FBQyxLQUFZO0lBQ3pDLFNBQVMsSUFBSSxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUM7O1VBQzFCLE1BQU0sR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDO0lBQzVCLE9BQU8sWUFBWSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxtQkFBQSxNQUFNLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDO0FBQzFELENBQUM7Ozs7Ozs7O0FBUUQsTUFBTSxVQUFVLFdBQVcsQ0FBQyxnQkFBNEI7SUFDdEQsU0FBUyxJQUFJLGFBQWEsQ0FBQyxnQkFBZ0IsRUFBRSxXQUFXLENBQUMsQ0FBQzs7UUFDdEQsS0FBSyxHQUFHLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsbUJBQUEsZ0JBQWdCLENBQUMsZ0JBQWdCLENBQUMsRUFBRTtJQUMvRixPQUFPLEtBQUssSUFBSSxDQUFDLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxtQkFBb0IsQ0FBQyxFQUFFO1FBQ25ELEtBQUssR0FBRyxtQkFBQSxjQUFjLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQztLQUNqQztJQUNELFNBQVMsSUFBSSxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDaEMsT0FBTyxLQUFLLENBQUM7QUFDZixDQUFDOzs7Ozs7Ozs7QUFTRCxNQUFNLFVBQVUsY0FBYyxDQUFDLGVBQTJCOztVQUNsRCxRQUFRLEdBQUcsV0FBVyxDQUFDLGVBQWUsQ0FBQztJQUM3QyxTQUFTO1FBQ0wsYUFBYSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsRUFBRSxzREFBc0QsQ0FBQyxDQUFDO0lBQzdGLE9BQU8sbUJBQUEsUUFBUSxDQUFDLE9BQU8sQ0FBQyxFQUFlLENBQUM7QUFDMUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHthc3NlcnREZWZpbmVkfSBmcm9tICcuLi8uLi91dGlsL2Fzc2VydCc7XG5pbXBvcnQge2Fzc2VydExWaWV3fSBmcm9tICcuLi9hc3NlcnQnO1xuaW1wb3J0IHtpc0xDb250YWluZXIsIGlzTFZpZXd9IGZyb20gJy4uL2ludGVyZmFjZXMvdHlwZV9jaGVja3MnO1xuaW1wb3J0IHtDT05URVhULCBGTEFHUywgTFZpZXcsIExWaWV3RmxhZ3MsIFBBUkVOVCwgUm9vdENvbnRleHR9IGZyb20gJy4uL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge3JlYWRQYXRjaGVkTFZpZXd9IGZyb20gJy4vdmlld191dGlscyc7XG5cblxuLyoqXG4gKiBHZXRzIHRoZSBwYXJlbnQgTFZpZXcgb2YgdGhlIHBhc3NlZCBMVmlldywgaWYgdGhlIFBBUkVOVCBpcyBhbiBMQ29udGFpbmVyLCB3aWxsIGdldCB0aGUgcGFyZW50IG9mXG4gKiB0aGF0IExDb250YWluZXIsIHdoaWNoIGlzIGFuIExWaWV3XG4gKiBAcGFyYW0gbFZpZXcgdGhlIGxWaWV3IHdob3NlIHBhcmVudCB0byBnZXRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldExWaWV3UGFyZW50KGxWaWV3OiBMVmlldyk6IExWaWV3fG51bGwge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0TFZpZXcobFZpZXcpO1xuICBjb25zdCBwYXJlbnQgPSBsVmlld1tQQVJFTlRdO1xuICByZXR1cm4gaXNMQ29udGFpbmVyKHBhcmVudCkgPyBwYXJlbnRbUEFSRU5UXSAhIDogcGFyZW50O1xufVxuXG4vKipcbiAqIFJldHJpZXZlIHRoZSByb290IHZpZXcgZnJvbSBhbnkgY29tcG9uZW50IG9yIGBMVmlld2AgYnkgd2Fsa2luZyB0aGUgcGFyZW50IGBMVmlld2AgdW50aWxcbiAqIHJlYWNoaW5nIHRoZSByb290IGBMVmlld2AuXG4gKlxuICogQHBhcmFtIGNvbXBvbmVudE9yTFZpZXcgYW55IGNvbXBvbmVudCBvciBgTFZpZXdgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRSb290Vmlldyhjb21wb25lbnRPckxWaWV3OiBMVmlldyB8IHt9KTogTFZpZXcge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChjb21wb25lbnRPckxWaWV3LCAnY29tcG9uZW50Jyk7XG4gIGxldCBsVmlldyA9IGlzTFZpZXcoY29tcG9uZW50T3JMVmlldykgPyBjb21wb25lbnRPckxWaWV3IDogcmVhZFBhdGNoZWRMVmlldyhjb21wb25lbnRPckxWaWV3KSAhO1xuICB3aGlsZSAobFZpZXcgJiYgIShsVmlld1tGTEFHU10gJiBMVmlld0ZsYWdzLklzUm9vdCkpIHtcbiAgICBsVmlldyA9IGdldExWaWV3UGFyZW50KGxWaWV3KSAhO1xuICB9XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRMVmlldyhsVmlldyk7XG4gIHJldHVybiBsVmlldztcbn1cblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBgUm9vdENvbnRleHRgIGluc3RhbmNlIHRoYXQgaXMgYXNzb2NpYXRlZCB3aXRoXG4gKiB0aGUgYXBwbGljYXRpb24gd2hlcmUgdGhlIHRhcmdldCBpcyBzaXR1YXRlZC4gSXQgZG9lcyB0aGlzIGJ5IHdhbGtpbmcgdGhlIHBhcmVudCB2aWV3cyB1bnRpbCBpdFxuICogZ2V0cyB0byB0aGUgcm9vdCB2aWV3LCB0aGVuIGdldHRpbmcgdGhlIGNvbnRleHQgb2ZmIG9mIHRoYXQuXG4gKlxuICogQHBhcmFtIHZpZXdPckNvbXBvbmVudCB0aGUgYExWaWV3YCBvciBjb21wb25lbnQgdG8gZ2V0IHRoZSByb290IGNvbnRleHQgZm9yLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0Um9vdENvbnRleHQodmlld09yQ29tcG9uZW50OiBMVmlldyB8IHt9KTogUm9vdENvbnRleHQge1xuICBjb25zdCByb290VmlldyA9IGdldFJvb3RWaWV3KHZpZXdPckNvbXBvbmVudCk7XG4gIG5nRGV2TW9kZSAmJlxuICAgICAgYXNzZXJ0RGVmaW5lZChyb290Vmlld1tDT05URVhUXSwgJ1Jvb3RWaWV3IGhhcyBubyBjb250ZXh0LiBQZXJoYXBzIGl0IGlzIGRpc2Nvbm5lY3RlZD8nKTtcbiAgcmV0dXJuIHJvb3RWaWV3W0NPTlRFWFRdIGFzIFJvb3RDb250ZXh0O1xufVxuIl19