/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { RendererStyleFlags3, isProceduralRenderer } from './interfaces/renderer';
/**
 * The styling context acts as a styling manifest (shaped as an array) for determining which
 * styling properties have been assigned via the provided `updateStyleMap` and `updateStyleProp`
 * functions. There are also two initialization functions `allocStylingContext` and
 * `createStylingContextTemplate` which are used to initialize and/or clone the context.
 *
 * The context is an array where the first two cells are used for static data (initial styling)
 * and dirty flags / index offsets). The remaining set of cells is used for multi (map) and single
 * (prop) style values.
 *
 * each value from here onwards is mapped as so:
 * [i] = mutation/type flag for the style value
 * [i + 1] = prop string (or null incase it has been removed)
 * [i + 2] = value string (or null incase it has been removed)
 *
 * There are three types of styling types stored in this context:
 *   initial: any styles that are passed in once the context is created
 *            (these are stored in the first cell of the array and the first
 *             value of this array is always `null` even if no initial styles exist.
 *             the `null` value is there so that any new styles have a parent to point
 *             to. This way we can always assume that there is a parent.)
 *
 *   single: any styles that are updated using `updateStyleProp` (fixed set)
 *
 *   multi: any styles that are updated using `updateStyleMap` (dynamic set)
 *
 * Note that context is only used to collect style information. Only when `renderStyles`
 * is called is when the styling payload will be rendered (or built as a key/value map).
 *
 * When the context is created, depending on what initial styles are passed in, the context itself
 * will be pre-filled with slots based on the initial style properties. Say for example we have a
 * series of initial styles that look like so:
 *
 *   style="width:100px; height:200px;"
 *
 * Then the initial state of the context (once initialized) will look like so:
 *
 * ```
 * context = [
 *   [null, '100px', '200px'],  // property names are not needed since they have already been
 * written to DOM.
 *
 *   configMasterVal,
 *
 *   // 2
 *   'width',
 *   pointers(1, 8);  // Point to static `width`: `100px` and multi `width`.
 *   null,
 *
 *   // 5
 *   'height',
 *   pointers(2, 11); // Point to static `height`: `200px` and multi `height`.
 *   null,
 *
 *   // 8
 *   'width',
 *   pointers(1, 2);  // Point to static `width`: `100px` and single `width`.
 *   null,
 *
 *   // 11
 *   'height',
 *   pointers(2, 5);  // Point to static `height`: `200px` and single `height`.
 *   null,
 * ]
 *
 * function pointers(staticIndex: number, dynamicIndex: number) {
 *   // combine the two indices into a single word.
 *   return (staticIndex << StylingFlags.BitCountSize) |
 *     (dynamicIndex << (StylingIndex.BitCountSize + StylingFlags.BitCountSize));
 * }
 * ```
 *
 * The values are duplicated so that space is set aside for both multi ([style])
 * and single ([style.prop]) values. The respective config values (configValA, configValB, etc...)
 * are a combination of the StylingFlags with two index values: the `initialIndex` (which points to
 * the index location of the style value in the initial styles array in slot 0) and the
 * `dynamicIndex` (which points to the matching single/multi index position in the context array
 * for the same prop).
 *
 * This means that every time `updateStyleProp` is called it must be called using an index value
 * (not a property string) which references the index value of the initial style when the context
 * was created. This also means that `updateStyleProp` cannot be called with a new property
 * (only `updateStyleMap` can include new CSS properties that will be added to the context).
 * @record
 */
export function StylingContext() { }
/**
 * The initial styles is populated whether or not there are any initial styles passed into
 * the context during allocation. The 0th value must be null so that index values of `0` within
 * the context flags can always point to a null value safely when nothing is set.
 *
 * All other entries in this array are of `string` value and correspond to the values that
 * were extracted from the `style=""` attribute in the HTML code for the provided template.
 * @record
 */
export function InitialStyles() { }
/** @enum {number} */
const StylingFlags = {
    // Implies no configurations
    None: 0,
    // Whether or not the entry or context itself is dirty
    Dirty: 1,
    // The max amount of bits used to represent these configuration values
    BitCountSize: 1,
};
export { StylingFlags };
/** @enum {number} */
const StylingIndex = {
    // Position of where the initial styles are stored in the styling context
    InitialStylesPosition: 0,
    // Index of location where the start of single properties are stored. (`updateStyleProp`)
    MasterFlagPosition: 1,
    // Location of single (prop) value entries are stored within the context
    SingleStylesStartPosition: 2,
    // Multi and single entries are stored in `StylingContext` as: Flag; PropertyName;  PropertyValue
    FlagsOffset: 0,
    PropertyOffset: 1,
    ValueOffset: 2,
    // Size of each multi or single entry (flag + prop + value)
    Size: 3,
    // Each flag has a binary digit length of this value
    BitCountSize: 15,
    // (32 - 1) / 2 = ~15
    // The binary digit value as a mask
    BitMask: 32767 // 15 bits
    ,
};
export { StylingIndex };
/**
 * Used clone a copy of a pre-computed template of a styling context.
 *
 * A pre-computed template is designed to be computed once for a given element
 * (instructions.ts has logic for caching this).
 * @param {?} templateStyleContext
 * @return {?}
 */
export function allocStylingContext(templateStyleContext) {
    // each instance gets a copy
    return /** @type {?} */ ((templateStyleContext.slice()));
}
/**
 * Creates a styling context template where styling information is stored.
 * Any styles that are later referenced using `updateStyleProp` must be
 * passed in within this function. Initial values for those styles are to
 * be declared after all initial style properties are declared (this change in
 * mode between declarations and initial styles is made possible using a special
 * enum value found in `definition.ts`).
 *
 * @param {?=} initialStyleDeclarations a list of style declarations and initial style values
 *    that are used later within the styling context.
 *
 *    -> ['width', 'height', SPECIAL_ENUM_VAL, 'width', '100px']
 *       This implies that `width` and `height` will be later styled and that the `width`
 *       property has an initial value of `100px`.
 * @return {?}
 */
export function createStylingContextTemplate(initialStyleDeclarations) {
    /** @type {?} */
    const initialStyles = [null];
    /** @type {?} */
    const context = [initialStyles, 0];
    /** @type {?} */
    const indexLookup = {};
    if (initialStyleDeclarations) {
        /** @type {?} */
        let hasPassedDeclarations = false;
        for (let i = 0; i < initialStyleDeclarations.length; i++) {
            /** @type {?} */
            const v = /** @type {?} */ (initialStyleDeclarations[i]);
            // this flag value marks where the declarations end the initial values begin
            if (v === 0 /* INITIAL_STYLES */) {
                hasPassedDeclarations = true;
            }
            else {
                /** @type {?} */
                const prop = /** @type {?} */ (v);
                if (hasPassedDeclarations) {
                    /** @type {?} */
                    const value = /** @type {?} */ (initialStyleDeclarations[++i]);
                    initialStyles.push(value);
                    indexLookup[prop] = initialStyles.length - 1;
                }
                else {
                    // it's safe to use `0` since the default initial value for
                    // each property will always be null (which is at position 0)
                    indexLookup[prop] = 0;
                }
            }
        }
    }
    /** @type {?} */
    const allProps = Object.keys(indexLookup);
    /** @type {?} */
    const totalProps = allProps.length;
    /** @type {?} */
    const maxLength = totalProps * 3 /* Size */ * 2 + 2 /* SingleStylesStartPosition */;
    // we need to fill the array from the start so that we can access
    // both the multi and the single array positions in the same loop block
    for (let i = 2 /* SingleStylesStartPosition */; i < maxLength; i++) {
        context.push(null);
    }
    /** @type {?} */
    const singleStart = 2 /* SingleStylesStartPosition */;
    /** @type {?} */
    const multiStart = totalProps * 3 /* Size */ + 2 /* SingleStylesStartPosition */;
    // fill single and multi-level styles
    for (let i = 0; i < allProps.length; i++) {
        /** @type {?} */
        const prop = allProps[i];
        /** @type {?} */
        const indexForInitial = indexLookup[prop];
        /** @type {?} */
        const indexForMulti = i * 3 /* Size */ + multiStart;
        /** @type {?} */
        const indexForSingle = i * 3 /* Size */ + singleStart;
        setFlag(context, indexForSingle, pointers(0 /* None */, indexForInitial, indexForMulti));
        setProp(context, indexForSingle, prop);
        setValue(context, indexForSingle, null);
        setFlag(context, indexForMulti, pointers(1 /* Dirty */, indexForInitial, indexForSingle));
        setProp(context, indexForMulti, prop);
        setValue(context, indexForMulti, null);
    }
    // there is no initial value flag for the master index since it doesn't reference an initial style
    // value
    setFlag(context, 1 /* MasterFlagPosition */, pointers(0, 0, multiStart));
    setContextDirty(context, initialStyles.length > 1);
    return context;
}
/** @type {?} */
const EMPTY_ARR = [];
/**
 * Sets and resolves all `multi` styles on an `StylingContext` so that they can be
 * applied to the element once `renderStyles` is called.
 *
 * All missing styles (any values that are not provided in the new `styles` param)
 * will resolve to `null` within their respective positions in the context.
 *
 * @param {?} context The styling context that will be updated with the
 *    newly provided style values.
 * @param {?} styles The key/value map of CSS styles that will be used for the update.
 * @return {?}
 */
export function updateStyleMap(context, styles) {
    /** @type {?} */
    const propsToApply = styles ? Object.keys(styles) : EMPTY_ARR;
    /** @type {?} */
    const multiStartIndex = getMultiStartIndex(context);
    /** @type {?} */
    let dirty = false;
    /** @type {?} */
    let ctxIndex = multiStartIndex;
    /** @type {?} */
    let propIndex = 0;
    // the main loop here will try and figure out how the shape of the provided
    // styles differ with respect to the context. Later if the context/styles are
    // off-balance then they will be dealt in another loop after this one
    while (ctxIndex < context.length && propIndex < propsToApply.length) {
        /** @type {?} */
        const flag = getPointers(context, ctxIndex);
        /** @type {?} */
        const prop = getProp(context, ctxIndex);
        /** @type {?} */
        const value = getValue(context, ctxIndex);
        /** @type {?} */
        const newProp = propsToApply[propIndex];
        /** @type {?} */
        const newValue = /** @type {?} */ ((styles))[newProp];
        if (prop === newProp) {
            if (value !== newValue) {
                setValue(context, ctxIndex, newValue);
                /** @type {?} */
                const initialValue = getInitialValue(context, flag);
                // there is no point in setting this to dirty if the previously
                // rendered value was being referenced by the initial style (or null)
                if (initialValue !== newValue) {
                    setDirty(context, ctxIndex, true);
                    dirty = true;
                }
            }
        }
        else {
            /** @type {?} */
            const indexOfEntry = findEntryPositionByProp(context, newProp, ctxIndex);
            if (indexOfEntry > 0) {
                // it was found at a later point ... just swap the values
                swapMultiContextEntries(context, ctxIndex, indexOfEntry);
                if (value !== newValue) {
                    setValue(context, ctxIndex, newValue);
                    dirty = true;
                }
            }
            else {
                /** @type {?} */
                const doShift = ctxIndex < context.length;
                insertNewMultiProperty(context, ctxIndex, newProp, newValue);
                dirty = true;
            }
        }
        ctxIndex += 3 /* Size */;
        propIndex++;
    }
    // this means that there are left-over values in the context that
    // were not included in the provided styles and in this case the
    // goal is to "remove" them from the context (by nullifying)
    while (ctxIndex < context.length) {
        /** @type {?} */
        const value = context[ctxIndex + 2 /* ValueOffset */];
        if (value !== null) {
            setDirty(context, ctxIndex, true);
            setValue(context, ctxIndex, null);
            dirty = true;
        }
        ctxIndex += 3 /* Size */;
    }
    // this means that there are left-over property in the context that
    // were not detected in the context during the loop above. In that
    // case we want to add the new entries into the list
    while (propIndex < propsToApply.length) {
        /** @type {?} */
        const prop = propsToApply[propIndex];
        /** @type {?} */
        const value = /** @type {?} */ ((styles))[prop];
        context.push(1 /* Dirty */, prop, value);
        propIndex++;
        dirty = true;
    }
    if (dirty) {
        setContextDirty(context, true);
    }
}
/**
 * Sets and resolves a single CSS style on a property on an `StylingContext` so that they
 * can be applied to the element once `renderElementStyles` is called.
 *
 * Note that prop-level styles are considered higher priority than styles that are applied
 * using `updateStyleMap`, therefore, when styles are rendered then any styles that
 * have been applied using this function will be considered first (then multi values second
 * and then initial values as a backup).
 *
 * @param {?} context The styling context that will be updated with the
 *    newly provided style value.
 * @param {?} index The index of the property which is being updated.
 * @param {?} value The CSS style value that will be assigned
 * @return {?}
 */
export function updateStyleProp(context, index, value) {
    /** @type {?} */
    const singleIndex = 2 /* SingleStylesStartPosition */ + index * 3 /* Size */;
    /** @type {?} */
    const currValue = getValue(context, singleIndex);
    /** @type {?} */
    const currFlag = getPointers(context, singleIndex);
    // didn't change ... nothing to make a note of
    if (currValue !== value) {
        // the value will always get updated (even if the dirty flag is skipped)
        setValue(context, singleIndex, value);
        /** @type {?} */
        const indexForMulti = getMultiOrSingleIndex(currFlag);
        /** @type {?} */
        const valueForMulti = getValue(context, indexForMulti);
        if (!valueForMulti || valueForMulti !== value) {
            /** @type {?} */
            let multiDirty = false;
            /** @type {?} */
            let singleDirty = true;
            // only when the value is set to `null` should the multi-value get flagged
            if (value == null && valueForMulti) {
                multiDirty = true;
                singleDirty = false;
            }
            setDirty(context, indexForMulti, multiDirty);
            setDirty(context, singleIndex, singleDirty);
            setContextDirty(context, true);
        }
    }
}
/**
 * Renders all queued styles using a renderer onto the given element.
 *
 * This function works by rendering any styles (that have been applied
 * using `updateStyleMap` and `updateStyleProp`) onto the
 * provided element using the provided renderer. Just before the styles
 * are rendered a final key/value style map will be assembled.
 *
 * @param {?} lElement the element that the styles will be rendered on
 * @param {?} context The styling context that will be used to determine
 *      what styles will be rendered
 * @param {?} renderer the renderer that will be used to apply the styling
 * @param {?=} styleStore if provided, the updated style values will be applied
 *    to this key/value map instead of being renderered via the renderer.
 * @return {?} an object literal. `{ color: 'red', height: 'auto'}`.
 */
export function renderStyles(lElement, context, renderer, styleStore) {
    if (isContextDirty(context)) {
        /** @type {?} */
        const native = lElement.native;
        /** @type {?} */
        const multiStartIndex = getMultiStartIndex(context);
        for (let i = 2 /* SingleStylesStartPosition */; i < context.length; i += 3 /* Size */) {
            // there is no point in rendering styles that have not changed on screen
            if (isDirty(context, i)) {
                /** @type {?} */
                const prop = getProp(context, i);
                /** @type {?} */
                const value = getValue(context, i);
                /** @type {?} */
                const flag = getPointers(context, i);
                /** @type {?} */
                const isInSingleRegion = i < multiStartIndex;
                /** @type {?} */
                let styleToApply = value;
                // STYLE DEFER CASE 1: Use a multi value instead of a null single value
                // this check implies that a single value was removed and we
                // should now defer to a multi value and use that (if set).
                if (isInSingleRegion && styleToApply == null) {
                    /** @type {?} */
                    const multiIndex = getMultiOrSingleIndex(flag);
                    styleToApply = getValue(context, multiIndex);
                }
                // STYLE DEFER CASE 2: Use the initial value if all else fails (is null)
                // the initial value will always be a string or null,
                // therefore we can safely adopt it incase there's nothing else
                if (styleToApply == null) {
                    styleToApply = getInitialValue(context, flag);
                }
                setStyle(native, prop, styleToApply, renderer, styleStore);
                setDirty(context, i, false);
            }
        }
        setContextDirty(context, false);
    }
}
/**
 * This function renders a given CSS prop/value entry using the
 * provided renderer. If a `styleStore` value is provided then
 * that will be used a render context instead of the provided
 * renderer.
 *
 * @param {?} native the DOM Element
 * @param {?} prop the CSS style property that will be rendered
 * @param {?} value the CSS style value that will be rendered
 * @param {?} renderer
 * @param {?=} styleStore an optional key/value map that will be used as a context to render styles on
 * @return {?}
 */
function setStyle(native, prop, value, renderer, styleStore) {
    if (styleStore) {
        styleStore[prop] = value;
    }
    else if (value == null) {
        ngDevMode && ngDevMode.rendererRemoveStyle++;
        isProceduralRenderer(renderer) ?
            renderer.removeStyle(native, prop, RendererStyleFlags3.DashCase) :
            native['style'].removeProperty(prop);
    }
    else {
        ngDevMode && ngDevMode.rendererSetStyle++;
        isProceduralRenderer(renderer) ?
            renderer.setStyle(native, prop, value, RendererStyleFlags3.DashCase) :
            native['style'].setProperty(prop, value);
    }
}
/**
 * @param {?} context
 * @param {?} index
 * @param {?} isDirtyYes
 * @return {?}
 */
function setDirty(context, index, isDirtyYes) {
    /** @type {?} */
    const adjustedIndex = index >= 2 /* SingleStylesStartPosition */ ? (index + 0 /* FlagsOffset */) : index;
    if (isDirtyYes) {
        (/** @type {?} */ (context[adjustedIndex])) |= 1 /* Dirty */;
    }
    else {
        (/** @type {?} */ (context[adjustedIndex])) &= ~1 /* Dirty */;
    }
}
/**
 * @param {?} context
 * @param {?} index
 * @return {?}
 */
function isDirty(context, index) {
    /** @type {?} */
    const adjustedIndex = index >= 2 /* SingleStylesStartPosition */ ? (index + 0 /* FlagsOffset */) : index;
    return ((/** @type {?} */ (context[adjustedIndex])) & 1 /* Dirty */) == 1 /* Dirty */;
}
/**
 * @param {?} configFlag
 * @param {?} staticIndex
 * @param {?} dynamicIndex
 * @return {?}
 */
function pointers(configFlag, staticIndex, dynamicIndex) {
    return (configFlag & 1 /* Dirty */) | (staticIndex << 1 /* BitCountSize */) |
        (dynamicIndex << (15 /* BitCountSize */ + 1 /* BitCountSize */));
}
/**
 * @param {?} context
 * @param {?} flag
 * @return {?}
 */
function getInitialValue(context, flag) {
    /** @type {?} */
    const index = getInitialIndex(flag);
    return /** @type {?} */ (context[0 /* InitialStylesPosition */][index]);
}
/**
 * @param {?} flag
 * @return {?}
 */
function getInitialIndex(flag) {
    return (flag >> 1 /* BitCountSize */) & 32767 /* BitMask */;
}
/**
 * @param {?} flag
 * @return {?}
 */
function getMultiOrSingleIndex(flag) {
    /** @type {?} */
    const index = (flag >> (15 /* BitCountSize */ + 1 /* BitCountSize */)) & 32767 /* BitMask */;
    return index >= 2 /* SingleStylesStartPosition */ ? index : -1;
}
/**
 * @param {?} context
 * @return {?}
 */
function getMultiStartIndex(context) {
    return /** @type {?} */ (getMultiOrSingleIndex(context[1 /* MasterFlagPosition */]));
}
/**
 * @param {?} context
 * @param {?} index
 * @param {?} prop
 * @return {?}
 */
function setProp(context, index, prop) {
    context[index + 1 /* PropertyOffset */] = prop;
}
/**
 * @param {?} context
 * @param {?} index
 * @param {?} value
 * @return {?}
 */
function setValue(context, index, value) {
    context[index + 2 /* ValueOffset */] = value;
}
/**
 * @param {?} context
 * @param {?} index
 * @param {?} flag
 * @return {?}
 */
function setFlag(context, index, flag) {
    /** @type {?} */
    const adjustedIndex = index === 1 /* MasterFlagPosition */ ? index : (index + 0 /* FlagsOffset */);
    context[adjustedIndex] = flag;
}
/**
 * @param {?} context
 * @param {?} index
 * @return {?}
 */
function getPointers(context, index) {
    /** @type {?} */
    const adjustedIndex = index === 1 /* MasterFlagPosition */ ? index : (index + 0 /* FlagsOffset */);
    return /** @type {?} */ (context[adjustedIndex]);
}
/**
 * @param {?} context
 * @param {?} index
 * @return {?}
 */
function getValue(context, index) {
    return /** @type {?} */ (context[index + 2 /* ValueOffset */]);
}
/**
 * @param {?} context
 * @param {?} index
 * @return {?}
 */
function getProp(context, index) {
    return /** @type {?} */ (context[index + 1 /* PropertyOffset */]);
}
/**
 * @param {?} context
 * @return {?}
 */
export function isContextDirty(context) {
    return isDirty(context, 1 /* MasterFlagPosition */);
}
/**
 * @param {?} context
 * @param {?} isDirtyYes
 * @return {?}
 */
export function setContextDirty(context, isDirtyYes) {
    setDirty(context, 1 /* MasterFlagPosition */, isDirtyYes);
}
/**
 * @param {?} context
 * @param {?} prop
 * @param {?=} startIndex
 * @return {?}
 */
function findEntryPositionByProp(context, prop, startIndex) {
    for (let i = (startIndex || 0) + 1 /* PropertyOffset */; i < context.length; i += 3 /* Size */) {
        /** @type {?} */
        const thisProp = context[i];
        if (thisProp == prop) {
            return i - 1 /* PropertyOffset */;
        }
    }
    return -1;
}
/**
 * @param {?} context
 * @param {?} indexA
 * @param {?} indexB
 * @return {?}
 */
function swapMultiContextEntries(context, indexA, indexB) {
    /** @type {?} */
    const tmpValue = getValue(context, indexA);
    /** @type {?} */
    const tmpProp = getProp(context, indexA);
    /** @type {?} */
    const tmpFlag = getPointers(context, indexA);
    /** @type {?} */
    let flagA = tmpFlag;
    /** @type {?} */
    let flagB = getPointers(context, indexB);
    /** @type {?} */
    const singleIndexA = getMultiOrSingleIndex(flagA);
    if (singleIndexA >= 0) {
        /** @type {?} */
        const _flag = getPointers(context, singleIndexA);
        /** @type {?} */
        const _initial = getInitialIndex(_flag);
        setFlag(context, singleIndexA, pointers(_flag, _initial, indexB));
    }
    /** @type {?} */
    const singleIndexB = getMultiOrSingleIndex(flagB);
    if (singleIndexB >= 0) {
        /** @type {?} */
        const _flag = getPointers(context, singleIndexB);
        /** @type {?} */
        const _initial = getInitialIndex(_flag);
        setFlag(context, singleIndexB, pointers(_flag, _initial, indexA));
    }
    setValue(context, indexA, getValue(context, indexB));
    setProp(context, indexA, getProp(context, indexB));
    setFlag(context, indexA, getPointers(context, indexB));
    setValue(context, indexB, tmpValue);
    setProp(context, indexB, tmpProp);
    setFlag(context, indexB, tmpFlag);
}
/**
 * @param {?} context
 * @param {?} indexStartPosition
 * @return {?}
 */
function updateSinglePointerValues(context, indexStartPosition) {
    for (let i = indexStartPosition; i < context.length; i += 3 /* Size */) {
        /** @type {?} */
        const multiFlag = getPointers(context, i);
        /** @type {?} */
        const singleIndex = getMultiOrSingleIndex(multiFlag);
        if (singleIndex > 0) {
            /** @type {?} */
            const singleFlag = getPointers(context, singleIndex);
            /** @type {?} */
            const initialIndexForSingle = getInitialIndex(singleFlag);
            /** @type {?} */
            const updatedFlag = pointers(isDirty(context, singleIndex) ? 1 /* Dirty */ : 0 /* None */, initialIndexForSingle, i);
            setFlag(context, singleIndex, updatedFlag);
        }
    }
}
/**
 * @param {?} context
 * @param {?} index
 * @param {?} name
 * @param {?} value
 * @return {?}
 */
function insertNewMultiProperty(context, index, name, value) {
    /** @type {?} */
    const doShift = index < context.length;
    // prop does not exist in the list, add it in
    context.splice(index, 0, 1 /* Dirty */, name, value);
    if (doShift) {
        // because the value was inserted midway into the array then we
        // need to update all the shifted multi values' single value
        // pointers to point to the newly shifted location
        updateSinglePointerValues(context, index + 3 /* Size */);
    }
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3R5bGluZy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvc3R5bGluZy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQVVBLE9BQU8sRUFBWSxtQkFBbUIsRUFBRSxvQkFBb0IsRUFBQyxNQUFNLHVCQUF1QixDQUFDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lBb0h6RixPQUFVOztJQUVWLFFBQVc7O0lBRVgsZUFBZ0I7Ozs7OztJQU1oQix3QkFBeUI7O0lBRXpCLHFCQUFzQjs7SUFFdEIsNEJBQTZCOztJQUU3QixjQUFlO0lBQ2YsaUJBQWtCO0lBQ2xCLGNBQWU7O0lBRWYsT0FBUTs7SUFFUixnQkFBaUI7OztJQUVqQixjQUEyQjs7Ozs7Ozs7Ozs7O0FBUzdCLE1BQU0sOEJBQThCLG9CQUFvQzs7SUFFdEUsMEJBQU8sb0JBQW9CLENBQUMsS0FBSyxFQUFTLEdBQW1CO0NBQzlEOzs7Ozs7Ozs7Ozs7Ozs7OztBQWlCRCxNQUFNLHVDQUNGLHdCQUFrRTs7SUFDcEUsTUFBTSxhQUFhLEdBQWtCLENBQUMsSUFBSSxDQUFDLENBQUM7O0lBQzVDLE1BQU0sT0FBTyxHQUFtQixDQUFDLGFBQWEsRUFBRSxDQUFDLENBQUMsQ0FBQzs7SUFFbkQsTUFBTSxXQUFXLEdBQTRCLEVBQUUsQ0FBQztJQUNoRCxJQUFJLHdCQUF3QixFQUFFOztRQUM1QixJQUFJLHFCQUFxQixHQUFHLEtBQUssQ0FBQztRQUNsQyxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsd0JBQXdCLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFOztZQUN4RCxNQUFNLENBQUMscUJBQUcsd0JBQXdCLENBQUMsQ0FBQyxDQUFp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USxDQUN4QixPQUFPLENBQUMsT0FBTyxFQUFFLFdBQVcsQ0FBQyxDQUFDLENBQUMsZUFBb0IsQ0FBQyxhQUFrQixFQUN0RSxxQkFBcUIsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUM5QixPQUFPLENBQUMsT0FBTyxFQUFFLFdBQVcsRUFBRSxXQUFXLENBQUMsQ0FBQztTQUM1QztLQUNGO0NBQ0Y7Ozs7Ozs7O0FBRUQsZ0NBQ0ksT0FBdUIsRUFBRSxLQUFhLEVBQUUsSUFBWSxFQUFFLEtBQWE7O0lBQ3JFLE1BQU0sT0FBTyxHQUFHLEtBQUssR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDOztJQUd2QyxPQUFPLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRSxDQUFDLGlCQUFzQixJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFFMUQsSUFBSSxPQUFPLEVBQUU7Ozs7UUFJWCx5QkFBeUIsQ0FBQyxPQUFPLEVBQUUsS0FBSyxlQUFvQixDQUFDLENBQUM7S0FDL0Q7Q0FDRiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtJbml0aWFsU3R5bGluZ0ZsYWdzfSBmcm9tICcuL2ludGVyZmFjZXMvZGVmaW5pdGlvbic7XG5pbXBvcnQge0xFbGVtZW50Tm9kZX0gZnJvbSAnLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtSZW5kZXJlcjMsIFJlbmRlcmVyU3R5bGVGbGFnczMsIGlzUHJvY2VkdXJhbFJlbmRlcmVyfSBmcm9tICcuL2ludGVyZmFjZXMvcmVuZGVyZXInO1xuXG4vKipcbiAqIFRoZSBzdHlsaW5nIGNvbnRleHQgYWN0cyBhcyBhIHN0eWxpbmcgbWFuaWZlc3QgKHNoYXBlZCBhcyBhbiBhcnJheSkgZm9yIGRldGVybWluaW5nIHdoaWNoXG4gKiBzdHlsaW5nIHByb3BlcnRpZXMgaGF2ZSBiZWVuIGFzc2lnbmVkIHZpYSB0aGUgcHJvdmlkZWQgYHVwZGF0ZVN0eWxlTWFwYCBhbmQgYHVwZGF0ZVN0eWxlUHJvcGBcbiAqIGZ1bmN0aW9ucy4gVGhlcmUgYXJlIGFsc28gdHdvIGluaXRpYWxpemF0aW9uIGZ1bmN0aW9ucyBgYWxsb2NTdHlsaW5nQ29udGV4dGAgYW5kXG4gKiBgY3JlYXRlU3R5bGluZ0NvbnRleHRUZW1wbGF0ZWAgd2hpY2ggYXJlIHVzZWQgdG8gaW5pdGlhbGl6ZSBhbmQvb3IgY2xvbmUgdGhlIGNvbnRleHQuXG4gKlxuICogVGhlIGNvbnRleHQgaXMgYW4gYXJyYXkgd2hlcmUgdGhlIGZpcnN0IHR3byBjZWxscyBhcmUgdXNlZCBmb3Igc3RhdGljIGRhdGEgKGluaXRpYWwgc3R5bGluZylcbiAqIGFuZCBkaXJ0eSBmbGFncyAvIGluZGV4IG9mZnNldHMpLiBUaGUgcmVtYWluaW5nIHNldCBvZiBjZWxscyBpcyB1c2VkIGZvciBtdWx0aSAobWFwKSBhbmQgc2luZ2xlXG4gKiAocHJvcCkgc3R5bGUgdmFsdWVzLlxuICpcbiAqIGVhY2ggdmFsdWUgZnJvbSBoZXJlIG9ud2FyZHMgaXMgbWFwcGVkIGFzIHNvOlxuICogW2ldID0gbXV0YXRpb24vdHlwZSBmbGFnIGZvciB0aGUgc3R5bGUgdmFsdWVcbiAqIFtpICsgMV0gPSBwcm9wIHN0cmluZyAob3IgbnVsbCBpbmNhc2UgaXQgaGFzIGJlZW4gcmVtb3ZlZClcbiAqIFtpICsgMl0gPSB2YWx1ZSBzdHJpbmcgKG9yIG51bGwgaW5jYXNlIGl0IGhhcyBiZWVuIHJlbW92ZWQpXG4gKlxuICogVGhlcmUgYXJlIHRocmVlIHR5cGVzIG9mIHN0eWxpbmcgdHlwZXMgc3RvcmVkIGluIHRoaXMgY29udGV4dDpcbiAqICAgaW5pdGlhbDogYW55IHN0eWxlcyB0aGF0IGFyZSBwYXNzZWQgaW4gb25jZSB0aGUgY29udGV4dCBpcyBjcmVhdGVkXG4gKiAgICAgICAgICAgICh0aGVzZSBhcmUgc3RvcmVkIGluIHRoZSBmaXJzdCBjZWxsIG9mIHRoZSBhcnJheSBhbmQgdGhlIGZpcnN0XG4gKiAgICAgICAgICAgICB2YWx1ZSBvZiB0aGlzIGFycmF5IGlzIGFsd2F5cyBgbnVsbGAgZXZlbiBpZiBubyBpbml0aWFsIHN0eWxlcyBleGlzdC5cbiAqICAgICAgICAgICAgIHRoZSBgbnVsbGAgdmFsdWUgaXMgdGhlcmUgc28gdGhhdCBhbnkgbmV3IHN0eWxlcyBoYXZlIGEgcGFyZW50IHRvIHBvaW50XG4gKiAgICAgICAgICAgICB0by4gVGhpcyB3YXkgd2UgY2FuIGFsd2F5cyBhc3N1bWUgdGhhdCB0aGVyZSBpcyBhIHBhcmVudC4pXG4gKlxuICogICBzaW5nbGU6IGFueSBzdHlsZXMgdGhhdCBhcmUgdXBkYXRlZCB1c2luZyBgdXBkYXRlU3R5bGVQcm9wYCAoZml4ZWQgc2V0KVxuICpcbiAqICAgbXVsdGk6IGFueSBzdHlsZXMgdGhhdCBhcmUgdXBkYXRlZCB1c2luZyBgdXBkYXRlU3R5bGVNYXBgIChkeW5hbWljIHNldClcbiAqXG4gKiBOb3RlIHRoYXQgY29udGV4dCBpcyBvbmx5IHVzZWQgdG8gY29sbGVjdCBzdHlsZSBpbmZvcm1hdGlvbi4gT25seSB3aGVuIGByZW5kZXJTdHlsZXNgXG4gKiBpcyBjYWxsZWQgaXMgd2hlbiB0aGUgc3R5bGluZyBwYXlsb2FkIHdpbGwgYmUgcmVuZGVyZWQgKG9yIGJ1aWx0IGFzIGEga2V5L3ZhbHVlIG1hcCkuXG4gKlxuICogV2hlbiB0aGUgY29udGV4dCBpcyBjcmVhdGVkLCBkZXBlbmRpbmcgb24gd2hhdCBpbml0aWFsIHN0eWxlcyBhcmUgcGFzc2VkIGluLCB0aGUgY29udGV4dCBpdHNlbGZcbiAqIHdpbGwgYmUgcHJlLWZpbGxlZCB3aXRoIHNsb3RzIGJhc2VkIG9uIHRoZSBpbml0aWFsIHN0eWxlIHByb3BlcnRpZXMuIFNheSBmb3IgZXhhbXBsZSB3ZSBoYXZlIGFcbiAqIHNlcmllcyBvZiBpbml0aWFsIHN0eWxlcyB0aGF0IGxvb2sgbGlrZSBzbzpcbiAqXG4gKiAgIHN0eWxlPVwid2lkdGg6MTAwcHg7IGhlaWdodDoyMDBweDtcIlxuICpcbiAqIFRoZW4gdGhlIGluaXRpYWwgc3RhdGUgb2YgdGhlIGNvbnRleHQgKG9uY2UgaW5pdGlhbGl6ZWQpIHdpbGwgbG9vayBsaWtlIHNvOlxuICpcbiAqIGBgYFxuICogY29udGV4dCA9IFtcbiAqICAgW251bGwsICcxMDBweCcsICcyMDBweCddLCAgLy8gcHJvcGVydHkgbmFtZXMgYXJlIG5vdCBuZWVkZWQgc2luY2UgdGhleSBoYXZlIGFscmVhZHkgYmVlblxuICogd3JpdHRlbiB0byBET00uXG4gKlxuICogICBjb25maWdNYXN0ZXJWYWwsXG4gKlxuICogICAvLyAyXG4gKiAgICd3aWR0aCcsXG4gKiAgIHBvaW50ZXJzKDEsIDgpOyAgLy8gUG9pbnQgdG8gc3RhdGljIGB3aWR0aGA6IGAxMDBweGAgYW5kIG11bHRpIGB3aWR0aGAuXG4gKiAgIG51bGwsXG4gKlxuICogICAvLyA1XG4gKiAgICdoZWlnaHQnLFxuICogICBwb2ludGVycygyLCAxMSk7IC8vIFBvaW50IHRvIHN0YXRpYyBgaGVpZ2h0YDogYDIwMHB4YCBhbmQgbXVsdGkgYGhlaWdodGAuXG4gKiAgIG51bGwsXG4gKlxuICogICAvLyA4XG4gKiAgICd3aWR0aCcsXG4gKiAgIHBvaW50ZXJzKDEsIDIpOyAgLy8gUG9pbnQgdG8gc3RhdGljIGB3aWR0aGA6IGAxMDBweGAgYW5kIHNpbmdsZSBgd2lkdGhgLlxuICogICBudWxsLFxuICpcbiAqICAgLy8gMTFcbiAqICAgJ2hlaWdodCcsXG4gKiAgIHBvaW50ZXJzKDIsIDUpOyAgLy8gUG9pbnQgdG8gc3RhdGljIGBoZWlnaHRgOiBgMjAwcHhgIGFuZCBzaW5nbGUgYGhlaWdodGAuXG4gKiAgIG51bGwsXG4gKiBdXG4gKlxuICogZnVuY3Rpb24gcG9pbnRlcnMoc3RhdGljSW5kZXg6IG51bWJlciwgZHluYW1pY0luZGV4OiBudW1iZXIpIHtcbiAqICAgLy8gY29tYmluZSB0aGUgdHdvIGluZGljZXMgaW50byBhIHNpbmdsZSB3b3JkLlxuICogICByZXR1cm4gKHN0YXRpY0luZGV4IDw8IFN0eWxpbmdGbGFncy5CaXRDb3VudFNpemUpIHxcbiAqICAgICAoZHluYW1pY0luZGV4IDw8IChTdHlsaW5nSW5kZXguQml0Q291bnRTaXplICsgU3R5bGluZ0ZsYWdzLkJpdENvdW50U2l6ZSkpO1xuICogfVxuICogYGBgXG4gKlxuICogVGhlIHZhbHVlcyBhcmUgZHVwbGljYXRlZCBzbyB0aGF0IHNwYWNlIGlzIHNldCBhc2lkZSBmb3IgYm90aCBtdWx0aSAoW3N0eWxlXSlcbiAqIGFuZCBzaW5nbGUgKFtzdHlsZS5wcm9wXSkgdmFsdWVzLiBUaGUgcmVzcGVjdGl2ZSBjb25maWcgdmFsdWVzIChjb25maWdWYWxBLCBjb25maWdWYWxCLCBldGMuLi4pXG4gKiBhcmUgYSBjb21iaW5hdGlvbiBvZiB0aGUgU3R5bGluZ0ZsYWdzIHdpdGggdHdvIGluZGV4IHZhbHVlczogdGhlIGBpbml0aWFsSW5kZXhgICh3aGljaCBwb2ludHMgdG9cbiAqIHRoZSBpbmRleCBsb2NhdGlvbiBvZiB0aGUgc3R5bGUgdmFsdWUgaW4gdGhlIGluaXRpYWwgc3R5bGVzIGFycmF5IGluIHNsb3QgMCkgYW5kIHRoZVxuICogYGR5bmFtaWNJbmRleGAgKHdoaWNoIHBvaW50cyB0byB0aGUgbWF0Y2hpbmcgc2luZ2xlL211bHRpIGluZGV4IHBvc2l0aW9uIGluIHRoZSBjb250ZXh0IGFycmF5XG4gKiBmb3IgdGhlIHNhbWUgcHJvcCkuXG4gKlxuICogVGhpcyBtZWFucyB0aGF0IGV2ZXJ5IHRpbWUgYHVwZGF0ZVN0eWxlUHJvcGAgaXMgY2FsbGVkIGl0IG11c3QgYmUgY2FsbGVkIHVzaW5nIGFuIGluZGV4IHZhbHVlXG4gKiAobm90IGEgcHJvcGVydHkgc3RyaW5nKSB3aGljaCByZWZlcmVuY2VzIHRoZSBpbmRleCB2YWx1ZSBvZiB0aGUgaW5pdGlhbCBzdHlsZSB3aGVuIHRoZSBjb250ZXh0XG4gKiB3YXMgY3JlYXRlZC4gVGhpcyBhbHNvIG1lYW5zIHRoYXQgYHVwZGF0ZVN0eWxlUHJvcGAgY2Fubm90IGJlIGNhbGxlZCB3aXRoIGEgbmV3IHByb3BlcnR5XG4gKiAob25seSBgdXBkYXRlU3R5bGVNYXBgIGNhbiBpbmNsdWRlIG5ldyBDU1MgcHJvcGVydGllcyB0aGF0IHdpbGwgYmUgYWRkZWQgdG8gdGhlIGNvbnRleHQpLlxuICovXG5leHBvcnQgaW50ZXJmYWNlIFN0eWxpbmdDb250ZXh0IGV4dGVuZHMgQXJyYXk8SW5pdGlhbFN0eWxlc3xudW1iZXJ8c3RyaW5nfG51bGw+IHtcbiAgLyoqXG4gICAqIExvY2F0aW9uIG9mIGluaXRpYWwgZGF0YSBzaGFyZWQgYnkgYWxsIGluc3RhbmNlcyBvZiB0aGlzIHN0eWxlLlxuICAgKi9cbiAgWzBdOiBJbml0aWFsU3R5bGVzO1xuXG4gIC8qKlxuICAgKiBBIG51bWVyaWMgdmFsdWUgcmVwcmVzZW50aW5nIHRoZSBjb25maWd1cmF0aW9uIHN0YXR1cyAod2hldGhlciB0aGUgY29udGV4dCBpcyBkaXJ0eSBvciBub3QpXG4gICAqIG1peGVkIHRvZ2V0aGVyICh1c2luZyBiaXQgc2hpZnRpbmcpIHdpdGggYSBpbmRleCB2YWx1ZSB3aGljaCB0ZWxscyB0aGUgc3RhcnRpbmcgaW5kZXggdmFsdWVcbiAgICogb2Ygd2hlcmUgdGhlIG11bHRpIHN0eWxlIGVudHJpZXMgYmVnaW4uXG4gICAqL1xuICBbMV06IG51bWJlcjtcbn1cblxuLyoqXG4gKiBUaGUgaW5pdGlhbCBzdHlsZXMgaXMgcG9wdWxhdGVkIHdoZXRoZXIgb3Igbm90IHRoZXJlIGFyZSBhbnkgaW5pdGlhbCBzdHlsZXMgcGFzc2VkIGludG9cbiAqIHRoZSBjb250ZXh0IGR1cmluZyBhbGxvY2F0aW9uLiBUaGUgMHRoIHZhbHVlIG11c3QgYmUgbnVsbCBzbyB0aGF0IGluZGV4IHZhbHVlcyBvZiBgMGAgd2l0aGluXG4gKiB0aGUgY29udGV4dCBmbGFncyBjYW4gYWx3YXlzIHBvaW50IHRvIGEgbnVsbCB2YWx1ZSBzYWZlbHkgd2hlbiBub3RoaW5nIGlzIHNldC5cbiAqXG4gKiBBbGwgb3RoZXIgZW50cmllcyBpbiB0aGlzIGFycmF5IGFyZSBvZiBgc3RyaW5nYCB2YWx1ZSBhbmQgY29ycmVzcG9uZCB0byB0aGUgdmFsdWVzIHRoYXRcbiAqIHdlcmUgZXh0cmFjdGVkIGZyb20gdGhlIGBzdHlsZT1cIlwiYCBhdHRyaWJ1dGUgaW4gdGhlIEhUTUwgY29kZSBmb3IgdGhlIHByb3ZpZGVkIHRlbXBsYXRlLlxuICovXG5leHBvcnQgaW50ZXJmYWNlIEluaXRpYWxTdHlsZXMgZXh0ZW5kcyBBcnJheTxzdHJpbmd8bnVsbD4geyBbMF06IG51bGw7IH1cblxuLyoqXG4gKiBVc2VkIHRvIHNldCB0aGUgY29udGV4dCB0byBiZSBkaXJ0eSBvciBub3QgYm90aCBvbiB0aGUgbWFzdGVyIGZsYWcgKHBvc2l0aW9uIDEpXG4gKiBvciBmb3IgZWFjaCBzaW5nbGUvbXVsdGkgcHJvcGVydHkgdGhhdCBleGlzdHMgaW4gdGhlIGNvbnRleHQuXG4gKi9cbmV4cG9ydCBjb25zdCBlbnVtIFN0eWxpbmdGbGFncyB7XG4gIC8vIEltcGxpZXMgbm8gY29uZmlndXJhdGlvbnNcbiAgTm9uZSA9IDBiMCxcbiAgLy8gV2hldGhlciBvciBub3QgdGhlIGVudHJ5IG9yIGNvbnRleHQgaXRzZWxmIGlzIGRpcnR5XG4gIERpcnR5ID0gMGIxLFxuICAvLyBUaGUgbWF4IGFtb3VudCBvZiBiaXRzIHVzZWQgdG8gcmVwcmVzZW50IHRoZXNlIGNvbmZpZ3VyYXRpb24gdmFsdWVzXG4gIEJpdENvdW50U2l6ZSA9IDEsXG59XG5cbi8qKiBVc2VkIGFzIG51bWVyaWMgcG9pbnRlciB2YWx1ZXMgdG8gZGV0ZXJtaW5lIHdoYXQgY2VsbHMgdG8gdXBkYXRlIGluIHRoZSBgU3R5bGluZ0NvbnRleHRgICovXG5leHBvcnQgY29uc3QgZW51bSBTdHlsaW5nSW5kZXgge1xuICAvLyBQb3NpdGlvbiBvZiB3aGVyZSB0aGUgaW5pdGlhbCBzdHlsZXMgYXJlIHN0b3JlZCBpbiB0aGUgc3R5bGluZyBjb250ZXh0XG4gIEluaXRpYWxTdHlsZXNQb3NpdGlvbiA9IDAsXG4gIC8vIEluZGV4IG9mIGxvY2F0aW9uIHdoZXJlIHRoZSBzdGFydCBvZiBzaW5nbGUgcHJvcGVydGllcyBhcmUgc3RvcmVkLiAoYHVwZGF0ZVN0eWxlUHJvcGApXG4gIE1hc3RlckZsYWdQb3NpdGlvbiA9IDEsXG4gIC8vIExvY2F0aW9uIG9mIHNpbmdsZSAocHJvcCkgdmFsdWUgZW50cmllcyBhcmUgc3RvcmVkIHdpdGhpbiB0aGUgY29udGV4dFxuICBTaW5nbGVTdHlsZXNTdGFydFBvc2l0aW9uID0gMixcbiAgLy8gTXVsdGkgYW5kIHNpbmdsZSBlbnRyaWVzIGFyZSBzdG9yZWQgaW4gYFN0eWxpbmdDb250ZXh0YCBhczogRmxhZzsgUHJvcGVydHlOYW1lOyAgUHJvcGVydHlWYWx1ZVxuICBGbGFnc09mZnNldCA9IDAsXG4gIFByb3BlcnR5T2Zmc2V0ID0gMSxcbiAgVmFsdWVPZmZzZXQgPSAyLFxuICAvLyBTaXplIG9mIGVhY2ggbXVsdGkgb3Igc2luZ2xlIGVudHJ5IChmbGFnICsgcHJvcCArIHZhbHVlKVxuICBTaXplID0gMyxcbiAgLy8gRWFjaCBmbGFnIGhhcyBhIGJpbmFyeSBkaWdpdCBsZW5ndGggb2YgdGhpcyB2YWx1ZVxuICBCaXRDb3VudFNpemUgPSAxNSwgIC8vICgzMiAtIDEpIC8gMiA9IH4xNVxuICAvLyBUaGUgYmluYXJ5IGRpZ2l0IHZhbHVlIGFzIGEgbWFza1xuICBCaXRNYXNrID0gMGIxMTExMTExMTExMTExMTEgIC8vIDE1IGJpdHNcbn1cblxuLyoqXG4gKiBVc2VkIGNsb25lIGEgY29weSBvZiBhIHByZS1jb21wdXRlZCB0ZW1wbGF0ZSBvZiBhIHN0eWxpbmcgY29udGV4dC5cbiAqXG4gKiBBIHByZS1jb21wdXRlZCB0ZW1wbGF0ZSBpcyBkZXNpZ25lZCB0byBiZSBjb21wdXRlZCBvbmNlIGZvciBhIGdpdmVuIGVsZW1lbnRcbiAqIChpbnN0cnVjdGlvbnMudHMgaGFzIGxvZ2ljIGZvciBjYWNoaW5nIHRoaXMpLlxuICovXG5leHBvcnQgZnVuY3Rpb24gYWxsb2NTdHlsaW5nQ29udGV4dCh0ZW1wbGF0ZVN0eWxlQ29udGV4dDogU3R5bGluZ0NvbnRleHQpOiBTdHlsaW5nQ29udGV4dCB7XG4gIC8vIGVhY2ggaW5zdGFuY2UgZ2V0cyBhIGNvcHlcbiAgcmV0dXJuIHRlbXBsYXRlU3R5bGVDb250ZXh0LnNsaWNlKCkgYXMgYW55IGFzIFN0eWxpbmdDb250ZXh0O1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYSBzdHlsaW5nIGNvbnRleHQgdGVtcGxhdGUgd2hlcmUgc3R5bGluZyBpbmZvcm1hdGlvbiBpcyBzdG9yZWQuXG4gKiBBbnkgc3R5bGVzIHRoYXQgYXJlIGxhdGVyIHJlZmVyZW5jZWQgdXNpbmcgYHVwZGF0ZVN0eWxlUHJvcGAgbXVzdCBiZVxuICogcGFzc2VkIGluIHdpdGhpbiB0aGlzIGZ1bmN0aW9uLiBJbml0aWFsIHZhbHVlcyBmb3IgdGhvc2Ugc3R5bGVzIGFyZSB0b1xuICogYmUgZGVjbGFyZWQgYWZ0ZXIgYWxsIGluaXRpYWwgc3R5bGUgcHJvcGVydGllcyBhcmUgZGVjbGFyZWQgKHRoaXMgY2hhbmdlIGluXG4gKiBtb2RlIGJldHdlZW4gZGVjbGFyYXRpb25zIGFuZCBpbml0aWFsIHN0eWxlcyBpcyBtYWRlIHBvc3NpYmxlIHVzaW5nIGEgc3BlY2lhbFxuICogZW51bSB2YWx1ZSBmb3VuZCBpbiBgZGVmaW5pdGlvbi50c2ApLlxuICpcbiAqIEBwYXJhbSBpbml0aWFsU3R5bGVEZWNsYXJhdGlvbnMgYSBsaXN0IG9mIHN0eWxlIGRlY2xhcmF0aW9ucyBhbmQgaW5pdGlhbCBzdHlsZSB2YWx1ZXNcbiAqICAgIHRoYXQgYXJlIHVzZWQgbGF0ZXIgd2l0aGluIHRoZSBzdHlsaW5nIGNvbnRleHQuXG4gKlxuICogICAgLT4gWyd3aWR0aCcsICdoZWlnaHQnLCBTUEVDSUFMX0VOVU1fVkFMLCAnd2lkdGgnLCAnMTAwcHgnXVxuICogICAgICAgVGhpcyBpbXBsaWVzIHRoYXQgYHdpZHRoYCBhbmQgYGhlaWdodGAgd2lsbCBiZSBsYXRlciBzdHlsZWQgYW5kIHRoYXQgdGhlIGB3aWR0aGBcbiAqICAgICAgIHByb3BlcnR5IGhhcyBhbiBpbml0aWFsIHZhbHVlIG9mIGAxMDBweGAuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVTdHlsaW5nQ29udGV4dFRlbXBsYXRlKFxuICAgIGluaXRpYWxTdHlsZURlY2xhcmF0aW9ucz86IChzdHJpbmcgfCBJbml0aWFsU3R5bGluZ0ZsYWdzKVtdIHwgbnVsbCk6IFN0eWxpbmdDb250ZXh0IHtcbiAgY29uc3QgaW5pdGlhbFN0eWxlczogSW5pdGlhbFN0eWxlcyA9IFtudWxsXTtcbiAgY29uc3QgY29udGV4dDogU3R5bGluZ0NvbnRleHQgPSBbaW5pdGlhbFN0eWxlcywgMF07XG5cbiAgY29uc3QgaW5kZXhMb29rdXA6IHtba2V5OiBzdHJpbmddOiBudW1iZXJ9ID0ge307XG4gIGlmIChpbml0aWFsU3R5bGVEZWNsYXJhdGlvbnMpIHtcbiAgICBsZXQgaGFzUGFzc2VkRGVjbGFyYXRpb25zID0gZmFsc2U7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBpbml0aWFsU3R5bGVEZWNsYXJhdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IHYgPSBpbml0aWFsU3R5bGVEZWNsYXJhdGlvbnNbaV0gYXMgc3RyaW5nIHwgSW5pdGlhbFN0eWxpbmdGbGFncztcblxuICAgICAgLy8gdGhpcyBmbGFnIHZhbHVlIG1hcmtzIHdoZXJlIHRoZSBkZWNsYXJhdGlvbnMgZW5kIHRoZSBpbml0aWFsIHZhbHVlcyBiZWdpblxuICAgICAgaWYgKHYgPT09IEluaXRpYWxTdHlsaW5nRmxhZ3MuSU5JVElBTF9TVFlMRVMpIHtcbiAgICAgICAgaGFzUGFzc2VkRGVjbGFyYXRpb25zID0gdHJ1ZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IHByb3AgPSB2IGFzIHN0cmluZztcbiAgICAgICAgaWYgKGhhc1Bhc3NlZERlY2xhcmF0aW9ucykge1xuICAgICAgICAgIGNvbnN0IHZhbHVlID0gaW5pdGlhbFN0eWxlRGVjbGFyYXRpb25zWysraV0gYXMgc3RyaW5nO1xuICAgICAgICAgIGluaXRpYWxTdHlsZXMucHVzaCh2YWx1ZSk7XG4gICAgICAgICAgaW5kZXhMb29rdXBbcHJvcF0gPSBpbml0aWFsU3R5bGVzLmxlbmd0aCAtIDE7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gaXQncyBzYWZlIHRvIHVzZSBgMGAgc2luY2UgdGhlIGRlZmF1bHQgaW5pdGlhbCB2YWx1ZSBmb3JcbiAgICAgICAgICAvLyBlYWNoIHByb3BlcnR5IHdpbGwgYWx3YXlzIGJlIG51bGwgKHdoaWNoIGlzIGF0IHBvc2l0aW9uIDApXG4gICAgICAgICAgaW5kZXhMb29rdXBbcHJvcF0gPSAwO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgY29uc3QgYWxsUHJvcHMgPSBPYmplY3Qua2V5cyhpbmRleExvb2t1cCk7XG4gIGNvbnN0IHRvdGFsUHJvcHMgPSBhbGxQcm9wcy5sZW5ndGg7XG5cbiAgLy8gKjIgYmVjYXVzZSB3ZSBhcmUgZmlsbGluZyBmb3IgYm90aCBzaW5nbGUgYW5kIG11bHRpIHN0eWxlIHNwYWNlc1xuICBjb25zdCBtYXhMZW5ndGggPSB0b3RhbFByb3BzICogU3R5bGluZ0luZGV4LlNpemUgKiAyICsgU3R5bGluZ0luZGV4LlNpbmdsZVN0eWxlc1N0YXJ0UG9zaXRpb247XG5cbiAgLy8gd2UgbmVlZCB0byBmaWxsIHRoZSBhcnJheSBmcm9tIHRoZSBzdGFydCBzbyB0aGF0IHdlIGNhbiBhY2Nlc3NcbiAgLy8gYm90aCB0aGUgbXVsdGkgYW5kIHRoZSBzaW5nbGUgYXJyYXkgcG9zaXRpb25zIGluIHRoZSBzYW1lIGxvb3AgYmxvY2tcbiAgZm9yIChsZXQgaSA9IFN0eWxpbmdJbmRleC5TaW5nbGVTdHlsZXNTdGFydFBvc2l0aW9uOyBpIDwgbWF4TGVuZ3RoOyBpKyspIHtcbiAgICBjb250ZXh0LnB1c2gobnVsbCk7XG4gIH1cblxuICBjb25zdCBzaW5nbGVTdGFydCA9IFN0eWxpbmdJbmRleC5TaW5nbGVTdHlsZXNTdGFydFBvc2l0aW9uO1xuICBjb25zdCBtdWx0aVN0YXJ0ID0gdG90YWxQcm9wcyAqIFN0eWxpbmdJbmRleC5TaXplICsgU3R5bGluZ0luZGV4LlNpbmdsZVN0eWxlc1N0YXJ0UG9zaXRpb247XG5cbiAgLy8gZmlsbCBzaW5nbGUgYW5kIG11bHRpLWxldmVsIHN0eWxlc1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGFsbFByb3BzLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3QgcHJvcCA9IGFsbFByb3BzW2ldO1xuXG4gICAgY29uc3QgaW5kZXhGb3JJbml0aWFsID0gaW5kZXhMb29rdXBbcHJvcF07XG4gICAgY29uc3QgaW5kZXhGb3JNdWx0aSA9IGkgKiBTdHlsaW5nSW5kZXguU2l6ZSArIG11bHRpU3RhcnQ7XG4gICAgY29uc3QgaW5kZXhGb3JTaW5nbGUgPSBpICogU3R5bGluZ0luZGV4LlNpemUgKyBzaW5nbGVTdGFydDtcblxuICAgIHNldEZsYWcoY29udGV4dCwgaW5kZXhGb3JTaW5nbGUsIHBvaW50ZXJzKFN0eWxpbmdGbGFncy5Ob25lLCBpbmRleEZvckluaXRpYWwsIGluZGV4Rm9yTXVsdGkpKTtcbiAgICBzZXRQcm9wKGNvbnRleHQsIGluZGV4Rm9yU2luZ2xlLCBwcm9wKTtcbiAgICBzZXRWYWx1ZShjb250ZXh0LCBpbmRleEZvclNpbmdsZSwgbnVsbCk7XG5cbiAgICBzZXRGbGFnKGNvbnRleHQsIGluZGV4Rm9yTXVsdGksIHBvaW50ZXJzKFN0eWxpbmdGbGFncy5EaXJ0eSwgaW5kZXhGb3JJbml0aWFsLCBpbmRleEZvclNpbmdsZSkpO1xuICAgIHNldFByb3AoY29udGV4dCwgaW5kZXhGb3JNdWx0aSwgcHJvcCk7XG4gICAgc2V0VmFsdWUoY29udGV4dCwgaW5kZXhGb3JNdWx0aSwgbnVsbCk7XG4gIH1cblxuICAvLyB0aGVyZSBpcyBubyBpbml0aWFsIHZhbHVlIGZsYWcgZm9yIHRoZSBtYXN0ZXIgaW5kZXggc2luY2UgaXQgZG9lc24ndCByZWZlcmVuY2UgYW4gaW5pdGlhbCBzdHlsZVxuICAvLyB2YWx1ZVxuICBzZXRGbGFnKGNvbnRleHQsIFN0eWxpbmdJbmRleC5NYXN0ZXJGbGFnUG9zaXRpb24sIHBvaW50ZXJzKDAsIDAsIG11bHRpU3RhcnQpKTtcbiAgc2V0Q29udGV4dERpcnR5KGNvbnRleHQsIGluaXRpYWxTdHlsZXMubGVuZ3RoID4gMSk7XG5cbiAgcmV0dXJuIGNvbnRleHQ7XG59XG5cbmNvbnN0IEVNUFRZX0FSUjogYW55W10gPSBbXTtcbi8qKlxuICogU2V0cyBhbmQgcmVzb2x2ZXMgYWxsIGBtdWx0aWAgc3R5bGVzIG9uIGFuIGBTdHlsaW5nQ29udGV4dGAgc28gdGhhdCB0aGV5IGNhbiBiZVxuICogYXBwbGllZCB0byB0aGUgZWxlbWVudCBvbmNlIGByZW5kZXJTdHlsZXNgIGlzIGNhbGxlZC5cbiAqXG4gKiBBbGwgbWlzc2luZyBzdHlsZXMgKGFueSB2YWx1ZXMgdGhhdCBhcmUgbm90IHByb3ZpZGVkIGluIHRoZSBuZXcgYHN0eWxlc2AgcGFyYW0pXG4gKiB3aWxsIHJlc29sdmUgdG8gYG51bGxgIHdpdGhpbiB0aGVpciByZXNwZWN0aXZlIHBvc2l0aW9ucyBpbiB0aGUgY29udGV4dC5cbiAqXG4gKiBAcGFyYW0gY29udGV4dCBUaGUgc3R5bGluZyBjb250ZXh0IHRoYXQgd2lsbCBiZSB1cGRhdGVkIHdpdGggdGhlXG4gKiAgICBuZXdseSBwcm92aWRlZCBzdHlsZSB2YWx1ZXMuXG4gKiBAcGFyYW0gc3R5bGVzIFRoZSBrZXkvdmFsdWUgbWFwIG9mIENTUyBzdHlsZXMgdGhhdCB3aWxsIGJlIHVzZWQgZm9yIHRoZSB1cGRhdGUuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB1cGRhdGVTdHlsZU1hcChjb250ZXh0OiBTdHlsaW5nQ29udGV4dCwgc3R5bGVzOiB7W2tleTogc3RyaW5nXTogYW55fSB8IG51bGwpOiB2b2lkIHtcbiAgY29uc3QgcHJvcHNUb0FwcGx5ID0gc3R5bGVzID8gT2JqZWN0LmtleXMoc3R5bGVzKSA6IEVNUFRZX0FSUjtcbiAgY29uc3QgbXVsdGlTdGFydEluZGV4ID0gZ2V0TXVsdGlTdGFydEluZGV4KGNvbnRleHQpO1xuXG4gIGxldCBkaXJ0eSA9IGZhbHNlO1xuICBsZXQgY3R4SW5kZXggPSBtdWx0aVN0YXJ0SW5kZXg7XG4gIGxldCBwcm9wSW5kZXggPSAwO1xuXG4gIC8vIHRoZSBtYWluIGxvb3AgaGVyZSB3aWxsIHRyeSBhbmQgZmlndXJlIG91dCBob3cgdGhlIHNoYXBlIG9mIHRoZSBwcm92aWRlZFxuICAvLyBzdHlsZXMgZGlmZmVyIHdpdGggcmVzcGVjdCB0byB0aGUgY29udGV4dC4gTGF0ZXIgaWYgdGhlIGNvbnRleHQvc3R5bGVzIGFyZVxuICAvLyBvZmYtYmFsYW5jZSB0aGVuIHRoZXkgd2lsbCBiZSBkZWFsdCBpbiBhbm90aGVyIGxvb3AgYWZ0ZXIgdGhpcyBvbmVcbiAgd2hpbGUgKGN0eEluZGV4IDwgY29udGV4dC5sZW5ndGggJiYgcHJvcEluZGV4IDwgcHJvcHNUb0FwcGx5Lmxlbmd0aCkge1xuICAgIGNvbnN0IGZsYWcgPSBnZXRQb2ludGVycyhjb250ZXh0LCBjdHhJbmRleCk7XG4gICAgY29uc3QgcHJvcCA9IGdldFByb3AoY29udGV4dCwgY3R4SW5kZXgpO1xuICAgIGNvbnN0IHZhbHVlID0gZ2V0VmFsdWUoY29udGV4dCwgY3R4SW5kZXgpO1xuXG4gICAgY29uc3QgbmV3UHJvcCA9IHByb3BzVG9BcHBseVtwcm9wSW5kZXhdO1xuICAgIGNvbnN0IG5ld1ZhbHVlID0gc3R5bGVzICFbbmV3UHJvcF07XG4gICAgaWYgKHByb3AgPT09IG5ld1Byb3ApIHtcbiAgICAgIGlmICh2YWx1ZSAhPT0gbmV3VmFsdWUpIHtcbiAgICAgICAgc2V0VmFsdWUoY29udGV4dCwgY3R4SW5kZXgsIG5ld1ZhbHVlKTtcbiAgICAgICAgY29uc3QgaW5pdGlhbFZhbHVlID0gZ2V0SW5pdGlhbFZhbHVlKGNvbnRleHQsIGZsYWcpO1xuXG4gICAgICAgIC8vIHRoZXJlIGlzIG5vIHBvaW50IGluIHNldHRpbmcgdGhpcyB0byBkaXJ0eSBpZiB0aGUgcHJldmlvdXNseVxuICAgICAgICAvLyByZW5kZXJlZCB2YWx1ZSB3YXMgYmVpbmcgcmVmZXJlbmNlZCBieSB0aGUgaW5pdGlhbCBzdHlsZSAob3IgbnVsbClcbiAgICAgICAgaWYgKGluaXRpYWxWYWx1ZSAhPT0gbmV3VmFsdWUpIHtcbiAgICAgICAgICBzZXREaXJ0eShjb250ZXh0LCBjdHhJbmRleCwgdHJ1ZSk7XG4gICAgICAgICAgZGlydHkgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IGluZGV4T2ZFbnRyeSA9IGZpbmRFbnRyeVBvc2l0aW9uQnlQcm9wKGNvbnRleHQsIG5ld1Byb3AsIGN0eEluZGV4KTtcbiAgICAgIGlmIChpbmRleE9mRW50cnkgPiAwKSB7XG4gICAgICAgIC8vIGl0IHdhcyBmb3VuZCBhdCBhIGxhdGVyIHBvaW50IC4uLiBqdXN0IHN3YXAgdGhlIHZhbHVlc1xuICAgICAgICBzd2FwTXVsdGlDb250ZXh0RW50cmllcyhjb250ZXh0LCBjdHhJbmRleCwgaW5kZXhPZkVudHJ5KTtcbiAgICAgICAgaWYgKHZhbHVlICE9PSBuZXdWYWx1ZSkge1xuICAgICAgICAgIHNldFZhbHVlKGNvbnRleHQsIGN0eEluZGV4LCBuZXdWYWx1ZSk7XG4gICAgICAgICAgZGlydHkgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyB3ZSBvbmx5IGNhcmUgdG8gZG8gdGhpcyBpZiB0aGUgaW5zZXJ0aW9uIGlzIGluIHRoZSBtaWRkbGVcbiAgICAgICAgY29uc3QgZG9TaGlmdCA9IGN0eEluZGV4IDwgY29udGV4dC5sZW5ndGg7XG4gICAgICAgIGluc2VydE5ld011bHRpUHJvcGVydHkoY29udGV4dCwgY3R4SW5kZXgsIG5ld1Byb3AsIG5ld1ZhbHVlKTtcbiAgICAgICAgZGlydHkgPSB0cnVlO1xuICAgICAgfVxuICAgIH1cblxuICAgIGN0eEluZGV4ICs9IFN0eWxpbmdJbmRleC5TaXplO1xuICAgIHByb3BJbmRleCsrO1xuICB9XG5cbiAgLy8gdGhpcyBtZWFucyB0aGF0IHRoZXJlIGFyZSBsZWZ0LW92ZXIgdmFsdWVzIGluIHRoZSBjb250ZXh0IHRoYXRcbiAgLy8gd2VyZSBub3QgaW5jbHVkZWQgaW4gdGhlIHByb3ZpZGVkIHN0eWxlcyBhbmQgaW4gdGhpcyBjYXNlIHRoZVxuICAvLyBnb2FsIGlzIHRvIFwicmVtb3ZlXCIgdGhlbSBmcm9tIHRoZSBjb250ZXh0IChieSBudWxsaWZ5aW5nKVxuICB3aGlsZSAoY3R4SW5kZXggPCBjb250ZXh0Lmxlbmd0aCkge1xuICAgIGNvbnN0IHZhbHVlID0gY29udGV4dFtjdHhJbmRleCArIFN0eWxpbmdJbmRleC5WYWx1ZU9mZnNldF07XG4gICAgaWYgKHZhbHVlICE9PSBudWxsKSB7XG4gICAgICBzZXREaXJ0eShjb250ZXh0LCBjdHhJbmRleCwgdHJ1ZSk7XG4gICAgICBzZXRWYWx1ZShjb250ZXh0LCBjdHhJbmRleCwgbnVsbCk7XG4gICAgICBkaXJ0eSA9IHRydWU7XG4gICAgfVxuICAgIGN0eEluZGV4ICs9IFN0eWxpbmdJbmRleC5TaXplO1xuICB9XG5cbiAgLy8gdGhpcyBtZWFucyB0aGF0IHRoZXJlIGFyZSBsZWZ0LW92ZXIgcHJvcGVydHkgaW4gdGhlIGNvbnRleHQgdGhhdFxuICAvLyB3ZXJlIG5vdCBkZXRlY3RlZCBpbiB0aGUgY29udGV4dCBkdXJpbmcgdGhlIGxvb3AgYWJvdmUuIEluIHRoYXRcbiAgLy8gY2FzZSB3ZSB3YW50IHRvIGFkZCB0aGUgbmV3IGVudHJpZXMgaW50byB0aGUgbGlzdFxuICB3aGlsZSAocHJvcEluZGV4IDwgcHJvcHNUb0FwcGx5Lmxlbmd0aCkge1xuICAgIGNvbnN0IHByb3AgPSBwcm9wc1RvQXBwbHlbcHJvcEluZGV4XTtcbiAgICBjb25zdCB2YWx1ZSA9IHN0eWxlcyAhW3Byb3BdO1xuICAgIGNvbnRleHQucHVzaChTdHlsaW5nRmxhZ3MuRGlydHksIHByb3AsIHZhbHVlKTtcbiAgICBwcm9wSW5kZXgrKztcbiAgICBkaXJ0eSA9IHRydWU7XG4gIH1cblxuICBpZiAoZGlydHkpIHtcbiAgICBzZXRDb250ZXh0RGlydHkoY29udGV4dCwgdHJ1ZSk7XG4gIH1cbn1cblxuLyoqXG4gKiBTZXRzIGFuZCByZXNvbHZlcyBhIHNpbmdsZSBDU1Mgc3R5bGUgb24gYSBwcm9wZXJ0eSBvbiBhbiBgU3R5bGluZ0NvbnRleHRgIHNvIHRoYXQgdGhleVxuICogY2FuIGJlIGFwcGxpZWQgdG8gdGhlIGVsZW1lbnQgb25jZSBgcmVuZGVyRWxlbWVudFN0eWxlc2AgaXMgY2FsbGVkLlxuICpcbiAqIE5vdGUgdGhhdCBwcm9wLWxldmVsIHN0eWxlcyBhcmUgY29uc2lkZXJlZCBoaWdoZXIgcHJpb3JpdHkgdGhhbiBzdHlsZXMgdGhhdCBhcmUgYXBwbGllZFxuICogdXNpbmcgYHVwZGF0ZVN0eWxlTWFwYCwgdGhlcmVmb3JlLCB3aGVuIHN0eWxlcyBhcmUgcmVuZGVyZWQgdGhlbiBhbnkgc3R5bGVzIHRoYXRcbiAqIGhhdmUgYmVlbiBhcHBsaWVkIHVzaW5nIHRoaXMgZnVuY3Rpb24gd2lsbCBiZSBjb25zaWRlcmVkIGZpcnN0ICh0aGVuIG11bHRpIHZhbHVlcyBzZWNvbmRcbiAqIGFuZCB0aGVuIGluaXRpYWwgdmFsdWVzIGFzIGEgYmFja3VwKS5cbiAqXG4gKiBAcGFyYW0gY29udGV4dCBUaGUgc3R5bGluZyBjb250ZXh0IHRoYXQgd2lsbCBiZSB1cGRhdGVkIHdpdGggdGhlXG4gKiAgICBuZXdseSBwcm92aWRlZCBzdHlsZSB2YWx1ZS5cbiAqIEBwYXJhbSBpbmRleCBUaGUgaW5kZXggb2YgdGhlIHByb3BlcnR5IHdoaWNoIGlzIGJlaW5nIHVwZGF0ZWQuXG4gKiBAcGFyYW0gdmFsdWUgVGhlIENTUyBzdHlsZSB2YWx1ZSB0aGF0IHdpbGwgYmUgYXNzaWduZWRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHVwZGF0ZVN0eWxlUHJvcChcbiAgICBjb250ZXh0OiBTdHlsaW5nQ29udGV4dCwgaW5kZXg6IG51bWJlciwgdmFsdWU6IHN0cmluZyB8IG51bGwpOiB2b2lkIHtcbiAgY29uc3Qgc2luZ2xlSW5kZXggPSBTdHlsaW5nSW5kZXguU2luZ2xlU3R5bGVzU3RhcnRQb3NpdGlvbiArIGluZGV4ICogU3R5bGluZ0luZGV4LlNpemU7XG4gIGNvbnN0IGN1cnJWYWx1ZSA9IGdldFZhbHVlKGNvbnRleHQsIHNpbmdsZUluZGV4KTtcbiAgY29uc3QgY3VyckZsYWcgPSBnZXRQb2ludGVycyhjb250ZXh0LCBzaW5nbGVJbmRleCk7XG5cbiAgLy8gZGlkbid0IGNoYW5nZSAuLi4gbm90aGluZyB0byBtYWtlIGEgbm90ZSBvZlxuICBpZiAoY3VyclZhbHVlICE9PSB2YWx1ZSkge1xuICAgIC8vIHRoZSB2YWx1ZSB3aWxsIGFsd2F5cyBnZXQgdXBkYXRlZCAoZXZlbiBpZiB0aGUgZGlydHkgZmxhZyBpcyBza2lwcGVkKVxuICAgIHNldFZhbHVlKGNvbnRleHQsIHNpbmdsZUluZGV4LCB2YWx1ZSk7XG4gICAgY29uc3QgaW5kZXhGb3JNdWx0aSA9IGdldE11bHRpT3JTaW5nbGVJbmRleChjdXJyRmxhZyk7XG5cbiAgICAvLyBpZiB0aGUgdmFsdWUgaXMgdGhlIHNhbWUgaW4gdGhlIG11bHRpLWFyZWEgdGhlbiB0aGVyZSdzIG5vIHBvaW50IGluIHJlLWFzc2VtYmxpbmdcbiAgICBjb25zdCB2YWx1ZUZvck11bHRpID0gZ2V0VmFsdWUoY29udGV4dCwgaW5kZXhGb3JNdWx0aSk7XG4gICAgaWYgKCF2YWx1ZUZvck11bHRpIHx8IHZhbHVlRm9yTXVsdGkgIT09IHZhbHVlKSB7XG4gICAgICBsZXQgbXVsdGlEaXJ0eSA9IGZhbHNlO1xuICAgICAgbGV0IHNpbmdsZURpcnR5ID0gdHJ1ZTtcblxuICAgICAgLy8gb25seSB3aGVuIHRoZSB2YWx1ZSBpcyBzZXQgdG8gYG51bGxgIHNob3VsZCB0aGUgbXVsdGktdmFsdWUgZ2V0IGZsYWdnZWRcbiAgICAgIGlmICh2YWx1ZSA9PSBudWxsICYmIHZhbHVlRm9yTXVsdGkpIHtcbiAgICAgICAgbXVsdGlEaXJ0eSA9IHRydWU7XG4gICAgICAgIHNpbmdsZURpcnR5ID0gZmFsc2U7XG4gICAgICB9XG5cbiAgICAgIHNldERpcnR5KGNvbnRleHQsIGluZGV4Rm9yTXVsdGksIG11bHRpRGlydHkpO1xuICAgICAgc2V0RGlydHkoY29udGV4dCwgc2luZ2xlSW5kZXgsIHNpbmdsZURpcnR5KTtcbiAgICAgIHNldENvbnRleHREaXJ0eShjb250ZXh0LCB0cnVlKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBSZW5kZXJzIGFsbCBxdWV1ZWQgc3R5bGVzIHVzaW5nIGEgcmVuZGVyZXIgb250byB0aGUgZ2l2ZW4gZWxlbWVudC5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIHdvcmtzIGJ5IHJlbmRlcmluZyBhbnkgc3R5bGVzICh0aGF0IGhhdmUgYmVlbiBhcHBsaWVkXG4gKiB1c2luZyBgdXBkYXRlU3R5bGVNYXBgIGFuZCBgdXBkYXRlU3R5bGVQcm9wYCkgb250byB0aGVcbiAqIHByb3ZpZGVkIGVsZW1lbnQgdXNpbmcgdGhlIHByb3ZpZGVkIHJlbmRlcmVyLiBKdXN0IGJlZm9yZSB0aGUgc3R5bGVzXG4gKiBhcmUgcmVuZGVyZWQgYSBmaW5hbCBrZXkvdmFsdWUgc3R5bGUgbWFwIHdpbGwgYmUgYXNzZW1ibGVkLlxuICpcbiAqIEBwYXJhbSBsRWxlbWVudCB0aGUgZWxlbWVudCB0aGF0IHRoZSBzdHlsZXMgd2lsbCBiZSByZW5kZXJlZCBvblxuICogQHBhcmFtIGNvbnRleHQgVGhlIHN0eWxpbmcgY29udGV4dCB0aGF0IHdpbGwgYmUgdXNlZCB0byBkZXRlcm1pbmVcbiAqICAgICAgd2hhdCBzdHlsZXMgd2lsbCBiZSByZW5kZXJlZFxuICogQHBhcmFtIHJlbmRlcmVyIHRoZSByZW5kZXJlciB0aGF0IHdpbGwgYmUgdXNlZCB0byBhcHBseSB0aGUgc3R5bGluZ1xuICogQHBhcmFtIHN0eWxlU3RvcmUgaWYgcHJvdmlkZWQsIHRoZSB1cGRhdGVkIHN0eWxlIHZhbHVlcyB3aWxsIGJlIGFwcGxpZWRcbiAqICAgIHRvIHRoaXMga2V5L3ZhbHVlIG1hcCBpbnN0ZWFkIG9mIGJlaW5nIHJlbmRlcmVyZWQgdmlhIHRoZSByZW5kZXJlci5cbiAqIEByZXR1cm5zIGFuIG9iamVjdCBsaXRlcmFsLiBgeyBjb2xvcjogJ3JlZCcsIGhlaWdodDogJ2F1dG8nfWAuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZW5kZXJTdHlsZXMoXG4gICAgbEVsZW1lbnQ6IExFbGVtZW50Tm9kZSwgY29udGV4dDogU3R5bGluZ0NvbnRleHQsIHJlbmRlcmVyOiBSZW5kZXJlcjMsXG4gICAgc3R5bGVTdG9yZT86IHtba2V5OiBzdHJpbmddOiBhbnl9KSB7XG4gIGlmIChpc0NvbnRleHREaXJ0eShjb250ZXh0KSkge1xuICAgIGNvbnN0IG5hdGl2ZSA9IGxFbGVtZW50Lm5hdGl2ZTtcbiAgICBjb25zdCBtdWx0aVN0YXJ0SW5kZXggPSBnZXRNdWx0aVN0YXJ0SW5kZXgoY29udGV4dCk7XG4gICAgZm9yIChsZXQgaSA9IFN0eWxpbmdJbmRleC5TaW5nbGVTdHlsZXNTdGFydFBvc2l0aW9uOyBpIDwgY29udGV4dC5sZW5ndGg7XG4gICAgICAgICBpICs9IFN0eWxpbmdJbmRleC5TaXplKSB7XG4gICAgICAvLyB0aGVyZSBpcyBubyBwb2ludCBpbiByZW5kZXJpbmcgc3R5bGVzIHRoYXQgaGF2ZSBub3QgY2hhbmdlZCBvbiBzY3JlZW5cbiAgICAgIGlmIChpc0RpcnR5KGNvbnRleHQsIGkpKSB7XG4gICAgICAgIGNvbnN0IHByb3AgPSBnZXRQcm9wKGNvbnRleHQsIGkpO1xuICAgICAgICBjb25zdCB2YWx1ZSA9IGdldFZhbHVlKGNvbnRleHQsIGkpO1xuICAgICAgICBjb25zdCBmbGFnID0gZ2V0UG9pbnRlcnMoY29udGV4dCwgaSk7XG4gICAgICAgIGNvbnN0IGlzSW5TaW5nbGVSZWdpb24gPSBpIDwgbXVsdGlTdGFydEluZGV4O1xuXG4gICAgICAgIGxldCBzdHlsZVRvQXBwbHk6IHN0cmluZ3xudWxsID0gdmFsdWU7XG5cbiAgICAgICAgLy8gU1RZTEUgREVGRVIgQ0FTRSAxOiBVc2UgYSBtdWx0aSB2YWx1ZSBpbnN0ZWFkIG9mIGEgbnVsbCBzaW5nbGUgdmFsdWVcbiAgICAgICAgLy8gdGhpcyBjaGVjayBpbXBsaWVzIHRoYXQgYSBzaW5nbGUgdmFsdWUgd2FzIHJlbW92ZWQgYW5kIHdlXG4gICAgICAgIC8vIHNob3VsZCBub3cgZGVmZXIgdG8gYSBtdWx0aSB2YWx1ZSBhbmQgdXNlIHRoYXQgKGlmIHNldCkuXG4gICAgICAgIGlmIChpc0luU2luZ2xlUmVnaW9uICYmIHN0eWxlVG9BcHBseSA9PSBudWxsKSB7XG4gICAgICAgICAgLy8gc2luZ2xlIHZhbHVlcyBBTFdBWVMgaGF2ZSBhIHJlZmVyZW5jZSB0byBhIG11bHRpIGluZGV4XG4gICAgICAgICAgY29uc3QgbXVsdGlJbmRleCA9IGdldE11bHRpT3JTaW5nbGVJbmRleChmbGFnKTtcbiAgICAgICAgICBzdHlsZVRvQXBwbHkgPSBnZXRWYWx1ZShjb250ZXh0LCBtdWx0aUluZGV4KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFNUWUxFIERFRkVSIENBU0UgMjogVXNlIHRoZSBpbml0aWFsIHZhbHVlIGlmIGFsbCBlbHNlIGZhaWxzIChpcyBudWxsKVxuICAgICAgICAvLyB0aGUgaW5pdGlhbCB2YWx1ZSB3aWxsIGFsd2F5cyBiZSBhIHN0cmluZyBvciBudWxsLFxuICAgICAgICAvLyB0aGVyZWZvcmUgd2UgY2FuIHNhZmVseSBhZG9wdCBpdCBpbmNhc2UgdGhlcmUncyBub3RoaW5nIGVsc2VcbiAgICAgICAgaWYgKHN0eWxlVG9BcHBseSA9PSBudWxsKSB7XG4gICAgICAgICAgc3R5bGVUb0FwcGx5ID0gZ2V0SW5pdGlhbFZhbHVlKGNvbnRleHQsIGZsYWcpO1xuICAgICAgICB9XG5cbiAgICAgICAgc2V0U3R5bGUobmF0aXZlLCBwcm9wLCBzdHlsZVRvQXBwbHksIHJlbmRlcmVyLCBzdHlsZVN0b3JlKTtcbiAgICAgICAgc2V0RGlydHkoY29udGV4dCwgaSwgZmFsc2UpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHNldENvbnRleHREaXJ0eShjb250ZXh0LCBmYWxzZSk7XG4gIH1cbn1cblxuLyoqXG4gKiBUaGlzIGZ1bmN0aW9uIHJlbmRlcnMgYSBnaXZlbiBDU1MgcHJvcC92YWx1ZSBlbnRyeSB1c2luZyB0aGVcbiAqIHByb3ZpZGVkIHJlbmRlcmVyLiBJZiBhIGBzdHlsZVN0b3JlYCB2YWx1ZSBpcyBwcm92aWRlZCB0aGVuXG4gKiB0aGF0IHdpbGwgYmUgdXNlZCBhIHJlbmRlciBjb250ZXh0IGluc3RlYWQgb2YgdGhlIHByb3ZpZGVkXG4gKiByZW5kZXJlci5cbiAqXG4gKiBAcGFyYW0gbmF0aXZlIHRoZSBET00gRWxlbWVudFxuICogQHBhcmFtIHByb3AgdGhlIENTUyBzdHlsZSBwcm9wZXJ0eSB0aGF0IHdpbGwgYmUgcmVuZGVyZWRcbiAqIEBwYXJhbSB2YWx1ZSB0aGUgQ1NTIHN0eWxlIHZhbHVlIHRoYXQgd2lsbCBiZSByZW5kZXJlZFxuICogQHBhcmFtIHJlbmRlcmVyXG4gKiBAcGFyYW0gc3R5bGVTdG9yZSBhbiBvcHRpb25hbCBrZXkvdmFsdWUgbWFwIHRoYXQgd2lsbCBiZSB1c2VkIGFzIGEgY29udGV4dCB0byByZW5kZXIgc3R5bGVzIG9uXG4gKi9cbmZ1bmN0aW9uIHNldFN0eWxlKFxuICAgIG5hdGl2ZTogYW55LCBwcm9wOiBzdHJpbmcsIHZhbHVlOiBzdHJpbmcgfCBudWxsLCByZW5kZXJlcjogUmVuZGVyZXIzLFxuICAgIHN0eWxlU3RvcmU/OiB7W2tleTogc3RyaW5nXTogYW55fSkge1xuICBpZiAoc3R5bGVTdG9yZSkge1xuICAgIHN0eWxlU3RvcmVbcHJvcF0gPSB2YWx1ZTtcbiAgfSBlbHNlIGlmICh2YWx1ZSA9PSBudWxsKSB7XG4gICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlclJlbW92ZVN0eWxlKys7XG4gICAgaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpID9cbiAgICAgICAgcmVuZGVyZXIucmVtb3ZlU3R5bGUobmF0aXZlLCBwcm9wLCBSZW5kZXJlclN0eWxlRmxhZ3MzLkRhc2hDYXNlKSA6XG4gICAgICAgIG5hdGl2ZVsnc3R5bGUnXS5yZW1vdmVQcm9wZXJ0eShwcm9wKTtcbiAgfSBlbHNlIHtcbiAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyU2V0U3R5bGUrKztcbiAgICBpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikgP1xuICAgICAgICByZW5kZXJlci5zZXRTdHlsZShuYXRpdmUsIHByb3AsIHZhbHVlLCBSZW5kZXJlclN0eWxlRmxhZ3MzLkRhc2hDYXNlKSA6XG4gICAgICAgIG5hdGl2ZVsnc3R5bGUnXS5zZXRQcm9wZXJ0eShwcm9wLCB2YWx1ZSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gc2V0RGlydHkoY29udGV4dDogU3R5bGluZ0NvbnRleHQsIGluZGV4OiBudW1iZXIsIGlzRGlydHlZZXM6IGJvb2xlYW4pIHtcbiAgY29uc3QgYWRqdXN0ZWRJbmRleCA9XG4gICAgICBpbmRleCA+PSBTdHlsaW5nSW5kZXguU2luZ2xlU3R5bGVzU3RhcnRQb3NpdGlvbiA/IChpbmRleCArIFN0eWxpbmdJbmRleC5GbGFnc09mZnNldCkgOiBpbmRleDtcbiAgaWYgKGlzRGlydHlZZXMpIHtcbiAgICAoY29udGV4dFthZGp1c3RlZEluZGV4XSBhcyBudW1iZXIpIHw9IFN0eWxpbmdGbGFncy5EaXJ0eTtcbiAgfSBlbHNlIHtcbiAgICAoY29udGV4dFthZGp1c3RlZEluZGV4XSBhcyBudW1iZXIpICY9IH5TdHlsaW5nRmxhZ3MuRGlydHk7XG4gIH1cbn1cblxuZnVuY3Rpb24gaXNEaXJ0eShjb250ZXh0OiBTdHlsaW5nQ29udGV4dCwgaW5kZXg6IG51bWJlcik6IGJvb2xlYW4ge1xuICBjb25zdCBhZGp1c3RlZEluZGV4ID1cbiAgICAgIGluZGV4ID49IFN0eWxpbmdJbmRleC5TaW5nbGVTdHlsZXNTdGFydFBvc2l0aW9uID8gKGluZGV4ICsgU3R5bGluZ0luZGV4LkZsYWdzT2Zmc2V0KSA6IGluZGV4O1xuICByZXR1cm4gKChjb250ZXh0W2FkanVzdGVkSW5kZXhdIGFzIG51bWJlcikgJiBTdHlsaW5nRmxhZ3MuRGlydHkpID09IFN0eWxpbmdGbGFncy5EaXJ0eTtcbn1cblxuZnVuY3Rpb24gcG9pbnRlcnMoY29uZmlnRmxhZzogbnVtYmVyLCBzdGF0aWNJbmRleDogbnVtYmVyLCBkeW5hbWljSW5kZXg6IG51bWJlcikge1xuICByZXR1cm4gKGNvbmZpZ0ZsYWcgJiBTdHlsaW5nRmxhZ3MuRGlydHkpIHwgKHN0YXRpY0luZGV4IDw8IFN0eWxpbmdGbGFncy5CaXRDb3VudFNpemUpIHxcbiAgICAgIChkeW5hbWljSW5kZXggPDwgKFN0eWxpbmdJbmRleC5CaXRDb3VudFNpemUgKyBTdHlsaW5nRmxhZ3MuQml0Q291bnRTaXplKSk7XG59XG5cbmZ1bmN0aW9uIGdldEluaXRpYWxWYWx1ZShjb250ZXh0OiBTdHlsaW5nQ29udGV4dCwgZmxhZzogbnVtYmVyKTogc3RyaW5nfG51bGwge1xuICBjb25zdCBpbmRleCA9IGdldEluaXRpYWxJbmRleChmbGFnKTtcbiAgcmV0dXJuIGNvbnRleHRbU3R5bGluZ0luZGV4LkluaXRpYWxTdHlsZXNQb3NpdGlvbl1baW5kZXhdIGFzIG51bGwgfCBzdHJpbmc7XG59XG5cbmZ1bmN0aW9uIGdldEluaXRpYWxJbmRleChmbGFnOiBudW1iZXIpOiBudW1iZXIge1xuICByZXR1cm4gKGZsYWcgPj4gU3R5bGluZ0ZsYWdzLkJpdENvdW50U2l6ZSkgJiBTdHlsaW5nSW5kZXguQml0TWFzaztcbn1cblxuZnVuY3Rpb24gZ2V0TXVsdGlPclNpbmdsZUluZGV4KGZsYWc6IG51bWJlcik6IG51bWJlciB7XG4gIGNvbnN0IGluZGV4ID1cbiAgICAgIChmbGFnID4+IChTdHlsaW5nSW5kZXguQml0Q291bnRTaXplICsgU3R5bGluZ0ZsYWdzLkJpdENvdW50U2l6ZSkpICYgU3R5bGluZ0luZGV4LkJpdE1hc2s7XG4gIHJldHVybiBpbmRleCA+PSBTdHlsaW5nSW5kZXguU2luZ2xlU3R5bGVzU3RhcnRQb3NpdGlvbiA/IGluZGV4IDogLTE7XG59XG5cbmZ1bmN0aW9uIGdldE11bHRpU3RhcnRJbmRleChjb250ZXh0OiBTdHlsaW5nQ29udGV4dCk6IG51bWJlciB7XG4gIHJldHVybiBnZXRNdWx0aU9yU2luZ2xlSW5kZXgoY29udGV4dFtTdHlsaW5nSW5kZXguTWFzdGVyRmxhZ1Bvc2l0aW9uXSkgYXMgbnVtYmVyO1xufVxuXG5mdW5jdGlvbiBzZXRQcm9wKGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0LCBpbmRleDogbnVtYmVyLCBwcm9wOiBzdHJpbmcpIHtcbiAgY29udGV4dFtpbmRleCArIFN0eWxpbmdJbmRleC5Qcm9wZXJ0eU9mZnNldF0gPSBwcm9wO1xufVxuXG5mdW5jdGlvbiBzZXRWYWx1ZShjb250ZXh0OiBTdHlsaW5nQ29udGV4dCwgaW5kZXg6IG51bWJlciwgdmFsdWU6IHN0cmluZyB8IG51bGwpIHtcbiAgY29udGV4dFtpbmRleCArIFN0eWxpbmdJbmRleC5WYWx1ZU9mZnNldF0gPSB2YWx1ZTtcbn1cblxuZnVuY3Rpb24gc2V0RmxhZyhjb250ZXh0OiBTdHlsaW5nQ29udGV4dCwgaW5kZXg6IG51bWJlciwgZmxhZzogbnVtYmVyKSB7XG4gIGNvbnN0IGFkanVzdGVkSW5kZXggPVxuICAgICAgaW5kZXggPT09IFN0eWxpbmdJbmRleC5NYXN0ZXJGbGFnUG9zaXRpb24gPyBpbmRleCA6IChpbmRleCArIFN0eWxpbmdJbmRleC5GbGFnc09mZnNldCk7XG4gIGNvbnRleHRbYWRqdXN0ZWRJbmRleF0gPSBmbGFnO1xufVxuXG5mdW5jdGlvbiBnZXRQb2ludGVycyhjb250ZXh0OiBTdHlsaW5nQ29udGV4dCwgaW5kZXg6IG51bWJlcik6IG51bWJlciB7XG4gIGNvbnN0IGFkanVzdGVkSW5kZXggPVxuICAgICAgaW5kZXggPT09IFN0eWxpbmdJbmRleC5NYXN0ZXJGbGFnUG9zaXRpb24gPyBpbmRleCA6IChpbmRleCArIFN0eWxpbmdJbmRleC5GbGFnc09mZnNldCk7XG4gIHJldHVybiBjb250ZXh0W2FkanVzdGVkSW5kZXhdIGFzIG51bWJlcjtcbn1cblxuZnVuY3Rpb24gZ2V0VmFsdWUoY29udGV4dDogU3R5bGluZ0NvbnRleHQsIGluZGV4OiBudW1iZXIpOiBzdHJpbmd8bnVsbCB7XG4gIHJldHVybiBjb250ZXh0W2luZGV4ICsgU3R5bGluZ0luZGV4LlZhbHVlT2Zmc2V0XSBhcyBzdHJpbmcgfCBudWxsO1xufVxuXG5mdW5jdGlvbiBnZXRQcm9wKGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0LCBpbmRleDogbnVtYmVyKTogc3RyaW5nIHtcbiAgcmV0dXJuIGNvbnRleHRbaW5kZXggKyBTdHlsaW5nSW5kZXguUHJvcGVydHlPZmZzZXRdIGFzIHN0cmluZztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzQ29udGV4dERpcnR5KGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0KTogYm9vbGVhbiB7XG4gIHJldHVybiBpc0RpcnR5KGNvbnRleHQsIFN0eWxpbmdJbmRleC5NYXN0ZXJGbGFnUG9zaXRpb24pO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2V0Q29udGV4dERpcnR5KGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0LCBpc0RpcnR5WWVzOiBib29sZWFuKTogdm9pZCB7XG4gIHNldERpcnR5KGNvbnRleHQsIFN0eWxpbmdJbmRleC5NYXN0ZXJGbGFnUG9zaXRpb24sIGlzRGlydHlZZXMpO1xufVxuXG5mdW5jdGlvbiBmaW5kRW50cnlQb3NpdGlvbkJ5UHJvcChcbiAgICBjb250ZXh0OiBTdHlsaW5nQ29udGV4dCwgcHJvcDogc3RyaW5nLCBzdGFydEluZGV4PzogbnVtYmVyKTogbnVtYmVyIHtcbiAgZm9yIChsZXQgaSA9IChzdGFydEluZGV4IHx8IDApICsgU3R5bGluZ0luZGV4LlByb3BlcnR5T2Zmc2V0OyBpIDwgY29udGV4dC5sZW5ndGg7XG4gICAgICAgaSArPSBTdHlsaW5nSW5kZXguU2l6ZSkge1xuICAgIGNvbnN0IHRoaXNQcm9wID0gY29udGV4dFtpXTtcbiAgICBpZiAodGhpc1Byb3AgPT0gcHJvcCkge1xuICAgICAgcmV0dXJuIGkgLSBTdHlsaW5nSW5kZXguUHJvcGVydHlPZmZzZXQ7XG4gICAgfVxuICB9XG4gIHJldHVybiAtMTtcbn1cblxuZnVuY3Rpb24gc3dhcE11bHRpQ29udGV4dEVudHJpZXMoY29udGV4dDogU3R5bGluZ0NvbnRleHQsIGluZGV4QTogbnVtYmVyLCBpbmRleEI6IG51bWJlcikge1xuICBjb25zdCB0bXBWYWx1ZSA9IGdldFZhbHVlKGNvbnRleHQsIGluZGV4QSk7XG4gIGNvbnN0IHRtcFByb3AgPSBnZXRQcm9wKGNvbnRleHQsIGluZGV4QSk7XG4gIGNvbnN0IHRtcEZsYWcgPSBnZXRQb2ludGVycyhjb250ZXh0LCBpbmRleEEpO1xuXG4gIGxldCBmbGFnQSA9IHRtcEZsYWc7XG4gIGxldCBmbGFnQiA9IGdldFBvaW50ZXJzKGNvbnRleHQsIGluZGV4Qik7XG5cbiAgY29uc3Qgc2luZ2xlSW5kZXhBID0gZ2V0TXVsdGlPclNpbmdsZUluZGV4KGZsYWdBKTtcbiAgaWYgKHNpbmdsZUluZGV4QSA+PSAwKSB7XG4gICAgY29uc3QgX2ZsYWcgPSBnZXRQb2ludGVycyhjb250ZXh0LCBzaW5nbGVJbmRleEEpO1xuICAgIGNvbnN0IF9pbml0aWFsID0gZ2V0SW5pdGlhbEluZGV4KF9mbGFnKTtcbiAgICBzZXRGbGFnKGNvbnRleHQsIHNpbmdsZUluZGV4QSwgcG9pbnRlcnMoX2ZsYWcsIF9pbml0aWFsLCBpbmRleEIpKTtcbiAgfVxuXG4gIGNvbnN0IHNpbmdsZUluZGV4QiA9IGdldE11bHRpT3JTaW5nbGVJbmRleChmbGFnQik7XG4gIGlmIChzaW5nbGVJbmRleEIgPj0gMCkge1xuICAgIGNvbnN0IF9mbGFnID0gZ2V0UG9pbnRlcnMoY29udGV4dCwgc2luZ2xlSW5kZXhCKTtcbiAgICBjb25zdCBfaW5pdGlhbCA9IGdldEluaXRpYWxJbmRleChfZmxhZyk7XG4gICAgc2V0RmxhZyhjb250ZXh0LCBzaW5nbGVJbmRleEIsIHBvaW50ZXJzKF9mbGFnLCBfaW5pdGlhbCwgaW5kZXhBKSk7XG4gIH1cblxuICBzZXRWYWx1ZShjb250ZXh0LCBpbmRleEEsIGdldFZhbHVlKGNvbnRleHQsIGluZGV4QikpO1xuICBzZXRQcm9wKGNvbnRleHQsIGluZGV4QSwgZ2V0UHJvcChjb250ZXh0LCBpbmRleEIpKTtcbiAgc2V0RmxhZyhjb250ZXh0LCBpbmRleEEsIGdldFBvaW50ZXJzKGNvbnRleHQsIGluZGV4QikpO1xuXG4gIHNldFZhbHVlKGNvbnRleHQsIGluZGV4QiwgdG1wVmFsdWUpO1xuICBzZXRQcm9wKGNvbnRleHQsIGluZGV4QiwgdG1wUHJvcCk7XG4gIHNldEZsYWcoY29udGV4dCwgaW5kZXhCLCB0bXBGbGFnKTtcbn1cblxuZnVuY3Rpb24gdXBkYXRlU2luZ2xlUG9pbnRlclZhbHVlcyhjb250ZXh0OiBTdHlsaW5nQ29udGV4dCwgaW5kZXhTdGFydFBvc2l0aW9uOiBudW1iZXIpIHtcbiAgZm9yIChsZXQgaSA9IGluZGV4U3RhcnRQb3NpdGlvbjsgaSA8IGNvbnRleHQubGVuZ3RoOyBpICs9IFN0eWxpbmdJbmRleC5TaXplKSB7XG4gICAgY29uc3QgbXVsdGlGbGFnID0gZ2V0UG9pbnRlcnMoY29udGV4dCwgaSk7XG4gICAgY29uc3Qgc2luZ2xlSW5kZXggPSBnZXRNdWx0aU9yU2luZ2xlSW5kZXgobXVsdGlGbGFnKTtcbiAgICBpZiAoc2luZ2xlSW5kZXggPiAwKSB7XG4gICAgICBjb25zdCBzaW5nbGVGbGFnID0gZ2V0UG9pbnRlcnMoY29udGV4dCwgc2luZ2xlSW5kZXgpO1xuICAgICAgY29uc3QgaW5pdGlhbEluZGV4Rm9yU2luZ2xlID0gZ2V0SW5pdGlhbEluZGV4KHNpbmdsZUZsYWcpO1xuICAgICAgY29uc3QgdXBkYXRlZEZsYWcgPSBwb2ludGVycyhcbiAgICAgICAgICBpc0RpcnR5KGNvbnRleHQsIHNpbmdsZUluZGV4KSA/IFN0eWxpbmdGbGFncy5EaXJ0eSA6IFN0eWxpbmdGbGFncy5Ob25lLFxuICAgICAgICAgIGluaXRpYWxJbmRleEZvclNpbmdsZSwgaSk7XG4gICAgICBzZXRGbGFnKGNvbnRleHQsIHNpbmdsZUluZGV4LCB1cGRhdGVkRmxhZyk7XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIGluc2VydE5ld011bHRpUHJvcGVydHkoXG4gICAgY29udGV4dDogU3R5bGluZ0NvbnRleHQsIGluZGV4OiBudW1iZXIsIG5hbWU6IHN0cmluZywgdmFsdWU6IHN0cmluZyk6IHZvaWQge1xuICBjb25zdCBkb1NoaWZ0ID0gaW5kZXggPCBjb250ZXh0Lmxlbmd0aDtcblxuICAvLyBwcm9wIGRvZXMgbm90IGV4aXN0IGluIHRoZSBsaXN0LCBhZGQgaXQgaW5cbiAgY29udGV4dC5zcGxpY2UoaW5kZXgsIDAsIFN0eWxpbmdGbGFncy5EaXJ0eSwgbmFtZSwgdmFsdWUpO1xuXG4gIGlmIChkb1NoaWZ0KSB7XG4gICAgLy8gYmVjYXVzZSB0aGUgdmFsdWUgd2FzIGluc2VydGVkIG1pZHdheSBpbnRvIHRoZSBhcnJheSB0aGVuIHdlXG4gICAgLy8gbmVlZCB0byB1cGRhdGUgYWxsIHRoZSBzaGlmdGVkIG11bHRpIHZhbHVlcycgc2luZ2xlIHZhbHVlXG4gICAgLy8gcG9pbnRlcnMgdG8gcG9pbnQgdG8gdGhlIG5ld2x5IHNoaWZ0ZWQgbG9jYXRpb25cbiAgICB1cGRhdGVTaW5nbGVQb2ludGVyVmFsdWVzKGNvbnRleHQsIGluZGV4ICsgU3R5bGluZ0luZGV4LlNpemUpO1xuICB9XG59XG4iXX0=