/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
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
 * @type {?}
 */
const DEFAULT_BINDING_VALUE = null;
/** @type {?} */
const DEFAULT_SIZE_VALUE = 1;
// The first bit value reflects a map-based binding value's bit.
// The reason why it's always activated for every entry in the map
// is so that if any map-binding values update then all other prop
// based bindings will pass the guard check automatically without
// any extra code or flags.
/** @type {?} */
export const DEFAULT_GUARD_MASK_VALUE = 0b1;
/** @type {?} */
const STYLING_INDEX_FOR_MAP_BINDING = 0;
/** @type {?} */
const STYLING_INDEX_START_VALUE = 1;
// the values below are global to all styling code below. Each value
// will either increment or mutate each time a styling instruction is
// executed. Do not modify the values below.
/** @type {?} */
let currentStyleIndex = STYLING_INDEX_START_VALUE;
/** @type {?} */
let currentClassIndex = STYLING_INDEX_START_VALUE;
/** @type {?} */
let stylesBitMask = 0;
/** @type {?} */
let classesBitMask = 0;
/** @type {?} */
let deferredBindingQueue = [];
/**
 * Visits a class-based binding and updates the new value (if changed).
 *
 * This function is called each time a class-based styling instruction
 * is executed. It's important that it's always called (even if the value
 * has not changed) so that the inner counter index value is incremented.
 * This way, each instruction is always guaranteed to get the same counter
 * state each time it's called (which then allows the `TStylingContext`
 * and the bit mask values to be in sync).
 * @param {?} context
 * @param {?} data
 * @param {?} prop
 * @param {?} bindingIndex
 * @param {?} value
 * @param {?} deferRegistration
 * @param {?=} forceUpdate
 * @return {?}
 */
export function updateClassBinding(context, data, prop, bindingIndex, value, deferRegistration, forceUpdate) {
    /** @type {?} */
    const isMapBased = !prop;
    /** @type {?} */
    const index = isMapBased ? STYLING_INDEX_FOR_MAP_BINDING : currentClassIndex++;
    /** @type {?} */
    const updated = updateBindingData(context, data, index, prop, bindingIndex, value, deferRegistration, forceUpdate);
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
 * @param {?} context
 * @param {?} data
 * @param {?} prop
 * @param {?} bindingIndex
 * @param {?} value
 * @param {?} deferRegistration
 * @param {?=} forceUpdate
 * @return {?}
 */
export function updateStyleBinding(context, data, prop, bindingIndex, value, deferRegistration, forceUpdate) {
    /** @type {?} */
    const isMapBased = !prop;
    /** @type {?} */
    const index = isMapBased ? STYLING_INDEX_FOR_MAP_BINDING : currentStyleIndex++;
    /** @type {?} */
    const updated = updateBindingData(context, data, index, prop, bindingIndex, value, deferRegistration, forceUpdate);
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
 * @param {?} context
 * @param {?} data
 * @param {?} counterIndex
 * @param {?} prop
 * @param {?} bindingIndex
 * @param {?} value
 * @param {?=} deferRegistration
 * @param {?=} forceUpdate
 * @return {?} whether or not the binding value was updated in the `LStylingData`.
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
    /** @type {?} */
    const changed = forceUpdate || hasValueChanged(data[bindingIndex], value);
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
 * @param {?} context
 * @param {?} counterIndex
 * @param {?} prop
 * @param {?} bindingIndex
 * @return {?}
 */
function deferBindingRegistration(context, counterIndex, prop, bindingIndex) {
    deferredBindingQueue.splice(0, 0, context, counterIndex, prop, bindingIndex);
}
/**
 * Flushes the collection of deferred bindings and causes each entry
 * to be registered into the context.
 * @return {?}
 */
function flushDeferredBindings() {
    /** @type {?} */
    let i = 0;
    while (i < deferredBindingQueue.length) {
        /** @type {?} */
        const context = (/** @type {?} */ (deferredBindingQueue[i++]));
        /** @type {?} */
        const count = (/** @type {?} */ (deferredBindingQueue[i++]));
        /** @type {?} */
        const prop = (/** @type {?} */ (deferredBindingQueue[i++]));
        /** @type {?} */
        const bindingIndex = (/** @type {?} */ (deferredBindingQueue[i++]));
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
 * @param {?} context
 * @param {?} countId
 * @param {?} prop
 * @param {?} bindingValue
 * @return {?}
 */
export function registerBinding(context, countId, prop, bindingValue) {
    // prop-based bindings (e.g `<div [style.width]="w" [class.foo]="f">`)
    if (prop) {
        /** @type {?} */
        let found = false;
        /** @type {?} */
        let i = getPropValuesStartPosition(context);
        while (i < context.length) {
            /** @type {?} */
            const valuesCount = getValuesCount(context, i);
            /** @type {?} */
            const p = getProp(context, i);
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
/**
 * @param {?} context
 * @param {?} index
 * @param {?} prop
 * @return {?}
 */
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
 * @param {?} context
 * @param {?} isMapBased
 * @param {?} index
 * @param {?} bindingValue
 * @param {?} countId
 * @return {?}
 */
function addBindingIntoContext(context, isMapBased, index, bindingValue, countId) {
    /** @type {?} */
    const valuesCount = getValuesCount(context, index);
    /** @type {?} */
    let lastValueIndex = index + 3 /* BindingsStartOffset */ + valuesCount;
    if (!isMapBased) {
        // prop-based values all have default values, but map-based entries do not.
        // we want to access the index for the default value in this case and not just
        // the bindings...
        lastValueIndex--;
    }
    if (typeof bindingValue === 'number') {
        context.splice(lastValueIndex, 0, bindingValue);
        ((/** @type {?} */ (context[index + 1 /* ValuesCountOffset */])))++;
        ((/** @type {?} */ (context[index + 0 /* GuardOffset */]))) |= 1 << countId;
    }
    else if (typeof bindingValue === 'string' && context[lastValueIndex] == null) {
        context[lastValueIndex] = bindingValue;
    }
}
/**
 * Applies all class entries in the provided context to the provided element and resets
 * any counter and/or bitMask values associated with class bindings.
 * @param {?} renderer
 * @param {?} data
 * @param {?} context
 * @param {?} element
 * @param {?} directiveIndex
 * @return {?}
 */
export function applyClasses(renderer, data, context, element, directiveIndex) {
    if (allowStylingFlush(context, directiveIndex)) {
        /** @type {?} */
        const isFirstPass = !isContextLocked(context);
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
 * @param {?} renderer
 * @param {?} data
 * @param {?} context
 * @param {?} element
 * @param {?} directiveIndex
 * @return {?}
 */
export function applyStyles(renderer, data, context, element, directiveIndex) {
    if (allowStylingFlush(context, directiveIndex)) {
        /** @type {?} */
        const isFirstPass = !isContextLocked(context);
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
 * @param {?} context
 * @param {?} renderer
 * @param {?} element
 * @param {?} bindingData
 * @param {?} bitMaskValue
 * @param {?} applyStylingFn
 * @return {?}
 */
export function applyStyling(context, renderer, element, bindingData, bitMaskValue, applyStylingFn) {
    deferredBindingQueue.length && flushDeferredBindings();
    /** @type {?} */
    const bitMask = normalizeBitMaskValue(bitMaskValue);
    /** @type {?} */
    const stylingMapsSyncFn = getStylingMapsSyncFn();
    /** @type {?} */
    const mapsGuardMask = getGuardMask(context, 2 /* MapBindingsPosition */);
    /** @type {?} */
    const applyAllValues = (bitMask & mapsGuardMask) > 0;
    /** @type {?} */
    const mapsMode = applyAllValues ? 1 /* ApplyAllValues */ : 0 /* TraverseValues */;
    /** @type {?} */
    let i = getPropValuesStartPosition(context);
    while (i < context.length) {
        /** @type {?} */
        const valuesCount = getValuesCount(context, i);
        /** @type {?} */
        const guardMask = getGuardMask(context, i);
        if (bitMask & guardMask) {
            /** @type {?} */
            let valueApplied = false;
            /** @type {?} */
            const prop = getProp(context, i);
            /** @type {?} */
            const valuesCountUpToDefault = valuesCount - 1;
            /** @type {?} */
            const defaultValue = (/** @type {?} */ (getBindingValue(context, i, valuesCountUpToDefault)));
            // case 1: apply prop-based values
            // try to apply the binding values and see if a non-null
            // value gets set for the styling binding
            for (let j = 0; j < valuesCountUpToDefault; j++) {
                /** @type {?} */
                const bindingIndex = (/** @type {?} */ (getBindingValue(context, i, j)));
                /** @type {?} */
                const valueToApply = bindingData[bindingIndex];
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
                /** @type {?} */
                const mode = mapsMode | (valueApplied ? 4 /* SkipTargetProp */ :
                    2 /* ApplyTargetProp */);
                /** @type {?} */
                const valueAppliedWithinMap = stylingMapsSyncFn(context, renderer, element, bindingData, applyStylingFn, mode, prop, defaultValue);
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
/**
 * @param {?} value
 * @return {?}
 */
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
/** @type {?} */
let _activeStylingMapApplyFn = null;
/**
 * @return {?}
 */
export function getStylingMapsSyncFn() {
    return _activeStylingMapApplyFn;
}
/**
 * @param {?} fn
 * @return {?}
 */
export function setStylingMapsSyncFn(fn) {
    _activeStylingMapApplyFn = fn;
}
/**
 * Assigns a style value to a style property for the given element.
 * @type {?}
 */
const setStyle = (/**
 * @param {?} renderer
 * @param {?} native
 * @param {?} prop
 * @param {?} value
 * @return {?}
 */
(renderer, native, prop, value) => {
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
});
/**
 * Adds/removes the provided className value to the provided element.
 * @type {?}
 */
const setClass = (/**
 * @param {?} renderer
 * @param {?} native
 * @param {?} className
 * @param {?} value
 * @return {?}
 */
(renderer, native, className, value) => {
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
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmluZGluZ3MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL3N0eWxpbmdfbmV4dC9iaW5kaW5ncy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQU9BLE9BQU8sRUFBMkMsbUJBQW1CLEVBQUUsb0JBQW9CLEVBQUMsTUFBTSx3QkFBd0IsQ0FBQztBQUczSCxPQUFPLEVBQUMsaUJBQWlCLEVBQUUsZUFBZSxFQUFFLFlBQVksRUFBRSxPQUFPLEVBQUUsMEJBQTBCLEVBQUUsY0FBYyxFQUFFLGVBQWUsRUFBRSxlQUFlLEVBQUUscUJBQXFCLEVBQUUsV0FBVyxFQUFDLE1BQU0sUUFBUSxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztNQXNCN0wscUJBQXFCLEdBQUcsSUFBSTs7TUFDNUIsa0JBQWtCLEdBQUcsQ0FBQzs7Ozs7OztBQU81QixNQUFNLE9BQU8sd0JBQXdCLEdBQUcsR0FBRzs7TUFDckMsNkJBQTZCLEdBQUcsQ0FBQzs7TUFDakMseUJBQXlCLEdBQUcsQ0FBQzs7Ozs7SUFLL0IsaUJBQWlCLEdBQUcseUJBQXlCOztJQUM3QyxpQkFBaUIsR0FBRyx5QkFBeUI7O0lBQzdDLGFBQWEsR0FBRyxDQUFDOztJQUNqQixjQUFjLEdBQUcsQ0FBQzs7SUFDbEIsb0JBQW9CLEdBQWlELEVBQUU7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFZM0UsTUFBTSxVQUFVLGtCQUFrQixDQUM5QixPQUF3QixFQUFFLElBQWtCLEVBQUUsSUFBbUIsRUFBRSxZQUFvQixFQUN2RixLQUF3RCxFQUFFLGlCQUEwQixFQUNwRixXQUFxQjs7VUFDakIsVUFBVSxHQUFHLENBQUMsSUFBSTs7VUFDbEIsS0FBSyxHQUFHLFVBQVUsQ0FBQyxDQUFDLENBQUMsNkJBQTZCLENBQUMsQ0FBQyxDQUFDLGlCQUFpQixFQUFFOztVQUN4RSxPQUFPLEdBQUcsaUJBQWlCLENBQzdCLE9BQU8s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QUFDLENBQUM7S0FDdkM7QUFDSCxDQUFDLENBQUE7Ozs7O01BS0MsUUFBUTs7Ozs7OztBQUNWLENBQUMsUUFBMEIsRUFBRSxNQUFXLEVBQUUsU0FBaUIsRUFBRSxLQUFVLEVBQUUsRUFBRTtJQUN6RSxJQUFJLFNBQVMsS0FBSyxFQUFFLEVBQUU7UUFDcEIsSUFBSSxLQUFLLEVBQUU7WUFDVCxTQUFTLElBQUksU0FBUyxDQUFDLGdCQUFnQixFQUFFLENBQUM7WUFDMUMsUUFBUSxJQUFJLG9CQUFvQixDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLE1BQU0sRUFBRSxTQUFTLENBQUMsQ0FBQyxDQUFDO2dCQUN0QyxNQUFNLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQztTQUM5RTthQUFNO1lBQ0wsU0FBUyxJQUFJLFNBQVMsQ0FBQyxtQkFBbUIsRUFBRSxDQUFDO1lBQzdDLFFBQVEsSUFBSSxvQkFBb0IsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQyxNQUFNLEVBQUUsU0FBUyxDQUFDLENBQUMsQ0FBQztnQkFDekMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLENBQUM7U0FDakY7S0FDRjtBQUNILENBQUMsQ0FBQSIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuKiBAbGljZW5zZVxuKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbipcbiogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuKi9cbmltcG9ydCB7UHJvY2VkdXJhbFJlbmRlcmVyMywgUkVsZW1lbnQsIFJlbmRlcmVyMywgUmVuZGVyZXJTdHlsZUZsYWdzMywgaXNQcm9jZWR1cmFsUmVuZGVyZXJ9IGZyb20gJy4uL2ludGVyZmFjZXMvcmVuZGVyZXInO1xuXG5pbXBvcnQge0FwcGx5U3R5bGluZ0ZuLCBMU3R5bGluZ0RhdGEsIExTdHlsaW5nTWFwLCBTdHlsaW5nTWFwc1N5bmNNb2RlLCBTeW5jU3R5bGluZ01hcHNGbiwgVFN0eWxpbmdDb250ZXh0LCBUU3R5bGluZ0NvbnRleHRJbmRleH0gZnJvbSAnLi9pbnRlcmZhY2VzJztcbmltcG9ydCB7YWxsb3dTdHlsaW5nRmx1c2gsIGdldEJpbmRpbmdWYWx1ZSwgZ2V0R3VhcmRNYXNrLCBnZXRQcm9wLCBnZXRQcm9wVmFsdWVzU3RhcnRQb3NpdGlvbiwgZ2V0VmFsdWVzQ291bnQsIGhhc1ZhbHVlQ2hhbmdlZCwgaXNDb250ZXh0TG9ja2VkLCBpc1N0eWxpbmdWYWx1ZURlZmluZWQsIGxvY2tDb250ZXh0fSBmcm9tICcuL3V0aWwnO1xuXG5cbi8qKlxuICogLS0tLS0tLS1cbiAqXG4gKiBUaGlzIGZpbGUgY29udGFpbnMgdGhlIGNvcmUgbG9naWMgZm9yIHN0eWxpbmcgaW4gQW5ndWxhci5cbiAqXG4gKiBBbGwgc3R5bGluZyBiaW5kaW5ncyAoaS5lLiBgW3N0eWxlXWAsIGBbc3R5bGUucHJvcF1gLCBgW2NsYXNzXWAgYW5kIGBbY2xhc3MubmFtZV1gKVxuICogd2lsbCBoYXZlIHRoZWlyIHZhbHVlcyBiZSBhcHBsaWVkIHRocm91Z2ggdGhlIGxvZ2ljIGluIHRoaXMgZmlsZS5cbiAqXG4gKiBXaGVuIGEgYmluZGluZyBpcyBlbmNvdW50ZXJlZCAoZS5nLiBgPGRpdiBbc3R5bGUud2lkdGhdPVwid1wiPmApIHRoZW5cbiAqIHRoZSBiaW5kaW5nIGRhdGEgd2lsbCBiZSBwb3B1bGF0ZWQgaW50byBhIGBUU3R5bGluZ0NvbnRleHRgIGRhdGEtc3RydWN0dXJlLlxuICogVGhlcmUgaXMgb25seSBvbmUgYFRTdHlsaW5nQ29udGV4dGAgcGVyIGBUTm9kZWAgYW5kIGVhY2ggZWxlbWVudCBpbnN0YW5jZVxuICogd2lsbCB1cGRhdGUgaXRzIHN0eWxlL2NsYXNzIGJpbmRpbmcgdmFsdWVzIGluIGNvbmNlcnQgd2l0aCB0aGUgc3R5bGluZ1xuICogY29udGV4dC5cbiAqXG4gKiBUbyBsZWFybiBtb3JlIGFib3V0IHRoZSBhbGdvcml0aG0gc2VlIGBUU3R5bGluZ0NvbnRleHRgLlxuICpcbiAqIC0tLS0tLS0tXG4gKi9cblxuY29uc3QgREVGQVVMVF9CSU5ESU5HX1ZBTFVFID0gbnVsbDtcbmNvbnN0IERFRkFVTFRfU0laRV9WQUxVRSA9IDE7XG5cbi8vIFRoZSBmaXJzdCBiaXQgdmFsdWUgcmVmbGVjdHMgYSBtYXAtYmFzZWQgYmluZGluZyB2YWx1ZSdzIGJpdC5cbi8vIFRoZSByZWFzb24gd2h5IGl0J3MgYWx3YXlzIGFjdGl2YXRlZCBmb3IgZXZlcnkgZW50cnkgaW4gdGhlIG1hcFxuLy8gaXMgc28gdGhhdCBpZiBhbnkgbWFwLWJpbmRpbmcgdmFsdWVzIHVwZGF0ZSB0aGVuIGFsbCBvdGhlciBwcm9wXG4vLyBiYXNlZCBiaW5kaW5ncyB3aWxsIHBhc3MgdGhlIGd1YXJkIGNoZWNrIGF1dG9tYXRpY2FsbHkgd2l0aG91dFxuLy8gYW55IGV4dHJhIGNvZGUgb3IgZmxhZ3MuXG5leHBvcnQgY29uc3QgREVGQVVMVF9HVUFSRF9NQVNLX1ZBTFVFID0gMGIxO1xuY29uc3QgU1RZTElOR19JTkRFWF9GT1JfTUFQX0JJTkRJTkcgPSAwO1xuY29uc3QgU1RZTElOR19JTkRFWF9TVEFSVF9WQUxVRSA9IDE7XG5cbi8vIHRoZSB2YWx1ZXMgYmVsb3cgYXJlIGdsb2JhbCB0byBhbGwgc3R5bGluZyBjb2RlIGJlbG93LiBFYWNoIHZhbHVlXG4vLyB3aWxsIGVpdGhlciBpbmNyZW1lbnQgb3IgbXV0YXRlIGVhY2ggdGltZSBhIHN0eWxpbmcgaW5zdHJ1Y3Rpb24gaXNcbi8vIGV4ZWN1dGVkLiBEbyBub3QgbW9kaWZ5IHRoZSB2YWx1ZXMgYmVsb3cuXG5sZXQgY3VycmVudFN0eWxlSW5kZXggPSBTVFlMSU5HX0lOREVYX1NUQVJUX1ZBTFVFO1xubGV0IGN1cnJlbnRDbGFzc0luZGV4ID0gU1RZTElOR19JTkRFWF9TVEFSVF9WQUxVRTtcbmxldCBzdHlsZXNCaXRNYXNrID0gMDtcbmxldCBjbGFzc2VzQml0TWFzayA9IDA7XG5sZXQgZGVmZXJyZWRCaW5kaW5nUXVldWU6IChUU3R5bGluZ0NvbnRleHQgfCBudW1iZXIgfCBzdHJpbmcgfCBudWxsKVtdID0gW107XG5cbi8qKlxuICogVmlzaXRzIGEgY2xhc3MtYmFzZWQgYmluZGluZyBhbmQgdXBkYXRlcyB0aGUgbmV3IHZhbHVlIChpZiBjaGFuZ2VkKS5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIGlzIGNhbGxlZCBlYWNoIHRpbWUgYSBjbGFzcy1iYXNlZCBzdHlsaW5nIGluc3RydWN0aW9uXG4gKiBpcyBleGVjdXRlZC4gSXQncyBpbXBvcnRhbnQgdGhhdCBpdCdzIGFsd2F5cyBjYWxsZWQgKGV2ZW4gaWYgdGhlIHZhbHVlXG4gKiBoYXMgbm90IGNoYW5nZWQpIHNvIHRoYXQgdGhlIGlubmVyIGNvdW50ZXIgaW5kZXggdmFsdWUgaXMgaW5jcmVtZW50ZWQuXG4gKiBUaGlzIHdheSwgZWFjaCBpbnN0cnVjdGlvbiBpcyBhbHdheXMgZ3VhcmFudGVlZCB0byBnZXQgdGhlIHNhbWUgY291bnRlclxuICogc3RhdGUgZWFjaCB0aW1lIGl0J3MgY2FsbGVkICh3aGljaCB0aGVuIGFsbG93cyB0aGUgYFRTdHlsaW5nQ29udGV4dGBcbiAqIGFuZCB0aGUgYml0IG1hc2sgdmFsdWVzIHRvIGJlIGluIHN5bmMpLlxuICovXG5leHBvcnQgZnVuY3Rpb24gdXBkYXRlQ2xhc3NCaW5kaW5nKFxuICAgIGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCwgZGF0YTogTFN0eWxpbmdEYXRhLCBwcm9wOiBzdHJpbmcgfCBudWxsLCBiaW5kaW5nSW5kZXg6IG51bWJlcixcbiAgICB2YWx1ZTogYm9vbGVhbiB8IHN0cmluZyB8IG51bGwgfCB1bmRlZmluZWQgfCBMU3R5bGluZ01hcCwgZGVmZXJSZWdpc3RyYXRpb246IGJvb2xlYW4sXG4gICAgZm9yY2VVcGRhdGU/OiBib29sZWFuKTogdm9pZCB7XG4gIGNvbnN0IGlzTWFwQmFzZWQgPSAhcHJvcDtcbiAgY29uc3QgaW5kZXggPSBpc01hcEJhc2VkID8gU1RZTElOR19JTkRFWF9GT1JfTUFQX0JJTkRJTkcgOiBjdXJyZW50Q2xhc3NJbmRleCsrO1xuICBjb25zdCB1cGRhdGVkID0gdXBkYXRlQmluZGluZ0RhdGEoXG4gICAgICBjb250ZXh0LCBkYXRhLCBpbmRleCwgcHJvcCwgYmluZGluZ0luZGV4LCB2YWx1ZSwgZGVmZXJSZWdpc3RyYXRpb24sIGZvcmNlVXBkYXRlKTtcbiAgaWYgKHVwZGF0ZWQgfHwgZm9yY2VVcGRhdGUpIHtcbiAgICBjbGFzc2VzQml0TWFzayB8PSAxIDw8IGluZGV4O1xuICB9XG59XG5cbi8qKlxuICogVmlzaXRzIGEgc3R5bGUtYmFzZWQgYmluZGluZyBhbmQgdXBkYXRlcyB0aGUgbmV3IHZhbHVlIChpZiBjaGFuZ2VkKS5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIGlzIGNhbGxlZCBlYWNoIHRpbWUgYSBzdHlsZS1iYXNlZCBzdHlsaW5nIGluc3RydWN0aW9uXG4gKiBpcyBleGVjdXRlZC4gSXQncyBpbXBvcnRhbnQgdGhhdCBpdCdzIGFsd2F5cyBjYWxsZWQgKGV2ZW4gaWYgdGhlIHZhbHVlXG4gKiBoYXMgbm90IGNoYW5nZWQpIHNvIHRoYXQgdGhlIGlubmVyIGNvdW50ZXIgaW5kZXggdmFsdWUgaXMgaW5jcmVtZW50ZWQuXG4gKiBUaGlzIHdheSwgZWFjaCBpbnN0cnVjdGlvbiBpcyBhbHdheXMgZ3VhcmFudGVlZCB0byBnZXQgdGhlIHNhbWUgY291bnRlclxuICogc3RhdGUgZWFjaCB0aW1lIGl0J3MgY2FsbGVkICh3aGljaCB0aGVuIGFsbG93cyB0aGUgYFRTdHlsaW5nQ29udGV4dGBcbiAqIGFuZCB0aGUgYml0IG1hc2sgdmFsdWVzIHRvIGJlIGluIHN5bmMpLlxuICovXG5leHBvcnQgZnVuY3Rpb24gdXBkYXRlU3R5bGVCaW5kaW5nKFxuICAgIGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCwgZGF0YTogTFN0eWxpbmdEYXRhLCBwcm9wOiBzdHJpbmcgfCBudWxsLCBiaW5kaW5nSW5kZXg6IG51bWJlcixcbiAgICB2YWx1ZTogU3RyaW5nIHwgc3RyaW5nIHwgbnVtYmVyIHwgbnVsbCB8IHVuZGVmaW5lZCB8IExTdHlsaW5nTWFwLCBkZWZlclJlZ2lzdHJhdGlvbjogYm9vbGVhbixcbiAgICBmb3JjZVVwZGF0ZT86IGJvb2xlYW4pOiB2b2lkIHtcbiAgY29uc3QgaXNNYXBCYXNlZCA9ICFwcm9wO1xuICBjb25zdCBpbmRleCA9IGlzTWFwQmFzZWQgPyBTVFlMSU5HX0lOREVYX0ZPUl9NQVBfQklORElORyA6IGN1cnJlbnRTdHlsZUluZGV4Kys7XG4gIGNvbnN0IHVwZGF0ZWQgPSB1cGRhdGVCaW5kaW5nRGF0YShcbiAgICAgIGNvbnRleHQsIGRhdGEsIGluZGV4LCBwcm9wLCBiaW5kaW5nSW5kZXgsIHZhbHVlLCBkZWZlclJlZ2lzdHJhdGlvbiwgZm9yY2VVcGRhdGUpO1xuICBpZiAodXBkYXRlZCB8fCBmb3JjZVVwZGF0ZSkge1xuICAgIHN0eWxlc0JpdE1hc2sgfD0gMSA8PCBpbmRleDtcbiAgfVxufVxuXG4vKipcbiAqIENhbGxlZCBlYWNoIHRpbWUgYSBiaW5kaW5nIHZhbHVlIGhhcyBjaGFuZ2VkIHdpdGhpbiB0aGUgcHJvdmlkZWQgYFRTdHlsaW5nQ29udGV4dGAuXG4gKlxuICogVGhpcyBmdW5jdGlvbiBpcyBkZXNpZ25lZCB0byBiZSBjYWxsZWQgZnJvbSBgdXBkYXRlU3R5bGVCaW5kaW5nYCBhbmQgYHVwZGF0ZUNsYXNzQmluZGluZ2AuXG4gKiBJZiBjYWxsZWQgZHVyaW5nIHRoZSBmaXJzdCB1cGRhdGUgcGFzcywgdGhlIGJpbmRpbmcgd2lsbCBiZSByZWdpc3RlcmVkIGluIHRoZSBjb250ZXh0LlxuICogSWYgdGhlIGJpbmRpbmcgZG9lcyBnZXQgcmVnaXN0ZXJlZCBhbmQgdGhlIGBkZWZlclJlZ2lzdHJhdGlvbmAgZmxhZyBpcyB0cnVlIHRoZW4gdGhlXG4gKiBiaW5kaW5nIGRhdGEgd2lsbCBiZSBxdWV1ZWQgdXAgdW50aWwgdGhlIGNvbnRleHQgaXMgbGF0ZXIgZmx1c2hlZCBpbiBgYXBwbHlTdHlsaW5nYC5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIHdpbGwgYWxzbyB1cGRhdGUgYmluZGluZyBzbG90IGluIHRoZSBwcm92aWRlZCBgTFN0eWxpbmdEYXRhYCB3aXRoIHRoZVxuICogbmV3IGJpbmRpbmcgZW50cnkgKGlmIGl0IGhhcyBjaGFuZ2VkKS5cbiAqXG4gKiBAcmV0dXJucyB3aGV0aGVyIG9yIG5vdCB0aGUgYmluZGluZyB2YWx1ZSB3YXMgdXBkYXRlZCBpbiB0aGUgYExTdHlsaW5nRGF0YWAuXG4gKi9cbmZ1bmN0aW9uIHVwZGF0ZUJpbmRpbmdEYXRhKFxuICAgIGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCwgZGF0YTogTFN0eWxpbmdEYXRhLCBjb3VudGVySW5kZXg6IG51bWJlciwgcHJvcDogc3RyaW5nIHwgbnVsbCxcbiAgICBiaW5kaW5nSW5kZXg6IG51bWJlcixcbiAgICB2YWx1ZTogc3RyaW5nIHwgU3RyaW5nIHwgbnVtYmVyIHwgYm9vbGVhbiB8IG51bGwgfCB1bmRlZmluZWQgfCBMU3R5bGluZ01hcCxcbiAgICBkZWZlclJlZ2lzdHJhdGlvbj86IGJvb2xlYW4sIGZvcmNlVXBkYXRlPzogYm9vbGVhbik6IGJvb2xlYW4ge1xuICBpZiAoIWlzQ29udGV4dExvY2tlZChjb250ZXh0KSkge1xuICAgIGlmIChkZWZlclJlZ2lzdHJhdGlvbikge1xuICAgICAgZGVmZXJCaW5kaW5nUmVnaXN0cmF0aW9uKGNvbnRleHQsIGNvdW50ZXJJbmRleCwgcHJvcCwgYmluZGluZ0luZGV4KTtcbiAgICB9IGVsc2Uge1xuICAgICAgZGVmZXJyZWRCaW5kaW5nUXVldWUubGVuZ3RoICYmIGZsdXNoRGVmZXJyZWRCaW5kaW5ncygpO1xuXG4gICAgICAvLyB0aGlzIHdpbGwgb25seSBoYXBwZW4gZHVyaW5nIHRoZSBmaXJzdCB1cGRhdGUgcGFzcyBvZiB0aGVcbiAgICAgIC8vIGNvbnRleHQuIFRoZSByZWFzb24gd2h5IHdlIGNhbid0IHVzZSBgdE5vZGUuZmlyc3RUZW1wbGF0ZVBhc3NgXG4gICAgICAvLyBoZXJlIGlzIGJlY2F1c2UgaXRzIG5vdCBndWFyYW50ZWVkIHRvIGJlIHRydWUgd2hlbiB0aGUgZmlyc3RcbiAgICAgIC8vIHVwZGF0ZSBwYXNzIGlzIGV4ZWN1dGVkIChyZW1lbWJlciB0aGF0IGFsbCBzdHlsaW5nIGluc3RydWN0aW9uc1xuICAgICAgLy8gYXJlIHJ1biBpbiB0aGUgdXBkYXRlIHBoYXNlLCBhbmQsIGFzIGEgcmVzdWx0LCBhcmUgbm8gbW9yZVxuICAgICAgLy8gc3R5bGluZyBpbnN0cnVjdGlvbnMgdGhhdCBhcmUgcnVuIGluIHRoZSBjcmVhdGlvbiBwaGFzZSkuXG4gICAgICByZWdpc3RlckJpbmRpbmcoY29udGV4dCwgY291bnRlckluZGV4LCBwcm9wLCBiaW5kaW5nSW5kZXgpO1xuICAgIH1cbiAgfVxuXG4gIGNvbnN0IGNoYW5nZWQgPSBmb3JjZVVwZGF0ZSB8fCBoYXNWYWx1ZUNoYW5nZWQoZGF0YVtiaW5kaW5nSW5kZXhdLCB2YWx1ZSk7XG4gIGlmIChjaGFuZ2VkKSB7XG4gICAgZGF0YVtiaW5kaW5nSW5kZXhdID0gdmFsdWU7XG4gIH1cbiAgcmV0dXJuIGNoYW5nZWQ7XG59XG5cbi8qKlxuICogU2NoZWR1bGVzIGEgYmluZGluZyByZWdpc3RyYXRpb24gdG8gYmUgcnVuIGF0IGEgbGF0ZXIgcG9pbnQuXG4gKlxuICogVGhlIHJlYXNvbmluZyBmb3IgdGhpcyBmZWF0dXJlIGlzIHRvIGVuc3VyZSB0aGF0IHN0eWxpbmdcbiAqIGJpbmRpbmdzIGFyZSByZWdpc3RlcmVkIGluIHRoZSBjb3JyZWN0IG9yZGVyIGZvciB3aGVuXG4gKiBkaXJlY3RpdmVzL2NvbXBvbmVudHMgaGF2ZSBhIHN1cGVyL3N1YiBjbGFzcyBpbmhlcml0YW5jZVxuICogY2hhaW5zLiBFYWNoIGRpcmVjdGl2ZSdzIHN0eWxpbmcgYmluZGluZ3MgbXVzdCBiZVxuICogcmVnaXN0ZXJlZCBpbnRvIHRoZSBjb250ZXh0IGluIHJldmVyc2Ugb3JkZXIuIFRoZXJlZm9yZSBhbGxcbiAqIGJpbmRpbmdzIHdpbGwgYmUgYnVmZmVyZWQgaW4gcmV2ZXJzZSBvcmRlciBhbmQgdGhlbiBhcHBsaWVkXG4gKiBhZnRlciB0aGUgaW5oZXJpdGFuY2UgY2hhaW4gZXhpdHMuXG4gKi9cbmZ1bmN0aW9uIGRlZmVyQmluZGluZ1JlZ2lzdHJhdGlvbihcbiAgICBjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQsIGNvdW50ZXJJbmRleDogbnVtYmVyLCBwcm9wOiBzdHJpbmcgfCBudWxsLCBiaW5kaW5nSW5kZXg6IG51bWJlcikge1xuICBkZWZlcnJlZEJpbmRpbmdRdWV1ZS5zcGxpY2UoMCwgMCwgY29udGV4dCwgY291bnRlckluZGV4LCBwcm9wLCBiaW5kaW5nSW5kZXgpO1xufVxuXG4vKipcbiAqIEZsdXNoZXMgdGhlIGNvbGxlY3Rpb24gb2YgZGVmZXJyZWQgYmluZGluZ3MgYW5kIGNhdXNlcyBlYWNoIGVudHJ5XG4gKiB0byBiZSByZWdpc3RlcmVkIGludG8gdGhlIGNvbnRleHQuXG4gKi9cbmZ1bmN0aW9uIGZsdXNoRGVmZXJyZWRCaW5kaW5ncygpIHtcbiAgbGV0IGkgPSAwO1xuICB3aGlsZSAoaSA8IGRlZmVycmVkQmluZGluZ1F1ZXVlLmxlbmd0aCkge1xuICAgIGNvbnN0IGNvbnRleHQgPSBkZWZlcnJlZEJpbmRpbmdRdWV1ZVtpKytdIGFzIFRTdHlsaW5nQ29udGV4dDtcbiAgICBjb25zdCBjb3VudCA9IGRlZmVycmVkQmluZGluZ1F1ZXVlW2krK10gYXMgbnVtYmVyO1xuICAgIGNvbnN0IHByb3AgPSBkZWZlcnJlZEJpbmRpbmdRdWV1ZVtpKytdIGFzIHN0cmluZztcbiAgICBjb25zdCBiaW5kaW5nSW5kZXggPSBkZWZlcnJlZEJpbmRpbmdRdWV1ZVtpKytdIGFzIG51bWJlciB8IG51bGw7XG4gICAgcmVnaXN0ZXJCaW5kaW5nKGNvbnRleHQsIGNvdW50LCBwcm9wLCBiaW5kaW5nSW5kZXgpO1xuICB9XG4gIGRlZmVycmVkQmluZGluZ1F1ZXVlLmxlbmd0aCA9IDA7XG59XG5cbi8qKlxuICogUmVnaXN0ZXJzIHRoZSBwcm92aWRlZCBiaW5kaW5nIChwcm9wICsgYmluZGluZ0luZGV4KSBpbnRvIHRoZSBjb250ZXh0LlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gaXMgc2hhcmVkIGJldHdlZW4gYmluZGluZ3MgdGhhdCBhcmUgYXNzaWduZWQgaW1tZWRpYXRlbHlcbiAqICh2aWEgYHVwZGF0ZUJpbmRpbmdEYXRhYCkgYW5kIGF0IGEgZGVmZXJyZWQgc3RhZ2UuIFdoZW4gY2FsbGVkLCBpdCB3aWxsXG4gKiBmaWd1cmUgb3V0IGV4YWN0bHkgd2hlcmUgdG8gcGxhY2UgdGhlIGJpbmRpbmcgZGF0YSBpbiB0aGUgY29udGV4dC5cbiAqXG4gKiBJdCBpcyBuZWVkZWQgYmVjYXVzZSBpdCB3aWxsIGVpdGhlciB1cGRhdGUgb3IgaW5zZXJ0IGEgc3R5bGluZyBwcm9wZXJ0eVxuICogaW50byB0aGUgY29udGV4dCBhdCB0aGUgY29ycmVjdCBzcG90LlxuICpcbiAqIFdoZW4gY2FsbGVkLCBvbmUgb2YgdHdvIHRoaW5ncyB3aWxsIGhhcHBlbjpcbiAqXG4gKiAxKSBJZiB0aGUgcHJvcGVydHkgYWxyZWFkeSBleGlzdHMgaW4gdGhlIGNvbnRleHQgdGhlbiBpdCB3aWxsIGp1c3QgYWRkXG4gKiAgICB0aGUgcHJvdmlkZWQgYGJpbmRpbmdWYWx1ZWAgdG8gdGhlIGVuZCBvZiB0aGUgYmluZGluZyBzb3VyY2VzIHJlZ2lvblxuICogICAgZm9yIHRoYXQgcGFydGljdWxhciBwcm9wZXJ0eS5cbiAqXG4gKiAgICAtIElmIHRoZSBiaW5kaW5nIHZhbHVlIGlzIGEgbnVtYmVyIHRoZW4gaXQgd2lsbCBiZSBhZGRlZCBhcyBhIG5ld1xuICogICAgICBiaW5kaW5nIGluZGV4IHNvdXJjZSBuZXh0IHRvIHRoZSBvdGhlciBiaW5kaW5nIHNvdXJjZXMgZm9yIHRoZSBwcm9wZXJ0eS5cbiAqXG4gKiAgICAtIE90aGVyd2lzZSwgaWYgdGhlIGJpbmRpbmcgdmFsdWUgaXMgYSBzdHJpbmcvYm9vbGVhbi9udWxsIHR5cGUgdGhlbiBpdCB3aWxsXG4gKiAgICAgIHJlcGxhY2UgdGhlIGRlZmF1bHQgdmFsdWUgZm9yIHRoZSBwcm9wZXJ0eSBpZiB0aGUgZGVmYXVsdCB2YWx1ZSBpcyBgbnVsbGAuXG4gKlxuICogMikgSWYgdGhlIHByb3BlcnR5IGRvZXMgbm90IGV4aXN0IHRoZW4gaXQgd2lsbCBiZSBpbnNlcnRlZCBpbnRvIHRoZSBjb250ZXh0LlxuICogICAgVGhlIHN0eWxpbmcgY29udGV4dCByZWxpZXMgb24gYWxsIHByb3BlcnRpZXMgYmVpbmcgc3RvcmVkIGluIGFscGhhYmV0aWNhbFxuICogICAgb3JkZXIsIHNvIGl0IGtub3dzIGV4YWN0bHkgd2hlcmUgdG8gc3RvcmUgaXQuXG4gKlxuICogICAgV2hlbiBpbnNlcnRlZCwgYSBkZWZhdWx0IGBudWxsYCB2YWx1ZSBpcyBjcmVhdGVkIGZvciB0aGUgcHJvcGVydHkgd2hpY2ggZXhpc3RzXG4gKiAgICBhcyB0aGUgZGVmYXVsdCB2YWx1ZSBmb3IgdGhlIGJpbmRpbmcuIElmIHRoZSBiaW5kaW5nVmFsdWUgcHJvcGVydHkgaXMgaW5zZXJ0ZWRcbiAqICAgIGFuZCBpdCBpcyBlaXRoZXIgYSBzdHJpbmcsIG51bWJlciBvciBudWxsIHZhbHVlIHRoZW4gdGhhdCB3aWxsIHJlcGxhY2UgdGhlIGRlZmF1bHRcbiAqICAgIHZhbHVlLlxuICpcbiAqIE5vdGUgdGhhdCB0aGlzIGZ1bmN0aW9uIGlzIGFsc28gdXNlZCBmb3IgbWFwLWJhc2VkIHN0eWxpbmcgYmluZGluZ3MuIFRoZXkgYXJlIHRyZWF0ZWRcbiAqIG11Y2ggdGhlIHNhbWUgYXMgcHJvcC1iYXNlZCBiaW5kaW5ncywgYnV0LCBiZWNhdXNlIHRoZXkgZG8gbm90IGhhdmUgYSBwcm9wZXJ0eSB2YWx1ZVxuICogKHNpbmNlIGl0J3MgYSBtYXApLCBhbGwgbWFwLWJhc2VkIGVudHJpZXMgYXJlIHN0b3JlZCBpbiBhbiBhbHJlYWR5IHBvcHVsYXRlZCBhcmVhIG9mXG4gKiB0aGUgY29udGV4dCBhdCB0aGUgdG9wICh3aGljaCBpcyByZXNlcnZlZCBmb3IgbWFwLWJhc2VkIGVudHJpZXMpLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVnaXN0ZXJCaW5kaW5nKFxuICAgIGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCwgY291bnRJZDogbnVtYmVyLCBwcm9wOiBzdHJpbmcgfCBudWxsLFxuICAgIGJpbmRpbmdWYWx1ZTogbnVtYmVyIHwgbnVsbCB8IHN0cmluZyB8IGJvb2xlYW4pIHtcbiAgLy8gcHJvcC1iYXNlZCBiaW5kaW5ncyAoZS5nIGA8ZGl2IFtzdHlsZS53aWR0aF09XCJ3XCIgW2NsYXNzLmZvb109XCJmXCI+YClcbiAgaWYgKHByb3ApIHtcbiAgICBsZXQgZm91bmQgPSBmYWxzZTtcbiAgICBsZXQgaSA9IGdldFByb3BWYWx1ZXNTdGFydFBvc2l0aW9uKGNvbnRleHQpO1xuICAgIHdoaWxlIChpIDwgY29udGV4dC5sZW5ndGgpIHtcbiAgICAgIGNvbnN0IHZhbHVlc0NvdW50ID0gZ2V0VmFsdWVzQ291bnQoY29udGV4dCwgaSk7XG4gICAgICBjb25zdCBwID0gZ2V0UHJvcChjb250ZXh0LCBpKTtcbiAgICAgIGZvdW5kID0gcHJvcCA8PSBwO1xuICAgICAgaWYgKGZvdW5kKSB7XG4gICAgICAgIC8vIGFsbCBzdHlsZS9jbGFzcyBiaW5kaW5ncyBhcmUgc29ydGVkIGJ5IHByb3BlcnR5IG5hbWVcbiAgICAgICAgaWYgKHByb3AgPCBwKSB7XG4gICAgICAgICAgYWxsb2NhdGVOZXdDb250ZXh0RW50cnkoY29udGV4dCwgaSwgcHJvcCk7XG4gICAgICAgIH1cbiAgICAgICAgYWRkQmluZGluZ0ludG9Db250ZXh0KGNvbnRleHQsIGZhbHNlLCBpLCBiaW5kaW5nVmFsdWUsIGNvdW50SWQpO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGkgKz0gVFN0eWxpbmdDb250ZXh0SW5kZXguQmluZGluZ3NTdGFydE9mZnNldCArIHZhbHVlc0NvdW50O1xuICAgIH1cblxuICAgIGlmICghZm91bmQpIHtcbiAgICAgIGFsbG9jYXRlTmV3Q29udGV4dEVudHJ5KGNvbnRleHQsIGNvbnRleHQubGVuZ3RoLCBwcm9wKTtcbiAgICAgIGFkZEJpbmRpbmdJbnRvQ29udGV4dChjb250ZXh0LCBmYWxzZSwgaSwgYmluZGluZ1ZhbHVlLCBjb3VudElkKTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgLy8gbWFwLWJhc2VkIGJpbmRpbmdzIChlLmcgYDxkaXYgW3N0eWxlXT1cInNcIiBbY2xhc3NdPVwie2NsYXNzTmFtZTp0cnVlfVwiPmApXG4gICAgLy8gdGhlcmUgaXMgbm8gbmVlZCB0byBhbGxvY2F0ZSB0aGUgbWFwLWJhc2VkIGJpbmRpbmcgcmVnaW9uIGludG8gdGhlIGNvbnRleHRcbiAgICAvLyBzaW5jZSBpdCBpcyBhbHJlYWR5IHRoZXJlIHdoZW4gdGhlIGNvbnRleHQgaXMgZmlyc3QgY3JlYXRlZC5cbiAgICBhZGRCaW5kaW5nSW50b0NvbnRleHQoXG4gICAgICAgIGNvbnRleHQsIHRydWUsIFRTdHlsaW5nQ29udGV4dEluZGV4Lk1hcEJpbmRpbmdzUG9zaXRpb24sIGJpbmRpbmdWYWx1ZSwgY291bnRJZCk7XG4gIH1cbn1cblxuZnVuY3Rpb24gYWxsb2NhdGVOZXdDb250ZXh0RW50cnkoY29udGV4dDogVFN0eWxpbmdDb250ZXh0LCBpbmRleDogbnVtYmVyLCBwcm9wOiBzdHJpbmcpIHtcbiAgLy8gMSwyOiBzcGxpY2UgaW5kZXggbG9jYXRpb25zXG4gIC8vIDM6IGVhY2ggZW50cnkgZ2V0cyBhIGd1YXJkIG1hc2sgdmFsdWUgdGhhdCBpcyB1c2VkIHRvIGNoZWNrIGFnYWluc3QgdXBkYXRlc1xuICAvLyA0LiBlYWNoIGVudHJ5IGdldHMgYSBzaXplIHZhbHVlICh3aGljaCBpcyBhbHdheXMgb25lIGJlY2F1c2UgdGhlcmUgaXMgYWx3YXlzIGEgZGVmYXVsdCBiaW5kaW5nXG4gIC8vIHZhbHVlKVxuICAvLyA1LiB0aGUgcHJvcGVydHkgdGhhdCBpcyBnZXR0aW5nIGFsbG9jYXRlZCBpbnRvIHRoZSBjb250ZXh0XG4gIC8vIDYuIHRoZSBkZWZhdWx0IGJpbmRpbmcgdmFsdWUgKHVzdWFsbHkgYG51bGxgKVxuICBjb250ZXh0LnNwbGljZShcbiAgICAgIGluZGV4LCAwLCBERUZBVUxUX0dVQVJEX01BU0tfVkFMVUUsIERFRkFVTFRfU0laRV9WQUxVRSwgcHJvcCwgREVGQVVMVF9CSU5ESU5HX1ZBTFVFKTtcbn1cblxuLyoqXG4gKiBJbnNlcnRzIGEgbmV3IGJpbmRpbmcgdmFsdWUgaW50byBhIHN0eWxpbmcgcHJvcGVydHkgdHVwbGUgaW4gdGhlIGBUU3R5bGluZ0NvbnRleHRgLlxuICpcbiAqIEEgYmluZGluZ1ZhbHVlIGlzIGluc2VydGVkIGludG8gYSBjb250ZXh0IGR1cmluZyB0aGUgZmlyc3QgdXBkYXRlIHBhc3NcbiAqIG9mIGEgdGVtcGxhdGUgb3IgaG9zdCBiaW5kaW5ncyBmdW5jdGlvbi4gV2hlbiB0aGlzIG9jY3VycywgdHdvIHRoaW5nc1xuICogaGFwcGVuOlxuICpcbiAqIC0gSWYgdGhlIGJpbmRpbmdWYWx1ZSB2YWx1ZSBpcyBhIG51bWJlciB0aGVuIGl0IGlzIHRyZWF0ZWQgYXMgYSBiaW5kaW5nSW5kZXhcbiAqICAgdmFsdWUgKGEgaW5kZXggaW4gdGhlIGBMVmlld2ApIGFuZCBpdCB3aWxsIGJlIGluc2VydGVkIG5leHQgdG8gdGhlIG90aGVyXG4gKiAgIGJpbmRpbmcgaW5kZXggZW50cmllcy5cbiAqXG4gKiAtIE90aGVyd2lzZSB0aGUgYmluZGluZyB2YWx1ZSB3aWxsIHVwZGF0ZSB0aGUgZGVmYXVsdCB2YWx1ZSBmb3IgdGhlIHByb3BlcnR5XG4gKiAgIGFuZCB0aGlzIHdpbGwgb25seSBoYXBwZW4gaWYgdGhlIGRlZmF1bHQgdmFsdWUgaXMgYG51bGxgLlxuICpcbiAqIE5vdGUgdGhhdCB0aGlzIGZ1bmN0aW9uIGFsc28gaGFuZGxlcyBtYXAtYmFzZWQgYmluZGluZ3MgYW5kIHdpbGwgaW5zZXJ0IHRoZW1cbiAqIGF0IHRoZSB0b3Agb2YgdGhlIGNvbnRleHQuXG4gKi9cbmZ1bmN0aW9uIGFkZEJpbmRpbmdJbnRvQ29udGV4dChcbiAgICBjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQsIGlzTWFwQmFzZWQ6IGJvb2xlYW4sIGluZGV4OiBudW1iZXIsXG4gICAgYmluZGluZ1ZhbHVlOiBudW1iZXIgfCBzdHJpbmcgfCBib29sZWFuIHwgbnVsbCwgY291bnRJZDogbnVtYmVyKSB7XG4gIGNvbnN0IHZhbHVlc0NvdW50ID0gZ2V0VmFsdWVzQ291bnQoY29udGV4dCwgaW5kZXgpO1xuXG4gIGxldCBsYXN0VmFsdWVJbmRleCA9IGluZGV4ICsgVFN0eWxpbmdDb250ZXh0SW5kZXguQmluZGluZ3NTdGFydE9mZnNldCArIHZhbHVlc0NvdW50O1xuICBpZiAoIWlzTWFwQmFzZWQpIHtcbiAgICAvLyBwcm9wLWJhc2VkIHZhbHVlcyBhbGwgaGF2ZSBkZWZhdWx0IHZhbHVlcywgYnV0IG1hcC1iYXNlZCBlbnRyaWVzIGRvIG5vdC5cbiAgICAvLyB3ZSB3YW50IHRvIGFjY2VzcyB0aGUgaW5kZXggZm9yIHRoZSBkZWZhdWx0IHZhbHVlIGluIHRoaXMgY2FzZSBhbmQgbm90IGp1c3RcbiAgICAvLyB0aGUgYmluZGluZ3MuLi5cbiAgICBsYXN0VmFsdWVJbmRleC0tO1xuICB9XG5cbiAgaWYgKHR5cGVvZiBiaW5kaW5nVmFsdWUgPT09ICdudW1iZXInKSB7XG4gICAgY29udGV4dC5zcGxpY2UobGFzdFZhbHVlSW5kZXgsIDAsIGJpbmRpbmdWYWx1ZSk7XG4gICAgKGNvbnRleHRbaW5kZXggKyBUU3R5bGluZ0NvbnRleHRJbmRleC5WYWx1ZXNDb3VudE9mZnNldF0gYXMgbnVtYmVyKSsrO1xuICAgIChjb250ZXh0W2luZGV4ICsgVFN0eWxpbmdDb250ZXh0SW5kZXguR3VhcmRPZmZzZXRdIGFzIG51bWJlcikgfD0gMSA8PCBjb3VudElkO1xuICB9IGVsc2UgaWYgKHR5cGVvZiBiaW5kaW5nVmFsdWUgPT09ICdzdHJpbmcnICYmIGNvbnRleHRbbGFzdFZhbHVlSW5kZXhdID09IG51bGwpIHtcbiAgICBjb250ZXh0W2xhc3RWYWx1ZUluZGV4XSA9IGJpbmRpbmdWYWx1ZTtcbiAgfVxufVxuXG4vKipcbiAqIEFwcGxpZXMgYWxsIGNsYXNzIGVudHJpZXMgaW4gdGhlIHByb3ZpZGVkIGNvbnRleHQgdG8gdGhlIHByb3ZpZGVkIGVsZW1lbnQgYW5kIHJlc2V0c1xuICogYW55IGNvdW50ZXIgYW5kL29yIGJpdE1hc2sgdmFsdWVzIGFzc29jaWF0ZWQgd2l0aCBjbGFzcyBiaW5kaW5ncy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFwcGx5Q2xhc3NlcyhcbiAgICByZW5kZXJlcjogUmVuZGVyZXIzIHwgUHJvY2VkdXJhbFJlbmRlcmVyMyB8IG51bGwsIGRhdGE6IExTdHlsaW5nRGF0YSwgY29udGV4dDogVFN0eWxpbmdDb250ZXh0LFxuICAgIGVsZW1lbnQ6IFJFbGVtZW50LCBkaXJlY3RpdmVJbmRleDogbnVtYmVyKSB7XG4gIGlmIChhbGxvd1N0eWxpbmdGbHVzaChjb250ZXh0LCBkaXJlY3RpdmVJbmRleCkpIHtcbiAgICBjb25zdCBpc0ZpcnN0UGFzcyA9ICFpc0NvbnRleHRMb2NrZWQoY29udGV4dCk7XG4gICAgaXNGaXJzdFBhc3MgJiYgbG9ja0NvbnRleHQoY29udGV4dCk7XG4gICAgaWYgKGNsYXNzZXNCaXRNYXNrKSB7XG4gICAgICBhcHBseVN0eWxpbmcoY29udGV4dCwgcmVuZGVyZXIsIGVsZW1lbnQsIGRhdGEsIGNsYXNzZXNCaXRNYXNrLCBzZXRDbGFzcyk7XG4gICAgICBjbGFzc2VzQml0TWFzayA9IDA7XG4gICAgfVxuICAgIGN1cnJlbnRDbGFzc0luZGV4ID0gU1RZTElOR19JTkRFWF9TVEFSVF9WQUxVRTtcbiAgfVxufVxuXG4vKipcbiAqIEFwcGxpZXMgYWxsIHN0eWxlIGVudHJpZXMgaW4gdGhlIHByb3ZpZGVkIGNvbnRleHQgdG8gdGhlIHByb3ZpZGVkIGVsZW1lbnQgYW5kIHJlc2V0c1xuICogYW55IGNvdW50ZXIgYW5kL29yIGJpdE1hc2sgdmFsdWVzIGFzc29jaWF0ZWQgd2l0aCBzdHlsZSBiaW5kaW5ncy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFwcGx5U3R5bGVzKFxuICAgIHJlbmRlcmVyOiBSZW5kZXJlcjMgfCBQcm9jZWR1cmFsUmVuZGVyZXIzIHwgbnVsbCwgZGF0YTogTFN0eWxpbmdEYXRhLCBjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQsXG4gICAgZWxlbWVudDogUkVsZW1lbnQsIGRpcmVjdGl2ZUluZGV4OiBudW1iZXIpIHtcbiAgaWYgKGFsbG93U3R5bGluZ0ZsdXNoKGNvbnRleHQsIGRpcmVjdGl2ZUluZGV4KSkge1xuICAgIGNvbnN0IGlzRmlyc3RQYXNzID0gIWlzQ29udGV4dExvY2tlZChjb250ZXh0KTtcbiAgICBpc0ZpcnN0UGFzcyAmJiBsb2NrQ29udGV4dChjb250ZXh0KTtcbiAgICBpZiAoc3R5bGVzQml0TWFzaykge1xuICAgICAgYXBwbHlTdHlsaW5nKGNvbnRleHQsIHJlbmRlcmVyLCBlbGVtZW50LCBkYXRhLCBzdHlsZXNCaXRNYXNrLCBzZXRTdHlsZSk7XG4gICAgICBzdHlsZXNCaXRNYXNrID0gMDtcbiAgICB9XG4gICAgY3VycmVudFN0eWxlSW5kZXggPSBTVFlMSU5HX0lOREVYX1NUQVJUX1ZBTFVFO1xuICB9XG59XG5cbi8qKlxuICogUnVucyB0aHJvdWdoIHRoZSBwcm92aWRlZCBzdHlsaW5nIGNvbnRleHQgYW5kIGFwcGxpZXMgZWFjaCB2YWx1ZSB0b1xuICogdGhlIHByb3ZpZGVkIGVsZW1lbnQgKHZpYSB0aGUgcmVuZGVyZXIpIGlmIG9uZSBvciBtb3JlIHZhbHVlcyBhcmUgcHJlc2VudC5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIHdpbGwgaXRlcmF0ZSBvdmVyIGFsbCBlbnRyaWVzIHByZXNlbnQgaW4gdGhlIHByb3ZpZGVkXG4gKiBgVFN0eWxpbmdDb250ZXh0YCBhcnJheSAoYm90aCBwcm9wLWJhc2VkIGFuZCBtYXAtYmFzZWQgYmluZGluZ3MpLi1cbiAqXG4gKiBFYWNoIGVudHJ5LCB3aXRoaW4gdGhlIGBUU3R5bGluZ0NvbnRleHRgIGFycmF5LCBpcyBzdG9yZWQgYWxwaGFiZXRpY2FsbHlcbiAqIGFuZCB0aGlzIG1lYW5zIHRoYXQgZWFjaCBwcm9wL3ZhbHVlIGVudHJ5IHdpbGwgYmUgYXBwbGllZCBpbiBvcmRlclxuICogKHNvIGxvbmcgYXMgaXQgaXMgbWFya2VkIGRpcnR5IGluIHRoZSBwcm92aWRlZCBgYml0TWFza2AgdmFsdWUpLlxuICpcbiAqIElmIHRoZXJlIGFyZSBhbnkgbWFwLWJhc2VkIGVudHJpZXMgcHJlc2VudCAod2hpY2ggYXJlIGFwcGxpZWQgdG8gdGhlXG4gKiBlbGVtZW50IHZpYSB0aGUgYFtzdHlsZV1gIGFuZCBgW2NsYXNzXWAgYmluZGluZ3MpIHRoZW4gdGhvc2UgZW50cmllc1xuICogd2lsbCBiZSBhcHBsaWVkIGFzIHdlbGwuIEhvd2V2ZXIsIHRoZSBjb2RlIGZvciB0aGF0IGlzIG5vdCBhcGFydCBvZlxuICogdGhpcyBmdW5jdGlvbi4gSW5zdGVhZCwgZWFjaCB0aW1lIGEgcHJvcGVydHkgaXMgdmlzaXRlZCwgdGhlbiB0aGVcbiAqIGNvZGUgYmVsb3cgd2lsbCBjYWxsIGFuIGV4dGVybmFsIGZ1bmN0aW9uIGNhbGxlZCBgc3R5bGluZ01hcHNTeW5jRm5gXG4gKiBhbmQsIGlmIHByZXNlbnQsIGl0IHdpbGwga2VlcCB0aGUgYXBwbGljYXRpb24gb2Ygc3R5bGluZyB2YWx1ZXMgaW5cbiAqIG1hcC1iYXNlZCBiaW5kaW5ncyB1cCB0byBzeW5jIHdpdGggdGhlIGFwcGxpY2F0aW9uIG9mIHByb3AtYmFzZWRcbiAqIGJpbmRpbmdzLlxuICpcbiAqIFZpc2l0IGBzdHlsaW5nX25leHQvbWFwX2Jhc2VkX2JpbmRpbmdzLnRzYCB0byBsZWFybiBtb3JlIGFib3V0IGhvdyB0aGVcbiAqIGFsZ29yaXRobSB3b3JrcyBmb3IgbWFwLWJhc2VkIHN0eWxpbmcgYmluZGluZ3MuXG4gKlxuICogTm90ZSB0aGF0IHRoaXMgZnVuY3Rpb24gaXMgbm90IGRlc2lnbmVkIHRvIGJlIGNhbGxlZCBpbiBpc29sYXRpb24gKHVzZVxuICogYGFwcGx5Q2xhc3Nlc2AgYW5kIGBhcHBseVN0eWxlc2AgdG8gYWN0dWFsbHkgYXBwbHkgc3R5bGluZyB2YWx1ZXMpLlxuICovXG5leHBvcnQgZnVuY3Rpb24gYXBwbHlTdHlsaW5nKFxuICAgIGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCwgcmVuZGVyZXI6IFJlbmRlcmVyMyB8IFByb2NlZHVyYWxSZW5kZXJlcjMgfCBudWxsLCBlbGVtZW50OiBSRWxlbWVudCxcbiAgICBiaW5kaW5nRGF0YTogTFN0eWxpbmdEYXRhLCBiaXRNYXNrVmFsdWU6IG51bWJlciB8IGJvb2xlYW4sIGFwcGx5U3R5bGluZ0ZuOiBBcHBseVN0eWxpbmdGbikge1xuICBkZWZlcnJlZEJpbmRpbmdRdWV1ZS5sZW5ndGggJiYgZmx1c2hEZWZlcnJlZEJpbmRpbmdzKCk7XG5cbiAgY29uc3QgYml0TWFzayA9IG5vcm1hbGl6ZUJpdE1hc2tWYWx1ZShiaXRNYXNrVmFsdWUpO1xuICBjb25zdCBzdHlsaW5nTWFwc1N5bmNGbiA9IGdldFN0eWxpbmdNYXBzU3luY0ZuKCk7XG4gIGNvbnN0IG1hcHNHdWFyZE1hc2sgPSBnZXRHdWFyZE1hc2soY29udGV4dCwgVFN0eWxpbmdDb250ZXh0SW5kZXguTWFwQmluZGluZ3NQb3NpdGlvbik7XG4gIGNvbnN0IGFwcGx5QWxsVmFsdWVzID0gKGJpdE1hc2sgJiBtYXBzR3VhcmRNYXNrKSA+IDA7XG4gIGNvbnN0IG1hcHNNb2RlID1cbiAgICAgIGFwcGx5QWxsVmFsdWVzID8gU3R5bGluZ01hcHNTeW5jTW9kZS5BcHBseUFsbFZhbHVlcyA6IFN0eWxpbmdNYXBzU3luY01vZGUuVHJhdmVyc2VWYWx1ZXM7XG5cbiAgbGV0IGkgPSBnZXRQcm9wVmFsdWVzU3RhcnRQb3NpdGlvbihjb250ZXh0KTtcbiAgd2hpbGUgKGkgPCBjb250ZXh0Lmxlbmd0aCkge1xuICAgIGNvbnN0IHZhbHVlc0NvdW50ID0gZ2V0VmFsdWVzQ291bnQoY29udGV4dCwgaSk7XG4gICAgY29uc3QgZ3VhcmRNYXNrID0gZ2V0R3VhcmRNYXNrKGNvbnRleHQsIGkpO1xuICAgIGlmIChiaXRNYXNrICYgZ3VhcmRNYXNrKSB7XG4gICAgICBsZXQgdmFsdWVBcHBsaWVkID0gZmFsc2U7XG4gICAgICBjb25zdCBwcm9wID0gZ2V0UHJvcChjb250ZXh0LCBpKTtcbiAgICAgIGNvbnN0IHZhbHVlc0NvdW50VXBUb0RlZmF1bHQgPSB2YWx1ZXNDb3VudCAtIDE7XG4gICAgICBjb25zdCBkZWZhdWx0VmFsdWUgPSBnZXRCaW5kaW5nVmFsdWUoY29udGV4dCwgaSwgdmFsdWVzQ291bnRVcFRvRGVmYXVsdCkgYXMgc3RyaW5nIHwgbnVsbDtcblxuICAgICAgLy8gY2FzZSAxOiBhcHBseSBwcm9wLWJhc2VkIHZhbHVlc1xuICAgICAgLy8gdHJ5IHRvIGFwcGx5IHRoZSBiaW5kaW5nIHZhbHVlcyBhbmQgc2VlIGlmIGEgbm9uLW51bGxcbiAgICAgIC8vIHZhbHVlIGdldHMgc2V0IGZvciB0aGUgc3R5bGluZyBiaW5kaW5nXG4gICAgICBmb3IgKGxldCBqID0gMDsgaiA8IHZhbHVlc0NvdW50VXBUb0RlZmF1bHQ7IGorKykge1xuICAgICAgICBjb25zdCBiaW5kaW5nSW5kZXggPSBnZXRCaW5kaW5nVmFsdWUoY29udGV4dCwgaSwgaikgYXMgbnVtYmVyO1xuICAgICAgICBjb25zdCB2YWx1ZVRvQXBwbHkgPSBiaW5kaW5nRGF0YVtiaW5kaW5nSW5kZXhdO1xuICAgICAgICBpZiAoaXNTdHlsaW5nVmFsdWVEZWZpbmVkKHZhbHVlVG9BcHBseSkpIHtcbiAgICAgICAgICBhcHBseVN0eWxpbmdGbihyZW5kZXJlciwgZWxlbWVudCwgcHJvcCwgdmFsdWVUb0FwcGx5LCBiaW5kaW5nSW5kZXgpO1xuICAgICAgICAgIHZhbHVlQXBwbGllZCA9IHRydWU7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gY2FzZSAyOiBhcHBseSBtYXAtYmFzZWQgdmFsdWVzXG4gICAgICAvLyB0cmF2ZXJzZSB0aHJvdWdoIGVhY2ggbWFwLWJhc2VkIHN0eWxpbmcgYmluZGluZyBhbmQgdXBkYXRlIGFsbCB2YWx1ZXMgdXAgdG9cbiAgICAgIC8vIHRoZSBwcm92aWRlZCBgcHJvcGAgdmFsdWUuIElmIHRoZSBwcm9wZXJ0eSB3YXMgbm90IGFwcGxpZWQgaW4gdGhlIGxvb3AgYWJvdmVcbiAgICAgIC8vIHRoZW4gaXQgd2lsbCBiZSBhdHRlbXB0ZWQgdG8gYmUgYXBwbGllZCBpbiB0aGUgbWFwcyBzeW5jIGNvZGUgYmVsb3cuXG4gICAgICBpZiAoc3R5bGluZ01hcHNTeW5jRm4pIHtcbiAgICAgICAgLy8gZGV0ZXJtaW5lIHdoZXRoZXIgb3Igbm90IHRvIGFwcGx5IHRoZSB0YXJnZXQgcHJvcGVydHkgb3IgdG8gc2tpcCBpdFxuICAgICAgICBjb25zdCBtb2RlID0gbWFwc01vZGUgfCAodmFsdWVBcHBsaWVkID8gU3R5bGluZ01hcHNTeW5jTW9kZS5Ta2lwVGFyZ2V0UHJvcCA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBTdHlsaW5nTWFwc1N5bmNNb2RlLkFwcGx5VGFyZ2V0UHJvcCk7XG4gICAgICAgIGNvbnN0IHZhbHVlQXBwbGllZFdpdGhpbk1hcCA9IHN0eWxpbmdNYXBzU3luY0ZuKFxuICAgICAgICAgICAgY29udGV4dCwgcmVuZGVyZXIsIGVsZW1lbnQsIGJpbmRpbmdEYXRhLCBhcHBseVN0eWxpbmdGbiwgbW9kZSwgcHJvcCwgZGVmYXVsdFZhbHVlKTtcbiAgICAgICAgdmFsdWVBcHBsaWVkID0gdmFsdWVBcHBsaWVkIHx8IHZhbHVlQXBwbGllZFdpdGhpbk1hcDtcbiAgICAgIH1cblxuICAgICAgLy8gY2FzZSAzOiBhcHBseSB0aGUgZGVmYXVsdCB2YWx1ZVxuICAgICAgLy8gaWYgdGhlIHZhbHVlIGhhcyBub3QgeWV0IGJlZW4gYXBwbGllZCB0aGVuIGEgdHJ1dGh5IHZhbHVlIGRvZXMgbm90IGV4aXN0IGluIHRoZVxuICAgICAgLy8gcHJvcC1iYXNlZCBvciBtYXAtYmFzZWQgYmluZGluZ3MgY29kZS4gSWYgYW5kIHdoZW4gdGhpcyBoYXBwZW5zLCBqdXN0IGFwcGx5IHRoZVxuICAgICAgLy8gZGVmYXVsdCB2YWx1ZSAoZXZlbiBpZiB0aGUgZGVmYXVsdCB2YWx1ZSBpcyBgbnVsbGApLlxuICAgICAgaWYgKCF2YWx1ZUFwcGxpZWQpIHtcbiAgICAgICAgYXBwbHlTdHlsaW5nRm4ocmVuZGVyZXIsIGVsZW1lbnQsIHByb3AsIGRlZmF1bHRWYWx1ZSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaSArPSBUU3R5bGluZ0NvbnRleHRJbmRleC5CaW5kaW5nc1N0YXJ0T2Zmc2V0ICsgdmFsdWVzQ291bnQ7XG4gIH1cblxuICAvLyB0aGUgbWFwLWJhc2VkIHN0eWxpbmcgZW50cmllcyBtYXkgaGF2ZSBub3QgYXBwbGllZCBhbGwgdGhlaXJcbiAgLy8gdmFsdWVzLiBGb3IgdGhpcyByZWFzb24sIG9uZSBtb3JlIGNhbGwgdG8gdGhlIHN5bmMgZnVuY3Rpb25cbiAgLy8gbmVlZHMgdG8gYmUgaXNzdWVkIGF0IHRoZSBlbmQuXG4gIGlmIChzdHlsaW5nTWFwc1N5bmNGbikge1xuICAgIHN0eWxpbmdNYXBzU3luY0ZuKGNvbnRleHQsIHJlbmRlcmVyLCBlbGVtZW50LCBiaW5kaW5nRGF0YSwgYXBwbHlTdHlsaW5nRm4sIG1hcHNNb2RlKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBub3JtYWxpemVCaXRNYXNrVmFsdWUodmFsdWU6IG51bWJlciB8IGJvb2xlYW4pOiBudW1iZXIge1xuICAvLyBpZiBwYXNzID0+IGFwcGx5IGFsbCB2YWx1ZXMgKC0xIGltcGxpZXMgdGhhdCBhbGwgYml0cyBhcmUgZmxpcHBlZCB0byB0cnVlKVxuICBpZiAodmFsdWUgPT09IHRydWUpIHJldHVybiAtMTtcblxuICAvLyBpZiBwYXNzID0+IHNraXAgYWxsIHZhbHVlc1xuICBpZiAodmFsdWUgPT09IGZhbHNlKSByZXR1cm4gMDtcblxuICAvLyByZXR1cm4gdGhlIGJpdCBtYXNrIHZhbHVlIGFzIGlzXG4gIHJldHVybiB2YWx1ZTtcbn1cblxubGV0IF9hY3RpdmVTdHlsaW5nTWFwQXBwbHlGbjogU3luY1N0eWxpbmdNYXBzRm58bnVsbCA9IG51bGw7XG5leHBvcnQgZnVuY3Rpb24gZ2V0U3R5bGluZ01hcHNTeW5jRm4oKSB7XG4gIHJldHVybiBfYWN0aXZlU3R5bGluZ01hcEFwcGx5Rm47XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXRTdHlsaW5nTWFwc1N5bmNGbihmbjogU3luY1N0eWxpbmdNYXBzRm4pIHtcbiAgX2FjdGl2ZVN0eWxpbmdNYXBBcHBseUZuID0gZm47XG59XG5cbi8qKlxuICogQXNzaWducyBhIHN0eWxlIHZhbHVlIHRvIGEgc3R5bGUgcHJvcGVydHkgZm9yIHRoZSBnaXZlbiBlbGVtZW50LlxuICovXG5jb25zdCBzZXRTdHlsZTogQXBwbHlTdHlsaW5nRm4gPVxuICAgIChyZW5kZXJlcjogUmVuZGVyZXIzIHwgbnVsbCwgbmF0aXZlOiBhbnksIHByb3A6IHN0cmluZywgdmFsdWU6IHN0cmluZyB8IG51bGwpID0+IHtcbiAgICAgIGlmICh2YWx1ZSkge1xuICAgICAgICAvLyBvcGFjaXR5LCB6LWluZGV4IGFuZCBmbGV4Ym94IGFsbCBoYXZlIG51bWJlciB2YWx1ZXNcbiAgICAgICAgLy8gYW5kIHRoZXNlIG5lZWQgdG8gYmUgY29udmVydGVkIGludG8gc3RyaW5ncyBzbyB0aGF0XG4gICAgICAgIC8vIHRoZXkgY2FuIGJlIGFzc2lnbmVkIHByb3Blcmx5LlxuICAgICAgICB2YWx1ZSA9IHZhbHVlLnRvU3RyaW5nKCk7XG4gICAgICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJTZXRTdHlsZSsrO1xuICAgICAgICByZW5kZXJlciAmJiBpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikgP1xuICAgICAgICAgICAgcmVuZGVyZXIuc2V0U3R5bGUobmF0aXZlLCBwcm9wLCB2YWx1ZSwgUmVuZGVyZXJTdHlsZUZsYWdzMy5EYXNoQ2FzZSkgOlxuICAgICAgICAgICAgbmF0aXZlLnN0eWxlLnNldFByb3BlcnR5KHByb3AsIHZhbHVlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJSZW1vdmVTdHlsZSsrO1xuICAgICAgICByZW5kZXJlciAmJiBpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikgP1xuICAgICAgICAgICAgcmVuZGVyZXIucmVtb3ZlU3R5bGUobmF0aXZlLCBwcm9wLCBSZW5kZXJlclN0eWxlRmxhZ3MzLkRhc2hDYXNlKSA6XG4gICAgICAgICAgICBuYXRpdmUuc3R5bGUucmVtb3ZlUHJvcGVydHkocHJvcCk7XG4gICAgICB9XG4gICAgfTtcblxuLyoqXG4gKiBBZGRzL3JlbW92ZXMgdGhlIHByb3ZpZGVkIGNsYXNzTmFtZSB2YWx1ZSB0byB0aGUgcHJvdmlkZWQgZWxlbWVudC5cbiAqL1xuY29uc3Qgc2V0Q2xhc3M6IEFwcGx5U3R5bGluZ0ZuID1cbiAgICAocmVuZGVyZXI6IFJlbmRlcmVyMyB8IG51bGwsIG5hdGl2ZTogYW55LCBjbGFzc05hbWU6IHN0cmluZywgdmFsdWU6IGFueSkgPT4ge1xuICAgICAgaWYgKGNsYXNzTmFtZSAhPT0gJycpIHtcbiAgICAgICAgaWYgKHZhbHVlKSB7XG4gICAgICAgICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlckFkZENsYXNzKys7XG4gICAgICAgICAgcmVuZGVyZXIgJiYgaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpID8gcmVuZGVyZXIuYWRkQ2xhc3MobmF0aXZlLCBjbGFzc05hbWUpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYXRpdmUuY2xhc3NMaXN0LmFkZChjbGFzc05hbWUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJSZW1vdmVDbGFzcysrO1xuICAgICAgICAgIHJlbmRlcmVyICYmIGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSA/IHJlbmRlcmVyLnJlbW92ZUNsYXNzKG5hdGl2ZSwgY2xhc3NOYW1lKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmF0aXZlLmNsYXNzTGlzdC5yZW1vdmUoY2xhc3NOYW1lKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH07XG4iXX0=