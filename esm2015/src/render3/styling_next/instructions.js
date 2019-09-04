/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
import { setInputsForProperty } from '../instructions/shared';
import { BINDING_INDEX, RENDERER, TVIEW } from '../interfaces/view';
import { getActiveDirectiveId, getActiveDirectiveSuperClassDepth, getActiveDirectiveSuperClassHeight, getCurrentStyleSanitizer, getLView, getPreviousOrParentTNode, getSelectedIndex, setCurrentStyleSanitizer } from '../state';
import { NO_CHANGE } from '../tokens';
import { renderStringify } from '../util/misc_utils';
import { getNativeByTNode, getTNode } from '../util/view_utils';
import { flushStyling, updateClassBinding, updateStyleBinding } from './bindings';
import { activateStylingMapFeature, addItemToStylingMap, normalizeIntoStylingMap, stylingMapToString } from './map_based_bindings';
import { attachStylingDebugObject } from './styling_debug';
import { allocTStylingContext, concatString, forceClassesAsString, forceStylesAsString, getInitialStylingValue, getStylingMapArray, hasClassInput, hasStyleInput, hasValueChanged, isContextLocked, isStylingContext, updateLastDirectiveIndex as _updateLastDirectiveIndex } from './util';
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
 *
 * \@codeGenApi
 * @return {?}
 */
export function ɵɵstyling() {
    /** @type {?} */
    const tView = getLView()[TVIEW];
    if (tView.firstTemplatePass) {
        updateLastDirectiveIndex(getPreviousOrParentTNode(), getActiveDirectiveStylingIndex());
    }
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
export function ɵɵstyleSanitizer(sanitizer) {
    setCurrentStyleSanitizer(sanitizer);
}
/**
 * Update a style binding on an element with the provided value.
 *
 * If the style value is falsy then it will be removed from the element
 * (or assigned a different value depending if there are any styles placed
 * on the element with `styleMap` or any static styles that are
 * present from when the element was created with `styling`).
 *
 * Note that the styling element is updated as part of `stylingApply`.
 *
 * \@codeGenApi
 * @param {?} prop A valid CSS property.
 * @param {?} value New value to write (`null` or an empty string to remove).
 * @param {?=} suffix Optional suffix. Used with scalar values to add unit such as `px`.
 *        Note that when a suffix is provided then the underlying sanitizer will
 *        be ignored.
 *
 * Note that this will apply the provided style value to the host element if this function is called
 * within a host binding.
 *
 * @return {?}
 */
export function ɵɵstyleProp(prop, value, suffix) {
    stylePropInternal(getSelectedIndex(), prop, value, suffix);
}
/**
 * @param {?} elementIndex
 * @param {?} prop
 * @param {?} value
 * @param {?=} suffix
 * @return {?}
 */
export function stylePropInternal(elementIndex, prop, value, suffix) {
    /** @type {?} */
    const lView = getLView();
    // if a value is interpolated then it may render a `NO_CHANGE` value.
    // in this case we do not need to do anything, but the binding index
    // still needs to be incremented because all styling binding values
    // are stored inside of the lView.
    /** @type {?} */
    const bindingIndex = lView[BINDING_INDEX]++;
    /** @type {?} */
    const updated = _stylingProp(elementIndex, bindingIndex, prop, resolveStylePropValue(value, suffix), false, deferStylingUpdate());
    if (ngDevMode) {
        ngDevMode.styleProp++;
        if (updated) {
            ngDevMode.stylePropCacheMiss++;
        }
    }
}
/**
 * Update a class binding on an element with the provided value.
 *
 * This instruction is meant to handle the `[class.foo]="exp"` case and,
 * therefore, the class binding itself must already be allocated using
 * `styling` within the creation block.
 *
 * \@codeGenApi
 * @param {?} className
 * @param {?} value A true/false value which will turn the class on or off.
 *
 * Note that this will apply the provided class value to the host element if this function
 * is called within a host binding.
 *
 * @return {?}
 */
export function ɵɵclassProp(className, value) {
    /** @type {?} */
    const lView = getLView();
    // if a value is interpolated then it may render a `NO_CHANGE` value.
    // in this case we do not need to do anything, but the binding index
    // still needs to be incremented because all styling binding values
    // are stored inside of the lView.
    /** @type {?} */
    const bindingIndex = lView[BINDING_INDEX]++;
    /** @type {?} */
    const updated = _stylingProp(getSelectedIndex(), bindingIndex, className, value, true, deferStylingUpdate());
    if (ngDevMode) {
        ngDevMode.classProp++;
        if (updated) {
            ngDevMode.classPropCacheMiss++;
        }
    }
}
/**
 * Shared function used to update a prop-based styling binding for an element.
 * @param {?} elementIndex
 * @param {?} bindingIndex
 * @param {?} prop
 * @param {?} value
 * @param {?} isClassBased
 * @param {?} defer
 * @return {?}
 */
function _stylingProp(elementIndex, bindingIndex, prop, value, isClassBased, defer) {
    /** @type {?} */
    const lView = getLView();
    /** @type {?} */
    const tNode = getTNode(elementIndex, lView);
    /** @type {?} */
    const native = (/** @type {?} */ (getNativeByTNode(tNode, lView)));
    /** @type {?} */
    let valueHasChanged = false;
    if (isClassBased) {
        valueHasChanged = updateClassBinding(getClassesContext(tNode), lView, native, prop, bindingIndex, (/** @type {?} */ (value)), defer, false);
    }
    else {
        /** @type {?} */
        const sanitizer = getCurrentStyleSanitizer();
        valueHasChanged = updateStyleBinding(getStylesContext(tNode), lView, native, prop, bindingIndex, (/** @type {?} */ (value)), sanitizer, defer, false);
    }
    return valueHasChanged;
}
/**
 * Update style bindings using an object literal on an element.
 *
 * This instruction is meant to apply styling via the `[style]="exp"` template bindings.
 * When styles are applied to the element they will then be updated with respect to
 * any styles/classes set via `styleProp`. If any styles are set to falsy
 * then they will be removed from the element.
 *
 * Note that the styling instruction will not be applied until `stylingApply` is called.
 *
 * \@codeGenApi
 * @param {?} styles A key/value style map of the styles that will be applied to the given element.
 *        Any missing styles (that have already been applied to the element beforehand) will be
 *        removed (unset) from the element's styling.
 *
 * Note that this will apply the provided styleMap value to the host element if this function
 * is called within a host binding.
 *
 * @return {?}
 */
export function ɵɵstyleMap(styles) {
    /** @type {?} */
    const index = getSelectedIndex();
    /** @type {?} */
    const lView = getLView();
    /** @type {?} */
    const tNode = getTNode(index, lView);
    /** @type {?} */
    const context = getStylesContext(tNode);
    /** @type {?} */
    const directiveIndex = getActiveDirectiveStylingIndex();
    // if a value is interpolated then it may render a `NO_CHANGE` value.
    // in this case we do not need to do anything, but the binding index
    // still needs to be incremented because all styling binding values
    // are stored inside of the lView.
    /** @type {?} */
    const bindingIndex = lView[BINDING_INDEX]++;
    // inputs are only evaluated from a template binding into a directive, therefore,
    // there should not be a situation where a directive host bindings function
    // evaluates the inputs (this should only happen in the template function)
    if (!directiveIndex && hasStyleInput(tNode) && styles !== NO_CHANGE) {
        updateDirectiveInputValue(context, lView, tNode, bindingIndex, styles, false);
        styles = NO_CHANGE;
    }
    /** @type {?} */
    const updated = _stylingMap(index, context, bindingIndex, styles, false, deferStylingUpdate());
    if (ngDevMode) {
        ngDevMode.styleMap++;
        if (updated) {
            ngDevMode.styleMapCacheMiss++;
        }
    }
}
/**
 * Update class bindings using an object literal or class-string on an element.
 *
 * This instruction is meant to apply styling via the `[class]="exp"` template bindings.
 * When classes are applied to the element they will then be updated with
 * respect to any styles/classes set via `classProp`. If any
 * classes are set to falsy then they will be removed from the element.
 *
 * Note that the styling instruction will not be applied until `stylingApply` is called.
 * Note that this will the provided classMap value to the host element if this function is called
 * within a host binding.
 *
 * \@codeGenApi
 * @param {?} classes A key/value map or string of CSS classes that will be added to the
 *        given element. Any missing classes (that have already been applied to the element
 *        beforehand) will be removed (unset) from the element's list of CSS classes.
 *
 * @return {?}
 */
export function ɵɵclassMap(classes) {
    classMapInternal(getSelectedIndex(), classes);
}
/**
 * @param {?} elementIndex
 * @param {?} classes
 * @return {?}
 */
export function classMapInternal(elementIndex, classes) {
    /** @type {?} */
    const lView = getLView();
    /** @type {?} */
    const tNode = getTNode(elementIndex, lView);
    /** @type {?} */
    const context = getClassesContext(tNode);
    /** @type {?} */
    const directiveIndex = getActiveDirectiveStylingIndex();
    // if a value is interpolated then it may render a `NO_CHANGE` value.
    // in this case we do not need to do anything, but the binding index
    // still needs to be incremented because all styling binding values
    // are stored inside of the lView.
    /** @type {?} */
    const bindingIndex = lView[BINDING_INDEX]++;
    // inputs are only evaluated from a template binding into a directive, therefore,
    // there should not be a situation where a directive host bindings function
    // evaluates the inputs (this should only happen in the template function)
    if (!directiveIndex && hasClassInput(tNode) && classes !== NO_CHANGE) {
        updateDirectiveInputValue(context, lView, tNode, bindingIndex, classes, true);
        classes = NO_CHANGE;
    }
    /** @type {?} */
    const updated = _stylingMap(elementIndex, context, bindingIndex, classes, true, deferStylingUpdate());
    if (ngDevMode) {
        ngDevMode.classMap++;
        if (updated) {
            ngDevMode.classMapCacheMiss++;
        }
    }
}
/**
 * Shared function used to update a map-based styling binding for an element.
 *
 * When this function is called it will activate support for `[style]` and
 * `[class]` bindings in Angular.
 * @param {?} elementIndex
 * @param {?} context
 * @param {?} bindingIndex
 * @param {?} value
 * @param {?} isClassBased
 * @param {?} defer
 * @return {?}
 */
function _stylingMap(elementIndex, context, bindingIndex, value, isClassBased, defer) {
    activateStylingMapFeature();
    /** @type {?} */
    const lView = getLView();
    /** @type {?} */
    const tNode = getTNode(elementIndex, lView);
    /** @type {?} */
    const native = (/** @type {?} */ (getNativeByTNode(tNode, lView)));
    /** @type {?} */
    const oldValue = lView[bindingIndex];
    /** @type {?} */
    const valueHasChanged = hasValueChanged(oldValue, value);
    /** @type {?} */
    const stylingMapArr = value === NO_CHANGE ? NO_CHANGE : normalizeIntoStylingMap(oldValue, value, !isClassBased);
    if (isClassBased) {
        updateClassBinding(context, lView, native, null, bindingIndex, stylingMapArr, defer, valueHasChanged);
    }
    else {
        /** @type {?} */
        const sanitizer = getCurrentStyleSanitizer();
        updateStyleBinding(context, lView, native, null, bindingIndex, stylingMapArr, sanitizer, defer, valueHasChanged);
    }
    return valueHasChanged;
}
/**
 * Writes a value to a directive's `style` or `class` input binding (if it has changed).
 *
 * If a directive has a `\@Input` binding that is set on `style` or `class` then that value
 * will take priority over the underlying style/class styling bindings. This value will
 * be updated for the binding each time during change detection.
 *
 * When this occurs this function will attempt to write the value to the input binding
 * depending on the following situations:
 *
 * - If `oldValue !== newValue`
 * - If `newValue` is `null` (but this is skipped if it is during the first update pass--
 *    which is when the context is not locked yet)
 * @param {?} context
 * @param {?} lView
 * @param {?} tNode
 * @param {?} bindingIndex
 * @param {?} newValue
 * @param {?} isClassBased
 * @return {?}
 */
function updateDirectiveInputValue(context, lView, tNode, bindingIndex, newValue, isClassBased) {
    /** @type {?} */
    const oldValue = lView[bindingIndex];
    if (oldValue !== newValue) {
        // even if the value has changed we may not want to emit it to the
        // directive input(s) in the event that it is falsy during the
        // first update pass.
        if (newValue || isContextLocked(context)) {
            /** @type {?} */
            const inputs = (/** @type {?} */ ((/** @type {?} */ (tNode.inputs))[isClassBased ? 'class' : 'style']));
            /** @type {?} */
            const initialValue = getInitialStylingValue(context);
            /** @type {?} */
            const value = normalizeStylingDirectiveInputValue(initialValue, newValue, isClassBased);
            setInputsForProperty(lView, inputs, value);
        }
        lView[bindingIndex] = newValue;
    }
}
/**
 * Returns the appropriate directive input value for `style` or `class`.
 *
 * Earlier versions of Angular expect a binding value to be passed into directive code
 * exactly as it is unless there is a static value present (in which case both values
 * will be stringified and concatenated).
 * @param {?} initialValue
 * @param {?} bindingValue
 * @param {?} isClassBased
 * @return {?}
 */
function normalizeStylingDirectiveInputValue(initialValue, bindingValue, isClassBased) {
    /** @type {?} */
    let value = bindingValue;
    // we only concat values if there is an initial value, otherwise we return the value as is.
    // Note that this is to satisfy backwards-compatibility in Angular.
    if (initialValue.length > 0) {
        if (isClassBased) {
            value = concatString(initialValue, forceClassesAsString(bindingValue));
        }
        else {
            value = concatString(initialValue, forceStylesAsString((/** @type {?} */ (bindingValue))), ';');
        }
    }
    return value;
}
/**
 * Flushes all styling code to the element.
 *
 * This function is designed to be called from the template and hostBindings
 * functions and may be called multiple times depending whether multiple
 * sources of styling exist. If called multiple times, only the last call
 * to `stlyingApply()` will render styling to the element.
 *
 * \@codeGenApi
 * @return {?}
 */
export function ɵɵstylingApply() {
    /** @type {?} */
    const elementIndex = getSelectedIndex();
    /** @type {?} */
    const lView = getLView();
    /** @type {?} */
    const tNode = getTNode(elementIndex, lView);
    /** @type {?} */
    const renderer = getRenderer(tNode, lView);
    /** @type {?} */
    const native = (/** @type {?} */ (getNativeByTNode(tNode, lView)));
    /** @type {?} */
    const directiveIndex = getActiveDirectiveStylingIndex();
    /** @type {?} */
    const sanitizer = getCurrentStyleSanitizer();
    flushStyling(renderer, lView, getClassesContext(tNode), getStylesContext(tNode), native, directiveIndex, sanitizer);
    setCurrentStyleSanitizer(null);
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
export function registerInitialStylingOnTNode(tNode, attrs, startIndex) {
    /** @type {?} */
    let hasAdditionalInitialStyling = false;
    /** @type {?} */
    let styles = getStylingMapArray(tNode.styles);
    /** @type {?} */
    let classes = getStylingMapArray(tNode.classes);
    /** @type {?} */
    let mode = -1;
    for (let i = startIndex; i < attrs.length; i++) {
        /** @type {?} */
        const attr = (/** @type {?} */ (attrs[i]));
        if (typeof attr == 'number') {
            mode = attr;
        }
        else if (mode == 1 /* Classes */) {
            classes = classes || [''];
            addItemToStylingMap(classes, attr, true);
            hasAdditionalInitialStyling = true;
        }
        else if (mode == 2 /* Styles */) {
            /** @type {?} */
            const value = (/** @type {?} */ (attrs[++i]));
            styles = styles || [''];
            addItemToStylingMap(styles, attr, value);
            hasAdditionalInitialStyling = true;
        }
    }
    if (classes && classes.length > 1 /* ValuesStartPosition */) {
        if (!tNode.classes) {
            tNode.classes = classes;
        }
        updateRawValueOnContext(tNode.classes, stylingMapToString(classes, true));
    }
    if (styles && styles.length > 1 /* ValuesStartPosition */) {
        if (!tNode.styles) {
            tNode.styles = styles;
        }
        updateRawValueOnContext(tNode.styles, stylingMapToString(styles, false));
    }
    return hasAdditionalInitialStyling;
}
/**
 * @param {?} context
 * @param {?} value
 * @return {?}
 */
function updateRawValueOnContext(context, value) {
    /** @type {?} */
    const stylingMapArr = (/** @type {?} */ (getStylingMapArray(context)));
    stylingMapArr[0 /* RawValuePosition */] = value;
}
/**
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
    _updateLastDirectiveIndex(getClassesContext(tNode), directiveIndex);
    _updateLastDirectiveIndex(getStylesContext(tNode), directiveIndex);
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
    let context = isClassBased ? tNode.classes : tNode.styles;
    if (!isStylingContext(context)) {
        context = allocTStylingContext(context);
        if (ngDevMode) {
            attachStylingDebugObject((/** @type {?} */ (context)));
        }
        if (isClassBased) {
            tNode.classes = context;
        }
        else {
            tNode.styles = context;
        }
    }
    return (/** @type {?} */ (context));
}
/**
 * @param {?} value
 * @param {?} suffix
 * @return {?}
 */
function resolveStylePropValue(value, suffix) {
    if (value === NO_CHANGE)
        return value;
    /** @type {?} */
    let resolvedValue = null;
    if (value !== null) {
        if (suffix) {
            // when a suffix is applied then it will bypass
            // sanitization entirely (b/c a new string is created)
            resolvedValue = renderStringify(value) + suffix;
        }
        else {
            // sanitization happens by dealing with a string value
            // this means that the string value will be passed through
            // into the style rendering later (which is where the value
            // will be sanitized before it is applied)
            resolvedValue = (/** @type {?} */ ((/** @type {?} */ (value))));
        }
    }
    return resolvedValue;
}
/**
 * Whether or not a style/class binding update should be applied later.
 *
 * This function will decide whether a binding should be applied immediately
 * or later (just before the styles/classes are flushed to the element). The
 * reason why this feature exists is because of super/sub directive inheritance.
 * Angular will evaluate host bindings on the super directive first and the sub
 * directive, but the styling bindings on the sub directive are of higher priority
 * than the super directive. For this reason all styling bindings that take place
 * in this circumstance will need to be deferred until later so that they can be
 * applied together and in a different order (the algorithm handles that part).
 * @return {?}
 */
function deferStylingUpdate() {
    return getActiveDirectiveSuperClassHeight() > 0;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5zdHJ1Y3Rpb25zLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9zdHlsaW5nX25leHQvaW5zdHJ1Y3Rpb25zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7QUFTQSxPQUFPLEVBQUMsb0JBQW9CLEVBQUMsTUFBTSx3QkFBd0IsQ0FBQztBQUc1RCxPQUFPLEVBQUMsYUFBYSxFQUFTLFFBQVEsRUFBRSxLQUFLLEVBQUMsTUFBTSxvQkFBb0IsQ0FBQztBQUN6RSxPQUFPLEVBQUMsb0JBQW9CLEVBQUUsaUNBQWlDLEVBQUUsa0NBQWtDLEVBQUUsd0JBQXdCLEVBQUUsUUFBUSxFQUFFLHdCQUF3QixFQUFFLGdCQUFnQixFQUFFLHdCQUF3QixFQUFDLE1BQU0sVUFBVSxDQUFDO0FBQy9OLE9BQU8sRUFBQyxTQUFTLEVBQUMsTUFBTSxXQUFXLENBQUM7QUFDcEMsT0FBTyxFQUFDLGVBQWUsRUFBQyxNQUFNLG9CQUFvQixDQUFDO0FBQ25ELE9BQU8sRUFBQyxnQkFBZ0IsRUFBRSxRQUFRLEVBQUMsTUFBTSxvQkFBb0IsQ0FBQztBQUU5RCxPQUFPLEVBQUMsWUFBWSxFQUFFLGtCQUFrQixFQUFFLGtCQUFrQixFQUFDLE1BQU0sWUFBWSxDQUFDO0FBRWhGLE9BQU8sRUFBQyx5QkFBeUIsRUFBRSxtQkFBbUIsRUFBRSx1QkFBdUIsRUFBRSxrQkFBa0IsRUFBQyxNQUFNLHNCQUFzQixDQUFDO0FBQ2pJLE9BQU8sRUFBQyx3QkFBd0IsRUFBQyxNQUFNLGlCQUFpQixDQUFDO0FBQ3pELE9BQU8sRUFBQyxvQkFBb0IsRUFBRSxZQUFZLEVBQUUsb0JBQW9CLEVBQUUsbUJBQW1CLEVBQUUsc0JBQXNCLEVBQUUsa0JBQWtCLEVBQUUsYUFBYSxFQUFFLGFBQWEsRUFBRSxlQUFlLEVBQUUsZUFBZSxFQUFFLGdCQUFnQixFQUFFLHdCQUF3QixJQUFJLHlCQUF5QixFQUFDLE1B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QUFTO1FBQUUsT0FBTyxLQUFLLENBQUM7O1FBRWxDLGFBQWEsR0FBZ0IsSUFBSTtJQUNyQyxJQUFJLEtBQUssS0FBSyxJQUFJLEVBQUU7UUFDbEIsSUFBSSxNQUFNLEVBQUU7WUFDViwrQ0FBK0M7WUFDL0Msc0RBQXNEO1lBQ3RELGFBQWEsR0FBRyxlQUFlLENBQUMsS0FBSyxDQUFDLEdBQUcsTUFBTSxDQUFDO1NBQ2pEO2FBQU07WUFDTCxzREFBc0Q7WUFDdEQsMERBQTBEO1lBQzFELDJEQUEyRDtZQUMzRCwwQ0FBMEM7WUFDMUMsYUFBYSxHQUFHLG1CQUFBLG1CQUFBLEtBQUssRUFBTyxFQUFVLENBQUM7U0FDeEM7S0FDRjtJQUNELE9BQU8sYUFBYSxDQUFDO0FBQ3ZCLENBQUM7Ozs7Ozs7Ozs7Ozs7O0FBY0QsU0FBUyxrQkFBa0I7SUFDekIsT0FBTyxrQ0FBa0MsRUFBRSxHQUFHLENBQUMsQ0FBQztBQUNsRCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4qIEBsaWNlbnNlXG4qIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuKlxuKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4qL1xuaW1wb3J0IHtTYWZlVmFsdWV9IGZyb20gJy4uLy4uL3Nhbml0aXphdGlvbi9ieXBhc3MnO1xuaW1wb3J0IHtTdHlsZVNhbml0aXplRm59IGZyb20gJy4uLy4uL3Nhbml0aXphdGlvbi9zdHlsZV9zYW5pdGl6ZXInO1xuaW1wb3J0IHtzZXRJbnB1dHNGb3JQcm9wZXJ0eX0gZnJvbSAnLi4vaW5zdHJ1Y3Rpb25zL3NoYXJlZCc7XG5pbXBvcnQge0F0dHJpYnV0ZU1hcmtlciwgVEF0dHJpYnV0ZXMsIFROb2RlLCBUTm9kZVR5cGV9IGZyb20gJy4uL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge1JFbGVtZW50fSBmcm9tICcuLi9pbnRlcmZhY2VzL3JlbmRlcmVyJztcbmltcG9ydCB7QklORElOR19JTkRFWCwgTFZpZXcsIFJFTkRFUkVSLCBUVklFV30gZnJvbSAnLi4vaW50ZXJmYWNlcy92aWV3JztcbmltcG9ydCB7Z2V0QWN0aXZlRGlyZWN0aXZlSWQsIGdldEFjdGl2ZURpcmVjdGl2ZVN1cGVyQ2xhc3NEZXB0aCwgZ2V0QWN0aXZlRGlyZWN0aXZlU3VwZXJDbGFzc0hlaWdodCwgZ2V0Q3VycmVudFN0eWxlU2FuaXRpemVyLCBnZXRMVmlldywgZ2V0UHJldmlvdXNPclBhcmVudFROb2RlLCBnZXRTZWxlY3RlZEluZGV4LCBzZXRDdXJyZW50U3R5bGVTYW5pdGl6ZXJ9IGZyb20gJy4uL3N0YXRlJztcbmltcG9ydCB7Tk9fQ0hBTkdFfSBmcm9tICcuLi90b2tlbnMnO1xuaW1wb3J0IHtyZW5kZXJTdHJpbmdpZnl9IGZyb20gJy4uL3V0aWwvbWlzY191dGlscyc7XG5pbXBvcnQge2dldE5hdGl2ZUJ5VE5vZGUsIGdldFROb2RlfSBmcm9tICcuLi91dGlsL3ZpZXdfdXRpbHMnO1xuXG5pbXBvcnQge2ZsdXNoU3R5bGluZywgdXBkYXRlQ2xhc3NCaW5kaW5nLCB1cGRhdGVTdHlsZUJpbmRpbmd9IGZyb20gJy4vYmluZGluZ3MnO1xuaW1wb3J0IHtTdHlsaW5nTWFwQXJyYXksIFN0eWxpbmdNYXBBcnJheUluZGV4LCBUU3R5bGluZ0NvbnRleHR9IGZyb20gJy4vaW50ZXJmYWNlcyc7XG5pbXBvcnQge2FjdGl2YXRlU3R5bGluZ01hcEZlYXR1cmUsIGFkZEl0ZW1Ub1N0eWxpbmdNYXAsIG5vcm1hbGl6ZUludG9TdHlsaW5nTWFwLCBzdHlsaW5nTWFwVG9TdHJpbmd9IGZyb20gJy4vbWFwX2Jhc2VkX2JpbmRpbmdzJztcbmltcG9ydCB7YXR0YWNoU3R5bGluZ0RlYnVnT2JqZWN0fSBmcm9tICcuL3N0eWxpbmdfZGVidWcnO1xuaW1wb3J0IHthbGxvY1RTdHlsaW5nQ29udGV4dCwgY29uY2F0U3RyaW5nLCBmb3JjZUNsYXNzZXNBc1N0cmluZywgZm9yY2VTdHlsZXNBc1N0cmluZywgZ2V0SW5pdGlhbFN0eWxpbmdWYWx1ZSwgZ2V0U3R5bGluZ01hcEFycmF5LCBoYXNDbGFzc0lucHV0LCBoYXNTdHlsZUlucHV0LCBoYXNWYWx1ZUNoYW5nZWQsIGlzQ29udGV4dExvY2tlZCwgaXNTdHlsaW5nQ29udGV4dCwgdXBkYXRlTGFzdERpcmVjdGl2ZUluZGV4IGFzIF91cGRhdGVMYXN0RGlyZWN0aXZlSW5kZXh9IGZyb20gJy4vdXRpbCc7XG5cblxuXG4vKipcbiAqIC0tLS0tLS0tXG4gKlxuICogVGhpcyBmaWxlIGNvbnRhaW5zIHRoZSBjb3JlIGxvZ2ljIGZvciBob3cgc3R5bGluZyBpbnN0cnVjdGlvbnMgYXJlIHByb2Nlc3NlZCBpbiBBbmd1bGFyLlxuICpcbiAqIFRvIGxlYXJuIG1vcmUgYWJvdXQgdGhlIGFsZ29yaXRobSBzZWUgYFRTdHlsaW5nQ29udGV4dGAuXG4gKlxuICogLS0tLS0tLS1cbiAqL1xuXG4vKipcbiAqIFRlbXBvcmFyeSBmdW5jdGlvbiB0byBicmlkZ2Ugc3R5bGluZyBmdW5jdGlvbmFsaXR5IGJldHdlZW4gdGhpcyBuZXdcbiAqIHJlZmFjdG9yICh3aGljaCBpcyBoZXJlIGluc2lkZSBvZiBgc3R5bGluZ19uZXh0L2ApIGFuZCB0aGUgb2xkXG4gKiBpbXBsZW1lbnRhdGlvbiAod2hpY2ggbGl2ZXMgaW5zaWRlIG9mIGBzdHlsaW5nL2ApLlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gaXMgZXhlY3V0ZWQgZHVyaW5nIHRoZSBjcmVhdGlvbiBibG9jayBvZiBhbiBlbGVtZW50LlxuICogQmVjYXVzZSB0aGUgZXhpc3Rpbmcgc3R5bGluZyBpbXBsZW1lbnRhdGlvbiBpc3N1ZXMgYSBjYWxsIHRvIHRoZVxuICogYHN0eWxpbmcoKWAgaW5zdHJ1Y3Rpb24sIHRoaXMgaW5zdHJ1Y3Rpb24gd2lsbCBhbHNvIGdldCBydW4uIFRoZVxuICogY2VudHJhbCBpZGVhIGhlcmUgaXMgdGhhdCB0aGUgZGlyZWN0aXZlIGluZGV4IHZhbHVlcyBhcmUgYm91bmRcbiAqIGludG8gdGhlIGNvbnRleHQuIFRoZSBkaXJlY3RpdmUgaW5kZXggaXMgdGVtcG9yYXJ5IGFuZCBpcyBvbmx5XG4gKiByZXF1aXJlZCB1bnRpbCB0aGUgYHNlbGVjdChuKWAgaW5zdHJ1Y3Rpb24gaXMgZnVsbHkgZnVuY3Rpb25hbC5cbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtXN0eWxpbmcoKSB7XG4gIGNvbnN0IHRWaWV3ID0gZ2V0TFZpZXcoKVtUVklFV107XG4gIGlmICh0Vmlldy5maXJzdFRlbXBsYXRlUGFzcykge1xuICAgIHVwZGF0ZUxhc3REaXJlY3RpdmVJbmRleChnZXRQcmV2aW91c09yUGFyZW50VE5vZGUoKSwgZ2V0QWN0aXZlRGlyZWN0aXZlU3R5bGluZ0luZGV4KCkpO1xuICB9XG59XG5cbi8qKlxuICogU2V0cyB0aGUgY3VycmVudCBzdHlsZSBzYW5pdGl6ZXIgZnVuY3Rpb24gd2hpY2ggd2lsbCB0aGVuIGJlIHVzZWRcbiAqIHdpdGhpbiBhbGwgZm9sbG93LXVwIHByb3AgYW5kIG1hcC1iYXNlZCBzdHlsZSBiaW5kaW5nIGluc3RydWN0aW9uc1xuICogZm9yIHRoZSBnaXZlbiBlbGVtZW50LlxuICpcbiAqIE5vdGUgdGhhdCBvbmNlIHN0eWxpbmcgaGFzIGJlZW4gYXBwbGllZCB0byB0aGUgZWxlbWVudCAoaS5lLiBvbmNlXG4gKiBgc2VsZWN0KG4pYCBpcyBleGVjdXRlZCBvciB0aGUgaG9zdEJpbmRpbmdzL3RlbXBsYXRlIGZ1bmN0aW9uIGV4aXRzKVxuICogdGhlbiB0aGUgYWN0aXZlIGBzYW5pdGl6ZXJGbmAgd2lsbCBiZSBzZXQgdG8gYG51bGxgLiBUaGlzIG1lYW5zIHRoYXRcbiAqIG9uY2Ugc3R5bGluZyBpcyBhcHBsaWVkIHRvIGFub3RoZXIgZWxlbWVudCB0aGVuIGEgYW5vdGhlciBjYWxsIHRvXG4gKiBgc3R5bGVTYW5pdGl6ZXJgIHdpbGwgbmVlZCB0byBiZSBtYWRlLlxuICpcbiAqIEBwYXJhbSBzYW5pdGl6ZXJGbiBUaGUgc2FuaXRpemF0aW9uIGZ1bmN0aW9uIHRoYXQgd2lsbCBiZSB1c2VkIHRvXG4gKiAgICAgICBwcm9jZXNzIHN0eWxlIHByb3AvdmFsdWUgZW50cmllcy5cbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtXN0eWxlU2FuaXRpemVyKHNhbml0aXplcjogU3R5bGVTYW5pdGl6ZUZuIHwgbnVsbCk6IHZvaWQge1xuICBzZXRDdXJyZW50U3R5bGVTYW5pdGl6ZXIoc2FuaXRpemVyKTtcbn1cblxuLyoqXG4gKiBVcGRhdGUgYSBzdHlsZSBiaW5kaW5nIG9uIGFuIGVsZW1lbnQgd2l0aCB0aGUgcHJvdmlkZWQgdmFsdWUuXG4gKlxuICogSWYgdGhlIHN0eWxlIHZhbHVlIGlzIGZhbHN5IHRoZW4gaXQgd2lsbCBiZSByZW1vdmVkIGZyb20gdGhlIGVsZW1lbnRcbiAqIChvciBhc3NpZ25lZCBhIGRpZmZlcmVudCB2YWx1ZSBkZXBlbmRpbmcgaWYgdGhlcmUgYXJlIGFueSBzdHlsZXMgcGxhY2VkXG4gKiBvbiB0aGUgZWxlbWVudCB3aXRoIGBzdHlsZU1hcGAgb3IgYW55IHN0YXRpYyBzdHlsZXMgdGhhdCBhcmVcbiAqIHByZXNlbnQgZnJvbSB3aGVuIHRoZSBlbGVtZW50IHdhcyBjcmVhdGVkIHdpdGggYHN0eWxpbmdgKS5cbiAqXG4gKiBOb3RlIHRoYXQgdGhlIHN0eWxpbmcgZWxlbWVudCBpcyB1cGRhdGVkIGFzIHBhcnQgb2YgYHN0eWxpbmdBcHBseWAuXG4gKlxuICogQHBhcmFtIHByb3AgQSB2YWxpZCBDU1MgcHJvcGVydHkuXG4gKiBAcGFyYW0gdmFsdWUgTmV3IHZhbHVlIHRvIHdyaXRlIChgbnVsbGAgb3IgYW4gZW1wdHkgc3RyaW5nIHRvIHJlbW92ZSkuXG4gKiBAcGFyYW0gc3VmZml4IE9wdGlvbmFsIHN1ZmZpeC4gVXNlZCB3aXRoIHNjYWxhciB2YWx1ZXMgdG8gYWRkIHVuaXQgc3VjaCBhcyBgcHhgLlxuICogICAgICAgIE5vdGUgdGhhdCB3aGVuIGEgc3VmZml4IGlzIHByb3ZpZGVkIHRoZW4gdGhlIHVuZGVybHlpbmcgc2FuaXRpemVyIHdpbGxcbiAqICAgICAgICBiZSBpZ25vcmVkLlxuICpcbiAqIE5vdGUgdGhhdCB0aGlzIHdpbGwgYXBwbHkgdGhlIHByb3ZpZGVkIHN0eWxlIHZhbHVlIHRvIHRoZSBob3N0IGVsZW1lbnQgaWYgdGhpcyBmdW5jdGlvbiBpcyBjYWxsZWRcbiAqIHdpdGhpbiBhIGhvc3QgYmluZGluZy5cbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtXN0eWxlUHJvcChcbiAgICBwcm9wOiBzdHJpbmcsIHZhbHVlOiBzdHJpbmcgfCBudW1iZXIgfCBTYWZlVmFsdWUgfCBudWxsLCBzdWZmaXg/OiBzdHJpbmcgfCBudWxsKTogdm9pZCB7XG4gIHN0eWxlUHJvcEludGVybmFsKGdldFNlbGVjdGVkSW5kZXgoKSwgcHJvcCwgdmFsdWUsIHN1ZmZpeCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzdHlsZVByb3BJbnRlcm5hbChcbiAgICBlbGVtZW50SW5kZXg6IG51bWJlciwgcHJvcDogc3RyaW5nLCB2YWx1ZTogc3RyaW5nIHwgbnVtYmVyIHwgU2FmZVZhbHVlIHwgbnVsbCxcbiAgICBzdWZmaXg/OiBzdHJpbmcgfCBudWxsIHwgdW5kZWZpbmVkKSB7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcblxuICAvLyBpZiBhIHZhbHVlIGlzIGludGVycG9sYXRlZCB0aGVuIGl0IG1heSByZW5kZXIgYSBgTk9fQ0hBTkdFYCB2YWx1ZS5cbiAgLy8gaW4gdGhpcyBjYXNlIHdlIGRvIG5vdCBuZWVkIHRvIGRvIGFueXRoaW5nLCBidXQgdGhlIGJpbmRpbmcgaW5kZXhcbiAgLy8gc3RpbGwgbmVlZHMgdG8gYmUgaW5jcmVtZW50ZWQgYmVjYXVzZSBhbGwgc3R5bGluZyBiaW5kaW5nIHZhbHVlc1xuICAvLyBhcmUgc3RvcmVkIGluc2lkZSBvZiB0aGUgbFZpZXcuXG4gIGNvbnN0IGJpbmRpbmdJbmRleCA9IGxWaWV3W0JJTkRJTkdfSU5ERVhdKys7XG5cbiAgY29uc3QgdXBkYXRlZCA9IF9zdHlsaW5nUHJvcChcbiAgICAgIGVsZW1lbnRJbmRleCwgYmluZGluZ0luZGV4LCBwcm9wLCByZXNvbHZlU3R5bGVQcm9wVmFsdWUodmFsdWUsIHN1ZmZpeCksIGZhbHNlLFxuICAgICAgZGVmZXJTdHlsaW5nVXBkYXRlKCkpO1xuICBpZiAobmdEZXZNb2RlKSB7XG4gICAgbmdEZXZNb2RlLnN0eWxlUHJvcCsrO1xuICAgIGlmICh1cGRhdGVkKSB7XG4gICAgICBuZ0Rldk1vZGUuc3R5bGVQcm9wQ2FjaGVNaXNzKys7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogVXBkYXRlIGEgY2xhc3MgYmluZGluZyBvbiBhbiBlbGVtZW50IHdpdGggdGhlIHByb3ZpZGVkIHZhbHVlLlxuICpcbiAqIFRoaXMgaW5zdHJ1Y3Rpb24gaXMgbWVhbnQgdG8gaGFuZGxlIHRoZSBgW2NsYXNzLmZvb109XCJleHBcImAgY2FzZSBhbmQsXG4gKiB0aGVyZWZvcmUsIHRoZSBjbGFzcyBiaW5kaW5nIGl0c2VsZiBtdXN0IGFscmVhZHkgYmUgYWxsb2NhdGVkIHVzaW5nXG4gKiBgc3R5bGluZ2Agd2l0aGluIHRoZSBjcmVhdGlvbiBibG9jay5cbiAqXG4gKiBAcGFyYW0gcHJvcCBBIHZhbGlkIENTUyBjbGFzcyAob25seSBvbmUpLlxuICogQHBhcmFtIHZhbHVlIEEgdHJ1ZS9mYWxzZSB2YWx1ZSB3aGljaCB3aWxsIHR1cm4gdGhlIGNsYXNzIG9uIG9yIG9mZi5cbiAqXG4gKiBOb3RlIHRoYXQgdGhpcyB3aWxsIGFwcGx5IHRoZSBwcm92aWRlZCBjbGFzcyB2YWx1ZSB0byB0aGUgaG9zdCBlbGVtZW50IGlmIHRoaXMgZnVuY3Rpb25cbiAqIGlzIGNhbGxlZCB3aXRoaW4gYSBob3N0IGJpbmRpbmcuXG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVjbGFzc1Byb3AoY2xhc3NOYW1lOiBzdHJpbmcsIHZhbHVlOiBib29sZWFuIHwgbnVsbCk6IHZvaWQge1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG5cbiAgLy8gaWYgYSB2YWx1ZSBpcyBpbnRlcnBvbGF0ZWQgdGhlbiBpdCBtYXkgcmVuZGVyIGEgYE5PX0NIQU5HRWAgdmFsdWUuXG4gIC8vIGluIHRoaXMgY2FzZSB3ZSBkbyBub3QgbmVlZCB0byBkbyBhbnl0aGluZywgYnV0IHRoZSBiaW5kaW5nIGluZGV4XG4gIC8vIHN0aWxsIG5lZWRzIHRvIGJlIGluY3JlbWVudGVkIGJlY2F1c2UgYWxsIHN0eWxpbmcgYmluZGluZyB2YWx1ZXNcbiAgLy8gYXJlIHN0b3JlZCBpbnNpZGUgb2YgdGhlIGxWaWV3LlxuICBjb25zdCBiaW5kaW5nSW5kZXggPSBsVmlld1tCSU5ESU5HX0lOREVYXSsrO1xuXG4gIGNvbnN0IHVwZGF0ZWQgPVxuICAgICAgX3N0eWxpbmdQcm9wKGdldFNlbGVjdGVkSW5kZXgoKSwgYmluZGluZ0luZGV4LCBjbGFzc05hbWUsIHZhbHVlLCB0cnVlLCBkZWZlclN0eWxpbmdVcGRhdGUoKSk7XG4gIGlmIChuZ0Rldk1vZGUpIHtcbiAgICBuZ0Rldk1vZGUuY2xhc3NQcm9wKys7XG4gICAgaWYgKHVwZGF0ZWQpIHtcbiAgICAgIG5nRGV2TW9kZS5jbGFzc1Byb3BDYWNoZU1pc3MrKztcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBTaGFyZWQgZnVuY3Rpb24gdXNlZCB0byB1cGRhdGUgYSBwcm9wLWJhc2VkIHN0eWxpbmcgYmluZGluZyBmb3IgYW4gZWxlbWVudC5cbiAqL1xuZnVuY3Rpb24gX3N0eWxpbmdQcm9wKFxuICAgIGVsZW1lbnRJbmRleDogbnVtYmVyLCBiaW5kaW5nSW5kZXg6IG51bWJlciwgcHJvcDogc3RyaW5nLFxuICAgIHZhbHVlOiBib29sZWFuIHwgbnVtYmVyIHwgU2FmZVZhbHVlIHwgc3RyaW5nIHwgbnVsbCB8IHVuZGVmaW5lZCB8IE5PX0NIQU5HRSxcbiAgICBpc0NsYXNzQmFzZWQ6IGJvb2xlYW4sIGRlZmVyOiBib29sZWFuKTogYm9vbGVhbiB7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgdE5vZGUgPSBnZXRUTm9kZShlbGVtZW50SW5kZXgsIGxWaWV3KTtcbiAgY29uc3QgbmF0aXZlID0gZ2V0TmF0aXZlQnlUTm9kZSh0Tm9kZSwgbFZpZXcpIGFzIFJFbGVtZW50O1xuXG4gIGxldCB2YWx1ZUhhc0NoYW5nZWQgPSBmYWxzZTtcbiAgaWYgKGlzQ2xhc3NCYXNlZCkge1xuICAgIHZhbHVlSGFzQ2hhbmdlZCA9IHVwZGF0ZUNsYXNzQmluZGluZyhcbiAgICAgICAgZ2V0Q2xhc3Nlc0NvbnRleHQodE5vZGUpLCBsVmlldywgbmF0aXZlLCBwcm9wLCBiaW5kaW5nSW5kZXgsXG4gICAgICAgIHZhbHVlIGFzIHN0cmluZyB8IGJvb2xlYW4gfCBudWxsLCBkZWZlciwgZmFsc2UpO1xuICB9IGVsc2Uge1xuICAgIGNvbnN0IHNhbml0aXplciA9IGdldEN1cnJlbnRTdHlsZVNhbml0aXplcigpO1xuICAgIHZhbHVlSGFzQ2hhbmdlZCA9IHVwZGF0ZVN0eWxlQmluZGluZyhcbiAgICAgICAgZ2V0U3R5bGVzQ29udGV4dCh0Tm9kZSksIGxWaWV3LCBuYXRpdmUsIHByb3AsIGJpbmRpbmdJbmRleCxcbiAgICAgICAgdmFsdWUgYXMgc3RyaW5nIHwgU2FmZVZhbHVlIHwgbnVsbCwgc2FuaXRpemVyLCBkZWZlciwgZmFsc2UpO1xuICB9XG5cbiAgcmV0dXJuIHZhbHVlSGFzQ2hhbmdlZDtcbn1cblxuLyoqXG4gKiBVcGRhdGUgc3R5bGUgYmluZGluZ3MgdXNpbmcgYW4gb2JqZWN0IGxpdGVyYWwgb24gYW4gZWxlbWVudC5cbiAqXG4gKiBUaGlzIGluc3RydWN0aW9uIGlzIG1lYW50IHRvIGFwcGx5IHN0eWxpbmcgdmlhIHRoZSBgW3N0eWxlXT1cImV4cFwiYCB0ZW1wbGF0ZSBiaW5kaW5ncy5cbiAqIFdoZW4gc3R5bGVzIGFyZSBhcHBsaWVkIHRvIHRoZSBlbGVtZW50IHRoZXkgd2lsbCB0aGVuIGJlIHVwZGF0ZWQgd2l0aCByZXNwZWN0IHRvXG4gKiBhbnkgc3R5bGVzL2NsYXNzZXMgc2V0IHZpYSBgc3R5bGVQcm9wYC4gSWYgYW55IHN0eWxlcyBhcmUgc2V0IHRvIGZhbHN5XG4gKiB0aGVuIHRoZXkgd2lsbCBiZSByZW1vdmVkIGZyb20gdGhlIGVsZW1lbnQuXG4gKlxuICogTm90ZSB0aGF0IHRoZSBzdHlsaW5nIGluc3RydWN0aW9uIHdpbGwgbm90IGJlIGFwcGxpZWQgdW50aWwgYHN0eWxpbmdBcHBseWAgaXMgY2FsbGVkLlxuICpcbiAqIEBwYXJhbSBzdHlsZXMgQSBrZXkvdmFsdWUgc3R5bGUgbWFwIG9mIHRoZSBzdHlsZXMgdGhhdCB3aWxsIGJlIGFwcGxpZWQgdG8gdGhlIGdpdmVuIGVsZW1lbnQuXG4gKiAgICAgICAgQW55IG1pc3Npbmcgc3R5bGVzICh0aGF0IGhhdmUgYWxyZWFkeSBiZWVuIGFwcGxpZWQgdG8gdGhlIGVsZW1lbnQgYmVmb3JlaGFuZCkgd2lsbCBiZVxuICogICAgICAgIHJlbW92ZWQgKHVuc2V0KSBmcm9tIHRoZSBlbGVtZW50J3Mgc3R5bGluZy5cbiAqXG4gKiBOb3RlIHRoYXQgdGhpcyB3aWxsIGFwcGx5IHRoZSBwcm92aWRlZCBzdHlsZU1hcCB2YWx1ZSB0byB0aGUgaG9zdCBlbGVtZW50IGlmIHRoaXMgZnVuY3Rpb25cbiAqIGlzIGNhbGxlZCB3aXRoaW4gYSBob3N0IGJpbmRpbmcuXG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVzdHlsZU1hcChzdHlsZXM6IHtbc3R5bGVOYW1lOiBzdHJpbmddOiBhbnl9IHwgTk9fQ0hBTkdFIHwgbnVsbCk6IHZvaWQge1xuICBjb25zdCBpbmRleCA9IGdldFNlbGVjdGVkSW5kZXgoKTtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCB0Tm9kZSA9IGdldFROb2RlKGluZGV4LCBsVmlldyk7XG4gIGNvbnN0IGNvbnRleHQgPSBnZXRTdHlsZXNDb250ZXh0KHROb2RlKTtcbiAgY29uc3QgZGlyZWN0aXZlSW5kZXggPSBnZXRBY3RpdmVEaXJlY3RpdmVTdHlsaW5nSW5kZXgoKTtcblxuICAvLyBpZiBhIHZhbHVlIGlzIGludGVycG9sYXRlZCB0aGVuIGl0IG1heSByZW5kZXIgYSBgTk9fQ0hBTkdFYCB2YWx1ZS5cbiAgLy8gaW4gdGhpcyBjYXNlIHdlIGRvIG5vdCBuZWVkIHRvIGRvIGFueXRoaW5nLCBidXQgdGhlIGJpbmRpbmcgaW5kZXhcbiAgLy8gc3RpbGwgbmVlZHMgdG8gYmUgaW5jcmVtZW50ZWQgYmVjYXVzZSBhbGwgc3R5bGluZyBiaW5kaW5nIHZhbHVlc1xuICAvLyBhcmUgc3RvcmVkIGluc2lkZSBvZiB0aGUgbFZpZXcuXG4gIGNvbnN0IGJpbmRpbmdJbmRleCA9IGxWaWV3W0JJTkRJTkdfSU5ERVhdKys7XG5cbiAgLy8gaW5wdXRzIGFyZSBvbmx5IGV2YWx1YXRlZCBmcm9tIGEgdGVtcGxhdGUgYmluZGluZyBpbnRvIGEgZGlyZWN0aXZlLCB0aGVyZWZvcmUsXG4gIC8vIHRoZXJlIHNob3VsZCBub3QgYmUgYSBzaXR1YXRpb24gd2hlcmUgYSBkaXJlY3RpdmUgaG9zdCBiaW5kaW5ncyBmdW5jdGlvblxuICAvLyBldmFsdWF0ZXMgdGhlIGlucHV0cyAodGhpcyBzaG91bGQgb25seSBoYXBwZW4gaW4gdGhlIHRlbXBsYXRlIGZ1bmN0aW9uKVxuICBpZiAoIWRpcmVjdGl2ZUluZGV4ICYmIGhhc1N0eWxlSW5wdXQodE5vZGUpICYmIHN0eWxlcyAhPT0gTk9fQ0hBTkdFKSB7XG4gICAgdXBkYXRlRGlyZWN0aXZlSW5wdXRWYWx1ZShjb250ZXh0LCBsVmlldywgdE5vZGUsIGJpbmRpbmdJbmRleCwgc3R5bGVzLCBmYWxzZSk7XG4gICAgc3R5bGVzID0gTk9fQ0hBTkdFO1xuICB9XG5cbiAgY29uc3QgdXBkYXRlZCA9IF9zdHlsaW5nTWFwKGluZGV4LCBjb250ZXh0LCBiaW5kaW5nSW5kZXgsIHN0eWxlcywgZmFsc2UsIGRlZmVyU3R5bGluZ1VwZGF0ZSgpKTtcbiAgaWYgKG5nRGV2TW9kZSkge1xuICAgIG5nRGV2TW9kZS5zdHlsZU1hcCsrO1xuICAgIGlmICh1cGRhdGVkKSB7XG4gICAgICBuZ0Rldk1vZGUuc3R5bGVNYXBDYWNoZU1pc3MrKztcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBVcGRhdGUgY2xhc3MgYmluZGluZ3MgdXNpbmcgYW4gb2JqZWN0IGxpdGVyYWwgb3IgY2xhc3Mtc3RyaW5nIG9uIGFuIGVsZW1lbnQuXG4gKlxuICogVGhpcyBpbnN0cnVjdGlvbiBpcyBtZWFudCB0byBhcHBseSBzdHlsaW5nIHZpYSB0aGUgYFtjbGFzc109XCJleHBcImAgdGVtcGxhdGUgYmluZGluZ3MuXG4gKiBXaGVuIGNsYXNzZXMgYXJlIGFwcGxpZWQgdG8gdGhlIGVsZW1lbnQgdGhleSB3aWxsIHRoZW4gYmUgdXBkYXRlZCB3aXRoXG4gKiByZXNwZWN0IHRvIGFueSBzdHlsZXMvY2xhc3NlcyBzZXQgdmlhIGBjbGFzc1Byb3BgLiBJZiBhbnlcbiAqIGNsYXNzZXMgYXJlIHNldCB0byBmYWxzeSB0aGVuIHRoZXkgd2lsbCBiZSByZW1vdmVkIGZyb20gdGhlIGVsZW1lbnQuXG4gKlxuICogTm90ZSB0aGF0IHRoZSBzdHlsaW5nIGluc3RydWN0aW9uIHdpbGwgbm90IGJlIGFwcGxpZWQgdW50aWwgYHN0eWxpbmdBcHBseWAgaXMgY2FsbGVkLlxuICogTm90ZSB0aGF0IHRoaXMgd2lsbCB0aGUgcHJvdmlkZWQgY2xhc3NNYXAgdmFsdWUgdG8gdGhlIGhvc3QgZWxlbWVudCBpZiB0aGlzIGZ1bmN0aW9uIGlzIGNhbGxlZFxuICogd2l0aGluIGEgaG9zdCBiaW5kaW5nLlxuICpcbiAqIEBwYXJhbSBjbGFzc2VzIEEga2V5L3ZhbHVlIG1hcCBvciBzdHJpbmcgb2YgQ1NTIGNsYXNzZXMgdGhhdCB3aWxsIGJlIGFkZGVkIHRvIHRoZVxuICogICAgICAgIGdpdmVuIGVsZW1lbnQuIEFueSBtaXNzaW5nIGNsYXNzZXMgKHRoYXQgaGF2ZSBhbHJlYWR5IGJlZW4gYXBwbGllZCB0byB0aGUgZWxlbWVudFxuICogICAgICAgIGJlZm9yZWhhbmQpIHdpbGwgYmUgcmVtb3ZlZCAodW5zZXQpIGZyb20gdGhlIGVsZW1lbnQncyBsaXN0IG9mIENTUyBjbGFzc2VzLlxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1Y2xhc3NNYXAoY2xhc3Nlczoge1tjbGFzc05hbWU6IHN0cmluZ106IGFueX0gfCBOT19DSEFOR0UgfCBzdHJpbmcgfCBudWxsKTogdm9pZCB7XG4gIGNsYXNzTWFwSW50ZXJuYWwoZ2V0U2VsZWN0ZWRJbmRleCgpLCBjbGFzc2VzKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNsYXNzTWFwSW50ZXJuYWwoXG4gICAgZWxlbWVudEluZGV4OiBudW1iZXIsIGNsYXNzZXM6IHtbY2xhc3NOYW1lOiBzdHJpbmddOiBhbnl9IHwgTk9fQ0hBTkdFIHwgc3RyaW5nIHwgbnVsbCkge1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IHROb2RlID0gZ2V0VE5vZGUoZWxlbWVudEluZGV4LCBsVmlldyk7XG4gIGNvbnN0IGNvbnRleHQgPSBnZXRDbGFzc2VzQ29udGV4dCh0Tm9kZSk7XG4gIGNvbnN0IGRpcmVjdGl2ZUluZGV4ID0gZ2V0QWN0aXZlRGlyZWN0aXZlU3R5bGluZ0luZGV4KCk7XG5cbiAgLy8gaWYgYSB2YWx1ZSBpcyBpbnRlcnBvbGF0ZWQgdGhlbiBpdCBtYXkgcmVuZGVyIGEgYE5PX0NIQU5HRWAgdmFsdWUuXG4gIC8vIGluIHRoaXMgY2FzZSB3ZSBkbyBub3QgbmVlZCB0byBkbyBhbnl0aGluZywgYnV0IHRoZSBiaW5kaW5nIGluZGV4XG4gIC8vIHN0aWxsIG5lZWRzIHRvIGJlIGluY3JlbWVudGVkIGJlY2F1c2UgYWxsIHN0eWxpbmcgYmluZGluZyB2YWx1ZXNcbiAgLy8gYXJlIHN0b3JlZCBpbnNpZGUgb2YgdGhlIGxWaWV3LlxuICBjb25zdCBiaW5kaW5nSW5kZXggPSBsVmlld1tCSU5ESU5HX0lOREVYXSsrO1xuXG4gIC8vIGlucHV0cyBhcmUgb25seSBldmFsdWF0ZWQgZnJvbSBhIHRlbXBsYXRlIGJpbmRpbmcgaW50byBhIGRpcmVjdGl2ZSwgdGhlcmVmb3JlLFxuICAvLyB0aGVyZSBzaG91bGQgbm90IGJlIGEgc2l0dWF0aW9uIHdoZXJlIGEgZGlyZWN0aXZlIGhvc3QgYmluZGluZ3MgZnVuY3Rpb25cbiAgLy8gZXZhbHVhdGVzIHRoZSBpbnB1dHMgKHRoaXMgc2hvdWxkIG9ubHkgaGFwcGVuIGluIHRoZSB0ZW1wbGF0ZSBmdW5jdGlvbilcbiAgaWYgKCFkaXJlY3RpdmVJbmRleCAmJiBoYXNDbGFzc0lucHV0KHROb2RlKSAmJiBjbGFzc2VzICE9PSBOT19DSEFOR0UpIHtcbiAgICB1cGRhdGVEaXJlY3RpdmVJbnB1dFZhbHVlKGNvbnRleHQsIGxWaWV3LCB0Tm9kZSwgYmluZGluZ0luZGV4LCBjbGFzc2VzLCB0cnVlKTtcbiAgICBjbGFzc2VzID0gTk9fQ0hBTkdFO1xuICB9XG5cbiAgY29uc3QgdXBkYXRlZCA9XG4gICAgICBfc3R5bGluZ01hcChlbGVtZW50SW5kZXgsIGNvbnRleHQsIGJpbmRpbmdJbmRleCwgY2xhc3NlcywgdHJ1ZSwgZGVmZXJTdHlsaW5nVXBkYXRlKCkpO1xuICBpZiAobmdEZXZNb2RlKSB7XG4gICAgbmdEZXZNb2RlLmNsYXNzTWFwKys7XG4gICAgaWYgKHVwZGF0ZWQpIHtcbiAgICAgIG5nRGV2TW9kZS5jbGFzc01hcENhY2hlTWlzcysrO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIFNoYXJlZCBmdW5jdGlvbiB1c2VkIHRvIHVwZGF0ZSBhIG1hcC1iYXNlZCBzdHlsaW5nIGJpbmRpbmcgZm9yIGFuIGVsZW1lbnQuXG4gKlxuICogV2hlbiB0aGlzIGZ1bmN0aW9uIGlzIGNhbGxlZCBpdCB3aWxsIGFjdGl2YXRlIHN1cHBvcnQgZm9yIGBbc3R5bGVdYCBhbmRcbiAqIGBbY2xhc3NdYCBiaW5kaW5ncyBpbiBBbmd1bGFyLlxuICovXG5mdW5jdGlvbiBfc3R5bGluZ01hcChcbiAgICBlbGVtZW50SW5kZXg6IG51bWJlciwgY29udGV4dDogVFN0eWxpbmdDb250ZXh0LCBiaW5kaW5nSW5kZXg6IG51bWJlcixcbiAgICB2YWx1ZToge1trZXk6IHN0cmluZ106IGFueX0gfCBzdHJpbmcgfCBudWxsLCBpc0NsYXNzQmFzZWQ6IGJvb2xlYW4sIGRlZmVyOiBib29sZWFuKSB7XG4gIGFjdGl2YXRlU3R5bGluZ01hcEZlYXR1cmUoKTtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuXG4gIGNvbnN0IHROb2RlID0gZ2V0VE5vZGUoZWxlbWVudEluZGV4LCBsVmlldyk7XG4gIGNvbnN0IG5hdGl2ZSA9IGdldE5hdGl2ZUJ5VE5vZGUodE5vZGUsIGxWaWV3KSBhcyBSRWxlbWVudDtcbiAgY29uc3Qgb2xkVmFsdWUgPSBsVmlld1tiaW5kaW5nSW5kZXhdO1xuICBjb25zdCB2YWx1ZUhhc0NoYW5nZWQgPSBoYXNWYWx1ZUNoYW5nZWQob2xkVmFsdWUsIHZhbHVlKTtcbiAgY29uc3Qgc3R5bGluZ01hcEFyciA9XG4gICAgICB2YWx1ZSA9PT0gTk9fQ0hBTkdFID8gTk9fQ0hBTkdFIDogbm9ybWFsaXplSW50b1N0eWxpbmdNYXAob2xkVmFsdWUsIHZhbHVlLCAhaXNDbGFzc0Jhc2VkKTtcbiAgaWYgKGlzQ2xhc3NCYXNlZCkge1xuICAgIHVwZGF0ZUNsYXNzQmluZGluZyhcbiAgICAgICAgY29udGV4dCwgbFZpZXcsIG5hdGl2ZSwgbnVsbCwgYmluZGluZ0luZGV4LCBzdHlsaW5nTWFwQXJyLCBkZWZlciwgdmFsdWVIYXNDaGFuZ2VkKTtcbiAgfSBlbHNlIHtcbiAgICBjb25zdCBzYW5pdGl6ZXIgPSBnZXRDdXJyZW50U3R5bGVTYW5pdGl6ZXIoKTtcbiAgICB1cGRhdGVTdHlsZUJpbmRpbmcoXG4gICAgICAgIGNvbnRleHQsIGxWaWV3LCBuYXRpdmUsIG51bGwsIGJpbmRpbmdJbmRleCwgc3R5bGluZ01hcEFyciwgc2FuaXRpemVyLCBkZWZlcixcbiAgICAgICAgdmFsdWVIYXNDaGFuZ2VkKTtcbiAgfVxuXG4gIHJldHVybiB2YWx1ZUhhc0NoYW5nZWQ7XG59XG5cbi8qKlxuICogV3JpdGVzIGEgdmFsdWUgdG8gYSBkaXJlY3RpdmUncyBgc3R5bGVgIG9yIGBjbGFzc2AgaW5wdXQgYmluZGluZyAoaWYgaXQgaGFzIGNoYW5nZWQpLlxuICpcbiAqIElmIGEgZGlyZWN0aXZlIGhhcyBhIGBASW5wdXRgIGJpbmRpbmcgdGhhdCBpcyBzZXQgb24gYHN0eWxlYCBvciBgY2xhc3NgIHRoZW4gdGhhdCB2YWx1ZVxuICogd2lsbCB0YWtlIHByaW9yaXR5IG92ZXIgdGhlIHVuZGVybHlpbmcgc3R5bGUvY2xhc3Mgc3R5bGluZyBiaW5kaW5ncy4gVGhpcyB2YWx1ZSB3aWxsXG4gKiBiZSB1cGRhdGVkIGZvciB0aGUgYmluZGluZyBlYWNoIHRpbWUgZHVyaW5nIGNoYW5nZSBkZXRlY3Rpb24uXG4gKlxuICogV2hlbiB0aGlzIG9jY3VycyB0aGlzIGZ1bmN0aW9uIHdpbGwgYXR0ZW1wdCB0byB3cml0ZSB0aGUgdmFsdWUgdG8gdGhlIGlucHV0IGJpbmRpbmdcbiAqIGRlcGVuZGluZyBvbiB0aGUgZm9sbG93aW5nIHNpdHVhdGlvbnM6XG4gKlxuICogLSBJZiBgb2xkVmFsdWUgIT09IG5ld1ZhbHVlYFxuICogLSBJZiBgbmV3VmFsdWVgIGlzIGBudWxsYCAoYnV0IHRoaXMgaXMgc2tpcHBlZCBpZiBpdCBpcyBkdXJpbmcgdGhlIGZpcnN0IHVwZGF0ZSBwYXNzLS1cbiAqICAgIHdoaWNoIGlzIHdoZW4gdGhlIGNvbnRleHQgaXMgbm90IGxvY2tlZCB5ZXQpXG4gKi9cbmZ1bmN0aW9uIHVwZGF0ZURpcmVjdGl2ZUlucHV0VmFsdWUoXG4gICAgY29udGV4dDogVFN0eWxpbmdDb250ZXh0LCBsVmlldzogTFZpZXcsIHROb2RlOiBUTm9kZSwgYmluZGluZ0luZGV4OiBudW1iZXIsIG5ld1ZhbHVlOiBhbnksXG4gICAgaXNDbGFzc0Jhc2VkOiBib29sZWFuKTogdm9pZCB7XG4gIGNvbnN0IG9sZFZhbHVlID0gbFZpZXdbYmluZGluZ0luZGV4XTtcbiAgaWYgKG9sZFZhbHVlICE9PSBuZXdWYWx1ZSkge1xuICAgIC8vIGV2ZW4gaWYgdGhlIHZhbHVlIGhhcyBjaGFuZ2VkIHdlIG1heSBub3Qgd2FudCB0byBlbWl0IGl0IHRvIHRoZVxuICAgIC8vIGRpcmVjdGl2ZSBpbnB1dChzKSBpbiB0aGUgZXZlbnQgdGhhdCBpdCBpcyBmYWxzeSBkdXJpbmcgdGhlXG4gICAgLy8gZmlyc3QgdXBkYXRlIHBhc3MuXG4gICAgaWYgKG5ld1ZhbHVlIHx8IGlzQ29udGV4dExvY2tlZChjb250ZXh0KSkge1xuICAgICAgY29uc3QgaW5wdXRzID0gdE5vZGUuaW5wdXRzICFbaXNDbGFzc0Jhc2VkID8gJ2NsYXNzJyA6ICdzdHlsZSddICE7XG4gICAgICBjb25zdCBpbml0aWFsVmFsdWUgPSBnZXRJbml0aWFsU3R5bGluZ1ZhbHVlKGNvbnRleHQpO1xuICAgICAgY29uc3QgdmFsdWUgPSBub3JtYWxpemVTdHlsaW5nRGlyZWN0aXZlSW5wdXRWYWx1ZShpbml0aWFsVmFsdWUsIG5ld1ZhbHVlLCBpc0NsYXNzQmFzZWQpO1xuICAgICAgc2V0SW5wdXRzRm9yUHJvcGVydHkobFZpZXcsIGlucHV0cywgdmFsdWUpO1xuICAgIH1cbiAgICBsVmlld1tiaW5kaW5nSW5kZXhdID0gbmV3VmFsdWU7XG4gIH1cbn1cblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBhcHByb3ByaWF0ZSBkaXJlY3RpdmUgaW5wdXQgdmFsdWUgZm9yIGBzdHlsZWAgb3IgYGNsYXNzYC5cbiAqXG4gKiBFYXJsaWVyIHZlcnNpb25zIG9mIEFuZ3VsYXIgZXhwZWN0IGEgYmluZGluZyB2YWx1ZSB0byBiZSBwYXNzZWQgaW50byBkaXJlY3RpdmUgY29kZVxuICogZXhhY3RseSBhcyBpdCBpcyB1bmxlc3MgdGhlcmUgaXMgYSBzdGF0aWMgdmFsdWUgcHJlc2VudCAoaW4gd2hpY2ggY2FzZSBib3RoIHZhbHVlc1xuICogd2lsbCBiZSBzdHJpbmdpZmllZCBhbmQgY29uY2F0ZW5hdGVkKS5cbiAqL1xuZnVuY3Rpb24gbm9ybWFsaXplU3R5bGluZ0RpcmVjdGl2ZUlucHV0VmFsdWUoXG4gICAgaW5pdGlhbFZhbHVlOiBzdHJpbmcsIGJpbmRpbmdWYWx1ZTogc3RyaW5nIHwge1trZXk6IHN0cmluZ106IGFueX0gfCBudWxsLFxuICAgIGlzQ2xhc3NCYXNlZDogYm9vbGVhbikge1xuICBsZXQgdmFsdWUgPSBiaW5kaW5nVmFsdWU7XG5cbiAgLy8gd2Ugb25seSBjb25jYXQgdmFsdWVzIGlmIHRoZXJlIGlzIGFuIGluaXRpYWwgdmFsdWUsIG90aGVyd2lzZSB3ZSByZXR1cm4gdGhlIHZhbHVlIGFzIGlzLlxuICAvLyBOb3RlIHRoYXQgdGhpcyBpcyB0byBzYXRpc2Z5IGJhY2t3YXJkcy1jb21wYXRpYmlsaXR5IGluIEFuZ3VsYXIuXG4gIGlmIChpbml0aWFsVmFsdWUubGVuZ3RoID4gMCkge1xuICAgIGlmIChpc0NsYXNzQmFzZWQpIHtcbiAgICAgIHZhbHVlID0gY29uY2F0U3RyaW5nKGluaXRpYWxWYWx1ZSwgZm9yY2VDbGFzc2VzQXNTdHJpbmcoYmluZGluZ1ZhbHVlKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhbHVlID0gY29uY2F0U3RyaW5nKFxuICAgICAgICAgIGluaXRpYWxWYWx1ZSwgZm9yY2VTdHlsZXNBc1N0cmluZyhiaW5kaW5nVmFsdWUgYXN7W2tleTogc3RyaW5nXTogYW55fSB8IG51bGwgfCB1bmRlZmluZWQpLFxuICAgICAgICAgICc7Jyk7XG4gICAgfVxuICB9XG4gIHJldHVybiB2YWx1ZTtcbn1cblxuLyoqXG4gKiBGbHVzaGVzIGFsbCBzdHlsaW5nIGNvZGUgdG8gdGhlIGVsZW1lbnQuXG4gKlxuICogVGhpcyBmdW5jdGlvbiBpcyBkZXNpZ25lZCB0byBiZSBjYWxsZWQgZnJvbSB0aGUgdGVtcGxhdGUgYW5kIGhvc3RCaW5kaW5nc1xuICogZnVuY3Rpb25zIGFuZCBtYXkgYmUgY2FsbGVkIG11bHRpcGxlIHRpbWVzIGRlcGVuZGluZyB3aGV0aGVyIG11bHRpcGxlXG4gKiBzb3VyY2VzIG9mIHN0eWxpbmcgZXhpc3QuIElmIGNhbGxlZCBtdWx0aXBsZSB0aW1lcywgb25seSB0aGUgbGFzdCBjYWxsXG4gKiB0byBgc3RseWluZ0FwcGx5KClgIHdpbGwgcmVuZGVyIHN0eWxpbmcgdG8gdGhlIGVsZW1lbnQuXG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVzdHlsaW5nQXBwbHkoKSB7XG4gIGNvbnN0IGVsZW1lbnRJbmRleCA9IGdldFNlbGVjdGVkSW5kZXgoKTtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCB0Tm9kZSA9IGdldFROb2RlKGVsZW1lbnRJbmRleCwgbFZpZXcpO1xuICBjb25zdCByZW5kZXJlciA9IGdldFJlbmRlcmVyKHROb2RlLCBsVmlldyk7XG4gIGNvbnN0IG5hdGl2ZSA9IGdldE5hdGl2ZUJ5VE5vZGUodE5vZGUsIGxWaWV3KSBhcyBSRWxlbWVudDtcbiAgY29uc3QgZGlyZWN0aXZlSW5kZXggPSBnZXRBY3RpdmVEaXJlY3RpdmVTdHlsaW5nSW5kZXgoKTtcbiAgY29uc3Qgc2FuaXRpemVyID0gZ2V0Q3VycmVudFN0eWxlU2FuaXRpemVyKCk7XG4gIGZsdXNoU3R5bGluZyhcbiAgICAgIHJlbmRlcmVyLCBsVmlldywgZ2V0Q2xhc3Nlc0NvbnRleHQodE5vZGUpLCBnZXRTdHlsZXNDb250ZXh0KHROb2RlKSwgbmF0aXZlLCBkaXJlY3RpdmVJbmRleCxcbiAgICAgIHNhbml0aXplcik7XG4gIHNldEN1cnJlbnRTdHlsZVNhbml0aXplcihudWxsKTtcbn1cblxuZnVuY3Rpb24gZ2V0UmVuZGVyZXIodE5vZGU6IFROb2RlLCBsVmlldzogTFZpZXcpIHtcbiAgcmV0dXJuIHROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5FbGVtZW50ID8gbFZpZXdbUkVOREVSRVJdIDogbnVsbDtcbn1cblxuLyoqXG4gKiBTZWFyY2hlcyBhbmQgYXNzaWducyBwcm92aWRlZCBhbGwgc3RhdGljIHN0eWxlL2NsYXNzIGVudHJpZXMgKGZvdW5kIGluIHRoZSBgYXR0cnNgIHZhbHVlKVxuICogYW5kIHJlZ2lzdGVycyB0aGVtIGluIHRoZWlyIHJlc3BlY3RpdmUgc3R5bGluZyBjb250ZXh0cy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlZ2lzdGVySW5pdGlhbFN0eWxpbmdPblROb2RlKFxuICAgIHROb2RlOiBUTm9kZSwgYXR0cnM6IFRBdHRyaWJ1dGVzLCBzdGFydEluZGV4OiBudW1iZXIpOiBib29sZWFuIHtcbiAgbGV0IGhhc0FkZGl0aW9uYWxJbml0aWFsU3R5bGluZyA9IGZhbHNlO1xuICBsZXQgc3R5bGVzID0gZ2V0U3R5bGluZ01hcEFycmF5KHROb2RlLnN0eWxlcyk7XG4gIGxldCBjbGFzc2VzID0gZ2V0U3R5bGluZ01hcEFycmF5KHROb2RlLmNsYXNzZXMpO1xuICBsZXQgbW9kZSA9IC0xO1xuICBmb3IgKGxldCBpID0gc3RhcnRJbmRleDsgaSA8IGF0dHJzLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3QgYXR0ciA9IGF0dHJzW2ldIGFzIHN0cmluZztcbiAgICBpZiAodHlwZW9mIGF0dHIgPT0gJ251bWJlcicpIHtcbiAgICAgIG1vZGUgPSBhdHRyO1xuICAgIH0gZWxzZSBpZiAobW9kZSA9PSBBdHRyaWJ1dGVNYXJrZXIuQ2xhc3Nlcykge1xuICAgICAgY2xhc3NlcyA9IGNsYXNzZXMgfHwgWycnXTtcbiAgICAgIGFkZEl0ZW1Ub1N0eWxpbmdNYXAoY2xhc3NlcywgYXR0ciwgdHJ1ZSk7XG4gICAgICBoYXNBZGRpdGlvbmFsSW5pdGlhbFN0eWxpbmcgPSB0cnVlO1xuICAgIH0gZWxzZSBpZiAobW9kZSA9PSBBdHRyaWJ1dGVNYXJrZXIuU3R5bGVzKSB7XG4gICAgICBjb25zdCB2YWx1ZSA9IGF0dHJzWysraV0gYXMgc3RyaW5nIHwgbnVsbDtcbiAgICAgIHN0eWxlcyA9IHN0eWxlcyB8fCBbJyddO1xuICAgICAgYWRkSXRlbVRvU3R5bGluZ01hcChzdHlsZXMsIGF0dHIsIHZhbHVlKTtcbiAgICAgIGhhc0FkZGl0aW9uYWxJbml0aWFsU3R5bGluZyA9IHRydWU7XG4gICAgfVxuICB9XG5cbiAgaWYgKGNsYXNzZXMgJiYgY2xhc3Nlcy5sZW5ndGggPiBTdHlsaW5nTWFwQXJyYXlJbmRleC5WYWx1ZXNTdGFydFBvc2l0aW9uKSB7XG4gICAgaWYgKCF0Tm9kZS5jbGFzc2VzKSB7XG4gICAgICB0Tm9kZS5jbGFzc2VzID0gY2xhc3NlcztcbiAgICB9XG4gICAgdXBkYXRlUmF3VmFsdWVPbkNvbnRleHQodE5vZGUuY2xhc3Nlcywgc3R5bGluZ01hcFRvU3RyaW5nKGNsYXNzZXMsIHRydWUpKTtcbiAgfVxuXG4gIGlmIChzdHlsZXMgJiYgc3R5bGVzLmxlbmd0aCA+IFN0eWxpbmdNYXBBcnJheUluZGV4LlZhbHVlc1N0YXJ0UG9zaXRpb24pIHtcbiAgICBpZiAoIXROb2RlLnN0eWxlcykge1xuICAgICAgdE5vZGUuc3R5bGVzID0gc3R5bGVzO1xuICAgIH1cbiAgICB1cGRhdGVSYXdWYWx1ZU9uQ29udGV4dCh0Tm9kZS5zdHlsZXMsIHN0eWxpbmdNYXBUb1N0cmluZyhzdHlsZXMsIGZhbHNlKSk7XG4gIH1cblxuICByZXR1cm4gaGFzQWRkaXRpb25hbEluaXRpYWxTdHlsaW5nO1xufVxuXG5mdW5jdGlvbiB1cGRhdGVSYXdWYWx1ZU9uQ29udGV4dChjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQgfCBTdHlsaW5nTWFwQXJyYXksIHZhbHVlOiBzdHJpbmcpIHtcbiAgY29uc3Qgc3R5bGluZ01hcEFyciA9IGdldFN0eWxpbmdNYXBBcnJheShjb250ZXh0KSAhO1xuICBzdHlsaW5nTWFwQXJyW1N0eWxpbmdNYXBBcnJheUluZGV4LlJhd1ZhbHVlUG9zaXRpb25dID0gdmFsdWU7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRBY3RpdmVEaXJlY3RpdmVTdHlsaW5nSW5kZXgoKTogbnVtYmVyIHtcbiAgLy8gd2hlbmV2ZXIgYSBkaXJlY3RpdmUncyBob3N0QmluZGluZ3MgZnVuY3Rpb24gaXMgY2FsbGVkIGEgdW5pcXVlSWQgdmFsdWVcbiAgLy8gaXMgYXNzaWduZWQuIE5vcm1hbGx5IHRoaXMgaXMgZW5vdWdoIHRvIGhlbHAgZGlzdGluZ3Vpc2ggb25lIGRpcmVjdGl2ZVxuICAvLyBmcm9tIGFub3RoZXIgZm9yIHRoZSBzdHlsaW5nIGNvbnRleHQsIGJ1dCB0aGVyZSBhcmUgc2l0dWF0aW9ucyB3aGVyZSBhXG4gIC8vIHN1Yi1jbGFzcyBkaXJlY3RpdmUgY291bGQgaW5oZXJpdCBhbmQgYXNzaWduIHN0eWxpbmcgaW4gY29uY2VydCB3aXRoIGFcbiAgLy8gcGFyZW50IGRpcmVjdGl2ZS4gVG8gaGVscCB0aGUgc3R5bGluZyBjb2RlIGRpc3Rpbmd1aXNoIGJldHdlZW4gYSBwYXJlbnRcbiAgLy8gc3ViLWNsYXNzZWQgZGlyZWN0aXZlIHRoZSBpbmhlcml0YW5jZSBkZXB0aCBpcyB0YWtlbiBpbnRvIGFjY291bnQgYXMgd2VsbC5cbiAgcmV0dXJuIGdldEFjdGl2ZURpcmVjdGl2ZUlkKCkgKyBnZXRBY3RpdmVEaXJlY3RpdmVTdXBlckNsYXNzRGVwdGgoKTtcbn1cblxuLyoqXG4gKiBUZW1wb3JhcnkgZnVuY3Rpb24gdGhhdCB3aWxsIHVwZGF0ZSB0aGUgbWF4IGRpcmVjdGl2ZSBpbmRleCB2YWx1ZSBpblxuICogYm90aCB0aGUgY2xhc3NlcyBhbmQgc3R5bGVzIGNvbnRleHRzIHByZXNlbnQgb24gdGhlIHByb3ZpZGVkIGB0Tm9kZWAuXG4gKlxuICogVGhpcyBjb2RlIGlzIG9ubHkgdXNlZCBiZWNhdXNlIHRoZSBgc2VsZWN0KG4pYCBjb2RlIGZ1bmN0aW9uYWxpdHkgaXMgbm90XG4gKiB5ZXQgMTAwJSBmdW5jdGlvbmFsLiBUaGUgYHNlbGVjdChuKWAgaW5zdHJ1Y3Rpb24gY2Fubm90IHlldCBldmFsdWF0ZSBob3N0XG4gKiBiaW5kaW5ncyBmdW5jdGlvbiBjb2RlIGluIHN5bmMgd2l0aCB0aGUgYXNzb2NpYXRlZCB0ZW1wbGF0ZSBmdW5jdGlvbiBjb2RlLlxuICogRm9yIHRoaXMgcmVhc29uIHRoZSBzdHlsaW5nIGFsZ29yaXRobSBuZWVkcyB0byB0cmFjayB0aGUgbGFzdCBkaXJlY3RpdmUgaW5kZXhcbiAqIHZhbHVlIHNvIHRoYXQgaXQga25vd3MgZXhhY3RseSB3aGVuIHRvIHJlbmRlciBzdHlsaW5nIHRvIHRoZSBlbGVtZW50IHNpbmNlXG4gKiBgc3R5bGluZ0FwcGx5KClgIGlzIGNhbGxlZCBtdWx0aXBsZSB0aW1lcyBwZXIgQ0QgKGBzdHlsaW5nQXBwbHlgIHdpbGwgYmVcbiAqIHJlbW92ZWQgb25jZSBgc2VsZWN0KG4pYCBpcyBmaXhlZCkuXG4gKi9cbmZ1bmN0aW9uIHVwZGF0ZUxhc3REaXJlY3RpdmVJbmRleCh0Tm9kZTogVE5vZGUsIGRpcmVjdGl2ZUluZGV4OiBudW1iZXIpIHtcbiAgX3VwZGF0ZUxhc3REaXJlY3RpdmVJbmRleChnZXRDbGFzc2VzQ29udGV4dCh0Tm9kZSksIGRpcmVjdGl2ZUluZGV4KTtcbiAgX3VwZGF0ZUxhc3REaXJlY3RpdmVJbmRleChnZXRTdHlsZXNDb250ZXh0KHROb2RlKSwgZGlyZWN0aXZlSW5kZXgpO1xufVxuXG5mdW5jdGlvbiBnZXRTdHlsZXNDb250ZXh0KHROb2RlOiBUTm9kZSk6IFRTdHlsaW5nQ29udGV4dCB7XG4gIHJldHVybiBnZXRDb250ZXh0KHROb2RlLCBmYWxzZSk7XG59XG5cbmZ1bmN0aW9uIGdldENsYXNzZXNDb250ZXh0KHROb2RlOiBUTm9kZSk6IFRTdHlsaW5nQ29udGV4dCB7XG4gIHJldHVybiBnZXRDb250ZXh0KHROb2RlLCB0cnVlKTtcbn1cblxuLyoqXG4gKiBSZXR1cm5zL2luc3RhbnRpYXRlcyBhIHN0eWxpbmcgY29udGV4dCBmcm9tL3RvIGEgYHROb2RlYCBpbnN0YW5jZS5cbiAqL1xuZnVuY3Rpb24gZ2V0Q29udGV4dCh0Tm9kZTogVE5vZGUsIGlzQ2xhc3NCYXNlZDogYm9vbGVhbikge1xuICBsZXQgY29udGV4dCA9IGlzQ2xhc3NCYXNlZCA/IHROb2RlLmNsYXNzZXMgOiB0Tm9kZS5zdHlsZXM7XG4gIGlmICghaXNTdHlsaW5nQ29udGV4dChjb250ZXh0KSkge1xuICAgIGNvbnRleHQgPSBhbGxvY1RTdHlsaW5nQ29udGV4dChjb250ZXh0KTtcbiAgICBpZiAobmdEZXZNb2RlKSB7XG4gICAgICBhdHRhY2hTdHlsaW5nRGVidWdPYmplY3QoY29udGV4dCBhcyBUU3R5bGluZ0NvbnRleHQpO1xuICAgIH1cbiAgICBpZiAoaXNDbGFzc0Jhc2VkKSB7XG4gICAgICB0Tm9kZS5jbGFzc2VzID0gY29udGV4dDtcbiAgICB9IGVsc2Uge1xuICAgICAgdE5vZGUuc3R5bGVzID0gY29udGV4dDtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGNvbnRleHQgYXMgVFN0eWxpbmdDb250ZXh0O1xufVxuXG5mdW5jdGlvbiByZXNvbHZlU3R5bGVQcm9wVmFsdWUoXG4gICAgdmFsdWU6IHN0cmluZyB8IG51bWJlciB8IFNhZmVWYWx1ZSB8IG51bGwgfCBOT19DSEFOR0UsXG4gICAgc3VmZml4OiBzdHJpbmcgfCBudWxsIHwgdW5kZWZpbmVkKTogc3RyaW5nfFNhZmVWYWx1ZXxudWxsfHVuZGVmaW5lZHxOT19DSEFOR0Uge1xuICBpZiAodmFsdWUgPT09IE5PX0NIQU5HRSkgcmV0dXJuIHZhbHVlO1xuXG4gIGxldCByZXNvbHZlZFZhbHVlOiBzdHJpbmd8bnVsbCA9IG51bGw7XG4gIGlmICh2YWx1ZSAhPT0gbnVsbCkge1xuICAgIGlmIChzdWZmaXgpIHtcbiAgICAgIC8vIHdoZW4gYSBzdWZmaXggaXMgYXBwbGllZCB0aGVuIGl0IHdpbGwgYnlwYXNzXG4gICAgICAvLyBzYW5pdGl6YXRpb24gZW50aXJlbHkgKGIvYyBhIG5ldyBzdHJpbmcgaXMgY3JlYXRlZClcbiAgICAgIHJlc29sdmVkVmFsdWUgPSByZW5kZXJTdHJpbmdpZnkodmFsdWUpICsgc3VmZml4O1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBzYW5pdGl6YXRpb24gaGFwcGVucyBieSBkZWFsaW5nIHdpdGggYSBzdHJpbmcgdmFsdWVcbiAgICAgIC8vIHRoaXMgbWVhbnMgdGhhdCB0aGUgc3RyaW5nIHZhbHVlIHdpbGwgYmUgcGFzc2VkIHRocm91Z2hcbiAgICAgIC8vIGludG8gdGhlIHN0eWxlIHJlbmRlcmluZyBsYXRlciAod2hpY2ggaXMgd2hlcmUgdGhlIHZhbHVlXG4gICAgICAvLyB3aWxsIGJlIHNhbml0aXplZCBiZWZvcmUgaXQgaXMgYXBwbGllZClcbiAgICAgIHJlc29sdmVkVmFsdWUgPSB2YWx1ZSBhcyBhbnkgYXMgc3RyaW5nO1xuICAgIH1cbiAgfVxuICByZXR1cm4gcmVzb2x2ZWRWYWx1ZTtcbn1cblxuLyoqXG4gKiBXaGV0aGVyIG9yIG5vdCBhIHN0eWxlL2NsYXNzIGJpbmRpbmcgdXBkYXRlIHNob3VsZCBiZSBhcHBsaWVkIGxhdGVyLlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gd2lsbCBkZWNpZGUgd2hldGhlciBhIGJpbmRpbmcgc2hvdWxkIGJlIGFwcGxpZWQgaW1tZWRpYXRlbHlcbiAqIG9yIGxhdGVyIChqdXN0IGJlZm9yZSB0aGUgc3R5bGVzL2NsYXNzZXMgYXJlIGZsdXNoZWQgdG8gdGhlIGVsZW1lbnQpLiBUaGVcbiAqIHJlYXNvbiB3aHkgdGhpcyBmZWF0dXJlIGV4aXN0cyBpcyBiZWNhdXNlIG9mIHN1cGVyL3N1YiBkaXJlY3RpdmUgaW5oZXJpdGFuY2UuXG4gKiBBbmd1bGFyIHdpbGwgZXZhbHVhdGUgaG9zdCBiaW5kaW5ncyBvbiB0aGUgc3VwZXIgZGlyZWN0aXZlIGZpcnN0IGFuZCB0aGUgc3ViXG4gKiBkaXJlY3RpdmUsIGJ1dCB0aGUgc3R5bGluZyBiaW5kaW5ncyBvbiB0aGUgc3ViIGRpcmVjdGl2ZSBhcmUgb2YgaGlnaGVyIHByaW9yaXR5XG4gKiB0aGFuIHRoZSBzdXBlciBkaXJlY3RpdmUuIEZvciB0aGlzIHJlYXNvbiBhbGwgc3R5bGluZyBiaW5kaW5ncyB0aGF0IHRha2UgcGxhY2VcbiAqIGluIHRoaXMgY2lyY3Vtc3RhbmNlIHdpbGwgbmVlZCB0byBiZSBkZWZlcnJlZCB1bnRpbCBsYXRlciBzbyB0aGF0IHRoZXkgY2FuIGJlXG4gKiBhcHBsaWVkIHRvZ2V0aGVyIGFuZCBpbiBhIGRpZmZlcmVudCBvcmRlciAodGhlIGFsZ29yaXRobSBoYW5kbGVzIHRoYXQgcGFydCkuXG4gKi9cbmZ1bmN0aW9uIGRlZmVyU3R5bGluZ1VwZGF0ZSgpOiBib29sZWFuIHtcbiAgcmV0dXJuIGdldEFjdGl2ZURpcmVjdGl2ZVN1cGVyQ2xhc3NIZWlnaHQoKSA+IDA7XG59XG4iXX0=