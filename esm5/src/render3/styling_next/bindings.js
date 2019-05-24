/**
* @license
* Copyright Google Inc. All Rights Reserved.
*
* Use of this source code is governed by an MIT-style license that can be
* found in the LICENSE file at https://angular.io/license
*/
import { RendererStyleFlags3, isProceduralRenderer } from '../interfaces/renderer';
import { allowStylingFlush, getBindingValue, getGuardMask, getProp, getPropValuesStartPosition, getValuesCount, hasValueChanged, isContextLocked, isStylingValueDefined, lockContext } from './util';
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
    var updated = updateBindingData(context, data, index, prop, bindingIndex, value, deferRegistration, forceUpdate);
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
export function updateStyleBinding(context, data, prop, bindingIndex, value, deferRegistration, forceUpdate) {
    var isMapBased = !prop;
    var index = isMapBased ? STYLING_INDEX_FOR_MAP_BINDING : currentStyleIndex++;
    var updated = updateBindingData(context, data, index, prop, bindingIndex, value, deferRegistration, forceUpdate);
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
function updateBindingData(context, data, counterIndex, prop, bindingIndex, value, deferRegistration, forceUpdate) {
    if (!isContextLocked(context)) {
        if (deferRegistration) {
            deferBindingRegistration(context, counterIndex, prop, bindingIndex);
        }
        else {
            deferredBindingQueue.length && flushDeferredBindings();
            // this will only happen during the first update pass of the
            // context. The reason why we can't use `tNode.firstTemplatePass`
            // here is because its not guaranteed to be true when the first
            // update pass is executed (remember that all styling instructions
            // are run in the update phase, and, as a result, are no more
            // styling instructions that are run in the creation phase).
            registerBinding(context, counterIndex, prop, bindingIndex);
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
function deferBindingRegistration(context, counterIndex, prop, bindingIndex) {
    deferredBindingQueue.splice(0, 0, context, counterIndex, prop, bindingIndex);
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
        registerBinding(context, count, prop, bindingIndex);
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
export function registerBinding(context, countId, prop, bindingValue) {
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
                    allocateNewContextEntry(context, i, prop);
                }
                addBindingIntoContext(context, false, i, bindingValue, countId);
                break;
            }
            i += 3 /* BindingsStartOffset */ + valuesCount;
        }
        if (!found) {
            allocateNewContextEntry(context, context.length, prop);
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
function allocateNewContextEntry(context, index, prop) {
    // 1,2: splice index locations
    // 3: each entry gets a guard mask value that is used to check against updates
    // 4. each entry gets a size value (which is always one because there is always a default binding
    // value)
    // 5. the property that is getting allocated into the context
    // 6. the default binding value (usually `null`)
    context.splice(index, 0, DEFAULT_GUARD_MASK_VALUE, DEFAULT_SIZE_VALUE, prop, DEFAULT_BINDING_VALUE);
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
        context[index + 0 /* GuardOffset */] |= 1 << countId;
    }
    else if (typeof bindingValue === 'string' && context[lastValueIndex] == null) {
        context[lastValueIndex] = bindingValue;
    }
}
/**
 * Applies all class entries in the provided context to the provided element and resets
 * any counter and/or bitMask values associated with class bindings.
 */
export function applyClasses(renderer, data, context, element, directiveIndex) {
    if (allowStylingFlush(context, directiveIndex)) {
        var isFirstPass = !isContextLocked(context);
        isFirstPass && lockContext(context);
        if (classesBitMask) {
            applyStyling(context, renderer, element, data, classesBitMask, setClass);
            classesBitMask = 0;
        }
        currentClassIndex = STYLING_INDEX_START_VALUE;
    }
}
/**
 * Applies all style entries in the provided context to the provided element and resets
 * any counter and/or bitMask values associated with style bindings.
 */
export function applyStyles(renderer, data, context, element, directiveIndex) {
    if (allowStylingFlush(context, directiveIndex)) {
        var isFirstPass = !isContextLocked(context);
        isFirstPass && lockContext(context);
        if (stylesBitMask) {
            applyStyling(context, renderer, element, data, stylesBitMask, setStyle);
            stylesBitMask = 0;
        }
        currentStyleIndex = STYLING_INDEX_START_VALUE;
    }
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
export function applyStyling(context, renderer, element, bindingData, bitMaskValue, applyStylingFn) {
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
                var valueToApply = bindingData[bindingIndex];
                if (isStylingValueDefined(valueToApply)) {
                    applyStylingFn(renderer, element, prop, valueToApply, bindingIndex);
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
                var valueAppliedWithinMap = stylingMapsSyncFn(context, renderer, element, bindingData, applyStylingFn, mode, prop, defaultValue);
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
        stylingMapsSyncFn(context, renderer, element, bindingData, applyStylingFn, mapsMode);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmluZGluZ3MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL3N0eWxpbmdfbmV4dC9iaW5kaW5ncy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0VBTUU7QUFDRixPQUFPLEVBQTJDLG1CQUFtQixFQUFFLG9CQUFvQixFQUFDLE1BQU0sd0JBQXdCLENBQUM7QUFHM0gsT0FBTyxFQUFDLGlCQUFpQixFQUFFLGVBQWUsRUFBRSxZQUFZLEVBQUUsT0FBTyxFQUFFLDBCQUEwQixFQUFFLGNBQWMsRUFBRSxlQUFlLEVBQUUsZUFBZSxFQUFFLHFCQUFxQixFQUFFLFdBQVcsRUFBQyxNQUFNLFFBQVEsQ0FBQztBQUduTTs7Ozs7Ozs7Ozs7Ozs7Ozs7R0FpQkc7QUFFSCxJQUFNLHFCQUFxQixHQUFHLElBQUksQ0FBQztBQUNuQyxJQUFNLGtCQUFrQixHQUFHLENBQUMsQ0FBQztBQUU3QixnRUFBZ0U7QUFDaEUsa0VBQWtFO0FBQ2xFLGtFQUFrRTtBQUNsRSxpRUFBaUU7QUFDakUsMkJBQTJCO0FBQzNCLE1BQU0sQ0FBQyxJQUFNLHdCQUF3QixHQUFHLENBQUcsQ0FBQztBQUM1QyxJQUFNLDZCQUE2QixHQUFHLENBQUMsQ0FBQztBQUN4QyxJQUFNLHlCQUF5QixHQUFHLENBQUMsQ0FBQztBQUVwQyxvRUFBb0U7QUFDcEUscUVBQXFFO0FBQ3JFLDRDQUE0QztBQUM1QyxJQUFJLGlCQUFpQixHQUFHLHlCQUF5QixDQUFDO0FBQ2xELElBQUksaUJBQWlCLEdBQUcseUJBQXlCLENBQUM7QUFDbEQsSUFBSSxhQUFhLEdBQUcsQ0FBQyxDQUFDO0FBQ3RCLElBQUksY0FBYyxHQUFHLENBQUMsQ0FBQztBQUN2QixJQUFJLG9CQUFvQixHQUFpRCxFQUFFLENBQUM7QUFFNUU7Ozs7Ozs7OztHQVNHO0FBQ0gsTUFBTSxVQUFVLGtCQUFrQixDQUM5QixP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QVEsQ0FBQyxXQUFXLENBQUMsTUFBTSxFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUM7Z0JBQ3pDLE1BQU0sQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1NBQ2pGO0tBQ0Y7QUFDSCxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiogQGxpY2Vuc2VcbiogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4qXG4qIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4qIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiovXG5pbXBvcnQge1Byb2NlZHVyYWxSZW5kZXJlcjMsIFJFbGVtZW50LCBSZW5kZXJlcjMsIFJlbmRlcmVyU3R5bGVGbGFnczMsIGlzUHJvY2VkdXJhbFJlbmRlcmVyfSBmcm9tICcuLi9pbnRlcmZhY2VzL3JlbmRlcmVyJztcblxuaW1wb3J0IHtBcHBseVN0eWxpbmdGbiwgTFN0eWxpbmdEYXRhLCBMU3R5bGluZ01hcCwgU3R5bGluZ01hcHNTeW5jTW9kZSwgU3luY1N0eWxpbmdNYXBzRm4sIFRTdHlsaW5nQ29udGV4dCwgVFN0eWxpbmdDb250ZXh0SW5kZXh9IGZyb20gJy4vaW50ZXJmYWNlcyc7XG5pbXBvcnQge2FsbG93U3R5bGluZ0ZsdXNoLCBnZXRCaW5kaW5nVmFsdWUsIGdldEd1YXJkTWFzaywgZ2V0UHJvcCwgZ2V0UHJvcFZhbHVlc1N0YXJ0UG9zaXRpb24sIGdldFZhbHVlc0NvdW50LCBoYXNWYWx1ZUNoYW5nZWQsIGlzQ29udGV4dExvY2tlZCwgaXNTdHlsaW5nVmFsdWVEZWZpbmVkLCBsb2NrQ29udGV4dH0gZnJvbSAnLi91dGlsJztcblxuXG4vKipcbiAqIC0tLS0tLS0tXG4gKlxuICogVGhpcyBmaWxlIGNvbnRhaW5zIHRoZSBjb3JlIGxvZ2ljIGZvciBzdHlsaW5nIGluIEFuZ3VsYXIuXG4gKlxuICogQWxsIHN0eWxpbmcgYmluZGluZ3MgKGkuZS4gYFtzdHlsZV1gLCBgW3N0eWxlLnByb3BdYCwgYFtjbGFzc11gIGFuZCBgW2NsYXNzLm5hbWVdYClcbiAqIHdpbGwgaGF2ZSB0aGVpciB2YWx1ZXMgYmUgYXBwbGllZCB0aHJvdWdoIHRoZSBsb2dpYyBpbiB0aGlzIGZpbGUuXG4gKlxuICogV2hlbiBhIGJpbmRpbmcgaXMgZW5jb3VudGVyZWQgKGUuZy4gYDxkaXYgW3N0eWxlLndpZHRoXT1cIndcIj5gKSB0aGVuXG4gKiB0aGUgYmluZGluZyBkYXRhIHdpbGwgYmUgcG9wdWxhdGVkIGludG8gYSBgVFN0eWxpbmdDb250ZXh0YCBkYXRhLXN0cnVjdHVyZS5cbiAqIFRoZXJlIGlzIG9ubHkgb25lIGBUU3R5bGluZ0NvbnRleHRgIHBlciBgVE5vZGVgIGFuZCBlYWNoIGVsZW1lbnQgaW5zdGFuY2VcbiAqIHdpbGwgdXBkYXRlIGl0cyBzdHlsZS9jbGFzcyBiaW5kaW5nIHZhbHVlcyBpbiBjb25jZXJ0IHdpdGggdGhlIHN0eWxpbmdcbiAqIGNvbnRleHQuXG4gKlxuICogVG8gbGVhcm4gbW9yZSBhYm91dCB0aGUgYWxnb3JpdGhtIHNlZSBgVFN0eWxpbmdDb250ZXh0YC5cbiAqXG4gKiAtLS0tLS0tLVxuICovXG5cbmNvbnN0IERFRkFVTFRfQklORElOR19WQUxVRSA9IG51bGw7XG5jb25zdCBERUZBVUxUX1NJWkVfVkFMVUUgPSAxO1xuXG4vLyBUaGUgZmlyc3QgYml0IHZhbHVlIHJlZmxlY3RzIGEgbWFwLWJhc2VkIGJpbmRpbmcgdmFsdWUncyBiaXQuXG4vLyBUaGUgcmVhc29uIHdoeSBpdCdzIGFsd2F5cyBhY3RpdmF0ZWQgZm9yIGV2ZXJ5IGVudHJ5IGluIHRoZSBtYXBcbi8vIGlzIHNvIHRoYXQgaWYgYW55IG1hcC1iaW5kaW5nIHZhbHVlcyB1cGRhdGUgdGhlbiBhbGwgb3RoZXIgcHJvcFxuLy8gYmFzZWQgYmluZGluZ3Mgd2lsbCBwYXNzIHRoZSBndWFyZCBjaGVjayBhdXRvbWF0aWNhbGx5IHdpdGhvdXRcbi8vIGFueSBleHRyYSBjb2RlIG9yIGZsYWdzLlxuZXhwb3J0IGNvbnN0IERFRkFVTFRfR1VBUkRfTUFTS19WQUxVRSA9IDBiMTtcbmNvbnN0IFNUWUxJTkdfSU5ERVhfRk9SX01BUF9CSU5ESU5HID0gMDtcbmNvbnN0IFNUWUxJTkdfSU5ERVhfU1RBUlRfVkFMVUUgPSAxO1xuXG4vLyB0aGUgdmFsdWVzIGJlbG93IGFyZSBnbG9iYWwgdG8gYWxsIHN0eWxpbmcgY29kZSBiZWxvdy4gRWFjaCB2YWx1ZVxuLy8gd2lsbCBlaXRoZXIgaW5jcmVtZW50IG9yIG11dGF0ZSBlYWNoIHRpbWUgYSBzdHlsaW5nIGluc3RydWN0aW9uIGlzXG4vLyBleGVjdXRlZC4gRG8gbm90IG1vZGlmeSB0aGUgdmFsdWVzIGJlbG93LlxubGV0IGN1cnJlbnRTdHlsZUluZGV4ID0gU1RZTElOR19JTkRFWF9TVEFSVF9WQUxVRTtcbmxldCBjdXJyZW50Q2xhc3NJbmRleCA9IFNUWUxJTkdfSU5ERVhfU1RBUlRfVkFMVUU7XG5sZXQgc3R5bGVzQml0TWFzayA9IDA7XG5sZXQgY2xhc3Nlc0JpdE1hc2sgPSAwO1xubGV0IGRlZmVycmVkQmluZGluZ1F1ZXVlOiAoVFN0eWxpbmdDb250ZXh0IHwgbnVtYmVyIHwgc3RyaW5nIHwgbnVsbClbXSA9IFtdO1xuXG4vKipcbiAqIFZpc2l0cyBhIGNsYXNzLWJhc2VkIGJpbmRpbmcgYW5kIHVwZGF0ZXMgdGhlIG5ldyB2YWx1ZSAoaWYgY2hhbmdlZCkuXG4gKlxuICogVGhpcyBmdW5jdGlvbiBpcyBjYWxsZWQgZWFjaCB0aW1lIGEgY2xhc3MtYmFzZWQgc3R5bGluZyBpbnN0cnVjdGlvblxuICogaXMgZXhlY3V0ZWQuIEl0J3MgaW1wb3J0YW50IHRoYXQgaXQncyBhbHdheXMgY2FsbGVkIChldmVuIGlmIHRoZSB2YWx1ZVxuICogaGFzIG5vdCBjaGFuZ2VkKSBzbyB0aGF0IHRoZSBpbm5lciBjb3VudGVyIGluZGV4IHZhbHVlIGlzIGluY3JlbWVudGVkLlxuICogVGhpcyB3YXksIGVhY2ggaW5zdHJ1Y3Rpb24gaXMgYWx3YXlzIGd1YXJhbnRlZWQgdG8gZ2V0IHRoZSBzYW1lIGNvdW50ZXJcbiAqIHN0YXRlIGVhY2ggdGltZSBpdCdzIGNhbGxlZCAod2hpY2ggdGhlbiBhbGxvd3MgdGhlIGBUU3R5bGluZ0NvbnRleHRgXG4gKiBhbmQgdGhlIGJpdCBtYXNrIHZhbHVlcyB0byBiZSBpbiBzeW5jKS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHVwZGF0ZUNsYXNzQmluZGluZyhcbiAgICBjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQsIGRhdGE6IExTdHlsaW5nRGF0YSwgcHJvcDogc3RyaW5nIHwgbnVsbCwgYmluZGluZ0luZGV4OiBudW1iZXIsXG4gICAgdmFsdWU6IGJvb2xlYW4gfCBzdHJpbmcgfCBudWxsIHwgdW5kZWZpbmVkIHwgTFN0eWxpbmdNYXAsIGRlZmVyUmVnaXN0cmF0aW9uOiBib29sZWFuLFxuICAgIGZvcmNlVXBkYXRlPzogYm9vbGVhbik6IHZvaWQge1xuICBjb25zdCBpc01hcEJhc2VkID0gIXByb3A7XG4gIGNvbnN0IGluZGV4ID0gaXNNYXBCYXNlZCA/IFNUWUxJTkdfSU5ERVhfRk9SX01BUF9CSU5ESU5HIDogY3VycmVudENsYXNzSW5kZXgrKztcbiAgY29uc3QgdXBkYXRlZCA9IHVwZGF0ZUJpbmRpbmdEYXRhKFxuICAgICAgY29udGV4dCwgZGF0YSwgaW5kZXgsIHByb3AsIGJpbmRpbmdJbmRleCwgdmFsdWUsIGRlZmVyUmVnaXN0cmF0aW9uLCBmb3JjZVVwZGF0ZSk7XG4gIGlmICh1cGRhdGVkIHx8IGZvcmNlVXBkYXRlKSB7XG4gICAgY2xhc3Nlc0JpdE1hc2sgfD0gMSA8PCBpbmRleDtcbiAgfVxufVxuXG4vKipcbiAqIFZpc2l0cyBhIHN0eWxlLWJhc2VkIGJpbmRpbmcgYW5kIHVwZGF0ZXMgdGhlIG5ldyB2YWx1ZSAoaWYgY2hhbmdlZCkuXG4gKlxuICogVGhpcyBmdW5jdGlvbiBpcyBjYWxsZWQgZWFjaCB0aW1lIGEgc3R5bGUtYmFzZWQgc3R5bGluZyBpbnN0cnVjdGlvblxuICogaXMgZXhlY3V0ZWQuIEl0J3MgaW1wb3J0YW50IHRoYXQgaXQncyBhbHdheXMgY2FsbGVkIChldmVuIGlmIHRoZSB2YWx1ZVxuICogaGFzIG5vdCBjaGFuZ2VkKSBzbyB0aGF0IHRoZSBpbm5lciBjb3VudGVyIGluZGV4IHZhbHVlIGlzIGluY3JlbWVudGVkLlxuICogVGhpcyB3YXksIGVhY2ggaW5zdHJ1Y3Rpb24gaXMgYWx3YXlzIGd1YXJhbnRlZWQgdG8gZ2V0IHRoZSBzYW1lIGNvdW50ZXJcbiAqIHN0YXRlIGVhY2ggdGltZSBpdCdzIGNhbGxlZCAod2hpY2ggdGhlbiBhbGxvd3MgdGhlIGBUU3R5bGluZ0NvbnRleHRgXG4gKiBhbmQgdGhlIGJpdCBtYXNrIHZhbHVlcyB0byBiZSBpbiBzeW5jKS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHVwZGF0ZVN0eWxlQmluZGluZyhcbiAgICBjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQsIGRhdGE6IExTdHlsaW5nRGF0YSwgcHJvcDogc3RyaW5nIHwgbnVsbCwgYmluZGluZ0luZGV4OiBudW1iZXIsXG4gICAgdmFsdWU6IFN0cmluZyB8IHN0cmluZyB8IG51bWJlciB8IG51bGwgfCB1bmRlZmluZWQgfCBMU3R5bGluZ01hcCwgZGVmZXJSZWdpc3RyYXRpb246IGJvb2xlYW4sXG4gICAgZm9yY2VVcGRhdGU/OiBib29sZWFuKTogdm9pZCB7XG4gIGNvbnN0IGlzTWFwQmFzZWQgPSAhcHJvcDtcbiAgY29uc3QgaW5kZXggPSBpc01hcEJhc2VkID8gU1RZTElOR19JTkRFWF9GT1JfTUFQX0JJTkRJTkcgOiBjdXJyZW50U3R5bGVJbmRleCsrO1xuICBjb25zdCB1cGRhdGVkID0gdXBkYXRlQmluZGluZ0RhdGEoXG4gICAgICBjb250ZXh0LCBkYXRhLCBpbmRleCwgcHJvcCwgYmluZGluZ0luZGV4LCB2YWx1ZSwgZGVmZXJSZWdpc3RyYXRpb24sIGZvcmNlVXBkYXRlKTtcbiAgaWYgKHVwZGF0ZWQgfHwgZm9yY2VVcGRhdGUpIHtcbiAgICBzdHlsZXNCaXRNYXNrIHw9IDEgPDwgaW5kZXg7XG4gIH1cbn1cblxuLyoqXG4gKiBDYWxsZWQgZWFjaCB0aW1lIGEgYmluZGluZyB2YWx1ZSBoYXMgY2hhbmdlZCB3aXRoaW4gdGhlIHByb3ZpZGVkIGBUU3R5bGluZ0NvbnRleHRgLlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gaXMgZGVzaWduZWQgdG8gYmUgY2FsbGVkIGZyb20gYHVwZGF0ZVN0eWxlQmluZGluZ2AgYW5kIGB1cGRhdGVDbGFzc0JpbmRpbmdgLlxuICogSWYgY2FsbGVkIGR1cmluZyB0aGUgZmlyc3QgdXBkYXRlIHBhc3MsIHRoZSBiaW5kaW5nIHdpbGwgYmUgcmVnaXN0ZXJlZCBpbiB0aGUgY29udGV4dC5cbiAqIElmIHRoZSBiaW5kaW5nIGRvZXMgZ2V0IHJlZ2lzdGVyZWQgYW5kIHRoZSBgZGVmZXJSZWdpc3RyYXRpb25gIGZsYWcgaXMgdHJ1ZSB0aGVuIHRoZVxuICogYmluZGluZyBkYXRhIHdpbGwgYmUgcXVldWVkIHVwIHVudGlsIHRoZSBjb250ZXh0IGlzIGxhdGVyIGZsdXNoZWQgaW4gYGFwcGx5U3R5bGluZ2AuXG4gKlxuICogVGhpcyBmdW5jdGlvbiB3aWxsIGFsc28gdXBkYXRlIGJpbmRpbmcgc2xvdCBpbiB0aGUgcHJvdmlkZWQgYExTdHlsaW5nRGF0YWAgd2l0aCB0aGVcbiAqIG5ldyBiaW5kaW5nIGVudHJ5IChpZiBpdCBoYXMgY2hhbmdlZCkuXG4gKlxuICogQHJldHVybnMgd2hldGhlciBvciBub3QgdGhlIGJpbmRpbmcgdmFsdWUgd2FzIHVwZGF0ZWQgaW4gdGhlIGBMU3R5bGluZ0RhdGFgLlxuICovXG5mdW5jdGlvbiB1cGRhdGVCaW5kaW5nRGF0YShcbiAgICBjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQsIGRhdGE6IExTdHlsaW5nRGF0YSwgY291bnRlckluZGV4OiBudW1iZXIsIHByb3A6IHN0cmluZyB8IG51bGwsXG4gICAgYmluZGluZ0luZGV4OiBudW1iZXIsXG4gICAgdmFsdWU6IHN0cmluZyB8IFN0cmluZyB8IG51bWJlciB8IGJvb2xlYW4gfCBudWxsIHwgdW5kZWZpbmVkIHwgTFN0eWxpbmdNYXAsXG4gICAgZGVmZXJSZWdpc3RyYXRpb24/OiBib29sZWFuLCBmb3JjZVVwZGF0ZT86IGJvb2xlYW4pOiBib29sZWFuIHtcbiAgaWYgKCFpc0NvbnRleHRMb2NrZWQoY29udGV4dCkpIHtcbiAgICBpZiAoZGVmZXJSZWdpc3RyYXRpb24pIHtcbiAgICAgIGRlZmVyQmluZGluZ1JlZ2lzdHJhdGlvbihjb250ZXh0LCBjb3VudGVySW5kZXgsIHByb3AsIGJpbmRpbmdJbmRleCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGRlZmVycmVkQmluZGluZ1F1ZXVlLmxlbmd0aCAmJiBmbHVzaERlZmVycmVkQmluZGluZ3MoKTtcblxuICAgICAgLy8gdGhpcyB3aWxsIG9ubHkgaGFwcGVuIGR1cmluZyB0aGUgZmlyc3QgdXBkYXRlIHBhc3Mgb2YgdGhlXG4gICAgICAvLyBjb250ZXh0LiBUaGUgcmVhc29uIHdoeSB3ZSBjYW4ndCB1c2UgYHROb2RlLmZpcnN0VGVtcGxhdGVQYXNzYFxuICAgICAgLy8gaGVyZSBpcyBiZWNhdXNlIGl0cyBub3QgZ3VhcmFudGVlZCB0byBiZSB0cnVlIHdoZW4gdGhlIGZpcnN0XG4gICAgICAvLyB1cGRhdGUgcGFzcyBpcyBleGVjdXRlZCAocmVtZW1iZXIgdGhhdCBhbGwgc3R5bGluZyBpbnN0cnVjdGlvbnNcbiAgICAgIC8vIGFyZSBydW4gaW4gdGhlIHVwZGF0ZSBwaGFzZSwgYW5kLCBhcyBhIHJlc3VsdCwgYXJlIG5vIG1vcmVcbiAgICAgIC8vIHN0eWxpbmcgaW5zdHJ1Y3Rpb25zIHRoYXQgYXJlIHJ1biBpbiB0aGUgY3JlYXRpb24gcGhhc2UpLlxuICAgICAgcmVnaXN0ZXJCaW5kaW5nKGNvbnRleHQsIGNvdW50ZXJJbmRleCwgcHJvcCwgYmluZGluZ0luZGV4KTtcbiAgICB9XG4gIH1cblxuICBjb25zdCBjaGFuZ2VkID0gZm9yY2VVcGRhdGUgfHwgaGFzVmFsdWVDaGFuZ2VkKGRhdGFbYmluZGluZ0luZGV4XSwgdmFsdWUpO1xuICBpZiAoY2hhbmdlZCkge1xuICAgIGRhdGFbYmluZGluZ0luZGV4XSA9IHZhbHVlO1xuICB9XG4gIHJldHVybiBjaGFuZ2VkO1xufVxuXG4vKipcbiAqIFNjaGVkdWxlcyBhIGJpbmRpbmcgcmVnaXN0cmF0aW9uIHRvIGJlIHJ1biBhdCBhIGxhdGVyIHBvaW50LlxuICpcbiAqIFRoZSByZWFzb25pbmcgZm9yIHRoaXMgZmVhdHVyZSBpcyB0byBlbnN1cmUgdGhhdCBzdHlsaW5nXG4gKiBiaW5kaW5ncyBhcmUgcmVnaXN0ZXJlZCBpbiB0aGUgY29ycmVjdCBvcmRlciBmb3Igd2hlblxuICogZGlyZWN0aXZlcy9jb21wb25lbnRzIGhhdmUgYSBzdXBlci9zdWIgY2xhc3MgaW5oZXJpdGFuY2VcbiAqIGNoYWlucy4gRWFjaCBkaXJlY3RpdmUncyBzdHlsaW5nIGJpbmRpbmdzIG11c3QgYmVcbiAqIHJlZ2lzdGVyZWQgaW50byB0aGUgY29udGV4dCBpbiByZXZlcnNlIG9yZGVyLiBUaGVyZWZvcmUgYWxsXG4gKiBiaW5kaW5ncyB3aWxsIGJlIGJ1ZmZlcmVkIGluIHJldmVyc2Ugb3JkZXIgYW5kIHRoZW4gYXBwbGllZFxuICogYWZ0ZXIgdGhlIGluaGVyaXRhbmNlIGNoYWluIGV4aXRzLlxuICovXG5mdW5jdGlvbiBkZWZlckJpbmRpbmdSZWdpc3RyYXRpb24oXG4gICAgY29udGV4dDogVFN0eWxpbmdDb250ZXh0LCBjb3VudGVySW5kZXg6IG51bWJlciwgcHJvcDogc3RyaW5nIHwgbnVsbCwgYmluZGluZ0luZGV4OiBudW1iZXIpIHtcbiAgZGVmZXJyZWRCaW5kaW5nUXVldWUuc3BsaWNlKDAsIDAsIGNvbnRleHQsIGNvdW50ZXJJbmRleCwgcHJvcCwgYmluZGluZ0luZGV4KTtcbn1cblxuLyoqXG4gKiBGbHVzaGVzIHRoZSBjb2xsZWN0aW9uIG9mIGRlZmVycmVkIGJpbmRpbmdzIGFuZCBjYXVzZXMgZWFjaCBlbnRyeVxuICogdG8gYmUgcmVnaXN0ZXJlZCBpbnRvIHRoZSBjb250ZXh0LlxuICovXG5mdW5jdGlvbiBmbHVzaERlZmVycmVkQmluZGluZ3MoKSB7XG4gIGxldCBpID0gMDtcbiAgd2hpbGUgKGkgPCBkZWZlcnJlZEJpbmRpbmdRdWV1ZS5sZW5ndGgpIHtcbiAgICBjb25zdCBjb250ZXh0ID0gZGVmZXJyZWRCaW5kaW5nUXVldWVbaSsrXSBhcyBUU3R5bGluZ0NvbnRleHQ7XG4gICAgY29uc3QgY291bnQgPSBkZWZlcnJlZEJpbmRpbmdRdWV1ZVtpKytdIGFzIG51bWJlcjtcbiAgICBjb25zdCBwcm9wID0gZGVmZXJyZWRCaW5kaW5nUXVldWVbaSsrXSBhcyBzdHJpbmc7XG4gICAgY29uc3QgYmluZGluZ0luZGV4ID0gZGVmZXJyZWRCaW5kaW5nUXVldWVbaSsrXSBhcyBudW1iZXIgfCBudWxsO1xuICAgIHJlZ2lzdGVyQmluZGluZyhjb250ZXh0LCBjb3VudCwgcHJvcCwgYmluZGluZ0luZGV4KTtcbiAgfVxuICBkZWZlcnJlZEJpbmRpbmdRdWV1ZS5sZW5ndGggPSAwO1xufVxuXG4vKipcbiAqIFJlZ2lzdGVycyB0aGUgcHJvdmlkZWQgYmluZGluZyAocHJvcCArIGJpbmRpbmdJbmRleCkgaW50byB0aGUgY29udGV4dC5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIGlzIHNoYXJlZCBiZXR3ZWVuIGJpbmRpbmdzIHRoYXQgYXJlIGFzc2lnbmVkIGltbWVkaWF0ZWx5XG4gKiAodmlhIGB1cGRhdGVCaW5kaW5nRGF0YWApIGFuZCBhdCBhIGRlZmVycmVkIHN0YWdlLiBXaGVuIGNhbGxlZCwgaXQgd2lsbFxuICogZmlndXJlIG91dCBleGFjdGx5IHdoZXJlIHRvIHBsYWNlIHRoZSBiaW5kaW5nIGRhdGEgaW4gdGhlIGNvbnRleHQuXG4gKlxuICogSXQgaXMgbmVlZGVkIGJlY2F1c2UgaXQgd2lsbCBlaXRoZXIgdXBkYXRlIG9yIGluc2VydCBhIHN0eWxpbmcgcHJvcGVydHlcbiAqIGludG8gdGhlIGNvbnRleHQgYXQgdGhlIGNvcnJlY3Qgc3BvdC5cbiAqXG4gKiBXaGVuIGNhbGxlZCwgb25lIG9mIHR3byB0aGluZ3Mgd2lsbCBoYXBwZW46XG4gKlxuICogMSkgSWYgdGhlIHByb3BlcnR5IGFscmVhZHkgZXhpc3RzIGluIHRoZSBjb250ZXh0IHRoZW4gaXQgd2lsbCBqdXN0IGFkZFxuICogICAgdGhlIHByb3ZpZGVkIGBiaW5kaW5nVmFsdWVgIHRvIHRoZSBlbmQgb2YgdGhlIGJpbmRpbmcgc291cmNlcyByZWdpb25cbiAqICAgIGZvciB0aGF0IHBhcnRpY3VsYXIgcHJvcGVydHkuXG4gKlxuICogICAgLSBJZiB0aGUgYmluZGluZyB2YWx1ZSBpcyBhIG51bWJlciB0aGVuIGl0IHdpbGwgYmUgYWRkZWQgYXMgYSBuZXdcbiAqICAgICAgYmluZGluZyBpbmRleCBzb3VyY2UgbmV4dCB0byB0aGUgb3RoZXIgYmluZGluZyBzb3VyY2VzIGZvciB0aGUgcHJvcGVydHkuXG4gKlxuICogICAgLSBPdGhlcndpc2UsIGlmIHRoZSBiaW5kaW5nIHZhbHVlIGlzIGEgc3RyaW5nL2Jvb2xlYW4vbnVsbCB0eXBlIHRoZW4gaXQgd2lsbFxuICogICAgICByZXBsYWNlIHRoZSBkZWZhdWx0IHZhbHVlIGZvciB0aGUgcHJvcGVydHkgaWYgdGhlIGRlZmF1bHQgdmFsdWUgaXMgYG51bGxgLlxuICpcbiAqIDIpIElmIHRoZSBwcm9wZXJ0eSBkb2VzIG5vdCBleGlzdCB0aGVuIGl0IHdpbGwgYmUgaW5zZXJ0ZWQgaW50byB0aGUgY29udGV4dC5cbiAqICAgIFRoZSBzdHlsaW5nIGNvbnRleHQgcmVsaWVzIG9uIGFsbCBwcm9wZXJ0aWVzIGJlaW5nIHN0b3JlZCBpbiBhbHBoYWJldGljYWxcbiAqICAgIG9yZGVyLCBzbyBpdCBrbm93cyBleGFjdGx5IHdoZXJlIHRvIHN0b3JlIGl0LlxuICpcbiAqICAgIFdoZW4gaW5zZXJ0ZWQsIGEgZGVmYXVsdCBgbnVsbGAgdmFsdWUgaXMgY3JlYXRlZCBmb3IgdGhlIHByb3BlcnR5IHdoaWNoIGV4aXN0c1xuICogICAgYXMgdGhlIGRlZmF1bHQgdmFsdWUgZm9yIHRoZSBiaW5kaW5nLiBJZiB0aGUgYmluZGluZ1ZhbHVlIHByb3BlcnR5IGlzIGluc2VydGVkXG4gKiAgICBhbmQgaXQgaXMgZWl0aGVyIGEgc3RyaW5nLCBudW1iZXIgb3IgbnVsbCB2YWx1ZSB0aGVuIHRoYXQgd2lsbCByZXBsYWNlIHRoZSBkZWZhdWx0XG4gKiAgICB2YWx1ZS5cbiAqXG4gKiBOb3RlIHRoYXQgdGhpcyBmdW5jdGlvbiBpcyBhbHNvIHVzZWQgZm9yIG1hcC1iYXNlZCBzdHlsaW5nIGJpbmRpbmdzLiBUaGV5IGFyZSB0cmVhdGVkXG4gKiBtdWNoIHRoZSBzYW1lIGFzIHByb3AtYmFzZWQgYmluZGluZ3MsIGJ1dCwgYmVjYXVzZSB0aGV5IGRvIG5vdCBoYXZlIGEgcHJvcGVydHkgdmFsdWVcbiAqIChzaW5jZSBpdCdzIGEgbWFwKSwgYWxsIG1hcC1iYXNlZCBlbnRyaWVzIGFyZSBzdG9yZWQgaW4gYW4gYWxyZWFkeSBwb3B1bGF0ZWQgYXJlYSBvZlxuICogdGhlIGNvbnRleHQgYXQgdGhlIHRvcCAod2hpY2ggaXMgcmVzZXJ2ZWQgZm9yIG1hcC1iYXNlZCBlbnRyaWVzKS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlZ2lzdGVyQmluZGluZyhcbiAgICBjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQsIGNvdW50SWQ6IG51bWJlciwgcHJvcDogc3RyaW5nIHwgbnVsbCxcbiAgICBiaW5kaW5nVmFsdWU6IG51bWJlciB8IG51bGwgfCBzdHJpbmcgfCBib29sZWFuKSB7XG4gIC8vIHByb3AtYmFzZWQgYmluZGluZ3MgKGUuZyBgPGRpdiBbc3R5bGUud2lkdGhdPVwid1wiIFtjbGFzcy5mb29dPVwiZlwiPmApXG4gIGlmIChwcm9wKSB7XG4gICAgbGV0IGZvdW5kID0gZmFsc2U7XG4gICAgbGV0IGkgPSBnZXRQcm9wVmFsdWVzU3RhcnRQb3NpdGlvbihjb250ZXh0KTtcbiAgICB3aGlsZSAoaSA8IGNvbnRleHQubGVuZ3RoKSB7XG4gICAgICBjb25zdCB2YWx1ZXNDb3VudCA9IGdldFZhbHVlc0NvdW50KGNvbnRleHQsIGkpO1xuICAgICAgY29uc3QgcCA9IGdldFByb3AoY29udGV4dCwgaSk7XG4gICAgICBmb3VuZCA9IHByb3AgPD0gcDtcbiAgICAgIGlmIChmb3VuZCkge1xuICAgICAgICAvLyBhbGwgc3R5bGUvY2xhc3MgYmluZGluZ3MgYXJlIHNvcnRlZCBieSBwcm9wZXJ0eSBuYW1lXG4gICAgICAgIGlmIChwcm9wIDwgcCkge1xuICAgICAgICAgIGFsbG9jYXRlTmV3Q29udGV4dEVudHJ5KGNvbnRleHQsIGksIHByb3ApO1xuICAgICAgICB9XG4gICAgICAgIGFkZEJpbmRpbmdJbnRvQ29udGV4dChjb250ZXh0LCBmYWxzZSwgaSwgYmluZGluZ1ZhbHVlLCBjb3VudElkKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBpICs9IFRTdHlsaW5nQ29udGV4dEluZGV4LkJpbmRpbmdzU3RhcnRPZmZzZXQgKyB2YWx1ZXNDb3VudDtcbiAgICB9XG5cbiAgICBpZiAoIWZvdW5kKSB7XG4gICAgICBhbGxvY2F0ZU5ld0NvbnRleHRFbnRyeShjb250ZXh0LCBjb250ZXh0Lmxlbmd0aCwgcHJvcCk7XG4gICAgICBhZGRCaW5kaW5nSW50b0NvbnRleHQoY29udGV4dCwgZmFsc2UsIGksIGJpbmRpbmdWYWx1ZSwgY291bnRJZCk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIC8vIG1hcC1iYXNlZCBiaW5kaW5ncyAoZS5nIGA8ZGl2IFtzdHlsZV09XCJzXCIgW2NsYXNzXT1cIntjbGFzc05hbWU6dHJ1ZX1cIj5gKVxuICAgIC8vIHRoZXJlIGlzIG5vIG5lZWQgdG8gYWxsb2NhdGUgdGhlIG1hcC1iYXNlZCBiaW5kaW5nIHJlZ2lvbiBpbnRvIHRoZSBjb250ZXh0XG4gICAgLy8gc2luY2UgaXQgaXMgYWxyZWFkeSB0aGVyZSB3aGVuIHRoZSBjb250ZXh0IGlzIGZpcnN0IGNyZWF0ZWQuXG4gICAgYWRkQmluZGluZ0ludG9Db250ZXh0KFxuICAgICAgICBjb250ZXh0LCB0cnVlLCBUU3R5bGluZ0NvbnRleHRJbmRleC5NYXBCaW5kaW5nc1Bvc2l0aW9uLCBiaW5kaW5nVmFsdWUsIGNvdW50SWQpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGFsbG9jYXRlTmV3Q29udGV4dEVudHJ5KGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCwgaW5kZXg6IG51bWJlciwgcHJvcDogc3RyaW5nKSB7XG4gIC8vIDEsMjogc3BsaWNlIGluZGV4IGxvY2F0aW9uc1xuICAvLyAzOiBlYWNoIGVudHJ5IGdldHMgYSBndWFyZCBtYXNrIHZhbHVlIHRoYXQgaXMgdXNlZCB0byBjaGVjayBhZ2FpbnN0IHVwZGF0ZXNcbiAgLy8gNC4gZWFjaCBlbnRyeSBnZXRzIGEgc2l6ZSB2YWx1ZSAod2hpY2ggaXMgYWx3YXlzIG9uZSBiZWNhdXNlIHRoZXJlIGlzIGFsd2F5cyBhIGRlZmF1bHQgYmluZGluZ1xuICAvLyB2YWx1ZSlcbiAgLy8gNS4gdGhlIHByb3BlcnR5IHRoYXQgaXMgZ2V0dGluZyBhbGxvY2F0ZWQgaW50byB0aGUgY29udGV4dFxuICAvLyA2LiB0aGUgZGVmYXVsdCBiaW5kaW5nIHZhbHVlICh1c3VhbGx5IGBudWxsYClcbiAgY29udGV4dC5zcGxpY2UoXG4gICAgICBpbmRleCwgMCwgREVGQVVMVF9HVUFSRF9NQVNLX1ZBTFVFLCBERUZBVUxUX1NJWkVfVkFMVUUsIHByb3AsIERFRkFVTFRfQklORElOR19WQUxVRSk7XG59XG5cbi8qKlxuICogSW5zZXJ0cyBhIG5ldyBiaW5kaW5nIHZhbHVlIGludG8gYSBzdHlsaW5nIHByb3BlcnR5IHR1cGxlIGluIHRoZSBgVFN0eWxpbmdDb250ZXh0YC5cbiAqXG4gKiBBIGJpbmRpbmdWYWx1ZSBpcyBpbnNlcnRlZCBpbnRvIGEgY29udGV4dCBkdXJpbmcgdGhlIGZpcnN0IHVwZGF0ZSBwYXNzXG4gKiBvZiBhIHRlbXBsYXRlIG9yIGhvc3QgYmluZGluZ3MgZnVuY3Rpb24uIFdoZW4gdGhpcyBvY2N1cnMsIHR3byB0aGluZ3NcbiAqIGhhcHBlbjpcbiAqXG4gKiAtIElmIHRoZSBiaW5kaW5nVmFsdWUgdmFsdWUgaXMgYSBudW1iZXIgdGhlbiBpdCBpcyB0cmVhdGVkIGFzIGEgYmluZGluZ0luZGV4XG4gKiAgIHZhbHVlIChhIGluZGV4IGluIHRoZSBgTFZpZXdgKSBhbmQgaXQgd2lsbCBiZSBpbnNlcnRlZCBuZXh0IHRvIHRoZSBvdGhlclxuICogICBiaW5kaW5nIGluZGV4IGVudHJpZXMuXG4gKlxuICogLSBPdGhlcndpc2UgdGhlIGJpbmRpbmcgdmFsdWUgd2lsbCB1cGRhdGUgdGhlIGRlZmF1bHQgdmFsdWUgZm9yIHRoZSBwcm9wZXJ0eVxuICogICBhbmQgdGhpcyB3aWxsIG9ubHkgaGFwcGVuIGlmIHRoZSBkZWZhdWx0IHZhbHVlIGlzIGBudWxsYC5cbiAqXG4gKiBOb3RlIHRoYXQgdGhpcyBmdW5jdGlvbiBhbHNvIGhhbmRsZXMgbWFwLWJhc2VkIGJpbmRpbmdzIGFuZCB3aWxsIGluc2VydCB0aGVtXG4gKiBhdCB0aGUgdG9wIG9mIHRoZSBjb250ZXh0LlxuICovXG5mdW5jdGlvbiBhZGRCaW5kaW5nSW50b0NvbnRleHQoXG4gICAgY29udGV4dDogVFN0eWxpbmdDb250ZXh0LCBpc01hcEJhc2VkOiBib29sZWFuLCBpbmRleDogbnVtYmVyLFxuICAgIGJpbmRpbmdWYWx1ZTogbnVtYmVyIHwgc3RyaW5nIHwgYm9vbGVhbiB8IG51bGwsIGNvdW50SWQ6IG51bWJlcikge1xuICBjb25zdCB2YWx1ZXNDb3VudCA9IGdldFZhbHVlc0NvdW50KGNvbnRleHQsIGluZGV4KTtcblxuICBsZXQgbGFzdFZhbHVlSW5kZXggPSBpbmRleCArIFRTdHlsaW5nQ29udGV4dEluZGV4LkJpbmRpbmdzU3RhcnRPZmZzZXQgKyB2YWx1ZXNDb3VudDtcbiAgaWYgKCFpc01hcEJhc2VkKSB7XG4gICAgLy8gcHJvcC1iYXNlZCB2YWx1ZXMgYWxsIGhhdmUgZGVmYXVsdCB2YWx1ZXMsIGJ1dCBtYXAtYmFzZWQgZW50cmllcyBkbyBub3QuXG4gICAgLy8gd2Ugd2FudCB0byBhY2Nlc3MgdGhlIGluZGV4IGZvciB0aGUgZGVmYXVsdCB2YWx1ZSBpbiB0aGlzIGNhc2UgYW5kIG5vdCBqdXN0XG4gICAgLy8gdGhlIGJpbmRpbmdzLi4uXG4gICAgbGFzdFZhbHVlSW5kZXgtLTtcbiAgfVxuXG4gIGlmICh0eXBlb2YgYmluZGluZ1ZhbHVlID09PSAnbnVtYmVyJykge1xuICAgIGNvbnRleHQuc3BsaWNlKGxhc3RWYWx1ZUluZGV4LCAwLCBiaW5kaW5nVmFsdWUpO1xuICAgIChjb250ZXh0W2luZGV4ICsgVFN0eWxpbmdDb250ZXh0SW5kZXguVmFsdWVzQ291bnRPZmZzZXRdIGFzIG51bWJlcikrKztcbiAgICAoY29udGV4dFtpbmRleCArIFRTdHlsaW5nQ29udGV4dEluZGV4Lkd1YXJkT2Zmc2V0XSBhcyBudW1iZXIpIHw9IDEgPDwgY291bnRJZDtcbiAgfSBlbHNlIGlmICh0eXBlb2YgYmluZGluZ1ZhbHVlID09PSAnc3RyaW5nJyAmJiBjb250ZXh0W2xhc3RWYWx1ZUluZGV4XSA9PSBudWxsKSB7XG4gICAgY29udGV4dFtsYXN0VmFsdWVJbmRleF0gPSBiaW5kaW5nVmFsdWU7XG4gIH1cbn1cblxuLyoqXG4gKiBBcHBsaWVzIGFsbCBjbGFzcyBlbnRyaWVzIGluIHRoZSBwcm92aWRlZCBjb250ZXh0IHRvIHRoZSBwcm92aWRlZCBlbGVtZW50IGFuZCByZXNldHNcbiAqIGFueSBjb3VudGVyIGFuZC9vciBiaXRNYXNrIHZhbHVlcyBhc3NvY2lhdGVkIHdpdGggY2xhc3MgYmluZGluZ3MuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhcHBseUNsYXNzZXMoXG4gICAgcmVuZGVyZXI6IFJlbmRlcmVyMyB8IFByb2NlZHVyYWxSZW5kZXJlcjMgfCBudWxsLCBkYXRhOiBMU3R5bGluZ0RhdGEsIGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCxcbiAgICBlbGVtZW50OiBSRWxlbWVudCwgZGlyZWN0aXZlSW5kZXg6IG51bWJlcikge1xuICBpZiAoYWxsb3dTdHlsaW5nRmx1c2goY29udGV4dCwgZGlyZWN0aXZlSW5kZXgpKSB7XG4gICAgY29uc3QgaXNGaXJzdFBhc3MgPSAhaXNDb250ZXh0TG9ja2VkKGNvbnRleHQpO1xuICAgIGlzRmlyc3RQYXNzICYmIGxvY2tDb250ZXh0KGNvbnRleHQpO1xuICAgIGlmIChjbGFzc2VzQml0TWFzaykge1xuICAgICAgYXBwbHlTdHlsaW5nKGNvbnRleHQsIHJlbmRlcmVyLCBlbGVtZW50LCBkYXRhLCBjbGFzc2VzQml0TWFzaywgc2V0Q2xhc3MpO1xuICAgICAgY2xhc3Nlc0JpdE1hc2sgPSAwO1xuICAgIH1cbiAgICBjdXJyZW50Q2xhc3NJbmRleCA9IFNUWUxJTkdfSU5ERVhfU1RBUlRfVkFMVUU7XG4gIH1cbn1cblxuLyoqXG4gKiBBcHBsaWVzIGFsbCBzdHlsZSBlbnRyaWVzIGluIHRoZSBwcm92aWRlZCBjb250ZXh0IHRvIHRoZSBwcm92aWRlZCBlbGVtZW50IGFuZCByZXNldHNcbiAqIGFueSBjb3VudGVyIGFuZC9vciBiaXRNYXNrIHZhbHVlcyBhc3NvY2lhdGVkIHdpdGggc3R5bGUgYmluZGluZ3MuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhcHBseVN0eWxlcyhcbiAgICByZW5kZXJlcjogUmVuZGVyZXIzIHwgUHJvY2VkdXJhbFJlbmRlcmVyMyB8IG51bGwsIGRhdGE6IExTdHlsaW5nRGF0YSwgY29udGV4dDogVFN0eWxpbmdDb250ZXh0LFxuICAgIGVsZW1lbnQ6IFJFbGVtZW50LCBkaXJlY3RpdmVJbmRleDogbnVtYmVyKSB7XG4gIGlmIChhbGxvd1N0eWxpbmdGbHVzaChjb250ZXh0LCBkaXJlY3RpdmVJbmRleCkpIHtcbiAgICBjb25zdCBpc0ZpcnN0UGFzcyA9ICFpc0NvbnRleHRMb2NrZWQoY29udGV4dCk7XG4gICAgaXNGaXJzdFBhc3MgJiYgbG9ja0NvbnRleHQoY29udGV4dCk7XG4gICAgaWYgKHN0eWxlc0JpdE1hc2spIHtcbiAgICAgIGFwcGx5U3R5bGluZyhjb250ZXh0LCByZW5kZXJlciwgZWxlbWVudCwgZGF0YSwgc3R5bGVzQml0TWFzaywgc2V0U3R5bGUpO1xuICAgICAgc3R5bGVzQml0TWFzayA9IDA7XG4gICAgfVxuICAgIGN1cnJlbnRTdHlsZUluZGV4ID0gU1RZTElOR19JTkRFWF9TVEFSVF9WQUxVRTtcbiAgfVxufVxuXG4vKipcbiAqIFJ1bnMgdGhyb3VnaCB0aGUgcHJvdmlkZWQgc3R5bGluZyBjb250ZXh0IGFuZCBhcHBsaWVzIGVhY2ggdmFsdWUgdG9cbiAqIHRoZSBwcm92aWRlZCBlbGVtZW50ICh2aWEgdGhlIHJlbmRlcmVyKSBpZiBvbmUgb3IgbW9yZSB2YWx1ZXMgYXJlIHByZXNlbnQuXG4gKlxuICogVGhpcyBmdW5jdGlvbiB3aWxsIGl0ZXJhdGUgb3ZlciBhbGwgZW50cmllcyBwcmVzZW50IGluIHRoZSBwcm92aWRlZFxuICogYFRTdHlsaW5nQ29udGV4dGAgYXJyYXkgKGJvdGggcHJvcC1iYXNlZCBhbmQgbWFwLWJhc2VkIGJpbmRpbmdzKS4tXG4gKlxuICogRWFjaCBlbnRyeSwgd2l0aGluIHRoZSBgVFN0eWxpbmdDb250ZXh0YCBhcnJheSwgaXMgc3RvcmVkIGFscGhhYmV0aWNhbGx5XG4gKiBhbmQgdGhpcyBtZWFucyB0aGF0IGVhY2ggcHJvcC92YWx1ZSBlbnRyeSB3aWxsIGJlIGFwcGxpZWQgaW4gb3JkZXJcbiAqIChzbyBsb25nIGFzIGl0IGlzIG1hcmtlZCBkaXJ0eSBpbiB0aGUgcHJvdmlkZWQgYGJpdE1hc2tgIHZhbHVlKS5cbiAqXG4gKiBJZiB0aGVyZSBhcmUgYW55IG1hcC1iYXNlZCBlbnRyaWVzIHByZXNlbnQgKHdoaWNoIGFyZSBhcHBsaWVkIHRvIHRoZVxuICogZWxlbWVudCB2aWEgdGhlIGBbc3R5bGVdYCBhbmQgYFtjbGFzc11gIGJpbmRpbmdzKSB0aGVuIHRob3NlIGVudHJpZXNcbiAqIHdpbGwgYmUgYXBwbGllZCBhcyB3ZWxsLiBIb3dldmVyLCB0aGUgY29kZSBmb3IgdGhhdCBpcyBub3QgYXBhcnQgb2ZcbiAqIHRoaXMgZnVuY3Rpb24uIEluc3RlYWQsIGVhY2ggdGltZSBhIHByb3BlcnR5IGlzIHZpc2l0ZWQsIHRoZW4gdGhlXG4gKiBjb2RlIGJlbG93IHdpbGwgY2FsbCBhbiBleHRlcm5hbCBmdW5jdGlvbiBjYWxsZWQgYHN0eWxpbmdNYXBzU3luY0ZuYFxuICogYW5kLCBpZiBwcmVzZW50LCBpdCB3aWxsIGtlZXAgdGhlIGFwcGxpY2F0aW9uIG9mIHN0eWxpbmcgdmFsdWVzIGluXG4gKiBtYXAtYmFzZWQgYmluZGluZ3MgdXAgdG8gc3luYyB3aXRoIHRoZSBhcHBsaWNhdGlvbiBvZiBwcm9wLWJhc2VkXG4gKiBiaW5kaW5ncy5cbiAqXG4gKiBWaXNpdCBgc3R5bGluZ19uZXh0L21hcF9iYXNlZF9iaW5kaW5ncy50c2AgdG8gbGVhcm4gbW9yZSBhYm91dCBob3cgdGhlXG4gKiBhbGdvcml0aG0gd29ya3MgZm9yIG1hcC1iYXNlZCBzdHlsaW5nIGJpbmRpbmdzLlxuICpcbiAqIE5vdGUgdGhhdCB0aGlzIGZ1bmN0aW9uIGlzIG5vdCBkZXNpZ25lZCB0byBiZSBjYWxsZWQgaW4gaXNvbGF0aW9uICh1c2VcbiAqIGBhcHBseUNsYXNzZXNgIGFuZCBgYXBwbHlTdHlsZXNgIHRvIGFjdHVhbGx5IGFwcGx5IHN0eWxpbmcgdmFsdWVzKS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFwcGx5U3R5bGluZyhcbiAgICBjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQsIHJlbmRlcmVyOiBSZW5kZXJlcjMgfCBQcm9jZWR1cmFsUmVuZGVyZXIzIHwgbnVsbCwgZWxlbWVudDogUkVsZW1lbnQsXG4gICAgYmluZGluZ0RhdGE6IExTdHlsaW5nRGF0YSwgYml0TWFza1ZhbHVlOiBudW1iZXIgfCBib29sZWFuLCBhcHBseVN0eWxpbmdGbjogQXBwbHlTdHlsaW5nRm4pIHtcbiAgZGVmZXJyZWRCaW5kaW5nUXVldWUubGVuZ3RoICYmIGZsdXNoRGVmZXJyZWRCaW5kaW5ncygpO1xuXG4gIGNvbnN0IGJpdE1hc2sgPSBub3JtYWxpemVCaXRNYXNrVmFsdWUoYml0TWFza1ZhbHVlKTtcbiAgY29uc3Qgc3R5bGluZ01hcHNTeW5jRm4gPSBnZXRTdHlsaW5nTWFwc1N5bmNGbigpO1xuICBjb25zdCBtYXBzR3VhcmRNYXNrID0gZ2V0R3VhcmRNYXNrKGNvbnRleHQsIFRTdHlsaW5nQ29udGV4dEluZGV4Lk1hcEJpbmRpbmdzUG9zaXRpb24pO1xuICBjb25zdCBhcHBseUFsbFZhbHVlcyA9IChiaXRNYXNrICYgbWFwc0d1YXJkTWFzaykgPiAwO1xuICBjb25zdCBtYXBzTW9kZSA9XG4gICAgICBhcHBseUFsbFZhbHVlcyA/IFN0eWxpbmdNYXBzU3luY01vZGUuQXBwbHlBbGxWYWx1ZXMgOiBTdHlsaW5nTWFwc1N5bmNNb2RlLlRyYXZlcnNlVmFsdWVzO1xuXG4gIGxldCBpID0gZ2V0UHJvcFZhbHVlc1N0YXJ0UG9zaXRpb24oY29udGV4dCk7XG4gIHdoaWxlIChpIDwgY29udGV4dC5sZW5ndGgpIHtcbiAgICBjb25zdCB2YWx1ZXNDb3VudCA9IGdldFZhbHVlc0NvdW50KGNvbnRleHQsIGkpO1xuICAgIGNvbnN0IGd1YXJkTWFzayA9IGdldEd1YXJkTWFzayhjb250ZXh0LCBpKTtcbiAgICBpZiAoYml0TWFzayAmIGd1YXJkTWFzaykge1xuICAgICAgbGV0IHZhbHVlQXBwbGllZCA9IGZhbHNlO1xuICAgICAgY29uc3QgcHJvcCA9IGdldFByb3AoY29udGV4dCwgaSk7XG4gICAgICBjb25zdCB2YWx1ZXNDb3VudFVwVG9EZWZhdWx0ID0gdmFsdWVzQ291bnQgLSAxO1xuICAgICAgY29uc3QgZGVmYXVsdFZhbHVlID0gZ2V0QmluZGluZ1ZhbHVlKGNvbnRleHQsIGksIHZhbHVlc0NvdW50VXBUb0RlZmF1bHQpIGFzIHN0cmluZyB8IG51bGw7XG5cbiAgICAgIC8vIGNhc2UgMTogYXBwbHkgcHJvcC1iYXNlZCB2YWx1ZXNcbiAgICAgIC8vIHRyeSB0byBhcHBseSB0aGUgYmluZGluZyB2YWx1ZXMgYW5kIHNlZSBpZiBhIG5vbi1udWxsXG4gICAgICAvLyB2YWx1ZSBnZXRzIHNldCBmb3IgdGhlIHN0eWxpbmcgYmluZGluZ1xuICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCB2YWx1ZXNDb3VudFVwVG9EZWZhdWx0OyBqKyspIHtcbiAgICAgICAgY29uc3QgYmluZGluZ0luZGV4ID0gZ2V0QmluZGluZ1ZhbHVlKGNvbnRleHQsIGksIGopIGFzIG51bWJlcjtcbiAgICAgICAgY29uc3QgdmFsdWVUb0FwcGx5ID0gYmluZGluZ0RhdGFbYmluZGluZ0luZGV4XTtcbiAgICAgICAgaWYgKGlzU3R5bGluZ1ZhbHVlRGVmaW5lZCh2YWx1ZVRvQXBwbHkpKSB7XG4gICAgICAgICAgYXBwbHlTdHlsaW5nRm4ocmVuZGVyZXIsIGVsZW1lbnQsIHByb3AsIHZhbHVlVG9BcHBseSwgYmluZGluZ0luZGV4KTtcbiAgICAgICAgICB2YWx1ZUFwcGxpZWQgPSB0cnVlO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIGNhc2UgMjogYXBwbHkgbWFwLWJhc2VkIHZhbHVlc1xuICAgICAgLy8gdHJhdmVyc2UgdGhyb3VnaCBlYWNoIG1hcC1iYXNlZCBzdHlsaW5nIGJpbmRpbmcgYW5kIHVwZGF0ZSBhbGwgdmFsdWVzIHVwIHRvXG4gICAgICAvLyB0aGUgcHJvdmlkZWQgYHByb3BgIHZhbHVlLiBJZiB0aGUgcHJvcGVydHkgd2FzIG5vdCBhcHBsaWVkIGluIHRoZSBsb29wIGFib3ZlXG4gICAgICAvLyB0aGVuIGl0IHdpbGwgYmUgYXR0ZW1wdGVkIHRvIGJlIGFwcGxpZWQgaW4gdGhlIG1hcHMgc3luYyBjb2RlIGJlbG93LlxuICAgICAgaWYgKHN0eWxpbmdNYXBzU3luY0ZuKSB7XG4gICAgICAgIC8vIGRldGVybWluZSB3aGV0aGVyIG9yIG5vdCB0byBhcHBseSB0aGUgdGFyZ2V0IHByb3BlcnR5IG9yIHRvIHNraXAgaXRcbiAgICAgICAgY29uc3QgbW9kZSA9IG1hcHNNb2RlIHwgKHZhbHVlQXBwbGllZCA/IFN0eWxpbmdNYXBzU3luY01vZGUuU2tpcFRhcmdldFByb3AgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgU3R5bGluZ01hcHNTeW5jTW9kZS5BcHBseVRhcmdldFByb3ApO1xuICAgICAgICBjb25zdCB2YWx1ZUFwcGxpZWRXaXRoaW5NYXAgPSBzdHlsaW5nTWFwc1N5bmNGbihcbiAgICAgICAgICAgIGNvbnRleHQsIHJlbmRlcmVyLCBlbGVtZW50LCBiaW5kaW5nRGF0YSwgYXBwbHlTdHlsaW5nRm4sIG1vZGUsIHByb3AsIGRlZmF1bHRWYWx1ZSk7XG4gICAgICAgIHZhbHVlQXBwbGllZCA9IHZhbHVlQXBwbGllZCB8fCB2YWx1ZUFwcGxpZWRXaXRoaW5NYXA7XG4gICAgICB9XG5cbiAgICAgIC8vIGNhc2UgMzogYXBwbHkgdGhlIGRlZmF1bHQgdmFsdWVcbiAgICAgIC8vIGlmIHRoZSB2YWx1ZSBoYXMgbm90IHlldCBiZWVuIGFwcGxpZWQgdGhlbiBhIHRydXRoeSB2YWx1ZSBkb2VzIG5vdCBleGlzdCBpbiB0aGVcbiAgICAgIC8vIHByb3AtYmFzZWQgb3IgbWFwLWJhc2VkIGJpbmRpbmdzIGNvZGUuIElmIGFuZCB3aGVuIHRoaXMgaGFwcGVucywganVzdCBhcHBseSB0aGVcbiAgICAgIC8vIGRlZmF1bHQgdmFsdWUgKGV2ZW4gaWYgdGhlIGRlZmF1bHQgdmFsdWUgaXMgYG51bGxgKS5cbiAgICAgIGlmICghdmFsdWVBcHBsaWVkKSB7XG4gICAgICAgIGFwcGx5U3R5bGluZ0ZuKHJlbmRlcmVyLCBlbGVtZW50LCBwcm9wLCBkZWZhdWx0VmFsdWUpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGkgKz0gVFN0eWxpbmdDb250ZXh0SW5kZXguQmluZGluZ3NTdGFydE9mZnNldCArIHZhbHVlc0NvdW50O1xuICB9XG5cbiAgLy8gdGhlIG1hcC1iYXNlZCBzdHlsaW5nIGVudHJpZXMgbWF5IGhhdmUgbm90IGFwcGxpZWQgYWxsIHRoZWlyXG4gIC8vIHZhbHVlcy4gRm9yIHRoaXMgcmVhc29uLCBvbmUgbW9yZSBjYWxsIHRvIHRoZSBzeW5jIGZ1bmN0aW9uXG4gIC8vIG5lZWRzIHRvIGJlIGlzc3VlZCBhdCB0aGUgZW5kLlxuICBpZiAoc3R5bGluZ01hcHNTeW5jRm4pIHtcbiAgICBzdHlsaW5nTWFwc1N5bmNGbihjb250ZXh0LCByZW5kZXJlciwgZWxlbWVudCwgYmluZGluZ0RhdGEsIGFwcGx5U3R5bGluZ0ZuLCBtYXBzTW9kZSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gbm9ybWFsaXplQml0TWFza1ZhbHVlKHZhbHVlOiBudW1iZXIgfCBib29sZWFuKTogbnVtYmVyIHtcbiAgLy8gaWYgcGFzcyA9PiBhcHBseSBhbGwgdmFsdWVzICgtMSBpbXBsaWVzIHRoYXQgYWxsIGJpdHMgYXJlIGZsaXBwZWQgdG8gdHJ1ZSlcbiAgaWYgKHZhbHVlID09PSB0cnVlKSByZXR1cm4gLTE7XG5cbiAgLy8gaWYgcGFzcyA9PiBza2lwIGFsbCB2YWx1ZXNcbiAgaWYgKHZhbHVlID09PSBmYWxzZSkgcmV0dXJuIDA7XG5cbiAgLy8gcmV0dXJuIHRoZSBiaXQgbWFzayB2YWx1ZSBhcyBpc1xuICByZXR1cm4gdmFsdWU7XG59XG5cbmxldCBfYWN0aXZlU3R5bGluZ01hcEFwcGx5Rm46IFN5bmNTdHlsaW5nTWFwc0ZufG51bGwgPSBudWxsO1xuZXhwb3J0IGZ1bmN0aW9uIGdldFN0eWxpbmdNYXBzU3luY0ZuKCkge1xuICByZXR1cm4gX2FjdGl2ZVN0eWxpbmdNYXBBcHBseUZuO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2V0U3R5bGluZ01hcHNTeW5jRm4oZm46IFN5bmNTdHlsaW5nTWFwc0ZuKSB7XG4gIF9hY3RpdmVTdHlsaW5nTWFwQXBwbHlGbiA9IGZuO1xufVxuXG4vKipcbiAqIEFzc2lnbnMgYSBzdHlsZSB2YWx1ZSB0byBhIHN0eWxlIHByb3BlcnR5IGZvciB0aGUgZ2l2ZW4gZWxlbWVudC5cbiAqL1xuY29uc3Qgc2V0U3R5bGU6IEFwcGx5U3R5bGluZ0ZuID1cbiAgICAocmVuZGVyZXI6IFJlbmRlcmVyMyB8IG51bGwsIG5hdGl2ZTogYW55LCBwcm9wOiBzdHJpbmcsIHZhbHVlOiBzdHJpbmcgfCBudWxsKSA9PiB7XG4gICAgICBpZiAodmFsdWUpIHtcbiAgICAgICAgLy8gb3BhY2l0eSwgei1pbmRleCBhbmQgZmxleGJveCBhbGwgaGF2ZSBudW1iZXIgdmFsdWVzXG4gICAgICAgIC8vIGFuZCB0aGVzZSBuZWVkIHRvIGJlIGNvbnZlcnRlZCBpbnRvIHN0cmluZ3Mgc28gdGhhdFxuICAgICAgICAvLyB0aGV5IGNhbiBiZSBhc3NpZ25lZCBwcm9wZXJseS5cbiAgICAgICAgdmFsdWUgPSB2YWx1ZS50b1N0cmluZygpO1xuICAgICAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyU2V0U3R5bGUrKztcbiAgICAgICAgcmVuZGVyZXIgJiYgaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpID9cbiAgICAgICAgICAgIHJlbmRlcmVyLnNldFN0eWxlKG5hdGl2ZSwgcHJvcCwgdmFsdWUsIFJlbmRlcmVyU3R5bGVGbGFnczMuRGFzaENhc2UpIDpcbiAgICAgICAgICAgIG5hdGl2ZS5zdHlsZS5zZXRQcm9wZXJ0eShwcm9wLCB2YWx1ZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyUmVtb3ZlU3R5bGUrKztcbiAgICAgICAgcmVuZGVyZXIgJiYgaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpID9cbiAgICAgICAgICAgIHJlbmRlcmVyLnJlbW92ZVN0eWxlKG5hdGl2ZSwgcHJvcCwgUmVuZGVyZXJTdHlsZUZsYWdzMy5EYXNoQ2FzZSkgOlxuICAgICAgICAgICAgbmF0aXZlLnN0eWxlLnJlbW92ZVByb3BlcnR5KHByb3ApO1xuICAgICAgfVxuICAgIH07XG5cbi8qKlxuICogQWRkcy9yZW1vdmVzIHRoZSBwcm92aWRlZCBjbGFzc05hbWUgdmFsdWUgdG8gdGhlIHByb3ZpZGVkIGVsZW1lbnQuXG4gKi9cbmNvbnN0IHNldENsYXNzOiBBcHBseVN0eWxpbmdGbiA9XG4gICAgKHJlbmRlcmVyOiBSZW5kZXJlcjMgfCBudWxsLCBuYXRpdmU6IGFueSwgY2xhc3NOYW1lOiBzdHJpbmcsIHZhbHVlOiBhbnkpID0+IHtcbiAgICAgIGlmIChjbGFzc05hbWUgIT09ICcnKSB7XG4gICAgICAgIGlmICh2YWx1ZSkge1xuICAgICAgICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJBZGRDbGFzcysrO1xuICAgICAgICAgIHJlbmRlcmVyICYmIGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSA/IHJlbmRlcmVyLmFkZENsYXNzKG5hdGl2ZSwgY2xhc3NOYW1lKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmF0aXZlLmNsYXNzTGlzdC5hZGQoY2xhc3NOYW1lKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyUmVtb3ZlQ2xhc3MrKztcbiAgICAgICAgICByZW5kZXJlciAmJiBpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikgPyByZW5kZXJlci5yZW1vdmVDbGFzcyhuYXRpdmUsIGNsYXNzTmFtZSkgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hdGl2ZS5jbGFzc0xpc3QucmVtb3ZlKGNsYXNzTmFtZSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9O1xuIl19