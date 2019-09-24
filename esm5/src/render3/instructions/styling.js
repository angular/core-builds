import { setInputsForProperty } from '../instructions/shared';
import { BINDING_INDEX, RENDERER } from '../interfaces/view';
import { getActiveDirectiveId, getCurrentStyleSanitizer, getLView, getSelectedIndex, setCurrentStyleSanitizer, setElementExitFn } from '../state';
import { applyStylingMapDirectly, applyStylingValueDirectly, flushStyling, setClass, setStyle, updateClassViaContext, updateStyleViaContext } from '../styling/bindings';
import { activateStylingMapFeature } from '../styling/map_based_bindings';
import { attachStylingDebugObject } from '../styling/styling_debug';
import { NO_CHANGE } from '../tokens';
import { renderStringify } from '../util/misc_utils';
import { addItemToStylingMap, allocStylingMapArray, allocTStylingContext, allowDirectStyling, concatString, forceClassesAsString, forceStylesAsString, getInitialStylingValue, getStylingMapArray, hasClassInput, hasStyleInput, hasValueChanged, isContextLocked, isHostStylingActive, isStylingContext, normalizeIntoStylingMap, setValue, stylingMapToString } from '../util/styling_utils';
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
    var bindingIndex = lView[BINDING_INDEX]++;
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
    var bindingIndex = lView[BINDING_INDEX]++;
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
    // Direct Apply Case: bypass context resolution and apply the
    // style/class value directly to the element
    if (allowDirectStyling(context, hostBindingsMode)) {
        var renderer = getRenderer(tNode, lView);
        updated = applyStylingValueDirectly(renderer, context, native, lView, bindingIndex, prop, value, isClassBased ? setClass : setStyle, sanitizer);
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
    // if a value is interpolated then it may render a `NO_CHANGE` value.
    // in this case we do not need to do anything, but the binding index
    // still needs to be incremented because all styling binding values
    // are stored inside of the lView.
    var bindingIndex = lView[BINDING_INDEX]++;
    // inputs are only evaluated from a template binding into a directive, therefore,
    // there should not be a situation where a directive host bindings function
    // evaluates the inputs (this should only happen in the template function)
    if (!isHostStyling() && hasStyleInput(tNode) && styles !== NO_CHANGE) {
        updateDirectiveInputValue(context, lView, tNode, bindingIndex, styles, false);
        styles = NO_CHANGE;
    }
    var updated = _stylingMap(index, context, bindingIndex, styles, false);
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
    // if a value is interpolated then it may render a `NO_CHANGE` value.
    // in this case we do not need to do anything, but the binding index
    // still needs to be incremented because all styling binding values
    // are stored inside of the lView.
    var bindingIndex = lView[BINDING_INDEX]++;
    // inputs are only evaluated from a template binding into a directive, therefore,
    // there should not be a situation where a directive host bindings function
    // evaluates the inputs (this should only happen in the template function)
    if (!isHostStyling() && hasClassInput(tNode) && classes !== NO_CHANGE) {
        updateDirectiveInputValue(context, lView, tNode, bindingIndex, classes, true);
        classes = NO_CHANGE;
    }
    var updated = _stylingMap(elementIndex, context, bindingIndex, classes, true);
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
 */
function _stylingMap(elementIndex, context, bindingIndex, value, isClassBased) {
    var updated = false;
    var lView = getLView();
    var directiveIndex = getActiveDirectiveId();
    var tNode = getTNode(elementIndex, lView);
    var native = getNativeByTNode(tNode, lView);
    var oldValue = lView[bindingIndex];
    var hostBindingsMode = isHostStyling();
    var sanitizer = getCurrentStyleSanitizer();
    var valueHasChanged = hasValueChanged(oldValue, value);
    var stylingMapArr = value === NO_CHANGE ? NO_CHANGE : normalizeIntoStylingMap(oldValue, value, !isClassBased);
    // Direct Apply Case: bypass context resolution and apply the
    // style/class map values directly to the element
    if (allowDirectStyling(context, hostBindingsMode)) {
        var renderer = getRenderer(tNode, lView);
        updated = applyStylingMapDirectly(renderer, context, native, lView, bindingIndex, stylingMapArr, isClassBased ? setClass : setStyle, sanitizer, valueHasChanged);
    }
    else {
        updated = valueHasChanged;
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
    return updated;
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
            var inputName = isClassBased ? 'class' : 'style';
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
            value = concatString(initialValue, forceStylesAsString(bindingValue), ';');
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
    setCurrentStyleSanitizer(null);
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
            classes = classes || allocStylingMapArray();
            addItemToStylingMap(classes, attr, true);
            hasAdditionalInitialStyling = true;
        }
        else if (mode == 2 /* Styles */) {
            var value = attrs[++i];
            styles = styles || allocStylingMapArray();
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
        context = allocTStylingContext(context);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3R5bGluZy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvaW5zdHJ1Y3Rpb25zL3N0eWxpbmcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBU0EsT0FBTyxFQUFDLG9CQUFvQixFQUFDLE1BQU0sd0JBQXdCLENBQUM7QUFJNUQsT0FBTyxFQUFDLGFBQWEsRUFBUyxRQUFRLEVBQUMsTUFBTSxvQkFBb0IsQ0FBQztBQUNsRSxPQUFPLEVBQUMsb0JBQW9CLEVBQUUsd0JBQXdCLEVBQUUsUUFBUSxFQUFFLGdCQUFnQixFQUFFLHdCQUF3QixFQUFFLGdCQUFnQixFQUFDLE1BQU0sVUFBVSxDQUFDO0FBQ2hKLE9BQU8sRUFBQyx1QkFBdUIsRUFBRSx5QkFBeUIsRUFBRSxZQUFZLEVBQUUsUUFBUSxFQUFFLFFBQVEsRUFBRSxxQkFBcUIsRUFBRSxxQkFBcUIsRUFBQyxNQUFNLHFCQUFxQixDQUFDO0FBQ3ZLLE9BQU8sRUFBQyx5QkFBeUIsRUFBQyxNQUFNLCtCQUErQixDQUFDO0FBQ3hFLE9BQU8sRUFBQyx3QkFBd0IsRUFBQyxNQUFNLDBCQUEwQixDQUFDO0FBQ2xFLE9BQU8sRUFBQyxTQUFTLEVBQUMsTUFBTSxXQUFXLENBQUM7QUFDcEMsT0FBTyxFQUFDLGVBQWUsRUFBQyxNQUFNLG9CQUFvQixDQUFDO0FBQ25ELE9BQU8sRUFBQyxtQkFBbUIsRUFBRSxvQkFBb0IsRUFBRSxvQkFBb0IsRUFBRSxrQkFBa0IsRUFBRSxZQUFZLEVBQUUsb0JBQW9CLEVBQUUsbUJBQW1CLEVBQUUsc0JBQXNCLEVBQUUsa0JBQWtCLEVBQUUsYUFBYSxFQUFFLGFBQWEsRUFBRSxlQUFlLEVBQUUsZUFBZSxFQUFFLG1CQUFtQixFQUFFLGdCQUFnQixFQUFFLHVCQUF1QixFQUFFLFFBQVEsRUFBRSxrQkFBa0IsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQzdYLE9BQU8s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Z0IsQ0FBQyxPQUFPLENBQUMsRUFBRTtRQUM5QixPQUFPLEdBQUcsb0JBQW9CLENBQUMsT0FBaUMsQ0FBQyxDQUFDO1FBQ2xFLElBQUksU0FBUyxFQUFFO1lBQ2Isd0JBQXdCLENBQUMsT0FBMEIsRUFBRSxZQUFZLENBQUMsQ0FBQztTQUNwRTtRQUNELElBQUksWUFBWSxFQUFFO1lBQ2hCLEtBQUssQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDO1NBQ3pCO2FBQU07WUFDTCxLQUFLLENBQUMsTUFBTSxHQUFHLE9BQU8sQ0FBQztTQUN4QjtLQUNGO0lBQ0QsT0FBTyxPQUEwQixDQUFDO0FBQ3BDLENBQUM7QUFFRCxTQUFTLHFCQUFxQixDQUMxQixLQUFxRCxFQUNyRCxNQUFpQztJQUNuQyxJQUFJLEtBQUssS0FBSyxTQUFTO1FBQUUsT0FBTyxLQUFLLENBQUM7SUFFdEMsSUFBSSxhQUFhLEdBQWdCLElBQUksQ0FBQztJQUN0QyxJQUFJLEtBQUssS0FBSyxJQUFJLEVBQUU7UUFDbEIsSUFBSSxNQUFNLEVBQUU7WUFDViwrQ0FBK0M7WUFDL0Msc0RBQXNEO1lBQ3RELGFBQWEsR0FBRyxlQUFlLENBQUMsS0FBSyxDQUFDLEdBQUcsTUFBTSxDQUFDO1NBQ2pEO2FBQU07WUFDTCxzREFBc0Q7WUFDdEQsMERBQTBEO1lBQzFELDJEQUEyRDtZQUMzRCwwQ0FBMEM7WUFDMUMsYUFBYSxHQUFHLEtBQXNCLENBQUM7U0FDeEM7S0FDRjtJQUNELE9BQU8sYUFBYSxDQUFDO0FBQ3ZCLENBQUM7QUFFRDs7O0dBR0c7QUFDSCxTQUFTLGFBQWE7SUFDcEIsT0FBTyxtQkFBbUIsQ0FBQyxvQkFBb0IsRUFBRSxDQUFDLENBQUM7QUFDckQsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuKiBAbGljZW5zZVxuKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbipcbiogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuKi9cbmltcG9ydCB7U2FmZVZhbHVlfSBmcm9tICcuLi8uLi9zYW5pdGl6YXRpb24vYnlwYXNzJztcbmltcG9ydCB7U3R5bGVTYW5pdGl6ZUZufSBmcm9tICcuLi8uLi9zYW5pdGl6YXRpb24vc3R5bGVfc2FuaXRpemVyJztcbmltcG9ydCB7c2V0SW5wdXRzRm9yUHJvcGVydHl9IGZyb20gJy4uL2luc3RydWN0aW9ucy9zaGFyZWQnO1xuaW1wb3J0IHtBdHRyaWJ1dGVNYXJrZXIsIFRBdHRyaWJ1dGVzLCBUTm9kZSwgVE5vZGVUeXBlfSBmcm9tICcuLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtSRWxlbWVudH0gZnJvbSAnLi4vaW50ZXJmYWNlcy9yZW5kZXJlcic7XG5pbXBvcnQge1N0eWxpbmdNYXBBcnJheSwgU3R5bGluZ01hcEFycmF5SW5kZXgsIFRTdHlsaW5nQ29udGV4dH0gZnJvbSAnLi4vaW50ZXJmYWNlcy9zdHlsaW5nJztcbmltcG9ydCB7QklORElOR19JTkRFWCwgTFZpZXcsIFJFTkRFUkVSfSBmcm9tICcuLi9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHtnZXRBY3RpdmVEaXJlY3RpdmVJZCwgZ2V0Q3VycmVudFN0eWxlU2FuaXRpemVyLCBnZXRMVmlldywgZ2V0U2VsZWN0ZWRJbmRleCwgc2V0Q3VycmVudFN0eWxlU2FuaXRpemVyLCBzZXRFbGVtZW50RXhpdEZufSBmcm9tICcuLi9zdGF0ZSc7XG5pbXBvcnQge2FwcGx5U3R5bGluZ01hcERpcmVjdGx5LCBhcHBseVN0eWxpbmdWYWx1ZURpcmVjdGx5LCBmbHVzaFN0eWxpbmcsIHNldENsYXNzLCBzZXRTdHlsZSwgdXBkYXRlQ2xhc3NWaWFDb250ZXh0LCB1cGRhdGVTdHlsZVZpYUNvbnRleHR9IGZyb20gJy4uL3N0eWxpbmcvYmluZGluZ3MnO1xuaW1wb3J0IHthY3RpdmF0ZVN0eWxpbmdNYXBGZWF0dXJlfSBmcm9tICcuLi9zdHlsaW5nL21hcF9iYXNlZF9iaW5kaW5ncyc7XG5pbXBvcnQge2F0dGFjaFN0eWxpbmdEZWJ1Z09iamVjdH0gZnJvbSAnLi4vc3R5bGluZy9zdHlsaW5nX2RlYnVnJztcbmltcG9ydCB7Tk9fQ0hBTkdFfSBmcm9tICcuLi90b2tlbnMnO1xuaW1wb3J0IHtyZW5kZXJTdHJpbmdpZnl9IGZyb20gJy4uL3V0aWwvbWlzY191dGlscyc7XG5pbXBvcnQge2FkZEl0ZW1Ub1N0eWxpbmdNYXAsIGFsbG9jU3R5bGluZ01hcEFycmF5LCBhbGxvY1RTdHlsaW5nQ29udGV4dCwgYWxsb3dEaXJlY3RTdHlsaW5nLCBjb25jYXRTdHJpbmcsIGZvcmNlQ2xhc3Nlc0FzU3RyaW5nLCBmb3JjZVN0eWxlc0FzU3RyaW5nLCBnZXRJbml0aWFsU3R5bGluZ1ZhbHVlLCBnZXRTdHlsaW5nTWFwQXJyYXksIGhhc0NsYXNzSW5wdXQsIGhhc1N0eWxlSW5wdXQsIGhhc1ZhbHVlQ2hhbmdlZCwgaXNDb250ZXh0TG9ja2VkLCBpc0hvc3RTdHlsaW5nQWN0aXZlLCBpc1N0eWxpbmdDb250ZXh0LCBub3JtYWxpemVJbnRvU3R5bGluZ01hcCwgc2V0VmFsdWUsIHN0eWxpbmdNYXBUb1N0cmluZ30gZnJvbSAnLi4vdXRpbC9zdHlsaW5nX3V0aWxzJztcbmltcG9ydCB7Z2V0TmF0aXZlQnlUTm9kZSwgZ2V0VE5vZGV9IGZyb20gJy4uL3V0aWwvdmlld191dGlscyc7XG5cblxuXG4vKipcbiAqIC0tLS0tLS0tXG4gKlxuICogVGhpcyBmaWxlIGNvbnRhaW5zIHRoZSBjb3JlIGxvZ2ljIGZvciBob3cgc3R5bGluZyBpbnN0cnVjdGlvbnMgYXJlIHByb2Nlc3NlZCBpbiBBbmd1bGFyLlxuICpcbiAqIFRvIGxlYXJuIG1vcmUgYWJvdXQgdGhlIGFsZ29yaXRobSBzZWUgYFRTdHlsaW5nQ29udGV4dGAuXG4gKlxuICogLS0tLS0tLS1cbiAqL1xuXG4vKipcbiAqIFNldHMgdGhlIGN1cnJlbnQgc3R5bGUgc2FuaXRpemVyIGZ1bmN0aW9uIHdoaWNoIHdpbGwgdGhlbiBiZSB1c2VkXG4gKiB3aXRoaW4gYWxsIGZvbGxvdy11cCBwcm9wIGFuZCBtYXAtYmFzZWQgc3R5bGUgYmluZGluZyBpbnN0cnVjdGlvbnNcbiAqIGZvciB0aGUgZ2l2ZW4gZWxlbWVudC5cbiAqXG4gKiBOb3RlIHRoYXQgb25jZSBzdHlsaW5nIGhhcyBiZWVuIGFwcGxpZWQgdG8gdGhlIGVsZW1lbnQgKGkuZS4gb25jZVxuICogYGFkdmFuY2UobilgIGlzIGV4ZWN1dGVkIG9yIHRoZSBob3N0QmluZGluZ3MvdGVtcGxhdGUgZnVuY3Rpb24gZXhpdHMpXG4gKiB0aGVuIHRoZSBhY3RpdmUgYHNhbml0aXplckZuYCB3aWxsIGJlIHNldCB0byBgbnVsbGAuIFRoaXMgbWVhbnMgdGhhdFxuICogb25jZSBzdHlsaW5nIGlzIGFwcGxpZWQgdG8gYW5vdGhlciBlbGVtZW50IHRoZW4gYSBhbm90aGVyIGNhbGwgdG9cbiAqIGBzdHlsZVNhbml0aXplcmAgd2lsbCBuZWVkIHRvIGJlIG1hZGUuXG4gKlxuICogQHBhcmFtIHNhbml0aXplckZuIFRoZSBzYW5pdGl6YXRpb24gZnVuY3Rpb24gdGhhdCB3aWxsIGJlIHVzZWQgdG9cbiAqICAgICAgIHByb2Nlc3Mgc3R5bGUgcHJvcC92YWx1ZSBlbnRyaWVzLlxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1c3R5bGVTYW5pdGl6ZXIoc2FuaXRpemVyOiBTdHlsZVNhbml0aXplRm4gfCBudWxsKTogdm9pZCB7XG4gIHNldEN1cnJlbnRTdHlsZVNhbml0aXplcihzYW5pdGl6ZXIpO1xufVxuXG4vKipcbiAqIFVwZGF0ZSBhIHN0eWxlIGJpbmRpbmcgb24gYW4gZWxlbWVudCB3aXRoIHRoZSBwcm92aWRlZCB2YWx1ZS5cbiAqXG4gKiBJZiB0aGUgc3R5bGUgdmFsdWUgaXMgZmFsc3kgdGhlbiBpdCB3aWxsIGJlIHJlbW92ZWQgZnJvbSB0aGUgZWxlbWVudFxuICogKG9yIGFzc2lnbmVkIGEgZGlmZmVyZW50IHZhbHVlIGRlcGVuZGluZyBpZiB0aGVyZSBhcmUgYW55IHN0eWxlcyBwbGFjZWRcbiAqIG9uIHRoZSBlbGVtZW50IHdpdGggYHN0eWxlTWFwYCBvciBhbnkgc3RhdGljIHN0eWxlcyB0aGF0IGFyZVxuICogcHJlc2VudCBmcm9tIHdoZW4gdGhlIGVsZW1lbnQgd2FzIGNyZWF0ZWQgd2l0aCBgc3R5bGluZ2ApLlxuICpcbiAqIE5vdGUgdGhhdCB0aGUgc3R5bGluZyBlbGVtZW50IGlzIHVwZGF0ZWQgYXMgcGFydCBvZiBgc3R5bGluZ0FwcGx5YC5cbiAqXG4gKiBAcGFyYW0gcHJvcCBBIHZhbGlkIENTUyBwcm9wZXJ0eS5cbiAqIEBwYXJhbSB2YWx1ZSBOZXcgdmFsdWUgdG8gd3JpdGUgKGBudWxsYCBvciBhbiBlbXB0eSBzdHJpbmcgdG8gcmVtb3ZlKS5cbiAqIEBwYXJhbSBzdWZmaXggT3B0aW9uYWwgc3VmZml4LiBVc2VkIHdpdGggc2NhbGFyIHZhbHVlcyB0byBhZGQgdW5pdCBzdWNoIGFzIGBweGAuXG4gKiAgICAgICAgTm90ZSB0aGF0IHdoZW4gYSBzdWZmaXggaXMgcHJvdmlkZWQgdGhlbiB0aGUgdW5kZXJseWluZyBzYW5pdGl6ZXIgd2lsbFxuICogICAgICAgIGJlIGlnbm9yZWQuXG4gKlxuICogTm90ZSB0aGF0IHRoaXMgd2lsbCBhcHBseSB0aGUgcHJvdmlkZWQgc3R5bGUgdmFsdWUgdG8gdGhlIGhvc3QgZWxlbWVudCBpZiB0aGlzIGZ1bmN0aW9uIGlzIGNhbGxlZFxuICogd2l0aGluIGEgaG9zdCBiaW5kaW5nIGZ1bmN0aW9uLlxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1c3R5bGVQcm9wKFxuICAgIHByb3A6IHN0cmluZywgdmFsdWU6IHN0cmluZyB8IG51bWJlciB8IFNhZmVWYWx1ZSB8IG51bGwsIHN1ZmZpeD86IHN0cmluZyB8IG51bGwpOiB2b2lkIHtcbiAgc3R5bGVQcm9wSW50ZXJuYWwoZ2V0U2VsZWN0ZWRJbmRleCgpLCBwcm9wLCB2YWx1ZSwgc3VmZml4KTtcbn1cblxuLyoqXG4gKiBJbnRlcm5hbCBmdW5jdGlvbiBmb3IgYXBwbHlpbmcgYSBzaW5nbGUgc3R5bGUgdG8gYW4gZWxlbWVudC5cbiAqXG4gKiBUaGUgcmVhc29uIHdoeSB0aGlzIGZ1bmN0aW9uIGhhcyBiZWVuIHNlcGFyYXRlZCBmcm9tIGDJtcm1c3R5bGVQcm9wYCBpcyBiZWNhdXNlXG4gKiBpdCBpcyBhbHNvIGNhbGxlZCBmcm9tIGDJtcm1c3R5bGVQcm9wSW50ZXJwb2xhdGVgLlxuICovXG5leHBvcnQgZnVuY3Rpb24gc3R5bGVQcm9wSW50ZXJuYWwoXG4gICAgZWxlbWVudEluZGV4OiBudW1iZXIsIHByb3A6IHN0cmluZywgdmFsdWU6IHN0cmluZyB8IG51bWJlciB8IFNhZmVWYWx1ZSB8IG51bGwsXG4gICAgc3VmZml4Pzogc3RyaW5nIHwgbnVsbCB8IHVuZGVmaW5lZCk6IHZvaWQge1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG5cbiAgLy8gaWYgYSB2YWx1ZSBpcyBpbnRlcnBvbGF0ZWQgdGhlbiBpdCBtYXkgcmVuZGVyIGEgYE5PX0NIQU5HRWAgdmFsdWUuXG4gIC8vIGluIHRoaXMgY2FzZSB3ZSBkbyBub3QgbmVlZCB0byBkbyBhbnl0aGluZywgYnV0IHRoZSBiaW5kaW5nIGluZGV4XG4gIC8vIHN0aWxsIG5lZWRzIHRvIGJlIGluY3JlbWVudGVkIGJlY2F1c2UgYWxsIHN0eWxpbmcgYmluZGluZyB2YWx1ZXNcbiAgLy8gYXJlIHN0b3JlZCBpbnNpZGUgb2YgdGhlIGxWaWV3LlxuICBjb25zdCBiaW5kaW5nSW5kZXggPSBsVmlld1tCSU5ESU5HX0lOREVYXSsrO1xuXG4gIGNvbnN0IHVwZGF0ZWQgPVxuICAgICAgc3R5bGluZ1Byb3AoZWxlbWVudEluZGV4LCBiaW5kaW5nSW5kZXgsIHByb3AsIHJlc29sdmVTdHlsZVByb3BWYWx1ZSh2YWx1ZSwgc3VmZml4KSwgZmFsc2UpO1xuICBpZiAobmdEZXZNb2RlKSB7XG4gICAgbmdEZXZNb2RlLnN0eWxlUHJvcCsrO1xuICAgIGlmICh1cGRhdGVkKSB7XG4gICAgICBuZ0Rldk1vZGUuc3R5bGVQcm9wQ2FjaGVNaXNzKys7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogVXBkYXRlIGEgY2xhc3MgYmluZGluZyBvbiBhbiBlbGVtZW50IHdpdGggdGhlIHByb3ZpZGVkIHZhbHVlLlxuICpcbiAqIFRoaXMgaW5zdHJ1Y3Rpb24gaXMgbWVhbnQgdG8gaGFuZGxlIHRoZSBgW2NsYXNzLmZvb109XCJleHBcImAgY2FzZSBhbmQsXG4gKiB0aGVyZWZvcmUsIHRoZSBjbGFzcyBiaW5kaW5nIGl0c2VsZiBtdXN0IGFscmVhZHkgYmUgYWxsb2NhdGVkIHVzaW5nXG4gKiBgc3R5bGluZ2Agd2l0aGluIHRoZSBjcmVhdGlvbiBibG9jay5cbiAqXG4gKiBAcGFyYW0gcHJvcCBBIHZhbGlkIENTUyBjbGFzcyAob25seSBvbmUpLlxuICogQHBhcmFtIHZhbHVlIEEgdHJ1ZS9mYWxzZSB2YWx1ZSB3aGljaCB3aWxsIHR1cm4gdGhlIGNsYXNzIG9uIG9yIG9mZi5cbiAqXG4gKiBOb3RlIHRoYXQgdGhpcyB3aWxsIGFwcGx5IHRoZSBwcm92aWRlZCBjbGFzcyB2YWx1ZSB0byB0aGUgaG9zdCBlbGVtZW50IGlmIHRoaXMgZnVuY3Rpb25cbiAqIGlzIGNhbGxlZCB3aXRoaW4gYSBob3N0IGJpbmRpbmcgZnVuY3Rpb24uXG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVjbGFzc1Byb3AoY2xhc3NOYW1lOiBzdHJpbmcsIHZhbHVlOiBib29sZWFuIHwgbnVsbCk6IHZvaWQge1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG5cbiAgLy8gaWYgYSB2YWx1ZSBpcyBpbnRlcnBvbGF0ZWQgdGhlbiBpdCBtYXkgcmVuZGVyIGEgYE5PX0NIQU5HRWAgdmFsdWUuXG4gIC8vIGluIHRoaXMgY2FzZSB3ZSBkbyBub3QgbmVlZCB0byBkbyBhbnl0aGluZywgYnV0IHRoZSBiaW5kaW5nIGluZGV4XG4gIC8vIHN0aWxsIG5lZWRzIHRvIGJlIGluY3JlbWVudGVkIGJlY2F1c2UgYWxsIHN0eWxpbmcgYmluZGluZyB2YWx1ZXNcbiAgLy8gYXJlIHN0b3JlZCBpbnNpZGUgb2YgdGhlIGxWaWV3LlxuICBjb25zdCBiaW5kaW5nSW5kZXggPSBsVmlld1tCSU5ESU5HX0lOREVYXSsrO1xuXG4gIGNvbnN0IHVwZGF0ZWQgPSBzdHlsaW5nUHJvcChnZXRTZWxlY3RlZEluZGV4KCksIGJpbmRpbmdJbmRleCwgY2xhc3NOYW1lLCB2YWx1ZSwgdHJ1ZSk7XG4gIGlmIChuZ0Rldk1vZGUpIHtcbiAgICBuZ0Rldk1vZGUuY2xhc3NQcm9wKys7XG4gICAgaWYgKHVwZGF0ZWQpIHtcbiAgICAgIG5nRGV2TW9kZS5jbGFzc1Byb3BDYWNoZU1pc3MrKztcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBTaGFyZWQgZnVuY3Rpb24gdXNlZCB0byB1cGRhdGUgYSBwcm9wLWJhc2VkIHN0eWxpbmcgYmluZGluZyBmb3IgYW4gZWxlbWVudC5cbiAqXG4gKiBEZXBlbmRpbmcgb24gdGhlIHN0YXRlIG9mIHRoZSBgdE5vZGUuc3R5bGVzYCBzdHlsZXMgY29udGV4dCwgdGhlIHN0eWxlL3Byb3BcbiAqIHZhbHVlIG1heSBiZSBhcHBsaWVkIGRpcmVjdGx5IHRvIHRoZSBlbGVtZW50IGluc3RlYWQgb2YgYmVpbmcgcHJvY2Vzc2VkXG4gKiB0aHJvdWdoIHRoZSBjb250ZXh0LiBUaGUgcmVhc29uIHdoeSB0aGlzIG9jY3VycyBpcyBmb3IgcGVyZm9ybWFuY2UgYW5kIGZ1bGx5XG4gKiBkZXBlbmRzIG9uIHRoZSBzdGF0ZSBvZiB0aGUgY29udGV4dCAoaS5lLiB3aGV0aGVyIG9yIG5vdCB0aGVyZSBhcmUgZHVwbGljYXRlXG4gKiBiaW5kaW5ncyBvciB3aGV0aGVyIG9yIG5vdCB0aGVyZSBhcmUgbWFwLWJhc2VkIGJpbmRpbmdzIGFuZCBwcm9wZXJ0eSBiaW5kaW5nc1xuICogcHJlc2VudCB0b2dldGhlcikuXG4gKi9cbmZ1bmN0aW9uIHN0eWxpbmdQcm9wKFxuICAgIGVsZW1lbnRJbmRleDogbnVtYmVyLCBiaW5kaW5nSW5kZXg6IG51bWJlciwgcHJvcDogc3RyaW5nLFxuICAgIHZhbHVlOiBib29sZWFuIHwgbnVtYmVyIHwgU2FmZVZhbHVlIHwgc3RyaW5nIHwgbnVsbCB8IHVuZGVmaW5lZCB8IE5PX0NIQU5HRSxcbiAgICBpc0NsYXNzQmFzZWQ6IGJvb2xlYW4pOiBib29sZWFuIHtcbiAgbGV0IHVwZGF0ZWQgPSBmYWxzZTtcblxuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IHROb2RlID0gZ2V0VE5vZGUoZWxlbWVudEluZGV4LCBsVmlldyk7XG4gIGNvbnN0IG5hdGl2ZSA9IGdldE5hdGl2ZUJ5VE5vZGUodE5vZGUsIGxWaWV3KSBhcyBSRWxlbWVudDtcblxuICBjb25zdCBob3N0QmluZGluZ3NNb2RlID0gaXNIb3N0U3R5bGluZygpO1xuICBjb25zdCBjb250ZXh0ID0gaXNDbGFzc0Jhc2VkID8gZ2V0Q2xhc3Nlc0NvbnRleHQodE5vZGUpIDogZ2V0U3R5bGVzQ29udGV4dCh0Tm9kZSk7XG4gIGNvbnN0IHNhbml0aXplciA9IGlzQ2xhc3NCYXNlZCA/IG51bGwgOiBnZXRDdXJyZW50U3R5bGVTYW5pdGl6ZXIoKTtcblxuICAvLyBEaXJlY3QgQXBwbHkgQ2FzZTogYnlwYXNzIGNvbnRleHQgcmVzb2x1dGlvbiBhbmQgYXBwbHkgdGhlXG4gIC8vIHN0eWxlL2NsYXNzIHZhbHVlIGRpcmVjdGx5IHRvIHRoZSBlbGVtZW50XG4gIGlmIChhbGxvd0RpcmVjdFN0eWxpbmcoY29udGV4dCwgaG9zdEJpbmRpbmdzTW9kZSkpIHtcbiAgICBjb25zdCByZW5kZXJlciA9IGdldFJlbmRlcmVyKHROb2RlLCBsVmlldyk7XG4gICAgdXBkYXRlZCA9IGFwcGx5U3R5bGluZ1ZhbHVlRGlyZWN0bHkoXG4gICAgICAgIHJlbmRlcmVyLCBjb250ZXh0LCBuYXRpdmUsIGxWaWV3LCBiaW5kaW5nSW5kZXgsIHByb3AsIHZhbHVlLFxuICAgICAgICBpc0NsYXNzQmFzZWQgPyBzZXRDbGFzcyA6IHNldFN0eWxlLCBzYW5pdGl6ZXIpO1xuICB9IGVsc2Uge1xuICAgIC8vIENvbnRleHQgUmVzb2x1dGlvbiAob3IgZmlyc3QgdXBkYXRlKSBDYXNlOiBzYXZlIHRoZSB2YWx1ZVxuICAgIC8vIGFuZCBkZWZlciB0byB0aGUgY29udGV4dCB0byBmbHVzaCBhbmQgYXBwbHkgdGhlIHN0eWxlL2NsYXNzIGJpbmRpbmdcbiAgICAvLyB2YWx1ZSB0byB0aGUgZWxlbWVudC5cbiAgICBjb25zdCBkaXJlY3RpdmVJbmRleCA9IGdldEFjdGl2ZURpcmVjdGl2ZUlkKCk7XG4gICAgaWYgKGlzQ2xhc3NCYXNlZCkge1xuICAgICAgdXBkYXRlZCA9IHVwZGF0ZUNsYXNzVmlhQ29udGV4dChcbiAgICAgICAgICBjb250ZXh0LCBsVmlldywgbmF0aXZlLCBkaXJlY3RpdmVJbmRleCwgcHJvcCwgYmluZGluZ0luZGV4LFxuICAgICAgICAgIHZhbHVlIGFzIHN0cmluZyB8IGJvb2xlYW4gfCBudWxsKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdXBkYXRlZCA9IHVwZGF0ZVN0eWxlVmlhQ29udGV4dChcbiAgICAgICAgICBjb250ZXh0LCBsVmlldywgbmF0aXZlLCBkaXJlY3RpdmVJbmRleCwgcHJvcCwgYmluZGluZ0luZGV4LFxuICAgICAgICAgIHZhbHVlIGFzIHN0cmluZyB8IFNhZmVWYWx1ZSB8IG51bGwsIHNhbml0aXplcik7XG4gICAgfVxuXG4gICAgc2V0RWxlbWVudEV4aXRGbihzdHlsaW5nQXBwbHkpO1xuICB9XG5cbiAgcmV0dXJuIHVwZGF0ZWQ7XG59XG5cbi8qKlxuICogVXBkYXRlIHN0eWxlIGJpbmRpbmdzIHVzaW5nIGFuIG9iamVjdCBsaXRlcmFsIG9uIGFuIGVsZW1lbnQuXG4gKlxuICogVGhpcyBpbnN0cnVjdGlvbiBpcyBtZWFudCB0byBhcHBseSBzdHlsaW5nIHZpYSB0aGUgYFtzdHlsZV09XCJleHBcImAgdGVtcGxhdGUgYmluZGluZ3MuXG4gKiBXaGVuIHN0eWxlcyBhcmUgYXBwbGllZCB0byB0aGUgZWxlbWVudCB0aGV5IHdpbGwgdGhlbiBiZSB1cGRhdGVkIHdpdGggcmVzcGVjdCB0b1xuICogYW55IHN0eWxlcy9jbGFzc2VzIHNldCB2aWEgYHN0eWxlUHJvcGAuIElmIGFueSBzdHlsZXMgYXJlIHNldCB0byBmYWxzeVxuICogdGhlbiB0aGV5IHdpbGwgYmUgcmVtb3ZlZCBmcm9tIHRoZSBlbGVtZW50LlxuICpcbiAqIE5vdGUgdGhhdCB0aGUgc3R5bGluZyBpbnN0cnVjdGlvbiB3aWxsIG5vdCBiZSBhcHBsaWVkIHVudGlsIGBzdHlsaW5nQXBwbHlgIGlzIGNhbGxlZC5cbiAqXG4gKiBAcGFyYW0gc3R5bGVzIEEga2V5L3ZhbHVlIHN0eWxlIG1hcCBvZiB0aGUgc3R5bGVzIHRoYXQgd2lsbCBiZSBhcHBsaWVkIHRvIHRoZSBnaXZlbiBlbGVtZW50LlxuICogICAgICAgIEFueSBtaXNzaW5nIHN0eWxlcyAodGhhdCBoYXZlIGFscmVhZHkgYmVlbiBhcHBsaWVkIHRvIHRoZSBlbGVtZW50IGJlZm9yZWhhbmQpIHdpbGwgYmVcbiAqICAgICAgICByZW1vdmVkICh1bnNldCkgZnJvbSB0aGUgZWxlbWVudCdzIHN0eWxpbmcuXG4gKlxuICogTm90ZSB0aGF0IHRoaXMgd2lsbCBhcHBseSB0aGUgcHJvdmlkZWQgc3R5bGVNYXAgdmFsdWUgdG8gdGhlIGhvc3QgZWxlbWVudCBpZiB0aGlzIGZ1bmN0aW9uXG4gKiBpcyBjYWxsZWQgd2l0aGluIGEgaG9zdCBiaW5kaW5nLlxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1c3R5bGVNYXAoc3R5bGVzOiB7W3N0eWxlTmFtZTogc3RyaW5nXTogYW55fSB8IE5PX0NIQU5HRSB8IG51bGwpOiB2b2lkIHtcbiAgY29uc3QgaW5kZXggPSBnZXRTZWxlY3RlZEluZGV4KCk7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgdE5vZGUgPSBnZXRUTm9kZShpbmRleCwgbFZpZXcpO1xuICBjb25zdCBjb250ZXh0ID0gZ2V0U3R5bGVzQ29udGV4dCh0Tm9kZSk7XG5cbiAgLy8gaWYgYSB2YWx1ZSBpcyBpbnRlcnBvbGF0ZWQgdGhlbiBpdCBtYXkgcmVuZGVyIGEgYE5PX0NIQU5HRWAgdmFsdWUuXG4gIC8vIGluIHRoaXMgY2FzZSB3ZSBkbyBub3QgbmVlZCB0byBkbyBhbnl0aGluZywgYnV0IHRoZSBiaW5kaW5nIGluZGV4XG4gIC8vIHN0aWxsIG5lZWRzIHRvIGJlIGluY3JlbWVudGVkIGJlY2F1c2UgYWxsIHN0eWxpbmcgYmluZGluZyB2YWx1ZXNcbiAgLy8gYXJlIHN0b3JlZCBpbnNpZGUgb2YgdGhlIGxWaWV3LlxuICBjb25zdCBiaW5kaW5nSW5kZXggPSBsVmlld1tCSU5ESU5HX0lOREVYXSsrO1xuXG4gIC8vIGlucHV0cyBhcmUgb25seSBldmFsdWF0ZWQgZnJvbSBhIHRlbXBsYXRlIGJpbmRpbmcgaW50byBhIGRpcmVjdGl2ZSwgdGhlcmVmb3JlLFxuICAvLyB0aGVyZSBzaG91bGQgbm90IGJlIGEgc2l0dWF0aW9uIHdoZXJlIGEgZGlyZWN0aXZlIGhvc3QgYmluZGluZ3MgZnVuY3Rpb25cbiAgLy8gZXZhbHVhdGVzIHRoZSBpbnB1dHMgKHRoaXMgc2hvdWxkIG9ubHkgaGFwcGVuIGluIHRoZSB0ZW1wbGF0ZSBmdW5jdGlvbilcbiAgaWYgKCFpc0hvc3RTdHlsaW5nKCkgJiYgaGFzU3R5bGVJbnB1dCh0Tm9kZSkgJiYgc3R5bGVzICE9PSBOT19DSEFOR0UpIHtcbiAgICB1cGRhdGVEaXJlY3RpdmVJbnB1dFZhbHVlKGNvbnRleHQsIGxWaWV3LCB0Tm9kZSwgYmluZGluZ0luZGV4LCBzdHlsZXMsIGZhbHNlKTtcbiAgICBzdHlsZXMgPSBOT19DSEFOR0U7XG4gIH1cblxuICBjb25zdCB1cGRhdGVkID0gX3N0eWxpbmdNYXAoaW5kZXgsIGNvbnRleHQsIGJpbmRpbmdJbmRleCwgc3R5bGVzLCBmYWxzZSk7XG4gIGlmIChuZ0Rldk1vZGUpIHtcbiAgICBuZ0Rldk1vZGUuc3R5bGVNYXArKztcbiAgICBpZiAodXBkYXRlZCkge1xuICAgICAgbmdEZXZNb2RlLnN0eWxlTWFwQ2FjaGVNaXNzKys7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogVXBkYXRlIGNsYXNzIGJpbmRpbmdzIHVzaW5nIGFuIG9iamVjdCBsaXRlcmFsIG9yIGNsYXNzLXN0cmluZyBvbiBhbiBlbGVtZW50LlxuICpcbiAqIFRoaXMgaW5zdHJ1Y3Rpb24gaXMgbWVhbnQgdG8gYXBwbHkgc3R5bGluZyB2aWEgdGhlIGBbY2xhc3NdPVwiZXhwXCJgIHRlbXBsYXRlIGJpbmRpbmdzLlxuICogV2hlbiBjbGFzc2VzIGFyZSBhcHBsaWVkIHRvIHRoZSBlbGVtZW50IHRoZXkgd2lsbCB0aGVuIGJlIHVwZGF0ZWQgd2l0aFxuICogcmVzcGVjdCB0byBhbnkgc3R5bGVzL2NsYXNzZXMgc2V0IHZpYSBgY2xhc3NQcm9wYC4gSWYgYW55XG4gKiBjbGFzc2VzIGFyZSBzZXQgdG8gZmFsc3kgdGhlbiB0aGV5IHdpbGwgYmUgcmVtb3ZlZCBmcm9tIHRoZSBlbGVtZW50LlxuICpcbiAqIE5vdGUgdGhhdCB0aGUgc3R5bGluZyBpbnN0cnVjdGlvbiB3aWxsIG5vdCBiZSBhcHBsaWVkIHVudGlsIGBzdHlsaW5nQXBwbHlgIGlzIGNhbGxlZC5cbiAqIE5vdGUgdGhhdCB0aGlzIHdpbGwgdGhlIHByb3ZpZGVkIGNsYXNzTWFwIHZhbHVlIHRvIHRoZSBob3N0IGVsZW1lbnQgaWYgdGhpcyBmdW5jdGlvbiBpcyBjYWxsZWRcbiAqIHdpdGhpbiBhIGhvc3QgYmluZGluZy5cbiAqXG4gKiBAcGFyYW0gY2xhc3NlcyBBIGtleS92YWx1ZSBtYXAgb3Igc3RyaW5nIG9mIENTUyBjbGFzc2VzIHRoYXQgd2lsbCBiZSBhZGRlZCB0byB0aGVcbiAqICAgICAgICBnaXZlbiBlbGVtZW50LiBBbnkgbWlzc2luZyBjbGFzc2VzICh0aGF0IGhhdmUgYWxyZWFkeSBiZWVuIGFwcGxpZWQgdG8gdGhlIGVsZW1lbnRcbiAqICAgICAgICBiZWZvcmVoYW5kKSB3aWxsIGJlIHJlbW92ZWQgKHVuc2V0KSBmcm9tIHRoZSBlbGVtZW50J3MgbGlzdCBvZiBDU1MgY2xhc3Nlcy5cbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWNsYXNzTWFwKGNsYXNzZXM6IHtbY2xhc3NOYW1lOiBzdHJpbmddOiBhbnl9IHwgTk9fQ0hBTkdFIHwgc3RyaW5nIHwgbnVsbCk6IHZvaWQge1xuICBjbGFzc01hcEludGVybmFsKGdldFNlbGVjdGVkSW5kZXgoKSwgY2xhc3Nlcyk7XG59XG5cbi8qKlxuICogSW50ZXJuYWwgZnVuY3Rpb24gZm9yIGFwcGx5aW5nIGEgY2xhc3Mgc3RyaW5nIG9yIGtleS92YWx1ZSBtYXAgb2YgY2xhc3NlcyB0byBhbiBlbGVtZW50LlxuICpcbiAqIFRoZSByZWFzb24gd2h5IHRoaXMgZnVuY3Rpb24gaGFzIGJlZW4gc2VwYXJhdGVkIGZyb20gYMm1ybVjbGFzc01hcGAgaXMgYmVjYXVzZVxuICogaXQgaXMgYWxzbyBjYWxsZWQgZnJvbSBgybXJtWNsYXNzTWFwSW50ZXJwb2xhdGVgLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY2xhc3NNYXBJbnRlcm5hbChcbiAgICBlbGVtZW50SW5kZXg6IG51bWJlciwgY2xhc3Nlczoge1tjbGFzc05hbWU6IHN0cmluZ106IGFueX0gfCBOT19DSEFOR0UgfCBzdHJpbmcgfCBudWxsKTogdm9pZCB7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgdE5vZGUgPSBnZXRUTm9kZShlbGVtZW50SW5kZXgsIGxWaWV3KTtcbiAgY29uc3QgY29udGV4dCA9IGdldENsYXNzZXNDb250ZXh0KHROb2RlKTtcblxuICAvLyBpZiBhIHZhbHVlIGlzIGludGVycG9sYXRlZCB0aGVuIGl0IG1heSByZW5kZXIgYSBgTk9fQ0hBTkdFYCB2YWx1ZS5cbiAgLy8gaW4gdGhpcyBjYXNlIHdlIGRvIG5vdCBuZWVkIHRvIGRvIGFueXRoaW5nLCBidXQgdGhlIGJpbmRpbmcgaW5kZXhcbiAgLy8gc3RpbGwgbmVlZHMgdG8gYmUgaW5jcmVtZW50ZWQgYmVjYXVzZSBhbGwgc3R5bGluZyBiaW5kaW5nIHZhbHVlc1xuICAvLyBhcmUgc3RvcmVkIGluc2lkZSBvZiB0aGUgbFZpZXcuXG4gIGNvbnN0IGJpbmRpbmdJbmRleCA9IGxWaWV3W0JJTkRJTkdfSU5ERVhdKys7XG5cbiAgLy8gaW5wdXRzIGFyZSBvbmx5IGV2YWx1YXRlZCBmcm9tIGEgdGVtcGxhdGUgYmluZGluZyBpbnRvIGEgZGlyZWN0aXZlLCB0aGVyZWZvcmUsXG4gIC8vIHRoZXJlIHNob3VsZCBub3QgYmUgYSBzaXR1YXRpb24gd2hlcmUgYSBkaXJlY3RpdmUgaG9zdCBiaW5kaW5ncyBmdW5jdGlvblxuICAvLyBldmFsdWF0ZXMgdGhlIGlucHV0cyAodGhpcyBzaG91bGQgb25seSBoYXBwZW4gaW4gdGhlIHRlbXBsYXRlIGZ1bmN0aW9uKVxuICBpZiAoIWlzSG9zdFN0eWxpbmcoKSAmJiBoYXNDbGFzc0lucHV0KHROb2RlKSAmJiBjbGFzc2VzICE9PSBOT19DSEFOR0UpIHtcbiAgICB1cGRhdGVEaXJlY3RpdmVJbnB1dFZhbHVlKGNvbnRleHQsIGxWaWV3LCB0Tm9kZSwgYmluZGluZ0luZGV4LCBjbGFzc2VzLCB0cnVlKTtcbiAgICBjbGFzc2VzID0gTk9fQ0hBTkdFO1xuICB9XG5cbiAgY29uc3QgdXBkYXRlZCA9IF9zdHlsaW5nTWFwKGVsZW1lbnRJbmRleCwgY29udGV4dCwgYmluZGluZ0luZGV4LCBjbGFzc2VzLCB0cnVlKTtcbiAgaWYgKG5nRGV2TW9kZSkge1xuICAgIG5nRGV2TW9kZS5jbGFzc01hcCsrO1xuICAgIGlmICh1cGRhdGVkKSB7XG4gICAgICBuZ0Rldk1vZGUuY2xhc3NNYXBDYWNoZU1pc3MrKztcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBTaGFyZWQgZnVuY3Rpb24gdXNlZCB0byB1cGRhdGUgYSBtYXAtYmFzZWQgc3R5bGluZyBiaW5kaW5nIGZvciBhbiBlbGVtZW50LlxuICpcbiAqIFdoZW4gdGhpcyBmdW5jdGlvbiBpcyBjYWxsZWQgaXQgd2lsbCBhY3RpdmF0ZSBzdXBwb3J0IGZvciBgW3N0eWxlXWAgYW5kXG4gKiBgW2NsYXNzXWAgYmluZGluZ3MgaW4gQW5ndWxhci5cbiAqL1xuZnVuY3Rpb24gX3N0eWxpbmdNYXAoXG4gICAgZWxlbWVudEluZGV4OiBudW1iZXIsIGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCwgYmluZGluZ0luZGV4OiBudW1iZXIsXG4gICAgdmFsdWU6IHtba2V5OiBzdHJpbmddOiBhbnl9IHwgc3RyaW5nIHwgbnVsbCwgaXNDbGFzc0Jhc2VkOiBib29sZWFuKTogYm9vbGVhbiB7XG4gIGxldCB1cGRhdGVkID0gZmFsc2U7XG5cbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCBkaXJlY3RpdmVJbmRleCA9IGdldEFjdGl2ZURpcmVjdGl2ZUlkKCk7XG4gIGNvbnN0IHROb2RlID0gZ2V0VE5vZGUoZWxlbWVudEluZGV4LCBsVmlldyk7XG4gIGNvbnN0IG5hdGl2ZSA9IGdldE5hdGl2ZUJ5VE5vZGUodE5vZGUsIGxWaWV3KSBhcyBSRWxlbWVudDtcbiAgY29uc3Qgb2xkVmFsdWUgPSBsVmlld1tiaW5kaW5nSW5kZXhdIGFzIFN0eWxpbmdNYXBBcnJheSB8IG51bGw7XG4gIGNvbnN0IGhvc3RCaW5kaW5nc01vZGUgPSBpc0hvc3RTdHlsaW5nKCk7XG4gIGNvbnN0IHNhbml0aXplciA9IGdldEN1cnJlbnRTdHlsZVNhbml0aXplcigpO1xuXG4gIGNvbnN0IHZhbHVlSGFzQ2hhbmdlZCA9IGhhc1ZhbHVlQ2hhbmdlZChvbGRWYWx1ZSwgdmFsdWUpO1xuICBjb25zdCBzdHlsaW5nTWFwQXJyID1cbiAgICAgIHZhbHVlID09PSBOT19DSEFOR0UgPyBOT19DSEFOR0UgOiBub3JtYWxpemVJbnRvU3R5bGluZ01hcChvbGRWYWx1ZSwgdmFsdWUsICFpc0NsYXNzQmFzZWQpO1xuXG4gIC8vIERpcmVjdCBBcHBseSBDYXNlOiBieXBhc3MgY29udGV4dCByZXNvbHV0aW9uIGFuZCBhcHBseSB0aGVcbiAgLy8gc3R5bGUvY2xhc3MgbWFwIHZhbHVlcyBkaXJlY3RseSB0byB0aGUgZWxlbWVudFxuICBpZiAoYWxsb3dEaXJlY3RTdHlsaW5nKGNvbnRleHQsIGhvc3RCaW5kaW5nc01vZGUpKSB7XG4gICAgY29uc3QgcmVuZGVyZXIgPSBnZXRSZW5kZXJlcih0Tm9kZSwgbFZpZXcpO1xuICAgIHVwZGF0ZWQgPSBhcHBseVN0eWxpbmdNYXBEaXJlY3RseShcbiAgICAgICAgcmVuZGVyZXIsIGNvbnRleHQsIG5hdGl2ZSwgbFZpZXcsIGJpbmRpbmdJbmRleCwgc3R5bGluZ01hcEFyciBhcyBTdHlsaW5nTWFwQXJyYXksXG4gICAgICAgIGlzQ2xhc3NCYXNlZCA/IHNldENsYXNzIDogc2V0U3R5bGUsIHNhbml0aXplciwgdmFsdWVIYXNDaGFuZ2VkKTtcbiAgfSBlbHNlIHtcbiAgICB1cGRhdGVkID0gdmFsdWVIYXNDaGFuZ2VkO1xuICAgIGFjdGl2YXRlU3R5bGluZ01hcEZlYXR1cmUoKTtcblxuICAgIC8vIENvbnRleHQgUmVzb2x1dGlvbiAob3IgZmlyc3QgdXBkYXRlKSBDYXNlOiBzYXZlIHRoZSBtYXAgdmFsdWVcbiAgICAvLyBhbmQgZGVmZXIgdG8gdGhlIGNvbnRleHQgdG8gZmx1c2ggYW5kIGFwcGx5IHRoZSBzdHlsZS9jbGFzcyBiaW5kaW5nXG4gICAgLy8gdmFsdWUgdG8gdGhlIGVsZW1lbnQuXG4gICAgaWYgKGlzQ2xhc3NCYXNlZCkge1xuICAgICAgdXBkYXRlQ2xhc3NWaWFDb250ZXh0KFxuICAgICAgICAgIGNvbnRleHQsIGxWaWV3LCBuYXRpdmUsIGRpcmVjdGl2ZUluZGV4LCBudWxsLCBiaW5kaW5nSW5kZXgsIHN0eWxpbmdNYXBBcnIsXG4gICAgICAgICAgdmFsdWVIYXNDaGFuZ2VkKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdXBkYXRlU3R5bGVWaWFDb250ZXh0KFxuICAgICAgICAgIGNvbnRleHQsIGxWaWV3LCBuYXRpdmUsIGRpcmVjdGl2ZUluZGV4LCBudWxsLCBiaW5kaW5nSW5kZXgsIHN0eWxpbmdNYXBBcnIsIHNhbml0aXplcixcbiAgICAgICAgICB2YWx1ZUhhc0NoYW5nZWQpO1xuICAgIH1cblxuICAgIHNldEVsZW1lbnRFeGl0Rm4oc3R5bGluZ0FwcGx5KTtcbiAgfVxuXG4gIHJldHVybiB1cGRhdGVkO1xufVxuXG4vKipcbiAqIFdyaXRlcyBhIHZhbHVlIHRvIGEgZGlyZWN0aXZlJ3MgYHN0eWxlYCBvciBgY2xhc3NgIGlucHV0IGJpbmRpbmcgKGlmIGl0IGhhcyBjaGFuZ2VkKS5cbiAqXG4gKiBJZiBhIGRpcmVjdGl2ZSBoYXMgYSBgQElucHV0YCBiaW5kaW5nIHRoYXQgaXMgc2V0IG9uIGBzdHlsZWAgb3IgYGNsYXNzYCB0aGVuIHRoYXQgdmFsdWVcbiAqIHdpbGwgdGFrZSBwcmlvcml0eSBvdmVyIHRoZSB1bmRlcmx5aW5nIHN0eWxlL2NsYXNzIHN0eWxpbmcgYmluZGluZ3MuIFRoaXMgdmFsdWUgd2lsbFxuICogYmUgdXBkYXRlZCBmb3IgdGhlIGJpbmRpbmcgZWFjaCB0aW1lIGR1cmluZyBjaGFuZ2UgZGV0ZWN0aW9uLlxuICpcbiAqIFdoZW4gdGhpcyBvY2N1cnMgdGhpcyBmdW5jdGlvbiB3aWxsIGF0dGVtcHQgdG8gd3JpdGUgdGhlIHZhbHVlIHRvIHRoZSBpbnB1dCBiaW5kaW5nXG4gKiBkZXBlbmRpbmcgb24gdGhlIGZvbGxvd2luZyBzaXR1YXRpb25zOlxuICpcbiAqIC0gSWYgYG9sZFZhbHVlICE9PSBuZXdWYWx1ZWBcbiAqIC0gSWYgYG5ld1ZhbHVlYCBpcyBgbnVsbGAgKGJ1dCB0aGlzIGlzIHNraXBwZWQgaWYgaXQgaXMgZHVyaW5nIHRoZSBmaXJzdCB1cGRhdGUgcGFzcy0tXG4gKiAgICB3aGljaCBpcyB3aGVuIHRoZSBjb250ZXh0IGlzIG5vdCBsb2NrZWQgeWV0KVxuICovXG5mdW5jdGlvbiB1cGRhdGVEaXJlY3RpdmVJbnB1dFZhbHVlKFxuICAgIGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCwgbFZpZXc6IExWaWV3LCB0Tm9kZTogVE5vZGUsIGJpbmRpbmdJbmRleDogbnVtYmVyLCBuZXdWYWx1ZTogYW55LFxuICAgIGlzQ2xhc3NCYXNlZDogYm9vbGVhbik6IHZvaWQge1xuICBjb25zdCBvbGRWYWx1ZSA9IGxWaWV3W2JpbmRpbmdJbmRleF07XG4gIGlmIChvbGRWYWx1ZSAhPT0gbmV3VmFsdWUpIHtcbiAgICAvLyBldmVuIGlmIHRoZSB2YWx1ZSBoYXMgY2hhbmdlZCB3ZSBtYXkgbm90IHdhbnQgdG8gZW1pdCBpdCB0byB0aGVcbiAgICAvLyBkaXJlY3RpdmUgaW5wdXQocykgaW4gdGhlIGV2ZW50IHRoYXQgaXQgaXMgZmFsc3kgZHVyaW5nIHRoZVxuICAgIC8vIGZpcnN0IHVwZGF0ZSBwYXNzLlxuICAgIGlmIChuZXdWYWx1ZSB8fCBpc0NvbnRleHRMb2NrZWQoY29udGV4dCwgZmFsc2UpKSB7XG4gICAgICBjb25zdCBpbnB1dE5hbWUgPSBpc0NsYXNzQmFzZWQgPyAnY2xhc3MnIDogJ3N0eWxlJztcbiAgICAgIGNvbnN0IGlucHV0cyA9IHROb2RlLmlucHV0cyAhW2lucHV0TmFtZV0gITtcbiAgICAgIGNvbnN0IGluaXRpYWxWYWx1ZSA9IGdldEluaXRpYWxTdHlsaW5nVmFsdWUoY29udGV4dCk7XG4gICAgICBjb25zdCB2YWx1ZSA9IG5vcm1hbGl6ZVN0eWxpbmdEaXJlY3RpdmVJbnB1dFZhbHVlKGluaXRpYWxWYWx1ZSwgbmV3VmFsdWUsIGlzQ2xhc3NCYXNlZCk7XG4gICAgICBzZXRJbnB1dHNGb3JQcm9wZXJ0eShsVmlldywgaW5wdXRzLCB2YWx1ZSk7XG4gICAgICBzZXRFbGVtZW50RXhpdEZuKHN0eWxpbmdBcHBseSk7XG4gICAgfVxuICAgIHNldFZhbHVlKGxWaWV3LCBiaW5kaW5nSW5kZXgsIG5ld1ZhbHVlKTtcbiAgfVxufVxuXG4vKipcbiAqIFJldHVybnMgdGhlIGFwcHJvcHJpYXRlIGRpcmVjdGl2ZSBpbnB1dCB2YWx1ZSBmb3IgYHN0eWxlYCBvciBgY2xhc3NgLlxuICpcbiAqIEVhcmxpZXIgdmVyc2lvbnMgb2YgQW5ndWxhciBleHBlY3QgYSBiaW5kaW5nIHZhbHVlIHRvIGJlIHBhc3NlZCBpbnRvIGRpcmVjdGl2ZSBjb2RlXG4gKiBleGFjdGx5IGFzIGl0IGlzIHVubGVzcyB0aGVyZSBpcyBhIHN0YXRpYyB2YWx1ZSBwcmVzZW50IChpbiB3aGljaCBjYXNlIGJvdGggdmFsdWVzXG4gKiB3aWxsIGJlIHN0cmluZ2lmaWVkIGFuZCBjb25jYXRlbmF0ZWQpLlxuICovXG5mdW5jdGlvbiBub3JtYWxpemVTdHlsaW5nRGlyZWN0aXZlSW5wdXRWYWx1ZShcbiAgICBpbml0aWFsVmFsdWU6IHN0cmluZywgYmluZGluZ1ZhbHVlOiBzdHJpbmcgfCB7W2tleTogc3RyaW5nXTogYW55fSB8IG51bGwsXG4gICAgaXNDbGFzc0Jhc2VkOiBib29sZWFuKSB7XG4gIGxldCB2YWx1ZSA9IGJpbmRpbmdWYWx1ZTtcblxuICAvLyB3ZSBvbmx5IGNvbmNhdCB2YWx1ZXMgaWYgdGhlcmUgaXMgYW4gaW5pdGlhbCB2YWx1ZSwgb3RoZXJ3aXNlIHdlIHJldHVybiB0aGUgdmFsdWUgYXMgaXMuXG4gIC8vIE5vdGUgdGhhdCB0aGlzIGlzIHRvIHNhdGlzZnkgYmFja3dhcmRzLWNvbXBhdGliaWxpdHkgaW4gQW5ndWxhci5cbiAgaWYgKGluaXRpYWxWYWx1ZS5sZW5ndGgpIHtcbiAgICBpZiAoaXNDbGFzc0Jhc2VkKSB7XG4gICAgICB2YWx1ZSA9IGNvbmNhdFN0cmluZyhpbml0aWFsVmFsdWUsIGZvcmNlQ2xhc3Nlc0FzU3RyaW5nKGJpbmRpbmdWYWx1ZSkpO1xuICAgIH0gZWxzZSB7XG4gICAgICB2YWx1ZSA9IGNvbmNhdFN0cmluZyhcbiAgICAgICAgICBpbml0aWFsVmFsdWUsIGZvcmNlU3R5bGVzQXNTdHJpbmcoYmluZGluZ1ZhbHVlIGFze1trZXk6IHN0cmluZ106IGFueX0gfCBudWxsIHwgdW5kZWZpbmVkKSxcbiAgICAgICAgICAnOycpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gdmFsdWU7XG59XG5cbi8qKlxuICogRmx1c2hlcyBhbGwgc3R5bGluZyBjb2RlIHRvIHRoZSBlbGVtZW50LlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gaXMgZGVzaWduZWQgdG8gYmUgc2NoZWR1bGVkIGZyb20gYW55IG9mIHRoZSBmb3VyIHN0eWxpbmcgaW5zdHJ1Y3Rpb25zXG4gKiBpbiB0aGlzIGZpbGUuIFdoZW4gY2FsbGVkIGl0IHdpbGwgZmx1c2ggYWxsIHN0eWxlIGFuZCBjbGFzcyBiaW5kaW5ncyB0byB0aGUgZWxlbWVudFxuICogdmlhIHRoZSBjb250ZXh0IHJlc29sdXRpb24gYWxnb3JpdGhtLlxuICovXG5mdW5jdGlvbiBzdHlsaW5nQXBwbHkoKTogdm9pZCB7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgZWxlbWVudEluZGV4ID0gZ2V0U2VsZWN0ZWRJbmRleCgpO1xuICBjb25zdCB0Tm9kZSA9IGdldFROb2RlKGVsZW1lbnRJbmRleCwgbFZpZXcpO1xuICBjb25zdCBuYXRpdmUgPSBnZXROYXRpdmVCeVROb2RlKHROb2RlLCBsVmlldykgYXMgUkVsZW1lbnQ7XG4gIGNvbnN0IGRpcmVjdGl2ZUluZGV4ID0gZ2V0QWN0aXZlRGlyZWN0aXZlSWQoKTtcbiAgY29uc3QgcmVuZGVyZXIgPSBnZXRSZW5kZXJlcih0Tm9kZSwgbFZpZXcpO1xuICBjb25zdCBzYW5pdGl6ZXIgPSBnZXRDdXJyZW50U3R5bGVTYW5pdGl6ZXIoKTtcbiAgY29uc3QgY2xhc3Nlc0NvbnRleHQgPSBpc1N0eWxpbmdDb250ZXh0KHROb2RlLmNsYXNzZXMpID8gdE5vZGUuY2xhc3NlcyBhcyBUU3R5bGluZ0NvbnRleHQgOiBudWxsO1xuICBjb25zdCBzdHlsZXNDb250ZXh0ID0gaXNTdHlsaW5nQ29udGV4dCh0Tm9kZS5zdHlsZXMpID8gdE5vZGUuc3R5bGVzIGFzIFRTdHlsaW5nQ29udGV4dCA6IG51bGw7XG4gIGZsdXNoU3R5bGluZyhyZW5kZXJlciwgbFZpZXcsIGNsYXNzZXNDb250ZXh0LCBzdHlsZXNDb250ZXh0LCBuYXRpdmUsIGRpcmVjdGl2ZUluZGV4LCBzYW5pdGl6ZXIpO1xuICBzZXRDdXJyZW50U3R5bGVTYW5pdGl6ZXIobnVsbCk7XG59XG5cbmZ1bmN0aW9uIGdldFJlbmRlcmVyKHROb2RlOiBUTm9kZSwgbFZpZXc6IExWaWV3KSB7XG4gIHJldHVybiB0Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuRWxlbWVudCA/IGxWaWV3W1JFTkRFUkVSXSA6IG51bGw7XG59XG5cbi8qKlxuICogU2VhcmNoZXMgYW5kIGFzc2lnbnMgcHJvdmlkZWQgYWxsIHN0YXRpYyBzdHlsZS9jbGFzcyBlbnRyaWVzIChmb3VuZCBpbiB0aGUgYGF0dHJzYCB2YWx1ZSlcbiAqIGFuZCByZWdpc3RlcnMgdGhlbSBpbiB0aGVpciByZXNwZWN0aXZlIHN0eWxpbmcgY29udGV4dHMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZWdpc3RlckluaXRpYWxTdHlsaW5nT25UTm9kZShcbiAgICB0Tm9kZTogVE5vZGUsIGF0dHJzOiBUQXR0cmlidXRlcywgc3RhcnRJbmRleDogbnVtYmVyKTogYm9vbGVhbiB7XG4gIGxldCBoYXNBZGRpdGlvbmFsSW5pdGlhbFN0eWxpbmcgPSBmYWxzZTtcbiAgbGV0IHN0eWxlcyA9IGdldFN0eWxpbmdNYXBBcnJheSh0Tm9kZS5zdHlsZXMpO1xuICBsZXQgY2xhc3NlcyA9IGdldFN0eWxpbmdNYXBBcnJheSh0Tm9kZS5jbGFzc2VzKTtcbiAgbGV0IG1vZGUgPSAtMTtcbiAgZm9yIChsZXQgaSA9IHN0YXJ0SW5kZXg7IGkgPCBhdHRycy5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IGF0dHIgPSBhdHRyc1tpXSBhcyBzdHJpbmc7XG4gICAgaWYgKHR5cGVvZiBhdHRyID09ICdudW1iZXInKSB7XG4gICAgICBtb2RlID0gYXR0cjtcbiAgICB9IGVsc2UgaWYgKG1vZGUgPT0gQXR0cmlidXRlTWFya2VyLkNsYXNzZXMpIHtcbiAgICAgIGNsYXNzZXMgPSBjbGFzc2VzIHx8IGFsbG9jU3R5bGluZ01hcEFycmF5KCk7XG4gICAgICBhZGRJdGVtVG9TdHlsaW5nTWFwKGNsYXNzZXMsIGF0dHIsIHRydWUpO1xuICAgICAgaGFzQWRkaXRpb25hbEluaXRpYWxTdHlsaW5nID0gdHJ1ZTtcbiAgICB9IGVsc2UgaWYgKG1vZGUgPT0gQXR0cmlidXRlTWFya2VyLlN0eWxlcykge1xuICAgICAgY29uc3QgdmFsdWUgPSBhdHRyc1srK2ldIGFzIHN0cmluZyB8IG51bGw7XG4gICAgICBzdHlsZXMgPSBzdHlsZXMgfHwgYWxsb2NTdHlsaW5nTWFwQXJyYXkoKTtcbiAgICAgIGFkZEl0ZW1Ub1N0eWxpbmdNYXAoc3R5bGVzLCBhdHRyLCB2YWx1ZSk7XG4gICAgICBoYXNBZGRpdGlvbmFsSW5pdGlhbFN0eWxpbmcgPSB0cnVlO1xuICAgIH1cbiAgfVxuXG4gIGlmIChjbGFzc2VzICYmIGNsYXNzZXMubGVuZ3RoID4gU3R5bGluZ01hcEFycmF5SW5kZXguVmFsdWVzU3RhcnRQb3NpdGlvbikge1xuICAgIGlmICghdE5vZGUuY2xhc3Nlcykge1xuICAgICAgdE5vZGUuY2xhc3NlcyA9IGNsYXNzZXM7XG4gICAgfVxuICAgIHVwZGF0ZVJhd1ZhbHVlT25Db250ZXh0KHROb2RlLmNsYXNzZXMsIHN0eWxpbmdNYXBUb1N0cmluZyhjbGFzc2VzLCB0cnVlKSk7XG4gIH1cblxuICBpZiAoc3R5bGVzICYmIHN0eWxlcy5sZW5ndGggPiBTdHlsaW5nTWFwQXJyYXlJbmRleC5WYWx1ZXNTdGFydFBvc2l0aW9uKSB7XG4gICAgaWYgKCF0Tm9kZS5zdHlsZXMpIHtcbiAgICAgIHROb2RlLnN0eWxlcyA9IHN0eWxlcztcbiAgICB9XG4gICAgdXBkYXRlUmF3VmFsdWVPbkNvbnRleHQodE5vZGUuc3R5bGVzLCBzdHlsaW5nTWFwVG9TdHJpbmcoc3R5bGVzLCBmYWxzZSkpO1xuICB9XG5cbiAgcmV0dXJuIGhhc0FkZGl0aW9uYWxJbml0aWFsU3R5bGluZztcbn1cblxuZnVuY3Rpb24gdXBkYXRlUmF3VmFsdWVPbkNvbnRleHQoY29udGV4dDogVFN0eWxpbmdDb250ZXh0IHwgU3R5bGluZ01hcEFycmF5LCB2YWx1ZTogc3RyaW5nKSB7XG4gIGNvbnN0IHN0eWxpbmdNYXBBcnIgPSBnZXRTdHlsaW5nTWFwQXJyYXkoY29udGV4dCkgITtcbiAgc3R5bGluZ01hcEFycltTdHlsaW5nTWFwQXJyYXlJbmRleC5SYXdWYWx1ZVBvc2l0aW9uXSA9IHZhbHVlO1xufVxuXG5mdW5jdGlvbiBnZXRTdHlsZXNDb250ZXh0KHROb2RlOiBUTm9kZSk6IFRTdHlsaW5nQ29udGV4dCB7XG4gIHJldHVybiBnZXRDb250ZXh0KHROb2RlLCBmYWxzZSk7XG59XG5cbmZ1bmN0aW9uIGdldENsYXNzZXNDb250ZXh0KHROb2RlOiBUTm9kZSk6IFRTdHlsaW5nQ29udGV4dCB7XG4gIHJldHVybiBnZXRDb250ZXh0KHROb2RlLCB0cnVlKTtcbn1cblxuLyoqXG4gKiBSZXR1cm5zL2luc3RhbnRpYXRlcyBhIHN0eWxpbmcgY29udGV4dCBmcm9tL3RvIGEgYHROb2RlYCBpbnN0YW5jZS5cbiAqL1xuZnVuY3Rpb24gZ2V0Q29udGV4dCh0Tm9kZTogVE5vZGUsIGlzQ2xhc3NCYXNlZDogYm9vbGVhbik6IFRTdHlsaW5nQ29udGV4dCB7XG4gIGxldCBjb250ZXh0ID0gaXNDbGFzc0Jhc2VkID8gdE5vZGUuY2xhc3NlcyA6IHROb2RlLnN0eWxlcztcbiAgaWYgKCFpc1N0eWxpbmdDb250ZXh0KGNvbnRleHQpKSB7XG4gICAgY29udGV4dCA9IGFsbG9jVFN0eWxpbmdDb250ZXh0KGNvbnRleHQgYXMgU3R5bGluZ01hcEFycmF5IHwgbnVsbCk7XG4gICAgaWYgKG5nRGV2TW9kZSkge1xuICAgICAgYXR0YWNoU3R5bGluZ0RlYnVnT2JqZWN0KGNvbnRleHQgYXMgVFN0eWxpbmdDb250ZXh0LCBpc0NsYXNzQmFzZWQpO1xuICAgIH1cbiAgICBpZiAoaXNDbGFzc0Jhc2VkKSB7XG4gICAgICB0Tm9kZS5jbGFzc2VzID0gY29udGV4dDtcbiAgICB9IGVsc2Uge1xuICAgICAgdE5vZGUuc3R5bGVzID0gY29udGV4dDtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGNvbnRleHQgYXMgVFN0eWxpbmdDb250ZXh0O1xufVxuXG5mdW5jdGlvbiByZXNvbHZlU3R5bGVQcm9wVmFsdWUoXG4gICAgdmFsdWU6IHN0cmluZyB8IG51bWJlciB8IFNhZmVWYWx1ZSB8IG51bGwgfCBOT19DSEFOR0UsXG4gICAgc3VmZml4OiBzdHJpbmcgfCBudWxsIHwgdW5kZWZpbmVkKTogc3RyaW5nfFNhZmVWYWx1ZXxudWxsfHVuZGVmaW5lZHxOT19DSEFOR0Uge1xuICBpZiAodmFsdWUgPT09IE5PX0NIQU5HRSkgcmV0dXJuIHZhbHVlO1xuXG4gIGxldCByZXNvbHZlZFZhbHVlOiBzdHJpbmd8bnVsbCA9IG51bGw7XG4gIGlmICh2YWx1ZSAhPT0gbnVsbCkge1xuICAgIGlmIChzdWZmaXgpIHtcbiAgICAgIC8vIHdoZW4gYSBzdWZmaXggaXMgYXBwbGllZCB0aGVuIGl0IHdpbGwgYnlwYXNzXG4gICAgICAvLyBzYW5pdGl6YXRpb24gZW50aXJlbHkgKGIvYyBhIG5ldyBzdHJpbmcgaXMgY3JlYXRlZClcbiAgICAgIHJlc29sdmVkVmFsdWUgPSByZW5kZXJTdHJpbmdpZnkodmFsdWUpICsgc3VmZml4O1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBzYW5pdGl6YXRpb24gaGFwcGVucyBieSBkZWFsaW5nIHdpdGggYSBzdHJpbmcgdmFsdWVcbiAgICAgIC8vIHRoaXMgbWVhbnMgdGhhdCB0aGUgc3RyaW5nIHZhbHVlIHdpbGwgYmUgcGFzc2VkIHRocm91Z2hcbiAgICAgIC8vIGludG8gdGhlIHN0eWxlIHJlbmRlcmluZyBsYXRlciAod2hpY2ggaXMgd2hlcmUgdGhlIHZhbHVlXG4gICAgICAvLyB3aWxsIGJlIHNhbml0aXplZCBiZWZvcmUgaXQgaXMgYXBwbGllZClcbiAgICAgIHJlc29sdmVkVmFsdWUgPSB2YWx1ZSBhcyBhbnkgYXMgc3RyaW5nO1xuICAgIH1cbiAgfVxuICByZXR1cm4gcmVzb2x2ZWRWYWx1ZTtcbn1cblxuLyoqXG4gKiBXaGV0aGVyIG9yIG5vdCB0aGUgc3R5bGUvY2xhc3MgYmluZGluZyBiZWluZyBhcHBsaWVkIHdhcyBleGVjdXRlZCB3aXRoaW4gYSBob3N0IGJpbmRpbmdzXG4gKiBmdW5jdGlvbi5cbiAqL1xuZnVuY3Rpb24gaXNIb3N0U3R5bGluZygpOiBib29sZWFuIHtcbiAgcmV0dXJuIGlzSG9zdFN0eWxpbmdBY3RpdmUoZ2V0QWN0aXZlRGlyZWN0aXZlSWQoKSk7XG59XG4iXX0=