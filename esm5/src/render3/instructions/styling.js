import { ɵɵdefaultStyleSanitizer } from '../../sanitization/sanitization';
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
import { addItemToStylingMap, allocStylingMapArray, allocTStylingContext, allowDirectStyling, concatString, forceClassesAsString, forceStylesAsString, getInitialStylingValue, getStylingMapArray, getValue, hasClassInput, hasStyleInput, hasValueChanged, hasValueChangedUnwrapSafeValue, isHostStylingActive, isStylingContext, isStylingMapArray, isStylingValueDefined, normalizeIntoStylingMap, patchConfig, selectClassBasedInputName, setValue, stylingMapToString } from '../util/styling_utils';
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
export function ɵɵstyleProp(prop, value, suffixOrSanitizer) {
    stylePropInternal(getSelectedIndex(), prop, value, suffixOrSanitizer);
    return ɵɵstyleProp;
}
/**
 * Internal function for applying a single style to an element.
 *
 * The reason why this function has been separated from `ɵɵstyleProp` is because
 * it is also called from `ɵɵstylePropInterpolate`.
 */
export function stylePropInternal(elementIndex, prop, value, suffixOrSanitizer) {
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
    var isString = typeof suffixOrSanitizer === 'string';
    var suffix = isString ? suffixOrSanitizer : null;
    var sanitizer = isString ? null : suffixOrSanitizer;
    var updated = stylingProp(tNode, firstUpdatePass, lView, bindingIndex, prop, resolveStylePropValue(value, suffix), false, sanitizer);
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
    var updated = stylingProp(tNode, firstUpdatePass, lView, bindingIndex, className, value, true, null);
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
function stylingProp(tNode, firstUpdatePass, lView, bindingIndex, prop, value, isClassBased, sanitizer) {
    var updated = false;
    if (sanitizer) {
        setCurrentStyleSanitizer(sanitizer);
    }
    var native = getNativeByTNode(tNode, lView);
    var context = isClassBased ? getClassesContext(tNode) : getStylesContext(tNode);
    // [style.prop] and [class.name] bindings do not use `bind()` and will
    // therefore manage accessing and updating the new value in the lView directly.
    // For this reason, the checkNoChanges situation must also be handled here
    // as well.
    if (ngDevMode && getCheckNoChangesMode()) {
        var oldValue = getValue(lView, bindingIndex);
        if (hasValueChangedUnwrapSafeValue(oldValue, value)) {
            var field = isClassBased ? "class." + prop : "style." + prop;
            throwErrorIfNoChangesMode(false, oldValue, value, field);
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
    stylingMap(context, tNode, firstUpdatePass, lView, bindingIndex, styles, false, hasDirectiveInput, ɵɵdefaultStyleSanitizer);
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
    stylingMap(context, tNode, firstUpdatePass, lView, bindingIndex, classes, true, hasDirectiveInput, null);
}
/**
 * Shared function used to update a map-based styling binding for an element.
 *
 * When this function is called it will activate support for `[style]` and
 * `[class]` bindings in Angular.
 */
function stylingMap(context, tNode, firstUpdatePass, lView, bindingIndex, value, isClassBased, hasDirectiveInput, sanitizer) {
    var directiveIndex = getActiveDirectiveId();
    var native = getNativeByTNode(tNode, lView);
    var oldValue = getValue(lView, bindingIndex);
    setCurrentStyleSanitizer(ɵɵdefaultStyleSanitizer);
    var valueHasChanged = hasValueChanged(oldValue, value);
    // [style] and [class] bindings do not use `bind()` and will therefore
    // manage accessing and updating the new value in the lView directly.
    // For this reason, the checkNoChanges situation must also be handled here
    // as well.
    if (ngDevMode && valueHasChanged && getCheckNoChangesMode()) {
        // check if the value is a StylingMapArray, in which case take the first value (which stores raw
        // value) from the array
        var previousValue = isStylingMapArray(oldValue) ? oldValue[0 /* RawValuePosition */] : oldValue;
        throwErrorIfNoChangesMode(false, previousValue, value);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3R5bGluZy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvaW5zdHJ1Y3Rpb25zL3N0eWxpbmcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBUUEsT0FBTyxFQUFDLHVCQUF1QixFQUFDLE1BQU0saUNBQWlDLENBQUM7QUFFeEUsT0FBTyxFQUFDLHlCQUF5QixFQUFDLE1BQU0sV0FBVyxDQUFDO0FBQ3BELE9BQU8sRUFBQyxvQkFBb0IsRUFBQyxNQUFNLHdCQUF3QixDQUFDO0FBSTVELE9BQU8sRUFBQyxlQUFlLEVBQUMsTUFBTSwyQkFBMkIsQ0FBQztBQUMxRCxPQUFPLEVBQVEsUUFBUSxFQUFFLEtBQUssRUFBQyxNQUFNLG9CQUFvQixDQUFDO0FBQzFELE9BQU8sRUFBQyxvQkFBb0IsRUFBRSxxQkFBcUIsRUFBRSx3QkFBd0IsRUFBRSxRQUFRLEVBQUUsZ0JBQWdCLEVBQUUscUJBQXFCLEVBQUUsZ0JBQWdCLEVBQUUsMEJBQTBCLEVBQUUsd0JBQXdCLEVBQUUsZ0JBQWdCLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFDNU8sT0FBTyxFQUFDLHVCQUF1QixFQUFFLHlCQUF5QixFQUFFLFlBQVksRUFBRSxxQkFBcUIsRUFBRSxxQkFBcUIsRUFBQyxNQUFNLHFCQUFxQixDQUFDO0FBQ25KLE9BQU8sRUFBQyx5QkFBeUIsRUFBQyxNQUFNLCtCQUErQixDQUFDO0FBQ3hFLE9BQU8sRUFBQyx3QkFBd0IsRUFBQyxNQUFNLDBCQUEwQixDQUFDO0FBQ2xFLE9BQU8sRUFBQyxTQUFTLEVBQUMsTUFBTSxXQUFXLENBQUM7QUFDcEMsT0FBTyxFQUFDLGVBQWUsRUFBQyxNQUFNLG9CQUFvQixDQUFDO0FBQ25ELE9BQU8sRUFBQyxtQkFBbUIsRUFBRSxvQkFBb0IsRUFBRSxvQkFBb0IsRUFBRSxrQkFBa0IsRUFBRSxZQUFZLEVBQUUsb0JBQW9CLEVBQUUsbUJB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c291cmNlc0NvbnRlbnQiOlsiLyoqXG4qIEBsaWNlbnNlXG4qIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuKlxuKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4qL1xuaW1wb3J0IHtTYWZlVmFsdWV9IGZyb20gJy4uLy4uL3Nhbml0aXphdGlvbi9ieXBhc3MnO1xuaW1wb3J0IHvJtcm1ZGVmYXVsdFN0eWxlU2FuaXRpemVyfSBmcm9tICcuLi8uLi9zYW5pdGl6YXRpb24vc2FuaXRpemF0aW9uJztcbmltcG9ydCB7U3R5bGVTYW5pdGl6ZUZufSBmcm9tICcuLi8uLi9zYW5pdGl6YXRpb24vc3R5bGVfc2FuaXRpemVyJztcbmltcG9ydCB7dGhyb3dFcnJvcklmTm9DaGFuZ2VzTW9kZX0gZnJvbSAnLi4vZXJyb3JzJztcbmltcG9ydCB7c2V0SW5wdXRzRm9yUHJvcGVydHl9IGZyb20gJy4uL2luc3RydWN0aW9ucy9zaGFyZWQnO1xuaW1wb3J0IHtBdHRyaWJ1dGVNYXJrZXIsIFRBdHRyaWJ1dGVzLCBUTm9kZSwgVE5vZGVGbGFncywgVE5vZGVUeXBlfSBmcm9tICcuLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtSRWxlbWVudH0gZnJvbSAnLi4vaW50ZXJmYWNlcy9yZW5kZXJlcic7XG5pbXBvcnQge1N0eWxpbmdNYXBBcnJheSwgU3R5bGluZ01hcEFycmF5SW5kZXgsIFRTdHlsaW5nQ29udGV4dH0gZnJvbSAnLi4vaW50ZXJmYWNlcy9zdHlsaW5nJztcbmltcG9ydCB7aXNEaXJlY3RpdmVIb3N0fSBmcm9tICcuLi9pbnRlcmZhY2VzL3R5cGVfY2hlY2tzJztcbmltcG9ydCB7TFZpZXcsIFJFTkRFUkVSLCBUVklFV30gZnJvbSAnLi4vaW50ZXJmYWNlcy92aWV3JztcbmltcG9ydCB7Z2V0QWN0aXZlRGlyZWN0aXZlSWQsIGdldENoZWNrTm9DaGFuZ2VzTW9kZSwgZ2V0Q3VycmVudFN0eWxlU2FuaXRpemVyLCBnZXRMVmlldywgZ2V0U2VsZWN0ZWRJbmRleCwgaW5jcmVtZW50QmluZGluZ0luZGV4LCBuZXh0QmluZGluZ0luZGV4LCByZXNldEN1cnJlbnRTdHlsZVNhbml0aXplciwgc2V0Q3VycmVudFN0eWxlU2FuaXRpemVyLCBzZXRFbGVtZW50RXhpdEZufSBmcm9tICcuLi9zdGF0ZSc7XG5pbXBvcnQge2FwcGx5U3R5bGluZ01hcERpcmVjdGx5LCBhcHBseVN0eWxpbmdWYWx1ZURpcmVjdGx5LCBmbHVzaFN0eWxpbmcsIHVwZGF0ZUNsYXNzVmlhQ29udGV4dCwgdXBkYXRlU3R5bGVWaWFDb250ZXh0fSBmcm9tICcuLi9zdHlsaW5nL2JpbmRpbmdzJztcbmltcG9ydCB7YWN0aXZhdGVTdHlsaW5nTWFwRmVhdHVyZX0gZnJvbSAnLi4vc3R5bGluZy9tYXBfYmFzZWRfYmluZGluZ3MnO1xuaW1wb3J0IHthdHRhY2hTdHlsaW5nRGVidWdPYmplY3R9IGZyb20gJy4uL3N0eWxpbmcvc3R5bGluZ19kZWJ1Zyc7XG5pbXBvcnQge05PX0NIQU5HRX0gZnJvbSAnLi4vdG9rZW5zJztcbmltcG9ydCB7cmVuZGVyU3RyaW5naWZ5fSBmcm9tICcuLi91dGlsL21pc2NfdXRpbHMnO1xuaW1wb3J0IHthZGRJdGVtVG9TdHlsaW5nTWFwLCBhbGxvY1N0eWxpbmdNYXBBcnJheSwgYWxsb2NUU3R5bGluZ0NvbnRleHQsIGFsbG93RGlyZWN0U3R5bGluZywgY29uY2F0U3RyaW5nLCBmb3JjZUNsYXNzZXNBc1N0cmluZywgZm9yY2VTdHlsZXNBc1N0cmluZywgZ2V0SW5pdGlhbFN0eWxpbmdWYWx1ZSwgZ2V0U3R5bGluZ01hcEFycmF5LCBnZXRWYWx1ZSwgaGFzQ2xhc3NJbnB1dCwgaGFzU3R5bGVJbnB1dCwgaGFzVmFsdWVDaGFuZ2VkLCBoYXNWYWx1ZUNoYW5nZWRVbndyYXBTYWZlVmFsdWUsIGlzSG9zdFN0eWxpbmdBY3RpdmUsIGlzU3R5bGluZ0NvbnRleHQsIGlzU3R5bGluZ01hcEFycmF5LCBpc1N0eWxpbmdWYWx1ZURlZmluZWQsIG5vcm1hbGl6ZUludG9TdHlsaW5nTWFwLCBwYXRjaENvbmZpZywgc2VsZWN0Q2xhc3NCYXNlZElucHV0TmFtZSwgc2V0VmFsdWUsIHN0eWxpbmdNYXBUb1N0cmluZ30gZnJvbSAnLi4vdXRpbC9zdHlsaW5nX3V0aWxzJztcbmltcG9ydCB7Z2V0TmF0aXZlQnlUTm9kZSwgZ2V0VE5vZGV9IGZyb20gJy4uL3V0aWwvdmlld191dGlscyc7XG5cblxuXG4vKipcbiAqIC0tLS0tLS0tXG4gKlxuICogVGhpcyBmaWxlIGNvbnRhaW5zIHRoZSBjb3JlIGxvZ2ljIGZvciBob3cgc3R5bGluZyBpbnN0cnVjdGlvbnMgYXJlIHByb2Nlc3NlZCBpbiBBbmd1bGFyLlxuICpcbiAqIFRvIGxlYXJuIG1vcmUgYWJvdXQgdGhlIGFsZ29yaXRobSBzZWUgYFRTdHlsaW5nQ29udGV4dGAuXG4gKlxuICogLS0tLS0tLS1cbiAqL1xuXG4vKipcbiAqIFVwZGF0ZSBhIHN0eWxlIGJpbmRpbmcgb24gYW4gZWxlbWVudCB3aXRoIHRoZSBwcm92aWRlZCB2YWx1ZS5cbiAqXG4gKiBJZiB0aGUgc3R5bGUgdmFsdWUgaXMgZmFsc3kgdGhlbiBpdCB3aWxsIGJlIHJlbW92ZWQgZnJvbSB0aGUgZWxlbWVudFxuICogKG9yIGFzc2lnbmVkIGEgZGlmZmVyZW50IHZhbHVlIGRlcGVuZGluZyBpZiB0aGVyZSBhcmUgYW55IHN0eWxlcyBwbGFjZWRcbiAqIG9uIHRoZSBlbGVtZW50IHdpdGggYHN0eWxlTWFwYCBvciBhbnkgc3RhdGljIHN0eWxlcyB0aGF0IGFyZVxuICogcHJlc2VudCBmcm9tIHdoZW4gdGhlIGVsZW1lbnQgd2FzIGNyZWF0ZWQgd2l0aCBgc3R5bGluZ2ApLlxuICpcbiAqIE5vdGUgdGhhdCB0aGUgc3R5bGluZyBlbGVtZW50IGlzIHVwZGF0ZWQgYXMgcGFydCBvZiBgc3R5bGluZ0FwcGx5YC5cbiAqXG4gKiBAcGFyYW0gcHJvcCBBIHZhbGlkIENTUyBwcm9wZXJ0eS5cbiAqIEBwYXJhbSB2YWx1ZSBOZXcgdmFsdWUgdG8gd3JpdGUgKGBudWxsYCBvciBhbiBlbXB0eSBzdHJpbmcgdG8gcmVtb3ZlKS5cbiAqIEBwYXJhbSBzdWZmaXggT3B0aW9uYWwgc3VmZml4LiBVc2VkIHdpdGggc2NhbGFyIHZhbHVlcyB0byBhZGQgdW5pdCBzdWNoIGFzIGBweGAuXG4gKiAgICAgICAgTm90ZSB0aGF0IHdoZW4gYSBzdWZmaXggaXMgcHJvdmlkZWQgdGhlbiB0aGUgdW5kZXJseWluZyBzYW5pdGl6ZXIgd2lsbFxuICogICAgICAgIGJlIGlnbm9yZWQuXG4gKlxuICogTm90ZSB0aGF0IHRoaXMgd2lsbCBhcHBseSB0aGUgcHJvdmlkZWQgc3R5bGUgdmFsdWUgdG8gdGhlIGhvc3QgZWxlbWVudCBpZiB0aGlzIGZ1bmN0aW9uIGlzIGNhbGxlZFxuICogd2l0aGluIGEgaG9zdCBiaW5kaW5nIGZ1bmN0aW9uLlxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1c3R5bGVQcm9wKFxuICAgIHByb3A6IHN0cmluZywgdmFsdWU6IHN0cmluZyB8IG51bWJlciB8IFNhZmVWYWx1ZSB8IG51bGwsXG4gICAgc3VmZml4T3JTYW5pdGl6ZXI/OiBTdHlsZVNhbml0aXplRm4gfCBzdHJpbmcgfCBudWxsKTogdHlwZW9mIMm1ybVzdHlsZVByb3Age1xuICBzdHlsZVByb3BJbnRlcm5hbChnZXRTZWxlY3RlZEluZGV4KCksIHByb3AsIHZhbHVlLCBzdWZmaXhPclNhbml0aXplcik7XG4gIHJldHVybiDJtcm1c3R5bGVQcm9wO1xufVxuXG4vKipcbiAqIEludGVybmFsIGZ1bmN0aW9uIGZvciBhcHBseWluZyBhIHNpbmdsZSBzdHlsZSB0byBhbiBlbGVtZW50LlxuICpcbiAqIFRoZSByZWFzb24gd2h5IHRoaXMgZnVuY3Rpb24gaGFzIGJlZW4gc2VwYXJhdGVkIGZyb20gYMm1ybVzdHlsZVByb3BgIGlzIGJlY2F1c2VcbiAqIGl0IGlzIGFsc28gY2FsbGVkIGZyb20gYMm1ybVzdHlsZVByb3BJbnRlcnBvbGF0ZWAuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzdHlsZVByb3BJbnRlcm5hbChcbiAgICBlbGVtZW50SW5kZXg6IG51bWJlciwgcHJvcDogc3RyaW5nLCB2YWx1ZTogc3RyaW5nIHwgbnVtYmVyIHwgU2FmZVZhbHVlIHwgbnVsbCxcbiAgICBzdWZmaXhPclNhbml0aXplcj86IFN0eWxlU2FuaXRpemVGbiB8IHN0cmluZyB8IG51bGwpOiB2b2lkIHtcbiAgLy8gaWYgYSB2YWx1ZSBpcyBpbnRlcnBvbGF0ZWQgdGhlbiBpdCBtYXkgcmVuZGVyIGEgYE5PX0NIQU5HRWAgdmFsdWUuXG4gIC8vIGluIHRoaXMgY2FzZSB3ZSBkbyBub3QgbmVlZCB0byBkbyBhbnl0aGluZywgYnV0IHRoZSBiaW5kaW5nIGluZGV4XG4gIC8vIHN0aWxsIG5lZWRzIHRvIGJlIGluY3JlbWVudGVkIGJlY2F1c2UgYWxsIHN0eWxpbmcgYmluZGluZyB2YWx1ZXNcbiAgLy8gYXJlIHN0b3JlZCBpbnNpZGUgb2YgdGhlIGxWaWV3LlxuICBjb25zdCBiaW5kaW5nSW5kZXggPSBuZXh0QmluZGluZ0luZGV4KCk7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgdE5vZGUgPSBnZXRUTm9kZShlbGVtZW50SW5kZXgsIGxWaWV3KTtcbiAgY29uc3QgZmlyc3RVcGRhdGVQYXNzID0gbFZpZXdbVFZJRVddLmZpcnN0VXBkYXRlUGFzcztcblxuICAvLyB3ZSBjaGVjayBmb3IgdGhpcyBpbiB0aGUgaW5zdHJ1Y3Rpb24gY29kZSBzbyB0aGF0IHRoZSBjb250ZXh0IGNhbiBiZSBub3RpZmllZFxuICAvLyBhYm91dCBwcm9wIG9yIG1hcCBiaW5kaW5ncyBzbyB0aGF0IHRoZSBkaXJlY3QgYXBwbHkgY2hlY2sgY2FuIGRlY2lkZSBlYXJsaWVyXG4gIC8vIGlmIGl0IGFsbG93cyBmb3IgY29udGV4dCByZXNvbHV0aW9uIHRvIGJlIGJ5cGFzc2VkLlxuICBpZiAoZmlyc3RVcGRhdGVQYXNzKSB7XG4gICAgcGF0Y2hDb25maWcodE5vZGUsIFROb2RlRmxhZ3MuaGFzU3R5bGVQcm9wQmluZGluZ3MpO1xuICAgIHBhdGNoSG9zdFN0eWxpbmdGbGFnKHROb2RlLCBpc0hvc3RTdHlsaW5nKCksIGZhbHNlKTtcbiAgfVxuXG4gIGNvbnN0IGlzU3RyaW5nID0gdHlwZW9mIHN1ZmZpeE9yU2FuaXRpemVyID09PSAnc3RyaW5nJztcbiAgY29uc3Qgc3VmZml4ID0gaXNTdHJpbmcgPyAoc3VmZml4T3JTYW5pdGl6ZXIgYXMgc3RyaW5nKSA6IG51bGw7XG4gIGNvbnN0IHNhbml0aXplciA9IGlzU3RyaW5nID8gbnVsbCA6IChzdWZmaXhPclNhbml0aXplciBhcyBTdHlsZVNhbml0aXplRm4gfCBudWxsIHwgdW5kZWZpbmVkKTtcbiAgY29uc3QgdXBkYXRlZCA9IHN0eWxpbmdQcm9wKFxuICAgICAgdE5vZGUsIGZpcnN0VXBkYXRlUGFzcywgbFZpZXcsIGJpbmRpbmdJbmRleCwgcHJvcCwgcmVzb2x2ZVN0eWxlUHJvcFZhbHVlKHZhbHVlLCBzdWZmaXgpLFxuICAgICAgZmFsc2UsIHNhbml0aXplcik7XG4gIGlmIChuZ0Rldk1vZGUpIHtcbiAgICBuZ0Rldk1vZGUuc3R5bGVQcm9wKys7XG4gICAgaWYgKHVwZGF0ZWQpIHtcbiAgICAgIG5nRGV2TW9kZS5zdHlsZVByb3BDYWNoZU1pc3MrKztcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBVcGRhdGUgYSBjbGFzcyBiaW5kaW5nIG9uIGFuIGVsZW1lbnQgd2l0aCB0aGUgcHJvdmlkZWQgdmFsdWUuXG4gKlxuICogVGhpcyBpbnN0cnVjdGlvbiBpcyBtZWFudCB0byBoYW5kbGUgdGhlIGBbY2xhc3MuZm9vXT1cImV4cFwiYCBjYXNlIGFuZCxcbiAqIHRoZXJlZm9yZSwgdGhlIGNsYXNzIGJpbmRpbmcgaXRzZWxmIG11c3QgYWxyZWFkeSBiZSBhbGxvY2F0ZWQgdXNpbmdcbiAqIGBzdHlsaW5nYCB3aXRoaW4gdGhlIGNyZWF0aW9uIGJsb2NrLlxuICpcbiAqIEBwYXJhbSBwcm9wIEEgdmFsaWQgQ1NTIGNsYXNzIChvbmx5IG9uZSkuXG4gKiBAcGFyYW0gdmFsdWUgQSB0cnVlL2ZhbHNlIHZhbHVlIHdoaWNoIHdpbGwgdHVybiB0aGUgY2xhc3Mgb24gb3Igb2ZmLlxuICpcbiAqIE5vdGUgdGhhdCB0aGlzIHdpbGwgYXBwbHkgdGhlIHByb3ZpZGVkIGNsYXNzIHZhbHVlIHRvIHRoZSBob3N0IGVsZW1lbnQgaWYgdGhpcyBmdW5jdGlvblxuICogaXMgY2FsbGVkIHdpdGhpbiBhIGhvc3QgYmluZGluZyBmdW5jdGlvbi5cbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWNsYXNzUHJvcChjbGFzc05hbWU6IHN0cmluZywgdmFsdWU6IGJvb2xlYW4gfCBudWxsKTogdHlwZW9mIMm1ybVjbGFzc1Byb3Age1xuICAvLyBpZiBhIHZhbHVlIGlzIGludGVycG9sYXRlZCB0aGVuIGl0IG1heSByZW5kZXIgYSBgTk9fQ0hBTkdFYCB2YWx1ZS5cbiAgLy8gaW4gdGhpcyBjYXNlIHdlIGRvIG5vdCBuZWVkIHRvIGRvIGFueXRoaW5nLCBidXQgdGhlIGJpbmRpbmcgaW5kZXhcbiAgLy8gc3RpbGwgbmVlZHMgdG8gYmUgaW5jcmVtZW50ZWQgYmVjYXVzZSBhbGwgc3R5bGluZyBiaW5kaW5nIHZhbHVlc1xuICAvLyBhcmUgc3RvcmVkIGluc2lkZSBvZiB0aGUgbFZpZXcuXG4gIGNvbnN0IGJpbmRpbmdJbmRleCA9IG5leHRCaW5kaW5nSW5kZXgoKTtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCBlbGVtZW50SW5kZXggPSBnZXRTZWxlY3RlZEluZGV4KCk7XG4gIGNvbnN0IHROb2RlID0gZ2V0VE5vZGUoZWxlbWVudEluZGV4LCBsVmlldyk7XG4gIGNvbnN0IGZpcnN0VXBkYXRlUGFzcyA9IGxWaWV3W1RWSUVXXS5maXJzdFVwZGF0ZVBhc3M7XG5cbiAgLy8gd2UgY2hlY2sgZm9yIHRoaXMgaW4gdGhlIGluc3RydWN0aW9uIGNvZGUgc28gdGhhdCB0aGUgY29udGV4dCBjYW4gYmUgbm90aWZpZWRcbiAgLy8gYWJvdXQgcHJvcCBvciBtYXAgYmluZGluZ3Mgc28gdGhhdCB0aGUgZGlyZWN0IGFwcGx5IGNoZWNrIGNhbiBkZWNpZGUgZWFybGllclxuICAvLyBpZiBpdCBhbGxvd3MgZm9yIGNvbnRleHQgcmVzb2x1dGlvbiB0byBiZSBieXBhc3NlZC5cbiAgaWYgKGZpcnN0VXBkYXRlUGFzcykge1xuICAgIHBhdGNoQ29uZmlnKHROb2RlLCBUTm9kZUZsYWdzLmhhc0NsYXNzUHJvcEJpbmRpbmdzKTtcbiAgICBwYXRjaEhvc3RTdHlsaW5nRmxhZyh0Tm9kZSwgaXNIb3N0U3R5bGluZygpLCB0cnVlKTtcbiAgfVxuXG4gIGNvbnN0IHVwZGF0ZWQgPVxuICAgICAgc3R5bGluZ1Byb3AodE5vZGUsIGZpcnN0VXBkYXRlUGFzcywgbFZpZXcsIGJpbmRpbmdJbmRleCwgY2xhc3NOYW1lLCB2YWx1ZSwgdHJ1ZSwgbnVsbCk7XG4gIGlmIChuZ0Rldk1vZGUpIHtcbiAgICBuZ0Rldk1vZGUuY2xhc3NQcm9wKys7XG4gICAgaWYgKHVwZGF0ZWQpIHtcbiAgICAgIG5nRGV2TW9kZS5jbGFzc1Byb3BDYWNoZU1pc3MrKztcbiAgICB9XG4gIH1cbiAgcmV0dXJuIMm1ybVjbGFzc1Byb3A7XG59XG5cbi8qKlxuICogU2hhcmVkIGZ1bmN0aW9uIHVzZWQgdG8gdXBkYXRlIGEgcHJvcC1iYXNlZCBzdHlsaW5nIGJpbmRpbmcgZm9yIGFuIGVsZW1lbnQuXG4gKlxuICogRGVwZW5kaW5nIG9uIHRoZSBzdGF0ZSBvZiB0aGUgYHROb2RlLnN0eWxlc2Agc3R5bGVzIGNvbnRleHQsIHRoZSBzdHlsZS9wcm9wXG4gKiB2YWx1ZSBtYXkgYmUgYXBwbGllZCBkaXJlY3RseSB0byB0aGUgZWxlbWVudCBpbnN0ZWFkIG9mIGJlaW5nIHByb2Nlc3NlZFxuICogdGhyb3VnaCB0aGUgY29udGV4dC4gVGhlIHJlYXNvbiB3aHkgdGhpcyBvY2N1cnMgaXMgZm9yIHBlcmZvcm1hbmNlIGFuZCBmdWxseVxuICogZGVwZW5kcyBvbiB0aGUgc3RhdGUgb2YgdGhlIGNvbnRleHQgKGkuZS4gd2hldGhlciBvciBub3QgdGhlcmUgYXJlIGR1cGxpY2F0ZVxuICogYmluZGluZ3Mgb3Igd2hldGhlciBvciBub3QgdGhlcmUgYXJlIG1hcC1iYXNlZCBiaW5kaW5ncyBhbmQgcHJvcGVydHkgYmluZGluZ3NcbiAqIHByZXNlbnQgdG9nZXRoZXIpLlxuICovXG5mdW5jdGlvbiBzdHlsaW5nUHJvcChcbiAgICB0Tm9kZTogVE5vZGUsIGZpcnN0VXBkYXRlUGFzczogYm9vbGVhbiwgbFZpZXc6IExWaWV3LCBiaW5kaW5nSW5kZXg6IG51bWJlciwgcHJvcDogc3RyaW5nLFxuICAgIHZhbHVlOiBib29sZWFuIHwgbnVtYmVyIHwgU2FmZVZhbHVlIHwgc3RyaW5nIHwgbnVsbCB8IHVuZGVmaW5lZCB8IE5PX0NIQU5HRSxcbiAgICBpc0NsYXNzQmFzZWQ6IGJvb2xlYW4sIHNhbml0aXplcjogU3R5bGVTYW5pdGl6ZUZuIHwgbnVsbCB8IHVuZGVmaW5lZCk6IGJvb2xlYW4ge1xuICBsZXQgdXBkYXRlZCA9IGZhbHNlO1xuXG4gIGlmIChzYW5pdGl6ZXIpIHtcbiAgICBzZXRDdXJyZW50U3R5bGVTYW5pdGl6ZXIoc2FuaXRpemVyKTtcbiAgfVxuXG4gIGNvbnN0IG5hdGl2ZSA9IGdldE5hdGl2ZUJ5VE5vZGUodE5vZGUsIGxWaWV3KSBhcyBSRWxlbWVudDtcbiAgY29uc3QgY29udGV4dCA9IGlzQ2xhc3NCYXNlZCA/IGdldENsYXNzZXNDb250ZXh0KHROb2RlKSA6IGdldFN0eWxlc0NvbnRleHQodE5vZGUpO1xuXG4gIC8vIFtzdHlsZS5wcm9wXSBhbmQgW2NsYXNzLm5hbWVdIGJpbmRpbmdzIGRvIG5vdCB1c2UgYGJpbmQoKWAgYW5kIHdpbGxcbiAgLy8gdGhlcmVmb3JlIG1hbmFnZSBhY2Nlc3NpbmcgYW5kIHVwZGF0aW5nIHRoZSBuZXcgdmFsdWUgaW4gdGhlIGxWaWV3IGRpcmVjdGx5LlxuICAvLyBGb3IgdGhpcyByZWFzb24sIHRoZSBjaGVja05vQ2hhbmdlcyBzaXR1YXRpb24gbXVzdCBhbHNvIGJlIGhhbmRsZWQgaGVyZVxuICAvLyBhcyB3ZWxsLlxuICBpZiAobmdEZXZNb2RlICYmIGdldENoZWNrTm9DaGFuZ2VzTW9kZSgpKSB7XG4gICAgY29uc3Qgb2xkVmFsdWUgPSBnZXRWYWx1ZShsVmlldywgYmluZGluZ0luZGV4KTtcbiAgICBpZiAoaGFzVmFsdWVDaGFuZ2VkVW53cmFwU2FmZVZhbHVlKG9sZFZhbHVlLCB2YWx1ZSkpIHtcbiAgICAgIGNvbnN0IGZpZWxkID0gaXNDbGFzc0Jhc2VkID8gYGNsYXNzLiR7cHJvcH1gIDogYHN0eWxlLiR7cHJvcH1gO1xuICAgICAgdGhyb3dFcnJvcklmTm9DaGFuZ2VzTW9kZShmYWxzZSwgb2xkVmFsdWUsIHZhbHVlLCBmaWVsZCk7XG4gICAgfVxuICB9XG5cbiAgLy8gRGlyZWN0IEFwcGx5IENhc2U6IGJ5cGFzcyBjb250ZXh0IHJlc29sdXRpb24gYW5kIGFwcGx5IHRoZVxuICAvLyBzdHlsZS9jbGFzcyB2YWx1ZSBkaXJlY3RseSB0byB0aGUgZWxlbWVudFxuICBpZiAoYWxsb3dEaXJlY3RTdHlsaW5nKHROb2RlLCBpc0NsYXNzQmFzZWQsIGZpcnN0VXBkYXRlUGFzcykpIHtcbiAgICBjb25zdCBzYW5pdGl6ZXJUb1VzZSA9IGlzQ2xhc3NCYXNlZCA/IG51bGwgOiBzYW5pdGl6ZXI7XG4gICAgY29uc3QgcmVuZGVyZXIgPSBnZXRSZW5kZXJlcih0Tm9kZSwgbFZpZXcpO1xuICAgIHVwZGF0ZWQgPSBhcHBseVN0eWxpbmdWYWx1ZURpcmVjdGx5KFxuICAgICAgICByZW5kZXJlciwgY29udGV4dCwgdE5vZGUsIG5hdGl2ZSwgbFZpZXcsIGJpbmRpbmdJbmRleCwgcHJvcCwgdmFsdWUsIGlzQ2xhc3NCYXNlZCxcbiAgICAgICAgc2FuaXRpemVyVG9Vc2UpO1xuXG4gICAgaWYgKHNhbml0aXplclRvVXNlKSB7XG4gICAgICAvLyBpdCdzIGltcG9ydGFudCB3ZSByZW1vdmUgdGhlIGN1cnJlbnQgc3R5bGUgc2FuaXRpemVyIG9uY2UgdGhlXG4gICAgICAvLyBlbGVtZW50IGV4aXRzLCBvdGhlcndpc2UgaXQgd2lsbCBiZSB1c2VkIGJ5IHRoZSBuZXh0IHN0eWxpbmdcbiAgICAgIC8vIGluc3RydWN0aW9ucyBmb3IgdGhlIG5leHQgZWxlbWVudC5cbiAgICAgIHNldEVsZW1lbnRFeGl0Rm4oc3R5bGluZ0FwcGx5KTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgLy8gQ29udGV4dCBSZXNvbHV0aW9uIChvciBmaXJzdCB1cGRhdGUpIENhc2U6IHNhdmUgdGhlIHZhbHVlXG4gICAgLy8gYW5kIGRlZmVyIHRvIHRoZSBjb250ZXh0IHRvIGZsdXNoIGFuZCBhcHBseSB0aGUgc3R5bGUvY2xhc3MgYmluZGluZ1xuICAgIC8vIHZhbHVlIHRvIHRoZSBlbGVtZW50LlxuICAgIGNvbnN0IGRpcmVjdGl2ZUluZGV4ID0gZ2V0QWN0aXZlRGlyZWN0aXZlSWQoKTtcbiAgICBpZiAoaXNDbGFzc0Jhc2VkKSB7XG4gICAgICB1cGRhdGVkID0gdXBkYXRlQ2xhc3NWaWFDb250ZXh0KFxuICAgICAgICAgIGNvbnRleHQsIHROb2RlLCBsVmlldywgbmF0aXZlLCBkaXJlY3RpdmVJbmRleCwgcHJvcCwgYmluZGluZ0luZGV4LFxuICAgICAgICAgIHZhbHVlIGFzIHN0cmluZyB8IGJvb2xlYW4gfCBudWxsLCBmYWxzZSwgZmlyc3RVcGRhdGVQYXNzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdXBkYXRlZCA9IHVwZGF0ZVN0eWxlVmlhQ29udGV4dChcbiAgICAgICAgICBjb250ZXh0LCB0Tm9kZSwgbFZpZXcsIG5hdGl2ZSwgZGlyZWN0aXZlSW5kZXgsIHByb3AsIGJpbmRpbmdJbmRleCxcbiAgICAgICAgICB2YWx1ZSBhcyBzdHJpbmcgfCBTYWZlVmFsdWUgfCBudWxsLCBzYW5pdGl6ZXIsIGZhbHNlLCBmaXJzdFVwZGF0ZVBhc3MpO1xuICAgIH1cblxuICAgIHNldEVsZW1lbnRFeGl0Rm4oc3R5bGluZ0FwcGx5KTtcbiAgfVxuXG4gIHJldHVybiB1cGRhdGVkO1xufVxuXG4vKipcbiAqIFVwZGF0ZSBzdHlsZSBiaW5kaW5ncyB1c2luZyBhbiBvYmplY3QgbGl0ZXJhbCBvbiBhbiBlbGVtZW50LlxuICpcbiAqIFRoaXMgaW5zdHJ1Y3Rpb24gaXMgbWVhbnQgdG8gYXBwbHkgc3R5bGluZyB2aWEgdGhlIGBbc3R5bGVdPVwiZXhwXCJgIHRlbXBsYXRlIGJpbmRpbmdzLlxuICogV2hlbiBzdHlsZXMgYXJlIGFwcGxpZWQgdG8gdGhlIGVsZW1lbnQgdGhleSB3aWxsIHRoZW4gYmUgdXBkYXRlZCB3aXRoIHJlc3BlY3QgdG9cbiAqIGFueSBzdHlsZXMvY2xhc3NlcyBzZXQgdmlhIGBzdHlsZVByb3BgLiBJZiBhbnkgc3R5bGVzIGFyZSBzZXQgdG8gZmFsc3lcbiAqIHRoZW4gdGhleSB3aWxsIGJlIHJlbW92ZWQgZnJvbSB0aGUgZWxlbWVudC5cbiAqXG4gKiBOb3RlIHRoYXQgdGhlIHN0eWxpbmcgaW5zdHJ1Y3Rpb24gd2lsbCBub3QgYmUgYXBwbGllZCB1bnRpbCBgc3R5bGluZ0FwcGx5YCBpcyBjYWxsZWQuXG4gKlxuICogQHBhcmFtIHN0eWxlcyBBIGtleS92YWx1ZSBzdHlsZSBtYXAgb2YgdGhlIHN0eWxlcyB0aGF0IHdpbGwgYmUgYXBwbGllZCB0byB0aGUgZ2l2ZW4gZWxlbWVudC5cbiAqICAgICAgICBBbnkgbWlzc2luZyBzdHlsZXMgKHRoYXQgaGF2ZSBhbHJlYWR5IGJlZW4gYXBwbGllZCB0byB0aGUgZWxlbWVudCBiZWZvcmVoYW5kKSB3aWxsIGJlXG4gKiAgICAgICAgcmVtb3ZlZCAodW5zZXQpIGZyb20gdGhlIGVsZW1lbnQncyBzdHlsaW5nLlxuICpcbiAqIE5vdGUgdGhhdCB0aGlzIHdpbGwgYXBwbHkgdGhlIHByb3ZpZGVkIHN0eWxlTWFwIHZhbHVlIHRvIHRoZSBob3N0IGVsZW1lbnQgaWYgdGhpcyBmdW5jdGlvblxuICogaXMgY2FsbGVkIHdpdGhpbiBhIGhvc3QgYmluZGluZy5cbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtXN0eWxlTWFwKHN0eWxlczoge1tzdHlsZU5hbWU6IHN0cmluZ106IGFueX0gfCBOT19DSEFOR0UgfCBudWxsKTogdm9pZCB7XG4gIGNvbnN0IGluZGV4ID0gZ2V0U2VsZWN0ZWRJbmRleCgpO1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IHROb2RlID0gZ2V0VE5vZGUoaW5kZXgsIGxWaWV3KTtcbiAgY29uc3QgZmlyc3RVcGRhdGVQYXNzID0gbFZpZXdbVFZJRVddLmZpcnN0VXBkYXRlUGFzcztcbiAgY29uc3QgY29udGV4dCA9IGdldFN0eWxlc0NvbnRleHQodE5vZGUpO1xuICBjb25zdCBoYXNEaXJlY3RpdmVJbnB1dCA9IGhhc1N0eWxlSW5wdXQodE5vZGUpO1xuXG4gIC8vIGlmIGEgdmFsdWUgaXMgaW50ZXJwb2xhdGVkIHRoZW4gaXQgbWF5IHJlbmRlciBhIGBOT19DSEFOR0VgIHZhbHVlLlxuICAvLyBpbiB0aGlzIGNhc2Ugd2UgZG8gbm90IG5lZWQgdG8gZG8gYW55dGhpbmcsIGJ1dCB0aGUgYmluZGluZyBpbmRleFxuICAvLyBzdGlsbCBuZWVkcyB0byBiZSBpbmNyZW1lbnRlZCBiZWNhdXNlIGFsbCBzdHlsaW5nIGJpbmRpbmcgdmFsdWVzXG4gIC8vIGFyZSBzdG9yZWQgaW5zaWRlIG9mIHRoZSBsVmlldy5cbiAgY29uc3QgYmluZGluZ0luZGV4ID0gaW5jcmVtZW50QmluZGluZ0luZGV4KDIpO1xuICBjb25zdCBob3N0QmluZGluZ3NNb2RlID0gaXNIb3N0U3R5bGluZygpO1xuXG4gIC8vIGlucHV0cyBhcmUgb25seSBldmFsdWF0ZWQgZnJvbSBhIHRlbXBsYXRlIGJpbmRpbmcgaW50byBhIGRpcmVjdGl2ZSwgdGhlcmVmb3JlLFxuICAvLyB0aGVyZSBzaG91bGQgbm90IGJlIGEgc2l0dWF0aW9uIHdoZXJlIGEgZGlyZWN0aXZlIGhvc3QgYmluZGluZ3MgZnVuY3Rpb25cbiAgLy8gZXZhbHVhdGVzIHRoZSBpbnB1dHMgKHRoaXMgc2hvdWxkIG9ubHkgaGFwcGVuIGluIHRoZSB0ZW1wbGF0ZSBmdW5jdGlvbilcbiAgaWYgKCFob3N0QmluZGluZ3NNb2RlICYmIGhhc0RpcmVjdGl2ZUlucHV0ICYmIHN0eWxlcyAhPT0gTk9fQ0hBTkdFKSB7XG4gICAgdXBkYXRlRGlyZWN0aXZlSW5wdXRWYWx1ZShjb250ZXh0LCBsVmlldywgdE5vZGUsIGJpbmRpbmdJbmRleCwgc3R5bGVzLCBmYWxzZSwgZmlyc3RVcGRhdGVQYXNzKTtcbiAgICBzdHlsZXMgPSBOT19DSEFOR0U7XG4gIH1cblxuICAvLyB3ZSBjaGVjayBmb3IgdGhpcyBpbiB0aGUgaW5zdHJ1Y3Rpb24gY29kZSBzbyB0aGF0IHRoZSBjb250ZXh0IGNhbiBiZSBub3RpZmllZFxuICAvLyBhYm91dCBwcm9wIG9yIG1hcCBiaW5kaW5ncyBzbyB0aGF0IHRoZSBkaXJlY3QgYXBwbHkgY2hlY2sgY2FuIGRlY2lkZSBlYXJsaWVyXG4gIC8vIGlmIGl0IGFsbG93cyBmb3IgY29udGV4dCByZXNvbHV0aW9uIHRvIGJlIGJ5cGFzc2VkLlxuICBpZiAoZmlyc3RVcGRhdGVQYXNzKSB7XG4gICAgcGF0Y2hDb25maWcodE5vZGUsIFROb2RlRmxhZ3MuaGFzU3R5bGVNYXBCaW5kaW5ncyk7XG4gICAgcGF0Y2hIb3N0U3R5bGluZ0ZsYWcodE5vZGUsIGlzSG9zdFN0eWxpbmcoKSwgZmFsc2UpO1xuICB9XG5cbiAgc3R5bGluZ01hcChcbiAgICAgIGNvbnRleHQsIHROb2RlLCBmaXJzdFVwZGF0ZVBhc3MsIGxWaWV3LCBiaW5kaW5nSW5kZXgsIHN0eWxlcywgZmFsc2UsIGhhc0RpcmVjdGl2ZUlucHV0LFxuICAgICAgybXJtWRlZmF1bHRTdHlsZVNhbml0aXplcik7XG59XG5cbi8qKlxuICogVXBkYXRlIGNsYXNzIGJpbmRpbmdzIHVzaW5nIGFuIG9iamVjdCBsaXRlcmFsIG9yIGNsYXNzLXN0cmluZyBvbiBhbiBlbGVtZW50LlxuICpcbiAqIFRoaXMgaW5zdHJ1Y3Rpb24gaXMgbWVhbnQgdG8gYXBwbHkgc3R5bGluZyB2aWEgdGhlIGBbY2xhc3NdPVwiZXhwXCJgIHRlbXBsYXRlIGJpbmRpbmdzLlxuICogV2hlbiBjbGFzc2VzIGFyZSBhcHBsaWVkIHRvIHRoZSBlbGVtZW50IHRoZXkgd2lsbCB0aGVuIGJlIHVwZGF0ZWQgd2l0aFxuICogcmVzcGVjdCB0byBhbnkgc3R5bGVzL2NsYXNzZXMgc2V0IHZpYSBgY2xhc3NQcm9wYC4gSWYgYW55XG4gKiBjbGFzc2VzIGFyZSBzZXQgdG8gZmFsc3kgdGhlbiB0aGV5IHdpbGwgYmUgcmVtb3ZlZCBmcm9tIHRoZSBlbGVtZW50LlxuICpcbiAqIE5vdGUgdGhhdCB0aGUgc3R5bGluZyBpbnN0cnVjdGlvbiB3aWxsIG5vdCBiZSBhcHBsaWVkIHVudGlsIGBzdHlsaW5nQXBwbHlgIGlzIGNhbGxlZC5cbiAqIE5vdGUgdGhhdCB0aGlzIHdpbGwgdGhlIHByb3ZpZGVkIGNsYXNzTWFwIHZhbHVlIHRvIHRoZSBob3N0IGVsZW1lbnQgaWYgdGhpcyBmdW5jdGlvbiBpcyBjYWxsZWRcbiAqIHdpdGhpbiBhIGhvc3QgYmluZGluZy5cbiAqXG4gKiBAcGFyYW0gY2xhc3NlcyBBIGtleS92YWx1ZSBtYXAgb3Igc3RyaW5nIG9mIENTUyBjbGFzc2VzIHRoYXQgd2lsbCBiZSBhZGRlZCB0byB0aGVcbiAqICAgICAgICBnaXZlbiBlbGVtZW50LiBBbnkgbWlzc2luZyBjbGFzc2VzICh0aGF0IGhhdmUgYWxyZWFkeSBiZWVuIGFwcGxpZWQgdG8gdGhlIGVsZW1lbnRcbiAqICAgICAgICBiZWZvcmVoYW5kKSB3aWxsIGJlIHJlbW92ZWQgKHVuc2V0KSBmcm9tIHRoZSBlbGVtZW50J3MgbGlzdCBvZiBDU1MgY2xhc3Nlcy5cbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWNsYXNzTWFwKGNsYXNzZXM6IHtbY2xhc3NOYW1lOiBzdHJpbmddOiBhbnl9IHwgTk9fQ0hBTkdFIHwgc3RyaW5nIHwgbnVsbCk6IHZvaWQge1xuICBjbGFzc01hcEludGVybmFsKGdldFNlbGVjdGVkSW5kZXgoKSwgY2xhc3Nlcyk7XG59XG5cbi8qKlxuICogSW50ZXJuYWwgZnVuY3Rpb24gZm9yIGFwcGx5aW5nIGEgY2xhc3Mgc3RyaW5nIG9yIGtleS92YWx1ZSBtYXAgb2YgY2xhc3NlcyB0byBhbiBlbGVtZW50LlxuICpcbiAqIFRoZSByZWFzb24gd2h5IHRoaXMgZnVuY3Rpb24gaGFzIGJlZW4gc2VwYXJhdGVkIGZyb20gYMm1ybVjbGFzc01hcGAgaXMgYmVjYXVzZVxuICogaXQgaXMgYWxzbyBjYWxsZWQgZnJvbSBgybXJtWNsYXNzTWFwSW50ZXJwb2xhdGVgLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY2xhc3NNYXBJbnRlcm5hbChcbiAgICBlbGVtZW50SW5kZXg6IG51bWJlciwgY2xhc3Nlczoge1tjbGFzc05hbWU6IHN0cmluZ106IGFueX0gfCBOT19DSEFOR0UgfCBzdHJpbmcgfCBudWxsKTogdm9pZCB7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgdE5vZGUgPSBnZXRUTm9kZShlbGVtZW50SW5kZXgsIGxWaWV3KTtcbiAgY29uc3QgZmlyc3RVcGRhdGVQYXNzID0gbFZpZXdbVFZJRVddLmZpcnN0VXBkYXRlUGFzcztcbiAgY29uc3QgY29udGV4dCA9IGdldENsYXNzZXNDb250ZXh0KHROb2RlKTtcbiAgY29uc3QgaGFzRGlyZWN0aXZlSW5wdXQgPSBoYXNDbGFzc0lucHV0KHROb2RlKTtcblxuICAvLyBpZiBhIHZhbHVlIGlzIGludGVycG9sYXRlZCB0aGVuIGl0IG1heSByZW5kZXIgYSBgTk9fQ0hBTkdFYCB2YWx1ZS5cbiAgLy8gaW4gdGhpcyBjYXNlIHdlIGRvIG5vdCBuZWVkIHRvIGRvIGFueXRoaW5nLCBidXQgdGhlIGJpbmRpbmcgaW5kZXhcbiAgLy8gc3RpbGwgbmVlZHMgdG8gYmUgaW5jcmVtZW50ZWQgYmVjYXVzZSBhbGwgc3R5bGluZyBiaW5kaW5nIHZhbHVlc1xuICAvLyBhcmUgc3RvcmVkIGluc2lkZSBvZiB0aGUgbFZpZXcuXG4gIGNvbnN0IGJpbmRpbmdJbmRleCA9IGluY3JlbWVudEJpbmRpbmdJbmRleCgyKTtcbiAgY29uc3QgaG9zdEJpbmRpbmdzTW9kZSA9IGlzSG9zdFN0eWxpbmcoKTtcblxuICAvLyBpbnB1dHMgYXJlIG9ubHkgZXZhbHVhdGVkIGZyb20gYSB0ZW1wbGF0ZSBiaW5kaW5nIGludG8gYSBkaXJlY3RpdmUsIHRoZXJlZm9yZSxcbiAgLy8gdGhlcmUgc2hvdWxkIG5vdCBiZSBhIHNpdHVhdGlvbiB3aGVyZSBhIGRpcmVjdGl2ZSBob3N0IGJpbmRpbmdzIGZ1bmN0aW9uXG4gIC8vIGV2YWx1YXRlcyB0aGUgaW5wdXRzICh0aGlzIHNob3VsZCBvbmx5IGhhcHBlbiBpbiB0aGUgdGVtcGxhdGUgZnVuY3Rpb24pXG4gIGlmICghaG9zdEJpbmRpbmdzTW9kZSAmJiBoYXNEaXJlY3RpdmVJbnB1dCAmJiBjbGFzc2VzICE9PSBOT19DSEFOR0UpIHtcbiAgICB1cGRhdGVEaXJlY3RpdmVJbnB1dFZhbHVlKGNvbnRleHQsIGxWaWV3LCB0Tm9kZSwgYmluZGluZ0luZGV4LCBjbGFzc2VzLCB0cnVlLCBmaXJzdFVwZGF0ZVBhc3MpO1xuICAgIGNsYXNzZXMgPSBOT19DSEFOR0U7XG4gIH1cblxuICAvLyB3ZSBjaGVjayBmb3IgdGhpcyBpbiB0aGUgaW5zdHJ1Y3Rpb24gY29kZSBzbyB0aGF0IHRoZSBjb250ZXh0IGNhbiBiZSBub3RpZmllZFxuICAvLyBhYm91dCBwcm9wIG9yIG1hcCBiaW5kaW5ncyBzbyB0aGF0IHRoZSBkaXJlY3QgYXBwbHkgY2hlY2sgY2FuIGRlY2lkZSBlYXJsaWVyXG4gIC8vIGlmIGl0IGFsbG93cyBmb3IgY29udGV4dCByZXNvbHV0aW9uIHRvIGJlIGJ5cGFzc2VkLlxuICBpZiAoZmlyc3RVcGRhdGVQYXNzKSB7XG4gICAgcGF0Y2hDb25maWcodE5vZGUsIFROb2RlRmxhZ3MuaGFzQ2xhc3NNYXBCaW5kaW5ncyk7XG4gICAgcGF0Y2hIb3N0U3R5bGluZ0ZsYWcodE5vZGUsIGlzSG9zdFN0eWxpbmcoKSwgdHJ1ZSk7XG4gIH1cblxuICBzdHlsaW5nTWFwKFxuICAgICAgY29udGV4dCwgdE5vZGUsIGZpcnN0VXBkYXRlUGFzcywgbFZpZXcsIGJpbmRpbmdJbmRleCwgY2xhc3NlcywgdHJ1ZSwgaGFzRGlyZWN0aXZlSW5wdXQsIG51bGwpO1xufVxuXG4vKipcbiAqIFNoYXJlZCBmdW5jdGlvbiB1c2VkIHRvIHVwZGF0ZSBhIG1hcC1iYXNlZCBzdHlsaW5nIGJpbmRpbmcgZm9yIGFuIGVsZW1lbnQuXG4gKlxuICogV2hlbiB0aGlzIGZ1bmN0aW9uIGlzIGNhbGxlZCBpdCB3aWxsIGFjdGl2YXRlIHN1cHBvcnQgZm9yIGBbc3R5bGVdYCBhbmRcbiAqIGBbY2xhc3NdYCBiaW5kaW5ncyBpbiBBbmd1bGFyLlxuICovXG5mdW5jdGlvbiBzdHlsaW5nTWFwKFxuICAgIGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCwgdE5vZGU6IFROb2RlLCBmaXJzdFVwZGF0ZVBhc3M6IGJvb2xlYW4sIGxWaWV3OiBMVmlldyxcbiAgICBiaW5kaW5nSW5kZXg6IG51bWJlciwgdmFsdWU6IHtba2V5OiBzdHJpbmddOiBhbnl9IHwgc3RyaW5nIHwgbnVsbCwgaXNDbGFzc0Jhc2VkOiBib29sZWFuLFxuICAgIGhhc0RpcmVjdGl2ZUlucHV0OiBib29sZWFuLCBzYW5pdGl6ZXI6IFN0eWxlU2FuaXRpemVGbiB8IG51bGwpOiB2b2lkIHtcbiAgY29uc3QgZGlyZWN0aXZlSW5kZXggPSBnZXRBY3RpdmVEaXJlY3RpdmVJZCgpO1xuICBjb25zdCBuYXRpdmUgPSBnZXROYXRpdmVCeVROb2RlKHROb2RlLCBsVmlldykgYXMgUkVsZW1lbnQ7XG4gIGNvbnN0IG9sZFZhbHVlID0gZ2V0VmFsdWUobFZpZXcsIGJpbmRpbmdJbmRleCk7XG4gIHNldEN1cnJlbnRTdHlsZVNhbml0aXplcijJtcm1ZGVmYXVsdFN0eWxlU2FuaXRpemVyKTtcbiAgY29uc3QgdmFsdWVIYXNDaGFuZ2VkID0gaGFzVmFsdWVDaGFuZ2VkKG9sZFZhbHVlLCB2YWx1ZSk7XG5cbiAgLy8gW3N0eWxlXSBhbmQgW2NsYXNzXSBiaW5kaW5ncyBkbyBub3QgdXNlIGBiaW5kKClgIGFuZCB3aWxsIHRoZXJlZm9yZVxuICAvLyBtYW5hZ2UgYWNjZXNzaW5nIGFuZCB1cGRhdGluZyB0aGUgbmV3IHZhbHVlIGluIHRoZSBsVmlldyBkaXJlY3RseS5cbiAgLy8gRm9yIHRoaXMgcmVhc29uLCB0aGUgY2hlY2tOb0NoYW5nZXMgc2l0dWF0aW9uIG11c3QgYWxzbyBiZSBoYW5kbGVkIGhlcmVcbiAgLy8gYXMgd2VsbC5cbiAgaWYgKG5nRGV2TW9kZSAmJiB2YWx1ZUhhc0NoYW5nZWQgJiYgZ2V0Q2hlY2tOb0NoYW5nZXNNb2RlKCkpIHtcbiAgICAvLyBjaGVjayBpZiB0aGUgdmFsdWUgaXMgYSBTdHlsaW5nTWFwQXJyYXksIGluIHdoaWNoIGNhc2UgdGFrZSB0aGUgZmlyc3QgdmFsdWUgKHdoaWNoIHN0b3JlcyByYXdcbiAgICAvLyB2YWx1ZSkgZnJvbSB0aGUgYXJyYXlcbiAgICBjb25zdCBwcmV2aW91c1ZhbHVlID1cbiAgICAgICAgaXNTdHlsaW5nTWFwQXJyYXkob2xkVmFsdWUpID8gb2xkVmFsdWVbU3R5bGluZ01hcEFycmF5SW5kZXguUmF3VmFsdWVQb3NpdGlvbl0gOiBvbGRWYWx1ZTtcbiAgICB0aHJvd0Vycm9ySWZOb0NoYW5nZXNNb2RlKGZhbHNlLCBwcmV2aW91c1ZhbHVlLCB2YWx1ZSk7XG4gIH1cblxuICAvLyBEaXJlY3QgQXBwbHkgQ2FzZTogYnlwYXNzIGNvbnRleHQgcmVzb2x1dGlvbiBhbmQgYXBwbHkgdGhlXG4gIC8vIHN0eWxlL2NsYXNzIG1hcCB2YWx1ZXMgZGlyZWN0bHkgdG8gdGhlIGVsZW1lbnRcbiAgaWYgKGFsbG93RGlyZWN0U3R5bGluZyh0Tm9kZSwgaXNDbGFzc0Jhc2VkLCBmaXJzdFVwZGF0ZVBhc3MpKSB7XG4gICAgY29uc3Qgc2FuaXRpemVyVG9Vc2UgPSBpc0NsYXNzQmFzZWQgPyBudWxsIDogc2FuaXRpemVyO1xuICAgIGNvbnN0IHJlbmRlcmVyID0gZ2V0UmVuZGVyZXIodE5vZGUsIGxWaWV3KTtcbiAgICBhcHBseVN0eWxpbmdNYXBEaXJlY3RseShcbiAgICAgICAgcmVuZGVyZXIsIGNvbnRleHQsIHROb2RlLCBuYXRpdmUsIGxWaWV3LCBiaW5kaW5nSW5kZXgsIHZhbHVlLCBpc0NsYXNzQmFzZWQsIHNhbml0aXplclRvVXNlLFxuICAgICAgICB2YWx1ZUhhc0NoYW5nZWQsIGhhc0RpcmVjdGl2ZUlucHV0KTtcbiAgICBpZiAoc2FuaXRpemVyVG9Vc2UpIHtcbiAgICAgIC8vIGl0J3MgaW1wb3J0YW50IHdlIHJlbW92ZSB0aGUgY3VycmVudCBzdHlsZSBzYW5pdGl6ZXIgb25jZSB0aGVcbiAgICAgIC8vIGVsZW1lbnQgZXhpdHMsIG90aGVyd2lzZSBpdCB3aWxsIGJlIHVzZWQgYnkgdGhlIG5leHQgc3R5bGluZ1xuICAgICAgLy8gaW5zdHJ1Y3Rpb25zIGZvciB0aGUgbmV4dCBlbGVtZW50LlxuICAgICAgc2V0RWxlbWVudEV4aXRGbihzdHlsaW5nQXBwbHkpO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBjb25zdCBzdHlsaW5nTWFwQXJyID1cbiAgICAgICAgdmFsdWUgPT09IE5PX0NIQU5HRSA/IE5PX0NIQU5HRSA6IG5vcm1hbGl6ZUludG9TdHlsaW5nTWFwKG9sZFZhbHVlLCB2YWx1ZSwgIWlzQ2xhc3NCYXNlZCk7XG5cbiAgICBhY3RpdmF0ZVN0eWxpbmdNYXBGZWF0dXJlKCk7XG5cbiAgICAvLyBDb250ZXh0IFJlc29sdXRpb24gKG9yIGZpcnN0IHVwZGF0ZSkgQ2FzZTogc2F2ZSB0aGUgbWFwIHZhbHVlXG4gICAgLy8gYW5kIGRlZmVyIHRvIHRoZSBjb250ZXh0IHRvIGZsdXNoIGFuZCBhcHBseSB0aGUgc3R5bGUvY2xhc3MgYmluZGluZ1xuICAgIC8vIHZhbHVlIHRvIHRoZSBlbGVtZW50LlxuICAgIGlmIChpc0NsYXNzQmFzZWQpIHtcbiAgICAgIHVwZGF0ZUNsYXNzVmlhQ29udGV4dChcbiAgICAgICAgICBjb250ZXh0LCB0Tm9kZSwgbFZpZXcsIG5hdGl2ZSwgZGlyZWN0aXZlSW5kZXgsIG51bGwsIGJpbmRpbmdJbmRleCwgc3R5bGluZ01hcEFycixcbiAgICAgICAgICB2YWx1ZUhhc0NoYW5nZWQsIGZpcnN0VXBkYXRlUGFzcyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHVwZGF0ZVN0eWxlVmlhQ29udGV4dChcbiAgICAgICAgICBjb250ZXh0LCB0Tm9kZSwgbFZpZXcsIG5hdGl2ZSwgZGlyZWN0aXZlSW5kZXgsIG51bGwsIGJpbmRpbmdJbmRleCwgc3R5bGluZ01hcEFycixcbiAgICAgICAgICBzYW5pdGl6ZXIsIHZhbHVlSGFzQ2hhbmdlZCwgZmlyc3RVcGRhdGVQYXNzKTtcbiAgICB9XG5cbiAgICBzZXRFbGVtZW50RXhpdEZuKHN0eWxpbmdBcHBseSk7XG4gIH1cblxuICBpZiAobmdEZXZNb2RlKSB7XG4gICAgaXNDbGFzc0Jhc2VkID8gbmdEZXZNb2RlLmNsYXNzTWFwIDogbmdEZXZNb2RlLnN0eWxlTWFwKys7XG4gICAgaWYgKHZhbHVlSGFzQ2hhbmdlZCkge1xuICAgICAgaXNDbGFzc0Jhc2VkID8gbmdEZXZNb2RlLmNsYXNzTWFwQ2FjaGVNaXNzIDogbmdEZXZNb2RlLnN0eWxlTWFwQ2FjaGVNaXNzKys7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogV3JpdGVzIGEgdmFsdWUgdG8gYSBkaXJlY3RpdmUncyBgc3R5bGVgIG9yIGBjbGFzc2AgaW5wdXQgYmluZGluZyAoaWYgaXQgaGFzIGNoYW5nZWQpLlxuICpcbiAqIElmIGEgZGlyZWN0aXZlIGhhcyBhIGBASW5wdXRgIGJpbmRpbmcgdGhhdCBpcyBzZXQgb24gYHN0eWxlYCBvciBgY2xhc3NgIHRoZW4gdGhhdCB2YWx1ZVxuICogd2lsbCB0YWtlIHByaW9yaXR5IG92ZXIgdGhlIHVuZGVybHlpbmcgc3R5bGUvY2xhc3Mgc3R5bGluZyBiaW5kaW5ncy4gVGhpcyB2YWx1ZSB3aWxsXG4gKiBiZSB1cGRhdGVkIGZvciB0aGUgYmluZGluZyBlYWNoIHRpbWUgZHVyaW5nIGNoYW5nZSBkZXRlY3Rpb24uXG4gKlxuICogV2hlbiB0aGlzIG9jY3VycyB0aGlzIGZ1bmN0aW9uIHdpbGwgYXR0ZW1wdCB0byB3cml0ZSB0aGUgdmFsdWUgdG8gdGhlIGlucHV0IGJpbmRpbmdcbiAqIGRlcGVuZGluZyBvbiB0aGUgZm9sbG93aW5nIHNpdHVhdGlvbnM6XG4gKlxuICogLSBJZiBgb2xkVmFsdWUgIT09IG5ld1ZhbHVlYFxuICogLSBJZiBgbmV3VmFsdWVgIGlzIGBudWxsYCAoYnV0IHRoaXMgaXMgc2tpcHBlZCBpZiBpdCBpcyBkdXJpbmcgdGhlIGZpcnN0IHVwZGF0ZSBwYXNzKVxuICovXG5mdW5jdGlvbiB1cGRhdGVEaXJlY3RpdmVJbnB1dFZhbHVlKFxuICAgIGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCwgbFZpZXc6IExWaWV3LCB0Tm9kZTogVE5vZGUsIGJpbmRpbmdJbmRleDogbnVtYmVyLCBuZXdWYWx1ZTogYW55LFxuICAgIGlzQ2xhc3NCYXNlZDogYm9vbGVhbiwgZmlyc3RVcGRhdGVQYXNzOiBib29sZWFuKTogdm9pZCB7XG4gIGNvbnN0IG9sZFZhbHVlID0gZ2V0VmFsdWUobFZpZXcsIGJpbmRpbmdJbmRleCk7XG4gIGlmIChoYXNWYWx1ZUNoYW5nZWQob2xkVmFsdWUsIG5ld1ZhbHVlKSkge1xuICAgIC8vIGV2ZW4gaWYgdGhlIHZhbHVlIGhhcyBjaGFuZ2VkIHdlIG1heSBub3Qgd2FudCB0byBlbWl0IGl0IHRvIHRoZVxuICAgIC8vIGRpcmVjdGl2ZSBpbnB1dChzKSBpbiB0aGUgZXZlbnQgdGhhdCBpdCBpcyBmYWxzeSBkdXJpbmcgdGhlXG4gICAgLy8gZmlyc3QgdXBkYXRlIHBhc3MuXG4gICAgaWYgKGlzU3R5bGluZ1ZhbHVlRGVmaW5lZChuZXdWYWx1ZSkgfHwgIWZpcnN0VXBkYXRlUGFzcykge1xuICAgICAgY29uc3QgaW5wdXROYW1lOiBzdHJpbmcgPSBpc0NsYXNzQmFzZWQgPyBzZWxlY3RDbGFzc0Jhc2VkSW5wdXROYW1lKHROb2RlLmlucHV0cyAhKSA6ICdzdHlsZSc7XG4gICAgICBjb25zdCBpbnB1dHMgPSB0Tm9kZS5pbnB1dHMgIVtpbnB1dE5hbWVdICE7XG4gICAgICBjb25zdCBpbml0aWFsVmFsdWUgPSBnZXRJbml0aWFsU3R5bGluZ1ZhbHVlKGNvbnRleHQpO1xuICAgICAgY29uc3QgdmFsdWUgPSBub3JtYWxpemVTdHlsaW5nRGlyZWN0aXZlSW5wdXRWYWx1ZShpbml0aWFsVmFsdWUsIG5ld1ZhbHVlLCBpc0NsYXNzQmFzZWQpO1xuICAgICAgc2V0SW5wdXRzRm9yUHJvcGVydHkobFZpZXcsIGlucHV0cywgaW5wdXROYW1lLCB2YWx1ZSk7XG4gICAgICBzZXRFbGVtZW50RXhpdEZuKHN0eWxpbmdBcHBseSk7XG4gICAgfVxuICAgIHNldFZhbHVlKGxWaWV3LCBiaW5kaW5nSW5kZXgsIG5ld1ZhbHVlKTtcbiAgfVxufVxuXG4vKipcbiAqIFJldHVybnMgdGhlIGFwcHJvcHJpYXRlIGRpcmVjdGl2ZSBpbnB1dCB2YWx1ZSBmb3IgYHN0eWxlYCBvciBgY2xhc3NgLlxuICpcbiAqIEVhcmxpZXIgdmVyc2lvbnMgb2YgQW5ndWxhciBleHBlY3QgYSBiaW5kaW5nIHZhbHVlIHRvIGJlIHBhc3NlZCBpbnRvIGRpcmVjdGl2ZSBjb2RlXG4gKiBleGFjdGx5IGFzIGl0IGlzIHVubGVzcyB0aGVyZSBpcyBhIHN0YXRpYyB2YWx1ZSBwcmVzZW50IChpbiB3aGljaCBjYXNlIGJvdGggdmFsdWVzXG4gKiB3aWxsIGJlIHN0cmluZ2lmaWVkIGFuZCBjb25jYXRlbmF0ZWQpLlxuICovXG5mdW5jdGlvbiBub3JtYWxpemVTdHlsaW5nRGlyZWN0aXZlSW5wdXRWYWx1ZShcbiAgICBpbml0aWFsVmFsdWU6IHN0cmluZywgYmluZGluZ1ZhbHVlOiBzdHJpbmcgfCB7W2tleTogc3RyaW5nXTogYW55fSB8IG51bGwsXG4gICAgaXNDbGFzc0Jhc2VkOiBib29sZWFuKSB7XG4gIGxldCB2YWx1ZSA9IGJpbmRpbmdWYWx1ZTtcblxuICAvLyB3ZSBvbmx5IGNvbmNhdCB2YWx1ZXMgaWYgdGhlcmUgaXMgYW4gaW5pdGlhbCB2YWx1ZSwgb3RoZXJ3aXNlIHdlIHJldHVybiB0aGUgdmFsdWUgYXMgaXMuXG4gIC8vIE5vdGUgdGhhdCB0aGlzIGlzIHRvIHNhdGlzZnkgYmFja3dhcmRzLWNvbXBhdGliaWxpdHkgaW4gQW5ndWxhci5cbiAgaWYgKGluaXRpYWxWYWx1ZS5sZW5ndGgpIHtcbiAgICBpZiAoaXNDbGFzc0Jhc2VkKSB7XG4gICAgICB2YWx1ZSA9IGNvbmNhdFN0cmluZyhpbml0aWFsVmFsdWUsIGZvcmNlQ2xhc3Nlc0FzU3RyaW5nKGJpbmRpbmdWYWx1ZSkpO1xuICAgIH0gZWxzZSB7XG4gICAgICB2YWx1ZSA9IGNvbmNhdFN0cmluZyhpbml0aWFsVmFsdWUsIGZvcmNlU3R5bGVzQXNTdHJpbmcoYmluZGluZ1ZhbHVlLCB0cnVlKSwgJzsnKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHZhbHVlO1xufVxuXG4vKipcbiAqIEZsdXNoZXMgYWxsIHN0eWxpbmcgY29kZSB0byB0aGUgZWxlbWVudC5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIGlzIGRlc2lnbmVkIHRvIGJlIHNjaGVkdWxlZCBmcm9tIGFueSBvZiB0aGUgZm91ciBzdHlsaW5nIGluc3RydWN0aW9uc1xuICogaW4gdGhpcyBmaWxlLiBXaGVuIGNhbGxlZCBpdCB3aWxsIGZsdXNoIGFsbCBzdHlsZSBhbmQgY2xhc3MgYmluZGluZ3MgdG8gdGhlIGVsZW1lbnRcbiAqIHZpYSB0aGUgY29udGV4dCByZXNvbHV0aW9uIGFsZ29yaXRobS5cbiAqL1xuZnVuY3Rpb24gc3R5bGluZ0FwcGx5KCk6IHZvaWQge1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IHRWaWV3ID0gbFZpZXdbVFZJRVddO1xuICBjb25zdCBlbGVtZW50SW5kZXggPSBnZXRTZWxlY3RlZEluZGV4KCk7XG4gIGNvbnN0IHROb2RlID0gZ2V0VE5vZGUoZWxlbWVudEluZGV4LCBsVmlldyk7XG4gIGNvbnN0IG5hdGl2ZSA9IGdldE5hdGl2ZUJ5VE5vZGUodE5vZGUsIGxWaWV3KSBhcyBSRWxlbWVudDtcbiAgY29uc3QgZGlyZWN0aXZlSW5kZXggPSBnZXRBY3RpdmVEaXJlY3RpdmVJZCgpO1xuICBjb25zdCByZW5kZXJlciA9IGdldFJlbmRlcmVyKHROb2RlLCBsVmlldyk7XG4gIGNvbnN0IHNhbml0aXplciA9IGdldEN1cnJlbnRTdHlsZVNhbml0aXplcigpO1xuICBjb25zdCBjbGFzc2VzQ29udGV4dCA9IGlzU3R5bGluZ0NvbnRleHQodE5vZGUuY2xhc3NlcykgPyB0Tm9kZS5jbGFzc2VzIGFzIFRTdHlsaW5nQ29udGV4dCA6IG51bGw7XG4gIGNvbnN0IHN0eWxlc0NvbnRleHQgPSBpc1N0eWxpbmdDb250ZXh0KHROb2RlLnN0eWxlcykgPyB0Tm9kZS5zdHlsZXMgYXMgVFN0eWxpbmdDb250ZXh0IDogbnVsbDtcbiAgZmx1c2hTdHlsaW5nKFxuICAgICAgcmVuZGVyZXIsIGxWaWV3LCB0Tm9kZSwgY2xhc3Nlc0NvbnRleHQsIHN0eWxlc0NvbnRleHQsIG5hdGl2ZSwgZGlyZWN0aXZlSW5kZXgsIHNhbml0aXplcixcbiAgICAgIHRWaWV3LmZpcnN0VXBkYXRlUGFzcyk7XG4gIHJlc2V0Q3VycmVudFN0eWxlU2FuaXRpemVyKCk7XG59XG5cbmZ1bmN0aW9uIGdldFJlbmRlcmVyKHROb2RlOiBUTm9kZSwgbFZpZXc6IExWaWV3KSB7XG4gIHJldHVybiB0Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuRWxlbWVudCA/IGxWaWV3W1JFTkRFUkVSXSA6IG51bGw7XG59XG5cbi8qKlxuICogU2VhcmNoZXMgYW5kIGFzc2lnbnMgcHJvdmlkZWQgYWxsIHN0YXRpYyBzdHlsZS9jbGFzcyBlbnRyaWVzIChmb3VuZCBpbiB0aGUgYGF0dHJzYCB2YWx1ZSlcbiAqIGFuZCByZWdpc3RlcnMgdGhlbSBpbiB0aGVpciByZXNwZWN0aXZlIHN0eWxpbmcgY29udGV4dHMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZWdpc3RlckluaXRpYWxTdHlsaW5nT25UTm9kZShcbiAgICB0Tm9kZTogVE5vZGUsIGF0dHJzOiBUQXR0cmlidXRlcywgc3RhcnRJbmRleDogbnVtYmVyKTogYm9vbGVhbiB7XG4gIGxldCBoYXNBZGRpdGlvbmFsSW5pdGlhbFN0eWxpbmcgPSBmYWxzZTtcbiAgbGV0IHN0eWxlcyA9IGdldFN0eWxpbmdNYXBBcnJheSh0Tm9kZS5zdHlsZXMpO1xuICBsZXQgY2xhc3NlcyA9IGdldFN0eWxpbmdNYXBBcnJheSh0Tm9kZS5jbGFzc2VzKTtcbiAgbGV0IG1vZGUgPSAtMTtcbiAgZm9yIChsZXQgaSA9IHN0YXJ0SW5kZXg7IGkgPCBhdHRycy5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IGF0dHIgPSBhdHRyc1tpXSBhcyBzdHJpbmc7XG4gICAgaWYgKHR5cGVvZiBhdHRyID09ICdudW1iZXInKSB7XG4gICAgICBtb2RlID0gYXR0cjtcbiAgICB9IGVsc2UgaWYgKG1vZGUgPT0gQXR0cmlidXRlTWFya2VyLkNsYXNzZXMpIHtcbiAgICAgIGNsYXNzZXMgPSBjbGFzc2VzIHx8IGFsbG9jU3R5bGluZ01hcEFycmF5KG51bGwpO1xuICAgICAgYWRkSXRlbVRvU3R5bGluZ01hcChjbGFzc2VzLCBhdHRyLCB0cnVlKTtcbiAgICAgIGhhc0FkZGl0aW9uYWxJbml0aWFsU3R5bGluZyA9IHRydWU7XG4gICAgfSBlbHNlIGlmIChtb2RlID09IEF0dHJpYnV0ZU1hcmtlci5TdHlsZXMpIHtcbiAgICAgIGNvbnN0IHZhbHVlID0gYXR0cnNbKytpXSBhcyBzdHJpbmcgfCBudWxsO1xuICAgICAgc3R5bGVzID0gc3R5bGVzIHx8IGFsbG9jU3R5bGluZ01hcEFycmF5KG51bGwpO1xuICAgICAgYWRkSXRlbVRvU3R5bGluZ01hcChzdHlsZXMsIGF0dHIsIHZhbHVlKTtcbiAgICAgIGhhc0FkZGl0aW9uYWxJbml0aWFsU3R5bGluZyA9IHRydWU7XG4gICAgfVxuICB9XG5cbiAgaWYgKGNsYXNzZXMgJiYgY2xhc3Nlcy5sZW5ndGggPiBTdHlsaW5nTWFwQXJyYXlJbmRleC5WYWx1ZXNTdGFydFBvc2l0aW9uKSB7XG4gICAgaWYgKCF0Tm9kZS5jbGFzc2VzKSB7XG4gICAgICB0Tm9kZS5jbGFzc2VzID0gY2xhc3NlcztcbiAgICB9XG4gICAgdXBkYXRlUmF3VmFsdWVPbkNvbnRleHQodE5vZGUuY2xhc3Nlcywgc3R5bGluZ01hcFRvU3RyaW5nKGNsYXNzZXMsIHRydWUpKTtcbiAgfVxuXG4gIGlmIChzdHlsZXMgJiYgc3R5bGVzLmxlbmd0aCA+IFN0eWxpbmdNYXBBcnJheUluZGV4LlZhbHVlc1N0YXJ0UG9zaXRpb24pIHtcbiAgICBpZiAoIXROb2RlLnN0eWxlcykge1xuICAgICAgdE5vZGUuc3R5bGVzID0gc3R5bGVzO1xuICAgIH1cbiAgICB1cGRhdGVSYXdWYWx1ZU9uQ29udGV4dCh0Tm9kZS5zdHlsZXMsIHN0eWxpbmdNYXBUb1N0cmluZyhzdHlsZXMsIGZhbHNlKSk7XG4gIH1cblxuICBpZiAoaGFzQWRkaXRpb25hbEluaXRpYWxTdHlsaW5nKSB7XG4gICAgdE5vZGUuZmxhZ3MgfD0gVE5vZGVGbGFncy5oYXNJbml0aWFsU3R5bGluZztcbiAgfVxuXG4gIHJldHVybiBoYXNBZGRpdGlvbmFsSW5pdGlhbFN0eWxpbmc7XG59XG5cbmZ1bmN0aW9uIHVwZGF0ZVJhd1ZhbHVlT25Db250ZXh0KGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCB8IFN0eWxpbmdNYXBBcnJheSwgdmFsdWU6IHN0cmluZykge1xuICBjb25zdCBzdHlsaW5nTWFwQXJyID0gZ2V0U3R5bGluZ01hcEFycmF5KGNvbnRleHQpICE7XG4gIHN0eWxpbmdNYXBBcnJbU3R5bGluZ01hcEFycmF5SW5kZXguUmF3VmFsdWVQb3NpdGlvbl0gPSB2YWx1ZTtcbn1cblxuZnVuY3Rpb24gZ2V0U3R5bGVzQ29udGV4dCh0Tm9kZTogVE5vZGUpOiBUU3R5bGluZ0NvbnRleHQge1xuICByZXR1cm4gZ2V0Q29udGV4dCh0Tm9kZSwgZmFsc2UpO1xufVxuXG5mdW5jdGlvbiBnZXRDbGFzc2VzQ29udGV4dCh0Tm9kZTogVE5vZGUpOiBUU3R5bGluZ0NvbnRleHQge1xuICByZXR1cm4gZ2V0Q29udGV4dCh0Tm9kZSwgdHJ1ZSk7XG59XG5cbi8qKlxuICogUmV0dXJucy9pbnN0YW50aWF0ZXMgYSBzdHlsaW5nIGNvbnRleHQgZnJvbS90byBhIGB0Tm9kZWAgaW5zdGFuY2UuXG4gKi9cbmZ1bmN0aW9uIGdldENvbnRleHQodE5vZGU6IFROb2RlLCBpc0NsYXNzQmFzZWQ6IGJvb2xlYW4pOiBUU3R5bGluZ0NvbnRleHQge1xuICBsZXQgY29udGV4dCA9IGlzQ2xhc3NCYXNlZCA/IHROb2RlLmNsYXNzZXMgOiB0Tm9kZS5zdHlsZXM7XG4gIGlmICghaXNTdHlsaW5nQ29udGV4dChjb250ZXh0KSkge1xuICAgIGNvbnN0IGhhc0RpcmVjdGl2ZXMgPSBpc0RpcmVjdGl2ZUhvc3QodE5vZGUpO1xuICAgIGNvbnRleHQgPSBhbGxvY1RTdHlsaW5nQ29udGV4dChjb250ZXh0IGFzIFN0eWxpbmdNYXBBcnJheSB8IG51bGwsIGhhc0RpcmVjdGl2ZXMpO1xuICAgIGlmIChuZ0Rldk1vZGUpIHtcbiAgICAgIGF0dGFjaFN0eWxpbmdEZWJ1Z09iamVjdChjb250ZXh0IGFzIFRTdHlsaW5nQ29udGV4dCwgdE5vZGUsIGlzQ2xhc3NCYXNlZCk7XG4gICAgfVxuXG4gICAgaWYgKGlzQ2xhc3NCYXNlZCkge1xuICAgICAgdE5vZGUuY2xhc3NlcyA9IGNvbnRleHQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIHROb2RlLnN0eWxlcyA9IGNvbnRleHQ7XG4gICAgfVxuICB9XG4gIHJldHVybiBjb250ZXh0IGFzIFRTdHlsaW5nQ29udGV4dDtcbn1cblxuZnVuY3Rpb24gcmVzb2x2ZVN0eWxlUHJvcFZhbHVlKFxuICAgIHZhbHVlOiBzdHJpbmcgfCBudW1iZXIgfCBTYWZlVmFsdWUgfCBudWxsIHwgTk9fQ0hBTkdFLFxuICAgIHN1ZmZpeDogc3RyaW5nIHwgbnVsbCB8IHVuZGVmaW5lZCk6IHN0cmluZ3xTYWZlVmFsdWV8bnVsbHx1bmRlZmluZWR8Tk9fQ0hBTkdFIHtcbiAgaWYgKHZhbHVlID09PSBOT19DSEFOR0UpIHJldHVybiB2YWx1ZTtcblxuICBsZXQgcmVzb2x2ZWRWYWx1ZTogc3RyaW5nfG51bGwgPSBudWxsO1xuICBpZiAoaXNTdHlsaW5nVmFsdWVEZWZpbmVkKHZhbHVlKSkge1xuICAgIGlmIChzdWZmaXgpIHtcbiAgICAgIC8vIHdoZW4gYSBzdWZmaXggaXMgYXBwbGllZCB0aGVuIGl0IHdpbGwgYnlwYXNzXG4gICAgICAvLyBzYW5pdGl6YXRpb24gZW50aXJlbHkgKGIvYyBhIG5ldyBzdHJpbmcgaXMgY3JlYXRlZClcbiAgICAgIHJlc29sdmVkVmFsdWUgPSByZW5kZXJTdHJpbmdpZnkodmFsdWUpICsgc3VmZml4O1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBzYW5pdGl6YXRpb24gaGFwcGVucyBieSBkZWFsaW5nIHdpdGggYSBzdHJpbmcgdmFsdWVcbiAgICAgIC8vIHRoaXMgbWVhbnMgdGhhdCB0aGUgc3RyaW5nIHZhbHVlIHdpbGwgYmUgcGFzc2VkIHRocm91Z2hcbiAgICAgIC8vIGludG8gdGhlIHN0eWxlIHJlbmRlcmluZyBsYXRlciAod2hpY2ggaXMgd2hlcmUgdGhlIHZhbHVlXG4gICAgICAvLyB3aWxsIGJlIHNhbml0aXplZCBiZWZvcmUgaXQgaXMgYXBwbGllZClcbiAgICAgIHJlc29sdmVkVmFsdWUgPSB2YWx1ZSBhcyBhbnkgYXMgc3RyaW5nO1xuICAgIH1cbiAgfVxuICByZXR1cm4gcmVzb2x2ZWRWYWx1ZTtcbn1cblxuLyoqXG4gKiBXaGV0aGVyIG9yIG5vdCB0aGUgc3R5bGUvY2xhc3MgYmluZGluZyBiZWluZyBhcHBsaWVkIHdhcyBleGVjdXRlZCB3aXRoaW4gYSBob3N0IGJpbmRpbmdzXG4gKiBmdW5jdGlvbi5cbiAqL1xuZnVuY3Rpb24gaXNIb3N0U3R5bGluZygpOiBib29sZWFuIHtcbiAgcmV0dXJuIGlzSG9zdFN0eWxpbmdBY3RpdmUoZ2V0QWN0aXZlRGlyZWN0aXZlSWQoKSk7XG59XG5cbmZ1bmN0aW9uIHBhdGNoSG9zdFN0eWxpbmdGbGFnKHROb2RlOiBUTm9kZSwgaG9zdEJpbmRpbmdzTW9kZTogYm9vbGVhbiwgaXNDbGFzc0Jhc2VkOiBib29sZWFuKSB7XG4gIGNvbnN0IGZsYWcgPSBob3N0QmluZGluZ3NNb2RlID9cbiAgICAgIGlzQ2xhc3NCYXNlZCA/IFROb2RlRmxhZ3MuaGFzSG9zdENsYXNzQmluZGluZ3MgOiBUTm9kZUZsYWdzLmhhc0hvc3RTdHlsZUJpbmRpbmdzIDpcbiAgICAgIGlzQ2xhc3NCYXNlZCA/IFROb2RlRmxhZ3MuaGFzVGVtcGxhdGVDbGFzc0JpbmRpbmdzIDogVE5vZGVGbGFncy5oYXNUZW1wbGF0ZVN0eWxlQmluZGluZ3M7XG4gIHBhdGNoQ29uZmlnKHROb2RlLCBmbGFnKTtcbn1cbiJdfQ==