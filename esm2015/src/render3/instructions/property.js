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
import { bindingUpdated } from '../bindings';
import { BINDING_INDEX } from '../interfaces/view';
import { getLView, getSelectedIndex } from '../state';
import { NO_CHANGE } from '../tokens';
import { elementPropertyInternal, storeBindingMetadata } from './shared';
/**
 * Update a property on a selected element.
 *
 * Operates on the element selected by index via the {\@link select} instruction.
 *
 * If the property name also exists as an input property on one of the element's directives,
 * the component property will be set instead of the element property. This check must
 * be conducted at runtime so child components that add new `\@Inputs` don't have to be re-compiled
 *
 * \@codeGenApi
 * @template T
 * @param {?} propName Name of property. Because it is going to DOM, this is not subject to
 *        renaming as part of minification.
 * @param {?} value New value to write.
 * @param {?=} sanitizer An optional function used to sanitize the value.
 * @return {?} This function returns itself so that it may be chained
 * (e.g. `property('name', ctx.name)('title', ctx.title)`)
 *
 */
export function ɵɵproperty(propName, value, sanitizer) {
    /** @type {?} */
    const lView = getLView();
    /** @type {?} */
    const bindReconciledValue = bind(lView, value);
    if (bindReconciledValue !== NO_CHANGE) {
        elementPropertyInternal(getSelectedIndex(), propName, bindReconciledValue, sanitizer);
    }
    return ɵɵproperty;
}
/**
 * Creates a single value binding.
 *
 * @template T
 * @param {?} lView Current view
 * @param {?} value Value to diff
 * @return {?}
 */
export function bind(lView, value) {
    /** @type {?} */
    const bindingIndex = lView[BINDING_INDEX]++;
    storeBindingMetadata(lView);
    return bindingUpdated(lView, bindingIndex, value) ? value : NO_CHANGE;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvcGVydHkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2luc3RydWN0aW9ucy9wcm9wZXJ0eS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQU9BLE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSxhQUFhLENBQUM7QUFFM0MsT0FBTyxFQUFDLGFBQWEsRUFBUSxNQUFNLG9CQUFvQixDQUFDO0FBQ3hELE9BQU8sRUFBQyxRQUFRLEVBQUUsZ0JBQWdCLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFDcEQsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLFdBQVcsQ0FBQztBQUVwQyxPQUFPLEVBQW1CLHVCQUF1QixFQUFFLG9CQUFvQixFQUFDLE1BQU0sVUFBVSxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQXFCekYsTUFBTSxVQUFVLFVBQVUsQ0FDdEIsUUFBZ0IsRUFBRSxLQUFRLEVBQUUsU0FBOEI7O1VBQ3RELEtBQUssR0FBRyxRQUFRLEVBQUU7O1VBQ2xCLG1CQUFtQixHQUFHLElBQUksQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDO0lBQzlDLElBQUksbUJBQW1CLEtBQUssU0FBUyxFQUFFO1FBQ3JDLHVCQUF1QixDQUFDLGdCQUFnQixFQUFFLEVBQUUsUUFBUSxFQUFFLG1CQUFtQixFQUFFLFNBQVMsQ0FBQyxDQUFDO0tBQ3ZGO0lBQ0QsT0FBTyxVQUFVLENBQUM7QUFDcEIsQ0FBQzs7Ozs7Ozs7O0FBUUQsTUFBTSxVQUFVLElBQUksQ0FBSSxLQUFZLEVBQUUsS0FBUTs7VUFDdEMsWUFBWSxHQUFHLEtBQUssQ0FBQyxhQUFhLENBQUMsRUFBRTtJQUMzQyxvQkFBb0IsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUM1QixPQUFPLGNBQWMsQ0FBQyxLQUFLLEVBQUUsWUFBWSxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQztBQUN4RSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0IHtiaW5kaW5nVXBkYXRlZH0gZnJvbSAnLi4vYmluZGluZ3MnO1xuaW1wb3J0IHtTYW5pdGl6ZXJGbn0gZnJvbSAnLi4vaW50ZXJmYWNlcy9zYW5pdGl6YXRpb24nO1xuaW1wb3J0IHtCSU5ESU5HX0lOREVYLCBMVmlld30gZnJvbSAnLi4vaW50ZXJmYWNlcy92aWV3JztcbmltcG9ydCB7Z2V0TFZpZXcsIGdldFNlbGVjdGVkSW5kZXh9IGZyb20gJy4uL3N0YXRlJztcbmltcG9ydCB7Tk9fQ0hBTkdFfSBmcm9tICcuLi90b2tlbnMnO1xuXG5pbXBvcnQge1RzaWNrbGVJc3N1ZTEwMDksIGVsZW1lbnRQcm9wZXJ0eUludGVybmFsLCBzdG9yZUJpbmRpbmdNZXRhZGF0YX0gZnJvbSAnLi9zaGFyZWQnO1xuXG5cbi8qKlxuICogVXBkYXRlIGEgcHJvcGVydHkgb24gYSBzZWxlY3RlZCBlbGVtZW50LlxuICpcbiAqIE9wZXJhdGVzIG9uIHRoZSBlbGVtZW50IHNlbGVjdGVkIGJ5IGluZGV4IHZpYSB0aGUge0BsaW5rIHNlbGVjdH0gaW5zdHJ1Y3Rpb24uXG4gKlxuICogSWYgdGhlIHByb3BlcnR5IG5hbWUgYWxzbyBleGlzdHMgYXMgYW4gaW5wdXQgcHJvcGVydHkgb24gb25lIG9mIHRoZSBlbGVtZW50J3MgZGlyZWN0aXZlcyxcbiAqIHRoZSBjb21wb25lbnQgcHJvcGVydHkgd2lsbCBiZSBzZXQgaW5zdGVhZCBvZiB0aGUgZWxlbWVudCBwcm9wZXJ0eS4gVGhpcyBjaGVjayBtdXN0XG4gKiBiZSBjb25kdWN0ZWQgYXQgcnVudGltZSBzbyBjaGlsZCBjb21wb25lbnRzIHRoYXQgYWRkIG5ldyBgQElucHV0c2AgZG9uJ3QgaGF2ZSB0byBiZSByZS1jb21waWxlZFxuICpcbiAqIEBwYXJhbSBwcm9wTmFtZSBOYW1lIG9mIHByb3BlcnR5LiBCZWNhdXNlIGl0IGlzIGdvaW5nIHRvIERPTSwgdGhpcyBpcyBub3Qgc3ViamVjdCB0b1xuICogICAgICAgIHJlbmFtaW5nIGFzIHBhcnQgb2YgbWluaWZpY2F0aW9uLlxuICogQHBhcmFtIHZhbHVlIE5ldyB2YWx1ZSB0byB3cml0ZS5cbiAqIEBwYXJhbSBzYW5pdGl6ZXIgQW4gb3B0aW9uYWwgZnVuY3Rpb24gdXNlZCB0byBzYW5pdGl6ZSB0aGUgdmFsdWUuXG4gKiBAcmV0dXJucyBUaGlzIGZ1bmN0aW9uIHJldHVybnMgaXRzZWxmIHNvIHRoYXQgaXQgbWF5IGJlIGNoYWluZWRcbiAqIChlLmcuIGBwcm9wZXJ0eSgnbmFtZScsIGN0eC5uYW1lKSgndGl0bGUnLCBjdHgudGl0bGUpYClcbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtXByb3BlcnR5PFQ+KFxuICAgIHByb3BOYW1lOiBzdHJpbmcsIHZhbHVlOiBULCBzYW5pdGl6ZXI/OiBTYW5pdGl6ZXJGbiB8IG51bGwpOiBUc2lja2xlSXNzdWUxMDA5IHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCBiaW5kUmVjb25jaWxlZFZhbHVlID0gYmluZChsVmlldywgdmFsdWUpO1xuICBpZiAoYmluZFJlY29uY2lsZWRWYWx1ZSAhPT0gTk9fQ0hBTkdFKSB7XG4gICAgZWxlbWVudFByb3BlcnR5SW50ZXJuYWwoZ2V0U2VsZWN0ZWRJbmRleCgpLCBwcm9wTmFtZSwgYmluZFJlY29uY2lsZWRWYWx1ZSwgc2FuaXRpemVyKTtcbiAgfVxuICByZXR1cm4gybXJtXByb3BlcnR5O1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYSBzaW5nbGUgdmFsdWUgYmluZGluZy5cbiAqXG4gKiBAcGFyYW0gbFZpZXcgQ3VycmVudCB2aWV3XG4gKiBAcGFyYW0gdmFsdWUgVmFsdWUgdG8gZGlmZlxuICovXG5leHBvcnQgZnVuY3Rpb24gYmluZDxUPihsVmlldzogTFZpZXcsIHZhbHVlOiBUKTogVHxOT19DSEFOR0Uge1xuICBjb25zdCBiaW5kaW5nSW5kZXggPSBsVmlld1tCSU5ESU5HX0lOREVYXSsrO1xuICBzdG9yZUJpbmRpbmdNZXRhZGF0YShsVmlldyk7XG4gIHJldHVybiBiaW5kaW5nVXBkYXRlZChsVmlldywgYmluZGluZ0luZGV4LCB2YWx1ZSkgPyB2YWx1ZSA6IE5PX0NIQU5HRTtcbn1cbiJdfQ==