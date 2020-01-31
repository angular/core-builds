/**
 * @fileoverview added by tsickle
 * Generated from: packages/core/src/render3/instructions/storage.ts
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { HEADER_OFFSET, TVIEW } from '../interfaces/view';
import { getContextLView, getLView } from '../state';
import { load } from '../util/view_utils';
/**
 * Store a value in the `data` at a given `index`.
 * @template T
 * @param {?} index
 * @param {?} value
 * @return {?}
 */
export function store(index, value) {
    /** @type {?} */
    const lView = getLView();
    /** @type {?} */
    const tView = lView[TVIEW];
    // We don't store any static data for local variables, so the first time
    // we see the template, we should store as null to avoid a sparse array
    /** @type {?} */
    const adjustedIndex = index + HEADER_OFFSET;
    if (adjustedIndex >= tView.data.length) {
        tView.data[adjustedIndex] = null;
        tView.blueprint[adjustedIndex] = null;
    }
    lView[adjustedIndex] = value;
}
/**
 * Retrieves a local reference from the current contextViewData.
 *
 * If the reference to retrieve is in a parent view, this instruction is used in conjunction
 * with a nextContext() call, which walks up the tree and updates the contextViewData instance.
 *
 * \@codeGenApi
 * @template T
 * @param {?} index The index of the local ref in contextViewData.
 *
 * @return {?}
 */
export function ɵɵreference(index) {
    /** @type {?} */
    const contextLView = getContextLView();
    return load(contextLView, index);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RvcmFnZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvaW5zdHJ1Y3Rpb25zL3N0b3JhZ2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBT0EsT0FBTyxFQUFDLGFBQWEsRUFBRSxLQUFLLEVBQUMsTUFBTSxvQkFBb0IsQ0FBQztBQUN4RCxPQUFPLEVBQUMsZUFBZSxFQUFFLFFBQVEsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUNuRCxPQUFPLEVBQUMsSUFBSSxFQUFDLE1BQU0sb0JBQW9CLENBQUM7Ozs7Ozs7O0FBR3hDLE1BQU0sVUFBVSxLQUFLLENBQUksS0FBYSxFQUFFLEtBQVE7O1VBQ3hDLEtBQUssR0FBRyxRQUFRLEVBQUU7O1VBQ2xCLEtBQUssR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDOzs7O1VBR3BCLGFBQWEsR0FBRyxLQUFLLEdBQUcsYUFBYTtJQUMzQyxJQUFJLGFBQWEsSUFBSSxLQUFLLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRTtRQUN0QyxLQUFLLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxHQUFHLElBQUksQ0FBQztRQUNqQyxLQUFLLENBQUMsU0FBUyxDQUFDLGFBQWEsQ0FBQyxHQUFHLElBQUksQ0FBQztLQUN2QztJQUNELEtBQUssQ0FBQyxhQUFhLENBQUMsR0FBRyxLQUFLLENBQUM7QUFDL0IsQ0FBQzs7Ozs7Ozs7Ozs7OztBQVlELE1BQU0sVUFBVSxXQUFXLENBQUksS0FBYTs7VUFDcEMsWUFBWSxHQUFHLGVBQWUsRUFBRTtJQUN0QyxPQUFPLElBQUksQ0FBSSxZQUFZLEVBQUUsS0FBSyxDQUFDLENBQUM7QUFDdEMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cbmltcG9ydCB7SEVBREVSX09GRlNFVCwgVFZJRVd9IGZyb20gJy4uL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge2dldENvbnRleHRMVmlldywgZ2V0TFZpZXd9IGZyb20gJy4uL3N0YXRlJztcbmltcG9ydCB7bG9hZH0gZnJvbSAnLi4vdXRpbC92aWV3X3V0aWxzJztcblxuLyoqIFN0b3JlIGEgdmFsdWUgaW4gdGhlIGBkYXRhYCBhdCBhIGdpdmVuIGBpbmRleGAuICovXG5leHBvcnQgZnVuY3Rpb24gc3RvcmU8VD4oaW5kZXg6IG51bWJlciwgdmFsdWU6IFQpOiB2b2lkIHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCB0VmlldyA9IGxWaWV3W1RWSUVXXTtcbiAgLy8gV2UgZG9uJ3Qgc3RvcmUgYW55IHN0YXRpYyBkYXRhIGZvciBsb2NhbCB2YXJpYWJsZXMsIHNvIHRoZSBmaXJzdCB0aW1lXG4gIC8vIHdlIHNlZSB0aGUgdGVtcGxhdGUsIHdlIHNob3VsZCBzdG9yZSBhcyBudWxsIHRvIGF2b2lkIGEgc3BhcnNlIGFycmF5XG4gIGNvbnN0IGFkanVzdGVkSW5kZXggPSBpbmRleCArIEhFQURFUl9PRkZTRVQ7XG4gIGlmIChhZGp1c3RlZEluZGV4ID49IHRWaWV3LmRhdGEubGVuZ3RoKSB7XG4gICAgdFZpZXcuZGF0YVthZGp1c3RlZEluZGV4XSA9IG51bGw7XG4gICAgdFZpZXcuYmx1ZXByaW50W2FkanVzdGVkSW5kZXhdID0gbnVsbDtcbiAgfVxuICBsVmlld1thZGp1c3RlZEluZGV4XSA9IHZhbHVlO1xufVxuXG4vKipcbiAqIFJldHJpZXZlcyBhIGxvY2FsIHJlZmVyZW5jZSBmcm9tIHRoZSBjdXJyZW50IGNvbnRleHRWaWV3RGF0YS5cbiAqXG4gKiBJZiB0aGUgcmVmZXJlbmNlIHRvIHJldHJpZXZlIGlzIGluIGEgcGFyZW50IHZpZXcsIHRoaXMgaW5zdHJ1Y3Rpb24gaXMgdXNlZCBpbiBjb25qdW5jdGlvblxuICogd2l0aCBhIG5leHRDb250ZXh0KCkgY2FsbCwgd2hpY2ggd2Fsa3MgdXAgdGhlIHRyZWUgYW5kIHVwZGF0ZXMgdGhlIGNvbnRleHRWaWV3RGF0YSBpbnN0YW5jZS5cbiAqXG4gKiBAcGFyYW0gaW5kZXggVGhlIGluZGV4IG9mIHRoZSBsb2NhbCByZWYgaW4gY29udGV4dFZpZXdEYXRhLlxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1cmVmZXJlbmNlPFQ+KGluZGV4OiBudW1iZXIpIHtcbiAgY29uc3QgY29udGV4dExWaWV3ID0gZ2V0Q29udGV4dExWaWV3KCk7XG4gIHJldHVybiBsb2FkPFQ+KGNvbnRleHRMVmlldywgaW5kZXgpO1xufVxuIl19