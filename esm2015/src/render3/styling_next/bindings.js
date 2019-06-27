/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
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
 * @param {?} forceUpdate
 * @return {?}
 */
export function updateClassBinding(context, data, prop, bindingIndex, value, deferRegistration, forceUpdate) {
    /** @type {?} */
    const isMapBased = !prop;
    /** @type {?} */
    const index = isMapBased ? STYLING_INDEX_FOR_MAP_BINDING : currentClassIndex++;
    /** @type {?} */
    const updated = updateBindingData(context, data, index, prop, bindingIndex, value, deferRegistration, forceUpdate, false);
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
 * @param {?} sanitizer
 * @param {?} deferRegistration
 * @param {?} forceUpdate
 * @return {?}
 */
export function updateStyleBinding(context, data, prop, bindingIndex, value, sanitizer, deferRegistration, forceUpdate) {
    /** @type {?} */
    const isMapBased = !prop;
    /** @type {?} */
    const index = isMapBased ? STYLING_INDEX_FOR_MAP_BINDING : currentStyleIndex++;
    /** @type {?} */
    const sanitizationRequired = isMapBased ?
        true :
        (sanitizer ? sanitizer((/** @type {?} */ (prop)), null, 1 /* ValidateProperty */) : false);
    /** @type {?} */
    const updated = updateBindingData(context, data, index, prop, bindingIndex, value, deferRegistration, forceUpdate, sanitizationRequired);
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
 * @param {?} deferRegistration
 * @param {?} forceUpdate
 * @param {?} sanitizationRequired
 * @return {?} whether or not the binding value was updated in the `LStylingData`.
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
 * @param {?} sanitizationRequired
 * @return {?}
 */
function deferBindingRegistration(context, counterIndex, prop, bindingIndex, sanitizationRequired) {
    deferredBindingQueue.unshift(context, counterIndex, prop, bindingIndex, sanitizationRequired);
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
        /** @type {?} */
        const sanitizationRequired = (/** @type {?} */ (deferredBindingQueue[i++]));
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
 * @param {?} context
 * @param {?} countId
 * @param {?} prop
 * @param {?} bindingValue
 * @param {?=} sanitizationRequired
 * @return {?}
 */
export function registerBinding(context, countId, prop, bindingValue, sanitizationRequired) {
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
/**
 * @param {?} context
 * @param {?} index
 * @param {?} prop
 * @param {?=} sanitizationRequired
 * @return {?}
 */
function allocateNewContextEntry(context, index, prop, sanitizationRequired) {
    // 1,2: splice index locations
    // 3: each entry gets a config value (guard mask + flags)
    // 4. each entry gets a size value (which is always one because there is always a default binding
    // value)
    // 5. the property that is getting allocated into the context
    // 6. the default binding value (usually `null`)
    /** @type {?} */
    const config = sanitizationRequired ? 1 /* SanitizationRequired */ :
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
        // now that a new binding index has been added to the property
        // the guard mask bit value (at the `countId` position) needs
        // to be included into the existing mask value.
        /** @type {?} */
        const guardMask = getGuardMask(context, index) | (1 << countId);
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
 * @param {?} renderer
 * @param {?} data
 * @param {?} context
 * @param {?} element
 * @param {?} directiveIndex
 * @return {?} whether or not the classes were flushed to the element.
 */
export function applyClasses(renderer, data, context, element, directiveIndex) {
    /** @type {?} */
    let classesFlushed = false;
    if (allowStylingFlush(context, directiveIndex)) {
        /** @type {?} */
        const isFirstPass = !isContextLocked(context);
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
 * @param {?} renderer
 * @param {?} data
 * @param {?} context
 * @param {?} element
 * @param {?} directiveIndex
 * @param {?} sanitizer
 * @return {?} whether or not the styles were flushed to the element.
 */
export function applyStyles(renderer, data, context, element, directiveIndex, sanitizer) {
    /** @type {?} */
    let stylesFlushed = false;
    if (allowStylingFlush(context, directiveIndex)) {
        /** @type {?} */
        const isFirstPass = !isContextLocked(context);
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
 * @param {?} context
 * @param {?} renderer
 * @param {?} element
 * @param {?} bindingData
 * @param {?} bitMaskValue
 * @param {?} applyStylingFn
 * @param {?} sanitizer
 * @return {?}
 */
export function applyStyling(context, renderer, element, bindingData, bitMaskValue, applyStylingFn, sanitizer) {
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
                const value = bindingData[bindingIndex];
                if (isStylingValueDefined(value)) {
                    /** @type {?} */
                    const finalValue = sanitizer && isSanitizationRequired(context, i) ?
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
                /** @type {?} */
                const mode = mapsMode | (valueApplied ? 4 /* SkipTargetProp */ :
                    2 /* ApplyTargetProp */);
                /** @type {?} */
                const valueAppliedWithinMap = stylingMapsSyncFn(context, renderer, element, bindingData, applyStylingFn, sanitizer, mode, prop, defaultValue);
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
const ɵ0 = setStyle;
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
const ɵ1 = setClass;
export { ɵ0, ɵ1 };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmluZGluZ3MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL3N0eWxpbmdfbmV4dC9iaW5kaW5ncy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7O0FBUUEsT0FBTyxFQUEyQyxtQkFBbUIsRUFBRSxvQkFBb0IsRUFBQyxNQUFNLHdCQUF3QixDQUFDO0FBRzNILE9BQU8sRUFBQyxpQkFBaUIsRUFBRSxlQUFlLEVBQUUsWUFBWSxFQUFFLE9BQU8sRUFBRSwwQkFBMEIsRUFBRSxjQUFjLEVBQUUsZUFBZSxFQUFFLGVBQWUsRUFBRSxzQkFBc0IsRUFBRSxxQkFBcUIsRUFBRSxXQUFXLEVBQUUsWUFBWSxFQUFDLE1BQU0sUUFBUSxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztNQXNCbk8scUJBQXFCLEdBQUcsSUFBSTs7TUFDNUIsa0JBQWtCLEdBQUcsQ0FBQzs7Ozs7OztBQU81QixNQUFNLE9BQU8sd0JBQXdCLEdBQUcsR0FBRzs7TUFDckMsNkJBQTZCLEdBQUcsQ0FBQzs7TUFDakMseUJBQXlCLEdBQUcsQ0FBQzs7Ozs7SUFLL0IsaUJBQWlCLEdBQUcseUJBQXlCOztJQUM3QyxpQkFBaUIsR0FBRyx5QkFBeUI7O0lBQzdDLGFBQWEsR0FBRyxDQUFDOztJQUNqQixjQUFjLEdBQUcsQ0FBQzs7SUFDbEIsb0JBQW9CLEdBQTJELEVBQUU7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFZckYsTUFBTSxVQUFVLGtCQUFrQixDQUM5QixPQUF3QixFQUFFLElBQWtCLEVBQUUsSUFBbUIsRUFBRSxZQUFvQixFQUN2RixLQUF3RCxFQUFFLGlCQUEwQixFQUNwRixXQUFvQjs7VUFDaEIsVUFBVSxHQUFHLENBQUMsSUFBSTs7VUFDbEIsS0FBSyxHQUFHLFVBQVUsQ0FBQyxDQUFDLENBQUMsNkJBQTZCLENBQUMsQ0FBQyxDQUFDLGlCQUFpQixFQUFFOztVQUN4RSxPQUFPLEdBQUcsaUJB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QUUsU0FBaUIsRUFBRSxLQUFVLEVBQUUsRUFBRTtJQUN6RSxJQUFJLFNBQVMsS0FBSyxFQUFFLEVBQUU7UUFDcEIsSUFBSSxLQUFLLEVBQUU7WUFDVCxTQUFTLElBQUksU0FBUyxDQUFDLGdCQUFnQixFQUFFLENBQUM7WUFDMUMsUUFBUSxJQUFJLG9CQUFvQixDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLE1BQU0sRUFBRSxTQUFTLENBQUMsQ0FBQyxDQUFDO2dCQUN0QyxNQUFNLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQztTQUM5RTthQUFNO1lBQ0wsU0FBUyxJQUFJLFNBQVMsQ0FBQyxtQkFBbUIsRUFBRSxDQUFDO1lBQzdDLFFBQVEsSUFBSSxvQkFBb0IsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQyxNQUFNLEVBQUUsU0FBUyxDQUFDLENBQUMsQ0FBQztnQkFDekMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLENBQUM7U0FDakY7S0FDRjtBQUNILENBQUMsQ0FBQSIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuKiBAbGljZW5zZVxuKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbipcbiogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuKi9cbmltcG9ydCB7U3R5bGVTYW5pdGl6ZUZuLCBTdHlsZVNhbml0aXplTW9kZX0gZnJvbSAnLi4vLi4vc2FuaXRpemF0aW9uL3N0eWxlX3Nhbml0aXplcic7XG5pbXBvcnQge1Byb2NlZHVyYWxSZW5kZXJlcjMsIFJFbGVtZW50LCBSZW5kZXJlcjMsIFJlbmRlcmVyU3R5bGVGbGFnczMsIGlzUHJvY2VkdXJhbFJlbmRlcmVyfSBmcm9tICcuLi9pbnRlcmZhY2VzL3JlbmRlcmVyJztcblxuaW1wb3J0IHtBcHBseVN0eWxpbmdGbiwgTFN0eWxpbmdEYXRhLCBMU3R5bGluZ01hcCwgU3R5bGluZ01hcHNTeW5jTW9kZSwgU3luY1N0eWxpbmdNYXBzRm4sIFRTdHlsaW5nQ29udGV4dCwgVFN0eWxpbmdDb250ZXh0SW5kZXgsIFRTdHlsaW5nQ29udGV4dFByb3BDb25maWdGbGFnc30gZnJvbSAnLi9pbnRlcmZhY2VzJztcbmltcG9ydCB7YWxsb3dTdHlsaW5nRmx1c2gsIGdldEJpbmRpbmdWYWx1ZSwgZ2V0R3VhcmRNYXNrLCBnZXRQcm9wLCBnZXRQcm9wVmFsdWVzU3RhcnRQb3NpdGlvbiwgZ2V0VmFsdWVzQ291bnQsIGhhc1ZhbHVlQ2hhbmdlZCwgaXNDb250ZXh0TG9ja2VkLCBpc1Nhbml0aXphdGlvblJlcXVpcmVkLCBpc1N0eWxpbmdWYWx1ZURlZmluZWQsIGxvY2tDb250ZXh0LCBzZXRHdWFyZE1hc2t9IGZyb20gJy4vdXRpbCc7XG5cblxuLyoqXG4gKiAtLS0tLS0tLVxuICpcbiAqIFRoaXMgZmlsZSBjb250YWlucyB0aGUgY29yZSBsb2dpYyBmb3Igc3R5bGluZyBpbiBBbmd1bGFyLlxuICpcbiAqIEFsbCBzdHlsaW5nIGJpbmRpbmdzIChpLmUuIGBbc3R5bGVdYCwgYFtzdHlsZS5wcm9wXWAsIGBbY2xhc3NdYCBhbmQgYFtjbGFzcy5uYW1lXWApXG4gKiB3aWxsIGhhdmUgdGhlaXIgdmFsdWVzIGJlIGFwcGxpZWQgdGhyb3VnaCB0aGUgbG9naWMgaW4gdGhpcyBmaWxlLlxuICpcbiAqIFdoZW4gYSBiaW5kaW5nIGlzIGVuY291bnRlcmVkIChlLmcuIGA8ZGl2IFtzdHlsZS53aWR0aF09XCJ3XCI+YCkgdGhlblxuICogdGhlIGJpbmRpbmcgZGF0YSB3aWxsIGJlIHBvcHVsYXRlZCBpbnRvIGEgYFRTdHlsaW5nQ29udGV4dGAgZGF0YS1zdHJ1Y3R1cmUuXG4gKiBUaGVyZSBpcyBvbmx5IG9uZSBgVFN0eWxpbmdDb250ZXh0YCBwZXIgYFROb2RlYCBhbmQgZWFjaCBlbGVtZW50IGluc3RhbmNlXG4gKiB3aWxsIHVwZGF0ZSBpdHMgc3R5bGUvY2xhc3MgYmluZGluZyB2YWx1ZXMgaW4gY29uY2VydCB3aXRoIHRoZSBzdHlsaW5nXG4gKiBjb250ZXh0LlxuICpcbiAqIFRvIGxlYXJuIG1vcmUgYWJvdXQgdGhlIGFsZ29yaXRobSBzZWUgYFRTdHlsaW5nQ29udGV4dGAuXG4gKlxuICogLS0tLS0tLS1cbiAqL1xuXG5jb25zdCBERUZBVUxUX0JJTkRJTkdfVkFMVUUgPSBudWxsO1xuY29uc3QgREVGQVVMVF9TSVpFX1ZBTFVFID0gMTtcblxuLy8gVGhlIGZpcnN0IGJpdCB2YWx1ZSByZWZsZWN0cyBhIG1hcC1iYXNlZCBiaW5kaW5nIHZhbHVlJ3MgYml0LlxuLy8gVGhlIHJlYXNvbiB3aHkgaXQncyBhbHdheXMgYWN0aXZhdGVkIGZvciBldmVyeSBlbnRyeSBpbiB0aGUgbWFwXG4vLyBpcyBzbyB0aGF0IGlmIGFueSBtYXAtYmluZGluZyB2YWx1ZXMgdXBkYXRlIHRoZW4gYWxsIG90aGVyIHByb3Bcbi8vIGJhc2VkIGJpbmRpbmdzIHdpbGwgcGFzcyB0aGUgZ3VhcmQgY2hlY2sgYXV0b21hdGljYWxseSB3aXRob3V0XG4vLyBhbnkgZXh0cmEgY29kZSBvciBmbGFncy5cbmV4cG9ydCBjb25zdCBERUZBVUxUX0dVQVJEX01BU0tfVkFMVUUgPSAwYjE7XG5jb25zdCBTVFlMSU5HX0lOREVYX0ZPUl9NQVBfQklORElORyA9IDA7XG5jb25zdCBTVFlMSU5HX0lOREVYX1NUQVJUX1ZBTFVFID0gMTtcblxuLy8gdGhlIHZhbHVlcyBiZWxvdyBhcmUgZ2xvYmFsIHRvIGFsbCBzdHlsaW5nIGNvZGUgYmVsb3cuIEVhY2ggdmFsdWVcbi8vIHdpbGwgZWl0aGVyIGluY3JlbWVudCBvciBtdXRhdGUgZWFjaCB0aW1lIGEgc3R5bGluZyBpbnN0cnVjdGlvbiBpc1xuLy8gZXhlY3V0ZWQuIERvIG5vdCBtb2RpZnkgdGhlIHZhbHVlcyBiZWxvdy5cbmxldCBjdXJyZW50U3R5bGVJbmRleCA9IFNUWUxJTkdfSU5ERVhfU1RBUlRfVkFMVUU7XG5sZXQgY3VycmVudENsYXNzSW5kZXggPSBTVFlMSU5HX0lOREVYX1NUQVJUX1ZBTFVFO1xubGV0IHN0eWxlc0JpdE1hc2sgPSAwO1xubGV0IGNsYXNzZXNCaXRNYXNrID0gMDtcbmxldCBkZWZlcnJlZEJpbmRpbmdRdWV1ZTogKFRTdHlsaW5nQ29udGV4dCB8IG51bWJlciB8IHN0cmluZyB8IG51bGwgfCBib29sZWFuKVtdID0gW107XG5cbi8qKlxuICogVmlzaXRzIGEgY2xhc3MtYmFzZWQgYmluZGluZyBhbmQgdXBkYXRlcyB0aGUgbmV3IHZhbHVlIChpZiBjaGFuZ2VkKS5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIGlzIGNhbGxlZCBlYWNoIHRpbWUgYSBjbGFzcy1iYXNlZCBzdHlsaW5nIGluc3RydWN0aW9uXG4gKiBpcyBleGVjdXRlZC4gSXQncyBpbXBvcnRhbnQgdGhhdCBpdCdzIGFsd2F5cyBjYWxsZWQgKGV2ZW4gaWYgdGhlIHZhbHVlXG4gKiBoYXMgbm90IGNoYW5nZWQpIHNvIHRoYXQgdGhlIGlubmVyIGNvdW50ZXIgaW5kZXggdmFsdWUgaXMgaW5jcmVtZW50ZWQuXG4gKiBUaGlzIHdheSwgZWFjaCBpbnN0cnVjdGlvbiBpcyBhbHdheXMgZ3VhcmFudGVlZCB0byBnZXQgdGhlIHNhbWUgY291bnRlclxuICogc3RhdGUgZWFjaCB0aW1lIGl0J3MgY2FsbGVkICh3aGljaCB0aGVuIGFsbG93cyB0aGUgYFRTdHlsaW5nQ29udGV4dGBcbiAqIGFuZCB0aGUgYml0IG1hc2sgdmFsdWVzIHRvIGJlIGluIHN5bmMpLlxuICovXG5leHBvcnQgZnVuY3Rpb24gdXBkYXRlQ2xhc3NCaW5kaW5nKFxuICAgIGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCwgZGF0YTogTFN0eWxpbmdEYXRhLCBwcm9wOiBzdHJpbmcgfCBudWxsLCBiaW5kaW5nSW5kZXg6IG51bWJlcixcbiAgICB2YWx1ZTogYm9vbGVhbiB8IHN0cmluZyB8IG51bGwgfCB1bmRlZmluZWQgfCBMU3R5bGluZ01hcCwgZGVmZXJSZWdpc3RyYXRpb246IGJvb2xlYW4sXG4gICAgZm9yY2VVcGRhdGU6IGJvb2xlYW4pOiB2b2lkIHtcbiAgY29uc3QgaXNNYXBCYXNlZCA9ICFwcm9wO1xuICBjb25zdCBpbmRleCA9IGlzTWFwQmFzZWQgPyBTVFlMSU5HX0lOREVYX0ZPUl9NQVBfQklORElORyA6IGN1cnJlbnRDbGFzc0luZGV4Kys7XG4gIGNvbnN0IHVwZGF0ZWQgPSB1cGRhdGVCaW5kaW5nRGF0YShcbiAgICAgIGNvbnRleHQsIGRhdGEsIGluZGV4LCBwcm9wLCBiaW5kaW5nSW5kZXgsIHZhbHVlLCBkZWZlclJlZ2lzdHJhdGlvbiwgZm9yY2VVcGRhdGUsIGZhbHNlKTtcbiAgaWYgKHVwZGF0ZWQgfHwgZm9yY2VVcGRhdGUpIHtcbiAgICBjbGFzc2VzQml0TWFzayB8PSAxIDw8IGluZGV4O1xuICB9XG59XG5cbi8qKlxuICogVmlzaXRzIGEgc3R5bGUtYmFzZWQgYmluZGluZyBhbmQgdXBkYXRlcyB0aGUgbmV3IHZhbHVlIChpZiBjaGFuZ2VkKS5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIGlzIGNhbGxlZCBlYWNoIHRpbWUgYSBzdHlsZS1iYXNlZCBzdHlsaW5nIGluc3RydWN0aW9uXG4gKiBpcyBleGVjdXRlZC4gSXQncyBpbXBvcnRhbnQgdGhhdCBpdCdzIGFsd2F5cyBjYWxsZWQgKGV2ZW4gaWYgdGhlIHZhbHVlXG4gKiBoYXMgbm90IGNoYW5nZWQpIHNvIHRoYXQgdGhlIGlubmVyIGNvdW50ZXIgaW5kZXggdmFsdWUgaXMgaW5jcmVtZW50ZWQuXG4gKiBUaGlzIHdheSwgZWFjaCBpbnN0cnVjdGlvbiBpcyBhbHdheXMgZ3VhcmFudGVlZCB0byBnZXQgdGhlIHNhbWUgY291bnRlclxuICogc3RhdGUgZWFjaCB0aW1lIGl0J3MgY2FsbGVkICh3aGljaCB0aGVuIGFsbG93cyB0aGUgYFRTdHlsaW5nQ29udGV4dGBcbiAqIGFuZCB0aGUgYml0IG1hc2sgdmFsdWVzIHRvIGJlIGluIHN5bmMpLlxuICovXG5leHBvcnQgZnVuY3Rpb24gdXBkYXRlU3R5bGVCaW5kaW5nKFxuICAgIGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCwgZGF0YTogTFN0eWxpbmdEYXRhLCBwcm9wOiBzdHJpbmcgfCBudWxsLCBiaW5kaW5nSW5kZXg6IG51bWJlcixcbiAgICB2YWx1ZTogU3RyaW5nIHwgc3RyaW5nIHwgbnVtYmVyIHwgbnVsbCB8IHVuZGVmaW5lZCB8IExTdHlsaW5nTWFwLFxuICAgIHNhbml0aXplcjogU3R5bGVTYW5pdGl6ZUZuIHwgbnVsbCwgZGVmZXJSZWdpc3RyYXRpb246IGJvb2xlYW4sIGZvcmNlVXBkYXRlOiBib29sZWFuKTogdm9pZCB7XG4gIGNvbnN0IGlzTWFwQmFzZWQgPSAhcHJvcDtcbiAgY29uc3QgaW5kZXggPSBpc01hcEJhc2VkID8gU1RZTElOR19JTkRFWF9GT1JfTUFQX0JJTkRJTkcgOiBjdXJyZW50U3R5bGVJbmRleCsrO1xuICBjb25zdCBzYW5pdGl6YXRpb25SZXF1aXJlZCA9IGlzTWFwQmFzZWQgP1xuICAgICAgdHJ1ZSA6XG4gICAgICAoc2FuaXRpemVyID8gc2FuaXRpemVyKHByb3AgISwgbnVsbCwgU3R5bGVTYW5pdGl6ZU1vZGUuVmFsaWRhdGVQcm9wZXJ0eSkgOiBmYWxzZSk7XG4gIGNvbnN0IHVwZGF0ZWQgPSB1cGRhdGVCaW5kaW5nRGF0YShcbiAgICAgIGNvbnRleHQsIGRhdGEsIGluZGV4LCBwcm9wLCBiaW5kaW5nSW5kZXgsIHZhbHVlLCBkZWZlclJlZ2lzdHJhdGlvbiwgZm9yY2VVcGRhdGUsXG4gICAgICBzYW5pdGl6YXRpb25SZXF1aXJlZCk7XG4gIGlmICh1cGRhdGVkIHx8IGZvcmNlVXBkYXRlKSB7XG4gICAgc3R5bGVzQml0TWFzayB8PSAxIDw8IGluZGV4O1xuICB9XG59XG5cbi8qKlxuICogQ2FsbGVkIGVhY2ggdGltZSBhIGJpbmRpbmcgdmFsdWUgaGFzIGNoYW5nZWQgd2l0aGluIHRoZSBwcm92aWRlZCBgVFN0eWxpbmdDb250ZXh0YC5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIGlzIGRlc2lnbmVkIHRvIGJlIGNhbGxlZCBmcm9tIGB1cGRhdGVTdHlsZUJpbmRpbmdgIGFuZCBgdXBkYXRlQ2xhc3NCaW5kaW5nYC5cbiAqIElmIGNhbGxlZCBkdXJpbmcgdGhlIGZpcnN0IHVwZGF0ZSBwYXNzLCB0aGUgYmluZGluZyB3aWxsIGJlIHJlZ2lzdGVyZWQgaW4gdGhlIGNvbnRleHQuXG4gKiBJZiB0aGUgYmluZGluZyBkb2VzIGdldCByZWdpc3RlcmVkIGFuZCB0aGUgYGRlZmVyUmVnaXN0cmF0aW9uYCBmbGFnIGlzIHRydWUgdGhlbiB0aGVcbiAqIGJpbmRpbmcgZGF0YSB3aWxsIGJlIHF1ZXVlZCB1cCB1bnRpbCB0aGUgY29udGV4dCBpcyBsYXRlciBmbHVzaGVkIGluIGBhcHBseVN0eWxpbmdgLlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gd2lsbCBhbHNvIHVwZGF0ZSBiaW5kaW5nIHNsb3QgaW4gdGhlIHByb3ZpZGVkIGBMU3R5bGluZ0RhdGFgIHdpdGggdGhlXG4gKiBuZXcgYmluZGluZyBlbnRyeSAoaWYgaXQgaGFzIGNoYW5nZWQpLlxuICpcbiAqIEByZXR1cm5zIHdoZXRoZXIgb3Igbm90IHRoZSBiaW5kaW5nIHZhbHVlIHdhcyB1cGRhdGVkIGluIHRoZSBgTFN0eWxpbmdEYXRhYC5cbiAqL1xuZnVuY3Rpb24gdXBkYXRlQmluZGluZ0RhdGEoXG4gICAgY29udGV4dDogVFN0eWxpbmdDb250ZXh0LCBkYXRhOiBMU3R5bGluZ0RhdGEsIGNvdW50ZXJJbmRleDogbnVtYmVyLCBwcm9wOiBzdHJpbmcgfCBudWxsLFxuICAgIGJpbmRpbmdJbmRleDogbnVtYmVyLFxuICAgIHZhbHVlOiBzdHJpbmcgfCBTdHJpbmcgfCBudW1iZXIgfCBib29sZWFuIHwgbnVsbCB8IHVuZGVmaW5lZCB8IExTdHlsaW5nTWFwLFxuICAgIGRlZmVyUmVnaXN0cmF0aW9uOiBib29sZWFuLCBmb3JjZVVwZGF0ZTogYm9vbGVhbiwgc2FuaXRpemF0aW9uUmVxdWlyZWQ6IGJvb2xlYW4pOiBib29sZWFuIHtcbiAgaWYgKCFpc0NvbnRleHRMb2NrZWQoY29udGV4dCkpIHtcbiAgICBpZiAoZGVmZXJSZWdpc3RyYXRpb24pIHtcbiAgICAgIGRlZmVyQmluZGluZ1JlZ2lzdHJhdGlvbihjb250ZXh0LCBjb3VudGVySW5kZXgsIHByb3AsIGJpbmRpbmdJbmRleCwgc2FuaXRpemF0aW9uUmVxdWlyZWQpO1xuICAgIH0gZWxzZSB7XG4gICAgICBkZWZlcnJlZEJpbmRpbmdRdWV1ZS5sZW5ndGggJiYgZmx1c2hEZWZlcnJlZEJpbmRpbmdzKCk7XG5cbiAgICAgIC8vIHRoaXMgd2lsbCBvbmx5IGhhcHBlbiBkdXJpbmcgdGhlIGZpcnN0IHVwZGF0ZSBwYXNzIG9mIHRoZVxuICAgICAgLy8gY29udGV4dC4gVGhlIHJlYXNvbiB3aHkgd2UgY2FuJ3QgdXNlIGB0Tm9kZS5maXJzdFRlbXBsYXRlUGFzc2BcbiAgICAgIC8vIGhlcmUgaXMgYmVjYXVzZSBpdHMgbm90IGd1YXJhbnRlZWQgdG8gYmUgdHJ1ZSB3aGVuIHRoZSBmaXJzdFxuICAgICAgLy8gdXBkYXRlIHBhc3MgaXMgZXhlY3V0ZWQgKHJlbWVtYmVyIHRoYXQgYWxsIHN0eWxpbmcgaW5zdHJ1Y3Rpb25zXG4gICAgICAvLyBhcmUgcnVuIGluIHRoZSB1cGRhdGUgcGhhc2UsIGFuZCwgYXMgYSByZXN1bHQsIGFyZSBubyBtb3JlXG4gICAgICAvLyBzdHlsaW5nIGluc3RydWN0aW9ucyB0aGF0IGFyZSBydW4gaW4gdGhlIGNyZWF0aW9uIHBoYXNlKS5cbiAgICAgIHJlZ2lzdGVyQmluZGluZyhjb250ZXh0LCBjb3VudGVySW5kZXgsIHByb3AsIGJpbmRpbmdJbmRleCwgc2FuaXRpemF0aW9uUmVxdWlyZWQpO1xuICAgIH1cbiAgfVxuXG4gIGNvbnN0IGNoYW5nZWQgPSBmb3JjZVVwZGF0ZSB8fCBoYXNWYWx1ZUNoYW5nZWQoZGF0YVtiaW5kaW5nSW5kZXhdLCB2YWx1ZSk7XG4gIGlmIChjaGFuZ2VkKSB7XG4gICAgZGF0YVtiaW5kaW5nSW5kZXhdID0gdmFsdWU7XG4gIH1cbiAgcmV0dXJuIGNoYW5nZWQ7XG59XG5cbi8qKlxuICogU2NoZWR1bGVzIGEgYmluZGluZyByZWdpc3RyYXRpb24gdG8gYmUgcnVuIGF0IGEgbGF0ZXIgcG9pbnQuXG4gKlxuICogVGhlIHJlYXNvbmluZyBmb3IgdGhpcyBmZWF0dXJlIGlzIHRvIGVuc3VyZSB0aGF0IHN0eWxpbmdcbiAqIGJpbmRpbmdzIGFyZSByZWdpc3RlcmVkIGluIHRoZSBjb3JyZWN0IG9yZGVyIGZvciB3aGVuXG4gKiBkaXJlY3RpdmVzL2NvbXBvbmVudHMgaGF2ZSBhIHN1cGVyL3N1YiBjbGFzcyBpbmhlcml0YW5jZVxuICogY2hhaW5zLiBFYWNoIGRpcmVjdGl2ZSdzIHN0eWxpbmcgYmluZGluZ3MgbXVzdCBiZVxuICogcmVnaXN0ZXJlZCBpbnRvIHRoZSBjb250ZXh0IGluIHJldmVyc2Ugb3JkZXIuIFRoZXJlZm9yZSBhbGxcbiAqIGJpbmRpbmdzIHdpbGwgYmUgYnVmZmVyZWQgaW4gcmV2ZXJzZSBvcmRlciBhbmQgdGhlbiBhcHBsaWVkXG4gKiBhZnRlciB0aGUgaW5oZXJpdGFuY2UgY2hhaW4gZXhpdHMuXG4gKi9cbmZ1bmN0aW9uIGRlZmVyQmluZGluZ1JlZ2lzdHJhdGlvbihcbiAgICBjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQsIGNvdW50ZXJJbmRleDogbnVtYmVyLCBwcm9wOiBzdHJpbmcgfCBudWxsLCBiaW5kaW5nSW5kZXg6IG51bWJlcixcbiAgICBzYW5pdGl6YXRpb25SZXF1aXJlZDogYm9vbGVhbikge1xuICBkZWZlcnJlZEJpbmRpbmdRdWV1ZS51bnNoaWZ0KGNvbnRleHQsIGNvdW50ZXJJbmRleCwgcHJvcCwgYmluZGluZ0luZGV4LCBzYW5pdGl6YXRpb25SZXF1aXJlZCk7XG59XG5cbi8qKlxuICogRmx1c2hlcyB0aGUgY29sbGVjdGlvbiBvZiBkZWZlcnJlZCBiaW5kaW5ncyBhbmQgY2F1c2VzIGVhY2ggZW50cnlcbiAqIHRvIGJlIHJlZ2lzdGVyZWQgaW50byB0aGUgY29udGV4dC5cbiAqL1xuZnVuY3Rpb24gZmx1c2hEZWZlcnJlZEJpbmRpbmdzKCkge1xuICBsZXQgaSA9IDA7XG4gIHdoaWxlIChpIDwgZGVmZXJyZWRCaW5kaW5nUXVldWUubGVuZ3RoKSB7XG4gICAgY29uc3QgY29udGV4dCA9IGRlZmVycmVkQmluZGluZ1F1ZXVlW2krK10gYXMgVFN0eWxpbmdDb250ZXh0O1xuICAgIGNvbnN0IGNvdW50ID0gZGVmZXJyZWRCaW5kaW5nUXVldWVbaSsrXSBhcyBudW1iZXI7XG4gICAgY29uc3QgcHJvcCA9IGRlZmVycmVkQmluZGluZ1F1ZXVlW2krK10gYXMgc3RyaW5nO1xuICAgIGNvbnN0IGJpbmRpbmdJbmRleCA9IGRlZmVycmVkQmluZGluZ1F1ZXVlW2krK10gYXMgbnVtYmVyIHwgbnVsbDtcbiAgICBjb25zdCBzYW5pdGl6YXRpb25SZXF1aXJlZCA9IGRlZmVycmVkQmluZGluZ1F1ZXVlW2krK10gYXMgYm9vbGVhbjtcbiAgICByZWdpc3RlckJpbmRpbmcoY29udGV4dCwgY291bnQsIHByb3AsIGJpbmRpbmdJbmRleCwgc2FuaXRpemF0aW9uUmVxdWlyZWQpO1xuICB9XG4gIGRlZmVycmVkQmluZGluZ1F1ZXVlLmxlbmd0aCA9IDA7XG59XG5cbi8qKlxuICogUmVnaXN0ZXJzIHRoZSBwcm92aWRlZCBiaW5kaW5nIChwcm9wICsgYmluZGluZ0luZGV4KSBpbnRvIHRoZSBjb250ZXh0LlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gaXMgc2hhcmVkIGJldHdlZW4gYmluZGluZ3MgdGhhdCBhcmUgYXNzaWduZWQgaW1tZWRpYXRlbHlcbiAqICh2aWEgYHVwZGF0ZUJpbmRpbmdEYXRhYCkgYW5kIGF0IGEgZGVmZXJyZWQgc3RhZ2UuIFdoZW4gY2FsbGVkLCBpdCB3aWxsXG4gKiBmaWd1cmUgb3V0IGV4YWN0bHkgd2hlcmUgdG8gcGxhY2UgdGhlIGJpbmRpbmcgZGF0YSBpbiB0aGUgY29udGV4dC5cbiAqXG4gKiBJdCBpcyBuZWVkZWQgYmVjYXVzZSBpdCB3aWxsIGVpdGhlciB1cGRhdGUgb3IgaW5zZXJ0IGEgc3R5bGluZyBwcm9wZXJ0eVxuICogaW50byB0aGUgY29udGV4dCBhdCB0aGUgY29ycmVjdCBzcG90LlxuICpcbiAqIFdoZW4gY2FsbGVkLCBvbmUgb2YgdHdvIHRoaW5ncyB3aWxsIGhhcHBlbjpcbiAqXG4gKiAxKSBJZiB0aGUgcHJvcGVydHkgYWxyZWFkeSBleGlzdHMgaW4gdGhlIGNvbnRleHQgdGhlbiBpdCB3aWxsIGp1c3QgYWRkXG4gKiAgICB0aGUgcHJvdmlkZWQgYGJpbmRpbmdWYWx1ZWAgdG8gdGhlIGVuZCBvZiB0aGUgYmluZGluZyBzb3VyY2VzIHJlZ2lvblxuICogICAgZm9yIHRoYXQgcGFydGljdWxhciBwcm9wZXJ0eS5cbiAqXG4gKiAgICAtIElmIHRoZSBiaW5kaW5nIHZhbHVlIGlzIGEgbnVtYmVyIHRoZW4gaXQgd2lsbCBiZSBhZGRlZCBhcyBhIG5ld1xuICogICAgICBiaW5kaW5nIGluZGV4IHNvdXJjZSBuZXh0IHRvIHRoZSBvdGhlciBiaW5kaW5nIHNvdXJjZXMgZm9yIHRoZSBwcm9wZXJ0eS5cbiAqXG4gKiAgICAtIE90aGVyd2lzZSwgaWYgdGhlIGJpbmRpbmcgdmFsdWUgaXMgYSBzdHJpbmcvYm9vbGVhbi9udWxsIHR5cGUgdGhlbiBpdCB3aWxsXG4gKiAgICAgIHJlcGxhY2UgdGhlIGRlZmF1bHQgdmFsdWUgZm9yIHRoZSBwcm9wZXJ0eSBpZiB0aGUgZGVmYXVsdCB2YWx1ZSBpcyBgbnVsbGAuXG4gKlxuICogMikgSWYgdGhlIHByb3BlcnR5IGRvZXMgbm90IGV4aXN0IHRoZW4gaXQgd2lsbCBiZSBpbnNlcnRlZCBpbnRvIHRoZSBjb250ZXh0LlxuICogICAgVGhlIHN0eWxpbmcgY29udGV4dCByZWxpZXMgb24gYWxsIHByb3BlcnRpZXMgYmVpbmcgc3RvcmVkIGluIGFscGhhYmV0aWNhbFxuICogICAgb3JkZXIsIHNvIGl0IGtub3dzIGV4YWN0bHkgd2hlcmUgdG8gc3RvcmUgaXQuXG4gKlxuICogICAgV2hlbiBpbnNlcnRlZCwgYSBkZWZhdWx0IGBudWxsYCB2YWx1ZSBpcyBjcmVhdGVkIGZvciB0aGUgcHJvcGVydHkgd2hpY2ggZXhpc3RzXG4gKiAgICBhcyB0aGUgZGVmYXVsdCB2YWx1ZSBmb3IgdGhlIGJpbmRpbmcuIElmIHRoZSBiaW5kaW5nVmFsdWUgcHJvcGVydHkgaXMgaW5zZXJ0ZWRcbiAqICAgIGFuZCBpdCBpcyBlaXRoZXIgYSBzdHJpbmcsIG51bWJlciBvciBudWxsIHZhbHVlIHRoZW4gdGhhdCB3aWxsIHJlcGxhY2UgdGhlIGRlZmF1bHRcbiAqICAgIHZhbHVlLlxuICpcbiAqIE5vdGUgdGhhdCB0aGlzIGZ1bmN0aW9uIGlzIGFsc28gdXNlZCBmb3IgbWFwLWJhc2VkIHN0eWxpbmcgYmluZGluZ3MuIFRoZXkgYXJlIHRyZWF0ZWRcbiAqIG11Y2ggdGhlIHNhbWUgYXMgcHJvcC1iYXNlZCBiaW5kaW5ncywgYnV0LCBiZWNhdXNlIHRoZXkgZG8gbm90IGhhdmUgYSBwcm9wZXJ0eSB2YWx1ZVxuICogKHNpbmNlIGl0J3MgYSBtYXApLCBhbGwgbWFwLWJhc2VkIGVudHJpZXMgYXJlIHN0b3JlZCBpbiBhbiBhbHJlYWR5IHBvcHVsYXRlZCBhcmVhIG9mXG4gKiB0aGUgY29udGV4dCBhdCB0aGUgdG9wICh3aGljaCBpcyByZXNlcnZlZCBmb3IgbWFwLWJhc2VkIGVudHJpZXMpLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVnaXN0ZXJCaW5kaW5nKFxuICAgIGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCwgY291bnRJZDogbnVtYmVyLCBwcm9wOiBzdHJpbmcgfCBudWxsLFxuICAgIGJpbmRpbmdWYWx1ZTogbnVtYmVyIHwgbnVsbCB8IHN0cmluZyB8IGJvb2xlYW4sIHNhbml0aXphdGlvblJlcXVpcmVkPzogYm9vbGVhbikge1xuICAvLyBwcm9wLWJhc2VkIGJpbmRpbmdzIChlLmcgYDxkaXYgW3N0eWxlLndpZHRoXT1cIndcIiBbY2xhc3MuZm9vXT1cImZcIj5gKVxuICBpZiAocHJvcCkge1xuICAgIGxldCBmb3VuZCA9IGZhbHNlO1xuICAgIGxldCBpID0gZ2V0UHJvcFZhbHVlc1N0YXJ0UG9zaXRpb24oY29udGV4dCk7XG4gICAgd2hpbGUgKGkgPCBjb250ZXh0Lmxlbmd0aCkge1xuICAgICAgY29uc3QgdmFsdWVzQ291bnQgPSBnZXRWYWx1ZXNDb3VudChjb250ZXh0LCBpKTtcbiAgICAgIGNvbnN0IHAgPSBnZXRQcm9wKGNvbnRleHQsIGkpO1xuICAgICAgZm91bmQgPSBwcm9wIDw9IHA7XG4gICAgICBpZiAoZm91bmQpIHtcbiAgICAgICAgLy8gYWxsIHN0eWxlL2NsYXNzIGJpbmRpbmdzIGFyZSBzb3J0ZWQgYnkgcHJvcGVydHkgbmFtZVxuICAgICAgICBpZiAocHJvcCA8IHApIHtcbiAgICAgICAgICBhbGxvY2F0ZU5ld0NvbnRleHRFbnRyeShjb250ZXh0LCBpLCBwcm9wLCBzYW5pdGl6YXRpb25SZXF1aXJlZCk7XG4gICAgICAgIH1cbiAgICAgICAgYWRkQmluZGluZ0ludG9Db250ZXh0KGNvbnRleHQsIGZhbHNlLCBpLCBiaW5kaW5nVmFsdWUsIGNvdW50SWQpO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGkgKz0gVFN0eWxpbmdDb250ZXh0SW5kZXguQmluZGluZ3NTdGFydE9mZnNldCArIHZhbHVlc0NvdW50O1xuICAgIH1cblxuICAgIGlmICghZm91bmQpIHtcbiAgICAgIGFsbG9jYXRlTmV3Q29udGV4dEVudHJ5KGNvbnRleHQsIGNvbnRleHQubGVuZ3RoLCBwcm9wLCBzYW5pdGl6YXRpb25SZXF1aXJlZCk7XG4gICAgICBhZGRCaW5kaW5nSW50b0NvbnRleHQoY29udGV4dCwgZmFsc2UsIGksIGJpbmRpbmdWYWx1ZSwgY291bnRJZCk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIC8vIG1hcC1iYXNlZCBiaW5kaW5ncyAoZS5nIGA8ZGl2IFtzdHlsZV09XCJzXCIgW2NsYXNzXT1cIntjbGFzc05hbWU6dHJ1ZX1cIj5gKVxuICAgIC8vIHRoZXJlIGlzIG5vIG5lZWQgdG8gYWxsb2NhdGUgdGhlIG1hcC1iYXNlZCBiaW5kaW5nIHJlZ2lvbiBpbnRvIHRoZSBjb250ZXh0XG4gICAgLy8gc2luY2UgaXQgaXMgYWxyZWFkeSB0aGVyZSB3aGVuIHRoZSBjb250ZXh0IGlzIGZpcnN0IGNyZWF0ZWQuXG4gICAgYWRkQmluZGluZ0ludG9Db250ZXh0KFxuICAgICAgICBjb250ZXh0LCB0cnVlLCBUU3R5bGluZ0NvbnRleHRJbmRleC5NYXBCaW5kaW5nc1Bvc2l0aW9uLCBiaW5kaW5nVmFsdWUsIGNvdW50SWQpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGFsbG9jYXRlTmV3Q29udGV4dEVudHJ5KFxuICAgIGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCwgaW5kZXg6IG51bWJlciwgcHJvcDogc3RyaW5nLCBzYW5pdGl6YXRpb25SZXF1aXJlZD86IGJvb2xlYW4pIHtcbiAgLy8gMSwyOiBzcGxpY2UgaW5kZXggbG9jYXRpb25zXG4gIC8vIDM6IGVhY2ggZW50cnkgZ2V0cyBhIGNvbmZpZyB2YWx1ZSAoZ3VhcmQgbWFzayArIGZsYWdzKVxuICAvLyA0LiBlYWNoIGVudHJ5IGdldHMgYSBzaXplIHZhbHVlICh3aGljaCBpcyBhbHdheXMgb25lIGJlY2F1c2UgdGhlcmUgaXMgYWx3YXlzIGEgZGVmYXVsdCBiaW5kaW5nXG4gIC8vIHZhbHVlKVxuICAvLyA1LiB0aGUgcHJvcGVydHkgdGhhdCBpcyBnZXR0aW5nIGFsbG9jYXRlZCBpbnRvIHRoZSBjb250ZXh0XG4gIC8vIDYuIHRoZSBkZWZhdWx0IGJpbmRpbmcgdmFsdWUgKHVzdWFsbHkgYG51bGxgKVxuICBjb25zdCBjb25maWcgPSBzYW5pdGl6YXRpb25SZXF1aXJlZCA/IFRTdHlsaW5nQ29udGV4dFByb3BDb25maWdGbGFncy5TYW5pdGl6YXRpb25SZXF1aXJlZCA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgVFN0eWxpbmdDb250ZXh0UHJvcENvbmZpZ0ZsYWdzLkRlZmF1bHQ7XG4gIGNvbnRleHQuc3BsaWNlKGluZGV4LCAwLCBjb25maWcsIERFRkFVTFRfU0laRV9WQUxVRSwgcHJvcCwgREVGQVVMVF9CSU5ESU5HX1ZBTFVFKTtcbiAgc2V0R3VhcmRNYXNrKGNvbnRleHQsIGluZGV4LCBERUZBVUxUX0dVQVJEX01BU0tfVkFMVUUpO1xufVxuXG4vKipcbiAqIEluc2VydHMgYSBuZXcgYmluZGluZyB2YWx1ZSBpbnRvIGEgc3R5bGluZyBwcm9wZXJ0eSB0dXBsZSBpbiB0aGUgYFRTdHlsaW5nQ29udGV4dGAuXG4gKlxuICogQSBiaW5kaW5nVmFsdWUgaXMgaW5zZXJ0ZWQgaW50byBhIGNvbnRleHQgZHVyaW5nIHRoZSBmaXJzdCB1cGRhdGUgcGFzc1xuICogb2YgYSB0ZW1wbGF0ZSBvciBob3N0IGJpbmRpbmdzIGZ1bmN0aW9uLiBXaGVuIHRoaXMgb2NjdXJzLCB0d28gdGhpbmdzXG4gKiBoYXBwZW46XG4gKlxuICogLSBJZiB0aGUgYmluZGluZ1ZhbHVlIHZhbHVlIGlzIGEgbnVtYmVyIHRoZW4gaXQgaXMgdHJlYXRlZCBhcyBhIGJpbmRpbmdJbmRleFxuICogICB2YWx1ZSAoYSBpbmRleCBpbiB0aGUgYExWaWV3YCkgYW5kIGl0IHdpbGwgYmUgaW5zZXJ0ZWQgbmV4dCB0byB0aGUgb3RoZXJcbiAqICAgYmluZGluZyBpbmRleCBlbnRyaWVzLlxuICpcbiAqIC0gT3RoZXJ3aXNlIHRoZSBiaW5kaW5nIHZhbHVlIHdpbGwgdXBkYXRlIHRoZSBkZWZhdWx0IHZhbHVlIGZvciB0aGUgcHJvcGVydHlcbiAqICAgYW5kIHRoaXMgd2lsbCBvbmx5IGhhcHBlbiBpZiB0aGUgZGVmYXVsdCB2YWx1ZSBpcyBgbnVsbGAuXG4gKlxuICogTm90ZSB0aGF0IHRoaXMgZnVuY3Rpb24gYWxzbyBoYW5kbGVzIG1hcC1iYXNlZCBiaW5kaW5ncyBhbmQgd2lsbCBpbnNlcnQgdGhlbVxuICogYXQgdGhlIHRvcCBvZiB0aGUgY29udGV4dC5cbiAqL1xuZnVuY3Rpb24gYWRkQmluZGluZ0ludG9Db250ZXh0KFxuICAgIGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCwgaXNNYXBCYXNlZDogYm9vbGVhbiwgaW5kZXg6IG51bWJlcixcbiAgICBiaW5kaW5nVmFsdWU6IG51bWJlciB8IHN0cmluZyB8IGJvb2xlYW4gfCBudWxsLCBjb3VudElkOiBudW1iZXIpIHtcbiAgY29uc3QgdmFsdWVzQ291bnQgPSBnZXRWYWx1ZXNDb3VudChjb250ZXh0LCBpbmRleCk7XG5cbiAgbGV0IGxhc3RWYWx1ZUluZGV4ID0gaW5kZXggKyBUU3R5bGluZ0NvbnRleHRJbmRleC5CaW5kaW5nc1N0YXJ0T2Zmc2V0ICsgdmFsdWVzQ291bnQ7XG4gIGlmICghaXNNYXBCYXNlZCkge1xuICAgIC8vIHByb3AtYmFzZWQgdmFsdWVzIGFsbCBoYXZlIGRlZmF1bHQgdmFsdWVzLCBidXQgbWFwLWJhc2VkIGVudHJpZXMgZG8gbm90LlxuICAgIC8vIHdlIHdhbnQgdG8gYWNjZXNzIHRoZSBpbmRleCBmb3IgdGhlIGRlZmF1bHQgdmFsdWUgaW4gdGhpcyBjYXNlIGFuZCBub3QganVzdFxuICAgIC8vIHRoZSBiaW5kaW5ncy4uLlxuICAgIGxhc3RWYWx1ZUluZGV4LS07XG4gIH1cblxuICBpZiAodHlwZW9mIGJpbmRpbmdWYWx1ZSA9PT0gJ251bWJlcicpIHtcbiAgICBjb250ZXh0LnNwbGljZShsYXN0VmFsdWVJbmRleCwgMCwgYmluZGluZ1ZhbHVlKTtcbiAgICAoY29udGV4dFtpbmRleCArIFRTdHlsaW5nQ29udGV4dEluZGV4LlZhbHVlc0NvdW50T2Zmc2V0XSBhcyBudW1iZXIpKys7XG5cbiAgICAvLyBub3cgdGhhdCBhIG5ldyBiaW5kaW5nIGluZGV4IGhhcyBiZWVuIGFkZGVkIHRvIHRoZSBwcm9wZXJ0eVxuICAgIC8vIHRoZSBndWFyZCBtYXNrIGJpdCB2YWx1ZSAoYXQgdGhlIGBjb3VudElkYCBwb3NpdGlvbikgbmVlZHNcbiAgICAvLyB0byBiZSBpbmNsdWRlZCBpbnRvIHRoZSBleGlzdGluZyBtYXNrIHZhbHVlLlxuICAgIGNvbnN0IGd1YXJkTWFzayA9IGdldEd1YXJkTWFzayhjb250ZXh0LCBpbmRleCkgfCAoMSA8PCBjb3VudElkKTtcbiAgICBzZXRHdWFyZE1hc2soY29udGV4dCwgaW5kZXgsIGd1YXJkTWFzayk7XG4gIH0gZWxzZSBpZiAodHlwZW9mIGJpbmRpbmdWYWx1ZSA9PT0gJ3N0cmluZycgJiYgY29udGV4dFtsYXN0VmFsdWVJbmRleF0gPT0gbnVsbCkge1xuICAgIGNvbnRleHRbbGFzdFZhbHVlSW5kZXhdID0gYmluZGluZ1ZhbHVlO1xuICB9XG59XG5cbi8qKlxuICogQXBwbGllcyBhbGwgY2xhc3MgZW50cmllcyBpbiB0aGUgcHJvdmlkZWQgY29udGV4dCB0byB0aGUgcHJvdmlkZWQgZWxlbWVudCBhbmQgcmVzZXRzXG4gKiBhbnkgY291bnRlciBhbmQvb3IgYml0TWFzayB2YWx1ZXMgYXNzb2NpYXRlZCB3aXRoIGNsYXNzIGJpbmRpbmdzLlxuICpcbiAqIEByZXR1cm5zIHdoZXRoZXIgb3Igbm90IHRoZSBjbGFzc2VzIHdlcmUgZmx1c2hlZCB0byB0aGUgZWxlbWVudC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFwcGx5Q2xhc3NlcyhcbiAgICByZW5kZXJlcjogUmVuZGVyZXIzIHwgUHJvY2VkdXJhbFJlbmRlcmVyMyB8IG51bGwsIGRhdGE6IExTdHlsaW5nRGF0YSwgY29udGV4dDogVFN0eWxpbmdDb250ZXh0LFxuICAgIGVsZW1lbnQ6IFJFbGVtZW50LCBkaXJlY3RpdmVJbmRleDogbnVtYmVyKTogYm9vbGVhbiB7XG4gIGxldCBjbGFzc2VzRmx1c2hlZCA9IGZhbHNlO1xuICBpZiAoYWxsb3dTdHlsaW5nRmx1c2goY29udGV4dCwgZGlyZWN0aXZlSW5kZXgpKSB7XG4gICAgY29uc3QgaXNGaXJzdFBhc3MgPSAhaXNDb250ZXh0TG9ja2VkKGNvbnRleHQpO1xuICAgIGlzRmlyc3RQYXNzICYmIGxvY2tDb250ZXh0KGNvbnRleHQpO1xuICAgIGlmIChjbGFzc2VzQml0TWFzaykge1xuICAgICAgLy8gdGhlcmUgaXMgbm8gd2F5IHRvIHNhbml0aXplIGEgY2xhc3MgdmFsdWUgdGhlcmVmb3JlIGBzYW5pdGl6ZXI9bnVsbGBcbiAgICAgIGFwcGx5U3R5bGluZyhjb250ZXh0LCByZW5kZXJlciwgZWxlbWVudCwgZGF0YSwgY2xhc3Nlc0JpdE1hc2ssIHNldENsYXNzLCBudWxsKTtcbiAgICAgIGNsYXNzZXNCaXRNYXNrID0gMDtcbiAgICAgIGNsYXNzZXNGbHVzaGVkID0gdHJ1ZTtcbiAgICB9XG4gICAgY3VycmVudENsYXNzSW5kZXggPSBTVFlMSU5HX0lOREVYX1NUQVJUX1ZBTFVFO1xuICB9XG4gIHJldHVybiBjbGFzc2VzRmx1c2hlZDtcbn1cblxuLyoqXG4gKiBBcHBsaWVzIGFsbCBzdHlsZSBlbnRyaWVzIGluIHRoZSBwcm92aWRlZCBjb250ZXh0IHRvIHRoZSBwcm92aWRlZCBlbGVtZW50IGFuZCByZXNldHNcbiAqIGFueSBjb3VudGVyIGFuZC9vciBiaXRNYXNrIHZhbHVlcyBhc3NvY2lhdGVkIHdpdGggc3R5bGUgYmluZGluZ3MuXG4gKlxuICogQHJldHVybnMgd2hldGhlciBvciBub3QgdGhlIHN0eWxlcyB3ZXJlIGZsdXNoZWQgdG8gdGhlIGVsZW1lbnQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhcHBseVN0eWxlcyhcbiAgICByZW5kZXJlcjogUmVuZGVyZXIzIHwgUHJvY2VkdXJhbFJlbmRlcmVyMyB8IG51bGwsIGRhdGE6IExTdHlsaW5nRGF0YSwgY29udGV4dDogVFN0eWxpbmdDb250ZXh0LFxuICAgIGVsZW1lbnQ6IFJFbGVtZW50LCBkaXJlY3RpdmVJbmRleDogbnVtYmVyLCBzYW5pdGl6ZXI6IFN0eWxlU2FuaXRpemVGbiB8IG51bGwpOiBib29sZWFuIHtcbiAgbGV0IHN0eWxlc0ZsdXNoZWQgPSBmYWxzZTtcbiAgaWYgKGFsbG93U3R5bGluZ0ZsdXNoKGNvbnRleHQsIGRpcmVjdGl2ZUluZGV4KSkge1xuICAgIGNvbnN0IGlzRmlyc3RQYXNzID0gIWlzQ29udGV4dExvY2tlZChjb250ZXh0KTtcbiAgICBpc0ZpcnN0UGFzcyAmJiBsb2NrQ29udGV4dChjb250ZXh0KTtcbiAgICBpZiAoc3R5bGVzQml0TWFzaykge1xuICAgICAgYXBwbHlTdHlsaW5nKGNvbnRleHQsIHJlbmRlcmVyLCBlbGVtZW50LCBkYXRhLCBzdHlsZXNCaXRNYXNrLCBzZXRTdHlsZSwgc2FuaXRpemVyKTtcbiAgICAgIHN0eWxlc0JpdE1hc2sgPSAwO1xuICAgICAgc3R5bGVzRmx1c2hlZCA9IHRydWU7XG4gICAgfVxuICAgIGN1cnJlbnRTdHlsZUluZGV4ID0gU1RZTElOR19JTkRFWF9TVEFSVF9WQUxVRTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuICByZXR1cm4gc3R5bGVzRmx1c2hlZDtcbn1cblxuLyoqXG4gKiBSdW5zIHRocm91Z2ggdGhlIHByb3ZpZGVkIHN0eWxpbmcgY29udGV4dCBhbmQgYXBwbGllcyBlYWNoIHZhbHVlIHRvXG4gKiB0aGUgcHJvdmlkZWQgZWxlbWVudCAodmlhIHRoZSByZW5kZXJlcikgaWYgb25lIG9yIG1vcmUgdmFsdWVzIGFyZSBwcmVzZW50LlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gd2lsbCBpdGVyYXRlIG92ZXIgYWxsIGVudHJpZXMgcHJlc2VudCBpbiB0aGUgcHJvdmlkZWRcbiAqIGBUU3R5bGluZ0NvbnRleHRgIGFycmF5IChib3RoIHByb3AtYmFzZWQgYW5kIG1hcC1iYXNlZCBiaW5kaW5ncykuLVxuICpcbiAqIEVhY2ggZW50cnksIHdpdGhpbiB0aGUgYFRTdHlsaW5nQ29udGV4dGAgYXJyYXksIGlzIHN0b3JlZCBhbHBoYWJldGljYWxseVxuICogYW5kIHRoaXMgbWVhbnMgdGhhdCBlYWNoIHByb3AvdmFsdWUgZW50cnkgd2lsbCBiZSBhcHBsaWVkIGluIG9yZGVyXG4gKiAoc28gbG9uZyBhcyBpdCBpcyBtYXJrZWQgZGlydHkgaW4gdGhlIHByb3ZpZGVkIGBiaXRNYXNrYCB2YWx1ZSkuXG4gKlxuICogSWYgdGhlcmUgYXJlIGFueSBtYXAtYmFzZWQgZW50cmllcyBwcmVzZW50ICh3aGljaCBhcmUgYXBwbGllZCB0byB0aGVcbiAqIGVsZW1lbnQgdmlhIHRoZSBgW3N0eWxlXWAgYW5kIGBbY2xhc3NdYCBiaW5kaW5ncykgdGhlbiB0aG9zZSBlbnRyaWVzXG4gKiB3aWxsIGJlIGFwcGxpZWQgYXMgd2VsbC4gSG93ZXZlciwgdGhlIGNvZGUgZm9yIHRoYXQgaXMgbm90IGFwYXJ0IG9mXG4gKiB0aGlzIGZ1bmN0aW9uLiBJbnN0ZWFkLCBlYWNoIHRpbWUgYSBwcm9wZXJ0eSBpcyB2aXNpdGVkLCB0aGVuIHRoZVxuICogY29kZSBiZWxvdyB3aWxsIGNhbGwgYW4gZXh0ZXJuYWwgZnVuY3Rpb24gY2FsbGVkIGBzdHlsaW5nTWFwc1N5bmNGbmBcbiAqIGFuZCwgaWYgcHJlc2VudCwgaXQgd2lsbCBrZWVwIHRoZSBhcHBsaWNhdGlvbiBvZiBzdHlsaW5nIHZhbHVlcyBpblxuICogbWFwLWJhc2VkIGJpbmRpbmdzIHVwIHRvIHN5bmMgd2l0aCB0aGUgYXBwbGljYXRpb24gb2YgcHJvcC1iYXNlZFxuICogYmluZGluZ3MuXG4gKlxuICogVmlzaXQgYHN0eWxpbmdfbmV4dC9tYXBfYmFzZWRfYmluZGluZ3MudHNgIHRvIGxlYXJuIG1vcmUgYWJvdXQgaG93IHRoZVxuICogYWxnb3JpdGhtIHdvcmtzIGZvciBtYXAtYmFzZWQgc3R5bGluZyBiaW5kaW5ncy5cbiAqXG4gKiBOb3RlIHRoYXQgdGhpcyBmdW5jdGlvbiBpcyBub3QgZGVzaWduZWQgdG8gYmUgY2FsbGVkIGluIGlzb2xhdGlvbiAodXNlXG4gKiBgYXBwbHlDbGFzc2VzYCBhbmQgYGFwcGx5U3R5bGVzYCB0byBhY3R1YWxseSBhcHBseSBzdHlsaW5nIHZhbHVlcykuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhcHBseVN0eWxpbmcoXG4gICAgY29udGV4dDogVFN0eWxpbmdDb250ZXh0LCByZW5kZXJlcjogUmVuZGVyZXIzIHwgUHJvY2VkdXJhbFJlbmRlcmVyMyB8IG51bGwsIGVsZW1lbnQ6IFJFbGVtZW50LFxuICAgIGJpbmRpbmdEYXRhOiBMU3R5bGluZ0RhdGEsIGJpdE1hc2tWYWx1ZTogbnVtYmVyIHwgYm9vbGVhbiwgYXBwbHlTdHlsaW5nRm46IEFwcGx5U3R5bGluZ0ZuLFxuICAgIHNhbml0aXplcjogU3R5bGVTYW5pdGl6ZUZuIHwgbnVsbCkge1xuICBkZWZlcnJlZEJpbmRpbmdRdWV1ZS5sZW5ndGggJiYgZmx1c2hEZWZlcnJlZEJpbmRpbmdzKCk7XG5cbiAgY29uc3QgYml0TWFzayA9IG5vcm1hbGl6ZUJpdE1hc2tWYWx1ZShiaXRNYXNrVmFsdWUpO1xuICBjb25zdCBzdHlsaW5nTWFwc1N5bmNGbiA9IGdldFN0eWxpbmdNYXBzU3luY0ZuKCk7XG4gIGNvbnN0IG1hcHNHdWFyZE1hc2sgPSBnZXRHdWFyZE1hc2soY29udGV4dCwgVFN0eWxpbmdDb250ZXh0SW5kZXguTWFwQmluZGluZ3NQb3NpdGlvbik7XG4gIGNvbnN0IGFwcGx5QWxsVmFsdWVzID0gKGJpdE1hc2sgJiBtYXBzR3VhcmRNYXNrKSA+IDA7XG4gIGNvbnN0IG1hcHNNb2RlID1cbiAgICAgIGFwcGx5QWxsVmFsdWVzID8gU3R5bGluZ01hcHNTeW5jTW9kZS5BcHBseUFsbFZhbHVlcyA6IFN0eWxpbmdNYXBzU3luY01vZGUuVHJhdmVyc2VWYWx1ZXM7XG5cbiAgbGV0IGkgPSBnZXRQcm9wVmFsdWVzU3RhcnRQb3NpdGlvbihjb250ZXh0KTtcbiAgd2hpbGUgKGkgPCBjb250ZXh0Lmxlbmd0aCkge1xuICAgIGNvbnN0IHZhbHVlc0NvdW50ID0gZ2V0VmFsdWVzQ291bnQoY29udGV4dCwgaSk7XG4gICAgY29uc3QgZ3VhcmRNYXNrID0gZ2V0R3VhcmRNYXNrKGNvbnRleHQsIGkpO1xuICAgIGlmIChiaXRNYXNrICYgZ3VhcmRNYXNrKSB7XG4gICAgICBsZXQgdmFsdWVBcHBsaWVkID0gZmFsc2U7XG4gICAgICBjb25zdCBwcm9wID0gZ2V0UHJvcChjb250ZXh0LCBpKTtcbiAgICAgIGNvbnN0IHZhbHVlc0NvdW50VXBUb0RlZmF1bHQgPSB2YWx1ZXNDb3VudCAtIDE7XG4gICAgICBjb25zdCBkZWZhdWx0VmFsdWUgPSBnZXRCaW5kaW5nVmFsdWUoY29udGV4dCwgaSwgdmFsdWVzQ291bnRVcFRvRGVmYXVsdCkgYXMgc3RyaW5nIHwgbnVsbDtcblxuICAgICAgLy8gY2FzZSAxOiBhcHBseSBwcm9wLWJhc2VkIHZhbHVlc1xuICAgICAgLy8gdHJ5IHRvIGFwcGx5IHRoZSBiaW5kaW5nIHZhbHVlcyBhbmQgc2VlIGlmIGEgbm9uLW51bGxcbiAgICAgIC8vIHZhbHVlIGdldHMgc2V0IGZvciB0aGUgc3R5bGluZyBiaW5kaW5nXG4gICAgICBmb3IgKGxldCBqID0gMDsgaiA8IHZhbHVlc0NvdW50VXBUb0RlZmF1bHQ7IGorKykge1xuICAgICAgICBjb25zdCBiaW5kaW5nSW5kZXggPSBnZXRCaW5kaW5nVmFsdWUoY29udGV4dCwgaSwgaikgYXMgbnVtYmVyO1xuICAgICAgICBjb25zdCB2YWx1ZSA9IGJpbmRpbmdEYXRhW2JpbmRpbmdJbmRleF07XG4gICAgICAgIGlmIChpc1N0eWxpbmdWYWx1ZURlZmluZWQodmFsdWUpKSB7XG4gICAgICAgICAgY29uc3QgZmluYWxWYWx1ZSA9IHNhbml0aXplciAmJiBpc1Nhbml0aXphdGlvblJlcXVpcmVkKGNvbnRleHQsIGkpID9cbiAgICAgICAgICAgICAgc2FuaXRpemVyKHByb3AsIHZhbHVlLCBTdHlsZVNhbml0aXplTW9kZS5TYW5pdGl6ZU9ubHkpIDpcbiAgICAgICAgICAgICAgdmFsdWU7XG4gICAgICAgICAgYXBwbHlTdHlsaW5nRm4ocmVuZGVyZXIsIGVsZW1lbnQsIHByb3AsIGZpbmFsVmFsdWUsIGJpbmRpbmdJbmRleCk7XG4gICAgICAgICAgdmFsdWVBcHBsaWVkID0gdHJ1ZTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBjYXNlIDI6IGFwcGx5IG1hcC1iYXNlZCB2YWx1ZXNcbiAgICAgIC8vIHRyYXZlcnNlIHRocm91Z2ggZWFjaCBtYXAtYmFzZWQgc3R5bGluZyBiaW5kaW5nIGFuZCB1cGRhdGUgYWxsIHZhbHVlcyB1cCB0b1xuICAgICAgLy8gdGhlIHByb3ZpZGVkIGBwcm9wYCB2YWx1ZS4gSWYgdGhlIHByb3BlcnR5IHdhcyBub3QgYXBwbGllZCBpbiB0aGUgbG9vcCBhYm92ZVxuICAgICAgLy8gdGhlbiBpdCB3aWxsIGJlIGF0dGVtcHRlZCB0byBiZSBhcHBsaWVkIGluIHRoZSBtYXBzIHN5bmMgY29kZSBiZWxvdy5cbiAgICAgIGlmIChzdHlsaW5nTWFwc1N5bmNGbikge1xuICAgICAgICAvLyBkZXRlcm1pbmUgd2hldGhlciBvciBub3QgdG8gYXBwbHkgdGhlIHRhcmdldCBwcm9wZXJ0eSBvciB0byBza2lwIGl0XG4gICAgICAgIGNvbnN0IG1vZGUgPSBtYXBzTW9kZSB8ICh2YWx1ZUFwcGxpZWQgPyBTdHlsaW5nTWFwc1N5bmNNb2RlLlNraXBUYXJnZXRQcm9wIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFN0eWxpbmdNYXBzU3luY01vZGUuQXBwbHlUYXJnZXRQcm9wKTtcbiAgICAgICAgY29uc3QgdmFsdWVBcHBsaWVkV2l0aGluTWFwID0gc3R5bGluZ01hcHNTeW5jRm4oXG4gICAgICAgICAgICBjb250ZXh0LCByZW5kZXJlciwgZWxlbWVudCwgYmluZGluZ0RhdGEsIGFwcGx5U3R5bGluZ0ZuLCBzYW5pdGl6ZXIsIG1vZGUsIHByb3AsXG4gICAgICAgICAgICBkZWZhdWx0VmFsdWUpO1xuICAgICAgICB2YWx1ZUFwcGxpZWQgPSB2YWx1ZUFwcGxpZWQgfHwgdmFsdWVBcHBsaWVkV2l0aGluTWFwO1xuICAgICAgfVxuXG4gICAgICAvLyBjYXNlIDM6IGFwcGx5IHRoZSBkZWZhdWx0IHZhbHVlXG4gICAgICAvLyBpZiB0aGUgdmFsdWUgaGFzIG5vdCB5ZXQgYmVlbiBhcHBsaWVkIHRoZW4gYSB0cnV0aHkgdmFsdWUgZG9lcyBub3QgZXhpc3QgaW4gdGhlXG4gICAgICAvLyBwcm9wLWJhc2VkIG9yIG1hcC1iYXNlZCBiaW5kaW5ncyBjb2RlLiBJZiBhbmQgd2hlbiB0aGlzIGhhcHBlbnMsIGp1c3QgYXBwbHkgdGhlXG4gICAgICAvLyBkZWZhdWx0IHZhbHVlIChldmVuIGlmIHRoZSBkZWZhdWx0IHZhbHVlIGlzIGBudWxsYCkuXG4gICAgICBpZiAoIXZhbHVlQXBwbGllZCkge1xuICAgICAgICBhcHBseVN0eWxpbmdGbihyZW5kZXJlciwgZWxlbWVudCwgcHJvcCwgZGVmYXVsdFZhbHVlKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpICs9IFRTdHlsaW5nQ29udGV4dEluZGV4LkJpbmRpbmdzU3RhcnRPZmZzZXQgKyB2YWx1ZXNDb3VudDtcbiAgfVxuXG4gIC8vIHRoZSBtYXAtYmFzZWQgc3R5bGluZyBlbnRyaWVzIG1heSBoYXZlIG5vdCBhcHBsaWVkIGFsbCB0aGVpclxuICAvLyB2YWx1ZXMuIEZvciB0aGlzIHJlYXNvbiwgb25lIG1vcmUgY2FsbCB0byB0aGUgc3luYyBmdW5jdGlvblxuICAvLyBuZWVkcyB0byBiZSBpc3N1ZWQgYXQgdGhlIGVuZC5cbiAgaWYgKHN0eWxpbmdNYXBzU3luY0ZuKSB7XG4gICAgc3R5bGluZ01hcHNTeW5jRm4oY29udGV4dCwgcmVuZGVyZXIsIGVsZW1lbnQsIGJpbmRpbmdEYXRhLCBhcHBseVN0eWxpbmdGbiwgc2FuaXRpemVyLCBtYXBzTW9kZSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gbm9ybWFsaXplQml0TWFza1ZhbHVlKHZhbHVlOiBudW1iZXIgfCBib29sZWFuKTogbnVtYmVyIHtcbiAgLy8gaWYgcGFzcyA9PiBhcHBseSBhbGwgdmFsdWVzICgtMSBpbXBsaWVzIHRoYXQgYWxsIGJpdHMgYXJlIGZsaXBwZWQgdG8gdHJ1ZSlcbiAgaWYgKHZhbHVlID09PSB0cnVlKSByZXR1cm4gLTE7XG5cbiAgLy8gaWYgcGFzcyA9PiBza2lwIGFsbCB2YWx1ZXNcbiAgaWYgKHZhbHVlID09PSBmYWxzZSkgcmV0dXJuIDA7XG5cbiAgLy8gcmV0dXJuIHRoZSBiaXQgbWFzayB2YWx1ZSBhcyBpc1xuICByZXR1cm4gdmFsdWU7XG59XG5cbmxldCBfYWN0aXZlU3R5bGluZ01hcEFwcGx5Rm46IFN5bmNTdHlsaW5nTWFwc0ZufG51bGwgPSBudWxsO1xuZXhwb3J0IGZ1bmN0aW9uIGdldFN0eWxpbmdNYXBzU3luY0ZuKCkge1xuICByZXR1cm4gX2FjdGl2ZVN0eWxpbmdNYXBBcHBseUZuO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2V0U3R5bGluZ01hcHNTeW5jRm4oZm46IFN5bmNTdHlsaW5nTWFwc0ZuKSB7XG4gIF9hY3RpdmVTdHlsaW5nTWFwQXBwbHlGbiA9IGZuO1xufVxuXG4vKipcbiAqIEFzc2lnbnMgYSBzdHlsZSB2YWx1ZSB0byBhIHN0eWxlIHByb3BlcnR5IGZvciB0aGUgZ2l2ZW4gZWxlbWVudC5cbiAqL1xuY29uc3Qgc2V0U3R5bGU6IEFwcGx5U3R5bGluZ0ZuID1cbiAgICAocmVuZGVyZXI6IFJlbmRlcmVyMyB8IG51bGwsIG5hdGl2ZTogYW55LCBwcm9wOiBzdHJpbmcsIHZhbHVlOiBzdHJpbmcgfCBudWxsKSA9PiB7XG4gICAgICBpZiAodmFsdWUpIHtcbiAgICAgICAgLy8gb3BhY2l0eSwgei1pbmRleCBhbmQgZmxleGJveCBhbGwgaGF2ZSBudW1iZXIgdmFsdWVzXG4gICAgICAgIC8vIGFuZCB0aGVzZSBuZWVkIHRvIGJlIGNvbnZlcnRlZCBpbnRvIHN0cmluZ3Mgc28gdGhhdFxuICAgICAgICAvLyB0aGV5IGNhbiBiZSBhc3NpZ25lZCBwcm9wZXJseS5cbiAgICAgICAgdmFsdWUgPSB2YWx1ZS50b1N0cmluZygpO1xuICAgICAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyU2V0U3R5bGUrKztcbiAgICAgICAgcmVuZGVyZXIgJiYgaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpID9cbiAgICAgICAgICAgIHJlbmRlcmVyLnNldFN0eWxlKG5hdGl2ZSwgcHJvcCwgdmFsdWUsIFJlbmRlcmVyU3R5bGVGbGFnczMuRGFzaENhc2UpIDpcbiAgICAgICAgICAgIG5hdGl2ZS5zdHlsZS5zZXRQcm9wZXJ0eShwcm9wLCB2YWx1ZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyUmVtb3ZlU3R5bGUrKztcbiAgICAgICAgcmVuZGVyZXIgJiYgaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpID9cbiAgICAgICAgICAgIHJlbmRlcmVyLnJlbW92ZVN0eWxlKG5hdGl2ZSwgcHJvcCwgUmVuZGVyZXJTdHlsZUZsYWdzMy5EYXNoQ2FzZSkgOlxuICAgICAgICAgICAgbmF0aXZlLnN0eWxlLnJlbW92ZVByb3BlcnR5KHByb3ApO1xuICAgICAgfVxuICAgIH07XG5cbi8qKlxuICogQWRkcy9yZW1vdmVzIHRoZSBwcm92aWRlZCBjbGFzc05hbWUgdmFsdWUgdG8gdGhlIHByb3ZpZGVkIGVsZW1lbnQuXG4gKi9cbmNvbnN0IHNldENsYXNzOiBBcHBseVN0eWxpbmdGbiA9XG4gICAgKHJlbmRlcmVyOiBSZW5kZXJlcjMgfCBudWxsLCBuYXRpdmU6IGFueSwgY2xhc3NOYW1lOiBzdHJpbmcsIHZhbHVlOiBhbnkpID0+IHtcbiAgICAgIGlmIChjbGFzc05hbWUgIT09ICcnKSB7XG4gICAgICAgIGlmICh2YWx1ZSkge1xuICAgICAgICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJBZGRDbGFzcysrO1xuICAgICAgICAgIHJlbmRlcmVyICYmIGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSA/IHJlbmRlcmVyLmFkZENsYXNzKG5hdGl2ZSwgY2xhc3NOYW1lKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmF0aXZlLmNsYXNzTGlzdC5hZGQoY2xhc3NOYW1lKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyUmVtb3ZlQ2xhc3MrKztcbiAgICAgICAgICByZW5kZXJlciAmJiBpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikgPyByZW5kZXJlci5yZW1vdmVDbGFzcyhuYXRpdmUsIGNsYXNzTmFtZSkgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hdGl2ZS5jbGFzc0xpc3QucmVtb3ZlKGNsYXNzTmFtZSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9O1xuIl19