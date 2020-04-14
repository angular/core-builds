/**
 * @fileoverview added by tsickle
 * Generated from: packages/core/src/render3/instructions/embedded_view.ts
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
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
import { CONTEXT, PARENT, T_HOST, TVIEW } from '../interfaces/view';
import { assertNodeType } from '../node_assert';
import { insertView, removeView } from '../node_manipulation';
import { enterView, getIsParent, getLView, getPreviousOrParentTNode, getTView, leaveView, setIsParent, setPreviousOrParentTNode } from '../state';
import { getLContainerActiveIndex, isCreationMode } from '../util/view_utils';
import { assignTViewNodeToLView, createLView, createTView, refreshView, renderView } from './shared';
/**
 * Marks the start of an embedded view.
 *
 * \@codeGenApi
 * @param {?} viewBlockId The ID of this view
 * @param {?} decls
 * @param {?} vars
 * @return {?} boolean Whether or not this view is in creation mode
 *
 */
export function ɵɵembeddedViewStart(viewBlockId, decls, vars) {
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
    let viewToRender = scanForView(lContainer, getLContainerActiveIndex(lContainer), viewBlockId);
    if (viewToRender) {
        setIsParent();
        enterView(viewToRender, viewToRender[TVIEW].node);
    }
    else {
        // When we create a new LView, we always reset the state of the instructions.
        viewToRender = createLView(lView, getOrCreateEmbeddedTView(viewBlockId, decls, vars, (/** @type {?} */ (containerTNode))), null, 16 /* CheckAlways */, null, null);
        /** @type {?} */
        const tParentNode = getIsParent() ? previousOrParentTNode :
            previousOrParentTNode && previousOrParentTNode.parent;
        assignTViewNodeToLView(viewToRender[TVIEW], tParentNode, viewBlockId, viewToRender);
        enterView(viewToRender, viewToRender[TVIEW].node);
    }
    if (lContainer) {
        if (isCreationMode(viewToRender)) {
            // it is a new view, insert it into collection of views for a given container
            insertView(viewToRender[TVIEW], viewToRender, lContainer, getLContainerActiveIndex(lContainer));
        }
        lContainer[ACTIVE_INDEX] += 2 /* INCREMENT */;
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
 * @param {?} decls The number of nodes, local refs, and pipes in this template
 * @param {?} vars The number of bindings and pure function bindings in this template
 * @param {?} parent
 * @return {?} TView
 */
function getOrCreateEmbeddedTView(viewIndex, decls, vars, parent) {
    /** @type {?} */
    const tView = getLView()[TVIEW];
    ngDevMode && assertNodeType(parent, 0 /* Container */);
    /** @type {?} */
    const containerTViews = (/** @type {?} */ (parent.tViews));
    ngDevMode && assertDefined(containerTViews, 'TView expected');
    ngDevMode && assertEqual(Array.isArray(containerTViews), true, 'TViews should be in an array');
    if (viewIndex >= containerTViews.length || containerTViews[viewIndex] == null) {
        containerTViews[viewIndex] = createTView(2 /* Embedded */, viewIndex, null, decls, vars, tView.directiveRegistry, tView.pipeRegistry, null, null, tView.consts);
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
    const tView = getTView();
    /** @type {?} */
    const viewHost = lView[T_HOST];
    /** @type {?} */
    const context = lView[CONTEXT];
    if (isCreationMode(lView)) {
        renderView(tView, lView, context); // creation mode pass
    }
    refreshView(tView, lView, tView.template, context); // update mode pass
    // update mode pass
    /** @type {?} */
    const lContainer = (/** @type {?} */ (lView[PARENT]));
    ngDevMode && assertLContainerOrUndefined(lContainer);
    leaveView();
    setPreviousOrParentTNode((/** @type {?} */ (viewHost)), false);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW1iZWRkZWRfdmlldy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvaW5zdHJ1Y3Rpb25zL2VtYmVkZGVkX3ZpZXcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBUUEsT0FBTyxFQUFDLGFBQWEsRUFBRSxXQUFXLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUM3RCxPQUFPLEVBQUMsMkJBQTJCLEVBQUMsTUFBTSxXQUFXLENBQUM7QUFDdEQsT0FBTyxFQUFDLFlBQVksRUFBbUIsdUJBQXVCLEVBQWEsTUFBTSx5QkFBeUIsQ0FBQztBQUczRyxPQUFPLEVBQUMsT0FBTyxFQUFxQixNQUFNLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBbUIsTUFBTSxvQkFBb0IsQ0FBQztBQUN2RyxPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFDOUMsT0FBTyxFQUFDLFVBQVUsRUFBRSxVQUFVLEVBQUMsTUFBTSxzQkFBc0IsQ0FBQztBQUM1RCxPQUFPLEVBQUMsU0FBUyxFQUFFLFdBQVcsRUFBRSxRQUFRLEVBQUUsd0JBQXdCLEVBQUUsUUFBUSxFQUFFLFNBQVMsRUFBRSxXQUFXLEVBQUUsd0JBQXdCLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFDaEosT0FBTyxFQUFDLHdCQUF3QixFQUFFLGNBQWMsRUFBQyxNQUFNLG9CQUFvQixDQUFDO0FBRTVFLE9BQU8sRUFBQyxzQkFBc0IsRUFBRSxXQUFXLEVBQUUsV0FBVyxFQUFFLFdBQVcsRUFBRSxVQUFVLEVBQUMsTUFBTSxVQUFVLENBQUM7Ozs7Ozs7Ozs7O0FBWW5HLE1BQU0sVUFBVSxtQkFBbUIsQ0FBQyxXQUFtQixFQUFFLEtBQWEsRUFBRSxJQUFZOztVQUM1RSxLQUFLLEdBQUcsUUFBUSxFQUFFOztVQUNsQixxQkFBcUIsR0FBRyx3QkFBd0IsRUFBRTs7O1VBRWxELGNBQWMsR0FBRyxx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S0FBSyxDQUFDLENBQUM7QUFDN0MsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHthc3NlcnREZWZpbmVkLCBhc3NlcnRFcXVhbH0gZnJvbSAnLi4vLi4vdXRpbC9hc3NlcnQnO1xuaW1wb3J0IHthc3NlcnRMQ29udGFpbmVyT3JVbmRlZmluZWR9IGZyb20gJy4uL2Fzc2VydCc7XG5pbXBvcnQge0FDVElWRV9JTkRFWCwgQWN0aXZlSW5kZXhGbGFnLCBDT05UQUlORVJfSEVBREVSX09GRlNFVCwgTENvbnRhaW5lcn0gZnJvbSAnLi4vaW50ZXJmYWNlcy9jb250YWluZXInO1xuaW1wb3J0IHtSZW5kZXJGbGFnc30gZnJvbSAnLi4vaW50ZXJmYWNlcy9kZWZpbml0aW9uJztcbmltcG9ydCB7VENvbnRhaW5lck5vZGUsIFROb2RlVHlwZX0gZnJvbSAnLi4vaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB7Q09OVEVYVCwgTFZpZXcsIExWaWV3RmxhZ3MsIFBBUkVOVCwgVF9IT1NULCBUVklFVywgVFZpZXcsIFRWaWV3VHlwZX0gZnJvbSAnLi4vaW50ZXJmYWNlcy92aWV3JztcbmltcG9ydCB7YXNzZXJ0Tm9kZVR5cGV9IGZyb20gJy4uL25vZGVfYXNzZXJ0JztcbmltcG9ydCB7aW5zZXJ0VmlldywgcmVtb3ZlVmlld30gZnJvbSAnLi4vbm9kZV9tYW5pcHVsYXRpb24nO1xuaW1wb3J0IHtlbnRlclZpZXcsIGdldElzUGFyZW50LCBnZXRMVmlldywgZ2V0UHJldmlvdXNPclBhcmVudFROb2RlLCBnZXRUVmlldywgbGVhdmVWaWV3LCBzZXRJc1BhcmVudCwgc2V0UHJldmlvdXNPclBhcmVudFROb2RlfSBmcm9tICcuLi9zdGF0ZSc7XG5pbXBvcnQge2dldExDb250YWluZXJBY3RpdmVJbmRleCwgaXNDcmVhdGlvbk1vZGV9IGZyb20gJy4uL3V0aWwvdmlld191dGlscyc7XG5cbmltcG9ydCB7YXNzaWduVFZpZXdOb2RlVG9MVmlldywgY3JlYXRlTFZpZXcsIGNyZWF0ZVRWaWV3LCByZWZyZXNoVmlldywgcmVuZGVyVmlld30gZnJvbSAnLi9zaGFyZWQnO1xuXG5cblxuLyoqXG4gKiBNYXJrcyB0aGUgc3RhcnQgb2YgYW4gZW1iZWRkZWQgdmlldy5cbiAqXG4gKiBAcGFyYW0gdmlld0Jsb2NrSWQgVGhlIElEIG9mIHRoaXMgdmlld1xuICogQHJldHVybiBib29sZWFuIFdoZXRoZXIgb3Igbm90IHRoaXMgdmlldyBpcyBpbiBjcmVhdGlvbiBtb2RlXG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVlbWJlZGRlZFZpZXdTdGFydCh2aWV3QmxvY2tJZDogbnVtYmVyLCBkZWNsczogbnVtYmVyLCB2YXJzOiBudW1iZXIpOiBSZW5kZXJGbGFncyB7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgcHJldmlvdXNPclBhcmVudFROb2RlID0gZ2V0UHJldmlvdXNPclBhcmVudFROb2RlKCk7XG4gIC8vIFRoZSBwcmV2aW91cyBub2RlIGNhbiBiZSBhIHZpZXcgbm9kZSBpZiB3ZSBhcmUgcHJvY2Vzc2luZyBhbiBpbmxpbmUgZm9yIGxvb3BcbiAgY29uc3QgY29udGFpbmVyVE5vZGUgPSBwcmV2aW91c09yUGFyZW50VE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLlZpZXcgP1xuICAgICAgcHJldmlvdXNPclBhcmVudFROb2RlLnBhcmVudCEgOlxuICAgICAgcHJldmlvdXNPclBhcmVudFROb2RlO1xuICBjb25zdCBsQ29udGFpbmVyID0gbFZpZXdbY29udGFpbmVyVE5vZGUuaW5kZXhdIGFzIExDb250YWluZXI7XG5cbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vZGVUeXBlKGNvbnRhaW5lclROb2RlLCBUTm9kZVR5cGUuQ29udGFpbmVyKTtcbiAgbGV0IHZpZXdUb1JlbmRlciA9IHNjYW5Gb3JWaWV3KGxDb250YWluZXIsIGdldExDb250YWluZXJBY3RpdmVJbmRleChsQ29udGFpbmVyKSwgdmlld0Jsb2NrSWQpO1xuXG4gIGlmICh2aWV3VG9SZW5kZXIpIHtcbiAgICBzZXRJc1BhcmVudCgpO1xuICAgIGVudGVyVmlldyh2aWV3VG9SZW5kZXIsIHZpZXdUb1JlbmRlcltUVklFV10ubm9kZSk7XG4gIH0gZWxzZSB7XG4gICAgLy8gV2hlbiB3ZSBjcmVhdGUgYSBuZXcgTFZpZXcsIHdlIGFsd2F5cyByZXNldCB0aGUgc3RhdGUgb2YgdGhlIGluc3RydWN0aW9ucy5cbiAgICB2aWV3VG9SZW5kZXIgPSBjcmVhdGVMVmlldyhcbiAgICAgICAgbFZpZXcsIGdldE9yQ3JlYXRlRW1iZWRkZWRUVmlldyh2aWV3QmxvY2tJZCwgZGVjbHMsIHZhcnMsIGNvbnRhaW5lclROb2RlIGFzIFRDb250YWluZXJOb2RlKSxcbiAgICAgICAgbnVsbCwgTFZpZXdGbGFncy5DaGVja0Fsd2F5cywgbnVsbCwgbnVsbCk7XG5cbiAgICBjb25zdCB0UGFyZW50Tm9kZSA9IGdldElzUGFyZW50KCkgPyBwcmV2aW91c09yUGFyZW50VE5vZGUgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByZXZpb3VzT3JQYXJlbnRUTm9kZSAmJiBwcmV2aW91c09yUGFyZW50VE5vZGUucGFyZW50O1xuICAgIGFzc2lnblRWaWV3Tm9kZVRvTFZpZXcodmlld1RvUmVuZGVyW1RWSUVXXSwgdFBhcmVudE5vZGUsIHZpZXdCbG9ja0lkLCB2aWV3VG9SZW5kZXIpO1xuICAgIGVudGVyVmlldyh2aWV3VG9SZW5kZXIsIHZpZXdUb1JlbmRlcltUVklFV10ubm9kZSk7XG4gIH1cbiAgaWYgKGxDb250YWluZXIpIHtcbiAgICBpZiAoaXNDcmVhdGlvbk1vZGUodmlld1RvUmVuZGVyKSkge1xuICAgICAgLy8gaXQgaXMgYSBuZXcgdmlldywgaW5zZXJ0IGl0IGludG8gY29sbGVjdGlvbiBvZiB2aWV3cyBmb3IgYSBnaXZlbiBjb250YWluZXJcbiAgICAgIGluc2VydFZpZXcoXG4gICAgICAgICAgdmlld1RvUmVuZGVyW1RWSUVXXSwgdmlld1RvUmVuZGVyLCBsQ29udGFpbmVyLCBnZXRMQ29udGFpbmVyQWN0aXZlSW5kZXgobENvbnRhaW5lcikpO1xuICAgIH1cbiAgICBsQ29udGFpbmVyW0FDVElWRV9JTkRFWF0gKz0gQWN0aXZlSW5kZXhGbGFnLklOQ1JFTUVOVDtcbiAgfVxuICByZXR1cm4gaXNDcmVhdGlvbk1vZGUodmlld1RvUmVuZGVyKSA/IFJlbmRlckZsYWdzLkNyZWF0ZSB8IFJlbmRlckZsYWdzLlVwZGF0ZSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgUmVuZGVyRmxhZ3MuVXBkYXRlO1xufVxuXG4vKipcbiAqIEluaXRpYWxpemUgdGhlIFRWaWV3IChlLmcuIHN0YXRpYyBkYXRhKSBmb3IgdGhlIGFjdGl2ZSBlbWJlZGRlZCB2aWV3LlxuICpcbiAqIEVhY2ggZW1iZWRkZWQgdmlldyBibG9jayBtdXN0IGNyZWF0ZSBvciByZXRyaWV2ZSBpdHMgb3duIFRWaWV3LiBPdGhlcndpc2UsIHRoZSBlbWJlZGRlZCB2aWV3J3NcbiAqIHN0YXRpYyBkYXRhIGZvciBhIHBhcnRpY3VsYXIgbm9kZSB3b3VsZCBvdmVyd3JpdGUgdGhlIHN0YXRpYyBkYXRhIGZvciBhIG5vZGUgaW4gdGhlIHZpZXcgYWJvdmVcbiAqIGl0IHdpdGggdGhlIHNhbWUgaW5kZXggKHNpbmNlIGl0J3MgaW4gdGhlIHNhbWUgdGVtcGxhdGUpLlxuICpcbiAqIEBwYXJhbSB2aWV3SW5kZXggVGhlIGluZGV4IG9mIHRoZSBUVmlldyBpbiBUTm9kZS50Vmlld3NcbiAqIEBwYXJhbSBkZWNscyBUaGUgbnVtYmVyIG9mIG5vZGVzLCBsb2NhbCByZWZzLCBhbmQgcGlwZXMgaW4gdGhpcyB0ZW1wbGF0ZVxuICogQHBhcmFtIHZhcnMgVGhlIG51bWJlciBvZiBiaW5kaW5ncyBhbmQgcHVyZSBmdW5jdGlvbiBiaW5kaW5ncyBpbiB0aGlzIHRlbXBsYXRlXG4gKiBAcGFyYW0gY29udGFpbmVyIFRoZSBwYXJlbnQgY29udGFpbmVyIGluIHdoaWNoIHRvIGxvb2sgZm9yIHRoZSB2aWV3J3Mgc3RhdGljIGRhdGFcbiAqIEByZXR1cm5zIFRWaWV3XG4gKi9cbmZ1bmN0aW9uIGdldE9yQ3JlYXRlRW1iZWRkZWRUVmlldyhcbiAgICB2aWV3SW5kZXg6IG51bWJlciwgZGVjbHM6IG51bWJlciwgdmFyczogbnVtYmVyLCBwYXJlbnQ6IFRDb250YWluZXJOb2RlKTogVFZpZXcge1xuICBjb25zdCB0VmlldyA9IGdldExWaWV3KClbVFZJRVddO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm9kZVR5cGUocGFyZW50LCBUTm9kZVR5cGUuQ29udGFpbmVyKTtcbiAgY29uc3QgY29udGFpbmVyVFZpZXdzID0gcGFyZW50LnRWaWV3cyBhcyBUVmlld1tdO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChjb250YWluZXJUVmlld3MsICdUVmlldyBleHBlY3RlZCcpO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RXF1YWwoQXJyYXkuaXNBcnJheShjb250YWluZXJUVmlld3MpLCB0cnVlLCAnVFZpZXdzIHNob3VsZCBiZSBpbiBhbiBhcnJheScpO1xuICBpZiAodmlld0luZGV4ID49IGNvbnRhaW5lclRWaWV3cy5sZW5ndGggfHwgY29udGFpbmVyVFZpZXdzW3ZpZXdJbmRleF0gPT0gbnVsbCkge1xuICAgIGNvbnRhaW5lclRWaWV3c1t2aWV3SW5kZXhdID0gY3JlYXRlVFZpZXcoXG4gICAgICAgIFRWaWV3VHlwZS5FbWJlZGRlZCwgdmlld0luZGV4LCBudWxsLCBkZWNscywgdmFycywgdFZpZXcuZGlyZWN0aXZlUmVnaXN0cnksXG4gICAgICAgIHRWaWV3LnBpcGVSZWdpc3RyeSwgbnVsbCwgbnVsbCwgdFZpZXcuY29uc3RzKTtcbiAgfVxuICByZXR1cm4gY29udGFpbmVyVFZpZXdzW3ZpZXdJbmRleF07XG59XG5cblxuLyoqXG4gKiBMb29rcyBmb3IgYSB2aWV3IHdpdGggYSBnaXZlbiB2aWV3IGJsb2NrIGlkIGluc2lkZSBhIHByb3ZpZGVkIExDb250YWluZXIuXG4gKiBSZW1vdmVzIHZpZXdzIHRoYXQgbmVlZCB0byBiZSBkZWxldGVkIGluIHRoZSBwcm9jZXNzLlxuICpcbiAqIEBwYXJhbSBsQ29udGFpbmVyIHRvIHNlYXJjaCBmb3Igdmlld3NcbiAqIEBwYXJhbSBzdGFydElkeCBzdGFydGluZyBpbmRleCBpbiB0aGUgdmlld3MgYXJyYXkgdG8gc2VhcmNoIGZyb21cbiAqIEBwYXJhbSB2aWV3QmxvY2tJZCBleGFjdCB2aWV3IGJsb2NrIGlkIHRvIGxvb2sgZm9yXG4gKi9cbmZ1bmN0aW9uIHNjYW5Gb3JWaWV3KGxDb250YWluZXI6IExDb250YWluZXIsIHN0YXJ0SWR4OiBudW1iZXIsIHZpZXdCbG9ja0lkOiBudW1iZXIpOiBMVmlld3xudWxsIHtcbiAgZm9yIChsZXQgaSA9IHN0YXJ0SWR4ICsgQ09OVEFJTkVSX0hFQURFUl9PRkZTRVQ7IGkgPCBsQ29udGFpbmVyLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3Qgdmlld0F0UG9zaXRpb25JZCA9IGxDb250YWluZXJbaV1bVFZJRVddLmlkO1xuICAgIGlmICh2aWV3QXRQb3NpdGlvbklkID09PSB2aWV3QmxvY2tJZCkge1xuICAgICAgcmV0dXJuIGxDb250YWluZXJbaV07XG4gICAgfSBlbHNlIGlmICh2aWV3QXRQb3NpdGlvbklkIDwgdmlld0Jsb2NrSWQpIHtcbiAgICAgIC8vIGZvdW5kIGEgdmlldyB0aGF0IHNob3VsZCBub3QgYmUgYXQgdGhpcyBwb3NpdGlvbiAtIHJlbW92ZVxuICAgICAgcmVtb3ZlVmlldyhsQ29udGFpbmVyLCBpIC0gQ09OVEFJTkVSX0hFQURFUl9PRkZTRVQpO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBmb3VuZCBhIHZpZXcgd2l0aCBpZCBncmVhdGVyIHRoYW4gdGhlIG9uZSB3ZSBhcmUgc2VhcmNoaW5nIGZvclxuICAgICAgLy8gd2hpY2ggbWVhbnMgdGhhdCByZXF1aXJlZCB2aWV3IGRvZXNuJ3QgZXhpc3QgYW5kIGNhbid0IGJlIGZvdW5kIGF0XG4gICAgICAvLyBsYXRlciBwb3NpdGlvbnMgaW4gdGhlIHZpZXdzIGFycmF5IC0gc3RvcCB0aGUgc2VhcmNoZGVmLmNvbnQgaGVyZVxuICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG4vKipcbiAqIE1hcmtzIHRoZSBlbmQgb2YgYW4gZW1iZWRkZWQgdmlldy5cbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWVtYmVkZGVkVmlld0VuZCgpOiB2b2lkIHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCB0VmlldyA9IGdldFRWaWV3KCk7XG4gIGNvbnN0IHZpZXdIb3N0ID0gbFZpZXdbVF9IT1NUXTtcbiAgY29uc3QgY29udGV4dCA9IGxWaWV3W0NPTlRFWFRdO1xuXG4gIGlmIChpc0NyZWF0aW9uTW9kZShsVmlldykpIHtcbiAgICByZW5kZXJWaWV3KHRWaWV3LCBsVmlldywgY29udGV4dCk7ICAvLyBjcmVhdGlvbiBtb2RlIHBhc3NcbiAgfVxuICByZWZyZXNoVmlldyh0VmlldywgbFZpZXcsIHRWaWV3LnRlbXBsYXRlLCBjb250ZXh0KTsgIC8vIHVwZGF0ZSBtb2RlIHBhc3NcblxuICBjb25zdCBsQ29udGFpbmVyID0gbFZpZXdbUEFSRU5UXSBhcyBMQ29udGFpbmVyO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0TENvbnRhaW5lck9yVW5kZWZpbmVkKGxDb250YWluZXIpO1xuICBsZWF2ZVZpZXcoKTtcbiAgc2V0UHJldmlvdXNPclBhcmVudFROb2RlKHZpZXdIb3N0ISwgZmFsc2UpO1xufVxuIl19