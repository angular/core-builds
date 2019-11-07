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
    const tContainerNode = containerInternal(lView, index, tagName || null, (/** @type {?} */ (getConstant(tViewConsts, attrsIndex))));
    /** @type {?} */
    const localRefs = (/** @type {?} */ (getConstant(tViewConsts, localRefsIndex)));
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udGFpbmVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9pbnN0cnVjdGlvbnMvY29udGFpbmVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBT0EsT0FBTyxFQUFDLGlCQUFpQixFQUFFLFdBQVcsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQ2pFLE9BQU8sRUFBQyxlQUFlLEVBQUMsTUFBTSxXQUFXLENBQUM7QUFDMUMsT0FBTyxFQUFDLGVBQWUsRUFBQyxNQUFNLHNCQUFzQixDQUFDO0FBQ3JELE9BQU8sRUFBQyxpQkFBaUIsRUFBRSx3QkFBd0IsRUFBRSx1QkFBdUIsRUFBRSxzQkFBc0IsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUN0SCxPQUFPLEVBQUMsWUFBWSxFQUFFLHVCQUF1QixFQUFhLE1BQU0seUJBQXlCLENBQUM7QUFHMUYsT0FBTyxFQUFDLGVBQWUsRUFBQyxNQUFNLDJCQUEyQixDQUFDO0FBQzFELE9BQU8sRUFBQyxLQUFLLEVBQUUsYUFBYSxFQUFxQyxRQUFRLEVBQUUsS0FBSyxFQUFhLE1BQU0sRUFBQyxNQUFNLG9CQUFvQixDQUFDO0FBQy9ILE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUM5QyxPQUFPLEVBQUMsV0FBVyxFQUFFLFVBQVUsRUFBQyxNQUFNLHNCQUFzQixDQUFDO0FBQzdELE9BQU8sRUFBQyxlQUFlLEVBQUUscUJBQXFCLEVBQUUsV0FBVyxFQUFFLFFBQVEsRUFBRSx3QkFBd0IsRUFBRSxjQUFjLEVBQUUsd0JBQXdCLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFDM0osT0FBTyxFQUFDLFdBQVcsRUFBRSxJQUFJLEVBQUMsTUFBTSxvQkFBb0IsQ0FBQztBQUVyRCxPQUFPLEVBQUMsYUFBYSxFQUFFLHlCQUF5QixFQUFFLGdCQUFnQixFQUFFLFdBQVcsRUFBRSxXQUFXLEVBQUUs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QixDQUFDLE9BQU8sRUFBRSxLQUFLLEVBQUUsT0FBTyxFQUFFLEtBQUssQ0FBQztJQUUxRixXQUFXLENBQUMsT0FBTyxFQUFFLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQztJQUNuQyxlQUFlLENBQUMsT0FBTyxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBRWhDLGdGQUFnRjtJQUNoRixnREFBZ0Q7SUFDaEQsYUFBYSxDQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsQ0FBQztJQUVqQyxTQUFTLElBQUksY0FBYyxDQUFDLHdCQUF3QixFQUFFLG9CQUFzQixDQUFDO0lBQzdFLE9BQU8sS0FBSyxDQUFDO0FBQ2YsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cbmltcG9ydCB7YXNzZXJ0RGF0YUluUmFuZ2UsIGFzc2VydEVxdWFsfSBmcm9tICcuLi8uLi91dGlsL2Fzc2VydCc7XG5pbXBvcnQge2Fzc2VydEhhc1BhcmVudH0gZnJvbSAnLi4vYXNzZXJ0JztcbmltcG9ydCB7YXR0YWNoUGF0Y2hEYXRhfSBmcm9tICcuLi9jb250ZXh0X2Rpc2NvdmVyeSc7XG5pbXBvcnQge2V4ZWN1dGVDaGVja0hvb2tzLCBleGVjdXRlSW5pdEFuZENoZWNrSG9va3MsIGluY3JlbWVudEluaXRQaGFzZUZsYWdzLCByZWdpc3RlclBvc3RPcmRlckhvb2tzfSBmcm9tICcuLi9ob29rcyc7XG5pbXBvcnQge0FDVElWRV9JTkRFWCwgQ09OVEFJTkVSX0hFQURFUl9PRkZTRVQsIExDb250YWluZXJ9IGZyb20gJy4uL2ludGVyZmFjZXMvY29udGFpbmVyJztcbmltcG9ydCB7Q29tcG9uZW50VGVtcGxhdGV9IGZyb20gJy4uL2ludGVyZmFjZXMvZGVmaW5pdGlvbic7XG5pbXBvcnQge0xvY2FsUmVmRXh0cmFjdG9yLCBUQXR0cmlidXRlcywgVENvbnRhaW5lck5vZGUsIFROb2RlLCBUTm9kZVR5cGUsIFRWaWV3Tm9kZX0gZnJvbSAnLi4vaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB7aXNEaXJlY3RpdmVIb3N0fSBmcm9tICcuLi9pbnRlcmZhY2VzL3R5cGVfY2hlY2tzJztcbmltcG9ydCB7RkxBR1MsIEhFQURFUl9PRkZTRVQsIEluaXRQaGFzZVN0YXRlLCBMVmlldywgTFZpZXdGbGFncywgUkVOREVSRVIsIFRWSUVXLCBUVmlld1R5cGUsIFRfSE9TVH0gZnJvbSAnLi4vaW50ZXJmYWNlcy92aWV3JztcbmltcG9ydCB7YXNzZXJ0Tm9kZVR5cGV9IGZyb20gJy4uL25vZGVfYXNzZXJ0JztcbmltcG9ydCB7YXBwZW5kQ2hpbGQsIHJlbW92ZVZpZXd9IGZyb20gJy4uL25vZGVfbWFuaXB1bGF0aW9uJztcbmltcG9ydCB7Z2V0QmluZGluZ0luZGV4LCBnZXRDaGVja05vQ2hhbmdlc01vZGUsIGdldElzUGFyZW50LCBnZXRMVmlldywgZ2V0UHJldmlvdXNPclBhcmVudFROb2RlLCBzZXRJc05vdFBhcmVudCwgc2V0UHJldmlvdXNPclBhcmVudFROb2RlfSBmcm9tICcuLi9zdGF0ZSc7XG5pbXBvcnQge2dldENvbnN0YW50LCBsb2FkfSBmcm9tICcuLi91dGlsL3ZpZXdfdXRpbHMnO1xuXG5pbXBvcnQge2FkZFRvVmlld1RyZWUsIGNyZWF0ZURpcmVjdGl2ZXNJbnN0YW5jZXMsIGNyZWF0ZUxDb250YWluZXIsIGNyZWF0ZVROb2RlLCBjcmVhdGVUVmlldywgZ2V0T3JDcmVhdGVUTm9kZSwgcmVzb2x2ZURpcmVjdGl2ZXMsIHNhdmVSZXNvbHZlZExvY2Fsc0luRGF0YX0gZnJvbSAnLi9zaGFyZWQnO1xuXG5cblxuLyoqXG4gKiBDcmVhdGVzIGFuIExDb250YWluZXIgZm9yIGlubGluZSB2aWV3cywgZS5nLlxuICpcbiAqICUgaWYgKHNob3dpbmcpIHtcbiAqICAgPGRpdj48L2Rpdj5cbiAqICUgfVxuICpcbiAqIEBwYXJhbSBpbmRleCBUaGUgaW5kZXggb2YgdGhlIGNvbnRhaW5lciBpbiB0aGUgZGF0YSBhcnJheVxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1Y29udGFpbmVyKGluZGV4OiBudW1iZXIpOiB2b2lkIHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCB0Tm9kZSA9IGNvbnRhaW5lckludGVybmFsKGxWaWV3LCBpbmRleCwgbnVsbCwgbnVsbCk7XG5cbiAgaWYgKGxWaWV3W1RWSUVXXS5maXJzdENyZWF0ZVBhc3MpIHtcbiAgICB0Tm9kZS50Vmlld3MgPSBbXTtcbiAgfVxuICBzZXRJc05vdFBhcmVudCgpO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYW4gTENvbnRhaW5lciBmb3IgYW4gbmctdGVtcGxhdGUgKGR5bmFtaWNhbGx5LWluc2VydGVkIHZpZXcpLCBlLmcuXG4gKlxuICogPG5nLXRlbXBsYXRlICNmb28+XG4gKiAgICA8ZGl2PjwvZGl2PlxuICogPC9uZy10ZW1wbGF0ZT5cbiAqXG4gKiBAcGFyYW0gaW5kZXggVGhlIGluZGV4IG9mIHRoZSBjb250YWluZXIgaW4gdGhlIGRhdGEgYXJyYXlcbiAqIEBwYXJhbSB0ZW1wbGF0ZUZuIElubGluZSB0ZW1wbGF0ZVxuICogQHBhcmFtIGRlY2xzIFRoZSBudW1iZXIgb2Ygbm9kZXMsIGxvY2FsIHJlZnMsIGFuZCBwaXBlcyBmb3IgdGhpcyB0ZW1wbGF0ZVxuICogQHBhcmFtIHZhcnMgVGhlIG51bWJlciBvZiBiaW5kaW5ncyBmb3IgdGhpcyB0ZW1wbGF0ZVxuICogQHBhcmFtIHRhZ05hbWUgVGhlIG5hbWUgb2YgdGhlIGNvbnRhaW5lciBlbGVtZW50LCBpZiBhcHBsaWNhYmxlXG4gKiBAcGFyYW0gYXR0cnNJbmRleCBJbmRleCBvZiB0ZW1wbGF0ZSBhdHRyaWJ1dGVzIGluIHRoZSBgY29uc3RzYCBhcnJheS5cbiAqIEBwYXJhbSBsb2NhbFJlZnMgSW5kZXggb2YgdGhlIGxvY2FsIHJlZmVyZW5jZXMgaW4gdGhlIGBjb25zdHNgIGFycmF5LlxuICogQHBhcmFtIGxvY2FsUmVmRXh0cmFjdG9yIEEgZnVuY3Rpb24gd2hpY2ggZXh0cmFjdHMgbG9jYWwtcmVmcyB2YWx1ZXMgZnJvbSB0aGUgdGVtcGxhdGUuXG4gKiAgICAgICAgRGVmYXVsdHMgdG8gdGhlIGN1cnJlbnQgZWxlbWVudCBhc3NvY2lhdGVkIHdpdGggdGhlIGxvY2FsLXJlZi5cbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtXRlbXBsYXRlKFxuICAgIGluZGV4OiBudW1iZXIsIHRlbXBsYXRlRm46IENvbXBvbmVudFRlbXBsYXRlPGFueT58IG51bGwsIGRlY2xzOiBudW1iZXIsIHZhcnM6IG51bWJlcixcbiAgICB0YWdOYW1lPzogc3RyaW5nIHwgbnVsbCwgYXR0cnNJbmRleD86IG51bWJlciB8IG51bGwsIGxvY2FsUmVmc0luZGV4PzogbnVtYmVyIHwgbnVsbCxcbiAgICBsb2NhbFJlZkV4dHJhY3Rvcj86IExvY2FsUmVmRXh0cmFjdG9yKSB7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgdFZpZXcgPSBsVmlld1tUVklFV107XG4gIGNvbnN0IHRWaWV3Q29uc3RzID0gdFZpZXcuY29uc3RzO1xuXG4gIC8vIFRPRE86IGNvbnNpZGVyIGEgc2VwYXJhdGUgbm9kZSB0eXBlIGZvciB0ZW1wbGF0ZXNcbiAgY29uc3QgdENvbnRhaW5lck5vZGUgPSBjb250YWluZXJJbnRlcm5hbChcbiAgICAgIGxWaWV3LCBpbmRleCwgdGFnTmFtZSB8fCBudWxsLCBnZXRDb25zdGFudCh0Vmlld0NvbnN0cywgYXR0cnNJbmRleCkgYXMgVEF0dHJpYnV0ZXMpO1xuICBjb25zdCBsb2NhbFJlZnMgPSBnZXRDb25zdGFudCh0Vmlld0NvbnN0cywgbG9jYWxSZWZzSW5kZXgpIGFzIHN0cmluZ1tdO1xuICBpZiAodFZpZXcuZmlyc3RDcmVhdGVQYXNzKSB7XG4gICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5maXJzdENyZWF0ZVBhc3MrKztcbiAgICByZXNvbHZlRGlyZWN0aXZlcyh0VmlldywgbFZpZXcsIHRDb250YWluZXJOb2RlLCBsb2NhbFJlZnMpO1xuICAgIHJlZ2lzdGVyUG9zdE9yZGVySG9va3ModFZpZXcsIHRDb250YWluZXJOb2RlKTtcblxuICAgIGNvbnN0IGVtYmVkZGVkVFZpZXcgPSB0Q29udGFpbmVyTm9kZS50Vmlld3MgPSBjcmVhdGVUVmlldyhcbiAgICAgICAgVFZpZXdUeXBlLkVtYmVkZGVkLCAtMSwgdGVtcGxhdGVGbiwgZGVjbHMsIHZhcnMsIHRWaWV3LmRpcmVjdGl2ZVJlZ2lzdHJ5LFxuICAgICAgICB0Vmlldy5waXBlUmVnaXN0cnksIG51bGwsIHRWaWV3LnNjaGVtYXMsIHRWaWV3Q29uc3RzKTtcbiAgICBjb25zdCBlbWJlZGRlZFRWaWV3Tm9kZSA9IGNyZWF0ZVROb2RlKHRWaWV3LCBudWxsLCBUTm9kZVR5cGUuVmlldywgLTEsIG51bGwsIG51bGwpIGFzIFRWaWV3Tm9kZTtcbiAgICBlbWJlZGRlZFRWaWV3Tm9kZS5pbmplY3RvckluZGV4ID0gdENvbnRhaW5lck5vZGUuaW5qZWN0b3JJbmRleDtcbiAgICBlbWJlZGRlZFRWaWV3Lm5vZGUgPSBlbWJlZGRlZFRWaWV3Tm9kZTtcblxuICAgIGlmICh0Vmlldy5xdWVyaWVzICE9PSBudWxsKSB7XG4gICAgICB0Vmlldy5xdWVyaWVzLnRlbXBsYXRlKHRWaWV3LCB0Q29udGFpbmVyTm9kZSk7XG4gICAgICBlbWJlZGRlZFRWaWV3LnF1ZXJpZXMgPSB0Vmlldy5xdWVyaWVzLmVtYmVkZGVkVFZpZXcodENvbnRhaW5lck5vZGUpO1xuICAgIH1cbiAgfVxuXG4gIGlmIChpc0RpcmVjdGl2ZUhvc3QodENvbnRhaW5lck5vZGUpKSB7XG4gICAgY3JlYXRlRGlyZWN0aXZlc0luc3RhbmNlcyh0VmlldywgbFZpZXcsIHRDb250YWluZXJOb2RlKTtcbiAgfVxuICBpZiAobG9jYWxSZWZzICE9IG51bGwpIHtcbiAgICBzYXZlUmVzb2x2ZWRMb2NhbHNJbkRhdGEobFZpZXcsIHRDb250YWluZXJOb2RlLCBsb2NhbFJlZkV4dHJhY3Rvcik7XG4gIH1cblxuICBzZXRJc05vdFBhcmVudCgpO1xufVxuXG4vKipcbiAqIFNldHMgYSBjb250YWluZXIgdXAgdG8gcmVjZWl2ZSB2aWV3cy5cbiAqXG4gKiBAcGFyYW0gaW5kZXggVGhlIGluZGV4IG9mIHRoZSBjb250YWluZXIgaW4gdGhlIGRhdGEgYXJyYXlcbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWNvbnRhaW5lclJlZnJlc2hTdGFydChpbmRleDogbnVtYmVyKTogdm9pZCB7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgdFZpZXcgPSBsVmlld1tUVklFV107XG4gIGxldCBwcmV2aW91c09yUGFyZW50VE5vZGUgPSBsb2FkKHRWaWV3LmRhdGEsIGluZGV4KSBhcyBUTm9kZTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vZGVUeXBlKHByZXZpb3VzT3JQYXJlbnRUTm9kZSwgVE5vZGVUeXBlLkNvbnRhaW5lcik7XG4gIHNldFByZXZpb3VzT3JQYXJlbnRUTm9kZShwcmV2aW91c09yUGFyZW50VE5vZGUsIHRydWUpO1xuXG4gIGxWaWV3W2luZGV4ICsgSEVBREVSX09GRlNFVF1bQUNUSVZFX0lOREVYXSA9IDA7XG5cbiAgLy8gV2UgbmVlZCB0byBleGVjdXRlIGluaXQgaG9va3MgaGVyZSBzbyBuZ09uSW5pdCBob29rcyBhcmUgY2FsbGVkIGluIHRvcCBsZXZlbCB2aWV3c1xuICAvLyBiZWZvcmUgdGhleSBhcmUgY2FsbGVkIGluIGVtYmVkZGVkIHZpZXdzIChmb3IgYmFja3dhcmRzIGNvbXBhdGliaWxpdHkpLlxuICBpZiAoIWdldENoZWNrTm9DaGFuZ2VzTW9kZSgpKSB7XG4gICAgY29uc3QgaG9va3NJbml0UGhhc2VDb21wbGV0ZWQgPVxuICAgICAgICAobFZpZXdbRkxBR1NdICYgTFZpZXdGbGFncy5Jbml0UGhhc2VTdGF0ZU1hc2spID09PSBJbml0UGhhc2VTdGF0ZS5Jbml0UGhhc2VDb21wbGV0ZWQ7XG4gICAgaWYgKGhvb2tzSW5pdFBoYXNlQ29tcGxldGVkKSB7XG4gICAgICBjb25zdCBwcmVPcmRlckNoZWNrSG9va3MgPSB0Vmlldy5wcmVPcmRlckNoZWNrSG9va3M7XG4gICAgICBpZiAocHJlT3JkZXJDaGVja0hvb2tzICE9PSBudWxsKSB7XG4gICAgICAgIGV4ZWN1dGVDaGVja0hvb2tzKGxWaWV3LCBwcmVPcmRlckNoZWNrSG9va3MsIG51bGwpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBwcmVPcmRlckhvb2tzID0gdFZpZXcucHJlT3JkZXJIb29rcztcbiAgICAgIGlmIChwcmVPcmRlckhvb2tzICE9PSBudWxsKSB7XG4gICAgICAgIGV4ZWN1dGVJbml0QW5kQ2hlY2tIb29rcyhsVmlldywgcHJlT3JkZXJIb29rcywgSW5pdFBoYXNlU3RhdGUuT25Jbml0SG9va3NUb0JlUnVuLCBudWxsKTtcbiAgICAgIH1cbiAgICAgIGluY3JlbWVudEluaXRQaGFzZUZsYWdzKGxWaWV3LCBJbml0UGhhc2VTdGF0ZS5PbkluaXRIb29rc1RvQmVSdW4pO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIE1hcmtzIHRoZSBlbmQgb2YgdGhlIExDb250YWluZXIuXG4gKlxuICogTWFya2luZyB0aGUgZW5kIG9mIExDb250YWluZXIgaXMgdGhlIHRpbWUgd2hlbiB0byBjaGlsZCB2aWV3cyBnZXQgaW5zZXJ0ZWQgb3IgcmVtb3ZlZC5cbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWNvbnRhaW5lclJlZnJlc2hFbmQoKTogdm9pZCB7XG4gIGxldCBwcmV2aW91c09yUGFyZW50VE5vZGUgPSBnZXRQcmV2aW91c09yUGFyZW50VE5vZGUoKTtcbiAgaWYgKGdldElzUGFyZW50KCkpIHtcbiAgICBzZXRJc05vdFBhcmVudCgpO1xuICB9IGVsc2Uge1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnROb2RlVHlwZShwcmV2aW91c09yUGFyZW50VE5vZGUsIFROb2RlVHlwZS5WaWV3KTtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0SGFzUGFyZW50KHByZXZpb3VzT3JQYXJlbnRUTm9kZSk7XG4gICAgcHJldmlvdXNPclBhcmVudFROb2RlID0gcHJldmlvdXNPclBhcmVudFROb2RlLnBhcmVudCAhO1xuICAgIHNldFByZXZpb3VzT3JQYXJlbnRUTm9kZShwcmV2aW91c09yUGFyZW50VE5vZGUsIGZhbHNlKTtcbiAgfVxuXG4gIG5nRGV2TW9kZSAmJiBhc3NlcnROb2RlVHlwZShwcmV2aW91c09yUGFyZW50VE5vZGUsIFROb2RlVHlwZS5Db250YWluZXIpO1xuXG4gIGNvbnN0IGxDb250YWluZXI6IExDb250YWluZXIgPSBnZXRMVmlldygpW3ByZXZpb3VzT3JQYXJlbnRUTm9kZS5pbmRleF07XG4gIGNvbnN0IG5leHRJbmRleCA9IGxDb250YWluZXJbQUNUSVZFX0lOREVYXTtcblxuICAvLyByZW1vdmUgZXh0cmEgdmlld3MgYXQgdGhlIGVuZCBvZiB0aGUgY29udGFpbmVyXG4gIHdoaWxlIChuZXh0SW5kZXggPCBsQ29udGFpbmVyLmxlbmd0aCAtIENPTlRBSU5FUl9IRUFERVJfT0ZGU0VUKSB7XG4gICAgcmVtb3ZlVmlldyhsQ29udGFpbmVyLCBuZXh0SW5kZXgpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGNvbnRhaW5lckludGVybmFsKFxuICAgIGxWaWV3OiBMVmlldywgbm9kZUluZGV4OiBudW1iZXIsIHRhZ05hbWU6IHN0cmluZyB8IG51bGwsXG4gICAgYXR0cnM6IFRBdHRyaWJ1dGVzIHwgbnVsbCk6IFRDb250YWluZXJOb2RlIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydEVxdWFsKFxuICAgICAgICAgICAgICAgICAgIGdldEJpbmRpbmdJbmRleCgpLCBsVmlld1tUVklFV10uYmluZGluZ1N0YXJ0SW5kZXgsXG4gICAgICAgICAgICAgICAgICAgJ2NvbnRhaW5lciBub2RlcyBzaG91bGQgYmUgY3JlYXRlZCBiZWZvcmUgYW55IGJpbmRpbmdzJyk7XG5cbiAgY29uc3QgYWRqdXN0ZWRJbmRleCA9IG5vZGVJbmRleCArIEhFQURFUl9PRkZTRVQ7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREYXRhSW5SYW5nZShsVmlldywgbm9kZUluZGV4ICsgSEVBREVSX09GRlNFVCk7XG4gIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJDcmVhdGVDb21tZW50Kys7XG4gIGNvbnN0IGNvbW1lbnQgPSBsVmlld1thZGp1c3RlZEluZGV4XSA9XG4gICAgICBsVmlld1tSRU5ERVJFUl0uY3JlYXRlQ29tbWVudChuZ0Rldk1vZGUgPyAnY29udGFpbmVyJyA6ICcnKTtcbiAgY29uc3QgdE5vZGUgPVxuICAgICAgZ2V0T3JDcmVhdGVUTm9kZShsVmlld1tUVklFV10sIGxWaWV3W1RfSE9TVF0sIG5vZGVJbmRleCwgVE5vZGVUeXBlLkNvbnRhaW5lciwgdGFnTmFtZSwgYXR0cnMpO1xuICBjb25zdCBsQ29udGFpbmVyID0gbFZpZXdbYWRqdXN0ZWRJbmRleF0gPSBjcmVhdGVMQ29udGFpbmVyKGNvbW1lbnQsIGxWaWV3LCBjb21tZW50LCB0Tm9kZSk7XG5cbiAgYXBwZW5kQ2hpbGQoY29tbWVudCwgdE5vZGUsIGxWaWV3KTtcbiAgYXR0YWNoUGF0Y2hEYXRhKGNvbW1lbnQsIGxWaWV3KTtcblxuICAvLyBDb250YWluZXJzIGFyZSBhZGRlZCB0byB0aGUgY3VycmVudCB2aWV3IHRyZWUgaW5zdGVhZCBvZiB0aGVpciBlbWJlZGRlZCB2aWV3c1xuICAvLyBiZWNhdXNlIHZpZXdzIGNhbiBiZSByZW1vdmVkIGFuZCByZS1pbnNlcnRlZC5cbiAgYWRkVG9WaWV3VHJlZShsVmlldywgbENvbnRhaW5lcik7XG5cbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vZGVUeXBlKGdldFByZXZpb3VzT3JQYXJlbnRUTm9kZSgpLCBUTm9kZVR5cGUuQ29udGFpbmVyKTtcbiAgcmV0dXJuIHROb2RlO1xufVxuIl19