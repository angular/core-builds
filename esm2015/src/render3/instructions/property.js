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
import { BINDING_INDEX, TVIEW } from '../interfaces/view';
import { getLView, getSelectedIndex } from '../state';
import { elementPropertyInternal, storePropertyBindingMetadata } from './shared';
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
    const bindingIndex = lView[BINDING_INDEX]++;
    if (bindingUpdated(lView, bindingIndex, value)) {
        /** @type {?} */
        const nodeIndex = getSelectedIndex();
        elementPropertyInternal(lView, nodeIndex, propName, value, sanitizer);
        ngDevMode && storePropertyBindingMetadata(lView[TVIEW].data, nodeIndex, propName, bindingIndex);
    }
    return ɵɵproperty;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvcGVydHkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2luc3RydWN0aW9ucy9wcm9wZXJ0eS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQU9BLE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSxhQUFhLENBQUM7QUFFM0MsT0FBTyxFQUFDLGFBQWEsRUFBRSxLQUFLLEVBQUMsTUFBTSxvQkFBb0IsQ0FBQztBQUN4RCxPQUFPLEVBQUMsUUFBUSxFQUFFLGdCQUFnQixFQUFDLE1BQU0sVUFBVSxDQUFDO0FBRXBELE9BQU8sRUFBbUIsdUJBQXVCLEVBQUUsNEJBQTRCLEVBQUMsTUFBTSxVQUFVLENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBcUJqRyxNQUFNLFVBQVUsVUFBVSxDQUN0QixRQUFnQixFQUFFLEtBQVEsRUFBRSxTQUE4Qjs7VUFDdEQsS0FBSyxHQUFHLFFBQVEsRUFBRTs7VUFDbEIsWUFBWSxHQUFHLEtBQUssQ0FBQyxhQUFhLENBQUMsRUFBRTtJQUMzQyxJQUFJLGNBQWMsQ0FBQyxLQUFLLEVBQUUsWUFBWSxFQUFFLEtBQUssQ0FBQyxFQUFFOztjQUN4QyxTQUFTLEdBQUcsZ0JBQWdCLEVBQUU7UUFDcEMsdUJBQXVCLENBQUMsS0FBSyxFQUFFLFNBQVMsRUFBRSxRQUFRLEVBQUUsS0FBSyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1FBQ3RFLFNBQVMsSUFBSSw0QkFBNEIsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsSUFBSSxFQUFFLFNBQVMsRUFBRSxRQUFRLEVBQUUsWUFBWSxDQUFDLENBQUM7S0FDakc7SUFDRCxPQUFPLFVBQVUsQ0FBQztBQUNwQixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0IHtiaW5kaW5nVXBkYXRlZH0gZnJvbSAnLi4vYmluZGluZ3MnO1xuaW1wb3J0IHtTYW5pdGl6ZXJGbn0gZnJvbSAnLi4vaW50ZXJmYWNlcy9zYW5pdGl6YXRpb24nO1xuaW1wb3J0IHtCSU5ESU5HX0lOREVYLCBUVklFV30gZnJvbSAnLi4vaW50ZXJmYWNlcy92aWV3JztcbmltcG9ydCB7Z2V0TFZpZXcsIGdldFNlbGVjdGVkSW5kZXh9IGZyb20gJy4uL3N0YXRlJztcblxuaW1wb3J0IHtUc2lja2xlSXNzdWUxMDA5LCBlbGVtZW50UHJvcGVydHlJbnRlcm5hbCwgc3RvcmVQcm9wZXJ0eUJpbmRpbmdNZXRhZGF0YX0gZnJvbSAnLi9zaGFyZWQnO1xuXG5cbi8qKlxuICogVXBkYXRlIGEgcHJvcGVydHkgb24gYSBzZWxlY3RlZCBlbGVtZW50LlxuICpcbiAqIE9wZXJhdGVzIG9uIHRoZSBlbGVtZW50IHNlbGVjdGVkIGJ5IGluZGV4IHZpYSB0aGUge0BsaW5rIHNlbGVjdH0gaW5zdHJ1Y3Rpb24uXG4gKlxuICogSWYgdGhlIHByb3BlcnR5IG5hbWUgYWxzbyBleGlzdHMgYXMgYW4gaW5wdXQgcHJvcGVydHkgb24gb25lIG9mIHRoZSBlbGVtZW50J3MgZGlyZWN0aXZlcyxcbiAqIHRoZSBjb21wb25lbnQgcHJvcGVydHkgd2lsbCBiZSBzZXQgaW5zdGVhZCBvZiB0aGUgZWxlbWVudCBwcm9wZXJ0eS4gVGhpcyBjaGVjayBtdXN0XG4gKiBiZSBjb25kdWN0ZWQgYXQgcnVudGltZSBzbyBjaGlsZCBjb21wb25lbnRzIHRoYXQgYWRkIG5ldyBgQElucHV0c2AgZG9uJ3QgaGF2ZSB0byBiZSByZS1jb21waWxlZFxuICpcbiAqIEBwYXJhbSBwcm9wTmFtZSBOYW1lIG9mIHByb3BlcnR5LiBCZWNhdXNlIGl0IGlzIGdvaW5nIHRvIERPTSwgdGhpcyBpcyBub3Qgc3ViamVjdCB0b1xuICogICAgICAgIHJlbmFtaW5nIGFzIHBhcnQgb2YgbWluaWZpY2F0aW9uLlxuICogQHBhcmFtIHZhbHVlIE5ldyB2YWx1ZSB0byB3cml0ZS5cbiAqIEBwYXJhbSBzYW5pdGl6ZXIgQW4gb3B0aW9uYWwgZnVuY3Rpb24gdXNlZCB0byBzYW5pdGl6ZSB0aGUgdmFsdWUuXG4gKiBAcmV0dXJucyBUaGlzIGZ1bmN0aW9uIHJldHVybnMgaXRzZWxmIHNvIHRoYXQgaXQgbWF5IGJlIGNoYWluZWRcbiAqIChlLmcuIGBwcm9wZXJ0eSgnbmFtZScsIGN0eC5uYW1lKSgndGl0bGUnLCBjdHgudGl0bGUpYClcbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtXByb3BlcnR5PFQ+KFxuICAgIHByb3BOYW1lOiBzdHJpbmcsIHZhbHVlOiBULCBzYW5pdGl6ZXI/OiBTYW5pdGl6ZXJGbiB8IG51bGwpOiBUc2lja2xlSXNzdWUxMDA5IHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCBiaW5kaW5nSW5kZXggPSBsVmlld1tCSU5ESU5HX0lOREVYXSsrO1xuICBpZiAoYmluZGluZ1VwZGF0ZWQobFZpZXcsIGJpbmRpbmdJbmRleCwgdmFsdWUpKSB7XG4gICAgY29uc3Qgbm9kZUluZGV4ID0gZ2V0U2VsZWN0ZWRJbmRleCgpO1xuICAgIGVsZW1lbnRQcm9wZXJ0eUludGVybmFsKGxWaWV3LCBub2RlSW5kZXgsIHByb3BOYW1lLCB2YWx1ZSwgc2FuaXRpemVyKTtcbiAgICBuZ0Rldk1vZGUgJiYgc3RvcmVQcm9wZXJ0eUJpbmRpbmdNZXRhZGF0YShsVmlld1tUVklFV10uZGF0YSwgbm9kZUluZGV4LCBwcm9wTmFtZSwgYmluZGluZ0luZGV4KTtcbiAgfVxuICByZXR1cm4gybXJtXByb3BlcnR5O1xufVxuIl19