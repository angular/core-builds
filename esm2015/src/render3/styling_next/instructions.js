/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
import { BINDING_INDEX, HEADER_OFFSET, HOST, RENDERER } from '../interfaces/view';
import { getActiveDirectiveId, getActiveDirectiveSuperClassDepth, getActiveDirectiveSuperClassHeight, getLView, getSelectedIndex } from '../state';
import { getTNode, isStylingContext as isOldStylingContext } from '../util/view_utils';
import { applyClasses, applyStyles, registerBinding, updateClassBinding, updateStyleBinding } from './bindings';
import { attachStylingDebugObject } from './styling_debug';
import { allocStylingContext, updateContextDirectiveIndex } from './util';
/**
 * This file contains the core logic for how styling instructions are processed in Angular.
 *
 * To learn more about the algorithm see `TStylingContext`.
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
    /** @type {?} */
    const index = getSelectedIndex();
    /** @type {?} */
    const lView = getLView();
    /** @type {?} */
    const bindingIndex = lView[BINDING_INDEX]++;
    /** @type {?} */
    const tNode = getTNode(index, lView);
    /** @type {?} */
    const tContext = getStylesContext(tNode);
    /** @type {?} */
    const defer = getActiveDirectiveSuperClassHeight() > 0;
    updateStyleBinding(tContext, lView, prop, bindingIndex, value, defer);
}
/**
 * Mirror implementation of the `classProp()` instruction (found in `instructions/styling.ts`).
 * @param {?} className
 * @param {?} value
 * @return {?}
 */
export function classProp(className, value) {
    /** @type {?} */
    const index = getSelectedIndex();
    /** @type {?} */
    const lView = getLView();
    /** @type {?} */
    const bindingIndex = lView[BINDING_INDEX]++;
    /** @type {?} */
    const tNode = getTNode(index, lView);
    /** @type {?} */
    const tContext = getClassesContext(tNode);
    /** @type {?} */
    const defer = getActiveDirectiveSuperClassHeight() > 0;
    updateClassBinding(tContext, lView, className, bindingIndex, value, defer);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5zdHJ1Y3Rpb25zLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9zdHlsaW5nX25leHQvaW5zdHJ1Y3Rpb25zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7QUFXQSxPQUFPLEVBQUMsYUFBYSxFQUFFLGFBQWEsRUFBRSxJQUFJLEVBQVMsUUFBUSxFQUFDLE1BQU0sb0JBQW9CLENBQUM7QUFDdkYsT0FBTyxFQUFDLG9CQUFvQixFQUFFLGlDQUFpQyxFQUFFLGtDQUFrQyxFQUFFLFFBQVEsRUFBRSxnQkFBZ0IsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUNqSixPQUFPLEVBQUMsUUFBUSxFQUFFLGdCQUFnQixJQUFJLG1CQUFtQixFQUFDLE1BQU0sb0JBQW9CLENBQUM7QUFFckYsT0FBTyxFQUFDLFlBQVksRUFBRSxXQUFXLEVBQUUsZUFBZSxFQUFFLGtCQUFrQixFQUFFLGtCQUFrQixFQUFDLE1BQU0sWUFBWSxDQUFDO0FBRTlHLE9BQU8sRUFBQyx3QkFBd0IsRUFBQyxNQUFNLGlCQUFpQixDQUFDO0FBQ3pELE9BQU8sRUFBQyxtQkFBbUIsRUFBRSwyQkFBMkIsRUFBQyxNQUFNLFFBQVEsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQXFCeEUsTUFBTSxVQUFVLFdBQVc7O1VBQ25CLEtBQUssR0FBRyxRQUFRLEVBQUU7O1VBQ2xCLEtBQUssR0FBRyxnQkFBZ0IsRUFBRTs7VUFDMUIsS0FBSyxHQUFHLFFBQVEsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDO0lBQ3BDLHdCQUF3QixDQUFDLEtBQUssRUFBRSw4QkFBOEIsRUFBRSxDQUFDLENBQUM7QUFDcEUsQ0FBQzs7Ozs7Ozs7QUFLRCxNQUFNLFVBQVUsU0FBUyxDQUNyQixJQUFZLEVBQUUsS0FBc0MsRUFBRSxNQUFzQjs7VUFDeEUsS0FBSyxHQUFHLGdCQUFnQixFQUFFOztVQUMxQixLQUFLLEdBQUcsUUFB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QWEsSUFBSSxnQkFBZ0IsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUN6RCxlQUFlLENBQUMsYUFBYSxFQUFFLENBQUMsQ0FBQyxFQUFFLG1CQUFBLElBQUksRUFBVSxFQUFFLG1CQUFBLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFVLENBQUMsQ0FBQztTQUMxRTtLQUNGO0FBQ0gsQ0FBQzs7Ozs7QUFLRCxNQUFNLFVBQVUsOEJBQThCO0lBQzVDLDBFQUEwRTtJQUMxRSx5RUFBeUU7SUFDekUseUVBQXlFO0lBQ3pFLHlFQUF5RTtJQUN6RSwwRUFBMEU7SUFDMUUsNkVBQTZFO0lBQzdFLE9BQU8sb0JBQW9CLEVBQUUsR0FBRyxpQ0FBaUMsRUFBRSxDQUFDO0FBQ3RFLENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7QUFjRCxTQUFTLHdCQUF3QixDQUFDLEtBQVksRUFBRSxjQUFzQjtJQUNwRSwyQkFBMkIsQ0FBQyxpQkFBaUIsQ0FBQyxLQUFLLENBQUMsRUFBRSxjQUFjLENBQUMsQ0FBQztJQUN0RSwyQkFBMkIsQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFLLENBQUMsRUFBRSxjQUFjLENBQUMsQ0FBQztBQUN2RSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4qIEBsaWNlbnNlXG4qIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuKlxuKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4qL1xuaW1wb3J0IHtMQ29udGFpbmVyfSBmcm9tICcuLi9pbnRlcmZhY2VzL2NvbnRhaW5lcic7XG5pbXBvcnQge0F0dHJpYnV0ZU1hcmtlciwgVEF0dHJpYnV0ZXMsIFROb2RlLCBUTm9kZVR5cGV9IGZyb20gJy4uL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge1JFbGVtZW50fSBmcm9tICcuLi9pbnRlcmZhY2VzL3JlbmRlcmVyJztcbmltcG9ydCB7U3R5bGluZ0NvbnRleHQgYXMgT2xkU3R5bGluZ0NvbnRleHQsIFN0eWxpbmdJbmRleCBhcyBPbGRTdHlsaW5nSW5kZXh9IGZyb20gJy4uL2ludGVyZmFjZXMvc3R5bGluZyc7XG5pbXBvcnQge0JJTkRJTkdfSU5ERVgsIEhFQURFUl9PRkZTRVQsIEhPU1QsIExWaWV3LCBSRU5ERVJFUn0gZnJvbSAnLi4vaW50ZXJmYWNlcy92aWV3JztcbmltcG9ydCB7Z2V0QWN0aXZlRGlyZWN0aXZlSWQsIGdldEFjdGl2ZURpcmVjdGl2ZVN1cGVyQ2xhc3NEZXB0aCwgZ2V0QWN0aXZlRGlyZWN0aXZlU3VwZXJDbGFzc0hlaWdodCwgZ2V0TFZpZXcsIGdldFNlbGVjdGVkSW5kZXh9IGZyb20gJy4uL3N0YXRlJztcbmltcG9ydCB7Z2V0VE5vZGUsIGlzU3R5bGluZ0NvbnRleHQgYXMgaXNPbGRTdHlsaW5nQ29udGV4dH0gZnJvbSAnLi4vdXRpbC92aWV3X3V0aWxzJztcblxuaW1wb3J0IHthcHBseUNsYXNzZXMsIGFwcGx5U3R5bGVzLCByZWdpc3RlckJpbmRpbmcsIHVwZGF0ZUNsYXNzQmluZGluZywgdXBkYXRlU3R5bGVCaW5kaW5nfSBmcm9tICcuL2JpbmRpbmdzJztcbmltcG9ydCB7VFN0eWxpbmdDb250ZXh0fSBmcm9tICcuL2ludGVyZmFjZXMnO1xuaW1wb3J0IHthdHRhY2hTdHlsaW5nRGVidWdPYmplY3R9IGZyb20gJy4vc3R5bGluZ19kZWJ1Zyc7XG5pbXBvcnQge2FsbG9jU3R5bGluZ0NvbnRleHQsIHVwZGF0ZUNvbnRleHREaXJlY3RpdmVJbmRleH0gZnJvbSAnLi91dGlsJztcblxuXG4vKipcbiAqIFRoaXMgZmlsZSBjb250YWlucyB0aGUgY29yZSBsb2dpYyBmb3IgaG93IHN0eWxpbmcgaW5zdHJ1Y3Rpb25zIGFyZSBwcm9jZXNzZWQgaW4gQW5ndWxhci5cbiAqXG4gKiBUbyBsZWFybiBtb3JlIGFib3V0IHRoZSBhbGdvcml0aG0gc2VlIGBUU3R5bGluZ0NvbnRleHRgLlxuICovXG5cbi8qKlxuICogVGVtcG9yYXJ5IGZ1bmN0aW9uIHRvIGJyaWRnZSBzdHlsaW5nIGZ1bmN0aW9uYWxpdHkgYmV0d2VlbiB0aGlzIG5ld1xuICogcmVmYWN0b3IgKHdoaWNoIGlzIGhlcmUgaW5zaWRlIG9mIGBzdHlsaW5nX25leHQvYCkgYW5kIHRoZSBvbGRcbiAqIGltcGxlbWVudGF0aW9uICh3aGljaCBsaXZlcyBpbnNpZGUgb2YgYHN0eWxpbmcvYCkuXG4gKlxuICogVGhpcyBmdW5jdGlvbiBpcyBleGVjdXRlZCBkdXJpbmcgdGhlIGNyZWF0aW9uIGJsb2NrIG9mIGFuIGVsZW1lbnQuXG4gKiBCZWNhdXNlIHRoZSBleGlzdGluZyBzdHlsaW5nIGltcGxlbWVudGF0aW9uIGlzc3VlcyBhIGNhbGwgdG8gdGhlXG4gKiBgc3R5bGluZygpYCBpbnN0cnVjdGlvbiwgdGhpcyBpbnN0cnVjdGlvbiB3aWxsIGFsc28gZ2V0IHJ1bi4gVGhlXG4gKiBjZW50cmFsIGlkZWEgaGVyZSBpcyB0aGF0IHRoZSBkaXJlY3RpdmUgaW5kZXggdmFsdWVzIGFyZSBib3VuZFxuICogaW50byB0aGUgY29udGV4dC4gVGhlIGRpcmVjdGl2ZSBpbmRleCBpcyB0ZW1wb3JhcnkgYW5kIGlzIG9ubHlcbiAqIHJlcXVpcmVkIHVudGlsIHRoZSBgc2VsZWN0KG4pYCBpbnN0cnVjdGlvbiBpcyBmdWxseSBmdW5jdGlvbmFsLlxuICovXG5leHBvcnQgZnVuY3Rpb24gc3R5bGluZ0luaXQoKSB7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgaW5kZXggPSBnZXRTZWxlY3RlZEluZGV4KCk7XG4gIGNvbnN0IHROb2RlID0gZ2V0VE5vZGUoaW5kZXgsIGxWaWV3KTtcbiAgdXBkYXRlTGFzdERpcmVjdGl2ZUluZGV4KHROb2RlLCBnZXRBY3RpdmVEaXJlY3RpdmVTdHlsaW5nSW5kZXgoKSk7XG59XG5cbi8qKlxuICogTWlycm9yIGltcGxlbWVudGF0aW9uIG9mIHRoZSBgc3R5bGVQcm9wKClgIGluc3RydWN0aW9uIChmb3VuZCBpbiBgaW5zdHJ1Y3Rpb25zL3N0eWxpbmcudHNgKS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHN0eWxlUHJvcChcbiAgICBwcm9wOiBzdHJpbmcsIHZhbHVlOiBzdHJpbmcgfCBudW1iZXIgfCBTdHJpbmcgfCBudWxsLCBzdWZmaXg/OiBzdHJpbmcgfCBudWxsKTogdm9pZCB7XG4gIGNvbnN0IGluZGV4ID0gZ2V0U2VsZWN0ZWRJbmRleCgpO1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IGJpbmRpbmdJbmRleCA9IGxWaWV3W0JJTkRJTkdfSU5ERVhdKys7XG4gIGNvbnN0IHROb2RlID0gZ2V0VE5vZGUoaW5kZXgsIGxWaWV3KTtcbiAgY29uc3QgdENvbnRleHQgPSBnZXRTdHlsZXNDb250ZXh0KHROb2RlKTtcbiAgY29uc3QgZGVmZXIgPSBnZXRBY3RpdmVEaXJlY3RpdmVTdXBlckNsYXNzSGVpZ2h0KCkgPiAwO1xuICB1cGRhdGVTdHlsZUJpbmRpbmcodENvbnRleHQsIGxWaWV3LCBwcm9wLCBiaW5kaW5nSW5kZXgsIHZhbHVlLCBkZWZlcik7XG59XG5cbi8qKlxuICogTWlycm9yIGltcGxlbWVudGF0aW9uIG9mIHRoZSBgY2xhc3NQcm9wKClgIGluc3RydWN0aW9uIChmb3VuZCBpbiBgaW5zdHJ1Y3Rpb25zL3N0eWxpbmcudHNgKS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNsYXNzUHJvcChjbGFzc05hbWU6IHN0cmluZywgdmFsdWU6IGJvb2xlYW4gfCBudWxsKTogdm9pZCB7XG4gIGNvbnN0IGluZGV4ID0gZ2V0U2VsZWN0ZWRJbmRleCgpO1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IGJpbmRpbmdJbmRleCA9IGxWaWV3W0JJTkRJTkdfSU5ERVhdKys7XG4gIGNvbnN0IHROb2RlID0gZ2V0VE5vZGUoaW5kZXgsIGxWaWV3KTtcbiAgY29uc3QgdENvbnRleHQgPSBnZXRDbGFzc2VzQ29udGV4dCh0Tm9kZSk7XG4gIGNvbnN0IGRlZmVyID0gZ2V0QWN0aXZlRGlyZWN0aXZlU3VwZXJDbGFzc0hlaWdodCgpID4gMDtcbiAgdXBkYXRlQ2xhc3NCaW5kaW5nKHRDb250ZXh0LCBsVmlldywgY2xhc3NOYW1lLCBiaW5kaW5nSW5kZXgsIHZhbHVlLCBkZWZlcik7XG59XG5cbi8qKlxuICogVGVtcG9yYXJ5IGZ1bmN0aW9uIHRvIGJyaWRnZSBzdHlsaW5nIGZ1bmN0aW9uYWxpdHkgYmV0d2VlbiB0aGlzIG5ld1xuICogcmVmYWN0b3IgKHdoaWNoIGlzIGhlcmUgaW5zaWRlIG9mIGBzdHlsaW5nX25leHQvYCkgYW5kIHRoZSBvbGRcbiAqIGltcGxlbWVudGF0aW9uICh3aGljaCBsaXZlcyBpbnNpZGUgb2YgYHN0eWxpbmcvYCkuXG4gKlxuICogVGhlIG5ldyBzdHlsaW5nIHJlZmFjdG9yIGVuc3VyZXMgdGhhdCBzdHlsaW5nIGZsdXNoaW5nIGlzIGNhbGxlZFxuICogYXV0b21hdGljYWxseSB3aGVuIGEgdGVtcGxhdGUgZnVuY3Rpb24gZXhpdHMgb3IgYSBmb2xsb3ctdXAgZWxlbWVudFxuICogaXMgdmlzaXRlZCAoaS5lLiB3aGVuIGBzZWxlY3QobilgIGlzIGNhbGxlZCkuIEJlY2F1c2UgdGhlIGBzZWxlY3QobilgXG4gKiBpbnN0cnVjdGlvbiBpcyBub3QgZnVsbHkgaW1wbGVtZW50ZWQgeWV0IChpdCBkb2Vzbid0IGFjdHVhbGx5IGV4ZWN1dGVcbiAqIGhvc3QgYmluZGluZyBpbnN0cnVjdGlvbiBjb2RlIGF0IHRoZSByaWdodCB0aW1lKSwgdGhpcyBtZWFucyB0aGF0IGFcbiAqIHN0eWxpbmcgYXBwbHkgZnVuY3Rpb24gaXMgc3RpbGwgbmVlZGVkLlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gaXMgYSBtaXJyb3IgaW1wbGVtZW50YXRpb24gb2YgdGhlIGBzdHlsaW5nQXBwbHkoKWBcbiAqIGluc3RydWN0aW9uIChmb3VuZCBpbiBgaW5zdHJ1Y3Rpb25zL3N0eWxpbmcudHNgKS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHN0eWxpbmdBcHBseSgpIHtcbiAgY29uc3QgaW5kZXggPSBnZXRTZWxlY3RlZEluZGV4KCk7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgdE5vZGUgPSBnZXRUTm9kZShpbmRleCwgbFZpZXcpO1xuICBjb25zdCByZW5kZXJlciA9IGdldFJlbmRlcmVyKHROb2RlLCBsVmlldyk7XG4gIGNvbnN0IG5hdGl2ZSA9IGdldE5hdGl2ZUZyb21MVmlldyhpbmRleCwgbFZpZXcpO1xuICBjb25zdCBkaXJlY3RpdmVJbmRleCA9IGdldEFjdGl2ZURpcmVjdGl2ZVN0eWxpbmdJbmRleCgpO1xuICBhcHBseUNsYXNzZXMocmVuZGVyZXIsIGxWaWV3LCBnZXRDbGFzc2VzQ29udGV4dCh0Tm9kZSksIG5hdGl2ZSwgZGlyZWN0aXZlSW5kZXgpO1xuICBhcHBseVN0eWxlcyhyZW5kZXJlciwgbFZpZXcsIGdldFN0eWxlc0NvbnRleHQodE5vZGUpLCBuYXRpdmUsIGRpcmVjdGl2ZUluZGV4KTtcbn1cblxuZnVuY3Rpb24gZ2V0U3R5bGVzQ29udGV4dCh0Tm9kZTogVE5vZGUpOiBUU3R5bGluZ0NvbnRleHQge1xuICByZXR1cm4gZ2V0Q29udGV4dCh0Tm9kZSwgZmFsc2UpO1xufVxuXG5mdW5jdGlvbiBnZXRDbGFzc2VzQ29udGV4dCh0Tm9kZTogVE5vZGUpOiBUU3R5bGluZ0NvbnRleHQge1xuICByZXR1cm4gZ2V0Q29udGV4dCh0Tm9kZSwgdHJ1ZSk7XG59XG5cbi8qKlxuICogUmV0dXJucy9pbnN0YW50aWF0ZXMgYSBzdHlsaW5nIGNvbnRleHQgZnJvbS90byBhIGB0Tm9kZWAgaW5zdGFuY2UuXG4gKi9cbmZ1bmN0aW9uIGdldENvbnRleHQodE5vZGU6IFROb2RlLCBpc0NsYXNzQmFzZWQ6IGJvb2xlYW4pIHtcbiAgbGV0IGNvbnRleHQgPSBpc0NsYXNzQmFzZWQgPyB0Tm9kZS5uZXdDbGFzc2VzIDogdE5vZGUubmV3U3R5bGVzO1xuICBpZiAoIWNvbnRleHQpIHtcbiAgICBjb250ZXh0ID0gYWxsb2NTdHlsaW5nQ29udGV4dCgpO1xuICAgIGlmIChuZ0Rldk1vZGUpIHtcbiAgICAgIGF0dGFjaFN0eWxpbmdEZWJ1Z09iamVjdChjb250ZXh0KTtcbiAgICB9XG4gICAgaWYgKGlzQ2xhc3NCYXNlZCkge1xuICAgICAgdE5vZGUubmV3Q2xhc3NlcyA9IGNvbnRleHQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIHROb2RlLm5ld1N0eWxlcyA9IGNvbnRleHQ7XG4gICAgfVxuICB9XG4gIHJldHVybiBjb250ZXh0O1xufVxuXG4vKipcbiAqIFRlbXBvcmFyeSBmdW5jdGlvbiB0byBicmlkZ2Ugc3R5bGluZyBmdW5jdGlvbmFsaXR5IGJldHdlZW4gdGhpcyBuZXdcbiAqIHJlZmFjdG9yICh3aGljaCBpcyBoZXJlIGluc2lkZSBvZiBgc3R5bGluZ19uZXh0L2ApIGFuZCB0aGUgb2xkXG4gKiBpbXBsZW1lbnRhdGlvbiAod2hpY2ggbGl2ZXMgaW5zaWRlIG9mIGBzdHlsaW5nL2ApLlxuICpcbiAqIFRoZSBwdXJwb3NlIG9mIHRoaXMgZnVuY3Rpb24gaXMgdG8gdHJhdmVyc2UgdGhyb3VnaCB0aGUgTFZpZXcgZGF0YVxuICogZm9yIGEgc3BlY2lmaWMgZWxlbWVudCBpbmRleCBhbmQgcmV0dXJuIHRoZSBuYXRpdmUgbm9kZS4gQmVjYXVzZSB0aGVcbiAqIGN1cnJlbnQgaW1wbGVtZW50YXRpb24gcmVsaWVzIG9uIHRoZXJlIGJlaW5nIGEgc3R5bGluZyBjb250ZXh0IGFycmF5LFxuICogdGhlIGNvZGUgYmVsb3cgd2lsbCBuZWVkIHRvIGxvb3AgdGhyb3VnaCB0aGVzZSBhcnJheSB2YWx1ZXMgdW50aWwgaXRcbiAqIGdldHMgYSBuYXRpdmUgZWxlbWVudCBub2RlLlxuICpcbiAqIE5vdGUgdGhhdCB0aGlzIGNvZGUgaXMgdGVtcG9yYXJ5IGFuZCB3aWxsIGRpc2FwcGVhciBvbmNlIHRoZSBuZXdcbiAqIHN0eWxpbmcgcmVmYWN0b3IgbGFuZHMgaW4gaXRzIGVudGlyZXR5LlxuICovXG5mdW5jdGlvbiBnZXROYXRpdmVGcm9tTFZpZXcoaW5kZXg6IG51bWJlciwgdmlld0RhdGE6IExWaWV3KTogUkVsZW1lbnQge1xuICBsZXQgc3RvcmFnZUluZGV4ID0gaW5kZXggKyBIRUFERVJfT0ZGU0VUO1xuICBsZXQgc2xvdFZhbHVlOiBMQ29udGFpbmVyfExWaWV3fE9sZFN0eWxpbmdDb250ZXh0fFJFbGVtZW50ID0gdmlld0RhdGFbc3RvcmFnZUluZGV4XTtcbiAgbGV0IHdyYXBwZXI6IExDb250YWluZXJ8TFZpZXd8T2xkU3R5bGluZ0NvbnRleHQgPSB2aWV3RGF0YTtcbiAgd2hpbGUgKEFycmF5LmlzQXJyYXkoc2xvdFZhbHVlKSkge1xuICAgIHdyYXBwZXIgPSBzbG90VmFsdWU7XG4gICAgc2xvdFZhbHVlID0gc2xvdFZhbHVlW0hPU1RdIGFzIExWaWV3IHwgT2xkU3R5bGluZ0NvbnRleHQgfCBSRWxlbWVudDtcbiAgfVxuICBpZiAoaXNPbGRTdHlsaW5nQ29udGV4dCh3cmFwcGVyKSkge1xuICAgIHJldHVybiB3cmFwcGVyW09sZFN0eWxpbmdJbmRleC5FbGVtZW50UG9zaXRpb25dIGFzIFJFbGVtZW50O1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBzbG90VmFsdWU7XG4gIH1cbn1cblxuZnVuY3Rpb24gZ2V0UmVuZGVyZXIodE5vZGU6IFROb2RlLCBsVmlldzogTFZpZXcpIHtcbiAgcmV0dXJuIHROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5FbGVtZW50ID8gbFZpZXdbUkVOREVSRVJdIDogbnVsbDtcbn1cblxuLyoqXG4gKiBTZWFyY2hlcyBhbmQgYXNzaWducyBwcm92aWRlZCBhbGwgc3RhdGljIHN0eWxlL2NsYXNzIGVudHJpZXMgKGZvdW5kIGluIHRoZSBgYXR0cnNgIHZhbHVlKVxuICogYW5kIHJlZ2lzdGVycyB0aGVtIGluIHRoZWlyIHJlc3BlY3RpdmUgc3R5bGluZyBjb250ZXh0cy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlZ2lzdGVySW5pdGlhbFN0eWxpbmdJbnRvQ29udGV4dChcbiAgICB0Tm9kZTogVE5vZGUsIGF0dHJzOiBUQXR0cmlidXRlcywgc3RhcnRJbmRleDogbnVtYmVyKSB7XG4gIGxldCBjbGFzc2VzQ29udGV4dCAhOiBUU3R5bGluZ0NvbnRleHQ7XG4gIGxldCBzdHlsZXNDb250ZXh0ICE6IFRTdHlsaW5nQ29udGV4dDtcbiAgbGV0IG1vZGUgPSAtMTtcbiAgZm9yIChsZXQgaSA9IHN0YXJ0SW5kZXg7IGkgPCBhdHRycy5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IGF0dHIgPSBhdHRyc1tpXTtcbiAgICBpZiAodHlwZW9mIGF0dHIgPT0gJ251bWJlcicpIHtcbiAgICAgIG1vZGUgPSBhdHRyO1xuICAgIH0gZWxzZSBpZiAobW9kZSA9PSBBdHRyaWJ1dGVNYXJrZXIuQ2xhc3Nlcykge1xuICAgICAgY2xhc3Nlc0NvbnRleHQgPSBjbGFzc2VzQ29udGV4dCB8fCBnZXRDbGFzc2VzQ29udGV4dCh0Tm9kZSk7XG4gICAgICByZWdpc3RlckJpbmRpbmcoY2xhc3Nlc0NvbnRleHQsIC0xLCBhdHRyIGFzIHN0cmluZywgdHJ1ZSk7XG4gICAgfSBlbHNlIGlmIChtb2RlID09IEF0dHJpYnV0ZU1hcmtlci5TdHlsZXMpIHtcbiAgICAgIHN0eWxlc0NvbnRleHQgPSBzdHlsZXNDb250ZXh0IHx8IGdldFN0eWxlc0NvbnRleHQodE5vZGUpO1xuICAgICAgcmVnaXN0ZXJCaW5kaW5nKHN0eWxlc0NvbnRleHQsIC0xLCBhdHRyIGFzIHN0cmluZywgYXR0cnNbKytpXSBhcyBzdHJpbmcpO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIE1pcnJvciBpbXBsZW1lbnRhdGlvbiBvZiB0aGUgc2FtZSBmdW5jdGlvbiBmb3VuZCBpbiBgaW5zdHJ1Y3Rpb25zL3N0eWxpbmcudHNgLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0QWN0aXZlRGlyZWN0aXZlU3R5bGluZ0luZGV4KCk6IG51bWJlciB7XG4gIC8vIHdoZW5ldmVyIGEgZGlyZWN0aXZlJ3MgaG9zdEJpbmRpbmdzIGZ1bmN0aW9uIGlzIGNhbGxlZCBhIHVuaXF1ZUlkIHZhbHVlXG4gIC8vIGlzIGFzc2lnbmVkLiBOb3JtYWxseSB0aGlzIGlzIGVub3VnaCB0byBoZWxwIGRpc3Rpbmd1aXNoIG9uZSBkaXJlY3RpdmVcbiAgLy8gZnJvbSBhbm90aGVyIGZvciB0aGUgc3R5bGluZyBjb250ZXh0LCBidXQgdGhlcmUgYXJlIHNpdHVhdGlvbnMgd2hlcmUgYVxuICAvLyBzdWItY2xhc3MgZGlyZWN0aXZlIGNvdWxkIGluaGVyaXQgYW5kIGFzc2lnbiBzdHlsaW5nIGluIGNvbmNlcnQgd2l0aCBhXG4gIC8vIHBhcmVudCBkaXJlY3RpdmUuIFRvIGhlbHAgdGhlIHN0eWxpbmcgY29kZSBkaXN0aW5ndWlzaCBiZXR3ZWVuIGEgcGFyZW50XG4gIC8vIHN1Yi1jbGFzc2VkIGRpcmVjdGl2ZSB0aGUgaW5oZXJpdGFuY2UgZGVwdGggaXMgdGFrZW4gaW50byBhY2NvdW50IGFzIHdlbGwuXG4gIHJldHVybiBnZXRBY3RpdmVEaXJlY3RpdmVJZCgpICsgZ2V0QWN0aXZlRGlyZWN0aXZlU3VwZXJDbGFzc0RlcHRoKCk7XG59XG5cbi8qKlxuICogVGVtcG9yYXJ5IGZ1bmN0aW9uIHRoYXQgd2lsbCB1cGRhdGUgdGhlIG1heCBkaXJlY3RpdmUgaW5kZXggdmFsdWUgaW5cbiAqIGJvdGggdGhlIGNsYXNzZXMgYW5kIHN0eWxlcyBjb250ZXh0cyBwcmVzZW50IG9uIHRoZSBwcm92aWRlZCBgdE5vZGVgLlxuICpcbiAqIFRoaXMgY29kZSBpcyBvbmx5IHVzZWQgYmVjYXVzZSB0aGUgYHNlbGVjdChuKWAgY29kZSBmdW5jdGlvbmFsaXR5IGlzIG5vdFxuICogeWV0IDEwMCUgZnVuY3Rpb25hbC4gVGhlIGBzZWxlY3QobilgIGluc3RydWN0aW9uIGNhbm5vdCB5ZXQgZXZhbHVhdGUgaG9zdFxuICogYmluZGluZ3MgZnVuY3Rpb24gY29kZSBpbiBzeW5jIHdpdGggdGhlIGFzc29jaWF0ZWQgdGVtcGxhdGUgZnVuY3Rpb24gY29kZS5cbiAqIEZvciB0aGlzIHJlYXNvbiB0aGUgc3R5bGluZyBhbGdvcml0aG0gbmVlZHMgdG8gdHJhY2sgdGhlIGxhc3QgZGlyZWN0aXZlIGluZGV4XG4gKiB2YWx1ZSBzbyB0aGF0IGl0IGtub3dzIGV4YWN0bHkgd2hlbiB0byByZW5kZXIgc3R5bGluZyB0byB0aGUgZWxlbWVudCBzaW5jZVxuICogYHN0eWxpbmdBcHBseSgpYCBpcyBjYWxsZWQgbXVsdGlwbGUgdGltZXMgcGVyIENEIChgc3R5bGluZ0FwcGx5YCB3aWxsIGJlXG4gKiByZW1vdmVkIG9uY2UgYHNlbGVjdChuKWAgaXMgZml4ZWQpLlxuICovXG5mdW5jdGlvbiB1cGRhdGVMYXN0RGlyZWN0aXZlSW5kZXgodE5vZGU6IFROb2RlLCBkaXJlY3RpdmVJbmRleDogbnVtYmVyKSB7XG4gIHVwZGF0ZUNvbnRleHREaXJlY3RpdmVJbmRleChnZXRDbGFzc2VzQ29udGV4dCh0Tm9kZSksIGRpcmVjdGl2ZUluZGV4KTtcbiAgdXBkYXRlQ29udGV4dERpcmVjdGl2ZUluZGV4KGdldFN0eWxlc0NvbnRleHQodE5vZGUpLCBkaXJlY3RpdmVJbmRleCk7XG59XG4iXX0=