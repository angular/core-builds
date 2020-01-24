/**
 * @fileoverview added by tsickle
 * Generated from: packages/core/src/render3/instructions/text.ts
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGV4dC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvaW5zdHJ1Y3Rpb25zL3RleHQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBT0EsT0FBTyxFQUFDLGlCQUFpQixFQUFFLFdBQVcsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBRWpFLE9BQU8sRUFBQyxhQUFhLEVBQUUsUUFBUSxFQUFFLEtBQUssRUFBRSxNQUFNLEVBQUMsTUFBTSxvQkFBb0IsQ0FBQztBQUMxRSxPQUFPLEVBQUMsV0FBVyxFQUFFLGNBQWMsRUFBQyxNQUFNLHNCQUFzQixDQUFDO0FBQ2pFLE9BQU8sRUFBQyxlQUFlLEVBQUUsUUFBUSxFQUFFLHdCQUF3QixFQUFDLE1BQU0sVUFBVSxDQUFDO0FBRTdFLE9BQU8sRUFBQyxnQkFBZ0IsRUFBQyxNQUFNLFVBQVUsQ0FBQzs7Ozs7Ozs7OztBQVkxQyxNQUFNLFVBQVUsTUFBTSxDQUFDLEtBQWEsRUFBRSxRQUFnQixFQUFFOztVQUNoRCxLQUFLLEdBQUcsUUFBUSxFQUFFOztVQUNsQixLQUFLLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQzs7VUFDcEIsYUFBYSxHQUFHLEtBQUssR0FBRyxhQUFhO0lBRTNDLFNBQVMsSUFBSSxXQUFXLENBQ1AsZUFBZSxFQUFFLEVBQUUsS0FBSyxDQUFDLGlCQUFpQixFQUMxQyxrREFBa0QsQ0FBQyxDQUFDO0lBQ3JFLFNBQVMsSUFBSSxpQkFBaUIsQ0FBQyxLQUFLLEVBQUUsYUFBYSxDQUFDLENBQUM7O1VBRS9DLEtBQUssR0FBRyxLQUFLLENBQUMsZUFBZSxDQUFDLENBQUM7UUFDakMsZ0JBQWdCLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxNQUFNLENBQUMsRUFBRSxLQUFLLG1CQUFxQixJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztRQUM5RSxtQkFBQSxLQUFLLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxFQUFnQjs7VUFFdkMsVUFBVSxHQUFHLEtBQUssQ0FBQyxhQUFhLENBQUMsR0FBRyxjQUFjLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUNoRixXQUFXLENBQUMsVUFBVSxFQUFFLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQztJQUV0QywrQkFBK0I7SUFDL0Isd0JBQXdCLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO0FBQ3pDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5pbXBvcnQge2Fzc2VydERhdGFJblJhbmdlLCBhc3NlcnRFcXVhbH0gZnJvbSAnLi4vLi4vdXRpbC9hc3NlcnQnO1xuaW1wb3J0IHtURWxlbWVudE5vZGUsIFROb2RlVHlwZX0gZnJvbSAnLi4vaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB7SEVBREVSX09GRlNFVCwgUkVOREVSRVIsIFRWSUVXLCBUX0hPU1R9IGZyb20gJy4uL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge2FwcGVuZENoaWxkLCBjcmVhdGVUZXh0Tm9kZX0gZnJvbSAnLi4vbm9kZV9tYW5pcHVsYXRpb24nO1xuaW1wb3J0IHtnZXRCaW5kaW5nSW5kZXgsIGdldExWaWV3LCBzZXRQcmV2aW91c09yUGFyZW50VE5vZGV9IGZyb20gJy4uL3N0YXRlJztcblxuaW1wb3J0IHtnZXRPckNyZWF0ZVROb2RlfSBmcm9tICcuL3NoYXJlZCc7XG5cblxuXG4vKipcbiAqIENyZWF0ZSBzdGF0aWMgdGV4dCBub2RlXG4gKlxuICogQHBhcmFtIGluZGV4IEluZGV4IG9mIHRoZSBub2RlIGluIHRoZSBkYXRhIGFycmF5XG4gKiBAcGFyYW0gdmFsdWUgU3RhdGljIHN0cmluZyB2YWx1ZSB0byB3cml0ZS5cbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtXRleHQoaW5kZXg6IG51bWJlciwgdmFsdWU6IHN0cmluZyA9ICcnKTogdm9pZCB7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgdFZpZXcgPSBsVmlld1tUVklFV107XG4gIGNvbnN0IGFkanVzdGVkSW5kZXggPSBpbmRleCArIEhFQURFUl9PRkZTRVQ7XG5cbiAgbmdEZXZNb2RlICYmIGFzc2VydEVxdWFsKFxuICAgICAgICAgICAgICAgICAgIGdldEJpbmRpbmdJbmRleCgpLCB0Vmlldy5iaW5kaW5nU3RhcnRJbmRleCxcbiAgICAgICAgICAgICAgICAgICAndGV4dCBub2RlcyBzaG91bGQgYmUgY3JlYXRlZCBiZWZvcmUgYW55IGJpbmRpbmdzJyk7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREYXRhSW5SYW5nZShsVmlldywgYWRqdXN0ZWRJbmRleCk7XG5cbiAgY29uc3QgdE5vZGUgPSB0Vmlldy5maXJzdENyZWF0ZVBhc3MgP1xuICAgICAgZ2V0T3JDcmVhdGVUTm9kZSh0VmlldywgbFZpZXdbVF9IT1NUXSwgaW5kZXgsIFROb2RlVHlwZS5FbGVtZW50LCBudWxsLCBudWxsKSA6XG4gICAgICB0Vmlldy5kYXRhW2FkanVzdGVkSW5kZXhdIGFzIFRFbGVtZW50Tm9kZTtcblxuICBjb25zdCB0ZXh0TmF0aXZlID0gbFZpZXdbYWRqdXN0ZWRJbmRleF0gPSBjcmVhdGVUZXh0Tm9kZSh2YWx1ZSwgbFZpZXdbUkVOREVSRVJdKTtcbiAgYXBwZW5kQ2hpbGQodGV4dE5hdGl2ZSwgdE5vZGUsIGxWaWV3KTtcblxuICAvLyBUZXh0IG5vZGVzIGFyZSBzZWxmIGNsb3NpbmcuXG4gIHNldFByZXZpb3VzT3JQYXJlbnRUTm9kZSh0Tm9kZSwgZmFsc2UpO1xufVxuIl19