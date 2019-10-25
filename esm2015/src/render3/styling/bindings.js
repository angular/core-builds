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
import { global } from '../../util/global';
import { RendererStyleFlags3, isProceduralRenderer } from '../interfaces/renderer';
import { NO_CHANGE } from '../tokens';
import { DEFAULT_BINDING_INDEX, DEFAULT_BINDING_VALUE, DEFAULT_GUARD_MASK_VALUE, MAP_BASED_ENTRY_PROP_NAME, TEMPLATE_DIRECTIVE_INDEX, concatString, forceStylesAsString, getBindingValue, getConfig, getDefaultValue, getGuardMask, getInitialStylingValue, getMapProp, getMapValue, getProp, getPropValuesStartPosition, getStylingMapArray, getTotalSources, getValue, getValuesCount, hasConfig, hasValueChanged, isContextLocked, isHostStylingActive, isSanitizationRequired, isStylingMapArray, isStylingValueDefined, lockContext, normalizeIntoStylingMap, patchConfig, setDefaultValue, setGuardMask, setMapAsDirty, setValue } from '../util/styling_utils';
import { getStylingState, resetStylingState } from './state';
/** @type {?} */
const VALUE_IS_EXTERNALLY_MODIFIED = {};
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
    /** @type {?} */
    const hostBindingsMode = isHostStylingActive(state.sourceIndex);
    // even if the initial value is a `NO_CHANGE` value (e.g. interpolation or [ngClass])
    // then we still need to register the binding within the context so that the context
    // is aware of the binding before it gets locked.
    if (!isContextLocked(context, hostBindingsMode) || value !== NO_CHANGE) {
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
    /** @type {?} */
    const hostBindingsMode = isHostStylingActive(state.sourceIndex);
    // even if the initial value is a `NO_CHANGE` value (e.g. interpolation or [ngStyle])
    // then we still need to register the binding within the context so that the context
    // is aware of the binding before it gets locked.
    if (!isContextLocked(context, hostBindingsMode) || value !== NO_CHANGE) {
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
        patchConfig(context, hostBindingsMode ? 64 /* HasHostBindings */ : 32 /* HasTemplateBindings */);
    }
    /** @type {?} */
    const changed = forceUpdate || hasValueChanged(data[bindingIndex], value);
    if (changed) {
        setValue(data, bindingIndex, value);
        /** @type {?} */
        const doSetValuesAsStale = (getConfig(context) & 64 /* HasHostBindings */) &&
            !hostBindingsMode && (prop ? !value : true);
        if (doSetValuesAsStale) {
            renderHostBindingsAsStale(context, data, prop);
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
 * @return {?}
 */
function renderHostBindingsAsStale(context, data, prop) {
    /** @type {?} */
    const valuesCount = getValuesCount(context);
    if (prop !== null && hasConfig(context, 2 /* HasPropBindings */)) {
        /** @type {?} */
        const itemsPerRow = 4 /* BindingsStartOffset */ + valuesCount;
        /** @type {?} */
        let i = 3 /* ValuesStartPosition */;
        /** @type {?} */
        let found = false;
        while (i < context.length) {
            if (getProp(context, i) === prop) {
                found = true;
                break;
            }
            i += itemsPerRow;
        }
        if (found) {
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
    }
    if (hasConfig(context, 4 /* HasMapBindings */)) {
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
                patchConfig(context, 8 /* HasCollisions */);
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
        patchConfig(context, 16 /* HasInitialStyling */);
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
    if (hasConfig(context, 4 /* HasMapBindings */)) {
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
                    // the first column in the context (when `j == 0`) is special-cased for
                    // template bindings. If and when host bindings are being processed then
                    // the first column will still be iterated over, but the values will only
                    // be checked against (not applied). If and when this happens we need to
                    // notify the map-based syncing code to know not to apply the values it
                    // comes across in the very first map-based binding (which is also located
                    // in column zero).
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
 * This function has three different cases that can occur (for each item in the map):
 *
 * - Case 1: Attempt to apply the current value in the map to the element (if it's `non null`).
 *
 * - Case 2: If a map value fails to be applied then the algorithm will find a matching entry in
 *           the initial values present in the context and attempt to apply that.
 *
 * - Default Case: If the initial value cannot be applied then a default value of `null` will be
 *                 applied (which will remove the style/class value from the element).
 *
 * See `allowDirectStylingApply` to learn the logic used to determine whether any style/class
 * bindings can be directly applied.
 *
 * @param {?} renderer
 * @param {?} context
 * @param {?} element
 * @param {?} data
 * @param {?} bindingIndex
 * @param {?} value
 * @param {?} isClassBased
 * @param {?=} sanitizer
 * @param {?=} forceUpdate
 * @param {?=} bindingValueContainsInitial
 * @return {?} whether or not the styling map was applied to the element.
 */
export function applyStylingMapDirectly(renderer, context, element, data, bindingIndex, value, isClassBased, sanitizer, forceUpdate, bindingValueContainsInitial) {
    /** @type {?} */
    const oldValue = getValue(data, bindingIndex);
    if (forceUpdate || hasValueChanged(oldValue, value)) {
        /** @type {?} */
        const config = getConfig(context);
        /** @type {?} */
        const hasInitial = config & 16 /* HasInitialStyling */;
        /** @type {?} */
        const initialValue = hasInitial && !bindingValueContainsInitial ? getInitialStylingValue(context) : null;
        setValue(data, bindingIndex, value);
        // the cached value is the last snapshot of the style or class
        // attribute value and is used in the if statement below to
        // keep track of internal/external changes.
        /** @type {?} */
        const cachedValueIndex = bindingIndex + 1;
        /** @type {?} */
        let cachedValue = getValue(data, cachedValueIndex);
        if (cachedValue === NO_CHANGE) {
            cachedValue = initialValue;
        }
        cachedValue = typeof cachedValue !== 'string' ? '' : cachedValue;
        // If a class/style value was modified externally then the styling
        // fast pass cannot guarantee that the external values are retained.
        // When this happens, the algorithm will bail out and not write to
        // the style or className attribute directly.
        /** @type {?} */
        let writeToAttrDirectly = !(config & 2 /* HasPropBindings */);
        if (writeToAttrDirectly &&
            checkIfExternallyModified((/** @type {?} */ (element)), cachedValue, isClassBased)) {
            writeToAttrDirectly = false;
            if (oldValue !== VALUE_IS_EXTERNALLY_MODIFIED) {
                // direct styling will reset the attribute entirely each time,
                // and, for this reason, if the algorithm decides it cannot
                // write to the class/style attributes directly then it must
                // reset all the previous style/class values before it starts
                // to apply values in the non-direct way.
                removeStylingValues(renderer, element, oldValue, isClassBased);
                // this will instruct the algorithm not to apply class or style
                // values directly anymore.
                setValue(data, cachedValueIndex, VALUE_IS_EXTERNALLY_MODIFIED);
            }
        }
        if (writeToAttrDirectly) {
            /** @type {?} */
            let valueToApply;
            if (isClassBased) {
                valueToApply = typeof value === 'string' ? value : objectToClassName(value);
                if (initialValue !== null) {
                    valueToApply = concatString(initialValue, valueToApply, ' ');
                }
                setClassName(renderer, element, valueToApply);
            }
            else {
                valueToApply = forceStylesAsString((/** @type {?} */ (value)), true);
                if (initialValue !== null) {
                    valueToApply = initialValue + ';' + valueToApply;
                }
                setStyleAttr(renderer, element, valueToApply);
            }
            setValue(data, cachedValueIndex, valueToApply || null);
        }
        else {
            /** @type {?} */
            const applyFn = isClassBased ? setClass : setStyle;
            /** @type {?} */
            const map = normalizeIntoStylingMap(oldValue, value, !isClassBased);
            /** @type {?} */
            const initialStyles = hasInitial ? getStylingMapArray(context) : null;
            for (let i = 1 /* ValuesStartPosition */; i < map.length; i += 2 /* TupleSize */) {
                /** @type {?} */
                const prop = getMapProp(map, i);
                /** @type {?} */
                const value = getMapValue(map, i);
                // case 1: apply the map value (if it exists)
                /** @type {?} */
                let applied = applyStylingValue(renderer, element, prop, value, applyFn, bindingIndex, sanitizer);
                // case 2: apply the initial value (if it exists)
                if (!applied && initialStyles) {
                    applied = findAndApplyMapValue(renderer, element, applyFn, initialStyles, prop, bindingIndex, sanitizer);
                }
                // default case: apply `null` to remove the value
                if (!applied) {
                    applyFn(renderer, element, prop, null, bindingIndex);
                }
            }
            /** @type {?} */
            const state = getStylingState(element, TEMPLATE_DIRECTIVE_INDEX);
            if (isClassBased) {
                state.lastDirectClassMap = map;
            }
            else {
                state.lastDirectStyleMap = map;
            }
        }
    }
}
/**
 * Applies the provided styling prop/value to the element directly (without context resolution).
 *
 * This function is designed to be run from the styling instructions and will be called
 * automatically. This function is intended to be used for performance reasons in the
 * event that there is no need to apply styling via context resolution.
 *
 * This function has four different cases that can occur:
 *
 * - Case 1: Apply the provided prop/value (style or class) entry to the element
 *           (if it is `non null`).
 *
 * - Case 2: If value does not get applied (because its `null` or `undefined`) then the algorithm
 *           will check to see if a styling map value was applied to the element as well just
 *           before this (via `styleMap` or `classMap`). If and when a map is present then the
 *          algorithm will find the matching property in the map and apply its value.
 *
 * - Case 3: If a map value fails to be applied then the algorithm will check to see if there
 *           are any initial values present and attempt to apply a matching value based on
 *           the target prop.
 *
 * - Default Case: If a matching initial value cannot be applied then a default value
 *                 of `null` will be applied (which will remove the style/class value
 *                 from the element).
 *
 * See `allowDirectStylingApply` to learn the logic used to determine whether any style/class
 * bindings can be directly applied.
 *
 * @param {?} renderer
 * @param {?} context
 * @param {?} element
 * @param {?} data
 * @param {?} bindingIndex
 * @param {?} prop
 * @param {?} value
 * @param {?} isClassBased
 * @param {?=} sanitizer
 * @return {?} whether or not the prop/value styling was applied to the element.
 */
export function applyStylingValueDirectly(renderer, context, element, data, bindingIndex, prop, value, isClassBased, sanitizer) {
    /** @type {?} */
    let applied = false;
    if (hasValueChanged(data[bindingIndex], value)) {
        setValue(data, bindingIndex, value);
        /** @type {?} */
        const applyFn = isClassBased ? setClass : setStyle;
        // case 1: apply the provided value (if it exists)
        applied = applyStylingValue(renderer, element, prop, value, applyFn, bindingIndex, sanitizer);
        // case 2: find the matching property in a styling map and apply the detected value
        if (!applied && hasConfig(context, 4 /* HasMapBindings */)) {
            /** @type {?} */
            const state = getStylingState(element, TEMPLATE_DIRECTIVE_INDEX);
            /** @type {?} */
            const map = isClassBased ? state.lastDirectClassMap : state.lastDirectStyleMap;
            applied = map ?
                findAndApplyMapValue(renderer, element, applyFn, map, prop, bindingIndex, sanitizer) :
                false;
        }
        // case 3: apply the initial value (if it exists)
        if (!applied && hasConfig(context, 16 /* HasInitialStyling */)) {
            /** @type {?} */
            const map = getStylingMapArray(context);
            applied =
                map ? findAndApplyMapValue(renderer, element, applyFn, map, prop, bindingIndex) : false;
        }
        // default case: apply `null` to remove the value
        if (!applied) {
            applyFn(renderer, element, prop, null, bindingIndex);
        }
    }
    return applied;
}
/**
 * @param {?} renderer
 * @param {?} element
 * @param {?} prop
 * @param {?} value
 * @param {?} applyFn
 * @param {?} bindingIndex
 * @param {?=} sanitizer
 * @return {?}
 */
function applyStylingValue(renderer, element, prop, value, applyFn, bindingIndex, sanitizer) {
    /** @type {?} */
    let valueToApply = unwrapSafeValue(value);
    if (isStylingValueDefined(valueToApply)) {
        valueToApply =
            sanitizer ? sanitizer(prop, value, 3 /* ValidateAndSanitize */) : valueToApply;
        applyFn(renderer, element, prop, valueToApply, bindingIndex);
        return true;
    }
    return false;
}
/**
 * @param {?} renderer
 * @param {?} element
 * @param {?} applyFn
 * @param {?} map
 * @param {?} prop
 * @param {?} bindingIndex
 * @param {?=} sanitizer
 * @return {?}
 */
function findAndApplyMapValue(renderer, element, applyFn, map, prop, bindingIndex, sanitizer) {
    for (let i = 1 /* ValuesStartPosition */; i < map.length; i += 2 /* TupleSize */) {
        /** @type {?} */
        const p = getMapProp(map, i);
        if (p === prop) {
            /** @type {?} */
            let valueToApply = getMapValue(map, i);
            valueToApply = sanitizer ?
                sanitizer(prop, valueToApply, 3 /* ValidateAndSanitize */) :
                valueToApply;
            applyFn(renderer, element, prop, valueToApply, bindingIndex);
            return true;
        }
        if (p > prop) {
            break;
        }
    }
    return false;
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
        // Use `isStylingValueDefined` to account for falsy values that should be bound like 0.
        if (isStylingValueDefined(value)) {
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
/** @type {?} */
export const setClassName = (/**
 * @param {?} renderer
 * @param {?} native
 * @param {?} className
 * @return {?}
 */
(renderer, native, className) => {
    if (renderer !== null) {
        if (isProceduralRenderer(renderer)) {
            renderer.setAttribute(native, 'class', className);
        }
        else {
            native.className = className;
        }
    }
});
/** @type {?} */
export const setStyleAttr = (/**
 * @param {?} renderer
 * @param {?} native
 * @param {?} value
 * @return {?}
 */
(renderer, native, value) => {
    if (renderer !== null) {
        if (isProceduralRenderer(renderer)) {
            renderer.setAttribute(native, 'style', value);
        }
        else {
            native.setAttribute('style', value);
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
 * @param {?} obj
 * @return {?}
 */
function objectToClassName(obj) {
    /** @type {?} */
    let str = '';
    if (obj) {
        for (let key in obj) {
            /** @type {?} */
            const value = obj[key];
            if (value) {
                str += (str.length ? ' ' : '') + key;
            }
        }
    }
    return str;
}
/**
 * Determines whether or not an element style/className value has changed since the last update.
 *
 * This function helps Angular determine if a style or class attribute value was
 * modified by an external plugin or API outside of the style binding code. This
 * means any JS code that adds/removes class/style values on an element outside
 * of Angular's styling binding algorithm.
 *
 * @param {?} element
 * @param {?} cachedValue
 * @param {?} isClassBased
 * @return {?} true when the value was modified externally.
 */
function checkIfExternallyModified(element, cachedValue, isClassBased) {
    // this means it was checked before and there is no reason
    // to compare the style/class values again. Either that or
    // web workers are being used.
    if (global.Node === 'undefined' || cachedValue === VALUE_IS_EXTERNALLY_MODIFIED)
        return true;
    // comparing the DOM value against the cached value is the best way to
    // see if something has changed.
    /** @type {?} */
    const currentValue = (isClassBased ? element.className : (element.style && element.style.cssText)) || '';
    return currentValue !== (cachedValue || '');
}
/**
 * Removes provided styling values from the element
 * @param {?} renderer
 * @param {?} element
 * @param {?} values
 * @param {?} isClassBased
 * @return {?}
 */
function removeStylingValues(renderer, element, values, isClassBased) {
    /** @type {?} */
    let arr;
    if (isStylingMapArray(values)) {
        arr = (/** @type {?} */ (values));
    }
    else {
        arr = normalizeIntoStylingMap(null, values, !isClassBased);
    }
    /** @type {?} */
    const applyFn = isClassBased ? setClass : setStyle;
    for (let i = 1 /* ValuesStartPosition */; i < arr.length; i += 2 /* TupleSize */) {
        /** @type {?} */
        const value = getMapValue(arr, i);
        if (value) {
            /** @type {?} */
            const prop = getMapProp(arr, i);
            applyFn(renderer, element, prop, false);
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmluZGluZ3MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL3N0eWxpbmcvYmluZGluZ3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFPQSxPQUFPLEVBQVksZUFBZSxFQUFDLE1BQU0sMkJBQTJCLENBQUM7QUFFckUsT0FBTyxFQUFDLE1BQU0sRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQ3pDLE9BQU8sRUFBMkMsbUJBQW1CLEVBQUUsb0JBQW9CLEVBQUMsTUFBTSx3QkFBd0IsQ0FBQztBQUUzSCxPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sV0FBVyxDQUFDO0FBQ3BDLE9BQU8sRUFBQyxxQkFBcUIsRUFBRSxxQkFBcUIsRUFBRSx3QkFBd0IsRUFBRSx5QkFBeUIsRUFBRSx3QkFBd0IsRUFBRSxZQUFZLEVBQUUsbUJBQW1CLEVBQUUsZUFBZSxFQUFFLFNBQVMsRUFBRSxlQUFlLEVBQUUsWUFBWSxFQUFFLHNCQUFzQixFQUFFLFVBQVUsRUFBRSxXQUFXLEVBQUUsT0FBTyxFQUFFLDBCQUEwQixFQUFFLGtCQUFrQixFQUFFLGVBQWUsRUFBRSxRQUFRLEVBQUUsY0FBYyxFQUFFLFNBQVMsRUFBRSxlQUFlLEVBQUUsZUFBZSxFQUFFLG1CQUFtQixFQUFFLHNCQUFzQixFQUFFLGlCQUFpQixFQUFFLHFCQUFxQixFQUFFLFdBQVcsRUFBRSx1QkFBdUIsRUFBRSxXQUFXLEVBQUUsZUFBZSxFQUFFLFlBQVksRUFBRSxhQUFhLEVBQUUsUUFBUSxFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFFcG9CLE9BQU8sRUFBQyxlQUFlLEVBQUUsaUJBQWlCLEVBQUMsTUFBTSxTQUFTLENBQUM7O01BRXJELDRCQUE0QixHQUFHLEVBQUU7Ozs7Ozs7TUEwQmpDLDZCQUE2QixHQUFHLENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBWXZDLE1BQU0sVUFBVSxxQkFB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QUFDOUMsQ0FBQzs7Ozs7Ozs7O0FBS0QsU0FBUyxtQkFBbUIsQ0FDeEIsUUFBYSxFQUFFLE9BQWlCLEVBQUUsTUFBdUQsRUFDekYsWUFBcUI7O1FBQ25CLEdBQW9CO0lBQ3hCLElBQUksaUJBQWlCLENBQUMsTUFBTSxDQUFDLEVBQUU7UUFDN0IsR0FBRyxHQUFHLG1CQUFBLE1BQU0sRUFBbUIsQ0FBQztLQUNqQztTQUFNO1FBQ0wsR0FBRyxHQUFHLHVCQUF1QixDQUFDLElBQUksRUFBRSxNQUFNLEVBQUUsQ0FBQyxZQUFZLENBQUMsQ0FBQztLQUM1RDs7VUFFSyxPQUFPLEdBQUcsWUFBWSxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLFFBQVE7SUFDbEQsS0FBSyxJQUFJLENBQUMsOEJBQTJDLEVBQUUsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxNQUFNLEVBQ2hFLENBQUMscUJBQWtDLEVBQUU7O2NBQ2xDLEtBQUssR0FBRyxXQUFXLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQztRQUNqQyxJQUFJLEtBQUssRUFBRTs7a0JBQ0gsSUFBSSxHQUFHLFVBQVUsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDO1lBQy9CLE9BQU8sQ0FBQyxRQUFRLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQztTQUN6QztLQUNGO0FBQ0gsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuKiBAbGljZW5zZVxuKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbipcbiogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuKi9cbmltcG9ydCB7U2FmZVZhbHVlLCB1bndyYXBTYWZlVmFsdWV9IGZyb20gJy4uLy4uL3Nhbml0aXphdGlvbi9ieXBhc3MnO1xuaW1wb3J0IHtTdHlsZVNhbml0aXplRm4sIFN0eWxlU2FuaXRpemVNb2RlfSBmcm9tICcuLi8uLi9zYW5pdGl6YXRpb24vc3R5bGVfc2FuaXRpemVyJztcbmltcG9ydCB7Z2xvYmFsfSBmcm9tICcuLi8uLi91dGlsL2dsb2JhbCc7XG5pbXBvcnQge1Byb2NlZHVyYWxSZW5kZXJlcjMsIFJFbGVtZW50LCBSZW5kZXJlcjMsIFJlbmRlcmVyU3R5bGVGbGFnczMsIGlzUHJvY2VkdXJhbFJlbmRlcmVyfSBmcm9tICcuLi9pbnRlcmZhY2VzL3JlbmRlcmVyJztcbmltcG9ydCB7QXBwbHlTdHlsaW5nRm4sIExTdHlsaW5nRGF0YSwgU3R5bGluZ01hcEFycmF5LCBTdHlsaW5nTWFwQXJyYXlJbmRleCwgU3R5bGluZ01hcHNTeW5jTW9kZSwgU3luY1N0eWxpbmdNYXBzRm4sIFRTdHlsaW5nQ29uZmlnLCBUU3R5bGluZ0NvbnRleHQsIFRTdHlsaW5nQ29udGV4dEluZGV4LCBUU3R5bGluZ0NvbnRleHRQcm9wQ29uZmlnRmxhZ3N9IGZyb20gJy4uL2ludGVyZmFjZXMvc3R5bGluZyc7XG5pbXBvcnQge05PX0NIQU5HRX0gZnJvbSAnLi4vdG9rZW5zJztcbmltcG9ydCB7REVGQVVMVF9CSU5ESU5HX0lOREVYLCBERUZBVUxUX0JJTkRJTkdfVkFMVUUsIERFRkFVTFRfR1VBUkRfTUFTS19WQUxVRSwgTUFQX0JBU0VEX0VOVFJZX1BST1BfTkFNRSwgVEVNUExBVEVfRElSRUNUSVZFX0lOREVYLCBjb25jYXRTdHJpbmcsIGZvcmNlU3R5bGVzQXNTdHJpbmcsIGdldEJpbmRpbmdWYWx1ZSwgZ2V0Q29uZmlnLCBnZXREZWZhdWx0VmFsdWUsIGdldEd1YXJkTWFzaywgZ2V0SW5pdGlhbFN0eWxpbmdWYWx1ZSwgZ2V0TWFwUHJvcCwgZ2V0TWFwVmFsdWUsIGdldFByb3AsIGdldFByb3BWYWx1ZXNTdGFydFBvc2l0aW9uLCBnZXRTdHlsaW5nTWFwQXJyYXksIGdldFRvdGFsU291cmNlcywgZ2V0VmFsdWUsIGdldFZhbHVlc0NvdW50LCBoYXNDb25maWcsIGhhc1ZhbHVlQ2hhbmdlZCwgaXNDb250ZXh0TG9ja2VkLCBpc0hvc3RTdHlsaW5nQWN0aXZlLCBpc1Nhbml0aXphdGlvblJlcXVpcmVkLCBpc1N0eWxpbmdNYXBBcnJheSwgaXNTdHlsaW5nVmFsdWVEZWZpbmVkLCBsb2NrQ29udGV4dCwgbm9ybWFsaXplSW50b1N0eWxpbmdNYXAsIHBhdGNoQ29uZmlnLCBzZXREZWZhdWx0VmFsdWUsIHNldEd1YXJkTWFzaywgc2V0TWFwQXNEaXJ0eSwgc2V0VmFsdWV9IGZyb20gJy4uL3V0aWwvc3R5bGluZ191dGlscyc7XG5cbmltcG9ydCB7Z2V0U3R5bGluZ1N0YXRlLCByZXNldFN0eWxpbmdTdGF0ZX0gZnJvbSAnLi9zdGF0ZSc7XG5cbmNvbnN0IFZBTFVFX0lTX0VYVEVSTkFMTFlfTU9ESUZJRUQgPSB7fTtcblxuLyoqXG4gKiAtLS0tLS0tLVxuICpcbiAqIFRoaXMgZmlsZSBjb250YWlucyB0aGUgY29yZSBsb2dpYyBmb3Igc3R5bGluZyBpbiBBbmd1bGFyLlxuICpcbiAqIEFsbCBzdHlsaW5nIGJpbmRpbmdzIChpLmUuIGBbc3R5bGVdYCwgYFtzdHlsZS5wcm9wXWAsIGBbY2xhc3NdYCBhbmQgYFtjbGFzcy5uYW1lXWApXG4gKiB3aWxsIGhhdmUgdGhlaXIgdmFsdWVzIGJlIGFwcGxpZWQgdGhyb3VnaCB0aGUgbG9naWMgaW4gdGhpcyBmaWxlLlxuICpcbiAqIFdoZW4gYSBiaW5kaW5nIGlzIGVuY291bnRlcmVkIChlLmcuIGA8ZGl2IFtzdHlsZS53aWR0aF09XCJ3XCI+YCkgdGhlblxuICogdGhlIGJpbmRpbmcgZGF0YSB3aWxsIGJlIHBvcHVsYXRlZCBpbnRvIGEgYFRTdHlsaW5nQ29udGV4dGAgZGF0YS1zdHJ1Y3R1cmUuXG4gKiBUaGVyZSBpcyBvbmx5IG9uZSBgVFN0eWxpbmdDb250ZXh0YCBwZXIgYFROb2RlYCBhbmQgZWFjaCBlbGVtZW50IGluc3RhbmNlXG4gKiB3aWxsIHVwZGF0ZSBpdHMgc3R5bGUvY2xhc3MgYmluZGluZyB2YWx1ZXMgaW4gY29uY2VydCB3aXRoIHRoZSBzdHlsaW5nXG4gKiBjb250ZXh0LlxuICpcbiAqIFRvIGxlYXJuIG1vcmUgYWJvdXQgdGhlIGFsZ29yaXRobSBzZWUgYFRTdHlsaW5nQ29udGV4dGAuXG4gKlxuICogLS0tLS0tLS1cbiAqL1xuXG4vKipcbiAqIFRoZSBndWFyZC91cGRhdGUgbWFzayBiaXQgaW5kZXggbG9jYXRpb24gZm9yIG1hcC1iYXNlZCBiaW5kaW5ncy5cbiAqXG4gKiBBbGwgbWFwLWJhc2VkIGJpbmRpbmdzIChpLmUuIGBbc3R5bGVdYCBhbmQgYFtjbGFzc11gIClcbiAqL1xuY29uc3QgU1RZTElOR19JTkRFWF9GT1JfTUFQX0JJTkRJTkcgPSAwO1xuXG4vKipcbiAqIFZpc2l0cyBhIGNsYXNzLWJhc2VkIGJpbmRpbmcgYW5kIHVwZGF0ZXMgdGhlIG5ldyB2YWx1ZSAoaWYgY2hhbmdlZCkuXG4gKlxuICogVGhpcyBmdW5jdGlvbiBpcyBjYWxsZWQgZWFjaCB0aW1lIGEgY2xhc3MtYmFzZWQgc3R5bGluZyBpbnN0cnVjdGlvblxuICogaXMgZXhlY3V0ZWQuIEl0J3MgaW1wb3J0YW50IHRoYXQgaXQncyBhbHdheXMgY2FsbGVkIChldmVuIGlmIHRoZSB2YWx1ZVxuICogaGFzIG5vdCBjaGFuZ2VkKSBzbyB0aGF0IHRoZSBpbm5lciBjb3VudGVyIGluZGV4IHZhbHVlIGlzIGluY3JlbWVudGVkLlxuICogVGhpcyB3YXksIGVhY2ggaW5zdHJ1Y3Rpb24gaXMgYWx3YXlzIGd1YXJhbnRlZWQgdG8gZ2V0IHRoZSBzYW1lIGNvdW50ZXJcbiAqIHN0YXRlIGVhY2ggdGltZSBpdCdzIGNhbGxlZCAod2hpY2ggdGhlbiBhbGxvd3MgdGhlIGBUU3R5bGluZ0NvbnRleHRgXG4gKiBhbmQgdGhlIGJpdCBtYXNrIHZhbHVlcyB0byBiZSBpbiBzeW5jKS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHVwZGF0ZUNsYXNzVmlhQ29udGV4dChcbiAgICBjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQsIGRhdGE6IExTdHlsaW5nRGF0YSwgZWxlbWVudDogUkVsZW1lbnQsIGRpcmVjdGl2ZUluZGV4OiBudW1iZXIsXG4gICAgcHJvcDogc3RyaW5nIHwgbnVsbCwgYmluZGluZ0luZGV4OiBudW1iZXIsXG4gICAgdmFsdWU6IGJvb2xlYW4gfCBzdHJpbmcgfCBudWxsIHwgdW5kZWZpbmVkIHwgU3R5bGluZ01hcEFycmF5IHwgTk9fQ0hBTkdFLFxuICAgIGZvcmNlVXBkYXRlPzogYm9vbGVhbik6IGJvb2xlYW4ge1xuICBjb25zdCBpc01hcEJhc2VkID0gIXByb3A7XG4gIGNvbnN0IHN0YXRlID0gZ2V0U3R5bGluZ1N0YXRlKGVsZW1lbnQsIGRpcmVjdGl2ZUluZGV4KTtcbiAgY29uc3QgY291bnRJbmRleCA9IGlzTWFwQmFzZWQgPyBTVFlMSU5HX0lOREVYX0ZPUl9NQVBfQklORElORyA6IHN0YXRlLmNsYXNzZXNJbmRleCsrO1xuICBjb25zdCBob3N0QmluZGluZ3NNb2RlID0gaXNIb3N0U3R5bGluZ0FjdGl2ZShzdGF0ZS5zb3VyY2VJbmRleCk7XG5cbiAgLy8gZXZlbiBpZiB0aGUgaW5pdGlhbCB2YWx1ZSBpcyBhIGBOT19DSEFOR0VgIHZhbHVlIChlLmcuIGludGVycG9sYXRpb24gb3IgW25nQ2xhc3NdKVxuICAvLyB0aGVuIHdlIHN0aWxsIG5lZWQgdG8gcmVnaXN0ZXIgdGhlIGJpbmRpbmcgd2l0aGluIHRoZSBjb250ZXh0IHNvIHRoYXQgdGhlIGNvbnRleHRcbiAgLy8gaXMgYXdhcmUgb2YgdGhlIGJpbmRpbmcgYmVmb3JlIGl0IGdldHMgbG9ja2VkLlxuICBpZiAoIWlzQ29udGV4dExvY2tlZChjb250ZXh0LCBob3N0QmluZGluZ3NNb2RlKSB8fCB2YWx1ZSAhPT0gTk9fQ0hBTkdFKSB7XG4gICAgY29uc3QgdXBkYXRlZCA9IHVwZGF0ZUJpbmRpbmdEYXRhKFxuICAgICAgICBjb250ZXh0LCBkYXRhLCBjb3VudEluZGV4LCBzdGF0ZS5zb3VyY2VJbmRleCwgcHJvcCwgYmluZGluZ0luZGV4LCB2YWx1ZSwgZm9yY2VVcGRhdGUsXG4gICAgICAgIGZhbHNlKTtcbiAgICBpZiAodXBkYXRlZCB8fCBmb3JjZVVwZGF0ZSkge1xuICAgICAgLy8gV2UgZmxpcCB0aGUgYml0IGluIHRoZSBiaXRNYXNrIHRvIHJlZmxlY3QgdGhhdCB0aGUgYmluZGluZ1xuICAgICAgLy8gYXQgdGhlIGBpbmRleGAgc2xvdCBoYXMgY2hhbmdlZC4gVGhpcyBpZGVudGlmaWVzIHRvIHRoZSBmbHVzaGluZ1xuICAgICAgLy8gcGhhc2UgdGhhdCB0aGUgYmluZGluZ3MgZm9yIHRoaXMgcGFydGljdWxhciBDU1MgY2xhc3MgbmVlZCB0byBiZVxuICAgICAgLy8gYXBwbGllZCBhZ2FpbiBiZWNhdXNlIG9uIG9yIG1vcmUgb2YgdGhlIGJpbmRpbmdzIGZvciB0aGUgQ1NTXG4gICAgICAvLyBjbGFzcyBoYXZlIGNoYW5nZWQuXG4gICAgICBzdGF0ZS5jbGFzc2VzQml0TWFzayB8PSAxIDw8IGNvdW50SW5kZXg7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG4vKipcbiAqIFZpc2l0cyBhIHN0eWxlLWJhc2VkIGJpbmRpbmcgYW5kIHVwZGF0ZXMgdGhlIG5ldyB2YWx1ZSAoaWYgY2hhbmdlZCkuXG4gKlxuICogVGhpcyBmdW5jdGlvbiBpcyBjYWxsZWQgZWFjaCB0aW1lIGEgc3R5bGUtYmFzZWQgc3R5bGluZyBpbnN0cnVjdGlvblxuICogaXMgZXhlY3V0ZWQuIEl0J3MgaW1wb3J0YW50IHRoYXQgaXQncyBhbHdheXMgY2FsbGVkIChldmVuIGlmIHRoZSB2YWx1ZVxuICogaGFzIG5vdCBjaGFuZ2VkKSBzbyB0aGF0IHRoZSBpbm5lciBjb3VudGVyIGluZGV4IHZhbHVlIGlzIGluY3JlbWVudGVkLlxuICogVGhpcyB3YXksIGVhY2ggaW5zdHJ1Y3Rpb24gaXMgYWx3YXlzIGd1YXJhbnRlZWQgdG8gZ2V0IHRoZSBzYW1lIGNvdW50ZXJcbiAqIHN0YXRlIGVhY2ggdGltZSBpdCdzIGNhbGxlZCAod2hpY2ggdGhlbiBhbGxvd3MgdGhlIGBUU3R5bGluZ0NvbnRleHRgXG4gKiBhbmQgdGhlIGJpdCBtYXNrIHZhbHVlcyB0byBiZSBpbiBzeW5jKS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHVwZGF0ZVN0eWxlVmlhQ29udGV4dChcbiAgICBjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQsIGRhdGE6IExTdHlsaW5nRGF0YSwgZWxlbWVudDogUkVsZW1lbnQsIGRpcmVjdGl2ZUluZGV4OiBudW1iZXIsXG4gICAgcHJvcDogc3RyaW5nIHwgbnVsbCwgYmluZGluZ0luZGV4OiBudW1iZXIsXG4gICAgdmFsdWU6IHN0cmluZyB8IG51bWJlciB8IFNhZmVWYWx1ZSB8IG51bGwgfCB1bmRlZmluZWQgfCBTdHlsaW5nTWFwQXJyYXkgfCBOT19DSEFOR0UsXG4gICAgc2FuaXRpemVyOiBTdHlsZVNhbml0aXplRm4gfCBudWxsLCBmb3JjZVVwZGF0ZT86IGJvb2xlYW4pOiBib29sZWFuIHtcbiAgY29uc3QgaXNNYXBCYXNlZCA9ICFwcm9wO1xuICBjb25zdCBzdGF0ZSA9IGdldFN0eWxpbmdTdGF0ZShlbGVtZW50LCBkaXJlY3RpdmVJbmRleCk7XG4gIGNvbnN0IGNvdW50SW5kZXggPSBpc01hcEJhc2VkID8gU1RZTElOR19JTkRFWF9GT1JfTUFQX0JJTkRJTkcgOiBzdGF0ZS5zdHlsZXNJbmRleCsrO1xuICBjb25zdCBob3N0QmluZGluZ3NNb2RlID0gaXNIb3N0U3R5bGluZ0FjdGl2ZShzdGF0ZS5zb3VyY2VJbmRleCk7XG5cbiAgLy8gZXZlbiBpZiB0aGUgaW5pdGlhbCB2YWx1ZSBpcyBhIGBOT19DSEFOR0VgIHZhbHVlIChlLmcuIGludGVycG9sYXRpb24gb3IgW25nU3R5bGVdKVxuICAvLyB0aGVuIHdlIHN0aWxsIG5lZWQgdG8gcmVnaXN0ZXIgdGhlIGJpbmRpbmcgd2l0aGluIHRoZSBjb250ZXh0IHNvIHRoYXQgdGhlIGNvbnRleHRcbiAgLy8gaXMgYXdhcmUgb2YgdGhlIGJpbmRpbmcgYmVmb3JlIGl0IGdldHMgbG9ja2VkLlxuICBpZiAoIWlzQ29udGV4dExvY2tlZChjb250ZXh0LCBob3N0QmluZGluZ3NNb2RlKSB8fCB2YWx1ZSAhPT0gTk9fQ0hBTkdFKSB7XG4gICAgY29uc3Qgc2FuaXRpemF0aW9uUmVxdWlyZWQgPSBpc01hcEJhc2VkID9cbiAgICAgICAgdHJ1ZSA6XG4gICAgICAgIChzYW5pdGl6ZXIgPyBzYW5pdGl6ZXIocHJvcCAhLCBudWxsLCBTdHlsZVNhbml0aXplTW9kZS5WYWxpZGF0ZVByb3BlcnR5KSA6IGZhbHNlKTtcbiAgICBjb25zdCB1cGRhdGVkID0gdXBkYXRlQmluZGluZ0RhdGEoXG4gICAgICAgIGNvbnRleHQsIGRhdGEsIGNvdW50SW5kZXgsIHN0YXRlLnNvdXJjZUluZGV4LCBwcm9wLCBiaW5kaW5nSW5kZXgsIHZhbHVlLCBmb3JjZVVwZGF0ZSxcbiAgICAgICAgc2FuaXRpemF0aW9uUmVxdWlyZWQpO1xuICAgIGlmICh1cGRhdGVkIHx8IGZvcmNlVXBkYXRlKSB7XG4gICAgICAvLyBXZSBmbGlwIHRoZSBiaXQgaW4gdGhlIGJpdE1hc2sgdG8gcmVmbGVjdCB0aGF0IHRoZSBiaW5kaW5nXG4gICAgICAvLyBhdCB0aGUgYGluZGV4YCBzbG90IGhhcyBjaGFuZ2VkLiBUaGlzIGlkZW50aWZpZXMgdG8gdGhlIGZsdXNoaW5nXG4gICAgICAvLyBwaGFzZSB0aGF0IHRoZSBiaW5kaW5ncyBmb3IgdGhpcyBwYXJ0aWN1bGFyIHByb3BlcnR5IG5lZWQgdG8gYmVcbiAgICAgIC8vIGFwcGxpZWQgYWdhaW4gYmVjYXVzZSBvbiBvciBtb3JlIG9mIHRoZSBiaW5kaW5ncyBmb3IgdGhlIENTU1xuICAgICAgLy8gcHJvcGVydHkgaGF2ZSBjaGFuZ2VkLlxuICAgICAgc3RhdGUuc3R5bGVzQml0TWFzayB8PSAxIDw8IGNvdW50SW5kZXg7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG4vKipcbiAqIENhbGxlZCBlYWNoIHRpbWUgYSBiaW5kaW5nIHZhbHVlIGhhcyBjaGFuZ2VkIHdpdGhpbiB0aGUgcHJvdmlkZWQgYFRTdHlsaW5nQ29udGV4dGAuXG4gKlxuICogVGhpcyBmdW5jdGlvbiBpcyBkZXNpZ25lZCB0byBiZSBjYWxsZWQgZnJvbSBgdXBkYXRlU3R5bGVCaW5kaW5nYCBhbmQgYHVwZGF0ZUNsYXNzQmluZGluZ2AuXG4gKiBJZiBjYWxsZWQgZHVyaW5nIHRoZSBmaXJzdCB1cGRhdGUgcGFzcywgdGhlIGJpbmRpbmcgd2lsbCBiZSByZWdpc3RlcmVkIGluIHRoZSBjb250ZXh0LlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gd2lsbCBhbHNvIHVwZGF0ZSBiaW5kaW5nIHNsb3QgaW4gdGhlIHByb3ZpZGVkIGBMU3R5bGluZ0RhdGFgIHdpdGggdGhlXG4gKiBuZXcgYmluZGluZyBlbnRyeSAoaWYgaXQgaGFzIGNoYW5nZWQpLlxuICpcbiAqIEByZXR1cm5zIHdoZXRoZXIgb3Igbm90IHRoZSBiaW5kaW5nIHZhbHVlIHdhcyB1cGRhdGVkIGluIHRoZSBgTFN0eWxpbmdEYXRhYC5cbiAqL1xuZnVuY3Rpb24gdXBkYXRlQmluZGluZ0RhdGEoXG4gICAgY29udGV4dDogVFN0eWxpbmdDb250ZXh0LCBkYXRhOiBMU3R5bGluZ0RhdGEsIGNvdW50ZXJJbmRleDogbnVtYmVyLCBzb3VyY2VJbmRleDogbnVtYmVyLFxuICAgIHByb3A6IHN0cmluZyB8IG51bGwsIGJpbmRpbmdJbmRleDogbnVtYmVyLFxuICAgIHZhbHVlOiBzdHJpbmcgfCBTYWZlVmFsdWUgfCBudW1iZXIgfCBib29sZWFuIHwgbnVsbCB8IHVuZGVmaW5lZCB8IFN0eWxpbmdNYXBBcnJheSxcbiAgICBmb3JjZVVwZGF0ZT86IGJvb2xlYW4sIHNhbml0aXphdGlvblJlcXVpcmVkPzogYm9vbGVhbik6IGJvb2xlYW4ge1xuICBjb25zdCBob3N0QmluZGluZ3NNb2RlID0gaXNIb3N0U3R5bGluZ0FjdGl2ZShzb3VyY2VJbmRleCk7XG4gIGlmICghaXNDb250ZXh0TG9ja2VkKGNvbnRleHQsIGhvc3RCaW5kaW5nc01vZGUpKSB7XG4gICAgLy8gdGhpcyB3aWxsIG9ubHkgaGFwcGVuIGR1cmluZyB0aGUgZmlyc3QgdXBkYXRlIHBhc3Mgb2YgdGhlXG4gICAgLy8gY29udGV4dC4gVGhlIHJlYXNvbiB3aHkgd2UgY2FuJ3QgdXNlIGB0Tm9kZS5maXJzdFRlbXBsYXRlUGFzc2BcbiAgICAvLyBoZXJlIGlzIGJlY2F1c2UgaXRzIG5vdCBndWFyYW50ZWVkIHRvIGJlIHRydWUgd2hlbiB0aGUgZmlyc3RcbiAgICAvLyB1cGRhdGUgcGFzcyBpcyBleGVjdXRlZCAocmVtZW1iZXIgdGhhdCBhbGwgc3R5bGluZyBpbnN0cnVjdGlvbnNcbiAgICAvLyBhcmUgcnVuIGluIHRoZSB1cGRhdGUgcGhhc2UsIGFuZCwgYXMgYSByZXN1bHQsIGFyZSBubyBtb3JlXG4gICAgLy8gc3R5bGluZyBpbnN0cnVjdGlvbnMgdGhhdCBhcmUgcnVuIGluIHRoZSBjcmVhdGlvbiBwaGFzZSkuXG4gICAgcmVnaXN0ZXJCaW5kaW5nKGNvbnRleHQsIGNvdW50ZXJJbmRleCwgc291cmNlSW5kZXgsIHByb3AsIGJpbmRpbmdJbmRleCwgc2FuaXRpemF0aW9uUmVxdWlyZWQpO1xuICAgIHBhdGNoQ29uZmlnKFxuICAgICAgICBjb250ZXh0LFxuICAgICAgICBob3N0QmluZGluZ3NNb2RlID8gVFN0eWxpbmdDb25maWcuSGFzSG9zdEJpbmRpbmdzIDogVFN0eWxpbmdDb25maWcuSGFzVGVtcGxhdGVCaW5kaW5ncyk7XG4gIH1cblxuICBjb25zdCBjaGFuZ2VkID0gZm9yY2VVcGRhdGUgfHwgaGFzVmFsdWVDaGFuZ2VkKGRhdGFbYmluZGluZ0luZGV4XSwgdmFsdWUpO1xuICBpZiAoY2hhbmdlZCkge1xuICAgIHNldFZhbHVlKGRhdGEsIGJpbmRpbmdJbmRleCwgdmFsdWUpO1xuICAgIGNvbnN0IGRvU2V0VmFsdWVzQXNTdGFsZSA9IChnZXRDb25maWcoY29udGV4dCkgJiBUU3R5bGluZ0NvbmZpZy5IYXNIb3N0QmluZGluZ3MpICYmXG4gICAgICAgICFob3N0QmluZGluZ3NNb2RlICYmIChwcm9wID8gIXZhbHVlIDogdHJ1ZSk7XG4gICAgaWYgKGRvU2V0VmFsdWVzQXNTdGFsZSkge1xuICAgICAgcmVuZGVySG9zdEJpbmRpbmdzQXNTdGFsZShjb250ZXh0LCBkYXRhLCBwcm9wKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGNoYW5nZWQ7XG59XG5cbi8qKlxuICogSXRlcmF0ZXMgb3ZlciBhbGwgaG9zdC1iaW5kaW5nIHZhbHVlcyBmb3IgdGhlIGdpdmVuIGBwcm9wYCB2YWx1ZSBpbiB0aGUgY29udGV4dCBhbmQgc2V0cyB0aGVpclxuICogY29ycmVzcG9uZGluZyBiaW5kaW5nIHZhbHVlcyB0byBgbnVsbGAuXG4gKlxuICogV2hlbmV2ZXIgYSB0ZW1wbGF0ZSBiaW5kaW5nIGNoYW5nZXMgaXRzIHZhbHVlIHRvIGBudWxsYCwgYWxsIGhvc3QtYmluZGluZyB2YWx1ZXMgc2hvdWxkIGJlXG4gKiByZS1hcHBsaWVkXG4gKiB0byB0aGUgZWxlbWVudCB3aGVuIHRoZSBob3N0IGJpbmRpbmdzIGFyZSBldmFsdWF0ZWQuIFRoaXMgbWF5IG5vdCBhbHdheXMgaGFwcGVuIGluIHRoZSBldmVudFxuICogdGhhdCBub25lIG9mIHRoZSBiaW5kaW5ncyBjaGFuZ2VkIHdpdGhpbiB0aGUgaG9zdCBiaW5kaW5ncyBjb2RlLiBGb3IgdGhpcyByZWFzb24gdGhpcyBmdW5jdGlvblxuICogaXMgZXhwZWN0ZWQgdG8gYmUgY2FsbGVkIGVhY2ggdGltZSBhIHRlbXBsYXRlIGJpbmRpbmcgYmVjb21lcyBmYWxzeSBvciB3aGVuIGEgbWFwLWJhc2VkIHRlbXBsYXRlXG4gKiBiaW5kaW5nIGNoYW5nZXMuXG4gKi9cbmZ1bmN0aW9uIHJlbmRlckhvc3RCaW5kaW5nc0FzU3RhbGUoXG4gICAgY29udGV4dDogVFN0eWxpbmdDb250ZXh0LCBkYXRhOiBMU3R5bGluZ0RhdGEsIHByb3A6IHN0cmluZyB8IG51bGwpOiB2b2lkIHtcbiAgY29uc3QgdmFsdWVzQ291bnQgPSBnZXRWYWx1ZXNDb3VudChjb250ZXh0KTtcblxuICBpZiAocHJvcCAhPT0gbnVsbCAmJiBoYXNDb25maWcoY29udGV4dCwgVFN0eWxpbmdDb25maWcuSGFzUHJvcEJpbmRpbmdzKSkge1xuICAgIGNvbnN0IGl0ZW1zUGVyUm93ID0gVFN0eWxpbmdDb250ZXh0SW5kZXguQmluZGluZ3NTdGFydE9mZnNldCArIHZhbHVlc0NvdW50O1xuXG4gICAgbGV0IGkgPSBUU3R5bGluZ0NvbnRleHRJbmRleC5WYWx1ZXNTdGFydFBvc2l0aW9uO1xuICAgIGxldCBmb3VuZCA9IGZhbHNlO1xuICAgIHdoaWxlIChpIDwgY29udGV4dC5sZW5ndGgpIHtcbiAgICAgIGlmIChnZXRQcm9wKGNvbnRleHQsIGkpID09PSBwcm9wKSB7XG4gICAgICAgIGZvdW5kID0gdHJ1ZTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBpICs9IGl0ZW1zUGVyUm93O1xuICAgIH1cblxuICAgIGlmIChmb3VuZCkge1xuICAgICAgY29uc3QgYmluZGluZ3NTdGFydCA9IGkgKyBUU3R5bGluZ0NvbnRleHRJbmRleC5CaW5kaW5nc1N0YXJ0T2Zmc2V0O1xuICAgICAgY29uc3QgdmFsdWVzU3RhcnQgPSBiaW5kaW5nc1N0YXJ0ICsgMTsgIC8vIHRoZSBmaXJzdCBjb2x1bW4gaXMgdGVtcGxhdGUgYmluZGluZ3NcbiAgICAgIGNvbnN0IHZhbHVlc0VuZCA9IGJpbmRpbmdzU3RhcnQgKyB2YWx1ZXNDb3VudCAtIDE7XG5cbiAgICAgIGZvciAobGV0IGkgPSB2YWx1ZXNTdGFydDsgaSA8IHZhbHVlc0VuZDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IGJpbmRpbmdJbmRleCA9IGNvbnRleHRbaV0gYXMgbnVtYmVyO1xuICAgICAgICBpZiAoYmluZGluZ0luZGV4ICE9PSAwKSB7XG4gICAgICAgICAgc2V0VmFsdWUoZGF0YSwgYmluZGluZ0luZGV4LCBudWxsKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGlmIChoYXNDb25maWcoY29udGV4dCwgVFN0eWxpbmdDb25maWcuSGFzTWFwQmluZGluZ3MpKSB7XG4gICAgY29uc3QgYmluZGluZ3NTdGFydCA9XG4gICAgICAgIFRTdHlsaW5nQ29udGV4dEluZGV4LlZhbHVlc1N0YXJ0UG9zaXRpb24gKyBUU3R5bGluZ0NvbnRleHRJbmRleC5CaW5kaW5nc1N0YXJ0T2Zmc2V0O1xuICAgIGNvbnN0IHZhbHVlc1N0YXJ0ID0gYmluZGluZ3NTdGFydCArIDE7ICAvLyB0aGUgZmlyc3QgY29sdW1uIGlzIHRlbXBsYXRlIGJpbmRpbmdzXG4gICAgY29uc3QgdmFsdWVzRW5kID0gYmluZGluZ3NTdGFydCArIHZhbHVlc0NvdW50IC0gMTtcbiAgICBmb3IgKGxldCBpID0gdmFsdWVzU3RhcnQ7IGkgPCB2YWx1ZXNFbmQ7IGkrKykge1xuICAgICAgY29uc3Qgc3R5bGluZ01hcCA9IGdldFZhbHVlPFN0eWxpbmdNYXBBcnJheT4oZGF0YSwgY29udGV4dFtpXSBhcyBudW1iZXIpO1xuICAgICAgaWYgKHN0eWxpbmdNYXApIHtcbiAgICAgICAgc2V0TWFwQXNEaXJ0eShzdHlsaW5nTWFwKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBSZWdpc3RlcnMgdGhlIHByb3ZpZGVkIGJpbmRpbmcgKHByb3AgKyBiaW5kaW5nSW5kZXgpIGludG8gdGhlIGNvbnRleHQuXG4gKlxuICogSXQgaXMgbmVlZGVkIGJlY2F1c2UgaXQgd2lsbCBlaXRoZXIgdXBkYXRlIG9yIGluc2VydCBhIHN0eWxpbmcgcHJvcGVydHlcbiAqIGludG8gdGhlIGNvbnRleHQgYXQgdGhlIGNvcnJlY3Qgc3BvdC5cbiAqXG4gKiBXaGVuIGNhbGxlZCwgb25lIG9mIHR3byB0aGluZ3Mgd2lsbCBoYXBwZW46XG4gKlxuICogMSkgSWYgdGhlIHByb3BlcnR5IGFscmVhZHkgZXhpc3RzIGluIHRoZSBjb250ZXh0IHRoZW4gaXQgd2lsbCBqdXN0IGFkZFxuICogICAgdGhlIHByb3ZpZGVkIGBiaW5kaW5nVmFsdWVgIHRvIHRoZSBlbmQgb2YgdGhlIGJpbmRpbmcgc291cmNlcyByZWdpb25cbiAqICAgIGZvciB0aGF0IHBhcnRpY3VsYXIgcHJvcGVydHkuXG4gKlxuICogICAgLSBJZiB0aGUgYmluZGluZyB2YWx1ZSBpcyBhIG51bWJlciB0aGVuIGl0IHdpbGwgYmUgYWRkZWQgYXMgYSBuZXdcbiAqICAgICAgYmluZGluZyBpbmRleCBzb3VyY2UgbmV4dCB0byB0aGUgb3RoZXIgYmluZGluZyBzb3VyY2VzIGZvciB0aGUgcHJvcGVydHkuXG4gKlxuICogICAgLSBPdGhlcndpc2UsIGlmIHRoZSBiaW5kaW5nIHZhbHVlIGlzIGEgc3RyaW5nL2Jvb2xlYW4vbnVsbCB0eXBlIHRoZW4gaXQgd2lsbFxuICogICAgICByZXBsYWNlIHRoZSBkZWZhdWx0IHZhbHVlIGZvciB0aGUgcHJvcGVydHkgaWYgdGhlIGRlZmF1bHQgdmFsdWUgaXMgYG51bGxgLlxuICpcbiAqIDIpIElmIHRoZSBwcm9wZXJ0eSBkb2VzIG5vdCBleGlzdCB0aGVuIGl0IHdpbGwgYmUgaW5zZXJ0ZWQgaW50byB0aGUgY29udGV4dC5cbiAqICAgIFRoZSBzdHlsaW5nIGNvbnRleHQgcmVsaWVzIG9uIGFsbCBwcm9wZXJ0aWVzIGJlaW5nIHN0b3JlZCBpbiBhbHBoYWJldGljYWxcbiAqICAgIG9yZGVyLCBzbyBpdCBrbm93cyBleGFjdGx5IHdoZXJlIHRvIHN0b3JlIGl0LlxuICpcbiAqICAgIFdoZW4gaW5zZXJ0ZWQsIGEgZGVmYXVsdCBgbnVsbGAgdmFsdWUgaXMgY3JlYXRlZCBmb3IgdGhlIHByb3BlcnR5IHdoaWNoIGV4aXN0c1xuICogICAgYXMgdGhlIGRlZmF1bHQgdmFsdWUgZm9yIHRoZSBiaW5kaW5nLiBJZiB0aGUgYmluZGluZ1ZhbHVlIHByb3BlcnR5IGlzIGluc2VydGVkXG4gKiAgICBhbmQgaXQgaXMgZWl0aGVyIGEgc3RyaW5nLCBudW1iZXIgb3IgbnVsbCB2YWx1ZSB0aGVuIHRoYXQgd2lsbCByZXBsYWNlIHRoZSBkZWZhdWx0XG4gKiAgICB2YWx1ZS5cbiAqXG4gKiBOb3RlIHRoYXQgdGhpcyBmdW5jdGlvbiBpcyBhbHNvIHVzZWQgZm9yIG1hcC1iYXNlZCBzdHlsaW5nIGJpbmRpbmdzLiBUaGV5IGFyZSB0cmVhdGVkXG4gKiBtdWNoIHRoZSBzYW1lIGFzIHByb3AtYmFzZWQgYmluZGluZ3MsIGJ1dCwgdGhlaXIgcHJvcGVydHkgbmFtZSB2YWx1ZSBpcyBzZXQgYXMgYFtNQVBdYC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlZ2lzdGVyQmluZGluZyhcbiAgICBjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQsIGNvdW50SWQ6IG51bWJlciwgc291cmNlSW5kZXg6IG51bWJlciwgcHJvcDogc3RyaW5nIHwgbnVsbCxcbiAgICBiaW5kaW5nVmFsdWU6IG51bWJlciB8IG51bGwgfCBzdHJpbmcgfCBib29sZWFuLCBzYW5pdGl6YXRpb25SZXF1aXJlZD86IGJvb2xlYW4pOiB2b2lkIHtcbiAgbGV0IGZvdW5kID0gZmFsc2U7XG4gIHByb3AgPSBwcm9wIHx8IE1BUF9CQVNFRF9FTlRSWV9QUk9QX05BTUU7XG5cbiAgbGV0IHRvdGFsU291cmNlcyA9IGdldFRvdGFsU291cmNlcyhjb250ZXh0KTtcblxuICAvLyBpZiBhIG5ldyBzb3VyY2UgaXMgZGV0ZWN0ZWQgdGhlbiBhIG5ldyBjb2x1bW4gbmVlZHMgdG8gYmUgYWxsb2NhdGVkIGludG9cbiAgLy8gdGhlIHN0eWxpbmcgY29udGV4dC4gVGhlIGNvbHVtbiBpcyBiYXNpY2FsbHkgYSBuZXcgYWxsb2NhdGlvbiBvZiBiaW5kaW5nXG4gIC8vIHNvdXJjZXMgdGhhdCB3aWxsIGJlIGF2YWlsYWJsZSB0byBlYWNoIHByb3BlcnR5LlxuICB3aGlsZSAodG90YWxTb3VyY2VzIDw9IHNvdXJjZUluZGV4KSB7XG4gICAgYWRkTmV3U291cmNlQ29sdW1uKGNvbnRleHQpO1xuICAgIHRvdGFsU291cmNlcysrO1xuICB9XG5cbiAgY29uc3QgaXNCaW5kaW5nSW5kZXhWYWx1ZSA9IHR5cGVvZiBiaW5kaW5nVmFsdWUgPT09ICdudW1iZXInO1xuICBjb25zdCBlbnRyaWVzUGVyUm93ID0gVFN0eWxpbmdDb250ZXh0SW5kZXguQmluZGluZ3NTdGFydE9mZnNldCArIGdldFZhbHVlc0NvdW50KGNvbnRleHQpO1xuICBsZXQgaSA9IFRTdHlsaW5nQ29udGV4dEluZGV4LlZhbHVlc1N0YXJ0UG9zaXRpb247XG5cbiAgLy8gYWxsIHN0eWxlL2NsYXNzIGJpbmRpbmdzIGFyZSBzb3J0ZWQgYnkgcHJvcGVydHkgbmFtZVxuICB3aGlsZSAoaSA8IGNvbnRleHQubGVuZ3RoKSB7XG4gICAgY29uc3QgcCA9IGdldFByb3AoY29udGV4dCwgaSk7XG4gICAgaWYgKHByb3AgPD0gcCkge1xuICAgICAgaWYgKHByb3AgPCBwKSB7XG4gICAgICAgIGFsbG9jYXRlTmV3Q29udGV4dEVudHJ5KGNvbnRleHQsIGksIHByb3AsIHNhbml0aXphdGlvblJlcXVpcmVkKTtcbiAgICAgIH0gZWxzZSBpZiAoaXNCaW5kaW5nSW5kZXhWYWx1ZSkge1xuICAgICAgICBwYXRjaENvbmZpZyhjb250ZXh0LCBUU3R5bGluZ0NvbmZpZy5IYXNDb2xsaXNpb25zKTtcbiAgICAgIH1cbiAgICAgIGFkZEJpbmRpbmdJbnRvQ29udGV4dChjb250ZXh0LCBpLCBiaW5kaW5nVmFsdWUsIGNvdW50SWQsIHNvdXJjZUluZGV4KTtcbiAgICAgIGZvdW5kID0gdHJ1ZTtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgICBpICs9IGVudHJpZXNQZXJSb3c7XG4gIH1cblxuICBpZiAoIWZvdW5kKSB7XG4gICAgYWxsb2NhdGVOZXdDb250ZXh0RW50cnkoY29udGV4dCwgY29udGV4dC5sZW5ndGgsIHByb3AsIHNhbml0aXphdGlvblJlcXVpcmVkKTtcbiAgICBhZGRCaW5kaW5nSW50b0NvbnRleHQoY29udGV4dCwgaSwgYmluZGluZ1ZhbHVlLCBjb3VudElkLCBzb3VyY2VJbmRleCk7XG4gIH1cbn1cblxuLyoqXG4gKiBJbnNlcnRzIGEgbmV3IHJvdyBpbnRvIHRoZSBwcm92aWRlZCBgVFN0eWxpbmdDb250ZXh0YCBhbmQgYXNzaWducyB0aGUgcHJvdmlkZWQgYHByb3BgIHZhbHVlIGFzXG4gKiB0aGUgcHJvcGVydHkgZW50cnkuXG4gKi9cbmZ1bmN0aW9uIGFsbG9jYXRlTmV3Q29udGV4dEVudHJ5KFxuICAgIGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCwgaW5kZXg6IG51bWJlciwgcHJvcDogc3RyaW5nLCBzYW5pdGl6YXRpb25SZXF1aXJlZD86IGJvb2xlYW4pOiB2b2lkIHtcbiAgY29uc3QgY29uZmlnID0gc2FuaXRpemF0aW9uUmVxdWlyZWQgPyBUU3R5bGluZ0NvbnRleHRQcm9wQ29uZmlnRmxhZ3MuU2FuaXRpemF0aW9uUmVxdWlyZWQgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFRTdHlsaW5nQ29udGV4dFByb3BDb25maWdGbGFncy5EZWZhdWx0O1xuICBjb250ZXh0LnNwbGljZShcbiAgICAgIGluZGV4LCAwLFxuICAgICAgY29uZmlnLCAgICAgICAgICAgICAgICAgICAgLy8gMSkgY29uZmlnIHZhbHVlXG4gICAgICBERUZBVUxUX0dVQVJEX01BU0tfVkFMVUUsICAvLyAyKSB0ZW1wbGF0ZSBiaXQgbWFza1xuICAgICAgREVGQVVMVF9HVUFSRF9NQVNLX1ZBTFVFLCAgLy8gMykgaG9zdCBiaW5kaW5ncyBiaXQgbWFza1xuICAgICAgcHJvcCwgICAgICAgICAgICAgICAgICAgICAgLy8gNCkgcHJvcCB2YWx1ZSAoZS5nLiBgd2lkdGhgLCBgbXlDbGFzc2AsIGV0Yy4uLilcbiAgICAgICk7XG5cbiAgaW5kZXggKz0gNDsgIC8vIHRoZSA0IHZhbHVlcyBhYm92ZVxuXG4gIC8vIDUuLi4pIGRlZmF1bHQgYmluZGluZyBpbmRleCBmb3IgdGhlIHRlbXBsYXRlIHZhbHVlXG4gIC8vIGRlcGVuZGluZyBvbiBob3cgbWFueSBzb3VyY2VzIGFscmVhZHkgZXhpc3QgaW4gdGhlIGNvbnRleHQsXG4gIC8vIG11bHRpcGxlIGRlZmF1bHQgaW5kZXggZW50cmllcyBtYXkgbmVlZCB0byBiZSBpbnNlcnRlZCBmb3JcbiAgLy8gdGhlIG5ldyB2YWx1ZSBpbiB0aGUgY29udGV4dC5cbiAgY29uc3QgdG90YWxCaW5kaW5nc1BlckVudHJ5ID0gZ2V0VG90YWxTb3VyY2VzKGNvbnRleHQpO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IHRvdGFsQmluZGluZ3NQZXJFbnRyeTsgaSsrKSB7XG4gICAgY29udGV4dC5zcGxpY2UoaW5kZXgsIDAsIERFRkFVTFRfQklORElOR19JTkRFWCk7XG4gICAgaW5kZXgrKztcbiAgfVxuXG4gIC8vIDYpIGRlZmF1bHQgYmluZGluZyB2YWx1ZSBmb3IgdGhlIG5ldyBlbnRyeVxuICBjb250ZXh0LnNwbGljZShpbmRleCwgMCwgREVGQVVMVF9CSU5ESU5HX1ZBTFVFKTtcbn1cblxuLyoqXG4gKiBJbnNlcnRzIGEgbmV3IGJpbmRpbmcgdmFsdWUgaW50byBhIHN0eWxpbmcgcHJvcGVydHkgdHVwbGUgaW4gdGhlIGBUU3R5bGluZ0NvbnRleHRgLlxuICpcbiAqIEEgYmluZGluZ1ZhbHVlIGlzIGluc2VydGVkIGludG8gYSBjb250ZXh0IGR1cmluZyB0aGUgZmlyc3QgdXBkYXRlIHBhc3NcbiAqIG9mIGEgdGVtcGxhdGUgb3IgaG9zdCBiaW5kaW5ncyBmdW5jdGlvbi4gV2hlbiB0aGlzIG9jY3VycywgdHdvIHRoaW5nc1xuICogaGFwcGVuOlxuICpcbiAqIC0gSWYgdGhlIGJpbmRpbmdWYWx1ZSB2YWx1ZSBpcyBhIG51bWJlciB0aGVuIGl0IGlzIHRyZWF0ZWQgYXMgYSBiaW5kaW5nSW5kZXhcbiAqICAgdmFsdWUgKGEgaW5kZXggaW4gdGhlIGBMVmlld2ApIGFuZCBpdCB3aWxsIGJlIGluc2VydGVkIG5leHQgdG8gdGhlIG90aGVyXG4gKiAgIGJpbmRpbmcgaW5kZXggZW50cmllcy5cbiAqXG4gKiAtIE90aGVyd2lzZSB0aGUgYmluZGluZyB2YWx1ZSB3aWxsIHVwZGF0ZSB0aGUgZGVmYXVsdCB2YWx1ZSBmb3IgdGhlIHByb3BlcnR5XG4gKiAgIGFuZCB0aGlzIHdpbGwgb25seSBoYXBwZW4gaWYgdGhlIGRlZmF1bHQgdmFsdWUgaXMgYG51bGxgLlxuICovXG5mdW5jdGlvbiBhZGRCaW5kaW5nSW50b0NvbnRleHQoXG4gICAgY29udGV4dDogVFN0eWxpbmdDb250ZXh0LCBpbmRleDogbnVtYmVyLCBiaW5kaW5nVmFsdWU6IG51bWJlciB8IHN0cmluZyB8IGJvb2xlYW4gfCBudWxsLFxuICAgIGJpdEluZGV4OiBudW1iZXIsIHNvdXJjZUluZGV4OiBudW1iZXIpIHtcbiAgaWYgKHR5cGVvZiBiaW5kaW5nVmFsdWUgPT09ICdudW1iZXInKSB7XG4gICAgY29uc3QgaG9zdEJpbmRpbmdzTW9kZSA9IGlzSG9zdFN0eWxpbmdBY3RpdmUoc291cmNlSW5kZXgpO1xuICAgIGNvbnN0IGNlbGxJbmRleCA9IGluZGV4ICsgVFN0eWxpbmdDb250ZXh0SW5kZXguQmluZGluZ3NTdGFydE9mZnNldCArIHNvdXJjZUluZGV4O1xuICAgIGNvbnRleHRbY2VsbEluZGV4XSA9IGJpbmRpbmdWYWx1ZTtcbiAgICBjb25zdCB1cGRhdGVkQml0TWFzayA9IGdldEd1YXJkTWFzayhjb250ZXh0LCBpbmRleCwgaG9zdEJpbmRpbmdzTW9kZSkgfCAoMSA8PCBiaXRJbmRleCk7XG4gICAgc2V0R3VhcmRNYXNrKGNvbnRleHQsIGluZGV4LCB1cGRhdGVkQml0TWFzaywgaG9zdEJpbmRpbmdzTW9kZSk7XG4gIH0gZWxzZSBpZiAoYmluZGluZ1ZhbHVlICE9PSBudWxsICYmIGdldERlZmF1bHRWYWx1ZShjb250ZXh0LCBpbmRleCkgPT09IG51bGwpIHtcbiAgICBzZXREZWZhdWx0VmFsdWUoY29udGV4dCwgaW5kZXgsIGJpbmRpbmdWYWx1ZSk7XG4gIH1cbn1cblxuLyoqXG4gKiBSZWdpc3RlcnMgYSBuZXcgY29sdW1uIGludG8gdGhlIHByb3ZpZGVkIGBUU3R5bGluZ0NvbnRleHRgLlxuICpcbiAqIElmIGFuZCB3aGVuIGEgbmV3IHNvdXJjZSBpcyBkZXRlY3RlZCB0aGVuIGEgbmV3IGNvbHVtbiBuZWVkcyB0b1xuICogYmUgYWxsb2NhdGVkIGludG8gdGhlIHN0eWxpbmcgY29udGV4dC4gVGhlIGNvbHVtbiBpcyBiYXNpY2FsbHlcbiAqIGEgbmV3IGFsbG9jYXRpb24gb2YgYmluZGluZyBzb3VyY2VzIHRoYXQgd2lsbCBiZSBhdmFpbGFibGUgdG8gZWFjaFxuICogcHJvcGVydHkuXG4gKlxuICogRWFjaCBjb2x1bW4gdGhhdCBleGlzdHMgaW4gdGhlIHN0eWxpbmcgY29udGV4dCByZXNlbWJsZXMgYSBzdHlsaW5nXG4gKiBzb3VyY2UuIEEgc3R5bGluZyBzb3VyY2UgYW4gZWl0aGVyIGJlIHRoZSB0ZW1wbGF0ZSBvciBvbmUgb3IgbW9yZVxuICogY29tcG9uZW50cyBvciBkaXJlY3RpdmVzIGFsbCBjb250YWluaW5nIHN0eWxpbmcgaG9zdCBiaW5kaW5ncy5cbiAqL1xuZnVuY3Rpb24gYWRkTmV3U291cmNlQ29sdW1uKGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCk6IHZvaWQge1xuICAvLyB3ZSB1c2UgLTEgaGVyZSBiZWNhdXNlIHdlIHdhbnQgdG8gaW5zZXJ0IHJpZ2h0IGJlZm9yZSB0aGUgbGFzdCB2YWx1ZSAodGhlIGRlZmF1bHQgdmFsdWUpXG4gIGNvbnN0IGluc2VydE9mZnNldCA9IFRTdHlsaW5nQ29udGV4dEluZGV4LkJpbmRpbmdzU3RhcnRPZmZzZXQgKyBnZXRWYWx1ZXNDb3VudChjb250ZXh0KSAtIDE7XG5cbiAgbGV0IGluZGV4ID0gVFN0eWxpbmdDb250ZXh0SW5kZXguVmFsdWVzU3RhcnRQb3NpdGlvbjtcbiAgd2hpbGUgKGluZGV4IDwgY29udGV4dC5sZW5ndGgpIHtcbiAgICBpbmRleCArPSBpbnNlcnRPZmZzZXQ7XG4gICAgY29udGV4dC5zcGxpY2UoaW5kZXgrKywgMCwgREVGQVVMVF9CSU5ESU5HX0lOREVYKTtcblxuICAgIC8vIHRoZSB2YWx1ZSB3YXMgaW5zZXJ0ZWQganVzdCBiZWZvcmUgdGhlIGRlZmF1bHQgdmFsdWUsIGJ1dCB0aGVcbiAgICAvLyBuZXh0IGVudHJ5IGluIHRoZSBjb250ZXh0IHN0YXJ0cyBqdXN0IGFmdGVyIGl0LiBUaGVyZWZvcmUrKy5cbiAgICBpbmRleCsrO1xuICB9XG4gIGNvbnRleHRbVFN0eWxpbmdDb250ZXh0SW5kZXguVG90YWxTb3VyY2VzUG9zaXRpb25dKys7XG59XG5cbi8qKlxuICogQXBwbGllcyBhbGwgcGVuZGluZyBzdHlsZSBhbmQgY2xhc3MgYmluZGluZ3MgdG8gdGhlIHByb3ZpZGVkIGVsZW1lbnQuXG4gKlxuICogVGhpcyBmdW5jdGlvbiB3aWxsIGF0dGVtcHQgdG8gZmx1c2ggc3R5bGluZyB2aWEgdGhlIHByb3ZpZGVkIGBjbGFzc2VzQ29udGV4dGBcbiAqIGFuZCBgc3R5bGVzQ29udGV4dGAgY29udGV4dCB2YWx1ZXMuIFRoaXMgZnVuY3Rpb24gaXMgZGVzaWduZWQgdG8gYmUgcnVuIGZyb21cbiAqIHRoZSBpbnRlcm5hbCBgc3R5bGluZ0FwcGx5YCBmdW5jdGlvbiAod2hpY2ggaXMgc2NoZWR1bGVkIHRvIHJ1biBhdCB0aGUgdmVyeVxuICogZW5kIG9mIGNoYW5nZSBkZXRlY3Rpb24gZm9yIGFuIGVsZW1lbnQgaWYgb25lIG9yIG1vcmUgc3R5bGUvY2xhc3MgYmluZGluZ3NcbiAqIHdlcmUgcHJvY2Vzc2VkKSBhbmQgd2lsbCByZWx5IG9uIGFueSBzdGF0ZSB2YWx1ZXMgdGhhdCBhcmUgc2V0IGZyb20gd2hlblxuICogYW55IG9mIHRoZSBzdHlsaW5nIGJpbmRpbmdzIGV4ZWN1dGVkLlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gaXMgZGVzaWduZWQgdG8gYmUgY2FsbGVkIHR3aWNlOiBvbmUgd2hlbiBjaGFuZ2UgZGV0ZWN0aW9uIGhhc1xuICogcHJvY2Vzc2VkIGFuIGVsZW1lbnQgd2l0aGluIHRoZSB0ZW1wbGF0ZSBiaW5kaW5ncyAoaS5lLiBqdXN0IGFzIGBhZHZhbmNlKClgXG4gKiBpcyBjYWxsZWQpIGFuZCB3aGVuIGhvc3QgYmluZGluZ3MgaGF2ZSBiZWVuIHByb2Nlc3NlZC4gSW4gYm90aCBjYXNlcyB0aGVcbiAqIHN0eWxlcyBhbmQgY2xhc3NlcyBpbiBib3RoIGNvbnRleHRzIHdpbGwgYmUgYXBwbGllZCB0byB0aGUgZWxlbWVudCwgYnV0IHRoZVxuICogYWxnb3JpdGhtIHdpbGwgc2VsZWN0aXZlbHkgZGVjaWRlIHdoaWNoIGJpbmRpbmdzIHRvIHJ1biBkZXBlbmRpbmcgb24gdGhlXG4gKiBjb2x1bW5zIGluIHRoZSBjb250ZXh0LiBUaGUgcHJvdmlkZWQgYGRpcmVjdGl2ZUluZGV4YCB2YWx1ZSB3aWxsIGhlbHAgdGhlXG4gKiBhbGdvcml0aG0gZGV0ZXJtaW5lIHdoaWNoIGJpbmRpbmdzIHRvIGFwcGx5OiBlaXRoZXIgdGhlIHRlbXBsYXRlIGJpbmRpbmdzIG9yXG4gKiB0aGUgaG9zdCBiaW5kaW5ncyAoc2VlIGBhcHBseVN0eWxpbmdUb0VsZW1lbnRgIGZvciBtb3JlIGluZm9ybWF0aW9uKS5cbiAqXG4gKiBOb3RlIHRoYXQgb25jZSB0aGlzIGZ1bmN0aW9uIGlzIGNhbGxlZCBhbGwgdGVtcG9yYXJ5IHN0eWxpbmcgc3RhdGUgZGF0YVxuICogKGkuZS4gdGhlIGBiaXRNYXNrYCBhbmQgYGNvdW50ZXJgIHZhbHVlcyBmb3Igc3R5bGVzIGFuZCBjbGFzc2VzIHdpbGwgYmUgY2xlYXJlZCkuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBmbHVzaFN0eWxpbmcoXG4gICAgcmVuZGVyZXI6IFJlbmRlcmVyMyB8IFByb2NlZHVyYWxSZW5kZXJlcjMgfCBudWxsLCBkYXRhOiBMU3R5bGluZ0RhdGEsXG4gICAgY2xhc3Nlc0NvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCB8IG51bGwsIHN0eWxlc0NvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCB8IG51bGwsXG4gICAgZWxlbWVudDogUkVsZW1lbnQsIGRpcmVjdGl2ZUluZGV4OiBudW1iZXIsIHN0eWxlU2FuaXRpemVyOiBTdHlsZVNhbml0aXplRm4gfCBudWxsKTogdm9pZCB7XG4gIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUuZmx1c2hTdHlsaW5nKys7XG5cbiAgY29uc3Qgc3RhdGUgPSBnZXRTdHlsaW5nU3RhdGUoZWxlbWVudCwgZGlyZWN0aXZlSW5kZXgpO1xuICBjb25zdCBob3N0QmluZGluZ3NNb2RlID0gaXNIb3N0U3R5bGluZ0FjdGl2ZShzdGF0ZS5zb3VyY2VJbmRleCk7XG5cbiAgaWYgKHN0eWxlc0NvbnRleHQpIHtcbiAgICBpZiAoIWlzQ29udGV4dExvY2tlZChzdHlsZXNDb250ZXh0LCBob3N0QmluZGluZ3NNb2RlKSkge1xuICAgICAgbG9ja0FuZEZpbmFsaXplQ29udGV4dChzdHlsZXNDb250ZXh0LCBob3N0QmluZGluZ3NNb2RlKTtcbiAgICB9XG4gICAgaWYgKHN0YXRlLnN0eWxlc0JpdE1hc2sgIT09IDApIHtcbiAgICAgIGFwcGx5U3R5bGluZ1ZpYUNvbnRleHQoXG4gICAgICAgICAgc3R5bGVzQ29udGV4dCwgcmVuZGVyZXIsIGVsZW1lbnQsIGRhdGEsIHN0YXRlLnN0eWxlc0JpdE1hc2ssIHNldFN0eWxlLCBzdHlsZVNhbml0aXplcixcbiAgICAgICAgICBob3N0QmluZGluZ3NNb2RlKTtcbiAgICB9XG4gIH1cblxuICBpZiAoY2xhc3Nlc0NvbnRleHQpIHtcbiAgICBpZiAoIWlzQ29udGV4dExvY2tlZChjbGFzc2VzQ29udGV4dCwgaG9zdEJpbmRpbmdzTW9kZSkpIHtcbiAgICAgIGxvY2tBbmRGaW5hbGl6ZUNvbnRleHQoY2xhc3Nlc0NvbnRleHQsIGhvc3RCaW5kaW5nc01vZGUpO1xuICAgIH1cbiAgICBpZiAoc3RhdGUuY2xhc3Nlc0JpdE1hc2sgIT09IDApIHtcbiAgICAgIGFwcGx5U3R5bGluZ1ZpYUNvbnRleHQoXG4gICAgICAgICAgY2xhc3Nlc0NvbnRleHQsIHJlbmRlcmVyLCBlbGVtZW50LCBkYXRhLCBzdGF0ZS5jbGFzc2VzQml0TWFzaywgc2V0Q2xhc3MsIG51bGwsXG4gICAgICAgICAgaG9zdEJpbmRpbmdzTW9kZSk7XG4gICAgfVxuICB9XG5cbiAgcmVzZXRTdHlsaW5nU3RhdGUoKTtcbn1cblxuLyoqXG4gKiBMb2NrcyB0aGUgY29udGV4dCAoc28gbm8gbW9yZSBiaW5kaW5ncyBjYW4gYmUgYWRkZWQpIGFuZCBhbHNvIGNvcGllcyBvdmVyIGluaXRpYWwgY2xhc3Mvc3R5bGVcbiAqIHZhbHVlcyBpbnRvIHRoZWlyIGJpbmRpbmcgYXJlYXMuXG4gKlxuICogVGhlcmUgYXJlIHR3byBtYWluIGFjdGlvbnMgdGhhdCB0YWtlIHBsYWNlIGluIHRoaXMgZnVuY3Rpb246XG4gKlxuICogLSBMb2NraW5nIHRoZSBjb250ZXh0OlxuICogICBMb2NraW5nIHRoZSBjb250ZXh0IGlzIHJlcXVpcmVkIHNvIHRoYXQgdGhlIHN0eWxlL2NsYXNzIGluc3RydWN0aW9ucyBrbm93IE5PVCB0b1xuICogICByZWdpc3RlciBhIGJpbmRpbmcgYWdhaW4gYWZ0ZXIgdGhlIGZpcnN0IHVwZGF0ZSBwYXNzIGhhcyBydW4uIElmIGEgbG9ja2luZyBiaXQgd2FzXG4gKiAgIG5vdCB1c2VkIHRoZW4gaXQgd291bGQgbmVlZCB0byBzY2FuIG92ZXIgdGhlIGNvbnRleHQgZWFjaCB0aW1lIGFuIGluc3RydWN0aW9uIGlzIHJ1blxuICogICAod2hpY2ggaXMgZXhwZW5zaXZlKS5cbiAqXG4gKiAtIFBhdGNoaW5nIGluaXRpYWwgdmFsdWVzOlxuICogICBEaXJlY3RpdmVzIGFuZCBjb21wb25lbnQgaG9zdCBiaW5kaW5ncyBtYXkgaW5jbHVkZSBzdGF0aWMgY2xhc3Mvc3R5bGUgdmFsdWVzIHdoaWNoIGFyZVxuICogICBib3VuZCB0byB0aGUgaG9zdCBlbGVtZW50LiBXaGVuIHRoaXMgaGFwcGVucywgdGhlIHN0eWxpbmcgY29udGV4dCB3aWxsIG5lZWQgdG8gYmUgaW5mb3JtZWRcbiAqICAgc28gaXQgY2FuIHVzZSB0aGVzZSBzdGF0aWMgc3R5bGluZyB2YWx1ZXMgYXMgZGVmYXVsdHMgd2hlbiBhIG1hdGNoaW5nIGJpbmRpbmcgaXMgZmFsc3kuXG4gKiAgIFRoZXNlIGluaXRpYWwgc3R5bGluZyB2YWx1ZXMgYXJlIHJlYWQgZnJvbSB0aGUgaW5pdGlhbCBzdHlsaW5nIHZhbHVlcyBzbG90IHdpdGhpbiB0aGVcbiAqICAgcHJvdmlkZWQgYFRTdHlsaW5nQ29udGV4dGAgKHdoaWNoIGlzIGFuIGluc3RhbmNlIG9mIGEgYFN0eWxpbmdNYXBBcnJheWApLiBUaGlzIGlubmVyIG1hcCB3aWxsXG4gKiAgIGJlIHVwZGF0ZWQgZWFjaCB0aW1lIGEgaG9zdCBiaW5kaW5nIGFwcGxpZXMgaXRzIHN0YXRpYyBzdHlsaW5nIHZhbHVlcyAodmlhIGBlbGVtZW50SG9zdEF0dHJzYClcbiAqICAgc28gdGhlc2UgdmFsdWVzIGFyZSBvbmx5IHJlYWQgYXQgdGhpcyBwb2ludCBiZWNhdXNlIHRoaXMgaXMgdGhlIHZlcnkgbGFzdCBwb2ludCBiZWZvcmUgdGhlXG4gKiAgIGZpcnN0IHN0eWxlL2NsYXNzIHZhbHVlcyBhcmUgZmx1c2hlZCB0byB0aGUgZWxlbWVudC5cbiAqXG4gKiBOb3RlIHRoYXQgdGhlIGBUU3R5bGluZ0NvbnRleHRgIHN0eWxpbmcgY29udGV4dCBjb250YWlucyB0d28gbG9ja3M6IG9uZSBmb3IgdGVtcGxhdGUgYmluZGluZ3NcbiAqIGFuZCBhbm90aGVyIGZvciBob3N0IGJpbmRpbmdzLiBFaXRoZXIgb25lIG9mIHRoZXNlIGxvY2tzIHdpbGwgYmUgc2V0IHdoZW4gc3R5bGluZyBpcyBhcHBsaWVkXG4gKiBkdXJpbmcgdGhlIHRlbXBsYXRlIGJpbmRpbmcgZmx1c2ggYW5kL29yIGR1cmluZyB0aGUgaG9zdCBiaW5kaW5ncyBmbHVzaC5cbiAqL1xuZnVuY3Rpb24gbG9ja0FuZEZpbmFsaXplQ29udGV4dChjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQsIGhvc3RCaW5kaW5nc01vZGU6IGJvb2xlYW4pOiB2b2lkIHtcbiAgY29uc3QgaW5pdGlhbFZhbHVlcyA9IGdldFN0eWxpbmdNYXBBcnJheShjb250ZXh0KSAhO1xuICB1cGRhdGVJbml0aWFsU3R5bGluZ09uQ29udGV4dChjb250ZXh0LCBpbml0aWFsVmFsdWVzKTtcbiAgbG9ja0NvbnRleHQoY29udGV4dCwgaG9zdEJpbmRpbmdzTW9kZSk7XG59XG5cbi8qKlxuICogUmVnaXN0ZXJzIGFsbCBpbml0aWFsIHN0eWxpbmcgZW50cmllcyBpbnRvIHRoZSBwcm92aWRlZCBjb250ZXh0LlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gd2lsbCBpdGVyYXRlIG92ZXIgYWxsIGVudHJpZXMgaW4gdGhlIHByb3ZpZGVkIGBpbml0aWFsU3R5bGluZ2AgYXJ9cmF5IGFuZCByZWdpc3RlclxuICogdGhlbSBhcyBkZWZhdWx0IChpbml0aWFsKSB2YWx1ZXMgaW4gdGhlIHByb3ZpZGVkIGNvbnRleHQuIEluaXRpYWwgc3R5bGluZyB2YWx1ZXMgaW4gYSBjb250ZXh0IGFyZVxuICogdGhlIGRlZmF1bHQgdmFsdWVzIHRoYXQgYXJlIHRvIGJlIGFwcGxpZWQgdW5sZXNzIG92ZXJ3cml0dGVuIGJ5IGEgYmluZGluZy5cbiAqXG4gKiBUaGUgcmVhc29uIHdoeSB0aGlzIGZ1bmN0aW9uIGV4aXN0cyBhbmQgaXNuJ3QgYSBwYXJ0IG9mIHRoZSBjb250ZXh0IGNvbnN0cnVjdGlvbiBpcyBiZWNhdXNlXG4gKiBob3N0IGJpbmRpbmcgaXMgZXZhbHVhdGVkIGF0IGEgbGF0ZXIgc3RhZ2UgYWZ0ZXIgdGhlIGVsZW1lbnQgaXMgY3JlYXRlZC4gVGhpcyBtZWFucyB0aGF0XG4gKiBpZiBhIGRpcmVjdGl2ZSBvciBjb21wb25lbnQgY29udGFpbnMgYW55IGluaXRpYWwgc3R5bGluZyBjb2RlIChpLmUuIGA8ZGl2IGNsYXNzPVwiZm9vXCI+YClcbiAqIHRoZW4gdGhhdCBpbml0aWFsIHN0eWxpbmcgZGF0YSBjYW4gb25seSBiZSBhcHBsaWVkIG9uY2UgdGhlIHN0eWxpbmcgZm9yIHRoYXQgZWxlbWVudFxuICogaXMgZmlyc3QgYXBwbGllZCAoYXQgdGhlIGVuZCBvZiB0aGUgdXBkYXRlIHBoYXNlKS4gT25jZSB0aGF0IGhhcHBlbnMgdGhlbiB0aGUgY29udGV4dCB3aWxsXG4gKiB1cGRhdGUgaXRzZWxmIHdpdGggdGhlIGNvbXBsZXRlIGluaXRpYWwgc3R5bGluZyBmb3IgdGhlIGVsZW1lbnQuXG4gKi9cbmZ1bmN0aW9uIHVwZGF0ZUluaXRpYWxTdHlsaW5nT25Db250ZXh0KFxuICAgIGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCwgaW5pdGlhbFN0eWxpbmc6IFN0eWxpbmdNYXBBcnJheSk6IHZvaWQge1xuICAvLyBgLTFgIGlzIHVzZWQgaGVyZSBiZWNhdXNlIGFsbCBpbml0aWFsIHN0eWxpbmcgZGF0YSBpcyBub3QgYSBhcGFydFxuICAvLyBvZiBhIGJpbmRpbmcgKHNpbmNlIGl0J3Mgc3RhdGljKVxuICBjb25zdCBDT1VOVF9JRF9GT1JfU1RZTElORyA9IC0xO1xuXG4gIGxldCBoYXNJbml0aWFsU3R5bGluZyA9IGZhbHNlO1xuICBmb3IgKGxldCBpID0gU3R5bGluZ01hcEFycmF5SW5kZXguVmFsdWVzU3RhcnRQb3NpdGlvbjsgaSA8IGluaXRpYWxTdHlsaW5nLmxlbmd0aDtcbiAgICAgICBpICs9IFN0eWxpbmdNYXBBcnJheUluZGV4LlR1cGxlU2l6ZSkge1xuICAgIGNvbnN0IHZhbHVlID0gZ2V0TWFwVmFsdWUoaW5pdGlhbFN0eWxpbmcsIGkpO1xuICAgIGlmICh2YWx1ZSkge1xuICAgICAgY29uc3QgcHJvcCA9IGdldE1hcFByb3AoaW5pdGlhbFN0eWxpbmcsIGkpO1xuICAgICAgcmVnaXN0ZXJCaW5kaW5nKGNvbnRleHQsIENPVU5UX0lEX0ZPUl9TVFlMSU5HLCAwLCBwcm9wLCB2YWx1ZSwgZmFsc2UpO1xuICAgICAgaGFzSW5pdGlhbFN0eWxpbmcgPSB0cnVlO1xuICAgIH1cbiAgfVxuXG4gIGlmIChoYXNJbml0aWFsU3R5bGluZykge1xuICAgIHBhdGNoQ29uZmlnKGNvbnRleHQsIFRTdHlsaW5nQ29uZmlnLkhhc0luaXRpYWxTdHlsaW5nKTtcbiAgfVxufVxuXG4vKipcbiAqIFJ1bnMgdGhyb3VnaCB0aGUgcHJvdmlkZWQgc3R5bGluZyBjb250ZXh0IGFuZCBhcHBsaWVzIGVhY2ggdmFsdWUgdG9cbiAqIHRoZSBwcm92aWRlZCBlbGVtZW50ICh2aWEgdGhlIHJlbmRlcmVyKSBpZiBvbmUgb3IgbW9yZSB2YWx1ZXMgYXJlIHByZXNlbnQuXG4gKlxuICogVGhpcyBmdW5jdGlvbiB3aWxsIGl0ZXJhdGUgb3ZlciBhbGwgZW50cmllcyBwcmVzZW50IGluIHRoZSBwcm92aWRlZFxuICogYFRTdHlsaW5nQ29udGV4dGAgYXJyYXkgKGJvdGggcHJvcC1iYXNlZCBhbmQgbWFwLWJhc2VkIGJpbmRpbmdzKS4tXG4gKlxuICogRWFjaCBlbnRyeSwgd2l0aGluIHRoZSBgVFN0eWxpbmdDb250ZXh0YCBhcnJheSwgaXMgc3RvcmVkIGFscGhhYmV0aWNhbGx5XG4gKiBhbmQgdGhpcyBtZWFucyB0aGF0IGVhY2ggcHJvcC92YWx1ZSBlbnRyeSB3aWxsIGJlIGFwcGxpZWQgaW4gb3JkZXJcbiAqIChzbyBsb25nIGFzIGl0IGlzIG1hcmtlZCBkaXJ0eSBpbiB0aGUgcHJvdmlkZWQgYGJpdE1hc2tgIHZhbHVlKS5cbiAqXG4gKiBJZiB0aGVyZSBhcmUgYW55IG1hcC1iYXNlZCBlbnRyaWVzIHByZXNlbnQgKHdoaWNoIGFyZSBhcHBsaWVkIHRvIHRoZVxuICogZWxlbWVudCB2aWEgdGhlIGBbc3R5bGVdYCBhbmQgYFtjbGFzc11gIGJpbmRpbmdzKSB0aGVuIHRob3NlIGVudHJpZXNcbiAqIHdpbGwgYmUgYXBwbGllZCBhcyB3ZWxsLiBIb3dldmVyLCB0aGUgY29kZSBmb3IgdGhhdCBpcyBub3QgYSBwYXJ0IG9mXG4gKiB0aGlzIGZ1bmN0aW9uLiBJbnN0ZWFkLCBlYWNoIHRpbWUgYSBwcm9wZXJ0eSBpcyB2aXNpdGVkLCB0aGVuIHRoZVxuICogY29kZSBiZWxvdyB3aWxsIGNhbGwgYW4gZXh0ZXJuYWwgZnVuY3Rpb24gY2FsbGVkIGBzdHlsaW5nTWFwc1N5bmNGbmBcbiAqIGFuZCwgaWYgcHJlc2VudCwgaXQgd2lsbCBrZWVwIHRoZSBhcHBsaWNhdGlvbiBvZiBzdHlsaW5nIHZhbHVlcyBpblxuICogbWFwLWJhc2VkIGJpbmRpbmdzIHVwIHRvIHN5bmMgd2l0aCB0aGUgYXBwbGljYXRpb24gb2YgcHJvcC1iYXNlZFxuICogYmluZGluZ3MuXG4gKlxuICogVmlzaXQgYHN0eWxpbmcvbWFwX2Jhc2VkX2JpbmRpbmdzLnRzYCB0byBsZWFybiBtb3JlIGFib3V0IGhvdyB0aGVcbiAqIGFsZ29yaXRobSB3b3JrcyBmb3IgbWFwLWJhc2VkIHN0eWxpbmcgYmluZGluZ3MuXG4gKlxuICogTm90ZSB0aGF0IHRoaXMgZnVuY3Rpb24gaXMgbm90IGRlc2lnbmVkIHRvIGJlIGNhbGxlZCBpbiBpc29sYXRpb24gKHVzZVxuICogdGhlIGBmbHVzaFN0eWxpbmdgIGZ1bmN0aW9uIHNvIHRoYXQgaXQgY2FuIGNhbGwgdGhpcyBmdW5jdGlvbiBmb3IgYm90aFxuICogdGhlIHN0eWxlcyBhbmQgY2xhc3NlcyBjb250ZXh0cykuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhcHBseVN0eWxpbmdWaWFDb250ZXh0KFxuICAgIGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCwgcmVuZGVyZXI6IFJlbmRlcmVyMyB8IFByb2NlZHVyYWxSZW5kZXJlcjMgfCBudWxsLCBlbGVtZW50OiBSRWxlbWVudCxcbiAgICBiaW5kaW5nRGF0YTogTFN0eWxpbmdEYXRhLCBiaXRNYXNrVmFsdWU6IG51bWJlciB8IGJvb2xlYW4sIGFwcGx5U3R5bGluZ0ZuOiBBcHBseVN0eWxpbmdGbixcbiAgICBzYW5pdGl6ZXI6IFN0eWxlU2FuaXRpemVGbiB8IG51bGwsIGhvc3RCaW5kaW5nc01vZGU6IGJvb2xlYW4pOiB2b2lkIHtcbiAgY29uc3QgYml0TWFzayA9IG5vcm1hbGl6ZUJpdE1hc2tWYWx1ZShiaXRNYXNrVmFsdWUpO1xuXG4gIGxldCBzdHlsaW5nTWFwc1N5bmNGbjogU3luY1N0eWxpbmdNYXBzRm58bnVsbCA9IG51bGw7XG4gIGxldCBhcHBseUFsbFZhbHVlcyA9IGZhbHNlO1xuICBpZiAoaGFzQ29uZmlnKGNvbnRleHQsIFRTdHlsaW5nQ29uZmlnLkhhc01hcEJpbmRpbmdzKSkge1xuICAgIHN0eWxpbmdNYXBzU3luY0ZuID0gZ2V0U3R5bGluZ01hcHNTeW5jRm4oKTtcbiAgICBjb25zdCBtYXBzR3VhcmRNYXNrID1cbiAgICAgICAgZ2V0R3VhcmRNYXNrKGNvbnRleHQsIFRTdHlsaW5nQ29udGV4dEluZGV4LlZhbHVlc1N0YXJ0UG9zaXRpb24sIGhvc3RCaW5kaW5nc01vZGUpO1xuICAgIGFwcGx5QWxsVmFsdWVzID0gKGJpdE1hc2sgJiBtYXBzR3VhcmRNYXNrKSAhPT0gMDtcbiAgfVxuXG4gIGNvbnN0IHZhbHVlc0NvdW50ID0gZ2V0VmFsdWVzQ291bnQoY29udGV4dCk7XG4gIGxldCB0b3RhbEJpbmRpbmdzVG9WaXNpdCA9IDE7XG4gIGxldCBtYXBzTW9kZSA9XG4gICAgICBhcHBseUFsbFZhbHVlcyA/IFN0eWxpbmdNYXBzU3luY01vZGUuQXBwbHlBbGxWYWx1ZXMgOiBTdHlsaW5nTWFwc1N5bmNNb2RlLlRyYXZlcnNlVmFsdWVzO1xuICBpZiAoaG9zdEJpbmRpbmdzTW9kZSkge1xuICAgIG1hcHNNb2RlIHw9IFN0eWxpbmdNYXBzU3luY01vZGUuUmVjdXJzZUlubmVyTWFwcztcbiAgICB0b3RhbEJpbmRpbmdzVG9WaXNpdCA9IHZhbHVlc0NvdW50IC0gMTtcbiAgfVxuXG4gIGxldCBpID0gZ2V0UHJvcFZhbHVlc1N0YXJ0UG9zaXRpb24oY29udGV4dCk7XG4gIHdoaWxlIChpIDwgY29udGV4dC5sZW5ndGgpIHtcbiAgICBjb25zdCBndWFyZE1hc2sgPSBnZXRHdWFyZE1hc2soY29udGV4dCwgaSwgaG9zdEJpbmRpbmdzTW9kZSk7XG4gICAgaWYgKGJpdE1hc2sgJiBndWFyZE1hc2spIHtcbiAgICAgIGxldCB2YWx1ZUFwcGxpZWQgPSBmYWxzZTtcbiAgICAgIGNvbnN0IHByb3AgPSBnZXRQcm9wKGNvbnRleHQsIGkpO1xuICAgICAgY29uc3QgZGVmYXVsdFZhbHVlID0gZ2V0RGVmYXVsdFZhbHVlKGNvbnRleHQsIGkpO1xuXG4gICAgICAvLyBQYXJ0IDE6IFZpc2l0IHRoZSBgW3N0eWxpbmcucHJvcF1gIHZhbHVlXG4gICAgICBmb3IgKGxldCBqID0gMDsgaiA8IHRvdGFsQmluZGluZ3NUb1Zpc2l0OyBqKyspIHtcbiAgICAgICAgY29uc3QgYmluZGluZ0luZGV4ID0gZ2V0QmluZGluZ1ZhbHVlKGNvbnRleHQsIGksIGopIGFzIG51bWJlcjtcbiAgICAgICAgaWYgKCF2YWx1ZUFwcGxpZWQgJiYgYmluZGluZ0luZGV4ICE9PSAwKSB7XG4gICAgICAgICAgY29uc3QgdmFsdWUgPSBnZXRWYWx1ZShiaW5kaW5nRGF0YSwgYmluZGluZ0luZGV4KTtcbiAgICAgICAgICBpZiAoaXNTdHlsaW5nVmFsdWVEZWZpbmVkKHZhbHVlKSkge1xuICAgICAgICAgICAgY29uc3QgY2hlY2tWYWx1ZU9ubHkgPSBob3N0QmluZGluZ3NNb2RlICYmIGogPT09IDA7XG4gICAgICAgICAgICBpZiAoIWNoZWNrVmFsdWVPbmx5KSB7XG4gICAgICAgICAgICAgIGNvbnN0IGZpbmFsVmFsdWUgPSBzYW5pdGl6ZXIgJiYgaXNTYW5pdGl6YXRpb25SZXF1aXJlZChjb250ZXh0LCBpKSA/XG4gICAgICAgICAgICAgICAgICBzYW5pdGl6ZXIocHJvcCwgdmFsdWUsIFN0eWxlU2FuaXRpemVNb2RlLlNhbml0aXplT25seSkgOlxuICAgICAgICAgICAgICAgICAgdW53cmFwU2FmZVZhbHVlKHZhbHVlKTtcbiAgICAgICAgICAgICAgYXBwbHlTdHlsaW5nRm4ocmVuZGVyZXIsIGVsZW1lbnQsIHByb3AsIGZpbmFsVmFsdWUsIGJpbmRpbmdJbmRleCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YWx1ZUFwcGxpZWQgPSB0cnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFBhcnQgMjogVmlzaXQgdGhlIGBbc3R5bGVdYCBvciBgW2NsYXNzXWAgbWFwLWJhc2VkIHZhbHVlXG4gICAgICAgIGlmIChzdHlsaW5nTWFwc1N5bmNGbikge1xuICAgICAgICAgIC8vIGRldGVybWluZSB3aGV0aGVyIG9yIG5vdCB0byBhcHBseSB0aGUgdGFyZ2V0IHByb3BlcnR5IG9yIHRvIHNraXAgaXRcbiAgICAgICAgICBsZXQgbW9kZSA9IG1hcHNNb2RlIHwgKHZhbHVlQXBwbGllZCA/IFN0eWxpbmdNYXBzU3luY01vZGUuU2tpcFRhcmdldFByb3AgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgU3R5bGluZ01hcHNTeW5jTW9kZS5BcHBseVRhcmdldFByb3ApO1xuXG4gICAgICAgICAgLy8gdGhlIGZpcnN0IGNvbHVtbiBpbiB0aGUgY29udGV4dCAod2hlbiBgaiA9PSAwYCkgaXMgc3BlY2lhbC1jYXNlZCBmb3JcbiAgICAgICAgICAvLyB0ZW1wbGF0ZSBiaW5kaW5ncy4gSWYgYW5kIHdoZW4gaG9zdCBiaW5kaW5ncyBhcmUgYmVpbmcgcHJvY2Vzc2VkIHRoZW5cbiAgICAgICAgICAvLyB0aGUgZmlyc3QgY29sdW1uIHdpbGwgc3RpbGwgYmUgaXRlcmF0ZWQgb3ZlciwgYnV0IHRoZSB2YWx1ZXMgd2lsbCBvbmx5XG4gICAgICAgICAgLy8gYmUgY2hlY2tlZCBhZ2FpbnN0IChub3QgYXBwbGllZCkuIElmIGFuZCB3aGVuIHRoaXMgaGFwcGVucyB3ZSBuZWVkIHRvXG4gICAgICAgICAgLy8gbm90aWZ5IHRoZSBtYXAtYmFzZWQgc3luY2luZyBjb2RlIHRvIGtub3cgbm90IHRvIGFwcGx5IHRoZSB2YWx1ZXMgaXRcbiAgICAgICAgICAvLyBjb21lcyBhY3Jvc3MgaW4gdGhlIHZlcnkgZmlyc3QgbWFwLWJhc2VkIGJpbmRpbmcgKHdoaWNoIGlzIGFsc28gbG9jYXRlZFxuICAgICAgICAgIC8vIGluIGNvbHVtbiB6ZXJvKS5cbiAgICAgICAgICBpZiAoaG9zdEJpbmRpbmdzTW9kZSAmJiBqID09PSAwKSB7XG4gICAgICAgICAgICBtb2RlIHw9IFN0eWxpbmdNYXBzU3luY01vZGUuQ2hlY2tWYWx1ZXNPbmx5O1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGNvbnN0IHZhbHVlQXBwbGllZFdpdGhpbk1hcCA9IHN0eWxpbmdNYXBzU3luY0ZuKFxuICAgICAgICAgICAgICBjb250ZXh0LCByZW5kZXJlciwgZWxlbWVudCwgYmluZGluZ0RhdGEsIGosIGFwcGx5U3R5bGluZ0ZuLCBzYW5pdGl6ZXIsIG1vZGUsIHByb3AsXG4gICAgICAgICAgICAgIGRlZmF1bHRWYWx1ZSk7XG4gICAgICAgICAgdmFsdWVBcHBsaWVkID0gdmFsdWVBcHBsaWVkIHx8IHZhbHVlQXBwbGllZFdpdGhpbk1hcDtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBQYXJ0IDM6IGFwcGx5IHRoZSBkZWZhdWx0IHZhbHVlIChlLmcuIGA8ZGl2IHN0eWxlPVwid2lkdGg6MjAwXCI+YCA9PiBgMjAwcHhgIGdldHMgYXBwbGllZClcbiAgICAgIC8vIGlmIHRoZSB2YWx1ZSBoYXMgbm90IHlldCBiZWVuIGFwcGxpZWQgdGhlbiBhIHRydXRoeSB2YWx1ZSBkb2VzIG5vdCBleGlzdCBpbiB0aGVcbiAgICAgIC8vIHByb3AtYmFzZWQgb3IgbWFwLWJhc2VkIGJpbmRpbmdzIGNvZGUuIElmIGFuZCB3aGVuIHRoaXMgaGFwcGVucywganVzdCBhcHBseSB0aGVcbiAgICAgIC8vIGRlZmF1bHQgdmFsdWUgKGV2ZW4gaWYgdGhlIGRlZmF1bHQgdmFsdWUgaXMgYG51bGxgKS5cbiAgICAgIGlmICghdmFsdWVBcHBsaWVkKSB7XG4gICAgICAgIGFwcGx5U3R5bGluZ0ZuKHJlbmRlcmVyLCBlbGVtZW50LCBwcm9wLCBkZWZhdWx0VmFsdWUpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGkgKz0gVFN0eWxpbmdDb250ZXh0SW5kZXguQmluZGluZ3NTdGFydE9mZnNldCArIHZhbHVlc0NvdW50O1xuICB9XG5cbiAgLy8gdGhlIG1hcC1iYXNlZCBzdHlsaW5nIGVudHJpZXMgbWF5IGhhdmUgbm90IGFwcGxpZWQgYWxsIHRoZWlyXG4gIC8vIHZhbHVlcy4gRm9yIHRoaXMgcmVhc29uLCBvbmUgbW9yZSBjYWxsIHRvIHRoZSBzeW5jIGZ1bmN0aW9uXG4gIC8vIG5lZWRzIHRvIGJlIGlzc3VlZCBhdCB0aGUgZW5kLlxuICBpZiAoc3R5bGluZ01hcHNTeW5jRm4pIHtcbiAgICBpZiAoaG9zdEJpbmRpbmdzTW9kZSkge1xuICAgICAgbWFwc01vZGUgfD0gU3R5bGluZ01hcHNTeW5jTW9kZS5DaGVja1ZhbHVlc09ubHk7XG4gICAgfVxuICAgIHN0eWxpbmdNYXBzU3luY0ZuKFxuICAgICAgICBjb250ZXh0LCByZW5kZXJlciwgZWxlbWVudCwgYmluZGluZ0RhdGEsIDAsIGFwcGx5U3R5bGluZ0ZuLCBzYW5pdGl6ZXIsIG1hcHNNb2RlKTtcbiAgfVxufVxuXG4vKipcbiAqIEFwcGxpZXMgdGhlIHByb3ZpZGVkIHN0eWxpbmcgbWFwIHRvIHRoZSBlbGVtZW50IGRpcmVjdGx5ICh3aXRob3V0IGNvbnRleHQgcmVzb2x1dGlvbikuXG4gKlxuICogVGhpcyBmdW5jdGlvbiBpcyBkZXNpZ25lZCB0byBiZSBydW4gZnJvbSB0aGUgc3R5bGluZyBpbnN0cnVjdGlvbnMgYW5kIHdpbGwgYmUgY2FsbGVkXG4gKiBhdXRvbWF0aWNhbGx5LiBUaGlzIGZ1bmN0aW9uIGlzIGludGVuZGVkIHRvIGJlIHVzZWQgZm9yIHBlcmZvcm1hbmNlIHJlYXNvbnMgaW4gdGhlXG4gKiBldmVudCB0aGF0IHRoZXJlIGlzIG5vIG5lZWQgdG8gYXBwbHkgc3R5bGluZyB2aWEgY29udGV4dCByZXNvbHV0aW9uLlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gaGFzIHRocmVlIGRpZmZlcmVudCBjYXNlcyB0aGF0IGNhbiBvY2N1ciAoZm9yIGVhY2ggaXRlbSBpbiB0aGUgbWFwKTpcbiAqXG4gKiAtIENhc2UgMTogQXR0ZW1wdCB0byBhcHBseSB0aGUgY3VycmVudCB2YWx1ZSBpbiB0aGUgbWFwIHRvIHRoZSBlbGVtZW50IChpZiBpdCdzIGBub24gbnVsbGApLlxuICpcbiAqIC0gQ2FzZSAyOiBJZiBhIG1hcCB2YWx1ZSBmYWlscyB0byBiZSBhcHBsaWVkIHRoZW4gdGhlIGFsZ29yaXRobSB3aWxsIGZpbmQgYSBtYXRjaGluZyBlbnRyeSBpblxuICogICAgICAgICAgIHRoZSBpbml0aWFsIHZhbHVlcyBwcmVzZW50IGluIHRoZSBjb250ZXh0IGFuZCBhdHRlbXB0IHRvIGFwcGx5IHRoYXQuXG4gKlxuICogLSBEZWZhdWx0IENhc2U6IElmIHRoZSBpbml0aWFsIHZhbHVlIGNhbm5vdCBiZSBhcHBsaWVkIHRoZW4gYSBkZWZhdWx0IHZhbHVlIG9mIGBudWxsYCB3aWxsIGJlXG4gKiAgICAgICAgICAgICAgICAgYXBwbGllZCAod2hpY2ggd2lsbCByZW1vdmUgdGhlIHN0eWxlL2NsYXNzIHZhbHVlIGZyb20gdGhlIGVsZW1lbnQpLlxuICpcbiAqIFNlZSBgYWxsb3dEaXJlY3RTdHlsaW5nQXBwbHlgIHRvIGxlYXJuIHRoZSBsb2dpYyB1c2VkIHRvIGRldGVybWluZSB3aGV0aGVyIGFueSBzdHlsZS9jbGFzc1xuICogYmluZGluZ3MgY2FuIGJlIGRpcmVjdGx5IGFwcGxpZWQuXG4gKlxuICogQHJldHVybnMgd2hldGhlciBvciBub3QgdGhlIHN0eWxpbmcgbWFwIHdhcyBhcHBsaWVkIHRvIHRoZSBlbGVtZW50LlxuICovXG5leHBvcnQgZnVuY3Rpb24gYXBwbHlTdHlsaW5nTWFwRGlyZWN0bHkoXG4gICAgcmVuZGVyZXI6IGFueSwgY29udGV4dDogVFN0eWxpbmdDb250ZXh0LCBlbGVtZW50OiBSRWxlbWVudCwgZGF0YTogTFN0eWxpbmdEYXRhLFxuICAgIGJpbmRpbmdJbmRleDogbnVtYmVyLCB2YWx1ZToge1trZXk6IHN0cmluZ106IGFueX0gfCBzdHJpbmcgfCBudWxsLCBpc0NsYXNzQmFzZWQ6IGJvb2xlYW4sXG4gICAgc2FuaXRpemVyPzogU3R5bGVTYW5pdGl6ZUZuIHwgbnVsbCwgZm9yY2VVcGRhdGU/OiBib29sZWFuLFxuICAgIGJpbmRpbmdWYWx1ZUNvbnRhaW5zSW5pdGlhbD86IGJvb2xlYW4pOiB2b2lkIHtcbiAgY29uc3Qgb2xkVmFsdWUgPSBnZXRWYWx1ZShkYXRhLCBiaW5kaW5nSW5kZXgpO1xuICBpZiAoZm9yY2VVcGRhdGUgfHwgaGFzVmFsdWVDaGFuZ2VkKG9sZFZhbHVlLCB2YWx1ZSkpIHtcbiAgICBjb25zdCBjb25maWcgPSBnZXRDb25maWcoY29udGV4dCk7XG4gICAgY29uc3QgaGFzSW5pdGlhbCA9IGNvbmZpZyAmIFRTdHlsaW5nQ29uZmlnLkhhc0luaXRpYWxTdHlsaW5nO1xuICAgIGNvbnN0IGluaXRpYWxWYWx1ZSA9XG4gICAgICAgIGhhc0luaXRpYWwgJiYgIWJpbmRpbmdWYWx1ZUNvbnRhaW5zSW5pdGlhbCA/IGdldEluaXRpYWxTdHlsaW5nVmFsdWUoY29udGV4dCkgOiBudWxsO1xuICAgIHNldFZhbHVlKGRhdGEsIGJpbmRpbmdJbmRleCwgdmFsdWUpO1xuXG4gICAgLy8gdGhlIGNhY2hlZCB2YWx1ZSBpcyB0aGUgbGFzdCBzbmFwc2hvdCBvZiB0aGUgc3R5bGUgb3IgY2xhc3NcbiAgICAvLyBhdHRyaWJ1dGUgdmFsdWUgYW5kIGlzIHVzZWQgaW4gdGhlIGlmIHN0YXRlbWVudCBiZWxvdyB0b1xuICAgIC8vIGtlZXAgdHJhY2sgb2YgaW50ZXJuYWwvZXh0ZXJuYWwgY2hhbmdlcy5cbiAgICBjb25zdCBjYWNoZWRWYWx1ZUluZGV4ID0gYmluZGluZ0luZGV4ICsgMTtcbiAgICBsZXQgY2FjaGVkVmFsdWUgPSBnZXRWYWx1ZShkYXRhLCBjYWNoZWRWYWx1ZUluZGV4KTtcbiAgICBpZiAoY2FjaGVkVmFsdWUgPT09IE5PX0NIQU5HRSkge1xuICAgICAgY2FjaGVkVmFsdWUgPSBpbml0aWFsVmFsdWU7XG4gICAgfVxuICAgIGNhY2hlZFZhbHVlID0gdHlwZW9mIGNhY2hlZFZhbHVlICE9PSAnc3RyaW5nJyA/ICcnIDogY2FjaGVkVmFsdWU7XG5cbiAgICAvLyBJZiBhIGNsYXNzL3N0eWxlIHZhbHVlIHdhcyBtb2RpZmllZCBleHRlcm5hbGx5IHRoZW4gdGhlIHN0eWxpbmdcbiAgICAvLyBmYXN0IHBhc3MgY2Fubm90IGd1YXJhbnRlZSB0aGF0IHRoZSBleHRlcm5hbCB2YWx1ZXMgYXJlIHJldGFpbmVkLlxuICAgIC8vIFdoZW4gdGhpcyBoYXBwZW5zLCB0aGUgYWxnb3JpdGhtIHdpbGwgYmFpbCBvdXQgYW5kIG5vdCB3cml0ZSB0b1xuICAgIC8vIHRoZSBzdHlsZSBvciBjbGFzc05hbWUgYXR0cmlidXRlIGRpcmVjdGx5LlxuICAgIGxldCB3cml0ZVRvQXR0ckRpcmVjdGx5ID0gIShjb25maWcgJiBUU3R5bGluZ0NvbmZpZy5IYXNQcm9wQmluZGluZ3MpO1xuICAgIGlmICh3cml0ZVRvQXR0ckRpcmVjdGx5ICYmXG4gICAgICAgIGNoZWNrSWZFeHRlcm5hbGx5TW9kaWZpZWQoZWxlbWVudCBhcyBIVE1MRWxlbWVudCwgY2FjaGVkVmFsdWUsIGlzQ2xhc3NCYXNlZCkpIHtcbiAgICAgIHdyaXRlVG9BdHRyRGlyZWN0bHkgPSBmYWxzZTtcbiAgICAgIGlmIChvbGRWYWx1ZSAhPT0gVkFMVUVfSVNfRVhURVJOQUxMWV9NT0RJRklFRCkge1xuICAgICAgICAvLyBkaXJlY3Qgc3R5bGluZyB3aWxsIHJlc2V0IHRoZSBhdHRyaWJ1dGUgZW50aXJlbHkgZWFjaCB0aW1lLFxuICAgICAgICAvLyBhbmQsIGZvciB0aGlzIHJlYXNvbiwgaWYgdGhlIGFsZ29yaXRobSBkZWNpZGVzIGl0IGNhbm5vdFxuICAgICAgICAvLyB3cml0ZSB0byB0aGUgY2xhc3Mvc3R5bGUgYXR0cmlidXRlcyBkaXJlY3RseSB0aGVuIGl0IG11c3RcbiAgICAgICAgLy8gcmVzZXQgYWxsIHRoZSBwcmV2aW91cyBzdHlsZS9jbGFzcyB2YWx1ZXMgYmVmb3JlIGl0IHN0YXJ0c1xuICAgICAgICAvLyB0byBhcHBseSB2YWx1ZXMgaW4gdGhlIG5vbi1kaXJlY3Qgd2F5LlxuICAgICAgICByZW1vdmVTdHlsaW5nVmFsdWVzKHJlbmRlcmVyLCBlbGVtZW50LCBvbGRWYWx1ZSwgaXNDbGFzc0Jhc2VkKTtcblxuICAgICAgICAvLyB0aGlzIHdpbGwgaW5zdHJ1Y3QgdGhlIGFsZ29yaXRobSBub3QgdG8gYXBwbHkgY2xhc3Mgb3Igc3R5bGVcbiAgICAgICAgLy8gdmFsdWVzIGRpcmVjdGx5IGFueW1vcmUuXG4gICAgICAgIHNldFZhbHVlKGRhdGEsIGNhY2hlZFZhbHVlSW5kZXgsIFZBTFVFX0lTX0VYVEVSTkFMTFlfTU9ESUZJRUQpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmICh3cml0ZVRvQXR0ckRpcmVjdGx5KSB7XG4gICAgICBsZXQgdmFsdWVUb0FwcGx5OiBzdHJpbmc7XG4gICAgICBpZiAoaXNDbGFzc0Jhc2VkKSB7XG4gICAgICAgIHZhbHVlVG9BcHBseSA9IHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycgPyB2YWx1ZSA6IG9iamVjdFRvQ2xhc3NOYW1lKHZhbHVlKTtcbiAgICAgICAgaWYgKGluaXRpYWxWYWx1ZSAhPT0gbnVsbCkge1xuICAgICAgICAgIHZhbHVlVG9BcHBseSA9IGNvbmNhdFN0cmluZyhpbml0aWFsVmFsdWUsIHZhbHVlVG9BcHBseSwgJyAnKTtcbiAgICAgICAgfVxuICAgICAgICBzZXRDbGFzc05hbWUocmVuZGVyZXIsIGVsZW1lbnQsIHZhbHVlVG9BcHBseSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB2YWx1ZVRvQXBwbHkgPSBmb3JjZVN0eWxlc0FzU3RyaW5nKHZhbHVlIGFze1trZXk6IHN0cmluZ106IGFueX0sIHRydWUpO1xuICAgICAgICBpZiAoaW5pdGlhbFZhbHVlICE9PSBudWxsKSB7XG4gICAgICAgICAgdmFsdWVUb0FwcGx5ID0gaW5pdGlhbFZhbHVlICsgJzsnICsgdmFsdWVUb0FwcGx5O1xuICAgICAgICB9XG4gICAgICAgIHNldFN0eWxlQXR0cihyZW5kZXJlciwgZWxlbWVudCwgdmFsdWVUb0FwcGx5KTtcbiAgICAgIH1cbiAgICAgIHNldFZhbHVlKGRhdGEsIGNhY2hlZFZhbHVlSW5kZXgsIHZhbHVlVG9BcHBseSB8fCBudWxsKTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgYXBwbHlGbiA9IGlzQ2xhc3NCYXNlZCA/IHNldENsYXNzIDogc2V0U3R5bGU7XG4gICAgICBjb25zdCBtYXAgPSBub3JtYWxpemVJbnRvU3R5bGluZ01hcChvbGRWYWx1ZSwgdmFsdWUsICFpc0NsYXNzQmFzZWQpO1xuICAgICAgY29uc3QgaW5pdGlhbFN0eWxlcyA9IGhhc0luaXRpYWwgPyBnZXRTdHlsaW5nTWFwQXJyYXkoY29udGV4dCkgOiBudWxsO1xuXG4gICAgICBmb3IgKGxldCBpID0gU3R5bGluZ01hcEFycmF5SW5kZXguVmFsdWVzU3RhcnRQb3NpdGlvbjsgaSA8IG1hcC5sZW5ndGg7XG4gICAgICAgICAgIGkgKz0gU3R5bGluZ01hcEFycmF5SW5kZXguVHVwbGVTaXplKSB7XG4gICAgICAgIGNvbnN0IHByb3AgPSBnZXRNYXBQcm9wKG1hcCwgaSk7XG4gICAgICAgIGNvbnN0IHZhbHVlID0gZ2V0TWFwVmFsdWUobWFwLCBpKTtcblxuICAgICAgICAvLyBjYXNlIDE6IGFwcGx5IHRoZSBtYXAgdmFsdWUgKGlmIGl0IGV4aXN0cylcbiAgICAgICAgbGV0IGFwcGxpZWQgPVxuICAgICAgICAgICAgYXBwbHlTdHlsaW5nVmFsdWUocmVuZGVyZXIsIGVsZW1lbnQsIHByb3AsIHZhbHVlLCBhcHBseUZuLCBiaW5kaW5nSW5kZXgsIHNhbml0aXplcik7XG5cbiAgICAgICAgLy8gY2FzZSAyOiBhcHBseSB0aGUgaW5pdGlhbCB2YWx1ZSAoaWYgaXQgZXhpc3RzKVxuICAgICAgICBpZiAoIWFwcGxpZWQgJiYgaW5pdGlhbFN0eWxlcykge1xuICAgICAgICAgIGFwcGxpZWQgPSBmaW5kQW5kQXBwbHlNYXBWYWx1ZShcbiAgICAgICAgICAgICAgcmVuZGVyZXIsIGVsZW1lbnQsIGFwcGx5Rm4sIGluaXRpYWxTdHlsZXMsIHByb3AsIGJpbmRpbmdJbmRleCwgc2FuaXRpemVyKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGRlZmF1bHQgY2FzZTogYXBwbHkgYG51bGxgIHRvIHJlbW92ZSB0aGUgdmFsdWVcbiAgICAgICAgaWYgKCFhcHBsaWVkKSB7XG4gICAgICAgICAgYXBwbHlGbihyZW5kZXJlciwgZWxlbWVudCwgcHJvcCwgbnVsbCwgYmluZGluZ0luZGV4KTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBjb25zdCBzdGF0ZSA9IGdldFN0eWxpbmdTdGF0ZShlbGVtZW50LCBURU1QTEFURV9ESVJFQ1RJVkVfSU5ERVgpO1xuICAgICAgaWYgKGlzQ2xhc3NCYXNlZCkge1xuICAgICAgICBzdGF0ZS5sYXN0RGlyZWN0Q2xhc3NNYXAgPSBtYXA7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzdGF0ZS5sYXN0RGlyZWN0U3R5bGVNYXAgPSBtYXA7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogQXBwbGllcyB0aGUgcHJvdmlkZWQgc3R5bGluZyBwcm9wL3ZhbHVlIHRvIHRoZSBlbGVtZW50IGRpcmVjdGx5ICh3aXRob3V0IGNvbnRleHQgcmVzb2x1dGlvbikuXG4gKlxuICogVGhpcyBmdW5jdGlvbiBpcyBkZXNpZ25lZCB0byBiZSBydW4gZnJvbSB0aGUgc3R5bGluZyBpbnN0cnVjdGlvbnMgYW5kIHdpbGwgYmUgY2FsbGVkXG4gKiBhdXRvbWF0aWNhbGx5LiBUaGlzIGZ1bmN0aW9uIGlzIGludGVuZGVkIHRvIGJlIHVzZWQgZm9yIHBlcmZvcm1hbmNlIHJlYXNvbnMgaW4gdGhlXG4gKiBldmVudCB0aGF0IHRoZXJlIGlzIG5vIG5lZWQgdG8gYXBwbHkgc3R5bGluZyB2aWEgY29udGV4dCByZXNvbHV0aW9uLlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gaGFzIGZvdXIgZGlmZmVyZW50IGNhc2VzIHRoYXQgY2FuIG9jY3VyOlxuICpcbiAqIC0gQ2FzZSAxOiBBcHBseSB0aGUgcHJvdmlkZWQgcHJvcC92YWx1ZSAoc3R5bGUgb3IgY2xhc3MpIGVudHJ5IHRvIHRoZSBlbGVtZW50XG4gKiAgICAgICAgICAgKGlmIGl0IGlzIGBub24gbnVsbGApLlxuICpcbiAqIC0gQ2FzZSAyOiBJZiB2YWx1ZSBkb2VzIG5vdCBnZXQgYXBwbGllZCAoYmVjYXVzZSBpdHMgYG51bGxgIG9yIGB1bmRlZmluZWRgKSB0aGVuIHRoZSBhbGdvcml0aG1cbiAqICAgICAgICAgICB3aWxsIGNoZWNrIHRvIHNlZSBpZiBhIHN0eWxpbmcgbWFwIHZhbHVlIHdhcyBhcHBsaWVkIHRvIHRoZSBlbGVtZW50IGFzIHdlbGwganVzdFxuICogICAgICAgICAgIGJlZm9yZSB0aGlzICh2aWEgYHN0eWxlTWFwYCBvciBgY2xhc3NNYXBgKS4gSWYgYW5kIHdoZW4gYSBtYXAgaXMgcHJlc2VudCB0aGVuIHRoZVxuICAqICAgICAgICAgIGFsZ29yaXRobSB3aWxsIGZpbmQgdGhlIG1hdGNoaW5nIHByb3BlcnR5IGluIHRoZSBtYXAgYW5kIGFwcGx5IGl0cyB2YWx1ZS5cbiAgKlxuICogLSBDYXNlIDM6IElmIGEgbWFwIHZhbHVlIGZhaWxzIHRvIGJlIGFwcGxpZWQgdGhlbiB0aGUgYWxnb3JpdGhtIHdpbGwgY2hlY2sgdG8gc2VlIGlmIHRoZXJlXG4gKiAgICAgICAgICAgYXJlIGFueSBpbml0aWFsIHZhbHVlcyBwcmVzZW50IGFuZCBhdHRlbXB0IHRvIGFwcGx5IGEgbWF0Y2hpbmcgdmFsdWUgYmFzZWQgb25cbiAqICAgICAgICAgICB0aGUgdGFyZ2V0IHByb3AuXG4gKlxuICogLSBEZWZhdWx0IENhc2U6IElmIGEgbWF0Y2hpbmcgaW5pdGlhbCB2YWx1ZSBjYW5ub3QgYmUgYXBwbGllZCB0aGVuIGEgZGVmYXVsdCB2YWx1ZVxuICogICAgICAgICAgICAgICAgIG9mIGBudWxsYCB3aWxsIGJlIGFwcGxpZWQgKHdoaWNoIHdpbGwgcmVtb3ZlIHRoZSBzdHlsZS9jbGFzcyB2YWx1ZVxuICogICAgICAgICAgICAgICAgIGZyb20gdGhlIGVsZW1lbnQpLlxuICpcbiAqIFNlZSBgYWxsb3dEaXJlY3RTdHlsaW5nQXBwbHlgIHRvIGxlYXJuIHRoZSBsb2dpYyB1c2VkIHRvIGRldGVybWluZSB3aGV0aGVyIGFueSBzdHlsZS9jbGFzc1xuICogYmluZGluZ3MgY2FuIGJlIGRpcmVjdGx5IGFwcGxpZWQuXG4gKlxuICogQHJldHVybnMgd2hldGhlciBvciBub3QgdGhlIHByb3AvdmFsdWUgc3R5bGluZyB3YXMgYXBwbGllZCB0byB0aGUgZWxlbWVudC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFwcGx5U3R5bGluZ1ZhbHVlRGlyZWN0bHkoXG4gICAgcmVuZGVyZXI6IGFueSwgY29udGV4dDogVFN0eWxpbmdDb250ZXh0LCBlbGVtZW50OiBSRWxlbWVudCwgZGF0YTogTFN0eWxpbmdEYXRhLFxuICAgIGJpbmRpbmdJbmRleDogbnVtYmVyLCBwcm9wOiBzdHJpbmcsIHZhbHVlOiBhbnksIGlzQ2xhc3NCYXNlZDogYm9vbGVhbixcbiAgICBzYW5pdGl6ZXI/OiBTdHlsZVNhbml0aXplRm4gfCBudWxsKTogYm9vbGVhbiB7XG4gIGxldCBhcHBsaWVkID0gZmFsc2U7XG4gIGlmIChoYXNWYWx1ZUNoYW5nZWQoZGF0YVtiaW5kaW5nSW5kZXhdLCB2YWx1ZSkpIHtcbiAgICBzZXRWYWx1ZShkYXRhLCBiaW5kaW5nSW5kZXgsIHZhbHVlKTtcbiAgICBjb25zdCBhcHBseUZuID0gaXNDbGFzc0Jhc2VkID8gc2V0Q2xhc3MgOiBzZXRTdHlsZTtcblxuICAgIC8vIGNhc2UgMTogYXBwbHkgdGhlIHByb3ZpZGVkIHZhbHVlIChpZiBpdCBleGlzdHMpXG4gICAgYXBwbGllZCA9IGFwcGx5U3R5bGluZ1ZhbHVlKHJlbmRlcmVyLCBlbGVtZW50LCBwcm9wLCB2YWx1ZSwgYXBwbHlGbiwgYmluZGluZ0luZGV4LCBzYW5pdGl6ZXIpO1xuXG4gICAgLy8gY2FzZSAyOiBmaW5kIHRoZSBtYXRjaGluZyBwcm9wZXJ0eSBpbiBhIHN0eWxpbmcgbWFwIGFuZCBhcHBseSB0aGUgZGV0ZWN0ZWQgdmFsdWVcbiAgICBpZiAoIWFwcGxpZWQgJiYgaGFzQ29uZmlnKGNvbnRleHQsIFRTdHlsaW5nQ29uZmlnLkhhc01hcEJpbmRpbmdzKSkge1xuICAgICAgY29uc3Qgc3RhdGUgPSBnZXRTdHlsaW5nU3RhdGUoZWxlbWVudCwgVEVNUExBVEVfRElSRUNUSVZFX0lOREVYKTtcbiAgICAgIGNvbnN0IG1hcCA9IGlzQ2xhc3NCYXNlZCA/IHN0YXRlLmxhc3REaXJlY3RDbGFzc01hcCA6IHN0YXRlLmxhc3REaXJlY3RTdHlsZU1hcDtcbiAgICAgIGFwcGxpZWQgPSBtYXAgP1xuICAgICAgICAgIGZpbmRBbmRBcHBseU1hcFZhbHVlKHJlbmRlcmVyLCBlbGVtZW50LCBhcHBseUZuLCBtYXAsIHByb3AsIGJpbmRpbmdJbmRleCwgc2FuaXRpemVyKSA6XG4gICAgICAgICAgZmFsc2U7XG4gICAgfVxuXG4gICAgLy8gY2FzZSAzOiBhcHBseSB0aGUgaW5pdGlhbCB2YWx1ZSAoaWYgaXQgZXhpc3RzKVxuICAgIGlmICghYXBwbGllZCAmJiBoYXNDb25maWcoY29udGV4dCwgVFN0eWxpbmdDb25maWcuSGFzSW5pdGlhbFN0eWxpbmcpKSB7XG4gICAgICBjb25zdCBtYXAgPSBnZXRTdHlsaW5nTWFwQXJyYXkoY29udGV4dCk7XG4gICAgICBhcHBsaWVkID1cbiAgICAgICAgICBtYXAgPyBmaW5kQW5kQXBwbHlNYXBWYWx1ZShyZW5kZXJlciwgZWxlbWVudCwgYXBwbHlGbiwgbWFwLCBwcm9wLCBiaW5kaW5nSW5kZXgpIDogZmFsc2U7XG4gICAgfVxuXG4gICAgLy8gZGVmYXVsdCBjYXNlOiBhcHBseSBgbnVsbGAgdG8gcmVtb3ZlIHRoZSB2YWx1ZVxuICAgIGlmICghYXBwbGllZCkge1xuICAgICAgYXBwbHlGbihyZW5kZXJlciwgZWxlbWVudCwgcHJvcCwgbnVsbCwgYmluZGluZ0luZGV4KTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGFwcGxpZWQ7XG59XG5cbmZ1bmN0aW9uIGFwcGx5U3R5bGluZ1ZhbHVlKFxuICAgIHJlbmRlcmVyOiBhbnksIGVsZW1lbnQ6IFJFbGVtZW50LCBwcm9wOiBzdHJpbmcsIHZhbHVlOiBhbnksIGFwcGx5Rm46IEFwcGx5U3R5bGluZ0ZuLFxuICAgIGJpbmRpbmdJbmRleDogbnVtYmVyLCBzYW5pdGl6ZXI/OiBTdHlsZVNhbml0aXplRm4gfCBudWxsKTogYm9vbGVhbiB7XG4gIGxldCB2YWx1ZVRvQXBwbHk6IHN0cmluZ3xudWxsID0gdW53cmFwU2FmZVZhbHVlKHZhbHVlKTtcbiAgaWYgKGlzU3R5bGluZ1ZhbHVlRGVmaW5lZCh2YWx1ZVRvQXBwbHkpKSB7XG4gICAgdmFsdWVUb0FwcGx5ID1cbiAgICAgICAgc2FuaXRpemVyID8gc2FuaXRpemVyKHByb3AsIHZhbHVlLCBTdHlsZVNhbml0aXplTW9kZS5WYWxpZGF0ZUFuZFNhbml0aXplKSA6IHZhbHVlVG9BcHBseTtcbiAgICBhcHBseUZuKHJlbmRlcmVyLCBlbGVtZW50LCBwcm9wLCB2YWx1ZVRvQXBwbHksIGJpbmRpbmdJbmRleCk7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG5mdW5jdGlvbiBmaW5kQW5kQXBwbHlNYXBWYWx1ZShcbiAgICByZW5kZXJlcjogYW55LCBlbGVtZW50OiBSRWxlbWVudCwgYXBwbHlGbjogQXBwbHlTdHlsaW5nRm4sIG1hcDogU3R5bGluZ01hcEFycmF5LCBwcm9wOiBzdHJpbmcsXG4gICAgYmluZGluZ0luZGV4OiBudW1iZXIsIHNhbml0aXplcj86IFN0eWxlU2FuaXRpemVGbiB8IG51bGwpIHtcbiAgZm9yIChsZXQgaSA9IFN0eWxpbmdNYXBBcnJheUluZGV4LlZhbHVlc1N0YXJ0UG9zaXRpb247IGkgPCBtYXAubGVuZ3RoO1xuICAgICAgIGkgKz0gU3R5bGluZ01hcEFycmF5SW5kZXguVHVwbGVTaXplKSB7XG4gICAgY29uc3QgcCA9IGdldE1hcFByb3AobWFwLCBpKTtcbiAgICBpZiAocCA9PT0gcHJvcCkge1xuICAgICAgbGV0IHZhbHVlVG9BcHBseSA9IGdldE1hcFZhbHVlKG1hcCwgaSk7XG4gICAgICB2YWx1ZVRvQXBwbHkgPSBzYW5pdGl6ZXIgP1xuICAgICAgICAgIHNhbml0aXplcihwcm9wLCB2YWx1ZVRvQXBwbHksIFN0eWxlU2FuaXRpemVNb2RlLlZhbGlkYXRlQW5kU2FuaXRpemUpIDpcbiAgICAgICAgICB2YWx1ZVRvQXBwbHk7XG4gICAgICBhcHBseUZuKHJlbmRlcmVyLCBlbGVtZW50LCBwcm9wLCB2YWx1ZVRvQXBwbHksIGJpbmRpbmdJbmRleCk7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgaWYgKHAgPiBwcm9wKSB7XG4gICAgICBicmVhaztcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG5mdW5jdGlvbiBub3JtYWxpemVCaXRNYXNrVmFsdWUodmFsdWU6IG51bWJlciB8IGJvb2xlYW4pOiBudW1iZXIge1xuICAvLyBpZiBwYXNzID0+IGFwcGx5IGFsbCB2YWx1ZXMgKC0xIGltcGxpZXMgdGhhdCBhbGwgYml0cyBhcmUgZmxpcHBlZCB0byB0cnVlKVxuICBpZiAodmFsdWUgPT09IHRydWUpIHJldHVybiAtMTtcblxuICAvLyBpZiBwYXNzID0+IHNraXAgYWxsIHZhbHVlc1xuICBpZiAodmFsdWUgPT09IGZhbHNlKSByZXR1cm4gMDtcblxuICAvLyByZXR1cm4gdGhlIGJpdCBtYXNrIHZhbHVlIGFzIGlzXG4gIHJldHVybiB2YWx1ZTtcbn1cblxubGV0IF9hY3RpdmVTdHlsaW5nTWFwQXBwbHlGbjogU3luY1N0eWxpbmdNYXBzRm58bnVsbCA9IG51bGw7XG5leHBvcnQgZnVuY3Rpb24gZ2V0U3R5bGluZ01hcHNTeW5jRm4oKSB7XG4gIHJldHVybiBfYWN0aXZlU3R5bGluZ01hcEFwcGx5Rm47XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXRTdHlsaW5nTWFwc1N5bmNGbihmbjogU3luY1N0eWxpbmdNYXBzRm4pIHtcbiAgX2FjdGl2ZVN0eWxpbmdNYXBBcHBseUZuID0gZm47XG59XG5cbi8qKlxuICogQXNzaWducyBhIHN0eWxlIHZhbHVlIHRvIGEgc3R5bGUgcHJvcGVydHkgZm9yIHRoZSBnaXZlbiBlbGVtZW50LlxuICovXG5leHBvcnQgY29uc3Qgc2V0U3R5bGU6IEFwcGx5U3R5bGluZ0ZuID1cbiAgICAocmVuZGVyZXI6IFJlbmRlcmVyMyB8IG51bGwsIG5hdGl2ZTogUkVsZW1lbnQsIHByb3A6IHN0cmluZywgdmFsdWU6IHN0cmluZyB8IG51bGwpID0+IHtcbiAgICAgIGlmIChyZW5kZXJlciAhPT0gbnVsbCkge1xuICAgICAgICAvLyBVc2UgYGlzU3R5bGluZ1ZhbHVlRGVmaW5lZGAgdG8gYWNjb3VudCBmb3IgZmFsc3kgdmFsdWVzIHRoYXQgc2hvdWxkIGJlIGJvdW5kIGxpa2UgMC5cbiAgICAgICAgaWYgKGlzU3R5bGluZ1ZhbHVlRGVmaW5lZCh2YWx1ZSkpIHtcbiAgICAgICAgICAvLyBvcGFjaXR5LCB6LWluZGV4IGFuZCBmbGV4Ym94IGFsbCBoYXZlIG51bWJlciB2YWx1ZXNcbiAgICAgICAgICAvLyBhbmQgdGhlc2UgbmVlZCB0byBiZSBjb252ZXJ0ZWQgaW50byBzdHJpbmdzIHNvIHRoYXRcbiAgICAgICAgICAvLyB0aGV5IGNhbiBiZSBhc3NpZ25lZCBwcm9wZXJseS5cbiAgICAgICAgICB2YWx1ZSA9IHZhbHVlLnRvU3RyaW5nKCk7XG4gICAgICAgICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlclNldFN0eWxlKys7XG4gICAgICAgICAgaWYgKGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSkge1xuICAgICAgICAgICAgcmVuZGVyZXIuc2V0U3R5bGUobmF0aXZlLCBwcm9wLCB2YWx1ZSwgUmVuZGVyZXJTdHlsZUZsYWdzMy5EYXNoQ2FzZSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIFRoZSByZWFzb24gd2h5IG5hdGl2ZSBzdHlsZSBtYXkgYmUgYG51bGxgIGlzIGVpdGhlciBiZWNhdXNlXG4gICAgICAgICAgICAvLyBpdCdzIGEgY29udGFpbmVyIGVsZW1lbnQgb3IgaXQncyBhIHBhcnQgb2YgYSB0ZXN0XG4gICAgICAgICAgICAvLyBlbnZpcm9ubWVudCB0aGF0IGRvZXNuJ3QgaGF2ZSBzdHlsaW5nLiBJbiBlaXRoZXJcbiAgICAgICAgICAgIC8vIGNhc2UgaXQncyBzYWZlIG5vdCB0byBhcHBseSBzdHlsaW5nIHRvIHRoZSBlbGVtZW50LlxuICAgICAgICAgICAgY29uc3QgbmF0aXZlU3R5bGUgPSBuYXRpdmUuc3R5bGU7XG4gICAgICAgICAgICBpZiAobmF0aXZlU3R5bGUgIT0gbnVsbCkge1xuICAgICAgICAgICAgICBuYXRpdmVTdHlsZS5zZXRQcm9wZXJ0eShwcm9wLCB2YWx1ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJSZW1vdmVTdHlsZSsrO1xuXG4gICAgICAgICAgaWYgKGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSkge1xuICAgICAgICAgICAgcmVuZGVyZXIucmVtb3ZlU3R5bGUobmF0aXZlLCBwcm9wLCBSZW5kZXJlclN0eWxlRmxhZ3MzLkRhc2hDYXNlKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc3QgbmF0aXZlU3R5bGUgPSBuYXRpdmUuc3R5bGU7XG4gICAgICAgICAgICBpZiAobmF0aXZlU3R5bGUgIT0gbnVsbCkge1xuICAgICAgICAgICAgICBuYXRpdmVTdHlsZS5yZW1vdmVQcm9wZXJ0eShwcm9wKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9O1xuXG4vKipcbiAqIEFkZHMvcmVtb3ZlcyB0aGUgcHJvdmlkZWQgY2xhc3NOYW1lIHZhbHVlIHRvIHRoZSBwcm92aWRlZCBlbGVtZW50LlxuICovXG5leHBvcnQgY29uc3Qgc2V0Q2xhc3M6IEFwcGx5U3R5bGluZ0ZuID1cbiAgICAocmVuZGVyZXI6IFJlbmRlcmVyMyB8IG51bGwsIG5hdGl2ZTogUkVsZW1lbnQsIGNsYXNzTmFtZTogc3RyaW5nLCB2YWx1ZTogYW55KSA9PiB7XG4gICAgICBpZiAocmVuZGVyZXIgIT09IG51bGwgJiYgY2xhc3NOYW1lICE9PSAnJykge1xuICAgICAgICBpZiAodmFsdWUpIHtcbiAgICAgICAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyQWRkQ2xhc3MrKztcbiAgICAgICAgICBpZiAoaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpKSB7XG4gICAgICAgICAgICByZW5kZXJlci5hZGRDbGFzcyhuYXRpdmUsIGNsYXNzTmFtZSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIHRoZSByZWFzb24gd2h5IGNsYXNzTGlzdCBtYXkgYmUgYG51bGxgIGlzIGVpdGhlciBiZWNhdXNlXG4gICAgICAgICAgICAvLyBpdCdzIGEgY29udGFpbmVyIGVsZW1lbnQgb3IgaXQncyBhIHBhcnQgb2YgYSB0ZXN0XG4gICAgICAgICAgICAvLyBlbnZpcm9ubWVudCB0aGF0IGRvZXNuJ3QgaGF2ZSBzdHlsaW5nLiBJbiBlaXRoZXJcbiAgICAgICAgICAgIC8vIGNhc2UgaXQncyBzYWZlIG5vdCB0byBhcHBseSBzdHlsaW5nIHRvIHRoZSBlbGVtZW50LlxuICAgICAgICAgICAgY29uc3QgY2xhc3NMaXN0ID0gbmF0aXZlLmNsYXNzTGlzdDtcbiAgICAgICAgICAgIGlmIChjbGFzc0xpc3QgIT0gbnVsbCkge1xuICAgICAgICAgICAgICBjbGFzc0xpc3QuYWRkKGNsYXNzTmFtZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJSZW1vdmVDbGFzcysrO1xuICAgICAgICAgIGlmIChpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikpIHtcbiAgICAgICAgICAgIHJlbmRlcmVyLnJlbW92ZUNsYXNzKG5hdGl2ZSwgY2xhc3NOYW1lKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc3QgY2xhc3NMaXN0ID0gbmF0aXZlLmNsYXNzTGlzdDtcbiAgICAgICAgICAgIGlmIChjbGFzc0xpc3QgIT0gbnVsbCkge1xuICAgICAgICAgICAgICBjbGFzc0xpc3QucmVtb3ZlKGNsYXNzTmFtZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfTtcblxuZXhwb3J0IGNvbnN0IHNldENsYXNzTmFtZSA9IChyZW5kZXJlcjogUmVuZGVyZXIzIHwgbnVsbCwgbmF0aXZlOiBSRWxlbWVudCwgY2xhc3NOYW1lOiBzdHJpbmcpID0+IHtcbiAgaWYgKHJlbmRlcmVyICE9PSBudWxsKSB7XG4gICAgaWYgKGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSkge1xuICAgICAgcmVuZGVyZXIuc2V0QXR0cmlidXRlKG5hdGl2ZSwgJ2NsYXNzJywgY2xhc3NOYW1lKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbmF0aXZlLmNsYXNzTmFtZSA9IGNsYXNzTmFtZTtcbiAgICB9XG4gIH1cbn07XG5cbmV4cG9ydCBjb25zdCBzZXRTdHlsZUF0dHIgPSAocmVuZGVyZXI6IFJlbmRlcmVyMyB8IG51bGwsIG5hdGl2ZTogUkVsZW1lbnQsIHZhbHVlOiBzdHJpbmcpID0+IHtcbiAgaWYgKHJlbmRlcmVyICE9PSBudWxsKSB7XG4gICAgaWYgKGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSkge1xuICAgICAgcmVuZGVyZXIuc2V0QXR0cmlidXRlKG5hdGl2ZSwgJ3N0eWxlJywgdmFsdWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICBuYXRpdmUuc2V0QXR0cmlidXRlKCdzdHlsZScsIHZhbHVlKTtcbiAgICB9XG4gIH1cbn07XG5cbi8qKlxuICogSXRlcmF0ZXMgb3ZlciBhbGwgcHJvdmlkZWQgc3R5bGluZyBlbnRyaWVzIGFuZCByZW5kZXJzIHRoZW0gb24gdGhlIGVsZW1lbnQuXG4gKlxuICogVGhpcyBmdW5jdGlvbiBpcyB1c2VkIGFsb25nc2lkZSBhIGBTdHlsaW5nTWFwQXJyYXlgIGVudHJ5LiBUaGlzIGVudHJ5IGlzIG5vdFxuICogdGhlIHNhbWUgYXMgdGhlIGBUU3R5bGluZ0NvbnRleHRgIGFuZCBpcyBvbmx5IHJlYWxseSB1c2VkIHdoZW4gYW4gZWxlbWVudCBjb250YWluc1xuICogaW5pdGlhbCBzdHlsaW5nIHZhbHVlcyAoZS5nLiBgPGRpdiBzdHlsZT1cIndpZHRoOjIwMHB4XCI+YCksIGJ1dCBubyBzdHlsZS9jbGFzcyBiaW5kaW5nc1xuICogYXJlIHByZXNlbnQuIElmIGFuZCB3aGVuIHRoYXQgaGFwcGVucyB0aGVuIHRoaXMgZnVuY3Rpb24gd2lsbCBiZSBjYWxsZWQgdG8gcmVuZGVyIGFsbFxuICogaW5pdGlhbCBzdHlsaW5nIHZhbHVlcyBvbiBhbiBlbGVtZW50LlxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVuZGVyU3R5bGluZ01hcChcbiAgICByZW5kZXJlcjogUmVuZGVyZXIzLCBlbGVtZW50OiBSRWxlbWVudCwgc3R5bGluZ1ZhbHVlczogVFN0eWxpbmdDb250ZXh0IHwgU3R5bGluZ01hcEFycmF5IHwgbnVsbCxcbiAgICBpc0NsYXNzQmFzZWQ6IGJvb2xlYW4pOiB2b2lkIHtcbiAgY29uc3Qgc3R5bGluZ01hcEFyciA9IGdldFN0eWxpbmdNYXBBcnJheShzdHlsaW5nVmFsdWVzKTtcbiAgaWYgKHN0eWxpbmdNYXBBcnIpIHtcbiAgICBmb3IgKGxldCBpID0gU3R5bGluZ01hcEFycmF5SW5kZXguVmFsdWVzU3RhcnRQb3NpdGlvbjsgaSA8IHN0eWxpbmdNYXBBcnIubGVuZ3RoO1xuICAgICAgICAgaSArPSBTdHlsaW5nTWFwQXJyYXlJbmRleC5UdXBsZVNpemUpIHtcbiAgICAgIGNvbnN0IHByb3AgPSBnZXRNYXBQcm9wKHN0eWxpbmdNYXBBcnIsIGkpO1xuICAgICAgY29uc3QgdmFsdWUgPSBnZXRNYXBWYWx1ZShzdHlsaW5nTWFwQXJyLCBpKTtcbiAgICAgIGlmIChpc0NsYXNzQmFzZWQpIHtcbiAgICAgICAgc2V0Q2xhc3MocmVuZGVyZXIsIGVsZW1lbnQsIHByb3AsIHZhbHVlLCBudWxsKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHNldFN0eWxlKHJlbmRlcmVyLCBlbGVtZW50LCBwcm9wLCB2YWx1ZSwgbnVsbCk7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIG9iamVjdFRvQ2xhc3NOYW1lKG9iajoge1trZXk6IHN0cmluZ106IGFueX0gfCBudWxsKTogc3RyaW5nIHtcbiAgbGV0IHN0ciA9ICcnO1xuICBpZiAob2JqKSB7XG4gICAgZm9yIChsZXQga2V5IGluIG9iaikge1xuICAgICAgY29uc3QgdmFsdWUgPSBvYmpba2V5XTtcbiAgICAgIGlmICh2YWx1ZSkge1xuICAgICAgICBzdHIgKz0gKHN0ci5sZW5ndGggPyAnICcgOiAnJykgKyBrZXk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiBzdHI7XG59XG5cbi8qKlxuICogRGV0ZXJtaW5lcyB3aGV0aGVyIG9yIG5vdCBhbiBlbGVtZW50IHN0eWxlL2NsYXNzTmFtZSB2YWx1ZSBoYXMgY2hhbmdlZCBzaW5jZSB0aGUgbGFzdCB1cGRhdGUuXG4gKlxuICogVGhpcyBmdW5jdGlvbiBoZWxwcyBBbmd1bGFyIGRldGVybWluZSBpZiBhIHN0eWxlIG9yIGNsYXNzIGF0dHJpYnV0ZSB2YWx1ZSB3YXNcbiAqIG1vZGlmaWVkIGJ5IGFuIGV4dGVybmFsIHBsdWdpbiBvciBBUEkgb3V0c2lkZSBvZiB0aGUgc3R5bGUgYmluZGluZyBjb2RlLiBUaGlzXG4gKiBtZWFucyBhbnkgSlMgY29kZSB0aGF0IGFkZHMvcmVtb3ZlcyBjbGFzcy9zdHlsZSB2YWx1ZXMgb24gYW4gZWxlbWVudCBvdXRzaWRlXG4gKiBvZiBBbmd1bGFyJ3Mgc3R5bGluZyBiaW5kaW5nIGFsZ29yaXRobS5cbiAqXG4gKiBAcmV0dXJucyB0cnVlIHdoZW4gdGhlIHZhbHVlIHdhcyBtb2RpZmllZCBleHRlcm5hbGx5LlxuICovXG5mdW5jdGlvbiBjaGVja0lmRXh0ZXJuYWxseU1vZGlmaWVkKGVsZW1lbnQ6IEhUTUxFbGVtZW50LCBjYWNoZWRWYWx1ZTogYW55LCBpc0NsYXNzQmFzZWQ6IGJvb2xlYW4pIHtcbiAgLy8gdGhpcyBtZWFucyBpdCB3YXMgY2hlY2tlZCBiZWZvcmUgYW5kIHRoZXJlIGlzIG5vIHJlYXNvblxuICAvLyB0byBjb21wYXJlIHRoZSBzdHlsZS9jbGFzcyB2YWx1ZXMgYWdhaW4uIEVpdGhlciB0aGF0IG9yXG4gIC8vIHdlYiB3b3JrZXJzIGFyZSBiZWluZyB1c2VkLlxuICBpZiAoZ2xvYmFsLk5vZGUgPT09ICd1bmRlZmluZWQnIHx8IGNhY2hlZFZhbHVlID09PSBWQUxVRV9JU19FWFRFUk5BTExZX01PRElGSUVEKSByZXR1cm4gdHJ1ZTtcblxuICAvLyBjb21wYXJpbmcgdGhlIERPTSB2YWx1ZSBhZ2FpbnN0IHRoZSBjYWNoZWQgdmFsdWUgaXMgdGhlIGJlc3Qgd2F5IHRvXG4gIC8vIHNlZSBpZiBzb21ldGhpbmcgaGFzIGNoYW5nZWQuXG4gIGNvbnN0IGN1cnJlbnRWYWx1ZSA9XG4gICAgICAoaXNDbGFzc0Jhc2VkID8gZWxlbWVudC5jbGFzc05hbWUgOiAoZWxlbWVudC5zdHlsZSAmJiBlbGVtZW50LnN0eWxlLmNzc1RleHQpKSB8fCAnJztcbiAgcmV0dXJuIGN1cnJlbnRWYWx1ZSAhPT0gKGNhY2hlZFZhbHVlIHx8ICcnKTtcbn1cblxuLyoqXG4gKiBSZW1vdmVzIHByb3ZpZGVkIHN0eWxpbmcgdmFsdWVzIGZyb20gdGhlIGVsZW1lbnRcbiAqL1xuZnVuY3Rpb24gcmVtb3ZlU3R5bGluZ1ZhbHVlcyhcbiAgICByZW5kZXJlcjogYW55LCBlbGVtZW50OiBSRWxlbWVudCwgdmFsdWVzOiBzdHJpbmcgfCB7W2tleTogc3RyaW5nXTogYW55fSB8IFN0eWxpbmdNYXBBcnJheSxcbiAgICBpc0NsYXNzQmFzZWQ6IGJvb2xlYW4pIHtcbiAgbGV0IGFycjogU3R5bGluZ01hcEFycmF5O1xuICBpZiAoaXNTdHlsaW5nTWFwQXJyYXkodmFsdWVzKSkge1xuICAgIGFyciA9IHZhbHVlcyBhcyBTdHlsaW5nTWFwQXJyYXk7XG4gIH0gZWxzZSB7XG4gICAgYXJyID0gbm9ybWFsaXplSW50b1N0eWxpbmdNYXAobnVsbCwgdmFsdWVzLCAhaXNDbGFzc0Jhc2VkKTtcbiAgfVxuXG4gIGNvbnN0IGFwcGx5Rm4gPSBpc0NsYXNzQmFzZWQgPyBzZXRDbGFzcyA6IHNldFN0eWxlO1xuICBmb3IgKGxldCBpID0gU3R5bGluZ01hcEFycmF5SW5kZXguVmFsdWVzU3RhcnRQb3NpdGlvbjsgaSA8IGFyci5sZW5ndGg7XG4gICAgICAgaSArPSBTdHlsaW5nTWFwQXJyYXlJbmRleC5UdXBsZVNpemUpIHtcbiAgICBjb25zdCB2YWx1ZSA9IGdldE1hcFZhbHVlKGFyciwgaSk7XG4gICAgaWYgKHZhbHVlKSB7XG4gICAgICBjb25zdCBwcm9wID0gZ2V0TWFwUHJvcChhcnIsIGkpO1xuICAgICAgYXBwbHlGbihyZW5kZXJlciwgZWxlbWVudCwgcHJvcCwgZmFsc2UpO1xuICAgIH1cbiAgfVxufVxuIl19