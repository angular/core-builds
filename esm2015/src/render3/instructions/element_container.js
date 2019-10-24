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
import { BINDING_INDEX, HEADER_OFFSET, RENDERER, TVIEW, T_HOST } from '../interfaces/view';
import { assertNodeType } from '../node_assert';
import { appendChild } from '../node_manipulation';
import { getIsParent, getLView, getPreviousOrParentTNode, setIsNotParent, setPreviousOrParentTNode } from '../state';
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
    ngDevMode && assertEqual(lView[BINDING_INDEX], tView.bindingStartIndex, 'element containers should be created before any bindings');
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWxlbWVudF9jb250YWluZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2luc3RydWN0aW9ucy9lbGVtZW50X2NvbnRhaW5lci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQU9BLE9BQU8sRUFBQyxpQkFBaUIsRUFBRSxXQUFXLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUNqRSxPQUFPLEVBQUMsZUFBZSxFQUFDLE1BQU0sV0FBVyxDQUFDO0FBQzFDLE9BQU8sRUFBQyxlQUFlLEVBQUMsTUFBTSxzQkFBc0IsQ0FBQztBQUNyRCxPQUFPLEVBQUMsc0JBQXNCLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFFaEQsT0FBTyxFQUFDLGtCQUFrQixFQUFFLGVBQWUsRUFBQyxNQUFNLDJCQUEyQixDQUFDO0FBQzlFLE9BQU8sRUFBQyxhQUFhLEVBQUUsYUFBYSxFQUFFLFFBQVEsRUFBRSxLQUFLLEVBQUUsTUFBTSxFQUFDLE1BQU0sb0JBQW9CLENBQUM7QUFDekYsT0FBTyxFQUFDLGNBQWMsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBQzlDLE9BQU8sRUFBQyxXQUFXLEVBQUMsTUFBTSxzQkFBc0IsQ0FBQztBQUNqRCxPQUFPLEVBQUMsV0FBVyxFQUFFLFFBQVEsRUFBRSx3QkFBd0IsRUFBRSxjQUFjLEVBQUUsd0JBQXdCLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFFbkgsT0FBTyxFQUFDLHlCQUF5QixFQUFFLHFCQUFxQixFQUFFLGdCQUFnQixFQUFFLGlCQUFpQixFQUFFLHdCQUF3QixFQUFDLE1BQU0sVUFBVSxDQUFDO0FBQ3pJLE9BQU8sRUFBQyw2QkFBNkIsRUFBQyxNQUFNLFdBQVcsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7OztBQWtCeEQsTUFBTSxVQUFVLHVCQUF1QixDQUNuQyxLQUFhLEVBQUUsV0FBMkIsRUFBRSxTQUEyQjs7VUFDbkUsS0FBSyxH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QiwyQkFBNkIsQ0FBQztJQUUvRSxJQUFJLEtBQUssQ0FBQyxpQkFBaUIsRUFBRTtRQUMzQixzQkFBc0IsQ0FBQyxLQUFLLEVBQUUscUJBQXFCLENBQUMsQ0FBQztRQUNyRCxJQUFJLGtCQUFrQixDQUFDLHFCQUFxQixDQUFDLEVBQUU7WUFDN0MsbUJBQUEsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDLFVBQVUsQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDO1NBQ25EO0tBQ0Y7QUFDSCxDQUFDOzs7Ozs7Ozs7Ozs7QUFZRCxNQUFNLFVBQVUsa0JBQWtCLENBQzlCLEtBQWEsRUFBRSxXQUEyQixFQUFFLFNBQTJCO0lBQ3pFLHVCQUF1QixDQUFDLEtBQUssRUFBRSxXQUFXLEVBQUUsU0FBUyxDQUFDLENBQUM7SUFDdkQscUJBQXFCLEVBQUUsQ0FBQztBQUMxQixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0IHthc3NlcnREYXRhSW5SYW5nZSwgYXNzZXJ0RXF1YWx9IGZyb20gJy4uLy4uL3V0aWwvYXNzZXJ0JztcbmltcG9ydCB7YXNzZXJ0SGFzUGFyZW50fSBmcm9tICcuLi9hc3NlcnQnO1xuaW1wb3J0IHthdHRhY2hQYXRjaERhdGF9IGZyb20gJy4uL2NvbnRleHRfZGlzY292ZXJ5JztcbmltcG9ydCB7cmVnaXN0ZXJQb3N0T3JkZXJIb29rc30gZnJvbSAnLi4vaG9va3MnO1xuaW1wb3J0IHtUQXR0cmlidXRlcywgVE5vZGVUeXBlfSBmcm9tICcuLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtpc0NvbnRlbnRRdWVyeUhvc3QsIGlzRGlyZWN0aXZlSG9zdH0gZnJvbSAnLi4vaW50ZXJmYWNlcy90eXBlX2NoZWNrcyc7XG5pbXBvcnQge0JJTkRJTkdfSU5ERVgsIEhFQURFUl9PRkZTRVQsIFJFTkRFUkVSLCBUVklFVywgVF9IT1NUfSBmcm9tICcuLi9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHthc3NlcnROb2RlVHlwZX0gZnJvbSAnLi4vbm9kZV9hc3NlcnQnO1xuaW1wb3J0IHthcHBlbmRDaGlsZH0gZnJvbSAnLi4vbm9kZV9tYW5pcHVsYXRpb24nO1xuaW1wb3J0IHtnZXRJc1BhcmVudCwgZ2V0TFZpZXcsIGdldFByZXZpb3VzT3JQYXJlbnRUTm9kZSwgc2V0SXNOb3RQYXJlbnQsIHNldFByZXZpb3VzT3JQYXJlbnRUTm9kZX0gZnJvbSAnLi4vc3RhdGUnO1xuXG5pbXBvcnQge2NyZWF0ZURpcmVjdGl2ZXNJbnN0YW5jZXMsIGV4ZWN1dGVDb250ZW50UXVlcmllcywgZ2V0T3JDcmVhdGVUTm9kZSwgcmVzb2x2ZURpcmVjdGl2ZXMsIHNhdmVSZXNvbHZlZExvY2Fsc0luRGF0YX0gZnJvbSAnLi9zaGFyZWQnO1xuaW1wb3J0IHtyZWdpc3RlckluaXRpYWxTdHlsaW5nT25UTm9kZX0gZnJvbSAnLi9zdHlsaW5nJztcblxuXG5cbi8qKlxuICogQ3JlYXRlcyBhIGxvZ2ljYWwgY29udGFpbmVyIGZvciBvdGhlciBub2RlcyAoPG5nLWNvbnRhaW5lcj4pIGJhY2tlZCBieSBhIGNvbW1lbnQgbm9kZSBpbiB0aGUgRE9NLlxuICogVGhlIGluc3RydWN0aW9uIG11c3QgbGF0ZXIgYmUgZm9sbG93ZWQgYnkgYGVsZW1lbnRDb250YWluZXJFbmQoKWAgY2FsbC5cbiAqXG4gKiBAcGFyYW0gaW5kZXggSW5kZXggb2YgdGhlIGVsZW1lbnQgaW4gdGhlIExWaWV3IGFycmF5XG4gKiBAcGFyYW0gY29uc3RzSW5kZXggSW5kZXggb2YgdGhlIGNvbnRhaW5lciBpbiB0aGUgYGNvbnN0c2AgYXJyYXkuXG4gKiBAcGFyYW0gbG9jYWxSZWZzIEEgc2V0IG9mIGxvY2FsIHJlZmVyZW5jZSBiaW5kaW5ncyBvbiB0aGUgZWxlbWVudC5cbiAqXG4gKiBFdmVuIGlmIHRoaXMgaW5zdHJ1Y3Rpb24gYWNjZXB0cyBhIHNldCBvZiBhdHRyaWJ1dGVzIG5vIGFjdHVhbCBhdHRyaWJ1dGUgdmFsdWVzIGFyZSBwcm9wYWdhdGVkIHRvXG4gKiB0aGUgRE9NIChhcyBhIGNvbW1lbnQgbm9kZSBjYW4ndCBoYXZlIGF0dHJpYnV0ZXMpLiBBdHRyaWJ1dGVzIGFyZSBoZXJlIG9ubHkgZm9yIGRpcmVjdGl2ZVxuICogbWF0Y2hpbmcgcHVycG9zZXMgYW5kIHNldHRpbmcgaW5pdGlhbCBpbnB1dHMgb2YgZGlyZWN0aXZlcy5cbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWVsZW1lbnRDb250YWluZXJTdGFydChcbiAgICBpbmRleDogbnVtYmVyLCBjb25zdHNJbmRleD86IG51bWJlciB8IG51bGwsIGxvY2FsUmVmcz86IHN0cmluZ1tdIHwgbnVsbCk6IHZvaWQge1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IHRWaWV3ID0gbFZpZXdbVFZJRVddO1xuICBjb25zdCByZW5kZXJlciA9IGxWaWV3W1JFTkRFUkVSXTtcbiAgY29uc3QgdGFnTmFtZSA9ICduZy1jb250YWluZXInO1xuICBjb25zdCB0Vmlld0NvbnN0cyA9IHRWaWV3LmNvbnN0cztcbiAgY29uc3QgY29uc3RzID0gdFZpZXdDb25zdHMgPT09IG51bGwgfHwgY29uc3RzSW5kZXggPT0gbnVsbCA/IG51bGwgOiB0Vmlld0NvbnN0c1tjb25zdHNJbmRleF07XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRFcXVhbChcbiAgICAgICAgICAgICAgICAgICBsVmlld1tCSU5ESU5HX0lOREVYXSwgdFZpZXcuYmluZGluZ1N0YXJ0SW5kZXgsXG4gICAgICAgICAgICAgICAgICAgJ2VsZW1lbnQgY29udGFpbmVycyBzaG91bGQgYmUgY3JlYXRlZCBiZWZvcmUgYW55IGJpbmRpbmdzJyk7XG5cbiAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlckNyZWF0ZUNvbW1lbnQrKztcbiAgbmdEZXZNb2RlICYmIGFzc2VydERhdGFJblJhbmdlKGxWaWV3LCBpbmRleCArIEhFQURFUl9PRkZTRVQpO1xuICBjb25zdCBuYXRpdmUgPSBsVmlld1tpbmRleCArIEhFQURFUl9PRkZTRVRdID0gcmVuZGVyZXIuY3JlYXRlQ29tbWVudChuZ0Rldk1vZGUgPyB0YWdOYW1lIDogJycpO1xuXG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREYXRhSW5SYW5nZShsVmlldywgaW5kZXggLSAxKTtcbiAgY29uc3QgdE5vZGUgPVxuICAgICAgZ2V0T3JDcmVhdGVUTm9kZSh0VmlldywgbFZpZXdbVF9IT1NUXSwgaW5kZXgsIFROb2RlVHlwZS5FbGVtZW50Q29udGFpbmVyLCB0YWdOYW1lLCBjb25zdHMpO1xuXG4gIGlmIChjb25zdHMgJiYgdFZpZXcuZmlyc3RUZW1wbGF0ZVBhc3MpIHtcbiAgICAvLyBXaGlsZSBuZy1jb250YWluZXIgZG9lc24ndCBuZWNlc3NhcmlseSBzdXBwb3J0IHN0eWxpbmcsIHdlIHVzZSB0aGUgc3R5bGUgY29udGV4dCB0byBpZGVudGlmeVxuICAgIC8vIGFuZCBleGVjdXRlIGRpcmVjdGl2ZXMgb24gdGhlIG5nLWNvbnRhaW5lci5cbiAgICByZWdpc3RlckluaXRpYWxTdHlsaW5nT25UTm9kZSh0Tm9kZSwgY29uc3RzIGFzIFRBdHRyaWJ1dGVzLCAwKTtcbiAgfVxuXG4gIGFwcGVuZENoaWxkKG5hdGl2ZSwgdE5vZGUsIGxWaWV3KTtcbiAgYXR0YWNoUGF0Y2hEYXRhKG5hdGl2ZSwgbFZpZXcpO1xuXG4gIGlmICh0Vmlldy5maXJzdFRlbXBsYXRlUGFzcykge1xuICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUuZmlyc3RUZW1wbGF0ZVBhc3MrKztcbiAgICByZXNvbHZlRGlyZWN0aXZlcyh0VmlldywgbFZpZXcsIHROb2RlLCBsb2NhbFJlZnMgfHwgbnVsbCk7XG4gICAgaWYgKHRWaWV3LnF1ZXJpZXMpIHtcbiAgICAgIHRWaWV3LnF1ZXJpZXMuZWxlbWVudFN0YXJ0KHRWaWV3LCB0Tm9kZSk7XG4gICAgfVxuICB9XG5cbiAgaWYgKGlzRGlyZWN0aXZlSG9zdCh0Tm9kZSkpIHtcbiAgICBjcmVhdGVEaXJlY3RpdmVzSW5zdGFuY2VzKHRWaWV3LCBsVmlldywgdE5vZGUpO1xuICAgIGV4ZWN1dGVDb250ZW50UXVlcmllcyh0VmlldywgdE5vZGUsIGxWaWV3KTtcbiAgfVxuXG4gIGlmIChsb2NhbFJlZnMgIT0gbnVsbCkge1xuICAgIHNhdmVSZXNvbHZlZExvY2Fsc0luRGF0YShsVmlldywgdE5vZGUpO1xuICB9XG59XG5cbi8qKlxuICogTWFyayB0aGUgZW5kIG9mIHRoZSA8bmctY29udGFpbmVyPi5cbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWVsZW1lbnRDb250YWluZXJFbmQoKTogdm9pZCB7XG4gIGxldCBwcmV2aW91c09yUGFyZW50VE5vZGUgPSBnZXRQcmV2aW91c09yUGFyZW50VE5vZGUoKTtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCB0VmlldyA9IGxWaWV3W1RWSUVXXTtcbiAgaWYgKGdldElzUGFyZW50KCkpIHtcbiAgICBzZXRJc05vdFBhcmVudCgpO1xuICB9IGVsc2Uge1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnRIYXNQYXJlbnQocHJldmlvdXNPclBhcmVudFROb2RlKTtcbiAgICBwcmV2aW91c09yUGFyZW50VE5vZGUgPSBwcmV2aW91c09yUGFyZW50VE5vZGUucGFyZW50ICE7XG4gICAgc2V0UHJldmlvdXNPclBhcmVudFROb2RlKHByZXZpb3VzT3JQYXJlbnRUTm9kZSwgZmFsc2UpO1xuICB9XG5cbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vZGVUeXBlKHByZXZpb3VzT3JQYXJlbnRUTm9kZSwgVE5vZGVUeXBlLkVsZW1lbnRDb250YWluZXIpO1xuXG4gIGlmICh0Vmlldy5maXJzdFRlbXBsYXRlUGFzcykge1xuICAgIHJlZ2lzdGVyUG9zdE9yZGVySG9va3ModFZpZXcsIHByZXZpb3VzT3JQYXJlbnRUTm9kZSk7XG4gICAgaWYgKGlzQ29udGVudFF1ZXJ5SG9zdChwcmV2aW91c09yUGFyZW50VE5vZGUpKSB7XG4gICAgICB0Vmlldy5xdWVyaWVzICEuZWxlbWVudEVuZChwcmV2aW91c09yUGFyZW50VE5vZGUpO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIENyZWF0ZXMgYW4gZW1wdHkgbG9naWNhbCBjb250YWluZXIgdXNpbmcge0BsaW5rIGVsZW1lbnRDb250YWluZXJTdGFydH1cbiAqIGFuZCB7QGxpbmsgZWxlbWVudENvbnRhaW5lckVuZH1cbiAqXG4gKiBAcGFyYW0gaW5kZXggSW5kZXggb2YgdGhlIGVsZW1lbnQgaW4gdGhlIExWaWV3IGFycmF5XG4gKiBAcGFyYW0gY29uc3RzSW5kZXggSW5kZXggb2YgdGhlIGNvbnRhaW5lciBpbiB0aGUgYGNvbnN0c2AgYXJyYXkuXG4gKiBAcGFyYW0gbG9jYWxSZWZzIEEgc2V0IG9mIGxvY2FsIHJlZmVyZW5jZSBiaW5kaW5ncyBvbiB0aGUgZWxlbWVudC5cbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWVsZW1lbnRDb250YWluZXIoXG4gICAgaW5kZXg6IG51bWJlciwgY29uc3RzSW5kZXg/OiBudW1iZXIgfCBudWxsLCBsb2NhbFJlZnM/OiBzdHJpbmdbXSB8IG51bGwpOiB2b2lkIHtcbiAgybXJtWVsZW1lbnRDb250YWluZXJTdGFydChpbmRleCwgY29uc3RzSW5kZXgsIGxvY2FsUmVmcyk7XG4gIMm1ybVlbGVtZW50Q29udGFpbmVyRW5kKCk7XG59XG4iXX0=