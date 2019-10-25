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
}
/**
 * Internal function for applying a single style to an element.
 *
 * The reason why this function has been separated from `ɵɵstyleProp` is because
 * it is also called from `ɵɵstylePropInterpolate`.
 */
export function stylePropInternal(elementIndex, prop, value, suffix) {
    var lView = getLView();
    // if a value is interpolated then it may render a `NO_CHANGE` value.
    // in this case we do not need to do anything, but the binding index
    // still needs to be incremented because all styling binding values
    // are stored inside of the lView.
    var bindingIndex = getAndIncrementBindingIndex(lView, false);
    var updated = stylingProp(elementIndex, bindingIndex, prop, resolveStylePropValue(value, suffix), false);
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
    var lView = getLView();
    // if a value is interpolated then it may render a `NO_CHANGE` value.
    // in this case we do not need to do anything, but the binding index
    // still needs to be incremented because all styling binding values
    // are stored inside of the lView.
    var bindingIndex = getAndIncrementBindingIndex(lView, false);
    var updated = stylingProp(getSelectedIndex(), bindingIndex, className, value, true);
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
 */
function stylingProp(elementIndex, bindingIndex, prop, value, isClassBased) {
    var updated = false;
    var lView = getLView();
    var tNode = getTNode(elementIndex, lView);
    var native = getNativeByTNode(tNode, lView);
    var hostBindingsMode = isHostStyling();
    var context = isClassBased ? getClassesContext(tNode) : getStylesContext(tNode);
    var sanitizer = isClassBased ? null : getCurrentStyleSanitizer();
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
        var oldValue = getValue(lView, bindingIndex);
        if (hasValueChanged(oldValue, value)) {
            throwErrorIfNoChangesMode(false, oldValue, value);
        }
    }
    // Direct Apply Case: bypass context resolution and apply the
    // style/class value directly to the element
    if (allowDirectStyling(context, hostBindingsMode)) {
        var sanitizerToUse = isClassBased ? null : sanitizer;
        var renderer = getRenderer(tNode, lView);
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
        var directiveIndex = getActiveDirectiveId();
        if (isClassBased) {
            updated = updateClassViaContext(context, lView, native, directiveIndex, prop, bindingIndex, value);
        }
        else {
            updated = updateStyleViaContext(context, lView, native, directiveIndex, prop, bindingIndex, value, sanitizer);
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
    var context = getStylesContext(tNode);
    var hasDirectiveInput = hasStyleInput(tNode);
    // if a value is interpolated then it may render a `NO_CHANGE` value.
    // in this case we do not need to do anything, but the binding index
    // still needs to be incremented because all styling binding values
    // are stored inside of the lView.
    var bindingIndex = getAndIncrementBindingIndex(lView, true);
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
    var context = getClassesContext(tNode);
    var hasDirectiveInput = hasClassInput(tNode);
    // if a value is interpolated then it may render a `NO_CHANGE` value.
    // in this case we do not need to do anything, but the binding index
    // still needs to be incremented because all styling binding values
    // are stored inside of the lView.
    var bindingIndex = getAndIncrementBindingIndex(lView, true);
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
 */
function stylingMap(context, tNode, lView, bindingIndex, value, isClassBased, hasDirectiveInput) {
    var directiveIndex = getActiveDirectiveId();
    var native = getNativeByTNode(tNode, lView);
    var oldValue = getValue(lView, bindingIndex);
    var hostBindingsMode = isHostStyling();
    var sanitizer = getCurrentStyleSanitizer();
    var valueHasChanged = hasValueChanged(oldValue, value);
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
        var sanitizerToUse = isClassBased ? null : sanitizer;
        var renderer = getRenderer(tNode, lView);
        applyStylingMapDirectly(renderer, context, native, lView, bindingIndex, value, isClassBased, sanitizerToUse, valueHasChanged, hasDirectiveInput);
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
 * If a directive has a `@Input` binding that is set on `style` or `class` then that value
 * will take priority over the underlying style/class styling bindings. This value will
 * be updated for the binding each time during change detection.
 *
 * When this occurs this function will attempt to write the value to the input binding
 * depending on the following situations:
 *
 * - If `oldValue !== newValue`
 * - If `newValue` is `null` (but this is skipped if it is during the first update pass--
 *    which is when the context is not locked yet)
 */
function updateDirectiveInputValue(context, lView, tNode, bindingIndex, newValue, isClassBased) {
    var oldValue = lView[bindingIndex];
    if (oldValue !== newValue) {
        // even if the value has changed we may not want to emit it to the
        // directive input(s) in the event that it is falsy during the
        // first update pass.
        if (newValue || isContextLocked(context, false)) {
            var inputName = isClassBased ? selectClassBasedInputName(tNode.inputs) : 'style';
            var inputs = tNode.inputs[inputName];
            var initialValue = getInitialStylingValue(context);
            var value = normalizeStylingDirectiveInputValue(initialValue, newValue, isClassBased);
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
    var elementIndex = getSelectedIndex();
    var tNode = getTNode(elementIndex, lView);
    var native = getNativeByTNode(tNode, lView);
    var directiveIndex = getActiveDirectiveId();
    var renderer = getRenderer(tNode, lView);
    var sanitizer = getCurrentStyleSanitizer();
    var classesContext = isStylingContext(tNode.classes) ? tNode.classes : null;
    var stylesContext = isStylingContext(tNode.styles) ? tNode.styles : null;
    flushStyling(renderer, lView, classesContext, stylesContext, native, directiveIndex, sanitizer);
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
        tNode.flags |= 64 /* hasInitialStyling */;
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
            attachStylingDebugObject(context, isClassBased);
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
function getAndIncrementBindingIndex(lView, isMapBased) {
    // map-based bindings use two slots because the previously constructed
    // className / style value must be compared against.
    var index = lView[BINDING_INDEX];
    lView[BINDING_INDEX] += isMapBased ? 2 : 1;
    return index;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3R5bGluZy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvaW5zdHJ1Y3Rpb25zL3N0eWxpbmcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBU0EsT0FBTyxFQUFDLHlCQUF5QixFQUFDLE1BQU0sV0FBVyxDQUFDO0FBQ3BELE9BQU8sRUFBQyxvQkFBb0IsRUFBQyxNQUFNLHdCQUF3QixDQUFDO0FBSTVELE9BQU8sRUFBQyxlQUFlLEVBQUMsTUFBTSwyQkFBMkIsQ0FBQztBQUMxRCxPQUFPLEVBQUMsYUFBYSxFQUFTLFFBQVEsRUFBQyxNQUFNLG9CQUFvQixDQUFDO0FBQ2xFLE9BQU8sRUFBQyxvQkFBb0IsRUFBRSxxQkFBcUIsRUFBRSx3QkFBd0IsRUFBRSxRQUFRLEVBQUUsZ0JBQWdCLEVBQUUsMEJBQTBCLEVBQUUsd0JBQXdCLEVBQUUsZ0JBQWdCLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFDbk0sT0FBTyxFQUFDLHVCQUF1QixFQUFFLHlCQUF5QixFQUFFLFlBQVksRUFBc0IscUJBQXFCLEVBQUUscUJBQXFCLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUN2SyxPQUFPLEVBQUMseUJBQXlCLEVBQUMsTUFBTSwrQkFBK0IsQ0FBQztBQUN4RSxPQUFPLEVBQUMsd0JBQXdCLEVBQUMsTUFBTSwwQkFBMEIsQ0FBQztBQUNsRSxPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sV0FBVyxDQUFDO0FBQ3BDLE9BQU8sRUFBQyxlQUFlLEVBQUMsTUFBTSxvQkFBb0IsQ0FBQztBQUNuRCxPQUFPLEVBQUMsbUJBQW1CLEVBQUUsb0JBQW9CLEVBQUUsb0JBQW9CLEVBQUUsa0JBQWtCLEVBQUUsWUFBWSxFQUFFLG9CQUFvQixFQUFFLG1CQUFtQixFQUFFLHNCQUFzQixFQUFFLGtCQUFrQixFQUFFLFFBQVEsRUFBRSxhQUFhLEVBQUUsYUFBYSxFQUFFLGVBQWUs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SUFDRCxPQUFPLGFBQWEsQ0FBQztBQUN2QixDQUFDO0FBRUQ7OztHQUdHO0FBQ0gsU0FBUyxhQUFhO0lBQ3BCLE9BQU8sbUJBQW1CLENBQUMsb0JBQW9CLEVBQUUsQ0FBQyxDQUFDO0FBQ3JELENBQUM7QUFFRCxTQUFTLDJCQUEyQixDQUFDLEtBQVksRUFBRSxVQUFtQjtJQUNwRSxzRUFBc0U7SUFDdEUsb0RBQW9EO0lBQ3BELElBQU0sS0FBSyxHQUFHLEtBQUssQ0FBQyxhQUFhLENBQUMsQ0FBQztJQUNuQyxLQUFLLENBQUMsYUFBYSxDQUFDLElBQUksVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUMzQyxPQUFPLEtBQUssQ0FBQztBQUNmLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiogQGxpY2Vuc2VcbiogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4qXG4qIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4qIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiovXG5pbXBvcnQge1NhZmVWYWx1ZX0gZnJvbSAnLi4vLi4vc2FuaXRpemF0aW9uL2J5cGFzcyc7XG5pbXBvcnQge1N0eWxlU2FuaXRpemVGbn0gZnJvbSAnLi4vLi4vc2FuaXRpemF0aW9uL3N0eWxlX3Nhbml0aXplcic7XG5pbXBvcnQge3Rocm93RXJyb3JJZk5vQ2hhbmdlc01vZGV9IGZyb20gJy4uL2Vycm9ycyc7XG5pbXBvcnQge3NldElucHV0c0ZvclByb3BlcnR5fSBmcm9tICcuLi9pbnN0cnVjdGlvbnMvc2hhcmVkJztcbmltcG9ydCB7QXR0cmlidXRlTWFya2VyLCBUQXR0cmlidXRlcywgVE5vZGUsIFROb2RlRmxhZ3MsIFROb2RlVHlwZX0gZnJvbSAnLi4vaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB7UkVsZW1lbnR9IGZyb20gJy4uL2ludGVyZmFjZXMvcmVuZGVyZXInO1xuaW1wb3J0IHtTdHlsaW5nTWFwQXJyYXksIFN0eWxpbmdNYXBBcnJheUluZGV4LCBUU3R5bGluZ0NvbmZpZywgVFN0eWxpbmdDb250ZXh0fSBmcm9tICcuLi9pbnRlcmZhY2VzL3N0eWxpbmcnO1xuaW1wb3J0IHtpc0RpcmVjdGl2ZUhvc3R9IGZyb20gJy4uL2ludGVyZmFjZXMvdHlwZV9jaGVja3MnO1xuaW1wb3J0IHtCSU5ESU5HX0lOREVYLCBMVmlldywgUkVOREVSRVJ9IGZyb20gJy4uL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge2dldEFjdGl2ZURpcmVjdGl2ZUlkLCBnZXRDaGVja05vQ2hhbmdlc01vZGUsIGdldEN1cnJlbnRTdHlsZVNhbml0aXplciwgZ2V0TFZpZXcsIGdldFNlbGVjdGVkSW5kZXgsIHJlc2V0Q3VycmVudFN0eWxlU2FuaXRpemVyLCBzZXRDdXJyZW50U3R5bGVTYW5pdGl6ZXIsIHNldEVsZW1lbnRFeGl0Rm59IGZyb20gJy4uL3N0YXRlJztcbmltcG9ydCB7YXBwbHlTdHlsaW5nTWFwRGlyZWN0bHksIGFwcGx5U3R5bGluZ1ZhbHVlRGlyZWN0bHksIGZsdXNoU3R5bGluZywgc2V0Q2xhc3MsIHNldFN0eWxlLCB1cGRhdGVDbGFzc1ZpYUNvbnRleHQsIHVwZGF0ZVN0eWxlVmlhQ29udGV4dH0gZnJvbSAnLi4vc3R5bGluZy9iaW5kaW5ncyc7XG5pbXBvcnQge2FjdGl2YXRlU3R5bGluZ01hcEZlYXR1cmV9IGZyb20gJy4uL3N0eWxpbmcvbWFwX2Jhc2VkX2JpbmRpbmdzJztcbmltcG9ydCB7YXR0YWNoU3R5bGluZ0RlYnVnT2JqZWN0fSBmcm9tICcuLi9zdHlsaW5nL3N0eWxpbmdfZGVidWcnO1xuaW1wb3J0IHtOT19DSEFOR0V9IGZyb20gJy4uL3Rva2Vucyc7XG5pbXBvcnQge3JlbmRlclN0cmluZ2lmeX0gZnJvbSAnLi4vdXRpbC9taXNjX3V0aWxzJztcbmltcG9ydCB7YWRkSXRlbVRvU3R5bGluZ01hcCwgYWxsb2NTdHlsaW5nTWFwQXJyYXksIGFsbG9jVFN0eWxpbmdDb250ZXh0LCBhbGxvd0RpcmVjdFN0eWxpbmcsIGNvbmNhdFN0cmluZywgZm9yY2VDbGFzc2VzQXNTdHJpbmcsIGZvcmNlU3R5bGVzQXNTdHJpbmcsIGdldEluaXRpYWxTdHlsaW5nVmFsdWUsIGdldFN0eWxpbmdNYXBBcnJheSwgZ2V0VmFsdWUsIGhhc0NsYXNzSW5wdXQsIGhhc1N0eWxlSW5wdXQsIGhhc1ZhbHVlQ2hhbmdlZCwgaXNDb250ZXh0TG9ja2VkLCBpc0hvc3RTdHlsaW5nQWN0aXZlLCBpc1N0eWxpbmdDb250ZXh0LCBub3JtYWxpemVJbnRvU3R5bGluZ01hcCwgcGF0Y2hDb25maWcsIHNlbGVjdENsYXNzQmFzZWRJbnB1dE5hbWUsIHNldFZhbHVlLCBzdHlsaW5nTWFwVG9TdHJpbmd9IGZyb20gJy4uL3V0aWwvc3R5bGluZ191dGlscyc7XG5pbXBvcnQge2dldE5hdGl2ZUJ5VE5vZGUsIGdldFROb2RlfSBmcm9tICcuLi91dGlsL3ZpZXdfdXRpbHMnO1xuXG5cblxuLyoqXG4gKiAtLS0tLS0tLVxuICpcbiAqIFRoaXMgZmlsZSBjb250YWlucyB0aGUgY29yZSBsb2dpYyBmb3IgaG93IHN0eWxpbmcgaW5zdHJ1Y3Rpb25zIGFyZSBwcm9jZXNzZWQgaW4gQW5ndWxhci5cbiAqXG4gKiBUbyBsZWFybiBtb3JlIGFib3V0IHRoZSBhbGdvcml0aG0gc2VlIGBUU3R5bGluZ0NvbnRleHRgLlxuICpcbiAqIC0tLS0tLS0tXG4gKi9cblxuLyoqXG4gKiBTZXRzIHRoZSBjdXJyZW50IHN0eWxlIHNhbml0aXplciBmdW5jdGlvbiB3aGljaCB3aWxsIHRoZW4gYmUgdXNlZFxuICogd2l0aGluIGFsbCBmb2xsb3ctdXAgcHJvcCBhbmQgbWFwLWJhc2VkIHN0eWxlIGJpbmRpbmcgaW5zdHJ1Y3Rpb25zXG4gKiBmb3IgdGhlIGdpdmVuIGVsZW1lbnQuXG4gKlxuICogTm90ZSB0aGF0IG9uY2Ugc3R5bGluZyBoYXMgYmVlbiBhcHBsaWVkIHRvIHRoZSBlbGVtZW50IChpLmUuIG9uY2VcbiAqIGBhZHZhbmNlKG4pYCBpcyBleGVjdXRlZCBvciB0aGUgaG9zdEJpbmRpbmdzL3RlbXBsYXRlIGZ1bmN0aW9uIGV4aXRzKVxuICogdGhlbiB0aGUgYWN0aXZlIGBzYW5pdGl6ZXJGbmAgd2lsbCBiZSBzZXQgdG8gYG51bGxgLiBUaGlzIG1lYW5zIHRoYXRcbiAqIG9uY2Ugc3R5bGluZyBpcyBhcHBsaWVkIHRvIGFub3RoZXIgZWxlbWVudCB0aGVuIGEgYW5vdGhlciBjYWxsIHRvXG4gKiBgc3R5bGVTYW5pdGl6ZXJgIHdpbGwgbmVlZCB0byBiZSBtYWRlLlxuICpcbiAqIEBwYXJhbSBzYW5pdGl6ZXJGbiBUaGUgc2FuaXRpemF0aW9uIGZ1bmN0aW9uIHRoYXQgd2lsbCBiZSB1c2VkIHRvXG4gKiAgICAgICBwcm9jZXNzIHN0eWxlIHByb3AvdmFsdWUgZW50cmllcy5cbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtXN0eWxlU2FuaXRpemVyKHNhbml0aXplcjogU3R5bGVTYW5pdGl6ZUZuIHwgbnVsbCk6IHZvaWQge1xuICBzZXRDdXJyZW50U3R5bGVTYW5pdGl6ZXIoc2FuaXRpemVyKTtcbn1cblxuLyoqXG4gKiBVcGRhdGUgYSBzdHlsZSBiaW5kaW5nIG9uIGFuIGVsZW1lbnQgd2l0aCB0aGUgcHJvdmlkZWQgdmFsdWUuXG4gKlxuICogSWYgdGhlIHN0eWxlIHZhbHVlIGlzIGZhbHN5IHRoZW4gaXQgd2lsbCBiZSByZW1vdmVkIGZyb20gdGhlIGVsZW1lbnRcbiAqIChvciBhc3NpZ25lZCBhIGRpZmZlcmVudCB2YWx1ZSBkZXBlbmRpbmcgaWYgdGhlcmUgYXJlIGFueSBzdHlsZXMgcGxhY2VkXG4gKiBvbiB0aGUgZWxlbWVudCB3aXRoIGBzdHlsZU1hcGAgb3IgYW55IHN0YXRpYyBzdHlsZXMgdGhhdCBhcmVcbiAqIHByZXNlbnQgZnJvbSB3aGVuIHRoZSBlbGVtZW50IHdhcyBjcmVhdGVkIHdpdGggYHN0eWxpbmdgKS5cbiAqXG4gKiBOb3RlIHRoYXQgdGhlIHN0eWxpbmcgZWxlbWVudCBpcyB1cGRhdGVkIGFzIHBhcnQgb2YgYHN0eWxpbmdBcHBseWAuXG4gKlxuICogQHBhcmFtIHByb3AgQSB2YWxpZCBDU1MgcHJvcGVydHkuXG4gKiBAcGFyYW0gdmFsdWUgTmV3IHZhbHVlIHRvIHdyaXRlIChgbnVsbGAgb3IgYW4gZW1wdHkgc3RyaW5nIHRvIHJlbW92ZSkuXG4gKiBAcGFyYW0gc3VmZml4IE9wdGlvbmFsIHN1ZmZpeC4gVXNlZCB3aXRoIHNjYWxhciB2YWx1ZXMgdG8gYWRkIHVuaXQgc3VjaCBhcyBgcHhgLlxuICogICAgICAgIE5vdGUgdGhhdCB3aGVuIGEgc3VmZml4IGlzIHByb3ZpZGVkIHRoZW4gdGhlIHVuZGVybHlpbmcgc2FuaXRpemVyIHdpbGxcbiAqICAgICAgICBiZSBpZ25vcmVkLlxuICpcbiAqIE5vdGUgdGhhdCB0aGlzIHdpbGwgYXBwbHkgdGhlIHByb3ZpZGVkIHN0eWxlIHZhbHVlIHRvIHRoZSBob3N0IGVsZW1lbnQgaWYgdGhpcyBmdW5jdGlvbiBpcyBjYWxsZWRcbiAqIHdpdGhpbiBhIGhvc3QgYmluZGluZyBmdW5jdGlvbi5cbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtXN0eWxlUHJvcChcbiAgICBwcm9wOiBzdHJpbmcsIHZhbHVlOiBzdHJpbmcgfCBudW1iZXIgfCBTYWZlVmFsdWUgfCBudWxsLCBzdWZmaXg/OiBzdHJpbmcgfCBudWxsKTogdm9pZCB7XG4gIHN0eWxlUHJvcEludGVybmFsKGdldFNlbGVjdGVkSW5kZXgoKSwgcHJvcCwgdmFsdWUsIHN1ZmZpeCk7XG59XG5cbi8qKlxuICogSW50ZXJuYWwgZnVuY3Rpb24gZm9yIGFwcGx5aW5nIGEgc2luZ2xlIHN0eWxlIHRvIGFuIGVsZW1lbnQuXG4gKlxuICogVGhlIHJlYXNvbiB3aHkgdGhpcyBmdW5jdGlvbiBoYXMgYmVlbiBzZXBhcmF0ZWQgZnJvbSBgybXJtXN0eWxlUHJvcGAgaXMgYmVjYXVzZVxuICogaXQgaXMgYWxzbyBjYWxsZWQgZnJvbSBgybXJtXN0eWxlUHJvcEludGVycG9sYXRlYC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHN0eWxlUHJvcEludGVybmFsKFxuICAgIGVsZW1lbnRJbmRleDogbnVtYmVyLCBwcm9wOiBzdHJpbmcsIHZhbHVlOiBzdHJpbmcgfCBudW1iZXIgfCBTYWZlVmFsdWUgfCBudWxsLFxuICAgIHN1ZmZpeD86IHN0cmluZyB8IG51bGwgfCB1bmRlZmluZWQpOiB2b2lkIHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuXG4gIC8vIGlmIGEgdmFsdWUgaXMgaW50ZXJwb2xhdGVkIHRoZW4gaXQgbWF5IHJlbmRlciBhIGBOT19DSEFOR0VgIHZhbHVlLlxuICAvLyBpbiB0aGlzIGNhc2Ugd2UgZG8gbm90IG5lZWQgdG8gZG8gYW55dGhpbmcsIGJ1dCB0aGUgYmluZGluZyBpbmRleFxuICAvLyBzdGlsbCBuZWVkcyB0byBiZSBpbmNyZW1lbnRlZCBiZWNhdXNlIGFsbCBzdHlsaW5nIGJpbmRpbmcgdmFsdWVzXG4gIC8vIGFyZSBzdG9yZWQgaW5zaWRlIG9mIHRoZSBsVmlldy5cbiAgY29uc3QgYmluZGluZ0luZGV4ID0gZ2V0QW5kSW5jcmVtZW50QmluZGluZ0luZGV4KGxWaWV3LCBmYWxzZSk7XG5cbiAgY29uc3QgdXBkYXRlZCA9XG4gICAgICBzdHlsaW5nUHJvcChlbGVtZW50SW5kZXgsIGJpbmRpbmdJbmRleCwgcHJvcCwgcmVzb2x2ZVN0eWxlUHJvcFZhbHVlKHZhbHVlLCBzdWZmaXgpLCBmYWxzZSk7XG4gIGlmIChuZ0Rldk1vZGUpIHtcbiAgICBuZ0Rldk1vZGUuc3R5bGVQcm9wKys7XG4gICAgaWYgKHVwZGF0ZWQpIHtcbiAgICAgIG5nRGV2TW9kZS5zdHlsZVByb3BDYWNoZU1pc3MrKztcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBVcGRhdGUgYSBjbGFzcyBiaW5kaW5nIG9uIGFuIGVsZW1lbnQgd2l0aCB0aGUgcHJvdmlkZWQgdmFsdWUuXG4gKlxuICogVGhpcyBpbnN0cnVjdGlvbiBpcyBtZWFudCB0byBoYW5kbGUgdGhlIGBbY2xhc3MuZm9vXT1cImV4cFwiYCBjYXNlIGFuZCxcbiAqIHRoZXJlZm9yZSwgdGhlIGNsYXNzIGJpbmRpbmcgaXRzZWxmIG11c3QgYWxyZWFkeSBiZSBhbGxvY2F0ZWQgdXNpbmdcbiAqIGBzdHlsaW5nYCB3aXRoaW4gdGhlIGNyZWF0aW9uIGJsb2NrLlxuICpcbiAqIEBwYXJhbSBwcm9wIEEgdmFsaWQgQ1NTIGNsYXNzIChvbmx5IG9uZSkuXG4gKiBAcGFyYW0gdmFsdWUgQSB0cnVlL2ZhbHNlIHZhbHVlIHdoaWNoIHdpbGwgdHVybiB0aGUgY2xhc3Mgb24gb3Igb2ZmLlxuICpcbiAqIE5vdGUgdGhhdCB0aGlzIHdpbGwgYXBwbHkgdGhlIHByb3ZpZGVkIGNsYXNzIHZhbHVlIHRvIHRoZSBob3N0IGVsZW1lbnQgaWYgdGhpcyBmdW5jdGlvblxuICogaXMgY2FsbGVkIHdpdGhpbiBhIGhvc3QgYmluZGluZyBmdW5jdGlvbi5cbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWNsYXNzUHJvcChjbGFzc05hbWU6IHN0cmluZywgdmFsdWU6IGJvb2xlYW4gfCBudWxsKTogdm9pZCB7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcblxuICAvLyBpZiBhIHZhbHVlIGlzIGludGVycG9sYXRlZCB0aGVuIGl0IG1heSByZW5kZXIgYSBgTk9fQ0hBTkdFYCB2YWx1ZS5cbiAgLy8gaW4gdGhpcyBjYXNlIHdlIGRvIG5vdCBuZWVkIHRvIGRvIGFueXRoaW5nLCBidXQgdGhlIGJpbmRpbmcgaW5kZXhcbiAgLy8gc3RpbGwgbmVlZHMgdG8gYmUgaW5jcmVtZW50ZWQgYmVjYXVzZSBhbGwgc3R5bGluZyBiaW5kaW5nIHZhbHVlc1xuICAvLyBhcmUgc3RvcmVkIGluc2lkZSBvZiB0aGUgbFZpZXcuXG4gIGNvbnN0IGJpbmRpbmdJbmRleCA9IGdldEFuZEluY3JlbWVudEJpbmRpbmdJbmRleChsVmlldywgZmFsc2UpO1xuXG4gIGNvbnN0IHVwZGF0ZWQgPSBzdHlsaW5nUHJvcChnZXRTZWxlY3RlZEluZGV4KCksIGJpbmRpbmdJbmRleCwgY2xhc3NOYW1lLCB2YWx1ZSwgdHJ1ZSk7XG4gIGlmIChuZ0Rldk1vZGUpIHtcbiAgICBuZ0Rldk1vZGUuY2xhc3NQcm9wKys7XG4gICAgaWYgKHVwZGF0ZWQpIHtcbiAgICAgIG5nRGV2TW9kZS5jbGFzc1Byb3BDYWNoZU1pc3MrKztcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBTaGFyZWQgZnVuY3Rpb24gdXNlZCB0byB1cGRhdGUgYSBwcm9wLWJhc2VkIHN0eWxpbmcgYmluZGluZyBmb3IgYW4gZWxlbWVudC5cbiAqXG4gKiBEZXBlbmRpbmcgb24gdGhlIHN0YXRlIG9mIHRoZSBgdE5vZGUuc3R5bGVzYCBzdHlsZXMgY29udGV4dCwgdGhlIHN0eWxlL3Byb3BcbiAqIHZhbHVlIG1heSBiZSBhcHBsaWVkIGRpcmVjdGx5IHRvIHRoZSBlbGVtZW50IGluc3RlYWQgb2YgYmVpbmcgcHJvY2Vzc2VkXG4gKiB0aHJvdWdoIHRoZSBjb250ZXh0LiBUaGUgcmVhc29uIHdoeSB0aGlzIG9jY3VycyBpcyBmb3IgcGVyZm9ybWFuY2UgYW5kIGZ1bGx5XG4gKiBkZXBlbmRzIG9uIHRoZSBzdGF0ZSBvZiB0aGUgY29udGV4dCAoaS5lLiB3aGV0aGVyIG9yIG5vdCB0aGVyZSBhcmUgZHVwbGljYXRlXG4gKiBiaW5kaW5ncyBvciB3aGV0aGVyIG9yIG5vdCB0aGVyZSBhcmUgbWFwLWJhc2VkIGJpbmRpbmdzIGFuZCBwcm9wZXJ0eSBiaW5kaW5nc1xuICogcHJlc2VudCB0b2dldGhlcikuXG4gKi9cbmZ1bmN0aW9uIHN0eWxpbmdQcm9wKFxuICAgIGVsZW1lbnRJbmRleDogbnVtYmVyLCBiaW5kaW5nSW5kZXg6IG51bWJlciwgcHJvcDogc3RyaW5nLFxuICAgIHZhbHVlOiBib29sZWFuIHwgbnVtYmVyIHwgU2FmZVZhbHVlIHwgc3RyaW5nIHwgbnVsbCB8IHVuZGVmaW5lZCB8IE5PX0NIQU5HRSxcbiAgICBpc0NsYXNzQmFzZWQ6IGJvb2xlYW4pOiBib29sZWFuIHtcbiAgbGV0IHVwZGF0ZWQgPSBmYWxzZTtcblxuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IHROb2RlID0gZ2V0VE5vZGUoZWxlbWVudEluZGV4LCBsVmlldyk7XG4gIGNvbnN0IG5hdGl2ZSA9IGdldE5hdGl2ZUJ5VE5vZGUodE5vZGUsIGxWaWV3KSBhcyBSRWxlbWVudDtcblxuICBjb25zdCBob3N0QmluZGluZ3NNb2RlID0gaXNIb3N0U3R5bGluZygpO1xuICBjb25zdCBjb250ZXh0ID0gaXNDbGFzc0Jhc2VkID8gZ2V0Q2xhc3Nlc0NvbnRleHQodE5vZGUpIDogZ2V0U3R5bGVzQ29udGV4dCh0Tm9kZSk7XG4gIGNvbnN0IHNhbml0aXplciA9IGlzQ2xhc3NCYXNlZCA/IG51bGwgOiBnZXRDdXJyZW50U3R5bGVTYW5pdGl6ZXIoKTtcblxuICAvLyB3ZSBjaGVjayBmb3IgdGhpcyBpbiB0aGUgaW5zdHJ1Y3Rpb24gY29kZSBzbyB0aGF0IHRoZSBjb250ZXh0IGNhbiBiZSBub3RpZmllZFxuICAvLyBhYm91dCBwcm9wIG9yIG1hcCBiaW5kaW5ncyBzbyB0aGF0IHRoZSBkaXJlY3QgYXBwbHkgY2hlY2sgY2FuIGRlY2lkZSBlYXJsaWVyXG4gIC8vIGlmIGl0IGFsbG93cyBmb3IgY29udGV4dCByZXNvbHV0aW9uIHRvIGJlIGJ5cGFzc2VkLlxuICBpZiAoIWlzQ29udGV4dExvY2tlZChjb250ZXh0LCBob3N0QmluZGluZ3NNb2RlKSkge1xuICAgIHBhdGNoQ29uZmlnKGNvbnRleHQsIFRTdHlsaW5nQ29uZmlnLkhhc1Byb3BCaW5kaW5ncyk7XG4gIH1cblxuICAvLyBbc3R5bGUucHJvcF0gYW5kIFtjbGFzcy5uYW1lXSBiaW5kaW5ncyBkbyBub3QgdXNlIGBiaW5kKClgIGFuZCB3aWxsXG4gIC8vIHRoZXJlZm9yZSBtYW5hZ2UgYWNjZXNzaW5nIGFuZCB1cGRhdGluZyB0aGUgbmV3IHZhbHVlIGluIHRoZSBsVmlldyBkaXJlY3RseS5cbiAgLy8gRm9yIHRoaXMgcmVhc29uLCB0aGUgY2hlY2tOb0NoYW5nZXMgc2l0dWF0aW9uIG11c3QgYWxzbyBiZSBoYW5kbGVkIGhlcmVcbiAgLy8gYXMgd2VsbC5cbiAgaWYgKG5nRGV2TW9kZSAmJiBnZXRDaGVja05vQ2hhbmdlc01vZGUoKSkge1xuICAgIGNvbnN0IG9sZFZhbHVlID0gZ2V0VmFsdWUobFZpZXcsIGJpbmRpbmdJbmRleCk7XG4gICAgaWYgKGhhc1ZhbHVlQ2hhbmdlZChvbGRWYWx1ZSwgdmFsdWUpKSB7XG4gICAgICB0aHJvd0Vycm9ySWZOb0NoYW5nZXNNb2RlKGZhbHNlLCBvbGRWYWx1ZSwgdmFsdWUpO1xuICAgIH1cbiAgfVxuXG4gIC8vIERpcmVjdCBBcHBseSBDYXNlOiBieXBhc3MgY29udGV4dCByZXNvbHV0aW9uIGFuZCBhcHBseSB0aGVcbiAgLy8gc3R5bGUvY2xhc3MgdmFsdWUgZGlyZWN0bHkgdG8gdGhlIGVsZW1lbnRcbiAgaWYgKGFsbG93RGlyZWN0U3R5bGluZyhjb250ZXh0LCBob3N0QmluZGluZ3NNb2RlKSkge1xuICAgIGNvbnN0IHNhbml0aXplclRvVXNlID0gaXNDbGFzc0Jhc2VkID8gbnVsbCA6IHNhbml0aXplcjtcbiAgICBjb25zdCByZW5kZXJlciA9IGdldFJlbmRlcmVyKHROb2RlLCBsVmlldyk7XG4gICAgdXBkYXRlZCA9IGFwcGx5U3R5bGluZ1ZhbHVlRGlyZWN0bHkoXG4gICAgICAgIHJlbmRlcmVyLCBjb250ZXh0LCBuYXRpdmUsIGxWaWV3LCBiaW5kaW5nSW5kZXgsIHByb3AsIHZhbHVlLCBpc0NsYXNzQmFzZWQsIHNhbml0aXplclRvVXNlKTtcblxuICAgIGlmIChzYW5pdGl6ZXJUb1VzZSkge1xuICAgICAgLy8gaXQncyBpbXBvcnRhbnQgd2UgcmVtb3ZlIHRoZSBjdXJyZW50IHN0eWxlIHNhbml0aXplciBvbmNlIHRoZVxuICAgICAgLy8gZWxlbWVudCBleGl0cywgb3RoZXJ3aXNlIGl0IHdpbGwgYmUgdXNlZCBieSB0aGUgbmV4dCBzdHlsaW5nXG4gICAgICAvLyBpbnN0cnVjdGlvbnMgZm9yIHRoZSBuZXh0IGVsZW1lbnQuXG4gICAgICBzZXRFbGVtZW50RXhpdEZuKHN0eWxpbmdBcHBseSk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIC8vIENvbnRleHQgUmVzb2x1dGlvbiAob3IgZmlyc3QgdXBkYXRlKSBDYXNlOiBzYXZlIHRoZSB2YWx1ZVxuICAgIC8vIGFuZCBkZWZlciB0byB0aGUgY29udGV4dCB0byBmbHVzaCBhbmQgYXBwbHkgdGhlIHN0eWxlL2NsYXNzIGJpbmRpbmdcbiAgICAvLyB2YWx1ZSB0byB0aGUgZWxlbWVudC5cbiAgICBjb25zdCBkaXJlY3RpdmVJbmRleCA9IGdldEFjdGl2ZURpcmVjdGl2ZUlkKCk7XG4gICAgaWYgKGlzQ2xhc3NCYXNlZCkge1xuICAgICAgdXBkYXRlZCA9IHVwZGF0ZUNsYXNzVmlhQ29udGV4dChcbiAgICAgICAgICBjb250ZXh0LCBsVmlldywgbmF0aXZlLCBkaXJlY3RpdmVJbmRleCwgcHJvcCwgYmluZGluZ0luZGV4LFxuICAgICAgICAgIHZhbHVlIGFzIHN0cmluZyB8IGJvb2xlYW4gfCBudWxsKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdXBkYXRlZCA9IHVwZGF0ZVN0eWxlVmlhQ29udGV4dChcbiAgICAgICAgICBjb250ZXh0LCBsVmlldywgbmF0aXZlLCBkaXJlY3RpdmVJbmRleCwgcHJvcCwgYmluZGluZ0luZGV4LFxuICAgICAgICAgIHZhbHVlIGFzIHN0cmluZyB8IFNhZmVWYWx1ZSB8IG51bGwsIHNhbml0aXplcik7XG4gICAgfVxuXG4gICAgc2V0RWxlbWVudEV4aXRGbihzdHlsaW5nQXBwbHkpO1xuICB9XG5cbiAgcmV0dXJuIHVwZGF0ZWQ7XG59XG5cbi8qKlxuICogVXBkYXRlIHN0eWxlIGJpbmRpbmdzIHVzaW5nIGFuIG9iamVjdCBsaXRlcmFsIG9uIGFuIGVsZW1lbnQuXG4gKlxuICogVGhpcyBpbnN0cnVjdGlvbiBpcyBtZWFudCB0byBhcHBseSBzdHlsaW5nIHZpYSB0aGUgYFtzdHlsZV09XCJleHBcImAgdGVtcGxhdGUgYmluZGluZ3MuXG4gKiBXaGVuIHN0eWxlcyBhcmUgYXBwbGllZCB0byB0aGUgZWxlbWVudCB0aGV5IHdpbGwgdGhlbiBiZSB1cGRhdGVkIHdpdGggcmVzcGVjdCB0b1xuICogYW55IHN0eWxlcy9jbGFzc2VzIHNldCB2aWEgYHN0eWxlUHJvcGAuIElmIGFueSBzdHlsZXMgYXJlIHNldCB0byBmYWxzeVxuICogdGhlbiB0aGV5IHdpbGwgYmUgcmVtb3ZlZCBmcm9tIHRoZSBlbGVtZW50LlxuICpcbiAqIE5vdGUgdGhhdCB0aGUgc3R5bGluZyBpbnN0cnVjdGlvbiB3aWxsIG5vdCBiZSBhcHBsaWVkIHVudGlsIGBzdHlsaW5nQXBwbHlgIGlzIGNhbGxlZC5cbiAqXG4gKiBAcGFyYW0gc3R5bGVzIEEga2V5L3ZhbHVlIHN0eWxlIG1hcCBvZiB0aGUgc3R5bGVzIHRoYXQgd2lsbCBiZSBhcHBsaWVkIHRvIHRoZSBnaXZlbiBlbGVtZW50LlxuICogICAgICAgIEFueSBtaXNzaW5nIHN0eWxlcyAodGhhdCBoYXZlIGFscmVhZHkgYmVlbiBhcHBsaWVkIHRvIHRoZSBlbGVtZW50IGJlZm9yZWhhbmQpIHdpbGwgYmVcbiAqICAgICAgICByZW1vdmVkICh1bnNldCkgZnJvbSB0aGUgZWxlbWVudCdzIHN0eWxpbmcuXG4gKlxuICogTm90ZSB0aGF0IHRoaXMgd2lsbCBhcHBseSB0aGUgcHJvdmlkZWQgc3R5bGVNYXAgdmFsdWUgdG8gdGhlIGhvc3QgZWxlbWVudCBpZiB0aGlzIGZ1bmN0aW9uXG4gKiBpcyBjYWxsZWQgd2l0aGluIGEgaG9zdCBiaW5kaW5nLlxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1c3R5bGVNYXAoc3R5bGVzOiB7W3N0eWxlTmFtZTogc3RyaW5nXTogYW55fSB8IE5PX0NIQU5HRSB8IG51bGwpOiB2b2lkIHtcbiAgY29uc3QgaW5kZXggPSBnZXRTZWxlY3RlZEluZGV4KCk7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgdE5vZGUgPSBnZXRUTm9kZShpbmRleCwgbFZpZXcpO1xuICBjb25zdCBjb250ZXh0ID0gZ2V0U3R5bGVzQ29udGV4dCh0Tm9kZSk7XG4gIGNvbnN0IGhhc0RpcmVjdGl2ZUlucHV0ID0gaGFzU3R5bGVJbnB1dCh0Tm9kZSk7XG5cbiAgLy8gaWYgYSB2YWx1ZSBpcyBpbnRlcnBvbGF0ZWQgdGhlbiBpdCBtYXkgcmVuZGVyIGEgYE5PX0NIQU5HRWAgdmFsdWUuXG4gIC8vIGluIHRoaXMgY2FzZSB3ZSBkbyBub3QgbmVlZCB0byBkbyBhbnl0aGluZywgYnV0IHRoZSBiaW5kaW5nIGluZGV4XG4gIC8vIHN0aWxsIG5lZWRzIHRvIGJlIGluY3JlbWVudGVkIGJlY2F1c2UgYWxsIHN0eWxpbmcgYmluZGluZyB2YWx1ZXNcbiAgLy8gYXJlIHN0b3JlZCBpbnNpZGUgb2YgdGhlIGxWaWV3LlxuICBjb25zdCBiaW5kaW5nSW5kZXggPSBnZXRBbmRJbmNyZW1lbnRCaW5kaW5nSW5kZXgobFZpZXcsIHRydWUpO1xuXG4gIC8vIGlucHV0cyBhcmUgb25seSBldmFsdWF0ZWQgZnJvbSBhIHRlbXBsYXRlIGJpbmRpbmcgaW50byBhIGRpcmVjdGl2ZSwgdGhlcmVmb3JlLFxuICAvLyB0aGVyZSBzaG91bGQgbm90IGJlIGEgc2l0dWF0aW9uIHdoZXJlIGEgZGlyZWN0aXZlIGhvc3QgYmluZGluZ3MgZnVuY3Rpb25cbiAgLy8gZXZhbHVhdGVzIHRoZSBpbnB1dHMgKHRoaXMgc2hvdWxkIG9ubHkgaGFwcGVuIGluIHRoZSB0ZW1wbGF0ZSBmdW5jdGlvbilcbiAgaWYgKCFpc0hvc3RTdHlsaW5nKCkgJiYgaGFzRGlyZWN0aXZlSW5wdXQgJiYgc3R5bGVzICE9PSBOT19DSEFOR0UpIHtcbiAgICB1cGRhdGVEaXJlY3RpdmVJbnB1dFZhbHVlKGNvbnRleHQsIGxWaWV3LCB0Tm9kZSwgYmluZGluZ0luZGV4LCBzdHlsZXMsIGZhbHNlKTtcbiAgICBzdHlsZXMgPSBOT19DSEFOR0U7XG4gIH1cblxuICBzdHlsaW5nTWFwKGNvbnRleHQsIHROb2RlLCBsVmlldywgYmluZGluZ0luZGV4LCBzdHlsZXMsIGZhbHNlLCBoYXNEaXJlY3RpdmVJbnB1dCk7XG59XG5cbi8qKlxuICogVXBkYXRlIGNsYXNzIGJpbmRpbmdzIHVzaW5nIGFuIG9iamVjdCBsaXRlcmFsIG9yIGNsYXNzLXN0cmluZyBvbiBhbiBlbGVtZW50LlxuICpcbiAqIFRoaXMgaW5zdHJ1Y3Rpb24gaXMgbWVhbnQgdG8gYXBwbHkgc3R5bGluZyB2aWEgdGhlIGBbY2xhc3NdPVwiZXhwXCJgIHRlbXBsYXRlIGJpbmRpbmdzLlxuICogV2hlbiBjbGFzc2VzIGFyZSBhcHBsaWVkIHRvIHRoZSBlbGVtZW50IHRoZXkgd2lsbCB0aGVuIGJlIHVwZGF0ZWQgd2l0aFxuICogcmVzcGVjdCB0byBhbnkgc3R5bGVzL2NsYXNzZXMgc2V0IHZpYSBgY2xhc3NQcm9wYC4gSWYgYW55XG4gKiBjbGFzc2VzIGFyZSBzZXQgdG8gZmFsc3kgdGhlbiB0aGV5IHdpbGwgYmUgcmVtb3ZlZCBmcm9tIHRoZSBlbGVtZW50LlxuICpcbiAqIE5vdGUgdGhhdCB0aGUgc3R5bGluZyBpbnN0cnVjdGlvbiB3aWxsIG5vdCBiZSBhcHBsaWVkIHVudGlsIGBzdHlsaW5nQXBwbHlgIGlzIGNhbGxlZC5cbiAqIE5vdGUgdGhhdCB0aGlzIHdpbGwgdGhlIHByb3ZpZGVkIGNsYXNzTWFwIHZhbHVlIHRvIHRoZSBob3N0IGVsZW1lbnQgaWYgdGhpcyBmdW5jdGlvbiBpcyBjYWxsZWRcbiAqIHdpdGhpbiBhIGhvc3QgYmluZGluZy5cbiAqXG4gKiBAcGFyYW0gY2xhc3NlcyBBIGtleS92YWx1ZSBtYXAgb3Igc3RyaW5nIG9mIENTUyBjbGFzc2VzIHRoYXQgd2lsbCBiZSBhZGRlZCB0byB0aGVcbiAqICAgICAgICBnaXZlbiBlbGVtZW50LiBBbnkgbWlzc2luZyBjbGFzc2VzICh0aGF0IGhhdmUgYWxyZWFkeSBiZWVuIGFwcGxpZWQgdG8gdGhlIGVsZW1lbnRcbiAqICAgICAgICBiZWZvcmVoYW5kKSB3aWxsIGJlIHJlbW92ZWQgKHVuc2V0KSBmcm9tIHRoZSBlbGVtZW50J3MgbGlzdCBvZiBDU1MgY2xhc3Nlcy5cbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWNsYXNzTWFwKGNsYXNzZXM6IHtbY2xhc3NOYW1lOiBzdHJpbmddOiBhbnl9IHwgTk9fQ0hBTkdFIHwgc3RyaW5nIHwgbnVsbCk6IHZvaWQge1xuICBjbGFzc01hcEludGVybmFsKGdldFNlbGVjdGVkSW5kZXgoKSwgY2xhc3Nlcyk7XG59XG5cbi8qKlxuICogSW50ZXJuYWwgZnVuY3Rpb24gZm9yIGFwcGx5aW5nIGEgY2xhc3Mgc3RyaW5nIG9yIGtleS92YWx1ZSBtYXAgb2YgY2xhc3NlcyB0byBhbiBlbGVtZW50LlxuICpcbiAqIFRoZSByZWFzb24gd2h5IHRoaXMgZnVuY3Rpb24gaGFzIGJlZW4gc2VwYXJhdGVkIGZyb20gYMm1ybVjbGFzc01hcGAgaXMgYmVjYXVzZVxuICogaXQgaXMgYWxzbyBjYWxsZWQgZnJvbSBgybXJtWNsYXNzTWFwSW50ZXJwb2xhdGVgLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY2xhc3NNYXBJbnRlcm5hbChcbiAgICBlbGVtZW50SW5kZXg6IG51bWJlciwgY2xhc3Nlczoge1tjbGFzc05hbWU6IHN0cmluZ106IGFueX0gfCBOT19DSEFOR0UgfCBzdHJpbmcgfCBudWxsKTogdm9pZCB7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgdE5vZGUgPSBnZXRUTm9kZShlbGVtZW50SW5kZXgsIGxWaWV3KTtcbiAgY29uc3QgY29udGV4dCA9IGdldENsYXNzZXNDb250ZXh0KHROb2RlKTtcbiAgY29uc3QgaGFzRGlyZWN0aXZlSW5wdXQgPSBoYXNDbGFzc0lucHV0KHROb2RlKTtcblxuICAvLyBpZiBhIHZhbHVlIGlzIGludGVycG9sYXRlZCB0aGVuIGl0IG1heSByZW5kZXIgYSBgTk9fQ0hBTkdFYCB2YWx1ZS5cbiAgLy8gaW4gdGhpcyBjYXNlIHdlIGRvIG5vdCBuZWVkIHRvIGRvIGFueXRoaW5nLCBidXQgdGhlIGJpbmRpbmcgaW5kZXhcbiAgLy8gc3RpbGwgbmVlZHMgdG8gYmUgaW5jcmVtZW50ZWQgYmVjYXVzZSBhbGwgc3R5bGluZyBiaW5kaW5nIHZhbHVlc1xuICAvLyBhcmUgc3RvcmVkIGluc2lkZSBvZiB0aGUgbFZpZXcuXG4gIGNvbnN0IGJpbmRpbmdJbmRleCA9IGdldEFuZEluY3JlbWVudEJpbmRpbmdJbmRleChsVmlldywgdHJ1ZSk7XG5cbiAgLy8gaW5wdXRzIGFyZSBvbmx5IGV2YWx1YXRlZCBmcm9tIGEgdGVtcGxhdGUgYmluZGluZyBpbnRvIGEgZGlyZWN0aXZlLCB0aGVyZWZvcmUsXG4gIC8vIHRoZXJlIHNob3VsZCBub3QgYmUgYSBzaXR1YXRpb24gd2hlcmUgYSBkaXJlY3RpdmUgaG9zdCBiaW5kaW5ncyBmdW5jdGlvblxuICAvLyBldmFsdWF0ZXMgdGhlIGlucHV0cyAodGhpcyBzaG91bGQgb25seSBoYXBwZW4gaW4gdGhlIHRlbXBsYXRlIGZ1bmN0aW9uKVxuICBpZiAoIWlzSG9zdFN0eWxpbmcoKSAmJiBoYXNEaXJlY3RpdmVJbnB1dCAmJiBjbGFzc2VzICE9PSBOT19DSEFOR0UpIHtcbiAgICB1cGRhdGVEaXJlY3RpdmVJbnB1dFZhbHVlKGNvbnRleHQsIGxWaWV3LCB0Tm9kZSwgYmluZGluZ0luZGV4LCBjbGFzc2VzLCB0cnVlKTtcbiAgICBjbGFzc2VzID0gTk9fQ0hBTkdFO1xuICB9XG5cbiAgc3R5bGluZ01hcChjb250ZXh0LCB0Tm9kZSwgbFZpZXcsIGJpbmRpbmdJbmRleCwgY2xhc3NlcywgdHJ1ZSwgaGFzRGlyZWN0aXZlSW5wdXQpO1xufVxuXG4vKipcbiAqIFNoYXJlZCBmdW5jdGlvbiB1c2VkIHRvIHVwZGF0ZSBhIG1hcC1iYXNlZCBzdHlsaW5nIGJpbmRpbmcgZm9yIGFuIGVsZW1lbnQuXG4gKlxuICogV2hlbiB0aGlzIGZ1bmN0aW9uIGlzIGNhbGxlZCBpdCB3aWxsIGFjdGl2YXRlIHN1cHBvcnQgZm9yIGBbc3R5bGVdYCBhbmRcbiAqIGBbY2xhc3NdYCBiaW5kaW5ncyBpbiBBbmd1bGFyLlxuICovXG5mdW5jdGlvbiBzdHlsaW5nTWFwKFxuICAgIGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCwgdE5vZGU6IFROb2RlLCBsVmlldzogTFZpZXcsIGJpbmRpbmdJbmRleDogbnVtYmVyLFxuICAgIHZhbHVlOiB7W2tleTogc3RyaW5nXTogYW55fSB8IHN0cmluZyB8IG51bGwsIGlzQ2xhc3NCYXNlZDogYm9vbGVhbixcbiAgICBoYXNEaXJlY3RpdmVJbnB1dDogYm9vbGVhbik6IHZvaWQge1xuICBjb25zdCBkaXJlY3RpdmVJbmRleCA9IGdldEFjdGl2ZURpcmVjdGl2ZUlkKCk7XG4gIGNvbnN0IG5hdGl2ZSA9IGdldE5hdGl2ZUJ5VE5vZGUodE5vZGUsIGxWaWV3KSBhcyBSRWxlbWVudDtcbiAgY29uc3Qgb2xkVmFsdWUgPSBnZXRWYWx1ZShsVmlldywgYmluZGluZ0luZGV4KTtcbiAgY29uc3QgaG9zdEJpbmRpbmdzTW9kZSA9IGlzSG9zdFN0eWxpbmcoKTtcbiAgY29uc3Qgc2FuaXRpemVyID0gZ2V0Q3VycmVudFN0eWxlU2FuaXRpemVyKCk7XG4gIGNvbnN0IHZhbHVlSGFzQ2hhbmdlZCA9IGhhc1ZhbHVlQ2hhbmdlZChvbGRWYWx1ZSwgdmFsdWUpO1xuXG4gIC8vIFtzdHlsZV0gYW5kIFtjbGFzc10gYmluZGluZ3MgZG8gbm90IHVzZSBgYmluZCgpYCBhbmQgd2lsbCB0aGVyZWZvcmVcbiAgLy8gbWFuYWdlIGFjY2Vzc2luZyBhbmQgdXBkYXRpbmcgdGhlIG5ldyB2YWx1ZSBpbiB0aGUgbFZpZXcgZGlyZWN0bHkuXG4gIC8vIEZvciB0aGlzIHJlYXNvbiwgdGhlIGNoZWNrTm9DaGFuZ2VzIHNpdHVhdGlvbiBtdXN0IGFsc28gYmUgaGFuZGxlZCBoZXJlXG4gIC8vIGFzIHdlbGwuXG4gIGlmIChuZ0Rldk1vZGUgJiYgdmFsdWVIYXNDaGFuZ2VkICYmIGdldENoZWNrTm9DaGFuZ2VzTW9kZSgpKSB7XG4gICAgdGhyb3dFcnJvcklmTm9DaGFuZ2VzTW9kZShmYWxzZSwgb2xkVmFsdWUsIHZhbHVlKTtcbiAgfVxuXG4gIC8vIHdlIGNoZWNrIGZvciB0aGlzIGluIHRoZSBpbnN0cnVjdGlvbiBjb2RlIHNvIHRoYXQgdGhlIGNvbnRleHQgY2FuIGJlIG5vdGlmaWVkXG4gIC8vIGFib3V0IHByb3Agb3IgbWFwIGJpbmRpbmdzIHNvIHRoYXQgdGhlIGRpcmVjdCBhcHBseSBjaGVjayBjYW4gZGVjaWRlIGVhcmxpZXJcbiAgLy8gaWYgaXQgYWxsb3dzIGZvciBjb250ZXh0IHJlc29sdXRpb24gdG8gYmUgYnlwYXNzZWQuXG4gIGlmICghaXNDb250ZXh0TG9ja2VkKGNvbnRleHQsIGhvc3RCaW5kaW5nc01vZGUpKSB7XG4gICAgcGF0Y2hDb25maWcoY29udGV4dCwgVFN0eWxpbmdDb25maWcuSGFzTWFwQmluZGluZ3MpO1xuICB9XG5cbiAgLy8gRGlyZWN0IEFwcGx5IENhc2U6IGJ5cGFzcyBjb250ZXh0IHJlc29sdXRpb24gYW5kIGFwcGx5IHRoZVxuICAvLyBzdHlsZS9jbGFzcyBtYXAgdmFsdWVzIGRpcmVjdGx5IHRvIHRoZSBlbGVtZW50XG4gIGlmIChhbGxvd0RpcmVjdFN0eWxpbmcoY29udGV4dCwgaG9zdEJpbmRpbmdzTW9kZSkpIHtcbiAgICBjb25zdCBzYW5pdGl6ZXJUb1VzZSA9IGlzQ2xhc3NCYXNlZCA/IG51bGwgOiBzYW5pdGl6ZXI7XG4gICAgY29uc3QgcmVuZGVyZXIgPSBnZXRSZW5kZXJlcih0Tm9kZSwgbFZpZXcpO1xuICAgIGFwcGx5U3R5bGluZ01hcERpcmVjdGx5KFxuICAgICAgICByZW5kZXJlciwgY29udGV4dCwgbmF0aXZlLCBsVmlldywgYmluZGluZ0luZGV4LCB2YWx1ZSwgaXNDbGFzc0Jhc2VkLCBzYW5pdGl6ZXJUb1VzZSxcbiAgICAgICAgdmFsdWVIYXNDaGFuZ2VkLCBoYXNEaXJlY3RpdmVJbnB1dCk7XG4gICAgaWYgKHNhbml0aXplclRvVXNlKSB7XG4gICAgICAvLyBpdCdzIGltcG9ydGFudCB3ZSByZW1vdmUgdGhlIGN1cnJlbnQgc3R5bGUgc2FuaXRpemVyIG9uY2UgdGhlXG4gICAgICAvLyBlbGVtZW50IGV4aXRzLCBvdGhlcndpc2UgaXQgd2lsbCBiZSB1c2VkIGJ5IHRoZSBuZXh0IHN0eWxpbmdcbiAgICAgIC8vIGluc3RydWN0aW9ucyBmb3IgdGhlIG5leHQgZWxlbWVudC5cbiAgICAgIHNldEVsZW1lbnRFeGl0Rm4oc3R5bGluZ0FwcGx5KTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgY29uc3Qgc3R5bGluZ01hcEFyciA9XG4gICAgICAgIHZhbHVlID09PSBOT19DSEFOR0UgPyBOT19DSEFOR0UgOiBub3JtYWxpemVJbnRvU3R5bGluZ01hcChvbGRWYWx1ZSwgdmFsdWUsICFpc0NsYXNzQmFzZWQpO1xuXG4gICAgYWN0aXZhdGVTdHlsaW5nTWFwRmVhdHVyZSgpO1xuXG4gICAgLy8gQ29udGV4dCBSZXNvbHV0aW9uIChvciBmaXJzdCB1cGRhdGUpIENhc2U6IHNhdmUgdGhlIG1hcCB2YWx1ZVxuICAgIC8vIGFuZCBkZWZlciB0byB0aGUgY29udGV4dCB0byBmbHVzaCBhbmQgYXBwbHkgdGhlIHN0eWxlL2NsYXNzIGJpbmRpbmdcbiAgICAvLyB2YWx1ZSB0byB0aGUgZWxlbWVudC5cbiAgICBpZiAoaXNDbGFzc0Jhc2VkKSB7XG4gICAgICB1cGRhdGVDbGFzc1ZpYUNvbnRleHQoXG4gICAgICAgICAgY29udGV4dCwgbFZpZXcsIG5hdGl2ZSwgZGlyZWN0aXZlSW5kZXgsIG51bGwsIGJpbmRpbmdJbmRleCwgc3R5bGluZ01hcEFycixcbiAgICAgICAgICB2YWx1ZUhhc0NoYW5nZWQpO1xuICAgIH0gZWxzZSB7XG4gICAgICB1cGRhdGVTdHlsZVZpYUNvbnRleHQoXG4gICAgICAgICAgY29udGV4dCwgbFZpZXcsIG5hdGl2ZSwgZGlyZWN0aXZlSW5kZXgsIG51bGwsIGJpbmRpbmdJbmRleCwgc3R5bGluZ01hcEFyciwgc2FuaXRpemVyLFxuICAgICAgICAgIHZhbHVlSGFzQ2hhbmdlZCk7XG4gICAgfVxuXG4gICAgc2V0RWxlbWVudEV4aXRGbihzdHlsaW5nQXBwbHkpO1xuICB9XG5cbiAgaWYgKG5nRGV2TW9kZSkge1xuICAgIGlzQ2xhc3NCYXNlZCA/IG5nRGV2TW9kZS5jbGFzc01hcCA6IG5nRGV2TW9kZS5zdHlsZU1hcCsrO1xuICAgIGlmICh2YWx1ZUhhc0NoYW5nZWQpIHtcbiAgICAgIGlzQ2xhc3NCYXNlZCA/IG5nRGV2TW9kZS5jbGFzc01hcENhY2hlTWlzcyA6IG5nRGV2TW9kZS5zdHlsZU1hcENhY2hlTWlzcysrO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIFdyaXRlcyBhIHZhbHVlIHRvIGEgZGlyZWN0aXZlJ3MgYHN0eWxlYCBvciBgY2xhc3NgIGlucHV0IGJpbmRpbmcgKGlmIGl0IGhhcyBjaGFuZ2VkKS5cbiAqXG4gKiBJZiBhIGRpcmVjdGl2ZSBoYXMgYSBgQElucHV0YCBiaW5kaW5nIHRoYXQgaXMgc2V0IG9uIGBzdHlsZWAgb3IgYGNsYXNzYCB0aGVuIHRoYXQgdmFsdWVcbiAqIHdpbGwgdGFrZSBwcmlvcml0eSBvdmVyIHRoZSB1bmRlcmx5aW5nIHN0eWxlL2NsYXNzIHN0eWxpbmcgYmluZGluZ3MuIFRoaXMgdmFsdWUgd2lsbFxuICogYmUgdXBkYXRlZCBmb3IgdGhlIGJpbmRpbmcgZWFjaCB0aW1lIGR1cmluZyBjaGFuZ2UgZGV0ZWN0aW9uLlxuICpcbiAqIFdoZW4gdGhpcyBvY2N1cnMgdGhpcyBmdW5jdGlvbiB3aWxsIGF0dGVtcHQgdG8gd3JpdGUgdGhlIHZhbHVlIHRvIHRoZSBpbnB1dCBiaW5kaW5nXG4gKiBkZXBlbmRpbmcgb24gdGhlIGZvbGxvd2luZyBzaXR1YXRpb25zOlxuICpcbiAqIC0gSWYgYG9sZFZhbHVlICE9PSBuZXdWYWx1ZWBcbiAqIC0gSWYgYG5ld1ZhbHVlYCBpcyBgbnVsbGAgKGJ1dCB0aGlzIGlzIHNraXBwZWQgaWYgaXQgaXMgZHVyaW5nIHRoZSBmaXJzdCB1cGRhdGUgcGFzcy0tXG4gKiAgICB3aGljaCBpcyB3aGVuIHRoZSBjb250ZXh0IGlzIG5vdCBsb2NrZWQgeWV0KVxuICovXG5mdW5jdGlvbiB1cGRhdGVEaXJlY3RpdmVJbnB1dFZhbHVlKFxuICAgIGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCwgbFZpZXc6IExWaWV3LCB0Tm9kZTogVE5vZGUsIGJpbmRpbmdJbmRleDogbnVtYmVyLCBuZXdWYWx1ZTogYW55LFxuICAgIGlzQ2xhc3NCYXNlZDogYm9vbGVhbik6IHZvaWQge1xuICBjb25zdCBvbGRWYWx1ZSA9IGxWaWV3W2JpbmRpbmdJbmRleF07XG4gIGlmIChvbGRWYWx1ZSAhPT0gbmV3VmFsdWUpIHtcbiAgICAvLyBldmVuIGlmIHRoZSB2YWx1ZSBoYXMgY2hhbmdlZCB3ZSBtYXkgbm90IHdhbnQgdG8gZW1pdCBpdCB0byB0aGVcbiAgICAvLyBkaXJlY3RpdmUgaW5wdXQocykgaW4gdGhlIGV2ZW50IHRoYXQgaXQgaXMgZmFsc3kgZHVyaW5nIHRoZVxuICAgIC8vIGZpcnN0IHVwZGF0ZSBwYXNzLlxuICAgIGlmIChuZXdWYWx1ZSB8fCBpc0NvbnRleHRMb2NrZWQoY29udGV4dCwgZmFsc2UpKSB7XG4gICAgICBjb25zdCBpbnB1dE5hbWU6IHN0cmluZyA9IGlzQ2xhc3NCYXNlZCA/IHNlbGVjdENsYXNzQmFzZWRJbnB1dE5hbWUodE5vZGUuaW5wdXRzICEpIDogJ3N0eWxlJztcbiAgICAgIGNvbnN0IGlucHV0cyA9IHROb2RlLmlucHV0cyAhW2lucHV0TmFtZV0gITtcbiAgICAgIGNvbnN0IGluaXRpYWxWYWx1ZSA9IGdldEluaXRpYWxTdHlsaW5nVmFsdWUoY29udGV4dCk7XG4gICAgICBjb25zdCB2YWx1ZSA9IG5vcm1hbGl6ZVN0eWxpbmdEaXJlY3RpdmVJbnB1dFZhbHVlKGluaXRpYWxWYWx1ZSwgbmV3VmFsdWUsIGlzQ2xhc3NCYXNlZCk7XG4gICAgICBzZXRJbnB1dHNGb3JQcm9wZXJ0eShsVmlldywgaW5wdXRzLCB2YWx1ZSk7XG4gICAgICBzZXRFbGVtZW50RXhpdEZuKHN0eWxpbmdBcHBseSk7XG4gICAgfVxuICAgIHNldFZhbHVlKGxWaWV3LCBiaW5kaW5nSW5kZXgsIG5ld1ZhbHVlKTtcbiAgfVxufVxuXG4vKipcbiAqIFJldHVybnMgdGhlIGFwcHJvcHJpYXRlIGRpcmVjdGl2ZSBpbnB1dCB2YWx1ZSBmb3IgYHN0eWxlYCBvciBgY2xhc3NgLlxuICpcbiAqIEVhcmxpZXIgdmVyc2lvbnMgb2YgQW5ndWxhciBleHBlY3QgYSBiaW5kaW5nIHZhbHVlIHRvIGJlIHBhc3NlZCBpbnRvIGRpcmVjdGl2ZSBjb2RlXG4gKiBleGFjdGx5IGFzIGl0IGlzIHVubGVzcyB0aGVyZSBpcyBhIHN0YXRpYyB2YWx1ZSBwcmVzZW50IChpbiB3aGljaCBjYXNlIGJvdGggdmFsdWVzXG4gKiB3aWxsIGJlIHN0cmluZ2lmaWVkIGFuZCBjb25jYXRlbmF0ZWQpLlxuICovXG5mdW5jdGlvbiBub3JtYWxpemVTdHlsaW5nRGlyZWN0aXZlSW5wdXRWYWx1ZShcbiAgICBpbml0aWFsVmFsdWU6IHN0cmluZywgYmluZGluZ1ZhbHVlOiBzdHJpbmcgfCB7W2tleTogc3RyaW5nXTogYW55fSB8IG51bGwsXG4gICAgaXNDbGFzc0Jhc2VkOiBib29sZWFuKSB7XG4gIGxldCB2YWx1ZSA9IGJpbmRpbmdWYWx1ZTtcblxuICAvLyB3ZSBvbmx5IGNvbmNhdCB2YWx1ZXMgaWYgdGhlcmUgaXMgYW4gaW5pdGlhbCB2YWx1ZSwgb3RoZXJ3aXNlIHdlIHJldHVybiB0aGUgdmFsdWUgYXMgaXMuXG4gIC8vIE5vdGUgdGhhdCB0aGlzIGlzIHRvIHNhdGlzZnkgYmFja3dhcmRzLWNvbXBhdGliaWxpdHkgaW4gQW5ndWxhci5cbiAgaWYgKGluaXRpYWxWYWx1ZS5sZW5ndGgpIHtcbiAgICBpZiAoaXNDbGFzc0Jhc2VkKSB7XG4gICAgICB2YWx1ZSA9IGNvbmNhdFN0cmluZyhpbml0aWFsVmFsdWUsIGZvcmNlQ2xhc3Nlc0FzU3RyaW5nKGJpbmRpbmdWYWx1ZSkpO1xuICAgIH0gZWxzZSB7XG4gICAgICB2YWx1ZSA9IGNvbmNhdFN0cmluZyhpbml0aWFsVmFsdWUsIGZvcmNlU3R5bGVzQXNTdHJpbmcoYmluZGluZ1ZhbHVlLCB0cnVlKSwgJzsnKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHZhbHVlO1xufVxuXG4vKipcbiAqIEZsdXNoZXMgYWxsIHN0eWxpbmcgY29kZSB0byB0aGUgZWxlbWVudC5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIGlzIGRlc2lnbmVkIHRvIGJlIHNjaGVkdWxlZCBmcm9tIGFueSBvZiB0aGUgZm91ciBzdHlsaW5nIGluc3RydWN0aW9uc1xuICogaW4gdGhpcyBmaWxlLiBXaGVuIGNhbGxlZCBpdCB3aWxsIGZsdXNoIGFsbCBzdHlsZSBhbmQgY2xhc3MgYmluZGluZ3MgdG8gdGhlIGVsZW1lbnRcbiAqIHZpYSB0aGUgY29udGV4dCByZXNvbHV0aW9uIGFsZ29yaXRobS5cbiAqL1xuZnVuY3Rpb24gc3R5bGluZ0FwcGx5KCk6IHZvaWQge1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IGVsZW1lbnRJbmRleCA9IGdldFNlbGVjdGVkSW5kZXgoKTtcbiAgY29uc3QgdE5vZGUgPSBnZXRUTm9kZShlbGVtZW50SW5kZXgsIGxWaWV3KTtcbiAgY29uc3QgbmF0aXZlID0gZ2V0TmF0aXZlQnlUTm9kZSh0Tm9kZSwgbFZpZXcpIGFzIFJFbGVtZW50O1xuICBjb25zdCBkaXJlY3RpdmVJbmRleCA9IGdldEFjdGl2ZURpcmVjdGl2ZUlkKCk7XG4gIGNvbnN0IHJlbmRlcmVyID0gZ2V0UmVuZGVyZXIodE5vZGUsIGxWaWV3KTtcbiAgY29uc3Qgc2FuaXRpemVyID0gZ2V0Q3VycmVudFN0eWxlU2FuaXRpemVyKCk7XG4gIGNvbnN0IGNsYXNzZXNDb250ZXh0ID0gaXNTdHlsaW5nQ29udGV4dCh0Tm9kZS5jbGFzc2VzKSA/IHROb2RlLmNsYXNzZXMgYXMgVFN0eWxpbmdDb250ZXh0IDogbnVsbDtcbiAgY29uc3Qgc3R5bGVzQ29udGV4dCA9IGlzU3R5bGluZ0NvbnRleHQodE5vZGUuc3R5bGVzKSA/IHROb2RlLnN0eWxlcyBhcyBUU3R5bGluZ0NvbnRleHQgOiBudWxsO1xuICBmbHVzaFN0eWxpbmcocmVuZGVyZXIsIGxWaWV3LCBjbGFzc2VzQ29udGV4dCwgc3R5bGVzQ29udGV4dCwgbmF0aXZlLCBkaXJlY3RpdmVJbmRleCwgc2FuaXRpemVyKTtcbiAgcmVzZXRDdXJyZW50U3R5bGVTYW5pdGl6ZXIoKTtcbn1cblxuZnVuY3Rpb24gZ2V0UmVuZGVyZXIodE5vZGU6IFROb2RlLCBsVmlldzogTFZpZXcpIHtcbiAgcmV0dXJuIHROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5FbGVtZW50ID8gbFZpZXdbUkVOREVSRVJdIDogbnVsbDtcbn1cblxuLyoqXG4gKiBTZWFyY2hlcyBhbmQgYXNzaWducyBwcm92aWRlZCBhbGwgc3RhdGljIHN0eWxlL2NsYXNzIGVudHJpZXMgKGZvdW5kIGluIHRoZSBgYXR0cnNgIHZhbHVlKVxuICogYW5kIHJlZ2lzdGVycyB0aGVtIGluIHRoZWlyIHJlc3BlY3RpdmUgc3R5bGluZyBjb250ZXh0cy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlZ2lzdGVySW5pdGlhbFN0eWxpbmdPblROb2RlKFxuICAgIHROb2RlOiBUTm9kZSwgYXR0cnM6IFRBdHRyaWJ1dGVzLCBzdGFydEluZGV4OiBudW1iZXIpOiBib29sZWFuIHtcbiAgbGV0IGhhc0FkZGl0aW9uYWxJbml0aWFsU3R5bGluZyA9IGZhbHNlO1xuICBsZXQgc3R5bGVzID0gZ2V0U3R5bGluZ01hcEFycmF5KHROb2RlLnN0eWxlcyk7XG4gIGxldCBjbGFzc2VzID0gZ2V0U3R5bGluZ01hcEFycmF5KHROb2RlLmNsYXNzZXMpO1xuICBsZXQgbW9kZSA9IC0xO1xuICBmb3IgKGxldCBpID0gc3RhcnRJbmRleDsgaSA8IGF0dHJzLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3QgYXR0ciA9IGF0dHJzW2ldIGFzIHN0cmluZztcbiAgICBpZiAodHlwZW9mIGF0dHIgPT0gJ251bWJlcicpIHtcbiAgICAgIG1vZGUgPSBhdHRyO1xuICAgIH0gZWxzZSBpZiAobW9kZSA9PSBBdHRyaWJ1dGVNYXJrZXIuQ2xhc3Nlcykge1xuICAgICAgY2xhc3NlcyA9IGNsYXNzZXMgfHwgYWxsb2NTdHlsaW5nTWFwQXJyYXkobnVsbCk7XG4gICAgICBhZGRJdGVtVG9TdHlsaW5nTWFwKGNsYXNzZXMsIGF0dHIsIHRydWUpO1xuICAgICAgaGFzQWRkaXRpb25hbEluaXRpYWxTdHlsaW5nID0gdHJ1ZTtcbiAgICB9IGVsc2UgaWYgKG1vZGUgPT0gQXR0cmlidXRlTWFya2VyLlN0eWxlcykge1xuICAgICAgY29uc3QgdmFsdWUgPSBhdHRyc1srK2ldIGFzIHN0cmluZyB8IG51bGw7XG4gICAgICBzdHlsZXMgPSBzdHlsZXMgfHwgYWxsb2NTdHlsaW5nTWFwQXJyYXkobnVsbCk7XG4gICAgICBhZGRJdGVtVG9TdHlsaW5nTWFwKHN0eWxlcywgYXR0ciwgdmFsdWUpO1xuICAgICAgaGFzQWRkaXRpb25hbEluaXRpYWxTdHlsaW5nID0gdHJ1ZTtcbiAgICB9XG4gIH1cblxuICBpZiAoY2xhc3NlcyAmJiBjbGFzc2VzLmxlbmd0aCA+IFN0eWxpbmdNYXBBcnJheUluZGV4LlZhbHVlc1N0YXJ0UG9zaXRpb24pIHtcbiAgICBpZiAoIXROb2RlLmNsYXNzZXMpIHtcbiAgICAgIHROb2RlLmNsYXNzZXMgPSBjbGFzc2VzO1xuICAgIH1cbiAgICB1cGRhdGVSYXdWYWx1ZU9uQ29udGV4dCh0Tm9kZS5jbGFzc2VzLCBzdHlsaW5nTWFwVG9TdHJpbmcoY2xhc3NlcywgdHJ1ZSkpO1xuICB9XG5cbiAgaWYgKHN0eWxlcyAmJiBzdHlsZXMubGVuZ3RoID4gU3R5bGluZ01hcEFycmF5SW5kZXguVmFsdWVzU3RhcnRQb3NpdGlvbikge1xuICAgIGlmICghdE5vZGUuc3R5bGVzKSB7XG4gICAgICB0Tm9kZS5zdHlsZXMgPSBzdHlsZXM7XG4gICAgfVxuICAgIHVwZGF0ZVJhd1ZhbHVlT25Db250ZXh0KHROb2RlLnN0eWxlcywgc3R5bGluZ01hcFRvU3RyaW5nKHN0eWxlcywgZmFsc2UpKTtcbiAgfVxuXG4gIGlmIChoYXNBZGRpdGlvbmFsSW5pdGlhbFN0eWxpbmcpIHtcbiAgICB0Tm9kZS5mbGFncyB8PSBUTm9kZUZsYWdzLmhhc0luaXRpYWxTdHlsaW5nO1xuICB9XG5cbiAgcmV0dXJuIGhhc0FkZGl0aW9uYWxJbml0aWFsU3R5bGluZztcbn1cblxuZnVuY3Rpb24gdXBkYXRlUmF3VmFsdWVPbkNvbnRleHQoY29udGV4dDogVFN0eWxpbmdDb250ZXh0IHwgU3R5bGluZ01hcEFycmF5LCB2YWx1ZTogc3RyaW5nKSB7XG4gIGNvbnN0IHN0eWxpbmdNYXBBcnIgPSBnZXRTdHlsaW5nTWFwQXJyYXkoY29udGV4dCkgITtcbiAgc3R5bGluZ01hcEFycltTdHlsaW5nTWFwQXJyYXlJbmRleC5SYXdWYWx1ZVBvc2l0aW9uXSA9IHZhbHVlO1xufVxuXG5mdW5jdGlvbiBnZXRTdHlsZXNDb250ZXh0KHROb2RlOiBUTm9kZSk6IFRTdHlsaW5nQ29udGV4dCB7XG4gIHJldHVybiBnZXRDb250ZXh0KHROb2RlLCBmYWxzZSk7XG59XG5cbmZ1bmN0aW9uIGdldENsYXNzZXNDb250ZXh0KHROb2RlOiBUTm9kZSk6IFRTdHlsaW5nQ29udGV4dCB7XG4gIHJldHVybiBnZXRDb250ZXh0KHROb2RlLCB0cnVlKTtcbn1cblxuLyoqXG4gKiBSZXR1cm5zL2luc3RhbnRpYXRlcyBhIHN0eWxpbmcgY29udGV4dCBmcm9tL3RvIGEgYHROb2RlYCBpbnN0YW5jZS5cbiAqL1xuZnVuY3Rpb24gZ2V0Q29udGV4dCh0Tm9kZTogVE5vZGUsIGlzQ2xhc3NCYXNlZDogYm9vbGVhbik6IFRTdHlsaW5nQ29udGV4dCB7XG4gIGxldCBjb250ZXh0ID0gaXNDbGFzc0Jhc2VkID8gdE5vZGUuY2xhc3NlcyA6IHROb2RlLnN0eWxlcztcbiAgaWYgKCFpc1N0eWxpbmdDb250ZXh0KGNvbnRleHQpKSB7XG4gICAgY29uc3QgaGFzRGlyZWN0aXZlcyA9IGlzRGlyZWN0aXZlSG9zdCh0Tm9kZSk7XG4gICAgY29udGV4dCA9IGFsbG9jVFN0eWxpbmdDb250ZXh0KGNvbnRleHQgYXMgU3R5bGluZ01hcEFycmF5IHwgbnVsbCwgaGFzRGlyZWN0aXZlcyk7XG4gICAgaWYgKG5nRGV2TW9kZSkge1xuICAgICAgYXR0YWNoU3R5bGluZ0RlYnVnT2JqZWN0KGNvbnRleHQgYXMgVFN0eWxpbmdDb250ZXh0LCBpc0NsYXNzQmFzZWQpO1xuICAgIH1cblxuICAgIGlmIChpc0NsYXNzQmFzZWQpIHtcbiAgICAgIHROb2RlLmNsYXNzZXMgPSBjb250ZXh0O1xuICAgIH0gZWxzZSB7XG4gICAgICB0Tm9kZS5zdHlsZXMgPSBjb250ZXh0O1xuICAgIH1cbiAgfVxuICByZXR1cm4gY29udGV4dCBhcyBUU3R5bGluZ0NvbnRleHQ7XG59XG5cbmZ1bmN0aW9uIHJlc29sdmVTdHlsZVByb3BWYWx1ZShcbiAgICB2YWx1ZTogc3RyaW5nIHwgbnVtYmVyIHwgU2FmZVZhbHVlIHwgbnVsbCB8IE5PX0NIQU5HRSxcbiAgICBzdWZmaXg6IHN0cmluZyB8IG51bGwgfCB1bmRlZmluZWQpOiBzdHJpbmd8U2FmZVZhbHVlfG51bGx8dW5kZWZpbmVkfE5PX0NIQU5HRSB7XG4gIGlmICh2YWx1ZSA9PT0gTk9fQ0hBTkdFKSByZXR1cm4gdmFsdWU7XG5cbiAgbGV0IHJlc29sdmVkVmFsdWU6IHN0cmluZ3xudWxsID0gbnVsbDtcbiAgaWYgKHZhbHVlICE9PSBudWxsKSB7XG4gICAgaWYgKHN1ZmZpeCkge1xuICAgICAgLy8gd2hlbiBhIHN1ZmZpeCBpcyBhcHBsaWVkIHRoZW4gaXQgd2lsbCBieXBhc3NcbiAgICAgIC8vIHNhbml0aXphdGlvbiBlbnRpcmVseSAoYi9jIGEgbmV3IHN0cmluZyBpcyBjcmVhdGVkKVxuICAgICAgcmVzb2x2ZWRWYWx1ZSA9IHJlbmRlclN0cmluZ2lmeSh2YWx1ZSkgKyBzdWZmaXg7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIHNhbml0aXphdGlvbiBoYXBwZW5zIGJ5IGRlYWxpbmcgd2l0aCBhIHN0cmluZyB2YWx1ZVxuICAgICAgLy8gdGhpcyBtZWFucyB0aGF0IHRoZSBzdHJpbmcgdmFsdWUgd2lsbCBiZSBwYXNzZWQgdGhyb3VnaFxuICAgICAgLy8gaW50byB0aGUgc3R5bGUgcmVuZGVyaW5nIGxhdGVyICh3aGljaCBpcyB3aGVyZSB0aGUgdmFsdWVcbiAgICAgIC8vIHdpbGwgYmUgc2FuaXRpemVkIGJlZm9yZSBpdCBpcyBhcHBsaWVkKVxuICAgICAgcmVzb2x2ZWRWYWx1ZSA9IHZhbHVlIGFzIGFueSBhcyBzdHJpbmc7XG4gICAgfVxuICB9XG4gIHJldHVybiByZXNvbHZlZFZhbHVlO1xufVxuXG4vKipcbiAqIFdoZXRoZXIgb3Igbm90IHRoZSBzdHlsZS9jbGFzcyBiaW5kaW5nIGJlaW5nIGFwcGxpZWQgd2FzIGV4ZWN1dGVkIHdpdGhpbiBhIGhvc3QgYmluZGluZ3NcbiAqIGZ1bmN0aW9uLlxuICovXG5mdW5jdGlvbiBpc0hvc3RTdHlsaW5nKCk6IGJvb2xlYW4ge1xuICByZXR1cm4gaXNIb3N0U3R5bGluZ0FjdGl2ZShnZXRBY3RpdmVEaXJlY3RpdmVJZCgpKTtcbn1cblxuZnVuY3Rpb24gZ2V0QW5kSW5jcmVtZW50QmluZGluZ0luZGV4KGxWaWV3OiBMVmlldywgaXNNYXBCYXNlZDogYm9vbGVhbik6IG51bWJlciB7XG4gIC8vIG1hcC1iYXNlZCBiaW5kaW5ncyB1c2UgdHdvIHNsb3RzIGJlY2F1c2UgdGhlIHByZXZpb3VzbHkgY29uc3RydWN0ZWRcbiAgLy8gY2xhc3NOYW1lIC8gc3R5bGUgdmFsdWUgbXVzdCBiZSBjb21wYXJlZCBhZ2FpbnN0LlxuICBjb25zdCBpbmRleCA9IGxWaWV3W0JJTkRJTkdfSU5ERVhdO1xuICBsVmlld1tCSU5ESU5HX0lOREVYXSArPSBpc01hcEJhc2VkID8gMiA6IDE7XG4gIHJldHVybiBpbmRleDtcbn1cbiJdfQ==