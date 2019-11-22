/**
 * @fileoverview added by tsickle
 * Generated from: packages/core/src/render3/instructions/styling.ts
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
import { addItemToStylingMap, allocStylingMapArray, allocTStylingContext, allowDirectStyling, concatString, forceClassesAsString, forceStylesAsString, getInitialStylingValue, getStylingMapArray, getValue, hasClassInput, hasStyleInput, hasValueChanged, hasValueChangedUnwrapSafeValue, isHostStylingActive, isStylingContext, isStylingValueDefined, normalizeIntoStylingMap, patchConfig, selectClassBasedInputName, setValue, stylingMapToString } from '../util/styling_utils';
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
    return ɵɵstyleProp;
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
    return ɵɵclassProp;
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
        if (hasValueChangedUnwrapSafeValue(oldValue, value)) {
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
            setInputsForProperty(lView, inputs, inputName, value);
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
    if (isStylingValueDefined(value)) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3R5bGluZy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvaW5zdHJ1Y3Rpb25zL3N0eWxpbmcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFTQSxPQUFPLEVBQUMseUJBQXlCLEVBQUMsTUFBTSxXQUFXLENBQUM7QUFDcEQsT0FBTyxFQUFtQixvQkFBb0IsRUFBQyxNQUFNLHdCQUF3QixDQUFDO0FBSTlFLE9BQU8sRUFBQyxlQUFlLEVBQUMsTUFBTSwyQkFBMkIsQ0FBQztBQUMxRCxPQUFPLEVBQVEsUUFBUSxFQUFFLEtBQUssRUFBQyxNQUFNLG9CQUFvQixDQUFDO0FBQzFELE9BQU8sRUFBQyxvQkFBb0IsRUFBRSxxQkFBcUIsRUFBRSx3QkFBd0IsRUFBRSxRQUFRLEVBQUUsZ0JBQWdCLEVBQUUscUJBQXFCLEVBQUUsZ0JBQWdCLEVBQUUsMEJBQTBCLEVBQUUsd0JBQXdCLEVBQUUsZ0JBQWdCLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFDNU8sT0FBTyxFQUFDLHVCQUF1QixFQUFFLHlCQUF5QixFQUFFLFlBQVksRUFBc0IscUJBQXFCLEVBQUUscUJBQXFCLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUN2SyxPQUFPLEVBQUMseUJBQXlCLEVBQUMsTUFBTSwrQkFBK0IsQ0FBQztBQUN4RSxPQUFPLEVBQUMsd0JBQXdCLEVBQUMsTUFBTSwwQkFBMEIsQ0FBQztBQUNsRSxPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sV0FBVyxDQUFDO0FBQ3BDLE9BQU8sRUFBQyxlQUFlLEVBQUMsTUFBTSxvQkFBb0IsQ0FBQztBQUNuRCxPQUFPLEVBQUMsbUJBQW1CLEVBQUUsb0JBQW9CLEVBQUUsb0JBQW9CLEVBQUUsa0JBQWtCLEVBQUUsWUFBWSxFQUFFLG9CQUFvQixFQUFFLG1CQUFtQixFQUFFLHNCQUFzQixFQUFFLGtCQUFrQixFQUFFLFFBQVEsRUFBRSxhQUFh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QixDQUMxQixLQUFxRCxFQUNyRCxNQUFpQztJQUNuQyxJQUFJLEtBQUssS0FBSyxTQUFTO1FBQUUsT0FBTyxLQUFLLENBQUM7O1FBRWxDLGFBQWEsR0FBZ0IsSUFBSTtJQUNyQyxJQUFJLHFCQUFxQixDQUFDLEtBQUssQ0FBQyxFQUFFO1FBQ2hDLElBQUksTUFBTSxFQUFFO1lBQ1YsK0NBQStDO1lBQy9DLHNEQUFzRDtZQUN0RCxhQUFhLEdBQUcsZUFBZSxDQUFDLEtBQUssQ0FBQyxHQUFHLE1BQU0sQ0FBQztTQUNqRDthQUFNO1lBQ0wsc0RBQXNEO1lBQ3RELDBEQUEwRDtZQUMxRCwyREFBMkQ7WUFDM0QsMENBQTBDO1lBQzFDLGFBQWEsR0FBRyxtQkFBQSxtQkFBQSxLQUFLLEVBQU8sRUFBVSxDQUFDO1NBQ3hDO0tBQ0Y7SUFDRCxPQUFPLGFBQWEsQ0FBQztBQUN2QixDQUFDOzs7Ozs7QUFNRCxTQUFTLGFBQWE7SUFDcEIsT0FBTyxtQkFBbUIsQ0FBQyxvQkFBb0IsRUFBRSxDQUFDLENBQUM7QUFDckQsQ0FBQzs7Ozs7OztBQUVELFNBQVMsb0JBQW9CLENBQUMsS0FBWSxFQUFFLGdCQUF5QixFQUFFLFlBQXFCOztVQUNwRixJQUFJLEdBQUcsZ0JBQWdCLENBQUMsQ0FBQztRQUMzQixZQUFZLENBQUMsQ0FBQyxpQ0FBaUMsQ0FBQyxrQ0FBZ0MsQ0FBQyxDQUFDO1FBQ2xGLFlBQVksQ0FBQyxDQUFDLHFDQUFxQyxDQUFDLHFDQUFvQztJQUM1RixXQUFXLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxDQUFDO0FBQzNCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiogQGxpY2Vuc2VcbiogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4qXG4qIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4qIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiovXG5pbXBvcnQge1NhZmVWYWx1ZX0gZnJvbSAnLi4vLi4vc2FuaXRpemF0aW9uL2J5cGFzcyc7XG5pbXBvcnQge1N0eWxlU2FuaXRpemVGbn0gZnJvbSAnLi4vLi4vc2FuaXRpemF0aW9uL3N0eWxlX3Nhbml0aXplcic7XG5pbXBvcnQge3Rocm93RXJyb3JJZk5vQ2hhbmdlc01vZGV9IGZyb20gJy4uL2Vycm9ycyc7XG5pbXBvcnQge1RzaWNrbGVJc3N1ZTEwMDksIHNldElucHV0c0ZvclByb3BlcnR5fSBmcm9tICcuLi9pbnN0cnVjdGlvbnMvc2hhcmVkJztcbmltcG9ydCB7QXR0cmlidXRlTWFya2VyLCBUQXR0cmlidXRlcywgVE5vZGUsIFROb2RlRmxhZ3MsIFROb2RlVHlwZX0gZnJvbSAnLi4vaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB7UkVsZW1lbnR9IGZyb20gJy4uL2ludGVyZmFjZXMvcmVuZGVyZXInO1xuaW1wb3J0IHtTdHlsaW5nTWFwQXJyYXksIFN0eWxpbmdNYXBBcnJheUluZGV4LCBUU3R5bGluZ0NvbnRleHR9IGZyb20gJy4uL2ludGVyZmFjZXMvc3R5bGluZyc7XG5pbXBvcnQge2lzRGlyZWN0aXZlSG9zdH0gZnJvbSAnLi4vaW50ZXJmYWNlcy90eXBlX2NoZWNrcyc7XG5pbXBvcnQge0xWaWV3LCBSRU5ERVJFUiwgVFZJRVd9IGZyb20gJy4uL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge2dldEFjdGl2ZURpcmVjdGl2ZUlkLCBnZXRDaGVja05vQ2hhbmdlc01vZGUsIGdldEN1cnJlbnRTdHlsZVNhbml0aXplciwgZ2V0TFZpZXcsIGdldFNlbGVjdGVkSW5kZXgsIGluY3JlbWVudEJpbmRpbmdJbmRleCwgbmV4dEJpbmRpbmdJbmRleCwgcmVzZXRDdXJyZW50U3R5bGVTYW5pdGl6ZXIsIHNldEN1cnJlbnRTdHlsZVNhbml0aXplciwgc2V0RWxlbWVudEV4aXRGbn0gZnJvbSAnLi4vc3RhdGUnO1xuaW1wb3J0IHthcHBseVN0eWxpbmdNYXBEaXJlY3RseSwgYXBwbHlTdHlsaW5nVmFsdWVEaXJlY3RseSwgZmx1c2hTdHlsaW5nLCBzZXRDbGFzcywgc2V0U3R5bGUsIHVwZGF0ZUNsYXNzVmlhQ29udGV4dCwgdXBkYXRlU3R5bGVWaWFDb250ZXh0fSBmcm9tICcuLi9zdHlsaW5nL2JpbmRpbmdzJztcbmltcG9ydCB7YWN0aXZhdGVTdHlsaW5nTWFwRmVhdHVyZX0gZnJvbSAnLi4vc3R5bGluZy9tYXBfYmFzZWRfYmluZGluZ3MnO1xuaW1wb3J0IHthdHRhY2hTdHlsaW5nRGVidWdPYmplY3R9IGZyb20gJy4uL3N0eWxpbmcvc3R5bGluZ19kZWJ1Zyc7XG5pbXBvcnQge05PX0NIQU5HRX0gZnJvbSAnLi4vdG9rZW5zJztcbmltcG9ydCB7cmVuZGVyU3RyaW5naWZ5fSBmcm9tICcuLi91dGlsL21pc2NfdXRpbHMnO1xuaW1wb3J0IHthZGRJdGVtVG9TdHlsaW5nTWFwLCBhbGxvY1N0eWxpbmdNYXBBcnJheSwgYWxsb2NUU3R5bGluZ0NvbnRleHQsIGFsbG93RGlyZWN0U3R5bGluZywgY29uY2F0U3RyaW5nLCBmb3JjZUNsYXNzZXNBc1N0cmluZywgZm9yY2VTdHlsZXNBc1N0cmluZywgZ2V0SW5pdGlhbFN0eWxpbmdWYWx1ZSwgZ2V0U3R5bGluZ01hcEFycmF5LCBnZXRWYWx1ZSwgaGFzQ2xhc3NJbnB1dCwgaGFzU3R5bGVJbnB1dCwgaGFzVmFsdWVDaGFuZ2VkLCBoYXNWYWx1ZUNoYW5nZWRVbndyYXBTYWZlVmFsdWUsIGlzSG9zdFN0eWxpbmdBY3RpdmUsIGlzU3R5bGluZ0NvbnRleHQsIGlzU3R5bGluZ1ZhbHVlRGVmaW5lZCwgbm9ybWFsaXplSW50b1N0eWxpbmdNYXAsIHBhdGNoQ29uZmlnLCBzZWxlY3RDbGFzc0Jhc2VkSW5wdXROYW1lLCBzZXRWYWx1ZSwgc3R5bGluZ01hcFRvU3RyaW5nfSBmcm9tICcuLi91dGlsL3N0eWxpbmdfdXRpbHMnO1xuaW1wb3J0IHtnZXROYXRpdmVCeVROb2RlLCBnZXRUTm9kZX0gZnJvbSAnLi4vdXRpbC92aWV3X3V0aWxzJztcblxuXG5cbi8qKlxuICogLS0tLS0tLS1cbiAqXG4gKiBUaGlzIGZpbGUgY29udGFpbnMgdGhlIGNvcmUgbG9naWMgZm9yIGhvdyBzdHlsaW5nIGluc3RydWN0aW9ucyBhcmUgcHJvY2Vzc2VkIGluIEFuZ3VsYXIuXG4gKlxuICogVG8gbGVhcm4gbW9yZSBhYm91dCB0aGUgYWxnb3JpdGhtIHNlZSBgVFN0eWxpbmdDb250ZXh0YC5cbiAqXG4gKiAtLS0tLS0tLVxuICovXG5cbi8qKlxuICogU2V0cyB0aGUgY3VycmVudCBzdHlsZSBzYW5pdGl6ZXIgZnVuY3Rpb24gd2hpY2ggd2lsbCB0aGVuIGJlIHVzZWRcbiAqIHdpdGhpbiBhbGwgZm9sbG93LXVwIHByb3AgYW5kIG1hcC1iYXNlZCBzdHlsZSBiaW5kaW5nIGluc3RydWN0aW9uc1xuICogZm9yIHRoZSBnaXZlbiBlbGVtZW50LlxuICpcbiAqIE5vdGUgdGhhdCBvbmNlIHN0eWxpbmcgaGFzIGJlZW4gYXBwbGllZCB0byB0aGUgZWxlbWVudCAoaS5lLiBvbmNlXG4gKiBgYWR2YW5jZShuKWAgaXMgZXhlY3V0ZWQgb3IgdGhlIGhvc3RCaW5kaW5ncy90ZW1wbGF0ZSBmdW5jdGlvbiBleGl0cylcbiAqIHRoZW4gdGhlIGFjdGl2ZSBgc2FuaXRpemVyRm5gIHdpbGwgYmUgc2V0IHRvIGBudWxsYC4gVGhpcyBtZWFucyB0aGF0XG4gKiBvbmNlIHN0eWxpbmcgaXMgYXBwbGllZCB0byBhbm90aGVyIGVsZW1lbnQgdGhlbiBhIGFub3RoZXIgY2FsbCB0b1xuICogYHN0eWxlU2FuaXRpemVyYCB3aWxsIG5lZWQgdG8gYmUgbWFkZS5cbiAqXG4gKiBAcGFyYW0gc2FuaXRpemVyRm4gVGhlIHNhbml0aXphdGlvbiBmdW5jdGlvbiB0aGF0IHdpbGwgYmUgdXNlZCB0b1xuICogICAgICAgcHJvY2VzcyBzdHlsZSBwcm9wL3ZhbHVlIGVudHJpZXMuXG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVzdHlsZVNhbml0aXplcihzYW5pdGl6ZXI6IFN0eWxlU2FuaXRpemVGbiB8IG51bGwpOiB2b2lkIHtcbiAgc2V0Q3VycmVudFN0eWxlU2FuaXRpemVyKHNhbml0aXplcik7XG59XG5cbi8qKlxuICogVXBkYXRlIGEgc3R5bGUgYmluZGluZyBvbiBhbiBlbGVtZW50IHdpdGggdGhlIHByb3ZpZGVkIHZhbHVlLlxuICpcbiAqIElmIHRoZSBzdHlsZSB2YWx1ZSBpcyBmYWxzeSB0aGVuIGl0IHdpbGwgYmUgcmVtb3ZlZCBmcm9tIHRoZSBlbGVtZW50XG4gKiAob3IgYXNzaWduZWQgYSBkaWZmZXJlbnQgdmFsdWUgZGVwZW5kaW5nIGlmIHRoZXJlIGFyZSBhbnkgc3R5bGVzIHBsYWNlZFxuICogb24gdGhlIGVsZW1lbnQgd2l0aCBgc3R5bGVNYXBgIG9yIGFueSBzdGF0aWMgc3R5bGVzIHRoYXQgYXJlXG4gKiBwcmVzZW50IGZyb20gd2hlbiB0aGUgZWxlbWVudCB3YXMgY3JlYXRlZCB3aXRoIGBzdHlsaW5nYCkuXG4gKlxuICogTm90ZSB0aGF0IHRoZSBzdHlsaW5nIGVsZW1lbnQgaXMgdXBkYXRlZCBhcyBwYXJ0IG9mIGBzdHlsaW5nQXBwbHlgLlxuICpcbiAqIEBwYXJhbSBwcm9wIEEgdmFsaWQgQ1NTIHByb3BlcnR5LlxuICogQHBhcmFtIHZhbHVlIE5ldyB2YWx1ZSB0byB3cml0ZSAoYG51bGxgIG9yIGFuIGVtcHR5IHN0cmluZyB0byByZW1vdmUpLlxuICogQHBhcmFtIHN1ZmZpeCBPcHRpb25hbCBzdWZmaXguIFVzZWQgd2l0aCBzY2FsYXIgdmFsdWVzIHRvIGFkZCB1bml0IHN1Y2ggYXMgYHB4YC5cbiAqICAgICAgICBOb3RlIHRoYXQgd2hlbiBhIHN1ZmZpeCBpcyBwcm92aWRlZCB0aGVuIHRoZSB1bmRlcmx5aW5nIHNhbml0aXplciB3aWxsXG4gKiAgICAgICAgYmUgaWdub3JlZC5cbiAqXG4gKiBOb3RlIHRoYXQgdGhpcyB3aWxsIGFwcGx5IHRoZSBwcm92aWRlZCBzdHlsZSB2YWx1ZSB0byB0aGUgaG9zdCBlbGVtZW50IGlmIHRoaXMgZnVuY3Rpb24gaXMgY2FsbGVkXG4gKiB3aXRoaW4gYSBob3N0IGJpbmRpbmcgZnVuY3Rpb24uXG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVzdHlsZVByb3AoXG4gICAgcHJvcDogc3RyaW5nLCB2YWx1ZTogc3RyaW5nIHwgbnVtYmVyIHwgU2FmZVZhbHVlIHwgbnVsbCxcbiAgICBzdWZmaXg/OiBzdHJpbmcgfCBudWxsKTogVHNpY2tsZUlzc3VlMTAwOSB7XG4gIHN0eWxlUHJvcEludGVybmFsKGdldFNlbGVjdGVkSW5kZXgoKSwgcHJvcCwgdmFsdWUsIHN1ZmZpeCk7XG4gIHJldHVybiDJtcm1c3R5bGVQcm9wO1xufVxuXG4vKipcbiAqIEludGVybmFsIGZ1bmN0aW9uIGZvciBhcHBseWluZyBhIHNpbmdsZSBzdHlsZSB0byBhbiBlbGVtZW50LlxuICpcbiAqIFRoZSByZWFzb24gd2h5IHRoaXMgZnVuY3Rpb24gaGFzIGJlZW4gc2VwYXJhdGVkIGZyb20gYMm1ybVzdHlsZVByb3BgIGlzIGJlY2F1c2VcbiAqIGl0IGlzIGFsc28gY2FsbGVkIGZyb20gYMm1ybVzdHlsZVByb3BJbnRlcnBvbGF0ZWAuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzdHlsZVByb3BJbnRlcm5hbChcbiAgICBlbGVtZW50SW5kZXg6IG51bWJlciwgcHJvcDogc3RyaW5nLCB2YWx1ZTogc3RyaW5nIHwgbnVtYmVyIHwgU2FmZVZhbHVlIHwgbnVsbCxcbiAgICBzdWZmaXg/OiBzdHJpbmcgfCBudWxsIHwgdW5kZWZpbmVkKTogdm9pZCB7XG4gIC8vIGlmIGEgdmFsdWUgaXMgaW50ZXJwb2xhdGVkIHRoZW4gaXQgbWF5IHJlbmRlciBhIGBOT19DSEFOR0VgIHZhbHVlLlxuICAvLyBpbiB0aGlzIGNhc2Ugd2UgZG8gbm90IG5lZWQgdG8gZG8gYW55dGhpbmcsIGJ1dCB0aGUgYmluZGluZyBpbmRleFxuICAvLyBzdGlsbCBuZWVkcyB0byBiZSBpbmNyZW1lbnRlZCBiZWNhdXNlIGFsbCBzdHlsaW5nIGJpbmRpbmcgdmFsdWVzXG4gIC8vIGFyZSBzdG9yZWQgaW5zaWRlIG9mIHRoZSBsVmlldy5cbiAgY29uc3QgYmluZGluZ0luZGV4ID0gbmV4dEJpbmRpbmdJbmRleCgpO1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IHROb2RlID0gZ2V0VE5vZGUoZWxlbWVudEluZGV4LCBsVmlldyk7XG4gIGNvbnN0IGZpcnN0VXBkYXRlUGFzcyA9IGxWaWV3W1RWSUVXXS5maXJzdFVwZGF0ZVBhc3M7XG5cbiAgLy8gd2UgY2hlY2sgZm9yIHRoaXMgaW4gdGhlIGluc3RydWN0aW9uIGNvZGUgc28gdGhhdCB0aGUgY29udGV4dCBjYW4gYmUgbm90aWZpZWRcbiAgLy8gYWJvdXQgcHJvcCBvciBtYXAgYmluZGluZ3Mgc28gdGhhdCB0aGUgZGlyZWN0IGFwcGx5IGNoZWNrIGNhbiBkZWNpZGUgZWFybGllclxuICAvLyBpZiBpdCBhbGxvd3MgZm9yIGNvbnRleHQgcmVzb2x1dGlvbiB0byBiZSBieXBhc3NlZC5cbiAgaWYgKGZpcnN0VXBkYXRlUGFzcykge1xuICAgIHBhdGNoQ29uZmlnKHROb2RlLCBUTm9kZUZsYWdzLmhhc1N0eWxlUHJvcEJpbmRpbmdzKTtcbiAgICBwYXRjaEhvc3RTdHlsaW5nRmxhZyh0Tm9kZSwgaXNIb3N0U3R5bGluZygpLCBmYWxzZSk7XG4gIH1cblxuICBjb25zdCB1cGRhdGVkID0gc3R5bGluZ1Byb3AoXG4gICAgICB0Tm9kZSwgZmlyc3RVcGRhdGVQYXNzLCBsVmlldywgYmluZGluZ0luZGV4LCBwcm9wLCByZXNvbHZlU3R5bGVQcm9wVmFsdWUodmFsdWUsIHN1ZmZpeCksXG4gICAgICBmYWxzZSk7XG4gIGlmIChuZ0Rldk1vZGUpIHtcbiAgICBuZ0Rldk1vZGUuc3R5bGVQcm9wKys7XG4gICAgaWYgKHVwZGF0ZWQpIHtcbiAgICAgIG5nRGV2TW9kZS5zdHlsZVByb3BDYWNoZU1pc3MrKztcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBVcGRhdGUgYSBjbGFzcyBiaW5kaW5nIG9uIGFuIGVsZW1lbnQgd2l0aCB0aGUgcHJvdmlkZWQgdmFsdWUuXG4gKlxuICogVGhpcyBpbnN0cnVjdGlvbiBpcyBtZWFudCB0byBoYW5kbGUgdGhlIGBbY2xhc3MuZm9vXT1cImV4cFwiYCBjYXNlIGFuZCxcbiAqIHRoZXJlZm9yZSwgdGhlIGNsYXNzIGJpbmRpbmcgaXRzZWxmIG11c3QgYWxyZWFkeSBiZSBhbGxvY2F0ZWQgdXNpbmdcbiAqIGBzdHlsaW5nYCB3aXRoaW4gdGhlIGNyZWF0aW9uIGJsb2NrLlxuICpcbiAqIEBwYXJhbSBwcm9wIEEgdmFsaWQgQ1NTIGNsYXNzIChvbmx5IG9uZSkuXG4gKiBAcGFyYW0gdmFsdWUgQSB0cnVlL2ZhbHNlIHZhbHVlIHdoaWNoIHdpbGwgdHVybiB0aGUgY2xhc3Mgb24gb3Igb2ZmLlxuICpcbiAqIE5vdGUgdGhhdCB0aGlzIHdpbGwgYXBwbHkgdGhlIHByb3ZpZGVkIGNsYXNzIHZhbHVlIHRvIHRoZSBob3N0IGVsZW1lbnQgaWYgdGhpcyBmdW5jdGlvblxuICogaXMgY2FsbGVkIHdpdGhpbiBhIGhvc3QgYmluZGluZyBmdW5jdGlvbi5cbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWNsYXNzUHJvcChjbGFzc05hbWU6IHN0cmluZywgdmFsdWU6IGJvb2xlYW4gfCBudWxsKTogVHNpY2tsZUlzc3VlMTAwOSB7XG4gIC8vIGlmIGEgdmFsdWUgaXMgaW50ZXJwb2xhdGVkIHRoZW4gaXQgbWF5IHJlbmRlciBhIGBOT19DSEFOR0VgIHZhbHVlLlxuICAvLyBpbiB0aGlzIGNhc2Ugd2UgZG8gbm90IG5lZWQgdG8gZG8gYW55dGhpbmcsIGJ1dCB0aGUgYmluZGluZyBpbmRleFxuICAvLyBzdGlsbCBuZWVkcyB0byBiZSBpbmNyZW1lbnRlZCBiZWNhdXNlIGFsbCBzdHlsaW5nIGJpbmRpbmcgdmFsdWVzXG4gIC8vIGFyZSBzdG9yZWQgaW5zaWRlIG9mIHRoZSBsVmlldy5cbiAgY29uc3QgYmluZGluZ0luZGV4ID0gbmV4dEJpbmRpbmdJbmRleCgpO1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IGVsZW1lbnRJbmRleCA9IGdldFNlbGVjdGVkSW5kZXgoKTtcbiAgY29uc3QgdE5vZGUgPSBnZXRUTm9kZShlbGVtZW50SW5kZXgsIGxWaWV3KTtcbiAgY29uc3QgZmlyc3RVcGRhdGVQYXNzID0gbFZpZXdbVFZJRVddLmZpcnN0VXBkYXRlUGFzcztcblxuICAvLyB3ZSBjaGVjayBmb3IgdGhpcyBpbiB0aGUgaW5zdHJ1Y3Rpb24gY29kZSBzbyB0aGF0IHRoZSBjb250ZXh0IGNhbiBiZSBub3RpZmllZFxuICAvLyBhYm91dCBwcm9wIG9yIG1hcCBiaW5kaW5ncyBzbyB0aGF0IHRoZSBkaXJlY3QgYXBwbHkgY2hlY2sgY2FuIGRlY2lkZSBlYXJsaWVyXG4gIC8vIGlmIGl0IGFsbG93cyBmb3IgY29udGV4dCByZXNvbHV0aW9uIHRvIGJlIGJ5cGFzc2VkLlxuICBpZiAoZmlyc3RVcGRhdGVQYXNzKSB7XG4gICAgcGF0Y2hDb25maWcodE5vZGUsIFROb2RlRmxhZ3MuaGFzQ2xhc3NQcm9wQmluZGluZ3MpO1xuICAgIHBhdGNoSG9zdFN0eWxpbmdGbGFnKHROb2RlLCBpc0hvc3RTdHlsaW5nKCksIHRydWUpO1xuICB9XG5cbiAgY29uc3QgdXBkYXRlZCA9IHN0eWxpbmdQcm9wKHROb2RlLCBmaXJzdFVwZGF0ZVBhc3MsIGxWaWV3LCBiaW5kaW5nSW5kZXgsIGNsYXNzTmFtZSwgdmFsdWUsIHRydWUpO1xuICBpZiAobmdEZXZNb2RlKSB7XG4gICAgbmdEZXZNb2RlLmNsYXNzUHJvcCsrO1xuICAgIGlmICh1cGRhdGVkKSB7XG4gICAgICBuZ0Rldk1vZGUuY2xhc3NQcm9wQ2FjaGVNaXNzKys7XG4gICAgfVxuICB9XG4gIHJldHVybiDJtcm1Y2xhc3NQcm9wO1xufVxuXG4vKipcbiAqIFNoYXJlZCBmdW5jdGlvbiB1c2VkIHRvIHVwZGF0ZSBhIHByb3AtYmFzZWQgc3R5bGluZyBiaW5kaW5nIGZvciBhbiBlbGVtZW50LlxuICpcbiAqIERlcGVuZGluZyBvbiB0aGUgc3RhdGUgb2YgdGhlIGB0Tm9kZS5zdHlsZXNgIHN0eWxlcyBjb250ZXh0LCB0aGUgc3R5bGUvcHJvcFxuICogdmFsdWUgbWF5IGJlIGFwcGxpZWQgZGlyZWN0bHkgdG8gdGhlIGVsZW1lbnQgaW5zdGVhZCBvZiBiZWluZyBwcm9jZXNzZWRcbiAqIHRocm91Z2ggdGhlIGNvbnRleHQuIFRoZSByZWFzb24gd2h5IHRoaXMgb2NjdXJzIGlzIGZvciBwZXJmb3JtYW5jZSBhbmQgZnVsbHlcbiAqIGRlcGVuZHMgb24gdGhlIHN0YXRlIG9mIHRoZSBjb250ZXh0IChpLmUuIHdoZXRoZXIgb3Igbm90IHRoZXJlIGFyZSBkdXBsaWNhdGVcbiAqIGJpbmRpbmdzIG9yIHdoZXRoZXIgb3Igbm90IHRoZXJlIGFyZSBtYXAtYmFzZWQgYmluZGluZ3MgYW5kIHByb3BlcnR5IGJpbmRpbmdzXG4gKiBwcmVzZW50IHRvZ2V0aGVyKS5cbiAqL1xuZnVuY3Rpb24gc3R5bGluZ1Byb3AoXG4gICAgdE5vZGU6IFROb2RlLCBmaXJzdFVwZGF0ZVBhc3M6IGJvb2xlYW4sIGxWaWV3OiBMVmlldywgYmluZGluZ0luZGV4OiBudW1iZXIsIHByb3A6IHN0cmluZyxcbiAgICB2YWx1ZTogYm9vbGVhbiB8IG51bWJlciB8IFNhZmVWYWx1ZSB8IHN0cmluZyB8IG51bGwgfCB1bmRlZmluZWQgfCBOT19DSEFOR0UsXG4gICAgaXNDbGFzc0Jhc2VkOiBib29sZWFuKTogYm9vbGVhbiB7XG4gIGxldCB1cGRhdGVkID0gZmFsc2U7XG5cbiAgY29uc3QgbmF0aXZlID0gZ2V0TmF0aXZlQnlUTm9kZSh0Tm9kZSwgbFZpZXcpIGFzIFJFbGVtZW50O1xuICBjb25zdCBjb250ZXh0ID0gaXNDbGFzc0Jhc2VkID8gZ2V0Q2xhc3Nlc0NvbnRleHQodE5vZGUpIDogZ2V0U3R5bGVzQ29udGV4dCh0Tm9kZSk7XG4gIGNvbnN0IHNhbml0aXplciA9IGlzQ2xhc3NCYXNlZCA/IG51bGwgOiBnZXRDdXJyZW50U3R5bGVTYW5pdGl6ZXIoKTtcblxuICAvLyBbc3R5bGUucHJvcF0gYW5kIFtjbGFzcy5uYW1lXSBiaW5kaW5ncyBkbyBub3QgdXNlIGBiaW5kKClgIGFuZCB3aWxsXG4gIC8vIHRoZXJlZm9yZSBtYW5hZ2UgYWNjZXNzaW5nIGFuZCB1cGRhdGluZyB0aGUgbmV3IHZhbHVlIGluIHRoZSBsVmlldyBkaXJlY3RseS5cbiAgLy8gRm9yIHRoaXMgcmVhc29uLCB0aGUgY2hlY2tOb0NoYW5nZXMgc2l0dWF0aW9uIG11c3QgYWxzbyBiZSBoYW5kbGVkIGhlcmVcbiAgLy8gYXMgd2VsbC5cbiAgaWYgKG5nRGV2TW9kZSAmJiBnZXRDaGVja05vQ2hhbmdlc01vZGUoKSkge1xuICAgIGNvbnN0IG9sZFZhbHVlID0gZ2V0VmFsdWUobFZpZXcsIGJpbmRpbmdJbmRleCk7XG4gICAgaWYgKGhhc1ZhbHVlQ2hhbmdlZFVud3JhcFNhZmVWYWx1ZShvbGRWYWx1ZSwgdmFsdWUpKSB7XG4gICAgICB0aHJvd0Vycm9ySWZOb0NoYW5nZXNNb2RlKGZhbHNlLCBvbGRWYWx1ZSwgdmFsdWUpO1xuICAgIH1cbiAgfVxuXG4gIC8vIERpcmVjdCBBcHBseSBDYXNlOiBieXBhc3MgY29udGV4dCByZXNvbHV0aW9uIGFuZCBhcHBseSB0aGVcbiAgLy8gc3R5bGUvY2xhc3MgdmFsdWUgZGlyZWN0bHkgdG8gdGhlIGVsZW1lbnRcbiAgaWYgKGFsbG93RGlyZWN0U3R5bGluZyh0Tm9kZSwgaXNDbGFzc0Jhc2VkLCBmaXJzdFVwZGF0ZVBhc3MpKSB7XG4gICAgY29uc3Qgc2FuaXRpemVyVG9Vc2UgPSBpc0NsYXNzQmFzZWQgPyBudWxsIDogc2FuaXRpemVyO1xuICAgIGNvbnN0IHJlbmRlcmVyID0gZ2V0UmVuZGVyZXIodE5vZGUsIGxWaWV3KTtcbiAgICB1cGRhdGVkID0gYXBwbHlTdHlsaW5nVmFsdWVEaXJlY3RseShcbiAgICAgICAgcmVuZGVyZXIsIGNvbnRleHQsIHROb2RlLCBuYXRpdmUsIGxWaWV3LCBiaW5kaW5nSW5kZXgsIHByb3AsIHZhbHVlLCBpc0NsYXNzQmFzZWQsXG4gICAgICAgIHNhbml0aXplclRvVXNlKTtcblxuICAgIGlmIChzYW5pdGl6ZXJUb1VzZSkge1xuICAgICAgLy8gaXQncyBpbXBvcnRhbnQgd2UgcmVtb3ZlIHRoZSBjdXJyZW50IHN0eWxlIHNhbml0aXplciBvbmNlIHRoZVxuICAgICAgLy8gZWxlbWVudCBleGl0cywgb3RoZXJ3aXNlIGl0IHdpbGwgYmUgdXNlZCBieSB0aGUgbmV4dCBzdHlsaW5nXG4gICAgICAvLyBpbnN0cnVjdGlvbnMgZm9yIHRoZSBuZXh0IGVsZW1lbnQuXG4gICAgICBzZXRFbGVtZW50RXhpdEZuKHN0eWxpbmdBcHBseSk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIC8vIENvbnRleHQgUmVzb2x1dGlvbiAob3IgZmlyc3QgdXBkYXRlKSBDYXNlOiBzYXZlIHRoZSB2YWx1ZVxuICAgIC8vIGFuZCBkZWZlciB0byB0aGUgY29udGV4dCB0byBmbHVzaCBhbmQgYXBwbHkgdGhlIHN0eWxlL2NsYXNzIGJpbmRpbmdcbiAgICAvLyB2YWx1ZSB0byB0aGUgZWxlbWVudC5cbiAgICBjb25zdCBkaXJlY3RpdmVJbmRleCA9IGdldEFjdGl2ZURpcmVjdGl2ZUlkKCk7XG4gICAgaWYgKGlzQ2xhc3NCYXNlZCkge1xuICAgICAgdXBkYXRlZCA9IHVwZGF0ZUNsYXNzVmlhQ29udGV4dChcbiAgICAgICAgICBjb250ZXh0LCB0Tm9kZSwgbFZpZXcsIG5hdGl2ZSwgZGlyZWN0aXZlSW5kZXgsIHByb3AsIGJpbmRpbmdJbmRleCxcbiAgICAgICAgICB2YWx1ZSBhcyBzdHJpbmcgfCBib29sZWFuIHwgbnVsbCwgZmFsc2UsIGZpcnN0VXBkYXRlUGFzcyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHVwZGF0ZWQgPSB1cGRhdGVTdHlsZVZpYUNvbnRleHQoXG4gICAgICAgICAgY29udGV4dCwgdE5vZGUsIGxWaWV3LCBuYXRpdmUsIGRpcmVjdGl2ZUluZGV4LCBwcm9wLCBiaW5kaW5nSW5kZXgsXG4gICAgICAgICAgdmFsdWUgYXMgc3RyaW5nIHwgU2FmZVZhbHVlIHwgbnVsbCwgc2FuaXRpemVyLCBmYWxzZSwgZmlyc3RVcGRhdGVQYXNzKTtcbiAgICB9XG5cbiAgICBzZXRFbGVtZW50RXhpdEZuKHN0eWxpbmdBcHBseSk7XG4gIH1cblxuICByZXR1cm4gdXBkYXRlZDtcbn1cblxuLyoqXG4gKiBVcGRhdGUgc3R5bGUgYmluZGluZ3MgdXNpbmcgYW4gb2JqZWN0IGxpdGVyYWwgb24gYW4gZWxlbWVudC5cbiAqXG4gKiBUaGlzIGluc3RydWN0aW9uIGlzIG1lYW50IHRvIGFwcGx5IHN0eWxpbmcgdmlhIHRoZSBgW3N0eWxlXT1cImV4cFwiYCB0ZW1wbGF0ZSBiaW5kaW5ncy5cbiAqIFdoZW4gc3R5bGVzIGFyZSBhcHBsaWVkIHRvIHRoZSBlbGVtZW50IHRoZXkgd2lsbCB0aGVuIGJlIHVwZGF0ZWQgd2l0aCByZXNwZWN0IHRvXG4gKiBhbnkgc3R5bGVzL2NsYXNzZXMgc2V0IHZpYSBgc3R5bGVQcm9wYC4gSWYgYW55IHN0eWxlcyBhcmUgc2V0IHRvIGZhbHN5XG4gKiB0aGVuIHRoZXkgd2lsbCBiZSByZW1vdmVkIGZyb20gdGhlIGVsZW1lbnQuXG4gKlxuICogTm90ZSB0aGF0IHRoZSBzdHlsaW5nIGluc3RydWN0aW9uIHdpbGwgbm90IGJlIGFwcGxpZWQgdW50aWwgYHN0eWxpbmdBcHBseWAgaXMgY2FsbGVkLlxuICpcbiAqIEBwYXJhbSBzdHlsZXMgQSBrZXkvdmFsdWUgc3R5bGUgbWFwIG9mIHRoZSBzdHlsZXMgdGhhdCB3aWxsIGJlIGFwcGxpZWQgdG8gdGhlIGdpdmVuIGVsZW1lbnQuXG4gKiAgICAgICAgQW55IG1pc3Npbmcgc3R5bGVzICh0aGF0IGhhdmUgYWxyZWFkeSBiZWVuIGFwcGxpZWQgdG8gdGhlIGVsZW1lbnQgYmVmb3JlaGFuZCkgd2lsbCBiZVxuICogICAgICAgIHJlbW92ZWQgKHVuc2V0KSBmcm9tIHRoZSBlbGVtZW50J3Mgc3R5bGluZy5cbiAqXG4gKiBOb3RlIHRoYXQgdGhpcyB3aWxsIGFwcGx5IHRoZSBwcm92aWRlZCBzdHlsZU1hcCB2YWx1ZSB0byB0aGUgaG9zdCBlbGVtZW50IGlmIHRoaXMgZnVuY3Rpb25cbiAqIGlzIGNhbGxlZCB3aXRoaW4gYSBob3N0IGJpbmRpbmcuXG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVzdHlsZU1hcChzdHlsZXM6IHtbc3R5bGVOYW1lOiBzdHJpbmddOiBhbnl9IHwgTk9fQ0hBTkdFIHwgbnVsbCk6IHZvaWQge1xuICBjb25zdCBpbmRleCA9IGdldFNlbGVjdGVkSW5kZXgoKTtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCB0Tm9kZSA9IGdldFROb2RlKGluZGV4LCBsVmlldyk7XG4gIGNvbnN0IGZpcnN0VXBkYXRlUGFzcyA9IGxWaWV3W1RWSUVXXS5maXJzdFVwZGF0ZVBhc3M7XG4gIGNvbnN0IGNvbnRleHQgPSBnZXRTdHlsZXNDb250ZXh0KHROb2RlKTtcbiAgY29uc3QgaGFzRGlyZWN0aXZlSW5wdXQgPSBoYXNTdHlsZUlucHV0KHROb2RlKTtcblxuICAvLyBpZiBhIHZhbHVlIGlzIGludGVycG9sYXRlZCB0aGVuIGl0IG1heSByZW5kZXIgYSBgTk9fQ0hBTkdFYCB2YWx1ZS5cbiAgLy8gaW4gdGhpcyBjYXNlIHdlIGRvIG5vdCBuZWVkIHRvIGRvIGFueXRoaW5nLCBidXQgdGhlIGJpbmRpbmcgaW5kZXhcbiAgLy8gc3RpbGwgbmVlZHMgdG8gYmUgaW5jcmVtZW50ZWQgYmVjYXVzZSBhbGwgc3R5bGluZyBiaW5kaW5nIHZhbHVlc1xuICAvLyBhcmUgc3RvcmVkIGluc2lkZSBvZiB0aGUgbFZpZXcuXG4gIGNvbnN0IGJpbmRpbmdJbmRleCA9IGluY3JlbWVudEJpbmRpbmdJbmRleCgyKTtcbiAgY29uc3QgaG9zdEJpbmRpbmdzTW9kZSA9IGlzSG9zdFN0eWxpbmcoKTtcblxuICAvLyBpbnB1dHMgYXJlIG9ubHkgZXZhbHVhdGVkIGZyb20gYSB0ZW1wbGF0ZSBiaW5kaW5nIGludG8gYSBkaXJlY3RpdmUsIHRoZXJlZm9yZSxcbiAgLy8gdGhlcmUgc2hvdWxkIG5vdCBiZSBhIHNpdHVhdGlvbiB3aGVyZSBhIGRpcmVjdGl2ZSBob3N0IGJpbmRpbmdzIGZ1bmN0aW9uXG4gIC8vIGV2YWx1YXRlcyB0aGUgaW5wdXRzICh0aGlzIHNob3VsZCBvbmx5IGhhcHBlbiBpbiB0aGUgdGVtcGxhdGUgZnVuY3Rpb24pXG4gIGlmICghaG9zdEJpbmRpbmdzTW9kZSAmJiBoYXNEaXJlY3RpdmVJbnB1dCAmJiBzdHlsZXMgIT09IE5PX0NIQU5HRSkge1xuICAgIHVwZGF0ZURpcmVjdGl2ZUlucHV0VmFsdWUoY29udGV4dCwgbFZpZXcsIHROb2RlLCBiaW5kaW5nSW5kZXgsIHN0eWxlcywgZmFsc2UsIGZpcnN0VXBkYXRlUGFzcyk7XG4gICAgc3R5bGVzID0gTk9fQ0hBTkdFO1xuICB9XG5cbiAgLy8gd2UgY2hlY2sgZm9yIHRoaXMgaW4gdGhlIGluc3RydWN0aW9uIGNvZGUgc28gdGhhdCB0aGUgY29udGV4dCBjYW4gYmUgbm90aWZpZWRcbiAgLy8gYWJvdXQgcHJvcCBvciBtYXAgYmluZGluZ3Mgc28gdGhhdCB0aGUgZGlyZWN0IGFwcGx5IGNoZWNrIGNhbiBkZWNpZGUgZWFybGllclxuICAvLyBpZiBpdCBhbGxvd3MgZm9yIGNvbnRleHQgcmVzb2x1dGlvbiB0byBiZSBieXBhc3NlZC5cbiAgaWYgKGZpcnN0VXBkYXRlUGFzcykge1xuICAgIHBhdGNoQ29uZmlnKHROb2RlLCBUTm9kZUZsYWdzLmhhc1N0eWxlTWFwQmluZGluZ3MpO1xuICAgIHBhdGNoSG9zdFN0eWxpbmdGbGFnKHROb2RlLCBpc0hvc3RTdHlsaW5nKCksIGZhbHNlKTtcbiAgfVxuXG4gIHN0eWxpbmdNYXAoXG4gICAgICBjb250ZXh0LCB0Tm9kZSwgZmlyc3RVcGRhdGVQYXNzLCBsVmlldywgYmluZGluZ0luZGV4LCBzdHlsZXMsIGZhbHNlLCBoYXNEaXJlY3RpdmVJbnB1dCk7XG59XG5cbi8qKlxuICogVXBkYXRlIGNsYXNzIGJpbmRpbmdzIHVzaW5nIGFuIG9iamVjdCBsaXRlcmFsIG9yIGNsYXNzLXN0cmluZyBvbiBhbiBlbGVtZW50LlxuICpcbiAqIFRoaXMgaW5zdHJ1Y3Rpb24gaXMgbWVhbnQgdG8gYXBwbHkgc3R5bGluZyB2aWEgdGhlIGBbY2xhc3NdPVwiZXhwXCJgIHRlbXBsYXRlIGJpbmRpbmdzLlxuICogV2hlbiBjbGFzc2VzIGFyZSBhcHBsaWVkIHRvIHRoZSBlbGVtZW50IHRoZXkgd2lsbCB0aGVuIGJlIHVwZGF0ZWQgd2l0aFxuICogcmVzcGVjdCB0byBhbnkgc3R5bGVzL2NsYXNzZXMgc2V0IHZpYSBgY2xhc3NQcm9wYC4gSWYgYW55XG4gKiBjbGFzc2VzIGFyZSBzZXQgdG8gZmFsc3kgdGhlbiB0aGV5IHdpbGwgYmUgcmVtb3ZlZCBmcm9tIHRoZSBlbGVtZW50LlxuICpcbiAqIE5vdGUgdGhhdCB0aGUgc3R5bGluZyBpbnN0cnVjdGlvbiB3aWxsIG5vdCBiZSBhcHBsaWVkIHVudGlsIGBzdHlsaW5nQXBwbHlgIGlzIGNhbGxlZC5cbiAqIE5vdGUgdGhhdCB0aGlzIHdpbGwgdGhlIHByb3ZpZGVkIGNsYXNzTWFwIHZhbHVlIHRvIHRoZSBob3N0IGVsZW1lbnQgaWYgdGhpcyBmdW5jdGlvbiBpcyBjYWxsZWRcbiAqIHdpdGhpbiBhIGhvc3QgYmluZGluZy5cbiAqXG4gKiBAcGFyYW0gY2xhc3NlcyBBIGtleS92YWx1ZSBtYXAgb3Igc3RyaW5nIG9mIENTUyBjbGFzc2VzIHRoYXQgd2lsbCBiZSBhZGRlZCB0byB0aGVcbiAqICAgICAgICBnaXZlbiBlbGVtZW50LiBBbnkgbWlzc2luZyBjbGFzc2VzICh0aGF0IGhhdmUgYWxyZWFkeSBiZWVuIGFwcGxpZWQgdG8gdGhlIGVsZW1lbnRcbiAqICAgICAgICBiZWZvcmVoYW5kKSB3aWxsIGJlIHJlbW92ZWQgKHVuc2V0KSBmcm9tIHRoZSBlbGVtZW50J3MgbGlzdCBvZiBDU1MgY2xhc3Nlcy5cbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWNsYXNzTWFwKGNsYXNzZXM6IHtbY2xhc3NOYW1lOiBzdHJpbmddOiBhbnl9IHwgTk9fQ0hBTkdFIHwgc3RyaW5nIHwgbnVsbCk6IHZvaWQge1xuICBjbGFzc01hcEludGVybmFsKGdldFNlbGVjdGVkSW5kZXgoKSwgY2xhc3Nlcyk7XG59XG5cbi8qKlxuICogSW50ZXJuYWwgZnVuY3Rpb24gZm9yIGFwcGx5aW5nIGEgY2xhc3Mgc3RyaW5nIG9yIGtleS92YWx1ZSBtYXAgb2YgY2xhc3NlcyB0byBhbiBlbGVtZW50LlxuICpcbiAqIFRoZSByZWFzb24gd2h5IHRoaXMgZnVuY3Rpb24gaGFzIGJlZW4gc2VwYXJhdGVkIGZyb20gYMm1ybVjbGFzc01hcGAgaXMgYmVjYXVzZVxuICogaXQgaXMgYWxzbyBjYWxsZWQgZnJvbSBgybXJtWNsYXNzTWFwSW50ZXJwb2xhdGVgLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY2xhc3NNYXBJbnRlcm5hbChcbiAgICBlbGVtZW50SW5kZXg6IG51bWJlciwgY2xhc3Nlczoge1tjbGFzc05hbWU6IHN0cmluZ106IGFueX0gfCBOT19DSEFOR0UgfCBzdHJpbmcgfCBudWxsKTogdm9pZCB7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgdE5vZGUgPSBnZXRUTm9kZShlbGVtZW50SW5kZXgsIGxWaWV3KTtcbiAgY29uc3QgZmlyc3RVcGRhdGVQYXNzID0gbFZpZXdbVFZJRVddLmZpcnN0VXBkYXRlUGFzcztcbiAgY29uc3QgY29udGV4dCA9IGdldENsYXNzZXNDb250ZXh0KHROb2RlKTtcbiAgY29uc3QgaGFzRGlyZWN0aXZlSW5wdXQgPSBoYXNDbGFzc0lucHV0KHROb2RlKTtcblxuICAvLyBpZiBhIHZhbHVlIGlzIGludGVycG9sYXRlZCB0aGVuIGl0IG1heSByZW5kZXIgYSBgTk9fQ0hBTkdFYCB2YWx1ZS5cbiAgLy8gaW4gdGhpcyBjYXNlIHdlIGRvIG5vdCBuZWVkIHRvIGRvIGFueXRoaW5nLCBidXQgdGhlIGJpbmRpbmcgaW5kZXhcbiAgLy8gc3RpbGwgbmVlZHMgdG8gYmUgaW5jcmVtZW50ZWQgYmVjYXVzZSBhbGwgc3R5bGluZyBiaW5kaW5nIHZhbHVlc1xuICAvLyBhcmUgc3RvcmVkIGluc2lkZSBvZiB0aGUgbFZpZXcuXG4gIGNvbnN0IGJpbmRpbmdJbmRleCA9IGluY3JlbWVudEJpbmRpbmdJbmRleCgyKTtcbiAgY29uc3QgaG9zdEJpbmRpbmdzTW9kZSA9IGlzSG9zdFN0eWxpbmcoKTtcblxuICAvLyBpbnB1dHMgYXJlIG9ubHkgZXZhbHVhdGVkIGZyb20gYSB0ZW1wbGF0ZSBiaW5kaW5nIGludG8gYSBkaXJlY3RpdmUsIHRoZXJlZm9yZSxcbiAgLy8gdGhlcmUgc2hvdWxkIG5vdCBiZSBhIHNpdHVhdGlvbiB3aGVyZSBhIGRpcmVjdGl2ZSBob3N0IGJpbmRpbmdzIGZ1bmN0aW9uXG4gIC8vIGV2YWx1YXRlcyB0aGUgaW5wdXRzICh0aGlzIHNob3VsZCBvbmx5IGhhcHBlbiBpbiB0aGUgdGVtcGxhdGUgZnVuY3Rpb24pXG4gIGlmICghaG9zdEJpbmRpbmdzTW9kZSAmJiBoYXNEaXJlY3RpdmVJbnB1dCAmJiBjbGFzc2VzICE9PSBOT19DSEFOR0UpIHtcbiAgICB1cGRhdGVEaXJlY3RpdmVJbnB1dFZhbHVlKGNvbnRleHQsIGxWaWV3LCB0Tm9kZSwgYmluZGluZ0luZGV4LCBjbGFzc2VzLCB0cnVlLCBmaXJzdFVwZGF0ZVBhc3MpO1xuICAgIGNsYXNzZXMgPSBOT19DSEFOR0U7XG4gIH1cblxuICAvLyB3ZSBjaGVjayBmb3IgdGhpcyBpbiB0aGUgaW5zdHJ1Y3Rpb24gY29kZSBzbyB0aGF0IHRoZSBjb250ZXh0IGNhbiBiZSBub3RpZmllZFxuICAvLyBhYm91dCBwcm9wIG9yIG1hcCBiaW5kaW5ncyBzbyB0aGF0IHRoZSBkaXJlY3QgYXBwbHkgY2hlY2sgY2FuIGRlY2lkZSBlYXJsaWVyXG4gIC8vIGlmIGl0IGFsbG93cyBmb3IgY29udGV4dCByZXNvbHV0aW9uIHRvIGJlIGJ5cGFzc2VkLlxuICBpZiAoZmlyc3RVcGRhdGVQYXNzKSB7XG4gICAgcGF0Y2hDb25maWcodE5vZGUsIFROb2RlRmxhZ3MuaGFzQ2xhc3NNYXBCaW5kaW5ncyk7XG4gICAgcGF0Y2hIb3N0U3R5bGluZ0ZsYWcodE5vZGUsIGlzSG9zdFN0eWxpbmcoKSwgdHJ1ZSk7XG4gIH1cblxuICBzdHlsaW5nTWFwKFxuICAgICAgY29udGV4dCwgdE5vZGUsIGZpcnN0VXBkYXRlUGFzcywgbFZpZXcsIGJpbmRpbmdJbmRleCwgY2xhc3NlcywgdHJ1ZSwgaGFzRGlyZWN0aXZlSW5wdXQpO1xufVxuXG4vKipcbiAqIFNoYXJlZCBmdW5jdGlvbiB1c2VkIHRvIHVwZGF0ZSBhIG1hcC1iYXNlZCBzdHlsaW5nIGJpbmRpbmcgZm9yIGFuIGVsZW1lbnQuXG4gKlxuICogV2hlbiB0aGlzIGZ1bmN0aW9uIGlzIGNhbGxlZCBpdCB3aWxsIGFjdGl2YXRlIHN1cHBvcnQgZm9yIGBbc3R5bGVdYCBhbmRcbiAqIGBbY2xhc3NdYCBiaW5kaW5ncyBpbiBBbmd1bGFyLlxuICovXG5mdW5jdGlvbiBzdHlsaW5nTWFwKFxuICAgIGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCwgdE5vZGU6IFROb2RlLCBmaXJzdFVwZGF0ZVBhc3M6IGJvb2xlYW4sIGxWaWV3OiBMVmlldyxcbiAgICBiaW5kaW5nSW5kZXg6IG51bWJlciwgdmFsdWU6IHtba2V5OiBzdHJpbmddOiBhbnl9IHwgc3RyaW5nIHwgbnVsbCwgaXNDbGFzc0Jhc2VkOiBib29sZWFuLFxuICAgIGhhc0RpcmVjdGl2ZUlucHV0OiBib29sZWFuKTogdm9pZCB7XG4gIGNvbnN0IGRpcmVjdGl2ZUluZGV4ID0gZ2V0QWN0aXZlRGlyZWN0aXZlSWQoKTtcbiAgY29uc3QgbmF0aXZlID0gZ2V0TmF0aXZlQnlUTm9kZSh0Tm9kZSwgbFZpZXcpIGFzIFJFbGVtZW50O1xuICBjb25zdCBvbGRWYWx1ZSA9IGdldFZhbHVlKGxWaWV3LCBiaW5kaW5nSW5kZXgpO1xuICBjb25zdCBzYW5pdGl6ZXIgPSBnZXRDdXJyZW50U3R5bGVTYW5pdGl6ZXIoKTtcbiAgY29uc3QgdmFsdWVIYXNDaGFuZ2VkID0gaGFzVmFsdWVDaGFuZ2VkKG9sZFZhbHVlLCB2YWx1ZSk7XG5cbiAgLy8gW3N0eWxlXSBhbmQgW2NsYXNzXSBiaW5kaW5ncyBkbyBub3QgdXNlIGBiaW5kKClgIGFuZCB3aWxsIHRoZXJlZm9yZVxuICAvLyBtYW5hZ2UgYWNjZXNzaW5nIGFuZCB1cGRhdGluZyB0aGUgbmV3IHZhbHVlIGluIHRoZSBsVmlldyBkaXJlY3RseS5cbiAgLy8gRm9yIHRoaXMgcmVhc29uLCB0aGUgY2hlY2tOb0NoYW5nZXMgc2l0dWF0aW9uIG11c3QgYWxzbyBiZSBoYW5kbGVkIGhlcmVcbiAgLy8gYXMgd2VsbC5cbiAgaWYgKG5nRGV2TW9kZSAmJiB2YWx1ZUhhc0NoYW5nZWQgJiYgZ2V0Q2hlY2tOb0NoYW5nZXNNb2RlKCkpIHtcbiAgICB0aHJvd0Vycm9ySWZOb0NoYW5nZXNNb2RlKGZhbHNlLCBvbGRWYWx1ZSwgdmFsdWUpO1xuICB9XG5cbiAgLy8gRGlyZWN0IEFwcGx5IENhc2U6IGJ5cGFzcyBjb250ZXh0IHJlc29sdXRpb24gYW5kIGFwcGx5IHRoZVxuICAvLyBzdHlsZS9jbGFzcyBtYXAgdmFsdWVzIGRpcmVjdGx5IHRvIHRoZSBlbGVtZW50XG4gIGlmIChhbGxvd0RpcmVjdFN0eWxpbmcodE5vZGUsIGlzQ2xhc3NCYXNlZCwgZmlyc3RVcGRhdGVQYXNzKSkge1xuICAgIGNvbnN0IHNhbml0aXplclRvVXNlID0gaXNDbGFzc0Jhc2VkID8gbnVsbCA6IHNhbml0aXplcjtcbiAgICBjb25zdCByZW5kZXJlciA9IGdldFJlbmRlcmVyKHROb2RlLCBsVmlldyk7XG4gICAgYXBwbHlTdHlsaW5nTWFwRGlyZWN0bHkoXG4gICAgICAgIHJlbmRlcmVyLCBjb250ZXh0LCB0Tm9kZSwgbmF0aXZlLCBsVmlldywgYmluZGluZ0luZGV4LCB2YWx1ZSwgaXNDbGFzc0Jhc2VkLCBzYW5pdGl6ZXJUb1VzZSxcbiAgICAgICAgdmFsdWVIYXNDaGFuZ2VkLCBoYXNEaXJlY3RpdmVJbnB1dCk7XG4gICAgaWYgKHNhbml0aXplclRvVXNlKSB7XG4gICAgICAvLyBpdCdzIGltcG9ydGFudCB3ZSByZW1vdmUgdGhlIGN1cnJlbnQgc3R5bGUgc2FuaXRpemVyIG9uY2UgdGhlXG4gICAgICAvLyBlbGVtZW50IGV4aXRzLCBvdGhlcndpc2UgaXQgd2lsbCBiZSB1c2VkIGJ5IHRoZSBuZXh0IHN0eWxpbmdcbiAgICAgIC8vIGluc3RydWN0aW9ucyBmb3IgdGhlIG5leHQgZWxlbWVudC5cbiAgICAgIHNldEVsZW1lbnRFeGl0Rm4oc3R5bGluZ0FwcGx5KTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgY29uc3Qgc3R5bGluZ01hcEFyciA9XG4gICAgICAgIHZhbHVlID09PSBOT19DSEFOR0UgPyBOT19DSEFOR0UgOiBub3JtYWxpemVJbnRvU3R5bGluZ01hcChvbGRWYWx1ZSwgdmFsdWUsICFpc0NsYXNzQmFzZWQpO1xuXG4gICAgYWN0aXZhdGVTdHlsaW5nTWFwRmVhdHVyZSgpO1xuXG4gICAgLy8gQ29udGV4dCBSZXNvbHV0aW9uIChvciBmaXJzdCB1cGRhdGUpIENhc2U6IHNhdmUgdGhlIG1hcCB2YWx1ZVxuICAgIC8vIGFuZCBkZWZlciB0byB0aGUgY29udGV4dCB0byBmbHVzaCBhbmQgYXBwbHkgdGhlIHN0eWxlL2NsYXNzIGJpbmRpbmdcbiAgICAvLyB2YWx1ZSB0byB0aGUgZWxlbWVudC5cbiAgICBpZiAoaXNDbGFzc0Jhc2VkKSB7XG4gICAgICB1cGRhdGVDbGFzc1ZpYUNvbnRleHQoXG4gICAgICAgICAgY29udGV4dCwgdE5vZGUsIGxWaWV3LCBuYXRpdmUsIGRpcmVjdGl2ZUluZGV4LCBudWxsLCBiaW5kaW5nSW5kZXgsIHN0eWxpbmdNYXBBcnIsXG4gICAgICAgICAgdmFsdWVIYXNDaGFuZ2VkLCBmaXJzdFVwZGF0ZVBhc3MpO1xuICAgIH0gZWxzZSB7XG4gICAgICB1cGRhdGVTdHlsZVZpYUNvbnRleHQoXG4gICAgICAgICAgY29udGV4dCwgdE5vZGUsIGxWaWV3LCBuYXRpdmUsIGRpcmVjdGl2ZUluZGV4LCBudWxsLCBiaW5kaW5nSW5kZXgsIHN0eWxpbmdNYXBBcnIsXG4gICAgICAgICAgc2FuaXRpemVyLCB2YWx1ZUhhc0NoYW5nZWQsIGZpcnN0VXBkYXRlUGFzcyk7XG4gICAgfVxuXG4gICAgc2V0RWxlbWVudEV4aXRGbihzdHlsaW5nQXBwbHkpO1xuICB9XG5cbiAgaWYgKG5nRGV2TW9kZSkge1xuICAgIGlzQ2xhc3NCYXNlZCA/IG5nRGV2TW9kZS5jbGFzc01hcCA6IG5nRGV2TW9kZS5zdHlsZU1hcCsrO1xuICAgIGlmICh2YWx1ZUhhc0NoYW5nZWQpIHtcbiAgICAgIGlzQ2xhc3NCYXNlZCA/IG5nRGV2TW9kZS5jbGFzc01hcENhY2hlTWlzcyA6IG5nRGV2TW9kZS5zdHlsZU1hcENhY2hlTWlzcysrO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIFdyaXRlcyBhIHZhbHVlIHRvIGEgZGlyZWN0aXZlJ3MgYHN0eWxlYCBvciBgY2xhc3NgIGlucHV0IGJpbmRpbmcgKGlmIGl0IGhhcyBjaGFuZ2VkKS5cbiAqXG4gKiBJZiBhIGRpcmVjdGl2ZSBoYXMgYSBgQElucHV0YCBiaW5kaW5nIHRoYXQgaXMgc2V0IG9uIGBzdHlsZWAgb3IgYGNsYXNzYCB0aGVuIHRoYXQgdmFsdWVcbiAqIHdpbGwgdGFrZSBwcmlvcml0eSBvdmVyIHRoZSB1bmRlcmx5aW5nIHN0eWxlL2NsYXNzIHN0eWxpbmcgYmluZGluZ3MuIFRoaXMgdmFsdWUgd2lsbFxuICogYmUgdXBkYXRlZCBmb3IgdGhlIGJpbmRpbmcgZWFjaCB0aW1lIGR1cmluZyBjaGFuZ2UgZGV0ZWN0aW9uLlxuICpcbiAqIFdoZW4gdGhpcyBvY2N1cnMgdGhpcyBmdW5jdGlvbiB3aWxsIGF0dGVtcHQgdG8gd3JpdGUgdGhlIHZhbHVlIHRvIHRoZSBpbnB1dCBiaW5kaW5nXG4gKiBkZXBlbmRpbmcgb24gdGhlIGZvbGxvd2luZyBzaXR1YXRpb25zOlxuICpcbiAqIC0gSWYgYG9sZFZhbHVlICE9PSBuZXdWYWx1ZWBcbiAqIC0gSWYgYG5ld1ZhbHVlYCBpcyBgbnVsbGAgKGJ1dCB0aGlzIGlzIHNraXBwZWQgaWYgaXQgaXMgZHVyaW5nIHRoZSBmaXJzdCB1cGRhdGUgcGFzcylcbiAqL1xuZnVuY3Rpb24gdXBkYXRlRGlyZWN0aXZlSW5wdXRWYWx1ZShcbiAgICBjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQsIGxWaWV3OiBMVmlldywgdE5vZGU6IFROb2RlLCBiaW5kaW5nSW5kZXg6IG51bWJlciwgbmV3VmFsdWU6IGFueSxcbiAgICBpc0NsYXNzQmFzZWQ6IGJvb2xlYW4sIGZpcnN0VXBkYXRlUGFzczogYm9vbGVhbik6IHZvaWQge1xuICBjb25zdCBvbGRWYWx1ZSA9IGdldFZhbHVlKGxWaWV3LCBiaW5kaW5nSW5kZXgpO1xuICBpZiAoaGFzVmFsdWVDaGFuZ2VkKG9sZFZhbHVlLCBuZXdWYWx1ZSkpIHtcbiAgICAvLyBldmVuIGlmIHRoZSB2YWx1ZSBoYXMgY2hhbmdlZCB3ZSBtYXkgbm90IHdhbnQgdG8gZW1pdCBpdCB0byB0aGVcbiAgICAvLyBkaXJlY3RpdmUgaW5wdXQocykgaW4gdGhlIGV2ZW50IHRoYXQgaXQgaXMgZmFsc3kgZHVyaW5nIHRoZVxuICAgIC8vIGZpcnN0IHVwZGF0ZSBwYXNzLlxuICAgIGlmIChpc1N0eWxpbmdWYWx1ZURlZmluZWQobmV3VmFsdWUpIHx8ICFmaXJzdFVwZGF0ZVBhc3MpIHtcbiAgICAgIGNvbnN0IGlucHV0TmFtZTogc3RyaW5nID0gaXNDbGFzc0Jhc2VkID8gc2VsZWN0Q2xhc3NCYXNlZElucHV0TmFtZSh0Tm9kZS5pbnB1dHMgISkgOiAnc3R5bGUnO1xuICAgICAgY29uc3QgaW5wdXRzID0gdE5vZGUuaW5wdXRzICFbaW5wdXROYW1lXSAhO1xuICAgICAgY29uc3QgaW5pdGlhbFZhbHVlID0gZ2V0SW5pdGlhbFN0eWxpbmdWYWx1ZShjb250ZXh0KTtcbiAgICAgIGNvbnN0IHZhbHVlID0gbm9ybWFsaXplU3R5bGluZ0RpcmVjdGl2ZUlucHV0VmFsdWUoaW5pdGlhbFZhbHVlLCBuZXdWYWx1ZSwgaXNDbGFzc0Jhc2VkKTtcbiAgICAgIHNldElucHV0c0ZvclByb3BlcnR5KGxWaWV3LCBpbnB1dHMsIGlucHV0TmFtZSwgdmFsdWUpO1xuICAgICAgc2V0RWxlbWVudEV4aXRGbihzdHlsaW5nQXBwbHkpO1xuICAgIH1cbiAgICBzZXRWYWx1ZShsVmlldywgYmluZGluZ0luZGV4LCBuZXdWYWx1ZSk7XG4gIH1cbn1cblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBhcHByb3ByaWF0ZSBkaXJlY3RpdmUgaW5wdXQgdmFsdWUgZm9yIGBzdHlsZWAgb3IgYGNsYXNzYC5cbiAqXG4gKiBFYXJsaWVyIHZlcnNpb25zIG9mIEFuZ3VsYXIgZXhwZWN0IGEgYmluZGluZyB2YWx1ZSB0byBiZSBwYXNzZWQgaW50byBkaXJlY3RpdmUgY29kZVxuICogZXhhY3RseSBhcyBpdCBpcyB1bmxlc3MgdGhlcmUgaXMgYSBzdGF0aWMgdmFsdWUgcHJlc2VudCAoaW4gd2hpY2ggY2FzZSBib3RoIHZhbHVlc1xuICogd2lsbCBiZSBzdHJpbmdpZmllZCBhbmQgY29uY2F0ZW5hdGVkKS5cbiAqL1xuZnVuY3Rpb24gbm9ybWFsaXplU3R5bGluZ0RpcmVjdGl2ZUlucHV0VmFsdWUoXG4gICAgaW5pdGlhbFZhbHVlOiBzdHJpbmcsIGJpbmRpbmdWYWx1ZTogc3RyaW5nIHwge1trZXk6IHN0cmluZ106IGFueX0gfCBudWxsLFxuICAgIGlzQ2xhc3NCYXNlZDogYm9vbGVhbikge1xuICBsZXQgdmFsdWUgPSBiaW5kaW5nVmFsdWU7XG5cbiAgLy8gd2Ugb25seSBjb25jYXQgdmFsdWVzIGlmIHRoZXJlIGlzIGFuIGluaXRpYWwgdmFsdWUsIG90aGVyd2lzZSB3ZSByZXR1cm4gdGhlIHZhbHVlIGFzIGlzLlxuICAvLyBOb3RlIHRoYXQgdGhpcyBpcyB0byBzYXRpc2Z5IGJhY2t3YXJkcy1jb21wYXRpYmlsaXR5IGluIEFuZ3VsYXIuXG4gIGlmIChpbml0aWFsVmFsdWUubGVuZ3RoKSB7XG4gICAgaWYgKGlzQ2xhc3NCYXNlZCkge1xuICAgICAgdmFsdWUgPSBjb25jYXRTdHJpbmcoaW5pdGlhbFZhbHVlLCBmb3JjZUNsYXNzZXNBc1N0cmluZyhiaW5kaW5nVmFsdWUpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdmFsdWUgPSBjb25jYXRTdHJpbmcoaW5pdGlhbFZhbHVlLCBmb3JjZVN0eWxlc0FzU3RyaW5nKGJpbmRpbmdWYWx1ZSwgdHJ1ZSksICc7Jyk7XG4gICAgfVxuICB9XG4gIHJldHVybiB2YWx1ZTtcbn1cblxuLyoqXG4gKiBGbHVzaGVzIGFsbCBzdHlsaW5nIGNvZGUgdG8gdGhlIGVsZW1lbnQuXG4gKlxuICogVGhpcyBmdW5jdGlvbiBpcyBkZXNpZ25lZCB0byBiZSBzY2hlZHVsZWQgZnJvbSBhbnkgb2YgdGhlIGZvdXIgc3R5bGluZyBpbnN0cnVjdGlvbnNcbiAqIGluIHRoaXMgZmlsZS4gV2hlbiBjYWxsZWQgaXQgd2lsbCBmbHVzaCBhbGwgc3R5bGUgYW5kIGNsYXNzIGJpbmRpbmdzIHRvIHRoZSBlbGVtZW50XG4gKiB2aWEgdGhlIGNvbnRleHQgcmVzb2x1dGlvbiBhbGdvcml0aG0uXG4gKi9cbmZ1bmN0aW9uIHN0eWxpbmdBcHBseSgpOiB2b2lkIHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCB0VmlldyA9IGxWaWV3W1RWSUVXXTtcbiAgY29uc3QgZWxlbWVudEluZGV4ID0gZ2V0U2VsZWN0ZWRJbmRleCgpO1xuICBjb25zdCB0Tm9kZSA9IGdldFROb2RlKGVsZW1lbnRJbmRleCwgbFZpZXcpO1xuICBjb25zdCBuYXRpdmUgPSBnZXROYXRpdmVCeVROb2RlKHROb2RlLCBsVmlldykgYXMgUkVsZW1lbnQ7XG4gIGNvbnN0IGRpcmVjdGl2ZUluZGV4ID0gZ2V0QWN0aXZlRGlyZWN0aXZlSWQoKTtcbiAgY29uc3QgcmVuZGVyZXIgPSBnZXRSZW5kZXJlcih0Tm9kZSwgbFZpZXcpO1xuICBjb25zdCBzYW5pdGl6ZXIgPSBnZXRDdXJyZW50U3R5bGVTYW5pdGl6ZXIoKTtcbiAgY29uc3QgY2xhc3Nlc0NvbnRleHQgPSBpc1N0eWxpbmdDb250ZXh0KHROb2RlLmNsYXNzZXMpID8gdE5vZGUuY2xhc3NlcyBhcyBUU3R5bGluZ0NvbnRleHQgOiBudWxsO1xuICBjb25zdCBzdHlsZXNDb250ZXh0ID0gaXNTdHlsaW5nQ29udGV4dCh0Tm9kZS5zdHlsZXMpID8gdE5vZGUuc3R5bGVzIGFzIFRTdHlsaW5nQ29udGV4dCA6IG51bGw7XG4gIGZsdXNoU3R5bGluZyhcbiAgICAgIHJlbmRlcmVyLCBsVmlldywgdE5vZGUsIGNsYXNzZXNDb250ZXh0LCBzdHlsZXNDb250ZXh0LCBuYXRpdmUsIGRpcmVjdGl2ZUluZGV4LCBzYW5pdGl6ZXIsXG4gICAgICB0Vmlldy5maXJzdFVwZGF0ZVBhc3MpO1xuICByZXNldEN1cnJlbnRTdHlsZVNhbml0aXplcigpO1xufVxuXG5mdW5jdGlvbiBnZXRSZW5kZXJlcih0Tm9kZTogVE5vZGUsIGxWaWV3OiBMVmlldykge1xuICByZXR1cm4gdE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkVsZW1lbnQgPyBsVmlld1tSRU5ERVJFUl0gOiBudWxsO1xufVxuXG4vKipcbiAqIFNlYXJjaGVzIGFuZCBhc3NpZ25zIHByb3ZpZGVkIGFsbCBzdGF0aWMgc3R5bGUvY2xhc3MgZW50cmllcyAoZm91bmQgaW4gdGhlIGBhdHRyc2AgdmFsdWUpXG4gKiBhbmQgcmVnaXN0ZXJzIHRoZW0gaW4gdGhlaXIgcmVzcGVjdGl2ZSBzdHlsaW5nIGNvbnRleHRzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVnaXN0ZXJJbml0aWFsU3R5bGluZ09uVE5vZGUoXG4gICAgdE5vZGU6IFROb2RlLCBhdHRyczogVEF0dHJpYnV0ZXMsIHN0YXJ0SW5kZXg6IG51bWJlcik6IGJvb2xlYW4ge1xuICBsZXQgaGFzQWRkaXRpb25hbEluaXRpYWxTdHlsaW5nID0gZmFsc2U7XG4gIGxldCBzdHlsZXMgPSBnZXRTdHlsaW5nTWFwQXJyYXkodE5vZGUuc3R5bGVzKTtcbiAgbGV0IGNsYXNzZXMgPSBnZXRTdHlsaW5nTWFwQXJyYXkodE5vZGUuY2xhc3Nlcyk7XG4gIGxldCBtb2RlID0gLTE7XG4gIGZvciAobGV0IGkgPSBzdGFydEluZGV4OyBpIDwgYXR0cnMubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCBhdHRyID0gYXR0cnNbaV0gYXMgc3RyaW5nO1xuICAgIGlmICh0eXBlb2YgYXR0ciA9PSAnbnVtYmVyJykge1xuICAgICAgbW9kZSA9IGF0dHI7XG4gICAgfSBlbHNlIGlmIChtb2RlID09IEF0dHJpYnV0ZU1hcmtlci5DbGFzc2VzKSB7XG4gICAgICBjbGFzc2VzID0gY2xhc3NlcyB8fCBhbGxvY1N0eWxpbmdNYXBBcnJheShudWxsKTtcbiAgICAgIGFkZEl0ZW1Ub1N0eWxpbmdNYXAoY2xhc3NlcywgYXR0ciwgdHJ1ZSk7XG4gICAgICBoYXNBZGRpdGlvbmFsSW5pdGlhbFN0eWxpbmcgPSB0cnVlO1xuICAgIH0gZWxzZSBpZiAobW9kZSA9PSBBdHRyaWJ1dGVNYXJrZXIuU3R5bGVzKSB7XG4gICAgICBjb25zdCB2YWx1ZSA9IGF0dHJzWysraV0gYXMgc3RyaW5nIHwgbnVsbDtcbiAgICAgIHN0eWxlcyA9IHN0eWxlcyB8fCBhbGxvY1N0eWxpbmdNYXBBcnJheShudWxsKTtcbiAgICAgIGFkZEl0ZW1Ub1N0eWxpbmdNYXAoc3R5bGVzLCBhdHRyLCB2YWx1ZSk7XG4gICAgICBoYXNBZGRpdGlvbmFsSW5pdGlhbFN0eWxpbmcgPSB0cnVlO1xuICAgIH1cbiAgfVxuXG4gIGlmIChjbGFzc2VzICYmIGNsYXNzZXMubGVuZ3RoID4gU3R5bGluZ01hcEFycmF5SW5kZXguVmFsdWVzU3RhcnRQb3NpdGlvbikge1xuICAgIGlmICghdE5vZGUuY2xhc3Nlcykge1xuICAgICAgdE5vZGUuY2xhc3NlcyA9IGNsYXNzZXM7XG4gICAgfVxuICAgIHVwZGF0ZVJhd1ZhbHVlT25Db250ZXh0KHROb2RlLmNsYXNzZXMsIHN0eWxpbmdNYXBUb1N0cmluZyhjbGFzc2VzLCB0cnVlKSk7XG4gIH1cblxuICBpZiAoc3R5bGVzICYmIHN0eWxlcy5sZW5ndGggPiBTdHlsaW5nTWFwQXJyYXlJbmRleC5WYWx1ZXNTdGFydFBvc2l0aW9uKSB7XG4gICAgaWYgKCF0Tm9kZS5zdHlsZXMpIHtcbiAgICAgIHROb2RlLnN0eWxlcyA9IHN0eWxlcztcbiAgICB9XG4gICAgdXBkYXRlUmF3VmFsdWVPbkNvbnRleHQodE5vZGUuc3R5bGVzLCBzdHlsaW5nTWFwVG9TdHJpbmcoc3R5bGVzLCBmYWxzZSkpO1xuICB9XG5cbiAgaWYgKGhhc0FkZGl0aW9uYWxJbml0aWFsU3R5bGluZykge1xuICAgIHROb2RlLmZsYWdzIHw9IFROb2RlRmxhZ3MuaGFzSW5pdGlhbFN0eWxpbmc7XG4gIH1cblxuICByZXR1cm4gaGFzQWRkaXRpb25hbEluaXRpYWxTdHlsaW5nO1xufVxuXG5mdW5jdGlvbiB1cGRhdGVSYXdWYWx1ZU9uQ29udGV4dChjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQgfCBTdHlsaW5nTWFwQXJyYXksIHZhbHVlOiBzdHJpbmcpIHtcbiAgY29uc3Qgc3R5bGluZ01hcEFyciA9IGdldFN0eWxpbmdNYXBBcnJheShjb250ZXh0KSAhO1xuICBzdHlsaW5nTWFwQXJyW1N0eWxpbmdNYXBBcnJheUluZGV4LlJhd1ZhbHVlUG9zaXRpb25dID0gdmFsdWU7XG59XG5cbmZ1bmN0aW9uIGdldFN0eWxlc0NvbnRleHQodE5vZGU6IFROb2RlKTogVFN0eWxpbmdDb250ZXh0IHtcbiAgcmV0dXJuIGdldENvbnRleHQodE5vZGUsIGZhbHNlKTtcbn1cblxuZnVuY3Rpb24gZ2V0Q2xhc3Nlc0NvbnRleHQodE5vZGU6IFROb2RlKTogVFN0eWxpbmdDb250ZXh0IHtcbiAgcmV0dXJuIGdldENvbnRleHQodE5vZGUsIHRydWUpO1xufVxuXG4vKipcbiAqIFJldHVybnMvaW5zdGFudGlhdGVzIGEgc3R5bGluZyBjb250ZXh0IGZyb20vdG8gYSBgdE5vZGVgIGluc3RhbmNlLlxuICovXG5mdW5jdGlvbiBnZXRDb250ZXh0KHROb2RlOiBUTm9kZSwgaXNDbGFzc0Jhc2VkOiBib29sZWFuKTogVFN0eWxpbmdDb250ZXh0IHtcbiAgbGV0IGNvbnRleHQgPSBpc0NsYXNzQmFzZWQgPyB0Tm9kZS5jbGFzc2VzIDogdE5vZGUuc3R5bGVzO1xuICBpZiAoIWlzU3R5bGluZ0NvbnRleHQoY29udGV4dCkpIHtcbiAgICBjb25zdCBoYXNEaXJlY3RpdmVzID0gaXNEaXJlY3RpdmVIb3N0KHROb2RlKTtcbiAgICBjb250ZXh0ID0gYWxsb2NUU3R5bGluZ0NvbnRleHQoY29udGV4dCBhcyBTdHlsaW5nTWFwQXJyYXkgfCBudWxsLCBoYXNEaXJlY3RpdmVzKTtcbiAgICBpZiAobmdEZXZNb2RlKSB7XG4gICAgICBhdHRhY2hTdHlsaW5nRGVidWdPYmplY3QoY29udGV4dCBhcyBUU3R5bGluZ0NvbnRleHQsIHROb2RlLCBpc0NsYXNzQmFzZWQpO1xuICAgIH1cblxuICAgIGlmIChpc0NsYXNzQmFzZWQpIHtcbiAgICAgIHROb2RlLmNsYXNzZXMgPSBjb250ZXh0O1xuICAgIH0gZWxzZSB7XG4gICAgICB0Tm9kZS5zdHlsZXMgPSBjb250ZXh0O1xuICAgIH1cbiAgfVxuICByZXR1cm4gY29udGV4dCBhcyBUU3R5bGluZ0NvbnRleHQ7XG59XG5cbmZ1bmN0aW9uIHJlc29sdmVTdHlsZVByb3BWYWx1ZShcbiAgICB2YWx1ZTogc3RyaW5nIHwgbnVtYmVyIHwgU2FmZVZhbHVlIHwgbnVsbCB8IE5PX0NIQU5HRSxcbiAgICBzdWZmaXg6IHN0cmluZyB8IG51bGwgfCB1bmRlZmluZWQpOiBzdHJpbmd8U2FmZVZhbHVlfG51bGx8dW5kZWZpbmVkfE5PX0NIQU5HRSB7XG4gIGlmICh2YWx1ZSA9PT0gTk9fQ0hBTkdFKSByZXR1cm4gdmFsdWU7XG5cbiAgbGV0IHJlc29sdmVkVmFsdWU6IHN0cmluZ3xudWxsID0gbnVsbDtcbiAgaWYgKGlzU3R5bGluZ1ZhbHVlRGVmaW5lZCh2YWx1ZSkpIHtcbiAgICBpZiAoc3VmZml4KSB7XG4gICAgICAvLyB3aGVuIGEgc3VmZml4IGlzIGFwcGxpZWQgdGhlbiBpdCB3aWxsIGJ5cGFzc1xuICAgICAgLy8gc2FuaXRpemF0aW9uIGVudGlyZWx5IChiL2MgYSBuZXcgc3RyaW5nIGlzIGNyZWF0ZWQpXG4gICAgICByZXNvbHZlZFZhbHVlID0gcmVuZGVyU3RyaW5naWZ5KHZhbHVlKSArIHN1ZmZpeDtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gc2FuaXRpemF0aW9uIGhhcHBlbnMgYnkgZGVhbGluZyB3aXRoIGEgc3RyaW5nIHZhbHVlXG4gICAgICAvLyB0aGlzIG1lYW5zIHRoYXQgdGhlIHN0cmluZyB2YWx1ZSB3aWxsIGJlIHBhc3NlZCB0aHJvdWdoXG4gICAgICAvLyBpbnRvIHRoZSBzdHlsZSByZW5kZXJpbmcgbGF0ZXIgKHdoaWNoIGlzIHdoZXJlIHRoZSB2YWx1ZVxuICAgICAgLy8gd2lsbCBiZSBzYW5pdGl6ZWQgYmVmb3JlIGl0IGlzIGFwcGxpZWQpXG4gICAgICByZXNvbHZlZFZhbHVlID0gdmFsdWUgYXMgYW55IGFzIHN0cmluZztcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHJlc29sdmVkVmFsdWU7XG59XG5cbi8qKlxuICogV2hldGhlciBvciBub3QgdGhlIHN0eWxlL2NsYXNzIGJpbmRpbmcgYmVpbmcgYXBwbGllZCB3YXMgZXhlY3V0ZWQgd2l0aGluIGEgaG9zdCBiaW5kaW5nc1xuICogZnVuY3Rpb24uXG4gKi9cbmZ1bmN0aW9uIGlzSG9zdFN0eWxpbmcoKTogYm9vbGVhbiB7XG4gIHJldHVybiBpc0hvc3RTdHlsaW5nQWN0aXZlKGdldEFjdGl2ZURpcmVjdGl2ZUlkKCkpO1xufVxuXG5mdW5jdGlvbiBwYXRjaEhvc3RTdHlsaW5nRmxhZyh0Tm9kZTogVE5vZGUsIGhvc3RCaW5kaW5nc01vZGU6IGJvb2xlYW4sIGlzQ2xhc3NCYXNlZDogYm9vbGVhbikge1xuICBjb25zdCBmbGFnID0gaG9zdEJpbmRpbmdzTW9kZSA/XG4gICAgICBpc0NsYXNzQmFzZWQgPyBUTm9kZUZsYWdzLmhhc0hvc3RDbGFzc0JpbmRpbmdzIDogVE5vZGVGbGFncy5oYXNIb3N0U3R5bGVCaW5kaW5ncyA6XG4gICAgICBpc0NsYXNzQmFzZWQgPyBUTm9kZUZsYWdzLmhhc1RlbXBsYXRlQ2xhc3NCaW5kaW5ncyA6IFROb2RlRmxhZ3MuaGFzVGVtcGxhdGVTdHlsZUJpbmRpbmdzO1xuICBwYXRjaENvbmZpZyh0Tm9kZSwgZmxhZyk7XG59XG4iXX0=