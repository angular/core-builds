/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
import { throwErrorIfNoChangesMode } from '../errors';
import { setInputsForProperty } from '../instructions/shared';
import { isDirectiveHost } from '../interfaces/type_checks';
import { RENDERER, TVIEW } from '../interfaces/view';
import { getActiveDirectiveId, getCheckNoChangesMode, getCurrentStyleSanitizer, getLView, getSelectedIndex, incrementBindingIndex, nextBindingIndex, resetCurrentStyleSanitizer, setCurrentStyleSanitizer, setElementExitFn } from '../state';
import { applyStylingMapDirectly, applyStylingValueDirectly, flushStyling, updateClassViaContext, updateStyleViaContext } from '../styling/bindings';
import { activateStylingMapFeature } from '../styling/map_based_bindings';
import { attachStylingDebugObject } from '../styling/styling_debug';
import { NO_CHANGE } from '../tokens';
import { renderStringify } from '../util/misc_utils';
import { addItemToStylingMap, allocStylingMapArray, allocTStylingContext, allowDirectStyling, concatString, forceClassesAsString, forceStylesAsString, getInitialStylingValue, getStylingMapArray, getValue, hasClassInput, hasStyleInput, hasValueChanged, isHostStylingActive, isStylingContext, isStylingValueDefined, normalizeIntoStylingMap, patchConfig, selectClassBasedInputName, setValue, stylingMapToString } from '../util/styling_utils';
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
    // if a value is interpolated then it may render a `NO_CHANGE` value.
    // in this case we do not need to do anything, but the binding index
    // still needs to be incremented because all styling binding values
    // are stored inside of the lView.
    /** @type {?} */
    const bindingIndex = nextBindingIndex();
    /** @type {?} */
    const lView = getLView();
    /** @type {?} */
    const tNode = getTNode(elementIndex, lView);
    /** @type {?} */
    const firstUpdatePass = lView[TVIEW].firstUpdatePass;
    // we check for this in the instruction code so that the context can be notified
    // about prop or map bindings so that the direct apply check can decide earlier
    // if it allows for context resolution to be bypassed.
    if (firstUpdatePass) {
        patchConfig(tNode, 32768 /* hasStylePropBindings */);
        patchHostStylingFlag(tNode, isHostStyling(), false);
    }
    /** @type {?} */
    const updated = stylingProp(tNode, firstUpdatePass, lView, bindingIndex, prop, resolveStylePropValue(value, suffix), false);
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
    // if a value is interpolated then it may render a `NO_CHANGE` value.
    // in this case we do not need to do anything, but the binding index
    // still needs to be incremented because all styling binding values
    // are stored inside of the lView.
    /** @type {?} */
    const bindingIndex = nextBindingIndex();
    /** @type {?} */
    const lView = getLView();
    /** @type {?} */
    const elementIndex = getSelectedIndex();
    /** @type {?} */
    const tNode = getTNode(elementIndex, lView);
    /** @type {?} */
    const firstUpdatePass = lView[TVIEW].firstUpdatePass;
    // we check for this in the instruction code so that the context can be notified
    // about prop or map bindings so that the direct apply check can decide earlier
    // if it allows for context resolution to be bypassed.
    if (firstUpdatePass) {
        patchConfig(tNode, 1024 /* hasClassPropBindings */);
        patchHostStylingFlag(tNode, isHostStyling(), true);
    }
    /** @type {?} */
    const updated = stylingProp(tNode, firstUpdatePass, lView, bindingIndex, className, value, true);
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
 * @param {?} tNode
 * @param {?} firstUpdatePass
 * @param {?} lView
 * @param {?} bindingIndex
 * @param {?} prop
 * @param {?} value
 * @param {?} isClassBased
 * @return {?}
 */
function stylingProp(tNode, firstUpdatePass, lView, bindingIndex, prop, value, isClassBased) {
    /** @type {?} */
    let updated = false;
    /** @type {?} */
    const native = (/** @type {?} */ (getNativeByTNode(tNode, lView)));
    /** @type {?} */
    const context = isClassBased ? getClassesContext(tNode) : getStylesContext(tNode);
    /** @type {?} */
    const sanitizer = isClassBased ? null : getCurrentStyleSanitizer();
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
    if (allowDirectStyling(tNode, isClassBased, firstUpdatePass)) {
        /** @type {?} */
        const sanitizerToUse = isClassBased ? null : sanitizer;
        /** @type {?} */
        const renderer = getRenderer(tNode, lView);
        updated = applyStylingValueDirectly(renderer, context, tNode, native, lView, bindingIndex, prop, value, isClassBased, sanitizerToUse);
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
            updated = updateClassViaContext(context, tNode, lView, native, directiveIndex, prop, bindingIndex, (/** @type {?} */ (value)), false, firstUpdatePass);
        }
        else {
            updated = updateStyleViaContext(context, tNode, lView, native, directiveIndex, prop, bindingIndex, (/** @type {?} */ (value)), sanitizer, false, firstUpdatePass);
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
    const firstUpdatePass = lView[TVIEW].firstUpdatePass;
    /** @type {?} */
    const context = getStylesContext(tNode);
    /** @type {?} */
    const hasDirectiveInput = hasStyleInput(tNode);
    // if a value is interpolated then it may render a `NO_CHANGE` value.
    // in this case we do not need to do anything, but the binding index
    // still needs to be incremented because all styling binding values
    // are stored inside of the lView.
    /** @type {?} */
    const bindingIndex = incrementBindingIndex(2);
    /** @type {?} */
    const hostBindingsMode = isHostStyling();
    // inputs are only evaluated from a template binding into a directive, therefore,
    // there should not be a situation where a directive host bindings function
    // evaluates the inputs (this should only happen in the template function)
    if (!hostBindingsMode && hasDirectiveInput && styles !== NO_CHANGE) {
        updateDirectiveInputValue(context, lView, tNode, bindingIndex, styles, false, firstUpdatePass);
        styles = NO_CHANGE;
    }
    // we check for this in the instruction code so that the context can be notified
    // about prop or map bindings so that the direct apply check can decide earlier
    // if it allows for context resolution to be bypassed.
    if (firstUpdatePass) {
        patchConfig(tNode, 16384 /* hasStyleMapBindings */);
        patchHostStylingFlag(tNode, isHostStyling(), false);
    }
    stylingMap(context, tNode, firstUpdatePass, lView, bindingIndex, styles, false, hasDirectiveInput);
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
    const firstUpdatePass = lView[TVIEW].firstUpdatePass;
    /** @type {?} */
    const context = getClassesContext(tNode);
    /** @type {?} */
    const hasDirectiveInput = hasClassInput(tNode);
    // if a value is interpolated then it may render a `NO_CHANGE` value.
    // in this case we do not need to do anything, but the binding index
    // still needs to be incremented because all styling binding values
    // are stored inside of the lView.
    /** @type {?} */
    const bindingIndex = incrementBindingIndex(2);
    /** @type {?} */
    const hostBindingsMode = isHostStyling();
    // inputs are only evaluated from a template binding into a directive, therefore,
    // there should not be a situation where a directive host bindings function
    // evaluates the inputs (this should only happen in the template function)
    if (!hostBindingsMode && hasDirectiveInput && classes !== NO_CHANGE) {
        updateDirectiveInputValue(context, lView, tNode, bindingIndex, classes, true, firstUpdatePass);
        classes = NO_CHANGE;
    }
    // we check for this in the instruction code so that the context can be notified
    // about prop or map bindings so that the direct apply check can decide earlier
    // if it allows for context resolution to be bypassed.
    if (firstUpdatePass) {
        patchConfig(tNode, 512 /* hasClassMapBindings */);
        patchHostStylingFlag(tNode, isHostStyling(), true);
    }
    stylingMap(context, tNode, firstUpdatePass, lView, bindingIndex, classes, true, hasDirectiveInput);
}
/**
 * Shared function used to update a map-based styling binding for an element.
 *
 * When this function is called it will activate support for `[style]` and
 * `[class]` bindings in Angular.
 * @param {?} context
 * @param {?} tNode
 * @param {?} firstUpdatePass
 * @param {?} lView
 * @param {?} bindingIndex
 * @param {?} value
 * @param {?} isClassBased
 * @param {?} hasDirectiveInput
 * @return {?}
 */
function stylingMap(context, tNode, firstUpdatePass, lView, bindingIndex, value, isClassBased, hasDirectiveInput) {
    /** @type {?} */
    const directiveIndex = getActiveDirectiveId();
    /** @type {?} */
    const native = (/** @type {?} */ (getNativeByTNode(tNode, lView)));
    /** @type {?} */
    const oldValue = getValue(lView, bindingIndex);
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
    // Direct Apply Case: bypass context resolution and apply the
    // style/class map values directly to the element
    if (allowDirectStyling(tNode, isClassBased, firstUpdatePass)) {
        /** @type {?} */
        const sanitizerToUse = isClassBased ? null : sanitizer;
        /** @type {?} */
        const renderer = getRenderer(tNode, lView);
        applyStylingMapDirectly(renderer, context, tNode, native, lView, bindingIndex, value, isClassBased, sanitizerToUse, valueHasChanged, hasDirectiveInput);
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
            updateClassViaContext(context, tNode, lView, native, directiveIndex, null, bindingIndex, stylingMapArr, valueHasChanged, firstUpdatePass);
        }
        else {
            updateStyleViaContext(context, tNode, lView, native, directiveIndex, null, bindingIndex, stylingMapArr, sanitizer, valueHasChanged, firstUpdatePass);
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
 * - If `newValue` is `null` (but this is skipped if it is during the first update pass)
 * @param {?} context
 * @param {?} lView
 * @param {?} tNode
 * @param {?} bindingIndex
 * @param {?} newValue
 * @param {?} isClassBased
 * @param {?} firstUpdatePass
 * @return {?}
 */
function updateDirectiveInputValue(context, lView, tNode, bindingIndex, newValue, isClassBased, firstUpdatePass) {
    /** @type {?} */
    const oldValue = getValue(lView, bindingIndex);
    if (hasValueChanged(oldValue, newValue)) {
        // even if the value has changed we may not want to emit it to the
        // directive input(s) in the event that it is falsy during the
        // first update pass.
        if (isStylingValueDefined(newValue) || !firstUpdatePass) {
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
            value = concatString(initialValue, forceStylesAsString(bindingValue, true), ';');
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
    const tView = lView[TVIEW];
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
    flushStyling(renderer, lView, tNode, classesContext, stylesContext, native, directiveIndex, sanitizer, tView.firstUpdatePass);
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
        tNode.flags |= 256 /* hasInitialStyling */;
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
            attachStylingDebugObject((/** @type {?} */ (context)), tNode, isClassBased);
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
 * @param {?} tNode
 * @param {?} hostBindingsMode
 * @param {?} isClassBased
 * @return {?}
 */
function patchHostStylingFlag(tNode, hostBindingsMode, isClassBased) {
    /** @type {?} */
    const flag = hostBindingsMode ?
        isClassBased ? 4096 /* hasHostClassBindings */ : 131072 /* hasHostStyleBindings */ :
        isClassBased ? 2048 /* hasTemplateClassBindings */ : 65536 /* hasTemplateStyleBindings */;
    patchConfig(tNode, flag);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3R5bGluZy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvaW5zdHJ1Y3Rpb25zL3N0eWxpbmcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7OztBQVNBLE9BQU8sRUFBQyx5QkFBeUIsRUFBQyxNQUFNLFdBQVcsQ0FBQztBQUNwRCxPQUFPLEVBQUMsb0JBQW9CLEVBQUMsTUFBTSx3QkFBd0IsQ0FBQztBQUk1RCxPQUFPLEVBQUMsZUFBZSxFQUFDLE1BQU0sMkJBQTJCLENBQUM7QUFDMUQsT0FBTyxFQUFRLFFBQVEsRUFBRSxLQUFLLEVBQVEsTUFBTSxvQkFBb0IsQ0FBQztBQUNqRSxPQUFPLEVBQUMsb0JBQW9CLEVBQUUscUJBQXFCLEVBQUUsd0JBQXdCLEVBQUUsUUFBUSxFQUFFLGdCQUFnQixFQUFFLHFCQUFxQixFQUFFLGdCQUFnQixFQUFFLDBCQUEwQixFQUFFLHdCQUF3QixFQUFFLGdCQUFnQixFQUFDLE1BQU0sVUFBVSxDQUFDO0FBQzVPLE9BQU8sRUFBQyx1QkFBdUIsRUFBRSx5QkFBeUIsRUFBRSxZQUFZLEVBQXNCLHFCQUFxQixFQUFFLHFCQUFxQixFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFDdkssT0FBTyxFQUFDLHlCQUF5QixFQUFDLE1BQU0sK0JBQStCLENBQUM7QUFDeEUsT0FBTyxFQUFDLHdCQUF3QixFQUFDLE1BQU0sMEJBQTBCLENBQUM7QUFDbEUsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLFdBQVcsQ0FBQztBQUNwQyxPQUFPLEVBQUMsZUFBZSxFQUFDLE1BQU0sb0JBQW9CLENBQUM7QUFDbkQsT0FBTyxFQUFDLG1CQUFtQixFQUFFLG9CQUFvQixFQUFFLG9CQUFvQixFQUFFLGtCQUFrQixFQUFFLFlBQVksRUFBRSxvQkFBb0IsRUFBRSxtQkFBbUIsRUFBRSxzQkFBc0IsRUFBRSxrQkFBa0IsRUFBRSxRQUFRLEVBQUUsYUFBYSxF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QUM7O1FBRWxDLGFBQWEsR0FBZ0IsSUFBSTtJQUNyQyxJQUFJLEtBQUssS0FBSyxJQUFJLEVBQUU7UUFDbEIsSUFBSSxNQUFNLEVBQUU7WUFDViwrQ0FBK0M7WUFDL0Msc0RBQXNEO1lBQ3RELGFBQWEsR0FBRyxlQUFlLENBQUMsS0FBSyxDQUFDLEdBQUcsTUFBTSxDQUFDO1NBQ2pEO2FBQU07WUFDTCxzREFBc0Q7WUFDdEQsMERBQTBEO1lBQzFELDJEQUEyRDtZQUMzRCwwQ0FBMEM7WUFDMUMsYUFBYSxHQUFHLG1CQUFBLG1CQUFBLEtBQUssRUFBTyxFQUFVLENBQUM7U0FDeEM7S0FDRjtJQUNELE9BQU8sYUFBYSxDQUFDO0FBQ3ZCLENBQUM7Ozs7OztBQU1ELFNBQVMsYUFBYTtJQUNwQixPQUFPLG1CQUFtQixDQUFDLG9CQUFvQixFQUFFLENBQUMsQ0FBQztBQUNyRCxDQUFDOzs7Ozs7O0FBRUQsU0FBUyxvQkFBb0IsQ0FBQyxLQUFZLEVBQUUsZ0JBQXlCLEVBQUUsWUFBcUI7O1VBQ3BGLElBQUksR0FBRyxnQkFBZ0IsQ0FBQyxDQUFDO1FBQzNCLFlBQVksQ0FBQyxDQUFDLGlDQUFpQyxDQUFDLGtDQUFnQyxDQUFDLENBQUM7UUFDbEYsWUFBWSxDQUFDLENBQUMscUNBQXFDLENBQUMscUNBQW9DO0lBQzVGLFdBQVcsQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLENBQUM7QUFDM0IsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuKiBAbGljZW5zZVxuKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbipcbiogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuKi9cbmltcG9ydCB7U2FmZVZhbHVlfSBmcm9tICcuLi8uLi9zYW5pdGl6YXRpb24vYnlwYXNzJztcbmltcG9ydCB7U3R5bGVTYW5pdGl6ZUZufSBmcm9tICcuLi8uLi9zYW5pdGl6YXRpb24vc3R5bGVfc2FuaXRpemVyJztcbmltcG9ydCB7dGhyb3dFcnJvcklmTm9DaGFuZ2VzTW9kZX0gZnJvbSAnLi4vZXJyb3JzJztcbmltcG9ydCB7c2V0SW5wdXRzRm9yUHJvcGVydHl9IGZyb20gJy4uL2luc3RydWN0aW9ucy9zaGFyZWQnO1xuaW1wb3J0IHtBdHRyaWJ1dGVNYXJrZXIsIFRBdHRyaWJ1dGVzLCBUTm9kZSwgVE5vZGVGbGFncywgVE5vZGVUeXBlfSBmcm9tICcuLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtSRWxlbWVudH0gZnJvbSAnLi4vaW50ZXJmYWNlcy9yZW5kZXJlcic7XG5pbXBvcnQge1N0eWxpbmdNYXBBcnJheSwgU3R5bGluZ01hcEFycmF5SW5kZXgsIFRTdHlsaW5nQ29udGV4dH0gZnJvbSAnLi4vaW50ZXJmYWNlcy9zdHlsaW5nJztcbmltcG9ydCB7aXNEaXJlY3RpdmVIb3N0fSBmcm9tICcuLi9pbnRlcmZhY2VzL3R5cGVfY2hlY2tzJztcbmltcG9ydCB7TFZpZXcsIFJFTkRFUkVSLCBUVklFVywgVFZpZXd9IGZyb20gJy4uL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge2dldEFjdGl2ZURpcmVjdGl2ZUlkLCBnZXRDaGVja05vQ2hhbmdlc01vZGUsIGdldEN1cnJlbnRTdHlsZVNhbml0aXplciwgZ2V0TFZpZXcsIGdldFNlbGVjdGVkSW5kZXgsIGluY3JlbWVudEJpbmRpbmdJbmRleCwgbmV4dEJpbmRpbmdJbmRleCwgcmVzZXRDdXJyZW50U3R5bGVTYW5pdGl6ZXIsIHNldEN1cnJlbnRTdHlsZVNhbml0aXplciwgc2V0RWxlbWVudEV4aXRGbn0gZnJvbSAnLi4vc3RhdGUnO1xuaW1wb3J0IHthcHBseVN0eWxpbmdNYXBEaXJlY3RseSwgYXBwbHlTdHlsaW5nVmFsdWVEaXJlY3RseSwgZmx1c2hTdHlsaW5nLCBzZXRDbGFzcywgc2V0U3R5bGUsIHVwZGF0ZUNsYXNzVmlhQ29udGV4dCwgdXBkYXRlU3R5bGVWaWFDb250ZXh0fSBmcm9tICcuLi9zdHlsaW5nL2JpbmRpbmdzJztcbmltcG9ydCB7YWN0aXZhdGVTdHlsaW5nTWFwRmVhdHVyZX0gZnJvbSAnLi4vc3R5bGluZy9tYXBfYmFzZWRfYmluZGluZ3MnO1xuaW1wb3J0IHthdHRhY2hTdHlsaW5nRGVidWdPYmplY3R9IGZyb20gJy4uL3N0eWxpbmcvc3R5bGluZ19kZWJ1Zyc7XG5pbXBvcnQge05PX0NIQU5HRX0gZnJvbSAnLi4vdG9rZW5zJztcbmltcG9ydCB7cmVuZGVyU3RyaW5naWZ5fSBmcm9tICcuLi91dGlsL21pc2NfdXRpbHMnO1xuaW1wb3J0IHthZGRJdGVtVG9TdHlsaW5nTWFwLCBhbGxvY1N0eWxpbmdNYXBBcnJheSwgYWxsb2NUU3R5bGluZ0NvbnRleHQsIGFsbG93RGlyZWN0U3R5bGluZywgY29uY2F0U3RyaW5nLCBmb3JjZUNsYXNzZXNBc1N0cmluZywgZm9yY2VTdHlsZXNBc1N0cmluZywgZ2V0SW5pdGlhbFN0eWxpbmdWYWx1ZSwgZ2V0U3R5bGluZ01hcEFycmF5LCBnZXRWYWx1ZSwgaGFzQ2xhc3NJbnB1dCwgaGFzU3R5bGVJbnB1dCwgaGFzVmFsdWVDaGFuZ2VkLCBpc0hvc3RTdHlsaW5nQWN0aXZlLCBpc1N0eWxpbmdDb250ZXh0LCBpc1N0eWxpbmdWYWx1ZURlZmluZWQsIG5vcm1hbGl6ZUludG9TdHlsaW5nTWFwLCBwYXRjaENvbmZpZywgc2VsZWN0Q2xhc3NCYXNlZElucHV0TmFtZSwgc2V0VmFsdWUsIHN0eWxpbmdNYXBUb1N0cmluZ30gZnJvbSAnLi4vdXRpbC9zdHlsaW5nX3V0aWxzJztcbmltcG9ydCB7Z2V0TmF0aXZlQnlUTm9kZSwgZ2V0VE5vZGV9IGZyb20gJy4uL3V0aWwvdmlld191dGlscyc7XG5cblxuXG4vKipcbiAqIC0tLS0tLS0tXG4gKlxuICogVGhpcyBmaWxlIGNvbnRhaW5zIHRoZSBjb3JlIGxvZ2ljIGZvciBob3cgc3R5bGluZyBpbnN0cnVjdGlvbnMgYXJlIHByb2Nlc3NlZCBpbiBBbmd1bGFyLlxuICpcbiAqIFRvIGxlYXJuIG1vcmUgYWJvdXQgdGhlIGFsZ29yaXRobSBzZWUgYFRTdHlsaW5nQ29udGV4dGAuXG4gKlxuICogLS0tLS0tLS1cbiAqL1xuXG4vKipcbiAqIFNldHMgdGhlIGN1cnJlbnQgc3R5bGUgc2FuaXRpemVyIGZ1bmN0aW9uIHdoaWNoIHdpbGwgdGhlbiBiZSB1c2VkXG4gKiB3aXRoaW4gYWxsIGZvbGxvdy11cCBwcm9wIGFuZCBtYXAtYmFzZWQgc3R5bGUgYmluZGluZyBpbnN0cnVjdGlvbnNcbiAqIGZvciB0aGUgZ2l2ZW4gZWxlbWVudC5cbiAqXG4gKiBOb3RlIHRoYXQgb25jZSBzdHlsaW5nIGhhcyBiZWVuIGFwcGxpZWQgdG8gdGhlIGVsZW1lbnQgKGkuZS4gb25jZVxuICogYGFkdmFuY2UobilgIGlzIGV4ZWN1dGVkIG9yIHRoZSBob3N0QmluZGluZ3MvdGVtcGxhdGUgZnVuY3Rpb24gZXhpdHMpXG4gKiB0aGVuIHRoZSBhY3RpdmUgYHNhbml0aXplckZuYCB3aWxsIGJlIHNldCB0byBgbnVsbGAuIFRoaXMgbWVhbnMgdGhhdFxuICogb25jZSBzdHlsaW5nIGlzIGFwcGxpZWQgdG8gYW5vdGhlciBlbGVtZW50IHRoZW4gYSBhbm90aGVyIGNhbGwgdG9cbiAqIGBzdHlsZVNhbml0aXplcmAgd2lsbCBuZWVkIHRvIGJlIG1hZGUuXG4gKlxuICogQHBhcmFtIHNhbml0aXplckZuIFRoZSBzYW5pdGl6YXRpb24gZnVuY3Rpb24gdGhhdCB3aWxsIGJlIHVzZWQgdG9cbiAqICAgICAgIHByb2Nlc3Mgc3R5bGUgcHJvcC92YWx1ZSBlbnRyaWVzLlxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1c3R5bGVTYW5pdGl6ZXIoc2FuaXRpemVyOiBTdHlsZVNhbml0aXplRm4gfCBudWxsKTogdm9pZCB7XG4gIHNldEN1cnJlbnRTdHlsZVNhbml0aXplcihzYW5pdGl6ZXIpO1xufVxuXG4vKipcbiAqIFVwZGF0ZSBhIHN0eWxlIGJpbmRpbmcgb24gYW4gZWxlbWVudCB3aXRoIHRoZSBwcm92aWRlZCB2YWx1ZS5cbiAqXG4gKiBJZiB0aGUgc3R5bGUgdmFsdWUgaXMgZmFsc3kgdGhlbiBpdCB3aWxsIGJlIHJlbW92ZWQgZnJvbSB0aGUgZWxlbWVudFxuICogKG9yIGFzc2lnbmVkIGEgZGlmZmVyZW50IHZhbHVlIGRlcGVuZGluZyBpZiB0aGVyZSBhcmUgYW55IHN0eWxlcyBwbGFjZWRcbiAqIG9uIHRoZSBlbGVtZW50IHdpdGggYHN0eWxlTWFwYCBvciBhbnkgc3RhdGljIHN0eWxlcyB0aGF0IGFyZVxuICogcHJlc2VudCBmcm9tIHdoZW4gdGhlIGVsZW1lbnQgd2FzIGNyZWF0ZWQgd2l0aCBgc3R5bGluZ2ApLlxuICpcbiAqIE5vdGUgdGhhdCB0aGUgc3R5bGluZyBlbGVtZW50IGlzIHVwZGF0ZWQgYXMgcGFydCBvZiBgc3R5bGluZ0FwcGx5YC5cbiAqXG4gKiBAcGFyYW0gcHJvcCBBIHZhbGlkIENTUyBwcm9wZXJ0eS5cbiAqIEBwYXJhbSB2YWx1ZSBOZXcgdmFsdWUgdG8gd3JpdGUgKGBudWxsYCBvciBhbiBlbXB0eSBzdHJpbmcgdG8gcmVtb3ZlKS5cbiAqIEBwYXJhbSBzdWZmaXggT3B0aW9uYWwgc3VmZml4LiBVc2VkIHdpdGggc2NhbGFyIHZhbHVlcyB0byBhZGQgdW5pdCBzdWNoIGFzIGBweGAuXG4gKiAgICAgICAgTm90ZSB0aGF0IHdoZW4gYSBzdWZmaXggaXMgcHJvdmlkZWQgdGhlbiB0aGUgdW5kZXJseWluZyBzYW5pdGl6ZXIgd2lsbFxuICogICAgICAgIGJlIGlnbm9yZWQuXG4gKlxuICogTm90ZSB0aGF0IHRoaXMgd2lsbCBhcHBseSB0aGUgcHJvdmlkZWQgc3R5bGUgdmFsdWUgdG8gdGhlIGhvc3QgZWxlbWVudCBpZiB0aGlzIGZ1bmN0aW9uIGlzIGNhbGxlZFxuICogd2l0aGluIGEgaG9zdCBiaW5kaW5nIGZ1bmN0aW9uLlxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1c3R5bGVQcm9wKFxuICAgIHByb3A6IHN0cmluZywgdmFsdWU6IHN0cmluZyB8IG51bWJlciB8IFNhZmVWYWx1ZSB8IG51bGwsIHN1ZmZpeD86IHN0cmluZyB8IG51bGwpOiB2b2lkIHtcbiAgc3R5bGVQcm9wSW50ZXJuYWwoZ2V0U2VsZWN0ZWRJbmRleCgpLCBwcm9wLCB2YWx1ZSwgc3VmZml4KTtcbn1cblxuLyoqXG4gKiBJbnRlcm5hbCBmdW5jdGlvbiBmb3IgYXBwbHlpbmcgYSBzaW5nbGUgc3R5bGUgdG8gYW4gZWxlbWVudC5cbiAqXG4gKiBUaGUgcmVhc29uIHdoeSB0aGlzIGZ1bmN0aW9uIGhhcyBiZWVuIHNlcGFyYXRlZCBmcm9tIGDJtcm1c3R5bGVQcm9wYCBpcyBiZWNhdXNlXG4gKiBpdCBpcyBhbHNvIGNhbGxlZCBmcm9tIGDJtcm1c3R5bGVQcm9wSW50ZXJwb2xhdGVgLlxuICovXG5leHBvcnQgZnVuY3Rpb24gc3R5bGVQcm9wSW50ZXJuYWwoXG4gICAgZWxlbWVudEluZGV4OiBudW1iZXIsIHByb3A6IHN0cmluZywgdmFsdWU6IHN0cmluZyB8IG51bWJlciB8IFNhZmVWYWx1ZSB8IG51bGwsXG4gICAgc3VmZml4Pzogc3RyaW5nIHwgbnVsbCB8IHVuZGVmaW5lZCk6IHZvaWQge1xuICAvLyBpZiBhIHZhbHVlIGlzIGludGVycG9sYXRlZCB0aGVuIGl0IG1heSByZW5kZXIgYSBgTk9fQ0hBTkdFYCB2YWx1ZS5cbiAgLy8gaW4gdGhpcyBjYXNlIHdlIGRvIG5vdCBuZWVkIHRvIGRvIGFueXRoaW5nLCBidXQgdGhlIGJpbmRpbmcgaW5kZXhcbiAgLy8gc3RpbGwgbmVlZHMgdG8gYmUgaW5jcmVtZW50ZWQgYmVjYXVzZSBhbGwgc3R5bGluZyBiaW5kaW5nIHZhbHVlc1xuICAvLyBhcmUgc3RvcmVkIGluc2lkZSBvZiB0aGUgbFZpZXcuXG4gIGNvbnN0IGJpbmRpbmdJbmRleCA9IG5leHRCaW5kaW5nSW5kZXgoKTtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCB0Tm9kZSA9IGdldFROb2RlKGVsZW1lbnRJbmRleCwgbFZpZXcpO1xuICBjb25zdCBmaXJzdFVwZGF0ZVBhc3MgPSBsVmlld1tUVklFV10uZmlyc3RVcGRhdGVQYXNzO1xuXG4gIC8vIHdlIGNoZWNrIGZvciB0aGlzIGluIHRoZSBpbnN0cnVjdGlvbiBjb2RlIHNvIHRoYXQgdGhlIGNvbnRleHQgY2FuIGJlIG5vdGlmaWVkXG4gIC8vIGFib3V0IHByb3Agb3IgbWFwIGJpbmRpbmdzIHNvIHRoYXQgdGhlIGRpcmVjdCBhcHBseSBjaGVjayBjYW4gZGVjaWRlIGVhcmxpZXJcbiAgLy8gaWYgaXQgYWxsb3dzIGZvciBjb250ZXh0IHJlc29sdXRpb24gdG8gYmUgYnlwYXNzZWQuXG4gIGlmIChmaXJzdFVwZGF0ZVBhc3MpIHtcbiAgICBwYXRjaENvbmZpZyh0Tm9kZSwgVE5vZGVGbGFncy5oYXNTdHlsZVByb3BCaW5kaW5ncyk7XG4gICAgcGF0Y2hIb3N0U3R5bGluZ0ZsYWcodE5vZGUsIGlzSG9zdFN0eWxpbmcoKSwgZmFsc2UpO1xuICB9XG5cbiAgY29uc3QgdXBkYXRlZCA9IHN0eWxpbmdQcm9wKFxuICAgICAgdE5vZGUsIGZpcnN0VXBkYXRlUGFzcywgbFZpZXcsIGJpbmRpbmdJbmRleCwgcHJvcCwgcmVzb2x2ZVN0eWxlUHJvcFZhbHVlKHZhbHVlLCBzdWZmaXgpLFxuICAgICAgZmFsc2UpO1xuICBpZiAobmdEZXZNb2RlKSB7XG4gICAgbmdEZXZNb2RlLnN0eWxlUHJvcCsrO1xuICAgIGlmICh1cGRhdGVkKSB7XG4gICAgICBuZ0Rldk1vZGUuc3R5bGVQcm9wQ2FjaGVNaXNzKys7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogVXBkYXRlIGEgY2xhc3MgYmluZGluZyBvbiBhbiBlbGVtZW50IHdpdGggdGhlIHByb3ZpZGVkIHZhbHVlLlxuICpcbiAqIFRoaXMgaW5zdHJ1Y3Rpb24gaXMgbWVhbnQgdG8gaGFuZGxlIHRoZSBgW2NsYXNzLmZvb109XCJleHBcImAgY2FzZSBhbmQsXG4gKiB0aGVyZWZvcmUsIHRoZSBjbGFzcyBiaW5kaW5nIGl0c2VsZiBtdXN0IGFscmVhZHkgYmUgYWxsb2NhdGVkIHVzaW5nXG4gKiBgc3R5bGluZ2Agd2l0aGluIHRoZSBjcmVhdGlvbiBibG9jay5cbiAqXG4gKiBAcGFyYW0gcHJvcCBBIHZhbGlkIENTUyBjbGFzcyAob25seSBvbmUpLlxuICogQHBhcmFtIHZhbHVlIEEgdHJ1ZS9mYWxzZSB2YWx1ZSB3aGljaCB3aWxsIHR1cm4gdGhlIGNsYXNzIG9uIG9yIG9mZi5cbiAqXG4gKiBOb3RlIHRoYXQgdGhpcyB3aWxsIGFwcGx5IHRoZSBwcm92aWRlZCBjbGFzcyB2YWx1ZSB0byB0aGUgaG9zdCBlbGVtZW50IGlmIHRoaXMgZnVuY3Rpb25cbiAqIGlzIGNhbGxlZCB3aXRoaW4gYSBob3N0IGJpbmRpbmcgZnVuY3Rpb24uXG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVjbGFzc1Byb3AoY2xhc3NOYW1lOiBzdHJpbmcsIHZhbHVlOiBib29sZWFuIHwgbnVsbCk6IHZvaWQge1xuICAvLyBpZiBhIHZhbHVlIGlzIGludGVycG9sYXRlZCB0aGVuIGl0IG1heSByZW5kZXIgYSBgTk9fQ0hBTkdFYCB2YWx1ZS5cbiAgLy8gaW4gdGhpcyBjYXNlIHdlIGRvIG5vdCBuZWVkIHRvIGRvIGFueXRoaW5nLCBidXQgdGhlIGJpbmRpbmcgaW5kZXhcbiAgLy8gc3RpbGwgbmVlZHMgdG8gYmUgaW5jcmVtZW50ZWQgYmVjYXVzZSBhbGwgc3R5bGluZyBiaW5kaW5nIHZhbHVlc1xuICAvLyBhcmUgc3RvcmVkIGluc2lkZSBvZiB0aGUgbFZpZXcuXG4gIGNvbnN0IGJpbmRpbmdJbmRleCA9IG5leHRCaW5kaW5nSW5kZXgoKTtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCBlbGVtZW50SW5kZXggPSBnZXRTZWxlY3RlZEluZGV4KCk7XG4gIGNvbnN0IHROb2RlID0gZ2V0VE5vZGUoZWxlbWVudEluZGV4LCBsVmlldyk7XG4gIGNvbnN0IGZpcnN0VXBkYXRlUGFzcyA9IGxWaWV3W1RWSUVXXS5maXJzdFVwZGF0ZVBhc3M7XG5cbiAgLy8gd2UgY2hlY2sgZm9yIHRoaXMgaW4gdGhlIGluc3RydWN0aW9uIGNvZGUgc28gdGhhdCB0aGUgY29udGV4dCBjYW4gYmUgbm90aWZpZWRcbiAgLy8gYWJvdXQgcHJvcCBvciBtYXAgYmluZGluZ3Mgc28gdGhhdCB0aGUgZGlyZWN0IGFwcGx5IGNoZWNrIGNhbiBkZWNpZGUgZWFybGllclxuICAvLyBpZiBpdCBhbGxvd3MgZm9yIGNvbnRleHQgcmVzb2x1dGlvbiB0byBiZSBieXBhc3NlZC5cbiAgaWYgKGZpcnN0VXBkYXRlUGFzcykge1xuICAgIHBhdGNoQ29uZmlnKHROb2RlLCBUTm9kZUZsYWdzLmhhc0NsYXNzUHJvcEJpbmRpbmdzKTtcbiAgICBwYXRjaEhvc3RTdHlsaW5nRmxhZyh0Tm9kZSwgaXNIb3N0U3R5bGluZygpLCB0cnVlKTtcbiAgfVxuXG4gIGNvbnN0IHVwZGF0ZWQgPSBzdHlsaW5nUHJvcCh0Tm9kZSwgZmlyc3RVcGRhdGVQYXNzLCBsVmlldywgYmluZGluZ0luZGV4LCBjbGFzc05hbWUsIHZhbHVlLCB0cnVlKTtcbiAgaWYgKG5nRGV2TW9kZSkge1xuICAgIG5nRGV2TW9kZS5jbGFzc1Byb3ArKztcbiAgICBpZiAodXBkYXRlZCkge1xuICAgICAgbmdEZXZNb2RlLmNsYXNzUHJvcENhY2hlTWlzcysrO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIFNoYXJlZCBmdW5jdGlvbiB1c2VkIHRvIHVwZGF0ZSBhIHByb3AtYmFzZWQgc3R5bGluZyBiaW5kaW5nIGZvciBhbiBlbGVtZW50LlxuICpcbiAqIERlcGVuZGluZyBvbiB0aGUgc3RhdGUgb2YgdGhlIGB0Tm9kZS5zdHlsZXNgIHN0eWxlcyBjb250ZXh0LCB0aGUgc3R5bGUvcHJvcFxuICogdmFsdWUgbWF5IGJlIGFwcGxpZWQgZGlyZWN0bHkgdG8gdGhlIGVsZW1lbnQgaW5zdGVhZCBvZiBiZWluZyBwcm9jZXNzZWRcbiAqIHRocm91Z2ggdGhlIGNvbnRleHQuIFRoZSByZWFzb24gd2h5IHRoaXMgb2NjdXJzIGlzIGZvciBwZXJmb3JtYW5jZSBhbmQgZnVsbHlcbiAqIGRlcGVuZHMgb24gdGhlIHN0YXRlIG9mIHRoZSBjb250ZXh0IChpLmUuIHdoZXRoZXIgb3Igbm90IHRoZXJlIGFyZSBkdXBsaWNhdGVcbiAqIGJpbmRpbmdzIG9yIHdoZXRoZXIgb3Igbm90IHRoZXJlIGFyZSBtYXAtYmFzZWQgYmluZGluZ3MgYW5kIHByb3BlcnR5IGJpbmRpbmdzXG4gKiBwcmVzZW50IHRvZ2V0aGVyKS5cbiAqL1xuZnVuY3Rpb24gc3R5bGluZ1Byb3AoXG4gICAgdE5vZGU6IFROb2RlLCBmaXJzdFVwZGF0ZVBhc3M6IGJvb2xlYW4sIGxWaWV3OiBMVmlldywgYmluZGluZ0luZGV4OiBudW1iZXIsIHByb3A6IHN0cmluZyxcbiAgICB2YWx1ZTogYm9vbGVhbiB8IG51bWJlciB8IFNhZmVWYWx1ZSB8IHN0cmluZyB8IG51bGwgfCB1bmRlZmluZWQgfCBOT19DSEFOR0UsXG4gICAgaXNDbGFzc0Jhc2VkOiBib29sZWFuKTogYm9vbGVhbiB7XG4gIGxldCB1cGRhdGVkID0gZmFsc2U7XG5cbiAgY29uc3QgbmF0aXZlID0gZ2V0TmF0aXZlQnlUTm9kZSh0Tm9kZSwgbFZpZXcpIGFzIFJFbGVtZW50O1xuICBjb25zdCBjb250ZXh0ID0gaXNDbGFzc0Jhc2VkID8gZ2V0Q2xhc3Nlc0NvbnRleHQodE5vZGUpIDogZ2V0U3R5bGVzQ29udGV4dCh0Tm9kZSk7XG4gIGNvbnN0IHNhbml0aXplciA9IGlzQ2xhc3NCYXNlZCA/IG51bGwgOiBnZXRDdXJyZW50U3R5bGVTYW5pdGl6ZXIoKTtcblxuICAvLyBbc3R5bGUucHJvcF0gYW5kIFtjbGFzcy5uYW1lXSBiaW5kaW5ncyBkbyBub3QgdXNlIGBiaW5kKClgIGFuZCB3aWxsXG4gIC8vIHRoZXJlZm9yZSBtYW5hZ2UgYWNjZXNzaW5nIGFuZCB1cGRhdGluZyB0aGUgbmV3IHZhbHVlIGluIHRoZSBsVmlldyBkaXJlY3RseS5cbiAgLy8gRm9yIHRoaXMgcmVhc29uLCB0aGUgY2hlY2tOb0NoYW5nZXMgc2l0dWF0aW9uIG11c3QgYWxzbyBiZSBoYW5kbGVkIGhlcmVcbiAgLy8gYXMgd2VsbC5cbiAgaWYgKG5nRGV2TW9kZSAmJiBnZXRDaGVja05vQ2hhbmdlc01vZGUoKSkge1xuICAgIGNvbnN0IG9sZFZhbHVlID0gZ2V0VmFsdWUobFZpZXcsIGJpbmRpbmdJbmRleCk7XG4gICAgaWYgKGhhc1ZhbHVlQ2hhbmdlZChvbGRWYWx1ZSwgdmFsdWUpKSB7XG4gICAgICB0aHJvd0Vycm9ySWZOb0NoYW5nZXNNb2RlKGZhbHNlLCBvbGRWYWx1ZSwgdmFsdWUpO1xuICAgIH1cbiAgfVxuXG4gIC8vIERpcmVjdCBBcHBseSBDYXNlOiBieXBhc3MgY29udGV4dCByZXNvbHV0aW9uIGFuZCBhcHBseSB0aGVcbiAgLy8gc3R5bGUvY2xhc3MgdmFsdWUgZGlyZWN0bHkgdG8gdGhlIGVsZW1lbnRcbiAgaWYgKGFsbG93RGlyZWN0U3R5bGluZyh0Tm9kZSwgaXNDbGFzc0Jhc2VkLCBmaXJzdFVwZGF0ZVBhc3MpKSB7XG4gICAgY29uc3Qgc2FuaXRpemVyVG9Vc2UgPSBpc0NsYXNzQmFzZWQgPyBudWxsIDogc2FuaXRpemVyO1xuICAgIGNvbnN0IHJlbmRlcmVyID0gZ2V0UmVuZGVyZXIodE5vZGUsIGxWaWV3KTtcbiAgICB1cGRhdGVkID0gYXBwbHlTdHlsaW5nVmFsdWVEaXJlY3RseShcbiAgICAgICAgcmVuZGVyZXIsIGNvbnRleHQsIHROb2RlLCBuYXRpdmUsIGxWaWV3LCBiaW5kaW5nSW5kZXgsIHByb3AsIHZhbHVlLCBpc0NsYXNzQmFzZWQsXG4gICAgICAgIHNhbml0aXplclRvVXNlKTtcblxuICAgIGlmIChzYW5pdGl6ZXJUb1VzZSkge1xuICAgICAgLy8gaXQncyBpbXBvcnRhbnQgd2UgcmVtb3ZlIHRoZSBjdXJyZW50IHN0eWxlIHNhbml0aXplciBvbmNlIHRoZVxuICAgICAgLy8gZWxlbWVudCBleGl0cywgb3RoZXJ3aXNlIGl0IHdpbGwgYmUgdXNlZCBieSB0aGUgbmV4dCBzdHlsaW5nXG4gICAgICAvLyBpbnN0cnVjdGlvbnMgZm9yIHRoZSBuZXh0IGVsZW1lbnQuXG4gICAgICBzZXRFbGVtZW50RXhpdEZuKHN0eWxpbmdBcHBseSk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIC8vIENvbnRleHQgUmVzb2x1dGlvbiAob3IgZmlyc3QgdXBkYXRlKSBDYXNlOiBzYXZlIHRoZSB2YWx1ZVxuICAgIC8vIGFuZCBkZWZlciB0byB0aGUgY29udGV4dCB0byBmbHVzaCBhbmQgYXBwbHkgdGhlIHN0eWxlL2NsYXNzIGJpbmRpbmdcbiAgICAvLyB2YWx1ZSB0byB0aGUgZWxlbWVudC5cbiAgICBjb25zdCBkaXJlY3RpdmVJbmRleCA9IGdldEFjdGl2ZURpcmVjdGl2ZUlkKCk7XG4gICAgaWYgKGlzQ2xhc3NCYXNlZCkge1xuICAgICAgdXBkYXRlZCA9IHVwZGF0ZUNsYXNzVmlhQ29udGV4dChcbiAgICAgICAgICBjb250ZXh0LCB0Tm9kZSwgbFZpZXcsIG5hdGl2ZSwgZGlyZWN0aXZlSW5kZXgsIHByb3AsIGJpbmRpbmdJbmRleCxcbiAgICAgICAgICB2YWx1ZSBhcyBzdHJpbmcgfCBib29sZWFuIHwgbnVsbCwgZmFsc2UsIGZpcnN0VXBkYXRlUGFzcyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHVwZGF0ZWQgPSB1cGRhdGVTdHlsZVZpYUNvbnRleHQoXG4gICAgICAgICAgY29udGV4dCwgdE5vZGUsIGxWaWV3LCBuYXRpdmUsIGRpcmVjdGl2ZUluZGV4LCBwcm9wLCBiaW5kaW5nSW5kZXgsXG4gICAgICAgICAgdmFsdWUgYXMgc3RyaW5nIHwgU2FmZVZhbHVlIHwgbnVsbCwgc2FuaXRpemVyLCBmYWxzZSwgZmlyc3RVcGRhdGVQYXNzKTtcbiAgICB9XG5cbiAgICBzZXRFbGVtZW50RXhpdEZuKHN0eWxpbmdBcHBseSk7XG4gIH1cblxuICByZXR1cm4gdXBkYXRlZDtcbn1cblxuLyoqXG4gKiBVcGRhdGUgc3R5bGUgYmluZGluZ3MgdXNpbmcgYW4gb2JqZWN0IGxpdGVyYWwgb24gYW4gZWxlbWVudC5cbiAqXG4gKiBUaGlzIGluc3RydWN0aW9uIGlzIG1lYW50IHRvIGFwcGx5IHN0eWxpbmcgdmlhIHRoZSBgW3N0eWxlXT1cImV4cFwiYCB0ZW1wbGF0ZSBiaW5kaW5ncy5cbiAqIFdoZW4gc3R5bGVzIGFyZSBhcHBsaWVkIHRvIHRoZSBlbGVtZW50IHRoZXkgd2lsbCB0aGVuIGJlIHVwZGF0ZWQgd2l0aCByZXNwZWN0IHRvXG4gKiBhbnkgc3R5bGVzL2NsYXNzZXMgc2V0IHZpYSBgc3R5bGVQcm9wYC4gSWYgYW55IHN0eWxlcyBhcmUgc2V0IHRvIGZhbHN5XG4gKiB0aGVuIHRoZXkgd2lsbCBiZSByZW1vdmVkIGZyb20gdGhlIGVsZW1lbnQuXG4gKlxuICogTm90ZSB0aGF0IHRoZSBzdHlsaW5nIGluc3RydWN0aW9uIHdpbGwgbm90IGJlIGFwcGxpZWQgdW50aWwgYHN0eWxpbmdBcHBseWAgaXMgY2FsbGVkLlxuICpcbiAqIEBwYXJhbSBzdHlsZXMgQSBrZXkvdmFsdWUgc3R5bGUgbWFwIG9mIHRoZSBzdHlsZXMgdGhhdCB3aWxsIGJlIGFwcGxpZWQgdG8gdGhlIGdpdmVuIGVsZW1lbnQuXG4gKiAgICAgICAgQW55IG1pc3Npbmcgc3R5bGVzICh0aGF0IGhhdmUgYWxyZWFkeSBiZWVuIGFwcGxpZWQgdG8gdGhlIGVsZW1lbnQgYmVmb3JlaGFuZCkgd2lsbCBiZVxuICogICAgICAgIHJlbW92ZWQgKHVuc2V0KSBmcm9tIHRoZSBlbGVtZW50J3Mgc3R5bGluZy5cbiAqXG4gKiBOb3RlIHRoYXQgdGhpcyB3aWxsIGFwcGx5IHRoZSBwcm92aWRlZCBzdHlsZU1hcCB2YWx1ZSB0byB0aGUgaG9zdCBlbGVtZW50IGlmIHRoaXMgZnVuY3Rpb25cbiAqIGlzIGNhbGxlZCB3aXRoaW4gYSBob3N0IGJpbmRpbmcuXG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVzdHlsZU1hcChzdHlsZXM6IHtbc3R5bGVOYW1lOiBzdHJpbmddOiBhbnl9IHwgTk9fQ0hBTkdFIHwgbnVsbCk6IHZvaWQge1xuICBjb25zdCBpbmRleCA9IGdldFNlbGVjdGVkSW5kZXgoKTtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCB0Tm9kZSA9IGdldFROb2RlKGluZGV4LCBsVmlldyk7XG4gIGNvbnN0IGZpcnN0VXBkYXRlUGFzcyA9IGxWaWV3W1RWSUVXXS5maXJzdFVwZGF0ZVBhc3M7XG4gIGNvbnN0IGNvbnRleHQgPSBnZXRTdHlsZXNDb250ZXh0KHROb2RlKTtcbiAgY29uc3QgaGFzRGlyZWN0aXZlSW5wdXQgPSBoYXNTdHlsZUlucHV0KHROb2RlKTtcblxuICAvLyBpZiBhIHZhbHVlIGlzIGludGVycG9sYXRlZCB0aGVuIGl0IG1heSByZW5kZXIgYSBgTk9fQ0hBTkdFYCB2YWx1ZS5cbiAgLy8gaW4gdGhpcyBjYXNlIHdlIGRvIG5vdCBuZWVkIHRvIGRvIGFueXRoaW5nLCBidXQgdGhlIGJpbmRpbmcgaW5kZXhcbiAgLy8gc3RpbGwgbmVlZHMgdG8gYmUgaW5jcmVtZW50ZWQgYmVjYXVzZSBhbGwgc3R5bGluZyBiaW5kaW5nIHZhbHVlc1xuICAvLyBhcmUgc3RvcmVkIGluc2lkZSBvZiB0aGUgbFZpZXcuXG4gIGNvbnN0IGJpbmRpbmdJbmRleCA9IGluY3JlbWVudEJpbmRpbmdJbmRleCgyKTtcbiAgY29uc3QgaG9zdEJpbmRpbmdzTW9kZSA9IGlzSG9zdFN0eWxpbmcoKTtcblxuICAvLyBpbnB1dHMgYXJlIG9ubHkgZXZhbHVhdGVkIGZyb20gYSB0ZW1wbGF0ZSBiaW5kaW5nIGludG8gYSBkaXJlY3RpdmUsIHRoZXJlZm9yZSxcbiAgLy8gdGhlcmUgc2hvdWxkIG5vdCBiZSBhIHNpdHVhdGlvbiB3aGVyZSBhIGRpcmVjdGl2ZSBob3N0IGJpbmRpbmdzIGZ1bmN0aW9uXG4gIC8vIGV2YWx1YXRlcyB0aGUgaW5wdXRzICh0aGlzIHNob3VsZCBvbmx5IGhhcHBlbiBpbiB0aGUgdGVtcGxhdGUgZnVuY3Rpb24pXG4gIGlmICghaG9zdEJpbmRpbmdzTW9kZSAmJiBoYXNEaXJlY3RpdmVJbnB1dCAmJiBzdHlsZXMgIT09IE5PX0NIQU5HRSkge1xuICAgIHVwZGF0ZURpcmVjdGl2ZUlucHV0VmFsdWUoY29udGV4dCwgbFZpZXcsIHROb2RlLCBiaW5kaW5nSW5kZXgsIHN0eWxlcywgZmFsc2UsIGZpcnN0VXBkYXRlUGFzcyk7XG4gICAgc3R5bGVzID0gTk9fQ0hBTkdFO1xuICB9XG5cbiAgLy8gd2UgY2hlY2sgZm9yIHRoaXMgaW4gdGhlIGluc3RydWN0aW9uIGNvZGUgc28gdGhhdCB0aGUgY29udGV4dCBjYW4gYmUgbm90aWZpZWRcbiAgLy8gYWJvdXQgcHJvcCBvciBtYXAgYmluZGluZ3Mgc28gdGhhdCB0aGUgZGlyZWN0IGFwcGx5IGNoZWNrIGNhbiBkZWNpZGUgZWFybGllclxuICAvLyBpZiBpdCBhbGxvd3MgZm9yIGNvbnRleHQgcmVzb2x1dGlvbiB0byBiZSBieXBhc3NlZC5cbiAgaWYgKGZpcnN0VXBkYXRlUGFzcykge1xuICAgIHBhdGNoQ29uZmlnKHROb2RlLCBUTm9kZUZsYWdzLmhhc1N0eWxlTWFwQmluZGluZ3MpO1xuICAgIHBhdGNoSG9zdFN0eWxpbmdGbGFnKHROb2RlLCBpc0hvc3RTdHlsaW5nKCksIGZhbHNlKTtcbiAgfVxuXG4gIHN0eWxpbmdNYXAoXG4gICAgICBjb250ZXh0LCB0Tm9kZSwgZmlyc3RVcGRhdGVQYXNzLCBsVmlldywgYmluZGluZ0luZGV4LCBzdHlsZXMsIGZhbHNlLCBoYXNEaXJlY3RpdmVJbnB1dCk7XG59XG5cbi8qKlxuICogVXBkYXRlIGNsYXNzIGJpbmRpbmdzIHVzaW5nIGFuIG9iamVjdCBsaXRlcmFsIG9yIGNsYXNzLXN0cmluZyBvbiBhbiBlbGVtZW50LlxuICpcbiAqIFRoaXMgaW5zdHJ1Y3Rpb24gaXMgbWVhbnQgdG8gYXBwbHkgc3R5bGluZyB2aWEgdGhlIGBbY2xhc3NdPVwiZXhwXCJgIHRlbXBsYXRlIGJpbmRpbmdzLlxuICogV2hlbiBjbGFzc2VzIGFyZSBhcHBsaWVkIHRvIHRoZSBlbGVtZW50IHRoZXkgd2lsbCB0aGVuIGJlIHVwZGF0ZWQgd2l0aFxuICogcmVzcGVjdCB0byBhbnkgc3R5bGVzL2NsYXNzZXMgc2V0IHZpYSBgY2xhc3NQcm9wYC4gSWYgYW55XG4gKiBjbGFzc2VzIGFyZSBzZXQgdG8gZmFsc3kgdGhlbiB0aGV5IHdpbGwgYmUgcmVtb3ZlZCBmcm9tIHRoZSBlbGVtZW50LlxuICpcbiAqIE5vdGUgdGhhdCB0aGUgc3R5bGluZyBpbnN0cnVjdGlvbiB3aWxsIG5vdCBiZSBhcHBsaWVkIHVudGlsIGBzdHlsaW5nQXBwbHlgIGlzIGNhbGxlZC5cbiAqIE5vdGUgdGhhdCB0aGlzIHdpbGwgdGhlIHByb3ZpZGVkIGNsYXNzTWFwIHZhbHVlIHRvIHRoZSBob3N0IGVsZW1lbnQgaWYgdGhpcyBmdW5jdGlvbiBpcyBjYWxsZWRcbiAqIHdpdGhpbiBhIGhvc3QgYmluZGluZy5cbiAqXG4gKiBAcGFyYW0gY2xhc3NlcyBBIGtleS92YWx1ZSBtYXAgb3Igc3RyaW5nIG9mIENTUyBjbGFzc2VzIHRoYXQgd2lsbCBiZSBhZGRlZCB0byB0aGVcbiAqICAgICAgICBnaXZlbiBlbGVtZW50LiBBbnkgbWlzc2luZyBjbGFzc2VzICh0aGF0IGhhdmUgYWxyZWFkeSBiZWVuIGFwcGxpZWQgdG8gdGhlIGVsZW1lbnRcbiAqICAgICAgICBiZWZvcmVoYW5kKSB3aWxsIGJlIHJlbW92ZWQgKHVuc2V0KSBmcm9tIHRoZSBlbGVtZW50J3MgbGlzdCBvZiBDU1MgY2xhc3Nlcy5cbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWNsYXNzTWFwKGNsYXNzZXM6IHtbY2xhc3NOYW1lOiBzdHJpbmddOiBhbnl9IHwgTk9fQ0hBTkdFIHwgc3RyaW5nIHwgbnVsbCk6IHZvaWQge1xuICBjbGFzc01hcEludGVybmFsKGdldFNlbGVjdGVkSW5kZXgoKSwgY2xhc3Nlcyk7XG59XG5cbi8qKlxuICogSW50ZXJuYWwgZnVuY3Rpb24gZm9yIGFwcGx5aW5nIGEgY2xhc3Mgc3RyaW5nIG9yIGtleS92YWx1ZSBtYXAgb2YgY2xhc3NlcyB0byBhbiBlbGVtZW50LlxuICpcbiAqIFRoZSByZWFzb24gd2h5IHRoaXMgZnVuY3Rpb24gaGFzIGJlZW4gc2VwYXJhdGVkIGZyb20gYMm1ybVjbGFzc01hcGAgaXMgYmVjYXVzZVxuICogaXQgaXMgYWxzbyBjYWxsZWQgZnJvbSBgybXJtWNsYXNzTWFwSW50ZXJwb2xhdGVgLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY2xhc3NNYXBJbnRlcm5hbChcbiAgICBlbGVtZW50SW5kZXg6IG51bWJlciwgY2xhc3Nlczoge1tjbGFzc05hbWU6IHN0cmluZ106IGFueX0gfCBOT19DSEFOR0UgfCBzdHJpbmcgfCBudWxsKTogdm9pZCB7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgdE5vZGUgPSBnZXRUTm9kZShlbGVtZW50SW5kZXgsIGxWaWV3KTtcbiAgY29uc3QgZmlyc3RVcGRhdGVQYXNzID0gbFZpZXdbVFZJRVddLmZpcnN0VXBkYXRlUGFzcztcbiAgY29uc3QgY29udGV4dCA9IGdldENsYXNzZXNDb250ZXh0KHROb2RlKTtcbiAgY29uc3QgaGFzRGlyZWN0aXZlSW5wdXQgPSBoYXNDbGFzc0lucHV0KHROb2RlKTtcblxuICAvLyBpZiBhIHZhbHVlIGlzIGludGVycG9sYXRlZCB0aGVuIGl0IG1heSByZW5kZXIgYSBgTk9fQ0hBTkdFYCB2YWx1ZS5cbiAgLy8gaW4gdGhpcyBjYXNlIHdlIGRvIG5vdCBuZWVkIHRvIGRvIGFueXRoaW5nLCBidXQgdGhlIGJpbmRpbmcgaW5kZXhcbiAgLy8gc3RpbGwgbmVlZHMgdG8gYmUgaW5jcmVtZW50ZWQgYmVjYXVzZSBhbGwgc3R5bGluZyBiaW5kaW5nIHZhbHVlc1xuICAvLyBhcmUgc3RvcmVkIGluc2lkZSBvZiB0aGUgbFZpZXcuXG4gIGNvbnN0IGJpbmRpbmdJbmRleCA9IGluY3JlbWVudEJpbmRpbmdJbmRleCgyKTtcbiAgY29uc3QgaG9zdEJpbmRpbmdzTW9kZSA9IGlzSG9zdFN0eWxpbmcoKTtcblxuICAvLyBpbnB1dHMgYXJlIG9ubHkgZXZhbHVhdGVkIGZyb20gYSB0ZW1wbGF0ZSBiaW5kaW5nIGludG8gYSBkaXJlY3RpdmUsIHRoZXJlZm9yZSxcbiAgLy8gdGhlcmUgc2hvdWxkIG5vdCBiZSBhIHNpdHVhdGlvbiB3aGVyZSBhIGRpcmVjdGl2ZSBob3N0IGJpbmRpbmdzIGZ1bmN0aW9uXG4gIC8vIGV2YWx1YXRlcyB0aGUgaW5wdXRzICh0aGlzIHNob3VsZCBvbmx5IGhhcHBlbiBpbiB0aGUgdGVtcGxhdGUgZnVuY3Rpb24pXG4gIGlmICghaG9zdEJpbmRpbmdzTW9kZSAmJiBoYXNEaXJlY3RpdmVJbnB1dCAmJiBjbGFzc2VzICE9PSBOT19DSEFOR0UpIHtcbiAgICB1cGRhdGVEaXJlY3RpdmVJbnB1dFZhbHVlKGNvbnRleHQsIGxWaWV3LCB0Tm9kZSwgYmluZGluZ0luZGV4LCBjbGFzc2VzLCB0cnVlLCBmaXJzdFVwZGF0ZVBhc3MpO1xuICAgIGNsYXNzZXMgPSBOT19DSEFOR0U7XG4gIH1cblxuICAvLyB3ZSBjaGVjayBmb3IgdGhpcyBpbiB0aGUgaW5zdHJ1Y3Rpb24gY29kZSBzbyB0aGF0IHRoZSBjb250ZXh0IGNhbiBiZSBub3RpZmllZFxuICAvLyBhYm91dCBwcm9wIG9yIG1hcCBiaW5kaW5ncyBzbyB0aGF0IHRoZSBkaXJlY3QgYXBwbHkgY2hlY2sgY2FuIGRlY2lkZSBlYXJsaWVyXG4gIC8vIGlmIGl0IGFsbG93cyBmb3IgY29udGV4dCByZXNvbHV0aW9uIHRvIGJlIGJ5cGFzc2VkLlxuICBpZiAoZmlyc3RVcGRhdGVQYXNzKSB7XG4gICAgcGF0Y2hDb25maWcodE5vZGUsIFROb2RlRmxhZ3MuaGFzQ2xhc3NNYXBCaW5kaW5ncyk7XG4gICAgcGF0Y2hIb3N0U3R5bGluZ0ZsYWcodE5vZGUsIGlzSG9zdFN0eWxpbmcoKSwgdHJ1ZSk7XG4gIH1cblxuICBzdHlsaW5nTWFwKFxuICAgICAgY29udGV4dCwgdE5vZGUsIGZpcnN0VXBkYXRlUGFzcywgbFZpZXcsIGJpbmRpbmdJbmRleCwgY2xhc3NlcywgdHJ1ZSwgaGFzRGlyZWN0aXZlSW5wdXQpO1xufVxuXG4vKipcbiAqIFNoYXJlZCBmdW5jdGlvbiB1c2VkIHRvIHVwZGF0ZSBhIG1hcC1iYXNlZCBzdHlsaW5nIGJpbmRpbmcgZm9yIGFuIGVsZW1lbnQuXG4gKlxuICogV2hlbiB0aGlzIGZ1bmN0aW9uIGlzIGNhbGxlZCBpdCB3aWxsIGFjdGl2YXRlIHN1cHBvcnQgZm9yIGBbc3R5bGVdYCBhbmRcbiAqIGBbY2xhc3NdYCBiaW5kaW5ncyBpbiBBbmd1bGFyLlxuICovXG5mdW5jdGlvbiBzdHlsaW5nTWFwKFxuICAgIGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCwgdE5vZGU6IFROb2RlLCBmaXJzdFVwZGF0ZVBhc3M6IGJvb2xlYW4sIGxWaWV3OiBMVmlldyxcbiAgICBiaW5kaW5nSW5kZXg6IG51bWJlciwgdmFsdWU6IHtba2V5OiBzdHJpbmddOiBhbnl9IHwgc3RyaW5nIHwgbnVsbCwgaXNDbGFzc0Jhc2VkOiBib29sZWFuLFxuICAgIGhhc0RpcmVjdGl2ZUlucHV0OiBib29sZWFuKTogdm9pZCB7XG4gIGNvbnN0IGRpcmVjdGl2ZUluZGV4ID0gZ2V0QWN0aXZlRGlyZWN0aXZlSWQoKTtcbiAgY29uc3QgbmF0aXZlID0gZ2V0TmF0aXZlQnlUTm9kZSh0Tm9kZSwgbFZpZXcpIGFzIFJFbGVtZW50O1xuICBjb25zdCBvbGRWYWx1ZSA9IGdldFZhbHVlKGxWaWV3LCBiaW5kaW5nSW5kZXgpO1xuICBjb25zdCBzYW5pdGl6ZXIgPSBnZXRDdXJyZW50U3R5bGVTYW5pdGl6ZXIoKTtcbiAgY29uc3QgdmFsdWVIYXNDaGFuZ2VkID0gaGFzVmFsdWVDaGFuZ2VkKG9sZFZhbHVlLCB2YWx1ZSk7XG5cbiAgLy8gW3N0eWxlXSBhbmQgW2NsYXNzXSBiaW5kaW5ncyBkbyBub3QgdXNlIGBiaW5kKClgIGFuZCB3aWxsIHRoZXJlZm9yZVxuICAvLyBtYW5hZ2UgYWNjZXNzaW5nIGFuZCB1cGRhdGluZyB0aGUgbmV3IHZhbHVlIGluIHRoZSBsVmlldyBkaXJlY3RseS5cbiAgLy8gRm9yIHRoaXMgcmVhc29uLCB0aGUgY2hlY2tOb0NoYW5nZXMgc2l0dWF0aW9uIG11c3QgYWxzbyBiZSBoYW5kbGVkIGhlcmVcbiAgLy8gYXMgd2VsbC5cbiAgaWYgKG5nRGV2TW9kZSAmJiB2YWx1ZUhhc0NoYW5nZWQgJiYgZ2V0Q2hlY2tOb0NoYW5nZXNNb2RlKCkpIHtcbiAgICB0aHJvd0Vycm9ySWZOb0NoYW5nZXNNb2RlKGZhbHNlLCBvbGRWYWx1ZSwgdmFsdWUpO1xuICB9XG5cbiAgLy8gRGlyZWN0IEFwcGx5IENhc2U6IGJ5cGFzcyBjb250ZXh0IHJlc29sdXRpb24gYW5kIGFwcGx5IHRoZVxuICAvLyBzdHlsZS9jbGFzcyBtYXAgdmFsdWVzIGRpcmVjdGx5IHRvIHRoZSBlbGVtZW50XG4gIGlmIChhbGxvd0RpcmVjdFN0eWxpbmcodE5vZGUsIGlzQ2xhc3NCYXNlZCwgZmlyc3RVcGRhdGVQYXNzKSkge1xuICAgIGNvbnN0IHNhbml0aXplclRvVXNlID0gaXNDbGFzc0Jhc2VkID8gbnVsbCA6IHNhbml0aXplcjtcbiAgICBjb25zdCByZW5kZXJlciA9IGdldFJlbmRlcmVyKHROb2RlLCBsVmlldyk7XG4gICAgYXBwbHlTdHlsaW5nTWFwRGlyZWN0bHkoXG4gICAgICAgIHJlbmRlcmVyLCBjb250ZXh0LCB0Tm9kZSwgbmF0aXZlLCBsVmlldywgYmluZGluZ0luZGV4LCB2YWx1ZSwgaXNDbGFzc0Jhc2VkLCBzYW5pdGl6ZXJUb1VzZSxcbiAgICAgICAgdmFsdWVIYXNDaGFuZ2VkLCBoYXNEaXJlY3RpdmVJbnB1dCk7XG4gICAgaWYgKHNhbml0aXplclRvVXNlKSB7XG4gICAgICAvLyBpdCdzIGltcG9ydGFudCB3ZSByZW1vdmUgdGhlIGN1cnJlbnQgc3R5bGUgc2FuaXRpemVyIG9uY2UgdGhlXG4gICAgICAvLyBlbGVtZW50IGV4aXRzLCBvdGhlcndpc2UgaXQgd2lsbCBiZSB1c2VkIGJ5IHRoZSBuZXh0IHN0eWxpbmdcbiAgICAgIC8vIGluc3RydWN0aW9ucyBmb3IgdGhlIG5leHQgZWxlbWVudC5cbiAgICAgIHNldEVsZW1lbnRFeGl0Rm4oc3R5bGluZ0FwcGx5KTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgY29uc3Qgc3R5bGluZ01hcEFyciA9XG4gICAgICAgIHZhbHVlID09PSBOT19DSEFOR0UgPyBOT19DSEFOR0UgOiBub3JtYWxpemVJbnRvU3R5bGluZ01hcChvbGRWYWx1ZSwgdmFsdWUsICFpc0NsYXNzQmFzZWQpO1xuXG4gICAgYWN0aXZhdGVTdHlsaW5nTWFwRmVhdHVyZSgpO1xuXG4gICAgLy8gQ29udGV4dCBSZXNvbHV0aW9uIChvciBmaXJzdCB1cGRhdGUpIENhc2U6IHNhdmUgdGhlIG1hcCB2YWx1ZVxuICAgIC8vIGFuZCBkZWZlciB0byB0aGUgY29udGV4dCB0byBmbHVzaCBhbmQgYXBwbHkgdGhlIHN0eWxlL2NsYXNzIGJpbmRpbmdcbiAgICAvLyB2YWx1ZSB0byB0aGUgZWxlbWVudC5cbiAgICBpZiAoaXNDbGFzc0Jhc2VkKSB7XG4gICAgICB1cGRhdGVDbGFzc1ZpYUNvbnRleHQoXG4gICAgICAgICAgY29udGV4dCwgdE5vZGUsIGxWaWV3LCBuYXRpdmUsIGRpcmVjdGl2ZUluZGV4LCBudWxsLCBiaW5kaW5nSW5kZXgsIHN0eWxpbmdNYXBBcnIsXG4gICAgICAgICAgdmFsdWVIYXNDaGFuZ2VkLCBmaXJzdFVwZGF0ZVBhc3MpO1xuICAgIH0gZWxzZSB7XG4gICAgICB1cGRhdGVTdHlsZVZpYUNvbnRleHQoXG4gICAgICAgICAgY29udGV4dCwgdE5vZGUsIGxWaWV3LCBuYXRpdmUsIGRpcmVjdGl2ZUluZGV4LCBudWxsLCBiaW5kaW5nSW5kZXgsIHN0eWxpbmdNYXBBcnIsXG4gICAgICAgICAgc2FuaXRpemVyLCB2YWx1ZUhhc0NoYW5nZWQsIGZpcnN0VXBkYXRlUGFzcyk7XG4gICAgfVxuXG4gICAgc2V0RWxlbWVudEV4aXRGbihzdHlsaW5nQXBwbHkpO1xuICB9XG5cbiAgaWYgKG5nRGV2TW9kZSkge1xuICAgIGlzQ2xhc3NCYXNlZCA/IG5nRGV2TW9kZS5jbGFzc01hcCA6IG5nRGV2TW9kZS5zdHlsZU1hcCsrO1xuICAgIGlmICh2YWx1ZUhhc0NoYW5nZWQpIHtcbiAgICAgIGlzQ2xhc3NCYXNlZCA/IG5nRGV2TW9kZS5jbGFzc01hcENhY2hlTWlzcyA6IG5nRGV2TW9kZS5zdHlsZU1hcENhY2hlTWlzcysrO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIFdyaXRlcyBhIHZhbHVlIHRvIGEgZGlyZWN0aXZlJ3MgYHN0eWxlYCBvciBgY2xhc3NgIGlucHV0IGJpbmRpbmcgKGlmIGl0IGhhcyBjaGFuZ2VkKS5cbiAqXG4gKiBJZiBhIGRpcmVjdGl2ZSBoYXMgYSBgQElucHV0YCBiaW5kaW5nIHRoYXQgaXMgc2V0IG9uIGBzdHlsZWAgb3IgYGNsYXNzYCB0aGVuIHRoYXQgdmFsdWVcbiAqIHdpbGwgdGFrZSBwcmlvcml0eSBvdmVyIHRoZSB1bmRlcmx5aW5nIHN0eWxlL2NsYXNzIHN0eWxpbmcgYmluZGluZ3MuIFRoaXMgdmFsdWUgd2lsbFxuICogYmUgdXBkYXRlZCBmb3IgdGhlIGJpbmRpbmcgZWFjaCB0aW1lIGR1cmluZyBjaGFuZ2UgZGV0ZWN0aW9uLlxuICpcbiAqIFdoZW4gdGhpcyBvY2N1cnMgdGhpcyBmdW5jdGlvbiB3aWxsIGF0dGVtcHQgdG8gd3JpdGUgdGhlIHZhbHVlIHRvIHRoZSBpbnB1dCBiaW5kaW5nXG4gKiBkZXBlbmRpbmcgb24gdGhlIGZvbGxvd2luZyBzaXR1YXRpb25zOlxuICpcbiAqIC0gSWYgYG9sZFZhbHVlICE9PSBuZXdWYWx1ZWBcbiAqIC0gSWYgYG5ld1ZhbHVlYCBpcyBgbnVsbGAgKGJ1dCB0aGlzIGlzIHNraXBwZWQgaWYgaXQgaXMgZHVyaW5nIHRoZSBmaXJzdCB1cGRhdGUgcGFzcylcbiAqL1xuZnVuY3Rpb24gdXBkYXRlRGlyZWN0aXZlSW5wdXRWYWx1ZShcbiAgICBjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQsIGxWaWV3OiBMVmlldywgdE5vZGU6IFROb2RlLCBiaW5kaW5nSW5kZXg6IG51bWJlciwgbmV3VmFsdWU6IGFueSxcbiAgICBpc0NsYXNzQmFzZWQ6IGJvb2xlYW4sIGZpcnN0VXBkYXRlUGFzczogYm9vbGVhbik6IHZvaWQge1xuICBjb25zdCBvbGRWYWx1ZSA9IGdldFZhbHVlKGxWaWV3LCBiaW5kaW5nSW5kZXgpO1xuICBpZiAoaGFzVmFsdWVDaGFuZ2VkKG9sZFZhbHVlLCBuZXdWYWx1ZSkpIHtcbiAgICAvLyBldmVuIGlmIHRoZSB2YWx1ZSBoYXMgY2hhbmdlZCB3ZSBtYXkgbm90IHdhbnQgdG8gZW1pdCBpdCB0byB0aGVcbiAgICAvLyBkaXJlY3RpdmUgaW5wdXQocykgaW4gdGhlIGV2ZW50IHRoYXQgaXQgaXMgZmFsc3kgZHVyaW5nIHRoZVxuICAgIC8vIGZpcnN0IHVwZGF0ZSBwYXNzLlxuICAgIGlmIChpc1N0eWxpbmdWYWx1ZURlZmluZWQobmV3VmFsdWUpIHx8ICFmaXJzdFVwZGF0ZVBhc3MpIHtcbiAgICAgIGNvbnN0IGlucHV0TmFtZTogc3RyaW5nID0gaXNDbGFzc0Jhc2VkID8gc2VsZWN0Q2xhc3NCYXNlZElucHV0TmFtZSh0Tm9kZS5pbnB1dHMgISkgOiAnc3R5bGUnO1xuICAgICAgY29uc3QgaW5wdXRzID0gdE5vZGUuaW5wdXRzICFbaW5wdXROYW1lXSAhO1xuICAgICAgY29uc3QgaW5pdGlhbFZhbHVlID0gZ2V0SW5pdGlhbFN0eWxpbmdWYWx1ZShjb250ZXh0KTtcbiAgICAgIGNvbnN0IHZhbHVlID0gbm9ybWFsaXplU3R5bGluZ0RpcmVjdGl2ZUlucHV0VmFsdWUoaW5pdGlhbFZhbHVlLCBuZXdWYWx1ZSwgaXNDbGFzc0Jhc2VkKTtcbiAgICAgIHNldElucHV0c0ZvclByb3BlcnR5KGxWaWV3LCBpbnB1dHMsIHZhbHVlKTtcbiAgICAgIHNldEVsZW1lbnRFeGl0Rm4oc3R5bGluZ0FwcGx5KTtcbiAgICB9XG4gICAgc2V0VmFsdWUobFZpZXcsIGJpbmRpbmdJbmRleCwgbmV3VmFsdWUpO1xuICB9XG59XG5cbi8qKlxuICogUmV0dXJucyB0aGUgYXBwcm9wcmlhdGUgZGlyZWN0aXZlIGlucHV0IHZhbHVlIGZvciBgc3R5bGVgIG9yIGBjbGFzc2AuXG4gKlxuICogRWFybGllciB2ZXJzaW9ucyBvZiBBbmd1bGFyIGV4cGVjdCBhIGJpbmRpbmcgdmFsdWUgdG8gYmUgcGFzc2VkIGludG8gZGlyZWN0aXZlIGNvZGVcbiAqIGV4YWN0bHkgYXMgaXQgaXMgdW5sZXNzIHRoZXJlIGlzIGEgc3RhdGljIHZhbHVlIHByZXNlbnQgKGluIHdoaWNoIGNhc2UgYm90aCB2YWx1ZXNcbiAqIHdpbGwgYmUgc3RyaW5naWZpZWQgYW5kIGNvbmNhdGVuYXRlZCkuXG4gKi9cbmZ1bmN0aW9uIG5vcm1hbGl6ZVN0eWxpbmdEaXJlY3RpdmVJbnB1dFZhbHVlKFxuICAgIGluaXRpYWxWYWx1ZTogc3RyaW5nLCBiaW5kaW5nVmFsdWU6IHN0cmluZyB8IHtba2V5OiBzdHJpbmddOiBhbnl9IHwgbnVsbCxcbiAgICBpc0NsYXNzQmFzZWQ6IGJvb2xlYW4pIHtcbiAgbGV0IHZhbHVlID0gYmluZGluZ1ZhbHVlO1xuXG4gIC8vIHdlIG9ubHkgY29uY2F0IHZhbHVlcyBpZiB0aGVyZSBpcyBhbiBpbml0aWFsIHZhbHVlLCBvdGhlcndpc2Ugd2UgcmV0dXJuIHRoZSB2YWx1ZSBhcyBpcy5cbiAgLy8gTm90ZSB0aGF0IHRoaXMgaXMgdG8gc2F0aXNmeSBiYWNrd2FyZHMtY29tcGF0aWJpbGl0eSBpbiBBbmd1bGFyLlxuICBpZiAoaW5pdGlhbFZhbHVlLmxlbmd0aCkge1xuICAgIGlmIChpc0NsYXNzQmFzZWQpIHtcbiAgICAgIHZhbHVlID0gY29uY2F0U3RyaW5nKGluaXRpYWxWYWx1ZSwgZm9yY2VDbGFzc2VzQXNTdHJpbmcoYmluZGluZ1ZhbHVlKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhbHVlID0gY29uY2F0U3RyaW5nKGluaXRpYWxWYWx1ZSwgZm9yY2VTdHlsZXNBc1N0cmluZyhiaW5kaW5nVmFsdWUsIHRydWUpLCAnOycpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gdmFsdWU7XG59XG5cbi8qKlxuICogRmx1c2hlcyBhbGwgc3R5bGluZyBjb2RlIHRvIHRoZSBlbGVtZW50LlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gaXMgZGVzaWduZWQgdG8gYmUgc2NoZWR1bGVkIGZyb20gYW55IG9mIHRoZSBmb3VyIHN0eWxpbmcgaW5zdHJ1Y3Rpb25zXG4gKiBpbiB0aGlzIGZpbGUuIFdoZW4gY2FsbGVkIGl0IHdpbGwgZmx1c2ggYWxsIHN0eWxlIGFuZCBjbGFzcyBiaW5kaW5ncyB0byB0aGUgZWxlbWVudFxuICogdmlhIHRoZSBjb250ZXh0IHJlc29sdXRpb24gYWxnb3JpdGhtLlxuICovXG5mdW5jdGlvbiBzdHlsaW5nQXBwbHkoKTogdm9pZCB7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgdFZpZXcgPSBsVmlld1tUVklFV107XG4gIGNvbnN0IGVsZW1lbnRJbmRleCA9IGdldFNlbGVjdGVkSW5kZXgoKTtcbiAgY29uc3QgdE5vZGUgPSBnZXRUTm9kZShlbGVtZW50SW5kZXgsIGxWaWV3KTtcbiAgY29uc3QgbmF0aXZlID0gZ2V0TmF0aXZlQnlUTm9kZSh0Tm9kZSwgbFZpZXcpIGFzIFJFbGVtZW50O1xuICBjb25zdCBkaXJlY3RpdmVJbmRleCA9IGdldEFjdGl2ZURpcmVjdGl2ZUlkKCk7XG4gIGNvbnN0IHJlbmRlcmVyID0gZ2V0UmVuZGVyZXIodE5vZGUsIGxWaWV3KTtcbiAgY29uc3Qgc2FuaXRpemVyID0gZ2V0Q3VycmVudFN0eWxlU2FuaXRpemVyKCk7XG4gIGNvbnN0IGNsYXNzZXNDb250ZXh0ID0gaXNTdHlsaW5nQ29udGV4dCh0Tm9kZS5jbGFzc2VzKSA/IHROb2RlLmNsYXNzZXMgYXMgVFN0eWxpbmdDb250ZXh0IDogbnVsbDtcbiAgY29uc3Qgc3R5bGVzQ29udGV4dCA9IGlzU3R5bGluZ0NvbnRleHQodE5vZGUuc3R5bGVzKSA/IHROb2RlLnN0eWxlcyBhcyBUU3R5bGluZ0NvbnRleHQgOiBudWxsO1xuICBmbHVzaFN0eWxpbmcoXG4gICAgICByZW5kZXJlciwgbFZpZXcsIHROb2RlLCBjbGFzc2VzQ29udGV4dCwgc3R5bGVzQ29udGV4dCwgbmF0aXZlLCBkaXJlY3RpdmVJbmRleCwgc2FuaXRpemVyLFxuICAgICAgdFZpZXcuZmlyc3RVcGRhdGVQYXNzKTtcbiAgcmVzZXRDdXJyZW50U3R5bGVTYW5pdGl6ZXIoKTtcbn1cblxuZnVuY3Rpb24gZ2V0UmVuZGVyZXIodE5vZGU6IFROb2RlLCBsVmlldzogTFZpZXcpIHtcbiAgcmV0dXJuIHROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5FbGVtZW50ID8gbFZpZXdbUkVOREVSRVJdIDogbnVsbDtcbn1cblxuLyoqXG4gKiBTZWFyY2hlcyBhbmQgYXNzaWducyBwcm92aWRlZCBhbGwgc3RhdGljIHN0eWxlL2NsYXNzIGVudHJpZXMgKGZvdW5kIGluIHRoZSBgYXR0cnNgIHZhbHVlKVxuICogYW5kIHJlZ2lzdGVycyB0aGVtIGluIHRoZWlyIHJlc3BlY3RpdmUgc3R5bGluZyBjb250ZXh0cy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlZ2lzdGVySW5pdGlhbFN0eWxpbmdPblROb2RlKFxuICAgIHROb2RlOiBUTm9kZSwgYXR0cnM6IFRBdHRyaWJ1dGVzLCBzdGFydEluZGV4OiBudW1iZXIpOiBib29sZWFuIHtcbiAgbGV0IGhhc0FkZGl0aW9uYWxJbml0aWFsU3R5bGluZyA9IGZhbHNlO1xuICBsZXQgc3R5bGVzID0gZ2V0U3R5bGluZ01hcEFycmF5KHROb2RlLnN0eWxlcyk7XG4gIGxldCBjbGFzc2VzID0gZ2V0U3R5bGluZ01hcEFycmF5KHROb2RlLmNsYXNzZXMpO1xuICBsZXQgbW9kZSA9IC0xO1xuICBmb3IgKGxldCBpID0gc3RhcnRJbmRleDsgaSA8IGF0dHJzLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3QgYXR0ciA9IGF0dHJzW2ldIGFzIHN0cmluZztcbiAgICBpZiAodHlwZW9mIGF0dHIgPT0gJ251bWJlcicpIHtcbiAgICAgIG1vZGUgPSBhdHRyO1xuICAgIH0gZWxzZSBpZiAobW9kZSA9PSBBdHRyaWJ1dGVNYXJrZXIuQ2xhc3Nlcykge1xuICAgICAgY2xhc3NlcyA9IGNsYXNzZXMgfHwgYWxsb2NTdHlsaW5nTWFwQXJyYXkobnVsbCk7XG4gICAgICBhZGRJdGVtVG9TdHlsaW5nTWFwKGNsYXNzZXMsIGF0dHIsIHRydWUpO1xuICAgICAgaGFzQWRkaXRpb25hbEluaXRpYWxTdHlsaW5nID0gdHJ1ZTtcbiAgICB9IGVsc2UgaWYgKG1vZGUgPT0gQXR0cmlidXRlTWFya2VyLlN0eWxlcykge1xuICAgICAgY29uc3QgdmFsdWUgPSBhdHRyc1srK2ldIGFzIHN0cmluZyB8IG51bGw7XG4gICAgICBzdHlsZXMgPSBzdHlsZXMgfHwgYWxsb2NTdHlsaW5nTWFwQXJyYXkobnVsbCk7XG4gICAgICBhZGRJdGVtVG9TdHlsaW5nTWFwKHN0eWxlcywgYXR0ciwgdmFsdWUpO1xuICAgICAgaGFzQWRkaXRpb25hbEluaXRpYWxTdHlsaW5nID0gdHJ1ZTtcbiAgICB9XG4gIH1cblxuICBpZiAoY2xhc3NlcyAmJiBjbGFzc2VzLmxlbmd0aCA+IFN0eWxpbmdNYXBBcnJheUluZGV4LlZhbHVlc1N0YXJ0UG9zaXRpb24pIHtcbiAgICBpZiAoIXROb2RlLmNsYXNzZXMpIHtcbiAgICAgIHROb2RlLmNsYXNzZXMgPSBjbGFzc2VzO1xuICAgIH1cbiAgICB1cGRhdGVSYXdWYWx1ZU9uQ29udGV4dCh0Tm9kZS5jbGFzc2VzLCBzdHlsaW5nTWFwVG9TdHJpbmcoY2xhc3NlcywgdHJ1ZSkpO1xuICB9XG5cbiAgaWYgKHN0eWxlcyAmJiBzdHlsZXMubGVuZ3RoID4gU3R5bGluZ01hcEFycmF5SW5kZXguVmFsdWVzU3RhcnRQb3NpdGlvbikge1xuICAgIGlmICghdE5vZGUuc3R5bGVzKSB7XG4gICAgICB0Tm9kZS5zdHlsZXMgPSBzdHlsZXM7XG4gICAgfVxuICAgIHVwZGF0ZVJhd1ZhbHVlT25Db250ZXh0KHROb2RlLnN0eWxlcywgc3R5bGluZ01hcFRvU3RyaW5nKHN0eWxlcywgZmFsc2UpKTtcbiAgfVxuXG4gIGlmIChoYXNBZGRpdGlvbmFsSW5pdGlhbFN0eWxpbmcpIHtcbiAgICB0Tm9kZS5mbGFncyB8PSBUTm9kZUZsYWdzLmhhc0luaXRpYWxTdHlsaW5nO1xuICB9XG5cbiAgcmV0dXJuIGhhc0FkZGl0aW9uYWxJbml0aWFsU3R5bGluZztcbn1cblxuZnVuY3Rpb24gdXBkYXRlUmF3VmFsdWVPbkNvbnRleHQoY29udGV4dDogVFN0eWxpbmdDb250ZXh0IHwgU3R5bGluZ01hcEFycmF5LCB2YWx1ZTogc3RyaW5nKSB7XG4gIGNvbnN0IHN0eWxpbmdNYXBBcnIgPSBnZXRTdHlsaW5nTWFwQXJyYXkoY29udGV4dCkgITtcbiAgc3R5bGluZ01hcEFycltTdHlsaW5nTWFwQXJyYXlJbmRleC5SYXdWYWx1ZVBvc2l0aW9uXSA9IHZhbHVlO1xufVxuXG5mdW5jdGlvbiBnZXRTdHlsZXNDb250ZXh0KHROb2RlOiBUTm9kZSk6IFRTdHlsaW5nQ29udGV4dCB7XG4gIHJldHVybiBnZXRDb250ZXh0KHROb2RlLCBmYWxzZSk7XG59XG5cbmZ1bmN0aW9uIGdldENsYXNzZXNDb250ZXh0KHROb2RlOiBUTm9kZSk6IFRTdHlsaW5nQ29udGV4dCB7XG4gIHJldHVybiBnZXRDb250ZXh0KHROb2RlLCB0cnVlKTtcbn1cblxuLyoqXG4gKiBSZXR1cm5zL2luc3RhbnRpYXRlcyBhIHN0eWxpbmcgY29udGV4dCBmcm9tL3RvIGEgYHROb2RlYCBpbnN0YW5jZS5cbiAqL1xuZnVuY3Rpb24gZ2V0Q29udGV4dCh0Tm9kZTogVE5vZGUsIGlzQ2xhc3NCYXNlZDogYm9vbGVhbik6IFRTdHlsaW5nQ29udGV4dCB7XG4gIGxldCBjb250ZXh0ID0gaXNDbGFzc0Jhc2VkID8gdE5vZGUuY2xhc3NlcyA6IHROb2RlLnN0eWxlcztcbiAgaWYgKCFpc1N0eWxpbmdDb250ZXh0KGNvbnRleHQpKSB7XG4gICAgY29uc3QgaGFzRGlyZWN0aXZlcyA9IGlzRGlyZWN0aXZlSG9zdCh0Tm9kZSk7XG4gICAgY29udGV4dCA9IGFsbG9jVFN0eWxpbmdDb250ZXh0KGNvbnRleHQgYXMgU3R5bGluZ01hcEFycmF5IHwgbnVsbCwgaGFzRGlyZWN0aXZlcyk7XG4gICAgaWYgKG5nRGV2TW9kZSkge1xuICAgICAgYXR0YWNoU3R5bGluZ0RlYnVnT2JqZWN0KGNvbnRleHQgYXMgVFN0eWxpbmdDb250ZXh0LCB0Tm9kZSwgaXNDbGFzc0Jhc2VkKTtcbiAgICB9XG5cbiAgICBpZiAoaXNDbGFzc0Jhc2VkKSB7XG4gICAgICB0Tm9kZS5jbGFzc2VzID0gY29udGV4dDtcbiAgICB9IGVsc2Uge1xuICAgICAgdE5vZGUuc3R5bGVzID0gY29udGV4dDtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGNvbnRleHQgYXMgVFN0eWxpbmdDb250ZXh0O1xufVxuXG5mdW5jdGlvbiByZXNvbHZlU3R5bGVQcm9wVmFsdWUoXG4gICAgdmFsdWU6IHN0cmluZyB8IG51bWJlciB8IFNhZmVWYWx1ZSB8IG51bGwgfCBOT19DSEFOR0UsXG4gICAgc3VmZml4OiBzdHJpbmcgfCBudWxsIHwgdW5kZWZpbmVkKTogc3RyaW5nfFNhZmVWYWx1ZXxudWxsfHVuZGVmaW5lZHxOT19DSEFOR0Uge1xuICBpZiAodmFsdWUgPT09IE5PX0NIQU5HRSkgcmV0dXJuIHZhbHVlO1xuXG4gIGxldCByZXNvbHZlZFZhbHVlOiBzdHJpbmd8bnVsbCA9IG51bGw7XG4gIGlmICh2YWx1ZSAhPT0gbnVsbCkge1xuICAgIGlmIChzdWZmaXgpIHtcbiAgICAgIC8vIHdoZW4gYSBzdWZmaXggaXMgYXBwbGllZCB0aGVuIGl0IHdpbGwgYnlwYXNzXG4gICAgICAvLyBzYW5pdGl6YXRpb24gZW50aXJlbHkgKGIvYyBhIG5ldyBzdHJpbmcgaXMgY3JlYXRlZClcbiAgICAgIHJlc29sdmVkVmFsdWUgPSByZW5kZXJTdHJpbmdpZnkodmFsdWUpICsgc3VmZml4O1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBzYW5pdGl6YXRpb24gaGFwcGVucyBieSBkZWFsaW5nIHdpdGggYSBzdHJpbmcgdmFsdWVcbiAgICAgIC8vIHRoaXMgbWVhbnMgdGhhdCB0aGUgc3RyaW5nIHZhbHVlIHdpbGwgYmUgcGFzc2VkIHRocm91Z2hcbiAgICAgIC8vIGludG8gdGhlIHN0eWxlIHJlbmRlcmluZyBsYXRlciAod2hpY2ggaXMgd2hlcmUgdGhlIHZhbHVlXG4gICAgICAvLyB3aWxsIGJlIHNhbml0aXplZCBiZWZvcmUgaXQgaXMgYXBwbGllZClcbiAgICAgIHJlc29sdmVkVmFsdWUgPSB2YWx1ZSBhcyBhbnkgYXMgc3RyaW5nO1xuICAgIH1cbiAgfVxuICByZXR1cm4gcmVzb2x2ZWRWYWx1ZTtcbn1cblxuLyoqXG4gKiBXaGV0aGVyIG9yIG5vdCB0aGUgc3R5bGUvY2xhc3MgYmluZGluZyBiZWluZyBhcHBsaWVkIHdhcyBleGVjdXRlZCB3aXRoaW4gYSBob3N0IGJpbmRpbmdzXG4gKiBmdW5jdGlvbi5cbiAqL1xuZnVuY3Rpb24gaXNIb3N0U3R5bGluZygpOiBib29sZWFuIHtcbiAgcmV0dXJuIGlzSG9zdFN0eWxpbmdBY3RpdmUoZ2V0QWN0aXZlRGlyZWN0aXZlSWQoKSk7XG59XG5cbmZ1bmN0aW9uIHBhdGNoSG9zdFN0eWxpbmdGbGFnKHROb2RlOiBUTm9kZSwgaG9zdEJpbmRpbmdzTW9kZTogYm9vbGVhbiwgaXNDbGFzc0Jhc2VkOiBib29sZWFuKSB7XG4gIGNvbnN0IGZsYWcgPSBob3N0QmluZGluZ3NNb2RlID9cbiAgICAgIGlzQ2xhc3NCYXNlZCA/IFROb2RlRmxhZ3MuaGFzSG9zdENsYXNzQmluZGluZ3MgOiBUTm9kZUZsYWdzLmhhc0hvc3RTdHlsZUJpbmRpbmdzIDpcbiAgICAgIGlzQ2xhc3NCYXNlZCA/IFROb2RlRmxhZ3MuaGFzVGVtcGxhdGVDbGFzc0JpbmRpbmdzIDogVE5vZGVGbGFncy5oYXNUZW1wbGF0ZVN0eWxlQmluZGluZ3M7XG4gIHBhdGNoQ29uZmlnKHROb2RlLCBmbGFnKTtcbn1cbiJdfQ==