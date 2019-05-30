/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
import { BINDING_INDEX, HEADER_OFFSET, HOST, RENDERER } from '../interfaces/view';
import { getActiveDirectiveId, getActiveDirectiveSuperClassDepth, getActiveDirectiveSuperClassHeight, getLView, getSelectedIndex } from '../state';
import { NO_CHANGE } from '../tokens';
import { renderStringify } from '../util/misc_utils';
import { getTNode, isStylingContext as isOldStylingContext } from '../util/view_utils';
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5zdHJ1Y3Rpb25zLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9zdHlsaW5nX25leHQvaW5zdHJ1Y3Rpb25zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7QUFhQSxPQUFPLEVBQUMsYUFBYSxFQUFFLGFBQWEsRUFBRSxJQUFJLEVBQVMsUUFBUSxFQUFZLE1BQU0sb0JBQW9CLENBQUM7QUFDbEcsT0FBTyxFQUFDLG9CQUFvQixFQUFFLGlDQUFpQyxFQUFFLGtDQUFrQyxFQUFFLFFBQVEsRUFBRSxnQkFBZ0IsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUNqSixPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sV0FBVyxDQUFDO0FBQ3BDLE9BQU8sRUFBQyxlQUFlLEVBQUMsTUFBTSxvQkFBb0IsQ0FBQztBQUNuRCxPQUFPLEVBQUMsUUFBUSxFQUFFLGdCQUFnQixJQUFJLG1CQUFtQixFQUFDLE1BQU0sb0JBQW9CLENBQUM7QUFFckYsT0FBTyxFQUFDLFlBQVksRUFBRSxXQUFXLEVBQUUsZUFBZSxFQUFFLGtCQUFrQixFQUFFLGtCQUFrQixFQUFDLE1BQU0sWUFBWSxDQUFDO0FBRTlHLE9BQU8sRUFBQyx1QkFBdUIsRUFBRSx1QkFBdUIsRUFBQyxNQUFNLHNCQUFzQixDQUFDO0FBQ3RGLE9BQU8sRUFBMkIsd0JBQXdCLEVBQUMsTUFBTSxTQUFTLENBQUM7QUFDM0UsT0FBTyxFQUFDLHdCQUF3QixFQUFDLE1BQU0saUJBQWlCLENBQUM7QUFDekQsT0FBTyxFQUFDLG9CQUFvQixFQUFFLDBCQUEwQixFQUFFLGVBQWUsRUFBRSwyQkFBMkIsRUFBQyxNQUFNLFFBQVEsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUEwQnRILE1BQU0sVUFBVSxXQUFXOztVQUNuQixLQUFLLEdBQUcsUUFBUSxFQUFFOztVQUNsQixLQUFLLEdBQUcsZ0JBQWdCLEVBQUU7O1VBQzFC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RTtZQUNoQixLQUFLLENBQUMsVUFBVSxHQUFHLE9BQU8sQ0FBQztTQUM1QjthQUFNO1lBQ0wsS0FBSyxDQUFDLFNBQVMsR0FBRyxPQUFPLENBQUM7U0FDM0I7S0FDRjtJQUNELE9BQU8sT0FBTyxDQUFDO0FBQ2pCLENBQUM7Ozs7OztBQUVELFNBQVMscUJBQXFCLENBQzFCLEtBQXNDLEVBQUUsTUFBaUM7O1FBQ3ZFLGFBQWEsR0FBZ0IsSUFBSTtJQUNyQyxJQUFJLEtBQUssS0FBSyxJQUFJLEVBQUU7UUFDbEIsSUFBSSxNQUFNLEVBQUU7WUFDViwrQ0FBK0M7WUFDL0Msc0RBQXNEO1lBQ3RELGFBQWEsR0FBRyxlQUFlLENBQUMsS0FBSyxDQUFDLEdBQUcsTUFBTSxDQUFDO1NBQ2pEO2FBQU07WUFDTCxzREFBc0Q7WUFDdEQsMERBQTBEO1lBQzFELDJEQUEyRDtZQUMzRCwwQ0FBMEM7WUFDMUMsYUFBYSxHQUFHLG1CQUFBLG1CQUFBLEtBQUssRUFBTyxFQUFVLENBQUM7U0FDeEM7S0FDRjtJQUNELE9BQU8sYUFBYSxDQUFDO0FBQ3ZCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiogQGxpY2Vuc2VcbiogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4qXG4qIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4qIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiovXG5pbXBvcnQge1Nhbml0aXplcn0gZnJvbSAnLi4vLi4vc2FuaXRpemF0aW9uL3NlY3VyaXR5JztcbmltcG9ydCB7U3R5bGVTYW5pdGl6ZUZufSBmcm9tICcuLi8uLi9zYW5pdGl6YXRpb24vc3R5bGVfc2FuaXRpemVyJztcbmltcG9ydCB7TENvbnRhaW5lcn0gZnJvbSAnLi4vaW50ZXJmYWNlcy9jb250YWluZXInO1xuaW1wb3J0IHtBdHRyaWJ1dGVNYXJrZXIsIFRBdHRyaWJ1dGVzLCBUTm9kZSwgVE5vZGVUeXBlfSBmcm9tICcuLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtSRWxlbWVudH0gZnJvbSAnLi4vaW50ZXJmYWNlcy9yZW5kZXJlcic7XG5pbXBvcnQge1N0eWxpbmdDb250ZXh0IGFzIE9sZFN0eWxpbmdDb250ZXh0LCBTdHlsaW5nSW5kZXggYXMgT2xkU3R5bGluZ0luZGV4fSBmcm9tICcuLi9pbnRlcmZhY2VzL3N0eWxpbmcnO1xuaW1wb3J0IHtCSU5ESU5HX0lOREVYLCBIRUFERVJfT0ZGU0VULCBIT1NULCBMVmlldywgUkVOREVSRVIsIFNBTklUSVpFUn0gZnJvbSAnLi4vaW50ZXJmYWNlcy92aWV3JztcbmltcG9ydCB7Z2V0QWN0aXZlRGlyZWN0aXZlSWQsIGdldEFjdGl2ZURpcmVjdGl2ZVN1cGVyQ2xhc3NEZXB0aCwgZ2V0QWN0aXZlRGlyZWN0aXZlU3VwZXJDbGFzc0hlaWdodCwgZ2V0TFZpZXcsIGdldFNlbGVjdGVkSW5kZXh9IGZyb20gJy4uL3N0YXRlJztcbmltcG9ydCB7Tk9fQ0hBTkdFfSBmcm9tICcuLi90b2tlbnMnO1xuaW1wb3J0IHtyZW5kZXJTdHJpbmdpZnl9IGZyb20gJy4uL3V0aWwvbWlzY191dGlscyc7XG5pbXBvcnQge2dldFROb2RlLCBpc1N0eWxpbmdDb250ZXh0IGFzIGlzT2xkU3R5bGluZ0NvbnRleHR9IGZyb20gJy4uL3V0aWwvdmlld191dGlscyc7XG5cbmltcG9ydCB7YXBwbHlDbGFzc2VzLCBhcHBseVN0eWxlcywgcmVnaXN0ZXJCaW5kaW5nLCB1cGRhdGVDbGFzc0JpbmRpbmcsIHVwZGF0ZVN0eWxlQmluZGluZ30gZnJvbSAnLi9iaW5kaW5ncyc7XG5pbXBvcnQge1RTdHlsaW5nQ29udGV4dH0gZnJvbSAnLi9pbnRlcmZhY2VzJztcbmltcG9ydCB7YWN0aXZlU3R5bGluZ01hcEZlYXR1cmUsIG5vcm1hbGl6ZUludG9TdHlsaW5nTWFwfSBmcm9tICcuL21hcF9iYXNlZF9iaW5kaW5ncyc7XG5pbXBvcnQge2dldEN1cnJlbnRTdHlsZVNhbml0aXplciwgc2V0Q3VycmVudFN0eWxlU2FuaXRpemVyfSBmcm9tICcuL3N0YXRlJztcbmltcG9ydCB7YXR0YWNoU3R5bGluZ0RlYnVnT2JqZWN0fSBmcm9tICcuL3N0eWxpbmdfZGVidWcnO1xuaW1wb3J0IHthbGxvY1RTdHlsaW5nQ29udGV4dCwgZ2V0Q3VycmVudE9yTFZpZXdTYW5pdGl6ZXIsIGhhc1ZhbHVlQ2hhbmdlZCwgdXBkYXRlQ29udGV4dERpcmVjdGl2ZUluZGV4fSBmcm9tICcuL3V0aWwnO1xuXG5cblxuLyoqXG4gKiAtLS0tLS0tLVxuICpcbiAqIFRoaXMgZmlsZSBjb250YWlucyB0aGUgY29yZSBsb2dpYyBmb3IgaG93IHN0eWxpbmcgaW5zdHJ1Y3Rpb25zIGFyZSBwcm9jZXNzZWQgaW4gQW5ndWxhci5cbiAqXG4gKiBUbyBsZWFybiBtb3JlIGFib3V0IHRoZSBhbGdvcml0aG0gc2VlIGBUU3R5bGluZ0NvbnRleHRgLlxuICpcbiAqIC0tLS0tLS0tXG4gKi9cblxuLyoqXG4gKiBUZW1wb3JhcnkgZnVuY3Rpb24gdG8gYnJpZGdlIHN0eWxpbmcgZnVuY3Rpb25hbGl0eSBiZXR3ZWVuIHRoaXMgbmV3XG4gKiByZWZhY3RvciAod2hpY2ggaXMgaGVyZSBpbnNpZGUgb2YgYHN0eWxpbmdfbmV4dC9gKSBhbmQgdGhlIG9sZFxuICogaW1wbGVtZW50YXRpb24gKHdoaWNoIGxpdmVzIGluc2lkZSBvZiBgc3R5bGluZy9gKS5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIGlzIGV4ZWN1dGVkIGR1cmluZyB0aGUgY3JlYXRpb24gYmxvY2sgb2YgYW4gZWxlbWVudC5cbiAqIEJlY2F1c2UgdGhlIGV4aXN0aW5nIHN0eWxpbmcgaW1wbGVtZW50YXRpb24gaXNzdWVzIGEgY2FsbCB0byB0aGVcbiAqIGBzdHlsaW5nKClgIGluc3RydWN0aW9uLCB0aGlzIGluc3RydWN0aW9uIHdpbGwgYWxzbyBnZXQgcnVuLiBUaGVcbiAqIGNlbnRyYWwgaWRlYSBoZXJlIGlzIHRoYXQgdGhlIGRpcmVjdGl2ZSBpbmRleCB2YWx1ZXMgYXJlIGJvdW5kXG4gKiBpbnRvIHRoZSBjb250ZXh0LiBUaGUgZGlyZWN0aXZlIGluZGV4IGlzIHRlbXBvcmFyeSBhbmQgaXMgb25seVxuICogcmVxdWlyZWQgdW50aWwgdGhlIGBzZWxlY3QobilgIGluc3RydWN0aW9uIGlzIGZ1bGx5IGZ1bmN0aW9uYWwuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzdHlsaW5nSW5pdCgpIHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCBpbmRleCA9IGdldFNlbGVjdGVkSW5kZXgoKTtcbiAgY29uc3QgdE5vZGUgPSBnZXRUTm9kZShpbmRleCwgbFZpZXcpO1xuICB1cGRhdGVMYXN0RGlyZWN0aXZlSW5kZXgodE5vZGUsIGdldEFjdGl2ZURpcmVjdGl2ZVN0eWxpbmdJbmRleCgpKTtcbn1cblxuLyoqXG4gKiBTZXRzIHRoZSBjdXJyZW50IHN0eWxlIHNhbml0aXplciBmdW5jdGlvbiB3aGljaCB3aWxsIHRoZW4gYmUgdXNlZFxuICogd2l0aGluIGFsbCBmb2xsb3ctdXAgcHJvcCBhbmQgbWFwLWJhc2VkIHN0eWxlIGJpbmRpbmcgaW5zdHJ1Y3Rpb25zXG4gKiBmb3IgdGhlIGdpdmVuIGVsZW1lbnQuXG4gKlxuICogTm90ZSB0aGF0IG9uY2Ugc3R5bGluZyBoYXMgYmVlbiBhcHBsaWVkIHRvIHRoZSBlbGVtZW50IChpLmUuIG9uY2VcbiAqIGBzZWxlY3QobilgIGlzIGV4ZWN1dGVkIG9yIHRoZSBob3N0QmluZGluZ3MvdGVtcGxhdGUgZnVuY3Rpb24gZXhpdHMpXG4gKiB0aGVuIHRoZSBhY3RpdmUgYHNhbml0aXplckZuYCB3aWxsIGJlIHNldCB0byBgbnVsbGAuIFRoaXMgbWVhbnMgdGhhdFxuICogb25jZSBzdHlsaW5nIGlzIGFwcGxpZWQgdG8gYW5vdGhlciBlbGVtZW50IHRoZW4gYSBhbm90aGVyIGNhbGwgdG9cbiAqIGBzdHlsZVNhbml0aXplcmAgd2lsbCBuZWVkIHRvIGJlIG1hZGUuXG4gKlxuICogQHBhcmFtIHNhbml0aXplckZuIFRoZSBzYW5pdGl6YXRpb24gZnVuY3Rpb24gdGhhdCB3aWxsIGJlIHVzZWQgdG9cbiAqICAgICAgIHByb2Nlc3Mgc3R5bGUgcHJvcC92YWx1ZSBlbnRyaWVzLlxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzdHlsZVNhbml0aXplcihzYW5pdGl6ZXI6IFNhbml0aXplciB8IFN0eWxlU2FuaXRpemVGbiB8IG51bGwpOiB2b2lkIHtcbiAgc2V0Q3VycmVudFN0eWxlU2FuaXRpemVyKHNhbml0aXplcik7XG59XG5cbi8qKlxuICogTWlycm9yIGltcGxlbWVudGF0aW9uIG9mIHRoZSBgc3R5bGVQcm9wKClgIGluc3RydWN0aW9uIChmb3VuZCBpbiBgaW5zdHJ1Y3Rpb25zL3N0eWxpbmcudHNgKS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHN0eWxlUHJvcChcbiAgICBwcm9wOiBzdHJpbmcsIHZhbHVlOiBzdHJpbmcgfCBudW1iZXIgfCBTdHJpbmcgfCBudWxsLCBzdWZmaXg/OiBzdHJpbmcgfCBudWxsKTogdm9pZCB7XG4gIF9zdHlsaW5nUHJvcChwcm9wLCByZXNvbHZlU3R5bGVQcm9wVmFsdWUodmFsdWUsIHN1ZmZpeCksIGZhbHNlKTtcbn1cblxuLyoqXG4gKiBNaXJyb3IgaW1wbGVtZW50YXRpb24gb2YgdGhlIGBjbGFzc1Byb3AoKWAgaW5zdHJ1Y3Rpb24gKGZvdW5kIGluIGBpbnN0cnVjdGlvbnMvc3R5bGluZy50c2ApLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY2xhc3NQcm9wKGNsYXNzTmFtZTogc3RyaW5nLCB2YWx1ZTogYm9vbGVhbiB8IG51bGwpOiB2b2lkIHtcbiAgX3N0eWxpbmdQcm9wKGNsYXNzTmFtZSwgdmFsdWUsIHRydWUpO1xufVxuXG4vKipcbiAqIFNoYXJlZCBmdW5jdGlvbiB1c2VkIHRvIHVwZGF0ZSBhIHByb3AtYmFzZWQgc3R5bGluZyBiaW5kaW5nIGZvciBhbiBlbGVtZW50LlxuICovXG5mdW5jdGlvbiBfc3R5bGluZ1Byb3AoXG4gICAgcHJvcDogc3RyaW5nLCB2YWx1ZTogYm9vbGVhbiB8IG51bWJlciB8IFN0cmluZyB8IHN0cmluZyB8IG51bGwsIGlzQ2xhc3NCYXNlZDogYm9vbGVhbikge1xuICBjb25zdCBpbmRleCA9IGdldFNlbGVjdGVkSW5kZXgoKTtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCBiaW5kaW5nSW5kZXggPSBsVmlld1tCSU5ESU5HX0lOREVYXSsrO1xuICBjb25zdCB0Tm9kZSA9IGdldFROb2RlKGluZGV4LCBsVmlldyk7XG4gIGNvbnN0IGRlZmVyID0gZ2V0QWN0aXZlRGlyZWN0aXZlU3VwZXJDbGFzc0hlaWdodCgpID4gMDtcbiAgaWYgKGlzQ2xhc3NCYXNlZCkge1xuICAgIHVwZGF0ZUNsYXNzQmluZGluZyhcbiAgICAgICAgZ2V0Q2xhc3Nlc0NvbnRleHQodE5vZGUpLCBsVmlldywgcHJvcCwgYmluZGluZ0luZGV4LCB2YWx1ZSBhcyBzdHJpbmcgfCBib29sZWFuIHwgbnVsbCxcbiAgICAgICAgZGVmZXIsIGZhbHNlKTtcbiAgfSBlbHNlIHtcbiAgICBjb25zdCBzYW5pdGl6ZXIgPSBnZXRDdXJyZW50T3JMVmlld1Nhbml0aXplcihsVmlldyk7XG4gICAgdXBkYXRlU3R5bGVCaW5kaW5nKFxuICAgICAgICBnZXRTdHlsZXNDb250ZXh0KHROb2RlKSwgbFZpZXcsIHByb3AsIGJpbmRpbmdJbmRleCwgdmFsdWUgYXMgc3RyaW5nIHwgbnVsbCwgc2FuaXRpemVyLFxuICAgICAgICBkZWZlciwgZmFsc2UpO1xuICB9XG59XG5cbi8qKlxuICogTWlycm9yIGltcGxlbWVudGF0aW9uIG9mIHRoZSBgc3R5bGVNYXAoKWAgaW5zdHJ1Y3Rpb24gKGZvdW5kIGluIGBpbnN0cnVjdGlvbnMvc3R5bGluZy50c2ApLlxuICovXG5leHBvcnQgZnVuY3Rpb24gc3R5bGVNYXAoc3R5bGVzOiB7W3N0eWxlTmFtZTogc3RyaW5nXTogYW55fSB8IE5PX0NIQU5HRSB8IG51bGwpOiB2b2lkIHtcbiAgX3N0eWxpbmdNYXAoc3R5bGVzLCBmYWxzZSk7XG59XG5cbi8qKlxuICogTWlycm9yIGltcGxlbWVudGF0aW9uIG9mIHRoZSBgY2xhc3NNYXAoKWAgaW5zdHJ1Y3Rpb24gKGZvdW5kIGluIGBpbnN0cnVjdGlvbnMvc3R5bGluZy50c2ApLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY2xhc3NNYXAoY2xhc3Nlczoge1tjbGFzc05hbWU6IHN0cmluZ106IGFueX0gfCBOT19DSEFOR0UgfCBzdHJpbmcgfCBudWxsKTogdm9pZCB7XG4gIF9zdHlsaW5nTWFwKGNsYXNzZXMsIHRydWUpO1xufVxuXG4vKipcbiAqIFNoYXJlZCBmdW5jdGlvbiB1c2VkIHRvIHVwZGF0ZSBhIG1hcC1iYXNlZCBzdHlsaW5nIGJpbmRpbmcgZm9yIGFuIGVsZW1lbnQuXG4gKlxuICogV2hlbiB0aGlzIGZ1bmN0aW9uIGlzIGNhbGxlZCBpdCB3aWxsIGFjdGl2YXRlIHN1cHBvcnQgZm9yIGBbc3R5bGVdYCBhbmRcbiAqIGBbY2xhc3NdYCBiaW5kaW5ncyBpbiBBbmd1bGFyLlxuICovXG5mdW5jdGlvbiBfc3R5bGluZ01hcCh2YWx1ZToge1trZXk6IHN0cmluZ106IGFueX0gfCBzdHJpbmcgfCBudWxsLCBpc0NsYXNzQmFzZWQ6IGJvb2xlYW4pIHtcbiAgYWN0aXZlU3R5bGluZ01hcEZlYXR1cmUoKTtcbiAgY29uc3QgaW5kZXggPSBnZXRTZWxlY3RlZEluZGV4KCk7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgYmluZGluZ0luZGV4ID0gbFZpZXdbQklORElOR19JTkRFWF0rKztcblxuICBpZiAodmFsdWUgIT09IE5PX0NIQU5HRSkge1xuICAgIGNvbnN0IHROb2RlID0gZ2V0VE5vZGUoaW5kZXgsIGxWaWV3KTtcbiAgICBjb25zdCBkZWZlciA9IGdldEFjdGl2ZURpcmVjdGl2ZVN1cGVyQ2xhc3NIZWlnaHQoKSA+IDA7XG4gICAgY29uc3Qgb2xkVmFsdWUgPSBsVmlld1tiaW5kaW5nSW5kZXhdO1xuICAgIGNvbnN0IHZhbHVlSGFzQ2hhbmdlZCA9IGhhc1ZhbHVlQ2hhbmdlZChvbGRWYWx1ZSwgdmFsdWUpO1xuICAgIGNvbnN0IGxTdHlsaW5nTWFwID0gbm9ybWFsaXplSW50b1N0eWxpbmdNYXAob2xkVmFsdWUsIHZhbHVlKTtcbiAgICBpZiAoaXNDbGFzc0Jhc2VkKSB7XG4gICAgICB1cGRhdGVDbGFzc0JpbmRpbmcoXG4gICAgICAgICAgZ2V0Q2xhc3Nlc0NvbnRleHQodE5vZGUpLCBsVmlldywgbnVsbCwgYmluZGluZ0luZGV4LCBsU3R5bGluZ01hcCwgZGVmZXIsIHZhbHVlSGFzQ2hhbmdlZCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IHNhbml0aXplciA9IGdldEN1cnJlbnRPckxWaWV3U2FuaXRpemVyKGxWaWV3KTtcbiAgICAgIHVwZGF0ZVN0eWxlQmluZGluZyhcbiAgICAgICAgICBnZXRTdHlsZXNDb250ZXh0KHROb2RlKSwgbFZpZXcsIG51bGwsIGJpbmRpbmdJbmRleCwgbFN0eWxpbmdNYXAsIHNhbml0aXplciwgZGVmZXIsXG4gICAgICAgICAgdmFsdWVIYXNDaGFuZ2VkKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBUZW1wb3JhcnkgZnVuY3Rpb24gdG8gYnJpZGdlIHN0eWxpbmcgZnVuY3Rpb25hbGl0eSBiZXR3ZWVuIHRoaXMgbmV3XG4gKiByZWZhY3RvciAod2hpY2ggaXMgaGVyZSBpbnNpZGUgb2YgYHN0eWxpbmdfbmV4dC9gKSBhbmQgdGhlIG9sZFxuICogaW1wbGVtZW50YXRpb24gKHdoaWNoIGxpdmVzIGluc2lkZSBvZiBgc3R5bGluZy9gKS5cbiAqXG4gKiBUaGUgbmV3IHN0eWxpbmcgcmVmYWN0b3IgZW5zdXJlcyB0aGF0IHN0eWxpbmcgZmx1c2hpbmcgaXMgY2FsbGVkXG4gKiBhdXRvbWF0aWNhbGx5IHdoZW4gYSB0ZW1wbGF0ZSBmdW5jdGlvbiBleGl0cyBvciBhIGZvbGxvdy11cCBlbGVtZW50XG4gKiBpcyB2aXNpdGVkIChpLmUuIHdoZW4gYHNlbGVjdChuKWAgaXMgY2FsbGVkKS4gQmVjYXVzZSB0aGUgYHNlbGVjdChuKWBcbiAqIGluc3RydWN0aW9uIGlzIG5vdCBmdWxseSBpbXBsZW1lbnRlZCB5ZXQgKGl0IGRvZXNuJ3QgYWN0dWFsbHkgZXhlY3V0ZVxuICogaG9zdCBiaW5kaW5nIGluc3RydWN0aW9uIGNvZGUgYXQgdGhlIHJpZ2h0IHRpbWUpLCB0aGlzIG1lYW5zIHRoYXQgYVxuICogc3R5bGluZyBhcHBseSBmdW5jdGlvbiBpcyBzdGlsbCBuZWVkZWQuXG4gKlxuICogVGhpcyBmdW5jdGlvbiBpcyBhIG1pcnJvciBpbXBsZW1lbnRhdGlvbiBvZiB0aGUgYHN0eWxpbmdBcHBseSgpYFxuICogaW5zdHJ1Y3Rpb24gKGZvdW5kIGluIGBpbnN0cnVjdGlvbnMvc3R5bGluZy50c2ApLlxuICovXG5leHBvcnQgZnVuY3Rpb24gc3R5bGluZ0FwcGx5KCkge1xuICBjb25zdCBpbmRleCA9IGdldFNlbGVjdGVkSW5kZXgoKTtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCB0Tm9kZSA9IGdldFROb2RlKGluZGV4LCBsVmlldyk7XG4gIGNvbnN0IHJlbmRlcmVyID0gZ2V0UmVuZGVyZXIodE5vZGUsIGxWaWV3KTtcbiAgY29uc3QgbmF0aXZlID0gZ2V0TmF0aXZlRnJvbUxWaWV3KGluZGV4LCBsVmlldyk7XG4gIGNvbnN0IGRpcmVjdGl2ZUluZGV4ID0gZ2V0QWN0aXZlRGlyZWN0aXZlU3R5bGluZ0luZGV4KCk7XG4gIGFwcGx5Q2xhc3NlcyhyZW5kZXJlciwgbFZpZXcsIGdldENsYXNzZXNDb250ZXh0KHROb2RlKSwgbmF0aXZlLCBkaXJlY3RpdmVJbmRleCk7XG5cbiAgY29uc3Qgc2FuaXRpemVyID0gZ2V0Q3VycmVudE9yTFZpZXdTYW5pdGl6ZXIobFZpZXcpO1xuICBhcHBseVN0eWxlcyhyZW5kZXJlciwgbFZpZXcsIGdldFN0eWxlc0NvbnRleHQodE5vZGUpLCBuYXRpdmUsIGRpcmVjdGl2ZUluZGV4LCBzYW5pdGl6ZXIpO1xuXG4gIHNldEN1cnJlbnRTdHlsZVNhbml0aXplcihudWxsKTtcbn1cblxuLyoqXG4gKiBUZW1wb3JhcnkgZnVuY3Rpb24gdG8gYnJpZGdlIHN0eWxpbmcgZnVuY3Rpb25hbGl0eSBiZXR3ZWVuIHRoaXMgbmV3XG4gKiByZWZhY3RvciAod2hpY2ggaXMgaGVyZSBpbnNpZGUgb2YgYHN0eWxpbmdfbmV4dC9gKSBhbmQgdGhlIG9sZFxuICogaW1wbGVtZW50YXRpb24gKHdoaWNoIGxpdmVzIGluc2lkZSBvZiBgc3R5bGluZy9gKS5cbiAqXG4gKiBUaGUgcHVycG9zZSBvZiB0aGlzIGZ1bmN0aW9uIGlzIHRvIHRyYXZlcnNlIHRocm91Z2ggdGhlIExWaWV3IGRhdGFcbiAqIGZvciBhIHNwZWNpZmljIGVsZW1lbnQgaW5kZXggYW5kIHJldHVybiB0aGUgbmF0aXZlIG5vZGUuIEJlY2F1c2UgdGhlXG4gKiBjdXJyZW50IGltcGxlbWVudGF0aW9uIHJlbGllcyBvbiB0aGVyZSBiZWluZyBhIHN0eWxpbmcgY29udGV4dCBhcnJheSxcbiAqIHRoZSBjb2RlIGJlbG93IHdpbGwgbmVlZCB0byBsb29wIHRocm91Z2ggdGhlc2UgYXJyYXkgdmFsdWVzIHVudGlsIGl0XG4gKiBnZXRzIGEgbmF0aXZlIGVsZW1lbnQgbm9kZS5cbiAqXG4gKiBOb3RlIHRoYXQgdGhpcyBjb2RlIGlzIHRlbXBvcmFyeSBhbmQgd2lsbCBkaXNhcHBlYXIgb25jZSB0aGUgbmV3XG4gKiBzdHlsaW5nIHJlZmFjdG9yIGxhbmRzIGluIGl0cyBlbnRpcmV0eS5cbiAqL1xuZnVuY3Rpb24gZ2V0TmF0aXZlRnJvbUxWaWV3KGluZGV4OiBudW1iZXIsIHZpZXdEYXRhOiBMVmlldyk6IFJFbGVtZW50IHtcbiAgbGV0IHN0b3JhZ2VJbmRleCA9IGluZGV4ICsgSEVBREVSX09GRlNFVDtcbiAgbGV0IHNsb3RWYWx1ZTogTENvbnRhaW5lcnxMVmlld3xPbGRTdHlsaW5nQ29udGV4dHxSRWxlbWVudCA9IHZpZXdEYXRhW3N0b3JhZ2VJbmRleF07XG4gIGxldCB3cmFwcGVyOiBMQ29udGFpbmVyfExWaWV3fE9sZFN0eWxpbmdDb250ZXh0ID0gdmlld0RhdGE7XG4gIHdoaWxlIChBcnJheS5pc0FycmF5KHNsb3RWYWx1ZSkpIHtcbiAgICB3cmFwcGVyID0gc2xvdFZhbHVlO1xuICAgIHNsb3RWYWx1ZSA9IHNsb3RWYWx1ZVtIT1NUXSBhcyBMVmlldyB8IE9sZFN0eWxpbmdDb250ZXh0IHwgUkVsZW1lbnQ7XG4gIH1cbiAgaWYgKGlzT2xkU3R5bGluZ0NvbnRleHQod3JhcHBlcikpIHtcbiAgICByZXR1cm4gd3JhcHBlcltPbGRTdHlsaW5nSW5kZXguRWxlbWVudFBvc2l0aW9uXSBhcyBSRWxlbWVudDtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gc2xvdFZhbHVlO1xuICB9XG59XG5cbmZ1bmN0aW9uIGdldFJlbmRlcmVyKHROb2RlOiBUTm9kZSwgbFZpZXc6IExWaWV3KSB7XG4gIHJldHVybiB0Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuRWxlbWVudCA/IGxWaWV3W1JFTkRFUkVSXSA6IG51bGw7XG59XG5cbi8qKlxuICogU2VhcmNoZXMgYW5kIGFzc2lnbnMgcHJvdmlkZWQgYWxsIHN0YXRpYyBzdHlsZS9jbGFzcyBlbnRyaWVzIChmb3VuZCBpbiB0aGUgYGF0dHJzYCB2YWx1ZSlcbiAqIGFuZCByZWdpc3RlcnMgdGhlbSBpbiB0aGVpciByZXNwZWN0aXZlIHN0eWxpbmcgY29udGV4dHMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZWdpc3RlckluaXRpYWxTdHlsaW5nSW50b0NvbnRleHQoXG4gICAgdE5vZGU6IFROb2RlLCBhdHRyczogVEF0dHJpYnV0ZXMsIHN0YXJ0SW5kZXg6IG51bWJlcikge1xuICBsZXQgY2xhc3Nlc0NvbnRleHQgITogVFN0eWxpbmdDb250ZXh0O1xuICBsZXQgc3R5bGVzQ29udGV4dCAhOiBUU3R5bGluZ0NvbnRleHQ7XG4gIGxldCBtb2RlID0gLTE7XG4gIGZvciAobGV0IGkgPSBzdGFydEluZGV4OyBpIDwgYXR0cnMubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCBhdHRyID0gYXR0cnNbaV07XG4gICAgaWYgKHR5cGVvZiBhdHRyID09ICdudW1iZXInKSB7XG4gICAgICBtb2RlID0gYXR0cjtcbiAgICB9IGVsc2UgaWYgKG1vZGUgPT0gQXR0cmlidXRlTWFya2VyLkNsYXNzZXMpIHtcbiAgICAgIGNsYXNzZXNDb250ZXh0ID0gY2xhc3Nlc0NvbnRleHQgfHwgZ2V0Q2xhc3Nlc0NvbnRleHQodE5vZGUpO1xuICAgICAgcmVnaXN0ZXJCaW5kaW5nKGNsYXNzZXNDb250ZXh0LCAtMSwgYXR0ciBhcyBzdHJpbmcsIHRydWUsIGZhbHNlKTtcbiAgICB9IGVsc2UgaWYgKG1vZGUgPT0gQXR0cmlidXRlTWFya2VyLlN0eWxlcykge1xuICAgICAgc3R5bGVzQ29udGV4dCA9IHN0eWxlc0NvbnRleHQgfHwgZ2V0U3R5bGVzQ29udGV4dCh0Tm9kZSk7XG4gICAgICByZWdpc3RlckJpbmRpbmcoc3R5bGVzQ29udGV4dCwgLTEsIGF0dHIgYXMgc3RyaW5nLCBhdHRyc1srK2ldIGFzIHN0cmluZywgZmFsc2UpO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIE1pcnJvciBpbXBsZW1lbnRhdGlvbiBvZiB0aGUgc2FtZSBmdW5jdGlvbiBmb3VuZCBpbiBgaW5zdHJ1Y3Rpb25zL3N0eWxpbmcudHNgLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0QWN0aXZlRGlyZWN0aXZlU3R5bGluZ0luZGV4KCk6IG51bWJlciB7XG4gIC8vIHdoZW5ldmVyIGEgZGlyZWN0aXZlJ3MgaG9zdEJpbmRpbmdzIGZ1bmN0aW9uIGlzIGNhbGxlZCBhIHVuaXF1ZUlkIHZhbHVlXG4gIC8vIGlzIGFzc2lnbmVkLiBOb3JtYWxseSB0aGlzIGlzIGVub3VnaCB0byBoZWxwIGRpc3Rpbmd1aXNoIG9uZSBkaXJlY3RpdmVcbiAgLy8gZnJvbSBhbm90aGVyIGZvciB0aGUgc3R5bGluZyBjb250ZXh0LCBidXQgdGhlcmUgYXJlIHNpdHVhdGlvbnMgd2hlcmUgYVxuICAvLyBzdWItY2xhc3MgZGlyZWN0aXZlIGNvdWxkIGluaGVyaXQgYW5kIGFzc2lnbiBzdHlsaW5nIGluIGNvbmNlcnQgd2l0aCBhXG4gIC8vIHBhcmVudCBkaXJlY3RpdmUuIFRvIGhlbHAgdGhlIHN0eWxpbmcgY29kZSBkaXN0aW5ndWlzaCBiZXR3ZWVuIGEgcGFyZW50XG4gIC8vIHN1Yi1jbGFzc2VkIGRpcmVjdGl2ZSB0aGUgaW5oZXJpdGFuY2UgZGVwdGggaXMgdGFrZW4gaW50byBhY2NvdW50IGFzIHdlbGwuXG4gIHJldHVybiBnZXRBY3RpdmVEaXJlY3RpdmVJZCgpICsgZ2V0QWN0aXZlRGlyZWN0aXZlU3VwZXJDbGFzc0RlcHRoKCk7XG59XG5cbi8qKlxuICogVGVtcG9yYXJ5IGZ1bmN0aW9uIHRoYXQgd2lsbCB1cGRhdGUgdGhlIG1heCBkaXJlY3RpdmUgaW5kZXggdmFsdWUgaW5cbiAqIGJvdGggdGhlIGNsYXNzZXMgYW5kIHN0eWxlcyBjb250ZXh0cyBwcmVzZW50IG9uIHRoZSBwcm92aWRlZCBgdE5vZGVgLlxuICpcbiAqIFRoaXMgY29kZSBpcyBvbmx5IHVzZWQgYmVjYXVzZSB0aGUgYHNlbGVjdChuKWAgY29kZSBmdW5jdGlvbmFsaXR5IGlzIG5vdFxuICogeWV0IDEwMCUgZnVuY3Rpb25hbC4gVGhlIGBzZWxlY3QobilgIGluc3RydWN0aW9uIGNhbm5vdCB5ZXQgZXZhbHVhdGUgaG9zdFxuICogYmluZGluZ3MgZnVuY3Rpb24gY29kZSBpbiBzeW5jIHdpdGggdGhlIGFzc29jaWF0ZWQgdGVtcGxhdGUgZnVuY3Rpb24gY29kZS5cbiAqIEZvciB0aGlzIHJlYXNvbiB0aGUgc3R5bGluZyBhbGdvcml0aG0gbmVlZHMgdG8gdHJhY2sgdGhlIGxhc3QgZGlyZWN0aXZlIGluZGV4XG4gKiB2YWx1ZSBzbyB0aGF0IGl0IGtub3dzIGV4YWN0bHkgd2hlbiB0byByZW5kZXIgc3R5bGluZyB0byB0aGUgZWxlbWVudCBzaW5jZVxuICogYHN0eWxpbmdBcHBseSgpYCBpcyBjYWxsZWQgbXVsdGlwbGUgdGltZXMgcGVyIENEIChgc3R5bGluZ0FwcGx5YCB3aWxsIGJlXG4gKiByZW1vdmVkIG9uY2UgYHNlbGVjdChuKWAgaXMgZml4ZWQpLlxuICovXG5mdW5jdGlvbiB1cGRhdGVMYXN0RGlyZWN0aXZlSW5kZXgodE5vZGU6IFROb2RlLCBkaXJlY3RpdmVJbmRleDogbnVtYmVyKSB7XG4gIHVwZGF0ZUNvbnRleHREaXJlY3RpdmVJbmRleChnZXRDbGFzc2VzQ29udGV4dCh0Tm9kZSksIGRpcmVjdGl2ZUluZGV4KTtcbiAgdXBkYXRlQ29udGV4dERpcmVjdGl2ZUluZGV4KGdldFN0eWxlc0NvbnRleHQodE5vZGUpLCBkaXJlY3RpdmVJbmRleCk7XG59XG5cbmZ1bmN0aW9uIGdldFN0eWxlc0NvbnRleHQodE5vZGU6IFROb2RlKTogVFN0eWxpbmdDb250ZXh0IHtcbiAgcmV0dXJuIGdldENvbnRleHQodE5vZGUsIGZhbHNlKTtcbn1cblxuZnVuY3Rpb24gZ2V0Q2xhc3Nlc0NvbnRleHQodE5vZGU6IFROb2RlKTogVFN0eWxpbmdDb250ZXh0IHtcbiAgcmV0dXJuIGdldENvbnRleHQodE5vZGUsIHRydWUpO1xufVxuXG4vKipcbiAqIFJldHVybnMvaW5zdGFudGlhdGVzIGEgc3R5bGluZyBjb250ZXh0IGZyb20vdG8gYSBgdE5vZGVgIGluc3RhbmNlLlxuICovXG5mdW5jdGlvbiBnZXRDb250ZXh0KHROb2RlOiBUTm9kZSwgaXNDbGFzc0Jhc2VkOiBib29sZWFuKSB7XG4gIGxldCBjb250ZXh0ID0gaXNDbGFzc0Jhc2VkID8gdE5vZGUubmV3Q2xhc3NlcyA6IHROb2RlLm5ld1N0eWxlcztcbiAgaWYgKCFjb250ZXh0KSB7XG4gICAgY29udGV4dCA9IGFsbG9jVFN0eWxpbmdDb250ZXh0KCk7XG4gICAgaWYgKG5nRGV2TW9kZSkge1xuICAgICAgYXR0YWNoU3R5bGluZ0RlYnVnT2JqZWN0KGNvbnRleHQpO1xuICAgIH1cbiAgICBpZiAoaXNDbGFzc0Jhc2VkKSB7XG4gICAgICB0Tm9kZS5uZXdDbGFzc2VzID0gY29udGV4dDtcbiAgICB9IGVsc2Uge1xuICAgICAgdE5vZGUubmV3U3R5bGVzID0gY29udGV4dDtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGNvbnRleHQ7XG59XG5cbmZ1bmN0aW9uIHJlc29sdmVTdHlsZVByb3BWYWx1ZShcbiAgICB2YWx1ZTogc3RyaW5nIHwgbnVtYmVyIHwgU3RyaW5nIHwgbnVsbCwgc3VmZml4OiBzdHJpbmcgfCBudWxsIHwgdW5kZWZpbmVkKSB7XG4gIGxldCByZXNvbHZlZFZhbHVlOiBzdHJpbmd8bnVsbCA9IG51bGw7XG4gIGlmICh2YWx1ZSAhPT0gbnVsbCkge1xuICAgIGlmIChzdWZmaXgpIHtcbiAgICAgIC8vIHdoZW4gYSBzdWZmaXggaXMgYXBwbGllZCB0aGVuIGl0IHdpbGwgYnlwYXNzXG4gICAgICAvLyBzYW5pdGl6YXRpb24gZW50aXJlbHkgKGIvYyBhIG5ldyBzdHJpbmcgaXMgY3JlYXRlZClcbiAgICAgIHJlc29sdmVkVmFsdWUgPSByZW5kZXJTdHJpbmdpZnkodmFsdWUpICsgc3VmZml4O1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBzYW5pdGl6YXRpb24gaGFwcGVucyBieSBkZWFsaW5nIHdpdGggYSBTdHJpbmcgdmFsdWVcbiAgICAgIC8vIHRoaXMgbWVhbnMgdGhhdCB0aGUgc3RyaW5nIHZhbHVlIHdpbGwgYmUgcGFzc2VkIHRocm91Z2hcbiAgICAgIC8vIGludG8gdGhlIHN0eWxlIHJlbmRlcmluZyBsYXRlciAod2hpY2ggaXMgd2hlcmUgdGhlIHZhbHVlXG4gICAgICAvLyB3aWxsIGJlIHNhbml0aXplZCBiZWZvcmUgaXQgaXMgYXBwbGllZClcbiAgICAgIHJlc29sdmVkVmFsdWUgPSB2YWx1ZSBhcyBhbnkgYXMgc3RyaW5nO1xuICAgIH1cbiAgfVxuICByZXR1cm4gcmVzb2x2ZWRWYWx1ZTtcbn1cbiJdfQ==