/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
import { NO_CHANGE } from '../tokens';
/** @type {?} */
export const MAP_BASED_ENTRY_PROP_NAME = '[MAP]';
/** @type {?} */
export const TEMPLATE_DIRECTIVE_INDEX = 0;
/**
 * Default fallback value for a styling binding.
 *
 * A value of `null` is used here which signals to the styling algorithm that
 * the styling value is not present. This way if there are no other values
 * detected then it will be removed once the style/class property is dirty and
 * diffed within the styling algorithm present in `flushStyling`.
 * @type {?}
 */
export const DEFAULT_BINDING_VALUE = null;
/** @type {?} */
export const DEFAULT_BINDING_INDEX = 0;
/** @type {?} */
const DEFAULT_TOTAL_SOURCES = 1;
// The first bit value reflects a map-based binding value's bit.
// The reason why it's always activated for every entry in the map
// is so that if any map-binding values update then all other prop
// based bindings will pass the guard check automatically without
// any extra code or flags.
/** @type {?} */
export const DEFAULT_GUARD_MASK_VALUE = 0b1;
/**
 * Creates a new instance of the `TStylingContext`.
 *
 * The `TStylingContext` is used as a manifest of all style or all class bindings on
 * an element. Because it is a T-level data-structure, it is only created once per
 * tNode for styles and for classes. This function allocates a new instance of a
 * `TStylingContext` with the initial values (see `interfaces.ts` for more info).
 * @param {?} initialStyling
 * @param {?} hasDirectives
 * @return {?}
 */
export function allocTStylingContext(initialStyling, hasDirectives) {
    initialStyling = initialStyling || allocStylingMapArray(null);
    /** @type {?} */
    let config = 0 /* Initial */;
    if (hasDirectives) {
        config |= 1 /* HasDirectives */;
    }
    if (initialStyling.length > 1 /* ValuesStartPosition */) {
        config |= 16 /* HasInitialStyling */;
    }
    return [
        config,
        DEFAULT_TOTAL_SOURCES,
        initialStyling,
    ];
}
/**
 * @param {?} value
 * @return {?}
 */
export function allocStylingMapArray(value) {
    return [value];
}
/**
 * @param {?} context
 * @return {?}
 */
export function getConfig(context) {
    return context[0 /* ConfigPosition */];
}
/**
 * @param {?} context
 * @param {?} flag
 * @return {?}
 */
export function hasConfig(context, flag) {
    return (getConfig(context) & flag) !== 0;
}
/**
 * Determines whether or not to apply styles/classes directly or via context resolution.
 *
 * There are three cases that are matched here:
 * 1. there are no directives present AND `ngDevMode` is falsy
 * 2. the `firstUpdatePass` has not already run (which means that
 *    there are more bindings to register and, therefore, direct
 *    style/class application is not yet possible)
 * 3. There are no collisions (i.e. properties with more than one binding) across multiple
 *    sources (i.e. template + directive, directive + directive, directive + component)
 * @param {?} context
 * @param {?} firstUpdatePass
 * @return {?}
 */
export function allowDirectStyling(context, firstUpdatePass) {
    /** @type {?} */
    let allow = false;
    /** @type {?} */
    const config = getConfig(context);
    /** @type {?} */
    const hasNoDirectives = (config & 1 /* HasDirectives */) === 0;
    // if no directives are present then we do not need populate a context at all. This
    // is because duplicate prop bindings cannot be registered through the template. If
    // and when this happens we can safely apply the value directly without context
    // resolution...
    if (hasNoDirectives) {
        // `ngDevMode` is required to be checked here because tests/debugging rely on the context being
        // populated. If things are in production mode then there is no need to build a context
        // therefore the direct apply can be allowed (even on the first update).
        allow = ngDevMode ? !firstUpdatePass : true;
    }
    else if (!firstUpdatePass) {
        /** @type {?} */
        const hasNoCollisions = (config & 8 /* HasCollisions */) === 0;
        /** @type {?} */
        const hasOnlyMapsOrOnlyProps = (config & 6 /* HasPropAndMapBindings */) !== 6 /* HasPropAndMapBindings */;
        allow = hasNoCollisions && hasOnlyMapsOrOnlyProps;
    }
    return allow;
}
/**
 * @param {?} context
 * @param {?} value
 * @return {?}
 */
export function setConfig(context, value) {
    context[0 /* ConfigPosition */] = value;
}
/**
 * @param {?} context
 * @param {?} flag
 * @return {?}
 */
export function patchConfig(context, flag) {
    context[0 /* ConfigPosition */] |= flag;
}
/**
 * @param {?} context
 * @param {?} index
 * @return {?}
 */
export function getProp(context, index) {
    return (/** @type {?} */ (context[index + 3 /* PropOffset */]));
}
/**
 * @param {?} context
 * @param {?} index
 * @return {?}
 */
function getPropConfig(context, index) {
    return ((/** @type {?} */ (context[index + 0 /* ConfigOffset */]))) &
        1 /* Mask */;
}
/**
 * @param {?} context
 * @param {?} index
 * @return {?}
 */
export function isSanitizationRequired(context, index) {
    return (getPropConfig(context, index) & 1 /* SanitizationRequired */) !==
        0;
}
/**
 * @param {?} context
 * @param {?} index
 * @param {?} isHostBinding
 * @return {?}
 */
export function getGuardMask(context, index, isHostBinding) {
    /** @type {?} */
    const position = index + (isHostBinding ? 2 /* HostBindingsBitGuardOffset */ :
        1 /* TemplateBitGuardOffset */);
    return (/** @type {?} */ (context[position]));
}
/**
 * @param {?} context
 * @param {?} index
 * @param {?} maskValue
 * @param {?} isHostBinding
 * @return {?}
 */
export function setGuardMask(context, index, maskValue, isHostBinding) {
    /** @type {?} */
    const position = index + (isHostBinding ? 2 /* HostBindingsBitGuardOffset */ :
        1 /* TemplateBitGuardOffset */);
    context[position] = maskValue;
}
/**
 * @param {?} context
 * @return {?}
 */
export function getValuesCount(context) {
    return getTotalSources(context) + 1;
}
/**
 * @param {?} context
 * @return {?}
 */
export function getTotalSources(context) {
    return context[1 /* TotalSourcesPosition */];
}
/**
 * @param {?} context
 * @param {?} index
 * @param {?} offset
 * @return {?}
 */
export function getBindingValue(context, index, offset) {
    return (/** @type {?} */ (context[index + 4 /* BindingsStartOffset */ + offset]));
}
/**
 * @param {?} context
 * @param {?} index
 * @return {?}
 */
export function getDefaultValue(context, index) {
    return (/** @type {?} */ (context[index + 4 /* BindingsStartOffset */ + getTotalSources(context)]));
}
/**
 * @param {?} context
 * @param {?} index
 * @param {?} value
 * @return {?}
 */
export function setDefaultValue(context, index, value) {
    return context[index + 4 /* BindingsStartOffset */ + getTotalSources(context)] =
        value;
}
/**
 * @param {?} data
 * @param {?} bindingIndex
 * @param {?} value
 * @return {?}
 */
export function setValue(data, bindingIndex, value) {
    data[bindingIndex] = value;
}
/**
 * @template T
 * @param {?} data
 * @param {?} bindingIndex
 * @return {?}
 */
export function getValue(data, bindingIndex) {
    return bindingIndex !== 0 ? (/** @type {?} */ (data[bindingIndex])) : null;
}
/**
 * @param {?} context
 * @return {?}
 */
export function getPropValuesStartPosition(context) {
    /** @type {?} */
    let startPosition = 3 /* ValuesStartPosition */;
    if (hasConfig(context, 4 /* HasMapBindings */)) {
        startPosition += 4 /* BindingsStartOffset */ + getValuesCount(context);
    }
    return startPosition;
}
/**
 * @param {?} a
 * @param {?} b
 * @return {?}
 */
export function hasValueChanged(a, b) {
    if (b === NO_CHANGE)
        return false;
    /** @type {?} */
    const compareValueA = Array.isArray(a) ? a[0 /* RawValuePosition */] : a;
    /** @type {?} */
    const compareValueB = Array.isArray(b) ? b[0 /* RawValuePosition */] : b;
    return !Object.is(compareValueA, compareValueB);
}
/**
 * Determines whether the provided styling value is truthy or falsy.
 * @template T
 * @param {?} value
 * @return {?}
 */
export function isStylingValueDefined(value) {
    // the reason why null is compared against is because
    // a CSS class value that is set to `false` must be
    // respected (otherwise it would be treated as falsy).
    // Empty string values are because developers usually
    // set a value to an empty string to remove it.
    return value != null && value !== '';
}
/**
 * @param {?} a
 * @param {?} b
 * @param {?=} separator
 * @return {?}
 */
export function concatString(a, b, separator = ' ') {
    return a + ((b.length && a.length) ? separator : '') + b;
}
/**
 * @param {?} value
 * @return {?}
 */
export function hyphenate(value) {
    return value.replace(/[a-z][A-Z]/g, (/**
     * @param {?} v
     * @return {?}
     */
    v => v.charAt(0) + '-' + v.charAt(1))).toLowerCase();
}
/**
 * Returns an instance of `StylingMapArray`.
 *
 * This function is designed to find an instance of `StylingMapArray` in case it is stored
 * inside of an instance of `TStylingContext`. When a styling context is created it
 * will copy over an initial styling values from the tNode (which are stored as a
 * `StylingMapArray` on the `tNode.classes` or `tNode.styles` values).
 * @param {?} value
 * @return {?}
 */
export function getStylingMapArray(value) {
    return isStylingContext(value) ?
        ((/** @type {?} */ (value)))[2 /* InitialStylingValuePosition */] :
        (/** @type {?} */ (value));
}
/**
 * @param {?} value
 * @return {?}
 */
export function isStylingContext(value) {
    // the StylingMapArray is in the format of [initial, prop, string, prop, string]
    // and this is the defining value to distinguish between arrays
    return Array.isArray(value) && value.length >= 3 /* ValuesStartPosition */ &&
        typeof value[1] !== 'string';
}
/**
 * @param {?} value
 * @return {?}
 */
export function isStylingMapArray(value) {
    // the StylingMapArray is in the format of [initial, prop, string, prop, string]
    // and this is the defining value to distinguish between arrays
    return Array.isArray(value) &&
        (typeof ((/** @type {?} */ (value)))[1 /* ValuesStartPosition */] === 'string');
}
/**
 * @param {?} context
 * @return {?}
 */
export function getInitialStylingValue(context) {
    /** @type {?} */
    const map = getStylingMapArray(context);
    return map && ((/** @type {?} */ (map[0 /* RawValuePosition */]))) || '';
}
/**
 * @param {?} tNode
 * @return {?}
 */
export function hasClassInput(tNode) {
    return (tNode.flags & 16 /* hasClassInput */) !== 0;
}
/**
 * @param {?} tNode
 * @return {?}
 */
export function hasStyleInput(tNode) {
    return (tNode.flags & 32 /* hasStyleInput */) !== 0;
}
/**
 * @param {?} map
 * @param {?} index
 * @return {?}
 */
export function getMapProp(map, index) {
    return (/** @type {?} */ (map[index + 0 /* PropOffset */]));
}
/** @type {?} */
const MAP_DIRTY_VALUE = typeof ngDevMode !== 'undefined' && ngDevMode ? {} : { MAP_DIRTY_VALUE: true };
/**
 * @param {?} map
 * @return {?}
 */
export function setMapAsDirty(map) {
    map[0 /* RawValuePosition */] = MAP_DIRTY_VALUE;
}
/**
 * @param {?} map
 * @param {?} index
 * @param {?} value
 * @return {?}
 */
export function setMapValue(map, index, value) {
    map[index + 1 /* ValueOffset */] = value;
}
/**
 * @param {?} map
 * @param {?} index
 * @return {?}
 */
export function getMapValue(map, index) {
    return (/** @type {?} */ (map[index + 1 /* ValueOffset */]));
}
/**
 * @param {?} classes
 * @return {?}
 */
export function forceClassesAsString(classes) {
    if (classes && typeof classes !== 'string') {
        classes = Object.keys(classes).join(' ');
    }
    return ((/** @type {?} */ (classes))) || '';
}
/**
 * @param {?} styles
 * @param {?} hyphenateProps
 * @return {?}
 */
export function forceStylesAsString(styles, hyphenateProps) {
    if (typeof styles == 'string')
        return styles;
    /** @type {?} */
    let str = '';
    if (styles) {
        /** @type {?} */
        const props = Object.keys(styles);
        for (let i = 0; i < props.length; i++) {
            /** @type {?} */
            const prop = props[i];
            /** @type {?} */
            const propLabel = hyphenateProps ? hyphenate(prop) : prop;
            /** @type {?} */
            const value = styles[prop];
            if (value !== null) {
                str = concatString(str, `${propLabel}:${value}`, ';');
            }
        }
    }
    return str;
}
/**
 * @param {?} directiveOrSourceId
 * @return {?}
 */
export function isHostStylingActive(directiveOrSourceId) {
    return directiveOrSourceId !== TEMPLATE_DIRECTIVE_INDEX;
}
/**
 * Converts the provided styling map array into a string.
 *
 * Classes => `one two three`
 * Styles => `prop:value; prop2:value2`
 * @param {?} map
 * @param {?} isClassBased
 * @return {?}
 */
export function stylingMapToString(map, isClassBased) {
    /** @type {?} */
    let str = '';
    for (let i = 1 /* ValuesStartPosition */; i < map.length; i += 2 /* TupleSize */) {
        /** @type {?} */
        const prop = getMapProp(map, i);
        /** @type {?} */
        const value = (/** @type {?} */ (getMapValue(map, i)));
        /** @type {?} */
        const attrValue = concatString(prop, isClassBased ? '' : value, ':');
        str = concatString(str, attrValue, isClassBased ? ' ' : '; ');
    }
    return str;
}
/**
 * Converts the provided styling map array into a key value map.
 * @param {?} map
 * @return {?}
 */
export function stylingMapToStringMap(map) {
    /** @type {?} */
    let stringMap = {};
    if (map) {
        for (let i = 1 /* ValuesStartPosition */; i < map.length; i += 2 /* TupleSize */) {
            /** @type {?} */
            const prop = getMapProp(map, i);
            /** @type {?} */
            const value = (/** @type {?} */ (getMapValue(map, i)));
            stringMap[prop] = value;
        }
    }
    return stringMap;
}
/**
 * Inserts the provided item into the provided styling array at the right spot.
 *
 * The `StylingMapArray` type is a sorted key/value array of entries. This means
 * that when a new entry is inserted it must be placed at the right spot in the
 * array. This function figures out exactly where to place it.
 * @param {?} stylingMapArr
 * @param {?} prop
 * @param {?} value
 * @param {?=} allowOverwrite
 * @return {?}
 */
export function addItemToStylingMap(stylingMapArr, prop, value, allowOverwrite) {
    for (let j = 1 /* ValuesStartPosition */; j < stylingMapArr.length; j += 2 /* TupleSize */) {
        /** @type {?} */
        const propAtIndex = getMapProp(stylingMapArr, j);
        if (prop <= propAtIndex) {
            /** @type {?} */
            let applied = false;
            if (propAtIndex === prop) {
                /** @type {?} */
                const valueAtIndex = stylingMapArr[j];
                if (allowOverwrite || !isStylingValueDefined(valueAtIndex)) {
                    applied = true;
                    setMapValue(stylingMapArr, j, value);
                }
            }
            else {
                applied = true;
                stylingMapArr.splice(j, 0, prop, value);
            }
            return applied;
        }
    }
    stylingMapArr.push(prop, value);
    return true;
}
/**
 * Used to convert a {key:value} map into a `StylingMapArray` array.
 *
 * This function will either generate a new `StylingMapArray` instance
 * or it will patch the provided `newValues` map value into an
 * existing `StylingMapArray` value (this only happens if `bindingValue`
 * is an instance of `StylingMapArray`).
 *
 * If a new key/value map is provided with an old `StylingMapArray`
 * value then all properties will be overwritten with their new
 * values or with `null`. This means that the array will never
 * shrink in size (but it will also not be created and thrown
 * away whenever the `{key:value}` map entries change).
 * @param {?} bindingValue
 * @param {?} newValues
 * @param {?=} normalizeProps
 * @return {?}
 */
export function normalizeIntoStylingMap(bindingValue, newValues, normalizeProps) {
    /** @type {?} */
    const stylingMapArr = Array.isArray(bindingValue) ? bindingValue : allocStylingMapArray(null);
    stylingMapArr[0 /* RawValuePosition */] = newValues;
    // because the new values may not include all the properties
    // that the old ones had, all values are set to `null` before
    // the new values are applied. This way, when flushed, the
    // styling algorithm knows exactly what style/class values
    // to remove from the element (since they are `null`).
    for (let j = 1 /* ValuesStartPosition */; j < stylingMapArr.length; j += 2 /* TupleSize */) {
        setMapValue(stylingMapArr, j, null);
    }
    /** @type {?} */
    let props = null;
    /** @type {?} */
    let map;
    /** @type {?} */
    let allValuesTrue = false;
    if (typeof newValues === 'string') { // [class] bindings allow string values
        props = splitOnWhitespace(newValues);
        allValuesTrue = props !== null;
    }
    else {
        props = newValues ? Object.keys(newValues) : null;
        map = newValues;
    }
    if (props) {
        for (let i = 0; i < props.length; i++) {
            /** @type {?} */
            const prop = props[i];
            /** @type {?} */
            const newProp = normalizeProps ? hyphenate(prop) : prop;
            /** @type {?} */
            const value = allValuesTrue ? true : (/** @type {?} */ (map))[prop];
            addItemToStylingMap(stylingMapArr, newProp, value, true);
        }
    }
    return stylingMapArr;
}
/**
 * @param {?} text
 * @return {?}
 */
export function splitOnWhitespace(text) {
    /** @type {?} */
    let array = null;
    /** @type {?} */
    let length = text.length;
    /** @type {?} */
    let start = 0;
    /** @type {?} */
    let foundChar = false;
    for (let i = 0; i < length; i++) {
        /** @type {?} */
        const char = text.charCodeAt(i);
        if (char <= 32 /*' '*/) {
            if (foundChar) {
                if (array === null)
                    array = [];
                array.push(text.substring(start, i));
                foundChar = false;
            }
            start = i + 1;
        }
        else {
            foundChar = true;
        }
    }
    if (foundChar) {
        if (array === null)
            array = [];
        array.push(text.substring(start, length));
        foundChar = false;
    }
    return array;
}
// TODO (matsko|AndrewKushnir): refactor this once we figure out how to generate separate
// `input('class') + classMap()` instructions.
/**
 * @param {?} inputs
 * @return {?}
 */
export function selectClassBasedInputName(inputs) {
    return inputs.hasOwnProperty('class') ? 'class' : 'className';
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3R5bGluZ191dGlscy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvdXRpbC9zdHlsaW5nX3V0aWxzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7QUFTQSxPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sV0FBVyxDQUFDOztBQUVwQyxNQUFNLE9BQU8seUJBQXlCLEdBQUcsT0FBTzs7QUFDaEQsTUFBTSxPQUFPLHdCQUF3QixHQUFHLENBQUM7Ozs7Ozs7Ozs7QUFVekMsTUFBTSxPQUFPLHFCQUFxQixHQUFHLElBQUk7O0FBRXpDLE1BQU0sT0FBTyxxQkFBcUIsR0FBRyxDQUFDOztNQUVoQyxxQkFBcUIsR0FBRyxDQUFDOzs7Ozs7O0FBTy9CLE1BQU0sT0FBTyx3QkFBd0IsR0FBRyxHQUFHOzs7Ozs7Ozs7Ozs7QUFVM0MsTUFBTSxVQUFVLG9CQUFvQixDQUNoQyxjQUFzQyxFQUFFLGFBQXNCO0lBQ2hFLGNBQWMsR0FBRyxjQUFjLElBQUksb0JBQW9CLENBQUMsSUFBSSxDQUFDLENBQUM7O1FBQzFELE1BQU0sa0JBQXlCO0lBQ25DLElBQUksYUFBYSxFQUFFO1FBQ2pCLE1BQU0seUJBQWdDLENBQUM7S0FDeEM7SUFDRCxJQUFJLGNBQWMsQ0FBQyxNQUFNLDhCQUEyQyxFQUFFO1FBQ3BFLE1BQU0sOEJBQW9DLENBQUM7S0FDNUM7SUFDRCxPQUFPO1FBQ0wsTUFBTTtRQUNOLHFCQUFxQjtRQUNyQixjQUFjO0tBQ2YsQ0FBQztBQUNKLENBQUM7Ozs7O0FBRUQsTUFBTSxVQUFVLG9CQUFvQixDQUFDLEtBQXlCO0lBQzVELE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUNqQixDQUFDOzs7OztBQUVELE1BQU0sVUFBVSxTQUFTLENBQUMsT0FBd0I7SUFDaEQsT0FBTyxPQUFPLHdCQUFxQyxDQUFDO0FBQ3RELENBQUM7Ozs7OztBQUVELE1BQU0sVUFBVSxTQUFT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QztnQkFDckMsU0FBUyxHQUFHLEtBQUssQ0FBQzthQUNuQjtZQUNELEtBQUssR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1NBQ2Y7YUFBTTtZQUNMLFNBQVMsR0FBRyxJQUFJLENBQUM7U0FDbEI7S0FDRjtJQUNELElBQUksU0FBUyxFQUFFO1FBQ2IsSUFBSSxLQUFLLEtBQUssSUFBSTtZQUFFLEtBQUssR0FBRyxFQUFFLENBQUM7UUFDL0IsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDO1FBQzFDLFNBQVMsR0FBRyxLQUFLLENBQUM7S0FDbkI7SUFDRCxPQUFPLEtBQUssQ0FBQztBQUNmLENBQUM7Ozs7Ozs7QUFJRCxNQUFNLFVBQVUseUJBQXlCLENBQUMsTUFBdUI7SUFDL0QsT0FBTyxNQUFNLENBQUMsY0FBYyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQztBQUNoRSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4qIEBsaWNlbnNlXG4qIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuKlxuKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4qL1xuaW1wb3J0IHtQcm9wZXJ0eUFsaWFzZXMsIFROb2RlLCBUTm9kZUZsYWdzfSBmcm9tICcuLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtMU3R5bGluZ0RhdGEsIFN0eWxpbmdNYXBBcnJheSwgU3R5bGluZ01hcEFycmF5SW5kZXgsIFRTdHlsaW5nQ29uZmlnLCBUU3R5bGluZ0NvbnRleHQsIFRTdHlsaW5nQ29udGV4dEluZGV4LCBUU3R5bGluZ0NvbnRleHRQcm9wQ29uZmlnRmxhZ3N9IGZyb20gJy4uL2ludGVyZmFjZXMvc3R5bGluZyc7XG5pbXBvcnQge05PX0NIQU5HRX0gZnJvbSAnLi4vdG9rZW5zJztcblxuZXhwb3J0IGNvbnN0IE1BUF9CQVNFRF9FTlRSWV9QUk9QX05BTUUgPSAnW01BUF0nO1xuZXhwb3J0IGNvbnN0IFRFTVBMQVRFX0RJUkVDVElWRV9JTkRFWCA9IDA7XG5cbi8qKlxuICogRGVmYXVsdCBmYWxsYmFjayB2YWx1ZSBmb3IgYSBzdHlsaW5nIGJpbmRpbmcuXG4gKlxuICogQSB2YWx1ZSBvZiBgbnVsbGAgaXMgdXNlZCBoZXJlIHdoaWNoIHNpZ25hbHMgdG8gdGhlIHN0eWxpbmcgYWxnb3JpdGhtIHRoYXRcbiAqIHRoZSBzdHlsaW5nIHZhbHVlIGlzIG5vdCBwcmVzZW50LiBUaGlzIHdheSBpZiB0aGVyZSBhcmUgbm8gb3RoZXIgdmFsdWVzXG4gKiBkZXRlY3RlZCB0aGVuIGl0IHdpbGwgYmUgcmVtb3ZlZCBvbmNlIHRoZSBzdHlsZS9jbGFzcyBwcm9wZXJ0eSBpcyBkaXJ0eSBhbmRcbiAqIGRpZmZlZCB3aXRoaW4gdGhlIHN0eWxpbmcgYWxnb3JpdGhtIHByZXNlbnQgaW4gYGZsdXNoU3R5bGluZ2AuXG4gKi9cbmV4cG9ydCBjb25zdCBERUZBVUxUX0JJTkRJTkdfVkFMVUUgPSBudWxsO1xuXG5leHBvcnQgY29uc3QgREVGQVVMVF9CSU5ESU5HX0lOREVYID0gMDtcblxuY29uc3QgREVGQVVMVF9UT1RBTF9TT1VSQ0VTID0gMTtcblxuLy8gVGhlIGZpcnN0IGJpdCB2YWx1ZSByZWZsZWN0cyBhIG1hcC1iYXNlZCBiaW5kaW5nIHZhbHVlJ3MgYml0LlxuLy8gVGhlIHJlYXNvbiB3aHkgaXQncyBhbHdheXMgYWN0aXZhdGVkIGZvciBldmVyeSBlbnRyeSBpbiB0aGUgbWFwXG4vLyBpcyBzbyB0aGF0IGlmIGFueSBtYXAtYmluZGluZyB2YWx1ZXMgdXBkYXRlIHRoZW4gYWxsIG90aGVyIHByb3Bcbi8vIGJhc2VkIGJpbmRpbmdzIHdpbGwgcGFzcyB0aGUgZ3VhcmQgY2hlY2sgYXV0b21hdGljYWxseSB3aXRob3V0XG4vLyBhbnkgZXh0cmEgY29kZSBvciBmbGFncy5cbmV4cG9ydCBjb25zdCBERUZBVUxUX0dVQVJEX01BU0tfVkFMVUUgPSAwYjE7XG5cbi8qKlxuICogQ3JlYXRlcyBhIG5ldyBpbnN0YW5jZSBvZiB0aGUgYFRTdHlsaW5nQ29udGV4dGAuXG4gKlxuICogVGhlIGBUU3R5bGluZ0NvbnRleHRgIGlzIHVzZWQgYXMgYSBtYW5pZmVzdCBvZiBhbGwgc3R5bGUgb3IgYWxsIGNsYXNzIGJpbmRpbmdzIG9uXG4gKiBhbiBlbGVtZW50LiBCZWNhdXNlIGl0IGlzIGEgVC1sZXZlbCBkYXRhLXN0cnVjdHVyZSwgaXQgaXMgb25seSBjcmVhdGVkIG9uY2UgcGVyXG4gKiB0Tm9kZSBmb3Igc3R5bGVzIGFuZCBmb3IgY2xhc3Nlcy4gVGhpcyBmdW5jdGlvbiBhbGxvY2F0ZXMgYSBuZXcgaW5zdGFuY2Ugb2YgYVxuICogYFRTdHlsaW5nQ29udGV4dGAgd2l0aCB0aGUgaW5pdGlhbCB2YWx1ZXMgKHNlZSBgaW50ZXJmYWNlcy50c2AgZm9yIG1vcmUgaW5mbykuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhbGxvY1RTdHlsaW5nQ29udGV4dChcbiAgICBpbml0aWFsU3R5bGluZzogU3R5bGluZ01hcEFycmF5IHwgbnVsbCwgaGFzRGlyZWN0aXZlczogYm9vbGVhbik6IFRTdHlsaW5nQ29udGV4dCB7XG4gIGluaXRpYWxTdHlsaW5nID0gaW5pdGlhbFN0eWxpbmcgfHwgYWxsb2NTdHlsaW5nTWFwQXJyYXkobnVsbCk7XG4gIGxldCBjb25maWcgPSBUU3R5bGluZ0NvbmZpZy5Jbml0aWFsO1xuICBpZiAoaGFzRGlyZWN0aXZlcykge1xuICAgIGNvbmZpZyB8PSBUU3R5bGluZ0NvbmZpZy5IYXNEaXJlY3RpdmVzO1xuICB9XG4gIGlmIChpbml0aWFsU3R5bGluZy5sZW5ndGggPiBTdHlsaW5nTWFwQXJyYXlJbmRleC5WYWx1ZXNTdGFydFBvc2l0aW9uKSB7XG4gICAgY29uZmlnIHw9IFRTdHlsaW5nQ29uZmlnLkhhc0luaXRpYWxTdHlsaW5nO1xuICB9XG4gIHJldHVybiBbXG4gICAgY29uZmlnLCAgICAgICAgICAgICAgICAgLy8gMSkgY29uZmlnIGZvciB0aGUgc3R5bGluZyBjb250ZXh0XG4gICAgREVGQVVMVF9UT1RBTF9TT1VSQ0VTLCAgLy8gMikgdG90YWwgYW1vdW50IG9mIHN0eWxpbmcgc291cmNlcyAodGVtcGxhdGUsIGRpcmVjdGl2ZXMsIGV0Yy4uLilcbiAgICBpbml0aWFsU3R5bGluZywgICAgICAgICAvLyAzKSBpbml0aWFsIHN0eWxpbmcgdmFsdWVzXG4gIF07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhbGxvY1N0eWxpbmdNYXBBcnJheSh2YWx1ZToge30gfCBzdHJpbmcgfCBudWxsKTogU3R5bGluZ01hcEFycmF5IHtcbiAgcmV0dXJuIFt2YWx1ZV07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRDb25maWcoY29udGV4dDogVFN0eWxpbmdDb250ZXh0KSB7XG4gIHJldHVybiBjb250ZXh0W1RTdHlsaW5nQ29udGV4dEluZGV4LkNvbmZpZ1Bvc2l0aW9uXTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGhhc0NvbmZpZyhjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQsIGZsYWc6IFRTdHlsaW5nQ29uZmlnKSB7XG4gIHJldHVybiAoZ2V0Q29uZmlnKGNvbnRleHQpICYgZmxhZykgIT09IDA7XG59XG5cbi8qKlxuICogRGV0ZXJtaW5lcyB3aGV0aGVyIG9yIG5vdCB0byBhcHBseSBzdHlsZXMvY2xhc3NlcyBkaXJlY3RseSBvciB2aWEgY29udGV4dCByZXNvbHV0aW9uLlxuICpcbiAqIFRoZXJlIGFyZSB0aHJlZSBjYXNlcyB0aGF0IGFyZSBtYXRjaGVkIGhlcmU6XG4gKiAxLiB0aGVyZSBhcmUgbm8gZGlyZWN0aXZlcyBwcmVzZW50IEFORCBgbmdEZXZNb2RlYCBpcyBmYWxzeVxuICogMi4gdGhlIGBmaXJzdFVwZGF0ZVBhc3NgIGhhcyBub3QgYWxyZWFkeSBydW4gKHdoaWNoIG1lYW5zIHRoYXRcbiAqICAgIHRoZXJlIGFyZSBtb3JlIGJpbmRpbmdzIHRvIHJlZ2lzdGVyIGFuZCwgdGhlcmVmb3JlLCBkaXJlY3RcbiAqICAgIHN0eWxlL2NsYXNzIGFwcGxpY2F0aW9uIGlzIG5vdCB5ZXQgcG9zc2libGUpXG4gKiAzLiBUaGVyZSBhcmUgbm8gY29sbGlzaW9ucyAoaS5lLiBwcm9wZXJ0aWVzIHdpdGggbW9yZSB0aGFuIG9uZSBiaW5kaW5nKSBhY3Jvc3MgbXVsdGlwbGVcbiAqICAgIHNvdXJjZXMgKGkuZS4gdGVtcGxhdGUgKyBkaXJlY3RpdmUsIGRpcmVjdGl2ZSArIGRpcmVjdGl2ZSwgZGlyZWN0aXZlICsgY29tcG9uZW50KVxuICovXG5leHBvcnQgZnVuY3Rpb24gYWxsb3dEaXJlY3RTdHlsaW5nKGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCwgZmlyc3RVcGRhdGVQYXNzOiBib29sZWFuKTogYm9vbGVhbiB7XG4gIGxldCBhbGxvdyA9IGZhbHNlO1xuICBjb25zdCBjb25maWcgPSBnZXRDb25maWcoY29udGV4dCk7XG4gIGNvbnN0IGhhc05vRGlyZWN0aXZlcyA9IChjb25maWcgJiBUU3R5bGluZ0NvbmZpZy5IYXNEaXJlY3RpdmVzKSA9PT0gMDtcblxuICAvLyBpZiBubyBkaXJlY3RpdmVzIGFyZSBwcmVzZW50IHRoZW4gd2UgZG8gbm90IG5lZWQgcG9wdWxhdGUgYSBjb250ZXh0IGF0IGFsbC4gVGhpc1xuICAvLyBpcyBiZWNhdXNlIGR1cGxpY2F0ZSBwcm9wIGJpbmRpbmdzIGNhbm5vdCBiZSByZWdpc3RlcmVkIHRocm91Z2ggdGhlIHRlbXBsYXRlLiBJZlxuICAvLyBhbmQgd2hlbiB0aGlzIGhhcHBlbnMgd2UgY2FuIHNhZmVseSBhcHBseSB0aGUgdmFsdWUgZGlyZWN0bHkgd2l0aG91dCBjb250ZXh0XG4gIC8vIHJlc29sdXRpb24uLi5cbiAgaWYgKGhhc05vRGlyZWN0aXZlcykge1xuICAgIC8vIGBuZ0Rldk1vZGVgIGlzIHJlcXVpcmVkIHRvIGJlIGNoZWNrZWQgaGVyZSBiZWNhdXNlIHRlc3RzL2RlYnVnZ2luZyByZWx5IG9uIHRoZSBjb250ZXh0IGJlaW5nXG4gICAgLy8gcG9wdWxhdGVkLiBJZiB0aGluZ3MgYXJlIGluIHByb2R1Y3Rpb24gbW9kZSB0aGVuIHRoZXJlIGlzIG5vIG5lZWQgdG8gYnVpbGQgYSBjb250ZXh0XG4gICAgLy8gdGhlcmVmb3JlIHRoZSBkaXJlY3QgYXBwbHkgY2FuIGJlIGFsbG93ZWQgKGV2ZW4gb24gdGhlIGZpcnN0IHVwZGF0ZSkuXG4gICAgYWxsb3cgPSBuZ0Rldk1vZGUgPyAhZmlyc3RVcGRhdGVQYXNzIDogdHJ1ZTtcbiAgfSBlbHNlIGlmICghZmlyc3RVcGRhdGVQYXNzKSB7XG4gICAgY29uc3QgaGFzTm9Db2xsaXNpb25zID0gKGNvbmZpZyAmIFRTdHlsaW5nQ29uZmlnLkhhc0NvbGxpc2lvbnMpID09PSAwO1xuICAgIGNvbnN0IGhhc09ubHlNYXBzT3JPbmx5UHJvcHMgPVxuICAgICAgICAoY29uZmlnICYgVFN0eWxpbmdDb25maWcuSGFzUHJvcEFuZE1hcEJpbmRpbmdzKSAhPT0gVFN0eWxpbmdDb25maWcuSGFzUHJvcEFuZE1hcEJpbmRpbmdzO1xuICAgIGFsbG93ID0gaGFzTm9Db2xsaXNpb25zICYmIGhhc09ubHlNYXBzT3JPbmx5UHJvcHM7XG4gIH1cblxuICByZXR1cm4gYWxsb3c7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXRDb25maWcoY29udGV4dDogVFN0eWxpbmdDb250ZXh0LCB2YWx1ZTogVFN0eWxpbmdDb25maWcpOiB2b2lkIHtcbiAgY29udGV4dFtUU3R5bGluZ0NvbnRleHRJbmRleC5Db25maWdQb3NpdGlvbl0gPSB2YWx1ZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHBhdGNoQ29uZmlnKGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCwgZmxhZzogVFN0eWxpbmdDb25maWcpOiB2b2lkIHtcbiAgY29udGV4dFtUU3R5bGluZ0NvbnRleHRJbmRleC5Db25maWdQb3NpdGlvbl0gfD0gZmxhZztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFByb3AoY29udGV4dDogVFN0eWxpbmdDb250ZXh0LCBpbmRleDogbnVtYmVyKTogc3RyaW5nIHtcbiAgcmV0dXJuIGNvbnRleHRbaW5kZXggKyBUU3R5bGluZ0NvbnRleHRJbmRleC5Qcm9wT2Zmc2V0XSBhcyBzdHJpbmc7XG59XG5cbmZ1bmN0aW9uIGdldFByb3BDb25maWcoY29udGV4dDogVFN0eWxpbmdDb250ZXh0LCBpbmRleDogbnVtYmVyKTogbnVtYmVyIHtcbiAgcmV0dXJuIChjb250ZXh0W2luZGV4ICsgVFN0eWxpbmdDb250ZXh0SW5kZXguQ29uZmlnT2Zmc2V0XSBhcyBudW1iZXIpICZcbiAgICAgIFRTdHlsaW5nQ29udGV4dFByb3BDb25maWdGbGFncy5NYXNrO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNTYW5pdGl6YXRpb25SZXF1aXJlZChjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQsIGluZGV4OiBudW1iZXIpOiBib29sZWFuIHtcbiAgcmV0dXJuIChnZXRQcm9wQ29uZmlnKGNvbnRleHQsIGluZGV4KSAmIFRTdHlsaW5nQ29udGV4dFByb3BDb25maWdGbGFncy5TYW5pdGl6YXRpb25SZXF1aXJlZCkgIT09XG4gICAgICAwO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0R3VhcmRNYXNrKFxuICAgIGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCwgaW5kZXg6IG51bWJlciwgaXNIb3N0QmluZGluZzogYm9vbGVhbik6IG51bWJlciB7XG4gIGNvbnN0IHBvc2l0aW9uID0gaW5kZXggKyAoaXNIb3N0QmluZGluZyA/IFRTdHlsaW5nQ29udGV4dEluZGV4Lkhvc3RCaW5kaW5nc0JpdEd1YXJkT2Zmc2V0IDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgVFN0eWxpbmdDb250ZXh0SW5kZXguVGVtcGxhdGVCaXRHdWFyZE9mZnNldCk7XG4gIHJldHVybiBjb250ZXh0W3Bvc2l0aW9uXSBhcyBudW1iZXI7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXRHdWFyZE1hc2soXG4gICAgY29udGV4dDogVFN0eWxpbmdDb250ZXh0LCBpbmRleDogbnVtYmVyLCBtYXNrVmFsdWU6IG51bWJlciwgaXNIb3N0QmluZGluZzogYm9vbGVhbikge1xuICBjb25zdCBwb3NpdGlvbiA9IGluZGV4ICsgKGlzSG9zdEJpbmRpbmcgPyBUU3R5bGluZ0NvbnRleHRJbmRleC5Ib3N0QmluZGluZ3NCaXRHdWFyZE9mZnNldCA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFRTdHlsaW5nQ29udGV4dEluZGV4LlRlbXBsYXRlQml0R3VhcmRPZmZzZXQpO1xuICBjb250ZXh0W3Bvc2l0aW9uXSA9IG1hc2tWYWx1ZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFZhbHVlc0NvdW50KGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCk6IG51bWJlciB7XG4gIHJldHVybiBnZXRUb3RhbFNvdXJjZXMoY29udGV4dCkgKyAxO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0VG90YWxTb3VyY2VzKGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCk6IG51bWJlciB7XG4gIHJldHVybiBjb250ZXh0W1RTdHlsaW5nQ29udGV4dEluZGV4LlRvdGFsU291cmNlc1Bvc2l0aW9uXTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEJpbmRpbmdWYWx1ZShjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQsIGluZGV4OiBudW1iZXIsIG9mZnNldDogbnVtYmVyKSB7XG4gIHJldHVybiBjb250ZXh0W2luZGV4ICsgVFN0eWxpbmdDb250ZXh0SW5kZXguQmluZGluZ3NTdGFydE9mZnNldCArIG9mZnNldF0gYXMgbnVtYmVyIHwgc3RyaW5nO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0RGVmYXVsdFZhbHVlKGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCwgaW5kZXg6IG51bWJlcik6IHN0cmluZ3xib29sZWFufG51bGwge1xuICByZXR1cm4gY29udGV4dFtpbmRleCArIFRTdHlsaW5nQ29udGV4dEluZGV4LkJpbmRpbmdzU3RhcnRPZmZzZXQgKyBnZXRUb3RhbFNvdXJjZXMoY29udGV4dCldIGFzXG4gICAgICAgICAgICAgc3RyaW5nIHxcbiAgICAgIGJvb2xlYW4gfCBudWxsO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2V0RGVmYXVsdFZhbHVlKFxuICAgIGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCwgaW5kZXg6IG51bWJlciwgdmFsdWU6IHN0cmluZyB8IGJvb2xlYW4gfCBudWxsKSB7XG4gIHJldHVybiBjb250ZXh0W2luZGV4ICsgVFN0eWxpbmdDb250ZXh0SW5kZXguQmluZGluZ3NTdGFydE9mZnNldCArIGdldFRvdGFsU291cmNlcyhjb250ZXh0KV0gPVxuICAgICAgICAgICAgIHZhbHVlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2V0VmFsdWUoZGF0YTogTFN0eWxpbmdEYXRhLCBiaW5kaW5nSW5kZXg6IG51bWJlciwgdmFsdWU6IGFueSkge1xuICBkYXRhW2JpbmRpbmdJbmRleF0gPSB2YWx1ZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFZhbHVlPFQgPSBhbnk+KGRhdGE6IExTdHlsaW5nRGF0YSwgYmluZGluZ0luZGV4OiBudW1iZXIpOiBUfG51bGwge1xuICByZXR1cm4gYmluZGluZ0luZGV4ICE9PSAwID8gZGF0YVtiaW5kaW5nSW5kZXhdIGFzIFQgOiBudWxsO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0UHJvcFZhbHVlc1N0YXJ0UG9zaXRpb24oY29udGV4dDogVFN0eWxpbmdDb250ZXh0KSB7XG4gIGxldCBzdGFydFBvc2l0aW9uID0gVFN0eWxpbmdDb250ZXh0SW5kZXguVmFsdWVzU3RhcnRQb3NpdGlvbjtcbiAgaWYgKGhhc0NvbmZpZyhjb250ZXh0LCBUU3R5bGluZ0NvbmZpZy5IYXNNYXBCaW5kaW5ncykpIHtcbiAgICBzdGFydFBvc2l0aW9uICs9IFRTdHlsaW5nQ29udGV4dEluZGV4LkJpbmRpbmdzU3RhcnRPZmZzZXQgKyBnZXRWYWx1ZXNDb3VudChjb250ZXh0KTtcbiAgfVxuICByZXR1cm4gc3RhcnRQb3NpdGlvbjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGhhc1ZhbHVlQ2hhbmdlZChcbiAgICBhOiBOT19DSEFOR0UgfCBTdHlsaW5nTWFwQXJyYXkgfCBudW1iZXIgfCBTdHJpbmcgfCBzdHJpbmcgfCBudWxsIHwgYm9vbGVhbiB8IHVuZGVmaW5lZCB8IHt9LFxuICAgIGI6IE5PX0NIQU5HRSB8IFN0eWxpbmdNYXBBcnJheSB8IG51bWJlciB8IFN0cmluZyB8IHN0cmluZyB8IG51bGwgfCBib29sZWFuIHwgdW5kZWZpbmVkIHxcbiAgICAgICAge30pOiBib29sZWFuIHtcbiAgaWYgKGIgPT09IE5PX0NIQU5HRSkgcmV0dXJuIGZhbHNlO1xuXG4gIGNvbnN0IGNvbXBhcmVWYWx1ZUEgPSBBcnJheS5pc0FycmF5KGEpID8gYVtTdHlsaW5nTWFwQXJyYXlJbmRleC5SYXdWYWx1ZVBvc2l0aW9uXSA6IGE7XG4gIGNvbnN0IGNvbXBhcmVWYWx1ZUIgPSBBcnJheS5pc0FycmF5KGIpID8gYltTdHlsaW5nTWFwQXJyYXlJbmRleC5SYXdWYWx1ZVBvc2l0aW9uXSA6IGI7XG4gIHJldHVybiAhT2JqZWN0LmlzKGNvbXBhcmVWYWx1ZUEsIGNvbXBhcmVWYWx1ZUIpO1xufVxuXG4vKipcbiAqIERldGVybWluZXMgd2hldGhlciB0aGUgcHJvdmlkZWQgc3R5bGluZyB2YWx1ZSBpcyB0cnV0aHkgb3IgZmFsc3kuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpc1N0eWxpbmdWYWx1ZURlZmluZWQ8VCBleHRlbmRzIHN0cmluZ3xudW1iZXJ8e318bnVsbHx1bmRlZmluZWQ+KHZhbHVlOiBUKTpcbiAgICB2YWx1ZSBpcyBOb25OdWxsYWJsZTxUPiB7XG4gIC8vIHRoZSByZWFzb24gd2h5IG51bGwgaXMgY29tcGFyZWQgYWdhaW5zdCBpcyBiZWNhdXNlXG4gIC8vIGEgQ1NTIGNsYXNzIHZhbHVlIHRoYXQgaXMgc2V0IHRvIGBmYWxzZWAgbXVzdCBiZVxuICAvLyByZXNwZWN0ZWQgKG90aGVyd2lzZSBpdCB3b3VsZCBiZSB0cmVhdGVkIGFzIGZhbHN5KS5cbiAgLy8gRW1wdHkgc3RyaW5nIHZhbHVlcyBhcmUgYmVjYXVzZSBkZXZlbG9wZXJzIHVzdWFsbHlcbiAgLy8gc2V0IGEgdmFsdWUgdG8gYW4gZW1wdHkgc3RyaW5nIHRvIHJlbW92ZSBpdC5cbiAgcmV0dXJuIHZhbHVlICE9IG51bGwgJiYgdmFsdWUgIT09ICcnO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY29uY2F0U3RyaW5nKGE6IHN0cmluZywgYjogc3RyaW5nLCBzZXBhcmF0b3IgPSAnICcpOiBzdHJpbmcge1xuICByZXR1cm4gYSArICgoYi5sZW5ndGggJiYgYS5sZW5ndGgpID8gc2VwYXJhdG9yIDogJycpICsgYjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGh5cGhlbmF0ZSh2YWx1ZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHZhbHVlLnJlcGxhY2UoL1thLXpdW0EtWl0vZywgdiA9PiB2LmNoYXJBdCgwKSArICctJyArIHYuY2hhckF0KDEpKS50b0xvd2VyQ2FzZSgpO1xufVxuXG4vKipcbiAqIFJldHVybnMgYW4gaW5zdGFuY2Ugb2YgYFN0eWxpbmdNYXBBcnJheWAuXG4gKlxuICogVGhpcyBmdW5jdGlvbiBpcyBkZXNpZ25lZCB0byBmaW5kIGFuIGluc3RhbmNlIG9mIGBTdHlsaW5nTWFwQXJyYXlgIGluIGNhc2UgaXQgaXMgc3RvcmVkXG4gKiBpbnNpZGUgb2YgYW4gaW5zdGFuY2Ugb2YgYFRTdHlsaW5nQ29udGV4dGAuIFdoZW4gYSBzdHlsaW5nIGNvbnRleHQgaXMgY3JlYXRlZCBpdFxuICogd2lsbCBjb3B5IG92ZXIgYW4gaW5pdGlhbCBzdHlsaW5nIHZhbHVlcyBmcm9tIHRoZSB0Tm9kZSAod2hpY2ggYXJlIHN0b3JlZCBhcyBhXG4gKiBgU3R5bGluZ01hcEFycmF5YCBvbiB0aGUgYHROb2RlLmNsYXNzZXNgIG9yIGB0Tm9kZS5zdHlsZXNgIHZhbHVlcykuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRTdHlsaW5nTWFwQXJyYXkodmFsdWU6IFRTdHlsaW5nQ29udGV4dCB8IFN0eWxpbmdNYXBBcnJheSB8IG51bGwpOlxuICAgIFN0eWxpbmdNYXBBcnJheXxudWxsIHtcbiAgcmV0dXJuIGlzU3R5bGluZ0NvbnRleHQodmFsdWUpID9cbiAgICAgICh2YWx1ZSBhcyBUU3R5bGluZ0NvbnRleHQpW1RTdHlsaW5nQ29udGV4dEluZGV4LkluaXRpYWxTdHlsaW5nVmFsdWVQb3NpdGlvbl0gOlxuICAgICAgdmFsdWUgYXMgU3R5bGluZ01hcEFycmF5O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNTdHlsaW5nQ29udGV4dCh2YWx1ZTogYW55KTogYm9vbGVhbiB7XG4gIC8vIHRoZSBTdHlsaW5nTWFwQXJyYXkgaXMgaW4gdGhlIGZvcm1hdCBvZiBbaW5pdGlhbCwgcHJvcCwgc3RyaW5nLCBwcm9wLCBzdHJpbmddXG4gIC8vIGFuZCB0aGlzIGlzIHRoZSBkZWZpbmluZyB2YWx1ZSB0byBkaXN0aW5ndWlzaCBiZXR3ZWVuIGFycmF5c1xuICByZXR1cm4gQXJyYXkuaXNBcnJheSh2YWx1ZSkgJiYgdmFsdWUubGVuZ3RoID49IFRTdHlsaW5nQ29udGV4dEluZGV4LlZhbHVlc1N0YXJ0UG9zaXRpb24gJiZcbiAgICAgIHR5cGVvZiB2YWx1ZVsxXSAhPT0gJ3N0cmluZyc7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc1N0eWxpbmdNYXBBcnJheSh2YWx1ZTogYW55KTogYm9vbGVhbiB7XG4gIC8vIHRoZSBTdHlsaW5nTWFwQXJyYXkgaXMgaW4gdGhlIGZvcm1hdCBvZiBbaW5pdGlhbCwgcHJvcCwgc3RyaW5nLCBwcm9wLCBzdHJpbmddXG4gIC8vIGFuZCB0aGlzIGlzIHRoZSBkZWZpbmluZyB2YWx1ZSB0byBkaXN0aW5ndWlzaCBiZXR3ZWVuIGFycmF5c1xuICByZXR1cm4gQXJyYXkuaXNBcnJheSh2YWx1ZSkgJiZcbiAgICAgICh0eXBlb2YodmFsdWUgYXMgU3R5bGluZ01hcEFycmF5KVtTdHlsaW5nTWFwQXJyYXlJbmRleC5WYWx1ZXNTdGFydFBvc2l0aW9uXSA9PT0gJ3N0cmluZycpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0SW5pdGlhbFN0eWxpbmdWYWx1ZShjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQgfCBTdHlsaW5nTWFwQXJyYXkgfCBudWxsKTogc3RyaW5nIHtcbiAgY29uc3QgbWFwID0gZ2V0U3R5bGluZ01hcEFycmF5KGNvbnRleHQpO1xuICByZXR1cm4gbWFwICYmIChtYXBbU3R5bGluZ01hcEFycmF5SW5kZXguUmF3VmFsdWVQb3NpdGlvbl0gYXMgc3RyaW5nIHwgbnVsbCkgfHwgJyc7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBoYXNDbGFzc0lucHV0KHROb2RlOiBUTm9kZSkge1xuICByZXR1cm4gKHROb2RlLmZsYWdzICYgVE5vZGVGbGFncy5oYXNDbGFzc0lucHV0KSAhPT0gMDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGhhc1N0eWxlSW5wdXQodE5vZGU6IFROb2RlKSB7XG4gIHJldHVybiAodE5vZGUuZmxhZ3MgJiBUTm9kZUZsYWdzLmhhc1N0eWxlSW5wdXQpICE9PSAwO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0TWFwUHJvcChtYXA6IFN0eWxpbmdNYXBBcnJheSwgaW5kZXg6IG51bWJlcik6IHN0cmluZyB7XG4gIHJldHVybiBtYXBbaW5kZXggKyBTdHlsaW5nTWFwQXJyYXlJbmRleC5Qcm9wT2Zmc2V0XSBhcyBzdHJpbmc7XG59XG5cbmNvbnN0IE1BUF9ESVJUWV9WQUxVRSA9XG4gICAgdHlwZW9mIG5nRGV2TW9kZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbmdEZXZNb2RlID8ge30gOiB7TUFQX0RJUlRZX1ZBTFVFOiB0cnVlfTtcblxuZXhwb3J0IGZ1bmN0aW9uIHNldE1hcEFzRGlydHkobWFwOiBTdHlsaW5nTWFwQXJyYXkpOiB2b2lkIHtcbiAgbWFwW1N0eWxpbmdNYXBBcnJheUluZGV4LlJhd1ZhbHVlUG9zaXRpb25dID0gTUFQX0RJUlRZX1ZBTFVFO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2V0TWFwVmFsdWUoXG4gICAgbWFwOiBTdHlsaW5nTWFwQXJyYXksIGluZGV4OiBudW1iZXIsIHZhbHVlOiBzdHJpbmcgfCBib29sZWFuIHwgbnVsbCk6IHZvaWQge1xuICBtYXBbaW5kZXggKyBTdHlsaW5nTWFwQXJyYXlJbmRleC5WYWx1ZU9mZnNldF0gPSB2YWx1ZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldE1hcFZhbHVlKG1hcDogU3R5bGluZ01hcEFycmF5LCBpbmRleDogbnVtYmVyKTogc3RyaW5nfG51bGwge1xuICByZXR1cm4gbWFwW2luZGV4ICsgU3R5bGluZ01hcEFycmF5SW5kZXguVmFsdWVPZmZzZXRdIGFzIHN0cmluZyB8IG51bGw7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBmb3JjZUNsYXNzZXNBc1N0cmluZyhjbGFzc2VzOiBzdHJpbmcgfCB7W2tleTogc3RyaW5nXTogYW55fSB8IG51bGwgfCB1bmRlZmluZWQpOlxuICAgIHN0cmluZyB7XG4gIGlmIChjbGFzc2VzICYmIHR5cGVvZiBjbGFzc2VzICE9PSAnc3RyaW5nJykge1xuICAgIGNsYXNzZXMgPSBPYmplY3Qua2V5cyhjbGFzc2VzKS5qb2luKCcgJyk7XG4gIH1cbiAgcmV0dXJuIChjbGFzc2VzIGFzIHN0cmluZykgfHwgJyc7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBmb3JjZVN0eWxlc0FzU3RyaW5nKFxuICAgIHN0eWxlczoge1trZXk6IHN0cmluZ106IGFueX0gfCBzdHJpbmcgfCBudWxsIHwgdW5kZWZpbmVkLCBoeXBoZW5hdGVQcm9wczogYm9vbGVhbik6IHN0cmluZyB7XG4gIGlmICh0eXBlb2Ygc3R5bGVzID09ICdzdHJpbmcnKSByZXR1cm4gc3R5bGVzO1xuICBsZXQgc3RyID0gJyc7XG4gIGlmIChzdHlsZXMpIHtcbiAgICBjb25zdCBwcm9wcyA9IE9iamVjdC5rZXlzKHN0eWxlcyk7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwcm9wcy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgcHJvcCA9IHByb3BzW2ldO1xuICAgICAgY29uc3QgcHJvcExhYmVsID0gaHlwaGVuYXRlUHJvcHMgPyBoeXBoZW5hdGUocHJvcCkgOiBwcm9wO1xuICAgICAgY29uc3QgdmFsdWUgPSBzdHlsZXNbcHJvcF07XG4gICAgICBpZiAodmFsdWUgIT09IG51bGwpIHtcbiAgICAgICAgc3RyID0gY29uY2F0U3RyaW5nKHN0ciwgYCR7cHJvcExhYmVsfToke3ZhbHVlfWAsICc7Jyk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiBzdHI7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0hvc3RTdHlsaW5nQWN0aXZlKGRpcmVjdGl2ZU9yU291cmNlSWQ6IG51bWJlcik6IGJvb2xlYW4ge1xuICByZXR1cm4gZGlyZWN0aXZlT3JTb3VyY2VJZCAhPT0gVEVNUExBVEVfRElSRUNUSVZFX0lOREVYO1xufVxuXG4vKipcbiAqIENvbnZlcnRzIHRoZSBwcm92aWRlZCBzdHlsaW5nIG1hcCBhcnJheSBpbnRvIGEgc3RyaW5nLlxuICpcbiAqIENsYXNzZXMgPT4gYG9uZSB0d28gdGhyZWVgXG4gKiBTdHlsZXMgPT4gYHByb3A6dmFsdWU7IHByb3AyOnZhbHVlMmBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHN0eWxpbmdNYXBUb1N0cmluZyhtYXA6IFN0eWxpbmdNYXBBcnJheSwgaXNDbGFzc0Jhc2VkOiBib29sZWFuKTogc3RyaW5nIHtcbiAgbGV0IHN0ciA9ICcnO1xuICBmb3IgKGxldCBpID0gU3R5bGluZ01hcEFycmF5SW5kZXguVmFsdWVzU3RhcnRQb3NpdGlvbjsgaSA8IG1hcC5sZW5ndGg7XG4gICAgICAgaSArPSBTdHlsaW5nTWFwQXJyYXlJbmRleC5UdXBsZVNpemUpIHtcbiAgICBjb25zdCBwcm9wID0gZ2V0TWFwUHJvcChtYXAsIGkpO1xuICAgIGNvbnN0IHZhbHVlID0gZ2V0TWFwVmFsdWUobWFwLCBpKSBhcyBzdHJpbmc7XG4gICAgY29uc3QgYXR0clZhbHVlID0gY29uY2F0U3RyaW5nKHByb3AsIGlzQ2xhc3NCYXNlZCA/ICcnIDogdmFsdWUsICc6Jyk7XG4gICAgc3RyID0gY29uY2F0U3RyaW5nKHN0ciwgYXR0clZhbHVlLCBpc0NsYXNzQmFzZWQgPyAnICcgOiAnOyAnKTtcbiAgfVxuICByZXR1cm4gc3RyO1xufVxuXG4vKipcbiAqIENvbnZlcnRzIHRoZSBwcm92aWRlZCBzdHlsaW5nIG1hcCBhcnJheSBpbnRvIGEga2V5IHZhbHVlIG1hcC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHN0eWxpbmdNYXBUb1N0cmluZ01hcChtYXA6IFN0eWxpbmdNYXBBcnJheSB8IG51bGwpOiB7W2tleTogc3RyaW5nXTogYW55fSB7XG4gIGxldCBzdHJpbmdNYXA6IHtba2V5OiBzdHJpbmddOiBhbnl9ID0ge307XG4gIGlmIChtYXApIHtcbiAgICBmb3IgKGxldCBpID0gU3R5bGluZ01hcEFycmF5SW5kZXguVmFsdWVzU3RhcnRQb3NpdGlvbjsgaSA8IG1hcC5sZW5ndGg7XG4gICAgICAgICBpICs9IFN0eWxpbmdNYXBBcnJheUluZGV4LlR1cGxlU2l6ZSkge1xuICAgICAgY29uc3QgcHJvcCA9IGdldE1hcFByb3AobWFwLCBpKTtcbiAgICAgIGNvbnN0IHZhbHVlID0gZ2V0TWFwVmFsdWUobWFwLCBpKSBhcyBzdHJpbmc7XG4gICAgICBzdHJpbmdNYXBbcHJvcF0gPSB2YWx1ZTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHN0cmluZ01hcDtcbn1cblxuLyoqXG4gKiBJbnNlcnRzIHRoZSBwcm92aWRlZCBpdGVtIGludG8gdGhlIHByb3ZpZGVkIHN0eWxpbmcgYXJyYXkgYXQgdGhlIHJpZ2h0IHNwb3QuXG4gKlxuICogVGhlIGBTdHlsaW5nTWFwQXJyYXlgIHR5cGUgaXMgYSBzb3J0ZWQga2V5L3ZhbHVlIGFycmF5IG9mIGVudHJpZXMuIFRoaXMgbWVhbnNcbiAqIHRoYXQgd2hlbiBhIG5ldyBlbnRyeSBpcyBpbnNlcnRlZCBpdCBtdXN0IGJlIHBsYWNlZCBhdCB0aGUgcmlnaHQgc3BvdCBpbiB0aGVcbiAqIGFycmF5LiBUaGlzIGZ1bmN0aW9uIGZpZ3VyZXMgb3V0IGV4YWN0bHkgd2hlcmUgdG8gcGxhY2UgaXQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhZGRJdGVtVG9TdHlsaW5nTWFwKFxuICAgIHN0eWxpbmdNYXBBcnI6IFN0eWxpbmdNYXBBcnJheSwgcHJvcDogc3RyaW5nLCB2YWx1ZTogc3RyaW5nIHwgYm9vbGVhbiB8IG51bGwsXG4gICAgYWxsb3dPdmVyd3JpdGU/OiBib29sZWFuKSB7XG4gIGZvciAobGV0IGogPSBTdHlsaW5nTWFwQXJyYXlJbmRleC5WYWx1ZXNTdGFydFBvc2l0aW9uOyBqIDwgc3R5bGluZ01hcEFyci5sZW5ndGg7XG4gICAgICAgaiArPSBTdHlsaW5nTWFwQXJyYXlJbmRleC5UdXBsZVNpemUpIHtcbiAgICBjb25zdCBwcm9wQXRJbmRleCA9IGdldE1hcFByb3Aoc3R5bGluZ01hcEFyciwgaik7XG4gICAgaWYgKHByb3AgPD0gcHJvcEF0SW5kZXgpIHtcbiAgICAgIGxldCBhcHBsaWVkID0gZmFsc2U7XG4gICAgICBpZiAocHJvcEF0SW5kZXggPT09IHByb3ApIHtcbiAgICAgICAgY29uc3QgdmFsdWVBdEluZGV4ID0gc3R5bGluZ01hcEFycltqXTtcbiAgICAgICAgaWYgKGFsbG93T3ZlcndyaXRlIHx8ICFpc1N0eWxpbmdWYWx1ZURlZmluZWQodmFsdWVBdEluZGV4KSkge1xuICAgICAgICAgIGFwcGxpZWQgPSB0cnVlO1xuICAgICAgICAgIHNldE1hcFZhbHVlKHN0eWxpbmdNYXBBcnIsIGosIHZhbHVlKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYXBwbGllZCA9IHRydWU7XG4gICAgICAgIHN0eWxpbmdNYXBBcnIuc3BsaWNlKGosIDAsIHByb3AsIHZhbHVlKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBhcHBsaWVkO1xuICAgIH1cbiAgfVxuXG4gIHN0eWxpbmdNYXBBcnIucHVzaChwcm9wLCB2YWx1ZSk7XG4gIHJldHVybiB0cnVlO1xufVxuXG4vKipcbiAqIFVzZWQgdG8gY29udmVydCBhIHtrZXk6dmFsdWV9IG1hcCBpbnRvIGEgYFN0eWxpbmdNYXBBcnJheWAgYXJyYXkuXG4gKlxuICogVGhpcyBmdW5jdGlvbiB3aWxsIGVpdGhlciBnZW5lcmF0ZSBhIG5ldyBgU3R5bGluZ01hcEFycmF5YCBpbnN0YW5jZVxuICogb3IgaXQgd2lsbCBwYXRjaCB0aGUgcHJvdmlkZWQgYG5ld1ZhbHVlc2AgbWFwIHZhbHVlIGludG8gYW5cbiAqIGV4aXN0aW5nIGBTdHlsaW5nTWFwQXJyYXlgIHZhbHVlICh0aGlzIG9ubHkgaGFwcGVucyBpZiBgYmluZGluZ1ZhbHVlYFxuICogaXMgYW4gaW5zdGFuY2Ugb2YgYFN0eWxpbmdNYXBBcnJheWApLlxuICpcbiAqIElmIGEgbmV3IGtleS92YWx1ZSBtYXAgaXMgcHJvdmlkZWQgd2l0aCBhbiBvbGQgYFN0eWxpbmdNYXBBcnJheWBcbiAqIHZhbHVlIHRoZW4gYWxsIHByb3BlcnRpZXMgd2lsbCBiZSBvdmVyd3JpdHRlbiB3aXRoIHRoZWlyIG5ld1xuICogdmFsdWVzIG9yIHdpdGggYG51bGxgLiBUaGlzIG1lYW5zIHRoYXQgdGhlIGFycmF5IHdpbGwgbmV2ZXJcbiAqIHNocmluayBpbiBzaXplIChidXQgaXQgd2lsbCBhbHNvIG5vdCBiZSBjcmVhdGVkIGFuZCB0aHJvd25cbiAqIGF3YXkgd2hlbmV2ZXIgdGhlIGB7a2V5OnZhbHVlfWAgbWFwIGVudHJpZXMgY2hhbmdlKS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG5vcm1hbGl6ZUludG9TdHlsaW5nTWFwKFxuICAgIGJpbmRpbmdWYWx1ZTogbnVsbCB8IFN0eWxpbmdNYXBBcnJheSxcbiAgICBuZXdWYWx1ZXM6IHtba2V5OiBzdHJpbmddOiBhbnl9IHwgc3RyaW5nIHwgbnVsbCB8IHVuZGVmaW5lZCxcbiAgICBub3JtYWxpemVQcm9wcz86IGJvb2xlYW4pOiBTdHlsaW5nTWFwQXJyYXkge1xuICBjb25zdCBzdHlsaW5nTWFwQXJyOiBTdHlsaW5nTWFwQXJyYXkgPVxuICAgICAgQXJyYXkuaXNBcnJheShiaW5kaW5nVmFsdWUpID8gYmluZGluZ1ZhbHVlIDogYWxsb2NTdHlsaW5nTWFwQXJyYXkobnVsbCk7XG4gIHN0eWxpbmdNYXBBcnJbU3R5bGluZ01hcEFycmF5SW5kZXguUmF3VmFsdWVQb3NpdGlvbl0gPSBuZXdWYWx1ZXM7XG5cbiAgLy8gYmVjYXVzZSB0aGUgbmV3IHZhbHVlcyBtYXkgbm90IGluY2x1ZGUgYWxsIHRoZSBwcm9wZXJ0aWVzXG4gIC8vIHRoYXQgdGhlIG9sZCBvbmVzIGhhZCwgYWxsIHZhbHVlcyBhcmUgc2V0IHRvIGBudWxsYCBiZWZvcmVcbiAgLy8gdGhlIG5ldyB2YWx1ZXMgYXJlIGFwcGxpZWQuIFRoaXMgd2F5LCB3aGVuIGZsdXNoZWQsIHRoZVxuICAvLyBzdHlsaW5nIGFsZ29yaXRobSBrbm93cyBleGFjdGx5IHdoYXQgc3R5bGUvY2xhc3MgdmFsdWVzXG4gIC8vIHRvIHJlbW92ZSBmcm9tIHRoZSBlbGVtZW50IChzaW5jZSB0aGV5IGFyZSBgbnVsbGApLlxuICBmb3IgKGxldCBqID0gU3R5bGluZ01hcEFycmF5SW5kZXguVmFsdWVzU3RhcnRQb3NpdGlvbjsgaiA8IHN0eWxpbmdNYXBBcnIubGVuZ3RoO1xuICAgICAgIGogKz0gU3R5bGluZ01hcEFycmF5SW5kZXguVHVwbGVTaXplKSB7XG4gICAgc2V0TWFwVmFsdWUoc3R5bGluZ01hcEFyciwgaiwgbnVsbCk7XG4gIH1cblxuICBsZXQgcHJvcHM6IHN0cmluZ1tdfG51bGwgPSBudWxsO1xuICBsZXQgbWFwOiB7W2tleTogc3RyaW5nXTogYW55fXx1bmRlZmluZWR8bnVsbDtcbiAgbGV0IGFsbFZhbHVlc1RydWUgPSBmYWxzZTtcbiAgaWYgKHR5cGVvZiBuZXdWYWx1ZXMgPT09ICdzdHJpbmcnKSB7ICAvLyBbY2xhc3NdIGJpbmRpbmdzIGFsbG93IHN0cmluZyB2YWx1ZXNcbiAgICBwcm9wcyA9IHNwbGl0T25XaGl0ZXNwYWNlKG5ld1ZhbHVlcyk7XG4gICAgYWxsVmFsdWVzVHJ1ZSA9IHByb3BzICE9PSBudWxsO1xuICB9IGVsc2Uge1xuICAgIHByb3BzID0gbmV3VmFsdWVzID8gT2JqZWN0LmtleXMobmV3VmFsdWVzKSA6IG51bGw7XG4gICAgbWFwID0gbmV3VmFsdWVzO1xuICB9XG5cbiAgaWYgKHByb3BzKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwcm9wcy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgcHJvcCA9IHByb3BzW2ldO1xuICAgICAgY29uc3QgbmV3UHJvcCA9IG5vcm1hbGl6ZVByb3BzID8gaHlwaGVuYXRlKHByb3ApIDogcHJvcDtcbiAgICAgIGNvbnN0IHZhbHVlID0gYWxsVmFsdWVzVHJ1ZSA/IHRydWUgOiBtYXAgIVtwcm9wXTtcbiAgICAgIGFkZEl0ZW1Ub1N0eWxpbmdNYXAoc3R5bGluZ01hcEFyciwgbmV3UHJvcCwgdmFsdWUsIHRydWUpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBzdHlsaW5nTWFwQXJyO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc3BsaXRPbldoaXRlc3BhY2UodGV4dDogc3RyaW5nKTogc3RyaW5nW118bnVsbCB7XG4gIGxldCBhcnJheTogc3RyaW5nW118bnVsbCA9IG51bGw7XG4gIGxldCBsZW5ndGggPSB0ZXh0Lmxlbmd0aDtcbiAgbGV0IHN0YXJ0ID0gMDtcbiAgbGV0IGZvdW5kQ2hhciA9IGZhbHNlO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3QgY2hhciA9IHRleHQuY2hhckNvZGVBdChpKTtcbiAgICBpZiAoY2hhciA8PSAzMiAvKicgJyovKSB7XG4gICAgICBpZiAoZm91bmRDaGFyKSB7XG4gICAgICAgIGlmIChhcnJheSA9PT0gbnVsbCkgYXJyYXkgPSBbXTtcbiAgICAgICAgYXJyYXkucHVzaCh0ZXh0LnN1YnN0cmluZyhzdGFydCwgaSkpO1xuICAgICAgICBmb3VuZENoYXIgPSBmYWxzZTtcbiAgICAgIH1cbiAgICAgIHN0YXJ0ID0gaSArIDE7XG4gICAgfSBlbHNlIHtcbiAgICAgIGZvdW5kQ2hhciA9IHRydWU7XG4gICAgfVxuICB9XG4gIGlmIChmb3VuZENoYXIpIHtcbiAgICBpZiAoYXJyYXkgPT09IG51bGwpIGFycmF5ID0gW107XG4gICAgYXJyYXkucHVzaCh0ZXh0LnN1YnN0cmluZyhzdGFydCwgbGVuZ3RoKSk7XG4gICAgZm91bmRDaGFyID0gZmFsc2U7XG4gIH1cbiAgcmV0dXJuIGFycmF5O1xufVxuXG4vLyBUT0RPIChtYXRza298QW5kcmV3S3VzaG5pcik6IHJlZmFjdG9yIHRoaXMgb25jZSB3ZSBmaWd1cmUgb3V0IGhvdyB0byBnZW5lcmF0ZSBzZXBhcmF0ZVxuLy8gYGlucHV0KCdjbGFzcycpICsgY2xhc3NNYXAoKWAgaW5zdHJ1Y3Rpb25zLlxuZXhwb3J0IGZ1bmN0aW9uIHNlbGVjdENsYXNzQmFzZWRJbnB1dE5hbWUoaW5wdXRzOiBQcm9wZXJ0eUFsaWFzZXMpOiBzdHJpbmcge1xuICByZXR1cm4gaW5wdXRzLmhhc093blByb3BlcnR5KCdjbGFzcycpID8gJ2NsYXNzJyA6ICdjbGFzc05hbWUnO1xufVxuIl19