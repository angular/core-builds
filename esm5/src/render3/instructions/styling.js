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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3R5bGluZy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvaW5zdHJ1Y3Rpb25zL3N0eWxpbmcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBU0EsT0FBTyxFQUFDLHlCQUF5QixFQUFDLE1BQU0sV0FBVyxDQUFDO0FBQ3BELE9BQU8sRUFBQyxvQkFBb0IsRUFBQyxNQUFNLHdCQUF3QixDQUFDO0FBSTVELE9BQU8sRUFBQyxlQUFlLEVBQUMsTUFBTSwyQkFBMkIsQ0FBQztBQUMxRCxPQUFPLEVBQVEsUUFBUSxFQUFFLEtBQUssRUFBQyxNQUFNLG9CQUFvQixDQUFDO0FBQzFELE9BQU8sRUFBQyxvQkFBb0IsRUFBRSxxQkFBcUIsRUFBRSx3QkFBd0IsRUFBRSxRQUFRLEVBQUUsZ0JBQWdCLEVBQUUscUJBQXFCLEVBQUUsZ0JBQWdCLEVBQUUsMEJBQTBCLEVBQUUsd0JBQXdCLEVBQUUsZ0JBQWdCLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFDNU8sT0FBTyxFQUFDLHVCQUF1QixFQUFFLHlCQUF5QixFQUFFLFlBQVksRUFBc0IscUJBQXFCLEVBQUUscUJBQXFCLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUN2SyxPQUFPLEVBQUMseUJBQXlCLEVBQUMsTUFBTSwrQkFBK0IsQ0FBQztBQUN4RSxPQUFPLEVBQUMsd0JBQXdCLEVBQUMsTUFBTSwwQkFBMEIsQ0FBQztBQUNsRSxPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sV0FBVyxDQUFDO0FBQ3BDLE9BQU8sRUFBQyxlQUFlLEVBQUMsTUFBTSxvQkFBb0IsQ0FBQztBQUNuRCxPQUFPLEVBQUMsbUJBQW1CLEVBQUUsb0JBQW9CLEVBQUUsb0JBQW9CLEVBQUUsa0JBQWtCLEVBQUUsWUFBWSxFQUFFLG9CQUFvQixFQUFFLG1CQUFtQixFQUFFLHNCQUFzQixFQUFFLGtCQUFrQixFQUFFLFFBQVEsRUFBRSxh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QUNMLHNEQUFzRDtZQUN0RCwwREFBMEQ7WUFDMUQsMkRBQTJEO1lBQzNELDBDQUEwQztZQUMxQyxhQUFhLEdBQUcsS0FBc0IsQ0FBQztTQUN4QztLQUNGO0lBQ0QsT0FBTyxhQUFhLENBQUM7QUFDdkIsQ0FBQztBQUVEOzs7R0FHRztBQUNILFNBQVMsYUFBYTtJQUNwQixPQUFPLG1CQUFtQixDQUFDLG9CQUFvQixFQUFFLENBQUMsQ0FBQztBQUNyRCxDQUFDO0FBRUQsU0FBUyxvQkFBb0IsQ0FBQyxLQUFZLEVBQUUsZ0JBQXlCLEVBQUUsWUFBcUI7SUFDMUYsSUFBTSxJQUFJLEdBQUcsZ0JBQWdCLENBQUMsQ0FBQztRQUMzQixZQUFZLENBQUMsQ0FBQyxpQ0FBaUMsQ0FBQyxrQ0FBZ0MsQ0FBQyxDQUFDO1FBQ2xGLFlBQVksQ0FBQyxDQUFDLHFDQUFxQyxDQUFDLHFDQUFvQyxDQUFDO0lBQzdGLFdBQVcsQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLENBQUM7QUFDM0IsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuKiBAbGljZW5zZVxuKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbipcbiogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuKi9cbmltcG9ydCB7U2FmZVZhbHVlfSBmcm9tICcuLi8uLi9zYW5pdGl6YXRpb24vYnlwYXNzJztcbmltcG9ydCB7U3R5bGVTYW5pdGl6ZUZufSBmcm9tICcuLi8uLi9zYW5pdGl6YXRpb24vc3R5bGVfc2FuaXRpemVyJztcbmltcG9ydCB7dGhyb3dFcnJvcklmTm9DaGFuZ2VzTW9kZX0gZnJvbSAnLi4vZXJyb3JzJztcbmltcG9ydCB7c2V0SW5wdXRzRm9yUHJvcGVydHl9IGZyb20gJy4uL2luc3RydWN0aW9ucy9zaGFyZWQnO1xuaW1wb3J0IHtBdHRyaWJ1dGVNYXJrZXIsIFRBdHRyaWJ1dGVzLCBUTm9kZSwgVE5vZGVGbGFncywgVE5vZGVUeXBlfSBmcm9tICcuLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtSRWxlbWVudH0gZnJvbSAnLi4vaW50ZXJmYWNlcy9yZW5kZXJlcic7XG5pbXBvcnQge1N0eWxpbmdNYXBBcnJheSwgU3R5bGluZ01hcEFycmF5SW5kZXgsIFRTdHlsaW5nQ29udGV4dH0gZnJvbSAnLi4vaW50ZXJmYWNlcy9zdHlsaW5nJztcbmltcG9ydCB7aXNEaXJlY3RpdmVIb3N0fSBmcm9tICcuLi9pbnRlcmZhY2VzL3R5cGVfY2hlY2tzJztcbmltcG9ydCB7TFZpZXcsIFJFTkRFUkVSLCBUVklFV30gZnJvbSAnLi4vaW50ZXJmYWNlcy92aWV3JztcbmltcG9ydCB7Z2V0QWN0aXZlRGlyZWN0aXZlSWQsIGdldENoZWNrTm9DaGFuZ2VzTW9kZSwgZ2V0Q3VycmVudFN0eWxlU2FuaXRpemVyLCBnZXRMVmlldywgZ2V0U2VsZWN0ZWRJbmRleCwgaW5jcmVtZW50QmluZGluZ0luZGV4LCBuZXh0QmluZGluZ0luZGV4LCByZXNldEN1cnJlbnRTdHlsZVNhbml0aXplciwgc2V0Q3VycmVudFN0eWxlU2FuaXRpemVyLCBzZXRFbGVtZW50RXhpdEZufSBmcm9tICcuLi9zdGF0ZSc7XG5pbXBvcnQge2FwcGx5U3R5bGluZ01hcERpcmVjdGx5LCBhcHBseVN0eWxpbmdWYWx1ZURpcmVjdGx5LCBmbHVzaFN0eWxpbmcsIHNldENsYXNzLCBzZXRTdHlsZSwgdXBkYXRlQ2xhc3NWaWFDb250ZXh0LCB1cGRhdGVTdHlsZVZpYUNvbnRleHR9IGZyb20gJy4uL3N0eWxpbmcvYmluZGluZ3MnO1xuaW1wb3J0IHthY3RpdmF0ZVN0eWxpbmdNYXBGZWF0dXJlfSBmcm9tICcuLi9zdHlsaW5nL21hcF9iYXNlZF9iaW5kaW5ncyc7XG5pbXBvcnQge2F0dGFjaFN0eWxpbmdEZWJ1Z09iamVjdH0gZnJvbSAnLi4vc3R5bGluZy9zdHlsaW5nX2RlYnVnJztcbmltcG9ydCB7Tk9fQ0hBTkdFfSBmcm9tICcuLi90b2tlbnMnO1xuaW1wb3J0IHtyZW5kZXJTdHJpbmdpZnl9IGZyb20gJy4uL3V0aWwvbWlzY191dGlscyc7XG5pbXBvcnQge2FkZEl0ZW1Ub1N0eWxpbmdNYXAsIGFsbG9jU3R5bGluZ01hcEFycmF5LCBhbGxvY1RTdHlsaW5nQ29udGV4dCwgYWxsb3dEaXJlY3RTdHlsaW5nLCBjb25jYXRTdHJpbmcsIGZvcmNlQ2xhc3Nlc0FzU3RyaW5nLCBmb3JjZVN0eWxlc0FzU3RyaW5nLCBnZXRJbml0aWFsU3R5bGluZ1ZhbHVlLCBnZXRTdHlsaW5nTWFwQXJyYXksIGdldFZhbHVlLCBoYXNDbGFzc0lucHV0LCBoYXNTdHlsZUlucHV0LCBoYXNWYWx1ZUNoYW5nZWQsIGhhc1ZhbHVlQ2hhbmdlZFVud3JhcFNhZmVWYWx1ZSwgaXNIb3N0U3R5bGluZ0FjdGl2ZSwgaXNTdHlsaW5nQ29udGV4dCwgaXNTdHlsaW5nVmFsdWVEZWZpbmVkLCBub3JtYWxpemVJbnRvU3R5bGluZ01hcCwgcGF0Y2hDb25maWcsIHNlbGVjdENsYXNzQmFzZWRJbnB1dE5hbWUsIHNldFZhbHVlLCBzdHlsaW5nTWFwVG9TdHJpbmd9IGZyb20gJy4uL3V0aWwvc3R5bGluZ191dGlscyc7XG5pbXBvcnQge2dldE5hdGl2ZUJ5VE5vZGUsIGdldFROb2RlfSBmcm9tICcuLi91dGlsL3ZpZXdfdXRpbHMnO1xuXG5cblxuLyoqXG4gKiAtLS0tLS0tLVxuICpcbiAqIFRoaXMgZmlsZSBjb250YWlucyB0aGUgY29yZSBsb2dpYyBmb3IgaG93IHN0eWxpbmcgaW5zdHJ1Y3Rpb25zIGFyZSBwcm9jZXNzZWQgaW4gQW5ndWxhci5cbiAqXG4gKiBUbyBsZWFybiBtb3JlIGFib3V0IHRoZSBhbGdvcml0aG0gc2VlIGBUU3R5bGluZ0NvbnRleHRgLlxuICpcbiAqIC0tLS0tLS0tXG4gKi9cblxuLyoqXG4gKiBTZXRzIHRoZSBjdXJyZW50IHN0eWxlIHNhbml0aXplciBmdW5jdGlvbiB3aGljaCB3aWxsIHRoZW4gYmUgdXNlZFxuICogd2l0aGluIGFsbCBmb2xsb3ctdXAgcHJvcCBhbmQgbWFwLWJhc2VkIHN0eWxlIGJpbmRpbmcgaW5zdHJ1Y3Rpb25zXG4gKiBmb3IgdGhlIGdpdmVuIGVsZW1lbnQuXG4gKlxuICogTm90ZSB0aGF0IG9uY2Ugc3R5bGluZyBoYXMgYmVlbiBhcHBsaWVkIHRvIHRoZSBlbGVtZW50IChpLmUuIG9uY2VcbiAqIGBhZHZhbmNlKG4pYCBpcyBleGVjdXRlZCBvciB0aGUgaG9zdEJpbmRpbmdzL3RlbXBsYXRlIGZ1bmN0aW9uIGV4aXRzKVxuICogdGhlbiB0aGUgYWN0aXZlIGBzYW5pdGl6ZXJGbmAgd2lsbCBiZSBzZXQgdG8gYG51bGxgLiBUaGlzIG1lYW5zIHRoYXRcbiAqIG9uY2Ugc3R5bGluZyBpcyBhcHBsaWVkIHRvIGFub3RoZXIgZWxlbWVudCB0aGVuIGEgYW5vdGhlciBjYWxsIHRvXG4gKiBgc3R5bGVTYW5pdGl6ZXJgIHdpbGwgbmVlZCB0byBiZSBtYWRlLlxuICpcbiAqIEBwYXJhbSBzYW5pdGl6ZXJGbiBUaGUgc2FuaXRpemF0aW9uIGZ1bmN0aW9uIHRoYXQgd2lsbCBiZSB1c2VkIHRvXG4gKiAgICAgICBwcm9jZXNzIHN0eWxlIHByb3AvdmFsdWUgZW50cmllcy5cbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtXN0eWxlU2FuaXRpemVyKHNhbml0aXplcjogU3R5bGVTYW5pdGl6ZUZuIHwgbnVsbCk6IHZvaWQge1xuICBzZXRDdXJyZW50U3R5bGVTYW5pdGl6ZXIoc2FuaXRpemVyKTtcbn1cblxuLyoqXG4gKiBVcGRhdGUgYSBzdHlsZSBiaW5kaW5nIG9uIGFuIGVsZW1lbnQgd2l0aCB0aGUgcHJvdmlkZWQgdmFsdWUuXG4gKlxuICogSWYgdGhlIHN0eWxlIHZhbHVlIGlzIGZhbHN5IHRoZW4gaXQgd2lsbCBiZSByZW1vdmVkIGZyb20gdGhlIGVsZW1lbnRcbiAqIChvciBhc3NpZ25lZCBhIGRpZmZlcmVudCB2YWx1ZSBkZXBlbmRpbmcgaWYgdGhlcmUgYXJlIGFueSBzdHlsZXMgcGxhY2VkXG4gKiBvbiB0aGUgZWxlbWVudCB3aXRoIGBzdHlsZU1hcGAgb3IgYW55IHN0YXRpYyBzdHlsZXMgdGhhdCBhcmVcbiAqIHByZXNlbnQgZnJvbSB3aGVuIHRoZSBlbGVtZW50IHdhcyBjcmVhdGVkIHdpdGggYHN0eWxpbmdgKS5cbiAqXG4gKiBOb3RlIHRoYXQgdGhlIHN0eWxpbmcgZWxlbWVudCBpcyB1cGRhdGVkIGFzIHBhcnQgb2YgYHN0eWxpbmdBcHBseWAuXG4gKlxuICogQHBhcmFtIHByb3AgQSB2YWxpZCBDU1MgcHJvcGVydHkuXG4gKiBAcGFyYW0gdmFsdWUgTmV3IHZhbHVlIHRvIHdyaXRlIChgbnVsbGAgb3IgYW4gZW1wdHkgc3RyaW5nIHRvIHJlbW92ZSkuXG4gKiBAcGFyYW0gc3VmZml4IE9wdGlvbmFsIHN1ZmZpeC4gVXNlZCB3aXRoIHNjYWxhciB2YWx1ZXMgdG8gYWRkIHVuaXQgc3VjaCBhcyBgcHhgLlxuICogICAgICAgIE5vdGUgdGhhdCB3aGVuIGEgc3VmZml4IGlzIHByb3ZpZGVkIHRoZW4gdGhlIHVuZGVybHlpbmcgc2FuaXRpemVyIHdpbGxcbiAqICAgICAgICBiZSBpZ25vcmVkLlxuICpcbiAqIE5vdGUgdGhhdCB0aGlzIHdpbGwgYXBwbHkgdGhlIHByb3ZpZGVkIHN0eWxlIHZhbHVlIHRvIHRoZSBob3N0IGVsZW1lbnQgaWYgdGhpcyBmdW5jdGlvbiBpcyBjYWxsZWRcbiAqIHdpdGhpbiBhIGhvc3QgYmluZGluZyBmdW5jdGlvbi5cbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtXN0eWxlUHJvcChcbiAgICBwcm9wOiBzdHJpbmcsIHZhbHVlOiBzdHJpbmcgfCBudW1iZXIgfCBTYWZlVmFsdWUgfCBudWxsLCBzdWZmaXg/OiBzdHJpbmcgfCBudWxsKTogdm9pZCB7XG4gIHN0eWxlUHJvcEludGVybmFsKGdldFNlbGVjdGVkSW5kZXgoKSwgcHJvcCwgdmFsdWUsIHN1ZmZpeCk7XG59XG5cbi8qKlxuICogSW50ZXJuYWwgZnVuY3Rpb24gZm9yIGFwcGx5aW5nIGEgc2luZ2xlIHN0eWxlIHRvIGFuIGVsZW1lbnQuXG4gKlxuICogVGhlIHJlYXNvbiB3aHkgdGhpcyBmdW5jdGlvbiBoYXMgYmVlbiBzZXBhcmF0ZWQgZnJvbSBgybXJtXN0eWxlUHJvcGAgaXMgYmVjYXVzZVxuICogaXQgaXMgYWxzbyBjYWxsZWQgZnJvbSBgybXJtXN0eWxlUHJvcEludGVycG9sYXRlYC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHN0eWxlUHJvcEludGVybmFsKFxuICAgIGVsZW1lbnRJbmRleDogbnVtYmVyLCBwcm9wOiBzdHJpbmcsIHZhbHVlOiBzdHJpbmcgfCBudW1iZXIgfCBTYWZlVmFsdWUgfCBudWxsLFxuICAgIHN1ZmZpeD86IHN0cmluZyB8IG51bGwgfCB1bmRlZmluZWQpOiB2b2lkIHtcbiAgLy8gaWYgYSB2YWx1ZSBpcyBpbnRlcnBvbGF0ZWQgdGhlbiBpdCBtYXkgcmVuZGVyIGEgYE5PX0NIQU5HRWAgdmFsdWUuXG4gIC8vIGluIHRoaXMgY2FzZSB3ZSBkbyBub3QgbmVlZCB0byBkbyBhbnl0aGluZywgYnV0IHRoZSBiaW5kaW5nIGluZGV4XG4gIC8vIHN0aWxsIG5lZWRzIHRvIGJlIGluY3JlbWVudGVkIGJlY2F1c2UgYWxsIHN0eWxpbmcgYmluZGluZyB2YWx1ZXNcbiAgLy8gYXJlIHN0b3JlZCBpbnNpZGUgb2YgdGhlIGxWaWV3LlxuICBjb25zdCBiaW5kaW5nSW5kZXggPSBuZXh0QmluZGluZ0luZGV4KCk7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgdE5vZGUgPSBnZXRUTm9kZShlbGVtZW50SW5kZXgsIGxWaWV3KTtcbiAgY29uc3QgZmlyc3RVcGRhdGVQYXNzID0gbFZpZXdbVFZJRVddLmZpcnN0VXBkYXRlUGFzcztcblxuICAvLyB3ZSBjaGVjayBmb3IgdGhpcyBpbiB0aGUgaW5zdHJ1Y3Rpb24gY29kZSBzbyB0aGF0IHRoZSBjb250ZXh0IGNhbiBiZSBub3RpZmllZFxuICAvLyBhYm91dCBwcm9wIG9yIG1hcCBiaW5kaW5ncyBzbyB0aGF0IHRoZSBkaXJlY3QgYXBwbHkgY2hlY2sgY2FuIGRlY2lkZSBlYXJsaWVyXG4gIC8vIGlmIGl0IGFsbG93cyBmb3IgY29udGV4dCByZXNvbHV0aW9uIHRvIGJlIGJ5cGFzc2VkLlxuICBpZiAoZmlyc3RVcGRhdGVQYXNzKSB7XG4gICAgcGF0Y2hDb25maWcodE5vZGUsIFROb2RlRmxhZ3MuaGFzU3R5bGVQcm9wQmluZGluZ3MpO1xuICAgIHBhdGNoSG9zdFN0eWxpbmdGbGFnKHROb2RlLCBpc0hvc3RTdHlsaW5nKCksIGZhbHNlKTtcbiAgfVxuXG4gIGNvbnN0IHVwZGF0ZWQgPSBzdHlsaW5nUHJvcChcbiAgICAgIHROb2RlLCBmaXJzdFVwZGF0ZVBhc3MsIGxWaWV3LCBiaW5kaW5nSW5kZXgsIHByb3AsIHJlc29sdmVTdHlsZVByb3BWYWx1ZSh2YWx1ZSwgc3VmZml4KSxcbiAgICAgIGZhbHNlKTtcbiAgaWYgKG5nRGV2TW9kZSkge1xuICAgIG5nRGV2TW9kZS5zdHlsZVByb3ArKztcbiAgICBpZiAodXBkYXRlZCkge1xuICAgICAgbmdEZXZNb2RlLnN0eWxlUHJvcENhY2hlTWlzcysrO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIFVwZGF0ZSBhIGNsYXNzIGJpbmRpbmcgb24gYW4gZWxlbWVudCB3aXRoIHRoZSBwcm92aWRlZCB2YWx1ZS5cbiAqXG4gKiBUaGlzIGluc3RydWN0aW9uIGlzIG1lYW50IHRvIGhhbmRsZSB0aGUgYFtjbGFzcy5mb29dPVwiZXhwXCJgIGNhc2UgYW5kLFxuICogdGhlcmVmb3JlLCB0aGUgY2xhc3MgYmluZGluZyBpdHNlbGYgbXVzdCBhbHJlYWR5IGJlIGFsbG9jYXRlZCB1c2luZ1xuICogYHN0eWxpbmdgIHdpdGhpbiB0aGUgY3JlYXRpb24gYmxvY2suXG4gKlxuICogQHBhcmFtIHByb3AgQSB2YWxpZCBDU1MgY2xhc3MgKG9ubHkgb25lKS5cbiAqIEBwYXJhbSB2YWx1ZSBBIHRydWUvZmFsc2UgdmFsdWUgd2hpY2ggd2lsbCB0dXJuIHRoZSBjbGFzcyBvbiBvciBvZmYuXG4gKlxuICogTm90ZSB0aGF0IHRoaXMgd2lsbCBhcHBseSB0aGUgcHJvdmlkZWQgY2xhc3MgdmFsdWUgdG8gdGhlIGhvc3QgZWxlbWVudCBpZiB0aGlzIGZ1bmN0aW9uXG4gKiBpcyBjYWxsZWQgd2l0aGluIGEgaG9zdCBiaW5kaW5nIGZ1bmN0aW9uLlxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1Y2xhc3NQcm9wKGNsYXNzTmFtZTogc3RyaW5nLCB2YWx1ZTogYm9vbGVhbiB8IG51bGwpOiB2b2lkIHtcbiAgLy8gaWYgYSB2YWx1ZSBpcyBpbnRlcnBvbGF0ZWQgdGhlbiBpdCBtYXkgcmVuZGVyIGEgYE5PX0NIQU5HRWAgdmFsdWUuXG4gIC8vIGluIHRoaXMgY2FzZSB3ZSBkbyBub3QgbmVlZCB0byBkbyBhbnl0aGluZywgYnV0IHRoZSBiaW5kaW5nIGluZGV4XG4gIC8vIHN0aWxsIG5lZWRzIHRvIGJlIGluY3JlbWVudGVkIGJlY2F1c2UgYWxsIHN0eWxpbmcgYmluZGluZyB2YWx1ZXNcbiAgLy8gYXJlIHN0b3JlZCBpbnNpZGUgb2YgdGhlIGxWaWV3LlxuICBjb25zdCBiaW5kaW5nSW5kZXggPSBuZXh0QmluZGluZ0luZGV4KCk7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgZWxlbWVudEluZGV4ID0gZ2V0U2VsZWN0ZWRJbmRleCgpO1xuICBjb25zdCB0Tm9kZSA9IGdldFROb2RlKGVsZW1lbnRJbmRleCwgbFZpZXcpO1xuICBjb25zdCBmaXJzdFVwZGF0ZVBhc3MgPSBsVmlld1tUVklFV10uZmlyc3RVcGRhdGVQYXNzO1xuXG4gIC8vIHdlIGNoZWNrIGZvciB0aGlzIGluIHRoZSBpbnN0cnVjdGlvbiBjb2RlIHNvIHRoYXQgdGhlIGNvbnRleHQgY2FuIGJlIG5vdGlmaWVkXG4gIC8vIGFib3V0IHByb3Agb3IgbWFwIGJpbmRpbmdzIHNvIHRoYXQgdGhlIGRpcmVjdCBhcHBseSBjaGVjayBjYW4gZGVjaWRlIGVhcmxpZXJcbiAgLy8gaWYgaXQgYWxsb3dzIGZvciBjb250ZXh0IHJlc29sdXRpb24gdG8gYmUgYnlwYXNzZWQuXG4gIGlmIChmaXJzdFVwZGF0ZVBhc3MpIHtcbiAgICBwYXRjaENvbmZpZyh0Tm9kZSwgVE5vZGVGbGFncy5oYXNDbGFzc1Byb3BCaW5kaW5ncyk7XG4gICAgcGF0Y2hIb3N0U3R5bGluZ0ZsYWcodE5vZGUsIGlzSG9zdFN0eWxpbmcoKSwgdHJ1ZSk7XG4gIH1cblxuICBjb25zdCB1cGRhdGVkID0gc3R5bGluZ1Byb3AodE5vZGUsIGZpcnN0VXBkYXRlUGFzcywgbFZpZXcsIGJpbmRpbmdJbmRleCwgY2xhc3NOYW1lLCB2YWx1ZSwgdHJ1ZSk7XG4gIGlmIChuZ0Rldk1vZGUpIHtcbiAgICBuZ0Rldk1vZGUuY2xhc3NQcm9wKys7XG4gICAgaWYgKHVwZGF0ZWQpIHtcbiAgICAgIG5nRGV2TW9kZS5jbGFzc1Byb3BDYWNoZU1pc3MrKztcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBTaGFyZWQgZnVuY3Rpb24gdXNlZCB0byB1cGRhdGUgYSBwcm9wLWJhc2VkIHN0eWxpbmcgYmluZGluZyBmb3IgYW4gZWxlbWVudC5cbiAqXG4gKiBEZXBlbmRpbmcgb24gdGhlIHN0YXRlIG9mIHRoZSBgdE5vZGUuc3R5bGVzYCBzdHlsZXMgY29udGV4dCwgdGhlIHN0eWxlL3Byb3BcbiAqIHZhbHVlIG1heSBiZSBhcHBsaWVkIGRpcmVjdGx5IHRvIHRoZSBlbGVtZW50IGluc3RlYWQgb2YgYmVpbmcgcHJvY2Vzc2VkXG4gKiB0aHJvdWdoIHRoZSBjb250ZXh0LiBUaGUgcmVhc29uIHdoeSB0aGlzIG9jY3VycyBpcyBmb3IgcGVyZm9ybWFuY2UgYW5kIGZ1bGx5XG4gKiBkZXBlbmRzIG9uIHRoZSBzdGF0ZSBvZiB0aGUgY29udGV4dCAoaS5lLiB3aGV0aGVyIG9yIG5vdCB0aGVyZSBhcmUgZHVwbGljYXRlXG4gKiBiaW5kaW5ncyBvciB3aGV0aGVyIG9yIG5vdCB0aGVyZSBhcmUgbWFwLWJhc2VkIGJpbmRpbmdzIGFuZCBwcm9wZXJ0eSBiaW5kaW5nc1xuICogcHJlc2VudCB0b2dldGhlcikuXG4gKi9cbmZ1bmN0aW9uIHN0eWxpbmdQcm9wKFxuICAgIHROb2RlOiBUTm9kZSwgZmlyc3RVcGRhdGVQYXNzOiBib29sZWFuLCBsVmlldzogTFZpZXcsIGJpbmRpbmdJbmRleDogbnVtYmVyLCBwcm9wOiBzdHJpbmcsXG4gICAgdmFsdWU6IGJvb2xlYW4gfCBudW1iZXIgfCBTYWZlVmFsdWUgfCBzdHJpbmcgfCBudWxsIHwgdW5kZWZpbmVkIHwgTk9fQ0hBTkdFLFxuICAgIGlzQ2xhc3NCYXNlZDogYm9vbGVhbik6IGJvb2xlYW4ge1xuICBsZXQgdXBkYXRlZCA9IGZhbHNlO1xuXG4gIGNvbnN0IG5hdGl2ZSA9IGdldE5hdGl2ZUJ5VE5vZGUodE5vZGUsIGxWaWV3KSBhcyBSRWxlbWVudDtcbiAgY29uc3QgY29udGV4dCA9IGlzQ2xhc3NCYXNlZCA/IGdldENsYXNzZXNDb250ZXh0KHROb2RlKSA6IGdldFN0eWxlc0NvbnRleHQodE5vZGUpO1xuICBjb25zdCBzYW5pdGl6ZXIgPSBpc0NsYXNzQmFzZWQgPyBudWxsIDogZ2V0Q3VycmVudFN0eWxlU2FuaXRpemVyKCk7XG5cbiAgLy8gW3N0eWxlLnByb3BdIGFuZCBbY2xhc3MubmFtZV0gYmluZGluZ3MgZG8gbm90IHVzZSBgYmluZCgpYCBhbmQgd2lsbFxuICAvLyB0aGVyZWZvcmUgbWFuYWdlIGFjY2Vzc2luZyBhbmQgdXBkYXRpbmcgdGhlIG5ldyB2YWx1ZSBpbiB0aGUgbFZpZXcgZGlyZWN0bHkuXG4gIC8vIEZvciB0aGlzIHJlYXNvbiwgdGhlIGNoZWNrTm9DaGFuZ2VzIHNpdHVhdGlvbiBtdXN0IGFsc28gYmUgaGFuZGxlZCBoZXJlXG4gIC8vIGFzIHdlbGwuXG4gIGlmIChuZ0Rldk1vZGUgJiYgZ2V0Q2hlY2tOb0NoYW5nZXNNb2RlKCkpIHtcbiAgICBjb25zdCBvbGRWYWx1ZSA9IGdldFZhbHVlKGxWaWV3LCBiaW5kaW5nSW5kZXgpO1xuICAgIGlmIChoYXNWYWx1ZUNoYW5nZWRVbndyYXBTYWZlVmFsdWUob2xkVmFsdWUsIHZhbHVlKSkge1xuICAgICAgdGhyb3dFcnJvcklmTm9DaGFuZ2VzTW9kZShmYWxzZSwgb2xkVmFsdWUsIHZhbHVlKTtcbiAgICB9XG4gIH1cblxuICAvLyBEaXJlY3QgQXBwbHkgQ2FzZTogYnlwYXNzIGNvbnRleHQgcmVzb2x1dGlvbiBhbmQgYXBwbHkgdGhlXG4gIC8vIHN0eWxlL2NsYXNzIHZhbHVlIGRpcmVjdGx5IHRvIHRoZSBlbGVtZW50XG4gIGlmIChhbGxvd0RpcmVjdFN0eWxpbmcodE5vZGUsIGlzQ2xhc3NCYXNlZCwgZmlyc3RVcGRhdGVQYXNzKSkge1xuICAgIGNvbnN0IHNhbml0aXplclRvVXNlID0gaXNDbGFzc0Jhc2VkID8gbnVsbCA6IHNhbml0aXplcjtcbiAgICBjb25zdCByZW5kZXJlciA9IGdldFJlbmRlcmVyKHROb2RlLCBsVmlldyk7XG4gICAgdXBkYXRlZCA9IGFwcGx5U3R5bGluZ1ZhbHVlRGlyZWN0bHkoXG4gICAgICAgIHJlbmRlcmVyLCBjb250ZXh0LCB0Tm9kZSwgbmF0aXZlLCBsVmlldywgYmluZGluZ0luZGV4LCBwcm9wLCB2YWx1ZSwgaXNDbGFzc0Jhc2VkLFxuICAgICAgICBzYW5pdGl6ZXJUb1VzZSk7XG5cbiAgICBpZiAoc2FuaXRpemVyVG9Vc2UpIHtcbiAgICAgIC8vIGl0J3MgaW1wb3J0YW50IHdlIHJlbW92ZSB0aGUgY3VycmVudCBzdHlsZSBzYW5pdGl6ZXIgb25jZSB0aGVcbiAgICAgIC8vIGVsZW1lbnQgZXhpdHMsIG90aGVyd2lzZSBpdCB3aWxsIGJlIHVzZWQgYnkgdGhlIG5leHQgc3R5bGluZ1xuICAgICAgLy8gaW5zdHJ1Y3Rpb25zIGZvciB0aGUgbmV4dCBlbGVtZW50LlxuICAgICAgc2V0RWxlbWVudEV4aXRGbihzdHlsaW5nQXBwbHkpO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICAvLyBDb250ZXh0IFJlc29sdXRpb24gKG9yIGZpcnN0IHVwZGF0ZSkgQ2FzZTogc2F2ZSB0aGUgdmFsdWVcbiAgICAvLyBhbmQgZGVmZXIgdG8gdGhlIGNvbnRleHQgdG8gZmx1c2ggYW5kIGFwcGx5IHRoZSBzdHlsZS9jbGFzcyBiaW5kaW5nXG4gICAgLy8gdmFsdWUgdG8gdGhlIGVsZW1lbnQuXG4gICAgY29uc3QgZGlyZWN0aXZlSW5kZXggPSBnZXRBY3RpdmVEaXJlY3RpdmVJZCgpO1xuICAgIGlmIChpc0NsYXNzQmFzZWQpIHtcbiAgICAgIHVwZGF0ZWQgPSB1cGRhdGVDbGFzc1ZpYUNvbnRleHQoXG4gICAgICAgICAgY29udGV4dCwgdE5vZGUsIGxWaWV3LCBuYXRpdmUsIGRpcmVjdGl2ZUluZGV4LCBwcm9wLCBiaW5kaW5nSW5kZXgsXG4gICAgICAgICAgdmFsdWUgYXMgc3RyaW5nIHwgYm9vbGVhbiB8IG51bGwsIGZhbHNlLCBmaXJzdFVwZGF0ZVBhc3MpO1xuICAgIH0gZWxzZSB7XG4gICAgICB1cGRhdGVkID0gdXBkYXRlU3R5bGVWaWFDb250ZXh0KFxuICAgICAgICAgIGNvbnRleHQsIHROb2RlLCBsVmlldywgbmF0aXZlLCBkaXJlY3RpdmVJbmRleCwgcHJvcCwgYmluZGluZ0luZGV4LFxuICAgICAgICAgIHZhbHVlIGFzIHN0cmluZyB8IFNhZmVWYWx1ZSB8IG51bGwsIHNhbml0aXplciwgZmFsc2UsIGZpcnN0VXBkYXRlUGFzcyk7XG4gICAgfVxuXG4gICAgc2V0RWxlbWVudEV4aXRGbihzdHlsaW5nQXBwbHkpO1xuICB9XG5cbiAgcmV0dXJuIHVwZGF0ZWQ7XG59XG5cbi8qKlxuICogVXBkYXRlIHN0eWxlIGJpbmRpbmdzIHVzaW5nIGFuIG9iamVjdCBsaXRlcmFsIG9uIGFuIGVsZW1lbnQuXG4gKlxuICogVGhpcyBpbnN0cnVjdGlvbiBpcyBtZWFudCB0byBhcHBseSBzdHlsaW5nIHZpYSB0aGUgYFtzdHlsZV09XCJleHBcImAgdGVtcGxhdGUgYmluZGluZ3MuXG4gKiBXaGVuIHN0eWxlcyBhcmUgYXBwbGllZCB0byB0aGUgZWxlbWVudCB0aGV5IHdpbGwgdGhlbiBiZSB1cGRhdGVkIHdpdGggcmVzcGVjdCB0b1xuICogYW55IHN0eWxlcy9jbGFzc2VzIHNldCB2aWEgYHN0eWxlUHJvcGAuIElmIGFueSBzdHlsZXMgYXJlIHNldCB0byBmYWxzeVxuICogdGhlbiB0aGV5IHdpbGwgYmUgcmVtb3ZlZCBmcm9tIHRoZSBlbGVtZW50LlxuICpcbiAqIE5vdGUgdGhhdCB0aGUgc3R5bGluZyBpbnN0cnVjdGlvbiB3aWxsIG5vdCBiZSBhcHBsaWVkIHVudGlsIGBzdHlsaW5nQXBwbHlgIGlzIGNhbGxlZC5cbiAqXG4gKiBAcGFyYW0gc3R5bGVzIEEga2V5L3ZhbHVlIHN0eWxlIG1hcCBvZiB0aGUgc3R5bGVzIHRoYXQgd2lsbCBiZSBhcHBsaWVkIHRvIHRoZSBnaXZlbiBlbGVtZW50LlxuICogICAgICAgIEFueSBtaXNzaW5nIHN0eWxlcyAodGhhdCBoYXZlIGFscmVhZHkgYmVlbiBhcHBsaWVkIHRvIHRoZSBlbGVtZW50IGJlZm9yZWhhbmQpIHdpbGwgYmVcbiAqICAgICAgICByZW1vdmVkICh1bnNldCkgZnJvbSB0aGUgZWxlbWVudCdzIHN0eWxpbmcuXG4gKlxuICogTm90ZSB0aGF0IHRoaXMgd2lsbCBhcHBseSB0aGUgcHJvdmlkZWQgc3R5bGVNYXAgdmFsdWUgdG8gdGhlIGhvc3QgZWxlbWVudCBpZiB0aGlzIGZ1bmN0aW9uXG4gKiBpcyBjYWxsZWQgd2l0aGluIGEgaG9zdCBiaW5kaW5nLlxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1c3R5bGVNYXAoc3R5bGVzOiB7W3N0eWxlTmFtZTogc3RyaW5nXTogYW55fSB8IE5PX0NIQU5HRSB8IG51bGwpOiB2b2lkIHtcbiAgY29uc3QgaW5kZXggPSBnZXRTZWxlY3RlZEluZGV4KCk7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgdE5vZGUgPSBnZXRUTm9kZShpbmRleCwgbFZpZXcpO1xuICBjb25zdCBmaXJzdFVwZGF0ZVBhc3MgPSBsVmlld1tUVklFV10uZmlyc3RVcGRhdGVQYXNzO1xuICBjb25zdCBjb250ZXh0ID0gZ2V0U3R5bGVzQ29udGV4dCh0Tm9kZSk7XG4gIGNvbnN0IGhhc0RpcmVjdGl2ZUlucHV0ID0gaGFzU3R5bGVJbnB1dCh0Tm9kZSk7XG5cbiAgLy8gaWYgYSB2YWx1ZSBpcyBpbnRlcnBvbGF0ZWQgdGhlbiBpdCBtYXkgcmVuZGVyIGEgYE5PX0NIQU5HRWAgdmFsdWUuXG4gIC8vIGluIHRoaXMgY2FzZSB3ZSBkbyBub3QgbmVlZCB0byBkbyBhbnl0aGluZywgYnV0IHRoZSBiaW5kaW5nIGluZGV4XG4gIC8vIHN0aWxsIG5lZWRzIHRvIGJlIGluY3JlbWVudGVkIGJlY2F1c2UgYWxsIHN0eWxpbmcgYmluZGluZyB2YWx1ZXNcbiAgLy8gYXJlIHN0b3JlZCBpbnNpZGUgb2YgdGhlIGxWaWV3LlxuICBjb25zdCBiaW5kaW5nSW5kZXggPSBpbmNyZW1lbnRCaW5kaW5nSW5kZXgoMik7XG4gIGNvbnN0IGhvc3RCaW5kaW5nc01vZGUgPSBpc0hvc3RTdHlsaW5nKCk7XG5cbiAgLy8gaW5wdXRzIGFyZSBvbmx5IGV2YWx1YXRlZCBmcm9tIGEgdGVtcGxhdGUgYmluZGluZyBpbnRvIGEgZGlyZWN0aXZlLCB0aGVyZWZvcmUsXG4gIC8vIHRoZXJlIHNob3VsZCBub3QgYmUgYSBzaXR1YXRpb24gd2hlcmUgYSBkaXJlY3RpdmUgaG9zdCBiaW5kaW5ncyBmdW5jdGlvblxuICAvLyBldmFsdWF0ZXMgdGhlIGlucHV0cyAodGhpcyBzaG91bGQgb25seSBoYXBwZW4gaW4gdGhlIHRlbXBsYXRlIGZ1bmN0aW9uKVxuICBpZiAoIWhvc3RCaW5kaW5nc01vZGUgJiYgaGFzRGlyZWN0aXZlSW5wdXQgJiYgc3R5bGVzICE9PSBOT19DSEFOR0UpIHtcbiAgICB1cGRhdGVEaXJlY3RpdmVJbnB1dFZhbHVlKGNvbnRleHQsIGxWaWV3LCB0Tm9kZSwgYmluZGluZ0luZGV4LCBzdHlsZXMsIGZhbHNlLCBmaXJzdFVwZGF0ZVBhc3MpO1xuICAgIHN0eWxlcyA9IE5PX0NIQU5HRTtcbiAgfVxuXG4gIC8vIHdlIGNoZWNrIGZvciB0aGlzIGluIHRoZSBpbnN0cnVjdGlvbiBjb2RlIHNvIHRoYXQgdGhlIGNvbnRleHQgY2FuIGJlIG5vdGlmaWVkXG4gIC8vIGFib3V0IHByb3Agb3IgbWFwIGJpbmRpbmdzIHNvIHRoYXQgdGhlIGRpcmVjdCBhcHBseSBjaGVjayBjYW4gZGVjaWRlIGVhcmxpZXJcbiAgLy8gaWYgaXQgYWxsb3dzIGZvciBjb250ZXh0IHJlc29sdXRpb24gdG8gYmUgYnlwYXNzZWQuXG4gIGlmIChmaXJzdFVwZGF0ZVBhc3MpIHtcbiAgICBwYXRjaENvbmZpZyh0Tm9kZSwgVE5vZGVGbGFncy5oYXNTdHlsZU1hcEJpbmRpbmdzKTtcbiAgICBwYXRjaEhvc3RTdHlsaW5nRmxhZyh0Tm9kZSwgaXNIb3N0U3R5bGluZygpLCBmYWxzZSk7XG4gIH1cblxuICBzdHlsaW5nTWFwKFxuICAgICAgY29udGV4dCwgdE5vZGUsIGZpcnN0VXBkYXRlUGFzcywgbFZpZXcsIGJpbmRpbmdJbmRleCwgc3R5bGVzLCBmYWxzZSwgaGFzRGlyZWN0aXZlSW5wdXQpO1xufVxuXG4vKipcbiAqIFVwZGF0ZSBjbGFzcyBiaW5kaW5ncyB1c2luZyBhbiBvYmplY3QgbGl0ZXJhbCBvciBjbGFzcy1zdHJpbmcgb24gYW4gZWxlbWVudC5cbiAqXG4gKiBUaGlzIGluc3RydWN0aW9uIGlzIG1lYW50IHRvIGFwcGx5IHN0eWxpbmcgdmlhIHRoZSBgW2NsYXNzXT1cImV4cFwiYCB0ZW1wbGF0ZSBiaW5kaW5ncy5cbiAqIFdoZW4gY2xhc3NlcyBhcmUgYXBwbGllZCB0byB0aGUgZWxlbWVudCB0aGV5IHdpbGwgdGhlbiBiZSB1cGRhdGVkIHdpdGhcbiAqIHJlc3BlY3QgdG8gYW55IHN0eWxlcy9jbGFzc2VzIHNldCB2aWEgYGNsYXNzUHJvcGAuIElmIGFueVxuICogY2xhc3NlcyBhcmUgc2V0IHRvIGZhbHN5IHRoZW4gdGhleSB3aWxsIGJlIHJlbW92ZWQgZnJvbSB0aGUgZWxlbWVudC5cbiAqXG4gKiBOb3RlIHRoYXQgdGhlIHN0eWxpbmcgaW5zdHJ1Y3Rpb24gd2lsbCBub3QgYmUgYXBwbGllZCB1bnRpbCBgc3R5bGluZ0FwcGx5YCBpcyBjYWxsZWQuXG4gKiBOb3RlIHRoYXQgdGhpcyB3aWxsIHRoZSBwcm92aWRlZCBjbGFzc01hcCB2YWx1ZSB0byB0aGUgaG9zdCBlbGVtZW50IGlmIHRoaXMgZnVuY3Rpb24gaXMgY2FsbGVkXG4gKiB3aXRoaW4gYSBob3N0IGJpbmRpbmcuXG4gKlxuICogQHBhcmFtIGNsYXNzZXMgQSBrZXkvdmFsdWUgbWFwIG9yIHN0cmluZyBvZiBDU1MgY2xhc3NlcyB0aGF0IHdpbGwgYmUgYWRkZWQgdG8gdGhlXG4gKiAgICAgICAgZ2l2ZW4gZWxlbWVudC4gQW55IG1pc3NpbmcgY2xhc3NlcyAodGhhdCBoYXZlIGFscmVhZHkgYmVlbiBhcHBsaWVkIHRvIHRoZSBlbGVtZW50XG4gKiAgICAgICAgYmVmb3JlaGFuZCkgd2lsbCBiZSByZW1vdmVkICh1bnNldCkgZnJvbSB0aGUgZWxlbWVudCdzIGxpc3Qgb2YgQ1NTIGNsYXNzZXMuXG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVjbGFzc01hcChjbGFzc2VzOiB7W2NsYXNzTmFtZTogc3RyaW5nXTogYW55fSB8IE5PX0NIQU5HRSB8IHN0cmluZyB8IG51bGwpOiB2b2lkIHtcbiAgY2xhc3NNYXBJbnRlcm5hbChnZXRTZWxlY3RlZEluZGV4KCksIGNsYXNzZXMpO1xufVxuXG4vKipcbiAqIEludGVybmFsIGZ1bmN0aW9uIGZvciBhcHBseWluZyBhIGNsYXNzIHN0cmluZyBvciBrZXkvdmFsdWUgbWFwIG9mIGNsYXNzZXMgdG8gYW4gZWxlbWVudC5cbiAqXG4gKiBUaGUgcmVhc29uIHdoeSB0aGlzIGZ1bmN0aW9uIGhhcyBiZWVuIHNlcGFyYXRlZCBmcm9tIGDJtcm1Y2xhc3NNYXBgIGlzIGJlY2F1c2VcbiAqIGl0IGlzIGFsc28gY2FsbGVkIGZyb20gYMm1ybVjbGFzc01hcEludGVycG9sYXRlYC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNsYXNzTWFwSW50ZXJuYWwoXG4gICAgZWxlbWVudEluZGV4OiBudW1iZXIsIGNsYXNzZXM6IHtbY2xhc3NOYW1lOiBzdHJpbmddOiBhbnl9IHwgTk9fQ0hBTkdFIHwgc3RyaW5nIHwgbnVsbCk6IHZvaWQge1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IHROb2RlID0gZ2V0VE5vZGUoZWxlbWVudEluZGV4LCBsVmlldyk7XG4gIGNvbnN0IGZpcnN0VXBkYXRlUGFzcyA9IGxWaWV3W1RWSUVXXS5maXJzdFVwZGF0ZVBhc3M7XG4gIGNvbnN0IGNvbnRleHQgPSBnZXRDbGFzc2VzQ29udGV4dCh0Tm9kZSk7XG4gIGNvbnN0IGhhc0RpcmVjdGl2ZUlucHV0ID0gaGFzQ2xhc3NJbnB1dCh0Tm9kZSk7XG5cbiAgLy8gaWYgYSB2YWx1ZSBpcyBpbnRlcnBvbGF0ZWQgdGhlbiBpdCBtYXkgcmVuZGVyIGEgYE5PX0NIQU5HRWAgdmFsdWUuXG4gIC8vIGluIHRoaXMgY2FzZSB3ZSBkbyBub3QgbmVlZCB0byBkbyBhbnl0aGluZywgYnV0IHRoZSBiaW5kaW5nIGluZGV4XG4gIC8vIHN0aWxsIG5lZWRzIHRvIGJlIGluY3JlbWVudGVkIGJlY2F1c2UgYWxsIHN0eWxpbmcgYmluZGluZyB2YWx1ZXNcbiAgLy8gYXJlIHN0b3JlZCBpbnNpZGUgb2YgdGhlIGxWaWV3LlxuICBjb25zdCBiaW5kaW5nSW5kZXggPSBpbmNyZW1lbnRCaW5kaW5nSW5kZXgoMik7XG4gIGNvbnN0IGhvc3RCaW5kaW5nc01vZGUgPSBpc0hvc3RTdHlsaW5nKCk7XG5cbiAgLy8gaW5wdXRzIGFyZSBvbmx5IGV2YWx1YXRlZCBmcm9tIGEgdGVtcGxhdGUgYmluZGluZyBpbnRvIGEgZGlyZWN0aXZlLCB0aGVyZWZvcmUsXG4gIC8vIHRoZXJlIHNob3VsZCBub3QgYmUgYSBzaXR1YXRpb24gd2hlcmUgYSBkaXJlY3RpdmUgaG9zdCBiaW5kaW5ncyBmdW5jdGlvblxuICAvLyBldmFsdWF0ZXMgdGhlIGlucHV0cyAodGhpcyBzaG91bGQgb25seSBoYXBwZW4gaW4gdGhlIHRlbXBsYXRlIGZ1bmN0aW9uKVxuICBpZiAoIWhvc3RCaW5kaW5nc01vZGUgJiYgaGFzRGlyZWN0aXZlSW5wdXQgJiYgY2xhc3NlcyAhPT0gTk9fQ0hBTkdFKSB7XG4gICAgdXBkYXRlRGlyZWN0aXZlSW5wdXRWYWx1ZShjb250ZXh0LCBsVmlldywgdE5vZGUsIGJpbmRpbmdJbmRleCwgY2xhc3NlcywgdHJ1ZSwgZmlyc3RVcGRhdGVQYXNzKTtcbiAgICBjbGFzc2VzID0gTk9fQ0hBTkdFO1xuICB9XG5cbiAgLy8gd2UgY2hlY2sgZm9yIHRoaXMgaW4gdGhlIGluc3RydWN0aW9uIGNvZGUgc28gdGhhdCB0aGUgY29udGV4dCBjYW4gYmUgbm90aWZpZWRcbiAgLy8gYWJvdXQgcHJvcCBvciBtYXAgYmluZGluZ3Mgc28gdGhhdCB0aGUgZGlyZWN0IGFwcGx5IGNoZWNrIGNhbiBkZWNpZGUgZWFybGllclxuICAvLyBpZiBpdCBhbGxvd3MgZm9yIGNvbnRleHQgcmVzb2x1dGlvbiB0byBiZSBieXBhc3NlZC5cbiAgaWYgKGZpcnN0VXBkYXRlUGFzcykge1xuICAgIHBhdGNoQ29uZmlnKHROb2RlLCBUTm9kZUZsYWdzLmhhc0NsYXNzTWFwQmluZGluZ3MpO1xuICAgIHBhdGNoSG9zdFN0eWxpbmdGbGFnKHROb2RlLCBpc0hvc3RTdHlsaW5nKCksIHRydWUpO1xuICB9XG5cbiAgc3R5bGluZ01hcChcbiAgICAgIGNvbnRleHQsIHROb2RlLCBmaXJzdFVwZGF0ZVBhc3MsIGxWaWV3LCBiaW5kaW5nSW5kZXgsIGNsYXNzZXMsIHRydWUsIGhhc0RpcmVjdGl2ZUlucHV0KTtcbn1cblxuLyoqXG4gKiBTaGFyZWQgZnVuY3Rpb24gdXNlZCB0byB1cGRhdGUgYSBtYXAtYmFzZWQgc3R5bGluZyBiaW5kaW5nIGZvciBhbiBlbGVtZW50LlxuICpcbiAqIFdoZW4gdGhpcyBmdW5jdGlvbiBpcyBjYWxsZWQgaXQgd2lsbCBhY3RpdmF0ZSBzdXBwb3J0IGZvciBgW3N0eWxlXWAgYW5kXG4gKiBgW2NsYXNzXWAgYmluZGluZ3MgaW4gQW5ndWxhci5cbiAqL1xuZnVuY3Rpb24gc3R5bGluZ01hcChcbiAgICBjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQsIHROb2RlOiBUTm9kZSwgZmlyc3RVcGRhdGVQYXNzOiBib29sZWFuLCBsVmlldzogTFZpZXcsXG4gICAgYmluZGluZ0luZGV4OiBudW1iZXIsIHZhbHVlOiB7W2tleTogc3RyaW5nXTogYW55fSB8IHN0cmluZyB8IG51bGwsIGlzQ2xhc3NCYXNlZDogYm9vbGVhbixcbiAgICBoYXNEaXJlY3RpdmVJbnB1dDogYm9vbGVhbik6IHZvaWQge1xuICBjb25zdCBkaXJlY3RpdmVJbmRleCA9IGdldEFjdGl2ZURpcmVjdGl2ZUlkKCk7XG4gIGNvbnN0IG5hdGl2ZSA9IGdldE5hdGl2ZUJ5VE5vZGUodE5vZGUsIGxWaWV3KSBhcyBSRWxlbWVudDtcbiAgY29uc3Qgb2xkVmFsdWUgPSBnZXRWYWx1ZShsVmlldywgYmluZGluZ0luZGV4KTtcbiAgY29uc3Qgc2FuaXRpemVyID0gZ2V0Q3VycmVudFN0eWxlU2FuaXRpemVyKCk7XG4gIGNvbnN0IHZhbHVlSGFzQ2hhbmdlZCA9IGhhc1ZhbHVlQ2hhbmdlZChvbGRWYWx1ZSwgdmFsdWUpO1xuXG4gIC8vIFtzdHlsZV0gYW5kIFtjbGFzc10gYmluZGluZ3MgZG8gbm90IHVzZSBgYmluZCgpYCBhbmQgd2lsbCB0aGVyZWZvcmVcbiAgLy8gbWFuYWdlIGFjY2Vzc2luZyBhbmQgdXBkYXRpbmcgdGhlIG5ldyB2YWx1ZSBpbiB0aGUgbFZpZXcgZGlyZWN0bHkuXG4gIC8vIEZvciB0aGlzIHJlYXNvbiwgdGhlIGNoZWNrTm9DaGFuZ2VzIHNpdHVhdGlvbiBtdXN0IGFsc28gYmUgaGFuZGxlZCBoZXJlXG4gIC8vIGFzIHdlbGwuXG4gIGlmIChuZ0Rldk1vZGUgJiYgdmFsdWVIYXNDaGFuZ2VkICYmIGdldENoZWNrTm9DaGFuZ2VzTW9kZSgpKSB7XG4gICAgdGhyb3dFcnJvcklmTm9DaGFuZ2VzTW9kZShmYWxzZSwgb2xkVmFsdWUsIHZhbHVlKTtcbiAgfVxuXG4gIC8vIERpcmVjdCBBcHBseSBDYXNlOiBieXBhc3MgY29udGV4dCByZXNvbHV0aW9uIGFuZCBhcHBseSB0aGVcbiAgLy8gc3R5bGUvY2xhc3MgbWFwIHZhbHVlcyBkaXJlY3RseSB0byB0aGUgZWxlbWVudFxuICBpZiAoYWxsb3dEaXJlY3RTdHlsaW5nKHROb2RlLCBpc0NsYXNzQmFzZWQsIGZpcnN0VXBkYXRlUGFzcykpIHtcbiAgICBjb25zdCBzYW5pdGl6ZXJUb1VzZSA9IGlzQ2xhc3NCYXNlZCA/IG51bGwgOiBzYW5pdGl6ZXI7XG4gICAgY29uc3QgcmVuZGVyZXIgPSBnZXRSZW5kZXJlcih0Tm9kZSwgbFZpZXcpO1xuICAgIGFwcGx5U3R5bGluZ01hcERpcmVjdGx5KFxuICAgICAgICByZW5kZXJlciwgY29udGV4dCwgdE5vZGUsIG5hdGl2ZSwgbFZpZXcsIGJpbmRpbmdJbmRleCwgdmFsdWUsIGlzQ2xhc3NCYXNlZCwgc2FuaXRpemVyVG9Vc2UsXG4gICAgICAgIHZhbHVlSGFzQ2hhbmdlZCwgaGFzRGlyZWN0aXZlSW5wdXQpO1xuICAgIGlmIChzYW5pdGl6ZXJUb1VzZSkge1xuICAgICAgLy8gaXQncyBpbXBvcnRhbnQgd2UgcmVtb3ZlIHRoZSBjdXJyZW50IHN0eWxlIHNhbml0aXplciBvbmNlIHRoZVxuICAgICAgLy8gZWxlbWVudCBleGl0cywgb3RoZXJ3aXNlIGl0IHdpbGwgYmUgdXNlZCBieSB0aGUgbmV4dCBzdHlsaW5nXG4gICAgICAvLyBpbnN0cnVjdGlvbnMgZm9yIHRoZSBuZXh0IGVsZW1lbnQuXG4gICAgICBzZXRFbGVtZW50RXhpdEZuKHN0eWxpbmdBcHBseSk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGNvbnN0IHN0eWxpbmdNYXBBcnIgPVxuICAgICAgICB2YWx1ZSA9PT0gTk9fQ0hBTkdFID8gTk9fQ0hBTkdFIDogbm9ybWFsaXplSW50b1N0eWxpbmdNYXAob2xkVmFsdWUsIHZhbHVlLCAhaXNDbGFzc0Jhc2VkKTtcblxuICAgIGFjdGl2YXRlU3R5bGluZ01hcEZlYXR1cmUoKTtcblxuICAgIC8vIENvbnRleHQgUmVzb2x1dGlvbiAob3IgZmlyc3QgdXBkYXRlKSBDYXNlOiBzYXZlIHRoZSBtYXAgdmFsdWVcbiAgICAvLyBhbmQgZGVmZXIgdG8gdGhlIGNvbnRleHQgdG8gZmx1c2ggYW5kIGFwcGx5IHRoZSBzdHlsZS9jbGFzcyBiaW5kaW5nXG4gICAgLy8gdmFsdWUgdG8gdGhlIGVsZW1lbnQuXG4gICAgaWYgKGlzQ2xhc3NCYXNlZCkge1xuICAgICAgdXBkYXRlQ2xhc3NWaWFDb250ZXh0KFxuICAgICAgICAgIGNvbnRleHQsIHROb2RlLCBsVmlldywgbmF0aXZlLCBkaXJlY3RpdmVJbmRleCwgbnVsbCwgYmluZGluZ0luZGV4LCBzdHlsaW5nTWFwQXJyLFxuICAgICAgICAgIHZhbHVlSGFzQ2hhbmdlZCwgZmlyc3RVcGRhdGVQYXNzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdXBkYXRlU3R5bGVWaWFDb250ZXh0KFxuICAgICAgICAgIGNvbnRleHQsIHROb2RlLCBsVmlldywgbmF0aXZlLCBkaXJlY3RpdmVJbmRleCwgbnVsbCwgYmluZGluZ0luZGV4LCBzdHlsaW5nTWFwQXJyLFxuICAgICAgICAgIHNhbml0aXplciwgdmFsdWVIYXNDaGFuZ2VkLCBmaXJzdFVwZGF0ZVBhc3MpO1xuICAgIH1cblxuICAgIHNldEVsZW1lbnRFeGl0Rm4oc3R5bGluZ0FwcGx5KTtcbiAgfVxuXG4gIGlmIChuZ0Rldk1vZGUpIHtcbiAgICBpc0NsYXNzQmFzZWQgPyBuZ0Rldk1vZGUuY2xhc3NNYXAgOiBuZ0Rldk1vZGUuc3R5bGVNYXArKztcbiAgICBpZiAodmFsdWVIYXNDaGFuZ2VkKSB7XG4gICAgICBpc0NsYXNzQmFzZWQgPyBuZ0Rldk1vZGUuY2xhc3NNYXBDYWNoZU1pc3MgOiBuZ0Rldk1vZGUuc3R5bGVNYXBDYWNoZU1pc3MrKztcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBXcml0ZXMgYSB2YWx1ZSB0byBhIGRpcmVjdGl2ZSdzIGBzdHlsZWAgb3IgYGNsYXNzYCBpbnB1dCBiaW5kaW5nIChpZiBpdCBoYXMgY2hhbmdlZCkuXG4gKlxuICogSWYgYSBkaXJlY3RpdmUgaGFzIGEgYEBJbnB1dGAgYmluZGluZyB0aGF0IGlzIHNldCBvbiBgc3R5bGVgIG9yIGBjbGFzc2AgdGhlbiB0aGF0IHZhbHVlXG4gKiB3aWxsIHRha2UgcHJpb3JpdHkgb3ZlciB0aGUgdW5kZXJseWluZyBzdHlsZS9jbGFzcyBzdHlsaW5nIGJpbmRpbmdzLiBUaGlzIHZhbHVlIHdpbGxcbiAqIGJlIHVwZGF0ZWQgZm9yIHRoZSBiaW5kaW5nIGVhY2ggdGltZSBkdXJpbmcgY2hhbmdlIGRldGVjdGlvbi5cbiAqXG4gKiBXaGVuIHRoaXMgb2NjdXJzIHRoaXMgZnVuY3Rpb24gd2lsbCBhdHRlbXB0IHRvIHdyaXRlIHRoZSB2YWx1ZSB0byB0aGUgaW5wdXQgYmluZGluZ1xuICogZGVwZW5kaW5nIG9uIHRoZSBmb2xsb3dpbmcgc2l0dWF0aW9uczpcbiAqXG4gKiAtIElmIGBvbGRWYWx1ZSAhPT0gbmV3VmFsdWVgXG4gKiAtIElmIGBuZXdWYWx1ZWAgaXMgYG51bGxgIChidXQgdGhpcyBpcyBza2lwcGVkIGlmIGl0IGlzIGR1cmluZyB0aGUgZmlyc3QgdXBkYXRlIHBhc3MpXG4gKi9cbmZ1bmN0aW9uIHVwZGF0ZURpcmVjdGl2ZUlucHV0VmFsdWUoXG4gICAgY29udGV4dDogVFN0eWxpbmdDb250ZXh0LCBsVmlldzogTFZpZXcsIHROb2RlOiBUTm9kZSwgYmluZGluZ0luZGV4OiBudW1iZXIsIG5ld1ZhbHVlOiBhbnksXG4gICAgaXNDbGFzc0Jhc2VkOiBib29sZWFuLCBmaXJzdFVwZGF0ZVBhc3M6IGJvb2xlYW4pOiB2b2lkIHtcbiAgY29uc3Qgb2xkVmFsdWUgPSBnZXRWYWx1ZShsVmlldywgYmluZGluZ0luZGV4KTtcbiAgaWYgKGhhc1ZhbHVlQ2hhbmdlZChvbGRWYWx1ZSwgbmV3VmFsdWUpKSB7XG4gICAgLy8gZXZlbiBpZiB0aGUgdmFsdWUgaGFzIGNoYW5nZWQgd2UgbWF5IG5vdCB3YW50IHRvIGVtaXQgaXQgdG8gdGhlXG4gICAgLy8gZGlyZWN0aXZlIGlucHV0KHMpIGluIHRoZSBldmVudCB0aGF0IGl0IGlzIGZhbHN5IGR1cmluZyB0aGVcbiAgICAvLyBmaXJzdCB1cGRhdGUgcGFzcy5cbiAgICBpZiAoaXNTdHlsaW5nVmFsdWVEZWZpbmVkKG5ld1ZhbHVlKSB8fCAhZmlyc3RVcGRhdGVQYXNzKSB7XG4gICAgICBjb25zdCBpbnB1dE5hbWU6IHN0cmluZyA9IGlzQ2xhc3NCYXNlZCA/IHNlbGVjdENsYXNzQmFzZWRJbnB1dE5hbWUodE5vZGUuaW5wdXRzICEpIDogJ3N0eWxlJztcbiAgICAgIGNvbnN0IGlucHV0cyA9IHROb2RlLmlucHV0cyAhW2lucHV0TmFtZV0gITtcbiAgICAgIGNvbnN0IGluaXRpYWxWYWx1ZSA9IGdldEluaXRpYWxTdHlsaW5nVmFsdWUoY29udGV4dCk7XG4gICAgICBjb25zdCB2YWx1ZSA9IG5vcm1hbGl6ZVN0eWxpbmdEaXJlY3RpdmVJbnB1dFZhbHVlKGluaXRpYWxWYWx1ZSwgbmV3VmFsdWUsIGlzQ2xhc3NCYXNlZCk7XG4gICAgICBzZXRJbnB1dHNGb3JQcm9wZXJ0eShsVmlldywgaW5wdXRzLCB2YWx1ZSk7XG4gICAgICBzZXRFbGVtZW50RXhpdEZuKHN0eWxpbmdBcHBseSk7XG4gICAgfVxuICAgIHNldFZhbHVlKGxWaWV3LCBiaW5kaW5nSW5kZXgsIG5ld1ZhbHVlKTtcbiAgfVxufVxuXG4vKipcbiAqIFJldHVybnMgdGhlIGFwcHJvcHJpYXRlIGRpcmVjdGl2ZSBpbnB1dCB2YWx1ZSBmb3IgYHN0eWxlYCBvciBgY2xhc3NgLlxuICpcbiAqIEVhcmxpZXIgdmVyc2lvbnMgb2YgQW5ndWxhciBleHBlY3QgYSBiaW5kaW5nIHZhbHVlIHRvIGJlIHBhc3NlZCBpbnRvIGRpcmVjdGl2ZSBjb2RlXG4gKiBleGFjdGx5IGFzIGl0IGlzIHVubGVzcyB0aGVyZSBpcyBhIHN0YXRpYyB2YWx1ZSBwcmVzZW50IChpbiB3aGljaCBjYXNlIGJvdGggdmFsdWVzXG4gKiB3aWxsIGJlIHN0cmluZ2lmaWVkIGFuZCBjb25jYXRlbmF0ZWQpLlxuICovXG5mdW5jdGlvbiBub3JtYWxpemVTdHlsaW5nRGlyZWN0aXZlSW5wdXRWYWx1ZShcbiAgICBpbml0aWFsVmFsdWU6IHN0cmluZywgYmluZGluZ1ZhbHVlOiBzdHJpbmcgfCB7W2tleTogc3RyaW5nXTogYW55fSB8IG51bGwsXG4gICAgaXNDbGFzc0Jhc2VkOiBib29sZWFuKSB7XG4gIGxldCB2YWx1ZSA9IGJpbmRpbmdWYWx1ZTtcblxuICAvLyB3ZSBvbmx5IGNvbmNhdCB2YWx1ZXMgaWYgdGhlcmUgaXMgYW4gaW5pdGlhbCB2YWx1ZSwgb3RoZXJ3aXNlIHdlIHJldHVybiB0aGUgdmFsdWUgYXMgaXMuXG4gIC8vIE5vdGUgdGhhdCB0aGlzIGlzIHRvIHNhdGlzZnkgYmFja3dhcmRzLWNvbXBhdGliaWxpdHkgaW4gQW5ndWxhci5cbiAgaWYgKGluaXRpYWxWYWx1ZS5sZW5ndGgpIHtcbiAgICBpZiAoaXNDbGFzc0Jhc2VkKSB7XG4gICAgICB2YWx1ZSA9IGNvbmNhdFN0cmluZyhpbml0aWFsVmFsdWUsIGZvcmNlQ2xhc3Nlc0FzU3RyaW5nKGJpbmRpbmdWYWx1ZSkpO1xuICAgIH0gZWxzZSB7XG4gICAgICB2YWx1ZSA9IGNvbmNhdFN0cmluZyhpbml0aWFsVmFsdWUsIGZvcmNlU3R5bGVzQXNTdHJpbmcoYmluZGluZ1ZhbHVlLCB0cnVlKSwgJzsnKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHZhbHVlO1xufVxuXG4vKipcbiAqIEZsdXNoZXMgYWxsIHN0eWxpbmcgY29kZSB0byB0aGUgZWxlbWVudC5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIGlzIGRlc2lnbmVkIHRvIGJlIHNjaGVkdWxlZCBmcm9tIGFueSBvZiB0aGUgZm91ciBzdHlsaW5nIGluc3RydWN0aW9uc1xuICogaW4gdGhpcyBmaWxlLiBXaGVuIGNhbGxlZCBpdCB3aWxsIGZsdXNoIGFsbCBzdHlsZSBhbmQgY2xhc3MgYmluZGluZ3MgdG8gdGhlIGVsZW1lbnRcbiAqIHZpYSB0aGUgY29udGV4dCByZXNvbHV0aW9uIGFsZ29yaXRobS5cbiAqL1xuZnVuY3Rpb24gc3R5bGluZ0FwcGx5KCk6IHZvaWQge1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IHRWaWV3ID0gbFZpZXdbVFZJRVddO1xuICBjb25zdCBlbGVtZW50SW5kZXggPSBnZXRTZWxlY3RlZEluZGV4KCk7XG4gIGNvbnN0IHROb2RlID0gZ2V0VE5vZGUoZWxlbWVudEluZGV4LCBsVmlldyk7XG4gIGNvbnN0IG5hdGl2ZSA9IGdldE5hdGl2ZUJ5VE5vZGUodE5vZGUsIGxWaWV3KSBhcyBSRWxlbWVudDtcbiAgY29uc3QgZGlyZWN0aXZlSW5kZXggPSBnZXRBY3RpdmVEaXJlY3RpdmVJZCgpO1xuICBjb25zdCByZW5kZXJlciA9IGdldFJlbmRlcmVyKHROb2RlLCBsVmlldyk7XG4gIGNvbnN0IHNhbml0aXplciA9IGdldEN1cnJlbnRTdHlsZVNhbml0aXplcigpO1xuICBjb25zdCBjbGFzc2VzQ29udGV4dCA9IGlzU3R5bGluZ0NvbnRleHQodE5vZGUuY2xhc3NlcykgPyB0Tm9kZS5jbGFzc2VzIGFzIFRTdHlsaW5nQ29udGV4dCA6IG51bGw7XG4gIGNvbnN0IHN0eWxlc0NvbnRleHQgPSBpc1N0eWxpbmdDb250ZXh0KHROb2RlLnN0eWxlcykgPyB0Tm9kZS5zdHlsZXMgYXMgVFN0eWxpbmdDb250ZXh0IDogbnVsbDtcbiAgZmx1c2hTdHlsaW5nKFxuICAgICAgcmVuZGVyZXIsIGxWaWV3LCB0Tm9kZSwgY2xhc3Nlc0NvbnRleHQsIHN0eWxlc0NvbnRleHQsIG5hdGl2ZSwgZGlyZWN0aXZlSW5kZXgsIHNhbml0aXplcixcbiAgICAgIHRWaWV3LmZpcnN0VXBkYXRlUGFzcyk7XG4gIHJlc2V0Q3VycmVudFN0eWxlU2FuaXRpemVyKCk7XG59XG5cbmZ1bmN0aW9uIGdldFJlbmRlcmVyKHROb2RlOiBUTm9kZSwgbFZpZXc6IExWaWV3KSB7XG4gIHJldHVybiB0Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuRWxlbWVudCA/IGxWaWV3W1JFTkRFUkVSXSA6IG51bGw7XG59XG5cbi8qKlxuICogU2VhcmNoZXMgYW5kIGFzc2lnbnMgcHJvdmlkZWQgYWxsIHN0YXRpYyBzdHlsZS9jbGFzcyBlbnRyaWVzIChmb3VuZCBpbiB0aGUgYGF0dHJzYCB2YWx1ZSlcbiAqIGFuZCByZWdpc3RlcnMgdGhlbSBpbiB0aGVpciByZXNwZWN0aXZlIHN0eWxpbmcgY29udGV4dHMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZWdpc3RlckluaXRpYWxTdHlsaW5nT25UTm9kZShcbiAgICB0Tm9kZTogVE5vZGUsIGF0dHJzOiBUQXR0cmlidXRlcywgc3RhcnRJbmRleDogbnVtYmVyKTogYm9vbGVhbiB7XG4gIGxldCBoYXNBZGRpdGlvbmFsSW5pdGlhbFN0eWxpbmcgPSBmYWxzZTtcbiAgbGV0IHN0eWxlcyA9IGdldFN0eWxpbmdNYXBBcnJheSh0Tm9kZS5zdHlsZXMpO1xuICBsZXQgY2xhc3NlcyA9IGdldFN0eWxpbmdNYXBBcnJheSh0Tm9kZS5jbGFzc2VzKTtcbiAgbGV0IG1vZGUgPSAtMTtcbiAgZm9yIChsZXQgaSA9IHN0YXJ0SW5kZXg7IGkgPCBhdHRycy5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IGF0dHIgPSBhdHRyc1tpXSBhcyBzdHJpbmc7XG4gICAgaWYgKHR5cGVvZiBhdHRyID09ICdudW1iZXInKSB7XG4gICAgICBtb2RlID0gYXR0cjtcbiAgICB9IGVsc2UgaWYgKG1vZGUgPT0gQXR0cmlidXRlTWFya2VyLkNsYXNzZXMpIHtcbiAgICAgIGNsYXNzZXMgPSBjbGFzc2VzIHx8IGFsbG9jU3R5bGluZ01hcEFycmF5KG51bGwpO1xuICAgICAgYWRkSXRlbVRvU3R5bGluZ01hcChjbGFzc2VzLCBhdHRyLCB0cnVlKTtcbiAgICAgIGhhc0FkZGl0aW9uYWxJbml0aWFsU3R5bGluZyA9IHRydWU7XG4gICAgfSBlbHNlIGlmIChtb2RlID09IEF0dHJpYnV0ZU1hcmtlci5TdHlsZXMpIHtcbiAgICAgIGNvbnN0IHZhbHVlID0gYXR0cnNbKytpXSBhcyBzdHJpbmcgfCBudWxsO1xuICAgICAgc3R5bGVzID0gc3R5bGVzIHx8IGFsbG9jU3R5bGluZ01hcEFycmF5KG51bGwpO1xuICAgICAgYWRkSXRlbVRvU3R5bGluZ01hcChzdHlsZXMsIGF0dHIsIHZhbHVlKTtcbiAgICAgIGhhc0FkZGl0aW9uYWxJbml0aWFsU3R5bGluZyA9IHRydWU7XG4gICAgfVxuICB9XG5cbiAgaWYgKGNsYXNzZXMgJiYgY2xhc3Nlcy5sZW5ndGggPiBTdHlsaW5nTWFwQXJyYXlJbmRleC5WYWx1ZXNTdGFydFBvc2l0aW9uKSB7XG4gICAgaWYgKCF0Tm9kZS5jbGFzc2VzKSB7XG4gICAgICB0Tm9kZS5jbGFzc2VzID0gY2xhc3NlcztcbiAgICB9XG4gICAgdXBkYXRlUmF3VmFsdWVPbkNvbnRleHQodE5vZGUuY2xhc3Nlcywgc3R5bGluZ01hcFRvU3RyaW5nKGNsYXNzZXMsIHRydWUpKTtcbiAgfVxuXG4gIGlmIChzdHlsZXMgJiYgc3R5bGVzLmxlbmd0aCA+IFN0eWxpbmdNYXBBcnJheUluZGV4LlZhbHVlc1N0YXJ0UG9zaXRpb24pIHtcbiAgICBpZiAoIXROb2RlLnN0eWxlcykge1xuICAgICAgdE5vZGUuc3R5bGVzID0gc3R5bGVzO1xuICAgIH1cbiAgICB1cGRhdGVSYXdWYWx1ZU9uQ29udGV4dCh0Tm9kZS5zdHlsZXMsIHN0eWxpbmdNYXBUb1N0cmluZyhzdHlsZXMsIGZhbHNlKSk7XG4gIH1cblxuICBpZiAoaGFzQWRkaXRpb25hbEluaXRpYWxTdHlsaW5nKSB7XG4gICAgdE5vZGUuZmxhZ3MgfD0gVE5vZGVGbGFncy5oYXNJbml0aWFsU3R5bGluZztcbiAgfVxuXG4gIHJldHVybiBoYXNBZGRpdGlvbmFsSW5pdGlhbFN0eWxpbmc7XG59XG5cbmZ1bmN0aW9uIHVwZGF0ZVJhd1ZhbHVlT25Db250ZXh0KGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCB8IFN0eWxpbmdNYXBBcnJheSwgdmFsdWU6IHN0cmluZykge1xuICBjb25zdCBzdHlsaW5nTWFwQXJyID0gZ2V0U3R5bGluZ01hcEFycmF5KGNvbnRleHQpICE7XG4gIHN0eWxpbmdNYXBBcnJbU3R5bGluZ01hcEFycmF5SW5kZXguUmF3VmFsdWVQb3NpdGlvbl0gPSB2YWx1ZTtcbn1cblxuZnVuY3Rpb24gZ2V0U3R5bGVzQ29udGV4dCh0Tm9kZTogVE5vZGUpOiBUU3R5bGluZ0NvbnRleHQge1xuICByZXR1cm4gZ2V0Q29udGV4dCh0Tm9kZSwgZmFsc2UpO1xufVxuXG5mdW5jdGlvbiBnZXRDbGFzc2VzQ29udGV4dCh0Tm9kZTogVE5vZGUpOiBUU3R5bGluZ0NvbnRleHQge1xuICByZXR1cm4gZ2V0Q29udGV4dCh0Tm9kZSwgdHJ1ZSk7XG59XG5cbi8qKlxuICogUmV0dXJucy9pbnN0YW50aWF0ZXMgYSBzdHlsaW5nIGNvbnRleHQgZnJvbS90byBhIGB0Tm9kZWAgaW5zdGFuY2UuXG4gKi9cbmZ1bmN0aW9uIGdldENvbnRleHQodE5vZGU6IFROb2RlLCBpc0NsYXNzQmFzZWQ6IGJvb2xlYW4pOiBUU3R5bGluZ0NvbnRleHQge1xuICBsZXQgY29udGV4dCA9IGlzQ2xhc3NCYXNlZCA/IHROb2RlLmNsYXNzZXMgOiB0Tm9kZS5zdHlsZXM7XG4gIGlmICghaXNTdHlsaW5nQ29udGV4dChjb250ZXh0KSkge1xuICAgIGNvbnN0IGhhc0RpcmVjdGl2ZXMgPSBpc0RpcmVjdGl2ZUhvc3QodE5vZGUpO1xuICAgIGNvbnRleHQgPSBhbGxvY1RTdHlsaW5nQ29udGV4dChjb250ZXh0IGFzIFN0eWxpbmdNYXBBcnJheSB8IG51bGwsIGhhc0RpcmVjdGl2ZXMpO1xuICAgIGlmIChuZ0Rldk1vZGUpIHtcbiAgICAgIGF0dGFjaFN0eWxpbmdEZWJ1Z09iamVjdChjb250ZXh0IGFzIFRTdHlsaW5nQ29udGV4dCwgdE5vZGUsIGlzQ2xhc3NCYXNlZCk7XG4gICAgfVxuXG4gICAgaWYgKGlzQ2xhc3NCYXNlZCkge1xuICAgICAgdE5vZGUuY2xhc3NlcyA9IGNvbnRleHQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIHROb2RlLnN0eWxlcyA9IGNvbnRleHQ7XG4gICAgfVxuICB9XG4gIHJldHVybiBjb250ZXh0IGFzIFRTdHlsaW5nQ29udGV4dDtcbn1cblxuZnVuY3Rpb24gcmVzb2x2ZVN0eWxlUHJvcFZhbHVlKFxuICAgIHZhbHVlOiBzdHJpbmcgfCBudW1iZXIgfCBTYWZlVmFsdWUgfCBudWxsIHwgTk9fQ0hBTkdFLFxuICAgIHN1ZmZpeDogc3RyaW5nIHwgbnVsbCB8IHVuZGVmaW5lZCk6IHN0cmluZ3xTYWZlVmFsdWV8bnVsbHx1bmRlZmluZWR8Tk9fQ0hBTkdFIHtcbiAgaWYgKHZhbHVlID09PSBOT19DSEFOR0UpIHJldHVybiB2YWx1ZTtcblxuICBsZXQgcmVzb2x2ZWRWYWx1ZTogc3RyaW5nfG51bGwgPSBudWxsO1xuICBpZiAoaXNTdHlsaW5nVmFsdWVEZWZpbmVkKHZhbHVlKSkge1xuICAgIGlmIChzdWZmaXgpIHtcbiAgICAgIC8vIHdoZW4gYSBzdWZmaXggaXMgYXBwbGllZCB0aGVuIGl0IHdpbGwgYnlwYXNzXG4gICAgICAvLyBzYW5pdGl6YXRpb24gZW50aXJlbHkgKGIvYyBhIG5ldyBzdHJpbmcgaXMgY3JlYXRlZClcbiAgICAgIHJlc29sdmVkVmFsdWUgPSByZW5kZXJTdHJpbmdpZnkodmFsdWUpICsgc3VmZml4O1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBzYW5pdGl6YXRpb24gaGFwcGVucyBieSBkZWFsaW5nIHdpdGggYSBzdHJpbmcgdmFsdWVcbiAgICAgIC8vIHRoaXMgbWVhbnMgdGhhdCB0aGUgc3RyaW5nIHZhbHVlIHdpbGwgYmUgcGFzc2VkIHRocm91Z2hcbiAgICAgIC8vIGludG8gdGhlIHN0eWxlIHJlbmRlcmluZyBsYXRlciAod2hpY2ggaXMgd2hlcmUgdGhlIHZhbHVlXG4gICAgICAvLyB3aWxsIGJlIHNhbml0aXplZCBiZWZvcmUgaXQgaXMgYXBwbGllZClcbiAgICAgIHJlc29sdmVkVmFsdWUgPSB2YWx1ZSBhcyBhbnkgYXMgc3RyaW5nO1xuICAgIH1cbiAgfVxuICByZXR1cm4gcmVzb2x2ZWRWYWx1ZTtcbn1cblxuLyoqXG4gKiBXaGV0aGVyIG9yIG5vdCB0aGUgc3R5bGUvY2xhc3MgYmluZGluZyBiZWluZyBhcHBsaWVkIHdhcyBleGVjdXRlZCB3aXRoaW4gYSBob3N0IGJpbmRpbmdzXG4gKiBmdW5jdGlvbi5cbiAqL1xuZnVuY3Rpb24gaXNIb3N0U3R5bGluZygpOiBib29sZWFuIHtcbiAgcmV0dXJuIGlzSG9zdFN0eWxpbmdBY3RpdmUoZ2V0QWN0aXZlRGlyZWN0aXZlSWQoKSk7XG59XG5cbmZ1bmN0aW9uIHBhdGNoSG9zdFN0eWxpbmdGbGFnKHROb2RlOiBUTm9kZSwgaG9zdEJpbmRpbmdzTW9kZTogYm9vbGVhbiwgaXNDbGFzc0Jhc2VkOiBib29sZWFuKSB7XG4gIGNvbnN0IGZsYWcgPSBob3N0QmluZGluZ3NNb2RlID9cbiAgICAgIGlzQ2xhc3NCYXNlZCA/IFROb2RlRmxhZ3MuaGFzSG9zdENsYXNzQmluZGluZ3MgOiBUTm9kZUZsYWdzLmhhc0hvc3RTdHlsZUJpbmRpbmdzIDpcbiAgICAgIGlzQ2xhc3NCYXNlZCA/IFROb2RlRmxhZ3MuaGFzVGVtcGxhdGVDbGFzc0JpbmRpbmdzIDogVE5vZGVGbGFncy5oYXNUZW1wbGF0ZVN0eWxlQmluZGluZ3M7XG4gIHBhdGNoQ29uZmlnKHROb2RlLCBmbGFnKTtcbn1cbiJdfQ==