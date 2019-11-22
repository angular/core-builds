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
 * @param sanitizerFn The sanitization function that will be used to
 *       process style prop/value entries.
 *
 * @codeGenApi
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
 * @param prop A valid CSS property.
 * @param value New value to write (`null` or an empty string to remove).
 * @param suffix Optional suffix. Used with scalar values to add unit such as `px`.
 *        Note that when a suffix is provided then the underlying sanitizer will
 *        be ignored.
 *
 * Note that this will apply the provided style value to the host element if this function is called
 * within a host binding function.
 *
 * @codeGenApi
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
 */
export function stylePropInternal(elementIndex, prop, value, suffix) {
    // if a value is interpolated then it may render a `NO_CHANGE` value.
    // in this case we do not need to do anything, but the binding index
    // still needs to be incremented because all styling binding values
    // are stored inside of the lView.
    var bindingIndex = nextBindingIndex();
    var lView = getLView();
    var tNode = getTNode(elementIndex, lView);
    var firstUpdatePass = lView[TVIEW].firstUpdatePass;
    // we check for this in the instruction code so that the context can be notified
    // about prop or map bindings so that the direct apply check can decide earlier
    // if it allows for context resolution to be bypassed.
    if (firstUpdatePass) {
        patchConfig(tNode, 32768 /* hasStylePropBindings */);
        patchHostStylingFlag(tNode, isHostStyling(), false);
    }
    var updated = stylingProp(tNode, firstUpdatePass, lView, bindingIndex, prop, resolveStylePropValue(value, suffix), false);
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
 * @param prop A valid CSS class (only one).
 * @param value A true/false value which will turn the class on or off.
 *
 * Note that this will apply the provided class value to the host element if this function
 * is called within a host binding function.
 *
 * @codeGenApi
 */
export function ɵɵclassProp(className, value) {
    // if a value is interpolated then it may render a `NO_CHANGE` value.
    // in this case we do not need to do anything, but the binding index
    // still needs to be incremented because all styling binding values
    // are stored inside of the lView.
    var bindingIndex = nextBindingIndex();
    var lView = getLView();
    var elementIndex = getSelectedIndex();
    var tNode = getTNode(elementIndex, lView);
    var firstUpdatePass = lView[TVIEW].firstUpdatePass;
    // we check for this in the instruction code so that the context can be notified
    // about prop or map bindings so that the direct apply check can decide earlier
    // if it allows for context resolution to be bypassed.
    if (firstUpdatePass) {
        patchConfig(tNode, 1024 /* hasClassPropBindings */);
        patchHostStylingFlag(tNode, isHostStyling(), true);
    }
    var updated = stylingProp(tNode, firstUpdatePass, lView, bindingIndex, className, value, true);
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
 */
function stylingProp(tNode, firstUpdatePass, lView, bindingIndex, prop, value, isClassBased) {
    var updated = false;
    var native = getNativeByTNode(tNode, lView);
    var context = isClassBased ? getClassesContext(tNode) : getStylesContext(tNode);
    var sanitizer = isClassBased ? null : getCurrentStyleSanitizer();
    // [style.prop] and [class.name] bindings do not use `bind()` and will
    // therefore manage accessing and updating the new value in the lView directly.
    // For this reason, the checkNoChanges situation must also be handled here
    // as well.
    if (ngDevMode && getCheckNoChangesMode()) {
        var oldValue = getValue(lView, bindingIndex);
        if (hasValueChangedUnwrapSafeValue(oldValue, value)) {
            throwErrorIfNoChangesMode(false, oldValue, value);
        }
    }
    // Direct Apply Case: bypass context resolution and apply the
    // style/class value directly to the element
    if (allowDirectStyling(tNode, isClassBased, firstUpdatePass)) {
        var sanitizerToUse = isClassBased ? null : sanitizer;
        var renderer = getRenderer(tNode, lView);
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
        var directiveIndex = getActiveDirectiveId();
        if (isClassBased) {
            updated = updateClassViaContext(context, tNode, lView, native, directiveIndex, prop, bindingIndex, value, false, firstUpdatePass);
        }
        else {
            updated = updateStyleViaContext(context, tNode, lView, native, directiveIndex, prop, bindingIndex, value, sanitizer, false, firstUpdatePass);
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
 * @param styles A key/value style map of the styles that will be applied to the given element.
 *        Any missing styles (that have already been applied to the element beforehand) will be
 *        removed (unset) from the element's styling.
 *
 * Note that this will apply the provided styleMap value to the host element if this function
 * is called within a host binding.
 *
 * @codeGenApi
 */
export function ɵɵstyleMap(styles) {
    var index = getSelectedIndex();
    var lView = getLView();
    var tNode = getTNode(index, lView);
    var firstUpdatePass = lView[TVIEW].firstUpdatePass;
    var context = getStylesContext(tNode);
    var hasDirectiveInput = hasStyleInput(tNode);
    // if a value is interpolated then it may render a `NO_CHANGE` value.
    // in this case we do not need to do anything, but the binding index
    // still needs to be incremented because all styling binding values
    // are stored inside of the lView.
    var bindingIndex = incrementBindingIndex(2);
    var hostBindingsMode = isHostStyling();
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
 * @param classes A key/value map or string of CSS classes that will be added to the
 *        given element. Any missing classes (that have already been applied to the element
 *        beforehand) will be removed (unset) from the element's list of CSS classes.
 *
 * @codeGenApi
 */
export function ɵɵclassMap(classes) {
    classMapInternal(getSelectedIndex(), classes);
}
/**
 * Internal function for applying a class string or key/value map of classes to an element.
 *
 * The reason why this function has been separated from `ɵɵclassMap` is because
 * it is also called from `ɵɵclassMapInterpolate`.
 */
export function classMapInternal(elementIndex, classes) {
    var lView = getLView();
    var tNode = getTNode(elementIndex, lView);
    var firstUpdatePass = lView[TVIEW].firstUpdatePass;
    var context = getClassesContext(tNode);
    var hasDirectiveInput = hasClassInput(tNode);
    // if a value is interpolated then it may render a `NO_CHANGE` value.
    // in this case we do not need to do anything, but the binding index
    // still needs to be incremented because all styling binding values
    // are stored inside of the lView.
    var bindingIndex = incrementBindingIndex(2);
    var hostBindingsMode = isHostStyling();
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
 */
function stylingMap(context, tNode, firstUpdatePass, lView, bindingIndex, value, isClassBased, hasDirectiveInput) {
    var directiveIndex = getActiveDirectiveId();
    var native = getNativeByTNode(tNode, lView);
    var oldValue = getValue(lView, bindingIndex);
    var sanitizer = getCurrentStyleSanitizer();
    var valueHasChanged = hasValueChanged(oldValue, value);
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
        var sanitizerToUse = isClassBased ? null : sanitizer;
        var renderer = getRenderer(tNode, lView);
        applyStylingMapDirectly(renderer, context, tNode, native, lView, bindingIndex, value, isClassBased, sanitizerToUse, valueHasChanged, hasDirectiveInput);
        if (sanitizerToUse) {
            // it's important we remove the current style sanitizer once the
            // element exits, otherwise it will be used by the next styling
            // instructions for the next element.
            setElementExitFn(stylingApply);
        }
    }
    else {
        var stylingMapArr = value === NO_CHANGE ? NO_CHANGE : normalizeIntoStylingMap(oldValue, value, !isClassBased);
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
 * If a directive has a `@Input` binding that is set on `style` or `class` then that value
 * will take priority over the underlying style/class styling bindings. This value will
 * be updated for the binding each time during change detection.
 *
 * When this occurs this function will attempt to write the value to the input binding
 * depending on the following situations:
 *
 * - If `oldValue !== newValue`
 * - If `newValue` is `null` (but this is skipped if it is during the first update pass)
 */
function updateDirectiveInputValue(context, lView, tNode, bindingIndex, newValue, isClassBased, firstUpdatePass) {
    var oldValue = getValue(lView, bindingIndex);
    if (hasValueChanged(oldValue, newValue)) {
        // even if the value has changed we may not want to emit it to the
        // directive input(s) in the event that it is falsy during the
        // first update pass.
        if (isStylingValueDefined(newValue) || !firstUpdatePass) {
            var inputName = isClassBased ? selectClassBasedInputName(tNode.inputs) : 'style';
            var inputs = tNode.inputs[inputName];
            var initialValue = getInitialStylingValue(context);
            var value = normalizeStylingDirectiveInputValue(initialValue, newValue, isClassBased);
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
 */
function normalizeStylingDirectiveInputValue(initialValue, bindingValue, isClassBased) {
    var value = bindingValue;
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
 */
function stylingApply() {
    var lView = getLView();
    var tView = lView[TVIEW];
    var elementIndex = getSelectedIndex();
    var tNode = getTNode(elementIndex, lView);
    var native = getNativeByTNode(tNode, lView);
    var directiveIndex = getActiveDirectiveId();
    var renderer = getRenderer(tNode, lView);
    var sanitizer = getCurrentStyleSanitizer();
    var classesContext = isStylingContext(tNode.classes) ? tNode.classes : null;
    var stylesContext = isStylingContext(tNode.styles) ? tNode.styles : null;
    flushStyling(renderer, lView, tNode, classesContext, stylesContext, native, directiveIndex, sanitizer, tView.firstUpdatePass);
    resetCurrentStyleSanitizer();
}
function getRenderer(tNode, lView) {
    return tNode.type === 3 /* Element */ ? lView[RENDERER] : null;
}
/**
 * Searches and assigns provided all static style/class entries (found in the `attrs` value)
 * and registers them in their respective styling contexts.
 */
export function registerInitialStylingOnTNode(tNode, attrs, startIndex) {
    var hasAdditionalInitialStyling = false;
    var styles = getStylingMapArray(tNode.styles);
    var classes = getStylingMapArray(tNode.classes);
    var mode = -1;
    for (var i = startIndex; i < attrs.length; i++) {
        var attr = attrs[i];
        if (typeof attr == 'number') {
            mode = attr;
        }
        else if (mode == 1 /* Classes */) {
            classes = classes || allocStylingMapArray(null);
            addItemToStylingMap(classes, attr, true);
            hasAdditionalInitialStyling = true;
        }
        else if (mode == 2 /* Styles */) {
            var value = attrs[++i];
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
function updateRawValueOnContext(context, value) {
    var stylingMapArr = getStylingMapArray(context);
    stylingMapArr[0 /* RawValuePosition */] = value;
}
function getStylesContext(tNode) {
    return getContext(tNode, false);
}
function getClassesContext(tNode) {
    return getContext(tNode, true);
}
/**
 * Returns/instantiates a styling context from/to a `tNode` instance.
 */
function getContext(tNode, isClassBased) {
    var context = isClassBased ? tNode.classes : tNode.styles;
    if (!isStylingContext(context)) {
        var hasDirectives = isDirectiveHost(tNode);
        context = allocTStylingContext(context, hasDirectives);
        if (ngDevMode) {
            attachStylingDebugObject(context, tNode, isClassBased);
        }
        if (isClassBased) {
            tNode.classes = context;
        }
        else {
            tNode.styles = context;
        }
    }
    return context;
}
function resolveStylePropValue(value, suffix) {
    if (value === NO_CHANGE)
        return value;
    var resolvedValue = null;
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
            resolvedValue = value;
        }
    }
    return resolvedValue;
}
/**
 * Whether or not the style/class binding being applied was executed within a host bindings
 * function.
 */
function isHostStyling() {
    return isHostStylingActive(getActiveDirectiveId());
}
function patchHostStylingFlag(tNode, hostBindingsMode, isClassBased) {
    var flag = hostBindingsMode ?
        isClassBased ? 4096 /* hasHostClassBindings */ : 131072 /* hasHostStyleBindings */ :
        isClassBased ? 2048 /* hasTemplateClassBindings */ : 65536 /* hasTemplateStyleBindings */;
    patchConfig(tNode, flag);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3R5bGluZy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvaW5zdHJ1Y3Rpb25zL3N0eWxpbmcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBU0EsT0FBTyxFQUFDLHlCQUF5QixFQUFDLE1BQU0sV0FBVyxDQUFDO0FBQ3BELE9BQU8sRUFBbUIsb0JBQW9CLEVBQUMsTUFBTSx3QkFBd0IsQ0FBQztBQUk5RSxPQUFPLEVBQUMsZUFBZSxFQUFDLE1BQU0sMkJBQTJCLENBQUM7QUFDMUQsT0FBTyxFQUFRLFFBQVEsRUFBRSxLQUFLLEVBQUMsTUFBTSxvQkFBb0IsQ0FBQztBQUMxRCxPQUFPLEVBQUMsb0JBQW9CLEVBQUUscUJBQXFCLEVBQUUsd0JBQXdCLEVBQUUsUUFBUSxFQUFFLGdCQUFnQixFQUFFLHFCQUFxQixFQUFFLGdCQUFnQixFQUFFLDBCQUEwQixFQUFFLHdCQUF3QixFQUFFLGdCQUFnQixFQUFDLE1BQU0sVUFBVSxDQUFDO0FBQzVPLE9BQU8sRUFBQyx1QkFBdUIsRUFBRSx5QkFBeUIsRUFBRSxZQUFZLEVBQXNCLHFCQUFxQixFQUFFLHFCQUFxQixFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFDdkssT0FBTyxFQUFDLHlCQUF5QixFQUFDLE1BQU0sK0JBQStCLENBQUM7QUFDeEUsT0FBTyxFQUFDLHdCQUF3QixFQUFDLE1BQU0sMEJBQTBCLENBQUM7QUFDbEUsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLFdBQVcsQ0FBQztBQUNwQyxPQUFPLEVBQUMsZUFBZSxFQUFDLE1BQU0sb0JBQW9CLENBQUM7QUFDbkQsT0FBTyxFQUFDLG1CQUFtQixFQUFFLG9CQUFvQixFQUFFLG9CQUFvQixFQUFFLGtCQUFrQixFQUFFLFlBQVksRUFBRSxvQkFBb0IsRUFBRSxtQkFBbUIsRUFBRSxzQkFBc0IsRUFBRSxrQkFBa0IsRUFBRSxRQUFRLEVBQUUs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YSxHQUFHLGVBQWUsQ0FBQyxLQUFLLENBQUMsR0FBRyxNQUFNLENBQUM7U0FDakQ7YUFBTTtZQUNMLHNEQUFzRDtZQUN0RCwwREFBMEQ7WUFDMUQsMkRBQTJEO1lBQzNELDBDQUEwQztZQUMxQyxhQUFhLEdBQUcsS0FBc0IsQ0FBQztTQUN4QztLQUNGO0lBQ0QsT0FBTyxhQUFhLENBQUM7QUFDdkIsQ0FBQztBQUVEOzs7R0FHRztBQUNILFNBQVMsYUFBYTtJQUNwQixPQUFPLG1CQUFtQixDQUFDLG9CQUFvQixFQUFFLENBQUMsQ0FBQztBQUNyRCxDQUFDO0FBRUQsU0FBUyxvQkFBb0IsQ0FBQyxLQUFZLEVBQUUsZ0JBQXlCLEVBQUUsWUFBcUI7SUFDMUYsSUFBTSxJQUFJLEdBQUcsZ0JBQWdCLENBQUMsQ0FBQztRQUMzQixZQUFZLENBQUMsQ0FBQyxpQ0FBaUMsQ0FBQyxrQ0FBZ0MsQ0FBQyxDQUFDO1FBQ2xGLFlBQVksQ0FBQyxDQUFDLHFDQUFxQyxDQUFDLHFDQUFvQyxDQUFDO0lBQzdGLFdBQVcsQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLENBQUM7QUFDM0IsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuKiBAbGljZW5zZVxuKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbipcbiogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuKi9cbmltcG9ydCB7U2FmZVZhbHVlfSBmcm9tICcuLi8uLi9zYW5pdGl6YXRpb24vYnlwYXNzJztcbmltcG9ydCB7U3R5bGVTYW5pdGl6ZUZufSBmcm9tICcuLi8uLi9zYW5pdGl6YXRpb24vc3R5bGVfc2FuaXRpemVyJztcbmltcG9ydCB7dGhyb3dFcnJvcklmTm9DaGFuZ2VzTW9kZX0gZnJvbSAnLi4vZXJyb3JzJztcbmltcG9ydCB7VHNpY2tsZUlzc3VlMTAwOSwgc2V0SW5wdXRzRm9yUHJvcGVydHl9IGZyb20gJy4uL2luc3RydWN0aW9ucy9zaGFyZWQnO1xuaW1wb3J0IHtBdHRyaWJ1dGVNYXJrZXIsIFRBdHRyaWJ1dGVzLCBUTm9kZSwgVE5vZGVGbGFncywgVE5vZGVUeXBlfSBmcm9tICcuLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtSRWxlbWVudH0gZnJvbSAnLi4vaW50ZXJmYWNlcy9yZW5kZXJlcic7XG5pbXBvcnQge1N0eWxpbmdNYXBBcnJheSwgU3R5bGluZ01hcEFycmF5SW5kZXgsIFRTdHlsaW5nQ29udGV4dH0gZnJvbSAnLi4vaW50ZXJmYWNlcy9zdHlsaW5nJztcbmltcG9ydCB7aXNEaXJlY3RpdmVIb3N0fSBmcm9tICcuLi9pbnRlcmZhY2VzL3R5cGVfY2hlY2tzJztcbmltcG9ydCB7TFZpZXcsIFJFTkRFUkVSLCBUVklFV30gZnJvbSAnLi4vaW50ZXJmYWNlcy92aWV3JztcbmltcG9ydCB7Z2V0QWN0aXZlRGlyZWN0aXZlSWQsIGdldENoZWNrTm9DaGFuZ2VzTW9kZSwgZ2V0Q3VycmVudFN0eWxlU2FuaXRpemVyLCBnZXRMVmlldywgZ2V0U2VsZWN0ZWRJbmRleCwgaW5jcmVtZW50QmluZGluZ0luZGV4LCBuZXh0QmluZGluZ0luZGV4LCByZXNldEN1cnJlbnRTdHlsZVNhbml0aXplciwgc2V0Q3VycmVudFN0eWxlU2FuaXRpemVyLCBzZXRFbGVtZW50RXhpdEZufSBmcm9tICcuLi9zdGF0ZSc7XG5pbXBvcnQge2FwcGx5U3R5bGluZ01hcERpcmVjdGx5LCBhcHBseVN0eWxpbmdWYWx1ZURpcmVjdGx5LCBmbHVzaFN0eWxpbmcsIHNldENsYXNzLCBzZXRTdHlsZSwgdXBkYXRlQ2xhc3NWaWFDb250ZXh0LCB1cGRhdGVTdHlsZVZpYUNvbnRleHR9IGZyb20gJy4uL3N0eWxpbmcvYmluZGluZ3MnO1xuaW1wb3J0IHthY3RpdmF0ZVN0eWxpbmdNYXBGZWF0dXJlfSBmcm9tICcuLi9zdHlsaW5nL21hcF9iYXNlZF9iaW5kaW5ncyc7XG5pbXBvcnQge2F0dGFjaFN0eWxpbmdEZWJ1Z09iamVjdH0gZnJvbSAnLi4vc3R5bGluZy9zdHlsaW5nX2RlYnVnJztcbmltcG9ydCB7Tk9fQ0hBTkdFfSBmcm9tICcuLi90b2tlbnMnO1xuaW1wb3J0IHtyZW5kZXJTdHJpbmdpZnl9IGZyb20gJy4uL3V0aWwvbWlzY191dGlscyc7XG5pbXBvcnQge2FkZEl0ZW1Ub1N0eWxpbmdNYXAsIGFsbG9jU3R5bGluZ01hcEFycmF5LCBhbGxvY1RTdHlsaW5nQ29udGV4dCwgYWxsb3dEaXJlY3RTdHlsaW5nLCBjb25jYXRTdHJpbmcsIGZvcmNlQ2xhc3Nlc0FzU3RyaW5nLCBmb3JjZVN0eWxlc0FzU3RyaW5nLCBnZXRJbml0aWFsU3R5bGluZ1ZhbHVlLCBnZXRTdHlsaW5nTWFwQXJyYXksIGdldFZhbHVlLCBoYXNDbGFzc0lucHV0LCBoYXNTdHlsZUlucHV0LCBoYXNWYWx1ZUNoYW5nZWQsIGhhc1ZhbHVlQ2hhbmdlZFVud3JhcFNhZmVWYWx1ZSwgaXNIb3N0U3R5bGluZ0FjdGl2ZSwgaXNTdHlsaW5nQ29udGV4dCwgaXNTdHlsaW5nVmFsdWVEZWZpbmVkLCBub3JtYWxpemVJbnRvU3R5bGluZ01hcCwgcGF0Y2hDb25maWcsIHNlbGVjdENsYXNzQmFzZWRJbnB1dE5hbWUsIHNldFZhbHVlLCBzdHlsaW5nTWFwVG9TdHJpbmd9IGZyb20gJy4uL3V0aWwvc3R5bGluZ191dGlscyc7XG5pbXBvcnQge2dldE5hdGl2ZUJ5VE5vZGUsIGdldFROb2RlfSBmcm9tICcuLi91dGlsL3ZpZXdfdXRpbHMnO1xuXG5cblxuLyoqXG4gKiAtLS0tLS0tLVxuICpcbiAqIFRoaXMgZmlsZSBjb250YWlucyB0aGUgY29yZSBsb2dpYyBmb3IgaG93IHN0eWxpbmcgaW5zdHJ1Y3Rpb25zIGFyZSBwcm9jZXNzZWQgaW4gQW5ndWxhci5cbiAqXG4gKiBUbyBsZWFybiBtb3JlIGFib3V0IHRoZSBhbGdvcml0aG0gc2VlIGBUU3R5bGluZ0NvbnRleHRgLlxuICpcbiAqIC0tLS0tLS0tXG4gKi9cblxuLyoqXG4gKiBTZXRzIHRoZSBjdXJyZW50IHN0eWxlIHNhbml0aXplciBmdW5jdGlvbiB3aGljaCB3aWxsIHRoZW4gYmUgdXNlZFxuICogd2l0aGluIGFsbCBmb2xsb3ctdXAgcHJvcCBhbmQgbWFwLWJhc2VkIHN0eWxlIGJpbmRpbmcgaW5zdHJ1Y3Rpb25zXG4gKiBmb3IgdGhlIGdpdmVuIGVsZW1lbnQuXG4gKlxuICogTm90ZSB0aGF0IG9uY2Ugc3R5bGluZyBoYXMgYmVlbiBhcHBsaWVkIHRvIHRoZSBlbGVtZW50IChpLmUuIG9uY2VcbiAqIGBhZHZhbmNlKG4pYCBpcyBleGVjdXRlZCBvciB0aGUgaG9zdEJpbmRpbmdzL3RlbXBsYXRlIGZ1bmN0aW9uIGV4aXRzKVxuICogdGhlbiB0aGUgYWN0aXZlIGBzYW5pdGl6ZXJGbmAgd2lsbCBiZSBzZXQgdG8gYG51bGxgLiBUaGlzIG1lYW5zIHRoYXRcbiAqIG9uY2Ugc3R5bGluZyBpcyBhcHBsaWVkIHRvIGFub3RoZXIgZWxlbWVudCB0aGVuIGEgYW5vdGhlciBjYWxsIHRvXG4gKiBgc3R5bGVTYW5pdGl6ZXJgIHdpbGwgbmVlZCB0byBiZSBtYWRlLlxuICpcbiAqIEBwYXJhbSBzYW5pdGl6ZXJGbiBUaGUgc2FuaXRpemF0aW9uIGZ1bmN0aW9uIHRoYXQgd2lsbCBiZSB1c2VkIHRvXG4gKiAgICAgICBwcm9jZXNzIHN0eWxlIHByb3AvdmFsdWUgZW50cmllcy5cbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtXN0eWxlU2FuaXRpemVyKHNhbml0aXplcjogU3R5bGVTYW5pdGl6ZUZuIHwgbnVsbCk6IHZvaWQge1xuICBzZXRDdXJyZW50U3R5bGVTYW5pdGl6ZXIoc2FuaXRpemVyKTtcbn1cblxuLyoqXG4gKiBVcGRhdGUgYSBzdHlsZSBiaW5kaW5nIG9uIGFuIGVsZW1lbnQgd2l0aCB0aGUgcHJvdmlkZWQgdmFsdWUuXG4gKlxuICogSWYgdGhlIHN0eWxlIHZhbHVlIGlzIGZhbHN5IHRoZW4gaXQgd2lsbCBiZSByZW1vdmVkIGZyb20gdGhlIGVsZW1lbnRcbiAqIChvciBhc3NpZ25lZCBhIGRpZmZlcmVudCB2YWx1ZSBkZXBlbmRpbmcgaWYgdGhlcmUgYXJlIGFueSBzdHlsZXMgcGxhY2VkXG4gKiBvbiB0aGUgZWxlbWVudCB3aXRoIGBzdHlsZU1hcGAgb3IgYW55IHN0YXRpYyBzdHlsZXMgdGhhdCBhcmVcbiAqIHByZXNlbnQgZnJvbSB3aGVuIHRoZSBlbGVtZW50IHdhcyBjcmVhdGVkIHdpdGggYHN0eWxpbmdgKS5cbiAqXG4gKiBOb3RlIHRoYXQgdGhlIHN0eWxpbmcgZWxlbWVudCBpcyB1cGRhdGVkIGFzIHBhcnQgb2YgYHN0eWxpbmdBcHBseWAuXG4gKlxuICogQHBhcmFtIHByb3AgQSB2YWxpZCBDU1MgcHJvcGVydHkuXG4gKiBAcGFyYW0gdmFsdWUgTmV3IHZhbHVlIHRvIHdyaXRlIChgbnVsbGAgb3IgYW4gZW1wdHkgc3RyaW5nIHRvIHJlbW92ZSkuXG4gKiBAcGFyYW0gc3VmZml4IE9wdGlvbmFsIHN1ZmZpeC4gVXNlZCB3aXRoIHNjYWxhciB2YWx1ZXMgdG8gYWRkIHVuaXQgc3VjaCBhcyBgcHhgLlxuICogICAgICAgIE5vdGUgdGhhdCB3aGVuIGEgc3VmZml4IGlzIHByb3ZpZGVkIHRoZW4gdGhlIHVuZGVybHlpbmcgc2FuaXRpemVyIHdpbGxcbiAqICAgICAgICBiZSBpZ25vcmVkLlxuICpcbiAqIE5vdGUgdGhhdCB0aGlzIHdpbGwgYXBwbHkgdGhlIHByb3ZpZGVkIHN0eWxlIHZhbHVlIHRvIHRoZSBob3N0IGVsZW1lbnQgaWYgdGhpcyBmdW5jdGlvbiBpcyBjYWxsZWRcbiAqIHdpdGhpbiBhIGhvc3QgYmluZGluZyBmdW5jdGlvbi5cbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtXN0eWxlUHJvcChcbiAgICBwcm9wOiBzdHJpbmcsIHZhbHVlOiBzdHJpbmcgfCBudW1iZXIgfCBTYWZlVmFsdWUgfCBudWxsLFxuICAgIHN1ZmZpeD86IHN0cmluZyB8IG51bGwpOiBUc2lja2xlSXNzdWUxMDA5IHtcbiAgc3R5bGVQcm9wSW50ZXJuYWwoZ2V0U2VsZWN0ZWRJbmRleCgpLCBwcm9wLCB2YWx1ZSwgc3VmZml4KTtcbiAgcmV0dXJuIMm1ybVzdHlsZVByb3A7XG59XG5cbi8qKlxuICogSW50ZXJuYWwgZnVuY3Rpb24gZm9yIGFwcGx5aW5nIGEgc2luZ2xlIHN0eWxlIHRvIGFuIGVsZW1lbnQuXG4gKlxuICogVGhlIHJlYXNvbiB3aHkgdGhpcyBmdW5jdGlvbiBoYXMgYmVlbiBzZXBhcmF0ZWQgZnJvbSBgybXJtXN0eWxlUHJvcGAgaXMgYmVjYXVzZVxuICogaXQgaXMgYWxzbyBjYWxsZWQgZnJvbSBgybXJtXN0eWxlUHJvcEludGVycG9sYXRlYC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHN0eWxlUHJvcEludGVybmFsKFxuICAgIGVsZW1lbnRJbmRleDogbnVtYmVyLCBwcm9wOiBzdHJpbmcsIHZhbHVlOiBzdHJpbmcgfCBudW1iZXIgfCBTYWZlVmFsdWUgfCBudWxsLFxuICAgIHN1ZmZpeD86IHN0cmluZyB8IG51bGwgfCB1bmRlZmluZWQpOiB2b2lkIHtcbiAgLy8gaWYgYSB2YWx1ZSBpcyBpbnRlcnBvbGF0ZWQgdGhlbiBpdCBtYXkgcmVuZGVyIGEgYE5PX0NIQU5HRWAgdmFsdWUuXG4gIC8vIGluIHRoaXMgY2FzZSB3ZSBkbyBub3QgbmVlZCB0byBkbyBhbnl0aGluZywgYnV0IHRoZSBiaW5kaW5nIGluZGV4XG4gIC8vIHN0aWxsIG5lZWRzIHRvIGJlIGluY3JlbWVudGVkIGJlY2F1c2UgYWxsIHN0eWxpbmcgYmluZGluZyB2YWx1ZXNcbiAgLy8gYXJlIHN0b3JlZCBpbnNpZGUgb2YgdGhlIGxWaWV3LlxuICBjb25zdCBiaW5kaW5nSW5kZXggPSBuZXh0QmluZGluZ0luZGV4KCk7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgdE5vZGUgPSBnZXRUTm9kZShlbGVtZW50SW5kZXgsIGxWaWV3KTtcbiAgY29uc3QgZmlyc3RVcGRhdGVQYXNzID0gbFZpZXdbVFZJRVddLmZpcnN0VXBkYXRlUGFzcztcblxuICAvLyB3ZSBjaGVjayBmb3IgdGhpcyBpbiB0aGUgaW5zdHJ1Y3Rpb24gY29kZSBzbyB0aGF0IHRoZSBjb250ZXh0IGNhbiBiZSBub3RpZmllZFxuICAvLyBhYm91dCBwcm9wIG9yIG1hcCBiaW5kaW5ncyBzbyB0aGF0IHRoZSBkaXJlY3QgYXBwbHkgY2hlY2sgY2FuIGRlY2lkZSBlYXJsaWVyXG4gIC8vIGlmIGl0IGFsbG93cyBmb3IgY29udGV4dCByZXNvbHV0aW9uIHRvIGJlIGJ5cGFzc2VkLlxuICBpZiAoZmlyc3RVcGRhdGVQYXNzKSB7XG4gICAgcGF0Y2hDb25maWcodE5vZGUsIFROb2RlRmxhZ3MuaGFzU3R5bGVQcm9wQmluZGluZ3MpO1xuICAgIHBhdGNoSG9zdFN0eWxpbmdGbGFnKHROb2RlLCBpc0hvc3RTdHlsaW5nKCksIGZhbHNlKTtcbiAgfVxuXG4gIGNvbnN0IHVwZGF0ZWQgPSBzdHlsaW5nUHJvcChcbiAgICAgIHROb2RlLCBmaXJzdFVwZGF0ZVBhc3MsIGxWaWV3LCBiaW5kaW5nSW5kZXgsIHByb3AsIHJlc29sdmVTdHlsZVByb3BWYWx1ZSh2YWx1ZSwgc3VmZml4KSxcbiAgICAgIGZhbHNlKTtcbiAgaWYgKG5nRGV2TW9kZSkge1xuICAgIG5nRGV2TW9kZS5zdHlsZVByb3ArKztcbiAgICBpZiAodXBkYXRlZCkge1xuICAgICAgbmdEZXZNb2RlLnN0eWxlUHJvcENhY2hlTWlzcysrO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIFVwZGF0ZSBhIGNsYXNzIGJpbmRpbmcgb24gYW4gZWxlbWVudCB3aXRoIHRoZSBwcm92aWRlZCB2YWx1ZS5cbiAqXG4gKiBUaGlzIGluc3RydWN0aW9uIGlzIG1lYW50IHRvIGhhbmRsZSB0aGUgYFtjbGFzcy5mb29dPVwiZXhwXCJgIGNhc2UgYW5kLFxuICogdGhlcmVmb3JlLCB0aGUgY2xhc3MgYmluZGluZyBpdHNlbGYgbXVzdCBhbHJlYWR5IGJlIGFsbG9jYXRlZCB1c2luZ1xuICogYHN0eWxpbmdgIHdpdGhpbiB0aGUgY3JlYXRpb24gYmxvY2suXG4gKlxuICogQHBhcmFtIHByb3AgQSB2YWxpZCBDU1MgY2xhc3MgKG9ubHkgb25lKS5cbiAqIEBwYXJhbSB2YWx1ZSBBIHRydWUvZmFsc2UgdmFsdWUgd2hpY2ggd2lsbCB0dXJuIHRoZSBjbGFzcyBvbiBvciBvZmYuXG4gKlxuICogTm90ZSB0aGF0IHRoaXMgd2lsbCBhcHBseSB0aGUgcHJvdmlkZWQgY2xhc3MgdmFsdWUgdG8gdGhlIGhvc3QgZWxlbWVudCBpZiB0aGlzIGZ1bmN0aW9uXG4gKiBpcyBjYWxsZWQgd2l0aGluIGEgaG9zdCBiaW5kaW5nIGZ1bmN0aW9uLlxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1Y2xhc3NQcm9wKGNsYXNzTmFtZTogc3RyaW5nLCB2YWx1ZTogYm9vbGVhbiB8IG51bGwpOiBUc2lja2xlSXNzdWUxMDA5IHtcbiAgLy8gaWYgYSB2YWx1ZSBpcyBpbnRlcnBvbGF0ZWQgdGhlbiBpdCBtYXkgcmVuZGVyIGEgYE5PX0NIQU5HRWAgdmFsdWUuXG4gIC8vIGluIHRoaXMgY2FzZSB3ZSBkbyBub3QgbmVlZCB0byBkbyBhbnl0aGluZywgYnV0IHRoZSBiaW5kaW5nIGluZGV4XG4gIC8vIHN0aWxsIG5lZWRzIHRvIGJlIGluY3JlbWVudGVkIGJlY2F1c2UgYWxsIHN0eWxpbmcgYmluZGluZyB2YWx1ZXNcbiAgLy8gYXJlIHN0b3JlZCBpbnNpZGUgb2YgdGhlIGxWaWV3LlxuICBjb25zdCBiaW5kaW5nSW5kZXggPSBuZXh0QmluZGluZ0luZGV4KCk7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgZWxlbWVudEluZGV4ID0gZ2V0U2VsZWN0ZWRJbmRleCgpO1xuICBjb25zdCB0Tm9kZSA9IGdldFROb2RlKGVsZW1lbnRJbmRleCwgbFZpZXcpO1xuICBjb25zdCBmaXJzdFVwZGF0ZVBhc3MgPSBsVmlld1tUVklFV10uZmlyc3RVcGRhdGVQYXNzO1xuXG4gIC8vIHdlIGNoZWNrIGZvciB0aGlzIGluIHRoZSBpbnN0cnVjdGlvbiBjb2RlIHNvIHRoYXQgdGhlIGNvbnRleHQgY2FuIGJlIG5vdGlmaWVkXG4gIC8vIGFib3V0IHByb3Agb3IgbWFwIGJpbmRpbmdzIHNvIHRoYXQgdGhlIGRpcmVjdCBhcHBseSBjaGVjayBjYW4gZGVjaWRlIGVhcmxpZXJcbiAgLy8gaWYgaXQgYWxsb3dzIGZvciBjb250ZXh0IHJlc29sdXRpb24gdG8gYmUgYnlwYXNzZWQuXG4gIGlmIChmaXJzdFVwZGF0ZVBhc3MpIHtcbiAgICBwYXRjaENvbmZpZyh0Tm9kZSwgVE5vZGVGbGFncy5oYXNDbGFzc1Byb3BCaW5kaW5ncyk7XG4gICAgcGF0Y2hIb3N0U3R5bGluZ0ZsYWcodE5vZGUsIGlzSG9zdFN0eWxpbmcoKSwgdHJ1ZSk7XG4gIH1cblxuICBjb25zdCB1cGRhdGVkID0gc3R5bGluZ1Byb3AodE5vZGUsIGZpcnN0VXBkYXRlUGFzcywgbFZpZXcsIGJpbmRpbmdJbmRleCwgY2xhc3NOYW1lLCB2YWx1ZSwgdHJ1ZSk7XG4gIGlmIChuZ0Rldk1vZGUpIHtcbiAgICBuZ0Rldk1vZGUuY2xhc3NQcm9wKys7XG4gICAgaWYgKHVwZGF0ZWQpIHtcbiAgICAgIG5nRGV2TW9kZS5jbGFzc1Byb3BDYWNoZU1pc3MrKztcbiAgICB9XG4gIH1cbiAgcmV0dXJuIMm1ybVjbGFzc1Byb3A7XG59XG5cbi8qKlxuICogU2hhcmVkIGZ1bmN0aW9uIHVzZWQgdG8gdXBkYXRlIGEgcHJvcC1iYXNlZCBzdHlsaW5nIGJpbmRpbmcgZm9yIGFuIGVsZW1lbnQuXG4gKlxuICogRGVwZW5kaW5nIG9uIHRoZSBzdGF0ZSBvZiB0aGUgYHROb2RlLnN0eWxlc2Agc3R5bGVzIGNvbnRleHQsIHRoZSBzdHlsZS9wcm9wXG4gKiB2YWx1ZSBtYXkgYmUgYXBwbGllZCBkaXJlY3RseSB0byB0aGUgZWxlbWVudCBpbnN0ZWFkIG9mIGJlaW5nIHByb2Nlc3NlZFxuICogdGhyb3VnaCB0aGUgY29udGV4dC4gVGhlIHJlYXNvbiB3aHkgdGhpcyBvY2N1cnMgaXMgZm9yIHBlcmZvcm1hbmNlIGFuZCBmdWxseVxuICogZGVwZW5kcyBvbiB0aGUgc3RhdGUgb2YgdGhlIGNvbnRleHQgKGkuZS4gd2hldGhlciBvciBub3QgdGhlcmUgYXJlIGR1cGxpY2F0ZVxuICogYmluZGluZ3Mgb3Igd2hldGhlciBvciBub3QgdGhlcmUgYXJlIG1hcC1iYXNlZCBiaW5kaW5ncyBhbmQgcHJvcGVydHkgYmluZGluZ3NcbiAqIHByZXNlbnQgdG9nZXRoZXIpLlxuICovXG5mdW5jdGlvbiBzdHlsaW5nUHJvcChcbiAgICB0Tm9kZTogVE5vZGUsIGZpcnN0VXBkYXRlUGFzczogYm9vbGVhbiwgbFZpZXc6IExWaWV3LCBiaW5kaW5nSW5kZXg6IG51bWJlciwgcHJvcDogc3RyaW5nLFxuICAgIHZhbHVlOiBib29sZWFuIHwgbnVtYmVyIHwgU2FmZVZhbHVlIHwgc3RyaW5nIHwgbnVsbCB8IHVuZGVmaW5lZCB8IE5PX0NIQU5HRSxcbiAgICBpc0NsYXNzQmFzZWQ6IGJvb2xlYW4pOiBib29sZWFuIHtcbiAgbGV0IHVwZGF0ZWQgPSBmYWxzZTtcblxuICBjb25zdCBuYXRpdmUgPSBnZXROYXRpdmVCeVROb2RlKHROb2RlLCBsVmlldykgYXMgUkVsZW1lbnQ7XG4gIGNvbnN0IGNvbnRleHQgPSBpc0NsYXNzQmFzZWQgPyBnZXRDbGFzc2VzQ29udGV4dCh0Tm9kZSkgOiBnZXRTdHlsZXNDb250ZXh0KHROb2RlKTtcbiAgY29uc3Qgc2FuaXRpemVyID0gaXNDbGFzc0Jhc2VkID8gbnVsbCA6IGdldEN1cnJlbnRTdHlsZVNhbml0aXplcigpO1xuXG4gIC8vIFtzdHlsZS5wcm9wXSBhbmQgW2NsYXNzLm5hbWVdIGJpbmRpbmdzIGRvIG5vdCB1c2UgYGJpbmQoKWAgYW5kIHdpbGxcbiAgLy8gdGhlcmVmb3JlIG1hbmFnZSBhY2Nlc3NpbmcgYW5kIHVwZGF0aW5nIHRoZSBuZXcgdmFsdWUgaW4gdGhlIGxWaWV3IGRpcmVjdGx5LlxuICAvLyBGb3IgdGhpcyByZWFzb24sIHRoZSBjaGVja05vQ2hhbmdlcyBzaXR1YXRpb24gbXVzdCBhbHNvIGJlIGhhbmRsZWQgaGVyZVxuICAvLyBhcyB3ZWxsLlxuICBpZiAobmdEZXZNb2RlICYmIGdldENoZWNrTm9DaGFuZ2VzTW9kZSgpKSB7XG4gICAgY29uc3Qgb2xkVmFsdWUgPSBnZXRWYWx1ZShsVmlldywgYmluZGluZ0luZGV4KTtcbiAgICBpZiAoaGFzVmFsdWVDaGFuZ2VkVW53cmFwU2FmZVZhbHVlKG9sZFZhbHVlLCB2YWx1ZSkpIHtcbiAgICAgIHRocm93RXJyb3JJZk5vQ2hhbmdlc01vZGUoZmFsc2UsIG9sZFZhbHVlLCB2YWx1ZSk7XG4gICAgfVxuICB9XG5cbiAgLy8gRGlyZWN0IEFwcGx5IENhc2U6IGJ5cGFzcyBjb250ZXh0IHJlc29sdXRpb24gYW5kIGFwcGx5IHRoZVxuICAvLyBzdHlsZS9jbGFzcyB2YWx1ZSBkaXJlY3RseSB0byB0aGUgZWxlbWVudFxuICBpZiAoYWxsb3dEaXJlY3RTdHlsaW5nKHROb2RlLCBpc0NsYXNzQmFzZWQsIGZpcnN0VXBkYXRlUGFzcykpIHtcbiAgICBjb25zdCBzYW5pdGl6ZXJUb1VzZSA9IGlzQ2xhc3NCYXNlZCA/IG51bGwgOiBzYW5pdGl6ZXI7XG4gICAgY29uc3QgcmVuZGVyZXIgPSBnZXRSZW5kZXJlcih0Tm9kZSwgbFZpZXcpO1xuICAgIHVwZGF0ZWQgPSBhcHBseVN0eWxpbmdWYWx1ZURpcmVjdGx5KFxuICAgICAgICByZW5kZXJlciwgY29udGV4dCwgdE5vZGUsIG5hdGl2ZSwgbFZpZXcsIGJpbmRpbmdJbmRleCwgcHJvcCwgdmFsdWUsIGlzQ2xhc3NCYXNlZCxcbiAgICAgICAgc2FuaXRpemVyVG9Vc2UpO1xuXG4gICAgaWYgKHNhbml0aXplclRvVXNlKSB7XG4gICAgICAvLyBpdCdzIGltcG9ydGFudCB3ZSByZW1vdmUgdGhlIGN1cnJlbnQgc3R5bGUgc2FuaXRpemVyIG9uY2UgdGhlXG4gICAgICAvLyBlbGVtZW50IGV4aXRzLCBvdGhlcndpc2UgaXQgd2lsbCBiZSB1c2VkIGJ5IHRoZSBuZXh0IHN0eWxpbmdcbiAgICAgIC8vIGluc3RydWN0aW9ucyBmb3IgdGhlIG5leHQgZWxlbWVudC5cbiAgICAgIHNldEVsZW1lbnRFeGl0Rm4oc3R5bGluZ0FwcGx5KTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgLy8gQ29udGV4dCBSZXNvbHV0aW9uIChvciBmaXJzdCB1cGRhdGUpIENhc2U6IHNhdmUgdGhlIHZhbHVlXG4gICAgLy8gYW5kIGRlZmVyIHRvIHRoZSBjb250ZXh0IHRvIGZsdXNoIGFuZCBhcHBseSB0aGUgc3R5bGUvY2xhc3MgYmluZGluZ1xuICAgIC8vIHZhbHVlIHRvIHRoZSBlbGVtZW50LlxuICAgIGNvbnN0IGRpcmVjdGl2ZUluZGV4ID0gZ2V0QWN0aXZlRGlyZWN0aXZlSWQoKTtcbiAgICBpZiAoaXNDbGFzc0Jhc2VkKSB7XG4gICAgICB1cGRhdGVkID0gdXBkYXRlQ2xhc3NWaWFDb250ZXh0KFxuICAgICAgICAgIGNvbnRleHQsIHROb2RlLCBsVmlldywgbmF0aXZlLCBkaXJlY3RpdmVJbmRleCwgcHJvcCwgYmluZGluZ0luZGV4LFxuICAgICAgICAgIHZhbHVlIGFzIHN0cmluZyB8IGJvb2xlYW4gfCBudWxsLCBmYWxzZSwgZmlyc3RVcGRhdGVQYXNzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdXBkYXRlZCA9IHVwZGF0ZVN0eWxlVmlhQ29udGV4dChcbiAgICAgICAgICBjb250ZXh0LCB0Tm9kZSwgbFZpZXcsIG5hdGl2ZSwgZGlyZWN0aXZlSW5kZXgsIHByb3AsIGJpbmRpbmdJbmRleCxcbiAgICAgICAgICB2YWx1ZSBhcyBzdHJpbmcgfCBTYWZlVmFsdWUgfCBudWxsLCBzYW5pdGl6ZXIsIGZhbHNlLCBmaXJzdFVwZGF0ZVBhc3MpO1xuICAgIH1cblxuICAgIHNldEVsZW1lbnRFeGl0Rm4oc3R5bGluZ0FwcGx5KTtcbiAgfVxuXG4gIHJldHVybiB1cGRhdGVkO1xufVxuXG4vKipcbiAqIFVwZGF0ZSBzdHlsZSBiaW5kaW5ncyB1c2luZyBhbiBvYmplY3QgbGl0ZXJhbCBvbiBhbiBlbGVtZW50LlxuICpcbiAqIFRoaXMgaW5zdHJ1Y3Rpb24gaXMgbWVhbnQgdG8gYXBwbHkgc3R5bGluZyB2aWEgdGhlIGBbc3R5bGVdPVwiZXhwXCJgIHRlbXBsYXRlIGJpbmRpbmdzLlxuICogV2hlbiBzdHlsZXMgYXJlIGFwcGxpZWQgdG8gdGhlIGVsZW1lbnQgdGhleSB3aWxsIHRoZW4gYmUgdXBkYXRlZCB3aXRoIHJlc3BlY3QgdG9cbiAqIGFueSBzdHlsZXMvY2xhc3NlcyBzZXQgdmlhIGBzdHlsZVByb3BgLiBJZiBhbnkgc3R5bGVzIGFyZSBzZXQgdG8gZmFsc3lcbiAqIHRoZW4gdGhleSB3aWxsIGJlIHJlbW92ZWQgZnJvbSB0aGUgZWxlbWVudC5cbiAqXG4gKiBOb3RlIHRoYXQgdGhlIHN0eWxpbmcgaW5zdHJ1Y3Rpb24gd2lsbCBub3QgYmUgYXBwbGllZCB1bnRpbCBgc3R5bGluZ0FwcGx5YCBpcyBjYWxsZWQuXG4gKlxuICogQHBhcmFtIHN0eWxlcyBBIGtleS92YWx1ZSBzdHlsZSBtYXAgb2YgdGhlIHN0eWxlcyB0aGF0IHdpbGwgYmUgYXBwbGllZCB0byB0aGUgZ2l2ZW4gZWxlbWVudC5cbiAqICAgICAgICBBbnkgbWlzc2luZyBzdHlsZXMgKHRoYXQgaGF2ZSBhbHJlYWR5IGJlZW4gYXBwbGllZCB0byB0aGUgZWxlbWVudCBiZWZvcmVoYW5kKSB3aWxsIGJlXG4gKiAgICAgICAgcmVtb3ZlZCAodW5zZXQpIGZyb20gdGhlIGVsZW1lbnQncyBzdHlsaW5nLlxuICpcbiAqIE5vdGUgdGhhdCB0aGlzIHdpbGwgYXBwbHkgdGhlIHByb3ZpZGVkIHN0eWxlTWFwIHZhbHVlIHRvIHRoZSBob3N0IGVsZW1lbnQgaWYgdGhpcyBmdW5jdGlvblxuICogaXMgY2FsbGVkIHdpdGhpbiBhIGhvc3QgYmluZGluZy5cbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtXN0eWxlTWFwKHN0eWxlczoge1tzdHlsZU5hbWU6IHN0cmluZ106IGFueX0gfCBOT19DSEFOR0UgfCBudWxsKTogdm9pZCB7XG4gIGNvbnN0IGluZGV4ID0gZ2V0U2VsZWN0ZWRJbmRleCgpO1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IHROb2RlID0gZ2V0VE5vZGUoaW5kZXgsIGxWaWV3KTtcbiAgY29uc3QgZmlyc3RVcGRhdGVQYXNzID0gbFZpZXdbVFZJRVddLmZpcnN0VXBkYXRlUGFzcztcbiAgY29uc3QgY29udGV4dCA9IGdldFN0eWxlc0NvbnRleHQodE5vZGUpO1xuICBjb25zdCBoYXNEaXJlY3RpdmVJbnB1dCA9IGhhc1N0eWxlSW5wdXQodE5vZGUpO1xuXG4gIC8vIGlmIGEgdmFsdWUgaXMgaW50ZXJwb2xhdGVkIHRoZW4gaXQgbWF5IHJlbmRlciBhIGBOT19DSEFOR0VgIHZhbHVlLlxuICAvLyBpbiB0aGlzIGNhc2Ugd2UgZG8gbm90IG5lZWQgdG8gZG8gYW55dGhpbmcsIGJ1dCB0aGUgYmluZGluZyBpbmRleFxuICAvLyBzdGlsbCBuZWVkcyB0byBiZSBpbmNyZW1lbnRlZCBiZWNhdXNlIGFsbCBzdHlsaW5nIGJpbmRpbmcgdmFsdWVzXG4gIC8vIGFyZSBzdG9yZWQgaW5zaWRlIG9mIHRoZSBsVmlldy5cbiAgY29uc3QgYmluZGluZ0luZGV4ID0gaW5jcmVtZW50QmluZGluZ0luZGV4KDIpO1xuICBjb25zdCBob3N0QmluZGluZ3NNb2RlID0gaXNIb3N0U3R5bGluZygpO1xuXG4gIC8vIGlucHV0cyBhcmUgb25seSBldmFsdWF0ZWQgZnJvbSBhIHRlbXBsYXRlIGJpbmRpbmcgaW50byBhIGRpcmVjdGl2ZSwgdGhlcmVmb3JlLFxuICAvLyB0aGVyZSBzaG91bGQgbm90IGJlIGEgc2l0dWF0aW9uIHdoZXJlIGEgZGlyZWN0aXZlIGhvc3QgYmluZGluZ3MgZnVuY3Rpb25cbiAgLy8gZXZhbHVhdGVzIHRoZSBpbnB1dHMgKHRoaXMgc2hvdWxkIG9ubHkgaGFwcGVuIGluIHRoZSB0ZW1wbGF0ZSBmdW5jdGlvbilcbiAgaWYgKCFob3N0QmluZGluZ3NNb2RlICYmIGhhc0RpcmVjdGl2ZUlucHV0ICYmIHN0eWxlcyAhPT0gTk9fQ0hBTkdFKSB7XG4gICAgdXBkYXRlRGlyZWN0aXZlSW5wdXRWYWx1ZShjb250ZXh0LCBsVmlldywgdE5vZGUsIGJpbmRpbmdJbmRleCwgc3R5bGVzLCBmYWxzZSwgZmlyc3RVcGRhdGVQYXNzKTtcbiAgICBzdHlsZXMgPSBOT19DSEFOR0U7XG4gIH1cblxuICAvLyB3ZSBjaGVjayBmb3IgdGhpcyBpbiB0aGUgaW5zdHJ1Y3Rpb24gY29kZSBzbyB0aGF0IHRoZSBjb250ZXh0IGNhbiBiZSBub3RpZmllZFxuICAvLyBhYm91dCBwcm9wIG9yIG1hcCBiaW5kaW5ncyBzbyB0aGF0IHRoZSBkaXJlY3QgYXBwbHkgY2hlY2sgY2FuIGRlY2lkZSBlYXJsaWVyXG4gIC8vIGlmIGl0IGFsbG93cyBmb3IgY29udGV4dCByZXNvbHV0aW9uIHRvIGJlIGJ5cGFzc2VkLlxuICBpZiAoZmlyc3RVcGRhdGVQYXNzKSB7XG4gICAgcGF0Y2hDb25maWcodE5vZGUsIFROb2RlRmxhZ3MuaGFzU3R5bGVNYXBCaW5kaW5ncyk7XG4gICAgcGF0Y2hIb3N0U3R5bGluZ0ZsYWcodE5vZGUsIGlzSG9zdFN0eWxpbmcoKSwgZmFsc2UpO1xuICB9XG5cbiAgc3R5bGluZ01hcChcbiAgICAgIGNvbnRleHQsIHROb2RlLCBmaXJzdFVwZGF0ZVBhc3MsIGxWaWV3LCBiaW5kaW5nSW5kZXgsIHN0eWxlcywgZmFsc2UsIGhhc0RpcmVjdGl2ZUlucHV0KTtcbn1cblxuLyoqXG4gKiBVcGRhdGUgY2xhc3MgYmluZGluZ3MgdXNpbmcgYW4gb2JqZWN0IGxpdGVyYWwgb3IgY2xhc3Mtc3RyaW5nIG9uIGFuIGVsZW1lbnQuXG4gKlxuICogVGhpcyBpbnN0cnVjdGlvbiBpcyBtZWFudCB0byBhcHBseSBzdHlsaW5nIHZpYSB0aGUgYFtjbGFzc109XCJleHBcImAgdGVtcGxhdGUgYmluZGluZ3MuXG4gKiBXaGVuIGNsYXNzZXMgYXJlIGFwcGxpZWQgdG8gdGhlIGVsZW1lbnQgdGhleSB3aWxsIHRoZW4gYmUgdXBkYXRlZCB3aXRoXG4gKiByZXNwZWN0IHRvIGFueSBzdHlsZXMvY2xhc3NlcyBzZXQgdmlhIGBjbGFzc1Byb3BgLiBJZiBhbnlcbiAqIGNsYXNzZXMgYXJlIHNldCB0byBmYWxzeSB0aGVuIHRoZXkgd2lsbCBiZSByZW1vdmVkIGZyb20gdGhlIGVsZW1lbnQuXG4gKlxuICogTm90ZSB0aGF0IHRoZSBzdHlsaW5nIGluc3RydWN0aW9uIHdpbGwgbm90IGJlIGFwcGxpZWQgdW50aWwgYHN0eWxpbmdBcHBseWAgaXMgY2FsbGVkLlxuICogTm90ZSB0aGF0IHRoaXMgd2lsbCB0aGUgcHJvdmlkZWQgY2xhc3NNYXAgdmFsdWUgdG8gdGhlIGhvc3QgZWxlbWVudCBpZiB0aGlzIGZ1bmN0aW9uIGlzIGNhbGxlZFxuICogd2l0aGluIGEgaG9zdCBiaW5kaW5nLlxuICpcbiAqIEBwYXJhbSBjbGFzc2VzIEEga2V5L3ZhbHVlIG1hcCBvciBzdHJpbmcgb2YgQ1NTIGNsYXNzZXMgdGhhdCB3aWxsIGJlIGFkZGVkIHRvIHRoZVxuICogICAgICAgIGdpdmVuIGVsZW1lbnQuIEFueSBtaXNzaW5nIGNsYXNzZXMgKHRoYXQgaGF2ZSBhbHJlYWR5IGJlZW4gYXBwbGllZCB0byB0aGUgZWxlbWVudFxuICogICAgICAgIGJlZm9yZWhhbmQpIHdpbGwgYmUgcmVtb3ZlZCAodW5zZXQpIGZyb20gdGhlIGVsZW1lbnQncyBsaXN0IG9mIENTUyBjbGFzc2VzLlxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1Y2xhc3NNYXAoY2xhc3Nlczoge1tjbGFzc05hbWU6IHN0cmluZ106IGFueX0gfCBOT19DSEFOR0UgfCBzdHJpbmcgfCBudWxsKTogdm9pZCB7XG4gIGNsYXNzTWFwSW50ZXJuYWwoZ2V0U2VsZWN0ZWRJbmRleCgpLCBjbGFzc2VzKTtcbn1cblxuLyoqXG4gKiBJbnRlcm5hbCBmdW5jdGlvbiBmb3IgYXBwbHlpbmcgYSBjbGFzcyBzdHJpbmcgb3Iga2V5L3ZhbHVlIG1hcCBvZiBjbGFzc2VzIHRvIGFuIGVsZW1lbnQuXG4gKlxuICogVGhlIHJlYXNvbiB3aHkgdGhpcyBmdW5jdGlvbiBoYXMgYmVlbiBzZXBhcmF0ZWQgZnJvbSBgybXJtWNsYXNzTWFwYCBpcyBiZWNhdXNlXG4gKiBpdCBpcyBhbHNvIGNhbGxlZCBmcm9tIGDJtcm1Y2xhc3NNYXBJbnRlcnBvbGF0ZWAuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjbGFzc01hcEludGVybmFsKFxuICAgIGVsZW1lbnRJbmRleDogbnVtYmVyLCBjbGFzc2VzOiB7W2NsYXNzTmFtZTogc3RyaW5nXTogYW55fSB8IE5PX0NIQU5HRSB8IHN0cmluZyB8IG51bGwpOiB2b2lkIHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCB0Tm9kZSA9IGdldFROb2RlKGVsZW1lbnRJbmRleCwgbFZpZXcpO1xuICBjb25zdCBmaXJzdFVwZGF0ZVBhc3MgPSBsVmlld1tUVklFV10uZmlyc3RVcGRhdGVQYXNzO1xuICBjb25zdCBjb250ZXh0ID0gZ2V0Q2xhc3Nlc0NvbnRleHQodE5vZGUpO1xuICBjb25zdCBoYXNEaXJlY3RpdmVJbnB1dCA9IGhhc0NsYXNzSW5wdXQodE5vZGUpO1xuXG4gIC8vIGlmIGEgdmFsdWUgaXMgaW50ZXJwb2xhdGVkIHRoZW4gaXQgbWF5IHJlbmRlciBhIGBOT19DSEFOR0VgIHZhbHVlLlxuICAvLyBpbiB0aGlzIGNhc2Ugd2UgZG8gbm90IG5lZWQgdG8gZG8gYW55dGhpbmcsIGJ1dCB0aGUgYmluZGluZyBpbmRleFxuICAvLyBzdGlsbCBuZWVkcyB0byBiZSBpbmNyZW1lbnRlZCBiZWNhdXNlIGFsbCBzdHlsaW5nIGJpbmRpbmcgdmFsdWVzXG4gIC8vIGFyZSBzdG9yZWQgaW5zaWRlIG9mIHRoZSBsVmlldy5cbiAgY29uc3QgYmluZGluZ0luZGV4ID0gaW5jcmVtZW50QmluZGluZ0luZGV4KDIpO1xuICBjb25zdCBob3N0QmluZGluZ3NNb2RlID0gaXNIb3N0U3R5bGluZygpO1xuXG4gIC8vIGlucHV0cyBhcmUgb25seSBldmFsdWF0ZWQgZnJvbSBhIHRlbXBsYXRlIGJpbmRpbmcgaW50byBhIGRpcmVjdGl2ZSwgdGhlcmVmb3JlLFxuICAvLyB0aGVyZSBzaG91bGQgbm90IGJlIGEgc2l0dWF0aW9uIHdoZXJlIGEgZGlyZWN0aXZlIGhvc3QgYmluZGluZ3MgZnVuY3Rpb25cbiAgLy8gZXZhbHVhdGVzIHRoZSBpbnB1dHMgKHRoaXMgc2hvdWxkIG9ubHkgaGFwcGVuIGluIHRoZSB0ZW1wbGF0ZSBmdW5jdGlvbilcbiAgaWYgKCFob3N0QmluZGluZ3NNb2RlICYmIGhhc0RpcmVjdGl2ZUlucHV0ICYmIGNsYXNzZXMgIT09IE5PX0NIQU5HRSkge1xuICAgIHVwZGF0ZURpcmVjdGl2ZUlucHV0VmFsdWUoY29udGV4dCwgbFZpZXcsIHROb2RlLCBiaW5kaW5nSW5kZXgsIGNsYXNzZXMsIHRydWUsIGZpcnN0VXBkYXRlUGFzcyk7XG4gICAgY2xhc3NlcyA9IE5PX0NIQU5HRTtcbiAgfVxuXG4gIC8vIHdlIGNoZWNrIGZvciB0aGlzIGluIHRoZSBpbnN0cnVjdGlvbiBjb2RlIHNvIHRoYXQgdGhlIGNvbnRleHQgY2FuIGJlIG5vdGlmaWVkXG4gIC8vIGFib3V0IHByb3Agb3IgbWFwIGJpbmRpbmdzIHNvIHRoYXQgdGhlIGRpcmVjdCBhcHBseSBjaGVjayBjYW4gZGVjaWRlIGVhcmxpZXJcbiAgLy8gaWYgaXQgYWxsb3dzIGZvciBjb250ZXh0IHJlc29sdXRpb24gdG8gYmUgYnlwYXNzZWQuXG4gIGlmIChmaXJzdFVwZGF0ZVBhc3MpIHtcbiAgICBwYXRjaENvbmZpZyh0Tm9kZSwgVE5vZGVGbGFncy5oYXNDbGFzc01hcEJpbmRpbmdzKTtcbiAgICBwYXRjaEhvc3RTdHlsaW5nRmxhZyh0Tm9kZSwgaXNIb3N0U3R5bGluZygpLCB0cnVlKTtcbiAgfVxuXG4gIHN0eWxpbmdNYXAoXG4gICAgICBjb250ZXh0LCB0Tm9kZSwgZmlyc3RVcGRhdGVQYXNzLCBsVmlldywgYmluZGluZ0luZGV4LCBjbGFzc2VzLCB0cnVlLCBoYXNEaXJlY3RpdmVJbnB1dCk7XG59XG5cbi8qKlxuICogU2hhcmVkIGZ1bmN0aW9uIHVzZWQgdG8gdXBkYXRlIGEgbWFwLWJhc2VkIHN0eWxpbmcgYmluZGluZyBmb3IgYW4gZWxlbWVudC5cbiAqXG4gKiBXaGVuIHRoaXMgZnVuY3Rpb24gaXMgY2FsbGVkIGl0IHdpbGwgYWN0aXZhdGUgc3VwcG9ydCBmb3IgYFtzdHlsZV1gIGFuZFxuICogYFtjbGFzc11gIGJpbmRpbmdzIGluIEFuZ3VsYXIuXG4gKi9cbmZ1bmN0aW9uIHN0eWxpbmdNYXAoXG4gICAgY29udGV4dDogVFN0eWxpbmdDb250ZXh0LCB0Tm9kZTogVE5vZGUsIGZpcnN0VXBkYXRlUGFzczogYm9vbGVhbiwgbFZpZXc6IExWaWV3LFxuICAgIGJpbmRpbmdJbmRleDogbnVtYmVyLCB2YWx1ZToge1trZXk6IHN0cmluZ106IGFueX0gfCBzdHJpbmcgfCBudWxsLCBpc0NsYXNzQmFzZWQ6IGJvb2xlYW4sXG4gICAgaGFzRGlyZWN0aXZlSW5wdXQ6IGJvb2xlYW4pOiB2b2lkIHtcbiAgY29uc3QgZGlyZWN0aXZlSW5kZXggPSBnZXRBY3RpdmVEaXJlY3RpdmVJZCgpO1xuICBjb25zdCBuYXRpdmUgPSBnZXROYXRpdmVCeVROb2RlKHROb2RlLCBsVmlldykgYXMgUkVsZW1lbnQ7XG4gIGNvbnN0IG9sZFZhbHVlID0gZ2V0VmFsdWUobFZpZXcsIGJpbmRpbmdJbmRleCk7XG4gIGNvbnN0IHNhbml0aXplciA9IGdldEN1cnJlbnRTdHlsZVNhbml0aXplcigpO1xuICBjb25zdCB2YWx1ZUhhc0NoYW5nZWQgPSBoYXNWYWx1ZUNoYW5nZWQob2xkVmFsdWUsIHZhbHVlKTtcblxuICAvLyBbc3R5bGVdIGFuZCBbY2xhc3NdIGJpbmRpbmdzIGRvIG5vdCB1c2UgYGJpbmQoKWAgYW5kIHdpbGwgdGhlcmVmb3JlXG4gIC8vIG1hbmFnZSBhY2Nlc3NpbmcgYW5kIHVwZGF0aW5nIHRoZSBuZXcgdmFsdWUgaW4gdGhlIGxWaWV3IGRpcmVjdGx5LlxuICAvLyBGb3IgdGhpcyByZWFzb24sIHRoZSBjaGVja05vQ2hhbmdlcyBzaXR1YXRpb24gbXVzdCBhbHNvIGJlIGhhbmRsZWQgaGVyZVxuICAvLyBhcyB3ZWxsLlxuICBpZiAobmdEZXZNb2RlICYmIHZhbHVlSGFzQ2hhbmdlZCAmJiBnZXRDaGVja05vQ2hhbmdlc01vZGUoKSkge1xuICAgIHRocm93RXJyb3JJZk5vQ2hhbmdlc01vZGUoZmFsc2UsIG9sZFZhbHVlLCB2YWx1ZSk7XG4gIH1cblxuICAvLyBEaXJlY3QgQXBwbHkgQ2FzZTogYnlwYXNzIGNvbnRleHQgcmVzb2x1dGlvbiBhbmQgYXBwbHkgdGhlXG4gIC8vIHN0eWxlL2NsYXNzIG1hcCB2YWx1ZXMgZGlyZWN0bHkgdG8gdGhlIGVsZW1lbnRcbiAgaWYgKGFsbG93RGlyZWN0U3R5bGluZyh0Tm9kZSwgaXNDbGFzc0Jhc2VkLCBmaXJzdFVwZGF0ZVBhc3MpKSB7XG4gICAgY29uc3Qgc2FuaXRpemVyVG9Vc2UgPSBpc0NsYXNzQmFzZWQgPyBudWxsIDogc2FuaXRpemVyO1xuICAgIGNvbnN0IHJlbmRlcmVyID0gZ2V0UmVuZGVyZXIodE5vZGUsIGxWaWV3KTtcbiAgICBhcHBseVN0eWxpbmdNYXBEaXJlY3RseShcbiAgICAgICAgcmVuZGVyZXIsIGNvbnRleHQsIHROb2RlLCBuYXRpdmUsIGxWaWV3LCBiaW5kaW5nSW5kZXgsIHZhbHVlLCBpc0NsYXNzQmFzZWQsIHNhbml0aXplclRvVXNlLFxuICAgICAgICB2YWx1ZUhhc0NoYW5nZWQsIGhhc0RpcmVjdGl2ZUlucHV0KTtcbiAgICBpZiAoc2FuaXRpemVyVG9Vc2UpIHtcbiAgICAgIC8vIGl0J3MgaW1wb3J0YW50IHdlIHJlbW92ZSB0aGUgY3VycmVudCBzdHlsZSBzYW5pdGl6ZXIgb25jZSB0aGVcbiAgICAgIC8vIGVsZW1lbnQgZXhpdHMsIG90aGVyd2lzZSBpdCB3aWxsIGJlIHVzZWQgYnkgdGhlIG5leHQgc3R5bGluZ1xuICAgICAgLy8gaW5zdHJ1Y3Rpb25zIGZvciB0aGUgbmV4dCBlbGVtZW50LlxuICAgICAgc2V0RWxlbWVudEV4aXRGbihzdHlsaW5nQXBwbHkpO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBjb25zdCBzdHlsaW5nTWFwQXJyID1cbiAgICAgICAgdmFsdWUgPT09IE5PX0NIQU5HRSA/IE5PX0NIQU5HRSA6IG5vcm1hbGl6ZUludG9TdHlsaW5nTWFwKG9sZFZhbHVlLCB2YWx1ZSwgIWlzQ2xhc3NCYXNlZCk7XG5cbiAgICBhY3RpdmF0ZVN0eWxpbmdNYXBGZWF0dXJlKCk7XG5cbiAgICAvLyBDb250ZXh0IFJlc29sdXRpb24gKG9yIGZpcnN0IHVwZGF0ZSkgQ2FzZTogc2F2ZSB0aGUgbWFwIHZhbHVlXG4gICAgLy8gYW5kIGRlZmVyIHRvIHRoZSBjb250ZXh0IHRvIGZsdXNoIGFuZCBhcHBseSB0aGUgc3R5bGUvY2xhc3MgYmluZGluZ1xuICAgIC8vIHZhbHVlIHRvIHRoZSBlbGVtZW50LlxuICAgIGlmIChpc0NsYXNzQmFzZWQpIHtcbiAgICAgIHVwZGF0ZUNsYXNzVmlhQ29udGV4dChcbiAgICAgICAgICBjb250ZXh0LCB0Tm9kZSwgbFZpZXcsIG5hdGl2ZSwgZGlyZWN0aXZlSW5kZXgsIG51bGwsIGJpbmRpbmdJbmRleCwgc3R5bGluZ01hcEFycixcbiAgICAgICAgICB2YWx1ZUhhc0NoYW5nZWQsIGZpcnN0VXBkYXRlUGFzcyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHVwZGF0ZVN0eWxlVmlhQ29udGV4dChcbiAgICAgICAgICBjb250ZXh0LCB0Tm9kZSwgbFZpZXcsIG5hdGl2ZSwgZGlyZWN0aXZlSW5kZXgsIG51bGwsIGJpbmRpbmdJbmRleCwgc3R5bGluZ01hcEFycixcbiAgICAgICAgICBzYW5pdGl6ZXIsIHZhbHVlSGFzQ2hhbmdlZCwgZmlyc3RVcGRhdGVQYXNzKTtcbiAgICB9XG5cbiAgICBzZXRFbGVtZW50RXhpdEZuKHN0eWxpbmdBcHBseSk7XG4gIH1cblxuICBpZiAobmdEZXZNb2RlKSB7XG4gICAgaXNDbGFzc0Jhc2VkID8gbmdEZXZNb2RlLmNsYXNzTWFwIDogbmdEZXZNb2RlLnN0eWxlTWFwKys7XG4gICAgaWYgKHZhbHVlSGFzQ2hhbmdlZCkge1xuICAgICAgaXNDbGFzc0Jhc2VkID8gbmdEZXZNb2RlLmNsYXNzTWFwQ2FjaGVNaXNzIDogbmdEZXZNb2RlLnN0eWxlTWFwQ2FjaGVNaXNzKys7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogV3JpdGVzIGEgdmFsdWUgdG8gYSBkaXJlY3RpdmUncyBgc3R5bGVgIG9yIGBjbGFzc2AgaW5wdXQgYmluZGluZyAoaWYgaXQgaGFzIGNoYW5nZWQpLlxuICpcbiAqIElmIGEgZGlyZWN0aXZlIGhhcyBhIGBASW5wdXRgIGJpbmRpbmcgdGhhdCBpcyBzZXQgb24gYHN0eWxlYCBvciBgY2xhc3NgIHRoZW4gdGhhdCB2YWx1ZVxuICogd2lsbCB0YWtlIHByaW9yaXR5IG92ZXIgdGhlIHVuZGVybHlpbmcgc3R5bGUvY2xhc3Mgc3R5bGluZyBiaW5kaW5ncy4gVGhpcyB2YWx1ZSB3aWxsXG4gKiBiZSB1cGRhdGVkIGZvciB0aGUgYmluZGluZyBlYWNoIHRpbWUgZHVyaW5nIGNoYW5nZSBkZXRlY3Rpb24uXG4gKlxuICogV2hlbiB0aGlzIG9jY3VycyB0aGlzIGZ1bmN0aW9uIHdpbGwgYXR0ZW1wdCB0byB3cml0ZSB0aGUgdmFsdWUgdG8gdGhlIGlucHV0IGJpbmRpbmdcbiAqIGRlcGVuZGluZyBvbiB0aGUgZm9sbG93aW5nIHNpdHVhdGlvbnM6XG4gKlxuICogLSBJZiBgb2xkVmFsdWUgIT09IG5ld1ZhbHVlYFxuICogLSBJZiBgbmV3VmFsdWVgIGlzIGBudWxsYCAoYnV0IHRoaXMgaXMgc2tpcHBlZCBpZiBpdCBpcyBkdXJpbmcgdGhlIGZpcnN0IHVwZGF0ZSBwYXNzKVxuICovXG5mdW5jdGlvbiB1cGRhdGVEaXJlY3RpdmVJbnB1dFZhbHVlKFxuICAgIGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCwgbFZpZXc6IExWaWV3LCB0Tm9kZTogVE5vZGUsIGJpbmRpbmdJbmRleDogbnVtYmVyLCBuZXdWYWx1ZTogYW55LFxuICAgIGlzQ2xhc3NCYXNlZDogYm9vbGVhbiwgZmlyc3RVcGRhdGVQYXNzOiBib29sZWFuKTogdm9pZCB7XG4gIGNvbnN0IG9sZFZhbHVlID0gZ2V0VmFsdWUobFZpZXcsIGJpbmRpbmdJbmRleCk7XG4gIGlmIChoYXNWYWx1ZUNoYW5nZWQob2xkVmFsdWUsIG5ld1ZhbHVlKSkge1xuICAgIC8vIGV2ZW4gaWYgdGhlIHZhbHVlIGhhcyBjaGFuZ2VkIHdlIG1heSBub3Qgd2FudCB0byBlbWl0IGl0IHRvIHRoZVxuICAgIC8vIGRpcmVjdGl2ZSBpbnB1dChzKSBpbiB0aGUgZXZlbnQgdGhhdCBpdCBpcyBmYWxzeSBkdXJpbmcgdGhlXG4gICAgLy8gZmlyc3QgdXBkYXRlIHBhc3MuXG4gICAgaWYgKGlzU3R5bGluZ1ZhbHVlRGVmaW5lZChuZXdWYWx1ZSkgfHwgIWZpcnN0VXBkYXRlUGFzcykge1xuICAgICAgY29uc3QgaW5wdXROYW1lOiBzdHJpbmcgPSBpc0NsYXNzQmFzZWQgPyBzZWxlY3RDbGFzc0Jhc2VkSW5wdXROYW1lKHROb2RlLmlucHV0cyAhKSA6ICdzdHlsZSc7XG4gICAgICBjb25zdCBpbnB1dHMgPSB0Tm9kZS5pbnB1dHMgIVtpbnB1dE5hbWVdICE7XG4gICAgICBjb25zdCBpbml0aWFsVmFsdWUgPSBnZXRJbml0aWFsU3R5bGluZ1ZhbHVlKGNvbnRleHQpO1xuICAgICAgY29uc3QgdmFsdWUgPSBub3JtYWxpemVTdHlsaW5nRGlyZWN0aXZlSW5wdXRWYWx1ZShpbml0aWFsVmFsdWUsIG5ld1ZhbHVlLCBpc0NsYXNzQmFzZWQpO1xuICAgICAgc2V0SW5wdXRzRm9yUHJvcGVydHkobFZpZXcsIGlucHV0cywgaW5wdXROYW1lLCB2YWx1ZSk7XG4gICAgICBzZXRFbGVtZW50RXhpdEZuKHN0eWxpbmdBcHBseSk7XG4gICAgfVxuICAgIHNldFZhbHVlKGxWaWV3LCBiaW5kaW5nSW5kZXgsIG5ld1ZhbHVlKTtcbiAgfVxufVxuXG4vKipcbiAqIFJldHVybnMgdGhlIGFwcHJvcHJpYXRlIGRpcmVjdGl2ZSBpbnB1dCB2YWx1ZSBmb3IgYHN0eWxlYCBvciBgY2xhc3NgLlxuICpcbiAqIEVhcmxpZXIgdmVyc2lvbnMgb2YgQW5ndWxhciBleHBlY3QgYSBiaW5kaW5nIHZhbHVlIHRvIGJlIHBhc3NlZCBpbnRvIGRpcmVjdGl2ZSBjb2RlXG4gKiBleGFjdGx5IGFzIGl0IGlzIHVubGVzcyB0aGVyZSBpcyBhIHN0YXRpYyB2YWx1ZSBwcmVzZW50IChpbiB3aGljaCBjYXNlIGJvdGggdmFsdWVzXG4gKiB3aWxsIGJlIHN0cmluZ2lmaWVkIGFuZCBjb25jYXRlbmF0ZWQpLlxuICovXG5mdW5jdGlvbiBub3JtYWxpemVTdHlsaW5nRGlyZWN0aXZlSW5wdXRWYWx1ZShcbiAgICBpbml0aWFsVmFsdWU6IHN0cmluZywgYmluZGluZ1ZhbHVlOiBzdHJpbmcgfCB7W2tleTogc3RyaW5nXTogYW55fSB8IG51bGwsXG4gICAgaXNDbGFzc0Jhc2VkOiBib29sZWFuKSB7XG4gIGxldCB2YWx1ZSA9IGJpbmRpbmdWYWx1ZTtcblxuICAvLyB3ZSBvbmx5IGNvbmNhdCB2YWx1ZXMgaWYgdGhlcmUgaXMgYW4gaW5pdGlhbCB2YWx1ZSwgb3RoZXJ3aXNlIHdlIHJldHVybiB0aGUgdmFsdWUgYXMgaXMuXG4gIC8vIE5vdGUgdGhhdCB0aGlzIGlzIHRvIHNhdGlzZnkgYmFja3dhcmRzLWNvbXBhdGliaWxpdHkgaW4gQW5ndWxhci5cbiAgaWYgKGluaXRpYWxWYWx1ZS5sZW5ndGgpIHtcbiAgICBpZiAoaXNDbGFzc0Jhc2VkKSB7XG4gICAgICB2YWx1ZSA9IGNvbmNhdFN0cmluZyhpbml0aWFsVmFsdWUsIGZvcmNlQ2xhc3Nlc0FzU3RyaW5nKGJpbmRpbmdWYWx1ZSkpO1xuICAgIH0gZWxzZSB7XG4gICAgICB2YWx1ZSA9IGNvbmNhdFN0cmluZyhpbml0aWFsVmFsdWUsIGZvcmNlU3R5bGVzQXNTdHJpbmcoYmluZGluZ1ZhbHVlLCB0cnVlKSwgJzsnKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHZhbHVlO1xufVxuXG4vKipcbiAqIEZsdXNoZXMgYWxsIHN0eWxpbmcgY29kZSB0byB0aGUgZWxlbWVudC5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIGlzIGRlc2lnbmVkIHRvIGJlIHNjaGVkdWxlZCBmcm9tIGFueSBvZiB0aGUgZm91ciBzdHlsaW5nIGluc3RydWN0aW9uc1xuICogaW4gdGhpcyBmaWxlLiBXaGVuIGNhbGxlZCBpdCB3aWxsIGZsdXNoIGFsbCBzdHlsZSBhbmQgY2xhc3MgYmluZGluZ3MgdG8gdGhlIGVsZW1lbnRcbiAqIHZpYSB0aGUgY29udGV4dCByZXNvbHV0aW9uIGFsZ29yaXRobS5cbiAqL1xuZnVuY3Rpb24gc3R5bGluZ0FwcGx5KCk6IHZvaWQge1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IHRWaWV3ID0gbFZpZXdbVFZJRVddO1xuICBjb25zdCBlbGVtZW50SW5kZXggPSBnZXRTZWxlY3RlZEluZGV4KCk7XG4gIGNvbnN0IHROb2RlID0gZ2V0VE5vZGUoZWxlbWVudEluZGV4LCBsVmlldyk7XG4gIGNvbnN0IG5hdGl2ZSA9IGdldE5hdGl2ZUJ5VE5vZGUodE5vZGUsIGxWaWV3KSBhcyBSRWxlbWVudDtcbiAgY29uc3QgZGlyZWN0aXZlSW5kZXggPSBnZXRBY3RpdmVEaXJlY3RpdmVJZCgpO1xuICBjb25zdCByZW5kZXJlciA9IGdldFJlbmRlcmVyKHROb2RlLCBsVmlldyk7XG4gIGNvbnN0IHNhbml0aXplciA9IGdldEN1cnJlbnRTdHlsZVNhbml0aXplcigpO1xuICBjb25zdCBjbGFzc2VzQ29udGV4dCA9IGlzU3R5bGluZ0NvbnRleHQodE5vZGUuY2xhc3NlcykgPyB0Tm9kZS5jbGFzc2VzIGFzIFRTdHlsaW5nQ29udGV4dCA6IG51bGw7XG4gIGNvbnN0IHN0eWxlc0NvbnRleHQgPSBpc1N0eWxpbmdDb250ZXh0KHROb2RlLnN0eWxlcykgPyB0Tm9kZS5zdHlsZXMgYXMgVFN0eWxpbmdDb250ZXh0IDogbnVsbDtcbiAgZmx1c2hTdHlsaW5nKFxuICAgICAgcmVuZGVyZXIsIGxWaWV3LCB0Tm9kZSwgY2xhc3Nlc0NvbnRleHQsIHN0eWxlc0NvbnRleHQsIG5hdGl2ZSwgZGlyZWN0aXZlSW5kZXgsIHNhbml0aXplcixcbiAgICAgIHRWaWV3LmZpcnN0VXBkYXRlUGFzcyk7XG4gIHJlc2V0Q3VycmVudFN0eWxlU2FuaXRpemVyKCk7XG59XG5cbmZ1bmN0aW9uIGdldFJlbmRlcmVyKHROb2RlOiBUTm9kZSwgbFZpZXc6IExWaWV3KSB7XG4gIHJldHVybiB0Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuRWxlbWVudCA/IGxWaWV3W1JFTkRFUkVSXSA6IG51bGw7XG59XG5cbi8qKlxuICogU2VhcmNoZXMgYW5kIGFzc2lnbnMgcHJvdmlkZWQgYWxsIHN0YXRpYyBzdHlsZS9jbGFzcyBlbnRyaWVzIChmb3VuZCBpbiB0aGUgYGF0dHJzYCB2YWx1ZSlcbiAqIGFuZCByZWdpc3RlcnMgdGhlbSBpbiB0aGVpciByZXNwZWN0aXZlIHN0eWxpbmcgY29udGV4dHMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZWdpc3RlckluaXRpYWxTdHlsaW5nT25UTm9kZShcbiAgICB0Tm9kZTogVE5vZGUsIGF0dHJzOiBUQXR0cmlidXRlcywgc3RhcnRJbmRleDogbnVtYmVyKTogYm9vbGVhbiB7XG4gIGxldCBoYXNBZGRpdGlvbmFsSW5pdGlhbFN0eWxpbmcgPSBmYWxzZTtcbiAgbGV0IHN0eWxlcyA9IGdldFN0eWxpbmdNYXBBcnJheSh0Tm9kZS5zdHlsZXMpO1xuICBsZXQgY2xhc3NlcyA9IGdldFN0eWxpbmdNYXBBcnJheSh0Tm9kZS5jbGFzc2VzKTtcbiAgbGV0IG1vZGUgPSAtMTtcbiAgZm9yIChsZXQgaSA9IHN0YXJ0SW5kZXg7IGkgPCBhdHRycy5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IGF0dHIgPSBhdHRyc1tpXSBhcyBzdHJpbmc7XG4gICAgaWYgKHR5cGVvZiBhdHRyID09ICdudW1iZXInKSB7XG4gICAgICBtb2RlID0gYXR0cjtcbiAgICB9IGVsc2UgaWYgKG1vZGUgPT0gQXR0cmlidXRlTWFya2VyLkNsYXNzZXMpIHtcbiAgICAgIGNsYXNzZXMgPSBjbGFzc2VzIHx8IGFsbG9jU3R5bGluZ01hcEFycmF5KG51bGwpO1xuICAgICAgYWRkSXRlbVRvU3R5bGluZ01hcChjbGFzc2VzLCBhdHRyLCB0cnVlKTtcbiAgICAgIGhhc0FkZGl0aW9uYWxJbml0aWFsU3R5bGluZyA9IHRydWU7XG4gICAgfSBlbHNlIGlmIChtb2RlID09IEF0dHJpYnV0ZU1hcmtlci5TdHlsZXMpIHtcbiAgICAgIGNvbnN0IHZhbHVlID0gYXR0cnNbKytpXSBhcyBzdHJpbmcgfCBudWxsO1xuICAgICAgc3R5bGVzID0gc3R5bGVzIHx8IGFsbG9jU3R5bGluZ01hcEFycmF5KG51bGwpO1xuICAgICAgYWRkSXRlbVRvU3R5bGluZ01hcChzdHlsZXMsIGF0dHIsIHZhbHVlKTtcbiAgICAgIGhhc0FkZGl0aW9uYWxJbml0aWFsU3R5bGluZyA9IHRydWU7XG4gICAgfVxuICB9XG5cbiAgaWYgKGNsYXNzZXMgJiYgY2xhc3Nlcy5sZW5ndGggPiBTdHlsaW5nTWFwQXJyYXlJbmRleC5WYWx1ZXNTdGFydFBvc2l0aW9uKSB7XG4gICAgaWYgKCF0Tm9kZS5jbGFzc2VzKSB7XG4gICAgICB0Tm9kZS5jbGFzc2VzID0gY2xhc3NlcztcbiAgICB9XG4gICAgdXBkYXRlUmF3VmFsdWVPbkNvbnRleHQodE5vZGUuY2xhc3Nlcywgc3R5bGluZ01hcFRvU3RyaW5nKGNsYXNzZXMsIHRydWUpKTtcbiAgfVxuXG4gIGlmIChzdHlsZXMgJiYgc3R5bGVzLmxlbmd0aCA+IFN0eWxpbmdNYXBBcnJheUluZGV4LlZhbHVlc1N0YXJ0UG9zaXRpb24pIHtcbiAgICBpZiAoIXROb2RlLnN0eWxlcykge1xuICAgICAgdE5vZGUuc3R5bGVzID0gc3R5bGVzO1xuICAgIH1cbiAgICB1cGRhdGVSYXdWYWx1ZU9uQ29udGV4dCh0Tm9kZS5zdHlsZXMsIHN0eWxpbmdNYXBUb1N0cmluZyhzdHlsZXMsIGZhbHNlKSk7XG4gIH1cblxuICBpZiAoaGFzQWRkaXRpb25hbEluaXRpYWxTdHlsaW5nKSB7XG4gICAgdE5vZGUuZmxhZ3MgfD0gVE5vZGVGbGFncy5oYXNJbml0aWFsU3R5bGluZztcbiAgfVxuXG4gIHJldHVybiBoYXNBZGRpdGlvbmFsSW5pdGlhbFN0eWxpbmc7XG59XG5cbmZ1bmN0aW9uIHVwZGF0ZVJhd1ZhbHVlT25Db250ZXh0KGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCB8IFN0eWxpbmdNYXBBcnJheSwgdmFsdWU6IHN0cmluZykge1xuICBjb25zdCBzdHlsaW5nTWFwQXJyID0gZ2V0U3R5bGluZ01hcEFycmF5KGNvbnRleHQpICE7XG4gIHN0eWxpbmdNYXBBcnJbU3R5bGluZ01hcEFycmF5SW5kZXguUmF3VmFsdWVQb3NpdGlvbl0gPSB2YWx1ZTtcbn1cblxuZnVuY3Rpb24gZ2V0U3R5bGVzQ29udGV4dCh0Tm9kZTogVE5vZGUpOiBUU3R5bGluZ0NvbnRleHQge1xuICByZXR1cm4gZ2V0Q29udGV4dCh0Tm9kZSwgZmFsc2UpO1xufVxuXG5mdW5jdGlvbiBnZXRDbGFzc2VzQ29udGV4dCh0Tm9kZTogVE5vZGUpOiBUU3R5bGluZ0NvbnRleHQge1xuICByZXR1cm4gZ2V0Q29udGV4dCh0Tm9kZSwgdHJ1ZSk7XG59XG5cbi8qKlxuICogUmV0dXJucy9pbnN0YW50aWF0ZXMgYSBzdHlsaW5nIGNvbnRleHQgZnJvbS90byBhIGB0Tm9kZWAgaW5zdGFuY2UuXG4gKi9cbmZ1bmN0aW9uIGdldENvbnRleHQodE5vZGU6IFROb2RlLCBpc0NsYXNzQmFzZWQ6IGJvb2xlYW4pOiBUU3R5bGluZ0NvbnRleHQge1xuICBsZXQgY29udGV4dCA9IGlzQ2xhc3NCYXNlZCA/IHROb2RlLmNsYXNzZXMgOiB0Tm9kZS5zdHlsZXM7XG4gIGlmICghaXNTdHlsaW5nQ29udGV4dChjb250ZXh0KSkge1xuICAgIGNvbnN0IGhhc0RpcmVjdGl2ZXMgPSBpc0RpcmVjdGl2ZUhvc3QodE5vZGUpO1xuICAgIGNvbnRleHQgPSBhbGxvY1RTdHlsaW5nQ29udGV4dChjb250ZXh0IGFzIFN0eWxpbmdNYXBBcnJheSB8IG51bGwsIGhhc0RpcmVjdGl2ZXMpO1xuICAgIGlmIChuZ0Rldk1vZGUpIHtcbiAgICAgIGF0dGFjaFN0eWxpbmdEZWJ1Z09iamVjdChjb250ZXh0IGFzIFRTdHlsaW5nQ29udGV4dCwgdE5vZGUsIGlzQ2xhc3NCYXNlZCk7XG4gICAgfVxuXG4gICAgaWYgKGlzQ2xhc3NCYXNlZCkge1xuICAgICAgdE5vZGUuY2xhc3NlcyA9IGNvbnRleHQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIHROb2RlLnN0eWxlcyA9IGNvbnRleHQ7XG4gICAgfVxuICB9XG4gIHJldHVybiBjb250ZXh0IGFzIFRTdHlsaW5nQ29udGV4dDtcbn1cblxuZnVuY3Rpb24gcmVzb2x2ZVN0eWxlUHJvcFZhbHVlKFxuICAgIHZhbHVlOiBzdHJpbmcgfCBudW1iZXIgfCBTYWZlVmFsdWUgfCBudWxsIHwgTk9fQ0hBTkdFLFxuICAgIHN1ZmZpeDogc3RyaW5nIHwgbnVsbCB8IHVuZGVmaW5lZCk6IHN0cmluZ3xTYWZlVmFsdWV8bnVsbHx1bmRlZmluZWR8Tk9fQ0hBTkdFIHtcbiAgaWYgKHZhbHVlID09PSBOT19DSEFOR0UpIHJldHVybiB2YWx1ZTtcblxuICBsZXQgcmVzb2x2ZWRWYWx1ZTogc3RyaW5nfG51bGwgPSBudWxsO1xuICBpZiAoaXNTdHlsaW5nVmFsdWVEZWZpbmVkKHZhbHVlKSkge1xuICAgIGlmIChzdWZmaXgpIHtcbiAgICAgIC8vIHdoZW4gYSBzdWZmaXggaXMgYXBwbGllZCB0aGVuIGl0IHdpbGwgYnlwYXNzXG4gICAgICAvLyBzYW5pdGl6YXRpb24gZW50aXJlbHkgKGIvYyBhIG5ldyBzdHJpbmcgaXMgY3JlYXRlZClcbiAgICAgIHJlc29sdmVkVmFsdWUgPSByZW5kZXJTdHJpbmdpZnkodmFsdWUpICsgc3VmZml4O1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBzYW5pdGl6YXRpb24gaGFwcGVucyBieSBkZWFsaW5nIHdpdGggYSBzdHJpbmcgdmFsdWVcbiAgICAgIC8vIHRoaXMgbWVhbnMgdGhhdCB0aGUgc3RyaW5nIHZhbHVlIHdpbGwgYmUgcGFzc2VkIHRocm91Z2hcbiAgICAgIC8vIGludG8gdGhlIHN0eWxlIHJlbmRlcmluZyBsYXRlciAod2hpY2ggaXMgd2hlcmUgdGhlIHZhbHVlXG4gICAgICAvLyB3aWxsIGJlIHNhbml0aXplZCBiZWZvcmUgaXQgaXMgYXBwbGllZClcbiAgICAgIHJlc29sdmVkVmFsdWUgPSB2YWx1ZSBhcyBhbnkgYXMgc3RyaW5nO1xuICAgIH1cbiAgfVxuICByZXR1cm4gcmVzb2x2ZWRWYWx1ZTtcbn1cblxuLyoqXG4gKiBXaGV0aGVyIG9yIG5vdCB0aGUgc3R5bGUvY2xhc3MgYmluZGluZyBiZWluZyBhcHBsaWVkIHdhcyBleGVjdXRlZCB3aXRoaW4gYSBob3N0IGJpbmRpbmdzXG4gKiBmdW5jdGlvbi5cbiAqL1xuZnVuY3Rpb24gaXNIb3N0U3R5bGluZygpOiBib29sZWFuIHtcbiAgcmV0dXJuIGlzSG9zdFN0eWxpbmdBY3RpdmUoZ2V0QWN0aXZlRGlyZWN0aXZlSWQoKSk7XG59XG5cbmZ1bmN0aW9uIHBhdGNoSG9zdFN0eWxpbmdGbGFnKHROb2RlOiBUTm9kZSwgaG9zdEJpbmRpbmdzTW9kZTogYm9vbGVhbiwgaXNDbGFzc0Jhc2VkOiBib29sZWFuKSB7XG4gIGNvbnN0IGZsYWcgPSBob3N0QmluZGluZ3NNb2RlID9cbiAgICAgIGlzQ2xhc3NCYXNlZCA/IFROb2RlRmxhZ3MuaGFzSG9zdENsYXNzQmluZGluZ3MgOiBUTm9kZUZsYWdzLmhhc0hvc3RTdHlsZUJpbmRpbmdzIDpcbiAgICAgIGlzQ2xhc3NCYXNlZCA/IFROb2RlRmxhZ3MuaGFzVGVtcGxhdGVDbGFzc0JpbmRpbmdzIDogVE5vZGVGbGFncy5oYXNUZW1wbGF0ZVN0eWxlQmluZGluZ3M7XG4gIHBhdGNoQ29uZmlnKHROb2RlLCBmbGFnKTtcbn1cbiJdfQ==