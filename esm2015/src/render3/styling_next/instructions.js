/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
import { isStylingContext as isOldStylingContext } from '../interfaces/type_checks';
import { BINDING_INDEX, HEADER_OFFSET, HOST, RENDERER } from '../interfaces/view';
import { getActiveDirectiveId, getActiveDirectiveSuperClassDepth, getActiveDirectiveSuperClassHeight, getLView, getSelectedIndex } from '../state';
import { NO_CHANGE } from '../tokens';
import { renderStringify } from '../util/misc_utils';
import { getTNode } from '../util/view_utils';
import { applyClasses, applyStyles, registerBinding, updateClassBinding, updateStyleBinding } from './bindings';
import { activeStylingMapFeature, normalizeIntoStylingMap } from './map_based_bindings';
import { setCurrentStyleSanitizer } from './state';
import { attachStylingDebugObject } from './styling_debug';
import { allocTStylingContext, getCurrentOrLViewSanitizer, hasValueChanged, updateContextDirectiveIndex } from './util';
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
 * Sets the current style sanitizer function which will then be used
 * within all follow-up prop and map-based style binding instructions
 * for the given element.
 *
 * Note that once styling has been applied to the element (i.e. once
 * `select(n)` is executed or the hostBindings/template function exits)
 * then the active `sanitizerFn` will be set to `null`. This means that
 * once styling is applied to another element then a another call to
 * `styleSanitizer` will need to be made.
 *
 * \@codeGenApi
 * @param {?} sanitizer
 * @return {?}
 */
export function styleSanitizer(sanitizer) {
    setCurrentStyleSanitizer(sanitizer);
}
/**
 * Mirror implementation of the `styleProp()` instruction (found in `instructions/styling.ts`).
 * @param {?} prop
 * @param {?} value
 * @param {?=} suffix
 * @return {?}
 */
export function styleProp(prop, value, suffix) {
    _stylingProp(prop, resolveStylePropValue(value, suffix), false);
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
        updateClassBinding(getClassesContext(tNode), lView, prop, bindingIndex, (/** @type {?} */ (value)), defer, false);
    }
    else {
        /** @type {?} */
        const sanitizer = getCurrentOrLViewSanitizer(lView);
        updateStyleBinding(getStylesContext(tNode), lView, prop, bindingIndex, (/** @type {?} */ (value)), sanitizer, defer, false);
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
            /** @type {?} */
            const sanitizer = getCurrentOrLViewSanitizer(lView);
            updateStyleBinding(getStylesContext(tNode), lView, null, bindingIndex, lStylingMap, sanitizer, defer, valueHasChanged);
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
    /** @type {?} */
    const sanitizer = getCurrentOrLViewSanitizer(lView);
    applyStyles(renderer, lView, getStylesContext(tNode), native, directiveIndex, sanitizer);
    setCurrentStyleSanitizer(null);
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
            registerBinding(classesContext, -1, (/** @type {?} */ (attr)), true, false);
        }
        else if (mode == 2 /* Styles */) {
            stylesContext = stylesContext || getStylesContext(tNode);
            registerBinding(stylesContext, -1, (/** @type {?} */ (attr)), (/** @type {?} */ (attrs[++i])), false);
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
        context = allocTStylingContext();
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
/**
 * @param {?} value
 * @param {?} suffix
 * @return {?}
 */
function resolveStylePropValue(value, suffix) {
    /** @type {?} */
    let resolvedValue = null;
    if (value !== null) {
        if (suffix) {
            // when a suffix is applied then it will bypass
            // sanitization entirely (b/c a new string is created)
            resolvedValue = renderStringify(value) + suffix;
        }
        else {
            // sanitization happens by dealing with a String value
            // this means that the string value will be passed through
            // into the style rendering later (which is where the value
            // will be sanitized before it is applied)
            resolvedValue = (/** @type {?} */ ((/** @type {?} */ (value))));
        }
    }
    return resolvedValue;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5zdHJ1Y3Rpb25zLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9zdHlsaW5nX25leHQvaW5zdHJ1Y3Rpb25zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7QUFhQSxPQUFPLEVBQUMsZ0JBQWdCLElBQUksbUJBQW1CLEVBQUMsTUFBTSwyQkFBMkIsQ0FBQztBQUNsRixPQUFPLEVBQUMsYUFBYSxFQUFFLGFBQWEsRUFBRSxJQUFJLEVBQVMsUUFBUSxFQUFDLE1BQU0sb0JBQW9CLENBQUM7QUFDdkYsT0FBTyxFQUFDLG9CQUFvQixFQUFFLGlDQUFpQyxFQUFFLGtDQUFrQyxFQUFFLFFBQVEsRUFBRSxnQkFBZ0IsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUNqSixPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sV0FBVyxDQUFDO0FBQ3BDLE9BQU8sRUFBQyxlQUFlLEVBQUMsTUFBTSxvQkFBb0IsQ0FBQztBQUNuRCxPQUFPLEVBQUMsUUFBUSxFQUFDLE1BQU0sb0JBQW9CLENBQUM7QUFFNUMsT0FBTyxFQUFDLFlBQVksRUFBRSxXQUFXLEVBQUUsZUFBZSxFQUFFLGtCQUFrQixFQUFFLGtCQUFrQixFQUFDLE1BQU0sWUFBWSxDQUFDO0FBRTlHLE9BQU8sRUFBQyx1QkFBdUIsRUFBRSx1QkFBdUIsRUFBQyxNQUFNLHNCQUFzQixDQUFDO0FBQ3RGLE9BQU8sRUFBQyx3QkFBd0IsRUFBQyxNQUFNLFNBQVMsQ0FBQztBQUNqRCxPQUFPLEVBQUMsd0JBQXdCLEVBQUMsTUFBTSxpQkFBaUIsQ0FBQztBQUN6RCxPQUFPLEVBQUMsb0JBQW9CLEVBQUUsMEJBQTBCLEVBQUUsZUFBZSxFQUFFLDJCQUEyQixFQUFDLE1BQU0sUUFBUSxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQTBCdEgsTUFBTSxVQUFVLFdBQVc7O1VBQ25CLEtBQUssR0FBRyxRQUFRLEVBQUU7O1VB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QUMsQ0FBQztTQUNuQztRQUNELElBQUksWUFBWSxFQUFFO1lBQ2hCLEtBQUssQ0FBQyxVQUFVLEdBQUcsT0FBTyxDQUFDO1NBQzVCO2FBQU07WUFDTCxLQUFLLENBQUMsU0FBUyxHQUFHLE9BQU8sQ0FBQztTQUMzQjtLQUNGO0lBQ0QsT0FBTyxPQUFPLENBQUM7QUFDakIsQ0FBQzs7Ozs7O0FBRUQsU0FBUyxxQkFBcUIsQ0FDMUIsS0FBc0MsRUFBRSxNQUFpQzs7UUFDdkUsYUFBYSxHQUFnQixJQUFJO0lBQ3JDLElBQUksS0FBSyxLQUFLLElBQUksRUFBRTtRQUNsQixJQUFJLE1BQU0sRUFBRTtZQUNWLCtDQUErQztZQUMvQyxzREFBc0Q7WUFDdEQsYUFBYSxHQUFHLGVBQWUsQ0FBQyxLQUFLLENBQUMsR0FBRyxNQUFNLENBQUM7U0FDakQ7YUFBTTtZQUNMLHNEQUFzRDtZQUN0RCwwREFBMEQ7WUFDMUQsMkRBQTJEO1lBQzNELDBDQUEwQztZQUMxQyxhQUFhLEdBQUcsbUJBQUEsbUJBQUEsS0FBSyxFQUFPLEVBQVUsQ0FBQztTQUN4QztLQUNGO0lBQ0QsT0FBTyxhQUFhLENBQUM7QUFDdkIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuKiBAbGljZW5zZVxuKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbipcbiogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuKi9cbmltcG9ydCB7U2FuaXRpemVyfSBmcm9tICcuLi8uLi9zYW5pdGl6YXRpb24vc2VjdXJpdHknO1xuaW1wb3J0IHtTdHlsZVNhbml0aXplRm59IGZyb20gJy4uLy4uL3Nhbml0aXphdGlvbi9zdHlsZV9zYW5pdGl6ZXInO1xuaW1wb3J0IHtMQ29udGFpbmVyfSBmcm9tICcuLi9pbnRlcmZhY2VzL2NvbnRhaW5lcic7XG5pbXBvcnQge0F0dHJpYnV0ZU1hcmtlciwgVEF0dHJpYnV0ZXMsIFROb2RlLCBUTm9kZVR5cGV9IGZyb20gJy4uL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge1JFbGVtZW50fSBmcm9tICcuLi9pbnRlcmZhY2VzL3JlbmRlcmVyJztcbmltcG9ydCB7U3R5bGluZ0NvbnRleHQgYXMgT2xkU3R5bGluZ0NvbnRleHQsIFN0eWxpbmdJbmRleCBhcyBPbGRTdHlsaW5nSW5kZXh9IGZyb20gJy4uL2ludGVyZmFjZXMvc3R5bGluZyc7XG5pbXBvcnQge2lzU3R5bGluZ0NvbnRleHQgYXMgaXNPbGRTdHlsaW5nQ29udGV4dH0gZnJvbSAnLi4vaW50ZXJmYWNlcy90eXBlX2NoZWNrcyc7XG5pbXBvcnQge0JJTkRJTkdfSU5ERVgsIEhFQURFUl9PRkZTRVQsIEhPU1QsIExWaWV3LCBSRU5ERVJFUn0gZnJvbSAnLi4vaW50ZXJmYWNlcy92aWV3JztcbmltcG9ydCB7Z2V0QWN0aXZlRGlyZWN0aXZlSWQsIGdldEFjdGl2ZURpcmVjdGl2ZVN1cGVyQ2xhc3NEZXB0aCwgZ2V0QWN0aXZlRGlyZWN0aXZlU3VwZXJDbGFzc0hlaWdodCwgZ2V0TFZpZXcsIGdldFNlbGVjdGVkSW5kZXh9IGZyb20gJy4uL3N0YXRlJztcbmltcG9ydCB7Tk9fQ0hBTkdFfSBmcm9tICcuLi90b2tlbnMnO1xuaW1wb3J0IHtyZW5kZXJTdHJpbmdpZnl9IGZyb20gJy4uL3V0aWwvbWlzY191dGlscyc7XG5pbXBvcnQge2dldFROb2RlfSBmcm9tICcuLi91dGlsL3ZpZXdfdXRpbHMnO1xuXG5pbXBvcnQge2FwcGx5Q2xhc3NlcywgYXBwbHlTdHlsZXMsIHJlZ2lzdGVyQmluZGluZywgdXBkYXRlQ2xhc3NCaW5kaW5nLCB1cGRhdGVTdHlsZUJpbmRpbmd9IGZyb20gJy4vYmluZGluZ3MnO1xuaW1wb3J0IHtUU3R5bGluZ0NvbnRleHR9IGZyb20gJy4vaW50ZXJmYWNlcyc7XG5pbXBvcnQge2FjdGl2ZVN0eWxpbmdNYXBGZWF0dXJlLCBub3JtYWxpemVJbnRvU3R5bGluZ01hcH0gZnJvbSAnLi9tYXBfYmFzZWRfYmluZGluZ3MnO1xuaW1wb3J0IHtzZXRDdXJyZW50U3R5bGVTYW5pdGl6ZXJ9IGZyb20gJy4vc3RhdGUnO1xuaW1wb3J0IHthdHRhY2hTdHlsaW5nRGVidWdPYmplY3R9IGZyb20gJy4vc3R5bGluZ19kZWJ1Zyc7XG5pbXBvcnQge2FsbG9jVFN0eWxpbmdDb250ZXh0LCBnZXRDdXJyZW50T3JMVmlld1Nhbml0aXplciwgaGFzVmFsdWVDaGFuZ2VkLCB1cGRhdGVDb250ZXh0RGlyZWN0aXZlSW5kZXh9IGZyb20gJy4vdXRpbCc7XG5cblxuXG4vKipcbiAqIC0tLS0tLS0tXG4gKlxuICogVGhpcyBmaWxlIGNvbnRhaW5zIHRoZSBjb3JlIGxvZ2ljIGZvciBob3cgc3R5bGluZyBpbnN0cnVjdGlvbnMgYXJlIHByb2Nlc3NlZCBpbiBBbmd1bGFyLlxuICpcbiAqIFRvIGxlYXJuIG1vcmUgYWJvdXQgdGhlIGFsZ29yaXRobSBzZWUgYFRTdHlsaW5nQ29udGV4dGAuXG4gKlxuICogLS0tLS0tLS1cbiAqL1xuXG4vKipcbiAqIFRlbXBvcmFyeSBmdW5jdGlvbiB0byBicmlkZ2Ugc3R5bGluZyBmdW5jdGlvbmFsaXR5IGJldHdlZW4gdGhpcyBuZXdcbiAqIHJlZmFjdG9yICh3aGljaCBpcyBoZXJlIGluc2lkZSBvZiBgc3R5bGluZ19uZXh0L2ApIGFuZCB0aGUgb2xkXG4gKiBpbXBsZW1lbnRhdGlvbiAod2hpY2ggbGl2ZXMgaW5zaWRlIG9mIGBzdHlsaW5nL2ApLlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gaXMgZXhlY3V0ZWQgZHVyaW5nIHRoZSBjcmVhdGlvbiBibG9jayBvZiBhbiBlbGVtZW50LlxuICogQmVjYXVzZSB0aGUgZXhpc3Rpbmcgc3R5bGluZyBpbXBsZW1lbnRhdGlvbiBpc3N1ZXMgYSBjYWxsIHRvIHRoZVxuICogYHN0eWxpbmcoKWAgaW5zdHJ1Y3Rpb24sIHRoaXMgaW5zdHJ1Y3Rpb24gd2lsbCBhbHNvIGdldCBydW4uIFRoZVxuICogY2VudHJhbCBpZGVhIGhlcmUgaXMgdGhhdCB0aGUgZGlyZWN0aXZlIGluZGV4IHZhbHVlcyBhcmUgYm91bmRcbiAqIGludG8gdGhlIGNvbnRleHQuIFRoZSBkaXJlY3RpdmUgaW5kZXggaXMgdGVtcG9yYXJ5IGFuZCBpcyBvbmx5XG4gKiByZXF1aXJlZCB1bnRpbCB0aGUgYHNlbGVjdChuKWAgaW5zdHJ1Y3Rpb24gaXMgZnVsbHkgZnVuY3Rpb25hbC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHN0eWxpbmdJbml0KCkge1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IGluZGV4ID0gZ2V0U2VsZWN0ZWRJbmRleCgpO1xuICBjb25zdCB0Tm9kZSA9IGdldFROb2RlKGluZGV4LCBsVmlldyk7XG4gIHVwZGF0ZUxhc3REaXJlY3RpdmVJbmRleCh0Tm9kZSwgZ2V0QWN0aXZlRGlyZWN0aXZlU3R5bGluZ0luZGV4KCkpO1xufVxuXG4vKipcbiAqIFNldHMgdGhlIGN1cnJlbnQgc3R5bGUgc2FuaXRpemVyIGZ1bmN0aW9uIHdoaWNoIHdpbGwgdGhlbiBiZSB1c2VkXG4gKiB3aXRoaW4gYWxsIGZvbGxvdy11cCBwcm9wIGFuZCBtYXAtYmFzZWQgc3R5bGUgYmluZGluZyBpbnN0cnVjdGlvbnNcbiAqIGZvciB0aGUgZ2l2ZW4gZWxlbWVudC5cbiAqXG4gKiBOb3RlIHRoYXQgb25jZSBzdHlsaW5nIGhhcyBiZWVuIGFwcGxpZWQgdG8gdGhlIGVsZW1lbnQgKGkuZS4gb25jZVxuICogYHNlbGVjdChuKWAgaXMgZXhlY3V0ZWQgb3IgdGhlIGhvc3RCaW5kaW5ncy90ZW1wbGF0ZSBmdW5jdGlvbiBleGl0cylcbiAqIHRoZW4gdGhlIGFjdGl2ZSBgc2FuaXRpemVyRm5gIHdpbGwgYmUgc2V0IHRvIGBudWxsYC4gVGhpcyBtZWFucyB0aGF0XG4gKiBvbmNlIHN0eWxpbmcgaXMgYXBwbGllZCB0byBhbm90aGVyIGVsZW1lbnQgdGhlbiBhIGFub3RoZXIgY2FsbCB0b1xuICogYHN0eWxlU2FuaXRpemVyYCB3aWxsIG5lZWQgdG8gYmUgbWFkZS5cbiAqXG4gKiBAcGFyYW0gc2FuaXRpemVyRm4gVGhlIHNhbml0aXphdGlvbiBmdW5jdGlvbiB0aGF0IHdpbGwgYmUgdXNlZCB0b1xuICogICAgICAgcHJvY2VzcyBzdHlsZSBwcm9wL3ZhbHVlIGVudHJpZXMuXG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHN0eWxlU2FuaXRpemVyKHNhbml0aXplcjogU2FuaXRpemVyIHwgU3R5bGVTYW5pdGl6ZUZuIHwgbnVsbCk6IHZvaWQge1xuICBzZXRDdXJyZW50U3R5bGVTYW5pdGl6ZXIoc2FuaXRpemVyKTtcbn1cblxuLyoqXG4gKiBNaXJyb3IgaW1wbGVtZW50YXRpb24gb2YgdGhlIGBzdHlsZVByb3AoKWAgaW5zdHJ1Y3Rpb24gKGZvdW5kIGluIGBpbnN0cnVjdGlvbnMvc3R5bGluZy50c2ApLlxuICovXG5leHBvcnQgZnVuY3Rpb24gc3R5bGVQcm9wKFxuICAgIHByb3A6IHN0cmluZywgdmFsdWU6IHN0cmluZyB8IG51bWJlciB8IFN0cmluZyB8IG51bGwsIHN1ZmZpeD86IHN0cmluZyB8IG51bGwpOiB2b2lkIHtcbiAgX3N0eWxpbmdQcm9wKHByb3AsIHJlc29sdmVTdHlsZVByb3BWYWx1ZSh2YWx1ZSwgc3VmZml4KSwgZmFsc2UpO1xufVxuXG4vKipcbiAqIE1pcnJvciBpbXBsZW1lbnRhdGlvbiBvZiB0aGUgYGNsYXNzUHJvcCgpYCBpbnN0cnVjdGlvbiAoZm91bmQgaW4gYGluc3RydWN0aW9ucy9zdHlsaW5nLnRzYCkuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjbGFzc1Byb3AoY2xhc3NOYW1lOiBzdHJpbmcsIHZhbHVlOiBib29sZWFuIHwgbnVsbCk6IHZvaWQge1xuICBfc3R5bGluZ1Byb3AoY2xhc3NOYW1lLCB2YWx1ZSwgdHJ1ZSk7XG59XG5cbi8qKlxuICogU2hhcmVkIGZ1bmN0aW9uIHVzZWQgdG8gdXBkYXRlIGEgcHJvcC1iYXNlZCBzdHlsaW5nIGJpbmRpbmcgZm9yIGFuIGVsZW1lbnQuXG4gKi9cbmZ1bmN0aW9uIF9zdHlsaW5nUHJvcChcbiAgICBwcm9wOiBzdHJpbmcsIHZhbHVlOiBib29sZWFuIHwgbnVtYmVyIHwgU3RyaW5nIHwgc3RyaW5nIHwgbnVsbCwgaXNDbGFzc0Jhc2VkOiBib29sZWFuKSB7XG4gIGNvbnN0IGluZGV4ID0gZ2V0U2VsZWN0ZWRJbmRleCgpO1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IGJpbmRpbmdJbmRleCA9IGxWaWV3W0JJTkRJTkdfSU5ERVhdKys7XG4gIGNvbnN0IHROb2RlID0gZ2V0VE5vZGUoaW5kZXgsIGxWaWV3KTtcbiAgY29uc3QgZGVmZXIgPSBnZXRBY3RpdmVEaXJlY3RpdmVTdXBlckNsYXNzSGVpZ2h0KCkgPiAwO1xuICBpZiAoaXNDbGFzc0Jhc2VkKSB7XG4gICAgdXBkYXRlQ2xhc3NCaW5kaW5nKFxuICAgICAgICBnZXRDbGFzc2VzQ29udGV4dCh0Tm9kZSksIGxWaWV3LCBwcm9wLCBiaW5kaW5nSW5kZXgsIHZhbHVlIGFzIHN0cmluZyB8IGJvb2xlYW4gfCBudWxsLFxuICAgICAgICBkZWZlciwgZmFsc2UpO1xuICB9IGVsc2Uge1xuICAgIGNvbnN0IHNhbml0aXplciA9IGdldEN1cnJlbnRPckxWaWV3U2FuaXRpemVyKGxWaWV3KTtcbiAgICB1cGRhdGVTdHlsZUJpbmRpbmcoXG4gICAgICAgIGdldFN0eWxlc0NvbnRleHQodE5vZGUpLCBsVmlldywgcHJvcCwgYmluZGluZ0luZGV4LCB2YWx1ZSBhcyBzdHJpbmcgfCBudWxsLCBzYW5pdGl6ZXIsXG4gICAgICAgIGRlZmVyLCBmYWxzZSk7XG4gIH1cbn1cblxuLyoqXG4gKiBNaXJyb3IgaW1wbGVtZW50YXRpb24gb2YgdGhlIGBzdHlsZU1hcCgpYCBpbnN0cnVjdGlvbiAoZm91bmQgaW4gYGluc3RydWN0aW9ucy9zdHlsaW5nLnRzYCkuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzdHlsZU1hcChzdHlsZXM6IHtbc3R5bGVOYW1lOiBzdHJpbmddOiBhbnl9IHwgTk9fQ0hBTkdFIHwgbnVsbCk6IHZvaWQge1xuICBfc3R5bGluZ01hcChzdHlsZXMsIGZhbHNlKTtcbn1cblxuLyoqXG4gKiBNaXJyb3IgaW1wbGVtZW50YXRpb24gb2YgdGhlIGBjbGFzc01hcCgpYCBpbnN0cnVjdGlvbiAoZm91bmQgaW4gYGluc3RydWN0aW9ucy9zdHlsaW5nLnRzYCkuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjbGFzc01hcChjbGFzc2VzOiB7W2NsYXNzTmFtZTogc3RyaW5nXTogYW55fSB8IE5PX0NIQU5HRSB8IHN0cmluZyB8IG51bGwpOiB2b2lkIHtcbiAgX3N0eWxpbmdNYXAoY2xhc3NlcywgdHJ1ZSk7XG59XG5cbi8qKlxuICogU2hhcmVkIGZ1bmN0aW9uIHVzZWQgdG8gdXBkYXRlIGEgbWFwLWJhc2VkIHN0eWxpbmcgYmluZGluZyBmb3IgYW4gZWxlbWVudC5cbiAqXG4gKiBXaGVuIHRoaXMgZnVuY3Rpb24gaXMgY2FsbGVkIGl0IHdpbGwgYWN0aXZhdGUgc3VwcG9ydCBmb3IgYFtzdHlsZV1gIGFuZFxuICogYFtjbGFzc11gIGJpbmRpbmdzIGluIEFuZ3VsYXIuXG4gKi9cbmZ1bmN0aW9uIF9zdHlsaW5nTWFwKHZhbHVlOiB7W2tleTogc3RyaW5nXTogYW55fSB8IHN0cmluZyB8IG51bGwsIGlzQ2xhc3NCYXNlZDogYm9vbGVhbikge1xuICBhY3RpdmVTdHlsaW5nTWFwRmVhdHVyZSgpO1xuICBjb25zdCBpbmRleCA9IGdldFNlbGVjdGVkSW5kZXgoKTtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCBiaW5kaW5nSW5kZXggPSBsVmlld1tCSU5ESU5HX0lOREVYXSsrO1xuXG4gIGlmICh2YWx1ZSAhPT0gTk9fQ0hBTkdFKSB7XG4gICAgY29uc3QgdE5vZGUgPSBnZXRUTm9kZShpbmRleCwgbFZpZXcpO1xuICAgIGNvbnN0IGRlZmVyID0gZ2V0QWN0aXZlRGlyZWN0aXZlU3VwZXJDbGFzc0hlaWdodCgpID4gMDtcbiAgICBjb25zdCBvbGRWYWx1ZSA9IGxWaWV3W2JpbmRpbmdJbmRleF07XG4gICAgY29uc3QgdmFsdWVIYXNDaGFuZ2VkID0gaGFzVmFsdWVDaGFuZ2VkKG9sZFZhbHVlLCB2YWx1ZSk7XG4gICAgY29uc3QgbFN0eWxpbmdNYXAgPSBub3JtYWxpemVJbnRvU3R5bGluZ01hcChvbGRWYWx1ZSwgdmFsdWUpO1xuICAgIGlmIChpc0NsYXNzQmFzZWQpIHtcbiAgICAgIHVwZGF0ZUNsYXNzQmluZGluZyhcbiAgICAgICAgICBnZXRDbGFzc2VzQ29udGV4dCh0Tm9kZSksIGxWaWV3LCBudWxsLCBiaW5kaW5nSW5kZXgsIGxTdHlsaW5nTWFwLCBkZWZlciwgdmFsdWVIYXNDaGFuZ2VkKTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3Qgc2FuaXRpemVyID0gZ2V0Q3VycmVudE9yTFZpZXdTYW5pdGl6ZXIobFZpZXcpO1xuICAgICAgdXBkYXRlU3R5bGVCaW5kaW5nKFxuICAgICAgICAgIGdldFN0eWxlc0NvbnRleHQodE5vZGUpLCBsVmlldywgbnVsbCwgYmluZGluZ0luZGV4LCBsU3R5bGluZ01hcCwgc2FuaXRpemVyLCBkZWZlcixcbiAgICAgICAgICB2YWx1ZUhhc0NoYW5nZWQpO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIFRlbXBvcmFyeSBmdW5jdGlvbiB0byBicmlkZ2Ugc3R5bGluZyBmdW5jdGlvbmFsaXR5IGJldHdlZW4gdGhpcyBuZXdcbiAqIHJlZmFjdG9yICh3aGljaCBpcyBoZXJlIGluc2lkZSBvZiBgc3R5bGluZ19uZXh0L2ApIGFuZCB0aGUgb2xkXG4gKiBpbXBsZW1lbnRhdGlvbiAod2hpY2ggbGl2ZXMgaW5zaWRlIG9mIGBzdHlsaW5nL2ApLlxuICpcbiAqIFRoZSBuZXcgc3R5bGluZyByZWZhY3RvciBlbnN1cmVzIHRoYXQgc3R5bGluZyBmbHVzaGluZyBpcyBjYWxsZWRcbiAqIGF1dG9tYXRpY2FsbHkgd2hlbiBhIHRlbXBsYXRlIGZ1bmN0aW9uIGV4aXRzIG9yIGEgZm9sbG93LXVwIGVsZW1lbnRcbiAqIGlzIHZpc2l0ZWQgKGkuZS4gd2hlbiBgc2VsZWN0KG4pYCBpcyBjYWxsZWQpLiBCZWNhdXNlIHRoZSBgc2VsZWN0KG4pYFxuICogaW5zdHJ1Y3Rpb24gaXMgbm90IGZ1bGx5IGltcGxlbWVudGVkIHlldCAoaXQgZG9lc24ndCBhY3R1YWxseSBleGVjdXRlXG4gKiBob3N0IGJpbmRpbmcgaW5zdHJ1Y3Rpb24gY29kZSBhdCB0aGUgcmlnaHQgdGltZSksIHRoaXMgbWVhbnMgdGhhdCBhXG4gKiBzdHlsaW5nIGFwcGx5IGZ1bmN0aW9uIGlzIHN0aWxsIG5lZWRlZC5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIGlzIGEgbWlycm9yIGltcGxlbWVudGF0aW9uIG9mIHRoZSBgc3R5bGluZ0FwcGx5KClgXG4gKiBpbnN0cnVjdGlvbiAoZm91bmQgaW4gYGluc3RydWN0aW9ucy9zdHlsaW5nLnRzYCkuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzdHlsaW5nQXBwbHkoKSB7XG4gIGNvbnN0IGluZGV4ID0gZ2V0U2VsZWN0ZWRJbmRleCgpO1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IHROb2RlID0gZ2V0VE5vZGUoaW5kZXgsIGxWaWV3KTtcbiAgY29uc3QgcmVuZGVyZXIgPSBnZXRSZW5kZXJlcih0Tm9kZSwgbFZpZXcpO1xuICBjb25zdCBuYXRpdmUgPSBnZXROYXRpdmVGcm9tTFZpZXcoaW5kZXgsIGxWaWV3KTtcbiAgY29uc3QgZGlyZWN0aXZlSW5kZXggPSBnZXRBY3RpdmVEaXJlY3RpdmVTdHlsaW5nSW5kZXgoKTtcbiAgYXBwbHlDbGFzc2VzKHJlbmRlcmVyLCBsVmlldywgZ2V0Q2xhc3Nlc0NvbnRleHQodE5vZGUpLCBuYXRpdmUsIGRpcmVjdGl2ZUluZGV4KTtcblxuICBjb25zdCBzYW5pdGl6ZXIgPSBnZXRDdXJyZW50T3JMVmlld1Nhbml0aXplcihsVmlldyk7XG4gIGFwcGx5U3R5bGVzKHJlbmRlcmVyLCBsVmlldywgZ2V0U3R5bGVzQ29udGV4dCh0Tm9kZSksIG5hdGl2ZSwgZGlyZWN0aXZlSW5kZXgsIHNhbml0aXplcik7XG5cbiAgc2V0Q3VycmVudFN0eWxlU2FuaXRpemVyKG51bGwpO1xufVxuXG4vKipcbiAqIFRlbXBvcmFyeSBmdW5jdGlvbiB0byBicmlkZ2Ugc3R5bGluZyBmdW5jdGlvbmFsaXR5IGJldHdlZW4gdGhpcyBuZXdcbiAqIHJlZmFjdG9yICh3aGljaCBpcyBoZXJlIGluc2lkZSBvZiBgc3R5bGluZ19uZXh0L2ApIGFuZCB0aGUgb2xkXG4gKiBpbXBsZW1lbnRhdGlvbiAod2hpY2ggbGl2ZXMgaW5zaWRlIG9mIGBzdHlsaW5nL2ApLlxuICpcbiAqIFRoZSBwdXJwb3NlIG9mIHRoaXMgZnVuY3Rpb24gaXMgdG8gdHJhdmVyc2UgdGhyb3VnaCB0aGUgTFZpZXcgZGF0YVxuICogZm9yIGEgc3BlY2lmaWMgZWxlbWVudCBpbmRleCBhbmQgcmV0dXJuIHRoZSBuYXRpdmUgbm9kZS4gQmVjYXVzZSB0aGVcbiAqIGN1cnJlbnQgaW1wbGVtZW50YXRpb24gcmVsaWVzIG9uIHRoZXJlIGJlaW5nIGEgc3R5bGluZyBjb250ZXh0IGFycmF5LFxuICogdGhlIGNvZGUgYmVsb3cgd2lsbCBuZWVkIHRvIGxvb3AgdGhyb3VnaCB0aGVzZSBhcnJheSB2YWx1ZXMgdW50aWwgaXRcbiAqIGdldHMgYSBuYXRpdmUgZWxlbWVudCBub2RlLlxuICpcbiAqIE5vdGUgdGhhdCB0aGlzIGNvZGUgaXMgdGVtcG9yYXJ5IGFuZCB3aWxsIGRpc2FwcGVhciBvbmNlIHRoZSBuZXdcbiAqIHN0eWxpbmcgcmVmYWN0b3IgbGFuZHMgaW4gaXRzIGVudGlyZXR5LlxuICovXG5mdW5jdGlvbiBnZXROYXRpdmVGcm9tTFZpZXcoaW5kZXg6IG51bWJlciwgdmlld0RhdGE6IExWaWV3KTogUkVsZW1lbnQge1xuICBsZXQgc3RvcmFnZUluZGV4ID0gaW5kZXggKyBIRUFERVJfT0ZGU0VUO1xuICBsZXQgc2xvdFZhbHVlOiBMQ29udGFpbmVyfExWaWV3fE9sZFN0eWxpbmdDb250ZXh0fFJFbGVtZW50ID0gdmlld0RhdGFbc3RvcmFnZUluZGV4XTtcbiAgbGV0IHdyYXBwZXI6IExDb250YWluZXJ8TFZpZXd8T2xkU3R5bGluZ0NvbnRleHQgPSB2aWV3RGF0YTtcbiAgd2hpbGUgKEFycmF5LmlzQXJyYXkoc2xvdFZhbHVlKSkge1xuICAgIHdyYXBwZXIgPSBzbG90VmFsdWU7XG4gICAgc2xvdFZhbHVlID0gc2xvdFZhbHVlW0hPU1RdIGFzIExWaWV3IHwgT2xkU3R5bGluZ0NvbnRleHQgfCBSRWxlbWVudDtcbiAgfVxuICBpZiAoaXNPbGRTdHlsaW5nQ29udGV4dCh3cmFwcGVyKSkge1xuICAgIHJldHVybiB3cmFwcGVyW09sZFN0eWxpbmdJbmRleC5FbGVtZW50UG9zaXRpb25dIGFzIFJFbGVtZW50O1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBzbG90VmFsdWU7XG4gIH1cbn1cblxuZnVuY3Rpb24gZ2V0UmVuZGVyZXIodE5vZGU6IFROb2RlLCBsVmlldzogTFZpZXcpIHtcbiAgcmV0dXJuIHROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5FbGVtZW50ID8gbFZpZXdbUkVOREVSRVJdIDogbnVsbDtcbn1cblxuLyoqXG4gKiBTZWFyY2hlcyBhbmQgYXNzaWducyBwcm92aWRlZCBhbGwgc3RhdGljIHN0eWxlL2NsYXNzIGVudHJpZXMgKGZvdW5kIGluIHRoZSBgYXR0cnNgIHZhbHVlKVxuICogYW5kIHJlZ2lzdGVycyB0aGVtIGluIHRoZWlyIHJlc3BlY3RpdmUgc3R5bGluZyBjb250ZXh0cy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlZ2lzdGVySW5pdGlhbFN0eWxpbmdJbnRvQ29udGV4dChcbiAgICB0Tm9kZTogVE5vZGUsIGF0dHJzOiBUQXR0cmlidXRlcywgc3RhcnRJbmRleDogbnVtYmVyKSB7XG4gIGxldCBjbGFzc2VzQ29udGV4dCAhOiBUU3R5bGluZ0NvbnRleHQ7XG4gIGxldCBzdHlsZXNDb250ZXh0ICE6IFRTdHlsaW5nQ29udGV4dDtcbiAgbGV0IG1vZGUgPSAtMTtcbiAgZm9yIChsZXQgaSA9IHN0YXJ0SW5kZXg7IGkgPCBhdHRycy5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IGF0dHIgPSBhdHRyc1tpXTtcbiAgICBpZiAodHlwZW9mIGF0dHIgPT0gJ251bWJlcicpIHtcbiAgICAgIG1vZGUgPSBhdHRyO1xuICAgIH0gZWxzZSBpZiAobW9kZSA9PSBBdHRyaWJ1dGVNYXJrZXIuQ2xhc3Nlcykge1xuICAgICAgY2xhc3Nlc0NvbnRleHQgPSBjbGFzc2VzQ29udGV4dCB8fCBnZXRDbGFzc2VzQ29udGV4dCh0Tm9kZSk7XG4gICAgICByZWdpc3RlckJpbmRpbmcoY2xhc3Nlc0NvbnRleHQsIC0xLCBhdHRyIGFzIHN0cmluZywgdHJ1ZSwgZmFsc2UpO1xuICAgIH0gZWxzZSBpZiAobW9kZSA9PSBBdHRyaWJ1dGVNYXJrZXIuU3R5bGVzKSB7XG4gICAgICBzdHlsZXNDb250ZXh0ID0gc3R5bGVzQ29udGV4dCB8fCBnZXRTdHlsZXNDb250ZXh0KHROb2RlKTtcbiAgICAgIHJlZ2lzdGVyQmluZGluZyhzdHlsZXNDb250ZXh0LCAtMSwgYXR0ciBhcyBzdHJpbmcsIGF0dHJzWysraV0gYXMgc3RyaW5nLCBmYWxzZSk7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogTWlycm9yIGltcGxlbWVudGF0aW9uIG9mIHRoZSBzYW1lIGZ1bmN0aW9uIGZvdW5kIGluIGBpbnN0cnVjdGlvbnMvc3R5bGluZy50c2AuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRBY3RpdmVEaXJlY3RpdmVTdHlsaW5nSW5kZXgoKTogbnVtYmVyIHtcbiAgLy8gd2hlbmV2ZXIgYSBkaXJlY3RpdmUncyBob3N0QmluZGluZ3MgZnVuY3Rpb24gaXMgY2FsbGVkIGEgdW5pcXVlSWQgdmFsdWVcbiAgLy8gaXMgYXNzaWduZWQuIE5vcm1hbGx5IHRoaXMgaXMgZW5vdWdoIHRvIGhlbHAgZGlzdGluZ3Vpc2ggb25lIGRpcmVjdGl2ZVxuICAvLyBmcm9tIGFub3RoZXIgZm9yIHRoZSBzdHlsaW5nIGNvbnRleHQsIGJ1dCB0aGVyZSBhcmUgc2l0dWF0aW9ucyB3aGVyZSBhXG4gIC8vIHN1Yi1jbGFzcyBkaXJlY3RpdmUgY291bGQgaW5oZXJpdCBhbmQgYXNzaWduIHN0eWxpbmcgaW4gY29uY2VydCB3aXRoIGFcbiAgLy8gcGFyZW50IGRpcmVjdGl2ZS4gVG8gaGVscCB0aGUgc3R5bGluZyBjb2RlIGRpc3Rpbmd1aXNoIGJldHdlZW4gYSBwYXJlbnRcbiAgLy8gc3ViLWNsYXNzZWQgZGlyZWN0aXZlIHRoZSBpbmhlcml0YW5jZSBkZXB0aCBpcyB0YWtlbiBpbnRvIGFjY291bnQgYXMgd2VsbC5cbiAgcmV0dXJuIGdldEFjdGl2ZURpcmVjdGl2ZUlkKCkgKyBnZXRBY3RpdmVEaXJlY3RpdmVTdXBlckNsYXNzRGVwdGgoKTtcbn1cblxuLyoqXG4gKiBUZW1wb3JhcnkgZnVuY3Rpb24gdGhhdCB3aWxsIHVwZGF0ZSB0aGUgbWF4IGRpcmVjdGl2ZSBpbmRleCB2YWx1ZSBpblxuICogYm90aCB0aGUgY2xhc3NlcyBhbmQgc3R5bGVzIGNvbnRleHRzIHByZXNlbnQgb24gdGhlIHByb3ZpZGVkIGB0Tm9kZWAuXG4gKlxuICogVGhpcyBjb2RlIGlzIG9ubHkgdXNlZCBiZWNhdXNlIHRoZSBgc2VsZWN0KG4pYCBjb2RlIGZ1bmN0aW9uYWxpdHkgaXMgbm90XG4gKiB5ZXQgMTAwJSBmdW5jdGlvbmFsLiBUaGUgYHNlbGVjdChuKWAgaW5zdHJ1Y3Rpb24gY2Fubm90IHlldCBldmFsdWF0ZSBob3N0XG4gKiBiaW5kaW5ncyBmdW5jdGlvbiBjb2RlIGluIHN5bmMgd2l0aCB0aGUgYXNzb2NpYXRlZCB0ZW1wbGF0ZSBmdW5jdGlvbiBjb2RlLlxuICogRm9yIHRoaXMgcmVhc29uIHRoZSBzdHlsaW5nIGFsZ29yaXRobSBuZWVkcyB0byB0cmFjayB0aGUgbGFzdCBkaXJlY3RpdmUgaW5kZXhcbiAqIHZhbHVlIHNvIHRoYXQgaXQga25vd3MgZXhhY3RseSB3aGVuIHRvIHJlbmRlciBzdHlsaW5nIHRvIHRoZSBlbGVtZW50IHNpbmNlXG4gKiBgc3R5bGluZ0FwcGx5KClgIGlzIGNhbGxlZCBtdWx0aXBsZSB0aW1lcyBwZXIgQ0QgKGBzdHlsaW5nQXBwbHlgIHdpbGwgYmVcbiAqIHJlbW92ZWQgb25jZSBgc2VsZWN0KG4pYCBpcyBmaXhlZCkuXG4gKi9cbmZ1bmN0aW9uIHVwZGF0ZUxhc3REaXJlY3RpdmVJbmRleCh0Tm9kZTogVE5vZGUsIGRpcmVjdGl2ZUluZGV4OiBudW1iZXIpIHtcbiAgdXBkYXRlQ29udGV4dERpcmVjdGl2ZUluZGV4KGdldENsYXNzZXNDb250ZXh0KHROb2RlKSwgZGlyZWN0aXZlSW5kZXgpO1xuICB1cGRhdGVDb250ZXh0RGlyZWN0aXZlSW5kZXgoZ2V0U3R5bGVzQ29udGV4dCh0Tm9kZSksIGRpcmVjdGl2ZUluZGV4KTtcbn1cblxuZnVuY3Rpb24gZ2V0U3R5bGVzQ29udGV4dCh0Tm9kZTogVE5vZGUpOiBUU3R5bGluZ0NvbnRleHQge1xuICByZXR1cm4gZ2V0Q29udGV4dCh0Tm9kZSwgZmFsc2UpO1xufVxuXG5mdW5jdGlvbiBnZXRDbGFzc2VzQ29udGV4dCh0Tm9kZTogVE5vZGUpOiBUU3R5bGluZ0NvbnRleHQge1xuICByZXR1cm4gZ2V0Q29udGV4dCh0Tm9kZSwgdHJ1ZSk7XG59XG5cbi8qKlxuICogUmV0dXJucy9pbnN0YW50aWF0ZXMgYSBzdHlsaW5nIGNvbnRleHQgZnJvbS90byBhIGB0Tm9kZWAgaW5zdGFuY2UuXG4gKi9cbmZ1bmN0aW9uIGdldENvbnRleHQodE5vZGU6IFROb2RlLCBpc0NsYXNzQmFzZWQ6IGJvb2xlYW4pIHtcbiAgbGV0IGNvbnRleHQgPSBpc0NsYXNzQmFzZWQgPyB0Tm9kZS5uZXdDbGFzc2VzIDogdE5vZGUubmV3U3R5bGVzO1xuICBpZiAoIWNvbnRleHQpIHtcbiAgICBjb250ZXh0ID0gYWxsb2NUU3R5bGluZ0NvbnRleHQoKTtcbiAgICBpZiAobmdEZXZNb2RlKSB7XG4gICAgICBhdHRhY2hTdHlsaW5nRGVidWdPYmplY3QoY29udGV4dCk7XG4gICAgfVxuICAgIGlmIChpc0NsYXNzQmFzZWQpIHtcbiAgICAgIHROb2RlLm5ld0NsYXNzZXMgPSBjb250ZXh0O1xuICAgIH0gZWxzZSB7XG4gICAgICB0Tm9kZS5uZXdTdHlsZXMgPSBjb250ZXh0O1xuICAgIH1cbiAgfVxuICByZXR1cm4gY29udGV4dDtcbn1cblxuZnVuY3Rpb24gcmVzb2x2ZVN0eWxlUHJvcFZhbHVlKFxuICAgIHZhbHVlOiBzdHJpbmcgfCBudW1iZXIgfCBTdHJpbmcgfCBudWxsLCBzdWZmaXg6IHN0cmluZyB8IG51bGwgfCB1bmRlZmluZWQpIHtcbiAgbGV0IHJlc29sdmVkVmFsdWU6IHN0cmluZ3xudWxsID0gbnVsbDtcbiAgaWYgKHZhbHVlICE9PSBudWxsKSB7XG4gICAgaWYgKHN1ZmZpeCkge1xuICAgICAgLy8gd2hlbiBhIHN1ZmZpeCBpcyBhcHBsaWVkIHRoZW4gaXQgd2lsbCBieXBhc3NcbiAgICAgIC8vIHNhbml0aXphdGlvbiBlbnRpcmVseSAoYi9jIGEgbmV3IHN0cmluZyBpcyBjcmVhdGVkKVxuICAgICAgcmVzb2x2ZWRWYWx1ZSA9IHJlbmRlclN0cmluZ2lmeSh2YWx1ZSkgKyBzdWZmaXg7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIHNhbml0aXphdGlvbiBoYXBwZW5zIGJ5IGRlYWxpbmcgd2l0aCBhIFN0cmluZyB2YWx1ZVxuICAgICAgLy8gdGhpcyBtZWFucyB0aGF0IHRoZSBzdHJpbmcgdmFsdWUgd2lsbCBiZSBwYXNzZWQgdGhyb3VnaFxuICAgICAgLy8gaW50byB0aGUgc3R5bGUgcmVuZGVyaW5nIGxhdGVyICh3aGljaCBpcyB3aGVyZSB0aGUgdmFsdWVcbiAgICAgIC8vIHdpbGwgYmUgc2FuaXRpemVkIGJlZm9yZSBpdCBpcyBhcHBsaWVkKVxuICAgICAgcmVzb2x2ZWRWYWx1ZSA9IHZhbHVlIGFzIGFueSBhcyBzdHJpbmc7XG4gICAgfVxuICB9XG4gIHJldHVybiByZXNvbHZlZFZhbHVlO1xufVxuIl19