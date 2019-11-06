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
import { DEFAULT_BINDING_INDEX, DEFAULT_BINDING_VALUE, DEFAULT_GUARD_MASK_VALUE, MAP_BASED_ENTRY_PROP_NAME, TEMPLATE_DIRECTIVE_INDEX, concatString, forceStylesAsString, getBindingValue, getConfig, getDefaultValue, getGuardMask, getInitialStylingValue, getMapProp, getMapValue, getProp, getPropValuesStartPosition, getStylingMapArray, getTotalSources, getValue, getValuesCount, hasConfig, hasValueChanged, isHostStylingActive, isSanitizationRequired, isStylingMapArray, isStylingValueDefined, normalizeIntoStylingMap, patchConfig, setDefaultValue, setGuardMask, setMapAsDirty, setValue } from '../util/styling_utils';
import { getStylingState, resetStylingState } from './state';
var VALUE_IS_EXTERNALLY_MODIFIED = {};
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
export function updateClassViaContext(context, data, element, directiveIndex, prop, bindingIndex, value, forceUpdate, firstUpdatePass) {
    var isMapBased = !prop;
    var state = getStylingState(element, directiveIndex);
    var countIndex = isMapBased ? STYLING_INDEX_FOR_MAP_BINDING : state.classesIndex++;
    // even if the initial value is a `NO_CHANGE` value (e.g. interpolation or [ngClass])
    // then we still need to register the binding within the context so that the context
    // is aware of the binding even if things change after the first update pass.
    if (firstUpdatePass || value !== NO_CHANGE) {
        var updated = updateBindingData(context, data, countIndex, state.sourceIndex, prop, bindingIndex, value, forceUpdate, false, firstUpdatePass);
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
export function updateStyleViaContext(context, data, element, directiveIndex, prop, bindingIndex, value, sanitizer, forceUpdate, firstUpdatePass) {
    var isMapBased = !prop;
    var state = getStylingState(element, directiveIndex);
    var countIndex = isMapBased ? STYLING_INDEX_FOR_MAP_BINDING : state.stylesIndex++;
    // even if the initial value is a `NO_CHANGE` value (e.g. interpolation or [ngStyle])
    // then we still need to register the binding within the context so that the context
    // is aware of the binding even if things change after the first update pass.
    if (firstUpdatePass || value !== NO_CHANGE) {
        var sanitizationRequired = isMapBased ?
            true :
            (sanitizer ? sanitizer(prop, null, 1 /* ValidateProperty */) : false);
        var updated = updateBindingData(context, data, countIndex, state.sourceIndex, prop, bindingIndex, value, forceUpdate, sanitizationRequired, firstUpdatePass);
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
function updateBindingData(context, data, counterIndex, sourceIndex, prop, bindingIndex, value, forceUpdate, sanitizationRequired, firstUpdatePass) {
    var hostBindingsMode = isHostStylingActive(sourceIndex);
    if (firstUpdatePass) {
        // this will only happen during the first update pass of the
        // context. The reason why we can't use `tView.firstCreatePass`
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
export function flushStyling(renderer, data, classesContext, stylesContext, element, directiveIndex, styleSanitizer, firstUpdatePass) {
    ngDevMode && ngDevMode.flushStyling++;
    var state = getStylingState(element, directiveIndex);
    var hostBindingsMode = isHostStylingActive(state.sourceIndex);
    if (stylesContext) {
        firstUpdatePass && syncContextInitialStyling(stylesContext);
        if (state.stylesBitMask !== 0) {
            applyStylingViaContext(stylesContext, renderer, element, data, state.stylesBitMask, setStyle, styleSanitizer, hostBindingsMode);
        }
    }
    if (classesContext) {
        firstUpdatePass && syncContextInitialStyling(classesContext);
        if (state.classesBitMask !== 0) {
            applyStylingViaContext(classesContext, renderer, element, data, state.classesBitMask, setClass, null, hostBindingsMode);
        }
    }
    resetStylingState();
}
/**
 * Registers all static styling values into the context as default values.
 *
 * Static styles are stored on the `tNode.styles` and `tNode.classes`
 * properties as instances of `StylingMapArray`. When an instance of
 * `TStylingContext` is assigned to `tNode.styles` and `tNode.classes`
 * then the existing initial styling values are copied into the the
 * `InitialStylingValuePosition` slot.
 *
 * Because all static styles/classes are collected and registered on
 * the initial styling array each time a directive is instantiated,
 * the context may not yet know about the static values. When this
 * function is called it will copy over all the static style/class
 * values from the initial styling array into the context as default
 * values for each of the matching entries in the context.
 *
 * Let's imagine the following example:
 *
 * ```html
 * <div style="color:red"
 *     [style.color]="myColor"
 *     dir-that-has-static-height>
 *   ...
 * </div>
 * ```
 *
 * When the code above is processed, the underlying element/styling
 * instructions will create an instance of `TStylingContext` for
 * the `tNode.styles` property. Here's what that looks like:
 *
 * ```typescript
 * tNode.styles = [
 *   // ...
 *   // initial styles
 *   ['color:red; height:200px', 'color', 'red', 'height', '200px'],
 *
 *   0, 0b1, 0b0, 'color', 20, null, // [style.color] binding
 * ]
 * ```
 *
 * After this function is called it will balance out the context with
 * the static `color` and `height` values and set them as defaults within
 * the context:
 *
 * ```typescript
 * tNode.styles = [
 *   // ...
 *   // initial styles
 *   ['color:red; height:200px', 'color', 'red', 'height', '200px'],
 *
 *   0, 0b1, 0b0, 'color', 20, 'red',
 *   0, 0b0, 0b0, 'height', 0, '200px',
 * ]
 * ```
 */
function syncContextInitialStyling(context) {
    // the TStylingContext always has initial style/class values which are
    // stored in styling array format.
    updateInitialStylingOnContext(context, getStylingMapArray(context));
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
export function applyStylingMapDirectly(renderer, context, element, data, bindingIndex, value, isClassBased, sanitizer, forceUpdate, bindingValueContainsInitial) {
    var oldValue = getValue(data, bindingIndex);
    if (forceUpdate || hasValueChanged(oldValue, value)) {
        var config = getConfig(context);
        var hasInitial = config & 16 /* HasInitialStyling */;
        var initialValue = hasInitial && !bindingValueContainsInitial ? getInitialStylingValue(context) : null;
        setValue(data, bindingIndex, value);
        // the cached value is the last snapshot of the style or class
        // attribute value and is used in the if statement below to
        // keep track of internal/external changes.
        var cachedValueIndex = bindingIndex + 1;
        var cachedValue = getValue(data, cachedValueIndex);
        if (cachedValue === NO_CHANGE) {
            cachedValue = initialValue;
        }
        cachedValue = typeof cachedValue !== 'string' ? '' : cachedValue;
        // If a class/style value was modified externally then the styling
        // fast pass cannot guarantee that the external values are retained.
        // When this happens, the algorithm will bail out and not write to
        // the style or className attribute directly.
        var writeToAttrDirectly = !(config & 2 /* HasPropBindings */);
        if (writeToAttrDirectly &&
            checkIfExternallyModified(element, cachedValue, isClassBased)) {
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
            var initialValue_1 = hasInitial && !bindingValueContainsInitial ? getInitialStylingValue(context) : null;
            var valueToApply = writeStylingValueDirectly(renderer, element, value, isClassBased, initialValue_1);
            setValue(data, cachedValueIndex, valueToApply || null);
        }
        else {
            var applyFn = isClassBased ? setClass : setStyle;
            var map = normalizeIntoStylingMap(oldValue, value, !isClassBased);
            var initialStyles = hasInitial ? getStylingMapArray(context) : null;
            for (var i = 1 /* ValuesStartPosition */; i < map.length; i += 2 /* TupleSize */) {
                var prop = getMapProp(map, i);
                var value_1 = getMapValue(map, i);
                // case 1: apply the map value (if it exists)
                var applied = applyStylingValue(renderer, element, prop, value_1, applyFn, bindingIndex, sanitizer);
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
        }
    }
}
export function writeStylingValueDirectly(renderer, element, value, isClassBased, initialValue) {
    var valueToApply;
    if (isClassBased) {
        valueToApply = typeof value === 'string' ? value : objectToClassName(value);
        if (initialValue !== null) {
            valueToApply = concatString(initialValue, valueToApply, ' ');
        }
        setClassName(renderer, element, valueToApply);
    }
    else {
        valueToApply = forceStylesAsString(value, true);
        if (initialValue !== null) {
            valueToApply = initialValue + ';' + valueToApply;
        }
        setStyleAttr(renderer, element, valueToApply);
    }
    return valueToApply;
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
export function applyStylingValueDirectly(renderer, context, element, data, bindingIndex, prop, value, isClassBased, sanitizer) {
    var applied = false;
    if (hasValueChanged(data[bindingIndex], value)) {
        setValue(data, bindingIndex, value);
        var applyFn = isClassBased ? setClass : setStyle;
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
export var setClassName = function (renderer, native, className) {
    if (renderer !== null) {
        if (isProceduralRenderer(renderer)) {
            renderer.setAttribute(native, 'class', className);
        }
        else {
            native.className = className;
        }
    }
};
export var setStyleAttr = function (renderer, native, value) {
    if (renderer !== null) {
        if (isProceduralRenderer(renderer)) {
            renderer.setAttribute(native, 'style', value);
        }
        else {
            native.setAttribute('style', value);
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
function objectToClassName(obj) {
    var str = '';
    if (obj) {
        for (var key in obj) {
            var value = obj[key];
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
 * @returns true when the value was modified externally.
 */
function checkIfExternallyModified(element, cachedValue, isClassBased) {
    // this means it was checked before and there is no reason
    // to compare the style/class values again. Either that or
    // web workers are being used.
    if (global.Node === 'undefined' || cachedValue === VALUE_IS_EXTERNALLY_MODIFIED)
        return true;
    // comparing the DOM value against the cached value is the best way to
    // see if something has changed.
    var currentValue = (isClassBased ? element.className : (element.style && element.style.cssText)) || '';
    return currentValue !== (cachedValue || '');
}
/**
 * Removes provided styling values from the element
 */
function removeStylingValues(renderer, element, values, isClassBased) {
    var arr;
    if (isStylingMapArray(values)) {
        arr = values;
    }
    else {
        arr = normalizeIntoStylingMap(null, values, !isClassBased);
    }
    var applyFn = isClassBased ? setClass : setStyle;
    for (var i = 1 /* ValuesStartPosition */; i < arr.length; i += 2 /* TupleSize */) {
        var value = getMapValue(arr, i);
        if (value) {
            var prop = getMapProp(arr, i);
            applyFn(renderer, element, prop, false);
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmluZGluZ3MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL3N0eWxpbmcvYmluZGluZ3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztFQU1FO0FBQ0YsT0FBTyxFQUFZLGVBQWUsRUFBQyxNQUFNLDJCQUEyQixDQUFDO0FBRXJFLE9BQU8sRUFBQyxNQUFNLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUN6QyxPQUFPLEVBQTJDLG1CQUFtQixFQUFFLG9CQUFvQixFQUFDLE1BQU0sd0JBQXdCLENBQUM7QUFFM0gsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLFdBQVcsQ0FBQztBQUNwQyxPQUFPLEVBQUMscUJBQXFCLEVBQUUscUJBQXFCLEVBQUUsd0JBQXdCLEVBQUUseUJBQXlCLEVBQUUsd0JBQXdCLEVBQUUsWUFBWSxFQUFFLG1CQUFtQixFQUFFLGVBQWUsRUFBRSxTQUFTLEVBQUUsZUFBZSxFQUFFLFlBQVksRUFBRSxzQkFBc0IsRUFBRSxVQUFVLEVBQUUsV0FBVyxFQUFFLE9BQU8sRUFBRSwwQkFBMEIsRUFBRSxrQkFBa0IsRUFBRSxlQUFlLEVBQUUsUUFBUSxFQUFFLGNBQWMsRUFBRSxTQUFTLEVBQUUsZUFBZSxFQUFFLG1CQUFtQixFQUFFLHNCQUFzQixFQUFFLGlCQUFpQixFQUFFLHFCQUFxQixFQUFFLHVCQUF1QixFQUFFLFdBQVcsRUFBRSxlQUFlLEVBQUUsWUFBWSxFQUFFLGFBQWEsRUFBRSxRQUFRLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUV0bUIsT0FBTyxFQUFDLGVBQWUsRUFBRSxpQkFBaUIsRUFBQyxNQUFNLFNBQVMsQ0FBQztBQUUzRCxJQUFNLDRCQUE0QixHQUFHLEVBQUUsQ0FBQztBQUV4Qzs7Ozs7Ozs7Ozs7Ozs7Ozs7R0FpQkc7QUFFSDs7OztHQUlHO0FBQ0gsSUFBTSw2QkFBNkIsR0FBRyxDQUFD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IEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbipcbiogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuKi9cbmltcG9ydCB7U2FmZVZhbHVlLCB1bndyYXBTYWZlVmFsdWV9IGZyb20gJy4uLy4uL3Nhbml0aXphdGlvbi9ieXBhc3MnO1xuaW1wb3J0IHtTdHlsZVNhbml0aXplRm4sIFN0eWxlU2FuaXRpemVNb2RlfSBmcm9tICcuLi8uLi9zYW5pdGl6YXRpb24vc3R5bGVfc2FuaXRpemVyJztcbmltcG9ydCB7Z2xvYmFsfSBmcm9tICcuLi8uLi91dGlsL2dsb2JhbCc7XG5pbXBvcnQge1Byb2NlZHVyYWxSZW5kZXJlcjMsIFJFbGVtZW50LCBSZW5kZXJlcjMsIFJlbmRlcmVyU3R5bGVGbGFnczMsIGlzUHJvY2VkdXJhbFJlbmRlcmVyfSBmcm9tICcuLi9pbnRlcmZhY2VzL3JlbmRlcmVyJztcbmltcG9ydCB7QXBwbHlTdHlsaW5nRm4sIExTdHlsaW5nRGF0YSwgU3R5bGluZ01hcEFycmF5LCBTdHlsaW5nTWFwQXJyYXlJbmRleCwgU3R5bGluZ01hcHNTeW5jTW9kZSwgU3luY1N0eWxpbmdNYXBzRm4sIFRTdHlsaW5nQ29uZmlnLCBUU3R5bGluZ0NvbnRleHQsIFRTdHlsaW5nQ29udGV4dEluZGV4LCBUU3R5bGluZ0NvbnRleHRQcm9wQ29uZmlnRmxhZ3N9IGZyb20gJy4uL2ludGVyZmFjZXMvc3R5bGluZyc7XG5pbXBvcnQge05PX0NIQU5HRX0gZnJvbSAnLi4vdG9rZW5zJztcbmltcG9ydCB7REVGQVVMVF9CSU5ESU5HX0lOREVYLCBERUZBVUxUX0JJTkRJTkdfVkFMVUUsIERFRkFVTFRfR1VBUkRfTUFTS19WQUxVRSwgTUFQX0JBU0VEX0VOVFJZX1BST1BfTkFNRSwgVEVNUExBVEVfRElSRUNUSVZFX0lOREVYLCBjb25jYXRTdHJpbmcsIGZvcmNlU3R5bGVzQXNTdHJpbmcsIGdldEJpbmRpbmdWYWx1ZSwgZ2V0Q29uZmlnLCBnZXREZWZhdWx0VmFsdWUsIGdldEd1YXJkTWFzaywgZ2V0SW5pdGlhbFN0eWxpbmdWYWx1ZSwgZ2V0TWFwUHJvcCwgZ2V0TWFwVmFsdWUsIGdldFByb3AsIGdldFByb3BWYWx1ZXNTdGFydFBvc2l0aW9uLCBnZXRTdHlsaW5nTWFwQXJyYXksIGdldFRvdGFsU291cmNlcywgZ2V0VmFsdWUsIGdldFZhbHVlc0NvdW50LCBoYXNDb25maWcsIGhhc1ZhbHVlQ2hhbmdlZCwgaXNIb3N0U3R5bGluZ0FjdGl2ZSwgaXNTYW5pdGl6YXRpb25SZXF1aXJlZCwgaXNTdHlsaW5nTWFwQXJyYXksIGlzU3R5bGluZ1ZhbHVlRGVmaW5lZCwgbm9ybWFsaXplSW50b1N0eWxpbmdNYXAsIHBhdGNoQ29uZmlnLCBzZXREZWZhdWx0VmFsdWUsIHNldEd1YXJkTWFzaywgc2V0TWFwQXNEaXJ0eSwgc2V0VmFsdWV9IGZyb20gJy4uL3V0aWwvc3R5bGluZ191dGlscyc7XG5cbmltcG9ydCB7Z2V0U3R5bGluZ1N0YXRlLCByZXNldFN0eWxpbmdTdGF0ZX0gZnJvbSAnLi9zdGF0ZSc7XG5cbmNvbnN0IFZBTFVFX0lTX0VYVEVSTkFMTFlfTU9ESUZJRUQgPSB7fTtcblxuLyoqXG4gKiAtLS0tLS0tLVxuICpcbiAqIFRoaXMgZmlsZSBjb250YWlucyB0aGUgY29yZSBsb2dpYyBmb3Igc3R5bGluZyBpbiBBbmd1bGFyLlxuICpcbiAqIEFsbCBzdHlsaW5nIGJpbmRpbmdzIChpLmUuIGBbc3R5bGVdYCwgYFtzdHlsZS5wcm9wXWAsIGBbY2xhc3NdYCBhbmQgYFtjbGFzcy5uYW1lXWApXG4gKiB3aWxsIGhhdmUgdGhlaXIgdmFsdWVzIGJlIGFwcGxpZWQgdGhyb3VnaCB0aGUgbG9naWMgaW4gdGhpcyBmaWxlLlxuICpcbiAqIFdoZW4gYSBiaW5kaW5nIGlzIGVuY291bnRlcmVkIChlLmcuIGA8ZGl2IFtzdHlsZS53aWR0aF09XCJ3XCI+YCkgdGhlblxuICogdGhlIGJpbmRpbmcgZGF0YSB3aWxsIGJlIHBvcHVsYXRlZCBpbnRvIGEgYFRTdHlsaW5nQ29udGV4dGAgZGF0YS1zdHJ1Y3R1cmUuXG4gKiBUaGVyZSBpcyBvbmx5IG9uZSBgVFN0eWxpbmdDb250ZXh0YCBwZXIgYFROb2RlYCBhbmQgZWFjaCBlbGVtZW50IGluc3RhbmNlXG4gKiB3aWxsIHVwZGF0ZSBpdHMgc3R5bGUvY2xhc3MgYmluZGluZyB2YWx1ZXMgaW4gY29uY2VydCB3aXRoIHRoZSBzdHlsaW5nXG4gKiBjb250ZXh0LlxuICpcbiAqIFRvIGxlYXJuIG1vcmUgYWJvdXQgdGhlIGFsZ29yaXRobSBzZWUgYFRTdHlsaW5nQ29udGV4dGAuXG4gKlxuICogLS0tLS0tLS1cbiAqL1xuXG4vKipcbiAqIFRoZSBndWFyZC91cGRhdGUgbWFzayBiaXQgaW5kZXggbG9jYXRpb24gZm9yIG1hcC1iYXNlZCBiaW5kaW5ncy5cbiAqXG4gKiBBbGwgbWFwLWJhc2VkIGJpbmRpbmdzIChpLmUuIGBbc3R5bGVdYCBhbmQgYFtjbGFzc11gIClcbiAqL1xuY29uc3QgU1RZTElOR19JTkRFWF9GT1JfTUFQX0JJTkRJTkcgPSAwO1xuXG4vKipcbiAqIFZpc2l0cyBhIGNsYXNzLWJhc2VkIGJpbmRpbmcgYW5kIHVwZGF0ZXMgdGhlIG5ldyB2YWx1ZSAoaWYgY2hhbmdlZCkuXG4gKlxuICogVGhpcyBmdW5jdGlvbiBpcyBjYWxsZWQgZWFjaCB0aW1lIGEgY2xhc3MtYmFzZWQgc3R5bGluZyBpbnN0cnVjdGlvblxuICogaXMgZXhlY3V0ZWQuIEl0J3MgaW1wb3J0YW50IHRoYXQgaXQncyBhbHdheXMgY2FsbGVkIChldmVuIGlmIHRoZSB2YWx1ZVxuICogaGFzIG5vdCBjaGFuZ2VkKSBzbyB0aGF0IHRoZSBpbm5lciBjb3VudGVyIGluZGV4IHZhbHVlIGlzIGluY3JlbWVudGVkLlxuICogVGhpcyB3YXksIGVhY2ggaW5zdHJ1Y3Rpb24gaXMgYWx3YXlzIGd1YXJhbnRlZWQgdG8gZ2V0IHRoZSBzYW1lIGNvdW50ZXJcbiAqIHN0YXRlIGVhY2ggdGltZSBpdCdzIGNhbGxlZCAod2hpY2ggdGhlbiBhbGxvd3MgdGhlIGBUU3R5bGluZ0NvbnRleHRgXG4gKiBhbmQgdGhlIGJpdCBtYXNrIHZhbHVlcyB0byBiZSBpbiBzeW5jKS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHVwZGF0ZUNsYXNzVmlhQ29udGV4dChcbiAgICBjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQsIGRhdGE6IExTdHlsaW5nRGF0YSwgZWxlbWVudDogUkVsZW1lbnQsIGRpcmVjdGl2ZUluZGV4OiBudW1iZXIsXG4gICAgcHJvcDogc3RyaW5nIHwgbnVsbCwgYmluZGluZ0luZGV4OiBudW1iZXIsXG4gICAgdmFsdWU6IGJvb2xlYW4gfCBzdHJpbmcgfCBudWxsIHwgdW5kZWZpbmVkIHwgU3R5bGluZ01hcEFycmF5IHwgTk9fQ0hBTkdFLCBmb3JjZVVwZGF0ZTogYm9vbGVhbixcbiAgICBmaXJzdFVwZGF0ZVBhc3M6IGJvb2xlYW4pOiBib29sZWFuIHtcbiAgY29uc3QgaXNNYXBCYXNlZCA9ICFwcm9wO1xuICBjb25zdCBzdGF0ZSA9IGdldFN0eWxpbmdTdGF0ZShlbGVtZW50LCBkaXJlY3RpdmVJbmRleCk7XG4gIGNvbnN0IGNvdW50SW5kZXggPSBpc01hcEJhc2VkID8gU1RZTElOR19JTkRFWF9GT1JfTUFQX0JJTkRJTkcgOiBzdGF0ZS5jbGFzc2VzSW5kZXgrKztcblxuICAvLyBldmVuIGlmIHRoZSBpbml0aWFsIHZhbHVlIGlzIGEgYE5PX0NIQU5HRWAgdmFsdWUgKGUuZy4gaW50ZXJwb2xhdGlvbiBvciBbbmdDbGFzc10pXG4gIC8vIHRoZW4gd2Ugc3RpbGwgbmVlZCB0byByZWdpc3RlciB0aGUgYmluZGluZyB3aXRoaW4gdGhlIGNvbnRleHQgc28gdGhhdCB0aGUgY29udGV4dFxuICAvLyBpcyBhd2FyZSBvZiB0aGUgYmluZGluZyBldmVuIGlmIHRoaW5ncyBjaGFuZ2UgYWZ0ZXIgdGhlIGZpcnN0IHVwZGF0ZSBwYXNzLlxuICBpZiAoZmlyc3RVcGRhdGVQYXNzIHx8IHZhbHVlICE9PSBOT19DSEFOR0UpIHtcbiAgICBjb25zdCB1cGRhdGVkID0gdXBkYXRlQmluZGluZ0RhdGEoXG4gICAgICAgIGNvbnRleHQsIGRhdGEsIGNvdW50SW5kZXgsIHN0YXRlLnNvdXJjZUluZGV4LCBwcm9wLCBiaW5kaW5nSW5kZXgsIHZhbHVlLCBmb3JjZVVwZGF0ZSwgZmFsc2UsXG4gICAgICAgIGZpcnN0VXBkYXRlUGFzcyk7XG4gICAgaWYgKHVwZGF0ZWQgfHwgZm9yY2VVcGRhdGUpIHtcbiAgICAgIC8vIFdlIGZsaXAgdGhlIGJpdCBpbiB0aGUgYml0TWFzayB0byByZWZsZWN0IHRoYXQgdGhlIGJpbmRpbmdcbiAgICAgIC8vIGF0IHRoZSBgaW5kZXhgIHNsb3QgaGFzIGNoYW5nZWQuIFRoaXMgaWRlbnRpZmllcyB0byB0aGUgZmx1c2hpbmdcbiAgICAgIC8vIHBoYXNlIHRoYXQgdGhlIGJpbmRpbmdzIGZvciB0aGlzIHBhcnRpY3VsYXIgQ1NTIGNsYXNzIG5lZWQgdG8gYmVcbiAgICAgIC8vIGFwcGxpZWQgYWdhaW4gYmVjYXVzZSBvbiBvciBtb3JlIG9mIHRoZSBiaW5kaW5ncyBmb3IgdGhlIENTU1xuICAgICAgLy8gY2xhc3MgaGF2ZSBjaGFuZ2VkLlxuICAgICAgc3RhdGUuY2xhc3Nlc0JpdE1hc2sgfD0gMSA8PCBjb3VudEluZGV4O1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9XG4gIHJldHVybiBmYWxzZTtcbn1cblxuLyoqXG4gKiBWaXNpdHMgYSBzdHlsZS1iYXNlZCBiaW5kaW5nIGFuZCB1cGRhdGVzIHRoZSBuZXcgdmFsdWUgKGlmIGNoYW5nZWQpLlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gaXMgY2FsbGVkIGVhY2ggdGltZSBhIHN0eWxlLWJhc2VkIHN0eWxpbmcgaW5zdHJ1Y3Rpb25cbiAqIGlzIGV4ZWN1dGVkLiBJdCdzIGltcG9ydGFudCB0aGF0IGl0J3MgYWx3YXlzIGNhbGxlZCAoZXZlbiBpZiB0aGUgdmFsdWVcbiAqIGhhcyBub3QgY2hhbmdlZCkgc28gdGhhdCB0aGUgaW5uZXIgY291bnRlciBpbmRleCB2YWx1ZSBpcyBpbmNyZW1lbnRlZC5cbiAqIFRoaXMgd2F5LCBlYWNoIGluc3RydWN0aW9uIGlzIGFsd2F5cyBndWFyYW50ZWVkIHRvIGdldCB0aGUgc2FtZSBjb3VudGVyXG4gKiBzdGF0ZSBlYWNoIHRpbWUgaXQncyBjYWxsZWQgKHdoaWNoIHRoZW4gYWxsb3dzIHRoZSBgVFN0eWxpbmdDb250ZXh0YFxuICogYW5kIHRoZSBiaXQgbWFzayB2YWx1ZXMgdG8gYmUgaW4gc3luYykuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB1cGRhdGVTdHlsZVZpYUNvbnRleHQoXG4gICAgY29udGV4dDogVFN0eWxpbmdDb250ZXh0LCBkYXRhOiBMU3R5bGluZ0RhdGEsIGVsZW1lbnQ6IFJFbGVtZW50LCBkaXJlY3RpdmVJbmRleDogbnVtYmVyLFxuICAgIHByb3A6IHN0cmluZyB8IG51bGwsIGJpbmRpbmdJbmRleDogbnVtYmVyLFxuICAgIHZhbHVlOiBzdHJpbmcgfCBudW1iZXIgfCBTYWZlVmFsdWUgfCBudWxsIHwgdW5kZWZpbmVkIHwgU3R5bGluZ01hcEFycmF5IHwgTk9fQ0hBTkdFLFxuICAgIHNhbml0aXplcjogU3R5bGVTYW5pdGl6ZUZuIHwgbnVsbCwgZm9yY2VVcGRhdGU6IGJvb2xlYW4sIGZpcnN0VXBkYXRlUGFzczogYm9vbGVhbik6IGJvb2xlYW4ge1xuICBjb25zdCBpc01hcEJhc2VkID0gIXByb3A7XG4gIGNvbnN0IHN0YXRlID0gZ2V0U3R5bGluZ1N0YXRlKGVsZW1lbnQsIGRpcmVjdGl2ZUluZGV4KTtcbiAgY29uc3QgY291bnRJbmRleCA9IGlzTWFwQmFzZWQgPyBTVFlMSU5HX0lOREVYX0ZPUl9NQVBfQklORElORyA6IHN0YXRlLnN0eWxlc0luZGV4Kys7XG5cbiAgLy8gZXZlbiBpZiB0aGUgaW5pdGlhbCB2YWx1ZSBpcyBhIGBOT19DSEFOR0VgIHZhbHVlIChlLmcuIGludGVycG9sYXRpb24gb3IgW25nU3R5bGVdKVxuICAvLyB0aGVuIHdlIHN0aWxsIG5lZWQgdG8gcmVnaXN0ZXIgdGhlIGJpbmRpbmcgd2l0aGluIHRoZSBjb250ZXh0IHNvIHRoYXQgdGhlIGNvbnRleHRcbiAgLy8gaXMgYXdhcmUgb2YgdGhlIGJpbmRpbmcgZXZlbiBpZiB0aGluZ3MgY2hhbmdlIGFmdGVyIHRoZSBmaXJzdCB1cGRhdGUgcGFzcy5cbiAgaWYgKGZpcnN0VXBkYXRlUGFzcyB8fCB2YWx1ZSAhPT0gTk9fQ0hBTkdFKSB7XG4gICAgY29uc3Qgc2FuaXRpemF0aW9uUmVxdWlyZWQgPSBpc01hcEJhc2VkID9cbiAgICAgICAgdHJ1ZSA6XG4gICAgICAgIChzYW5pdGl6ZXIgPyBzYW5pdGl6ZXIocHJvcCAhLCBudWxsLCBTdHlsZVNhbml0aXplTW9kZS5WYWxpZGF0ZVByb3BlcnR5KSA6IGZhbHNlKTtcbiAgICBjb25zdCB1cGRhdGVkID0gdXBkYXRlQmluZGluZ0RhdGEoXG4gICAgICAgIGNvbnRleHQsIGRhdGEsIGNvdW50SW5kZXgsIHN0YXRlLnNvdXJjZUluZGV4LCBwcm9wLCBiaW5kaW5nSW5kZXgsIHZhbHVlLCBmb3JjZVVwZGF0ZSxcbiAgICAgICAgc2FuaXRpemF0aW9uUmVxdWlyZWQsIGZpcnN0VXBkYXRlUGFzcyk7XG4gICAgaWYgKHVwZGF0ZWQgfHwgZm9yY2VVcGRhdGUpIHtcbiAgICAgIC8vIFdlIGZsaXAgdGhlIGJpdCBpbiB0aGUgYml0TWFzayB0byByZWZsZWN0IHRoYXQgdGhlIGJpbmRpbmdcbiAgICAgIC8vIGF0IHRoZSBgaW5kZXhgIHNsb3QgaGFzIGNoYW5nZWQuIFRoaXMgaWRlbnRpZmllcyB0byB0aGUgZmx1c2hpbmdcbiAgICAgIC8vIHBoYXNlIHRoYXQgdGhlIGJpbmRpbmdzIGZvciB0aGlzIHBhcnRpY3VsYXIgcHJvcGVydHkgbmVlZCB0byBiZVxuICAgICAgLy8gYXBwbGllZCBhZ2FpbiBiZWNhdXNlIG9uIG9yIG1vcmUgb2YgdGhlIGJpbmRpbmdzIGZvciB0aGUgQ1NTXG4gICAgICAvLyBwcm9wZXJ0eSBoYXZlIGNoYW5nZWQuXG4gICAgICBzdGF0ZS5zdHlsZXNCaXRNYXNrIHw9IDEgPDwgY291bnRJbmRleDtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgfVxuICByZXR1cm4gZmFsc2U7XG59XG5cbi8qKlxuICogQ2FsbGVkIGVhY2ggdGltZSBhIGJpbmRpbmcgdmFsdWUgaGFzIGNoYW5nZWQgd2l0aGluIHRoZSBwcm92aWRlZCBgVFN0eWxpbmdDb250ZXh0YC5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIGlzIGRlc2lnbmVkIHRvIGJlIGNhbGxlZCBmcm9tIGB1cGRhdGVTdHlsZUJpbmRpbmdgIGFuZCBgdXBkYXRlQ2xhc3NCaW5kaW5nYC5cbiAqIElmIGNhbGxlZCBkdXJpbmcgdGhlIGZpcnN0IHVwZGF0ZSBwYXNzLCB0aGUgYmluZGluZyB3aWxsIGJlIHJlZ2lzdGVyZWQgaW4gdGhlIGNvbnRleHQuXG4gKlxuICogVGhpcyBmdW5jdGlvbiB3aWxsIGFsc28gdXBkYXRlIGJpbmRpbmcgc2xvdCBpbiB0aGUgcHJvdmlkZWQgYExTdHlsaW5nRGF0YWAgd2l0aCB0aGVcbiAqIG5ldyBiaW5kaW5nIGVudHJ5IChpZiBpdCBoYXMgY2hhbmdlZCkuXG4gKlxuICogQHJldHVybnMgd2hldGhlciBvciBub3QgdGhlIGJpbmRpbmcgdmFsdWUgd2FzIHVwZGF0ZWQgaW4gdGhlIGBMU3R5bGluZ0RhdGFgLlxuICovXG5mdW5jdGlvbiB1cGRhdGVCaW5kaW5nRGF0YShcbiAgICBjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQsIGRhdGE6IExTdHlsaW5nRGF0YSwgY291bnRlckluZGV4OiBudW1iZXIsIHNvdXJjZUluZGV4OiBudW1iZXIsXG4gICAgcHJvcDogc3RyaW5nIHwgbnVsbCwgYmluZGluZ0luZGV4OiBudW1iZXIsXG4gICAgdmFsdWU6IHN0cmluZyB8IFNhZmVWYWx1ZSB8IG51bWJlciB8IGJvb2xlYW4gfCBudWxsIHwgdW5kZWZpbmVkIHwgU3R5bGluZ01hcEFycmF5LFxuICAgIGZvcmNlVXBkYXRlOiBib29sZWFuLCBzYW5pdGl6YXRpb25SZXF1aXJlZDogYm9vbGVhbiwgZmlyc3RVcGRhdGVQYXNzOiBib29sZWFuKTogYm9vbGVhbiB7XG4gIGNvbnN0IGhvc3RCaW5kaW5nc01vZGUgPSBpc0hvc3RTdHlsaW5nQWN0aXZlKHNvdXJjZUluZGV4KTtcbiAgaWYgKGZpcnN0VXBkYXRlUGFzcykge1xuICAgIC8vIHRoaXMgd2lsbCBvbmx5IGhhcHBlbiBkdXJpbmcgdGhlIGZpcnN0IHVwZGF0ZSBwYXNzIG9mIHRoZVxuICAgIC8vIGNvbnRleHQuIFRoZSByZWFzb24gd2h5IHdlIGNhbid0IHVzZSBgdFZpZXcuZmlyc3RDcmVhdGVQYXNzYFxuICAgIC8vIGhlcmUgaXMgYmVjYXVzZSBpdHMgbm90IGd1YXJhbnRlZWQgdG8gYmUgdHJ1ZSB3aGVuIHRoZSBmaXJzdFxuICAgIC8vIHVwZGF0ZSBwYXNzIGlzIGV4ZWN1dGVkIChyZW1lbWJlciB0aGF0IGFsbCBzdHlsaW5nIGluc3RydWN0aW9uc1xuICAgIC8vIGFyZSBydW4gaW4gdGhlIHVwZGF0ZSBwaGFzZSwgYW5kLCBhcyBhIHJlc3VsdCwgYXJlIG5vIG1vcmVcbiAgICAvLyBzdHlsaW5nIGluc3RydWN0aW9ucyB0aGF0IGFyZSBydW4gaW4gdGhlIGNyZWF0aW9uIHBoYXNlKS5cbiAgICByZWdpc3RlckJpbmRpbmcoY29udGV4dCwgY291bnRlckluZGV4LCBzb3VyY2VJbmRleCwgcHJvcCwgYmluZGluZ0luZGV4LCBzYW5pdGl6YXRpb25SZXF1aXJlZCk7XG4gICAgcGF0Y2hDb25maWcoXG4gICAgICAgIGNvbnRleHQsXG4gICAgICAgIGhvc3RCaW5kaW5nc01vZGUgPyBUU3R5bGluZ0NvbmZpZy5IYXNIb3N0QmluZGluZ3MgOiBUU3R5bGluZ0NvbmZpZy5IYXNUZW1wbGF0ZUJpbmRpbmdzKTtcbiAgfVxuXG4gIGNvbnN0IGNoYW5nZWQgPSBmb3JjZVVwZGF0ZSB8fCBoYXNWYWx1ZUNoYW5nZWQoZGF0YVtiaW5kaW5nSW5kZXhdLCB2YWx1ZSk7XG4gIGlmIChjaGFuZ2VkKSB7XG4gICAgc2V0VmFsdWUoZGF0YSwgYmluZGluZ0luZGV4LCB2YWx1ZSk7XG4gICAgY29uc3QgZG9TZXRWYWx1ZXNBc1N0YWxlID0gKGdldENvbmZpZyhjb250ZXh0KSAmIFRTdHlsaW5nQ29uZmlnLkhhc0hvc3RCaW5kaW5ncykgJiZcbiAgICAgICAgIWhvc3RCaW5kaW5nc01vZGUgJiYgKHByb3AgPyAhdmFsdWUgOiB0cnVlKTtcbiAgICBpZiAoZG9TZXRWYWx1ZXNBc1N0YWxlKSB7XG4gICAgICByZW5kZXJIb3N0QmluZGluZ3NBc1N0YWxlKGNvbnRleHQsIGRhdGEsIHByb3ApO1xuICAgIH1cbiAgfVxuICByZXR1cm4gY2hhbmdlZDtcbn1cblxuLyoqXG4gKiBJdGVyYXRlcyBvdmVyIGFsbCBob3N0LWJpbmRpbmcgdmFsdWVzIGZvciB0aGUgZ2l2ZW4gYHByb3BgIHZhbHVlIGluIHRoZSBjb250ZXh0IGFuZCBzZXRzIHRoZWlyXG4gKiBjb3JyZXNwb25kaW5nIGJpbmRpbmcgdmFsdWVzIHRvIGBudWxsYC5cbiAqXG4gKiBXaGVuZXZlciBhIHRlbXBsYXRlIGJpbmRpbmcgY2hhbmdlcyBpdHMgdmFsdWUgdG8gYG51bGxgLCBhbGwgaG9zdC1iaW5kaW5nIHZhbHVlcyBzaG91bGQgYmVcbiAqIHJlLWFwcGxpZWRcbiAqIHRvIHRoZSBlbGVtZW50IHdoZW4gdGhlIGhvc3QgYmluZGluZ3MgYXJlIGV2YWx1YXRlZC4gVGhpcyBtYXkgbm90IGFsd2F5cyBoYXBwZW4gaW4gdGhlIGV2ZW50XG4gKiB0aGF0IG5vbmUgb2YgdGhlIGJpbmRpbmdzIGNoYW5nZWQgd2l0aGluIHRoZSBob3N0IGJpbmRpbmdzIGNvZGUuIEZvciB0aGlzIHJlYXNvbiB0aGlzIGZ1bmN0aW9uXG4gKiBpcyBleHBlY3RlZCB0byBiZSBjYWxsZWQgZWFjaCB0aW1lIGEgdGVtcGxhdGUgYmluZGluZyBiZWNvbWVzIGZhbHN5IG9yIHdoZW4gYSBtYXAtYmFzZWQgdGVtcGxhdGVcbiAqIGJpbmRpbmcgY2hhbmdlcy5cbiAqL1xuZnVuY3Rpb24gcmVuZGVySG9zdEJpbmRpbmdzQXNTdGFsZShcbiAgICBjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQsIGRhdGE6IExTdHlsaW5nRGF0YSwgcHJvcDogc3RyaW5nIHwgbnVsbCk6IHZvaWQge1xuICBjb25zdCB2YWx1ZXNDb3VudCA9IGdldFZhbHVlc0NvdW50KGNvbnRleHQpO1xuXG4gIGlmIChwcm9wICE9PSBudWxsICYmIGhhc0NvbmZpZyhjb250ZXh0LCBUU3R5bGluZ0NvbmZpZy5IYXNQcm9wQmluZGluZ3MpKSB7XG4gICAgY29uc3QgaXRlbXNQZXJSb3cgPSBUU3R5bGluZ0NvbnRleHRJbmRleC5CaW5kaW5nc1N0YXJ0T2Zmc2V0ICsgdmFsdWVzQ291bnQ7XG5cbiAgICBsZXQgaSA9IFRTdHlsaW5nQ29udGV4dEluZGV4LlZhbHVlc1N0YXJ0UG9zaXRpb247XG4gICAgbGV0IGZvdW5kID0gZmFsc2U7XG4gICAgd2hpbGUgKGkgPCBjb250ZXh0Lmxlbmd0aCkge1xuICAgICAgaWYgKGdldFByb3AoY29udGV4dCwgaSkgPT09IHByb3ApIHtcbiAgICAgICAgZm91bmQgPSB0cnVlO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGkgKz0gaXRlbXNQZXJSb3c7XG4gICAgfVxuXG4gICAgaWYgKGZvdW5kKSB7XG4gICAgICBjb25zdCBiaW5kaW5nc1N0YXJ0ID0gaSArIFRTdHlsaW5nQ29udGV4dEluZGV4LkJpbmRpbmdzU3RhcnRPZmZzZXQ7XG4gICAgICBjb25zdCB2YWx1ZXNTdGFydCA9IGJpbmRpbmdzU3RhcnQgKyAxOyAgLy8gdGhlIGZpcnN0IGNvbHVtbiBpcyB0ZW1wbGF0ZSBiaW5kaW5nc1xuICAgICAgY29uc3QgdmFsdWVzRW5kID0gYmluZGluZ3NTdGFydCArIHZhbHVlc0NvdW50IC0gMTtcblxuICAgICAgZm9yIChsZXQgaSA9IHZhbHVlc1N0YXJ0OyBpIDwgdmFsdWVzRW5kOyBpKyspIHtcbiAgICAgICAgY29uc3QgYmluZGluZ0luZGV4ID0gY29udGV4dFtpXSBhcyBudW1iZXI7XG4gICAgICAgIGlmIChiaW5kaW5nSW5kZXggIT09IDApIHtcbiAgICAgICAgICBzZXRWYWx1ZShkYXRhLCBiaW5kaW5nSW5kZXgsIG51bGwpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgaWYgKGhhc0NvbmZpZyhjb250ZXh0LCBUU3R5bGluZ0NvbmZpZy5IYXNNYXBCaW5kaW5ncykpIHtcbiAgICBjb25zdCBiaW5kaW5nc1N0YXJ0ID1cbiAgICAgICAgVFN0eWxpbmdDb250ZXh0SW5kZXguVmFsdWVzU3RhcnRQb3NpdGlvbiArIFRTdHlsaW5nQ29udGV4dEluZGV4LkJpbmRpbmdzU3RhcnRPZmZzZXQ7XG4gICAgY29uc3QgdmFsdWVzU3RhcnQgPSBiaW5kaW5nc1N0YXJ0ICsgMTsgIC8vIHRoZSBmaXJzdCBjb2x1bW4gaXMgdGVtcGxhdGUgYmluZGluZ3NcbiAgICBjb25zdCB2YWx1ZXNFbmQgPSBiaW5kaW5nc1N0YXJ0ICsgdmFsdWVzQ291bnQgLSAxO1xuICAgIGZvciAobGV0IGkgPSB2YWx1ZXNTdGFydDsgaSA8IHZhbHVlc0VuZDsgaSsrKSB7XG4gICAgICBjb25zdCBzdHlsaW5nTWFwID0gZ2V0VmFsdWU8U3R5bGluZ01hcEFycmF5PihkYXRhLCBjb250ZXh0W2ldIGFzIG51bWJlcik7XG4gICAgICBpZiAoc3R5bGluZ01hcCkge1xuICAgICAgICBzZXRNYXBBc0RpcnR5KHN0eWxpbmdNYXApO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIFJlZ2lzdGVycyB0aGUgcHJvdmlkZWQgYmluZGluZyAocHJvcCArIGJpbmRpbmdJbmRleCkgaW50byB0aGUgY29udGV4dC5cbiAqXG4gKiBJdCBpcyBuZWVkZWQgYmVjYXVzZSBpdCB3aWxsIGVpdGhlciB1cGRhdGUgb3IgaW5zZXJ0IGEgc3R5bGluZyBwcm9wZXJ0eVxuICogaW50byB0aGUgY29udGV4dCBhdCB0aGUgY29ycmVjdCBzcG90LlxuICpcbiAqIFdoZW4gY2FsbGVkLCBvbmUgb2YgdHdvIHRoaW5ncyB3aWxsIGhhcHBlbjpcbiAqXG4gKiAxKSBJZiB0aGUgcHJvcGVydHkgYWxyZWFkeSBleGlzdHMgaW4gdGhlIGNvbnRleHQgdGhlbiBpdCB3aWxsIGp1c3QgYWRkXG4gKiAgICB0aGUgcHJvdmlkZWQgYGJpbmRpbmdWYWx1ZWAgdG8gdGhlIGVuZCBvZiB0aGUgYmluZGluZyBzb3VyY2VzIHJlZ2lvblxuICogICAgZm9yIHRoYXQgcGFydGljdWxhciBwcm9wZXJ0eS5cbiAqXG4gKiAgICAtIElmIHRoZSBiaW5kaW5nIHZhbHVlIGlzIGEgbnVtYmVyIHRoZW4gaXQgd2lsbCBiZSBhZGRlZCBhcyBhIG5ld1xuICogICAgICBiaW5kaW5nIGluZGV4IHNvdXJjZSBuZXh0IHRvIHRoZSBvdGhlciBiaW5kaW5nIHNvdXJjZXMgZm9yIHRoZSBwcm9wZXJ0eS5cbiAqXG4gKiAgICAtIE90aGVyd2lzZSwgaWYgdGhlIGJpbmRpbmcgdmFsdWUgaXMgYSBzdHJpbmcvYm9vbGVhbi9udWxsIHR5cGUgdGhlbiBpdCB3aWxsXG4gKiAgICAgIHJlcGxhY2UgdGhlIGRlZmF1bHQgdmFsdWUgZm9yIHRoZSBwcm9wZXJ0eSBpZiB0aGUgZGVmYXVsdCB2YWx1ZSBpcyBgbnVsbGAuXG4gKlxuICogMikgSWYgdGhlIHByb3BlcnR5IGRvZXMgbm90IGV4aXN0IHRoZW4gaXQgd2lsbCBiZSBpbnNlcnRlZCBpbnRvIHRoZSBjb250ZXh0LlxuICogICAgVGhlIHN0eWxpbmcgY29udGV4dCByZWxpZXMgb24gYWxsIHByb3BlcnRpZXMgYmVpbmcgc3RvcmVkIGluIGFscGhhYmV0aWNhbFxuICogICAgb3JkZXIsIHNvIGl0IGtub3dzIGV4YWN0bHkgd2hlcmUgdG8gc3RvcmUgaXQuXG4gKlxuICogICAgV2hlbiBpbnNlcnRlZCwgYSBkZWZhdWx0IGBudWxsYCB2YWx1ZSBpcyBjcmVhdGVkIGZvciB0aGUgcHJvcGVydHkgd2hpY2ggZXhpc3RzXG4gKiAgICBhcyB0aGUgZGVmYXVsdCB2YWx1ZSBmb3IgdGhlIGJpbmRpbmcuIElmIHRoZSBiaW5kaW5nVmFsdWUgcHJvcGVydHkgaXMgaW5zZXJ0ZWRcbiAqICAgIGFuZCBpdCBpcyBlaXRoZXIgYSBzdHJpbmcsIG51bWJlciBvciBudWxsIHZhbHVlIHRoZW4gdGhhdCB3aWxsIHJlcGxhY2UgdGhlIGRlZmF1bHRcbiAqICAgIHZhbHVlLlxuICpcbiAqIE5vdGUgdGhhdCB0aGlzIGZ1bmN0aW9uIGlzIGFsc28gdXNlZCBmb3IgbWFwLWJhc2VkIHN0eWxpbmcgYmluZGluZ3MuIFRoZXkgYXJlIHRyZWF0ZWRcbiAqIG11Y2ggdGhlIHNhbWUgYXMgcHJvcC1iYXNlZCBiaW5kaW5ncywgYnV0LCB0aGVpciBwcm9wZXJ0eSBuYW1lIHZhbHVlIGlzIHNldCBhcyBgW01BUF1gLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVnaXN0ZXJCaW5kaW5nKFxuICAgIGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCwgY291bnRJZDogbnVtYmVyLCBzb3VyY2VJbmRleDogbnVtYmVyLCBwcm9wOiBzdHJpbmcgfCBudWxsLFxuICAgIGJpbmRpbmdWYWx1ZTogbnVtYmVyIHwgbnVsbCB8IHN0cmluZyB8IGJvb2xlYW4sIHNhbml0aXphdGlvblJlcXVpcmVkPzogYm9vbGVhbik6IHZvaWQge1xuICBsZXQgZm91bmQgPSBmYWxzZTtcbiAgcHJvcCA9IHByb3AgfHwgTUFQX0JBU0VEX0VOVFJZX1BST1BfTkFNRTtcblxuICBsZXQgdG90YWxTb3VyY2VzID0gZ2V0VG90YWxTb3VyY2VzKGNvbnRleHQpO1xuXG4gIC8vIGlmIGEgbmV3IHNvdXJjZSBpcyBkZXRlY3RlZCB0aGVuIGEgbmV3IGNvbHVtbiBuZWVkcyB0byBiZSBhbGxvY2F0ZWQgaW50b1xuICAvLyB0aGUgc3R5bGluZyBjb250ZXh0LiBUaGUgY29sdW1uIGlzIGJhc2ljYWxseSBhIG5ldyBhbGxvY2F0aW9uIG9mIGJpbmRpbmdcbiAgLy8gc291cmNlcyB0aGF0IHdpbGwgYmUgYXZhaWxhYmxlIHRvIGVhY2ggcHJvcGVydHkuXG4gIHdoaWxlICh0b3RhbFNvdXJjZXMgPD0gc291cmNlSW5kZXgpIHtcbiAgICBhZGROZXdTb3VyY2VDb2x1bW4oY29udGV4dCk7XG4gICAgdG90YWxTb3VyY2VzKys7XG4gIH1cblxuICBjb25zdCBpc0JpbmRpbmdJbmRleFZhbHVlID0gdHlwZW9mIGJpbmRpbmdWYWx1ZSA9PT0gJ251bWJlcic7XG4gIGNvbnN0IGVudHJpZXNQZXJSb3cgPSBUU3R5bGluZ0NvbnRleHRJbmRleC5CaW5kaW5nc1N0YXJ0T2Zmc2V0ICsgZ2V0VmFsdWVzQ291bnQoY29udGV4dCk7XG4gIGxldCBpID0gVFN0eWxpbmdDb250ZXh0SW5kZXguVmFsdWVzU3RhcnRQb3NpdGlvbjtcblxuICAvLyBhbGwgc3R5bGUvY2xhc3MgYmluZGluZ3MgYXJlIHNvcnRlZCBieSBwcm9wZXJ0eSBuYW1lXG4gIHdoaWxlIChpIDwgY29udGV4dC5sZW5ndGgpIHtcbiAgICBjb25zdCBwID0gZ2V0UHJvcChjb250ZXh0LCBpKTtcbiAgICBpZiAocHJvcCA8PSBwKSB7XG4gICAgICBpZiAocHJvcCA8IHApIHtcbiAgICAgICAgYWxsb2NhdGVOZXdDb250ZXh0RW50cnkoY29udGV4dCwgaSwgcHJvcCwgc2FuaXRpemF0aW9uUmVxdWlyZWQpO1xuICAgICAgfSBlbHNlIGlmIChpc0JpbmRpbmdJbmRleFZhbHVlKSB7XG4gICAgICAgIHBhdGNoQ29uZmlnKGNvbnRleHQsIFRTdHlsaW5nQ29uZmlnLkhhc0NvbGxpc2lvbnMpO1xuICAgICAgfVxuICAgICAgYWRkQmluZGluZ0ludG9Db250ZXh0KGNvbnRleHQsIGksIGJpbmRpbmdWYWx1ZSwgY291bnRJZCwgc291cmNlSW5kZXgpO1xuICAgICAgZm91bmQgPSB0cnVlO1xuICAgICAgYnJlYWs7XG4gICAgfVxuICAgIGkgKz0gZW50cmllc1BlclJvdztcbiAgfVxuXG4gIGlmICghZm91bmQpIHtcbiAgICBhbGxvY2F0ZU5ld0NvbnRleHRFbnRyeShjb250ZXh0LCBjb250ZXh0Lmxlbmd0aCwgcHJvcCwgc2FuaXRpemF0aW9uUmVxdWlyZWQpO1xuICAgIGFkZEJpbmRpbmdJbnRvQ29udGV4dChjb250ZXh0LCBpLCBiaW5kaW5nVmFsdWUsIGNvdW50SWQsIHNvdXJjZUluZGV4KTtcbiAgfVxufVxuXG4vKipcbiAqIEluc2VydHMgYSBuZXcgcm93IGludG8gdGhlIHByb3ZpZGVkIGBUU3R5bGluZ0NvbnRleHRgIGFuZCBhc3NpZ25zIHRoZSBwcm92aWRlZCBgcHJvcGAgdmFsdWUgYXNcbiAqIHRoZSBwcm9wZXJ0eSBlbnRyeS5cbiAqL1xuZnVuY3Rpb24gYWxsb2NhdGVOZXdDb250ZXh0RW50cnkoXG4gICAgY29udGV4dDogVFN0eWxpbmdDb250ZXh0LCBpbmRleDogbnVtYmVyLCBwcm9wOiBzdHJpbmcsIHNhbml0aXphdGlvblJlcXVpcmVkPzogYm9vbGVhbik6IHZvaWQge1xuICBjb25zdCBjb25maWcgPSBzYW5pdGl6YXRpb25SZXF1aXJlZCA/IFRTdHlsaW5nQ29udGV4dFByb3BDb25maWdGbGFncy5TYW5pdGl6YXRpb25SZXF1aXJlZCA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgVFN0eWxpbmdDb250ZXh0UHJvcENvbmZpZ0ZsYWdzLkRlZmF1bHQ7XG4gIGNvbnRleHQuc3BsaWNlKFxuICAgICAgaW5kZXgsIDAsXG4gICAgICBjb25maWcsICAgICAgICAgICAgICAgICAgICAvLyAxKSBjb25maWcgdmFsdWVcbiAgICAgIERFRkFVTFRfR1VBUkRfTUFTS19WQUxVRSwgIC8vIDIpIHRlbXBsYXRlIGJpdCBtYXNrXG4gICAgICBERUZBVUxUX0dVQVJEX01BU0tfVkFMVUUsICAvLyAzKSBob3N0IGJpbmRpbmdzIGJpdCBtYXNrXG4gICAgICBwcm9wLCAgICAgICAgICAgICAgICAgICAgICAvLyA0KSBwcm9wIHZhbHVlIChlLmcuIGB3aWR0aGAsIGBteUNsYXNzYCwgZXRjLi4uKVxuICAgICAgKTtcblxuICBpbmRleCArPSA0OyAgLy8gdGhlIDQgdmFsdWVzIGFib3ZlXG5cbiAgLy8gNS4uLikgZGVmYXVsdCBiaW5kaW5nIGluZGV4IGZvciB0aGUgdGVtcGxhdGUgdmFsdWVcbiAgLy8gZGVwZW5kaW5nIG9uIGhvdyBtYW55IHNvdXJjZXMgYWxyZWFkeSBleGlzdCBpbiB0aGUgY29udGV4dCxcbiAgLy8gbXVsdGlwbGUgZGVmYXVsdCBpbmRleCBlbnRyaWVzIG1heSBuZWVkIHRvIGJlIGluc2VydGVkIGZvclxuICAvLyB0aGUgbmV3IHZhbHVlIGluIHRoZSBjb250ZXh0LlxuICBjb25zdCB0b3RhbEJpbmRpbmdzUGVyRW50cnkgPSBnZXRUb3RhbFNvdXJjZXMoY29udGV4dCk7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgdG90YWxCaW5kaW5nc1BlckVudHJ5OyBpKyspIHtcbiAgICBjb250ZXh0LnNwbGljZShpbmRleCwgMCwgREVGQVVMVF9CSU5ESU5HX0lOREVYKTtcbiAgICBpbmRleCsrO1xuICB9XG5cbiAgLy8gNikgZGVmYXVsdCBiaW5kaW5nIHZhbHVlIGZvciB0aGUgbmV3IGVudHJ5XG4gIGNvbnRleHQuc3BsaWNlKGluZGV4LCAwLCBERUZBVUxUX0JJTkRJTkdfVkFMVUUpO1xufVxuXG4vKipcbiAqIEluc2VydHMgYSBuZXcgYmluZGluZyB2YWx1ZSBpbnRvIGEgc3R5bGluZyBwcm9wZXJ0eSB0dXBsZSBpbiB0aGUgYFRTdHlsaW5nQ29udGV4dGAuXG4gKlxuICogQSBiaW5kaW5nVmFsdWUgaXMgaW5zZXJ0ZWQgaW50byBhIGNvbnRleHQgZHVyaW5nIHRoZSBmaXJzdCB1cGRhdGUgcGFzc1xuICogb2YgYSB0ZW1wbGF0ZSBvciBob3N0IGJpbmRpbmdzIGZ1bmN0aW9uLiBXaGVuIHRoaXMgb2NjdXJzLCB0d28gdGhpbmdzXG4gKiBoYXBwZW46XG4gKlxuICogLSBJZiB0aGUgYmluZGluZ1ZhbHVlIHZhbHVlIGlzIGEgbnVtYmVyIHRoZW4gaXQgaXMgdHJlYXRlZCBhcyBhIGJpbmRpbmdJbmRleFxuICogICB2YWx1ZSAoYSBpbmRleCBpbiB0aGUgYExWaWV3YCkgYW5kIGl0IHdpbGwgYmUgaW5zZXJ0ZWQgbmV4dCB0byB0aGUgb3RoZXJcbiAqICAgYmluZGluZyBpbmRleCBlbnRyaWVzLlxuICpcbiAqIC0gT3RoZXJ3aXNlIHRoZSBiaW5kaW5nIHZhbHVlIHdpbGwgdXBkYXRlIHRoZSBkZWZhdWx0IHZhbHVlIGZvciB0aGUgcHJvcGVydHlcbiAqICAgYW5kIHRoaXMgd2lsbCBvbmx5IGhhcHBlbiBpZiB0aGUgZGVmYXVsdCB2YWx1ZSBpcyBgbnVsbGAuXG4gKi9cbmZ1bmN0aW9uIGFkZEJpbmRpbmdJbnRvQ29udGV4dChcbiAgICBjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQsIGluZGV4OiBudW1iZXIsIGJpbmRpbmdWYWx1ZTogbnVtYmVyIHwgc3RyaW5nIHwgYm9vbGVhbiB8IG51bGwsXG4gICAgYml0SW5kZXg6IG51bWJlciwgc291cmNlSW5kZXg6IG51bWJlcikge1xuICBpZiAodHlwZW9mIGJpbmRpbmdWYWx1ZSA9PT0gJ251bWJlcicpIHtcbiAgICBjb25zdCBob3N0QmluZGluZ3NNb2RlID0gaXNIb3N0U3R5bGluZ0FjdGl2ZShzb3VyY2VJbmRleCk7XG4gICAgY29uc3QgY2VsbEluZGV4ID0gaW5kZXggKyBUU3R5bGluZ0NvbnRleHRJbmRleC5CaW5kaW5nc1N0YXJ0T2Zmc2V0ICsgc291cmNlSW5kZXg7XG4gICAgY29udGV4dFtjZWxsSW5kZXhdID0gYmluZGluZ1ZhbHVlO1xuICAgIGNvbnN0IHVwZGF0ZWRCaXRNYXNrID0gZ2V0R3VhcmRNYXNrKGNvbnRleHQsIGluZGV4LCBob3N0QmluZGluZ3NNb2RlKSB8ICgxIDw8IGJpdEluZGV4KTtcbiAgICBzZXRHdWFyZE1hc2soY29udGV4dCwgaW5kZXgsIHVwZGF0ZWRCaXRNYXNrLCBob3N0QmluZGluZ3NNb2RlKTtcbiAgfSBlbHNlIGlmIChiaW5kaW5nVmFsdWUgIT09IG51bGwgJiYgZ2V0RGVmYXVsdFZhbHVlKGNvbnRleHQsIGluZGV4KSA9PT0gbnVsbCkge1xuICAgIHNldERlZmF1bHRWYWx1ZShjb250ZXh0LCBpbmRleCwgYmluZGluZ1ZhbHVlKTtcbiAgfVxufVxuXG4vKipcbiAqIFJlZ2lzdGVycyBhIG5ldyBjb2x1bW4gaW50byB0aGUgcHJvdmlkZWQgYFRTdHlsaW5nQ29udGV4dGAuXG4gKlxuICogSWYgYW5kIHdoZW4gYSBuZXcgc291cmNlIGlzIGRldGVjdGVkIHRoZW4gYSBuZXcgY29sdW1uIG5lZWRzIHRvXG4gKiBiZSBhbGxvY2F0ZWQgaW50byB0aGUgc3R5bGluZyBjb250ZXh0LiBUaGUgY29sdW1uIGlzIGJhc2ljYWxseVxuICogYSBuZXcgYWxsb2NhdGlvbiBvZiBiaW5kaW5nIHNvdXJjZXMgdGhhdCB3aWxsIGJlIGF2YWlsYWJsZSB0byBlYWNoXG4gKiBwcm9wZXJ0eS5cbiAqXG4gKiBFYWNoIGNvbHVtbiB0aGF0IGV4aXN0cyBpbiB0aGUgc3R5bGluZyBjb250ZXh0IHJlc2VtYmxlcyBhIHN0eWxpbmdcbiAqIHNvdXJjZS4gQSBzdHlsaW5nIHNvdXJjZSBhbiBlaXRoZXIgYmUgdGhlIHRlbXBsYXRlIG9yIG9uZSBvciBtb3JlXG4gKiBjb21wb25lbnRzIG9yIGRpcmVjdGl2ZXMgYWxsIGNvbnRhaW5pbmcgc3R5bGluZyBob3N0IGJpbmRpbmdzLlxuICovXG5mdW5jdGlvbiBhZGROZXdTb3VyY2VDb2x1bW4oY29udGV4dDogVFN0eWxpbmdDb250ZXh0KTogdm9pZCB7XG4gIC8vIHdlIHVzZSAtMSBoZXJlIGJlY2F1c2Ugd2Ugd2FudCB0byBpbnNlcnQgcmlnaHQgYmVmb3JlIHRoZSBsYXN0IHZhbHVlICh0aGUgZGVmYXVsdCB2YWx1ZSlcbiAgY29uc3QgaW5zZXJ0T2Zmc2V0ID0gVFN0eWxpbmdDb250ZXh0SW5kZXguQmluZGluZ3NTdGFydE9mZnNldCArIGdldFZhbHVlc0NvdW50KGNvbnRleHQpIC0gMTtcblxuICBsZXQgaW5kZXggPSBUU3R5bGluZ0NvbnRleHRJbmRleC5WYWx1ZXNTdGFydFBvc2l0aW9uO1xuICB3aGlsZSAoaW5kZXggPCBjb250ZXh0Lmxlbmd0aCkge1xuICAgIGluZGV4ICs9IGluc2VydE9mZnNldDtcbiAgICBjb250ZXh0LnNwbGljZShpbmRleCsrLCAwLCBERUZBVUxUX0JJTkRJTkdfSU5ERVgpO1xuXG4gICAgLy8gdGhlIHZhbHVlIHdhcyBpbnNlcnRlZCBqdXN0IGJlZm9yZSB0aGUgZGVmYXVsdCB2YWx1ZSwgYnV0IHRoZVxuICAgIC8vIG5leHQgZW50cnkgaW4gdGhlIGNvbnRleHQgc3RhcnRzIGp1c3QgYWZ0ZXIgaXQuIFRoZXJlZm9yZSsrLlxuICAgIGluZGV4Kys7XG4gIH1cbiAgY29udGV4dFtUU3R5bGluZ0NvbnRleHRJbmRleC5Ub3RhbFNvdXJjZXNQb3NpdGlvbl0rKztcbn1cblxuLyoqXG4gKiBBcHBsaWVzIGFsbCBwZW5kaW5nIHN0eWxlIGFuZCBjbGFzcyBiaW5kaW5ncyB0byB0aGUgcHJvdmlkZWQgZWxlbWVudC5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIHdpbGwgYXR0ZW1wdCB0byBmbHVzaCBzdHlsaW5nIHZpYSB0aGUgcHJvdmlkZWQgYGNsYXNzZXNDb250ZXh0YFxuICogYW5kIGBzdHlsZXNDb250ZXh0YCBjb250ZXh0IHZhbHVlcy4gVGhpcyBmdW5jdGlvbiBpcyBkZXNpZ25lZCB0byBiZSBydW4gZnJvbVxuICogdGhlIGludGVybmFsIGBzdHlsaW5nQXBwbHlgIGZ1bmN0aW9uICh3aGljaCBpcyBzY2hlZHVsZWQgdG8gcnVuIGF0IHRoZSB2ZXJ5XG4gKiBlbmQgb2YgY2hhbmdlIGRldGVjdGlvbiBmb3IgYW4gZWxlbWVudCBpZiBvbmUgb3IgbW9yZSBzdHlsZS9jbGFzcyBiaW5kaW5nc1xuICogd2VyZSBwcm9jZXNzZWQpIGFuZCB3aWxsIHJlbHkgb24gYW55IHN0YXRlIHZhbHVlcyB0aGF0IGFyZSBzZXQgZnJvbSB3aGVuXG4gKiBhbnkgb2YgdGhlIHN0eWxpbmcgYmluZGluZ3MgZXhlY3V0ZWQuXG4gKlxuICogVGhpcyBmdW5jdGlvbiBpcyBkZXNpZ25lZCB0byBiZSBjYWxsZWQgdHdpY2U6IG9uZSB3aGVuIGNoYW5nZSBkZXRlY3Rpb24gaGFzXG4gKiBwcm9jZXNzZWQgYW4gZWxlbWVudCB3aXRoaW4gdGhlIHRlbXBsYXRlIGJpbmRpbmdzIChpLmUuIGp1c3QgYXMgYGFkdmFuY2UoKWBcbiAqIGlzIGNhbGxlZCkgYW5kIHdoZW4gaG9zdCBiaW5kaW5ncyBoYXZlIGJlZW4gcHJvY2Vzc2VkLiBJbiBib3RoIGNhc2VzIHRoZVxuICogc3R5bGVzIGFuZCBjbGFzc2VzIGluIGJvdGggY29udGV4dHMgd2lsbCBiZSBhcHBsaWVkIHRvIHRoZSBlbGVtZW50LCBidXQgdGhlXG4gKiBhbGdvcml0aG0gd2lsbCBzZWxlY3RpdmVseSBkZWNpZGUgd2hpY2ggYmluZGluZ3MgdG8gcnVuIGRlcGVuZGluZyBvbiB0aGVcbiAqIGNvbHVtbnMgaW4gdGhlIGNvbnRleHQuIFRoZSBwcm92aWRlZCBgZGlyZWN0aXZlSW5kZXhgIHZhbHVlIHdpbGwgaGVscCB0aGVcbiAqIGFsZ29yaXRobSBkZXRlcm1pbmUgd2hpY2ggYmluZGluZ3MgdG8gYXBwbHk6IGVpdGhlciB0aGUgdGVtcGxhdGUgYmluZGluZ3Mgb3JcbiAqIHRoZSBob3N0IGJpbmRpbmdzIChzZWUgYGFwcGx5U3R5bGluZ1RvRWxlbWVudGAgZm9yIG1vcmUgaW5mb3JtYXRpb24pLlxuICpcbiAqIE5vdGUgdGhhdCBvbmNlIHRoaXMgZnVuY3Rpb24gaXMgY2FsbGVkIGFsbCB0ZW1wb3Jhcnkgc3R5bGluZyBzdGF0ZSBkYXRhXG4gKiAoaS5lLiB0aGUgYGJpdE1hc2tgIGFuZCBgY291bnRlcmAgdmFsdWVzIGZvciBzdHlsZXMgYW5kIGNsYXNzZXMgd2lsbCBiZSBjbGVhcmVkKS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGZsdXNoU3R5bGluZyhcbiAgICByZW5kZXJlcjogUmVuZGVyZXIzIHwgUHJvY2VkdXJhbFJlbmRlcmVyMyB8IG51bGwsIGRhdGE6IExTdHlsaW5nRGF0YSxcbiAgICBjbGFzc2VzQ29udGV4dDogVFN0eWxpbmdDb250ZXh0IHwgbnVsbCwgc3R5bGVzQ29udGV4dDogVFN0eWxpbmdDb250ZXh0IHwgbnVsbCxcbiAgICBlbGVtZW50OiBSRWxlbWVudCwgZGlyZWN0aXZlSW5kZXg6IG51bWJlciwgc3R5bGVTYW5pdGl6ZXI6IFN0eWxlU2FuaXRpemVGbiB8IG51bGwsXG4gICAgZmlyc3RVcGRhdGVQYXNzOiBib29sZWFuKTogdm9pZCB7XG4gIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUuZmx1c2hTdHlsaW5nKys7XG5cbiAgY29uc3Qgc3RhdGUgPSBnZXRTdHlsaW5nU3RhdGUoZWxlbWVudCwgZGlyZWN0aXZlSW5kZXgpO1xuICBjb25zdCBob3N0QmluZGluZ3NNb2RlID0gaXNIb3N0U3R5bGluZ0FjdGl2ZShzdGF0ZS5zb3VyY2VJbmRleCk7XG5cbiAgaWYgKHN0eWxlc0NvbnRleHQpIHtcbiAgICBmaXJzdFVwZGF0ZVBhc3MgJiYgc3luY0NvbnRleHRJbml0aWFsU3R5bGluZyhzdHlsZXNDb250ZXh0KTtcblxuICAgIGlmIChzdGF0ZS5zdHlsZXNCaXRNYXNrICE9PSAwKSB7XG4gICAgICBhcHBseVN0eWxpbmdWaWFDb250ZXh0KFxuICAgICAgICAgIHN0eWxlc0NvbnRleHQsIHJlbmRlcmVyLCBlbGVtZW50LCBkYXRhLCBzdGF0ZS5zdHlsZXNCaXRNYXNrLCBzZXRTdHlsZSwgc3R5bGVTYW5pdGl6ZXIsXG4gICAgICAgICAgaG9zdEJpbmRpbmdzTW9kZSk7XG4gICAgfVxuICB9XG5cbiAgaWYgKGNsYXNzZXNDb250ZXh0KSB7XG4gICAgZmlyc3RVcGRhdGVQYXNzICYmIHN5bmNDb250ZXh0SW5pdGlhbFN0eWxpbmcoY2xhc3Nlc0NvbnRleHQpO1xuXG4gICAgaWYgKHN0YXRlLmNsYXNzZXNCaXRNYXNrICE9PSAwKSB7XG4gICAgICBhcHBseVN0eWxpbmdWaWFDb250ZXh0KFxuICAgICAgICAgIGNsYXNzZXNDb250ZXh0LCByZW5kZXJlciwgZWxlbWVudCwgZGF0YSwgc3RhdGUuY2xhc3Nlc0JpdE1hc2ssIHNldENsYXNzLCBudWxsLFxuICAgICAgICAgIGhvc3RCaW5kaW5nc01vZGUpO1xuICAgIH1cbiAgfVxuXG4gIHJlc2V0U3R5bGluZ1N0YXRlKCk7XG59XG5cbi8qKlxuICogUmVnaXN0ZXJzIGFsbCBzdGF0aWMgc3R5bGluZyB2YWx1ZXMgaW50byB0aGUgY29udGV4dCBhcyBkZWZhdWx0IHZhbHVlcy5cbiAqXG4gKiBTdGF0aWMgc3R5bGVzIGFyZSBzdG9yZWQgb24gdGhlIGB0Tm9kZS5zdHlsZXNgIGFuZCBgdE5vZGUuY2xhc3Nlc2BcbiAqIHByb3BlcnRpZXMgYXMgaW5zdGFuY2VzIG9mIGBTdHlsaW5nTWFwQXJyYXlgLiBXaGVuIGFuIGluc3RhbmNlIG9mXG4gKiBgVFN0eWxpbmdDb250ZXh0YCBpcyBhc3NpZ25lZCB0byBgdE5vZGUuc3R5bGVzYCBhbmQgYHROb2RlLmNsYXNzZXNgXG4gKiB0aGVuIHRoZSBleGlzdGluZyBpbml0aWFsIHN0eWxpbmcgdmFsdWVzIGFyZSBjb3BpZWQgaW50byB0aGUgdGhlXG4gKiBgSW5pdGlhbFN0eWxpbmdWYWx1ZVBvc2l0aW9uYCBzbG90LlxuICpcbiAqIEJlY2F1c2UgYWxsIHN0YXRpYyBzdHlsZXMvY2xhc3NlcyBhcmUgY29sbGVjdGVkIGFuZCByZWdpc3RlcmVkIG9uXG4gKiB0aGUgaW5pdGlhbCBzdHlsaW5nIGFycmF5IGVhY2ggdGltZSBhIGRpcmVjdGl2ZSBpcyBpbnN0YW50aWF0ZWQsXG4gKiB0aGUgY29udGV4dCBtYXkgbm90IHlldCBrbm93IGFib3V0IHRoZSBzdGF0aWMgdmFsdWVzLiBXaGVuIHRoaXNcbiAqIGZ1bmN0aW9uIGlzIGNhbGxlZCBpdCB3aWxsIGNvcHkgb3ZlciBhbGwgdGhlIHN0YXRpYyBzdHlsZS9jbGFzc1xuICogdmFsdWVzIGZyb20gdGhlIGluaXRpYWwgc3R5bGluZyBhcnJheSBpbnRvIHRoZSBjb250ZXh0IGFzIGRlZmF1bHRcbiAqIHZhbHVlcyBmb3IgZWFjaCBvZiB0aGUgbWF0Y2hpbmcgZW50cmllcyBpbiB0aGUgY29udGV4dC5cbiAqXG4gKiBMZXQncyBpbWFnaW5lIHRoZSBmb2xsb3dpbmcgZXhhbXBsZTpcbiAqXG4gKiBgYGBodG1sXG4gKiA8ZGl2IHN0eWxlPVwiY29sb3I6cmVkXCJcbiAqICAgICBbc3R5bGUuY29sb3JdPVwibXlDb2xvclwiXG4gKiAgICAgZGlyLXRoYXQtaGFzLXN0YXRpYy1oZWlnaHQ+XG4gKiAgIC4uLlxuICogPC9kaXY+XG4gKiBgYGBcbiAqXG4gKiBXaGVuIHRoZSBjb2RlIGFib3ZlIGlzIHByb2Nlc3NlZCwgdGhlIHVuZGVybHlpbmcgZWxlbWVudC9zdHlsaW5nXG4gKiBpbnN0cnVjdGlvbnMgd2lsbCBjcmVhdGUgYW4gaW5zdGFuY2Ugb2YgYFRTdHlsaW5nQ29udGV4dGAgZm9yXG4gKiB0aGUgYHROb2RlLnN0eWxlc2AgcHJvcGVydHkuIEhlcmUncyB3aGF0IHRoYXQgbG9va3MgbGlrZTpcbiAqXG4gKiBgYGB0eXBlc2NyaXB0XG4gKiB0Tm9kZS5zdHlsZXMgPSBbXG4gKiAgIC8vIC4uLlxuICogICAvLyBpbml0aWFsIHN0eWxlc1xuICogICBbJ2NvbG9yOnJlZDsgaGVpZ2h0OjIwMHB4JywgJ2NvbG9yJywgJ3JlZCcsICdoZWlnaHQnLCAnMjAwcHgnXSxcbiAqXG4gKiAgIDAsIDBiMSwgMGIwLCAnY29sb3InLCAyMCwgbnVsbCwgLy8gW3N0eWxlLmNvbG9yXSBiaW5kaW5nXG4gKiBdXG4gKiBgYGBcbiAqXG4gKiBBZnRlciB0aGlzIGZ1bmN0aW9uIGlzIGNhbGxlZCBpdCB3aWxsIGJhbGFuY2Ugb3V0IHRoZSBjb250ZXh0IHdpdGhcbiAqIHRoZSBzdGF0aWMgYGNvbG9yYCBhbmQgYGhlaWdodGAgdmFsdWVzIGFuZCBzZXQgdGhlbSBhcyBkZWZhdWx0cyB3aXRoaW5cbiAqIHRoZSBjb250ZXh0OlxuICpcbiAqIGBgYHR5cGVzY3JpcHRcbiAqIHROb2RlLnN0eWxlcyA9IFtcbiAqICAgLy8gLi4uXG4gKiAgIC8vIGluaXRpYWwgc3R5bGVzXG4gKiAgIFsnY29sb3I6cmVkOyBoZWlnaHQ6MjAwcHgnLCAnY29sb3InLCAncmVkJywgJ2hlaWdodCcsICcyMDBweCddLFxuICpcbiAqICAgMCwgMGIxLCAwYjAsICdjb2xvcicsIDIwLCAncmVkJyxcbiAqICAgMCwgMGIwLCAwYjAsICdoZWlnaHQnLCAwLCAnMjAwcHgnLFxuICogXVxuICogYGBgXG4gKi9cbmZ1bmN0aW9uIHN5bmNDb250ZXh0SW5pdGlhbFN0eWxpbmcoY29udGV4dDogVFN0eWxpbmdDb250ZXh0KTogdm9pZCB7XG4gIC8vIHRoZSBUU3R5bGluZ0NvbnRleHQgYWx3YXlzIGhhcyBpbml0aWFsIHN0eWxlL2NsYXNzIHZhbHVlcyB3aGljaCBhcmVcbiAgLy8gc3RvcmVkIGluIHN0eWxpbmcgYXJyYXkgZm9ybWF0LlxuICB1cGRhdGVJbml0aWFsU3R5bGluZ09uQ29udGV4dChjb250ZXh0LCBnZXRTdHlsaW5nTWFwQXJyYXkoY29udGV4dCkgISk7XG59XG5cbi8qKlxuICogUmVnaXN0ZXJzIGFsbCBpbml0aWFsIHN0eWxpbmcgZW50cmllcyBpbnRvIHRoZSBwcm92aWRlZCBjb250ZXh0LlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gd2lsbCBpdGVyYXRlIG92ZXIgYWxsIGVudHJpZXMgaW4gdGhlIHByb3ZpZGVkIGBpbml0aWFsU3R5bGluZ2AgYXJ9cmF5IGFuZCByZWdpc3RlclxuICogdGhlbSBhcyBkZWZhdWx0IChpbml0aWFsKSB2YWx1ZXMgaW4gdGhlIHByb3ZpZGVkIGNvbnRleHQuIEluaXRpYWwgc3R5bGluZyB2YWx1ZXMgaW4gYSBjb250ZXh0IGFyZVxuICogdGhlIGRlZmF1bHQgdmFsdWVzIHRoYXQgYXJlIHRvIGJlIGFwcGxpZWQgdW5sZXNzIG92ZXJ3cml0dGVuIGJ5IGEgYmluZGluZy5cbiAqXG4gKiBUaGUgcmVhc29uIHdoeSB0aGlzIGZ1bmN0aW9uIGV4aXN0cyBhbmQgaXNuJ3QgYSBwYXJ0IG9mIHRoZSBjb250ZXh0IGNvbnN0cnVjdGlvbiBpcyBiZWNhdXNlXG4gKiBob3N0IGJpbmRpbmcgaXMgZXZhbHVhdGVkIGF0IGEgbGF0ZXIgc3RhZ2UgYWZ0ZXIgdGhlIGVsZW1lbnQgaXMgY3JlYXRlZC4gVGhpcyBtZWFucyB0aGF0XG4gKiBpZiBhIGRpcmVjdGl2ZSBvciBjb21wb25lbnQgY29udGFpbnMgYW55IGluaXRpYWwgc3R5bGluZyBjb2RlIChpLmUuIGA8ZGl2IGNsYXNzPVwiZm9vXCI+YClcbiAqIHRoZW4gdGhhdCBpbml0aWFsIHN0eWxpbmcgZGF0YSBjYW4gb25seSBiZSBhcHBsaWVkIG9uY2UgdGhlIHN0eWxpbmcgZm9yIHRoYXQgZWxlbWVudFxuICogaXMgZmlyc3QgYXBwbGllZCAoYXQgdGhlIGVuZCBvZiB0aGUgdXBkYXRlIHBoYXNlKS4gT25jZSB0aGF0IGhhcHBlbnMgdGhlbiB0aGUgY29udGV4dCB3aWxsXG4gKiB1cGRhdGUgaXRzZWxmIHdpdGggdGhlIGNvbXBsZXRlIGluaXRpYWwgc3R5bGluZyBmb3IgdGhlIGVsZW1lbnQuXG4gKi9cbmZ1bmN0aW9uIHVwZGF0ZUluaXRpYWxTdHlsaW5nT25Db250ZXh0KFxuICAgIGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCwgaW5pdGlhbFN0eWxpbmc6IFN0eWxpbmdNYXBBcnJheSk6IHZvaWQge1xuICAvLyBgLTFgIGlzIHVzZWQgaGVyZSBiZWNhdXNlIGFsbCBpbml0aWFsIHN0eWxpbmcgZGF0YSBpcyBub3QgYSBhcGFydFxuICAvLyBvZiBhIGJpbmRpbmcgKHNpbmNlIGl0J3Mgc3RhdGljKVxuICBjb25zdCBDT1VOVF9JRF9GT1JfU1RZTElORyA9IC0xO1xuXG4gIGxldCBoYXNJbml0aWFsU3R5bGluZyA9IGZhbHNlO1xuICBmb3IgKGxldCBpID0gU3R5bGluZ01hcEFycmF5SW5kZXguVmFsdWVzU3RhcnRQb3NpdGlvbjsgaSA8IGluaXRpYWxTdHlsaW5nLmxlbmd0aDtcbiAgICAgICBpICs9IFN0eWxpbmdNYXBBcnJheUluZGV4LlR1cGxlU2l6ZSkge1xuICAgIGNvbnN0IHZhbHVlID0gZ2V0TWFwVmFsdWUoaW5pdGlhbFN0eWxpbmcsIGkpO1xuICAgIGlmICh2YWx1ZSkge1xuICAgICAgY29uc3QgcHJvcCA9IGdldE1hcFByb3AoaW5pdGlhbFN0eWxpbmcsIGkpO1xuICAgICAgcmVnaXN0ZXJCaW5kaW5nKGNvbnRleHQsIENPVU5UX0lEX0ZPUl9TVFlMSU5HLCAwLCBwcm9wLCB2YWx1ZSwgZmFsc2UpO1xuICAgICAgaGFzSW5pdGlhbFN0eWxpbmcgPSB0cnVlO1xuICAgIH1cbiAgfVxuXG4gIGlmIChoYXNJbml0aWFsU3R5bGluZykge1xuICAgIHBhdGNoQ29uZmlnKGNvbnRleHQsIFRTdHlsaW5nQ29uZmlnLkhhc0luaXRpYWxTdHlsaW5nKTtcbiAgfVxufVxuXG4vKipcbiAqIFJ1bnMgdGhyb3VnaCB0aGUgcHJvdmlkZWQgc3R5bGluZyBjb250ZXh0IGFuZCBhcHBsaWVzIGVhY2ggdmFsdWUgdG9cbiAqIHRoZSBwcm92aWRlZCBlbGVtZW50ICh2aWEgdGhlIHJlbmRlcmVyKSBpZiBvbmUgb3IgbW9yZSB2YWx1ZXMgYXJlIHByZXNlbnQuXG4gKlxuICogVGhpcyBmdW5jdGlvbiB3aWxsIGl0ZXJhdGUgb3ZlciBhbGwgZW50cmllcyBwcmVzZW50IGluIHRoZSBwcm92aWRlZFxuICogYFRTdHlsaW5nQ29udGV4dGAgYXJyYXkgKGJvdGggcHJvcC1iYXNlZCBhbmQgbWFwLWJhc2VkIGJpbmRpbmdzKS4tXG4gKlxuICogRWFjaCBlbnRyeSwgd2l0aGluIHRoZSBgVFN0eWxpbmdDb250ZXh0YCBhcnJheSwgaXMgc3RvcmVkIGFscGhhYmV0aWNhbGx5XG4gKiBhbmQgdGhpcyBtZWFucyB0aGF0IGVhY2ggcHJvcC92YWx1ZSBlbnRyeSB3aWxsIGJlIGFwcGxpZWQgaW4gb3JkZXJcbiAqIChzbyBsb25nIGFzIGl0IGlzIG1hcmtlZCBkaXJ0eSBpbiB0aGUgcHJvdmlkZWQgYGJpdE1hc2tgIHZhbHVlKS5cbiAqXG4gKiBJZiB0aGVyZSBhcmUgYW55IG1hcC1iYXNlZCBlbnRyaWVzIHByZXNlbnQgKHdoaWNoIGFyZSBhcHBsaWVkIHRvIHRoZVxuICogZWxlbWVudCB2aWEgdGhlIGBbc3R5bGVdYCBhbmQgYFtjbGFzc11gIGJpbmRpbmdzKSB0aGVuIHRob3NlIGVudHJpZXNcbiAqIHdpbGwgYmUgYXBwbGllZCBhcyB3ZWxsLiBIb3dldmVyLCB0aGUgY29kZSBmb3IgdGhhdCBpcyBub3QgYSBwYXJ0IG9mXG4gKiB0aGlzIGZ1bmN0aW9uLiBJbnN0ZWFkLCBlYWNoIHRpbWUgYSBwcm9wZXJ0eSBpcyB2aXNpdGVkLCB0aGVuIHRoZVxuICogY29kZSBiZWxvdyB3aWxsIGNhbGwgYW4gZXh0ZXJuYWwgZnVuY3Rpb24gY2FsbGVkIGBzdHlsaW5nTWFwc1N5bmNGbmBcbiAqIGFuZCwgaWYgcHJlc2VudCwgaXQgd2lsbCBrZWVwIHRoZSBhcHBsaWNhdGlvbiBvZiBzdHlsaW5nIHZhbHVlcyBpblxuICogbWFwLWJhc2VkIGJpbmRpbmdzIHVwIHRvIHN5bmMgd2l0aCB0aGUgYXBwbGljYXRpb24gb2YgcHJvcC1iYXNlZFxuICogYmluZGluZ3MuXG4gKlxuICogVmlzaXQgYHN0eWxpbmcvbWFwX2Jhc2VkX2JpbmRpbmdzLnRzYCB0byBsZWFybiBtb3JlIGFib3V0IGhvdyB0aGVcbiAqIGFsZ29yaXRobSB3b3JrcyBmb3IgbWFwLWJhc2VkIHN0eWxpbmcgYmluZGluZ3MuXG4gKlxuICogTm90ZSB0aGF0IHRoaXMgZnVuY3Rpb24gaXMgbm90IGRlc2lnbmVkIHRvIGJlIGNhbGxlZCBpbiBpc29sYXRpb24gKHVzZVxuICogdGhlIGBmbHVzaFN0eWxpbmdgIGZ1bmN0aW9uIHNvIHRoYXQgaXQgY2FuIGNhbGwgdGhpcyBmdW5jdGlvbiBmb3IgYm90aFxuICogdGhlIHN0eWxlcyBhbmQgY2xhc3NlcyBjb250ZXh0cykuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhcHBseVN0eWxpbmdWaWFDb250ZXh0KFxuICAgIGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCwgcmVuZGVyZXI6IFJlbmRlcmVyMyB8IFByb2NlZHVyYWxSZW5kZXJlcjMgfCBudWxsLCBlbGVtZW50OiBSRWxlbWVudCxcbiAgICBiaW5kaW5nRGF0YTogTFN0eWxpbmdEYXRhLCBiaXRNYXNrVmFsdWU6IG51bWJlciB8IGJvb2xlYW4sIGFwcGx5U3R5bGluZ0ZuOiBBcHBseVN0eWxpbmdGbixcbiAgICBzYW5pdGl6ZXI6IFN0eWxlU2FuaXRpemVGbiB8IG51bGwsIGhvc3RCaW5kaW5nc01vZGU6IGJvb2xlYW4pOiB2b2lkIHtcbiAgY29uc3QgYml0TWFzayA9IG5vcm1hbGl6ZUJpdE1hc2tWYWx1ZShiaXRNYXNrVmFsdWUpO1xuXG4gIGxldCBzdHlsaW5nTWFwc1N5bmNGbjogU3luY1N0eWxpbmdNYXBzRm58bnVsbCA9IG51bGw7XG4gIGxldCBhcHBseUFsbFZhbHVlcyA9IGZhbHNlO1xuICBpZiAoaGFzQ29uZmlnKGNvbnRleHQsIFRTdHlsaW5nQ29uZmlnLkhhc01hcEJpbmRpbmdzKSkge1xuICAgIHN0eWxpbmdNYXBzU3luY0ZuID0gZ2V0U3R5bGluZ01hcHNTeW5jRm4oKTtcbiAgICBjb25zdCBtYXBzR3VhcmRNYXNrID1cbiAgICAgICAgZ2V0R3VhcmRNYXNrKGNvbnRleHQsIFRTdHlsaW5nQ29udGV4dEluZGV4LlZhbHVlc1N0YXJ0UG9zaXRpb24sIGhvc3RCaW5kaW5nc01vZGUpO1xuICAgIGFwcGx5QWxsVmFsdWVzID0gKGJpdE1hc2sgJiBtYXBzR3VhcmRNYXNrKSAhPT0gMDtcbiAgfVxuXG4gIGNvbnN0IHZhbHVlc0NvdW50ID0gZ2V0VmFsdWVzQ291bnQoY29udGV4dCk7XG4gIGxldCB0b3RhbEJpbmRpbmdzVG9WaXNpdCA9IDE7XG4gIGxldCBtYXBzTW9kZSA9XG4gICAgICBhcHBseUFsbFZhbHVlcyA/IFN0eWxpbmdNYXBzU3luY01vZGUuQXBwbHlBbGxWYWx1ZXMgOiBTdHlsaW5nTWFwc1N5bmNNb2RlLlRyYXZlcnNlVmFsdWVzO1xuICBpZiAoaG9zdEJpbmRpbmdzTW9kZSkge1xuICAgIG1hcHNNb2RlIHw9IFN0eWxpbmdNYXBzU3luY01vZGUuUmVjdXJzZUlubmVyTWFwcztcbiAgICB0b3RhbEJpbmRpbmdzVG9WaXNpdCA9IHZhbHVlc0NvdW50IC0gMTtcbiAgfVxuXG4gIGxldCBpID0gZ2V0UHJvcFZhbHVlc1N0YXJ0UG9zaXRpb24oY29udGV4dCk7XG4gIHdoaWxlIChpIDwgY29udGV4dC5sZW5ndGgpIHtcbiAgICBjb25zdCBndWFyZE1hc2sgPSBnZXRHdWFyZE1hc2soY29udGV4dCwgaSwgaG9zdEJpbmRpbmdzTW9kZSk7XG4gICAgaWYgKGJpdE1hc2sgJiBndWFyZE1hc2spIHtcbiAgICAgIGxldCB2YWx1ZUFwcGxpZWQgPSBmYWxzZTtcbiAgICAgIGNvbnN0IHByb3AgPSBnZXRQcm9wKGNvbnRleHQsIGkpO1xuICAgICAgY29uc3QgZGVmYXVsdFZhbHVlID0gZ2V0RGVmYXVsdFZhbHVlKGNvbnRleHQsIGkpO1xuXG4gICAgICAvLyBQYXJ0IDE6IFZpc2l0IHRoZSBgW3N0eWxpbmcucHJvcF1gIHZhbHVlXG4gICAgICBmb3IgKGxldCBqID0gMDsgaiA8IHRvdGFsQmluZGluZ3NUb1Zpc2l0OyBqKyspIHtcbiAgICAgICAgY29uc3QgYmluZGluZ0luZGV4ID0gZ2V0QmluZGluZ1ZhbHVlKGNvbnRleHQsIGksIGopIGFzIG51bWJlcjtcbiAgICAgICAgaWYgKCF2YWx1ZUFwcGxpZWQgJiYgYmluZGluZ0luZGV4ICE9PSAwKSB7XG4gICAgICAgICAgY29uc3QgdmFsdWUgPSBnZXRWYWx1ZShiaW5kaW5nRGF0YSwgYmluZGluZ0luZGV4KTtcbiAgICAgICAgICBpZiAoaXNTdHlsaW5nVmFsdWVEZWZpbmVkKHZhbHVlKSkge1xuICAgICAgICAgICAgY29uc3QgY2hlY2tWYWx1ZU9ubHkgPSBob3N0QmluZGluZ3NNb2RlICYmIGogPT09IDA7XG4gICAgICAgICAgICBpZiAoIWNoZWNrVmFsdWVPbmx5KSB7XG4gICAgICAgICAgICAgIGNvbnN0IGZpbmFsVmFsdWUgPSBzYW5pdGl6ZXIgJiYgaXNTYW5pdGl6YXRpb25SZXF1aXJlZChjb250ZXh0LCBpKSA/XG4gICAgICAgICAgICAgICAgICBzYW5pdGl6ZXIocHJvcCwgdmFsdWUsIFN0eWxlU2FuaXRpemVNb2RlLlNhbml0aXplT25seSkgOlxuICAgICAgICAgICAgICAgICAgdW53cmFwU2FmZVZhbHVlKHZhbHVlKTtcbiAgICAgICAgICAgICAgYXBwbHlTdHlsaW5nRm4ocmVuZGVyZXIsIGVsZW1lbnQsIHByb3AsIGZpbmFsVmFsdWUsIGJpbmRpbmdJbmRleCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YWx1ZUFwcGxpZWQgPSB0cnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFBhcnQgMjogVmlzaXQgdGhlIGBbc3R5bGVdYCBvciBgW2NsYXNzXWAgbWFwLWJhc2VkIHZhbHVlXG4gICAgICAgIGlmIChzdHlsaW5nTWFwc1N5bmNGbikge1xuICAgICAgICAgIC8vIGRldGVybWluZSB3aGV0aGVyIG9yIG5vdCB0byBhcHBseSB0aGUgdGFyZ2V0IHByb3BlcnR5IG9yIHRvIHNraXAgaXRcbiAgICAgICAgICBsZXQgbW9kZSA9IG1hcHNNb2RlIHwgKHZhbHVlQXBwbGllZCA/IFN0eWxpbmdNYXBzU3luY01vZGUuU2tpcFRhcmdldFByb3AgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgU3R5bGluZ01hcHNTeW5jTW9kZS5BcHBseVRhcmdldFByb3ApO1xuXG4gICAgICAgICAgLy8gdGhlIGZpcnN0IGNvbHVtbiBpbiB0aGUgY29udGV4dCAod2hlbiBgaiA9PSAwYCkgaXMgc3BlY2lhbC1jYXNlZCBmb3JcbiAgICAgICAgICAvLyB0ZW1wbGF0ZSBiaW5kaW5ncy4gSWYgYW5kIHdoZW4gaG9zdCBiaW5kaW5ncyBhcmUgYmVpbmcgcHJvY2Vzc2VkIHRoZW5cbiAgICAgICAgICAvLyB0aGUgZmlyc3QgY29sdW1uIHdpbGwgc3RpbGwgYmUgaXRlcmF0ZWQgb3ZlciwgYnV0IHRoZSB2YWx1ZXMgd2lsbCBvbmx5XG4gICAgICAgICAgLy8gYmUgY2hlY2tlZCBhZ2FpbnN0IChub3QgYXBwbGllZCkuIElmIGFuZCB3aGVuIHRoaXMgaGFwcGVucyB3ZSBuZWVkIHRvXG4gICAgICAgICAgLy8gbm90aWZ5IHRoZSBtYXAtYmFzZWQgc3luY2luZyBjb2RlIHRvIGtub3cgbm90IHRvIGFwcGx5IHRoZSB2YWx1ZXMgaXRcbiAgICAgICAgICAvLyBjb21lcyBhY3Jvc3MgaW4gdGhlIHZlcnkgZmlyc3QgbWFwLWJhc2VkIGJpbmRpbmcgKHdoaWNoIGlzIGFsc28gbG9jYXRlZFxuICAgICAgICAgIC8vIGluIGNvbHVtbiB6ZXJvKS5cbiAgICAgICAgICBpZiAoaG9zdEJpbmRpbmdzTW9kZSAmJiBqID09PSAwKSB7XG4gICAgICAgICAgICBtb2RlIHw9IFN0eWxpbmdNYXBzU3luY01vZGUuQ2hlY2tWYWx1ZXNPbmx5O1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGNvbnN0IHZhbHVlQXBwbGllZFdpdGhpbk1hcCA9IHN0eWxpbmdNYXBzU3luY0ZuKFxuICAgICAgICAgICAgICBjb250ZXh0LCByZW5kZXJlciwgZWxlbWVudCwgYmluZGluZ0RhdGEsIGosIGFwcGx5U3R5bGluZ0ZuLCBzYW5pdGl6ZXIsIG1vZGUsIHByb3AsXG4gICAgICAgICAgICAgIGRlZmF1bHRWYWx1ZSk7XG4gICAgICAgICAgdmFsdWVBcHBsaWVkID0gdmFsdWVBcHBsaWVkIHx8IHZhbHVlQXBwbGllZFdpdGhpbk1hcDtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBQYXJ0IDM6IGFwcGx5IHRoZSBkZWZhdWx0IHZhbHVlIChlLmcuIGA8ZGl2IHN0eWxlPVwid2lkdGg6MjAwXCI+YCA9PiBgMjAwcHhgIGdldHMgYXBwbGllZClcbiAgICAgIC8vIGlmIHRoZSB2YWx1ZSBoYXMgbm90IHlldCBiZWVuIGFwcGxpZWQgdGhlbiBhIHRydXRoeSB2YWx1ZSBkb2VzIG5vdCBleGlzdCBpbiB0aGVcbiAgICAgIC8vIHByb3AtYmFzZWQgb3IgbWFwLWJhc2VkIGJpbmRpbmdzIGNvZGUuIElmIGFuZCB3aGVuIHRoaXMgaGFwcGVucywganVzdCBhcHBseSB0aGVcbiAgICAgIC8vIGRlZmF1bHQgdmFsdWUgKGV2ZW4gaWYgdGhlIGRlZmF1bHQgdmFsdWUgaXMgYG51bGxgKS5cbiAgICAgIGlmICghdmFsdWVBcHBsaWVkKSB7XG4gICAgICAgIGFwcGx5U3R5bGluZ0ZuKHJlbmRlcmVyLCBlbGVtZW50LCBwcm9wLCBkZWZhdWx0VmFsdWUpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGkgKz0gVFN0eWxpbmdDb250ZXh0SW5kZXguQmluZGluZ3NTdGFydE9mZnNldCArIHZhbHVlc0NvdW50O1xuICB9XG5cbiAgLy8gdGhlIG1hcC1iYXNlZCBzdHlsaW5nIGVudHJpZXMgbWF5IGhhdmUgbm90IGFwcGxpZWQgYWxsIHRoZWlyXG4gIC8vIHZhbHVlcy4gRm9yIHRoaXMgcmVhc29uLCBvbmUgbW9yZSBjYWxsIHRvIHRoZSBzeW5jIGZ1bmN0aW9uXG4gIC8vIG5lZWRzIHRvIGJlIGlzc3VlZCBhdCB0aGUgZW5kLlxuICBpZiAoc3R5bGluZ01hcHNTeW5jRm4pIHtcbiAgICBpZiAoaG9zdEJpbmRpbmdzTW9kZSkge1xuICAgICAgbWFwc01vZGUgfD0gU3R5bGluZ01hcHNTeW5jTW9kZS5DaGVja1ZhbHVlc09ubHk7XG4gICAgfVxuICAgIHN0eWxpbmdNYXBzU3luY0ZuKFxuICAgICAgICBjb250ZXh0LCByZW5kZXJlciwgZWxlbWVudCwgYmluZGluZ0RhdGEsIDAsIGFwcGx5U3R5bGluZ0ZuLCBzYW5pdGl6ZXIsIG1hcHNNb2RlKTtcbiAgfVxufVxuXG4vKipcbiAqIEFwcGxpZXMgdGhlIHByb3ZpZGVkIHN0eWxpbmcgbWFwIHRvIHRoZSBlbGVtZW50IGRpcmVjdGx5ICh3aXRob3V0IGNvbnRleHQgcmVzb2x1dGlvbikuXG4gKlxuICogVGhpcyBmdW5jdGlvbiBpcyBkZXNpZ25lZCB0byBiZSBydW4gZnJvbSB0aGUgc3R5bGluZyBpbnN0cnVjdGlvbnMgYW5kIHdpbGwgYmUgY2FsbGVkXG4gKiBhdXRvbWF0aWNhbGx5LiBUaGlzIGZ1bmN0aW9uIGlzIGludGVuZGVkIHRvIGJlIHVzZWQgZm9yIHBlcmZvcm1hbmNlIHJlYXNvbnMgaW4gdGhlXG4gKiBldmVudCB0aGF0IHRoZXJlIGlzIG5vIG5lZWQgdG8gYXBwbHkgc3R5bGluZyB2aWEgY29udGV4dCByZXNvbHV0aW9uLlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gaGFzIHRocmVlIGRpZmZlcmVudCBjYXNlcyB0aGF0IGNhbiBvY2N1ciAoZm9yIGVhY2ggaXRlbSBpbiB0aGUgbWFwKTpcbiAqXG4gKiAtIENhc2UgMTogQXR0ZW1wdCB0byBhcHBseSB0aGUgY3VycmVudCB2YWx1ZSBpbiB0aGUgbWFwIHRvIHRoZSBlbGVtZW50IChpZiBpdCdzIGBub24gbnVsbGApLlxuICpcbiAqIC0gQ2FzZSAyOiBJZiBhIG1hcCB2YWx1ZSBmYWlscyB0byBiZSBhcHBsaWVkIHRoZW4gdGhlIGFsZ29yaXRobSB3aWxsIGZpbmQgYSBtYXRjaGluZyBlbnRyeSBpblxuICogICAgICAgICAgIHRoZSBpbml0aWFsIHZhbHVlcyBwcmVzZW50IGluIHRoZSBjb250ZXh0IGFuZCBhdHRlbXB0IHRvIGFwcGx5IHRoYXQuXG4gKlxuICogLSBEZWZhdWx0IENhc2U6IElmIHRoZSBpbml0aWFsIHZhbHVlIGNhbm5vdCBiZSBhcHBsaWVkIHRoZW4gYSBkZWZhdWx0IHZhbHVlIG9mIGBudWxsYCB3aWxsIGJlXG4gKiAgICAgICAgICAgICAgICAgYXBwbGllZCAod2hpY2ggd2lsbCByZW1vdmUgdGhlIHN0eWxlL2NsYXNzIHZhbHVlIGZyb20gdGhlIGVsZW1lbnQpLlxuICpcbiAqIFNlZSBgYWxsb3dEaXJlY3RTdHlsaW5nQXBwbHlgIHRvIGxlYXJuIHRoZSBsb2dpYyB1c2VkIHRvIGRldGVybWluZSB3aGV0aGVyIGFueSBzdHlsZS9jbGFzc1xuICogYmluZGluZ3MgY2FuIGJlIGRpcmVjdGx5IGFwcGxpZWQuXG4gKlxuICogQHJldHVybnMgd2hldGhlciBvciBub3QgdGhlIHN0eWxpbmcgbWFwIHdhcyBhcHBsaWVkIHRvIHRoZSBlbGVtZW50LlxuICovXG5leHBvcnQgZnVuY3Rpb24gYXBwbHlTdHlsaW5nTWFwRGlyZWN0bHkoXG4gICAgcmVuZGVyZXI6IGFueSwgY29udGV4dDogVFN0eWxpbmdDb250ZXh0LCBlbGVtZW50OiBSRWxlbWVudCwgZGF0YTogTFN0eWxpbmdEYXRhLFxuICAgIGJpbmRpbmdJbmRleDogbnVtYmVyLCB2YWx1ZToge1trZXk6IHN0cmluZ106IGFueX0gfCBzdHJpbmcgfCBudWxsLCBpc0NsYXNzQmFzZWQ6IGJvb2xlYW4sXG4gICAgc2FuaXRpemVyPzogU3R5bGVTYW5pdGl6ZUZuIHwgbnVsbCwgZm9yY2VVcGRhdGU/OiBib29sZWFuLFxuICAgIGJpbmRpbmdWYWx1ZUNvbnRhaW5zSW5pdGlhbD86IGJvb2xlYW4pOiB2b2lkIHtcbiAgY29uc3Qgb2xkVmFsdWUgPSBnZXRWYWx1ZShkYXRhLCBiaW5kaW5nSW5kZXgpO1xuICBpZiAoZm9yY2VVcGRhdGUgfHwgaGFzVmFsdWVDaGFuZ2VkKG9sZFZhbHVlLCB2YWx1ZSkpIHtcbiAgICBjb25zdCBjb25maWcgPSBnZXRDb25maWcoY29udGV4dCk7XG4gICAgY29uc3QgaGFzSW5pdGlhbCA9IGNvbmZpZyAmIFRTdHlsaW5nQ29uZmlnLkhhc0luaXRpYWxTdHlsaW5nO1xuICAgIGNvbnN0IGluaXRpYWxWYWx1ZSA9XG4gICAgICAgIGhhc0luaXRpYWwgJiYgIWJpbmRpbmdWYWx1ZUNvbnRhaW5zSW5pdGlhbCA/IGdldEluaXRpYWxTdHlsaW5nVmFsdWUoY29udGV4dCkgOiBudWxsO1xuICAgIHNldFZhbHVlKGRhdGEsIGJpbmRpbmdJbmRleCwgdmFsdWUpO1xuXG4gICAgLy8gdGhlIGNhY2hlZCB2YWx1ZSBpcyB0aGUgbGFzdCBzbmFwc2hvdCBvZiB0aGUgc3R5bGUgb3IgY2xhc3NcbiAgICAvLyBhdHRyaWJ1dGUgdmFsdWUgYW5kIGlzIHVzZWQgaW4gdGhlIGlmIHN0YXRlbWVudCBiZWxvdyB0b1xuICAgIC8vIGtlZXAgdHJhY2sgb2YgaW50ZXJuYWwvZXh0ZXJuYWwgY2hhbmdlcy5cbiAgICBjb25zdCBjYWNoZWRWYWx1ZUluZGV4ID0gYmluZGluZ0luZGV4ICsgMTtcbiAgICBsZXQgY2FjaGVkVmFsdWUgPSBnZXRWYWx1ZShkYXRhLCBjYWNoZWRWYWx1ZUluZGV4KTtcbiAgICBpZiAoY2FjaGVkVmFsdWUgPT09IE5PX0NIQU5HRSkge1xuICAgICAgY2FjaGVkVmFsdWUgPSBpbml0aWFsVmFsdWU7XG4gICAgfVxuICAgIGNhY2hlZFZhbHVlID0gdHlwZW9mIGNhY2hlZFZhbHVlICE9PSAnc3RyaW5nJyA/ICcnIDogY2FjaGVkVmFsdWU7XG5cbiAgICAvLyBJZiBhIGNsYXNzL3N0eWxlIHZhbHVlIHdhcyBtb2RpZmllZCBleHRlcm5hbGx5IHRoZW4gdGhlIHN0eWxpbmdcbiAgICAvLyBmYXN0IHBhc3MgY2Fubm90IGd1YXJhbnRlZSB0aGF0IHRoZSBleHRlcm5hbCB2YWx1ZXMgYXJlIHJldGFpbmVkLlxuICAgIC8vIFdoZW4gdGhpcyBoYXBwZW5zLCB0aGUgYWxnb3JpdGhtIHdpbGwgYmFpbCBvdXQgYW5kIG5vdCB3cml0ZSB0b1xuICAgIC8vIHRoZSBzdHlsZSBvciBjbGFzc05hbWUgYXR0cmlidXRlIGRpcmVjdGx5LlxuICAgIGxldCB3cml0ZVRvQXR0ckRpcmVjdGx5ID0gIShjb25maWcgJiBUU3R5bGluZ0NvbmZpZy5IYXNQcm9wQmluZGluZ3MpO1xuICAgIGlmICh3cml0ZVRvQXR0ckRpcmVjdGx5ICYmXG4gICAgICAgIGNoZWNrSWZFeHRlcm5hbGx5TW9kaWZpZWQoZWxlbWVudCBhcyBIVE1MRWxlbWVudCwgY2FjaGVkVmFsdWUsIGlzQ2xhc3NCYXNlZCkpIHtcbiAgICAgIHdyaXRlVG9BdHRyRGlyZWN0bHkgPSBmYWxzZTtcbiAgICAgIGlmIChvbGRWYWx1ZSAhPT0gVkFMVUVfSVNfRVhURVJOQUxMWV9NT0RJRklFRCkge1xuICAgICAgICAvLyBkaXJlY3Qgc3R5bGluZyB3aWxsIHJlc2V0IHRoZSBhdHRyaWJ1dGUgZW50aXJlbHkgZWFjaCB0aW1lLFxuICAgICAgICAvLyBhbmQsIGZvciB0aGlzIHJlYXNvbiwgaWYgdGhlIGFsZ29yaXRobSBkZWNpZGVzIGl0IGNhbm5vdFxuICAgICAgICAvLyB3cml0ZSB0byB0aGUgY2xhc3Mvc3R5bGUgYXR0cmlidXRlcyBkaXJlY3RseSB0aGVuIGl0IG11c3RcbiAgICAgICAgLy8gcmVzZXQgYWxsIHRoZSBwcmV2aW91cyBzdHlsZS9jbGFzcyB2YWx1ZXMgYmVmb3JlIGl0IHN0YXJ0c1xuICAgICAgICAvLyB0byBhcHBseSB2YWx1ZXMgaW4gdGhlIG5vbi1kaXJlY3Qgd2F5LlxuICAgICAgICByZW1vdmVTdHlsaW5nVmFsdWVzKHJlbmRlcmVyLCBlbGVtZW50LCBvbGRWYWx1ZSwgaXNDbGFzc0Jhc2VkKTtcblxuICAgICAgICAvLyB0aGlzIHdpbGwgaW5zdHJ1Y3QgdGhlIGFsZ29yaXRobSBub3QgdG8gYXBwbHkgY2xhc3Mgb3Igc3R5bGVcbiAgICAgICAgLy8gdmFsdWVzIGRpcmVjdGx5IGFueW1vcmUuXG4gICAgICAgIHNldFZhbHVlKGRhdGEsIGNhY2hlZFZhbHVlSW5kZXgsIFZBTFVFX0lTX0VYVEVSTkFMTFlfTU9ESUZJRUQpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmICh3cml0ZVRvQXR0ckRpcmVjdGx5KSB7XG4gICAgICBjb25zdCBpbml0aWFsVmFsdWUgPVxuICAgICAgICAgIGhhc0luaXRpYWwgJiYgIWJpbmRpbmdWYWx1ZUNvbnRhaW5zSW5pdGlhbCA/IGdldEluaXRpYWxTdHlsaW5nVmFsdWUoY29udGV4dCkgOiBudWxsO1xuICAgICAgY29uc3QgdmFsdWVUb0FwcGx5ID1cbiAgICAgICAgICB3cml0ZVN0eWxpbmdWYWx1ZURpcmVjdGx5KHJlbmRlcmVyLCBlbGVtZW50LCB2YWx1ZSwgaXNDbGFzc0Jhc2VkLCBpbml0aWFsVmFsdWUpO1xuICAgICAgc2V0VmFsdWUoZGF0YSwgY2FjaGVkVmFsdWVJbmRleCwgdmFsdWVUb0FwcGx5IHx8IG51bGwpO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBhcHBseUZuID0gaXNDbGFzc0Jhc2VkID8gc2V0Q2xhc3MgOiBzZXRTdHlsZTtcbiAgICAgIGNvbnN0IG1hcCA9IG5vcm1hbGl6ZUludG9TdHlsaW5nTWFwKG9sZFZhbHVlLCB2YWx1ZSwgIWlzQ2xhc3NCYXNlZCk7XG4gICAgICBjb25zdCBpbml0aWFsU3R5bGVzID0gaGFzSW5pdGlhbCA/IGdldFN0eWxpbmdNYXBBcnJheShjb250ZXh0KSA6IG51bGw7XG5cbiAgICAgIGZvciAobGV0IGkgPSBTdHlsaW5nTWFwQXJyYXlJbmRleC5WYWx1ZXNTdGFydFBvc2l0aW9uOyBpIDwgbWFwLmxlbmd0aDtcbiAgICAgICAgICAgaSArPSBTdHlsaW5nTWFwQXJyYXlJbmRleC5UdXBsZVNpemUpIHtcbiAgICAgICAgY29uc3QgcHJvcCA9IGdldE1hcFByb3AobWFwLCBpKTtcbiAgICAgICAgY29uc3QgdmFsdWUgPSBnZXRNYXBWYWx1ZShtYXAsIGkpO1xuXG4gICAgICAgIC8vIGNhc2UgMTogYXBwbHkgdGhlIG1hcCB2YWx1ZSAoaWYgaXQgZXhpc3RzKVxuICAgICAgICBsZXQgYXBwbGllZCA9XG4gICAgICAgICAgICBhcHBseVN0eWxpbmdWYWx1ZShyZW5kZXJlciwgZWxlbWVudCwgcHJvcCwgdmFsdWUsIGFwcGx5Rm4sIGJpbmRpbmdJbmRleCwgc2FuaXRpemVyKTtcblxuICAgICAgICAvLyBjYXNlIDI6IGFwcGx5IHRoZSBpbml0aWFsIHZhbHVlIChpZiBpdCBleGlzdHMpXG4gICAgICAgIGlmICghYXBwbGllZCAmJiBpbml0aWFsU3R5bGVzKSB7XG4gICAgICAgICAgYXBwbGllZCA9IGZpbmRBbmRBcHBseU1hcFZhbHVlKFxuICAgICAgICAgICAgICByZW5kZXJlciwgZWxlbWVudCwgYXBwbHlGbiwgaW5pdGlhbFN0eWxlcywgcHJvcCwgYmluZGluZ0luZGV4LCBzYW5pdGl6ZXIpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gZGVmYXVsdCBjYXNlOiBhcHBseSBgbnVsbGAgdG8gcmVtb3ZlIHRoZSB2YWx1ZVxuICAgICAgICBpZiAoIWFwcGxpZWQpIHtcbiAgICAgICAgICBhcHBseUZuKHJlbmRlcmVyLCBlbGVtZW50LCBwcm9wLCBudWxsLCBiaW5kaW5nSW5kZXgpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHN0YXRlID0gZ2V0U3R5bGluZ1N0YXRlKGVsZW1lbnQsIFRFTVBMQVRFX0RJUkVDVElWRV9JTkRFWCk7XG4gICAgICBpZiAoaXNDbGFzc0Jhc2VkKSB7XG4gICAgICAgIHN0YXRlLmxhc3REaXJlY3RDbGFzc01hcCA9IG1hcDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHN0YXRlLmxhc3REaXJlY3RTdHlsZU1hcCA9IG1hcDtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHdyaXRlU3R5bGluZ1ZhbHVlRGlyZWN0bHkoXG4gICAgcmVuZGVyZXI6IGFueSwgZWxlbWVudDogUkVsZW1lbnQsIHZhbHVlOiB7W2tleTogc3RyaW5nXTogYW55fSB8IHN0cmluZyB8IG51bGwsXG4gICAgaXNDbGFzc0Jhc2VkOiBib29sZWFuLCBpbml0aWFsVmFsdWU6IHN0cmluZyB8IG51bGwpOiBzdHJpbmcge1xuICBsZXQgdmFsdWVUb0FwcGx5OiBzdHJpbmc7XG4gIGlmIChpc0NsYXNzQmFzZWQpIHtcbiAgICB2YWx1ZVRvQXBwbHkgPSB0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnID8gdmFsdWUgOiBvYmplY3RUb0NsYXNzTmFtZSh2YWx1ZSk7XG4gICAgaWYgKGluaXRpYWxWYWx1ZSAhPT0gbnVsbCkge1xuICAgICAgdmFsdWVUb0FwcGx5ID0gY29uY2F0U3RyaW5nKGluaXRpYWxWYWx1ZSwgdmFsdWVUb0FwcGx5LCAnICcpO1xuICAgIH1cbiAgICBzZXRDbGFzc05hbWUocmVuZGVyZXIsIGVsZW1lbnQsIHZhbHVlVG9BcHBseSk7XG4gIH0gZWxzZSB7XG4gICAgdmFsdWVUb0FwcGx5ID0gZm9yY2VTdHlsZXNBc1N0cmluZyh2YWx1ZSwgdHJ1ZSk7XG4gICAgaWYgKGluaXRpYWxWYWx1ZSAhPT0gbnVsbCkge1xuICAgICAgdmFsdWVUb0FwcGx5ID0gaW5pdGlhbFZhbHVlICsgJzsnICsgdmFsdWVUb0FwcGx5O1xuICAgIH1cbiAgICBzZXRTdHlsZUF0dHIocmVuZGVyZXIsIGVsZW1lbnQsIHZhbHVlVG9BcHBseSk7XG4gIH1cbiAgcmV0dXJuIHZhbHVlVG9BcHBseTtcbn1cblxuLyoqXG4gKiBBcHBsaWVzIHRoZSBwcm92aWRlZCBzdHlsaW5nIHByb3AvdmFsdWUgdG8gdGhlIGVsZW1lbnQgZGlyZWN0bHkgKHdpdGhvdXQgY29udGV4dCByZXNvbHV0aW9uKS5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIGlzIGRlc2lnbmVkIHRvIGJlIHJ1biBmcm9tIHRoZSBzdHlsaW5nIGluc3RydWN0aW9ucyBhbmQgd2lsbCBiZSBjYWxsZWRcbiAqIGF1dG9tYXRpY2FsbHkuIFRoaXMgZnVuY3Rpb24gaXMgaW50ZW5kZWQgdG8gYmUgdXNlZCBmb3IgcGVyZm9ybWFuY2UgcmVhc29ucyBpbiB0aGVcbiAqIGV2ZW50IHRoYXQgdGhlcmUgaXMgbm8gbmVlZCB0byBhcHBseSBzdHlsaW5nIHZpYSBjb250ZXh0IHJlc29sdXRpb24uXG4gKlxuICogVGhpcyBmdW5jdGlvbiBoYXMgZm91ciBkaWZmZXJlbnQgY2FzZXMgdGhhdCBjYW4gb2NjdXI6XG4gKlxuICogLSBDYXNlIDE6IEFwcGx5IHRoZSBwcm92aWRlZCBwcm9wL3ZhbHVlIChzdHlsZSBvciBjbGFzcykgZW50cnkgdG8gdGhlIGVsZW1lbnRcbiAqICAgICAgICAgICAoaWYgaXQgaXMgYG5vbiBudWxsYCkuXG4gKlxuICogLSBDYXNlIDI6IElmIHZhbHVlIGRvZXMgbm90IGdldCBhcHBsaWVkIChiZWNhdXNlIGl0cyBgbnVsbGAgb3IgYHVuZGVmaW5lZGApIHRoZW4gdGhlIGFsZ29yaXRobVxuICogICAgICAgICAgIHdpbGwgY2hlY2sgdG8gc2VlIGlmIGEgc3R5bGluZyBtYXAgdmFsdWUgd2FzIGFwcGxpZWQgdG8gdGhlIGVsZW1lbnQgYXMgd2VsbCBqdXN0XG4gKiAgICAgICAgICAgYmVmb3JlIHRoaXMgKHZpYSBgc3R5bGVNYXBgIG9yIGBjbGFzc01hcGApLiBJZiBhbmQgd2hlbiBhIG1hcCBpcyBwcmVzZW50IHRoZW4gdGhlXG4gICogICAgICAgICAgYWxnb3JpdGhtIHdpbGwgZmluZCB0aGUgbWF0Y2hpbmcgcHJvcGVydHkgaW4gdGhlIG1hcCBhbmQgYXBwbHkgaXRzIHZhbHVlLlxuICAqXG4gKiAtIENhc2UgMzogSWYgYSBtYXAgdmFsdWUgZmFpbHMgdG8gYmUgYXBwbGllZCB0aGVuIHRoZSBhbGdvcml0aG0gd2lsbCBjaGVjayB0byBzZWUgaWYgdGhlcmVcbiAqICAgICAgICAgICBhcmUgYW55IGluaXRpYWwgdmFsdWVzIHByZXNlbnQgYW5kIGF0dGVtcHQgdG8gYXBwbHkgYSBtYXRjaGluZyB2YWx1ZSBiYXNlZCBvblxuICogICAgICAgICAgIHRoZSB0YXJnZXQgcHJvcC5cbiAqXG4gKiAtIERlZmF1bHQgQ2FzZTogSWYgYSBtYXRjaGluZyBpbml0aWFsIHZhbHVlIGNhbm5vdCBiZSBhcHBsaWVkIHRoZW4gYSBkZWZhdWx0IHZhbHVlXG4gKiAgICAgICAgICAgICAgICAgb2YgYG51bGxgIHdpbGwgYmUgYXBwbGllZCAod2hpY2ggd2lsbCByZW1vdmUgdGhlIHN0eWxlL2NsYXNzIHZhbHVlXG4gKiAgICAgICAgICAgICAgICAgZnJvbSB0aGUgZWxlbWVudCkuXG4gKlxuICogU2VlIGBhbGxvd0RpcmVjdFN0eWxpbmdBcHBseWAgdG8gbGVhcm4gdGhlIGxvZ2ljIHVzZWQgdG8gZGV0ZXJtaW5lIHdoZXRoZXIgYW55IHN0eWxlL2NsYXNzXG4gKiBiaW5kaW5ncyBjYW4gYmUgZGlyZWN0bHkgYXBwbGllZC5cbiAqXG4gKiBAcmV0dXJucyB3aGV0aGVyIG9yIG5vdCB0aGUgcHJvcC92YWx1ZSBzdHlsaW5nIHdhcyBhcHBsaWVkIHRvIHRoZSBlbGVtZW50LlxuICovXG5leHBvcnQgZnVuY3Rpb24gYXBwbHlTdHlsaW5nVmFsdWVEaXJlY3RseShcbiAgICByZW5kZXJlcjogYW55LCBjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQsIGVsZW1lbnQ6IFJFbGVtZW50LCBkYXRhOiBMU3R5bGluZ0RhdGEsXG4gICAgYmluZGluZ0luZGV4OiBudW1iZXIsIHByb3A6IHN0cmluZywgdmFsdWU6IGFueSwgaXNDbGFzc0Jhc2VkOiBib29sZWFuLFxuICAgIHNhbml0aXplcj86IFN0eWxlU2FuaXRpemVGbiB8IG51bGwpOiBib29sZWFuIHtcbiAgbGV0IGFwcGxpZWQgPSBmYWxzZTtcbiAgaWYgKGhhc1ZhbHVlQ2hhbmdlZChkYXRhW2JpbmRpbmdJbmRleF0sIHZhbHVlKSkge1xuICAgIHNldFZhbHVlKGRhdGEsIGJpbmRpbmdJbmRleCwgdmFsdWUpO1xuICAgIGNvbnN0IGFwcGx5Rm4gPSBpc0NsYXNzQmFzZWQgPyBzZXRDbGFzcyA6IHNldFN0eWxlO1xuXG4gICAgLy8gY2FzZSAxOiBhcHBseSB0aGUgcHJvdmlkZWQgdmFsdWUgKGlmIGl0IGV4aXN0cylcbiAgICBhcHBsaWVkID0gYXBwbHlTdHlsaW5nVmFsdWUocmVuZGVyZXIsIGVsZW1lbnQsIHByb3AsIHZhbHVlLCBhcHBseUZuLCBiaW5kaW5nSW5kZXgsIHNhbml0aXplcik7XG5cbiAgICAvLyBjYXNlIDI6IGZpbmQgdGhlIG1hdGNoaW5nIHByb3BlcnR5IGluIGEgc3R5bGluZyBtYXAgYW5kIGFwcGx5IHRoZSBkZXRlY3RlZCB2YWx1ZVxuICAgIGlmICghYXBwbGllZCAmJiBoYXNDb25maWcoY29udGV4dCwgVFN0eWxpbmdDb25maWcuSGFzTWFwQmluZGluZ3MpKSB7XG4gICAgICBjb25zdCBzdGF0ZSA9IGdldFN0eWxpbmdTdGF0ZShlbGVtZW50LCBURU1QTEFURV9ESVJFQ1RJVkVfSU5ERVgpO1xuICAgICAgY29uc3QgbWFwID0gaXNDbGFzc0Jhc2VkID8gc3RhdGUubGFzdERpcmVjdENsYXNzTWFwIDogc3RhdGUubGFzdERpcmVjdFN0eWxlTWFwO1xuICAgICAgYXBwbGllZCA9IG1hcCA/XG4gICAgICAgICAgZmluZEFuZEFwcGx5TWFwVmFsdWUocmVuZGVyZXIsIGVsZW1lbnQsIGFwcGx5Rm4sIG1hcCwgcHJvcCwgYmluZGluZ0luZGV4LCBzYW5pdGl6ZXIpIDpcbiAgICAgICAgICBmYWxzZTtcbiAgICB9XG5cbiAgICAvLyBjYXNlIDM6IGFwcGx5IHRoZSBpbml0aWFsIHZhbHVlIChpZiBpdCBleGlzdHMpXG4gICAgaWYgKCFhcHBsaWVkICYmIGhhc0NvbmZpZyhjb250ZXh0LCBUU3R5bGluZ0NvbmZpZy5IYXNJbml0aWFsU3R5bGluZykpIHtcbiAgICAgIGNvbnN0IG1hcCA9IGdldFN0eWxpbmdNYXBBcnJheShjb250ZXh0KTtcbiAgICAgIGFwcGxpZWQgPVxuICAgICAgICAgIG1hcCA/IGZpbmRBbmRBcHBseU1hcFZhbHVlKHJlbmRlcmVyLCBlbGVtZW50LCBhcHBseUZuLCBtYXAsIHByb3AsIGJpbmRpbmdJbmRleCkgOiBmYWxzZTtcbiAgICB9XG5cbiAgICAvLyBkZWZhdWx0IGNhc2U6IGFwcGx5IGBudWxsYCB0byByZW1vdmUgdGhlIHZhbHVlXG4gICAgaWYgKCFhcHBsaWVkKSB7XG4gICAgICBhcHBseUZuKHJlbmRlcmVyLCBlbGVtZW50LCBwcm9wLCBudWxsLCBiaW5kaW5nSW5kZXgpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gYXBwbGllZDtcbn1cblxuZnVuY3Rpb24gYXBwbHlTdHlsaW5nVmFsdWUoXG4gICAgcmVuZGVyZXI6IGFueSwgZWxlbWVudDogUkVsZW1lbnQsIHByb3A6IHN0cmluZywgdmFsdWU6IGFueSwgYXBwbHlGbjogQXBwbHlTdHlsaW5nRm4sXG4gICAgYmluZGluZ0luZGV4OiBudW1iZXIsIHNhbml0aXplcj86IFN0eWxlU2FuaXRpemVGbiB8IG51bGwpOiBib29sZWFuIHtcbiAgbGV0IHZhbHVlVG9BcHBseTogc3RyaW5nfG51bGwgPSB1bndyYXBTYWZlVmFsdWUodmFsdWUpO1xuICBpZiAoaXNTdHlsaW5nVmFsdWVEZWZpbmVkKHZhbHVlVG9BcHBseSkpIHtcbiAgICB2YWx1ZVRvQXBwbHkgPVxuICAgICAgICBzYW5pdGl6ZXIgPyBzYW5pdGl6ZXIocHJvcCwgdmFsdWUsIFN0eWxlU2FuaXRpemVNb2RlLlZhbGlkYXRlQW5kU2FuaXRpemUpIDogdmFsdWVUb0FwcGx5O1xuICAgIGFwcGx5Rm4ocmVuZGVyZXIsIGVsZW1lbnQsIHByb3AsIHZhbHVlVG9BcHBseSwgYmluZGluZ0luZGV4KTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuICByZXR1cm4gZmFsc2U7XG59XG5cbmZ1bmN0aW9uIGZpbmRBbmRBcHBseU1hcFZhbHVlKFxuICAgIHJlbmRlcmVyOiBhbnksIGVsZW1lbnQ6IFJFbGVtZW50LCBhcHBseUZuOiBBcHBseVN0eWxpbmdGbiwgbWFwOiBTdHlsaW5nTWFwQXJyYXksIHByb3A6IHN0cmluZyxcbiAgICBiaW5kaW5nSW5kZXg6IG51bWJlciwgc2FuaXRpemVyPzogU3R5bGVTYW5pdGl6ZUZuIHwgbnVsbCkge1xuICBmb3IgKGxldCBpID0gU3R5bGluZ01hcEFycmF5SW5kZXguVmFsdWVzU3RhcnRQb3NpdGlvbjsgaSA8IG1hcC5sZW5ndGg7XG4gICAgICAgaSArPSBTdHlsaW5nTWFwQXJyYXlJbmRleC5UdXBsZVNpemUpIHtcbiAgICBjb25zdCBwID0gZ2V0TWFwUHJvcChtYXAsIGkpO1xuICAgIGlmIChwID09PSBwcm9wKSB7XG4gICAgICBsZXQgdmFsdWVUb0FwcGx5ID0gZ2V0TWFwVmFsdWUobWFwLCBpKTtcbiAgICAgIHZhbHVlVG9BcHBseSA9IHNhbml0aXplciA/XG4gICAgICAgICAgc2FuaXRpemVyKHByb3AsIHZhbHVlVG9BcHBseSwgU3R5bGVTYW5pdGl6ZU1vZGUuVmFsaWRhdGVBbmRTYW5pdGl6ZSkgOlxuICAgICAgICAgIHZhbHVlVG9BcHBseTtcbiAgICAgIGFwcGx5Rm4ocmVuZGVyZXIsIGVsZW1lbnQsIHByb3AsIHZhbHVlVG9BcHBseSwgYmluZGluZ0luZGV4KTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICBpZiAocCA+IHByb3ApIHtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuICByZXR1cm4gZmFsc2U7XG59XG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZUJpdE1hc2tWYWx1ZSh2YWx1ZTogbnVtYmVyIHwgYm9vbGVhbik6IG51bWJlciB7XG4gIC8vIGlmIHBhc3MgPT4gYXBwbHkgYWxsIHZhbHVlcyAoLTEgaW1wbGllcyB0aGF0IGFsbCBiaXRzIGFyZSBmbGlwcGVkIHRvIHRydWUpXG4gIGlmICh2YWx1ZSA9PT0gdHJ1ZSkgcmV0dXJuIC0xO1xuXG4gIC8vIGlmIHBhc3MgPT4gc2tpcCBhbGwgdmFsdWVzXG4gIGlmICh2YWx1ZSA9PT0gZmFsc2UpIHJldHVybiAwO1xuXG4gIC8vIHJldHVybiB0aGUgYml0IG1hc2sgdmFsdWUgYXMgaXNcbiAgcmV0dXJuIHZhbHVlO1xufVxuXG5sZXQgX2FjdGl2ZVN0eWxpbmdNYXBBcHBseUZuOiBTeW5jU3R5bGluZ01hcHNGbnxudWxsID0gbnVsbDtcbmV4cG9ydCBmdW5jdGlvbiBnZXRTdHlsaW5nTWFwc1N5bmNGbigpIHtcbiAgcmV0dXJuIF9hY3RpdmVTdHlsaW5nTWFwQXBwbHlGbjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNldFN0eWxpbmdNYXBzU3luY0ZuKGZuOiBTeW5jU3R5bGluZ01hcHNGbikge1xuICBfYWN0aXZlU3R5bGluZ01hcEFwcGx5Rm4gPSBmbjtcbn1cblxuLyoqXG4gKiBBc3NpZ25zIGEgc3R5bGUgdmFsdWUgdG8gYSBzdHlsZSBwcm9wZXJ0eSBmb3IgdGhlIGdpdmVuIGVsZW1lbnQuXG4gKi9cbmV4cG9ydCBjb25zdCBzZXRTdHlsZTogQXBwbHlTdHlsaW5nRm4gPVxuICAgIChyZW5kZXJlcjogUmVuZGVyZXIzIHwgbnVsbCwgbmF0aXZlOiBSRWxlbWVudCwgcHJvcDogc3RyaW5nLCB2YWx1ZTogc3RyaW5nIHwgbnVsbCkgPT4ge1xuICAgICAgaWYgKHJlbmRlcmVyICE9PSBudWxsKSB7XG4gICAgICAgIC8vIFVzZSBgaXNTdHlsaW5nVmFsdWVEZWZpbmVkYCB0byBhY2NvdW50IGZvciBmYWxzeSB2YWx1ZXMgdGhhdCBzaG91bGQgYmUgYm91bmQgbGlrZSAwLlxuICAgICAgICBpZiAoaXNTdHlsaW5nVmFsdWVEZWZpbmVkKHZhbHVlKSkge1xuICAgICAgICAgIC8vIG9wYWNpdHksIHotaW5kZXggYW5kIGZsZXhib3ggYWxsIGhhdmUgbnVtYmVyIHZhbHVlc1xuICAgICAgICAgIC8vIGFuZCB0aGVzZSBuZWVkIHRvIGJlIGNvbnZlcnRlZCBpbnRvIHN0cmluZ3Mgc28gdGhhdFxuICAgICAgICAgIC8vIHRoZXkgY2FuIGJlIGFzc2lnbmVkIHByb3Blcmx5LlxuICAgICAgICAgIHZhbHVlID0gdmFsdWUudG9TdHJpbmcoKTtcbiAgICAgICAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyU2V0U3R5bGUrKztcbiAgICAgICAgICBpZiAoaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpKSB7XG4gICAgICAgICAgICByZW5kZXJlci5zZXRTdHlsZShuYXRpdmUsIHByb3AsIHZhbHVlLCBSZW5kZXJlclN0eWxlRmxhZ3MzLkRhc2hDYXNlKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gVGhlIHJlYXNvbiB3aHkgbmF0aXZlIHN0eWxlIG1heSBiZSBgbnVsbGAgaXMgZWl0aGVyIGJlY2F1c2VcbiAgICAgICAgICAgIC8vIGl0J3MgYSBjb250YWluZXIgZWxlbWVudCBvciBpdCdzIGEgcGFydCBvZiBhIHRlc3RcbiAgICAgICAgICAgIC8vIGVudmlyb25tZW50IHRoYXQgZG9lc24ndCBoYXZlIHN0eWxpbmcuIEluIGVpdGhlclxuICAgICAgICAgICAgLy8gY2FzZSBpdCdzIHNhZmUgbm90IHRvIGFwcGx5IHN0eWxpbmcgdG8gdGhlIGVsZW1lbnQuXG4gICAgICAgICAgICBjb25zdCBuYXRpdmVTdHlsZSA9IG5hdGl2ZS5zdHlsZTtcbiAgICAgICAgICAgIGlmIChuYXRpdmVTdHlsZSAhPSBudWxsKSB7XG4gICAgICAgICAgICAgIG5hdGl2ZVN0eWxlLnNldFByb3BlcnR5KHByb3AsIHZhbHVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlclJlbW92ZVN0eWxlKys7XG5cbiAgICAgICAgICBpZiAoaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpKSB7XG4gICAgICAgICAgICByZW5kZXJlci5yZW1vdmVTdHlsZShuYXRpdmUsIHByb3AsIFJlbmRlcmVyU3R5bGVGbGFnczMuRGFzaENhc2UpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zdCBuYXRpdmVTdHlsZSA9IG5hdGl2ZS5zdHlsZTtcbiAgICAgICAgICAgIGlmIChuYXRpdmVTdHlsZSAhPSBudWxsKSB7XG4gICAgICAgICAgICAgIG5hdGl2ZVN0eWxlLnJlbW92ZVByb3BlcnR5KHByb3ApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH07XG5cbi8qKlxuICogQWRkcy9yZW1vdmVzIHRoZSBwcm92aWRlZCBjbGFzc05hbWUgdmFsdWUgdG8gdGhlIHByb3ZpZGVkIGVsZW1lbnQuXG4gKi9cbmV4cG9ydCBjb25zdCBzZXRDbGFzczogQXBwbHlTdHlsaW5nRm4gPVxuICAgIChyZW5kZXJlcjogUmVuZGVyZXIzIHwgbnVsbCwgbmF0aXZlOiBSRWxlbWVudCwgY2xhc3NOYW1lOiBzdHJpbmcsIHZhbHVlOiBhbnkpID0+IHtcbiAgICAgIGlmIChyZW5kZXJlciAhPT0gbnVsbCAmJiBjbGFzc05hbWUgIT09ICcnKSB7XG4gICAgICAgIGlmICh2YWx1ZSkge1xuICAgICAgICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJBZGRDbGFzcysrO1xuICAgICAgICAgIGlmIChpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikpIHtcbiAgICAgICAgICAgIHJlbmRlcmVyLmFkZENsYXNzKG5hdGl2ZSwgY2xhc3NOYW1lKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gdGhlIHJlYXNvbiB3aHkgY2xhc3NMaXN0IG1heSBiZSBgbnVsbGAgaXMgZWl0aGVyIGJlY2F1c2VcbiAgICAgICAgICAgIC8vIGl0J3MgYSBjb250YWluZXIgZWxlbWVudCBvciBpdCdzIGEgcGFydCBvZiBhIHRlc3RcbiAgICAgICAgICAgIC8vIGVudmlyb25tZW50IHRoYXQgZG9lc24ndCBoYXZlIHN0eWxpbmcuIEluIGVpdGhlclxuICAgICAgICAgICAgLy8gY2FzZSBpdCdzIHNhZmUgbm90IHRvIGFwcGx5IHN0eWxpbmcgdG8gdGhlIGVsZW1lbnQuXG4gICAgICAgICAgICBjb25zdCBjbGFzc0xpc3QgPSBuYXRpdmUuY2xhc3NMaXN0O1xuICAgICAgICAgICAgaWYgKGNsYXNzTGlzdCAhPSBudWxsKSB7XG4gICAgICAgICAgICAgIGNsYXNzTGlzdC5hZGQoY2xhc3NOYW1lKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlclJlbW92ZUNsYXNzKys7XG4gICAgICAgICAgaWYgKGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSkge1xuICAgICAgICAgICAgcmVuZGVyZXIucmVtb3ZlQ2xhc3MobmF0aXZlLCBjbGFzc05hbWUpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zdCBjbGFzc0xpc3QgPSBuYXRpdmUuY2xhc3NMaXN0O1xuICAgICAgICAgICAgaWYgKGNsYXNzTGlzdCAhPSBudWxsKSB7XG4gICAgICAgICAgICAgIGNsYXNzTGlzdC5yZW1vdmUoY2xhc3NOYW1lKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9O1xuXG5leHBvcnQgY29uc3Qgc2V0Q2xhc3NOYW1lID0gKHJlbmRlcmVyOiBSZW5kZXJlcjMgfCBudWxsLCBuYXRpdmU6IFJFbGVtZW50LCBjbGFzc05hbWU6IHN0cmluZykgPT4ge1xuICBpZiAocmVuZGVyZXIgIT09IG51bGwpIHtcbiAgICBpZiAoaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpKSB7XG4gICAgICByZW5kZXJlci5zZXRBdHRyaWJ1dGUobmF0aXZlLCAnY2xhc3MnLCBjbGFzc05hbWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICBuYXRpdmUuY2xhc3NOYW1lID0gY2xhc3NOYW1lO1xuICAgIH1cbiAgfVxufTtcblxuZXhwb3J0IGNvbnN0IHNldFN0eWxlQXR0ciA9IChyZW5kZXJlcjogUmVuZGVyZXIzIHwgbnVsbCwgbmF0aXZlOiBSRWxlbWVudCwgdmFsdWU6IHN0cmluZykgPT4ge1xuICBpZiAocmVuZGVyZXIgIT09IG51bGwpIHtcbiAgICBpZiAoaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpKSB7XG4gICAgICByZW5kZXJlci5zZXRBdHRyaWJ1dGUobmF0aXZlLCAnc3R5bGUnLCB2YWx1ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG5hdGl2ZS5zZXRBdHRyaWJ1dGUoJ3N0eWxlJywgdmFsdWUpO1xuICAgIH1cbiAgfVxufTtcblxuLyoqXG4gKiBJdGVyYXRlcyBvdmVyIGFsbCBwcm92aWRlZCBzdHlsaW5nIGVudHJpZXMgYW5kIHJlbmRlcnMgdGhlbSBvbiB0aGUgZWxlbWVudC5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIGlzIHVzZWQgYWxvbmdzaWRlIGEgYFN0eWxpbmdNYXBBcnJheWAgZW50cnkuIFRoaXMgZW50cnkgaXMgbm90XG4gKiB0aGUgc2FtZSBhcyB0aGUgYFRTdHlsaW5nQ29udGV4dGAgYW5kIGlzIG9ubHkgcmVhbGx5IHVzZWQgd2hlbiBhbiBlbGVtZW50IGNvbnRhaW5zXG4gKiBpbml0aWFsIHN0eWxpbmcgdmFsdWVzIChlLmcuIGA8ZGl2IHN0eWxlPVwid2lkdGg6MjAwcHhcIj5gKSwgYnV0IG5vIHN0eWxlL2NsYXNzIGJpbmRpbmdzXG4gKiBhcmUgcHJlc2VudC4gSWYgYW5kIHdoZW4gdGhhdCBoYXBwZW5zIHRoZW4gdGhpcyBmdW5jdGlvbiB3aWxsIGJlIGNhbGxlZCB0byByZW5kZXIgYWxsXG4gKiBpbml0aWFsIHN0eWxpbmcgdmFsdWVzIG9uIGFuIGVsZW1lbnQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZW5kZXJTdHlsaW5nTWFwKFxuICAgIHJlbmRlcmVyOiBSZW5kZXJlcjMsIGVsZW1lbnQ6IFJFbGVtZW50LCBzdHlsaW5nVmFsdWVzOiBUU3R5bGluZ0NvbnRleHQgfCBTdHlsaW5nTWFwQXJyYXkgfCBudWxsLFxuICAgIGlzQ2xhc3NCYXNlZDogYm9vbGVhbik6IHZvaWQge1xuICBjb25zdCBzdHlsaW5nTWFwQXJyID0gZ2V0U3R5bGluZ01hcEFycmF5KHN0eWxpbmdWYWx1ZXMpO1xuICBpZiAoc3R5bGluZ01hcEFycikge1xuICAgIGZvciAobGV0IGkgPSBTdHlsaW5nTWFwQXJyYXlJbmRleC5WYWx1ZXNTdGFydFBvc2l0aW9uOyBpIDwgc3R5bGluZ01hcEFyci5sZW5ndGg7XG4gICAgICAgICBpICs9IFN0eWxpbmdNYXBBcnJheUluZGV4LlR1cGxlU2l6ZSkge1xuICAgICAgY29uc3QgcHJvcCA9IGdldE1hcFByb3Aoc3R5bGluZ01hcEFyciwgaSk7XG4gICAgICBjb25zdCB2YWx1ZSA9IGdldE1hcFZhbHVlKHN0eWxpbmdNYXBBcnIsIGkpO1xuICAgICAgaWYgKGlzQ2xhc3NCYXNlZCkge1xuICAgICAgICBzZXRDbGFzcyhyZW5kZXJlciwgZWxlbWVudCwgcHJvcCwgdmFsdWUsIG51bGwpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc2V0U3R5bGUocmVuZGVyZXIsIGVsZW1lbnQsIHByb3AsIHZhbHVlLCBudWxsKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gb2JqZWN0VG9DbGFzc05hbWUob2JqOiB7W2tleTogc3RyaW5nXTogYW55fSB8IG51bGwpOiBzdHJpbmcge1xuICBsZXQgc3RyID0gJyc7XG4gIGlmIChvYmopIHtcbiAgICBmb3IgKGxldCBrZXkgaW4gb2JqKSB7XG4gICAgICBjb25zdCB2YWx1ZSA9IG9ialtrZXldO1xuICAgICAgaWYgKHZhbHVlKSB7XG4gICAgICAgIHN0ciArPSAoc3RyLmxlbmd0aCA/ICcgJyA6ICcnKSArIGtleTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIHN0cjtcbn1cblxuLyoqXG4gKiBEZXRlcm1pbmVzIHdoZXRoZXIgb3Igbm90IGFuIGVsZW1lbnQgc3R5bGUvY2xhc3NOYW1lIHZhbHVlIGhhcyBjaGFuZ2VkIHNpbmNlIHRoZSBsYXN0IHVwZGF0ZS5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIGhlbHBzIEFuZ3VsYXIgZGV0ZXJtaW5lIGlmIGEgc3R5bGUgb3IgY2xhc3MgYXR0cmlidXRlIHZhbHVlIHdhc1xuICogbW9kaWZpZWQgYnkgYW4gZXh0ZXJuYWwgcGx1Z2luIG9yIEFQSSBvdXRzaWRlIG9mIHRoZSBzdHlsZSBiaW5kaW5nIGNvZGUuIFRoaXNcbiAqIG1lYW5zIGFueSBKUyBjb2RlIHRoYXQgYWRkcy9yZW1vdmVzIGNsYXNzL3N0eWxlIHZhbHVlcyBvbiBhbiBlbGVtZW50IG91dHNpZGVcbiAqIG9mIEFuZ3VsYXIncyBzdHlsaW5nIGJpbmRpbmcgYWxnb3JpdGhtLlxuICpcbiAqIEByZXR1cm5zIHRydWUgd2hlbiB0aGUgdmFsdWUgd2FzIG1vZGlmaWVkIGV4dGVybmFsbHkuXG4gKi9cbmZ1bmN0aW9uIGNoZWNrSWZFeHRlcm5hbGx5TW9kaWZpZWQoZWxlbWVudDogSFRNTEVsZW1lbnQsIGNhY2hlZFZhbHVlOiBhbnksIGlzQ2xhc3NCYXNlZDogYm9vbGVhbikge1xuICAvLyB0aGlzIG1lYW5zIGl0IHdhcyBjaGVja2VkIGJlZm9yZSBhbmQgdGhlcmUgaXMgbm8gcmVhc29uXG4gIC8vIHRvIGNvbXBhcmUgdGhlIHN0eWxlL2NsYXNzIHZhbHVlcyBhZ2Fpbi4gRWl0aGVyIHRoYXQgb3JcbiAgLy8gd2ViIHdvcmtlcnMgYXJlIGJlaW5nIHVzZWQuXG4gIGlmIChnbG9iYWwuTm9kZSA9PT0gJ3VuZGVmaW5lZCcgfHwgY2FjaGVkVmFsdWUgPT09IFZBTFVFX0lTX0VYVEVSTkFMTFlfTU9ESUZJRUQpIHJldHVybiB0cnVlO1xuXG4gIC8vIGNvbXBhcmluZyB0aGUgRE9NIHZhbHVlIGFnYWluc3QgdGhlIGNhY2hlZCB2YWx1ZSBpcyB0aGUgYmVzdCB3YXkgdG9cbiAgLy8gc2VlIGlmIHNvbWV0aGluZyBoYXMgY2hhbmdlZC5cbiAgY29uc3QgY3VycmVudFZhbHVlID1cbiAgICAgIChpc0NsYXNzQmFzZWQgPyBlbGVtZW50LmNsYXNzTmFtZSA6IChlbGVtZW50LnN0eWxlICYmIGVsZW1lbnQuc3R5bGUuY3NzVGV4dCkpIHx8ICcnO1xuICByZXR1cm4gY3VycmVudFZhbHVlICE9PSAoY2FjaGVkVmFsdWUgfHwgJycpO1xufVxuXG4vKipcbiAqIFJlbW92ZXMgcHJvdmlkZWQgc3R5bGluZyB2YWx1ZXMgZnJvbSB0aGUgZWxlbWVudFxuICovXG5mdW5jdGlvbiByZW1vdmVTdHlsaW5nVmFsdWVzKFxuICAgIHJlbmRlcmVyOiBhbnksIGVsZW1lbnQ6IFJFbGVtZW50LCB2YWx1ZXM6IHN0cmluZyB8IHtba2V5OiBzdHJpbmddOiBhbnl9IHwgU3R5bGluZ01hcEFycmF5LFxuICAgIGlzQ2xhc3NCYXNlZDogYm9vbGVhbikge1xuICBsZXQgYXJyOiBTdHlsaW5nTWFwQXJyYXk7XG4gIGlmIChpc1N0eWxpbmdNYXBBcnJheSh2YWx1ZXMpKSB7XG4gICAgYXJyID0gdmFsdWVzIGFzIFN0eWxpbmdNYXBBcnJheTtcbiAgfSBlbHNlIHtcbiAgICBhcnIgPSBub3JtYWxpemVJbnRvU3R5bGluZ01hcChudWxsLCB2YWx1ZXMsICFpc0NsYXNzQmFzZWQpO1xuICB9XG5cbiAgY29uc3QgYXBwbHlGbiA9IGlzQ2xhc3NCYXNlZCA/IHNldENsYXNzIDogc2V0U3R5bGU7XG4gIGZvciAobGV0IGkgPSBTdHlsaW5nTWFwQXJyYXlJbmRleC5WYWx1ZXNTdGFydFBvc2l0aW9uOyBpIDwgYXJyLmxlbmd0aDtcbiAgICAgICBpICs9IFN0eWxpbmdNYXBBcnJheUluZGV4LlR1cGxlU2l6ZSkge1xuICAgIGNvbnN0IHZhbHVlID0gZ2V0TWFwVmFsdWUoYXJyLCBpKTtcbiAgICBpZiAodmFsdWUpIHtcbiAgICAgIGNvbnN0IHByb3AgPSBnZXRNYXBQcm9wKGFyciwgaSk7XG4gICAgICBhcHBseUZuKHJlbmRlcmVyLCBlbGVtZW50LCBwcm9wLCBmYWxzZSk7XG4gICAgfVxuICB9XG59XG4iXX0=