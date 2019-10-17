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
import { DEFAULT_BINDING_INDEX, DEFAULT_BINDING_VALUE, DEFAULT_GUARD_MASK_VALUE, MAP_BASED_ENTRY_PROP_NAME, TEMPLATE_DIRECTIVE_INDEX, getBindingValue, getConfig, getDefaultValue, getGuardMask, getMapProp, getMapValue, getProp, getPropValuesStartPosition, getStylingMapArray, getTotalSources, getValue, getValuesCount, hasConfig, hasValueChanged, isContextLocked, isHostStylingActive, isSanitizationRequired, isStylingValueDefined, lockContext, patchConfig, setDefaultValue, setGuardMask, setMapAsDirty, setValue } from '../util/styling_utils';
import { getStylingState, resetStylingState } from './state';
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
    var hostBindingsMode = isHostStylingActive(state.sourceIndex);
    // even if the initial value is a `NO_CHANGE` value (e.g. interpolation or [ngClass])
    // then we still need to register the binding within the context so that the context
    // is aware of the binding before it gets locked.
    if (!isContextLocked(context, hostBindingsMode) || value !== NO_CHANGE) {
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
    var hostBindingsMode = isHostStylingActive(state.sourceIndex);
    // even if the initial value is a `NO_CHANGE` value (e.g. interpolation or [ngStyle])
    // then we still need to register the binding within the context so that the context
    // is aware of the binding before it gets locked.
    if (!isContextLocked(context, hostBindingsMode) || value !== NO_CHANGE) {
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
        patchConfig(context, hostBindingsMode ? 64 /* HasHostBindings */ : 32 /* HasTemplateBindings */);
    }
    var changed = forceUpdate || hasValueChanged(data[bindingIndex], value);
    if (changed) {
        setValue(data, bindingIndex, value);
        var doSetValuesAsStale = (getConfig(context) & 64 /* HasHostBindings */) &&
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
 */
function renderHostBindingsAsStale(context, data, prop) {
    var valuesCount = getValuesCount(context);
    if (prop !== null && hasConfig(context, 2 /* HasPropBindings */)) {
        var itemsPerRow = 4 /* BindingsStartOffset */ + valuesCount;
        var i = 3 /* ValuesStartPosition */;
        var found = false;
        while (i < context.length) {
            if (getProp(context, i) === prop) {
                found = true;
                break;
            }
            i += itemsPerRow;
        }
        if (found) {
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
    }
    if (hasConfig(context, 4 /* HasMapBindings */)) {
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
    var totalSources = getTotalSources(context);
    // if a new source is detected then a new column needs to be allocated into
    // the styling context. The column is basically a new allocation of binding
    // sources that will be available to each property.
    while (totalSources <= sourceIndex) {
        addNewSourceColumn(context);
        totalSources++;
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
 */
export function applyStylingViaContext(context, renderer, element, bindingData, bitMaskValue, applyStylingFn, sanitizer, hostBindingsMode) {
    var bitMask = normalizeBitMaskValue(bitMaskValue);
    var stylingMapsSyncFn = null;
    var applyAllValues = false;
    if (hasConfig(context, 4 /* HasMapBindings */)) {
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
 * @returns whether or not the styling map was applied to the element.
 */
export function applyStylingMapDirectly(renderer, context, element, data, bindingIndex, map, isClassBased, applyFn, sanitizer, forceUpdate) {
    if (forceUpdate || hasValueChanged(data[bindingIndex], map)) {
        setValue(data, bindingIndex, map);
        var initialStyles = hasConfig(context, 16 /* HasInitialStyling */) ? getStylingMapArray(context) : null;
        for (var i = 1 /* ValuesStartPosition */; i < map.length; i += 2 /* TupleSize */) {
            var prop = getMapProp(map, i);
            var value = getMapValue(map, i);
            // case 1: apply the map value (if it exists)
            var applied = applyStylingValue(renderer, element, prop, value, applyFn, bindingIndex, sanitizer);
            // case 2: apply the initial value (if it exists)
            if (!applied && initialStyles) {
                applied = findAndApplyMapValue(renderer, element, applyFn, initialStyles, prop, bindingIndex, sanitizer);
            }
            // default case: apply `null` to remove the value
            if (!applied) {
                applyFn(renderer, element, prop, null, bindingIndex);
            }
        }
        var state = getStylingState(element, TEMPLATE_DIRECTIVE_INDEX);
        if (isClassBased) {
            state.lastDirectClassMap = map;
        }
        else {
            state.lastDirectStyleMap = map;
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
 * @returns whether or not the prop/value styling was applied to the element.
 */
export function applyStylingValueDirectly(renderer, context, element, data, bindingIndex, prop, value, isClassBased, applyFn, sanitizer) {
    var applied = false;
    if (hasValueChanged(data[bindingIndex], value)) {
        setValue(data, bindingIndex, value);
        // case 1: apply the provided value (if it exists)
        applied = applyStylingValue(renderer, element, prop, value, applyFn, bindingIndex, sanitizer);
        // case 2: find the matching property in a styling map and apply the detected value
        if (!applied && hasConfig(context, 4 /* HasMapBindings */)) {
            var state = getStylingState(element, TEMPLATE_DIRECTIVE_INDEX);
            var map = isClassBased ? state.lastDirectClassMap : state.lastDirectStyleMap;
            applied = map ?
                findAndApplyMapValue(renderer, element, applyFn, map, prop, bindingIndex, sanitizer) :
                false;
        }
        // case 3: apply the initial value (if it exists)
        if (!applied && hasConfig(context, 16 /* HasInitialStyling */)) {
            var map = getStylingMapArray(context);
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
function applyStylingValue(renderer, element, prop, value, applyFn, bindingIndex, sanitizer) {
    var valueToApply = unwrapSafeValue(value);
    if (isStylingValueDefined(valueToApply)) {
        valueToApply =
            sanitizer ? sanitizer(prop, value, 3 /* ValidateAndSanitize */) : valueToApply;
        applyFn(renderer, element, prop, valueToApply, bindingIndex);
        return true;
    }
    return false;
}
function findAndApplyMapValue(renderer, element, applyFn, map, prop, bindingIndex, sanitizer) {
    for (var i = 1 /* ValuesStartPosition */; i < map.length; i += 2 /* TupleSize */) {
        var p = getMapProp(map, i);
        if (p === prop) {
            var valueToApply = getMapValue(map, i);
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
                var nativeStyle = native.style;
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
                var nativeStyle = native.style;
                if (nativeStyle != null) {
                    nativeStyle.removeProperty(prop);
                }
            }
        }
    }
};
/**
 * Adds/removes the provided className value to the provided element.
 */
export var setClass = function (renderer, native, className, value) {
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
                var classList = native.classList;
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
                var classList = native.classList;
                if (classList != null) {
                    classList.remove(className);
                }
            }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmluZGluZ3MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL3N0eWxpbmcvYmluZGluZ3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztFQU1FO0FBQ0YsT0FBTyxFQUFZLGVBQWUsRUFBQyxNQUFNLDJCQUEyQixDQUFDO0FBRXJFLE9BQU8sRUFBMkMsbUJBQW1CLEVBQUUsb0JBQW9CLEVBQUMsTUFBTSx3QkFBd0IsQ0FBQztBQUUzSCxPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sV0FBVyxDQUFDO0FBQ3BDLE9BQU8sRUFBQyxxQkFBcUIsRUFBRSxxQkFBcUIsRUFBRSx3QkFBd0IsRUFBRSx5QkFBeUIsRUFBRSx3QkFBd0IsRUFBRSxlQUFlLEVBQUUsU0FBUyxFQUFFLGVBQWUsRUFBRSxZQUFZLEVBQTBCLFVBQVUsRUFBRSxXQUFXLEVBQUUsT0FBTyxFQUFFLDBCQUEwQixFQUFFLGtCQUFrQixFQUFFLGVBQWUsRUFBRSxRQUFRLEVBQUUsY0FBYyxFQUFFLFNBQVMsRUFBRSxlQUFlLEVBQUUsZUFBZSxFQUFFLG1CQUFtQixFQUFFLHNCQUFzQixFQUFFLHFCQUFxQixFQUFFLFdBQVcsRUFBRSxXQUFXLEVBQUUsZUFBZSxFQUFFLFlBQVksRUFBRSxhQUFhLEVBQUUsUUFBUSxFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFFcmpCLE9BQU8sRUFBQyxlQUFlLEVBQUUsaUJBQWlCLEVBQUMsTUFBTSxTQUFTLENBQUM7QUFJM0Q7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBaUJHO0FBRUg7Ozs7R0FJRztBQUNILElBQU0sNkJBQTZCLEdBQUcsQ0FBQyxDQUFDO0FBRXhDOzs7Ozs7Ozs7R0FTRztBQUNILE1BQU0sVUFBVSxxQkFBcUIsQ0FDakMsT0FBd0IsRUFBRSxJQUFrQixFQUFFLE9BQWlCLEVBQUUsY0FBc0IsRUFDdkYsSUFBbUIsRUFBRSxZQUFv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LElBQU0sU0FBUyxHQUFHLE1BQU0sQ0FBQyxTQUFTLENBQUM7Z0JBQ25DLElBQUksU0FBUyxJQUFJLElBQUksRUFBRTtvQkFDckIsU0FBUyxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQztpQkFDN0I7YUFDRjtTQUNGO0tBQ0Y7QUFDSCxDQUFDLENBQUM7QUFFTjs7Ozs7Ozs7R0FRRztBQUNILE1BQU0sVUFBVSxnQkFBZ0IsQ0FDNUIsUUFBbUIsRUFBRSxPQUFpQixFQUFFLGFBQXVELEVBQy9GLFlBQXFCO0lBQ3ZCLElBQU0sYUFBYSxHQUFHLGtCQUFrQixDQUFDLGFBQWEsQ0FBQyxDQUFDO0lBQ3hELElBQUksYUFBYSxFQUFFO1FBQ2pCLEtBQUssSUFBSSxDQUFDLDhCQUEyQyxFQUFFLENBQUMsR0FBRyxhQUFhLENBQUMsTUFBTSxFQUMxRSxDQUFDLHFCQUFrQyxFQUFFO1lBQ3hDLElBQU0sSUFBSSxHQUFHLFVBQVUsQ0FBQyxhQUFhLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDMUMsSUFBTSxLQUFLLEdBQUcsV0FBVyxDQUFDLGFBQWEsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUM1QyxJQUFJLFlBQVksRUFBRTtnQkFDaEIsUUFBUSxDQUFDLFFBQVEsRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxJQUFJLENBQUMsQ0FBQzthQUNoRDtpQkFBTTtnQkFDTCxRQUFRLENBQUMsUUFBUSxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLElBQUksQ0FBQyxDQUFDO2FBQ2hEO1NBQ0Y7S0FDRjtBQUNILENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiogQGxpY2Vuc2VcbiogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4qXG4qIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4qIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiovXG5pbXBvcnQge1NhZmVWYWx1ZSwgdW53cmFwU2FmZVZhbHVlfSBmcm9tICcuLi8uLi9zYW5pdGl6YXRpb24vYnlwYXNzJztcbmltcG9ydCB7U3R5bGVTYW5pdGl6ZUZuLCBTdHlsZVNhbml0aXplTW9kZX0gZnJvbSAnLi4vLi4vc2FuaXRpemF0aW9uL3N0eWxlX3Nhbml0aXplcic7XG5pbXBvcnQge1Byb2NlZHVyYWxSZW5kZXJlcjMsIFJFbGVtZW50LCBSZW5kZXJlcjMsIFJlbmRlcmVyU3R5bGVGbGFnczMsIGlzUHJvY2VkdXJhbFJlbmRlcmVyfSBmcm9tICcuLi9pbnRlcmZhY2VzL3JlbmRlcmVyJztcbmltcG9ydCB7QXBwbHlTdHlsaW5nRm4sIExTdHlsaW5nRGF0YSwgU3R5bGluZ01hcEFycmF5LCBTdHlsaW5nTWFwQXJyYXlJbmRleCwgU3R5bGluZ01hcHNTeW5jTW9kZSwgU3luY1N0eWxpbmdNYXBzRm4sIFRTdHlsaW5nQ29uZmlnLCBUU3R5bGluZ0NvbnRleHQsIFRTdHlsaW5nQ29udGV4dEluZGV4LCBUU3R5bGluZ0NvbnRleHRQcm9wQ29uZmlnRmxhZ3N9IGZyb20gJy4uL2ludGVyZmFjZXMvc3R5bGluZyc7XG5pbXBvcnQge05PX0NIQU5HRX0gZnJvbSAnLi4vdG9rZW5zJztcbmltcG9ydCB7REVGQVVMVF9CSU5ESU5HX0lOREVYLCBERUZBVUxUX0JJTkRJTkdfVkFMVUUsIERFRkFVTFRfR1VBUkRfTUFTS19WQUxVRSwgTUFQX0JBU0VEX0VOVFJZX1BST1BfTkFNRSwgVEVNUExBVEVfRElSRUNUSVZFX0lOREVYLCBnZXRCaW5kaW5nVmFsdWUsIGdldENvbmZpZywgZ2V0RGVmYXVsdFZhbHVlLCBnZXRHdWFyZE1hc2ssIGdldEluaXRpYWxTdHlsaW5nVmFsdWUsIGdldE1hcFByb3AsIGdldE1hcFZhbHVlLCBnZXRQcm9wLCBnZXRQcm9wVmFsdWVzU3RhcnRQb3NpdGlvbiwgZ2V0U3R5bGluZ01hcEFycmF5LCBnZXRUb3RhbFNvdXJjZXMsIGdldFZhbHVlLCBnZXRWYWx1ZXNDb3VudCwgaGFzQ29uZmlnLCBoYXNWYWx1ZUNoYW5nZWQsIGlzQ29udGV4dExvY2tlZCwgaXNIb3N0U3R5bGluZ0FjdGl2ZSwgaXNTYW5pdGl6YXRpb25SZXF1aXJlZCwgaXNTdHlsaW5nVmFsdWVEZWZpbmVkLCBsb2NrQ29udGV4dCwgcGF0Y2hDb25maWcsIHNldERlZmF1bHRWYWx1ZSwgc2V0R3VhcmRNYXNrLCBzZXRNYXBBc0RpcnR5LCBzZXRWYWx1ZX0gZnJvbSAnLi4vdXRpbC9zdHlsaW5nX3V0aWxzJztcblxuaW1wb3J0IHtnZXRTdHlsaW5nU3RhdGUsIHJlc2V0U3R5bGluZ1N0YXRlfSBmcm9tICcuL3N0YXRlJztcblxuXG5cbi8qKlxuICogLS0tLS0tLS1cbiAqXG4gKiBUaGlzIGZpbGUgY29udGFpbnMgdGhlIGNvcmUgbG9naWMgZm9yIHN0eWxpbmcgaW4gQW5ndWxhci5cbiAqXG4gKiBBbGwgc3R5bGluZyBiaW5kaW5ncyAoaS5lLiBgW3N0eWxlXWAsIGBbc3R5bGUucHJvcF1gLCBgW2NsYXNzXWAgYW5kIGBbY2xhc3MubmFtZV1gKVxuICogd2lsbCBoYXZlIHRoZWlyIHZhbHVlcyBiZSBhcHBsaWVkIHRocm91Z2ggdGhlIGxvZ2ljIGluIHRoaXMgZmlsZS5cbiAqXG4gKiBXaGVuIGEgYmluZGluZyBpcyBlbmNvdW50ZXJlZCAoZS5nLiBgPGRpdiBbc3R5bGUud2lkdGhdPVwid1wiPmApIHRoZW5cbiAqIHRoZSBiaW5kaW5nIGRhdGEgd2lsbCBiZSBwb3B1bGF0ZWQgaW50byBhIGBUU3R5bGluZ0NvbnRleHRgIGRhdGEtc3RydWN0dXJlLlxuICogVGhlcmUgaXMgb25seSBvbmUgYFRTdHlsaW5nQ29udGV4dGAgcGVyIGBUTm9kZWAgYW5kIGVhY2ggZWxlbWVudCBpbnN0YW5jZVxuICogd2lsbCB1cGRhdGUgaXRzIHN0eWxlL2NsYXNzIGJpbmRpbmcgdmFsdWVzIGluIGNvbmNlcnQgd2l0aCB0aGUgc3R5bGluZ1xuICogY29udGV4dC5cbiAqXG4gKiBUbyBsZWFybiBtb3JlIGFib3V0IHRoZSBhbGdvcml0aG0gc2VlIGBUU3R5bGluZ0NvbnRleHRgLlxuICpcbiAqIC0tLS0tLS0tXG4gKi9cblxuLyoqXG4gKiBUaGUgZ3VhcmQvdXBkYXRlIG1hc2sgYml0IGluZGV4IGxvY2F0aW9uIGZvciBtYXAtYmFzZWQgYmluZGluZ3MuXG4gKlxuICogQWxsIG1hcC1iYXNlZCBiaW5kaW5ncyAoaS5lLiBgW3N0eWxlXWAgYW5kIGBbY2xhc3NdYCApXG4gKi9cbmNvbnN0IFNUWUxJTkdfSU5ERVhfRk9SX01BUF9CSU5ESU5HID0gMDtcblxuLyoqXG4gKiBWaXNpdHMgYSBjbGFzcy1iYXNlZCBiaW5kaW5nIGFuZCB1cGRhdGVzIHRoZSBuZXcgdmFsdWUgKGlmIGNoYW5nZWQpLlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gaXMgY2FsbGVkIGVhY2ggdGltZSBhIGNsYXNzLWJhc2VkIHN0eWxpbmcgaW5zdHJ1Y3Rpb25cbiAqIGlzIGV4ZWN1dGVkLiBJdCdzIGltcG9ydGFudCB0aGF0IGl0J3MgYWx3YXlzIGNhbGxlZCAoZXZlbiBpZiB0aGUgdmFsdWVcbiAqIGhhcyBub3QgY2hhbmdlZCkgc28gdGhhdCB0aGUgaW5uZXIgY291bnRlciBpbmRleCB2YWx1ZSBpcyBpbmNyZW1lbnRlZC5cbiAqIFRoaXMgd2F5LCBlYWNoIGluc3RydWN0aW9uIGlzIGFsd2F5cyBndWFyYW50ZWVkIHRvIGdldCB0aGUgc2FtZSBjb3VudGVyXG4gKiBzdGF0ZSBlYWNoIHRpbWUgaXQncyBjYWxsZWQgKHdoaWNoIHRoZW4gYWxsb3dzIHRoZSBgVFN0eWxpbmdDb250ZXh0YFxuICogYW5kIHRoZSBiaXQgbWFzayB2YWx1ZXMgdG8gYmUgaW4gc3luYykuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB1cGRhdGVDbGFzc1ZpYUNvbnRleHQoXG4gICAgY29udGV4dDogVFN0eWxpbmdDb250ZXh0LCBkYXRhOiBMU3R5bGluZ0RhdGEsIGVsZW1lbnQ6IFJFbGVtZW50LCBkaXJlY3RpdmVJbmRleDogbnVtYmVyLFxuICAgIHByb3A6IHN0cmluZyB8IG51bGwsIGJpbmRpbmdJbmRleDogbnVtYmVyLFxuICAgIHZhbHVlOiBib29sZWFuIHwgc3RyaW5nIHwgbnVsbCB8IHVuZGVmaW5lZCB8IFN0eWxpbmdNYXBBcnJheSB8IE5PX0NIQU5HRSxcbiAgICBmb3JjZVVwZGF0ZT86IGJvb2xlYW4pOiBib29sZWFuIHtcbiAgY29uc3QgaXNNYXBCYXNlZCA9ICFwcm9wO1xuICBjb25zdCBzdGF0ZSA9IGdldFN0eWxpbmdTdGF0ZShlbGVtZW50LCBkaXJlY3RpdmVJbmRleCk7XG4gIGNvbnN0IGNvdW50SW5kZXggPSBpc01hcEJhc2VkID8gU1RZTElOR19JTkRFWF9GT1JfTUFQX0JJTkRJTkcgOiBzdGF0ZS5jbGFzc2VzSW5kZXgrKztcbiAgY29uc3QgaG9zdEJpbmRpbmdzTW9kZSA9IGlzSG9zdFN0eWxpbmdBY3RpdmUoc3RhdGUuc291cmNlSW5kZXgpO1xuXG4gIC8vIGV2ZW4gaWYgdGhlIGluaXRpYWwgdmFsdWUgaXMgYSBgTk9fQ0hBTkdFYCB2YWx1ZSAoZS5nLiBpbnRlcnBvbGF0aW9uIG9yIFtuZ0NsYXNzXSlcbiAgLy8gdGhlbiB3ZSBzdGlsbCBuZWVkIHRvIHJlZ2lzdGVyIHRoZSBiaW5kaW5nIHdpdGhpbiB0aGUgY29udGV4dCBzbyB0aGF0IHRoZSBjb250ZXh0XG4gIC8vIGlzIGF3YXJlIG9mIHRoZSBiaW5kaW5nIGJlZm9yZSBpdCBnZXRzIGxvY2tlZC5cbiAgaWYgKCFpc0NvbnRleHRMb2NrZWQoY29udGV4dCwgaG9zdEJpbmRpbmdzTW9kZSkgfHwgdmFsdWUgIT09IE5PX0NIQU5HRSkge1xuICAgIGNvbnN0IHVwZGF0ZWQgPSB1cGRhdGVCaW5kaW5nRGF0YShcbiAgICAgICAgY29udGV4dCwgZGF0YSwgY291bnRJbmRleCwgc3RhdGUuc291cmNlSW5kZXgsIHByb3AsIGJpbmRpbmdJbmRleCwgdmFsdWUsIGZvcmNlVXBkYXRlLFxuICAgICAgICBmYWxzZSk7XG4gICAgaWYgKHVwZGF0ZWQgfHwgZm9yY2VVcGRhdGUpIHtcbiAgICAgIC8vIFdlIGZsaXAgdGhlIGJpdCBpbiB0aGUgYml0TWFzayB0byByZWZsZWN0IHRoYXQgdGhlIGJpbmRpbmdcbiAgICAgIC8vIGF0IHRoZSBgaW5kZXhgIHNsb3QgaGFzIGNoYW5nZWQuIFRoaXMgaWRlbnRpZmllcyB0byB0aGUgZmx1c2hpbmdcbiAgICAgIC8vIHBoYXNlIHRoYXQgdGhlIGJpbmRpbmdzIGZvciB0aGlzIHBhcnRpY3VsYXIgQ1NTIGNsYXNzIG5lZWQgdG8gYmVcbiAgICAgIC8vIGFwcGxpZWQgYWdhaW4gYmVjYXVzZSBvbiBvciBtb3JlIG9mIHRoZSBiaW5kaW5ncyBmb3IgdGhlIENTU1xuICAgICAgLy8gY2xhc3MgaGF2ZSBjaGFuZ2VkLlxuICAgICAgc3RhdGUuY2xhc3Nlc0JpdE1hc2sgfD0gMSA8PCBjb3VudEluZGV4O1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9XG4gIHJldHVybiBmYWxzZTtcbn1cblxuLyoqXG4gKiBWaXNpdHMgYSBzdHlsZS1iYXNlZCBiaW5kaW5nIGFuZCB1cGRhdGVzIHRoZSBuZXcgdmFsdWUgKGlmIGNoYW5nZWQpLlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gaXMgY2FsbGVkIGVhY2ggdGltZSBhIHN0eWxlLWJhc2VkIHN0eWxpbmcgaW5zdHJ1Y3Rpb25cbiAqIGlzIGV4ZWN1dGVkLiBJdCdzIGltcG9ydGFudCB0aGF0IGl0J3MgYWx3YXlzIGNhbGxlZCAoZXZlbiBpZiB0aGUgdmFsdWVcbiAqIGhhcyBub3QgY2hhbmdlZCkgc28gdGhhdCB0aGUgaW5uZXIgY291bnRlciBpbmRleCB2YWx1ZSBpcyBpbmNyZW1lbnRlZC5cbiAqIFRoaXMgd2F5LCBlYWNoIGluc3RydWN0aW9uIGlzIGFsd2F5cyBndWFyYW50ZWVkIHRvIGdldCB0aGUgc2FtZSBjb3VudGVyXG4gKiBzdGF0ZSBlYWNoIHRpbWUgaXQncyBjYWxsZWQgKHdoaWNoIHRoZW4gYWxsb3dzIHRoZSBgVFN0eWxpbmdDb250ZXh0YFxuICogYW5kIHRoZSBiaXQgbWFzayB2YWx1ZXMgdG8gYmUgaW4gc3luYykuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB1cGRhdGVTdHlsZVZpYUNvbnRleHQoXG4gICAgY29udGV4dDogVFN0eWxpbmdDb250ZXh0LCBkYXRhOiBMU3R5bGluZ0RhdGEsIGVsZW1lbnQ6IFJFbGVtZW50LCBkaXJlY3RpdmVJbmRleDogbnVtYmVyLFxuICAgIHByb3A6IHN0cmluZyB8IG51bGwsIGJpbmRpbmdJbmRleDogbnVtYmVyLFxuICAgIHZhbHVlOiBzdHJpbmcgfCBudW1iZXIgfCBTYWZlVmFsdWUgfCBudWxsIHwgdW5kZWZpbmVkIHwgU3R5bGluZ01hcEFycmF5IHwgTk9fQ0hBTkdFLFxuICAgIHNhbml0aXplcjogU3R5bGVTYW5pdGl6ZUZuIHwgbnVsbCwgZm9yY2VVcGRhdGU/OiBib29sZWFuKTogYm9vbGVhbiB7XG4gIGNvbnN0IGlzTWFwQmFzZWQgPSAhcHJvcDtcbiAgY29uc3Qgc3RhdGUgPSBnZXRTdHlsaW5nU3RhdGUoZWxlbWVudCwgZGlyZWN0aXZlSW5kZXgpO1xuICBjb25zdCBjb3VudEluZGV4ID0gaXNNYXBCYXNlZCA/IFNUWUxJTkdfSU5ERVhfRk9SX01BUF9CSU5ESU5HIDogc3RhdGUuc3R5bGVzSW5kZXgrKztcbiAgY29uc3QgaG9zdEJpbmRpbmdzTW9kZSA9IGlzSG9zdFN0eWxpbmdBY3RpdmUoc3RhdGUuc291cmNlSW5kZXgpO1xuXG4gIC8vIGV2ZW4gaWYgdGhlIGluaXRpYWwgdmFsdWUgaXMgYSBgTk9fQ0hBTkdFYCB2YWx1ZSAoZS5nLiBpbnRlcnBvbGF0aW9uIG9yIFtuZ1N0eWxlXSlcbiAgLy8gdGhlbiB3ZSBzdGlsbCBuZWVkIHRvIHJlZ2lzdGVyIHRoZSBiaW5kaW5nIHdpdGhpbiB0aGUgY29udGV4dCBzbyB0aGF0IHRoZSBjb250ZXh0XG4gIC8vIGlzIGF3YXJlIG9mIHRoZSBiaW5kaW5nIGJlZm9yZSBpdCBnZXRzIGxvY2tlZC5cbiAgaWYgKCFpc0NvbnRleHRMb2NrZWQoY29udGV4dCwgaG9zdEJpbmRpbmdzTW9kZSkgfHwgdmFsdWUgIT09IE5PX0NIQU5HRSkge1xuICAgIGNvbnN0IHNhbml0aXphdGlvblJlcXVpcmVkID0gaXNNYXBCYXNlZCA/XG4gICAgICAgIHRydWUgOlxuICAgICAgICAoc2FuaXRpemVyID8gc2FuaXRpemVyKHByb3AgISwgbnVsbCwgU3R5bGVTYW5pdGl6ZU1vZGUuVmFsaWRhdGVQcm9wZXJ0eSkgOiBmYWxzZSk7XG4gICAgY29uc3QgdXBkYXRlZCA9IHVwZGF0ZUJpbmRpbmdEYXRhKFxuICAgICAgICBjb250ZXh0LCBkYXRhLCBjb3VudEluZGV4LCBzdGF0ZS5zb3VyY2VJbmRleCwgcHJvcCwgYmluZGluZ0luZGV4LCB2YWx1ZSwgZm9yY2VVcGRhdGUsXG4gICAgICAgIHNhbml0aXphdGlvblJlcXVpcmVkKTtcbiAgICBpZiAodXBkYXRlZCB8fCBmb3JjZVVwZGF0ZSkge1xuICAgICAgLy8gV2UgZmxpcCB0aGUgYml0IGluIHRoZSBiaXRNYXNrIHRvIHJlZmxlY3QgdGhhdCB0aGUgYmluZGluZ1xuICAgICAgLy8gYXQgdGhlIGBpbmRleGAgc2xvdCBoYXMgY2hhbmdlZC4gVGhpcyBpZGVudGlmaWVzIHRvIHRoZSBmbHVzaGluZ1xuICAgICAgLy8gcGhhc2UgdGhhdCB0aGUgYmluZGluZ3MgZm9yIHRoaXMgcGFydGljdWxhciBwcm9wZXJ0eSBuZWVkIHRvIGJlXG4gICAgICAvLyBhcHBsaWVkIGFnYWluIGJlY2F1c2Ugb24gb3IgbW9yZSBvZiB0aGUgYmluZGluZ3MgZm9yIHRoZSBDU1NcbiAgICAgIC8vIHByb3BlcnR5IGhhdmUgY2hhbmdlZC5cbiAgICAgIHN0YXRlLnN0eWxlc0JpdE1hc2sgfD0gMSA8PCBjb3VudEluZGV4O1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9XG4gIHJldHVybiBmYWxzZTtcbn1cblxuLyoqXG4gKiBDYWxsZWQgZWFjaCB0aW1lIGEgYmluZGluZyB2YWx1ZSBoYXMgY2hhbmdlZCB3aXRoaW4gdGhlIHByb3ZpZGVkIGBUU3R5bGluZ0NvbnRleHRgLlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gaXMgZGVzaWduZWQgdG8gYmUgY2FsbGVkIGZyb20gYHVwZGF0ZVN0eWxlQmluZGluZ2AgYW5kIGB1cGRhdGVDbGFzc0JpbmRpbmdgLlxuICogSWYgY2FsbGVkIGR1cmluZyB0aGUgZmlyc3QgdXBkYXRlIHBhc3MsIHRoZSBiaW5kaW5nIHdpbGwgYmUgcmVnaXN0ZXJlZCBpbiB0aGUgY29udGV4dC5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIHdpbGwgYWxzbyB1cGRhdGUgYmluZGluZyBzbG90IGluIHRoZSBwcm92aWRlZCBgTFN0eWxpbmdEYXRhYCB3aXRoIHRoZVxuICogbmV3IGJpbmRpbmcgZW50cnkgKGlmIGl0IGhhcyBjaGFuZ2VkKS5cbiAqXG4gKiBAcmV0dXJucyB3aGV0aGVyIG9yIG5vdCB0aGUgYmluZGluZyB2YWx1ZSB3YXMgdXBkYXRlZCBpbiB0aGUgYExTdHlsaW5nRGF0YWAuXG4gKi9cbmZ1bmN0aW9uIHVwZGF0ZUJpbmRpbmdEYXRhKFxuICAgIGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCwgZGF0YTogTFN0eWxpbmdEYXRhLCBjb3VudGVySW5kZXg6IG51bWJlciwgc291cmNlSW5kZXg6IG51bWJlcixcbiAgICBwcm9wOiBzdHJpbmcgfCBudWxsLCBiaW5kaW5nSW5kZXg6IG51bWJlcixcbiAgICB2YWx1ZTogc3RyaW5nIHwgU2FmZVZhbHVlIHwgbnVtYmVyIHwgYm9vbGVhbiB8IG51bGwgfCB1bmRlZmluZWQgfCBTdHlsaW5nTWFwQXJyYXksXG4gICAgZm9yY2VVcGRhdGU/OiBib29sZWFuLCBzYW5pdGl6YXRpb25SZXF1aXJlZD86IGJvb2xlYW4pOiBib29sZWFuIHtcbiAgY29uc3QgaG9zdEJpbmRpbmdzTW9kZSA9IGlzSG9zdFN0eWxpbmdBY3RpdmUoc291cmNlSW5kZXgpO1xuICBpZiAoIWlzQ29udGV4dExvY2tlZChjb250ZXh0LCBob3N0QmluZGluZ3NNb2RlKSkge1xuICAgIC8vIHRoaXMgd2lsbCBvbmx5IGhhcHBlbiBkdXJpbmcgdGhlIGZpcnN0IHVwZGF0ZSBwYXNzIG9mIHRoZVxuICAgIC8vIGNvbnRleHQuIFRoZSByZWFzb24gd2h5IHdlIGNhbid0IHVzZSBgdE5vZGUuZmlyc3RUZW1wbGF0ZVBhc3NgXG4gICAgLy8gaGVyZSBpcyBiZWNhdXNlIGl0cyBub3QgZ3VhcmFudGVlZCB0byBiZSB0cnVlIHdoZW4gdGhlIGZpcnN0XG4gICAgLy8gdXBkYXRlIHBhc3MgaXMgZXhlY3V0ZWQgKHJlbWVtYmVyIHRoYXQgYWxsIHN0eWxpbmcgaW5zdHJ1Y3Rpb25zXG4gICAgLy8gYXJlIHJ1biBpbiB0aGUgdXBkYXRlIHBoYXNlLCBhbmQsIGFzIGEgcmVzdWx0LCBhcmUgbm8gbW9yZVxuICAgIC8vIHN0eWxpbmcgaW5zdHJ1Y3Rpb25zIHRoYXQgYXJlIHJ1biBpbiB0aGUgY3JlYXRpb24gcGhhc2UpLlxuICAgIHJlZ2lzdGVyQmluZGluZyhjb250ZXh0LCBjb3VudGVySW5kZXgsIHNvdXJjZUluZGV4LCBwcm9wLCBiaW5kaW5nSW5kZXgsIHNhbml0aXphdGlvblJlcXVpcmVkKTtcbiAgICBwYXRjaENvbmZpZyhcbiAgICAgICAgY29udGV4dCxcbiAgICAgICAgaG9zdEJpbmRpbmdzTW9kZSA/IFRTdHlsaW5nQ29uZmlnLkhhc0hvc3RCaW5kaW5ncyA6IFRTdHlsaW5nQ29uZmlnLkhhc1RlbXBsYXRlQmluZGluZ3MpO1xuICB9XG5cbiAgY29uc3QgY2hhbmdlZCA9IGZvcmNlVXBkYXRlIHx8IGhhc1ZhbHVlQ2hhbmdlZChkYXRhW2JpbmRpbmdJbmRleF0sIHZhbHVlKTtcbiAgaWYgKGNoYW5nZWQpIHtcbiAgICBzZXRWYWx1ZShkYXRhLCBiaW5kaW5nSW5kZXgsIHZhbHVlKTtcbiAgICBjb25zdCBkb1NldFZhbHVlc0FzU3RhbGUgPSAoZ2V0Q29uZmlnKGNvbnRleHQpICYgVFN0eWxpbmdDb25maWcuSGFzSG9zdEJpbmRpbmdzKSAmJlxuICAgICAgICAhaG9zdEJpbmRpbmdzTW9kZSAmJiAocHJvcCA/ICF2YWx1ZSA6IHRydWUpO1xuICAgIGlmIChkb1NldFZhbHVlc0FzU3RhbGUpIHtcbiAgICAgIHJlbmRlckhvc3RCaW5kaW5nc0FzU3RhbGUoY29udGV4dCwgZGF0YSwgcHJvcCk7XG4gICAgfVxuICB9XG4gIHJldHVybiBjaGFuZ2VkO1xufVxuXG4vKipcbiAqIEl0ZXJhdGVzIG92ZXIgYWxsIGhvc3QtYmluZGluZyB2YWx1ZXMgZm9yIHRoZSBnaXZlbiBgcHJvcGAgdmFsdWUgaW4gdGhlIGNvbnRleHQgYW5kIHNldHMgdGhlaXJcbiAqIGNvcnJlc3BvbmRpbmcgYmluZGluZyB2YWx1ZXMgdG8gYG51bGxgLlxuICpcbiAqIFdoZW5ldmVyIGEgdGVtcGxhdGUgYmluZGluZyBjaGFuZ2VzIGl0cyB2YWx1ZSB0byBgbnVsbGAsIGFsbCBob3N0LWJpbmRpbmcgdmFsdWVzIHNob3VsZCBiZVxuICogcmUtYXBwbGllZFxuICogdG8gdGhlIGVsZW1lbnQgd2hlbiB0aGUgaG9zdCBiaW5kaW5ncyBhcmUgZXZhbHVhdGVkLiBUaGlzIG1heSBub3QgYWx3YXlzIGhhcHBlbiBpbiB0aGUgZXZlbnRcbiAqIHRoYXQgbm9uZSBvZiB0aGUgYmluZGluZ3MgY2hhbmdlZCB3aXRoaW4gdGhlIGhvc3QgYmluZGluZ3MgY29kZS4gRm9yIHRoaXMgcmVhc29uIHRoaXMgZnVuY3Rpb25cbiAqIGlzIGV4cGVjdGVkIHRvIGJlIGNhbGxlZCBlYWNoIHRpbWUgYSB0ZW1wbGF0ZSBiaW5kaW5nIGJlY29tZXMgZmFsc3kgb3Igd2hlbiBhIG1hcC1iYXNlZCB0ZW1wbGF0ZVxuICogYmluZGluZyBjaGFuZ2VzLlxuICovXG5mdW5jdGlvbiByZW5kZXJIb3N0QmluZGluZ3NBc1N0YWxlKFxuICAgIGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCwgZGF0YTogTFN0eWxpbmdEYXRhLCBwcm9wOiBzdHJpbmcgfCBudWxsKTogdm9pZCB7XG4gIGNvbnN0IHZhbHVlc0NvdW50ID0gZ2V0VmFsdWVzQ291bnQoY29udGV4dCk7XG5cbiAgaWYgKHByb3AgIT09IG51bGwgJiYgaGFzQ29uZmlnKGNvbnRleHQsIFRTdHlsaW5nQ29uZmlnLkhhc1Byb3BCaW5kaW5ncykpIHtcbiAgICBjb25zdCBpdGVtc1BlclJvdyA9IFRTdHlsaW5nQ29udGV4dEluZGV4LkJpbmRpbmdzU3RhcnRPZmZzZXQgKyB2YWx1ZXNDb3VudDtcblxuICAgIGxldCBpID0gVFN0eWxpbmdDb250ZXh0SW5kZXguVmFsdWVzU3RhcnRQb3NpdGlvbjtcbiAgICBsZXQgZm91bmQgPSBmYWxzZTtcbiAgICB3aGlsZSAoaSA8IGNvbnRleHQubGVuZ3RoKSB7XG4gICAgICBpZiAoZ2V0UHJvcChjb250ZXh0LCBpKSA9PT0gcHJvcCkge1xuICAgICAgICBmb3VuZCA9IHRydWU7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgaSArPSBpdGVtc1BlclJvdztcbiAgICB9XG5cbiAgICBpZiAoZm91bmQpIHtcbiAgICAgIGNvbnN0IGJpbmRpbmdzU3RhcnQgPSBpICsgVFN0eWxpbmdDb250ZXh0SW5kZXguQmluZGluZ3NTdGFydE9mZnNldDtcbiAgICAgIGNvbnN0IHZhbHVlc1N0YXJ0ID0gYmluZGluZ3NTdGFydCArIDE7ICAvLyB0aGUgZmlyc3QgY29sdW1uIGlzIHRlbXBsYXRlIGJpbmRpbmdzXG4gICAgICBjb25zdCB2YWx1ZXNFbmQgPSBiaW5kaW5nc1N0YXJ0ICsgdmFsdWVzQ291bnQgLSAxO1xuXG4gICAgICBmb3IgKGxldCBpID0gdmFsdWVzU3RhcnQ7IGkgPCB2YWx1ZXNFbmQ7IGkrKykge1xuICAgICAgICBjb25zdCBiaW5kaW5nSW5kZXggPSBjb250ZXh0W2ldIGFzIG51bWJlcjtcbiAgICAgICAgaWYgKGJpbmRpbmdJbmRleCAhPT0gMCkge1xuICAgICAgICAgIHNldFZhbHVlKGRhdGEsIGJpbmRpbmdJbmRleCwgbnVsbCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBpZiAoaGFzQ29uZmlnKGNvbnRleHQsIFRTdHlsaW5nQ29uZmlnLkhhc01hcEJpbmRpbmdzKSkge1xuICAgIGNvbnN0IGJpbmRpbmdzU3RhcnQgPVxuICAgICAgICBUU3R5bGluZ0NvbnRleHRJbmRleC5WYWx1ZXNTdGFydFBvc2l0aW9uICsgVFN0eWxpbmdDb250ZXh0SW5kZXguQmluZGluZ3NTdGFydE9mZnNldDtcbiAgICBjb25zdCB2YWx1ZXNTdGFydCA9IGJpbmRpbmdzU3RhcnQgKyAxOyAgLy8gdGhlIGZpcnN0IGNvbHVtbiBpcyB0ZW1wbGF0ZSBiaW5kaW5nc1xuICAgIGNvbnN0IHZhbHVlc0VuZCA9IGJpbmRpbmdzU3RhcnQgKyB2YWx1ZXNDb3VudCAtIDE7XG4gICAgZm9yIChsZXQgaSA9IHZhbHVlc1N0YXJ0OyBpIDwgdmFsdWVzRW5kOyBpKyspIHtcbiAgICAgIGNvbnN0IHN0eWxpbmdNYXAgPSBnZXRWYWx1ZTxTdHlsaW5nTWFwQXJyYXk+KGRhdGEsIGNvbnRleHRbaV0gYXMgbnVtYmVyKTtcbiAgICAgIGlmIChzdHlsaW5nTWFwKSB7XG4gICAgICAgIHNldE1hcEFzRGlydHkoc3R5bGluZ01hcCk7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogUmVnaXN0ZXJzIHRoZSBwcm92aWRlZCBiaW5kaW5nIChwcm9wICsgYmluZGluZ0luZGV4KSBpbnRvIHRoZSBjb250ZXh0LlxuICpcbiAqIEl0IGlzIG5lZWRlZCBiZWNhdXNlIGl0IHdpbGwgZWl0aGVyIHVwZGF0ZSBvciBpbnNlcnQgYSBzdHlsaW5nIHByb3BlcnR5XG4gKiBpbnRvIHRoZSBjb250ZXh0IGF0IHRoZSBjb3JyZWN0IHNwb3QuXG4gKlxuICogV2hlbiBjYWxsZWQsIG9uZSBvZiB0d28gdGhpbmdzIHdpbGwgaGFwcGVuOlxuICpcbiAqIDEpIElmIHRoZSBwcm9wZXJ0eSBhbHJlYWR5IGV4aXN0cyBpbiB0aGUgY29udGV4dCB0aGVuIGl0IHdpbGwganVzdCBhZGRcbiAqICAgIHRoZSBwcm92aWRlZCBgYmluZGluZ1ZhbHVlYCB0byB0aGUgZW5kIG9mIHRoZSBiaW5kaW5nIHNvdXJjZXMgcmVnaW9uXG4gKiAgICBmb3IgdGhhdCBwYXJ0aWN1bGFyIHByb3BlcnR5LlxuICpcbiAqICAgIC0gSWYgdGhlIGJpbmRpbmcgdmFsdWUgaXMgYSBudW1iZXIgdGhlbiBpdCB3aWxsIGJlIGFkZGVkIGFzIGEgbmV3XG4gKiAgICAgIGJpbmRpbmcgaW5kZXggc291cmNlIG5leHQgdG8gdGhlIG90aGVyIGJpbmRpbmcgc291cmNlcyBmb3IgdGhlIHByb3BlcnR5LlxuICpcbiAqICAgIC0gT3RoZXJ3aXNlLCBpZiB0aGUgYmluZGluZyB2YWx1ZSBpcyBhIHN0cmluZy9ib29sZWFuL251bGwgdHlwZSB0aGVuIGl0IHdpbGxcbiAqICAgICAgcmVwbGFjZSB0aGUgZGVmYXVsdCB2YWx1ZSBmb3IgdGhlIHByb3BlcnR5IGlmIHRoZSBkZWZhdWx0IHZhbHVlIGlzIGBudWxsYC5cbiAqXG4gKiAyKSBJZiB0aGUgcHJvcGVydHkgZG9lcyBub3QgZXhpc3QgdGhlbiBpdCB3aWxsIGJlIGluc2VydGVkIGludG8gdGhlIGNvbnRleHQuXG4gKiAgICBUaGUgc3R5bGluZyBjb250ZXh0IHJlbGllcyBvbiBhbGwgcHJvcGVydGllcyBiZWluZyBzdG9yZWQgaW4gYWxwaGFiZXRpY2FsXG4gKiAgICBvcmRlciwgc28gaXQga25vd3MgZXhhY3RseSB3aGVyZSB0byBzdG9yZSBpdC5cbiAqXG4gKiAgICBXaGVuIGluc2VydGVkLCBhIGRlZmF1bHQgYG51bGxgIHZhbHVlIGlzIGNyZWF0ZWQgZm9yIHRoZSBwcm9wZXJ0eSB3aGljaCBleGlzdHNcbiAqICAgIGFzIHRoZSBkZWZhdWx0IHZhbHVlIGZvciB0aGUgYmluZGluZy4gSWYgdGhlIGJpbmRpbmdWYWx1ZSBwcm9wZXJ0eSBpcyBpbnNlcnRlZFxuICogICAgYW5kIGl0IGlzIGVpdGhlciBhIHN0cmluZywgbnVtYmVyIG9yIG51bGwgdmFsdWUgdGhlbiB0aGF0IHdpbGwgcmVwbGFjZSB0aGUgZGVmYXVsdFxuICogICAgdmFsdWUuXG4gKlxuICogTm90ZSB0aGF0IHRoaXMgZnVuY3Rpb24gaXMgYWxzbyB1c2VkIGZvciBtYXAtYmFzZWQgc3R5bGluZyBiaW5kaW5ncy4gVGhleSBhcmUgdHJlYXRlZFxuICogbXVjaCB0aGUgc2FtZSBhcyBwcm9wLWJhc2VkIGJpbmRpbmdzLCBidXQsIHRoZWlyIHByb3BlcnR5IG5hbWUgdmFsdWUgaXMgc2V0IGFzIGBbTUFQXWAuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZWdpc3RlckJpbmRpbmcoXG4gICAgY29udGV4dDogVFN0eWxpbmdDb250ZXh0LCBjb3VudElkOiBudW1iZXIsIHNvdXJjZUluZGV4OiBudW1iZXIsIHByb3A6IHN0cmluZyB8IG51bGwsXG4gICAgYmluZGluZ1ZhbHVlOiBudW1iZXIgfCBudWxsIHwgc3RyaW5nIHwgYm9vbGVhbiwgc2FuaXRpemF0aW9uUmVxdWlyZWQ/OiBib29sZWFuKTogdm9pZCB7XG4gIGxldCBmb3VuZCA9IGZhbHNlO1xuICBwcm9wID0gcHJvcCB8fCBNQVBfQkFTRURfRU5UUllfUFJPUF9OQU1FO1xuXG4gIGxldCB0b3RhbFNvdXJjZXMgPSBnZXRUb3RhbFNvdXJjZXMoY29udGV4dCk7XG5cbiAgLy8gaWYgYSBuZXcgc291cmNlIGlzIGRldGVjdGVkIHRoZW4gYSBuZXcgY29sdW1uIG5lZWRzIHRvIGJlIGFsbG9jYXRlZCBpbnRvXG4gIC8vIHRoZSBzdHlsaW5nIGNvbnRleHQuIFRoZSBjb2x1bW4gaXMgYmFzaWNhbGx5IGEgbmV3IGFsbG9jYXRpb24gb2YgYmluZGluZ1xuICAvLyBzb3VyY2VzIHRoYXQgd2lsbCBiZSBhdmFpbGFibGUgdG8gZWFjaCBwcm9wZXJ0eS5cbiAgd2hpbGUgKHRvdGFsU291cmNlcyA8PSBzb3VyY2VJbmRleCkge1xuICAgIGFkZE5ld1NvdXJjZUNvbHVtbihjb250ZXh0KTtcbiAgICB0b3RhbFNvdXJjZXMrKztcbiAgfVxuXG4gIGNvbnN0IGlzQmluZGluZ0luZGV4VmFsdWUgPSB0eXBlb2YgYmluZGluZ1ZhbHVlID09PSAnbnVtYmVyJztcbiAgY29uc3QgZW50cmllc1BlclJvdyA9IFRTdHlsaW5nQ29udGV4dEluZGV4LkJpbmRpbmdzU3RhcnRPZmZzZXQgKyBnZXRWYWx1ZXNDb3VudChjb250ZXh0KTtcbiAgbGV0IGkgPSBUU3R5bGluZ0NvbnRleHRJbmRleC5WYWx1ZXNTdGFydFBvc2l0aW9uO1xuXG4gIC8vIGFsbCBzdHlsZS9jbGFzcyBiaW5kaW5ncyBhcmUgc29ydGVkIGJ5IHByb3BlcnR5IG5hbWVcbiAgd2hpbGUgKGkgPCBjb250ZXh0Lmxlbmd0aCkge1xuICAgIGNvbnN0IHAgPSBnZXRQcm9wKGNvbnRleHQsIGkpO1xuICAgIGlmIChwcm9wIDw9IHApIHtcbiAgICAgIGlmIChwcm9wIDwgcCkge1xuICAgICAgICBhbGxvY2F0ZU5ld0NvbnRleHRFbnRyeShjb250ZXh0LCBpLCBwcm9wLCBzYW5pdGl6YXRpb25SZXF1aXJlZCk7XG4gICAgICB9IGVsc2UgaWYgKGlzQmluZGluZ0luZGV4VmFsdWUpIHtcbiAgICAgICAgcGF0Y2hDb25maWcoY29udGV4dCwgVFN0eWxpbmdDb25maWcuSGFzQ29sbGlzaW9ucyk7XG4gICAgICB9XG4gICAgICBhZGRCaW5kaW5nSW50b0NvbnRleHQoY29udGV4dCwgaSwgYmluZGluZ1ZhbHVlLCBjb3VudElkLCBzb3VyY2VJbmRleCk7XG4gICAgICBmb3VuZCA9IHRydWU7XG4gICAgICBicmVhaztcbiAgICB9XG4gICAgaSArPSBlbnRyaWVzUGVyUm93O1xuICB9XG5cbiAgaWYgKCFmb3VuZCkge1xuICAgIGFsbG9jYXRlTmV3Q29udGV4dEVudHJ5KGNvbnRleHQsIGNvbnRleHQubGVuZ3RoLCBwcm9wLCBzYW5pdGl6YXRpb25SZXF1aXJlZCk7XG4gICAgYWRkQmluZGluZ0ludG9Db250ZXh0KGNvbnRleHQsIGksIGJpbmRpbmdWYWx1ZSwgY291bnRJZCwgc291cmNlSW5kZXgpO1xuICB9XG59XG5cbi8qKlxuICogSW5zZXJ0cyBhIG5ldyByb3cgaW50byB0aGUgcHJvdmlkZWQgYFRTdHlsaW5nQ29udGV4dGAgYW5kIGFzc2lnbnMgdGhlIHByb3ZpZGVkIGBwcm9wYCB2YWx1ZSBhc1xuICogdGhlIHByb3BlcnR5IGVudHJ5LlxuICovXG5mdW5jdGlvbiBhbGxvY2F0ZU5ld0NvbnRleHRFbnRyeShcbiAgICBjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQsIGluZGV4OiBudW1iZXIsIHByb3A6IHN0cmluZywgc2FuaXRpemF0aW9uUmVxdWlyZWQ/OiBib29sZWFuKTogdm9pZCB7XG4gIGNvbnN0IGNvbmZpZyA9IHNhbml0aXphdGlvblJlcXVpcmVkID8gVFN0eWxpbmdDb250ZXh0UHJvcENvbmZpZ0ZsYWdzLlNhbml0aXphdGlvblJlcXVpcmVkIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBUU3R5bGluZ0NvbnRleHRQcm9wQ29uZmlnRmxhZ3MuRGVmYXVsdDtcbiAgY29udGV4dC5zcGxpY2UoXG4gICAgICBpbmRleCwgMCxcbiAgICAgIGNvbmZpZywgICAgICAgICAgICAgICAgICAgIC8vIDEpIGNvbmZpZyB2YWx1ZVxuICAgICAgREVGQVVMVF9HVUFSRF9NQVNLX1ZBTFVFLCAgLy8gMikgdGVtcGxhdGUgYml0IG1hc2tcbiAgICAgIERFRkFVTFRfR1VBUkRfTUFTS19WQUxVRSwgIC8vIDMpIGhvc3QgYmluZGluZ3MgYml0IG1hc2tcbiAgICAgIHByb3AsICAgICAgICAgICAgICAgICAgICAgIC8vIDQpIHByb3AgdmFsdWUgKGUuZy4gYHdpZHRoYCwgYG15Q2xhc3NgLCBldGMuLi4pXG4gICAgICApO1xuXG4gIGluZGV4ICs9IDQ7ICAvLyB0aGUgNCB2YWx1ZXMgYWJvdmVcblxuICAvLyA1Li4uKSBkZWZhdWx0IGJpbmRpbmcgaW5kZXggZm9yIHRoZSB0ZW1wbGF0ZSB2YWx1ZVxuICAvLyBkZXBlbmRpbmcgb24gaG93IG1hbnkgc291cmNlcyBhbHJlYWR5IGV4aXN0IGluIHRoZSBjb250ZXh0LFxuICAvLyBtdWx0aXBsZSBkZWZhdWx0IGluZGV4IGVudHJpZXMgbWF5IG5lZWQgdG8gYmUgaW5zZXJ0ZWQgZm9yXG4gIC8vIHRoZSBuZXcgdmFsdWUgaW4gdGhlIGNvbnRleHQuXG4gIGNvbnN0IHRvdGFsQmluZGluZ3NQZXJFbnRyeSA9IGdldFRvdGFsU291cmNlcyhjb250ZXh0KTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCB0b3RhbEJpbmRpbmdzUGVyRW50cnk7IGkrKykge1xuICAgIGNvbnRleHQuc3BsaWNlKGluZGV4LCAwLCBERUZBVUxUX0JJTkRJTkdfSU5ERVgpO1xuICAgIGluZGV4Kys7XG4gIH1cblxuICAvLyA2KSBkZWZhdWx0IGJpbmRpbmcgdmFsdWUgZm9yIHRoZSBuZXcgZW50cnlcbiAgY29udGV4dC5zcGxpY2UoaW5kZXgsIDAsIERFRkFVTFRfQklORElOR19WQUxVRSk7XG59XG5cbi8qKlxuICogSW5zZXJ0cyBhIG5ldyBiaW5kaW5nIHZhbHVlIGludG8gYSBzdHlsaW5nIHByb3BlcnR5IHR1cGxlIGluIHRoZSBgVFN0eWxpbmdDb250ZXh0YC5cbiAqXG4gKiBBIGJpbmRpbmdWYWx1ZSBpcyBpbnNlcnRlZCBpbnRvIGEgY29udGV4dCBkdXJpbmcgdGhlIGZpcnN0IHVwZGF0ZSBwYXNzXG4gKiBvZiBhIHRlbXBsYXRlIG9yIGhvc3QgYmluZGluZ3MgZnVuY3Rpb24uIFdoZW4gdGhpcyBvY2N1cnMsIHR3byB0aGluZ3NcbiAqIGhhcHBlbjpcbiAqXG4gKiAtIElmIHRoZSBiaW5kaW5nVmFsdWUgdmFsdWUgaXMgYSBudW1iZXIgdGhlbiBpdCBpcyB0cmVhdGVkIGFzIGEgYmluZGluZ0luZGV4XG4gKiAgIHZhbHVlIChhIGluZGV4IGluIHRoZSBgTFZpZXdgKSBhbmQgaXQgd2lsbCBiZSBpbnNlcnRlZCBuZXh0IHRvIHRoZSBvdGhlclxuICogICBiaW5kaW5nIGluZGV4IGVudHJpZXMuXG4gKlxuICogLSBPdGhlcndpc2UgdGhlIGJpbmRpbmcgdmFsdWUgd2lsbCB1cGRhdGUgdGhlIGRlZmF1bHQgdmFsdWUgZm9yIHRoZSBwcm9wZXJ0eVxuICogICBhbmQgdGhpcyB3aWxsIG9ubHkgaGFwcGVuIGlmIHRoZSBkZWZhdWx0IHZhbHVlIGlzIGBudWxsYC5cbiAqL1xuZnVuY3Rpb24gYWRkQmluZGluZ0ludG9Db250ZXh0KFxuICAgIGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCwgaW5kZXg6IG51bWJlciwgYmluZGluZ1ZhbHVlOiBudW1iZXIgfCBzdHJpbmcgfCBib29sZWFuIHwgbnVsbCxcbiAgICBiaXRJbmRleDogbnVtYmVyLCBzb3VyY2VJbmRleDogbnVtYmVyKSB7XG4gIGlmICh0eXBlb2YgYmluZGluZ1ZhbHVlID09PSAnbnVtYmVyJykge1xuICAgIGNvbnN0IGhvc3RCaW5kaW5nc01vZGUgPSBpc0hvc3RTdHlsaW5nQWN0aXZlKHNvdXJjZUluZGV4KTtcbiAgICBjb25zdCBjZWxsSW5kZXggPSBpbmRleCArIFRTdHlsaW5nQ29udGV4dEluZGV4LkJpbmRpbmdzU3RhcnRPZmZzZXQgKyBzb3VyY2VJbmRleDtcbiAgICBjb250ZXh0W2NlbGxJbmRleF0gPSBiaW5kaW5nVmFsdWU7XG4gICAgY29uc3QgdXBkYXRlZEJpdE1hc2sgPSBnZXRHdWFyZE1hc2soY29udGV4dCwgaW5kZXgsIGhvc3RCaW5kaW5nc01vZGUpIHwgKDEgPDwgYml0SW5kZXgpO1xuICAgIHNldEd1YXJkTWFzayhjb250ZXh0LCBpbmRleCwgdXBkYXRlZEJpdE1hc2ssIGhvc3RCaW5kaW5nc01vZGUpO1xuICB9IGVsc2UgaWYgKGJpbmRpbmdWYWx1ZSAhPT0gbnVsbCAmJiBnZXREZWZhdWx0VmFsdWUoY29udGV4dCwgaW5kZXgpID09PSBudWxsKSB7XG4gICAgc2V0RGVmYXVsdFZhbHVlKGNvbnRleHQsIGluZGV4LCBiaW5kaW5nVmFsdWUpO1xuICB9XG59XG5cbi8qKlxuICogUmVnaXN0ZXJzIGEgbmV3IGNvbHVtbiBpbnRvIHRoZSBwcm92aWRlZCBgVFN0eWxpbmdDb250ZXh0YC5cbiAqXG4gKiBJZiBhbmQgd2hlbiBhIG5ldyBzb3VyY2UgaXMgZGV0ZWN0ZWQgdGhlbiBhIG5ldyBjb2x1bW4gbmVlZHMgdG9cbiAqIGJlIGFsbG9jYXRlZCBpbnRvIHRoZSBzdHlsaW5nIGNvbnRleHQuIFRoZSBjb2x1bW4gaXMgYmFzaWNhbGx5XG4gKiBhIG5ldyBhbGxvY2F0aW9uIG9mIGJpbmRpbmcgc291cmNlcyB0aGF0IHdpbGwgYmUgYXZhaWxhYmxlIHRvIGVhY2hcbiAqIHByb3BlcnR5LlxuICpcbiAqIEVhY2ggY29sdW1uIHRoYXQgZXhpc3RzIGluIHRoZSBzdHlsaW5nIGNvbnRleHQgcmVzZW1ibGVzIGEgc3R5bGluZ1xuICogc291cmNlLiBBIHN0eWxpbmcgc291cmNlIGFuIGVpdGhlciBiZSB0aGUgdGVtcGxhdGUgb3Igb25lIG9yIG1vcmVcbiAqIGNvbXBvbmVudHMgb3IgZGlyZWN0aXZlcyBhbGwgY29udGFpbmluZyBzdHlsaW5nIGhvc3QgYmluZGluZ3MuXG4gKi9cbmZ1bmN0aW9uIGFkZE5ld1NvdXJjZUNvbHVtbihjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQpOiB2b2lkIHtcbiAgLy8gd2UgdXNlIC0xIGhlcmUgYmVjYXVzZSB3ZSB3YW50IHRvIGluc2VydCByaWdodCBiZWZvcmUgdGhlIGxhc3QgdmFsdWUgKHRoZSBkZWZhdWx0IHZhbHVlKVxuICBjb25zdCBpbnNlcnRPZmZzZXQgPSBUU3R5bGluZ0NvbnRleHRJbmRleC5CaW5kaW5nc1N0YXJ0T2Zmc2V0ICsgZ2V0VmFsdWVzQ291bnQoY29udGV4dCkgLSAxO1xuXG4gIGxldCBpbmRleCA9IFRTdHlsaW5nQ29udGV4dEluZGV4LlZhbHVlc1N0YXJ0UG9zaXRpb247XG4gIHdoaWxlIChpbmRleCA8IGNvbnRleHQubGVuZ3RoKSB7XG4gICAgaW5kZXggKz0gaW5zZXJ0T2Zmc2V0O1xuICAgIGNvbnRleHQuc3BsaWNlKGluZGV4KyssIDAsIERFRkFVTFRfQklORElOR19JTkRFWCk7XG5cbiAgICAvLyB0aGUgdmFsdWUgd2FzIGluc2VydGVkIGp1c3QgYmVmb3JlIHRoZSBkZWZhdWx0IHZhbHVlLCBidXQgdGhlXG4gICAgLy8gbmV4dCBlbnRyeSBpbiB0aGUgY29udGV4dCBzdGFydHMganVzdCBhZnRlciBpdC4gVGhlcmVmb3JlKysuXG4gICAgaW5kZXgrKztcbiAgfVxuICBjb250ZXh0W1RTdHlsaW5nQ29udGV4dEluZGV4LlRvdGFsU291cmNlc1Bvc2l0aW9uXSsrO1xufVxuXG4vKipcbiAqIEFwcGxpZXMgYWxsIHBlbmRpbmcgc3R5bGUgYW5kIGNsYXNzIGJpbmRpbmdzIHRvIHRoZSBwcm92aWRlZCBlbGVtZW50LlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gd2lsbCBhdHRlbXB0IHRvIGZsdXNoIHN0eWxpbmcgdmlhIHRoZSBwcm92aWRlZCBgY2xhc3Nlc0NvbnRleHRgXG4gKiBhbmQgYHN0eWxlc0NvbnRleHRgIGNvbnRleHQgdmFsdWVzLiBUaGlzIGZ1bmN0aW9uIGlzIGRlc2lnbmVkIHRvIGJlIHJ1biBmcm9tXG4gKiB0aGUgaW50ZXJuYWwgYHN0eWxpbmdBcHBseWAgZnVuY3Rpb24gKHdoaWNoIGlzIHNjaGVkdWxlZCB0byBydW4gYXQgdGhlIHZlcnlcbiAqIGVuZCBvZiBjaGFuZ2UgZGV0ZWN0aW9uIGZvciBhbiBlbGVtZW50IGlmIG9uZSBvciBtb3JlIHN0eWxlL2NsYXNzIGJpbmRpbmdzXG4gKiB3ZXJlIHByb2Nlc3NlZCkgYW5kIHdpbGwgcmVseSBvbiBhbnkgc3RhdGUgdmFsdWVzIHRoYXQgYXJlIHNldCBmcm9tIHdoZW5cbiAqIGFueSBvZiB0aGUgc3R5bGluZyBiaW5kaW5ncyBleGVjdXRlZC5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIGlzIGRlc2lnbmVkIHRvIGJlIGNhbGxlZCB0d2ljZTogb25lIHdoZW4gY2hhbmdlIGRldGVjdGlvbiBoYXNcbiAqIHByb2Nlc3NlZCBhbiBlbGVtZW50IHdpdGhpbiB0aGUgdGVtcGxhdGUgYmluZGluZ3MgKGkuZS4ganVzdCBhcyBgYWR2YW5jZSgpYFxuICogaXMgY2FsbGVkKSBhbmQgd2hlbiBob3N0IGJpbmRpbmdzIGhhdmUgYmVlbiBwcm9jZXNzZWQuIEluIGJvdGggY2FzZXMgdGhlXG4gKiBzdHlsZXMgYW5kIGNsYXNzZXMgaW4gYm90aCBjb250ZXh0cyB3aWxsIGJlIGFwcGxpZWQgdG8gdGhlIGVsZW1lbnQsIGJ1dCB0aGVcbiAqIGFsZ29yaXRobSB3aWxsIHNlbGVjdGl2ZWx5IGRlY2lkZSB3aGljaCBiaW5kaW5ncyB0byBydW4gZGVwZW5kaW5nIG9uIHRoZVxuICogY29sdW1ucyBpbiB0aGUgY29udGV4dC4gVGhlIHByb3ZpZGVkIGBkaXJlY3RpdmVJbmRleGAgdmFsdWUgd2lsbCBoZWxwIHRoZVxuICogYWxnb3JpdGhtIGRldGVybWluZSB3aGljaCBiaW5kaW5ncyB0byBhcHBseTogZWl0aGVyIHRoZSB0ZW1wbGF0ZSBiaW5kaW5ncyBvclxuICogdGhlIGhvc3QgYmluZGluZ3MgKHNlZSBgYXBwbHlTdHlsaW5nVG9FbGVtZW50YCBmb3IgbW9yZSBpbmZvcm1hdGlvbikuXG4gKlxuICogTm90ZSB0aGF0IG9uY2UgdGhpcyBmdW5jdGlvbiBpcyBjYWxsZWQgYWxsIHRlbXBvcmFyeSBzdHlsaW5nIHN0YXRlIGRhdGFcbiAqIChpLmUuIHRoZSBgYml0TWFza2AgYW5kIGBjb3VudGVyYCB2YWx1ZXMgZm9yIHN0eWxlcyBhbmQgY2xhc3NlcyB3aWxsIGJlIGNsZWFyZWQpLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZmx1c2hTdHlsaW5nKFxuICAgIHJlbmRlcmVyOiBSZW5kZXJlcjMgfCBQcm9jZWR1cmFsUmVuZGVyZXIzIHwgbnVsbCwgZGF0YTogTFN0eWxpbmdEYXRhLFxuICAgIGNsYXNzZXNDb250ZXh0OiBUU3R5bGluZ0NvbnRleHQgfCBudWxsLCBzdHlsZXNDb250ZXh0OiBUU3R5bGluZ0NvbnRleHQgfCBudWxsLFxuICAgIGVsZW1lbnQ6IFJFbGVtZW50LCBkaXJlY3RpdmVJbmRleDogbnVtYmVyLCBzdHlsZVNhbml0aXplcjogU3R5bGVTYW5pdGl6ZUZuIHwgbnVsbCk6IHZvaWQge1xuICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLmZsdXNoU3R5bGluZysrO1xuXG4gIGNvbnN0IHN0YXRlID0gZ2V0U3R5bGluZ1N0YXRlKGVsZW1lbnQsIGRpcmVjdGl2ZUluZGV4KTtcbiAgY29uc3QgaG9zdEJpbmRpbmdzTW9kZSA9IGlzSG9zdFN0eWxpbmdBY3RpdmUoc3RhdGUuc291cmNlSW5kZXgpO1xuXG4gIGlmIChzdHlsZXNDb250ZXh0KSB7XG4gICAgaWYgKCFpc0NvbnRleHRMb2NrZWQoc3R5bGVzQ29udGV4dCwgaG9zdEJpbmRpbmdzTW9kZSkpIHtcbiAgICAgIGxvY2tBbmRGaW5hbGl6ZUNvbnRleHQoc3R5bGVzQ29udGV4dCwgaG9zdEJpbmRpbmdzTW9kZSk7XG4gICAgfVxuICAgIGlmIChzdGF0ZS5zdHlsZXNCaXRNYXNrICE9PSAwKSB7XG4gICAgICBhcHBseVN0eWxpbmdWaWFDb250ZXh0KFxuICAgICAgICAgIHN0eWxlc0NvbnRleHQsIHJlbmRlcmVyLCBlbGVtZW50LCBkYXRhLCBzdGF0ZS5zdHlsZXNCaXRNYXNrLCBzZXRTdHlsZSwgc3R5bGVTYW5pdGl6ZXIsXG4gICAgICAgICAgaG9zdEJpbmRpbmdzTW9kZSk7XG4gICAgfVxuICB9XG5cbiAgaWYgKGNsYXNzZXNDb250ZXh0KSB7XG4gICAgaWYgKCFpc0NvbnRleHRMb2NrZWQoY2xhc3Nlc0NvbnRleHQsIGhvc3RCaW5kaW5nc01vZGUpKSB7XG4gICAgICBsb2NrQW5kRmluYWxpemVDb250ZXh0KGNsYXNzZXNDb250ZXh0LCBob3N0QmluZGluZ3NNb2RlKTtcbiAgICB9XG4gICAgaWYgKHN0YXRlLmNsYXNzZXNCaXRNYXNrICE9PSAwKSB7XG4gICAgICBhcHBseVN0eWxpbmdWaWFDb250ZXh0KFxuICAgICAgICAgIGNsYXNzZXNDb250ZXh0LCByZW5kZXJlciwgZWxlbWVudCwgZGF0YSwgc3RhdGUuY2xhc3Nlc0JpdE1hc2ssIHNldENsYXNzLCBudWxsLFxuICAgICAgICAgIGhvc3RCaW5kaW5nc01vZGUpO1xuICAgIH1cbiAgfVxuXG4gIHJlc2V0U3R5bGluZ1N0YXRlKCk7XG59XG5cbi8qKlxuICogTG9ja3MgdGhlIGNvbnRleHQgKHNvIG5vIG1vcmUgYmluZGluZ3MgY2FuIGJlIGFkZGVkKSBhbmQgYWxzbyBjb3BpZXMgb3ZlciBpbml0aWFsIGNsYXNzL3N0eWxlXG4gKiB2YWx1ZXMgaW50byB0aGVpciBiaW5kaW5nIGFyZWFzLlxuICpcbiAqIFRoZXJlIGFyZSB0d28gbWFpbiBhY3Rpb25zIHRoYXQgdGFrZSBwbGFjZSBpbiB0aGlzIGZ1bmN0aW9uOlxuICpcbiAqIC0gTG9ja2luZyB0aGUgY29udGV4dDpcbiAqICAgTG9ja2luZyB0aGUgY29udGV4dCBpcyByZXF1aXJlZCBzbyB0aGF0IHRoZSBzdHlsZS9jbGFzcyBpbnN0cnVjdGlvbnMga25vdyBOT1QgdG9cbiAqICAgcmVnaXN0ZXIgYSBiaW5kaW5nIGFnYWluIGFmdGVyIHRoZSBmaXJzdCB1cGRhdGUgcGFzcyBoYXMgcnVuLiBJZiBhIGxvY2tpbmcgYml0IHdhc1xuICogICBub3QgdXNlZCB0aGVuIGl0IHdvdWxkIG5lZWQgdG8gc2NhbiBvdmVyIHRoZSBjb250ZXh0IGVhY2ggdGltZSBhbiBpbnN0cnVjdGlvbiBpcyBydW5cbiAqICAgKHdoaWNoIGlzIGV4cGVuc2l2ZSkuXG4gKlxuICogLSBQYXRjaGluZyBpbml0aWFsIHZhbHVlczpcbiAqICAgRGlyZWN0aXZlcyBhbmQgY29tcG9uZW50IGhvc3QgYmluZGluZ3MgbWF5IGluY2x1ZGUgc3RhdGljIGNsYXNzL3N0eWxlIHZhbHVlcyB3aGljaCBhcmVcbiAqICAgYm91bmQgdG8gdGhlIGhvc3QgZWxlbWVudC4gV2hlbiB0aGlzIGhhcHBlbnMsIHRoZSBzdHlsaW5nIGNvbnRleHQgd2lsbCBuZWVkIHRvIGJlIGluZm9ybWVkXG4gKiAgIHNvIGl0IGNhbiB1c2UgdGhlc2Ugc3RhdGljIHN0eWxpbmcgdmFsdWVzIGFzIGRlZmF1bHRzIHdoZW4gYSBtYXRjaGluZyBiaW5kaW5nIGlzIGZhbHN5LlxuICogICBUaGVzZSBpbml0aWFsIHN0eWxpbmcgdmFsdWVzIGFyZSByZWFkIGZyb20gdGhlIGluaXRpYWwgc3R5bGluZyB2YWx1ZXMgc2xvdCB3aXRoaW4gdGhlXG4gKiAgIHByb3ZpZGVkIGBUU3R5bGluZ0NvbnRleHRgICh3aGljaCBpcyBhbiBpbnN0YW5jZSBvZiBhIGBTdHlsaW5nTWFwQXJyYXlgKS4gVGhpcyBpbm5lciBtYXAgd2lsbFxuICogICBiZSB1cGRhdGVkIGVhY2ggdGltZSBhIGhvc3QgYmluZGluZyBhcHBsaWVzIGl0cyBzdGF0aWMgc3R5bGluZyB2YWx1ZXMgKHZpYSBgZWxlbWVudEhvc3RBdHRyc2ApXG4gKiAgIHNvIHRoZXNlIHZhbHVlcyBhcmUgb25seSByZWFkIGF0IHRoaXMgcG9pbnQgYmVjYXVzZSB0aGlzIGlzIHRoZSB2ZXJ5IGxhc3QgcG9pbnQgYmVmb3JlIHRoZVxuICogICBmaXJzdCBzdHlsZS9jbGFzcyB2YWx1ZXMgYXJlIGZsdXNoZWQgdG8gdGhlIGVsZW1lbnQuXG4gKlxuICogTm90ZSB0aGF0IHRoZSBgVFN0eWxpbmdDb250ZXh0YCBzdHlsaW5nIGNvbnRleHQgY29udGFpbnMgdHdvIGxvY2tzOiBvbmUgZm9yIHRlbXBsYXRlIGJpbmRpbmdzXG4gKiBhbmQgYW5vdGhlciBmb3IgaG9zdCBiaW5kaW5ncy4gRWl0aGVyIG9uZSBvZiB0aGVzZSBsb2NrcyB3aWxsIGJlIHNldCB3aGVuIHN0eWxpbmcgaXMgYXBwbGllZFxuICogZHVyaW5nIHRoZSB0ZW1wbGF0ZSBiaW5kaW5nIGZsdXNoIGFuZC9vciBkdXJpbmcgdGhlIGhvc3QgYmluZGluZ3MgZmx1c2guXG4gKi9cbmZ1bmN0aW9uIGxvY2tBbmRGaW5hbGl6ZUNvbnRleHQoY29udGV4dDogVFN0eWxpbmdDb250ZXh0LCBob3N0QmluZGluZ3NNb2RlOiBib29sZWFuKTogdm9pZCB7XG4gIGNvbnN0IGluaXRpYWxWYWx1ZXMgPSBnZXRTdHlsaW5nTWFwQXJyYXkoY29udGV4dCkgITtcbiAgdXBkYXRlSW5pdGlhbFN0eWxpbmdPbkNvbnRleHQoY29udGV4dCwgaW5pdGlhbFZhbHVlcyk7XG4gIGxvY2tDb250ZXh0KGNvbnRleHQsIGhvc3RCaW5kaW5nc01vZGUpO1xufVxuXG4vKipcbiAqIFJlZ2lzdGVycyBhbGwgaW5pdGlhbCBzdHlsaW5nIGVudHJpZXMgaW50byB0aGUgcHJvdmlkZWQgY29udGV4dC5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIHdpbGwgaXRlcmF0ZSBvdmVyIGFsbCBlbnRyaWVzIGluIHRoZSBwcm92aWRlZCBgaW5pdGlhbFN0eWxpbmdgIGFyfXJheSBhbmQgcmVnaXN0ZXJcbiAqIHRoZW0gYXMgZGVmYXVsdCAoaW5pdGlhbCkgdmFsdWVzIGluIHRoZSBwcm92aWRlZCBjb250ZXh0LiBJbml0aWFsIHN0eWxpbmcgdmFsdWVzIGluIGEgY29udGV4dCBhcmVcbiAqIHRoZSBkZWZhdWx0IHZhbHVlcyB0aGF0IGFyZSB0byBiZSBhcHBsaWVkIHVubGVzcyBvdmVyd3JpdHRlbiBieSBhIGJpbmRpbmcuXG4gKlxuICogVGhlIHJlYXNvbiB3aHkgdGhpcyBmdW5jdGlvbiBleGlzdHMgYW5kIGlzbid0IGEgcGFydCBvZiB0aGUgY29udGV4dCBjb25zdHJ1Y3Rpb24gaXMgYmVjYXVzZVxuICogaG9zdCBiaW5kaW5nIGlzIGV2YWx1YXRlZCBhdCBhIGxhdGVyIHN0YWdlIGFmdGVyIHRoZSBlbGVtZW50IGlzIGNyZWF0ZWQuIFRoaXMgbWVhbnMgdGhhdFxuICogaWYgYSBkaXJlY3RpdmUgb3IgY29tcG9uZW50IGNvbnRhaW5zIGFueSBpbml0aWFsIHN0eWxpbmcgY29kZSAoaS5lLiBgPGRpdiBjbGFzcz1cImZvb1wiPmApXG4gKiB0aGVuIHRoYXQgaW5pdGlhbCBzdHlsaW5nIGRhdGEgY2FuIG9ubHkgYmUgYXBwbGllZCBvbmNlIHRoZSBzdHlsaW5nIGZvciB0aGF0IGVsZW1lbnRcbiAqIGlzIGZpcnN0IGFwcGxpZWQgKGF0IHRoZSBlbmQgb2YgdGhlIHVwZGF0ZSBwaGFzZSkuIE9uY2UgdGhhdCBoYXBwZW5zIHRoZW4gdGhlIGNvbnRleHQgd2lsbFxuICogdXBkYXRlIGl0c2VsZiB3aXRoIHRoZSBjb21wbGV0ZSBpbml0aWFsIHN0eWxpbmcgZm9yIHRoZSBlbGVtZW50LlxuICovXG5mdW5jdGlvbiB1cGRhdGVJbml0aWFsU3R5bGluZ09uQ29udGV4dChcbiAgICBjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQsIGluaXRpYWxTdHlsaW5nOiBTdHlsaW5nTWFwQXJyYXkpOiB2b2lkIHtcbiAgLy8gYC0xYCBpcyB1c2VkIGhlcmUgYmVjYXVzZSBhbGwgaW5pdGlhbCBzdHlsaW5nIGRhdGEgaXMgbm90IGEgYXBhcnRcbiAgLy8gb2YgYSBiaW5kaW5nIChzaW5jZSBpdCdzIHN0YXRpYylcbiAgY29uc3QgQ09VTlRfSURfRk9SX1NUWUxJTkcgPSAtMTtcblxuICBsZXQgaGFzSW5pdGlhbFN0eWxpbmcgPSBmYWxzZTtcbiAgZm9yIChsZXQgaSA9IFN0eWxpbmdNYXBBcnJheUluZGV4LlZhbHVlc1N0YXJ0UG9zaXRpb247IGkgPCBpbml0aWFsU3R5bGluZy5sZW5ndGg7XG4gICAgICAgaSArPSBTdHlsaW5nTWFwQXJyYXlJbmRleC5UdXBsZVNpemUpIHtcbiAgICBjb25zdCB2YWx1ZSA9IGdldE1hcFZhbHVlKGluaXRpYWxTdHlsaW5nLCBpKTtcbiAgICBpZiAodmFsdWUpIHtcbiAgICAgIGNvbnN0IHByb3AgPSBnZXRNYXBQcm9wKGluaXRpYWxTdHlsaW5nLCBpKTtcbiAgICAgIHJlZ2lzdGVyQmluZGluZyhjb250ZXh0LCBDT1VOVF9JRF9GT1JfU1RZTElORywgMCwgcHJvcCwgdmFsdWUsIGZhbHNlKTtcbiAgICAgIGhhc0luaXRpYWxTdHlsaW5nID0gdHJ1ZTtcbiAgICB9XG4gIH1cblxuICBpZiAoaGFzSW5pdGlhbFN0eWxpbmcpIHtcbiAgICBwYXRjaENvbmZpZyhjb250ZXh0LCBUU3R5bGluZ0NvbmZpZy5IYXNJbml0aWFsU3R5bGluZyk7XG4gIH1cbn1cblxuLyoqXG4gKiBSdW5zIHRocm91Z2ggdGhlIHByb3ZpZGVkIHN0eWxpbmcgY29udGV4dCBhbmQgYXBwbGllcyBlYWNoIHZhbHVlIHRvXG4gKiB0aGUgcHJvdmlkZWQgZWxlbWVudCAodmlhIHRoZSByZW5kZXJlcikgaWYgb25lIG9yIG1vcmUgdmFsdWVzIGFyZSBwcmVzZW50LlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gd2lsbCBpdGVyYXRlIG92ZXIgYWxsIGVudHJpZXMgcHJlc2VudCBpbiB0aGUgcHJvdmlkZWRcbiAqIGBUU3R5bGluZ0NvbnRleHRgIGFycmF5IChib3RoIHByb3AtYmFzZWQgYW5kIG1hcC1iYXNlZCBiaW5kaW5ncykuLVxuICpcbiAqIEVhY2ggZW50cnksIHdpdGhpbiB0aGUgYFRTdHlsaW5nQ29udGV4dGAgYXJyYXksIGlzIHN0b3JlZCBhbHBoYWJldGljYWxseVxuICogYW5kIHRoaXMgbWVhbnMgdGhhdCBlYWNoIHByb3AvdmFsdWUgZW50cnkgd2lsbCBiZSBhcHBsaWVkIGluIG9yZGVyXG4gKiAoc28gbG9uZyBhcyBpdCBpcyBtYXJrZWQgZGlydHkgaW4gdGhlIHByb3ZpZGVkIGBiaXRNYXNrYCB2YWx1ZSkuXG4gKlxuICogSWYgdGhlcmUgYXJlIGFueSBtYXAtYmFzZWQgZW50cmllcyBwcmVzZW50ICh3aGljaCBhcmUgYXBwbGllZCB0byB0aGVcbiAqIGVsZW1lbnQgdmlhIHRoZSBgW3N0eWxlXWAgYW5kIGBbY2xhc3NdYCBiaW5kaW5ncykgdGhlbiB0aG9zZSBlbnRyaWVzXG4gKiB3aWxsIGJlIGFwcGxpZWQgYXMgd2VsbC4gSG93ZXZlciwgdGhlIGNvZGUgZm9yIHRoYXQgaXMgbm90IGEgcGFydCBvZlxuICogdGhpcyBmdW5jdGlvbi4gSW5zdGVhZCwgZWFjaCB0aW1lIGEgcHJvcGVydHkgaXMgdmlzaXRlZCwgdGhlbiB0aGVcbiAqIGNvZGUgYmVsb3cgd2lsbCBjYWxsIGFuIGV4dGVybmFsIGZ1bmN0aW9uIGNhbGxlZCBgc3R5bGluZ01hcHNTeW5jRm5gXG4gKiBhbmQsIGlmIHByZXNlbnQsIGl0IHdpbGwga2VlcCB0aGUgYXBwbGljYXRpb24gb2Ygc3R5bGluZyB2YWx1ZXMgaW5cbiAqIG1hcC1iYXNlZCBiaW5kaW5ncyB1cCB0byBzeW5jIHdpdGggdGhlIGFwcGxpY2F0aW9uIG9mIHByb3AtYmFzZWRcbiAqIGJpbmRpbmdzLlxuICpcbiAqIFZpc2l0IGBzdHlsaW5nL21hcF9iYXNlZF9iaW5kaW5ncy50c2AgdG8gbGVhcm4gbW9yZSBhYm91dCBob3cgdGhlXG4gKiBhbGdvcml0aG0gd29ya3MgZm9yIG1hcC1iYXNlZCBzdHlsaW5nIGJpbmRpbmdzLlxuICpcbiAqIE5vdGUgdGhhdCB0aGlzIGZ1bmN0aW9uIGlzIG5vdCBkZXNpZ25lZCB0byBiZSBjYWxsZWQgaW4gaXNvbGF0aW9uICh1c2VcbiAqIHRoZSBgZmx1c2hTdHlsaW5nYCBmdW5jdGlvbiBzbyB0aGF0IGl0IGNhbiBjYWxsIHRoaXMgZnVuY3Rpb24gZm9yIGJvdGhcbiAqIHRoZSBzdHlsZXMgYW5kIGNsYXNzZXMgY29udGV4dHMpLlxuICovXG5leHBvcnQgZnVuY3Rpb24gYXBwbHlTdHlsaW5nVmlhQ29udGV4dChcbiAgICBjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQsIHJlbmRlcmVyOiBSZW5kZXJlcjMgfCBQcm9jZWR1cmFsUmVuZGVyZXIzIHwgbnVsbCwgZWxlbWVudDogUkVsZW1lbnQsXG4gICAgYmluZGluZ0RhdGE6IExTdHlsaW5nRGF0YSwgYml0TWFza1ZhbHVlOiBudW1iZXIgfCBib29sZWFuLCBhcHBseVN0eWxpbmdGbjogQXBwbHlTdHlsaW5nRm4sXG4gICAgc2FuaXRpemVyOiBTdHlsZVNhbml0aXplRm4gfCBudWxsLCBob3N0QmluZGluZ3NNb2RlOiBib29sZWFuKTogdm9pZCB7XG4gIGNvbnN0IGJpdE1hc2sgPSBub3JtYWxpemVCaXRNYXNrVmFsdWUoYml0TWFza1ZhbHVlKTtcblxuICBsZXQgc3R5bGluZ01hcHNTeW5jRm46IFN5bmNTdHlsaW5nTWFwc0ZufG51bGwgPSBudWxsO1xuICBsZXQgYXBwbHlBbGxWYWx1ZXMgPSBmYWxzZTtcbiAgaWYgKGhhc0NvbmZpZyhjb250ZXh0LCBUU3R5bGluZ0NvbmZpZy5IYXNNYXBCaW5kaW5ncykpIHtcbiAgICBzdHlsaW5nTWFwc1N5bmNGbiA9IGdldFN0eWxpbmdNYXBzU3luY0ZuKCk7XG4gICAgY29uc3QgbWFwc0d1YXJkTWFzayA9XG4gICAgICAgIGdldEd1YXJkTWFzayhjb250ZXh0LCBUU3R5bGluZ0NvbnRleHRJbmRleC5WYWx1ZXNTdGFydFBvc2l0aW9uLCBob3N0QmluZGluZ3NNb2RlKTtcbiAgICBhcHBseUFsbFZhbHVlcyA9IChiaXRNYXNrICYgbWFwc0d1YXJkTWFzaykgIT09IDA7XG4gIH1cblxuICBjb25zdCB2YWx1ZXNDb3VudCA9IGdldFZhbHVlc0NvdW50KGNvbnRleHQpO1xuICBsZXQgdG90YWxCaW5kaW5nc1RvVmlzaXQgPSAxO1xuICBsZXQgbWFwc01vZGUgPVxuICAgICAgYXBwbHlBbGxWYWx1ZXMgPyBTdHlsaW5nTWFwc1N5bmNNb2RlLkFwcGx5QWxsVmFsdWVzIDogU3R5bGluZ01hcHNTeW5jTW9kZS5UcmF2ZXJzZVZhbHVlcztcbiAgaWYgKGhvc3RCaW5kaW5nc01vZGUpIHtcbiAgICBtYXBzTW9kZSB8PSBTdHlsaW5nTWFwc1N5bmNNb2RlLlJlY3Vyc2VJbm5lck1hcHM7XG4gICAgdG90YWxCaW5kaW5nc1RvVmlzaXQgPSB2YWx1ZXNDb3VudCAtIDE7XG4gIH1cblxuICBsZXQgaSA9IGdldFByb3BWYWx1ZXNTdGFydFBvc2l0aW9uKGNvbnRleHQpO1xuICB3aGlsZSAoaSA8IGNvbnRleHQubGVuZ3RoKSB7XG4gICAgY29uc3QgZ3VhcmRNYXNrID0gZ2V0R3VhcmRNYXNrKGNvbnRleHQsIGksIGhvc3RCaW5kaW5nc01vZGUpO1xuICAgIGlmIChiaXRNYXNrICYgZ3VhcmRNYXNrKSB7XG4gICAgICBsZXQgdmFsdWVBcHBsaWVkID0gZmFsc2U7XG4gICAgICBjb25zdCBwcm9wID0gZ2V0UHJvcChjb250ZXh0LCBpKTtcbiAgICAgIGNvbnN0IGRlZmF1bHRWYWx1ZSA9IGdldERlZmF1bHRWYWx1ZShjb250ZXh0LCBpKTtcblxuICAgICAgLy8gUGFydCAxOiBWaXNpdCB0aGUgYFtzdHlsaW5nLnByb3BdYCB2YWx1ZVxuICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCB0b3RhbEJpbmRpbmdzVG9WaXNpdDsgaisrKSB7XG4gICAgICAgIGNvbnN0IGJpbmRpbmdJbmRleCA9IGdldEJpbmRpbmdWYWx1ZShjb250ZXh0LCBpLCBqKSBhcyBudW1iZXI7XG4gICAgICAgIGlmICghdmFsdWVBcHBsaWVkICYmIGJpbmRpbmdJbmRleCAhPT0gMCkge1xuICAgICAgICAgIGNvbnN0IHZhbHVlID0gZ2V0VmFsdWUoYmluZGluZ0RhdGEsIGJpbmRpbmdJbmRleCk7XG4gICAgICAgICAgaWYgKGlzU3R5bGluZ1ZhbHVlRGVmaW5lZCh2YWx1ZSkpIHtcbiAgICAgICAgICAgIGNvbnN0IGNoZWNrVmFsdWVPbmx5ID0gaG9zdEJpbmRpbmdzTW9kZSAmJiBqID09PSAwO1xuICAgICAgICAgICAgaWYgKCFjaGVja1ZhbHVlT25seSkge1xuICAgICAgICAgICAgICBjb25zdCBmaW5hbFZhbHVlID0gc2FuaXRpemVyICYmIGlzU2FuaXRpemF0aW9uUmVxdWlyZWQoY29udGV4dCwgaSkgP1xuICAgICAgICAgICAgICAgICAgc2FuaXRpemVyKHByb3AsIHZhbHVlLCBTdHlsZVNhbml0aXplTW9kZS5TYW5pdGl6ZU9ubHkpIDpcbiAgICAgICAgICAgICAgICAgIHVud3JhcFNhZmVWYWx1ZSh2YWx1ZSk7XG4gICAgICAgICAgICAgIGFwcGx5U3R5bGluZ0ZuKHJlbmRlcmVyLCBlbGVtZW50LCBwcm9wLCBmaW5hbFZhbHVlLCBiaW5kaW5nSW5kZXgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFsdWVBcHBsaWVkID0gdHJ1ZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBQYXJ0IDI6IFZpc2l0IHRoZSBgW3N0eWxlXWAgb3IgYFtjbGFzc11gIG1hcC1iYXNlZCB2YWx1ZVxuICAgICAgICBpZiAoc3R5bGluZ01hcHNTeW5jRm4pIHtcbiAgICAgICAgICAvLyBkZXRlcm1pbmUgd2hldGhlciBvciBub3QgdG8gYXBwbHkgdGhlIHRhcmdldCBwcm9wZXJ0eSBvciB0byBza2lwIGl0XG4gICAgICAgICAgbGV0IG1vZGUgPSBtYXBzTW9kZSB8ICh2YWx1ZUFwcGxpZWQgPyBTdHlsaW5nTWFwc1N5bmNNb2RlLlNraXBUYXJnZXRQcm9wIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFN0eWxpbmdNYXBzU3luY01vZGUuQXBwbHlUYXJnZXRQcm9wKTtcblxuICAgICAgICAgIC8vIHRoZSBmaXJzdCBjb2x1bW4gaW4gdGhlIGNvbnRleHQgKHdoZW4gYGogPT0gMGApIGlzIHNwZWNpYWwtY2FzZWQgZm9yXG4gICAgICAgICAgLy8gdGVtcGxhdGUgYmluZGluZ3MuIElmIGFuZCB3aGVuIGhvc3QgYmluZGluZ3MgYXJlIGJlaW5nIHByb2Nlc3NlZCB0aGVuXG4gICAgICAgICAgLy8gdGhlIGZpcnN0IGNvbHVtbiB3aWxsIHN0aWxsIGJlIGl0ZXJhdGVkIG92ZXIsIGJ1dCB0aGUgdmFsdWVzIHdpbGwgb25seVxuICAgICAgICAgIC8vIGJlIGNoZWNrZWQgYWdhaW5zdCAobm90IGFwcGxpZWQpLiBJZiBhbmQgd2hlbiB0aGlzIGhhcHBlbnMgd2UgbmVlZCB0b1xuICAgICAgICAgIC8vIG5vdGlmeSB0aGUgbWFwLWJhc2VkIHN5bmNpbmcgY29kZSB0byBrbm93IG5vdCB0byBhcHBseSB0aGUgdmFsdWVzIGl0XG4gICAgICAgICAgLy8gY29tZXMgYWNyb3NzIGluIHRoZSB2ZXJ5IGZpcnN0IG1hcC1iYXNlZCBiaW5kaW5nICh3aGljaCBpcyBhbHNvIGxvY2F0ZWRcbiAgICAgICAgICAvLyBpbiBjb2x1bW4gemVybykuXG4gICAgICAgICAgaWYgKGhvc3RCaW5kaW5nc01vZGUgJiYgaiA9PT0gMCkge1xuICAgICAgICAgICAgbW9kZSB8PSBTdHlsaW5nTWFwc1N5bmNNb2RlLkNoZWNrVmFsdWVzT25seTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBjb25zdCB2YWx1ZUFwcGxpZWRXaXRoaW5NYXAgPSBzdHlsaW5nTWFwc1N5bmNGbihcbiAgICAgICAgICAgICAgY29udGV4dCwgcmVuZGVyZXIsIGVsZW1lbnQsIGJpbmRpbmdEYXRhLCBqLCBhcHBseVN0eWxpbmdGbiwgc2FuaXRpemVyLCBtb2RlLCBwcm9wLFxuICAgICAgICAgICAgICBkZWZhdWx0VmFsdWUpO1xuICAgICAgICAgIHZhbHVlQXBwbGllZCA9IHZhbHVlQXBwbGllZCB8fCB2YWx1ZUFwcGxpZWRXaXRoaW5NYXA7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gUGFydCAzOiBhcHBseSB0aGUgZGVmYXVsdCB2YWx1ZSAoZS5nLiBgPGRpdiBzdHlsZT1cIndpZHRoOjIwMFwiPmAgPT4gYDIwMHB4YCBnZXRzIGFwcGxpZWQpXG4gICAgICAvLyBpZiB0aGUgdmFsdWUgaGFzIG5vdCB5ZXQgYmVlbiBhcHBsaWVkIHRoZW4gYSB0cnV0aHkgdmFsdWUgZG9lcyBub3QgZXhpc3QgaW4gdGhlXG4gICAgICAvLyBwcm9wLWJhc2VkIG9yIG1hcC1iYXNlZCBiaW5kaW5ncyBjb2RlLiBJZiBhbmQgd2hlbiB0aGlzIGhhcHBlbnMsIGp1c3QgYXBwbHkgdGhlXG4gICAgICAvLyBkZWZhdWx0IHZhbHVlIChldmVuIGlmIHRoZSBkZWZhdWx0IHZhbHVlIGlzIGBudWxsYCkuXG4gICAgICBpZiAoIXZhbHVlQXBwbGllZCkge1xuICAgICAgICBhcHBseVN0eWxpbmdGbihyZW5kZXJlciwgZWxlbWVudCwgcHJvcCwgZGVmYXVsdFZhbHVlKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpICs9IFRTdHlsaW5nQ29udGV4dEluZGV4LkJpbmRpbmdzU3RhcnRPZmZzZXQgKyB2YWx1ZXNDb3VudDtcbiAgfVxuXG4gIC8vIHRoZSBtYXAtYmFzZWQgc3R5bGluZyBlbnRyaWVzIG1heSBoYXZlIG5vdCBhcHBsaWVkIGFsbCB0aGVpclxuICAvLyB2YWx1ZXMuIEZvciB0aGlzIHJlYXNvbiwgb25lIG1vcmUgY2FsbCB0byB0aGUgc3luYyBmdW5jdGlvblxuICAvLyBuZWVkcyB0byBiZSBpc3N1ZWQgYXQgdGhlIGVuZC5cbiAgaWYgKHN0eWxpbmdNYXBzU3luY0ZuKSB7XG4gICAgaWYgKGhvc3RCaW5kaW5nc01vZGUpIHtcbiAgICAgIG1hcHNNb2RlIHw9IFN0eWxpbmdNYXBzU3luY01vZGUuQ2hlY2tWYWx1ZXNPbmx5O1xuICAgIH1cbiAgICBzdHlsaW5nTWFwc1N5bmNGbihcbiAgICAgICAgY29udGV4dCwgcmVuZGVyZXIsIGVsZW1lbnQsIGJpbmRpbmdEYXRhLCAwLCBhcHBseVN0eWxpbmdGbiwgc2FuaXRpemVyLCBtYXBzTW9kZSk7XG4gIH1cbn1cblxuLyoqXG4gKiBBcHBsaWVzIHRoZSBwcm92aWRlZCBzdHlsaW5nIG1hcCB0byB0aGUgZWxlbWVudCBkaXJlY3RseSAod2l0aG91dCBjb250ZXh0IHJlc29sdXRpb24pLlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gaXMgZGVzaWduZWQgdG8gYmUgcnVuIGZyb20gdGhlIHN0eWxpbmcgaW5zdHJ1Y3Rpb25zIGFuZCB3aWxsIGJlIGNhbGxlZFxuICogYXV0b21hdGljYWxseS4gVGhpcyBmdW5jdGlvbiBpcyBpbnRlbmRlZCB0byBiZSB1c2VkIGZvciBwZXJmb3JtYW5jZSByZWFzb25zIGluIHRoZVxuICogZXZlbnQgdGhhdCB0aGVyZSBpcyBubyBuZWVkIHRvIGFwcGx5IHN0eWxpbmcgdmlhIGNvbnRleHQgcmVzb2x1dGlvbi5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIGhhcyB0aHJlZSBkaWZmZXJlbnQgY2FzZXMgdGhhdCBjYW4gb2NjdXIgKGZvciBlYWNoIGl0ZW0gaW4gdGhlIG1hcCk6XG4gKlxuICogLSBDYXNlIDE6IEF0dGVtcHQgdG8gYXBwbHkgdGhlIGN1cnJlbnQgdmFsdWUgaW4gdGhlIG1hcCB0byB0aGUgZWxlbWVudCAoaWYgaXQncyBgbm9uIG51bGxgKS5cbiAqXG4gKiAtIENhc2UgMjogSWYgYSBtYXAgdmFsdWUgZmFpbHMgdG8gYmUgYXBwbGllZCB0aGVuIHRoZSBhbGdvcml0aG0gd2lsbCBmaW5kIGEgbWF0Y2hpbmcgZW50cnkgaW5cbiAqICAgICAgICAgICB0aGUgaW5pdGlhbCB2YWx1ZXMgcHJlc2VudCBpbiB0aGUgY29udGV4dCBhbmQgYXR0ZW1wdCB0byBhcHBseSB0aGF0LlxuICpcbiAqIC0gRGVmYXVsdCBDYXNlOiBJZiB0aGUgaW5pdGlhbCB2YWx1ZSBjYW5ub3QgYmUgYXBwbGllZCB0aGVuIGEgZGVmYXVsdCB2YWx1ZSBvZiBgbnVsbGAgd2lsbCBiZVxuICogICAgICAgICAgICAgICAgIGFwcGxpZWQgKHdoaWNoIHdpbGwgcmVtb3ZlIHRoZSBzdHlsZS9jbGFzcyB2YWx1ZSBmcm9tIHRoZSBlbGVtZW50KS5cbiAqXG4gKiBTZWUgYGFsbG93RGlyZWN0U3R5bGluZ0FwcGx5YCB0byBsZWFybiB0aGUgbG9naWMgdXNlZCB0byBkZXRlcm1pbmUgd2hldGhlciBhbnkgc3R5bGUvY2xhc3NcbiAqIGJpbmRpbmdzIGNhbiBiZSBkaXJlY3RseSBhcHBsaWVkLlxuICpcbiAqIEByZXR1cm5zIHdoZXRoZXIgb3Igbm90IHRoZSBzdHlsaW5nIG1hcCB3YXMgYXBwbGllZCB0byB0aGUgZWxlbWVudC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFwcGx5U3R5bGluZ01hcERpcmVjdGx5KFxuICAgIHJlbmRlcmVyOiBhbnksIGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCwgZWxlbWVudDogUkVsZW1lbnQsIGRhdGE6IExTdHlsaW5nRGF0YSxcbiAgICBiaW5kaW5nSW5kZXg6IG51bWJlciwgbWFwOiBTdHlsaW5nTWFwQXJyYXksIGlzQ2xhc3NCYXNlZDogYm9vbGVhbiwgYXBwbHlGbjogQXBwbHlTdHlsaW5nRm4sXG4gICAgc2FuaXRpemVyPzogU3R5bGVTYW5pdGl6ZUZuIHwgbnVsbCwgZm9yY2VVcGRhdGU/OiBib29sZWFuKTogYm9vbGVhbiB7XG4gIGlmIChmb3JjZVVwZGF0ZSB8fCBoYXNWYWx1ZUNoYW5nZWQoZGF0YVtiaW5kaW5nSW5kZXhdLCBtYXApKSB7XG4gICAgc2V0VmFsdWUoZGF0YSwgYmluZGluZ0luZGV4LCBtYXApO1xuICAgIGNvbnN0IGluaXRpYWxTdHlsZXMgPVxuICAgICAgICBoYXNDb25maWcoY29udGV4dCwgVFN0eWxpbmdDb25maWcuSGFzSW5pdGlhbFN0eWxpbmcpID8gZ2V0U3R5bGluZ01hcEFycmF5KGNvbnRleHQpIDogbnVsbDtcblxuICAgIGZvciAobGV0IGkgPSBTdHlsaW5nTWFwQXJyYXlJbmRleC5WYWx1ZXNTdGFydFBvc2l0aW9uOyBpIDwgbWFwLmxlbmd0aDtcbiAgICAgICAgIGkgKz0gU3R5bGluZ01hcEFycmF5SW5kZXguVHVwbGVTaXplKSB7XG4gICAgICBjb25zdCBwcm9wID0gZ2V0TWFwUHJvcChtYXAsIGkpO1xuICAgICAgY29uc3QgdmFsdWUgPSBnZXRNYXBWYWx1ZShtYXAsIGkpO1xuXG4gICAgICAvLyBjYXNlIDE6IGFwcGx5IHRoZSBtYXAgdmFsdWUgKGlmIGl0IGV4aXN0cylcbiAgICAgIGxldCBhcHBsaWVkID1cbiAgICAgICAgICBhcHBseVN0eWxpbmdWYWx1ZShyZW5kZXJlciwgZWxlbWVudCwgcHJvcCwgdmFsdWUsIGFwcGx5Rm4sIGJpbmRpbmdJbmRleCwgc2FuaXRpemVyKTtcblxuICAgICAgLy8gY2FzZSAyOiBhcHBseSB0aGUgaW5pdGlhbCB2YWx1ZSAoaWYgaXQgZXhpc3RzKVxuICAgICAgaWYgKCFhcHBsaWVkICYmIGluaXRpYWxTdHlsZXMpIHtcbiAgICAgICAgYXBwbGllZCA9IGZpbmRBbmRBcHBseU1hcFZhbHVlKFxuICAgICAgICAgICAgcmVuZGVyZXIsIGVsZW1lbnQsIGFwcGx5Rm4sIGluaXRpYWxTdHlsZXMsIHByb3AsIGJpbmRpbmdJbmRleCwgc2FuaXRpemVyKTtcbiAgICAgIH1cblxuICAgICAgLy8gZGVmYXVsdCBjYXNlOiBhcHBseSBgbnVsbGAgdG8gcmVtb3ZlIHRoZSB2YWx1ZVxuICAgICAgaWYgKCFhcHBsaWVkKSB7XG4gICAgICAgIGFwcGx5Rm4ocmVuZGVyZXIsIGVsZW1lbnQsIHByb3AsIG51bGwsIGJpbmRpbmdJbmRleCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgY29uc3Qgc3RhdGUgPSBnZXRTdHlsaW5nU3RhdGUoZWxlbWVudCwgVEVNUExBVEVfRElSRUNUSVZFX0lOREVYKTtcbiAgICBpZiAoaXNDbGFzc0Jhc2VkKSB7XG4gICAgICBzdGF0ZS5sYXN0RGlyZWN0Q2xhc3NNYXAgPSBtYXA7XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0YXRlLmxhc3REaXJlY3RTdHlsZU1hcCA9IG1hcDtcbiAgICB9XG5cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuICByZXR1cm4gZmFsc2U7XG59XG5cbi8qKlxuICogQXBwbGllcyB0aGUgcHJvdmlkZWQgc3R5bGluZyBwcm9wL3ZhbHVlIHRvIHRoZSBlbGVtZW50IGRpcmVjdGx5ICh3aXRob3V0IGNvbnRleHQgcmVzb2x1dGlvbikuXG4gKlxuICogVGhpcyBmdW5jdGlvbiBpcyBkZXNpZ25lZCB0byBiZSBydW4gZnJvbSB0aGUgc3R5bGluZyBpbnN0cnVjdGlvbnMgYW5kIHdpbGwgYmUgY2FsbGVkXG4gKiBhdXRvbWF0aWNhbGx5LiBUaGlzIGZ1bmN0aW9uIGlzIGludGVuZGVkIHRvIGJlIHVzZWQgZm9yIHBlcmZvcm1hbmNlIHJlYXNvbnMgaW4gdGhlXG4gKiBldmVudCB0aGF0IHRoZXJlIGlzIG5vIG5lZWQgdG8gYXBwbHkgc3R5bGluZyB2aWEgY29udGV4dCByZXNvbHV0aW9uLlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gaGFzIGZvdXIgZGlmZmVyZW50IGNhc2VzIHRoYXQgY2FuIG9jY3VyOlxuICpcbiAqIC0gQ2FzZSAxOiBBcHBseSB0aGUgcHJvdmlkZWQgcHJvcC92YWx1ZSAoc3R5bGUgb3IgY2xhc3MpIGVudHJ5IHRvIHRoZSBlbGVtZW50XG4gKiAgICAgICAgICAgKGlmIGl0IGlzIGBub24gbnVsbGApLlxuICpcbiAqIC0gQ2FzZSAyOiBJZiB2YWx1ZSBkb2VzIG5vdCBnZXQgYXBwbGllZCAoYmVjYXVzZSBpdHMgYG51bGxgIG9yIGB1bmRlZmluZWRgKSB0aGVuIHRoZSBhbGdvcml0aG1cbiAqICAgICAgICAgICB3aWxsIGNoZWNrIHRvIHNlZSBpZiBhIHN0eWxpbmcgbWFwIHZhbHVlIHdhcyBhcHBsaWVkIHRvIHRoZSBlbGVtZW50IGFzIHdlbGwganVzdFxuICogICAgICAgICAgIGJlZm9yZSB0aGlzICh2aWEgYHN0eWxlTWFwYCBvciBgY2xhc3NNYXBgKS4gSWYgYW5kIHdoZW4gYSBtYXAgaXMgcHJlc2VudCB0aGVuIHRoZVxuICAqICAgICAgICAgIGFsZ29yaXRobSB3aWxsIGZpbmQgdGhlIG1hdGNoaW5nIHByb3BlcnR5IGluIHRoZSBtYXAgYW5kIGFwcGx5IGl0cyB2YWx1ZS5cbiAgKlxuICogLSBDYXNlIDM6IElmIGEgbWFwIHZhbHVlIGZhaWxzIHRvIGJlIGFwcGxpZWQgdGhlbiB0aGUgYWxnb3JpdGhtIHdpbGwgY2hlY2sgdG8gc2VlIGlmIHRoZXJlXG4gKiAgICAgICAgICAgYXJlIGFueSBpbml0aWFsIHZhbHVlcyBwcmVzZW50IGFuZCBhdHRlbXB0IHRvIGFwcGx5IGEgbWF0Y2hpbmcgdmFsdWUgYmFzZWQgb25cbiAqICAgICAgICAgICB0aGUgdGFyZ2V0IHByb3AuXG4gKlxuICogLSBEZWZhdWx0IENhc2U6IElmIGEgbWF0Y2hpbmcgaW5pdGlhbCB2YWx1ZSBjYW5ub3QgYmUgYXBwbGllZCB0aGVuIGEgZGVmYXVsdCB2YWx1ZVxuICogICAgICAgICAgICAgICAgIG9mIGBudWxsYCB3aWxsIGJlIGFwcGxpZWQgKHdoaWNoIHdpbGwgcmVtb3ZlIHRoZSBzdHlsZS9jbGFzcyB2YWx1ZVxuICogICAgICAgICAgICAgICAgIGZyb20gdGhlIGVsZW1lbnQpLlxuICpcbiAqIFNlZSBgYWxsb3dEaXJlY3RTdHlsaW5nQXBwbHlgIHRvIGxlYXJuIHRoZSBsb2dpYyB1c2VkIHRvIGRldGVybWluZSB3aGV0aGVyIGFueSBzdHlsZS9jbGFzc1xuICogYmluZGluZ3MgY2FuIGJlIGRpcmVjdGx5IGFwcGxpZWQuXG4gKlxuICogQHJldHVybnMgd2hldGhlciBvciBub3QgdGhlIHByb3AvdmFsdWUgc3R5bGluZyB3YXMgYXBwbGllZCB0byB0aGUgZWxlbWVudC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFwcGx5U3R5bGluZ1ZhbHVlRGlyZWN0bHkoXG4gICAgcmVuZGVyZXI6IGFueSwgY29udGV4dDogVFN0eWxpbmdDb250ZXh0LCBlbGVtZW50OiBSRWxlbWVudCwgZGF0YTogTFN0eWxpbmdEYXRhLFxuICAgIGJpbmRpbmdJbmRleDogbnVtYmVyLCBwcm9wOiBzdHJpbmcsIHZhbHVlOiBhbnksIGlzQ2xhc3NCYXNlZDogYm9vbGVhbiwgYXBwbHlGbjogQXBwbHlTdHlsaW5nRm4sXG4gICAgc2FuaXRpemVyPzogU3R5bGVTYW5pdGl6ZUZuIHwgbnVsbCk6IGJvb2xlYW4ge1xuICBsZXQgYXBwbGllZCA9IGZhbHNlO1xuICBpZiAoaGFzVmFsdWVDaGFuZ2VkKGRhdGFbYmluZGluZ0luZGV4XSwgdmFsdWUpKSB7XG4gICAgc2V0VmFsdWUoZGF0YSwgYmluZGluZ0luZGV4LCB2YWx1ZSk7XG5cbiAgICAvLyBjYXNlIDE6IGFwcGx5IHRoZSBwcm92aWRlZCB2YWx1ZSAoaWYgaXQgZXhpc3RzKVxuICAgIGFwcGxpZWQgPSBhcHBseVN0eWxpbmdWYWx1ZShyZW5kZXJlciwgZWxlbWVudCwgcHJvcCwgdmFsdWUsIGFwcGx5Rm4sIGJpbmRpbmdJbmRleCwgc2FuaXRpemVyKTtcblxuICAgIC8vIGNhc2UgMjogZmluZCB0aGUgbWF0Y2hpbmcgcHJvcGVydHkgaW4gYSBzdHlsaW5nIG1hcCBhbmQgYXBwbHkgdGhlIGRldGVjdGVkIHZhbHVlXG4gICAgaWYgKCFhcHBsaWVkICYmIGhhc0NvbmZpZyhjb250ZXh0LCBUU3R5bGluZ0NvbmZpZy5IYXNNYXBCaW5kaW5ncykpIHtcbiAgICAgIGNvbnN0IHN0YXRlID0gZ2V0U3R5bGluZ1N0YXRlKGVsZW1lbnQsIFRFTVBMQVRFX0RJUkVDVElWRV9JTkRFWCk7XG4gICAgICBjb25zdCBtYXAgPSBpc0NsYXNzQmFzZWQgPyBzdGF0ZS5sYXN0RGlyZWN0Q2xhc3NNYXAgOiBzdGF0ZS5sYXN0RGlyZWN0U3R5bGVNYXA7XG4gICAgICBhcHBsaWVkID0gbWFwID9cbiAgICAgICAgICBmaW5kQW5kQXBwbHlNYXBWYWx1ZShyZW5kZXJlciwgZWxlbWVudCwgYXBwbHlGbiwgbWFwLCBwcm9wLCBiaW5kaW5nSW5kZXgsIHNhbml0aXplcikgOlxuICAgICAgICAgIGZhbHNlO1xuICAgIH1cblxuICAgIC8vIGNhc2UgMzogYXBwbHkgdGhlIGluaXRpYWwgdmFsdWUgKGlmIGl0IGV4aXN0cylcbiAgICBpZiAoIWFwcGxpZWQgJiYgaGFzQ29uZmlnKGNvbnRleHQsIFRTdHlsaW5nQ29uZmlnLkhhc0luaXRpYWxTdHlsaW5nKSkge1xuICAgICAgY29uc3QgbWFwID0gZ2V0U3R5bGluZ01hcEFycmF5KGNvbnRleHQpO1xuICAgICAgYXBwbGllZCA9XG4gICAgICAgICAgbWFwID8gZmluZEFuZEFwcGx5TWFwVmFsdWUocmVuZGVyZXIsIGVsZW1lbnQsIGFwcGx5Rm4sIG1hcCwgcHJvcCwgYmluZGluZ0luZGV4KSA6IGZhbHNlO1xuICAgIH1cblxuICAgIC8vIGRlZmF1bHQgY2FzZTogYXBwbHkgYG51bGxgIHRvIHJlbW92ZSB0aGUgdmFsdWVcbiAgICBpZiAoIWFwcGxpZWQpIHtcbiAgICAgIGFwcGx5Rm4ocmVuZGVyZXIsIGVsZW1lbnQsIHByb3AsIG51bGwsIGJpbmRpbmdJbmRleCk7XG4gICAgfVxuICB9XG4gIHJldHVybiBhcHBsaWVkO1xufVxuXG5mdW5jdGlvbiBhcHBseVN0eWxpbmdWYWx1ZShcbiAgICByZW5kZXJlcjogYW55LCBlbGVtZW50OiBSRWxlbWVudCwgcHJvcDogc3RyaW5nLCB2YWx1ZTogYW55LCBhcHBseUZuOiBBcHBseVN0eWxpbmdGbixcbiAgICBiaW5kaW5nSW5kZXg6IG51bWJlciwgc2FuaXRpemVyPzogU3R5bGVTYW5pdGl6ZUZuIHwgbnVsbCk6IGJvb2xlYW4ge1xuICBsZXQgdmFsdWVUb0FwcGx5OiBzdHJpbmd8bnVsbCA9IHVud3JhcFNhZmVWYWx1ZSh2YWx1ZSk7XG4gIGlmIChpc1N0eWxpbmdWYWx1ZURlZmluZWQodmFsdWVUb0FwcGx5KSkge1xuICAgIHZhbHVlVG9BcHBseSA9XG4gICAgICAgIHNhbml0aXplciA/IHNhbml0aXplcihwcm9wLCB2YWx1ZSwgU3R5bGVTYW5pdGl6ZU1vZGUuVmFsaWRhdGVBbmRTYW5pdGl6ZSkgOiB2YWx1ZVRvQXBwbHk7XG4gICAgYXBwbHlGbihyZW5kZXJlciwgZWxlbWVudCwgcHJvcCwgdmFsdWVUb0FwcGx5LCBiaW5kaW5nSW5kZXgpO1xuICAgIHJldHVybiB0cnVlO1xuICB9XG4gIHJldHVybiBmYWxzZTtcbn1cblxuZnVuY3Rpb24gZmluZEFuZEFwcGx5TWFwVmFsdWUoXG4gICAgcmVuZGVyZXI6IGFueSwgZWxlbWVudDogUkVsZW1lbnQsIGFwcGx5Rm46IEFwcGx5U3R5bGluZ0ZuLCBtYXA6IFN0eWxpbmdNYXBBcnJheSwgcHJvcDogc3RyaW5nLFxuICAgIGJpbmRpbmdJbmRleDogbnVtYmVyLCBzYW5pdGl6ZXI/OiBTdHlsZVNhbml0aXplRm4gfCBudWxsKSB7XG4gIGZvciAobGV0IGkgPSBTdHlsaW5nTWFwQXJyYXlJbmRleC5WYWx1ZXNTdGFydFBvc2l0aW9uOyBpIDwgbWFwLmxlbmd0aDtcbiAgICAgICBpICs9IFN0eWxpbmdNYXBBcnJheUluZGV4LlR1cGxlU2l6ZSkge1xuICAgIGNvbnN0IHAgPSBnZXRNYXBQcm9wKG1hcCwgaSk7XG4gICAgaWYgKHAgPT09IHByb3ApIHtcbiAgICAgIGxldCB2YWx1ZVRvQXBwbHkgPSBnZXRNYXBWYWx1ZShtYXAsIGkpO1xuICAgICAgdmFsdWVUb0FwcGx5ID0gc2FuaXRpemVyID9cbiAgICAgICAgICBzYW5pdGl6ZXIocHJvcCwgdmFsdWVUb0FwcGx5LCBTdHlsZVNhbml0aXplTW9kZS5WYWxpZGF0ZUFuZFNhbml0aXplKSA6XG4gICAgICAgICAgdmFsdWVUb0FwcGx5O1xuICAgICAgYXBwbHlGbihyZW5kZXJlciwgZWxlbWVudCwgcHJvcCwgdmFsdWVUb0FwcGx5LCBiaW5kaW5nSW5kZXgpO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIGlmIChwID4gcHJvcCkge1xuICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG4gIHJldHVybiBmYWxzZTtcbn1cblxuZnVuY3Rpb24gbm9ybWFsaXplQml0TWFza1ZhbHVlKHZhbHVlOiBudW1iZXIgfCBib29sZWFuKTogbnVtYmVyIHtcbiAgLy8gaWYgcGFzcyA9PiBhcHBseSBhbGwgdmFsdWVzICgtMSBpbXBsaWVzIHRoYXQgYWxsIGJpdHMgYXJlIGZsaXBwZWQgdG8gdHJ1ZSlcbiAgaWYgKHZhbHVlID09PSB0cnVlKSByZXR1cm4gLTE7XG5cbiAgLy8gaWYgcGFzcyA9PiBza2lwIGFsbCB2YWx1ZXNcbiAgaWYgKHZhbHVlID09PSBmYWxzZSkgcmV0dXJuIDA7XG5cbiAgLy8gcmV0dXJuIHRoZSBiaXQgbWFzayB2YWx1ZSBhcyBpc1xuICByZXR1cm4gdmFsdWU7XG59XG5cbmxldCBfYWN0aXZlU3R5bGluZ01hcEFwcGx5Rm46IFN5bmNTdHlsaW5nTWFwc0ZufG51bGwgPSBudWxsO1xuZXhwb3J0IGZ1bmN0aW9uIGdldFN0eWxpbmdNYXBzU3luY0ZuKCkge1xuICByZXR1cm4gX2FjdGl2ZVN0eWxpbmdNYXBBcHBseUZuO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2V0U3R5bGluZ01hcHNTeW5jRm4oZm46IFN5bmNTdHlsaW5nTWFwc0ZuKSB7XG4gIF9hY3RpdmVTdHlsaW5nTWFwQXBwbHlGbiA9IGZuO1xufVxuXG4vKipcbiAqIEFzc2lnbnMgYSBzdHlsZSB2YWx1ZSB0byBhIHN0eWxlIHByb3BlcnR5IGZvciB0aGUgZ2l2ZW4gZWxlbWVudC5cbiAqL1xuZXhwb3J0IGNvbnN0IHNldFN0eWxlOiBBcHBseVN0eWxpbmdGbiA9XG4gICAgKHJlbmRlcmVyOiBSZW5kZXJlcjMgfCBudWxsLCBuYXRpdmU6IFJFbGVtZW50LCBwcm9wOiBzdHJpbmcsIHZhbHVlOiBzdHJpbmcgfCBudWxsKSA9PiB7XG4gICAgICBpZiAocmVuZGVyZXIgIT09IG51bGwpIHtcbiAgICAgICAgLy8gVXNlIGBpc1N0eWxpbmdWYWx1ZURlZmluZWRgIHRvIGFjY291bnQgZm9yIGZhbHN5IHZhbHVlcyB0aGF0IHNob3VsZCBiZSBib3VuZCBsaWtlIDAuXG4gICAgICAgIGlmIChpc1N0eWxpbmdWYWx1ZURlZmluZWQodmFsdWUpKSB7XG4gICAgICAgICAgLy8gb3BhY2l0eSwgei1pbmRleCBhbmQgZmxleGJveCBhbGwgaGF2ZSBudW1iZXIgdmFsdWVzXG4gICAgICAgICAgLy8gYW5kIHRoZXNlIG5lZWQgdG8gYmUgY29udmVydGVkIGludG8gc3RyaW5ncyBzbyB0aGF0XG4gICAgICAgICAgLy8gdGhleSBjYW4gYmUgYXNzaWduZWQgcHJvcGVybHkuXG4gICAgICAgICAgdmFsdWUgPSB2YWx1ZS50b1N0cmluZygpO1xuICAgICAgICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJTZXRTdHlsZSsrO1xuICAgICAgICAgIGlmIChpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikpIHtcbiAgICAgICAgICAgIHJlbmRlcmVyLnNldFN0eWxlKG5hdGl2ZSwgcHJvcCwgdmFsdWUsIFJlbmRlcmVyU3R5bGVGbGFnczMuRGFzaENhc2UpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBUaGUgcmVhc29uIHdoeSBuYXRpdmUgc3R5bGUgbWF5IGJlIGBudWxsYCBpcyBlaXRoZXIgYmVjYXVzZVxuICAgICAgICAgICAgLy8gaXQncyBhIGNvbnRhaW5lciBlbGVtZW50IG9yIGl0J3MgYSBwYXJ0IG9mIGEgdGVzdFxuICAgICAgICAgICAgLy8gZW52aXJvbm1lbnQgdGhhdCBkb2Vzbid0IGhhdmUgc3R5bGluZy4gSW4gZWl0aGVyXG4gICAgICAgICAgICAvLyBjYXNlIGl0J3Mgc2FmZSBub3QgdG8gYXBwbHkgc3R5bGluZyB0byB0aGUgZWxlbWVudC5cbiAgICAgICAgICAgIGNvbnN0IG5hdGl2ZVN0eWxlID0gbmF0aXZlLnN0eWxlO1xuICAgICAgICAgICAgaWYgKG5hdGl2ZVN0eWxlICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgbmF0aXZlU3R5bGUuc2V0UHJvcGVydHkocHJvcCwgdmFsdWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyUmVtb3ZlU3R5bGUrKztcblxuICAgICAgICAgIGlmIChpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikpIHtcbiAgICAgICAgICAgIHJlbmRlcmVyLnJlbW92ZVN0eWxlKG5hdGl2ZSwgcHJvcCwgUmVuZGVyZXJTdHlsZUZsYWdzMy5EYXNoQ2FzZSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnN0IG5hdGl2ZVN0eWxlID0gbmF0aXZlLnN0eWxlO1xuICAgICAgICAgICAgaWYgKG5hdGl2ZVN0eWxlICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgbmF0aXZlU3R5bGUucmVtb3ZlUHJvcGVydHkocHJvcCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfTtcblxuLyoqXG4gKiBBZGRzL3JlbW92ZXMgdGhlIHByb3ZpZGVkIGNsYXNzTmFtZSB2YWx1ZSB0byB0aGUgcHJvdmlkZWQgZWxlbWVudC5cbiAqL1xuZXhwb3J0IGNvbnN0IHNldENsYXNzOiBBcHBseVN0eWxpbmdGbiA9XG4gICAgKHJlbmRlcmVyOiBSZW5kZXJlcjMgfCBudWxsLCBuYXRpdmU6IFJFbGVtZW50LCBjbGFzc05hbWU6IHN0cmluZywgdmFsdWU6IGFueSkgPT4ge1xuICAgICAgaWYgKHJlbmRlcmVyICE9PSBudWxsICYmIGNsYXNzTmFtZSAhPT0gJycpIHtcbiAgICAgICAgaWYgKHZhbHVlKSB7XG4gICAgICAgICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlckFkZENsYXNzKys7XG4gICAgICAgICAgaWYgKGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSkge1xuICAgICAgICAgICAgcmVuZGVyZXIuYWRkQ2xhc3MobmF0aXZlLCBjbGFzc05hbWUpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyB0aGUgcmVhc29uIHdoeSBjbGFzc0xpc3QgbWF5IGJlIGBudWxsYCBpcyBlaXRoZXIgYmVjYXVzZVxuICAgICAgICAgICAgLy8gaXQncyBhIGNvbnRhaW5lciBlbGVtZW50IG9yIGl0J3MgYSBwYXJ0IG9mIGEgdGVzdFxuICAgICAgICAgICAgLy8gZW52aXJvbm1lbnQgdGhhdCBkb2Vzbid0IGhhdmUgc3R5bGluZy4gSW4gZWl0aGVyXG4gICAgICAgICAgICAvLyBjYXNlIGl0J3Mgc2FmZSBub3QgdG8gYXBwbHkgc3R5bGluZyB0byB0aGUgZWxlbWVudC5cbiAgICAgICAgICAgIGNvbnN0IGNsYXNzTGlzdCA9IG5hdGl2ZS5jbGFzc0xpc3Q7XG4gICAgICAgICAgICBpZiAoY2xhc3NMaXN0ICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgY2xhc3NMaXN0LmFkZChjbGFzc05hbWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyUmVtb3ZlQ2xhc3MrKztcbiAgICAgICAgICBpZiAoaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpKSB7XG4gICAgICAgICAgICByZW5kZXJlci5yZW1vdmVDbGFzcyhuYXRpdmUsIGNsYXNzTmFtZSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnN0IGNsYXNzTGlzdCA9IG5hdGl2ZS5jbGFzc0xpc3Q7XG4gICAgICAgICAgICBpZiAoY2xhc3NMaXN0ICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgY2xhc3NMaXN0LnJlbW92ZShjbGFzc05hbWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH07XG5cbi8qKlxuICogSXRlcmF0ZXMgb3ZlciBhbGwgcHJvdmlkZWQgc3R5bGluZyBlbnRyaWVzIGFuZCByZW5kZXJzIHRoZW0gb24gdGhlIGVsZW1lbnQuXG4gKlxuICogVGhpcyBmdW5jdGlvbiBpcyB1c2VkIGFsb25nc2lkZSBhIGBTdHlsaW5nTWFwQXJyYXlgIGVudHJ5LiBUaGlzIGVudHJ5IGlzIG5vdFxuICogdGhlIHNhbWUgYXMgdGhlIGBUU3R5bGluZ0NvbnRleHRgIGFuZCBpcyBvbmx5IHJlYWxseSB1c2VkIHdoZW4gYW4gZWxlbWVudCBjb250YWluc1xuICogaW5pdGlhbCBzdHlsaW5nIHZhbHVlcyAoZS5nLiBgPGRpdiBzdHlsZT1cIndpZHRoOjIwMHB4XCI+YCksIGJ1dCBubyBzdHlsZS9jbGFzcyBiaW5kaW5nc1xuICogYXJlIHByZXNlbnQuIElmIGFuZCB3aGVuIHRoYXQgaGFwcGVucyB0aGVuIHRoaXMgZnVuY3Rpb24gd2lsbCBiZSBjYWxsZWQgdG8gcmVuZGVyIGFsbFxuICogaW5pdGlhbCBzdHlsaW5nIHZhbHVlcyBvbiBhbiBlbGVtZW50LlxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVuZGVyU3R5bGluZ01hcChcbiAgICByZW5kZXJlcjogUmVuZGVyZXIzLCBlbGVtZW50OiBSRWxlbWVudCwgc3R5bGluZ1ZhbHVlczogVFN0eWxpbmdDb250ZXh0IHwgU3R5bGluZ01hcEFycmF5IHwgbnVsbCxcbiAgICBpc0NsYXNzQmFzZWQ6IGJvb2xlYW4pOiB2b2lkIHtcbiAgY29uc3Qgc3R5bGluZ01hcEFyciA9IGdldFN0eWxpbmdNYXBBcnJheShzdHlsaW5nVmFsdWVzKTtcbiAgaWYgKHN0eWxpbmdNYXBBcnIpIHtcbiAgICBmb3IgKGxldCBpID0gU3R5bGluZ01hcEFycmF5SW5kZXguVmFsdWVzU3RhcnRQb3NpdGlvbjsgaSA8IHN0eWxpbmdNYXBBcnIubGVuZ3RoO1xuICAgICAgICAgaSArPSBTdHlsaW5nTWFwQXJyYXlJbmRleC5UdXBsZVNpemUpIHtcbiAgICAgIGNvbnN0IHByb3AgPSBnZXRNYXBQcm9wKHN0eWxpbmdNYXBBcnIsIGkpO1xuICAgICAgY29uc3QgdmFsdWUgPSBnZXRNYXBWYWx1ZShzdHlsaW5nTWFwQXJyLCBpKTtcbiAgICAgIGlmIChpc0NsYXNzQmFzZWQpIHtcbiAgICAgICAgc2V0Q2xhc3MocmVuZGVyZXIsIGVsZW1lbnQsIHByb3AsIHZhbHVlLCBudWxsKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHNldFN0eWxlKHJlbmRlcmVyLCBlbGVtZW50LCBwcm9wLCB2YWx1ZSwgbnVsbCk7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG4iXX0=