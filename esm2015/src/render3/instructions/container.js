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
import { assertFirstCreatePass, assertHasParent } from '../assert';
import { attachPatchData } from '../context_discovery';
import { executeCheckHooks, executeInitAndCheckHooks, incrementInitPhaseFlags, registerPostOrderHooks } from '../hooks';
import { ACTIVE_INDEX, CONTAINER_HEADER_OFFSET } from '../interfaces/container';
import { isDirectiveHost } from '../interfaces/type_checks';
import { FLAGS, HEADER_OFFSET, RENDERER, TVIEW, T_HOST } from '../interfaces/view';
import { assertNodeType } from '../node_assert';
import { appendChild, removeView } from '../node_manipulation';
import { getBindingIndex, getCheckNoChangesMode, getIsParent, getLView, getPreviousOrParentTNode, setIsNotParent, setPreviousOrParentTNode } from '../state';
import { getConstant, getLContainerActiveIndex, load } from '../util/view_utils';
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
 * @param {?} index
 * @param {?} tView
 * @param {?} lView
 * @param {?} templateFn
 * @param {?} decls
 * @param {?} vars
 * @param {?=} tagName
 * @param {?=} attrsIndex
 * @param {?=} localRefsIndex
 * @return {?}
 */
function templateFirstCreatePass(index, tView, lView, templateFn, decls, vars, tagName, attrsIndex, localRefsIndex) {
    ngDevMode && assertFirstCreatePass(tView);
    ngDevMode && ngDevMode.firstCreatePass++;
    /** @type {?} */
    const tViewConsts = tView.consts;
    // TODO(pk): refactor getOrCreateTNode to have the "create" only version
    /** @type {?} */
    const tNode = getOrCreateTNode(tView, lView[T_HOST], index, 0 /* Container */, tagName || null, getConstant(tViewConsts, attrsIndex));
    resolveDirectives(tView, lView, tNode, getConstant(tViewConsts, localRefsIndex));
    registerPostOrderHooks(tView, tNode);
    /** @type {?} */
    const embeddedTView = tNode.tViews = createTView(2 /* Embedded */, -1, templateFn, decls, vars, tView.directiveRegistry, tView.pipeRegistry, null, tView.schemas, tViewConsts);
    /** @type {?} */
    const embeddedTViewNode = (/** @type {?} */ (createTNode(tView, null, 2 /* View */, -1, null, null)));
    embeddedTViewNode.injectorIndex = tNode.injectorIndex;
    embeddedTView.node = embeddedTViewNode;
    if (tView.queries !== null) {
        tView.queries.template(tView, tNode);
        embeddedTView.queries = tView.queries.embeddedTView(tNode);
    }
    return tNode;
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
    const adjustedIndex = index + HEADER_OFFSET;
    /** @type {?} */
    const tNode = tView.firstCreatePass ?
        templateFirstCreatePass(index, tView, lView, templateFn, decls, vars, tagName, attrsIndex, localRefsIndex) :
        (/** @type {?} */ (tView.data[adjustedIndex]));
    setPreviousOrParentTNode(tNode, false);
    /** @type {?} */
    const comment = lView[RENDERER].createComment(ngDevMode ? 'container' : '');
    appendChild(comment, tNode, lView);
    attachPatchData(comment, lView);
    addToViewTree(lView, lView[adjustedIndex] = createLContainer(comment, lView, comment, tNode));
    if (isDirectiveHost(tNode)) {
        createDirectivesInstances(tView, lView, tNode);
    }
    if (localRefsIndex != null) {
        saveResolvedLocalsInData(lView, tNode, localRefExtractor);
    }
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
    const nextIndex = getLContainerActiveIndex(lContainer);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udGFpbmVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9pbnN0cnVjdGlvbnMvY29udGFpbmVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBT0EsT0FBTyxFQUFDLGlCQUFpQixFQUFFLFdBQVcsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQ2pFLE9BQU8sRUFBQyxxQkFBcUIsRUFBRSxlQUFlLEVBQUMsTUFBTSxXQUFXLENBQUM7QUFDakUsT0FBTyxFQUFDLGVBQWUsRUFBQyxNQUFNLHNCQUFzQixDQUFDO0FBQ3JELE9BQU8sRUFBQyxpQkFBaUIsRUFBRSx3QkFBd0IsRUFBRSx1QkFBdUIsRUFBRSxzQkFBc0IsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUN0SCxPQUFPLEVBQUMsWUFBWSxFQUFFLHVCQUF1QixFQUFhLE1BQU0seUJBQXlCLENBQUM7QUFHMUYsT0FBTyxFQUFDLGVBQWUsRUFBQyxNQUFNLDJCQUEyQixDQUFDO0FBQzFELE9BQU8sRUFBQyxLQUFLLEVBQUUsYUFBYSxFQUFxQyxRQUFRLEVBQUUsS0FBSyxFQUFvQixNQUFNLEVBQUMsTUFBTSxvQkFBb0IsQ0FBQztBQUN0SSxPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFDOUMsT0FBTyxFQUFDLFdBQVcsRUFBRSxVQUFVLEVBQUMsTUFBTSxzQkFBc0IsQ0FBQztBQUM3RCxPQUFPLEVBQUMsZUFBZSxFQUFFLHFCQUFxQixFQUFFLFdBQVcsRUFBRSxRQUFRLEVBQUUsd0JBQXdCLEVBQUUsY0FBYyxFQUFFLHdCQUF3QixFQUFDLE1BQU0sVUFBVSxDQUFDO0FBQzNKLE9BQU8sRUFBQyxXQUFXLEVBQUUsd0JBQXdCLEVBQUUsSUFBSSxFQUFDLE1BQU0sb0JBQW9CLENBQUM7QUFFL0UsT0FBTyxFQUFDLGFBQWEsRUFBRSx5QkFBeUIsRUFBRSxnQkFBZ0Is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aEYsZ0RBQWdEO0lBQ2hELGFBQWEsQ0FBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLENBQUM7SUFFakMsU0FBUyxJQUFJLGNBQWMsQ0FBQyx3QkFBd0IsRUFBRSxvQkFBc0IsQ0FBQztJQUM3RSxPQUFPLEtBQUssQ0FBQztBQUNmLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5pbXBvcnQge2Fzc2VydERhdGFJblJhbmdlLCBhc3NlcnRFcXVhbH0gZnJvbSAnLi4vLi4vdXRpbC9hc3NlcnQnO1xuaW1wb3J0IHthc3NlcnRGaXJzdENyZWF0ZVBhc3MsIGFzc2VydEhhc1BhcmVudH0gZnJvbSAnLi4vYXNzZXJ0JztcbmltcG9ydCB7YXR0YWNoUGF0Y2hEYXRhfSBmcm9tICcuLi9jb250ZXh0X2Rpc2NvdmVyeSc7XG5pbXBvcnQge2V4ZWN1dGVDaGVja0hvb2tzLCBleGVjdXRlSW5pdEFuZENoZWNrSG9va3MsIGluY3JlbWVudEluaXRQaGFzZUZsYWdzLCByZWdpc3RlclBvc3RPcmRlckhvb2tzfSBmcm9tICcuLi9ob29rcyc7XG5pbXBvcnQge0FDVElWRV9JTkRFWCwgQ09OVEFJTkVSX0hFQURFUl9PRkZTRVQsIExDb250YWluZXJ9IGZyb20gJy4uL2ludGVyZmFjZXMvY29udGFpbmVyJztcbmltcG9ydCB7Q29tcG9uZW50VGVtcGxhdGV9IGZyb20gJy4uL2ludGVyZmFjZXMvZGVmaW5pdGlvbic7XG5pbXBvcnQge0xvY2FsUmVmRXh0cmFjdG9yLCBUQXR0cmlidXRlcywgVENvbnRhaW5lck5vZGUsIFROb2RlLCBUTm9kZVR5cGUsIFRWaWV3Tm9kZX0gZnJvbSAnLi4vaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB7aXNEaXJlY3RpdmVIb3N0fSBmcm9tICcuLi9pbnRlcmZhY2VzL3R5cGVfY2hlY2tzJztcbmltcG9ydCB7RkxBR1MsIEhFQURFUl9PRkZTRVQsIEluaXRQaGFzZVN0YXRlLCBMVmlldywgTFZpZXdGbGFncywgUkVOREVSRVIsIFRWSUVXLCBUVmlldywgVFZpZXdUeXBlLCBUX0hPU1R9IGZyb20gJy4uL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge2Fzc2VydE5vZGVUeXBlfSBmcm9tICcuLi9ub2RlX2Fzc2VydCc7XG5pbXBvcnQge2FwcGVuZENoaWxkLCByZW1vdmVWaWV3fSBmcm9tICcuLi9ub2RlX21hbmlwdWxhdGlvbic7XG5pbXBvcnQge2dldEJpbmRpbmdJbmRleCwgZ2V0Q2hlY2tOb0NoYW5nZXNNb2RlLCBnZXRJc1BhcmVudCwgZ2V0TFZpZXcsIGdldFByZXZpb3VzT3JQYXJlbnRUTm9kZSwgc2V0SXNOb3RQYXJlbnQsIHNldFByZXZpb3VzT3JQYXJlbnRUTm9kZX0gZnJvbSAnLi4vc3RhdGUnO1xuaW1wb3J0IHtnZXRDb25zdGFudCwgZ2V0TENvbnRhaW5lckFjdGl2ZUluZGV4LCBsb2FkfSBmcm9tICcuLi91dGlsL3ZpZXdfdXRpbHMnO1xuXG5pbXBvcnQge2FkZFRvVmlld1RyZWUsIGNyZWF0ZURpcmVjdGl2ZXNJbnN0YW5jZXMsIGNyZWF0ZUxDb250YWluZXIsIGNyZWF0ZVROb2RlLCBjcmVhdGVUVmlldywgZ2V0T3JDcmVhdGVUTm9kZSwgcmVzb2x2ZURpcmVjdGl2ZXMsIHNhdmVSZXNvbHZlZExvY2Fsc0luRGF0YX0gZnJvbSAnLi9zaGFyZWQnO1xuXG5cblxuLyoqXG4gKiBDcmVhdGVzIGFuIExDb250YWluZXIgZm9yIGlubGluZSB2aWV3cywgZS5nLlxuICpcbiAqICUgaWYgKHNob3dpbmcpIHtcbiAqICAgPGRpdj48L2Rpdj5cbiAqICUgfVxuICpcbiAqIEBwYXJhbSBpbmRleCBUaGUgaW5kZXggb2YgdGhlIGNvbnRhaW5lciBpbiB0aGUgZGF0YSBhcnJheVxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1Y29udGFpbmVyKGluZGV4OiBudW1iZXIpOiB2b2lkIHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCB0Tm9kZSA9IGNvbnRhaW5lckludGVybmFsKGxWaWV3LCBpbmRleCwgbnVsbCwgbnVsbCk7XG5cbiAgaWYgKGxWaWV3W1RWSUVXXS5maXJzdENyZWF0ZVBhc3MpIHtcbiAgICB0Tm9kZS50Vmlld3MgPSBbXTtcbiAgfVxuICBzZXRJc05vdFBhcmVudCgpO1xufVxuXG5mdW5jdGlvbiB0ZW1wbGF0ZUZpcnN0Q3JlYXRlUGFzcyhcbiAgICBpbmRleDogbnVtYmVyLCB0VmlldzogVFZpZXcsIGxWaWV3OiBMVmlldywgdGVtcGxhdGVGbjogQ29tcG9uZW50VGVtcGxhdGU8YW55PnwgbnVsbCxcbiAgICBkZWNsczogbnVtYmVyLCB2YXJzOiBudW1iZXIsIHRhZ05hbWU/OiBzdHJpbmcgfCBudWxsLCBhdHRyc0luZGV4PzogbnVtYmVyIHwgbnVsbCxcbiAgICBsb2NhbFJlZnNJbmRleD86IG51bWJlciB8IG51bGwpOiBUQ29udGFpbmVyTm9kZSB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRGaXJzdENyZWF0ZVBhc3ModFZpZXcpO1xuICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLmZpcnN0Q3JlYXRlUGFzcysrO1xuICBjb25zdCB0Vmlld0NvbnN0cyA9IHRWaWV3LmNvbnN0cztcbiAgLy8gVE9ETyhwayk6IHJlZmFjdG9yIGdldE9yQ3JlYXRlVE5vZGUgdG8gaGF2ZSB0aGUgXCJjcmVhdGVcIiBvbmx5IHZlcnNpb25cbiAgY29uc3QgdE5vZGUgPSBnZXRPckNyZWF0ZVROb2RlKFxuICAgICAgdFZpZXcsIGxWaWV3W1RfSE9TVF0sIGluZGV4LCBUTm9kZVR5cGUuQ29udGFpbmVyLCB0YWdOYW1lIHx8IG51bGwsXG4gICAgICBnZXRDb25zdGFudDxUQXR0cmlidXRlcz4odFZpZXdDb25zdHMsIGF0dHJzSW5kZXgpKTtcblxuICByZXNvbHZlRGlyZWN0aXZlcyh0VmlldywgbFZpZXcsIHROb2RlLCBnZXRDb25zdGFudDxzdHJpbmdbXT4odFZpZXdDb25zdHMsIGxvY2FsUmVmc0luZGV4KSk7XG4gIHJlZ2lzdGVyUG9zdE9yZGVySG9va3ModFZpZXcsIHROb2RlKTtcblxuICBjb25zdCBlbWJlZGRlZFRWaWV3ID0gdE5vZGUudFZpZXdzID0gY3JlYXRlVFZpZXcoXG4gICAgICBUVmlld1R5cGUuRW1iZWRkZWQsIC0xLCB0ZW1wbGF0ZUZuLCBkZWNscywgdmFycywgdFZpZXcuZGlyZWN0aXZlUmVnaXN0cnksIHRWaWV3LnBpcGVSZWdpc3RyeSxcbiAgICAgIG51bGwsIHRWaWV3LnNjaGVtYXMsIHRWaWV3Q29uc3RzKTtcbiAgY29uc3QgZW1iZWRkZWRUVmlld05vZGUgPSBjcmVhdGVUTm9kZSh0VmlldywgbnVsbCwgVE5vZGVUeXBlLlZpZXcsIC0xLCBudWxsLCBudWxsKSBhcyBUVmlld05vZGU7XG4gIGVtYmVkZGVkVFZpZXdOb2RlLmluamVjdG9ySW5kZXggPSB0Tm9kZS5pbmplY3RvckluZGV4O1xuICBlbWJlZGRlZFRWaWV3Lm5vZGUgPSBlbWJlZGRlZFRWaWV3Tm9kZTtcblxuICBpZiAodFZpZXcucXVlcmllcyAhPT0gbnVsbCkge1xuICAgIHRWaWV3LnF1ZXJpZXMudGVtcGxhdGUodFZpZXcsIHROb2RlKTtcbiAgICBlbWJlZGRlZFRWaWV3LnF1ZXJpZXMgPSB0Vmlldy5xdWVyaWVzLmVtYmVkZGVkVFZpZXcodE5vZGUpO1xuICB9XG5cbiAgcmV0dXJuIHROb2RlO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYW4gTENvbnRhaW5lciBmb3IgYW4gbmctdGVtcGxhdGUgKGR5bmFtaWNhbGx5LWluc2VydGVkIHZpZXcpLCBlLmcuXG4gKlxuICogPG5nLXRlbXBsYXRlICNmb28+XG4gKiAgICA8ZGl2PjwvZGl2PlxuICogPC9uZy10ZW1wbGF0ZT5cbiAqXG4gKiBAcGFyYW0gaW5kZXggVGhlIGluZGV4IG9mIHRoZSBjb250YWluZXIgaW4gdGhlIGRhdGEgYXJyYXlcbiAqIEBwYXJhbSB0ZW1wbGF0ZUZuIElubGluZSB0ZW1wbGF0ZVxuICogQHBhcmFtIGRlY2xzIFRoZSBudW1iZXIgb2Ygbm9kZXMsIGxvY2FsIHJlZnMsIGFuZCBwaXBlcyBmb3IgdGhpcyB0ZW1wbGF0ZVxuICogQHBhcmFtIHZhcnMgVGhlIG51bWJlciBvZiBiaW5kaW5ncyBmb3IgdGhpcyB0ZW1wbGF0ZVxuICogQHBhcmFtIHRhZ05hbWUgVGhlIG5hbWUgb2YgdGhlIGNvbnRhaW5lciBlbGVtZW50LCBpZiBhcHBsaWNhYmxlXG4gKiBAcGFyYW0gYXR0cnNJbmRleCBJbmRleCBvZiB0ZW1wbGF0ZSBhdHRyaWJ1dGVzIGluIHRoZSBgY29uc3RzYCBhcnJheS5cbiAqIEBwYXJhbSBsb2NhbFJlZnMgSW5kZXggb2YgdGhlIGxvY2FsIHJlZmVyZW5jZXMgaW4gdGhlIGBjb25zdHNgIGFycmF5LlxuICogQHBhcmFtIGxvY2FsUmVmRXh0cmFjdG9yIEEgZnVuY3Rpb24gd2hpY2ggZXh0cmFjdHMgbG9jYWwtcmVmcyB2YWx1ZXMgZnJvbSB0aGUgdGVtcGxhdGUuXG4gKiAgICAgICAgRGVmYXVsdHMgdG8gdGhlIGN1cnJlbnQgZWxlbWVudCBhc3NvY2lhdGVkIHdpdGggdGhlIGxvY2FsLXJlZi5cbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtXRlbXBsYXRlKFxuICAgIGluZGV4OiBudW1iZXIsIHRlbXBsYXRlRm46IENvbXBvbmVudFRlbXBsYXRlPGFueT58IG51bGwsIGRlY2xzOiBudW1iZXIsIHZhcnM6IG51bWJlcixcbiAgICB0YWdOYW1lPzogc3RyaW5nIHwgbnVsbCwgYXR0cnNJbmRleD86IG51bWJlciB8IG51bGwsIGxvY2FsUmVmc0luZGV4PzogbnVtYmVyIHwgbnVsbCxcbiAgICBsb2NhbFJlZkV4dHJhY3Rvcj86IExvY2FsUmVmRXh0cmFjdG9yKSB7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgdFZpZXcgPSBsVmlld1tUVklFV107XG4gIGNvbnN0IGFkanVzdGVkSW5kZXggPSBpbmRleCArIEhFQURFUl9PRkZTRVQ7XG5cbiAgY29uc3QgdE5vZGUgPSB0Vmlldy5maXJzdENyZWF0ZVBhc3MgP1xuICAgICAgdGVtcGxhdGVGaXJzdENyZWF0ZVBhc3MoXG4gICAgICAgICAgaW5kZXgsIHRWaWV3LCBsVmlldywgdGVtcGxhdGVGbiwgZGVjbHMsIHZhcnMsIHRhZ05hbWUsIGF0dHJzSW5kZXgsIGxvY2FsUmVmc0luZGV4KSA6XG4gICAgICB0Vmlldy5kYXRhW2FkanVzdGVkSW5kZXhdIGFzIFRDb250YWluZXJOb2RlO1xuICBzZXRQcmV2aW91c09yUGFyZW50VE5vZGUodE5vZGUsIGZhbHNlKTtcblxuICBjb25zdCBjb21tZW50ID0gbFZpZXdbUkVOREVSRVJdLmNyZWF0ZUNvbW1lbnQobmdEZXZNb2RlID8gJ2NvbnRhaW5lcicgOiAnJyk7XG4gIGFwcGVuZENoaWxkKGNvbW1lbnQsIHROb2RlLCBsVmlldyk7XG4gIGF0dGFjaFBhdGNoRGF0YShjb21tZW50LCBsVmlldyk7XG5cbiAgYWRkVG9WaWV3VHJlZShsVmlldywgbFZpZXdbYWRqdXN0ZWRJbmRleF0gPSBjcmVhdGVMQ29udGFpbmVyKGNvbW1lbnQsIGxWaWV3LCBjb21tZW50LCB0Tm9kZSkpO1xuXG4gIGlmIChpc0RpcmVjdGl2ZUhvc3QodE5vZGUpKSB7XG4gICAgY3JlYXRlRGlyZWN0aXZlc0luc3RhbmNlcyh0VmlldywgbFZpZXcsIHROb2RlKTtcbiAgfVxuXG4gIGlmIChsb2NhbFJlZnNJbmRleCAhPSBudWxsKSB7XG4gICAgc2F2ZVJlc29sdmVkTG9jYWxzSW5EYXRhKGxWaWV3LCB0Tm9kZSwgbG9jYWxSZWZFeHRyYWN0b3IpO1xuICB9XG59XG5cbi8qKlxuICogU2V0cyBhIGNvbnRhaW5lciB1cCB0byByZWNlaXZlIHZpZXdzLlxuICpcbiAqIEBwYXJhbSBpbmRleCBUaGUgaW5kZXggb2YgdGhlIGNvbnRhaW5lciBpbiB0aGUgZGF0YSBhcnJheVxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1Y29udGFpbmVyUmVmcmVzaFN0YXJ0KGluZGV4OiBudW1iZXIpOiB2b2lkIHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCB0VmlldyA9IGxWaWV3W1RWSUVXXTtcbiAgbGV0IHByZXZpb3VzT3JQYXJlbnRUTm9kZSA9IGxvYWQodFZpZXcuZGF0YSwgaW5kZXgpIGFzIFROb2RlO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm9kZVR5cGUocHJldmlvdXNPclBhcmVudFROb2RlLCBUTm9kZVR5cGUuQ29udGFpbmVyKTtcbiAgc2V0UHJldmlvdXNPclBhcmVudFROb2RlKHByZXZpb3VzT3JQYXJlbnRUTm9kZSwgdHJ1ZSk7XG5cbiAgbFZpZXdbaW5kZXggKyBIRUFERVJfT0ZGU0VUXVtBQ1RJVkVfSU5ERVhdID0gMDtcblxuICAvLyBXZSBuZWVkIHRvIGV4ZWN1dGUgaW5pdCBob29rcyBoZXJlIHNvIG5nT25Jbml0IGhvb2tzIGFyZSBjYWxsZWQgaW4gdG9wIGxldmVsIHZpZXdzXG4gIC8vIGJlZm9yZSB0aGV5IGFyZSBjYWxsZWQgaW4gZW1iZWRkZWQgdmlld3MgKGZvciBiYWNrd2FyZHMgY29tcGF0aWJpbGl0eSkuXG4gIGlmICghZ2V0Q2hlY2tOb0NoYW5nZXNNb2RlKCkpIHtcbiAgICBjb25zdCBob29rc0luaXRQaGFzZUNvbXBsZXRlZCA9XG4gICAgICAgIChsVmlld1tGTEFHU10gJiBMVmlld0ZsYWdzLkluaXRQaGFzZVN0YXRlTWFzaykgPT09IEluaXRQaGFzZVN0YXRlLkluaXRQaGFzZUNvbXBsZXRlZDtcbiAgICBpZiAoaG9va3NJbml0UGhhc2VDb21wbGV0ZWQpIHtcbiAgICAgIGNvbnN0IHByZU9yZGVyQ2hlY2tIb29rcyA9IHRWaWV3LnByZU9yZGVyQ2hlY2tIb29rcztcbiAgICAgIGlmIChwcmVPcmRlckNoZWNrSG9va3MgIT09IG51bGwpIHtcbiAgICAgICAgZXhlY3V0ZUNoZWNrSG9va3MobFZpZXcsIHByZU9yZGVyQ2hlY2tIb29rcywgbnVsbCk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IHByZU9yZGVySG9va3MgPSB0Vmlldy5wcmVPcmRlckhvb2tzO1xuICAgICAgaWYgKHByZU9yZGVySG9va3MgIT09IG51bGwpIHtcbiAgICAgICAgZXhlY3V0ZUluaXRBbmRDaGVja0hvb2tzKGxWaWV3LCBwcmVPcmRlckhvb2tzLCBJbml0UGhhc2VTdGF0ZS5PbkluaXRIb29rc1RvQmVSdW4sIG51bGwpO1xuICAgICAgfVxuICAgICAgaW5jcmVtZW50SW5pdFBoYXNlRmxhZ3MobFZpZXcsIEluaXRQaGFzZVN0YXRlLk9uSW5pdEhvb2tzVG9CZVJ1bik7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogTWFya3MgdGhlIGVuZCBvZiB0aGUgTENvbnRhaW5lci5cbiAqXG4gKiBNYXJraW5nIHRoZSBlbmQgb2YgTENvbnRhaW5lciBpcyB0aGUgdGltZSB3aGVuIHRvIGNoaWxkIHZpZXdzIGdldCBpbnNlcnRlZCBvciByZW1vdmVkLlxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1Y29udGFpbmVyUmVmcmVzaEVuZCgpOiB2b2lkIHtcbiAgbGV0IHByZXZpb3VzT3JQYXJlbnRUTm9kZSA9IGdldFByZXZpb3VzT3JQYXJlbnRUTm9kZSgpO1xuICBpZiAoZ2V0SXNQYXJlbnQoKSkge1xuICAgIHNldElzTm90UGFyZW50KCk7XG4gIH0gZWxzZSB7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydE5vZGVUeXBlKHByZXZpb3VzT3JQYXJlbnRUTm9kZSwgVE5vZGVUeXBlLlZpZXcpO1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnRIYXNQYXJlbnQocHJldmlvdXNPclBhcmVudFROb2RlKTtcbiAgICBwcmV2aW91c09yUGFyZW50VE5vZGUgPSBwcmV2aW91c09yUGFyZW50VE5vZGUucGFyZW50ICE7XG4gICAgc2V0UHJldmlvdXNPclBhcmVudFROb2RlKHByZXZpb3VzT3JQYXJlbnRUTm9kZSwgZmFsc2UpO1xuICB9XG5cbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vZGVUeXBlKHByZXZpb3VzT3JQYXJlbnRUTm9kZSwgVE5vZGVUeXBlLkNvbnRhaW5lcik7XG5cbiAgY29uc3QgbENvbnRhaW5lcjogTENvbnRhaW5lciA9IGdldExWaWV3KClbcHJldmlvdXNPclBhcmVudFROb2RlLmluZGV4XTtcbiAgY29uc3QgbmV4dEluZGV4ID0gZ2V0TENvbnRhaW5lckFjdGl2ZUluZGV4KGxDb250YWluZXIpO1xuXG4gIC8vIHJlbW92ZSBleHRyYSB2aWV3cyBhdCB0aGUgZW5kIG9mIHRoZSBjb250YWluZXJcbiAgd2hpbGUgKG5leHRJbmRleCA8IGxDb250YWluZXIubGVuZ3RoIC0gQ09OVEFJTkVSX0hFQURFUl9PRkZTRVQpIHtcbiAgICByZW1vdmVWaWV3KGxDb250YWluZXIsIG5leHRJbmRleCk7XG4gIH1cbn1cblxuZnVuY3Rpb24gY29udGFpbmVySW50ZXJuYWwoXG4gICAgbFZpZXc6IExWaWV3LCBub2RlSW5kZXg6IG51bWJlciwgdGFnTmFtZTogc3RyaW5nIHwgbnVsbCxcbiAgICBhdHRyczogVEF0dHJpYnV0ZXMgfCBudWxsKTogVENvbnRhaW5lck5vZGUge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RXF1YWwoXG4gICAgICAgICAgICAgICAgICAgZ2V0QmluZGluZ0luZGV4KCksIGxWaWV3W1RWSUVXXS5iaW5kaW5nU3RhcnRJbmRleCxcbiAgICAgICAgICAgICAgICAgICAnY29udGFpbmVyIG5vZGVzIHNob3VsZCBiZSBjcmVhdGVkIGJlZm9yZSBhbnkgYmluZGluZ3MnKTtcblxuICBjb25zdCBhZGp1c3RlZEluZGV4ID0gbm9kZUluZGV4ICsgSEVBREVSX09GRlNFVDtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERhdGFJblJhbmdlKGxWaWV3LCBub2RlSW5kZXggKyBIRUFERVJfT0ZGU0VUKTtcbiAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlckNyZWF0ZUNvbW1lbnQrKztcbiAgY29uc3QgY29tbWVudCA9IGxWaWV3W2FkanVzdGVkSW5kZXhdID1cbiAgICAgIGxWaWV3W1JFTkRFUkVSXS5jcmVhdGVDb21tZW50KG5nRGV2TW9kZSA/ICdjb250YWluZXInIDogJycpO1xuICBjb25zdCB0Tm9kZSA9XG4gICAgICBnZXRPckNyZWF0ZVROb2RlKGxWaWV3W1RWSUVXXSwgbFZpZXdbVF9IT1NUXSwgbm9kZUluZGV4LCBUTm9kZVR5cGUuQ29udGFpbmVyLCB0YWdOYW1lLCBhdHRycyk7XG4gIGNvbnN0IGxDb250YWluZXIgPSBsVmlld1thZGp1c3RlZEluZGV4XSA9IGNyZWF0ZUxDb250YWluZXIoY29tbWVudCwgbFZpZXcsIGNvbW1lbnQsIHROb2RlKTtcblxuICBhcHBlbmRDaGlsZChjb21tZW50LCB0Tm9kZSwgbFZpZXcpO1xuICBhdHRhY2hQYXRjaERhdGEoY29tbWVudCwgbFZpZXcpO1xuXG4gIC8vIENvbnRhaW5lcnMgYXJlIGFkZGVkIHRvIHRoZSBjdXJyZW50IHZpZXcgdHJlZSBpbnN0ZWFkIG9mIHRoZWlyIGVtYmVkZGVkIHZpZXdzXG4gIC8vIGJlY2F1c2Ugdmlld3MgY2FuIGJlIHJlbW92ZWQgYW5kIHJlLWluc2VydGVkLlxuICBhZGRUb1ZpZXdUcmVlKGxWaWV3LCBsQ29udGFpbmVyKTtcblxuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm9kZVR5cGUoZ2V0UHJldmlvdXNPclBhcmVudFROb2RlKCksIFROb2RlVHlwZS5Db250YWluZXIpO1xuICByZXR1cm4gdE5vZGU7XG59Il19