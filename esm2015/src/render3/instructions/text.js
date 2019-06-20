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
import { assertDataInRange, assertEqual } from '../../util/assert';
import { BINDING_INDEX, HEADER_OFFSET, RENDERER, TVIEW, T_HOST } from '../interfaces/view';
import { appendChild, createTextNode } from '../node_manipulation';
import { getLView, getSelectedIndex, setIsNotParent } from '../state';
import { NO_CHANGE } from '../tokens';
import { renderStringify } from '../util/misc_utils';
import { ɵɵbind } from './property';
import { getOrCreateTNode, textBindingInternal } from './shared';
/**
 * Create static text node
 *
 * \@codeGenApi
 * @param {?} index Index of the node in the data array
 * @param {?=} value Value to write. This value will be stringified.
 *
 * @return {?}
 */
export function ɵɵtext(index, value) {
    /** @type {?} */
    const lView = getLView();
    ngDevMode && assertEqual(lView[BINDING_INDEX], lView[TVIEW].bindingStartIndex, 'text nodes should be created before any bindings');
    ngDevMode && ngDevMode.rendererCreateTextNode++;
    ngDevMode && assertDataInRange(lView, index + HEADER_OFFSET);
    /** @type {?} */
    const textNative = lView[index + HEADER_OFFSET] = createTextNode(value, lView[RENDERER]);
    ngDevMode && ngDevMode.rendererSetText++;
    /** @type {?} */
    const tNode = getOrCreateTNode(lView[TVIEW], lView[T_HOST], index, 3 /* Element */, null, null);
    // Text nodes are self closing.
    setIsNotParent();
    appendChild(textNative, tNode, lView);
}
/**
 * Create text node with binding
 * Bindings should be handled externally with the proper interpolation(1-8) method
 *
 * \@codeGenApi
 * @template T
 * @param {?} value Stringified value to write.
 *
 * @return {?}
 */
export function ɵɵtextBinding(value) {
    /** @type {?} */
    const lView = getLView();
    /** @type {?} */
    const index = getSelectedIndex();
    /** @type {?} */
    const bound = ɵɵbind(value);
    if (bound !== NO_CHANGE) {
        textBindingInternal(lView, index, renderStringify(bound));
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGV4dC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvaW5zdHJ1Y3Rpb25zL3RleHQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFPQSxPQUFPLEVBQUMsaUJBQWlCLEVBQWlCLFdBQVcsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBR2hGLE9BQU8sRUFBQyxhQUFhLEVBQUUsYUFBYSxFQUFTLFFBQVEsRUFBRSxLQUFLLEVBQUUsTUFBTSxFQUFDLE1BQU0sb0JBQW9CLENBQUM7QUFDaEcsT0FBTyxFQUFDLFdBQVcsRUFBRSxjQUFjLEVBQUMsTUFBTSxzQkFBc0IsQ0FBQztBQUNqRSxPQUFPLEVBQUMsUUFBUSxFQUFFLGdCQUFnQixFQUFFLGNBQWMsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUNwRSxPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sV0FBVyxDQUFDO0FBQ3BDLE9BQU8sRUFBQyxlQUFlLEVBQUMsTUFBTSxvQkFBb0IsQ0FBQztBQUduRCxPQUFPLEVBQUMsTUFBTSxFQUFDLE1BQU0sWUFBWSxDQUFDO0FBQ2xDLE9BQU8sRUFBQyxnQkFBZ0IsRUFBRSxtQkFBbUIsRUFBQyxNQUFNLFVBQVUsQ0FBQzs7Ozs7Ozs7OztBQVkvRCxNQUFNLFVBQVUsTUFBTSxDQUFDLEtBQWEsRUFBRSxLQUFXOztVQUN6QyxLQUFLLEdBQUcsUUFBUSxFQUFFO0lBQ3hCLFNBQVMsSUFBSSxXQUFXLENBQ1AsS0FBSyxDQUFDLGFBQWEsQ0FBQyxFQUFFLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxpQkFBaUIsRUFDcEQsa0RBQWtELENBQUMsQ0FBQztJQUNyRSxTQUFTLElBQUksU0FBUyxDQUFDLHNCQUFzQixFQUFFLENBQUM7SUFDaEQsU0FBUyxJQUFJLGlCQUFpQixDQUFDLEtBQUssRUFBRSxLQUFLLEdBQUcsYUFBYSxDQUFDLENBQUM7O1VBQ3ZELFVBQVUsR0FBRyxLQUFLLENBQUMsS0FBSyxHQUFHLGFBQWEsQ0FBQyxHQUFHLGNBQWMsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQ3hGLFNBQVMsSUFBSSxTQUFTLENBQUMsZUFBZSxFQUFFLENBQUM7O1VBQ25DLEtBQUssR0FBRyxnQkFBZ0IsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLEVBQUUsS0FBSyxDQUFDLE1BQU0sQ0FBQyxFQUFFLEtBQUssbUJBQXFCLElBQUksRUFBRSxJQUFJLENBQUM7SUFFakcsK0JBQStCO0lBQy9CLGNBQWMsRUFBRSxDQUFDO0lBQ2pCLFdBQVcsQ0FBQyxVQUFVLEVBQUUsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO0FBQ3hDLENBQUM7Ozs7Ozs7Ozs7O0FBVUQsTUFBTSxVQUFVLGFBQWEsQ0FBSSxLQUFvQjs7VUFDN0MsS0FBSyxHQUFHLFFBQVEsRUFBRTs7VUFDbEIsS0FBSyxHQUFHLGdCQUFnQixFQUFFOztVQUMxQixLQUFLLEdBQUcsTUFBTSxDQUFDLEtBQUssQ0FBQztJQUMzQixJQUFJLEtBQUssS0FBSyxTQUFTLEVBQUU7UUFDdkIsbUJBQW1CLENBQUMsS0FBSyxFQUFFLEtBQUssRUFBRSxlQUFlLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztLQUMzRDtBQUNILENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5pbXBvcnQge2Fzc2VydERhdGFJblJhbmdlLCBhc3NlcnREZWZpbmVkLCBhc3NlcnRFcXVhbH0gZnJvbSAnLi4vLi4vdXRpbC9hc3NlcnQnO1xuaW1wb3J0IHtUTm9kZVR5cGV9IGZyb20gJy4uL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge1JUZXh0LCBpc1Byb2NlZHVyYWxSZW5kZXJlcn0gZnJvbSAnLi4vaW50ZXJmYWNlcy9yZW5kZXJlcic7XG5pbXBvcnQge0JJTkRJTkdfSU5ERVgsIEhFQURFUl9PRkZTRVQsIExWaWV3LCBSRU5ERVJFUiwgVFZJRVcsIFRfSE9TVH0gZnJvbSAnLi4vaW50ZXJmYWNlcy92aWV3JztcbmltcG9ydCB7YXBwZW5kQ2hpbGQsIGNyZWF0ZVRleHROb2RlfSBmcm9tICcuLi9ub2RlX21hbmlwdWxhdGlvbic7XG5pbXBvcnQge2dldExWaWV3LCBnZXRTZWxlY3RlZEluZGV4LCBzZXRJc05vdFBhcmVudH0gZnJvbSAnLi4vc3RhdGUnO1xuaW1wb3J0IHtOT19DSEFOR0V9IGZyb20gJy4uL3Rva2Vucyc7XG5pbXBvcnQge3JlbmRlclN0cmluZ2lmeX0gZnJvbSAnLi4vdXRpbC9taXNjX3V0aWxzJztcbmltcG9ydCB7Z2V0TmF0aXZlQnlJbmRleH0gZnJvbSAnLi4vdXRpbC92aWV3X3V0aWxzJztcblxuaW1wb3J0IHvJtcm1YmluZH0gZnJvbSAnLi9wcm9wZXJ0eSc7XG5pbXBvcnQge2dldE9yQ3JlYXRlVE5vZGUsIHRleHRCaW5kaW5nSW50ZXJuYWx9IGZyb20gJy4vc2hhcmVkJztcblxuXG5cbi8qKlxuICogQ3JlYXRlIHN0YXRpYyB0ZXh0IG5vZGVcbiAqXG4gKiBAcGFyYW0gaW5kZXggSW5kZXggb2YgdGhlIG5vZGUgaW4gdGhlIGRhdGEgYXJyYXlcbiAqIEBwYXJhbSB2YWx1ZSBWYWx1ZSB0byB3cml0ZS4gVGhpcyB2YWx1ZSB3aWxsIGJlIHN0cmluZ2lmaWVkLlxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1dGV4dChpbmRleDogbnVtYmVyLCB2YWx1ZT86IGFueSk6IHZvaWQge1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRFcXVhbChcbiAgICAgICAgICAgICAgICAgICBsVmlld1tCSU5ESU5HX0lOREVYXSwgbFZpZXdbVFZJRVddLmJpbmRpbmdTdGFydEluZGV4LFxuICAgICAgICAgICAgICAgICAgICd0ZXh0IG5vZGVzIHNob3VsZCBiZSBjcmVhdGVkIGJlZm9yZSBhbnkgYmluZGluZ3MnKTtcbiAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlckNyZWF0ZVRleHROb2RlKys7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREYXRhSW5SYW5nZShsVmlldywgaW5kZXggKyBIRUFERVJfT0ZGU0VUKTtcbiAgY29uc3QgdGV4dE5hdGl2ZSA9IGxWaWV3W2luZGV4ICsgSEVBREVSX09GRlNFVF0gPSBjcmVhdGVUZXh0Tm9kZSh2YWx1ZSwgbFZpZXdbUkVOREVSRVJdKTtcbiAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlclNldFRleHQrKztcbiAgY29uc3QgdE5vZGUgPSBnZXRPckNyZWF0ZVROb2RlKGxWaWV3W1RWSUVXXSwgbFZpZXdbVF9IT1NUXSwgaW5kZXgsIFROb2RlVHlwZS5FbGVtZW50LCBudWxsLCBudWxsKTtcblxuICAvLyBUZXh0IG5vZGVzIGFyZSBzZWxmIGNsb3NpbmcuXG4gIHNldElzTm90UGFyZW50KCk7XG4gIGFwcGVuZENoaWxkKHRleHROYXRpdmUsIHROb2RlLCBsVmlldyk7XG59XG5cbi8qKlxuICogQ3JlYXRlIHRleHQgbm9kZSB3aXRoIGJpbmRpbmdcbiAqIEJpbmRpbmdzIHNob3VsZCBiZSBoYW5kbGVkIGV4dGVybmFsbHkgd2l0aCB0aGUgcHJvcGVyIGludGVycG9sYXRpb24oMS04KSBtZXRob2RcbiAqXG4gKiBAcGFyYW0gdmFsdWUgU3RyaW5naWZpZWQgdmFsdWUgdG8gd3JpdGUuXG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybV0ZXh0QmluZGluZzxUPih2YWx1ZTogVCB8IE5PX0NIQU5HRSk6IHZvaWQge1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IGluZGV4ID0gZ2V0U2VsZWN0ZWRJbmRleCgpO1xuICBjb25zdCBib3VuZCA9IMm1ybViaW5kKHZhbHVlKTtcbiAgaWYgKGJvdW5kICE9PSBOT19DSEFOR0UpIHtcbiAgICB0ZXh0QmluZGluZ0ludGVybmFsKGxWaWV3LCBpbmRleCwgcmVuZGVyU3RyaW5naWZ5KGJvdW5kKSk7XG4gIH1cbn1cbiJdfQ==