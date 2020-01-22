/**
 * @fileoverview added by tsickle
 * Generated from: packages/core/src/render3/styling/bindings.ts
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
            applyFn(renderer, element, prop, null);
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmluZGluZ3MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL3N0eWxpbmcvYmluZGluZ3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBT0EsT0FBTyxFQUFZLGVBQWUsRUFBQyxNQUFNLDJCQUEyQixDQUFDO0FBRXJFLE9BQU8sRUFBQyxNQUFNLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUV6QyxPQUFPLEVBQTJDLG1CQUFtQixFQUFFLG9CQUFvQixFQUFDLE1BQU0sd0JBQXdCLENBQUM7QUFFM0gsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLFdBQVcsQ0FBQztBQUNwQyxPQUFPLEVBQUMscUJBQXFCLEVBQUUscUJBQXFCLEVBQUUsd0JBQXdCLEVBQUUseUJBQXlCLEVBQUUsd0JBQXdCLEVBQUUsWUFBWSxFQUFFLG1CQUFtQixFQUFFLGVBQWUsRUFBRSxlQUFlLEVBQUUsWUFBWSxFQUFFLHNCQUFzQixFQUFFLFVBQVUsRUFBRSxXQUFXLEVBQUUsT0FBTyxFQUFFLDBCQUEwQixFQUFFLGtCQUFrQixFQUFFLGVBQWUsRUFBRSxRQUFRLEVBQUUsY0FBYyxFQUFFLFNBQVMsRUFBRSxlQUFlLEVBQUUsbUJBQW1CLEVBQUUsc0JBQXNCLEVBQUUsaUJBQWlCLEVBQUUscUJBQXFCLEVBQUUsdUJBQXVCLEVBQUUsV0FBVyxFQUFFLGVBQWUsRUFBRSxZQUFZLEVBQUUsYUFBYSxFQUFFLFFBQVEsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBRTNsQixPQUFPLEVBQUMsZUFBZSxFQUFFLGlCQUFpQixFQUFDLE1BQU0sU0FBUyxDQUFDOztNQUVyRCw0QkFBNEIsR0FBRyxFQUFFOzs7Ozs7O01BMEJqQyw2QkFBNkIsR0FBRyxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBWXZDLE1BQU0sVUFBVSxxQkFBcUIsQ0FDakMsT0FBd0IsRUFBRSxLQUFtQixF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QUFHLHVCQUF1QixDQUFDLElBQUksRUFBRSxNQUFNLEVBQUUsQ0FBQyxZQUFZLENBQUMsQ0FBQztLQUM1RDs7VUFFSyxPQUFPLEdBQUcsWUFBWSxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLFFBQVE7SUFDbEQsS0FBSyxJQUFJLENBQUMsOEJBQTJDLEVBQUUsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxNQUFNLEVBQ2hFLENBQUMscUJBQWtDLEVBQUU7O2NBQ2xDLEtBQUssR0FBRyxXQUFXLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQztRQUNqQyxJQUFJLEtBQUssRUFBRTs7a0JBQ0gsSUFBSSxHQUFHLFVBQVUsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDO1lBQy9CLE9BQU8sQ0FBQyxRQUFRLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztTQUN4QztLQUNGO0FBQ0gsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuKiBAbGljZW5zZVxuKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbipcbiogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuKi9cbmltcG9ydCB7U2FmZVZhbHVlLCB1bndyYXBTYWZlVmFsdWV9IGZyb20gJy4uLy4uL3Nhbml0aXphdGlvbi9ieXBhc3MnO1xuaW1wb3J0IHtTdHlsZVNhbml0aXplRm4sIFN0eWxlU2FuaXRpemVNb2RlfSBmcm9tICcuLi8uLi9zYW5pdGl6YXRpb24vc3R5bGVfc2FuaXRpemVyJztcbmltcG9ydCB7Z2xvYmFsfSBmcm9tICcuLi8uLi91dGlsL2dsb2JhbCc7XG5pbXBvcnQge1ROb2RlRmxhZ3N9IGZyb20gJy4uL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge1Byb2NlZHVyYWxSZW5kZXJlcjMsIFJFbGVtZW50LCBSZW5kZXJlcjMsIFJlbmRlcmVyU3R5bGVGbGFnczMsIGlzUHJvY2VkdXJhbFJlbmRlcmVyfSBmcm9tICcuLi9pbnRlcmZhY2VzL3JlbmRlcmVyJztcbmltcG9ydCB7QXBwbHlTdHlsaW5nRm4sIExTdHlsaW5nRGF0YSwgU3R5bGluZ01hcEFycmF5LCBTdHlsaW5nTWFwQXJyYXlJbmRleCwgU3R5bGluZ01hcHNTeW5jTW9kZSwgU3luY1N0eWxpbmdNYXBzRm4sIFRTdHlsaW5nQ29udGV4dCwgVFN0eWxpbmdDb250ZXh0SW5kZXgsIFRTdHlsaW5nQ29udGV4dFByb3BDb25maWdGbGFncywgVFN0eWxpbmdOb2RlfSBmcm9tICcuLi9pbnRlcmZhY2VzL3N0eWxpbmcnO1xuaW1wb3J0IHtOT19DSEFOR0V9IGZyb20gJy4uL3Rva2Vucyc7XG5pbXBvcnQge0RFRkFVTFRfQklORElOR19JTkRFWCwgREVGQVVMVF9CSU5ESU5HX1ZBTFVFLCBERUZBVUxUX0dVQVJEX01BU0tfVkFMVUUsIE1BUF9CQVNFRF9FTlRSWV9QUk9QX05BTUUsIFRFTVBMQVRFX0RJUkVDVElWRV9JTkRFWCwgY29uY2F0U3RyaW5nLCBmb3JjZVN0eWxlc0FzU3RyaW5nLCBnZXRCaW5kaW5nVmFsdWUsIGdldERlZmF1bHRWYWx1ZSwgZ2V0R3VhcmRNYXNrLCBnZXRJbml0aWFsU3R5bGluZ1ZhbHVlLCBnZXRNYXBQcm9wLCBnZXRNYXBWYWx1ZSwgZ2V0UHJvcCwgZ2V0UHJvcFZhbHVlc1N0YXJ0UG9zaXRpb24sIGdldFN0eWxpbmdNYXBBcnJheSwgZ2V0VG90YWxTb3VyY2VzLCBnZXRWYWx1ZSwgZ2V0VmFsdWVzQ291bnQsIGhhc0NvbmZpZywgaGFzVmFsdWVDaGFuZ2VkLCBpc0hvc3RTdHlsaW5nQWN0aXZlLCBpc1Nhbml0aXphdGlvblJlcXVpcmVkLCBpc1N0eWxpbmdNYXBBcnJheSwgaXNTdHlsaW5nVmFsdWVEZWZpbmVkLCBub3JtYWxpemVJbnRvU3R5bGluZ01hcCwgcGF0Y2hDb25maWcsIHNldERlZmF1bHRWYWx1ZSwgc2V0R3VhcmRNYXNrLCBzZXRNYXBBc0RpcnR5LCBzZXRWYWx1ZX0gZnJvbSAnLi4vdXRpbC9zdHlsaW5nX3V0aWxzJztcblxuaW1wb3J0IHtnZXRTdHlsaW5nU3RhdGUsIHJlc2V0U3R5bGluZ1N0YXRlfSBmcm9tICcuL3N0YXRlJztcblxuY29uc3QgVkFMVUVfSVNfRVhURVJOQUxMWV9NT0RJRklFRCA9IHt9O1xuXG4vKipcbiAqIC0tLS0tLS0tXG4gKlxuICogVGhpcyBmaWxlIGNvbnRhaW5zIHRoZSBjb3JlIGxvZ2ljIGZvciBzdHlsaW5nIGluIEFuZ3VsYXIuXG4gKlxuICogQWxsIHN0eWxpbmcgYmluZGluZ3MgKGkuZS4gYFtzdHlsZV1gLCBgW3N0eWxlLnByb3BdYCwgYFtjbGFzc11gIGFuZCBgW2NsYXNzLm5hbWVdYClcbiAqIHdpbGwgaGF2ZSB0aGVpciB2YWx1ZXMgYmUgYXBwbGllZCB0aHJvdWdoIHRoZSBsb2dpYyBpbiB0aGlzIGZpbGUuXG4gKlxuICogV2hlbiBhIGJpbmRpbmcgaXMgZW5jb3VudGVyZWQgKGUuZy4gYDxkaXYgW3N0eWxlLndpZHRoXT1cIndcIj5gKSB0aGVuXG4gKiB0aGUgYmluZGluZyBkYXRhIHdpbGwgYmUgcG9wdWxhdGVkIGludG8gYSBgVFN0eWxpbmdDb250ZXh0YCBkYXRhLXN0cnVjdHVyZS5cbiAqIFRoZXJlIGlzIG9ubHkgb25lIGBUU3R5bGluZ0NvbnRleHRgIHBlciBgVFN0eWxpbmdOb2RlYCBhbmQgZWFjaCBlbGVtZW50IGluc3RhbmNlXG4gKiB3aWxsIHVwZGF0ZSBpdHMgc3R5bGUvY2xhc3MgYmluZGluZyB2YWx1ZXMgaW4gY29uY2VydCB3aXRoIHRoZSBzdHlsaW5nXG4gKiBjb250ZXh0LlxuICpcbiAqIFRvIGxlYXJuIG1vcmUgYWJvdXQgdGhlIGFsZ29yaXRobSBzZWUgYFRTdHlsaW5nQ29udGV4dGAuXG4gKlxuICogLS0tLS0tLS1cbiAqL1xuXG4vKipcbiAqIFRoZSBndWFyZC91cGRhdGUgbWFzayBiaXQgaW5kZXggbG9jYXRpb24gZm9yIG1hcC1iYXNlZCBiaW5kaW5ncy5cbiAqXG4gKiBBbGwgbWFwLWJhc2VkIGJpbmRpbmdzIChpLmUuIGBbc3R5bGVdYCBhbmQgYFtjbGFzc11gIClcbiAqL1xuY29uc3QgU1RZTElOR19JTkRFWF9GT1JfTUFQX0JJTkRJTkcgPSAwO1xuXG4vKipcbiAqIFZpc2l0cyBhIGNsYXNzLWJhc2VkIGJpbmRpbmcgYW5kIHVwZGF0ZXMgdGhlIG5ldyB2YWx1ZSAoaWYgY2hhbmdlZCkuXG4gKlxuICogVGhpcyBmdW5jdGlvbiBpcyBjYWxsZWQgZWFjaCB0aW1lIGEgY2xhc3MtYmFzZWQgc3R5bGluZyBpbnN0cnVjdGlvblxuICogaXMgZXhlY3V0ZWQuIEl0J3MgaW1wb3J0YW50IHRoYXQgaXQncyBhbHdheXMgY2FsbGVkIChldmVuIGlmIHRoZSB2YWx1ZVxuICogaGFzIG5vdCBjaGFuZ2VkKSBzbyB0aGF0IHRoZSBpbm5lciBjb3VudGVyIGluZGV4IHZhbHVlIGlzIGluY3JlbWVudGVkLlxuICogVGhpcyB3YXksIGVhY2ggaW5zdHJ1Y3Rpb24gaXMgYWx3YXlzIGd1YXJhbnRlZWQgdG8gZ2V0IHRoZSBzYW1lIGNvdW50ZXJcbiAqIHN0YXRlIGVhY2ggdGltZSBpdCdzIGNhbGxlZCAod2hpY2ggdGhlbiBhbGxvd3MgdGhlIGBUU3R5bGluZ0NvbnRleHRgXG4gKiBhbmQgdGhlIGJpdCBtYXNrIHZhbHVlcyB0byBiZSBpbiBzeW5jKS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHVwZGF0ZUNsYXNzVmlhQ29udGV4dChcbiAgICBjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQsIHROb2RlOiBUU3R5bGluZ05vZGUsIGRhdGE6IExTdHlsaW5nRGF0YSwgZWxlbWVudDogUkVsZW1lbnQsXG4gICAgZGlyZWN0aXZlSW5kZXg6IG51bWJlciwgcHJvcDogc3RyaW5nIHwgbnVsbCwgYmluZGluZ0luZGV4OiBudW1iZXIsXG4gICAgdmFsdWU6IGJvb2xlYW4gfCBzdHJpbmcgfCBudWxsIHwgdW5kZWZpbmVkIHwgU3R5bGluZ01hcEFycmF5IHwgTk9fQ0hBTkdFLCBmb3JjZVVwZGF0ZTogYm9vbGVhbixcbiAgICBmaXJzdFVwZGF0ZVBhc3M6IGJvb2xlYW4pOiBib29sZWFuIHtcbiAgY29uc3QgaXNNYXBCYXNlZCA9ICFwcm9wO1xuICBjb25zdCBzdGF0ZSA9IGdldFN0eWxpbmdTdGF0ZShlbGVtZW50LCBkaXJlY3RpdmVJbmRleCk7XG4gIGNvbnN0IGNvdW50SW5kZXggPSBpc01hcEJhc2VkID8gU1RZTElOR19JTkRFWF9GT1JfTUFQX0JJTkRJTkcgOiBzdGF0ZS5jbGFzc2VzSW5kZXgrKztcblxuICAvLyBldmVuIGlmIHRoZSBpbml0aWFsIHZhbHVlIGlzIGEgYE5PX0NIQU5HRWAgdmFsdWUgKGUuZy4gaW50ZXJwb2xhdGlvbiBvciBbbmdDbGFzc10pXG4gIC8vIHRoZW4gd2Ugc3RpbGwgbmVlZCB0byByZWdpc3RlciB0aGUgYmluZGluZyB3aXRoaW4gdGhlIGNvbnRleHQgc28gdGhhdCB0aGUgY29udGV4dFxuICAvLyBpcyBhd2FyZSBvZiB0aGUgYmluZGluZyBldmVuIGlmIHRoaW5ncyBjaGFuZ2UgYWZ0ZXIgdGhlIGZpcnN0IHVwZGF0ZSBwYXNzLlxuICBpZiAoZmlyc3RVcGRhdGVQYXNzIHx8IHZhbHVlICE9PSBOT19DSEFOR0UpIHtcbiAgICBjb25zdCB1cGRhdGVkID0gdXBkYXRlQmluZGluZ0RhdGEoXG4gICAgICAgIGNvbnRleHQsIHROb2RlLCBkYXRhLCBjb3VudEluZGV4LCBzdGF0ZS5zb3VyY2VJbmRleCwgcHJvcCwgYmluZGluZ0luZGV4LCB2YWx1ZSwgZm9yY2VVcGRhdGUsXG4gICAgICAgIGZhbHNlLCBmaXJzdFVwZGF0ZVBhc3MsIHRydWUpO1xuICAgIGlmICh1cGRhdGVkIHx8IGZvcmNlVXBkYXRlKSB7XG4gICAgICAvLyBXZSBmbGlwIHRoZSBiaXQgaW4gdGhlIGJpdE1hc2sgdG8gcmVmbGVjdCB0aGF0IHRoZSBiaW5kaW5nXG4gICAgICAvLyBhdCB0aGUgYGluZGV4YCBzbG90IGhhcyBjaGFuZ2VkLiBUaGlzIGlkZW50aWZpZXMgdG8gdGhlIGZsdXNoaW5nXG4gICAgICAvLyBwaGFzZSB0aGF0IHRoZSBiaW5kaW5ncyBmb3IgdGhpcyBwYXJ0aWN1bGFyIENTUyBjbGFzcyBuZWVkIHRvIGJlXG4gICAgICAvLyBhcHBsaWVkIGFnYWluIGJlY2F1c2Ugb24gb3IgbW9yZSBvZiB0aGUgYmluZGluZ3MgZm9yIHRoZSBDU1NcbiAgICAgIC8vIGNsYXNzIGhhdmUgY2hhbmdlZC5cbiAgICAgIHN0YXRlLmNsYXNzZXNCaXRNYXNrIHw9IDEgPDwgY291bnRJbmRleDtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgfVxuICByZXR1cm4gZmFsc2U7XG59XG5cbi8qKlxuICogVmlzaXRzIGEgc3R5bGUtYmFzZWQgYmluZGluZyBhbmQgdXBkYXRlcyB0aGUgbmV3IHZhbHVlIChpZiBjaGFuZ2VkKS5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIGlzIGNhbGxlZCBlYWNoIHRpbWUgYSBzdHlsZS1iYXNlZCBzdHlsaW5nIGluc3RydWN0aW9uXG4gKiBpcyBleGVjdXRlZC4gSXQncyBpbXBvcnRhbnQgdGhhdCBpdCdzIGFsd2F5cyBjYWxsZWQgKGV2ZW4gaWYgdGhlIHZhbHVlXG4gKiBoYXMgbm90IGNoYW5nZWQpIHNvIHRoYXQgdGhlIGlubmVyIGNvdW50ZXIgaW5kZXggdmFsdWUgaXMgaW5jcmVtZW50ZWQuXG4gKiBUaGlzIHdheSwgZWFjaCBpbnN0cnVjdGlvbiBpcyBhbHdheXMgZ3VhcmFudGVlZCB0byBnZXQgdGhlIHNhbWUgY291bnRlclxuICogc3RhdGUgZWFjaCB0aW1lIGl0J3MgY2FsbGVkICh3aGljaCB0aGVuIGFsbG93cyB0aGUgYFRTdHlsaW5nQ29udGV4dGBcbiAqIGFuZCB0aGUgYml0IG1hc2sgdmFsdWVzIHRvIGJlIGluIHN5bmMpLlxuICovXG5leHBvcnQgZnVuY3Rpb24gdXBkYXRlU3R5bGVWaWFDb250ZXh0KFxuICAgIGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCwgdE5vZGU6IFRTdHlsaW5nTm9kZSwgZGF0YTogTFN0eWxpbmdEYXRhLCBlbGVtZW50OiBSRWxlbWVudCxcbiAgICBkaXJlY3RpdmVJbmRleDogbnVtYmVyLCBwcm9wOiBzdHJpbmcgfCBudWxsLCBiaW5kaW5nSW5kZXg6IG51bWJlcixcbiAgICB2YWx1ZTogc3RyaW5nIHwgbnVtYmVyIHwgU2FmZVZhbHVlIHwgbnVsbCB8IHVuZGVmaW5lZCB8IFN0eWxpbmdNYXBBcnJheSB8IE5PX0NIQU5HRSxcbiAgICBzYW5pdGl6ZXI6IFN0eWxlU2FuaXRpemVGbiB8IG51bGwgfCB1bmRlZmluZWQsIGZvcmNlVXBkYXRlOiBib29sZWFuLFxuICAgIGZpcnN0VXBkYXRlUGFzczogYm9vbGVhbik6IGJvb2xlYW4ge1xuICBjb25zdCBpc01hcEJhc2VkID0gIXByb3A7XG4gIGNvbnN0IHN0YXRlID0gZ2V0U3R5bGluZ1N0YXRlKGVsZW1lbnQsIGRpcmVjdGl2ZUluZGV4KTtcbiAgY29uc3QgY291bnRJbmRleCA9IGlzTWFwQmFzZWQgPyBTVFlMSU5HX0lOREVYX0ZPUl9NQVBfQklORElORyA6IHN0YXRlLnN0eWxlc0luZGV4Kys7XG5cbiAgLy8gZXZlbiBpZiB0aGUgaW5pdGlhbCB2YWx1ZSBpcyBhIGBOT19DSEFOR0VgIHZhbHVlIChlLmcuIGludGVycG9sYXRpb24gb3IgW25nU3R5bGVdKVxuICAvLyB0aGVuIHdlIHN0aWxsIG5lZWQgdG8gcmVnaXN0ZXIgdGhlIGJpbmRpbmcgd2l0aGluIHRoZSBjb250ZXh0IHNvIHRoYXQgdGhlIGNvbnRleHRcbiAgLy8gaXMgYXdhcmUgb2YgdGhlIGJpbmRpbmcgZXZlbiBpZiB0aGluZ3MgY2hhbmdlIGFmdGVyIHRoZSBmaXJzdCB1cGRhdGUgcGFzcy5cbiAgaWYgKGZpcnN0VXBkYXRlUGFzcyB8fCB2YWx1ZSAhPT0gTk9fQ0hBTkdFKSB7XG4gICAgY29uc3Qgc2FuaXRpemF0aW9uUmVxdWlyZWQgPSBpc01hcEJhc2VkID9cbiAgICAgICAgdHJ1ZSA6XG4gICAgICAgIChzYW5pdGl6ZXIgPyBzYW5pdGl6ZXIocHJvcCAhLCBudWxsLCBTdHlsZVNhbml0aXplTW9kZS5WYWxpZGF0ZVByb3BlcnR5KSA6IGZhbHNlKTtcbiAgICBjb25zdCB1cGRhdGVkID0gdXBkYXRlQmluZGluZ0RhdGEoXG4gICAgICAgIGNvbnRleHQsIHROb2RlLCBkYXRhLCBjb3VudEluZGV4LCBzdGF0ZS5zb3VyY2VJbmRleCwgcHJvcCwgYmluZGluZ0luZGV4LCB2YWx1ZSwgZm9yY2VVcGRhdGUsXG4gICAgICAgIHNhbml0aXphdGlvblJlcXVpcmVkLCBmaXJzdFVwZGF0ZVBhc3MsIGZhbHNlKTtcbiAgICBpZiAodXBkYXRlZCB8fCBmb3JjZVVwZGF0ZSkge1xuICAgICAgLy8gV2UgZmxpcCB0aGUgYml0IGluIHRoZSBiaXRNYXNrIHRvIHJlZmxlY3QgdGhhdCB0aGUgYmluZGluZ1xuICAgICAgLy8gYXQgdGhlIGBpbmRleGAgc2xvdCBoYXMgY2hhbmdlZC4gVGhpcyBpZGVudGlmaWVzIHRvIHRoZSBmbHVzaGluZ1xuICAgICAgLy8gcGhhc2UgdGhhdCB0aGUgYmluZGluZ3MgZm9yIHRoaXMgcGFydGljdWxhciBwcm9wZXJ0eSBuZWVkIHRvIGJlXG4gICAgICAvLyBhcHBsaWVkIGFnYWluIGJlY2F1c2Ugb24gb3IgbW9yZSBvZiB0aGUgYmluZGluZ3MgZm9yIHRoZSBDU1NcbiAgICAgIC8vIHByb3BlcnR5IGhhdmUgY2hhbmdlZC5cbiAgICAgIHN0YXRlLnN0eWxlc0JpdE1hc2sgfD0gMSA8PCBjb3VudEluZGV4O1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9XG4gIHJldHVybiBmYWxzZTtcbn1cblxuLyoqXG4gKiBDYWxsZWQgZWFjaCB0aW1lIGEgYmluZGluZyB2YWx1ZSBoYXMgY2hhbmdlZCB3aXRoaW4gdGhlIHByb3ZpZGVkIGBUU3R5bGluZ0NvbnRleHRgLlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gaXMgZGVzaWduZWQgdG8gYmUgY2FsbGVkIGZyb20gYHVwZGF0ZVN0eWxlQmluZGluZ2AgYW5kIGB1cGRhdGVDbGFzc0JpbmRpbmdgLlxuICogSWYgY2FsbGVkIGR1cmluZyB0aGUgZmlyc3QgdXBkYXRlIHBhc3MsIHRoZSBiaW5kaW5nIHdpbGwgYmUgcmVnaXN0ZXJlZCBpbiB0aGUgY29udGV4dC5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIHdpbGwgYWxzbyB1cGRhdGUgYmluZGluZyBzbG90IGluIHRoZSBwcm92aWRlZCBgTFN0eWxpbmdEYXRhYCB3aXRoIHRoZVxuICogbmV3IGJpbmRpbmcgZW50cnkgKGlmIGl0IGhhcyBjaGFuZ2VkKS5cbiAqXG4gKiBAcmV0dXJucyB3aGV0aGVyIG9yIG5vdCB0aGUgYmluZGluZyB2YWx1ZSB3YXMgdXBkYXRlZCBpbiB0aGUgYExTdHlsaW5nRGF0YWAuXG4gKi9cbmZ1bmN0aW9uIHVwZGF0ZUJpbmRpbmdEYXRhKFxuICAgIGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCwgdE5vZGU6IFRTdHlsaW5nTm9kZSwgZGF0YTogTFN0eWxpbmdEYXRhLCBjb3VudGVySW5kZXg6IG51bWJlcixcbiAgICBzb3VyY2VJbmRleDogbnVtYmVyLCBwcm9wOiBzdHJpbmcgfCBudWxsLCBiaW5kaW5nSW5kZXg6IG51bWJlcixcbiAgICB2YWx1ZTogc3RyaW5nIHwgU2FmZVZhbHVlIHwgbnVtYmVyIHwgYm9vbGVhbiB8IG51bGwgfCB1bmRlZmluZWQgfCBTdHlsaW5nTWFwQXJyYXksXG4gICAgZm9yY2VVcGRhdGU6IGJvb2xlYW4sIHNhbml0aXphdGlvblJlcXVpcmVkOiBib29sZWFuLCBmaXJzdFVwZGF0ZVBhc3M6IGJvb2xlYW4sXG4gICAgaXNDbGFzc0Jhc2VkOiBib29sZWFuKTogYm9vbGVhbiB7XG4gIGNvbnN0IGhvc3RCaW5kaW5nc01vZGUgPSBpc0hvc3RTdHlsaW5nQWN0aXZlKHNvdXJjZUluZGV4KTtcbiAgY29uc3QgaG9zdEJpbmRpbmdzRmxhZyA9XG4gICAgICBpc0NsYXNzQmFzZWQgPyBUTm9kZUZsYWdzLmhhc0hvc3RDbGFzc0JpbmRpbmdzIDogVE5vZGVGbGFncy5oYXNIb3N0U3R5bGVCaW5kaW5ncztcbiAgaWYgKGZpcnN0VXBkYXRlUGFzcykge1xuICAgIC8vIHRoaXMgd2lsbCBvbmx5IGhhcHBlbiBkdXJpbmcgdGhlIGZpcnN0IHVwZGF0ZSBwYXNzIG9mIHRoZVxuICAgIC8vIGNvbnRleHQuIFRoZSByZWFzb24gd2h5IHdlIGNhbid0IHVzZSBgdFZpZXcuZmlyc3RDcmVhdGVQYXNzYFxuICAgIC8vIGhlcmUgaXMgYmVjYXVzZSBpdHMgbm90IGd1YXJhbnRlZWQgdG8gYmUgdHJ1ZSB3aGVuIHRoZSBmaXJzdFxuICAgIC8vIHVwZGF0ZSBwYXNzIGlzIGV4ZWN1dGVkIChyZW1lbWJlciB0aGF0IGFsbCBzdHlsaW5nIGluc3RydWN0aW9uc1xuICAgIC8vIGFyZSBydW4gaW4gdGhlIHVwZGF0ZSBwaGFzZSwgYW5kLCBhcyBhIHJlc3VsdCwgYXJlIG5vIG1vcmVcbiAgICAvLyBzdHlsaW5nIGluc3RydWN0aW9ucyB0aGF0IGFyZSBydW4gaW4gdGhlIGNyZWF0aW9uIHBoYXNlKS5cbiAgICByZWdpc3RlckJpbmRpbmcoXG4gICAgICAgIGNvbnRleHQsIHROb2RlLCBjb3VudGVySW5kZXgsIHNvdXJjZUluZGV4LCBwcm9wLCBiaW5kaW5nSW5kZXgsIHNhbml0aXphdGlvblJlcXVpcmVkLFxuICAgICAgICBpc0NsYXNzQmFzZWQpO1xuICB9XG5cbiAgY29uc3QgY2hhbmdlZCA9IGZvcmNlVXBkYXRlIHx8IGhhc1ZhbHVlQ2hhbmdlZChkYXRhW2JpbmRpbmdJbmRleF0sIHZhbHVlKTtcbiAgaWYgKGNoYW5nZWQpIHtcbiAgICBzZXRWYWx1ZShkYXRhLCBiaW5kaW5nSW5kZXgsIHZhbHVlKTtcbiAgICBjb25zdCBkb1NldFZhbHVlc0FzU3RhbGUgPVxuICAgICAgICBoYXNDb25maWcodE5vZGUsIGhvc3RCaW5kaW5nc0ZsYWcpICYmICFob3N0QmluZGluZ3NNb2RlICYmIChwcm9wID8gIXZhbHVlIDogdHJ1ZSk7XG4gICAgaWYgKGRvU2V0VmFsdWVzQXNTdGFsZSkge1xuICAgICAgcmVuZGVySG9zdEJpbmRpbmdzQXNTdGFsZShjb250ZXh0LCB0Tm9kZSwgZGF0YSwgcHJvcCwgaXNDbGFzc0Jhc2VkKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGNoYW5nZWQ7XG59XG5cbi8qKlxuICogSXRlcmF0ZXMgb3ZlciBhbGwgaG9zdC1iaW5kaW5nIHZhbHVlcyBmb3IgdGhlIGdpdmVuIGBwcm9wYCB2YWx1ZSBpbiB0aGUgY29udGV4dCBhbmQgc2V0cyB0aGVpclxuICogY29ycmVzcG9uZGluZyBiaW5kaW5nIHZhbHVlcyB0byBgbnVsbGAuXG4gKlxuICogV2hlbmV2ZXIgYSB0ZW1wbGF0ZSBiaW5kaW5nIGNoYW5nZXMgaXRzIHZhbHVlIHRvIGBudWxsYCwgYWxsIGhvc3QtYmluZGluZyB2YWx1ZXMgc2hvdWxkIGJlXG4gKiByZS1hcHBsaWVkXG4gKiB0byB0aGUgZWxlbWVudCB3aGVuIHRoZSBob3N0IGJpbmRpbmdzIGFyZSBldmFsdWF0ZWQuIFRoaXMgbWF5IG5vdCBhbHdheXMgaGFwcGVuIGluIHRoZSBldmVudFxuICogdGhhdCBub25lIG9mIHRoZSBiaW5kaW5ncyBjaGFuZ2VkIHdpdGhpbiB0aGUgaG9zdCBiaW5kaW5ncyBjb2RlLiBGb3IgdGhpcyByZWFzb24gdGhpcyBmdW5jdGlvblxuICogaXMgZXhwZWN0ZWQgdG8gYmUgY2FsbGVkIGVhY2ggdGltZSBhIHRlbXBsYXRlIGJpbmRpbmcgYmVjb21lcyBmYWxzeSBvciB3aGVuIGEgbWFwLWJhc2VkIHRlbXBsYXRlXG4gKiBiaW5kaW5nIGNoYW5nZXMuXG4gKi9cbmZ1bmN0aW9uIHJlbmRlckhvc3RCaW5kaW5nc0FzU3RhbGUoXG4gICAgY29udGV4dDogVFN0eWxpbmdDb250ZXh0LCB0Tm9kZTogVFN0eWxpbmdOb2RlLCBkYXRhOiBMU3R5bGluZ0RhdGEsIHByb3A6IHN0cmluZyB8IG51bGwsXG4gICAgaXNDbGFzc0Jhc2VkOiBib29sZWFuKTogdm9pZCB7XG4gIGNvbnN0IHZhbHVlc0NvdW50ID0gZ2V0VmFsdWVzQ291bnQoY29udGV4dCk7XG5cbiAgY29uc3QgaG9zdEJpbmRpbmdzRmxhZyA9XG4gICAgICBpc0NsYXNzQmFzZWQgPyBUTm9kZUZsYWdzLmhhc0hvc3RDbGFzc0JpbmRpbmdzIDogVE5vZGVGbGFncy5oYXNIb3N0U3R5bGVCaW5kaW5ncztcbiAgaWYgKHByb3AgIT09IG51bGwgJiYgaGFzQ29uZmlnKHROb2RlLCBob3N0QmluZGluZ3NGbGFnKSkge1xuICAgIGNvbnN0IGl0ZW1zUGVyUm93ID0gVFN0eWxpbmdDb250ZXh0SW5kZXguQmluZGluZ3NTdGFydE9mZnNldCArIHZhbHVlc0NvdW50O1xuXG4gICAgbGV0IGkgPSBUU3R5bGluZ0NvbnRleHRJbmRleC5WYWx1ZXNTdGFydFBvc2l0aW9uO1xuICAgIGxldCBmb3VuZCA9IGZhbHNlO1xuICAgIHdoaWxlIChpIDwgY29udGV4dC5sZW5ndGgpIHtcbiAgICAgIGlmIChnZXRQcm9wKGNvbnRleHQsIGkpID09PSBwcm9wKSB7XG4gICAgICAgIGZvdW5kID0gdHJ1ZTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBpICs9IGl0ZW1zUGVyUm93O1xuICAgIH1cblxuICAgIGlmIChmb3VuZCkge1xuICAgICAgY29uc3QgYmluZGluZ3NTdGFydCA9IGkgKyBUU3R5bGluZ0NvbnRleHRJbmRleC5CaW5kaW5nc1N0YXJ0T2Zmc2V0O1xuICAgICAgY29uc3QgdmFsdWVzU3RhcnQgPSBiaW5kaW5nc1N0YXJ0ICsgMTsgIC8vIHRoZSBmaXJzdCBjb2x1bW4gaXMgdGVtcGxhdGUgYmluZGluZ3NcbiAgICAgIGNvbnN0IHZhbHVlc0VuZCA9IGJpbmRpbmdzU3RhcnQgKyB2YWx1ZXNDb3VudCAtIDE7XG5cbiAgICAgIGZvciAobGV0IGkgPSB2YWx1ZXNTdGFydDsgaSA8IHZhbHVlc0VuZDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IGJpbmRpbmdJbmRleCA9IGNvbnRleHRbaV0gYXMgbnVtYmVyO1xuICAgICAgICBpZiAoYmluZGluZ0luZGV4ICE9PSAwKSB7XG4gICAgICAgICAgc2V0VmFsdWUoZGF0YSwgYmluZGluZ0luZGV4LCBudWxsKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGNvbnN0IG1hcEJpbmRpbmdzRmxhZyA9XG4gICAgICBpc0NsYXNzQmFzZWQgPyBUTm9kZUZsYWdzLmhhc0NsYXNzTWFwQmluZGluZ3MgOiBUTm9kZUZsYWdzLmhhc1N0eWxlTWFwQmluZGluZ3M7XG4gIGlmIChoYXNDb25maWcodE5vZGUsIG1hcEJpbmRpbmdzRmxhZykpIHtcbiAgICBjb25zdCBiaW5kaW5nc1N0YXJ0ID1cbiAgICAgICAgVFN0eWxpbmdDb250ZXh0SW5kZXguVmFsdWVzU3RhcnRQb3NpdGlvbiArIFRTdHlsaW5nQ29udGV4dEluZGV4LkJpbmRpbmdzU3RhcnRPZmZzZXQ7XG4gICAgY29uc3QgdmFsdWVzU3RhcnQgPSBiaW5kaW5nc1N0YXJ0ICsgMTsgIC8vIHRoZSBmaXJzdCBjb2x1bW4gaXMgdGVtcGxhdGUgYmluZGluZ3NcbiAgICBjb25zdCB2YWx1ZXNFbmQgPSBiaW5kaW5nc1N0YXJ0ICsgdmFsdWVzQ291bnQgLSAxO1xuICAgIGZvciAobGV0IGkgPSB2YWx1ZXNTdGFydDsgaSA8IHZhbHVlc0VuZDsgaSsrKSB7XG4gICAgICBjb25zdCBzdHlsaW5nTWFwID0gZ2V0VmFsdWU8U3R5bGluZ01hcEFycmF5PihkYXRhLCBjb250ZXh0W2ldIGFzIG51bWJlcik7XG4gICAgICBpZiAoc3R5bGluZ01hcCkge1xuICAgICAgICBzZXRNYXBBc0RpcnR5KHN0eWxpbmdNYXApO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIFJlZ2lzdGVycyB0aGUgcHJvdmlkZWQgYmluZGluZyAocHJvcCArIGJpbmRpbmdJbmRleCkgaW50byB0aGUgY29udGV4dC5cbiAqXG4gKiBJdCBpcyBuZWVkZWQgYmVjYXVzZSBpdCB3aWxsIGVpdGhlciB1cGRhdGUgb3IgaW5zZXJ0IGEgc3R5bGluZyBwcm9wZXJ0eVxuICogaW50byB0aGUgY29udGV4dCBhdCB0aGUgY29ycmVjdCBzcG90LlxuICpcbiAqIFdoZW4gY2FsbGVkLCBvbmUgb2YgdHdvIHRoaW5ncyB3aWxsIGhhcHBlbjpcbiAqXG4gKiAxKSBJZiB0aGUgcHJvcGVydHkgYWxyZWFkeSBleGlzdHMgaW4gdGhlIGNvbnRleHQgdGhlbiBpdCB3aWxsIGp1c3QgYWRkXG4gKiAgICB0aGUgcHJvdmlkZWQgYGJpbmRpbmdWYWx1ZWAgdG8gdGhlIGVuZCBvZiB0aGUgYmluZGluZyBzb3VyY2VzIHJlZ2lvblxuICogICAgZm9yIHRoYXQgcGFydGljdWxhciBwcm9wZXJ0eS5cbiAqXG4gKiAgICAtIElmIHRoZSBiaW5kaW5nIHZhbHVlIGlzIGEgbnVtYmVyIHRoZW4gaXQgd2lsbCBiZSBhZGRlZCBhcyBhIG5ld1xuICogICAgICBiaW5kaW5nIGluZGV4IHNvdXJjZSBuZXh0IHRvIHRoZSBvdGhlciBiaW5kaW5nIHNvdXJjZXMgZm9yIHRoZSBwcm9wZXJ0eS5cbiAqXG4gKiAgICAtIE90aGVyd2lzZSwgaWYgdGhlIGJpbmRpbmcgdmFsdWUgaXMgYSBzdHJpbmcvYm9vbGVhbi9udWxsIHR5cGUgdGhlbiBpdCB3aWxsXG4gKiAgICAgIHJlcGxhY2UgdGhlIGRlZmF1bHQgdmFsdWUgZm9yIHRoZSBwcm9wZXJ0eSBpZiB0aGUgZGVmYXVsdCB2YWx1ZSBpcyBgbnVsbGAuXG4gKlxuICogMikgSWYgdGhlIHByb3BlcnR5IGRvZXMgbm90IGV4aXN0IHRoZW4gaXQgd2lsbCBiZSBpbnNlcnRlZCBpbnRvIHRoZSBjb250ZXh0LlxuICogICAgVGhlIHN0eWxpbmcgY29udGV4dCByZWxpZXMgb24gYWxsIHByb3BlcnRpZXMgYmVpbmcgc3RvcmVkIGluIGFscGhhYmV0aWNhbFxuICogICAgb3JkZXIsIHNvIGl0IGtub3dzIGV4YWN0bHkgd2hlcmUgdG8gc3RvcmUgaXQuXG4gKlxuICogICAgV2hlbiBpbnNlcnRlZCwgYSBkZWZhdWx0IGBudWxsYCB2YWx1ZSBpcyBjcmVhdGVkIGZvciB0aGUgcHJvcGVydHkgd2hpY2ggZXhpc3RzXG4gKiAgICBhcyB0aGUgZGVmYXVsdCB2YWx1ZSBmb3IgdGhlIGJpbmRpbmcuIElmIHRoZSBiaW5kaW5nVmFsdWUgcHJvcGVydHkgaXMgaW5zZXJ0ZWRcbiAqICAgIGFuZCBpdCBpcyBlaXRoZXIgYSBzdHJpbmcsIG51bWJlciBvciBudWxsIHZhbHVlIHRoZW4gdGhhdCB3aWxsIHJlcGxhY2UgdGhlIGRlZmF1bHRcbiAqICAgIHZhbHVlLlxuICpcbiAqIE5vdGUgdGhhdCB0aGlzIGZ1bmN0aW9uIGlzIGFsc28gdXNlZCBmb3IgbWFwLWJhc2VkIHN0eWxpbmcgYmluZGluZ3MuIFRoZXkgYXJlIHRyZWF0ZWRcbiAqIG11Y2ggdGhlIHNhbWUgYXMgcHJvcC1iYXNlZCBiaW5kaW5ncywgYnV0LCB0aGVpciBwcm9wZXJ0eSBuYW1lIHZhbHVlIGlzIHNldCBhcyBgW01BUF1gLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVnaXN0ZXJCaW5kaW5nKFxuICAgIGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCwgdE5vZGU6IFRTdHlsaW5nTm9kZSwgY291bnRJZDogbnVtYmVyLCBzb3VyY2VJbmRleDogbnVtYmVyLFxuICAgIHByb3A6IHN0cmluZyB8IG51bGwsIGJpbmRpbmdWYWx1ZTogbnVtYmVyIHwgbnVsbCB8IHN0cmluZyB8IGJvb2xlYW4sXG4gICAgc2FuaXRpemF0aW9uUmVxdWlyZWQ6IGJvb2xlYW4sIGlzQ2xhc3NCYXNlZDogYm9vbGVhbik6IHZvaWQge1xuICBsZXQgZm91bmQgPSBmYWxzZTtcbiAgcHJvcCA9IHByb3AgfHwgTUFQX0JBU0VEX0VOVFJZX1BST1BfTkFNRTtcblxuICBsZXQgdG90YWxTb3VyY2VzID0gZ2V0VG90YWxTb3VyY2VzKGNvbnRleHQpO1xuXG4gIC8vIGlmIGEgbmV3IHNvdXJjZSBpcyBkZXRlY3RlZCB0aGVuIGEgbmV3IGNvbHVtbiBuZWVkcyB0byBiZSBhbGxvY2F0ZWQgaW50b1xuICAvLyB0aGUgc3R5bGluZyBjb250ZXh0LiBUaGUgY29sdW1uIGlzIGJhc2ljYWxseSBhIG5ldyBhbGxvY2F0aW9uIG9mIGJpbmRpbmdcbiAgLy8gc291cmNlcyB0aGF0IHdpbGwgYmUgYXZhaWxhYmxlIHRvIGVhY2ggcHJvcGVydHkuXG4gIHdoaWxlICh0b3RhbFNvdXJjZXMgPD0gc291cmNlSW5kZXgpIHtcbiAgICBhZGROZXdTb3VyY2VDb2x1bW4oY29udGV4dCk7XG4gICAgdG90YWxTb3VyY2VzKys7XG4gIH1cblxuICBjb25zdCBjb2xsaXNpb25GbGFnID1cbiAgICAgIGlzQ2xhc3NCYXNlZCA/IFROb2RlRmxhZ3MuaGFzRHVwbGljYXRlQ2xhc3NCaW5kaW5ncyA6IFROb2RlRmxhZ3MuaGFzRHVwbGljYXRlU3R5bGVCaW5kaW5ncztcbiAgY29uc3QgaXNCaW5kaW5nSW5kZXhWYWx1ZSA9IHR5cGVvZiBiaW5kaW5nVmFsdWUgPT09ICdudW1iZXInO1xuICBjb25zdCBlbnRyaWVzUGVyUm93ID0gVFN0eWxpbmdDb250ZXh0SW5kZXguQmluZGluZ3NTdGFydE9mZnNldCArIGdldFZhbHVlc0NvdW50KGNvbnRleHQpO1xuICBsZXQgaSA9IFRTdHlsaW5nQ29udGV4dEluZGV4LlZhbHVlc1N0YXJ0UG9zaXRpb247XG5cbiAgLy8gYWxsIHN0eWxlL2NsYXNzIGJpbmRpbmdzIGFyZSBzb3J0ZWQgYnkgcHJvcGVydHkgbmFtZVxuICB3aGlsZSAoaSA8IGNvbnRleHQubGVuZ3RoKSB7XG4gICAgY29uc3QgcCA9IGdldFByb3AoY29udGV4dCwgaSk7XG4gICAgaWYgKHByb3AgPD0gcCkge1xuICAgICAgaWYgKHByb3AgPCBwKSB7XG4gICAgICAgIGFsbG9jYXRlTmV3Q29udGV4dEVudHJ5KGNvbnRleHQsIGksIHByb3AsIHNhbml0aXphdGlvblJlcXVpcmVkKTtcbiAgICAgIH0gZWxzZSBpZiAoaXNCaW5kaW5nSW5kZXhWYWx1ZSkge1xuICAgICAgICBwYXRjaENvbmZpZyh0Tm9kZSwgY29sbGlzaW9uRmxhZyk7XG4gICAgICB9XG4gICAgICBhZGRCaW5kaW5nSW50b0NvbnRleHQoY29udGV4dCwgaSwgYmluZGluZ1ZhbHVlLCBjb3VudElkLCBzb3VyY2VJbmRleCk7XG4gICAgICBmb3VuZCA9IHRydWU7XG4gICAgICBicmVhaztcbiAgICB9XG4gICAgaSArPSBlbnRyaWVzUGVyUm93O1xuICB9XG5cbiAgaWYgKCFmb3VuZCkge1xuICAgIGFsbG9jYXRlTmV3Q29udGV4dEVudHJ5KGNvbnRleHQsIGNvbnRleHQubGVuZ3RoLCBwcm9wLCBzYW5pdGl6YXRpb25SZXF1aXJlZCk7XG4gICAgYWRkQmluZGluZ0ludG9Db250ZXh0KGNvbnRleHQsIGksIGJpbmRpbmdWYWx1ZSwgY291bnRJZCwgc291cmNlSW5kZXgpO1xuICB9XG59XG5cbi8qKlxuICogSW5zZXJ0cyBhIG5ldyByb3cgaW50byB0aGUgcHJvdmlkZWQgYFRTdHlsaW5nQ29udGV4dGAgYW5kIGFzc2lnbnMgdGhlIHByb3ZpZGVkIGBwcm9wYCB2YWx1ZSBhc1xuICogdGhlIHByb3BlcnR5IGVudHJ5LlxuICovXG5mdW5jdGlvbiBhbGxvY2F0ZU5ld0NvbnRleHRFbnRyeShcbiAgICBjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQsIGluZGV4OiBudW1iZXIsIHByb3A6IHN0cmluZywgc2FuaXRpemF0aW9uUmVxdWlyZWQ/OiBib29sZWFuKTogdm9pZCB7XG4gIGNvbnN0IGNvbmZpZyA9IHNhbml0aXphdGlvblJlcXVpcmVkID8gVFN0eWxpbmdDb250ZXh0UHJvcENvbmZpZ0ZsYWdzLlNhbml0aXphdGlvblJlcXVpcmVkIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBUU3R5bGluZ0NvbnRleHRQcm9wQ29uZmlnRmxhZ3MuRGVmYXVsdDtcbiAgY29udGV4dC5zcGxpY2UoXG4gICAgICBpbmRleCwgMCxcbiAgICAgIGNvbmZpZywgICAgICAgICAgICAgICAgICAgIC8vIDEpIGNvbmZpZyB2YWx1ZVxuICAgICAgREVGQVVMVF9HVUFSRF9NQVNLX1ZBTFVFLCAgLy8gMikgdGVtcGxhdGUgYml0IG1hc2tcbiAgICAgIERFRkFVTFRfR1VBUkRfTUFTS19WQUxVRSwgIC8vIDMpIGhvc3QgYmluZGluZ3MgYml0IG1hc2tcbiAgICAgIHByb3AsICAgICAgICAgICAgICAgICAgICAgIC8vIDQpIHByb3AgdmFsdWUgKGUuZy4gYHdpZHRoYCwgYG15Q2xhc3NgLCBldGMuLi4pXG4gICAgICApO1xuXG4gIGluZGV4ICs9IDQ7ICAvLyB0aGUgNCB2YWx1ZXMgYWJvdmVcblxuICAvLyA1Li4uKSBkZWZhdWx0IGJpbmRpbmcgaW5kZXggZm9yIHRoZSB0ZW1wbGF0ZSB2YWx1ZVxuICAvLyBkZXBlbmRpbmcgb24gaG93IG1hbnkgc291cmNlcyBhbHJlYWR5IGV4aXN0IGluIHRoZSBjb250ZXh0LFxuICAvLyBtdWx0aXBsZSBkZWZhdWx0IGluZGV4IGVudHJpZXMgbWF5IG5lZWQgdG8gYmUgaW5zZXJ0ZWQgZm9yXG4gIC8vIHRoZSBuZXcgdmFsdWUgaW4gdGhlIGNvbnRleHQuXG4gIGNvbnN0IHRvdGFsQmluZGluZ3NQZXJFbnRyeSA9IGdldFRvdGFsU291cmNlcyhjb250ZXh0KTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCB0b3RhbEJpbmRpbmdzUGVyRW50cnk7IGkrKykge1xuICAgIGNvbnRleHQuc3BsaWNlKGluZGV4LCAwLCBERUZBVUxUX0JJTkRJTkdfSU5ERVgpO1xuICAgIGluZGV4Kys7XG4gIH1cblxuICAvLyA2KSBkZWZhdWx0IGJpbmRpbmcgdmFsdWUgZm9yIHRoZSBuZXcgZW50cnlcbiAgY29udGV4dC5zcGxpY2UoaW5kZXgsIDAsIERFRkFVTFRfQklORElOR19WQUxVRSk7XG59XG5cbi8qKlxuICogSW5zZXJ0cyBhIG5ldyBiaW5kaW5nIHZhbHVlIGludG8gYSBzdHlsaW5nIHByb3BlcnR5IHR1cGxlIGluIHRoZSBgVFN0eWxpbmdDb250ZXh0YC5cbiAqXG4gKiBBIGJpbmRpbmdWYWx1ZSBpcyBpbnNlcnRlZCBpbnRvIGEgY29udGV4dCBkdXJpbmcgdGhlIGZpcnN0IHVwZGF0ZSBwYXNzXG4gKiBvZiBhIHRlbXBsYXRlIG9yIGhvc3QgYmluZGluZ3MgZnVuY3Rpb24uIFdoZW4gdGhpcyBvY2N1cnMsIHR3byB0aGluZ3NcbiAqIGhhcHBlbjpcbiAqXG4gKiAtIElmIHRoZSBiaW5kaW5nVmFsdWUgdmFsdWUgaXMgYSBudW1iZXIgdGhlbiBpdCBpcyB0cmVhdGVkIGFzIGEgYmluZGluZ0luZGV4XG4gKiAgIHZhbHVlIChhIGluZGV4IGluIHRoZSBgTFZpZXdgKSBhbmQgaXQgd2lsbCBiZSBpbnNlcnRlZCBuZXh0IHRvIHRoZSBvdGhlclxuICogICBiaW5kaW5nIGluZGV4IGVudHJpZXMuXG4gKlxuICogLSBPdGhlcndpc2UgdGhlIGJpbmRpbmcgdmFsdWUgd2lsbCB1cGRhdGUgdGhlIGRlZmF1bHQgdmFsdWUgZm9yIHRoZSBwcm9wZXJ0eVxuICogICBhbmQgdGhpcyB3aWxsIG9ubHkgaGFwcGVuIGlmIHRoZSBkZWZhdWx0IHZhbHVlIGlzIGBudWxsYC5cbiAqL1xuZnVuY3Rpb24gYWRkQmluZGluZ0ludG9Db250ZXh0KFxuICAgIGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCwgaW5kZXg6IG51bWJlciwgYmluZGluZ1ZhbHVlOiBudW1iZXIgfCBzdHJpbmcgfCBib29sZWFuIHwgbnVsbCxcbiAgICBiaXRJbmRleDogbnVtYmVyLCBzb3VyY2VJbmRleDogbnVtYmVyKSB7XG4gIGlmICh0eXBlb2YgYmluZGluZ1ZhbHVlID09PSAnbnVtYmVyJykge1xuICAgIGNvbnN0IGhvc3RCaW5kaW5nc01vZGUgPSBpc0hvc3RTdHlsaW5nQWN0aXZlKHNvdXJjZUluZGV4KTtcbiAgICBjb25zdCBjZWxsSW5kZXggPSBpbmRleCArIFRTdHlsaW5nQ29udGV4dEluZGV4LkJpbmRpbmdzU3RhcnRPZmZzZXQgKyBzb3VyY2VJbmRleDtcbiAgICBjb250ZXh0W2NlbGxJbmRleF0gPSBiaW5kaW5nVmFsdWU7XG4gICAgY29uc3QgdXBkYXRlZEJpdE1hc2sgPSBnZXRHdWFyZE1hc2soY29udGV4dCwgaW5kZXgsIGhvc3RCaW5kaW5nc01vZGUpIHwgKDEgPDwgYml0SW5kZXgpO1xuICAgIHNldEd1YXJkTWFzayhjb250ZXh0LCBpbmRleCwgdXBkYXRlZEJpdE1hc2ssIGhvc3RCaW5kaW5nc01vZGUpO1xuICB9IGVsc2UgaWYgKGJpbmRpbmdWYWx1ZSAhPT0gbnVsbCAmJiBnZXREZWZhdWx0VmFsdWUoY29udGV4dCwgaW5kZXgpID09PSBudWxsKSB7XG4gICAgc2V0RGVmYXVsdFZhbHVlKGNvbnRleHQsIGluZGV4LCBiaW5kaW5nVmFsdWUpO1xuICB9XG59XG5cbi8qKlxuICogUmVnaXN0ZXJzIGEgbmV3IGNvbHVtbiBpbnRvIHRoZSBwcm92aWRlZCBgVFN0eWxpbmdDb250ZXh0YC5cbiAqXG4gKiBJZiBhbmQgd2hlbiBhIG5ldyBzb3VyY2UgaXMgZGV0ZWN0ZWQgdGhlbiBhIG5ldyBjb2x1bW4gbmVlZHMgdG9cbiAqIGJlIGFsbG9jYXRlZCBpbnRvIHRoZSBzdHlsaW5nIGNvbnRleHQuIFRoZSBjb2x1bW4gaXMgYmFzaWNhbGx5XG4gKiBhIG5ldyBhbGxvY2F0aW9uIG9mIGJpbmRpbmcgc291cmNlcyB0aGF0IHdpbGwgYmUgYXZhaWxhYmxlIHRvIGVhY2hcbiAqIHByb3BlcnR5LlxuICpcbiAqIEVhY2ggY29sdW1uIHRoYXQgZXhpc3RzIGluIHRoZSBzdHlsaW5nIGNvbnRleHQgcmVzZW1ibGVzIGEgc3R5bGluZ1xuICogc291cmNlLiBBIHN0eWxpbmcgc291cmNlIGFuIGVpdGhlciBiZSB0aGUgdGVtcGxhdGUgb3Igb25lIG9yIG1vcmVcbiAqIGNvbXBvbmVudHMgb3IgZGlyZWN0aXZlcyBhbGwgY29udGFpbmluZyBzdHlsaW5nIGhvc3QgYmluZGluZ3MuXG4gKi9cbmZ1bmN0aW9uIGFkZE5ld1NvdXJjZUNvbHVtbihjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQpOiB2b2lkIHtcbiAgLy8gd2UgdXNlIC0xIGhlcmUgYmVjYXVzZSB3ZSB3YW50IHRvIGluc2VydCByaWdodCBiZWZvcmUgdGhlIGxhc3QgdmFsdWUgKHRoZSBkZWZhdWx0IHZhbHVlKVxuICBjb25zdCBpbnNlcnRPZmZzZXQgPSBUU3R5bGluZ0NvbnRleHRJbmRleC5CaW5kaW5nc1N0YXJ0T2Zmc2V0ICsgZ2V0VmFsdWVzQ291bnQoY29udGV4dCkgLSAxO1xuXG4gIGxldCBpbmRleCA9IFRTdHlsaW5nQ29udGV4dEluZGV4LlZhbHVlc1N0YXJ0UG9zaXRpb247XG4gIHdoaWxlIChpbmRleCA8IGNvbnRleHQubGVuZ3RoKSB7XG4gICAgaW5kZXggKz0gaW5zZXJ0T2Zmc2V0O1xuICAgIGNvbnRleHQuc3BsaWNlKGluZGV4KyssIDAsIERFRkFVTFRfQklORElOR19JTkRFWCk7XG5cbiAgICAvLyB0aGUgdmFsdWUgd2FzIGluc2VydGVkIGp1c3QgYmVmb3JlIHRoZSBkZWZhdWx0IHZhbHVlLCBidXQgdGhlXG4gICAgLy8gbmV4dCBlbnRyeSBpbiB0aGUgY29udGV4dCBzdGFydHMganVzdCBhZnRlciBpdC4gVGhlcmVmb3JlKysuXG4gICAgaW5kZXgrKztcbiAgfVxuICBjb250ZXh0W1RTdHlsaW5nQ29udGV4dEluZGV4LlRvdGFsU291cmNlc1Bvc2l0aW9uXSsrO1xufVxuXG4vKipcbiAqIEFwcGxpZXMgYWxsIHBlbmRpbmcgc3R5bGUgYW5kIGNsYXNzIGJpbmRpbmdzIHRvIHRoZSBwcm92aWRlZCBlbGVtZW50LlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gd2lsbCBhdHRlbXB0IHRvIGZsdXNoIHN0eWxpbmcgdmlhIHRoZSBwcm92aWRlZCBgY2xhc3Nlc0NvbnRleHRgXG4gKiBhbmQgYHN0eWxlc0NvbnRleHRgIGNvbnRleHQgdmFsdWVzLiBUaGlzIGZ1bmN0aW9uIGlzIGRlc2lnbmVkIHRvIGJlIHJ1biBmcm9tXG4gKiB0aGUgaW50ZXJuYWwgYHN0eWxpbmdBcHBseWAgZnVuY3Rpb24gKHdoaWNoIGlzIHNjaGVkdWxlZCB0byBydW4gYXQgdGhlIHZlcnlcbiAqIGVuZCBvZiBjaGFuZ2UgZGV0ZWN0aW9uIGZvciBhbiBlbGVtZW50IGlmIG9uZSBvciBtb3JlIHN0eWxlL2NsYXNzIGJpbmRpbmdzXG4gKiB3ZXJlIHByb2Nlc3NlZCkgYW5kIHdpbGwgcmVseSBvbiBhbnkgc3RhdGUgdmFsdWVzIHRoYXQgYXJlIHNldCBmcm9tIHdoZW5cbiAqIGFueSBvZiB0aGUgc3R5bGluZyBiaW5kaW5ncyBleGVjdXRlZC5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIGlzIGRlc2lnbmVkIHRvIGJlIGNhbGxlZCB0d2ljZTogb25lIHdoZW4gY2hhbmdlIGRldGVjdGlvbiBoYXNcbiAqIHByb2Nlc3NlZCBhbiBlbGVtZW50IHdpdGhpbiB0aGUgdGVtcGxhdGUgYmluZGluZ3MgKGkuZS4ganVzdCBhcyBgYWR2YW5jZSgpYFxuICogaXMgY2FsbGVkKSBhbmQgd2hlbiBob3N0IGJpbmRpbmdzIGhhdmUgYmVlbiBwcm9jZXNzZWQuIEluIGJvdGggY2FzZXMgdGhlXG4gKiBzdHlsZXMgYW5kIGNsYXNzZXMgaW4gYm90aCBjb250ZXh0cyB3aWxsIGJlIGFwcGxpZWQgdG8gdGhlIGVsZW1lbnQsIGJ1dCB0aGVcbiAqIGFsZ29yaXRobSB3aWxsIHNlbGVjdGl2ZWx5IGRlY2lkZSB3aGljaCBiaW5kaW5ncyB0byBydW4gZGVwZW5kaW5nIG9uIHRoZVxuICogY29sdW1ucyBpbiB0aGUgY29udGV4dC4gVGhlIHByb3ZpZGVkIGBkaXJlY3RpdmVJbmRleGAgdmFsdWUgd2lsbCBoZWxwIHRoZVxuICogYWxnb3JpdGhtIGRldGVybWluZSB3aGljaCBiaW5kaW5ncyB0byBhcHBseTogZWl0aGVyIHRoZSB0ZW1wbGF0ZSBiaW5kaW5ncyBvclxuICogdGhlIGhvc3QgYmluZGluZ3MgKHNlZSBgYXBwbHlTdHlsaW5nVG9FbGVtZW50YCBmb3IgbW9yZSBpbmZvcm1hdGlvbikuXG4gKlxuICogTm90ZSB0aGF0IG9uY2UgdGhpcyBmdW5jdGlvbiBpcyBjYWxsZWQgYWxsIHRlbXBvcmFyeSBzdHlsaW5nIHN0YXRlIGRhdGFcbiAqIChpLmUuIHRoZSBgYml0TWFza2AgYW5kIGBjb3VudGVyYCB2YWx1ZXMgZm9yIHN0eWxlcyBhbmQgY2xhc3NlcyB3aWxsIGJlIGNsZWFyZWQpLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZmx1c2hTdHlsaW5nKFxuICAgIHJlbmRlcmVyOiBSZW5kZXJlcjMgfCBQcm9jZWR1cmFsUmVuZGVyZXIzIHwgbnVsbCwgZGF0YTogTFN0eWxpbmdEYXRhLCB0Tm9kZTogVFN0eWxpbmdOb2RlLFxuICAgIGNsYXNzZXNDb250ZXh0OiBUU3R5bGluZ0NvbnRleHQgfCBudWxsLCBzdHlsZXNDb250ZXh0OiBUU3R5bGluZ0NvbnRleHQgfCBudWxsLFxuICAgIGVsZW1lbnQ6IFJFbGVtZW50LCBkaXJlY3RpdmVJbmRleDogbnVtYmVyLCBzdHlsZVNhbml0aXplcjogU3R5bGVTYW5pdGl6ZUZuIHwgbnVsbCxcbiAgICBmaXJzdFVwZGF0ZVBhc3M6IGJvb2xlYW4pOiB2b2lkIHtcbiAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5mbHVzaFN0eWxpbmcrKztcblxuICBjb25zdCBzdGF0ZSA9IGdldFN0eWxpbmdTdGF0ZShlbGVtZW50LCBkaXJlY3RpdmVJbmRleCk7XG4gIGNvbnN0IGhvc3RCaW5kaW5nc01vZGUgPSBpc0hvc3RTdHlsaW5nQWN0aXZlKHN0YXRlLnNvdXJjZUluZGV4KTtcblxuICBpZiAoc3R5bGVzQ29udGV4dCkge1xuICAgIGZpcnN0VXBkYXRlUGFzcyAmJiBzeW5jQ29udGV4dEluaXRpYWxTdHlsaW5nKHN0eWxlc0NvbnRleHQsIHROb2RlLCBmYWxzZSk7XG5cbiAgICBpZiAoc3RhdGUuc3R5bGVzQml0TWFzayAhPT0gMCkge1xuICAgICAgYXBwbHlTdHlsaW5nVmlhQ29udGV4dChcbiAgICAgICAgICBzdHlsZXNDb250ZXh0LCB0Tm9kZSwgcmVuZGVyZXIsIGVsZW1lbnQsIGRhdGEsIHN0YXRlLnN0eWxlc0JpdE1hc2ssIHNldFN0eWxlLFxuICAgICAgICAgIHN0eWxlU2FuaXRpemVyLCBob3N0QmluZGluZ3NNb2RlLCBmYWxzZSk7XG4gICAgfVxuICB9XG5cbiAgaWYgKGNsYXNzZXNDb250ZXh0KSB7XG4gICAgZmlyc3RVcGRhdGVQYXNzICYmIHN5bmNDb250ZXh0SW5pdGlhbFN0eWxpbmcoY2xhc3Nlc0NvbnRleHQsIHROb2RlLCB0cnVlKTtcblxuICAgIGlmIChzdGF0ZS5jbGFzc2VzQml0TWFzayAhPT0gMCkge1xuICAgICAgYXBwbHlTdHlsaW5nVmlhQ29udGV4dChcbiAgICAgICAgICBjbGFzc2VzQ29udGV4dCwgdE5vZGUsIHJlbmRlcmVyLCBlbGVtZW50LCBkYXRhLCBzdGF0ZS5jbGFzc2VzQml0TWFzaywgc2V0Q2xhc3MsIG51bGwsXG4gICAgICAgICAgaG9zdEJpbmRpbmdzTW9kZSwgdHJ1ZSk7XG4gICAgfVxuICB9XG5cbiAgcmVzZXRTdHlsaW5nU3RhdGUoKTtcbn1cblxuLyoqXG4gKiBSZWdpc3RlcnMgYWxsIHN0YXRpYyBzdHlsaW5nIHZhbHVlcyBpbnRvIHRoZSBjb250ZXh0IGFzIGRlZmF1bHQgdmFsdWVzLlxuICpcbiAqIFN0YXRpYyBzdHlsZXMgYXJlIHN0b3JlZCBvbiB0aGUgYHROb2RlLnN0eWxlc2AgYW5kIGB0Tm9kZS5jbGFzc2VzYFxuICogcHJvcGVydGllcyBhcyBpbnN0YW5jZXMgb2YgYFN0eWxpbmdNYXBBcnJheWAuIFdoZW4gYW4gaW5zdGFuY2Ugb2ZcbiAqIGBUU3R5bGluZ0NvbnRleHRgIGlzIGFzc2lnbmVkIHRvIGB0Tm9kZS5zdHlsZXNgIGFuZCBgdE5vZGUuY2xhc3Nlc2BcbiAqIHRoZW4gdGhlIGV4aXN0aW5nIGluaXRpYWwgc3R5bGluZyB2YWx1ZXMgYXJlIGNvcGllZCBpbnRvIHRoZSB0aGVcbiAqIGBJbml0aWFsU3R5bGluZ1ZhbHVlUG9zaXRpb25gIHNsb3QuXG4gKlxuICogQmVjYXVzZSBhbGwgc3RhdGljIHN0eWxlcy9jbGFzc2VzIGFyZSBjb2xsZWN0ZWQgYW5kIHJlZ2lzdGVyZWQgb25cbiAqIHRoZSBpbml0aWFsIHN0eWxpbmcgYXJyYXkgZWFjaCB0aW1lIGEgZGlyZWN0aXZlIGlzIGluc3RhbnRpYXRlZCxcbiAqIHRoZSBjb250ZXh0IG1heSBub3QgeWV0IGtub3cgYWJvdXQgdGhlIHN0YXRpYyB2YWx1ZXMuIFdoZW4gdGhpc1xuICogZnVuY3Rpb24gaXMgY2FsbGVkIGl0IHdpbGwgY29weSBvdmVyIGFsbCB0aGUgc3RhdGljIHN0eWxlL2NsYXNzXG4gKiB2YWx1ZXMgZnJvbSB0aGUgaW5pdGlhbCBzdHlsaW5nIGFycmF5IGludG8gdGhlIGNvbnRleHQgYXMgZGVmYXVsdFxuICogdmFsdWVzIGZvciBlYWNoIG9mIHRoZSBtYXRjaGluZyBlbnRyaWVzIGluIHRoZSBjb250ZXh0LlxuICpcbiAqIExldCdzIGltYWdpbmUgdGhlIGZvbGxvd2luZyBleGFtcGxlOlxuICpcbiAqIGBgYGh0bWxcbiAqIDxkaXYgc3R5bGU9XCJjb2xvcjpyZWRcIlxuICogICAgIFtzdHlsZS5jb2xvcl09XCJteUNvbG9yXCJcbiAqICAgICBkaXItdGhhdC1oYXMtc3RhdGljLWhlaWdodD5cbiAqICAgLi4uXG4gKiA8L2Rpdj5cbiAqIGBgYFxuICpcbiAqIFdoZW4gdGhlIGNvZGUgYWJvdmUgaXMgcHJvY2Vzc2VkLCB0aGUgdW5kZXJseWluZyBlbGVtZW50L3N0eWxpbmdcbiAqIGluc3RydWN0aW9ucyB3aWxsIGNyZWF0ZSBhbiBpbnN0YW5jZSBvZiBgVFN0eWxpbmdDb250ZXh0YCBmb3JcbiAqIHRoZSBgdE5vZGUuc3R5bGVzYCBwcm9wZXJ0eS4gSGVyZSdzIHdoYXQgdGhhdCBsb29rcyBsaWtlOlxuICpcbiAqIGBgYHR5cGVzY3JpcHRcbiAqIHROb2RlLnN0eWxlcyA9IFtcbiAqICAgLy8gLi4uXG4gKiAgIC8vIGluaXRpYWwgc3R5bGVzXG4gKiAgIFsnY29sb3I6cmVkOyBoZWlnaHQ6MjAwcHgnLCAnY29sb3InLCAncmVkJywgJ2hlaWdodCcsICcyMDBweCddLFxuICpcbiAqICAgMCwgMGIxLCAwYjAsICdjb2xvcicsIDIwLCBudWxsLCAvLyBbc3R5bGUuY29sb3JdIGJpbmRpbmdcbiAqIF1cbiAqIGBgYFxuICpcbiAqIEFmdGVyIHRoaXMgZnVuY3Rpb24gaXMgY2FsbGVkIGl0IHdpbGwgYmFsYW5jZSBvdXQgdGhlIGNvbnRleHQgd2l0aFxuICogdGhlIHN0YXRpYyBgY29sb3JgIGFuZCBgaGVpZ2h0YCB2YWx1ZXMgYW5kIHNldCB0aGVtIGFzIGRlZmF1bHRzIHdpdGhpblxuICogdGhlIGNvbnRleHQ6XG4gKlxuICogYGBgdHlwZXNjcmlwdFxuICogdE5vZGUuc3R5bGVzID0gW1xuICogICAvLyAuLi5cbiAqICAgLy8gaW5pdGlhbCBzdHlsZXNcbiAqICAgWydjb2xvcjpyZWQ7IGhlaWdodDoyMDBweCcsICdjb2xvcicsICdyZWQnLCAnaGVpZ2h0JywgJzIwMHB4J10sXG4gKlxuICogICAwLCAwYjEsIDBiMCwgJ2NvbG9yJywgMjAsICdyZWQnLFxuICogICAwLCAwYjAsIDBiMCwgJ2hlaWdodCcsIDAsICcyMDBweCcsXG4gKiBdXG4gKiBgYGBcbiAqL1xuZnVuY3Rpb24gc3luY0NvbnRleHRJbml0aWFsU3R5bGluZyhcbiAgICBjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQsIHROb2RlOiBUU3R5bGluZ05vZGUsIGlzQ2xhc3NCYXNlZDogYm9vbGVhbik6IHZvaWQge1xuICAvLyB0aGUgVFN0eWxpbmdDb250ZXh0IGFsd2F5cyBoYXMgaW5pdGlhbCBzdHlsZS9jbGFzcyB2YWx1ZXMgd2hpY2ggYXJlXG4gIC8vIHN0b3JlZCBpbiBzdHlsaW5nIGFycmF5IGZvcm1hdC5cbiAgdXBkYXRlSW5pdGlhbFN0eWxpbmdPbkNvbnRleHQoY29udGV4dCwgdE5vZGUsIGdldFN0eWxpbmdNYXBBcnJheShjb250ZXh0KSAhLCBpc0NsYXNzQmFzZWQpO1xufVxuXG4vKipcbiAqIFJlZ2lzdGVycyBhbGwgaW5pdGlhbCBzdHlsaW5nIGVudHJpZXMgaW50byB0aGUgcHJvdmlkZWQgY29udGV4dC5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIHdpbGwgaXRlcmF0ZSBvdmVyIGFsbCBlbnRyaWVzIGluIHRoZSBwcm92aWRlZCBgaW5pdGlhbFN0eWxpbmdgIGFyfXJheSBhbmQgcmVnaXN0ZXJcbiAqIHRoZW0gYXMgZGVmYXVsdCAoaW5pdGlhbCkgdmFsdWVzIGluIHRoZSBwcm92aWRlZCBjb250ZXh0LiBJbml0aWFsIHN0eWxpbmcgdmFsdWVzIGluIGEgY29udGV4dCBhcmVcbiAqIHRoZSBkZWZhdWx0IHZhbHVlcyB0aGF0IGFyZSB0byBiZSBhcHBsaWVkIHVubGVzcyBvdmVyd3JpdHRlbiBieSBhIGJpbmRpbmcuXG4gKlxuICogVGhlIHJlYXNvbiB3aHkgdGhpcyBmdW5jdGlvbiBleGlzdHMgYW5kIGlzbid0IGEgcGFydCBvZiB0aGUgY29udGV4dCBjb25zdHJ1Y3Rpb24gaXMgYmVjYXVzZVxuICogaG9zdCBiaW5kaW5nIGlzIGV2YWx1YXRlZCBhdCBhIGxhdGVyIHN0YWdlIGFmdGVyIHRoZSBlbGVtZW50IGlzIGNyZWF0ZWQuIFRoaXMgbWVhbnMgdGhhdFxuICogaWYgYSBkaXJlY3RpdmUgb3IgY29tcG9uZW50IGNvbnRhaW5zIGFueSBpbml0aWFsIHN0eWxpbmcgY29kZSAoaS5lLiBgPGRpdiBjbGFzcz1cImZvb1wiPmApXG4gKiB0aGVuIHRoYXQgaW5pdGlhbCBzdHlsaW5nIGRhdGEgY2FuIG9ubHkgYmUgYXBwbGllZCBvbmNlIHRoZSBzdHlsaW5nIGZvciB0aGF0IGVsZW1lbnRcbiAqIGlzIGZpcnN0IGFwcGxpZWQgKGF0IHRoZSBlbmQgb2YgdGhlIHVwZGF0ZSBwaGFzZSkuIE9uY2UgdGhhdCBoYXBwZW5zIHRoZW4gdGhlIGNvbnRleHQgd2lsbFxuICogdXBkYXRlIGl0c2VsZiB3aXRoIHRoZSBjb21wbGV0ZSBpbml0aWFsIHN0eWxpbmcgZm9yIHRoZSBlbGVtZW50LlxuICovXG5mdW5jdGlvbiB1cGRhdGVJbml0aWFsU3R5bGluZ09uQ29udGV4dChcbiAgICBjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQsIHROb2RlOiBUU3R5bGluZ05vZGUsIGluaXRpYWxTdHlsaW5nOiBTdHlsaW5nTWFwQXJyYXksXG4gICAgaXNDbGFzc0Jhc2VkOiBib29sZWFuKTogdm9pZCB7XG4gIC8vIGAtMWAgaXMgdXNlZCBoZXJlIGJlY2F1c2UgYWxsIGluaXRpYWwgc3R5bGluZyBkYXRhIGlzIG5vdCBhIGFwYXJ0XG4gIC8vIG9mIGEgYmluZGluZyAoc2luY2UgaXQncyBzdGF0aWMpXG4gIGNvbnN0IENPVU5UX0lEX0ZPUl9TVFlMSU5HID0gLTE7XG5cbiAgbGV0IGhhc0luaXRpYWxTdHlsaW5nID0gZmFsc2U7XG4gIGZvciAobGV0IGkgPSBTdHlsaW5nTWFwQXJyYXlJbmRleC5WYWx1ZXNTdGFydFBvc2l0aW9uOyBpIDwgaW5pdGlhbFN0eWxpbmcubGVuZ3RoO1xuICAgICAgIGkgKz0gU3R5bGluZ01hcEFycmF5SW5kZXguVHVwbGVTaXplKSB7XG4gICAgY29uc3QgdmFsdWUgPSBnZXRNYXBWYWx1ZShpbml0aWFsU3R5bGluZywgaSk7XG4gICAgaWYgKHZhbHVlKSB7XG4gICAgICBjb25zdCBwcm9wID0gZ2V0TWFwUHJvcChpbml0aWFsU3R5bGluZywgaSk7XG4gICAgICByZWdpc3RlckJpbmRpbmcoY29udGV4dCwgdE5vZGUsIENPVU5UX0lEX0ZPUl9TVFlMSU5HLCAwLCBwcm9wLCB2YWx1ZSwgZmFsc2UsIGlzQ2xhc3NCYXNlZCk7XG4gICAgICBoYXNJbml0aWFsU3R5bGluZyA9IHRydWU7XG4gICAgfVxuICB9XG5cbiAgaWYgKGhhc0luaXRpYWxTdHlsaW5nKSB7XG4gICAgcGF0Y2hDb25maWcodE5vZGUsIFROb2RlRmxhZ3MuaGFzSW5pdGlhbFN0eWxpbmcpO1xuICB9XG59XG5cbi8qKlxuICogUnVucyB0aHJvdWdoIHRoZSBwcm92aWRlZCBzdHlsaW5nIGNvbnRleHQgYW5kIGFwcGxpZXMgZWFjaCB2YWx1ZSB0b1xuICogdGhlIHByb3ZpZGVkIGVsZW1lbnQgKHZpYSB0aGUgcmVuZGVyZXIpIGlmIG9uZSBvciBtb3JlIHZhbHVlcyBhcmUgcHJlc2VudC5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIHdpbGwgaXRlcmF0ZSBvdmVyIGFsbCBlbnRyaWVzIHByZXNlbnQgaW4gdGhlIHByb3ZpZGVkXG4gKiBgVFN0eWxpbmdDb250ZXh0YCBhcnJheSAoYm90aCBwcm9wLWJhc2VkIGFuZCBtYXAtYmFzZWQgYmluZGluZ3MpLi1cbiAqXG4gKiBFYWNoIGVudHJ5LCB3aXRoaW4gdGhlIGBUU3R5bGluZ0NvbnRleHRgIGFycmF5LCBpcyBzdG9yZWQgYWxwaGFiZXRpY2FsbHlcbiAqIGFuZCB0aGlzIG1lYW5zIHRoYXQgZWFjaCBwcm9wL3ZhbHVlIGVudHJ5IHdpbGwgYmUgYXBwbGllZCBpbiBvcmRlclxuICogKHNvIGxvbmcgYXMgaXQgaXMgbWFya2VkIGRpcnR5IGluIHRoZSBwcm92aWRlZCBgYml0TWFza2AgdmFsdWUpLlxuICpcbiAqIElmIHRoZXJlIGFyZSBhbnkgbWFwLWJhc2VkIGVudHJpZXMgcHJlc2VudCAod2hpY2ggYXJlIGFwcGxpZWQgdG8gdGhlXG4gKiBlbGVtZW50IHZpYSB0aGUgYFtzdHlsZV1gIGFuZCBgW2NsYXNzXWAgYmluZGluZ3MpIHRoZW4gdGhvc2UgZW50cmllc1xuICogd2lsbCBiZSBhcHBsaWVkIGFzIHdlbGwuIEhvd2V2ZXIsIHRoZSBjb2RlIGZvciB0aGF0IGlzIG5vdCBhIHBhcnQgb2ZcbiAqIHRoaXMgZnVuY3Rpb24uIEluc3RlYWQsIGVhY2ggdGltZSBhIHByb3BlcnR5IGlzIHZpc2l0ZWQsIHRoZW4gdGhlXG4gKiBjb2RlIGJlbG93IHdpbGwgY2FsbCBhbiBleHRlcm5hbCBmdW5jdGlvbiBjYWxsZWQgYHN0eWxpbmdNYXBzU3luY0ZuYFxuICogYW5kLCBpZiBwcmVzZW50LCBpdCB3aWxsIGtlZXAgdGhlIGFwcGxpY2F0aW9uIG9mIHN0eWxpbmcgdmFsdWVzIGluXG4gKiBtYXAtYmFzZWQgYmluZGluZ3MgdXAgdG8gc3luYyB3aXRoIHRoZSBhcHBsaWNhdGlvbiBvZiBwcm9wLWJhc2VkXG4gKiBiaW5kaW5ncy5cbiAqXG4gKiBWaXNpdCBgc3R5bGluZy9tYXBfYmFzZWRfYmluZGluZ3MudHNgIHRvIGxlYXJuIG1vcmUgYWJvdXQgaG93IHRoZVxuICogYWxnb3JpdGhtIHdvcmtzIGZvciBtYXAtYmFzZWQgc3R5bGluZyBiaW5kaW5ncy5cbiAqXG4gKiBOb3RlIHRoYXQgdGhpcyBmdW5jdGlvbiBpcyBub3QgZGVzaWduZWQgdG8gYmUgY2FsbGVkIGluIGlzb2xhdGlvbiAodXNlXG4gKiB0aGUgYGZsdXNoU3R5bGluZ2AgZnVuY3Rpb24gc28gdGhhdCBpdCBjYW4gY2FsbCB0aGlzIGZ1bmN0aW9uIGZvciBib3RoXG4gKiB0aGUgc3R5bGVzIGFuZCBjbGFzc2VzIGNvbnRleHRzKS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFwcGx5U3R5bGluZ1ZpYUNvbnRleHQoXG4gICAgY29udGV4dDogVFN0eWxpbmdDb250ZXh0LCB0Tm9kZTogVFN0eWxpbmdOb2RlLCByZW5kZXJlcjogUmVuZGVyZXIzIHwgUHJvY2VkdXJhbFJlbmRlcmVyMyB8IG51bGwsXG4gICAgZWxlbWVudDogUkVsZW1lbnQsIGJpbmRpbmdEYXRhOiBMU3R5bGluZ0RhdGEsIGJpdE1hc2tWYWx1ZTogbnVtYmVyIHwgYm9vbGVhbixcbiAgICBhcHBseVN0eWxpbmdGbjogQXBwbHlTdHlsaW5nRm4sIHNhbml0aXplcjogU3R5bGVTYW5pdGl6ZUZuIHwgbnVsbCwgaG9zdEJpbmRpbmdzTW9kZTogYm9vbGVhbixcbiAgICBpc0NsYXNzQmFzZWQ6IGJvb2xlYW4pOiB2b2lkIHtcbiAgY29uc3QgYml0TWFzayA9IG5vcm1hbGl6ZUJpdE1hc2tWYWx1ZShiaXRNYXNrVmFsdWUpO1xuXG4gIGxldCBzdHlsaW5nTWFwc1N5bmNGbjogU3luY1N0eWxpbmdNYXBzRm58bnVsbCA9IG51bGw7XG4gIGxldCBhcHBseUFsbFZhbHVlcyA9IGZhbHNlO1xuICBjb25zdCBtYXBCaW5kaW5nc0ZsYWcgPVxuICAgICAgaXNDbGFzc0Jhc2VkID8gVE5vZGVGbGFncy5oYXNDbGFzc01hcEJpbmRpbmdzIDogVE5vZGVGbGFncy5oYXNTdHlsZU1hcEJpbmRpbmdzO1xuICBpZiAoaGFzQ29uZmlnKHROb2RlLCBtYXBCaW5kaW5nc0ZsYWcpKSB7XG4gICAgc3R5bGluZ01hcHNTeW5jRm4gPSBnZXRTdHlsaW5nTWFwc1N5bmNGbigpO1xuICAgIGNvbnN0IG1hcHNHdWFyZE1hc2sgPVxuICAgICAgICBnZXRHdWFyZE1hc2soY29udGV4dCwgVFN0eWxpbmdDb250ZXh0SW5kZXguVmFsdWVzU3RhcnRQb3NpdGlvbiwgaG9zdEJpbmRpbmdzTW9kZSk7XG4gICAgYXBwbHlBbGxWYWx1ZXMgPSAoYml0TWFzayAmIG1hcHNHdWFyZE1hc2spICE9PSAwO1xuICB9XG5cbiAgY29uc3QgdmFsdWVzQ291bnQgPSBnZXRWYWx1ZXNDb3VudChjb250ZXh0KTtcbiAgbGV0IHRvdGFsQmluZGluZ3NUb1Zpc2l0ID0gMTtcbiAgbGV0IG1hcHNNb2RlID1cbiAgICAgIGFwcGx5QWxsVmFsdWVzID8gU3R5bGluZ01hcHNTeW5jTW9kZS5BcHBseUFsbFZhbHVlcyA6IFN0eWxpbmdNYXBzU3luY01vZGUuVHJhdmVyc2VWYWx1ZXM7XG4gIGlmIChob3N0QmluZGluZ3NNb2RlKSB7XG4gICAgbWFwc01vZGUgfD0gU3R5bGluZ01hcHNTeW5jTW9kZS5SZWN1cnNlSW5uZXJNYXBzO1xuICAgIHRvdGFsQmluZGluZ3NUb1Zpc2l0ID0gdmFsdWVzQ291bnQgLSAxO1xuICB9XG5cbiAgbGV0IGkgPSBnZXRQcm9wVmFsdWVzU3RhcnRQb3NpdGlvbihjb250ZXh0LCB0Tm9kZSwgaXNDbGFzc0Jhc2VkKTtcbiAgd2hpbGUgKGkgPCBjb250ZXh0Lmxlbmd0aCkge1xuICAgIGNvbnN0IGd1YXJkTWFzayA9IGdldEd1YXJkTWFzayhjb250ZXh0LCBpLCBob3N0QmluZGluZ3NNb2RlKTtcbiAgICBpZiAoYml0TWFzayAmIGd1YXJkTWFzaykge1xuICAgICAgbGV0IHZhbHVlQXBwbGllZCA9IGZhbHNlO1xuICAgICAgY29uc3QgcHJvcCA9IGdldFByb3AoY29udGV4dCwgaSk7XG4gICAgICBjb25zdCBkZWZhdWx0VmFsdWUgPSBnZXREZWZhdWx0VmFsdWUoY29udGV4dCwgaSk7XG5cbiAgICAgIC8vIFBhcnQgMTogVmlzaXQgdGhlIGBbc3R5bGluZy5wcm9wXWAgdmFsdWVcbiAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgdG90YWxCaW5kaW5nc1RvVmlzaXQ7IGorKykge1xuICAgICAgICBjb25zdCBiaW5kaW5nSW5kZXggPSBnZXRCaW5kaW5nVmFsdWUoY29udGV4dCwgaSwgaikgYXMgbnVtYmVyO1xuICAgICAgICBpZiAoIXZhbHVlQXBwbGllZCAmJiBiaW5kaW5nSW5kZXggIT09IDApIHtcbiAgICAgICAgICBjb25zdCB2YWx1ZSA9IGdldFZhbHVlKGJpbmRpbmdEYXRhLCBiaW5kaW5nSW5kZXgpO1xuICAgICAgICAgIGlmIChpc1N0eWxpbmdWYWx1ZURlZmluZWQodmFsdWUpKSB7XG4gICAgICAgICAgICBjb25zdCBjaGVja1ZhbHVlT25seSA9IGhvc3RCaW5kaW5nc01vZGUgJiYgaiA9PT0gMDtcbiAgICAgICAgICAgIGlmICghY2hlY2tWYWx1ZU9ubHkpIHtcbiAgICAgICAgICAgICAgY29uc3QgZmluYWxWYWx1ZSA9IHNhbml0aXplciAmJiBpc1Nhbml0aXphdGlvblJlcXVpcmVkKGNvbnRleHQsIGkpID9cbiAgICAgICAgICAgICAgICAgIHNhbml0aXplcihwcm9wLCB2YWx1ZSwgU3R5bGVTYW5pdGl6ZU1vZGUuU2FuaXRpemVPbmx5KSA6XG4gICAgICAgICAgICAgICAgICB1bndyYXBTYWZlVmFsdWUodmFsdWUpO1xuICAgICAgICAgICAgICBhcHBseVN0eWxpbmdGbihyZW5kZXJlciwgZWxlbWVudCwgcHJvcCwgZmluYWxWYWx1ZSwgYmluZGluZ0luZGV4KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhbHVlQXBwbGllZCA9IHRydWU7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gUGFydCAyOiBWaXNpdCB0aGUgYFtzdHlsZV1gIG9yIGBbY2xhc3NdYCBtYXAtYmFzZWQgdmFsdWVcbiAgICAgICAgaWYgKHN0eWxpbmdNYXBzU3luY0ZuKSB7XG4gICAgICAgICAgLy8gZGV0ZXJtaW5lIHdoZXRoZXIgb3Igbm90IHRvIGFwcGx5IHRoZSB0YXJnZXQgcHJvcGVydHkgb3IgdG8gc2tpcCBpdFxuICAgICAgICAgIGxldCBtb2RlID0gbWFwc01vZGUgfCAodmFsdWVBcHBsaWVkID8gU3R5bGluZ01hcHNTeW5jTW9kZS5Ta2lwVGFyZ2V0UHJvcCA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBTdHlsaW5nTWFwc1N5bmNNb2RlLkFwcGx5VGFyZ2V0UHJvcCk7XG5cbiAgICAgICAgICAvLyB0aGUgZmlyc3QgY29sdW1uIGluIHRoZSBjb250ZXh0ICh3aGVuIGBqID09IDBgKSBpcyBzcGVjaWFsLWNhc2VkIGZvclxuICAgICAgICAgIC8vIHRlbXBsYXRlIGJpbmRpbmdzLiBJZiBhbmQgd2hlbiBob3N0IGJpbmRpbmdzIGFyZSBiZWluZyBwcm9jZXNzZWQgdGhlblxuICAgICAgICAgIC8vIHRoZSBmaXJzdCBjb2x1bW4gd2lsbCBzdGlsbCBiZSBpdGVyYXRlZCBvdmVyLCBidXQgdGhlIHZhbHVlcyB3aWxsIG9ubHlcbiAgICAgICAgICAvLyBiZSBjaGVja2VkIGFnYWluc3QgKG5vdCBhcHBsaWVkKS4gSWYgYW5kIHdoZW4gdGhpcyBoYXBwZW5zIHdlIG5lZWQgdG9cbiAgICAgICAgICAvLyBub3RpZnkgdGhlIG1hcC1iYXNlZCBzeW5jaW5nIGNvZGUgdG8ga25vdyBub3QgdG8gYXBwbHkgdGhlIHZhbHVlcyBpdFxuICAgICAgICAgIC8vIGNvbWVzIGFjcm9zcyBpbiB0aGUgdmVyeSBmaXJzdCBtYXAtYmFzZWQgYmluZGluZyAod2hpY2ggaXMgYWxzbyBsb2NhdGVkXG4gICAgICAgICAgLy8gaW4gY29sdW1uIHplcm8pLlxuICAgICAgICAgIGlmIChob3N0QmluZGluZ3NNb2RlICYmIGogPT09IDApIHtcbiAgICAgICAgICAgIG1vZGUgfD0gU3R5bGluZ01hcHNTeW5jTW9kZS5DaGVja1ZhbHVlc09ubHk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgY29uc3QgdmFsdWVBcHBsaWVkV2l0aGluTWFwID0gc3R5bGluZ01hcHNTeW5jRm4oXG4gICAgICAgICAgICAgIGNvbnRleHQsIHJlbmRlcmVyLCBlbGVtZW50LCBiaW5kaW5nRGF0YSwgaiwgYXBwbHlTdHlsaW5nRm4sIHNhbml0aXplciwgbW9kZSwgcHJvcCxcbiAgICAgICAgICAgICAgZGVmYXVsdFZhbHVlKTtcbiAgICAgICAgICB2YWx1ZUFwcGxpZWQgPSB2YWx1ZUFwcGxpZWQgfHwgdmFsdWVBcHBsaWVkV2l0aGluTWFwO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIFBhcnQgMzogYXBwbHkgdGhlIGRlZmF1bHQgdmFsdWUgKGUuZy4gYDxkaXYgc3R5bGU9XCJ3aWR0aDoyMDBcIj5gID0+IGAyMDBweGAgZ2V0cyBhcHBsaWVkKVxuICAgICAgLy8gaWYgdGhlIHZhbHVlIGhhcyBub3QgeWV0IGJlZW4gYXBwbGllZCB0aGVuIGEgdHJ1dGh5IHZhbHVlIGRvZXMgbm90IGV4aXN0IGluIHRoZVxuICAgICAgLy8gcHJvcC1iYXNlZCBvciBtYXAtYmFzZWQgYmluZGluZ3MgY29kZS4gSWYgYW5kIHdoZW4gdGhpcyBoYXBwZW5zLCBqdXN0IGFwcGx5IHRoZVxuICAgICAgLy8gZGVmYXVsdCB2YWx1ZSAoZXZlbiBpZiB0aGUgZGVmYXVsdCB2YWx1ZSBpcyBgbnVsbGApLlxuICAgICAgaWYgKCF2YWx1ZUFwcGxpZWQpIHtcbiAgICAgICAgYXBwbHlTdHlsaW5nRm4ocmVuZGVyZXIsIGVsZW1lbnQsIHByb3AsIGRlZmF1bHRWYWx1ZSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaSArPSBUU3R5bGluZ0NvbnRleHRJbmRleC5CaW5kaW5nc1N0YXJ0T2Zmc2V0ICsgdmFsdWVzQ291bnQ7XG4gIH1cblxuICAvLyB0aGUgbWFwLWJhc2VkIHN0eWxpbmcgZW50cmllcyBtYXkgaGF2ZSBub3QgYXBwbGllZCBhbGwgdGhlaXJcbiAgLy8gdmFsdWVzLiBGb3IgdGhpcyByZWFzb24sIG9uZSBtb3JlIGNhbGwgdG8gdGhlIHN5bmMgZnVuY3Rpb25cbiAgLy8gbmVlZHMgdG8gYmUgaXNzdWVkIGF0IHRoZSBlbmQuXG4gIGlmIChzdHlsaW5nTWFwc1N5bmNGbikge1xuICAgIGlmIChob3N0QmluZGluZ3NNb2RlKSB7XG4gICAgICBtYXBzTW9kZSB8PSBTdHlsaW5nTWFwc1N5bmNNb2RlLkNoZWNrVmFsdWVzT25seTtcbiAgICB9XG4gICAgc3R5bGluZ01hcHNTeW5jRm4oXG4gICAgICAgIGNvbnRleHQsIHJlbmRlcmVyLCBlbGVtZW50LCBiaW5kaW5nRGF0YSwgMCwgYXBwbHlTdHlsaW5nRm4sIHNhbml0aXplciwgbWFwc01vZGUpO1xuICB9XG59XG5cbi8qKlxuICogQXBwbGllcyB0aGUgcHJvdmlkZWQgc3R5bGluZyBtYXAgdG8gdGhlIGVsZW1lbnQgZGlyZWN0bHkgKHdpdGhvdXQgY29udGV4dCByZXNvbHV0aW9uKS5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIGlzIGRlc2lnbmVkIHRvIGJlIHJ1biBmcm9tIHRoZSBzdHlsaW5nIGluc3RydWN0aW9ucyBhbmQgd2lsbCBiZSBjYWxsZWRcbiAqIGF1dG9tYXRpY2FsbHkuIFRoaXMgZnVuY3Rpb24gaXMgaW50ZW5kZWQgdG8gYmUgdXNlZCBmb3IgcGVyZm9ybWFuY2UgcmVhc29ucyBpbiB0aGVcbiAqIGV2ZW50IHRoYXQgdGhlcmUgaXMgbm8gbmVlZCB0byBhcHBseSBzdHlsaW5nIHZpYSBjb250ZXh0IHJlc29sdXRpb24uXG4gKlxuICogVGhpcyBmdW5jdGlvbiBoYXMgdGhyZWUgZGlmZmVyZW50IGNhc2VzIHRoYXQgY2FuIG9jY3VyIChmb3IgZWFjaCBpdGVtIGluIHRoZSBtYXApOlxuICpcbiAqIC0gQ2FzZSAxOiBBdHRlbXB0IHRvIGFwcGx5IHRoZSBjdXJyZW50IHZhbHVlIGluIHRoZSBtYXAgdG8gdGhlIGVsZW1lbnQgKGlmIGl0J3MgYG5vbiBudWxsYCkuXG4gKlxuICogLSBDYXNlIDI6IElmIGEgbWFwIHZhbHVlIGZhaWxzIHRvIGJlIGFwcGxpZWQgdGhlbiB0aGUgYWxnb3JpdGhtIHdpbGwgZmluZCBhIG1hdGNoaW5nIGVudHJ5IGluXG4gKiAgICAgICAgICAgdGhlIGluaXRpYWwgdmFsdWVzIHByZXNlbnQgaW4gdGhlIGNvbnRleHQgYW5kIGF0dGVtcHQgdG8gYXBwbHkgdGhhdC5cbiAqXG4gKiAtIERlZmF1bHQgQ2FzZTogSWYgdGhlIGluaXRpYWwgdmFsdWUgY2Fubm90IGJlIGFwcGxpZWQgdGhlbiBhIGRlZmF1bHQgdmFsdWUgb2YgYG51bGxgIHdpbGwgYmVcbiAqICAgICAgICAgICAgICAgICBhcHBsaWVkICh3aGljaCB3aWxsIHJlbW92ZSB0aGUgc3R5bGUvY2xhc3MgdmFsdWUgZnJvbSB0aGUgZWxlbWVudCkuXG4gKlxuICogU2VlIGBhbGxvd0RpcmVjdFN0eWxpbmdBcHBseWAgdG8gbGVhcm4gdGhlIGxvZ2ljIHVzZWQgdG8gZGV0ZXJtaW5lIHdoZXRoZXIgYW55IHN0eWxlL2NsYXNzXG4gKiBiaW5kaW5ncyBjYW4gYmUgZGlyZWN0bHkgYXBwbGllZC5cbiAqXG4gKiBAcmV0dXJucyB3aGV0aGVyIG9yIG5vdCB0aGUgc3R5bGluZyBtYXAgd2FzIGFwcGxpZWQgdG8gdGhlIGVsZW1lbnQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhcHBseVN0eWxpbmdNYXBEaXJlY3RseShcbiAgICByZW5kZXJlcjogYW55LCBjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQsIHROb2RlOiBUU3R5bGluZ05vZGUsIGVsZW1lbnQ6IFJFbGVtZW50LFxuICAgIGRhdGE6IExTdHlsaW5nRGF0YSwgYmluZGluZ0luZGV4OiBudW1iZXIsIHZhbHVlOiB7W2tleTogc3RyaW5nXTogYW55fSB8IHN0cmluZyB8IG51bGwsXG4gICAgaXNDbGFzc0Jhc2VkOiBib29sZWFuLCBzYW5pdGl6ZXI6IFN0eWxlU2FuaXRpemVGbiB8IG51bGwsIGZvcmNlVXBkYXRlOiBib29sZWFuLFxuICAgIGJpbmRpbmdWYWx1ZUNvbnRhaW5zSW5pdGlhbDogYm9vbGVhbik6IHZvaWQge1xuICBjb25zdCBvbGRWYWx1ZSA9IGdldFZhbHVlKGRhdGEsIGJpbmRpbmdJbmRleCk7XG4gIGlmIChmb3JjZVVwZGF0ZSB8fCBoYXNWYWx1ZUNoYW5nZWQob2xkVmFsdWUsIHZhbHVlKSkge1xuICAgIGNvbnN0IGhhc0luaXRpYWwgPSBoYXNDb25maWcodE5vZGUsIFROb2RlRmxhZ3MuaGFzSW5pdGlhbFN0eWxpbmcpO1xuICAgIGNvbnN0IGluaXRpYWxWYWx1ZSA9XG4gICAgICAgIGhhc0luaXRpYWwgJiYgIWJpbmRpbmdWYWx1ZUNvbnRhaW5zSW5pdGlhbCA/IGdldEluaXRpYWxTdHlsaW5nVmFsdWUoY29udGV4dCkgOiBudWxsO1xuICAgIHNldFZhbHVlKGRhdGEsIGJpbmRpbmdJbmRleCwgdmFsdWUpO1xuXG4gICAgLy8gdGhlIGNhY2hlZCB2YWx1ZSBpcyB0aGUgbGFzdCBzbmFwc2hvdCBvZiB0aGUgc3R5bGUgb3IgY2xhc3NcbiAgICAvLyBhdHRyaWJ1dGUgdmFsdWUgYW5kIGlzIHVzZWQgaW4gdGhlIGlmIHN0YXRlbWVudCBiZWxvdyB0b1xuICAgIC8vIGtlZXAgdHJhY2sgb2YgaW50ZXJuYWwvZXh0ZXJuYWwgY2hhbmdlcy5cbiAgICBjb25zdCBjYWNoZWRWYWx1ZUluZGV4ID0gYmluZGluZ0luZGV4ICsgMTtcbiAgICBsZXQgY2FjaGVkVmFsdWUgPSBnZXRWYWx1ZShkYXRhLCBjYWNoZWRWYWx1ZUluZGV4KTtcbiAgICBpZiAoY2FjaGVkVmFsdWUgPT09IE5PX0NIQU5HRSkge1xuICAgICAgY2FjaGVkVmFsdWUgPSBpbml0aWFsVmFsdWU7XG4gICAgfVxuICAgIGNhY2hlZFZhbHVlID0gdHlwZW9mIGNhY2hlZFZhbHVlICE9PSAnc3RyaW5nJyA/ICcnIDogY2FjaGVkVmFsdWU7XG5cbiAgICAvLyBJZiBhIGNsYXNzL3N0eWxlIHZhbHVlIHdhcyBtb2RpZmllZCBleHRlcm5hbGx5IHRoZW4gdGhlIHN0eWxpbmdcbiAgICAvLyBmYXN0IHBhc3MgY2Fubm90IGd1YXJhbnRlZSB0aGF0IHRoZSBleHRlcm5hbCB2YWx1ZXMgYXJlIHJldGFpbmVkLlxuICAgIC8vIFdoZW4gdGhpcyBoYXBwZW5zLCB0aGUgYWxnb3JpdGhtIHdpbGwgYmFpbCBvdXQgYW5kIG5vdCB3cml0ZSB0b1xuICAgIC8vIHRoZSBzdHlsZSBvciBjbGFzc05hbWUgYXR0cmlidXRlIGRpcmVjdGx5LlxuICAgIGNvbnN0IHByb3BCaW5kaW5nc0ZsYWcgPVxuICAgICAgICBpc0NsYXNzQmFzZWQgPyBUTm9kZUZsYWdzLmhhc0NsYXNzUHJvcEJpbmRpbmdzIDogVE5vZGVGbGFncy5oYXNTdHlsZVByb3BCaW5kaW5ncztcbiAgICBsZXQgd3JpdGVUb0F0dHJEaXJlY3RseSA9ICFoYXNDb25maWcodE5vZGUsIHByb3BCaW5kaW5nc0ZsYWcpO1xuICAgIGlmICh3cml0ZVRvQXR0ckRpcmVjdGx5ICYmXG4gICAgICAgIGNoZWNrSWZFeHRlcm5hbGx5TW9kaWZpZWQoZWxlbWVudCBhcyBIVE1MRWxlbWVudCwgY2FjaGVkVmFsdWUsIGlzQ2xhc3NCYXNlZCkpIHtcbiAgICAgIHdyaXRlVG9BdHRyRGlyZWN0bHkgPSBmYWxzZTtcbiAgICAgIGlmIChvbGRWYWx1ZSAhPT0gVkFMVUVfSVNfRVhURVJOQUxMWV9NT0RJRklFRCkge1xuICAgICAgICAvLyBkaXJlY3Qgc3R5bGluZyB3aWxsIHJlc2V0IHRoZSBhdHRyaWJ1dGUgZW50aXJlbHkgZWFjaCB0aW1lLFxuICAgICAgICAvLyBhbmQsIGZvciB0aGlzIHJlYXNvbiwgaWYgdGhlIGFsZ29yaXRobSBkZWNpZGVzIGl0IGNhbm5vdFxuICAgICAgICAvLyB3cml0ZSB0byB0aGUgY2xhc3Mvc3R5bGUgYXR0cmlidXRlcyBkaXJlY3RseSB0aGVuIGl0IG11c3RcbiAgICAgICAgLy8gcmVzZXQgYWxsIHRoZSBwcmV2aW91cyBzdHlsZS9jbGFzcyB2YWx1ZXMgYmVmb3JlIGl0IHN0YXJ0c1xuICAgICAgICAvLyB0byBhcHBseSB2YWx1ZXMgaW4gdGhlIG5vbi1kaXJlY3Qgd2F5LlxuICAgICAgICByZW1vdmVTdHlsaW5nVmFsdWVzKHJlbmRlcmVyLCBlbGVtZW50LCBvbGRWYWx1ZSwgaXNDbGFzc0Jhc2VkKTtcblxuICAgICAgICAvLyB0aGlzIHdpbGwgaW5zdHJ1Y3QgdGhlIGFsZ29yaXRobSBub3QgdG8gYXBwbHkgY2xhc3Mgb3Igc3R5bGVcbiAgICAgICAgLy8gdmFsdWVzIGRpcmVjdGx5IGFueW1vcmUuXG4gICAgICAgIHNldFZhbHVlKGRhdGEsIGNhY2hlZFZhbHVlSW5kZXgsIFZBTFVFX0lTX0VYVEVSTkFMTFlfTU9ESUZJRUQpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmICh3cml0ZVRvQXR0ckRpcmVjdGx5KSB7XG4gICAgICBjb25zdCBpbml0aWFsVmFsdWUgPVxuICAgICAgICAgIGhhc0luaXRpYWwgJiYgIWJpbmRpbmdWYWx1ZUNvbnRhaW5zSW5pdGlhbCA/IGdldEluaXRpYWxTdHlsaW5nVmFsdWUoY29udGV4dCkgOiBudWxsO1xuICAgICAgY29uc3QgdmFsdWVUb0FwcGx5ID1cbiAgICAgICAgICB3cml0ZVN0eWxpbmdWYWx1ZURpcmVjdGx5KHJlbmRlcmVyLCBlbGVtZW50LCB2YWx1ZSwgaXNDbGFzc0Jhc2VkLCBpbml0aWFsVmFsdWUpO1xuICAgICAgc2V0VmFsdWUoZGF0YSwgY2FjaGVkVmFsdWVJbmRleCwgdmFsdWVUb0FwcGx5IHx8IG51bGwpO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBhcHBseUZuID0gaXNDbGFzc0Jhc2VkID8gc2V0Q2xhc3MgOiBzZXRTdHlsZTtcbiAgICAgIGNvbnN0IG1hcCA9IG5vcm1hbGl6ZUludG9TdHlsaW5nTWFwKG9sZFZhbHVlLCB2YWx1ZSwgIWlzQ2xhc3NCYXNlZCk7XG4gICAgICBjb25zdCBpbml0aWFsU3R5bGVzID0gaGFzSW5pdGlhbCA/IGdldFN0eWxpbmdNYXBBcnJheShjb250ZXh0KSA6IG51bGw7XG5cbiAgICAgIGZvciAobGV0IGkgPSBTdHlsaW5nTWFwQXJyYXlJbmRleC5WYWx1ZXNTdGFydFBvc2l0aW9uOyBpIDwgbWFwLmxlbmd0aDtcbiAgICAgICAgICAgaSArPSBTdHlsaW5nTWFwQXJyYXlJbmRleC5UdXBsZVNpemUpIHtcbiAgICAgICAgY29uc3QgcHJvcCA9IGdldE1hcFByb3AobWFwLCBpKTtcbiAgICAgICAgY29uc3QgdmFsdWUgPSBnZXRNYXBWYWx1ZShtYXAsIGkpO1xuXG4gICAgICAgIC8vIGNhc2UgMTogYXBwbHkgdGhlIG1hcCB2YWx1ZSAoaWYgaXQgZXhpc3RzKVxuICAgICAgICBsZXQgYXBwbGllZCA9XG4gICAgICAgICAgICBhcHBseVN0eWxpbmdWYWx1ZShyZW5kZXJlciwgZWxlbWVudCwgcHJvcCwgdmFsdWUsIGFwcGx5Rm4sIGJpbmRpbmdJbmRleCwgc2FuaXRpemVyKTtcblxuICAgICAgICAvLyBjYXNlIDI6IGFwcGx5IHRoZSBpbml0aWFsIHZhbHVlIChpZiBpdCBleGlzdHMpXG4gICAgICAgIGlmICghYXBwbGllZCAmJiBpbml0aWFsU3R5bGVzKSB7XG4gICAgICAgICAgYXBwbGllZCA9IGZpbmRBbmRBcHBseU1hcFZhbHVlKFxuICAgICAgICAgICAgICByZW5kZXJlciwgZWxlbWVudCwgYXBwbHlGbiwgaW5pdGlhbFN0eWxlcywgcHJvcCwgYmluZGluZ0luZGV4LCBzYW5pdGl6ZXIpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gZGVmYXVsdCBjYXNlOiBhcHBseSBgbnVsbGAgdG8gcmVtb3ZlIHRoZSB2YWx1ZVxuICAgICAgICBpZiAoIWFwcGxpZWQpIHtcbiAgICAgICAgICBhcHBseUZuKHJlbmRlcmVyLCBlbGVtZW50LCBwcm9wLCBudWxsLCBiaW5kaW5nSW5kZXgpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHN0YXRlID0gZ2V0U3R5bGluZ1N0YXRlKGVsZW1lbnQsIFRFTVBMQVRFX0RJUkVDVElWRV9JTkRFWCk7XG4gICAgICBpZiAoaXNDbGFzc0Jhc2VkKSB7XG4gICAgICAgIHN0YXRlLmxhc3REaXJlY3RDbGFzc01hcCA9IG1hcDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHN0YXRlLmxhc3REaXJlY3RTdHlsZU1hcCA9IG1hcDtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHdyaXRlU3R5bGluZ1ZhbHVlRGlyZWN0bHkoXG4gICAgcmVuZGVyZXI6IGFueSwgZWxlbWVudDogUkVsZW1lbnQsIHZhbHVlOiB7W2tleTogc3RyaW5nXTogYW55fSB8IHN0cmluZyB8IG51bGwsXG4gICAgaXNDbGFzc0Jhc2VkOiBib29sZWFuLCBpbml0aWFsVmFsdWU6IHN0cmluZyB8IG51bGwpOiBzdHJpbmcge1xuICBsZXQgdmFsdWVUb0FwcGx5OiBzdHJpbmc7XG4gIGlmIChpc0NsYXNzQmFzZWQpIHtcbiAgICB2YWx1ZVRvQXBwbHkgPSB0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnID8gdmFsdWUgOiBvYmplY3RUb0NsYXNzTmFtZSh2YWx1ZSk7XG4gICAgaWYgKGluaXRpYWxWYWx1ZSAhPT0gbnVsbCkge1xuICAgICAgdmFsdWVUb0FwcGx5ID0gY29uY2F0U3RyaW5nKGluaXRpYWxWYWx1ZSwgdmFsdWVUb0FwcGx5LCAnICcpO1xuICAgIH1cbiAgICBzZXRDbGFzc05hbWUocmVuZGVyZXIsIGVsZW1lbnQsIHZhbHVlVG9BcHBseSk7XG4gIH0gZWxzZSB7XG4gICAgdmFsdWVUb0FwcGx5ID0gZm9yY2VTdHlsZXNBc1N0cmluZyh2YWx1ZSwgdHJ1ZSk7XG4gICAgaWYgKGluaXRpYWxWYWx1ZSAhPT0gbnVsbCkge1xuICAgICAgdmFsdWVUb0FwcGx5ID0gaW5pdGlhbFZhbHVlICsgJzsnICsgdmFsdWVUb0FwcGx5O1xuICAgIH1cbiAgICBzZXRTdHlsZUF0dHIocmVuZGVyZXIsIGVsZW1lbnQsIHZhbHVlVG9BcHBseSk7XG4gIH1cbiAgcmV0dXJuIHZhbHVlVG9BcHBseTtcbn1cblxuLyoqXG4gKiBBcHBsaWVzIHRoZSBwcm92aWRlZCBzdHlsaW5nIHByb3AvdmFsdWUgdG8gdGhlIGVsZW1lbnQgZGlyZWN0bHkgKHdpdGhvdXQgY29udGV4dCByZXNvbHV0aW9uKS5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIGlzIGRlc2lnbmVkIHRvIGJlIHJ1biBmcm9tIHRoZSBzdHlsaW5nIGluc3RydWN0aW9ucyBhbmQgd2lsbCBiZSBjYWxsZWRcbiAqIGF1dG9tYXRpY2FsbHkuIFRoaXMgZnVuY3Rpb24gaXMgaW50ZW5kZWQgdG8gYmUgdXNlZCBmb3IgcGVyZm9ybWFuY2UgcmVhc29ucyBpbiB0aGVcbiAqIGV2ZW50IHRoYXQgdGhlcmUgaXMgbm8gbmVlZCB0byBhcHBseSBzdHlsaW5nIHZpYSBjb250ZXh0IHJlc29sdXRpb24uXG4gKlxuICogVGhpcyBmdW5jdGlvbiBoYXMgZm91ciBkaWZmZXJlbnQgY2FzZXMgdGhhdCBjYW4gb2NjdXI6XG4gKlxuICogLSBDYXNlIDE6IEFwcGx5IHRoZSBwcm92aWRlZCBwcm9wL3ZhbHVlIChzdHlsZSBvciBjbGFzcykgZW50cnkgdG8gdGhlIGVsZW1lbnRcbiAqICAgICAgICAgICAoaWYgaXQgaXMgYG5vbiBudWxsYCkuXG4gKlxuICogLSBDYXNlIDI6IElmIHZhbHVlIGRvZXMgbm90IGdldCBhcHBsaWVkIChiZWNhdXNlIGl0cyBgbnVsbGAgb3IgYHVuZGVmaW5lZGApIHRoZW4gdGhlIGFsZ29yaXRobVxuICogICAgICAgICAgIHdpbGwgY2hlY2sgdG8gc2VlIGlmIGEgc3R5bGluZyBtYXAgdmFsdWUgd2FzIGFwcGxpZWQgdG8gdGhlIGVsZW1lbnQgYXMgd2VsbCBqdXN0XG4gKiAgICAgICAgICAgYmVmb3JlIHRoaXMgKHZpYSBgc3R5bGVNYXBgIG9yIGBjbGFzc01hcGApLiBJZiBhbmQgd2hlbiBhIG1hcCBpcyBwcmVzZW50IHRoZW4gdGhlXG4gICogICAgICAgICAgYWxnb3JpdGhtIHdpbGwgZmluZCB0aGUgbWF0Y2hpbmcgcHJvcGVydHkgaW4gdGhlIG1hcCBhbmQgYXBwbHkgaXRzIHZhbHVlLlxuICAqXG4gKiAtIENhc2UgMzogSWYgYSBtYXAgdmFsdWUgZmFpbHMgdG8gYmUgYXBwbGllZCB0aGVuIHRoZSBhbGdvcml0aG0gd2lsbCBjaGVjayB0byBzZWUgaWYgdGhlcmVcbiAqICAgICAgICAgICBhcmUgYW55IGluaXRpYWwgdmFsdWVzIHByZXNlbnQgYW5kIGF0dGVtcHQgdG8gYXBwbHkgYSBtYXRjaGluZyB2YWx1ZSBiYXNlZCBvblxuICogICAgICAgICAgIHRoZSB0YXJnZXQgcHJvcC5cbiAqXG4gKiAtIERlZmF1bHQgQ2FzZTogSWYgYSBtYXRjaGluZyBpbml0aWFsIHZhbHVlIGNhbm5vdCBiZSBhcHBsaWVkIHRoZW4gYSBkZWZhdWx0IHZhbHVlXG4gKiAgICAgICAgICAgICAgICAgb2YgYG51bGxgIHdpbGwgYmUgYXBwbGllZCAod2hpY2ggd2lsbCByZW1vdmUgdGhlIHN0eWxlL2NsYXNzIHZhbHVlXG4gKiAgICAgICAgICAgICAgICAgZnJvbSB0aGUgZWxlbWVudCkuXG4gKlxuICogU2VlIGBhbGxvd0RpcmVjdFN0eWxpbmdBcHBseWAgdG8gbGVhcm4gdGhlIGxvZ2ljIHVzZWQgdG8gZGV0ZXJtaW5lIHdoZXRoZXIgYW55IHN0eWxlL2NsYXNzXG4gKiBiaW5kaW5ncyBjYW4gYmUgZGlyZWN0bHkgYXBwbGllZC5cbiAqXG4gKiBAcmV0dXJucyB3aGV0aGVyIG9yIG5vdCB0aGUgcHJvcC92YWx1ZSBzdHlsaW5nIHdhcyBhcHBsaWVkIHRvIHRoZSBlbGVtZW50LlxuICovXG5leHBvcnQgZnVuY3Rpb24gYXBwbHlTdHlsaW5nVmFsdWVEaXJlY3RseShcbiAgICByZW5kZXJlcjogYW55LCBjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQsIHROb2RlOiBUU3R5bGluZ05vZGUsIGVsZW1lbnQ6IFJFbGVtZW50LFxuICAgIGRhdGE6IExTdHlsaW5nRGF0YSwgYmluZGluZ0luZGV4OiBudW1iZXIsIHByb3A6IHN0cmluZywgdmFsdWU6IGFueSwgaXNDbGFzc0Jhc2VkOiBib29sZWFuLFxuICAgIHNhbml0aXplcj86IFN0eWxlU2FuaXRpemVGbiB8IG51bGwpOiBib29sZWFuIHtcbiAgbGV0IGFwcGxpZWQgPSBmYWxzZTtcbiAgaWYgKGhhc1ZhbHVlQ2hhbmdlZChkYXRhW2JpbmRpbmdJbmRleF0sIHZhbHVlKSkge1xuICAgIHNldFZhbHVlKGRhdGEsIGJpbmRpbmdJbmRleCwgdmFsdWUpO1xuICAgIGNvbnN0IGFwcGx5Rm4gPSBpc0NsYXNzQmFzZWQgPyBzZXRDbGFzcyA6IHNldFN0eWxlO1xuXG4gICAgLy8gY2FzZSAxOiBhcHBseSB0aGUgcHJvdmlkZWQgdmFsdWUgKGlmIGl0IGV4aXN0cylcbiAgICBhcHBsaWVkID0gYXBwbHlTdHlsaW5nVmFsdWUocmVuZGVyZXIsIGVsZW1lbnQsIHByb3AsIHZhbHVlLCBhcHBseUZuLCBiaW5kaW5nSW5kZXgsIHNhbml0aXplcik7XG5cbiAgICAvLyBjYXNlIDI6IGZpbmQgdGhlIG1hdGNoaW5nIHByb3BlcnR5IGluIGEgc3R5bGluZyBtYXAgYW5kIGFwcGx5IHRoZSBkZXRlY3RlZCB2YWx1ZVxuICAgIGNvbnN0IG1hcEJpbmRpbmdzRmxhZyA9XG4gICAgICAgIGlzQ2xhc3NCYXNlZCA/IFROb2RlRmxhZ3MuaGFzQ2xhc3NNYXBCaW5kaW5ncyA6IFROb2RlRmxhZ3MuaGFzU3R5bGVNYXBCaW5kaW5ncztcbiAgICBpZiAoIWFwcGxpZWQgJiYgaGFzQ29uZmlnKHROb2RlLCBtYXBCaW5kaW5nc0ZsYWcpKSB7XG4gICAgICBjb25zdCBzdGF0ZSA9IGdldFN0eWxpbmdTdGF0ZShlbGVtZW50LCBURU1QTEFURV9ESVJFQ1RJVkVfSU5ERVgpO1xuICAgICAgY29uc3QgbWFwID0gaXNDbGFzc0Jhc2VkID8gc3RhdGUubGFzdERpcmVjdENsYXNzTWFwIDogc3RhdGUubGFzdERpcmVjdFN0eWxlTWFwO1xuICAgICAgYXBwbGllZCA9IG1hcCA/XG4gICAgICAgICAgZmluZEFuZEFwcGx5TWFwVmFsdWUocmVuZGVyZXIsIGVsZW1lbnQsIGFwcGx5Rm4sIG1hcCwgcHJvcCwgYmluZGluZ0luZGV4LCBzYW5pdGl6ZXIpIDpcbiAgICAgICAgICBmYWxzZTtcbiAgICB9XG5cbiAgICAvLyBjYXNlIDM6IGFwcGx5IHRoZSBpbml0aWFsIHZhbHVlIChpZiBpdCBleGlzdHMpXG4gICAgaWYgKCFhcHBsaWVkICYmIGhhc0NvbmZpZyh0Tm9kZSwgVE5vZGVGbGFncy5oYXNJbml0aWFsU3R5bGluZykpIHtcbiAgICAgIGNvbnN0IG1hcCA9IGdldFN0eWxpbmdNYXBBcnJheShjb250ZXh0KTtcbiAgICAgIGFwcGxpZWQgPVxuICAgICAgICAgIG1hcCA/IGZpbmRBbmRBcHBseU1hcFZhbHVlKHJlbmRlcmVyLCBlbGVtZW50LCBhcHBseUZuLCBtYXAsIHByb3AsIGJpbmRpbmdJbmRleCkgOiBmYWxzZTtcbiAgICB9XG5cbiAgICAvLyBkZWZhdWx0IGNhc2U6IGFwcGx5IGBudWxsYCB0byByZW1vdmUgdGhlIHZhbHVlXG4gICAgaWYgKCFhcHBsaWVkKSB7XG4gICAgICBhcHBseUZuKHJlbmRlcmVyLCBlbGVtZW50LCBwcm9wLCBudWxsLCBiaW5kaW5nSW5kZXgpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gYXBwbGllZDtcbn1cblxuZnVuY3Rpb24gYXBwbHlTdHlsaW5nVmFsdWUoXG4gICAgcmVuZGVyZXI6IGFueSwgZWxlbWVudDogUkVsZW1lbnQsIHByb3A6IHN0cmluZywgdmFsdWU6IGFueSwgYXBwbHlGbjogQXBwbHlTdHlsaW5nRm4sXG4gICAgYmluZGluZ0luZGV4OiBudW1iZXIsIHNhbml0aXplcj86IFN0eWxlU2FuaXRpemVGbiB8IG51bGwpOiBib29sZWFuIHtcbiAgbGV0IHZhbHVlVG9BcHBseTogc3RyaW5nfG51bGwgPSB1bndyYXBTYWZlVmFsdWUodmFsdWUpO1xuICBpZiAoaXNTdHlsaW5nVmFsdWVEZWZpbmVkKHZhbHVlVG9BcHBseSkpIHtcbiAgICB2YWx1ZVRvQXBwbHkgPVxuICAgICAgICBzYW5pdGl6ZXIgPyBzYW5pdGl6ZXIocHJvcCwgdmFsdWUsIFN0eWxlU2FuaXRpemVNb2RlLlZhbGlkYXRlQW5kU2FuaXRpemUpIDogdmFsdWVUb0FwcGx5O1xuICAgIGFwcGx5Rm4ocmVuZGVyZXIsIGVsZW1lbnQsIHByb3AsIHZhbHVlVG9BcHBseSwgYmluZGluZ0luZGV4KTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuICByZXR1cm4gZmFsc2U7XG59XG5cbmZ1bmN0aW9uIGZpbmRBbmRBcHBseU1hcFZhbHVlKFxuICAgIHJlbmRlcmVyOiBhbnksIGVsZW1lbnQ6IFJFbGVtZW50LCBhcHBseUZuOiBBcHBseVN0eWxpbmdGbiwgbWFwOiBTdHlsaW5nTWFwQXJyYXksIHByb3A6IHN0cmluZyxcbiAgICBiaW5kaW5nSW5kZXg6IG51bWJlciwgc2FuaXRpemVyPzogU3R5bGVTYW5pdGl6ZUZuIHwgbnVsbCkge1xuICBmb3IgKGxldCBpID0gU3R5bGluZ01hcEFycmF5SW5kZXguVmFsdWVzU3RhcnRQb3NpdGlvbjsgaSA8IG1hcC5sZW5ndGg7XG4gICAgICAgaSArPSBTdHlsaW5nTWFwQXJyYXlJbmRleC5UdXBsZVNpemUpIHtcbiAgICBjb25zdCBwID0gZ2V0TWFwUHJvcChtYXAsIGkpO1xuICAgIGlmIChwID09PSBwcm9wKSB7XG4gICAgICBsZXQgdmFsdWVUb0FwcGx5ID0gZ2V0TWFwVmFsdWUobWFwLCBpKTtcbiAgICAgIHZhbHVlVG9BcHBseSA9IHNhbml0aXplciA/XG4gICAgICAgICAgc2FuaXRpemVyKHByb3AsIHZhbHVlVG9BcHBseSwgU3R5bGVTYW5pdGl6ZU1vZGUuVmFsaWRhdGVBbmRTYW5pdGl6ZSkgOlxuICAgICAgICAgIHZhbHVlVG9BcHBseTtcbiAgICAgIGFwcGx5Rm4ocmVuZGVyZXIsIGVsZW1lbnQsIHByb3AsIHZhbHVlVG9BcHBseSwgYmluZGluZ0luZGV4KTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICBpZiAocCA+IHByb3ApIHtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuICByZXR1cm4gZmFsc2U7XG59XG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZUJpdE1hc2tWYWx1ZSh2YWx1ZTogbnVtYmVyIHwgYm9vbGVhbik6IG51bWJlciB7XG4gIC8vIGlmIHBhc3MgPT4gYXBwbHkgYWxsIHZhbHVlcyAoLTEgaW1wbGllcyB0aGF0IGFsbCBiaXRzIGFyZSBmbGlwcGVkIHRvIHRydWUpXG4gIGlmICh2YWx1ZSA9PT0gdHJ1ZSkgcmV0dXJuIC0xO1xuXG4gIC8vIGlmIHBhc3MgPT4gc2tpcCBhbGwgdmFsdWVzXG4gIGlmICh2YWx1ZSA9PT0gZmFsc2UpIHJldHVybiAwO1xuXG4gIC8vIHJldHVybiB0aGUgYml0IG1hc2sgdmFsdWUgYXMgaXNcbiAgcmV0dXJuIHZhbHVlO1xufVxuXG5sZXQgX2FjdGl2ZVN0eWxpbmdNYXBBcHBseUZuOiBTeW5jU3R5bGluZ01hcHNGbnxudWxsID0gbnVsbDtcbmV4cG9ydCBmdW5jdGlvbiBnZXRTdHlsaW5nTWFwc1N5bmNGbigpIHtcbiAgcmV0dXJuIF9hY3RpdmVTdHlsaW5nTWFwQXBwbHlGbjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNldFN0eWxpbmdNYXBzU3luY0ZuKGZuOiBTeW5jU3R5bGluZ01hcHNGbikge1xuICBfYWN0aXZlU3R5bGluZ01hcEFwcGx5Rm4gPSBmbjtcbn1cblxuLyoqXG4gKiBBc3NpZ25zIGEgc3R5bGUgdmFsdWUgdG8gYSBzdHlsZSBwcm9wZXJ0eSBmb3IgdGhlIGdpdmVuIGVsZW1lbnQuXG4gKi9cbmV4cG9ydCBjb25zdCBzZXRTdHlsZTogQXBwbHlTdHlsaW5nRm4gPVxuICAgIChyZW5kZXJlcjogUmVuZGVyZXIzIHwgbnVsbCwgbmF0aXZlOiBSRWxlbWVudCwgcHJvcDogc3RyaW5nLCB2YWx1ZTogc3RyaW5nIHwgbnVsbCkgPT4ge1xuICAgICAgaWYgKHJlbmRlcmVyICE9PSBudWxsKSB7XG4gICAgICAgIC8vIFVzZSBgaXNTdHlsaW5nVmFsdWVEZWZpbmVkYCB0byBhY2NvdW50IGZvciBmYWxzeSB2YWx1ZXMgdGhhdCBzaG91bGQgYmUgYm91bmQgbGlrZSAwLlxuICAgICAgICBpZiAoaXNTdHlsaW5nVmFsdWVEZWZpbmVkKHZhbHVlKSkge1xuICAgICAgICAgIC8vIG9wYWNpdHksIHotaW5kZXggYW5kIGZsZXhib3ggYWxsIGhhdmUgbnVtYmVyIHZhbHVlc1xuICAgICAgICAgIC8vIGFuZCB0aGVzZSBuZWVkIHRvIGJlIGNvbnZlcnRlZCBpbnRvIHN0cmluZ3Mgc28gdGhhdFxuICAgICAgICAgIC8vIHRoZXkgY2FuIGJlIGFzc2lnbmVkIHByb3Blcmx5LlxuICAgICAgICAgIHZhbHVlID0gdmFsdWUudG9TdHJpbmcoKTtcbiAgICAgICAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyU2V0U3R5bGUrKztcbiAgICAgICAgICBpZiAoaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpKSB7XG4gICAgICAgICAgICByZW5kZXJlci5zZXRTdHlsZShuYXRpdmUsIHByb3AsIHZhbHVlLCBSZW5kZXJlclN0eWxlRmxhZ3MzLkRhc2hDYXNlKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gVGhlIHJlYXNvbiB3aHkgbmF0aXZlIHN0eWxlIG1heSBiZSBgbnVsbGAgaXMgZWl0aGVyIGJlY2F1c2VcbiAgICAgICAgICAgIC8vIGl0J3MgYSBjb250YWluZXIgZWxlbWVudCBvciBpdCdzIGEgcGFydCBvZiBhIHRlc3RcbiAgICAgICAgICAgIC8vIGVudmlyb25tZW50IHRoYXQgZG9lc24ndCBoYXZlIHN0eWxpbmcuIEluIGVpdGhlclxuICAgICAgICAgICAgLy8gY2FzZSBpdCdzIHNhZmUgbm90IHRvIGFwcGx5IHN0eWxpbmcgdG8gdGhlIGVsZW1lbnQuXG4gICAgICAgICAgICBjb25zdCBuYXRpdmVTdHlsZSA9IG5hdGl2ZS5zdHlsZTtcbiAgICAgICAgICAgIGlmIChuYXRpdmVTdHlsZSAhPSBudWxsKSB7XG4gICAgICAgICAgICAgIG5hdGl2ZVN0eWxlLnNldFByb3BlcnR5KHByb3AsIHZhbHVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlclJlbW92ZVN0eWxlKys7XG5cbiAgICAgICAgICBpZiAoaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpKSB7XG4gICAgICAgICAgICByZW5kZXJlci5yZW1vdmVTdHlsZShuYXRpdmUsIHByb3AsIFJlbmRlcmVyU3R5bGVGbGFnczMuRGFzaENhc2UpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zdCBuYXRpdmVTdHlsZSA9IG5hdGl2ZS5zdHlsZTtcbiAgICAgICAgICAgIGlmIChuYXRpdmVTdHlsZSAhPSBudWxsKSB7XG4gICAgICAgICAgICAgIG5hdGl2ZVN0eWxlLnJlbW92ZVByb3BlcnR5KHByb3ApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH07XG5cbi8qKlxuICogQWRkcy9yZW1vdmVzIHRoZSBwcm92aWRlZCBjbGFzc05hbWUgdmFsdWUgdG8gdGhlIHByb3ZpZGVkIGVsZW1lbnQuXG4gKi9cbmV4cG9ydCBjb25zdCBzZXRDbGFzczogQXBwbHlTdHlsaW5nRm4gPVxuICAgIChyZW5kZXJlcjogUmVuZGVyZXIzIHwgbnVsbCwgbmF0aXZlOiBSRWxlbWVudCwgY2xhc3NOYW1lOiBzdHJpbmcsIHZhbHVlOiBhbnkpID0+IHtcbiAgICAgIGlmIChyZW5kZXJlciAhPT0gbnVsbCAmJiBjbGFzc05hbWUgIT09ICcnKSB7XG4gICAgICAgIGlmICh2YWx1ZSkge1xuICAgICAgICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJBZGRDbGFzcysrO1xuICAgICAgICAgIGlmIChpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikpIHtcbiAgICAgICAgICAgIHJlbmRlcmVyLmFkZENsYXNzKG5hdGl2ZSwgY2xhc3NOYW1lKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gdGhlIHJlYXNvbiB3aHkgY2xhc3NMaXN0IG1heSBiZSBgbnVsbGAgaXMgZWl0aGVyIGJlY2F1c2VcbiAgICAgICAgICAgIC8vIGl0J3MgYSBjb250YWluZXIgZWxlbWVudCBvciBpdCdzIGEgcGFydCBvZiBhIHRlc3RcbiAgICAgICAgICAgIC8vIGVudmlyb25tZW50IHRoYXQgZG9lc24ndCBoYXZlIHN0eWxpbmcuIEluIGVpdGhlclxuICAgICAgICAgICAgLy8gY2FzZSBpdCdzIHNhZmUgbm90IHRvIGFwcGx5IHN0eWxpbmcgdG8gdGhlIGVsZW1lbnQuXG4gICAgICAgICAgICBjb25zdCBjbGFzc0xpc3QgPSBuYXRpdmUuY2xhc3NMaXN0O1xuICAgICAgICAgICAgaWYgKGNsYXNzTGlzdCAhPSBudWxsKSB7XG4gICAgICAgICAgICAgIGNsYXNzTGlzdC5hZGQoY2xhc3NOYW1lKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlclJlbW92ZUNsYXNzKys7XG4gICAgICAgICAgaWYgKGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSkge1xuICAgICAgICAgICAgcmVuZGVyZXIucmVtb3ZlQ2xhc3MobmF0aXZlLCBjbGFzc05hbWUpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zdCBjbGFzc0xpc3QgPSBuYXRpdmUuY2xhc3NMaXN0O1xuICAgICAgICAgICAgaWYgKGNsYXNzTGlzdCAhPSBudWxsKSB7XG4gICAgICAgICAgICAgIGNsYXNzTGlzdC5yZW1vdmUoY2xhc3NOYW1lKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9O1xuXG5leHBvcnQgY29uc3Qgc2V0Q2xhc3NOYW1lID0gKHJlbmRlcmVyOiBSZW5kZXJlcjMgfCBudWxsLCBuYXRpdmU6IFJFbGVtZW50LCBjbGFzc05hbWU6IHN0cmluZykgPT4ge1xuICBpZiAocmVuZGVyZXIgIT09IG51bGwpIHtcbiAgICBpZiAoaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpKSB7XG4gICAgICByZW5kZXJlci5zZXRBdHRyaWJ1dGUobmF0aXZlLCAnY2xhc3MnLCBjbGFzc05hbWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICBuYXRpdmUuY2xhc3NOYW1lID0gY2xhc3NOYW1lO1xuICAgIH1cbiAgfVxufTtcblxuZXhwb3J0IGNvbnN0IHNldFN0eWxlQXR0ciA9IChyZW5kZXJlcjogUmVuZGVyZXIzIHwgbnVsbCwgbmF0aXZlOiBSRWxlbWVudCwgdmFsdWU6IHN0cmluZykgPT4ge1xuICBpZiAocmVuZGVyZXIgIT09IG51bGwpIHtcbiAgICBpZiAoaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpKSB7XG4gICAgICByZW5kZXJlci5zZXRBdHRyaWJ1dGUobmF0aXZlLCAnc3R5bGUnLCB2YWx1ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG5hdGl2ZS5zZXRBdHRyaWJ1dGUoJ3N0eWxlJywgdmFsdWUpO1xuICAgIH1cbiAgfVxufTtcblxuLyoqXG4gKiBJdGVyYXRlcyBvdmVyIGFsbCBwcm92aWRlZCBzdHlsaW5nIGVudHJpZXMgYW5kIHJlbmRlcnMgdGhlbSBvbiB0aGUgZWxlbWVudC5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIGlzIHVzZWQgYWxvbmdzaWRlIGEgYFN0eWxpbmdNYXBBcnJheWAgZW50cnkuIFRoaXMgZW50cnkgaXMgbm90XG4gKiB0aGUgc2FtZSBhcyB0aGUgYFRTdHlsaW5nQ29udGV4dGAgYW5kIGlzIG9ubHkgcmVhbGx5IHVzZWQgd2hlbiBhbiBlbGVtZW50IGNvbnRhaW5zXG4gKiBpbml0aWFsIHN0eWxpbmcgdmFsdWVzIChlLmcuIGA8ZGl2IHN0eWxlPVwid2lkdGg6MjAwcHhcIj5gKSwgYnV0IG5vIHN0eWxlL2NsYXNzIGJpbmRpbmdzXG4gKiBhcmUgcHJlc2VudC4gSWYgYW5kIHdoZW4gdGhhdCBoYXBwZW5zIHRoZW4gdGhpcyBmdW5jdGlvbiB3aWxsIGJlIGNhbGxlZCB0byByZW5kZXIgYWxsXG4gKiBpbml0aWFsIHN0eWxpbmcgdmFsdWVzIG9uIGFuIGVsZW1lbnQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZW5kZXJTdHlsaW5nTWFwKFxuICAgIHJlbmRlcmVyOiBSZW5kZXJlcjMsIGVsZW1lbnQ6IFJFbGVtZW50LCBzdHlsaW5nVmFsdWVzOiBUU3R5bGluZ0NvbnRleHQgfCBTdHlsaW5nTWFwQXJyYXkgfCBudWxsLFxuICAgIGlzQ2xhc3NCYXNlZDogYm9vbGVhbik6IHZvaWQge1xuICBjb25zdCBzdHlsaW5nTWFwQXJyID0gZ2V0U3R5bGluZ01hcEFycmF5KHN0eWxpbmdWYWx1ZXMpO1xuICBpZiAoc3R5bGluZ01hcEFycikge1xuICAgIGZvciAobGV0IGkgPSBTdHlsaW5nTWFwQXJyYXlJbmRleC5WYWx1ZXNTdGFydFBvc2l0aW9uOyBpIDwgc3R5bGluZ01hcEFyci5sZW5ndGg7XG4gICAgICAgICBpICs9IFN0eWxpbmdNYXBBcnJheUluZGV4LlR1cGxlU2l6ZSkge1xuICAgICAgY29uc3QgcHJvcCA9IGdldE1hcFByb3Aoc3R5bGluZ01hcEFyciwgaSk7XG4gICAgICBjb25zdCB2YWx1ZSA9IGdldE1hcFZhbHVlKHN0eWxpbmdNYXBBcnIsIGkpO1xuICAgICAgaWYgKGlzQ2xhc3NCYXNlZCkge1xuICAgICAgICBzZXRDbGFzcyhyZW5kZXJlciwgZWxlbWVudCwgcHJvcCwgdmFsdWUsIG51bGwpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc2V0U3R5bGUocmVuZGVyZXIsIGVsZW1lbnQsIHByb3AsIHZhbHVlLCBudWxsKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gb2JqZWN0VG9DbGFzc05hbWUob2JqOiB7W2tleTogc3RyaW5nXTogYW55fSB8IG51bGwpOiBzdHJpbmcge1xuICBsZXQgc3RyID0gJyc7XG4gIGlmIChvYmopIHtcbiAgICBmb3IgKGxldCBrZXkgaW4gb2JqKSB7XG4gICAgICBjb25zdCB2YWx1ZSA9IG9ialtrZXldO1xuICAgICAgaWYgKHZhbHVlKSB7XG4gICAgICAgIHN0ciArPSAoc3RyLmxlbmd0aCA/ICcgJyA6ICcnKSArIGtleTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIHN0cjtcbn1cblxuLyoqXG4gKiBEZXRlcm1pbmVzIHdoZXRoZXIgb3Igbm90IGFuIGVsZW1lbnQgc3R5bGUvY2xhc3NOYW1lIHZhbHVlIGhhcyBjaGFuZ2VkIHNpbmNlIHRoZSBsYXN0IHVwZGF0ZS5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIGhlbHBzIEFuZ3VsYXIgZGV0ZXJtaW5lIGlmIGEgc3R5bGUgb3IgY2xhc3MgYXR0cmlidXRlIHZhbHVlIHdhc1xuICogbW9kaWZpZWQgYnkgYW4gZXh0ZXJuYWwgcGx1Z2luIG9yIEFQSSBvdXRzaWRlIG9mIHRoZSBzdHlsZSBiaW5kaW5nIGNvZGUuIFRoaXNcbiAqIG1lYW5zIGFueSBKUyBjb2RlIHRoYXQgYWRkcy9yZW1vdmVzIGNsYXNzL3N0eWxlIHZhbHVlcyBvbiBhbiBlbGVtZW50IG91dHNpZGVcbiAqIG9mIEFuZ3VsYXIncyBzdHlsaW5nIGJpbmRpbmcgYWxnb3JpdGhtLlxuICpcbiAqIEByZXR1cm5zIHRydWUgd2hlbiB0aGUgdmFsdWUgd2FzIG1vZGlmaWVkIGV4dGVybmFsbHkuXG4gKi9cbmZ1bmN0aW9uIGNoZWNrSWZFeHRlcm5hbGx5TW9kaWZpZWQoZWxlbWVudDogSFRNTEVsZW1lbnQsIGNhY2hlZFZhbHVlOiBhbnksIGlzQ2xhc3NCYXNlZDogYm9vbGVhbikge1xuICAvLyB0aGlzIG1lYW5zIGl0IHdhcyBjaGVja2VkIGJlZm9yZSBhbmQgdGhlcmUgaXMgbm8gcmVhc29uXG4gIC8vIHRvIGNvbXBhcmUgdGhlIHN0eWxlL2NsYXNzIHZhbHVlcyBhZ2Fpbi4gRWl0aGVyIHRoYXQgb3JcbiAgLy8gd2ViIHdvcmtlcnMgYXJlIGJlaW5nIHVzZWQuXG4gIGlmIChnbG9iYWwuTm9kZSA9PT0gJ3VuZGVmaW5lZCcgfHwgY2FjaGVkVmFsdWUgPT09IFZBTFVFX0lTX0VYVEVSTkFMTFlfTU9ESUZJRUQpIHJldHVybiB0cnVlO1xuXG4gIC8vIGNvbXBhcmluZyB0aGUgRE9NIHZhbHVlIGFnYWluc3QgdGhlIGNhY2hlZCB2YWx1ZSBpcyB0aGUgYmVzdCB3YXkgdG9cbiAgLy8gc2VlIGlmIHNvbWV0aGluZyBoYXMgY2hhbmdlZC5cbiAgY29uc3QgY3VycmVudFZhbHVlID1cbiAgICAgIChpc0NsYXNzQmFzZWQgPyBlbGVtZW50LmNsYXNzTmFtZSA6IChlbGVtZW50LnN0eWxlICYmIGVsZW1lbnQuc3R5bGUuY3NzVGV4dCkpIHx8ICcnO1xuICByZXR1cm4gY3VycmVudFZhbHVlICE9PSAoY2FjaGVkVmFsdWUgfHwgJycpO1xufVxuXG4vKipcbiAqIFJlbW92ZXMgcHJvdmlkZWQgc3R5bGluZyB2YWx1ZXMgZnJvbSB0aGUgZWxlbWVudFxuICovXG5mdW5jdGlvbiByZW1vdmVTdHlsaW5nVmFsdWVzKFxuICAgIHJlbmRlcmVyOiBhbnksIGVsZW1lbnQ6IFJFbGVtZW50LCB2YWx1ZXM6IHN0cmluZyB8IHtba2V5OiBzdHJpbmddOiBhbnl9IHwgU3R5bGluZ01hcEFycmF5LFxuICAgIGlzQ2xhc3NCYXNlZDogYm9vbGVhbikge1xuICBsZXQgYXJyOiBTdHlsaW5nTWFwQXJyYXk7XG4gIGlmIChpc1N0eWxpbmdNYXBBcnJheSh2YWx1ZXMpKSB7XG4gICAgYXJyID0gdmFsdWVzIGFzIFN0eWxpbmdNYXBBcnJheTtcbiAgfSBlbHNlIHtcbiAgICBhcnIgPSBub3JtYWxpemVJbnRvU3R5bGluZ01hcChudWxsLCB2YWx1ZXMsICFpc0NsYXNzQmFzZWQpO1xuICB9XG5cbiAgY29uc3QgYXBwbHlGbiA9IGlzQ2xhc3NCYXNlZCA/IHNldENsYXNzIDogc2V0U3R5bGU7XG4gIGZvciAobGV0IGkgPSBTdHlsaW5nTWFwQXJyYXlJbmRleC5WYWx1ZXNTdGFydFBvc2l0aW9uOyBpIDwgYXJyLmxlbmd0aDtcbiAgICAgICBpICs9IFN0eWxpbmdNYXBBcnJheUluZGV4LlR1cGxlU2l6ZSkge1xuICAgIGNvbnN0IHZhbHVlID0gZ2V0TWFwVmFsdWUoYXJyLCBpKTtcbiAgICBpZiAodmFsdWUpIHtcbiAgICAgIGNvbnN0IHByb3AgPSBnZXRNYXBQcm9wKGFyciwgaSk7XG4gICAgICBhcHBseUZuKHJlbmRlcmVyLCBlbGVtZW50LCBwcm9wLCBudWxsKTtcbiAgICB9XG4gIH1cbn1cbiJdfQ==