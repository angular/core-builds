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
import { DEFAULT_BINDING_INDEX, DEFAULT_BINDING_VALUE, DEFAULT_GUARD_MASK_VALUE, MAP_BASED_ENTRY_PROP_NAME, TEMPLATE_DIRECTIVE_INDEX, concatString, forceStylesAsString, getBindingValue, getDefaultValue, getGuardMask, getInitialStylingValue, getMapProp, getMapValue, getProp, getPropValuesStartPosition, getStylingMapArray, getTotalSources, getValue, getValuesCount, hasConfig, hasValueChanged, isHostStylingActive, isSanitizationRequired, isStylingMapArray, isStylingValueDefined, normalizeIntoStylingMap, patchConfig, setDefaultValue, setGuardMask, setMapAsDirty, setValue } from '../util/styling_utils';
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
 * @param {?} tNode
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
export function updateClassViaContext(context, tNode, data, element, directiveIndex, prop, bindingIndex, value, forceUpdate, firstUpdatePass) {
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
        const updated = updateBindingData(context, tNode, data, countIndex, state.sourceIndex, prop, bindingIndex, value, forceUpdate, false, firstUpdatePass, true);
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
 * @param {?} tNode
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
export function updateStyleViaContext(context, tNode, data, element, directiveIndex, prop, bindingIndex, value, sanitizer, forceUpdate, firstUpdatePass) {
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
        const updated = updateBindingData(context, tNode, data, countIndex, state.sourceIndex, prop, bindingIndex, value, forceUpdate, sanitizationRequired, firstUpdatePass, false);
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
 * @param {?} tNode
 * @param {?} data
 * @param {?} counterIndex
 * @param {?} sourceIndex
 * @param {?} prop
 * @param {?} bindingIndex
 * @param {?} value
 * @param {?} forceUpdate
 * @param {?} sanitizationRequired
 * @param {?} firstUpdatePass
 * @param {?} isClassBased
 * @return {?} whether or not the binding value was updated in the `LStylingData`.
 */
function updateBindingData(context, tNode, data, counterIndex, sourceIndex, prop, bindingIndex, value, forceUpdate, sanitizationRequired, firstUpdatePass, isClassBased) {
    /** @type {?} */
    const hostBindingsMode = isHostStylingActive(sourceIndex);
    /** @type {?} */
    const hostBindingsFlag = isClassBased ? 4096 /* hasHostClassBindings */ : 131072 /* hasHostStyleBindings */;
    if (firstUpdatePass) {
        // this will only happen during the first update pass of the
        // context. The reason why we can't use `tView.firstCreatePass`
        // here is because its not guaranteed to be true when the first
        // update pass is executed (remember that all styling instructions
        // are run in the update phase, and, as a result, are no more
        // styling instructions that are run in the creation phase).
        registerBinding(context, tNode, counterIndex, sourceIndex, prop, bindingIndex, sanitizationRequired, isClassBased);
    }
    /** @type {?} */
    const changed = forceUpdate || hasValueChanged(data[bindingIndex], value);
    if (changed) {
        setValue(data, bindingIndex, value);
        /** @type {?} */
        const doSetValuesAsStale = hasConfig(tNode, hostBindingsFlag) && !hostBindingsMode && (prop ? !value : true);
        if (doSetValuesAsStale) {
            renderHostBindingsAsStale(context, tNode, data, prop, isClassBased);
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
 * @param {?} tNode
 * @param {?} data
 * @param {?} prop
 * @param {?} isClassBased
 * @return {?}
 */
function renderHostBindingsAsStale(context, tNode, data, prop, isClassBased) {
    /** @type {?} */
    const valuesCount = getValuesCount(context);
    /** @type {?} */
    const hostBindingsFlag = isClassBased ? 4096 /* hasHostClassBindings */ : 131072 /* hasHostStyleBindings */;
    if (prop !== null && hasConfig(tNode, hostBindingsFlag)) {
        /** @type {?} */
        const itemsPerRow = 4 /* BindingsStartOffset */ + valuesCount;
        /** @type {?} */
        let i = 2 /* ValuesStartPosition */;
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
    /** @type {?} */
    const mapBindingsFlag = isClassBased ? 512 /* hasClassMapBindings */ : 16384 /* hasStyleMapBindings */;
    if (hasConfig(tNode, mapBindingsFlag)) {
        /** @type {?} */
        const bindingsStart = 2 /* ValuesStartPosition */ + 4 /* BindingsStartOffset */;
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
 * @param {?} tNode
 * @param {?} countId
 * @param {?} sourceIndex
 * @param {?} prop
 * @param {?} bindingValue
 * @param {?} sanitizationRequired
 * @param {?} isClassBased
 * @return {?}
 */
export function registerBinding(context, tNode, countId, sourceIndex, prop, bindingValue, sanitizationRequired, isClassBased) {
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
    const collisionFlag = isClassBased ? 8192 /* hasDuplicateClassBindings */ : 262144 /* hasDuplicateStyleBindings */;
    /** @type {?} */
    const isBindingIndexValue = typeof bindingValue === 'number';
    /** @type {?} */
    const entriesPerRow = 4 /* BindingsStartOffset */ + getValuesCount(context);
    /** @type {?} */
    let i = 2 /* ValuesStartPosition */;
    // all style/class bindings are sorted by property name
    while (i < context.length) {
        /** @type {?} */
        const p = getProp(context, i);
        if (prop <= p) {
            if (prop < p) {
                allocateNewContextEntry(context, i, prop, sanitizationRequired);
            }
            else if (isBindingIndexValue) {
                patchConfig(tNode, collisionFlag);
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
    let index = 2 /* ValuesStartPosition */;
    while (index < context.length) {
        index += insertOffset;
        context.splice(index++, 0, DEFAULT_BINDING_INDEX);
        // the value was inserted just before the default value, but the
        // next entry in the context starts just after it. Therefore++.
        index++;
    }
    context[0 /* TotalSourcesPosition */]++;
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
 * @param {?} tNode
 * @param {?} classesContext
 * @param {?} stylesContext
 * @param {?} element
 * @param {?} directiveIndex
 * @param {?} styleSanitizer
 * @param {?} firstUpdatePass
 * @return {?}
 */
export function flushStyling(renderer, data, tNode, classesContext, stylesContext, element, directiveIndex, styleSanitizer, firstUpdatePass) {
    ngDevMode && ngDevMode.flushStyling++;
    /** @type {?} */
    const state = getStylingState(element, directiveIndex);
    /** @type {?} */
    const hostBindingsMode = isHostStylingActive(state.sourceIndex);
    if (stylesContext) {
        firstUpdatePass && syncContextInitialStyling(stylesContext, tNode, false);
        if (state.stylesBitMask !== 0) {
            applyStylingViaContext(stylesContext, tNode, renderer, element, data, state.stylesBitMask, setStyle, styleSanitizer, hostBindingsMode, false);
        }
    }
    if (classesContext) {
        firstUpdatePass && syncContextInitialStyling(classesContext, tNode, true);
        if (state.classesBitMask !== 0) {
            applyStylingViaContext(classesContext, tNode, renderer, element, data, state.classesBitMask, setClass, null, hostBindingsMode, true);
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
 * @param {?} tNode
 * @param {?} isClassBased
 * @return {?}
 */
function syncContextInitialStyling(context, tNode, isClassBased) {
    // the TStylingContext always has initial style/class values which are
    // stored in styling array format.
    updateInitialStylingOnContext(context, tNode, (/** @type {?} */ (getStylingMapArray(context))), isClassBased);
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
 * @param {?} tNode
 * @param {?} initialStyling
 * @param {?} isClassBased
 * @return {?}
 */
function updateInitialStylingOnContext(context, tNode, initialStyling, isClassBased) {
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
            registerBinding(context, tNode, COUNT_ID_FOR_STYLING, 0, prop, value, false, isClassBased);
            hasInitialStyling = true;
        }
    }
    if (hasInitialStyling) {
        patchConfig(tNode, 256 /* hasInitialStyling */);
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
 * @param {?} tNode
 * @param {?} renderer
 * @param {?} element
 * @param {?} bindingData
 * @param {?} bitMaskValue
 * @param {?} applyStylingFn
 * @param {?} sanitizer
 * @param {?} hostBindingsMode
 * @param {?} isClassBased
 * @return {?}
 */
export function applyStylingViaContext(context, tNode, renderer, element, bindingData, bitMaskValue, applyStylingFn, sanitizer, hostBindingsMode, isClassBased) {
    /** @type {?} */
    const bitMask = normalizeBitMaskValue(bitMaskValue);
    /** @type {?} */
    let stylingMapsSyncFn = null;
    /** @type {?} */
    let applyAllValues = false;
    /** @type {?} */
    const mapBindingsFlag = isClassBased ? 512 /* hasClassMapBindings */ : 16384 /* hasStyleMapBindings */;
    if (hasConfig(tNode, mapBindingsFlag)) {
        stylingMapsSyncFn = getStylingMapsSyncFn();
        /** @type {?} */
        const mapsGuardMask = getGuardMask(context, 2 /* ValuesStartPosition */, hostBindingsMode);
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
    let i = getPropValuesStartPosition(context, tNode, isClassBased);
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
 * @param {?} tNode
 * @param {?} element
 * @param {?} data
 * @param {?} bindingIndex
 * @param {?} value
 * @param {?} isClassBased
 * @param {?} sanitizer
 * @param {?} forceUpdate
 * @param {?} bindingValueContainsInitial
 * @return {?} whether or not the styling map was applied to the element.
 */
export function applyStylingMapDirectly(renderer, context, tNode, element, data, bindingIndex, value, isClassBased, sanitizer, forceUpdate, bindingValueContainsInitial) {
    /** @type {?} */
    const oldValue = getValue(data, bindingIndex);
    if (forceUpdate || hasValueChanged(oldValue, value)) {
        /** @type {?} */
        const hasInitial = hasConfig(tNode, 256 /* hasInitialStyling */);
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
        const propBindingsFlag = isClassBased ? 1024 /* hasClassPropBindings */ : 32768 /* hasStylePropBindings */;
        /** @type {?} */
        let writeToAttrDirectly = !hasConfig(tNode, propBindingsFlag);
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
 * @param {?} tNode
 * @param {?} element
 * @param {?} data
 * @param {?} bindingIndex
 * @param {?} prop
 * @param {?} value
 * @param {?} isClassBased
 * @param {?=} sanitizer
 * @return {?} whether or not the prop/value styling was applied to the element.
 */
export function applyStylingValueDirectly(renderer, context, tNode, element, data, bindingIndex, prop, value, isClassBased, sanitizer) {
    /** @type {?} */
    let applied = false;
    if (hasValueChanged(data[bindingIndex], value)) {
        setValue(data, bindingIndex, value);
        /** @type {?} */
        const applyFn = isClassBased ? setClass : setStyle;
        // case 1: apply the provided value (if it exists)
        applied = applyStylingValue(renderer, element, prop, value, applyFn, bindingIndex, sanitizer);
        // case 2: find the matching property in a styling map and apply the detected value
        /** @type {?} */
        const mapBindingsFlag = isClassBased ? 512 /* hasClassMapBindings */ : 16384 /* hasStyleMapBindings */;
        if (!applied && hasConfig(tNode, mapBindingsFlag)) {
            /** @type {?} */
            const state = getStylingState(element, TEMPLATE_DIRECTIVE_INDEX);
            /** @type {?} */
            const map = isClassBased ? state.lastDirectClassMap : state.lastDirectStyleMap;
            applied = map ?
                findAndApplyMapValue(renderer, element, applyFn, map, prop, bindingIndex, sanitizer) :
                false;
        }
        // case 3: apply the initial value (if it exists)
        if (!applied && hasConfig(tNode, 256 /* hasInitialStyling */)) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmluZGluZ3MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL3N0eWxpbmcvYmluZGluZ3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFPQSxPQUFPLEVBQVksZUFBZSxFQUFDLE1BQU0sMkJBQTJCLENBQUM7QUFFckUsT0FBTyxFQUFDLE1BQU0sRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBRXpDLE9BQU8sRUFBMkMsbUJBQW1CLEVBQUUsb0JBQW9CLEVBQUMsTUFBTSx3QkFBd0IsQ0FBQztBQUUzSCxPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sV0FBVyxDQUFDO0FBQ3BDLE9BQU8sRUFBQyxxQkFBcUIsRUFBRSxxQkFBcUIsRUFBRSx3QkFBd0IsRUFBRSx5QkFBeUIsRUFBRSx3QkFBd0IsRUFBRSxZQUFZLEVBQUUsbUJBQW1CLEVBQUUsZUFBZSxFQUFFLGVBQWUsRUFBRSxZQUFZLEVBQUUsc0JBQXNCLEVBQUUsVUFBVSxFQUFFLFdBQVcsRUFBRSxPQUFPLEVBQUUsMEJBQTBCLEVBQUUsa0JBQWtCLEVBQUUsZUFBZSxFQUFFLFFBQVEsRUFBRSxjQUFjLEVBQUUsU0FBUyxFQUFFLGVBQWUsRUFBRSxtQkFBbUIsRUFBRSxzQkFBc0IsRUFBRSxpQkFBaUIsRUFBRSxxQkFBcUIsRUFBRSx1QkFBdUIsRUFBRSxXQUFXLEVBQUUsZUFBZSxFQUFFLFlBQVksRUFBRSxhQUFhLEVBQUUsUUFBUSxFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFFM2xCLE9BQU8sRUFBQyxlQUFlLEVBQUUsaUJBQWlCLEVBQUMsTUFBTSxTQUFTLENBQUM7O01BRXJELDRCQUE0QixHQUFHLEVBQUU7Ozs7Ozs7TUEwQmpDLDZCQUE2QixHQUFHLENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFZdkMsTUFBTSxVQUFVLHFCQUFxQixDQUNqQyxPQUF3QixFQUFFLEtBQW1CLEVB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Ryx1QkFBdUIsQ0FBQyxJQUFJLEVBQUUsTUFBTSxFQUFFLENBQUMsWUFBWSxDQUFDLENBQUM7S0FDNUQ7O1VBRUssT0FBTyxHQUFHLFlBQVksQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxRQUFRO0lBQ2xELEtBQUssSUFBSSxDQUFDLDhCQUEyQyxFQUFFLENBQUMsR0FBRyxHQUFHLENBQUMsTUFBTSxFQUNoRSxDQUFDLHFCQUFrQyxFQUFFOztjQUNsQyxLQUFLLEdBQUcsV0FBVyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUM7UUFDakMsSUFBSSxLQUFLLEVBQUU7O2tCQUNILElBQUksR0FBRyxVQUFVLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQztZQUMvQixPQUFPLENBQUMsUUFBUSxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUM7U0FDekM7S0FDRjtBQUNILENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiogQGxpY2Vuc2VcbiogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4qXG4qIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4qIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiovXG5pbXBvcnQge1NhZmVWYWx1ZSwgdW53cmFwU2FmZVZhbHVlfSBmcm9tICcuLi8uLi9zYW5pdGl6YXRpb24vYnlwYXNzJztcbmltcG9ydCB7U3R5bGVTYW5pdGl6ZUZuLCBTdHlsZVNhbml0aXplTW9kZX0gZnJvbSAnLi4vLi4vc2FuaXRpemF0aW9uL3N0eWxlX3Nhbml0aXplcic7XG5pbXBvcnQge2dsb2JhbH0gZnJvbSAnLi4vLi4vdXRpbC9nbG9iYWwnO1xuaW1wb3J0IHtUTm9kZUZsYWdzfSBmcm9tICcuLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtQcm9jZWR1cmFsUmVuZGVyZXIzLCBSRWxlbWVudCwgUmVuZGVyZXIzLCBSZW5kZXJlclN0eWxlRmxhZ3MzLCBpc1Byb2NlZHVyYWxSZW5kZXJlcn0gZnJvbSAnLi4vaW50ZXJmYWNlcy9yZW5kZXJlcic7XG5pbXBvcnQge0FwcGx5U3R5bGluZ0ZuLCBMU3R5bGluZ0RhdGEsIFN0eWxpbmdNYXBBcnJheSwgU3R5bGluZ01hcEFycmF5SW5kZXgsIFN0eWxpbmdNYXBzU3luY01vZGUsIFN5bmNTdHlsaW5nTWFwc0ZuLCBUU3R5bGluZ0NvbnRleHQsIFRTdHlsaW5nQ29udGV4dEluZGV4LCBUU3R5bGluZ0NvbnRleHRQcm9wQ29uZmlnRmxhZ3MsIFRTdHlsaW5nTm9kZX0gZnJvbSAnLi4vaW50ZXJmYWNlcy9zdHlsaW5nJztcbmltcG9ydCB7Tk9fQ0hBTkdFfSBmcm9tICcuLi90b2tlbnMnO1xuaW1wb3J0IHtERUZBVUxUX0JJTkRJTkdfSU5ERVgsIERFRkFVTFRfQklORElOR19WQUxVRSwgREVGQVVMVF9HVUFSRF9NQVNLX1ZBTFVFLCBNQVBfQkFTRURfRU5UUllfUFJPUF9OQU1FLCBURU1QTEFURV9ESVJFQ1RJVkVfSU5ERVgsIGNvbmNhdFN0cmluZywgZm9yY2VTdHlsZXNBc1N0cmluZywgZ2V0QmluZGluZ1ZhbHVlLCBnZXREZWZhdWx0VmFsdWUsIGdldEd1YXJkTWFzaywgZ2V0SW5pdGlhbFN0eWxpbmdWYWx1ZSwgZ2V0TWFwUHJvcCwgZ2V0TWFwVmFsdWUsIGdldFByb3AsIGdldFByb3BWYWx1ZXNTdGFydFBvc2l0aW9uLCBnZXRTdHlsaW5nTWFwQXJyYXksIGdldFRvdGFsU291cmNlcywgZ2V0VmFsdWUsIGdldFZhbHVlc0NvdW50LCBoYXNDb25maWcsIGhhc1ZhbHVlQ2hhbmdlZCwgaXNIb3N0U3R5bGluZ0FjdGl2ZSwgaXNTYW5pdGl6YXRpb25SZXF1aXJlZCwgaXNTdHlsaW5nTWFwQXJyYXksIGlzU3R5bGluZ1ZhbHVlRGVmaW5lZCwgbm9ybWFsaXplSW50b1N0eWxpbmdNYXAsIHBhdGNoQ29uZmlnLCBzZXREZWZhdWx0VmFsdWUsIHNldEd1YXJkTWFzaywgc2V0TWFwQXNEaXJ0eSwgc2V0VmFsdWV9IGZyb20gJy4uL3V0aWwvc3R5bGluZ191dGlscyc7XG5cbmltcG9ydCB7Z2V0U3R5bGluZ1N0YXRlLCByZXNldFN0eWxpbmdTdGF0ZX0gZnJvbSAnLi9zdGF0ZSc7XG5cbmNvbnN0IFZBTFVFX0lTX0VYVEVSTkFMTFlfTU9ESUZJRUQgPSB7fTtcblxuLyoqXG4gKiAtLS0tLS0tLVxuICpcbiAqIFRoaXMgZmlsZSBjb250YWlucyB0aGUgY29yZSBsb2dpYyBmb3Igc3R5bGluZyBpbiBBbmd1bGFyLlxuICpcbiAqIEFsbCBzdHlsaW5nIGJpbmRpbmdzIChpLmUuIGBbc3R5bGVdYCwgYFtzdHlsZS5wcm9wXWAsIGBbY2xhc3NdYCBhbmQgYFtjbGFzcy5uYW1lXWApXG4gKiB3aWxsIGhhdmUgdGhlaXIgdmFsdWVzIGJlIGFwcGxpZWQgdGhyb3VnaCB0aGUgbG9naWMgaW4gdGhpcyBmaWxlLlxuICpcbiAqIFdoZW4gYSBiaW5kaW5nIGlzIGVuY291bnRlcmVkIChlLmcuIGA8ZGl2IFtzdHlsZS53aWR0aF09XCJ3XCI+YCkgdGhlblxuICogdGhlIGJpbmRpbmcgZGF0YSB3aWxsIGJlIHBvcHVsYXRlZCBpbnRvIGEgYFRTdHlsaW5nQ29udGV4dGAgZGF0YS1zdHJ1Y3R1cmUuXG4gKiBUaGVyZSBpcyBvbmx5IG9uZSBgVFN0eWxpbmdDb250ZXh0YCBwZXIgYFRTdHlsaW5nTm9kZWAgYW5kIGVhY2ggZWxlbWVudCBpbnN0YW5jZVxuICogd2lsbCB1cGRhdGUgaXRzIHN0eWxlL2NsYXNzIGJpbmRpbmcgdmFsdWVzIGluIGNvbmNlcnQgd2l0aCB0aGUgc3R5bGluZ1xuICogY29udGV4dC5cbiAqXG4gKiBUbyBsZWFybiBtb3JlIGFib3V0IHRoZSBhbGdvcml0aG0gc2VlIGBUU3R5bGluZ0NvbnRleHRgLlxuICpcbiAqIC0tLS0tLS0tXG4gKi9cblxuLyoqXG4gKiBUaGUgZ3VhcmQvdXBkYXRlIG1hc2sgYml0IGluZGV4IGxvY2F0aW9uIGZvciBtYXAtYmFzZWQgYmluZGluZ3MuXG4gKlxuICogQWxsIG1hcC1iYXNlZCBiaW5kaW5ncyAoaS5lLiBgW3N0eWxlXWAgYW5kIGBbY2xhc3NdYCApXG4gKi9cbmNvbnN0IFNUWUxJTkdfSU5ERVhfRk9SX01BUF9CSU5ESU5HID0gMDtcblxuLyoqXG4gKiBWaXNpdHMgYSBjbGFzcy1iYXNlZCBiaW5kaW5nIGFuZCB1cGRhdGVzIHRoZSBuZXcgdmFsdWUgKGlmIGNoYW5nZWQpLlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gaXMgY2FsbGVkIGVhY2ggdGltZSBhIGNsYXNzLWJhc2VkIHN0eWxpbmcgaW5zdHJ1Y3Rpb25cbiAqIGlzIGV4ZWN1dGVkLiBJdCdzIGltcG9ydGFudCB0aGF0IGl0J3MgYWx3YXlzIGNhbGxlZCAoZXZlbiBpZiB0aGUgdmFsdWVcbiAqIGhhcyBub3QgY2hhbmdlZCkgc28gdGhhdCB0aGUgaW5uZXIgY291bnRlciBpbmRleCB2YWx1ZSBpcyBpbmNyZW1lbnRlZC5cbiAqIFRoaXMgd2F5LCBlYWNoIGluc3RydWN0aW9uIGlzIGFsd2F5cyBndWFyYW50ZWVkIHRvIGdldCB0aGUgc2FtZSBjb3VudGVyXG4gKiBzdGF0ZSBlYWNoIHRpbWUgaXQncyBjYWxsZWQgKHdoaWNoIHRoZW4gYWxsb3dzIHRoZSBgVFN0eWxpbmdDb250ZXh0YFxuICogYW5kIHRoZSBiaXQgbWFzayB2YWx1ZXMgdG8gYmUgaW4gc3luYykuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB1cGRhdGVDbGFzc1ZpYUNvbnRleHQoXG4gICAgY29udGV4dDogVFN0eWxpbmdDb250ZXh0LCB0Tm9kZTogVFN0eWxpbmdOb2RlLCBkYXRhOiBMU3R5bGluZ0RhdGEsIGVsZW1lbnQ6IFJFbGVtZW50LFxuICAgIGRpcmVjdGl2ZUluZGV4OiBudW1iZXIsIHByb3A6IHN0cmluZyB8IG51bGwsIGJpbmRpbmdJbmRleDogbnVtYmVyLFxuICAgIHZhbHVlOiBib29sZWFuIHwgc3RyaW5nIHwgbnVsbCB8IHVuZGVmaW5lZCB8IFN0eWxpbmdNYXBBcnJheSB8IE5PX0NIQU5HRSwgZm9yY2VVcGRhdGU6IGJvb2xlYW4sXG4gICAgZmlyc3RVcGRhdGVQYXNzOiBib29sZWFuKTogYm9vbGVhbiB7XG4gIGNvbnN0IGlzTWFwQmFzZWQgPSAhcHJvcDtcbiAgY29uc3Qgc3RhdGUgPSBnZXRTdHlsaW5nU3RhdGUoZWxlbWVudCwgZGlyZWN0aXZlSW5kZXgpO1xuICBjb25zdCBjb3VudEluZGV4ID0gaXNNYXBCYXNlZCA/IFNUWUxJTkdfSU5ERVhfRk9SX01BUF9CSU5ESU5HIDogc3RhdGUuY2xhc3Nlc0luZGV4Kys7XG5cbiAgLy8gZXZlbiBpZiB0aGUgaW5pdGlhbCB2YWx1ZSBpcyBhIGBOT19DSEFOR0VgIHZhbHVlIChlLmcuIGludGVycG9sYXRpb24gb3IgW25nQ2xhc3NdKVxuICAvLyB0aGVuIHdlIHN0aWxsIG5lZWQgdG8gcmVnaXN0ZXIgdGhlIGJpbmRpbmcgd2l0aGluIHRoZSBjb250ZXh0IHNvIHRoYXQgdGhlIGNvbnRleHRcbiAgLy8gaXMgYXdhcmUgb2YgdGhlIGJpbmRpbmcgZXZlbiBpZiB0aGluZ3MgY2hhbmdlIGFmdGVyIHRoZSBmaXJzdCB1cGRhdGUgcGFzcy5cbiAgaWYgKGZpcnN0VXBkYXRlUGFzcyB8fCB2YWx1ZSAhPT0gTk9fQ0hBTkdFKSB7XG4gICAgY29uc3QgdXBkYXRlZCA9IHVwZGF0ZUJpbmRpbmdEYXRhKFxuICAgICAgICBjb250ZXh0LCB0Tm9kZSwgZGF0YSwgY291bnRJbmRleCwgc3RhdGUuc291cmNlSW5kZXgsIHByb3AsIGJpbmRpbmdJbmRleCwgdmFsdWUsIGZvcmNlVXBkYXRlLFxuICAgICAgICBmYWxzZSwgZmlyc3RVcGRhdGVQYXNzLCB0cnVlKTtcbiAgICBpZiAodXBkYXRlZCB8fCBmb3JjZVVwZGF0ZSkge1xuICAgICAgLy8gV2UgZmxpcCB0aGUgYml0IGluIHRoZSBiaXRNYXNrIHRvIHJlZmxlY3QgdGhhdCB0aGUgYmluZGluZ1xuICAgICAgLy8gYXQgdGhlIGBpbmRleGAgc2xvdCBoYXMgY2hhbmdlZC4gVGhpcyBpZGVudGlmaWVzIHRvIHRoZSBmbHVzaGluZ1xuICAgICAgLy8gcGhhc2UgdGhhdCB0aGUgYmluZGluZ3MgZm9yIHRoaXMgcGFydGljdWxhciBDU1MgY2xhc3MgbmVlZCB0byBiZVxuICAgICAgLy8gYXBwbGllZCBhZ2FpbiBiZWNhdXNlIG9uIG9yIG1vcmUgb2YgdGhlIGJpbmRpbmdzIGZvciB0aGUgQ1NTXG4gICAgICAvLyBjbGFzcyBoYXZlIGNoYW5nZWQuXG4gICAgICBzdGF0ZS5jbGFzc2VzQml0TWFzayB8PSAxIDw8IGNvdW50SW5kZXg7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG4vKipcbiAqIFZpc2l0cyBhIHN0eWxlLWJhc2VkIGJpbmRpbmcgYW5kIHVwZGF0ZXMgdGhlIG5ldyB2YWx1ZSAoaWYgY2hhbmdlZCkuXG4gKlxuICogVGhpcyBmdW5jdGlvbiBpcyBjYWxsZWQgZWFjaCB0aW1lIGEgc3R5bGUtYmFzZWQgc3R5bGluZyBpbnN0cnVjdGlvblxuICogaXMgZXhlY3V0ZWQuIEl0J3MgaW1wb3J0YW50IHRoYXQgaXQncyBhbHdheXMgY2FsbGVkIChldmVuIGlmIHRoZSB2YWx1ZVxuICogaGFzIG5vdCBjaGFuZ2VkKSBzbyB0aGF0IHRoZSBpbm5lciBjb3VudGVyIGluZGV4IHZhbHVlIGlzIGluY3JlbWVudGVkLlxuICogVGhpcyB3YXksIGVhY2ggaW5zdHJ1Y3Rpb24gaXMgYWx3YXlzIGd1YXJhbnRlZWQgdG8gZ2V0IHRoZSBzYW1lIGNvdW50ZXJcbiAqIHN0YXRlIGVhY2ggdGltZSBpdCdzIGNhbGxlZCAod2hpY2ggdGhlbiBhbGxvd3MgdGhlIGBUU3R5bGluZ0NvbnRleHRgXG4gKiBhbmQgdGhlIGJpdCBtYXNrIHZhbHVlcyB0byBiZSBpbiBzeW5jKS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHVwZGF0ZVN0eWxlVmlhQ29udGV4dChcbiAgICBjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQsIHROb2RlOiBUU3R5bGluZ05vZGUsIGRhdGE6IExTdHlsaW5nRGF0YSwgZWxlbWVudDogUkVsZW1lbnQsXG4gICAgZGlyZWN0aXZlSW5kZXg6IG51bWJlciwgcHJvcDogc3RyaW5nIHwgbnVsbCwgYmluZGluZ0luZGV4OiBudW1iZXIsXG4gICAgdmFsdWU6IHN0cmluZyB8IG51bWJlciB8IFNhZmVWYWx1ZSB8IG51bGwgfCB1bmRlZmluZWQgfCBTdHlsaW5nTWFwQXJyYXkgfCBOT19DSEFOR0UsXG4gICAgc2FuaXRpemVyOiBTdHlsZVNhbml0aXplRm4gfCBudWxsLCBmb3JjZVVwZGF0ZTogYm9vbGVhbiwgZmlyc3RVcGRhdGVQYXNzOiBib29sZWFuKTogYm9vbGVhbiB7XG4gIGNvbnN0IGlzTWFwQmFzZWQgPSAhcHJvcDtcbiAgY29uc3Qgc3RhdGUgPSBnZXRTdHlsaW5nU3RhdGUoZWxlbWVudCwgZGlyZWN0aXZlSW5kZXgpO1xuICBjb25zdCBjb3VudEluZGV4ID0gaXNNYXBCYXNlZCA/IFNUWUxJTkdfSU5ERVhfRk9SX01BUF9CSU5ESU5HIDogc3RhdGUuc3R5bGVzSW5kZXgrKztcblxuICAvLyBldmVuIGlmIHRoZSBpbml0aWFsIHZhbHVlIGlzIGEgYE5PX0NIQU5HRWAgdmFsdWUgKGUuZy4gaW50ZXJwb2xhdGlvbiBvciBbbmdTdHlsZV0pXG4gIC8vIHRoZW4gd2Ugc3RpbGwgbmVlZCB0byByZWdpc3RlciB0aGUgYmluZGluZyB3aXRoaW4gdGhlIGNvbnRleHQgc28gdGhhdCB0aGUgY29udGV4dFxuICAvLyBpcyBhd2FyZSBvZiB0aGUgYmluZGluZyBldmVuIGlmIHRoaW5ncyBjaGFuZ2UgYWZ0ZXIgdGhlIGZpcnN0IHVwZGF0ZSBwYXNzLlxuICBpZiAoZmlyc3RVcGRhdGVQYXNzIHx8IHZhbHVlICE9PSBOT19DSEFOR0UpIHtcbiAgICBjb25zdCBzYW5pdGl6YXRpb25SZXF1aXJlZCA9IGlzTWFwQmFzZWQgP1xuICAgICAgICB0cnVlIDpcbiAgICAgICAgKHNhbml0aXplciA/IHNhbml0aXplcihwcm9wICEsIG51bGwsIFN0eWxlU2FuaXRpemVNb2RlLlZhbGlkYXRlUHJvcGVydHkpIDogZmFsc2UpO1xuICAgIGNvbnN0IHVwZGF0ZWQgPSB1cGRhdGVCaW5kaW5nRGF0YShcbiAgICAgICAgY29udGV4dCwgdE5vZGUsIGRhdGEsIGNvdW50SW5kZXgsIHN0YXRlLnNvdXJjZUluZGV4LCBwcm9wLCBiaW5kaW5nSW5kZXgsIHZhbHVlLCBmb3JjZVVwZGF0ZSxcbiAgICAgICAgc2FuaXRpemF0aW9uUmVxdWlyZWQsIGZpcnN0VXBkYXRlUGFzcywgZmFsc2UpO1xuICAgIGlmICh1cGRhdGVkIHx8IGZvcmNlVXBkYXRlKSB7XG4gICAgICAvLyBXZSBmbGlwIHRoZSBiaXQgaW4gdGhlIGJpdE1hc2sgdG8gcmVmbGVjdCB0aGF0IHRoZSBiaW5kaW5nXG4gICAgICAvLyBhdCB0aGUgYGluZGV4YCBzbG90IGhhcyBjaGFuZ2VkLiBUaGlzIGlkZW50aWZpZXMgdG8gdGhlIGZsdXNoaW5nXG4gICAgICAvLyBwaGFzZSB0aGF0IHRoZSBiaW5kaW5ncyBmb3IgdGhpcyBwYXJ0aWN1bGFyIHByb3BlcnR5IG5lZWQgdG8gYmVcbiAgICAgIC8vIGFwcGxpZWQgYWdhaW4gYmVjYXVzZSBvbiBvciBtb3JlIG9mIHRoZSBiaW5kaW5ncyBmb3IgdGhlIENTU1xuICAgICAgLy8gcHJvcGVydHkgaGF2ZSBjaGFuZ2VkLlxuICAgICAgc3RhdGUuc3R5bGVzQml0TWFzayB8PSAxIDw8IGNvdW50SW5kZXg7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG4vKipcbiAqIENhbGxlZCBlYWNoIHRpbWUgYSBiaW5kaW5nIHZhbHVlIGhhcyBjaGFuZ2VkIHdpdGhpbiB0aGUgcHJvdmlkZWQgYFRTdHlsaW5nQ29udGV4dGAuXG4gKlxuICogVGhpcyBmdW5jdGlvbiBpcyBkZXNpZ25lZCB0byBiZSBjYWxsZWQgZnJvbSBgdXBkYXRlU3R5bGVCaW5kaW5nYCBhbmQgYHVwZGF0ZUNsYXNzQmluZGluZ2AuXG4gKiBJZiBjYWxsZWQgZHVyaW5nIHRoZSBmaXJzdCB1cGRhdGUgcGFzcywgdGhlIGJpbmRpbmcgd2lsbCBiZSByZWdpc3RlcmVkIGluIHRoZSBjb250ZXh0LlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gd2lsbCBhbHNvIHVwZGF0ZSBiaW5kaW5nIHNsb3QgaW4gdGhlIHByb3ZpZGVkIGBMU3R5bGluZ0RhdGFgIHdpdGggdGhlXG4gKiBuZXcgYmluZGluZyBlbnRyeSAoaWYgaXQgaGFzIGNoYW5nZWQpLlxuICpcbiAqIEByZXR1cm5zIHdoZXRoZXIgb3Igbm90IHRoZSBiaW5kaW5nIHZhbHVlIHdhcyB1cGRhdGVkIGluIHRoZSBgTFN0eWxpbmdEYXRhYC5cbiAqL1xuZnVuY3Rpb24gdXBkYXRlQmluZGluZ0RhdGEoXG4gICAgY29udGV4dDogVFN0eWxpbmdDb250ZXh0LCB0Tm9kZTogVFN0eWxpbmdOb2RlLCBkYXRhOiBMU3R5bGluZ0RhdGEsIGNvdW50ZXJJbmRleDogbnVtYmVyLFxuICAgIHNvdXJjZUluZGV4OiBudW1iZXIsIHByb3A6IHN0cmluZyB8IG51bGwsIGJpbmRpbmdJbmRleDogbnVtYmVyLFxuICAgIHZhbHVlOiBzdHJpbmcgfCBTYWZlVmFsdWUgfCBudW1iZXIgfCBib29sZWFuIHwgbnVsbCB8IHVuZGVmaW5lZCB8IFN0eWxpbmdNYXBBcnJheSxcbiAgICBmb3JjZVVwZGF0ZTogYm9vbGVhbiwgc2FuaXRpemF0aW9uUmVxdWlyZWQ6IGJvb2xlYW4sIGZpcnN0VXBkYXRlUGFzczogYm9vbGVhbixcbiAgICBpc0NsYXNzQmFzZWQ6IGJvb2xlYW4pOiBib29sZWFuIHtcbiAgY29uc3QgaG9zdEJpbmRpbmdzTW9kZSA9IGlzSG9zdFN0eWxpbmdBY3RpdmUoc291cmNlSW5kZXgpO1xuICBjb25zdCBob3N0QmluZGluZ3NGbGFnID1cbiAgICAgIGlzQ2xhc3NCYXNlZCA/IFROb2RlRmxhZ3MuaGFzSG9zdENsYXNzQmluZGluZ3MgOiBUTm9kZUZsYWdzLmhhc0hvc3RTdHlsZUJpbmRpbmdzO1xuICBpZiAoZmlyc3RVcGRhdGVQYXNzKSB7XG4gICAgLy8gdGhpcyB3aWxsIG9ubHkgaGFwcGVuIGR1cmluZyB0aGUgZmlyc3QgdXBkYXRlIHBhc3Mgb2YgdGhlXG4gICAgLy8gY29udGV4dC4gVGhlIHJlYXNvbiB3aHkgd2UgY2FuJ3QgdXNlIGB0Vmlldy5maXJzdENyZWF0ZVBhc3NgXG4gICAgLy8gaGVyZSBpcyBiZWNhdXNlIGl0cyBub3QgZ3VhcmFudGVlZCB0byBiZSB0cnVlIHdoZW4gdGhlIGZpcnN0XG4gICAgLy8gdXBkYXRlIHBhc3MgaXMgZXhlY3V0ZWQgKHJlbWVtYmVyIHRoYXQgYWxsIHN0eWxpbmcgaW5zdHJ1Y3Rpb25zXG4gICAgLy8gYXJlIHJ1biBpbiB0aGUgdXBkYXRlIHBoYXNlLCBhbmQsIGFzIGEgcmVzdWx0LCBhcmUgbm8gbW9yZVxuICAgIC8vIHN0eWxpbmcgaW5zdHJ1Y3Rpb25zIHRoYXQgYXJlIHJ1biBpbiB0aGUgY3JlYXRpb24gcGhhc2UpLlxuICAgIHJlZ2lzdGVyQmluZGluZyhcbiAgICAgICAgY29udGV4dCwgdE5vZGUsIGNvdW50ZXJJbmRleCwgc291cmNlSW5kZXgsIHByb3AsIGJpbmRpbmdJbmRleCwgc2FuaXRpemF0aW9uUmVxdWlyZWQsXG4gICAgICAgIGlzQ2xhc3NCYXNlZCk7XG4gIH1cblxuICBjb25zdCBjaGFuZ2VkID0gZm9yY2VVcGRhdGUgfHwgaGFzVmFsdWVDaGFuZ2VkKGRhdGFbYmluZGluZ0luZGV4XSwgdmFsdWUpO1xuICBpZiAoY2hhbmdlZCkge1xuICAgIHNldFZhbHVlKGRhdGEsIGJpbmRpbmdJbmRleCwgdmFsdWUpO1xuICAgIGNvbnN0IGRvU2V0VmFsdWVzQXNTdGFsZSA9XG4gICAgICAgIGhhc0NvbmZpZyh0Tm9kZSwgaG9zdEJpbmRpbmdzRmxhZykgJiYgIWhvc3RCaW5kaW5nc01vZGUgJiYgKHByb3AgPyAhdmFsdWUgOiB0cnVlKTtcbiAgICBpZiAoZG9TZXRWYWx1ZXNBc1N0YWxlKSB7XG4gICAgICByZW5kZXJIb3N0QmluZGluZ3NBc1N0YWxlKGNvbnRleHQsIHROb2RlLCBkYXRhLCBwcm9wLCBpc0NsYXNzQmFzZWQpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gY2hhbmdlZDtcbn1cblxuLyoqXG4gKiBJdGVyYXRlcyBvdmVyIGFsbCBob3N0LWJpbmRpbmcgdmFsdWVzIGZvciB0aGUgZ2l2ZW4gYHByb3BgIHZhbHVlIGluIHRoZSBjb250ZXh0IGFuZCBzZXRzIHRoZWlyXG4gKiBjb3JyZXNwb25kaW5nIGJpbmRpbmcgdmFsdWVzIHRvIGBudWxsYC5cbiAqXG4gKiBXaGVuZXZlciBhIHRlbXBsYXRlIGJpbmRpbmcgY2hhbmdlcyBpdHMgdmFsdWUgdG8gYG51bGxgLCBhbGwgaG9zdC1iaW5kaW5nIHZhbHVlcyBzaG91bGQgYmVcbiAqIHJlLWFwcGxpZWRcbiAqIHRvIHRoZSBlbGVtZW50IHdoZW4gdGhlIGhvc3QgYmluZGluZ3MgYXJlIGV2YWx1YXRlZC4gVGhpcyBtYXkgbm90IGFsd2F5cyBoYXBwZW4gaW4gdGhlIGV2ZW50XG4gKiB0aGF0IG5vbmUgb2YgdGhlIGJpbmRpbmdzIGNoYW5nZWQgd2l0aGluIHRoZSBob3N0IGJpbmRpbmdzIGNvZGUuIEZvciB0aGlzIHJlYXNvbiB0aGlzIGZ1bmN0aW9uXG4gKiBpcyBleHBlY3RlZCB0byBiZSBjYWxsZWQgZWFjaCB0aW1lIGEgdGVtcGxhdGUgYmluZGluZyBiZWNvbWVzIGZhbHN5IG9yIHdoZW4gYSBtYXAtYmFzZWQgdGVtcGxhdGVcbiAqIGJpbmRpbmcgY2hhbmdlcy5cbiAqL1xuZnVuY3Rpb24gcmVuZGVySG9zdEJpbmRpbmdzQXNTdGFsZShcbiAgICBjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQsIHROb2RlOiBUU3R5bGluZ05vZGUsIGRhdGE6IExTdHlsaW5nRGF0YSwgcHJvcDogc3RyaW5nIHwgbnVsbCxcbiAgICBpc0NsYXNzQmFzZWQ6IGJvb2xlYW4pOiB2b2lkIHtcbiAgY29uc3QgdmFsdWVzQ291bnQgPSBnZXRWYWx1ZXNDb3VudChjb250ZXh0KTtcblxuICBjb25zdCBob3N0QmluZGluZ3NGbGFnID1cbiAgICAgIGlzQ2xhc3NCYXNlZCA/IFROb2RlRmxhZ3MuaGFzSG9zdENsYXNzQmluZGluZ3MgOiBUTm9kZUZsYWdzLmhhc0hvc3RTdHlsZUJpbmRpbmdzO1xuICBpZiAocHJvcCAhPT0gbnVsbCAmJiBoYXNDb25maWcodE5vZGUsIGhvc3RCaW5kaW5nc0ZsYWcpKSB7XG4gICAgY29uc3QgaXRlbXNQZXJSb3cgPSBUU3R5bGluZ0NvbnRleHRJbmRleC5CaW5kaW5nc1N0YXJ0T2Zmc2V0ICsgdmFsdWVzQ291bnQ7XG5cbiAgICBsZXQgaSA9IFRTdHlsaW5nQ29udGV4dEluZGV4LlZhbHVlc1N0YXJ0UG9zaXRpb247XG4gICAgbGV0IGZvdW5kID0gZmFsc2U7XG4gICAgd2hpbGUgKGkgPCBjb250ZXh0Lmxlbmd0aCkge1xuICAgICAgaWYgKGdldFByb3AoY29udGV4dCwgaSkgPT09IHByb3ApIHtcbiAgICAgICAgZm91bmQgPSB0cnVlO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGkgKz0gaXRlbXNQZXJSb3c7XG4gICAgfVxuXG4gICAgaWYgKGZvdW5kKSB7XG4gICAgICBjb25zdCBiaW5kaW5nc1N0YXJ0ID0gaSArIFRTdHlsaW5nQ29udGV4dEluZGV4LkJpbmRpbmdzU3RhcnRPZmZzZXQ7XG4gICAgICBjb25zdCB2YWx1ZXNTdGFydCA9IGJpbmRpbmdzU3RhcnQgKyAxOyAgLy8gdGhlIGZpcnN0IGNvbHVtbiBpcyB0ZW1wbGF0ZSBiaW5kaW5nc1xuICAgICAgY29uc3QgdmFsdWVzRW5kID0gYmluZGluZ3NTdGFydCArIHZhbHVlc0NvdW50IC0gMTtcblxuICAgICAgZm9yIChsZXQgaSA9IHZhbHVlc1N0YXJ0OyBpIDwgdmFsdWVzRW5kOyBpKyspIHtcbiAgICAgICAgY29uc3QgYmluZGluZ0luZGV4ID0gY29udGV4dFtpXSBhcyBudW1iZXI7XG4gICAgICAgIGlmIChiaW5kaW5nSW5kZXggIT09IDApIHtcbiAgICAgICAgICBzZXRWYWx1ZShkYXRhLCBiaW5kaW5nSW5kZXgsIG51bGwpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgY29uc3QgbWFwQmluZGluZ3NGbGFnID1cbiAgICAgIGlzQ2xhc3NCYXNlZCA/IFROb2RlRmxhZ3MuaGFzQ2xhc3NNYXBCaW5kaW5ncyA6IFROb2RlRmxhZ3MuaGFzU3R5bGVNYXBCaW5kaW5ncztcbiAgaWYgKGhhc0NvbmZpZyh0Tm9kZSwgbWFwQmluZGluZ3NGbGFnKSkge1xuICAgIGNvbnN0IGJpbmRpbmdzU3RhcnQgPVxuICAgICAgICBUU3R5bGluZ0NvbnRleHRJbmRleC5WYWx1ZXNTdGFydFBvc2l0aW9uICsgVFN0eWxpbmdDb250ZXh0SW5kZXguQmluZGluZ3NTdGFydE9mZnNldDtcbiAgICBjb25zdCB2YWx1ZXNTdGFydCA9IGJpbmRpbmdzU3RhcnQgKyAxOyAgLy8gdGhlIGZpcnN0IGNvbHVtbiBpcyB0ZW1wbGF0ZSBiaW5kaW5nc1xuICAgIGNvbnN0IHZhbHVlc0VuZCA9IGJpbmRpbmdzU3RhcnQgKyB2YWx1ZXNDb3VudCAtIDE7XG4gICAgZm9yIChsZXQgaSA9IHZhbHVlc1N0YXJ0OyBpIDwgdmFsdWVzRW5kOyBpKyspIHtcbiAgICAgIGNvbnN0IHN0eWxpbmdNYXAgPSBnZXRWYWx1ZTxTdHlsaW5nTWFwQXJyYXk+KGRhdGEsIGNvbnRleHRbaV0gYXMgbnVtYmVyKTtcbiAgICAgIGlmIChzdHlsaW5nTWFwKSB7XG4gICAgICAgIHNldE1hcEFzRGlydHkoc3R5bGluZ01hcCk7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogUmVnaXN0ZXJzIHRoZSBwcm92aWRlZCBiaW5kaW5nIChwcm9wICsgYmluZGluZ0luZGV4KSBpbnRvIHRoZSBjb250ZXh0LlxuICpcbiAqIEl0IGlzIG5lZWRlZCBiZWNhdXNlIGl0IHdpbGwgZWl0aGVyIHVwZGF0ZSBvciBpbnNlcnQgYSBzdHlsaW5nIHByb3BlcnR5XG4gKiBpbnRvIHRoZSBjb250ZXh0IGF0IHRoZSBjb3JyZWN0IHNwb3QuXG4gKlxuICogV2hlbiBjYWxsZWQsIG9uZSBvZiB0d28gdGhpbmdzIHdpbGwgaGFwcGVuOlxuICpcbiAqIDEpIElmIHRoZSBwcm9wZXJ0eSBhbHJlYWR5IGV4aXN0cyBpbiB0aGUgY29udGV4dCB0aGVuIGl0IHdpbGwganVzdCBhZGRcbiAqICAgIHRoZSBwcm92aWRlZCBgYmluZGluZ1ZhbHVlYCB0byB0aGUgZW5kIG9mIHRoZSBiaW5kaW5nIHNvdXJjZXMgcmVnaW9uXG4gKiAgICBmb3IgdGhhdCBwYXJ0aWN1bGFyIHByb3BlcnR5LlxuICpcbiAqICAgIC0gSWYgdGhlIGJpbmRpbmcgdmFsdWUgaXMgYSBudW1iZXIgdGhlbiBpdCB3aWxsIGJlIGFkZGVkIGFzIGEgbmV3XG4gKiAgICAgIGJpbmRpbmcgaW5kZXggc291cmNlIG5leHQgdG8gdGhlIG90aGVyIGJpbmRpbmcgc291cmNlcyBmb3IgdGhlIHByb3BlcnR5LlxuICpcbiAqICAgIC0gT3RoZXJ3aXNlLCBpZiB0aGUgYmluZGluZyB2YWx1ZSBpcyBhIHN0cmluZy9ib29sZWFuL251bGwgdHlwZSB0aGVuIGl0IHdpbGxcbiAqICAgICAgcmVwbGFjZSB0aGUgZGVmYXVsdCB2YWx1ZSBmb3IgdGhlIHByb3BlcnR5IGlmIHRoZSBkZWZhdWx0IHZhbHVlIGlzIGBudWxsYC5cbiAqXG4gKiAyKSBJZiB0aGUgcHJvcGVydHkgZG9lcyBub3QgZXhpc3QgdGhlbiBpdCB3aWxsIGJlIGluc2VydGVkIGludG8gdGhlIGNvbnRleHQuXG4gKiAgICBUaGUgc3R5bGluZyBjb250ZXh0IHJlbGllcyBvbiBhbGwgcHJvcGVydGllcyBiZWluZyBzdG9yZWQgaW4gYWxwaGFiZXRpY2FsXG4gKiAgICBvcmRlciwgc28gaXQga25vd3MgZXhhY3RseSB3aGVyZSB0byBzdG9yZSBpdC5cbiAqXG4gKiAgICBXaGVuIGluc2VydGVkLCBhIGRlZmF1bHQgYG51bGxgIHZhbHVlIGlzIGNyZWF0ZWQgZm9yIHRoZSBwcm9wZXJ0eSB3aGljaCBleGlzdHNcbiAqICAgIGFzIHRoZSBkZWZhdWx0IHZhbHVlIGZvciB0aGUgYmluZGluZy4gSWYgdGhlIGJpbmRpbmdWYWx1ZSBwcm9wZXJ0eSBpcyBpbnNlcnRlZFxuICogICAgYW5kIGl0IGlzIGVpdGhlciBhIHN0cmluZywgbnVtYmVyIG9yIG51bGwgdmFsdWUgdGhlbiB0aGF0IHdpbGwgcmVwbGFjZSB0aGUgZGVmYXVsdFxuICogICAgdmFsdWUuXG4gKlxuICogTm90ZSB0aGF0IHRoaXMgZnVuY3Rpb24gaXMgYWxzbyB1c2VkIGZvciBtYXAtYmFzZWQgc3R5bGluZyBiaW5kaW5ncy4gVGhleSBhcmUgdHJlYXRlZFxuICogbXVjaCB0aGUgc2FtZSBhcyBwcm9wLWJhc2VkIGJpbmRpbmdzLCBidXQsIHRoZWlyIHByb3BlcnR5IG5hbWUgdmFsdWUgaXMgc2V0IGFzIGBbTUFQXWAuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZWdpc3RlckJpbmRpbmcoXG4gICAgY29udGV4dDogVFN0eWxpbmdDb250ZXh0LCB0Tm9kZTogVFN0eWxpbmdOb2RlLCBjb3VudElkOiBudW1iZXIsIHNvdXJjZUluZGV4OiBudW1iZXIsXG4gICAgcHJvcDogc3RyaW5nIHwgbnVsbCwgYmluZGluZ1ZhbHVlOiBudW1iZXIgfCBudWxsIHwgc3RyaW5nIHwgYm9vbGVhbixcbiAgICBzYW5pdGl6YXRpb25SZXF1aXJlZDogYm9vbGVhbiwgaXNDbGFzc0Jhc2VkOiBib29sZWFuKTogdm9pZCB7XG4gIGxldCBmb3VuZCA9IGZhbHNlO1xuICBwcm9wID0gcHJvcCB8fCBNQVBfQkFTRURfRU5UUllfUFJPUF9OQU1FO1xuXG4gIGxldCB0b3RhbFNvdXJjZXMgPSBnZXRUb3RhbFNvdXJjZXMoY29udGV4dCk7XG5cbiAgLy8gaWYgYSBuZXcgc291cmNlIGlzIGRldGVjdGVkIHRoZW4gYSBuZXcgY29sdW1uIG5lZWRzIHRvIGJlIGFsbG9jYXRlZCBpbnRvXG4gIC8vIHRoZSBzdHlsaW5nIGNvbnRleHQuIFRoZSBjb2x1bW4gaXMgYmFzaWNhbGx5IGEgbmV3IGFsbG9jYXRpb24gb2YgYmluZGluZ1xuICAvLyBzb3VyY2VzIHRoYXQgd2lsbCBiZSBhdmFpbGFibGUgdG8gZWFjaCBwcm9wZXJ0eS5cbiAgd2hpbGUgKHRvdGFsU291cmNlcyA8PSBzb3VyY2VJbmRleCkge1xuICAgIGFkZE5ld1NvdXJjZUNvbHVtbihjb250ZXh0KTtcbiAgICB0b3RhbFNvdXJjZXMrKztcbiAgfVxuXG4gIGNvbnN0IGNvbGxpc2lvbkZsYWcgPVxuICAgICAgaXNDbGFzc0Jhc2VkID8gVE5vZGVGbGFncy5oYXNEdXBsaWNhdGVDbGFzc0JpbmRpbmdzIDogVE5vZGVGbGFncy5oYXNEdXBsaWNhdGVTdHlsZUJpbmRpbmdzO1xuICBjb25zdCBpc0JpbmRpbmdJbmRleFZhbHVlID0gdHlwZW9mIGJpbmRpbmdWYWx1ZSA9PT0gJ251bWJlcic7XG4gIGNvbnN0IGVudHJpZXNQZXJSb3cgPSBUU3R5bGluZ0NvbnRleHRJbmRleC5CaW5kaW5nc1N0YXJ0T2Zmc2V0ICsgZ2V0VmFsdWVzQ291bnQoY29udGV4dCk7XG4gIGxldCBpID0gVFN0eWxpbmdDb250ZXh0SW5kZXguVmFsdWVzU3RhcnRQb3NpdGlvbjtcblxuICAvLyBhbGwgc3R5bGUvY2xhc3MgYmluZGluZ3MgYXJlIHNvcnRlZCBieSBwcm9wZXJ0eSBuYW1lXG4gIHdoaWxlIChpIDwgY29udGV4dC5sZW5ndGgpIHtcbiAgICBjb25zdCBwID0gZ2V0UHJvcChjb250ZXh0LCBpKTtcbiAgICBpZiAocHJvcCA8PSBwKSB7XG4gICAgICBpZiAocHJvcCA8IHApIHtcbiAgICAgICAgYWxsb2NhdGVOZXdDb250ZXh0RW50cnkoY29udGV4dCwgaSwgcHJvcCwgc2FuaXRpemF0aW9uUmVxdWlyZWQpO1xuICAgICAgfSBlbHNlIGlmIChpc0JpbmRpbmdJbmRleFZhbHVlKSB7XG4gICAgICAgIHBhdGNoQ29uZmlnKHROb2RlLCBjb2xsaXNpb25GbGFnKTtcbiAgICAgIH1cbiAgICAgIGFkZEJpbmRpbmdJbnRvQ29udGV4dChjb250ZXh0LCBpLCBiaW5kaW5nVmFsdWUsIGNvdW50SWQsIHNvdXJjZUluZGV4KTtcbiAgICAgIGZvdW5kID0gdHJ1ZTtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgICBpICs9IGVudHJpZXNQZXJSb3c7XG4gIH1cblxuICBpZiAoIWZvdW5kKSB7XG4gICAgYWxsb2NhdGVOZXdDb250ZXh0RW50cnkoY29udGV4dCwgY29udGV4dC5sZW5ndGgsIHByb3AsIHNhbml0aXphdGlvblJlcXVpcmVkKTtcbiAgICBhZGRCaW5kaW5nSW50b0NvbnRleHQoY29udGV4dCwgaSwgYmluZGluZ1ZhbHVlLCBjb3VudElkLCBzb3VyY2VJbmRleCk7XG4gIH1cbn1cblxuLyoqXG4gKiBJbnNlcnRzIGEgbmV3IHJvdyBpbnRvIHRoZSBwcm92aWRlZCBgVFN0eWxpbmdDb250ZXh0YCBhbmQgYXNzaWducyB0aGUgcHJvdmlkZWQgYHByb3BgIHZhbHVlIGFzXG4gKiB0aGUgcHJvcGVydHkgZW50cnkuXG4gKi9cbmZ1bmN0aW9uIGFsbG9jYXRlTmV3Q29udGV4dEVudHJ5KFxuICAgIGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCwgaW5kZXg6IG51bWJlciwgcHJvcDogc3RyaW5nLCBzYW5pdGl6YXRpb25SZXF1aXJlZD86IGJvb2xlYW4pOiB2b2lkIHtcbiAgY29uc3QgY29uZmlnID0gc2FuaXRpemF0aW9uUmVxdWlyZWQgPyBUU3R5bGluZ0NvbnRleHRQcm9wQ29uZmlnRmxhZ3MuU2FuaXRpemF0aW9uUmVxdWlyZWQgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFRTdHlsaW5nQ29udGV4dFByb3BDb25maWdGbGFncy5EZWZhdWx0O1xuICBjb250ZXh0LnNwbGljZShcbiAgICAgIGluZGV4LCAwLFxuICAgICAgY29uZmlnLCAgICAgICAgICAgICAgICAgICAgLy8gMSkgY29uZmlnIHZhbHVlXG4gICAgICBERUZBVUxUX0dVQVJEX01BU0tfVkFMVUUsICAvLyAyKSB0ZW1wbGF0ZSBiaXQgbWFza1xuICAgICAgREVGQVVMVF9HVUFSRF9NQVNLX1ZBTFVFLCAgLy8gMykgaG9zdCBiaW5kaW5ncyBiaXQgbWFza1xuICAgICAgcHJvcCwgICAgICAgICAgICAgICAgICAgICAgLy8gNCkgcHJvcCB2YWx1ZSAoZS5nLiBgd2lkdGhgLCBgbXlDbGFzc2AsIGV0Yy4uLilcbiAgICAgICk7XG5cbiAgaW5kZXggKz0gNDsgIC8vIHRoZSA0IHZhbHVlcyBhYm92ZVxuXG4gIC8vIDUuLi4pIGRlZmF1bHQgYmluZGluZyBpbmRleCBmb3IgdGhlIHRlbXBsYXRlIHZhbHVlXG4gIC8vIGRlcGVuZGluZyBvbiBob3cgbWFueSBzb3VyY2VzIGFscmVhZHkgZXhpc3QgaW4gdGhlIGNvbnRleHQsXG4gIC8vIG11bHRpcGxlIGRlZmF1bHQgaW5kZXggZW50cmllcyBtYXkgbmVlZCB0byBiZSBpbnNlcnRlZCBmb3JcbiAgLy8gdGhlIG5ldyB2YWx1ZSBpbiB0aGUgY29udGV4dC5cbiAgY29uc3QgdG90YWxCaW5kaW5nc1BlckVudHJ5ID0gZ2V0VG90YWxTb3VyY2VzKGNvbnRleHQpO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IHRvdGFsQmluZGluZ3NQZXJFbnRyeTsgaSsrKSB7XG4gICAgY29udGV4dC5zcGxpY2UoaW5kZXgsIDAsIERFRkFVTFRfQklORElOR19JTkRFWCk7XG4gICAgaW5kZXgrKztcbiAgfVxuXG4gIC8vIDYpIGRlZmF1bHQgYmluZGluZyB2YWx1ZSBmb3IgdGhlIG5ldyBlbnRyeVxuICBjb250ZXh0LnNwbGljZShpbmRleCwgMCwgREVGQVVMVF9CSU5ESU5HX1ZBTFVFKTtcbn1cblxuLyoqXG4gKiBJbnNlcnRzIGEgbmV3IGJpbmRpbmcgdmFsdWUgaW50byBhIHN0eWxpbmcgcHJvcGVydHkgdHVwbGUgaW4gdGhlIGBUU3R5bGluZ0NvbnRleHRgLlxuICpcbiAqIEEgYmluZGluZ1ZhbHVlIGlzIGluc2VydGVkIGludG8gYSBjb250ZXh0IGR1cmluZyB0aGUgZmlyc3QgdXBkYXRlIHBhc3NcbiAqIG9mIGEgdGVtcGxhdGUgb3IgaG9zdCBiaW5kaW5ncyBmdW5jdGlvbi4gV2hlbiB0aGlzIG9jY3VycywgdHdvIHRoaW5nc1xuICogaGFwcGVuOlxuICpcbiAqIC0gSWYgdGhlIGJpbmRpbmdWYWx1ZSB2YWx1ZSBpcyBhIG51bWJlciB0aGVuIGl0IGlzIHRyZWF0ZWQgYXMgYSBiaW5kaW5nSW5kZXhcbiAqICAgdmFsdWUgKGEgaW5kZXggaW4gdGhlIGBMVmlld2ApIGFuZCBpdCB3aWxsIGJlIGluc2VydGVkIG5leHQgdG8gdGhlIG90aGVyXG4gKiAgIGJpbmRpbmcgaW5kZXggZW50cmllcy5cbiAqXG4gKiAtIE90aGVyd2lzZSB0aGUgYmluZGluZyB2YWx1ZSB3aWxsIHVwZGF0ZSB0aGUgZGVmYXVsdCB2YWx1ZSBmb3IgdGhlIHByb3BlcnR5XG4gKiAgIGFuZCB0aGlzIHdpbGwgb25seSBoYXBwZW4gaWYgdGhlIGRlZmF1bHQgdmFsdWUgaXMgYG51bGxgLlxuICovXG5mdW5jdGlvbiBhZGRCaW5kaW5nSW50b0NvbnRleHQoXG4gICAgY29udGV4dDogVFN0eWxpbmdDb250ZXh0LCBpbmRleDogbnVtYmVyLCBiaW5kaW5nVmFsdWU6IG51bWJlciB8IHN0cmluZyB8IGJvb2xlYW4gfCBudWxsLFxuICAgIGJpdEluZGV4OiBudW1iZXIsIHNvdXJjZUluZGV4OiBudW1iZXIpIHtcbiAgaWYgKHR5cGVvZiBiaW5kaW5nVmFsdWUgPT09ICdudW1iZXInKSB7XG4gICAgY29uc3QgaG9zdEJpbmRpbmdzTW9kZSA9IGlzSG9zdFN0eWxpbmdBY3RpdmUoc291cmNlSW5kZXgpO1xuICAgIGNvbnN0IGNlbGxJbmRleCA9IGluZGV4ICsgVFN0eWxpbmdDb250ZXh0SW5kZXguQmluZGluZ3NTdGFydE9mZnNldCArIHNvdXJjZUluZGV4O1xuICAgIGNvbnRleHRbY2VsbEluZGV4XSA9IGJpbmRpbmdWYWx1ZTtcbiAgICBjb25zdCB1cGRhdGVkQml0TWFzayA9IGdldEd1YXJkTWFzayhjb250ZXh0LCBpbmRleCwgaG9zdEJpbmRpbmdzTW9kZSkgfCAoMSA8PCBiaXRJbmRleCk7XG4gICAgc2V0R3VhcmRNYXNrKGNvbnRleHQsIGluZGV4LCB1cGRhdGVkQml0TWFzaywgaG9zdEJpbmRpbmdzTW9kZSk7XG4gIH0gZWxzZSBpZiAoYmluZGluZ1ZhbHVlICE9PSBudWxsICYmIGdldERlZmF1bHRWYWx1ZShjb250ZXh0LCBpbmRleCkgPT09IG51bGwpIHtcbiAgICBzZXREZWZhdWx0VmFsdWUoY29udGV4dCwgaW5kZXgsIGJpbmRpbmdWYWx1ZSk7XG4gIH1cbn1cblxuLyoqXG4gKiBSZWdpc3RlcnMgYSBuZXcgY29sdW1uIGludG8gdGhlIHByb3ZpZGVkIGBUU3R5bGluZ0NvbnRleHRgLlxuICpcbiAqIElmIGFuZCB3aGVuIGEgbmV3IHNvdXJjZSBpcyBkZXRlY3RlZCB0aGVuIGEgbmV3IGNvbHVtbiBuZWVkcyB0b1xuICogYmUgYWxsb2NhdGVkIGludG8gdGhlIHN0eWxpbmcgY29udGV4dC4gVGhlIGNvbHVtbiBpcyBiYXNpY2FsbHlcbiAqIGEgbmV3IGFsbG9jYXRpb24gb2YgYmluZGluZyBzb3VyY2VzIHRoYXQgd2lsbCBiZSBhdmFpbGFibGUgdG8gZWFjaFxuICogcHJvcGVydHkuXG4gKlxuICogRWFjaCBjb2x1bW4gdGhhdCBleGlzdHMgaW4gdGhlIHN0eWxpbmcgY29udGV4dCByZXNlbWJsZXMgYSBzdHlsaW5nXG4gKiBzb3VyY2UuIEEgc3R5bGluZyBzb3VyY2UgYW4gZWl0aGVyIGJlIHRoZSB0ZW1wbGF0ZSBvciBvbmUgb3IgbW9yZVxuICogY29tcG9uZW50cyBvciBkaXJlY3RpdmVzIGFsbCBjb250YWluaW5nIHN0eWxpbmcgaG9zdCBiaW5kaW5ncy5cbiAqL1xuZnVuY3Rpb24gYWRkTmV3U291cmNlQ29sdW1uKGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCk6IHZvaWQge1xuICAvLyB3ZSB1c2UgLTEgaGVyZSBiZWNhdXNlIHdlIHdhbnQgdG8gaW5zZXJ0IHJpZ2h0IGJlZm9yZSB0aGUgbGFzdCB2YWx1ZSAodGhlIGRlZmF1bHQgdmFsdWUpXG4gIGNvbnN0IGluc2VydE9mZnNldCA9IFRTdHlsaW5nQ29udGV4dEluZGV4LkJpbmRpbmdzU3RhcnRPZmZzZXQgKyBnZXRWYWx1ZXNDb3VudChjb250ZXh0KSAtIDE7XG5cbiAgbGV0IGluZGV4ID0gVFN0eWxpbmdDb250ZXh0SW5kZXguVmFsdWVzU3RhcnRQb3NpdGlvbjtcbiAgd2hpbGUgKGluZGV4IDwgY29udGV4dC5sZW5ndGgpIHtcbiAgICBpbmRleCArPSBpbnNlcnRPZmZzZXQ7XG4gICAgY29udGV4dC5zcGxpY2UoaW5kZXgrKywgMCwgREVGQVVMVF9CSU5ESU5HX0lOREVYKTtcblxuICAgIC8vIHRoZSB2YWx1ZSB3YXMgaW5zZXJ0ZWQganVzdCBiZWZvcmUgdGhlIGRlZmF1bHQgdmFsdWUsIGJ1dCB0aGVcbiAgICAvLyBuZXh0IGVudHJ5IGluIHRoZSBjb250ZXh0IHN0YXJ0cyBqdXN0IGFmdGVyIGl0LiBUaGVyZWZvcmUrKy5cbiAgICBpbmRleCsrO1xuICB9XG4gIGNvbnRleHRbVFN0eWxpbmdDb250ZXh0SW5kZXguVG90YWxTb3VyY2VzUG9zaXRpb25dKys7XG59XG5cbi8qKlxuICogQXBwbGllcyBhbGwgcGVuZGluZyBzdHlsZSBhbmQgY2xhc3MgYmluZGluZ3MgdG8gdGhlIHByb3ZpZGVkIGVsZW1lbnQuXG4gKlxuICogVGhpcyBmdW5jdGlvbiB3aWxsIGF0dGVtcHQgdG8gZmx1c2ggc3R5bGluZyB2aWEgdGhlIHByb3ZpZGVkIGBjbGFzc2VzQ29udGV4dGBcbiAqIGFuZCBgc3R5bGVzQ29udGV4dGAgY29udGV4dCB2YWx1ZXMuIFRoaXMgZnVuY3Rpb24gaXMgZGVzaWduZWQgdG8gYmUgcnVuIGZyb21cbiAqIHRoZSBpbnRlcm5hbCBgc3R5bGluZ0FwcGx5YCBmdW5jdGlvbiAod2hpY2ggaXMgc2NoZWR1bGVkIHRvIHJ1biBhdCB0aGUgdmVyeVxuICogZW5kIG9mIGNoYW5nZSBkZXRlY3Rpb24gZm9yIGFuIGVsZW1lbnQgaWYgb25lIG9yIG1vcmUgc3R5bGUvY2xhc3MgYmluZGluZ3NcbiAqIHdlcmUgcHJvY2Vzc2VkKSBhbmQgd2lsbCByZWx5IG9uIGFueSBzdGF0ZSB2YWx1ZXMgdGhhdCBhcmUgc2V0IGZyb20gd2hlblxuICogYW55IG9mIHRoZSBzdHlsaW5nIGJpbmRpbmdzIGV4ZWN1dGVkLlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gaXMgZGVzaWduZWQgdG8gYmUgY2FsbGVkIHR3aWNlOiBvbmUgd2hlbiBjaGFuZ2UgZGV0ZWN0aW9uIGhhc1xuICogcHJvY2Vzc2VkIGFuIGVsZW1lbnQgd2l0aGluIHRoZSB0ZW1wbGF0ZSBiaW5kaW5ncyAoaS5lLiBqdXN0IGFzIGBhZHZhbmNlKClgXG4gKiBpcyBjYWxsZWQpIGFuZCB3aGVuIGhvc3QgYmluZGluZ3MgaGF2ZSBiZWVuIHByb2Nlc3NlZC4gSW4gYm90aCBjYXNlcyB0aGVcbiAqIHN0eWxlcyBhbmQgY2xhc3NlcyBpbiBib3RoIGNvbnRleHRzIHdpbGwgYmUgYXBwbGllZCB0byB0aGUgZWxlbWVudCwgYnV0IHRoZVxuICogYWxnb3JpdGhtIHdpbGwgc2VsZWN0aXZlbHkgZGVjaWRlIHdoaWNoIGJpbmRpbmdzIHRvIHJ1biBkZXBlbmRpbmcgb24gdGhlXG4gKiBjb2x1bW5zIGluIHRoZSBjb250ZXh0LiBUaGUgcHJvdmlkZWQgYGRpcmVjdGl2ZUluZGV4YCB2YWx1ZSB3aWxsIGhlbHAgdGhlXG4gKiBhbGdvcml0aG0gZGV0ZXJtaW5lIHdoaWNoIGJpbmRpbmdzIHRvIGFwcGx5OiBlaXRoZXIgdGhlIHRlbXBsYXRlIGJpbmRpbmdzIG9yXG4gKiB0aGUgaG9zdCBiaW5kaW5ncyAoc2VlIGBhcHBseVN0eWxpbmdUb0VsZW1lbnRgIGZvciBtb3JlIGluZm9ybWF0aW9uKS5cbiAqXG4gKiBOb3RlIHRoYXQgb25jZSB0aGlzIGZ1bmN0aW9uIGlzIGNhbGxlZCBhbGwgdGVtcG9yYXJ5IHN0eWxpbmcgc3RhdGUgZGF0YVxuICogKGkuZS4gdGhlIGBiaXRNYXNrYCBhbmQgYGNvdW50ZXJgIHZhbHVlcyBmb3Igc3R5bGVzIGFuZCBjbGFzc2VzIHdpbGwgYmUgY2xlYXJlZCkuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBmbHVzaFN0eWxpbmcoXG4gICAgcmVuZGVyZXI6IFJlbmRlcmVyMyB8IFByb2NlZHVyYWxSZW5kZXJlcjMgfCBudWxsLCBkYXRhOiBMU3R5bGluZ0RhdGEsIHROb2RlOiBUU3R5bGluZ05vZGUsXG4gICAgY2xhc3Nlc0NvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCB8IG51bGwsIHN0eWxlc0NvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCB8IG51bGwsXG4gICAgZWxlbWVudDogUkVsZW1lbnQsIGRpcmVjdGl2ZUluZGV4OiBudW1iZXIsIHN0eWxlU2FuaXRpemVyOiBTdHlsZVNhbml0aXplRm4gfCBudWxsLFxuICAgIGZpcnN0VXBkYXRlUGFzczogYm9vbGVhbik6IHZvaWQge1xuICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLmZsdXNoU3R5bGluZysrO1xuXG4gIGNvbnN0IHN0YXRlID0gZ2V0U3R5bGluZ1N0YXRlKGVsZW1lbnQsIGRpcmVjdGl2ZUluZGV4KTtcbiAgY29uc3QgaG9zdEJpbmRpbmdzTW9kZSA9IGlzSG9zdFN0eWxpbmdBY3RpdmUoc3RhdGUuc291cmNlSW5kZXgpO1xuXG4gIGlmIChzdHlsZXNDb250ZXh0KSB7XG4gICAgZmlyc3RVcGRhdGVQYXNzICYmIHN5bmNDb250ZXh0SW5pdGlhbFN0eWxpbmcoc3R5bGVzQ29udGV4dCwgdE5vZGUsIGZhbHNlKTtcblxuICAgIGlmIChzdGF0ZS5zdHlsZXNCaXRNYXNrICE9PSAwKSB7XG4gICAgICBhcHBseVN0eWxpbmdWaWFDb250ZXh0KFxuICAgICAgICAgIHN0eWxlc0NvbnRleHQsIHROb2RlLCByZW5kZXJlciwgZWxlbWVudCwgZGF0YSwgc3RhdGUuc3R5bGVzQml0TWFzaywgc2V0U3R5bGUsXG4gICAgICAgICAgc3R5bGVTYW5pdGl6ZXIsIGhvc3RCaW5kaW5nc01vZGUsIGZhbHNlKTtcbiAgICB9XG4gIH1cblxuICBpZiAoY2xhc3Nlc0NvbnRleHQpIHtcbiAgICBmaXJzdFVwZGF0ZVBhc3MgJiYgc3luY0NvbnRleHRJbml0aWFsU3R5bGluZyhjbGFzc2VzQ29udGV4dCwgdE5vZGUsIHRydWUpO1xuXG4gICAgaWYgKHN0YXRlLmNsYXNzZXNCaXRNYXNrICE9PSAwKSB7XG4gICAgICBhcHBseVN0eWxpbmdWaWFDb250ZXh0KFxuICAgICAgICAgIGNsYXNzZXNDb250ZXh0LCB0Tm9kZSwgcmVuZGVyZXIsIGVsZW1lbnQsIGRhdGEsIHN0YXRlLmNsYXNzZXNCaXRNYXNrLCBzZXRDbGFzcywgbnVsbCxcbiAgICAgICAgICBob3N0QmluZGluZ3NNb2RlLCB0cnVlKTtcbiAgICB9XG4gIH1cblxuICByZXNldFN0eWxpbmdTdGF0ZSgpO1xufVxuXG4vKipcbiAqIFJlZ2lzdGVycyBhbGwgc3RhdGljIHN0eWxpbmcgdmFsdWVzIGludG8gdGhlIGNvbnRleHQgYXMgZGVmYXVsdCB2YWx1ZXMuXG4gKlxuICogU3RhdGljIHN0eWxlcyBhcmUgc3RvcmVkIG9uIHRoZSBgdE5vZGUuc3R5bGVzYCBhbmQgYHROb2RlLmNsYXNzZXNgXG4gKiBwcm9wZXJ0aWVzIGFzIGluc3RhbmNlcyBvZiBgU3R5bGluZ01hcEFycmF5YC4gV2hlbiBhbiBpbnN0YW5jZSBvZlxuICogYFRTdHlsaW5nQ29udGV4dGAgaXMgYXNzaWduZWQgdG8gYHROb2RlLnN0eWxlc2AgYW5kIGB0Tm9kZS5jbGFzc2VzYFxuICogdGhlbiB0aGUgZXhpc3RpbmcgaW5pdGlhbCBzdHlsaW5nIHZhbHVlcyBhcmUgY29waWVkIGludG8gdGhlIHRoZVxuICogYEluaXRpYWxTdHlsaW5nVmFsdWVQb3NpdGlvbmAgc2xvdC5cbiAqXG4gKiBCZWNhdXNlIGFsbCBzdGF0aWMgc3R5bGVzL2NsYXNzZXMgYXJlIGNvbGxlY3RlZCBhbmQgcmVnaXN0ZXJlZCBvblxuICogdGhlIGluaXRpYWwgc3R5bGluZyBhcnJheSBlYWNoIHRpbWUgYSBkaXJlY3RpdmUgaXMgaW5zdGFudGlhdGVkLFxuICogdGhlIGNvbnRleHQgbWF5IG5vdCB5ZXQga25vdyBhYm91dCB0aGUgc3RhdGljIHZhbHVlcy4gV2hlbiB0aGlzXG4gKiBmdW5jdGlvbiBpcyBjYWxsZWQgaXQgd2lsbCBjb3B5IG92ZXIgYWxsIHRoZSBzdGF0aWMgc3R5bGUvY2xhc3NcbiAqIHZhbHVlcyBmcm9tIHRoZSBpbml0aWFsIHN0eWxpbmcgYXJyYXkgaW50byB0aGUgY29udGV4dCBhcyBkZWZhdWx0XG4gKiB2YWx1ZXMgZm9yIGVhY2ggb2YgdGhlIG1hdGNoaW5nIGVudHJpZXMgaW4gdGhlIGNvbnRleHQuXG4gKlxuICogTGV0J3MgaW1hZ2luZSB0aGUgZm9sbG93aW5nIGV4YW1wbGU6XG4gKlxuICogYGBgaHRtbFxuICogPGRpdiBzdHlsZT1cImNvbG9yOnJlZFwiXG4gKiAgICAgW3N0eWxlLmNvbG9yXT1cIm15Q29sb3JcIlxuICogICAgIGRpci10aGF0LWhhcy1zdGF0aWMtaGVpZ2h0PlxuICogICAuLi5cbiAqIDwvZGl2PlxuICogYGBgXG4gKlxuICogV2hlbiB0aGUgY29kZSBhYm92ZSBpcyBwcm9jZXNzZWQsIHRoZSB1bmRlcmx5aW5nIGVsZW1lbnQvc3R5bGluZ1xuICogaW5zdHJ1Y3Rpb25zIHdpbGwgY3JlYXRlIGFuIGluc3RhbmNlIG9mIGBUU3R5bGluZ0NvbnRleHRgIGZvclxuICogdGhlIGB0Tm9kZS5zdHlsZXNgIHByb3BlcnR5LiBIZXJlJ3Mgd2hhdCB0aGF0IGxvb2tzIGxpa2U6XG4gKlxuICogYGBgdHlwZXNjcmlwdFxuICogdE5vZGUuc3R5bGVzID0gW1xuICogICAvLyAuLi5cbiAqICAgLy8gaW5pdGlhbCBzdHlsZXNcbiAqICAgWydjb2xvcjpyZWQ7IGhlaWdodDoyMDBweCcsICdjb2xvcicsICdyZWQnLCAnaGVpZ2h0JywgJzIwMHB4J10sXG4gKlxuICogICAwLCAwYjEsIDBiMCwgJ2NvbG9yJywgMjAsIG51bGwsIC8vIFtzdHlsZS5jb2xvcl0gYmluZGluZ1xuICogXVxuICogYGBgXG4gKlxuICogQWZ0ZXIgdGhpcyBmdW5jdGlvbiBpcyBjYWxsZWQgaXQgd2lsbCBiYWxhbmNlIG91dCB0aGUgY29udGV4dCB3aXRoXG4gKiB0aGUgc3RhdGljIGBjb2xvcmAgYW5kIGBoZWlnaHRgIHZhbHVlcyBhbmQgc2V0IHRoZW0gYXMgZGVmYXVsdHMgd2l0aGluXG4gKiB0aGUgY29udGV4dDpcbiAqXG4gKiBgYGB0eXBlc2NyaXB0XG4gKiB0Tm9kZS5zdHlsZXMgPSBbXG4gKiAgIC8vIC4uLlxuICogICAvLyBpbml0aWFsIHN0eWxlc1xuICogICBbJ2NvbG9yOnJlZDsgaGVpZ2h0OjIwMHB4JywgJ2NvbG9yJywgJ3JlZCcsICdoZWlnaHQnLCAnMjAwcHgnXSxcbiAqXG4gKiAgIDAsIDBiMSwgMGIwLCAnY29sb3InLCAyMCwgJ3JlZCcsXG4gKiAgIDAsIDBiMCwgMGIwLCAnaGVpZ2h0JywgMCwgJzIwMHB4JyxcbiAqIF1cbiAqIGBgYFxuICovXG5mdW5jdGlvbiBzeW5jQ29udGV4dEluaXRpYWxTdHlsaW5nKFxuICAgIGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCwgdE5vZGU6IFRTdHlsaW5nTm9kZSwgaXNDbGFzc0Jhc2VkOiBib29sZWFuKTogdm9pZCB7XG4gIC8vIHRoZSBUU3R5bGluZ0NvbnRleHQgYWx3YXlzIGhhcyBpbml0aWFsIHN0eWxlL2NsYXNzIHZhbHVlcyB3aGljaCBhcmVcbiAgLy8gc3RvcmVkIGluIHN0eWxpbmcgYXJyYXkgZm9ybWF0LlxuICB1cGRhdGVJbml0aWFsU3R5bGluZ09uQ29udGV4dChjb250ZXh0LCB0Tm9kZSwgZ2V0U3R5bGluZ01hcEFycmF5KGNvbnRleHQpICEsIGlzQ2xhc3NCYXNlZCk7XG59XG5cbi8qKlxuICogUmVnaXN0ZXJzIGFsbCBpbml0aWFsIHN0eWxpbmcgZW50cmllcyBpbnRvIHRoZSBwcm92aWRlZCBjb250ZXh0LlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gd2lsbCBpdGVyYXRlIG92ZXIgYWxsIGVudHJpZXMgaW4gdGhlIHByb3ZpZGVkIGBpbml0aWFsU3R5bGluZ2AgYXJ9cmF5IGFuZCByZWdpc3RlclxuICogdGhlbSBhcyBkZWZhdWx0IChpbml0aWFsKSB2YWx1ZXMgaW4gdGhlIHByb3ZpZGVkIGNvbnRleHQuIEluaXRpYWwgc3R5bGluZyB2YWx1ZXMgaW4gYSBjb250ZXh0IGFyZVxuICogdGhlIGRlZmF1bHQgdmFsdWVzIHRoYXQgYXJlIHRvIGJlIGFwcGxpZWQgdW5sZXNzIG92ZXJ3cml0dGVuIGJ5IGEgYmluZGluZy5cbiAqXG4gKiBUaGUgcmVhc29uIHdoeSB0aGlzIGZ1bmN0aW9uIGV4aXN0cyBhbmQgaXNuJ3QgYSBwYXJ0IG9mIHRoZSBjb250ZXh0IGNvbnN0cnVjdGlvbiBpcyBiZWNhdXNlXG4gKiBob3N0IGJpbmRpbmcgaXMgZXZhbHVhdGVkIGF0IGEgbGF0ZXIgc3RhZ2UgYWZ0ZXIgdGhlIGVsZW1lbnQgaXMgY3JlYXRlZC4gVGhpcyBtZWFucyB0aGF0XG4gKiBpZiBhIGRpcmVjdGl2ZSBvciBjb21wb25lbnQgY29udGFpbnMgYW55IGluaXRpYWwgc3R5bGluZyBjb2RlIChpLmUuIGA8ZGl2IGNsYXNzPVwiZm9vXCI+YClcbiAqIHRoZW4gdGhhdCBpbml0aWFsIHN0eWxpbmcgZGF0YSBjYW4gb25seSBiZSBhcHBsaWVkIG9uY2UgdGhlIHN0eWxpbmcgZm9yIHRoYXQgZWxlbWVudFxuICogaXMgZmlyc3QgYXBwbGllZCAoYXQgdGhlIGVuZCBvZiB0aGUgdXBkYXRlIHBoYXNlKS4gT25jZSB0aGF0IGhhcHBlbnMgdGhlbiB0aGUgY29udGV4dCB3aWxsXG4gKiB1cGRhdGUgaXRzZWxmIHdpdGggdGhlIGNvbXBsZXRlIGluaXRpYWwgc3R5bGluZyBmb3IgdGhlIGVsZW1lbnQuXG4gKi9cbmZ1bmN0aW9uIHVwZGF0ZUluaXRpYWxTdHlsaW5nT25Db250ZXh0KFxuICAgIGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCwgdE5vZGU6IFRTdHlsaW5nTm9kZSwgaW5pdGlhbFN0eWxpbmc6IFN0eWxpbmdNYXBBcnJheSxcbiAgICBpc0NsYXNzQmFzZWQ6IGJvb2xlYW4pOiB2b2lkIHtcbiAgLy8gYC0xYCBpcyB1c2VkIGhlcmUgYmVjYXVzZSBhbGwgaW5pdGlhbCBzdHlsaW5nIGRhdGEgaXMgbm90IGEgYXBhcnRcbiAgLy8gb2YgYSBiaW5kaW5nIChzaW5jZSBpdCdzIHN0YXRpYylcbiAgY29uc3QgQ09VTlRfSURfRk9SX1NUWUxJTkcgPSAtMTtcblxuICBsZXQgaGFzSW5pdGlhbFN0eWxpbmcgPSBmYWxzZTtcbiAgZm9yIChsZXQgaSA9IFN0eWxpbmdNYXBBcnJheUluZGV4LlZhbHVlc1N0YXJ0UG9zaXRpb247IGkgPCBpbml0aWFsU3R5bGluZy5sZW5ndGg7XG4gICAgICAgaSArPSBTdHlsaW5nTWFwQXJyYXlJbmRleC5UdXBsZVNpemUpIHtcbiAgICBjb25zdCB2YWx1ZSA9IGdldE1hcFZhbHVlKGluaXRpYWxTdHlsaW5nLCBpKTtcbiAgICBpZiAodmFsdWUpIHtcbiAgICAgIGNvbnN0IHByb3AgPSBnZXRNYXBQcm9wKGluaXRpYWxTdHlsaW5nLCBpKTtcbiAgICAgIHJlZ2lzdGVyQmluZGluZyhjb250ZXh0LCB0Tm9kZSwgQ09VTlRfSURfRk9SX1NUWUxJTkcsIDAsIHByb3AsIHZhbHVlLCBmYWxzZSwgaXNDbGFzc0Jhc2VkKTtcbiAgICAgIGhhc0luaXRpYWxTdHlsaW5nID0gdHJ1ZTtcbiAgICB9XG4gIH1cblxuICBpZiAoaGFzSW5pdGlhbFN0eWxpbmcpIHtcbiAgICBwYXRjaENvbmZpZyh0Tm9kZSwgVE5vZGVGbGFncy5oYXNJbml0aWFsU3R5bGluZyk7XG4gIH1cbn1cblxuLyoqXG4gKiBSdW5zIHRocm91Z2ggdGhlIHByb3ZpZGVkIHN0eWxpbmcgY29udGV4dCBhbmQgYXBwbGllcyBlYWNoIHZhbHVlIHRvXG4gKiB0aGUgcHJvdmlkZWQgZWxlbWVudCAodmlhIHRoZSByZW5kZXJlcikgaWYgb25lIG9yIG1vcmUgdmFsdWVzIGFyZSBwcmVzZW50LlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gd2lsbCBpdGVyYXRlIG92ZXIgYWxsIGVudHJpZXMgcHJlc2VudCBpbiB0aGUgcHJvdmlkZWRcbiAqIGBUU3R5bGluZ0NvbnRleHRgIGFycmF5IChib3RoIHByb3AtYmFzZWQgYW5kIG1hcC1iYXNlZCBiaW5kaW5ncykuLVxuICpcbiAqIEVhY2ggZW50cnksIHdpdGhpbiB0aGUgYFRTdHlsaW5nQ29udGV4dGAgYXJyYXksIGlzIHN0b3JlZCBhbHBoYWJldGljYWxseVxuICogYW5kIHRoaXMgbWVhbnMgdGhhdCBlYWNoIHByb3AvdmFsdWUgZW50cnkgd2lsbCBiZSBhcHBsaWVkIGluIG9yZGVyXG4gKiAoc28gbG9uZyBhcyBpdCBpcyBtYXJrZWQgZGlydHkgaW4gdGhlIHByb3ZpZGVkIGBiaXRNYXNrYCB2YWx1ZSkuXG4gKlxuICogSWYgdGhlcmUgYXJlIGFueSBtYXAtYmFzZWQgZW50cmllcyBwcmVzZW50ICh3aGljaCBhcmUgYXBwbGllZCB0byB0aGVcbiAqIGVsZW1lbnQgdmlhIHRoZSBgW3N0eWxlXWAgYW5kIGBbY2xhc3NdYCBiaW5kaW5ncykgdGhlbiB0aG9zZSBlbnRyaWVzXG4gKiB3aWxsIGJlIGFwcGxpZWQgYXMgd2VsbC4gSG93ZXZlciwgdGhlIGNvZGUgZm9yIHRoYXQgaXMgbm90IGEgcGFydCBvZlxuICogdGhpcyBmdW5jdGlvbi4gSW5zdGVhZCwgZWFjaCB0aW1lIGEgcHJvcGVydHkgaXMgdmlzaXRlZCwgdGhlbiB0aGVcbiAqIGNvZGUgYmVsb3cgd2lsbCBjYWxsIGFuIGV4dGVybmFsIGZ1bmN0aW9uIGNhbGxlZCBgc3R5bGluZ01hcHNTeW5jRm5gXG4gKiBhbmQsIGlmIHByZXNlbnQsIGl0IHdpbGwga2VlcCB0aGUgYXBwbGljYXRpb24gb2Ygc3R5bGluZyB2YWx1ZXMgaW5cbiAqIG1hcC1iYXNlZCBiaW5kaW5ncyB1cCB0byBzeW5jIHdpdGggdGhlIGFwcGxpY2F0aW9uIG9mIHByb3AtYmFzZWRcbiAqIGJpbmRpbmdzLlxuICpcbiAqIFZpc2l0IGBzdHlsaW5nL21hcF9iYXNlZF9iaW5kaW5ncy50c2AgdG8gbGVhcm4gbW9yZSBhYm91dCBob3cgdGhlXG4gKiBhbGdvcml0aG0gd29ya3MgZm9yIG1hcC1iYXNlZCBzdHlsaW5nIGJpbmRpbmdzLlxuICpcbiAqIE5vdGUgdGhhdCB0aGlzIGZ1bmN0aW9uIGlzIG5vdCBkZXNpZ25lZCB0byBiZSBjYWxsZWQgaW4gaXNvbGF0aW9uICh1c2VcbiAqIHRoZSBgZmx1c2hTdHlsaW5nYCBmdW5jdGlvbiBzbyB0aGF0IGl0IGNhbiBjYWxsIHRoaXMgZnVuY3Rpb24gZm9yIGJvdGhcbiAqIHRoZSBzdHlsZXMgYW5kIGNsYXNzZXMgY29udGV4dHMpLlxuICovXG5leHBvcnQgZnVuY3Rpb24gYXBwbHlTdHlsaW5nVmlhQ29udGV4dChcbiAgICBjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQsIHROb2RlOiBUU3R5bGluZ05vZGUsIHJlbmRlcmVyOiBSZW5kZXJlcjMgfCBQcm9jZWR1cmFsUmVuZGVyZXIzIHwgbnVsbCxcbiAgICBlbGVtZW50OiBSRWxlbWVudCwgYmluZGluZ0RhdGE6IExTdHlsaW5nRGF0YSwgYml0TWFza1ZhbHVlOiBudW1iZXIgfCBib29sZWFuLFxuICAgIGFwcGx5U3R5bGluZ0ZuOiBBcHBseVN0eWxpbmdGbiwgc2FuaXRpemVyOiBTdHlsZVNhbml0aXplRm4gfCBudWxsLCBob3N0QmluZGluZ3NNb2RlOiBib29sZWFuLFxuICAgIGlzQ2xhc3NCYXNlZDogYm9vbGVhbik6IHZvaWQge1xuICBjb25zdCBiaXRNYXNrID0gbm9ybWFsaXplQml0TWFza1ZhbHVlKGJpdE1hc2tWYWx1ZSk7XG5cbiAgbGV0IHN0eWxpbmdNYXBzU3luY0ZuOiBTeW5jU3R5bGluZ01hcHNGbnxudWxsID0gbnVsbDtcbiAgbGV0IGFwcGx5QWxsVmFsdWVzID0gZmFsc2U7XG4gIGNvbnN0IG1hcEJpbmRpbmdzRmxhZyA9XG4gICAgICBpc0NsYXNzQmFzZWQgPyBUTm9kZUZsYWdzLmhhc0NsYXNzTWFwQmluZGluZ3MgOiBUTm9kZUZsYWdzLmhhc1N0eWxlTWFwQmluZGluZ3M7XG4gIGlmIChoYXNDb25maWcodE5vZGUsIG1hcEJpbmRpbmdzRmxhZykpIHtcbiAgICBzdHlsaW5nTWFwc1N5bmNGbiA9IGdldFN0eWxpbmdNYXBzU3luY0ZuKCk7XG4gICAgY29uc3QgbWFwc0d1YXJkTWFzayA9XG4gICAgICAgIGdldEd1YXJkTWFzayhjb250ZXh0LCBUU3R5bGluZ0NvbnRleHRJbmRleC5WYWx1ZXNTdGFydFBvc2l0aW9uLCBob3N0QmluZGluZ3NNb2RlKTtcbiAgICBhcHBseUFsbFZhbHVlcyA9IChiaXRNYXNrICYgbWFwc0d1YXJkTWFzaykgIT09IDA7XG4gIH1cblxuICBjb25zdCB2YWx1ZXNDb3VudCA9IGdldFZhbHVlc0NvdW50KGNvbnRleHQpO1xuICBsZXQgdG90YWxCaW5kaW5nc1RvVmlzaXQgPSAxO1xuICBsZXQgbWFwc01vZGUgPVxuICAgICAgYXBwbHlBbGxWYWx1ZXMgPyBTdHlsaW5nTWFwc1N5bmNNb2RlLkFwcGx5QWxsVmFsdWVzIDogU3R5bGluZ01hcHNTeW5jTW9kZS5UcmF2ZXJzZVZhbHVlcztcbiAgaWYgKGhvc3RCaW5kaW5nc01vZGUpIHtcbiAgICBtYXBzTW9kZSB8PSBTdHlsaW5nTWFwc1N5bmNNb2RlLlJlY3Vyc2VJbm5lck1hcHM7XG4gICAgdG90YWxCaW5kaW5nc1RvVmlzaXQgPSB2YWx1ZXNDb3VudCAtIDE7XG4gIH1cblxuICBsZXQgaSA9IGdldFByb3BWYWx1ZXNTdGFydFBvc2l0aW9uKGNvbnRleHQsIHROb2RlLCBpc0NsYXNzQmFzZWQpO1xuICB3aGlsZSAoaSA8IGNvbnRleHQubGVuZ3RoKSB7XG4gICAgY29uc3QgZ3VhcmRNYXNrID0gZ2V0R3VhcmRNYXNrKGNvbnRleHQsIGksIGhvc3RCaW5kaW5nc01vZGUpO1xuICAgIGlmIChiaXRNYXNrICYgZ3VhcmRNYXNrKSB7XG4gICAgICBsZXQgdmFsdWVBcHBsaWVkID0gZmFsc2U7XG4gICAgICBjb25zdCBwcm9wID0gZ2V0UHJvcChjb250ZXh0LCBpKTtcbiAgICAgIGNvbnN0IGRlZmF1bHRWYWx1ZSA9IGdldERlZmF1bHRWYWx1ZShjb250ZXh0LCBpKTtcblxuICAgICAgLy8gUGFydCAxOiBWaXNpdCB0aGUgYFtzdHlsaW5nLnByb3BdYCB2YWx1ZVxuICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCB0b3RhbEJpbmRpbmdzVG9WaXNpdDsgaisrKSB7XG4gICAgICAgIGNvbnN0IGJpbmRpbmdJbmRleCA9IGdldEJpbmRpbmdWYWx1ZShjb250ZXh0LCBpLCBqKSBhcyBudW1iZXI7XG4gICAgICAgIGlmICghdmFsdWVBcHBsaWVkICYmIGJpbmRpbmdJbmRleCAhPT0gMCkge1xuICAgICAgICAgIGNvbnN0IHZhbHVlID0gZ2V0VmFsdWUoYmluZGluZ0RhdGEsIGJpbmRpbmdJbmRleCk7XG4gICAgICAgICAgaWYgKGlzU3R5bGluZ1ZhbHVlRGVmaW5lZCh2YWx1ZSkpIHtcbiAgICAgICAgICAgIGNvbnN0IGNoZWNrVmFsdWVPbmx5ID0gaG9zdEJpbmRpbmdzTW9kZSAmJiBqID09PSAwO1xuICAgICAgICAgICAgaWYgKCFjaGVja1ZhbHVlT25seSkge1xuICAgICAgICAgICAgICBjb25zdCBmaW5hbFZhbHVlID0gc2FuaXRpemVyICYmIGlzU2FuaXRpemF0aW9uUmVxdWlyZWQoY29udGV4dCwgaSkgP1xuICAgICAgICAgICAgICAgICAgc2FuaXRpemVyKHByb3AsIHZhbHVlLCBTdHlsZVNhbml0aXplTW9kZS5TYW5pdGl6ZU9ubHkpIDpcbiAgICAgICAgICAgICAgICAgIHVud3JhcFNhZmVWYWx1ZSh2YWx1ZSk7XG4gICAgICAgICAgICAgIGFwcGx5U3R5bGluZ0ZuKHJlbmRlcmVyLCBlbGVtZW50LCBwcm9wLCBmaW5hbFZhbHVlLCBiaW5kaW5nSW5kZXgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFsdWVBcHBsaWVkID0gdHJ1ZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBQYXJ0IDI6IFZpc2l0IHRoZSBgW3N0eWxlXWAgb3IgYFtjbGFzc11gIG1hcC1iYXNlZCB2YWx1ZVxuICAgICAgICBpZiAoc3R5bGluZ01hcHNTeW5jRm4pIHtcbiAgICAgICAgICAvLyBkZXRlcm1pbmUgd2hldGhlciBvciBub3QgdG8gYXBwbHkgdGhlIHRhcmdldCBwcm9wZXJ0eSBvciB0byBza2lwIGl0XG4gICAgICAgICAgbGV0IG1vZGUgPSBtYXBzTW9kZSB8ICh2YWx1ZUFwcGxpZWQgPyBTdHlsaW5nTWFwc1N5bmNNb2RlLlNraXBUYXJnZXRQcm9wIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFN0eWxpbmdNYXBzU3luY01vZGUuQXBwbHlUYXJnZXRQcm9wKTtcblxuICAgICAgICAgIC8vIHRoZSBmaXJzdCBjb2x1bW4gaW4gdGhlIGNvbnRleHQgKHdoZW4gYGogPT0gMGApIGlzIHNwZWNpYWwtY2FzZWQgZm9yXG4gICAgICAgICAgLy8gdGVtcGxhdGUgYmluZGluZ3MuIElmIGFuZCB3aGVuIGhvc3QgYmluZGluZ3MgYXJlIGJlaW5nIHByb2Nlc3NlZCB0aGVuXG4gICAgICAgICAgLy8gdGhlIGZpcnN0IGNvbHVtbiB3aWxsIHN0aWxsIGJlIGl0ZXJhdGVkIG92ZXIsIGJ1dCB0aGUgdmFsdWVzIHdpbGwgb25seVxuICAgICAgICAgIC8vIGJlIGNoZWNrZWQgYWdhaW5zdCAobm90IGFwcGxpZWQpLiBJZiBhbmQgd2hlbiB0aGlzIGhhcHBlbnMgd2UgbmVlZCB0b1xuICAgICAgICAgIC8vIG5vdGlmeSB0aGUgbWFwLWJhc2VkIHN5bmNpbmcgY29kZSB0byBrbm93IG5vdCB0byBhcHBseSB0aGUgdmFsdWVzIGl0XG4gICAgICAgICAgLy8gY29tZXMgYWNyb3NzIGluIHRoZSB2ZXJ5IGZpcnN0IG1hcC1iYXNlZCBiaW5kaW5nICh3aGljaCBpcyBhbHNvIGxvY2F0ZWRcbiAgICAgICAgICAvLyBpbiBjb2x1bW4gemVybykuXG4gICAgICAgICAgaWYgKGhvc3RCaW5kaW5nc01vZGUgJiYgaiA9PT0gMCkge1xuICAgICAgICAgICAgbW9kZSB8PSBTdHlsaW5nTWFwc1N5bmNNb2RlLkNoZWNrVmFsdWVzT25seTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBjb25zdCB2YWx1ZUFwcGxpZWRXaXRoaW5NYXAgPSBzdHlsaW5nTWFwc1N5bmNGbihcbiAgICAgICAgICAgICAgY29udGV4dCwgcmVuZGVyZXIsIGVsZW1lbnQsIGJpbmRpbmdEYXRhLCBqLCBhcHBseVN0eWxpbmdGbiwgc2FuaXRpemVyLCBtb2RlLCBwcm9wLFxuICAgICAgICAgICAgICBkZWZhdWx0VmFsdWUpO1xuICAgICAgICAgIHZhbHVlQXBwbGllZCA9IHZhbHVlQXBwbGllZCB8fCB2YWx1ZUFwcGxpZWRXaXRoaW5NYXA7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gUGFydCAzOiBhcHBseSB0aGUgZGVmYXVsdCB2YWx1ZSAoZS5nLiBgPGRpdiBzdHlsZT1cIndpZHRoOjIwMFwiPmAgPT4gYDIwMHB4YCBnZXRzIGFwcGxpZWQpXG4gICAgICAvLyBpZiB0aGUgdmFsdWUgaGFzIG5vdCB5ZXQgYmVlbiBhcHBsaWVkIHRoZW4gYSB0cnV0aHkgdmFsdWUgZG9lcyBub3QgZXhpc3QgaW4gdGhlXG4gICAgICAvLyBwcm9wLWJhc2VkIG9yIG1hcC1iYXNlZCBiaW5kaW5ncyBjb2RlLiBJZiBhbmQgd2hlbiB0aGlzIGhhcHBlbnMsIGp1c3QgYXBwbHkgdGhlXG4gICAgICAvLyBkZWZhdWx0IHZhbHVlIChldmVuIGlmIHRoZSBkZWZhdWx0IHZhbHVlIGlzIGBudWxsYCkuXG4gICAgICBpZiAoIXZhbHVlQXBwbGllZCkge1xuICAgICAgICBhcHBseVN0eWxpbmdGbihyZW5kZXJlciwgZWxlbWVudCwgcHJvcCwgZGVmYXVsdFZhbHVlKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpICs9IFRTdHlsaW5nQ29udGV4dEluZGV4LkJpbmRpbmdzU3RhcnRPZmZzZXQgKyB2YWx1ZXNDb3VudDtcbiAgfVxuXG4gIC8vIHRoZSBtYXAtYmFzZWQgc3R5bGluZyBlbnRyaWVzIG1heSBoYXZlIG5vdCBhcHBsaWVkIGFsbCB0aGVpclxuICAvLyB2YWx1ZXMuIEZvciB0aGlzIHJlYXNvbiwgb25lIG1vcmUgY2FsbCB0byB0aGUgc3luYyBmdW5jdGlvblxuICAvLyBuZWVkcyB0byBiZSBpc3N1ZWQgYXQgdGhlIGVuZC5cbiAgaWYgKHN0eWxpbmdNYXBzU3luY0ZuKSB7XG4gICAgaWYgKGhvc3RCaW5kaW5nc01vZGUpIHtcbiAgICAgIG1hcHNNb2RlIHw9IFN0eWxpbmdNYXBzU3luY01vZGUuQ2hlY2tWYWx1ZXNPbmx5O1xuICAgIH1cbiAgICBzdHlsaW5nTWFwc1N5bmNGbihcbiAgICAgICAgY29udGV4dCwgcmVuZGVyZXIsIGVsZW1lbnQsIGJpbmRpbmdEYXRhLCAwLCBhcHBseVN0eWxpbmdGbiwgc2FuaXRpemVyLCBtYXBzTW9kZSk7XG4gIH1cbn1cblxuLyoqXG4gKiBBcHBsaWVzIHRoZSBwcm92aWRlZCBzdHlsaW5nIG1hcCB0byB0aGUgZWxlbWVudCBkaXJlY3RseSAod2l0aG91dCBjb250ZXh0IHJlc29sdXRpb24pLlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gaXMgZGVzaWduZWQgdG8gYmUgcnVuIGZyb20gdGhlIHN0eWxpbmcgaW5zdHJ1Y3Rpb25zIGFuZCB3aWxsIGJlIGNhbGxlZFxuICogYXV0b21hdGljYWxseS4gVGhpcyBmdW5jdGlvbiBpcyBpbnRlbmRlZCB0byBiZSB1c2VkIGZvciBwZXJmb3JtYW5jZSByZWFzb25zIGluIHRoZVxuICogZXZlbnQgdGhhdCB0aGVyZSBpcyBubyBuZWVkIHRvIGFwcGx5IHN0eWxpbmcgdmlhIGNvbnRleHQgcmVzb2x1dGlvbi5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIGhhcyB0aHJlZSBkaWZmZXJlbnQgY2FzZXMgdGhhdCBjYW4gb2NjdXIgKGZvciBlYWNoIGl0ZW0gaW4gdGhlIG1hcCk6XG4gKlxuICogLSBDYXNlIDE6IEF0dGVtcHQgdG8gYXBwbHkgdGhlIGN1cnJlbnQgdmFsdWUgaW4gdGhlIG1hcCB0byB0aGUgZWxlbWVudCAoaWYgaXQncyBgbm9uIG51bGxgKS5cbiAqXG4gKiAtIENhc2UgMjogSWYgYSBtYXAgdmFsdWUgZmFpbHMgdG8gYmUgYXBwbGllZCB0aGVuIHRoZSBhbGdvcml0aG0gd2lsbCBmaW5kIGEgbWF0Y2hpbmcgZW50cnkgaW5cbiAqICAgICAgICAgICB0aGUgaW5pdGlhbCB2YWx1ZXMgcHJlc2VudCBpbiB0aGUgY29udGV4dCBhbmQgYXR0ZW1wdCB0byBhcHBseSB0aGF0LlxuICpcbiAqIC0gRGVmYXVsdCBDYXNlOiBJZiB0aGUgaW5pdGlhbCB2YWx1ZSBjYW5ub3QgYmUgYXBwbGllZCB0aGVuIGEgZGVmYXVsdCB2YWx1ZSBvZiBgbnVsbGAgd2lsbCBiZVxuICogICAgICAgICAgICAgICAgIGFwcGxpZWQgKHdoaWNoIHdpbGwgcmVtb3ZlIHRoZSBzdHlsZS9jbGFzcyB2YWx1ZSBmcm9tIHRoZSBlbGVtZW50KS5cbiAqXG4gKiBTZWUgYGFsbG93RGlyZWN0U3R5bGluZ0FwcGx5YCB0byBsZWFybiB0aGUgbG9naWMgdXNlZCB0byBkZXRlcm1pbmUgd2hldGhlciBhbnkgc3R5bGUvY2xhc3NcbiAqIGJpbmRpbmdzIGNhbiBiZSBkaXJlY3RseSBhcHBsaWVkLlxuICpcbiAqIEByZXR1cm5zIHdoZXRoZXIgb3Igbm90IHRoZSBzdHlsaW5nIG1hcCB3YXMgYXBwbGllZCB0byB0aGUgZWxlbWVudC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFwcGx5U3R5bGluZ01hcERpcmVjdGx5KFxuICAgIHJlbmRlcmVyOiBhbnksIGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCwgdE5vZGU6IFRTdHlsaW5nTm9kZSwgZWxlbWVudDogUkVsZW1lbnQsXG4gICAgZGF0YTogTFN0eWxpbmdEYXRhLCBiaW5kaW5nSW5kZXg6IG51bWJlciwgdmFsdWU6IHtba2V5OiBzdHJpbmddOiBhbnl9IHwgc3RyaW5nIHwgbnVsbCxcbiAgICBpc0NsYXNzQmFzZWQ6IGJvb2xlYW4sIHNhbml0aXplcjogU3R5bGVTYW5pdGl6ZUZuIHwgbnVsbCwgZm9yY2VVcGRhdGU6IGJvb2xlYW4sXG4gICAgYmluZGluZ1ZhbHVlQ29udGFpbnNJbml0aWFsOiBib29sZWFuKTogdm9pZCB7XG4gIGNvbnN0IG9sZFZhbHVlID0gZ2V0VmFsdWUoZGF0YSwgYmluZGluZ0luZGV4KTtcbiAgaWYgKGZvcmNlVXBkYXRlIHx8IGhhc1ZhbHVlQ2hhbmdlZChvbGRWYWx1ZSwgdmFsdWUpKSB7XG4gICAgY29uc3QgaGFzSW5pdGlhbCA9IGhhc0NvbmZpZyh0Tm9kZSwgVE5vZGVGbGFncy5oYXNJbml0aWFsU3R5bGluZyk7XG4gICAgY29uc3QgaW5pdGlhbFZhbHVlID1cbiAgICAgICAgaGFzSW5pdGlhbCAmJiAhYmluZGluZ1ZhbHVlQ29udGFpbnNJbml0aWFsID8gZ2V0SW5pdGlhbFN0eWxpbmdWYWx1ZShjb250ZXh0KSA6IG51bGw7XG4gICAgc2V0VmFsdWUoZGF0YSwgYmluZGluZ0luZGV4LCB2YWx1ZSk7XG5cbiAgICAvLyB0aGUgY2FjaGVkIHZhbHVlIGlzIHRoZSBsYXN0IHNuYXBzaG90IG9mIHRoZSBzdHlsZSBvciBjbGFzc1xuICAgIC8vIGF0dHJpYnV0ZSB2YWx1ZSBhbmQgaXMgdXNlZCBpbiB0aGUgaWYgc3RhdGVtZW50IGJlbG93IHRvXG4gICAgLy8ga2VlcCB0cmFjayBvZiBpbnRlcm5hbC9leHRlcm5hbCBjaGFuZ2VzLlxuICAgIGNvbnN0IGNhY2hlZFZhbHVlSW5kZXggPSBiaW5kaW5nSW5kZXggKyAxO1xuICAgIGxldCBjYWNoZWRWYWx1ZSA9IGdldFZhbHVlKGRhdGEsIGNhY2hlZFZhbHVlSW5kZXgpO1xuICAgIGlmIChjYWNoZWRWYWx1ZSA9PT0gTk9fQ0hBTkdFKSB7XG4gICAgICBjYWNoZWRWYWx1ZSA9IGluaXRpYWxWYWx1ZTtcbiAgICB9XG4gICAgY2FjaGVkVmFsdWUgPSB0eXBlb2YgY2FjaGVkVmFsdWUgIT09ICdzdHJpbmcnID8gJycgOiBjYWNoZWRWYWx1ZTtcblxuICAgIC8vIElmIGEgY2xhc3Mvc3R5bGUgdmFsdWUgd2FzIG1vZGlmaWVkIGV4dGVybmFsbHkgdGhlbiB0aGUgc3R5bGluZ1xuICAgIC8vIGZhc3QgcGFzcyBjYW5ub3QgZ3VhcmFudGVlIHRoYXQgdGhlIGV4dGVybmFsIHZhbHVlcyBhcmUgcmV0YWluZWQuXG4gICAgLy8gV2hlbiB0aGlzIGhhcHBlbnMsIHRoZSBhbGdvcml0aG0gd2lsbCBiYWlsIG91dCBhbmQgbm90IHdyaXRlIHRvXG4gICAgLy8gdGhlIHN0eWxlIG9yIGNsYXNzTmFtZSBhdHRyaWJ1dGUgZGlyZWN0bHkuXG4gICAgY29uc3QgcHJvcEJpbmRpbmdzRmxhZyA9XG4gICAgICAgIGlzQ2xhc3NCYXNlZCA/IFROb2RlRmxhZ3MuaGFzQ2xhc3NQcm9wQmluZGluZ3MgOiBUTm9kZUZsYWdzLmhhc1N0eWxlUHJvcEJpbmRpbmdzO1xuICAgIGxldCB3cml0ZVRvQXR0ckRpcmVjdGx5ID0gIWhhc0NvbmZpZyh0Tm9kZSwgcHJvcEJpbmRpbmdzRmxhZyk7XG4gICAgaWYgKHdyaXRlVG9BdHRyRGlyZWN0bHkgJiZcbiAgICAgICAgY2hlY2tJZkV4dGVybmFsbHlNb2RpZmllZChlbGVtZW50IGFzIEhUTUxFbGVtZW50LCBjYWNoZWRWYWx1ZSwgaXNDbGFzc0Jhc2VkKSkge1xuICAgICAgd3JpdGVUb0F0dHJEaXJlY3RseSA9IGZhbHNlO1xuICAgICAgaWYgKG9sZFZhbHVlICE9PSBWQUxVRV9JU19FWFRFUk5BTExZX01PRElGSUVEKSB7XG4gICAgICAgIC8vIGRpcmVjdCBzdHlsaW5nIHdpbGwgcmVzZXQgdGhlIGF0dHJpYnV0ZSBlbnRpcmVseSBlYWNoIHRpbWUsXG4gICAgICAgIC8vIGFuZCwgZm9yIHRoaXMgcmVhc29uLCBpZiB0aGUgYWxnb3JpdGhtIGRlY2lkZXMgaXQgY2Fubm90XG4gICAgICAgIC8vIHdyaXRlIHRvIHRoZSBjbGFzcy9zdHlsZSBhdHRyaWJ1dGVzIGRpcmVjdGx5IHRoZW4gaXQgbXVzdFxuICAgICAgICAvLyByZXNldCBhbGwgdGhlIHByZXZpb3VzIHN0eWxlL2NsYXNzIHZhbHVlcyBiZWZvcmUgaXQgc3RhcnRzXG4gICAgICAgIC8vIHRvIGFwcGx5IHZhbHVlcyBpbiB0aGUgbm9uLWRpcmVjdCB3YXkuXG4gICAgICAgIHJlbW92ZVN0eWxpbmdWYWx1ZXMocmVuZGVyZXIsIGVsZW1lbnQsIG9sZFZhbHVlLCBpc0NsYXNzQmFzZWQpO1xuXG4gICAgICAgIC8vIHRoaXMgd2lsbCBpbnN0cnVjdCB0aGUgYWxnb3JpdGhtIG5vdCB0byBhcHBseSBjbGFzcyBvciBzdHlsZVxuICAgICAgICAvLyB2YWx1ZXMgZGlyZWN0bHkgYW55bW9yZS5cbiAgICAgICAgc2V0VmFsdWUoZGF0YSwgY2FjaGVkVmFsdWVJbmRleCwgVkFMVUVfSVNfRVhURVJOQUxMWV9NT0RJRklFRCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHdyaXRlVG9BdHRyRGlyZWN0bHkpIHtcbiAgICAgIGNvbnN0IGluaXRpYWxWYWx1ZSA9XG4gICAgICAgICAgaGFzSW5pdGlhbCAmJiAhYmluZGluZ1ZhbHVlQ29udGFpbnNJbml0aWFsID8gZ2V0SW5pdGlhbFN0eWxpbmdWYWx1ZShjb250ZXh0KSA6IG51bGw7XG4gICAgICBjb25zdCB2YWx1ZVRvQXBwbHkgPVxuICAgICAgICAgIHdyaXRlU3R5bGluZ1ZhbHVlRGlyZWN0bHkocmVuZGVyZXIsIGVsZW1lbnQsIHZhbHVlLCBpc0NsYXNzQmFzZWQsIGluaXRpYWxWYWx1ZSk7XG4gICAgICBzZXRWYWx1ZShkYXRhLCBjYWNoZWRWYWx1ZUluZGV4LCB2YWx1ZVRvQXBwbHkgfHwgbnVsbCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IGFwcGx5Rm4gPSBpc0NsYXNzQmFzZWQgPyBzZXRDbGFzcyA6IHNldFN0eWxlO1xuICAgICAgY29uc3QgbWFwID0gbm9ybWFsaXplSW50b1N0eWxpbmdNYXAob2xkVmFsdWUsIHZhbHVlLCAhaXNDbGFzc0Jhc2VkKTtcbiAgICAgIGNvbnN0IGluaXRpYWxTdHlsZXMgPSBoYXNJbml0aWFsID8gZ2V0U3R5bGluZ01hcEFycmF5KGNvbnRleHQpIDogbnVsbDtcblxuICAgICAgZm9yIChsZXQgaSA9IFN0eWxpbmdNYXBBcnJheUluZGV4LlZhbHVlc1N0YXJ0UG9zaXRpb247IGkgPCBtYXAubGVuZ3RoO1xuICAgICAgICAgICBpICs9IFN0eWxpbmdNYXBBcnJheUluZGV4LlR1cGxlU2l6ZSkge1xuICAgICAgICBjb25zdCBwcm9wID0gZ2V0TWFwUHJvcChtYXAsIGkpO1xuICAgICAgICBjb25zdCB2YWx1ZSA9IGdldE1hcFZhbHVlKG1hcCwgaSk7XG5cbiAgICAgICAgLy8gY2FzZSAxOiBhcHBseSB0aGUgbWFwIHZhbHVlIChpZiBpdCBleGlzdHMpXG4gICAgICAgIGxldCBhcHBsaWVkID1cbiAgICAgICAgICAgIGFwcGx5U3R5bGluZ1ZhbHVlKHJlbmRlcmVyLCBlbGVtZW50LCBwcm9wLCB2YWx1ZSwgYXBwbHlGbiwgYmluZGluZ0luZGV4LCBzYW5pdGl6ZXIpO1xuXG4gICAgICAgIC8vIGNhc2UgMjogYXBwbHkgdGhlIGluaXRpYWwgdmFsdWUgKGlmIGl0IGV4aXN0cylcbiAgICAgICAgaWYgKCFhcHBsaWVkICYmIGluaXRpYWxTdHlsZXMpIHtcbiAgICAgICAgICBhcHBsaWVkID0gZmluZEFuZEFwcGx5TWFwVmFsdWUoXG4gICAgICAgICAgICAgIHJlbmRlcmVyLCBlbGVtZW50LCBhcHBseUZuLCBpbml0aWFsU3R5bGVzLCBwcm9wLCBiaW5kaW5nSW5kZXgsIHNhbml0aXplcik7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBkZWZhdWx0IGNhc2U6IGFwcGx5IGBudWxsYCB0byByZW1vdmUgdGhlIHZhbHVlXG4gICAgICAgIGlmICghYXBwbGllZCkge1xuICAgICAgICAgIGFwcGx5Rm4ocmVuZGVyZXIsIGVsZW1lbnQsIHByb3AsIG51bGwsIGJpbmRpbmdJbmRleCk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgY29uc3Qgc3RhdGUgPSBnZXRTdHlsaW5nU3RhdGUoZWxlbWVudCwgVEVNUExBVEVfRElSRUNUSVZFX0lOREVYKTtcbiAgICAgIGlmIChpc0NsYXNzQmFzZWQpIHtcbiAgICAgICAgc3RhdGUubGFzdERpcmVjdENsYXNzTWFwID0gbWFwO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc3RhdGUubGFzdERpcmVjdFN0eWxlTWFwID0gbWFwO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gd3JpdGVTdHlsaW5nVmFsdWVEaXJlY3RseShcbiAgICByZW5kZXJlcjogYW55LCBlbGVtZW50OiBSRWxlbWVudCwgdmFsdWU6IHtba2V5OiBzdHJpbmddOiBhbnl9IHwgc3RyaW5nIHwgbnVsbCxcbiAgICBpc0NsYXNzQmFzZWQ6IGJvb2xlYW4sIGluaXRpYWxWYWx1ZTogc3RyaW5nIHwgbnVsbCk6IHN0cmluZyB7XG4gIGxldCB2YWx1ZVRvQXBwbHk6IHN0cmluZztcbiAgaWYgKGlzQ2xhc3NCYXNlZCkge1xuICAgIHZhbHVlVG9BcHBseSA9IHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycgPyB2YWx1ZSA6IG9iamVjdFRvQ2xhc3NOYW1lKHZhbHVlKTtcbiAgICBpZiAoaW5pdGlhbFZhbHVlICE9PSBudWxsKSB7XG4gICAgICB2YWx1ZVRvQXBwbHkgPSBjb25jYXRTdHJpbmcoaW5pdGlhbFZhbHVlLCB2YWx1ZVRvQXBwbHksICcgJyk7XG4gICAgfVxuICAgIHNldENsYXNzTmFtZShyZW5kZXJlciwgZWxlbWVudCwgdmFsdWVUb0FwcGx5KTtcbiAgfSBlbHNlIHtcbiAgICB2YWx1ZVRvQXBwbHkgPSBmb3JjZVN0eWxlc0FzU3RyaW5nKHZhbHVlLCB0cnVlKTtcbiAgICBpZiAoaW5pdGlhbFZhbHVlICE9PSBudWxsKSB7XG4gICAgICB2YWx1ZVRvQXBwbHkgPSBpbml0aWFsVmFsdWUgKyAnOycgKyB2YWx1ZVRvQXBwbHk7XG4gICAgfVxuICAgIHNldFN0eWxlQXR0cihyZW5kZXJlciwgZWxlbWVudCwgdmFsdWVUb0FwcGx5KTtcbiAgfVxuICByZXR1cm4gdmFsdWVUb0FwcGx5O1xufVxuXG4vKipcbiAqIEFwcGxpZXMgdGhlIHByb3ZpZGVkIHN0eWxpbmcgcHJvcC92YWx1ZSB0byB0aGUgZWxlbWVudCBkaXJlY3RseSAod2l0aG91dCBjb250ZXh0IHJlc29sdXRpb24pLlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gaXMgZGVzaWduZWQgdG8gYmUgcnVuIGZyb20gdGhlIHN0eWxpbmcgaW5zdHJ1Y3Rpb25zIGFuZCB3aWxsIGJlIGNhbGxlZFxuICogYXV0b21hdGljYWxseS4gVGhpcyBmdW5jdGlvbiBpcyBpbnRlbmRlZCB0byBiZSB1c2VkIGZvciBwZXJmb3JtYW5jZSByZWFzb25zIGluIHRoZVxuICogZXZlbnQgdGhhdCB0aGVyZSBpcyBubyBuZWVkIHRvIGFwcGx5IHN0eWxpbmcgdmlhIGNvbnRleHQgcmVzb2x1dGlvbi5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIGhhcyBmb3VyIGRpZmZlcmVudCBjYXNlcyB0aGF0IGNhbiBvY2N1cjpcbiAqXG4gKiAtIENhc2UgMTogQXBwbHkgdGhlIHByb3ZpZGVkIHByb3AvdmFsdWUgKHN0eWxlIG9yIGNsYXNzKSBlbnRyeSB0byB0aGUgZWxlbWVudFxuICogICAgICAgICAgIChpZiBpdCBpcyBgbm9uIG51bGxgKS5cbiAqXG4gKiAtIENhc2UgMjogSWYgdmFsdWUgZG9lcyBub3QgZ2V0IGFwcGxpZWQgKGJlY2F1c2UgaXRzIGBudWxsYCBvciBgdW5kZWZpbmVkYCkgdGhlbiB0aGUgYWxnb3JpdGhtXG4gKiAgICAgICAgICAgd2lsbCBjaGVjayB0byBzZWUgaWYgYSBzdHlsaW5nIG1hcCB2YWx1ZSB3YXMgYXBwbGllZCB0byB0aGUgZWxlbWVudCBhcyB3ZWxsIGp1c3RcbiAqICAgICAgICAgICBiZWZvcmUgdGhpcyAodmlhIGBzdHlsZU1hcGAgb3IgYGNsYXNzTWFwYCkuIElmIGFuZCB3aGVuIGEgbWFwIGlzIHByZXNlbnQgdGhlbiB0aGVcbiAgKiAgICAgICAgICBhbGdvcml0aG0gd2lsbCBmaW5kIHRoZSBtYXRjaGluZyBwcm9wZXJ0eSBpbiB0aGUgbWFwIGFuZCBhcHBseSBpdHMgdmFsdWUuXG4gICpcbiAqIC0gQ2FzZSAzOiBJZiBhIG1hcCB2YWx1ZSBmYWlscyB0byBiZSBhcHBsaWVkIHRoZW4gdGhlIGFsZ29yaXRobSB3aWxsIGNoZWNrIHRvIHNlZSBpZiB0aGVyZVxuICogICAgICAgICAgIGFyZSBhbnkgaW5pdGlhbCB2YWx1ZXMgcHJlc2VudCBhbmQgYXR0ZW1wdCB0byBhcHBseSBhIG1hdGNoaW5nIHZhbHVlIGJhc2VkIG9uXG4gKiAgICAgICAgICAgdGhlIHRhcmdldCBwcm9wLlxuICpcbiAqIC0gRGVmYXVsdCBDYXNlOiBJZiBhIG1hdGNoaW5nIGluaXRpYWwgdmFsdWUgY2Fubm90IGJlIGFwcGxpZWQgdGhlbiBhIGRlZmF1bHQgdmFsdWVcbiAqICAgICAgICAgICAgICAgICBvZiBgbnVsbGAgd2lsbCBiZSBhcHBsaWVkICh3aGljaCB3aWxsIHJlbW92ZSB0aGUgc3R5bGUvY2xhc3MgdmFsdWVcbiAqICAgICAgICAgICAgICAgICBmcm9tIHRoZSBlbGVtZW50KS5cbiAqXG4gKiBTZWUgYGFsbG93RGlyZWN0U3R5bGluZ0FwcGx5YCB0byBsZWFybiB0aGUgbG9naWMgdXNlZCB0byBkZXRlcm1pbmUgd2hldGhlciBhbnkgc3R5bGUvY2xhc3NcbiAqIGJpbmRpbmdzIGNhbiBiZSBkaXJlY3RseSBhcHBsaWVkLlxuICpcbiAqIEByZXR1cm5zIHdoZXRoZXIgb3Igbm90IHRoZSBwcm9wL3ZhbHVlIHN0eWxpbmcgd2FzIGFwcGxpZWQgdG8gdGhlIGVsZW1lbnQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhcHBseVN0eWxpbmdWYWx1ZURpcmVjdGx5KFxuICAgIHJlbmRlcmVyOiBhbnksIGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCwgdE5vZGU6IFRTdHlsaW5nTm9kZSwgZWxlbWVudDogUkVsZW1lbnQsXG4gICAgZGF0YTogTFN0eWxpbmdEYXRhLCBiaW5kaW5nSW5kZXg6IG51bWJlciwgcHJvcDogc3RyaW5nLCB2YWx1ZTogYW55LCBpc0NsYXNzQmFzZWQ6IGJvb2xlYW4sXG4gICAgc2FuaXRpemVyPzogU3R5bGVTYW5pdGl6ZUZuIHwgbnVsbCk6IGJvb2xlYW4ge1xuICBsZXQgYXBwbGllZCA9IGZhbHNlO1xuICBpZiAoaGFzVmFsdWVDaGFuZ2VkKGRhdGFbYmluZGluZ0luZGV4XSwgdmFsdWUpKSB7XG4gICAgc2V0VmFsdWUoZGF0YSwgYmluZGluZ0luZGV4LCB2YWx1ZSk7XG4gICAgY29uc3QgYXBwbHlGbiA9IGlzQ2xhc3NCYXNlZCA/IHNldENsYXNzIDogc2V0U3R5bGU7XG5cbiAgICAvLyBjYXNlIDE6IGFwcGx5IHRoZSBwcm92aWRlZCB2YWx1ZSAoaWYgaXQgZXhpc3RzKVxuICAgIGFwcGxpZWQgPSBhcHBseVN0eWxpbmdWYWx1ZShyZW5kZXJlciwgZWxlbWVudCwgcHJvcCwgdmFsdWUsIGFwcGx5Rm4sIGJpbmRpbmdJbmRleCwgc2FuaXRpemVyKTtcblxuICAgIC8vIGNhc2UgMjogZmluZCB0aGUgbWF0Y2hpbmcgcHJvcGVydHkgaW4gYSBzdHlsaW5nIG1hcCBhbmQgYXBwbHkgdGhlIGRldGVjdGVkIHZhbHVlXG4gICAgY29uc3QgbWFwQmluZGluZ3NGbGFnID1cbiAgICAgICAgaXNDbGFzc0Jhc2VkID8gVE5vZGVGbGFncy5oYXNDbGFzc01hcEJpbmRpbmdzIDogVE5vZGVGbGFncy5oYXNTdHlsZU1hcEJpbmRpbmdzO1xuICAgIGlmICghYXBwbGllZCAmJiBoYXNDb25maWcodE5vZGUsIG1hcEJpbmRpbmdzRmxhZykpIHtcbiAgICAgIGNvbnN0IHN0YXRlID0gZ2V0U3R5bGluZ1N0YXRlKGVsZW1lbnQsIFRFTVBMQVRFX0RJUkVDVElWRV9JTkRFWCk7XG4gICAgICBjb25zdCBtYXAgPSBpc0NsYXNzQmFzZWQgPyBzdGF0ZS5sYXN0RGlyZWN0Q2xhc3NNYXAgOiBzdGF0ZS5sYXN0RGlyZWN0U3R5bGVNYXA7XG4gICAgICBhcHBsaWVkID0gbWFwID9cbiAgICAgICAgICBmaW5kQW5kQXBwbHlNYXBWYWx1ZShyZW5kZXJlciwgZWxlbWVudCwgYXBwbHlGbiwgbWFwLCBwcm9wLCBiaW5kaW5nSW5kZXgsIHNhbml0aXplcikgOlxuICAgICAgICAgIGZhbHNlO1xuICAgIH1cblxuICAgIC8vIGNhc2UgMzogYXBwbHkgdGhlIGluaXRpYWwgdmFsdWUgKGlmIGl0IGV4aXN0cylcbiAgICBpZiAoIWFwcGxpZWQgJiYgaGFzQ29uZmlnKHROb2RlLCBUTm9kZUZsYWdzLmhhc0luaXRpYWxTdHlsaW5nKSkge1xuICAgICAgY29uc3QgbWFwID0gZ2V0U3R5bGluZ01hcEFycmF5KGNvbnRleHQpO1xuICAgICAgYXBwbGllZCA9XG4gICAgICAgICAgbWFwID8gZmluZEFuZEFwcGx5TWFwVmFsdWUocmVuZGVyZXIsIGVsZW1lbnQsIGFwcGx5Rm4sIG1hcCwgcHJvcCwgYmluZGluZ0luZGV4KSA6IGZhbHNlO1xuICAgIH1cblxuICAgIC8vIGRlZmF1bHQgY2FzZTogYXBwbHkgYG51bGxgIHRvIHJlbW92ZSB0aGUgdmFsdWVcbiAgICBpZiAoIWFwcGxpZWQpIHtcbiAgICAgIGFwcGx5Rm4ocmVuZGVyZXIsIGVsZW1lbnQsIHByb3AsIG51bGwsIGJpbmRpbmdJbmRleCk7XG4gICAgfVxuICB9XG4gIHJldHVybiBhcHBsaWVkO1xufVxuXG5mdW5jdGlvbiBhcHBseVN0eWxpbmdWYWx1ZShcbiAgICByZW5kZXJlcjogYW55LCBlbGVtZW50OiBSRWxlbWVudCwgcHJvcDogc3RyaW5nLCB2YWx1ZTogYW55LCBhcHBseUZuOiBBcHBseVN0eWxpbmdGbixcbiAgICBiaW5kaW5nSW5kZXg6IG51bWJlciwgc2FuaXRpemVyPzogU3R5bGVTYW5pdGl6ZUZuIHwgbnVsbCk6IGJvb2xlYW4ge1xuICBsZXQgdmFsdWVUb0FwcGx5OiBzdHJpbmd8bnVsbCA9IHVud3JhcFNhZmVWYWx1ZSh2YWx1ZSk7XG4gIGlmIChpc1N0eWxpbmdWYWx1ZURlZmluZWQodmFsdWVUb0FwcGx5KSkge1xuICAgIHZhbHVlVG9BcHBseSA9XG4gICAgICAgIHNhbml0aXplciA/IHNhbml0aXplcihwcm9wLCB2YWx1ZSwgU3R5bGVTYW5pdGl6ZU1vZGUuVmFsaWRhdGVBbmRTYW5pdGl6ZSkgOiB2YWx1ZVRvQXBwbHk7XG4gICAgYXBwbHlGbihyZW5kZXJlciwgZWxlbWVudCwgcHJvcCwgdmFsdWVUb0FwcGx5LCBiaW5kaW5nSW5kZXgpO1xuICAgIHJldHVybiB0cnVlO1xuICB9XG4gIHJldHVybiBmYWxzZTtcbn1cblxuZnVuY3Rpb24gZmluZEFuZEFwcGx5TWFwVmFsdWUoXG4gICAgcmVuZGVyZXI6IGFueSwgZWxlbWVudDogUkVsZW1lbnQsIGFwcGx5Rm46IEFwcGx5U3R5bGluZ0ZuLCBtYXA6IFN0eWxpbmdNYXBBcnJheSwgcHJvcDogc3RyaW5nLFxuICAgIGJpbmRpbmdJbmRleDogbnVtYmVyLCBzYW5pdGl6ZXI/OiBTdHlsZVNhbml0aXplRm4gfCBudWxsKSB7XG4gIGZvciAobGV0IGkgPSBTdHlsaW5nTWFwQXJyYXlJbmRleC5WYWx1ZXNTdGFydFBvc2l0aW9uOyBpIDwgbWFwLmxlbmd0aDtcbiAgICAgICBpICs9IFN0eWxpbmdNYXBBcnJheUluZGV4LlR1cGxlU2l6ZSkge1xuICAgIGNvbnN0IHAgPSBnZXRNYXBQcm9wKG1hcCwgaSk7XG4gICAgaWYgKHAgPT09IHByb3ApIHtcbiAgICAgIGxldCB2YWx1ZVRvQXBwbHkgPSBnZXRNYXBWYWx1ZShtYXAsIGkpO1xuICAgICAgdmFsdWVUb0FwcGx5ID0gc2FuaXRpemVyID9cbiAgICAgICAgICBzYW5pdGl6ZXIocHJvcCwgdmFsdWVUb0FwcGx5LCBTdHlsZVNhbml0aXplTW9kZS5WYWxpZGF0ZUFuZFNhbml0aXplKSA6XG4gICAgICAgICAgdmFsdWVUb0FwcGx5O1xuICAgICAgYXBwbHlGbihyZW5kZXJlciwgZWxlbWVudCwgcHJvcCwgdmFsdWVUb0FwcGx5LCBiaW5kaW5nSW5kZXgpO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIGlmIChwID4gcHJvcCkge1xuICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG4gIHJldHVybiBmYWxzZTtcbn1cblxuZnVuY3Rpb24gbm9ybWFsaXplQml0TWFza1ZhbHVlKHZhbHVlOiBudW1iZXIgfCBib29sZWFuKTogbnVtYmVyIHtcbiAgLy8gaWYgcGFzcyA9PiBhcHBseSBhbGwgdmFsdWVzICgtMSBpbXBsaWVzIHRoYXQgYWxsIGJpdHMgYXJlIGZsaXBwZWQgdG8gdHJ1ZSlcbiAgaWYgKHZhbHVlID09PSB0cnVlKSByZXR1cm4gLTE7XG5cbiAgLy8gaWYgcGFzcyA9PiBza2lwIGFsbCB2YWx1ZXNcbiAgaWYgKHZhbHVlID09PSBmYWxzZSkgcmV0dXJuIDA7XG5cbiAgLy8gcmV0dXJuIHRoZSBiaXQgbWFzayB2YWx1ZSBhcyBpc1xuICByZXR1cm4gdmFsdWU7XG59XG5cbmxldCBfYWN0aXZlU3R5bGluZ01hcEFwcGx5Rm46IFN5bmNTdHlsaW5nTWFwc0ZufG51bGwgPSBudWxsO1xuZXhwb3J0IGZ1bmN0aW9uIGdldFN0eWxpbmdNYXBzU3luY0ZuKCkge1xuICByZXR1cm4gX2FjdGl2ZVN0eWxpbmdNYXBBcHBseUZuO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2V0U3R5bGluZ01hcHNTeW5jRm4oZm46IFN5bmNTdHlsaW5nTWFwc0ZuKSB7XG4gIF9hY3RpdmVTdHlsaW5nTWFwQXBwbHlGbiA9IGZuO1xufVxuXG4vKipcbiAqIEFzc2lnbnMgYSBzdHlsZSB2YWx1ZSB0byBhIHN0eWxlIHByb3BlcnR5IGZvciB0aGUgZ2l2ZW4gZWxlbWVudC5cbiAqL1xuZXhwb3J0IGNvbnN0IHNldFN0eWxlOiBBcHBseVN0eWxpbmdGbiA9XG4gICAgKHJlbmRlcmVyOiBSZW5kZXJlcjMgfCBudWxsLCBuYXRpdmU6IFJFbGVtZW50LCBwcm9wOiBzdHJpbmcsIHZhbHVlOiBzdHJpbmcgfCBudWxsKSA9PiB7XG4gICAgICBpZiAocmVuZGVyZXIgIT09IG51bGwpIHtcbiAgICAgICAgLy8gVXNlIGBpc1N0eWxpbmdWYWx1ZURlZmluZWRgIHRvIGFjY291bnQgZm9yIGZhbHN5IHZhbHVlcyB0aGF0IHNob3VsZCBiZSBib3VuZCBsaWtlIDAuXG4gICAgICAgIGlmIChpc1N0eWxpbmdWYWx1ZURlZmluZWQodmFsdWUpKSB7XG4gICAgICAgICAgLy8gb3BhY2l0eSwgei1pbmRleCBhbmQgZmxleGJveCBhbGwgaGF2ZSBudW1iZXIgdmFsdWVzXG4gICAgICAgICAgLy8gYW5kIHRoZXNlIG5lZWQgdG8gYmUgY29udmVydGVkIGludG8gc3RyaW5ncyBzbyB0aGF0XG4gICAgICAgICAgLy8gdGhleSBjYW4gYmUgYXNzaWduZWQgcHJvcGVybHkuXG4gICAgICAgICAgdmFsdWUgPSB2YWx1ZS50b1N0cmluZygpO1xuICAgICAgICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJTZXRTdHlsZSsrO1xuICAgICAgICAgIGlmIChpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikpIHtcbiAgICAgICAgICAgIHJlbmRlcmVyLnNldFN0eWxlKG5hdGl2ZSwgcHJvcCwgdmFsdWUsIFJlbmRlcmVyU3R5bGVGbGFnczMuRGFzaENhc2UpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBUaGUgcmVhc29uIHdoeSBuYXRpdmUgc3R5bGUgbWF5IGJlIGBudWxsYCBpcyBlaXRoZXIgYmVjYXVzZVxuICAgICAgICAgICAgLy8gaXQncyBhIGNvbnRhaW5lciBlbGVtZW50IG9yIGl0J3MgYSBwYXJ0IG9mIGEgdGVzdFxuICAgICAgICAgICAgLy8gZW52aXJvbm1lbnQgdGhhdCBkb2Vzbid0IGhhdmUgc3R5bGluZy4gSW4gZWl0aGVyXG4gICAgICAgICAgICAvLyBjYXNlIGl0J3Mgc2FmZSBub3QgdG8gYXBwbHkgc3R5bGluZyB0byB0aGUgZWxlbWVudC5cbiAgICAgICAgICAgIGNvbnN0IG5hdGl2ZVN0eWxlID0gbmF0aXZlLnN0eWxlO1xuICAgICAgICAgICAgaWYgKG5hdGl2ZVN0eWxlICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgbmF0aXZlU3R5bGUuc2V0UHJvcGVydHkocHJvcCwgdmFsdWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyUmVtb3ZlU3R5bGUrKztcblxuICAgICAgICAgIGlmIChpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikpIHtcbiAgICAgICAgICAgIHJlbmRlcmVyLnJlbW92ZVN0eWxlKG5hdGl2ZSwgcHJvcCwgUmVuZGVyZXJTdHlsZUZsYWdzMy5EYXNoQ2FzZSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnN0IG5hdGl2ZVN0eWxlID0gbmF0aXZlLnN0eWxlO1xuICAgICAgICAgICAgaWYgKG5hdGl2ZVN0eWxlICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgbmF0aXZlU3R5bGUucmVtb3ZlUHJvcGVydHkocHJvcCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfTtcblxuLyoqXG4gKiBBZGRzL3JlbW92ZXMgdGhlIHByb3ZpZGVkIGNsYXNzTmFtZSB2YWx1ZSB0byB0aGUgcHJvdmlkZWQgZWxlbWVudC5cbiAqL1xuZXhwb3J0IGNvbnN0IHNldENsYXNzOiBBcHBseVN0eWxpbmdGbiA9XG4gICAgKHJlbmRlcmVyOiBSZW5kZXJlcjMgfCBudWxsLCBuYXRpdmU6IFJFbGVtZW50LCBjbGFzc05hbWU6IHN0cmluZywgdmFsdWU6IGFueSkgPT4ge1xuICAgICAgaWYgKHJlbmRlcmVyICE9PSBudWxsICYmIGNsYXNzTmFtZSAhPT0gJycpIHtcbiAgICAgICAgaWYgKHZhbHVlKSB7XG4gICAgICAgICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlckFkZENsYXNzKys7XG4gICAgICAgICAgaWYgKGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSkge1xuICAgICAgICAgICAgcmVuZGVyZXIuYWRkQ2xhc3MobmF0aXZlLCBjbGFzc05hbWUpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyB0aGUgcmVhc29uIHdoeSBjbGFzc0xpc3QgbWF5IGJlIGBudWxsYCBpcyBlaXRoZXIgYmVjYXVzZVxuICAgICAgICAgICAgLy8gaXQncyBhIGNvbnRhaW5lciBlbGVtZW50IG9yIGl0J3MgYSBwYXJ0IG9mIGEgdGVzdFxuICAgICAgICAgICAgLy8gZW52aXJvbm1lbnQgdGhhdCBkb2Vzbid0IGhhdmUgc3R5bGluZy4gSW4gZWl0aGVyXG4gICAgICAgICAgICAvLyBjYXNlIGl0J3Mgc2FmZSBub3QgdG8gYXBwbHkgc3R5bGluZyB0byB0aGUgZWxlbWVudC5cbiAgICAgICAgICAgIGNvbnN0IGNsYXNzTGlzdCA9IG5hdGl2ZS5jbGFzc0xpc3Q7XG4gICAgICAgICAgICBpZiAoY2xhc3NMaXN0ICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgY2xhc3NMaXN0LmFkZChjbGFzc05hbWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyUmVtb3ZlQ2xhc3MrKztcbiAgICAgICAgICBpZiAoaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpKSB7XG4gICAgICAgICAgICByZW5kZXJlci5yZW1vdmVDbGFzcyhuYXRpdmUsIGNsYXNzTmFtZSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnN0IGNsYXNzTGlzdCA9IG5hdGl2ZS5jbGFzc0xpc3Q7XG4gICAgICAgICAgICBpZiAoY2xhc3NMaXN0ICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgY2xhc3NMaXN0LnJlbW92ZShjbGFzc05hbWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH07XG5cbmV4cG9ydCBjb25zdCBzZXRDbGFzc05hbWUgPSAocmVuZGVyZXI6IFJlbmRlcmVyMyB8IG51bGwsIG5hdGl2ZTogUkVsZW1lbnQsIGNsYXNzTmFtZTogc3RyaW5nKSA9PiB7XG4gIGlmIChyZW5kZXJlciAhPT0gbnVsbCkge1xuICAgIGlmIChpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikpIHtcbiAgICAgIHJlbmRlcmVyLnNldEF0dHJpYnV0ZShuYXRpdmUsICdjbGFzcycsIGNsYXNzTmFtZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG5hdGl2ZS5jbGFzc05hbWUgPSBjbGFzc05hbWU7XG4gICAgfVxuICB9XG59O1xuXG5leHBvcnQgY29uc3Qgc2V0U3R5bGVBdHRyID0gKHJlbmRlcmVyOiBSZW5kZXJlcjMgfCBudWxsLCBuYXRpdmU6IFJFbGVtZW50LCB2YWx1ZTogc3RyaW5nKSA9PiB7XG4gIGlmIChyZW5kZXJlciAhPT0gbnVsbCkge1xuICAgIGlmIChpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikpIHtcbiAgICAgIHJlbmRlcmVyLnNldEF0dHJpYnV0ZShuYXRpdmUsICdzdHlsZScsIHZhbHVlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbmF0aXZlLnNldEF0dHJpYnV0ZSgnc3R5bGUnLCB2YWx1ZSk7XG4gICAgfVxuICB9XG59O1xuXG4vKipcbiAqIEl0ZXJhdGVzIG92ZXIgYWxsIHByb3ZpZGVkIHN0eWxpbmcgZW50cmllcyBhbmQgcmVuZGVycyB0aGVtIG9uIHRoZSBlbGVtZW50LlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gaXMgdXNlZCBhbG9uZ3NpZGUgYSBgU3R5bGluZ01hcEFycmF5YCBlbnRyeS4gVGhpcyBlbnRyeSBpcyBub3RcbiAqIHRoZSBzYW1lIGFzIHRoZSBgVFN0eWxpbmdDb250ZXh0YCBhbmQgaXMgb25seSByZWFsbHkgdXNlZCB3aGVuIGFuIGVsZW1lbnQgY29udGFpbnNcbiAqIGluaXRpYWwgc3R5bGluZyB2YWx1ZXMgKGUuZy4gYDxkaXYgc3R5bGU9XCJ3aWR0aDoyMDBweFwiPmApLCBidXQgbm8gc3R5bGUvY2xhc3MgYmluZGluZ3NcbiAqIGFyZSBwcmVzZW50LiBJZiBhbmQgd2hlbiB0aGF0IGhhcHBlbnMgdGhlbiB0aGlzIGZ1bmN0aW9uIHdpbGwgYmUgY2FsbGVkIHRvIHJlbmRlciBhbGxcbiAqIGluaXRpYWwgc3R5bGluZyB2YWx1ZXMgb24gYW4gZWxlbWVudC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlbmRlclN0eWxpbmdNYXAoXG4gICAgcmVuZGVyZXI6IFJlbmRlcmVyMywgZWxlbWVudDogUkVsZW1lbnQsIHN0eWxpbmdWYWx1ZXM6IFRTdHlsaW5nQ29udGV4dCB8IFN0eWxpbmdNYXBBcnJheSB8IG51bGwsXG4gICAgaXNDbGFzc0Jhc2VkOiBib29sZWFuKTogdm9pZCB7XG4gIGNvbnN0IHN0eWxpbmdNYXBBcnIgPSBnZXRTdHlsaW5nTWFwQXJyYXkoc3R5bGluZ1ZhbHVlcyk7XG4gIGlmIChzdHlsaW5nTWFwQXJyKSB7XG4gICAgZm9yIChsZXQgaSA9IFN0eWxpbmdNYXBBcnJheUluZGV4LlZhbHVlc1N0YXJ0UG9zaXRpb247IGkgPCBzdHlsaW5nTWFwQXJyLmxlbmd0aDtcbiAgICAgICAgIGkgKz0gU3R5bGluZ01hcEFycmF5SW5kZXguVHVwbGVTaXplKSB7XG4gICAgICBjb25zdCBwcm9wID0gZ2V0TWFwUHJvcChzdHlsaW5nTWFwQXJyLCBpKTtcbiAgICAgIGNvbnN0IHZhbHVlID0gZ2V0TWFwVmFsdWUoc3R5bGluZ01hcEFyciwgaSk7XG4gICAgICBpZiAoaXNDbGFzc0Jhc2VkKSB7XG4gICAgICAgIHNldENsYXNzKHJlbmRlcmVyLCBlbGVtZW50LCBwcm9wLCB2YWx1ZSwgbnVsbCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzZXRTdHlsZShyZW5kZXJlciwgZWxlbWVudCwgcHJvcCwgdmFsdWUsIG51bGwpO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBvYmplY3RUb0NsYXNzTmFtZShvYmo6IHtba2V5OiBzdHJpbmddOiBhbnl9IHwgbnVsbCk6IHN0cmluZyB7XG4gIGxldCBzdHIgPSAnJztcbiAgaWYgKG9iaikge1xuICAgIGZvciAobGV0IGtleSBpbiBvYmopIHtcbiAgICAgIGNvbnN0IHZhbHVlID0gb2JqW2tleV07XG4gICAgICBpZiAodmFsdWUpIHtcbiAgICAgICAgc3RyICs9IChzdHIubGVuZ3RoID8gJyAnIDogJycpICsga2V5O1xuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gc3RyO1xufVxuXG4vKipcbiAqIERldGVybWluZXMgd2hldGhlciBvciBub3QgYW4gZWxlbWVudCBzdHlsZS9jbGFzc05hbWUgdmFsdWUgaGFzIGNoYW5nZWQgc2luY2UgdGhlIGxhc3QgdXBkYXRlLlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gaGVscHMgQW5ndWxhciBkZXRlcm1pbmUgaWYgYSBzdHlsZSBvciBjbGFzcyBhdHRyaWJ1dGUgdmFsdWUgd2FzXG4gKiBtb2RpZmllZCBieSBhbiBleHRlcm5hbCBwbHVnaW4gb3IgQVBJIG91dHNpZGUgb2YgdGhlIHN0eWxlIGJpbmRpbmcgY29kZS4gVGhpc1xuICogbWVhbnMgYW55IEpTIGNvZGUgdGhhdCBhZGRzL3JlbW92ZXMgY2xhc3Mvc3R5bGUgdmFsdWVzIG9uIGFuIGVsZW1lbnQgb3V0c2lkZVxuICogb2YgQW5ndWxhcidzIHN0eWxpbmcgYmluZGluZyBhbGdvcml0aG0uXG4gKlxuICogQHJldHVybnMgdHJ1ZSB3aGVuIHRoZSB2YWx1ZSB3YXMgbW9kaWZpZWQgZXh0ZXJuYWxseS5cbiAqL1xuZnVuY3Rpb24gY2hlY2tJZkV4dGVybmFsbHlNb2RpZmllZChlbGVtZW50OiBIVE1MRWxlbWVudCwgY2FjaGVkVmFsdWU6IGFueSwgaXNDbGFzc0Jhc2VkOiBib29sZWFuKSB7XG4gIC8vIHRoaXMgbWVhbnMgaXQgd2FzIGNoZWNrZWQgYmVmb3JlIGFuZCB0aGVyZSBpcyBubyByZWFzb25cbiAgLy8gdG8gY29tcGFyZSB0aGUgc3R5bGUvY2xhc3MgdmFsdWVzIGFnYWluLiBFaXRoZXIgdGhhdCBvclxuICAvLyB3ZWIgd29ya2VycyBhcmUgYmVpbmcgdXNlZC5cbiAgaWYgKGdsb2JhbC5Ob2RlID09PSAndW5kZWZpbmVkJyB8fCBjYWNoZWRWYWx1ZSA9PT0gVkFMVUVfSVNfRVhURVJOQUxMWV9NT0RJRklFRCkgcmV0dXJuIHRydWU7XG5cbiAgLy8gY29tcGFyaW5nIHRoZSBET00gdmFsdWUgYWdhaW5zdCB0aGUgY2FjaGVkIHZhbHVlIGlzIHRoZSBiZXN0IHdheSB0b1xuICAvLyBzZWUgaWYgc29tZXRoaW5nIGhhcyBjaGFuZ2VkLlxuICBjb25zdCBjdXJyZW50VmFsdWUgPVxuICAgICAgKGlzQ2xhc3NCYXNlZCA/IGVsZW1lbnQuY2xhc3NOYW1lIDogKGVsZW1lbnQuc3R5bGUgJiYgZWxlbWVudC5zdHlsZS5jc3NUZXh0KSkgfHwgJyc7XG4gIHJldHVybiBjdXJyZW50VmFsdWUgIT09IChjYWNoZWRWYWx1ZSB8fCAnJyk7XG59XG5cbi8qKlxuICogUmVtb3ZlcyBwcm92aWRlZCBzdHlsaW5nIHZhbHVlcyBmcm9tIHRoZSBlbGVtZW50XG4gKi9cbmZ1bmN0aW9uIHJlbW92ZVN0eWxpbmdWYWx1ZXMoXG4gICAgcmVuZGVyZXI6IGFueSwgZWxlbWVudDogUkVsZW1lbnQsIHZhbHVlczogc3RyaW5nIHwge1trZXk6IHN0cmluZ106IGFueX0gfCBTdHlsaW5nTWFwQXJyYXksXG4gICAgaXNDbGFzc0Jhc2VkOiBib29sZWFuKSB7XG4gIGxldCBhcnI6IFN0eWxpbmdNYXBBcnJheTtcbiAgaWYgKGlzU3R5bGluZ01hcEFycmF5KHZhbHVlcykpIHtcbiAgICBhcnIgPSB2YWx1ZXMgYXMgU3R5bGluZ01hcEFycmF5O1xuICB9IGVsc2Uge1xuICAgIGFyciA9IG5vcm1hbGl6ZUludG9TdHlsaW5nTWFwKG51bGwsIHZhbHVlcywgIWlzQ2xhc3NCYXNlZCk7XG4gIH1cblxuICBjb25zdCBhcHBseUZuID0gaXNDbGFzc0Jhc2VkID8gc2V0Q2xhc3MgOiBzZXRTdHlsZTtcbiAgZm9yIChsZXQgaSA9IFN0eWxpbmdNYXBBcnJheUluZGV4LlZhbHVlc1N0YXJ0UG9zaXRpb247IGkgPCBhcnIubGVuZ3RoO1xuICAgICAgIGkgKz0gU3R5bGluZ01hcEFycmF5SW5kZXguVHVwbGVTaXplKSB7XG4gICAgY29uc3QgdmFsdWUgPSBnZXRNYXBWYWx1ZShhcnIsIGkpO1xuICAgIGlmICh2YWx1ZSkge1xuICAgICAgY29uc3QgcHJvcCA9IGdldE1hcFByb3AoYXJyLCBpKTtcbiAgICAgIGFwcGx5Rm4ocmVuZGVyZXIsIGVsZW1lbnQsIHByb3AsIGZhbHNlKTtcbiAgICB9XG4gIH1cbn1cbiJdfQ==