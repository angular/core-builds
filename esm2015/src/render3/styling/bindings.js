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
import { DEFAULT_BINDING_INDEX, DEFAULT_BINDING_VALUE, DEFAULT_GUARD_MASK_VALUE, MAP_BASED_ENTRY_PROP_NAME, TEMPLATE_DIRECTIVE_INDEX, concatString, forceStylesAsString, getBindingValue, getConfig, getDefaultValue, getGuardMask, getInitialStylingValue, getMapProp, getMapValue, getProp, getPropValuesStartPosition, getStylingMapArray, getTotalSources, getValue, getValuesCount, hasConfig, hasValueChanged, isHostStylingActive, isSanitizationRequired, isStylingMapArray, isStylingValueDefined, normalizeIntoStylingMap, patchConfig, setDefaultValue, setGuardMask, setMapAsDirty, setValue } from '../util/styling_utils';
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
 * @param {?} forceUpdate
 * @param {?} firstUpdatePass
 * @return {?}
 */
export function updateClassViaContext(context, data, element, directiveIndex, prop, bindingIndex, value, forceUpdate, firstUpdatePass) {
    /** @type {?} */
    const isMapBased = !prop;
    /** @type {?} */
    const state = getStylingState(element, directiveIndex);
    /** @type {?} */
    const countIndex = isMapBased ? STYLING_INDEX_FOR_MAP_BINDING : state.classesIndex++;
    // even if the initial value is a `NO_CHANGE` value (e.g. interpolation or [ngClass])
    // then we still need to register the binding within the context so that the context
    // is aware of the binding even if things change after the first update pass.
    if (firstUpdatePass || value !== NO_CHANGE) {
        /** @type {?} */
        const updated = updateBindingData(context, data, countIndex, state.sourceIndex, prop, bindingIndex, value, forceUpdate, false, firstUpdatePass);
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
 * @param {?} forceUpdate
 * @param {?} firstUpdatePass
 * @return {?}
 */
export function updateStyleViaContext(context, data, element, directiveIndex, prop, bindingIndex, value, sanitizer, forceUpdate, firstUpdatePass) {
    /** @type {?} */
    const isMapBased = !prop;
    /** @type {?} */
    const state = getStylingState(element, directiveIndex);
    /** @type {?} */
    const countIndex = isMapBased ? STYLING_INDEX_FOR_MAP_BINDING : state.stylesIndex++;
    // even if the initial value is a `NO_CHANGE` value (e.g. interpolation or [ngStyle])
    // then we still need to register the binding within the context so that the context
    // is aware of the binding even if things change after the first update pass.
    if (firstUpdatePass || value !== NO_CHANGE) {
        /** @type {?} */
        const sanitizationRequired = isMapBased ?
            true :
            (sanitizer ? sanitizer((/** @type {?} */ (prop)), null, 1 /* ValidateProperty */) : false);
        /** @type {?} */
        const updated = updateBindingData(context, data, countIndex, state.sourceIndex, prop, bindingIndex, value, forceUpdate, sanitizationRequired, firstUpdatePass);
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
 * @param {?} forceUpdate
 * @param {?} sanitizationRequired
 * @param {?} firstUpdatePass
 * @return {?} whether or not the binding value was updated in the `LStylingData`.
 */
function updateBindingData(context, data, counterIndex, sourceIndex, prop, bindingIndex, value, forceUpdate, sanitizationRequired, firstUpdatePass) {
    /** @type {?} */
    const hostBindingsMode = isHostStylingActive(sourceIndex);
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
 * @param {?} firstUpdatePass
 * @return {?}
 */
export function flushStyling(renderer, data, classesContext, stylesContext, element, directiveIndex, styleSanitizer, firstUpdatePass) {
    ngDevMode && ngDevMode.flushStyling++;
    /** @type {?} */
    const state = getStylingState(element, directiveIndex);
    /** @type {?} */
    const hostBindingsMode = isHostStylingActive(state.sourceIndex);
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
 * @param {?} context
 * @return {?}
 */
function syncContextInitialStyling(context) {
    // the TStylingContext always has initial style/class values which are
    // stored in styling array format.
    updateInitialStylingOnContext(context, (/** @type {?} */ (getStylingMapArray(context))));
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
            const initialValue = hasInitial && !bindingValueContainsInitial ? getInitialStylingValue(context) : null;
            /** @type {?} */
            const valueToApply = writeStylingValueDirectly(renderer, element, value, isClassBased, initialValue);
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
 * @param {?} renderer
 * @param {?} element
 * @param {?} value
 * @param {?} isClassBased
 * @param {?} initialValue
 * @return {?}
 */
export function writeStylingValueDirectly(renderer, element, value, isClassBased, initialValue) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmluZGluZ3MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL3N0eWxpbmcvYmluZGluZ3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFPQSxPQUFPLEVBQVksZUFBZSxFQUFDLE1BQU0sMkJBQTJCLENBQUM7QUFFckUsT0FBTyxFQUFDLE1BQU0sRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQ3pDLE9BQU8sRUFBMkMsbUJBQW1CLEVBQUUsb0JBQW9CLEVBQUMsTUFBTSx3QkFBd0IsQ0FBQztBQUUzSCxPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sV0FBVyxDQUFDO0FBQ3BDLE9BQU8sRUFBQyxxQkFBcUIsRUFBRSxxQkFBcUIsRUFBRSx3QkFBd0IsRUFBRSx5QkFBeUIsRUFBRSx3QkFBd0IsRUFBRSxZQUFZLEVBQUUsbUJBQW1CLEVBQUUsZUFBZSxFQUFFLFNBQVMsRUFBRSxlQUFlLEVBQUUsWUFBWSxFQUFFLHNCQUFzQixFQUFFLFVBQVUsRUFBRSxXQUFXLEVBQUUsT0FBTyxFQUFFLDBCQUEwQixFQUFFLGtCQUFrQixFQUFFLGVBQWUsRUFBRSxRQUFRLEVBQUUsY0FBYyxFQUFFLFNBQVMsRUFBRSxlQUFlLEVBQUUsbUJBQW1CLEVBQUUsc0JBQXNCLEVBQUUsaUJBQWlCLEVBQUUscUJBQXFCLEVBQUUsdUJBQXVCLEVBQUUsV0FBVyxFQUFFLGVBQWUsRUFBRSxZQUFZLEVBQUUsYUFBYSxFQUFFLFFBQVEsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBRXRtQixPQUFPLEVBQUMsZUFBZSxFQUFFLGlCQUFpQixFQUFDLE1BQU0sU0FBUyxDQUFDOztNQUVyRCw0QkFBNEIsR0FBRyxFQUFFOzs7Ozs7O01BMEJqQyw2QkFBNkIsR0FBRyxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFZdkMsTUFBTSxVQUFVLHFCQUFxQixDQUNqQyxPQUF3QixFQUFF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QUtELFNBQVMsbUJBQW1CLENBQ3hCLFFBQWEsRUFBRSxPQUFpQixFQUFFLE1BQXVELEVBQ3pGLFlBQXFCOztRQUNuQixHQUFvQjtJQUN4QixJQUFJLGlCQUFpQixDQUFDLE1BQU0sQ0FBQyxFQUFFO1FBQzdCLEdBQUcsR0FBRyxtQkFBQSxNQUFNLEVBQW1CLENBQUM7S0FDakM7U0FBTTtRQUNMLEdBQUcsR0FBRyx1QkFBdUIsQ0FBQyxJQUFJLEVBQUUsTUFBTSxFQUFFLENBQUMsWUFBWSxDQUFDLENBQUM7S0FDNUQ7O1VBRUssT0FBTyxHQUFHLFlBQVksQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxRQUFRO0lBQ2xELEtBQUssSUFBSSxDQUFDLDhCQUEyQyxFQUFFLENBQUMsR0FBRyxHQUFHLENBQUMsTUFBTSxFQUNoRSxDQUFDLHFCQUFrQyxFQUFFOztjQUNsQyxLQUFLLEdBQUcsV0FBVyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUM7UUFDakMsSUFBSSxLQUFLLEVBQUU7O2tCQUNILElBQUksR0FBRyxVQUFVLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQztZQUMvQixPQUFPLENBQUMsUUFBUSxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUM7U0FDekM7S0FDRjtBQUNILENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiogQGxpY2Vuc2VcbiogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4qXG4qIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4qIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiovXG5pbXBvcnQge1NhZmVWYWx1ZSwgdW53cmFwU2FmZVZhbHVlfSBmcm9tICcuLi8uLi9zYW5pdGl6YXRpb24vYnlwYXNzJztcbmltcG9ydCB7U3R5bGVTYW5pdGl6ZUZuLCBTdHlsZVNhbml0aXplTW9kZX0gZnJvbSAnLi4vLi4vc2FuaXRpemF0aW9uL3N0eWxlX3Nhbml0aXplcic7XG5pbXBvcnQge2dsb2JhbH0gZnJvbSAnLi4vLi4vdXRpbC9nbG9iYWwnO1xuaW1wb3J0IHtQcm9jZWR1cmFsUmVuZGVyZXIzLCBSRWxlbWVudCwgUmVuZGVyZXIzLCBSZW5kZXJlclN0eWxlRmxhZ3MzLCBpc1Byb2NlZHVyYWxSZW5kZXJlcn0gZnJvbSAnLi4vaW50ZXJmYWNlcy9yZW5kZXJlcic7XG5pbXBvcnQge0FwcGx5U3R5bGluZ0ZuLCBMU3R5bGluZ0RhdGEsIFN0eWxpbmdNYXBBcnJheSwgU3R5bGluZ01hcEFycmF5SW5kZXgsIFN0eWxpbmdNYXBzU3luY01vZGUsIFN5bmNTdHlsaW5nTWFwc0ZuLCBUU3R5bGluZ0NvbmZpZywgVFN0eWxpbmdDb250ZXh0LCBUU3R5bGluZ0NvbnRleHRJbmRleCwgVFN0eWxpbmdDb250ZXh0UHJvcENvbmZpZ0ZsYWdzfSBmcm9tICcuLi9pbnRlcmZhY2VzL3N0eWxpbmcnO1xuaW1wb3J0IHtOT19DSEFOR0V9IGZyb20gJy4uL3Rva2Vucyc7XG5pbXBvcnQge0RFRkFVTFRfQklORElOR19JTkRFWCwgREVGQVVMVF9CSU5ESU5HX1ZBTFVFLCBERUZBVUxUX0dVQVJEX01BU0tfVkFMVUUsIE1BUF9CQVNFRF9FTlRSWV9QUk9QX05BTUUsIFRFTVBMQVRFX0RJUkVDVElWRV9JTkRFWCwgY29uY2F0U3RyaW5nLCBmb3JjZVN0eWxlc0FzU3RyaW5nLCBnZXRCaW5kaW5nVmFsdWUsIGdldENvbmZpZywgZ2V0RGVmYXVsdFZhbHVlLCBnZXRHdWFyZE1hc2ssIGdldEluaXRpYWxTdHlsaW5nVmFsdWUsIGdldE1hcFByb3AsIGdldE1hcFZhbHVlLCBnZXRQcm9wLCBnZXRQcm9wVmFsdWVzU3RhcnRQb3NpdGlvbiwgZ2V0U3R5bGluZ01hcEFycmF5LCBnZXRUb3RhbFNvdXJjZXMsIGdldFZhbHVlLCBnZXRWYWx1ZXNDb3VudCwgaGFzQ29uZmlnLCBoYXNWYWx1ZUNoYW5nZWQsIGlzSG9zdFN0eWxpbmdBY3RpdmUsIGlzU2FuaXRpemF0aW9uUmVxdWlyZWQsIGlzU3R5bGluZ01hcEFycmF5LCBpc1N0eWxpbmdWYWx1ZURlZmluZWQsIG5vcm1hbGl6ZUludG9TdHlsaW5nTWFwLCBwYXRjaENvbmZpZywgc2V0RGVmYXVsdFZhbHVlLCBzZXRHdWFyZE1hc2ssIHNldE1hcEFzRGlydHksIHNldFZhbHVlfSBmcm9tICcuLi91dGlsL3N0eWxpbmdfdXRpbHMnO1xuXG5pbXBvcnQge2dldFN0eWxpbmdTdGF0ZSwgcmVzZXRTdHlsaW5nU3RhdGV9IGZyb20gJy4vc3RhdGUnO1xuXG5jb25zdCBWQUxVRV9JU19FWFRFUk5BTExZX01PRElGSUVEID0ge307XG5cbi8qKlxuICogLS0tLS0tLS1cbiAqXG4gKiBUaGlzIGZpbGUgY29udGFpbnMgdGhlIGNvcmUgbG9naWMgZm9yIHN0eWxpbmcgaW4gQW5ndWxhci5cbiAqXG4gKiBBbGwgc3R5bGluZyBiaW5kaW5ncyAoaS5lLiBgW3N0eWxlXWAsIGBbc3R5bGUucHJvcF1gLCBgW2NsYXNzXWAgYW5kIGBbY2xhc3MubmFtZV1gKVxuICogd2lsbCBoYXZlIHRoZWlyIHZhbHVlcyBiZSBhcHBsaWVkIHRocm91Z2ggdGhlIGxvZ2ljIGluIHRoaXMgZmlsZS5cbiAqXG4gKiBXaGVuIGEgYmluZGluZyBpcyBlbmNvdW50ZXJlZCAoZS5nLiBgPGRpdiBbc3R5bGUud2lkdGhdPVwid1wiPmApIHRoZW5cbiAqIHRoZSBiaW5kaW5nIGRhdGEgd2lsbCBiZSBwb3B1bGF0ZWQgaW50byBhIGBUU3R5bGluZ0NvbnRleHRgIGRhdGEtc3RydWN0dXJlLlxuICogVGhlcmUgaXMgb25seSBvbmUgYFRTdHlsaW5nQ29udGV4dGAgcGVyIGBUTm9kZWAgYW5kIGVhY2ggZWxlbWVudCBpbnN0YW5jZVxuICogd2lsbCB1cGRhdGUgaXRzIHN0eWxlL2NsYXNzIGJpbmRpbmcgdmFsdWVzIGluIGNvbmNlcnQgd2l0aCB0aGUgc3R5bGluZ1xuICogY29udGV4dC5cbiAqXG4gKiBUbyBsZWFybiBtb3JlIGFib3V0IHRoZSBhbGdvcml0aG0gc2VlIGBUU3R5bGluZ0NvbnRleHRgLlxuICpcbiAqIC0tLS0tLS0tXG4gKi9cblxuLyoqXG4gKiBUaGUgZ3VhcmQvdXBkYXRlIG1hc2sgYml0IGluZGV4IGxvY2F0aW9uIGZvciBtYXAtYmFzZWQgYmluZGluZ3MuXG4gKlxuICogQWxsIG1hcC1iYXNlZCBiaW5kaW5ncyAoaS5lLiBgW3N0eWxlXWAgYW5kIGBbY2xhc3NdYCApXG4gKi9cbmNvbnN0IFNUWUxJTkdfSU5ERVhfRk9SX01BUF9CSU5ESU5HID0gMDtcblxuLyoqXG4gKiBWaXNpdHMgYSBjbGFzcy1iYXNlZCBiaW5kaW5nIGFuZCB1cGRhdGVzIHRoZSBuZXcgdmFsdWUgKGlmIGNoYW5nZWQpLlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gaXMgY2FsbGVkIGVhY2ggdGltZSBhIGNsYXNzLWJhc2VkIHN0eWxpbmcgaW5zdHJ1Y3Rpb25cbiAqIGlzIGV4ZWN1dGVkLiBJdCdzIGltcG9ydGFudCB0aGF0IGl0J3MgYWx3YXlzIGNhbGxlZCAoZXZlbiBpZiB0aGUgdmFsdWVcbiAqIGhhcyBub3QgY2hhbmdlZCkgc28gdGhhdCB0aGUgaW5uZXIgY291bnRlciBpbmRleCB2YWx1ZSBpcyBpbmNyZW1lbnRlZC5cbiAqIFRoaXMgd2F5LCBlYWNoIGluc3RydWN0aW9uIGlzIGFsd2F5cyBndWFyYW50ZWVkIHRvIGdldCB0aGUgc2FtZSBjb3VudGVyXG4gKiBzdGF0ZSBlYWNoIHRpbWUgaXQncyBjYWxsZWQgKHdoaWNoIHRoZW4gYWxsb3dzIHRoZSBgVFN0eWxpbmdDb250ZXh0YFxuICogYW5kIHRoZSBiaXQgbWFzayB2YWx1ZXMgdG8gYmUgaW4gc3luYykuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB1cGRhdGVDbGFzc1ZpYUNvbnRleHQoXG4gICAgY29udGV4dDogVFN0eWxpbmdDb250ZXh0LCBkYXRhOiBMU3R5bGluZ0RhdGEsIGVsZW1lbnQ6IFJFbGVtZW50LCBkaXJlY3RpdmVJbmRleDogbnVtYmVyLFxuICAgIHByb3A6IHN0cmluZyB8IG51bGwsIGJpbmRpbmdJbmRleDogbnVtYmVyLFxuICAgIHZhbHVlOiBib29sZWFuIHwgc3RyaW5nIHwgbnVsbCB8IHVuZGVmaW5lZCB8IFN0eWxpbmdNYXBBcnJheSB8IE5PX0NIQU5HRSwgZm9yY2VVcGRhdGU6IGJvb2xlYW4sXG4gICAgZmlyc3RVcGRhdGVQYXNzOiBib29sZWFuKTogYm9vbGVhbiB7XG4gIGNvbnN0IGlzTWFwQmFzZWQgPSAhcHJvcDtcbiAgY29uc3Qgc3RhdGUgPSBnZXRTdHlsaW5nU3RhdGUoZWxlbWVudCwgZGlyZWN0aXZlSW5kZXgpO1xuICBjb25zdCBjb3VudEluZGV4ID0gaXNNYXBCYXNlZCA/IFNUWUxJTkdfSU5ERVhfRk9SX01BUF9CSU5ESU5HIDogc3RhdGUuY2xhc3Nlc0luZGV4Kys7XG5cbiAgLy8gZXZlbiBpZiB0aGUgaW5pdGlhbCB2YWx1ZSBpcyBhIGBOT19DSEFOR0VgIHZhbHVlIChlLmcuIGludGVycG9sYXRpb24gb3IgW25nQ2xhc3NdKVxuICAvLyB0aGVuIHdlIHN0aWxsIG5lZWQgdG8gcmVnaXN0ZXIgdGhlIGJpbmRpbmcgd2l0aGluIHRoZSBjb250ZXh0IHNvIHRoYXQgdGhlIGNvbnRleHRcbiAgLy8gaXMgYXdhcmUgb2YgdGhlIGJpbmRpbmcgZXZlbiBpZiB0aGluZ3MgY2hhbmdlIGFmdGVyIHRoZSBmaXJzdCB1cGRhdGUgcGFzcy5cbiAgaWYgKGZpcnN0VXBkYXRlUGFzcyB8fCB2YWx1ZSAhPT0gTk9fQ0hBTkdFKSB7XG4gICAgY29uc3QgdXBkYXRlZCA9IHVwZGF0ZUJpbmRpbmdEYXRhKFxuICAgICAgICBjb250ZXh0LCBkYXRhLCBjb3VudEluZGV4LCBzdGF0ZS5zb3VyY2VJbmRleCwgcHJvcCwgYmluZGluZ0luZGV4LCB2YWx1ZSwgZm9yY2VVcGRhdGUsIGZhbHNlLFxuICAgICAgICBmaXJzdFVwZGF0ZVBhc3MpO1xuICAgIGlmICh1cGRhdGVkIHx8IGZvcmNlVXBkYXRlKSB7XG4gICAgICAvLyBXZSBmbGlwIHRoZSBiaXQgaW4gdGhlIGJpdE1hc2sgdG8gcmVmbGVjdCB0aGF0IHRoZSBiaW5kaW5nXG4gICAgICAvLyBhdCB0aGUgYGluZGV4YCBzbG90IGhhcyBjaGFuZ2VkLiBUaGlzIGlkZW50aWZpZXMgdG8gdGhlIGZsdXNoaW5nXG4gICAgICAvLyBwaGFzZSB0aGF0IHRoZSBiaW5kaW5ncyBmb3IgdGhpcyBwYXJ0aWN1bGFyIENTUyBjbGFzcyBuZWVkIHRvIGJlXG4gICAgICAvLyBhcHBsaWVkIGFnYWluIGJlY2F1c2Ugb24gb3IgbW9yZSBvZiB0aGUgYmluZGluZ3MgZm9yIHRoZSBDU1NcbiAgICAgIC8vIGNsYXNzIGhhdmUgY2hhbmdlZC5cbiAgICAgIHN0YXRlLmNsYXNzZXNCaXRNYXNrIHw9IDEgPDwgY291bnRJbmRleDtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgfVxuICByZXR1cm4gZmFsc2U7XG59XG5cbi8qKlxuICogVmlzaXRzIGEgc3R5bGUtYmFzZWQgYmluZGluZyBhbmQgdXBkYXRlcyB0aGUgbmV3IHZhbHVlIChpZiBjaGFuZ2VkKS5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIGlzIGNhbGxlZCBlYWNoIHRpbWUgYSBzdHlsZS1iYXNlZCBzdHlsaW5nIGluc3RydWN0aW9uXG4gKiBpcyBleGVjdXRlZC4gSXQncyBpbXBvcnRhbnQgdGhhdCBpdCdzIGFsd2F5cyBjYWxsZWQgKGV2ZW4gaWYgdGhlIHZhbHVlXG4gKiBoYXMgbm90IGNoYW5nZWQpIHNvIHRoYXQgdGhlIGlubmVyIGNvdW50ZXIgaW5kZXggdmFsdWUgaXMgaW5jcmVtZW50ZWQuXG4gKiBUaGlzIHdheSwgZWFjaCBpbnN0cnVjdGlvbiBpcyBhbHdheXMgZ3VhcmFudGVlZCB0byBnZXQgdGhlIHNhbWUgY291bnRlclxuICogc3RhdGUgZWFjaCB0aW1lIGl0J3MgY2FsbGVkICh3aGljaCB0aGVuIGFsbG93cyB0aGUgYFRTdHlsaW5nQ29udGV4dGBcbiAqIGFuZCB0aGUgYml0IG1hc2sgdmFsdWVzIHRvIGJlIGluIHN5bmMpLlxuICovXG5leHBvcnQgZnVuY3Rpb24gdXBkYXRlU3R5bGVWaWFDb250ZXh0KFxuICAgIGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCwgZGF0YTogTFN0eWxpbmdEYXRhLCBlbGVtZW50OiBSRWxlbWVudCwgZGlyZWN0aXZlSW5kZXg6IG51bWJlcixcbiAgICBwcm9wOiBzdHJpbmcgfCBudWxsLCBiaW5kaW5nSW5kZXg6IG51bWJlcixcbiAgICB2YWx1ZTogc3RyaW5nIHwgbnVtYmVyIHwgU2FmZVZhbHVlIHwgbnVsbCB8IHVuZGVmaW5lZCB8IFN0eWxpbmdNYXBBcnJheSB8IE5PX0NIQU5HRSxcbiAgICBzYW5pdGl6ZXI6IFN0eWxlU2FuaXRpemVGbiB8IG51bGwsIGZvcmNlVXBkYXRlOiBib29sZWFuLCBmaXJzdFVwZGF0ZVBhc3M6IGJvb2xlYW4pOiBib29sZWFuIHtcbiAgY29uc3QgaXNNYXBCYXNlZCA9ICFwcm9wO1xuICBjb25zdCBzdGF0ZSA9IGdldFN0eWxpbmdTdGF0ZShlbGVtZW50LCBkaXJlY3RpdmVJbmRleCk7XG4gIGNvbnN0IGNvdW50SW5kZXggPSBpc01hcEJhc2VkID8gU1RZTElOR19JTkRFWF9GT1JfTUFQX0JJTkRJTkcgOiBzdGF0ZS5zdHlsZXNJbmRleCsrO1xuXG4gIC8vIGV2ZW4gaWYgdGhlIGluaXRpYWwgdmFsdWUgaXMgYSBgTk9fQ0hBTkdFYCB2YWx1ZSAoZS5nLiBpbnRlcnBvbGF0aW9uIG9yIFtuZ1N0eWxlXSlcbiAgLy8gdGhlbiB3ZSBzdGlsbCBuZWVkIHRvIHJlZ2lzdGVyIHRoZSBiaW5kaW5nIHdpdGhpbiB0aGUgY29udGV4dCBzbyB0aGF0IHRoZSBjb250ZXh0XG4gIC8vIGlzIGF3YXJlIG9mIHRoZSBiaW5kaW5nIGV2ZW4gaWYgdGhpbmdzIGNoYW5nZSBhZnRlciB0aGUgZmlyc3QgdXBkYXRlIHBhc3MuXG4gIGlmIChmaXJzdFVwZGF0ZVBhc3MgfHwgdmFsdWUgIT09IE5PX0NIQU5HRSkge1xuICAgIGNvbnN0IHNhbml0aXphdGlvblJlcXVpcmVkID0gaXNNYXBCYXNlZCA/XG4gICAgICAgIHRydWUgOlxuICAgICAgICAoc2FuaXRpemVyID8gc2FuaXRpemVyKHByb3AgISwgbnVsbCwgU3R5bGVTYW5pdGl6ZU1vZGUuVmFsaWRhdGVQcm9wZXJ0eSkgOiBmYWxzZSk7XG4gICAgY29uc3QgdXBkYXRlZCA9IHVwZGF0ZUJpbmRpbmdEYXRhKFxuICAgICAgICBjb250ZXh0LCBkYXRhLCBjb3VudEluZGV4LCBzdGF0ZS5zb3VyY2VJbmRleCwgcHJvcCwgYmluZGluZ0luZGV4LCB2YWx1ZSwgZm9yY2VVcGRhdGUsXG4gICAgICAgIHNhbml0aXphdGlvblJlcXVpcmVkLCBmaXJzdFVwZGF0ZVBhc3MpO1xuICAgIGlmICh1cGRhdGVkIHx8IGZvcmNlVXBkYXRlKSB7XG4gICAgICAvLyBXZSBmbGlwIHRoZSBiaXQgaW4gdGhlIGJpdE1hc2sgdG8gcmVmbGVjdCB0aGF0IHRoZSBiaW5kaW5nXG4gICAgICAvLyBhdCB0aGUgYGluZGV4YCBzbG90IGhhcyBjaGFuZ2VkLiBUaGlzIGlkZW50aWZpZXMgdG8gdGhlIGZsdXNoaW5nXG4gICAgICAvLyBwaGFzZSB0aGF0IHRoZSBiaW5kaW5ncyBmb3IgdGhpcyBwYXJ0aWN1bGFyIHByb3BlcnR5IG5lZWQgdG8gYmVcbiAgICAgIC8vIGFwcGxpZWQgYWdhaW4gYmVjYXVzZSBvbiBvciBtb3JlIG9mIHRoZSBiaW5kaW5ncyBmb3IgdGhlIENTU1xuICAgICAgLy8gcHJvcGVydHkgaGF2ZSBjaGFuZ2VkLlxuICAgICAgc3RhdGUuc3R5bGVzQml0TWFzayB8PSAxIDw8IGNvdW50SW5kZXg7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG4vKipcbiAqIENhbGxlZCBlYWNoIHRpbWUgYSBiaW5kaW5nIHZhbHVlIGhhcyBjaGFuZ2VkIHdpdGhpbiB0aGUgcHJvdmlkZWQgYFRTdHlsaW5nQ29udGV4dGAuXG4gKlxuICogVGhpcyBmdW5jdGlvbiBpcyBkZXNpZ25lZCB0byBiZSBjYWxsZWQgZnJvbSBgdXBkYXRlU3R5bGVCaW5kaW5nYCBhbmQgYHVwZGF0ZUNsYXNzQmluZGluZ2AuXG4gKiBJZiBjYWxsZWQgZHVyaW5nIHRoZSBmaXJzdCB1cGRhdGUgcGFzcywgdGhlIGJpbmRpbmcgd2lsbCBiZSByZWdpc3RlcmVkIGluIHRoZSBjb250ZXh0LlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gd2lsbCBhbHNvIHVwZGF0ZSBiaW5kaW5nIHNsb3QgaW4gdGhlIHByb3ZpZGVkIGBMU3R5bGluZ0RhdGFgIHdpdGggdGhlXG4gKiBuZXcgYmluZGluZyBlbnRyeSAoaWYgaXQgaGFzIGNoYW5nZWQpLlxuICpcbiAqIEByZXR1cm5zIHdoZXRoZXIgb3Igbm90IHRoZSBiaW5kaW5nIHZhbHVlIHdhcyB1cGRhdGVkIGluIHRoZSBgTFN0eWxpbmdEYXRhYC5cbiAqL1xuZnVuY3Rpb24gdXBkYXRlQmluZGluZ0RhdGEoXG4gICAgY29udGV4dDogVFN0eWxpbmdDb250ZXh0LCBkYXRhOiBMU3R5bGluZ0RhdGEsIGNvdW50ZXJJbmRleDogbnVtYmVyLCBzb3VyY2VJbmRleDogbnVtYmVyLFxuICAgIHByb3A6IHN0cmluZyB8IG51bGwsIGJpbmRpbmdJbmRleDogbnVtYmVyLFxuICAgIHZhbHVlOiBzdHJpbmcgfCBTYWZlVmFsdWUgfCBudW1iZXIgfCBib29sZWFuIHwgbnVsbCB8IHVuZGVmaW5lZCB8IFN0eWxpbmdNYXBBcnJheSxcbiAgICBmb3JjZVVwZGF0ZTogYm9vbGVhbiwgc2FuaXRpemF0aW9uUmVxdWlyZWQ6IGJvb2xlYW4sIGZpcnN0VXBkYXRlUGFzczogYm9vbGVhbik6IGJvb2xlYW4ge1xuICBjb25zdCBob3N0QmluZGluZ3NNb2RlID0gaXNIb3N0U3R5bGluZ0FjdGl2ZShzb3VyY2VJbmRleCk7XG4gIGlmIChmaXJzdFVwZGF0ZVBhc3MpIHtcbiAgICAvLyB0aGlzIHdpbGwgb25seSBoYXBwZW4gZHVyaW5nIHRoZSBmaXJzdCB1cGRhdGUgcGFzcyBvZiB0aGVcbiAgICAvLyBjb250ZXh0LiBUaGUgcmVhc29uIHdoeSB3ZSBjYW4ndCB1c2UgYHRWaWV3LmZpcnN0Q3JlYXRlUGFzc2BcbiAgICAvLyBoZXJlIGlzIGJlY2F1c2UgaXRzIG5vdCBndWFyYW50ZWVkIHRvIGJlIHRydWUgd2hlbiB0aGUgZmlyc3RcbiAgICAvLyB1cGRhdGUgcGFzcyBpcyBleGVjdXRlZCAocmVtZW1iZXIgdGhhdCBhbGwgc3R5bGluZyBpbnN0cnVjdGlvbnNcbiAgICAvLyBhcmUgcnVuIGluIHRoZSB1cGRhdGUgcGhhc2UsIGFuZCwgYXMgYSByZXN1bHQsIGFyZSBubyBtb3JlXG4gICAgLy8gc3R5bGluZyBpbnN0cnVjdGlvbnMgdGhhdCBhcmUgcnVuIGluIHRoZSBjcmVhdGlvbiBwaGFzZSkuXG4gICAgcmVnaXN0ZXJCaW5kaW5nKGNvbnRleHQsIGNvdW50ZXJJbmRleCwgc291cmNlSW5kZXgsIHByb3AsIGJpbmRpbmdJbmRleCwgc2FuaXRpemF0aW9uUmVxdWlyZWQpO1xuICAgIHBhdGNoQ29uZmlnKFxuICAgICAgICBjb250ZXh0LFxuICAgICAgICBob3N0QmluZGluZ3NNb2RlID8gVFN0eWxpbmdDb25maWcuSGFzSG9zdEJpbmRpbmdzIDogVFN0eWxpbmdDb25maWcuSGFzVGVtcGxhdGVCaW5kaW5ncyk7XG4gIH1cblxuICBjb25zdCBjaGFuZ2VkID0gZm9yY2VVcGRhdGUgfHwgaGFzVmFsdWVDaGFuZ2VkKGRhdGFbYmluZGluZ0luZGV4XSwgdmFsdWUpO1xuICBpZiAoY2hhbmdlZCkge1xuICAgIHNldFZhbHVlKGRhdGEsIGJpbmRpbmdJbmRleCwgdmFsdWUpO1xuICAgIGNvbnN0IGRvU2V0VmFsdWVzQXNTdGFsZSA9IChnZXRDb25maWcoY29udGV4dCkgJiBUU3R5bGluZ0NvbmZpZy5IYXNIb3N0QmluZGluZ3MpICYmXG4gICAgICAgICFob3N0QmluZGluZ3NNb2RlICYmIChwcm9wID8gIXZhbHVlIDogdHJ1ZSk7XG4gICAgaWYgKGRvU2V0VmFsdWVzQXNTdGFsZSkge1xuICAgICAgcmVuZGVySG9zdEJpbmRpbmdzQXNTdGFsZShjb250ZXh0LCBkYXRhLCBwcm9wKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGNoYW5nZWQ7XG59XG5cbi8qKlxuICogSXRlcmF0ZXMgb3ZlciBhbGwgaG9zdC1iaW5kaW5nIHZhbHVlcyBmb3IgdGhlIGdpdmVuIGBwcm9wYCB2YWx1ZSBpbiB0aGUgY29udGV4dCBhbmQgc2V0cyB0aGVpclxuICogY29ycmVzcG9uZGluZyBiaW5kaW5nIHZhbHVlcyB0byBgbnVsbGAuXG4gKlxuICogV2hlbmV2ZXIgYSB0ZW1wbGF0ZSBiaW5kaW5nIGNoYW5nZXMgaXRzIHZhbHVlIHRvIGBudWxsYCwgYWxsIGhvc3QtYmluZGluZyB2YWx1ZXMgc2hvdWxkIGJlXG4gKiByZS1hcHBsaWVkXG4gKiB0byB0aGUgZWxlbWVudCB3aGVuIHRoZSBob3N0IGJpbmRpbmdzIGFyZSBldmFsdWF0ZWQuIFRoaXMgbWF5IG5vdCBhbHdheXMgaGFwcGVuIGluIHRoZSBldmVudFxuICogdGhhdCBub25lIG9mIHRoZSBiaW5kaW5ncyBjaGFuZ2VkIHdpdGhpbiB0aGUgaG9zdCBiaW5kaW5ncyBjb2RlLiBGb3IgdGhpcyByZWFzb24gdGhpcyBmdW5jdGlvblxuICogaXMgZXhwZWN0ZWQgdG8gYmUgY2FsbGVkIGVhY2ggdGltZSBhIHRlbXBsYXRlIGJpbmRpbmcgYmVjb21lcyBmYWxzeSBvciB3aGVuIGEgbWFwLWJhc2VkIHRlbXBsYXRlXG4gKiBiaW5kaW5nIGNoYW5nZXMuXG4gKi9cbmZ1bmN0aW9uIHJlbmRlckhvc3RCaW5kaW5nc0FzU3RhbGUoXG4gICAgY29udGV4dDogVFN0eWxpbmdDb250ZXh0LCBkYXRhOiBMU3R5bGluZ0RhdGEsIHByb3A6IHN0cmluZyB8IG51bGwpOiB2b2lkIHtcbiAgY29uc3QgdmFsdWVzQ291bnQgPSBnZXRWYWx1ZXNDb3VudChjb250ZXh0KTtcblxuICBpZiAocHJvcCAhPT0gbnVsbCAmJiBoYXNDb25maWcoY29udGV4dCwgVFN0eWxpbmdDb25maWcuSGFzUHJvcEJpbmRpbmdzKSkge1xuICAgIGNvbnN0IGl0ZW1zUGVyUm93ID0gVFN0eWxpbmdDb250ZXh0SW5kZXguQmluZGluZ3NTdGFydE9mZnNldCArIHZhbHVlc0NvdW50O1xuXG4gICAgbGV0IGkgPSBUU3R5bGluZ0NvbnRleHRJbmRleC5WYWx1ZXNTdGFydFBvc2l0aW9uO1xuICAgIGxldCBmb3VuZCA9IGZhbHNlO1xuICAgIHdoaWxlIChpIDwgY29udGV4dC5sZW5ndGgpIHtcbiAgICAgIGlmIChnZXRQcm9wKGNvbnRleHQsIGkpID09PSBwcm9wKSB7XG4gICAgICAgIGZvdW5kID0gdHJ1ZTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBpICs9IGl0ZW1zUGVyUm93O1xuICAgIH1cblxuICAgIGlmIChmb3VuZCkge1xuICAgICAgY29uc3QgYmluZGluZ3NTdGFydCA9IGkgKyBUU3R5bGluZ0NvbnRleHRJbmRleC5CaW5kaW5nc1N0YXJ0T2Zmc2V0O1xuICAgICAgY29uc3QgdmFsdWVzU3RhcnQgPSBiaW5kaW5nc1N0YXJ0ICsgMTsgIC8vIHRoZSBmaXJzdCBjb2x1bW4gaXMgdGVtcGxhdGUgYmluZGluZ3NcbiAgICAgIGNvbnN0IHZhbHVlc0VuZCA9IGJpbmRpbmdzU3RhcnQgKyB2YWx1ZXNDb3VudCAtIDE7XG5cbiAgICAgIGZvciAobGV0IGkgPSB2YWx1ZXNTdGFydDsgaSA8IHZhbHVlc0VuZDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IGJpbmRpbmdJbmRleCA9IGNvbnRleHRbaV0gYXMgbnVtYmVyO1xuICAgICAgICBpZiAoYmluZGluZ0luZGV4ICE9PSAwKSB7XG4gICAgICAgICAgc2V0VmFsdWUoZGF0YSwgYmluZGluZ0luZGV4LCBudWxsKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGlmIChoYXNDb25maWcoY29udGV4dCwgVFN0eWxpbmdDb25maWcuSGFzTWFwQmluZGluZ3MpKSB7XG4gICAgY29uc3QgYmluZGluZ3NTdGFydCA9XG4gICAgICAgIFRTdHlsaW5nQ29udGV4dEluZGV4LlZhbHVlc1N0YXJ0UG9zaXRpb24gKyBUU3R5bGluZ0NvbnRleHRJbmRleC5CaW5kaW5nc1N0YXJ0T2Zmc2V0O1xuICAgIGNvbnN0IHZhbHVlc1N0YXJ0ID0gYmluZGluZ3NTdGFydCArIDE7ICAvLyB0aGUgZmlyc3QgY29sdW1uIGlzIHRlbXBsYXRlIGJpbmRpbmdzXG4gICAgY29uc3QgdmFsdWVzRW5kID0gYmluZGluZ3NTdGFydCArIHZhbHVlc0NvdW50IC0gMTtcbiAgICBmb3IgKGxldCBpID0gdmFsdWVzU3RhcnQ7IGkgPCB2YWx1ZXNFbmQ7IGkrKykge1xuICAgICAgY29uc3Qgc3R5bGluZ01hcCA9IGdldFZhbHVlPFN0eWxpbmdNYXBBcnJheT4oZGF0YSwgY29udGV4dFtpXSBhcyBudW1iZXIpO1xuICAgICAgaWYgKHN0eWxpbmdNYXApIHtcbiAgICAgICAgc2V0TWFwQXNEaXJ0eShzdHlsaW5nTWFwKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBSZWdpc3RlcnMgdGhlIHByb3ZpZGVkIGJpbmRpbmcgKHByb3AgKyBiaW5kaW5nSW5kZXgpIGludG8gdGhlIGNvbnRleHQuXG4gKlxuICogSXQgaXMgbmVlZGVkIGJlY2F1c2UgaXQgd2lsbCBlaXRoZXIgdXBkYXRlIG9yIGluc2VydCBhIHN0eWxpbmcgcHJvcGVydHlcbiAqIGludG8gdGhlIGNvbnRleHQgYXQgdGhlIGNvcnJlY3Qgc3BvdC5cbiAqXG4gKiBXaGVuIGNhbGxlZCwgb25lIG9mIHR3byB0aGluZ3Mgd2lsbCBoYXBwZW46XG4gKlxuICogMSkgSWYgdGhlIHByb3BlcnR5IGFscmVhZHkgZXhpc3RzIGluIHRoZSBjb250ZXh0IHRoZW4gaXQgd2lsbCBqdXN0IGFkZFxuICogICAgdGhlIHByb3ZpZGVkIGBiaW5kaW5nVmFsdWVgIHRvIHRoZSBlbmQgb2YgdGhlIGJpbmRpbmcgc291cmNlcyByZWdpb25cbiAqICAgIGZvciB0aGF0IHBhcnRpY3VsYXIgcHJvcGVydHkuXG4gKlxuICogICAgLSBJZiB0aGUgYmluZGluZyB2YWx1ZSBpcyBhIG51bWJlciB0aGVuIGl0IHdpbGwgYmUgYWRkZWQgYXMgYSBuZXdcbiAqICAgICAgYmluZGluZyBpbmRleCBzb3VyY2UgbmV4dCB0byB0aGUgb3RoZXIgYmluZGluZyBzb3VyY2VzIGZvciB0aGUgcHJvcGVydHkuXG4gKlxuICogICAgLSBPdGhlcndpc2UsIGlmIHRoZSBiaW5kaW5nIHZhbHVlIGlzIGEgc3RyaW5nL2Jvb2xlYW4vbnVsbCB0eXBlIHRoZW4gaXQgd2lsbFxuICogICAgICByZXBsYWNlIHRoZSBkZWZhdWx0IHZhbHVlIGZvciB0aGUgcHJvcGVydHkgaWYgdGhlIGRlZmF1bHQgdmFsdWUgaXMgYG51bGxgLlxuICpcbiAqIDIpIElmIHRoZSBwcm9wZXJ0eSBkb2VzIG5vdCBleGlzdCB0aGVuIGl0IHdpbGwgYmUgaW5zZXJ0ZWQgaW50byB0aGUgY29udGV4dC5cbiAqICAgIFRoZSBzdHlsaW5nIGNvbnRleHQgcmVsaWVzIG9uIGFsbCBwcm9wZXJ0aWVzIGJlaW5nIHN0b3JlZCBpbiBhbHBoYWJldGljYWxcbiAqICAgIG9yZGVyLCBzbyBpdCBrbm93cyBleGFjdGx5IHdoZXJlIHRvIHN0b3JlIGl0LlxuICpcbiAqICAgIFdoZW4gaW5zZXJ0ZWQsIGEgZGVmYXVsdCBgbnVsbGAgdmFsdWUgaXMgY3JlYXRlZCBmb3IgdGhlIHByb3BlcnR5IHdoaWNoIGV4aXN0c1xuICogICAgYXMgdGhlIGRlZmF1bHQgdmFsdWUgZm9yIHRoZSBiaW5kaW5nLiBJZiB0aGUgYmluZGluZ1ZhbHVlIHByb3BlcnR5IGlzIGluc2VydGVkXG4gKiAgICBhbmQgaXQgaXMgZWl0aGVyIGEgc3RyaW5nLCBudW1iZXIgb3IgbnVsbCB2YWx1ZSB0aGVuIHRoYXQgd2lsbCByZXBsYWNlIHRoZSBkZWZhdWx0XG4gKiAgICB2YWx1ZS5cbiAqXG4gKiBOb3RlIHRoYXQgdGhpcyBmdW5jdGlvbiBpcyBhbHNvIHVzZWQgZm9yIG1hcC1iYXNlZCBzdHlsaW5nIGJpbmRpbmdzLiBUaGV5IGFyZSB0cmVhdGVkXG4gKiBtdWNoIHRoZSBzYW1lIGFzIHByb3AtYmFzZWQgYmluZGluZ3MsIGJ1dCwgdGhlaXIgcHJvcGVydHkgbmFtZSB2YWx1ZSBpcyBzZXQgYXMgYFtNQVBdYC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlZ2lzdGVyQmluZGluZyhcbiAgICBjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQsIGNvdW50SWQ6IG51bWJlciwgc291cmNlSW5kZXg6IG51bWJlciwgcHJvcDogc3RyaW5nIHwgbnVsbCxcbiAgICBiaW5kaW5nVmFsdWU6IG51bWJlciB8IG51bGwgfCBzdHJpbmcgfCBib29sZWFuLCBzYW5pdGl6YXRpb25SZXF1aXJlZD86IGJvb2xlYW4pOiB2b2lkIHtcbiAgbGV0IGZvdW5kID0gZmFsc2U7XG4gIHByb3AgPSBwcm9wIHx8IE1BUF9CQVNFRF9FTlRSWV9QUk9QX05BTUU7XG5cbiAgbGV0IHRvdGFsU291cmNlcyA9IGdldFRvdGFsU291cmNlcyhjb250ZXh0KTtcblxuICAvLyBpZiBhIG5ldyBzb3VyY2UgaXMgZGV0ZWN0ZWQgdGhlbiBhIG5ldyBjb2x1bW4gbmVlZHMgdG8gYmUgYWxsb2NhdGVkIGludG9cbiAgLy8gdGhlIHN0eWxpbmcgY29udGV4dC4gVGhlIGNvbHVtbiBpcyBiYXNpY2FsbHkgYSBuZXcgYWxsb2NhdGlvbiBvZiBiaW5kaW5nXG4gIC8vIHNvdXJjZXMgdGhhdCB3aWxsIGJlIGF2YWlsYWJsZSB0byBlYWNoIHByb3BlcnR5LlxuICB3aGlsZSAodG90YWxTb3VyY2VzIDw9IHNvdXJjZUluZGV4KSB7XG4gICAgYWRkTmV3U291cmNlQ29sdW1uKGNvbnRleHQpO1xuICAgIHRvdGFsU291cmNlcysrO1xuICB9XG5cbiAgY29uc3QgaXNCaW5kaW5nSW5kZXhWYWx1ZSA9IHR5cGVvZiBiaW5kaW5nVmFsdWUgPT09ICdudW1iZXInO1xuICBjb25zdCBlbnRyaWVzUGVyUm93ID0gVFN0eWxpbmdDb250ZXh0SW5kZXguQmluZGluZ3NTdGFydE9mZnNldCArIGdldFZhbHVlc0NvdW50KGNvbnRleHQpO1xuICBsZXQgaSA9IFRTdHlsaW5nQ29udGV4dEluZGV4LlZhbHVlc1N0YXJ0UG9zaXRpb247XG5cbiAgLy8gYWxsIHN0eWxlL2NsYXNzIGJpbmRpbmdzIGFyZSBzb3J0ZWQgYnkgcHJvcGVydHkgbmFtZVxuICB3aGlsZSAoaSA8IGNvbnRleHQubGVuZ3RoKSB7XG4gICAgY29uc3QgcCA9IGdldFByb3AoY29udGV4dCwgaSk7XG4gICAgaWYgKHByb3AgPD0gcCkge1xuICAgICAgaWYgKHByb3AgPCBwKSB7XG4gICAgICAgIGFsbG9jYXRlTmV3Q29udGV4dEVudHJ5KGNvbnRleHQsIGksIHByb3AsIHNhbml0aXphdGlvblJlcXVpcmVkKTtcbiAgICAgIH0gZWxzZSBpZiAoaXNCaW5kaW5nSW5kZXhWYWx1ZSkge1xuICAgICAgICBwYXRjaENvbmZpZyhjb250ZXh0LCBUU3R5bGluZ0NvbmZpZy5IYXNDb2xsaXNpb25zKTtcbiAgICAgIH1cbiAgICAgIGFkZEJpbmRpbmdJbnRvQ29udGV4dChjb250ZXh0LCBpLCBiaW5kaW5nVmFsdWUsIGNvdW50SWQsIHNvdXJjZUluZGV4KTtcbiAgICAgIGZvdW5kID0gdHJ1ZTtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgICBpICs9IGVudHJpZXNQZXJSb3c7XG4gIH1cblxuICBpZiAoIWZvdW5kKSB7XG4gICAgYWxsb2NhdGVOZXdDb250ZXh0RW50cnkoY29udGV4dCwgY29udGV4dC5sZW5ndGgsIHByb3AsIHNhbml0aXphdGlvblJlcXVpcmVkKTtcbiAgICBhZGRCaW5kaW5nSW50b0NvbnRleHQoY29udGV4dCwgaSwgYmluZGluZ1ZhbHVlLCBjb3VudElkLCBzb3VyY2VJbmRleCk7XG4gIH1cbn1cblxuLyoqXG4gKiBJbnNlcnRzIGEgbmV3IHJvdyBpbnRvIHRoZSBwcm92aWRlZCBgVFN0eWxpbmdDb250ZXh0YCBhbmQgYXNzaWducyB0aGUgcHJvdmlkZWQgYHByb3BgIHZhbHVlIGFzXG4gKiB0aGUgcHJvcGVydHkgZW50cnkuXG4gKi9cbmZ1bmN0aW9uIGFsbG9jYXRlTmV3Q29udGV4dEVudHJ5KFxuICAgIGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCwgaW5kZXg6IG51bWJlciwgcHJvcDogc3RyaW5nLCBzYW5pdGl6YXRpb25SZXF1aXJlZD86IGJvb2xlYW4pOiB2b2lkIHtcbiAgY29uc3QgY29uZmlnID0gc2FuaXRpemF0aW9uUmVxdWlyZWQgPyBUU3R5bGluZ0NvbnRleHRQcm9wQ29uZmlnRmxhZ3MuU2FuaXRpemF0aW9uUmVxdWlyZWQgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFRTdHlsaW5nQ29udGV4dFByb3BDb25maWdGbGFncy5EZWZhdWx0O1xuICBjb250ZXh0LnNwbGljZShcbiAgICAgIGluZGV4LCAwLFxuICAgICAgY29uZmlnLCAgICAgICAgICAgICAgICAgICAgLy8gMSkgY29uZmlnIHZhbHVlXG4gICAgICBERUZBVUxUX0dVQVJEX01BU0tfVkFMVUUsICAvLyAyKSB0ZW1wbGF0ZSBiaXQgbWFza1xuICAgICAgREVGQVVMVF9HVUFSRF9NQVNLX1ZBTFVFLCAgLy8gMykgaG9zdCBiaW5kaW5ncyBiaXQgbWFza1xuICAgICAgcHJvcCwgICAgICAgICAgICAgICAgICAgICAgLy8gNCkgcHJvcCB2YWx1ZSAoZS5nLiBgd2lkdGhgLCBgbXlDbGFzc2AsIGV0Yy4uLilcbiAgICAgICk7XG5cbiAgaW5kZXggKz0gNDsgIC8vIHRoZSA0IHZhbHVlcyBhYm92ZVxuXG4gIC8vIDUuLi4pIGRlZmF1bHQgYmluZGluZyBpbmRleCBmb3IgdGhlIHRlbXBsYXRlIHZhbHVlXG4gIC8vIGRlcGVuZGluZyBvbiBob3cgbWFueSBzb3VyY2VzIGFscmVhZHkgZXhpc3QgaW4gdGhlIGNvbnRleHQsXG4gIC8vIG11bHRpcGxlIGRlZmF1bHQgaW5kZXggZW50cmllcyBtYXkgbmVlZCB0byBiZSBpbnNlcnRlZCBmb3JcbiAgLy8gdGhlIG5ldyB2YWx1ZSBpbiB0aGUgY29udGV4dC5cbiAgY29uc3QgdG90YWxCaW5kaW5nc1BlckVudHJ5ID0gZ2V0VG90YWxTb3VyY2VzKGNvbnRleHQpO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IHRvdGFsQmluZGluZ3NQZXJFbnRyeTsgaSsrKSB7XG4gICAgY29udGV4dC5zcGxpY2UoaW5kZXgsIDAsIERFRkFVTFRfQklORElOR19JTkRFWCk7XG4gICAgaW5kZXgrKztcbiAgfVxuXG4gIC8vIDYpIGRlZmF1bHQgYmluZGluZyB2YWx1ZSBmb3IgdGhlIG5ldyBlbnRyeVxuICBjb250ZXh0LnNwbGljZShpbmRleCwgMCwgREVGQVVMVF9CSU5ESU5HX1ZBTFVFKTtcbn1cblxuLyoqXG4gKiBJbnNlcnRzIGEgbmV3IGJpbmRpbmcgdmFsdWUgaW50byBhIHN0eWxpbmcgcHJvcGVydHkgdHVwbGUgaW4gdGhlIGBUU3R5bGluZ0NvbnRleHRgLlxuICpcbiAqIEEgYmluZGluZ1ZhbHVlIGlzIGluc2VydGVkIGludG8gYSBjb250ZXh0IGR1cmluZyB0aGUgZmlyc3QgdXBkYXRlIHBhc3NcbiAqIG9mIGEgdGVtcGxhdGUgb3IgaG9zdCBiaW5kaW5ncyBmdW5jdGlvbi4gV2hlbiB0aGlzIG9jY3VycywgdHdvIHRoaW5nc1xuICogaGFwcGVuOlxuICpcbiAqIC0gSWYgdGhlIGJpbmRpbmdWYWx1ZSB2YWx1ZSBpcyBhIG51bWJlciB0aGVuIGl0IGlzIHRyZWF0ZWQgYXMgYSBiaW5kaW5nSW5kZXhcbiAqICAgdmFsdWUgKGEgaW5kZXggaW4gdGhlIGBMVmlld2ApIGFuZCBpdCB3aWxsIGJlIGluc2VydGVkIG5leHQgdG8gdGhlIG90aGVyXG4gKiAgIGJpbmRpbmcgaW5kZXggZW50cmllcy5cbiAqXG4gKiAtIE90aGVyd2lzZSB0aGUgYmluZGluZyB2YWx1ZSB3aWxsIHVwZGF0ZSB0aGUgZGVmYXVsdCB2YWx1ZSBmb3IgdGhlIHByb3BlcnR5XG4gKiAgIGFuZCB0aGlzIHdpbGwgb25seSBoYXBwZW4gaWYgdGhlIGRlZmF1bHQgdmFsdWUgaXMgYG51bGxgLlxuICovXG5mdW5jdGlvbiBhZGRCaW5kaW5nSW50b0NvbnRleHQoXG4gICAgY29udGV4dDogVFN0eWxpbmdDb250ZXh0LCBpbmRleDogbnVtYmVyLCBiaW5kaW5nVmFsdWU6IG51bWJlciB8IHN0cmluZyB8IGJvb2xlYW4gfCBudWxsLFxuICAgIGJpdEluZGV4OiBudW1iZXIsIHNvdXJjZUluZGV4OiBudW1iZXIpIHtcbiAgaWYgKHR5cGVvZiBiaW5kaW5nVmFsdWUgPT09ICdudW1iZXInKSB7XG4gICAgY29uc3QgaG9zdEJpbmRpbmdzTW9kZSA9IGlzSG9zdFN0eWxpbmdBY3RpdmUoc291cmNlSW5kZXgpO1xuICAgIGNvbnN0IGNlbGxJbmRleCA9IGluZGV4ICsgVFN0eWxpbmdDb250ZXh0SW5kZXguQmluZGluZ3NTdGFydE9mZnNldCArIHNvdXJjZUluZGV4O1xuICAgIGNvbnRleHRbY2VsbEluZGV4XSA9IGJpbmRpbmdWYWx1ZTtcbiAgICBjb25zdCB1cGRhdGVkQml0TWFzayA9IGdldEd1YXJkTWFzayhjb250ZXh0LCBpbmRleCwgaG9zdEJpbmRpbmdzTW9kZSkgfCAoMSA8PCBiaXRJbmRleCk7XG4gICAgc2V0R3VhcmRNYXNrKGNvbnRleHQsIGluZGV4LCB1cGRhdGVkQml0TWFzaywgaG9zdEJpbmRpbmdzTW9kZSk7XG4gIH0gZWxzZSBpZiAoYmluZGluZ1ZhbHVlICE9PSBudWxsICYmIGdldERlZmF1bHRWYWx1ZShjb250ZXh0LCBpbmRleCkgPT09IG51bGwpIHtcbiAgICBzZXREZWZhdWx0VmFsdWUoY29udGV4dCwgaW5kZXgsIGJpbmRpbmdWYWx1ZSk7XG4gIH1cbn1cblxuLyoqXG4gKiBSZWdpc3RlcnMgYSBuZXcgY29sdW1uIGludG8gdGhlIHByb3ZpZGVkIGBUU3R5bGluZ0NvbnRleHRgLlxuICpcbiAqIElmIGFuZCB3aGVuIGEgbmV3IHNvdXJjZSBpcyBkZXRlY3RlZCB0aGVuIGEgbmV3IGNvbHVtbiBuZWVkcyB0b1xuICogYmUgYWxsb2NhdGVkIGludG8gdGhlIHN0eWxpbmcgY29udGV4dC4gVGhlIGNvbHVtbiBpcyBiYXNpY2FsbHlcbiAqIGEgbmV3IGFsbG9jYXRpb24gb2YgYmluZGluZyBzb3VyY2VzIHRoYXQgd2lsbCBiZSBhdmFpbGFibGUgdG8gZWFjaFxuICogcHJvcGVydHkuXG4gKlxuICogRWFjaCBjb2x1bW4gdGhhdCBleGlzdHMgaW4gdGhlIHN0eWxpbmcgY29udGV4dCByZXNlbWJsZXMgYSBzdHlsaW5nXG4gKiBzb3VyY2UuIEEgc3R5bGluZyBzb3VyY2UgYW4gZWl0aGVyIGJlIHRoZSB0ZW1wbGF0ZSBvciBvbmUgb3IgbW9yZVxuICogY29tcG9uZW50cyBvciBkaXJlY3RpdmVzIGFsbCBjb250YWluaW5nIHN0eWxpbmcgaG9zdCBiaW5kaW5ncy5cbiAqL1xuZnVuY3Rpb24gYWRkTmV3U291cmNlQ29sdW1uKGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCk6IHZvaWQge1xuICAvLyB3ZSB1c2UgLTEgaGVyZSBiZWNhdXNlIHdlIHdhbnQgdG8gaW5zZXJ0IHJpZ2h0IGJlZm9yZSB0aGUgbGFzdCB2YWx1ZSAodGhlIGRlZmF1bHQgdmFsdWUpXG4gIGNvbnN0IGluc2VydE9mZnNldCA9IFRTdHlsaW5nQ29udGV4dEluZGV4LkJpbmRpbmdzU3RhcnRPZmZzZXQgKyBnZXRWYWx1ZXNDb3VudChjb250ZXh0KSAtIDE7XG5cbiAgbGV0IGluZGV4ID0gVFN0eWxpbmdDb250ZXh0SW5kZXguVmFsdWVzU3RhcnRQb3NpdGlvbjtcbiAgd2hpbGUgKGluZGV4IDwgY29udGV4dC5sZW5ndGgpIHtcbiAgICBpbmRleCArPSBpbnNlcnRPZmZzZXQ7XG4gICAgY29udGV4dC5zcGxpY2UoaW5kZXgrKywgMCwgREVGQVVMVF9CSU5ESU5HX0lOREVYKTtcblxuICAgIC8vIHRoZSB2YWx1ZSB3YXMgaW5zZXJ0ZWQganVzdCBiZWZvcmUgdGhlIGRlZmF1bHQgdmFsdWUsIGJ1dCB0aGVcbiAgICAvLyBuZXh0IGVudHJ5IGluIHRoZSBjb250ZXh0IHN0YXJ0cyBqdXN0IGFmdGVyIGl0LiBUaGVyZWZvcmUrKy5cbiAgICBpbmRleCsrO1xuICB9XG4gIGNvbnRleHRbVFN0eWxpbmdDb250ZXh0SW5kZXguVG90YWxTb3VyY2VzUG9zaXRpb25dKys7XG59XG5cbi8qKlxuICogQXBwbGllcyBhbGwgcGVuZGluZyBzdHlsZSBhbmQgY2xhc3MgYmluZGluZ3MgdG8gdGhlIHByb3ZpZGVkIGVsZW1lbnQuXG4gKlxuICogVGhpcyBmdW5jdGlvbiB3aWxsIGF0dGVtcHQgdG8gZmx1c2ggc3R5bGluZyB2aWEgdGhlIHByb3ZpZGVkIGBjbGFzc2VzQ29udGV4dGBcbiAqIGFuZCBgc3R5bGVzQ29udGV4dGAgY29udGV4dCB2YWx1ZXMuIFRoaXMgZnVuY3Rpb24gaXMgZGVzaWduZWQgdG8gYmUgcnVuIGZyb21cbiAqIHRoZSBpbnRlcm5hbCBgc3R5bGluZ0FwcGx5YCBmdW5jdGlvbiAod2hpY2ggaXMgc2NoZWR1bGVkIHRvIHJ1biBhdCB0aGUgdmVyeVxuICogZW5kIG9mIGNoYW5nZSBkZXRlY3Rpb24gZm9yIGFuIGVsZW1lbnQgaWYgb25lIG9yIG1vcmUgc3R5bGUvY2xhc3MgYmluZGluZ3NcbiAqIHdlcmUgcHJvY2Vzc2VkKSBhbmQgd2lsbCByZWx5IG9uIGFueSBzdGF0ZSB2YWx1ZXMgdGhhdCBhcmUgc2V0IGZyb20gd2hlblxuICogYW55IG9mIHRoZSBzdHlsaW5nIGJpbmRpbmdzIGV4ZWN1dGVkLlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gaXMgZGVzaWduZWQgdG8gYmUgY2FsbGVkIHR3aWNlOiBvbmUgd2hlbiBjaGFuZ2UgZGV0ZWN0aW9uIGhhc1xuICogcHJvY2Vzc2VkIGFuIGVsZW1lbnQgd2l0aGluIHRoZSB0ZW1wbGF0ZSBiaW5kaW5ncyAoaS5lLiBqdXN0IGFzIGBhZHZhbmNlKClgXG4gKiBpcyBjYWxsZWQpIGFuZCB3aGVuIGhvc3QgYmluZGluZ3MgaGF2ZSBiZWVuIHByb2Nlc3NlZC4gSW4gYm90aCBjYXNlcyB0aGVcbiAqIHN0eWxlcyBhbmQgY2xhc3NlcyBpbiBib3RoIGNvbnRleHRzIHdpbGwgYmUgYXBwbGllZCB0byB0aGUgZWxlbWVudCwgYnV0IHRoZVxuICogYWxnb3JpdGhtIHdpbGwgc2VsZWN0aXZlbHkgZGVjaWRlIHdoaWNoIGJpbmRpbmdzIHRvIHJ1biBkZXBlbmRpbmcgb24gdGhlXG4gKiBjb2x1bW5zIGluIHRoZSBjb250ZXh0LiBUaGUgcHJvdmlkZWQgYGRpcmVjdGl2ZUluZGV4YCB2YWx1ZSB3aWxsIGhlbHAgdGhlXG4gKiBhbGdvcml0aG0gZGV0ZXJtaW5lIHdoaWNoIGJpbmRpbmdzIHRvIGFwcGx5OiBlaXRoZXIgdGhlIHRlbXBsYXRlIGJpbmRpbmdzIG9yXG4gKiB0aGUgaG9zdCBiaW5kaW5ncyAoc2VlIGBhcHBseVN0eWxpbmdUb0VsZW1lbnRgIGZvciBtb3JlIGluZm9ybWF0aW9uKS5cbiAqXG4gKiBOb3RlIHRoYXQgb25jZSB0aGlzIGZ1bmN0aW9uIGlzIGNhbGxlZCBhbGwgdGVtcG9yYXJ5IHN0eWxpbmcgc3RhdGUgZGF0YVxuICogKGkuZS4gdGhlIGBiaXRNYXNrYCBhbmQgYGNvdW50ZXJgIHZhbHVlcyBmb3Igc3R5bGVzIGFuZCBjbGFzc2VzIHdpbGwgYmUgY2xlYXJlZCkuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBmbHVzaFN0eWxpbmcoXG4gICAgcmVuZGVyZXI6IFJlbmRlcmVyMyB8IFByb2NlZHVyYWxSZW5kZXJlcjMgfCBudWxsLCBkYXRhOiBMU3R5bGluZ0RhdGEsXG4gICAgY2xhc3Nlc0NvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCB8IG51bGwsIHN0eWxlc0NvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCB8IG51bGwsXG4gICAgZWxlbWVudDogUkVsZW1lbnQsIGRpcmVjdGl2ZUluZGV4OiBudW1iZXIsIHN0eWxlU2FuaXRpemVyOiBTdHlsZVNhbml0aXplRm4gfCBudWxsLFxuICAgIGZpcnN0VXBkYXRlUGFzczogYm9vbGVhbik6IHZvaWQge1xuICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLmZsdXNoU3R5bGluZysrO1xuXG4gIGNvbnN0IHN0YXRlID0gZ2V0U3R5bGluZ1N0YXRlKGVsZW1lbnQsIGRpcmVjdGl2ZUluZGV4KTtcbiAgY29uc3QgaG9zdEJpbmRpbmdzTW9kZSA9IGlzSG9zdFN0eWxpbmdBY3RpdmUoc3RhdGUuc291cmNlSW5kZXgpO1xuXG4gIGlmIChzdHlsZXNDb250ZXh0KSB7XG4gICAgZmlyc3RVcGRhdGVQYXNzICYmIHN5bmNDb250ZXh0SW5pdGlhbFN0eWxpbmcoc3R5bGVzQ29udGV4dCk7XG5cbiAgICBpZiAoc3RhdGUuc3R5bGVzQml0TWFzayAhPT0gMCkge1xuICAgICAgYXBwbHlTdHlsaW5nVmlhQ29udGV4dChcbiAgICAgICAgICBzdHlsZXNDb250ZXh0LCByZW5kZXJlciwgZWxlbWVudCwgZGF0YSwgc3RhdGUuc3R5bGVzQml0TWFzaywgc2V0U3R5bGUsIHN0eWxlU2FuaXRpemVyLFxuICAgICAgICAgIGhvc3RCaW5kaW5nc01vZGUpO1xuICAgIH1cbiAgfVxuXG4gIGlmIChjbGFzc2VzQ29udGV4dCkge1xuICAgIGZpcnN0VXBkYXRlUGFzcyAmJiBzeW5jQ29udGV4dEluaXRpYWxTdHlsaW5nKGNsYXNzZXNDb250ZXh0KTtcblxuICAgIGlmIChzdGF0ZS5jbGFzc2VzQml0TWFzayAhPT0gMCkge1xuICAgICAgYXBwbHlTdHlsaW5nVmlhQ29udGV4dChcbiAgICAgICAgICBjbGFzc2VzQ29udGV4dCwgcmVuZGVyZXIsIGVsZW1lbnQsIGRhdGEsIHN0YXRlLmNsYXNzZXNCaXRNYXNrLCBzZXRDbGFzcywgbnVsbCxcbiAgICAgICAgICBob3N0QmluZGluZ3NNb2RlKTtcbiAgICB9XG4gIH1cblxuICByZXNldFN0eWxpbmdTdGF0ZSgpO1xufVxuXG4vKipcbiAqIFJlZ2lzdGVycyBhbGwgc3RhdGljIHN0eWxpbmcgdmFsdWVzIGludG8gdGhlIGNvbnRleHQgYXMgZGVmYXVsdCB2YWx1ZXMuXG4gKlxuICogU3RhdGljIHN0eWxlcyBhcmUgc3RvcmVkIG9uIHRoZSBgdE5vZGUuc3R5bGVzYCBhbmQgYHROb2RlLmNsYXNzZXNgXG4gKiBwcm9wZXJ0aWVzIGFzIGluc3RhbmNlcyBvZiBgU3R5bGluZ01hcEFycmF5YC4gV2hlbiBhbiBpbnN0YW5jZSBvZlxuICogYFRTdHlsaW5nQ29udGV4dGAgaXMgYXNzaWduZWQgdG8gYHROb2RlLnN0eWxlc2AgYW5kIGB0Tm9kZS5jbGFzc2VzYFxuICogdGhlbiB0aGUgZXhpc3RpbmcgaW5pdGlhbCBzdHlsaW5nIHZhbHVlcyBhcmUgY29waWVkIGludG8gdGhlIHRoZVxuICogYEluaXRpYWxTdHlsaW5nVmFsdWVQb3NpdGlvbmAgc2xvdC5cbiAqXG4gKiBCZWNhdXNlIGFsbCBzdGF0aWMgc3R5bGVzL2NsYXNzZXMgYXJlIGNvbGxlY3RlZCBhbmQgcmVnaXN0ZXJlZCBvblxuICogdGhlIGluaXRpYWwgc3R5bGluZyBhcnJheSBlYWNoIHRpbWUgYSBkaXJlY3RpdmUgaXMgaW5zdGFudGlhdGVkLFxuICogdGhlIGNvbnRleHQgbWF5IG5vdCB5ZXQga25vdyBhYm91dCB0aGUgc3RhdGljIHZhbHVlcy4gV2hlbiB0aGlzXG4gKiBmdW5jdGlvbiBpcyBjYWxsZWQgaXQgd2lsbCBjb3B5IG92ZXIgYWxsIHRoZSBzdGF0aWMgc3R5bGUvY2xhc3NcbiAqIHZhbHVlcyBmcm9tIHRoZSBpbml0aWFsIHN0eWxpbmcgYXJyYXkgaW50byB0aGUgY29udGV4dCBhcyBkZWZhdWx0XG4gKiB2YWx1ZXMgZm9yIGVhY2ggb2YgdGhlIG1hdGNoaW5nIGVudHJpZXMgaW4gdGhlIGNvbnRleHQuXG4gKlxuICogTGV0J3MgaW1hZ2luZSB0aGUgZm9sbG93aW5nIGV4YW1wbGU6XG4gKlxuICogYGBgaHRtbFxuICogPGRpdiBzdHlsZT1cImNvbG9yOnJlZFwiXG4gKiAgICAgW3N0eWxlLmNvbG9yXT1cIm15Q29sb3JcIlxuICogICAgIGRpci10aGF0LWhhcy1zdGF0aWMtaGVpZ2h0PlxuICogICAuLi5cbiAqIDwvZGl2PlxuICogYGBgXG4gKlxuICogV2hlbiB0aGUgY29kZSBhYm92ZSBpcyBwcm9jZXNzZWQsIHRoZSB1bmRlcmx5aW5nIGVsZW1lbnQvc3R5bGluZ1xuICogaW5zdHJ1Y3Rpb25zIHdpbGwgY3JlYXRlIGFuIGluc3RhbmNlIG9mIGBUU3R5bGluZ0NvbnRleHRgIGZvclxuICogdGhlIGB0Tm9kZS5zdHlsZXNgIHByb3BlcnR5LiBIZXJlJ3Mgd2hhdCB0aGF0IGxvb2tzIGxpa2U6XG4gKlxuICogYGBgdHlwZXNjcmlwdFxuICogdE5vZGUuc3R5bGVzID0gW1xuICogICAvLyAuLi5cbiAqICAgLy8gaW5pdGlhbCBzdHlsZXNcbiAqICAgWydjb2xvcjpyZWQ7IGhlaWdodDoyMDBweCcsICdjb2xvcicsICdyZWQnLCAnaGVpZ2h0JywgJzIwMHB4J10sXG4gKlxuICogICAwLCAwYjEsIDBiMCwgJ2NvbG9yJywgMjAsIG51bGwsIC8vIFtzdHlsZS5jb2xvcl0gYmluZGluZ1xuICogXVxuICogYGBgXG4gKlxuICogQWZ0ZXIgdGhpcyBmdW5jdGlvbiBpcyBjYWxsZWQgaXQgd2lsbCBiYWxhbmNlIG91dCB0aGUgY29udGV4dCB3aXRoXG4gKiB0aGUgc3RhdGljIGBjb2xvcmAgYW5kIGBoZWlnaHRgIHZhbHVlcyBhbmQgc2V0IHRoZW0gYXMgZGVmYXVsdHMgd2l0aGluXG4gKiB0aGUgY29udGV4dDpcbiAqXG4gKiBgYGB0eXBlc2NyaXB0XG4gKiB0Tm9kZS5zdHlsZXMgPSBbXG4gKiAgIC8vIC4uLlxuICogICAvLyBpbml0aWFsIHN0eWxlc1xuICogICBbJ2NvbG9yOnJlZDsgaGVpZ2h0OjIwMHB4JywgJ2NvbG9yJywgJ3JlZCcsICdoZWlnaHQnLCAnMjAwcHgnXSxcbiAqXG4gKiAgIDAsIDBiMSwgMGIwLCAnY29sb3InLCAyMCwgJ3JlZCcsXG4gKiAgIDAsIDBiMCwgMGIwLCAnaGVpZ2h0JywgMCwgJzIwMHB4JyxcbiAqIF1cbiAqIGBgYFxuICovXG5mdW5jdGlvbiBzeW5jQ29udGV4dEluaXRpYWxTdHlsaW5nKGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCk6IHZvaWQge1xuICAvLyB0aGUgVFN0eWxpbmdDb250ZXh0IGFsd2F5cyBoYXMgaW5pdGlhbCBzdHlsZS9jbGFzcyB2YWx1ZXMgd2hpY2ggYXJlXG4gIC8vIHN0b3JlZCBpbiBzdHlsaW5nIGFycmF5IGZvcm1hdC5cbiAgdXBkYXRlSW5pdGlhbFN0eWxpbmdPbkNvbnRleHQoY29udGV4dCwgZ2V0U3R5bGluZ01hcEFycmF5KGNvbnRleHQpICEpO1xufVxuXG4vKipcbiAqIFJlZ2lzdGVycyBhbGwgaW5pdGlhbCBzdHlsaW5nIGVudHJpZXMgaW50byB0aGUgcHJvdmlkZWQgY29udGV4dC5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIHdpbGwgaXRlcmF0ZSBvdmVyIGFsbCBlbnRyaWVzIGluIHRoZSBwcm92aWRlZCBgaW5pdGlhbFN0eWxpbmdgIGFyfXJheSBhbmQgcmVnaXN0ZXJcbiAqIHRoZW0gYXMgZGVmYXVsdCAoaW5pdGlhbCkgdmFsdWVzIGluIHRoZSBwcm92aWRlZCBjb250ZXh0LiBJbml0aWFsIHN0eWxpbmcgdmFsdWVzIGluIGEgY29udGV4dCBhcmVcbiAqIHRoZSBkZWZhdWx0IHZhbHVlcyB0aGF0IGFyZSB0byBiZSBhcHBsaWVkIHVubGVzcyBvdmVyd3JpdHRlbiBieSBhIGJpbmRpbmcuXG4gKlxuICogVGhlIHJlYXNvbiB3aHkgdGhpcyBmdW5jdGlvbiBleGlzdHMgYW5kIGlzbid0IGEgcGFydCBvZiB0aGUgY29udGV4dCBjb25zdHJ1Y3Rpb24gaXMgYmVjYXVzZVxuICogaG9zdCBiaW5kaW5nIGlzIGV2YWx1YXRlZCBhdCBhIGxhdGVyIHN0YWdlIGFmdGVyIHRoZSBlbGVtZW50IGlzIGNyZWF0ZWQuIFRoaXMgbWVhbnMgdGhhdFxuICogaWYgYSBkaXJlY3RpdmUgb3IgY29tcG9uZW50IGNvbnRhaW5zIGFueSBpbml0aWFsIHN0eWxpbmcgY29kZSAoaS5lLiBgPGRpdiBjbGFzcz1cImZvb1wiPmApXG4gKiB0aGVuIHRoYXQgaW5pdGlhbCBzdHlsaW5nIGRhdGEgY2FuIG9ubHkgYmUgYXBwbGllZCBvbmNlIHRoZSBzdHlsaW5nIGZvciB0aGF0IGVsZW1lbnRcbiAqIGlzIGZpcnN0IGFwcGxpZWQgKGF0IHRoZSBlbmQgb2YgdGhlIHVwZGF0ZSBwaGFzZSkuIE9uY2UgdGhhdCBoYXBwZW5zIHRoZW4gdGhlIGNvbnRleHQgd2lsbFxuICogdXBkYXRlIGl0c2VsZiB3aXRoIHRoZSBjb21wbGV0ZSBpbml0aWFsIHN0eWxpbmcgZm9yIHRoZSBlbGVtZW50LlxuICovXG5mdW5jdGlvbiB1cGRhdGVJbml0aWFsU3R5bGluZ09uQ29udGV4dChcbiAgICBjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQsIGluaXRpYWxTdHlsaW5nOiBTdHlsaW5nTWFwQXJyYXkpOiB2b2lkIHtcbiAgLy8gYC0xYCBpcyB1c2VkIGhlcmUgYmVjYXVzZSBhbGwgaW5pdGlhbCBzdHlsaW5nIGRhdGEgaXMgbm90IGEgYXBhcnRcbiAgLy8gb2YgYSBiaW5kaW5nIChzaW5jZSBpdCdzIHN0YXRpYylcbiAgY29uc3QgQ09VTlRfSURfRk9SX1NUWUxJTkcgPSAtMTtcblxuICBsZXQgaGFzSW5pdGlhbFN0eWxpbmcgPSBmYWxzZTtcbiAgZm9yIChsZXQgaSA9IFN0eWxpbmdNYXBBcnJheUluZGV4LlZhbHVlc1N0YXJ0UG9zaXRpb247IGkgPCBpbml0aWFsU3R5bGluZy5sZW5ndGg7XG4gICAgICAgaSArPSBTdHlsaW5nTWFwQXJyYXlJbmRleC5UdXBsZVNpemUpIHtcbiAgICBjb25zdCB2YWx1ZSA9IGdldE1hcFZhbHVlKGluaXRpYWxTdHlsaW5nLCBpKTtcbiAgICBpZiAodmFsdWUpIHtcbiAgICAgIGNvbnN0IHByb3AgPSBnZXRNYXBQcm9wKGluaXRpYWxTdHlsaW5nLCBpKTtcbiAgICAgIHJlZ2lzdGVyQmluZGluZyhjb250ZXh0LCBDT1VOVF9JRF9GT1JfU1RZTElORywgMCwgcHJvcCwgdmFsdWUsIGZhbHNlKTtcbiAgICAgIGhhc0luaXRpYWxTdHlsaW5nID0gdHJ1ZTtcbiAgICB9XG4gIH1cblxuICBpZiAoaGFzSW5pdGlhbFN0eWxpbmcpIHtcbiAgICBwYXRjaENvbmZpZyhjb250ZXh0LCBUU3R5bGluZ0NvbmZpZy5IYXNJbml0aWFsU3R5bGluZyk7XG4gIH1cbn1cblxuLyoqXG4gKiBSdW5zIHRocm91Z2ggdGhlIHByb3ZpZGVkIHN0eWxpbmcgY29udGV4dCBhbmQgYXBwbGllcyBlYWNoIHZhbHVlIHRvXG4gKiB0aGUgcHJvdmlkZWQgZWxlbWVudCAodmlhIHRoZSByZW5kZXJlcikgaWYgb25lIG9yIG1vcmUgdmFsdWVzIGFyZSBwcmVzZW50LlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gd2lsbCBpdGVyYXRlIG92ZXIgYWxsIGVudHJpZXMgcHJlc2VudCBpbiB0aGUgcHJvdmlkZWRcbiAqIGBUU3R5bGluZ0NvbnRleHRgIGFycmF5IChib3RoIHByb3AtYmFzZWQgYW5kIG1hcC1iYXNlZCBiaW5kaW5ncykuLVxuICpcbiAqIEVhY2ggZW50cnksIHdpdGhpbiB0aGUgYFRTdHlsaW5nQ29udGV4dGAgYXJyYXksIGlzIHN0b3JlZCBhbHBoYWJldGljYWxseVxuICogYW5kIHRoaXMgbWVhbnMgdGhhdCBlYWNoIHByb3AvdmFsdWUgZW50cnkgd2lsbCBiZSBhcHBsaWVkIGluIG9yZGVyXG4gKiAoc28gbG9uZyBhcyBpdCBpcyBtYXJrZWQgZGlydHkgaW4gdGhlIHByb3ZpZGVkIGBiaXRNYXNrYCB2YWx1ZSkuXG4gKlxuICogSWYgdGhlcmUgYXJlIGFueSBtYXAtYmFzZWQgZW50cmllcyBwcmVzZW50ICh3aGljaCBhcmUgYXBwbGllZCB0byB0aGVcbiAqIGVsZW1lbnQgdmlhIHRoZSBgW3N0eWxlXWAgYW5kIGBbY2xhc3NdYCBiaW5kaW5ncykgdGhlbiB0aG9zZSBlbnRyaWVzXG4gKiB3aWxsIGJlIGFwcGxpZWQgYXMgd2VsbC4gSG93ZXZlciwgdGhlIGNvZGUgZm9yIHRoYXQgaXMgbm90IGEgcGFydCBvZlxuICogdGhpcyBmdW5jdGlvbi4gSW5zdGVhZCwgZWFjaCB0aW1lIGEgcHJvcGVydHkgaXMgdmlzaXRlZCwgdGhlbiB0aGVcbiAqIGNvZGUgYmVsb3cgd2lsbCBjYWxsIGFuIGV4dGVybmFsIGZ1bmN0aW9uIGNhbGxlZCBgc3R5bGluZ01hcHNTeW5jRm5gXG4gKiBhbmQsIGlmIHByZXNlbnQsIGl0IHdpbGwga2VlcCB0aGUgYXBwbGljYXRpb24gb2Ygc3R5bGluZyB2YWx1ZXMgaW5cbiAqIG1hcC1iYXNlZCBiaW5kaW5ncyB1cCB0byBzeW5jIHdpdGggdGhlIGFwcGxpY2F0aW9uIG9mIHByb3AtYmFzZWRcbiAqIGJpbmRpbmdzLlxuICpcbiAqIFZpc2l0IGBzdHlsaW5nL21hcF9iYXNlZF9iaW5kaW5ncy50c2AgdG8gbGVhcm4gbW9yZSBhYm91dCBob3cgdGhlXG4gKiBhbGdvcml0aG0gd29ya3MgZm9yIG1hcC1iYXNlZCBzdHlsaW5nIGJpbmRpbmdzLlxuICpcbiAqIE5vdGUgdGhhdCB0aGlzIGZ1bmN0aW9uIGlzIG5vdCBkZXNpZ25lZCB0byBiZSBjYWxsZWQgaW4gaXNvbGF0aW9uICh1c2VcbiAqIHRoZSBgZmx1c2hTdHlsaW5nYCBmdW5jdGlvbiBzbyB0aGF0IGl0IGNhbiBjYWxsIHRoaXMgZnVuY3Rpb24gZm9yIGJvdGhcbiAqIHRoZSBzdHlsZXMgYW5kIGNsYXNzZXMgY29udGV4dHMpLlxuICovXG5leHBvcnQgZnVuY3Rpb24gYXBwbHlTdHlsaW5nVmlhQ29udGV4dChcbiAgICBjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQsIHJlbmRlcmVyOiBSZW5kZXJlcjMgfCBQcm9jZWR1cmFsUmVuZGVyZXIzIHwgbnVsbCwgZWxlbWVudDogUkVsZW1lbnQsXG4gICAgYmluZGluZ0RhdGE6IExTdHlsaW5nRGF0YSwgYml0TWFza1ZhbHVlOiBudW1iZXIgfCBib29sZWFuLCBhcHBseVN0eWxpbmdGbjogQXBwbHlTdHlsaW5nRm4sXG4gICAgc2FuaXRpemVyOiBTdHlsZVNhbml0aXplRm4gfCBudWxsLCBob3N0QmluZGluZ3NNb2RlOiBib29sZWFuKTogdm9pZCB7XG4gIGNvbnN0IGJpdE1hc2sgPSBub3JtYWxpemVCaXRNYXNrVmFsdWUoYml0TWFza1ZhbHVlKTtcblxuICBsZXQgc3R5bGluZ01hcHNTeW5jRm46IFN5bmNTdHlsaW5nTWFwc0ZufG51bGwgPSBudWxsO1xuICBsZXQgYXBwbHlBbGxWYWx1ZXMgPSBmYWxzZTtcbiAgaWYgKGhhc0NvbmZpZyhjb250ZXh0LCBUU3R5bGluZ0NvbmZpZy5IYXNNYXBCaW5kaW5ncykpIHtcbiAgICBzdHlsaW5nTWFwc1N5bmNGbiA9IGdldFN0eWxpbmdNYXBzU3luY0ZuKCk7XG4gICAgY29uc3QgbWFwc0d1YXJkTWFzayA9XG4gICAgICAgIGdldEd1YXJkTWFzayhjb250ZXh0LCBUU3R5bGluZ0NvbnRleHRJbmRleC5WYWx1ZXNTdGFydFBvc2l0aW9uLCBob3N0QmluZGluZ3NNb2RlKTtcbiAgICBhcHBseUFsbFZhbHVlcyA9IChiaXRNYXNrICYgbWFwc0d1YXJkTWFzaykgIT09IDA7XG4gIH1cblxuICBjb25zdCB2YWx1ZXNDb3VudCA9IGdldFZhbHVlc0NvdW50KGNvbnRleHQpO1xuICBsZXQgdG90YWxCaW5kaW5nc1RvVmlzaXQgPSAxO1xuICBsZXQgbWFwc01vZGUgPVxuICAgICAgYXBwbHlBbGxWYWx1ZXMgPyBTdHlsaW5nTWFwc1N5bmNNb2RlLkFwcGx5QWxsVmFsdWVzIDogU3R5bGluZ01hcHNTeW5jTW9kZS5UcmF2ZXJzZVZhbHVlcztcbiAgaWYgKGhvc3RCaW5kaW5nc01vZGUpIHtcbiAgICBtYXBzTW9kZSB8PSBTdHlsaW5nTWFwc1N5bmNNb2RlLlJlY3Vyc2VJbm5lck1hcHM7XG4gICAgdG90YWxCaW5kaW5nc1RvVmlzaXQgPSB2YWx1ZXNDb3VudCAtIDE7XG4gIH1cblxuICBsZXQgaSA9IGdldFByb3BWYWx1ZXNTdGFydFBvc2l0aW9uKGNvbnRleHQpO1xuICB3aGlsZSAoaSA8IGNvbnRleHQubGVuZ3RoKSB7XG4gICAgY29uc3QgZ3VhcmRNYXNrID0gZ2V0R3VhcmRNYXNrKGNvbnRleHQsIGksIGhvc3RCaW5kaW5nc01vZGUpO1xuICAgIGlmIChiaXRNYXNrICYgZ3VhcmRNYXNrKSB7XG4gICAgICBsZXQgdmFsdWVBcHBsaWVkID0gZmFsc2U7XG4gICAgICBjb25zdCBwcm9wID0gZ2V0UHJvcChjb250ZXh0LCBpKTtcbiAgICAgIGNvbnN0IGRlZmF1bHRWYWx1ZSA9IGdldERlZmF1bHRWYWx1ZShjb250ZXh0LCBpKTtcblxuICAgICAgLy8gUGFydCAxOiBWaXNpdCB0aGUgYFtzdHlsaW5nLnByb3BdYCB2YWx1ZVxuICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCB0b3RhbEJpbmRpbmdzVG9WaXNpdDsgaisrKSB7XG4gICAgICAgIGNvbnN0IGJpbmRpbmdJbmRleCA9IGdldEJpbmRpbmdWYWx1ZShjb250ZXh0LCBpLCBqKSBhcyBudW1iZXI7XG4gICAgICAgIGlmICghdmFsdWVBcHBsaWVkICYmIGJpbmRpbmdJbmRleCAhPT0gMCkge1xuICAgICAgICAgIGNvbnN0IHZhbHVlID0gZ2V0VmFsdWUoYmluZGluZ0RhdGEsIGJpbmRpbmdJbmRleCk7XG4gICAgICAgICAgaWYgKGlzU3R5bGluZ1ZhbHVlRGVmaW5lZCh2YWx1ZSkpIHtcbiAgICAgICAgICAgIGNvbnN0IGNoZWNrVmFsdWVPbmx5ID0gaG9zdEJpbmRpbmdzTW9kZSAmJiBqID09PSAwO1xuICAgICAgICAgICAgaWYgKCFjaGVja1ZhbHVlT25seSkge1xuICAgICAgICAgICAgICBjb25zdCBmaW5hbFZhbHVlID0gc2FuaXRpemVyICYmIGlzU2FuaXRpemF0aW9uUmVxdWlyZWQoY29udGV4dCwgaSkgP1xuICAgICAgICAgICAgICAgICAgc2FuaXRpemVyKHByb3AsIHZhbHVlLCBTdHlsZVNhbml0aXplTW9kZS5TYW5pdGl6ZU9ubHkpIDpcbiAgICAgICAgICAgICAgICAgIHVud3JhcFNhZmVWYWx1ZSh2YWx1ZSk7XG4gICAgICAgICAgICAgIGFwcGx5U3R5bGluZ0ZuKHJlbmRlcmVyLCBlbGVtZW50LCBwcm9wLCBmaW5hbFZhbHVlLCBiaW5kaW5nSW5kZXgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFsdWVBcHBsaWVkID0gdHJ1ZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBQYXJ0IDI6IFZpc2l0IHRoZSBgW3N0eWxlXWAgb3IgYFtjbGFzc11gIG1hcC1iYXNlZCB2YWx1ZVxuICAgICAgICBpZiAoc3R5bGluZ01hcHNTeW5jRm4pIHtcbiAgICAgICAgICAvLyBkZXRlcm1pbmUgd2hldGhlciBvciBub3QgdG8gYXBwbHkgdGhlIHRhcmdldCBwcm9wZXJ0eSBvciB0byBza2lwIGl0XG4gICAgICAgICAgbGV0IG1vZGUgPSBtYXBzTW9kZSB8ICh2YWx1ZUFwcGxpZWQgPyBTdHlsaW5nTWFwc1N5bmNNb2RlLlNraXBUYXJnZXRQcm9wIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFN0eWxpbmdNYXBzU3luY01vZGUuQXBwbHlUYXJnZXRQcm9wKTtcblxuICAgICAgICAgIC8vIHRoZSBmaXJzdCBjb2x1bW4gaW4gdGhlIGNvbnRleHQgKHdoZW4gYGogPT0gMGApIGlzIHNwZWNpYWwtY2FzZWQgZm9yXG4gICAgICAgICAgLy8gdGVtcGxhdGUgYmluZGluZ3MuIElmIGFuZCB3aGVuIGhvc3QgYmluZGluZ3MgYXJlIGJlaW5nIHByb2Nlc3NlZCB0aGVuXG4gICAgICAgICAgLy8gdGhlIGZpcnN0IGNvbHVtbiB3aWxsIHN0aWxsIGJlIGl0ZXJhdGVkIG92ZXIsIGJ1dCB0aGUgdmFsdWVzIHdpbGwgb25seVxuICAgICAgICAgIC8vIGJlIGNoZWNrZWQgYWdhaW5zdCAobm90IGFwcGxpZWQpLiBJZiBhbmQgd2hlbiB0aGlzIGhhcHBlbnMgd2UgbmVlZCB0b1xuICAgICAgICAgIC8vIG5vdGlmeSB0aGUgbWFwLWJhc2VkIHN5bmNpbmcgY29kZSB0byBrbm93IG5vdCB0byBhcHBseSB0aGUgdmFsdWVzIGl0XG4gICAgICAgICAgLy8gY29tZXMgYWNyb3NzIGluIHRoZSB2ZXJ5IGZpcnN0IG1hcC1iYXNlZCBiaW5kaW5nICh3aGljaCBpcyBhbHNvIGxvY2F0ZWRcbiAgICAgICAgICAvLyBpbiBjb2x1bW4gemVybykuXG4gICAgICAgICAgaWYgKGhvc3RCaW5kaW5nc01vZGUgJiYgaiA9PT0gMCkge1xuICAgICAgICAgICAgbW9kZSB8PSBTdHlsaW5nTWFwc1N5bmNNb2RlLkNoZWNrVmFsdWVzT25seTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBjb25zdCB2YWx1ZUFwcGxpZWRXaXRoaW5NYXAgPSBzdHlsaW5nTWFwc1N5bmNGbihcbiAgICAgICAgICAgICAgY29udGV4dCwgcmVuZGVyZXIsIGVsZW1lbnQsIGJpbmRpbmdEYXRhLCBqLCBhcHBseVN0eWxpbmdGbiwgc2FuaXRpemVyLCBtb2RlLCBwcm9wLFxuICAgICAgICAgICAgICBkZWZhdWx0VmFsdWUpO1xuICAgICAgICAgIHZhbHVlQXBwbGllZCA9IHZhbHVlQXBwbGllZCB8fCB2YWx1ZUFwcGxpZWRXaXRoaW5NYXA7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gUGFydCAzOiBhcHBseSB0aGUgZGVmYXVsdCB2YWx1ZSAoZS5nLiBgPGRpdiBzdHlsZT1cIndpZHRoOjIwMFwiPmAgPT4gYDIwMHB4YCBnZXRzIGFwcGxpZWQpXG4gICAgICAvLyBpZiB0aGUgdmFsdWUgaGFzIG5vdCB5ZXQgYmVlbiBhcHBsaWVkIHRoZW4gYSB0cnV0aHkgdmFsdWUgZG9lcyBub3QgZXhpc3QgaW4gdGhlXG4gICAgICAvLyBwcm9wLWJhc2VkIG9yIG1hcC1iYXNlZCBiaW5kaW5ncyBjb2RlLiBJZiBhbmQgd2hlbiB0aGlzIGhhcHBlbnMsIGp1c3QgYXBwbHkgdGhlXG4gICAgICAvLyBkZWZhdWx0IHZhbHVlIChldmVuIGlmIHRoZSBkZWZhdWx0IHZhbHVlIGlzIGBudWxsYCkuXG4gICAgICBpZiAoIXZhbHVlQXBwbGllZCkge1xuICAgICAgICBhcHBseVN0eWxpbmdGbihyZW5kZXJlciwgZWxlbWVudCwgcHJvcCwgZGVmYXVsdFZhbHVlKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpICs9IFRTdHlsaW5nQ29udGV4dEluZGV4LkJpbmRpbmdzU3RhcnRPZmZzZXQgKyB2YWx1ZXNDb3VudDtcbiAgfVxuXG4gIC8vIHRoZSBtYXAtYmFzZWQgc3R5bGluZyBlbnRyaWVzIG1heSBoYXZlIG5vdCBhcHBsaWVkIGFsbCB0aGVpclxuICAvLyB2YWx1ZXMuIEZvciB0aGlzIHJlYXNvbiwgb25lIG1vcmUgY2FsbCB0byB0aGUgc3luYyBmdW5jdGlvblxuICAvLyBuZWVkcyB0byBiZSBpc3N1ZWQgYXQgdGhlIGVuZC5cbiAgaWYgKHN0eWxpbmdNYXBzU3luY0ZuKSB7XG4gICAgaWYgKGhvc3RCaW5kaW5nc01vZGUpIHtcbiAgICAgIG1hcHNNb2RlIHw9IFN0eWxpbmdNYXBzU3luY01vZGUuQ2hlY2tWYWx1ZXNPbmx5O1xuICAgIH1cbiAgICBzdHlsaW5nTWFwc1N5bmNGbihcbiAgICAgICAgY29udGV4dCwgcmVuZGVyZXIsIGVsZW1lbnQsIGJpbmRpbmdEYXRhLCAwLCBhcHBseVN0eWxpbmdGbiwgc2FuaXRpemVyLCBtYXBzTW9kZSk7XG4gIH1cbn1cblxuLyoqXG4gKiBBcHBsaWVzIHRoZSBwcm92aWRlZCBzdHlsaW5nIG1hcCB0byB0aGUgZWxlbWVudCBkaXJlY3RseSAod2l0aG91dCBjb250ZXh0IHJlc29sdXRpb24pLlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gaXMgZGVzaWduZWQgdG8gYmUgcnVuIGZyb20gdGhlIHN0eWxpbmcgaW5zdHJ1Y3Rpb25zIGFuZCB3aWxsIGJlIGNhbGxlZFxuICogYXV0b21hdGljYWxseS4gVGhpcyBmdW5jdGlvbiBpcyBpbnRlbmRlZCB0byBiZSB1c2VkIGZvciBwZXJmb3JtYW5jZSByZWFzb25zIGluIHRoZVxuICogZXZlbnQgdGhhdCB0aGVyZSBpcyBubyBuZWVkIHRvIGFwcGx5IHN0eWxpbmcgdmlhIGNvbnRleHQgcmVzb2x1dGlvbi5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIGhhcyB0aHJlZSBkaWZmZXJlbnQgY2FzZXMgdGhhdCBjYW4gb2NjdXIgKGZvciBlYWNoIGl0ZW0gaW4gdGhlIG1hcCk6XG4gKlxuICogLSBDYXNlIDE6IEF0dGVtcHQgdG8gYXBwbHkgdGhlIGN1cnJlbnQgdmFsdWUgaW4gdGhlIG1hcCB0byB0aGUgZWxlbWVudCAoaWYgaXQncyBgbm9uIG51bGxgKS5cbiAqXG4gKiAtIENhc2UgMjogSWYgYSBtYXAgdmFsdWUgZmFpbHMgdG8gYmUgYXBwbGllZCB0aGVuIHRoZSBhbGdvcml0aG0gd2lsbCBmaW5kIGEgbWF0Y2hpbmcgZW50cnkgaW5cbiAqICAgICAgICAgICB0aGUgaW5pdGlhbCB2YWx1ZXMgcHJlc2VudCBpbiB0aGUgY29udGV4dCBhbmQgYXR0ZW1wdCB0byBhcHBseSB0aGF0LlxuICpcbiAqIC0gRGVmYXVsdCBDYXNlOiBJZiB0aGUgaW5pdGlhbCB2YWx1ZSBjYW5ub3QgYmUgYXBwbGllZCB0aGVuIGEgZGVmYXVsdCB2YWx1ZSBvZiBgbnVsbGAgd2lsbCBiZVxuICogICAgICAgICAgICAgICAgIGFwcGxpZWQgKHdoaWNoIHdpbGwgcmVtb3ZlIHRoZSBzdHlsZS9jbGFzcyB2YWx1ZSBmcm9tIHRoZSBlbGVtZW50KS5cbiAqXG4gKiBTZWUgYGFsbG93RGlyZWN0U3R5bGluZ0FwcGx5YCB0byBsZWFybiB0aGUgbG9naWMgdXNlZCB0byBkZXRlcm1pbmUgd2hldGhlciBhbnkgc3R5bGUvY2xhc3NcbiAqIGJpbmRpbmdzIGNhbiBiZSBkaXJlY3RseSBhcHBsaWVkLlxuICpcbiAqIEByZXR1cm5zIHdoZXRoZXIgb3Igbm90IHRoZSBzdHlsaW5nIG1hcCB3YXMgYXBwbGllZCB0byB0aGUgZWxlbWVudC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFwcGx5U3R5bGluZ01hcERpcmVjdGx5KFxuICAgIHJlbmRlcmVyOiBhbnksIGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCwgZWxlbWVudDogUkVsZW1lbnQsIGRhdGE6IExTdHlsaW5nRGF0YSxcbiAgICBiaW5kaW5nSW5kZXg6IG51bWJlciwgdmFsdWU6IHtba2V5OiBzdHJpbmddOiBhbnl9IHwgc3RyaW5nIHwgbnVsbCwgaXNDbGFzc0Jhc2VkOiBib29sZWFuLFxuICAgIHNhbml0aXplcj86IFN0eWxlU2FuaXRpemVGbiB8IG51bGwsIGZvcmNlVXBkYXRlPzogYm9vbGVhbixcbiAgICBiaW5kaW5nVmFsdWVDb250YWluc0luaXRpYWw/OiBib29sZWFuKTogdm9pZCB7XG4gIGNvbnN0IG9sZFZhbHVlID0gZ2V0VmFsdWUoZGF0YSwgYmluZGluZ0luZGV4KTtcbiAgaWYgKGZvcmNlVXBkYXRlIHx8IGhhc1ZhbHVlQ2hhbmdlZChvbGRWYWx1ZSwgdmFsdWUpKSB7XG4gICAgY29uc3QgY29uZmlnID0gZ2V0Q29uZmlnKGNvbnRleHQpO1xuICAgIGNvbnN0IGhhc0luaXRpYWwgPSBjb25maWcgJiBUU3R5bGluZ0NvbmZpZy5IYXNJbml0aWFsU3R5bGluZztcbiAgICBjb25zdCBpbml0aWFsVmFsdWUgPVxuICAgICAgICBoYXNJbml0aWFsICYmICFiaW5kaW5nVmFsdWVDb250YWluc0luaXRpYWwgPyBnZXRJbml0aWFsU3R5bGluZ1ZhbHVlKGNvbnRleHQpIDogbnVsbDtcbiAgICBzZXRWYWx1ZShkYXRhLCBiaW5kaW5nSW5kZXgsIHZhbHVlKTtcblxuICAgIC8vIHRoZSBjYWNoZWQgdmFsdWUgaXMgdGhlIGxhc3Qgc25hcHNob3Qgb2YgdGhlIHN0eWxlIG9yIGNsYXNzXG4gICAgLy8gYXR0cmlidXRlIHZhbHVlIGFuZCBpcyB1c2VkIGluIHRoZSBpZiBzdGF0ZW1lbnQgYmVsb3cgdG9cbiAgICAvLyBrZWVwIHRyYWNrIG9mIGludGVybmFsL2V4dGVybmFsIGNoYW5nZXMuXG4gICAgY29uc3QgY2FjaGVkVmFsdWVJbmRleCA9IGJpbmRpbmdJbmRleCArIDE7XG4gICAgbGV0IGNhY2hlZFZhbHVlID0gZ2V0VmFsdWUoZGF0YSwgY2FjaGVkVmFsdWVJbmRleCk7XG4gICAgaWYgKGNhY2hlZFZhbHVlID09PSBOT19DSEFOR0UpIHtcbiAgICAgIGNhY2hlZFZhbHVlID0gaW5pdGlhbFZhbHVlO1xuICAgIH1cbiAgICBjYWNoZWRWYWx1ZSA9IHR5cGVvZiBjYWNoZWRWYWx1ZSAhPT0gJ3N0cmluZycgPyAnJyA6IGNhY2hlZFZhbHVlO1xuXG4gICAgLy8gSWYgYSBjbGFzcy9zdHlsZSB2YWx1ZSB3YXMgbW9kaWZpZWQgZXh0ZXJuYWxseSB0aGVuIHRoZSBzdHlsaW5nXG4gICAgLy8gZmFzdCBwYXNzIGNhbm5vdCBndWFyYW50ZWUgdGhhdCB0aGUgZXh0ZXJuYWwgdmFsdWVzIGFyZSByZXRhaW5lZC5cbiAgICAvLyBXaGVuIHRoaXMgaGFwcGVucywgdGhlIGFsZ29yaXRobSB3aWxsIGJhaWwgb3V0IGFuZCBub3Qgd3JpdGUgdG9cbiAgICAvLyB0aGUgc3R5bGUgb3IgY2xhc3NOYW1lIGF0dHJpYnV0ZSBkaXJlY3RseS5cbiAgICBsZXQgd3JpdGVUb0F0dHJEaXJlY3RseSA9ICEoY29uZmlnICYgVFN0eWxpbmdDb25maWcuSGFzUHJvcEJpbmRpbmdzKTtcbiAgICBpZiAod3JpdGVUb0F0dHJEaXJlY3RseSAmJlxuICAgICAgICBjaGVja0lmRXh0ZXJuYWxseU1vZGlmaWVkKGVsZW1lbnQgYXMgSFRNTEVsZW1lbnQsIGNhY2hlZFZhbHVlLCBpc0NsYXNzQmFzZWQpKSB7XG4gICAgICB3cml0ZVRvQXR0ckRpcmVjdGx5ID0gZmFsc2U7XG4gICAgICBpZiAob2xkVmFsdWUgIT09IFZBTFVFX0lTX0VYVEVSTkFMTFlfTU9ESUZJRUQpIHtcbiAgICAgICAgLy8gZGlyZWN0IHN0eWxpbmcgd2lsbCByZXNldCB0aGUgYXR0cmlidXRlIGVudGlyZWx5IGVhY2ggdGltZSxcbiAgICAgICAgLy8gYW5kLCBmb3IgdGhpcyByZWFzb24sIGlmIHRoZSBhbGdvcml0aG0gZGVjaWRlcyBpdCBjYW5ub3RcbiAgICAgICAgLy8gd3JpdGUgdG8gdGhlIGNsYXNzL3N0eWxlIGF0dHJpYnV0ZXMgZGlyZWN0bHkgdGhlbiBpdCBtdXN0XG4gICAgICAgIC8vIHJlc2V0IGFsbCB0aGUgcHJldmlvdXMgc3R5bGUvY2xhc3MgdmFsdWVzIGJlZm9yZSBpdCBzdGFydHNcbiAgICAgICAgLy8gdG8gYXBwbHkgdmFsdWVzIGluIHRoZSBub24tZGlyZWN0IHdheS5cbiAgICAgICAgcmVtb3ZlU3R5bGluZ1ZhbHVlcyhyZW5kZXJlciwgZWxlbWVudCwgb2xkVmFsdWUsIGlzQ2xhc3NCYXNlZCk7XG5cbiAgICAgICAgLy8gdGhpcyB3aWxsIGluc3RydWN0IHRoZSBhbGdvcml0aG0gbm90IHRvIGFwcGx5IGNsYXNzIG9yIHN0eWxlXG4gICAgICAgIC8vIHZhbHVlcyBkaXJlY3RseSBhbnltb3JlLlxuICAgICAgICBzZXRWYWx1ZShkYXRhLCBjYWNoZWRWYWx1ZUluZGV4LCBWQUxVRV9JU19FWFRFUk5BTExZX01PRElGSUVEKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAod3JpdGVUb0F0dHJEaXJlY3RseSkge1xuICAgICAgY29uc3QgaW5pdGlhbFZhbHVlID1cbiAgICAgICAgICBoYXNJbml0aWFsICYmICFiaW5kaW5nVmFsdWVDb250YWluc0luaXRpYWwgPyBnZXRJbml0aWFsU3R5bGluZ1ZhbHVlKGNvbnRleHQpIDogbnVsbDtcbiAgICAgIGNvbnN0IHZhbHVlVG9BcHBseSA9XG4gICAgICAgICAgd3JpdGVTdHlsaW5nVmFsdWVEaXJlY3RseShyZW5kZXJlciwgZWxlbWVudCwgdmFsdWUsIGlzQ2xhc3NCYXNlZCwgaW5pdGlhbFZhbHVlKTtcbiAgICAgIHNldFZhbHVlKGRhdGEsIGNhY2hlZFZhbHVlSW5kZXgsIHZhbHVlVG9BcHBseSB8fCBudWxsKTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgYXBwbHlGbiA9IGlzQ2xhc3NCYXNlZCA/IHNldENsYXNzIDogc2V0U3R5bGU7XG4gICAgICBjb25zdCBtYXAgPSBub3JtYWxpemVJbnRvU3R5bGluZ01hcChvbGRWYWx1ZSwgdmFsdWUsICFpc0NsYXNzQmFzZWQpO1xuICAgICAgY29uc3QgaW5pdGlhbFN0eWxlcyA9IGhhc0luaXRpYWwgPyBnZXRTdHlsaW5nTWFwQXJyYXkoY29udGV4dCkgOiBudWxsO1xuXG4gICAgICBmb3IgKGxldCBpID0gU3R5bGluZ01hcEFycmF5SW5kZXguVmFsdWVzU3RhcnRQb3NpdGlvbjsgaSA8IG1hcC5sZW5ndGg7XG4gICAgICAgICAgIGkgKz0gU3R5bGluZ01hcEFycmF5SW5kZXguVHVwbGVTaXplKSB7XG4gICAgICAgIGNvbnN0IHByb3AgPSBnZXRNYXBQcm9wKG1hcCwgaSk7XG4gICAgICAgIGNvbnN0IHZhbHVlID0gZ2V0TWFwVmFsdWUobWFwLCBpKTtcblxuICAgICAgICAvLyBjYXNlIDE6IGFwcGx5IHRoZSBtYXAgdmFsdWUgKGlmIGl0IGV4aXN0cylcbiAgICAgICAgbGV0IGFwcGxpZWQgPVxuICAgICAgICAgICAgYXBwbHlTdHlsaW5nVmFsdWUocmVuZGVyZXIsIGVsZW1lbnQsIHByb3AsIHZhbHVlLCBhcHBseUZuLCBiaW5kaW5nSW5kZXgsIHNhbml0aXplcik7XG5cbiAgICAgICAgLy8gY2FzZSAyOiBhcHBseSB0aGUgaW5pdGlhbCB2YWx1ZSAoaWYgaXQgZXhpc3RzKVxuICAgICAgICBpZiAoIWFwcGxpZWQgJiYgaW5pdGlhbFN0eWxlcykge1xuICAgICAgICAgIGFwcGxpZWQgPSBmaW5kQW5kQXBwbHlNYXBWYWx1ZShcbiAgICAgICAgICAgICAgcmVuZGVyZXIsIGVsZW1lbnQsIGFwcGx5Rm4sIGluaXRpYWxTdHlsZXMsIHByb3AsIGJpbmRpbmdJbmRleCwgc2FuaXRpemVyKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGRlZmF1bHQgY2FzZTogYXBwbHkgYG51bGxgIHRvIHJlbW92ZSB0aGUgdmFsdWVcbiAgICAgICAgaWYgKCFhcHBsaWVkKSB7XG4gICAgICAgICAgYXBwbHlGbihyZW5kZXJlciwgZWxlbWVudCwgcHJvcCwgbnVsbCwgYmluZGluZ0luZGV4KTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBjb25zdCBzdGF0ZSA9IGdldFN0eWxpbmdTdGF0ZShlbGVtZW50LCBURU1QTEFURV9ESVJFQ1RJVkVfSU5ERVgpO1xuICAgICAgaWYgKGlzQ2xhc3NCYXNlZCkge1xuICAgICAgICBzdGF0ZS5sYXN0RGlyZWN0Q2xhc3NNYXAgPSBtYXA7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzdGF0ZS5sYXN0RGlyZWN0U3R5bGVNYXAgPSBtYXA7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB3cml0ZVN0eWxpbmdWYWx1ZURpcmVjdGx5KFxuICAgIHJlbmRlcmVyOiBhbnksIGVsZW1lbnQ6IFJFbGVtZW50LCB2YWx1ZToge1trZXk6IHN0cmluZ106IGFueX0gfCBzdHJpbmcgfCBudWxsLFxuICAgIGlzQ2xhc3NCYXNlZDogYm9vbGVhbiwgaW5pdGlhbFZhbHVlOiBzdHJpbmcgfCBudWxsKTogc3RyaW5nIHtcbiAgbGV0IHZhbHVlVG9BcHBseTogc3RyaW5nO1xuICBpZiAoaXNDbGFzc0Jhc2VkKSB7XG4gICAgdmFsdWVUb0FwcGx5ID0gdHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJyA/IHZhbHVlIDogb2JqZWN0VG9DbGFzc05hbWUodmFsdWUpO1xuICAgIGlmIChpbml0aWFsVmFsdWUgIT09IG51bGwpIHtcbiAgICAgIHZhbHVlVG9BcHBseSA9IGNvbmNhdFN0cmluZyhpbml0aWFsVmFsdWUsIHZhbHVlVG9BcHBseSwgJyAnKTtcbiAgICB9XG4gICAgc2V0Q2xhc3NOYW1lKHJlbmRlcmVyLCBlbGVtZW50LCB2YWx1ZVRvQXBwbHkpO1xuICB9IGVsc2Uge1xuICAgIHZhbHVlVG9BcHBseSA9IGZvcmNlU3R5bGVzQXNTdHJpbmcodmFsdWUsIHRydWUpO1xuICAgIGlmIChpbml0aWFsVmFsdWUgIT09IG51bGwpIHtcbiAgICAgIHZhbHVlVG9BcHBseSA9IGluaXRpYWxWYWx1ZSArICc7JyArIHZhbHVlVG9BcHBseTtcbiAgICB9XG4gICAgc2V0U3R5bGVBdHRyKHJlbmRlcmVyLCBlbGVtZW50LCB2YWx1ZVRvQXBwbHkpO1xuICB9XG4gIHJldHVybiB2YWx1ZVRvQXBwbHk7XG59XG5cbi8qKlxuICogQXBwbGllcyB0aGUgcHJvdmlkZWQgc3R5bGluZyBwcm9wL3ZhbHVlIHRvIHRoZSBlbGVtZW50IGRpcmVjdGx5ICh3aXRob3V0IGNvbnRleHQgcmVzb2x1dGlvbikuXG4gKlxuICogVGhpcyBmdW5jdGlvbiBpcyBkZXNpZ25lZCB0byBiZSBydW4gZnJvbSB0aGUgc3R5bGluZyBpbnN0cnVjdGlvbnMgYW5kIHdpbGwgYmUgY2FsbGVkXG4gKiBhdXRvbWF0aWNhbGx5LiBUaGlzIGZ1bmN0aW9uIGlzIGludGVuZGVkIHRvIGJlIHVzZWQgZm9yIHBlcmZvcm1hbmNlIHJlYXNvbnMgaW4gdGhlXG4gKiBldmVudCB0aGF0IHRoZXJlIGlzIG5vIG5lZWQgdG8gYXBwbHkgc3R5bGluZyB2aWEgY29udGV4dCByZXNvbHV0aW9uLlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gaGFzIGZvdXIgZGlmZmVyZW50IGNhc2VzIHRoYXQgY2FuIG9jY3VyOlxuICpcbiAqIC0gQ2FzZSAxOiBBcHBseSB0aGUgcHJvdmlkZWQgcHJvcC92YWx1ZSAoc3R5bGUgb3IgY2xhc3MpIGVudHJ5IHRvIHRoZSBlbGVtZW50XG4gKiAgICAgICAgICAgKGlmIGl0IGlzIGBub24gbnVsbGApLlxuICpcbiAqIC0gQ2FzZSAyOiBJZiB2YWx1ZSBkb2VzIG5vdCBnZXQgYXBwbGllZCAoYmVjYXVzZSBpdHMgYG51bGxgIG9yIGB1bmRlZmluZWRgKSB0aGVuIHRoZSBhbGdvcml0aG1cbiAqICAgICAgICAgICB3aWxsIGNoZWNrIHRvIHNlZSBpZiBhIHN0eWxpbmcgbWFwIHZhbHVlIHdhcyBhcHBsaWVkIHRvIHRoZSBlbGVtZW50IGFzIHdlbGwganVzdFxuICogICAgICAgICAgIGJlZm9yZSB0aGlzICh2aWEgYHN0eWxlTWFwYCBvciBgY2xhc3NNYXBgKS4gSWYgYW5kIHdoZW4gYSBtYXAgaXMgcHJlc2VudCB0aGVuIHRoZVxuICAqICAgICAgICAgIGFsZ29yaXRobSB3aWxsIGZpbmQgdGhlIG1hdGNoaW5nIHByb3BlcnR5IGluIHRoZSBtYXAgYW5kIGFwcGx5IGl0cyB2YWx1ZS5cbiAgKlxuICogLSBDYXNlIDM6IElmIGEgbWFwIHZhbHVlIGZhaWxzIHRvIGJlIGFwcGxpZWQgdGhlbiB0aGUgYWxnb3JpdGhtIHdpbGwgY2hlY2sgdG8gc2VlIGlmIHRoZXJlXG4gKiAgICAgICAgICAgYXJlIGFueSBpbml0aWFsIHZhbHVlcyBwcmVzZW50IGFuZCBhdHRlbXB0IHRvIGFwcGx5IGEgbWF0Y2hpbmcgdmFsdWUgYmFzZWQgb25cbiAqICAgICAgICAgICB0aGUgdGFyZ2V0IHByb3AuXG4gKlxuICogLSBEZWZhdWx0IENhc2U6IElmIGEgbWF0Y2hpbmcgaW5pdGlhbCB2YWx1ZSBjYW5ub3QgYmUgYXBwbGllZCB0aGVuIGEgZGVmYXVsdCB2YWx1ZVxuICogICAgICAgICAgICAgICAgIG9mIGBudWxsYCB3aWxsIGJlIGFwcGxpZWQgKHdoaWNoIHdpbGwgcmVtb3ZlIHRoZSBzdHlsZS9jbGFzcyB2YWx1ZVxuICogICAgICAgICAgICAgICAgIGZyb20gdGhlIGVsZW1lbnQpLlxuICpcbiAqIFNlZSBgYWxsb3dEaXJlY3RTdHlsaW5nQXBwbHlgIHRvIGxlYXJuIHRoZSBsb2dpYyB1c2VkIHRvIGRldGVybWluZSB3aGV0aGVyIGFueSBzdHlsZS9jbGFzc1xuICogYmluZGluZ3MgY2FuIGJlIGRpcmVjdGx5IGFwcGxpZWQuXG4gKlxuICogQHJldHVybnMgd2hldGhlciBvciBub3QgdGhlIHByb3AvdmFsdWUgc3R5bGluZyB3YXMgYXBwbGllZCB0byB0aGUgZWxlbWVudC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFwcGx5U3R5bGluZ1ZhbHVlRGlyZWN0bHkoXG4gICAgcmVuZGVyZXI6IGFueSwgY29udGV4dDogVFN0eWxpbmdDb250ZXh0LCBlbGVtZW50OiBSRWxlbWVudCwgZGF0YTogTFN0eWxpbmdEYXRhLFxuICAgIGJpbmRpbmdJbmRleDogbnVtYmVyLCBwcm9wOiBzdHJpbmcsIHZhbHVlOiBhbnksIGlzQ2xhc3NCYXNlZDogYm9vbGVhbixcbiAgICBzYW5pdGl6ZXI/OiBTdHlsZVNhbml0aXplRm4gfCBudWxsKTogYm9vbGVhbiB7XG4gIGxldCBhcHBsaWVkID0gZmFsc2U7XG4gIGlmIChoYXNWYWx1ZUNoYW5nZWQoZGF0YVtiaW5kaW5nSW5kZXhdLCB2YWx1ZSkpIHtcbiAgICBzZXRWYWx1ZShkYXRhLCBiaW5kaW5nSW5kZXgsIHZhbHVlKTtcbiAgICBjb25zdCBhcHBseUZuID0gaXNDbGFzc0Jhc2VkID8gc2V0Q2xhc3MgOiBzZXRTdHlsZTtcblxuICAgIC8vIGNhc2UgMTogYXBwbHkgdGhlIHByb3ZpZGVkIHZhbHVlIChpZiBpdCBleGlzdHMpXG4gICAgYXBwbGllZCA9IGFwcGx5U3R5bGluZ1ZhbHVlKHJlbmRlcmVyLCBlbGVtZW50LCBwcm9wLCB2YWx1ZSwgYXBwbHlGbiwgYmluZGluZ0luZGV4LCBzYW5pdGl6ZXIpO1xuXG4gICAgLy8gY2FzZSAyOiBmaW5kIHRoZSBtYXRjaGluZyBwcm9wZXJ0eSBpbiBhIHN0eWxpbmcgbWFwIGFuZCBhcHBseSB0aGUgZGV0ZWN0ZWQgdmFsdWVcbiAgICBpZiAoIWFwcGxpZWQgJiYgaGFzQ29uZmlnKGNvbnRleHQsIFRTdHlsaW5nQ29uZmlnLkhhc01hcEJpbmRpbmdzKSkge1xuICAgICAgY29uc3Qgc3RhdGUgPSBnZXRTdHlsaW5nU3RhdGUoZWxlbWVudCwgVEVNUExBVEVfRElSRUNUSVZFX0lOREVYKTtcbiAgICAgIGNvbnN0IG1hcCA9IGlzQ2xhc3NCYXNlZCA/IHN0YXRlLmxhc3REaXJlY3RDbGFzc01hcCA6IHN0YXRlLmxhc3REaXJlY3RTdHlsZU1hcDtcbiAgICAgIGFwcGxpZWQgPSBtYXAgP1xuICAgICAgICAgIGZpbmRBbmRBcHBseU1hcFZhbHVlKHJlbmRlcmVyLCBlbGVtZW50LCBhcHBseUZuLCBtYXAsIHByb3AsIGJpbmRpbmdJbmRleCwgc2FuaXRpemVyKSA6XG4gICAgICAgICAgZmFsc2U7XG4gICAgfVxuXG4gICAgLy8gY2FzZSAzOiBhcHBseSB0aGUgaW5pdGlhbCB2YWx1ZSAoaWYgaXQgZXhpc3RzKVxuICAgIGlmICghYXBwbGllZCAmJiBoYXNDb25maWcoY29udGV4dCwgVFN0eWxpbmdDb25maWcuSGFzSW5pdGlhbFN0eWxpbmcpKSB7XG4gICAgICBjb25zdCBtYXAgPSBnZXRTdHlsaW5nTWFwQXJyYXkoY29udGV4dCk7XG4gICAgICBhcHBsaWVkID1cbiAgICAgICAgICBtYXAgPyBmaW5kQW5kQXBwbHlNYXBWYWx1ZShyZW5kZXJlciwgZWxlbWVudCwgYXBwbHlGbiwgbWFwLCBwcm9wLCBiaW5kaW5nSW5kZXgpIDogZmFsc2U7XG4gICAgfVxuXG4gICAgLy8gZGVmYXVsdCBjYXNlOiBhcHBseSBgbnVsbGAgdG8gcmVtb3ZlIHRoZSB2YWx1ZVxuICAgIGlmICghYXBwbGllZCkge1xuICAgICAgYXBwbHlGbihyZW5kZXJlciwgZWxlbWVudCwgcHJvcCwgbnVsbCwgYmluZGluZ0luZGV4KTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGFwcGxpZWQ7XG59XG5cbmZ1bmN0aW9uIGFwcGx5U3R5bGluZ1ZhbHVlKFxuICAgIHJlbmRlcmVyOiBhbnksIGVsZW1lbnQ6IFJFbGVtZW50LCBwcm9wOiBzdHJpbmcsIHZhbHVlOiBhbnksIGFwcGx5Rm46IEFwcGx5U3R5bGluZ0ZuLFxuICAgIGJpbmRpbmdJbmRleDogbnVtYmVyLCBzYW5pdGl6ZXI/OiBTdHlsZVNhbml0aXplRm4gfCBudWxsKTogYm9vbGVhbiB7XG4gIGxldCB2YWx1ZVRvQXBwbHk6IHN0cmluZ3xudWxsID0gdW53cmFwU2FmZVZhbHVlKHZhbHVlKTtcbiAgaWYgKGlzU3R5bGluZ1ZhbHVlRGVmaW5lZCh2YWx1ZVRvQXBwbHkpKSB7XG4gICAgdmFsdWVUb0FwcGx5ID1cbiAgICAgICAgc2FuaXRpemVyID8gc2FuaXRpemVyKHByb3AsIHZhbHVlLCBTdHlsZVNhbml0aXplTW9kZS5WYWxpZGF0ZUFuZFNhbml0aXplKSA6IHZhbHVlVG9BcHBseTtcbiAgICBhcHBseUZuKHJlbmRlcmVyLCBlbGVtZW50LCBwcm9wLCB2YWx1ZVRvQXBwbHksIGJpbmRpbmdJbmRleCk7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG5mdW5jdGlvbiBmaW5kQW5kQXBwbHlNYXBWYWx1ZShcbiAgICByZW5kZXJlcjogYW55LCBlbGVtZW50OiBSRWxlbWVudCwgYXBwbHlGbjogQXBwbHlTdHlsaW5nRm4sIG1hcDogU3R5bGluZ01hcEFycmF5LCBwcm9wOiBzdHJpbmcsXG4gICAgYmluZGluZ0luZGV4OiBudW1iZXIsIHNhbml0aXplcj86IFN0eWxlU2FuaXRpemVGbiB8IG51bGwpIHtcbiAgZm9yIChsZXQgaSA9IFN0eWxpbmdNYXBBcnJheUluZGV4LlZhbHVlc1N0YXJ0UG9zaXRpb247IGkgPCBtYXAubGVuZ3RoO1xuICAgICAgIGkgKz0gU3R5bGluZ01hcEFycmF5SW5kZXguVHVwbGVTaXplKSB7XG4gICAgY29uc3QgcCA9IGdldE1hcFByb3AobWFwLCBpKTtcbiAgICBpZiAocCA9PT0gcHJvcCkge1xuICAgICAgbGV0IHZhbHVlVG9BcHBseSA9IGdldE1hcFZhbHVlKG1hcCwgaSk7XG4gICAgICB2YWx1ZVRvQXBwbHkgPSBzYW5pdGl6ZXIgP1xuICAgICAgICAgIHNhbml0aXplcihwcm9wLCB2YWx1ZVRvQXBwbHksIFN0eWxlU2FuaXRpemVNb2RlLlZhbGlkYXRlQW5kU2FuaXRpemUpIDpcbiAgICAgICAgICB2YWx1ZVRvQXBwbHk7XG4gICAgICBhcHBseUZuKHJlbmRlcmVyLCBlbGVtZW50LCBwcm9wLCB2YWx1ZVRvQXBwbHksIGJpbmRpbmdJbmRleCk7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgaWYgKHAgPiBwcm9wKSB7XG4gICAgICBicmVhaztcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG5mdW5jdGlvbiBub3JtYWxpemVCaXRNYXNrVmFsdWUodmFsdWU6IG51bWJlciB8IGJvb2xlYW4pOiBudW1iZXIge1xuICAvLyBpZiBwYXNzID0+IGFwcGx5IGFsbCB2YWx1ZXMgKC0xIGltcGxpZXMgdGhhdCBhbGwgYml0cyBhcmUgZmxpcHBlZCB0byB0cnVlKVxuICBpZiAodmFsdWUgPT09IHRydWUpIHJldHVybiAtMTtcblxuICAvLyBpZiBwYXNzID0+IHNraXAgYWxsIHZhbHVlc1xuICBpZiAodmFsdWUgPT09IGZhbHNlKSByZXR1cm4gMDtcblxuICAvLyByZXR1cm4gdGhlIGJpdCBtYXNrIHZhbHVlIGFzIGlzXG4gIHJldHVybiB2YWx1ZTtcbn1cblxubGV0IF9hY3RpdmVTdHlsaW5nTWFwQXBwbHlGbjogU3luY1N0eWxpbmdNYXBzRm58bnVsbCA9IG51bGw7XG5leHBvcnQgZnVuY3Rpb24gZ2V0U3R5bGluZ01hcHNTeW5jRm4oKSB7XG4gIHJldHVybiBfYWN0aXZlU3R5bGluZ01hcEFwcGx5Rm47XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXRTdHlsaW5nTWFwc1N5bmNGbihmbjogU3luY1N0eWxpbmdNYXBzRm4pIHtcbiAgX2FjdGl2ZVN0eWxpbmdNYXBBcHBseUZuID0gZm47XG59XG5cbi8qKlxuICogQXNzaWducyBhIHN0eWxlIHZhbHVlIHRvIGEgc3R5bGUgcHJvcGVydHkgZm9yIHRoZSBnaXZlbiBlbGVtZW50LlxuICovXG5leHBvcnQgY29uc3Qgc2V0U3R5bGU6IEFwcGx5U3R5bGluZ0ZuID1cbiAgICAocmVuZGVyZXI6IFJlbmRlcmVyMyB8IG51bGwsIG5hdGl2ZTogUkVsZW1lbnQsIHByb3A6IHN0cmluZywgdmFsdWU6IHN0cmluZyB8IG51bGwpID0+IHtcbiAgICAgIGlmIChyZW5kZXJlciAhPT0gbnVsbCkge1xuICAgICAgICAvLyBVc2UgYGlzU3R5bGluZ1ZhbHVlRGVmaW5lZGAgdG8gYWNjb3VudCBmb3IgZmFsc3kgdmFsdWVzIHRoYXQgc2hvdWxkIGJlIGJvdW5kIGxpa2UgMC5cbiAgICAgICAgaWYgKGlzU3R5bGluZ1ZhbHVlRGVmaW5lZCh2YWx1ZSkpIHtcbiAgICAgICAgICAvLyBvcGFjaXR5LCB6LWluZGV4IGFuZCBmbGV4Ym94IGFsbCBoYXZlIG51bWJlciB2YWx1ZXNcbiAgICAgICAgICAvLyBhbmQgdGhlc2UgbmVlZCB0byBiZSBjb252ZXJ0ZWQgaW50byBzdHJpbmdzIHNvIHRoYXRcbiAgICAgICAgICAvLyB0aGV5IGNhbiBiZSBhc3NpZ25lZCBwcm9wZXJseS5cbiAgICAgICAgICB2YWx1ZSA9IHZhbHVlLnRvU3RyaW5nKCk7XG4gICAgICAgICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlclNldFN0eWxlKys7XG4gICAgICAgICAgaWYgKGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSkge1xuICAgICAgICAgICAgcmVuZGVyZXIuc2V0U3R5bGUobmF0aXZlLCBwcm9wLCB2YWx1ZSwgUmVuZGVyZXJTdHlsZUZsYWdzMy5EYXNoQ2FzZSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIFRoZSByZWFzb24gd2h5IG5hdGl2ZSBzdHlsZSBtYXkgYmUgYG51bGxgIGlzIGVpdGhlciBiZWNhdXNlXG4gICAgICAgICAgICAvLyBpdCdzIGEgY29udGFpbmVyIGVsZW1lbnQgb3IgaXQncyBhIHBhcnQgb2YgYSB0ZXN0XG4gICAgICAgICAgICAvLyBlbnZpcm9ubWVudCB0aGF0IGRvZXNuJ3QgaGF2ZSBzdHlsaW5nLiBJbiBlaXRoZXJcbiAgICAgICAgICAgIC8vIGNhc2UgaXQncyBzYWZlIG5vdCB0byBhcHBseSBzdHlsaW5nIHRvIHRoZSBlbGVtZW50LlxuICAgICAgICAgICAgY29uc3QgbmF0aXZlU3R5bGUgPSBuYXRpdmUuc3R5bGU7XG4gICAgICAgICAgICBpZiAobmF0aXZlU3R5bGUgIT0gbnVsbCkge1xuICAgICAgICAgICAgICBuYXRpdmVTdHlsZS5zZXRQcm9wZXJ0eShwcm9wLCB2YWx1ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJSZW1vdmVTdHlsZSsrO1xuXG4gICAgICAgICAgaWYgKGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSkge1xuICAgICAgICAgICAgcmVuZGVyZXIucmVtb3ZlU3R5bGUobmF0aXZlLCBwcm9wLCBSZW5kZXJlclN0eWxlRmxhZ3MzLkRhc2hDYXNlKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc3QgbmF0aXZlU3R5bGUgPSBuYXRpdmUuc3R5bGU7XG4gICAgICAgICAgICBpZiAobmF0aXZlU3R5bGUgIT0gbnVsbCkge1xuICAgICAgICAgICAgICBuYXRpdmVTdHlsZS5yZW1vdmVQcm9wZXJ0eShwcm9wKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9O1xuXG4vKipcbiAqIEFkZHMvcmVtb3ZlcyB0aGUgcHJvdmlkZWQgY2xhc3NOYW1lIHZhbHVlIHRvIHRoZSBwcm92aWRlZCBlbGVtZW50LlxuICovXG5leHBvcnQgY29uc3Qgc2V0Q2xhc3M6IEFwcGx5U3R5bGluZ0ZuID1cbiAgICAocmVuZGVyZXI6IFJlbmRlcmVyMyB8IG51bGwsIG5hdGl2ZTogUkVsZW1lbnQsIGNsYXNzTmFtZTogc3RyaW5nLCB2YWx1ZTogYW55KSA9PiB7XG4gICAgICBpZiAocmVuZGVyZXIgIT09IG51bGwgJiYgY2xhc3NOYW1lICE9PSAnJykge1xuICAgICAgICBpZiAodmFsdWUpIHtcbiAgICAgICAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyQWRkQ2xhc3MrKztcbiAgICAgICAgICBpZiAoaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpKSB7XG4gICAgICAgICAgICByZW5kZXJlci5hZGRDbGFzcyhuYXRpdmUsIGNsYXNzTmFtZSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIHRoZSByZWFzb24gd2h5IGNsYXNzTGlzdCBtYXkgYmUgYG51bGxgIGlzIGVpdGhlciBiZWNhdXNlXG4gICAgICAgICAgICAvLyBpdCdzIGEgY29udGFpbmVyIGVsZW1lbnQgb3IgaXQncyBhIHBhcnQgb2YgYSB0ZXN0XG4gICAgICAgICAgICAvLyBlbnZpcm9ubWVudCB0aGF0IGRvZXNuJ3QgaGF2ZSBzdHlsaW5nLiBJbiBlaXRoZXJcbiAgICAgICAgICAgIC8vIGNhc2UgaXQncyBzYWZlIG5vdCB0byBhcHBseSBzdHlsaW5nIHRvIHRoZSBlbGVtZW50LlxuICAgICAgICAgICAgY29uc3QgY2xhc3NMaXN0ID0gbmF0aXZlLmNsYXNzTGlzdDtcbiAgICAgICAgICAgIGlmIChjbGFzc0xpc3QgIT0gbnVsbCkge1xuICAgICAgICAgICAgICBjbGFzc0xpc3QuYWRkKGNsYXNzTmFtZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJSZW1vdmVDbGFzcysrO1xuICAgICAgICAgIGlmIChpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikpIHtcbiAgICAgICAgICAgIHJlbmRlcmVyLnJlbW92ZUNsYXNzKG5hdGl2ZSwgY2xhc3NOYW1lKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc3QgY2xhc3NMaXN0ID0gbmF0aXZlLmNsYXNzTGlzdDtcbiAgICAgICAgICAgIGlmIChjbGFzc0xpc3QgIT0gbnVsbCkge1xuICAgICAgICAgICAgICBjbGFzc0xpc3QucmVtb3ZlKGNsYXNzTmFtZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfTtcblxuZXhwb3J0IGNvbnN0IHNldENsYXNzTmFtZSA9IChyZW5kZXJlcjogUmVuZGVyZXIzIHwgbnVsbCwgbmF0aXZlOiBSRWxlbWVudCwgY2xhc3NOYW1lOiBzdHJpbmcpID0+IHtcbiAgaWYgKHJlbmRlcmVyICE9PSBudWxsKSB7XG4gICAgaWYgKGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSkge1xuICAgICAgcmVuZGVyZXIuc2V0QXR0cmlidXRlKG5hdGl2ZSwgJ2NsYXNzJywgY2xhc3NOYW1lKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbmF0aXZlLmNsYXNzTmFtZSA9IGNsYXNzTmFtZTtcbiAgICB9XG4gIH1cbn07XG5cbmV4cG9ydCBjb25zdCBzZXRTdHlsZUF0dHIgPSAocmVuZGVyZXI6IFJlbmRlcmVyMyB8IG51bGwsIG5hdGl2ZTogUkVsZW1lbnQsIHZhbHVlOiBzdHJpbmcpID0+IHtcbiAgaWYgKHJlbmRlcmVyICE9PSBudWxsKSB7XG4gICAgaWYgKGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSkge1xuICAgICAgcmVuZGVyZXIuc2V0QXR0cmlidXRlKG5hdGl2ZSwgJ3N0eWxlJywgdmFsdWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICBuYXRpdmUuc2V0QXR0cmlidXRlKCdzdHlsZScsIHZhbHVlKTtcbiAgICB9XG4gIH1cbn07XG5cbi8qKlxuICogSXRlcmF0ZXMgb3ZlciBhbGwgcHJvdmlkZWQgc3R5bGluZyBlbnRyaWVzIGFuZCByZW5kZXJzIHRoZW0gb24gdGhlIGVsZW1lbnQuXG4gKlxuICogVGhpcyBmdW5jdGlvbiBpcyB1c2VkIGFsb25nc2lkZSBhIGBTdHlsaW5nTWFwQXJyYXlgIGVudHJ5LiBUaGlzIGVudHJ5IGlzIG5vdFxuICogdGhlIHNhbWUgYXMgdGhlIGBUU3R5bGluZ0NvbnRleHRgIGFuZCBpcyBvbmx5IHJlYWxseSB1c2VkIHdoZW4gYW4gZWxlbWVudCBjb250YWluc1xuICogaW5pdGlhbCBzdHlsaW5nIHZhbHVlcyAoZS5nLiBgPGRpdiBzdHlsZT1cIndpZHRoOjIwMHB4XCI+YCksIGJ1dCBubyBzdHlsZS9jbGFzcyBiaW5kaW5nc1xuICogYXJlIHByZXNlbnQuIElmIGFuZCB3aGVuIHRoYXQgaGFwcGVucyB0aGVuIHRoaXMgZnVuY3Rpb24gd2lsbCBiZSBjYWxsZWQgdG8gcmVuZGVyIGFsbFxuICogaW5pdGlhbCBzdHlsaW5nIHZhbHVlcyBvbiBhbiBlbGVtZW50LlxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVuZGVyU3R5bGluZ01hcChcbiAgICByZW5kZXJlcjogUmVuZGVyZXIzLCBlbGVtZW50OiBSRWxlbWVudCwgc3R5bGluZ1ZhbHVlczogVFN0eWxpbmdDb250ZXh0IHwgU3R5bGluZ01hcEFycmF5IHwgbnVsbCxcbiAgICBpc0NsYXNzQmFzZWQ6IGJvb2xlYW4pOiB2b2lkIHtcbiAgY29uc3Qgc3R5bGluZ01hcEFyciA9IGdldFN0eWxpbmdNYXBBcnJheShzdHlsaW5nVmFsdWVzKTtcbiAgaWYgKHN0eWxpbmdNYXBBcnIpIHtcbiAgICBmb3IgKGxldCBpID0gU3R5bGluZ01hcEFycmF5SW5kZXguVmFsdWVzU3RhcnRQb3NpdGlvbjsgaSA8IHN0eWxpbmdNYXBBcnIubGVuZ3RoO1xuICAgICAgICAgaSArPSBTdHlsaW5nTWFwQXJyYXlJbmRleC5UdXBsZVNpemUpIHtcbiAgICAgIGNvbnN0IHByb3AgPSBnZXRNYXBQcm9wKHN0eWxpbmdNYXBBcnIsIGkpO1xuICAgICAgY29uc3QgdmFsdWUgPSBnZXRNYXBWYWx1ZShzdHlsaW5nTWFwQXJyLCBpKTtcbiAgICAgIGlmIChpc0NsYXNzQmFzZWQpIHtcbiAgICAgICAgc2V0Q2xhc3MocmVuZGVyZXIsIGVsZW1lbnQsIHByb3AsIHZhbHVlLCBudWxsKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHNldFN0eWxlKHJlbmRlcmVyLCBlbGVtZW50LCBwcm9wLCB2YWx1ZSwgbnVsbCk7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIG9iamVjdFRvQ2xhc3NOYW1lKG9iajoge1trZXk6IHN0cmluZ106IGFueX0gfCBudWxsKTogc3RyaW5nIHtcbiAgbGV0IHN0ciA9ICcnO1xuICBpZiAob2JqKSB7XG4gICAgZm9yIChsZXQga2V5IGluIG9iaikge1xuICAgICAgY29uc3QgdmFsdWUgPSBvYmpba2V5XTtcbiAgICAgIGlmICh2YWx1ZSkge1xuICAgICAgICBzdHIgKz0gKHN0ci5sZW5ndGggPyAnICcgOiAnJykgKyBrZXk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiBzdHI7XG59XG5cbi8qKlxuICogRGV0ZXJtaW5lcyB3aGV0aGVyIG9yIG5vdCBhbiBlbGVtZW50IHN0eWxlL2NsYXNzTmFtZSB2YWx1ZSBoYXMgY2hhbmdlZCBzaW5jZSB0aGUgbGFzdCB1cGRhdGUuXG4gKlxuICogVGhpcyBmdW5jdGlvbiBoZWxwcyBBbmd1bGFyIGRldGVybWluZSBpZiBhIHN0eWxlIG9yIGNsYXNzIGF0dHJpYnV0ZSB2YWx1ZSB3YXNcbiAqIG1vZGlmaWVkIGJ5IGFuIGV4dGVybmFsIHBsdWdpbiBvciBBUEkgb3V0c2lkZSBvZiB0aGUgc3R5bGUgYmluZGluZyBjb2RlLiBUaGlzXG4gKiBtZWFucyBhbnkgSlMgY29kZSB0aGF0IGFkZHMvcmVtb3ZlcyBjbGFzcy9zdHlsZSB2YWx1ZXMgb24gYW4gZWxlbWVudCBvdXRzaWRlXG4gKiBvZiBBbmd1bGFyJ3Mgc3R5bGluZyBiaW5kaW5nIGFsZ29yaXRobS5cbiAqXG4gKiBAcmV0dXJucyB0cnVlIHdoZW4gdGhlIHZhbHVlIHdhcyBtb2RpZmllZCBleHRlcm5hbGx5LlxuICovXG5mdW5jdGlvbiBjaGVja0lmRXh0ZXJuYWxseU1vZGlmaWVkKGVsZW1lbnQ6IEhUTUxFbGVtZW50LCBjYWNoZWRWYWx1ZTogYW55LCBpc0NsYXNzQmFzZWQ6IGJvb2xlYW4pIHtcbiAgLy8gdGhpcyBtZWFucyBpdCB3YXMgY2hlY2tlZCBiZWZvcmUgYW5kIHRoZXJlIGlzIG5vIHJlYXNvblxuICAvLyB0byBjb21wYXJlIHRoZSBzdHlsZS9jbGFzcyB2YWx1ZXMgYWdhaW4uIEVpdGhlciB0aGF0IG9yXG4gIC8vIHdlYiB3b3JrZXJzIGFyZSBiZWluZyB1c2VkLlxuICBpZiAoZ2xvYmFsLk5vZGUgPT09ICd1bmRlZmluZWQnIHx8IGNhY2hlZFZhbHVlID09PSBWQUxVRV9JU19FWFRFUk5BTExZX01PRElGSUVEKSByZXR1cm4gdHJ1ZTtcblxuICAvLyBjb21wYXJpbmcgdGhlIERPTSB2YWx1ZSBhZ2FpbnN0IHRoZSBjYWNoZWQgdmFsdWUgaXMgdGhlIGJlc3Qgd2F5IHRvXG4gIC8vIHNlZSBpZiBzb21ldGhpbmcgaGFzIGNoYW5nZWQuXG4gIGNvbnN0IGN1cnJlbnRWYWx1ZSA9XG4gICAgICAoaXNDbGFzc0Jhc2VkID8gZWxlbWVudC5jbGFzc05hbWUgOiAoZWxlbWVudC5zdHlsZSAmJiBlbGVtZW50LnN0eWxlLmNzc1RleHQpKSB8fCAnJztcbiAgcmV0dXJuIGN1cnJlbnRWYWx1ZSAhPT0gKGNhY2hlZFZhbHVlIHx8ICcnKTtcbn1cblxuLyoqXG4gKiBSZW1vdmVzIHByb3ZpZGVkIHN0eWxpbmcgdmFsdWVzIGZyb20gdGhlIGVsZW1lbnRcbiAqL1xuZnVuY3Rpb24gcmVtb3ZlU3R5bGluZ1ZhbHVlcyhcbiAgICByZW5kZXJlcjogYW55LCBlbGVtZW50OiBSRWxlbWVudCwgdmFsdWVzOiBzdHJpbmcgfCB7W2tleTogc3RyaW5nXTogYW55fSB8IFN0eWxpbmdNYXBBcnJheSxcbiAgICBpc0NsYXNzQmFzZWQ6IGJvb2xlYW4pIHtcbiAgbGV0IGFycjogU3R5bGluZ01hcEFycmF5O1xuICBpZiAoaXNTdHlsaW5nTWFwQXJyYXkodmFsdWVzKSkge1xuICAgIGFyciA9IHZhbHVlcyBhcyBTdHlsaW5nTWFwQXJyYXk7XG4gIH0gZWxzZSB7XG4gICAgYXJyID0gbm9ybWFsaXplSW50b1N0eWxpbmdNYXAobnVsbCwgdmFsdWVzLCAhaXNDbGFzc0Jhc2VkKTtcbiAgfVxuXG4gIGNvbnN0IGFwcGx5Rm4gPSBpc0NsYXNzQmFzZWQgPyBzZXRDbGFzcyA6IHNldFN0eWxlO1xuICBmb3IgKGxldCBpID0gU3R5bGluZ01hcEFycmF5SW5kZXguVmFsdWVzU3RhcnRQb3NpdGlvbjsgaSA8IGFyci5sZW5ndGg7XG4gICAgICAgaSArPSBTdHlsaW5nTWFwQXJyYXlJbmRleC5UdXBsZVNpemUpIHtcbiAgICBjb25zdCB2YWx1ZSA9IGdldE1hcFZhbHVlKGFyciwgaSk7XG4gICAgaWYgKHZhbHVlKSB7XG4gICAgICBjb25zdCBwcm9wID0gZ2V0TWFwUHJvcChhcnIsIGkpO1xuICAgICAgYXBwbHlGbihyZW5kZXJlciwgZWxlbWVudCwgcHJvcCwgZmFsc2UpO1xuICAgIH1cbiAgfVxufVxuIl19