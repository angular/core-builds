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
import { registerPostOrderHooks } from '../hooks';
import { isContentQueryHost, isDirectiveHost } from '../interfaces/type_checks';
import { HEADER_OFFSET, RENDERER, TVIEW, T_HOST } from '../interfaces/view';
import { assertNodeType } from '../node_assert';
import { appendChild } from '../node_manipulation';
import { getBindingIndex, getIsParent, getLView, getPreviousOrParentTNode, setIsNotParent, setPreviousOrParentTNode } from '../state';
import { createDirectivesInstances, executeContentQueries, getOrCreateTNode, resolveDirectives, saveResolvedLocalsInData } from './shared';
import { registerInitialStylingOnTNode } from './styling';
/**
 * Creates a logical container for other nodes (<ng-container>) backed by a comment node in the DOM.
 * The instruction must later be followed by `elementContainerEnd()` call.
 *
 * \@codeGenApi
 * @param {?} index Index of the element in the LView array
 * @param {?=} constsIndex Index of the container in the `consts` array.
 * @param {?=} localRefs A set of local reference bindings on the element.
 *
 * Even if this instruction accepts a set of attributes no actual attribute values are propagated to
 * the DOM (as a comment node can't have attributes). Attributes are here only for directive
 * matching purposes and setting initial inputs of directives.
 *
 * @return {?}
 */
export function ɵɵelementContainerStart(index, constsIndex, localRefs) {
    /** @type {?} */
    const lView = getLView();
    /** @type {?} */
    const tView = lView[TVIEW];
    /** @type {?} */
    const renderer = lView[RENDERER];
    /** @type {?} */
    const tagName = 'ng-container';
    /** @type {?} */
    const tViewConsts = tView.consts;
    /** @type {?} */
    const consts = tViewConsts === null || constsIndex == null ? null : tViewConsts[constsIndex];
    ngDevMode && assertEqual(getBindingIndex(), tView.bindingStartIndex, 'element containers should be created before any bindings');
    ngDevMode && ngDevMode.rendererCreateComment++;
    ngDevMode && assertDataInRange(lView, index + HEADER_OFFSET);
    /** @type {?} */
    const native = lView[index + HEADER_OFFSET] = renderer.createComment(ngDevMode ? tagName : '');
    ngDevMode && assertDataInRange(lView, index - 1);
    /** @type {?} */
    const tNode = getOrCreateTNode(tView, lView[T_HOST], index, 4 /* ElementContainer */, tagName, consts);
    if (consts && tView.firstTemplatePass) {
        // While ng-container doesn't necessarily support styling, we use the style context to identify
        // and execute directives on the ng-container.
        registerInitialStylingOnTNode(tNode, (/** @type {?} */ (consts)), 0);
    }
    appendChild(native, tNode, lView);
    attachPatchData(native, lView);
    if (tView.firstTemplatePass) {
        ngDevMode && ngDevMode.firstTemplatePass++;
        resolveDirectives(tView, lView, tNode, localRefs || null);
        if (tView.queries) {
            tView.queries.elementStart(tView, tNode);
        }
    }
    if (isDirectiveHost(tNode)) {
        createDirectivesInstances(tView, lView, tNode);
        executeContentQueries(tView, tNode, lView);
    }
    if (localRefs != null) {
        saveResolvedLocalsInData(lView, tNode);
    }
}
/**
 * Mark the end of the <ng-container>.
 *
 * \@codeGenApi
 * @return {?}
 */
export function ɵɵelementContainerEnd() {
    /** @type {?} */
    let previousOrParentTNode = getPreviousOrParentTNode();
    /** @type {?} */
    const lView = getLView();
    /** @type {?} */
    const tView = lView[TVIEW];
    if (getIsParent()) {
        setIsNotParent();
    }
    else {
        ngDevMode && assertHasParent(previousOrParentTNode);
        previousOrParentTNode = (/** @type {?} */ (previousOrParentTNode.parent));
        setPreviousOrParentTNode(previousOrParentTNode, false);
    }
    ngDevMode && assertNodeType(previousOrParentTNode, 4 /* ElementContainer */);
    if (tView.firstTemplatePass) {
        registerPostOrderHooks(tView, previousOrParentTNode);
        if (isContentQueryHost(previousOrParentTNode)) {
            (/** @type {?} */ (tView.queries)).elementEnd(previousOrParentTNode);
        }
    }
}
/**
 * Creates an empty logical container using {\@link elementContainerStart}
 * and {\@link elementContainerEnd}
 *
 * \@codeGenApi
 * @param {?} index Index of the element in the LView array
 * @param {?=} constsIndex Index of the container in the `consts` array.
 * @param {?=} localRefs A set of local reference bindings on the element.
 *
 * @return {?}
 */
export function ɵɵelementContainer(index, constsIndex, localRefs) {
    ɵɵelementContainerStart(index, constsIndex, localRefs);
    ɵɵelementContainerEnd();
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWxlbWVudF9jb250YWluZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2luc3RydWN0aW9ucy9lbGVtZW50X2NvbnRhaW5lci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQU9BLE9BQU8sRUFBQyxpQkFBaUIsRUFBRSxXQUFXLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUNqRSxPQUFPLEVBQUMsZUFBZSxFQUFDLE1BQU0sV0FBVyxDQUFDO0FBQzFDLE9BQU8sRUFBQyxlQUFlLEVBQUMsTUFBTSxzQkFBc0IsQ0FBQztBQUNyRCxPQUFPLEVBQUMsc0JBQXNCLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFFaEQsT0FBTyxFQUFDLGtCQUFrQixFQUFFLGVBQWUsRUFBQyxNQUFNLDJCQUEyQixDQUFDO0FBQzlFLE9BQU8sRUFBQyxhQUFhLEVBQUUsUUFBUSxFQUFFLEtBQUssRUFBRSxNQUFNLEVBQUMsTUFBTSxvQkFBb0IsQ0FBQztBQUMxRSxPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFDOUMsT0FBTyxFQUFDLFdBQVcsRUFBQyxNQUFNLHNCQUFzQixDQUFDO0FBQ2pELE9BQU8sRUFBQyxlQUFlLEVBQUUsV0FBVyxFQUFFLFFBQVEsRUFBRSx3QkFBd0IsRUFBRSxjQUFjLEVBQUUsd0JBQXdCLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFFcEksT0FBTyxFQUFDLHlCQUF5QixFQUFFLHFCQUFxQixFQUFFLGdCQUFnQixFQUFFLGlCQUFpQixFQUFFLHdCQUF3QixFQUFDLE1BQU0sVUFBVSxDQUFDO0FBQ3pJLE9BQU8sRUFBQyw2QkFBNkIsRUFBQyxNQUFNLFdBQVcsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7OztBQWtCeEQsTUFBTSxVQUFVLHVCQUF1QixDQUNuQyxLQUFhLEVBQUUsV0FBMkIsRUFBRSxTQUEyQjs7VUFDbkUsS0FBSyxH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QUFDO0lBRS9FLElBQUksS0FBSyxDQUFDLGlCQUFpQixFQUFFO1FBQzNCLHNCQUFzQixDQUFDLEtBQUssRUFBRSxxQkFBcUIsQ0FBQyxDQUFDO1FBQ3JELElBQUksa0JBQWtCLENBQUMscUJBQXFCLENBQUMsRUFBRTtZQUM3QyxtQkFBQSxLQUFLLENBQUMsT0FBTyxFQUFFLENBQUMsVUFBVSxDQUFDLHFCQUFxQixDQUFDLENBQUM7U0FDbkQ7S0FDRjtBQUNILENBQUM7Ozs7Ozs7Ozs7OztBQVlELE1BQU0sVUFBVSxrQkFBa0IsQ0FDOUIsS0FBYSxFQUFFLFdBQTJCLEVBQUUsU0FBMkI7SUFDekUsdUJBQXVCLENBQUMsS0FBSyxFQUFFLFdBQVcsRUFBRSxTQUFTLENBQUMsQ0FBQztJQUN2RCxxQkFBcUIsRUFBRSxDQUFDO0FBQzFCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5pbXBvcnQge2Fzc2VydERhdGFJblJhbmdlLCBhc3NlcnRFcXVhbH0gZnJvbSAnLi4vLi4vdXRpbC9hc3NlcnQnO1xuaW1wb3J0IHthc3NlcnRIYXNQYXJlbnR9IGZyb20gJy4uL2Fzc2VydCc7XG5pbXBvcnQge2F0dGFjaFBhdGNoRGF0YX0gZnJvbSAnLi4vY29udGV4dF9kaXNjb3ZlcnknO1xuaW1wb3J0IHtyZWdpc3RlclBvc3RPcmRlckhvb2tzfSBmcm9tICcuLi9ob29rcyc7XG5pbXBvcnQge1RBdHRyaWJ1dGVzLCBUTm9kZVR5cGV9IGZyb20gJy4uL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge2lzQ29udGVudFF1ZXJ5SG9zdCwgaXNEaXJlY3RpdmVIb3N0fSBmcm9tICcuLi9pbnRlcmZhY2VzL3R5cGVfY2hlY2tzJztcbmltcG9ydCB7SEVBREVSX09GRlNFVCwgUkVOREVSRVIsIFRWSUVXLCBUX0hPU1R9IGZyb20gJy4uL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge2Fzc2VydE5vZGVUeXBlfSBmcm9tICcuLi9ub2RlX2Fzc2VydCc7XG5pbXBvcnQge2FwcGVuZENoaWxkfSBmcm9tICcuLi9ub2RlX21hbmlwdWxhdGlvbic7XG5pbXBvcnQge2dldEJpbmRpbmdJbmRleCwgZ2V0SXNQYXJlbnQsIGdldExWaWV3LCBnZXRQcmV2aW91c09yUGFyZW50VE5vZGUsIHNldElzTm90UGFyZW50LCBzZXRQcmV2aW91c09yUGFyZW50VE5vZGV9IGZyb20gJy4uL3N0YXRlJztcblxuaW1wb3J0IHtjcmVhdGVEaXJlY3RpdmVzSW5zdGFuY2VzLCBleGVjdXRlQ29udGVudFF1ZXJpZXMsIGdldE9yQ3JlYXRlVE5vZGUsIHJlc29sdmVEaXJlY3RpdmVzLCBzYXZlUmVzb2x2ZWRMb2NhbHNJbkRhdGF9IGZyb20gJy4vc2hhcmVkJztcbmltcG9ydCB7cmVnaXN0ZXJJbml0aWFsU3R5bGluZ09uVE5vZGV9IGZyb20gJy4vc3R5bGluZyc7XG5cblxuXG4vKipcbiAqIENyZWF0ZXMgYSBsb2dpY2FsIGNvbnRhaW5lciBmb3Igb3RoZXIgbm9kZXMgKDxuZy1jb250YWluZXI+KSBiYWNrZWQgYnkgYSBjb21tZW50IG5vZGUgaW4gdGhlIERPTS5cbiAqIFRoZSBpbnN0cnVjdGlvbiBtdXN0IGxhdGVyIGJlIGZvbGxvd2VkIGJ5IGBlbGVtZW50Q29udGFpbmVyRW5kKClgIGNhbGwuXG4gKlxuICogQHBhcmFtIGluZGV4IEluZGV4IG9mIHRoZSBlbGVtZW50IGluIHRoZSBMVmlldyBhcnJheVxuICogQHBhcmFtIGNvbnN0c0luZGV4IEluZGV4IG9mIHRoZSBjb250YWluZXIgaW4gdGhlIGBjb25zdHNgIGFycmF5LlxuICogQHBhcmFtIGxvY2FsUmVmcyBBIHNldCBvZiBsb2NhbCByZWZlcmVuY2UgYmluZGluZ3Mgb24gdGhlIGVsZW1lbnQuXG4gKlxuICogRXZlbiBpZiB0aGlzIGluc3RydWN0aW9uIGFjY2VwdHMgYSBzZXQgb2YgYXR0cmlidXRlcyBubyBhY3R1YWwgYXR0cmlidXRlIHZhbHVlcyBhcmUgcHJvcGFnYXRlZCB0b1xuICogdGhlIERPTSAoYXMgYSBjb21tZW50IG5vZGUgY2FuJ3QgaGF2ZSBhdHRyaWJ1dGVzKS4gQXR0cmlidXRlcyBhcmUgaGVyZSBvbmx5IGZvciBkaXJlY3RpdmVcbiAqIG1hdGNoaW5nIHB1cnBvc2VzIGFuZCBzZXR0aW5nIGluaXRpYWwgaW5wdXRzIG9mIGRpcmVjdGl2ZXMuXG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVlbGVtZW50Q29udGFpbmVyU3RhcnQoXG4gICAgaW5kZXg6IG51bWJlciwgY29uc3RzSW5kZXg/OiBudW1iZXIgfCBudWxsLCBsb2NhbFJlZnM/OiBzdHJpbmdbXSB8IG51bGwpOiB2b2lkIHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCB0VmlldyA9IGxWaWV3W1RWSUVXXTtcbiAgY29uc3QgcmVuZGVyZXIgPSBsVmlld1tSRU5ERVJFUl07XG4gIGNvbnN0IHRhZ05hbWUgPSAnbmctY29udGFpbmVyJztcbiAgY29uc3QgdFZpZXdDb25zdHMgPSB0Vmlldy5jb25zdHM7XG4gIGNvbnN0IGNvbnN0cyA9IHRWaWV3Q29uc3RzID09PSBudWxsIHx8IGNvbnN0c0luZGV4ID09IG51bGwgPyBudWxsIDogdFZpZXdDb25zdHNbY29uc3RzSW5kZXhdO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RXF1YWwoXG4gICAgICAgICAgICAgICAgICAgZ2V0QmluZGluZ0luZGV4KCksIHRWaWV3LmJpbmRpbmdTdGFydEluZGV4LFxuICAgICAgICAgICAgICAgICAgICdlbGVtZW50IGNvbnRhaW5lcnMgc2hvdWxkIGJlIGNyZWF0ZWQgYmVmb3JlIGFueSBiaW5kaW5ncycpO1xuXG4gIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJDcmVhdGVDb21tZW50Kys7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREYXRhSW5SYW5nZShsVmlldywgaW5kZXggKyBIRUFERVJfT0ZGU0VUKTtcbiAgY29uc3QgbmF0aXZlID0gbFZpZXdbaW5kZXggKyBIRUFERVJfT0ZGU0VUXSA9IHJlbmRlcmVyLmNyZWF0ZUNvbW1lbnQobmdEZXZNb2RlID8gdGFnTmFtZSA6ICcnKTtcblxuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGF0YUluUmFuZ2UobFZpZXcsIGluZGV4IC0gMSk7XG4gIGNvbnN0IHROb2RlID1cbiAgICAgIGdldE9yQ3JlYXRlVE5vZGUodFZpZXcsIGxWaWV3W1RfSE9TVF0sIGluZGV4LCBUTm9kZVR5cGUuRWxlbWVudENvbnRhaW5lciwgdGFnTmFtZSwgY29uc3RzKTtcblxuICBpZiAoY29uc3RzICYmIHRWaWV3LmZpcnN0VGVtcGxhdGVQYXNzKSB7XG4gICAgLy8gV2hpbGUgbmctY29udGFpbmVyIGRvZXNuJ3QgbmVjZXNzYXJpbHkgc3VwcG9ydCBzdHlsaW5nLCB3ZSB1c2UgdGhlIHN0eWxlIGNvbnRleHQgdG8gaWRlbnRpZnlcbiAgICAvLyBhbmQgZXhlY3V0ZSBkaXJlY3RpdmVzIG9uIHRoZSBuZy1jb250YWluZXIuXG4gICAgcmVnaXN0ZXJJbml0aWFsU3R5bGluZ09uVE5vZGUodE5vZGUsIGNvbnN0cyBhcyBUQXR0cmlidXRlcywgMCk7XG4gIH1cblxuICBhcHBlbmRDaGlsZChuYXRpdmUsIHROb2RlLCBsVmlldyk7XG4gIGF0dGFjaFBhdGNoRGF0YShuYXRpdmUsIGxWaWV3KTtcblxuICBpZiAodFZpZXcuZmlyc3RUZW1wbGF0ZVBhc3MpIHtcbiAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLmZpcnN0VGVtcGxhdGVQYXNzKys7XG4gICAgcmVzb2x2ZURpcmVjdGl2ZXModFZpZXcsIGxWaWV3LCB0Tm9kZSwgbG9jYWxSZWZzIHx8IG51bGwpO1xuICAgIGlmICh0Vmlldy5xdWVyaWVzKSB7XG4gICAgICB0Vmlldy5xdWVyaWVzLmVsZW1lbnRTdGFydCh0VmlldywgdE5vZGUpO1xuICAgIH1cbiAgfVxuXG4gIGlmIChpc0RpcmVjdGl2ZUhvc3QodE5vZGUpKSB7XG4gICAgY3JlYXRlRGlyZWN0aXZlc0luc3RhbmNlcyh0VmlldywgbFZpZXcsIHROb2RlKTtcbiAgICBleGVjdXRlQ29udGVudFF1ZXJpZXModFZpZXcsIHROb2RlLCBsVmlldyk7XG4gIH1cblxuICBpZiAobG9jYWxSZWZzICE9IG51bGwpIHtcbiAgICBzYXZlUmVzb2x2ZWRMb2NhbHNJbkRhdGEobFZpZXcsIHROb2RlKTtcbiAgfVxufVxuXG4vKipcbiAqIE1hcmsgdGhlIGVuZCBvZiB0aGUgPG5nLWNvbnRhaW5lcj4uXG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVlbGVtZW50Q29udGFpbmVyRW5kKCk6IHZvaWQge1xuICBsZXQgcHJldmlvdXNPclBhcmVudFROb2RlID0gZ2V0UHJldmlvdXNPclBhcmVudFROb2RlKCk7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgdFZpZXcgPSBsVmlld1tUVklFV107XG4gIGlmIChnZXRJc1BhcmVudCgpKSB7XG4gICAgc2V0SXNOb3RQYXJlbnQoKTtcbiAgfSBlbHNlIHtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0SGFzUGFyZW50KHByZXZpb3VzT3JQYXJlbnRUTm9kZSk7XG4gICAgcHJldmlvdXNPclBhcmVudFROb2RlID0gcHJldmlvdXNPclBhcmVudFROb2RlLnBhcmVudCAhO1xuICAgIHNldFByZXZpb3VzT3JQYXJlbnRUTm9kZShwcmV2aW91c09yUGFyZW50VE5vZGUsIGZhbHNlKTtcbiAgfVxuXG4gIG5nRGV2TW9kZSAmJiBhc3NlcnROb2RlVHlwZShwcmV2aW91c09yUGFyZW50VE5vZGUsIFROb2RlVHlwZS5FbGVtZW50Q29udGFpbmVyKTtcblxuICBpZiAodFZpZXcuZmlyc3RUZW1wbGF0ZVBhc3MpIHtcbiAgICByZWdpc3RlclBvc3RPcmRlckhvb2tzKHRWaWV3LCBwcmV2aW91c09yUGFyZW50VE5vZGUpO1xuICAgIGlmIChpc0NvbnRlbnRRdWVyeUhvc3QocHJldmlvdXNPclBhcmVudFROb2RlKSkge1xuICAgICAgdFZpZXcucXVlcmllcyAhLmVsZW1lbnRFbmQocHJldmlvdXNPclBhcmVudFROb2RlKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBDcmVhdGVzIGFuIGVtcHR5IGxvZ2ljYWwgY29udGFpbmVyIHVzaW5nIHtAbGluayBlbGVtZW50Q29udGFpbmVyU3RhcnR9XG4gKiBhbmQge0BsaW5rIGVsZW1lbnRDb250YWluZXJFbmR9XG4gKlxuICogQHBhcmFtIGluZGV4IEluZGV4IG9mIHRoZSBlbGVtZW50IGluIHRoZSBMVmlldyBhcnJheVxuICogQHBhcmFtIGNvbnN0c0luZGV4IEluZGV4IG9mIHRoZSBjb250YWluZXIgaW4gdGhlIGBjb25zdHNgIGFycmF5LlxuICogQHBhcmFtIGxvY2FsUmVmcyBBIHNldCBvZiBsb2NhbCByZWZlcmVuY2UgYmluZGluZ3Mgb24gdGhlIGVsZW1lbnQuXG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVlbGVtZW50Q29udGFpbmVyKFxuICAgIGluZGV4OiBudW1iZXIsIGNvbnN0c0luZGV4PzogbnVtYmVyIHwgbnVsbCwgbG9jYWxSZWZzPzogc3RyaW5nW10gfCBudWxsKTogdm9pZCB7XG4gIMm1ybVlbGVtZW50Q29udGFpbmVyU3RhcnQoaW5kZXgsIGNvbnN0c0luZGV4LCBsb2NhbFJlZnMpO1xuICDJtcm1ZWxlbWVudENvbnRhaW5lckVuZCgpO1xufVxuIl19