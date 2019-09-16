import { setInputsForProperty } from '../instructions/shared';
import { BINDING_INDEX, RENDERER } from '../interfaces/view';
import { getActiveDirectiveId, getCurrentStyleSanitizer, getLView, getSelectedIndex, setCurrentStyleSanitizer, setElementExitFn } from '../state';
import { NO_CHANGE } from '../tokens';
import { renderStringify } from '../util/misc_utils';
import { getNativeByTNode, getTNode } from '../util/view_utils';
import { applyStylingMapDirectly, applyStylingValueDirectly, flushStyling, setClass, setStyle, updateClassViaContext, updateStyleViaContext } from './bindings';
import { activateStylingMapFeature } from './map_based_bindings';
import { attachStylingDebugObject } from './styling_debug';
import { addItemToStylingMap, allocStylingMapArray, allocTStylingContext, allowDirectStyling, concatString, forceClassesAsString, forceStylesAsString, getInitialStylingValue, getStylingMapArray, hasClassInput, hasStyleInput, hasValueChanged, isContextLocked, isHostStylingActive, isStylingContext, normalizeIntoStylingMap, setValue, stylingMapToString } from './util';
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
            attachStylingDebugObject(context);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5zdHJ1Y3Rpb25zLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9zdHlsaW5nX25leHQvaW5zdHJ1Y3Rpb25zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQVNBLE9BQU8sRUFBQyxvQkFBb0IsRUFBQyxNQUFNLHdCQUF3QixDQUFDO0FBRzVELE9BQU8sRUFBQyxhQUFhLEVBQVMsUUFBUSxFQUFDLE1BQU0sb0JBQW9CLENBQUM7QUFDbEUsT0FBTyxFQUFDLG9CQUFvQixFQUFFLHdCQUF3QixFQUFFLFFBQVEsRUFBRSxnQkFBZ0IsRUFBRSx3QkFBd0IsRUFBRSxnQkFBZ0IsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUNoSixPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sV0FBVyxDQUFDO0FBQ3BDLE9BQU8sRUFBQyxlQUFlLEVBQUMsTUFBTSxvQkFBb0IsQ0FBQztBQUNuRCxPQUFPLEVBQUMsZ0JBQWdCLEVBQUUsUUFBUSxFQUFDLE1BQU0sb0JBQW9CLENBQUM7QUFFOUQsT0FBTyxFQUFDLHVCQUF1QixFQUFFLHlCQUF5QixFQUFFLFlBQVksRUFBRSxRQUFRLEVBQUUsUUFBUSxFQUFFLHFCQUFxQixFQUFFLHFCQUFxQixFQUFDLE1BQU0sWUFBWSxDQUFDO0FBRTlKLE9BQU8sRUFBQyx5QkFBeUIsRUFBQyxNQUFNLHNCQUFzQixDQUFDO0FBQy9ELE9BQU8sRUFBQyx3QkFBd0IsRUFBQyxNQUFNLGlCQUFpQixDQUFDO0FBQ3pELE9BQU8sRUFBQyxtQkFBbUIsRUFBRSxvQkFBb0IsRUFBRSxvQkFBb0IsRUFBRSxrQkFBa0IsRUFBRSxZQUFZLEVBQUUsb0JBQW9CLEVBQUUsbUJBQW1CLEVBQUUsc0JBQXNCLEVBQUUsa0JBQWtCLEVBQUUsYUFBYSxFQUFFLGFBQWEsRUFBRSxlQUFlLEVBQUUsZUFBZSxFQUFFLG1CQUFtQixFQUFFLGdCQUFnQixFQUFF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QyxnQkFBZ0IsQ0FBQyxPQUFPLENBQUMsRUFBRTtRQUM5QixPQUFPLEdBQUcsb0JBQW9CLENBQUMsT0FBaUMsQ0FBQyxDQUFDO1FBQ2xFLElBQUksU0FBUyxFQUFFO1lBQ2Isd0JBQXdCLENBQUMsT0FBMEIsQ0FBQyxDQUFDO1NBQ3REO1FBQ0QsSUFBSSxZQUFZLEVBQUU7WUFDaEIsS0FBSyxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUM7U0FDekI7YUFBTTtZQUNMLEtBQUssQ0FBQyxNQUFNLEdBQUcsT0FBTyxDQUFDO1NBQ3hCO0tBQ0Y7SUFDRCxPQUFPLE9BQTBCLENBQUM7QUFDcEMsQ0FBQztBQUVELFNBQVMscUJBQXFCLENBQzFCLEtBQXFELEVBQ3JELE1BQWlDO0lBQ25DLElBQUksS0FBSyxLQUFLLFNBQVM7UUFBRSxPQUFPLEtBQUssQ0FBQztJQUV0QyxJQUFJLGFBQWEsR0FBZ0IsSUFBSSxDQUFDO0lBQ3RDLElBQUksS0FBSyxLQUFLLElBQUksRUFBRTtRQUNsQixJQUFJLE1BQU0sRUFBRTtZQUNWLCtDQUErQztZQUMvQyxzREFBc0Q7WUFDdEQsYUFBYSxHQUFHLGVBQWUsQ0FBQyxLQUFLLENBQUMsR0FBRyxNQUFNLENBQUM7U0FDakQ7YUFBTTtZQUNMLHNEQUFzRDtZQUN0RCwwREFBMEQ7WUFDMUQsMkRBQTJEO1lBQzNELDBDQUEwQztZQUMxQyxhQUFhLEdBQUcsS0FBc0IsQ0FBQztTQUN4QztLQUNGO0lBQ0QsT0FBTyxhQUFhLENBQUM7QUFDdkIsQ0FBQztBQUVEOzs7R0FHRztBQUNILFNBQVMsYUFBYTtJQUNwQixPQUFPLG1CQUFtQixDQUFDLG9CQUFvQixFQUFFLENBQUMsQ0FBQztBQUNyRCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4qIEBsaWNlbnNlXG4qIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuKlxuKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4qL1xuaW1wb3J0IHtTYWZlVmFsdWV9IGZyb20gJy4uLy4uL3Nhbml0aXphdGlvbi9ieXBhc3MnO1xuaW1wb3J0IHtTdHlsZVNhbml0aXplRm59IGZyb20gJy4uLy4uL3Nhbml0aXphdGlvbi9zdHlsZV9zYW5pdGl6ZXInO1xuaW1wb3J0IHtzZXRJbnB1dHNGb3JQcm9wZXJ0eX0gZnJvbSAnLi4vaW5zdHJ1Y3Rpb25zL3NoYXJlZCc7XG5pbXBvcnQge0F0dHJpYnV0ZU1hcmtlciwgVEF0dHJpYnV0ZXMsIFROb2RlLCBUTm9kZVR5cGV9IGZyb20gJy4uL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge1JFbGVtZW50fSBmcm9tICcuLi9pbnRlcmZhY2VzL3JlbmRlcmVyJztcbmltcG9ydCB7QklORElOR19JTkRFWCwgTFZpZXcsIFJFTkRFUkVSfSBmcm9tICcuLi9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHtnZXRBY3RpdmVEaXJlY3RpdmVJZCwgZ2V0Q3VycmVudFN0eWxlU2FuaXRpemVyLCBnZXRMVmlldywgZ2V0U2VsZWN0ZWRJbmRleCwgc2V0Q3VycmVudFN0eWxlU2FuaXRpemVyLCBzZXRFbGVtZW50RXhpdEZufSBmcm9tICcuLi9zdGF0ZSc7XG5pbXBvcnQge05PX0NIQU5HRX0gZnJvbSAnLi4vdG9rZW5zJztcbmltcG9ydCB7cmVuZGVyU3RyaW5naWZ5fSBmcm9tICcuLi91dGlsL21pc2NfdXRpbHMnO1xuaW1wb3J0IHtnZXROYXRpdmVCeVROb2RlLCBnZXRUTm9kZX0gZnJvbSAnLi4vdXRpbC92aWV3X3V0aWxzJztcblxuaW1wb3J0IHthcHBseVN0eWxpbmdNYXBEaXJlY3RseSwgYXBwbHlTdHlsaW5nVmFsdWVEaXJlY3RseSwgZmx1c2hTdHlsaW5nLCBzZXRDbGFzcywgc2V0U3R5bGUsIHVwZGF0ZUNsYXNzVmlhQ29udGV4dCwgdXBkYXRlU3R5bGVWaWFDb250ZXh0fSBmcm9tICcuL2JpbmRpbmdzJztcbmltcG9ydCB7U3R5bGluZ01hcEFycmF5LCBTdHlsaW5nTWFwQXJyYXlJbmRleCwgVFN0eWxpbmdDb250ZXh0fSBmcm9tICcuL2ludGVyZmFjZXMnO1xuaW1wb3J0IHthY3RpdmF0ZVN0eWxpbmdNYXBGZWF0dXJlfSBmcm9tICcuL21hcF9iYXNlZF9iaW5kaW5ncyc7XG5pbXBvcnQge2F0dGFjaFN0eWxpbmdEZWJ1Z09iamVjdH0gZnJvbSAnLi9zdHlsaW5nX2RlYnVnJztcbmltcG9ydCB7YWRkSXRlbVRvU3R5bGluZ01hcCwgYWxsb2NTdHlsaW5nTWFwQXJyYXksIGFsbG9jVFN0eWxpbmdDb250ZXh0LCBhbGxvd0RpcmVjdFN0eWxpbmcsIGNvbmNhdFN0cmluZywgZm9yY2VDbGFzc2VzQXNTdHJpbmcsIGZvcmNlU3R5bGVzQXNTdHJpbmcsIGdldEluaXRpYWxTdHlsaW5nVmFsdWUsIGdldFN0eWxpbmdNYXBBcnJheSwgaGFzQ2xhc3NJbnB1dCwgaGFzU3R5bGVJbnB1dCwgaGFzVmFsdWVDaGFuZ2VkLCBpc0NvbnRleHRMb2NrZWQsIGlzSG9zdFN0eWxpbmdBY3RpdmUsIGlzU3R5bGluZ0NvbnRleHQsIG5vcm1hbGl6ZUludG9TdHlsaW5nTWFwLCBzZXRWYWx1ZSwgc3R5bGluZ01hcFRvU3RyaW5nfSBmcm9tICcuL3V0aWwnO1xuXG5cblxuLyoqXG4gKiAtLS0tLS0tLVxuICpcbiAqIFRoaXMgZmlsZSBjb250YWlucyB0aGUgY29yZSBsb2dpYyBmb3IgaG93IHN0eWxpbmcgaW5zdHJ1Y3Rpb25zIGFyZSBwcm9jZXNzZWQgaW4gQW5ndWxhci5cbiAqXG4gKiBUbyBsZWFybiBtb3JlIGFib3V0IHRoZSBhbGdvcml0aG0gc2VlIGBUU3R5bGluZ0NvbnRleHRgLlxuICpcbiAqIC0tLS0tLS0tXG4gKi9cblxuLyoqXG4gKiBTZXRzIHRoZSBjdXJyZW50IHN0eWxlIHNhbml0aXplciBmdW5jdGlvbiB3aGljaCB3aWxsIHRoZW4gYmUgdXNlZFxuICogd2l0aGluIGFsbCBmb2xsb3ctdXAgcHJvcCBhbmQgbWFwLWJhc2VkIHN0eWxlIGJpbmRpbmcgaW5zdHJ1Y3Rpb25zXG4gKiBmb3IgdGhlIGdpdmVuIGVsZW1lbnQuXG4gKlxuICogTm90ZSB0aGF0IG9uY2Ugc3R5bGluZyBoYXMgYmVlbiBhcHBsaWVkIHRvIHRoZSBlbGVtZW50IChpLmUuIG9uY2VcbiAqIGBhZHZhbmNlKG4pYCBpcyBleGVjdXRlZCBvciB0aGUgaG9zdEJpbmRpbmdzL3RlbXBsYXRlIGZ1bmN0aW9uIGV4aXRzKVxuICogdGhlbiB0aGUgYWN0aXZlIGBzYW5pdGl6ZXJGbmAgd2lsbCBiZSBzZXQgdG8gYG51bGxgLiBUaGlzIG1lYW5zIHRoYXRcbiAqIG9uY2Ugc3R5bGluZyBpcyBhcHBsaWVkIHRvIGFub3RoZXIgZWxlbWVudCB0aGVuIGEgYW5vdGhlciBjYWxsIHRvXG4gKiBgc3R5bGVTYW5pdGl6ZXJgIHdpbGwgbmVlZCB0byBiZSBtYWRlLlxuICpcbiAqIEBwYXJhbSBzYW5pdGl6ZXJGbiBUaGUgc2FuaXRpemF0aW9uIGZ1bmN0aW9uIHRoYXQgd2lsbCBiZSB1c2VkIHRvXG4gKiAgICAgICBwcm9jZXNzIHN0eWxlIHByb3AvdmFsdWUgZW50cmllcy5cbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtXN0eWxlU2FuaXRpemVyKHNhbml0aXplcjogU3R5bGVTYW5pdGl6ZUZuIHwgbnVsbCk6IHZvaWQge1xuICBzZXRDdXJyZW50U3R5bGVTYW5pdGl6ZXIoc2FuaXRpemVyKTtcbn1cblxuLyoqXG4gKiBVcGRhdGUgYSBzdHlsZSBiaW5kaW5nIG9uIGFuIGVsZW1lbnQgd2l0aCB0aGUgcHJvdmlkZWQgdmFsdWUuXG4gKlxuICogSWYgdGhlIHN0eWxlIHZhbHVlIGlzIGZhbHN5IHRoZW4gaXQgd2lsbCBiZSByZW1vdmVkIGZyb20gdGhlIGVsZW1lbnRcbiAqIChvciBhc3NpZ25lZCBhIGRpZmZlcmVudCB2YWx1ZSBkZXBlbmRpbmcgaWYgdGhlcmUgYXJlIGFueSBzdHlsZXMgcGxhY2VkXG4gKiBvbiB0aGUgZWxlbWVudCB3aXRoIGBzdHlsZU1hcGAgb3IgYW55IHN0YXRpYyBzdHlsZXMgdGhhdCBhcmVcbiAqIHByZXNlbnQgZnJvbSB3aGVuIHRoZSBlbGVtZW50IHdhcyBjcmVhdGVkIHdpdGggYHN0eWxpbmdgKS5cbiAqXG4gKiBOb3RlIHRoYXQgdGhlIHN0eWxpbmcgZWxlbWVudCBpcyB1cGRhdGVkIGFzIHBhcnQgb2YgYHN0eWxpbmdBcHBseWAuXG4gKlxuICogQHBhcmFtIHByb3AgQSB2YWxpZCBDU1MgcHJvcGVydHkuXG4gKiBAcGFyYW0gdmFsdWUgTmV3IHZhbHVlIHRvIHdyaXRlIChgbnVsbGAgb3IgYW4gZW1wdHkgc3RyaW5nIHRvIHJlbW92ZSkuXG4gKiBAcGFyYW0gc3VmZml4IE9wdGlvbmFsIHN1ZmZpeC4gVXNlZCB3aXRoIHNjYWxhciB2YWx1ZXMgdG8gYWRkIHVuaXQgc3VjaCBhcyBgcHhgLlxuICogICAgICAgIE5vdGUgdGhhdCB3aGVuIGEgc3VmZml4IGlzIHByb3ZpZGVkIHRoZW4gdGhlIHVuZGVybHlpbmcgc2FuaXRpemVyIHdpbGxcbiAqICAgICAgICBiZSBpZ25vcmVkLlxuICpcbiAqIE5vdGUgdGhhdCB0aGlzIHdpbGwgYXBwbHkgdGhlIHByb3ZpZGVkIHN0eWxlIHZhbHVlIHRvIHRoZSBob3N0IGVsZW1lbnQgaWYgdGhpcyBmdW5jdGlvbiBpcyBjYWxsZWRcbiAqIHdpdGhpbiBhIGhvc3QgYmluZGluZyBmdW5jdGlvbi5cbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtXN0eWxlUHJvcChcbiAgICBwcm9wOiBzdHJpbmcsIHZhbHVlOiBzdHJpbmcgfCBudW1iZXIgfCBTYWZlVmFsdWUgfCBudWxsLCBzdWZmaXg/OiBzdHJpbmcgfCBudWxsKTogdm9pZCB7XG4gIHN0eWxlUHJvcEludGVybmFsKGdldFNlbGVjdGVkSW5kZXgoKSwgcHJvcCwgdmFsdWUsIHN1ZmZpeCk7XG59XG5cbi8qKlxuICogSW50ZXJuYWwgZnVuY3Rpb24gZm9yIGFwcGx5aW5nIGEgc2luZ2xlIHN0eWxlIHRvIGFuIGVsZW1lbnQuXG4gKlxuICogVGhlIHJlYXNvbiB3aHkgdGhpcyBmdW5jdGlvbiBoYXMgYmVlbiBzZXBhcmF0ZWQgZnJvbSBgybXJtXN0eWxlUHJvcGAgaXMgYmVjYXVzZVxuICogaXQgaXMgYWxzbyBjYWxsZWQgZnJvbSBgybXJtXN0eWxlUHJvcEludGVycG9sYXRlYC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHN0eWxlUHJvcEludGVybmFsKFxuICAgIGVsZW1lbnRJbmRleDogbnVtYmVyLCBwcm9wOiBzdHJpbmcsIHZhbHVlOiBzdHJpbmcgfCBudW1iZXIgfCBTYWZlVmFsdWUgfCBudWxsLFxuICAgIHN1ZmZpeD86IHN0cmluZyB8IG51bGwgfCB1bmRlZmluZWQpOiB2b2lkIHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuXG4gIC8vIGlmIGEgdmFsdWUgaXMgaW50ZXJwb2xhdGVkIHRoZW4gaXQgbWF5IHJlbmRlciBhIGBOT19DSEFOR0VgIHZhbHVlLlxuICAvLyBpbiB0aGlzIGNhc2Ugd2UgZG8gbm90IG5lZWQgdG8gZG8gYW55dGhpbmcsIGJ1dCB0aGUgYmluZGluZyBpbmRleFxuICAvLyBzdGlsbCBuZWVkcyB0byBiZSBpbmNyZW1lbnRlZCBiZWNhdXNlIGFsbCBzdHlsaW5nIGJpbmRpbmcgdmFsdWVzXG4gIC8vIGFyZSBzdG9yZWQgaW5zaWRlIG9mIHRoZSBsVmlldy5cbiAgY29uc3QgYmluZGluZ0luZGV4ID0gbFZpZXdbQklORElOR19JTkRFWF0rKztcblxuICBjb25zdCB1cGRhdGVkID1cbiAgICAgIHN0eWxpbmdQcm9wKGVsZW1lbnRJbmRleCwgYmluZGluZ0luZGV4LCBwcm9wLCByZXNvbHZlU3R5bGVQcm9wVmFsdWUodmFsdWUsIHN1ZmZpeCksIGZhbHNlKTtcbiAgaWYgKG5nRGV2TW9kZSkge1xuICAgIG5nRGV2TW9kZS5zdHlsZVByb3ArKztcbiAgICBpZiAodXBkYXRlZCkge1xuICAgICAgbmdEZXZNb2RlLnN0eWxlUHJvcENhY2hlTWlzcysrO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIFVwZGF0ZSBhIGNsYXNzIGJpbmRpbmcgb24gYW4gZWxlbWVudCB3aXRoIHRoZSBwcm92aWRlZCB2YWx1ZS5cbiAqXG4gKiBUaGlzIGluc3RydWN0aW9uIGlzIG1lYW50IHRvIGhhbmRsZSB0aGUgYFtjbGFzcy5mb29dPVwiZXhwXCJgIGNhc2UgYW5kLFxuICogdGhlcmVmb3JlLCB0aGUgY2xhc3MgYmluZGluZyBpdHNlbGYgbXVzdCBhbHJlYWR5IGJlIGFsbG9jYXRlZCB1c2luZ1xuICogYHN0eWxpbmdgIHdpdGhpbiB0aGUgY3JlYXRpb24gYmxvY2suXG4gKlxuICogQHBhcmFtIHByb3AgQSB2YWxpZCBDU1MgY2xhc3MgKG9ubHkgb25lKS5cbiAqIEBwYXJhbSB2YWx1ZSBBIHRydWUvZmFsc2UgdmFsdWUgd2hpY2ggd2lsbCB0dXJuIHRoZSBjbGFzcyBvbiBvciBvZmYuXG4gKlxuICogTm90ZSB0aGF0IHRoaXMgd2lsbCBhcHBseSB0aGUgcHJvdmlkZWQgY2xhc3MgdmFsdWUgdG8gdGhlIGhvc3QgZWxlbWVudCBpZiB0aGlzIGZ1bmN0aW9uXG4gKiBpcyBjYWxsZWQgd2l0aGluIGEgaG9zdCBiaW5kaW5nIGZ1bmN0aW9uLlxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1Y2xhc3NQcm9wKGNsYXNzTmFtZTogc3RyaW5nLCB2YWx1ZTogYm9vbGVhbiB8IG51bGwpOiB2b2lkIHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuXG4gIC8vIGlmIGEgdmFsdWUgaXMgaW50ZXJwb2xhdGVkIHRoZW4gaXQgbWF5IHJlbmRlciBhIGBOT19DSEFOR0VgIHZhbHVlLlxuICAvLyBpbiB0aGlzIGNhc2Ugd2UgZG8gbm90IG5lZWQgdG8gZG8gYW55dGhpbmcsIGJ1dCB0aGUgYmluZGluZyBpbmRleFxuICAvLyBzdGlsbCBuZWVkcyB0byBiZSBpbmNyZW1lbnRlZCBiZWNhdXNlIGFsbCBzdHlsaW5nIGJpbmRpbmcgdmFsdWVzXG4gIC8vIGFyZSBzdG9yZWQgaW5zaWRlIG9mIHRoZSBsVmlldy5cbiAgY29uc3QgYmluZGluZ0luZGV4ID0gbFZpZXdbQklORElOR19JTkRFWF0rKztcblxuICBjb25zdCB1cGRhdGVkID0gc3R5bGluZ1Byb3AoZ2V0U2VsZWN0ZWRJbmRleCgpLCBiaW5kaW5nSW5kZXgsIGNsYXNzTmFtZSwgdmFsdWUsIHRydWUpO1xuICBpZiAobmdEZXZNb2RlKSB7XG4gICAgbmdEZXZNb2RlLmNsYXNzUHJvcCsrO1xuICAgIGlmICh1cGRhdGVkKSB7XG4gICAgICBuZ0Rldk1vZGUuY2xhc3NQcm9wQ2FjaGVNaXNzKys7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogU2hhcmVkIGZ1bmN0aW9uIHVzZWQgdG8gdXBkYXRlIGEgcHJvcC1iYXNlZCBzdHlsaW5nIGJpbmRpbmcgZm9yIGFuIGVsZW1lbnQuXG4gKlxuICogRGVwZW5kaW5nIG9uIHRoZSBzdGF0ZSBvZiB0aGUgYHROb2RlLnN0eWxlc2Agc3R5bGVzIGNvbnRleHQsIHRoZSBzdHlsZS9wcm9wXG4gKiB2YWx1ZSBtYXkgYmUgYXBwbGllZCBkaXJlY3RseSB0byB0aGUgZWxlbWVudCBpbnN0ZWFkIG9mIGJlaW5nIHByb2Nlc3NlZFxuICogdGhyb3VnaCB0aGUgY29udGV4dC4gVGhlIHJlYXNvbiB3aHkgdGhpcyBvY2N1cnMgaXMgZm9yIHBlcmZvcm1hbmNlIGFuZCBmdWxseVxuICogZGVwZW5kcyBvbiB0aGUgc3RhdGUgb2YgdGhlIGNvbnRleHQgKGkuZS4gd2hldGhlciBvciBub3QgdGhlcmUgYXJlIGR1cGxpY2F0ZVxuICogYmluZGluZ3Mgb3Igd2hldGhlciBvciBub3QgdGhlcmUgYXJlIG1hcC1iYXNlZCBiaW5kaW5ncyBhbmQgcHJvcGVydHkgYmluZGluZ3NcbiAqIHByZXNlbnQgdG9nZXRoZXIpLlxuICovXG5mdW5jdGlvbiBzdHlsaW5nUHJvcChcbiAgICBlbGVtZW50SW5kZXg6IG51bWJlciwgYmluZGluZ0luZGV4OiBudW1iZXIsIHByb3A6IHN0cmluZyxcbiAgICB2YWx1ZTogYm9vbGVhbiB8IG51bWJlciB8IFNhZmVWYWx1ZSB8IHN0cmluZyB8IG51bGwgfCB1bmRlZmluZWQgfCBOT19DSEFOR0UsXG4gICAgaXNDbGFzc0Jhc2VkOiBib29sZWFuKTogYm9vbGVhbiB7XG4gIGxldCB1cGRhdGVkID0gZmFsc2U7XG5cbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCB0Tm9kZSA9IGdldFROb2RlKGVsZW1lbnRJbmRleCwgbFZpZXcpO1xuICBjb25zdCBuYXRpdmUgPSBnZXROYXRpdmVCeVROb2RlKHROb2RlLCBsVmlldykgYXMgUkVsZW1lbnQ7XG5cbiAgY29uc3QgaG9zdEJpbmRpbmdzTW9kZSA9IGlzSG9zdFN0eWxpbmcoKTtcbiAgY29uc3QgY29udGV4dCA9IGlzQ2xhc3NCYXNlZCA/IGdldENsYXNzZXNDb250ZXh0KHROb2RlKSA6IGdldFN0eWxlc0NvbnRleHQodE5vZGUpO1xuICBjb25zdCBzYW5pdGl6ZXIgPSBpc0NsYXNzQmFzZWQgPyBudWxsIDogZ2V0Q3VycmVudFN0eWxlU2FuaXRpemVyKCk7XG5cbiAgLy8gRGlyZWN0IEFwcGx5IENhc2U6IGJ5cGFzcyBjb250ZXh0IHJlc29sdXRpb24gYW5kIGFwcGx5IHRoZVxuICAvLyBzdHlsZS9jbGFzcyB2YWx1ZSBkaXJlY3RseSB0byB0aGUgZWxlbWVudFxuICBpZiAoYWxsb3dEaXJlY3RTdHlsaW5nKGNvbnRleHQsIGhvc3RCaW5kaW5nc01vZGUpKSB7XG4gICAgY29uc3QgcmVuZGVyZXIgPSBnZXRSZW5kZXJlcih0Tm9kZSwgbFZpZXcpO1xuICAgIHVwZGF0ZWQgPSBhcHBseVN0eWxpbmdWYWx1ZURpcmVjdGx5KFxuICAgICAgICByZW5kZXJlciwgY29udGV4dCwgbmF0aXZlLCBsVmlldywgYmluZGluZ0luZGV4LCBwcm9wLCB2YWx1ZSxcbiAgICAgICAgaXNDbGFzc0Jhc2VkID8gc2V0Q2xhc3MgOiBzZXRTdHlsZSwgc2FuaXRpemVyKTtcbiAgfSBlbHNlIHtcbiAgICAvLyBDb250ZXh0IFJlc29sdXRpb24gKG9yIGZpcnN0IHVwZGF0ZSkgQ2FzZTogc2F2ZSB0aGUgdmFsdWVcbiAgICAvLyBhbmQgZGVmZXIgdG8gdGhlIGNvbnRleHQgdG8gZmx1c2ggYW5kIGFwcGx5IHRoZSBzdHlsZS9jbGFzcyBiaW5kaW5nXG4gICAgLy8gdmFsdWUgdG8gdGhlIGVsZW1lbnQuXG4gICAgY29uc3QgZGlyZWN0aXZlSW5kZXggPSBnZXRBY3RpdmVEaXJlY3RpdmVJZCgpO1xuICAgIGlmIChpc0NsYXNzQmFzZWQpIHtcbiAgICAgIHVwZGF0ZWQgPSB1cGRhdGVDbGFzc1ZpYUNvbnRleHQoXG4gICAgICAgICAgY29udGV4dCwgbFZpZXcsIG5hdGl2ZSwgZGlyZWN0aXZlSW5kZXgsIHByb3AsIGJpbmRpbmdJbmRleCxcbiAgICAgICAgICB2YWx1ZSBhcyBzdHJpbmcgfCBib29sZWFuIHwgbnVsbCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHVwZGF0ZWQgPSB1cGRhdGVTdHlsZVZpYUNvbnRleHQoXG4gICAgICAgICAgY29udGV4dCwgbFZpZXcsIG5hdGl2ZSwgZGlyZWN0aXZlSW5kZXgsIHByb3AsIGJpbmRpbmdJbmRleCxcbiAgICAgICAgICB2YWx1ZSBhcyBzdHJpbmcgfCBTYWZlVmFsdWUgfCBudWxsLCBzYW5pdGl6ZXIpO1xuICAgIH1cblxuICAgIHNldEVsZW1lbnRFeGl0Rm4oc3R5bGluZ0FwcGx5KTtcbiAgfVxuXG4gIHJldHVybiB1cGRhdGVkO1xufVxuXG4vKipcbiAqIFVwZGF0ZSBzdHlsZSBiaW5kaW5ncyB1c2luZyBhbiBvYmplY3QgbGl0ZXJhbCBvbiBhbiBlbGVtZW50LlxuICpcbiAqIFRoaXMgaW5zdHJ1Y3Rpb24gaXMgbWVhbnQgdG8gYXBwbHkgc3R5bGluZyB2aWEgdGhlIGBbc3R5bGVdPVwiZXhwXCJgIHRlbXBsYXRlIGJpbmRpbmdzLlxuICogV2hlbiBzdHlsZXMgYXJlIGFwcGxpZWQgdG8gdGhlIGVsZW1lbnQgdGhleSB3aWxsIHRoZW4gYmUgdXBkYXRlZCB3aXRoIHJlc3BlY3QgdG9cbiAqIGFueSBzdHlsZXMvY2xhc3NlcyBzZXQgdmlhIGBzdHlsZVByb3BgLiBJZiBhbnkgc3R5bGVzIGFyZSBzZXQgdG8gZmFsc3lcbiAqIHRoZW4gdGhleSB3aWxsIGJlIHJlbW92ZWQgZnJvbSB0aGUgZWxlbWVudC5cbiAqXG4gKiBOb3RlIHRoYXQgdGhlIHN0eWxpbmcgaW5zdHJ1Y3Rpb24gd2lsbCBub3QgYmUgYXBwbGllZCB1bnRpbCBgc3R5bGluZ0FwcGx5YCBpcyBjYWxsZWQuXG4gKlxuICogQHBhcmFtIHN0eWxlcyBBIGtleS92YWx1ZSBzdHlsZSBtYXAgb2YgdGhlIHN0eWxlcyB0aGF0IHdpbGwgYmUgYXBwbGllZCB0byB0aGUgZ2l2ZW4gZWxlbWVudC5cbiAqICAgICAgICBBbnkgbWlzc2luZyBzdHlsZXMgKHRoYXQgaGF2ZSBhbHJlYWR5IGJlZW4gYXBwbGllZCB0byB0aGUgZWxlbWVudCBiZWZvcmVoYW5kKSB3aWxsIGJlXG4gKiAgICAgICAgcmVtb3ZlZCAodW5zZXQpIGZyb20gdGhlIGVsZW1lbnQncyBzdHlsaW5nLlxuICpcbiAqIE5vdGUgdGhhdCB0aGlzIHdpbGwgYXBwbHkgdGhlIHByb3ZpZGVkIHN0eWxlTWFwIHZhbHVlIHRvIHRoZSBob3N0IGVsZW1lbnQgaWYgdGhpcyBmdW5jdGlvblxuICogaXMgY2FsbGVkIHdpdGhpbiBhIGhvc3QgYmluZGluZy5cbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtXN0eWxlTWFwKHN0eWxlczoge1tzdHlsZU5hbWU6IHN0cmluZ106IGFueX0gfCBOT19DSEFOR0UgfCBudWxsKTogdm9pZCB7XG4gIGNvbnN0IGluZGV4ID0gZ2V0U2VsZWN0ZWRJbmRleCgpO1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IHROb2RlID0gZ2V0VE5vZGUoaW5kZXgsIGxWaWV3KTtcbiAgY29uc3QgY29udGV4dCA9IGdldFN0eWxlc0NvbnRleHQodE5vZGUpO1xuXG4gIC8vIGlmIGEgdmFsdWUgaXMgaW50ZXJwb2xhdGVkIHRoZW4gaXQgbWF5IHJlbmRlciBhIGBOT19DSEFOR0VgIHZhbHVlLlxuICAvLyBpbiB0aGlzIGNhc2Ugd2UgZG8gbm90IG5lZWQgdG8gZG8gYW55dGhpbmcsIGJ1dCB0aGUgYmluZGluZyBpbmRleFxuICAvLyBzdGlsbCBuZWVkcyB0byBiZSBpbmNyZW1lbnRlZCBiZWNhdXNlIGFsbCBzdHlsaW5nIGJpbmRpbmcgdmFsdWVzXG4gIC8vIGFyZSBzdG9yZWQgaW5zaWRlIG9mIHRoZSBsVmlldy5cbiAgY29uc3QgYmluZGluZ0luZGV4ID0gbFZpZXdbQklORElOR19JTkRFWF0rKztcblxuICAvLyBpbnB1dHMgYXJlIG9ubHkgZXZhbHVhdGVkIGZyb20gYSB0ZW1wbGF0ZSBiaW5kaW5nIGludG8gYSBkaXJlY3RpdmUsIHRoZXJlZm9yZSxcbiAgLy8gdGhlcmUgc2hvdWxkIG5vdCBiZSBhIHNpdHVhdGlvbiB3aGVyZSBhIGRpcmVjdGl2ZSBob3N0IGJpbmRpbmdzIGZ1bmN0aW9uXG4gIC8vIGV2YWx1YXRlcyB0aGUgaW5wdXRzICh0aGlzIHNob3VsZCBvbmx5IGhhcHBlbiBpbiB0aGUgdGVtcGxhdGUgZnVuY3Rpb24pXG4gIGlmICghaXNIb3N0U3R5bGluZygpICYmIGhhc1N0eWxlSW5wdXQodE5vZGUpICYmIHN0eWxlcyAhPT0gTk9fQ0hBTkdFKSB7XG4gICAgdXBkYXRlRGlyZWN0aXZlSW5wdXRWYWx1ZShjb250ZXh0LCBsVmlldywgdE5vZGUsIGJpbmRpbmdJbmRleCwgc3R5bGVzLCBmYWxzZSk7XG4gICAgc3R5bGVzID0gTk9fQ0hBTkdFO1xuICB9XG5cbiAgY29uc3QgdXBkYXRlZCA9IF9zdHlsaW5nTWFwKGluZGV4LCBjb250ZXh0LCBiaW5kaW5nSW5kZXgsIHN0eWxlcywgZmFsc2UpO1xuICBpZiAobmdEZXZNb2RlKSB7XG4gICAgbmdEZXZNb2RlLnN0eWxlTWFwKys7XG4gICAgaWYgKHVwZGF0ZWQpIHtcbiAgICAgIG5nRGV2TW9kZS5zdHlsZU1hcENhY2hlTWlzcysrO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIFVwZGF0ZSBjbGFzcyBiaW5kaW5ncyB1c2luZyBhbiBvYmplY3QgbGl0ZXJhbCBvciBjbGFzcy1zdHJpbmcgb24gYW4gZWxlbWVudC5cbiAqXG4gKiBUaGlzIGluc3RydWN0aW9uIGlzIG1lYW50IHRvIGFwcGx5IHN0eWxpbmcgdmlhIHRoZSBgW2NsYXNzXT1cImV4cFwiYCB0ZW1wbGF0ZSBiaW5kaW5ncy5cbiAqIFdoZW4gY2xhc3NlcyBhcmUgYXBwbGllZCB0byB0aGUgZWxlbWVudCB0aGV5IHdpbGwgdGhlbiBiZSB1cGRhdGVkIHdpdGhcbiAqIHJlc3BlY3QgdG8gYW55IHN0eWxlcy9jbGFzc2VzIHNldCB2aWEgYGNsYXNzUHJvcGAuIElmIGFueVxuICogY2xhc3NlcyBhcmUgc2V0IHRvIGZhbHN5IHRoZW4gdGhleSB3aWxsIGJlIHJlbW92ZWQgZnJvbSB0aGUgZWxlbWVudC5cbiAqXG4gKiBOb3RlIHRoYXQgdGhlIHN0eWxpbmcgaW5zdHJ1Y3Rpb24gd2lsbCBub3QgYmUgYXBwbGllZCB1bnRpbCBgc3R5bGluZ0FwcGx5YCBpcyBjYWxsZWQuXG4gKiBOb3RlIHRoYXQgdGhpcyB3aWxsIHRoZSBwcm92aWRlZCBjbGFzc01hcCB2YWx1ZSB0byB0aGUgaG9zdCBlbGVtZW50IGlmIHRoaXMgZnVuY3Rpb24gaXMgY2FsbGVkXG4gKiB3aXRoaW4gYSBob3N0IGJpbmRpbmcuXG4gKlxuICogQHBhcmFtIGNsYXNzZXMgQSBrZXkvdmFsdWUgbWFwIG9yIHN0cmluZyBvZiBDU1MgY2xhc3NlcyB0aGF0IHdpbGwgYmUgYWRkZWQgdG8gdGhlXG4gKiAgICAgICAgZ2l2ZW4gZWxlbWVudC4gQW55IG1pc3NpbmcgY2xhc3NlcyAodGhhdCBoYXZlIGFscmVhZHkgYmVlbiBhcHBsaWVkIHRvIHRoZSBlbGVtZW50XG4gKiAgICAgICAgYmVmb3JlaGFuZCkgd2lsbCBiZSByZW1vdmVkICh1bnNldCkgZnJvbSB0aGUgZWxlbWVudCdzIGxpc3Qgb2YgQ1NTIGNsYXNzZXMuXG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVjbGFzc01hcChjbGFzc2VzOiB7W2NsYXNzTmFtZTogc3RyaW5nXTogYW55fSB8IE5PX0NIQU5HRSB8IHN0cmluZyB8IG51bGwpOiB2b2lkIHtcbiAgY2xhc3NNYXBJbnRlcm5hbChnZXRTZWxlY3RlZEluZGV4KCksIGNsYXNzZXMpO1xufVxuXG4vKipcbiAqIEludGVybmFsIGZ1bmN0aW9uIGZvciBhcHBseWluZyBhIGNsYXNzIHN0cmluZyBvciBrZXkvdmFsdWUgbWFwIG9mIGNsYXNzZXMgdG8gYW4gZWxlbWVudC5cbiAqXG4gKiBUaGUgcmVhc29uIHdoeSB0aGlzIGZ1bmN0aW9uIGhhcyBiZWVuIHNlcGFyYXRlZCBmcm9tIGDJtcm1Y2xhc3NNYXBgIGlzIGJlY2F1c2VcbiAqIGl0IGlzIGFsc28gY2FsbGVkIGZyb20gYMm1ybVjbGFzc01hcEludGVycG9sYXRlYC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNsYXNzTWFwSW50ZXJuYWwoXG4gICAgZWxlbWVudEluZGV4OiBudW1iZXIsIGNsYXNzZXM6IHtbY2xhc3NOYW1lOiBzdHJpbmddOiBhbnl9IHwgTk9fQ0hBTkdFIHwgc3RyaW5nIHwgbnVsbCk6IHZvaWQge1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IHROb2RlID0gZ2V0VE5vZGUoZWxlbWVudEluZGV4LCBsVmlldyk7XG4gIGNvbnN0IGNvbnRleHQgPSBnZXRDbGFzc2VzQ29udGV4dCh0Tm9kZSk7XG5cbiAgLy8gaWYgYSB2YWx1ZSBpcyBpbnRlcnBvbGF0ZWQgdGhlbiBpdCBtYXkgcmVuZGVyIGEgYE5PX0NIQU5HRWAgdmFsdWUuXG4gIC8vIGluIHRoaXMgY2FzZSB3ZSBkbyBub3QgbmVlZCB0byBkbyBhbnl0aGluZywgYnV0IHRoZSBiaW5kaW5nIGluZGV4XG4gIC8vIHN0aWxsIG5lZWRzIHRvIGJlIGluY3JlbWVudGVkIGJlY2F1c2UgYWxsIHN0eWxpbmcgYmluZGluZyB2YWx1ZXNcbiAgLy8gYXJlIHN0b3JlZCBpbnNpZGUgb2YgdGhlIGxWaWV3LlxuICBjb25zdCBiaW5kaW5nSW5kZXggPSBsVmlld1tCSU5ESU5HX0lOREVYXSsrO1xuXG4gIC8vIGlucHV0cyBhcmUgb25seSBldmFsdWF0ZWQgZnJvbSBhIHRlbXBsYXRlIGJpbmRpbmcgaW50byBhIGRpcmVjdGl2ZSwgdGhlcmVmb3JlLFxuICAvLyB0aGVyZSBzaG91bGQgbm90IGJlIGEgc2l0dWF0aW9uIHdoZXJlIGEgZGlyZWN0aXZlIGhvc3QgYmluZGluZ3MgZnVuY3Rpb25cbiAgLy8gZXZhbHVhdGVzIHRoZSBpbnB1dHMgKHRoaXMgc2hvdWxkIG9ubHkgaGFwcGVuIGluIHRoZSB0ZW1wbGF0ZSBmdW5jdGlvbilcbiAgaWYgKCFpc0hvc3RTdHlsaW5nKCkgJiYgaGFzQ2xhc3NJbnB1dCh0Tm9kZSkgJiYgY2xhc3NlcyAhPT0gTk9fQ0hBTkdFKSB7XG4gICAgdXBkYXRlRGlyZWN0aXZlSW5wdXRWYWx1ZShjb250ZXh0LCBsVmlldywgdE5vZGUsIGJpbmRpbmdJbmRleCwgY2xhc3NlcywgdHJ1ZSk7XG4gICAgY2xhc3NlcyA9IE5PX0NIQU5HRTtcbiAgfVxuXG4gIGNvbnN0IHVwZGF0ZWQgPSBfc3R5bGluZ01hcChlbGVtZW50SW5kZXgsIGNvbnRleHQsIGJpbmRpbmdJbmRleCwgY2xhc3NlcywgdHJ1ZSk7XG4gIGlmIChuZ0Rldk1vZGUpIHtcbiAgICBuZ0Rldk1vZGUuY2xhc3NNYXArKztcbiAgICBpZiAodXBkYXRlZCkge1xuICAgICAgbmdEZXZNb2RlLmNsYXNzTWFwQ2FjaGVNaXNzKys7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogU2hhcmVkIGZ1bmN0aW9uIHVzZWQgdG8gdXBkYXRlIGEgbWFwLWJhc2VkIHN0eWxpbmcgYmluZGluZyBmb3IgYW4gZWxlbWVudC5cbiAqXG4gKiBXaGVuIHRoaXMgZnVuY3Rpb24gaXMgY2FsbGVkIGl0IHdpbGwgYWN0aXZhdGUgc3VwcG9ydCBmb3IgYFtzdHlsZV1gIGFuZFxuICogYFtjbGFzc11gIGJpbmRpbmdzIGluIEFuZ3VsYXIuXG4gKi9cbmZ1bmN0aW9uIF9zdHlsaW5nTWFwKFxuICAgIGVsZW1lbnRJbmRleDogbnVtYmVyLCBjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQsIGJpbmRpbmdJbmRleDogbnVtYmVyLFxuICAgIHZhbHVlOiB7W2tleTogc3RyaW5nXTogYW55fSB8IHN0cmluZyB8IG51bGwsIGlzQ2xhc3NCYXNlZDogYm9vbGVhbik6IGJvb2xlYW4ge1xuICBsZXQgdXBkYXRlZCA9IGZhbHNlO1xuXG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgZGlyZWN0aXZlSW5kZXggPSBnZXRBY3RpdmVEaXJlY3RpdmVJZCgpO1xuICBjb25zdCB0Tm9kZSA9IGdldFROb2RlKGVsZW1lbnRJbmRleCwgbFZpZXcpO1xuICBjb25zdCBuYXRpdmUgPSBnZXROYXRpdmVCeVROb2RlKHROb2RlLCBsVmlldykgYXMgUkVsZW1lbnQ7XG4gIGNvbnN0IG9sZFZhbHVlID0gbFZpZXdbYmluZGluZ0luZGV4XSBhcyBTdHlsaW5nTWFwQXJyYXkgfCBudWxsO1xuICBjb25zdCBob3N0QmluZGluZ3NNb2RlID0gaXNIb3N0U3R5bGluZygpO1xuICBjb25zdCBzYW5pdGl6ZXIgPSBnZXRDdXJyZW50U3R5bGVTYW5pdGl6ZXIoKTtcblxuICBjb25zdCB2YWx1ZUhhc0NoYW5nZWQgPSBoYXNWYWx1ZUNoYW5nZWQob2xkVmFsdWUsIHZhbHVlKTtcbiAgY29uc3Qgc3R5bGluZ01hcEFyciA9XG4gICAgICB2YWx1ZSA9PT0gTk9fQ0hBTkdFID8gTk9fQ0hBTkdFIDogbm9ybWFsaXplSW50b1N0eWxpbmdNYXAob2xkVmFsdWUsIHZhbHVlLCAhaXNDbGFzc0Jhc2VkKTtcblxuICAvLyBEaXJlY3QgQXBwbHkgQ2FzZTogYnlwYXNzIGNvbnRleHQgcmVzb2x1dGlvbiBhbmQgYXBwbHkgdGhlXG4gIC8vIHN0eWxlL2NsYXNzIG1hcCB2YWx1ZXMgZGlyZWN0bHkgdG8gdGhlIGVsZW1lbnRcbiAgaWYgKGFsbG93RGlyZWN0U3R5bGluZyhjb250ZXh0LCBob3N0QmluZGluZ3NNb2RlKSkge1xuICAgIGNvbnN0IHJlbmRlcmVyID0gZ2V0UmVuZGVyZXIodE5vZGUsIGxWaWV3KTtcbiAgICB1cGRhdGVkID0gYXBwbHlTdHlsaW5nTWFwRGlyZWN0bHkoXG4gICAgICAgIHJlbmRlcmVyLCBjb250ZXh0LCBuYXRpdmUsIGxWaWV3LCBiaW5kaW5nSW5kZXgsIHN0eWxpbmdNYXBBcnIgYXMgU3R5bGluZ01hcEFycmF5LFxuICAgICAgICBpc0NsYXNzQmFzZWQgPyBzZXRDbGFzcyA6IHNldFN0eWxlLCBzYW5pdGl6ZXIsIHZhbHVlSGFzQ2hhbmdlZCk7XG4gIH0gZWxzZSB7XG4gICAgdXBkYXRlZCA9IHZhbHVlSGFzQ2hhbmdlZDtcbiAgICBhY3RpdmF0ZVN0eWxpbmdNYXBGZWF0dXJlKCk7XG5cbiAgICAvLyBDb250ZXh0IFJlc29sdXRpb24gKG9yIGZpcnN0IHVwZGF0ZSkgQ2FzZTogc2F2ZSB0aGUgbWFwIHZhbHVlXG4gICAgLy8gYW5kIGRlZmVyIHRvIHRoZSBjb250ZXh0IHRvIGZsdXNoIGFuZCBhcHBseSB0aGUgc3R5bGUvY2xhc3MgYmluZGluZ1xuICAgIC8vIHZhbHVlIHRvIHRoZSBlbGVtZW50LlxuICAgIGlmIChpc0NsYXNzQmFzZWQpIHtcbiAgICAgIHVwZGF0ZUNsYXNzVmlhQ29udGV4dChcbiAgICAgICAgICBjb250ZXh0LCBsVmlldywgbmF0aXZlLCBkaXJlY3RpdmVJbmRleCwgbnVsbCwgYmluZGluZ0luZGV4LCBzdHlsaW5nTWFwQXJyLFxuICAgICAgICAgIHZhbHVlSGFzQ2hhbmdlZCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHVwZGF0ZVN0eWxlVmlhQ29udGV4dChcbiAgICAgICAgICBjb250ZXh0LCBsVmlldywgbmF0aXZlLCBkaXJlY3RpdmVJbmRleCwgbnVsbCwgYmluZGluZ0luZGV4LCBzdHlsaW5nTWFwQXJyLCBzYW5pdGl6ZXIsXG4gICAgICAgICAgdmFsdWVIYXNDaGFuZ2VkKTtcbiAgICB9XG5cbiAgICBzZXRFbGVtZW50RXhpdEZuKHN0eWxpbmdBcHBseSk7XG4gIH1cblxuICByZXR1cm4gdXBkYXRlZDtcbn1cblxuLyoqXG4gKiBXcml0ZXMgYSB2YWx1ZSB0byBhIGRpcmVjdGl2ZSdzIGBzdHlsZWAgb3IgYGNsYXNzYCBpbnB1dCBiaW5kaW5nIChpZiBpdCBoYXMgY2hhbmdlZCkuXG4gKlxuICogSWYgYSBkaXJlY3RpdmUgaGFzIGEgYEBJbnB1dGAgYmluZGluZyB0aGF0IGlzIHNldCBvbiBgc3R5bGVgIG9yIGBjbGFzc2AgdGhlbiB0aGF0IHZhbHVlXG4gKiB3aWxsIHRha2UgcHJpb3JpdHkgb3ZlciB0aGUgdW5kZXJseWluZyBzdHlsZS9jbGFzcyBzdHlsaW5nIGJpbmRpbmdzLiBUaGlzIHZhbHVlIHdpbGxcbiAqIGJlIHVwZGF0ZWQgZm9yIHRoZSBiaW5kaW5nIGVhY2ggdGltZSBkdXJpbmcgY2hhbmdlIGRldGVjdGlvbi5cbiAqXG4gKiBXaGVuIHRoaXMgb2NjdXJzIHRoaXMgZnVuY3Rpb24gd2lsbCBhdHRlbXB0IHRvIHdyaXRlIHRoZSB2YWx1ZSB0byB0aGUgaW5wdXQgYmluZGluZ1xuICogZGVwZW5kaW5nIG9uIHRoZSBmb2xsb3dpbmcgc2l0dWF0aW9uczpcbiAqXG4gKiAtIElmIGBvbGRWYWx1ZSAhPT0gbmV3VmFsdWVgXG4gKiAtIElmIGBuZXdWYWx1ZWAgaXMgYG51bGxgIChidXQgdGhpcyBpcyBza2lwcGVkIGlmIGl0IGlzIGR1cmluZyB0aGUgZmlyc3QgdXBkYXRlIHBhc3MtLVxuICogICAgd2hpY2ggaXMgd2hlbiB0aGUgY29udGV4dCBpcyBub3QgbG9ja2VkIHlldClcbiAqL1xuZnVuY3Rpb24gdXBkYXRlRGlyZWN0aXZlSW5wdXRWYWx1ZShcbiAgICBjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQsIGxWaWV3OiBMVmlldywgdE5vZGU6IFROb2RlLCBiaW5kaW5nSW5kZXg6IG51bWJlciwgbmV3VmFsdWU6IGFueSxcbiAgICBpc0NsYXNzQmFzZWQ6IGJvb2xlYW4pOiB2b2lkIHtcbiAgY29uc3Qgb2xkVmFsdWUgPSBsVmlld1tiaW5kaW5nSW5kZXhdO1xuICBpZiAob2xkVmFsdWUgIT09IG5ld1ZhbHVlKSB7XG4gICAgLy8gZXZlbiBpZiB0aGUgdmFsdWUgaGFzIGNoYW5nZWQgd2UgbWF5IG5vdCB3YW50IHRvIGVtaXQgaXQgdG8gdGhlXG4gICAgLy8gZGlyZWN0aXZlIGlucHV0KHMpIGluIHRoZSBldmVudCB0aGF0IGl0IGlzIGZhbHN5IGR1cmluZyB0aGVcbiAgICAvLyBmaXJzdCB1cGRhdGUgcGFzcy5cbiAgICBpZiAobmV3VmFsdWUgfHwgaXNDb250ZXh0TG9ja2VkKGNvbnRleHQsIGZhbHNlKSkge1xuICAgICAgY29uc3QgaW5wdXROYW1lID0gaXNDbGFzc0Jhc2VkID8gJ2NsYXNzJyA6ICdzdHlsZSc7XG4gICAgICBjb25zdCBpbnB1dHMgPSB0Tm9kZS5pbnB1dHMgIVtpbnB1dE5hbWVdICE7XG4gICAgICBjb25zdCBpbml0aWFsVmFsdWUgPSBnZXRJbml0aWFsU3R5bGluZ1ZhbHVlKGNvbnRleHQpO1xuICAgICAgY29uc3QgdmFsdWUgPSBub3JtYWxpemVTdHlsaW5nRGlyZWN0aXZlSW5wdXRWYWx1ZShpbml0aWFsVmFsdWUsIG5ld1ZhbHVlLCBpc0NsYXNzQmFzZWQpO1xuICAgICAgc2V0SW5wdXRzRm9yUHJvcGVydHkobFZpZXcsIGlucHV0cywgdmFsdWUpO1xuICAgICAgc2V0RWxlbWVudEV4aXRGbihzdHlsaW5nQXBwbHkpO1xuICAgIH1cbiAgICBzZXRWYWx1ZShsVmlldywgYmluZGluZ0luZGV4LCBuZXdWYWx1ZSk7XG4gIH1cbn1cblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBhcHByb3ByaWF0ZSBkaXJlY3RpdmUgaW5wdXQgdmFsdWUgZm9yIGBzdHlsZWAgb3IgYGNsYXNzYC5cbiAqXG4gKiBFYXJsaWVyIHZlcnNpb25zIG9mIEFuZ3VsYXIgZXhwZWN0IGEgYmluZGluZyB2YWx1ZSB0byBiZSBwYXNzZWQgaW50byBkaXJlY3RpdmUgY29kZVxuICogZXhhY3RseSBhcyBpdCBpcyB1bmxlc3MgdGhlcmUgaXMgYSBzdGF0aWMgdmFsdWUgcHJlc2VudCAoaW4gd2hpY2ggY2FzZSBib3RoIHZhbHVlc1xuICogd2lsbCBiZSBzdHJpbmdpZmllZCBhbmQgY29uY2F0ZW5hdGVkKS5cbiAqL1xuZnVuY3Rpb24gbm9ybWFsaXplU3R5bGluZ0RpcmVjdGl2ZUlucHV0VmFsdWUoXG4gICAgaW5pdGlhbFZhbHVlOiBzdHJpbmcsIGJpbmRpbmdWYWx1ZTogc3RyaW5nIHwge1trZXk6IHN0cmluZ106IGFueX0gfCBudWxsLFxuICAgIGlzQ2xhc3NCYXNlZDogYm9vbGVhbikge1xuICBsZXQgdmFsdWUgPSBiaW5kaW5nVmFsdWU7XG5cbiAgLy8gd2Ugb25seSBjb25jYXQgdmFsdWVzIGlmIHRoZXJlIGlzIGFuIGluaXRpYWwgdmFsdWUsIG90aGVyd2lzZSB3ZSByZXR1cm4gdGhlIHZhbHVlIGFzIGlzLlxuICAvLyBOb3RlIHRoYXQgdGhpcyBpcyB0byBzYXRpc2Z5IGJhY2t3YXJkcy1jb21wYXRpYmlsaXR5IGluIEFuZ3VsYXIuXG4gIGlmIChpbml0aWFsVmFsdWUubGVuZ3RoKSB7XG4gICAgaWYgKGlzQ2xhc3NCYXNlZCkge1xuICAgICAgdmFsdWUgPSBjb25jYXRTdHJpbmcoaW5pdGlhbFZhbHVlLCBmb3JjZUNsYXNzZXNBc1N0cmluZyhiaW5kaW5nVmFsdWUpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdmFsdWUgPSBjb25jYXRTdHJpbmcoXG4gICAgICAgICAgaW5pdGlhbFZhbHVlLCBmb3JjZVN0eWxlc0FzU3RyaW5nKGJpbmRpbmdWYWx1ZSBhc3tba2V5OiBzdHJpbmddOiBhbnl9IHwgbnVsbCB8IHVuZGVmaW5lZCksXG4gICAgICAgICAgJzsnKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHZhbHVlO1xufVxuXG4vKipcbiAqIEZsdXNoZXMgYWxsIHN0eWxpbmcgY29kZSB0byB0aGUgZWxlbWVudC5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIGlzIGRlc2lnbmVkIHRvIGJlIHNjaGVkdWxlZCBmcm9tIGFueSBvZiB0aGUgZm91ciBzdHlsaW5nIGluc3RydWN0aW9uc1xuICogaW4gdGhpcyBmaWxlLiBXaGVuIGNhbGxlZCBpdCB3aWxsIGZsdXNoIGFsbCBzdHlsZSBhbmQgY2xhc3MgYmluZGluZ3MgdG8gdGhlIGVsZW1lbnRcbiAqIHZpYSB0aGUgY29udGV4dCByZXNvbHV0aW9uIGFsZ29yaXRobS5cbiAqL1xuZnVuY3Rpb24gc3R5bGluZ0FwcGx5KCk6IHZvaWQge1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IGVsZW1lbnRJbmRleCA9IGdldFNlbGVjdGVkSW5kZXgoKTtcbiAgY29uc3QgdE5vZGUgPSBnZXRUTm9kZShlbGVtZW50SW5kZXgsIGxWaWV3KTtcbiAgY29uc3QgbmF0aXZlID0gZ2V0TmF0aXZlQnlUTm9kZSh0Tm9kZSwgbFZpZXcpIGFzIFJFbGVtZW50O1xuICBjb25zdCBkaXJlY3RpdmVJbmRleCA9IGdldEFjdGl2ZURpcmVjdGl2ZUlkKCk7XG4gIGNvbnN0IHJlbmRlcmVyID0gZ2V0UmVuZGVyZXIodE5vZGUsIGxWaWV3KTtcbiAgY29uc3Qgc2FuaXRpemVyID0gZ2V0Q3VycmVudFN0eWxlU2FuaXRpemVyKCk7XG4gIGNvbnN0IGNsYXNzZXNDb250ZXh0ID0gaXNTdHlsaW5nQ29udGV4dCh0Tm9kZS5jbGFzc2VzKSA/IHROb2RlLmNsYXNzZXMgYXMgVFN0eWxpbmdDb250ZXh0IDogbnVsbDtcbiAgY29uc3Qgc3R5bGVzQ29udGV4dCA9IGlzU3R5bGluZ0NvbnRleHQodE5vZGUuc3R5bGVzKSA/IHROb2RlLnN0eWxlcyBhcyBUU3R5bGluZ0NvbnRleHQgOiBudWxsO1xuICBmbHVzaFN0eWxpbmcocmVuZGVyZXIsIGxWaWV3LCBjbGFzc2VzQ29udGV4dCwgc3R5bGVzQ29udGV4dCwgbmF0aXZlLCBkaXJlY3RpdmVJbmRleCwgc2FuaXRpemVyKTtcbiAgc2V0Q3VycmVudFN0eWxlU2FuaXRpemVyKG51bGwpO1xufVxuXG5mdW5jdGlvbiBnZXRSZW5kZXJlcih0Tm9kZTogVE5vZGUsIGxWaWV3OiBMVmlldykge1xuICByZXR1cm4gdE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkVsZW1lbnQgPyBsVmlld1tSRU5ERVJFUl0gOiBudWxsO1xufVxuXG4vKipcbiAqIFNlYXJjaGVzIGFuZCBhc3NpZ25zIHByb3ZpZGVkIGFsbCBzdGF0aWMgc3R5bGUvY2xhc3MgZW50cmllcyAoZm91bmQgaW4gdGhlIGBhdHRyc2AgdmFsdWUpXG4gKiBhbmQgcmVnaXN0ZXJzIHRoZW0gaW4gdGhlaXIgcmVzcGVjdGl2ZSBzdHlsaW5nIGNvbnRleHRzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVnaXN0ZXJJbml0aWFsU3R5bGluZ09uVE5vZGUoXG4gICAgdE5vZGU6IFROb2RlLCBhdHRyczogVEF0dHJpYnV0ZXMsIHN0YXJ0SW5kZXg6IG51bWJlcik6IGJvb2xlYW4ge1xuICBsZXQgaGFzQWRkaXRpb25hbEluaXRpYWxTdHlsaW5nID0gZmFsc2U7XG4gIGxldCBzdHlsZXMgPSBnZXRTdHlsaW5nTWFwQXJyYXkodE5vZGUuc3R5bGVzKTtcbiAgbGV0IGNsYXNzZXMgPSBnZXRTdHlsaW5nTWFwQXJyYXkodE5vZGUuY2xhc3Nlcyk7XG4gIGxldCBtb2RlID0gLTE7XG4gIGZvciAobGV0IGkgPSBzdGFydEluZGV4OyBpIDwgYXR0cnMubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCBhdHRyID0gYXR0cnNbaV0gYXMgc3RyaW5nO1xuICAgIGlmICh0eXBlb2YgYXR0ciA9PSAnbnVtYmVyJykge1xuICAgICAgbW9kZSA9IGF0dHI7XG4gICAgfSBlbHNlIGlmIChtb2RlID09IEF0dHJpYnV0ZU1hcmtlci5DbGFzc2VzKSB7XG4gICAgICBjbGFzc2VzID0gY2xhc3NlcyB8fCBhbGxvY1N0eWxpbmdNYXBBcnJheSgpO1xuICAgICAgYWRkSXRlbVRvU3R5bGluZ01hcChjbGFzc2VzLCBhdHRyLCB0cnVlKTtcbiAgICAgIGhhc0FkZGl0aW9uYWxJbml0aWFsU3R5bGluZyA9IHRydWU7XG4gICAgfSBlbHNlIGlmIChtb2RlID09IEF0dHJpYnV0ZU1hcmtlci5TdHlsZXMpIHtcbiAgICAgIGNvbnN0IHZhbHVlID0gYXR0cnNbKytpXSBhcyBzdHJpbmcgfCBudWxsO1xuICAgICAgc3R5bGVzID0gc3R5bGVzIHx8IGFsbG9jU3R5bGluZ01hcEFycmF5KCk7XG4gICAgICBhZGRJdGVtVG9TdHlsaW5nTWFwKHN0eWxlcywgYXR0ciwgdmFsdWUpO1xuICAgICAgaGFzQWRkaXRpb25hbEluaXRpYWxTdHlsaW5nID0gdHJ1ZTtcbiAgICB9XG4gIH1cblxuICBpZiAoY2xhc3NlcyAmJiBjbGFzc2VzLmxlbmd0aCA+IFN0eWxpbmdNYXBBcnJheUluZGV4LlZhbHVlc1N0YXJ0UG9zaXRpb24pIHtcbiAgICBpZiAoIXROb2RlLmNsYXNzZXMpIHtcbiAgICAgIHROb2RlLmNsYXNzZXMgPSBjbGFzc2VzO1xuICAgIH1cbiAgICB1cGRhdGVSYXdWYWx1ZU9uQ29udGV4dCh0Tm9kZS5jbGFzc2VzLCBzdHlsaW5nTWFwVG9TdHJpbmcoY2xhc3NlcywgdHJ1ZSkpO1xuICB9XG5cbiAgaWYgKHN0eWxlcyAmJiBzdHlsZXMubGVuZ3RoID4gU3R5bGluZ01hcEFycmF5SW5kZXguVmFsdWVzU3RhcnRQb3NpdGlvbikge1xuICAgIGlmICghdE5vZGUuc3R5bGVzKSB7XG4gICAgICB0Tm9kZS5zdHlsZXMgPSBzdHlsZXM7XG4gICAgfVxuICAgIHVwZGF0ZVJhd1ZhbHVlT25Db250ZXh0KHROb2RlLnN0eWxlcywgc3R5bGluZ01hcFRvU3RyaW5nKHN0eWxlcywgZmFsc2UpKTtcbiAgfVxuXG4gIHJldHVybiBoYXNBZGRpdGlvbmFsSW5pdGlhbFN0eWxpbmc7XG59XG5cbmZ1bmN0aW9uIHVwZGF0ZVJhd1ZhbHVlT25Db250ZXh0KGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCB8IFN0eWxpbmdNYXBBcnJheSwgdmFsdWU6IHN0cmluZykge1xuICBjb25zdCBzdHlsaW5nTWFwQXJyID0gZ2V0U3R5bGluZ01hcEFycmF5KGNvbnRleHQpICE7XG4gIHN0eWxpbmdNYXBBcnJbU3R5bGluZ01hcEFycmF5SW5kZXguUmF3VmFsdWVQb3NpdGlvbl0gPSB2YWx1ZTtcbn1cblxuZnVuY3Rpb24gZ2V0U3R5bGVzQ29udGV4dCh0Tm9kZTogVE5vZGUpOiBUU3R5bGluZ0NvbnRleHQge1xuICByZXR1cm4gZ2V0Q29udGV4dCh0Tm9kZSwgZmFsc2UpO1xufVxuXG5mdW5jdGlvbiBnZXRDbGFzc2VzQ29udGV4dCh0Tm9kZTogVE5vZGUpOiBUU3R5bGluZ0NvbnRleHQge1xuICByZXR1cm4gZ2V0Q29udGV4dCh0Tm9kZSwgdHJ1ZSk7XG59XG5cbi8qKlxuICogUmV0dXJucy9pbnN0YW50aWF0ZXMgYSBzdHlsaW5nIGNvbnRleHQgZnJvbS90byBhIGB0Tm9kZWAgaW5zdGFuY2UuXG4gKi9cbmZ1bmN0aW9uIGdldENvbnRleHQodE5vZGU6IFROb2RlLCBpc0NsYXNzQmFzZWQ6IGJvb2xlYW4pOiBUU3R5bGluZ0NvbnRleHQge1xuICBsZXQgY29udGV4dCA9IGlzQ2xhc3NCYXNlZCA/IHROb2RlLmNsYXNzZXMgOiB0Tm9kZS5zdHlsZXM7XG4gIGlmICghaXNTdHlsaW5nQ29udGV4dChjb250ZXh0KSkge1xuICAgIGNvbnRleHQgPSBhbGxvY1RTdHlsaW5nQ29udGV4dChjb250ZXh0IGFzIFN0eWxpbmdNYXBBcnJheSB8IG51bGwpO1xuICAgIGlmIChuZ0Rldk1vZGUpIHtcbiAgICAgIGF0dGFjaFN0eWxpbmdEZWJ1Z09iamVjdChjb250ZXh0IGFzIFRTdHlsaW5nQ29udGV4dCk7XG4gICAgfVxuICAgIGlmIChpc0NsYXNzQmFzZWQpIHtcbiAgICAgIHROb2RlLmNsYXNzZXMgPSBjb250ZXh0O1xuICAgIH0gZWxzZSB7XG4gICAgICB0Tm9kZS5zdHlsZXMgPSBjb250ZXh0O1xuICAgIH1cbiAgfVxuICByZXR1cm4gY29udGV4dCBhcyBUU3R5bGluZ0NvbnRleHQ7XG59XG5cbmZ1bmN0aW9uIHJlc29sdmVTdHlsZVByb3BWYWx1ZShcbiAgICB2YWx1ZTogc3RyaW5nIHwgbnVtYmVyIHwgU2FmZVZhbHVlIHwgbnVsbCB8IE5PX0NIQU5HRSxcbiAgICBzdWZmaXg6IHN0cmluZyB8IG51bGwgfCB1bmRlZmluZWQpOiBzdHJpbmd8U2FmZVZhbHVlfG51bGx8dW5kZWZpbmVkfE5PX0NIQU5HRSB7XG4gIGlmICh2YWx1ZSA9PT0gTk9fQ0hBTkdFKSByZXR1cm4gdmFsdWU7XG5cbiAgbGV0IHJlc29sdmVkVmFsdWU6IHN0cmluZ3xudWxsID0gbnVsbDtcbiAgaWYgKHZhbHVlICE9PSBudWxsKSB7XG4gICAgaWYgKHN1ZmZpeCkge1xuICAgICAgLy8gd2hlbiBhIHN1ZmZpeCBpcyBhcHBsaWVkIHRoZW4gaXQgd2lsbCBieXBhc3NcbiAgICAgIC8vIHNhbml0aXphdGlvbiBlbnRpcmVseSAoYi9jIGEgbmV3IHN0cmluZyBpcyBjcmVhdGVkKVxuICAgICAgcmVzb2x2ZWRWYWx1ZSA9IHJlbmRlclN0cmluZ2lmeSh2YWx1ZSkgKyBzdWZmaXg7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIHNhbml0aXphdGlvbiBoYXBwZW5zIGJ5IGRlYWxpbmcgd2l0aCBhIHN0cmluZyB2YWx1ZVxuICAgICAgLy8gdGhpcyBtZWFucyB0aGF0IHRoZSBzdHJpbmcgdmFsdWUgd2lsbCBiZSBwYXNzZWQgdGhyb3VnaFxuICAgICAgLy8gaW50byB0aGUgc3R5bGUgcmVuZGVyaW5nIGxhdGVyICh3aGljaCBpcyB3aGVyZSB0aGUgdmFsdWVcbiAgICAgIC8vIHdpbGwgYmUgc2FuaXRpemVkIGJlZm9yZSBpdCBpcyBhcHBsaWVkKVxuICAgICAgcmVzb2x2ZWRWYWx1ZSA9IHZhbHVlIGFzIGFueSBhcyBzdHJpbmc7XG4gICAgfVxuICB9XG4gIHJldHVybiByZXNvbHZlZFZhbHVlO1xufVxuXG4vKipcbiAqIFdoZXRoZXIgb3Igbm90IHRoZSBzdHlsZS9jbGFzcyBiaW5kaW5nIGJlaW5nIGFwcGxpZWQgd2FzIGV4ZWN1dGVkIHdpdGhpbiBhIGhvc3QgYmluZGluZ3NcbiAqIGZ1bmN0aW9uLlxuICovXG5mdW5jdGlvbiBpc0hvc3RTdHlsaW5nKCk6IGJvb2xlYW4ge1xuICByZXR1cm4gaXNIb3N0U3R5bGluZ0FjdGl2ZShnZXRBY3RpdmVEaXJlY3RpdmVJZCgpKTtcbn1cbiJdfQ==