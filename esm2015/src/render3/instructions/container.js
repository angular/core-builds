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
import { assertDataInRange, assertEqual } from '../../util/assert';
import { assertHasParent } from '../assert';
import { attachPatchData } from '../context_discovery';
import { executeCheckHooks, executeInitAndCheckHooks, incrementInitPhaseFlags, registerPostOrderHooks } from '../hooks';
import { ACTIVE_INDEX, CONTAINER_HEADER_OFFSET } from '../interfaces/container';
import { isDirectiveHost } from '../interfaces/type_checks';
import { FLAGS, HEADER_OFFSET, RENDERER, TVIEW, T_HOST } from '../interfaces/view';
import { assertNodeType } from '../node_assert';
import { appendChild, removeView } from '../node_manipulation';
import { getBindingIndex, getCheckNoChangesMode, getIsParent, getLView, getPreviousOrParentTNode, setIsNotParent, setPreviousOrParentTNode } from '../state';
import { getConstant, load } from '../util/view_utils';
import { addToViewTree, createDirectivesInstances, createLContainer, createTNode, createTView, getOrCreateTNode, resolveDirectives, saveResolvedLocalsInData } from './shared';
/**
 * Creates an LContainer for inline views, e.g.
 *
 * % if (showing) {
 *   <div></div>
 * % }
 *
 * \@codeGenApi
 * @param {?} index The index of the container in the data array
 *
 * @return {?}
 */
export function ɵɵcontainer(index) {
    /** @type {?} */
    const lView = getLView();
    /** @type {?} */
    const tNode = containerInternal(lView, index, null, null);
    if (lView[TVIEW].firstCreatePass) {
        tNode.tViews = [];
    }
    setIsNotParent();
}
/**
 * Creates an LContainer for an ng-template (dynamically-inserted view), e.g.
 *
 * <ng-template #foo>
 *    <div></div>
 * </ng-template>
 *
 * \@codeGenApi
 * @param {?} index The index of the container in the data array
 * @param {?} templateFn Inline template
 * @param {?} decls The number of nodes, local refs, and pipes for this template
 * @param {?} vars The number of bindings for this template
 * @param {?=} tagName The name of the container element, if applicable
 * @param {?=} attrsIndex Index of template attributes in the `consts` array.
 * @param {?=} localRefsIndex
 * @param {?=} localRefExtractor A function which extracts local-refs values from the template.
 *        Defaults to the current element associated with the local-ref.
 *
 * @return {?}
 */
export function ɵɵtemplate(index, templateFn, decls, vars, tagName, attrsIndex, localRefsIndex, localRefExtractor) {
    /** @type {?} */
    const lView = getLView();
    /** @type {?} */
    const tView = lView[TVIEW];
    /** @type {?} */
    const tViewConsts = tView.consts;
    // TODO: consider a separate node type for templates
    /** @type {?} */
    const tContainerNode = containerInternal(lView, index, tagName || null, getConstant(tViewConsts, attrsIndex));
    /** @type {?} */
    const localRefs = getConstant(tViewConsts, localRefsIndex);
    if (tView.firstCreatePass) {
        ngDevMode && ngDevMode.firstCreatePass++;
        resolveDirectives(tView, lView, tContainerNode, localRefs);
        registerPostOrderHooks(tView, tContainerNode);
        /** @type {?} */
        const embeddedTView = tContainerNode.tViews = createTView(2 /* Embedded */, -1, templateFn, decls, vars, tView.directiveRegistry, tView.pipeRegistry, null, tView.schemas, tViewConsts);
        /** @type {?} */
        const embeddedTViewNode = (/** @type {?} */ (createTNode(tView, null, 2 /* View */, -1, null, null)));
        embeddedTViewNode.injectorIndex = tContainerNode.injectorIndex;
        embeddedTView.node = embeddedTViewNode;
        if (tView.queries !== null) {
            tView.queries.template(tView, tContainerNode);
            embeddedTView.queries = tView.queries.embeddedTView(tContainerNode);
        }
    }
    if (isDirectiveHost(tContainerNode)) {
        createDirectivesInstances(tView, lView, tContainerNode);
    }
    if (localRefs != null) {
        saveResolvedLocalsInData(lView, tContainerNode, localRefExtractor);
    }
    setIsNotParent();
}
/**
 * Sets a container up to receive views.
 *
 * \@codeGenApi
 * @param {?} index The index of the container in the data array
 *
 * @return {?}
 */
export function ɵɵcontainerRefreshStart(index) {
    /** @type {?} */
    const lView = getLView();
    /** @type {?} */
    const tView = lView[TVIEW];
    /** @type {?} */
    let previousOrParentTNode = (/** @type {?} */ (load(tView.data, index)));
    ngDevMode && assertNodeType(previousOrParentTNode, 0 /* Container */);
    setPreviousOrParentTNode(previousOrParentTNode, true);
    lView[index + HEADER_OFFSET][ACTIVE_INDEX] = 0;
    // We need to execute init hooks here so ngOnInit hooks are called in top level views
    // before they are called in embedded views (for backwards compatibility).
    if (!getCheckNoChangesMode()) {
        /** @type {?} */
        const hooksInitPhaseCompleted = (lView[FLAGS] & 3 /* InitPhaseStateMask */) === 3 /* InitPhaseCompleted */;
        if (hooksInitPhaseCompleted) {
            /** @type {?} */
            const preOrderCheckHooks = tView.preOrderCheckHooks;
            if (preOrderCheckHooks !== null) {
                executeCheckHooks(lView, preOrderCheckHooks, null);
            }
        }
        else {
            /** @type {?} */
            const preOrderHooks = tView.preOrderHooks;
            if (preOrderHooks !== null) {
                executeInitAndCheckHooks(lView, preOrderHooks, 0 /* OnInitHooksToBeRun */, null);
            }
            incrementInitPhaseFlags(lView, 0 /* OnInitHooksToBeRun */);
        }
    }
}
/**
 * Marks the end of the LContainer.
 *
 * Marking the end of LContainer is the time when to child views get inserted or removed.
 *
 * \@codeGenApi
 * @return {?}
 */
export function ɵɵcontainerRefreshEnd() {
    /** @type {?} */
    let previousOrParentTNode = getPreviousOrParentTNode();
    if (getIsParent()) {
        setIsNotParent();
    }
    else {
        ngDevMode && assertNodeType(previousOrParentTNode, 2 /* View */);
        ngDevMode && assertHasParent(previousOrParentTNode);
        previousOrParentTNode = (/** @type {?} */ (previousOrParentTNode.parent));
        setPreviousOrParentTNode(previousOrParentTNode, false);
    }
    ngDevMode && assertNodeType(previousOrParentTNode, 0 /* Container */);
    /** @type {?} */
    const lContainer = getLView()[previousOrParentTNode.index];
    /** @type {?} */
    const nextIndex = lContainer[ACTIVE_INDEX];
    // remove extra views at the end of the container
    while (nextIndex < lContainer.length - CONTAINER_HEADER_OFFSET) {
        removeView(lContainer, nextIndex);
    }
}
/**
 * @param {?} lView
 * @param {?} nodeIndex
 * @param {?} tagName
 * @param {?} attrs
 * @return {?}
 */
function containerInternal(lView, nodeIndex, tagName, attrs) {
    ngDevMode && assertEqual(getBindingIndex(), lView[TVIEW].bindingStartIndex, 'container nodes should be created before any bindings');
    /** @type {?} */
    const adjustedIndex = nodeIndex + HEADER_OFFSET;
    ngDevMode && assertDataInRange(lView, nodeIndex + HEADER_OFFSET);
    ngDevMode && ngDevMode.rendererCreateComment++;
    /** @type {?} */
    const comment = lView[adjustedIndex] =
        lView[RENDERER].createComment(ngDevMode ? 'container' : '');
    /** @type {?} */
    const tNode = getOrCreateTNode(lView[TVIEW], lView[T_HOST], nodeIndex, 0 /* Container */, tagName, attrs);
    /** @type {?} */
    const lContainer = lView[adjustedIndex] = createLContainer(comment, lView, comment, tNode);
    appendChild(comment, tNode, lView);
    attachPatchData(comment, lView);
    // Containers are added to the current view tree instead of their embedded views
    // because views can be removed and re-inserted.
    addToViewTree(lView, lContainer);
    ngDevMode && assertNodeType(getPreviousOrParentTNode(), 0 /* Container */);
    return tNode;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udGFpbmVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9pbnN0cnVjdGlvbnMvY29udGFpbmVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBT0EsT0FBTyxFQUFDLGlCQUFpQixFQUFFLFdBQVcsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQ2pFLE9BQU8sRUFBQyxlQUFlLEVBQUMsTUFBTSxXQUFXLENBQUM7QUFDMUMsT0FBTyxFQUFDLGVBQWUsRUFBQyxNQUFNLHNCQUFzQixDQUFDO0FBQ3JELE9BQU8sRUFBQyxpQkFBaUIsRUFBRSx3QkFBd0IsRUFBRSx1QkFBdUIsRUFBRSxzQkFBc0IsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUN0SCxPQUFPLEVBQUMsWUFBWSxFQUFFLHVCQUF1QixFQUFhLE1BQU0seUJBQXlCLENBQUM7QUFHMUYsT0FBTyxFQUFDLGVBQWUsRUFBQyxNQUFNLDJCQUEyQixDQUFDO0FBQzFELE9BQU8sRUFBQyxLQUFLLEVBQUUsYUFBYSxFQUFxQyxRQUFRLEVBQUUsS0FBSyxFQUFhLE1BQU0sRUFBQyxNQUFNLG9CQUFvQixDQUFDO0FBQy9ILE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUM5QyxPQUFPLEVBQUMsV0FBVyxFQUFFLFVBQVUsRUFBQyxNQUFNLHNCQUFzQixDQUFDO0FBQzdELE9BQU8sRUFBQyxlQUFlLEVBQUUscUJBQXFCLEVBQUUsV0FBVyxFQUFFLFFBQVEsRUFBRSx3QkFBd0IsRUFBRSxjQUFjLEVBQUUsd0JBQXdCLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFDM0osT0FBTyxFQUFDLFdBQVcsRUFBRSxJQUFJLEVBQUMsTUFBTSxvQkFBb0IsQ0FBQztBQUVyRCxPQUFPLEVBQUMsYUFBYSxFQUFFLHlCQUF5QixFQUFFLGdCQUFnQixFQUFFLFdBQVcsRUFBRSxXQUFXLEVBQUUs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RUFBRSxPQUFPLEVBQUUsS0FBSyxDQUFDO0lBRTFGLFdBQVcsQ0FBQyxPQUFPLEVBQUUsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQ25DLGVBQWUsQ0FBQyxPQUFPLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFFaEMsZ0ZBQWdGO0lBQ2hGLGdEQUFnRDtJQUNoRCxhQUFhLENBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxDQUFDO0lBRWpDLFNBQVMsSUFBSSxjQUFjLENBQUMsd0JBQXdCLEVBQUUsb0JBQXNCLENBQUM7SUFDN0UsT0FBTyxLQUFLLENBQUM7QUFDZixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0IHthc3NlcnREYXRhSW5SYW5nZSwgYXNzZXJ0RXF1YWx9IGZyb20gJy4uLy4uL3V0aWwvYXNzZXJ0JztcbmltcG9ydCB7YXNzZXJ0SGFzUGFyZW50fSBmcm9tICcuLi9hc3NlcnQnO1xuaW1wb3J0IHthdHRhY2hQYXRjaERhdGF9IGZyb20gJy4uL2NvbnRleHRfZGlzY292ZXJ5JztcbmltcG9ydCB7ZXhlY3V0ZUNoZWNrSG9va3MsIGV4ZWN1dGVJbml0QW5kQ2hlY2tIb29rcywgaW5jcmVtZW50SW5pdFBoYXNlRmxhZ3MsIHJlZ2lzdGVyUG9zdE9yZGVySG9va3N9IGZyb20gJy4uL2hvb2tzJztcbmltcG9ydCB7QUNUSVZFX0lOREVYLCBDT05UQUlORVJfSEVBREVSX09GRlNFVCwgTENvbnRhaW5lcn0gZnJvbSAnLi4vaW50ZXJmYWNlcy9jb250YWluZXInO1xuaW1wb3J0IHtDb21wb25lbnRUZW1wbGF0ZX0gZnJvbSAnLi4vaW50ZXJmYWNlcy9kZWZpbml0aW9uJztcbmltcG9ydCB7TG9jYWxSZWZFeHRyYWN0b3IsIFRBdHRyaWJ1dGVzLCBUQ29udGFpbmVyTm9kZSwgVE5vZGUsIFROb2RlVHlwZSwgVFZpZXdOb2RlfSBmcm9tICcuLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtpc0RpcmVjdGl2ZUhvc3R9IGZyb20gJy4uL2ludGVyZmFjZXMvdHlwZV9jaGVja3MnO1xuaW1wb3J0IHtGTEFHUywgSEVBREVSX09GRlNFVCwgSW5pdFBoYXNlU3RhdGUsIExWaWV3LCBMVmlld0ZsYWdzLCBSRU5ERVJFUiwgVFZJRVcsIFRWaWV3VHlwZSwgVF9IT1NUfSBmcm9tICcuLi9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHthc3NlcnROb2RlVHlwZX0gZnJvbSAnLi4vbm9kZV9hc3NlcnQnO1xuaW1wb3J0IHthcHBlbmRDaGlsZCwgcmVtb3ZlVmlld30gZnJvbSAnLi4vbm9kZV9tYW5pcHVsYXRpb24nO1xuaW1wb3J0IHtnZXRCaW5kaW5nSW5kZXgsIGdldENoZWNrTm9DaGFuZ2VzTW9kZSwgZ2V0SXNQYXJlbnQsIGdldExWaWV3LCBnZXRQcmV2aW91c09yUGFyZW50VE5vZGUsIHNldElzTm90UGFyZW50LCBzZXRQcmV2aW91c09yUGFyZW50VE5vZGV9IGZyb20gJy4uL3N0YXRlJztcbmltcG9ydCB7Z2V0Q29uc3RhbnQsIGxvYWR9IGZyb20gJy4uL3V0aWwvdmlld191dGlscyc7XG5cbmltcG9ydCB7YWRkVG9WaWV3VHJlZSwgY3JlYXRlRGlyZWN0aXZlc0luc3RhbmNlcywgY3JlYXRlTENvbnRhaW5lciwgY3JlYXRlVE5vZGUsIGNyZWF0ZVRWaWV3LCBnZXRPckNyZWF0ZVROb2RlLCByZXNvbHZlRGlyZWN0aXZlcywgc2F2ZVJlc29sdmVkTG9jYWxzSW5EYXRhfSBmcm9tICcuL3NoYXJlZCc7XG5cblxuXG4vKipcbiAqIENyZWF0ZXMgYW4gTENvbnRhaW5lciBmb3IgaW5saW5lIHZpZXdzLCBlLmcuXG4gKlxuICogJSBpZiAoc2hvd2luZykge1xuICogICA8ZGl2PjwvZGl2PlxuICogJSB9XG4gKlxuICogQHBhcmFtIGluZGV4IFRoZSBpbmRleCBvZiB0aGUgY29udGFpbmVyIGluIHRoZSBkYXRhIGFycmF5XG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVjb250YWluZXIoaW5kZXg6IG51bWJlcik6IHZvaWQge1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IHROb2RlID0gY29udGFpbmVySW50ZXJuYWwobFZpZXcsIGluZGV4LCBudWxsLCBudWxsKTtcblxuICBpZiAobFZpZXdbVFZJRVddLmZpcnN0Q3JlYXRlUGFzcykge1xuICAgIHROb2RlLnRWaWV3cyA9IFtdO1xuICB9XG4gIHNldElzTm90UGFyZW50KCk7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhbiBMQ29udGFpbmVyIGZvciBhbiBuZy10ZW1wbGF0ZSAoZHluYW1pY2FsbHktaW5zZXJ0ZWQgdmlldyksIGUuZy5cbiAqXG4gKiA8bmctdGVtcGxhdGUgI2Zvbz5cbiAqICAgIDxkaXY+PC9kaXY+XG4gKiA8L25nLXRlbXBsYXRlPlxuICpcbiAqIEBwYXJhbSBpbmRleCBUaGUgaW5kZXggb2YgdGhlIGNvbnRhaW5lciBpbiB0aGUgZGF0YSBhcnJheVxuICogQHBhcmFtIHRlbXBsYXRlRm4gSW5saW5lIHRlbXBsYXRlXG4gKiBAcGFyYW0gZGVjbHMgVGhlIG51bWJlciBvZiBub2RlcywgbG9jYWwgcmVmcywgYW5kIHBpcGVzIGZvciB0aGlzIHRlbXBsYXRlXG4gKiBAcGFyYW0gdmFycyBUaGUgbnVtYmVyIG9mIGJpbmRpbmdzIGZvciB0aGlzIHRlbXBsYXRlXG4gKiBAcGFyYW0gdGFnTmFtZSBUaGUgbmFtZSBvZiB0aGUgY29udGFpbmVyIGVsZW1lbnQsIGlmIGFwcGxpY2FibGVcbiAqIEBwYXJhbSBhdHRyc0luZGV4IEluZGV4IG9mIHRlbXBsYXRlIGF0dHJpYnV0ZXMgaW4gdGhlIGBjb25zdHNgIGFycmF5LlxuICogQHBhcmFtIGxvY2FsUmVmcyBJbmRleCBvZiB0aGUgbG9jYWwgcmVmZXJlbmNlcyBpbiB0aGUgYGNvbnN0c2AgYXJyYXkuXG4gKiBAcGFyYW0gbG9jYWxSZWZFeHRyYWN0b3IgQSBmdW5jdGlvbiB3aGljaCBleHRyYWN0cyBsb2NhbC1yZWZzIHZhbHVlcyBmcm9tIHRoZSB0ZW1wbGF0ZS5cbiAqICAgICAgICBEZWZhdWx0cyB0byB0aGUgY3VycmVudCBlbGVtZW50IGFzc29jaWF0ZWQgd2l0aCB0aGUgbG9jYWwtcmVmLlxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1dGVtcGxhdGUoXG4gICAgaW5kZXg6IG51bWJlciwgdGVtcGxhdGVGbjogQ29tcG9uZW50VGVtcGxhdGU8YW55PnwgbnVsbCwgZGVjbHM6IG51bWJlciwgdmFyczogbnVtYmVyLFxuICAgIHRhZ05hbWU/OiBzdHJpbmcgfCBudWxsLCBhdHRyc0luZGV4PzogbnVtYmVyIHwgbnVsbCwgbG9jYWxSZWZzSW5kZXg/OiBudW1iZXIgfCBudWxsLFxuICAgIGxvY2FsUmVmRXh0cmFjdG9yPzogTG9jYWxSZWZFeHRyYWN0b3IpIHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCB0VmlldyA9IGxWaWV3W1RWSUVXXTtcbiAgY29uc3QgdFZpZXdDb25zdHMgPSB0Vmlldy5jb25zdHM7XG5cbiAgLy8gVE9ETzogY29uc2lkZXIgYSBzZXBhcmF0ZSBub2RlIHR5cGUgZm9yIHRlbXBsYXRlc1xuICBjb25zdCB0Q29udGFpbmVyTm9kZSA9IGNvbnRhaW5lckludGVybmFsKFxuICAgICAgbFZpZXcsIGluZGV4LCB0YWdOYW1lIHx8IG51bGwsIGdldENvbnN0YW50PFRBdHRyaWJ1dGVzPih0Vmlld0NvbnN0cywgYXR0cnNJbmRleCkpO1xuICBjb25zdCBsb2NhbFJlZnMgPSBnZXRDb25zdGFudDxzdHJpbmdbXT4odFZpZXdDb25zdHMsIGxvY2FsUmVmc0luZGV4KTtcbiAgaWYgKHRWaWV3LmZpcnN0Q3JlYXRlUGFzcykge1xuICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUuZmlyc3RDcmVhdGVQYXNzKys7XG4gICAgcmVzb2x2ZURpcmVjdGl2ZXModFZpZXcsIGxWaWV3LCB0Q29udGFpbmVyTm9kZSwgbG9jYWxSZWZzKTtcbiAgICByZWdpc3RlclBvc3RPcmRlckhvb2tzKHRWaWV3LCB0Q29udGFpbmVyTm9kZSk7XG5cbiAgICBjb25zdCBlbWJlZGRlZFRWaWV3ID0gdENvbnRhaW5lck5vZGUudFZpZXdzID0gY3JlYXRlVFZpZXcoXG4gICAgICAgIFRWaWV3VHlwZS5FbWJlZGRlZCwgLTEsIHRlbXBsYXRlRm4sIGRlY2xzLCB2YXJzLCB0Vmlldy5kaXJlY3RpdmVSZWdpc3RyeSxcbiAgICAgICAgdFZpZXcucGlwZVJlZ2lzdHJ5LCBudWxsLCB0Vmlldy5zY2hlbWFzLCB0Vmlld0NvbnN0cyk7XG4gICAgY29uc3QgZW1iZWRkZWRUVmlld05vZGUgPSBjcmVhdGVUTm9kZSh0VmlldywgbnVsbCwgVE5vZGVUeXBlLlZpZXcsIC0xLCBudWxsLCBudWxsKSBhcyBUVmlld05vZGU7XG4gICAgZW1iZWRkZWRUVmlld05vZGUuaW5qZWN0b3JJbmRleCA9IHRDb250YWluZXJOb2RlLmluamVjdG9ySW5kZXg7XG4gICAgZW1iZWRkZWRUVmlldy5ub2RlID0gZW1iZWRkZWRUVmlld05vZGU7XG5cbiAgICBpZiAodFZpZXcucXVlcmllcyAhPT0gbnVsbCkge1xuICAgICAgdFZpZXcucXVlcmllcy50ZW1wbGF0ZSh0VmlldywgdENvbnRhaW5lck5vZGUpO1xuICAgICAgZW1iZWRkZWRUVmlldy5xdWVyaWVzID0gdFZpZXcucXVlcmllcy5lbWJlZGRlZFRWaWV3KHRDb250YWluZXJOb2RlKTtcbiAgICB9XG4gIH1cblxuICBpZiAoaXNEaXJlY3RpdmVIb3N0KHRDb250YWluZXJOb2RlKSkge1xuICAgIGNyZWF0ZURpcmVjdGl2ZXNJbnN0YW5jZXModFZpZXcsIGxWaWV3LCB0Q29udGFpbmVyTm9kZSk7XG4gIH1cbiAgaWYgKGxvY2FsUmVmcyAhPSBudWxsKSB7XG4gICAgc2F2ZVJlc29sdmVkTG9jYWxzSW5EYXRhKGxWaWV3LCB0Q29udGFpbmVyTm9kZSwgbG9jYWxSZWZFeHRyYWN0b3IpO1xuICB9XG5cbiAgc2V0SXNOb3RQYXJlbnQoKTtcbn1cblxuLyoqXG4gKiBTZXRzIGEgY29udGFpbmVyIHVwIHRvIHJlY2VpdmUgdmlld3MuXG4gKlxuICogQHBhcmFtIGluZGV4IFRoZSBpbmRleCBvZiB0aGUgY29udGFpbmVyIGluIHRoZSBkYXRhIGFycmF5XG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVjb250YWluZXJSZWZyZXNoU3RhcnQoaW5kZXg6IG51bWJlcik6IHZvaWQge1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IHRWaWV3ID0gbFZpZXdbVFZJRVddO1xuICBsZXQgcHJldmlvdXNPclBhcmVudFROb2RlID0gbG9hZCh0Vmlldy5kYXRhLCBpbmRleCkgYXMgVE5vZGU7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnROb2RlVHlwZShwcmV2aW91c09yUGFyZW50VE5vZGUsIFROb2RlVHlwZS5Db250YWluZXIpO1xuICBzZXRQcmV2aW91c09yUGFyZW50VE5vZGUocHJldmlvdXNPclBhcmVudFROb2RlLCB0cnVlKTtcblxuICBsVmlld1tpbmRleCArIEhFQURFUl9PRkZTRVRdW0FDVElWRV9JTkRFWF0gPSAwO1xuXG4gIC8vIFdlIG5lZWQgdG8gZXhlY3V0ZSBpbml0IGhvb2tzIGhlcmUgc28gbmdPbkluaXQgaG9va3MgYXJlIGNhbGxlZCBpbiB0b3AgbGV2ZWwgdmlld3NcbiAgLy8gYmVmb3JlIHRoZXkgYXJlIGNhbGxlZCBpbiBlbWJlZGRlZCB2aWV3cyAoZm9yIGJhY2t3YXJkcyBjb21wYXRpYmlsaXR5KS5cbiAgaWYgKCFnZXRDaGVja05vQ2hhbmdlc01vZGUoKSkge1xuICAgIGNvbnN0IGhvb2tzSW5pdFBoYXNlQ29tcGxldGVkID1cbiAgICAgICAgKGxWaWV3W0ZMQUdTXSAmIExWaWV3RmxhZ3MuSW5pdFBoYXNlU3RhdGVNYXNrKSA9PT0gSW5pdFBoYXNlU3RhdGUuSW5pdFBoYXNlQ29tcGxldGVkO1xuICAgIGlmIChob29rc0luaXRQaGFzZUNvbXBsZXRlZCkge1xuICAgICAgY29uc3QgcHJlT3JkZXJDaGVja0hvb2tzID0gdFZpZXcucHJlT3JkZXJDaGVja0hvb2tzO1xuICAgICAgaWYgKHByZU9yZGVyQ2hlY2tIb29rcyAhPT0gbnVsbCkge1xuICAgICAgICBleGVjdXRlQ2hlY2tIb29rcyhsVmlldywgcHJlT3JkZXJDaGVja0hvb2tzLCBudWxsKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgcHJlT3JkZXJIb29rcyA9IHRWaWV3LnByZU9yZGVySG9va3M7XG4gICAgICBpZiAocHJlT3JkZXJIb29rcyAhPT0gbnVsbCkge1xuICAgICAgICBleGVjdXRlSW5pdEFuZENoZWNrSG9va3MobFZpZXcsIHByZU9yZGVySG9va3MsIEluaXRQaGFzZVN0YXRlLk9uSW5pdEhvb2tzVG9CZVJ1biwgbnVsbCk7XG4gICAgICB9XG4gICAgICBpbmNyZW1lbnRJbml0UGhhc2VGbGFncyhsVmlldywgSW5pdFBoYXNlU3RhdGUuT25Jbml0SG9va3NUb0JlUnVuKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBNYXJrcyB0aGUgZW5kIG9mIHRoZSBMQ29udGFpbmVyLlxuICpcbiAqIE1hcmtpbmcgdGhlIGVuZCBvZiBMQ29udGFpbmVyIGlzIHRoZSB0aW1lIHdoZW4gdG8gY2hpbGQgdmlld3MgZ2V0IGluc2VydGVkIG9yIHJlbW92ZWQuXG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVjb250YWluZXJSZWZyZXNoRW5kKCk6IHZvaWQge1xuICBsZXQgcHJldmlvdXNPclBhcmVudFROb2RlID0gZ2V0UHJldmlvdXNPclBhcmVudFROb2RlKCk7XG4gIGlmIChnZXRJc1BhcmVudCgpKSB7XG4gICAgc2V0SXNOb3RQYXJlbnQoKTtcbiAgfSBlbHNlIHtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm9kZVR5cGUocHJldmlvdXNPclBhcmVudFROb2RlLCBUTm9kZVR5cGUuVmlldyk7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydEhhc1BhcmVudChwcmV2aW91c09yUGFyZW50VE5vZGUpO1xuICAgIHByZXZpb3VzT3JQYXJlbnRUTm9kZSA9IHByZXZpb3VzT3JQYXJlbnRUTm9kZS5wYXJlbnQgITtcbiAgICBzZXRQcmV2aW91c09yUGFyZW50VE5vZGUocHJldmlvdXNPclBhcmVudFROb2RlLCBmYWxzZSk7XG4gIH1cblxuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm9kZVR5cGUocHJldmlvdXNPclBhcmVudFROb2RlLCBUTm9kZVR5cGUuQ29udGFpbmVyKTtcblxuICBjb25zdCBsQ29udGFpbmVyOiBMQ29udGFpbmVyID0gZ2V0TFZpZXcoKVtwcmV2aW91c09yUGFyZW50VE5vZGUuaW5kZXhdO1xuICBjb25zdCBuZXh0SW5kZXggPSBsQ29udGFpbmVyW0FDVElWRV9JTkRFWF07XG5cbiAgLy8gcmVtb3ZlIGV4dHJhIHZpZXdzIGF0IHRoZSBlbmQgb2YgdGhlIGNvbnRhaW5lclxuICB3aGlsZSAobmV4dEluZGV4IDwgbENvbnRhaW5lci5sZW5ndGggLSBDT05UQUlORVJfSEVBREVSX09GRlNFVCkge1xuICAgIHJlbW92ZVZpZXcobENvbnRhaW5lciwgbmV4dEluZGV4KTtcbiAgfVxufVxuXG5mdW5jdGlvbiBjb250YWluZXJJbnRlcm5hbChcbiAgICBsVmlldzogTFZpZXcsIG5vZGVJbmRleDogbnVtYmVyLCB0YWdOYW1lOiBzdHJpbmcgfCBudWxsLFxuICAgIGF0dHJzOiBUQXR0cmlidXRlcyB8IG51bGwpOiBUQ29udGFpbmVyTm9kZSB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRFcXVhbChcbiAgICAgICAgICAgICAgICAgICBnZXRCaW5kaW5nSW5kZXgoKSwgbFZpZXdbVFZJRVddLmJpbmRpbmdTdGFydEluZGV4LFxuICAgICAgICAgICAgICAgICAgICdjb250YWluZXIgbm9kZXMgc2hvdWxkIGJlIGNyZWF0ZWQgYmVmb3JlIGFueSBiaW5kaW5ncycpO1xuXG4gIGNvbnN0IGFkanVzdGVkSW5kZXggPSBub2RlSW5kZXggKyBIRUFERVJfT0ZGU0VUO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGF0YUluUmFuZ2UobFZpZXcsIG5vZGVJbmRleCArIEhFQURFUl9PRkZTRVQpO1xuICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyQ3JlYXRlQ29tbWVudCsrO1xuICBjb25zdCBjb21tZW50ID0gbFZpZXdbYWRqdXN0ZWRJbmRleF0gPVxuICAgICAgbFZpZXdbUkVOREVSRVJdLmNyZWF0ZUNvbW1lbnQobmdEZXZNb2RlID8gJ2NvbnRhaW5lcicgOiAnJyk7XG4gIGNvbnN0IHROb2RlID1cbiAgICAgIGdldE9yQ3JlYXRlVE5vZGUobFZpZXdbVFZJRVddLCBsVmlld1tUX0hPU1RdLCBub2RlSW5kZXgsIFROb2RlVHlwZS5Db250YWluZXIsIHRhZ05hbWUsIGF0dHJzKTtcbiAgY29uc3QgbENvbnRhaW5lciA9IGxWaWV3W2FkanVzdGVkSW5kZXhdID0gY3JlYXRlTENvbnRhaW5lcihjb21tZW50LCBsVmlldywgY29tbWVudCwgdE5vZGUpO1xuXG4gIGFwcGVuZENoaWxkKGNvbW1lbnQsIHROb2RlLCBsVmlldyk7XG4gIGF0dGFjaFBhdGNoRGF0YShjb21tZW50LCBsVmlldyk7XG5cbiAgLy8gQ29udGFpbmVycyBhcmUgYWRkZWQgdG8gdGhlIGN1cnJlbnQgdmlldyB0cmVlIGluc3RlYWQgb2YgdGhlaXIgZW1iZWRkZWQgdmlld3NcbiAgLy8gYmVjYXVzZSB2aWV3cyBjYW4gYmUgcmVtb3ZlZCBhbmQgcmUtaW5zZXJ0ZWQuXG4gIGFkZFRvVmlld1RyZWUobFZpZXcsIGxDb250YWluZXIpO1xuXG4gIG5nRGV2TW9kZSAmJiBhc3NlcnROb2RlVHlwZShnZXRQcmV2aW91c09yUGFyZW50VE5vZGUoKSwgVE5vZGVUeXBlLkNvbnRhaW5lcik7XG4gIHJldHVybiB0Tm9kZTtcbn1cbiJdfQ==