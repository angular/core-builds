/**
 * @fileoverview added by tsickle
 * Generated from: packages/core/src/render3/instructions/property.ts
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
import { TVIEW } from '../interfaces/view';
import { getLView, getSelectedIndex, nextBindingIndex } from '../state';
import { elementPropertyInternal, setInputsForProperty, storePropertyBindingMetadata } from './shared';
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
    const bindingIndex = nextBindingIndex();
    if (bindingUpdated(lView, bindingIndex, value)) {
        /** @type {?} */
        const nodeIndex = getSelectedIndex();
        elementPropertyInternal(lView, nodeIndex, propName, value, sanitizer);
        ngDevMode && storePropertyBindingMetadata(lView[TVIEW].data, nodeIndex, propName, bindingIndex);
    }
    return ɵɵproperty;
}
/**
 * Given `<div style="..." my-dir>` and `MyDir` with `\@Input('style')` we need to write to
 * directive input.
 * @param {?} tNode
 * @param {?} lView
 * @param {?} value
 * @param {?} isClassBased
 * @return {?}
 */
export function setDirectiveInputsWhichShadowsStyling(tNode, lView, value, isClassBased) {
    /** @type {?} */
    const inputs = (/** @type {?} */ (tNode.inputs));
    /** @type {?} */
    const property = isClassBased ? 'class' : 'style';
    // We support both 'class' and `className` hence the fallback.
    /** @type {?} */
    const stylingInputs = inputs[property] || (isClassBased && inputs['className']);
    setInputsForProperty(lView, stylingInputs, property, value);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvcGVydHkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2luc3RydWN0aW9ucy9wcm9wZXJ0eS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFPQSxPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0sYUFBYSxDQUFDO0FBRzNDLE9BQU8sRUFBUSxLQUFLLEVBQUMsTUFBTSxvQkFBb0IsQ0FBQztBQUNoRCxPQUFPLEVBQUMsUUFBUSxFQUFFLGdCQUFnQixFQUFFLGdCQUFnQixFQUFDLE1BQU0sVUFBVSxDQUFDO0FBQ3RFLE9BQU8sRUFBQyx1QkFBdUIsRUFBRSxvQkFBb0IsRUFBRSw0QkFBNEIsRUFBQyxNQUFNLFVBQVUsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFxQnJHLE1BQU0sVUFBVSxVQUFVLENBQ3RCLFFBQWdCLEVBQUUsS0FBUSxFQUFFLFNBQThCOztVQUN0RCxLQUFLLEdBQUcsUUFBUSxFQUFFOztVQUNsQixZQUFZLEdBQUcsZ0JBQWdCLEVBQUU7SUFDdkMsSUFBSSxjQUFjLENBQUMsS0FBSyxFQUFFLFlBQVksRUFBRSxLQUFLLENBQUMsRUFBRTs7Y0FDeEMsU0FBUyxHQUFHLGdCQUFnQixFQUFFO1FBQ3BDLHVCQUF1QixDQUFDLEtBQUssRUFBRSxTQUFTLEVBQUUsUUFBUSxFQUFFLEtBQUssRUFBRSxTQUFTLENBQUMsQ0FBQztRQUN0RSxTQUFTLElBQUksNEJBQTRCLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLElBQUksRUFBRSxTQUFTLEVBQUUsUUFBUSxFQUFFLFlBQVksQ0FBQyxDQUFDO0tBQ2pHO0lBQ0QsT0FBTyxVQUFVLENBQUM7QUFDcEIsQ0FBQzs7Ozs7Ozs7OztBQU1ELE1BQU0sVUFBVSxxQ0FBcUMsQ0FDakQsS0FBWSxFQUFFLEtBQVksRUFBRSxLQUFVLEVBQUUsWUFBcUI7O1VBQ3pELE1BQU0sR0FBRyxtQkFBQSxLQUFLLENBQUMsTUFBTSxFQUFFOztVQUN2QixRQUFRLEdBQUcsWUFBWSxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLE9BQU87OztVQUUzQyxhQUFhLEdBQUcsTUFBTSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsWUFBWSxJQUFJLE1BQU0sQ0FBQyxXQUFXLENBQUMsQ0FBQztJQUMvRSxvQkFBb0IsQ0FBQyxLQUFLLEVBQUUsYUFBYSxFQUFFLFFBQVEsRUFBRSxLQUFLLENBQUMsQ0FBQztBQUM5RCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0IHtiaW5kaW5nVXBkYXRlZH0gZnJvbSAnLi4vYmluZGluZ3MnO1xuaW1wb3J0IHtUTm9kZX0gZnJvbSAnLi4vaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB7U2FuaXRpemVyRm59IGZyb20gJy4uL2ludGVyZmFjZXMvc2FuaXRpemF0aW9uJztcbmltcG9ydCB7TFZpZXcsIFRWSUVXfSBmcm9tICcuLi9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHtnZXRMVmlldywgZ2V0U2VsZWN0ZWRJbmRleCwgbmV4dEJpbmRpbmdJbmRleH0gZnJvbSAnLi4vc3RhdGUnO1xuaW1wb3J0IHtlbGVtZW50UHJvcGVydHlJbnRlcm5hbCwgc2V0SW5wdXRzRm9yUHJvcGVydHksIHN0b3JlUHJvcGVydHlCaW5kaW5nTWV0YWRhdGF9IGZyb20gJy4vc2hhcmVkJztcblxuXG4vKipcbiAqIFVwZGF0ZSBhIHByb3BlcnR5IG9uIGEgc2VsZWN0ZWQgZWxlbWVudC5cbiAqXG4gKiBPcGVyYXRlcyBvbiB0aGUgZWxlbWVudCBzZWxlY3RlZCBieSBpbmRleCB2aWEgdGhlIHtAbGluayBzZWxlY3R9IGluc3RydWN0aW9uLlxuICpcbiAqIElmIHRoZSBwcm9wZXJ0eSBuYW1lIGFsc28gZXhpc3RzIGFzIGFuIGlucHV0IHByb3BlcnR5IG9uIG9uZSBvZiB0aGUgZWxlbWVudCdzIGRpcmVjdGl2ZXMsXG4gKiB0aGUgY29tcG9uZW50IHByb3BlcnR5IHdpbGwgYmUgc2V0IGluc3RlYWQgb2YgdGhlIGVsZW1lbnQgcHJvcGVydHkuIFRoaXMgY2hlY2sgbXVzdFxuICogYmUgY29uZHVjdGVkIGF0IHJ1bnRpbWUgc28gY2hpbGQgY29tcG9uZW50cyB0aGF0IGFkZCBuZXcgYEBJbnB1dHNgIGRvbid0IGhhdmUgdG8gYmUgcmUtY29tcGlsZWRcbiAqXG4gKiBAcGFyYW0gcHJvcE5hbWUgTmFtZSBvZiBwcm9wZXJ0eS4gQmVjYXVzZSBpdCBpcyBnb2luZyB0byBET00sIHRoaXMgaXMgbm90IHN1YmplY3QgdG9cbiAqICAgICAgICByZW5hbWluZyBhcyBwYXJ0IG9mIG1pbmlmaWNhdGlvbi5cbiAqIEBwYXJhbSB2YWx1ZSBOZXcgdmFsdWUgdG8gd3JpdGUuXG4gKiBAcGFyYW0gc2FuaXRpemVyIEFuIG9wdGlvbmFsIGZ1bmN0aW9uIHVzZWQgdG8gc2FuaXRpemUgdGhlIHZhbHVlLlxuICogQHJldHVybnMgVGhpcyBmdW5jdGlvbiByZXR1cm5zIGl0c2VsZiBzbyB0aGF0IGl0IG1heSBiZSBjaGFpbmVkXG4gKiAoZS5nLiBgcHJvcGVydHkoJ25hbWUnLCBjdHgubmFtZSkoJ3RpdGxlJywgY3R4LnRpdGxlKWApXG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVwcm9wZXJ0eTxUPihcbiAgICBwcm9wTmFtZTogc3RyaW5nLCB2YWx1ZTogVCwgc2FuaXRpemVyPzogU2FuaXRpemVyRm4gfCBudWxsKTogdHlwZW9mIMm1ybVwcm9wZXJ0eSB7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgYmluZGluZ0luZGV4ID0gbmV4dEJpbmRpbmdJbmRleCgpO1xuICBpZiAoYmluZGluZ1VwZGF0ZWQobFZpZXcsIGJpbmRpbmdJbmRleCwgdmFsdWUpKSB7XG4gICAgY29uc3Qgbm9kZUluZGV4ID0gZ2V0U2VsZWN0ZWRJbmRleCgpO1xuICAgIGVsZW1lbnRQcm9wZXJ0eUludGVybmFsKGxWaWV3LCBub2RlSW5kZXgsIHByb3BOYW1lLCB2YWx1ZSwgc2FuaXRpemVyKTtcbiAgICBuZ0Rldk1vZGUgJiYgc3RvcmVQcm9wZXJ0eUJpbmRpbmdNZXRhZGF0YShsVmlld1tUVklFV10uZGF0YSwgbm9kZUluZGV4LCBwcm9wTmFtZSwgYmluZGluZ0luZGV4KTtcbiAgfVxuICByZXR1cm4gybXJtXByb3BlcnR5O1xufVxuXG4vKipcbiAqIEdpdmVuIGA8ZGl2IHN0eWxlPVwiLi4uXCIgbXktZGlyPmAgYW5kIGBNeURpcmAgd2l0aCBgQElucHV0KCdzdHlsZScpYCB3ZSBuZWVkIHRvIHdyaXRlIHRvXG4gKiBkaXJlY3RpdmUgaW5wdXQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzZXREaXJlY3RpdmVJbnB1dHNXaGljaFNoYWRvd3NTdHlsaW5nKFxuICAgIHROb2RlOiBUTm9kZSwgbFZpZXc6IExWaWV3LCB2YWx1ZTogYW55LCBpc0NsYXNzQmFzZWQ6IGJvb2xlYW4pIHtcbiAgY29uc3QgaW5wdXRzID0gdE5vZGUuaW5wdXRzICE7XG4gIGNvbnN0IHByb3BlcnR5ID0gaXNDbGFzc0Jhc2VkID8gJ2NsYXNzJyA6ICdzdHlsZSc7XG4gIC8vIFdlIHN1cHBvcnQgYm90aCAnY2xhc3MnIGFuZCBgY2xhc3NOYW1lYCBoZW5jZSB0aGUgZmFsbGJhY2suXG4gIGNvbnN0IHN0eWxpbmdJbnB1dHMgPSBpbnB1dHNbcHJvcGVydHldIHx8IChpc0NsYXNzQmFzZWQgJiYgaW5wdXRzWydjbGFzc05hbWUnXSk7XG4gIHNldElucHV0c0ZvclByb3BlcnR5KGxWaWV3LCBzdHlsaW5nSW5wdXRzLCBwcm9wZXJ0eSwgdmFsdWUpO1xufVxuIl19