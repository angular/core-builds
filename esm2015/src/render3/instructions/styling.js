/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
import { throwErrorIfNoChangesMode } from '../errors';
import { setInputsForProperty } from '../instructions/shared';
import { isDirectiveHost } from '../interfaces/type_checks';
import { BINDING_INDEX, RENDERER } from '../interfaces/view';
import { getActiveDirectiveId, getCheckNoChangesMode, getCurrentStyleSanitizer, getLView, getSelectedIndex, resetCurrentStyleSanitizer, setCurrentStyleSanitizer, setElementExitFn } from '../state';
import { applyStylingMapDirectly, applyStylingValueDirectly, flushStyling, updateClassViaContext, updateStyleViaContext } from '../styling/bindings';
import { activateStylingMapFeature } from '../styling/map_based_bindings';
import { attachStylingDebugObject } from '../styling/styling_debug';
import { NO_CHANGE } from '../tokens';
import { renderStringify } from '../util/misc_utils';
import { addItemToStylingMap, allocStylingMapArray, allocTStylingContext, allowDirectStyling, concatString, forceClassesAsString, forceStylesAsString, getInitialStylingValue, getStylingMapArray, getValue, hasClassInput, hasStyleInput, hasValueChanged, isContextLocked, isHostStylingActive, isStylingContext, normalizeIntoStylingMap, patchConfig, selectClassBasedInputName, setValue, stylingMapToString } from '../util/styling_utils';
import { getNativeByTNode, getTNode } from '../util/view_utils';
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
 * Sets the current style sanitizer function which will then be used
 * within all follow-up prop and map-based style binding instructions
 * for the given element.
 *
 * Note that once styling has been applied to the element (i.e. once
 * `advance(n)` is executed or the hostBindings/template function exits)
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
 * within a host binding function.
 *
 * @return {?}
 */
export function ɵɵstyleProp(prop, value, suffix) {
    stylePropInternal(getSelectedIndex(), prop, value, suffix);
}
/**
 * Internal function for applying a single style to an element.
 *
 * The reason why this function has been separated from `ɵɵstyleProp` is because
 * it is also called from `ɵɵstylePropInterpolate`.
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
    const bindingIndex = getAndIncrementBindingIndex(lView, false);
    /** @type {?} */
    const updated = stylingProp(elementIndex, bindingIndex, prop, resolveStylePropValue(value, suffix), false);
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
 * is called within a host binding function.
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
    const bindingIndex = getAndIncrementBindingIndex(lView, false);
    /** @type {?} */
    const updated = stylingProp(getSelectedIndex(), bindingIndex, className, value, true);
    if (ngDevMode) {
        ngDevMode.classProp++;
        if (updated) {
            ngDevMode.classPropCacheMiss++;
        }
    }
}
/**
 * Shared function used to update a prop-based styling binding for an element.
 *
 * Depending on the state of the `tNode.styles` styles context, the style/prop
 * value may be applied directly to the element instead of being processed
 * through the context. The reason why this occurs is for performance and fully
 * depends on the state of the context (i.e. whether or not there are duplicate
 * bindings or whether or not there are map-based bindings and property bindings
 * present together).
 * @param {?} elementIndex
 * @param {?} bindingIndex
 * @param {?} prop
 * @param {?} value
 * @param {?} isClassBased
 * @return {?}
 */
function stylingProp(elementIndex, bindingIndex, prop, value, isClassBased) {
    /** @type {?} */
    let updated = false;
    /** @type {?} */
    const lView = getLView();
    /** @type {?} */
    const tNode = getTNode(elementIndex, lView);
    /** @type {?} */
    const native = (/** @type {?} */ (getNativeByTNode(tNode, lView)));
    /** @type {?} */
    const hostBindingsMode = isHostStyling();
    /** @type {?} */
    const context = isClassBased ? getClassesContext(tNode) : getStylesContext(tNode);
    /** @type {?} */
    const sanitizer = isClassBased ? null : getCurrentStyleSanitizer();
    // we check for this in the instruction code so that the context can be notified
    // about prop or map bindings so that the direct apply check can decide earlier
    // if it allows for context resolution to be bypassed.
    if (!isContextLocked(context, hostBindingsMode)) {
        patchConfig(context, 2 /* HasPropBindings */);
    }
    // [style.prop] and [class.name] bindings do not use `bind()` and will
    // therefore manage accessing and updating the new value in the lView directly.
    // For this reason, the checkNoChanges situation must also be handled here
    // as well.
    if (ngDevMode && getCheckNoChangesMode()) {
        /** @type {?} */
        const oldValue = getValue(lView, bindingIndex);
        if (hasValueChanged(oldValue, value)) {
            throwErrorIfNoChangesMode(false, oldValue, value);
        }
    }
    // Direct Apply Case: bypass context resolution and apply the
    // style/class value directly to the element
    if (allowDirectStyling(context, hostBindingsMode)) {
        /** @type {?} */
        const sanitizerToUse = isClassBased ? null : sanitizer;
        /** @type {?} */
        const renderer = getRenderer(tNode, lView);
        updated = applyStylingValueDirectly(renderer, context, native, lView, bindingIndex, prop, value, isClassBased, sanitizerToUse);
        if (sanitizerToUse) {
            // it's important we remove the current style sanitizer once the
            // element exits, otherwise it will be used by the next styling
            // instructions for the next element.
            setElementExitFn(stylingApply);
        }
    }
    else {
        // Context Resolution (or first update) Case: save the value
        // and defer to the context to flush and apply the style/class binding
        // value to the element.
        /** @type {?} */
        const directiveIndex = getActiveDirectiveId();
        if (isClassBased) {
            updated = updateClassViaContext(context, lView, native, directiveIndex, prop, bindingIndex, (/** @type {?} */ (value)));
        }
        else {
            updated = updateStyleViaContext(context, lView, native, directiveIndex, prop, bindingIndex, (/** @type {?} */ (value)), sanitizer);
        }
        setElementExitFn(stylingApply);
    }
    return updated;
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
    const hasDirectiveInput = hasStyleInput(tNode);
    // if a value is interpolated then it may render a `NO_CHANGE` value.
    // in this case we do not need to do anything, but the binding index
    // still needs to be incremented because all styling binding values
    // are stored inside of the lView.
    /** @type {?} */
    const bindingIndex = getAndIncrementBindingIndex(lView, true);
    // inputs are only evaluated from a template binding into a directive, therefore,
    // there should not be a situation where a directive host bindings function
    // evaluates the inputs (this should only happen in the template function)
    if (!isHostStyling() && hasDirectiveInput && styles !== NO_CHANGE) {
        updateDirectiveInputValue(context, lView, tNode, bindingIndex, styles, false);
        styles = NO_CHANGE;
    }
    stylingMap(context, tNode, lView, bindingIndex, styles, false, hasDirectiveInput);
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
 * Internal function for applying a class string or key/value map of classes to an element.
 *
 * The reason why this function has been separated from `ɵɵclassMap` is because
 * it is also called from `ɵɵclassMapInterpolate`.
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
    const hasDirectiveInput = hasClassInput(tNode);
    // if a value is interpolated then it may render a `NO_CHANGE` value.
    // in this case we do not need to do anything, but the binding index
    // still needs to be incremented because all styling binding values
    // are stored inside of the lView.
    /** @type {?} */
    const bindingIndex = getAndIncrementBindingIndex(lView, true);
    // inputs are only evaluated from a template binding into a directive, therefore,
    // there should not be a situation where a directive host bindings function
    // evaluates the inputs (this should only happen in the template function)
    if (!isHostStyling() && hasDirectiveInput && classes !== NO_CHANGE) {
        updateDirectiveInputValue(context, lView, tNode, bindingIndex, classes, true);
        classes = NO_CHANGE;
    }
    stylingMap(context, tNode, lView, bindingIndex, classes, true, hasDirectiveInput);
}
/**
 * Shared function used to update a map-based styling binding for an element.
 *
 * When this function is called it will activate support for `[style]` and
 * `[class]` bindings in Angular.
 * @param {?} context
 * @param {?} tNode
 * @param {?} lView
 * @param {?} bindingIndex
 * @param {?} value
 * @param {?} isClassBased
 * @param {?} hasDirectiveInput
 * @return {?}
 */
function stylingMap(context, tNode, lView, bindingIndex, value, isClassBased, hasDirectiveInput) {
    /** @type {?} */
    const directiveIndex = getActiveDirectiveId();
    /** @type {?} */
    const native = (/** @type {?} */ (getNativeByTNode(tNode, lView)));
    /** @type {?} */
    const oldValue = getValue(lView, bindingIndex);
    /** @type {?} */
    const hostBindingsMode = isHostStyling();
    /** @type {?} */
    const sanitizer = getCurrentStyleSanitizer();
    /** @type {?} */
    const valueHasChanged = hasValueChanged(oldValue, value);
    // [style] and [class] bindings do not use `bind()` and will therefore
    // manage accessing and updating the new value in the lView directly.
    // For this reason, the checkNoChanges situation must also be handled here
    // as well.
    if (ngDevMode && valueHasChanged && getCheckNoChangesMode()) {
        throwErrorIfNoChangesMode(false, oldValue, value);
    }
    // we check for this in the instruction code so that the context can be notified
    // about prop or map bindings so that the direct apply check can decide earlier
    // if it allows for context resolution to be bypassed.
    if (!isContextLocked(context, hostBindingsMode)) {
        patchConfig(context, 4 /* HasMapBindings */);
    }
    // Direct Apply Case: bypass context resolution and apply the
    // style/class map values directly to the element
    if (allowDirectStyling(context, hostBindingsMode)) {
        /** @type {?} */
        const sanitizerToUse = isClassBased ? null : sanitizer;
        /** @type {?} */
        const renderer = getRenderer(tNode, lView);
        applyStylingMapDirectly(renderer, context, native, lView, bindingIndex, value, isClassBased, sanitizerToUse, valueHasChanged, hasDirectiveInput);
        if (sanitizerToUse) {
            // it's important we remove the current style sanitizer once the
            // element exits, otherwise it will be used by the next styling
            // instructions for the next element.
            setElementExitFn(stylingApply);
        }
    }
    else {
        /** @type {?} */
        const stylingMapArr = value === NO_CHANGE ? NO_CHANGE : normalizeIntoStylingMap(oldValue, value, !isClassBased);
        activateStylingMapFeature();
        // Context Resolution (or first update) Case: save the map value
        // and defer to the context to flush and apply the style/class binding
        // value to the element.
        if (isClassBased) {
            updateClassViaContext(context, lView, native, directiveIndex, null, bindingIndex, stylingMapArr, valueHasChanged);
        }
        else {
            updateStyleViaContext(context, lView, native, directiveIndex, null, bindingIndex, stylingMapArr, sanitizer, valueHasChanged);
        }
        setElementExitFn(stylingApply);
    }
    if (ngDevMode) {
        isClassBased ? ngDevMode.classMap : ngDevMode.styleMap++;
        if (valueHasChanged) {
            isClassBased ? ngDevMode.classMapCacheMiss : ngDevMode.styleMapCacheMiss++;
        }
    }
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
        if (newValue || isContextLocked(context, false)) {
            /** @type {?} */
            const inputName = isClassBased ? selectClassBasedInputName((/** @type {?} */ (tNode.inputs))) : 'style';
            /** @type {?} */
            const inputs = (/** @type {?} */ ((/** @type {?} */ (tNode.inputs))[inputName]));
            /** @type {?} */
            const initialValue = getInitialStylingValue(context);
            /** @type {?} */
            const value = normalizeStylingDirectiveInputValue(initialValue, newValue, isClassBased);
            setInputsForProperty(lView, inputs, value);
            setElementExitFn(stylingApply);
        }
        setValue(lView, bindingIndex, newValue);
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
    if (initialValue.length) {
        if (isClassBased) {
            value = concatString(initialValue, forceClassesAsString(bindingValue));
        }
        else {
            value = concatString(initialValue, forceStylesAsString((/** @type {?} */ (bindingValue)), true), ';');
        }
    }
    return value;
}
/**
 * Flushes all styling code to the element.
 *
 * This function is designed to be scheduled from any of the four styling instructions
 * in this file. When called it will flush all style and class bindings to the element
 * via the context resolution algorithm.
 * @return {?}
 */
function stylingApply() {
    /** @type {?} */
    const lView = getLView();
    /** @type {?} */
    const elementIndex = getSelectedIndex();
    /** @type {?} */
    const tNode = getTNode(elementIndex, lView);
    /** @type {?} */
    const native = (/** @type {?} */ (getNativeByTNode(tNode, lView)));
    /** @type {?} */
    const directiveIndex = getActiveDirectiveId();
    /** @type {?} */
    const renderer = getRenderer(tNode, lView);
    /** @type {?} */
    const sanitizer = getCurrentStyleSanitizer();
    /** @type {?} */
    const classesContext = isStylingContext(tNode.classes) ? (/** @type {?} */ (tNode.classes)) : null;
    /** @type {?} */
    const stylesContext = isStylingContext(tNode.styles) ? (/** @type {?} */ (tNode.styles)) : null;
    flushStyling(renderer, lView, classesContext, stylesContext, native, directiveIndex, sanitizer);
    resetCurrentStyleSanitizer();
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
            classes = classes || allocStylingMapArray(null);
            addItemToStylingMap(classes, attr, true);
            hasAdditionalInitialStyling = true;
        }
        else if (mode == 2 /* Styles */) {
            /** @type {?} */
            const value = (/** @type {?} */ (attrs[++i]));
            styles = styles || allocStylingMapArray(null);
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
    if (hasAdditionalInitialStyling) {
        tNode.flags |= 64 /* hasInitialStyling */;
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
        /** @type {?} */
        const hasDirectives = isDirectiveHost(tNode);
        context = allocTStylingContext((/** @type {?} */ (context)), hasDirectives);
        if (ngDevMode) {
            attachStylingDebugObject((/** @type {?} */ (context)), isClassBased);
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
 * Whether or not the style/class binding being applied was executed within a host bindings
 * function.
 * @return {?}
 */
function isHostStyling() {
    return isHostStylingActive(getActiveDirectiveId());
}
/**
 * @param {?} lView
 * @param {?} isMapBased
 * @return {?}
 */
function getAndIncrementBindingIndex(lView, isMapBased) {
    // map-based bindings use two slots because the previously constructed
    // className / style value must be compared against.
    /** @type {?} */
    const index = lView[BINDING_INDEX];
    lView[BINDING_INDEX] += isMapBased ? 2 : 1;
    return index;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3R5bGluZy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvaW5zdHJ1Y3Rpb25zL3N0eWxpbmcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7OztBQVNBLE9BQU8sRUFBQyx5QkFBeUIsRUFBQyxNQUFNLFdBQVcsQ0FBQztBQUNwRCxPQUFPLEVBQUMsb0JBQW9CLEVBQUMsTUFBTSx3QkFBd0IsQ0FBQztBQUk1RCxPQUFPLEVBQUMsZUFBZSxFQUFDLE1BQU0sMkJBQTJCLENBQUM7QUFDMUQsT0FBTyxFQUFDLGFBQWEsRUFBUyxRQUFRLEVBQUMsTUFBTSxvQkFBb0IsQ0FBQztBQUNsRSxPQUFPLEVBQUMsb0JBQW9CLEVBQUUscUJBQXFCLEVBQUUsd0JBQXdCLEVBQUUsUUFBUSxFQUFFLGdCQUFnQixFQUFFLDBCQUEwQixFQUFFLHdCQUF3QixFQUFFLGdCQUFnQixFQUFDLE1BQU0sVUFBVSxDQUFDO0FBQ25NLE9BQU8sRUFBQyx1QkFBdUIsRUFBRSx5QkFBeUIsRUFBRSxZQUFZLEVBQXNCLHFCQUFxQixFQUFFLHFCQUFxQixFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFDdkssT0FBTyxFQUFDLHlCQUF5QixFQUFDLE1BQU0sK0JBQStCLENBQUM7QUFDeEUsT0FBTyxFQUFDLHdCQUF3QixFQUFDLE1BQU0sMEJBQTBCLENBQUM7QUFDbEUsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLFdBQVcsQ0FBQztBQUNwQyxPQUFPLEVBQUMsZUFBZSxFQUFDLE1BQU0sb0JBQW9CLENBQUM7QUFDbkQsT0FBTyxFQUFDLG1CQUFtQixFQUFFLG9CQUFvQixFQUFFLG9CQUFvQixFQUFFLGtCQUFrQixFQUFFLFlBQVksRUFBRSxvQkFBb0IsRUFBRSxtQkFBbUIsRUFBRSxzQkFBc0IsRUFBRSxrQkFBa0IsRUFBRSxRQUFRLEVBQUUsYUFBYSxFQUFFLGFBQWEsRUFBRSxlQUFlLEVBQUUs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O1FBRWxDLGFBQWEsR0FBZ0IsSUFBSTtJQUNyQyxJQUFJLEtBQUssS0FBSyxJQUFJLEVBQUU7UUFDbEIsSUFBSSxNQUFNLEVBQUU7WUFDViwrQ0FBK0M7WUFDL0Msc0RBQXNEO1lBQ3RELGFBQWEsR0FBRyxlQUFlLENBQUMsS0FBSyxDQUFDLEdBQUcsTUFBTSxDQUFDO1NBQ2pEO2FBQU07WUFDTCxzREFBc0Q7WUFDdEQsMERBQTBEO1lBQzFELDJEQUEyRDtZQUMzRCwwQ0FBMEM7WUFDMUMsYUFBYSxHQUFHLG1CQUFBLG1CQUFBLEtBQUssRUFBTyxFQUFVLENBQUM7U0FDeEM7S0FDRjtJQUNELE9BQU8sYUFBYSxDQUFDO0FBQ3ZCLENBQUM7Ozs7OztBQU1ELFNBQVMsYUFBYTtJQUNwQixPQUFPLG1CQUFtQixDQUFDLG9CQUFvQixFQUFFLENBQUMsQ0FBQztBQUNyRCxDQUFDOzs7Ozs7QUFFRCxTQUFTLDJCQUEyQixDQUFDLEtBQVksRUFBRSxVQUFtQjs7OztVQUc5RCxLQUFLLEdBQUcsS0FBSyxDQUFDLGFBQWEsQ0FBQztJQUNsQyxLQUFLLENBQUMsYUFBYSxDQUFDLElBQUksVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUMzQyxPQUFPLEtBQUssQ0FBQztBQUNmLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiogQGxpY2Vuc2VcbiogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4qXG4qIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4qIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiovXG5pbXBvcnQge1NhZmVWYWx1ZX0gZnJvbSAnLi4vLi4vc2FuaXRpemF0aW9uL2J5cGFzcyc7XG5pbXBvcnQge1N0eWxlU2FuaXRpemVGbn0gZnJvbSAnLi4vLi4vc2FuaXRpemF0aW9uL3N0eWxlX3Nhbml0aXplcic7XG5pbXBvcnQge3Rocm93RXJyb3JJZk5vQ2hhbmdlc01vZGV9IGZyb20gJy4uL2Vycm9ycyc7XG5pbXBvcnQge3NldElucHV0c0ZvclByb3BlcnR5fSBmcm9tICcuLi9pbnN0cnVjdGlvbnMvc2hhcmVkJztcbmltcG9ydCB7QXR0cmlidXRlTWFya2VyLCBUQXR0cmlidXRlcywgVE5vZGUsIFROb2RlRmxhZ3MsIFROb2RlVHlwZX0gZnJvbSAnLi4vaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB7UkVsZW1lbnR9IGZyb20gJy4uL2ludGVyZmFjZXMvcmVuZGVyZXInO1xuaW1wb3J0IHtTdHlsaW5nTWFwQXJyYXksIFN0eWxpbmdNYXBBcnJheUluZGV4LCBUU3R5bGluZ0NvbmZpZywgVFN0eWxpbmdDb250ZXh0fSBmcm9tICcuLi9pbnRlcmZhY2VzL3N0eWxpbmcnO1xuaW1wb3J0IHtpc0RpcmVjdGl2ZUhvc3R9IGZyb20gJy4uL2ludGVyZmFjZXMvdHlwZV9jaGVja3MnO1xuaW1wb3J0IHtCSU5ESU5HX0lOREVYLCBMVmlldywgUkVOREVSRVJ9IGZyb20gJy4uL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge2dldEFjdGl2ZURpcmVjdGl2ZUlkLCBnZXRDaGVja05vQ2hhbmdlc01vZGUsIGdldEN1cnJlbnRTdHlsZVNhbml0aXplciwgZ2V0TFZpZXcsIGdldFNlbGVjdGVkSW5kZXgsIHJlc2V0Q3VycmVudFN0eWxlU2FuaXRpemVyLCBzZXRDdXJyZW50U3R5bGVTYW5pdGl6ZXIsIHNldEVsZW1lbnRFeGl0Rm59IGZyb20gJy4uL3N0YXRlJztcbmltcG9ydCB7YXBwbHlTdHlsaW5nTWFwRGlyZWN0bHksIGFwcGx5U3R5bGluZ1ZhbHVlRGlyZWN0bHksIGZsdXNoU3R5bGluZywgc2V0Q2xhc3MsIHNldFN0eWxlLCB1cGRhdGVDbGFzc1ZpYUNvbnRleHQsIHVwZGF0ZVN0eWxlVmlhQ29udGV4dH0gZnJvbSAnLi4vc3R5bGluZy9iaW5kaW5ncyc7XG5pbXBvcnQge2FjdGl2YXRlU3R5bGluZ01hcEZlYXR1cmV9IGZyb20gJy4uL3N0eWxpbmcvbWFwX2Jhc2VkX2JpbmRpbmdzJztcbmltcG9ydCB7YXR0YWNoU3R5bGluZ0RlYnVnT2JqZWN0fSBmcm9tICcuLi9zdHlsaW5nL3N0eWxpbmdfZGVidWcnO1xuaW1wb3J0IHtOT19DSEFOR0V9IGZyb20gJy4uL3Rva2Vucyc7XG5pbXBvcnQge3JlbmRlclN0cmluZ2lmeX0gZnJvbSAnLi4vdXRpbC9taXNjX3V0aWxzJztcbmltcG9ydCB7YWRkSXRlbVRvU3R5bGluZ01hcCwgYWxsb2NTdHlsaW5nTWFwQXJyYXksIGFsbG9jVFN0eWxpbmdDb250ZXh0LCBhbGxvd0RpcmVjdFN0eWxpbmcsIGNvbmNhdFN0cmluZywgZm9yY2VDbGFzc2VzQXNTdHJpbmcsIGZvcmNlU3R5bGVzQXNTdHJpbmcsIGdldEluaXRpYWxTdHlsaW5nVmFsdWUsIGdldFN0eWxpbmdNYXBBcnJheSwgZ2V0VmFsdWUsIGhhc0NsYXNzSW5wdXQsIGhhc1N0eWxlSW5wdXQsIGhhc1ZhbHVlQ2hhbmdlZCwgaXNDb250ZXh0TG9ja2VkLCBpc0hvc3RTdHlsaW5nQWN0aXZlLCBpc1N0eWxpbmdDb250ZXh0LCBub3JtYWxpemVJbnRvU3R5bGluZ01hcCwgcGF0Y2hDb25maWcsIHNlbGVjdENsYXNzQmFzZWRJbnB1dE5hbWUsIHNldFZhbHVlLCBzdHlsaW5nTWFwVG9TdHJpbmd9IGZyb20gJy4uL3V0aWwvc3R5bGluZ191dGlscyc7XG5pbXBvcnQge2dldE5hdGl2ZUJ5VE5vZGUsIGdldFROb2RlfSBmcm9tICcuLi91dGlsL3ZpZXdfdXRpbHMnO1xuXG5cblxuLyoqXG4gKiAtLS0tLS0tLVxuICpcbiAqIFRoaXMgZmlsZSBjb250YWlucyB0aGUgY29yZSBsb2dpYyBmb3IgaG93IHN0eWxpbmcgaW5zdHJ1Y3Rpb25zIGFyZSBwcm9jZXNzZWQgaW4gQW5ndWxhci5cbiAqXG4gKiBUbyBsZWFybiBtb3JlIGFib3V0IHRoZSBhbGdvcml0aG0gc2VlIGBUU3R5bGluZ0NvbnRleHRgLlxuICpcbiAqIC0tLS0tLS0tXG4gKi9cblxuLyoqXG4gKiBTZXRzIHRoZSBjdXJyZW50IHN0eWxlIHNhbml0aXplciBmdW5jdGlvbiB3aGljaCB3aWxsIHRoZW4gYmUgdXNlZFxuICogd2l0aGluIGFsbCBmb2xsb3ctdXAgcHJvcCBhbmQgbWFwLWJhc2VkIHN0eWxlIGJpbmRpbmcgaW5zdHJ1Y3Rpb25zXG4gKiBmb3IgdGhlIGdpdmVuIGVsZW1lbnQuXG4gKlxuICogTm90ZSB0aGF0IG9uY2Ugc3R5bGluZyBoYXMgYmVlbiBhcHBsaWVkIHRvIHRoZSBlbGVtZW50IChpLmUuIG9uY2VcbiAqIGBhZHZhbmNlKG4pYCBpcyBleGVjdXRlZCBvciB0aGUgaG9zdEJpbmRpbmdzL3RlbXBsYXRlIGZ1bmN0aW9uIGV4aXRzKVxuICogdGhlbiB0aGUgYWN0aXZlIGBzYW5pdGl6ZXJGbmAgd2lsbCBiZSBzZXQgdG8gYG51bGxgLiBUaGlzIG1lYW5zIHRoYXRcbiAqIG9uY2Ugc3R5bGluZyBpcyBhcHBsaWVkIHRvIGFub3RoZXIgZWxlbWVudCB0aGVuIGEgYW5vdGhlciBjYWxsIHRvXG4gKiBgc3R5bGVTYW5pdGl6ZXJgIHdpbGwgbmVlZCB0byBiZSBtYWRlLlxuICpcbiAqIEBwYXJhbSBzYW5pdGl6ZXJGbiBUaGUgc2FuaXRpemF0aW9uIGZ1bmN0aW9uIHRoYXQgd2lsbCBiZSB1c2VkIHRvXG4gKiAgICAgICBwcm9jZXNzIHN0eWxlIHByb3AvdmFsdWUgZW50cmllcy5cbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtXN0eWxlU2FuaXRpemVyKHNhbml0aXplcjogU3R5bGVTYW5pdGl6ZUZuIHwgbnVsbCk6IHZvaWQge1xuICBzZXRDdXJyZW50U3R5bGVTYW5pdGl6ZXIoc2FuaXRpemVyKTtcbn1cblxuLyoqXG4gKiBVcGRhdGUgYSBzdHlsZSBiaW5kaW5nIG9uIGFuIGVsZW1lbnQgd2l0aCB0aGUgcHJvdmlkZWQgdmFsdWUuXG4gKlxuICogSWYgdGhlIHN0eWxlIHZhbHVlIGlzIGZhbHN5IHRoZW4gaXQgd2lsbCBiZSByZW1vdmVkIGZyb20gdGhlIGVsZW1lbnRcbiAqIChvciBhc3NpZ25lZCBhIGRpZmZlcmVudCB2YWx1ZSBkZXBlbmRpbmcgaWYgdGhlcmUgYXJlIGFueSBzdHlsZXMgcGxhY2VkXG4gKiBvbiB0aGUgZWxlbWVudCB3aXRoIGBzdHlsZU1hcGAgb3IgYW55IHN0YXRpYyBzdHlsZXMgdGhhdCBhcmVcbiAqIHByZXNlbnQgZnJvbSB3aGVuIHRoZSBlbGVtZW50IHdhcyBjcmVhdGVkIHdpdGggYHN0eWxpbmdgKS5cbiAqXG4gKiBOb3RlIHRoYXQgdGhlIHN0eWxpbmcgZWxlbWVudCBpcyB1cGRhdGVkIGFzIHBhcnQgb2YgYHN0eWxpbmdBcHBseWAuXG4gKlxuICogQHBhcmFtIHByb3AgQSB2YWxpZCBDU1MgcHJvcGVydHkuXG4gKiBAcGFyYW0gdmFsdWUgTmV3IHZhbHVlIHRvIHdyaXRlIChgbnVsbGAgb3IgYW4gZW1wdHkgc3RyaW5nIHRvIHJlbW92ZSkuXG4gKiBAcGFyYW0gc3VmZml4IE9wdGlvbmFsIHN1ZmZpeC4gVXNlZCB3aXRoIHNjYWxhciB2YWx1ZXMgdG8gYWRkIHVuaXQgc3VjaCBhcyBgcHhgLlxuICogICAgICAgIE5vdGUgdGhhdCB3aGVuIGEgc3VmZml4IGlzIHByb3ZpZGVkIHRoZW4gdGhlIHVuZGVybHlpbmcgc2FuaXRpemVyIHdpbGxcbiAqICAgICAgICBiZSBpZ25vcmVkLlxuICpcbiAqIE5vdGUgdGhhdCB0aGlzIHdpbGwgYXBwbHkgdGhlIHByb3ZpZGVkIHN0eWxlIHZhbHVlIHRvIHRoZSBob3N0IGVsZW1lbnQgaWYgdGhpcyBmdW5jdGlvbiBpcyBjYWxsZWRcbiAqIHdpdGhpbiBhIGhvc3QgYmluZGluZyBmdW5jdGlvbi5cbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtXN0eWxlUHJvcChcbiAgICBwcm9wOiBzdHJpbmcsIHZhbHVlOiBzdHJpbmcgfCBudW1iZXIgfCBTYWZlVmFsdWUgfCBudWxsLCBzdWZmaXg/OiBzdHJpbmcgfCBudWxsKTogdm9pZCB7XG4gIHN0eWxlUHJvcEludGVybmFsKGdldFNlbGVjdGVkSW5kZXgoKSwgcHJvcCwgdmFsdWUsIHN1ZmZpeCk7XG59XG5cbi8qKlxuICogSW50ZXJuYWwgZnVuY3Rpb24gZm9yIGFwcGx5aW5nIGEgc2luZ2xlIHN0eWxlIHRvIGFuIGVsZW1lbnQuXG4gKlxuICogVGhlIHJlYXNvbiB3aHkgdGhpcyBmdW5jdGlvbiBoYXMgYmVlbiBzZXBhcmF0ZWQgZnJvbSBgybXJtXN0eWxlUHJvcGAgaXMgYmVjYXVzZVxuICogaXQgaXMgYWxzbyBjYWxsZWQgZnJvbSBgybXJtXN0eWxlUHJvcEludGVycG9sYXRlYC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHN0eWxlUHJvcEludGVybmFsKFxuICAgIGVsZW1lbnRJbmRleDogbnVtYmVyLCBwcm9wOiBzdHJpbmcsIHZhbHVlOiBzdHJpbmcgfCBudW1iZXIgfCBTYWZlVmFsdWUgfCBudWxsLFxuICAgIHN1ZmZpeD86IHN0cmluZyB8IG51bGwgfCB1bmRlZmluZWQpOiB2b2lkIHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuXG4gIC8vIGlmIGEgdmFsdWUgaXMgaW50ZXJwb2xhdGVkIHRoZW4gaXQgbWF5IHJlbmRlciBhIGBOT19DSEFOR0VgIHZhbHVlLlxuICAvLyBpbiB0aGlzIGNhc2Ugd2UgZG8gbm90IG5lZWQgdG8gZG8gYW55dGhpbmcsIGJ1dCB0aGUgYmluZGluZyBpbmRleFxuICAvLyBzdGlsbCBuZWVkcyB0byBiZSBpbmNyZW1lbnRlZCBiZWNhdXNlIGFsbCBzdHlsaW5nIGJpbmRpbmcgdmFsdWVzXG4gIC8vIGFyZSBzdG9yZWQgaW5zaWRlIG9mIHRoZSBsVmlldy5cbiAgY29uc3QgYmluZGluZ0luZGV4ID0gZ2V0QW5kSW5jcmVtZW50QmluZGluZ0luZGV4KGxWaWV3LCBmYWxzZSk7XG5cbiAgY29uc3QgdXBkYXRlZCA9XG4gICAgICBzdHlsaW5nUHJvcChlbGVtZW50SW5kZXgsIGJpbmRpbmdJbmRleCwgcHJvcCwgcmVzb2x2ZVN0eWxlUHJvcFZhbHVlKHZhbHVlLCBzdWZmaXgpLCBmYWxzZSk7XG4gIGlmIChuZ0Rldk1vZGUpIHtcbiAgICBuZ0Rldk1vZGUuc3R5bGVQcm9wKys7XG4gICAgaWYgKHVwZGF0ZWQpIHtcbiAgICAgIG5nRGV2TW9kZS5zdHlsZVByb3BDYWNoZU1pc3MrKztcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBVcGRhdGUgYSBjbGFzcyBiaW5kaW5nIG9uIGFuIGVsZW1lbnQgd2l0aCB0aGUgcHJvdmlkZWQgdmFsdWUuXG4gKlxuICogVGhpcyBpbnN0cnVjdGlvbiBpcyBtZWFudCB0byBoYW5kbGUgdGhlIGBbY2xhc3MuZm9vXT1cImV4cFwiYCBjYXNlIGFuZCxcbiAqIHRoZXJlZm9yZSwgdGhlIGNsYXNzIGJpbmRpbmcgaXRzZWxmIG11c3QgYWxyZWFkeSBiZSBhbGxvY2F0ZWQgdXNpbmdcbiAqIGBzdHlsaW5nYCB3aXRoaW4gdGhlIGNyZWF0aW9uIGJsb2NrLlxuICpcbiAqIEBwYXJhbSBwcm9wIEEgdmFsaWQgQ1NTIGNsYXNzIChvbmx5IG9uZSkuXG4gKiBAcGFyYW0gdmFsdWUgQSB0cnVlL2ZhbHNlIHZhbHVlIHdoaWNoIHdpbGwgdHVybiB0aGUgY2xhc3Mgb24gb3Igb2ZmLlxuICpcbiAqIE5vdGUgdGhhdCB0aGlzIHdpbGwgYXBwbHkgdGhlIHByb3ZpZGVkIGNsYXNzIHZhbHVlIHRvIHRoZSBob3N0IGVsZW1lbnQgaWYgdGhpcyBmdW5jdGlvblxuICogaXMgY2FsbGVkIHdpdGhpbiBhIGhvc3QgYmluZGluZyBmdW5jdGlvbi5cbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWNsYXNzUHJvcChjbGFzc05hbWU6IHN0cmluZywgdmFsdWU6IGJvb2xlYW4gfCBudWxsKTogdm9pZCB7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcblxuICAvLyBpZiBhIHZhbHVlIGlzIGludGVycG9sYXRlZCB0aGVuIGl0IG1heSByZW5kZXIgYSBgTk9fQ0hBTkdFYCB2YWx1ZS5cbiAgLy8gaW4gdGhpcyBjYXNlIHdlIGRvIG5vdCBuZWVkIHRvIGRvIGFueXRoaW5nLCBidXQgdGhlIGJpbmRpbmcgaW5kZXhcbiAgLy8gc3RpbGwgbmVlZHMgdG8gYmUgaW5jcmVtZW50ZWQgYmVjYXVzZSBhbGwgc3R5bGluZyBiaW5kaW5nIHZhbHVlc1xuICAvLyBhcmUgc3RvcmVkIGluc2lkZSBvZiB0aGUgbFZpZXcuXG4gIGNvbnN0IGJpbmRpbmdJbmRleCA9IGdldEFuZEluY3JlbWVudEJpbmRpbmdJbmRleChsVmlldywgZmFsc2UpO1xuXG4gIGNvbnN0IHVwZGF0ZWQgPSBzdHlsaW5nUHJvcChnZXRTZWxlY3RlZEluZGV4KCksIGJpbmRpbmdJbmRleCwgY2xhc3NOYW1lLCB2YWx1ZSwgdHJ1ZSk7XG4gIGlmIChuZ0Rldk1vZGUpIHtcbiAgICBuZ0Rldk1vZGUuY2xhc3NQcm9wKys7XG4gICAgaWYgKHVwZGF0ZWQpIHtcbiAgICAgIG5nRGV2TW9kZS5jbGFzc1Byb3BDYWNoZU1pc3MrKztcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBTaGFyZWQgZnVuY3Rpb24gdXNlZCB0byB1cGRhdGUgYSBwcm9wLWJhc2VkIHN0eWxpbmcgYmluZGluZyBmb3IgYW4gZWxlbWVudC5cbiAqXG4gKiBEZXBlbmRpbmcgb24gdGhlIHN0YXRlIG9mIHRoZSBgdE5vZGUuc3R5bGVzYCBzdHlsZXMgY29udGV4dCwgdGhlIHN0eWxlL3Byb3BcbiAqIHZhbHVlIG1heSBiZSBhcHBsaWVkIGRpcmVjdGx5IHRvIHRoZSBlbGVtZW50IGluc3RlYWQgb2YgYmVpbmcgcHJvY2Vzc2VkXG4gKiB0aHJvdWdoIHRoZSBjb250ZXh0LiBUaGUgcmVhc29uIHdoeSB0aGlzIG9jY3VycyBpcyBmb3IgcGVyZm9ybWFuY2UgYW5kIGZ1bGx5XG4gKiBkZXBlbmRzIG9uIHRoZSBzdGF0ZSBvZiB0aGUgY29udGV4dCAoaS5lLiB3aGV0aGVyIG9yIG5vdCB0aGVyZSBhcmUgZHVwbGljYXRlXG4gKiBiaW5kaW5ncyBvciB3aGV0aGVyIG9yIG5vdCB0aGVyZSBhcmUgbWFwLWJhc2VkIGJpbmRpbmdzIGFuZCBwcm9wZXJ0eSBiaW5kaW5nc1xuICogcHJlc2VudCB0b2dldGhlcikuXG4gKi9cbmZ1bmN0aW9uIHN0eWxpbmdQcm9wKFxuICAgIGVsZW1lbnRJbmRleDogbnVtYmVyLCBiaW5kaW5nSW5kZXg6IG51bWJlciwgcHJvcDogc3RyaW5nLFxuICAgIHZhbHVlOiBib29sZWFuIHwgbnVtYmVyIHwgU2FmZVZhbHVlIHwgc3RyaW5nIHwgbnVsbCB8IHVuZGVmaW5lZCB8IE5PX0NIQU5HRSxcbiAgICBpc0NsYXNzQmFzZWQ6IGJvb2xlYW4pOiBib29sZWFuIHtcbiAgbGV0IHVwZGF0ZWQgPSBmYWxzZTtcblxuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IHROb2RlID0gZ2V0VE5vZGUoZWxlbWVudEluZGV4LCBsVmlldyk7XG4gIGNvbnN0IG5hdGl2ZSA9IGdldE5hdGl2ZUJ5VE5vZGUodE5vZGUsIGxWaWV3KSBhcyBSRWxlbWVudDtcblxuICBjb25zdCBob3N0QmluZGluZ3NNb2RlID0gaXNIb3N0U3R5bGluZygpO1xuICBjb25zdCBjb250ZXh0ID0gaXNDbGFzc0Jhc2VkID8gZ2V0Q2xhc3Nlc0NvbnRleHQodE5vZGUpIDogZ2V0U3R5bGVzQ29udGV4dCh0Tm9kZSk7XG4gIGNvbnN0IHNhbml0aXplciA9IGlzQ2xhc3NCYXNlZCA/IG51bGwgOiBnZXRDdXJyZW50U3R5bGVTYW5pdGl6ZXIoKTtcblxuICAvLyB3ZSBjaGVjayBmb3IgdGhpcyBpbiB0aGUgaW5zdHJ1Y3Rpb24gY29kZSBzbyB0aGF0IHRoZSBjb250ZXh0IGNhbiBiZSBub3RpZmllZFxuICAvLyBhYm91dCBwcm9wIG9yIG1hcCBiaW5kaW5ncyBzbyB0aGF0IHRoZSBkaXJlY3QgYXBwbHkgY2hlY2sgY2FuIGRlY2lkZSBlYXJsaWVyXG4gIC8vIGlmIGl0IGFsbG93cyBmb3IgY29udGV4dCByZXNvbHV0aW9uIHRvIGJlIGJ5cGFzc2VkLlxuICBpZiAoIWlzQ29udGV4dExvY2tlZChjb250ZXh0LCBob3N0QmluZGluZ3NNb2RlKSkge1xuICAgIHBhdGNoQ29uZmlnKGNvbnRleHQsIFRTdHlsaW5nQ29uZmlnLkhhc1Byb3BCaW5kaW5ncyk7XG4gIH1cblxuICAvLyBbc3R5bGUucHJvcF0gYW5kIFtjbGFzcy5uYW1lXSBiaW5kaW5ncyBkbyBub3QgdXNlIGBiaW5kKClgIGFuZCB3aWxsXG4gIC8vIHRoZXJlZm9yZSBtYW5hZ2UgYWNjZXNzaW5nIGFuZCB1cGRhdGluZyB0aGUgbmV3IHZhbHVlIGluIHRoZSBsVmlldyBkaXJlY3RseS5cbiAgLy8gRm9yIHRoaXMgcmVhc29uLCB0aGUgY2hlY2tOb0NoYW5nZXMgc2l0dWF0aW9uIG11c3QgYWxzbyBiZSBoYW5kbGVkIGhlcmVcbiAgLy8gYXMgd2VsbC5cbiAgaWYgKG5nRGV2TW9kZSAmJiBnZXRDaGVja05vQ2hhbmdlc01vZGUoKSkge1xuICAgIGNvbnN0IG9sZFZhbHVlID0gZ2V0VmFsdWUobFZpZXcsIGJpbmRpbmdJbmRleCk7XG4gICAgaWYgKGhhc1ZhbHVlQ2hhbmdlZChvbGRWYWx1ZSwgdmFsdWUpKSB7XG4gICAgICB0aHJvd0Vycm9ySWZOb0NoYW5nZXNNb2RlKGZhbHNlLCBvbGRWYWx1ZSwgdmFsdWUpO1xuICAgIH1cbiAgfVxuXG4gIC8vIERpcmVjdCBBcHBseSBDYXNlOiBieXBhc3MgY29udGV4dCByZXNvbHV0aW9uIGFuZCBhcHBseSB0aGVcbiAgLy8gc3R5bGUvY2xhc3MgdmFsdWUgZGlyZWN0bHkgdG8gdGhlIGVsZW1lbnRcbiAgaWYgKGFsbG93RGlyZWN0U3R5bGluZyhjb250ZXh0LCBob3N0QmluZGluZ3NNb2RlKSkge1xuICAgIGNvbnN0IHNhbml0aXplclRvVXNlID0gaXNDbGFzc0Jhc2VkID8gbnVsbCA6IHNhbml0aXplcjtcbiAgICBjb25zdCByZW5kZXJlciA9IGdldFJlbmRlcmVyKHROb2RlLCBsVmlldyk7XG4gICAgdXBkYXRlZCA9IGFwcGx5U3R5bGluZ1ZhbHVlRGlyZWN0bHkoXG4gICAgICAgIHJlbmRlcmVyLCBjb250ZXh0LCBuYXRpdmUsIGxWaWV3LCBiaW5kaW5nSW5kZXgsIHByb3AsIHZhbHVlLCBpc0NsYXNzQmFzZWQsIHNhbml0aXplclRvVXNlKTtcblxuICAgIGlmIChzYW5pdGl6ZXJUb1VzZSkge1xuICAgICAgLy8gaXQncyBpbXBvcnRhbnQgd2UgcmVtb3ZlIHRoZSBjdXJyZW50IHN0eWxlIHNhbml0aXplciBvbmNlIHRoZVxuICAgICAgLy8gZWxlbWVudCBleGl0cywgb3RoZXJ3aXNlIGl0IHdpbGwgYmUgdXNlZCBieSB0aGUgbmV4dCBzdHlsaW5nXG4gICAgICAvLyBpbnN0cnVjdGlvbnMgZm9yIHRoZSBuZXh0IGVsZW1lbnQuXG4gICAgICBzZXRFbGVtZW50RXhpdEZuKHN0eWxpbmdBcHBseSk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIC8vIENvbnRleHQgUmVzb2x1dGlvbiAob3IgZmlyc3QgdXBkYXRlKSBDYXNlOiBzYXZlIHRoZSB2YWx1ZVxuICAgIC8vIGFuZCBkZWZlciB0byB0aGUgY29udGV4dCB0byBmbHVzaCBhbmQgYXBwbHkgdGhlIHN0eWxlL2NsYXNzIGJpbmRpbmdcbiAgICAvLyB2YWx1ZSB0byB0aGUgZWxlbWVudC5cbiAgICBjb25zdCBkaXJlY3RpdmVJbmRleCA9IGdldEFjdGl2ZURpcmVjdGl2ZUlkKCk7XG4gICAgaWYgKGlzQ2xhc3NCYXNlZCkge1xuICAgICAgdXBkYXRlZCA9IHVwZGF0ZUNsYXNzVmlhQ29udGV4dChcbiAgICAgICAgICBjb250ZXh0LCBsVmlldywgbmF0aXZlLCBkaXJlY3RpdmVJbmRleCwgcHJvcCwgYmluZGluZ0luZGV4LFxuICAgICAgICAgIHZhbHVlIGFzIHN0cmluZyB8IGJvb2xlYW4gfCBudWxsKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdXBkYXRlZCA9IHVwZGF0ZVN0eWxlVmlhQ29udGV4dChcbiAgICAgICAgICBjb250ZXh0LCBsVmlldywgbmF0aXZlLCBkaXJlY3RpdmVJbmRleCwgcHJvcCwgYmluZGluZ0luZGV4LFxuICAgICAgICAgIHZhbHVlIGFzIHN0cmluZyB8IFNhZmVWYWx1ZSB8IG51bGwsIHNhbml0aXplcik7XG4gICAgfVxuXG4gICAgc2V0RWxlbWVudEV4aXRGbihzdHlsaW5nQXBwbHkpO1xuICB9XG5cbiAgcmV0dXJuIHVwZGF0ZWQ7XG59XG5cbi8qKlxuICogVXBkYXRlIHN0eWxlIGJpbmRpbmdzIHVzaW5nIGFuIG9iamVjdCBsaXRlcmFsIG9uIGFuIGVsZW1lbnQuXG4gKlxuICogVGhpcyBpbnN0cnVjdGlvbiBpcyBtZWFudCB0byBhcHBseSBzdHlsaW5nIHZpYSB0aGUgYFtzdHlsZV09XCJleHBcImAgdGVtcGxhdGUgYmluZGluZ3MuXG4gKiBXaGVuIHN0eWxlcyBhcmUgYXBwbGllZCB0byB0aGUgZWxlbWVudCB0aGV5IHdpbGwgdGhlbiBiZSB1cGRhdGVkIHdpdGggcmVzcGVjdCB0b1xuICogYW55IHN0eWxlcy9jbGFzc2VzIHNldCB2aWEgYHN0eWxlUHJvcGAuIElmIGFueSBzdHlsZXMgYXJlIHNldCB0byBmYWxzeVxuICogdGhlbiB0aGV5IHdpbGwgYmUgcmVtb3ZlZCBmcm9tIHRoZSBlbGVtZW50LlxuICpcbiAqIE5vdGUgdGhhdCB0aGUgc3R5bGluZyBpbnN0cnVjdGlvbiB3aWxsIG5vdCBiZSBhcHBsaWVkIHVudGlsIGBzdHlsaW5nQXBwbHlgIGlzIGNhbGxlZC5cbiAqXG4gKiBAcGFyYW0gc3R5bGVzIEEga2V5L3ZhbHVlIHN0eWxlIG1hcCBvZiB0aGUgc3R5bGVzIHRoYXQgd2lsbCBiZSBhcHBsaWVkIHRvIHRoZSBnaXZlbiBlbGVtZW50LlxuICogICAgICAgIEFueSBtaXNzaW5nIHN0eWxlcyAodGhhdCBoYXZlIGFscmVhZHkgYmVlbiBhcHBsaWVkIHRvIHRoZSBlbGVtZW50IGJlZm9yZWhhbmQpIHdpbGwgYmVcbiAqICAgICAgICByZW1vdmVkICh1bnNldCkgZnJvbSB0aGUgZWxlbWVudCdzIHN0eWxpbmcuXG4gKlxuICogTm90ZSB0aGF0IHRoaXMgd2lsbCBhcHBseSB0aGUgcHJvdmlkZWQgc3R5bGVNYXAgdmFsdWUgdG8gdGhlIGhvc3QgZWxlbWVudCBpZiB0aGlzIGZ1bmN0aW9uXG4gKiBpcyBjYWxsZWQgd2l0aGluIGEgaG9zdCBiaW5kaW5nLlxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1c3R5bGVNYXAoc3R5bGVzOiB7W3N0eWxlTmFtZTogc3RyaW5nXTogYW55fSB8IE5PX0NIQU5HRSB8IG51bGwpOiB2b2lkIHtcbiAgY29uc3QgaW5kZXggPSBnZXRTZWxlY3RlZEluZGV4KCk7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgdE5vZGUgPSBnZXRUTm9kZShpbmRleCwgbFZpZXcpO1xuICBjb25zdCBjb250ZXh0ID0gZ2V0U3R5bGVzQ29udGV4dCh0Tm9kZSk7XG4gIGNvbnN0IGhhc0RpcmVjdGl2ZUlucHV0ID0gaGFzU3R5bGVJbnB1dCh0Tm9kZSk7XG5cbiAgLy8gaWYgYSB2YWx1ZSBpcyBpbnRlcnBvbGF0ZWQgdGhlbiBpdCBtYXkgcmVuZGVyIGEgYE5PX0NIQU5HRWAgdmFsdWUuXG4gIC8vIGluIHRoaXMgY2FzZSB3ZSBkbyBub3QgbmVlZCB0byBkbyBhbnl0aGluZywgYnV0IHRoZSBiaW5kaW5nIGluZGV4XG4gIC8vIHN0aWxsIG5lZWRzIHRvIGJlIGluY3JlbWVudGVkIGJlY2F1c2UgYWxsIHN0eWxpbmcgYmluZGluZyB2YWx1ZXNcbiAgLy8gYXJlIHN0b3JlZCBpbnNpZGUgb2YgdGhlIGxWaWV3LlxuICBjb25zdCBiaW5kaW5nSW5kZXggPSBnZXRBbmRJbmNyZW1lbnRCaW5kaW5nSW5kZXgobFZpZXcsIHRydWUpO1xuXG4gIC8vIGlucHV0cyBhcmUgb25seSBldmFsdWF0ZWQgZnJvbSBhIHRlbXBsYXRlIGJpbmRpbmcgaW50byBhIGRpcmVjdGl2ZSwgdGhlcmVmb3JlLFxuICAvLyB0aGVyZSBzaG91bGQgbm90IGJlIGEgc2l0dWF0aW9uIHdoZXJlIGEgZGlyZWN0aXZlIGhvc3QgYmluZGluZ3MgZnVuY3Rpb25cbiAgLy8gZXZhbHVhdGVzIHRoZSBpbnB1dHMgKHRoaXMgc2hvdWxkIG9ubHkgaGFwcGVuIGluIHRoZSB0ZW1wbGF0ZSBmdW5jdGlvbilcbiAgaWYgKCFpc0hvc3RTdHlsaW5nKCkgJiYgaGFzRGlyZWN0aXZlSW5wdXQgJiYgc3R5bGVzICE9PSBOT19DSEFOR0UpIHtcbiAgICB1cGRhdGVEaXJlY3RpdmVJbnB1dFZhbHVlKGNvbnRleHQsIGxWaWV3LCB0Tm9kZSwgYmluZGluZ0luZGV4LCBzdHlsZXMsIGZhbHNlKTtcbiAgICBzdHlsZXMgPSBOT19DSEFOR0U7XG4gIH1cblxuICBzdHlsaW5nTWFwKGNvbnRleHQsIHROb2RlLCBsVmlldywgYmluZGluZ0luZGV4LCBzdHlsZXMsIGZhbHNlLCBoYXNEaXJlY3RpdmVJbnB1dCk7XG59XG5cbi8qKlxuICogVXBkYXRlIGNsYXNzIGJpbmRpbmdzIHVzaW5nIGFuIG9iamVjdCBsaXRlcmFsIG9yIGNsYXNzLXN0cmluZyBvbiBhbiBlbGVtZW50LlxuICpcbiAqIFRoaXMgaW5zdHJ1Y3Rpb24gaXMgbWVhbnQgdG8gYXBwbHkgc3R5bGluZyB2aWEgdGhlIGBbY2xhc3NdPVwiZXhwXCJgIHRlbXBsYXRlIGJpbmRpbmdzLlxuICogV2hlbiBjbGFzc2VzIGFyZSBhcHBsaWVkIHRvIHRoZSBlbGVtZW50IHRoZXkgd2lsbCB0aGVuIGJlIHVwZGF0ZWQgd2l0aFxuICogcmVzcGVjdCB0byBhbnkgc3R5bGVzL2NsYXNzZXMgc2V0IHZpYSBgY2xhc3NQcm9wYC4gSWYgYW55XG4gKiBjbGFzc2VzIGFyZSBzZXQgdG8gZmFsc3kgdGhlbiB0aGV5IHdpbGwgYmUgcmVtb3ZlZCBmcm9tIHRoZSBlbGVtZW50LlxuICpcbiAqIE5vdGUgdGhhdCB0aGUgc3R5bGluZyBpbnN0cnVjdGlvbiB3aWxsIG5vdCBiZSBhcHBsaWVkIHVudGlsIGBzdHlsaW5nQXBwbHlgIGlzIGNhbGxlZC5cbiAqIE5vdGUgdGhhdCB0aGlzIHdpbGwgdGhlIHByb3ZpZGVkIGNsYXNzTWFwIHZhbHVlIHRvIHRoZSBob3N0IGVsZW1lbnQgaWYgdGhpcyBmdW5jdGlvbiBpcyBjYWxsZWRcbiAqIHdpdGhpbiBhIGhvc3QgYmluZGluZy5cbiAqXG4gKiBAcGFyYW0gY2xhc3NlcyBBIGtleS92YWx1ZSBtYXAgb3Igc3RyaW5nIG9mIENTUyBjbGFzc2VzIHRoYXQgd2lsbCBiZSBhZGRlZCB0byB0aGVcbiAqICAgICAgICBnaXZlbiBlbGVtZW50LiBBbnkgbWlzc2luZyBjbGFzc2VzICh0aGF0IGhhdmUgYWxyZWFkeSBiZWVuIGFwcGxpZWQgdG8gdGhlIGVsZW1lbnRcbiAqICAgICAgICBiZWZvcmVoYW5kKSB3aWxsIGJlIHJlbW92ZWQgKHVuc2V0KSBmcm9tIHRoZSBlbGVtZW50J3MgbGlzdCBvZiBDU1MgY2xhc3Nlcy5cbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWNsYXNzTWFwKGNsYXNzZXM6IHtbY2xhc3NOYW1lOiBzdHJpbmddOiBhbnl9IHwgTk9fQ0hBTkdFIHwgc3RyaW5nIHwgbnVsbCk6IHZvaWQge1xuICBjbGFzc01hcEludGVybmFsKGdldFNlbGVjdGVkSW5kZXgoKSwgY2xhc3Nlcyk7XG59XG5cbi8qKlxuICogSW50ZXJuYWwgZnVuY3Rpb24gZm9yIGFwcGx5aW5nIGEgY2xhc3Mgc3RyaW5nIG9yIGtleS92YWx1ZSBtYXAgb2YgY2xhc3NlcyB0byBhbiBlbGVtZW50LlxuICpcbiAqIFRoZSByZWFzb24gd2h5IHRoaXMgZnVuY3Rpb24gaGFzIGJlZW4gc2VwYXJhdGVkIGZyb20gYMm1ybVjbGFzc01hcGAgaXMgYmVjYXVzZVxuICogaXQgaXMgYWxzbyBjYWxsZWQgZnJvbSBgybXJtWNsYXNzTWFwSW50ZXJwb2xhdGVgLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY2xhc3NNYXBJbnRlcm5hbChcbiAgICBlbGVtZW50SW5kZXg6IG51bWJlciwgY2xhc3Nlczoge1tjbGFzc05hbWU6IHN0cmluZ106IGFueX0gfCBOT19DSEFOR0UgfCBzdHJpbmcgfCBudWxsKTogdm9pZCB7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgdE5vZGUgPSBnZXRUTm9kZShlbGVtZW50SW5kZXgsIGxWaWV3KTtcbiAgY29uc3QgY29udGV4dCA9IGdldENsYXNzZXNDb250ZXh0KHROb2RlKTtcbiAgY29uc3QgaGFzRGlyZWN0aXZlSW5wdXQgPSBoYXNDbGFzc0lucHV0KHROb2RlKTtcblxuICAvLyBpZiBhIHZhbHVlIGlzIGludGVycG9sYXRlZCB0aGVuIGl0IG1heSByZW5kZXIgYSBgTk9fQ0hBTkdFYCB2YWx1ZS5cbiAgLy8gaW4gdGhpcyBjYXNlIHdlIGRvIG5vdCBuZWVkIHRvIGRvIGFueXRoaW5nLCBidXQgdGhlIGJpbmRpbmcgaW5kZXhcbiAgLy8gc3RpbGwgbmVlZHMgdG8gYmUgaW5jcmVtZW50ZWQgYmVjYXVzZSBhbGwgc3R5bGluZyBiaW5kaW5nIHZhbHVlc1xuICAvLyBhcmUgc3RvcmVkIGluc2lkZSBvZiB0aGUgbFZpZXcuXG4gIGNvbnN0IGJpbmRpbmdJbmRleCA9IGdldEFuZEluY3JlbWVudEJpbmRpbmdJbmRleChsVmlldywgdHJ1ZSk7XG5cbiAgLy8gaW5wdXRzIGFyZSBvbmx5IGV2YWx1YXRlZCBmcm9tIGEgdGVtcGxhdGUgYmluZGluZyBpbnRvIGEgZGlyZWN0aXZlLCB0aGVyZWZvcmUsXG4gIC8vIHRoZXJlIHNob3VsZCBub3QgYmUgYSBzaXR1YXRpb24gd2hlcmUgYSBkaXJlY3RpdmUgaG9zdCBiaW5kaW5ncyBmdW5jdGlvblxuICAvLyBldmFsdWF0ZXMgdGhlIGlucHV0cyAodGhpcyBzaG91bGQgb25seSBoYXBwZW4gaW4gdGhlIHRlbXBsYXRlIGZ1bmN0aW9uKVxuICBpZiAoIWlzSG9zdFN0eWxpbmcoKSAmJiBoYXNEaXJlY3RpdmVJbnB1dCAmJiBjbGFzc2VzICE9PSBOT19DSEFOR0UpIHtcbiAgICB1cGRhdGVEaXJlY3RpdmVJbnB1dFZhbHVlKGNvbnRleHQsIGxWaWV3LCB0Tm9kZSwgYmluZGluZ0luZGV4LCBjbGFzc2VzLCB0cnVlKTtcbiAgICBjbGFzc2VzID0gTk9fQ0hBTkdFO1xuICB9XG5cbiAgc3R5bGluZ01hcChjb250ZXh0LCB0Tm9kZSwgbFZpZXcsIGJpbmRpbmdJbmRleCwgY2xhc3NlcywgdHJ1ZSwgaGFzRGlyZWN0aXZlSW5wdXQpO1xufVxuXG4vKipcbiAqIFNoYXJlZCBmdW5jdGlvbiB1c2VkIHRvIHVwZGF0ZSBhIG1hcC1iYXNlZCBzdHlsaW5nIGJpbmRpbmcgZm9yIGFuIGVsZW1lbnQuXG4gKlxuICogV2hlbiB0aGlzIGZ1bmN0aW9uIGlzIGNhbGxlZCBpdCB3aWxsIGFjdGl2YXRlIHN1cHBvcnQgZm9yIGBbc3R5bGVdYCBhbmRcbiAqIGBbY2xhc3NdYCBiaW5kaW5ncyBpbiBBbmd1bGFyLlxuICovXG5mdW5jdGlvbiBzdHlsaW5nTWFwKFxuICAgIGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCwgdE5vZGU6IFROb2RlLCBsVmlldzogTFZpZXcsIGJpbmRpbmdJbmRleDogbnVtYmVyLFxuICAgIHZhbHVlOiB7W2tleTogc3RyaW5nXTogYW55fSB8IHN0cmluZyB8IG51bGwsIGlzQ2xhc3NCYXNlZDogYm9vbGVhbixcbiAgICBoYXNEaXJlY3RpdmVJbnB1dDogYm9vbGVhbik6IHZvaWQge1xuICBjb25zdCBkaXJlY3RpdmVJbmRleCA9IGdldEFjdGl2ZURpcmVjdGl2ZUlkKCk7XG4gIGNvbnN0IG5hdGl2ZSA9IGdldE5hdGl2ZUJ5VE5vZGUodE5vZGUsIGxWaWV3KSBhcyBSRWxlbWVudDtcbiAgY29uc3Qgb2xkVmFsdWUgPSBnZXRWYWx1ZShsVmlldywgYmluZGluZ0luZGV4KTtcbiAgY29uc3QgaG9zdEJpbmRpbmdzTW9kZSA9IGlzSG9zdFN0eWxpbmcoKTtcbiAgY29uc3Qgc2FuaXRpemVyID0gZ2V0Q3VycmVudFN0eWxlU2FuaXRpemVyKCk7XG4gIGNvbnN0IHZhbHVlSGFzQ2hhbmdlZCA9IGhhc1ZhbHVlQ2hhbmdlZChvbGRWYWx1ZSwgdmFsdWUpO1xuXG4gIC8vIFtzdHlsZV0gYW5kIFtjbGFzc10gYmluZGluZ3MgZG8gbm90IHVzZSBgYmluZCgpYCBhbmQgd2lsbCB0aGVyZWZvcmVcbiAgLy8gbWFuYWdlIGFjY2Vzc2luZyBhbmQgdXBkYXRpbmcgdGhlIG5ldyB2YWx1ZSBpbiB0aGUgbFZpZXcgZGlyZWN0bHkuXG4gIC8vIEZvciB0aGlzIHJlYXNvbiwgdGhlIGNoZWNrTm9DaGFuZ2VzIHNpdHVhdGlvbiBtdXN0IGFsc28gYmUgaGFuZGxlZCBoZXJlXG4gIC8vIGFzIHdlbGwuXG4gIGlmIChuZ0Rldk1vZGUgJiYgdmFsdWVIYXNDaGFuZ2VkICYmIGdldENoZWNrTm9DaGFuZ2VzTW9kZSgpKSB7XG4gICAgdGhyb3dFcnJvcklmTm9DaGFuZ2VzTW9kZShmYWxzZSwgb2xkVmFsdWUsIHZhbHVlKTtcbiAgfVxuXG4gIC8vIHdlIGNoZWNrIGZvciB0aGlzIGluIHRoZSBpbnN0cnVjdGlvbiBjb2RlIHNvIHRoYXQgdGhlIGNvbnRleHQgY2FuIGJlIG5vdGlmaWVkXG4gIC8vIGFib3V0IHByb3Agb3IgbWFwIGJpbmRpbmdzIHNvIHRoYXQgdGhlIGRpcmVjdCBhcHBseSBjaGVjayBjYW4gZGVjaWRlIGVhcmxpZXJcbiAgLy8gaWYgaXQgYWxsb3dzIGZvciBjb250ZXh0IHJlc29sdXRpb24gdG8gYmUgYnlwYXNzZWQuXG4gIGlmICghaXNDb250ZXh0TG9ja2VkKGNvbnRleHQsIGhvc3RCaW5kaW5nc01vZGUpKSB7XG4gICAgcGF0Y2hDb25maWcoY29udGV4dCwgVFN0eWxpbmdDb25maWcuSGFzTWFwQmluZGluZ3MpO1xuICB9XG5cbiAgLy8gRGlyZWN0IEFwcGx5IENhc2U6IGJ5cGFzcyBjb250ZXh0IHJlc29sdXRpb24gYW5kIGFwcGx5IHRoZVxuICAvLyBzdHlsZS9jbGFzcyBtYXAgdmFsdWVzIGRpcmVjdGx5IHRvIHRoZSBlbGVtZW50XG4gIGlmIChhbGxvd0RpcmVjdFN0eWxpbmcoY29udGV4dCwgaG9zdEJpbmRpbmdzTW9kZSkpIHtcbiAgICBjb25zdCBzYW5pdGl6ZXJUb1VzZSA9IGlzQ2xhc3NCYXNlZCA/IG51bGwgOiBzYW5pdGl6ZXI7XG4gICAgY29uc3QgcmVuZGVyZXIgPSBnZXRSZW5kZXJlcih0Tm9kZSwgbFZpZXcpO1xuICAgIGFwcGx5U3R5bGluZ01hcERpcmVjdGx5KFxuICAgICAgICByZW5kZXJlciwgY29udGV4dCwgbmF0aXZlLCBsVmlldywgYmluZGluZ0luZGV4LCB2YWx1ZSwgaXNDbGFzc0Jhc2VkLCBzYW5pdGl6ZXJUb1VzZSxcbiAgICAgICAgdmFsdWVIYXNDaGFuZ2VkLCBoYXNEaXJlY3RpdmVJbnB1dCk7XG4gICAgaWYgKHNhbml0aXplclRvVXNlKSB7XG4gICAgICAvLyBpdCdzIGltcG9ydGFudCB3ZSByZW1vdmUgdGhlIGN1cnJlbnQgc3R5bGUgc2FuaXRpemVyIG9uY2UgdGhlXG4gICAgICAvLyBlbGVtZW50IGV4aXRzLCBvdGhlcndpc2UgaXQgd2lsbCBiZSB1c2VkIGJ5IHRoZSBuZXh0IHN0eWxpbmdcbiAgICAgIC8vIGluc3RydWN0aW9ucyBmb3IgdGhlIG5leHQgZWxlbWVudC5cbiAgICAgIHNldEVsZW1lbnRFeGl0Rm4oc3R5bGluZ0FwcGx5KTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgY29uc3Qgc3R5bGluZ01hcEFyciA9XG4gICAgICAgIHZhbHVlID09PSBOT19DSEFOR0UgPyBOT19DSEFOR0UgOiBub3JtYWxpemVJbnRvU3R5bGluZ01hcChvbGRWYWx1ZSwgdmFsdWUsICFpc0NsYXNzQmFzZWQpO1xuXG4gICAgYWN0aXZhdGVTdHlsaW5nTWFwRmVhdHVyZSgpO1xuXG4gICAgLy8gQ29udGV4dCBSZXNvbHV0aW9uIChvciBmaXJzdCB1cGRhdGUpIENhc2U6IHNhdmUgdGhlIG1hcCB2YWx1ZVxuICAgIC8vIGFuZCBkZWZlciB0byB0aGUgY29udGV4dCB0byBmbHVzaCBhbmQgYXBwbHkgdGhlIHN0eWxlL2NsYXNzIGJpbmRpbmdcbiAgICAvLyB2YWx1ZSB0byB0aGUgZWxlbWVudC5cbiAgICBpZiAoaXNDbGFzc0Jhc2VkKSB7XG4gICAgICB1cGRhdGVDbGFzc1ZpYUNvbnRleHQoXG4gICAgICAgICAgY29udGV4dCwgbFZpZXcsIG5hdGl2ZSwgZGlyZWN0aXZlSW5kZXgsIG51bGwsIGJpbmRpbmdJbmRleCwgc3R5bGluZ01hcEFycixcbiAgICAgICAgICB2YWx1ZUhhc0NoYW5nZWQpO1xuICAgIH0gZWxzZSB7XG4gICAgICB1cGRhdGVTdHlsZVZpYUNvbnRleHQoXG4gICAgICAgICAgY29udGV4dCwgbFZpZXcsIG5hdGl2ZSwgZGlyZWN0aXZlSW5kZXgsIG51bGwsIGJpbmRpbmdJbmRleCwgc3R5bGluZ01hcEFyciwgc2FuaXRpemVyLFxuICAgICAgICAgIHZhbHVlSGFzQ2hhbmdlZCk7XG4gICAgfVxuXG4gICAgc2V0RWxlbWVudEV4aXRGbihzdHlsaW5nQXBwbHkpO1xuICB9XG5cbiAgaWYgKG5nRGV2TW9kZSkge1xuICAgIGlzQ2xhc3NCYXNlZCA/IG5nRGV2TW9kZS5jbGFzc01hcCA6IG5nRGV2TW9kZS5zdHlsZU1hcCsrO1xuICAgIGlmICh2YWx1ZUhhc0NoYW5nZWQpIHtcbiAgICAgIGlzQ2xhc3NCYXNlZCA/IG5nRGV2TW9kZS5jbGFzc01hcENhY2hlTWlzcyA6IG5nRGV2TW9kZS5zdHlsZU1hcENhY2hlTWlzcysrO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIFdyaXRlcyBhIHZhbHVlIHRvIGEgZGlyZWN0aXZlJ3MgYHN0eWxlYCBvciBgY2xhc3NgIGlucHV0IGJpbmRpbmcgKGlmIGl0IGhhcyBjaGFuZ2VkKS5cbiAqXG4gKiBJZiBhIGRpcmVjdGl2ZSBoYXMgYSBgQElucHV0YCBiaW5kaW5nIHRoYXQgaXMgc2V0IG9uIGBzdHlsZWAgb3IgYGNsYXNzYCB0aGVuIHRoYXQgdmFsdWVcbiAqIHdpbGwgdGFrZSBwcmlvcml0eSBvdmVyIHRoZSB1bmRlcmx5aW5nIHN0eWxlL2NsYXNzIHN0eWxpbmcgYmluZGluZ3MuIFRoaXMgdmFsdWUgd2lsbFxuICogYmUgdXBkYXRlZCBmb3IgdGhlIGJpbmRpbmcgZWFjaCB0aW1lIGR1cmluZyBjaGFuZ2UgZGV0ZWN0aW9uLlxuICpcbiAqIFdoZW4gdGhpcyBvY2N1cnMgdGhpcyBmdW5jdGlvbiB3aWxsIGF0dGVtcHQgdG8gd3JpdGUgdGhlIHZhbHVlIHRvIHRoZSBpbnB1dCBiaW5kaW5nXG4gKiBkZXBlbmRpbmcgb24gdGhlIGZvbGxvd2luZyBzaXR1YXRpb25zOlxuICpcbiAqIC0gSWYgYG9sZFZhbHVlICE9PSBuZXdWYWx1ZWBcbiAqIC0gSWYgYG5ld1ZhbHVlYCBpcyBgbnVsbGAgKGJ1dCB0aGlzIGlzIHNraXBwZWQgaWYgaXQgaXMgZHVyaW5nIHRoZSBmaXJzdCB1cGRhdGUgcGFzcy0tXG4gKiAgICB3aGljaCBpcyB3aGVuIHRoZSBjb250ZXh0IGlzIG5vdCBsb2NrZWQgeWV0KVxuICovXG5mdW5jdGlvbiB1cGRhdGVEaXJlY3RpdmVJbnB1dFZhbHVlKFxuICAgIGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCwgbFZpZXc6IExWaWV3LCB0Tm9kZTogVE5vZGUsIGJpbmRpbmdJbmRleDogbnVtYmVyLCBuZXdWYWx1ZTogYW55LFxuICAgIGlzQ2xhc3NCYXNlZDogYm9vbGVhbik6IHZvaWQge1xuICBjb25zdCBvbGRWYWx1ZSA9IGxWaWV3W2JpbmRpbmdJbmRleF07XG4gIGlmIChvbGRWYWx1ZSAhPT0gbmV3VmFsdWUpIHtcbiAgICAvLyBldmVuIGlmIHRoZSB2YWx1ZSBoYXMgY2hhbmdlZCB3ZSBtYXkgbm90IHdhbnQgdG8gZW1pdCBpdCB0byB0aGVcbiAgICAvLyBkaXJlY3RpdmUgaW5wdXQocykgaW4gdGhlIGV2ZW50IHRoYXQgaXQgaXMgZmFsc3kgZHVyaW5nIHRoZVxuICAgIC8vIGZpcnN0IHVwZGF0ZSBwYXNzLlxuICAgIGlmIChuZXdWYWx1ZSB8fCBpc0NvbnRleHRMb2NrZWQoY29udGV4dCwgZmFsc2UpKSB7XG4gICAgICBjb25zdCBpbnB1dE5hbWU6IHN0cmluZyA9IGlzQ2xhc3NCYXNlZCA/IHNlbGVjdENsYXNzQmFzZWRJbnB1dE5hbWUodE5vZGUuaW5wdXRzICEpIDogJ3N0eWxlJztcbiAgICAgIGNvbnN0IGlucHV0cyA9IHROb2RlLmlucHV0cyAhW2lucHV0TmFtZV0gITtcbiAgICAgIGNvbnN0IGluaXRpYWxWYWx1ZSA9IGdldEluaXRpYWxTdHlsaW5nVmFsdWUoY29udGV4dCk7XG4gICAgICBjb25zdCB2YWx1ZSA9IG5vcm1hbGl6ZVN0eWxpbmdEaXJlY3RpdmVJbnB1dFZhbHVlKGluaXRpYWxWYWx1ZSwgbmV3VmFsdWUsIGlzQ2xhc3NCYXNlZCk7XG4gICAgICBzZXRJbnB1dHNGb3JQcm9wZXJ0eShsVmlldywgaW5wdXRzLCB2YWx1ZSk7XG4gICAgICBzZXRFbGVtZW50RXhpdEZuKHN0eWxpbmdBcHBseSk7XG4gICAgfVxuICAgIHNldFZhbHVlKGxWaWV3LCBiaW5kaW5nSW5kZXgsIG5ld1ZhbHVlKTtcbiAgfVxufVxuXG4vKipcbiAqIFJldHVybnMgdGhlIGFwcHJvcHJpYXRlIGRpcmVjdGl2ZSBpbnB1dCB2YWx1ZSBmb3IgYHN0eWxlYCBvciBgY2xhc3NgLlxuICpcbiAqIEVhcmxpZXIgdmVyc2lvbnMgb2YgQW5ndWxhciBleHBlY3QgYSBiaW5kaW5nIHZhbHVlIHRvIGJlIHBhc3NlZCBpbnRvIGRpcmVjdGl2ZSBjb2RlXG4gKiBleGFjdGx5IGFzIGl0IGlzIHVubGVzcyB0aGVyZSBpcyBhIHN0YXRpYyB2YWx1ZSBwcmVzZW50IChpbiB3aGljaCBjYXNlIGJvdGggdmFsdWVzXG4gKiB3aWxsIGJlIHN0cmluZ2lmaWVkIGFuZCBjb25jYXRlbmF0ZWQpLlxuICovXG5mdW5jdGlvbiBub3JtYWxpemVTdHlsaW5nRGlyZWN0aXZlSW5wdXRWYWx1ZShcbiAgICBpbml0aWFsVmFsdWU6IHN0cmluZywgYmluZGluZ1ZhbHVlOiBzdHJpbmcgfCB7W2tleTogc3RyaW5nXTogYW55fSB8IG51bGwsXG4gICAgaXNDbGFzc0Jhc2VkOiBib29sZWFuKSB7XG4gIGxldCB2YWx1ZSA9IGJpbmRpbmdWYWx1ZTtcblxuICAvLyB3ZSBvbmx5IGNvbmNhdCB2YWx1ZXMgaWYgdGhlcmUgaXMgYW4gaW5pdGlhbCB2YWx1ZSwgb3RoZXJ3aXNlIHdlIHJldHVybiB0aGUgdmFsdWUgYXMgaXMuXG4gIC8vIE5vdGUgdGhhdCB0aGlzIGlzIHRvIHNhdGlzZnkgYmFja3dhcmRzLWNvbXBhdGliaWxpdHkgaW4gQW5ndWxhci5cbiAgaWYgKGluaXRpYWxWYWx1ZS5sZW5ndGgpIHtcbiAgICBpZiAoaXNDbGFzc0Jhc2VkKSB7XG4gICAgICB2YWx1ZSA9IGNvbmNhdFN0cmluZyhpbml0aWFsVmFsdWUsIGZvcmNlQ2xhc3Nlc0FzU3RyaW5nKGJpbmRpbmdWYWx1ZSkpO1xuICAgIH0gZWxzZSB7XG4gICAgICB2YWx1ZSA9IGNvbmNhdFN0cmluZyhcbiAgICAgICAgICBpbml0aWFsVmFsdWUsXG4gICAgICAgICAgZm9yY2VTdHlsZXNBc1N0cmluZyhiaW5kaW5nVmFsdWUgYXN7W2tleTogc3RyaW5nXTogYW55fSB8IG51bGwgfCB1bmRlZmluZWQsIHRydWUpLCAnOycpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gdmFsdWU7XG59XG5cbi8qKlxuICogRmx1c2hlcyBhbGwgc3R5bGluZyBjb2RlIHRvIHRoZSBlbGVtZW50LlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gaXMgZGVzaWduZWQgdG8gYmUgc2NoZWR1bGVkIGZyb20gYW55IG9mIHRoZSBmb3VyIHN0eWxpbmcgaW5zdHJ1Y3Rpb25zXG4gKiBpbiB0aGlzIGZpbGUuIFdoZW4gY2FsbGVkIGl0IHdpbGwgZmx1c2ggYWxsIHN0eWxlIGFuZCBjbGFzcyBiaW5kaW5ncyB0byB0aGUgZWxlbWVudFxuICogdmlhIHRoZSBjb250ZXh0IHJlc29sdXRpb24gYWxnb3JpdGhtLlxuICovXG5mdW5jdGlvbiBzdHlsaW5nQXBwbHkoKTogdm9pZCB7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgZWxlbWVudEluZGV4ID0gZ2V0U2VsZWN0ZWRJbmRleCgpO1xuICBjb25zdCB0Tm9kZSA9IGdldFROb2RlKGVsZW1lbnRJbmRleCwgbFZpZXcpO1xuICBjb25zdCBuYXRpdmUgPSBnZXROYXRpdmVCeVROb2RlKHROb2RlLCBsVmlldykgYXMgUkVsZW1lbnQ7XG4gIGNvbnN0IGRpcmVjdGl2ZUluZGV4ID0gZ2V0QWN0aXZlRGlyZWN0aXZlSWQoKTtcbiAgY29uc3QgcmVuZGVyZXIgPSBnZXRSZW5kZXJlcih0Tm9kZSwgbFZpZXcpO1xuICBjb25zdCBzYW5pdGl6ZXIgPSBnZXRDdXJyZW50U3R5bGVTYW5pdGl6ZXIoKTtcbiAgY29uc3QgY2xhc3Nlc0NvbnRleHQgPSBpc1N0eWxpbmdDb250ZXh0KHROb2RlLmNsYXNzZXMpID8gdE5vZGUuY2xhc3NlcyBhcyBUU3R5bGluZ0NvbnRleHQgOiBudWxsO1xuICBjb25zdCBzdHlsZXNDb250ZXh0ID0gaXNTdHlsaW5nQ29udGV4dCh0Tm9kZS5zdHlsZXMpID8gdE5vZGUuc3R5bGVzIGFzIFRTdHlsaW5nQ29udGV4dCA6IG51bGw7XG4gIGZsdXNoU3R5bGluZyhyZW5kZXJlciwgbFZpZXcsIGNsYXNzZXNDb250ZXh0LCBzdHlsZXNDb250ZXh0LCBuYXRpdmUsIGRpcmVjdGl2ZUluZGV4LCBzYW5pdGl6ZXIpO1xuICByZXNldEN1cnJlbnRTdHlsZVNhbml0aXplcigpO1xufVxuXG5mdW5jdGlvbiBnZXRSZW5kZXJlcih0Tm9kZTogVE5vZGUsIGxWaWV3OiBMVmlldykge1xuICByZXR1cm4gdE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkVsZW1lbnQgPyBsVmlld1tSRU5ERVJFUl0gOiBudWxsO1xufVxuXG4vKipcbiAqIFNlYXJjaGVzIGFuZCBhc3NpZ25zIHByb3ZpZGVkIGFsbCBzdGF0aWMgc3R5bGUvY2xhc3MgZW50cmllcyAoZm91bmQgaW4gdGhlIGBhdHRyc2AgdmFsdWUpXG4gKiBhbmQgcmVnaXN0ZXJzIHRoZW0gaW4gdGhlaXIgcmVzcGVjdGl2ZSBzdHlsaW5nIGNvbnRleHRzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVnaXN0ZXJJbml0aWFsU3R5bGluZ09uVE5vZGUoXG4gICAgdE5vZGU6IFROb2RlLCBhdHRyczogVEF0dHJpYnV0ZXMsIHN0YXJ0SW5kZXg6IG51bWJlcik6IGJvb2xlYW4ge1xuICBsZXQgaGFzQWRkaXRpb25hbEluaXRpYWxTdHlsaW5nID0gZmFsc2U7XG4gIGxldCBzdHlsZXMgPSBnZXRTdHlsaW5nTWFwQXJyYXkodE5vZGUuc3R5bGVzKTtcbiAgbGV0IGNsYXNzZXMgPSBnZXRTdHlsaW5nTWFwQXJyYXkodE5vZGUuY2xhc3Nlcyk7XG4gIGxldCBtb2RlID0gLTE7XG4gIGZvciAobGV0IGkgPSBzdGFydEluZGV4OyBpIDwgYXR0cnMubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCBhdHRyID0gYXR0cnNbaV0gYXMgc3RyaW5nO1xuICAgIGlmICh0eXBlb2YgYXR0ciA9PSAnbnVtYmVyJykge1xuICAgICAgbW9kZSA9IGF0dHI7XG4gICAgfSBlbHNlIGlmIChtb2RlID09IEF0dHJpYnV0ZU1hcmtlci5DbGFzc2VzKSB7XG4gICAgICBjbGFzc2VzID0gY2xhc3NlcyB8fCBhbGxvY1N0eWxpbmdNYXBBcnJheShudWxsKTtcbiAgICAgIGFkZEl0ZW1Ub1N0eWxpbmdNYXAoY2xhc3NlcywgYXR0ciwgdHJ1ZSk7XG4gICAgICBoYXNBZGRpdGlvbmFsSW5pdGlhbFN0eWxpbmcgPSB0cnVlO1xuICAgIH0gZWxzZSBpZiAobW9kZSA9PSBBdHRyaWJ1dGVNYXJrZXIuU3R5bGVzKSB7XG4gICAgICBjb25zdCB2YWx1ZSA9IGF0dHJzWysraV0gYXMgc3RyaW5nIHwgbnVsbDtcbiAgICAgIHN0eWxlcyA9IHN0eWxlcyB8fCBhbGxvY1N0eWxpbmdNYXBBcnJheShudWxsKTtcbiAgICAgIGFkZEl0ZW1Ub1N0eWxpbmdNYXAoc3R5bGVzLCBhdHRyLCB2YWx1ZSk7XG4gICAgICBoYXNBZGRpdGlvbmFsSW5pdGlhbFN0eWxpbmcgPSB0cnVlO1xuICAgIH1cbiAgfVxuXG4gIGlmIChjbGFzc2VzICYmIGNsYXNzZXMubGVuZ3RoID4gU3R5bGluZ01hcEFycmF5SW5kZXguVmFsdWVzU3RhcnRQb3NpdGlvbikge1xuICAgIGlmICghdE5vZGUuY2xhc3Nlcykge1xuICAgICAgdE5vZGUuY2xhc3NlcyA9IGNsYXNzZXM7XG4gICAgfVxuICAgIHVwZGF0ZVJhd1ZhbHVlT25Db250ZXh0KHROb2RlLmNsYXNzZXMsIHN0eWxpbmdNYXBUb1N0cmluZyhjbGFzc2VzLCB0cnVlKSk7XG4gIH1cblxuICBpZiAoc3R5bGVzICYmIHN0eWxlcy5sZW5ndGggPiBTdHlsaW5nTWFwQXJyYXlJbmRleC5WYWx1ZXNTdGFydFBvc2l0aW9uKSB7XG4gICAgaWYgKCF0Tm9kZS5zdHlsZXMpIHtcbiAgICAgIHROb2RlLnN0eWxlcyA9IHN0eWxlcztcbiAgICB9XG4gICAgdXBkYXRlUmF3VmFsdWVPbkNvbnRleHQodE5vZGUuc3R5bGVzLCBzdHlsaW5nTWFwVG9TdHJpbmcoc3R5bGVzLCBmYWxzZSkpO1xuICB9XG5cbiAgaWYgKGhhc0FkZGl0aW9uYWxJbml0aWFsU3R5bGluZykge1xuICAgIHROb2RlLmZsYWdzIHw9IFROb2RlRmxhZ3MuaGFzSW5pdGlhbFN0eWxpbmc7XG4gIH1cblxuICByZXR1cm4gaGFzQWRkaXRpb25hbEluaXRpYWxTdHlsaW5nO1xufVxuXG5mdW5jdGlvbiB1cGRhdGVSYXdWYWx1ZU9uQ29udGV4dChjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQgfCBTdHlsaW5nTWFwQXJyYXksIHZhbHVlOiBzdHJpbmcpIHtcbiAgY29uc3Qgc3R5bGluZ01hcEFyciA9IGdldFN0eWxpbmdNYXBBcnJheShjb250ZXh0KSAhO1xuICBzdHlsaW5nTWFwQXJyW1N0eWxpbmdNYXBBcnJheUluZGV4LlJhd1ZhbHVlUG9zaXRpb25dID0gdmFsdWU7XG59XG5cbmZ1bmN0aW9uIGdldFN0eWxlc0NvbnRleHQodE5vZGU6IFROb2RlKTogVFN0eWxpbmdDb250ZXh0IHtcbiAgcmV0dXJuIGdldENvbnRleHQodE5vZGUsIGZhbHNlKTtcbn1cblxuZnVuY3Rpb24gZ2V0Q2xhc3Nlc0NvbnRleHQodE5vZGU6IFROb2RlKTogVFN0eWxpbmdDb250ZXh0IHtcbiAgcmV0dXJuIGdldENvbnRleHQodE5vZGUsIHRydWUpO1xufVxuXG4vKipcbiAqIFJldHVybnMvaW5zdGFudGlhdGVzIGEgc3R5bGluZyBjb250ZXh0IGZyb20vdG8gYSBgdE5vZGVgIGluc3RhbmNlLlxuICovXG5mdW5jdGlvbiBnZXRDb250ZXh0KHROb2RlOiBUTm9kZSwgaXNDbGFzc0Jhc2VkOiBib29sZWFuKTogVFN0eWxpbmdDb250ZXh0IHtcbiAgbGV0IGNvbnRleHQgPSBpc0NsYXNzQmFzZWQgPyB0Tm9kZS5jbGFzc2VzIDogdE5vZGUuc3R5bGVzO1xuICBpZiAoIWlzU3R5bGluZ0NvbnRleHQoY29udGV4dCkpIHtcbiAgICBjb25zdCBoYXNEaXJlY3RpdmVzID0gaXNEaXJlY3RpdmVIb3N0KHROb2RlKTtcbiAgICBjb250ZXh0ID0gYWxsb2NUU3R5bGluZ0NvbnRleHQoY29udGV4dCBhcyBTdHlsaW5nTWFwQXJyYXkgfCBudWxsLCBoYXNEaXJlY3RpdmVzKTtcbiAgICBpZiAobmdEZXZNb2RlKSB7XG4gICAgICBhdHRhY2hTdHlsaW5nRGVidWdPYmplY3QoY29udGV4dCBhcyBUU3R5bGluZ0NvbnRleHQsIGlzQ2xhc3NCYXNlZCk7XG4gICAgfVxuXG4gICAgaWYgKGlzQ2xhc3NCYXNlZCkge1xuICAgICAgdE5vZGUuY2xhc3NlcyA9IGNvbnRleHQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIHROb2RlLnN0eWxlcyA9IGNvbnRleHQ7XG4gICAgfVxuICB9XG4gIHJldHVybiBjb250ZXh0IGFzIFRTdHlsaW5nQ29udGV4dDtcbn1cblxuZnVuY3Rpb24gcmVzb2x2ZVN0eWxlUHJvcFZhbHVlKFxuICAgIHZhbHVlOiBzdHJpbmcgfCBudW1iZXIgfCBTYWZlVmFsdWUgfCBudWxsIHwgTk9fQ0hBTkdFLFxuICAgIHN1ZmZpeDogc3RyaW5nIHwgbnVsbCB8IHVuZGVmaW5lZCk6IHN0cmluZ3xTYWZlVmFsdWV8bnVsbHx1bmRlZmluZWR8Tk9fQ0hBTkdFIHtcbiAgaWYgKHZhbHVlID09PSBOT19DSEFOR0UpIHJldHVybiB2YWx1ZTtcblxuICBsZXQgcmVzb2x2ZWRWYWx1ZTogc3RyaW5nfG51bGwgPSBudWxsO1xuICBpZiAodmFsdWUgIT09IG51bGwpIHtcbiAgICBpZiAoc3VmZml4KSB7XG4gICAgICAvLyB3aGVuIGEgc3VmZml4IGlzIGFwcGxpZWQgdGhlbiBpdCB3aWxsIGJ5cGFzc1xuICAgICAgLy8gc2FuaXRpemF0aW9uIGVudGlyZWx5IChiL2MgYSBuZXcgc3RyaW5nIGlzIGNyZWF0ZWQpXG4gICAgICByZXNvbHZlZFZhbHVlID0gcmVuZGVyU3RyaW5naWZ5KHZhbHVlKSArIHN1ZmZpeDtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gc2FuaXRpemF0aW9uIGhhcHBlbnMgYnkgZGVhbGluZyB3aXRoIGEgc3RyaW5nIHZhbHVlXG4gICAgICAvLyB0aGlzIG1lYW5zIHRoYXQgdGhlIHN0cmluZyB2YWx1ZSB3aWxsIGJlIHBhc3NlZCB0aHJvdWdoXG4gICAgICAvLyBpbnRvIHRoZSBzdHlsZSByZW5kZXJpbmcgbGF0ZXIgKHdoaWNoIGlzIHdoZXJlIHRoZSB2YWx1ZVxuICAgICAgLy8gd2lsbCBiZSBzYW5pdGl6ZWQgYmVmb3JlIGl0IGlzIGFwcGxpZWQpXG4gICAgICByZXNvbHZlZFZhbHVlID0gdmFsdWUgYXMgYW55IGFzIHN0cmluZztcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHJlc29sdmVkVmFsdWU7XG59XG5cbi8qKlxuICogV2hldGhlciBvciBub3QgdGhlIHN0eWxlL2NsYXNzIGJpbmRpbmcgYmVpbmcgYXBwbGllZCB3YXMgZXhlY3V0ZWQgd2l0aGluIGEgaG9zdCBiaW5kaW5nc1xuICogZnVuY3Rpb24uXG4gKi9cbmZ1bmN0aW9uIGlzSG9zdFN0eWxpbmcoKTogYm9vbGVhbiB7XG4gIHJldHVybiBpc0hvc3RTdHlsaW5nQWN0aXZlKGdldEFjdGl2ZURpcmVjdGl2ZUlkKCkpO1xufVxuXG5mdW5jdGlvbiBnZXRBbmRJbmNyZW1lbnRCaW5kaW5nSW5kZXgobFZpZXc6IExWaWV3LCBpc01hcEJhc2VkOiBib29sZWFuKTogbnVtYmVyIHtcbiAgLy8gbWFwLWJhc2VkIGJpbmRpbmdzIHVzZSB0d28gc2xvdHMgYmVjYXVzZSB0aGUgcHJldmlvdXNseSBjb25zdHJ1Y3RlZFxuICAvLyBjbGFzc05hbWUgLyBzdHlsZSB2YWx1ZSBtdXN0IGJlIGNvbXBhcmVkIGFnYWluc3QuXG4gIGNvbnN0IGluZGV4ID0gbFZpZXdbQklORElOR19JTkRFWF07XG4gIGxWaWV3W0JJTkRJTkdfSU5ERVhdICs9IGlzTWFwQmFzZWQgPyAyIDogMTtcbiAgcmV0dXJuIGluZGV4O1xufVxuIl19