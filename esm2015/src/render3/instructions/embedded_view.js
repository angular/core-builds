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
import { assertDefined, assertEqual } from '../../util/assert';
import { assertLContainerOrUndefined } from '../assert';
import { ACTIVE_INDEX, CONTAINER_HEADER_OFFSET } from '../interfaces/container';
import { FLAGS, PARENT, QUERIES, TVIEW, T_HOST } from '../interfaces/view';
import { assertNodeType } from '../node_assert';
import { insertView, removeView } from '../node_manipulation';
import { enterView, getIsParent, getLView, getPreviousOrParentTNode, isCreationMode, leaveView, setIsParent, setPreviousOrParentTNode } from '../state';
import { resetPreOrderHookFlags } from '../util/view_utils';
import { assignTViewNodeToLView, createLView, createTView, refreshDescendantViews } from './shared';
/**
 * Marks the start of an embedded view.
 *
 * \@codeGenApi
 * @param {?} viewBlockId The ID of this view
 * @param {?} consts
 * @param {?} vars
 * @return {?} boolean Whether or not this view is in creation mode
 *
 */
export function ɵɵembeddedViewStart(viewBlockId, consts, vars) {
    /** @type {?} */
    const lView = getLView();
    /** @type {?} */
    const previousOrParentTNode = getPreviousOrParentTNode();
    // The previous node can be a view node if we are processing an inline for loop
    /** @type {?} */
    const containerTNode = previousOrParentTNode.type === 2 /* View */ ?
        (/** @type {?} */ (previousOrParentTNode.parent)) :
        previousOrParentTNode;
    /** @type {?} */
    const lContainer = (/** @type {?} */ (lView[containerTNode.index]));
    ngDevMode && assertNodeType(containerTNode, 0 /* Container */);
    /** @type {?} */
    let viewToRender = scanForView(lContainer, (/** @type {?} */ (lContainer[ACTIVE_INDEX])), viewBlockId);
    if (viewToRender) {
        setIsParent();
        enterView(viewToRender, viewToRender[TVIEW].node);
    }
    else {
        // When we create a new LView, we always reset the state of the instructions.
        viewToRender = createLView(lView, getOrCreateEmbeddedTView(viewBlockId, consts, vars, (/** @type {?} */ (containerTNode))), null, 16 /* CheckAlways */, null, null);
        if (lContainer[QUERIES]) {
            viewToRender[QUERIES] = (/** @type {?} */ (lContainer[QUERIES])).createView();
        }
        /** @type {?} */
        const tParentNode = getIsParent() ? previousOrParentTNode :
            previousOrParentTNode && previousOrParentTNode.parent;
        assignTViewNodeToLView(viewToRender[TVIEW], tParentNode, viewBlockId, viewToRender);
        enterView(viewToRender, viewToRender[TVIEW].node);
    }
    if (lContainer) {
        if (isCreationMode(viewToRender)) {
            // it is a new view, insert it into collection of views for a given container
            insertView(viewToRender, lContainer, (/** @type {?} */ (lContainer[ACTIVE_INDEX])));
        }
        (/** @type {?} */ (lContainer[ACTIVE_INDEX]))++;
    }
    return isCreationMode(viewToRender) ? 1 /* Create */ | 2 /* Update */ :
        2 /* Update */;
}
/**
 * Initialize the TView (e.g. static data) for the active embedded view.
 *
 * Each embedded view block must create or retrieve its own TView. Otherwise, the embedded view's
 * static data for a particular node would overwrite the static data for a node in the view above
 * it with the same index (since it's in the same template).
 *
 * @param {?} viewIndex The index of the TView in TNode.tViews
 * @param {?} consts The number of nodes, local refs, and pipes in this template
 * @param {?} vars The number of bindings and pure function bindings in this template
 * @param {?} parent
 * @return {?} TView
 */
function getOrCreateEmbeddedTView(viewIndex, consts, vars, parent) {
    /** @type {?} */
    const tView = getLView()[TVIEW];
    ngDevMode && assertNodeType(parent, 0 /* Container */);
    /** @type {?} */
    const containerTViews = (/** @type {?} */ (parent.tViews));
    ngDevMode && assertDefined(containerTViews, 'TView expected');
    ngDevMode && assertEqual(Array.isArray(containerTViews), true, 'TViews should be in an array');
    if (viewIndex >= containerTViews.length || containerTViews[viewIndex] == null) {
        containerTViews[viewIndex] = createTView(viewIndex, null, consts, vars, tView.directiveRegistry, tView.pipeRegistry, null, null);
    }
    return containerTViews[viewIndex];
}
/**
 * Looks for a view with a given view block id inside a provided LContainer.
 * Removes views that need to be deleted in the process.
 *
 * @param {?} lContainer to search for views
 * @param {?} startIdx starting index in the views array to search from
 * @param {?} viewBlockId exact view block id to look for
 * @return {?}
 */
function scanForView(lContainer, startIdx, viewBlockId) {
    for (let i = startIdx + CONTAINER_HEADER_OFFSET; i < lContainer.length; i++) {
        /** @type {?} */
        const viewAtPositionId = lContainer[i][TVIEW].id;
        if (viewAtPositionId === viewBlockId) {
            return lContainer[i];
        }
        else if (viewAtPositionId < viewBlockId) {
            // found a view that should not be at this position - remove
            removeView(lContainer, i - CONTAINER_HEADER_OFFSET);
        }
        else {
            // found a view with id greater than the one we are searching for
            // which means that required view doesn't exist and can't be found at
            // later positions in the views array - stop the searchdef.cont here
            break;
        }
    }
    return null;
}
/**
 * Marks the end of an embedded view.
 *
 * \@codeGenApi
 * @return {?}
 */
export function ɵɵembeddedViewEnd() {
    /** @type {?} */
    const lView = getLView();
    /** @type {?} */
    const viewHost = lView[T_HOST];
    if (isCreationMode(lView)) {
        refreshDescendantViews(lView); // creation mode pass
        lView[FLAGS] &= ~4 /* CreationMode */;
    }
    resetPreOrderHookFlags(lView);
    refreshDescendantViews(lView); // update mode pass
    // update mode pass
    /** @type {?} */
    const lContainer = (/** @type {?} */ (lView[PARENT]));
    ngDevMode && assertLContainerOrUndefined(lContainer);
    // It's always safe to run hooks here, as `leaveView` is not called during the 'finally' block
    // of a try-catch-finally statement, so it can never be reached while unwinding the stack due to
    // an error being thrown.
    leaveView((/** @type {?} */ (lContainer[PARENT])), /* safeToRunHooks */ true);
    setPreviousOrParentTNode((/** @type {?} */ (viewHost)), false);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW1iZWRkZWRfdmlldy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvaW5zdHJ1Y3Rpb25zL2VtYmVkZGVkX3ZpZXcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFRQSxPQUFPLEVBQUMsYUFBYSxFQUFFLFdBQVcsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQzdELE9BQU8sRUFBQywyQkFBMkIsRUFBQyxNQUFNLFdBQVcsQ0FBQztBQUN0RCxPQUFPLEVBQUMsWUFBWSxFQUFFLHVCQUF1QixFQUFhLE1BQU0seUJBQXlCLENBQUM7QUFHMUYsT0FBTyxFQUFDLEtBQUssRUFBcUIsTUFBTSxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQVMsTUFBTSxFQUFDLE1BQU0sb0JBQW9CLENBQUM7QUFDbkcsT0FBTyxFQUFDLGNBQWMsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBQzlDLE9BQU8sRUFBQyxVQUFVLEVBQUUsVUFBVSxFQUFDLE1BQU0sc0JBQXNCLENBQUM7QUFDNUQsT0FBTyxFQUFDLFNBQVMsRUFBRSxXQUFXLEVBQUUsUUFBUSxFQUFFLHdCQUF3QixFQUFFLGNBQWMsRUFBRSxTQUFTLEVBQUUsV0FBVyxFQUFFLHdCQUF3QixFQUFDLE1BQU0sVUFBVSxDQUFDO0FBQ3RKLE9BQU8sRUFBQyxzQkFBc0IsRUFBQyxNQUFNLG9CQUFvQixDQUFDO0FBQzFELE9BQU8sRUFBQyxzQkFBc0IsRUFBRSxXQUFXLEVBQUUsV0FBVyxFQUFFLHNCQUFzQixFQUFDLE1BQU0sVUFBVSxDQUFDOzs7Ozs7Ozs7OztBQVVsRyxNQUFNLFVBQVUsbUJBQW1CLENBQy9CLFdBQW1CLEVBQUUsTUFBYyxFQUFFLElBQVk7O1VBQzdDLEtBQUssR0FBRyxRQUFRLEVBQUU7O1VBQ2xCLHFCQUFxQixHQUFHLHdCQUF3QixFQUFFOzs7VUFFbEQsY0FBYyxHQUFHLHFCQUFxQixDQUFD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RjtJQUM5RixnR0FBZ0c7SUFDaEcseUJBQXlCO0lBQ3pCLFNBQVMsQ0FBQyxtQkFBQSxVQUFVLENBQUMsTUFBTSxDQUFDLEVBQUUsRUFBRSxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUMzRCx3QkFBd0IsQ0FBQyxtQkFBQSxRQUFRLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztBQUM5QyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge2Fzc2VydERlZmluZWQsIGFzc2VydEVxdWFsfSBmcm9tICcuLi8uLi91dGlsL2Fzc2VydCc7XG5pbXBvcnQge2Fzc2VydExDb250YWluZXJPclVuZGVmaW5lZH0gZnJvbSAnLi4vYXNzZXJ0JztcbmltcG9ydCB7QUNUSVZFX0lOREVYLCBDT05UQUlORVJfSEVBREVSX09GRlNFVCwgTENvbnRhaW5lcn0gZnJvbSAnLi4vaW50ZXJmYWNlcy9jb250YWluZXInO1xuaW1wb3J0IHtSZW5kZXJGbGFnc30gZnJvbSAnLi4vaW50ZXJmYWNlcy9kZWZpbml0aW9uJztcbmltcG9ydCB7VENvbnRhaW5lck5vZGUsIFROb2RlVHlwZX0gZnJvbSAnLi4vaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB7RkxBR1MsIExWaWV3LCBMVmlld0ZsYWdzLCBQQVJFTlQsIFFVRVJJRVMsIFRWSUVXLCBUVmlldywgVF9IT1NUfSBmcm9tICcuLi9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHthc3NlcnROb2RlVHlwZX0gZnJvbSAnLi4vbm9kZV9hc3NlcnQnO1xuaW1wb3J0IHtpbnNlcnRWaWV3LCByZW1vdmVWaWV3fSBmcm9tICcuLi9ub2RlX21hbmlwdWxhdGlvbic7XG5pbXBvcnQge2VudGVyVmlldywgZ2V0SXNQYXJlbnQsIGdldExWaWV3LCBnZXRQcmV2aW91c09yUGFyZW50VE5vZGUsIGlzQ3JlYXRpb25Nb2RlLCBsZWF2ZVZpZXcsIHNldElzUGFyZW50LCBzZXRQcmV2aW91c09yUGFyZW50VE5vZGV9IGZyb20gJy4uL3N0YXRlJztcbmltcG9ydCB7cmVzZXRQcmVPcmRlckhvb2tGbGFnc30gZnJvbSAnLi4vdXRpbC92aWV3X3V0aWxzJztcbmltcG9ydCB7YXNzaWduVFZpZXdOb2RlVG9MVmlldywgY3JlYXRlTFZpZXcsIGNyZWF0ZVRWaWV3LCByZWZyZXNoRGVzY2VuZGFudFZpZXdzfSBmcm9tICcuL3NoYXJlZCc7XG5cbi8qKlxuICogTWFya3MgdGhlIHN0YXJ0IG9mIGFuIGVtYmVkZGVkIHZpZXcuXG4gKlxuICogQHBhcmFtIHZpZXdCbG9ja0lkIFRoZSBJRCBvZiB0aGlzIHZpZXdcbiAqIEByZXR1cm4gYm9vbGVhbiBXaGV0aGVyIG9yIG5vdCB0aGlzIHZpZXcgaXMgaW4gY3JlYXRpb24gbW9kZVxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1ZW1iZWRkZWRWaWV3U3RhcnQoXG4gICAgdmlld0Jsb2NrSWQ6IG51bWJlciwgY29uc3RzOiBudW1iZXIsIHZhcnM6IG51bWJlcik6IFJlbmRlckZsYWdzIHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCBwcmV2aW91c09yUGFyZW50VE5vZGUgPSBnZXRQcmV2aW91c09yUGFyZW50VE5vZGUoKTtcbiAgLy8gVGhlIHByZXZpb3VzIG5vZGUgY2FuIGJlIGEgdmlldyBub2RlIGlmIHdlIGFyZSBwcm9jZXNzaW5nIGFuIGlubGluZSBmb3IgbG9vcFxuICBjb25zdCBjb250YWluZXJUTm9kZSA9IHByZXZpb3VzT3JQYXJlbnRUTm9kZS50eXBlID09PSBUTm9kZVR5cGUuVmlldyA/XG4gICAgICBwcmV2aW91c09yUGFyZW50VE5vZGUucGFyZW50ICEgOlxuICAgICAgcHJldmlvdXNPclBhcmVudFROb2RlO1xuICBjb25zdCBsQ29udGFpbmVyID0gbFZpZXdbY29udGFpbmVyVE5vZGUuaW5kZXhdIGFzIExDb250YWluZXI7XG5cbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vZGVUeXBlKGNvbnRhaW5lclROb2RlLCBUTm9kZVR5cGUuQ29udGFpbmVyKTtcbiAgbGV0IHZpZXdUb1JlbmRlciA9IHNjYW5Gb3JWaWV3KGxDb250YWluZXIsIGxDb250YWluZXJbQUNUSVZFX0lOREVYXSAhLCB2aWV3QmxvY2tJZCk7XG5cbiAgaWYgKHZpZXdUb1JlbmRlcikge1xuICAgIHNldElzUGFyZW50KCk7XG4gICAgZW50ZXJWaWV3KHZpZXdUb1JlbmRlciwgdmlld1RvUmVuZGVyW1RWSUVXXS5ub2RlKTtcbiAgfSBlbHNlIHtcbiAgICAvLyBXaGVuIHdlIGNyZWF0ZSBhIG5ldyBMVmlldywgd2UgYWx3YXlzIHJlc2V0IHRoZSBzdGF0ZSBvZiB0aGUgaW5zdHJ1Y3Rpb25zLlxuICAgIHZpZXdUb1JlbmRlciA9IGNyZWF0ZUxWaWV3KFxuICAgICAgICBsVmlldyxcbiAgICAgICAgZ2V0T3JDcmVhdGVFbWJlZGRlZFRWaWV3KHZpZXdCbG9ja0lkLCBjb25zdHMsIHZhcnMsIGNvbnRhaW5lclROb2RlIGFzIFRDb250YWluZXJOb2RlKSwgbnVsbCxcbiAgICAgICAgTFZpZXdGbGFncy5DaGVja0Fsd2F5cywgbnVsbCwgbnVsbCk7XG5cbiAgICBpZiAobENvbnRhaW5lcltRVUVSSUVTXSkge1xuICAgICAgdmlld1RvUmVuZGVyW1FVRVJJRVNdID0gbENvbnRhaW5lcltRVUVSSUVTXSAhLmNyZWF0ZVZpZXcoKTtcbiAgICB9XG5cbiAgICBjb25zdCB0UGFyZW50Tm9kZSA9IGdldElzUGFyZW50KCkgPyBwcmV2aW91c09yUGFyZW50VE5vZGUgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByZXZpb3VzT3JQYXJlbnRUTm9kZSAmJiBwcmV2aW91c09yUGFyZW50VE5vZGUucGFyZW50O1xuICAgIGFzc2lnblRWaWV3Tm9kZVRvTFZpZXcodmlld1RvUmVuZGVyW1RWSUVXXSwgdFBhcmVudE5vZGUsIHZpZXdCbG9ja0lkLCB2aWV3VG9SZW5kZXIpO1xuICAgIGVudGVyVmlldyh2aWV3VG9SZW5kZXIsIHZpZXdUb1JlbmRlcltUVklFV10ubm9kZSk7XG4gIH1cbiAgaWYgKGxDb250YWluZXIpIHtcbiAgICBpZiAoaXNDcmVhdGlvbk1vZGUodmlld1RvUmVuZGVyKSkge1xuICAgICAgLy8gaXQgaXMgYSBuZXcgdmlldywgaW5zZXJ0IGl0IGludG8gY29sbGVjdGlvbiBvZiB2aWV3cyBmb3IgYSBnaXZlbiBjb250YWluZXJcbiAgICAgIGluc2VydFZpZXcodmlld1RvUmVuZGVyLCBsQ29udGFpbmVyLCBsQ29udGFpbmVyW0FDVElWRV9JTkRFWF0gISk7XG4gICAgfVxuICAgIGxDb250YWluZXJbQUNUSVZFX0lOREVYXSAhKys7XG4gIH1cbiAgcmV0dXJuIGlzQ3JlYXRpb25Nb2RlKHZpZXdUb1JlbmRlcikgPyBSZW5kZXJGbGFncy5DcmVhdGUgfCBSZW5kZXJGbGFncy5VcGRhdGUgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFJlbmRlckZsYWdzLlVwZGF0ZTtcbn1cblxuLyoqXG4gKiBJbml0aWFsaXplIHRoZSBUVmlldyAoZS5nLiBzdGF0aWMgZGF0YSkgZm9yIHRoZSBhY3RpdmUgZW1iZWRkZWQgdmlldy5cbiAqXG4gKiBFYWNoIGVtYmVkZGVkIHZpZXcgYmxvY2sgbXVzdCBjcmVhdGUgb3IgcmV0cmlldmUgaXRzIG93biBUVmlldy4gT3RoZXJ3aXNlLCB0aGUgZW1iZWRkZWQgdmlldydzXG4gKiBzdGF0aWMgZGF0YSBmb3IgYSBwYXJ0aWN1bGFyIG5vZGUgd291bGQgb3ZlcndyaXRlIHRoZSBzdGF0aWMgZGF0YSBmb3IgYSBub2RlIGluIHRoZSB2aWV3IGFib3ZlXG4gKiBpdCB3aXRoIHRoZSBzYW1lIGluZGV4IChzaW5jZSBpdCdzIGluIHRoZSBzYW1lIHRlbXBsYXRlKS5cbiAqXG4gKiBAcGFyYW0gdmlld0luZGV4IFRoZSBpbmRleCBvZiB0aGUgVFZpZXcgaW4gVE5vZGUudFZpZXdzXG4gKiBAcGFyYW0gY29uc3RzIFRoZSBudW1iZXIgb2Ygbm9kZXMsIGxvY2FsIHJlZnMsIGFuZCBwaXBlcyBpbiB0aGlzIHRlbXBsYXRlXG4gKiBAcGFyYW0gdmFycyBUaGUgbnVtYmVyIG9mIGJpbmRpbmdzIGFuZCBwdXJlIGZ1bmN0aW9uIGJpbmRpbmdzIGluIHRoaXMgdGVtcGxhdGVcbiAqIEBwYXJhbSBjb250YWluZXIgVGhlIHBhcmVudCBjb250YWluZXIgaW4gd2hpY2ggdG8gbG9vayBmb3IgdGhlIHZpZXcncyBzdGF0aWMgZGF0YVxuICogQHJldHVybnMgVFZpZXdcbiAqL1xuZnVuY3Rpb24gZ2V0T3JDcmVhdGVFbWJlZGRlZFRWaWV3KFxuICAgIHZpZXdJbmRleDogbnVtYmVyLCBjb25zdHM6IG51bWJlciwgdmFyczogbnVtYmVyLCBwYXJlbnQ6IFRDb250YWluZXJOb2RlKTogVFZpZXcge1xuICBjb25zdCB0VmlldyA9IGdldExWaWV3KClbVFZJRVddO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm9kZVR5cGUocGFyZW50LCBUTm9kZVR5cGUuQ29udGFpbmVyKTtcbiAgY29uc3QgY29udGFpbmVyVFZpZXdzID0gcGFyZW50LnRWaWV3cyBhcyBUVmlld1tdO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChjb250YWluZXJUVmlld3MsICdUVmlldyBleHBlY3RlZCcpO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RXF1YWwoQXJyYXkuaXNBcnJheShjb250YWluZXJUVmlld3MpLCB0cnVlLCAnVFZpZXdzIHNob3VsZCBiZSBpbiBhbiBhcnJheScpO1xuICBpZiAodmlld0luZGV4ID49IGNvbnRhaW5lclRWaWV3cy5sZW5ndGggfHwgY29udGFpbmVyVFZpZXdzW3ZpZXdJbmRleF0gPT0gbnVsbCkge1xuICAgIGNvbnRhaW5lclRWaWV3c1t2aWV3SW5kZXhdID0gY3JlYXRlVFZpZXcoXG4gICAgICAgIHZpZXdJbmRleCwgbnVsbCwgY29uc3RzLCB2YXJzLCB0Vmlldy5kaXJlY3RpdmVSZWdpc3RyeSwgdFZpZXcucGlwZVJlZ2lzdHJ5LCBudWxsLCBudWxsKTtcbiAgfVxuICByZXR1cm4gY29udGFpbmVyVFZpZXdzW3ZpZXdJbmRleF07XG59XG5cblxuLyoqXG4gKiBMb29rcyBmb3IgYSB2aWV3IHdpdGggYSBnaXZlbiB2aWV3IGJsb2NrIGlkIGluc2lkZSBhIHByb3ZpZGVkIExDb250YWluZXIuXG4gKiBSZW1vdmVzIHZpZXdzIHRoYXQgbmVlZCB0byBiZSBkZWxldGVkIGluIHRoZSBwcm9jZXNzLlxuICpcbiAqIEBwYXJhbSBsQ29udGFpbmVyIHRvIHNlYXJjaCBmb3Igdmlld3NcbiAqIEBwYXJhbSBzdGFydElkeCBzdGFydGluZyBpbmRleCBpbiB0aGUgdmlld3MgYXJyYXkgdG8gc2VhcmNoIGZyb21cbiAqIEBwYXJhbSB2aWV3QmxvY2tJZCBleGFjdCB2aWV3IGJsb2NrIGlkIHRvIGxvb2sgZm9yXG4gKi9cbmZ1bmN0aW9uIHNjYW5Gb3JWaWV3KGxDb250YWluZXI6IExDb250YWluZXIsIHN0YXJ0SWR4OiBudW1iZXIsIHZpZXdCbG9ja0lkOiBudW1iZXIpOiBMVmlld3xudWxsIHtcbiAgZm9yIChsZXQgaSA9IHN0YXJ0SWR4ICsgQ09OVEFJTkVSX0hFQURFUl9PRkZTRVQ7IGkgPCBsQ29udGFpbmVyLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3Qgdmlld0F0UG9zaXRpb25JZCA9IGxDb250YWluZXJbaV1bVFZJRVddLmlkO1xuICAgIGlmICh2aWV3QXRQb3NpdGlvbklkID09PSB2aWV3QmxvY2tJZCkge1xuICAgICAgcmV0dXJuIGxDb250YWluZXJbaV07XG4gICAgfSBlbHNlIGlmICh2aWV3QXRQb3NpdGlvbklkIDwgdmlld0Jsb2NrSWQpIHtcbiAgICAgIC8vIGZvdW5kIGEgdmlldyB0aGF0IHNob3VsZCBub3QgYmUgYXQgdGhpcyBwb3NpdGlvbiAtIHJlbW92ZVxuICAgICAgcmVtb3ZlVmlldyhsQ29udGFpbmVyLCBpIC0gQ09OVEFJTkVSX0hFQURFUl9PRkZTRVQpO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBmb3VuZCBhIHZpZXcgd2l0aCBpZCBncmVhdGVyIHRoYW4gdGhlIG9uZSB3ZSBhcmUgc2VhcmNoaW5nIGZvclxuICAgICAgLy8gd2hpY2ggbWVhbnMgdGhhdCByZXF1aXJlZCB2aWV3IGRvZXNuJ3QgZXhpc3QgYW5kIGNhbid0IGJlIGZvdW5kIGF0XG4gICAgICAvLyBsYXRlciBwb3NpdGlvbnMgaW4gdGhlIHZpZXdzIGFycmF5IC0gc3RvcCB0aGUgc2VhcmNoZGVmLmNvbnQgaGVyZVxuICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG4vKipcbiAqIE1hcmtzIHRoZSBlbmQgb2YgYW4gZW1iZWRkZWQgdmlldy5cbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWVtYmVkZGVkVmlld0VuZCgpOiB2b2lkIHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCB2aWV3SG9zdCA9IGxWaWV3W1RfSE9TVF07XG5cbiAgaWYgKGlzQ3JlYXRpb25Nb2RlKGxWaWV3KSkge1xuICAgIHJlZnJlc2hEZXNjZW5kYW50Vmlld3MobFZpZXcpOyAgLy8gY3JlYXRpb24gbW9kZSBwYXNzXG4gICAgbFZpZXdbRkxBR1NdICY9IH5MVmlld0ZsYWdzLkNyZWF0aW9uTW9kZTtcbiAgfVxuICByZXNldFByZU9yZGVySG9va0ZsYWdzKGxWaWV3KTtcbiAgcmVmcmVzaERlc2NlbmRhbnRWaWV3cyhsVmlldyk7ICAvLyB1cGRhdGUgbW9kZSBwYXNzXG4gIGNvbnN0IGxDb250YWluZXIgPSBsVmlld1tQQVJFTlRdIGFzIExDb250YWluZXI7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRMQ29udGFpbmVyT3JVbmRlZmluZWQobENvbnRhaW5lcik7XG4gIC8vIEl0J3MgYWx3YXlzIHNhZmUgdG8gcnVuIGhvb2tzIGhlcmUsIGFzIGBsZWF2ZVZpZXdgIGlzIG5vdCBjYWxsZWQgZHVyaW5nIHRoZSAnZmluYWxseScgYmxvY2tcbiAgLy8gb2YgYSB0cnktY2F0Y2gtZmluYWxseSBzdGF0ZW1lbnQsIHNvIGl0IGNhbiBuZXZlciBiZSByZWFjaGVkIHdoaWxlIHVud2luZGluZyB0aGUgc3RhY2sgZHVlIHRvXG4gIC8vIGFuIGVycm9yIGJlaW5nIHRocm93bi5cbiAgbGVhdmVWaWV3KGxDb250YWluZXJbUEFSRU5UXSAhLCAvKiBzYWZlVG9SdW5Ib29rcyAqLyB0cnVlKTtcbiAgc2V0UHJldmlvdXNPclBhcmVudFROb2RlKHZpZXdIb3N0ICEsIGZhbHNlKTtcbn1cbiJdfQ==