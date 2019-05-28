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
var ɵ0 = setStyle;
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
var ɵ1 = setClass;
export { ɵ0, ɵ1 };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmluZGluZ3MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL3N0eWxpbmdfbmV4dC9iaW5kaW5ncy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0VBTUU7QUFDRixPQUFPLEVBQTJDLG1CQUFtQixFQUFFLG9CQUFvQixFQUFDLE1BQU0sd0JBQXdCLENBQUM7QUFHM0gsT0FBTyxFQUFDLGlCQUFpQixFQUFFLGVBQWUsRUFBRSxZQUFZLEVBQUUsT0FBTyxFQUFFLDBCQUEwQixFQUFFLGNBQWMsRUFBRSxlQUFlLEVBQUUsZUFBZSxFQUFFLHFCQUFxQixFQUFFLFdBQVcsRUFBQyxNQUFNLFFBQVEsQ0FBQztBQUduTTs7Ozs7Ozs7Ozs7Ozs7Ozs7R0FpQkc7QUFFSCxJQUFNLHFCQUFxQixHQUFHLElBQUksQ0FBQztBQUNuQyxJQUFNLGtCQUFrQixHQUFHLENBQUMsQ0FBQztBQUU3QixnRUFBZ0U7QUFDaEUsa0VBQWtFO0FBQ2xFLGtFQUFrRTtBQUNsRSxpRUFBaUU7QUFDakUsMkJBQTJCO0FBQzNCLE1BQU0sQ0FBQyxJQUFNLHdCQUF3QixHQUFHLENBQUcsQ0FBQztBQUM1QyxJQUFNLDZCQUE2QixHQUFHLENBQUMsQ0FBQztBQUN4QyxJQUFNLHlCQUF5QixHQUFHLENBQUMsQ0FBQztBQUVwQyxvRUFBb0U7QUFDcEUscUVBQXFFO0FBQ3JFLDRDQUE0QztBQUM1QyxJQUFJLGlCQUFpQixHQUFHLHlCQUF5QixDQUFDO0FBQ2xELElBQUksaUJBQWlCLEdBQUcseUJBQXlCLENBQUM7QUFDbEQsSUFBSSxhQUFhLEdBQUcsQ0FBQyxDQUFDO0FBQ3RCLElBQUksY0FBYyxHQUFHLENBQUMsQ0FBQztBQUN2QixJQUFJLG9CQUFvQixHQUFpRCxFQUFFLENBQUM7QUFFNUU7Ozs7Ozs7OztHQVNHO0FBQ0gsTUFBTSxVQUFVLGtCQUFrQixDQUM5QixP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QUFRLENBQUMsV0FBVyxDQUFDLE1BQU0sRUFBRSxTQUFTLENBQUMsQ0FBQyxDQUFDO2dCQUN6QyxNQUFNLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQztTQUNqRjtLQUNGO0FBQ0gsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4qIEBsaWNlbnNlXG4qIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuKlxuKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4qL1xuaW1wb3J0IHtQcm9jZWR1cmFsUmVuZGVyZXIzLCBSRWxlbWVudCwgUmVuZGVyZXIzLCBSZW5kZXJlclN0eWxlRmxhZ3MzLCBpc1Byb2NlZHVyYWxSZW5kZXJlcn0gZnJvbSAnLi4vaW50ZXJmYWNlcy9yZW5kZXJlcic7XG5cbmltcG9ydCB7QXBwbHlTdHlsaW5nRm4sIExTdHlsaW5nRGF0YSwgTFN0eWxpbmdNYXAsIFN0eWxpbmdNYXBzU3luY01vZGUsIFN5bmNTdHlsaW5nTWFwc0ZuLCBUU3R5bGluZ0NvbnRleHQsIFRTdHlsaW5nQ29udGV4dEluZGV4fSBmcm9tICcuL2ludGVyZmFjZXMnO1xuaW1wb3J0IHthbGxvd1N0eWxpbmdGbHVzaCwgZ2V0QmluZGluZ1ZhbHVlLCBnZXRHdWFyZE1hc2ssIGdldFByb3AsIGdldFByb3BWYWx1ZXNTdGFydFBvc2l0aW9uLCBnZXRWYWx1ZXNDb3VudCwgaGFzVmFsdWVDaGFuZ2VkLCBpc0NvbnRleHRMb2NrZWQsIGlzU3R5bGluZ1ZhbHVlRGVmaW5lZCwgbG9ja0NvbnRleHR9IGZyb20gJy4vdXRpbCc7XG5cblxuLyoqXG4gKiAtLS0tLS0tLVxuICpcbiAqIFRoaXMgZmlsZSBjb250YWlucyB0aGUgY29yZSBsb2dpYyBmb3Igc3R5bGluZyBpbiBBbmd1bGFyLlxuICpcbiAqIEFsbCBzdHlsaW5nIGJpbmRpbmdzIChpLmUuIGBbc3R5bGVdYCwgYFtzdHlsZS5wcm9wXWAsIGBbY2xhc3NdYCBhbmQgYFtjbGFzcy5uYW1lXWApXG4gKiB3aWxsIGhhdmUgdGhlaXIgdmFsdWVzIGJlIGFwcGxpZWQgdGhyb3VnaCB0aGUgbG9naWMgaW4gdGhpcyBmaWxlLlxuICpcbiAqIFdoZW4gYSBiaW5kaW5nIGlzIGVuY291bnRlcmVkIChlLmcuIGA8ZGl2IFtzdHlsZS53aWR0aF09XCJ3XCI+YCkgdGhlblxuICogdGhlIGJpbmRpbmcgZGF0YSB3aWxsIGJlIHBvcHVsYXRlZCBpbnRvIGEgYFRTdHlsaW5nQ29udGV4dGAgZGF0YS1zdHJ1Y3R1cmUuXG4gKiBUaGVyZSBpcyBvbmx5IG9uZSBgVFN0eWxpbmdDb250ZXh0YCBwZXIgYFROb2RlYCBhbmQgZWFjaCBlbGVtZW50IGluc3RhbmNlXG4gKiB3aWxsIHVwZGF0ZSBpdHMgc3R5bGUvY2xhc3MgYmluZGluZyB2YWx1ZXMgaW4gY29uY2VydCB3aXRoIHRoZSBzdHlsaW5nXG4gKiBjb250ZXh0LlxuICpcbiAqIFRvIGxlYXJuIG1vcmUgYWJvdXQgdGhlIGFsZ29yaXRobSBzZWUgYFRTdHlsaW5nQ29udGV4dGAuXG4gKlxuICogLS0tLS0tLS1cbiAqL1xuXG5jb25zdCBERUZBVUxUX0JJTkRJTkdfVkFMVUUgPSBudWxsO1xuY29uc3QgREVGQVVMVF9TSVpFX1ZBTFVFID0gMTtcblxuLy8gVGhlIGZpcnN0IGJpdCB2YWx1ZSByZWZsZWN0cyBhIG1hcC1iYXNlZCBiaW5kaW5nIHZhbHVlJ3MgYml0LlxuLy8gVGhlIHJlYXNvbiB3aHkgaXQncyBhbHdheXMgYWN0aXZhdGVkIGZvciBldmVyeSBlbnRyeSBpbiB0aGUgbWFwXG4vLyBpcyBzbyB0aGF0IGlmIGFueSBtYXAtYmluZGluZyB2YWx1ZXMgdXBkYXRlIHRoZW4gYWxsIG90aGVyIHByb3Bcbi8vIGJhc2VkIGJpbmRpbmdzIHdpbGwgcGFzcyB0aGUgZ3VhcmQgY2hlY2sgYXV0b21hdGljYWxseSB3aXRob3V0XG4vLyBhbnkgZXh0cmEgY29kZSBvciBmbGFncy5cbmV4cG9ydCBjb25zdCBERUZBVUxUX0dVQVJEX01BU0tfVkFMVUUgPSAwYjE7XG5jb25zdCBTVFlMSU5HX0lOREVYX0ZPUl9NQVBfQklORElORyA9IDA7XG5jb25zdCBTVFlMSU5HX0lOREVYX1NUQVJUX1ZBTFVFID0gMTtcblxuLy8gdGhlIHZhbHVlcyBiZWxvdyBhcmUgZ2xvYmFsIHRvIGFsbCBzdHlsaW5nIGNvZGUgYmVsb3cuIEVhY2ggdmFsdWVcbi8vIHdpbGwgZWl0aGVyIGluY3JlbWVudCBvciBtdXRhdGUgZWFjaCB0aW1lIGEgc3R5bGluZyBpbnN0cnVjdGlvbiBpc1xuLy8gZXhlY3V0ZWQuIERvIG5vdCBtb2RpZnkgdGhlIHZhbHVlcyBiZWxvdy5cbmxldCBjdXJyZW50U3R5bGVJbmRleCA9IFNUWUxJTkdfSU5ERVhfU1RBUlRfVkFMVUU7XG5sZXQgY3VycmVudENsYXNzSW5kZXggPSBTVFlMSU5HX0lOREVYX1NUQVJUX1ZBTFVFO1xubGV0IHN0eWxlc0JpdE1hc2sgPSAwO1xubGV0IGNsYXNzZXNCaXRNYXNrID0gMDtcbmxldCBkZWZlcnJlZEJpbmRpbmdRdWV1ZTogKFRTdHlsaW5nQ29udGV4dCB8IG51bWJlciB8IHN0cmluZyB8IG51bGwpW10gPSBbXTtcblxuLyoqXG4gKiBWaXNpdHMgYSBjbGFzcy1iYXNlZCBiaW5kaW5nIGFuZCB1cGRhdGVzIHRoZSBuZXcgdmFsdWUgKGlmIGNoYW5nZWQpLlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gaXMgY2FsbGVkIGVhY2ggdGltZSBhIGNsYXNzLWJhc2VkIHN0eWxpbmcgaW5zdHJ1Y3Rpb25cbiAqIGlzIGV4ZWN1dGVkLiBJdCdzIGltcG9ydGFudCB0aGF0IGl0J3MgYWx3YXlzIGNhbGxlZCAoZXZlbiBpZiB0aGUgdmFsdWVcbiAqIGhhcyBub3QgY2hhbmdlZCkgc28gdGhhdCB0aGUgaW5uZXIgY291bnRlciBpbmRleCB2YWx1ZSBpcyBpbmNyZW1lbnRlZC5cbiAqIFRoaXMgd2F5LCBlYWNoIGluc3RydWN0aW9uIGlzIGFsd2F5cyBndWFyYW50ZWVkIHRvIGdldCB0aGUgc2FtZSBjb3VudGVyXG4gKiBzdGF0ZSBlYWNoIHRpbWUgaXQncyBjYWxsZWQgKHdoaWNoIHRoZW4gYWxsb3dzIHRoZSBgVFN0eWxpbmdDb250ZXh0YFxuICogYW5kIHRoZSBiaXQgbWFzayB2YWx1ZXMgdG8gYmUgaW4gc3luYykuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB1cGRhdGVDbGFzc0JpbmRpbmcoXG4gICAgY29udGV4dDogVFN0eWxpbmdDb250ZXh0LCBkYXRhOiBMU3R5bGluZ0RhdGEsIHByb3A6IHN0cmluZyB8IG51bGwsIGJpbmRpbmdJbmRleDogbnVtYmVyLFxuICAgIHZhbHVlOiBib29sZWFuIHwgc3RyaW5nIHwgbnVsbCB8IHVuZGVmaW5lZCB8IExTdHlsaW5nTWFwLCBkZWZlclJlZ2lzdHJhdGlvbjogYm9vbGVhbixcbiAgICBmb3JjZVVwZGF0ZT86IGJvb2xlYW4pOiB2b2lkIHtcbiAgY29uc3QgaXNNYXBCYXNlZCA9ICFwcm9wO1xuICBjb25zdCBpbmRleCA9IGlzTWFwQmFzZWQgPyBTVFlMSU5HX0lOREVYX0ZPUl9NQVBfQklORElORyA6IGN1cnJlbnRDbGFzc0luZGV4Kys7XG4gIGNvbnN0IHVwZGF0ZWQgPSB1cGRhdGVCaW5kaW5nRGF0YShcbiAgICAgIGNvbnRleHQsIGRhdGEsIGluZGV4LCBwcm9wLCBiaW5kaW5nSW5kZXgsIHZhbHVlLCBkZWZlclJlZ2lzdHJhdGlvbiwgZm9yY2VVcGRhdGUpO1xuICBpZiAodXBkYXRlZCB8fCBmb3JjZVVwZGF0ZSkge1xuICAgIGNsYXNzZXNCaXRNYXNrIHw9IDEgPDwgaW5kZXg7XG4gIH1cbn1cblxuLyoqXG4gKiBWaXNpdHMgYSBzdHlsZS1iYXNlZCBiaW5kaW5nIGFuZCB1cGRhdGVzIHRoZSBuZXcgdmFsdWUgKGlmIGNoYW5nZWQpLlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gaXMgY2FsbGVkIGVhY2ggdGltZSBhIHN0eWxlLWJhc2VkIHN0eWxpbmcgaW5zdHJ1Y3Rpb25cbiAqIGlzIGV4ZWN1dGVkLiBJdCdzIGltcG9ydGFudCB0aGF0IGl0J3MgYWx3YXlzIGNhbGxlZCAoZXZlbiBpZiB0aGUgdmFsdWVcbiAqIGhhcyBub3QgY2hhbmdlZCkgc28gdGhhdCB0aGUgaW5uZXIgY291bnRlciBpbmRleCB2YWx1ZSBpcyBpbmNyZW1lbnRlZC5cbiAqIFRoaXMgd2F5LCBlYWNoIGluc3RydWN0aW9uIGlzIGFsd2F5cyBndWFyYW50ZWVkIHRvIGdldCB0aGUgc2FtZSBjb3VudGVyXG4gKiBzdGF0ZSBlYWNoIHRpbWUgaXQncyBjYWxsZWQgKHdoaWNoIHRoZW4gYWxsb3dzIHRoZSBgVFN0eWxpbmdDb250ZXh0YFxuICogYW5kIHRoZSBiaXQgbWFzayB2YWx1ZXMgdG8gYmUgaW4gc3luYykuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB1cGRhdGVTdHlsZUJpbmRpbmcoXG4gICAgY29udGV4dDogVFN0eWxpbmdDb250ZXh0LCBkYXRhOiBMU3R5bGluZ0RhdGEsIHByb3A6IHN0cmluZyB8IG51bGwsIGJpbmRpbmdJbmRleDogbnVtYmVyLFxuICAgIHZhbHVlOiBTdHJpbmcgfCBzdHJpbmcgfCBudW1iZXIgfCBudWxsIHwgdW5kZWZpbmVkIHwgTFN0eWxpbmdNYXAsIGRlZmVyUmVnaXN0cmF0aW9uOiBib29sZWFuLFxuICAgIGZvcmNlVXBkYXRlPzogYm9vbGVhbik6IHZvaWQge1xuICBjb25zdCBpc01hcEJhc2VkID0gIXByb3A7XG4gIGNvbnN0IGluZGV4ID0gaXNNYXBCYXNlZCA/IFNUWUxJTkdfSU5ERVhfRk9SX01BUF9CSU5ESU5HIDogY3VycmVudFN0eWxlSW5kZXgrKztcbiAgY29uc3QgdXBkYXRlZCA9IHVwZGF0ZUJpbmRpbmdEYXRhKFxuICAgICAgY29udGV4dCwgZGF0YSwgaW5kZXgsIHByb3AsIGJpbmRpbmdJbmRleCwgdmFsdWUsIGRlZmVyUmVnaXN0cmF0aW9uLCBmb3JjZVVwZGF0ZSk7XG4gIGlmICh1cGRhdGVkIHx8IGZvcmNlVXBkYXRlKSB7XG4gICAgc3R5bGVzQml0TWFzayB8PSAxIDw8IGluZGV4O1xuICB9XG59XG5cbi8qKlxuICogQ2FsbGVkIGVhY2ggdGltZSBhIGJpbmRpbmcgdmFsdWUgaGFzIGNoYW5nZWQgd2l0aGluIHRoZSBwcm92aWRlZCBgVFN0eWxpbmdDb250ZXh0YC5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIGlzIGRlc2lnbmVkIHRvIGJlIGNhbGxlZCBmcm9tIGB1cGRhdGVTdHlsZUJpbmRpbmdgIGFuZCBgdXBkYXRlQ2xhc3NCaW5kaW5nYC5cbiAqIElmIGNhbGxlZCBkdXJpbmcgdGhlIGZpcnN0IHVwZGF0ZSBwYXNzLCB0aGUgYmluZGluZyB3aWxsIGJlIHJlZ2lzdGVyZWQgaW4gdGhlIGNvbnRleHQuXG4gKiBJZiB0aGUgYmluZGluZyBkb2VzIGdldCByZWdpc3RlcmVkIGFuZCB0aGUgYGRlZmVyUmVnaXN0cmF0aW9uYCBmbGFnIGlzIHRydWUgdGhlbiB0aGVcbiAqIGJpbmRpbmcgZGF0YSB3aWxsIGJlIHF1ZXVlZCB1cCB1bnRpbCB0aGUgY29udGV4dCBpcyBsYXRlciBmbHVzaGVkIGluIGBhcHBseVN0eWxpbmdgLlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gd2lsbCBhbHNvIHVwZGF0ZSBiaW5kaW5nIHNsb3QgaW4gdGhlIHByb3ZpZGVkIGBMU3R5bGluZ0RhdGFgIHdpdGggdGhlXG4gKiBuZXcgYmluZGluZyBlbnRyeSAoaWYgaXQgaGFzIGNoYW5nZWQpLlxuICpcbiAqIEByZXR1cm5zIHdoZXRoZXIgb3Igbm90IHRoZSBiaW5kaW5nIHZhbHVlIHdhcyB1cGRhdGVkIGluIHRoZSBgTFN0eWxpbmdEYXRhYC5cbiAqL1xuZnVuY3Rpb24gdXBkYXRlQmluZGluZ0RhdGEoXG4gICAgY29udGV4dDogVFN0eWxpbmdDb250ZXh0LCBkYXRhOiBMU3R5bGluZ0RhdGEsIGNvdW50ZXJJbmRleDogbnVtYmVyLCBwcm9wOiBzdHJpbmcgfCBudWxsLFxuICAgIGJpbmRpbmdJbmRleDogbnVtYmVyLFxuICAgIHZhbHVlOiBzdHJpbmcgfCBTdHJpbmcgfCBudW1iZXIgfCBib29sZWFuIHwgbnVsbCB8IHVuZGVmaW5lZCB8IExTdHlsaW5nTWFwLFxuICAgIGRlZmVyUmVnaXN0cmF0aW9uPzogYm9vbGVhbiwgZm9yY2VVcGRhdGU/OiBib29sZWFuKTogYm9vbGVhbiB7XG4gIGlmICghaXNDb250ZXh0TG9ja2VkKGNvbnRleHQpKSB7XG4gICAgaWYgKGRlZmVyUmVnaXN0cmF0aW9uKSB7XG4gICAgICBkZWZlckJpbmRpbmdSZWdpc3RyYXRpb24oY29udGV4dCwgY291bnRlckluZGV4LCBwcm9wLCBiaW5kaW5nSW5kZXgpO1xuICAgIH0gZWxzZSB7XG4gICAgICBkZWZlcnJlZEJpbmRpbmdRdWV1ZS5sZW5ndGggJiYgZmx1c2hEZWZlcnJlZEJpbmRpbmdzKCk7XG5cbiAgICAgIC8vIHRoaXMgd2lsbCBvbmx5IGhhcHBlbiBkdXJpbmcgdGhlIGZpcnN0IHVwZGF0ZSBwYXNzIG9mIHRoZVxuICAgICAgLy8gY29udGV4dC4gVGhlIHJlYXNvbiB3aHkgd2UgY2FuJ3QgdXNlIGB0Tm9kZS5maXJzdFRlbXBsYXRlUGFzc2BcbiAgICAgIC8vIGhlcmUgaXMgYmVjYXVzZSBpdHMgbm90IGd1YXJhbnRlZWQgdG8gYmUgdHJ1ZSB3aGVuIHRoZSBmaXJzdFxuICAgICAgLy8gdXBkYXRlIHBhc3MgaXMgZXhlY3V0ZWQgKHJlbWVtYmVyIHRoYXQgYWxsIHN0eWxpbmcgaW5zdHJ1Y3Rpb25zXG4gICAgICAvLyBhcmUgcnVuIGluIHRoZSB1cGRhdGUgcGhhc2UsIGFuZCwgYXMgYSByZXN1bHQsIGFyZSBubyBtb3JlXG4gICAgICAvLyBzdHlsaW5nIGluc3RydWN0aW9ucyB0aGF0IGFyZSBydW4gaW4gdGhlIGNyZWF0aW9uIHBoYXNlKS5cbiAgICAgIHJlZ2lzdGVyQmluZGluZyhjb250ZXh0LCBjb3VudGVySW5kZXgsIHByb3AsIGJpbmRpbmdJbmRleCk7XG4gICAgfVxuICB9XG5cbiAgY29uc3QgY2hhbmdlZCA9IGZvcmNlVXBkYXRlIHx8IGhhc1ZhbHVlQ2hhbmdlZChkYXRhW2JpbmRpbmdJbmRleF0sIHZhbHVlKTtcbiAgaWYgKGNoYW5nZWQpIHtcbiAgICBkYXRhW2JpbmRpbmdJbmRleF0gPSB2YWx1ZTtcbiAgfVxuICByZXR1cm4gY2hhbmdlZDtcbn1cblxuLyoqXG4gKiBTY2hlZHVsZXMgYSBiaW5kaW5nIHJlZ2lzdHJhdGlvbiB0byBiZSBydW4gYXQgYSBsYXRlciBwb2ludC5cbiAqXG4gKiBUaGUgcmVhc29uaW5nIGZvciB0aGlzIGZlYXR1cmUgaXMgdG8gZW5zdXJlIHRoYXQgc3R5bGluZ1xuICogYmluZGluZ3MgYXJlIHJlZ2lzdGVyZWQgaW4gdGhlIGNvcnJlY3Qgb3JkZXIgZm9yIHdoZW5cbiAqIGRpcmVjdGl2ZXMvY29tcG9uZW50cyBoYXZlIGEgc3VwZXIvc3ViIGNsYXNzIGluaGVyaXRhbmNlXG4gKiBjaGFpbnMuIEVhY2ggZGlyZWN0aXZlJ3Mgc3R5bGluZyBiaW5kaW5ncyBtdXN0IGJlXG4gKiByZWdpc3RlcmVkIGludG8gdGhlIGNvbnRleHQgaW4gcmV2ZXJzZSBvcmRlci4gVGhlcmVmb3JlIGFsbFxuICogYmluZGluZ3Mgd2lsbCBiZSBidWZmZXJlZCBpbiByZXZlcnNlIG9yZGVyIGFuZCB0aGVuIGFwcGxpZWRcbiAqIGFmdGVyIHRoZSBpbmhlcml0YW5jZSBjaGFpbiBleGl0cy5cbiAqL1xuZnVuY3Rpb24gZGVmZXJCaW5kaW5nUmVnaXN0cmF0aW9uKFxuICAgIGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCwgY291bnRlckluZGV4OiBudW1iZXIsIHByb3A6IHN0cmluZyB8IG51bGwsIGJpbmRpbmdJbmRleDogbnVtYmVyKSB7XG4gIGRlZmVycmVkQmluZGluZ1F1ZXVlLnNwbGljZSgwLCAwLCBjb250ZXh0LCBjb3VudGVySW5kZXgsIHByb3AsIGJpbmRpbmdJbmRleCk7XG59XG5cbi8qKlxuICogRmx1c2hlcyB0aGUgY29sbGVjdGlvbiBvZiBkZWZlcnJlZCBiaW5kaW5ncyBhbmQgY2F1c2VzIGVhY2ggZW50cnlcbiAqIHRvIGJlIHJlZ2lzdGVyZWQgaW50byB0aGUgY29udGV4dC5cbiAqL1xuZnVuY3Rpb24gZmx1c2hEZWZlcnJlZEJpbmRpbmdzKCkge1xuICBsZXQgaSA9IDA7XG4gIHdoaWxlIChpIDwgZGVmZXJyZWRCaW5kaW5nUXVldWUubGVuZ3RoKSB7XG4gICAgY29uc3QgY29udGV4dCA9IGRlZmVycmVkQmluZGluZ1F1ZXVlW2krK10gYXMgVFN0eWxpbmdDb250ZXh0O1xuICAgIGNvbnN0IGNvdW50ID0gZGVmZXJyZWRCaW5kaW5nUXVldWVbaSsrXSBhcyBudW1iZXI7XG4gICAgY29uc3QgcHJvcCA9IGRlZmVycmVkQmluZGluZ1F1ZXVlW2krK10gYXMgc3RyaW5nO1xuICAgIGNvbnN0IGJpbmRpbmdJbmRleCA9IGRlZmVycmVkQmluZGluZ1F1ZXVlW2krK10gYXMgbnVtYmVyIHwgbnVsbDtcbiAgICByZWdpc3RlckJpbmRpbmcoY29udGV4dCwgY291bnQsIHByb3AsIGJpbmRpbmdJbmRleCk7XG4gIH1cbiAgZGVmZXJyZWRCaW5kaW5nUXVldWUubGVuZ3RoID0gMDtcbn1cblxuLyoqXG4gKiBSZWdpc3RlcnMgdGhlIHByb3ZpZGVkIGJpbmRpbmcgKHByb3AgKyBiaW5kaW5nSW5kZXgpIGludG8gdGhlIGNvbnRleHQuXG4gKlxuICogVGhpcyBmdW5jdGlvbiBpcyBzaGFyZWQgYmV0d2VlbiBiaW5kaW5ncyB0aGF0IGFyZSBhc3NpZ25lZCBpbW1lZGlhdGVseVxuICogKHZpYSBgdXBkYXRlQmluZGluZ0RhdGFgKSBhbmQgYXQgYSBkZWZlcnJlZCBzdGFnZS4gV2hlbiBjYWxsZWQsIGl0IHdpbGxcbiAqIGZpZ3VyZSBvdXQgZXhhY3RseSB3aGVyZSB0byBwbGFjZSB0aGUgYmluZGluZyBkYXRhIGluIHRoZSBjb250ZXh0LlxuICpcbiAqIEl0IGlzIG5lZWRlZCBiZWNhdXNlIGl0IHdpbGwgZWl0aGVyIHVwZGF0ZSBvciBpbnNlcnQgYSBzdHlsaW5nIHByb3BlcnR5XG4gKiBpbnRvIHRoZSBjb250ZXh0IGF0IHRoZSBjb3JyZWN0IHNwb3QuXG4gKlxuICogV2hlbiBjYWxsZWQsIG9uZSBvZiB0d28gdGhpbmdzIHdpbGwgaGFwcGVuOlxuICpcbiAqIDEpIElmIHRoZSBwcm9wZXJ0eSBhbHJlYWR5IGV4aXN0cyBpbiB0aGUgY29udGV4dCB0aGVuIGl0IHdpbGwganVzdCBhZGRcbiAqICAgIHRoZSBwcm92aWRlZCBgYmluZGluZ1ZhbHVlYCB0byB0aGUgZW5kIG9mIHRoZSBiaW5kaW5nIHNvdXJjZXMgcmVnaW9uXG4gKiAgICBmb3IgdGhhdCBwYXJ0aWN1bGFyIHByb3BlcnR5LlxuICpcbiAqICAgIC0gSWYgdGhlIGJpbmRpbmcgdmFsdWUgaXMgYSBudW1iZXIgdGhlbiBpdCB3aWxsIGJlIGFkZGVkIGFzIGEgbmV3XG4gKiAgICAgIGJpbmRpbmcgaW5kZXggc291cmNlIG5leHQgdG8gdGhlIG90aGVyIGJpbmRpbmcgc291cmNlcyBmb3IgdGhlIHByb3BlcnR5LlxuICpcbiAqICAgIC0gT3RoZXJ3aXNlLCBpZiB0aGUgYmluZGluZyB2YWx1ZSBpcyBhIHN0cmluZy9ib29sZWFuL251bGwgdHlwZSB0aGVuIGl0IHdpbGxcbiAqICAgICAgcmVwbGFjZSB0aGUgZGVmYXVsdCB2YWx1ZSBmb3IgdGhlIHByb3BlcnR5IGlmIHRoZSBkZWZhdWx0IHZhbHVlIGlzIGBudWxsYC5cbiAqXG4gKiAyKSBJZiB0aGUgcHJvcGVydHkgZG9lcyBub3QgZXhpc3QgdGhlbiBpdCB3aWxsIGJlIGluc2VydGVkIGludG8gdGhlIGNvbnRleHQuXG4gKiAgICBUaGUgc3R5bGluZyBjb250ZXh0IHJlbGllcyBvbiBhbGwgcHJvcGVydGllcyBiZWluZyBzdG9yZWQgaW4gYWxwaGFiZXRpY2FsXG4gKiAgICBvcmRlciwgc28gaXQga25vd3MgZXhhY3RseSB3aGVyZSB0byBzdG9yZSBpdC5cbiAqXG4gKiAgICBXaGVuIGluc2VydGVkLCBhIGRlZmF1bHQgYG51bGxgIHZhbHVlIGlzIGNyZWF0ZWQgZm9yIHRoZSBwcm9wZXJ0eSB3aGljaCBleGlzdHNcbiAqICAgIGFzIHRoZSBkZWZhdWx0IHZhbHVlIGZvciB0aGUgYmluZGluZy4gSWYgdGhlIGJpbmRpbmdWYWx1ZSBwcm9wZXJ0eSBpcyBpbnNlcnRlZFxuICogICAgYW5kIGl0IGlzIGVpdGhlciBhIHN0cmluZywgbnVtYmVyIG9yIG51bGwgdmFsdWUgdGhlbiB0aGF0IHdpbGwgcmVwbGFjZSB0aGUgZGVmYXVsdFxuICogICAgdmFsdWUuXG4gKlxuICogTm90ZSB0aGF0IHRoaXMgZnVuY3Rpb24gaXMgYWxzbyB1c2VkIGZvciBtYXAtYmFzZWQgc3R5bGluZyBiaW5kaW5ncy4gVGhleSBhcmUgdHJlYXRlZFxuICogbXVjaCB0aGUgc2FtZSBhcyBwcm9wLWJhc2VkIGJpbmRpbmdzLCBidXQsIGJlY2F1c2UgdGhleSBkbyBub3QgaGF2ZSBhIHByb3BlcnR5IHZhbHVlXG4gKiAoc2luY2UgaXQncyBhIG1hcCksIGFsbCBtYXAtYmFzZWQgZW50cmllcyBhcmUgc3RvcmVkIGluIGFuIGFscmVhZHkgcG9wdWxhdGVkIGFyZWEgb2ZcbiAqIHRoZSBjb250ZXh0IGF0IHRoZSB0b3AgKHdoaWNoIGlzIHJlc2VydmVkIGZvciBtYXAtYmFzZWQgZW50cmllcykuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZWdpc3RlckJpbmRpbmcoXG4gICAgY29udGV4dDogVFN0eWxpbmdDb250ZXh0LCBjb3VudElkOiBudW1iZXIsIHByb3A6IHN0cmluZyB8IG51bGwsXG4gICAgYmluZGluZ1ZhbHVlOiBudW1iZXIgfCBudWxsIHwgc3RyaW5nIHwgYm9vbGVhbikge1xuICAvLyBwcm9wLWJhc2VkIGJpbmRpbmdzIChlLmcgYDxkaXYgW3N0eWxlLndpZHRoXT1cIndcIiBbY2xhc3MuZm9vXT1cImZcIj5gKVxuICBpZiAocHJvcCkge1xuICAgIGxldCBmb3VuZCA9IGZhbHNlO1xuICAgIGxldCBpID0gZ2V0UHJvcFZhbHVlc1N0YXJ0UG9zaXRpb24oY29udGV4dCk7XG4gICAgd2hpbGUgKGkgPCBjb250ZXh0Lmxlbmd0aCkge1xuICAgICAgY29uc3QgdmFsdWVzQ291bnQgPSBnZXRWYWx1ZXNDb3VudChjb250ZXh0LCBpKTtcbiAgICAgIGNvbnN0IHAgPSBnZXRQcm9wKGNvbnRleHQsIGkpO1xuICAgICAgZm91bmQgPSBwcm9wIDw9IHA7XG4gICAgICBpZiAoZm91bmQpIHtcbiAgICAgICAgLy8gYWxsIHN0eWxlL2NsYXNzIGJpbmRpbmdzIGFyZSBzb3J0ZWQgYnkgcHJvcGVydHkgbmFtZVxuICAgICAgICBpZiAocHJvcCA8IHApIHtcbiAgICAgICAgICBhbGxvY2F0ZU5ld0NvbnRleHRFbnRyeShjb250ZXh0LCBpLCBwcm9wKTtcbiAgICAgICAgfVxuICAgICAgICBhZGRCaW5kaW5nSW50b0NvbnRleHQoY29udGV4dCwgZmFsc2UsIGksIGJpbmRpbmdWYWx1ZSwgY291bnRJZCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgaSArPSBUU3R5bGluZ0NvbnRleHRJbmRleC5CaW5kaW5nc1N0YXJ0T2Zmc2V0ICsgdmFsdWVzQ291bnQ7XG4gICAgfVxuXG4gICAgaWYgKCFmb3VuZCkge1xuICAgICAgYWxsb2NhdGVOZXdDb250ZXh0RW50cnkoY29udGV4dCwgY29udGV4dC5sZW5ndGgsIHByb3ApO1xuICAgICAgYWRkQmluZGluZ0ludG9Db250ZXh0KGNvbnRleHQsIGZhbHNlLCBpLCBiaW5kaW5nVmFsdWUsIGNvdW50SWQpO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICAvLyBtYXAtYmFzZWQgYmluZGluZ3MgKGUuZyBgPGRpdiBbc3R5bGVdPVwic1wiIFtjbGFzc109XCJ7Y2xhc3NOYW1lOnRydWV9XCI+YClcbiAgICAvLyB0aGVyZSBpcyBubyBuZWVkIHRvIGFsbG9jYXRlIHRoZSBtYXAtYmFzZWQgYmluZGluZyByZWdpb24gaW50byB0aGUgY29udGV4dFxuICAgIC8vIHNpbmNlIGl0IGlzIGFscmVhZHkgdGhlcmUgd2hlbiB0aGUgY29udGV4dCBpcyBmaXJzdCBjcmVhdGVkLlxuICAgIGFkZEJpbmRpbmdJbnRvQ29udGV4dChcbiAgICAgICAgY29udGV4dCwgdHJ1ZSwgVFN0eWxpbmdDb250ZXh0SW5kZXguTWFwQmluZGluZ3NQb3NpdGlvbiwgYmluZGluZ1ZhbHVlLCBjb3VudElkKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBhbGxvY2F0ZU5ld0NvbnRleHRFbnRyeShjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQsIGluZGV4OiBudW1iZXIsIHByb3A6IHN0cmluZykge1xuICAvLyAxLDI6IHNwbGljZSBpbmRleCBsb2NhdGlvbnNcbiAgLy8gMzogZWFjaCBlbnRyeSBnZXRzIGEgZ3VhcmQgbWFzayB2YWx1ZSB0aGF0IGlzIHVzZWQgdG8gY2hlY2sgYWdhaW5zdCB1cGRhdGVzXG4gIC8vIDQuIGVhY2ggZW50cnkgZ2V0cyBhIHNpemUgdmFsdWUgKHdoaWNoIGlzIGFsd2F5cyBvbmUgYmVjYXVzZSB0aGVyZSBpcyBhbHdheXMgYSBkZWZhdWx0IGJpbmRpbmdcbiAgLy8gdmFsdWUpXG4gIC8vIDUuIHRoZSBwcm9wZXJ0eSB0aGF0IGlzIGdldHRpbmcgYWxsb2NhdGVkIGludG8gdGhlIGNvbnRleHRcbiAgLy8gNi4gdGhlIGRlZmF1bHQgYmluZGluZyB2YWx1ZSAodXN1YWxseSBgbnVsbGApXG4gIGNvbnRleHQuc3BsaWNlKFxuICAgICAgaW5kZXgsIDAsIERFRkFVTFRfR1VBUkRfTUFTS19WQUxVRSwgREVGQVVMVF9TSVpFX1ZBTFVFLCBwcm9wLCBERUZBVUxUX0JJTkRJTkdfVkFMVUUpO1xufVxuXG4vKipcbiAqIEluc2VydHMgYSBuZXcgYmluZGluZyB2YWx1ZSBpbnRvIGEgc3R5bGluZyBwcm9wZXJ0eSB0dXBsZSBpbiB0aGUgYFRTdHlsaW5nQ29udGV4dGAuXG4gKlxuICogQSBiaW5kaW5nVmFsdWUgaXMgaW5zZXJ0ZWQgaW50byBhIGNvbnRleHQgZHVyaW5nIHRoZSBmaXJzdCB1cGRhdGUgcGFzc1xuICogb2YgYSB0ZW1wbGF0ZSBvciBob3N0IGJpbmRpbmdzIGZ1bmN0aW9uLiBXaGVuIHRoaXMgb2NjdXJzLCB0d28gdGhpbmdzXG4gKiBoYXBwZW46XG4gKlxuICogLSBJZiB0aGUgYmluZGluZ1ZhbHVlIHZhbHVlIGlzIGEgbnVtYmVyIHRoZW4gaXQgaXMgdHJlYXRlZCBhcyBhIGJpbmRpbmdJbmRleFxuICogICB2YWx1ZSAoYSBpbmRleCBpbiB0aGUgYExWaWV3YCkgYW5kIGl0IHdpbGwgYmUgaW5zZXJ0ZWQgbmV4dCB0byB0aGUgb3RoZXJcbiAqICAgYmluZGluZyBpbmRleCBlbnRyaWVzLlxuICpcbiAqIC0gT3RoZXJ3aXNlIHRoZSBiaW5kaW5nIHZhbHVlIHdpbGwgdXBkYXRlIHRoZSBkZWZhdWx0IHZhbHVlIGZvciB0aGUgcHJvcGVydHlcbiAqICAgYW5kIHRoaXMgd2lsbCBvbmx5IGhhcHBlbiBpZiB0aGUgZGVmYXVsdCB2YWx1ZSBpcyBgbnVsbGAuXG4gKlxuICogTm90ZSB0aGF0IHRoaXMgZnVuY3Rpb24gYWxzbyBoYW5kbGVzIG1hcC1iYXNlZCBiaW5kaW5ncyBhbmQgd2lsbCBpbnNlcnQgdGhlbVxuICogYXQgdGhlIHRvcCBvZiB0aGUgY29udGV4dC5cbiAqL1xuZnVuY3Rpb24gYWRkQmluZGluZ0ludG9Db250ZXh0KFxuICAgIGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCwgaXNNYXBCYXNlZDogYm9vbGVhbiwgaW5kZXg6IG51bWJlcixcbiAgICBiaW5kaW5nVmFsdWU6IG51bWJlciB8IHN0cmluZyB8IGJvb2xlYW4gfCBudWxsLCBjb3VudElkOiBudW1iZXIpIHtcbiAgY29uc3QgdmFsdWVzQ291bnQgPSBnZXRWYWx1ZXNDb3VudChjb250ZXh0LCBpbmRleCk7XG5cbiAgbGV0IGxhc3RWYWx1ZUluZGV4ID0gaW5kZXggKyBUU3R5bGluZ0NvbnRleHRJbmRleC5CaW5kaW5nc1N0YXJ0T2Zmc2V0ICsgdmFsdWVzQ291bnQ7XG4gIGlmICghaXNNYXBCYXNlZCkge1xuICAgIC8vIHByb3AtYmFzZWQgdmFsdWVzIGFsbCBoYXZlIGRlZmF1bHQgdmFsdWVzLCBidXQgbWFwLWJhc2VkIGVudHJpZXMgZG8gbm90LlxuICAgIC8vIHdlIHdhbnQgdG8gYWNjZXNzIHRoZSBpbmRleCBmb3IgdGhlIGRlZmF1bHQgdmFsdWUgaW4gdGhpcyBjYXNlIGFuZCBub3QganVzdFxuICAgIC8vIHRoZSBiaW5kaW5ncy4uLlxuICAgIGxhc3RWYWx1ZUluZGV4LS07XG4gIH1cblxuICBpZiAodHlwZW9mIGJpbmRpbmdWYWx1ZSA9PT0gJ251bWJlcicpIHtcbiAgICBjb250ZXh0LnNwbGljZShsYXN0VmFsdWVJbmRleCwgMCwgYmluZGluZ1ZhbHVlKTtcbiAgICAoY29udGV4dFtpbmRleCArIFRTdHlsaW5nQ29udGV4dEluZGV4LlZhbHVlc0NvdW50T2Zmc2V0XSBhcyBudW1iZXIpKys7XG4gICAgKGNvbnRleHRbaW5kZXggKyBUU3R5bGluZ0NvbnRleHRJbmRleC5HdWFyZE9mZnNldF0gYXMgbnVtYmVyKSB8PSAxIDw8IGNvdW50SWQ7XG4gIH0gZWxzZSBpZiAodHlwZW9mIGJpbmRpbmdWYWx1ZSA9PT0gJ3N0cmluZycgJiYgY29udGV4dFtsYXN0VmFsdWVJbmRleF0gPT0gbnVsbCkge1xuICAgIGNvbnRleHRbbGFzdFZhbHVlSW5kZXhdID0gYmluZGluZ1ZhbHVlO1xuICB9XG59XG5cbi8qKlxuICogQXBwbGllcyBhbGwgY2xhc3MgZW50cmllcyBpbiB0aGUgcHJvdmlkZWQgY29udGV4dCB0byB0aGUgcHJvdmlkZWQgZWxlbWVudCBhbmQgcmVzZXRzXG4gKiBhbnkgY291bnRlciBhbmQvb3IgYml0TWFzayB2YWx1ZXMgYXNzb2NpYXRlZCB3aXRoIGNsYXNzIGJpbmRpbmdzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gYXBwbHlDbGFzc2VzKFxuICAgIHJlbmRlcmVyOiBSZW5kZXJlcjMgfCBQcm9jZWR1cmFsUmVuZGVyZXIzIHwgbnVsbCwgZGF0YTogTFN0eWxpbmdEYXRhLCBjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQsXG4gICAgZWxlbWVudDogUkVsZW1lbnQsIGRpcmVjdGl2ZUluZGV4OiBudW1iZXIpIHtcbiAgaWYgKGFsbG93U3R5bGluZ0ZsdXNoKGNvbnRleHQsIGRpcmVjdGl2ZUluZGV4KSkge1xuICAgIGNvbnN0IGlzRmlyc3RQYXNzID0gIWlzQ29udGV4dExvY2tlZChjb250ZXh0KTtcbiAgICBpc0ZpcnN0UGFzcyAmJiBsb2NrQ29udGV4dChjb250ZXh0KTtcbiAgICBpZiAoY2xhc3Nlc0JpdE1hc2spIHtcbiAgICAgIGFwcGx5U3R5bGluZyhjb250ZXh0LCByZW5kZXJlciwgZWxlbWVudCwgZGF0YSwgY2xhc3Nlc0JpdE1hc2ssIHNldENsYXNzKTtcbiAgICAgIGNsYXNzZXNCaXRNYXNrID0gMDtcbiAgICB9XG4gICAgY3VycmVudENsYXNzSW5kZXggPSBTVFlMSU5HX0lOREVYX1NUQVJUX1ZBTFVFO1xuICB9XG59XG5cbi8qKlxuICogQXBwbGllcyBhbGwgc3R5bGUgZW50cmllcyBpbiB0aGUgcHJvdmlkZWQgY29udGV4dCB0byB0aGUgcHJvdmlkZWQgZWxlbWVudCBhbmQgcmVzZXRzXG4gKiBhbnkgY291bnRlciBhbmQvb3IgYml0TWFzayB2YWx1ZXMgYXNzb2NpYXRlZCB3aXRoIHN0eWxlIGJpbmRpbmdzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gYXBwbHlTdHlsZXMoXG4gICAgcmVuZGVyZXI6IFJlbmRlcmVyMyB8IFByb2NlZHVyYWxSZW5kZXJlcjMgfCBudWxsLCBkYXRhOiBMU3R5bGluZ0RhdGEsIGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCxcbiAgICBlbGVtZW50OiBSRWxlbWVudCwgZGlyZWN0aXZlSW5kZXg6IG51bWJlcikge1xuICBpZiAoYWxsb3dTdHlsaW5nRmx1c2goY29udGV4dCwgZGlyZWN0aXZlSW5kZXgpKSB7XG4gICAgY29uc3QgaXNGaXJzdFBhc3MgPSAhaXNDb250ZXh0TG9ja2VkKGNvbnRleHQpO1xuICAgIGlzRmlyc3RQYXNzICYmIGxvY2tDb250ZXh0KGNvbnRleHQpO1xuICAgIGlmIChzdHlsZXNCaXRNYXNrKSB7XG4gICAgICBhcHBseVN0eWxpbmcoY29udGV4dCwgcmVuZGVyZXIsIGVsZW1lbnQsIGRhdGEsIHN0eWxlc0JpdE1hc2ssIHNldFN0eWxlKTtcbiAgICAgIHN0eWxlc0JpdE1hc2sgPSAwO1xuICAgIH1cbiAgICBjdXJyZW50U3R5bGVJbmRleCA9IFNUWUxJTkdfSU5ERVhfU1RBUlRfVkFMVUU7XG4gIH1cbn1cblxuLyoqXG4gKiBSdW5zIHRocm91Z2ggdGhlIHByb3ZpZGVkIHN0eWxpbmcgY29udGV4dCBhbmQgYXBwbGllcyBlYWNoIHZhbHVlIHRvXG4gKiB0aGUgcHJvdmlkZWQgZWxlbWVudCAodmlhIHRoZSByZW5kZXJlcikgaWYgb25lIG9yIG1vcmUgdmFsdWVzIGFyZSBwcmVzZW50LlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gd2lsbCBpdGVyYXRlIG92ZXIgYWxsIGVudHJpZXMgcHJlc2VudCBpbiB0aGUgcHJvdmlkZWRcbiAqIGBUU3R5bGluZ0NvbnRleHRgIGFycmF5IChib3RoIHByb3AtYmFzZWQgYW5kIG1hcC1iYXNlZCBiaW5kaW5ncykuLVxuICpcbiAqIEVhY2ggZW50cnksIHdpdGhpbiB0aGUgYFRTdHlsaW5nQ29udGV4dGAgYXJyYXksIGlzIHN0b3JlZCBhbHBoYWJldGljYWxseVxuICogYW5kIHRoaXMgbWVhbnMgdGhhdCBlYWNoIHByb3AvdmFsdWUgZW50cnkgd2lsbCBiZSBhcHBsaWVkIGluIG9yZGVyXG4gKiAoc28gbG9uZyBhcyBpdCBpcyBtYXJrZWQgZGlydHkgaW4gdGhlIHByb3ZpZGVkIGBiaXRNYXNrYCB2YWx1ZSkuXG4gKlxuICogSWYgdGhlcmUgYXJlIGFueSBtYXAtYmFzZWQgZW50cmllcyBwcmVzZW50ICh3aGljaCBhcmUgYXBwbGllZCB0byB0aGVcbiAqIGVsZW1lbnQgdmlhIHRoZSBgW3N0eWxlXWAgYW5kIGBbY2xhc3NdYCBiaW5kaW5ncykgdGhlbiB0aG9zZSBlbnRyaWVzXG4gKiB3aWxsIGJlIGFwcGxpZWQgYXMgd2VsbC4gSG93ZXZlciwgdGhlIGNvZGUgZm9yIHRoYXQgaXMgbm90IGFwYXJ0IG9mXG4gKiB0aGlzIGZ1bmN0aW9uLiBJbnN0ZWFkLCBlYWNoIHRpbWUgYSBwcm9wZXJ0eSBpcyB2aXNpdGVkLCB0aGVuIHRoZVxuICogY29kZSBiZWxvdyB3aWxsIGNhbGwgYW4gZXh0ZXJuYWwgZnVuY3Rpb24gY2FsbGVkIGBzdHlsaW5nTWFwc1N5bmNGbmBcbiAqIGFuZCwgaWYgcHJlc2VudCwgaXQgd2lsbCBrZWVwIHRoZSBhcHBsaWNhdGlvbiBvZiBzdHlsaW5nIHZhbHVlcyBpblxuICogbWFwLWJhc2VkIGJpbmRpbmdzIHVwIHRvIHN5bmMgd2l0aCB0aGUgYXBwbGljYXRpb24gb2YgcHJvcC1iYXNlZFxuICogYmluZGluZ3MuXG4gKlxuICogVmlzaXQgYHN0eWxpbmdfbmV4dC9tYXBfYmFzZWRfYmluZGluZ3MudHNgIHRvIGxlYXJuIG1vcmUgYWJvdXQgaG93IHRoZVxuICogYWxnb3JpdGhtIHdvcmtzIGZvciBtYXAtYmFzZWQgc3R5bGluZyBiaW5kaW5ncy5cbiAqXG4gKiBOb3RlIHRoYXQgdGhpcyBmdW5jdGlvbiBpcyBub3QgZGVzaWduZWQgdG8gYmUgY2FsbGVkIGluIGlzb2xhdGlvbiAodXNlXG4gKiBgYXBwbHlDbGFzc2VzYCBhbmQgYGFwcGx5U3R5bGVzYCB0byBhY3R1YWxseSBhcHBseSBzdHlsaW5nIHZhbHVlcykuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhcHBseVN0eWxpbmcoXG4gICAgY29udGV4dDogVFN0eWxpbmdDb250ZXh0LCByZW5kZXJlcjogUmVuZGVyZXIzIHwgUHJvY2VkdXJhbFJlbmRlcmVyMyB8IG51bGwsIGVsZW1lbnQ6IFJFbGVtZW50LFxuICAgIGJpbmRpbmdEYXRhOiBMU3R5bGluZ0RhdGEsIGJpdE1hc2tWYWx1ZTogbnVtYmVyIHwgYm9vbGVhbiwgYXBwbHlTdHlsaW5nRm46IEFwcGx5U3R5bGluZ0ZuKSB7XG4gIGRlZmVycmVkQmluZGluZ1F1ZXVlLmxlbmd0aCAmJiBmbHVzaERlZmVycmVkQmluZGluZ3MoKTtcblxuICBjb25zdCBiaXRNYXNrID0gbm9ybWFsaXplQml0TWFza1ZhbHVlKGJpdE1hc2tWYWx1ZSk7XG4gIGNvbnN0IHN0eWxpbmdNYXBzU3luY0ZuID0gZ2V0U3R5bGluZ01hcHNTeW5jRm4oKTtcbiAgY29uc3QgbWFwc0d1YXJkTWFzayA9IGdldEd1YXJkTWFzayhjb250ZXh0LCBUU3R5bGluZ0NvbnRleHRJbmRleC5NYXBCaW5kaW5nc1Bvc2l0aW9uKTtcbiAgY29uc3QgYXBwbHlBbGxWYWx1ZXMgPSAoYml0TWFzayAmIG1hcHNHdWFyZE1hc2spID4gMDtcbiAgY29uc3QgbWFwc01vZGUgPVxuICAgICAgYXBwbHlBbGxWYWx1ZXMgPyBTdHlsaW5nTWFwc1N5bmNNb2RlLkFwcGx5QWxsVmFsdWVzIDogU3R5bGluZ01hcHNTeW5jTW9kZS5UcmF2ZXJzZVZhbHVlcztcblxuICBsZXQgaSA9IGdldFByb3BWYWx1ZXNTdGFydFBvc2l0aW9uKGNvbnRleHQpO1xuICB3aGlsZSAoaSA8IGNvbnRleHQubGVuZ3RoKSB7XG4gICAgY29uc3QgdmFsdWVzQ291bnQgPSBnZXRWYWx1ZXNDb3VudChjb250ZXh0LCBpKTtcbiAgICBjb25zdCBndWFyZE1hc2sgPSBnZXRHdWFyZE1hc2soY29udGV4dCwgaSk7XG4gICAgaWYgKGJpdE1hc2sgJiBndWFyZE1hc2spIHtcbiAgICAgIGxldCB2YWx1ZUFwcGxpZWQgPSBmYWxzZTtcbiAgICAgIGNvbnN0IHByb3AgPSBnZXRQcm9wKGNvbnRleHQsIGkpO1xuICAgICAgY29uc3QgdmFsdWVzQ291bnRVcFRvRGVmYXVsdCA9IHZhbHVlc0NvdW50IC0gMTtcbiAgICAgIGNvbnN0IGRlZmF1bHRWYWx1ZSA9IGdldEJpbmRpbmdWYWx1ZShjb250ZXh0LCBpLCB2YWx1ZXNDb3VudFVwVG9EZWZhdWx0KSBhcyBzdHJpbmcgfCBudWxsO1xuXG4gICAgICAvLyBjYXNlIDE6IGFwcGx5IHByb3AtYmFzZWQgdmFsdWVzXG4gICAgICAvLyB0cnkgdG8gYXBwbHkgdGhlIGJpbmRpbmcgdmFsdWVzIGFuZCBzZWUgaWYgYSBub24tbnVsbFxuICAgICAgLy8gdmFsdWUgZ2V0cyBzZXQgZm9yIHRoZSBzdHlsaW5nIGJpbmRpbmdcbiAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgdmFsdWVzQ291bnRVcFRvRGVmYXVsdDsgaisrKSB7XG4gICAgICAgIGNvbnN0IGJpbmRpbmdJbmRleCA9IGdldEJpbmRpbmdWYWx1ZShjb250ZXh0LCBpLCBqKSBhcyBudW1iZXI7XG4gICAgICAgIGNvbnN0IHZhbHVlVG9BcHBseSA9IGJpbmRpbmdEYXRhW2JpbmRpbmdJbmRleF07XG4gICAgICAgIGlmIChpc1N0eWxpbmdWYWx1ZURlZmluZWQodmFsdWVUb0FwcGx5KSkge1xuICAgICAgICAgIGFwcGx5U3R5bGluZ0ZuKHJlbmRlcmVyLCBlbGVtZW50LCBwcm9wLCB2YWx1ZVRvQXBwbHksIGJpbmRpbmdJbmRleCk7XG4gICAgICAgICAgdmFsdWVBcHBsaWVkID0gdHJ1ZTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBjYXNlIDI6IGFwcGx5IG1hcC1iYXNlZCB2YWx1ZXNcbiAgICAgIC8vIHRyYXZlcnNlIHRocm91Z2ggZWFjaCBtYXAtYmFzZWQgc3R5bGluZyBiaW5kaW5nIGFuZCB1cGRhdGUgYWxsIHZhbHVlcyB1cCB0b1xuICAgICAgLy8gdGhlIHByb3ZpZGVkIGBwcm9wYCB2YWx1ZS4gSWYgdGhlIHByb3BlcnR5IHdhcyBub3QgYXBwbGllZCBpbiB0aGUgbG9vcCBhYm92ZVxuICAgICAgLy8gdGhlbiBpdCB3aWxsIGJlIGF0dGVtcHRlZCB0byBiZSBhcHBsaWVkIGluIHRoZSBtYXBzIHN5bmMgY29kZSBiZWxvdy5cbiAgICAgIGlmIChzdHlsaW5nTWFwc1N5bmNGbikge1xuICAgICAgICAvLyBkZXRlcm1pbmUgd2hldGhlciBvciBub3QgdG8gYXBwbHkgdGhlIHRhcmdldCBwcm9wZXJ0eSBvciB0byBza2lwIGl0XG4gICAgICAgIGNvbnN0IG1vZGUgPSBtYXBzTW9kZSB8ICh2YWx1ZUFwcGxpZWQgPyBTdHlsaW5nTWFwc1N5bmNNb2RlLlNraXBUYXJnZXRQcm9wIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFN0eWxpbmdNYXBzU3luY01vZGUuQXBwbHlUYXJnZXRQcm9wKTtcbiAgICAgICAgY29uc3QgdmFsdWVBcHBsaWVkV2l0aGluTWFwID0gc3R5bGluZ01hcHNTeW5jRm4oXG4gICAgICAgICAgICBjb250ZXh0LCByZW5kZXJlciwgZWxlbWVudCwgYmluZGluZ0RhdGEsIGFwcGx5U3R5bGluZ0ZuLCBtb2RlLCBwcm9wLCBkZWZhdWx0VmFsdWUpO1xuICAgICAgICB2YWx1ZUFwcGxpZWQgPSB2YWx1ZUFwcGxpZWQgfHwgdmFsdWVBcHBsaWVkV2l0aGluTWFwO1xuICAgICAgfVxuXG4gICAgICAvLyBjYXNlIDM6IGFwcGx5IHRoZSBkZWZhdWx0IHZhbHVlXG4gICAgICAvLyBpZiB0aGUgdmFsdWUgaGFzIG5vdCB5ZXQgYmVlbiBhcHBsaWVkIHRoZW4gYSB0cnV0aHkgdmFsdWUgZG9lcyBub3QgZXhpc3QgaW4gdGhlXG4gICAgICAvLyBwcm9wLWJhc2VkIG9yIG1hcC1iYXNlZCBiaW5kaW5ncyBjb2RlLiBJZiBhbmQgd2hlbiB0aGlzIGhhcHBlbnMsIGp1c3QgYXBwbHkgdGhlXG4gICAgICAvLyBkZWZhdWx0IHZhbHVlIChldmVuIGlmIHRoZSBkZWZhdWx0IHZhbHVlIGlzIGBudWxsYCkuXG4gICAgICBpZiAoIXZhbHVlQXBwbGllZCkge1xuICAgICAgICBhcHBseVN0eWxpbmdGbihyZW5kZXJlciwgZWxlbWVudCwgcHJvcCwgZGVmYXVsdFZhbHVlKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpICs9IFRTdHlsaW5nQ29udGV4dEluZGV4LkJpbmRpbmdzU3RhcnRPZmZzZXQgKyB2YWx1ZXNDb3VudDtcbiAgfVxuXG4gIC8vIHRoZSBtYXAtYmFzZWQgc3R5bGluZyBlbnRyaWVzIG1heSBoYXZlIG5vdCBhcHBsaWVkIGFsbCB0aGVpclxuICAvLyB2YWx1ZXMuIEZvciB0aGlzIHJlYXNvbiwgb25lIG1vcmUgY2FsbCB0byB0aGUgc3luYyBmdW5jdGlvblxuICAvLyBuZWVkcyB0byBiZSBpc3N1ZWQgYXQgdGhlIGVuZC5cbiAgaWYgKHN0eWxpbmdNYXBzU3luY0ZuKSB7XG4gICAgc3R5bGluZ01hcHNTeW5jRm4oY29udGV4dCwgcmVuZGVyZXIsIGVsZW1lbnQsIGJpbmRpbmdEYXRhLCBhcHBseVN0eWxpbmdGbiwgbWFwc01vZGUpO1xuICB9XG59XG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZUJpdE1hc2tWYWx1ZSh2YWx1ZTogbnVtYmVyIHwgYm9vbGVhbik6IG51bWJlciB7XG4gIC8vIGlmIHBhc3MgPT4gYXBwbHkgYWxsIHZhbHVlcyAoLTEgaW1wbGllcyB0aGF0IGFsbCBiaXRzIGFyZSBmbGlwcGVkIHRvIHRydWUpXG4gIGlmICh2YWx1ZSA9PT0gdHJ1ZSkgcmV0dXJuIC0xO1xuXG4gIC8vIGlmIHBhc3MgPT4gc2tpcCBhbGwgdmFsdWVzXG4gIGlmICh2YWx1ZSA9PT0gZmFsc2UpIHJldHVybiAwO1xuXG4gIC8vIHJldHVybiB0aGUgYml0IG1hc2sgdmFsdWUgYXMgaXNcbiAgcmV0dXJuIHZhbHVlO1xufVxuXG5sZXQgX2FjdGl2ZVN0eWxpbmdNYXBBcHBseUZuOiBTeW5jU3R5bGluZ01hcHNGbnxudWxsID0gbnVsbDtcbmV4cG9ydCBmdW5jdGlvbiBnZXRTdHlsaW5nTWFwc1N5bmNGbigpIHtcbiAgcmV0dXJuIF9hY3RpdmVTdHlsaW5nTWFwQXBwbHlGbjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNldFN0eWxpbmdNYXBzU3luY0ZuKGZuOiBTeW5jU3R5bGluZ01hcHNGbikge1xuICBfYWN0aXZlU3R5bGluZ01hcEFwcGx5Rm4gPSBmbjtcbn1cblxuLyoqXG4gKiBBc3NpZ25zIGEgc3R5bGUgdmFsdWUgdG8gYSBzdHlsZSBwcm9wZXJ0eSBmb3IgdGhlIGdpdmVuIGVsZW1lbnQuXG4gKi9cbmNvbnN0IHNldFN0eWxlOiBBcHBseVN0eWxpbmdGbiA9XG4gICAgKHJlbmRlcmVyOiBSZW5kZXJlcjMgfCBudWxsLCBuYXRpdmU6IGFueSwgcHJvcDogc3RyaW5nLCB2YWx1ZTogc3RyaW5nIHwgbnVsbCkgPT4ge1xuICAgICAgaWYgKHZhbHVlKSB7XG4gICAgICAgIC8vIG9wYWNpdHksIHotaW5kZXggYW5kIGZsZXhib3ggYWxsIGhhdmUgbnVtYmVyIHZhbHVlc1xuICAgICAgICAvLyBhbmQgdGhlc2UgbmVlZCB0byBiZSBjb252ZXJ0ZWQgaW50byBzdHJpbmdzIHNvIHRoYXRcbiAgICAgICAgLy8gdGhleSBjYW4gYmUgYXNzaWduZWQgcHJvcGVybHkuXG4gICAgICAgIHZhbHVlID0gdmFsdWUudG9TdHJpbmcoKTtcbiAgICAgICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlclNldFN0eWxlKys7XG4gICAgICAgIHJlbmRlcmVyICYmIGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSA/XG4gICAgICAgICAgICByZW5kZXJlci5zZXRTdHlsZShuYXRpdmUsIHByb3AsIHZhbHVlLCBSZW5kZXJlclN0eWxlRmxhZ3MzLkRhc2hDYXNlKSA6XG4gICAgICAgICAgICBuYXRpdmUuc3R5bGUuc2V0UHJvcGVydHkocHJvcCwgdmFsdWUpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlclJlbW92ZVN0eWxlKys7XG4gICAgICAgIHJlbmRlcmVyICYmIGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSA/XG4gICAgICAgICAgICByZW5kZXJlci5yZW1vdmVTdHlsZShuYXRpdmUsIHByb3AsIFJlbmRlcmVyU3R5bGVGbGFnczMuRGFzaENhc2UpIDpcbiAgICAgICAgICAgIG5hdGl2ZS5zdHlsZS5yZW1vdmVQcm9wZXJ0eShwcm9wKTtcbiAgICAgIH1cbiAgICB9O1xuXG4vKipcbiAqIEFkZHMvcmVtb3ZlcyB0aGUgcHJvdmlkZWQgY2xhc3NOYW1lIHZhbHVlIHRvIHRoZSBwcm92aWRlZCBlbGVtZW50LlxuICovXG5jb25zdCBzZXRDbGFzczogQXBwbHlTdHlsaW5nRm4gPVxuICAgIChyZW5kZXJlcjogUmVuZGVyZXIzIHwgbnVsbCwgbmF0aXZlOiBhbnksIGNsYXNzTmFtZTogc3RyaW5nLCB2YWx1ZTogYW55KSA9PiB7XG4gICAgICBpZiAoY2xhc3NOYW1lICE9PSAnJykge1xuICAgICAgICBpZiAodmFsdWUpIHtcbiAgICAgICAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyQWRkQ2xhc3MrKztcbiAgICAgICAgICByZW5kZXJlciAmJiBpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikgPyByZW5kZXJlci5hZGRDbGFzcyhuYXRpdmUsIGNsYXNzTmFtZSkgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hdGl2ZS5jbGFzc0xpc3QuYWRkKGNsYXNzTmFtZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlclJlbW92ZUNsYXNzKys7XG4gICAgICAgICAgcmVuZGVyZXIgJiYgaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpID8gcmVuZGVyZXIucmVtb3ZlQ2xhc3MobmF0aXZlLCBjbGFzc05hbWUpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYXRpdmUuY2xhc3NMaXN0LnJlbW92ZShjbGFzc05hbWUpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfTtcbiJdfQ==