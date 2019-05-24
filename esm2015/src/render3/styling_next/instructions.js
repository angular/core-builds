/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
import { BINDING_INDEX, HEADER_OFFSET, HOST, RENDERER } from '../interfaces/view';
import { getActiveDirectiveId, getActiveDirectiveSuperClassDepth, getActiveDirectiveSuperClassHeight, getLView, getSelectedIndex } from '../state';
import { NO_CHANGE } from '../tokens';
import { getTNode, isStylingContext as isOldStylingContext } from '../util/view_utils';
import { applyClasses, applyStyles, registerBinding, updateClassBinding, updateStyleBinding } from './bindings';
import { activeStylingMapFeature, normalizeIntoStylingMap } from './map_based_bindings';
import { attachStylingDebugObject } from './styling_debug';
import { allocStylingContext, hasValueChanged, updateContextDirectiveIndex } from './util';
/**
 * --------
 *
 * This file contains the core logic for how styling instructions are processed in Angular.
 *
 * To learn more about the algorithm see `TStylingContext`.
 *
 * --------
 */
/**
 * Temporary function to bridge styling functionality between this new
 * refactor (which is here inside of `styling_next/`) and the old
 * implementation (which lives inside of `styling/`).
 *
 * This function is executed during the creation block of an element.
 * Because the existing styling implementation issues a call to the
 * `styling()` instruction, this instruction will also get run. The
 * central idea here is that the directive index values are bound
 * into the context. The directive index is temporary and is only
 * required until the `select(n)` instruction is fully functional.
 * @return {?}
 */
export function stylingInit() {
    /** @type {?} */
    const lView = getLView();
    /** @type {?} */
    const index = getSelectedIndex();
    /** @type {?} */
    const tNode = getTNode(index, lView);
    updateLastDirectiveIndex(tNode, getActiveDirectiveStylingIndex());
}
/**
 * Mirror implementation of the `styleProp()` instruction (found in `instructions/styling.ts`).
 * @param {?} prop
 * @param {?} value
 * @param {?=} suffix
 * @return {?}
 */
export function styleProp(prop, value, suffix) {
    _stylingProp(prop, value, false);
}
/**
 * Mirror implementation of the `classProp()` instruction (found in `instructions/styling.ts`).
 * @param {?} className
 * @param {?} value
 * @return {?}
 */
export function classProp(className, value) {
    _stylingProp(className, value, true);
}
/**
 * Shared function used to update a prop-based styling binding for an element.
 * @param {?} prop
 * @param {?} value
 * @param {?} isClassBased
 * @return {?}
 */
function _stylingProp(prop, value, isClassBased) {
    /** @type {?} */
    const index = getSelectedIndex();
    /** @type {?} */
    const lView = getLView();
    /** @type {?} */
    const bindingIndex = lView[BINDING_INDEX]++;
    /** @type {?} */
    const tNode = getTNode(index, lView);
    /** @type {?} */
    const defer = getActiveDirectiveSuperClassHeight() > 0;
    if (isClassBased) {
        updateClassBinding(getClassesContext(tNode), lView, prop, bindingIndex, (/** @type {?} */ (value)), defer);
    }
    else {
        updateStyleBinding(getStylesContext(tNode), lView, prop, bindingIndex, (/** @type {?} */ (value)), defer);
    }
}
/**
 * Mirror implementation of the `styleMap()` instruction (found in `instructions/styling.ts`).
 * @param {?} styles
 * @return {?}
 */
export function styleMap(styles) {
    _stylingMap(styles, false);
}
/**
 * Mirror implementation of the `classMap()` instruction (found in `instructions/styling.ts`).
 * @param {?} classes
 * @return {?}
 */
export function classMap(classes) {
    _stylingMap(classes, true);
}
/**
 * Shared function used to update a map-based styling binding for an element.
 *
 * When this function is called it will activate support for `[style]` and
 * `[class]` bindings in Angular.
 * @param {?} value
 * @param {?} isClassBased
 * @return {?}
 */
function _stylingMap(value, isClassBased) {
    activeStylingMapFeature();
    /** @type {?} */
    const index = getSelectedIndex();
    /** @type {?} */
    const lView = getLView();
    /** @type {?} */
    const bindingIndex = lView[BINDING_INDEX]++;
    if (value !== NO_CHANGE) {
        /** @type {?} */
        const tNode = getTNode(index, lView);
        /** @type {?} */
        const defer = getActiveDirectiveSuperClassHeight() > 0;
        /** @type {?} */
        const oldValue = lView[bindingIndex];
        /** @type {?} */
        const valueHasChanged = hasValueChanged(oldValue, value);
        /** @type {?} */
        const lStylingMap = normalizeIntoStylingMap(oldValue, value);
        if (isClassBased) {
            updateClassBinding(getClassesContext(tNode), lView, null, bindingIndex, lStylingMap, defer, valueHasChanged);
        }
        else {
            updateStyleBinding(getStylesContext(tNode), lView, null, bindingIndex, lStylingMap, defer, valueHasChanged);
        }
    }
}
/**
 * Temporary function to bridge styling functionality between this new
 * refactor (which is here inside of `styling_next/`) and the old
 * implementation (which lives inside of `styling/`).
 *
 * The new styling refactor ensures that styling flushing is called
 * automatically when a template function exits or a follow-up element
 * is visited (i.e. when `select(n)` is called). Because the `select(n)`
 * instruction is not fully implemented yet (it doesn't actually execute
 * host binding instruction code at the right time), this means that a
 * styling apply function is still needed.
 *
 * This function is a mirror implementation of the `stylingApply()`
 * instruction (found in `instructions/styling.ts`).
 * @return {?}
 */
export function stylingApply() {
    /** @type {?} */
    const index = getSelectedIndex();
    /** @type {?} */
    const lView = getLView();
    /** @type {?} */
    const tNode = getTNode(index, lView);
    /** @type {?} */
    const renderer = getRenderer(tNode, lView);
    /** @type {?} */
    const native = getNativeFromLView(index, lView);
    /** @type {?} */
    const directiveIndex = getActiveDirectiveStylingIndex();
    applyClasses(renderer, lView, getClassesContext(tNode), native, directiveIndex);
    applyStyles(renderer, lView, getStylesContext(tNode), native, directiveIndex);
}
/**
 * Temporary function to bridge styling functionality between this new
 * refactor (which is here inside of `styling_next/`) and the old
 * implementation (which lives inside of `styling/`).
 *
 * The purpose of this function is to traverse through the LView data
 * for a specific element index and return the native node. Because the
 * current implementation relies on there being a styling context array,
 * the code below will need to loop through these array values until it
 * gets a native element node.
 *
 * Note that this code is temporary and will disappear once the new
 * styling refactor lands in its entirety.
 * @param {?} index
 * @param {?} viewData
 * @return {?}
 */
function getNativeFromLView(index, viewData) {
    /** @type {?} */
    let storageIndex = index + HEADER_OFFSET;
    /** @type {?} */
    let slotValue = viewData[storageIndex];
    /** @type {?} */
    let wrapper = viewData;
    while (Array.isArray(slotValue)) {
        wrapper = slotValue;
        slotValue = (/** @type {?} */ (slotValue[HOST]));
    }
    if (isOldStylingContext(wrapper)) {
        return (/** @type {?} */ (wrapper[0 /* ElementPosition */]));
    }
    else {
        return slotValue;
    }
}
/**
 * @param {?} tNode
 * @param {?} lView
 * @return {?}
 */
function getRenderer(tNode, lView) {
    return tNode.type === 3 /* Element */ ? lView[RENDERER] : null;
}
/**
 * Searches and assigns provided all static style/class entries (found in the `attrs` value)
 * and registers them in their respective styling contexts.
 * @param {?} tNode
 * @param {?} attrs
 * @param {?} startIndex
 * @return {?}
 */
export function registerInitialStylingIntoContext(tNode, attrs, startIndex) {
    /** @type {?} */
    let classesContext;
    /** @type {?} */
    let stylesContext;
    /** @type {?} */
    let mode = -1;
    for (let i = startIndex; i < attrs.length; i++) {
        /** @type {?} */
        const attr = attrs[i];
        if (typeof attr == 'number') {
            mode = attr;
        }
        else if (mode == 1 /* Classes */) {
            classesContext = classesContext || getClassesContext(tNode);
            registerBinding(classesContext, -1, (/** @type {?} */ (attr)), true);
        }
        else if (mode == 2 /* Styles */) {
            stylesContext = stylesContext || getStylesContext(tNode);
            registerBinding(stylesContext, -1, (/** @type {?} */ (attr)), (/** @type {?} */ (attrs[++i])));
        }
    }
}
/**
 * Mirror implementation of the same function found in `instructions/styling.ts`.
 * @return {?}
 */
export function getActiveDirectiveStylingIndex() {
    // whenever a directive's hostBindings function is called a uniqueId value
    // is assigned. Normally this is enough to help distinguish one directive
    // from another for the styling context, but there are situations where a
    // sub-class directive could inherit and assign styling in concert with a
    // parent directive. To help the styling code distinguish between a parent
    // sub-classed directive the inheritance depth is taken into account as well.
    return getActiveDirectiveId() + getActiveDirectiveSuperClassDepth();
}
/**
 * Temporary function that will update the max directive index value in
 * both the classes and styles contexts present on the provided `tNode`.
 *
 * This code is only used because the `select(n)` code functionality is not
 * yet 100% functional. The `select(n)` instruction cannot yet evaluate host
 * bindings function code in sync with the associated template function code.
 * For this reason the styling algorithm needs to track the last directive index
 * value so that it knows exactly when to render styling to the element since
 * `stylingApply()` is called multiple times per CD (`stylingApply` will be
 * removed once `select(n)` is fixed).
 * @param {?} tNode
 * @param {?} directiveIndex
 * @return {?}
 */
function updateLastDirectiveIndex(tNode, directiveIndex) {
    updateContextDirectiveIndex(getClassesContext(tNode), directiveIndex);
    updateContextDirectiveIndex(getStylesContext(tNode), directiveIndex);
}
/**
 * @param {?} tNode
 * @return {?}
 */
function getStylesContext(tNode) {
    return getContext(tNode, false);
}
/**
 * @param {?} tNode
 * @return {?}
 */
function getClassesContext(tNode) {
    return getContext(tNode, true);
}
/**
 * Returns/instantiates a styling context from/to a `tNode` instance.
 * @param {?} tNode
 * @param {?} isClassBased
 * @return {?}
 */
function getContext(tNode, isClassBased) {
    /** @type {?} */
    let context = isClassBased ? tNode.newClasses : tNode.newStyles;
    if (!context) {
        context = allocStylingContext();
        if (ngDevMode) {
            attachStylingDebugObject(context);
        }
        if (isClassBased) {
            tNode.newClasses = context;
        }
        else {
            tNode.newStyles = context;
        }
    }
    return context;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5zdHJ1Y3Rpb25zLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9zdHlsaW5nX25leHQvaW5zdHJ1Y3Rpb25zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7QUFXQSxPQUFPLEVBQUMsYUFBYSxFQUFFLGFBQWEsRUFBRSxJQUFJLEVBQVMsUUFBUSxFQUFDLE1BQU0sb0JBQW9CLENBQUM7QUFDdkYsT0FBTyxFQUFDLG9CQUFvQixFQUFFLGlDQUFpQyxFQUFFLGtDQUFrQyxFQUFFLFFBQVEsRUFBRSxnQkFBZ0IsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUNqSixPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sV0FBVyxDQUFDO0FBQ3BDLE9BQU8sRUFBQyxRQUFRLEVBQUUsZ0JBQWdCLElBQUksbUJBQW1CLEVBQUMsTUFBTSxvQkFBb0IsQ0FBQztBQUVyRixPQUFPLEVBQUMsWUFBWSxFQUFFLFdBQVcsRUFBRSxlQUFlLEVBQUUsa0JBQWtCLEVBQUUsa0JBQWtCLEVBQUMsTUFBTSxZQUFZLENBQUM7QUFFOUcsT0FBTyxFQUFDLHVCQUF1QixFQUFFLHVCQUF1QixFQUFDLE1BQU0sc0JBQXNCLENBQUM7QUFDdEYsT0FBTyxFQUFDLHdCQUF3QixFQUFDLE1BQU0saUJBQWlCLENBQUM7QUFDekQsT0FBTyxFQUFDLG1CQUFtQixFQUFFLGVBQWUsRUFBRSwyQkFBMkIsRUFBQyxNQUFNLFFBQVEsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUEwQnpGLE1BQU0sVUFBVSxXQUFXOztVQUNuQixLQUFLLEdBQUcsUUFBUSxFQUFFOztVQUNsQixLQUFLLEdBQUcsZ0JBQWdCLEVBQUU7O1VBQzFCLEtBQUssR0FBRyxRQUFRLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQztJQUNwQyx3QkFBd0IsQ0FBQyxLQUFLLEVBQUUsOEJBQThCLEVBQUUsQ0FBQyxDQUFDO0FBQ3BFLENB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QWMsQ0FBQyxDQUFDO0FBQ3ZFLENBQUM7Ozs7O0FBRUQsU0FBUyxnQkFBZ0IsQ0FBQyxLQUFZO0lBQ3BDLE9BQU8sVUFBVSxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQztBQUNsQyxDQUFDOzs7OztBQUVELFNBQVMsaUJBQWlCLENBQUMsS0FBWTtJQUNyQyxPQUFPLFVBQVUsQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLENBQUM7QUFDakMsQ0FBQzs7Ozs7OztBQUtELFNBQVMsVUFBVSxDQUFDLEtBQVksRUFBRSxZQUFxQjs7UUFDakQsT0FBTyxHQUFHLFlBQVksQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLFNBQVM7SUFDL0QsSUFBSSxDQUFDLE9BQU8sRUFBRTtRQUNaLE9BQU8sR0FBRyxtQkFBbUIsRUFBRSxDQUFDO1FBQ2hDLElBQUksU0FBUyxFQUFFO1lBQ2Isd0JBQXdCLENBQUMsT0FBTyxDQUFDLENBQUM7U0FDbkM7UUFDRCxJQUFJLFlBQVksRUFBRTtZQUNoQixLQUFLLENBQUMsVUFBVSxHQUFHLE9BQU8sQ0FBQztTQUM1QjthQUFNO1lBQ0wsS0FBSyxDQUFDLFNBQVMsR0FBRyxPQUFPLENBQUM7U0FDM0I7S0FDRjtJQUNELE9BQU8sT0FBTyxDQUFDO0FBQ2pCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiogQGxpY2Vuc2VcbiogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4qXG4qIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4qIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiovXG5pbXBvcnQge0xDb250YWluZXJ9IGZyb20gJy4uL2ludGVyZmFjZXMvY29udGFpbmVyJztcbmltcG9ydCB7QXR0cmlidXRlTWFya2VyLCBUQXR0cmlidXRlcywgVE5vZGUsIFROb2RlVHlwZX0gZnJvbSAnLi4vaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB7UkVsZW1lbnR9IGZyb20gJy4uL2ludGVyZmFjZXMvcmVuZGVyZXInO1xuaW1wb3J0IHtTdHlsaW5nQ29udGV4dCBhcyBPbGRTdHlsaW5nQ29udGV4dCwgU3R5bGluZ0luZGV4IGFzIE9sZFN0eWxpbmdJbmRleH0gZnJvbSAnLi4vaW50ZXJmYWNlcy9zdHlsaW5nJztcbmltcG9ydCB7QklORElOR19JTkRFWCwgSEVBREVSX09GRlNFVCwgSE9TVCwgTFZpZXcsIFJFTkRFUkVSfSBmcm9tICcuLi9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHtnZXRBY3RpdmVEaXJlY3RpdmVJZCwgZ2V0QWN0aXZlRGlyZWN0aXZlU3VwZXJDbGFzc0RlcHRoLCBnZXRBY3RpdmVEaXJlY3RpdmVTdXBlckNsYXNzSGVpZ2h0LCBnZXRMVmlldywgZ2V0U2VsZWN0ZWRJbmRleH0gZnJvbSAnLi4vc3RhdGUnO1xuaW1wb3J0IHtOT19DSEFOR0V9IGZyb20gJy4uL3Rva2Vucyc7XG5pbXBvcnQge2dldFROb2RlLCBpc1N0eWxpbmdDb250ZXh0IGFzIGlzT2xkU3R5bGluZ0NvbnRleHR9IGZyb20gJy4uL3V0aWwvdmlld191dGlscyc7XG5cbmltcG9ydCB7YXBwbHlDbGFzc2VzLCBhcHBseVN0eWxlcywgcmVnaXN0ZXJCaW5kaW5nLCB1cGRhdGVDbGFzc0JpbmRpbmcsIHVwZGF0ZVN0eWxlQmluZGluZ30gZnJvbSAnLi9iaW5kaW5ncyc7XG5pbXBvcnQge1RTdHlsaW5nQ29udGV4dH0gZnJvbSAnLi9pbnRlcmZhY2VzJztcbmltcG9ydCB7YWN0aXZlU3R5bGluZ01hcEZlYXR1cmUsIG5vcm1hbGl6ZUludG9TdHlsaW5nTWFwfSBmcm9tICcuL21hcF9iYXNlZF9iaW5kaW5ncyc7XG5pbXBvcnQge2F0dGFjaFN0eWxpbmdEZWJ1Z09iamVjdH0gZnJvbSAnLi9zdHlsaW5nX2RlYnVnJztcbmltcG9ydCB7YWxsb2NTdHlsaW5nQ29udGV4dCwgaGFzVmFsdWVDaGFuZ2VkLCB1cGRhdGVDb250ZXh0RGlyZWN0aXZlSW5kZXh9IGZyb20gJy4vdXRpbCc7XG5cblxuXG4vKipcbiAqIC0tLS0tLS0tXG4gKlxuICogVGhpcyBmaWxlIGNvbnRhaW5zIHRoZSBjb3JlIGxvZ2ljIGZvciBob3cgc3R5bGluZyBpbnN0cnVjdGlvbnMgYXJlIHByb2Nlc3NlZCBpbiBBbmd1bGFyLlxuICpcbiAqIFRvIGxlYXJuIG1vcmUgYWJvdXQgdGhlIGFsZ29yaXRobSBzZWUgYFRTdHlsaW5nQ29udGV4dGAuXG4gKlxuICogLS0tLS0tLS1cbiAqL1xuXG4vKipcbiAqIFRlbXBvcmFyeSBmdW5jdGlvbiB0byBicmlkZ2Ugc3R5bGluZyBmdW5jdGlvbmFsaXR5IGJldHdlZW4gdGhpcyBuZXdcbiAqIHJlZmFjdG9yICh3aGljaCBpcyBoZXJlIGluc2lkZSBvZiBgc3R5bGluZ19uZXh0L2ApIGFuZCB0aGUgb2xkXG4gKiBpbXBsZW1lbnRhdGlvbiAod2hpY2ggbGl2ZXMgaW5zaWRlIG9mIGBzdHlsaW5nL2ApLlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gaXMgZXhlY3V0ZWQgZHVyaW5nIHRoZSBjcmVhdGlvbiBibG9jayBvZiBhbiBlbGVtZW50LlxuICogQmVjYXVzZSB0aGUgZXhpc3Rpbmcgc3R5bGluZyBpbXBsZW1lbnRhdGlvbiBpc3N1ZXMgYSBjYWxsIHRvIHRoZVxuICogYHN0eWxpbmcoKWAgaW5zdHJ1Y3Rpb24sIHRoaXMgaW5zdHJ1Y3Rpb24gd2lsbCBhbHNvIGdldCBydW4uIFRoZVxuICogY2VudHJhbCBpZGVhIGhlcmUgaXMgdGhhdCB0aGUgZGlyZWN0aXZlIGluZGV4IHZhbHVlcyBhcmUgYm91bmRcbiAqIGludG8gdGhlIGNvbnRleHQuIFRoZSBkaXJlY3RpdmUgaW5kZXggaXMgdGVtcG9yYXJ5IGFuZCBpcyBvbmx5XG4gKiByZXF1aXJlZCB1bnRpbCB0aGUgYHNlbGVjdChuKWAgaW5zdHJ1Y3Rpb24gaXMgZnVsbHkgZnVuY3Rpb25hbC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHN0eWxpbmdJbml0KCkge1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IGluZGV4ID0gZ2V0U2VsZWN0ZWRJbmRleCgpO1xuICBjb25zdCB0Tm9kZSA9IGdldFROb2RlKGluZGV4LCBsVmlldyk7XG4gIHVwZGF0ZUxhc3REaXJlY3RpdmVJbmRleCh0Tm9kZSwgZ2V0QWN0aXZlRGlyZWN0aXZlU3R5bGluZ0luZGV4KCkpO1xufVxuXG4vKipcbiAqIE1pcnJvciBpbXBsZW1lbnRhdGlvbiBvZiB0aGUgYHN0eWxlUHJvcCgpYCBpbnN0cnVjdGlvbiAoZm91bmQgaW4gYGluc3RydWN0aW9ucy9zdHlsaW5nLnRzYCkuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzdHlsZVByb3AoXG4gICAgcHJvcDogc3RyaW5nLCB2YWx1ZTogc3RyaW5nIHwgbnVtYmVyIHwgU3RyaW5nIHwgbnVsbCwgc3VmZml4Pzogc3RyaW5nIHwgbnVsbCk6IHZvaWQge1xuICBfc3R5bGluZ1Byb3AocHJvcCwgdmFsdWUsIGZhbHNlKTtcbn1cblxuLyoqXG4gKiBNaXJyb3IgaW1wbGVtZW50YXRpb24gb2YgdGhlIGBjbGFzc1Byb3AoKWAgaW5zdHJ1Y3Rpb24gKGZvdW5kIGluIGBpbnN0cnVjdGlvbnMvc3R5bGluZy50c2ApLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY2xhc3NQcm9wKGNsYXNzTmFtZTogc3RyaW5nLCB2YWx1ZTogYm9vbGVhbiB8IG51bGwpOiB2b2lkIHtcbiAgX3N0eWxpbmdQcm9wKGNsYXNzTmFtZSwgdmFsdWUsIHRydWUpO1xufVxuXG4vKipcbiAqIFNoYXJlZCBmdW5jdGlvbiB1c2VkIHRvIHVwZGF0ZSBhIHByb3AtYmFzZWQgc3R5bGluZyBiaW5kaW5nIGZvciBhbiBlbGVtZW50LlxuICovXG5mdW5jdGlvbiBfc3R5bGluZ1Byb3AoXG4gICAgcHJvcDogc3RyaW5nLCB2YWx1ZTogYm9vbGVhbiB8IG51bWJlciB8IFN0cmluZyB8IHN0cmluZyB8IG51bGwsIGlzQ2xhc3NCYXNlZDogYm9vbGVhbikge1xuICBjb25zdCBpbmRleCA9IGdldFNlbGVjdGVkSW5kZXgoKTtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCBiaW5kaW5nSW5kZXggPSBsVmlld1tCSU5ESU5HX0lOREVYXSsrO1xuICBjb25zdCB0Tm9kZSA9IGdldFROb2RlKGluZGV4LCBsVmlldyk7XG4gIGNvbnN0IGRlZmVyID0gZ2V0QWN0aXZlRGlyZWN0aXZlU3VwZXJDbGFzc0hlaWdodCgpID4gMDtcbiAgaWYgKGlzQ2xhc3NCYXNlZCkge1xuICAgIHVwZGF0ZUNsYXNzQmluZGluZyhcbiAgICAgICAgZ2V0Q2xhc3Nlc0NvbnRleHQodE5vZGUpLCBsVmlldywgcHJvcCwgYmluZGluZ0luZGV4LCB2YWx1ZSBhcyBzdHJpbmcgfCBib29sZWFuIHwgbnVsbCxcbiAgICAgICAgZGVmZXIpO1xuICB9IGVsc2Uge1xuICAgIHVwZGF0ZVN0eWxlQmluZGluZyhcbiAgICAgICAgZ2V0U3R5bGVzQ29udGV4dCh0Tm9kZSksIGxWaWV3LCBwcm9wLCBiaW5kaW5nSW5kZXgsIHZhbHVlIGFzIHN0cmluZyB8IG51bGwsIGRlZmVyKTtcbiAgfVxufVxuXG4vKipcbiAqIE1pcnJvciBpbXBsZW1lbnRhdGlvbiBvZiB0aGUgYHN0eWxlTWFwKClgIGluc3RydWN0aW9uIChmb3VuZCBpbiBgaW5zdHJ1Y3Rpb25zL3N0eWxpbmcudHNgKS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHN0eWxlTWFwKHN0eWxlczoge1tzdHlsZU5hbWU6IHN0cmluZ106IGFueX0gfCBOT19DSEFOR0UgfCBudWxsKTogdm9pZCB7XG4gIF9zdHlsaW5nTWFwKHN0eWxlcywgZmFsc2UpO1xufVxuXG4vKipcbiAqIE1pcnJvciBpbXBsZW1lbnRhdGlvbiBvZiB0aGUgYGNsYXNzTWFwKClgIGluc3RydWN0aW9uIChmb3VuZCBpbiBgaW5zdHJ1Y3Rpb25zL3N0eWxpbmcudHNgKS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNsYXNzTWFwKGNsYXNzZXM6IHtbY2xhc3NOYW1lOiBzdHJpbmddOiBhbnl9IHwgTk9fQ0hBTkdFIHwgc3RyaW5nIHwgbnVsbCk6IHZvaWQge1xuICBfc3R5bGluZ01hcChjbGFzc2VzLCB0cnVlKTtcbn1cblxuLyoqXG4gKiBTaGFyZWQgZnVuY3Rpb24gdXNlZCB0byB1cGRhdGUgYSBtYXAtYmFzZWQgc3R5bGluZyBiaW5kaW5nIGZvciBhbiBlbGVtZW50LlxuICpcbiAqIFdoZW4gdGhpcyBmdW5jdGlvbiBpcyBjYWxsZWQgaXQgd2lsbCBhY3RpdmF0ZSBzdXBwb3J0IGZvciBgW3N0eWxlXWAgYW5kXG4gKiBgW2NsYXNzXWAgYmluZGluZ3MgaW4gQW5ndWxhci5cbiAqL1xuZnVuY3Rpb24gX3N0eWxpbmdNYXAodmFsdWU6IHtba2V5OiBzdHJpbmddOiBhbnl9IHwgc3RyaW5nIHwgbnVsbCwgaXNDbGFzc0Jhc2VkOiBib29sZWFuKSB7XG4gIGFjdGl2ZVN0eWxpbmdNYXBGZWF0dXJlKCk7XG4gIGNvbnN0IGluZGV4ID0gZ2V0U2VsZWN0ZWRJbmRleCgpO1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IGJpbmRpbmdJbmRleCA9IGxWaWV3W0JJTkRJTkdfSU5ERVhdKys7XG5cbiAgaWYgKHZhbHVlICE9PSBOT19DSEFOR0UpIHtcbiAgICBjb25zdCB0Tm9kZSA9IGdldFROb2RlKGluZGV4LCBsVmlldyk7XG4gICAgY29uc3QgZGVmZXIgPSBnZXRBY3RpdmVEaXJlY3RpdmVTdXBlckNsYXNzSGVpZ2h0KCkgPiAwO1xuICAgIGNvbnN0IG9sZFZhbHVlID0gbFZpZXdbYmluZGluZ0luZGV4XTtcbiAgICBjb25zdCB2YWx1ZUhhc0NoYW5nZWQgPSBoYXNWYWx1ZUNoYW5nZWQob2xkVmFsdWUsIHZhbHVlKTtcbiAgICBjb25zdCBsU3R5bGluZ01hcCA9IG5vcm1hbGl6ZUludG9TdHlsaW5nTWFwKG9sZFZhbHVlLCB2YWx1ZSk7XG4gICAgaWYgKGlzQ2xhc3NCYXNlZCkge1xuICAgICAgdXBkYXRlQ2xhc3NCaW5kaW5nKFxuICAgICAgICAgIGdldENsYXNzZXNDb250ZXh0KHROb2RlKSwgbFZpZXcsIG51bGwsIGJpbmRpbmdJbmRleCwgbFN0eWxpbmdNYXAsIGRlZmVyLCB2YWx1ZUhhc0NoYW5nZWQpO1xuICAgIH0gZWxzZSB7XG4gICAgICB1cGRhdGVTdHlsZUJpbmRpbmcoXG4gICAgICAgICAgZ2V0U3R5bGVzQ29udGV4dCh0Tm9kZSksIGxWaWV3LCBudWxsLCBiaW5kaW5nSW5kZXgsIGxTdHlsaW5nTWFwLCBkZWZlciwgdmFsdWVIYXNDaGFuZ2VkKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBUZW1wb3JhcnkgZnVuY3Rpb24gdG8gYnJpZGdlIHN0eWxpbmcgZnVuY3Rpb25hbGl0eSBiZXR3ZWVuIHRoaXMgbmV3XG4gKiByZWZhY3RvciAod2hpY2ggaXMgaGVyZSBpbnNpZGUgb2YgYHN0eWxpbmdfbmV4dC9gKSBhbmQgdGhlIG9sZFxuICogaW1wbGVtZW50YXRpb24gKHdoaWNoIGxpdmVzIGluc2lkZSBvZiBgc3R5bGluZy9gKS5cbiAqXG4gKiBUaGUgbmV3IHN0eWxpbmcgcmVmYWN0b3IgZW5zdXJlcyB0aGF0IHN0eWxpbmcgZmx1c2hpbmcgaXMgY2FsbGVkXG4gKiBhdXRvbWF0aWNhbGx5IHdoZW4gYSB0ZW1wbGF0ZSBmdW5jdGlvbiBleGl0cyBvciBhIGZvbGxvdy11cCBlbGVtZW50XG4gKiBpcyB2aXNpdGVkIChpLmUuIHdoZW4gYHNlbGVjdChuKWAgaXMgY2FsbGVkKS4gQmVjYXVzZSB0aGUgYHNlbGVjdChuKWBcbiAqIGluc3RydWN0aW9uIGlzIG5vdCBmdWxseSBpbXBsZW1lbnRlZCB5ZXQgKGl0IGRvZXNuJ3QgYWN0dWFsbHkgZXhlY3V0ZVxuICogaG9zdCBiaW5kaW5nIGluc3RydWN0aW9uIGNvZGUgYXQgdGhlIHJpZ2h0IHRpbWUpLCB0aGlzIG1lYW5zIHRoYXQgYVxuICogc3R5bGluZyBhcHBseSBmdW5jdGlvbiBpcyBzdGlsbCBuZWVkZWQuXG4gKlxuICogVGhpcyBmdW5jdGlvbiBpcyBhIG1pcnJvciBpbXBsZW1lbnRhdGlvbiBvZiB0aGUgYHN0eWxpbmdBcHBseSgpYFxuICogaW5zdHJ1Y3Rpb24gKGZvdW5kIGluIGBpbnN0cnVjdGlvbnMvc3R5bGluZy50c2ApLlxuICovXG5leHBvcnQgZnVuY3Rpb24gc3R5bGluZ0FwcGx5KCkge1xuICBjb25zdCBpbmRleCA9IGdldFNlbGVjdGVkSW5kZXgoKTtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCB0Tm9kZSA9IGdldFROb2RlKGluZGV4LCBsVmlldyk7XG4gIGNvbnN0IHJlbmRlcmVyID0gZ2V0UmVuZGVyZXIodE5vZGUsIGxWaWV3KTtcbiAgY29uc3QgbmF0aXZlID0gZ2V0TmF0aXZlRnJvbUxWaWV3KGluZGV4LCBsVmlldyk7XG4gIGNvbnN0IGRpcmVjdGl2ZUluZGV4ID0gZ2V0QWN0aXZlRGlyZWN0aXZlU3R5bGluZ0luZGV4KCk7XG4gIGFwcGx5Q2xhc3NlcyhyZW5kZXJlciwgbFZpZXcsIGdldENsYXNzZXNDb250ZXh0KHROb2RlKSwgbmF0aXZlLCBkaXJlY3RpdmVJbmRleCk7XG4gIGFwcGx5U3R5bGVzKHJlbmRlcmVyLCBsVmlldywgZ2V0U3R5bGVzQ29udGV4dCh0Tm9kZSksIG5hdGl2ZSwgZGlyZWN0aXZlSW5kZXgpO1xufVxuXG4vKipcbiAqIFRlbXBvcmFyeSBmdW5jdGlvbiB0byBicmlkZ2Ugc3R5bGluZyBmdW5jdGlvbmFsaXR5IGJldHdlZW4gdGhpcyBuZXdcbiAqIHJlZmFjdG9yICh3aGljaCBpcyBoZXJlIGluc2lkZSBvZiBgc3R5bGluZ19uZXh0L2ApIGFuZCB0aGUgb2xkXG4gKiBpbXBsZW1lbnRhdGlvbiAod2hpY2ggbGl2ZXMgaW5zaWRlIG9mIGBzdHlsaW5nL2ApLlxuICpcbiAqIFRoZSBwdXJwb3NlIG9mIHRoaXMgZnVuY3Rpb24gaXMgdG8gdHJhdmVyc2UgdGhyb3VnaCB0aGUgTFZpZXcgZGF0YVxuICogZm9yIGEgc3BlY2lmaWMgZWxlbWVudCBpbmRleCBhbmQgcmV0dXJuIHRoZSBuYXRpdmUgbm9kZS4gQmVjYXVzZSB0aGVcbiAqIGN1cnJlbnQgaW1wbGVtZW50YXRpb24gcmVsaWVzIG9uIHRoZXJlIGJlaW5nIGEgc3R5bGluZyBjb250ZXh0IGFycmF5LFxuICogdGhlIGNvZGUgYmVsb3cgd2lsbCBuZWVkIHRvIGxvb3AgdGhyb3VnaCB0aGVzZSBhcnJheSB2YWx1ZXMgdW50aWwgaXRcbiAqIGdldHMgYSBuYXRpdmUgZWxlbWVudCBub2RlLlxuICpcbiAqIE5vdGUgdGhhdCB0aGlzIGNvZGUgaXMgdGVtcG9yYXJ5IGFuZCB3aWxsIGRpc2FwcGVhciBvbmNlIHRoZSBuZXdcbiAqIHN0eWxpbmcgcmVmYWN0b3IgbGFuZHMgaW4gaXRzIGVudGlyZXR5LlxuICovXG5mdW5jdGlvbiBnZXROYXRpdmVGcm9tTFZpZXcoaW5kZXg6IG51bWJlciwgdmlld0RhdGE6IExWaWV3KTogUkVsZW1lbnQge1xuICBsZXQgc3RvcmFnZUluZGV4ID0gaW5kZXggKyBIRUFERVJfT0ZGU0VUO1xuICBsZXQgc2xvdFZhbHVlOiBMQ29udGFpbmVyfExWaWV3fE9sZFN0eWxpbmdDb250ZXh0fFJFbGVtZW50ID0gdmlld0RhdGFbc3RvcmFnZUluZGV4XTtcbiAgbGV0IHdyYXBwZXI6IExDb250YWluZXJ8TFZpZXd8T2xkU3R5bGluZ0NvbnRleHQgPSB2aWV3RGF0YTtcbiAgd2hpbGUgKEFycmF5LmlzQXJyYXkoc2xvdFZhbHVlKSkge1xuICAgIHdyYXBwZXIgPSBzbG90VmFsdWU7XG4gICAgc2xvdFZhbHVlID0gc2xvdFZhbHVlW0hPU1RdIGFzIExWaWV3IHwgT2xkU3R5bGluZ0NvbnRleHQgfCBSRWxlbWVudDtcbiAgfVxuICBpZiAoaXNPbGRTdHlsaW5nQ29udGV4dCh3cmFwcGVyKSkge1xuICAgIHJldHVybiB3cmFwcGVyW09sZFN0eWxpbmdJbmRleC5FbGVtZW50UG9zaXRpb25dIGFzIFJFbGVtZW50O1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBzbG90VmFsdWU7XG4gIH1cbn1cblxuZnVuY3Rpb24gZ2V0UmVuZGVyZXIodE5vZGU6IFROb2RlLCBsVmlldzogTFZpZXcpIHtcbiAgcmV0dXJuIHROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5FbGVtZW50ID8gbFZpZXdbUkVOREVSRVJdIDogbnVsbDtcbn1cblxuLyoqXG4gKiBTZWFyY2hlcyBhbmQgYXNzaWducyBwcm92aWRlZCBhbGwgc3RhdGljIHN0eWxlL2NsYXNzIGVudHJpZXMgKGZvdW5kIGluIHRoZSBgYXR0cnNgIHZhbHVlKVxuICogYW5kIHJlZ2lzdGVycyB0aGVtIGluIHRoZWlyIHJlc3BlY3RpdmUgc3R5bGluZyBjb250ZXh0cy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlZ2lzdGVySW5pdGlhbFN0eWxpbmdJbnRvQ29udGV4dChcbiAgICB0Tm9kZTogVE5vZGUsIGF0dHJzOiBUQXR0cmlidXRlcywgc3RhcnRJbmRleDogbnVtYmVyKSB7XG4gIGxldCBjbGFzc2VzQ29udGV4dCAhOiBUU3R5bGluZ0NvbnRleHQ7XG4gIGxldCBzdHlsZXNDb250ZXh0ICE6IFRTdHlsaW5nQ29udGV4dDtcbiAgbGV0IG1vZGUgPSAtMTtcbiAgZm9yIChsZXQgaSA9IHN0YXJ0SW5kZXg7IGkgPCBhdHRycy5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IGF0dHIgPSBhdHRyc1tpXTtcbiAgICBpZiAodHlwZW9mIGF0dHIgPT0gJ251bWJlcicpIHtcbiAgICAgIG1vZGUgPSBhdHRyO1xuICAgIH0gZWxzZSBpZiAobW9kZSA9PSBBdHRyaWJ1dGVNYXJrZXIuQ2xhc3Nlcykge1xuICAgICAgY2xhc3Nlc0NvbnRleHQgPSBjbGFzc2VzQ29udGV4dCB8fCBnZXRDbGFzc2VzQ29udGV4dCh0Tm9kZSk7XG4gICAgICByZWdpc3RlckJpbmRpbmcoY2xhc3Nlc0NvbnRleHQsIC0xLCBhdHRyIGFzIHN0cmluZywgdHJ1ZSk7XG4gICAgfSBlbHNlIGlmIChtb2RlID09IEF0dHJpYnV0ZU1hcmtlci5TdHlsZXMpIHtcbiAgICAgIHN0eWxlc0NvbnRleHQgPSBzdHlsZXNDb250ZXh0IHx8IGdldFN0eWxlc0NvbnRleHQodE5vZGUpO1xuICAgICAgcmVnaXN0ZXJCaW5kaW5nKHN0eWxlc0NvbnRleHQsIC0xLCBhdHRyIGFzIHN0cmluZywgYXR0cnNbKytpXSBhcyBzdHJpbmcpO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIE1pcnJvciBpbXBsZW1lbnRhdGlvbiBvZiB0aGUgc2FtZSBmdW5jdGlvbiBmb3VuZCBpbiBgaW5zdHJ1Y3Rpb25zL3N0eWxpbmcudHNgLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0QWN0aXZlRGlyZWN0aXZlU3R5bGluZ0luZGV4KCk6IG51bWJlciB7XG4gIC8vIHdoZW5ldmVyIGEgZGlyZWN0aXZlJ3MgaG9zdEJpbmRpbmdzIGZ1bmN0aW9uIGlzIGNhbGxlZCBhIHVuaXF1ZUlkIHZhbHVlXG4gIC8vIGlzIGFzc2lnbmVkLiBOb3JtYWxseSB0aGlzIGlzIGVub3VnaCB0byBoZWxwIGRpc3Rpbmd1aXNoIG9uZSBkaXJlY3RpdmVcbiAgLy8gZnJvbSBhbm90aGVyIGZvciB0aGUgc3R5bGluZyBjb250ZXh0LCBidXQgdGhlcmUgYXJlIHNpdHVhdGlvbnMgd2hlcmUgYVxuICAvLyBzdWItY2xhc3MgZGlyZWN0aXZlIGNvdWxkIGluaGVyaXQgYW5kIGFzc2lnbiBzdHlsaW5nIGluIGNvbmNlcnQgd2l0aCBhXG4gIC8vIHBhcmVudCBkaXJlY3RpdmUuIFRvIGhlbHAgdGhlIHN0eWxpbmcgY29kZSBkaXN0aW5ndWlzaCBiZXR3ZWVuIGEgcGFyZW50XG4gIC8vIHN1Yi1jbGFzc2VkIGRpcmVjdGl2ZSB0aGUgaW5oZXJpdGFuY2UgZGVwdGggaXMgdGFrZW4gaW50byBhY2NvdW50IGFzIHdlbGwuXG4gIHJldHVybiBnZXRBY3RpdmVEaXJlY3RpdmVJZCgpICsgZ2V0QWN0aXZlRGlyZWN0aXZlU3VwZXJDbGFzc0RlcHRoKCk7XG59XG5cbi8qKlxuICogVGVtcG9yYXJ5IGZ1bmN0aW9uIHRoYXQgd2lsbCB1cGRhdGUgdGhlIG1heCBkaXJlY3RpdmUgaW5kZXggdmFsdWUgaW5cbiAqIGJvdGggdGhlIGNsYXNzZXMgYW5kIHN0eWxlcyBjb250ZXh0cyBwcmVzZW50IG9uIHRoZSBwcm92aWRlZCBgdE5vZGVgLlxuICpcbiAqIFRoaXMgY29kZSBpcyBvbmx5IHVzZWQgYmVjYXVzZSB0aGUgYHNlbGVjdChuKWAgY29kZSBmdW5jdGlvbmFsaXR5IGlzIG5vdFxuICogeWV0IDEwMCUgZnVuY3Rpb25hbC4gVGhlIGBzZWxlY3QobilgIGluc3RydWN0aW9uIGNhbm5vdCB5ZXQgZXZhbHVhdGUgaG9zdFxuICogYmluZGluZ3MgZnVuY3Rpb24gY29kZSBpbiBzeW5jIHdpdGggdGhlIGFzc29jaWF0ZWQgdGVtcGxhdGUgZnVuY3Rpb24gY29kZS5cbiAqIEZvciB0aGlzIHJlYXNvbiB0aGUgc3R5bGluZyBhbGdvcml0aG0gbmVlZHMgdG8gdHJhY2sgdGhlIGxhc3QgZGlyZWN0aXZlIGluZGV4XG4gKiB2YWx1ZSBzbyB0aGF0IGl0IGtub3dzIGV4YWN0bHkgd2hlbiB0byByZW5kZXIgc3R5bGluZyB0byB0aGUgZWxlbWVudCBzaW5jZVxuICogYHN0eWxpbmdBcHBseSgpYCBpcyBjYWxsZWQgbXVsdGlwbGUgdGltZXMgcGVyIENEIChgc3R5bGluZ0FwcGx5YCB3aWxsIGJlXG4gKiByZW1vdmVkIG9uY2UgYHNlbGVjdChuKWAgaXMgZml4ZWQpLlxuICovXG5mdW5jdGlvbiB1cGRhdGVMYXN0RGlyZWN0aXZlSW5kZXgodE5vZGU6IFROb2RlLCBkaXJlY3RpdmVJbmRleDogbnVtYmVyKSB7XG4gIHVwZGF0ZUNvbnRleHREaXJlY3RpdmVJbmRleChnZXRDbGFzc2VzQ29udGV4dCh0Tm9kZSksIGRpcmVjdGl2ZUluZGV4KTtcbiAgdXBkYXRlQ29udGV4dERpcmVjdGl2ZUluZGV4KGdldFN0eWxlc0NvbnRleHQodE5vZGUpLCBkaXJlY3RpdmVJbmRleCk7XG59XG5cbmZ1bmN0aW9uIGdldFN0eWxlc0NvbnRleHQodE5vZGU6IFROb2RlKTogVFN0eWxpbmdDb250ZXh0IHtcbiAgcmV0dXJuIGdldENvbnRleHQodE5vZGUsIGZhbHNlKTtcbn1cblxuZnVuY3Rpb24gZ2V0Q2xhc3Nlc0NvbnRleHQodE5vZGU6IFROb2RlKTogVFN0eWxpbmdDb250ZXh0IHtcbiAgcmV0dXJuIGdldENvbnRleHQodE5vZGUsIHRydWUpO1xufVxuXG4vKipcbiAqIFJldHVybnMvaW5zdGFudGlhdGVzIGEgc3R5bGluZyBjb250ZXh0IGZyb20vdG8gYSBgdE5vZGVgIGluc3RhbmNlLlxuICovXG5mdW5jdGlvbiBnZXRDb250ZXh0KHROb2RlOiBUTm9kZSwgaXNDbGFzc0Jhc2VkOiBib29sZWFuKSB7XG4gIGxldCBjb250ZXh0ID0gaXNDbGFzc0Jhc2VkID8gdE5vZGUubmV3Q2xhc3NlcyA6IHROb2RlLm5ld1N0eWxlcztcbiAgaWYgKCFjb250ZXh0KSB7XG4gICAgY29udGV4dCA9IGFsbG9jU3R5bGluZ0NvbnRleHQoKTtcbiAgICBpZiAobmdEZXZNb2RlKSB7XG4gICAgICBhdHRhY2hTdHlsaW5nRGVidWdPYmplY3QoY29udGV4dCk7XG4gICAgfVxuICAgIGlmIChpc0NsYXNzQmFzZWQpIHtcbiAgICAgIHROb2RlLm5ld0NsYXNzZXMgPSBjb250ZXh0O1xuICAgIH0gZWxzZSB7XG4gICAgICB0Tm9kZS5uZXdTdHlsZXMgPSBjb250ZXh0O1xuICAgIH1cbiAgfVxuICByZXR1cm4gY29udGV4dDtcbn1cbiJdfQ==