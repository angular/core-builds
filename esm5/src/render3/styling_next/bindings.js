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
import { getStylingState, resetStylingState } from './state';
import { DEFAULT_BINDING_INDEX, DEFAULT_BINDING_VALUE, DEFAULT_GUARD_MASK_VALUE, MAP_BASED_ENTRY_PROP_NAME, getBindingValue, getConfig, getDefaultValue, getGuardMask, getMapProp, getMapValue, getProp, getPropValuesStartPosition, getStylingMapArray, getTotalSources, getValue, getValuesCount, hasConfig, hasValueChanged, isContextLocked, isHostStylingActive, isSanitizationRequired, isStylingValueDefined, lockContext, patchConfig, setDefaultValue, setGuardMask, setMapAsDirty, setValue } from './util';
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
/**
 * The guard/update mask bit index location for map-based bindings.
 *
 * All map-based bindings (i.e. `[style]` and `[class]` )
 */
var STYLING_INDEX_FOR_MAP_BINDING = 0;
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
export function updateClassViaContext(context, data, element, directiveIndex, prop, bindingIndex, value, forceUpdate) {
    var isMapBased = !prop;
    var state = getStylingState(element, directiveIndex);
    var countIndex = isMapBased ? STYLING_INDEX_FOR_MAP_BINDING : state.classesIndex++;
    if (value !== NO_CHANGE) {
        var updated = updateBindingData(context, data, countIndex, state.sourceIndex, prop, bindingIndex, value, forceUpdate, false);
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
 */
export function updateStyleViaContext(context, data, element, directiveIndex, prop, bindingIndex, value, sanitizer, forceUpdate) {
    var isMapBased = !prop;
    var state = getStylingState(element, directiveIndex);
    var countIndex = isMapBased ? STYLING_INDEX_FOR_MAP_BINDING : state.stylesIndex++;
    if (value !== NO_CHANGE) {
        var sanitizationRequired = isMapBased ?
            true :
            (sanitizer ? sanitizer(prop, null, 1 /* ValidateProperty */) : false);
        var updated = updateBindingData(context, data, countIndex, state.sourceIndex, prop, bindingIndex, value, forceUpdate, sanitizationRequired);
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
 * @returns whether or not the binding value was updated in the `LStylingData`.
 */
function updateBindingData(context, data, counterIndex, sourceIndex, prop, bindingIndex, value, forceUpdate, sanitizationRequired) {
    var hostBindingsMode = isHostStylingActive(sourceIndex);
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
    var changed = forceUpdate || hasValueChanged(data[bindingIndex], value);
    if (changed) {
        setValue(data, bindingIndex, value);
        var doSetValuesAsStale = (getConfig(context) & 32 /* HasHostBindings */) &&
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
 */
function renderHostBindingsAsStale(context, data, prop, isMapBased) {
    var valuesCount = getValuesCount(context);
    if (hasConfig(context, 1 /* HasPropBindings */)) {
        var itemsPerRow = 4 /* BindingsStartOffset */ + valuesCount;
        var i = 3 /* ValuesStartPosition */;
        while (i < context.length) {
            if (getProp(context, i) === prop) {
                break;
            }
            i += itemsPerRow;
        }
        var bindingsStart = i + 4 /* BindingsStartOffset */;
        var valuesStart = bindingsStart + 1; // the first column is template bindings
        var valuesEnd = bindingsStart + valuesCount - 1;
        for (var i_1 = valuesStart; i_1 < valuesEnd; i_1++) {
            var bindingIndex = context[i_1];
            if (bindingIndex !== 0) {
                setValue(data, bindingIndex, null);
            }
        }
    }
    if (hasConfig(context, 2 /* HasMapBindings */)) {
        var bindingsStart = 3 /* ValuesStartPosition */ + 4 /* BindingsStartOffset */;
        var valuesStart = bindingsStart + 1; // the first column is template bindings
        var valuesEnd = bindingsStart + valuesCount - 1;
        for (var i = valuesStart; i < valuesEnd; i++) {
            var stylingMap = getValue(data, context[i]);
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
 */
export function registerBinding(context, countId, sourceIndex, prop, bindingValue, sanitizationRequired) {
    var found = false;
    prop = prop || MAP_BASED_ENTRY_PROP_NAME;
    var total = getTotalSources(context);
    // if a new source is detected then a new column needs to be allocated into
    // the styling context. The column is basically a new allocation of binding
    // sources that will be available to each property.
    if (sourceIndex >= total) {
        addNewSourceColumn(context);
    }
    var isBindingIndexValue = typeof bindingValue === 'number';
    var entriesPerRow = 4 /* BindingsStartOffset */ + getValuesCount(context);
    var i = 3 /* ValuesStartPosition */;
    // all style/class bindings are sorted by property name
    while (i < context.length) {
        var p = getProp(context, i);
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
 */
function allocateNewContextEntry(context, index, prop, sanitizationRequired) {
    var config = sanitizationRequired ? 1 /* SanitizationRequired */ :
        0 /* Default */;
    context.splice(index, 0, config, // 1) config value
    DEFAULT_GUARD_MASK_VALUE, // 2) template bit mask
    DEFAULT_GUARD_MASK_VALUE, // 3) host bindings bit mask
    prop);
    index += 4; // the 4 values above
    // 5...) default binding index for the template value
    // depending on how many sources already exist in the context,
    // multiple default index entries may need to be inserted for
    // the new value in the context.
    var totalBindingsPerEntry = getTotalSources(context);
    for (var i = 0; i < totalBindingsPerEntry; i++) {
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
 */
function addBindingIntoContext(context, index, bindingValue, bitIndex, sourceIndex) {
    if (typeof bindingValue === 'number') {
        var hostBindingsMode = isHostStylingActive(sourceIndex);
        var cellIndex = index + 4 /* BindingsStartOffset */ + sourceIndex;
        context[cellIndex] = bindingValue;
        var updatedBitMask = getGuardMask(context, index, hostBindingsMode) | (1 << bitIndex);
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
 */
function addNewSourceColumn(context) {
    // we use -1 here because we want to insert right before the last value (the default value)
    var insertOffset = 4 /* BindingsStartOffset */ + getValuesCount(context) - 1;
    var index = 3 /* ValuesStartPosition */;
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
 */
export function flushStyling(renderer, data, classesContext, stylesContext, element, directiveIndex, styleSanitizer) {
    ngDevMode && ngDevMode.flushStyling++;
    var state = getStylingState(element, directiveIndex);
    var hostBindingsMode = isHostStylingActive(state.sourceIndex);
    if (stylesContext) {
        if (!isContextLocked(stylesContext, hostBindingsMode)) {
            lockAndFinalizeContext(stylesContext, hostBindingsMode);
        }
        applyStylingViaContext(stylesContext, renderer, element, data, state.stylesBitMask, setStyle, styleSanitizer, hostBindingsMode);
    }
    if (classesContext) {
        if (!isContextLocked(classesContext, hostBindingsMode)) {
            lockAndFinalizeContext(classesContext, hostBindingsMode);
        }
        applyStylingViaContext(classesContext, renderer, element, data, state.classesBitMask, setClass, null, hostBindingsMode);
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
 */
function lockAndFinalizeContext(context, hostBindingsMode) {
    var initialValues = getStylingMapArray(context);
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
 */
function updateInitialStylingOnContext(context, initialStyling) {
    // `-1` is used here because all initial styling data is not a apart
    // of a binding (since it's static)
    var COUNT_ID_FOR_STYLING = -1;
    var hasInitialStyling = false;
    for (var i = 1 /* ValuesStartPosition */; i < initialStyling.length; i += 2 /* TupleSize */) {
        var value = getMapValue(initialStyling, i);
        if (value) {
            var prop = getMapProp(initialStyling, i);
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
 * Visit `styling_next/map_based_bindings.ts` to learn more about how the
 * algorithm works for map-based styling bindings.
 *
 * Note that this function is not designed to be called in isolation (use
 * the `flushStyling` function so that it can call this function for both
 * the styles and classes contexts).
 */
export function applyStylingViaContext(context, renderer, element, bindingData, bitMaskValue, applyStylingFn, sanitizer, hostBindingsMode) {
    var bitMask = normalizeBitMaskValue(bitMaskValue);
    var stylingMapsSyncFn = null;
    var applyAllValues = false;
    if (hasConfig(context, 2 /* HasMapBindings */)) {
        stylingMapsSyncFn = getStylingMapsSyncFn();
        var mapsGuardMask = getGuardMask(context, 3 /* ValuesStartPosition */, hostBindingsMode);
        applyAllValues = (bitMask & mapsGuardMask) !== 0;
    }
    var valuesCount = getValuesCount(context);
    var totalBindingsToVisit = 1;
    var mapsMode = applyAllValues ? 1 /* ApplyAllValues */ : 0 /* TraverseValues */;
    if (hostBindingsMode) {
        mapsMode |= 8 /* RecurseInnerMaps */;
        totalBindingsToVisit = valuesCount - 1;
    }
    var i = getPropValuesStartPosition(context);
    while (i < context.length) {
        var guardMask = getGuardMask(context, i, hostBindingsMode);
        if (bitMask & guardMask) {
            var valueApplied = false;
            var prop = getProp(context, i);
            var defaultValue = getDefaultValue(context, i);
            // Part 1: Visit the `[styling.prop]` value
            for (var j = 0; j < totalBindingsToVisit; j++) {
                var bindingIndex = getBindingValue(context, i, j);
                if (!valueApplied && bindingIndex !== 0) {
                    var value = getValue(bindingData, bindingIndex);
                    if (isStylingValueDefined(value)) {
                        var checkValueOnly = hostBindingsMode && j === 0;
                        if (!checkValueOnly) {
                            var finalValue = sanitizer && isSanitizationRequired(context, i) ?
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
                    var mode = mapsMode | (valueApplied ? 4 /* SkipTargetProp */ :
                        2 /* ApplyTargetProp */);
                    if (hostBindingsMode && j === 0) {
                        mode |= 16 /* CheckValuesOnly */;
                    }
                    var valueAppliedWithinMap = stylingMapsSyncFn(context, renderer, element, bindingData, j, applyStylingFn, sanitizer, mode, prop, defaultValue);
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
 * @returns whether or not the styling map was applied to the element.
 */
export function applyStylingMapDirectly(renderer, context, element, data, bindingIndex, map, applyFn, sanitizer, forceUpdate) {
    if (forceUpdate || hasValueChanged(data[bindingIndex], map)) {
        setValue(data, bindingIndex, map);
        for (var i = 1 /* ValuesStartPosition */; i < map.length; i += 2 /* TupleSize */) {
            var prop = getMapProp(map, i);
            var value = getMapValue(map, i);
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
 * @returns whether or not the prop/value styling was applied to the element.
 */
export function applyStylingValueDirectly(renderer, context, element, data, bindingIndex, prop, value, applyFn, sanitizer) {
    if (hasValueChanged(data[bindingIndex], value)) {
        setValue(data, bindingIndex, value);
        applyStylingValue(renderer, context, element, prop, value, applyFn, bindingIndex, sanitizer);
        return true;
    }
    return false;
}
function applyStylingValue(renderer, context, element, prop, value, applyFn, bindingIndex, sanitizer) {
    var valueToApply = unwrapSafeValue(value);
    if (isStylingValueDefined(valueToApply)) {
        valueToApply =
            sanitizer ? sanitizer(prop, value, 2 /* SanitizeOnly */) : valueToApply;
    }
    else if (hasConfig(context, 8 /* HasInitialStyling */)) {
        var initialStyles = getStylingMapArray(context);
        if (initialStyles) {
            valueToApply = findInitialStylingValue(initialStyles, prop);
        }
    }
    applyFn(renderer, element, prop, valueToApply, bindingIndex);
}
function findInitialStylingValue(map, prop) {
    for (var i = 1 /* ValuesStartPosition */; i < map.length; i += 2 /* TupleSize */) {
        var p = getMapProp(map, i);
        if (p >= prop) {
            return p === prop ? getMapValue(map, i) : null;
        }
    }
    return null;
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
export var setStyle = function (renderer, native, prop, value) {
    // the reason why this may be `null` is either because
    // it's a container element or it's a part of a test
    // environment that doesn't have styling. In either
    // case it's safe not to apply styling to the element.
    var nativeStyle = native.style;
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
};
/**
 * Adds/removes the provided className value to the provided element.
 */
export var setClass = function (renderer, native, className, value) {
    if (className !== '') {
        // the reason why this may be `null` is either because
        // it's a container element or it's a part of a test
        // environment that doesn't have styling. In either
        // case it's safe not to apply styling to the element.
        var classList = native.classList;
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
};
/**
 * Iterates over all provided styling entries and renders them on the element.
 *
 * This function is used alongside a `StylingMapArray` entry. This entry is not
 * the same as the `TStylingContext` and is only really used when an element contains
 * initial styling values (e.g. `<div style="width:200px">`), but no style/class bindings
 * are present. If and when that happens then this function will be called to render all
 * initial styling values on an element.
 */
export function renderStylingMap(renderer, element, stylingValues, isClassBased) {
    var stylingMapArr = getStylingMapArray(stylingValues);
    if (stylingMapArr) {
        for (var i = 1 /* ValuesStartPosition */; i < stylingMapArr.length; i += 2 /* TupleSize */) {
            var prop = getMapProp(stylingMapArr, i);
            var value = getMapValue(stylingMapArr, i);
            if (isClassBased) {
                setClass(renderer, element, prop, value, null);
            }
            else {
                setStyle(renderer, element, prop, value, null);
            }
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmluZGluZ3MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL3N0eWxpbmdfbmV4dC9iaW5kaW5ncy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0VBTUU7QUFDRixPQUFPLEVBQVksZUFBZSxFQUFDLE1BQU0sMkJBQTJCLENBQUM7QUFFckUsT0FBTyxFQUEyQyxtQkFBbUIsRUFBRSxvQkFBb0IsRUFBQyxNQUFNLHdCQUF3QixDQUFDO0FBQzNILE9BQU8sRUFBQyxTQUFTLEVBQUMsTUFBTSxXQUFXLENBQUM7QUFHcEMsT0FBTyxFQUFDLGVBQWUsRUFBRSxpQkFBaUIsRUFBQyxNQUFNLFNBQVMsQ0FBQztBQUMzRCxPQUFPLEVBQUMscUJBQXFCLEVBQUUscUJBQXFCLEVBQUUsd0JBQXdCLEVBQUUseUJBQXlCLEVBQUUsZUFBZSxFQUFFLFNBQVMsRUFBRSxlQUFlLEVBQUUsWUFBWSxFQUFFLFVBQVUsRUFBRSxXQUFXLEVBQUUsT0FBTyxFQUFFLDBCQUEwQixFQUFFLGtCQUFrQixFQUFFLGVBQWUsRUFBRSxRQUFRLEVBQUUsY0FBYyxFQUFFLFNBQVMsRUFBRSxlQUFlLEVBQUUsZUFBZSxFQUFFLG1CQUFtQixFQUFFLHNCQUFzQixFQUFFLHFCQUFxQixFQUFFLFdBQVcsRUFBRSxXQUFXLEVBQUUsZUFBZSxFQUFFLFlBQVksRUFBRSxhQUFhLEVBQUUsUUFBUSxFQUFDLE1BQU0sUUFBUSxDQUFDO0FBSXBmOzs7Ozs7Ozs7Ozs7Ozs7OztHQWlCRztBQUVIOzs7O0dBSUc7QUFDSCxJQUFNLDZCQUE2QixHQUFHLENBQUMsQ0FBQztBQUV4Qzs7Ozs7Ozs7O0dBU0c7QUFDSCxNQUFNLFVBQVUscUJBQXFCLENBQ2pDLE9BQXdCLEVBQUUsSUFBa0IsRUFBRSxPQUFpQixFQUFFLGNBQXNCLEVBQ3ZGLElBQW1CLEVBQUUsWUFBb0IsRUFDekMsS0FB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LGFBQWEsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUM1QyxJQUFJLFlBQVksRUFBRTtnQkFDaEIsUUFBUSxDQUFDLFFBQVEsRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxJQUFJLENBQUMsQ0FBQzthQUNoRDtpQkFBTTtnQkFDTCxRQUFRLENBQUMsUUFBUSxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLElBQUksQ0FBQyxDQUFDO2FBQ2hEO1NBQ0Y7S0FDRjtBQUNILENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiogQGxpY2Vuc2VcbiogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4qXG4qIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4qIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiovXG5pbXBvcnQge1NhZmVWYWx1ZSwgdW53cmFwU2FmZVZhbHVlfSBmcm9tICcuLi8uLi9zYW5pdGl6YXRpb24vYnlwYXNzJztcbmltcG9ydCB7U3R5bGVTYW5pdGl6ZUZuLCBTdHlsZVNhbml0aXplTW9kZX0gZnJvbSAnLi4vLi4vc2FuaXRpemF0aW9uL3N0eWxlX3Nhbml0aXplcic7XG5pbXBvcnQge1Byb2NlZHVyYWxSZW5kZXJlcjMsIFJFbGVtZW50LCBSZW5kZXJlcjMsIFJlbmRlcmVyU3R5bGVGbGFnczMsIGlzUHJvY2VkdXJhbFJlbmRlcmVyfSBmcm9tICcuLi9pbnRlcmZhY2VzL3JlbmRlcmVyJztcbmltcG9ydCB7Tk9fQ0hBTkdFfSBmcm9tICcuLi90b2tlbnMnO1xuXG5pbXBvcnQge0FwcGx5U3R5bGluZ0ZuLCBMU3R5bGluZ0RhdGEsIFN0eWxpbmdNYXBBcnJheSwgU3R5bGluZ01hcEFycmF5SW5kZXgsIFN0eWxpbmdNYXBzU3luY01vZGUsIFN5bmNTdHlsaW5nTWFwc0ZuLCBUU3R5bGluZ0NvbmZpZywgVFN0eWxpbmdDb250ZXh0LCBUU3R5bGluZ0NvbnRleHRJbmRleCwgVFN0eWxpbmdDb250ZXh0UHJvcENvbmZpZ0ZsYWdzfSBmcm9tICcuL2ludGVyZmFjZXMnO1xuaW1wb3J0IHtnZXRTdHlsaW5nU3RhdGUsIHJlc2V0U3R5bGluZ1N0YXRlfSBmcm9tICcuL3N0YXRlJztcbmltcG9ydCB7REVGQVVMVF9CSU5ESU5HX0lOREVYLCBERUZBVUxUX0JJTkRJTkdfVkFMVUUsIERFRkFVTFRfR1VBUkRfTUFTS19WQUxVRSwgTUFQX0JBU0VEX0VOVFJZX1BST1BfTkFNRSwgZ2V0QmluZGluZ1ZhbHVlLCBnZXRDb25maWcsIGdldERlZmF1bHRWYWx1ZSwgZ2V0R3VhcmRNYXNrLCBnZXRNYXBQcm9wLCBnZXRNYXBWYWx1ZSwgZ2V0UHJvcCwgZ2V0UHJvcFZhbHVlc1N0YXJ0UG9zaXRpb24sIGdldFN0eWxpbmdNYXBBcnJheSwgZ2V0VG90YWxTb3VyY2VzLCBnZXRWYWx1ZSwgZ2V0VmFsdWVzQ291bnQsIGhhc0NvbmZpZywgaGFzVmFsdWVDaGFuZ2VkLCBpc0NvbnRleHRMb2NrZWQsIGlzSG9zdFN0eWxpbmdBY3RpdmUsIGlzU2FuaXRpemF0aW9uUmVxdWlyZWQsIGlzU3R5bGluZ1ZhbHVlRGVmaW5lZCwgbG9ja0NvbnRleHQsIHBhdGNoQ29uZmlnLCBzZXREZWZhdWx0VmFsdWUsIHNldEd1YXJkTWFzaywgc2V0TWFwQXNEaXJ0eSwgc2V0VmFsdWV9IGZyb20gJy4vdXRpbCc7XG5cblxuXG4vKipcbiAqIC0tLS0tLS0tXG4gKlxuICogVGhpcyBmaWxlIGNvbnRhaW5zIHRoZSBjb3JlIGxvZ2ljIGZvciBzdHlsaW5nIGluIEFuZ3VsYXIuXG4gKlxuICogQWxsIHN0eWxpbmcgYmluZGluZ3MgKGkuZS4gYFtzdHlsZV1gLCBgW3N0eWxlLnByb3BdYCwgYFtjbGFzc11gIGFuZCBgW2NsYXNzLm5hbWVdYClcbiAqIHdpbGwgaGF2ZSB0aGVpciB2YWx1ZXMgYmUgYXBwbGllZCB0aHJvdWdoIHRoZSBsb2dpYyBpbiB0aGlzIGZpbGUuXG4gKlxuICogV2hlbiBhIGJpbmRpbmcgaXMgZW5jb3VudGVyZWQgKGUuZy4gYDxkaXYgW3N0eWxlLndpZHRoXT1cIndcIj5gKSB0aGVuXG4gKiB0aGUgYmluZGluZyBkYXRhIHdpbGwgYmUgcG9wdWxhdGVkIGludG8gYSBgVFN0eWxpbmdDb250ZXh0YCBkYXRhLXN0cnVjdHVyZS5cbiAqIFRoZXJlIGlzIG9ubHkgb25lIGBUU3R5bGluZ0NvbnRleHRgIHBlciBgVE5vZGVgIGFuZCBlYWNoIGVsZW1lbnQgaW5zdGFuY2VcbiAqIHdpbGwgdXBkYXRlIGl0cyBzdHlsZS9jbGFzcyBiaW5kaW5nIHZhbHVlcyBpbiBjb25jZXJ0IHdpdGggdGhlIHN0eWxpbmdcbiAqIGNvbnRleHQuXG4gKlxuICogVG8gbGVhcm4gbW9yZSBhYm91dCB0aGUgYWxnb3JpdGhtIHNlZSBgVFN0eWxpbmdDb250ZXh0YC5cbiAqXG4gKiAtLS0tLS0tLVxuICovXG5cbi8qKlxuICogVGhlIGd1YXJkL3VwZGF0ZSBtYXNrIGJpdCBpbmRleCBsb2NhdGlvbiBmb3IgbWFwLWJhc2VkIGJpbmRpbmdzLlxuICpcbiAqIEFsbCBtYXAtYmFzZWQgYmluZGluZ3MgKGkuZS4gYFtzdHlsZV1gIGFuZCBgW2NsYXNzXWAgKVxuICovXG5jb25zdCBTVFlMSU5HX0lOREVYX0ZPUl9NQVBfQklORElORyA9IDA7XG5cbi8qKlxuICogVmlzaXRzIGEgY2xhc3MtYmFzZWQgYmluZGluZyBhbmQgdXBkYXRlcyB0aGUgbmV3IHZhbHVlIChpZiBjaGFuZ2VkKS5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIGlzIGNhbGxlZCBlYWNoIHRpbWUgYSBjbGFzcy1iYXNlZCBzdHlsaW5nIGluc3RydWN0aW9uXG4gKiBpcyBleGVjdXRlZC4gSXQncyBpbXBvcnRhbnQgdGhhdCBpdCdzIGFsd2F5cyBjYWxsZWQgKGV2ZW4gaWYgdGhlIHZhbHVlXG4gKiBoYXMgbm90IGNoYW5nZWQpIHNvIHRoYXQgdGhlIGlubmVyIGNvdW50ZXIgaW5kZXggdmFsdWUgaXMgaW5jcmVtZW50ZWQuXG4gKiBUaGlzIHdheSwgZWFjaCBpbnN0cnVjdGlvbiBpcyBhbHdheXMgZ3VhcmFudGVlZCB0byBnZXQgdGhlIHNhbWUgY291bnRlclxuICogc3RhdGUgZWFjaCB0aW1lIGl0J3MgY2FsbGVkICh3aGljaCB0aGVuIGFsbG93cyB0aGUgYFRTdHlsaW5nQ29udGV4dGBcbiAqIGFuZCB0aGUgYml0IG1hc2sgdmFsdWVzIHRvIGJlIGluIHN5bmMpLlxuICovXG5leHBvcnQgZnVuY3Rpb24gdXBkYXRlQ2xhc3NWaWFDb250ZXh0KFxuICAgIGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCwgZGF0YTogTFN0eWxpbmdEYXRhLCBlbGVtZW50OiBSRWxlbWVudCwgZGlyZWN0aXZlSW5kZXg6IG51bWJlcixcbiAgICBwcm9wOiBzdHJpbmcgfCBudWxsLCBiaW5kaW5nSW5kZXg6IG51bWJlcixcbiAgICB2YWx1ZTogYm9vbGVhbiB8IHN0cmluZyB8IG51bGwgfCB1bmRlZmluZWQgfCBTdHlsaW5nTWFwQXJyYXkgfCBOT19DSEFOR0UsXG4gICAgZm9yY2VVcGRhdGU/OiBib29sZWFuKTogYm9vbGVhbiB7XG4gIGNvbnN0IGlzTWFwQmFzZWQgPSAhcHJvcDtcbiAgY29uc3Qgc3RhdGUgPSBnZXRTdHlsaW5nU3RhdGUoZWxlbWVudCwgZGlyZWN0aXZlSW5kZXgpO1xuICBjb25zdCBjb3VudEluZGV4ID0gaXNNYXBCYXNlZCA/IFNUWUxJTkdfSU5ERVhfRk9SX01BUF9CSU5ESU5HIDogc3RhdGUuY2xhc3Nlc0luZGV4Kys7XG4gIGlmICh2YWx1ZSAhPT0gTk9fQ0hBTkdFKSB7XG4gICAgY29uc3QgdXBkYXRlZCA9IHVwZGF0ZUJpbmRpbmdEYXRhKFxuICAgICAgICBjb250ZXh0LCBkYXRhLCBjb3VudEluZGV4LCBzdGF0ZS5zb3VyY2VJbmRleCwgcHJvcCwgYmluZGluZ0luZGV4LCB2YWx1ZSwgZm9yY2VVcGRhdGUsXG4gICAgICAgIGZhbHNlKTtcbiAgICBpZiAodXBkYXRlZCB8fCBmb3JjZVVwZGF0ZSkge1xuICAgICAgLy8gV2UgZmxpcCB0aGUgYml0IGluIHRoZSBiaXRNYXNrIHRvIHJlZmxlY3QgdGhhdCB0aGUgYmluZGluZ1xuICAgICAgLy8gYXQgdGhlIGBpbmRleGAgc2xvdCBoYXMgY2hhbmdlZC4gVGhpcyBpZGVudGlmaWVzIHRvIHRoZSBmbHVzaGluZ1xuICAgICAgLy8gcGhhc2UgdGhhdCB0aGUgYmluZGluZ3MgZm9yIHRoaXMgcGFydGljdWxhciBDU1MgY2xhc3MgbmVlZCB0byBiZVxuICAgICAgLy8gYXBwbGllZCBhZ2FpbiBiZWNhdXNlIG9uIG9yIG1vcmUgb2YgdGhlIGJpbmRpbmdzIGZvciB0aGUgQ1NTXG4gICAgICAvLyBjbGFzcyBoYXZlIGNoYW5nZWQuXG4gICAgICBzdGF0ZS5jbGFzc2VzQml0TWFzayB8PSAxIDw8IGNvdW50SW5kZXg7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG4vKipcbiAqIFZpc2l0cyBhIHN0eWxlLWJhc2VkIGJpbmRpbmcgYW5kIHVwZGF0ZXMgdGhlIG5ldyB2YWx1ZSAoaWYgY2hhbmdlZCkuXG4gKlxuICogVGhpcyBmdW5jdGlvbiBpcyBjYWxsZWQgZWFjaCB0aW1lIGEgc3R5bGUtYmFzZWQgc3R5bGluZyBpbnN0cnVjdGlvblxuICogaXMgZXhlY3V0ZWQuIEl0J3MgaW1wb3J0YW50IHRoYXQgaXQncyBhbHdheXMgY2FsbGVkIChldmVuIGlmIHRoZSB2YWx1ZVxuICogaGFzIG5vdCBjaGFuZ2VkKSBzbyB0aGF0IHRoZSBpbm5lciBjb3VudGVyIGluZGV4IHZhbHVlIGlzIGluY3JlbWVudGVkLlxuICogVGhpcyB3YXksIGVhY2ggaW5zdHJ1Y3Rpb24gaXMgYWx3YXlzIGd1YXJhbnRlZWQgdG8gZ2V0IHRoZSBzYW1lIGNvdW50ZXJcbiAqIHN0YXRlIGVhY2ggdGltZSBpdCdzIGNhbGxlZCAod2hpY2ggdGhlbiBhbGxvd3MgdGhlIGBUU3R5bGluZ0NvbnRleHRgXG4gKiBhbmQgdGhlIGJpdCBtYXNrIHZhbHVlcyB0byBiZSBpbiBzeW5jKS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHVwZGF0ZVN0eWxlVmlhQ29udGV4dChcbiAgICBjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQsIGRhdGE6IExTdHlsaW5nRGF0YSwgZWxlbWVudDogUkVsZW1lbnQsIGRpcmVjdGl2ZUluZGV4OiBudW1iZXIsXG4gICAgcHJvcDogc3RyaW5nIHwgbnVsbCwgYmluZGluZ0luZGV4OiBudW1iZXIsXG4gICAgdmFsdWU6IHN0cmluZyB8IG51bWJlciB8IFNhZmVWYWx1ZSB8IG51bGwgfCB1bmRlZmluZWQgfCBTdHlsaW5nTWFwQXJyYXkgfCBOT19DSEFOR0UsXG4gICAgc2FuaXRpemVyOiBTdHlsZVNhbml0aXplRm4gfCBudWxsLCBmb3JjZVVwZGF0ZT86IGJvb2xlYW4pOiBib29sZWFuIHtcbiAgY29uc3QgaXNNYXBCYXNlZCA9ICFwcm9wO1xuICBjb25zdCBzdGF0ZSA9IGdldFN0eWxpbmdTdGF0ZShlbGVtZW50LCBkaXJlY3RpdmVJbmRleCk7XG4gIGNvbnN0IGNvdW50SW5kZXggPSBpc01hcEJhc2VkID8gU1RZTElOR19JTkRFWF9GT1JfTUFQX0JJTkRJTkcgOiBzdGF0ZS5zdHlsZXNJbmRleCsrO1xuICBpZiAodmFsdWUgIT09IE5PX0NIQU5HRSkge1xuICAgIGNvbnN0IHNhbml0aXphdGlvblJlcXVpcmVkID0gaXNNYXBCYXNlZCA/XG4gICAgICAgIHRydWUgOlxuICAgICAgICAoc2FuaXRpemVyID8gc2FuaXRpemVyKHByb3AgISwgbnVsbCwgU3R5bGVTYW5pdGl6ZU1vZGUuVmFsaWRhdGVQcm9wZXJ0eSkgOiBmYWxzZSk7XG4gICAgY29uc3QgdXBkYXRlZCA9IHVwZGF0ZUJpbmRpbmdEYXRhKFxuICAgICAgICBjb250ZXh0LCBkYXRhLCBjb3VudEluZGV4LCBzdGF0ZS5zb3VyY2VJbmRleCwgcHJvcCwgYmluZGluZ0luZGV4LCB2YWx1ZSwgZm9yY2VVcGRhdGUsXG4gICAgICAgIHNhbml0aXphdGlvblJlcXVpcmVkKTtcbiAgICBpZiAodXBkYXRlZCB8fCBmb3JjZVVwZGF0ZSkge1xuICAgICAgLy8gV2UgZmxpcCB0aGUgYml0IGluIHRoZSBiaXRNYXNrIHRvIHJlZmxlY3QgdGhhdCB0aGUgYmluZGluZ1xuICAgICAgLy8gYXQgdGhlIGBpbmRleGAgc2xvdCBoYXMgY2hhbmdlZC4gVGhpcyBpZGVudGlmaWVzIHRvIHRoZSBmbHVzaGluZ1xuICAgICAgLy8gcGhhc2UgdGhhdCB0aGUgYmluZGluZ3MgZm9yIHRoaXMgcGFydGljdWxhciBwcm9wZXJ0eSBuZWVkIHRvIGJlXG4gICAgICAvLyBhcHBsaWVkIGFnYWluIGJlY2F1c2Ugb24gb3IgbW9yZSBvZiB0aGUgYmluZGluZ3MgZm9yIHRoZSBDU1NcbiAgICAgIC8vIHByb3BlcnR5IGhhdmUgY2hhbmdlZC5cbiAgICAgIHN0YXRlLnN0eWxlc0JpdE1hc2sgfD0gMSA8PCBjb3VudEluZGV4O1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9XG4gIHJldHVybiBmYWxzZTtcbn1cblxuLyoqXG4gKiBDYWxsZWQgZWFjaCB0aW1lIGEgYmluZGluZyB2YWx1ZSBoYXMgY2hhbmdlZCB3aXRoaW4gdGhlIHByb3ZpZGVkIGBUU3R5bGluZ0NvbnRleHRgLlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gaXMgZGVzaWduZWQgdG8gYmUgY2FsbGVkIGZyb20gYHVwZGF0ZVN0eWxlQmluZGluZ2AgYW5kIGB1cGRhdGVDbGFzc0JpbmRpbmdgLlxuICogSWYgY2FsbGVkIGR1cmluZyB0aGUgZmlyc3QgdXBkYXRlIHBhc3MsIHRoZSBiaW5kaW5nIHdpbGwgYmUgcmVnaXN0ZXJlZCBpbiB0aGUgY29udGV4dC5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIHdpbGwgYWxzbyB1cGRhdGUgYmluZGluZyBzbG90IGluIHRoZSBwcm92aWRlZCBgTFN0eWxpbmdEYXRhYCB3aXRoIHRoZVxuICogbmV3IGJpbmRpbmcgZW50cnkgKGlmIGl0IGhhcyBjaGFuZ2VkKS5cbiAqXG4gKiBAcmV0dXJucyB3aGV0aGVyIG9yIG5vdCB0aGUgYmluZGluZyB2YWx1ZSB3YXMgdXBkYXRlZCBpbiB0aGUgYExTdHlsaW5nRGF0YWAuXG4gKi9cbmZ1bmN0aW9uIHVwZGF0ZUJpbmRpbmdEYXRhKFxuICAgIGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCwgZGF0YTogTFN0eWxpbmdEYXRhLCBjb3VudGVySW5kZXg6IG51bWJlciwgc291cmNlSW5kZXg6IG51bWJlcixcbiAgICBwcm9wOiBzdHJpbmcgfCBudWxsLCBiaW5kaW5nSW5kZXg6IG51bWJlcixcbiAgICB2YWx1ZTogc3RyaW5nIHwgU2FmZVZhbHVlIHwgbnVtYmVyIHwgYm9vbGVhbiB8IG51bGwgfCB1bmRlZmluZWQgfCBTdHlsaW5nTWFwQXJyYXksXG4gICAgZm9yY2VVcGRhdGU/OiBib29sZWFuLCBzYW5pdGl6YXRpb25SZXF1aXJlZD86IGJvb2xlYW4pOiBib29sZWFuIHtcbiAgY29uc3QgaG9zdEJpbmRpbmdzTW9kZSA9IGlzSG9zdFN0eWxpbmdBY3RpdmUoc291cmNlSW5kZXgpO1xuICBpZiAoIWlzQ29udGV4dExvY2tlZChjb250ZXh0LCBob3N0QmluZGluZ3NNb2RlKSkge1xuICAgIC8vIHRoaXMgd2lsbCBvbmx5IGhhcHBlbiBkdXJpbmcgdGhlIGZpcnN0IHVwZGF0ZSBwYXNzIG9mIHRoZVxuICAgIC8vIGNvbnRleHQuIFRoZSByZWFzb24gd2h5IHdlIGNhbid0IHVzZSBgdE5vZGUuZmlyc3RUZW1wbGF0ZVBhc3NgXG4gICAgLy8gaGVyZSBpcyBiZWNhdXNlIGl0cyBub3QgZ3VhcmFudGVlZCB0byBiZSB0cnVlIHdoZW4gdGhlIGZpcnN0XG4gICAgLy8gdXBkYXRlIHBhc3MgaXMgZXhlY3V0ZWQgKHJlbWVtYmVyIHRoYXQgYWxsIHN0eWxpbmcgaW5zdHJ1Y3Rpb25zXG4gICAgLy8gYXJlIHJ1biBpbiB0aGUgdXBkYXRlIHBoYXNlLCBhbmQsIGFzIGEgcmVzdWx0LCBhcmUgbm8gbW9yZVxuICAgIC8vIHN0eWxpbmcgaW5zdHJ1Y3Rpb25zIHRoYXQgYXJlIHJ1biBpbiB0aGUgY3JlYXRpb24gcGhhc2UpLlxuICAgIHJlZ2lzdGVyQmluZGluZyhjb250ZXh0LCBjb3VudGVySW5kZXgsIHNvdXJjZUluZGV4LCBwcm9wLCBiaW5kaW5nSW5kZXgsIHNhbml0aXphdGlvblJlcXVpcmVkKTtcbiAgICBwYXRjaENvbmZpZyhcbiAgICAgICAgY29udGV4dCxcbiAgICAgICAgaG9zdEJpbmRpbmdzTW9kZSA/IFRTdHlsaW5nQ29uZmlnLkhhc0hvc3RCaW5kaW5ncyA6IFRTdHlsaW5nQ29uZmlnLkhhc1RlbXBsYXRlQmluZGluZ3MpO1xuICAgIHBhdGNoQ29uZmlnKGNvbnRleHQsIHByb3AgPyBUU3R5bGluZ0NvbmZpZy5IYXNQcm9wQmluZGluZ3MgOiBUU3R5bGluZ0NvbmZpZy5IYXNNYXBCaW5kaW5ncyk7XG4gIH1cblxuICBjb25zdCBjaGFuZ2VkID0gZm9yY2VVcGRhdGUgfHwgaGFzVmFsdWVDaGFuZ2VkKGRhdGFbYmluZGluZ0luZGV4XSwgdmFsdWUpO1xuICBpZiAoY2hhbmdlZCkge1xuICAgIHNldFZhbHVlKGRhdGEsIGJpbmRpbmdJbmRleCwgdmFsdWUpO1xuICAgIGNvbnN0IGRvU2V0VmFsdWVzQXNTdGFsZSA9IChnZXRDb25maWcoY29udGV4dCkgJiBUU3R5bGluZ0NvbmZpZy5IYXNIb3N0QmluZGluZ3MpICYmXG4gICAgICAgICFob3N0QmluZGluZ3NNb2RlICYmIChwcm9wID8gIXZhbHVlIDogdHJ1ZSk7XG4gICAgaWYgKGRvU2V0VmFsdWVzQXNTdGFsZSkge1xuICAgICAgcmVuZGVySG9zdEJpbmRpbmdzQXNTdGFsZShjb250ZXh0LCBkYXRhLCBwcm9wLCAhcHJvcCk7XG4gICAgfVxuICB9XG4gIHJldHVybiBjaGFuZ2VkO1xufVxuXG4vKipcbiAqIEl0ZXJhdGVzIG92ZXIgYWxsIGhvc3QtYmluZGluZyB2YWx1ZXMgZm9yIHRoZSBnaXZlbiBgcHJvcGAgdmFsdWUgaW4gdGhlIGNvbnRleHQgYW5kIHNldHMgdGhlaXJcbiAqIGNvcnJlc3BvbmRpbmcgYmluZGluZyB2YWx1ZXMgdG8gYG51bGxgLlxuICpcbiAqIFdoZW5ldmVyIGEgdGVtcGxhdGUgYmluZGluZyBjaGFuZ2VzIGl0cyB2YWx1ZSB0byBgbnVsbGAsIGFsbCBob3N0LWJpbmRpbmcgdmFsdWVzIHNob3VsZCBiZVxuICogcmUtYXBwbGllZFxuICogdG8gdGhlIGVsZW1lbnQgd2hlbiB0aGUgaG9zdCBiaW5kaW5ncyBhcmUgZXZhbHVhdGVkLiBUaGlzIG1heSBub3QgYWx3YXlzIGhhcHBlbiBpbiB0aGUgZXZlbnRcbiAqIHRoYXQgbm9uZSBvZiB0aGUgYmluZGluZ3MgY2hhbmdlZCB3aXRoaW4gdGhlIGhvc3QgYmluZGluZ3MgY29kZS4gRm9yIHRoaXMgcmVhc29uIHRoaXMgZnVuY3Rpb25cbiAqIGlzIGV4cGVjdGVkIHRvIGJlIGNhbGxlZCBlYWNoIHRpbWUgYSB0ZW1wbGF0ZSBiaW5kaW5nIGJlY29tZXMgZmFsc3kgb3Igd2hlbiBhIG1hcC1iYXNlZCB0ZW1wbGF0ZVxuICogYmluZGluZyBjaGFuZ2VzLlxuICovXG5mdW5jdGlvbiByZW5kZXJIb3N0QmluZGluZ3NBc1N0YWxlKFxuICAgIGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCwgZGF0YTogTFN0eWxpbmdEYXRhLCBwcm9wOiBzdHJpbmcgfCBudWxsLCBpc01hcEJhc2VkOiBib29sZWFuKTogdm9pZCB7XG4gIGNvbnN0IHZhbHVlc0NvdW50ID0gZ2V0VmFsdWVzQ291bnQoY29udGV4dCk7XG5cbiAgaWYgKGhhc0NvbmZpZyhjb250ZXh0LCBUU3R5bGluZ0NvbmZpZy5IYXNQcm9wQmluZGluZ3MpKSB7XG4gICAgY29uc3QgaXRlbXNQZXJSb3cgPSBUU3R5bGluZ0NvbnRleHRJbmRleC5CaW5kaW5nc1N0YXJ0T2Zmc2V0ICsgdmFsdWVzQ291bnQ7XG5cbiAgICBsZXQgaSA9IFRTdHlsaW5nQ29udGV4dEluZGV4LlZhbHVlc1N0YXJ0UG9zaXRpb247XG4gICAgd2hpbGUgKGkgPCBjb250ZXh0Lmxlbmd0aCkge1xuICAgICAgaWYgKGdldFByb3AoY29udGV4dCwgaSkgPT09IHByb3ApIHtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBpICs9IGl0ZW1zUGVyUm93O1xuICAgIH1cblxuICAgIGNvbnN0IGJpbmRpbmdzU3RhcnQgPSBpICsgVFN0eWxpbmdDb250ZXh0SW5kZXguQmluZGluZ3NTdGFydE9mZnNldDtcbiAgICBjb25zdCB2YWx1ZXNTdGFydCA9IGJpbmRpbmdzU3RhcnQgKyAxOyAgLy8gdGhlIGZpcnN0IGNvbHVtbiBpcyB0ZW1wbGF0ZSBiaW5kaW5nc1xuICAgIGNvbnN0IHZhbHVlc0VuZCA9IGJpbmRpbmdzU3RhcnQgKyB2YWx1ZXNDb3VudCAtIDE7XG5cbiAgICBmb3IgKGxldCBpID0gdmFsdWVzU3RhcnQ7IGkgPCB2YWx1ZXNFbmQ7IGkrKykge1xuICAgICAgY29uc3QgYmluZGluZ0luZGV4ID0gY29udGV4dFtpXSBhcyBudW1iZXI7XG4gICAgICBpZiAoYmluZGluZ0luZGV4ICE9PSAwKSB7XG4gICAgICAgIHNldFZhbHVlKGRhdGEsIGJpbmRpbmdJbmRleCwgbnVsbCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgaWYgKGhhc0NvbmZpZyhjb250ZXh0LCBUU3R5bGluZ0NvbmZpZy5IYXNNYXBCaW5kaW5ncykpIHtcbiAgICBjb25zdCBiaW5kaW5nc1N0YXJ0ID1cbiAgICAgICAgVFN0eWxpbmdDb250ZXh0SW5kZXguVmFsdWVzU3RhcnRQb3NpdGlvbiArIFRTdHlsaW5nQ29udGV4dEluZGV4LkJpbmRpbmdzU3RhcnRPZmZzZXQ7XG4gICAgY29uc3QgdmFsdWVzU3RhcnQgPSBiaW5kaW5nc1N0YXJ0ICsgMTsgIC8vIHRoZSBmaXJzdCBjb2x1bW4gaXMgdGVtcGxhdGUgYmluZGluZ3NcbiAgICBjb25zdCB2YWx1ZXNFbmQgPSBiaW5kaW5nc1N0YXJ0ICsgdmFsdWVzQ291bnQgLSAxO1xuICAgIGZvciAobGV0IGkgPSB2YWx1ZXNTdGFydDsgaSA8IHZhbHVlc0VuZDsgaSsrKSB7XG4gICAgICBjb25zdCBzdHlsaW5nTWFwID0gZ2V0VmFsdWU8U3R5bGluZ01hcEFycmF5PihkYXRhLCBjb250ZXh0W2ldIGFzIG51bWJlcik7XG4gICAgICBpZiAoc3R5bGluZ01hcCkge1xuICAgICAgICBzZXRNYXBBc0RpcnR5KHN0eWxpbmdNYXApO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIFJlZ2lzdGVycyB0aGUgcHJvdmlkZWQgYmluZGluZyAocHJvcCArIGJpbmRpbmdJbmRleCkgaW50byB0aGUgY29udGV4dC5cbiAqXG4gKiBJdCBpcyBuZWVkZWQgYmVjYXVzZSBpdCB3aWxsIGVpdGhlciB1cGRhdGUgb3IgaW5zZXJ0IGEgc3R5bGluZyBwcm9wZXJ0eVxuICogaW50byB0aGUgY29udGV4dCBhdCB0aGUgY29ycmVjdCBzcG90LlxuICpcbiAqIFdoZW4gY2FsbGVkLCBvbmUgb2YgdHdvIHRoaW5ncyB3aWxsIGhhcHBlbjpcbiAqXG4gKiAxKSBJZiB0aGUgcHJvcGVydHkgYWxyZWFkeSBleGlzdHMgaW4gdGhlIGNvbnRleHQgdGhlbiBpdCB3aWxsIGp1c3QgYWRkXG4gKiAgICB0aGUgcHJvdmlkZWQgYGJpbmRpbmdWYWx1ZWAgdG8gdGhlIGVuZCBvZiB0aGUgYmluZGluZyBzb3VyY2VzIHJlZ2lvblxuICogICAgZm9yIHRoYXQgcGFydGljdWxhciBwcm9wZXJ0eS5cbiAqXG4gKiAgICAtIElmIHRoZSBiaW5kaW5nIHZhbHVlIGlzIGEgbnVtYmVyIHRoZW4gaXQgd2lsbCBiZSBhZGRlZCBhcyBhIG5ld1xuICogICAgICBiaW5kaW5nIGluZGV4IHNvdXJjZSBuZXh0IHRvIHRoZSBvdGhlciBiaW5kaW5nIHNvdXJjZXMgZm9yIHRoZSBwcm9wZXJ0eS5cbiAqXG4gKiAgICAtIE90aGVyd2lzZSwgaWYgdGhlIGJpbmRpbmcgdmFsdWUgaXMgYSBzdHJpbmcvYm9vbGVhbi9udWxsIHR5cGUgdGhlbiBpdCB3aWxsXG4gKiAgICAgIHJlcGxhY2UgdGhlIGRlZmF1bHQgdmFsdWUgZm9yIHRoZSBwcm9wZXJ0eSBpZiB0aGUgZGVmYXVsdCB2YWx1ZSBpcyBgbnVsbGAuXG4gKlxuICogMikgSWYgdGhlIHByb3BlcnR5IGRvZXMgbm90IGV4aXN0IHRoZW4gaXQgd2lsbCBiZSBpbnNlcnRlZCBpbnRvIHRoZSBjb250ZXh0LlxuICogICAgVGhlIHN0eWxpbmcgY29udGV4dCByZWxpZXMgb24gYWxsIHByb3BlcnRpZXMgYmVpbmcgc3RvcmVkIGluIGFscGhhYmV0aWNhbFxuICogICAgb3JkZXIsIHNvIGl0IGtub3dzIGV4YWN0bHkgd2hlcmUgdG8gc3RvcmUgaXQuXG4gKlxuICogICAgV2hlbiBpbnNlcnRlZCwgYSBkZWZhdWx0IGBudWxsYCB2YWx1ZSBpcyBjcmVhdGVkIGZvciB0aGUgcHJvcGVydHkgd2hpY2ggZXhpc3RzXG4gKiAgICBhcyB0aGUgZGVmYXVsdCB2YWx1ZSBmb3IgdGhlIGJpbmRpbmcuIElmIHRoZSBiaW5kaW5nVmFsdWUgcHJvcGVydHkgaXMgaW5zZXJ0ZWRcbiAqICAgIGFuZCBpdCBpcyBlaXRoZXIgYSBzdHJpbmcsIG51bWJlciBvciBudWxsIHZhbHVlIHRoZW4gdGhhdCB3aWxsIHJlcGxhY2UgdGhlIGRlZmF1bHRcbiAqICAgIHZhbHVlLlxuICpcbiAqIE5vdGUgdGhhdCB0aGlzIGZ1bmN0aW9uIGlzIGFsc28gdXNlZCBmb3IgbWFwLWJhc2VkIHN0eWxpbmcgYmluZGluZ3MuIFRoZXkgYXJlIHRyZWF0ZWRcbiAqIG11Y2ggdGhlIHNhbWUgYXMgcHJvcC1iYXNlZCBiaW5kaW5ncywgYnV0LCB0aGVpciBwcm9wZXJ0eSBuYW1lIHZhbHVlIGlzIHNldCBhcyBgW01BUF1gLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVnaXN0ZXJCaW5kaW5nKFxuICAgIGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCwgY291bnRJZDogbnVtYmVyLCBzb3VyY2VJbmRleDogbnVtYmVyLCBwcm9wOiBzdHJpbmcgfCBudWxsLFxuICAgIGJpbmRpbmdWYWx1ZTogbnVtYmVyIHwgbnVsbCB8IHN0cmluZyB8IGJvb2xlYW4sIHNhbml0aXphdGlvblJlcXVpcmVkPzogYm9vbGVhbik6IHZvaWQge1xuICBsZXQgZm91bmQgPSBmYWxzZTtcbiAgcHJvcCA9IHByb3AgfHwgTUFQX0JBU0VEX0VOVFJZX1BST1BfTkFNRTtcblxuICBjb25zdCB0b3RhbCA9IGdldFRvdGFsU291cmNlcyhjb250ZXh0KTtcblxuICAvLyBpZiBhIG5ldyBzb3VyY2UgaXMgZGV0ZWN0ZWQgdGhlbiBhIG5ldyBjb2x1bW4gbmVlZHMgdG8gYmUgYWxsb2NhdGVkIGludG9cbiAgLy8gdGhlIHN0eWxpbmcgY29udGV4dC4gVGhlIGNvbHVtbiBpcyBiYXNpY2FsbHkgYSBuZXcgYWxsb2NhdGlvbiBvZiBiaW5kaW5nXG4gIC8vIHNvdXJjZXMgdGhhdCB3aWxsIGJlIGF2YWlsYWJsZSB0byBlYWNoIHByb3BlcnR5LlxuICBpZiAoc291cmNlSW5kZXggPj0gdG90YWwpIHtcbiAgICBhZGROZXdTb3VyY2VDb2x1bW4oY29udGV4dCk7XG4gIH1cblxuICBjb25zdCBpc0JpbmRpbmdJbmRleFZhbHVlID0gdHlwZW9mIGJpbmRpbmdWYWx1ZSA9PT0gJ251bWJlcic7XG4gIGNvbnN0IGVudHJpZXNQZXJSb3cgPSBUU3R5bGluZ0NvbnRleHRJbmRleC5CaW5kaW5nc1N0YXJ0T2Zmc2V0ICsgZ2V0VmFsdWVzQ291bnQoY29udGV4dCk7XG4gIGxldCBpID0gVFN0eWxpbmdDb250ZXh0SW5kZXguVmFsdWVzU3RhcnRQb3NpdGlvbjtcblxuICAvLyBhbGwgc3R5bGUvY2xhc3MgYmluZGluZ3MgYXJlIHNvcnRlZCBieSBwcm9wZXJ0eSBuYW1lXG4gIHdoaWxlIChpIDwgY29udGV4dC5sZW5ndGgpIHtcbiAgICBjb25zdCBwID0gZ2V0UHJvcChjb250ZXh0LCBpKTtcbiAgICBpZiAocHJvcCA8PSBwKSB7XG4gICAgICBpZiAocHJvcCA8IHApIHtcbiAgICAgICAgYWxsb2NhdGVOZXdDb250ZXh0RW50cnkoY29udGV4dCwgaSwgcHJvcCwgc2FuaXRpemF0aW9uUmVxdWlyZWQpO1xuICAgICAgfSBlbHNlIGlmIChpc0JpbmRpbmdJbmRleFZhbHVlKSB7XG4gICAgICAgIHBhdGNoQ29uZmlnKGNvbnRleHQsIFRTdHlsaW5nQ29uZmlnLkhhc0NvbGxpc2lvbnMpO1xuICAgICAgfVxuICAgICAgYWRkQmluZGluZ0ludG9Db250ZXh0KGNvbnRleHQsIGksIGJpbmRpbmdWYWx1ZSwgY291bnRJZCwgc291cmNlSW5kZXgpO1xuICAgICAgZm91bmQgPSB0cnVlO1xuICAgICAgYnJlYWs7XG4gICAgfVxuICAgIGkgKz0gZW50cmllc1BlclJvdztcbiAgfVxuXG4gIGlmICghZm91bmQpIHtcbiAgICBhbGxvY2F0ZU5ld0NvbnRleHRFbnRyeShjb250ZXh0LCBjb250ZXh0Lmxlbmd0aCwgcHJvcCwgc2FuaXRpemF0aW9uUmVxdWlyZWQpO1xuICAgIGFkZEJpbmRpbmdJbnRvQ29udGV4dChjb250ZXh0LCBpLCBiaW5kaW5nVmFsdWUsIGNvdW50SWQsIHNvdXJjZUluZGV4KTtcbiAgfVxufVxuXG4vKipcbiAqIEluc2VydHMgYSBuZXcgcm93IGludG8gdGhlIHByb3ZpZGVkIGBUU3R5bGluZ0NvbnRleHRgIGFuZCBhc3NpZ25zIHRoZSBwcm92aWRlZCBgcHJvcGAgdmFsdWUgYXNcbiAqIHRoZSBwcm9wZXJ0eSBlbnRyeS5cbiAqL1xuZnVuY3Rpb24gYWxsb2NhdGVOZXdDb250ZXh0RW50cnkoXG4gICAgY29udGV4dDogVFN0eWxpbmdDb250ZXh0LCBpbmRleDogbnVtYmVyLCBwcm9wOiBzdHJpbmcsIHNhbml0aXphdGlvblJlcXVpcmVkPzogYm9vbGVhbik6IHZvaWQge1xuICBjb25zdCBjb25maWcgPSBzYW5pdGl6YXRpb25SZXF1aXJlZCA/IFRTdHlsaW5nQ29udGV4dFByb3BDb25maWdGbGFncy5TYW5pdGl6YXRpb25SZXF1aXJlZCA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgVFN0eWxpbmdDb250ZXh0UHJvcENvbmZpZ0ZsYWdzLkRlZmF1bHQ7XG4gIGNvbnRleHQuc3BsaWNlKFxuICAgICAgaW5kZXgsIDAsXG4gICAgICBjb25maWcsICAgICAgICAgICAgICAgICAgICAvLyAxKSBjb25maWcgdmFsdWVcbiAgICAgIERFRkFVTFRfR1VBUkRfTUFTS19WQUxVRSwgIC8vIDIpIHRlbXBsYXRlIGJpdCBtYXNrXG4gICAgICBERUZBVUxUX0dVQVJEX01BU0tfVkFMVUUsICAvLyAzKSBob3N0IGJpbmRpbmdzIGJpdCBtYXNrXG4gICAgICBwcm9wLCAgICAgICAgICAgICAgICAgICAgICAvLyA0KSBwcm9wIHZhbHVlIChlLmcuIGB3aWR0aGAsIGBteUNsYXNzYCwgZXRjLi4uKVxuICAgICAgKTtcblxuICBpbmRleCArPSA0OyAgLy8gdGhlIDQgdmFsdWVzIGFib3ZlXG5cbiAgLy8gNS4uLikgZGVmYXVsdCBiaW5kaW5nIGluZGV4IGZvciB0aGUgdGVtcGxhdGUgdmFsdWVcbiAgLy8gZGVwZW5kaW5nIG9uIGhvdyBtYW55IHNvdXJjZXMgYWxyZWFkeSBleGlzdCBpbiB0aGUgY29udGV4dCxcbiAgLy8gbXVsdGlwbGUgZGVmYXVsdCBpbmRleCBlbnRyaWVzIG1heSBuZWVkIHRvIGJlIGluc2VydGVkIGZvclxuICAvLyB0aGUgbmV3IHZhbHVlIGluIHRoZSBjb250ZXh0LlxuICBjb25zdCB0b3RhbEJpbmRpbmdzUGVyRW50cnkgPSBnZXRUb3RhbFNvdXJjZXMoY29udGV4dCk7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgdG90YWxCaW5kaW5nc1BlckVudHJ5OyBpKyspIHtcbiAgICBjb250ZXh0LnNwbGljZShpbmRleCwgMCwgREVGQVVMVF9CSU5ESU5HX0lOREVYKTtcbiAgICBpbmRleCsrO1xuICB9XG5cbiAgLy8gNikgZGVmYXVsdCBiaW5kaW5nIHZhbHVlIGZvciB0aGUgbmV3IGVudHJ5XG4gIGNvbnRleHQuc3BsaWNlKGluZGV4LCAwLCBERUZBVUxUX0JJTkRJTkdfVkFMVUUpO1xufVxuXG4vKipcbiAqIEluc2VydHMgYSBuZXcgYmluZGluZyB2YWx1ZSBpbnRvIGEgc3R5bGluZyBwcm9wZXJ0eSB0dXBsZSBpbiB0aGUgYFRTdHlsaW5nQ29udGV4dGAuXG4gKlxuICogQSBiaW5kaW5nVmFsdWUgaXMgaW5zZXJ0ZWQgaW50byBhIGNvbnRleHQgZHVyaW5nIHRoZSBmaXJzdCB1cGRhdGUgcGFzc1xuICogb2YgYSB0ZW1wbGF0ZSBvciBob3N0IGJpbmRpbmdzIGZ1bmN0aW9uLiBXaGVuIHRoaXMgb2NjdXJzLCB0d28gdGhpbmdzXG4gKiBoYXBwZW46XG4gKlxuICogLSBJZiB0aGUgYmluZGluZ1ZhbHVlIHZhbHVlIGlzIGEgbnVtYmVyIHRoZW4gaXQgaXMgdHJlYXRlZCBhcyBhIGJpbmRpbmdJbmRleFxuICogICB2YWx1ZSAoYSBpbmRleCBpbiB0aGUgYExWaWV3YCkgYW5kIGl0IHdpbGwgYmUgaW5zZXJ0ZWQgbmV4dCB0byB0aGUgb3RoZXJcbiAqICAgYmluZGluZyBpbmRleCBlbnRyaWVzLlxuICpcbiAqIC0gT3RoZXJ3aXNlIHRoZSBiaW5kaW5nIHZhbHVlIHdpbGwgdXBkYXRlIHRoZSBkZWZhdWx0IHZhbHVlIGZvciB0aGUgcHJvcGVydHlcbiAqICAgYW5kIHRoaXMgd2lsbCBvbmx5IGhhcHBlbiBpZiB0aGUgZGVmYXVsdCB2YWx1ZSBpcyBgbnVsbGAuXG4gKi9cbmZ1bmN0aW9uIGFkZEJpbmRpbmdJbnRvQ29udGV4dChcbiAgICBjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQsIGluZGV4OiBudW1iZXIsIGJpbmRpbmdWYWx1ZTogbnVtYmVyIHwgc3RyaW5nIHwgYm9vbGVhbiB8IG51bGwsXG4gICAgYml0SW5kZXg6IG51bWJlciwgc291cmNlSW5kZXg6IG51bWJlcikge1xuICBpZiAodHlwZW9mIGJpbmRpbmdWYWx1ZSA9PT0gJ251bWJlcicpIHtcbiAgICBjb25zdCBob3N0QmluZGluZ3NNb2RlID0gaXNIb3N0U3R5bGluZ0FjdGl2ZShzb3VyY2VJbmRleCk7XG4gICAgY29uc3QgY2VsbEluZGV4ID0gaW5kZXggKyBUU3R5bGluZ0NvbnRleHRJbmRleC5CaW5kaW5nc1N0YXJ0T2Zmc2V0ICsgc291cmNlSW5kZXg7XG4gICAgY29udGV4dFtjZWxsSW5kZXhdID0gYmluZGluZ1ZhbHVlO1xuICAgIGNvbnN0IHVwZGF0ZWRCaXRNYXNrID0gZ2V0R3VhcmRNYXNrKGNvbnRleHQsIGluZGV4LCBob3N0QmluZGluZ3NNb2RlKSB8ICgxIDw8IGJpdEluZGV4KTtcbiAgICBzZXRHdWFyZE1hc2soY29udGV4dCwgaW5kZXgsIHVwZGF0ZWRCaXRNYXNrLCBob3N0QmluZGluZ3NNb2RlKTtcbiAgfSBlbHNlIGlmIChiaW5kaW5nVmFsdWUgIT09IG51bGwgJiYgZ2V0RGVmYXVsdFZhbHVlKGNvbnRleHQsIGluZGV4KSA9PT0gbnVsbCkge1xuICAgIHNldERlZmF1bHRWYWx1ZShjb250ZXh0LCBpbmRleCwgYmluZGluZ1ZhbHVlKTtcbiAgfVxufVxuXG4vKipcbiAqIFJlZ2lzdGVycyBhIG5ldyBjb2x1bW4gaW50byB0aGUgcHJvdmlkZWQgYFRTdHlsaW5nQ29udGV4dGAuXG4gKlxuICogSWYgYW5kIHdoZW4gYSBuZXcgc291cmNlIGlzIGRldGVjdGVkIHRoZW4gYSBuZXcgY29sdW1uIG5lZWRzIHRvXG4gKiBiZSBhbGxvY2F0ZWQgaW50byB0aGUgc3R5bGluZyBjb250ZXh0LiBUaGUgY29sdW1uIGlzIGJhc2ljYWxseVxuICogYSBuZXcgYWxsb2NhdGlvbiBvZiBiaW5kaW5nIHNvdXJjZXMgdGhhdCB3aWxsIGJlIGF2YWlsYWJsZSB0byBlYWNoXG4gKiBwcm9wZXJ0eS5cbiAqXG4gKiBFYWNoIGNvbHVtbiB0aGF0IGV4aXN0cyBpbiB0aGUgc3R5bGluZyBjb250ZXh0IHJlc2VtYmxlcyBhIHN0eWxpbmdcbiAqIHNvdXJjZS4gQSBzdHlsaW5nIHNvdXJjZSBhbiBlaXRoZXIgYmUgdGhlIHRlbXBsYXRlIG9yIG9uZSBvciBtb3JlXG4gKiBjb21wb25lbnRzIG9yIGRpcmVjdGl2ZXMgYWxsIGNvbnRhaW5pbmcgc3R5bGluZyBob3N0IGJpbmRpbmdzLlxuICovXG5mdW5jdGlvbiBhZGROZXdTb3VyY2VDb2x1bW4oY29udGV4dDogVFN0eWxpbmdDb250ZXh0KTogdm9pZCB7XG4gIC8vIHdlIHVzZSAtMSBoZXJlIGJlY2F1c2Ugd2Ugd2FudCB0byBpbnNlcnQgcmlnaHQgYmVmb3JlIHRoZSBsYXN0IHZhbHVlICh0aGUgZGVmYXVsdCB2YWx1ZSlcbiAgY29uc3QgaW5zZXJ0T2Zmc2V0ID0gVFN0eWxpbmdDb250ZXh0SW5kZXguQmluZGluZ3NTdGFydE9mZnNldCArIGdldFZhbHVlc0NvdW50KGNvbnRleHQpIC0gMTtcblxuICBsZXQgaW5kZXggPSBUU3R5bGluZ0NvbnRleHRJbmRleC5WYWx1ZXNTdGFydFBvc2l0aW9uO1xuICB3aGlsZSAoaW5kZXggPCBjb250ZXh0Lmxlbmd0aCkge1xuICAgIGluZGV4ICs9IGluc2VydE9mZnNldDtcbiAgICBjb250ZXh0LnNwbGljZShpbmRleCsrLCAwLCBERUZBVUxUX0JJTkRJTkdfSU5ERVgpO1xuXG4gICAgLy8gdGhlIHZhbHVlIHdhcyBpbnNlcnRlZCBqdXN0IGJlZm9yZSB0aGUgZGVmYXVsdCB2YWx1ZSwgYnV0IHRoZVxuICAgIC8vIG5leHQgZW50cnkgaW4gdGhlIGNvbnRleHQgc3RhcnRzIGp1c3QgYWZ0ZXIgaXQuIFRoZXJlZm9yZSsrLlxuICAgIGluZGV4Kys7XG4gIH1cbiAgY29udGV4dFtUU3R5bGluZ0NvbnRleHRJbmRleC5Ub3RhbFNvdXJjZXNQb3NpdGlvbl0rKztcbn1cblxuLyoqXG4gKiBBcHBsaWVzIGFsbCBwZW5kaW5nIHN0eWxlIGFuZCBjbGFzcyBiaW5kaW5ncyB0byB0aGUgcHJvdmlkZWQgZWxlbWVudC5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIHdpbGwgYXR0ZW1wdCB0byBmbHVzaCBzdHlsaW5nIHZpYSB0aGUgcHJvdmlkZWQgYGNsYXNzZXNDb250ZXh0YFxuICogYW5kIGBzdHlsZXNDb250ZXh0YCBjb250ZXh0IHZhbHVlcy4gVGhpcyBmdW5jdGlvbiBpcyBkZXNpZ25lZCB0byBiZSBydW4gZnJvbVxuICogdGhlIGludGVybmFsIGBzdHlsaW5nQXBwbHlgIGZ1bmN0aW9uICh3aGljaCBpcyBzY2hlZHVsZWQgdG8gcnVuIGF0IHRoZSB2ZXJ5XG4gKiBlbmQgb2YgY2hhbmdlIGRldGVjdGlvbiBmb3IgYW4gZWxlbWVudCBpZiBvbmUgb3IgbW9yZSBzdHlsZS9jbGFzcyBiaW5kaW5nc1xuICogd2VyZSBwcm9jZXNzZWQpIGFuZCB3aWxsIHJlbHkgb24gYW55IHN0YXRlIHZhbHVlcyB0aGF0IGFyZSBzZXQgZnJvbSB3aGVuXG4gKiBhbnkgb2YgdGhlIHN0eWxpbmcgYmluZGluZ3MgZXhlY3V0ZWQuXG4gKlxuICogVGhpcyBmdW5jdGlvbiBpcyBkZXNpZ25lZCB0byBiZSBjYWxsZWQgdHdpY2U6IG9uZSB3aGVuIGNoYW5nZSBkZXRlY3Rpb24gaGFzXG4gKiBwcm9jZXNzZWQgYW4gZWxlbWVudCB3aXRoaW4gdGhlIHRlbXBsYXRlIGJpbmRpbmdzIChpLmUuIGp1c3QgYXMgYGFkdmFuY2UoKWBcbiAqIGlzIGNhbGxlZCkgYW5kIHdoZW4gaG9zdCBiaW5kaW5ncyBoYXZlIGJlZW4gcHJvY2Vzc2VkLiBJbiBib3RoIGNhc2VzIHRoZVxuICogc3R5bGVzIGFuZCBjbGFzc2VzIGluIGJvdGggY29udGV4dHMgd2lsbCBiZSBhcHBsaWVkIHRvIHRoZSBlbGVtZW50LCBidXQgdGhlXG4gKiBhbGdvcml0aG0gd2lsbCBzZWxlY3RpdmVseSBkZWNpZGUgd2hpY2ggYmluZGluZ3MgdG8gcnVuIGRlcGVuZGluZyBvbiB0aGVcbiAqIGNvbHVtbnMgaW4gdGhlIGNvbnRleHQuIFRoZSBwcm92aWRlZCBgZGlyZWN0aXZlSW5kZXhgIHZhbHVlIHdpbGwgaGVscCB0aGVcbiAqIGFsZ29yaXRobSBkZXRlcm1pbmUgd2hpY2ggYmluZGluZ3MgdG8gYXBwbHk6IGVpdGhlciB0aGUgdGVtcGxhdGUgYmluZGluZ3Mgb3JcbiAqIHRoZSBob3N0IGJpbmRpbmdzIChzZWUgYGFwcGx5U3R5bGluZ1RvRWxlbWVudGAgZm9yIG1vcmUgaW5mb3JtYXRpb24pLlxuICpcbiAqIE5vdGUgdGhhdCBvbmNlIHRoaXMgZnVuY3Rpb24gaXMgY2FsbGVkIGFsbCB0ZW1wb3Jhcnkgc3R5bGluZyBzdGF0ZSBkYXRhXG4gKiAoaS5lLiB0aGUgYGJpdE1hc2tgIGFuZCBgY291bnRlcmAgdmFsdWVzIGZvciBzdHlsZXMgYW5kIGNsYXNzZXMgd2lsbCBiZSBjbGVhcmVkKS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGZsdXNoU3R5bGluZyhcbiAgICByZW5kZXJlcjogUmVuZGVyZXIzIHwgUHJvY2VkdXJhbFJlbmRlcmVyMyB8IG51bGwsIGRhdGE6IExTdHlsaW5nRGF0YSxcbiAgICBjbGFzc2VzQ29udGV4dDogVFN0eWxpbmdDb250ZXh0IHwgbnVsbCwgc3R5bGVzQ29udGV4dDogVFN0eWxpbmdDb250ZXh0IHwgbnVsbCxcbiAgICBlbGVtZW50OiBSRWxlbWVudCwgZGlyZWN0aXZlSW5kZXg6IG51bWJlciwgc3R5bGVTYW5pdGl6ZXI6IFN0eWxlU2FuaXRpemVGbiB8IG51bGwpOiB2b2lkIHtcbiAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5mbHVzaFN0eWxpbmcrKztcblxuICBjb25zdCBzdGF0ZSA9IGdldFN0eWxpbmdTdGF0ZShlbGVtZW50LCBkaXJlY3RpdmVJbmRleCk7XG4gIGNvbnN0IGhvc3RCaW5kaW5nc01vZGUgPSBpc0hvc3RTdHlsaW5nQWN0aXZlKHN0YXRlLnNvdXJjZUluZGV4KTtcblxuICBpZiAoc3R5bGVzQ29udGV4dCkge1xuICAgIGlmICghaXNDb250ZXh0TG9ja2VkKHN0eWxlc0NvbnRleHQsIGhvc3RCaW5kaW5nc01vZGUpKSB7XG4gICAgICBsb2NrQW5kRmluYWxpemVDb250ZXh0KHN0eWxlc0NvbnRleHQsIGhvc3RCaW5kaW5nc01vZGUpO1xuICAgIH1cbiAgICBhcHBseVN0eWxpbmdWaWFDb250ZXh0KFxuICAgICAgICBzdHlsZXNDb250ZXh0LCByZW5kZXJlciwgZWxlbWVudCwgZGF0YSwgc3RhdGUuc3R5bGVzQml0TWFzaywgc2V0U3R5bGUsIHN0eWxlU2FuaXRpemVyLFxuICAgICAgICBob3N0QmluZGluZ3NNb2RlKTtcbiAgfVxuXG4gIGlmIChjbGFzc2VzQ29udGV4dCkge1xuICAgIGlmICghaXNDb250ZXh0TG9ja2VkKGNsYXNzZXNDb250ZXh0LCBob3N0QmluZGluZ3NNb2RlKSkge1xuICAgICAgbG9ja0FuZEZpbmFsaXplQ29udGV4dChjbGFzc2VzQ29udGV4dCwgaG9zdEJpbmRpbmdzTW9kZSk7XG4gICAgfVxuICAgIGFwcGx5U3R5bGluZ1ZpYUNvbnRleHQoXG4gICAgICAgIGNsYXNzZXNDb250ZXh0LCByZW5kZXJlciwgZWxlbWVudCwgZGF0YSwgc3RhdGUuY2xhc3Nlc0JpdE1hc2ssIHNldENsYXNzLCBudWxsLFxuICAgICAgICBob3N0QmluZGluZ3NNb2RlKTtcbiAgfVxuXG4gIHJlc2V0U3R5bGluZ1N0YXRlKCk7XG59XG5cbi8qKlxuICogTG9ja3MgdGhlIGNvbnRleHQgKHNvIG5vIG1vcmUgYmluZGluZ3MgY2FuIGJlIGFkZGVkKSBhbmQgYWxzbyBjb3BpZXMgb3ZlciBpbml0aWFsIGNsYXNzL3N0eWxlXG4gKiB2YWx1ZXMgaW50byB0aGVpciBiaW5kaW5nIGFyZWFzLlxuICpcbiAqIFRoZXJlIGFyZSB0d28gbWFpbiBhY3Rpb25zIHRoYXQgdGFrZSBwbGFjZSBpbiB0aGlzIGZ1bmN0aW9uOlxuICpcbiAqIC0gTG9ja2luZyB0aGUgY29udGV4dDpcbiAqICAgTG9ja2luZyB0aGUgY29udGV4dCBpcyByZXF1aXJlZCBzbyB0aGF0IHRoZSBzdHlsZS9jbGFzcyBpbnN0cnVjdGlvbnMga25vdyBOT1QgdG9cbiAqICAgcmVnaXN0ZXIgYSBiaW5kaW5nIGFnYWluIGFmdGVyIHRoZSBmaXJzdCB1cGRhdGUgcGFzcyBoYXMgcnVuLiBJZiBhIGxvY2tpbmcgYml0IHdhc1xuICogICBub3QgdXNlZCB0aGVuIGl0IHdvdWxkIG5lZWQgdG8gc2NhbiBvdmVyIHRoZSBjb250ZXh0IGVhY2ggdGltZSBhbiBpbnN0cnVjdGlvbiBpcyBydW5cbiAqICAgKHdoaWNoIGlzIGV4cGVuc2l2ZSkuXG4gKlxuICogLSBQYXRjaGluZyBpbml0aWFsIHZhbHVlczpcbiAqICAgRGlyZWN0aXZlcyBhbmQgY29tcG9uZW50IGhvc3QgYmluZGluZ3MgbWF5IGluY2x1ZGUgc3RhdGljIGNsYXNzL3N0eWxlIHZhbHVlcyB3aGljaCBhcmVcbiAqICAgYm91bmQgdG8gdGhlIGhvc3QgZWxlbWVudC4gV2hlbiB0aGlzIGhhcHBlbnMsIHRoZSBzdHlsaW5nIGNvbnRleHQgd2lsbCBuZWVkIHRvIGJlIGluZm9ybWVkXG4gKiAgIHNvIGl0IGNhbiB1c2UgdGhlc2Ugc3RhdGljIHN0eWxpbmcgdmFsdWVzIGFzIGRlZmF1bHRzIHdoZW4gYSBtYXRjaGluZyBiaW5kaW5nIGlzIGZhbHN5LlxuICogICBUaGVzZSBpbml0aWFsIHN0eWxpbmcgdmFsdWVzIGFyZSByZWFkIGZyb20gdGhlIGluaXRpYWwgc3R5bGluZyB2YWx1ZXMgc2xvdCB3aXRoaW4gdGhlXG4gKiAgIHByb3ZpZGVkIGBUU3R5bGluZ0NvbnRleHRgICh3aGljaCBpcyBhbiBpbnN0YW5jZSBvZiBhIGBTdHlsaW5nTWFwQXJyYXlgKS4gVGhpcyBpbm5lciBtYXAgd2lsbFxuICogICBiZSB1cGRhdGVkIGVhY2ggdGltZSBhIGhvc3QgYmluZGluZyBhcHBsaWVzIGl0cyBzdGF0aWMgc3R5bGluZyB2YWx1ZXMgKHZpYSBgZWxlbWVudEhvc3RBdHRyc2ApXG4gKiAgIHNvIHRoZXNlIHZhbHVlcyBhcmUgb25seSByZWFkIGF0IHRoaXMgcG9pbnQgYmVjYXVzZSB0aGlzIGlzIHRoZSB2ZXJ5IGxhc3QgcG9pbnQgYmVmb3JlIHRoZVxuICogICBmaXJzdCBzdHlsZS9jbGFzcyB2YWx1ZXMgYXJlIGZsdXNoZWQgdG8gdGhlIGVsZW1lbnQuXG4gKlxuICogTm90ZSB0aGF0IHRoZSBgVFN0eWxpbmdDb250ZXh0YCBzdHlsaW5nIGNvbnRleHQgY29udGFpbnMgdHdvIGxvY2tzOiBvbmUgZm9yIHRlbXBsYXRlIGJpbmRpbmdzXG4gKiBhbmQgYW5vdGhlciBmb3IgaG9zdCBiaW5kaW5ncy4gRWl0aGVyIG9uZSBvZiB0aGVzZSBsb2NrcyB3aWxsIGJlIHNldCB3aGVuIHN0eWxpbmcgaXMgYXBwbGllZFxuICogZHVyaW5nIHRoZSB0ZW1wbGF0ZSBiaW5kaW5nIGZsdXNoIGFuZC9vciBkdXJpbmcgdGhlIGhvc3QgYmluZGluZ3MgZmx1c2guXG4gKi9cbmZ1bmN0aW9uIGxvY2tBbmRGaW5hbGl6ZUNvbnRleHQoY29udGV4dDogVFN0eWxpbmdDb250ZXh0LCBob3N0QmluZGluZ3NNb2RlOiBib29sZWFuKTogdm9pZCB7XG4gIGNvbnN0IGluaXRpYWxWYWx1ZXMgPSBnZXRTdHlsaW5nTWFwQXJyYXkoY29udGV4dCkgITtcbiAgdXBkYXRlSW5pdGlhbFN0eWxpbmdPbkNvbnRleHQoY29udGV4dCwgaW5pdGlhbFZhbHVlcyk7XG4gIGxvY2tDb250ZXh0KGNvbnRleHQsIGhvc3RCaW5kaW5nc01vZGUpO1xufVxuXG4vKipcbiAqIFJlZ2lzdGVycyBhbGwgaW5pdGlhbCBzdHlsaW5nIGVudHJpZXMgaW50byB0aGUgcHJvdmlkZWQgY29udGV4dC5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIHdpbGwgaXRlcmF0ZSBvdmVyIGFsbCBlbnRyaWVzIGluIHRoZSBwcm92aWRlZCBgaW5pdGlhbFN0eWxpbmdgIGFyfXJheSBhbmQgcmVnaXN0ZXJcbiAqIHRoZW0gYXMgZGVmYXVsdCAoaW5pdGlhbCkgdmFsdWVzIGluIHRoZSBwcm92aWRlZCBjb250ZXh0LiBJbml0aWFsIHN0eWxpbmcgdmFsdWVzIGluIGEgY29udGV4dCBhcmVcbiAqIHRoZSBkZWZhdWx0IHZhbHVlcyB0aGF0IGFyZSB0byBiZSBhcHBsaWVkIHVubGVzcyBvdmVyd3JpdHRlbiBieSBhIGJpbmRpbmcuXG4gKlxuICogVGhlIHJlYXNvbiB3aHkgdGhpcyBmdW5jdGlvbiBleGlzdHMgYW5kIGlzbid0IGEgcGFydCBvZiB0aGUgY29udGV4dCBjb25zdHJ1Y3Rpb24gaXMgYmVjYXVzZVxuICogaG9zdCBiaW5kaW5nIGlzIGV2YWx1YXRlZCBhdCBhIGxhdGVyIHN0YWdlIGFmdGVyIHRoZSBlbGVtZW50IGlzIGNyZWF0ZWQuIFRoaXMgbWVhbnMgdGhhdFxuICogaWYgYSBkaXJlY3RpdmUgb3IgY29tcG9uZW50IGNvbnRhaW5zIGFueSBpbml0aWFsIHN0eWxpbmcgY29kZSAoaS5lLiBgPGRpdiBjbGFzcz1cImZvb1wiPmApXG4gKiB0aGVuIHRoYXQgaW5pdGlhbCBzdHlsaW5nIGRhdGEgY2FuIG9ubHkgYmUgYXBwbGllZCBvbmNlIHRoZSBzdHlsaW5nIGZvciB0aGF0IGVsZW1lbnRcbiAqIGlzIGZpcnN0IGFwcGxpZWQgKGF0IHRoZSBlbmQgb2YgdGhlIHVwZGF0ZSBwaGFzZSkuIE9uY2UgdGhhdCBoYXBwZW5zIHRoZW4gdGhlIGNvbnRleHQgd2lsbFxuICogdXBkYXRlIGl0c2VsZiB3aXRoIHRoZSBjb21wbGV0ZSBpbml0aWFsIHN0eWxpbmcgZm9yIHRoZSBlbGVtZW50LlxuICovXG5mdW5jdGlvbiB1cGRhdGVJbml0aWFsU3R5bGluZ09uQ29udGV4dChcbiAgICBjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQsIGluaXRpYWxTdHlsaW5nOiBTdHlsaW5nTWFwQXJyYXkpOiB2b2lkIHtcbiAgLy8gYC0xYCBpcyB1c2VkIGhlcmUgYmVjYXVzZSBhbGwgaW5pdGlhbCBzdHlsaW5nIGRhdGEgaXMgbm90IGEgYXBhcnRcbiAgLy8gb2YgYSBiaW5kaW5nIChzaW5jZSBpdCdzIHN0YXRpYylcbiAgY29uc3QgQ09VTlRfSURfRk9SX1NUWUxJTkcgPSAtMTtcblxuICBsZXQgaGFzSW5pdGlhbFN0eWxpbmcgPSBmYWxzZTtcbiAgZm9yIChsZXQgaSA9IFN0eWxpbmdNYXBBcnJheUluZGV4LlZhbHVlc1N0YXJ0UG9zaXRpb247IGkgPCBpbml0aWFsU3R5bGluZy5sZW5ndGg7XG4gICAgICAgaSArPSBTdHlsaW5nTWFwQXJyYXlJbmRleC5UdXBsZVNpemUpIHtcbiAgICBjb25zdCB2YWx1ZSA9IGdldE1hcFZhbHVlKGluaXRpYWxTdHlsaW5nLCBpKTtcbiAgICBpZiAodmFsdWUpIHtcbiAgICAgIGNvbnN0IHByb3AgPSBnZXRNYXBQcm9wKGluaXRpYWxTdHlsaW5nLCBpKTtcbiAgICAgIHJlZ2lzdGVyQmluZGluZyhjb250ZXh0LCBDT1VOVF9JRF9GT1JfU1RZTElORywgMCwgcHJvcCwgdmFsdWUsIGZhbHNlKTtcbiAgICAgIGhhc0luaXRpYWxTdHlsaW5nID0gdHJ1ZTtcbiAgICB9XG4gIH1cblxuICBpZiAoaGFzSW5pdGlhbFN0eWxpbmcpIHtcbiAgICBwYXRjaENvbmZpZyhjb250ZXh0LCBUU3R5bGluZ0NvbmZpZy5IYXNJbml0aWFsU3R5bGluZyk7XG4gIH1cbn1cblxuLyoqXG4gKiBSdW5zIHRocm91Z2ggdGhlIHByb3ZpZGVkIHN0eWxpbmcgY29udGV4dCBhbmQgYXBwbGllcyBlYWNoIHZhbHVlIHRvXG4gKiB0aGUgcHJvdmlkZWQgZWxlbWVudCAodmlhIHRoZSByZW5kZXJlcikgaWYgb25lIG9yIG1vcmUgdmFsdWVzIGFyZSBwcmVzZW50LlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gd2lsbCBpdGVyYXRlIG92ZXIgYWxsIGVudHJpZXMgcHJlc2VudCBpbiB0aGUgcHJvdmlkZWRcbiAqIGBUU3R5bGluZ0NvbnRleHRgIGFycmF5IChib3RoIHByb3AtYmFzZWQgYW5kIG1hcC1iYXNlZCBiaW5kaW5ncykuLVxuICpcbiAqIEVhY2ggZW50cnksIHdpdGhpbiB0aGUgYFRTdHlsaW5nQ29udGV4dGAgYXJyYXksIGlzIHN0b3JlZCBhbHBoYWJldGljYWxseVxuICogYW5kIHRoaXMgbWVhbnMgdGhhdCBlYWNoIHByb3AvdmFsdWUgZW50cnkgd2lsbCBiZSBhcHBsaWVkIGluIG9yZGVyXG4gKiAoc28gbG9uZyBhcyBpdCBpcyBtYXJrZWQgZGlydHkgaW4gdGhlIHByb3ZpZGVkIGBiaXRNYXNrYCB2YWx1ZSkuXG4gKlxuICogSWYgdGhlcmUgYXJlIGFueSBtYXAtYmFzZWQgZW50cmllcyBwcmVzZW50ICh3aGljaCBhcmUgYXBwbGllZCB0byB0aGVcbiAqIGVsZW1lbnQgdmlhIHRoZSBgW3N0eWxlXWAgYW5kIGBbY2xhc3NdYCBiaW5kaW5ncykgdGhlbiB0aG9zZSBlbnRyaWVzXG4gKiB3aWxsIGJlIGFwcGxpZWQgYXMgd2VsbC4gSG93ZXZlciwgdGhlIGNvZGUgZm9yIHRoYXQgaXMgbm90IGEgcGFydCBvZlxuICogdGhpcyBmdW5jdGlvbi4gSW5zdGVhZCwgZWFjaCB0aW1lIGEgcHJvcGVydHkgaXMgdmlzaXRlZCwgdGhlbiB0aGVcbiAqIGNvZGUgYmVsb3cgd2lsbCBjYWxsIGFuIGV4dGVybmFsIGZ1bmN0aW9uIGNhbGxlZCBgc3R5bGluZ01hcHNTeW5jRm5gXG4gKiBhbmQsIGlmIHByZXNlbnQsIGl0IHdpbGwga2VlcCB0aGUgYXBwbGljYXRpb24gb2Ygc3R5bGluZyB2YWx1ZXMgaW5cbiAqIG1hcC1iYXNlZCBiaW5kaW5ncyB1cCB0byBzeW5jIHdpdGggdGhlIGFwcGxpY2F0aW9uIG9mIHByb3AtYmFzZWRcbiAqIGJpbmRpbmdzLlxuICpcbiAqIFZpc2l0IGBzdHlsaW5nX25leHQvbWFwX2Jhc2VkX2JpbmRpbmdzLnRzYCB0byBsZWFybiBtb3JlIGFib3V0IGhvdyB0aGVcbiAqIGFsZ29yaXRobSB3b3JrcyBmb3IgbWFwLWJhc2VkIHN0eWxpbmcgYmluZGluZ3MuXG4gKlxuICogTm90ZSB0aGF0IHRoaXMgZnVuY3Rpb24gaXMgbm90IGRlc2lnbmVkIHRvIGJlIGNhbGxlZCBpbiBpc29sYXRpb24gKHVzZVxuICogdGhlIGBmbHVzaFN0eWxpbmdgIGZ1bmN0aW9uIHNvIHRoYXQgaXQgY2FuIGNhbGwgdGhpcyBmdW5jdGlvbiBmb3IgYm90aFxuICogdGhlIHN0eWxlcyBhbmQgY2xhc3NlcyBjb250ZXh0cykuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhcHBseVN0eWxpbmdWaWFDb250ZXh0KFxuICAgIGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCwgcmVuZGVyZXI6IFJlbmRlcmVyMyB8IFByb2NlZHVyYWxSZW5kZXJlcjMgfCBudWxsLCBlbGVtZW50OiBSRWxlbWVudCxcbiAgICBiaW5kaW5nRGF0YTogTFN0eWxpbmdEYXRhLCBiaXRNYXNrVmFsdWU6IG51bWJlciB8IGJvb2xlYW4sIGFwcGx5U3R5bGluZ0ZuOiBBcHBseVN0eWxpbmdGbixcbiAgICBzYW5pdGl6ZXI6IFN0eWxlU2FuaXRpemVGbiB8IG51bGwsIGhvc3RCaW5kaW5nc01vZGU6IGJvb2xlYW4pOiB2b2lkIHtcbiAgY29uc3QgYml0TWFzayA9IG5vcm1hbGl6ZUJpdE1hc2tWYWx1ZShiaXRNYXNrVmFsdWUpO1xuXG4gIGxldCBzdHlsaW5nTWFwc1N5bmNGbjogU3luY1N0eWxpbmdNYXBzRm58bnVsbCA9IG51bGw7XG4gIGxldCBhcHBseUFsbFZhbHVlcyA9IGZhbHNlO1xuICBpZiAoaGFzQ29uZmlnKGNvbnRleHQsIFRTdHlsaW5nQ29uZmlnLkhhc01hcEJpbmRpbmdzKSkge1xuICAgIHN0eWxpbmdNYXBzU3luY0ZuID0gZ2V0U3R5bGluZ01hcHNTeW5jRm4oKTtcbiAgICBjb25zdCBtYXBzR3VhcmRNYXNrID1cbiAgICAgICAgZ2V0R3VhcmRNYXNrKGNvbnRleHQsIFRTdHlsaW5nQ29udGV4dEluZGV4LlZhbHVlc1N0YXJ0UG9zaXRpb24sIGhvc3RCaW5kaW5nc01vZGUpO1xuICAgIGFwcGx5QWxsVmFsdWVzID0gKGJpdE1hc2sgJiBtYXBzR3VhcmRNYXNrKSAhPT0gMDtcbiAgfVxuXG4gIGNvbnN0IHZhbHVlc0NvdW50ID0gZ2V0VmFsdWVzQ291bnQoY29udGV4dCk7XG4gIGxldCB0b3RhbEJpbmRpbmdzVG9WaXNpdCA9IDE7XG4gIGxldCBtYXBzTW9kZSA9XG4gICAgICBhcHBseUFsbFZhbHVlcyA/IFN0eWxpbmdNYXBzU3luY01vZGUuQXBwbHlBbGxWYWx1ZXMgOiBTdHlsaW5nTWFwc1N5bmNNb2RlLlRyYXZlcnNlVmFsdWVzO1xuICBpZiAoaG9zdEJpbmRpbmdzTW9kZSkge1xuICAgIG1hcHNNb2RlIHw9IFN0eWxpbmdNYXBzU3luY01vZGUuUmVjdXJzZUlubmVyTWFwcztcbiAgICB0b3RhbEJpbmRpbmdzVG9WaXNpdCA9IHZhbHVlc0NvdW50IC0gMTtcbiAgfVxuXG4gIGxldCBpID0gZ2V0UHJvcFZhbHVlc1N0YXJ0UG9zaXRpb24oY29udGV4dCk7XG4gIHdoaWxlIChpIDwgY29udGV4dC5sZW5ndGgpIHtcbiAgICBjb25zdCBndWFyZE1hc2sgPSBnZXRHdWFyZE1hc2soY29udGV4dCwgaSwgaG9zdEJpbmRpbmdzTW9kZSk7XG4gICAgaWYgKGJpdE1hc2sgJiBndWFyZE1hc2spIHtcbiAgICAgIGxldCB2YWx1ZUFwcGxpZWQgPSBmYWxzZTtcbiAgICAgIGNvbnN0IHByb3AgPSBnZXRQcm9wKGNvbnRleHQsIGkpO1xuICAgICAgY29uc3QgZGVmYXVsdFZhbHVlID0gZ2V0RGVmYXVsdFZhbHVlKGNvbnRleHQsIGkpO1xuXG4gICAgICAvLyBQYXJ0IDE6IFZpc2l0IHRoZSBgW3N0eWxpbmcucHJvcF1gIHZhbHVlXG4gICAgICBmb3IgKGxldCBqID0gMDsgaiA8IHRvdGFsQmluZGluZ3NUb1Zpc2l0OyBqKyspIHtcbiAgICAgICAgY29uc3QgYmluZGluZ0luZGV4ID0gZ2V0QmluZGluZ1ZhbHVlKGNvbnRleHQsIGksIGopIGFzIG51bWJlcjtcbiAgICAgICAgaWYgKCF2YWx1ZUFwcGxpZWQgJiYgYmluZGluZ0luZGV4ICE9PSAwKSB7XG4gICAgICAgICAgY29uc3QgdmFsdWUgPSBnZXRWYWx1ZShiaW5kaW5nRGF0YSwgYmluZGluZ0luZGV4KTtcbiAgICAgICAgICBpZiAoaXNTdHlsaW5nVmFsdWVEZWZpbmVkKHZhbHVlKSkge1xuICAgICAgICAgICAgY29uc3QgY2hlY2tWYWx1ZU9ubHkgPSBob3N0QmluZGluZ3NNb2RlICYmIGogPT09IDA7XG4gICAgICAgICAgICBpZiAoIWNoZWNrVmFsdWVPbmx5KSB7XG4gICAgICAgICAgICAgIGNvbnN0IGZpbmFsVmFsdWUgPSBzYW5pdGl6ZXIgJiYgaXNTYW5pdGl6YXRpb25SZXF1aXJlZChjb250ZXh0LCBpKSA/XG4gICAgICAgICAgICAgICAgICBzYW5pdGl6ZXIocHJvcCwgdmFsdWUsIFN0eWxlU2FuaXRpemVNb2RlLlNhbml0aXplT25seSkgOlxuICAgICAgICAgICAgICAgICAgdW53cmFwU2FmZVZhbHVlKHZhbHVlKTtcbiAgICAgICAgICAgICAgYXBwbHlTdHlsaW5nRm4ocmVuZGVyZXIsIGVsZW1lbnQsIHByb3AsIGZpbmFsVmFsdWUsIGJpbmRpbmdJbmRleCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YWx1ZUFwcGxpZWQgPSB0cnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFBhcnQgMjogVmlzaXQgdGhlIGBbc3R5bGVdYCBvciBgW2NsYXNzXWAgbWFwLWJhc2VkIHZhbHVlXG4gICAgICAgIGlmIChzdHlsaW5nTWFwc1N5bmNGbikge1xuICAgICAgICAgIC8vIGRldGVybWluZSB3aGV0aGVyIG9yIG5vdCB0byBhcHBseSB0aGUgdGFyZ2V0IHByb3BlcnR5IG9yIHRvIHNraXAgaXRcbiAgICAgICAgICBsZXQgbW9kZSA9IG1hcHNNb2RlIHwgKHZhbHVlQXBwbGllZCA/IFN0eWxpbmdNYXBzU3luY01vZGUuU2tpcFRhcmdldFByb3AgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgU3R5bGluZ01hcHNTeW5jTW9kZS5BcHBseVRhcmdldFByb3ApO1xuICAgICAgICAgIGlmIChob3N0QmluZGluZ3NNb2RlICYmIGogPT09IDApIHtcbiAgICAgICAgICAgIG1vZGUgfD0gU3R5bGluZ01hcHNTeW5jTW9kZS5DaGVja1ZhbHVlc09ubHk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGNvbnN0IHZhbHVlQXBwbGllZFdpdGhpbk1hcCA9IHN0eWxpbmdNYXBzU3luY0ZuKFxuICAgICAgICAgICAgICBjb250ZXh0LCByZW5kZXJlciwgZWxlbWVudCwgYmluZGluZ0RhdGEsIGosIGFwcGx5U3R5bGluZ0ZuLCBzYW5pdGl6ZXIsIG1vZGUsIHByb3AsXG4gICAgICAgICAgICAgIGRlZmF1bHRWYWx1ZSk7XG4gICAgICAgICAgdmFsdWVBcHBsaWVkID0gdmFsdWVBcHBsaWVkIHx8IHZhbHVlQXBwbGllZFdpdGhpbk1hcDtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBQYXJ0IDM6IGFwcGx5IHRoZSBkZWZhdWx0IHZhbHVlIChlLmcuIGA8ZGl2IHN0eWxlPVwid2lkdGg6MjAwXCI+YCA9PiBgMjAwcHhgIGdldHMgYXBwbGllZClcbiAgICAgIC8vIGlmIHRoZSB2YWx1ZSBoYXMgbm90IHlldCBiZWVuIGFwcGxpZWQgdGhlbiBhIHRydXRoeSB2YWx1ZSBkb2VzIG5vdCBleGlzdCBpbiB0aGVcbiAgICAgIC8vIHByb3AtYmFzZWQgb3IgbWFwLWJhc2VkIGJpbmRpbmdzIGNvZGUuIElmIGFuZCB3aGVuIHRoaXMgaGFwcGVucywganVzdCBhcHBseSB0aGVcbiAgICAgIC8vIGRlZmF1bHQgdmFsdWUgKGV2ZW4gaWYgdGhlIGRlZmF1bHQgdmFsdWUgaXMgYG51bGxgKS5cbiAgICAgIGlmICghdmFsdWVBcHBsaWVkKSB7XG4gICAgICAgIGFwcGx5U3R5bGluZ0ZuKHJlbmRlcmVyLCBlbGVtZW50LCBwcm9wLCBkZWZhdWx0VmFsdWUpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGkgKz0gVFN0eWxpbmdDb250ZXh0SW5kZXguQmluZGluZ3NTdGFydE9mZnNldCArIHZhbHVlc0NvdW50O1xuICB9XG5cbiAgLy8gdGhlIG1hcC1iYXNlZCBzdHlsaW5nIGVudHJpZXMgbWF5IGhhdmUgbm90IGFwcGxpZWQgYWxsIHRoZWlyXG4gIC8vIHZhbHVlcy4gRm9yIHRoaXMgcmVhc29uLCBvbmUgbW9yZSBjYWxsIHRvIHRoZSBzeW5jIGZ1bmN0aW9uXG4gIC8vIG5lZWRzIHRvIGJlIGlzc3VlZCBhdCB0aGUgZW5kLlxuICBpZiAoc3R5bGluZ01hcHNTeW5jRm4pIHtcbiAgICBpZiAoaG9zdEJpbmRpbmdzTW9kZSkge1xuICAgICAgbWFwc01vZGUgfD0gU3R5bGluZ01hcHNTeW5jTW9kZS5DaGVja1ZhbHVlc09ubHk7XG4gICAgfVxuICAgIHN0eWxpbmdNYXBzU3luY0ZuKFxuICAgICAgICBjb250ZXh0LCByZW5kZXJlciwgZWxlbWVudCwgYmluZGluZ0RhdGEsIDAsIGFwcGx5U3R5bGluZ0ZuLCBzYW5pdGl6ZXIsIG1hcHNNb2RlKTtcbiAgfVxufVxuXG4vKipcbiAqIEFwcGxpZXMgdGhlIHByb3ZpZGVkIHN0eWxpbmcgbWFwIHRvIHRoZSBlbGVtZW50IGRpcmVjdGx5ICh3aXRob3V0IGNvbnRleHQgcmVzb2x1dGlvbikuXG4gKlxuICogVGhpcyBmdW5jdGlvbiBpcyBkZXNpZ25lZCB0byBiZSBydW4gZnJvbSB0aGUgc3R5bGluZyBpbnN0cnVjdGlvbnMgYW5kIHdpbGwgYmUgY2FsbGVkXG4gKiBhdXRvbWF0aWNhbGx5LiBUaGlzIGZ1bmN0aW9uIGlzIGludGVuZGVkIHRvIGJlIHVzZWQgZm9yIHBlcmZvcm1hbmNlIHJlYXNvbnMgaW4gdGhlXG4gKiBldmVudCB0aGF0IHRoZXJlIGlzIG5vIG5lZWQgdG8gYXBwbHkgc3R5bGluZyB2aWEgY29udGV4dCByZXNvbHV0aW9uLlxuICpcbiAqIFNlZSBgYWxsb3dEaXJlY3RTdHlsaW5nQXBwbHlgLlxuICpcbiAqIEByZXR1cm5zIHdoZXRoZXIgb3Igbm90IHRoZSBzdHlsaW5nIG1hcCB3YXMgYXBwbGllZCB0byB0aGUgZWxlbWVudC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFwcGx5U3R5bGluZ01hcERpcmVjdGx5KFxuICAgIHJlbmRlcmVyOiBhbnksIGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCwgZWxlbWVudDogUkVsZW1lbnQsIGRhdGE6IExTdHlsaW5nRGF0YSxcbiAgICBiaW5kaW5nSW5kZXg6IG51bWJlciwgbWFwOiBTdHlsaW5nTWFwQXJyYXksIGFwcGx5Rm46IEFwcGx5U3R5bGluZ0ZuLFxuICAgIHNhbml0aXplcj86IFN0eWxlU2FuaXRpemVGbiB8IG51bGwsIGZvcmNlVXBkYXRlPzogYm9vbGVhbik6IGJvb2xlYW4ge1xuICBpZiAoZm9yY2VVcGRhdGUgfHwgaGFzVmFsdWVDaGFuZ2VkKGRhdGFbYmluZGluZ0luZGV4XSwgbWFwKSkge1xuICAgIHNldFZhbHVlKGRhdGEsIGJpbmRpbmdJbmRleCwgbWFwKTtcbiAgICBmb3IgKGxldCBpID0gU3R5bGluZ01hcEFycmF5SW5kZXguVmFsdWVzU3RhcnRQb3NpdGlvbjsgaSA8IG1hcC5sZW5ndGg7XG4gICAgICAgICBpICs9IFN0eWxpbmdNYXBBcnJheUluZGV4LlR1cGxlU2l6ZSkge1xuICAgICAgY29uc3QgcHJvcCA9IGdldE1hcFByb3AobWFwLCBpKTtcbiAgICAgIGNvbnN0IHZhbHVlID0gZ2V0TWFwVmFsdWUobWFwLCBpKTtcbiAgICAgIGFwcGx5U3R5bGluZ1ZhbHVlKHJlbmRlcmVyLCBjb250ZXh0LCBlbGVtZW50LCBwcm9wLCB2YWx1ZSwgYXBwbHlGbiwgYmluZGluZ0luZGV4LCBzYW5pdGl6ZXIpO1xuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuICByZXR1cm4gZmFsc2U7XG59XG5cbi8qKlxuICogQXBwbGllcyB0aGUgcHJvdmlkZWQgc3R5bGluZyBwcm9wL3ZhbHVlIHRvIHRoZSBlbGVtZW50IGRpcmVjdGx5ICh3aXRob3V0IGNvbnRleHQgcmVzb2x1dGlvbikuXG4gKlxuICogVGhpcyBmdW5jdGlvbiBpcyBkZXNpZ25lZCB0byBiZSBydW4gZnJvbSB0aGUgc3R5bGluZyBpbnN0cnVjdGlvbnMgYW5kIHdpbGwgYmUgY2FsbGVkXG4gKiBhdXRvbWF0aWNhbGx5LiBUaGlzIGZ1bmN0aW9uIGlzIGludGVuZGVkIHRvIGJlIHVzZWQgZm9yIHBlcmZvcm1hbmNlIHJlYXNvbnMgaW4gdGhlXG4gKiBldmVudCB0aGF0IHRoZXJlIGlzIG5vIG5lZWQgdG8gYXBwbHkgc3R5bGluZyB2aWEgY29udGV4dCByZXNvbHV0aW9uLlxuICpcbiAqIFNlZSBgYWxsb3dEaXJlY3RTdHlsaW5nQXBwbHlgLlxuICpcbiAqIEByZXR1cm5zIHdoZXRoZXIgb3Igbm90IHRoZSBwcm9wL3ZhbHVlIHN0eWxpbmcgd2FzIGFwcGxpZWQgdG8gdGhlIGVsZW1lbnQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhcHBseVN0eWxpbmdWYWx1ZURpcmVjdGx5KFxuICAgIHJlbmRlcmVyOiBhbnksIGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCwgZWxlbWVudDogUkVsZW1lbnQsIGRhdGE6IExTdHlsaW5nRGF0YSxcbiAgICBiaW5kaW5nSW5kZXg6IG51bWJlciwgcHJvcDogc3RyaW5nLCB2YWx1ZTogYW55LCBhcHBseUZuOiBBcHBseVN0eWxpbmdGbixcbiAgICBzYW5pdGl6ZXI/OiBTdHlsZVNhbml0aXplRm4gfCBudWxsKTogYm9vbGVhbiB7XG4gIGlmIChoYXNWYWx1ZUNoYW5nZWQoZGF0YVtiaW5kaW5nSW5kZXhdLCB2YWx1ZSkpIHtcbiAgICBzZXRWYWx1ZShkYXRhLCBiaW5kaW5nSW5kZXgsIHZhbHVlKTtcbiAgICBhcHBseVN0eWxpbmdWYWx1ZShyZW5kZXJlciwgY29udGV4dCwgZWxlbWVudCwgcHJvcCwgdmFsdWUsIGFwcGx5Rm4sIGJpbmRpbmdJbmRleCwgc2FuaXRpemVyKTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuICByZXR1cm4gZmFsc2U7XG59XG5cbmZ1bmN0aW9uIGFwcGx5U3R5bGluZ1ZhbHVlKFxuICAgIHJlbmRlcmVyOiBhbnksIGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCwgZWxlbWVudDogUkVsZW1lbnQsIHByb3A6IHN0cmluZywgdmFsdWU6IGFueSxcbiAgICBhcHBseUZuOiBBcHBseVN0eWxpbmdGbiwgYmluZGluZ0luZGV4OiBudW1iZXIsIHNhbml0aXplcj86IFN0eWxlU2FuaXRpemVGbiB8IG51bGwpIHtcbiAgbGV0IHZhbHVlVG9BcHBseTogc3RyaW5nfG51bGwgPSB1bndyYXBTYWZlVmFsdWUodmFsdWUpO1xuICBpZiAoaXNTdHlsaW5nVmFsdWVEZWZpbmVkKHZhbHVlVG9BcHBseSkpIHtcbiAgICB2YWx1ZVRvQXBwbHkgPVxuICAgICAgICBzYW5pdGl6ZXIgPyBzYW5pdGl6ZXIocHJvcCwgdmFsdWUsIFN0eWxlU2FuaXRpemVNb2RlLlNhbml0aXplT25seSkgOiB2YWx1ZVRvQXBwbHk7XG4gIH0gZWxzZSBpZiAoaGFzQ29uZmlnKGNvbnRleHQsIFRTdHlsaW5nQ29uZmlnLkhhc0luaXRpYWxTdHlsaW5nKSkge1xuICAgIGNvbnN0IGluaXRpYWxTdHlsZXMgPSBnZXRTdHlsaW5nTWFwQXJyYXkoY29udGV4dCk7XG4gICAgaWYgKGluaXRpYWxTdHlsZXMpIHtcbiAgICAgIHZhbHVlVG9BcHBseSA9IGZpbmRJbml0aWFsU3R5bGluZ1ZhbHVlKGluaXRpYWxTdHlsZXMsIHByb3ApO1xuICAgIH1cbiAgfVxuICBhcHBseUZuKHJlbmRlcmVyLCBlbGVtZW50LCBwcm9wLCB2YWx1ZVRvQXBwbHksIGJpbmRpbmdJbmRleCk7XG59XG5cbmZ1bmN0aW9uIGZpbmRJbml0aWFsU3R5bGluZ1ZhbHVlKG1hcDogU3R5bGluZ01hcEFycmF5LCBwcm9wOiBzdHJpbmcpOiBzdHJpbmd8bnVsbCB7XG4gIGZvciAobGV0IGkgPSBTdHlsaW5nTWFwQXJyYXlJbmRleC5WYWx1ZXNTdGFydFBvc2l0aW9uOyBpIDwgbWFwLmxlbmd0aDtcbiAgICAgICBpICs9IFN0eWxpbmdNYXBBcnJheUluZGV4LlR1cGxlU2l6ZSkge1xuICAgIGNvbnN0IHAgPSBnZXRNYXBQcm9wKG1hcCwgaSk7XG4gICAgaWYgKHAgPj0gcHJvcCkge1xuICAgICAgcmV0dXJuIHAgPT09IHByb3AgPyBnZXRNYXBWYWx1ZShtYXAsIGkpIDogbnVsbDtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZUJpdE1hc2tWYWx1ZSh2YWx1ZTogbnVtYmVyIHwgYm9vbGVhbik6IG51bWJlciB7XG4gIC8vIGlmIHBhc3MgPT4gYXBwbHkgYWxsIHZhbHVlcyAoLTEgaW1wbGllcyB0aGF0IGFsbCBiaXRzIGFyZSBmbGlwcGVkIHRvIHRydWUpXG4gIGlmICh2YWx1ZSA9PT0gdHJ1ZSkgcmV0dXJuIC0xO1xuXG4gIC8vIGlmIHBhc3MgPT4gc2tpcCBhbGwgdmFsdWVzXG4gIGlmICh2YWx1ZSA9PT0gZmFsc2UpIHJldHVybiAwO1xuXG4gIC8vIHJldHVybiB0aGUgYml0IG1hc2sgdmFsdWUgYXMgaXNcbiAgcmV0dXJuIHZhbHVlO1xufVxuXG5sZXQgX2FjdGl2ZVN0eWxpbmdNYXBBcHBseUZuOiBTeW5jU3R5bGluZ01hcHNGbnxudWxsID0gbnVsbDtcbmV4cG9ydCBmdW5jdGlvbiBnZXRTdHlsaW5nTWFwc1N5bmNGbigpIHtcbiAgcmV0dXJuIF9hY3RpdmVTdHlsaW5nTWFwQXBwbHlGbjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNldFN0eWxpbmdNYXBzU3luY0ZuKGZuOiBTeW5jU3R5bGluZ01hcHNGbikge1xuICBfYWN0aXZlU3R5bGluZ01hcEFwcGx5Rm4gPSBmbjtcbn1cblxuLyoqXG4gKiBBc3NpZ25zIGEgc3R5bGUgdmFsdWUgdG8gYSBzdHlsZSBwcm9wZXJ0eSBmb3IgdGhlIGdpdmVuIGVsZW1lbnQuXG4gKi9cbmV4cG9ydCBjb25zdCBzZXRTdHlsZTogQXBwbHlTdHlsaW5nRm4gPVxuICAgIChyZW5kZXJlcjogUmVuZGVyZXIzIHwgbnVsbCwgbmF0aXZlOiBSRWxlbWVudCwgcHJvcDogc3RyaW5nLCB2YWx1ZTogc3RyaW5nIHwgbnVsbCkgPT4ge1xuICAgICAgLy8gdGhlIHJlYXNvbiB3aHkgdGhpcyBtYXkgYmUgYG51bGxgIGlzIGVpdGhlciBiZWNhdXNlXG4gICAgICAvLyBpdCdzIGEgY29udGFpbmVyIGVsZW1lbnQgb3IgaXQncyBhIHBhcnQgb2YgYSB0ZXN0XG4gICAgICAvLyBlbnZpcm9ubWVudCB0aGF0IGRvZXNuJ3QgaGF2ZSBzdHlsaW5nLiBJbiBlaXRoZXJcbiAgICAgIC8vIGNhc2UgaXQncyBzYWZlIG5vdCB0byBhcHBseSBzdHlsaW5nIHRvIHRoZSBlbGVtZW50LlxuICAgICAgY29uc3QgbmF0aXZlU3R5bGUgPSBuYXRpdmUuc3R5bGU7XG4gICAgICBpZiAodmFsdWUpIHtcbiAgICAgICAgLy8gb3BhY2l0eSwgei1pbmRleCBhbmQgZmxleGJveCBhbGwgaGF2ZSBudW1iZXIgdmFsdWVzXG4gICAgICAgIC8vIGFuZCB0aGVzZSBuZWVkIHRvIGJlIGNvbnZlcnRlZCBpbnRvIHN0cmluZ3Mgc28gdGhhdFxuICAgICAgICAvLyB0aGV5IGNhbiBiZSBhc3NpZ25lZCBwcm9wZXJseS5cbiAgICAgICAgdmFsdWUgPSB2YWx1ZS50b1N0cmluZygpO1xuICAgICAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyU2V0U3R5bGUrKztcbiAgICAgICAgcmVuZGVyZXIgJiYgaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpID9cbiAgICAgICAgICAgIHJlbmRlcmVyLnNldFN0eWxlKG5hdGl2ZSwgcHJvcCwgdmFsdWUsIFJlbmRlcmVyU3R5bGVGbGFnczMuRGFzaENhc2UpIDpcbiAgICAgICAgICAgIChuYXRpdmVTdHlsZSAmJiBuYXRpdmVTdHlsZS5zZXRQcm9wZXJ0eShwcm9wLCB2YWx1ZSkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlclJlbW92ZVN0eWxlKys7XG4gICAgICAgIHJlbmRlcmVyICYmIGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSA/XG4gICAgICAgICAgICByZW5kZXJlci5yZW1vdmVTdHlsZShuYXRpdmUsIHByb3AsIFJlbmRlcmVyU3R5bGVGbGFnczMuRGFzaENhc2UpIDpcbiAgICAgICAgICAgIChuYXRpdmVTdHlsZSAmJiBuYXRpdmVTdHlsZS5yZW1vdmVQcm9wZXJ0eShwcm9wKSk7XG4gICAgICB9XG4gICAgfTtcblxuLyoqXG4gKiBBZGRzL3JlbW92ZXMgdGhlIHByb3ZpZGVkIGNsYXNzTmFtZSB2YWx1ZSB0byB0aGUgcHJvdmlkZWQgZWxlbWVudC5cbiAqL1xuZXhwb3J0IGNvbnN0IHNldENsYXNzOiBBcHBseVN0eWxpbmdGbiA9XG4gICAgKHJlbmRlcmVyOiBSZW5kZXJlcjMgfCBudWxsLCBuYXRpdmU6IFJFbGVtZW50LCBjbGFzc05hbWU6IHN0cmluZywgdmFsdWU6IGFueSkgPT4ge1xuICAgICAgaWYgKGNsYXNzTmFtZSAhPT0gJycpIHtcbiAgICAgICAgLy8gdGhlIHJlYXNvbiB3aHkgdGhpcyBtYXkgYmUgYG51bGxgIGlzIGVpdGhlciBiZWNhdXNlXG4gICAgICAgIC8vIGl0J3MgYSBjb250YWluZXIgZWxlbWVudCBvciBpdCdzIGEgcGFydCBvZiBhIHRlc3RcbiAgICAgICAgLy8gZW52aXJvbm1lbnQgdGhhdCBkb2Vzbid0IGhhdmUgc3R5bGluZy4gSW4gZWl0aGVyXG4gICAgICAgIC8vIGNhc2UgaXQncyBzYWZlIG5vdCB0byBhcHBseSBzdHlsaW5nIHRvIHRoZSBlbGVtZW50LlxuICAgICAgICBjb25zdCBjbGFzc0xpc3QgPSBuYXRpdmUuY2xhc3NMaXN0O1xuICAgICAgICBpZiAodmFsdWUpIHtcbiAgICAgICAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyQWRkQ2xhc3MrKztcbiAgICAgICAgICByZW5kZXJlciAmJiBpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikgPyByZW5kZXJlci5hZGRDbGFzcyhuYXRpdmUsIGNsYXNzTmFtZSkgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIChjbGFzc0xpc3QgJiYgY2xhc3NMaXN0LmFkZChjbGFzc05hbWUpKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyUmVtb3ZlQ2xhc3MrKztcbiAgICAgICAgICByZW5kZXJlciAmJiBpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikgPyByZW5kZXJlci5yZW1vdmVDbGFzcyhuYXRpdmUsIGNsYXNzTmFtZSkgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIChjbGFzc0xpc3QgJiYgY2xhc3NMaXN0LnJlbW92ZShjbGFzc05hbWUpKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH07XG5cbi8qKlxuICogSXRlcmF0ZXMgb3ZlciBhbGwgcHJvdmlkZWQgc3R5bGluZyBlbnRyaWVzIGFuZCByZW5kZXJzIHRoZW0gb24gdGhlIGVsZW1lbnQuXG4gKlxuICogVGhpcyBmdW5jdGlvbiBpcyB1c2VkIGFsb25nc2lkZSBhIGBTdHlsaW5nTWFwQXJyYXlgIGVudHJ5LiBUaGlzIGVudHJ5IGlzIG5vdFxuICogdGhlIHNhbWUgYXMgdGhlIGBUU3R5bGluZ0NvbnRleHRgIGFuZCBpcyBvbmx5IHJlYWxseSB1c2VkIHdoZW4gYW4gZWxlbWVudCBjb250YWluc1xuICogaW5pdGlhbCBzdHlsaW5nIHZhbHVlcyAoZS5nLiBgPGRpdiBzdHlsZT1cIndpZHRoOjIwMHB4XCI+YCksIGJ1dCBubyBzdHlsZS9jbGFzcyBiaW5kaW5nc1xuICogYXJlIHByZXNlbnQuIElmIGFuZCB3aGVuIHRoYXQgaGFwcGVucyB0aGVuIHRoaXMgZnVuY3Rpb24gd2lsbCBiZSBjYWxsZWQgdG8gcmVuZGVyIGFsbFxuICogaW5pdGlhbCBzdHlsaW5nIHZhbHVlcyBvbiBhbiBlbGVtZW50LlxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVuZGVyU3R5bGluZ01hcChcbiAgICByZW5kZXJlcjogUmVuZGVyZXIzLCBlbGVtZW50OiBSRWxlbWVudCwgc3R5bGluZ1ZhbHVlczogVFN0eWxpbmdDb250ZXh0IHwgU3R5bGluZ01hcEFycmF5IHwgbnVsbCxcbiAgICBpc0NsYXNzQmFzZWQ6IGJvb2xlYW4pOiB2b2lkIHtcbiAgY29uc3Qgc3R5bGluZ01hcEFyciA9IGdldFN0eWxpbmdNYXBBcnJheShzdHlsaW5nVmFsdWVzKTtcbiAgaWYgKHN0eWxpbmdNYXBBcnIpIHtcbiAgICBmb3IgKGxldCBpID0gU3R5bGluZ01hcEFycmF5SW5kZXguVmFsdWVzU3RhcnRQb3NpdGlvbjsgaSA8IHN0eWxpbmdNYXBBcnIubGVuZ3RoO1xuICAgICAgICAgaSArPSBTdHlsaW5nTWFwQXJyYXlJbmRleC5UdXBsZVNpemUpIHtcbiAgICAgIGNvbnN0IHByb3AgPSBnZXRNYXBQcm9wKHN0eWxpbmdNYXBBcnIsIGkpO1xuICAgICAgY29uc3QgdmFsdWUgPSBnZXRNYXBWYWx1ZShzdHlsaW5nTWFwQXJyLCBpKTtcbiAgICAgIGlmIChpc0NsYXNzQmFzZWQpIHtcbiAgICAgICAgc2V0Q2xhc3MocmVuZGVyZXIsIGVsZW1lbnQsIHByb3AsIHZhbHVlLCBudWxsKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHNldFN0eWxlKHJlbmRlcmVyLCBlbGVtZW50LCBwcm9wLCB2YWx1ZSwgbnVsbCk7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG4iXX0=