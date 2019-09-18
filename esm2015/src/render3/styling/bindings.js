/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
* @license
* Copyright Google Inc. All Rights Reserved.
*
* Use of this source code is governed by an MIT-style license that can be
* found in the LICENSE file at https://angular.io/license
*/
import { unwrapSafeValue } from '../../sanitization/bypass';
import { RendererStyleFlags3, isProceduralRenderer } from '../interfaces/renderer';
import { NO_CHANGE } from '../tokens';
import { DEFAULT_BINDING_INDEX, DEFAULT_BINDING_VALUE, DEFAULT_GUARD_MASK_VALUE, MAP_BASED_ENTRY_PROP_NAME, getBindingValue, getConfig, getDefaultValue, getGuardMask, getMapProp, getMapValue, getProp, getPropValuesStartPosition, getStylingMapArray, getTotalSources, getValue, getValuesCount, hasConfig, hasValueChanged, isContextLocked, isHostStylingActive, isSanitizationRequired, isStylingValueDefined, lockContext, patchConfig, setDefaultValue, setGuardMask, setMapAsDirty, setValue } from '../util/styling_utils';
import { getStylingState, resetStylingState } from './state';
/**
 * The guard/update mask bit index location for map-based bindings.
 *
 * All map-based bindings (i.e. `[style]` and `[class]` )
 * @type {?}
 */
const STYLING_INDEX_FOR_MAP_BINDING = 0;
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
 * @param {?} directiveIndex
 * @param {?} prop
 * @param {?} bindingIndex
 * @param {?} value
 * @param {?=} forceUpdate
 * @return {?}
 */
export function updateClassViaContext(context, data, element, directiveIndex, prop, bindingIndex, value, forceUpdate) {
    /** @type {?} */
    const isMapBased = !prop;
    /** @type {?} */
    const state = getStylingState(element, directiveIndex);
    /** @type {?} */
    const countIndex = isMapBased ? STYLING_INDEX_FOR_MAP_BINDING : state.classesIndex++;
    if (value !== NO_CHANGE) {
        /** @type {?} */
        const updated = updateBindingData(context, data, countIndex, state.sourceIndex, prop, bindingIndex, value, forceUpdate, false);
        if (updated || forceUpdate) {
            // We flip the bit in the bitMask to reflect that the binding
            // at the `index` slot has changed. This identifies to the flushing
            // phase that the bindings for this particular CSS class need to be
            // applied again because on or more of the bindings for the CSS
            // class have changed.
            state.classesBitMask |= 1 << countIndex;
            return true;
        }
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
 * @param {?} directiveIndex
 * @param {?} prop
 * @param {?} bindingIndex
 * @param {?} value
 * @param {?} sanitizer
 * @param {?=} forceUpdate
 * @return {?}
 */
export function updateStyleViaContext(context, data, element, directiveIndex, prop, bindingIndex, value, sanitizer, forceUpdate) {
    /** @type {?} */
    const isMapBased = !prop;
    /** @type {?} */
    const state = getStylingState(element, directiveIndex);
    /** @type {?} */
    const countIndex = isMapBased ? STYLING_INDEX_FOR_MAP_BINDING : state.stylesIndex++;
    if (value !== NO_CHANGE) {
        /** @type {?} */
        const sanitizationRequired = isMapBased ?
            true :
            (sanitizer ? sanitizer((/** @type {?} */ (prop)), null, 1 /* ValidateProperty */) : false);
        /** @type {?} */
        const updated = updateBindingData(context, data, countIndex, state.sourceIndex, prop, bindingIndex, value, forceUpdate, sanitizationRequired);
        if (updated || forceUpdate) {
            // We flip the bit in the bitMask to reflect that the binding
            // at the `index` slot has changed. This identifies to the flushing
            // phase that the bindings for this particular property need to be
            // applied again because on or more of the bindings for the CSS
            // property have changed.
            state.stylesBitMask |= 1 << countIndex;
            return true;
        }
    }
    return false;
}
/**
 * Called each time a binding value has changed within the provided `TStylingContext`.
 *
 * This function is designed to be called from `updateStyleBinding` and `updateClassBinding`.
 * If called during the first update pass, the binding will be registered in the context.
 *
 * This function will also update binding slot in the provided `LStylingData` with the
 * new binding entry (if it has changed).
 *
 * @param {?} context
 * @param {?} data
 * @param {?} counterIndex
 * @param {?} sourceIndex
 * @param {?} prop
 * @param {?} bindingIndex
 * @param {?} value
 * @param {?=} forceUpdate
 * @param {?=} sanitizationRequired
 * @return {?} whether or not the binding value was updated in the `LStylingData`.
 */
function updateBindingData(context, data, counterIndex, sourceIndex, prop, bindingIndex, value, forceUpdate, sanitizationRequired) {
    /** @type {?} */
    const hostBindingsMode = isHostStylingActive(sourceIndex);
    if (!isContextLocked(context, hostBindingsMode)) {
        // this will only happen during the first update pass of the
        // context. The reason why we can't use `tNode.firstTemplatePass`
        // here is because its not guaranteed to be true when the first
        // update pass is executed (remember that all styling instructions
        // are run in the update phase, and, as a result, are no more
        // styling instructions that are run in the creation phase).
        registerBinding(context, counterIndex, sourceIndex, prop, bindingIndex, sanitizationRequired);
        patchConfig(context, hostBindingsMode ? 32 /* HasHostBindings */ : 16 /* HasTemplateBindings */);
        patchConfig(context, prop ? 1 /* HasPropBindings */ : 2 /* HasMapBindings */);
    }
    /** @type {?} */
    const changed = forceUpdate || hasValueChanged(data[bindingIndex], value);
    if (changed) {
        setValue(data, bindingIndex, value);
        /** @type {?} */
        const doSetValuesAsStale = (getConfig(context) & 32 /* HasHostBindings */) &&
            !hostBindingsMode && (prop ? !value : true);
        if (doSetValuesAsStale) {
            renderHostBindingsAsStale(context, data, prop, !prop);
        }
    }
    return changed;
}
/**
 * Iterates over all host-binding values for the given `prop` value in the context and sets their
 * corresponding binding values to `null`.
 *
 * Whenever a template binding changes its value to `null`, all host-binding values should be
 * re-applied
 * to the element when the host bindings are evaluated. This may not always happen in the event
 * that none of the bindings changed within the host bindings code. For this reason this function
 * is expected to be called each time a template binding becomes falsy or when a map-based template
 * binding changes.
 * @param {?} context
 * @param {?} data
 * @param {?} prop
 * @param {?} isMapBased
 * @return {?}
 */
function renderHostBindingsAsStale(context, data, prop, isMapBased) {
    /** @type {?} */
    const valuesCount = getValuesCount(context);
    if (hasConfig(context, 1 /* HasPropBindings */)) {
        /** @type {?} */
        const itemsPerRow = 4 /* BindingsStartOffset */ + valuesCount;
        /** @type {?} */
        let i = 3 /* ValuesStartPosition */;
        while (i < context.length) {
            if (getProp(context, i) === prop) {
                break;
            }
            i += itemsPerRow;
        }
        /** @type {?} */
        const bindingsStart = i + 4 /* BindingsStartOffset */;
        /** @type {?} */
        const valuesStart = bindingsStart + 1;
        // the first column is template bindings
        /** @type {?} */
        const valuesEnd = bindingsStart + valuesCount - 1;
        for (let i = valuesStart; i < valuesEnd; i++) {
            /** @type {?} */
            const bindingIndex = (/** @type {?} */ (context[i]));
            if (bindingIndex !== 0) {
                setValue(data, bindingIndex, null);
            }
        }
    }
    if (hasConfig(context, 2 /* HasMapBindings */)) {
        /** @type {?} */
        const bindingsStart = 3 /* ValuesStartPosition */ + 4 /* BindingsStartOffset */;
        /** @type {?} */
        const valuesStart = bindingsStart + 1;
        // the first column is template bindings
        /** @type {?} */
        const valuesEnd = bindingsStart + valuesCount - 1;
        for (let i = valuesStart; i < valuesEnd; i++) {
            /** @type {?} */
            const stylingMap = getValue(data, (/** @type {?} */ (context[i])));
            if (stylingMap) {
                setMapAsDirty(stylingMap);
            }
        }
    }
}
/**
 * Registers the provided binding (prop + bindingIndex) into the context.
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
 * much the same as prop-based bindings, but, their property name value is set as `[MAP]`.
 * @param {?} context
 * @param {?} countId
 * @param {?} sourceIndex
 * @param {?} prop
 * @param {?} bindingValue
 * @param {?=} sanitizationRequired
 * @return {?}
 */
export function registerBinding(context, countId, sourceIndex, prop, bindingValue, sanitizationRequired) {
    /** @type {?} */
    let found = false;
    prop = prop || MAP_BASED_ENTRY_PROP_NAME;
    /** @type {?} */
    let totalSources = getTotalSources(context);
    // if a new source is detected then a new column needs to be allocated into
    // the styling context. The column is basically a new allocation of binding
    // sources that will be available to each property.
    while (totalSources <= sourceIndex) {
        addNewSourceColumn(context);
        totalSources++;
    }
    /** @type {?} */
    const isBindingIndexValue = typeof bindingValue === 'number';
    /** @type {?} */
    const entriesPerRow = 4 /* BindingsStartOffset */ + getValuesCount(context);
    /** @type {?} */
    let i = 3 /* ValuesStartPosition */;
    // all style/class bindings are sorted by property name
    while (i < context.length) {
        /** @type {?} */
        const p = getProp(context, i);
        if (prop <= p) {
            if (prop < p) {
                allocateNewContextEntry(context, i, prop, sanitizationRequired);
            }
            else if (isBindingIndexValue) {
                patchConfig(context, 4 /* HasCollisions */);
            }
            addBindingIntoContext(context, i, bindingValue, countId, sourceIndex);
            found = true;
            break;
        }
        i += entriesPerRow;
    }
    if (!found) {
        allocateNewContextEntry(context, context.length, prop, sanitizationRequired);
        addBindingIntoContext(context, i, bindingValue, countId, sourceIndex);
    }
}
/**
 * Inserts a new row into the provided `TStylingContext` and assigns the provided `prop` value as
 * the property entry.
 * @param {?} context
 * @param {?} index
 * @param {?} prop
 * @param {?=} sanitizationRequired
 * @return {?}
 */
function allocateNewContextEntry(context, index, prop, sanitizationRequired) {
    /** @type {?} */
    const config = sanitizationRequired ? 1 /* SanitizationRequired */ :
        0 /* Default */;
    context.splice(index, 0, config, // 1) config value
    DEFAULT_GUARD_MASK_VALUE, // 2) template bit mask
    DEFAULT_GUARD_MASK_VALUE, // 3) host bindings bit mask
    prop);
    index += 4; // the 4 values above
    // the 4 values above
    // 5...) default binding index for the template value
    // depending on how many sources already exist in the context,
    // multiple default index entries may need to be inserted for
    // the new value in the context.
    /** @type {?} */
    const totalBindingsPerEntry = getTotalSources(context);
    for (let i = 0; i < totalBindingsPerEntry; i++) {
        context.splice(index, 0, DEFAULT_BINDING_INDEX);
        index++;
    }
    // 6) default binding value for the new entry
    context.splice(index, 0, DEFAULT_BINDING_VALUE);
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
 * @param {?} context
 * @param {?} index
 * @param {?} bindingValue
 * @param {?} bitIndex
 * @param {?} sourceIndex
 * @return {?}
 */
function addBindingIntoContext(context, index, bindingValue, bitIndex, sourceIndex) {
    if (typeof bindingValue === 'number') {
        /** @type {?} */
        const hostBindingsMode = isHostStylingActive(sourceIndex);
        /** @type {?} */
        const cellIndex = index + 4 /* BindingsStartOffset */ + sourceIndex;
        context[cellIndex] = bindingValue;
        /** @type {?} */
        const updatedBitMask = getGuardMask(context, index, hostBindingsMode) | (1 << bitIndex);
        setGuardMask(context, index, updatedBitMask, hostBindingsMode);
    }
    else if (bindingValue !== null && getDefaultValue(context, index) === null) {
        setDefaultValue(context, index, bindingValue);
    }
}
/**
 * Registers a new column into the provided `TStylingContext`.
 *
 * If and when a new source is detected then a new column needs to
 * be allocated into the styling context. The column is basically
 * a new allocation of binding sources that will be available to each
 * property.
 *
 * Each column that exists in the styling context resembles a styling
 * source. A styling source an either be the template or one or more
 * components or directives all containing styling host bindings.
 * @param {?} context
 * @return {?}
 */
function addNewSourceColumn(context) {
    // we use -1 here because we want to insert right before the last value (the default value)
    /** @type {?} */
    const insertOffset = 4 /* BindingsStartOffset */ + getValuesCount(context) - 1;
    /** @type {?} */
    let index = 3 /* ValuesStartPosition */;
    while (index < context.length) {
        index += insertOffset;
        context.splice(index++, 0, DEFAULT_BINDING_INDEX);
        // the value was inserted just before the default value, but the
        // next entry in the context starts just after it. Therefore++.
        index++;
    }
    context[1 /* TotalSourcesPosition */]++;
}
/**
 * Applies all pending style and class bindings to the provided element.
 *
 * This function will attempt to flush styling via the provided `classesContext`
 * and `stylesContext` context values. This function is designed to be run from
 * the internal `stylingApply` function (which is scheduled to run at the very
 * end of change detection for an element if one or more style/class bindings
 * were processed) and will rely on any state values that are set from when
 * any of the styling bindings executed.
 *
 * This function is designed to be called twice: one when change detection has
 * processed an element within the template bindings (i.e. just as `advance()`
 * is called) and when host bindings have been processed. In both cases the
 * styles and classes in both contexts will be applied to the element, but the
 * algorithm will selectively decide which bindings to run depending on the
 * columns in the context. The provided `directiveIndex` value will help the
 * algorithm determine which bindings to apply: either the template bindings or
 * the host bindings (see `applyStylingToElement` for more information).
 *
 * Note that once this function is called all temporary styling state data
 * (i.e. the `bitMask` and `counter` values for styles and classes will be cleared).
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
    const state = getStylingState(element, directiveIndex);
    /** @type {?} */
    const hostBindingsMode = isHostStylingActive(state.sourceIndex);
    if (stylesContext) {
        if (!isContextLocked(stylesContext, hostBindingsMode)) {
            lockAndFinalizeContext(stylesContext, hostBindingsMode);
        }
        if (state.stylesBitMask !== 0) {
            applyStylingViaContext(stylesContext, renderer, element, data, state.stylesBitMask, setStyle, styleSanitizer, hostBindingsMode);
        }
    }
    if (classesContext) {
        if (!isContextLocked(classesContext, hostBindingsMode)) {
            lockAndFinalizeContext(classesContext, hostBindingsMode);
        }
        if (state.classesBitMask !== 0) {
            applyStylingViaContext(classesContext, renderer, element, data, state.classesBitMask, setClass, null, hostBindingsMode);
        }
    }
    resetStylingState();
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
 *
 * Note that the `TStylingContext` styling context contains two locks: one for template bindings
 * and another for host bindings. Either one of these locks will be set when styling is applied
 * during the template binding flush and/or during the host bindings flush.
 * @param {?} context
 * @param {?} hostBindingsMode
 * @return {?}
 */
function lockAndFinalizeContext(context, hostBindingsMode) {
    /** @type {?} */
    const initialValues = (/** @type {?} */ (getStylingMapArray(context)));
    updateInitialStylingOnContext(context, initialValues);
    lockContext(context, hostBindingsMode);
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
    // `-1` is used here because all initial styling data is not a apart
    // of a binding (since it's static)
    /** @type {?} */
    const COUNT_ID_FOR_STYLING = -1;
    /** @type {?} */
    let hasInitialStyling = false;
    for (let i = 1 /* ValuesStartPosition */; i < initialStyling.length; i += 2 /* TupleSize */) {
        /** @type {?} */
        const value = getMapValue(initialStyling, i);
        if (value) {
            /** @type {?} */
            const prop = getMapProp(initialStyling, i);
            registerBinding(context, COUNT_ID_FOR_STYLING, 0, prop, value, false);
            hasInitialStyling = true;
        }
    }
    if (hasInitialStyling) {
        patchConfig(context, 8 /* HasInitialStyling */);
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
 * Visit `styling/map_based_bindings.ts` to learn more about how the
 * algorithm works for map-based styling bindings.
 *
 * Note that this function is not designed to be called in isolation (use
 * the `flushStyling` function so that it can call this function for both
 * the styles and classes contexts).
 * @param {?} context
 * @param {?} renderer
 * @param {?} element
 * @param {?} bindingData
 * @param {?} bitMaskValue
 * @param {?} applyStylingFn
 * @param {?} sanitizer
 * @param {?} hostBindingsMode
 * @return {?}
 */
export function applyStylingViaContext(context, renderer, element, bindingData, bitMaskValue, applyStylingFn, sanitizer, hostBindingsMode) {
    /** @type {?} */
    const bitMask = normalizeBitMaskValue(bitMaskValue);
    /** @type {?} */
    let stylingMapsSyncFn = null;
    /** @type {?} */
    let applyAllValues = false;
    if (hasConfig(context, 2 /* HasMapBindings */)) {
        stylingMapsSyncFn = getStylingMapsSyncFn();
        /** @type {?} */
        const mapsGuardMask = getGuardMask(context, 3 /* ValuesStartPosition */, hostBindingsMode);
        applyAllValues = (bitMask & mapsGuardMask) !== 0;
    }
    /** @type {?} */
    const valuesCount = getValuesCount(context);
    /** @type {?} */
    let totalBindingsToVisit = 1;
    /** @type {?} */
    let mapsMode = applyAllValues ? 1 /* ApplyAllValues */ : 0 /* TraverseValues */;
    if (hostBindingsMode) {
        mapsMode |= 8 /* RecurseInnerMaps */;
        totalBindingsToVisit = valuesCount - 1;
    }
    /** @type {?} */
    let i = getPropValuesStartPosition(context);
    while (i < context.length) {
        /** @type {?} */
        const guardMask = getGuardMask(context, i, hostBindingsMode);
        if (bitMask & guardMask) {
            /** @type {?} */
            let valueApplied = false;
            /** @type {?} */
            const prop = getProp(context, i);
            /** @type {?} */
            const defaultValue = getDefaultValue(context, i);
            // Part 1: Visit the `[styling.prop]` value
            for (let j = 0; j < totalBindingsToVisit; j++) {
                /** @type {?} */
                const bindingIndex = (/** @type {?} */ (getBindingValue(context, i, j)));
                if (!valueApplied && bindingIndex !== 0) {
                    /** @type {?} */
                    const value = getValue(bindingData, bindingIndex);
                    if (isStylingValueDefined(value)) {
                        /** @type {?} */
                        const checkValueOnly = hostBindingsMode && j === 0;
                        if (!checkValueOnly) {
                            /** @type {?} */
                            const finalValue = sanitizer && isSanitizationRequired(context, i) ?
                                sanitizer(prop, value, 2 /* SanitizeOnly */) :
                                unwrapSafeValue(value);
                            applyStylingFn(renderer, element, prop, finalValue, bindingIndex);
                        }
                        valueApplied = true;
                    }
                }
                // Part 2: Visit the `[style]` or `[class]` map-based value
                if (stylingMapsSyncFn) {
                    // determine whether or not to apply the target property or to skip it
                    /** @type {?} */
                    let mode = mapsMode | (valueApplied ? 4 /* SkipTargetProp */ :
                        2 /* ApplyTargetProp */);
                    if (hostBindingsMode && j === 0) {
                        mode |= 16 /* CheckValuesOnly */;
                    }
                    /** @type {?} */
                    const valueAppliedWithinMap = stylingMapsSyncFn(context, renderer, element, bindingData, j, applyStylingFn, sanitizer, mode, prop, defaultValue);
                    valueApplied = valueApplied || valueAppliedWithinMap;
                }
            }
            // Part 3: apply the default value (e.g. `<div style="width:200">` => `200px` gets applied)
            // if the value has not yet been applied then a truthy value does not exist in the
            // prop-based or map-based bindings code. If and when this happens, just apply the
            // default value (even if the default value is `null`).
            if (!valueApplied) {
                applyStylingFn(renderer, element, prop, defaultValue);
            }
        }
        i += 4 /* BindingsStartOffset */ + valuesCount;
    }
    // the map-based styling entries may have not applied all their
    // values. For this reason, one more call to the sync function
    // needs to be issued at the end.
    if (stylingMapsSyncFn) {
        if (hostBindingsMode) {
            mapsMode |= 16 /* CheckValuesOnly */;
        }
        stylingMapsSyncFn(context, renderer, element, bindingData, 0, applyStylingFn, sanitizer, mapsMode);
    }
}
/**
 * Applies the provided styling map to the element directly (without context resolution).
 *
 * This function is designed to be run from the styling instructions and will be called
 * automatically. This function is intended to be used for performance reasons in the
 * event that there is no need to apply styling via context resolution.
 *
 * See `allowDirectStylingApply`.
 *
 * @param {?} renderer
 * @param {?} context
 * @param {?} element
 * @param {?} data
 * @param {?} bindingIndex
 * @param {?} map
 * @param {?} applyFn
 * @param {?=} sanitizer
 * @param {?=} forceUpdate
 * @return {?} whether or not the styling map was applied to the element.
 */
export function applyStylingMapDirectly(renderer, context, element, data, bindingIndex, map, applyFn, sanitizer, forceUpdate) {
    if (forceUpdate || hasValueChanged(data[bindingIndex], map)) {
        setValue(data, bindingIndex, map);
        for (let i = 1 /* ValuesStartPosition */; i < map.length; i += 2 /* TupleSize */) {
            /** @type {?} */
            const prop = getMapProp(map, i);
            /** @type {?} */
            const value = getMapValue(map, i);
            applyStylingValue(renderer, context, element, prop, value, applyFn, bindingIndex, sanitizer);
        }
        return true;
    }
    return false;
}
/**
 * Applies the provided styling prop/value to the element directly (without context resolution).
 *
 * This function is designed to be run from the styling instructions and will be called
 * automatically. This function is intended to be used for performance reasons in the
 * event that there is no need to apply styling via context resolution.
 *
 * See `allowDirectStylingApply`.
 *
 * @param {?} renderer
 * @param {?} context
 * @param {?} element
 * @param {?} data
 * @param {?} bindingIndex
 * @param {?} prop
 * @param {?} value
 * @param {?} applyFn
 * @param {?=} sanitizer
 * @return {?} whether or not the prop/value styling was applied to the element.
 */
export function applyStylingValueDirectly(renderer, context, element, data, bindingIndex, prop, value, applyFn, sanitizer) {
    if (hasValueChanged(data[bindingIndex], value)) {
        setValue(data, bindingIndex, value);
        applyStylingValue(renderer, context, element, prop, value, applyFn, bindingIndex, sanitizer);
        return true;
    }
    return false;
}
/**
 * @param {?} renderer
 * @param {?} context
 * @param {?} element
 * @param {?} prop
 * @param {?} value
 * @param {?} applyFn
 * @param {?} bindingIndex
 * @param {?=} sanitizer
 * @return {?}
 */
function applyStylingValue(renderer, context, element, prop, value, applyFn, bindingIndex, sanitizer) {
    /** @type {?} */
    let valueToApply = unwrapSafeValue(value);
    if (isStylingValueDefined(valueToApply)) {
        valueToApply =
            sanitizer ? sanitizer(prop, value, 2 /* SanitizeOnly */) : valueToApply;
    }
    else if (hasConfig(context, 8 /* HasInitialStyling */)) {
        /** @type {?} */
        const initialStyles = getStylingMapArray(context);
        if (initialStyles) {
            valueToApply = findInitialStylingValue(initialStyles, prop);
        }
    }
    applyFn(renderer, element, prop, valueToApply, bindingIndex);
}
/**
 * @param {?} map
 * @param {?} prop
 * @return {?}
 */
function findInitialStylingValue(map, prop) {
    for (let i = 1 /* ValuesStartPosition */; i < map.length; i += 2 /* TupleSize */) {
        /** @type {?} */
        const p = getMapProp(map, i);
        if (p >= prop) {
            return p === prop ? getMapValue(map, i) : null;
        }
    }
    return null;
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
export const setStyle = (/**
 * @param {?} renderer
 * @param {?} native
 * @param {?} prop
 * @param {?} value
 * @return {?}
 */
(renderer, native, prop, value) => {
    if (renderer !== null) {
        if (value) {
            // opacity, z-index and flexbox all have number values
            // and these need to be converted into strings so that
            // they can be assigned properly.
            value = value.toString();
            ngDevMode && ngDevMode.rendererSetStyle++;
            if (isProceduralRenderer(renderer)) {
                renderer.setStyle(native, prop, value, RendererStyleFlags3.DashCase);
            }
            else {
                // The reason why native style may be `null` is either because
                // it's a container element or it's a part of a test
                // environment that doesn't have styling. In either
                // case it's safe not to apply styling to the element.
                /** @type {?} */
                const nativeStyle = native.style;
                if (nativeStyle != null) {
                    nativeStyle.setProperty(prop, value);
                }
            }
        }
        else {
            ngDevMode && ngDevMode.rendererRemoveStyle++;
            if (isProceduralRenderer(renderer)) {
                renderer.removeStyle(native, prop, RendererStyleFlags3.DashCase);
            }
            else {
                /** @type {?} */
                const nativeStyle = native.style;
                if (nativeStyle != null) {
                    nativeStyle.removeProperty(prop);
                }
            }
        }
    }
});
/**
 * Adds/removes the provided className value to the provided element.
 * @type {?}
 */
export const setClass = (/**
 * @param {?} renderer
 * @param {?} native
 * @param {?} className
 * @param {?} value
 * @return {?}
 */
(renderer, native, className, value) => {
    if (renderer !== null && className !== '') {
        if (value) {
            ngDevMode && ngDevMode.rendererAddClass++;
            if (isProceduralRenderer(renderer)) {
                renderer.addClass(native, className);
            }
            else {
                // the reason why classList may be `null` is either because
                // it's a container element or it's a part of a test
                // environment that doesn't have styling. In either
                // case it's safe not to apply styling to the element.
                /** @type {?} */
                const classList = native.classList;
                if (classList != null) {
                    classList.add(className);
                }
            }
        }
        else {
            ngDevMode && ngDevMode.rendererRemoveClass++;
            if (isProceduralRenderer(renderer)) {
                renderer.removeClass(native, className);
            }
            else {
                /** @type {?} */
                const classList = native.classList;
                if (classList != null) {
                    classList.remove(className);
                }
            }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmluZGluZ3MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL3N0eWxpbmcvYmluZGluZ3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFPQSxPQUFPLEVBQVksZUFBZSxFQUFDLE1BQU0sMkJBQTJCLENBQUM7QUFFckUsT0FBTyxFQUEyQyxtQkFBbUIsRUFBRSxvQkFBb0IsRUFBQyxNQUFNLHdCQUF3QixDQUFDO0FBRTNILE9BQU8sRUFBQyxTQUFTLEVBQUMsTUFBTSxXQUFXLENBQUM7QUFDcEMsT0FBTyxFQUFDLHFCQUFxQixFQUFFLHFCQUFxQixFQUFFLHdCQUF3QixFQUFFLHlCQUF5QixFQUFFLGVBQWUsRUFBRSxTQUFTLEVBQUUsZUFBZSxFQUFFLFlBQVksRUFBRSxVQUFVLEVBQUUsV0FBVyxFQUFFLE9BQU8sRUFBRSwwQkFBMEIsRUFBRSxrQkFBa0IsRUFBRSxlQUFlLEVBQUUsUUFBUSxFQUFFLGNBQWMsRUFBRSxTQUFTLEVBQUUsZUFBZSxFQUFFLGVBQWUsRUFBRSxtQkFBbUIsRUFBRSxzQkFBc0IsRUFBRSxxQkFBcUIsRUFBRSxXQUFXLEVBQUUsV0FBVyxFQUFFLGVBQWUsRUFBRSxZQUFZLEVBQUUsYUFBYSxFQUFFLFFBQVEsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBRW5nQixPQUFPLEVBQUMsZUFBZSxFQUFFLGlCQUFpQixFQUFDLE1BQU0sU0FBUyxDQUFDOzs7Ozs7O01BNEJyRCw2QkFBNkIsR0FBRyxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQVl2QyxNQUFNLFVBQVUscUJBQXFCLENBQ2pDLE9BQXdCLEVBQUUsSUFBa0IsRUFBRSxPQUFpQixFQUFFLGNBQXNCLEVBQ3ZGLElBQW1CLEVBQUUsWUFBb0IsRUFDekMsS0FBd0UsRUFDeEUsV0FBcUI7O1VBQ2pCLFVBQVUsR0FBRyxDQUFDLElBQUk7O1VBQ2xCLEtBQUssR0FB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QUFJLEVBQUU7b0JBQ3JCLFNBQVMsQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLENBQUM7aUJBQzdCO2FBQ0Y7U0FDRjtLQUNGO0FBQ0gsQ0FBQyxDQUFBOzs7Ozs7Ozs7Ozs7Ozs7QUFXTCxNQUFNLFVBQVUsZ0JBQWdCLENBQzVCLFFBQW1CLEVBQUUsT0FBaUIsRUFBRSxhQUF1RCxFQUMvRixZQUFxQjs7VUFDakIsYUFBYSxHQUFHLGtCQUFrQixDQUFDLGFBQWEsQ0FBQztJQUN2RCxJQUFJLGFBQWEsRUFBRTtRQUNqQixLQUFLLElBQUksQ0FBQyw4QkFBMkMsRUFBRSxDQUFDLEdBQUcsYUFBYSxDQUFDLE1BQU0sRUFDMUUsQ0FBQyxxQkFBa0MsRUFBRTs7a0JBQ2xDLElBQUksR0FBRyxVQUFVLENBQUMsYUFBYSxFQUFFLENBQUMsQ0FBQzs7a0JBQ25DLEtBQUssR0FBRyxXQUFXLENBQUMsYUFBYSxFQUFFLENBQUMsQ0FBQztZQUMzQyxJQUFJLFlBQVksRUFBRTtnQkFDaEIsUUFBUSxDQUFDLFFBQVEsRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxJQUFJLENBQUMsQ0FBQzthQUNoRDtpQkFBTTtnQkFDTCxRQUFRLENBQUMsUUFBUSxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLElBQUksQ0FBQyxDQUFDO2FBQ2hEO1NBQ0Y7S0FDRjtBQUNILENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiogQGxpY2Vuc2VcbiogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4qXG4qIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4qIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiovXG5pbXBvcnQge1NhZmVWYWx1ZSwgdW53cmFwU2FmZVZhbHVlfSBmcm9tICcuLi8uLi9zYW5pdGl6YXRpb24vYnlwYXNzJztcbmltcG9ydCB7U3R5bGVTYW5pdGl6ZUZuLCBTdHlsZVNhbml0aXplTW9kZX0gZnJvbSAnLi4vLi4vc2FuaXRpemF0aW9uL3N0eWxlX3Nhbml0aXplcic7XG5pbXBvcnQge1Byb2NlZHVyYWxSZW5kZXJlcjMsIFJFbGVtZW50LCBSZW5kZXJlcjMsIFJlbmRlcmVyU3R5bGVGbGFnczMsIGlzUHJvY2VkdXJhbFJlbmRlcmVyfSBmcm9tICcuLi9pbnRlcmZhY2VzL3JlbmRlcmVyJztcbmltcG9ydCB7QXBwbHlTdHlsaW5nRm4sIExTdHlsaW5nRGF0YSwgU3R5bGluZ01hcEFycmF5LCBTdHlsaW5nTWFwQXJyYXlJbmRleCwgU3R5bGluZ01hcHNTeW5jTW9kZSwgU3luY1N0eWxpbmdNYXBzRm4sIFRTdHlsaW5nQ29uZmlnLCBUU3R5bGluZ0NvbnRleHQsIFRTdHlsaW5nQ29udGV4dEluZGV4LCBUU3R5bGluZ0NvbnRleHRQcm9wQ29uZmlnRmxhZ3N9IGZyb20gJy4uL2ludGVyZmFjZXMvc3R5bGluZyc7XG5pbXBvcnQge05PX0NIQU5HRX0gZnJvbSAnLi4vdG9rZW5zJztcbmltcG9ydCB7REVGQVVMVF9CSU5ESU5HX0lOREVYLCBERUZBVUxUX0JJTkRJTkdfVkFMVUUsIERFRkFVTFRfR1VBUkRfTUFTS19WQUxVRSwgTUFQX0JBU0VEX0VOVFJZX1BST1BfTkFNRSwgZ2V0QmluZGluZ1ZhbHVlLCBnZXRDb25maWcsIGdldERlZmF1bHRWYWx1ZSwgZ2V0R3VhcmRNYXNrLCBnZXRNYXBQcm9wLCBnZXRNYXBWYWx1ZSwgZ2V0UHJvcCwgZ2V0UHJvcFZhbHVlc1N0YXJ0UG9zaXRpb24sIGdldFN0eWxpbmdNYXBBcnJheSwgZ2V0VG90YWxTb3VyY2VzLCBnZXRWYWx1ZSwgZ2V0VmFsdWVzQ291bnQsIGhhc0NvbmZpZywgaGFzVmFsdWVDaGFuZ2VkLCBpc0NvbnRleHRMb2NrZWQsIGlzSG9zdFN0eWxpbmdBY3RpdmUsIGlzU2FuaXRpemF0aW9uUmVxdWlyZWQsIGlzU3R5bGluZ1ZhbHVlRGVmaW5lZCwgbG9ja0NvbnRleHQsIHBhdGNoQ29uZmlnLCBzZXREZWZhdWx0VmFsdWUsIHNldEd1YXJkTWFzaywgc2V0TWFwQXNEaXJ0eSwgc2V0VmFsdWV9IGZyb20gJy4uL3V0aWwvc3R5bGluZ191dGlscyc7XG5cbmltcG9ydCB7Z2V0U3R5bGluZ1N0YXRlLCByZXNldFN0eWxpbmdTdGF0ZX0gZnJvbSAnLi9zdGF0ZSc7XG5cblxuXG4vKipcbiAqIC0tLS0tLS0tXG4gKlxuICogVGhpcyBmaWxlIGNvbnRhaW5zIHRoZSBjb3JlIGxvZ2ljIGZvciBzdHlsaW5nIGluIEFuZ3VsYXIuXG4gKlxuICogQWxsIHN0eWxpbmcgYmluZGluZ3MgKGkuZS4gYFtzdHlsZV1gLCBgW3N0eWxlLnByb3BdYCwgYFtjbGFzc11gIGFuZCBgW2NsYXNzLm5hbWVdYClcbiAqIHdpbGwgaGF2ZSB0aGVpciB2YWx1ZXMgYmUgYXBwbGllZCB0aHJvdWdoIHRoZSBsb2dpYyBpbiB0aGlzIGZpbGUuXG4gKlxuICogV2hlbiBhIGJpbmRpbmcgaXMgZW5jb3VudGVyZWQgKGUuZy4gYDxkaXYgW3N0eWxlLndpZHRoXT1cIndcIj5gKSB0aGVuXG4gKiB0aGUgYmluZGluZyBkYXRhIHdpbGwgYmUgcG9wdWxhdGVkIGludG8gYSBgVFN0eWxpbmdDb250ZXh0YCBkYXRhLXN0cnVjdHVyZS5cbiAqIFRoZXJlIGlzIG9ubHkgb25lIGBUU3R5bGluZ0NvbnRleHRgIHBlciBgVE5vZGVgIGFuZCBlYWNoIGVsZW1lbnQgaW5zdGFuY2VcbiAqIHdpbGwgdXBkYXRlIGl0cyBzdHlsZS9jbGFzcyBiaW5kaW5nIHZhbHVlcyBpbiBjb25jZXJ0IHdpdGggdGhlIHN0eWxpbmdcbiAqIGNvbnRleHQuXG4gKlxuICogVG8gbGVhcm4gbW9yZSBhYm91dCB0aGUgYWxnb3JpdGhtIHNlZSBgVFN0eWxpbmdDb250ZXh0YC5cbiAqXG4gKiAtLS0tLS0tLVxuICovXG5cbi8qKlxuICogVGhlIGd1YXJkL3VwZGF0ZSBtYXNrIGJpdCBpbmRleCBsb2NhdGlvbiBmb3IgbWFwLWJhc2VkIGJpbmRpbmdzLlxuICpcbiAqIEFsbCBtYXAtYmFzZWQgYmluZGluZ3MgKGkuZS4gYFtzdHlsZV1gIGFuZCBgW2NsYXNzXWAgKVxuICovXG5jb25zdCBTVFlMSU5HX0lOREVYX0ZPUl9NQVBfQklORElORyA9IDA7XG5cbi8qKlxuICogVmlzaXRzIGEgY2xhc3MtYmFzZWQgYmluZGluZyBhbmQgdXBkYXRlcyB0aGUgbmV3IHZhbHVlIChpZiBjaGFuZ2VkKS5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIGlzIGNhbGxlZCBlYWNoIHRpbWUgYSBjbGFzcy1iYXNlZCBzdHlsaW5nIGluc3RydWN0aW9uXG4gKiBpcyBleGVjdXRlZC4gSXQncyBpbXBvcnRhbnQgdGhhdCBpdCdzIGFsd2F5cyBjYWxsZWQgKGV2ZW4gaWYgdGhlIHZhbHVlXG4gKiBoYXMgbm90IGNoYW5nZWQpIHNvIHRoYXQgdGhlIGlubmVyIGNvdW50ZXIgaW5kZXggdmFsdWUgaXMgaW5jcmVtZW50ZWQuXG4gKiBUaGlzIHdheSwgZWFjaCBpbnN0cnVjdGlvbiBpcyBhbHdheXMgZ3VhcmFudGVlZCB0byBnZXQgdGhlIHNhbWUgY291bnRlclxuICogc3RhdGUgZWFjaCB0aW1lIGl0J3MgY2FsbGVkICh3aGljaCB0aGVuIGFsbG93cyB0aGUgYFRTdHlsaW5nQ29udGV4dGBcbiAqIGFuZCB0aGUgYml0IG1hc2sgdmFsdWVzIHRvIGJlIGluIHN5bmMpLlxuICovXG5leHBvcnQgZnVuY3Rpb24gdXBkYXRlQ2xhc3NWaWFDb250ZXh0KFxuICAgIGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCwgZGF0YTogTFN0eWxpbmdEYXRhLCBlbGVtZW50OiBSRWxlbWVudCwgZGlyZWN0aXZlSW5kZXg6IG51bWJlcixcbiAgICBwcm9wOiBzdHJpbmcgfCBudWxsLCBiaW5kaW5nSW5kZXg6IG51bWJlcixcbiAgICB2YWx1ZTogYm9vbGVhbiB8IHN0cmluZyB8IG51bGwgfCB1bmRlZmluZWQgfCBTdHlsaW5nTWFwQXJyYXkgfCBOT19DSEFOR0UsXG4gICAgZm9yY2VVcGRhdGU/OiBib29sZWFuKTogYm9vbGVhbiB7XG4gIGNvbnN0IGlzTWFwQmFzZWQgPSAhcHJvcDtcbiAgY29uc3Qgc3RhdGUgPSBnZXRTdHlsaW5nU3RhdGUoZWxlbWVudCwgZGlyZWN0aXZlSW5kZXgpO1xuICBjb25zdCBjb3VudEluZGV4ID0gaXNNYXBCYXNlZCA/IFNUWUxJTkdfSU5ERVhfRk9SX01BUF9CSU5ESU5HIDogc3RhdGUuY2xhc3Nlc0luZGV4Kys7XG4gIGlmICh2YWx1ZSAhPT0gTk9fQ0hBTkdFKSB7XG4gICAgY29uc3QgdXBkYXRlZCA9IHVwZGF0ZUJpbmRpbmdEYXRhKFxuICAgICAgICBjb250ZXh0LCBkYXRhLCBjb3VudEluZGV4LCBzdGF0ZS5zb3VyY2VJbmRleCwgcHJvcCwgYmluZGluZ0luZGV4LCB2YWx1ZSwgZm9yY2VVcGRhdGUsXG4gICAgICAgIGZhbHNlKTtcbiAgICBpZiAodXBkYXRlZCB8fCBmb3JjZVVwZGF0ZSkge1xuICAgICAgLy8gV2UgZmxpcCB0aGUgYml0IGluIHRoZSBiaXRNYXNrIHRvIHJlZmxlY3QgdGhhdCB0aGUgYmluZGluZ1xuICAgICAgLy8gYXQgdGhlIGBpbmRleGAgc2xvdCBoYXMgY2hhbmdlZC4gVGhpcyBpZGVudGlmaWVzIHRvIHRoZSBmbHVzaGluZ1xuICAgICAgLy8gcGhhc2UgdGhhdCB0aGUgYmluZGluZ3MgZm9yIHRoaXMgcGFydGljdWxhciBDU1MgY2xhc3MgbmVlZCB0byBiZVxuICAgICAgLy8gYXBwbGllZCBhZ2FpbiBiZWNhdXNlIG9uIG9yIG1vcmUgb2YgdGhlIGJpbmRpbmdzIGZvciB0aGUgQ1NTXG4gICAgICAvLyBjbGFzcyBoYXZlIGNoYW5nZWQuXG4gICAgICBzdGF0ZS5jbGFzc2VzQml0TWFzayB8PSAxIDw8IGNvdW50SW5kZXg7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG4vKipcbiAqIFZpc2l0cyBhIHN0eWxlLWJhc2VkIGJpbmRpbmcgYW5kIHVwZGF0ZXMgdGhlIG5ldyB2YWx1ZSAoaWYgY2hhbmdlZCkuXG4gKlxuICogVGhpcyBmdW5jdGlvbiBpcyBjYWxsZWQgZWFjaCB0aW1lIGEgc3R5bGUtYmFzZWQgc3R5bGluZyBpbnN0cnVjdGlvblxuICogaXMgZXhlY3V0ZWQuIEl0J3MgaW1wb3J0YW50IHRoYXQgaXQncyBhbHdheXMgY2FsbGVkIChldmVuIGlmIHRoZSB2YWx1ZVxuICogaGFzIG5vdCBjaGFuZ2VkKSBzbyB0aGF0IHRoZSBpbm5lciBjb3VudGVyIGluZGV4IHZhbHVlIGlzIGluY3JlbWVudGVkLlxuICogVGhpcyB3YXksIGVhY2ggaW5zdHJ1Y3Rpb24gaXMgYWx3YXlzIGd1YXJhbnRlZWQgdG8gZ2V0IHRoZSBzYW1lIGNvdW50ZXJcbiAqIHN0YXRlIGVhY2ggdGltZSBpdCdzIGNhbGxlZCAod2hpY2ggdGhlbiBhbGxvd3MgdGhlIGBUU3R5bGluZ0NvbnRleHRgXG4gKiBhbmQgdGhlIGJpdCBtYXNrIHZhbHVlcyB0byBiZSBpbiBzeW5jKS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHVwZGF0ZVN0eWxlVmlhQ29udGV4dChcbiAgICBjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQsIGRhdGE6IExTdHlsaW5nRGF0YSwgZWxlbWVudDogUkVsZW1lbnQsIGRpcmVjdGl2ZUluZGV4OiBudW1iZXIsXG4gICAgcHJvcDogc3RyaW5nIHwgbnVsbCwgYmluZGluZ0luZGV4OiBudW1iZXIsXG4gICAgdmFsdWU6IHN0cmluZyB8IG51bWJlciB8IFNhZmVWYWx1ZSB8IG51bGwgfCB1bmRlZmluZWQgfCBTdHlsaW5nTWFwQXJyYXkgfCBOT19DSEFOR0UsXG4gICAgc2FuaXRpemVyOiBTdHlsZVNhbml0aXplRm4gfCBudWxsLCBmb3JjZVVwZGF0ZT86IGJvb2xlYW4pOiBib29sZWFuIHtcbiAgY29uc3QgaXNNYXBCYXNlZCA9ICFwcm9wO1xuICBjb25zdCBzdGF0ZSA9IGdldFN0eWxpbmdTdGF0ZShlbGVtZW50LCBkaXJlY3RpdmVJbmRleCk7XG4gIGNvbnN0IGNvdW50SW5kZXggPSBpc01hcEJhc2VkID8gU1RZTElOR19JTkRFWF9GT1JfTUFQX0JJTkRJTkcgOiBzdGF0ZS5zdHlsZXNJbmRleCsrO1xuICBpZiAodmFsdWUgIT09IE5PX0NIQU5HRSkge1xuICAgIGNvbnN0IHNhbml0aXphdGlvblJlcXVpcmVkID0gaXNNYXBCYXNlZCA/XG4gICAgICAgIHRydWUgOlxuICAgICAgICAoc2FuaXRpemVyID8gc2FuaXRpemVyKHByb3AgISwgbnVsbCwgU3R5bGVTYW5pdGl6ZU1vZGUuVmFsaWRhdGVQcm9wZXJ0eSkgOiBmYWxzZSk7XG4gICAgY29uc3QgdXBkYXRlZCA9IHVwZGF0ZUJpbmRpbmdEYXRhKFxuICAgICAgICBjb250ZXh0LCBkYXRhLCBjb3VudEluZGV4LCBzdGF0ZS5zb3VyY2VJbmRleCwgcHJvcCwgYmluZGluZ0luZGV4LCB2YWx1ZSwgZm9yY2VVcGRhdGUsXG4gICAgICAgIHNhbml0aXphdGlvblJlcXVpcmVkKTtcbiAgICBpZiAodXBkYXRlZCB8fCBmb3JjZVVwZGF0ZSkge1xuICAgICAgLy8gV2UgZmxpcCB0aGUgYml0IGluIHRoZSBiaXRNYXNrIHRvIHJlZmxlY3QgdGhhdCB0aGUgYmluZGluZ1xuICAgICAgLy8gYXQgdGhlIGBpbmRleGAgc2xvdCBoYXMgY2hhbmdlZC4gVGhpcyBpZGVudGlmaWVzIHRvIHRoZSBmbHVzaGluZ1xuICAgICAgLy8gcGhhc2UgdGhhdCB0aGUgYmluZGluZ3MgZm9yIHRoaXMgcGFydGljdWxhciBwcm9wZXJ0eSBuZWVkIHRvIGJlXG4gICAgICAvLyBhcHBsaWVkIGFnYWluIGJlY2F1c2Ugb24gb3IgbW9yZSBvZiB0aGUgYmluZGluZ3MgZm9yIHRoZSBDU1NcbiAgICAgIC8vIHByb3BlcnR5IGhhdmUgY2hhbmdlZC5cbiAgICAgIHN0YXRlLnN0eWxlc0JpdE1hc2sgfD0gMSA8PCBjb3VudEluZGV4O1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9XG4gIHJldHVybiBmYWxzZTtcbn1cblxuLyoqXG4gKiBDYWxsZWQgZWFjaCB0aW1lIGEgYmluZGluZyB2YWx1ZSBoYXMgY2hhbmdlZCB3aXRoaW4gdGhlIHByb3ZpZGVkIGBUU3R5bGluZ0NvbnRleHRgLlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gaXMgZGVzaWduZWQgdG8gYmUgY2FsbGVkIGZyb20gYHVwZGF0ZVN0eWxlQmluZGluZ2AgYW5kIGB1cGRhdGVDbGFzc0JpbmRpbmdgLlxuICogSWYgY2FsbGVkIGR1cmluZyB0aGUgZmlyc3QgdXBkYXRlIHBhc3MsIHRoZSBiaW5kaW5nIHdpbGwgYmUgcmVnaXN0ZXJlZCBpbiB0aGUgY29udGV4dC5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIHdpbGwgYWxzbyB1cGRhdGUgYmluZGluZyBzbG90IGluIHRoZSBwcm92aWRlZCBgTFN0eWxpbmdEYXRhYCB3aXRoIHRoZVxuICogbmV3IGJpbmRpbmcgZW50cnkgKGlmIGl0IGhhcyBjaGFuZ2VkKS5cbiAqXG4gKiBAcmV0dXJucyB3aGV0aGVyIG9yIG5vdCB0aGUgYmluZGluZyB2YWx1ZSB3YXMgdXBkYXRlZCBpbiB0aGUgYExTdHlsaW5nRGF0YWAuXG4gKi9cbmZ1bmN0aW9uIHVwZGF0ZUJpbmRpbmdEYXRhKFxuICAgIGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCwgZGF0YTogTFN0eWxpbmdEYXRhLCBjb3VudGVySW5kZXg6IG51bWJlciwgc291cmNlSW5kZXg6IG51bWJlcixcbiAgICBwcm9wOiBzdHJpbmcgfCBudWxsLCBiaW5kaW5nSW5kZXg6IG51bWJlcixcbiAgICB2YWx1ZTogc3RyaW5nIHwgU2FmZVZhbHVlIHwgbnVtYmVyIHwgYm9vbGVhbiB8IG51bGwgfCB1bmRlZmluZWQgfCBTdHlsaW5nTWFwQXJyYXksXG4gICAgZm9yY2VVcGRhdGU/OiBib29sZWFuLCBzYW5pdGl6YXRpb25SZXF1aXJlZD86IGJvb2xlYW4pOiBib29sZWFuIHtcbiAgY29uc3QgaG9zdEJpbmRpbmdzTW9kZSA9IGlzSG9zdFN0eWxpbmdBY3RpdmUoc291cmNlSW5kZXgpO1xuICBpZiAoIWlzQ29udGV4dExvY2tlZChjb250ZXh0LCBob3N0QmluZGluZ3NNb2RlKSkge1xuICAgIC8vIHRoaXMgd2lsbCBvbmx5IGhhcHBlbiBkdXJpbmcgdGhlIGZpcnN0IHVwZGF0ZSBwYXNzIG9mIHRoZVxuICAgIC8vIGNvbnRleHQuIFRoZSByZWFzb24gd2h5IHdlIGNhbid0IHVzZSBgdE5vZGUuZmlyc3RUZW1wbGF0ZVBhc3NgXG4gICAgLy8gaGVyZSBpcyBiZWNhdXNlIGl0cyBub3QgZ3VhcmFudGVlZCB0byBiZSB0cnVlIHdoZW4gdGhlIGZpcnN0XG4gICAgLy8gdXBkYXRlIHBhc3MgaXMgZXhlY3V0ZWQgKHJlbWVtYmVyIHRoYXQgYWxsIHN0eWxpbmcgaW5zdHJ1Y3Rpb25zXG4gICAgLy8gYXJlIHJ1biBpbiB0aGUgdXBkYXRlIHBoYXNlLCBhbmQsIGFzIGEgcmVzdWx0LCBhcmUgbm8gbW9yZVxuICAgIC8vIHN0eWxpbmcgaW5zdHJ1Y3Rpb25zIHRoYXQgYXJlIHJ1biBpbiB0aGUgY3JlYXRpb24gcGhhc2UpLlxuICAgIHJlZ2lzdGVyQmluZGluZyhjb250ZXh0LCBjb3VudGVySW5kZXgsIHNvdXJjZUluZGV4LCBwcm9wLCBiaW5kaW5nSW5kZXgsIHNhbml0aXphdGlvblJlcXVpcmVkKTtcbiAgICBwYXRjaENvbmZpZyhcbiAgICAgICAgY29udGV4dCxcbiAgICAgICAgaG9zdEJpbmRpbmdzTW9kZSA/IFRTdHlsaW5nQ29uZmlnLkhhc0hvc3RCaW5kaW5ncyA6IFRTdHlsaW5nQ29uZmlnLkhhc1RlbXBsYXRlQmluZGluZ3MpO1xuICAgIHBhdGNoQ29uZmlnKGNvbnRleHQsIHByb3AgPyBUU3R5bGluZ0NvbmZpZy5IYXNQcm9wQmluZGluZ3MgOiBUU3R5bGluZ0NvbmZpZy5IYXNNYXBCaW5kaW5ncyk7XG4gIH1cblxuICBjb25zdCBjaGFuZ2VkID0gZm9yY2VVcGRhdGUgfHwgaGFzVmFsdWVDaGFuZ2VkKGRhdGFbYmluZGluZ0luZGV4XSwgdmFsdWUpO1xuICBpZiAoY2hhbmdlZCkge1xuICAgIHNldFZhbHVlKGRhdGEsIGJpbmRpbmdJbmRleCwgdmFsdWUpO1xuICAgIGNvbnN0IGRvU2V0VmFsdWVzQXNTdGFsZSA9IChnZXRDb25maWcoY29udGV4dCkgJiBUU3R5bGluZ0NvbmZpZy5IYXNIb3N0QmluZGluZ3MpICYmXG4gICAgICAgICFob3N0QmluZGluZ3NNb2RlICYmIChwcm9wID8gIXZhbHVlIDogdHJ1ZSk7XG4gICAgaWYgKGRvU2V0VmFsdWVzQXNTdGFsZSkge1xuICAgICAgcmVuZGVySG9zdEJpbmRpbmdzQXNTdGFsZShjb250ZXh0LCBkYXRhLCBwcm9wLCAhcHJvcCk7XG4gICAgfVxuICB9XG4gIHJldHVybiBjaGFuZ2VkO1xufVxuXG4vKipcbiAqIEl0ZXJhdGVzIG92ZXIgYWxsIGhvc3QtYmluZGluZyB2YWx1ZXMgZm9yIHRoZSBnaXZlbiBgcHJvcGAgdmFsdWUgaW4gdGhlIGNvbnRleHQgYW5kIHNldHMgdGhlaXJcbiAqIGNvcnJlc3BvbmRpbmcgYmluZGluZyB2YWx1ZXMgdG8gYG51bGxgLlxuICpcbiAqIFdoZW5ldmVyIGEgdGVtcGxhdGUgYmluZGluZyBjaGFuZ2VzIGl0cyB2YWx1ZSB0byBgbnVsbGAsIGFsbCBob3N0LWJpbmRpbmcgdmFsdWVzIHNob3VsZCBiZVxuICogcmUtYXBwbGllZFxuICogdG8gdGhlIGVsZW1lbnQgd2hlbiB0aGUgaG9zdCBiaW5kaW5ncyBhcmUgZXZhbHVhdGVkLiBUaGlzIG1heSBub3QgYWx3YXlzIGhhcHBlbiBpbiB0aGUgZXZlbnRcbiAqIHRoYXQgbm9uZSBvZiB0aGUgYmluZGluZ3MgY2hhbmdlZCB3aXRoaW4gdGhlIGhvc3QgYmluZGluZ3MgY29kZS4gRm9yIHRoaXMgcmVhc29uIHRoaXMgZnVuY3Rpb25cbiAqIGlzIGV4cGVjdGVkIHRvIGJlIGNhbGxlZCBlYWNoIHRpbWUgYSB0ZW1wbGF0ZSBiaW5kaW5nIGJlY29tZXMgZmFsc3kgb3Igd2hlbiBhIG1hcC1iYXNlZCB0ZW1wbGF0ZVxuICogYmluZGluZyBjaGFuZ2VzLlxuICovXG5mdW5jdGlvbiByZW5kZXJIb3N0QmluZGluZ3NBc1N0YWxlKFxuICAgIGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCwgZGF0YTogTFN0eWxpbmdEYXRhLCBwcm9wOiBzdHJpbmcgfCBudWxsLCBpc01hcEJhc2VkOiBib29sZWFuKTogdm9pZCB7XG4gIGNvbnN0IHZhbHVlc0NvdW50ID0gZ2V0VmFsdWVzQ291bnQoY29udGV4dCk7XG5cbiAgaWYgKGhhc0NvbmZpZyhjb250ZXh0LCBUU3R5bGluZ0NvbmZpZy5IYXNQcm9wQmluZGluZ3MpKSB7XG4gICAgY29uc3QgaXRlbXNQZXJSb3cgPSBUU3R5bGluZ0NvbnRleHRJbmRleC5CaW5kaW5nc1N0YXJ0T2Zmc2V0ICsgdmFsdWVzQ291bnQ7XG5cbiAgICBsZXQgaSA9IFRTdHlsaW5nQ29udGV4dEluZGV4LlZhbHVlc1N0YXJ0UG9zaXRpb247XG4gICAgd2hpbGUgKGkgPCBjb250ZXh0Lmxlbmd0aCkge1xuICAgICAgaWYgKGdldFByb3AoY29udGV4dCwgaSkgPT09IHByb3ApIHtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBpICs9IGl0ZW1zUGVyUm93O1xuICAgIH1cblxuICAgIGNvbnN0IGJpbmRpbmdzU3RhcnQgPSBpICsgVFN0eWxpbmdDb250ZXh0SW5kZXguQmluZGluZ3NTdGFydE9mZnNldDtcbiAgICBjb25zdCB2YWx1ZXNTdGFydCA9IGJpbmRpbmdzU3RhcnQgKyAxOyAgLy8gdGhlIGZpcnN0IGNvbHVtbiBpcyB0ZW1wbGF0ZSBiaW5kaW5nc1xuICAgIGNvbnN0IHZhbHVlc0VuZCA9IGJpbmRpbmdzU3RhcnQgKyB2YWx1ZXNDb3VudCAtIDE7XG5cbiAgICBmb3IgKGxldCBpID0gdmFsdWVzU3RhcnQ7IGkgPCB2YWx1ZXNFbmQ7IGkrKykge1xuICAgICAgY29uc3QgYmluZGluZ0luZGV4ID0gY29udGV4dFtpXSBhcyBudW1iZXI7XG4gICAgICBpZiAoYmluZGluZ0luZGV4ICE9PSAwKSB7XG4gICAgICAgIHNldFZhbHVlKGRhdGEsIGJpbmRpbmdJbmRleCwgbnVsbCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgaWYgKGhhc0NvbmZpZyhjb250ZXh0LCBUU3R5bGluZ0NvbmZpZy5IYXNNYXBCaW5kaW5ncykpIHtcbiAgICBjb25zdCBiaW5kaW5nc1N0YXJ0ID1cbiAgICAgICAgVFN0eWxpbmdDb250ZXh0SW5kZXguVmFsdWVzU3RhcnRQb3NpdGlvbiArIFRTdHlsaW5nQ29udGV4dEluZGV4LkJpbmRpbmdzU3RhcnRPZmZzZXQ7XG4gICAgY29uc3QgdmFsdWVzU3RhcnQgPSBiaW5kaW5nc1N0YXJ0ICsgMTsgIC8vIHRoZSBmaXJzdCBjb2x1bW4gaXMgdGVtcGxhdGUgYmluZGluZ3NcbiAgICBjb25zdCB2YWx1ZXNFbmQgPSBiaW5kaW5nc1N0YXJ0ICsgdmFsdWVzQ291bnQgLSAxO1xuICAgIGZvciAobGV0IGkgPSB2YWx1ZXNTdGFydDsgaSA8IHZhbHVlc0VuZDsgaSsrKSB7XG4gICAgICBjb25zdCBzdHlsaW5nTWFwID0gZ2V0VmFsdWU8U3R5bGluZ01hcEFycmF5PihkYXRhLCBjb250ZXh0W2ldIGFzIG51bWJlcik7XG4gICAgICBpZiAoc3R5bGluZ01hcCkge1xuICAgICAgICBzZXRNYXBBc0RpcnR5KHN0eWxpbmdNYXApO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIFJlZ2lzdGVycyB0aGUgcHJvdmlkZWQgYmluZGluZyAocHJvcCArIGJpbmRpbmdJbmRleCkgaW50byB0aGUgY29udGV4dC5cbiAqXG4gKiBJdCBpcyBuZWVkZWQgYmVjYXVzZSBpdCB3aWxsIGVpdGhlciB1cGRhdGUgb3IgaW5zZXJ0IGEgc3R5bGluZyBwcm9wZXJ0eVxuICogaW50byB0aGUgY29udGV4dCBhdCB0aGUgY29ycmVjdCBzcG90LlxuICpcbiAqIFdoZW4gY2FsbGVkLCBvbmUgb2YgdHdvIHRoaW5ncyB3aWxsIGhhcHBlbjpcbiAqXG4gKiAxKSBJZiB0aGUgcHJvcGVydHkgYWxyZWFkeSBleGlzdHMgaW4gdGhlIGNvbnRleHQgdGhlbiBpdCB3aWxsIGp1c3QgYWRkXG4gKiAgICB0aGUgcHJvdmlkZWQgYGJpbmRpbmdWYWx1ZWAgdG8gdGhlIGVuZCBvZiB0aGUgYmluZGluZyBzb3VyY2VzIHJlZ2lvblxuICogICAgZm9yIHRoYXQgcGFydGljdWxhciBwcm9wZXJ0eS5cbiAqXG4gKiAgICAtIElmIHRoZSBiaW5kaW5nIHZhbHVlIGlzIGEgbnVtYmVyIHRoZW4gaXQgd2lsbCBiZSBhZGRlZCBhcyBhIG5ld1xuICogICAgICBiaW5kaW5nIGluZGV4IHNvdXJjZSBuZXh0IHRvIHRoZSBvdGhlciBiaW5kaW5nIHNvdXJjZXMgZm9yIHRoZSBwcm9wZXJ0eS5cbiAqXG4gKiAgICAtIE90aGVyd2lzZSwgaWYgdGhlIGJpbmRpbmcgdmFsdWUgaXMgYSBzdHJpbmcvYm9vbGVhbi9udWxsIHR5cGUgdGhlbiBpdCB3aWxsXG4gKiAgICAgIHJlcGxhY2UgdGhlIGRlZmF1bHQgdmFsdWUgZm9yIHRoZSBwcm9wZXJ0eSBpZiB0aGUgZGVmYXVsdCB2YWx1ZSBpcyBgbnVsbGAuXG4gKlxuICogMikgSWYgdGhlIHByb3BlcnR5IGRvZXMgbm90IGV4aXN0IHRoZW4gaXQgd2lsbCBiZSBpbnNlcnRlZCBpbnRvIHRoZSBjb250ZXh0LlxuICogICAgVGhlIHN0eWxpbmcgY29udGV4dCByZWxpZXMgb24gYWxsIHByb3BlcnRpZXMgYmVpbmcgc3RvcmVkIGluIGFscGhhYmV0aWNhbFxuICogICAgb3JkZXIsIHNvIGl0IGtub3dzIGV4YWN0bHkgd2hlcmUgdG8gc3RvcmUgaXQuXG4gKlxuICogICAgV2hlbiBpbnNlcnRlZCwgYSBkZWZhdWx0IGBudWxsYCB2YWx1ZSBpcyBjcmVhdGVkIGZvciB0aGUgcHJvcGVydHkgd2hpY2ggZXhpc3RzXG4gKiAgICBhcyB0aGUgZGVmYXVsdCB2YWx1ZSBmb3IgdGhlIGJpbmRpbmcuIElmIHRoZSBiaW5kaW5nVmFsdWUgcHJvcGVydHkgaXMgaW5zZXJ0ZWRcbiAqICAgIGFuZCBpdCBpcyBlaXRoZXIgYSBzdHJpbmcsIG51bWJlciBvciBudWxsIHZhbHVlIHRoZW4gdGhhdCB3aWxsIHJlcGxhY2UgdGhlIGRlZmF1bHRcbiAqICAgIHZhbHVlLlxuICpcbiAqIE5vdGUgdGhhdCB0aGlzIGZ1bmN0aW9uIGlzIGFsc28gdXNlZCBmb3IgbWFwLWJhc2VkIHN0eWxpbmcgYmluZGluZ3MuIFRoZXkgYXJlIHRyZWF0ZWRcbiAqIG11Y2ggdGhlIHNhbWUgYXMgcHJvcC1iYXNlZCBiaW5kaW5ncywgYnV0LCB0aGVpciBwcm9wZXJ0eSBuYW1lIHZhbHVlIGlzIHNldCBhcyBgW01BUF1gLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVnaXN0ZXJCaW5kaW5nKFxuICAgIGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCwgY291bnRJZDogbnVtYmVyLCBzb3VyY2VJbmRleDogbnVtYmVyLCBwcm9wOiBzdHJpbmcgfCBudWxsLFxuICAgIGJpbmRpbmdWYWx1ZTogbnVtYmVyIHwgbnVsbCB8IHN0cmluZyB8IGJvb2xlYW4sIHNhbml0aXphdGlvblJlcXVpcmVkPzogYm9vbGVhbik6IHZvaWQge1xuICBsZXQgZm91bmQgPSBmYWxzZTtcbiAgcHJvcCA9IHByb3AgfHwgTUFQX0JBU0VEX0VOVFJZX1BST1BfTkFNRTtcblxuICBsZXQgdG90YWxTb3VyY2VzID0gZ2V0VG90YWxTb3VyY2VzKGNvbnRleHQpO1xuXG4gIC8vIGlmIGEgbmV3IHNvdXJjZSBpcyBkZXRlY3RlZCB0aGVuIGEgbmV3IGNvbHVtbiBuZWVkcyB0byBiZSBhbGxvY2F0ZWQgaW50b1xuICAvLyB0aGUgc3R5bGluZyBjb250ZXh0LiBUaGUgY29sdW1uIGlzIGJhc2ljYWxseSBhIG5ldyBhbGxvY2F0aW9uIG9mIGJpbmRpbmdcbiAgLy8gc291cmNlcyB0aGF0IHdpbGwgYmUgYXZhaWxhYmxlIHRvIGVhY2ggcHJvcGVydHkuXG4gIHdoaWxlICh0b3RhbFNvdXJjZXMgPD0gc291cmNlSW5kZXgpIHtcbiAgICBhZGROZXdTb3VyY2VDb2x1bW4oY29udGV4dCk7XG4gICAgdG90YWxTb3VyY2VzKys7XG4gIH1cblxuICBjb25zdCBpc0JpbmRpbmdJbmRleFZhbHVlID0gdHlwZW9mIGJpbmRpbmdWYWx1ZSA9PT0gJ251bWJlcic7XG4gIGNvbnN0IGVudHJpZXNQZXJSb3cgPSBUU3R5bGluZ0NvbnRleHRJbmRleC5CaW5kaW5nc1N0YXJ0T2Zmc2V0ICsgZ2V0VmFsdWVzQ291bnQoY29udGV4dCk7XG4gIGxldCBpID0gVFN0eWxpbmdDb250ZXh0SW5kZXguVmFsdWVzU3RhcnRQb3NpdGlvbjtcblxuICAvLyBhbGwgc3R5bGUvY2xhc3MgYmluZGluZ3MgYXJlIHNvcnRlZCBieSBwcm9wZXJ0eSBuYW1lXG4gIHdoaWxlIChpIDwgY29udGV4dC5sZW5ndGgpIHtcbiAgICBjb25zdCBwID0gZ2V0UHJvcChjb250ZXh0LCBpKTtcbiAgICBpZiAocHJvcCA8PSBwKSB7XG4gICAgICBpZiAocHJvcCA8IHApIHtcbiAgICAgICAgYWxsb2NhdGVOZXdDb250ZXh0RW50cnkoY29udGV4dCwgaSwgcHJvcCwgc2FuaXRpemF0aW9uUmVxdWlyZWQpO1xuICAgICAgfSBlbHNlIGlmIChpc0JpbmRpbmdJbmRleFZhbHVlKSB7XG4gICAgICAgIHBhdGNoQ29uZmlnKGNvbnRleHQsIFRTdHlsaW5nQ29uZmlnLkhhc0NvbGxpc2lvbnMpO1xuICAgICAgfVxuICAgICAgYWRkQmluZGluZ0ludG9Db250ZXh0KGNvbnRleHQsIGksIGJpbmRpbmdWYWx1ZSwgY291bnRJZCwgc291cmNlSW5kZXgpO1xuICAgICAgZm91bmQgPSB0cnVlO1xuICAgICAgYnJlYWs7XG4gICAgfVxuICAgIGkgKz0gZW50cmllc1BlclJvdztcbiAgfVxuXG4gIGlmICghZm91bmQpIHtcbiAgICBhbGxvY2F0ZU5ld0NvbnRleHRFbnRyeShjb250ZXh0LCBjb250ZXh0Lmxlbmd0aCwgcHJvcCwgc2FuaXRpemF0aW9uUmVxdWlyZWQpO1xuICAgIGFkZEJpbmRpbmdJbnRvQ29udGV4dChjb250ZXh0LCBpLCBiaW5kaW5nVmFsdWUsIGNvdW50SWQsIHNvdXJjZUluZGV4KTtcbiAgfVxufVxuXG4vKipcbiAqIEluc2VydHMgYSBuZXcgcm93IGludG8gdGhlIHByb3ZpZGVkIGBUU3R5bGluZ0NvbnRleHRgIGFuZCBhc3NpZ25zIHRoZSBwcm92aWRlZCBgcHJvcGAgdmFsdWUgYXNcbiAqIHRoZSBwcm9wZXJ0eSBlbnRyeS5cbiAqL1xuZnVuY3Rpb24gYWxsb2NhdGVOZXdDb250ZXh0RW50cnkoXG4gICAgY29udGV4dDogVFN0eWxpbmdDb250ZXh0LCBpbmRleDogbnVtYmVyLCBwcm9wOiBzdHJpbmcsIHNhbml0aXphdGlvblJlcXVpcmVkPzogYm9vbGVhbik6IHZvaWQge1xuICBjb25zdCBjb25maWcgPSBzYW5pdGl6YXRpb25SZXF1aXJlZCA/IFRTdHlsaW5nQ29udGV4dFByb3BDb25maWdGbGFncy5TYW5pdGl6YXRpb25SZXF1aXJlZCA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgVFN0eWxpbmdDb250ZXh0UHJvcENvbmZpZ0ZsYWdzLkRlZmF1bHQ7XG4gIGNvbnRleHQuc3BsaWNlKFxuICAgICAgaW5kZXgsIDAsXG4gICAgICBjb25maWcsICAgICAgICAgICAgICAgICAgICAvLyAxKSBjb25maWcgdmFsdWVcbiAgICAgIERFRkFVTFRfR1VBUkRfTUFTS19WQUxVRSwgIC8vIDIpIHRlbXBsYXRlIGJpdCBtYXNrXG4gICAgICBERUZBVUxUX0dVQVJEX01BU0tfVkFMVUUsICAvLyAzKSBob3N0IGJpbmRpbmdzIGJpdCBtYXNrXG4gICAgICBwcm9wLCAgICAgICAgICAgICAgICAgICAgICAvLyA0KSBwcm9wIHZhbHVlIChlLmcuIGB3aWR0aGAsIGBteUNsYXNzYCwgZXRjLi4uKVxuICAgICAgKTtcblxuICBpbmRleCArPSA0OyAgLy8gdGhlIDQgdmFsdWVzIGFib3ZlXG5cbiAgLy8gNS4uLikgZGVmYXVsdCBiaW5kaW5nIGluZGV4IGZvciB0aGUgdGVtcGxhdGUgdmFsdWVcbiAgLy8gZGVwZW5kaW5nIG9uIGhvdyBtYW55IHNvdXJjZXMgYWxyZWFkeSBleGlzdCBpbiB0aGUgY29udGV4dCxcbiAgLy8gbXVsdGlwbGUgZGVmYXVsdCBpbmRleCBlbnRyaWVzIG1heSBuZWVkIHRvIGJlIGluc2VydGVkIGZvclxuICAvLyB0aGUgbmV3IHZhbHVlIGluIHRoZSBjb250ZXh0LlxuICBjb25zdCB0b3RhbEJpbmRpbmdzUGVyRW50cnkgPSBnZXRUb3RhbFNvdXJjZXMoY29udGV4dCk7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgdG90YWxCaW5kaW5nc1BlckVudHJ5OyBpKyspIHtcbiAgICBjb250ZXh0LnNwbGljZShpbmRleCwgMCwgREVGQVVMVF9CSU5ESU5HX0lOREVYKTtcbiAgICBpbmRleCsrO1xuICB9XG5cbiAgLy8gNikgZGVmYXVsdCBiaW5kaW5nIHZhbHVlIGZvciB0aGUgbmV3IGVudHJ5XG4gIGNvbnRleHQuc3BsaWNlKGluZGV4LCAwLCBERUZBVUxUX0JJTkRJTkdfVkFMVUUpO1xufVxuXG4vKipcbiAqIEluc2VydHMgYSBuZXcgYmluZGluZyB2YWx1ZSBpbnRvIGEgc3R5bGluZyBwcm9wZXJ0eSB0dXBsZSBpbiB0aGUgYFRTdHlsaW5nQ29udGV4dGAuXG4gKlxuICogQSBiaW5kaW5nVmFsdWUgaXMgaW5zZXJ0ZWQgaW50byBhIGNvbnRleHQgZHVyaW5nIHRoZSBmaXJzdCB1cGRhdGUgcGFzc1xuICogb2YgYSB0ZW1wbGF0ZSBvciBob3N0IGJpbmRpbmdzIGZ1bmN0aW9uLiBXaGVuIHRoaXMgb2NjdXJzLCB0d28gdGhpbmdzXG4gKiBoYXBwZW46XG4gKlxuICogLSBJZiB0aGUgYmluZGluZ1ZhbHVlIHZhbHVlIGlzIGEgbnVtYmVyIHRoZW4gaXQgaXMgdHJlYXRlZCBhcyBhIGJpbmRpbmdJbmRleFxuICogICB2YWx1ZSAoYSBpbmRleCBpbiB0aGUgYExWaWV3YCkgYW5kIGl0IHdpbGwgYmUgaW5zZXJ0ZWQgbmV4dCB0byB0aGUgb3RoZXJcbiAqICAgYmluZGluZyBpbmRleCBlbnRyaWVzLlxuICpcbiAqIC0gT3RoZXJ3aXNlIHRoZSBiaW5kaW5nIHZhbHVlIHdpbGwgdXBkYXRlIHRoZSBkZWZhdWx0IHZhbHVlIGZvciB0aGUgcHJvcGVydHlcbiAqICAgYW5kIHRoaXMgd2lsbCBvbmx5IGhhcHBlbiBpZiB0aGUgZGVmYXVsdCB2YWx1ZSBpcyBgbnVsbGAuXG4gKi9cbmZ1bmN0aW9uIGFkZEJpbmRpbmdJbnRvQ29udGV4dChcbiAgICBjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQsIGluZGV4OiBudW1iZXIsIGJpbmRpbmdWYWx1ZTogbnVtYmVyIHwgc3RyaW5nIHwgYm9vbGVhbiB8IG51bGwsXG4gICAgYml0SW5kZXg6IG51bWJlciwgc291cmNlSW5kZXg6IG51bWJlcikge1xuICBpZiAodHlwZW9mIGJpbmRpbmdWYWx1ZSA9PT0gJ251bWJlcicpIHtcbiAgICBjb25zdCBob3N0QmluZGluZ3NNb2RlID0gaXNIb3N0U3R5bGluZ0FjdGl2ZShzb3VyY2VJbmRleCk7XG4gICAgY29uc3QgY2VsbEluZGV4ID0gaW5kZXggKyBUU3R5bGluZ0NvbnRleHRJbmRleC5CaW5kaW5nc1N0YXJ0T2Zmc2V0ICsgc291cmNlSW5kZXg7XG4gICAgY29udGV4dFtjZWxsSW5kZXhdID0gYmluZGluZ1ZhbHVlO1xuICAgIGNvbnN0IHVwZGF0ZWRCaXRNYXNrID0gZ2V0R3VhcmRNYXNrKGNvbnRleHQsIGluZGV4LCBob3N0QmluZGluZ3NNb2RlKSB8ICgxIDw8IGJpdEluZGV4KTtcbiAgICBzZXRHdWFyZE1hc2soY29udGV4dCwgaW5kZXgsIHVwZGF0ZWRCaXRNYXNrLCBob3N0QmluZGluZ3NNb2RlKTtcbiAgfSBlbHNlIGlmIChiaW5kaW5nVmFsdWUgIT09IG51bGwgJiYgZ2V0RGVmYXVsdFZhbHVlKGNvbnRleHQsIGluZGV4KSA9PT0gbnVsbCkge1xuICAgIHNldERlZmF1bHRWYWx1ZShjb250ZXh0LCBpbmRleCwgYmluZGluZ1ZhbHVlKTtcbiAgfVxufVxuXG4vKipcbiAqIFJlZ2lzdGVycyBhIG5ldyBjb2x1bW4gaW50byB0aGUgcHJvdmlkZWQgYFRTdHlsaW5nQ29udGV4dGAuXG4gKlxuICogSWYgYW5kIHdoZW4gYSBuZXcgc291cmNlIGlzIGRldGVjdGVkIHRoZW4gYSBuZXcgY29sdW1uIG5lZWRzIHRvXG4gKiBiZSBhbGxvY2F0ZWQgaW50byB0aGUgc3R5bGluZyBjb250ZXh0LiBUaGUgY29sdW1uIGlzIGJhc2ljYWxseVxuICogYSBuZXcgYWxsb2NhdGlvbiBvZiBiaW5kaW5nIHNvdXJjZXMgdGhhdCB3aWxsIGJlIGF2YWlsYWJsZSB0byBlYWNoXG4gKiBwcm9wZXJ0eS5cbiAqXG4gKiBFYWNoIGNvbHVtbiB0aGF0IGV4aXN0cyBpbiB0aGUgc3R5bGluZyBjb250ZXh0IHJlc2VtYmxlcyBhIHN0eWxpbmdcbiAqIHNvdXJjZS4gQSBzdHlsaW5nIHNvdXJjZSBhbiBlaXRoZXIgYmUgdGhlIHRlbXBsYXRlIG9yIG9uZSBvciBtb3JlXG4gKiBjb21wb25lbnRzIG9yIGRpcmVjdGl2ZXMgYWxsIGNvbnRhaW5pbmcgc3R5bGluZyBob3N0IGJpbmRpbmdzLlxuICovXG5mdW5jdGlvbiBhZGROZXdTb3VyY2VDb2x1bW4oY29udGV4dDogVFN0eWxpbmdDb250ZXh0KTogdm9pZCB7XG4gIC8vIHdlIHVzZSAtMSBoZXJlIGJlY2F1c2Ugd2Ugd2FudCB0byBpbnNlcnQgcmlnaHQgYmVmb3JlIHRoZSBsYXN0IHZhbHVlICh0aGUgZGVmYXVsdCB2YWx1ZSlcbiAgY29uc3QgaW5zZXJ0T2Zmc2V0ID0gVFN0eWxpbmdDb250ZXh0SW5kZXguQmluZGluZ3NTdGFydE9mZnNldCArIGdldFZhbHVlc0NvdW50KGNvbnRleHQpIC0gMTtcblxuICBsZXQgaW5kZXggPSBUU3R5bGluZ0NvbnRleHRJbmRleC5WYWx1ZXNTdGFydFBvc2l0aW9uO1xuICB3aGlsZSAoaW5kZXggPCBjb250ZXh0Lmxlbmd0aCkge1xuICAgIGluZGV4ICs9IGluc2VydE9mZnNldDtcbiAgICBjb250ZXh0LnNwbGljZShpbmRleCsrLCAwLCBERUZBVUxUX0JJTkRJTkdfSU5ERVgpO1xuXG4gICAgLy8gdGhlIHZhbHVlIHdhcyBpbnNlcnRlZCBqdXN0IGJlZm9yZSB0aGUgZGVmYXVsdCB2YWx1ZSwgYnV0IHRoZVxuICAgIC8vIG5leHQgZW50cnkgaW4gdGhlIGNvbnRleHQgc3RhcnRzIGp1c3QgYWZ0ZXIgaXQuIFRoZXJlZm9yZSsrLlxuICAgIGluZGV4Kys7XG4gIH1cbiAgY29udGV4dFtUU3R5bGluZ0NvbnRleHRJbmRleC5Ub3RhbFNvdXJjZXNQb3NpdGlvbl0rKztcbn1cblxuLyoqXG4gKiBBcHBsaWVzIGFsbCBwZW5kaW5nIHN0eWxlIGFuZCBjbGFzcyBiaW5kaW5ncyB0byB0aGUgcHJvdmlkZWQgZWxlbWVudC5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIHdpbGwgYXR0ZW1wdCB0byBmbHVzaCBzdHlsaW5nIHZpYSB0aGUgcHJvdmlkZWQgYGNsYXNzZXNDb250ZXh0YFxuICogYW5kIGBzdHlsZXNDb250ZXh0YCBjb250ZXh0IHZhbHVlcy4gVGhpcyBmdW5jdGlvbiBpcyBkZXNpZ25lZCB0byBiZSBydW4gZnJvbVxuICogdGhlIGludGVybmFsIGBzdHlsaW5nQXBwbHlgIGZ1bmN0aW9uICh3aGljaCBpcyBzY2hlZHVsZWQgdG8gcnVuIGF0IHRoZSB2ZXJ5XG4gKiBlbmQgb2YgY2hhbmdlIGRldGVjdGlvbiBmb3IgYW4gZWxlbWVudCBpZiBvbmUgb3IgbW9yZSBzdHlsZS9jbGFzcyBiaW5kaW5nc1xuICogd2VyZSBwcm9jZXNzZWQpIGFuZCB3aWxsIHJlbHkgb24gYW55IHN0YXRlIHZhbHVlcyB0aGF0IGFyZSBzZXQgZnJvbSB3aGVuXG4gKiBhbnkgb2YgdGhlIHN0eWxpbmcgYmluZGluZ3MgZXhlY3V0ZWQuXG4gKlxuICogVGhpcyBmdW5jdGlvbiBpcyBkZXNpZ25lZCB0byBiZSBjYWxsZWQgdHdpY2U6IG9uZSB3aGVuIGNoYW5nZSBkZXRlY3Rpb24gaGFzXG4gKiBwcm9jZXNzZWQgYW4gZWxlbWVudCB3aXRoaW4gdGhlIHRlbXBsYXRlIGJpbmRpbmdzIChpLmUuIGp1c3QgYXMgYGFkdmFuY2UoKWBcbiAqIGlzIGNhbGxlZCkgYW5kIHdoZW4gaG9zdCBiaW5kaW5ncyBoYXZlIGJlZW4gcHJvY2Vzc2VkLiBJbiBib3RoIGNhc2VzIHRoZVxuICogc3R5bGVzIGFuZCBjbGFzc2VzIGluIGJvdGggY29udGV4dHMgd2lsbCBiZSBhcHBsaWVkIHRvIHRoZSBlbGVtZW50LCBidXQgdGhlXG4gKiBhbGdvcml0aG0gd2lsbCBzZWxlY3RpdmVseSBkZWNpZGUgd2hpY2ggYmluZGluZ3MgdG8gcnVuIGRlcGVuZGluZyBvbiB0aGVcbiAqIGNvbHVtbnMgaW4gdGhlIGNvbnRleHQuIFRoZSBwcm92aWRlZCBgZGlyZWN0aXZlSW5kZXhgIHZhbHVlIHdpbGwgaGVscCB0aGVcbiAqIGFsZ29yaXRobSBkZXRlcm1pbmUgd2hpY2ggYmluZGluZ3MgdG8gYXBwbHk6IGVpdGhlciB0aGUgdGVtcGxhdGUgYmluZGluZ3Mgb3JcbiAqIHRoZSBob3N0IGJpbmRpbmdzIChzZWUgYGFwcGx5U3R5bGluZ1RvRWxlbWVudGAgZm9yIG1vcmUgaW5mb3JtYXRpb24pLlxuICpcbiAqIE5vdGUgdGhhdCBvbmNlIHRoaXMgZnVuY3Rpb24gaXMgY2FsbGVkIGFsbCB0ZW1wb3Jhcnkgc3R5bGluZyBzdGF0ZSBkYXRhXG4gKiAoaS5lLiB0aGUgYGJpdE1hc2tgIGFuZCBgY291bnRlcmAgdmFsdWVzIGZvciBzdHlsZXMgYW5kIGNsYXNzZXMgd2lsbCBiZSBjbGVhcmVkKS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGZsdXNoU3R5bGluZyhcbiAgICByZW5kZXJlcjogUmVuZGVyZXIzIHwgUHJvY2VkdXJhbFJlbmRlcmVyMyB8IG51bGwsIGRhdGE6IExTdHlsaW5nRGF0YSxcbiAgICBjbGFzc2VzQ29udGV4dDogVFN0eWxpbmdDb250ZXh0IHwgbnVsbCwgc3R5bGVzQ29udGV4dDogVFN0eWxpbmdDb250ZXh0IHwgbnVsbCxcbiAgICBlbGVtZW50OiBSRWxlbWVudCwgZGlyZWN0aXZlSW5kZXg6IG51bWJlciwgc3R5bGVTYW5pdGl6ZXI6IFN0eWxlU2FuaXRpemVGbiB8IG51bGwpOiB2b2lkIHtcbiAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5mbHVzaFN0eWxpbmcrKztcblxuICBjb25zdCBzdGF0ZSA9IGdldFN0eWxpbmdTdGF0ZShlbGVtZW50LCBkaXJlY3RpdmVJbmRleCk7XG4gIGNvbnN0IGhvc3RCaW5kaW5nc01vZGUgPSBpc0hvc3RTdHlsaW5nQWN0aXZlKHN0YXRlLnNvdXJjZUluZGV4KTtcblxuICBpZiAoc3R5bGVzQ29udGV4dCkge1xuICAgIGlmICghaXNDb250ZXh0TG9ja2VkKHN0eWxlc0NvbnRleHQsIGhvc3RCaW5kaW5nc01vZGUpKSB7XG4gICAgICBsb2NrQW5kRmluYWxpemVDb250ZXh0KHN0eWxlc0NvbnRleHQsIGhvc3RCaW5kaW5nc01vZGUpO1xuICAgIH1cbiAgICBpZiAoc3RhdGUuc3R5bGVzQml0TWFzayAhPT0gMCkge1xuICAgICAgYXBwbHlTdHlsaW5nVmlhQ29udGV4dChcbiAgICAgICAgICBzdHlsZXNDb250ZXh0LCByZW5kZXJlciwgZWxlbWVudCwgZGF0YSwgc3RhdGUuc3R5bGVzQml0TWFzaywgc2V0U3R5bGUsIHN0eWxlU2FuaXRpemVyLFxuICAgICAgICAgIGhvc3RCaW5kaW5nc01vZGUpO1xuICAgIH1cbiAgfVxuXG4gIGlmIChjbGFzc2VzQ29udGV4dCkge1xuICAgIGlmICghaXNDb250ZXh0TG9ja2VkKGNsYXNzZXNDb250ZXh0LCBob3N0QmluZGluZ3NNb2RlKSkge1xuICAgICAgbG9ja0FuZEZpbmFsaXplQ29udGV4dChjbGFzc2VzQ29udGV4dCwgaG9zdEJpbmRpbmdzTW9kZSk7XG4gICAgfVxuICAgIGlmIChzdGF0ZS5jbGFzc2VzQml0TWFzayAhPT0gMCkge1xuICAgICAgYXBwbHlTdHlsaW5nVmlhQ29udGV4dChcbiAgICAgICAgICBjbGFzc2VzQ29udGV4dCwgcmVuZGVyZXIsIGVsZW1lbnQsIGRhdGEsIHN0YXRlLmNsYXNzZXNCaXRNYXNrLCBzZXRDbGFzcywgbnVsbCxcbiAgICAgICAgICBob3N0QmluZGluZ3NNb2RlKTtcbiAgICB9XG4gIH1cblxuICByZXNldFN0eWxpbmdTdGF0ZSgpO1xufVxuXG4vKipcbiAqIExvY2tzIHRoZSBjb250ZXh0IChzbyBubyBtb3JlIGJpbmRpbmdzIGNhbiBiZSBhZGRlZCkgYW5kIGFsc28gY29waWVzIG92ZXIgaW5pdGlhbCBjbGFzcy9zdHlsZVxuICogdmFsdWVzIGludG8gdGhlaXIgYmluZGluZyBhcmVhcy5cbiAqXG4gKiBUaGVyZSBhcmUgdHdvIG1haW4gYWN0aW9ucyB0aGF0IHRha2UgcGxhY2UgaW4gdGhpcyBmdW5jdGlvbjpcbiAqXG4gKiAtIExvY2tpbmcgdGhlIGNvbnRleHQ6XG4gKiAgIExvY2tpbmcgdGhlIGNvbnRleHQgaXMgcmVxdWlyZWQgc28gdGhhdCB0aGUgc3R5bGUvY2xhc3MgaW5zdHJ1Y3Rpb25zIGtub3cgTk9UIHRvXG4gKiAgIHJlZ2lzdGVyIGEgYmluZGluZyBhZ2FpbiBhZnRlciB0aGUgZmlyc3QgdXBkYXRlIHBhc3MgaGFzIHJ1bi4gSWYgYSBsb2NraW5nIGJpdCB3YXNcbiAqICAgbm90IHVzZWQgdGhlbiBpdCB3b3VsZCBuZWVkIHRvIHNjYW4gb3ZlciB0aGUgY29udGV4dCBlYWNoIHRpbWUgYW4gaW5zdHJ1Y3Rpb24gaXMgcnVuXG4gKiAgICh3aGljaCBpcyBleHBlbnNpdmUpLlxuICpcbiAqIC0gUGF0Y2hpbmcgaW5pdGlhbCB2YWx1ZXM6XG4gKiAgIERpcmVjdGl2ZXMgYW5kIGNvbXBvbmVudCBob3N0IGJpbmRpbmdzIG1heSBpbmNsdWRlIHN0YXRpYyBjbGFzcy9zdHlsZSB2YWx1ZXMgd2hpY2ggYXJlXG4gKiAgIGJvdW5kIHRvIHRoZSBob3N0IGVsZW1lbnQuIFdoZW4gdGhpcyBoYXBwZW5zLCB0aGUgc3R5bGluZyBjb250ZXh0IHdpbGwgbmVlZCB0byBiZSBpbmZvcm1lZFxuICogICBzbyBpdCBjYW4gdXNlIHRoZXNlIHN0YXRpYyBzdHlsaW5nIHZhbHVlcyBhcyBkZWZhdWx0cyB3aGVuIGEgbWF0Y2hpbmcgYmluZGluZyBpcyBmYWxzeS5cbiAqICAgVGhlc2UgaW5pdGlhbCBzdHlsaW5nIHZhbHVlcyBhcmUgcmVhZCBmcm9tIHRoZSBpbml0aWFsIHN0eWxpbmcgdmFsdWVzIHNsb3Qgd2l0aGluIHRoZVxuICogICBwcm92aWRlZCBgVFN0eWxpbmdDb250ZXh0YCAod2hpY2ggaXMgYW4gaW5zdGFuY2Ugb2YgYSBgU3R5bGluZ01hcEFycmF5YCkuIFRoaXMgaW5uZXIgbWFwIHdpbGxcbiAqICAgYmUgdXBkYXRlZCBlYWNoIHRpbWUgYSBob3N0IGJpbmRpbmcgYXBwbGllcyBpdHMgc3RhdGljIHN0eWxpbmcgdmFsdWVzICh2aWEgYGVsZW1lbnRIb3N0QXR0cnNgKVxuICogICBzbyB0aGVzZSB2YWx1ZXMgYXJlIG9ubHkgcmVhZCBhdCB0aGlzIHBvaW50IGJlY2F1c2UgdGhpcyBpcyB0aGUgdmVyeSBsYXN0IHBvaW50IGJlZm9yZSB0aGVcbiAqICAgZmlyc3Qgc3R5bGUvY2xhc3MgdmFsdWVzIGFyZSBmbHVzaGVkIHRvIHRoZSBlbGVtZW50LlxuICpcbiAqIE5vdGUgdGhhdCB0aGUgYFRTdHlsaW5nQ29udGV4dGAgc3R5bGluZyBjb250ZXh0IGNvbnRhaW5zIHR3byBsb2Nrczogb25lIGZvciB0ZW1wbGF0ZSBiaW5kaW5nc1xuICogYW5kIGFub3RoZXIgZm9yIGhvc3QgYmluZGluZ3MuIEVpdGhlciBvbmUgb2YgdGhlc2UgbG9ja3Mgd2lsbCBiZSBzZXQgd2hlbiBzdHlsaW5nIGlzIGFwcGxpZWRcbiAqIGR1cmluZyB0aGUgdGVtcGxhdGUgYmluZGluZyBmbHVzaCBhbmQvb3IgZHVyaW5nIHRoZSBob3N0IGJpbmRpbmdzIGZsdXNoLlxuICovXG5mdW5jdGlvbiBsb2NrQW5kRmluYWxpemVDb250ZXh0KGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCwgaG9zdEJpbmRpbmdzTW9kZTogYm9vbGVhbik6IHZvaWQge1xuICBjb25zdCBpbml0aWFsVmFsdWVzID0gZ2V0U3R5bGluZ01hcEFycmF5KGNvbnRleHQpICE7XG4gIHVwZGF0ZUluaXRpYWxTdHlsaW5nT25Db250ZXh0KGNvbnRleHQsIGluaXRpYWxWYWx1ZXMpO1xuICBsb2NrQ29udGV4dChjb250ZXh0LCBob3N0QmluZGluZ3NNb2RlKTtcbn1cblxuLyoqXG4gKiBSZWdpc3RlcnMgYWxsIGluaXRpYWwgc3R5bGluZyBlbnRyaWVzIGludG8gdGhlIHByb3ZpZGVkIGNvbnRleHQuXG4gKlxuICogVGhpcyBmdW5jdGlvbiB3aWxsIGl0ZXJhdGUgb3ZlciBhbGwgZW50cmllcyBpbiB0aGUgcHJvdmlkZWQgYGluaXRpYWxTdHlsaW5nYCBhcn1yYXkgYW5kIHJlZ2lzdGVyXG4gKiB0aGVtIGFzIGRlZmF1bHQgKGluaXRpYWwpIHZhbHVlcyBpbiB0aGUgcHJvdmlkZWQgY29udGV4dC4gSW5pdGlhbCBzdHlsaW5nIHZhbHVlcyBpbiBhIGNvbnRleHQgYXJlXG4gKiB0aGUgZGVmYXVsdCB2YWx1ZXMgdGhhdCBhcmUgdG8gYmUgYXBwbGllZCB1bmxlc3Mgb3ZlcndyaXR0ZW4gYnkgYSBiaW5kaW5nLlxuICpcbiAqIFRoZSByZWFzb24gd2h5IHRoaXMgZnVuY3Rpb24gZXhpc3RzIGFuZCBpc24ndCBhIHBhcnQgb2YgdGhlIGNvbnRleHQgY29uc3RydWN0aW9uIGlzIGJlY2F1c2VcbiAqIGhvc3QgYmluZGluZyBpcyBldmFsdWF0ZWQgYXQgYSBsYXRlciBzdGFnZSBhZnRlciB0aGUgZWxlbWVudCBpcyBjcmVhdGVkLiBUaGlzIG1lYW5zIHRoYXRcbiAqIGlmIGEgZGlyZWN0aXZlIG9yIGNvbXBvbmVudCBjb250YWlucyBhbnkgaW5pdGlhbCBzdHlsaW5nIGNvZGUgKGkuZS4gYDxkaXYgY2xhc3M9XCJmb29cIj5gKVxuICogdGhlbiB0aGF0IGluaXRpYWwgc3R5bGluZyBkYXRhIGNhbiBvbmx5IGJlIGFwcGxpZWQgb25jZSB0aGUgc3R5bGluZyBmb3IgdGhhdCBlbGVtZW50XG4gKiBpcyBmaXJzdCBhcHBsaWVkIChhdCB0aGUgZW5kIG9mIHRoZSB1cGRhdGUgcGhhc2UpLiBPbmNlIHRoYXQgaGFwcGVucyB0aGVuIHRoZSBjb250ZXh0IHdpbGxcbiAqIHVwZGF0ZSBpdHNlbGYgd2l0aCB0aGUgY29tcGxldGUgaW5pdGlhbCBzdHlsaW5nIGZvciB0aGUgZWxlbWVudC5cbiAqL1xuZnVuY3Rpb24gdXBkYXRlSW5pdGlhbFN0eWxpbmdPbkNvbnRleHQoXG4gICAgY29udGV4dDogVFN0eWxpbmdDb250ZXh0LCBpbml0aWFsU3R5bGluZzogU3R5bGluZ01hcEFycmF5KTogdm9pZCB7XG4gIC8vIGAtMWAgaXMgdXNlZCBoZXJlIGJlY2F1c2UgYWxsIGluaXRpYWwgc3R5bGluZyBkYXRhIGlzIG5vdCBhIGFwYXJ0XG4gIC8vIG9mIGEgYmluZGluZyAoc2luY2UgaXQncyBzdGF0aWMpXG4gIGNvbnN0IENPVU5UX0lEX0ZPUl9TVFlMSU5HID0gLTE7XG5cbiAgbGV0IGhhc0luaXRpYWxTdHlsaW5nID0gZmFsc2U7XG4gIGZvciAobGV0IGkgPSBTdHlsaW5nTWFwQXJyYXlJbmRleC5WYWx1ZXNTdGFydFBvc2l0aW9uOyBpIDwgaW5pdGlhbFN0eWxpbmcubGVuZ3RoO1xuICAgICAgIGkgKz0gU3R5bGluZ01hcEFycmF5SW5kZXguVHVwbGVTaXplKSB7XG4gICAgY29uc3QgdmFsdWUgPSBnZXRNYXBWYWx1ZShpbml0aWFsU3R5bGluZywgaSk7XG4gICAgaWYgKHZhbHVlKSB7XG4gICAgICBjb25zdCBwcm9wID0gZ2V0TWFwUHJvcChpbml0aWFsU3R5bGluZywgaSk7XG4gICAgICByZWdpc3RlckJpbmRpbmcoY29udGV4dCwgQ09VTlRfSURfRk9SX1NUWUxJTkcsIDAsIHByb3AsIHZhbHVlLCBmYWxzZSk7XG4gICAgICBoYXNJbml0aWFsU3R5bGluZyA9IHRydWU7XG4gICAgfVxuICB9XG5cbiAgaWYgKGhhc0luaXRpYWxTdHlsaW5nKSB7XG4gICAgcGF0Y2hDb25maWcoY29udGV4dCwgVFN0eWxpbmdDb25maWcuSGFzSW5pdGlhbFN0eWxpbmcpO1xuICB9XG59XG5cbi8qKlxuICogUnVucyB0aHJvdWdoIHRoZSBwcm92aWRlZCBzdHlsaW5nIGNvbnRleHQgYW5kIGFwcGxpZXMgZWFjaCB2YWx1ZSB0b1xuICogdGhlIHByb3ZpZGVkIGVsZW1lbnQgKHZpYSB0aGUgcmVuZGVyZXIpIGlmIG9uZSBvciBtb3JlIHZhbHVlcyBhcmUgcHJlc2VudC5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIHdpbGwgaXRlcmF0ZSBvdmVyIGFsbCBlbnRyaWVzIHByZXNlbnQgaW4gdGhlIHByb3ZpZGVkXG4gKiBgVFN0eWxpbmdDb250ZXh0YCBhcnJheSAoYm90aCBwcm9wLWJhc2VkIGFuZCBtYXAtYmFzZWQgYmluZGluZ3MpLi1cbiAqXG4gKiBFYWNoIGVudHJ5LCB3aXRoaW4gdGhlIGBUU3R5bGluZ0NvbnRleHRgIGFycmF5LCBpcyBzdG9yZWQgYWxwaGFiZXRpY2FsbHlcbiAqIGFuZCB0aGlzIG1lYW5zIHRoYXQgZWFjaCBwcm9wL3ZhbHVlIGVudHJ5IHdpbGwgYmUgYXBwbGllZCBpbiBvcmRlclxuICogKHNvIGxvbmcgYXMgaXQgaXMgbWFya2VkIGRpcnR5IGluIHRoZSBwcm92aWRlZCBgYml0TWFza2AgdmFsdWUpLlxuICpcbiAqIElmIHRoZXJlIGFyZSBhbnkgbWFwLWJhc2VkIGVudHJpZXMgcHJlc2VudCAod2hpY2ggYXJlIGFwcGxpZWQgdG8gdGhlXG4gKiBlbGVtZW50IHZpYSB0aGUgYFtzdHlsZV1gIGFuZCBgW2NsYXNzXWAgYmluZGluZ3MpIHRoZW4gdGhvc2UgZW50cmllc1xuICogd2lsbCBiZSBhcHBsaWVkIGFzIHdlbGwuIEhvd2V2ZXIsIHRoZSBjb2RlIGZvciB0aGF0IGlzIG5vdCBhIHBhcnQgb2ZcbiAqIHRoaXMgZnVuY3Rpb24uIEluc3RlYWQsIGVhY2ggdGltZSBhIHByb3BlcnR5IGlzIHZpc2l0ZWQsIHRoZW4gdGhlXG4gKiBjb2RlIGJlbG93IHdpbGwgY2FsbCBhbiBleHRlcm5hbCBmdW5jdGlvbiBjYWxsZWQgYHN0eWxpbmdNYXBzU3luY0ZuYFxuICogYW5kLCBpZiBwcmVzZW50LCBpdCB3aWxsIGtlZXAgdGhlIGFwcGxpY2F0aW9uIG9mIHN0eWxpbmcgdmFsdWVzIGluXG4gKiBtYXAtYmFzZWQgYmluZGluZ3MgdXAgdG8gc3luYyB3aXRoIHRoZSBhcHBsaWNhdGlvbiBvZiBwcm9wLWJhc2VkXG4gKiBiaW5kaW5ncy5cbiAqXG4gKiBWaXNpdCBgc3R5bGluZy9tYXBfYmFzZWRfYmluZGluZ3MudHNgIHRvIGxlYXJuIG1vcmUgYWJvdXQgaG93IHRoZVxuICogYWxnb3JpdGhtIHdvcmtzIGZvciBtYXAtYmFzZWQgc3R5bGluZyBiaW5kaW5ncy5cbiAqXG4gKiBOb3RlIHRoYXQgdGhpcyBmdW5jdGlvbiBpcyBub3QgZGVzaWduZWQgdG8gYmUgY2FsbGVkIGluIGlzb2xhdGlvbiAodXNlXG4gKiB0aGUgYGZsdXNoU3R5bGluZ2AgZnVuY3Rpb24gc28gdGhhdCBpdCBjYW4gY2FsbCB0aGlzIGZ1bmN0aW9uIGZvciBib3RoXG4gKiB0aGUgc3R5bGVzIGFuZCBjbGFzc2VzIGNvbnRleHRzKS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFwcGx5U3R5bGluZ1ZpYUNvbnRleHQoXG4gICAgY29udGV4dDogVFN0eWxpbmdDb250ZXh0LCByZW5kZXJlcjogUmVuZGVyZXIzIHwgUHJvY2VkdXJhbFJlbmRlcmVyMyB8IG51bGwsIGVsZW1lbnQ6IFJFbGVtZW50LFxuICAgIGJpbmRpbmdEYXRhOiBMU3R5bGluZ0RhdGEsIGJpdE1hc2tWYWx1ZTogbnVtYmVyIHwgYm9vbGVhbiwgYXBwbHlTdHlsaW5nRm46IEFwcGx5U3R5bGluZ0ZuLFxuICAgIHNhbml0aXplcjogU3R5bGVTYW5pdGl6ZUZuIHwgbnVsbCwgaG9zdEJpbmRpbmdzTW9kZTogYm9vbGVhbik6IHZvaWQge1xuICBjb25zdCBiaXRNYXNrID0gbm9ybWFsaXplQml0TWFza1ZhbHVlKGJpdE1hc2tWYWx1ZSk7XG5cbiAgbGV0IHN0eWxpbmdNYXBzU3luY0ZuOiBTeW5jU3R5bGluZ01hcHNGbnxudWxsID0gbnVsbDtcbiAgbGV0IGFwcGx5QWxsVmFsdWVzID0gZmFsc2U7XG4gIGlmIChoYXNDb25maWcoY29udGV4dCwgVFN0eWxpbmdDb25maWcuSGFzTWFwQmluZGluZ3MpKSB7XG4gICAgc3R5bGluZ01hcHNTeW5jRm4gPSBnZXRTdHlsaW5nTWFwc1N5bmNGbigpO1xuICAgIGNvbnN0IG1hcHNHdWFyZE1hc2sgPVxuICAgICAgICBnZXRHdWFyZE1hc2soY29udGV4dCwgVFN0eWxpbmdDb250ZXh0SW5kZXguVmFsdWVzU3RhcnRQb3NpdGlvbiwgaG9zdEJpbmRpbmdzTW9kZSk7XG4gICAgYXBwbHlBbGxWYWx1ZXMgPSAoYml0TWFzayAmIG1hcHNHdWFyZE1hc2spICE9PSAwO1xuICB9XG5cbiAgY29uc3QgdmFsdWVzQ291bnQgPSBnZXRWYWx1ZXNDb3VudChjb250ZXh0KTtcbiAgbGV0IHRvdGFsQmluZGluZ3NUb1Zpc2l0ID0gMTtcbiAgbGV0IG1hcHNNb2RlID1cbiAgICAgIGFwcGx5QWxsVmFsdWVzID8gU3R5bGluZ01hcHNTeW5jTW9kZS5BcHBseUFsbFZhbHVlcyA6IFN0eWxpbmdNYXBzU3luY01vZGUuVHJhdmVyc2VWYWx1ZXM7XG4gIGlmIChob3N0QmluZGluZ3NNb2RlKSB7XG4gICAgbWFwc01vZGUgfD0gU3R5bGluZ01hcHNTeW5jTW9kZS5SZWN1cnNlSW5uZXJNYXBzO1xuICAgIHRvdGFsQmluZGluZ3NUb1Zpc2l0ID0gdmFsdWVzQ291bnQgLSAxO1xuICB9XG5cbiAgbGV0IGkgPSBnZXRQcm9wVmFsdWVzU3RhcnRQb3NpdGlvbihjb250ZXh0KTtcbiAgd2hpbGUgKGkgPCBjb250ZXh0Lmxlbmd0aCkge1xuICAgIGNvbnN0IGd1YXJkTWFzayA9IGdldEd1YXJkTWFzayhjb250ZXh0LCBpLCBob3N0QmluZGluZ3NNb2RlKTtcbiAgICBpZiAoYml0TWFzayAmIGd1YXJkTWFzaykge1xuICAgICAgbGV0IHZhbHVlQXBwbGllZCA9IGZhbHNlO1xuICAgICAgY29uc3QgcHJvcCA9IGdldFByb3AoY29udGV4dCwgaSk7XG4gICAgICBjb25zdCBkZWZhdWx0VmFsdWUgPSBnZXREZWZhdWx0VmFsdWUoY29udGV4dCwgaSk7XG5cbiAgICAgIC8vIFBhcnQgMTogVmlzaXQgdGhlIGBbc3R5bGluZy5wcm9wXWAgdmFsdWVcbiAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgdG90YWxCaW5kaW5nc1RvVmlzaXQ7IGorKykge1xuICAgICAgICBjb25zdCBiaW5kaW5nSW5kZXggPSBnZXRCaW5kaW5nVmFsdWUoY29udGV4dCwgaSwgaikgYXMgbnVtYmVyO1xuICAgICAgICBpZiAoIXZhbHVlQXBwbGllZCAmJiBiaW5kaW5nSW5kZXggIT09IDApIHtcbiAgICAgICAgICBjb25zdCB2YWx1ZSA9IGdldFZhbHVlKGJpbmRpbmdEYXRhLCBiaW5kaW5nSW5kZXgpO1xuICAgICAgICAgIGlmIChpc1N0eWxpbmdWYWx1ZURlZmluZWQodmFsdWUpKSB7XG4gICAgICAgICAgICBjb25zdCBjaGVja1ZhbHVlT25seSA9IGhvc3RCaW5kaW5nc01vZGUgJiYgaiA9PT0gMDtcbiAgICAgICAgICAgIGlmICghY2hlY2tWYWx1ZU9ubHkpIHtcbiAgICAgICAgICAgICAgY29uc3QgZmluYWxWYWx1ZSA9IHNhbml0aXplciAmJiBpc1Nhbml0aXphdGlvblJlcXVpcmVkKGNvbnRleHQsIGkpID9cbiAgICAgICAgICAgICAgICAgIHNhbml0aXplcihwcm9wLCB2YWx1ZSwgU3R5bGVTYW5pdGl6ZU1vZGUuU2FuaXRpemVPbmx5KSA6XG4gICAgICAgICAgICAgICAgICB1bndyYXBTYWZlVmFsdWUodmFsdWUpO1xuICAgICAgICAgICAgICBhcHBseVN0eWxpbmdGbihyZW5kZXJlciwgZWxlbWVudCwgcHJvcCwgZmluYWxWYWx1ZSwgYmluZGluZ0luZGV4KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhbHVlQXBwbGllZCA9IHRydWU7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gUGFydCAyOiBWaXNpdCB0aGUgYFtzdHlsZV1gIG9yIGBbY2xhc3NdYCBtYXAtYmFzZWQgdmFsdWVcbiAgICAgICAgaWYgKHN0eWxpbmdNYXBzU3luY0ZuKSB7XG4gICAgICAgICAgLy8gZGV0ZXJtaW5lIHdoZXRoZXIgb3Igbm90IHRvIGFwcGx5IHRoZSB0YXJnZXQgcHJvcGVydHkgb3IgdG8gc2tpcCBpdFxuICAgICAgICAgIGxldCBtb2RlID0gbWFwc01vZGUgfCAodmFsdWVBcHBsaWVkID8gU3R5bGluZ01hcHNTeW5jTW9kZS5Ta2lwVGFyZ2V0UHJvcCA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBTdHlsaW5nTWFwc1N5bmNNb2RlLkFwcGx5VGFyZ2V0UHJvcCk7XG4gICAgICAgICAgaWYgKGhvc3RCaW5kaW5nc01vZGUgJiYgaiA9PT0gMCkge1xuICAgICAgICAgICAgbW9kZSB8PSBTdHlsaW5nTWFwc1N5bmNNb2RlLkNoZWNrVmFsdWVzT25seTtcbiAgICAgICAgICB9XG4gICAgICAgICAgY29uc3QgdmFsdWVBcHBsaWVkV2l0aGluTWFwID0gc3R5bGluZ01hcHNTeW5jRm4oXG4gICAgICAgICAgICAgIGNvbnRleHQsIHJlbmRlcmVyLCBlbGVtZW50LCBiaW5kaW5nRGF0YSwgaiwgYXBwbHlTdHlsaW5nRm4sIHNhbml0aXplciwgbW9kZSwgcHJvcCxcbiAgICAgICAgICAgICAgZGVmYXVsdFZhbHVlKTtcbiAgICAgICAgICB2YWx1ZUFwcGxpZWQgPSB2YWx1ZUFwcGxpZWQgfHwgdmFsdWVBcHBsaWVkV2l0aGluTWFwO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIFBhcnQgMzogYXBwbHkgdGhlIGRlZmF1bHQgdmFsdWUgKGUuZy4gYDxkaXYgc3R5bGU9XCJ3aWR0aDoyMDBcIj5gID0+IGAyMDBweGAgZ2V0cyBhcHBsaWVkKVxuICAgICAgLy8gaWYgdGhlIHZhbHVlIGhhcyBub3QgeWV0IGJlZW4gYXBwbGllZCB0aGVuIGEgdHJ1dGh5IHZhbHVlIGRvZXMgbm90IGV4aXN0IGluIHRoZVxuICAgICAgLy8gcHJvcC1iYXNlZCBvciBtYXAtYmFzZWQgYmluZGluZ3MgY29kZS4gSWYgYW5kIHdoZW4gdGhpcyBoYXBwZW5zLCBqdXN0IGFwcGx5IHRoZVxuICAgICAgLy8gZGVmYXVsdCB2YWx1ZSAoZXZlbiBpZiB0aGUgZGVmYXVsdCB2YWx1ZSBpcyBgbnVsbGApLlxuICAgICAgaWYgKCF2YWx1ZUFwcGxpZWQpIHtcbiAgICAgICAgYXBwbHlTdHlsaW5nRm4ocmVuZGVyZXIsIGVsZW1lbnQsIHByb3AsIGRlZmF1bHRWYWx1ZSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaSArPSBUU3R5bGluZ0NvbnRleHRJbmRleC5CaW5kaW5nc1N0YXJ0T2Zmc2V0ICsgdmFsdWVzQ291bnQ7XG4gIH1cblxuICAvLyB0aGUgbWFwLWJhc2VkIHN0eWxpbmcgZW50cmllcyBtYXkgaGF2ZSBub3QgYXBwbGllZCBhbGwgdGhlaXJcbiAgLy8gdmFsdWVzLiBGb3IgdGhpcyByZWFzb24sIG9uZSBtb3JlIGNhbGwgdG8gdGhlIHN5bmMgZnVuY3Rpb25cbiAgLy8gbmVlZHMgdG8gYmUgaXNzdWVkIGF0IHRoZSBlbmQuXG4gIGlmIChzdHlsaW5nTWFwc1N5bmNGbikge1xuICAgIGlmIChob3N0QmluZGluZ3NNb2RlKSB7XG4gICAgICBtYXBzTW9kZSB8PSBTdHlsaW5nTWFwc1N5bmNNb2RlLkNoZWNrVmFsdWVzT25seTtcbiAgICB9XG4gICAgc3R5bGluZ01hcHNTeW5jRm4oXG4gICAgICAgIGNvbnRleHQsIHJlbmRlcmVyLCBlbGVtZW50LCBiaW5kaW5nRGF0YSwgMCwgYXBwbHlTdHlsaW5nRm4sIHNhbml0aXplciwgbWFwc01vZGUpO1xuICB9XG59XG5cbi8qKlxuICogQXBwbGllcyB0aGUgcHJvdmlkZWQgc3R5bGluZyBtYXAgdG8gdGhlIGVsZW1lbnQgZGlyZWN0bHkgKHdpdGhvdXQgY29udGV4dCByZXNvbHV0aW9uKS5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIGlzIGRlc2lnbmVkIHRvIGJlIHJ1biBmcm9tIHRoZSBzdHlsaW5nIGluc3RydWN0aW9ucyBhbmQgd2lsbCBiZSBjYWxsZWRcbiAqIGF1dG9tYXRpY2FsbHkuIFRoaXMgZnVuY3Rpb24gaXMgaW50ZW5kZWQgdG8gYmUgdXNlZCBmb3IgcGVyZm9ybWFuY2UgcmVhc29ucyBpbiB0aGVcbiAqIGV2ZW50IHRoYXQgdGhlcmUgaXMgbm8gbmVlZCB0byBhcHBseSBzdHlsaW5nIHZpYSBjb250ZXh0IHJlc29sdXRpb24uXG4gKlxuICogU2VlIGBhbGxvd0RpcmVjdFN0eWxpbmdBcHBseWAuXG4gKlxuICogQHJldHVybnMgd2hldGhlciBvciBub3QgdGhlIHN0eWxpbmcgbWFwIHdhcyBhcHBsaWVkIHRvIHRoZSBlbGVtZW50LlxuICovXG5leHBvcnQgZnVuY3Rpb24gYXBwbHlTdHlsaW5nTWFwRGlyZWN0bHkoXG4gICAgcmVuZGVyZXI6IGFueSwgY29udGV4dDogVFN0eWxpbmdDb250ZXh0LCBlbGVtZW50OiBSRWxlbWVudCwgZGF0YTogTFN0eWxpbmdEYXRhLFxuICAgIGJpbmRpbmdJbmRleDogbnVtYmVyLCBtYXA6IFN0eWxpbmdNYXBBcnJheSwgYXBwbHlGbjogQXBwbHlTdHlsaW5nRm4sXG4gICAgc2FuaXRpemVyPzogU3R5bGVTYW5pdGl6ZUZuIHwgbnVsbCwgZm9yY2VVcGRhdGU/OiBib29sZWFuKTogYm9vbGVhbiB7XG4gIGlmIChmb3JjZVVwZGF0ZSB8fCBoYXNWYWx1ZUNoYW5nZWQoZGF0YVtiaW5kaW5nSW5kZXhdLCBtYXApKSB7XG4gICAgc2V0VmFsdWUoZGF0YSwgYmluZGluZ0luZGV4LCBtYXApO1xuICAgIGZvciAobGV0IGkgPSBTdHlsaW5nTWFwQXJyYXlJbmRleC5WYWx1ZXNTdGFydFBvc2l0aW9uOyBpIDwgbWFwLmxlbmd0aDtcbiAgICAgICAgIGkgKz0gU3R5bGluZ01hcEFycmF5SW5kZXguVHVwbGVTaXplKSB7XG4gICAgICBjb25zdCBwcm9wID0gZ2V0TWFwUHJvcChtYXAsIGkpO1xuICAgICAgY29uc3QgdmFsdWUgPSBnZXRNYXBWYWx1ZShtYXAsIGkpO1xuICAgICAgYXBwbHlTdHlsaW5nVmFsdWUocmVuZGVyZXIsIGNvbnRleHQsIGVsZW1lbnQsIHByb3AsIHZhbHVlLCBhcHBseUZuLCBiaW5kaW5nSW5kZXgsIHNhbml0aXplcik7XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuICB9XG4gIHJldHVybiBmYWxzZTtcbn1cblxuLyoqXG4gKiBBcHBsaWVzIHRoZSBwcm92aWRlZCBzdHlsaW5nIHByb3AvdmFsdWUgdG8gdGhlIGVsZW1lbnQgZGlyZWN0bHkgKHdpdGhvdXQgY29udGV4dCByZXNvbHV0aW9uKS5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIGlzIGRlc2lnbmVkIHRvIGJlIHJ1biBmcm9tIHRoZSBzdHlsaW5nIGluc3RydWN0aW9ucyBhbmQgd2lsbCBiZSBjYWxsZWRcbiAqIGF1dG9tYXRpY2FsbHkuIFRoaXMgZnVuY3Rpb24gaXMgaW50ZW5kZWQgdG8gYmUgdXNlZCBmb3IgcGVyZm9ybWFuY2UgcmVhc29ucyBpbiB0aGVcbiAqIGV2ZW50IHRoYXQgdGhlcmUgaXMgbm8gbmVlZCB0byBhcHBseSBzdHlsaW5nIHZpYSBjb250ZXh0IHJlc29sdXRpb24uXG4gKlxuICogU2VlIGBhbGxvd0RpcmVjdFN0eWxpbmdBcHBseWAuXG4gKlxuICogQHJldHVybnMgd2hldGhlciBvciBub3QgdGhlIHByb3AvdmFsdWUgc3R5bGluZyB3YXMgYXBwbGllZCB0byB0aGUgZWxlbWVudC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFwcGx5U3R5bGluZ1ZhbHVlRGlyZWN0bHkoXG4gICAgcmVuZGVyZXI6IGFueSwgY29udGV4dDogVFN0eWxpbmdDb250ZXh0LCBlbGVtZW50OiBSRWxlbWVudCwgZGF0YTogTFN0eWxpbmdEYXRhLFxuICAgIGJpbmRpbmdJbmRleDogbnVtYmVyLCBwcm9wOiBzdHJpbmcsIHZhbHVlOiBhbnksIGFwcGx5Rm46IEFwcGx5U3R5bGluZ0ZuLFxuICAgIHNhbml0aXplcj86IFN0eWxlU2FuaXRpemVGbiB8IG51bGwpOiBib29sZWFuIHtcbiAgaWYgKGhhc1ZhbHVlQ2hhbmdlZChkYXRhW2JpbmRpbmdJbmRleF0sIHZhbHVlKSkge1xuICAgIHNldFZhbHVlKGRhdGEsIGJpbmRpbmdJbmRleCwgdmFsdWUpO1xuICAgIGFwcGx5U3R5bGluZ1ZhbHVlKHJlbmRlcmVyLCBjb250ZXh0LCBlbGVtZW50LCBwcm9wLCB2YWx1ZSwgYXBwbHlGbiwgYmluZGluZ0luZGV4LCBzYW5pdGl6ZXIpO1xuICAgIHJldHVybiB0cnVlO1xuICB9XG4gIHJldHVybiBmYWxzZTtcbn1cblxuZnVuY3Rpb24gYXBwbHlTdHlsaW5nVmFsdWUoXG4gICAgcmVuZGVyZXI6IGFueSwgY29udGV4dDogVFN0eWxpbmdDb250ZXh0LCBlbGVtZW50OiBSRWxlbWVudCwgcHJvcDogc3RyaW5nLCB2YWx1ZTogYW55LFxuICAgIGFwcGx5Rm46IEFwcGx5U3R5bGluZ0ZuLCBiaW5kaW5nSW5kZXg6IG51bWJlciwgc2FuaXRpemVyPzogU3R5bGVTYW5pdGl6ZUZuIHwgbnVsbCkge1xuICBsZXQgdmFsdWVUb0FwcGx5OiBzdHJpbmd8bnVsbCA9IHVud3JhcFNhZmVWYWx1ZSh2YWx1ZSk7XG4gIGlmIChpc1N0eWxpbmdWYWx1ZURlZmluZWQodmFsdWVUb0FwcGx5KSkge1xuICAgIHZhbHVlVG9BcHBseSA9XG4gICAgICAgIHNhbml0aXplciA/IHNhbml0aXplcihwcm9wLCB2YWx1ZSwgU3R5bGVTYW5pdGl6ZU1vZGUuU2FuaXRpemVPbmx5KSA6IHZhbHVlVG9BcHBseTtcbiAgfSBlbHNlIGlmIChoYXNDb25maWcoY29udGV4dCwgVFN0eWxpbmdDb25maWcuSGFzSW5pdGlhbFN0eWxpbmcpKSB7XG4gICAgY29uc3QgaW5pdGlhbFN0eWxlcyA9IGdldFN0eWxpbmdNYXBBcnJheShjb250ZXh0KTtcbiAgICBpZiAoaW5pdGlhbFN0eWxlcykge1xuICAgICAgdmFsdWVUb0FwcGx5ID0gZmluZEluaXRpYWxTdHlsaW5nVmFsdWUoaW5pdGlhbFN0eWxlcywgcHJvcCk7XG4gICAgfVxuICB9XG4gIGFwcGx5Rm4ocmVuZGVyZXIsIGVsZW1lbnQsIHByb3AsIHZhbHVlVG9BcHBseSwgYmluZGluZ0luZGV4KTtcbn1cblxuZnVuY3Rpb24gZmluZEluaXRpYWxTdHlsaW5nVmFsdWUobWFwOiBTdHlsaW5nTWFwQXJyYXksIHByb3A6IHN0cmluZyk6IHN0cmluZ3xudWxsIHtcbiAgZm9yIChsZXQgaSA9IFN0eWxpbmdNYXBBcnJheUluZGV4LlZhbHVlc1N0YXJ0UG9zaXRpb247IGkgPCBtYXAubGVuZ3RoO1xuICAgICAgIGkgKz0gU3R5bGluZ01hcEFycmF5SW5kZXguVHVwbGVTaXplKSB7XG4gICAgY29uc3QgcCA9IGdldE1hcFByb3AobWFwLCBpKTtcbiAgICBpZiAocCA+PSBwcm9wKSB7XG4gICAgICByZXR1cm4gcCA9PT0gcHJvcCA/IGdldE1hcFZhbHVlKG1hcCwgaSkgOiBudWxsO1xuICAgIH1cbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuZnVuY3Rpb24gbm9ybWFsaXplQml0TWFza1ZhbHVlKHZhbHVlOiBudW1iZXIgfCBib29sZWFuKTogbnVtYmVyIHtcbiAgLy8gaWYgcGFzcyA9PiBhcHBseSBhbGwgdmFsdWVzICgtMSBpbXBsaWVzIHRoYXQgYWxsIGJpdHMgYXJlIGZsaXBwZWQgdG8gdHJ1ZSlcbiAgaWYgKHZhbHVlID09PSB0cnVlKSByZXR1cm4gLTE7XG5cbiAgLy8gaWYgcGFzcyA9PiBza2lwIGFsbCB2YWx1ZXNcbiAgaWYgKHZhbHVlID09PSBmYWxzZSkgcmV0dXJuIDA7XG5cbiAgLy8gcmV0dXJuIHRoZSBiaXQgbWFzayB2YWx1ZSBhcyBpc1xuICByZXR1cm4gdmFsdWU7XG59XG5cbmxldCBfYWN0aXZlU3R5bGluZ01hcEFwcGx5Rm46IFN5bmNTdHlsaW5nTWFwc0ZufG51bGwgPSBudWxsO1xuZXhwb3J0IGZ1bmN0aW9uIGdldFN0eWxpbmdNYXBzU3luY0ZuKCkge1xuICByZXR1cm4gX2FjdGl2ZVN0eWxpbmdNYXBBcHBseUZuO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2V0U3R5bGluZ01hcHNTeW5jRm4oZm46IFN5bmNTdHlsaW5nTWFwc0ZuKSB7XG4gIF9hY3RpdmVTdHlsaW5nTWFwQXBwbHlGbiA9IGZuO1xufVxuXG4vKipcbiAqIEFzc2lnbnMgYSBzdHlsZSB2YWx1ZSB0byBhIHN0eWxlIHByb3BlcnR5IGZvciB0aGUgZ2l2ZW4gZWxlbWVudC5cbiAqL1xuZXhwb3J0IGNvbnN0IHNldFN0eWxlOiBBcHBseVN0eWxpbmdGbiA9XG4gICAgKHJlbmRlcmVyOiBSZW5kZXJlcjMgfCBudWxsLCBuYXRpdmU6IFJFbGVtZW50LCBwcm9wOiBzdHJpbmcsIHZhbHVlOiBzdHJpbmcgfCBudWxsKSA9PiB7XG4gICAgICBpZiAocmVuZGVyZXIgIT09IG51bGwpIHtcbiAgICAgICAgaWYgKHZhbHVlKSB7XG4gICAgICAgICAgLy8gb3BhY2l0eSwgei1pbmRleCBhbmQgZmxleGJveCBhbGwgaGF2ZSBudW1iZXIgdmFsdWVzXG4gICAgICAgICAgLy8gYW5kIHRoZXNlIG5lZWQgdG8gYmUgY29udmVydGVkIGludG8gc3RyaW5ncyBzbyB0aGF0XG4gICAgICAgICAgLy8gdGhleSBjYW4gYmUgYXNzaWduZWQgcHJvcGVybHkuXG4gICAgICAgICAgdmFsdWUgPSB2YWx1ZS50b1N0cmluZygpO1xuICAgICAgICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJTZXRTdHlsZSsrO1xuICAgICAgICAgIGlmIChpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikpIHtcbiAgICAgICAgICAgIHJlbmRlcmVyLnNldFN0eWxlKG5hdGl2ZSwgcHJvcCwgdmFsdWUsIFJlbmRlcmVyU3R5bGVGbGFnczMuRGFzaENhc2UpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBUaGUgcmVhc29uIHdoeSBuYXRpdmUgc3R5bGUgbWF5IGJlIGBudWxsYCBpcyBlaXRoZXIgYmVjYXVzZVxuICAgICAgICAgICAgLy8gaXQncyBhIGNvbnRhaW5lciBlbGVtZW50IG9yIGl0J3MgYSBwYXJ0IG9mIGEgdGVzdFxuICAgICAgICAgICAgLy8gZW52aXJvbm1lbnQgdGhhdCBkb2Vzbid0IGhhdmUgc3R5bGluZy4gSW4gZWl0aGVyXG4gICAgICAgICAgICAvLyBjYXNlIGl0J3Mgc2FmZSBub3QgdG8gYXBwbHkgc3R5bGluZyB0byB0aGUgZWxlbWVudC5cbiAgICAgICAgICAgIGNvbnN0IG5hdGl2ZVN0eWxlID0gbmF0aXZlLnN0eWxlO1xuICAgICAgICAgICAgaWYgKG5hdGl2ZVN0eWxlICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgbmF0aXZlU3R5bGUuc2V0UHJvcGVydHkocHJvcCwgdmFsdWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyUmVtb3ZlU3R5bGUrKztcblxuICAgICAgICAgIGlmIChpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikpIHtcbiAgICAgICAgICAgIHJlbmRlcmVyLnJlbW92ZVN0eWxlKG5hdGl2ZSwgcHJvcCwgUmVuZGVyZXJTdHlsZUZsYWdzMy5EYXNoQ2FzZSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnN0IG5hdGl2ZVN0eWxlID0gbmF0aXZlLnN0eWxlO1xuICAgICAgICAgICAgaWYgKG5hdGl2ZVN0eWxlICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgbmF0aXZlU3R5bGUucmVtb3ZlUHJvcGVydHkocHJvcCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfTtcblxuLyoqXG4gKiBBZGRzL3JlbW92ZXMgdGhlIHByb3ZpZGVkIGNsYXNzTmFtZSB2YWx1ZSB0byB0aGUgcHJvdmlkZWQgZWxlbWVudC5cbiAqL1xuZXhwb3J0IGNvbnN0IHNldENsYXNzOiBBcHBseVN0eWxpbmdGbiA9XG4gICAgKHJlbmRlcmVyOiBSZW5kZXJlcjMgfCBudWxsLCBuYXRpdmU6IFJFbGVtZW50LCBjbGFzc05hbWU6IHN0cmluZywgdmFsdWU6IGFueSkgPT4ge1xuICAgICAgaWYgKHJlbmRlcmVyICE9PSBudWxsICYmIGNsYXNzTmFtZSAhPT0gJycpIHtcbiAgICAgICAgaWYgKHZhbHVlKSB7XG4gICAgICAgICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlckFkZENsYXNzKys7XG4gICAgICAgICAgaWYgKGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSkge1xuICAgICAgICAgICAgcmVuZGVyZXIuYWRkQ2xhc3MobmF0aXZlLCBjbGFzc05hbWUpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyB0aGUgcmVhc29uIHdoeSBjbGFzc0xpc3QgbWF5IGJlIGBudWxsYCBpcyBlaXRoZXIgYmVjYXVzZVxuICAgICAgICAgICAgLy8gaXQncyBhIGNvbnRhaW5lciBlbGVtZW50IG9yIGl0J3MgYSBwYXJ0IG9mIGEgdGVzdFxuICAgICAgICAgICAgLy8gZW52aXJvbm1lbnQgdGhhdCBkb2Vzbid0IGhhdmUgc3R5bGluZy4gSW4gZWl0aGVyXG4gICAgICAgICAgICAvLyBjYXNlIGl0J3Mgc2FmZSBub3QgdG8gYXBwbHkgc3R5bGluZyB0byB0aGUgZWxlbWVudC5cbiAgICAgICAgICAgIGNvbnN0IGNsYXNzTGlzdCA9IG5hdGl2ZS5jbGFzc0xpc3Q7XG4gICAgICAgICAgICBpZiAoY2xhc3NMaXN0ICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgY2xhc3NMaXN0LmFkZChjbGFzc05hbWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyUmVtb3ZlQ2xhc3MrKztcbiAgICAgICAgICBpZiAoaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpKSB7XG4gICAgICAgICAgICByZW5kZXJlci5yZW1vdmVDbGFzcyhuYXRpdmUsIGNsYXNzTmFtZSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnN0IGNsYXNzTGlzdCA9IG5hdGl2ZS5jbGFzc0xpc3Q7XG4gICAgICAgICAgICBpZiAoY2xhc3NMaXN0ICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgY2xhc3NMaXN0LnJlbW92ZShjbGFzc05hbWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH07XG5cbi8qKlxuICogSXRlcmF0ZXMgb3ZlciBhbGwgcHJvdmlkZWQgc3R5bGluZyBlbnRyaWVzIGFuZCByZW5kZXJzIHRoZW0gb24gdGhlIGVsZW1lbnQuXG4gKlxuICogVGhpcyBmdW5jdGlvbiBpcyB1c2VkIGFsb25nc2lkZSBhIGBTdHlsaW5nTWFwQXJyYXlgIGVudHJ5LiBUaGlzIGVudHJ5IGlzIG5vdFxuICogdGhlIHNhbWUgYXMgdGhlIGBUU3R5bGluZ0NvbnRleHRgIGFuZCBpcyBvbmx5IHJlYWxseSB1c2VkIHdoZW4gYW4gZWxlbWVudCBjb250YWluc1xuICogaW5pdGlhbCBzdHlsaW5nIHZhbHVlcyAoZS5nLiBgPGRpdiBzdHlsZT1cIndpZHRoOjIwMHB4XCI+YCksIGJ1dCBubyBzdHlsZS9jbGFzcyBiaW5kaW5nc1xuICogYXJlIHByZXNlbnQuIElmIGFuZCB3aGVuIHRoYXQgaGFwcGVucyB0aGVuIHRoaXMgZnVuY3Rpb24gd2lsbCBiZSBjYWxsZWQgdG8gcmVuZGVyIGFsbFxuICogaW5pdGlhbCBzdHlsaW5nIHZhbHVlcyBvbiBhbiBlbGVtZW50LlxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVuZGVyU3R5bGluZ01hcChcbiAgICByZW5kZXJlcjogUmVuZGVyZXIzLCBlbGVtZW50OiBSRWxlbWVudCwgc3R5bGluZ1ZhbHVlczogVFN0eWxpbmdDb250ZXh0IHwgU3R5bGluZ01hcEFycmF5IHwgbnVsbCxcbiAgICBpc0NsYXNzQmFzZWQ6IGJvb2xlYW4pOiB2b2lkIHtcbiAgY29uc3Qgc3R5bGluZ01hcEFyciA9IGdldFN0eWxpbmdNYXBBcnJheShzdHlsaW5nVmFsdWVzKTtcbiAgaWYgKHN0eWxpbmdNYXBBcnIpIHtcbiAgICBmb3IgKGxldCBpID0gU3R5bGluZ01hcEFycmF5SW5kZXguVmFsdWVzU3RhcnRQb3NpdGlvbjsgaSA8IHN0eWxpbmdNYXBBcnIubGVuZ3RoO1xuICAgICAgICAgaSArPSBTdHlsaW5nTWFwQXJyYXlJbmRleC5UdXBsZVNpemUpIHtcbiAgICAgIGNvbnN0IHByb3AgPSBnZXRNYXBQcm9wKHN0eWxpbmdNYXBBcnIsIGkpO1xuICAgICAgY29uc3QgdmFsdWUgPSBnZXRNYXBWYWx1ZShzdHlsaW5nTWFwQXJyLCBpKTtcbiAgICAgIGlmIChpc0NsYXNzQmFzZWQpIHtcbiAgICAgICAgc2V0Q2xhc3MocmVuZGVyZXIsIGVsZW1lbnQsIHByb3AsIHZhbHVlLCBudWxsKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHNldFN0eWxlKHJlbmRlcmVyLCBlbGVtZW50LCBwcm9wLCB2YWx1ZSwgbnVsbCk7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG4iXX0=