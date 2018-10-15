/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { getContext } from '../context_discovery';
import { ACTIVE_INDEX } from '../interfaces/container';
import { FLAGS, HEADER_OFFSET, HOST } from '../interfaces/view';
import { getTNode } from '../util';
/** @type {?} */
export const EMPTY_ARR = [];
/** @type {?} */
export const EMPTY_OBJ = {};
/**
 * @param {?=} element
 * @param {?=} sanitizer
 * @param {?=} initialStylingValues
 * @return {?}
 */
export function createEmptyStylingContext(element, sanitizer, initialStylingValues) {
    return [
        null,
        // PlayerContext
        sanitizer || null,
        // StyleSanitizer
        initialStylingValues || [null],
        0,
        0,
        // ClassOffset
        element || null,
        null,
        null
    ];
}
/**
 * Used clone a copy of a pre-computed template of a styling context.
 *
 * A pre-computed template is designed to be computed once for a given element
 * (instructions.ts has logic for caching this).
 * @param {?} element
 * @param {?} templateStyleContext
 * @return {?}
 */
export function allocStylingContext(element, templateStyleContext) {
    /** @type {?} */
    const context = /** @type {?} */ ((templateStyleContext.slice()));
    context[5 /* ElementPosition */] = element;
    return context;
}
/**
 * Retrieve the `StylingContext` at a given index.
 *
 * This method lazily creates the `StylingContext`. This is because in most cases
 * we have styling without any bindings. Creating `StylingContext` eagerly would mean that
 * every style declaration such as `<div style="color: red">` would result `StyleContext`
 * which would create unnecessary memory pressure.
 *
 * @param {?} index Index of the style allocation. See: `elementStyling`.
 * @param {?} viewData The view to search for the styling context
 * @return {?}
 */
export function getStylingContext(index, viewData) {
    /** @type {?} */
    let storageIndex = index + HEADER_OFFSET;
    /** @type {?} */
    let slotValue = viewData[storageIndex];
    /** @type {?} */
    let wrapper = viewData;
    while (Array.isArray(slotValue)) {
        wrapper = slotValue;
        slotValue = /** @type {?} */ (slotValue[HOST]);
    }
    if (isStylingContext(wrapper)) {
        return /** @type {?} */ (wrapper);
    }
    else {
        /** @type {?} */
        const stylingTemplate = getTNode(index, viewData).stylingTemplate;
        if (wrapper !== viewData)
            storageIndex = HOST;
        return wrapper[storageIndex] = stylingTemplate ?
            allocStylingContext(slotValue, stylingTemplate) :
            createEmptyStylingContext(slotValue);
    }
}
/**
 * @param {?} value
 * @return {?}
 */
function isStylingContext(value) {
    // Not an LViewData or an LContainer
    return typeof value[FLAGS] !== 'number' && typeof value[ACTIVE_INDEX] !== 'number';
}
/**
 * @param {?} target
 * @param {?=} context
 * @return {?}
 */
export function getOrCreatePlayerContext(target, context) {
    context = context || /** @type {?} */ ((getContext(target)));
    if (ngDevMode && !context) {
        throw new Error('Only elements that exist in an Angular application can be used for player access');
    }
    const { lViewData, nodeIndex } = context;
    /** @type {?} */
    const stylingContext = getStylingContext(nodeIndex - HEADER_OFFSET, lViewData);
    return stylingContext[0 /* PlayerContext */] || allocPlayerContext(stylingContext);
}
/**
 * @param {?} data
 * @return {?}
 */
function allocPlayerContext(data) {
    return data[0 /* PlayerContext */] = [];
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvc3R5bGluZy91dGlsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBU0EsT0FBTyxFQUFDLFVBQVUsRUFBQyxNQUFNLHNCQUFzQixDQUFDO0FBQ2hELE9BQU8sRUFBQyxZQUFZLEVBQWEsTUFBTSx5QkFBeUIsQ0FBQztBQUtqRSxPQUFPLEVBQUMsS0FBSyxFQUFFLGFBQWEsRUFBRSxJQUFJLEVBQVksTUFBTSxvQkFBb0IsQ0FBQztBQUN6RSxPQUFPLEVBQUMsUUFBUSxFQUFDLE1BQU0sU0FBUyxDQUFDOztBQUVqQyxhQUFhLFNBQVMsR0FBVSxFQUFFLENBQUM7O0FBQ25DLGFBQWEsU0FBUyxHQUF5QixFQUFFLENBQUM7Ozs7Ozs7QUFFbEQsTUFBTSxVQUFVLHlCQUF5QixDQUNyQyxPQUF5QixFQUFFLFNBQWtDLEVBQzdELG9CQUFvQztJQUN0QyxPQUFPO1FBQ0wsSUFBSTs7UUFDSixTQUFTLElBQUksSUFBSTs7UUFDakIsb0JBQW9CLElBQUksQ0FBQyxJQUFJLENBQUM7UUFDOUIsQ0FBQztRQUNELENBQUM7O1FBQ0QsT0FBTyxJQUFJLElBQUk7UUFDZixJQUFJO1FBQ0osSUFBSTtLQUNMLENBQUM7Q0FDSDs7Ozs7Ozs7OztBQVFELE1BQU0sVUFBVSxtQkFBbUIsQ0FDL0IsT0FBd0IsRUFBRSxvQkFBb0M7O0lBRWhFLE1BQU0sT0FBTyxzQkFBRyxvQkFBb0IsQ0FBQyxLQUFLLEVBQVMsR0FBbUI7SUFDdEUsT0FBTyx5QkFBOEIsR0FBRyxPQUFPLENBQUM7SUFDaEQsT0FBTyxPQUFPLENBQUM7Q0FDaEI7Ozs7Ozs7Ozs7Ozs7QUFhRCxNQUFNLFVBQVUsaUJBQWlCLENBQUMsS0FBYSxFQUFFLFFBQW1COztJQUNsRSxJQUFJLFlBQVksR0FBRyxLQUFLLEdBQUcsYUFBYSxDQUFDOztJQUN6QyxJQUFJLFNBQVMsR0FBaUQsUUFBUSxDQUFDLFlBQVksQ0FBQyxDQUFDOztJQUNyRixJQUFJLE9BQU8sR0FBd0MsUUFBUSxDQUFDO0lBRTVELE9BQU8sS0FBSyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsRUFBRTtRQUMvQixPQUFPLEdBQUcsU0FBUyxDQUFDO1FBQ3BCLFNBQVMscUJBQUcsU0FBUyxDQUFDLElBQUksQ0FBMEMsQ0FBQSxDQUFDO0tBQ3RFO0lBRUQsSUFBSSxnQkFBZ0IsQ0FBQyxPQUFPLENBQUMsRUFBRTtRQUM3Qix5QkFBTyxPQUF5QixFQUFDO0tBQ2xDO1NBQU07O1FBRUwsTUFBTSxlQUFlLEdBQUcsUUFBUSxDQUFDLEtBQUssRUFBRSxRQUFRLENBQUMsQ0FBQyxlQUFlLENBQUM7UUFFbEUsSUFBSSxPQUFPLEtBQUssUUFBUTtZQUFFLFlBQVksR0FBRyxJQUFJLENBQUM7UUFDOUMsT0FBTyxPQUFPLENBQUMsWUFBWSxDQUFDLEdBQUcsZUFBZSxDQUFDLENBQUM7WUFDNUMsbUJBQW1CLENBQUMsU0FBUyxFQUFFLGVBQWUsQ0FBQyxDQUFDLENBQUM7WUFDakQseUJBQXlCLENBQUMsU0FBUyxDQUFDLENBQUM7S0FDMUM7Q0FDRjs7Ozs7QUFFRCxTQUFTLGdCQUFnQixDQUFDLEtBQThDOztJQUV0RSxPQUFPLE9BQU8sS0FBSyxDQUFDLEtBQUssQ0FBQyxLQUFLLFFBQVEsSUFBSSxPQUFPLEtBQUssQ0FBQyxZQUFZLENBQUMsS0FBSyxRQUFRLENBQUM7Q0FDcEY7Ozs7OztBQUVELE1BQU0sVUFBVSx3QkFBd0IsQ0FBQyxNQUFVLEVBQUUsT0FBeUI7SUFDNUUsT0FBTyxHQUFHLE9BQU8sdUJBQUksVUFBVSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUM7SUFDMUMsSUFBSSxTQUFTLElBQUksQ0FBQyxPQUFPLEVBQUU7UUFDekIsTUFBTSxJQUFJLEtBQUssQ0FDWCxrRkFBa0YsQ0FBQyxDQUFDO0tBQ3pGO0lBRUQsTUFBTSxFQUFDLFNBQVMsRUFBRSxTQUFTLEVBQUMsR0FBRyxPQUFPLENBQUM7O0lBQ3ZDLE1BQU0sY0FBYyxHQUFHLGlCQUFpQixDQUFDLFNBQVMsR0FBRyxhQUFhLEVBQUUsU0FBUyxDQUFDLENBQUM7SUFDL0UsT0FBTyxjQUFjLHVCQUE0QixJQUFJLGtCQUFrQixDQUFDLGNBQWMsQ0FBQyxDQUFDO0NBQ3pGOzs7OztBQUVELFNBQVMsa0JBQWtCLENBQUMsSUFBb0I7SUFDOUMsT0FBTyxJQUFJLHVCQUE0QixHQUFHLEVBQUUsQ0FBQztDQUM5QyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtTdHlsZVNhbml0aXplRm59IGZyb20gJy4uLy4uL3Nhbml0aXphdGlvbi9zdHlsZV9zYW5pdGl6ZXInO1xuaW1wb3J0IHtnZXRDb250ZXh0fSBmcm9tICcuLi9jb250ZXh0X2Rpc2NvdmVyeSc7XG5pbXBvcnQge0FDVElWRV9JTkRFWCwgTENvbnRhaW5lcn0gZnJvbSAnLi4vaW50ZXJmYWNlcy9jb250YWluZXInO1xuaW1wb3J0IHtMQ29udGV4dH0gZnJvbSAnLi4vaW50ZXJmYWNlcy9jb250ZXh0JztcbmltcG9ydCB7UGxheWVyQ29udGV4dH0gZnJvbSAnLi4vaW50ZXJmYWNlcy9wbGF5ZXInO1xuaW1wb3J0IHtSRWxlbWVudH0gZnJvbSAnLi4vaW50ZXJmYWNlcy9yZW5kZXJlcic7XG5pbXBvcnQge0luaXRpYWxTdHlsZXMsIFN0eWxpbmdDb250ZXh0LCBTdHlsaW5nSW5kZXh9IGZyb20gJy4uL2ludGVyZmFjZXMvc3R5bGluZyc7XG5pbXBvcnQge0ZMQUdTLCBIRUFERVJfT0ZGU0VULCBIT1NULCBMVmlld0RhdGF9IGZyb20gJy4uL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge2dldFROb2RlfSBmcm9tICcuLi91dGlsJztcblxuZXhwb3J0IGNvbnN0IEVNUFRZX0FSUjogYW55W10gPSBbXTtcbmV4cG9ydCBjb25zdCBFTVBUWV9PQko6IHtba2V5OiBzdHJpbmddOiBhbnl9ID0ge307XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVFbXB0eVN0eWxpbmdDb250ZXh0KFxuICAgIGVsZW1lbnQ/OiBSRWxlbWVudCB8IG51bGwsIHNhbml0aXplcj86IFN0eWxlU2FuaXRpemVGbiB8IG51bGwsXG4gICAgaW5pdGlhbFN0eWxpbmdWYWx1ZXM/OiBJbml0aWFsU3R5bGVzKTogU3R5bGluZ0NvbnRleHQge1xuICByZXR1cm4gW1xuICAgIG51bGwsICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFBsYXllckNvbnRleHRcbiAgICBzYW5pdGl6ZXIgfHwgbnVsbCwgICAgICAgICAgICAgICAvLyBTdHlsZVNhbml0aXplclxuICAgIGluaXRpYWxTdHlsaW5nVmFsdWVzIHx8IFtudWxsXSwgIC8vIEluaXRpYWxTdHlsZXNcbiAgICAwLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBNYXN0ZXJGbGFnc1xuICAgIDAsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIENsYXNzT2Zmc2V0XG4gICAgZWxlbWVudCB8fCBudWxsLCAgICAgICAgICAgICAgICAgLy8gRWxlbWVudFxuICAgIG51bGwsICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFByZXZpb3VzTXVsdGlDbGFzc1ZhbHVlXG4gICAgbnVsbCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gUHJldmlvdXNNdWx0aVN0eWxlVmFsdWVcbiAgXTtcbn1cblxuLyoqXG4gKiBVc2VkIGNsb25lIGEgY29weSBvZiBhIHByZS1jb21wdXRlZCB0ZW1wbGF0ZSBvZiBhIHN0eWxpbmcgY29udGV4dC5cbiAqXG4gKiBBIHByZS1jb21wdXRlZCB0ZW1wbGF0ZSBpcyBkZXNpZ25lZCB0byBiZSBjb21wdXRlZCBvbmNlIGZvciBhIGdpdmVuIGVsZW1lbnRcbiAqIChpbnN0cnVjdGlvbnMudHMgaGFzIGxvZ2ljIGZvciBjYWNoaW5nIHRoaXMpLlxuICovXG5leHBvcnQgZnVuY3Rpb24gYWxsb2NTdHlsaW5nQ29udGV4dChcbiAgICBlbGVtZW50OiBSRWxlbWVudCB8IG51bGwsIHRlbXBsYXRlU3R5bGVDb250ZXh0OiBTdHlsaW5nQ29udGV4dCk6IFN0eWxpbmdDb250ZXh0IHtcbiAgLy8gZWFjaCBpbnN0YW5jZSBnZXRzIGEgY29weVxuICBjb25zdCBjb250ZXh0ID0gdGVtcGxhdGVTdHlsZUNvbnRleHQuc2xpY2UoKSBhcyBhbnkgYXMgU3R5bGluZ0NvbnRleHQ7XG4gIGNvbnRleHRbU3R5bGluZ0luZGV4LkVsZW1lbnRQb3NpdGlvbl0gPSBlbGVtZW50O1xuICByZXR1cm4gY29udGV4dDtcbn1cblxuLyoqXG4gKiBSZXRyaWV2ZSB0aGUgYFN0eWxpbmdDb250ZXh0YCBhdCBhIGdpdmVuIGluZGV4LlxuICpcbiAqIFRoaXMgbWV0aG9kIGxhemlseSBjcmVhdGVzIHRoZSBgU3R5bGluZ0NvbnRleHRgLiBUaGlzIGlzIGJlY2F1c2UgaW4gbW9zdCBjYXNlc1xuICogd2UgaGF2ZSBzdHlsaW5nIHdpdGhvdXQgYW55IGJpbmRpbmdzLiBDcmVhdGluZyBgU3R5bGluZ0NvbnRleHRgIGVhZ2VybHkgd291bGQgbWVhbiB0aGF0XG4gKiBldmVyeSBzdHlsZSBkZWNsYXJhdGlvbiBzdWNoIGFzIGA8ZGl2IHN0eWxlPVwiY29sb3I6IHJlZFwiPmAgd291bGQgcmVzdWx0IGBTdHlsZUNvbnRleHRgXG4gKiB3aGljaCB3b3VsZCBjcmVhdGUgdW5uZWNlc3NhcnkgbWVtb3J5IHByZXNzdXJlLlxuICpcbiAqIEBwYXJhbSBpbmRleCBJbmRleCBvZiB0aGUgc3R5bGUgYWxsb2NhdGlvbi4gU2VlOiBgZWxlbWVudFN0eWxpbmdgLlxuICogQHBhcmFtIHZpZXdEYXRhIFRoZSB2aWV3IHRvIHNlYXJjaCBmb3IgdGhlIHN0eWxpbmcgY29udGV4dFxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0U3R5bGluZ0NvbnRleHQoaW5kZXg6IG51bWJlciwgdmlld0RhdGE6IExWaWV3RGF0YSk6IFN0eWxpbmdDb250ZXh0IHtcbiAgbGV0IHN0b3JhZ2VJbmRleCA9IGluZGV4ICsgSEVBREVSX09GRlNFVDtcbiAgbGV0IHNsb3RWYWx1ZTogTENvbnRhaW5lcnxMVmlld0RhdGF8U3R5bGluZ0NvbnRleHR8UkVsZW1lbnQgPSB2aWV3RGF0YVtzdG9yYWdlSW5kZXhdO1xuICBsZXQgd3JhcHBlcjogTENvbnRhaW5lcnxMVmlld0RhdGF8U3R5bGluZ0NvbnRleHQgPSB2aWV3RGF0YTtcblxuICB3aGlsZSAoQXJyYXkuaXNBcnJheShzbG90VmFsdWUpKSB7XG4gICAgd3JhcHBlciA9IHNsb3RWYWx1ZTtcbiAgICBzbG90VmFsdWUgPSBzbG90VmFsdWVbSE9TVF0gYXMgTFZpZXdEYXRhIHwgU3R5bGluZ0NvbnRleHQgfCBSRWxlbWVudDtcbiAgfVxuXG4gIGlmIChpc1N0eWxpbmdDb250ZXh0KHdyYXBwZXIpKSB7XG4gICAgcmV0dXJuIHdyYXBwZXIgYXMgU3R5bGluZ0NvbnRleHQ7XG4gIH0gZWxzZSB7XG4gICAgLy8gVGhpcyBpcyBhbiBMVmlld0RhdGEgb3IgYW4gTENvbnRhaW5lclxuICAgIGNvbnN0IHN0eWxpbmdUZW1wbGF0ZSA9IGdldFROb2RlKGluZGV4LCB2aWV3RGF0YSkuc3R5bGluZ1RlbXBsYXRlO1xuXG4gICAgaWYgKHdyYXBwZXIgIT09IHZpZXdEYXRhKSBzdG9yYWdlSW5kZXggPSBIT1NUO1xuICAgIHJldHVybiB3cmFwcGVyW3N0b3JhZ2VJbmRleF0gPSBzdHlsaW5nVGVtcGxhdGUgP1xuICAgICAgICBhbGxvY1N0eWxpbmdDb250ZXh0KHNsb3RWYWx1ZSwgc3R5bGluZ1RlbXBsYXRlKSA6XG4gICAgICAgIGNyZWF0ZUVtcHR5U3R5bGluZ0NvbnRleHQoc2xvdFZhbHVlKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBpc1N0eWxpbmdDb250ZXh0KHZhbHVlOiBMVmlld0RhdGEgfCBMQ29udGFpbmVyIHwgU3R5bGluZ0NvbnRleHQpIHtcbiAgLy8gTm90IGFuIExWaWV3RGF0YSBvciBhbiBMQ29udGFpbmVyXG4gIHJldHVybiB0eXBlb2YgdmFsdWVbRkxBR1NdICE9PSAnbnVtYmVyJyAmJiB0eXBlb2YgdmFsdWVbQUNUSVZFX0lOREVYXSAhPT0gJ251bWJlcic7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRPckNyZWF0ZVBsYXllckNvbnRleHQodGFyZ2V0OiB7fSwgY29udGV4dD86IExDb250ZXh0IHwgbnVsbCk6IFBsYXllckNvbnRleHQge1xuICBjb250ZXh0ID0gY29udGV4dCB8fCBnZXRDb250ZXh0KHRhcmdldCkgITtcbiAgaWYgKG5nRGV2TW9kZSAmJiAhY29udGV4dCkge1xuICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgJ09ubHkgZWxlbWVudHMgdGhhdCBleGlzdCBpbiBhbiBBbmd1bGFyIGFwcGxpY2F0aW9uIGNhbiBiZSB1c2VkIGZvciBwbGF5ZXIgYWNjZXNzJyk7XG4gIH1cblxuICBjb25zdCB7bFZpZXdEYXRhLCBub2RlSW5kZXh9ID0gY29udGV4dDtcbiAgY29uc3Qgc3R5bGluZ0NvbnRleHQgPSBnZXRTdHlsaW5nQ29udGV4dChub2RlSW5kZXggLSBIRUFERVJfT0ZGU0VULCBsVmlld0RhdGEpO1xuICByZXR1cm4gc3R5bGluZ0NvbnRleHRbU3R5bGluZ0luZGV4LlBsYXllckNvbnRleHRdIHx8IGFsbG9jUGxheWVyQ29udGV4dChzdHlsaW5nQ29udGV4dCk7XG59XG5cbmZ1bmN0aW9uIGFsbG9jUGxheWVyQ29udGV4dChkYXRhOiBTdHlsaW5nQ29udGV4dCk6IFBsYXllckNvbnRleHQge1xuICByZXR1cm4gZGF0YVtTdHlsaW5nSW5kZXguUGxheWVyQ29udGV4dF0gPSBbXTtcbn1cbiJdfQ==