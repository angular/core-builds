/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
import { RendererStyleFlags3, isProceduralRenderer } from '../interfaces/renderer';
import { BIT_MASK_START_VALUE, deleteStylingStateFromStorage, getStylingState, resetStylingState, storeStylingState } from './state';
import { allowStylingFlush, getBindingValue, getGuardMask, getMapProp, getMapValue, getProp, getPropValuesStartPosition, getStylingMapArray, getValuesCount, hasValueChanged, isContextLocked, isSanitizationRequired, isStylingValueDefined, lockContext, setGuardMask, stateIsPersisted } from './util';
// The first bit value reflects a map-based binding value's bit.
// The reason why it's always activated for every entry in the map
// is so that if any map-binding values update then all other prop
// based bindings will pass the guard check automatically without
// any extra code or flags.
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
export const DEFAULT_GUARD_MASK_VALUE = 0b1;
/**
 * The guard/update mask bit index location for map-based bindings.
 *
 * All map-based bindings (i.e. `[style]` and `[class]` )
 * @type {?}
 */
const STYLING_INDEX_FOR_MAP_BINDING = 0;
/**
 * Default fallback value for a styling binding.
 *
 * A value of `null` is used here which signals to the styling algorithm that
 * the styling value is not present. This way if there are no other values
 * detected then it will be removed once the style/class property is dirty and
 * diffed within the styling algorithm present in `flushStyling`.
 * @type {?}
 */
const DEFAULT_BINDING_VALUE = null;
/**
 * Default size count value for a new entry in a context.
 *
 * A value of `1` is used here because each entry in the context has a default
 * property.
 * @type {?}
 */
const DEFAULT_SIZE_VALUE = 1;
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
 * @param {?} element
 * @param {?} prop
 * @param {?} bindingIndex
 * @param {?} value
 * @param {?} deferRegistration
 * @param {?} forceUpdate
 * @return {?}
 */
export function updateClassBinding(context, data, element, prop, bindingIndex, value, deferRegistration, forceUpdate) {
    /** @type {?} */
    const isMapBased = !prop;
    /** @type {?} */
    const state = getStylingState(element, stateIsPersisted(context));
    /** @type {?} */
    const index = isMapBased ? STYLING_INDEX_FOR_MAP_BINDING : state.classesIndex++;
    /** @type {?} */
    const updated = updateBindingData(context, data, index, prop, bindingIndex, value, deferRegistration, forceUpdate, false);
    if (updated || forceUpdate) {
        // We flip the bit in the bitMask to reflect that the binding
        // at the `index` slot has changed. This identifies to the flushing
        // phase that the bindings for this particular CSS class need to be
        // applied again because on or more of the bindings for the CSS
        // class have changed.
        state.classesBitMask |= 1 << index;
        return true;
    }
    return false;
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
 * @param {?} element
 * @param {?} prop
 * @param {?} bindingIndex
 * @param {?} value
 * @param {?} sanitizer
 * @param {?} deferRegistration
 * @param {?} forceUpdate
 * @return {?}
 */
export function updateStyleBinding(context, data, element, prop, bindingIndex, value, sanitizer, deferRegistration, forceUpdate) {
    /** @type {?} */
    const isMapBased = !prop;
    /** @type {?} */
    const state = getStylingState(element, stateIsPersisted(context));
    /** @type {?} */
    const index = isMapBased ? STYLING_INDEX_FOR_MAP_BINDING : state.stylesIndex++;
    /** @type {?} */
    const sanitizationRequired = isMapBased ?
        true :
        (sanitizer ? sanitizer((/** @type {?} */ (prop)), null, 1 /* ValidateProperty */) : false);
    /** @type {?} */
    const updated = updateBindingData(context, data, index, prop, bindingIndex, value, deferRegistration, forceUpdate, sanitizationRequired);
    if (updated || forceUpdate) {
        // We flip the bit in the bitMask to reflect that the binding
        // at the `index` slot has changed. This identifies to the flushing
        // phase that the bindings for this particular property need to be
        // applied again because on or more of the bindings for the CSS
        // property have changed.
        state.stylesBitMask |= 1 << index;
        return true;
    }
    return false;
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
    /** @type {?} */
    let registered = false;
    if (prop) {
        // prop-based bindings (e.g `<div [style.width]="w" [class.foo]="f">`)
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
            registered = true;
        }
    }
    else {
        // map-based bindings (e.g `<div [style]="s" [class]="{className:true}">`)
        // there is no need to allocate the map-based binding region into the context
        // since it is already there when the context is first created.
        addBindingIntoContext(context, true, 3 /* MapBindingsPosition */, bindingValue, countId);
        registered = true;
    }
    return registered;
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
    const firstValueIndex = index + 3 /* BindingsStartOffset */;
    /** @type {?} */
    let lastValueIndex = firstValueIndex + valuesCount;
    if (!isMapBased) {
        // prop-based values all have default values, but map-based entries do not.
        // we want to access the index for the default value in this case and not just
        // the bindings...
        lastValueIndex--;
    }
    if (typeof bindingValue === 'number') {
        // the loop here will check to see if the binding already exists
        // for the property in the context. Why? The reason for this is
        // because the styling context is not "locked" until the first
        // flush has occurred. This means that if a repeated element
        // registers its styling bindings then it will register each
        // binding more than once (since its duplicated). This check
        // will prevent that from happening. Note that this only happens
        // when a binding is first encountered and not each time it is
        // updated.
        for (let i = firstValueIndex; i <= lastValueIndex; i++) {
            /** @type {?} */
            const indexAtPosition = context[i];
            if (indexAtPosition === bindingValue)
                return;
        }
        context.splice(lastValueIndex, 0, bindingValue);
        ((/** @type {?} */ (context[index + 1 /* ValuesCountOffset */])))++;
        // now that a new binding index has been added to the property
        // the guard mask bit value (at the `countId` position) needs
        // to be included into the existing mask value.
        /** @type {?} */
        const guardMask = getGuardMask(context, index) | (1 << countId);
        setGuardMask(context, index, guardMask);
    }
    else if (bindingValue !== null && context[lastValueIndex] == null) {
        context[lastValueIndex] = bindingValue;
    }
}
/**
 * Applies all pending style and class bindings to the provided element.
 *
 * This function will attempt to flush styling via the provided `classesContext`
 * and `stylesContext` context values. This function is designed to be run from
 * the `stylingApply()` instruction (which is run at the very end of styling
 * change detection) and will rely on any state values that are set from when
 * any styling bindings update.
 *
 * This function may be called multiple times on the same element because it can
 * be called from the template code as well as from host bindings. In order for
 * styling to be successfully flushed to the element (which will only happen once
 * despite this being called multiple times), the following criteria must be met:
 *
 * - `flushStyling` is called from the very last directive that has styling for
 *    the element (see `allowStylingFlush()`).
 * - one or more bindings for classes or styles has updated (this is checked by
 *   examining the classes or styles bit mask).
 *
 * If the style and class values are successfully applied to the element then
 * the temporary state values for the element will be cleared. Otherwise, if
 * this did not occur then the styling state is persisted (see `state.ts` for
 * more information on how this works).
 * @param {?} renderer
 * @param {?} data
 * @param {?} classesContext
 * @param {?} stylesContext
 * @param {?} element
 * @param {?} directiveIndex
 * @param {?} styleSanitizer
 * @return {?}
 */
export function flushStyling(renderer, data, classesContext, stylesContext, element, directiveIndex, styleSanitizer) {
    ngDevMode && ngDevMode.flushStyling++;
    /** @type {?} */
    const persistState = classesContext ? stateIsPersisted(classesContext) :
        (stylesContext ? stateIsPersisted(stylesContext) : false);
    /** @type {?} */
    const allowFlushClasses = allowStylingFlush(classesContext, directiveIndex);
    /** @type {?} */
    const allowFlushStyles = allowStylingFlush(stylesContext, directiveIndex);
    // deferred bindings are bindings which are scheduled to register with
    // the context at a later point. These bindings can only registered when
    // the context will be 100% flushed to the element.
    if (deferredBindingQueue.length && (allowFlushClasses || allowFlushStyles)) {
        flushDeferredBindings();
    }
    /** @type {?} */
    const state = getStylingState(element, persistState);
    /** @type {?} */
    const classesFlushed = maybeApplyStyling(renderer, element, data, classesContext, allowFlushClasses, state.classesBitMask, setClass, null);
    /** @type {?} */
    const stylesFlushed = maybeApplyStyling(renderer, element, data, stylesContext, allowFlushStyles, state.stylesBitMask, setStyle, styleSanitizer);
    if (classesFlushed && stylesFlushed) {
        resetStylingState();
        if (persistState) {
            deleteStylingStateFromStorage(element);
        }
    }
    else if (persistState) {
        storeStylingState(element, state);
    }
}
/**
 * @param {?} renderer
 * @param {?} element
 * @param {?} data
 * @param {?} context
 * @param {?} allowFlush
 * @param {?} bitMask
 * @param {?} styleSetter
 * @param {?} styleSanitizer
 * @return {?}
 */
function maybeApplyStyling(renderer, element, data, context, allowFlush, bitMask, styleSetter, styleSanitizer) {
    if (allowFlush && context) {
        lockAndFinalizeContext(context);
        if (contextHasUpdates(context, bitMask)) {
            ngDevMode && (styleSanitizer ? ngDevMode.stylesApplied++ : ngDevMode.classesApplied++);
            applyStyling((/** @type {?} */ (context)), renderer, element, data, bitMask, styleSetter, styleSanitizer);
            return true;
        }
    }
    return allowFlush;
}
/**
 * @param {?} context
 * @param {?} bitMask
 * @return {?}
 */
function contextHasUpdates(context, bitMask) {
    return context && bitMask > BIT_MASK_START_VALUE;
}
/**
 * Locks the context (so no more bindings can be added) and also copies over initial class/style
 * values into their binding areas.
 *
 * There are two main actions that take place in this function:
 *
 * - Locking the context:
 *   Locking the context is required so that the style/class instructions know NOT to
 *   register a binding again after the first update pass has run. If a locking bit was
 *   not used then it would need to scan over the context each time an instruction is run
 *   (which is expensive).
 *
 * - Patching initial values:
 *   Directives and component host bindings may include static class/style values which are
 *   bound to the host element. When this happens, the styling context will need to be informed
 *   so it can use these static styling values as defaults when a matching binding is falsy.
 *   These initial styling values are read from the initial styling values slot within the
 *   provided `TStylingContext` (which is an instance of a `StylingMapArray`). This inner map will
 *   be updated each time a host binding applies its static styling values (via `elementHostAttrs`)
 *   so these values are only read at this point because this is the very last point before the
 *   first style/class values are flushed to the element.
 * @param {?} context
 * @return {?}
 */
function lockAndFinalizeContext(context) {
    if (!isContextLocked(context)) {
        /** @type {?} */
        const initialValues = getStylingMapArray(context);
        if (initialValues) {
            updateInitialStylingOnContext(context, initialValues);
        }
        lockContext(context);
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
 * will be applied as well. However, the code for that is not a part of
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
    /** @type {?} */
    const bitMask = normalizeBitMaskValue(bitMaskValue);
    /** @type {?} */
    const stylingMapsSyncFn = getStylingMapsSyncFn();
    /** @type {?} */
    const mapsGuardMask = getGuardMask(context, 3 /* MapBindingsPosition */);
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
    // the reason why this may be `null` is either because
    // it's a container element or it's a part of a test
    // environment that doesn't have styling. In either
    // case it's safe not to apply styling to the element.
    /** @type {?} */
    const nativeStyle = native.style;
    if (value) {
        // opacity, z-index and flexbox all have number values
        // and these need to be converted into strings so that
        // they can be assigned properly.
        value = value.toString();
        ngDevMode && ngDevMode.rendererSetStyle++;
        renderer && isProceduralRenderer(renderer) ?
            renderer.setStyle(native, prop, value, RendererStyleFlags3.DashCase) :
            (nativeStyle && nativeStyle.setProperty(prop, value));
    }
    else {
        ngDevMode && ngDevMode.rendererRemoveStyle++;
        renderer && isProceduralRenderer(renderer) ?
            renderer.removeStyle(native, prop, RendererStyleFlags3.DashCase) :
            (nativeStyle && nativeStyle.removeProperty(prop));
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
        // the reason why this may be `null` is either because
        // it's a container element or it's a part of a test
        // environment that doesn't have styling. In either
        // case it's safe not to apply styling to the element.
        /** @type {?} */
        const classList = native.classList;
        if (value) {
            ngDevMode && ngDevMode.rendererAddClass++;
            renderer && isProceduralRenderer(renderer) ? renderer.addClass(native, className) :
                (classList && classList.add(className));
        }
        else {
            ngDevMode && ngDevMode.rendererRemoveClass++;
            renderer && isProceduralRenderer(renderer) ? renderer.removeClass(native, className) :
                (classList && classList.remove(className));
        }
    }
});
/**
 * Iterates over all provided styling entries and renders them on the element.
 *
 * This function is used alongside a `StylingMapArray` entry. This entry is not
 * the same as the `TStylingContext` and is only really used when an element contains
 * initial styling values (e.g. `<div style="width:200px">`), but no style/class bindings
 * are present. If and when that happens then this function will be called to render all
 * initial styling values on an element.
 * @param {?} renderer
 * @param {?} element
 * @param {?} stylingValues
 * @param {?} isClassBased
 * @return {?}
 */
export function renderStylingMap(renderer, element, stylingValues, isClassBased) {
    /** @type {?} */
    const stylingMapArr = getStylingMapArray(stylingValues);
    if (stylingMapArr) {
        for (let i = 1 /* ValuesStartPosition */; i < stylingMapArr.length; i += 2 /* TupleSize */) {
            /** @type {?} */
            const prop = getMapProp(stylingMapArr, i);
            /** @type {?} */
            const value = getMapValue(stylingMapArr, i);
            if (isClassBased) {
                setClass(renderer, element, prop, value, null);
            }
            else {
                setStyle(renderer, element, prop, value, null);
            }
        }
    }
}
/**
 * Registers all initial styling entries into the provided context.
 *
 * This function will iterate over all entries in the provided `initialStyling` ar}ray and register
 * them as default (initial) values in the provided context. Initial styling values in a context are
 * the default values that are to be applied unless overwritten by a binding.
 *
 * The reason why this function exists and isn't a part of the context construction is because
 * host binding is evaluated at a later stage after the element is created. This means that
 * if a directive or component contains any initial styling code (i.e. `<div class="foo">`)
 * then that initial styling data can only be applied once the styling for that element
 * is first applied (at the end of the update phase). Once that happens then the context will
 * update itself with the complete initial styling for the element.
 * @param {?} context
 * @param {?} initialStyling
 * @return {?}
 */
function updateInitialStylingOnContext(context, initialStyling) {
    // `-1` is used here because all initial styling data is not a spart
    // of a binding (since it's static)
    /** @type {?} */
    const INITIAL_STYLING_COUNT_ID = -1;
    for (let i = 1 /* ValuesStartPosition */; i < initialStyling.length; i += 2 /* TupleSize */) {
        /** @type {?} */
        const value = getMapValue(initialStyling, i);
        if (value) {
            /** @type {?} */
            const prop = getMapProp(initialStyling, i);
            registerBinding(context, INITIAL_STYLING_COUNT_ID, prop, value, false);
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmluZGluZ3MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL3N0eWxpbmdfbmV4dC9iaW5kaW5ncy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7O0FBU0EsT0FBTyxFQUEyQyxtQkFBbUIsRUFBRSxvQkFBb0IsRUFBQyxNQUFNLHdCQUF3QixDQUFDO0FBRzNILE9BQU8sRUFBQyxvQkFBb0IsRUFBRSw2QkFBNkIsRUFBRSxlQUFlLEVBQUUsaUJBQWlCLEVBQUUsaUJBQWlCLEVBQUMsTUFBTSxTQUFTLENBQUM7QUFDbkksT0FBTyxFQUFDLGlCQUFpQixFQUFFLGVBQWUsRUFBRSxZQUFZLEVBQUUsVUFBVSxFQUFFLFdBQVcsRUFBRSxPQUFPLEVBQUUsMEJBQTBCLEVBQUUsa0JBQWtCLEVBQUUsY0FBYyxFQUFFLGVBQWUsRUFBRSxlQUFlLEVBQUUsc0JBQXNCLEVBQUUscUJBQXFCLEVBQUUsV0FBVyxFQUFFLFlBQVksRUFBRSxnQkFBZ0IsRUFBQyxNQUFNLFFBQVEsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQTRCeFMsTUFBTSxPQUFPLHdCQUF3QixHQUFHLEdBQUc7Ozs7Ozs7TUFPckMsNkJBQTZCLEdBQUcsQ0FBQzs7Ozs7Ozs7OztNQVVqQyxxQkFBcUIsR0FBRyxJQUFJOzs7Ozs7OztNQVE1QixrQkFBa0IsR0FBRyxDQUFDOztJQUV4QixvQkFBb0IsR0FBMkQsRUFBRTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFZckYsTUFBTSxVQUFVLGtCQUFrQixDQUM5QixPQUF3QixFQUFFLElBQWtCLEVBQUUsT0FBaUIsRUFBRSxJQUFtQixFQUNwRixZQUFvQixFQUFFLEtBQTRELEVBQ2xGLGlCQUEwQixFQUFFLFdBQW9COztVQUM1QyxVQUFVLEdBQUcsQ0FBQyxJQUFJOztVQUNsQixLQUFLLEdBQUcsZUFBZSxDQUFDLE9BQU8sRUFBRSxnQkFBZ0IsQ0FBQyxP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Q0FBQyxRQUFRLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsSUFBSSxDQUFDLENBQUM7YUFDaEQ7U0FDRjtLQUNGO0FBQ0gsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBZ0JELFNBQVMsNkJBQTZCLENBQ2xDLE9BQXdCLEVBQUUsY0FBK0I7Ozs7VUFHckQsd0JBQXdCLEdBQUcsQ0FBQyxDQUFDO0lBRW5DLEtBQUssSUFBSSxDQUFDLDhCQUEyQyxFQUFFLENBQUMsR0FBRyxjQUFjLENBQUMsTUFBTSxFQUMzRSxDQUFDLHFCQUFrQyxFQUFFOztjQUNsQyxLQUFLLEdBQUcsV0FBVyxDQUFDLGNBQWMsRUFBRSxDQUFDLENBQUM7UUFDNUMsSUFBSSxLQUFLLEVBQUU7O2tCQUNILElBQUksR0FBRyxVQUFVLENBQUMsY0FBYyxFQUFFLENBQUMsQ0FBQztZQUMxQyxlQUFlLENBQUMsT0FBTyxFQUFFLHdCQUF3QixFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7U0FDeEU7S0FDRjtBQUNILENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiogQGxpY2Vuc2VcbiogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4qXG4qIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4qIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiovXG5pbXBvcnQge1NhZmVWYWx1ZX0gZnJvbSAnLi4vLi4vc2FuaXRpemF0aW9uL2J5cGFzcyc7XG5pbXBvcnQge1N0eWxlU2FuaXRpemVGbiwgU3R5bGVTYW5pdGl6ZU1vZGV9IGZyb20gJy4uLy4uL3Nhbml0aXphdGlvbi9zdHlsZV9zYW5pdGl6ZXInO1xuaW1wb3J0IHtQcm9jZWR1cmFsUmVuZGVyZXIzLCBSRWxlbWVudCwgUmVuZGVyZXIzLCBSZW5kZXJlclN0eWxlRmxhZ3MzLCBpc1Byb2NlZHVyYWxSZW5kZXJlcn0gZnJvbSAnLi4vaW50ZXJmYWNlcy9yZW5kZXJlcic7XG5cbmltcG9ydCB7QXBwbHlTdHlsaW5nRm4sIExTdHlsaW5nRGF0YSwgU3R5bGluZ01hcEFycmF5LCBTdHlsaW5nTWFwQXJyYXlJbmRleCwgU3R5bGluZ01hcHNTeW5jTW9kZSwgU3luY1N0eWxpbmdNYXBzRm4sIFRTdHlsaW5nQ29udGV4dCwgVFN0eWxpbmdDb250ZXh0SW5kZXgsIFRTdHlsaW5nQ29udGV4dFByb3BDb25maWdGbGFnc30gZnJvbSAnLi9pbnRlcmZhY2VzJztcbmltcG9ydCB7QklUX01BU0tfU1RBUlRfVkFMVUUsIGRlbGV0ZVN0eWxpbmdTdGF0ZUZyb21TdG9yYWdlLCBnZXRTdHlsaW5nU3RhdGUsIHJlc2V0U3R5bGluZ1N0YXRlLCBzdG9yZVN0eWxpbmdTdGF0ZX0gZnJvbSAnLi9zdGF0ZSc7XG5pbXBvcnQge2FsbG93U3R5bGluZ0ZsdXNoLCBnZXRCaW5kaW5nVmFsdWUsIGdldEd1YXJkTWFzaywgZ2V0TWFwUHJvcCwgZ2V0TWFwVmFsdWUsIGdldFByb3AsIGdldFByb3BWYWx1ZXNTdGFydFBvc2l0aW9uLCBnZXRTdHlsaW5nTWFwQXJyYXksIGdldFZhbHVlc0NvdW50LCBoYXNWYWx1ZUNoYW5nZWQsIGlzQ29udGV4dExvY2tlZCwgaXNTYW5pdGl6YXRpb25SZXF1aXJlZCwgaXNTdHlsaW5nVmFsdWVEZWZpbmVkLCBsb2NrQ29udGV4dCwgc2V0R3VhcmRNYXNrLCBzdGF0ZUlzUGVyc2lzdGVkfSBmcm9tICcuL3V0aWwnO1xuXG5cblxuLyoqXG4gKiAtLS0tLS0tLVxuICpcbiAqIFRoaXMgZmlsZSBjb250YWlucyB0aGUgY29yZSBsb2dpYyBmb3Igc3R5bGluZyBpbiBBbmd1bGFyLlxuICpcbiAqIEFsbCBzdHlsaW5nIGJpbmRpbmdzIChpLmUuIGBbc3R5bGVdYCwgYFtzdHlsZS5wcm9wXWAsIGBbY2xhc3NdYCBhbmQgYFtjbGFzcy5uYW1lXWApXG4gKiB3aWxsIGhhdmUgdGhlaXIgdmFsdWVzIGJlIGFwcGxpZWQgdGhyb3VnaCB0aGUgbG9naWMgaW4gdGhpcyBmaWxlLlxuICpcbiAqIFdoZW4gYSBiaW5kaW5nIGlzIGVuY291bnRlcmVkIChlLmcuIGA8ZGl2IFtzdHlsZS53aWR0aF09XCJ3XCI+YCkgdGhlblxuICogdGhlIGJpbmRpbmcgZGF0YSB3aWxsIGJlIHBvcHVsYXRlZCBpbnRvIGEgYFRTdHlsaW5nQ29udGV4dGAgZGF0YS1zdHJ1Y3R1cmUuXG4gKiBUaGVyZSBpcyBvbmx5IG9uZSBgVFN0eWxpbmdDb250ZXh0YCBwZXIgYFROb2RlYCBhbmQgZWFjaCBlbGVtZW50IGluc3RhbmNlXG4gKiB3aWxsIHVwZGF0ZSBpdHMgc3R5bGUvY2xhc3MgYmluZGluZyB2YWx1ZXMgaW4gY29uY2VydCB3aXRoIHRoZSBzdHlsaW5nXG4gKiBjb250ZXh0LlxuICpcbiAqIFRvIGxlYXJuIG1vcmUgYWJvdXQgdGhlIGFsZ29yaXRobSBzZWUgYFRTdHlsaW5nQ29udGV4dGAuXG4gKlxuICogLS0tLS0tLS1cbiAqL1xuXG4vLyBUaGUgZmlyc3QgYml0IHZhbHVlIHJlZmxlY3RzIGEgbWFwLWJhc2VkIGJpbmRpbmcgdmFsdWUncyBiaXQuXG4vLyBUaGUgcmVhc29uIHdoeSBpdCdzIGFsd2F5cyBhY3RpdmF0ZWQgZm9yIGV2ZXJ5IGVudHJ5IGluIHRoZSBtYXBcbi8vIGlzIHNvIHRoYXQgaWYgYW55IG1hcC1iaW5kaW5nIHZhbHVlcyB1cGRhdGUgdGhlbiBhbGwgb3RoZXIgcHJvcFxuLy8gYmFzZWQgYmluZGluZ3Mgd2lsbCBwYXNzIHRoZSBndWFyZCBjaGVjayBhdXRvbWF0aWNhbGx5IHdpdGhvdXRcbi8vIGFueSBleHRyYSBjb2RlIG9yIGZsYWdzLlxuZXhwb3J0IGNvbnN0IERFRkFVTFRfR1VBUkRfTUFTS19WQUxVRSA9IDBiMTtcblxuLyoqXG4gKiBUaGUgZ3VhcmQvdXBkYXRlIG1hc2sgYml0IGluZGV4IGxvY2F0aW9uIGZvciBtYXAtYmFzZWQgYmluZGluZ3MuXG4gKlxuICogQWxsIG1hcC1iYXNlZCBiaW5kaW5ncyAoaS5lLiBgW3N0eWxlXWAgYW5kIGBbY2xhc3NdYCApXG4gKi9cbmNvbnN0IFNUWUxJTkdfSU5ERVhfRk9SX01BUF9CSU5ESU5HID0gMDtcblxuLyoqXG4gKiBEZWZhdWx0IGZhbGxiYWNrIHZhbHVlIGZvciBhIHN0eWxpbmcgYmluZGluZy5cbiAqXG4gKiBBIHZhbHVlIG9mIGBudWxsYCBpcyB1c2VkIGhlcmUgd2hpY2ggc2lnbmFscyB0byB0aGUgc3R5bGluZyBhbGdvcml0aG0gdGhhdFxuICogdGhlIHN0eWxpbmcgdmFsdWUgaXMgbm90IHByZXNlbnQuIFRoaXMgd2F5IGlmIHRoZXJlIGFyZSBubyBvdGhlciB2YWx1ZXNcbiAqIGRldGVjdGVkIHRoZW4gaXQgd2lsbCBiZSByZW1vdmVkIG9uY2UgdGhlIHN0eWxlL2NsYXNzIHByb3BlcnR5IGlzIGRpcnR5IGFuZFxuICogZGlmZmVkIHdpdGhpbiB0aGUgc3R5bGluZyBhbGdvcml0aG0gcHJlc2VudCBpbiBgZmx1c2hTdHlsaW5nYC5cbiAqL1xuY29uc3QgREVGQVVMVF9CSU5ESU5HX1ZBTFVFID0gbnVsbDtcblxuLyoqXG4gKiBEZWZhdWx0IHNpemUgY291bnQgdmFsdWUgZm9yIGEgbmV3IGVudHJ5IGluIGEgY29udGV4dC5cbiAqXG4gKiBBIHZhbHVlIG9mIGAxYCBpcyB1c2VkIGhlcmUgYmVjYXVzZSBlYWNoIGVudHJ5IGluIHRoZSBjb250ZXh0IGhhcyBhIGRlZmF1bHRcbiAqIHByb3BlcnR5LlxuICovXG5jb25zdCBERUZBVUxUX1NJWkVfVkFMVUUgPSAxO1xuXG5sZXQgZGVmZXJyZWRCaW5kaW5nUXVldWU6IChUU3R5bGluZ0NvbnRleHQgfCBudW1iZXIgfCBzdHJpbmcgfCBudWxsIHwgYm9vbGVhbilbXSA9IFtdO1xuXG4vKipcbiAqIFZpc2l0cyBhIGNsYXNzLWJhc2VkIGJpbmRpbmcgYW5kIHVwZGF0ZXMgdGhlIG5ldyB2YWx1ZSAoaWYgY2hhbmdlZCkuXG4gKlxuICogVGhpcyBmdW5jdGlvbiBpcyBjYWxsZWQgZWFjaCB0aW1lIGEgY2xhc3MtYmFzZWQgc3R5bGluZyBpbnN0cnVjdGlvblxuICogaXMgZXhlY3V0ZWQuIEl0J3MgaW1wb3J0YW50IHRoYXQgaXQncyBhbHdheXMgY2FsbGVkIChldmVuIGlmIHRoZSB2YWx1ZVxuICogaGFzIG5vdCBjaGFuZ2VkKSBzbyB0aGF0IHRoZSBpbm5lciBjb3VudGVyIGluZGV4IHZhbHVlIGlzIGluY3JlbWVudGVkLlxuICogVGhpcyB3YXksIGVhY2ggaW5zdHJ1Y3Rpb24gaXMgYWx3YXlzIGd1YXJhbnRlZWQgdG8gZ2V0IHRoZSBzYW1lIGNvdW50ZXJcbiAqIHN0YXRlIGVhY2ggdGltZSBpdCdzIGNhbGxlZCAod2hpY2ggdGhlbiBhbGxvd3MgdGhlIGBUU3R5bGluZ0NvbnRleHRgXG4gKiBhbmQgdGhlIGJpdCBtYXNrIHZhbHVlcyB0byBiZSBpbiBzeW5jKS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHVwZGF0ZUNsYXNzQmluZGluZyhcbiAgICBjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQsIGRhdGE6IExTdHlsaW5nRGF0YSwgZWxlbWVudDogUkVsZW1lbnQsIHByb3A6IHN0cmluZyB8IG51bGwsXG4gICAgYmluZGluZ0luZGV4OiBudW1iZXIsIHZhbHVlOiBib29sZWFuIHwgc3RyaW5nIHwgbnVsbCB8IHVuZGVmaW5lZCB8IFN0eWxpbmdNYXBBcnJheSxcbiAgICBkZWZlclJlZ2lzdHJhdGlvbjogYm9vbGVhbiwgZm9yY2VVcGRhdGU6IGJvb2xlYW4pOiBib29sZWFuIHtcbiAgY29uc3QgaXNNYXBCYXNlZCA9ICFwcm9wO1xuICBjb25zdCBzdGF0ZSA9IGdldFN0eWxpbmdTdGF0ZShlbGVtZW50LCBzdGF0ZUlzUGVyc2lzdGVkKGNvbnRleHQpKTtcbiAgY29uc3QgaW5kZXggPSBpc01hcEJhc2VkID8gU1RZTElOR19JTkRFWF9GT1JfTUFQX0JJTkRJTkcgOiBzdGF0ZS5jbGFzc2VzSW5kZXgrKztcbiAgY29uc3QgdXBkYXRlZCA9IHVwZGF0ZUJpbmRpbmdEYXRhKFxuICAgICAgY29udGV4dCwgZGF0YSwgaW5kZXgsIHByb3AsIGJpbmRpbmdJbmRleCwgdmFsdWUsIGRlZmVyUmVnaXN0cmF0aW9uLCBmb3JjZVVwZGF0ZSwgZmFsc2UpO1xuICBpZiAodXBkYXRlZCB8fCBmb3JjZVVwZGF0ZSkge1xuICAgIC8vIFdlIGZsaXAgdGhlIGJpdCBpbiB0aGUgYml0TWFzayB0byByZWZsZWN0IHRoYXQgdGhlIGJpbmRpbmdcbiAgICAvLyBhdCB0aGUgYGluZGV4YCBzbG90IGhhcyBjaGFuZ2VkLiBUaGlzIGlkZW50aWZpZXMgdG8gdGhlIGZsdXNoaW5nXG4gICAgLy8gcGhhc2UgdGhhdCB0aGUgYmluZGluZ3MgZm9yIHRoaXMgcGFydGljdWxhciBDU1MgY2xhc3MgbmVlZCB0byBiZVxuICAgIC8vIGFwcGxpZWQgYWdhaW4gYmVjYXVzZSBvbiBvciBtb3JlIG9mIHRoZSBiaW5kaW5ncyBmb3IgdGhlIENTU1xuICAgIC8vIGNsYXNzIGhhdmUgY2hhbmdlZC5cbiAgICBzdGF0ZS5jbGFzc2VzQml0TWFzayB8PSAxIDw8IGluZGV4O1xuICAgIHJldHVybiB0cnVlO1xuICB9XG4gIHJldHVybiBmYWxzZTtcbn1cblxuLyoqXG4gKiBWaXNpdHMgYSBzdHlsZS1iYXNlZCBiaW5kaW5nIGFuZCB1cGRhdGVzIHRoZSBuZXcgdmFsdWUgKGlmIGNoYW5nZWQpLlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gaXMgY2FsbGVkIGVhY2ggdGltZSBhIHN0eWxlLWJhc2VkIHN0eWxpbmcgaW5zdHJ1Y3Rpb25cbiAqIGlzIGV4ZWN1dGVkLiBJdCdzIGltcG9ydGFudCB0aGF0IGl0J3MgYWx3YXlzIGNhbGxlZCAoZXZlbiBpZiB0aGUgdmFsdWVcbiAqIGhhcyBub3QgY2hhbmdlZCkgc28gdGhhdCB0aGUgaW5uZXIgY291bnRlciBpbmRleCB2YWx1ZSBpcyBpbmNyZW1lbnRlZC5cbiAqIFRoaXMgd2F5LCBlYWNoIGluc3RydWN0aW9uIGlzIGFsd2F5cyBndWFyYW50ZWVkIHRvIGdldCB0aGUgc2FtZSBjb3VudGVyXG4gKiBzdGF0ZSBlYWNoIHRpbWUgaXQncyBjYWxsZWQgKHdoaWNoIHRoZW4gYWxsb3dzIHRoZSBgVFN0eWxpbmdDb250ZXh0YFxuICogYW5kIHRoZSBiaXQgbWFzayB2YWx1ZXMgdG8gYmUgaW4gc3luYykuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB1cGRhdGVTdHlsZUJpbmRpbmcoXG4gICAgY29udGV4dDogVFN0eWxpbmdDb250ZXh0LCBkYXRhOiBMU3R5bGluZ0RhdGEsIGVsZW1lbnQ6IFJFbGVtZW50LCBwcm9wOiBzdHJpbmcgfCBudWxsLFxuICAgIGJpbmRpbmdJbmRleDogbnVtYmVyLCB2YWx1ZTogc3RyaW5nIHwgbnVtYmVyIHwgU2FmZVZhbHVlIHwgbnVsbCB8IHVuZGVmaW5lZCB8IFN0eWxpbmdNYXBBcnJheSxcbiAgICBzYW5pdGl6ZXI6IFN0eWxlU2FuaXRpemVGbiB8IG51bGwsIGRlZmVyUmVnaXN0cmF0aW9uOiBib29sZWFuLCBmb3JjZVVwZGF0ZTogYm9vbGVhbik6IGJvb2xlYW4ge1xuICBjb25zdCBpc01hcEJhc2VkID0gIXByb3A7XG4gIGNvbnN0IHN0YXRlID0gZ2V0U3R5bGluZ1N0YXRlKGVsZW1lbnQsIHN0YXRlSXNQZXJzaXN0ZWQoY29udGV4dCkpO1xuICBjb25zdCBpbmRleCA9IGlzTWFwQmFzZWQgPyBTVFlMSU5HX0lOREVYX0ZPUl9NQVBfQklORElORyA6IHN0YXRlLnN0eWxlc0luZGV4Kys7XG4gIGNvbnN0IHNhbml0aXphdGlvblJlcXVpcmVkID0gaXNNYXBCYXNlZCA/XG4gICAgICB0cnVlIDpcbiAgICAgIChzYW5pdGl6ZXIgPyBzYW5pdGl6ZXIocHJvcCAhLCBudWxsLCBTdHlsZVNhbml0aXplTW9kZS5WYWxpZGF0ZVByb3BlcnR5KSA6IGZhbHNlKTtcbiAgY29uc3QgdXBkYXRlZCA9IHVwZGF0ZUJpbmRpbmdEYXRhKFxuICAgICAgY29udGV4dCwgZGF0YSwgaW5kZXgsIHByb3AsIGJpbmRpbmdJbmRleCwgdmFsdWUsIGRlZmVyUmVnaXN0cmF0aW9uLCBmb3JjZVVwZGF0ZSxcbiAgICAgIHNhbml0aXphdGlvblJlcXVpcmVkKTtcbiAgaWYgKHVwZGF0ZWQgfHwgZm9yY2VVcGRhdGUpIHtcbiAgICAvLyBXZSBmbGlwIHRoZSBiaXQgaW4gdGhlIGJpdE1hc2sgdG8gcmVmbGVjdCB0aGF0IHRoZSBiaW5kaW5nXG4gICAgLy8gYXQgdGhlIGBpbmRleGAgc2xvdCBoYXMgY2hhbmdlZC4gVGhpcyBpZGVudGlmaWVzIHRvIHRoZSBmbHVzaGluZ1xuICAgIC8vIHBoYXNlIHRoYXQgdGhlIGJpbmRpbmdzIGZvciB0aGlzIHBhcnRpY3VsYXIgcHJvcGVydHkgbmVlZCB0byBiZVxuICAgIC8vIGFwcGxpZWQgYWdhaW4gYmVjYXVzZSBvbiBvciBtb3JlIG9mIHRoZSBiaW5kaW5ncyBmb3IgdGhlIENTU1xuICAgIC8vIHByb3BlcnR5IGhhdmUgY2hhbmdlZC5cbiAgICBzdGF0ZS5zdHlsZXNCaXRNYXNrIHw9IDEgPDwgaW5kZXg7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG4vKipcbiAqIENhbGxlZCBlYWNoIHRpbWUgYSBiaW5kaW5nIHZhbHVlIGhhcyBjaGFuZ2VkIHdpdGhpbiB0aGUgcHJvdmlkZWQgYFRTdHlsaW5nQ29udGV4dGAuXG4gKlxuICogVGhpcyBmdW5jdGlvbiBpcyBkZXNpZ25lZCB0byBiZSBjYWxsZWQgZnJvbSBgdXBkYXRlU3R5bGVCaW5kaW5nYCBhbmQgYHVwZGF0ZUNsYXNzQmluZGluZ2AuXG4gKiBJZiBjYWxsZWQgZHVyaW5nIHRoZSBmaXJzdCB1cGRhdGUgcGFzcywgdGhlIGJpbmRpbmcgd2lsbCBiZSByZWdpc3RlcmVkIGluIHRoZSBjb250ZXh0LlxuICogSWYgdGhlIGJpbmRpbmcgZG9lcyBnZXQgcmVnaXN0ZXJlZCBhbmQgdGhlIGBkZWZlclJlZ2lzdHJhdGlvbmAgZmxhZyBpcyB0cnVlIHRoZW4gdGhlXG4gKiBiaW5kaW5nIGRhdGEgd2lsbCBiZSBxdWV1ZWQgdXAgdW50aWwgdGhlIGNvbnRleHQgaXMgbGF0ZXIgZmx1c2hlZCBpbiBgYXBwbHlTdHlsaW5nYC5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIHdpbGwgYWxzbyB1cGRhdGUgYmluZGluZyBzbG90IGluIHRoZSBwcm92aWRlZCBgTFN0eWxpbmdEYXRhYCB3aXRoIHRoZVxuICogbmV3IGJpbmRpbmcgZW50cnkgKGlmIGl0IGhhcyBjaGFuZ2VkKS5cbiAqXG4gKiBAcmV0dXJucyB3aGV0aGVyIG9yIG5vdCB0aGUgYmluZGluZyB2YWx1ZSB3YXMgdXBkYXRlZCBpbiB0aGUgYExTdHlsaW5nRGF0YWAuXG4gKi9cbmZ1bmN0aW9uIHVwZGF0ZUJpbmRpbmdEYXRhKFxuICAgIGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCwgZGF0YTogTFN0eWxpbmdEYXRhLCBjb3VudGVySW5kZXg6IG51bWJlciwgcHJvcDogc3RyaW5nIHwgbnVsbCxcbiAgICBiaW5kaW5nSW5kZXg6IG51bWJlcixcbiAgICB2YWx1ZTogc3RyaW5nIHwgU2FmZVZhbHVlIHwgbnVtYmVyIHwgYm9vbGVhbiB8IG51bGwgfCB1bmRlZmluZWQgfCBTdHlsaW5nTWFwQXJyYXksXG4gICAgZGVmZXJSZWdpc3RyYXRpb246IGJvb2xlYW4sIGZvcmNlVXBkYXRlOiBib29sZWFuLCBzYW5pdGl6YXRpb25SZXF1aXJlZDogYm9vbGVhbik6IGJvb2xlYW4ge1xuICBpZiAoIWlzQ29udGV4dExvY2tlZChjb250ZXh0KSkge1xuICAgIGlmIChkZWZlclJlZ2lzdHJhdGlvbikge1xuICAgICAgZGVmZXJCaW5kaW5nUmVnaXN0cmF0aW9uKGNvbnRleHQsIGNvdW50ZXJJbmRleCwgcHJvcCwgYmluZGluZ0luZGV4LCBzYW5pdGl6YXRpb25SZXF1aXJlZCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGRlZmVycmVkQmluZGluZ1F1ZXVlLmxlbmd0aCAmJiBmbHVzaERlZmVycmVkQmluZGluZ3MoKTtcblxuICAgICAgLy8gdGhpcyB3aWxsIG9ubHkgaGFwcGVuIGR1cmluZyB0aGUgZmlyc3QgdXBkYXRlIHBhc3Mgb2YgdGhlXG4gICAgICAvLyBjb250ZXh0LiBUaGUgcmVhc29uIHdoeSB3ZSBjYW4ndCB1c2UgYHROb2RlLmZpcnN0VGVtcGxhdGVQYXNzYFxuICAgICAgLy8gaGVyZSBpcyBiZWNhdXNlIGl0cyBub3QgZ3VhcmFudGVlZCB0byBiZSB0cnVlIHdoZW4gdGhlIGZpcnN0XG4gICAgICAvLyB1cGRhdGUgcGFzcyBpcyBleGVjdXRlZCAocmVtZW1iZXIgdGhhdCBhbGwgc3R5bGluZyBpbnN0cnVjdGlvbnNcbiAgICAgIC8vIGFyZSBydW4gaW4gdGhlIHVwZGF0ZSBwaGFzZSwgYW5kLCBhcyBhIHJlc3VsdCwgYXJlIG5vIG1vcmVcbiAgICAgIC8vIHN0eWxpbmcgaW5zdHJ1Y3Rpb25zIHRoYXQgYXJlIHJ1biBpbiB0aGUgY3JlYXRpb24gcGhhc2UpLlxuICAgICAgcmVnaXN0ZXJCaW5kaW5nKGNvbnRleHQsIGNvdW50ZXJJbmRleCwgcHJvcCwgYmluZGluZ0luZGV4LCBzYW5pdGl6YXRpb25SZXF1aXJlZCk7XG4gICAgfVxuICB9XG5cbiAgY29uc3QgY2hhbmdlZCA9IGZvcmNlVXBkYXRlIHx8IGhhc1ZhbHVlQ2hhbmdlZChkYXRhW2JpbmRpbmdJbmRleF0sIHZhbHVlKTtcbiAgaWYgKGNoYW5nZWQpIHtcbiAgICBkYXRhW2JpbmRpbmdJbmRleF0gPSB2YWx1ZTtcbiAgfVxuICByZXR1cm4gY2hhbmdlZDtcbn1cblxuLyoqXG4gKiBTY2hlZHVsZXMgYSBiaW5kaW5nIHJlZ2lzdHJhdGlvbiB0byBiZSBydW4gYXQgYSBsYXRlciBwb2ludC5cbiAqXG4gKiBUaGUgcmVhc29uaW5nIGZvciB0aGlzIGZlYXR1cmUgaXMgdG8gZW5zdXJlIHRoYXQgc3R5bGluZ1xuICogYmluZGluZ3MgYXJlIHJlZ2lzdGVyZWQgaW4gdGhlIGNvcnJlY3Qgb3JkZXIgZm9yIHdoZW5cbiAqIGRpcmVjdGl2ZXMvY29tcG9uZW50cyBoYXZlIGEgc3VwZXIvc3ViIGNsYXNzIGluaGVyaXRhbmNlXG4gKiBjaGFpbnMuIEVhY2ggZGlyZWN0aXZlJ3Mgc3R5bGluZyBiaW5kaW5ncyBtdXN0IGJlXG4gKiByZWdpc3RlcmVkIGludG8gdGhlIGNvbnRleHQgaW4gcmV2ZXJzZSBvcmRlci4gVGhlcmVmb3JlIGFsbFxuICogYmluZGluZ3Mgd2lsbCBiZSBidWZmZXJlZCBpbiByZXZlcnNlIG9yZGVyIGFuZCB0aGVuIGFwcGxpZWRcbiAqIGFmdGVyIHRoZSBpbmhlcml0YW5jZSBjaGFpbiBleGl0cy5cbiAqL1xuZnVuY3Rpb24gZGVmZXJCaW5kaW5nUmVnaXN0cmF0aW9uKFxuICAgIGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCwgY291bnRlckluZGV4OiBudW1iZXIsIHByb3A6IHN0cmluZyB8IG51bGwsIGJpbmRpbmdJbmRleDogbnVtYmVyLFxuICAgIHNhbml0aXphdGlvblJlcXVpcmVkOiBib29sZWFuKSB7XG4gIGRlZmVycmVkQmluZGluZ1F1ZXVlLnVuc2hpZnQoY29udGV4dCwgY291bnRlckluZGV4LCBwcm9wLCBiaW5kaW5nSW5kZXgsIHNhbml0aXphdGlvblJlcXVpcmVkKTtcbn1cblxuLyoqXG4gKiBGbHVzaGVzIHRoZSBjb2xsZWN0aW9uIG9mIGRlZmVycmVkIGJpbmRpbmdzIGFuZCBjYXVzZXMgZWFjaCBlbnRyeVxuICogdG8gYmUgcmVnaXN0ZXJlZCBpbnRvIHRoZSBjb250ZXh0LlxuICovXG5mdW5jdGlvbiBmbHVzaERlZmVycmVkQmluZGluZ3MoKSB7XG4gIGxldCBpID0gMDtcbiAgd2hpbGUgKGkgPCBkZWZlcnJlZEJpbmRpbmdRdWV1ZS5sZW5ndGgpIHtcbiAgICBjb25zdCBjb250ZXh0ID0gZGVmZXJyZWRCaW5kaW5nUXVldWVbaSsrXSBhcyBUU3R5bGluZ0NvbnRleHQ7XG4gICAgY29uc3QgY291bnQgPSBkZWZlcnJlZEJpbmRpbmdRdWV1ZVtpKytdIGFzIG51bWJlcjtcbiAgICBjb25zdCBwcm9wID0gZGVmZXJyZWRCaW5kaW5nUXVldWVbaSsrXSBhcyBzdHJpbmc7XG4gICAgY29uc3QgYmluZGluZ0luZGV4ID0gZGVmZXJyZWRCaW5kaW5nUXVldWVbaSsrXSBhcyBudW1iZXIgfCBudWxsO1xuICAgIGNvbnN0IHNhbml0aXphdGlvblJlcXVpcmVkID0gZGVmZXJyZWRCaW5kaW5nUXVldWVbaSsrXSBhcyBib29sZWFuO1xuICAgIHJlZ2lzdGVyQmluZGluZyhjb250ZXh0LCBjb3VudCwgcHJvcCwgYmluZGluZ0luZGV4LCBzYW5pdGl6YXRpb25SZXF1aXJlZCk7XG4gIH1cbiAgZGVmZXJyZWRCaW5kaW5nUXVldWUubGVuZ3RoID0gMDtcbn1cblxuLyoqXG4gKiBSZWdpc3RlcnMgdGhlIHByb3ZpZGVkIGJpbmRpbmcgKHByb3AgKyBiaW5kaW5nSW5kZXgpIGludG8gdGhlIGNvbnRleHQuXG4gKlxuICogVGhpcyBmdW5jdGlvbiBpcyBzaGFyZWQgYmV0d2VlbiBiaW5kaW5ncyB0aGF0IGFyZSBhc3NpZ25lZCBpbW1lZGlhdGVseVxuICogKHZpYSBgdXBkYXRlQmluZGluZ0RhdGFgKSBhbmQgYXQgYSBkZWZlcnJlZCBzdGFnZS4gV2hlbiBjYWxsZWQsIGl0IHdpbGxcbiAqIGZpZ3VyZSBvdXQgZXhhY3RseSB3aGVyZSB0byBwbGFjZSB0aGUgYmluZGluZyBkYXRhIGluIHRoZSBjb250ZXh0LlxuICpcbiAqIEl0IGlzIG5lZWRlZCBiZWNhdXNlIGl0IHdpbGwgZWl0aGVyIHVwZGF0ZSBvciBpbnNlcnQgYSBzdHlsaW5nIHByb3BlcnR5XG4gKiBpbnRvIHRoZSBjb250ZXh0IGF0IHRoZSBjb3JyZWN0IHNwb3QuXG4gKlxuICogV2hlbiBjYWxsZWQsIG9uZSBvZiB0d28gdGhpbmdzIHdpbGwgaGFwcGVuOlxuICpcbiAqIDEpIElmIHRoZSBwcm9wZXJ0eSBhbHJlYWR5IGV4aXN0cyBpbiB0aGUgY29udGV4dCB0aGVuIGl0IHdpbGwganVzdCBhZGRcbiAqICAgIHRoZSBwcm92aWRlZCBgYmluZGluZ1ZhbHVlYCB0byB0aGUgZW5kIG9mIHRoZSBiaW5kaW5nIHNvdXJjZXMgcmVnaW9uXG4gKiAgICBmb3IgdGhhdCBwYXJ0aWN1bGFyIHByb3BlcnR5LlxuICpcbiAqICAgIC0gSWYgdGhlIGJpbmRpbmcgdmFsdWUgaXMgYSBudW1iZXIgdGhlbiBpdCB3aWxsIGJlIGFkZGVkIGFzIGEgbmV3XG4gKiAgICAgIGJpbmRpbmcgaW5kZXggc291cmNlIG5leHQgdG8gdGhlIG90aGVyIGJpbmRpbmcgc291cmNlcyBmb3IgdGhlIHByb3BlcnR5LlxuICpcbiAqICAgIC0gT3RoZXJ3aXNlLCBpZiB0aGUgYmluZGluZyB2YWx1ZSBpcyBhIHN0cmluZy9ib29sZWFuL251bGwgdHlwZSB0aGVuIGl0IHdpbGxcbiAqICAgICAgcmVwbGFjZSB0aGUgZGVmYXVsdCB2YWx1ZSBmb3IgdGhlIHByb3BlcnR5IGlmIHRoZSBkZWZhdWx0IHZhbHVlIGlzIGBudWxsYC5cbiAqXG4gKiAyKSBJZiB0aGUgcHJvcGVydHkgZG9lcyBub3QgZXhpc3QgdGhlbiBpdCB3aWxsIGJlIGluc2VydGVkIGludG8gdGhlIGNvbnRleHQuXG4gKiAgICBUaGUgc3R5bGluZyBjb250ZXh0IHJlbGllcyBvbiBhbGwgcHJvcGVydGllcyBiZWluZyBzdG9yZWQgaW4gYWxwaGFiZXRpY2FsXG4gKiAgICBvcmRlciwgc28gaXQga25vd3MgZXhhY3RseSB3aGVyZSB0byBzdG9yZSBpdC5cbiAqXG4gKiAgICBXaGVuIGluc2VydGVkLCBhIGRlZmF1bHQgYG51bGxgIHZhbHVlIGlzIGNyZWF0ZWQgZm9yIHRoZSBwcm9wZXJ0eSB3aGljaCBleGlzdHNcbiAqICAgIGFzIHRoZSBkZWZhdWx0IHZhbHVlIGZvciB0aGUgYmluZGluZy4gSWYgdGhlIGJpbmRpbmdWYWx1ZSBwcm9wZXJ0eSBpcyBpbnNlcnRlZFxuICogICAgYW5kIGl0IGlzIGVpdGhlciBhIHN0cmluZywgbnVtYmVyIG9yIG51bGwgdmFsdWUgdGhlbiB0aGF0IHdpbGwgcmVwbGFjZSB0aGUgZGVmYXVsdFxuICogICAgdmFsdWUuXG4gKlxuICogTm90ZSB0aGF0IHRoaXMgZnVuY3Rpb24gaXMgYWxzbyB1c2VkIGZvciBtYXAtYmFzZWQgc3R5bGluZyBiaW5kaW5ncy4gVGhleSBhcmUgdHJlYXRlZFxuICogbXVjaCB0aGUgc2FtZSBhcyBwcm9wLWJhc2VkIGJpbmRpbmdzLCBidXQsIGJlY2F1c2UgdGhleSBkbyBub3QgaGF2ZSBhIHByb3BlcnR5IHZhbHVlXG4gKiAoc2luY2UgaXQncyBhIG1hcCksIGFsbCBtYXAtYmFzZWQgZW50cmllcyBhcmUgc3RvcmVkIGluIGFuIGFscmVhZHkgcG9wdWxhdGVkIGFyZWEgb2ZcbiAqIHRoZSBjb250ZXh0IGF0IHRoZSB0b3AgKHdoaWNoIGlzIHJlc2VydmVkIGZvciBtYXAtYmFzZWQgZW50cmllcykuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZWdpc3RlckJpbmRpbmcoXG4gICAgY29udGV4dDogVFN0eWxpbmdDb250ZXh0LCBjb3VudElkOiBudW1iZXIsIHByb3A6IHN0cmluZyB8IG51bGwsXG4gICAgYmluZGluZ1ZhbHVlOiBudW1iZXIgfCBudWxsIHwgc3RyaW5nIHwgYm9vbGVhbiwgc2FuaXRpemF0aW9uUmVxdWlyZWQ/OiBib29sZWFuKTogYm9vbGVhbiB7XG4gIGxldCByZWdpc3RlcmVkID0gZmFsc2U7XG4gIGlmIChwcm9wKSB7XG4gICAgLy8gcHJvcC1iYXNlZCBiaW5kaW5ncyAoZS5nIGA8ZGl2IFtzdHlsZS53aWR0aF09XCJ3XCIgW2NsYXNzLmZvb109XCJmXCI+YClcbiAgICBsZXQgZm91bmQgPSBmYWxzZTtcbiAgICBsZXQgaSA9IGdldFByb3BWYWx1ZXNTdGFydFBvc2l0aW9uKGNvbnRleHQpO1xuICAgIHdoaWxlIChpIDwgY29udGV4dC5sZW5ndGgpIHtcbiAgICAgIGNvbnN0IHZhbHVlc0NvdW50ID0gZ2V0VmFsdWVzQ291bnQoY29udGV4dCwgaSk7XG4gICAgICBjb25zdCBwID0gZ2V0UHJvcChjb250ZXh0LCBpKTtcbiAgICAgIGZvdW5kID0gcHJvcCA8PSBwO1xuICAgICAgaWYgKGZvdW5kKSB7XG4gICAgICAgIC8vIGFsbCBzdHlsZS9jbGFzcyBiaW5kaW5ncyBhcmUgc29ydGVkIGJ5IHByb3BlcnR5IG5hbWVcbiAgICAgICAgaWYgKHByb3AgPCBwKSB7XG4gICAgICAgICAgYWxsb2NhdGVOZXdDb250ZXh0RW50cnkoY29udGV4dCwgaSwgcHJvcCwgc2FuaXRpemF0aW9uUmVxdWlyZWQpO1xuICAgICAgICB9XG4gICAgICAgIGFkZEJpbmRpbmdJbnRvQ29udGV4dChjb250ZXh0LCBmYWxzZSwgaSwgYmluZGluZ1ZhbHVlLCBjb3VudElkKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBpICs9IFRTdHlsaW5nQ29udGV4dEluZGV4LkJpbmRpbmdzU3RhcnRPZmZzZXQgKyB2YWx1ZXNDb3VudDtcbiAgICB9XG5cbiAgICBpZiAoIWZvdW5kKSB7XG4gICAgICBhbGxvY2F0ZU5ld0NvbnRleHRFbnRyeShjb250ZXh0LCBjb250ZXh0Lmxlbmd0aCwgcHJvcCwgc2FuaXRpemF0aW9uUmVxdWlyZWQpO1xuICAgICAgYWRkQmluZGluZ0ludG9Db250ZXh0KGNvbnRleHQsIGZhbHNlLCBpLCBiaW5kaW5nVmFsdWUsIGNvdW50SWQpO1xuICAgICAgcmVnaXN0ZXJlZCA9IHRydWU7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIC8vIG1hcC1iYXNlZCBiaW5kaW5ncyAoZS5nIGA8ZGl2IFtzdHlsZV09XCJzXCIgW2NsYXNzXT1cIntjbGFzc05hbWU6dHJ1ZX1cIj5gKVxuICAgIC8vIHRoZXJlIGlzIG5vIG5lZWQgdG8gYWxsb2NhdGUgdGhlIG1hcC1iYXNlZCBiaW5kaW5nIHJlZ2lvbiBpbnRvIHRoZSBjb250ZXh0XG4gICAgLy8gc2luY2UgaXQgaXMgYWxyZWFkeSB0aGVyZSB3aGVuIHRoZSBjb250ZXh0IGlzIGZpcnN0IGNyZWF0ZWQuXG4gICAgYWRkQmluZGluZ0ludG9Db250ZXh0KFxuICAgICAgICBjb250ZXh0LCB0cnVlLCBUU3R5bGluZ0NvbnRleHRJbmRleC5NYXBCaW5kaW5nc1Bvc2l0aW9uLCBiaW5kaW5nVmFsdWUsIGNvdW50SWQpO1xuICAgIHJlZ2lzdGVyZWQgPSB0cnVlO1xuICB9XG4gIHJldHVybiByZWdpc3RlcmVkO1xufVxuXG5mdW5jdGlvbiBhbGxvY2F0ZU5ld0NvbnRleHRFbnRyeShcbiAgICBjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQsIGluZGV4OiBudW1iZXIsIHByb3A6IHN0cmluZywgc2FuaXRpemF0aW9uUmVxdWlyZWQ/OiBib29sZWFuKSB7XG4gIC8vIDEsMjogc3BsaWNlIGluZGV4IGxvY2F0aW9uc1xuICAvLyAzOiBlYWNoIGVudHJ5IGdldHMgYSBjb25maWcgdmFsdWUgKGd1YXJkIG1hc2sgKyBmbGFncylcbiAgLy8gNC4gZWFjaCBlbnRyeSBnZXRzIGEgc2l6ZSB2YWx1ZSAod2hpY2ggaXMgYWx3YXlzIG9uZSBiZWNhdXNlIHRoZXJlIGlzIGFsd2F5cyBhIGRlZmF1bHQgYmluZGluZ1xuICAvLyB2YWx1ZSlcbiAgLy8gNS4gdGhlIHByb3BlcnR5IHRoYXQgaXMgZ2V0dGluZyBhbGxvY2F0ZWQgaW50byB0aGUgY29udGV4dFxuICAvLyA2LiB0aGUgZGVmYXVsdCBiaW5kaW5nIHZhbHVlICh1c3VhbGx5IGBudWxsYClcbiAgY29uc3QgY29uZmlnID0gc2FuaXRpemF0aW9uUmVxdWlyZWQgPyBUU3R5bGluZ0NvbnRleHRQcm9wQ29uZmlnRmxhZ3MuU2FuaXRpemF0aW9uUmVxdWlyZWQgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFRTdHlsaW5nQ29udGV4dFByb3BDb25maWdGbGFncy5EZWZhdWx0O1xuICBjb250ZXh0LnNwbGljZShpbmRleCwgMCwgY29uZmlnLCBERUZBVUxUX1NJWkVfVkFMVUUsIHByb3AsIERFRkFVTFRfQklORElOR19WQUxVRSk7XG4gIHNldEd1YXJkTWFzayhjb250ZXh0LCBpbmRleCwgREVGQVVMVF9HVUFSRF9NQVNLX1ZBTFVFKTtcbn1cblxuLyoqXG4gKiBJbnNlcnRzIGEgbmV3IGJpbmRpbmcgdmFsdWUgaW50byBhIHN0eWxpbmcgcHJvcGVydHkgdHVwbGUgaW4gdGhlIGBUU3R5bGluZ0NvbnRleHRgLlxuICpcbiAqIEEgYmluZGluZ1ZhbHVlIGlzIGluc2VydGVkIGludG8gYSBjb250ZXh0IGR1cmluZyB0aGUgZmlyc3QgdXBkYXRlIHBhc3NcbiAqIG9mIGEgdGVtcGxhdGUgb3IgaG9zdCBiaW5kaW5ncyBmdW5jdGlvbi4gV2hlbiB0aGlzIG9jY3VycywgdHdvIHRoaW5nc1xuICogaGFwcGVuOlxuICpcbiAqIC0gSWYgdGhlIGJpbmRpbmdWYWx1ZSB2YWx1ZSBpcyBhIG51bWJlciB0aGVuIGl0IGlzIHRyZWF0ZWQgYXMgYSBiaW5kaW5nSW5kZXhcbiAqICAgdmFsdWUgKGEgaW5kZXggaW4gdGhlIGBMVmlld2ApIGFuZCBpdCB3aWxsIGJlIGluc2VydGVkIG5leHQgdG8gdGhlIG90aGVyXG4gKiAgIGJpbmRpbmcgaW5kZXggZW50cmllcy5cbiAqXG4gKiAtIE90aGVyd2lzZSB0aGUgYmluZGluZyB2YWx1ZSB3aWxsIHVwZGF0ZSB0aGUgZGVmYXVsdCB2YWx1ZSBmb3IgdGhlIHByb3BlcnR5XG4gKiAgIGFuZCB0aGlzIHdpbGwgb25seSBoYXBwZW4gaWYgdGhlIGRlZmF1bHQgdmFsdWUgaXMgYG51bGxgLlxuICpcbiAqIE5vdGUgdGhhdCB0aGlzIGZ1bmN0aW9uIGFsc28gaGFuZGxlcyBtYXAtYmFzZWQgYmluZGluZ3MgYW5kIHdpbGwgaW5zZXJ0IHRoZW1cbiAqIGF0IHRoZSB0b3Agb2YgdGhlIGNvbnRleHQuXG4gKi9cbmZ1bmN0aW9uIGFkZEJpbmRpbmdJbnRvQ29udGV4dChcbiAgICBjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQsIGlzTWFwQmFzZWQ6IGJvb2xlYW4sIGluZGV4OiBudW1iZXIsXG4gICAgYmluZGluZ1ZhbHVlOiBudW1iZXIgfCBzdHJpbmcgfCBib29sZWFuIHwgbnVsbCwgY291bnRJZDogbnVtYmVyKSB7XG4gIGNvbnN0IHZhbHVlc0NvdW50ID0gZ2V0VmFsdWVzQ291bnQoY29udGV4dCwgaW5kZXgpO1xuXG4gIGNvbnN0IGZpcnN0VmFsdWVJbmRleCA9IGluZGV4ICsgVFN0eWxpbmdDb250ZXh0SW5kZXguQmluZGluZ3NTdGFydE9mZnNldDtcbiAgbGV0IGxhc3RWYWx1ZUluZGV4ID0gZmlyc3RWYWx1ZUluZGV4ICsgdmFsdWVzQ291bnQ7XG4gIGlmICghaXNNYXBCYXNlZCkge1xuICAgIC8vIHByb3AtYmFzZWQgdmFsdWVzIGFsbCBoYXZlIGRlZmF1bHQgdmFsdWVzLCBidXQgbWFwLWJhc2VkIGVudHJpZXMgZG8gbm90LlxuICAgIC8vIHdlIHdhbnQgdG8gYWNjZXNzIHRoZSBpbmRleCBmb3IgdGhlIGRlZmF1bHQgdmFsdWUgaW4gdGhpcyBjYXNlIGFuZCBub3QganVzdFxuICAgIC8vIHRoZSBiaW5kaW5ncy4uLlxuICAgIGxhc3RWYWx1ZUluZGV4LS07XG4gIH1cblxuICBpZiAodHlwZW9mIGJpbmRpbmdWYWx1ZSA9PT0gJ251bWJlcicpIHtcbiAgICAvLyB0aGUgbG9vcCBoZXJlIHdpbGwgY2hlY2sgdG8gc2VlIGlmIHRoZSBiaW5kaW5nIGFscmVhZHkgZXhpc3RzXG4gICAgLy8gZm9yIHRoZSBwcm9wZXJ0eSBpbiB0aGUgY29udGV4dC4gV2h5PyBUaGUgcmVhc29uIGZvciB0aGlzIGlzXG4gICAgLy8gYmVjYXVzZSB0aGUgc3R5bGluZyBjb250ZXh0IGlzIG5vdCBcImxvY2tlZFwiIHVudGlsIHRoZSBmaXJzdFxuICAgIC8vIGZsdXNoIGhhcyBvY2N1cnJlZC4gVGhpcyBtZWFucyB0aGF0IGlmIGEgcmVwZWF0ZWQgZWxlbWVudFxuICAgIC8vIHJlZ2lzdGVycyBpdHMgc3R5bGluZyBiaW5kaW5ncyB0aGVuIGl0IHdpbGwgcmVnaXN0ZXIgZWFjaFxuICAgIC8vIGJpbmRpbmcgbW9yZSB0aGFuIG9uY2UgKHNpbmNlIGl0cyBkdXBsaWNhdGVkKS4gVGhpcyBjaGVja1xuICAgIC8vIHdpbGwgcHJldmVudCB0aGF0IGZyb20gaGFwcGVuaW5nLiBOb3RlIHRoYXQgdGhpcyBvbmx5IGhhcHBlbnNcbiAgICAvLyB3aGVuIGEgYmluZGluZyBpcyBmaXJzdCBlbmNvdW50ZXJlZCBhbmQgbm90IGVhY2ggdGltZSBpdCBpc1xuICAgIC8vIHVwZGF0ZWQuXG4gICAgZm9yIChsZXQgaSA9IGZpcnN0VmFsdWVJbmRleDsgaSA8PSBsYXN0VmFsdWVJbmRleDsgaSsrKSB7XG4gICAgICBjb25zdCBpbmRleEF0UG9zaXRpb24gPSBjb250ZXh0W2ldO1xuICAgICAgaWYgKGluZGV4QXRQb3NpdGlvbiA9PT0gYmluZGluZ1ZhbHVlKSByZXR1cm47XG4gICAgfVxuXG4gICAgY29udGV4dC5zcGxpY2UobGFzdFZhbHVlSW5kZXgsIDAsIGJpbmRpbmdWYWx1ZSk7XG4gICAgKGNvbnRleHRbaW5kZXggKyBUU3R5bGluZ0NvbnRleHRJbmRleC5WYWx1ZXNDb3VudE9mZnNldF0gYXMgbnVtYmVyKSsrO1xuXG4gICAgLy8gbm93IHRoYXQgYSBuZXcgYmluZGluZyBpbmRleCBoYXMgYmVlbiBhZGRlZCB0byB0aGUgcHJvcGVydHlcbiAgICAvLyB0aGUgZ3VhcmQgbWFzayBiaXQgdmFsdWUgKGF0IHRoZSBgY291bnRJZGAgcG9zaXRpb24pIG5lZWRzXG4gICAgLy8gdG8gYmUgaW5jbHVkZWQgaW50byB0aGUgZXhpc3RpbmcgbWFzayB2YWx1ZS5cbiAgICBjb25zdCBndWFyZE1hc2sgPSBnZXRHdWFyZE1hc2soY29udGV4dCwgaW5kZXgpIHwgKDEgPDwgY291bnRJZCk7XG4gICAgc2V0R3VhcmRNYXNrKGNvbnRleHQsIGluZGV4LCBndWFyZE1hc2spO1xuICB9IGVsc2UgaWYgKGJpbmRpbmdWYWx1ZSAhPT0gbnVsbCAmJiBjb250ZXh0W2xhc3RWYWx1ZUluZGV4XSA9PSBudWxsKSB7XG4gICAgY29udGV4dFtsYXN0VmFsdWVJbmRleF0gPSBiaW5kaW5nVmFsdWU7XG4gIH1cbn1cblxuLyoqXG4gKiBBcHBsaWVzIGFsbCBwZW5kaW5nIHN0eWxlIGFuZCBjbGFzcyBiaW5kaW5ncyB0byB0aGUgcHJvdmlkZWQgZWxlbWVudC5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIHdpbGwgYXR0ZW1wdCB0byBmbHVzaCBzdHlsaW5nIHZpYSB0aGUgcHJvdmlkZWQgYGNsYXNzZXNDb250ZXh0YFxuICogYW5kIGBzdHlsZXNDb250ZXh0YCBjb250ZXh0IHZhbHVlcy4gVGhpcyBmdW5jdGlvbiBpcyBkZXNpZ25lZCB0byBiZSBydW4gZnJvbVxuICogdGhlIGBzdHlsaW5nQXBwbHkoKWAgaW5zdHJ1Y3Rpb24gKHdoaWNoIGlzIHJ1biBhdCB0aGUgdmVyeSBlbmQgb2Ygc3R5bGluZ1xuICogY2hhbmdlIGRldGVjdGlvbikgYW5kIHdpbGwgcmVseSBvbiBhbnkgc3RhdGUgdmFsdWVzIHRoYXQgYXJlIHNldCBmcm9tIHdoZW5cbiAqIGFueSBzdHlsaW5nIGJpbmRpbmdzIHVwZGF0ZS5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIG1heSBiZSBjYWxsZWQgbXVsdGlwbGUgdGltZXMgb24gdGhlIHNhbWUgZWxlbWVudCBiZWNhdXNlIGl0IGNhblxuICogYmUgY2FsbGVkIGZyb20gdGhlIHRlbXBsYXRlIGNvZGUgYXMgd2VsbCBhcyBmcm9tIGhvc3QgYmluZGluZ3MuIEluIG9yZGVyIGZvclxuICogc3R5bGluZyB0byBiZSBzdWNjZXNzZnVsbHkgZmx1c2hlZCB0byB0aGUgZWxlbWVudCAod2hpY2ggd2lsbCBvbmx5IGhhcHBlbiBvbmNlXG4gKiBkZXNwaXRlIHRoaXMgYmVpbmcgY2FsbGVkIG11bHRpcGxlIHRpbWVzKSwgdGhlIGZvbGxvd2luZyBjcml0ZXJpYSBtdXN0IGJlIG1ldDpcbiAqXG4gKiAtIGBmbHVzaFN0eWxpbmdgIGlzIGNhbGxlZCBmcm9tIHRoZSB2ZXJ5IGxhc3QgZGlyZWN0aXZlIHRoYXQgaGFzIHN0eWxpbmcgZm9yXG4gKiAgICB0aGUgZWxlbWVudCAoc2VlIGBhbGxvd1N0eWxpbmdGbHVzaCgpYCkuXG4gKiAtIG9uZSBvciBtb3JlIGJpbmRpbmdzIGZvciBjbGFzc2VzIG9yIHN0eWxlcyBoYXMgdXBkYXRlZCAodGhpcyBpcyBjaGVja2VkIGJ5XG4gKiAgIGV4YW1pbmluZyB0aGUgY2xhc3NlcyBvciBzdHlsZXMgYml0IG1hc2spLlxuICpcbiAqIElmIHRoZSBzdHlsZSBhbmQgY2xhc3MgdmFsdWVzIGFyZSBzdWNjZXNzZnVsbHkgYXBwbGllZCB0byB0aGUgZWxlbWVudCB0aGVuXG4gKiB0aGUgdGVtcG9yYXJ5IHN0YXRlIHZhbHVlcyBmb3IgdGhlIGVsZW1lbnQgd2lsbCBiZSBjbGVhcmVkLiBPdGhlcndpc2UsIGlmXG4gKiB0aGlzIGRpZCBub3Qgb2NjdXIgdGhlbiB0aGUgc3R5bGluZyBzdGF0ZSBpcyBwZXJzaXN0ZWQgKHNlZSBgc3RhdGUudHNgIGZvclxuICogbW9yZSBpbmZvcm1hdGlvbiBvbiBob3cgdGhpcyB3b3JrcykuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBmbHVzaFN0eWxpbmcoXG4gICAgcmVuZGVyZXI6IFJlbmRlcmVyMyB8IFByb2NlZHVyYWxSZW5kZXJlcjMgfCBudWxsLCBkYXRhOiBMU3R5bGluZ0RhdGEsXG4gICAgY2xhc3Nlc0NvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCB8IG51bGwsIHN0eWxlc0NvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCB8IG51bGwsXG4gICAgZWxlbWVudDogUkVsZW1lbnQsIGRpcmVjdGl2ZUluZGV4OiBudW1iZXIsIHN0eWxlU2FuaXRpemVyOiBTdHlsZVNhbml0aXplRm4gfCBudWxsKTogdm9pZCB7XG4gIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUuZmx1c2hTdHlsaW5nKys7XG5cbiAgY29uc3QgcGVyc2lzdFN0YXRlID0gY2xhc3Nlc0NvbnRleHQgPyBzdGF0ZUlzUGVyc2lzdGVkKGNsYXNzZXNDb250ZXh0KSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKHN0eWxlc0NvbnRleHQgPyBzdGF0ZUlzUGVyc2lzdGVkKHN0eWxlc0NvbnRleHQpIDogZmFsc2UpO1xuICBjb25zdCBhbGxvd0ZsdXNoQ2xhc3NlcyA9IGFsbG93U3R5bGluZ0ZsdXNoKGNsYXNzZXNDb250ZXh0LCBkaXJlY3RpdmVJbmRleCk7XG4gIGNvbnN0IGFsbG93Rmx1c2hTdHlsZXMgPSBhbGxvd1N0eWxpbmdGbHVzaChzdHlsZXNDb250ZXh0LCBkaXJlY3RpdmVJbmRleCk7XG5cbiAgLy8gZGVmZXJyZWQgYmluZGluZ3MgYXJlIGJpbmRpbmdzIHdoaWNoIGFyZSBzY2hlZHVsZWQgdG8gcmVnaXN0ZXIgd2l0aFxuICAvLyB0aGUgY29udGV4dCBhdCBhIGxhdGVyIHBvaW50LiBUaGVzZSBiaW5kaW5ncyBjYW4gb25seSByZWdpc3RlcmVkIHdoZW5cbiAgLy8gdGhlIGNvbnRleHQgd2lsbCBiZSAxMDAlIGZsdXNoZWQgdG8gdGhlIGVsZW1lbnQuXG4gIGlmIChkZWZlcnJlZEJpbmRpbmdRdWV1ZS5sZW5ndGggJiYgKGFsbG93Rmx1c2hDbGFzc2VzIHx8IGFsbG93Rmx1c2hTdHlsZXMpKSB7XG4gICAgZmx1c2hEZWZlcnJlZEJpbmRpbmdzKCk7XG4gIH1cblxuICBjb25zdCBzdGF0ZSA9IGdldFN0eWxpbmdTdGF0ZShlbGVtZW50LCBwZXJzaXN0U3RhdGUpO1xuICBjb25zdCBjbGFzc2VzRmx1c2hlZCA9IG1heWJlQXBwbHlTdHlsaW5nKFxuICAgICAgcmVuZGVyZXIsIGVsZW1lbnQsIGRhdGEsIGNsYXNzZXNDb250ZXh0LCBhbGxvd0ZsdXNoQ2xhc3Nlcywgc3RhdGUuY2xhc3Nlc0JpdE1hc2ssIHNldENsYXNzLFxuICAgICAgbnVsbCk7XG4gIGNvbnN0IHN0eWxlc0ZsdXNoZWQgPSBtYXliZUFwcGx5U3R5bGluZyhcbiAgICAgIHJlbmRlcmVyLCBlbGVtZW50LCBkYXRhLCBzdHlsZXNDb250ZXh0LCBhbGxvd0ZsdXNoU3R5bGVzLCBzdGF0ZS5zdHlsZXNCaXRNYXNrLCBzZXRTdHlsZSxcbiAgICAgIHN0eWxlU2FuaXRpemVyKTtcblxuICBpZiAoY2xhc3Nlc0ZsdXNoZWQgJiYgc3R5bGVzRmx1c2hlZCkge1xuICAgIHJlc2V0U3R5bGluZ1N0YXRlKCk7XG4gICAgaWYgKHBlcnNpc3RTdGF0ZSkge1xuICAgICAgZGVsZXRlU3R5bGluZ1N0YXRlRnJvbVN0b3JhZ2UoZWxlbWVudCk7XG4gICAgfVxuICB9IGVsc2UgaWYgKHBlcnNpc3RTdGF0ZSkge1xuICAgIHN0b3JlU3R5bGluZ1N0YXRlKGVsZW1lbnQsIHN0YXRlKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBtYXliZUFwcGx5U3R5bGluZyhcbiAgICByZW5kZXJlcjogUmVuZGVyZXIzIHwgUHJvY2VkdXJhbFJlbmRlcmVyMyB8IG51bGwsIGVsZW1lbnQ6IFJFbGVtZW50LCBkYXRhOiBMU3R5bGluZ0RhdGEsXG4gICAgY29udGV4dDogVFN0eWxpbmdDb250ZXh0IHwgbnVsbCwgYWxsb3dGbHVzaDogYm9vbGVhbiwgYml0TWFzazogbnVtYmVyLFxuICAgIHN0eWxlU2V0dGVyOiBBcHBseVN0eWxpbmdGbiwgc3R5bGVTYW5pdGl6ZXI6IGFueSB8IG51bGwpOiBib29sZWFuIHtcbiAgaWYgKGFsbG93Rmx1c2ggJiYgY29udGV4dCkge1xuICAgIGxvY2tBbmRGaW5hbGl6ZUNvbnRleHQoY29udGV4dCk7XG4gICAgaWYgKGNvbnRleHRIYXNVcGRhdGVzKGNvbnRleHQsIGJpdE1hc2spKSB7XG4gICAgICBuZ0Rldk1vZGUgJiYgKHN0eWxlU2FuaXRpemVyID8gbmdEZXZNb2RlLnN0eWxlc0FwcGxpZWQrKyA6IG5nRGV2TW9kZS5jbGFzc2VzQXBwbGllZCsrKTtcbiAgICAgIGFwcGx5U3R5bGluZyhjb250ZXh0ICEsIHJlbmRlcmVyLCBlbGVtZW50LCBkYXRhLCBiaXRNYXNrLCBzdHlsZVNldHRlciwgc3R5bGVTYW5pdGl6ZXIpO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9XG4gIHJldHVybiBhbGxvd0ZsdXNoO1xufVxuXG5mdW5jdGlvbiBjb250ZXh0SGFzVXBkYXRlcyhjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQgfCBudWxsLCBiaXRNYXNrOiBudW1iZXIpIHtcbiAgcmV0dXJuIGNvbnRleHQgJiYgYml0TWFzayA+IEJJVF9NQVNLX1NUQVJUX1ZBTFVFO1xufVxuXG4vKipcbiAqIExvY2tzIHRoZSBjb250ZXh0IChzbyBubyBtb3JlIGJpbmRpbmdzIGNhbiBiZSBhZGRlZCkgYW5kIGFsc28gY29waWVzIG92ZXIgaW5pdGlhbCBjbGFzcy9zdHlsZVxuICogdmFsdWVzIGludG8gdGhlaXIgYmluZGluZyBhcmVhcy5cbiAqXG4gKiBUaGVyZSBhcmUgdHdvIG1haW4gYWN0aW9ucyB0aGF0IHRha2UgcGxhY2UgaW4gdGhpcyBmdW5jdGlvbjpcbiAqXG4gKiAtIExvY2tpbmcgdGhlIGNvbnRleHQ6XG4gKiAgIExvY2tpbmcgdGhlIGNvbnRleHQgaXMgcmVxdWlyZWQgc28gdGhhdCB0aGUgc3R5bGUvY2xhc3MgaW5zdHJ1Y3Rpb25zIGtub3cgTk9UIHRvXG4gKiAgIHJlZ2lzdGVyIGEgYmluZGluZyBhZ2FpbiBhZnRlciB0aGUgZmlyc3QgdXBkYXRlIHBhc3MgaGFzIHJ1bi4gSWYgYSBsb2NraW5nIGJpdCB3YXNcbiAqICAgbm90IHVzZWQgdGhlbiBpdCB3b3VsZCBuZWVkIHRvIHNjYW4gb3ZlciB0aGUgY29udGV4dCBlYWNoIHRpbWUgYW4gaW5zdHJ1Y3Rpb24gaXMgcnVuXG4gKiAgICh3aGljaCBpcyBleHBlbnNpdmUpLlxuICpcbiAqIC0gUGF0Y2hpbmcgaW5pdGlhbCB2YWx1ZXM6XG4gKiAgIERpcmVjdGl2ZXMgYW5kIGNvbXBvbmVudCBob3N0IGJpbmRpbmdzIG1heSBpbmNsdWRlIHN0YXRpYyBjbGFzcy9zdHlsZSB2YWx1ZXMgd2hpY2ggYXJlXG4gKiAgIGJvdW5kIHRvIHRoZSBob3N0IGVsZW1lbnQuIFdoZW4gdGhpcyBoYXBwZW5zLCB0aGUgc3R5bGluZyBjb250ZXh0IHdpbGwgbmVlZCB0byBiZSBpbmZvcm1lZFxuICogICBzbyBpdCBjYW4gdXNlIHRoZXNlIHN0YXRpYyBzdHlsaW5nIHZhbHVlcyBhcyBkZWZhdWx0cyB3aGVuIGEgbWF0Y2hpbmcgYmluZGluZyBpcyBmYWxzeS5cbiAqICAgVGhlc2UgaW5pdGlhbCBzdHlsaW5nIHZhbHVlcyBhcmUgcmVhZCBmcm9tIHRoZSBpbml0aWFsIHN0eWxpbmcgdmFsdWVzIHNsb3Qgd2l0aGluIHRoZVxuICogICBwcm92aWRlZCBgVFN0eWxpbmdDb250ZXh0YCAod2hpY2ggaXMgYW4gaW5zdGFuY2Ugb2YgYSBgU3R5bGluZ01hcEFycmF5YCkuIFRoaXMgaW5uZXIgbWFwIHdpbGxcbiAqICAgYmUgdXBkYXRlZCBlYWNoIHRpbWUgYSBob3N0IGJpbmRpbmcgYXBwbGllcyBpdHMgc3RhdGljIHN0eWxpbmcgdmFsdWVzICh2aWEgYGVsZW1lbnRIb3N0QXR0cnNgKVxuICogICBzbyB0aGVzZSB2YWx1ZXMgYXJlIG9ubHkgcmVhZCBhdCB0aGlzIHBvaW50IGJlY2F1c2UgdGhpcyBpcyB0aGUgdmVyeSBsYXN0IHBvaW50IGJlZm9yZSB0aGVcbiAqICAgZmlyc3Qgc3R5bGUvY2xhc3MgdmFsdWVzIGFyZSBmbHVzaGVkIHRvIHRoZSBlbGVtZW50LlxuICovXG5mdW5jdGlvbiBsb2NrQW5kRmluYWxpemVDb250ZXh0KGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCk6IHZvaWQge1xuICBpZiAoIWlzQ29udGV4dExvY2tlZChjb250ZXh0KSkge1xuICAgIGNvbnN0IGluaXRpYWxWYWx1ZXMgPSBnZXRTdHlsaW5nTWFwQXJyYXkoY29udGV4dCk7XG4gICAgaWYgKGluaXRpYWxWYWx1ZXMpIHtcbiAgICAgIHVwZGF0ZUluaXRpYWxTdHlsaW5nT25Db250ZXh0KGNvbnRleHQsIGluaXRpYWxWYWx1ZXMpO1xuICAgIH1cbiAgICBsb2NrQ29udGV4dChjb250ZXh0KTtcbiAgfVxufVxuXG4vKipcbiAqIFJ1bnMgdGhyb3VnaCB0aGUgcHJvdmlkZWQgc3R5bGluZyBjb250ZXh0IGFuZCBhcHBsaWVzIGVhY2ggdmFsdWUgdG9cbiAqIHRoZSBwcm92aWRlZCBlbGVtZW50ICh2aWEgdGhlIHJlbmRlcmVyKSBpZiBvbmUgb3IgbW9yZSB2YWx1ZXMgYXJlIHByZXNlbnQuXG4gKlxuICogVGhpcyBmdW5jdGlvbiB3aWxsIGl0ZXJhdGUgb3ZlciBhbGwgZW50cmllcyBwcmVzZW50IGluIHRoZSBwcm92aWRlZFxuICogYFRTdHlsaW5nQ29udGV4dGAgYXJyYXkgKGJvdGggcHJvcC1iYXNlZCBhbmQgbWFwLWJhc2VkIGJpbmRpbmdzKS4tXG4gKlxuICogRWFjaCBlbnRyeSwgd2l0aGluIHRoZSBgVFN0eWxpbmdDb250ZXh0YCBhcnJheSwgaXMgc3RvcmVkIGFscGhhYmV0aWNhbGx5XG4gKiBhbmQgdGhpcyBtZWFucyB0aGF0IGVhY2ggcHJvcC92YWx1ZSBlbnRyeSB3aWxsIGJlIGFwcGxpZWQgaW4gb3JkZXJcbiAqIChzbyBsb25nIGFzIGl0IGlzIG1hcmtlZCBkaXJ0eSBpbiB0aGUgcHJvdmlkZWQgYGJpdE1hc2tgIHZhbHVlKS5cbiAqXG4gKiBJZiB0aGVyZSBhcmUgYW55IG1hcC1iYXNlZCBlbnRyaWVzIHByZXNlbnQgKHdoaWNoIGFyZSBhcHBsaWVkIHRvIHRoZVxuICogZWxlbWVudCB2aWEgdGhlIGBbc3R5bGVdYCBhbmQgYFtjbGFzc11gIGJpbmRpbmdzKSB0aGVuIHRob3NlIGVudHJpZXNcbiAqIHdpbGwgYmUgYXBwbGllZCBhcyB3ZWxsLiBIb3dldmVyLCB0aGUgY29kZSBmb3IgdGhhdCBpcyBub3QgYSBwYXJ0IG9mXG4gKiB0aGlzIGZ1bmN0aW9uLiBJbnN0ZWFkLCBlYWNoIHRpbWUgYSBwcm9wZXJ0eSBpcyB2aXNpdGVkLCB0aGVuIHRoZVxuICogY29kZSBiZWxvdyB3aWxsIGNhbGwgYW4gZXh0ZXJuYWwgZnVuY3Rpb24gY2FsbGVkIGBzdHlsaW5nTWFwc1N5bmNGbmBcbiAqIGFuZCwgaWYgcHJlc2VudCwgaXQgd2lsbCBrZWVwIHRoZSBhcHBsaWNhdGlvbiBvZiBzdHlsaW5nIHZhbHVlcyBpblxuICogbWFwLWJhc2VkIGJpbmRpbmdzIHVwIHRvIHN5bmMgd2l0aCB0aGUgYXBwbGljYXRpb24gb2YgcHJvcC1iYXNlZFxuICogYmluZGluZ3MuXG4gKlxuICogVmlzaXQgYHN0eWxpbmdfbmV4dC9tYXBfYmFzZWRfYmluZGluZ3MudHNgIHRvIGxlYXJuIG1vcmUgYWJvdXQgaG93IHRoZVxuICogYWxnb3JpdGhtIHdvcmtzIGZvciBtYXAtYmFzZWQgc3R5bGluZyBiaW5kaW5ncy5cbiAqXG4gKiBOb3RlIHRoYXQgdGhpcyBmdW5jdGlvbiBpcyBub3QgZGVzaWduZWQgdG8gYmUgY2FsbGVkIGluIGlzb2xhdGlvbiAodXNlXG4gKiBgYXBwbHlDbGFzc2VzYCBhbmQgYGFwcGx5U3R5bGVzYCB0byBhY3R1YWxseSBhcHBseSBzdHlsaW5nIHZhbHVlcykuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhcHBseVN0eWxpbmcoXG4gICAgY29udGV4dDogVFN0eWxpbmdDb250ZXh0LCByZW5kZXJlcjogUmVuZGVyZXIzIHwgUHJvY2VkdXJhbFJlbmRlcmVyMyB8IG51bGwsIGVsZW1lbnQ6IFJFbGVtZW50LFxuICAgIGJpbmRpbmdEYXRhOiBMU3R5bGluZ0RhdGEsIGJpdE1hc2tWYWx1ZTogbnVtYmVyIHwgYm9vbGVhbiwgYXBwbHlTdHlsaW5nRm46IEFwcGx5U3R5bGluZ0ZuLFxuICAgIHNhbml0aXplcjogU3R5bGVTYW5pdGl6ZUZuIHwgbnVsbCkge1xuICBjb25zdCBiaXRNYXNrID0gbm9ybWFsaXplQml0TWFza1ZhbHVlKGJpdE1hc2tWYWx1ZSk7XG4gIGNvbnN0IHN0eWxpbmdNYXBzU3luY0ZuID0gZ2V0U3R5bGluZ01hcHNTeW5jRm4oKTtcbiAgY29uc3QgbWFwc0d1YXJkTWFzayA9IGdldEd1YXJkTWFzayhjb250ZXh0LCBUU3R5bGluZ0NvbnRleHRJbmRleC5NYXBCaW5kaW5nc1Bvc2l0aW9uKTtcbiAgY29uc3QgYXBwbHlBbGxWYWx1ZXMgPSAoYml0TWFzayAmIG1hcHNHdWFyZE1hc2spID4gMDtcbiAgY29uc3QgbWFwc01vZGUgPVxuICAgICAgYXBwbHlBbGxWYWx1ZXMgPyBTdHlsaW5nTWFwc1N5bmNNb2RlLkFwcGx5QWxsVmFsdWVzIDogU3R5bGluZ01hcHNTeW5jTW9kZS5UcmF2ZXJzZVZhbHVlcztcblxuICBsZXQgaSA9IGdldFByb3BWYWx1ZXNTdGFydFBvc2l0aW9uKGNvbnRleHQpO1xuICB3aGlsZSAoaSA8IGNvbnRleHQubGVuZ3RoKSB7XG4gICAgY29uc3QgdmFsdWVzQ291bnQgPSBnZXRWYWx1ZXNDb3VudChjb250ZXh0LCBpKTtcbiAgICBjb25zdCBndWFyZE1hc2sgPSBnZXRHdWFyZE1hc2soY29udGV4dCwgaSk7XG4gICAgaWYgKGJpdE1hc2sgJiBndWFyZE1hc2spIHtcbiAgICAgIGxldCB2YWx1ZUFwcGxpZWQgPSBmYWxzZTtcbiAgICAgIGNvbnN0IHByb3AgPSBnZXRQcm9wKGNvbnRleHQsIGkpO1xuICAgICAgY29uc3QgdmFsdWVzQ291bnRVcFRvRGVmYXVsdCA9IHZhbHVlc0NvdW50IC0gMTtcbiAgICAgIGNvbnN0IGRlZmF1bHRWYWx1ZSA9IGdldEJpbmRpbmdWYWx1ZShjb250ZXh0LCBpLCB2YWx1ZXNDb3VudFVwVG9EZWZhdWx0KSBhcyBzdHJpbmcgfCBudWxsO1xuXG4gICAgICAvLyBjYXNlIDE6IGFwcGx5IHByb3AtYmFzZWQgdmFsdWVzXG4gICAgICAvLyB0cnkgdG8gYXBwbHkgdGhlIGJpbmRpbmcgdmFsdWVzIGFuZCBzZWUgaWYgYSBub24tbnVsbFxuICAgICAgLy8gdmFsdWUgZ2V0cyBzZXQgZm9yIHRoZSBzdHlsaW5nIGJpbmRpbmdcbiAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgdmFsdWVzQ291bnRVcFRvRGVmYXVsdDsgaisrKSB7XG4gICAgICAgIGNvbnN0IGJpbmRpbmdJbmRleCA9IGdldEJpbmRpbmdWYWx1ZShjb250ZXh0LCBpLCBqKSBhcyBudW1iZXI7XG4gICAgICAgIGNvbnN0IHZhbHVlID0gYmluZGluZ0RhdGFbYmluZGluZ0luZGV4XTtcbiAgICAgICAgaWYgKGlzU3R5bGluZ1ZhbHVlRGVmaW5lZCh2YWx1ZSkpIHtcbiAgICAgICAgICBjb25zdCBmaW5hbFZhbHVlID0gc2FuaXRpemVyICYmIGlzU2FuaXRpemF0aW9uUmVxdWlyZWQoY29udGV4dCwgaSkgP1xuICAgICAgICAgICAgICBzYW5pdGl6ZXIocHJvcCwgdmFsdWUsIFN0eWxlU2FuaXRpemVNb2RlLlNhbml0aXplT25seSkgOlxuICAgICAgICAgICAgICB2YWx1ZTtcbiAgICAgICAgICBhcHBseVN0eWxpbmdGbihyZW5kZXJlciwgZWxlbWVudCwgcHJvcCwgZmluYWxWYWx1ZSwgYmluZGluZ0luZGV4KTtcbiAgICAgICAgICB2YWx1ZUFwcGxpZWQgPSB0cnVlO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIGNhc2UgMjogYXBwbHkgbWFwLWJhc2VkIHZhbHVlc1xuICAgICAgLy8gdHJhdmVyc2UgdGhyb3VnaCBlYWNoIG1hcC1iYXNlZCBzdHlsaW5nIGJpbmRpbmcgYW5kIHVwZGF0ZSBhbGwgdmFsdWVzIHVwIHRvXG4gICAgICAvLyB0aGUgcHJvdmlkZWQgYHByb3BgIHZhbHVlLiBJZiB0aGUgcHJvcGVydHkgd2FzIG5vdCBhcHBsaWVkIGluIHRoZSBsb29wIGFib3ZlXG4gICAgICAvLyB0aGVuIGl0IHdpbGwgYmUgYXR0ZW1wdGVkIHRvIGJlIGFwcGxpZWQgaW4gdGhlIG1hcHMgc3luYyBjb2RlIGJlbG93LlxuICAgICAgaWYgKHN0eWxpbmdNYXBzU3luY0ZuKSB7XG4gICAgICAgIC8vIGRldGVybWluZSB3aGV0aGVyIG9yIG5vdCB0byBhcHBseSB0aGUgdGFyZ2V0IHByb3BlcnR5IG9yIHRvIHNraXAgaXRcbiAgICAgICAgY29uc3QgbW9kZSA9IG1hcHNNb2RlIHwgKHZhbHVlQXBwbGllZCA/IFN0eWxpbmdNYXBzU3luY01vZGUuU2tpcFRhcmdldFByb3AgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgU3R5bGluZ01hcHNTeW5jTW9kZS5BcHBseVRhcmdldFByb3ApO1xuICAgICAgICBjb25zdCB2YWx1ZUFwcGxpZWRXaXRoaW5NYXAgPSBzdHlsaW5nTWFwc1N5bmNGbihcbiAgICAgICAgICAgIGNvbnRleHQsIHJlbmRlcmVyLCBlbGVtZW50LCBiaW5kaW5nRGF0YSwgYXBwbHlTdHlsaW5nRm4sIHNhbml0aXplciwgbW9kZSwgcHJvcCxcbiAgICAgICAgICAgIGRlZmF1bHRWYWx1ZSk7XG4gICAgICAgIHZhbHVlQXBwbGllZCA9IHZhbHVlQXBwbGllZCB8fCB2YWx1ZUFwcGxpZWRXaXRoaW5NYXA7XG4gICAgICB9XG5cbiAgICAgIC8vIGNhc2UgMzogYXBwbHkgdGhlIGRlZmF1bHQgdmFsdWVcbiAgICAgIC8vIGlmIHRoZSB2YWx1ZSBoYXMgbm90IHlldCBiZWVuIGFwcGxpZWQgdGhlbiBhIHRydXRoeSB2YWx1ZSBkb2VzIG5vdCBleGlzdCBpbiB0aGVcbiAgICAgIC8vIHByb3AtYmFzZWQgb3IgbWFwLWJhc2VkIGJpbmRpbmdzIGNvZGUuIElmIGFuZCB3aGVuIHRoaXMgaGFwcGVucywganVzdCBhcHBseSB0aGVcbiAgICAgIC8vIGRlZmF1bHQgdmFsdWUgKGV2ZW4gaWYgdGhlIGRlZmF1bHQgdmFsdWUgaXMgYG51bGxgKS5cbiAgICAgIGlmICghdmFsdWVBcHBsaWVkKSB7XG4gICAgICAgIGFwcGx5U3R5bGluZ0ZuKHJlbmRlcmVyLCBlbGVtZW50LCBwcm9wLCBkZWZhdWx0VmFsdWUpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGkgKz0gVFN0eWxpbmdDb250ZXh0SW5kZXguQmluZGluZ3NTdGFydE9mZnNldCArIHZhbHVlc0NvdW50O1xuICB9XG5cbiAgLy8gdGhlIG1hcC1iYXNlZCBzdHlsaW5nIGVudHJpZXMgbWF5IGhhdmUgbm90IGFwcGxpZWQgYWxsIHRoZWlyXG4gIC8vIHZhbHVlcy4gRm9yIHRoaXMgcmVhc29uLCBvbmUgbW9yZSBjYWxsIHRvIHRoZSBzeW5jIGZ1bmN0aW9uXG4gIC8vIG5lZWRzIHRvIGJlIGlzc3VlZCBhdCB0aGUgZW5kLlxuICBpZiAoc3R5bGluZ01hcHNTeW5jRm4pIHtcbiAgICBzdHlsaW5nTWFwc1N5bmNGbihjb250ZXh0LCByZW5kZXJlciwgZWxlbWVudCwgYmluZGluZ0RhdGEsIGFwcGx5U3R5bGluZ0ZuLCBzYW5pdGl6ZXIsIG1hcHNNb2RlKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBub3JtYWxpemVCaXRNYXNrVmFsdWUodmFsdWU6IG51bWJlciB8IGJvb2xlYW4pOiBudW1iZXIge1xuICAvLyBpZiBwYXNzID0+IGFwcGx5IGFsbCB2YWx1ZXMgKC0xIGltcGxpZXMgdGhhdCBhbGwgYml0cyBhcmUgZmxpcHBlZCB0byB0cnVlKVxuICBpZiAodmFsdWUgPT09IHRydWUpIHJldHVybiAtMTtcblxuICAvLyBpZiBwYXNzID0+IHNraXAgYWxsIHZhbHVlc1xuICBpZiAodmFsdWUgPT09IGZhbHNlKSByZXR1cm4gMDtcblxuICAvLyByZXR1cm4gdGhlIGJpdCBtYXNrIHZhbHVlIGFzIGlzXG4gIHJldHVybiB2YWx1ZTtcbn1cblxubGV0IF9hY3RpdmVTdHlsaW5nTWFwQXBwbHlGbjogU3luY1N0eWxpbmdNYXBzRm58bnVsbCA9IG51bGw7XG5leHBvcnQgZnVuY3Rpb24gZ2V0U3R5bGluZ01hcHNTeW5jRm4oKSB7XG4gIHJldHVybiBfYWN0aXZlU3R5bGluZ01hcEFwcGx5Rm47XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXRTdHlsaW5nTWFwc1N5bmNGbihmbjogU3luY1N0eWxpbmdNYXBzRm4pIHtcbiAgX2FjdGl2ZVN0eWxpbmdNYXBBcHBseUZuID0gZm47XG59XG5cbi8qKlxuICogQXNzaWducyBhIHN0eWxlIHZhbHVlIHRvIGEgc3R5bGUgcHJvcGVydHkgZm9yIHRoZSBnaXZlbiBlbGVtZW50LlxuICovXG5jb25zdCBzZXRTdHlsZTogQXBwbHlTdHlsaW5nRm4gPVxuICAgIChyZW5kZXJlcjogUmVuZGVyZXIzIHwgbnVsbCwgbmF0aXZlOiBSRWxlbWVudCwgcHJvcDogc3RyaW5nLCB2YWx1ZTogc3RyaW5nIHwgbnVsbCkgPT4ge1xuICAgICAgLy8gdGhlIHJlYXNvbiB3aHkgdGhpcyBtYXkgYmUgYG51bGxgIGlzIGVpdGhlciBiZWNhdXNlXG4gICAgICAvLyBpdCdzIGEgY29udGFpbmVyIGVsZW1lbnQgb3IgaXQncyBhIHBhcnQgb2YgYSB0ZXN0XG4gICAgICAvLyBlbnZpcm9ubWVudCB0aGF0IGRvZXNuJ3QgaGF2ZSBzdHlsaW5nLiBJbiBlaXRoZXJcbiAgICAgIC8vIGNhc2UgaXQncyBzYWZlIG5vdCB0byBhcHBseSBzdHlsaW5nIHRvIHRoZSBlbGVtZW50LlxuICAgICAgY29uc3QgbmF0aXZlU3R5bGUgPSBuYXRpdmUuc3R5bGU7XG4gICAgICBpZiAodmFsdWUpIHtcbiAgICAgICAgLy8gb3BhY2l0eSwgei1pbmRleCBhbmQgZmxleGJveCBhbGwgaGF2ZSBudW1iZXIgdmFsdWVzXG4gICAgICAgIC8vIGFuZCB0aGVzZSBuZWVkIHRvIGJlIGNvbnZlcnRlZCBpbnRvIHN0cmluZ3Mgc28gdGhhdFxuICAgICAgICAvLyB0aGV5IGNhbiBiZSBhc3NpZ25lZCBwcm9wZXJseS5cbiAgICAgICAgdmFsdWUgPSB2YWx1ZS50b1N0cmluZygpO1xuICAgICAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyU2V0U3R5bGUrKztcbiAgICAgICAgcmVuZGVyZXIgJiYgaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpID9cbiAgICAgICAgICAgIHJlbmRlcmVyLnNldFN0eWxlKG5hdGl2ZSwgcHJvcCwgdmFsdWUsIFJlbmRlcmVyU3R5bGVGbGFnczMuRGFzaENhc2UpIDpcbiAgICAgICAgICAgIChuYXRpdmVTdHlsZSAmJiBuYXRpdmVTdHlsZS5zZXRQcm9wZXJ0eShwcm9wLCB2YWx1ZSkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlclJlbW92ZVN0eWxlKys7XG4gICAgICAgIHJlbmRlcmVyICYmIGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSA/XG4gICAgICAgICAgICByZW5kZXJlci5yZW1vdmVTdHlsZShuYXRpdmUsIHByb3AsIFJlbmRlcmVyU3R5bGVGbGFnczMuRGFzaENhc2UpIDpcbiAgICAgICAgICAgIChuYXRpdmVTdHlsZSAmJiBuYXRpdmVTdHlsZS5yZW1vdmVQcm9wZXJ0eShwcm9wKSk7XG4gICAgICB9XG4gICAgfTtcblxuLyoqXG4gKiBBZGRzL3JlbW92ZXMgdGhlIHByb3ZpZGVkIGNsYXNzTmFtZSB2YWx1ZSB0byB0aGUgcHJvdmlkZWQgZWxlbWVudC5cbiAqL1xuY29uc3Qgc2V0Q2xhc3M6IEFwcGx5U3R5bGluZ0ZuID1cbiAgICAocmVuZGVyZXI6IFJlbmRlcmVyMyB8IG51bGwsIG5hdGl2ZTogUkVsZW1lbnQsIGNsYXNzTmFtZTogc3RyaW5nLCB2YWx1ZTogYW55KSA9PiB7XG4gICAgICBpZiAoY2xhc3NOYW1lICE9PSAnJykge1xuICAgICAgICAvLyB0aGUgcmVhc29uIHdoeSB0aGlzIG1heSBiZSBgbnVsbGAgaXMgZWl0aGVyIGJlY2F1c2VcbiAgICAgICAgLy8gaXQncyBhIGNvbnRhaW5lciBlbGVtZW50IG9yIGl0J3MgYSBwYXJ0IG9mIGEgdGVzdFxuICAgICAgICAvLyBlbnZpcm9ubWVudCB0aGF0IGRvZXNuJ3QgaGF2ZSBzdHlsaW5nLiBJbiBlaXRoZXJcbiAgICAgICAgLy8gY2FzZSBpdCdzIHNhZmUgbm90IHRvIGFwcGx5IHN0eWxpbmcgdG8gdGhlIGVsZW1lbnQuXG4gICAgICAgIGNvbnN0IGNsYXNzTGlzdCA9IG5hdGl2ZS5jbGFzc0xpc3Q7XG4gICAgICAgIGlmICh2YWx1ZSkge1xuICAgICAgICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJBZGRDbGFzcysrO1xuICAgICAgICAgIHJlbmRlcmVyICYmIGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSA/IHJlbmRlcmVyLmFkZENsYXNzKG5hdGl2ZSwgY2xhc3NOYW1lKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKGNsYXNzTGlzdCAmJiBjbGFzc0xpc3QuYWRkKGNsYXNzTmFtZSkpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJSZW1vdmVDbGFzcysrO1xuICAgICAgICAgIHJlbmRlcmVyICYmIGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSA/IHJlbmRlcmVyLnJlbW92ZUNsYXNzKG5hdGl2ZSwgY2xhc3NOYW1lKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKGNsYXNzTGlzdCAmJiBjbGFzc0xpc3QucmVtb3ZlKGNsYXNzTmFtZSkpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfTtcblxuLyoqXG4gKiBJdGVyYXRlcyBvdmVyIGFsbCBwcm92aWRlZCBzdHlsaW5nIGVudHJpZXMgYW5kIHJlbmRlcnMgdGhlbSBvbiB0aGUgZWxlbWVudC5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIGlzIHVzZWQgYWxvbmdzaWRlIGEgYFN0eWxpbmdNYXBBcnJheWAgZW50cnkuIFRoaXMgZW50cnkgaXMgbm90XG4gKiB0aGUgc2FtZSBhcyB0aGUgYFRTdHlsaW5nQ29udGV4dGAgYW5kIGlzIG9ubHkgcmVhbGx5IHVzZWQgd2hlbiBhbiBlbGVtZW50IGNvbnRhaW5zXG4gKiBpbml0aWFsIHN0eWxpbmcgdmFsdWVzIChlLmcuIGA8ZGl2IHN0eWxlPVwid2lkdGg6MjAwcHhcIj5gKSwgYnV0IG5vIHN0eWxlL2NsYXNzIGJpbmRpbmdzXG4gKiBhcmUgcHJlc2VudC4gSWYgYW5kIHdoZW4gdGhhdCBoYXBwZW5zIHRoZW4gdGhpcyBmdW5jdGlvbiB3aWxsIGJlIGNhbGxlZCB0byByZW5kZXIgYWxsXG4gKiBpbml0aWFsIHN0eWxpbmcgdmFsdWVzIG9uIGFuIGVsZW1lbnQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZW5kZXJTdHlsaW5nTWFwKFxuICAgIHJlbmRlcmVyOiBSZW5kZXJlcjMsIGVsZW1lbnQ6IFJFbGVtZW50LCBzdHlsaW5nVmFsdWVzOiBUU3R5bGluZ0NvbnRleHQgfCBTdHlsaW5nTWFwQXJyYXkgfCBudWxsLFxuICAgIGlzQ2xhc3NCYXNlZDogYm9vbGVhbik6IHZvaWQge1xuICBjb25zdCBzdHlsaW5nTWFwQXJyID0gZ2V0U3R5bGluZ01hcEFycmF5KHN0eWxpbmdWYWx1ZXMpO1xuICBpZiAoc3R5bGluZ01hcEFycikge1xuICAgIGZvciAobGV0IGkgPSBTdHlsaW5nTWFwQXJyYXlJbmRleC5WYWx1ZXNTdGFydFBvc2l0aW9uOyBpIDwgc3R5bGluZ01hcEFyci5sZW5ndGg7XG4gICAgICAgICBpICs9IFN0eWxpbmdNYXBBcnJheUluZGV4LlR1cGxlU2l6ZSkge1xuICAgICAgY29uc3QgcHJvcCA9IGdldE1hcFByb3Aoc3R5bGluZ01hcEFyciwgaSk7XG4gICAgICBjb25zdCB2YWx1ZSA9IGdldE1hcFZhbHVlKHN0eWxpbmdNYXBBcnIsIGkpO1xuICAgICAgaWYgKGlzQ2xhc3NCYXNlZCkge1xuICAgICAgICBzZXRDbGFzcyhyZW5kZXJlciwgZWxlbWVudCwgcHJvcCwgdmFsdWUsIG51bGwpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc2V0U3R5bGUocmVuZGVyZXIsIGVsZW1lbnQsIHByb3AsIHZhbHVlLCBudWxsKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBSZWdpc3RlcnMgYWxsIGluaXRpYWwgc3R5bGluZyBlbnRyaWVzIGludG8gdGhlIHByb3ZpZGVkIGNvbnRleHQuXG4gKlxuICogVGhpcyBmdW5jdGlvbiB3aWxsIGl0ZXJhdGUgb3ZlciBhbGwgZW50cmllcyBpbiB0aGUgcHJvdmlkZWQgYGluaXRpYWxTdHlsaW5nYCBhcn1yYXkgYW5kIHJlZ2lzdGVyXG4gKiB0aGVtIGFzIGRlZmF1bHQgKGluaXRpYWwpIHZhbHVlcyBpbiB0aGUgcHJvdmlkZWQgY29udGV4dC4gSW5pdGlhbCBzdHlsaW5nIHZhbHVlcyBpbiBhIGNvbnRleHQgYXJlXG4gKiB0aGUgZGVmYXVsdCB2YWx1ZXMgdGhhdCBhcmUgdG8gYmUgYXBwbGllZCB1bmxlc3Mgb3ZlcndyaXR0ZW4gYnkgYSBiaW5kaW5nLlxuICpcbiAqIFRoZSByZWFzb24gd2h5IHRoaXMgZnVuY3Rpb24gZXhpc3RzIGFuZCBpc24ndCBhIHBhcnQgb2YgdGhlIGNvbnRleHQgY29uc3RydWN0aW9uIGlzIGJlY2F1c2VcbiAqIGhvc3QgYmluZGluZyBpcyBldmFsdWF0ZWQgYXQgYSBsYXRlciBzdGFnZSBhZnRlciB0aGUgZWxlbWVudCBpcyBjcmVhdGVkLiBUaGlzIG1lYW5zIHRoYXRcbiAqIGlmIGEgZGlyZWN0aXZlIG9yIGNvbXBvbmVudCBjb250YWlucyBhbnkgaW5pdGlhbCBzdHlsaW5nIGNvZGUgKGkuZS4gYDxkaXYgY2xhc3M9XCJmb29cIj5gKVxuICogdGhlbiB0aGF0IGluaXRpYWwgc3R5bGluZyBkYXRhIGNhbiBvbmx5IGJlIGFwcGxpZWQgb25jZSB0aGUgc3R5bGluZyBmb3IgdGhhdCBlbGVtZW50XG4gKiBpcyBmaXJzdCBhcHBsaWVkIChhdCB0aGUgZW5kIG9mIHRoZSB1cGRhdGUgcGhhc2UpLiBPbmNlIHRoYXQgaGFwcGVucyB0aGVuIHRoZSBjb250ZXh0IHdpbGxcbiAqIHVwZGF0ZSBpdHNlbGYgd2l0aCB0aGUgY29tcGxldGUgaW5pdGlhbCBzdHlsaW5nIGZvciB0aGUgZWxlbWVudC5cbiAqL1xuZnVuY3Rpb24gdXBkYXRlSW5pdGlhbFN0eWxpbmdPbkNvbnRleHQoXG4gICAgY29udGV4dDogVFN0eWxpbmdDb250ZXh0LCBpbml0aWFsU3R5bGluZzogU3R5bGluZ01hcEFycmF5KTogdm9pZCB7XG4gIC8vIGAtMWAgaXMgdXNlZCBoZXJlIGJlY2F1c2UgYWxsIGluaXRpYWwgc3R5bGluZyBkYXRhIGlzIG5vdCBhIHNwYXJ0XG4gIC8vIG9mIGEgYmluZGluZyAoc2luY2UgaXQncyBzdGF0aWMpXG4gIGNvbnN0IElOSVRJQUxfU1RZTElOR19DT1VOVF9JRCA9IC0xO1xuXG4gIGZvciAobGV0IGkgPSBTdHlsaW5nTWFwQXJyYXlJbmRleC5WYWx1ZXNTdGFydFBvc2l0aW9uOyBpIDwgaW5pdGlhbFN0eWxpbmcubGVuZ3RoO1xuICAgICAgIGkgKz0gU3R5bGluZ01hcEFycmF5SW5kZXguVHVwbGVTaXplKSB7XG4gICAgY29uc3QgdmFsdWUgPSBnZXRNYXBWYWx1ZShpbml0aWFsU3R5bGluZywgaSk7XG4gICAgaWYgKHZhbHVlKSB7XG4gICAgICBjb25zdCBwcm9wID0gZ2V0TWFwUHJvcChpbml0aWFsU3R5bGluZywgaSk7XG4gICAgICByZWdpc3RlckJpbmRpbmcoY29udGV4dCwgSU5JVElBTF9TVFlMSU5HX0NPVU5UX0lELCBwcm9wLCB2YWx1ZSwgZmFsc2UpO1xuICAgIH1cbiAgfVxufVxuIl19