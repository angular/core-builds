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
            sanitizer ? sanitizer(prop, value, 2 /* SanitizeOnly */) : valueToApply;
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
            valueToApply =
                sanitizer ? sanitizer(prop, valueToApply, 2 /* SanitizeOnly */) : valueToApply;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmluZGluZ3MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL3N0eWxpbmcvYmluZGluZ3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztFQU1FO0FBQ0YsT0FBTyxFQUFZLGVBQWUsRUFBQyxNQUFNLDJCQUEyQixDQUFDO0FBRXJFLE9BQU8sRUFBMkMsbUJBQW1CLEVBQUUsb0JBQW9CLEVBQUMsTUFBTSx3QkFBd0IsQ0FBQztBQUUzSCxPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sV0FBVyxDQUFDO0FBQ3BDLE9BQU8sRUFBQyxxQkFBcUIsRUFBRSxxQkFBcUIsRUFBRSx3QkFBd0IsRUFBRSx5QkFBeUIsRUFBRSx3QkFBd0IsRUFBRSxlQUFlLEVBQUUsU0FBUyxFQUFFLGVBQWUsRUFBRSxZQUFZLEVBQTBCLFVBQVUsRUFBRSxXQUFXLEVBQUUsT0FBTyxFQUFFLDBCQUEwQixFQUFFLGtCQUFrQixFQUFFLGVBQWUsRUFBRSxRQUFRLEVBQUUsY0FBYyxFQUFFLFNBQVMsRUFBRSxlQUFlLEVBQUUsZUFBZSxFQUFFLG1CQUFtQixFQUFFLHNCQUFzQixFQUFFLHFCQUFxQixFQUFFLFdBQVcsRUFBRSxXQUFXLEVBQUUsZUFBZSxFQUFFLFlBQVksRUFBRSxhQUFhLEVBQUUsUUFBUSxFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFFcmpCLE9BQU8sRUFBQyxlQUFlLEVBQUUsaUJBQWlCLEVBQUMsTUFBTSxTQUFTLENBQUM7QUFJM0Q7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBaUJHO0FBRUg7Ozs7R0FJRztBQUNILElBQU0sNkJBQTZCLEdBQUcsQ0FBQyxDQUFDO0FBRXhDOzs7Ozs7Ozs7R0FTRztBQUNILE1BQU0sVUFBVSxxQkFBcUIsQ0FDakMsT0FBd0IsRUFBRSxJQUFrQixFQUFFLE9BQWlCLEVBQUUsY0FBc0IsRUFDdkYsSUFBbUIsRUFBRSxZQUFvQixFQUN6QyxLQUF3RSxFQUN4RSxXQUFxQjtJQUN2QixJQUFNLFVBQVUsR0FBRyxDQUFDLElBQUksQ0FBQztJQUN6QixJQUFNLEtBQUssR0FBRyxlQUFlLENBQUMsT0FBTyxFQUFFLGNBQWMsQ0FBQyxDQUFDO0lBQ3ZELElBQU0sVUFBVSxHQUFHLFVBQVUsQ0FBQyxDQUFDLENBQUMsNkJBQTZCLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxZQUFZLEVBQUUsQ0FBQztJQUNyRixJQUFJLEtBQUssS0FBSyxTQUFTLEVBQUU7UUFDdkIsSUFBTSxPQUFPLEdBQUcsaUJBQWlCLENBQzdCLE9BQU8sRUFBRSxJQUFJLEVBQUUsVUFBVSxFQUFFLEtBQUssQ0FBQyxXQUFXLEVBQUUsSUFBSSxFQUFFLFlBQVksRUFBRSxLQUFLLEVBQUUsV0FBVyxFQUNwRixLQUFLLENBQUMsQ0FBQztRQUNYLElBQUksT0FBTyxJQUFJLFdBQVcsRUFBRTtZQUMxQiw2REFBNkQ7WUFDN0QsbUVBQW1FO1lBQ25FLG1FQUFtRTtZQUNuRSwrREFBK0Q7WUFDL0Qsc0JBQXNCO1lBQ3RCLEtBQUssQ0FBQyxjQUFjLElBQUksQ0FBQyxJQUFJLFVBQVUsQ0FBQztZQUN4QyxPQUFPLElBQUksQ0FBQztTQUNiO0tBQ0Y7SUFDRCxPQUFPLEtBQUssQ0FBQztBQUNmLENBQUM7QUFFRDs7Ozs7Ozs7O0dBU0c7QUFDSCxNQUFNLFVBQVUscUJBQXFCLENBQ2pDLE9BQXdCLEVBQUUsSUFBa0IsRUFBRSxPQUFpQixFQUFFLGNBQXNCLEVBQ3ZGLElBQW1CLEVBQUUsWUFBb0IsRUFDekMsS0FBbUYsRUFDbkYsU0FBaUMsRUFBRSxXQUFxQjtJQUMxRCxJQUFNLFVBQVUsR0FBRyxDQUFDLElBQUksQ0FBQztJQUN6QixJQUFNLEtBQUssR0FBRyxlQUFlLENBQUMsT0FBTyxFQUFFLGNBQWMsQ0FBQyxDQUFDO0lBQ3ZELElBQU0sVUFBVSxHQUFHLFVBQVUsQ0FBQyxDQUFDLENBQUMsNkJBQTZCLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxXQUFXLEVBQUUsQ0FBQztJQUNwRixJQUFJLEtBQUssS0FBSyxTQUFTLEVBQUU7UUFDdkIsSUFBTSxvQkFBb0IsR0FBRyxVQUFVLENBQUMsQ0FBQztZQUNyQyxJQUFJLENBQUMsQ0FBQztZQUNOLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsSUFBTSxFQUFFLElBQUksMkJBQXFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3RGLElBQU0sT0FBTyxHQUFHLGlCQUFpQixDQUM3QixPQUFPLEVBQUUsSUFBSSxFQUFFLFVBQVUsRUFBRSxLQUFLLENBQUMsV0FBVyxFQUFFLElBQUksRUFBRSxZQUFZLEVBQUUsS0FBSyxFQUFFLFdBQVcsRUFDcEYsb0JBQW9CLENBQUMsQ0FBQztRQUMxQixJQUFJLE9BQU8sSUFBSSxXQUFXLEVBQUU7WUFDMUIsNkRBQTZEO1lBQzdELG1FQUFtRTtZQUNuRSxrRUFBa0U7WUFDbEUsK0RBQStEO1lBQy9ELHlCQUF5QjtZQUN6QixLQUFLLENBQUMsYUFBYSxJQUFJLENBQUMsSUFBSSxVQUFVLENBQUM7WUFDdkMsT0FBTyxJQUFJLENBQUM7U0FDYjtLQUNGO0lBQ0QsT0FBTyxLQUFLLENBQUM7QUFDZixDQUFDO0FBRUQ7Ozs7Ozs7Ozs7R0FVRztBQUNILFNBQVMsaUJBQWlCLENBQ3RCLE9BQXdCLEVBQUUsSUFBa0IsRUFBRSxZQUFvQixFQUFFLFdBQW1CLEVBQ3ZGLElBQW1CLEVBQUUsWUFBb0IsRUFDekMsS0FBaUYsRUFDakYsV0FBcUIsRUFBRSxvQkFBOEI7SUFDdkQsSUFBTSxnQkFBZ0IsR0FBRyxtQkFBbUIsQ0FBQyxXQUFXLENBQUMsQ0FBQztJQUMxRCxJQUFJLENBQUMsZUFBZSxDQUFDLE9BQU8sRUFBRSxnQkFBZ0IsQ0FBQyxFQUFFO1FBQy9DLDREQUE0RDtRQUM1RCxpRUFBaUU7UUFDakUsK0RBQStEO1FBQy9ELGtFQUFrRTtRQUNsRSw2REFBNkQ7UUFDN0QsNERBQTREO1FBQzVELGVBQWUsQ0FBQyxPQUFPLEVBQUUsWUFBWSxFQUFFLFdBQVcsRUFBRSxJQUFJLEVBQUUsWUFBWSxFQUFFLG9CQUFvQixDQUFDLENBQUM7UUFDOUYsV0FBVyxDQUNQLE9BQU8sRUFDUCxnQkFBZ0IsQ0FBQyxDQUFDLDBCQUFnQyxDQUFDLDZCQUFtQyxDQUFDLENBQUM7S0FDN0Y7SUFFRCxJQUFNLE9BQU8sR0FBRyxXQUFXLElBQUksZUFBZSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztJQUMxRSxJQUFJLE9BQU8sRUFBRTtRQUNYLFFBQVEsQ0FBQyxJQUFJLEVBQUUsWUFBWSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ3BDLElBQU0sa0JBQWtCLEdBQUcsQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLDJCQUFpQyxDQUFDO1lBQzVFLENBQUMsZ0JBQWdCLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNoRCxJQUFJLGtCQUFrQixFQUFFO1lBQ3RCLHlCQUF5QixDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7U0FDaEQ7S0FDRjtJQUNELE9BQU8sT0FBTyxDQUFDO0FBQ2pCLENBQUM7QUFFRDs7Ozs7Ozs7OztHQVVHO0FBQ0gsU0FBUyx5QkFBeUIsQ0FDOUIsT0FBd0IsRUFBRSxJQUFrQixFQUFFLElBQW1CO0lBQ25FLElBQU0sV0FBVyxHQUFHLGNBQWMsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUU1QyxJQUFJLElBQUksS0FBSyxJQUFJLElBQUksU0FBUyxDQUFDLE9BQU8sMEJBQWlDLEVBQUU7UUFDdkUsSUFBTSxXQUFXLEdBQUcsOEJBQTJDLFdBQVcsQ0FBQztRQUUzRSxJQUFJLENBQUMsOEJBQTJDLENBQUM7UUFDakQsSUFBSSxLQUFLLEdBQUcsS0FBSyxDQUFDO1FBQ2xCLE9BQU8sQ0FBQyxHQUFHLE9BQU8sQ0FBQyxNQUFNLEVBQUU7WUFDekIsSUFBSSxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxLQUFLLElBQUksRUFBRTtnQkFDaEMsS0FBSyxHQUFHLElBQUksQ0FBQztnQkFDYixNQUFNO2FBQ1A7WUFDRCxDQUFDLElBQUksV0FBVyxDQUFDO1NBQ2xCO1FBRUQsSUFBSSxLQUFLLEVBQUU7WUFDVCxJQUFNLGFBQWEsR0FBRyxDQUFDLDhCQUEyQyxDQUFDO1lBQ25FLElBQU0sV0FBVyxHQUFHLGFBQWEsR0FBRyxDQUFDLENBQUMsQ0FBRSx3Q0FBd0M7WUFDaEYsSUFBTSxTQUFTLEdBQUcsYUFBYSxHQUFHLFdBQVcsR0FBRyxDQUFDLENBQUM7WUFFbEQsS0FBSyxJQUFJLEdBQUMsR0FBRyxXQUFXLEVBQUUsR0FBQyxHQUFHLFNBQVMsRUFBRSxHQUFDLEVBQUUsRUFBRTtnQkFDNUMsSUFBTSxZQUFZLEdBQUcsT0FBTyxDQUFDLEdBQUMsQ0FBVyxDQUFDO2dCQUMxQyxJQUFJLFlBQVksS0FBSyxDQUFDLEVBQUU7b0JBQ3RCLFFBQVEsQ0FBQyxJQUFJLEVBQUUsWUFBWSxFQUFFLElBQUksQ0FBQyxDQUFDO2lCQUNwQzthQUNGO1NBQ0Y7S0FDRjtJQUVELElBQUksU0FBUyxDQUFDLE9BQU8seUJBQWdDLEVBQUU7UUFDckQsSUFBTSxhQUFhLEdBQ2YseURBQW1GLENBQUM7UUFDeEYsSUFBTSxXQUFXLEdBQUcsYUFBYSxHQUFHLENBQUMsQ0FBQyxDQUFFLHdDQUF3QztRQUNoRixJQUFNLFNBQVMsR0FBRyxhQUFhLEdBQUcsV0FBVyxHQUFHLENBQUMsQ0FBQztRQUNsRCxLQUFLLElBQUksQ0FBQyxHQUFHLFdBQVcsRUFBRSxDQUFDLEdBQUcsU0FBUyxFQUFFLENBQUMsRUFBRSxFQUFFO1lBQzVDLElBQU0sVUFBVSxHQUFHLFFBQVEsQ0FBa0IsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQVcsQ0FBQyxDQUFDO1lBQ3pFLElBQUksVUFBVSxFQUFFO2dCQUNkLGFBQWEsQ0FBQyxVQUFVLENBQUMsQ0FBQzthQUMzQjtTQUNGO0tBQ0Y7QUFDSCxDQUFDO0FBRUQ7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBNkJHO0FBQ0gsTUFBTSxVQUFVLGVBQWUsQ0FDM0IsT0FBd0IsRUFBRSxPQUFlLEVBQUUsV0FBbUIsRUFBRSxJQUFtQixFQUNuRixZQUE4QyxFQUFFLG9CQUE4QjtJQUNoRixJQUFJLEtBQUssR0FBRyxLQUFLLENBQUM7SUFDbEIsSUFBSSxHQUFHLElBQUksSUFBSSx5QkFBeUIsQ0FBQztJQUV6QyxJQUFJLFlBQVksR0FBRyxlQUFlLENBQUMsT0FBTyxDQUFDLENBQUM7SUFFNUMsMkVBQTJFO0lBQzNFLDJFQUEyRTtJQUMzRSxtREFBbUQ7SUFDbkQsT0FBTyxZQUFZLElBQUksV0FBVyxFQUFFO1FBQ2xDLGtCQUFrQixDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQzVCLFlBQVksRUFBRSxDQUFDO0tBQ2hCO0lBRUQsSUFBTSxtQkFBbUIsR0FBRyxPQUFPLFlBQVksS0FBSyxRQUFRLENBQUM7SUFDN0QsSUFBTSxhQUFhLEdBQUcsOEJBQTJDLGNBQWMsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUN6RixJQUFJLENBQUMsOEJBQTJDLENBQUM7SUFFakQsdURBQXVEO0lBQ3ZELE9BQU8sQ0FBQyxHQUFHLE9BQU8sQ0FBQyxNQUFNLEVBQUU7UUFDekIsSUFBTSxDQUFDLEdBQUcsT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUMsQ0FBQztRQUM5QixJQUFJLElBQUksSUFBSSxDQUFDLEVBQUU7WUFDYixJQUFJLElBQUksR0FBRyxDQUFDLEVBQUU7Z0JBQ1osdUJBQXVCLENBQUMsT0FBTyxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsb0JBQW9CLENBQUMsQ0FBQzthQUNqRTtpQkFBTSxJQUFJLG1CQUFtQixFQUFFO2dCQUM5QixXQUFXLENBQUMsT0FBTyx3QkFBK0IsQ0FBQzthQUNwRDtZQUNELHFCQUFxQixDQUFDLE9BQU8sRUFBRSxDQUFDLEVBQUUsWUFBWSxFQUFFLE9BQU8sRUFBRSxXQUFXLENBQUMsQ0FBQztZQUN0RSxLQUFLLEdBQUcsSUFBSSxDQUFDO1lBQ2IsTUFBTTtTQUNQO1FBQ0QsQ0FBQyxJQUFJLGFBQWEsQ0FBQztLQUNwQjtJQUVELElBQUksQ0FBQyxLQUFLLEVBQUU7UUFDVix1QkFBdUIsQ0FBQyxPQUFPLEVBQUUsT0FBTyxDQUFDLE1BQU0sRUFBRSxJQUFJLEVBQUUsb0JBQW9CLENBQUMsQ0FBQztRQUM3RSxxQkFBcUIsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxFQUFFLFlBQVksRUFBRSxPQUFPLEVBQUUsV0FBVyxDQUFDLENBQUM7S0FDdkU7QUFDSCxDQUFDO0FBRUQ7OztHQUdHO0FBQ0gsU0FBUyx1QkFBdUIsQ0FDNUIsT0FBd0IsRUFBRSxLQUFhLEVBQUUsSUFBWSxFQUFFLG9CQUE4QjtJQUN2RixJQUFNLE1BQU0sR0FBRyxvQkFBb0IsQ0FBQyxDQUFDLDhCQUFxRCxDQUFDO3VCQUNmLENBQUM7SUFDN0UsT0FBTyxDQUFDLE1BQU0sQ0FDVixLQUFLLEVBQUUsQ0FBQyxFQUNSLE1BQU0sRUFBcUIsa0JBQWtCO0lBQzdDLHdCQUF3QixFQUFHLHVCQUF1QjtJQUNsRCx3QkFBd0IsRUFBRyw0QkFBNEI7SUFDdkQsSUFBSSxDQUNILENBQUM7SUFFTixLQUFLLElBQUksQ0FBQyxDQUFDLENBQUUscUJBQXFCO0lBRWxDLHFEQUFxRDtJQUNyRCw4REFBOEQ7SUFDOUQsNkRBQTZEO0lBQzdELGdDQUFnQztJQUNoQyxJQUFNLHFCQUFxQixHQUFHLGVBQWUsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUN2RCxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcscUJBQXFCLEVBQUUsQ0FBQyxFQUFFLEVBQUU7UUFDOUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsQ0FBQyxFQUFFLHFCQUFxQixDQUFDLENBQUM7UUFDaEQsS0FBSyxFQUFFLENBQUM7S0FDVDtJQUVELDZDQUE2QztJQUM3QyxPQUFPLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRSxDQUFDLEVBQUUscUJBQXFCLENBQUMsQ0FBQztBQUNsRCxDQUFDO0FBRUQ7Ozs7Ozs7Ozs7Ozs7R0FhRztBQUNILFNBQVMscUJBQXFCLENBQzFCLE9BQXdCLEVBQUUsS0FBYSxFQUFFLFlBQThDLEVBQ3ZGLFFBQWdCLEVBQUUsV0FBbUI7SUFDdkMsSUFBSSxPQUFPLFlBQVksS0FBSyxRQUFRLEVBQUU7UUFDcEMsSUFBTSxnQkFBZ0IsR0FBRyxtQkFBbUIsQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUMxRCxJQUFNLFNBQVMsR0FBRyxLQUFLLDhCQUEyQyxHQUFHLFdBQVcsQ0FBQztRQUNqRixPQUFPLENBQUMsU0FBUyxDQUFDLEdBQUcsWUFBWSxDQUFDO1FBQ2xDLElBQU0sY0FBYyxHQUFHLFlBQVksQ0FBQyxPQUFPLEVBQUUsS0FBSyxFQUFFLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksUUFBUSxDQUFDLENBQUM7UUFDeEYsWUFBWSxDQUFDLE9BQU8sRUFBRSxLQUFLLEVBQUUsY0FBYyxFQUFFLGdCQUFnQixDQUFDLENBQUM7S0FDaEU7U0FBTSxJQUFJLFlBQVksS0FBSyxJQUFJLElBQUksZUFBZSxDQUFDLE9BQU8sRUFBRSxLQUFLLENBQUMsS0FBSyxJQUFJLEVBQUU7UUFDNUUsZUFBZSxDQUFDLE9BQU8sRUFBRSxLQUFLLEVBQUUsWUFBWSxDQUFDLENBQUM7S0FDL0M7QUFDSCxDQUFDO0FBRUQ7Ozs7Ozs7Ozs7O0dBV0c7QUFDSCxTQUFTLGtCQUFrQixDQUFDLE9BQXdCO0lBQ2xELDJGQUEyRjtJQUMzRixJQUFNLFlBQVksR0FBRyw4QkFBMkMsY0FBYyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUU1RixJQUFJLEtBQUssOEJBQTJDLENBQUM7SUFDckQsT0FBTyxLQUFLLEdBQUcsT0FBTyxDQUFDLE1BQU0sRUFBRTtRQUM3QixLQUFLLElBQUksWUFBWSxDQUFDO1FBQ3RCLE9BQU8sQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxFQUFFLHFCQUFxQixDQUFDLENBQUM7UUFFbEQsZ0VBQWdFO1FBQ2hFLCtEQUErRDtRQUMvRCxLQUFLLEVBQUUsQ0FBQztLQUNUO0lBQ0QsT0FBTyw4QkFBMkMsRUFBRSxDQUFDO0FBQ3ZELENBQUM7QUFFRDs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBcUJHO0FBQ0gsTUFBTSxVQUFVLFlBQVksQ0FDeEIsUUFBZ0QsRUFBRSxJQUFrQixFQUNwRSxjQUFzQyxFQUFFLGFBQXFDLEVBQzdFLE9BQWlCLEVBQUUsY0FBc0IsRUFBRSxjQUFzQztJQUNuRixTQUFTLElBQUksU0FBUyxDQUFDLFlBQVksRUFBRSxDQUFDO0lBRXRDLElBQU0sS0FBSyxHQUFHLGVBQWUsQ0FBQyxPQUFPLEVBQUUsY0FBYyxDQUFDLENBQUM7SUFDdkQsSUFBTSxnQkFBZ0IsR0FBRyxtQkFBbUIsQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLENBQUM7SUFFaEUsSUFBSSxhQUFhLEVBQUU7UUFDakIsSUFBSSxDQUFDLGVBQWUsQ0FBQyxhQUFhLEVBQUUsZ0JBQWdCLENBQUMsRUFBRTtZQUNyRCxzQkFBc0IsQ0FBQyxhQUFhLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQztTQUN6RDtRQUNELElBQUksS0FBSyxDQUFDLGFBQWEsS0FBSyxDQUFDLEVBQUU7WUFDN0Isc0JBQXNCLENBQ2xCLGFBQWEsRUFBRSxRQUFRLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxLQUFLLENBQUMsYUFBYSxFQUFFLFFBQVEsRUFBRSxjQUFjLEVBQ3JGLGdCQUFnQixDQUFDLENBQUM7U0FDdkI7S0FDRjtJQUVELElBQUksY0FBYyxFQUFFO1FBQ2xCLElBQUksQ0FBQyxlQUFlLENBQUMsY0FBYyxFQUFFLGdCQUFnQixDQUFDLEVBQUU7WUFDdEQsc0JBQXNCLENBQUMsY0FBYyxFQUFFLGdCQUFnQixDQUFDLENBQUM7U0FDMUQ7UUFDRCxJQUFJLEtBQUssQ0FBQyxjQUFjLEtBQUssQ0FBQyxFQUFFO1lBQzlCLHNCQUFzQixDQUNsQixjQUFjLEVBQUUsUUFBUSxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsS0FBSyxDQUFDLGNBQWMsRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUM3RSxnQkFBZ0IsQ0FBQyxDQUFDO1NBQ3ZCO0tBQ0Y7SUFFRCxpQkFBaUIsRUFBRSxDQUFDO0FBQ3RCLENBQUM7QUFFRDs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztHQXlCRztBQUNILFNBQVMsc0JBQXNCLENBQUMsT0FBd0IsRUFBRSxnQkFBeUI7SUFDakYsSUFBTSxhQUFhLEdBQUcsa0JBQWtCLENBQUMsT0FBTyxDQUFHLENBQUM7SUFDcEQsNkJBQTZCLENBQUMsT0FBTyxFQUFFLGFBQWEsQ0FBQyxDQUFDO0lBQ3RELFdBQVcsQ0FBQyxPQUFPLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQztBQUN6QyxDQUFDO0FBRUQ7Ozs7Ozs7Ozs7Ozs7R0FhRztBQUNILFNBQVMsNkJBQTZCLENBQ2xDLE9BQXdCLEVBQUUsY0FBK0I7SUFDM0Qsb0VBQW9FO0lBQ3BFLG1DQUFtQztJQUNuQyxJQUFNLG9CQUFvQixHQUFHLENBQUMsQ0FBQyxDQUFDO0lBRWhDLElBQUksaUJBQWlCLEdBQUcsS0FBSyxDQUFDO0lBQzlCLEtBQUssSUFBSSxDQUFDLDhCQUEyQyxFQUFFLENBQUMsR0FBRyxjQUFjLENBQUMsTUFBTSxFQUMzRSxDQUFDLHFCQUFrQyxFQUFFO1FBQ3hDLElBQU0sS0FBSyxHQUFHLFdBQVcsQ0FBQyxjQUFjLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDN0MsSUFBSSxLQUFLLEVBQUU7WUFDVCxJQUFNLElBQUksR0FBRyxVQUFVLENBQUMsY0FBYyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzNDLGVBQWUsQ0FBQyxPQUFPLEVBQUUsb0JBQW9CLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDdEUsaUJBQWlCLEdBQUcsSUFBSSxDQUFDO1NBQzFCO0tBQ0Y7SUFFRCxJQUFJLGlCQUFpQixFQUFFO1FBQ3JCLFdBQVcsQ0FBQyxPQUFPLDZCQUFtQyxDQUFDO0tBQ3hEO0FBQ0gsQ0FBQztBQUVEOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztHQTBCRztBQUNILE1BQU0sVUFBVSxzQkFBc0IsQ0FDbEMsT0FBd0IsRUFBRSxRQUFnRCxFQUFFLE9BQWlCLEVBQzdGLFdBQXlCLEVBQUUsWUFBOEIsRUFBRSxjQUE4QixFQUN6RixTQUFpQyxFQUFFLGdCQUF5QjtJQUM5RCxJQUFNLE9BQU8sR0FBRyxxQkFBcUIsQ0FBQyxZQUFZLENBQUMsQ0FBQztJQUVwRCxJQUFJLGlCQUFpQixHQUEyQixJQUFJLENBQUM7SUFDckQsSUFBSSxjQUFjLEdBQUcsS0FBSyxDQUFDO0lBQzNCLElBQUksU0FBUyxDQUFDLE9BQU8seUJBQWdDLEVBQUU7UUFDckQsaUJBQWlCLEdBQUcsb0JBQW9CLEVBQUUsQ0FBQztRQUMzQyxJQUFNLGFBQWEsR0FDZixZQUFZLENBQUMsT0FBTywrQkFBNEMsZ0JBQWdCLENBQUMsQ0FBQztRQUN0RixjQUFjLEdBQUcsQ0FBQyxPQUFPLEdBQUcsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO0tBQ2xEO0lBRUQsSUFBTSxXQUFXLEdBQUcsY0FBYyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQzVDLElBQUksb0JBQW9CLEdBQUcsQ0FBQyxDQUFDO0lBQzdCLElBQUksUUFBUSxHQUNSLGNBQWMsQ0FBQyxDQUFDLHdCQUFvQyxDQUFDLHVCQUFtQyxDQUFDO0lBQzdGLElBQUksZ0JBQWdCLEVBQUU7UUFDcEIsUUFBUSw0QkFBd0MsQ0FBQztRQUNqRCxvQkFBb0IsR0FBRyxXQUFXLEdBQUcsQ0FBQyxDQUFDO0tBQ3hDO0lBRUQsSUFBSSxDQUFDLEdBQUcsMEJBQTBCLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDNUMsT0FBTyxDQUFDLEdBQUcsT0FBTyxDQUFDLE1BQU0sRUFBRTtRQUN6QixJQUFNLFNBQVMsR0FBRyxZQUFZLENBQUMsT0FBTyxFQUFFLENBQUMsRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDO1FBQzdELElBQUksT0FBTyxHQUFHLFNBQVMsRUFBRTtZQUN2QixJQUFJLFlBQVksR0FBRyxLQUFLLENBQUM7WUFDekIsSUFBTSxJQUFJLEdBQUcsT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNqQyxJQUFNLFlBQVksR0FBRyxlQUFlLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBRWpELDJDQUEyQztZQUMzQyxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsb0JBQW9CLEVBQUUsQ0FBQyxFQUFFLEVBQUU7Z0JBQzdDLElBQU0sWUFBWSxHQUFHLGVBQWUsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBVyxDQUFDO2dCQUM5RCxJQUFJLENBQUMsWUFBWSxJQUFJLFlBQVksS0FBSyxDQUFDLEVBQUU7b0JBQ3ZDLElBQU0sS0FBSyxHQUFHLFFBQVEsQ0FBQyxXQUFXLEVBQUUsWUFBWSxDQUFDLENBQUM7b0JBQ2xELElBQUkscUJBQXFCLENBQUMsS0FBSyxDQUFDLEVBQUU7d0JBQ2hDLElBQU0sY0FBYyxHQUFHLGdCQUFnQixJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7d0JBQ25ELElBQUksQ0FBQyxjQUFjLEVBQUU7NEJBQ25CLElBQU0sVUFBVSxHQUFHLFNBQVMsSUFBSSxzQkFBc0IsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQ0FDaEUsU0FBUyxDQUFDLElBQUksRUFBRSxLQUFLLHVCQUFpQyxDQUFDLENBQUM7Z0NBQ3hELGVBQWUsQ0FBQyxLQUFLLENBQUMsQ0FBQzs0QkFDM0IsY0FBYyxDQUFDLFFBQVEsRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLFVBQVUsRUFBRSxZQUFZLENBQUMsQ0FBQzt5QkFDbkU7d0JBQ0QsWUFBWSxHQUFHLElBQUksQ0FBQztxQkFDckI7aUJBQ0Y7Z0JBRUQsMkRBQTJEO2dCQUMzRCxJQUFJLGlCQUFpQixFQUFFO29CQUNyQixzRUFBc0U7b0JBQ3RFLElBQUksSUFBSSxHQUFHLFFBQVEsR0FBRyxDQUFDLFlBQVksQ0FBQyxDQUFDLHdCQUFvQyxDQUFDOytDQUNELENBQUMsQ0FBQztvQkFFM0UsdUVBQXVFO29CQUN2RSx3RUFBd0U7b0JBQ3hFLHlFQUF5RTtvQkFDekUsd0VBQXdFO29CQUN4RSx1RUFBdUU7b0JBQ3ZFLDBFQUEwRTtvQkFDMUUsbUJBQW1CO29CQUNuQixJQUFJLGdCQUFnQixJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUU7d0JBQy9CLElBQUksNEJBQXVDLENBQUM7cUJBQzdDO29CQUVELElBQU0scUJBQXFCLEdBQUcsaUJBQWlCLENBQzNDLE9BQU8sRUFBRSxRQUFRLEVBQUUsT0FBTyxFQUFFLFdBQVcsRUFBRSxDQUFDLEVBQUUsY0FBYyxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUNqRixZQUFZLENBQUMsQ0FBQztvQkFDbEIsWUFBWSxHQUFHLFlBQVksSUFBSSxxQkFBcUIsQ0FBQztpQkFDdEQ7YUFDRjtZQUVELDJGQUEyRjtZQUMzRixrRkFBa0Y7WUFDbEYsa0ZBQWtGO1lBQ2xGLHVEQUF1RDtZQUN2RCxJQUFJLENBQUMsWUFBWSxFQUFFO2dCQUNqQixjQUFjLENBQUMsUUFBUSxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsWUFBWSxDQUFDLENBQUM7YUFDdkQ7U0FDRjtRQUVELENBQUMsSUFBSSw4QkFBMkMsV0FBVyxDQUFDO0tBQzdEO0lBRUQsK0RBQStEO0lBQy9ELDhEQUE4RDtJQUM5RCxpQ0FBaUM7SUFDakMsSUFBSSxpQkFBaUIsRUFBRTtRQUNyQixJQUFJLGdCQUFnQixFQUFFO1lBQ3BCLFFBQVEsNEJBQXVDLENBQUM7U0FDakQ7UUFDRCxpQkFBaUIsQ0FDYixPQUFPLEVBQUUsUUFBUSxFQUFFLE9BQU8sRUFBRSxXQUFXLEVBQUUsQ0FBQyxFQUFFLGNBQWMsRUFBRSxTQUFTLEVBQUUsUUFBUSxDQUFDLENBQUM7S0FDdEY7QUFDSCxDQUFDO0FBRUQ7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztHQXFCRztBQUNILE1BQU0sVUFBVSx1QkFBdUIsQ0FDbkMsUUFBYSxFQUFFLE9BQXdCLEVBQUUsT0FBaUIsRUFBRSxJQUFrQixFQUM5RSxZQUFvQixFQUFFLEdBQW9CLEVBQUUsWUFBcUIsRUFBRSxPQUF1QixFQUMxRixTQUFrQyxFQUFFLFdBQXFCO0lBQzNELElBQUksV0FBVyxJQUFJLGVBQWUsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLEVBQUUsR0FBRyxDQUFDLEVBQUU7UUFDM0QsUUFBUSxDQUFDLElBQUksRUFBRSxZQUFZLEVBQUUsR0FBRyxDQUFDLENBQUM7UUFDbEMsSUFBTSxhQUFhLEdBQ2YsU0FBUyxDQUFDLE9BQU8sNkJBQW1DLENBQUMsQ0FBQyxDQUFDLGtCQUFrQixDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7UUFFOUYsS0FBSyxJQUFJLENBQUMsOEJBQTJDLEVBQUUsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxNQUFNLEVBQ2hFLENBQUMscUJBQWtDLEVBQUU7WUFDeEMsSUFBTSxJQUFJLEdBQUcsVUFBVSxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNoQyxJQUFNLEtBQUssR0FBRyxXQUFXLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBRWxDLDZDQUE2QztZQUM3QyxJQUFJLE9BQU8sR0FDUCxpQkFBaUIsQ0FBQyxRQUFRLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsT0FBTyxFQUFFLFlBQVksRUFBRSxTQUFTLENBQUMsQ0FBQztZQUV4RixpREFBaUQ7WUFDakQsSUFBSSxDQUFDLE9BQU8sSUFBSSxhQUFhLEVBQUU7Z0JBQzdCLE9BQU8sR0FBRyxvQkFBb0IsQ0FDMUIsUUFBUSxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsYUFBYSxFQUFFLElBQUksRUFBRSxZQUFZLEVBQUUsU0FBUyxDQUFDLENBQUM7YUFDL0U7WUFFRCxpREFBaUQ7WUFDakQsSUFBSSxDQUFDLE9BQU8sRUFBRTtnQkFDWixPQUFPLENBQUMsUUFBUSxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLFlBQVksQ0FBQyxDQUFDO2FBQ3REO1NBQ0Y7UUFFRCxJQUFNLEtBQUssR0FBRyxlQUFlLENBQUMsT0FBTyxFQUFFLHdCQUF3QixDQUFDLENBQUM7UUFDakUsSUFBSSxZQUFZLEVBQUU7WUFDaEIsS0FBSyxDQUFDLGtCQUFrQixHQUFHLEdBQUcsQ0FBQztTQUNoQzthQUFNO1lBQ0wsS0FBSyxDQUFDLGtCQUFrQixHQUFHLEdBQUcsQ0FBQztTQUNoQztRQUVELE9BQU8sSUFBSSxDQUFDO0tBQ2I7SUFDRCxPQUFPLEtBQUssQ0FBQztBQUNmLENBQUM7QUFFRDs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7R0E2Qkc7QUFDSCxNQUFNLFVBQVUseUJBQXlCLENBQ3JDLFFBQWEsRUFBRSxPQUF3QixFQUFFLE9BQWlCLEVBQUUsSUFBa0IsRUFDOUUsWUFBb0IsRUFBRSxJQUFZLEVBQUUsS0FBVSxFQUFFLFlBQXFCLEVBQUUsT0FBdUIsRUFDOUYsU0FBa0M7SUFDcEMsSUFBSSxPQUFPLEdBQUcsS0FBSyxDQUFDO0lBQ3BCLElBQUksZUFBZSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsRUFBRSxLQUFLLENBQUMsRUFBRTtRQUM5QyxRQUFRLENBQUMsSUFBSSxFQUFFLFlBQVksRUFBRSxLQUFLLENBQUMsQ0FBQztRQUVwQyxrREFBa0Q7UUFDbEQsT0FBTyxHQUFHLGlCQUFpQixDQUFDLFFBQVEsRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxPQUFPLEVBQUUsWUFBWSxFQUFFLFNBQVMsQ0FBQyxDQUFDO1FBRTlGLG1GQUFtRjtRQUNuRixJQUFJLENBQUMsT0FBTyxJQUFJLFNBQVMsQ0FBQyxPQUFPLHlCQUFnQyxFQUFFO1lBQ2pFLElBQU0sS0FBSyxHQUFHLGVBQWUsQ0FBQyxPQUFPLEVBQUUsd0JBQXdCLENBQUMsQ0FBQztZQUNqRSxJQUFNLEdBQUcsR0FBRyxZQUFZLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLGtCQUFrQixDQUFDO1lBQy9FLE9BQU8sR0FBRyxHQUFHLENBQUMsQ0FBQztnQkFDWCxvQkFBb0IsQ0FBQyxRQUFRLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLFlBQVksRUFBRSxTQUFTLENBQUMsQ0FBQyxDQUFDO2dCQUN0RixLQUFLLENBQUM7U0FDWDtRQUVELGlEQUFpRDtRQUNqRCxJQUFJLENBQUMsT0FBTyxJQUFJLFNBQVMsQ0FBQyxPQUFPLDZCQUFtQyxFQUFFO1lBQ3BFLElBQU0sR0FBRyxHQUFHLGtCQUFrQixDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQ3hDLE9BQU87Z0JBQ0gsR0FBRyxDQUFDLENBQUMsQ0FBQyxvQkFBb0IsQ0FBQyxRQUFRLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLFlBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUM7U0FDN0Y7UUFFRCxpREFBaUQ7UUFDakQsSUFBSSxDQUFDLE9BQU8sRUFBRTtZQUNaLE9BQU8sQ0FBQyxRQUFRLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsWUFBWSxDQUFDLENBQUM7U0FDdEQ7S0FDRjtJQUNELE9BQU8sT0FBTyxDQUFDO0FBQ2pCLENBQUM7QUFFRCxTQUFTLGlCQUFpQixDQUN0QixRQUFhLEVBQUUsT0FBaUIsRUFBRSxJQUFZLEVBQUUsS0FBVSxFQUFFLE9BQXVCLEVBQ25GLFlBQW9CLEVBQUUsU0FBa0M7SUFDMUQsSUFBSSxZQUFZLEdBQWdCLGVBQWUsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUN2RCxJQUFJLHFCQUFxQixDQUFDLFlBQVksQ0FBQyxFQUFFO1FBQ3ZDLFlBQVk7WUFDUixTQUFTLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsS0FBSyx1QkFBaUMsQ0FBQyxDQUFDLENBQUMsWUFBWSxDQUFDO1FBQ3RGLE9BQU8sQ0FBQyxRQUFRLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxZQUFZLEVBQUUsWUFBWSxDQUFDLENBQUM7UUFDN0QsT0FBTyxJQUFJLENBQUM7S0FDYjtJQUNELE9BQU8sS0FBSyxDQUFDO0FBQ2YsQ0FBQztBQUVELFNBQVMsb0JBQW9CLENBQ3pCLFFBQWEsRUFBRSxPQUFpQixFQUFFLE9BQXVCLEVBQUUsR0FBb0IsRUFBRSxJQUFZLEVBQzdGLFlBQW9CLEVBQUUsU0FBa0M7SUFDMUQsS0FBSyxJQUFJLENBQUMsOEJBQTJDLEVBQUUsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxNQUFNLEVBQ2hFLENBQUMscUJBQWtDLEVBQUU7UUFDeEMsSUFBTSxDQUFDLEdBQUcsVUFBVSxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUM3QixJQUFJLENBQUMsS0FBSyxJQUFJLEVBQUU7WUFDZCxJQUFJLFlBQVksR0FBRyxXQUFXLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3ZDLFlBQVk7Z0JBQ1IsU0FBUyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLFlBQVksdUJBQWlDLENBQUMsQ0FBQyxDQUFDLFlBQVksQ0FBQztZQUM3RixPQUFPLENBQUMsUUFBUSxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsWUFBWSxFQUFFLFlBQVksQ0FBQyxDQUFDO1lBQzdELE9BQU8sSUFBSSxDQUFDO1NBQ2I7UUFDRCxJQUFJLENBQUMsR0FBRyxJQUFJLEVBQUU7WUFDWixNQUFNO1NBQ1A7S0FDRjtJQUNELE9BQU8sS0FBSyxDQUFDO0FBQ2YsQ0FBQztBQUVELFNBQVMscUJBQXFCLENBQUMsS0FBdUI7SUFDcEQsNkVBQTZFO0lBQzdFLElBQUksS0FBSyxLQUFLLElBQUk7UUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDO0lBRTlCLDZCQUE2QjtJQUM3QixJQUFJLEtBQUssS0FBSyxLQUFLO1FBQUUsT0FBTyxDQUFDLENBQUM7SUFFOUIsa0NBQWtDO0lBQ2xDLE9BQU8sS0FBSyxDQUFDO0FBQ2YsQ0FBQztBQUVELElBQUksd0JBQXdCLEdBQTJCLElBQUksQ0FBQztBQUM1RCxNQUFNLFVBQVUsb0JBQW9CO0lBQ2xDLE9BQU8sd0JBQXdCLENBQUM7QUFDbEMsQ0FBQztBQUVELE1BQU0sVUFBVSxvQkFBb0IsQ0FBQyxFQUFxQjtJQUN4RCx3QkFBd0IsR0FBRyxFQUFFLENBQUM7QUFDaEMsQ0FBQztBQUVEOztHQUVHO0FBQ0gsTUFBTSxDQUFDLElBQU0sUUFBUSxHQUNqQixVQUFDLFFBQTBCLEVBQUUsTUFBZ0IsRUFBRSxJQUFZLEVBQUUsS0FBb0I7SUFDL0UsSUFBSSxRQUFRLEtBQUssSUFBSSxFQUFFO1FBQ3JCLHVGQUF1RjtRQUN2RixJQUFJLHFCQUFxQixDQUFDLEtBQUssQ0FBQyxFQUFFO1lBQ2hDLHNEQUFzRDtZQUN0RCxzREFBc0Q7WUFDdEQsaUNBQWlDO1lBQ2pDLEtBQUssR0FBRyxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUM7WUFDekIsU0FBUyxJQUFJLFNBQVMsQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO1lBQzFDLElBQUksb0JBQW9CLENBQUMsUUFBUSxDQUFDLEVBQUU7Z0JBQ2xDLFFBQVEsQ0FBQyxRQUFRLENBQUMsTUFBTSxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsbUJBQW1CLENBQUMsUUFBUSxDQUFDLENBQUM7YUFDdEU7aUJBQU07Z0JBQ0wsOERBQThEO2dCQUM5RCxvREFBb0Q7Z0JBQ3BELG1EQUFtRDtnQkFDbkQsc0RBQXNEO2dCQUN0RCxJQUFNLFdBQVcsR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFDO2dCQUNqQyxJQUFJLFdBQVcsSUFBSSxJQUFJLEVBQUU7b0JBQ3ZCLFdBQVcsQ0FBQyxXQUFXLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDO2lCQUN0QzthQUNGO1NBQ0Y7YUFBTTtZQUNMLFNBQVMsSUFBSSxTQUFTLENBQUMsbUJBQW1CLEVBQUUsQ0FBQztZQUU3QyxJQUFJLG9CQUFvQixDQUFDLFFBQVEsQ0FBQyxFQUFFO2dCQUNsQyxRQUFRLENBQUMsV0FBVyxDQUFDLE1BQU0sRUFBRSxJQUFJLEVBQUUsbUJBQW1CLENBQUMsUUFBUSxDQUFDLENBQUM7YUFDbEU7aUJBQU07Z0JBQ0wsSUFBTSxXQUFXLEdBQUcsTUFBTSxDQUFDLEtBQUssQ0FBQztnQkFDakMsSUFBSSxXQUFXLElBQUksSUFBSSxFQUFFO29CQUN2QixXQUFXLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxDQUFDO2lCQUNsQzthQUNGO1NBQ0Y7S0FDRjtBQUNILENBQUMsQ0FBQztBQUVOOztHQUVHO0FBQ0gsTUFBTSxDQUFDLElBQU0sUUFBUSxHQUNqQixVQUFDLFFBQTBCLEVBQUUsTUFBZ0IsRUFBRSxTQUFpQixFQUFFLEtBQVU7SUFDMUUsSUFBSSxRQUFRLEtBQUssSUFBSSxJQUFJLFNBQVMsS0FBSyxFQUFFLEVBQUU7UUFDekMsSUFBSSxLQUFLLEVBQUU7WUFDVCxTQUFTLElBQUksU0FBUyxDQUFDLGdCQUFnQixFQUFFLENBQUM7WUFDMUMsSUFBSSxvQkFBb0IsQ0FBQyxRQUFRLENBQUMsRUFBRTtnQkFDbEMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEVBQUUsU0FBUyxDQUFDLENBQUM7YUFDdEM7aUJBQU07Z0JBQ0wsMkRBQTJEO2dCQUMzRCxvREFBb0Q7Z0JBQ3BELG1EQUFtRDtnQkFDbkQsc0RBQXNEO2dCQUN0RCxJQUFNLFNBQVMsR0FBRyxNQUFNLENBQUMsU0FBUyxDQUFDO2dCQUNuQyxJQUFJLFNBQVMsSUFBSSxJQUFJLEVBQUU7b0JBQ3JCLFNBQVMsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUM7aUJBQzFCO2FBQ0Y7U0FDRjthQUFNO1lBQ0wsU0FBUyxJQUFJLFNBQVMsQ0FBQyxtQkFBbUIsRUFBRSxDQUFDO1lBQzdDLElBQUksb0JBQW9CLENBQUMsUUFBUSxDQUFDLEVBQUU7Z0JBQ2xDLFFBQVEsQ0FBQyxXQUFXLENBQUMsTUFBTSxFQUFFLFNBQVMsQ0FBQyxDQUFDO2FBQ3pDO2lCQUFNO2dCQUNMLElBQU0sU0FBUyxHQUFHLE1BQU0sQ0FBQyxTQUFTLENBQUM7Z0JBQ25DLElBQUksU0FBUyxJQUFJLElBQUksRUFBRTtvQkFDckIsU0FBUyxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQztpQkFDN0I7YUFDRjtTQUNGO0tBQ0Y7QUFDSCxDQUFDLENBQUM7QUFFTjs7Ozs7Ozs7R0FRRztBQUNILE1BQU0sVUFBVSxnQkFBZ0IsQ0FDNUIsUUFBbUIsRUFBRSxPQUFpQixFQUFFLGFBQXVELEVBQy9GLFlBQXFCO0lBQ3ZCLElBQU0sYUFBYSxHQUFHLGtCQUFrQixDQUFDLGFBQWEsQ0FBQyxDQUFDO0lBQ3hELElBQUksYUFBYSxFQUFFO1FBQ2pCLEtBQUssSUFBSSxDQUFDLDhCQUEyQyxFQUFFLENBQUMsR0FBRyxhQUFhLENBQUMsTUFBTSxFQUMxRSxDQUFDLHFCQUFrQyxFQUFFO1lBQ3hDLElBQU0sSUFBSSxHQUFHLFVBQVUsQ0FBQyxhQUFhLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDMUMsSUFBTSxLQUFLLEdBQUcsV0FBVyxDQUFDLGFBQWEsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUM1QyxJQUFJLFlBQVksRUFBRTtnQkFDaEIsUUFBUSxDQUFDLFFBQVEsRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxJQUFJLENBQUMsQ0FBQzthQUNoRDtpQkFBTTtnQkFDTCxRQUFRLENBQUMsUUFBUSxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLElBQUksQ0FBQyxDQUFDO2FBQ2hEO1NBQ0Y7S0FDRjtBQUNILENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiogQGxpY2Vuc2VcbiogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4qXG4qIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4qIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiovXG5pbXBvcnQge1NhZmVWYWx1ZSwgdW53cmFwU2FmZVZhbHVlfSBmcm9tICcuLi8uLi9zYW5pdGl6YXRpb24vYnlwYXNzJztcbmltcG9ydCB7U3R5bGVTYW5pdGl6ZUZuLCBTdHlsZVNhbml0aXplTW9kZX0gZnJvbSAnLi4vLi4vc2FuaXRpemF0aW9uL3N0eWxlX3Nhbml0aXplcic7XG5pbXBvcnQge1Byb2NlZHVyYWxSZW5kZXJlcjMsIFJFbGVtZW50LCBSZW5kZXJlcjMsIFJlbmRlcmVyU3R5bGVGbGFnczMsIGlzUHJvY2VkdXJhbFJlbmRlcmVyfSBmcm9tICcuLi9pbnRlcmZhY2VzL3JlbmRlcmVyJztcbmltcG9ydCB7QXBwbHlTdHlsaW5nRm4sIExTdHlsaW5nRGF0YSwgU3R5bGluZ01hcEFycmF5LCBTdHlsaW5nTWFwQXJyYXlJbmRleCwgU3R5bGluZ01hcHNTeW5jTW9kZSwgU3luY1N0eWxpbmdNYXBzRm4sIFRTdHlsaW5nQ29uZmlnLCBUU3R5bGluZ0NvbnRleHQsIFRTdHlsaW5nQ29udGV4dEluZGV4LCBUU3R5bGluZ0NvbnRleHRQcm9wQ29uZmlnRmxhZ3N9IGZyb20gJy4uL2ludGVyZmFjZXMvc3R5bGluZyc7XG5pbXBvcnQge05PX0NIQU5HRX0gZnJvbSAnLi4vdG9rZW5zJztcbmltcG9ydCB7REVGQVVMVF9CSU5ESU5HX0lOREVYLCBERUZBVUxUX0JJTkRJTkdfVkFMVUUsIERFRkFVTFRfR1VBUkRfTUFTS19WQUxVRSwgTUFQX0JBU0VEX0VOVFJZX1BST1BfTkFNRSwgVEVNUExBVEVfRElSRUNUSVZFX0lOREVYLCBnZXRCaW5kaW5nVmFsdWUsIGdldENvbmZpZywgZ2V0RGVmYXVsdFZhbHVlLCBnZXRHdWFyZE1hc2ssIGdldEluaXRpYWxTdHlsaW5nVmFsdWUsIGdldE1hcFByb3AsIGdldE1hcFZhbHVlLCBnZXRQcm9wLCBnZXRQcm9wVmFsdWVzU3RhcnRQb3NpdGlvbiwgZ2V0U3R5bGluZ01hcEFycmF5LCBnZXRUb3RhbFNvdXJjZXMsIGdldFZhbHVlLCBnZXRWYWx1ZXNDb3VudCwgaGFzQ29uZmlnLCBoYXNWYWx1ZUNoYW5nZWQsIGlzQ29udGV4dExvY2tlZCwgaXNIb3N0U3R5bGluZ0FjdGl2ZSwgaXNTYW5pdGl6YXRpb25SZXF1aXJlZCwgaXNTdHlsaW5nVmFsdWVEZWZpbmVkLCBsb2NrQ29udGV4dCwgcGF0Y2hDb25maWcsIHNldERlZmF1bHRWYWx1ZSwgc2V0R3VhcmRNYXNrLCBzZXRNYXBBc0RpcnR5LCBzZXRWYWx1ZX0gZnJvbSAnLi4vdXRpbC9zdHlsaW5nX3V0aWxzJztcblxuaW1wb3J0IHtnZXRTdHlsaW5nU3RhdGUsIHJlc2V0U3R5bGluZ1N0YXRlfSBmcm9tICcuL3N0YXRlJztcblxuXG5cbi8qKlxuICogLS0tLS0tLS1cbiAqXG4gKiBUaGlzIGZpbGUgY29udGFpbnMgdGhlIGNvcmUgbG9naWMgZm9yIHN0eWxpbmcgaW4gQW5ndWxhci5cbiAqXG4gKiBBbGwgc3R5bGluZyBiaW5kaW5ncyAoaS5lLiBgW3N0eWxlXWAsIGBbc3R5bGUucHJvcF1gLCBgW2NsYXNzXWAgYW5kIGBbY2xhc3MubmFtZV1gKVxuICogd2lsbCBoYXZlIHRoZWlyIHZhbHVlcyBiZSBhcHBsaWVkIHRocm91Z2ggdGhlIGxvZ2ljIGluIHRoaXMgZmlsZS5cbiAqXG4gKiBXaGVuIGEgYmluZGluZyBpcyBlbmNvdW50ZXJlZCAoZS5nLiBgPGRpdiBbc3R5bGUud2lkdGhdPVwid1wiPmApIHRoZW5cbiAqIHRoZSBiaW5kaW5nIGRhdGEgd2lsbCBiZSBwb3B1bGF0ZWQgaW50byBhIGBUU3R5bGluZ0NvbnRleHRgIGRhdGEtc3RydWN0dXJlLlxuICogVGhlcmUgaXMgb25seSBvbmUgYFRTdHlsaW5nQ29udGV4dGAgcGVyIGBUTm9kZWAgYW5kIGVhY2ggZWxlbWVudCBpbnN0YW5jZVxuICogd2lsbCB1cGRhdGUgaXRzIHN0eWxlL2NsYXNzIGJpbmRpbmcgdmFsdWVzIGluIGNvbmNlcnQgd2l0aCB0aGUgc3R5bGluZ1xuICogY29udGV4dC5cbiAqXG4gKiBUbyBsZWFybiBtb3JlIGFib3V0IHRoZSBhbGdvcml0aG0gc2VlIGBUU3R5bGluZ0NvbnRleHRgLlxuICpcbiAqIC0tLS0tLS0tXG4gKi9cblxuLyoqXG4gKiBUaGUgZ3VhcmQvdXBkYXRlIG1hc2sgYml0IGluZGV4IGxvY2F0aW9uIGZvciBtYXAtYmFzZWQgYmluZGluZ3MuXG4gKlxuICogQWxsIG1hcC1iYXNlZCBiaW5kaW5ncyAoaS5lLiBgW3N0eWxlXWAgYW5kIGBbY2xhc3NdYCApXG4gKi9cbmNvbnN0IFNUWUxJTkdfSU5ERVhfRk9SX01BUF9CSU5ESU5HID0gMDtcblxuLyoqXG4gKiBWaXNpdHMgYSBjbGFzcy1iYXNlZCBiaW5kaW5nIGFuZCB1cGRhdGVzIHRoZSBuZXcgdmFsdWUgKGlmIGNoYW5nZWQpLlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gaXMgY2FsbGVkIGVhY2ggdGltZSBhIGNsYXNzLWJhc2VkIHN0eWxpbmcgaW5zdHJ1Y3Rpb25cbiAqIGlzIGV4ZWN1dGVkLiBJdCdzIGltcG9ydGFudCB0aGF0IGl0J3MgYWx3YXlzIGNhbGxlZCAoZXZlbiBpZiB0aGUgdmFsdWVcbiAqIGhhcyBub3QgY2hhbmdlZCkgc28gdGhhdCB0aGUgaW5uZXIgY291bnRlciBpbmRleCB2YWx1ZSBpcyBpbmNyZW1lbnRlZC5cbiAqIFRoaXMgd2F5LCBlYWNoIGluc3RydWN0aW9uIGlzIGFsd2F5cyBndWFyYW50ZWVkIHRvIGdldCB0aGUgc2FtZSBjb3VudGVyXG4gKiBzdGF0ZSBlYWNoIHRpbWUgaXQncyBjYWxsZWQgKHdoaWNoIHRoZW4gYWxsb3dzIHRoZSBgVFN0eWxpbmdDb250ZXh0YFxuICogYW5kIHRoZSBiaXQgbWFzayB2YWx1ZXMgdG8gYmUgaW4gc3luYykuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB1cGRhdGVDbGFzc1ZpYUNvbnRleHQoXG4gICAgY29udGV4dDogVFN0eWxpbmdDb250ZXh0LCBkYXRhOiBMU3R5bGluZ0RhdGEsIGVsZW1lbnQ6IFJFbGVtZW50LCBkaXJlY3RpdmVJbmRleDogbnVtYmVyLFxuICAgIHByb3A6IHN0cmluZyB8IG51bGwsIGJpbmRpbmdJbmRleDogbnVtYmVyLFxuICAgIHZhbHVlOiBib29sZWFuIHwgc3RyaW5nIHwgbnVsbCB8IHVuZGVmaW5lZCB8IFN0eWxpbmdNYXBBcnJheSB8IE5PX0NIQU5HRSxcbiAgICBmb3JjZVVwZGF0ZT86IGJvb2xlYW4pOiBib29sZWFuIHtcbiAgY29uc3QgaXNNYXBCYXNlZCA9ICFwcm9wO1xuICBjb25zdCBzdGF0ZSA9IGdldFN0eWxpbmdTdGF0ZShlbGVtZW50LCBkaXJlY3RpdmVJbmRleCk7XG4gIGNvbnN0IGNvdW50SW5kZXggPSBpc01hcEJhc2VkID8gU1RZTElOR19JTkRFWF9GT1JfTUFQX0JJTkRJTkcgOiBzdGF0ZS5jbGFzc2VzSW5kZXgrKztcbiAgaWYgKHZhbHVlICE9PSBOT19DSEFOR0UpIHtcbiAgICBjb25zdCB1cGRhdGVkID0gdXBkYXRlQmluZGluZ0RhdGEoXG4gICAgICAgIGNvbnRleHQsIGRhdGEsIGNvdW50SW5kZXgsIHN0YXRlLnNvdXJjZUluZGV4LCBwcm9wLCBiaW5kaW5nSW5kZXgsIHZhbHVlLCBmb3JjZVVwZGF0ZSxcbiAgICAgICAgZmFsc2UpO1xuICAgIGlmICh1cGRhdGVkIHx8IGZvcmNlVXBkYXRlKSB7XG4gICAgICAvLyBXZSBmbGlwIHRoZSBiaXQgaW4gdGhlIGJpdE1hc2sgdG8gcmVmbGVjdCB0aGF0IHRoZSBiaW5kaW5nXG4gICAgICAvLyBhdCB0aGUgYGluZGV4YCBzbG90IGhhcyBjaGFuZ2VkLiBUaGlzIGlkZW50aWZpZXMgdG8gdGhlIGZsdXNoaW5nXG4gICAgICAvLyBwaGFzZSB0aGF0IHRoZSBiaW5kaW5ncyBmb3IgdGhpcyBwYXJ0aWN1bGFyIENTUyBjbGFzcyBuZWVkIHRvIGJlXG4gICAgICAvLyBhcHBsaWVkIGFnYWluIGJlY2F1c2Ugb24gb3IgbW9yZSBvZiB0aGUgYmluZGluZ3MgZm9yIHRoZSBDU1NcbiAgICAgIC8vIGNsYXNzIGhhdmUgY2hhbmdlZC5cbiAgICAgIHN0YXRlLmNsYXNzZXNCaXRNYXNrIHw9IDEgPDwgY291bnRJbmRleDtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgfVxuICByZXR1cm4gZmFsc2U7XG59XG5cbi8qKlxuICogVmlzaXRzIGEgc3R5bGUtYmFzZWQgYmluZGluZyBhbmQgdXBkYXRlcyB0aGUgbmV3IHZhbHVlIChpZiBjaGFuZ2VkKS5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIGlzIGNhbGxlZCBlYWNoIHRpbWUgYSBzdHlsZS1iYXNlZCBzdHlsaW5nIGluc3RydWN0aW9uXG4gKiBpcyBleGVjdXRlZC4gSXQncyBpbXBvcnRhbnQgdGhhdCBpdCdzIGFsd2F5cyBjYWxsZWQgKGV2ZW4gaWYgdGhlIHZhbHVlXG4gKiBoYXMgbm90IGNoYW5nZWQpIHNvIHRoYXQgdGhlIGlubmVyIGNvdW50ZXIgaW5kZXggdmFsdWUgaXMgaW5jcmVtZW50ZWQuXG4gKiBUaGlzIHdheSwgZWFjaCBpbnN0cnVjdGlvbiBpcyBhbHdheXMgZ3VhcmFudGVlZCB0byBnZXQgdGhlIHNhbWUgY291bnRlclxuICogc3RhdGUgZWFjaCB0aW1lIGl0J3MgY2FsbGVkICh3aGljaCB0aGVuIGFsbG93cyB0aGUgYFRTdHlsaW5nQ29udGV4dGBcbiAqIGFuZCB0aGUgYml0IG1hc2sgdmFsdWVzIHRvIGJlIGluIHN5bmMpLlxuICovXG5leHBvcnQgZnVuY3Rpb24gdXBkYXRlU3R5bGVWaWFDb250ZXh0KFxuICAgIGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCwgZGF0YTogTFN0eWxpbmdEYXRhLCBlbGVtZW50OiBSRWxlbWVudCwgZGlyZWN0aXZlSW5kZXg6IG51bWJlcixcbiAgICBwcm9wOiBzdHJpbmcgfCBudWxsLCBiaW5kaW5nSW5kZXg6IG51bWJlcixcbiAgICB2YWx1ZTogc3RyaW5nIHwgbnVtYmVyIHwgU2FmZVZhbHVlIHwgbnVsbCB8IHVuZGVmaW5lZCB8IFN0eWxpbmdNYXBBcnJheSB8IE5PX0NIQU5HRSxcbiAgICBzYW5pdGl6ZXI6IFN0eWxlU2FuaXRpemVGbiB8IG51bGwsIGZvcmNlVXBkYXRlPzogYm9vbGVhbik6IGJvb2xlYW4ge1xuICBjb25zdCBpc01hcEJhc2VkID0gIXByb3A7XG4gIGNvbnN0IHN0YXRlID0gZ2V0U3R5bGluZ1N0YXRlKGVsZW1lbnQsIGRpcmVjdGl2ZUluZGV4KTtcbiAgY29uc3QgY291bnRJbmRleCA9IGlzTWFwQmFzZWQgPyBTVFlMSU5HX0lOREVYX0ZPUl9NQVBfQklORElORyA6IHN0YXRlLnN0eWxlc0luZGV4Kys7XG4gIGlmICh2YWx1ZSAhPT0gTk9fQ0hBTkdFKSB7XG4gICAgY29uc3Qgc2FuaXRpemF0aW9uUmVxdWlyZWQgPSBpc01hcEJhc2VkID9cbiAgICAgICAgdHJ1ZSA6XG4gICAgICAgIChzYW5pdGl6ZXIgPyBzYW5pdGl6ZXIocHJvcCAhLCBudWxsLCBTdHlsZVNhbml0aXplTW9kZS5WYWxpZGF0ZVByb3BlcnR5KSA6IGZhbHNlKTtcbiAgICBjb25zdCB1cGRhdGVkID0gdXBkYXRlQmluZGluZ0RhdGEoXG4gICAgICAgIGNvbnRleHQsIGRhdGEsIGNvdW50SW5kZXgsIHN0YXRlLnNvdXJjZUluZGV4LCBwcm9wLCBiaW5kaW5nSW5kZXgsIHZhbHVlLCBmb3JjZVVwZGF0ZSxcbiAgICAgICAgc2FuaXRpemF0aW9uUmVxdWlyZWQpO1xuICAgIGlmICh1cGRhdGVkIHx8IGZvcmNlVXBkYXRlKSB7XG4gICAgICAvLyBXZSBmbGlwIHRoZSBiaXQgaW4gdGhlIGJpdE1hc2sgdG8gcmVmbGVjdCB0aGF0IHRoZSBiaW5kaW5nXG4gICAgICAvLyBhdCB0aGUgYGluZGV4YCBzbG90IGhhcyBjaGFuZ2VkLiBUaGlzIGlkZW50aWZpZXMgdG8gdGhlIGZsdXNoaW5nXG4gICAgICAvLyBwaGFzZSB0aGF0IHRoZSBiaW5kaW5ncyBmb3IgdGhpcyBwYXJ0aWN1bGFyIHByb3BlcnR5IG5lZWQgdG8gYmVcbiAgICAgIC8vIGFwcGxpZWQgYWdhaW4gYmVjYXVzZSBvbiBvciBtb3JlIG9mIHRoZSBiaW5kaW5ncyBmb3IgdGhlIENTU1xuICAgICAgLy8gcHJvcGVydHkgaGF2ZSBjaGFuZ2VkLlxuICAgICAgc3RhdGUuc3R5bGVzQml0TWFzayB8PSAxIDw8IGNvdW50SW5kZXg7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG4vKipcbiAqIENhbGxlZCBlYWNoIHRpbWUgYSBiaW5kaW5nIHZhbHVlIGhhcyBjaGFuZ2VkIHdpdGhpbiB0aGUgcHJvdmlkZWQgYFRTdHlsaW5nQ29udGV4dGAuXG4gKlxuICogVGhpcyBmdW5jdGlvbiBpcyBkZXNpZ25lZCB0byBiZSBjYWxsZWQgZnJvbSBgdXBkYXRlU3R5bGVCaW5kaW5nYCBhbmQgYHVwZGF0ZUNsYXNzQmluZGluZ2AuXG4gKiBJZiBjYWxsZWQgZHVyaW5nIHRoZSBmaXJzdCB1cGRhdGUgcGFzcywgdGhlIGJpbmRpbmcgd2lsbCBiZSByZWdpc3RlcmVkIGluIHRoZSBjb250ZXh0LlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gd2lsbCBhbHNvIHVwZGF0ZSBiaW5kaW5nIHNsb3QgaW4gdGhlIHByb3ZpZGVkIGBMU3R5bGluZ0RhdGFgIHdpdGggdGhlXG4gKiBuZXcgYmluZGluZyBlbnRyeSAoaWYgaXQgaGFzIGNoYW5nZWQpLlxuICpcbiAqIEByZXR1cm5zIHdoZXRoZXIgb3Igbm90IHRoZSBiaW5kaW5nIHZhbHVlIHdhcyB1cGRhdGVkIGluIHRoZSBgTFN0eWxpbmdEYXRhYC5cbiAqL1xuZnVuY3Rpb24gdXBkYXRlQmluZGluZ0RhdGEoXG4gICAgY29udGV4dDogVFN0eWxpbmdDb250ZXh0LCBkYXRhOiBMU3R5bGluZ0RhdGEsIGNvdW50ZXJJbmRleDogbnVtYmVyLCBzb3VyY2VJbmRleDogbnVtYmVyLFxuICAgIHByb3A6IHN0cmluZyB8IG51bGwsIGJpbmRpbmdJbmRleDogbnVtYmVyLFxuICAgIHZhbHVlOiBzdHJpbmcgfCBTYWZlVmFsdWUgfCBudW1iZXIgfCBib29sZWFuIHwgbnVsbCB8IHVuZGVmaW5lZCB8IFN0eWxpbmdNYXBBcnJheSxcbiAgICBmb3JjZVVwZGF0ZT86IGJvb2xlYW4sIHNhbml0aXphdGlvblJlcXVpcmVkPzogYm9vbGVhbik6IGJvb2xlYW4ge1xuICBjb25zdCBob3N0QmluZGluZ3NNb2RlID0gaXNIb3N0U3R5bGluZ0FjdGl2ZShzb3VyY2VJbmRleCk7XG4gIGlmICghaXNDb250ZXh0TG9ja2VkKGNvbnRleHQsIGhvc3RCaW5kaW5nc01vZGUpKSB7XG4gICAgLy8gdGhpcyB3aWxsIG9ubHkgaGFwcGVuIGR1cmluZyB0aGUgZmlyc3QgdXBkYXRlIHBhc3Mgb2YgdGhlXG4gICAgLy8gY29udGV4dC4gVGhlIHJlYXNvbiB3aHkgd2UgY2FuJ3QgdXNlIGB0Tm9kZS5maXJzdFRlbXBsYXRlUGFzc2BcbiAgICAvLyBoZXJlIGlzIGJlY2F1c2UgaXRzIG5vdCBndWFyYW50ZWVkIHRvIGJlIHRydWUgd2hlbiB0aGUgZmlyc3RcbiAgICAvLyB1cGRhdGUgcGFzcyBpcyBleGVjdXRlZCAocmVtZW1iZXIgdGhhdCBhbGwgc3R5bGluZyBpbnN0cnVjdGlvbnNcbiAgICAvLyBhcmUgcnVuIGluIHRoZSB1cGRhdGUgcGhhc2UsIGFuZCwgYXMgYSByZXN1bHQsIGFyZSBubyBtb3JlXG4gICAgLy8gc3R5bGluZyBpbnN0cnVjdGlvbnMgdGhhdCBhcmUgcnVuIGluIHRoZSBjcmVhdGlvbiBwaGFzZSkuXG4gICAgcmVnaXN0ZXJCaW5kaW5nKGNvbnRleHQsIGNvdW50ZXJJbmRleCwgc291cmNlSW5kZXgsIHByb3AsIGJpbmRpbmdJbmRleCwgc2FuaXRpemF0aW9uUmVxdWlyZWQpO1xuICAgIHBhdGNoQ29uZmlnKFxuICAgICAgICBjb250ZXh0LFxuICAgICAgICBob3N0QmluZGluZ3NNb2RlID8gVFN0eWxpbmdDb25maWcuSGFzSG9zdEJpbmRpbmdzIDogVFN0eWxpbmdDb25maWcuSGFzVGVtcGxhdGVCaW5kaW5ncyk7XG4gIH1cblxuICBjb25zdCBjaGFuZ2VkID0gZm9yY2VVcGRhdGUgfHwgaGFzVmFsdWVDaGFuZ2VkKGRhdGFbYmluZGluZ0luZGV4XSwgdmFsdWUpO1xuICBpZiAoY2hhbmdlZCkge1xuICAgIHNldFZhbHVlKGRhdGEsIGJpbmRpbmdJbmRleCwgdmFsdWUpO1xuICAgIGNvbnN0IGRvU2V0VmFsdWVzQXNTdGFsZSA9IChnZXRDb25maWcoY29udGV4dCkgJiBUU3R5bGluZ0NvbmZpZy5IYXNIb3N0QmluZGluZ3MpICYmXG4gICAgICAgICFob3N0QmluZGluZ3NNb2RlICYmIChwcm9wID8gIXZhbHVlIDogdHJ1ZSk7XG4gICAgaWYgKGRvU2V0VmFsdWVzQXNTdGFsZSkge1xuICAgICAgcmVuZGVySG9zdEJpbmRpbmdzQXNTdGFsZShjb250ZXh0LCBkYXRhLCBwcm9wKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGNoYW5nZWQ7XG59XG5cbi8qKlxuICogSXRlcmF0ZXMgb3ZlciBhbGwgaG9zdC1iaW5kaW5nIHZhbHVlcyBmb3IgdGhlIGdpdmVuIGBwcm9wYCB2YWx1ZSBpbiB0aGUgY29udGV4dCBhbmQgc2V0cyB0aGVpclxuICogY29ycmVzcG9uZGluZyBiaW5kaW5nIHZhbHVlcyB0byBgbnVsbGAuXG4gKlxuICogV2hlbmV2ZXIgYSB0ZW1wbGF0ZSBiaW5kaW5nIGNoYW5nZXMgaXRzIHZhbHVlIHRvIGBudWxsYCwgYWxsIGhvc3QtYmluZGluZyB2YWx1ZXMgc2hvdWxkIGJlXG4gKiByZS1hcHBsaWVkXG4gKiB0byB0aGUgZWxlbWVudCB3aGVuIHRoZSBob3N0IGJpbmRpbmdzIGFyZSBldmFsdWF0ZWQuIFRoaXMgbWF5IG5vdCBhbHdheXMgaGFwcGVuIGluIHRoZSBldmVudFxuICogdGhhdCBub25lIG9mIHRoZSBiaW5kaW5ncyBjaGFuZ2VkIHdpdGhpbiB0aGUgaG9zdCBiaW5kaW5ncyBjb2RlLiBGb3IgdGhpcyByZWFzb24gdGhpcyBmdW5jdGlvblxuICogaXMgZXhwZWN0ZWQgdG8gYmUgY2FsbGVkIGVhY2ggdGltZSBhIHRlbXBsYXRlIGJpbmRpbmcgYmVjb21lcyBmYWxzeSBvciB3aGVuIGEgbWFwLWJhc2VkIHRlbXBsYXRlXG4gKiBiaW5kaW5nIGNoYW5nZXMuXG4gKi9cbmZ1bmN0aW9uIHJlbmRlckhvc3RCaW5kaW5nc0FzU3RhbGUoXG4gICAgY29udGV4dDogVFN0eWxpbmdDb250ZXh0LCBkYXRhOiBMU3R5bGluZ0RhdGEsIHByb3A6IHN0cmluZyB8IG51bGwpOiB2b2lkIHtcbiAgY29uc3QgdmFsdWVzQ291bnQgPSBnZXRWYWx1ZXNDb3VudChjb250ZXh0KTtcblxuICBpZiAocHJvcCAhPT0gbnVsbCAmJiBoYXNDb25maWcoY29udGV4dCwgVFN0eWxpbmdDb25maWcuSGFzUHJvcEJpbmRpbmdzKSkge1xuICAgIGNvbnN0IGl0ZW1zUGVyUm93ID0gVFN0eWxpbmdDb250ZXh0SW5kZXguQmluZGluZ3NTdGFydE9mZnNldCArIHZhbHVlc0NvdW50O1xuXG4gICAgbGV0IGkgPSBUU3R5bGluZ0NvbnRleHRJbmRleC5WYWx1ZXNTdGFydFBvc2l0aW9uO1xuICAgIGxldCBmb3VuZCA9IGZhbHNlO1xuICAgIHdoaWxlIChpIDwgY29udGV4dC5sZW5ndGgpIHtcbiAgICAgIGlmIChnZXRQcm9wKGNvbnRleHQsIGkpID09PSBwcm9wKSB7XG4gICAgICAgIGZvdW5kID0gdHJ1ZTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBpICs9IGl0ZW1zUGVyUm93O1xuICAgIH1cblxuICAgIGlmIChmb3VuZCkge1xuICAgICAgY29uc3QgYmluZGluZ3NTdGFydCA9IGkgKyBUU3R5bGluZ0NvbnRleHRJbmRleC5CaW5kaW5nc1N0YXJ0T2Zmc2V0O1xuICAgICAgY29uc3QgdmFsdWVzU3RhcnQgPSBiaW5kaW5nc1N0YXJ0ICsgMTsgIC8vIHRoZSBmaXJzdCBjb2x1bW4gaXMgdGVtcGxhdGUgYmluZGluZ3NcbiAgICAgIGNvbnN0IHZhbHVlc0VuZCA9IGJpbmRpbmdzU3RhcnQgKyB2YWx1ZXNDb3VudCAtIDE7XG5cbiAgICAgIGZvciAobGV0IGkgPSB2YWx1ZXNTdGFydDsgaSA8IHZhbHVlc0VuZDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IGJpbmRpbmdJbmRleCA9IGNvbnRleHRbaV0gYXMgbnVtYmVyO1xuICAgICAgICBpZiAoYmluZGluZ0luZGV4ICE9PSAwKSB7XG4gICAgICAgICAgc2V0VmFsdWUoZGF0YSwgYmluZGluZ0luZGV4LCBudWxsKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGlmIChoYXNDb25maWcoY29udGV4dCwgVFN0eWxpbmdDb25maWcuSGFzTWFwQmluZGluZ3MpKSB7XG4gICAgY29uc3QgYmluZGluZ3NTdGFydCA9XG4gICAgICAgIFRTdHlsaW5nQ29udGV4dEluZGV4LlZhbHVlc1N0YXJ0UG9zaXRpb24gKyBUU3R5bGluZ0NvbnRleHRJbmRleC5CaW5kaW5nc1N0YXJ0T2Zmc2V0O1xuICAgIGNvbnN0IHZhbHVlc1N0YXJ0ID0gYmluZGluZ3NTdGFydCArIDE7ICAvLyB0aGUgZmlyc3QgY29sdW1uIGlzIHRlbXBsYXRlIGJpbmRpbmdzXG4gICAgY29uc3QgdmFsdWVzRW5kID0gYmluZGluZ3NTdGFydCArIHZhbHVlc0NvdW50IC0gMTtcbiAgICBmb3IgKGxldCBpID0gdmFsdWVzU3RhcnQ7IGkgPCB2YWx1ZXNFbmQ7IGkrKykge1xuICAgICAgY29uc3Qgc3R5bGluZ01hcCA9IGdldFZhbHVlPFN0eWxpbmdNYXBBcnJheT4oZGF0YSwgY29udGV4dFtpXSBhcyBudW1iZXIpO1xuICAgICAgaWYgKHN0eWxpbmdNYXApIHtcbiAgICAgICAgc2V0TWFwQXNEaXJ0eShzdHlsaW5nTWFwKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBSZWdpc3RlcnMgdGhlIHByb3ZpZGVkIGJpbmRpbmcgKHByb3AgKyBiaW5kaW5nSW5kZXgpIGludG8gdGhlIGNvbnRleHQuXG4gKlxuICogSXQgaXMgbmVlZGVkIGJlY2F1c2UgaXQgd2lsbCBlaXRoZXIgdXBkYXRlIG9yIGluc2VydCBhIHN0eWxpbmcgcHJvcGVydHlcbiAqIGludG8gdGhlIGNvbnRleHQgYXQgdGhlIGNvcnJlY3Qgc3BvdC5cbiAqXG4gKiBXaGVuIGNhbGxlZCwgb25lIG9mIHR3byB0aGluZ3Mgd2lsbCBoYXBwZW46XG4gKlxuICogMSkgSWYgdGhlIHByb3BlcnR5IGFscmVhZHkgZXhpc3RzIGluIHRoZSBjb250ZXh0IHRoZW4gaXQgd2lsbCBqdXN0IGFkZFxuICogICAgdGhlIHByb3ZpZGVkIGBiaW5kaW5nVmFsdWVgIHRvIHRoZSBlbmQgb2YgdGhlIGJpbmRpbmcgc291cmNlcyByZWdpb25cbiAqICAgIGZvciB0aGF0IHBhcnRpY3VsYXIgcHJvcGVydHkuXG4gKlxuICogICAgLSBJZiB0aGUgYmluZGluZyB2YWx1ZSBpcyBhIG51bWJlciB0aGVuIGl0IHdpbGwgYmUgYWRkZWQgYXMgYSBuZXdcbiAqICAgICAgYmluZGluZyBpbmRleCBzb3VyY2UgbmV4dCB0byB0aGUgb3RoZXIgYmluZGluZyBzb3VyY2VzIGZvciB0aGUgcHJvcGVydHkuXG4gKlxuICogICAgLSBPdGhlcndpc2UsIGlmIHRoZSBiaW5kaW5nIHZhbHVlIGlzIGEgc3RyaW5nL2Jvb2xlYW4vbnVsbCB0eXBlIHRoZW4gaXQgd2lsbFxuICogICAgICByZXBsYWNlIHRoZSBkZWZhdWx0IHZhbHVlIGZvciB0aGUgcHJvcGVydHkgaWYgdGhlIGRlZmF1bHQgdmFsdWUgaXMgYG51bGxgLlxuICpcbiAqIDIpIElmIHRoZSBwcm9wZXJ0eSBkb2VzIG5vdCBleGlzdCB0aGVuIGl0IHdpbGwgYmUgaW5zZXJ0ZWQgaW50byB0aGUgY29udGV4dC5cbiAqICAgIFRoZSBzdHlsaW5nIGNvbnRleHQgcmVsaWVzIG9uIGFsbCBwcm9wZXJ0aWVzIGJlaW5nIHN0b3JlZCBpbiBhbHBoYWJldGljYWxcbiAqICAgIG9yZGVyLCBzbyBpdCBrbm93cyBleGFjdGx5IHdoZXJlIHRvIHN0b3JlIGl0LlxuICpcbiAqICAgIFdoZW4gaW5zZXJ0ZWQsIGEgZGVmYXVsdCBgbnVsbGAgdmFsdWUgaXMgY3JlYXRlZCBmb3IgdGhlIHByb3BlcnR5IHdoaWNoIGV4aXN0c1xuICogICAgYXMgdGhlIGRlZmF1bHQgdmFsdWUgZm9yIHRoZSBiaW5kaW5nLiBJZiB0aGUgYmluZGluZ1ZhbHVlIHByb3BlcnR5IGlzIGluc2VydGVkXG4gKiAgICBhbmQgaXQgaXMgZWl0aGVyIGEgc3RyaW5nLCBudW1iZXIgb3IgbnVsbCB2YWx1ZSB0aGVuIHRoYXQgd2lsbCByZXBsYWNlIHRoZSBkZWZhdWx0XG4gKiAgICB2YWx1ZS5cbiAqXG4gKiBOb3RlIHRoYXQgdGhpcyBmdW5jdGlvbiBpcyBhbHNvIHVzZWQgZm9yIG1hcC1iYXNlZCBzdHlsaW5nIGJpbmRpbmdzLiBUaGV5IGFyZSB0cmVhdGVkXG4gKiBtdWNoIHRoZSBzYW1lIGFzIHByb3AtYmFzZWQgYmluZGluZ3MsIGJ1dCwgdGhlaXIgcHJvcGVydHkgbmFtZSB2YWx1ZSBpcyBzZXQgYXMgYFtNQVBdYC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlZ2lzdGVyQmluZGluZyhcbiAgICBjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQsIGNvdW50SWQ6IG51bWJlciwgc291cmNlSW5kZXg6IG51bWJlciwgcHJvcDogc3RyaW5nIHwgbnVsbCxcbiAgICBiaW5kaW5nVmFsdWU6IG51bWJlciB8IG51bGwgfCBzdHJpbmcgfCBib29sZWFuLCBzYW5pdGl6YXRpb25SZXF1aXJlZD86IGJvb2xlYW4pOiB2b2lkIHtcbiAgbGV0IGZvdW5kID0gZmFsc2U7XG4gIHByb3AgPSBwcm9wIHx8IE1BUF9CQVNFRF9FTlRSWV9QUk9QX05BTUU7XG5cbiAgbGV0IHRvdGFsU291cmNlcyA9IGdldFRvdGFsU291cmNlcyhjb250ZXh0KTtcblxuICAvLyBpZiBhIG5ldyBzb3VyY2UgaXMgZGV0ZWN0ZWQgdGhlbiBhIG5ldyBjb2x1bW4gbmVlZHMgdG8gYmUgYWxsb2NhdGVkIGludG9cbiAgLy8gdGhlIHN0eWxpbmcgY29udGV4dC4gVGhlIGNvbHVtbiBpcyBiYXNpY2FsbHkgYSBuZXcgYWxsb2NhdGlvbiBvZiBiaW5kaW5nXG4gIC8vIHNvdXJjZXMgdGhhdCB3aWxsIGJlIGF2YWlsYWJsZSB0byBlYWNoIHByb3BlcnR5LlxuICB3aGlsZSAodG90YWxTb3VyY2VzIDw9IHNvdXJjZUluZGV4KSB7XG4gICAgYWRkTmV3U291cmNlQ29sdW1uKGNvbnRleHQpO1xuICAgIHRvdGFsU291cmNlcysrO1xuICB9XG5cbiAgY29uc3QgaXNCaW5kaW5nSW5kZXhWYWx1ZSA9IHR5cGVvZiBiaW5kaW5nVmFsdWUgPT09ICdudW1iZXInO1xuICBjb25zdCBlbnRyaWVzUGVyUm93ID0gVFN0eWxpbmdDb250ZXh0SW5kZXguQmluZGluZ3NTdGFydE9mZnNldCArIGdldFZhbHVlc0NvdW50KGNvbnRleHQpO1xuICBsZXQgaSA9IFRTdHlsaW5nQ29udGV4dEluZGV4LlZhbHVlc1N0YXJ0UG9zaXRpb247XG5cbiAgLy8gYWxsIHN0eWxlL2NsYXNzIGJpbmRpbmdzIGFyZSBzb3J0ZWQgYnkgcHJvcGVydHkgbmFtZVxuICB3aGlsZSAoaSA8IGNvbnRleHQubGVuZ3RoKSB7XG4gICAgY29uc3QgcCA9IGdldFByb3AoY29udGV4dCwgaSk7XG4gICAgaWYgKHByb3AgPD0gcCkge1xuICAgICAgaWYgKHByb3AgPCBwKSB7XG4gICAgICAgIGFsbG9jYXRlTmV3Q29udGV4dEVudHJ5KGNvbnRleHQsIGksIHByb3AsIHNhbml0aXphdGlvblJlcXVpcmVkKTtcbiAgICAgIH0gZWxzZSBpZiAoaXNCaW5kaW5nSW5kZXhWYWx1ZSkge1xuICAgICAgICBwYXRjaENvbmZpZyhjb250ZXh0LCBUU3R5bGluZ0NvbmZpZy5IYXNDb2xsaXNpb25zKTtcbiAgICAgIH1cbiAgICAgIGFkZEJpbmRpbmdJbnRvQ29udGV4dChjb250ZXh0LCBpLCBiaW5kaW5nVmFsdWUsIGNvdW50SWQsIHNvdXJjZUluZGV4KTtcbiAgICAgIGZvdW5kID0gdHJ1ZTtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgICBpICs9IGVudHJpZXNQZXJSb3c7XG4gIH1cblxuICBpZiAoIWZvdW5kKSB7XG4gICAgYWxsb2NhdGVOZXdDb250ZXh0RW50cnkoY29udGV4dCwgY29udGV4dC5sZW5ndGgsIHByb3AsIHNhbml0aXphdGlvblJlcXVpcmVkKTtcbiAgICBhZGRCaW5kaW5nSW50b0NvbnRleHQoY29udGV4dCwgaSwgYmluZGluZ1ZhbHVlLCBjb3VudElkLCBzb3VyY2VJbmRleCk7XG4gIH1cbn1cblxuLyoqXG4gKiBJbnNlcnRzIGEgbmV3IHJvdyBpbnRvIHRoZSBwcm92aWRlZCBgVFN0eWxpbmdDb250ZXh0YCBhbmQgYXNzaWducyB0aGUgcHJvdmlkZWQgYHByb3BgIHZhbHVlIGFzXG4gKiB0aGUgcHJvcGVydHkgZW50cnkuXG4gKi9cbmZ1bmN0aW9uIGFsbG9jYXRlTmV3Q29udGV4dEVudHJ5KFxuICAgIGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCwgaW5kZXg6IG51bWJlciwgcHJvcDogc3RyaW5nLCBzYW5pdGl6YXRpb25SZXF1aXJlZD86IGJvb2xlYW4pOiB2b2lkIHtcbiAgY29uc3QgY29uZmlnID0gc2FuaXRpemF0aW9uUmVxdWlyZWQgPyBUU3R5bGluZ0NvbnRleHRQcm9wQ29uZmlnRmxhZ3MuU2FuaXRpemF0aW9uUmVxdWlyZWQgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFRTdHlsaW5nQ29udGV4dFByb3BDb25maWdGbGFncy5EZWZhdWx0O1xuICBjb250ZXh0LnNwbGljZShcbiAgICAgIGluZGV4LCAwLFxuICAgICAgY29uZmlnLCAgICAgICAgICAgICAgICAgICAgLy8gMSkgY29uZmlnIHZhbHVlXG4gICAgICBERUZBVUxUX0dVQVJEX01BU0tfVkFMVUUsICAvLyAyKSB0ZW1wbGF0ZSBiaXQgbWFza1xuICAgICAgREVGQVVMVF9HVUFSRF9NQVNLX1ZBTFVFLCAgLy8gMykgaG9zdCBiaW5kaW5ncyBiaXQgbWFza1xuICAgICAgcHJvcCwgICAgICAgICAgICAgICAgICAgICAgLy8gNCkgcHJvcCB2YWx1ZSAoZS5nLiBgd2lkdGhgLCBgbXlDbGFzc2AsIGV0Yy4uLilcbiAgICAgICk7XG5cbiAgaW5kZXggKz0gNDsgIC8vIHRoZSA0IHZhbHVlcyBhYm92ZVxuXG4gIC8vIDUuLi4pIGRlZmF1bHQgYmluZGluZyBpbmRleCBmb3IgdGhlIHRlbXBsYXRlIHZhbHVlXG4gIC8vIGRlcGVuZGluZyBvbiBob3cgbWFueSBzb3VyY2VzIGFscmVhZHkgZXhpc3QgaW4gdGhlIGNvbnRleHQsXG4gIC8vIG11bHRpcGxlIGRlZmF1bHQgaW5kZXggZW50cmllcyBtYXkgbmVlZCB0byBiZSBpbnNlcnRlZCBmb3JcbiAgLy8gdGhlIG5ldyB2YWx1ZSBpbiB0aGUgY29udGV4dC5cbiAgY29uc3QgdG90YWxCaW5kaW5nc1BlckVudHJ5ID0gZ2V0VG90YWxTb3VyY2VzKGNvbnRleHQpO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IHRvdGFsQmluZGluZ3NQZXJFbnRyeTsgaSsrKSB7XG4gICAgY29udGV4dC5zcGxpY2UoaW5kZXgsIDAsIERFRkFVTFRfQklORElOR19JTkRFWCk7XG4gICAgaW5kZXgrKztcbiAgfVxuXG4gIC8vIDYpIGRlZmF1bHQgYmluZGluZyB2YWx1ZSBmb3IgdGhlIG5ldyBlbnRyeVxuICBjb250ZXh0LnNwbGljZShpbmRleCwgMCwgREVGQVVMVF9CSU5ESU5HX1ZBTFVFKTtcbn1cblxuLyoqXG4gKiBJbnNlcnRzIGEgbmV3IGJpbmRpbmcgdmFsdWUgaW50byBhIHN0eWxpbmcgcHJvcGVydHkgdHVwbGUgaW4gdGhlIGBUU3R5bGluZ0NvbnRleHRgLlxuICpcbiAqIEEgYmluZGluZ1ZhbHVlIGlzIGluc2VydGVkIGludG8gYSBjb250ZXh0IGR1cmluZyB0aGUgZmlyc3QgdXBkYXRlIHBhc3NcbiAqIG9mIGEgdGVtcGxhdGUgb3IgaG9zdCBiaW5kaW5ncyBmdW5jdGlvbi4gV2hlbiB0aGlzIG9jY3VycywgdHdvIHRoaW5nc1xuICogaGFwcGVuOlxuICpcbiAqIC0gSWYgdGhlIGJpbmRpbmdWYWx1ZSB2YWx1ZSBpcyBhIG51bWJlciB0aGVuIGl0IGlzIHRyZWF0ZWQgYXMgYSBiaW5kaW5nSW5kZXhcbiAqICAgdmFsdWUgKGEgaW5kZXggaW4gdGhlIGBMVmlld2ApIGFuZCBpdCB3aWxsIGJlIGluc2VydGVkIG5leHQgdG8gdGhlIG90aGVyXG4gKiAgIGJpbmRpbmcgaW5kZXggZW50cmllcy5cbiAqXG4gKiAtIE90aGVyd2lzZSB0aGUgYmluZGluZyB2YWx1ZSB3aWxsIHVwZGF0ZSB0aGUgZGVmYXVsdCB2YWx1ZSBmb3IgdGhlIHByb3BlcnR5XG4gKiAgIGFuZCB0aGlzIHdpbGwgb25seSBoYXBwZW4gaWYgdGhlIGRlZmF1bHQgdmFsdWUgaXMgYG51bGxgLlxuICovXG5mdW5jdGlvbiBhZGRCaW5kaW5nSW50b0NvbnRleHQoXG4gICAgY29udGV4dDogVFN0eWxpbmdDb250ZXh0LCBpbmRleDogbnVtYmVyLCBiaW5kaW5nVmFsdWU6IG51bWJlciB8IHN0cmluZyB8IGJvb2xlYW4gfCBudWxsLFxuICAgIGJpdEluZGV4OiBudW1iZXIsIHNvdXJjZUluZGV4OiBudW1iZXIpIHtcbiAgaWYgKHR5cGVvZiBiaW5kaW5nVmFsdWUgPT09ICdudW1iZXInKSB7XG4gICAgY29uc3QgaG9zdEJpbmRpbmdzTW9kZSA9IGlzSG9zdFN0eWxpbmdBY3RpdmUoc291cmNlSW5kZXgpO1xuICAgIGNvbnN0IGNlbGxJbmRleCA9IGluZGV4ICsgVFN0eWxpbmdDb250ZXh0SW5kZXguQmluZGluZ3NTdGFydE9mZnNldCArIHNvdXJjZUluZGV4O1xuICAgIGNvbnRleHRbY2VsbEluZGV4XSA9IGJpbmRpbmdWYWx1ZTtcbiAgICBjb25zdCB1cGRhdGVkQml0TWFzayA9IGdldEd1YXJkTWFzayhjb250ZXh0LCBpbmRleCwgaG9zdEJpbmRpbmdzTW9kZSkgfCAoMSA8PCBiaXRJbmRleCk7XG4gICAgc2V0R3VhcmRNYXNrKGNvbnRleHQsIGluZGV4LCB1cGRhdGVkQml0TWFzaywgaG9zdEJpbmRpbmdzTW9kZSk7XG4gIH0gZWxzZSBpZiAoYmluZGluZ1ZhbHVlICE9PSBudWxsICYmIGdldERlZmF1bHRWYWx1ZShjb250ZXh0LCBpbmRleCkgPT09IG51bGwpIHtcbiAgICBzZXREZWZhdWx0VmFsdWUoY29udGV4dCwgaW5kZXgsIGJpbmRpbmdWYWx1ZSk7XG4gIH1cbn1cblxuLyoqXG4gKiBSZWdpc3RlcnMgYSBuZXcgY29sdW1uIGludG8gdGhlIHByb3ZpZGVkIGBUU3R5bGluZ0NvbnRleHRgLlxuICpcbiAqIElmIGFuZCB3aGVuIGEgbmV3IHNvdXJjZSBpcyBkZXRlY3RlZCB0aGVuIGEgbmV3IGNvbHVtbiBuZWVkcyB0b1xuICogYmUgYWxsb2NhdGVkIGludG8gdGhlIHN0eWxpbmcgY29udGV4dC4gVGhlIGNvbHVtbiBpcyBiYXNpY2FsbHlcbiAqIGEgbmV3IGFsbG9jYXRpb24gb2YgYmluZGluZyBzb3VyY2VzIHRoYXQgd2lsbCBiZSBhdmFpbGFibGUgdG8gZWFjaFxuICogcHJvcGVydHkuXG4gKlxuICogRWFjaCBjb2x1bW4gdGhhdCBleGlzdHMgaW4gdGhlIHN0eWxpbmcgY29udGV4dCByZXNlbWJsZXMgYSBzdHlsaW5nXG4gKiBzb3VyY2UuIEEgc3R5bGluZyBzb3VyY2UgYW4gZWl0aGVyIGJlIHRoZSB0ZW1wbGF0ZSBvciBvbmUgb3IgbW9yZVxuICogY29tcG9uZW50cyBvciBkaXJlY3RpdmVzIGFsbCBjb250YWluaW5nIHN0eWxpbmcgaG9zdCBiaW5kaW5ncy5cbiAqL1xuZnVuY3Rpb24gYWRkTmV3U291cmNlQ29sdW1uKGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCk6IHZvaWQge1xuICAvLyB3ZSB1c2UgLTEgaGVyZSBiZWNhdXNlIHdlIHdhbnQgdG8gaW5zZXJ0IHJpZ2h0IGJlZm9yZSB0aGUgbGFzdCB2YWx1ZSAodGhlIGRlZmF1bHQgdmFsdWUpXG4gIGNvbnN0IGluc2VydE9mZnNldCA9IFRTdHlsaW5nQ29udGV4dEluZGV4LkJpbmRpbmdzU3RhcnRPZmZzZXQgKyBnZXRWYWx1ZXNDb3VudChjb250ZXh0KSAtIDE7XG5cbiAgbGV0IGluZGV4ID0gVFN0eWxpbmdDb250ZXh0SW5kZXguVmFsdWVzU3RhcnRQb3NpdGlvbjtcbiAgd2hpbGUgKGluZGV4IDwgY29udGV4dC5sZW5ndGgpIHtcbiAgICBpbmRleCArPSBpbnNlcnRPZmZzZXQ7XG4gICAgY29udGV4dC5zcGxpY2UoaW5kZXgrKywgMCwgREVGQVVMVF9CSU5ESU5HX0lOREVYKTtcblxuICAgIC8vIHRoZSB2YWx1ZSB3YXMgaW5zZXJ0ZWQganVzdCBiZWZvcmUgdGhlIGRlZmF1bHQgdmFsdWUsIGJ1dCB0aGVcbiAgICAvLyBuZXh0IGVudHJ5IGluIHRoZSBjb250ZXh0IHN0YXJ0cyBqdXN0IGFmdGVyIGl0LiBUaGVyZWZvcmUrKy5cbiAgICBpbmRleCsrO1xuICB9XG4gIGNvbnRleHRbVFN0eWxpbmdDb250ZXh0SW5kZXguVG90YWxTb3VyY2VzUG9zaXRpb25dKys7XG59XG5cbi8qKlxuICogQXBwbGllcyBhbGwgcGVuZGluZyBzdHlsZSBhbmQgY2xhc3MgYmluZGluZ3MgdG8gdGhlIHByb3ZpZGVkIGVsZW1lbnQuXG4gKlxuICogVGhpcyBmdW5jdGlvbiB3aWxsIGF0dGVtcHQgdG8gZmx1c2ggc3R5bGluZyB2aWEgdGhlIHByb3ZpZGVkIGBjbGFzc2VzQ29udGV4dGBcbiAqIGFuZCBgc3R5bGVzQ29udGV4dGAgY29udGV4dCB2YWx1ZXMuIFRoaXMgZnVuY3Rpb24gaXMgZGVzaWduZWQgdG8gYmUgcnVuIGZyb21cbiAqIHRoZSBpbnRlcm5hbCBgc3R5bGluZ0FwcGx5YCBmdW5jdGlvbiAod2hpY2ggaXMgc2NoZWR1bGVkIHRvIHJ1biBhdCB0aGUgdmVyeVxuICogZW5kIG9mIGNoYW5nZSBkZXRlY3Rpb24gZm9yIGFuIGVsZW1lbnQgaWYgb25lIG9yIG1vcmUgc3R5bGUvY2xhc3MgYmluZGluZ3NcbiAqIHdlcmUgcHJvY2Vzc2VkKSBhbmQgd2lsbCByZWx5IG9uIGFueSBzdGF0ZSB2YWx1ZXMgdGhhdCBhcmUgc2V0IGZyb20gd2hlblxuICogYW55IG9mIHRoZSBzdHlsaW5nIGJpbmRpbmdzIGV4ZWN1dGVkLlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gaXMgZGVzaWduZWQgdG8gYmUgY2FsbGVkIHR3aWNlOiBvbmUgd2hlbiBjaGFuZ2UgZGV0ZWN0aW9uIGhhc1xuICogcHJvY2Vzc2VkIGFuIGVsZW1lbnQgd2l0aGluIHRoZSB0ZW1wbGF0ZSBiaW5kaW5ncyAoaS5lLiBqdXN0IGFzIGBhZHZhbmNlKClgXG4gKiBpcyBjYWxsZWQpIGFuZCB3aGVuIGhvc3QgYmluZGluZ3MgaGF2ZSBiZWVuIHByb2Nlc3NlZC4gSW4gYm90aCBjYXNlcyB0aGVcbiAqIHN0eWxlcyBhbmQgY2xhc3NlcyBpbiBib3RoIGNvbnRleHRzIHdpbGwgYmUgYXBwbGllZCB0byB0aGUgZWxlbWVudCwgYnV0IHRoZVxuICogYWxnb3JpdGhtIHdpbGwgc2VsZWN0aXZlbHkgZGVjaWRlIHdoaWNoIGJpbmRpbmdzIHRvIHJ1biBkZXBlbmRpbmcgb24gdGhlXG4gKiBjb2x1bW5zIGluIHRoZSBjb250ZXh0LiBUaGUgcHJvdmlkZWQgYGRpcmVjdGl2ZUluZGV4YCB2YWx1ZSB3aWxsIGhlbHAgdGhlXG4gKiBhbGdvcml0aG0gZGV0ZXJtaW5lIHdoaWNoIGJpbmRpbmdzIHRvIGFwcGx5OiBlaXRoZXIgdGhlIHRlbXBsYXRlIGJpbmRpbmdzIG9yXG4gKiB0aGUgaG9zdCBiaW5kaW5ncyAoc2VlIGBhcHBseVN0eWxpbmdUb0VsZW1lbnRgIGZvciBtb3JlIGluZm9ybWF0aW9uKS5cbiAqXG4gKiBOb3RlIHRoYXQgb25jZSB0aGlzIGZ1bmN0aW9uIGlzIGNhbGxlZCBhbGwgdGVtcG9yYXJ5IHN0eWxpbmcgc3RhdGUgZGF0YVxuICogKGkuZS4gdGhlIGBiaXRNYXNrYCBhbmQgYGNvdW50ZXJgIHZhbHVlcyBmb3Igc3R5bGVzIGFuZCBjbGFzc2VzIHdpbGwgYmUgY2xlYXJlZCkuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBmbHVzaFN0eWxpbmcoXG4gICAgcmVuZGVyZXI6IFJlbmRlcmVyMyB8IFByb2NlZHVyYWxSZW5kZXJlcjMgfCBudWxsLCBkYXRhOiBMU3R5bGluZ0RhdGEsXG4gICAgY2xhc3Nlc0NvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCB8IG51bGwsIHN0eWxlc0NvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCB8IG51bGwsXG4gICAgZWxlbWVudDogUkVsZW1lbnQsIGRpcmVjdGl2ZUluZGV4OiBudW1iZXIsIHN0eWxlU2FuaXRpemVyOiBTdHlsZVNhbml0aXplRm4gfCBudWxsKTogdm9pZCB7XG4gIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUuZmx1c2hTdHlsaW5nKys7XG5cbiAgY29uc3Qgc3RhdGUgPSBnZXRTdHlsaW5nU3RhdGUoZWxlbWVudCwgZGlyZWN0aXZlSW5kZXgpO1xuICBjb25zdCBob3N0QmluZGluZ3NNb2RlID0gaXNIb3N0U3R5bGluZ0FjdGl2ZShzdGF0ZS5zb3VyY2VJbmRleCk7XG5cbiAgaWYgKHN0eWxlc0NvbnRleHQpIHtcbiAgICBpZiAoIWlzQ29udGV4dExvY2tlZChzdHlsZXNDb250ZXh0LCBob3N0QmluZGluZ3NNb2RlKSkge1xuICAgICAgbG9ja0FuZEZpbmFsaXplQ29udGV4dChzdHlsZXNDb250ZXh0LCBob3N0QmluZGluZ3NNb2RlKTtcbiAgICB9XG4gICAgaWYgKHN0YXRlLnN0eWxlc0JpdE1hc2sgIT09IDApIHtcbiAgICAgIGFwcGx5U3R5bGluZ1ZpYUNvbnRleHQoXG4gICAgICAgICAgc3R5bGVzQ29udGV4dCwgcmVuZGVyZXIsIGVsZW1lbnQsIGRhdGEsIHN0YXRlLnN0eWxlc0JpdE1hc2ssIHNldFN0eWxlLCBzdHlsZVNhbml0aXplcixcbiAgICAgICAgICBob3N0QmluZGluZ3NNb2RlKTtcbiAgICB9XG4gIH1cblxuICBpZiAoY2xhc3Nlc0NvbnRleHQpIHtcbiAgICBpZiAoIWlzQ29udGV4dExvY2tlZChjbGFzc2VzQ29udGV4dCwgaG9zdEJpbmRpbmdzTW9kZSkpIHtcbiAgICAgIGxvY2tBbmRGaW5hbGl6ZUNvbnRleHQoY2xhc3Nlc0NvbnRleHQsIGhvc3RCaW5kaW5nc01vZGUpO1xuICAgIH1cbiAgICBpZiAoc3RhdGUuY2xhc3Nlc0JpdE1hc2sgIT09IDApIHtcbiAgICAgIGFwcGx5U3R5bGluZ1ZpYUNvbnRleHQoXG4gICAgICAgICAgY2xhc3Nlc0NvbnRleHQsIHJlbmRlcmVyLCBlbGVtZW50LCBkYXRhLCBzdGF0ZS5jbGFzc2VzQml0TWFzaywgc2V0Q2xhc3MsIG51bGwsXG4gICAgICAgICAgaG9zdEJpbmRpbmdzTW9kZSk7XG4gICAgfVxuICB9XG5cbiAgcmVzZXRTdHlsaW5nU3RhdGUoKTtcbn1cblxuLyoqXG4gKiBMb2NrcyB0aGUgY29udGV4dCAoc28gbm8gbW9yZSBiaW5kaW5ncyBjYW4gYmUgYWRkZWQpIGFuZCBhbHNvIGNvcGllcyBvdmVyIGluaXRpYWwgY2xhc3Mvc3R5bGVcbiAqIHZhbHVlcyBpbnRvIHRoZWlyIGJpbmRpbmcgYXJlYXMuXG4gKlxuICogVGhlcmUgYXJlIHR3byBtYWluIGFjdGlvbnMgdGhhdCB0YWtlIHBsYWNlIGluIHRoaXMgZnVuY3Rpb246XG4gKlxuICogLSBMb2NraW5nIHRoZSBjb250ZXh0OlxuICogICBMb2NraW5nIHRoZSBjb250ZXh0IGlzIHJlcXVpcmVkIHNvIHRoYXQgdGhlIHN0eWxlL2NsYXNzIGluc3RydWN0aW9ucyBrbm93IE5PVCB0b1xuICogICByZWdpc3RlciBhIGJpbmRpbmcgYWdhaW4gYWZ0ZXIgdGhlIGZpcnN0IHVwZGF0ZSBwYXNzIGhhcyBydW4uIElmIGEgbG9ja2luZyBiaXQgd2FzXG4gKiAgIG5vdCB1c2VkIHRoZW4gaXQgd291bGQgbmVlZCB0byBzY2FuIG92ZXIgdGhlIGNvbnRleHQgZWFjaCB0aW1lIGFuIGluc3RydWN0aW9uIGlzIHJ1blxuICogICAod2hpY2ggaXMgZXhwZW5zaXZlKS5cbiAqXG4gKiAtIFBhdGNoaW5nIGluaXRpYWwgdmFsdWVzOlxuICogICBEaXJlY3RpdmVzIGFuZCBjb21wb25lbnQgaG9zdCBiaW5kaW5ncyBtYXkgaW5jbHVkZSBzdGF0aWMgY2xhc3Mvc3R5bGUgdmFsdWVzIHdoaWNoIGFyZVxuICogICBib3VuZCB0byB0aGUgaG9zdCBlbGVtZW50LiBXaGVuIHRoaXMgaGFwcGVucywgdGhlIHN0eWxpbmcgY29udGV4dCB3aWxsIG5lZWQgdG8gYmUgaW5mb3JtZWRcbiAqICAgc28gaXQgY2FuIHVzZSB0aGVzZSBzdGF0aWMgc3R5bGluZyB2YWx1ZXMgYXMgZGVmYXVsdHMgd2hlbiBhIG1hdGNoaW5nIGJpbmRpbmcgaXMgZmFsc3kuXG4gKiAgIFRoZXNlIGluaXRpYWwgc3R5bGluZyB2YWx1ZXMgYXJlIHJlYWQgZnJvbSB0aGUgaW5pdGlhbCBzdHlsaW5nIHZhbHVlcyBzbG90IHdpdGhpbiB0aGVcbiAqICAgcHJvdmlkZWQgYFRTdHlsaW5nQ29udGV4dGAgKHdoaWNoIGlzIGFuIGluc3RhbmNlIG9mIGEgYFN0eWxpbmdNYXBBcnJheWApLiBUaGlzIGlubmVyIG1hcCB3aWxsXG4gKiAgIGJlIHVwZGF0ZWQgZWFjaCB0aW1lIGEgaG9zdCBiaW5kaW5nIGFwcGxpZXMgaXRzIHN0YXRpYyBzdHlsaW5nIHZhbHVlcyAodmlhIGBlbGVtZW50SG9zdEF0dHJzYClcbiAqICAgc28gdGhlc2UgdmFsdWVzIGFyZSBvbmx5IHJlYWQgYXQgdGhpcyBwb2ludCBiZWNhdXNlIHRoaXMgaXMgdGhlIHZlcnkgbGFzdCBwb2ludCBiZWZvcmUgdGhlXG4gKiAgIGZpcnN0IHN0eWxlL2NsYXNzIHZhbHVlcyBhcmUgZmx1c2hlZCB0byB0aGUgZWxlbWVudC5cbiAqXG4gKiBOb3RlIHRoYXQgdGhlIGBUU3R5bGluZ0NvbnRleHRgIHN0eWxpbmcgY29udGV4dCBjb250YWlucyB0d28gbG9ja3M6IG9uZSBmb3IgdGVtcGxhdGUgYmluZGluZ3NcbiAqIGFuZCBhbm90aGVyIGZvciBob3N0IGJpbmRpbmdzLiBFaXRoZXIgb25lIG9mIHRoZXNlIGxvY2tzIHdpbGwgYmUgc2V0IHdoZW4gc3R5bGluZyBpcyBhcHBsaWVkXG4gKiBkdXJpbmcgdGhlIHRlbXBsYXRlIGJpbmRpbmcgZmx1c2ggYW5kL29yIGR1cmluZyB0aGUgaG9zdCBiaW5kaW5ncyBmbHVzaC5cbiAqL1xuZnVuY3Rpb24gbG9ja0FuZEZpbmFsaXplQ29udGV4dChjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQsIGhvc3RCaW5kaW5nc01vZGU6IGJvb2xlYW4pOiB2b2lkIHtcbiAgY29uc3QgaW5pdGlhbFZhbHVlcyA9IGdldFN0eWxpbmdNYXBBcnJheShjb250ZXh0KSAhO1xuICB1cGRhdGVJbml0aWFsU3R5bGluZ09uQ29udGV4dChjb250ZXh0LCBpbml0aWFsVmFsdWVzKTtcbiAgbG9ja0NvbnRleHQoY29udGV4dCwgaG9zdEJpbmRpbmdzTW9kZSk7XG59XG5cbi8qKlxuICogUmVnaXN0ZXJzIGFsbCBpbml0aWFsIHN0eWxpbmcgZW50cmllcyBpbnRvIHRoZSBwcm92aWRlZCBjb250ZXh0LlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gd2lsbCBpdGVyYXRlIG92ZXIgYWxsIGVudHJpZXMgaW4gdGhlIHByb3ZpZGVkIGBpbml0aWFsU3R5bGluZ2AgYXJ9cmF5IGFuZCByZWdpc3RlclxuICogdGhlbSBhcyBkZWZhdWx0IChpbml0aWFsKSB2YWx1ZXMgaW4gdGhlIHByb3ZpZGVkIGNvbnRleHQuIEluaXRpYWwgc3R5bGluZyB2YWx1ZXMgaW4gYSBjb250ZXh0IGFyZVxuICogdGhlIGRlZmF1bHQgdmFsdWVzIHRoYXQgYXJlIHRvIGJlIGFwcGxpZWQgdW5sZXNzIG92ZXJ3cml0dGVuIGJ5IGEgYmluZGluZy5cbiAqXG4gKiBUaGUgcmVhc29uIHdoeSB0aGlzIGZ1bmN0aW9uIGV4aXN0cyBhbmQgaXNuJ3QgYSBwYXJ0IG9mIHRoZSBjb250ZXh0IGNvbnN0cnVjdGlvbiBpcyBiZWNhdXNlXG4gKiBob3N0IGJpbmRpbmcgaXMgZXZhbHVhdGVkIGF0IGEgbGF0ZXIgc3RhZ2UgYWZ0ZXIgdGhlIGVsZW1lbnQgaXMgY3JlYXRlZC4gVGhpcyBtZWFucyB0aGF0XG4gKiBpZiBhIGRpcmVjdGl2ZSBvciBjb21wb25lbnQgY29udGFpbnMgYW55IGluaXRpYWwgc3R5bGluZyBjb2RlIChpLmUuIGA8ZGl2IGNsYXNzPVwiZm9vXCI+YClcbiAqIHRoZW4gdGhhdCBpbml0aWFsIHN0eWxpbmcgZGF0YSBjYW4gb25seSBiZSBhcHBsaWVkIG9uY2UgdGhlIHN0eWxpbmcgZm9yIHRoYXQgZWxlbWVudFxuICogaXMgZmlyc3QgYXBwbGllZCAoYXQgdGhlIGVuZCBvZiB0aGUgdXBkYXRlIHBoYXNlKS4gT25jZSB0aGF0IGhhcHBlbnMgdGhlbiB0aGUgY29udGV4dCB3aWxsXG4gKiB1cGRhdGUgaXRzZWxmIHdpdGggdGhlIGNvbXBsZXRlIGluaXRpYWwgc3R5bGluZyBmb3IgdGhlIGVsZW1lbnQuXG4gKi9cbmZ1bmN0aW9uIHVwZGF0ZUluaXRpYWxTdHlsaW5nT25Db250ZXh0KFxuICAgIGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCwgaW5pdGlhbFN0eWxpbmc6IFN0eWxpbmdNYXBBcnJheSk6IHZvaWQge1xuICAvLyBgLTFgIGlzIHVzZWQgaGVyZSBiZWNhdXNlIGFsbCBpbml0aWFsIHN0eWxpbmcgZGF0YSBpcyBub3QgYSBhcGFydFxuICAvLyBvZiBhIGJpbmRpbmcgKHNpbmNlIGl0J3Mgc3RhdGljKVxuICBjb25zdCBDT1VOVF9JRF9GT1JfU1RZTElORyA9IC0xO1xuXG4gIGxldCBoYXNJbml0aWFsU3R5bGluZyA9IGZhbHNlO1xuICBmb3IgKGxldCBpID0gU3R5bGluZ01hcEFycmF5SW5kZXguVmFsdWVzU3RhcnRQb3NpdGlvbjsgaSA8IGluaXRpYWxTdHlsaW5nLmxlbmd0aDtcbiAgICAgICBpICs9IFN0eWxpbmdNYXBBcnJheUluZGV4LlR1cGxlU2l6ZSkge1xuICAgIGNvbnN0IHZhbHVlID0gZ2V0TWFwVmFsdWUoaW5pdGlhbFN0eWxpbmcsIGkpO1xuICAgIGlmICh2YWx1ZSkge1xuICAgICAgY29uc3QgcHJvcCA9IGdldE1hcFByb3AoaW5pdGlhbFN0eWxpbmcsIGkpO1xuICAgICAgcmVnaXN0ZXJCaW5kaW5nKGNvbnRleHQsIENPVU5UX0lEX0ZPUl9TVFlMSU5HLCAwLCBwcm9wLCB2YWx1ZSwgZmFsc2UpO1xuICAgICAgaGFzSW5pdGlhbFN0eWxpbmcgPSB0cnVlO1xuICAgIH1cbiAgfVxuXG4gIGlmIChoYXNJbml0aWFsU3R5bGluZykge1xuICAgIHBhdGNoQ29uZmlnKGNvbnRleHQsIFRTdHlsaW5nQ29uZmlnLkhhc0luaXRpYWxTdHlsaW5nKTtcbiAgfVxufVxuXG4vKipcbiAqIFJ1bnMgdGhyb3VnaCB0aGUgcHJvdmlkZWQgc3R5bGluZyBjb250ZXh0IGFuZCBhcHBsaWVzIGVhY2ggdmFsdWUgdG9cbiAqIHRoZSBwcm92aWRlZCBlbGVtZW50ICh2aWEgdGhlIHJlbmRlcmVyKSBpZiBvbmUgb3IgbW9yZSB2YWx1ZXMgYXJlIHByZXNlbnQuXG4gKlxuICogVGhpcyBmdW5jdGlvbiB3aWxsIGl0ZXJhdGUgb3ZlciBhbGwgZW50cmllcyBwcmVzZW50IGluIHRoZSBwcm92aWRlZFxuICogYFRTdHlsaW5nQ29udGV4dGAgYXJyYXkgKGJvdGggcHJvcC1iYXNlZCBhbmQgbWFwLWJhc2VkIGJpbmRpbmdzKS4tXG4gKlxuICogRWFjaCBlbnRyeSwgd2l0aGluIHRoZSBgVFN0eWxpbmdDb250ZXh0YCBhcnJheSwgaXMgc3RvcmVkIGFscGhhYmV0aWNhbGx5XG4gKiBhbmQgdGhpcyBtZWFucyB0aGF0IGVhY2ggcHJvcC92YWx1ZSBlbnRyeSB3aWxsIGJlIGFwcGxpZWQgaW4gb3JkZXJcbiAqIChzbyBsb25nIGFzIGl0IGlzIG1hcmtlZCBkaXJ0eSBpbiB0aGUgcHJvdmlkZWQgYGJpdE1hc2tgIHZhbHVlKS5cbiAqXG4gKiBJZiB0aGVyZSBhcmUgYW55IG1hcC1iYXNlZCBlbnRyaWVzIHByZXNlbnQgKHdoaWNoIGFyZSBhcHBsaWVkIHRvIHRoZVxuICogZWxlbWVudCB2aWEgdGhlIGBbc3R5bGVdYCBhbmQgYFtjbGFzc11gIGJpbmRpbmdzKSB0aGVuIHRob3NlIGVudHJpZXNcbiAqIHdpbGwgYmUgYXBwbGllZCBhcyB3ZWxsLiBIb3dldmVyLCB0aGUgY29kZSBmb3IgdGhhdCBpcyBub3QgYSBwYXJ0IG9mXG4gKiB0aGlzIGZ1bmN0aW9uLiBJbnN0ZWFkLCBlYWNoIHRpbWUgYSBwcm9wZXJ0eSBpcyB2aXNpdGVkLCB0aGVuIHRoZVxuICogY29kZSBiZWxvdyB3aWxsIGNhbGwgYW4gZXh0ZXJuYWwgZnVuY3Rpb24gY2FsbGVkIGBzdHlsaW5nTWFwc1N5bmNGbmBcbiAqIGFuZCwgaWYgcHJlc2VudCwgaXQgd2lsbCBrZWVwIHRoZSBhcHBsaWNhdGlvbiBvZiBzdHlsaW5nIHZhbHVlcyBpblxuICogbWFwLWJhc2VkIGJpbmRpbmdzIHVwIHRvIHN5bmMgd2l0aCB0aGUgYXBwbGljYXRpb24gb2YgcHJvcC1iYXNlZFxuICogYmluZGluZ3MuXG4gKlxuICogVmlzaXQgYHN0eWxpbmcvbWFwX2Jhc2VkX2JpbmRpbmdzLnRzYCB0byBsZWFybiBtb3JlIGFib3V0IGhvdyB0aGVcbiAqIGFsZ29yaXRobSB3b3JrcyBmb3IgbWFwLWJhc2VkIHN0eWxpbmcgYmluZGluZ3MuXG4gKlxuICogTm90ZSB0aGF0IHRoaXMgZnVuY3Rpb24gaXMgbm90IGRlc2lnbmVkIHRvIGJlIGNhbGxlZCBpbiBpc29sYXRpb24gKHVzZVxuICogdGhlIGBmbHVzaFN0eWxpbmdgIGZ1bmN0aW9uIHNvIHRoYXQgaXQgY2FuIGNhbGwgdGhpcyBmdW5jdGlvbiBmb3IgYm90aFxuICogdGhlIHN0eWxlcyBhbmQgY2xhc3NlcyBjb250ZXh0cykuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhcHBseVN0eWxpbmdWaWFDb250ZXh0KFxuICAgIGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCwgcmVuZGVyZXI6IFJlbmRlcmVyMyB8IFByb2NlZHVyYWxSZW5kZXJlcjMgfCBudWxsLCBlbGVtZW50OiBSRWxlbWVudCxcbiAgICBiaW5kaW5nRGF0YTogTFN0eWxpbmdEYXRhLCBiaXRNYXNrVmFsdWU6IG51bWJlciB8IGJvb2xlYW4sIGFwcGx5U3R5bGluZ0ZuOiBBcHBseVN0eWxpbmdGbixcbiAgICBzYW5pdGl6ZXI6IFN0eWxlU2FuaXRpemVGbiB8IG51bGwsIGhvc3RCaW5kaW5nc01vZGU6IGJvb2xlYW4pOiB2b2lkIHtcbiAgY29uc3QgYml0TWFzayA9IG5vcm1hbGl6ZUJpdE1hc2tWYWx1ZShiaXRNYXNrVmFsdWUpO1xuXG4gIGxldCBzdHlsaW5nTWFwc1N5bmNGbjogU3luY1N0eWxpbmdNYXBzRm58bnVsbCA9IG51bGw7XG4gIGxldCBhcHBseUFsbFZhbHVlcyA9IGZhbHNlO1xuICBpZiAoaGFzQ29uZmlnKGNvbnRleHQsIFRTdHlsaW5nQ29uZmlnLkhhc01hcEJpbmRpbmdzKSkge1xuICAgIHN0eWxpbmdNYXBzU3luY0ZuID0gZ2V0U3R5bGluZ01hcHNTeW5jRm4oKTtcbiAgICBjb25zdCBtYXBzR3VhcmRNYXNrID1cbiAgICAgICAgZ2V0R3VhcmRNYXNrKGNvbnRleHQsIFRTdHlsaW5nQ29udGV4dEluZGV4LlZhbHVlc1N0YXJ0UG9zaXRpb24sIGhvc3RCaW5kaW5nc01vZGUpO1xuICAgIGFwcGx5QWxsVmFsdWVzID0gKGJpdE1hc2sgJiBtYXBzR3VhcmRNYXNrKSAhPT0gMDtcbiAgfVxuXG4gIGNvbnN0IHZhbHVlc0NvdW50ID0gZ2V0VmFsdWVzQ291bnQoY29udGV4dCk7XG4gIGxldCB0b3RhbEJpbmRpbmdzVG9WaXNpdCA9IDE7XG4gIGxldCBtYXBzTW9kZSA9XG4gICAgICBhcHBseUFsbFZhbHVlcyA/IFN0eWxpbmdNYXBzU3luY01vZGUuQXBwbHlBbGxWYWx1ZXMgOiBTdHlsaW5nTWFwc1N5bmNNb2RlLlRyYXZlcnNlVmFsdWVzO1xuICBpZiAoaG9zdEJpbmRpbmdzTW9kZSkge1xuICAgIG1hcHNNb2RlIHw9IFN0eWxpbmdNYXBzU3luY01vZGUuUmVjdXJzZUlubmVyTWFwcztcbiAgICB0b3RhbEJpbmRpbmdzVG9WaXNpdCA9IHZhbHVlc0NvdW50IC0gMTtcbiAgfVxuXG4gIGxldCBpID0gZ2V0UHJvcFZhbHVlc1N0YXJ0UG9zaXRpb24oY29udGV4dCk7XG4gIHdoaWxlIChpIDwgY29udGV4dC5sZW5ndGgpIHtcbiAgICBjb25zdCBndWFyZE1hc2sgPSBnZXRHdWFyZE1hc2soY29udGV4dCwgaSwgaG9zdEJpbmRpbmdzTW9kZSk7XG4gICAgaWYgKGJpdE1hc2sgJiBndWFyZE1hc2spIHtcbiAgICAgIGxldCB2YWx1ZUFwcGxpZWQgPSBmYWxzZTtcbiAgICAgIGNvbnN0IHByb3AgPSBnZXRQcm9wKGNvbnRleHQsIGkpO1xuICAgICAgY29uc3QgZGVmYXVsdFZhbHVlID0gZ2V0RGVmYXVsdFZhbHVlKGNvbnRleHQsIGkpO1xuXG4gICAgICAvLyBQYXJ0IDE6IFZpc2l0IHRoZSBgW3N0eWxpbmcucHJvcF1gIHZhbHVlXG4gICAgICBmb3IgKGxldCBqID0gMDsgaiA8IHRvdGFsQmluZGluZ3NUb1Zpc2l0OyBqKyspIHtcbiAgICAgICAgY29uc3QgYmluZGluZ0luZGV4ID0gZ2V0QmluZGluZ1ZhbHVlKGNvbnRleHQsIGksIGopIGFzIG51bWJlcjtcbiAgICAgICAgaWYgKCF2YWx1ZUFwcGxpZWQgJiYgYmluZGluZ0luZGV4ICE9PSAwKSB7XG4gICAgICAgICAgY29uc3QgdmFsdWUgPSBnZXRWYWx1ZShiaW5kaW5nRGF0YSwgYmluZGluZ0luZGV4KTtcbiAgICAgICAgICBpZiAoaXNTdHlsaW5nVmFsdWVEZWZpbmVkKHZhbHVlKSkge1xuICAgICAgICAgICAgY29uc3QgY2hlY2tWYWx1ZU9ubHkgPSBob3N0QmluZGluZ3NNb2RlICYmIGogPT09IDA7XG4gICAgICAgICAgICBpZiAoIWNoZWNrVmFsdWVPbmx5KSB7XG4gICAgICAgICAgICAgIGNvbnN0IGZpbmFsVmFsdWUgPSBzYW5pdGl6ZXIgJiYgaXNTYW5pdGl6YXRpb25SZXF1aXJlZChjb250ZXh0LCBpKSA/XG4gICAgICAgICAgICAgICAgICBzYW5pdGl6ZXIocHJvcCwgdmFsdWUsIFN0eWxlU2FuaXRpemVNb2RlLlNhbml0aXplT25seSkgOlxuICAgICAgICAgICAgICAgICAgdW53cmFwU2FmZVZhbHVlKHZhbHVlKTtcbiAgICAgICAgICAgICAgYXBwbHlTdHlsaW5nRm4ocmVuZGVyZXIsIGVsZW1lbnQsIHByb3AsIGZpbmFsVmFsdWUsIGJpbmRpbmdJbmRleCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YWx1ZUFwcGxpZWQgPSB0cnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFBhcnQgMjogVmlzaXQgdGhlIGBbc3R5bGVdYCBvciBgW2NsYXNzXWAgbWFwLWJhc2VkIHZhbHVlXG4gICAgICAgIGlmIChzdHlsaW5nTWFwc1N5bmNGbikge1xuICAgICAgICAgIC8vIGRldGVybWluZSB3aGV0aGVyIG9yIG5vdCB0byBhcHBseSB0aGUgdGFyZ2V0IHByb3BlcnR5IG9yIHRvIHNraXAgaXRcbiAgICAgICAgICBsZXQgbW9kZSA9IG1hcHNNb2RlIHwgKHZhbHVlQXBwbGllZCA/IFN0eWxpbmdNYXBzU3luY01vZGUuU2tpcFRhcmdldFByb3AgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgU3R5bGluZ01hcHNTeW5jTW9kZS5BcHBseVRhcmdldFByb3ApO1xuXG4gICAgICAgICAgLy8gdGhlIGZpcnN0IGNvbHVtbiBpbiB0aGUgY29udGV4dCAod2hlbiBgaiA9PSAwYCkgaXMgc3BlY2lhbC1jYXNlZCBmb3JcbiAgICAgICAgICAvLyB0ZW1wbGF0ZSBiaW5kaW5ncy4gSWYgYW5kIHdoZW4gaG9zdCBiaW5kaW5ncyBhcmUgYmVpbmcgcHJvY2Vzc2VkIHRoZW5cbiAgICAgICAgICAvLyB0aGUgZmlyc3QgY29sdW1uIHdpbGwgc3RpbGwgYmUgaXRlcmF0ZWQgb3ZlciwgYnV0IHRoZSB2YWx1ZXMgd2lsbCBvbmx5XG4gICAgICAgICAgLy8gYmUgY2hlY2tlZCBhZ2FpbnN0IChub3QgYXBwbGllZCkuIElmIGFuZCB3aGVuIHRoaXMgaGFwcGVucyB3ZSBuZWVkIHRvXG4gICAgICAgICAgLy8gbm90aWZ5IHRoZSBtYXAtYmFzZWQgc3luY2luZyBjb2RlIHRvIGtub3cgbm90IHRvIGFwcGx5IHRoZSB2YWx1ZXMgaXRcbiAgICAgICAgICAvLyBjb21lcyBhY3Jvc3MgaW4gdGhlIHZlcnkgZmlyc3QgbWFwLWJhc2VkIGJpbmRpbmcgKHdoaWNoIGlzIGFsc28gbG9jYXRlZFxuICAgICAgICAgIC8vIGluIGNvbHVtbiB6ZXJvKS5cbiAgICAgICAgICBpZiAoaG9zdEJpbmRpbmdzTW9kZSAmJiBqID09PSAwKSB7XG4gICAgICAgICAgICBtb2RlIHw9IFN0eWxpbmdNYXBzU3luY01vZGUuQ2hlY2tWYWx1ZXNPbmx5O1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGNvbnN0IHZhbHVlQXBwbGllZFdpdGhpbk1hcCA9IHN0eWxpbmdNYXBzU3luY0ZuKFxuICAgICAgICAgICAgICBjb250ZXh0LCByZW5kZXJlciwgZWxlbWVudCwgYmluZGluZ0RhdGEsIGosIGFwcGx5U3R5bGluZ0ZuLCBzYW5pdGl6ZXIsIG1vZGUsIHByb3AsXG4gICAgICAgICAgICAgIGRlZmF1bHRWYWx1ZSk7XG4gICAgICAgICAgdmFsdWVBcHBsaWVkID0gdmFsdWVBcHBsaWVkIHx8IHZhbHVlQXBwbGllZFdpdGhpbk1hcDtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBQYXJ0IDM6IGFwcGx5IHRoZSBkZWZhdWx0IHZhbHVlIChlLmcuIGA8ZGl2IHN0eWxlPVwid2lkdGg6MjAwXCI+YCA9PiBgMjAwcHhgIGdldHMgYXBwbGllZClcbiAgICAgIC8vIGlmIHRoZSB2YWx1ZSBoYXMgbm90IHlldCBiZWVuIGFwcGxpZWQgdGhlbiBhIHRydXRoeSB2YWx1ZSBkb2VzIG5vdCBleGlzdCBpbiB0aGVcbiAgICAgIC8vIHByb3AtYmFzZWQgb3IgbWFwLWJhc2VkIGJpbmRpbmdzIGNvZGUuIElmIGFuZCB3aGVuIHRoaXMgaGFwcGVucywganVzdCBhcHBseSB0aGVcbiAgICAgIC8vIGRlZmF1bHQgdmFsdWUgKGV2ZW4gaWYgdGhlIGRlZmF1bHQgdmFsdWUgaXMgYG51bGxgKS5cbiAgICAgIGlmICghdmFsdWVBcHBsaWVkKSB7XG4gICAgICAgIGFwcGx5U3R5bGluZ0ZuKHJlbmRlcmVyLCBlbGVtZW50LCBwcm9wLCBkZWZhdWx0VmFsdWUpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGkgKz0gVFN0eWxpbmdDb250ZXh0SW5kZXguQmluZGluZ3NTdGFydE9mZnNldCArIHZhbHVlc0NvdW50O1xuICB9XG5cbiAgLy8gdGhlIG1hcC1iYXNlZCBzdHlsaW5nIGVudHJpZXMgbWF5IGhhdmUgbm90IGFwcGxpZWQgYWxsIHRoZWlyXG4gIC8vIHZhbHVlcy4gRm9yIHRoaXMgcmVhc29uLCBvbmUgbW9yZSBjYWxsIHRvIHRoZSBzeW5jIGZ1bmN0aW9uXG4gIC8vIG5lZWRzIHRvIGJlIGlzc3VlZCBhdCB0aGUgZW5kLlxuICBpZiAoc3R5bGluZ01hcHNTeW5jRm4pIHtcbiAgICBpZiAoaG9zdEJpbmRpbmdzTW9kZSkge1xuICAgICAgbWFwc01vZGUgfD0gU3R5bGluZ01hcHNTeW5jTW9kZS5DaGVja1ZhbHVlc09ubHk7XG4gICAgfVxuICAgIHN0eWxpbmdNYXBzU3luY0ZuKFxuICAgICAgICBjb250ZXh0LCByZW5kZXJlciwgZWxlbWVudCwgYmluZGluZ0RhdGEsIDAsIGFwcGx5U3R5bGluZ0ZuLCBzYW5pdGl6ZXIsIG1hcHNNb2RlKTtcbiAgfVxufVxuXG4vKipcbiAqIEFwcGxpZXMgdGhlIHByb3ZpZGVkIHN0eWxpbmcgbWFwIHRvIHRoZSBlbGVtZW50IGRpcmVjdGx5ICh3aXRob3V0IGNvbnRleHQgcmVzb2x1dGlvbikuXG4gKlxuICogVGhpcyBmdW5jdGlvbiBpcyBkZXNpZ25lZCB0byBiZSBydW4gZnJvbSB0aGUgc3R5bGluZyBpbnN0cnVjdGlvbnMgYW5kIHdpbGwgYmUgY2FsbGVkXG4gKiBhdXRvbWF0aWNhbGx5LiBUaGlzIGZ1bmN0aW9uIGlzIGludGVuZGVkIHRvIGJlIHVzZWQgZm9yIHBlcmZvcm1hbmNlIHJlYXNvbnMgaW4gdGhlXG4gKiBldmVudCB0aGF0IHRoZXJlIGlzIG5vIG5lZWQgdG8gYXBwbHkgc3R5bGluZyB2aWEgY29udGV4dCByZXNvbHV0aW9uLlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gaGFzIHRocmVlIGRpZmZlcmVudCBjYXNlcyB0aGF0IGNhbiBvY2N1ciAoZm9yIGVhY2ggaXRlbSBpbiB0aGUgbWFwKTpcbiAqXG4gKiAtIENhc2UgMTogQXR0ZW1wdCB0byBhcHBseSB0aGUgY3VycmVudCB2YWx1ZSBpbiB0aGUgbWFwIHRvIHRoZSBlbGVtZW50IChpZiBpdCdzIGBub24gbnVsbGApLlxuICpcbiAqIC0gQ2FzZSAyOiBJZiBhIG1hcCB2YWx1ZSBmYWlscyB0byBiZSBhcHBsaWVkIHRoZW4gdGhlIGFsZ29yaXRobSB3aWxsIGZpbmQgYSBtYXRjaGluZyBlbnRyeSBpblxuICogICAgICAgICAgIHRoZSBpbml0aWFsIHZhbHVlcyBwcmVzZW50IGluIHRoZSBjb250ZXh0IGFuZCBhdHRlbXB0IHRvIGFwcGx5IHRoYXQuXG4gKlxuICogLSBEZWZhdWx0IENhc2U6IElmIHRoZSBpbml0aWFsIHZhbHVlIGNhbm5vdCBiZSBhcHBsaWVkIHRoZW4gYSBkZWZhdWx0IHZhbHVlIG9mIGBudWxsYCB3aWxsIGJlXG4gKiAgICAgICAgICAgICAgICAgYXBwbGllZCAod2hpY2ggd2lsbCByZW1vdmUgdGhlIHN0eWxlL2NsYXNzIHZhbHVlIGZyb20gdGhlIGVsZW1lbnQpLlxuICpcbiAqIFNlZSBgYWxsb3dEaXJlY3RTdHlsaW5nQXBwbHlgIHRvIGxlYXJuIHRoZSBsb2dpYyB1c2VkIHRvIGRldGVybWluZSB3aGV0aGVyIGFueSBzdHlsZS9jbGFzc1xuICogYmluZGluZ3MgY2FuIGJlIGRpcmVjdGx5IGFwcGxpZWQuXG4gKlxuICogQHJldHVybnMgd2hldGhlciBvciBub3QgdGhlIHN0eWxpbmcgbWFwIHdhcyBhcHBsaWVkIHRvIHRoZSBlbGVtZW50LlxuICovXG5leHBvcnQgZnVuY3Rpb24gYXBwbHlTdHlsaW5nTWFwRGlyZWN0bHkoXG4gICAgcmVuZGVyZXI6IGFueSwgY29udGV4dDogVFN0eWxpbmdDb250ZXh0LCBlbGVtZW50OiBSRWxlbWVudCwgZGF0YTogTFN0eWxpbmdEYXRhLFxuICAgIGJpbmRpbmdJbmRleDogbnVtYmVyLCBtYXA6IFN0eWxpbmdNYXBBcnJheSwgaXNDbGFzc0Jhc2VkOiBib29sZWFuLCBhcHBseUZuOiBBcHBseVN0eWxpbmdGbixcbiAgICBzYW5pdGl6ZXI/OiBTdHlsZVNhbml0aXplRm4gfCBudWxsLCBmb3JjZVVwZGF0ZT86IGJvb2xlYW4pOiBib29sZWFuIHtcbiAgaWYgKGZvcmNlVXBkYXRlIHx8IGhhc1ZhbHVlQ2hhbmdlZChkYXRhW2JpbmRpbmdJbmRleF0sIG1hcCkpIHtcbiAgICBzZXRWYWx1ZShkYXRhLCBiaW5kaW5nSW5kZXgsIG1hcCk7XG4gICAgY29uc3QgaW5pdGlhbFN0eWxlcyA9XG4gICAgICAgIGhhc0NvbmZpZyhjb250ZXh0LCBUU3R5bGluZ0NvbmZpZy5IYXNJbml0aWFsU3R5bGluZykgPyBnZXRTdHlsaW5nTWFwQXJyYXkoY29udGV4dCkgOiBudWxsO1xuXG4gICAgZm9yIChsZXQgaSA9IFN0eWxpbmdNYXBBcnJheUluZGV4LlZhbHVlc1N0YXJ0UG9zaXRpb247IGkgPCBtYXAubGVuZ3RoO1xuICAgICAgICAgaSArPSBTdHlsaW5nTWFwQXJyYXlJbmRleC5UdXBsZVNpemUpIHtcbiAgICAgIGNvbnN0IHByb3AgPSBnZXRNYXBQcm9wKG1hcCwgaSk7XG4gICAgICBjb25zdCB2YWx1ZSA9IGdldE1hcFZhbHVlKG1hcCwgaSk7XG5cbiAgICAgIC8vIGNhc2UgMTogYXBwbHkgdGhlIG1hcCB2YWx1ZSAoaWYgaXQgZXhpc3RzKVxuICAgICAgbGV0IGFwcGxpZWQgPVxuICAgICAgICAgIGFwcGx5U3R5bGluZ1ZhbHVlKHJlbmRlcmVyLCBlbGVtZW50LCBwcm9wLCB2YWx1ZSwgYXBwbHlGbiwgYmluZGluZ0luZGV4LCBzYW5pdGl6ZXIpO1xuXG4gICAgICAvLyBjYXNlIDI6IGFwcGx5IHRoZSBpbml0aWFsIHZhbHVlIChpZiBpdCBleGlzdHMpXG4gICAgICBpZiAoIWFwcGxpZWQgJiYgaW5pdGlhbFN0eWxlcykge1xuICAgICAgICBhcHBsaWVkID0gZmluZEFuZEFwcGx5TWFwVmFsdWUoXG4gICAgICAgICAgICByZW5kZXJlciwgZWxlbWVudCwgYXBwbHlGbiwgaW5pdGlhbFN0eWxlcywgcHJvcCwgYmluZGluZ0luZGV4LCBzYW5pdGl6ZXIpO1xuICAgICAgfVxuXG4gICAgICAvLyBkZWZhdWx0IGNhc2U6IGFwcGx5IGBudWxsYCB0byByZW1vdmUgdGhlIHZhbHVlXG4gICAgICBpZiAoIWFwcGxpZWQpIHtcbiAgICAgICAgYXBwbHlGbihyZW5kZXJlciwgZWxlbWVudCwgcHJvcCwgbnVsbCwgYmluZGluZ0luZGV4KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zdCBzdGF0ZSA9IGdldFN0eWxpbmdTdGF0ZShlbGVtZW50LCBURU1QTEFURV9ESVJFQ1RJVkVfSU5ERVgpO1xuICAgIGlmIChpc0NsYXNzQmFzZWQpIHtcbiAgICAgIHN0YXRlLmxhc3REaXJlY3RDbGFzc01hcCA9IG1hcDtcbiAgICB9IGVsc2Uge1xuICAgICAgc3RhdGUubGFzdERpcmVjdFN0eWxlTWFwID0gbWFwO1xuICAgIH1cblxuICAgIHJldHVybiB0cnVlO1xuICB9XG4gIHJldHVybiBmYWxzZTtcbn1cblxuLyoqXG4gKiBBcHBsaWVzIHRoZSBwcm92aWRlZCBzdHlsaW5nIHByb3AvdmFsdWUgdG8gdGhlIGVsZW1lbnQgZGlyZWN0bHkgKHdpdGhvdXQgY29udGV4dCByZXNvbHV0aW9uKS5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIGlzIGRlc2lnbmVkIHRvIGJlIHJ1biBmcm9tIHRoZSBzdHlsaW5nIGluc3RydWN0aW9ucyBhbmQgd2lsbCBiZSBjYWxsZWRcbiAqIGF1dG9tYXRpY2FsbHkuIFRoaXMgZnVuY3Rpb24gaXMgaW50ZW5kZWQgdG8gYmUgdXNlZCBmb3IgcGVyZm9ybWFuY2UgcmVhc29ucyBpbiB0aGVcbiAqIGV2ZW50IHRoYXQgdGhlcmUgaXMgbm8gbmVlZCB0byBhcHBseSBzdHlsaW5nIHZpYSBjb250ZXh0IHJlc29sdXRpb24uXG4gKlxuICogVGhpcyBmdW5jdGlvbiBoYXMgZm91ciBkaWZmZXJlbnQgY2FzZXMgdGhhdCBjYW4gb2NjdXI6XG4gKlxuICogLSBDYXNlIDE6IEFwcGx5IHRoZSBwcm92aWRlZCBwcm9wL3ZhbHVlIChzdHlsZSBvciBjbGFzcykgZW50cnkgdG8gdGhlIGVsZW1lbnRcbiAqICAgICAgICAgICAoaWYgaXQgaXMgYG5vbiBudWxsYCkuXG4gKlxuICogLSBDYXNlIDI6IElmIHZhbHVlIGRvZXMgbm90IGdldCBhcHBsaWVkIChiZWNhdXNlIGl0cyBgbnVsbGAgb3IgYHVuZGVmaW5lZGApIHRoZW4gdGhlIGFsZ29yaXRobVxuICogICAgICAgICAgIHdpbGwgY2hlY2sgdG8gc2VlIGlmIGEgc3R5bGluZyBtYXAgdmFsdWUgd2FzIGFwcGxpZWQgdG8gdGhlIGVsZW1lbnQgYXMgd2VsbCBqdXN0XG4gKiAgICAgICAgICAgYmVmb3JlIHRoaXMgKHZpYSBgc3R5bGVNYXBgIG9yIGBjbGFzc01hcGApLiBJZiBhbmQgd2hlbiBhIG1hcCBpcyBwcmVzZW50IHRoZW4gdGhlXG4gICogICAgICAgICAgYWxnb3JpdGhtIHdpbGwgZmluZCB0aGUgbWF0Y2hpbmcgcHJvcGVydHkgaW4gdGhlIG1hcCBhbmQgYXBwbHkgaXRzIHZhbHVlLlxuICAqXG4gKiAtIENhc2UgMzogSWYgYSBtYXAgdmFsdWUgZmFpbHMgdG8gYmUgYXBwbGllZCB0aGVuIHRoZSBhbGdvcml0aG0gd2lsbCBjaGVjayB0byBzZWUgaWYgdGhlcmVcbiAqICAgICAgICAgICBhcmUgYW55IGluaXRpYWwgdmFsdWVzIHByZXNlbnQgYW5kIGF0dGVtcHQgdG8gYXBwbHkgYSBtYXRjaGluZyB2YWx1ZSBiYXNlZCBvblxuICogICAgICAgICAgIHRoZSB0YXJnZXQgcHJvcC5cbiAqXG4gKiAtIERlZmF1bHQgQ2FzZTogSWYgYSBtYXRjaGluZyBpbml0aWFsIHZhbHVlIGNhbm5vdCBiZSBhcHBsaWVkIHRoZW4gYSBkZWZhdWx0IHZhbHVlXG4gKiAgICAgICAgICAgICAgICAgb2YgYG51bGxgIHdpbGwgYmUgYXBwbGllZCAod2hpY2ggd2lsbCByZW1vdmUgdGhlIHN0eWxlL2NsYXNzIHZhbHVlXG4gKiAgICAgICAgICAgICAgICAgZnJvbSB0aGUgZWxlbWVudCkuXG4gKlxuICogU2VlIGBhbGxvd0RpcmVjdFN0eWxpbmdBcHBseWAgdG8gbGVhcm4gdGhlIGxvZ2ljIHVzZWQgdG8gZGV0ZXJtaW5lIHdoZXRoZXIgYW55IHN0eWxlL2NsYXNzXG4gKiBiaW5kaW5ncyBjYW4gYmUgZGlyZWN0bHkgYXBwbGllZC5cbiAqXG4gKiBAcmV0dXJucyB3aGV0aGVyIG9yIG5vdCB0aGUgcHJvcC92YWx1ZSBzdHlsaW5nIHdhcyBhcHBsaWVkIHRvIHRoZSBlbGVtZW50LlxuICovXG5leHBvcnQgZnVuY3Rpb24gYXBwbHlTdHlsaW5nVmFsdWVEaXJlY3RseShcbiAgICByZW5kZXJlcjogYW55LCBjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQsIGVsZW1lbnQ6IFJFbGVtZW50LCBkYXRhOiBMU3R5bGluZ0RhdGEsXG4gICAgYmluZGluZ0luZGV4OiBudW1iZXIsIHByb3A6IHN0cmluZywgdmFsdWU6IGFueSwgaXNDbGFzc0Jhc2VkOiBib29sZWFuLCBhcHBseUZuOiBBcHBseVN0eWxpbmdGbixcbiAgICBzYW5pdGl6ZXI/OiBTdHlsZVNhbml0aXplRm4gfCBudWxsKTogYm9vbGVhbiB7XG4gIGxldCBhcHBsaWVkID0gZmFsc2U7XG4gIGlmIChoYXNWYWx1ZUNoYW5nZWQoZGF0YVtiaW5kaW5nSW5kZXhdLCB2YWx1ZSkpIHtcbiAgICBzZXRWYWx1ZShkYXRhLCBiaW5kaW5nSW5kZXgsIHZhbHVlKTtcblxuICAgIC8vIGNhc2UgMTogYXBwbHkgdGhlIHByb3ZpZGVkIHZhbHVlIChpZiBpdCBleGlzdHMpXG4gICAgYXBwbGllZCA9IGFwcGx5U3R5bGluZ1ZhbHVlKHJlbmRlcmVyLCBlbGVtZW50LCBwcm9wLCB2YWx1ZSwgYXBwbHlGbiwgYmluZGluZ0luZGV4LCBzYW5pdGl6ZXIpO1xuXG4gICAgLy8gY2FzZSAyOiBmaW5kIHRoZSBtYXRjaGluZyBwcm9wZXJ0eSBpbiBhIHN0eWxpbmcgbWFwIGFuZCBhcHBseSB0aGUgZGV0ZWN0ZWQgdmFsdWVcbiAgICBpZiAoIWFwcGxpZWQgJiYgaGFzQ29uZmlnKGNvbnRleHQsIFRTdHlsaW5nQ29uZmlnLkhhc01hcEJpbmRpbmdzKSkge1xuICAgICAgY29uc3Qgc3RhdGUgPSBnZXRTdHlsaW5nU3RhdGUoZWxlbWVudCwgVEVNUExBVEVfRElSRUNUSVZFX0lOREVYKTtcbiAgICAgIGNvbnN0IG1hcCA9IGlzQ2xhc3NCYXNlZCA/IHN0YXRlLmxhc3REaXJlY3RDbGFzc01hcCA6IHN0YXRlLmxhc3REaXJlY3RTdHlsZU1hcDtcbiAgICAgIGFwcGxpZWQgPSBtYXAgP1xuICAgICAgICAgIGZpbmRBbmRBcHBseU1hcFZhbHVlKHJlbmRlcmVyLCBlbGVtZW50LCBhcHBseUZuLCBtYXAsIHByb3AsIGJpbmRpbmdJbmRleCwgc2FuaXRpemVyKSA6XG4gICAgICAgICAgZmFsc2U7XG4gICAgfVxuXG4gICAgLy8gY2FzZSAzOiBhcHBseSB0aGUgaW5pdGlhbCB2YWx1ZSAoaWYgaXQgZXhpc3RzKVxuICAgIGlmICghYXBwbGllZCAmJiBoYXNDb25maWcoY29udGV4dCwgVFN0eWxpbmdDb25maWcuSGFzSW5pdGlhbFN0eWxpbmcpKSB7XG4gICAgICBjb25zdCBtYXAgPSBnZXRTdHlsaW5nTWFwQXJyYXkoY29udGV4dCk7XG4gICAgICBhcHBsaWVkID1cbiAgICAgICAgICBtYXAgPyBmaW5kQW5kQXBwbHlNYXBWYWx1ZShyZW5kZXJlciwgZWxlbWVudCwgYXBwbHlGbiwgbWFwLCBwcm9wLCBiaW5kaW5nSW5kZXgpIDogZmFsc2U7XG4gICAgfVxuXG4gICAgLy8gZGVmYXVsdCBjYXNlOiBhcHBseSBgbnVsbGAgdG8gcmVtb3ZlIHRoZSB2YWx1ZVxuICAgIGlmICghYXBwbGllZCkge1xuICAgICAgYXBwbHlGbihyZW5kZXJlciwgZWxlbWVudCwgcHJvcCwgbnVsbCwgYmluZGluZ0luZGV4KTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGFwcGxpZWQ7XG59XG5cbmZ1bmN0aW9uIGFwcGx5U3R5bGluZ1ZhbHVlKFxuICAgIHJlbmRlcmVyOiBhbnksIGVsZW1lbnQ6IFJFbGVtZW50LCBwcm9wOiBzdHJpbmcsIHZhbHVlOiBhbnksIGFwcGx5Rm46IEFwcGx5U3R5bGluZ0ZuLFxuICAgIGJpbmRpbmdJbmRleDogbnVtYmVyLCBzYW5pdGl6ZXI/OiBTdHlsZVNhbml0aXplRm4gfCBudWxsKTogYm9vbGVhbiB7XG4gIGxldCB2YWx1ZVRvQXBwbHk6IHN0cmluZ3xudWxsID0gdW53cmFwU2FmZVZhbHVlKHZhbHVlKTtcbiAgaWYgKGlzU3R5bGluZ1ZhbHVlRGVmaW5lZCh2YWx1ZVRvQXBwbHkpKSB7XG4gICAgdmFsdWVUb0FwcGx5ID1cbiAgICAgICAgc2FuaXRpemVyID8gc2FuaXRpemVyKHByb3AsIHZhbHVlLCBTdHlsZVNhbml0aXplTW9kZS5TYW5pdGl6ZU9ubHkpIDogdmFsdWVUb0FwcGx5O1xuICAgIGFwcGx5Rm4ocmVuZGVyZXIsIGVsZW1lbnQsIHByb3AsIHZhbHVlVG9BcHBseSwgYmluZGluZ0luZGV4KTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuICByZXR1cm4gZmFsc2U7XG59XG5cbmZ1bmN0aW9uIGZpbmRBbmRBcHBseU1hcFZhbHVlKFxuICAgIHJlbmRlcmVyOiBhbnksIGVsZW1lbnQ6IFJFbGVtZW50LCBhcHBseUZuOiBBcHBseVN0eWxpbmdGbiwgbWFwOiBTdHlsaW5nTWFwQXJyYXksIHByb3A6IHN0cmluZyxcbiAgICBiaW5kaW5nSW5kZXg6IG51bWJlciwgc2FuaXRpemVyPzogU3R5bGVTYW5pdGl6ZUZuIHwgbnVsbCkge1xuICBmb3IgKGxldCBpID0gU3R5bGluZ01hcEFycmF5SW5kZXguVmFsdWVzU3RhcnRQb3NpdGlvbjsgaSA8IG1hcC5sZW5ndGg7XG4gICAgICAgaSArPSBTdHlsaW5nTWFwQXJyYXlJbmRleC5UdXBsZVNpemUpIHtcbiAgICBjb25zdCBwID0gZ2V0TWFwUHJvcChtYXAsIGkpO1xuICAgIGlmIChwID09PSBwcm9wKSB7XG4gICAgICBsZXQgdmFsdWVUb0FwcGx5ID0gZ2V0TWFwVmFsdWUobWFwLCBpKTtcbiAgICAgIHZhbHVlVG9BcHBseSA9XG4gICAgICAgICAgc2FuaXRpemVyID8gc2FuaXRpemVyKHByb3AsIHZhbHVlVG9BcHBseSwgU3R5bGVTYW5pdGl6ZU1vZGUuU2FuaXRpemVPbmx5KSA6IHZhbHVlVG9BcHBseTtcbiAgICAgIGFwcGx5Rm4ocmVuZGVyZXIsIGVsZW1lbnQsIHByb3AsIHZhbHVlVG9BcHBseSwgYmluZGluZ0luZGV4KTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICBpZiAocCA+IHByb3ApIHtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuICByZXR1cm4gZmFsc2U7XG59XG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZUJpdE1hc2tWYWx1ZSh2YWx1ZTogbnVtYmVyIHwgYm9vbGVhbik6IG51bWJlciB7XG4gIC8vIGlmIHBhc3MgPT4gYXBwbHkgYWxsIHZhbHVlcyAoLTEgaW1wbGllcyB0aGF0IGFsbCBiaXRzIGFyZSBmbGlwcGVkIHRvIHRydWUpXG4gIGlmICh2YWx1ZSA9PT0gdHJ1ZSkgcmV0dXJuIC0xO1xuXG4gIC8vIGlmIHBhc3MgPT4gc2tpcCBhbGwgdmFsdWVzXG4gIGlmICh2YWx1ZSA9PT0gZmFsc2UpIHJldHVybiAwO1xuXG4gIC8vIHJldHVybiB0aGUgYml0IG1hc2sgdmFsdWUgYXMgaXNcbiAgcmV0dXJuIHZhbHVlO1xufVxuXG5sZXQgX2FjdGl2ZVN0eWxpbmdNYXBBcHBseUZuOiBTeW5jU3R5bGluZ01hcHNGbnxudWxsID0gbnVsbDtcbmV4cG9ydCBmdW5jdGlvbiBnZXRTdHlsaW5nTWFwc1N5bmNGbigpIHtcbiAgcmV0dXJuIF9hY3RpdmVTdHlsaW5nTWFwQXBwbHlGbjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNldFN0eWxpbmdNYXBzU3luY0ZuKGZuOiBTeW5jU3R5bGluZ01hcHNGbikge1xuICBfYWN0aXZlU3R5bGluZ01hcEFwcGx5Rm4gPSBmbjtcbn1cblxuLyoqXG4gKiBBc3NpZ25zIGEgc3R5bGUgdmFsdWUgdG8gYSBzdHlsZSBwcm9wZXJ0eSBmb3IgdGhlIGdpdmVuIGVsZW1lbnQuXG4gKi9cbmV4cG9ydCBjb25zdCBzZXRTdHlsZTogQXBwbHlTdHlsaW5nRm4gPVxuICAgIChyZW5kZXJlcjogUmVuZGVyZXIzIHwgbnVsbCwgbmF0aXZlOiBSRWxlbWVudCwgcHJvcDogc3RyaW5nLCB2YWx1ZTogc3RyaW5nIHwgbnVsbCkgPT4ge1xuICAgICAgaWYgKHJlbmRlcmVyICE9PSBudWxsKSB7XG4gICAgICAgIC8vIFVzZSBgaXNTdHlsaW5nVmFsdWVEZWZpbmVkYCB0byBhY2NvdW50IGZvciBmYWxzeSB2YWx1ZXMgdGhhdCBzaG91bGQgYmUgYm91bmQgbGlrZSAwLlxuICAgICAgICBpZiAoaXNTdHlsaW5nVmFsdWVEZWZpbmVkKHZhbHVlKSkge1xuICAgICAgICAgIC8vIG9wYWNpdHksIHotaW5kZXggYW5kIGZsZXhib3ggYWxsIGhhdmUgbnVtYmVyIHZhbHVlc1xuICAgICAgICAgIC8vIGFuZCB0aGVzZSBuZWVkIHRvIGJlIGNvbnZlcnRlZCBpbnRvIHN0cmluZ3Mgc28gdGhhdFxuICAgICAgICAgIC8vIHRoZXkgY2FuIGJlIGFzc2lnbmVkIHByb3Blcmx5LlxuICAgICAgICAgIHZhbHVlID0gdmFsdWUudG9TdHJpbmcoKTtcbiAgICAgICAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyU2V0U3R5bGUrKztcbiAgICAgICAgICBpZiAoaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpKSB7XG4gICAgICAgICAgICByZW5kZXJlci5zZXRTdHlsZShuYXRpdmUsIHByb3AsIHZhbHVlLCBSZW5kZXJlclN0eWxlRmxhZ3MzLkRhc2hDYXNlKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gVGhlIHJlYXNvbiB3aHkgbmF0aXZlIHN0eWxlIG1heSBiZSBgbnVsbGAgaXMgZWl0aGVyIGJlY2F1c2VcbiAgICAgICAgICAgIC8vIGl0J3MgYSBjb250YWluZXIgZWxlbWVudCBvciBpdCdzIGEgcGFydCBvZiBhIHRlc3RcbiAgICAgICAgICAgIC8vIGVudmlyb25tZW50IHRoYXQgZG9lc24ndCBoYXZlIHN0eWxpbmcuIEluIGVpdGhlclxuICAgICAgICAgICAgLy8gY2FzZSBpdCdzIHNhZmUgbm90IHRvIGFwcGx5IHN0eWxpbmcgdG8gdGhlIGVsZW1lbnQuXG4gICAgICAgICAgICBjb25zdCBuYXRpdmVTdHlsZSA9IG5hdGl2ZS5zdHlsZTtcbiAgICAgICAgICAgIGlmIChuYXRpdmVTdHlsZSAhPSBudWxsKSB7XG4gICAgICAgICAgICAgIG5hdGl2ZVN0eWxlLnNldFByb3BlcnR5KHByb3AsIHZhbHVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlclJlbW92ZVN0eWxlKys7XG5cbiAgICAgICAgICBpZiAoaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpKSB7XG4gICAgICAgICAgICByZW5kZXJlci5yZW1vdmVTdHlsZShuYXRpdmUsIHByb3AsIFJlbmRlcmVyU3R5bGVGbGFnczMuRGFzaENhc2UpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zdCBuYXRpdmVTdHlsZSA9IG5hdGl2ZS5zdHlsZTtcbiAgICAgICAgICAgIGlmIChuYXRpdmVTdHlsZSAhPSBudWxsKSB7XG4gICAgICAgICAgICAgIG5hdGl2ZVN0eWxlLnJlbW92ZVByb3BlcnR5KHByb3ApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH07XG5cbi8qKlxuICogQWRkcy9yZW1vdmVzIHRoZSBwcm92aWRlZCBjbGFzc05hbWUgdmFsdWUgdG8gdGhlIHByb3ZpZGVkIGVsZW1lbnQuXG4gKi9cbmV4cG9ydCBjb25zdCBzZXRDbGFzczogQXBwbHlTdHlsaW5nRm4gPVxuICAgIChyZW5kZXJlcjogUmVuZGVyZXIzIHwgbnVsbCwgbmF0aXZlOiBSRWxlbWVudCwgY2xhc3NOYW1lOiBzdHJpbmcsIHZhbHVlOiBhbnkpID0+IHtcbiAgICAgIGlmIChyZW5kZXJlciAhPT0gbnVsbCAmJiBjbGFzc05hbWUgIT09ICcnKSB7XG4gICAgICAgIGlmICh2YWx1ZSkge1xuICAgICAgICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJBZGRDbGFzcysrO1xuICAgICAgICAgIGlmIChpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikpIHtcbiAgICAgICAgICAgIHJlbmRlcmVyLmFkZENsYXNzKG5hdGl2ZSwgY2xhc3NOYW1lKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gdGhlIHJlYXNvbiB3aHkgY2xhc3NMaXN0IG1heSBiZSBgbnVsbGAgaXMgZWl0aGVyIGJlY2F1c2VcbiAgICAgICAgICAgIC8vIGl0J3MgYSBjb250YWluZXIgZWxlbWVudCBvciBpdCdzIGEgcGFydCBvZiBhIHRlc3RcbiAgICAgICAgICAgIC8vIGVudmlyb25tZW50IHRoYXQgZG9lc24ndCBoYXZlIHN0eWxpbmcuIEluIGVpdGhlclxuICAgICAgICAgICAgLy8gY2FzZSBpdCdzIHNhZmUgbm90IHRvIGFwcGx5IHN0eWxpbmcgdG8gdGhlIGVsZW1lbnQuXG4gICAgICAgICAgICBjb25zdCBjbGFzc0xpc3QgPSBuYXRpdmUuY2xhc3NMaXN0O1xuICAgICAgICAgICAgaWYgKGNsYXNzTGlzdCAhPSBudWxsKSB7XG4gICAgICAgICAgICAgIGNsYXNzTGlzdC5hZGQoY2xhc3NOYW1lKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlclJlbW92ZUNsYXNzKys7XG4gICAgICAgICAgaWYgKGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSkge1xuICAgICAgICAgICAgcmVuZGVyZXIucmVtb3ZlQ2xhc3MobmF0aXZlLCBjbGFzc05hbWUpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zdCBjbGFzc0xpc3QgPSBuYXRpdmUuY2xhc3NMaXN0O1xuICAgICAgICAgICAgaWYgKGNsYXNzTGlzdCAhPSBudWxsKSB7XG4gICAgICAgICAgICAgIGNsYXNzTGlzdC5yZW1vdmUoY2xhc3NOYW1lKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9O1xuXG4vKipcbiAqIEl0ZXJhdGVzIG92ZXIgYWxsIHByb3ZpZGVkIHN0eWxpbmcgZW50cmllcyBhbmQgcmVuZGVycyB0aGVtIG9uIHRoZSBlbGVtZW50LlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gaXMgdXNlZCBhbG9uZ3NpZGUgYSBgU3R5bGluZ01hcEFycmF5YCBlbnRyeS4gVGhpcyBlbnRyeSBpcyBub3RcbiAqIHRoZSBzYW1lIGFzIHRoZSBgVFN0eWxpbmdDb250ZXh0YCBhbmQgaXMgb25seSByZWFsbHkgdXNlZCB3aGVuIGFuIGVsZW1lbnQgY29udGFpbnNcbiAqIGluaXRpYWwgc3R5bGluZyB2YWx1ZXMgKGUuZy4gYDxkaXYgc3R5bGU9XCJ3aWR0aDoyMDBweFwiPmApLCBidXQgbm8gc3R5bGUvY2xhc3MgYmluZGluZ3NcbiAqIGFyZSBwcmVzZW50LiBJZiBhbmQgd2hlbiB0aGF0IGhhcHBlbnMgdGhlbiB0aGlzIGZ1bmN0aW9uIHdpbGwgYmUgY2FsbGVkIHRvIHJlbmRlciBhbGxcbiAqIGluaXRpYWwgc3R5bGluZyB2YWx1ZXMgb24gYW4gZWxlbWVudC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlbmRlclN0eWxpbmdNYXAoXG4gICAgcmVuZGVyZXI6IFJlbmRlcmVyMywgZWxlbWVudDogUkVsZW1lbnQsIHN0eWxpbmdWYWx1ZXM6IFRTdHlsaW5nQ29udGV4dCB8IFN0eWxpbmdNYXBBcnJheSB8IG51bGwsXG4gICAgaXNDbGFzc0Jhc2VkOiBib29sZWFuKTogdm9pZCB7XG4gIGNvbnN0IHN0eWxpbmdNYXBBcnIgPSBnZXRTdHlsaW5nTWFwQXJyYXkoc3R5bGluZ1ZhbHVlcyk7XG4gIGlmIChzdHlsaW5nTWFwQXJyKSB7XG4gICAgZm9yIChsZXQgaSA9IFN0eWxpbmdNYXBBcnJheUluZGV4LlZhbHVlc1N0YXJ0UG9zaXRpb247IGkgPCBzdHlsaW5nTWFwQXJyLmxlbmd0aDtcbiAgICAgICAgIGkgKz0gU3R5bGluZ01hcEFycmF5SW5kZXguVHVwbGVTaXplKSB7XG4gICAgICBjb25zdCBwcm9wID0gZ2V0TWFwUHJvcChzdHlsaW5nTWFwQXJyLCBpKTtcbiAgICAgIGNvbnN0IHZhbHVlID0gZ2V0TWFwVmFsdWUoc3R5bGluZ01hcEFyciwgaSk7XG4gICAgICBpZiAoaXNDbGFzc0Jhc2VkKSB7XG4gICAgICAgIHNldENsYXNzKHJlbmRlcmVyLCBlbGVtZW50LCBwcm9wLCB2YWx1ZSwgbnVsbCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzZXRTdHlsZShyZW5kZXJlciwgZWxlbWVudCwgcHJvcCwgdmFsdWUsIG51bGwpO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuIl19