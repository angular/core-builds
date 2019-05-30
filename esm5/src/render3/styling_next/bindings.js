import { RendererStyleFlags3, isProceduralRenderer } from '../interfaces/renderer';
import { allowStylingFlush, getBindingValue, getGuardMask, getProp, getPropValuesStartPosition, getValuesCount, hasValueChanged, isContextLocked, isSanitizationRequired, isStylingValueDefined, lockContext, setGuardMask } from './util';
/**
 * --------
 *
 * This file contains the core logic for styling in Angular.
 *
 * All styling bindings (i.e. `[style]`, `[style.prop]`, `[class]` and `[class.name]`)
 * will have their values be applied through the logic in this file.
 *
 * When a binding is encountered (e.g. `<div [style.width]="w">`) then
 * the binding data will be populated into a `TStylingContext` data-structure.
 * There is only one `TStylingContext` per `TNode` and each element instance
 * will update its style/class binding values in concert with the styling
 * context.
 *
 * To learn more about the algorithm see `TStylingContext`.
 *
 * --------
 */
var DEFAULT_BINDING_VALUE = null;
var DEFAULT_SIZE_VALUE = 1;
// The first bit value reflects a map-based binding value's bit.
// The reason why it's always activated for every entry in the map
// is so that if any map-binding values update then all other prop
// based bindings will pass the guard check automatically without
// any extra code or flags.
export var DEFAULT_GUARD_MASK_VALUE = 1;
var STYLING_INDEX_FOR_MAP_BINDING = 0;
var STYLING_INDEX_START_VALUE = 1;
// the values below are global to all styling code below. Each value
// will either increment or mutate each time a styling instruction is
// executed. Do not modify the values below.
var currentStyleIndex = STYLING_INDEX_START_VALUE;
var currentClassIndex = STYLING_INDEX_START_VALUE;
var stylesBitMask = 0;
var classesBitMask = 0;
var deferredBindingQueue = [];
/**
 * Visits a class-based binding and updates the new value (if changed).
 *
 * This function is called each time a class-based styling instruction
 * is executed. It's important that it's always called (even if the value
 * has not changed) so that the inner counter index value is incremented.
 * This way, each instruction is always guaranteed to get the same counter
 * state each time it's called (which then allows the `TStylingContext`
 * and the bit mask values to be in sync).
 */
export function updateClassBinding(context, data, prop, bindingIndex, value, deferRegistration, forceUpdate) {
    var isMapBased = !prop;
    var index = isMapBased ? STYLING_INDEX_FOR_MAP_BINDING : currentClassIndex++;
    var updated = updateBindingData(context, data, index, prop, bindingIndex, value, deferRegistration, forceUpdate, false);
    if (updated || forceUpdate) {
        classesBitMask |= 1 << index;
    }
}
/**
 * Visits a style-based binding and updates the new value (if changed).
 *
 * This function is called each time a style-based styling instruction
 * is executed. It's important that it's always called (even if the value
 * has not changed) so that the inner counter index value is incremented.
 * This way, each instruction is always guaranteed to get the same counter
 * state each time it's called (which then allows the `TStylingContext`
 * and the bit mask values to be in sync).
 */
export function updateStyleBinding(context, data, prop, bindingIndex, value, sanitizer, deferRegistration, forceUpdate) {
    var isMapBased = !prop;
    var index = isMapBased ? STYLING_INDEX_FOR_MAP_BINDING : currentStyleIndex++;
    var sanitizationRequired = isMapBased ?
        true :
        (sanitizer ? sanitizer(prop, null, 1 /* ValidateProperty */) : false);
    var updated = updateBindingData(context, data, index, prop, bindingIndex, value, deferRegistration, forceUpdate, sanitizationRequired);
    if (updated || forceUpdate) {
        stylesBitMask |= 1 << index;
    }
}
/**
 * Called each time a binding value has changed within the provided `TStylingContext`.
 *
 * This function is designed to be called from `updateStyleBinding` and `updateClassBinding`.
 * If called during the first update pass, the binding will be registered in the context.
 * If the binding does get registered and the `deferRegistration` flag is true then the
 * binding data will be queued up until the context is later flushed in `applyStyling`.
 *
 * This function will also update binding slot in the provided `LStylingData` with the
 * new binding entry (if it has changed).
 *
 * @returns whether or not the binding value was updated in the `LStylingData`.
 */
function updateBindingData(context, data, counterIndex, prop, bindingIndex, value, deferRegistration, forceUpdate, sanitizationRequired) {
    if (!isContextLocked(context)) {
        if (deferRegistration) {
            deferBindingRegistration(context, counterIndex, prop, bindingIndex, sanitizationRequired);
        }
        else {
            deferredBindingQueue.length && flushDeferredBindings();
            // this will only happen during the first update pass of the
            // context. The reason why we can't use `tNode.firstTemplatePass`
            // here is because its not guaranteed to be true when the first
            // update pass is executed (remember that all styling instructions
            // are run in the update phase, and, as a result, are no more
            // styling instructions that are run in the creation phase).
            registerBinding(context, counterIndex, prop, bindingIndex, sanitizationRequired);
        }
    }
    var changed = forceUpdate || hasValueChanged(data[bindingIndex], value);
    if (changed) {
        data[bindingIndex] = value;
    }
    return changed;
}
/**
 * Schedules a binding registration to be run at a later point.
 *
 * The reasoning for this feature is to ensure that styling
 * bindings are registered in the correct order for when
 * directives/components have a super/sub class inheritance
 * chains. Each directive's styling bindings must be
 * registered into the context in reverse order. Therefore all
 * bindings will be buffered in reverse order and then applied
 * after the inheritance chain exits.
 */
function deferBindingRegistration(context, counterIndex, prop, bindingIndex, sanitizationRequired) {
    deferredBindingQueue.unshift(context, counterIndex, prop, bindingIndex, sanitizationRequired);
}
/**
 * Flushes the collection of deferred bindings and causes each entry
 * to be registered into the context.
 */
function flushDeferredBindings() {
    var i = 0;
    while (i < deferredBindingQueue.length) {
        var context = deferredBindingQueue[i++];
        var count = deferredBindingQueue[i++];
        var prop = deferredBindingQueue[i++];
        var bindingIndex = deferredBindingQueue[i++];
        var sanitizationRequired = deferredBindingQueue[i++];
        registerBinding(context, count, prop, bindingIndex, sanitizationRequired);
    }
    deferredBindingQueue.length = 0;
}
/**
 * Registers the provided binding (prop + bindingIndex) into the context.
 *
 * This function is shared between bindings that are assigned immediately
 * (via `updateBindingData`) and at a deferred stage. When called, it will
 * figure out exactly where to place the binding data in the context.
 *
 * It is needed because it will either update or insert a styling property
 * into the context at the correct spot.
 *
 * When called, one of two things will happen:
 *
 * 1) If the property already exists in the context then it will just add
 *    the provided `bindingValue` to the end of the binding sources region
 *    for that particular property.
 *
 *    - If the binding value is a number then it will be added as a new
 *      binding index source next to the other binding sources for the property.
 *
 *    - Otherwise, if the binding value is a string/boolean/null type then it will
 *      replace the default value for the property if the default value is `null`.
 *
 * 2) If the property does not exist then it will be inserted into the context.
 *    The styling context relies on all properties being stored in alphabetical
 *    order, so it knows exactly where to store it.
 *
 *    When inserted, a default `null` value is created for the property which exists
 *    as the default value for the binding. If the bindingValue property is inserted
 *    and it is either a string, number or null value then that will replace the default
 *    value.
 *
 * Note that this function is also used for map-based styling bindings. They are treated
 * much the same as prop-based bindings, but, because they do not have a property value
 * (since it's a map), all map-based entries are stored in an already populated area of
 * the context at the top (which is reserved for map-based entries).
 */
export function registerBinding(context, countId, prop, bindingValue, sanitizationRequired) {
    // prop-based bindings (e.g `<div [style.width]="w" [class.foo]="f">`)
    if (prop) {
        var found = false;
        var i = getPropValuesStartPosition(context);
        while (i < context.length) {
            var valuesCount = getValuesCount(context, i);
            var p = getProp(context, i);
            found = prop <= p;
            if (found) {
                // all style/class bindings are sorted by property name
                if (prop < p) {
                    allocateNewContextEntry(context, i, prop, sanitizationRequired);
                }
                addBindingIntoContext(context, false, i, bindingValue, countId);
                break;
            }
            i += 3 /* BindingsStartOffset */ + valuesCount;
        }
        if (!found) {
            allocateNewContextEntry(context, context.length, prop, sanitizationRequired);
            addBindingIntoContext(context, false, i, bindingValue, countId);
        }
    }
    else {
        // map-based bindings (e.g `<div [style]="s" [class]="{className:true}">`)
        // there is no need to allocate the map-based binding region into the context
        // since it is already there when the context is first created.
        addBindingIntoContext(context, true, 2 /* MapBindingsPosition */, bindingValue, countId);
    }
}
function allocateNewContextEntry(context, index, prop, sanitizationRequired) {
    // 1,2: splice index locations
    // 3: each entry gets a config value (guard mask + flags)
    // 4. each entry gets a size value (which is always one because there is always a default binding
    // value)
    // 5. the property that is getting allocated into the context
    // 6. the default binding value (usually `null`)
    var config = sanitizationRequired ? 1 /* SanitizationRequired */ :
        0 /* Default */;
    context.splice(index, 0, config, DEFAULT_SIZE_VALUE, prop, DEFAULT_BINDING_VALUE);
    setGuardMask(context, index, DEFAULT_GUARD_MASK_VALUE);
}
/**
 * Inserts a new binding value into a styling property tuple in the `TStylingContext`.
 *
 * A bindingValue is inserted into a context during the first update pass
 * of a template or host bindings function. When this occurs, two things
 * happen:
 *
 * - If the bindingValue value is a number then it is treated as a bindingIndex
 *   value (a index in the `LView`) and it will be inserted next to the other
 *   binding index entries.
 *
 * - Otherwise the binding value will update the default value for the property
 *   and this will only happen if the default value is `null`.
 *
 * Note that this function also handles map-based bindings and will insert them
 * at the top of the context.
 */
function addBindingIntoContext(context, isMapBased, index, bindingValue, countId) {
    var valuesCount = getValuesCount(context, index);
    var lastValueIndex = index + 3 /* BindingsStartOffset */ + valuesCount;
    if (!isMapBased) {
        // prop-based values all have default values, but map-based entries do not.
        // we want to access the index for the default value in this case and not just
        // the bindings...
        lastValueIndex--;
    }
    if (typeof bindingValue === 'number') {
        context.splice(lastValueIndex, 0, bindingValue);
        context[index + 1 /* ValuesCountOffset */]++;
        // now that a new binding index has been added to the property
        // the guard mask bit value (at the `countId` position) needs
        // to be included into the existing mask value.
        var guardMask = getGuardMask(context, index) | (1 << countId);
        setGuardMask(context, index, guardMask);
    }
    else if (typeof bindingValue === 'string' && context[lastValueIndex] == null) {
        context[lastValueIndex] = bindingValue;
    }
}
/**
 * Applies all class entries in the provided context to the provided element and resets
 * any counter and/or bitMask values associated with class bindings.
 *
 * @returns whether or not the classes were flushed to the element.
 */
export function applyClasses(renderer, data, context, element, directiveIndex) {
    var classesFlushed = false;
    if (allowStylingFlush(context, directiveIndex)) {
        var isFirstPass = !isContextLocked(context);
        isFirstPass && lockContext(context);
        if (classesBitMask) {
            // there is no way to sanitize a class value therefore `sanitizer=null`
            applyStyling(context, renderer, element, data, classesBitMask, setClass, null);
            classesBitMask = 0;
            classesFlushed = true;
        }
        currentClassIndex = STYLING_INDEX_START_VALUE;
    }
    return classesFlushed;
}
/**
 * Applies all style entries in the provided context to the provided element and resets
 * any counter and/or bitMask values associated with style bindings.
 *
 * @returns whether or not the styles were flushed to the element.
 */
export function applyStyles(renderer, data, context, element, directiveIndex, sanitizer) {
    var stylesFlushed = false;
    if (allowStylingFlush(context, directiveIndex)) {
        var isFirstPass = !isContextLocked(context);
        isFirstPass && lockContext(context);
        if (stylesBitMask) {
            applyStyling(context, renderer, element, data, stylesBitMask, setStyle, sanitizer);
            stylesBitMask = 0;
            stylesFlushed = true;
        }
        currentStyleIndex = STYLING_INDEX_START_VALUE;
        return true;
    }
    return stylesFlushed;
}
/**
 * Runs through the provided styling context and applies each value to
 * the provided element (via the renderer) if one or more values are present.
 *
 * This function will iterate over all entries present in the provided
 * `TStylingContext` array (both prop-based and map-based bindings).-
 *
 * Each entry, within the `TStylingContext` array, is stored alphabetically
 * and this means that each prop/value entry will be applied in order
 * (so long as it is marked dirty in the provided `bitMask` value).
 *
 * If there are any map-based entries present (which are applied to the
 * element via the `[style]` and `[class]` bindings) then those entries
 * will be applied as well. However, the code for that is not apart of
 * this function. Instead, each time a property is visited, then the
 * code below will call an external function called `stylingMapsSyncFn`
 * and, if present, it will keep the application of styling values in
 * map-based bindings up to sync with the application of prop-based
 * bindings.
 *
 * Visit `styling_next/map_based_bindings.ts` to learn more about how the
 * algorithm works for map-based styling bindings.
 *
 * Note that this function is not designed to be called in isolation (use
 * `applyClasses` and `applyStyles` to actually apply styling values).
 */
export function applyStyling(context, renderer, element, bindingData, bitMaskValue, applyStylingFn, sanitizer) {
    deferredBindingQueue.length && flushDeferredBindings();
    var bitMask = normalizeBitMaskValue(bitMaskValue);
    var stylingMapsSyncFn = getStylingMapsSyncFn();
    var mapsGuardMask = getGuardMask(context, 2 /* MapBindingsPosition */);
    var applyAllValues = (bitMask & mapsGuardMask) > 0;
    var mapsMode = applyAllValues ? 1 /* ApplyAllValues */ : 0 /* TraverseValues */;
    var i = getPropValuesStartPosition(context);
    while (i < context.length) {
        var valuesCount = getValuesCount(context, i);
        var guardMask = getGuardMask(context, i);
        if (bitMask & guardMask) {
            var valueApplied = false;
            var prop = getProp(context, i);
            var valuesCountUpToDefault = valuesCount - 1;
            var defaultValue = getBindingValue(context, i, valuesCountUpToDefault);
            // case 1: apply prop-based values
            // try to apply the binding values and see if a non-null
            // value gets set for the styling binding
            for (var j = 0; j < valuesCountUpToDefault; j++) {
                var bindingIndex = getBindingValue(context, i, j);
                var value = bindingData[bindingIndex];
                if (isStylingValueDefined(value)) {
                    var finalValue = sanitizer && isSanitizationRequired(context, i) ?
                        sanitizer(prop, value, 2 /* SanitizeOnly */) :
                        value;
                    applyStylingFn(renderer, element, prop, finalValue, bindingIndex);
                    valueApplied = true;
                    break;
                }
            }
            // case 2: apply map-based values
            // traverse through each map-based styling binding and update all values up to
            // the provided `prop` value. If the property was not applied in the loop above
            // then it will be attempted to be applied in the maps sync code below.
            if (stylingMapsSyncFn) {
                // determine whether or not to apply the target property or to skip it
                var mode = mapsMode | (valueApplied ? 4 /* SkipTargetProp */ :
                    2 /* ApplyTargetProp */);
                var valueAppliedWithinMap = stylingMapsSyncFn(context, renderer, element, bindingData, applyStylingFn, sanitizer, mode, prop, defaultValue);
                valueApplied = valueApplied || valueAppliedWithinMap;
            }
            // case 3: apply the default value
            // if the value has not yet been applied then a truthy value does not exist in the
            // prop-based or map-based bindings code. If and when this happens, just apply the
            // default value (even if the default value is `null`).
            if (!valueApplied) {
                applyStylingFn(renderer, element, prop, defaultValue);
            }
        }
        i += 3 /* BindingsStartOffset */ + valuesCount;
    }
    // the map-based styling entries may have not applied all their
    // values. For this reason, one more call to the sync function
    // needs to be issued at the end.
    if (stylingMapsSyncFn) {
        stylingMapsSyncFn(context, renderer, element, bindingData, applyStylingFn, sanitizer, mapsMode);
    }
}
function normalizeBitMaskValue(value) {
    // if pass => apply all values (-1 implies that all bits are flipped to true)
    if (value === true)
        return -1;
    // if pass => skip all values
    if (value === false)
        return 0;
    // return the bit mask value as is
    return value;
}
var _activeStylingMapApplyFn = null;
export function getStylingMapsSyncFn() {
    return _activeStylingMapApplyFn;
}
export function setStylingMapsSyncFn(fn) {
    _activeStylingMapApplyFn = fn;
}
/**
 * Assigns a style value to a style property for the given element.
 */
var setStyle = function (renderer, native, prop, value) {
    if (value) {
        // opacity, z-index and flexbox all have number values
        // and these need to be converted into strings so that
        // they can be assigned properly.
        value = value.toString();
        ngDevMode && ngDevMode.rendererSetStyle++;
        renderer && isProceduralRenderer(renderer) ?
            renderer.setStyle(native, prop, value, RendererStyleFlags3.DashCase) :
            native.style.setProperty(prop, value);
    }
    else {
        ngDevMode && ngDevMode.rendererRemoveStyle++;
        renderer && isProceduralRenderer(renderer) ?
            renderer.removeStyle(native, prop, RendererStyleFlags3.DashCase) :
            native.style.removeProperty(prop);
    }
};
/**
 * Adds/removes the provided className value to the provided element.
 */
var setClass = function (renderer, native, className, value) {
    if (className !== '') {
        if (value) {
            ngDevMode && ngDevMode.rendererAddClass++;
            renderer && isProceduralRenderer(renderer) ? renderer.addClass(native, className) :
                native.classList.add(className);
        }
        else {
            ngDevMode && ngDevMode.rendererRemoveClass++;
            renderer && isProceduralRenderer(renderer) ? renderer.removeClass(native, className) :
                native.classList.remove(className);
        }
    }
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmluZGluZ3MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL3N0eWxpbmdfbmV4dC9iaW5kaW5ncy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFRQSxPQUFPLEVBQTJDLG1CQUFtQixFQUFFLG9CQUFvQixFQUFDLE1BQU0sd0JBQXdCLENBQUM7QUFHM0gsT0FBTyxFQUFDLGlCQUFpQixFQUFFLGVBQWUsRUFBRSxZQUFZLEVBQUUsT0FBTyxFQUFFLDBCQUEwQixFQUFFLGNBQWMsRUFBRSxlQUFlLEVBQUUsZUFBZSxFQUFFLHNCQUFzQixFQUFFLHFCQUFxQixFQUFFLFdBQVcsRUFBRSxZQUFZLEVBQUMsTUFBTSxRQUFRLENBQUM7QUFHek87Ozs7Ozs7Ozs7Ozs7Ozs7O0dBaUJHO0FBRUgsSUFBTSxxQkFBcUIsR0FBRyxJQUFJLENBQUM7QUFDbkMsSUFBTSxrQkFBa0IsR0FBRyxDQUFDLENBQUM7QUFFN0IsZ0VBQWdFO0FBQ2hFLGtFQUFrRTtBQUNsRSxrRUFBa0U7QUFDbEUsaUVBQWlFO0FBQ2pFLDJCQUEyQjtBQUMzQixNQUFNLENBQUMsSUFBTSx3QkFBd0IsR0FBRyxDQUFHLENBQUM7QUFDNUMsSUFBTSw2QkFBNkIsR0FBRyxDQUFDLENBQUM7QUFDeEMsSUFBTSx5QkFBeUIsR0FBRyxDQUFDLENBQUM7QUFFcEMsb0VBQW9FO0FBQ3BFLHFFQUFxRTtBQUNyRSw0Q0FBNEM7QUFDNUMsSUFBSSxpQkFBaUIsR0FBRyx5QkFBeUIsQ0FBQztBQUNsRCxJQUFJLGlCQUFpQixHQUFHLHlCQUF5QixDQUFDO0FBQ2xELElBQUksYUFBYSxHQUFHLENBQUMsQ0FBQztBQUN0QixJQUFJLGNBQWMsR0FBRyxDQUFDLENBQUM7QUFDdkIsSUFBSSxvQkFBb0IsR0FBMkQsRUFBRSxDQUFDO0FBRXRGOzs7Ozs7Ozs7R0FTRztBQUNILE1BQU0sVUFBVSxrQkFBa0IsQ0FDOUIsT0FBd0IsRUFBRSxJQUFrQixFQUFFLElBQW1CLEVBQUUsWUFBb0IsRUFDdkYsS0FBd0QsRUFBRSxpQkFBMEIsRUFDcEYsV0FBb0I7SUFDdEIsSUFBTSxVQUFVLEdBQUcsQ0FBQyxJQUFJLENBQUM7SUFDekIsSUFBTSxLQUFLLEdBQUcsVUFBVSxDQUFDLENBQUMsQ0FBQyw2QkFBNkIsQ0FBQyxDQUFDLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztJQUMvRSxJQUFNLE9BQU8sR0FBRyxpQkFBaUIsQ0FDN0IsT0FBTyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLFlBQVksRUFBRSxLQUFLLEVBQUUsaUJBQWlCLEVBQUUsV0FBVyxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQzVGLElBQUksT0FBTyxJQUFJLFdBQVcsRUFBRTtRQUMxQixjQUFjLElBQUksQ0FBQyxJQUFJLEtBQUssQ0FBQztLQUM5QjtBQUNILENBQUM7QUFFRDs7Ozs7Ozs7O0dBU0c7QUFDSCxNQUFNLFVBQVUsa0JBQWtCLENBQzlCLE9BQXdCLEVBQUUsSUFBa0IsRUFBRSxJQUFtQixFQUFFLFlBQW9CLEVBQ3ZGLEtBQWdFLEVBQ2hFLFNBQWlDLEVBQUUsaUJBQTBCLEVBQUUsV0FBb0I7SUFDckYsSUFBTSxVQUFVLEdBQUcsQ0FBQyxJQUFJLENBQUM7SUFDekIsSUFBTSxLQUFLLEdBQUcsVUFBVSxDQUFDLENBQUMsQ0FBQyw2QkFBNkIsQ0FBQyxDQUFDLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztJQUMvRSxJQUFNLG9CQUFvQixHQUFHLFVBQVUsQ0FBQyxDQUFDO1FBQ3JDLElBQUksQ0FBQyxDQUFDO1FBQ04sQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxJQUFNLEVBQUUsSUFBSSwyQkFBcUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDdEYsSUFBTSxPQUFPLEdBQUcsaUJBQWlCLENBQzdCLE9BQU8sRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxZQUFZLEVBQUUsS0FBSyxFQUFFLGlCQUFpQixFQUFFLFdBQVcsRUFDL0Usb0JBQW9CLENBQUMsQ0FBQztJQUMxQixJQUFJLE9BQU8sSUFBSSxXQUFXLEVBQUU7UUFDMUIsYUFBYSxJQUFJLENBQUMsSUFBSSxLQUFLLENBQUM7S0FDN0I7QUFDSCxDQUFDO0FBRUQ7Ozs7Ozs7Ozs7OztHQVlHO0FBQ0gsU0FBUyxpQkFBaUIsQ0FDdEIsT0FBd0IsRUFBRSxJQUFrQixFQUFFLFlBQW9CLEVBQUUsSUFBbUIsRUFDdkYsWUFBb0IsRUFDcEIsS0FBMEUsRUFDMUUsaUJBQTBCLEVBQUUsV0FBb0IsRUFBRSxvQkFBNkI7SUFDakYsSUFBSSxDQUFDLGVBQWUsQ0FBQyxPQUFPLENBQUMsRUFBRTtRQUM3QixJQUFJLGlCQUFpQixFQUFFO1lBQ3JCLHdCQUF3QixDQUFDLE9BQU8sRUFBRSxZQUFZLEVBQUUsSUFBSSxFQUFFLFlBQVksRUFBRSxvQkFBb0IsQ0FBQyxDQUFDO1NBQzNGO2FBQU07WUFDTCxvQkFBb0IsQ0FBQyxNQUFNLElBQUkscUJBQXFCLEVBQUUsQ0FBQztZQUV2RCw0REFBNEQ7WUFDNUQsaUVBQWlFO1lBQ2pFLCtEQUErRDtZQUMvRCxrRUFBa0U7WUFDbEUsNkRBQTZEO1lBQzdELDREQUE0RDtZQUM1RCxlQUFlLENBQUMsT0FBTyxFQUFFLFlBQVksRUFBRSxJQUFJLEVBQUUsWUFBWSxFQUFFLG9CQUFvQixDQUFDLENBQUM7U0FDbEY7S0FDRjtJQUVELElBQU0sT0FBTyxHQUFHLFdBQVcsSUFBSSxlQUFlLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQzFFLElBQUksT0FBTyxFQUFFO1FBQ1gsSUFBSSxDQUFDLFlBQVksQ0FBQyxHQUFHLEtBQUssQ0FBQztLQUM1QjtJQUNELE9BQU8sT0FBTyxDQUFDO0FBQ2pCLENBQUM7QUFFRDs7Ozs7Ozs7OztHQVVHO0FBQ0gsU0FBUyx3QkFBd0IsQ0FDN0IsT0FBd0IsRUFBRSxZQUFvQixFQUFFLElBQW1CLEVBQUUsWUFBb0IsRUFDekYsb0JBQTZCO0lBQy9CLG9CQUFvQixDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsWUFBWSxFQUFFLElBQUksRUFBRSxZQUFZLEVBQUUsb0JBQW9CLENBQUMsQ0FBQztBQUNoRyxDQUFDO0FBRUQ7OztHQUdHO0FBQ0gsU0FBUyxxQkFBcUI7SUFDNUIsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ1YsT0FBTyxDQUFDLEdBQUcsb0JBQW9CLENBQUMsTUFBTSxFQUFFO1FBQ3RDLElBQU0sT0FBTyxHQUFHLG9CQUFvQixDQUFDLENBQUMsRUFBRSxDQUFvQixDQUFDO1FBQzdELElBQU0sS0FBSyxHQUFHLG9CQUFvQixDQUFDLENBQUMsRUFBRSxDQUFXLENBQUM7UUFDbEQsSUFBTSxJQUFJLEdBQUcsb0JBQW9CLENBQUMsQ0FBQyxFQUFFLENBQVcsQ0FBQztRQUNqRCxJQUFNLFlBQVksR0FBRyxvQkFBb0IsQ0FBQyxDQUFDLEVBQUUsQ0FBa0IsQ0FBQztRQUNoRSxJQUFNLG9CQUFvQixHQUFHLG9CQUFvQixDQUFDLENBQUMsRUFBRSxDQUFZLENBQUM7UUFDbEUsZUFBZSxDQUFDLE9BQU8sRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLFlBQVksRUFBRSxvQkFBb0IsQ0FBQyxDQUFDO0tBQzNFO0lBQ0Qsb0JBQW9CLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQztBQUNsQyxDQUFDO0FBRUQ7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBbUNHO0FBQ0gsTUFBTSxVQUFVLGVBQWUsQ0FDM0IsT0FBd0IsRUFBRSxPQUFlLEVBQUUsSUFBbUIsRUFDOUQsWUFBOEMsRUFBRSxvQkFBOEI7SUFDaEYsc0VBQXNFO0lBQ3RFLElBQUksSUFBSSxFQUFFO1FBQ1IsSUFBSSxLQUFLLEdBQUcsS0FBSyxDQUFDO1FBQ2xCLElBQUksQ0FBQyxHQUFHLDBCQUEwQixDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQzVDLE9BQU8sQ0FBQyxHQUFHLE9BQU8sQ0FBQyxNQUFNLEVBQUU7WUFDekIsSUFBTSxXQUFXLEdBQUcsY0FBYyxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUMsQ0FBQztZQUMvQyxJQUFNLENBQUMsR0FBRyxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzlCLEtBQUssR0FBRyxJQUFJLElBQUksQ0FBQyxDQUFDO1lBQ2xCLElBQUksS0FBSyxFQUFFO2dCQUNULHVEQUF1RDtnQkFDdkQsSUFBSSxJQUFJLEdBQUcsQ0FBQyxFQUFFO29CQUNaLHVCQUF1QixDQUFDLE9BQU8sRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLG9CQUFvQixDQUFDLENBQUM7aUJBQ2pFO2dCQUNELHFCQUFxQixDQUFDLE9BQU8sRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLFlBQVksRUFBRSxPQUFPLENBQUMsQ0FBQztnQkFDaEUsTUFBTTthQUNQO1lBQ0QsQ0FBQyxJQUFJLDhCQUEyQyxXQUFXLENBQUM7U0FDN0Q7UUFFRCxJQUFJLENBQUMsS0FBSyxFQUFFO1lBQ1YsdUJBQXVCLENBQUMsT0FBTyxFQUFFLE9BQU8sQ0FBQyxNQUFNLEVBQUUsSUFBSSxFQUFFLG9CQUFvQixDQUFDLENBQUM7WUFDN0UscUJBQXFCLENBQUMsT0FBTyxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsWUFBWSxFQUFFLE9BQU8sQ0FBQyxDQUFDO1NBQ2pFO0tBQ0Y7U0FBTTtRQUNMLDBFQUEwRTtRQUMxRSw2RUFBNkU7UUFDN0UsK0RBQStEO1FBQy9ELHFCQUFxQixDQUNqQixPQUFPLEVBQUUsSUFBSSwrQkFBNEMsWUFBWSxFQUFFLE9BQU8sQ0FBQyxDQUFDO0tBQ3JGO0FBQ0gsQ0FBQztBQUVELFNBQVMsdUJBQXVCLENBQzVCLE9BQXdCLEVBQUUsS0FBYSxFQUFFLElBQVksRUFBRSxvQkFBOEI7SUFDdkYsOEJBQThCO0lBQzlCLHlEQUF5RDtJQUN6RCxpR0FBaUc7SUFDakcsU0FBUztJQUNULDZEQUE2RDtJQUM3RCxnREFBZ0Q7SUFDaEQsSUFBTSxNQUFNLEdBQUcsb0JBQW9CLENBQUMsQ0FBQyw4QkFBcUQsQ0FBQzt1QkFDZixDQUFDO0lBQzdFLE9BQU8sQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFLENBQUMsRUFBRSxNQUFNLEVBQUUsa0JBQWtCLEVBQUUsSUFBSSxFQUFFLHFCQUFxQixDQUFDLENBQUM7SUFDbEYsWUFBWSxDQUFDLE9BQU8sRUFBRSxLQUFLLEVBQUUsd0JBQXdCLENBQUMsQ0FBQztBQUN6RCxDQUFDO0FBRUQ7Ozs7Ozs7Ozs7Ozs7Ozs7R0FnQkc7QUFDSCxTQUFTLHFCQUFxQixDQUMxQixPQUF3QixFQUFFLFVBQW1CLEVBQUUsS0FBYSxFQUM1RCxZQUE4QyxFQUFFLE9BQWU7SUFDakUsSUFBTSxXQUFXLEdBQUcsY0FBYyxDQUFDLE9BQU8sRUFBRSxLQUFLLENBQUMsQ0FBQztJQUVuRCxJQUFJLGNBQWMsR0FBRyxLQUFLLDhCQUEyQyxHQUFHLFdBQVcsQ0FBQztJQUNwRixJQUFJLENBQUMsVUFBVSxFQUFFO1FBQ2YsMkVBQTJFO1FBQzNFLDhFQUE4RTtRQUM5RSxrQkFBa0I7UUFDbEIsY0FBYyxFQUFFLENBQUM7S0FDbEI7SUFFRCxJQUFJLE9BQU8sWUFBWSxLQUFLLFFBQVEsRUFBRTtRQUNwQyxPQUFPLENBQUMsTUFBTSxDQUFDLGNBQWMsRUFBRSxDQUFDLEVBQUUsWUFBWSxDQUFDLENBQUM7UUFDL0MsT0FBTyxDQUFDLEtBQUssNEJBQXlDLENBQVksRUFBRSxDQUFDO1FBRXRFLDhEQUE4RDtRQUM5RCw2REFBNkQ7UUFDN0QsK0NBQStDO1FBQy9DLElBQU0sU0FBUyxHQUFHLFlBQVksQ0FBQyxPQUFPLEVBQUUsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksT0FBTyxDQUFDLENBQUM7UUFDaEUsWUFBWSxDQUFDLE9BQU8sRUFBRSxLQUFLLEVBQUUsU0FBUyxDQUFDLENBQUM7S0FDekM7U0FBTSxJQUFJLE9BQU8sWUFBWSxLQUFLLFFBQVEsSUFBSSxPQUFPLENBQUMsY0FBYyxDQUFDLElBQUksSUFBSSxFQUFFO1FBQzlFLE9BQU8sQ0FBQyxjQUFjLENBQUMsR0FBRyxZQUFZLENBQUM7S0FDeEM7QUFDSCxDQUFDO0FBRUQ7Ozs7O0dBS0c7QUFDSCxNQUFNLFVBQVUsWUFBWSxDQUN4QixRQUFnRCxFQUFFLElBQWtCLEVBQUUsT0FBd0IsRUFDOUYsT0FBaUIsRUFBRSxjQUFzQjtJQUMzQyxJQUFJLGNBQWMsR0FBRyxLQUFLLENBQUM7SUFDM0IsSUFBSSxpQkFBaUIsQ0FBQyxPQUFPLEVBQUUsY0FBYyxDQUFDLEVBQUU7UUFDOUMsSUFBTSxXQUFXLEdBQUcsQ0FBQyxlQUFlLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDOUMsV0FBVyxJQUFJLFdBQVcsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUNwQyxJQUFJLGNBQWMsRUFBRTtZQUNsQix1RUFBdUU7WUFDdkUsWUFBWSxDQUFDLE9BQU8sRUFBRSxRQUFRLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxjQUFjLEVBQUUsUUFBUSxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQy9FLGNBQWMsR0FBRyxDQUFDLENBQUM7WUFDbkIsY0FBYyxHQUFHLElBQUksQ0FBQztTQUN2QjtRQUNELGlCQUFpQixHQUFHLHlCQUF5QixDQUFDO0tBQy9DO0lBQ0QsT0FBTyxjQUFjLENBQUM7QUFDeEIsQ0FBQztBQUVEOzs7OztHQUtHO0FBQ0gsTUFBTSxVQUFVLFdBQVcsQ0FDdkIsUUFBZ0QsRUFBRSxJQUFrQixFQUFFLE9BQXdCLEVBQzlGLE9BQWlCLEVBQUUsY0FBc0IsRUFBRSxTQUFpQztJQUM5RSxJQUFJLGFBQWEsR0FBRyxLQUFLLENBQUM7SUFDMUIsSUFBSSxpQkFBaUIsQ0FBQyxPQUFPLEVBQUUsY0FBYyxDQUFDLEVBQUU7UUFDOUMsSUFBTSxXQUFXLEdBQUcsQ0FBQyxlQUFlLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDOUMsV0FBVyxJQUFJLFdBQVcsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUNwQyxJQUFJLGFBQWEsRUFBRTtZQUNqQixZQUFZLENBQUMsT0FBTyxFQUFFLFFBQVEsRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLGFBQWEsRUFBRSxRQUFRLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDbkYsYUFBYSxHQUFHLENBQUMsQ0FBQztZQUNsQixhQUFhLEdBQUcsSUFBSSxDQUFDO1NBQ3RCO1FBQ0QsaUJBQWlCLEdBQUcseUJBQXlCLENBQUM7UUFDOUMsT0FBTyxJQUFJLENBQUM7S0FDYjtJQUNELE9BQU8sYUFBYSxDQUFDO0FBQ3ZCLENBQUM7QUFFRDs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztHQXlCRztBQUNILE1BQU0sVUFBVSxZQUFZLENBQ3hCLE9BQXdCLEVBQUUsUUFBZ0QsRUFBRSxPQUFpQixFQUM3RixXQUF5QixFQUFFLFlBQThCLEVBQUUsY0FBOEIsRUFDekYsU0FBaUM7SUFDbkMsb0JBQW9CLENBQUMsTUFBTSxJQUFJLHFCQUFxQixFQUFFLENBQUM7SUFFdkQsSUFBTSxPQUFPLEdBQUcscUJBQXFCLENBQUMsWUFBWSxDQUFDLENBQUM7SUFDcEQsSUFBTSxpQkFBaUIsR0FBRyxvQkFBb0IsRUFBRSxDQUFDO0lBQ2pELElBQU0sYUFBYSxHQUFHLFlBQVksQ0FBQyxPQUFPLDhCQUEyQyxDQUFDO0lBQ3RGLElBQU0sY0FBYyxHQUFHLENBQUMsT0FBTyxHQUFHLGFBQWEsQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUNyRCxJQUFNLFFBQVEsR0FDVixjQUFjLENBQUMsQ0FBQyx3QkFBb0MsQ0FBQyx1QkFBbUMsQ0FBQztJQUU3RixJQUFJLENBQUMsR0FBRywwQkFBMEIsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUM1QyxPQUFPLENBQUMsR0FBRyxPQUFPLENBQUMsTUFBTSxFQUFFO1FBQ3pCLElBQU0sV0FBVyxHQUFHLGNBQWMsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDL0MsSUFBTSxTQUFTLEdBQUcsWUFBWSxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUMsQ0FBQztRQUMzQyxJQUFJLE9BQU8sR0FBRyxTQUFTLEVBQUU7WUFDdkIsSUFBSSxZQUFZLEdBQUcsS0FBSyxDQUFDO1lBQ3pCLElBQU0sSUFBSSxHQUFHLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDakMsSUFBTSxzQkFBc0IsR0FBRyxXQUFXLEdBQUcsQ0FBQyxDQUFDO1lBQy9DLElBQU0sWUFBWSxHQUFHLGVBQWUsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxFQUFFLHNCQUFzQixDQUFrQixDQUFDO1lBRTFGLGtDQUFrQztZQUNsQyx3REFBd0Q7WUFDeEQseUNBQXlDO1lBQ3pDLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxzQkFBc0IsRUFBRSxDQUFDLEVBQUUsRUFBRTtnQkFDL0MsSUFBTSxZQUFZLEdBQUcsZUFBZSxDQUFDLE9BQU8sRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFXLENBQUM7Z0JBQzlELElBQU0sS0FBSyxHQUFHLFdBQVcsQ0FBQyxZQUFZLENBQUMsQ0FBQztnQkFDeEMsSUFBSSxxQkFBcUIsQ0FBQyxLQUFLLENBQUMsRUFBRTtvQkFDaEMsSUFBTSxVQUFVLEdBQUcsU0FBUyxJQUFJLHNCQUFzQixDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO3dCQUNoRSxTQUFTLENBQUMsSUFBSSxFQUFFLEtBQUssdUJBQWlDLENBQUMsQ0FBQzt3QkFDeEQsS0FBSyxDQUFDO29CQUNWLGNBQWMsQ0FBQyxRQUFRLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxVQUFVLEVBQUUsWUFBWSxDQUFDLENBQUM7b0JBQ2xFLFlBQVksR0FBRyxJQUFJLENBQUM7b0JBQ3BCLE1BQU07aUJBQ1A7YUFDRjtZQUVELGlDQUFpQztZQUNqQyw4RUFBOEU7WUFDOUUsK0VBQStFO1lBQy9FLHVFQUF1RTtZQUN2RSxJQUFJLGlCQUFpQixFQUFFO2dCQUNyQixzRUFBc0U7Z0JBQ3RFLElBQU0sSUFBSSxHQUFHLFFBQVEsR0FBRyxDQUFDLFlBQVksQ0FBQyxDQUFDLHdCQUFvQyxDQUFDOzJDQUNELENBQUMsQ0FBQztnQkFDN0UsSUFBTSxxQkFBcUIsR0FBRyxpQkFBaUIsQ0FDM0MsT0FBTyxFQUFFLFFBQVEsRUFBRSxPQUFPLEVBQUUsV0FBVyxFQUFFLGNBQWMsRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFFLElBQUksRUFDOUUsWUFBWSxDQUFDLENBQUM7Z0JBQ2xCLFlBQVksR0FBRyxZQUFZLElBQUkscUJBQXFCLENBQUM7YUFDdEQ7WUFFRCxrQ0FBa0M7WUFDbEMsa0ZBQWtGO1lBQ2xGLGtGQUFrRjtZQUNsRix1REFBdUQ7WUFDdkQsSUFBSSxDQUFDLFlBQVksRUFBRTtnQkFDakIsY0FBYyxDQUFDLFFBQVEsRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLFlBQVksQ0FBQyxDQUFDO2FBQ3ZEO1NBQ0Y7UUFFRCxDQUFDLElBQUksOEJBQTJDLFdBQVcsQ0FBQztLQUM3RDtJQUVELCtEQUErRDtJQUMvRCw4REFBOEQ7SUFDOUQsaUNBQWlDO0lBQ2pDLElBQUksaUJBQWlCLEVBQUU7UUFDckIsaUJBQWlCLENBQUMsT0FBTyxFQUFFLFFBQVEsRUFBRSxPQUFPLEVBQUUsV0FBVyxFQUFFLGNBQWMsRUFBRSxTQUFTLEVBQUUsUUFBUSxDQUFDLENBQUM7S0FDakc7QUFDSCxDQUFDO0FBRUQsU0FBUyxxQkFBcUIsQ0FBQyxLQUF1QjtJQUNwRCw2RUFBNkU7SUFDN0UsSUFBSSxLQUFLLEtBQUssSUFBSTtRQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUM7SUFFOUIsNkJBQTZCO0lBQzdCLElBQUksS0FBSyxLQUFLLEtBQUs7UUFBRSxPQUFPLENBQUMsQ0FBQztJQUU5QixrQ0FBa0M7SUFDbEMsT0FBTyxLQUFLLENBQUM7QUFDZixDQUFDO0FBRUQsSUFBSSx3QkFBd0IsR0FBMkIsSUFBSSxDQUFDO0FBQzVELE1BQU0sVUFBVSxvQkFBb0I7SUFDbEMsT0FBTyx3QkFBd0IsQ0FBQztBQUNsQyxDQUFDO0FBRUQsTUFBTSxVQUFVLG9CQUFvQixDQUFDLEVBQXFCO0lBQ3hELHdCQUF3QixHQUFHLEVBQUUsQ0FBQztBQUNoQyxDQUFDO0FBRUQ7O0dBRUc7QUFDSCxJQUFNLFFBQVEsR0FDVixVQUFDLFFBQTBCLEVBQUUsTUFBVyxFQUFFLElBQVksRUFBRSxLQUFvQjtJQUMxRSxJQUFJLEtBQUssRUFBRTtRQUNULHNEQUFzRDtRQUN0RCxzREFBc0Q7UUFDdEQsaUNBQWlDO1FBQ2pDLEtBQUssR0FBRyxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDekIsU0FBUyxJQUFJLFNBQVMsQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO1FBQzFDLFFBQVEsSUFBSSxvQkFBb0IsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO1lBQ3hDLFFBQVEsQ0FBQyxRQUFRLENBQUMsTUFBTSxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsbUJBQW1CLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztZQUN0RSxNQUFNLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUM7S0FDM0M7U0FBTTtRQUNMLFNBQVMsSUFBSSxTQUFTLENBQUMsbUJBQW1CLEVBQUUsQ0FBQztRQUM3QyxRQUFRLElBQUksb0JBQW9CLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztZQUN4QyxRQUFRLENBQUMsV0FBVyxDQUFDLE1BQU0sRUFBRSxJQUFJLEVBQUUsbUJBQW1CLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztZQUNsRSxNQUFNLENBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsQ0FBQztLQUN2QztBQUNILENBQUMsQ0FBQztBQUVOOztHQUVHO0FBQ0gsSUFBTSxRQUFRLEdBQ1YsVUFBQyxRQUEwQixFQUFFLE1BQVcsRUFBRSxTQUFpQixFQUFFLEtBQVU7SUFDckUsSUFBSSxTQUFTLEtBQUssRUFBRSxFQUFFO1FBQ3BCLElBQUksS0FBSyxFQUFFO1lBQ1QsU0FBUyxJQUFJLFNBQVMsQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO1lBQzFDLFFBQVEsSUFBSSxvQkFBb0IsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEVBQUUsU0FBUyxDQUFDLENBQUMsQ0FBQztnQkFDdEMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUM7U0FDOUU7YUFBTTtZQUNMLFNBQVMsSUFBSSxTQUFTLENBQUMsbUJBQW1CLEVBQUUsQ0FBQztZQUM3QyxRQUFRLElBQUksb0JBQW9CLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsTUFBTSxFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUM7Z0JBQ3pDLE1BQU0sQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1NBQ2pGO0tBQ0Y7QUFDSCxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiogQGxpY2Vuc2VcbiogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4qXG4qIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4qIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiovXG5pbXBvcnQge1N0eWxlU2FuaXRpemVGbiwgU3R5bGVTYW5pdGl6ZU1vZGV9IGZyb20gJy4uLy4uL3Nhbml0aXphdGlvbi9zdHlsZV9zYW5pdGl6ZXInO1xuaW1wb3J0IHtQcm9jZWR1cmFsUmVuZGVyZXIzLCBSRWxlbWVudCwgUmVuZGVyZXIzLCBSZW5kZXJlclN0eWxlRmxhZ3MzLCBpc1Byb2NlZHVyYWxSZW5kZXJlcn0gZnJvbSAnLi4vaW50ZXJmYWNlcy9yZW5kZXJlcic7XG5cbmltcG9ydCB7QXBwbHlTdHlsaW5nRm4sIExTdHlsaW5nRGF0YSwgTFN0eWxpbmdNYXAsIFN0eWxpbmdNYXBzU3luY01vZGUsIFN5bmNTdHlsaW5nTWFwc0ZuLCBUU3R5bGluZ0NvbnRleHQsIFRTdHlsaW5nQ29udGV4dEluZGV4LCBUU3R5bGluZ0NvbnRleHRQcm9wQ29uZmlnRmxhZ3N9IGZyb20gJy4vaW50ZXJmYWNlcyc7XG5pbXBvcnQge2FsbG93U3R5bGluZ0ZsdXNoLCBnZXRCaW5kaW5nVmFsdWUsIGdldEd1YXJkTWFzaywgZ2V0UHJvcCwgZ2V0UHJvcFZhbHVlc1N0YXJ0UG9zaXRpb24sIGdldFZhbHVlc0NvdW50LCBoYXNWYWx1ZUNoYW5nZWQsIGlzQ29udGV4dExvY2tlZCwgaXNTYW5pdGl6YXRpb25SZXF1aXJlZCwgaXNTdHlsaW5nVmFsdWVEZWZpbmVkLCBsb2NrQ29udGV4dCwgc2V0R3VhcmRNYXNrfSBmcm9tICcuL3V0aWwnO1xuXG5cbi8qKlxuICogLS0tLS0tLS1cbiAqXG4gKiBUaGlzIGZpbGUgY29udGFpbnMgdGhlIGNvcmUgbG9naWMgZm9yIHN0eWxpbmcgaW4gQW5ndWxhci5cbiAqXG4gKiBBbGwgc3R5bGluZyBiaW5kaW5ncyAoaS5lLiBgW3N0eWxlXWAsIGBbc3R5bGUucHJvcF1gLCBgW2NsYXNzXWAgYW5kIGBbY2xhc3MubmFtZV1gKVxuICogd2lsbCBoYXZlIHRoZWlyIHZhbHVlcyBiZSBhcHBsaWVkIHRocm91Z2ggdGhlIGxvZ2ljIGluIHRoaXMgZmlsZS5cbiAqXG4gKiBXaGVuIGEgYmluZGluZyBpcyBlbmNvdW50ZXJlZCAoZS5nLiBgPGRpdiBbc3R5bGUud2lkdGhdPVwid1wiPmApIHRoZW5cbiAqIHRoZSBiaW5kaW5nIGRhdGEgd2lsbCBiZSBwb3B1bGF0ZWQgaW50byBhIGBUU3R5bGluZ0NvbnRleHRgIGRhdGEtc3RydWN0dXJlLlxuICogVGhlcmUgaXMgb25seSBvbmUgYFRTdHlsaW5nQ29udGV4dGAgcGVyIGBUTm9kZWAgYW5kIGVhY2ggZWxlbWVudCBpbnN0YW5jZVxuICogd2lsbCB1cGRhdGUgaXRzIHN0eWxlL2NsYXNzIGJpbmRpbmcgdmFsdWVzIGluIGNvbmNlcnQgd2l0aCB0aGUgc3R5bGluZ1xuICogY29udGV4dC5cbiAqXG4gKiBUbyBsZWFybiBtb3JlIGFib3V0IHRoZSBhbGdvcml0aG0gc2VlIGBUU3R5bGluZ0NvbnRleHRgLlxuICpcbiAqIC0tLS0tLS0tXG4gKi9cblxuY29uc3QgREVGQVVMVF9CSU5ESU5HX1ZBTFVFID0gbnVsbDtcbmNvbnN0IERFRkFVTFRfU0laRV9WQUxVRSA9IDE7XG5cbi8vIFRoZSBmaXJzdCBiaXQgdmFsdWUgcmVmbGVjdHMgYSBtYXAtYmFzZWQgYmluZGluZyB2YWx1ZSdzIGJpdC5cbi8vIFRoZSByZWFzb24gd2h5IGl0J3MgYWx3YXlzIGFjdGl2YXRlZCBmb3IgZXZlcnkgZW50cnkgaW4gdGhlIG1hcFxuLy8gaXMgc28gdGhhdCBpZiBhbnkgbWFwLWJpbmRpbmcgdmFsdWVzIHVwZGF0ZSB0aGVuIGFsbCBvdGhlciBwcm9wXG4vLyBiYXNlZCBiaW5kaW5ncyB3aWxsIHBhc3MgdGhlIGd1YXJkIGNoZWNrIGF1dG9tYXRpY2FsbHkgd2l0aG91dFxuLy8gYW55IGV4dHJhIGNvZGUgb3IgZmxhZ3MuXG5leHBvcnQgY29uc3QgREVGQVVMVF9HVUFSRF9NQVNLX1ZBTFVFID0gMGIxO1xuY29uc3QgU1RZTElOR19JTkRFWF9GT1JfTUFQX0JJTkRJTkcgPSAwO1xuY29uc3QgU1RZTElOR19JTkRFWF9TVEFSVF9WQUxVRSA9IDE7XG5cbi8vIHRoZSB2YWx1ZXMgYmVsb3cgYXJlIGdsb2JhbCB0byBhbGwgc3R5bGluZyBjb2RlIGJlbG93LiBFYWNoIHZhbHVlXG4vLyB3aWxsIGVpdGhlciBpbmNyZW1lbnQgb3IgbXV0YXRlIGVhY2ggdGltZSBhIHN0eWxpbmcgaW5zdHJ1Y3Rpb24gaXNcbi8vIGV4ZWN1dGVkLiBEbyBub3QgbW9kaWZ5IHRoZSB2YWx1ZXMgYmVsb3cuXG5sZXQgY3VycmVudFN0eWxlSW5kZXggPSBTVFlMSU5HX0lOREVYX1NUQVJUX1ZBTFVFO1xubGV0IGN1cnJlbnRDbGFzc0luZGV4ID0gU1RZTElOR19JTkRFWF9TVEFSVF9WQUxVRTtcbmxldCBzdHlsZXNCaXRNYXNrID0gMDtcbmxldCBjbGFzc2VzQml0TWFzayA9IDA7XG5sZXQgZGVmZXJyZWRCaW5kaW5nUXVldWU6IChUU3R5bGluZ0NvbnRleHQgfCBudW1iZXIgfCBzdHJpbmcgfCBudWxsIHwgYm9vbGVhbilbXSA9IFtdO1xuXG4vKipcbiAqIFZpc2l0cyBhIGNsYXNzLWJhc2VkIGJpbmRpbmcgYW5kIHVwZGF0ZXMgdGhlIG5ldyB2YWx1ZSAoaWYgY2hhbmdlZCkuXG4gKlxuICogVGhpcyBmdW5jdGlvbiBpcyBjYWxsZWQgZWFjaCB0aW1lIGEgY2xhc3MtYmFzZWQgc3R5bGluZyBpbnN0cnVjdGlvblxuICogaXMgZXhlY3V0ZWQuIEl0J3MgaW1wb3J0YW50IHRoYXQgaXQncyBhbHdheXMgY2FsbGVkIChldmVuIGlmIHRoZSB2YWx1ZVxuICogaGFzIG5vdCBjaGFuZ2VkKSBzbyB0aGF0IHRoZSBpbm5lciBjb3VudGVyIGluZGV4IHZhbHVlIGlzIGluY3JlbWVudGVkLlxuICogVGhpcyB3YXksIGVhY2ggaW5zdHJ1Y3Rpb24gaXMgYWx3YXlzIGd1YXJhbnRlZWQgdG8gZ2V0IHRoZSBzYW1lIGNvdW50ZXJcbiAqIHN0YXRlIGVhY2ggdGltZSBpdCdzIGNhbGxlZCAod2hpY2ggdGhlbiBhbGxvd3MgdGhlIGBUU3R5bGluZ0NvbnRleHRgXG4gKiBhbmQgdGhlIGJpdCBtYXNrIHZhbHVlcyB0byBiZSBpbiBzeW5jKS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHVwZGF0ZUNsYXNzQmluZGluZyhcbiAgICBjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQsIGRhdGE6IExTdHlsaW5nRGF0YSwgcHJvcDogc3RyaW5nIHwgbnVsbCwgYmluZGluZ0luZGV4OiBudW1iZXIsXG4gICAgdmFsdWU6IGJvb2xlYW4gfCBzdHJpbmcgfCBudWxsIHwgdW5kZWZpbmVkIHwgTFN0eWxpbmdNYXAsIGRlZmVyUmVnaXN0cmF0aW9uOiBib29sZWFuLFxuICAgIGZvcmNlVXBkYXRlOiBib29sZWFuKTogdm9pZCB7XG4gIGNvbnN0IGlzTWFwQmFzZWQgPSAhcHJvcDtcbiAgY29uc3QgaW5kZXggPSBpc01hcEJhc2VkID8gU1RZTElOR19JTkRFWF9GT1JfTUFQX0JJTkRJTkcgOiBjdXJyZW50Q2xhc3NJbmRleCsrO1xuICBjb25zdCB1cGRhdGVkID0gdXBkYXRlQmluZGluZ0RhdGEoXG4gICAgICBjb250ZXh0LCBkYXRhLCBpbmRleCwgcHJvcCwgYmluZGluZ0luZGV4LCB2YWx1ZSwgZGVmZXJSZWdpc3RyYXRpb24sIGZvcmNlVXBkYXRlLCBmYWxzZSk7XG4gIGlmICh1cGRhdGVkIHx8IGZvcmNlVXBkYXRlKSB7XG4gICAgY2xhc3Nlc0JpdE1hc2sgfD0gMSA8PCBpbmRleDtcbiAgfVxufVxuXG4vKipcbiAqIFZpc2l0cyBhIHN0eWxlLWJhc2VkIGJpbmRpbmcgYW5kIHVwZGF0ZXMgdGhlIG5ldyB2YWx1ZSAoaWYgY2hhbmdlZCkuXG4gKlxuICogVGhpcyBmdW5jdGlvbiBpcyBjYWxsZWQgZWFjaCB0aW1lIGEgc3R5bGUtYmFzZWQgc3R5bGluZyBpbnN0cnVjdGlvblxuICogaXMgZXhlY3V0ZWQuIEl0J3MgaW1wb3J0YW50IHRoYXQgaXQncyBhbHdheXMgY2FsbGVkIChldmVuIGlmIHRoZSB2YWx1ZVxuICogaGFzIG5vdCBjaGFuZ2VkKSBzbyB0aGF0IHRoZSBpbm5lciBjb3VudGVyIGluZGV4IHZhbHVlIGlzIGluY3JlbWVudGVkLlxuICogVGhpcyB3YXksIGVhY2ggaW5zdHJ1Y3Rpb24gaXMgYWx3YXlzIGd1YXJhbnRlZWQgdG8gZ2V0IHRoZSBzYW1lIGNvdW50ZXJcbiAqIHN0YXRlIGVhY2ggdGltZSBpdCdzIGNhbGxlZCAod2hpY2ggdGhlbiBhbGxvd3MgdGhlIGBUU3R5bGluZ0NvbnRleHRgXG4gKiBhbmQgdGhlIGJpdCBtYXNrIHZhbHVlcyB0byBiZSBpbiBzeW5jKS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHVwZGF0ZVN0eWxlQmluZGluZyhcbiAgICBjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQsIGRhdGE6IExTdHlsaW5nRGF0YSwgcHJvcDogc3RyaW5nIHwgbnVsbCwgYmluZGluZ0luZGV4OiBudW1iZXIsXG4gICAgdmFsdWU6IFN0cmluZyB8IHN0cmluZyB8IG51bWJlciB8IG51bGwgfCB1bmRlZmluZWQgfCBMU3R5bGluZ01hcCxcbiAgICBzYW5pdGl6ZXI6IFN0eWxlU2FuaXRpemVGbiB8IG51bGwsIGRlZmVyUmVnaXN0cmF0aW9uOiBib29sZWFuLCBmb3JjZVVwZGF0ZTogYm9vbGVhbik6IHZvaWQge1xuICBjb25zdCBpc01hcEJhc2VkID0gIXByb3A7XG4gIGNvbnN0IGluZGV4ID0gaXNNYXBCYXNlZCA/IFNUWUxJTkdfSU5ERVhfRk9SX01BUF9CSU5ESU5HIDogY3VycmVudFN0eWxlSW5kZXgrKztcbiAgY29uc3Qgc2FuaXRpemF0aW9uUmVxdWlyZWQgPSBpc01hcEJhc2VkID9cbiAgICAgIHRydWUgOlxuICAgICAgKHNhbml0aXplciA/IHNhbml0aXplcihwcm9wICEsIG51bGwsIFN0eWxlU2FuaXRpemVNb2RlLlZhbGlkYXRlUHJvcGVydHkpIDogZmFsc2UpO1xuICBjb25zdCB1cGRhdGVkID0gdXBkYXRlQmluZGluZ0RhdGEoXG4gICAgICBjb250ZXh0LCBkYXRhLCBpbmRleCwgcHJvcCwgYmluZGluZ0luZGV4LCB2YWx1ZSwgZGVmZXJSZWdpc3RyYXRpb24sIGZvcmNlVXBkYXRlLFxuICAgICAgc2FuaXRpemF0aW9uUmVxdWlyZWQpO1xuICBpZiAodXBkYXRlZCB8fCBmb3JjZVVwZGF0ZSkge1xuICAgIHN0eWxlc0JpdE1hc2sgfD0gMSA8PCBpbmRleDtcbiAgfVxufVxuXG4vKipcbiAqIENhbGxlZCBlYWNoIHRpbWUgYSBiaW5kaW5nIHZhbHVlIGhhcyBjaGFuZ2VkIHdpdGhpbiB0aGUgcHJvdmlkZWQgYFRTdHlsaW5nQ29udGV4dGAuXG4gKlxuICogVGhpcyBmdW5jdGlvbiBpcyBkZXNpZ25lZCB0byBiZSBjYWxsZWQgZnJvbSBgdXBkYXRlU3R5bGVCaW5kaW5nYCBhbmQgYHVwZGF0ZUNsYXNzQmluZGluZ2AuXG4gKiBJZiBjYWxsZWQgZHVyaW5nIHRoZSBmaXJzdCB1cGRhdGUgcGFzcywgdGhlIGJpbmRpbmcgd2lsbCBiZSByZWdpc3RlcmVkIGluIHRoZSBjb250ZXh0LlxuICogSWYgdGhlIGJpbmRpbmcgZG9lcyBnZXQgcmVnaXN0ZXJlZCBhbmQgdGhlIGBkZWZlclJlZ2lzdHJhdGlvbmAgZmxhZyBpcyB0cnVlIHRoZW4gdGhlXG4gKiBiaW5kaW5nIGRhdGEgd2lsbCBiZSBxdWV1ZWQgdXAgdW50aWwgdGhlIGNvbnRleHQgaXMgbGF0ZXIgZmx1c2hlZCBpbiBgYXBwbHlTdHlsaW5nYC5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIHdpbGwgYWxzbyB1cGRhdGUgYmluZGluZyBzbG90IGluIHRoZSBwcm92aWRlZCBgTFN0eWxpbmdEYXRhYCB3aXRoIHRoZVxuICogbmV3IGJpbmRpbmcgZW50cnkgKGlmIGl0IGhhcyBjaGFuZ2VkKS5cbiAqXG4gKiBAcmV0dXJucyB3aGV0aGVyIG9yIG5vdCB0aGUgYmluZGluZyB2YWx1ZSB3YXMgdXBkYXRlZCBpbiB0aGUgYExTdHlsaW5nRGF0YWAuXG4gKi9cbmZ1bmN0aW9uIHVwZGF0ZUJpbmRpbmdEYXRhKFxuICAgIGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCwgZGF0YTogTFN0eWxpbmdEYXRhLCBjb3VudGVySW5kZXg6IG51bWJlciwgcHJvcDogc3RyaW5nIHwgbnVsbCxcbiAgICBiaW5kaW5nSW5kZXg6IG51bWJlcixcbiAgICB2YWx1ZTogc3RyaW5nIHwgU3RyaW5nIHwgbnVtYmVyIHwgYm9vbGVhbiB8IG51bGwgfCB1bmRlZmluZWQgfCBMU3R5bGluZ01hcCxcbiAgICBkZWZlclJlZ2lzdHJhdGlvbjogYm9vbGVhbiwgZm9yY2VVcGRhdGU6IGJvb2xlYW4sIHNhbml0aXphdGlvblJlcXVpcmVkOiBib29sZWFuKTogYm9vbGVhbiB7XG4gIGlmICghaXNDb250ZXh0TG9ja2VkKGNvbnRleHQpKSB7XG4gICAgaWYgKGRlZmVyUmVnaXN0cmF0aW9uKSB7XG4gICAgICBkZWZlckJpbmRpbmdSZWdpc3RyYXRpb24oY29udGV4dCwgY291bnRlckluZGV4LCBwcm9wLCBiaW5kaW5nSW5kZXgsIHNhbml0aXphdGlvblJlcXVpcmVkKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZGVmZXJyZWRCaW5kaW5nUXVldWUubGVuZ3RoICYmIGZsdXNoRGVmZXJyZWRCaW5kaW5ncygpO1xuXG4gICAgICAvLyB0aGlzIHdpbGwgb25seSBoYXBwZW4gZHVyaW5nIHRoZSBmaXJzdCB1cGRhdGUgcGFzcyBvZiB0aGVcbiAgICAgIC8vIGNvbnRleHQuIFRoZSByZWFzb24gd2h5IHdlIGNhbid0IHVzZSBgdE5vZGUuZmlyc3RUZW1wbGF0ZVBhc3NgXG4gICAgICAvLyBoZXJlIGlzIGJlY2F1c2UgaXRzIG5vdCBndWFyYW50ZWVkIHRvIGJlIHRydWUgd2hlbiB0aGUgZmlyc3RcbiAgICAgIC8vIHVwZGF0ZSBwYXNzIGlzIGV4ZWN1dGVkIChyZW1lbWJlciB0aGF0IGFsbCBzdHlsaW5nIGluc3RydWN0aW9uc1xuICAgICAgLy8gYXJlIHJ1biBpbiB0aGUgdXBkYXRlIHBoYXNlLCBhbmQsIGFzIGEgcmVzdWx0LCBhcmUgbm8gbW9yZVxuICAgICAgLy8gc3R5bGluZyBpbnN0cnVjdGlvbnMgdGhhdCBhcmUgcnVuIGluIHRoZSBjcmVhdGlvbiBwaGFzZSkuXG4gICAgICByZWdpc3RlckJpbmRpbmcoY29udGV4dCwgY291bnRlckluZGV4LCBwcm9wLCBiaW5kaW5nSW5kZXgsIHNhbml0aXphdGlvblJlcXVpcmVkKTtcbiAgICB9XG4gIH1cblxuICBjb25zdCBjaGFuZ2VkID0gZm9yY2VVcGRhdGUgfHwgaGFzVmFsdWVDaGFuZ2VkKGRhdGFbYmluZGluZ0luZGV4XSwgdmFsdWUpO1xuICBpZiAoY2hhbmdlZCkge1xuICAgIGRhdGFbYmluZGluZ0luZGV4XSA9IHZhbHVlO1xuICB9XG4gIHJldHVybiBjaGFuZ2VkO1xufVxuXG4vKipcbiAqIFNjaGVkdWxlcyBhIGJpbmRpbmcgcmVnaXN0cmF0aW9uIHRvIGJlIHJ1biBhdCBhIGxhdGVyIHBvaW50LlxuICpcbiAqIFRoZSByZWFzb25pbmcgZm9yIHRoaXMgZmVhdHVyZSBpcyB0byBlbnN1cmUgdGhhdCBzdHlsaW5nXG4gKiBiaW5kaW5ncyBhcmUgcmVnaXN0ZXJlZCBpbiB0aGUgY29ycmVjdCBvcmRlciBmb3Igd2hlblxuICogZGlyZWN0aXZlcy9jb21wb25lbnRzIGhhdmUgYSBzdXBlci9zdWIgY2xhc3MgaW5oZXJpdGFuY2VcbiAqIGNoYWlucy4gRWFjaCBkaXJlY3RpdmUncyBzdHlsaW5nIGJpbmRpbmdzIG11c3QgYmVcbiAqIHJlZ2lzdGVyZWQgaW50byB0aGUgY29udGV4dCBpbiByZXZlcnNlIG9yZGVyLiBUaGVyZWZvcmUgYWxsXG4gKiBiaW5kaW5ncyB3aWxsIGJlIGJ1ZmZlcmVkIGluIHJldmVyc2Ugb3JkZXIgYW5kIHRoZW4gYXBwbGllZFxuICogYWZ0ZXIgdGhlIGluaGVyaXRhbmNlIGNoYWluIGV4aXRzLlxuICovXG5mdW5jdGlvbiBkZWZlckJpbmRpbmdSZWdpc3RyYXRpb24oXG4gICAgY29udGV4dDogVFN0eWxpbmdDb250ZXh0LCBjb3VudGVySW5kZXg6IG51bWJlciwgcHJvcDogc3RyaW5nIHwgbnVsbCwgYmluZGluZ0luZGV4OiBudW1iZXIsXG4gICAgc2FuaXRpemF0aW9uUmVxdWlyZWQ6IGJvb2xlYW4pIHtcbiAgZGVmZXJyZWRCaW5kaW5nUXVldWUudW5zaGlmdChjb250ZXh0LCBjb3VudGVySW5kZXgsIHByb3AsIGJpbmRpbmdJbmRleCwgc2FuaXRpemF0aW9uUmVxdWlyZWQpO1xufVxuXG4vKipcbiAqIEZsdXNoZXMgdGhlIGNvbGxlY3Rpb24gb2YgZGVmZXJyZWQgYmluZGluZ3MgYW5kIGNhdXNlcyBlYWNoIGVudHJ5XG4gKiB0byBiZSByZWdpc3RlcmVkIGludG8gdGhlIGNvbnRleHQuXG4gKi9cbmZ1bmN0aW9uIGZsdXNoRGVmZXJyZWRCaW5kaW5ncygpIHtcbiAgbGV0IGkgPSAwO1xuICB3aGlsZSAoaSA8IGRlZmVycmVkQmluZGluZ1F1ZXVlLmxlbmd0aCkge1xuICAgIGNvbnN0IGNvbnRleHQgPSBkZWZlcnJlZEJpbmRpbmdRdWV1ZVtpKytdIGFzIFRTdHlsaW5nQ29udGV4dDtcbiAgICBjb25zdCBjb3VudCA9IGRlZmVycmVkQmluZGluZ1F1ZXVlW2krK10gYXMgbnVtYmVyO1xuICAgIGNvbnN0IHByb3AgPSBkZWZlcnJlZEJpbmRpbmdRdWV1ZVtpKytdIGFzIHN0cmluZztcbiAgICBjb25zdCBiaW5kaW5nSW5kZXggPSBkZWZlcnJlZEJpbmRpbmdRdWV1ZVtpKytdIGFzIG51bWJlciB8IG51bGw7XG4gICAgY29uc3Qgc2FuaXRpemF0aW9uUmVxdWlyZWQgPSBkZWZlcnJlZEJpbmRpbmdRdWV1ZVtpKytdIGFzIGJvb2xlYW47XG4gICAgcmVnaXN0ZXJCaW5kaW5nKGNvbnRleHQsIGNvdW50LCBwcm9wLCBiaW5kaW5nSW5kZXgsIHNhbml0aXphdGlvblJlcXVpcmVkKTtcbiAgfVxuICBkZWZlcnJlZEJpbmRpbmdRdWV1ZS5sZW5ndGggPSAwO1xufVxuXG4vKipcbiAqIFJlZ2lzdGVycyB0aGUgcHJvdmlkZWQgYmluZGluZyAocHJvcCArIGJpbmRpbmdJbmRleCkgaW50byB0aGUgY29udGV4dC5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIGlzIHNoYXJlZCBiZXR3ZWVuIGJpbmRpbmdzIHRoYXQgYXJlIGFzc2lnbmVkIGltbWVkaWF0ZWx5XG4gKiAodmlhIGB1cGRhdGVCaW5kaW5nRGF0YWApIGFuZCBhdCBhIGRlZmVycmVkIHN0YWdlLiBXaGVuIGNhbGxlZCwgaXQgd2lsbFxuICogZmlndXJlIG91dCBleGFjdGx5IHdoZXJlIHRvIHBsYWNlIHRoZSBiaW5kaW5nIGRhdGEgaW4gdGhlIGNvbnRleHQuXG4gKlxuICogSXQgaXMgbmVlZGVkIGJlY2F1c2UgaXQgd2lsbCBlaXRoZXIgdXBkYXRlIG9yIGluc2VydCBhIHN0eWxpbmcgcHJvcGVydHlcbiAqIGludG8gdGhlIGNvbnRleHQgYXQgdGhlIGNvcnJlY3Qgc3BvdC5cbiAqXG4gKiBXaGVuIGNhbGxlZCwgb25lIG9mIHR3byB0aGluZ3Mgd2lsbCBoYXBwZW46XG4gKlxuICogMSkgSWYgdGhlIHByb3BlcnR5IGFscmVhZHkgZXhpc3RzIGluIHRoZSBjb250ZXh0IHRoZW4gaXQgd2lsbCBqdXN0IGFkZFxuICogICAgdGhlIHByb3ZpZGVkIGBiaW5kaW5nVmFsdWVgIHRvIHRoZSBlbmQgb2YgdGhlIGJpbmRpbmcgc291cmNlcyByZWdpb25cbiAqICAgIGZvciB0aGF0IHBhcnRpY3VsYXIgcHJvcGVydHkuXG4gKlxuICogICAgLSBJZiB0aGUgYmluZGluZyB2YWx1ZSBpcyBhIG51bWJlciB0aGVuIGl0IHdpbGwgYmUgYWRkZWQgYXMgYSBuZXdcbiAqICAgICAgYmluZGluZyBpbmRleCBzb3VyY2UgbmV4dCB0byB0aGUgb3RoZXIgYmluZGluZyBzb3VyY2VzIGZvciB0aGUgcHJvcGVydHkuXG4gKlxuICogICAgLSBPdGhlcndpc2UsIGlmIHRoZSBiaW5kaW5nIHZhbHVlIGlzIGEgc3RyaW5nL2Jvb2xlYW4vbnVsbCB0eXBlIHRoZW4gaXQgd2lsbFxuICogICAgICByZXBsYWNlIHRoZSBkZWZhdWx0IHZhbHVlIGZvciB0aGUgcHJvcGVydHkgaWYgdGhlIGRlZmF1bHQgdmFsdWUgaXMgYG51bGxgLlxuICpcbiAqIDIpIElmIHRoZSBwcm9wZXJ0eSBkb2VzIG5vdCBleGlzdCB0aGVuIGl0IHdpbGwgYmUgaW5zZXJ0ZWQgaW50byB0aGUgY29udGV4dC5cbiAqICAgIFRoZSBzdHlsaW5nIGNvbnRleHQgcmVsaWVzIG9uIGFsbCBwcm9wZXJ0aWVzIGJlaW5nIHN0b3JlZCBpbiBhbHBoYWJldGljYWxcbiAqICAgIG9yZGVyLCBzbyBpdCBrbm93cyBleGFjdGx5IHdoZXJlIHRvIHN0b3JlIGl0LlxuICpcbiAqICAgIFdoZW4gaW5zZXJ0ZWQsIGEgZGVmYXVsdCBgbnVsbGAgdmFsdWUgaXMgY3JlYXRlZCBmb3IgdGhlIHByb3BlcnR5IHdoaWNoIGV4aXN0c1xuICogICAgYXMgdGhlIGRlZmF1bHQgdmFsdWUgZm9yIHRoZSBiaW5kaW5nLiBJZiB0aGUgYmluZGluZ1ZhbHVlIHByb3BlcnR5IGlzIGluc2VydGVkXG4gKiAgICBhbmQgaXQgaXMgZWl0aGVyIGEgc3RyaW5nLCBudW1iZXIgb3IgbnVsbCB2YWx1ZSB0aGVuIHRoYXQgd2lsbCByZXBsYWNlIHRoZSBkZWZhdWx0XG4gKiAgICB2YWx1ZS5cbiAqXG4gKiBOb3RlIHRoYXQgdGhpcyBmdW5jdGlvbiBpcyBhbHNvIHVzZWQgZm9yIG1hcC1iYXNlZCBzdHlsaW5nIGJpbmRpbmdzLiBUaGV5IGFyZSB0cmVhdGVkXG4gKiBtdWNoIHRoZSBzYW1lIGFzIHByb3AtYmFzZWQgYmluZGluZ3MsIGJ1dCwgYmVjYXVzZSB0aGV5IGRvIG5vdCBoYXZlIGEgcHJvcGVydHkgdmFsdWVcbiAqIChzaW5jZSBpdCdzIGEgbWFwKSwgYWxsIG1hcC1iYXNlZCBlbnRyaWVzIGFyZSBzdG9yZWQgaW4gYW4gYWxyZWFkeSBwb3B1bGF0ZWQgYXJlYSBvZlxuICogdGhlIGNvbnRleHQgYXQgdGhlIHRvcCAod2hpY2ggaXMgcmVzZXJ2ZWQgZm9yIG1hcC1iYXNlZCBlbnRyaWVzKS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlZ2lzdGVyQmluZGluZyhcbiAgICBjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQsIGNvdW50SWQ6IG51bWJlciwgcHJvcDogc3RyaW5nIHwgbnVsbCxcbiAgICBiaW5kaW5nVmFsdWU6IG51bWJlciB8IG51bGwgfCBzdHJpbmcgfCBib29sZWFuLCBzYW5pdGl6YXRpb25SZXF1aXJlZD86IGJvb2xlYW4pIHtcbiAgLy8gcHJvcC1iYXNlZCBiaW5kaW5ncyAoZS5nIGA8ZGl2IFtzdHlsZS53aWR0aF09XCJ3XCIgW2NsYXNzLmZvb109XCJmXCI+YClcbiAgaWYgKHByb3ApIHtcbiAgICBsZXQgZm91bmQgPSBmYWxzZTtcbiAgICBsZXQgaSA9IGdldFByb3BWYWx1ZXNTdGFydFBvc2l0aW9uKGNvbnRleHQpO1xuICAgIHdoaWxlIChpIDwgY29udGV4dC5sZW5ndGgpIHtcbiAgICAgIGNvbnN0IHZhbHVlc0NvdW50ID0gZ2V0VmFsdWVzQ291bnQoY29udGV4dCwgaSk7XG4gICAgICBjb25zdCBwID0gZ2V0UHJvcChjb250ZXh0LCBpKTtcbiAgICAgIGZvdW5kID0gcHJvcCA8PSBwO1xuICAgICAgaWYgKGZvdW5kKSB7XG4gICAgICAgIC8vIGFsbCBzdHlsZS9jbGFzcyBiaW5kaW5ncyBhcmUgc29ydGVkIGJ5IHByb3BlcnR5IG5hbWVcbiAgICAgICAgaWYgKHByb3AgPCBwKSB7XG4gICAgICAgICAgYWxsb2NhdGVOZXdDb250ZXh0RW50cnkoY29udGV4dCwgaSwgcHJvcCwgc2FuaXRpemF0aW9uUmVxdWlyZWQpO1xuICAgICAgICB9XG4gICAgICAgIGFkZEJpbmRpbmdJbnRvQ29udGV4dChjb250ZXh0LCBmYWxzZSwgaSwgYmluZGluZ1ZhbHVlLCBjb3VudElkKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBpICs9IFRTdHlsaW5nQ29udGV4dEluZGV4LkJpbmRpbmdzU3RhcnRPZmZzZXQgKyB2YWx1ZXNDb3VudDtcbiAgICB9XG5cbiAgICBpZiAoIWZvdW5kKSB7XG4gICAgICBhbGxvY2F0ZU5ld0NvbnRleHRFbnRyeShjb250ZXh0LCBjb250ZXh0Lmxlbmd0aCwgcHJvcCwgc2FuaXRpemF0aW9uUmVxdWlyZWQpO1xuICAgICAgYWRkQmluZGluZ0ludG9Db250ZXh0KGNvbnRleHQsIGZhbHNlLCBpLCBiaW5kaW5nVmFsdWUsIGNvdW50SWQpO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICAvLyBtYXAtYmFzZWQgYmluZGluZ3MgKGUuZyBgPGRpdiBbc3R5bGVdPVwic1wiIFtjbGFzc109XCJ7Y2xhc3NOYW1lOnRydWV9XCI+YClcbiAgICAvLyB0aGVyZSBpcyBubyBuZWVkIHRvIGFsbG9jYXRlIHRoZSBtYXAtYmFzZWQgYmluZGluZyByZWdpb24gaW50byB0aGUgY29udGV4dFxuICAgIC8vIHNpbmNlIGl0IGlzIGFscmVhZHkgdGhlcmUgd2hlbiB0aGUgY29udGV4dCBpcyBmaXJzdCBjcmVhdGVkLlxuICAgIGFkZEJpbmRpbmdJbnRvQ29udGV4dChcbiAgICAgICAgY29udGV4dCwgdHJ1ZSwgVFN0eWxpbmdDb250ZXh0SW5kZXguTWFwQmluZGluZ3NQb3NpdGlvbiwgYmluZGluZ1ZhbHVlLCBjb3VudElkKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBhbGxvY2F0ZU5ld0NvbnRleHRFbnRyeShcbiAgICBjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQsIGluZGV4OiBudW1iZXIsIHByb3A6IHN0cmluZywgc2FuaXRpemF0aW9uUmVxdWlyZWQ/OiBib29sZWFuKSB7XG4gIC8vIDEsMjogc3BsaWNlIGluZGV4IGxvY2F0aW9uc1xuICAvLyAzOiBlYWNoIGVudHJ5IGdldHMgYSBjb25maWcgdmFsdWUgKGd1YXJkIG1hc2sgKyBmbGFncylcbiAgLy8gNC4gZWFjaCBlbnRyeSBnZXRzIGEgc2l6ZSB2YWx1ZSAod2hpY2ggaXMgYWx3YXlzIG9uZSBiZWNhdXNlIHRoZXJlIGlzIGFsd2F5cyBhIGRlZmF1bHQgYmluZGluZ1xuICAvLyB2YWx1ZSlcbiAgLy8gNS4gdGhlIHByb3BlcnR5IHRoYXQgaXMgZ2V0dGluZyBhbGxvY2F0ZWQgaW50byB0aGUgY29udGV4dFxuICAvLyA2LiB0aGUgZGVmYXVsdCBiaW5kaW5nIHZhbHVlICh1c3VhbGx5IGBudWxsYClcbiAgY29uc3QgY29uZmlnID0gc2FuaXRpemF0aW9uUmVxdWlyZWQgPyBUU3R5bGluZ0NvbnRleHRQcm9wQ29uZmlnRmxhZ3MuU2FuaXRpemF0aW9uUmVxdWlyZWQgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFRTdHlsaW5nQ29udGV4dFByb3BDb25maWdGbGFncy5EZWZhdWx0O1xuICBjb250ZXh0LnNwbGljZShpbmRleCwgMCwgY29uZmlnLCBERUZBVUxUX1NJWkVfVkFMVUUsIHByb3AsIERFRkFVTFRfQklORElOR19WQUxVRSk7XG4gIHNldEd1YXJkTWFzayhjb250ZXh0LCBpbmRleCwgREVGQVVMVF9HVUFSRF9NQVNLX1ZBTFVFKTtcbn1cblxuLyoqXG4gKiBJbnNlcnRzIGEgbmV3IGJpbmRpbmcgdmFsdWUgaW50byBhIHN0eWxpbmcgcHJvcGVydHkgdHVwbGUgaW4gdGhlIGBUU3R5bGluZ0NvbnRleHRgLlxuICpcbiAqIEEgYmluZGluZ1ZhbHVlIGlzIGluc2VydGVkIGludG8gYSBjb250ZXh0IGR1cmluZyB0aGUgZmlyc3QgdXBkYXRlIHBhc3NcbiAqIG9mIGEgdGVtcGxhdGUgb3IgaG9zdCBiaW5kaW5ncyBmdW5jdGlvbi4gV2hlbiB0aGlzIG9jY3VycywgdHdvIHRoaW5nc1xuICogaGFwcGVuOlxuICpcbiAqIC0gSWYgdGhlIGJpbmRpbmdWYWx1ZSB2YWx1ZSBpcyBhIG51bWJlciB0aGVuIGl0IGlzIHRyZWF0ZWQgYXMgYSBiaW5kaW5nSW5kZXhcbiAqICAgdmFsdWUgKGEgaW5kZXggaW4gdGhlIGBMVmlld2ApIGFuZCBpdCB3aWxsIGJlIGluc2VydGVkIG5leHQgdG8gdGhlIG90aGVyXG4gKiAgIGJpbmRpbmcgaW5kZXggZW50cmllcy5cbiAqXG4gKiAtIE90aGVyd2lzZSB0aGUgYmluZGluZyB2YWx1ZSB3aWxsIHVwZGF0ZSB0aGUgZGVmYXVsdCB2YWx1ZSBmb3IgdGhlIHByb3BlcnR5XG4gKiAgIGFuZCB0aGlzIHdpbGwgb25seSBoYXBwZW4gaWYgdGhlIGRlZmF1bHQgdmFsdWUgaXMgYG51bGxgLlxuICpcbiAqIE5vdGUgdGhhdCB0aGlzIGZ1bmN0aW9uIGFsc28gaGFuZGxlcyBtYXAtYmFzZWQgYmluZGluZ3MgYW5kIHdpbGwgaW5zZXJ0IHRoZW1cbiAqIGF0IHRoZSB0b3Agb2YgdGhlIGNvbnRleHQuXG4gKi9cbmZ1bmN0aW9uIGFkZEJpbmRpbmdJbnRvQ29udGV4dChcbiAgICBjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQsIGlzTWFwQmFzZWQ6IGJvb2xlYW4sIGluZGV4OiBudW1iZXIsXG4gICAgYmluZGluZ1ZhbHVlOiBudW1iZXIgfCBzdHJpbmcgfCBib29sZWFuIHwgbnVsbCwgY291bnRJZDogbnVtYmVyKSB7XG4gIGNvbnN0IHZhbHVlc0NvdW50ID0gZ2V0VmFsdWVzQ291bnQoY29udGV4dCwgaW5kZXgpO1xuXG4gIGxldCBsYXN0VmFsdWVJbmRleCA9IGluZGV4ICsgVFN0eWxpbmdDb250ZXh0SW5kZXguQmluZGluZ3NTdGFydE9mZnNldCArIHZhbHVlc0NvdW50O1xuICBpZiAoIWlzTWFwQmFzZWQpIHtcbiAgICAvLyBwcm9wLWJhc2VkIHZhbHVlcyBhbGwgaGF2ZSBkZWZhdWx0IHZhbHVlcywgYnV0IG1hcC1iYXNlZCBlbnRyaWVzIGRvIG5vdC5cbiAgICAvLyB3ZSB3YW50IHRvIGFjY2VzcyB0aGUgaW5kZXggZm9yIHRoZSBkZWZhdWx0IHZhbHVlIGluIHRoaXMgY2FzZSBhbmQgbm90IGp1c3RcbiAgICAvLyB0aGUgYmluZGluZ3MuLi5cbiAgICBsYXN0VmFsdWVJbmRleC0tO1xuICB9XG5cbiAgaWYgKHR5cGVvZiBiaW5kaW5nVmFsdWUgPT09ICdudW1iZXInKSB7XG4gICAgY29udGV4dC5zcGxpY2UobGFzdFZhbHVlSW5kZXgsIDAsIGJpbmRpbmdWYWx1ZSk7XG4gICAgKGNvbnRleHRbaW5kZXggKyBUU3R5bGluZ0NvbnRleHRJbmRleC5WYWx1ZXNDb3VudE9mZnNldF0gYXMgbnVtYmVyKSsrO1xuXG4gICAgLy8gbm93IHRoYXQgYSBuZXcgYmluZGluZyBpbmRleCBoYXMgYmVlbiBhZGRlZCB0byB0aGUgcHJvcGVydHlcbiAgICAvLyB0aGUgZ3VhcmQgbWFzayBiaXQgdmFsdWUgKGF0IHRoZSBgY291bnRJZGAgcG9zaXRpb24pIG5lZWRzXG4gICAgLy8gdG8gYmUgaW5jbHVkZWQgaW50byB0aGUgZXhpc3RpbmcgbWFzayB2YWx1ZS5cbiAgICBjb25zdCBndWFyZE1hc2sgPSBnZXRHdWFyZE1hc2soY29udGV4dCwgaW5kZXgpIHwgKDEgPDwgY291bnRJZCk7XG4gICAgc2V0R3VhcmRNYXNrKGNvbnRleHQsIGluZGV4LCBndWFyZE1hc2spO1xuICB9IGVsc2UgaWYgKHR5cGVvZiBiaW5kaW5nVmFsdWUgPT09ICdzdHJpbmcnICYmIGNvbnRleHRbbGFzdFZhbHVlSW5kZXhdID09IG51bGwpIHtcbiAgICBjb250ZXh0W2xhc3RWYWx1ZUluZGV4XSA9IGJpbmRpbmdWYWx1ZTtcbiAgfVxufVxuXG4vKipcbiAqIEFwcGxpZXMgYWxsIGNsYXNzIGVudHJpZXMgaW4gdGhlIHByb3ZpZGVkIGNvbnRleHQgdG8gdGhlIHByb3ZpZGVkIGVsZW1lbnQgYW5kIHJlc2V0c1xuICogYW55IGNvdW50ZXIgYW5kL29yIGJpdE1hc2sgdmFsdWVzIGFzc29jaWF0ZWQgd2l0aCBjbGFzcyBiaW5kaW5ncy5cbiAqXG4gKiBAcmV0dXJucyB3aGV0aGVyIG9yIG5vdCB0aGUgY2xhc3NlcyB3ZXJlIGZsdXNoZWQgdG8gdGhlIGVsZW1lbnQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhcHBseUNsYXNzZXMoXG4gICAgcmVuZGVyZXI6IFJlbmRlcmVyMyB8IFByb2NlZHVyYWxSZW5kZXJlcjMgfCBudWxsLCBkYXRhOiBMU3R5bGluZ0RhdGEsIGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCxcbiAgICBlbGVtZW50OiBSRWxlbWVudCwgZGlyZWN0aXZlSW5kZXg6IG51bWJlcik6IGJvb2xlYW4ge1xuICBsZXQgY2xhc3Nlc0ZsdXNoZWQgPSBmYWxzZTtcbiAgaWYgKGFsbG93U3R5bGluZ0ZsdXNoKGNvbnRleHQsIGRpcmVjdGl2ZUluZGV4KSkge1xuICAgIGNvbnN0IGlzRmlyc3RQYXNzID0gIWlzQ29udGV4dExvY2tlZChjb250ZXh0KTtcbiAgICBpc0ZpcnN0UGFzcyAmJiBsb2NrQ29udGV4dChjb250ZXh0KTtcbiAgICBpZiAoY2xhc3Nlc0JpdE1hc2spIHtcbiAgICAgIC8vIHRoZXJlIGlzIG5vIHdheSB0byBzYW5pdGl6ZSBhIGNsYXNzIHZhbHVlIHRoZXJlZm9yZSBgc2FuaXRpemVyPW51bGxgXG4gICAgICBhcHBseVN0eWxpbmcoY29udGV4dCwgcmVuZGVyZXIsIGVsZW1lbnQsIGRhdGEsIGNsYXNzZXNCaXRNYXNrLCBzZXRDbGFzcywgbnVsbCk7XG4gICAgICBjbGFzc2VzQml0TWFzayA9IDA7XG4gICAgICBjbGFzc2VzRmx1c2hlZCA9IHRydWU7XG4gICAgfVxuICAgIGN1cnJlbnRDbGFzc0luZGV4ID0gU1RZTElOR19JTkRFWF9TVEFSVF9WQUxVRTtcbiAgfVxuICByZXR1cm4gY2xhc3Nlc0ZsdXNoZWQ7XG59XG5cbi8qKlxuICogQXBwbGllcyBhbGwgc3R5bGUgZW50cmllcyBpbiB0aGUgcHJvdmlkZWQgY29udGV4dCB0byB0aGUgcHJvdmlkZWQgZWxlbWVudCBhbmQgcmVzZXRzXG4gKiBhbnkgY291bnRlciBhbmQvb3IgYml0TWFzayB2YWx1ZXMgYXNzb2NpYXRlZCB3aXRoIHN0eWxlIGJpbmRpbmdzLlxuICpcbiAqIEByZXR1cm5zIHdoZXRoZXIgb3Igbm90IHRoZSBzdHlsZXMgd2VyZSBmbHVzaGVkIHRvIHRoZSBlbGVtZW50LlxuICovXG5leHBvcnQgZnVuY3Rpb24gYXBwbHlTdHlsZXMoXG4gICAgcmVuZGVyZXI6IFJlbmRlcmVyMyB8IFByb2NlZHVyYWxSZW5kZXJlcjMgfCBudWxsLCBkYXRhOiBMU3R5bGluZ0RhdGEsIGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCxcbiAgICBlbGVtZW50OiBSRWxlbWVudCwgZGlyZWN0aXZlSW5kZXg6IG51bWJlciwgc2FuaXRpemVyOiBTdHlsZVNhbml0aXplRm4gfCBudWxsKTogYm9vbGVhbiB7XG4gIGxldCBzdHlsZXNGbHVzaGVkID0gZmFsc2U7XG4gIGlmIChhbGxvd1N0eWxpbmdGbHVzaChjb250ZXh0LCBkaXJlY3RpdmVJbmRleCkpIHtcbiAgICBjb25zdCBpc0ZpcnN0UGFzcyA9ICFpc0NvbnRleHRMb2NrZWQoY29udGV4dCk7XG4gICAgaXNGaXJzdFBhc3MgJiYgbG9ja0NvbnRleHQoY29udGV4dCk7XG4gICAgaWYgKHN0eWxlc0JpdE1hc2spIHtcbiAgICAgIGFwcGx5U3R5bGluZyhjb250ZXh0LCByZW5kZXJlciwgZWxlbWVudCwgZGF0YSwgc3R5bGVzQml0TWFzaywgc2V0U3R5bGUsIHNhbml0aXplcik7XG4gICAgICBzdHlsZXNCaXRNYXNrID0gMDtcbiAgICAgIHN0eWxlc0ZsdXNoZWQgPSB0cnVlO1xuICAgIH1cbiAgICBjdXJyZW50U3R5bGVJbmRleCA9IFNUWUxJTkdfSU5ERVhfU1RBUlRfVkFMVUU7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgcmV0dXJuIHN0eWxlc0ZsdXNoZWQ7XG59XG5cbi8qKlxuICogUnVucyB0aHJvdWdoIHRoZSBwcm92aWRlZCBzdHlsaW5nIGNvbnRleHQgYW5kIGFwcGxpZXMgZWFjaCB2YWx1ZSB0b1xuICogdGhlIHByb3ZpZGVkIGVsZW1lbnQgKHZpYSB0aGUgcmVuZGVyZXIpIGlmIG9uZSBvciBtb3JlIHZhbHVlcyBhcmUgcHJlc2VudC5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIHdpbGwgaXRlcmF0ZSBvdmVyIGFsbCBlbnRyaWVzIHByZXNlbnQgaW4gdGhlIHByb3ZpZGVkXG4gKiBgVFN0eWxpbmdDb250ZXh0YCBhcnJheSAoYm90aCBwcm9wLWJhc2VkIGFuZCBtYXAtYmFzZWQgYmluZGluZ3MpLi1cbiAqXG4gKiBFYWNoIGVudHJ5LCB3aXRoaW4gdGhlIGBUU3R5bGluZ0NvbnRleHRgIGFycmF5LCBpcyBzdG9yZWQgYWxwaGFiZXRpY2FsbHlcbiAqIGFuZCB0aGlzIG1lYW5zIHRoYXQgZWFjaCBwcm9wL3ZhbHVlIGVudHJ5IHdpbGwgYmUgYXBwbGllZCBpbiBvcmRlclxuICogKHNvIGxvbmcgYXMgaXQgaXMgbWFya2VkIGRpcnR5IGluIHRoZSBwcm92aWRlZCBgYml0TWFza2AgdmFsdWUpLlxuICpcbiAqIElmIHRoZXJlIGFyZSBhbnkgbWFwLWJhc2VkIGVudHJpZXMgcHJlc2VudCAod2hpY2ggYXJlIGFwcGxpZWQgdG8gdGhlXG4gKiBlbGVtZW50IHZpYSB0aGUgYFtzdHlsZV1gIGFuZCBgW2NsYXNzXWAgYmluZGluZ3MpIHRoZW4gdGhvc2UgZW50cmllc1xuICogd2lsbCBiZSBhcHBsaWVkIGFzIHdlbGwuIEhvd2V2ZXIsIHRoZSBjb2RlIGZvciB0aGF0IGlzIG5vdCBhcGFydCBvZlxuICogdGhpcyBmdW5jdGlvbi4gSW5zdGVhZCwgZWFjaCB0aW1lIGEgcHJvcGVydHkgaXMgdmlzaXRlZCwgdGhlbiB0aGVcbiAqIGNvZGUgYmVsb3cgd2lsbCBjYWxsIGFuIGV4dGVybmFsIGZ1bmN0aW9uIGNhbGxlZCBgc3R5bGluZ01hcHNTeW5jRm5gXG4gKiBhbmQsIGlmIHByZXNlbnQsIGl0IHdpbGwga2VlcCB0aGUgYXBwbGljYXRpb24gb2Ygc3R5bGluZyB2YWx1ZXMgaW5cbiAqIG1hcC1iYXNlZCBiaW5kaW5ncyB1cCB0byBzeW5jIHdpdGggdGhlIGFwcGxpY2F0aW9uIG9mIHByb3AtYmFzZWRcbiAqIGJpbmRpbmdzLlxuICpcbiAqIFZpc2l0IGBzdHlsaW5nX25leHQvbWFwX2Jhc2VkX2JpbmRpbmdzLnRzYCB0byBsZWFybiBtb3JlIGFib3V0IGhvdyB0aGVcbiAqIGFsZ29yaXRobSB3b3JrcyBmb3IgbWFwLWJhc2VkIHN0eWxpbmcgYmluZGluZ3MuXG4gKlxuICogTm90ZSB0aGF0IHRoaXMgZnVuY3Rpb24gaXMgbm90IGRlc2lnbmVkIHRvIGJlIGNhbGxlZCBpbiBpc29sYXRpb24gKHVzZVxuICogYGFwcGx5Q2xhc3Nlc2AgYW5kIGBhcHBseVN0eWxlc2AgdG8gYWN0dWFsbHkgYXBwbHkgc3R5bGluZyB2YWx1ZXMpLlxuICovXG5leHBvcnQgZnVuY3Rpb24gYXBwbHlTdHlsaW5nKFxuICAgIGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCwgcmVuZGVyZXI6IFJlbmRlcmVyMyB8IFByb2NlZHVyYWxSZW5kZXJlcjMgfCBudWxsLCBlbGVtZW50OiBSRWxlbWVudCxcbiAgICBiaW5kaW5nRGF0YTogTFN0eWxpbmdEYXRhLCBiaXRNYXNrVmFsdWU6IG51bWJlciB8IGJvb2xlYW4sIGFwcGx5U3R5bGluZ0ZuOiBBcHBseVN0eWxpbmdGbixcbiAgICBzYW5pdGl6ZXI6IFN0eWxlU2FuaXRpemVGbiB8IG51bGwpIHtcbiAgZGVmZXJyZWRCaW5kaW5nUXVldWUubGVuZ3RoICYmIGZsdXNoRGVmZXJyZWRCaW5kaW5ncygpO1xuXG4gIGNvbnN0IGJpdE1hc2sgPSBub3JtYWxpemVCaXRNYXNrVmFsdWUoYml0TWFza1ZhbHVlKTtcbiAgY29uc3Qgc3R5bGluZ01hcHNTeW5jRm4gPSBnZXRTdHlsaW5nTWFwc1N5bmNGbigpO1xuICBjb25zdCBtYXBzR3VhcmRNYXNrID0gZ2V0R3VhcmRNYXNrKGNvbnRleHQsIFRTdHlsaW5nQ29udGV4dEluZGV4Lk1hcEJpbmRpbmdzUG9zaXRpb24pO1xuICBjb25zdCBhcHBseUFsbFZhbHVlcyA9IChiaXRNYXNrICYgbWFwc0d1YXJkTWFzaykgPiAwO1xuICBjb25zdCBtYXBzTW9kZSA9XG4gICAgICBhcHBseUFsbFZhbHVlcyA/IFN0eWxpbmdNYXBzU3luY01vZGUuQXBwbHlBbGxWYWx1ZXMgOiBTdHlsaW5nTWFwc1N5bmNNb2RlLlRyYXZlcnNlVmFsdWVzO1xuXG4gIGxldCBpID0gZ2V0UHJvcFZhbHVlc1N0YXJ0UG9zaXRpb24oY29udGV4dCk7XG4gIHdoaWxlIChpIDwgY29udGV4dC5sZW5ndGgpIHtcbiAgICBjb25zdCB2YWx1ZXNDb3VudCA9IGdldFZhbHVlc0NvdW50KGNvbnRleHQsIGkpO1xuICAgIGNvbnN0IGd1YXJkTWFzayA9IGdldEd1YXJkTWFzayhjb250ZXh0LCBpKTtcbiAgICBpZiAoYml0TWFzayAmIGd1YXJkTWFzaykge1xuICAgICAgbGV0IHZhbHVlQXBwbGllZCA9IGZhbHNlO1xuICAgICAgY29uc3QgcHJvcCA9IGdldFByb3AoY29udGV4dCwgaSk7XG4gICAgICBjb25zdCB2YWx1ZXNDb3VudFVwVG9EZWZhdWx0ID0gdmFsdWVzQ291bnQgLSAxO1xuICAgICAgY29uc3QgZGVmYXVsdFZhbHVlID0gZ2V0QmluZGluZ1ZhbHVlKGNvbnRleHQsIGksIHZhbHVlc0NvdW50VXBUb0RlZmF1bHQpIGFzIHN0cmluZyB8IG51bGw7XG5cbiAgICAgIC8vIGNhc2UgMTogYXBwbHkgcHJvcC1iYXNlZCB2YWx1ZXNcbiAgICAgIC8vIHRyeSB0byBhcHBseSB0aGUgYmluZGluZyB2YWx1ZXMgYW5kIHNlZSBpZiBhIG5vbi1udWxsXG4gICAgICAvLyB2YWx1ZSBnZXRzIHNldCBmb3IgdGhlIHN0eWxpbmcgYmluZGluZ1xuICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCB2YWx1ZXNDb3VudFVwVG9EZWZhdWx0OyBqKyspIHtcbiAgICAgICAgY29uc3QgYmluZGluZ0luZGV4ID0gZ2V0QmluZGluZ1ZhbHVlKGNvbnRleHQsIGksIGopIGFzIG51bWJlcjtcbiAgICAgICAgY29uc3QgdmFsdWUgPSBiaW5kaW5nRGF0YVtiaW5kaW5nSW5kZXhdO1xuICAgICAgICBpZiAoaXNTdHlsaW5nVmFsdWVEZWZpbmVkKHZhbHVlKSkge1xuICAgICAgICAgIGNvbnN0IGZpbmFsVmFsdWUgPSBzYW5pdGl6ZXIgJiYgaXNTYW5pdGl6YXRpb25SZXF1aXJlZChjb250ZXh0LCBpKSA/XG4gICAgICAgICAgICAgIHNhbml0aXplcihwcm9wLCB2YWx1ZSwgU3R5bGVTYW5pdGl6ZU1vZGUuU2FuaXRpemVPbmx5KSA6XG4gICAgICAgICAgICAgIHZhbHVlO1xuICAgICAgICAgIGFwcGx5U3R5bGluZ0ZuKHJlbmRlcmVyLCBlbGVtZW50LCBwcm9wLCBmaW5hbFZhbHVlLCBiaW5kaW5nSW5kZXgpO1xuICAgICAgICAgIHZhbHVlQXBwbGllZCA9IHRydWU7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gY2FzZSAyOiBhcHBseSBtYXAtYmFzZWQgdmFsdWVzXG4gICAgICAvLyB0cmF2ZXJzZSB0aHJvdWdoIGVhY2ggbWFwLWJhc2VkIHN0eWxpbmcgYmluZGluZyBhbmQgdXBkYXRlIGFsbCB2YWx1ZXMgdXAgdG9cbiAgICAgIC8vIHRoZSBwcm92aWRlZCBgcHJvcGAgdmFsdWUuIElmIHRoZSBwcm9wZXJ0eSB3YXMgbm90IGFwcGxpZWQgaW4gdGhlIGxvb3AgYWJvdmVcbiAgICAgIC8vIHRoZW4gaXQgd2lsbCBiZSBhdHRlbXB0ZWQgdG8gYmUgYXBwbGllZCBpbiB0aGUgbWFwcyBzeW5jIGNvZGUgYmVsb3cuXG4gICAgICBpZiAoc3R5bGluZ01hcHNTeW5jRm4pIHtcbiAgICAgICAgLy8gZGV0ZXJtaW5lIHdoZXRoZXIgb3Igbm90IHRvIGFwcGx5IHRoZSB0YXJnZXQgcHJvcGVydHkgb3IgdG8gc2tpcCBpdFxuICAgICAgICBjb25zdCBtb2RlID0gbWFwc01vZGUgfCAodmFsdWVBcHBsaWVkID8gU3R5bGluZ01hcHNTeW5jTW9kZS5Ta2lwVGFyZ2V0UHJvcCA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBTdHlsaW5nTWFwc1N5bmNNb2RlLkFwcGx5VGFyZ2V0UHJvcCk7XG4gICAgICAgIGNvbnN0IHZhbHVlQXBwbGllZFdpdGhpbk1hcCA9IHN0eWxpbmdNYXBzU3luY0ZuKFxuICAgICAgICAgICAgY29udGV4dCwgcmVuZGVyZXIsIGVsZW1lbnQsIGJpbmRpbmdEYXRhLCBhcHBseVN0eWxpbmdGbiwgc2FuaXRpemVyLCBtb2RlLCBwcm9wLFxuICAgICAgICAgICAgZGVmYXVsdFZhbHVlKTtcbiAgICAgICAgdmFsdWVBcHBsaWVkID0gdmFsdWVBcHBsaWVkIHx8IHZhbHVlQXBwbGllZFdpdGhpbk1hcDtcbiAgICAgIH1cblxuICAgICAgLy8gY2FzZSAzOiBhcHBseSB0aGUgZGVmYXVsdCB2YWx1ZVxuICAgICAgLy8gaWYgdGhlIHZhbHVlIGhhcyBub3QgeWV0IGJlZW4gYXBwbGllZCB0aGVuIGEgdHJ1dGh5IHZhbHVlIGRvZXMgbm90IGV4aXN0IGluIHRoZVxuICAgICAgLy8gcHJvcC1iYXNlZCBvciBtYXAtYmFzZWQgYmluZGluZ3MgY29kZS4gSWYgYW5kIHdoZW4gdGhpcyBoYXBwZW5zLCBqdXN0IGFwcGx5IHRoZVxuICAgICAgLy8gZGVmYXVsdCB2YWx1ZSAoZXZlbiBpZiB0aGUgZGVmYXVsdCB2YWx1ZSBpcyBgbnVsbGApLlxuICAgICAgaWYgKCF2YWx1ZUFwcGxpZWQpIHtcbiAgICAgICAgYXBwbHlTdHlsaW5nRm4ocmVuZGVyZXIsIGVsZW1lbnQsIHByb3AsIGRlZmF1bHRWYWx1ZSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaSArPSBUU3R5bGluZ0NvbnRleHRJbmRleC5CaW5kaW5nc1N0YXJ0T2Zmc2V0ICsgdmFsdWVzQ291bnQ7XG4gIH1cblxuICAvLyB0aGUgbWFwLWJhc2VkIHN0eWxpbmcgZW50cmllcyBtYXkgaGF2ZSBub3QgYXBwbGllZCBhbGwgdGhlaXJcbiAgLy8gdmFsdWVzLiBGb3IgdGhpcyByZWFzb24sIG9uZSBtb3JlIGNhbGwgdG8gdGhlIHN5bmMgZnVuY3Rpb25cbiAgLy8gbmVlZHMgdG8gYmUgaXNzdWVkIGF0IHRoZSBlbmQuXG4gIGlmIChzdHlsaW5nTWFwc1N5bmNGbikge1xuICAgIHN0eWxpbmdNYXBzU3luY0ZuKGNvbnRleHQsIHJlbmRlcmVyLCBlbGVtZW50LCBiaW5kaW5nRGF0YSwgYXBwbHlTdHlsaW5nRm4sIHNhbml0aXplciwgbWFwc01vZGUpO1xuICB9XG59XG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZUJpdE1hc2tWYWx1ZSh2YWx1ZTogbnVtYmVyIHwgYm9vbGVhbik6IG51bWJlciB7XG4gIC8vIGlmIHBhc3MgPT4gYXBwbHkgYWxsIHZhbHVlcyAoLTEgaW1wbGllcyB0aGF0IGFsbCBiaXRzIGFyZSBmbGlwcGVkIHRvIHRydWUpXG4gIGlmICh2YWx1ZSA9PT0gdHJ1ZSkgcmV0dXJuIC0xO1xuXG4gIC8vIGlmIHBhc3MgPT4gc2tpcCBhbGwgdmFsdWVzXG4gIGlmICh2YWx1ZSA9PT0gZmFsc2UpIHJldHVybiAwO1xuXG4gIC8vIHJldHVybiB0aGUgYml0IG1hc2sgdmFsdWUgYXMgaXNcbiAgcmV0dXJuIHZhbHVlO1xufVxuXG5sZXQgX2FjdGl2ZVN0eWxpbmdNYXBBcHBseUZuOiBTeW5jU3R5bGluZ01hcHNGbnxudWxsID0gbnVsbDtcbmV4cG9ydCBmdW5jdGlvbiBnZXRTdHlsaW5nTWFwc1N5bmNGbigpIHtcbiAgcmV0dXJuIF9hY3RpdmVTdHlsaW5nTWFwQXBwbHlGbjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNldFN0eWxpbmdNYXBzU3luY0ZuKGZuOiBTeW5jU3R5bGluZ01hcHNGbikge1xuICBfYWN0aXZlU3R5bGluZ01hcEFwcGx5Rm4gPSBmbjtcbn1cblxuLyoqXG4gKiBBc3NpZ25zIGEgc3R5bGUgdmFsdWUgdG8gYSBzdHlsZSBwcm9wZXJ0eSBmb3IgdGhlIGdpdmVuIGVsZW1lbnQuXG4gKi9cbmNvbnN0IHNldFN0eWxlOiBBcHBseVN0eWxpbmdGbiA9XG4gICAgKHJlbmRlcmVyOiBSZW5kZXJlcjMgfCBudWxsLCBuYXRpdmU6IGFueSwgcHJvcDogc3RyaW5nLCB2YWx1ZTogc3RyaW5nIHwgbnVsbCkgPT4ge1xuICAgICAgaWYgKHZhbHVlKSB7XG4gICAgICAgIC8vIG9wYWNpdHksIHotaW5kZXggYW5kIGZsZXhib3ggYWxsIGhhdmUgbnVtYmVyIHZhbHVlc1xuICAgICAgICAvLyBhbmQgdGhlc2UgbmVlZCB0byBiZSBjb252ZXJ0ZWQgaW50byBzdHJpbmdzIHNvIHRoYXRcbiAgICAgICAgLy8gdGhleSBjYW4gYmUgYXNzaWduZWQgcHJvcGVybHkuXG4gICAgICAgIHZhbHVlID0gdmFsdWUudG9TdHJpbmcoKTtcbiAgICAgICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlclNldFN0eWxlKys7XG4gICAgICAgIHJlbmRlcmVyICYmIGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSA/XG4gICAgICAgICAgICByZW5kZXJlci5zZXRTdHlsZShuYXRpdmUsIHByb3AsIHZhbHVlLCBSZW5kZXJlclN0eWxlRmxhZ3MzLkRhc2hDYXNlKSA6XG4gICAgICAgICAgICBuYXRpdmUuc3R5bGUuc2V0UHJvcGVydHkocHJvcCwgdmFsdWUpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlclJlbW92ZVN0eWxlKys7XG4gICAgICAgIHJlbmRlcmVyICYmIGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSA/XG4gICAgICAgICAgICByZW5kZXJlci5yZW1vdmVTdHlsZShuYXRpdmUsIHByb3AsIFJlbmRlcmVyU3R5bGVGbGFnczMuRGFzaENhc2UpIDpcbiAgICAgICAgICAgIG5hdGl2ZS5zdHlsZS5yZW1vdmVQcm9wZXJ0eShwcm9wKTtcbiAgICAgIH1cbiAgICB9O1xuXG4vKipcbiAqIEFkZHMvcmVtb3ZlcyB0aGUgcHJvdmlkZWQgY2xhc3NOYW1lIHZhbHVlIHRvIHRoZSBwcm92aWRlZCBlbGVtZW50LlxuICovXG5jb25zdCBzZXRDbGFzczogQXBwbHlTdHlsaW5nRm4gPVxuICAgIChyZW5kZXJlcjogUmVuZGVyZXIzIHwgbnVsbCwgbmF0aXZlOiBhbnksIGNsYXNzTmFtZTogc3RyaW5nLCB2YWx1ZTogYW55KSA9PiB7XG4gICAgICBpZiAoY2xhc3NOYW1lICE9PSAnJykge1xuICAgICAgICBpZiAodmFsdWUpIHtcbiAgICAgICAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyQWRkQ2xhc3MrKztcbiAgICAgICAgICByZW5kZXJlciAmJiBpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikgPyByZW5kZXJlci5hZGRDbGFzcyhuYXRpdmUsIGNsYXNzTmFtZSkgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hdGl2ZS5jbGFzc0xpc3QuYWRkKGNsYXNzTmFtZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlclJlbW92ZUNsYXNzKys7XG4gICAgICAgICAgcmVuZGVyZXIgJiYgaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpID8gcmVuZGVyZXIucmVtb3ZlQ2xhc3MobmF0aXZlLCBjbGFzc05hbWUpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYXRpdmUuY2xhc3NMaXN0LnJlbW92ZShjbGFzc05hbWUpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfTtcbiJdfQ==