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
import { BINDING_INDEX, FLAGS, HEADER_OFFSET, RENDERER, TVIEW, T_HOST } from '../interfaces/view';
import { assertNodeType } from '../node_assert';
import { appendChild, removeView } from '../node_manipulation';
import { getCheckNoChangesMode, getIsParent, getLView, getPreviousOrParentTNode, setIsNotParent, setPreviousOrParentTNode } from '../state';
import { getNativeByTNode, load } from '../util/view_utils';
import { addToViewTree, createDirectivesAndLocals, createLContainer, createTNode, createTView, getOrCreateTNode, resolveDirectives } from './shared';
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
    if (lView[TVIEW].firstTemplatePass) {
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
 * @param {?} consts The number of nodes, local refs, and pipes for this template
 * @param {?} vars The number of bindings for this template
 * @param {?=} tagName The name of the container element, if applicable
 * @param {?=} attrs The attrs attached to the container, if applicable
 * @param {?=} localRefs A set of local reference bindings on the element.
 * @param {?=} localRefExtractor A function which extracts local-refs values from the template.
 *        Defaults to the current element associated with the local-ref.
 *
 * @return {?}
 */
export function ɵɵtemplate(index, templateFn, consts, vars, tagName, attrs, localRefs, localRefExtractor) {
    /** @type {?} */
    const lView = getLView();
    /** @type {?} */
    const tView = lView[TVIEW];
    // TODO: consider a separate node type for templates
    /** @type {?} */
    const tContainerNode = containerInternal(lView, index, tagName || null, attrs || null);
    if (tView.firstTemplatePass) {
        ngDevMode && ngDevMode.firstTemplatePass++;
        resolveDirectives(tView, lView, tContainerNode, localRefs || null);
        registerPostOrderHooks(tView, tContainerNode);
        /** @type {?} */
        const embeddedTView = tContainerNode.tViews = createTView(-1, templateFn, consts, vars, tView.directiveRegistry, tView.pipeRegistry, null, tView.schemas);
        /** @type {?} */
        const embeddedTViewNode = (/** @type {?} */ (createTNode(tView, null, 2 /* View */, -1, null, null)));
        embeddedTViewNode.injectorIndex = tContainerNode.injectorIndex;
        embeddedTView.node = embeddedTViewNode;
        if (tView.queries !== null) {
            tView.queries.template(tView, tContainerNode);
            embeddedTView.queries = tView.queries.embeddedTView(tContainerNode);
        }
    }
    createDirectivesAndLocals(tView, lView, tContainerNode, localRefExtractor);
    attachPatchData(getNativeByTNode(tContainerNode, lView), lView);
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
    ngDevMode && assertEqual(lView[BINDING_INDEX], lView[TVIEW].bindingStartIndex, 'container nodes should be created before any bindings');
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
    // Containers are added to the current view tree instead of their embedded views
    // because views can be removed and re-inserted.
    addToViewTree(lView, lContainer);
    ngDevMode && assertNodeType(getPreviousOrParentTNode(), 0 /* Container */);
    return tNode;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udGFpbmVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9pbnN0cnVjdGlvbnMvY29udGFpbmVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBT0EsT0FBTyxFQUFDLGlCQUFpQixFQUFFLFdBQVcsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQ2pFLE9BQU8sRUFBQyxlQUFlLEVBQUMsTUFBTSxXQUFXLENBQUM7QUFDMUMsT0FBTyxFQUFDLGVBQWUsRUFBQyxNQUFNLHNCQUFzQixDQUFDO0FBQ3JELE9BQU8sRUFBQyxpQkFBaUIsRUFBRSx3QkFBd0IsRUFBRSx1QkFBdUIsRUFBRSxzQkFBc0IsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUN0SCxPQUFPLEVBQUMsWUFBWSxFQUFFLHVCQUF1QixFQUFhLE1BQU0seUJBQXlCLENBQUM7QUFHMUYsT0FBTyxFQUFDLGFBQWEsRUFBRSxLQUFLLEVBQUUsYUFBYSxFQUFxQyxRQUFRLEVBQUUsS0FBSyxFQUFFLE1BQU0sRUFBQyxNQUFNLG9CQUFvQixDQUFDO0FBQ25JLE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUM5QyxPQUFPLEVBQUMsV0FBVyxFQUFFLFVBQVUsRUFBQyxNQUFNLHNCQUFzQixDQUFDO0FBQzdELE9BQU8sRUFBQyxxQkFBcUIsRUFBRSxXQUFXLEVBQUUsUUFBUSxFQUFFLHdCQUF3QixFQUFFLGNBQWMsRUFBRSx3QkFBd0IsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUMxSSxPQUFPLEVBQUMsZ0JBQWdCLEVBQUUsSUFBSSxFQUFDLE1BQU0sb0JBQW9CLENBQUM7QUFFMUQsT0FBTyxFQUFDLGFBQWEsRUFBRSx5QkFBeUIsRUFBRSxnQkFBZ0IsRUFBRSxXQUFXLEVBQUUsV0FBVyxFQUFFLGdCQUFnQixFQUFFLGlCQUFpQixFQUFDLE1BQU0sVUFBVSxDQUFDOzs7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QixDQUFDO0lBQzdFLE9BQU8sS0FBSyxDQUFDO0FBQ2YsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cbmltcG9ydCB7YXNzZXJ0RGF0YUluUmFuZ2UsIGFzc2VydEVxdWFsfSBmcm9tICcuLi8uLi91dGlsL2Fzc2VydCc7XG5pbXBvcnQge2Fzc2VydEhhc1BhcmVudH0gZnJvbSAnLi4vYXNzZXJ0JztcbmltcG9ydCB7YXR0YWNoUGF0Y2hEYXRhfSBmcm9tICcuLi9jb250ZXh0X2Rpc2NvdmVyeSc7XG5pbXBvcnQge2V4ZWN1dGVDaGVja0hvb2tzLCBleGVjdXRlSW5pdEFuZENoZWNrSG9va3MsIGluY3JlbWVudEluaXRQaGFzZUZsYWdzLCByZWdpc3RlclBvc3RPcmRlckhvb2tzfSBmcm9tICcuLi9ob29rcyc7XG5pbXBvcnQge0FDVElWRV9JTkRFWCwgQ09OVEFJTkVSX0hFQURFUl9PRkZTRVQsIExDb250YWluZXJ9IGZyb20gJy4uL2ludGVyZmFjZXMvY29udGFpbmVyJztcbmltcG9ydCB7Q29tcG9uZW50VGVtcGxhdGV9IGZyb20gJy4uL2ludGVyZmFjZXMvZGVmaW5pdGlvbic7XG5pbXBvcnQge0xvY2FsUmVmRXh0cmFjdG9yLCBUQXR0cmlidXRlcywgVENvbnRhaW5lck5vZGUsIFROb2RlLCBUTm9kZVR5cGUsIFRWaWV3Tm9kZX0gZnJvbSAnLi4vaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB7QklORElOR19JTkRFWCwgRkxBR1MsIEhFQURFUl9PRkZTRVQsIEluaXRQaGFzZVN0YXRlLCBMVmlldywgTFZpZXdGbGFncywgUkVOREVSRVIsIFRWSUVXLCBUX0hPU1R9IGZyb20gJy4uL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge2Fzc2VydE5vZGVUeXBlfSBmcm9tICcuLi9ub2RlX2Fzc2VydCc7XG5pbXBvcnQge2FwcGVuZENoaWxkLCByZW1vdmVWaWV3fSBmcm9tICcuLi9ub2RlX21hbmlwdWxhdGlvbic7XG5pbXBvcnQge2dldENoZWNrTm9DaGFuZ2VzTW9kZSwgZ2V0SXNQYXJlbnQsIGdldExWaWV3LCBnZXRQcmV2aW91c09yUGFyZW50VE5vZGUsIHNldElzTm90UGFyZW50LCBzZXRQcmV2aW91c09yUGFyZW50VE5vZGV9IGZyb20gJy4uL3N0YXRlJztcbmltcG9ydCB7Z2V0TmF0aXZlQnlUTm9kZSwgbG9hZH0gZnJvbSAnLi4vdXRpbC92aWV3X3V0aWxzJztcblxuaW1wb3J0IHthZGRUb1ZpZXdUcmVlLCBjcmVhdGVEaXJlY3RpdmVzQW5kTG9jYWxzLCBjcmVhdGVMQ29udGFpbmVyLCBjcmVhdGVUTm9kZSwgY3JlYXRlVFZpZXcsIGdldE9yQ3JlYXRlVE5vZGUsIHJlc29sdmVEaXJlY3RpdmVzfSBmcm9tICcuL3NoYXJlZCc7XG5cblxuXG4vKipcbiAqIENyZWF0ZXMgYW4gTENvbnRhaW5lciBmb3IgaW5saW5lIHZpZXdzLCBlLmcuXG4gKlxuICogJSBpZiAoc2hvd2luZykge1xuICogICA8ZGl2PjwvZGl2PlxuICogJSB9XG4gKlxuICogQHBhcmFtIGluZGV4IFRoZSBpbmRleCBvZiB0aGUgY29udGFpbmVyIGluIHRoZSBkYXRhIGFycmF5XG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVjb250YWluZXIoaW5kZXg6IG51bWJlcik6IHZvaWQge1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IHROb2RlID0gY29udGFpbmVySW50ZXJuYWwobFZpZXcsIGluZGV4LCBudWxsLCBudWxsKTtcblxuICBpZiAobFZpZXdbVFZJRVddLmZpcnN0VGVtcGxhdGVQYXNzKSB7XG4gICAgdE5vZGUudFZpZXdzID0gW107XG4gIH1cbiAgc2V0SXNOb3RQYXJlbnQoKTtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGFuIExDb250YWluZXIgZm9yIGFuIG5nLXRlbXBsYXRlIChkeW5hbWljYWxseS1pbnNlcnRlZCB2aWV3KSwgZS5nLlxuICpcbiAqIDxuZy10ZW1wbGF0ZSAjZm9vPlxuICogICAgPGRpdj48L2Rpdj5cbiAqIDwvbmctdGVtcGxhdGU+XG4gKlxuICogQHBhcmFtIGluZGV4IFRoZSBpbmRleCBvZiB0aGUgY29udGFpbmVyIGluIHRoZSBkYXRhIGFycmF5XG4gKiBAcGFyYW0gdGVtcGxhdGVGbiBJbmxpbmUgdGVtcGxhdGVcbiAqIEBwYXJhbSBjb25zdHMgVGhlIG51bWJlciBvZiBub2RlcywgbG9jYWwgcmVmcywgYW5kIHBpcGVzIGZvciB0aGlzIHRlbXBsYXRlXG4gKiBAcGFyYW0gdmFycyBUaGUgbnVtYmVyIG9mIGJpbmRpbmdzIGZvciB0aGlzIHRlbXBsYXRlXG4gKiBAcGFyYW0gdGFnTmFtZSBUaGUgbmFtZSBvZiB0aGUgY29udGFpbmVyIGVsZW1lbnQsIGlmIGFwcGxpY2FibGVcbiAqIEBwYXJhbSBhdHRycyBUaGUgYXR0cnMgYXR0YWNoZWQgdG8gdGhlIGNvbnRhaW5lciwgaWYgYXBwbGljYWJsZVxuICogQHBhcmFtIGxvY2FsUmVmcyBBIHNldCBvZiBsb2NhbCByZWZlcmVuY2UgYmluZGluZ3Mgb24gdGhlIGVsZW1lbnQuXG4gKiBAcGFyYW0gbG9jYWxSZWZFeHRyYWN0b3IgQSBmdW5jdGlvbiB3aGljaCBleHRyYWN0cyBsb2NhbC1yZWZzIHZhbHVlcyBmcm9tIHRoZSB0ZW1wbGF0ZS5cbiAqICAgICAgICBEZWZhdWx0cyB0byB0aGUgY3VycmVudCBlbGVtZW50IGFzc29jaWF0ZWQgd2l0aCB0aGUgbG9jYWwtcmVmLlxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1dGVtcGxhdGUoXG4gICAgaW5kZXg6IG51bWJlciwgdGVtcGxhdGVGbjogQ29tcG9uZW50VGVtcGxhdGU8YW55PnwgbnVsbCwgY29uc3RzOiBudW1iZXIsIHZhcnM6IG51bWJlcixcbiAgICB0YWdOYW1lPzogc3RyaW5nIHwgbnVsbCwgYXR0cnM/OiBUQXR0cmlidXRlcyB8IG51bGwsIGxvY2FsUmVmcz86IHN0cmluZ1tdIHwgbnVsbCxcbiAgICBsb2NhbFJlZkV4dHJhY3Rvcj86IExvY2FsUmVmRXh0cmFjdG9yKSB7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgdFZpZXcgPSBsVmlld1tUVklFV107XG5cbiAgLy8gVE9ETzogY29uc2lkZXIgYSBzZXBhcmF0ZSBub2RlIHR5cGUgZm9yIHRlbXBsYXRlc1xuICBjb25zdCB0Q29udGFpbmVyTm9kZSA9IGNvbnRhaW5lckludGVybmFsKGxWaWV3LCBpbmRleCwgdGFnTmFtZSB8fCBudWxsLCBhdHRycyB8fCBudWxsKTtcbiAgaWYgKHRWaWV3LmZpcnN0VGVtcGxhdGVQYXNzKSB7XG4gICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5maXJzdFRlbXBsYXRlUGFzcysrO1xuICAgIHJlc29sdmVEaXJlY3RpdmVzKHRWaWV3LCBsVmlldywgdENvbnRhaW5lck5vZGUsIGxvY2FsUmVmcyB8fCBudWxsKTtcbiAgICByZWdpc3RlclBvc3RPcmRlckhvb2tzKHRWaWV3LCB0Q29udGFpbmVyTm9kZSk7XG5cbiAgICBjb25zdCBlbWJlZGRlZFRWaWV3ID0gdENvbnRhaW5lck5vZGUudFZpZXdzID0gY3JlYXRlVFZpZXcoXG4gICAgICAgIC0xLCB0ZW1wbGF0ZUZuLCBjb25zdHMsIHZhcnMsIHRWaWV3LmRpcmVjdGl2ZVJlZ2lzdHJ5LCB0Vmlldy5waXBlUmVnaXN0cnksIG51bGwsXG4gICAgICAgIHRWaWV3LnNjaGVtYXMpO1xuICAgIGNvbnN0IGVtYmVkZGVkVFZpZXdOb2RlID0gY3JlYXRlVE5vZGUodFZpZXcsIG51bGwsIFROb2RlVHlwZS5WaWV3LCAtMSwgbnVsbCwgbnVsbCkgYXMgVFZpZXdOb2RlO1xuICAgIGVtYmVkZGVkVFZpZXdOb2RlLmluamVjdG9ySW5kZXggPSB0Q29udGFpbmVyTm9kZS5pbmplY3RvckluZGV4O1xuICAgIGVtYmVkZGVkVFZpZXcubm9kZSA9IGVtYmVkZGVkVFZpZXdOb2RlO1xuXG4gICAgaWYgKHRWaWV3LnF1ZXJpZXMgIT09IG51bGwpIHtcbiAgICAgIHRWaWV3LnF1ZXJpZXMudGVtcGxhdGUodFZpZXcsIHRDb250YWluZXJOb2RlKTtcbiAgICAgIGVtYmVkZGVkVFZpZXcucXVlcmllcyA9IHRWaWV3LnF1ZXJpZXMuZW1iZWRkZWRUVmlldyh0Q29udGFpbmVyTm9kZSk7XG4gICAgfVxuICB9XG5cbiAgY3JlYXRlRGlyZWN0aXZlc0FuZExvY2Fscyh0VmlldywgbFZpZXcsIHRDb250YWluZXJOb2RlLCBsb2NhbFJlZkV4dHJhY3Rvcik7XG4gIGF0dGFjaFBhdGNoRGF0YShnZXROYXRpdmVCeVROb2RlKHRDb250YWluZXJOb2RlLCBsVmlldyksIGxWaWV3KTtcbiAgc2V0SXNOb3RQYXJlbnQoKTtcbn1cblxuLyoqXG4gKiBTZXRzIGEgY29udGFpbmVyIHVwIHRvIHJlY2VpdmUgdmlld3MuXG4gKlxuICogQHBhcmFtIGluZGV4IFRoZSBpbmRleCBvZiB0aGUgY29udGFpbmVyIGluIHRoZSBkYXRhIGFycmF5XG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVjb250YWluZXJSZWZyZXNoU3RhcnQoaW5kZXg6IG51bWJlcik6IHZvaWQge1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IHRWaWV3ID0gbFZpZXdbVFZJRVddO1xuICBsZXQgcHJldmlvdXNPclBhcmVudFROb2RlID0gbG9hZCh0Vmlldy5kYXRhLCBpbmRleCkgYXMgVE5vZGU7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnROb2RlVHlwZShwcmV2aW91c09yUGFyZW50VE5vZGUsIFROb2RlVHlwZS5Db250YWluZXIpO1xuICBzZXRQcmV2aW91c09yUGFyZW50VE5vZGUocHJldmlvdXNPclBhcmVudFROb2RlLCB0cnVlKTtcblxuICBsVmlld1tpbmRleCArIEhFQURFUl9PRkZTRVRdW0FDVElWRV9JTkRFWF0gPSAwO1xuXG4gIC8vIFdlIG5lZWQgdG8gZXhlY3V0ZSBpbml0IGhvb2tzIGhlcmUgc28gbmdPbkluaXQgaG9va3MgYXJlIGNhbGxlZCBpbiB0b3AgbGV2ZWwgdmlld3NcbiAgLy8gYmVmb3JlIHRoZXkgYXJlIGNhbGxlZCBpbiBlbWJlZGRlZCB2aWV3cyAoZm9yIGJhY2t3YXJkcyBjb21wYXRpYmlsaXR5KS5cbiAgaWYgKCFnZXRDaGVja05vQ2hhbmdlc01vZGUoKSkge1xuICAgIGNvbnN0IGhvb2tzSW5pdFBoYXNlQ29tcGxldGVkID1cbiAgICAgICAgKGxWaWV3W0ZMQUdTXSAmIExWaWV3RmxhZ3MuSW5pdFBoYXNlU3RhdGVNYXNrKSA9PT0gSW5pdFBoYXNlU3RhdGUuSW5pdFBoYXNlQ29tcGxldGVkO1xuICAgIGlmIChob29rc0luaXRQaGFzZUNvbXBsZXRlZCkge1xuICAgICAgY29uc3QgcHJlT3JkZXJDaGVja0hvb2tzID0gdFZpZXcucHJlT3JkZXJDaGVja0hvb2tzO1xuICAgICAgaWYgKHByZU9yZGVyQ2hlY2tIb29rcyAhPT0gbnVsbCkge1xuICAgICAgICBleGVjdXRlQ2hlY2tIb29rcyhsVmlldywgcHJlT3JkZXJDaGVja0hvb2tzLCBudWxsKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgcHJlT3JkZXJIb29rcyA9IHRWaWV3LnByZU9yZGVySG9va3M7XG4gICAgICBpZiAocHJlT3JkZXJIb29rcyAhPT0gbnVsbCkge1xuICAgICAgICBleGVjdXRlSW5pdEFuZENoZWNrSG9va3MobFZpZXcsIHByZU9yZGVySG9va3MsIEluaXRQaGFzZVN0YXRlLk9uSW5pdEhvb2tzVG9CZVJ1biwgbnVsbCk7XG4gICAgICB9XG4gICAgICBpbmNyZW1lbnRJbml0UGhhc2VGbGFncyhsVmlldywgSW5pdFBoYXNlU3RhdGUuT25Jbml0SG9va3NUb0JlUnVuKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBNYXJrcyB0aGUgZW5kIG9mIHRoZSBMQ29udGFpbmVyLlxuICpcbiAqIE1hcmtpbmcgdGhlIGVuZCBvZiBMQ29udGFpbmVyIGlzIHRoZSB0aW1lIHdoZW4gdG8gY2hpbGQgdmlld3MgZ2V0IGluc2VydGVkIG9yIHJlbW92ZWQuXG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVjb250YWluZXJSZWZyZXNoRW5kKCk6IHZvaWQge1xuICBsZXQgcHJldmlvdXNPclBhcmVudFROb2RlID0gZ2V0UHJldmlvdXNPclBhcmVudFROb2RlKCk7XG4gIGlmIChnZXRJc1BhcmVudCgpKSB7XG4gICAgc2V0SXNOb3RQYXJlbnQoKTtcbiAgfSBlbHNlIHtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm9kZVR5cGUocHJldmlvdXNPclBhcmVudFROb2RlLCBUTm9kZVR5cGUuVmlldyk7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydEhhc1BhcmVudChwcmV2aW91c09yUGFyZW50VE5vZGUpO1xuICAgIHByZXZpb3VzT3JQYXJlbnRUTm9kZSA9IHByZXZpb3VzT3JQYXJlbnRUTm9kZS5wYXJlbnQgITtcbiAgICBzZXRQcmV2aW91c09yUGFyZW50VE5vZGUocHJldmlvdXNPclBhcmVudFROb2RlLCBmYWxzZSk7XG4gIH1cblxuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm9kZVR5cGUocHJldmlvdXNPclBhcmVudFROb2RlLCBUTm9kZVR5cGUuQ29udGFpbmVyKTtcblxuICBjb25zdCBsQ29udGFpbmVyOiBMQ29udGFpbmVyID0gZ2V0TFZpZXcoKVtwcmV2aW91c09yUGFyZW50VE5vZGUuaW5kZXhdO1xuICBjb25zdCBuZXh0SW5kZXggPSBsQ29udGFpbmVyW0FDVElWRV9JTkRFWF07XG5cbiAgLy8gcmVtb3ZlIGV4dHJhIHZpZXdzIGF0IHRoZSBlbmQgb2YgdGhlIGNvbnRhaW5lclxuICB3aGlsZSAobmV4dEluZGV4IDwgbENvbnRhaW5lci5sZW5ndGggLSBDT05UQUlORVJfSEVBREVSX09GRlNFVCkge1xuICAgIHJlbW92ZVZpZXcobENvbnRhaW5lciwgbmV4dEluZGV4KTtcbiAgfVxufVxuXG5mdW5jdGlvbiBjb250YWluZXJJbnRlcm5hbChcbiAgICBsVmlldzogTFZpZXcsIG5vZGVJbmRleDogbnVtYmVyLCB0YWdOYW1lOiBzdHJpbmcgfCBudWxsLFxuICAgIGF0dHJzOiBUQXR0cmlidXRlcyB8IG51bGwpOiBUQ29udGFpbmVyTm9kZSB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRFcXVhbChcbiAgICAgICAgICAgICAgICAgICBsVmlld1tCSU5ESU5HX0lOREVYXSwgbFZpZXdbVFZJRVddLmJpbmRpbmdTdGFydEluZGV4LFxuICAgICAgICAgICAgICAgICAgICdjb250YWluZXIgbm9kZXMgc2hvdWxkIGJlIGNyZWF0ZWQgYmVmb3JlIGFueSBiaW5kaW5ncycpO1xuXG4gIGNvbnN0IGFkanVzdGVkSW5kZXggPSBub2RlSW5kZXggKyBIRUFERVJfT0ZGU0VUO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGF0YUluUmFuZ2UobFZpZXcsIG5vZGVJbmRleCArIEhFQURFUl9PRkZTRVQpO1xuICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyQ3JlYXRlQ29tbWVudCsrO1xuICBjb25zdCBjb21tZW50ID0gbFZpZXdbYWRqdXN0ZWRJbmRleF0gPVxuICAgICAgbFZpZXdbUkVOREVSRVJdLmNyZWF0ZUNvbW1lbnQobmdEZXZNb2RlID8gJ2NvbnRhaW5lcicgOiAnJyk7XG4gIGNvbnN0IHROb2RlID1cbiAgICAgIGdldE9yQ3JlYXRlVE5vZGUobFZpZXdbVFZJRVddLCBsVmlld1tUX0hPU1RdLCBub2RlSW5kZXgsIFROb2RlVHlwZS5Db250YWluZXIsIHRhZ05hbWUsIGF0dHJzKTtcbiAgY29uc3QgbENvbnRhaW5lciA9IGxWaWV3W2FkanVzdGVkSW5kZXhdID0gY3JlYXRlTENvbnRhaW5lcihjb21tZW50LCBsVmlldywgY29tbWVudCwgdE5vZGUpO1xuXG4gIGFwcGVuZENoaWxkKGNvbW1lbnQsIHROb2RlLCBsVmlldyk7XG5cbiAgLy8gQ29udGFpbmVycyBhcmUgYWRkZWQgdG8gdGhlIGN1cnJlbnQgdmlldyB0cmVlIGluc3RlYWQgb2YgdGhlaXIgZW1iZWRkZWQgdmlld3NcbiAgLy8gYmVjYXVzZSB2aWV3cyBjYW4gYmUgcmVtb3ZlZCBhbmQgcmUtaW5zZXJ0ZWQuXG4gIGFkZFRvVmlld1RyZWUobFZpZXcsIGxDb250YWluZXIpO1xuXG4gIG5nRGV2TW9kZSAmJiBhc3NlcnROb2RlVHlwZShnZXRQcmV2aW91c09yUGFyZW50VE5vZGUoKSwgVE5vZGVUeXBlLkNvbnRhaW5lcik7XG4gIHJldHVybiB0Tm9kZTtcbn1cbiJdfQ==