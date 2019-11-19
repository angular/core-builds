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
import { HEADER_OFFSET, RENDERER, TVIEW, T_HOST } from '../interfaces/view';
import { appendChild, createTextNode } from '../node_manipulation';
import { getBindingIndex, getLView, setPreviousOrParentTNode } from '../state';
import { getOrCreateTNode } from './shared';
/**
 * Create static text node
 *
 * \@codeGenApi
 * @param {?} index Index of the node in the data array
 * @param {?=} value Static string value to write.
 *
 * @return {?}
 */
export function ɵɵtext(index, value = '') {
    /** @type {?} */
    const lView = getLView();
    /** @type {?} */
    const tView = lView[TVIEW];
    /** @type {?} */
    const adjustedIndex = index + HEADER_OFFSET;
    ngDevMode && assertEqual(getBindingIndex(), tView.bindingStartIndex, 'text nodes should be created before any bindings');
    ngDevMode && assertDataInRange(lView, adjustedIndex);
    /** @type {?} */
    const tNode = tView.firstCreatePass ?
        getOrCreateTNode(tView, lView[T_HOST], index, 3 /* Element */, null, null) :
        (/** @type {?} */ (tView.data[adjustedIndex]));
    /** @type {?} */
    const textNative = lView[adjustedIndex] = createTextNode(value, lView[RENDERER]);
    appendChild(textNative, tNode, lView);
    // Text nodes are self closing.
    setPreviousOrParentTNode(tNode, false);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGV4dC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvaW5zdHJ1Y3Rpb25zL3RleHQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFPQSxPQUFPLEVBQUMsaUJBQWlCLEVBQUUsV0FBVyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFFakUsT0FBTyxFQUFDLGFBQWEsRUFBRSxRQUFRLEVBQUUsS0FBSyxFQUFFLE1BQU0sRUFBQyxNQUFNLG9CQUFvQixDQUFDO0FBQzFFLE9BQU8sRUFBQyxXQUFXLEVBQUUsY0FBYyxFQUFDLE1BQU0sc0JBQXNCLENBQUM7QUFDakUsT0FBTyxFQUFDLGVBQWUsRUFBRSxRQUFRLEVBQUUsd0JBQXdCLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFFN0UsT0FBTyxFQUFDLGdCQUFnQixFQUFDLE1BQU0sVUFBVSxDQUFDOzs7Ozs7Ozs7O0FBWTFDLE1BQU0sVUFBVSxNQUFNLENBQUMsS0FBYSxFQUFFLFFBQWdCLEVBQUU7O1VBQ2hELEtBQUssR0FBRyxRQUFRLEVBQUU7O1VBQ2xCLEtBQUssR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDOztVQUNwQixhQUFhLEdBQUcsS0FBSyxHQUFHLGFBQWE7SUFFM0MsU0FBUyxJQUFJLFdBQVcsQ0FDUCxlQUFlLEVBQUUsRUFBRSxLQUFLLENBQUMsaUJBQWlCLEVBQzFDLGtEQUFrRCxDQUFDLENBQUM7SUFDckUsU0FBUyxJQUFJLGlCQUFpQixDQUFDLEtBQUssRUFBRSxhQUFhLENBQUMsQ0FBQzs7VUFFL0MsS0FBSyxHQUFHLEtBQUssQ0FBQyxlQUFlLENBQUMsQ0FBQztRQUNqQyxnQkFBZ0IsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLE1BQU0sQ0FBQyxFQUFFLEtBQUssbUJBQXFCLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO1FBQzlFLG1CQUFBLEtBQUssQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLEVBQWdCOztVQUV2QyxVQUFVLEdBQUcsS0FBSyxDQUFDLGFBQWEsQ0FBQyxHQUFHLGNBQWMsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQ2hGLFdBQVcsQ0FBQyxVQUFVLEVBQUUsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBRXRDLCtCQUErQjtJQUMvQix3QkFBd0IsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7QUFDekMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cbmltcG9ydCB7YXNzZXJ0RGF0YUluUmFuZ2UsIGFzc2VydEVxdWFsfSBmcm9tICcuLi8uLi91dGlsL2Fzc2VydCc7XG5pbXBvcnQge1RFbGVtZW50Tm9kZSwgVE5vZGVUeXBlfSBmcm9tICcuLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtIRUFERVJfT0ZGU0VULCBSRU5ERVJFUiwgVFZJRVcsIFRfSE9TVH0gZnJvbSAnLi4vaW50ZXJmYWNlcy92aWV3JztcbmltcG9ydCB7YXBwZW5kQ2hpbGQsIGNyZWF0ZVRleHROb2RlfSBmcm9tICcuLi9ub2RlX21hbmlwdWxhdGlvbic7XG5pbXBvcnQge2dldEJpbmRpbmdJbmRleCwgZ2V0TFZpZXcsIHNldFByZXZpb3VzT3JQYXJlbnRUTm9kZX0gZnJvbSAnLi4vc3RhdGUnO1xuXG5pbXBvcnQge2dldE9yQ3JlYXRlVE5vZGV9IGZyb20gJy4vc2hhcmVkJztcblxuXG5cbi8qKlxuICogQ3JlYXRlIHN0YXRpYyB0ZXh0IG5vZGVcbiAqXG4gKiBAcGFyYW0gaW5kZXggSW5kZXggb2YgdGhlIG5vZGUgaW4gdGhlIGRhdGEgYXJyYXlcbiAqIEBwYXJhbSB2YWx1ZSBTdGF0aWMgc3RyaW5nIHZhbHVlIHRvIHdyaXRlLlxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1dGV4dChpbmRleDogbnVtYmVyLCB2YWx1ZTogc3RyaW5nID0gJycpOiB2b2lkIHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCB0VmlldyA9IGxWaWV3W1RWSUVXXTtcbiAgY29uc3QgYWRqdXN0ZWRJbmRleCA9IGluZGV4ICsgSEVBREVSX09GRlNFVDtcblxuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RXF1YWwoXG4gICAgICAgICAgICAgICAgICAgZ2V0QmluZGluZ0luZGV4KCksIHRWaWV3LmJpbmRpbmdTdGFydEluZGV4LFxuICAgICAgICAgICAgICAgICAgICd0ZXh0IG5vZGVzIHNob3VsZCBiZSBjcmVhdGVkIGJlZm9yZSBhbnkgYmluZGluZ3MnKTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERhdGFJblJhbmdlKGxWaWV3LCBhZGp1c3RlZEluZGV4KTtcblxuICBjb25zdCB0Tm9kZSA9IHRWaWV3LmZpcnN0Q3JlYXRlUGFzcyA/XG4gICAgICBnZXRPckNyZWF0ZVROb2RlKHRWaWV3LCBsVmlld1tUX0hPU1RdLCBpbmRleCwgVE5vZGVUeXBlLkVsZW1lbnQsIG51bGwsIG51bGwpIDpcbiAgICAgIHRWaWV3LmRhdGFbYWRqdXN0ZWRJbmRleF0gYXMgVEVsZW1lbnROb2RlO1xuXG4gIGNvbnN0IHRleHROYXRpdmUgPSBsVmlld1thZGp1c3RlZEluZGV4XSA9IGNyZWF0ZVRleHROb2RlKHZhbHVlLCBsVmlld1tSRU5ERVJFUl0pO1xuICBhcHBlbmRDaGlsZCh0ZXh0TmF0aXZlLCB0Tm9kZSwgbFZpZXcpO1xuXG4gIC8vIFRleHQgbm9kZXMgYXJlIHNlbGYgY2xvc2luZy5cbiAgc2V0UHJldmlvdXNPclBhcmVudFROb2RlKHROb2RlLCBmYWxzZSk7XG59XG4iXX0=