/**
 * @fileoverview added by tsickle
 * Generated from: packages/core/src/render3/util/styling_utils.ts
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
    return [
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
 * @param {?} tNode
 * @param {?} flag
 * @return {?}
 */
export function hasConfig(tNode, flag) {
    return (tNode.flags & flag) !== 0;
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
 * @param {?} tNode
 * @param {?} isClassBased
 * @param {?} firstUpdatePass
 * @return {?}
 */
export function allowDirectStyling(tNode, isClassBased, firstUpdatePass) {
    /** @type {?} */
    let allow = false;
    // if no directives are present then we do not need populate a context at all. This
    // is because duplicate prop bindings cannot be registered through the template. If
    // and when this happens we can safely apply the value directly without context
    // resolution...
    /** @type {?} */
    const hasDirectives = hasConfig(tNode, 128 /* hasHostBindings */);
    if (!hasDirectives) {
        // `ngDevMode` is required to be checked here because tests/debugging rely on the context being
        // populated. If things are in production mode then there is no need to build a context
        // therefore the direct apply can be allowed (even on the first update).
        allow = ngDevMode ? !firstUpdatePass : true;
    }
    else if (!firstUpdatePass) {
        /** @type {?} */
        const duplicateStylingFlag = isClassBased ? 8192 /* hasDuplicateClassBindings */ : 262144 /* hasDuplicateStyleBindings */;
        /** @type {?} */
        const hasDuplicates = hasConfig(tNode, duplicateStylingFlag);
        /** @type {?} */
        const hasOnlyMapOrPropsFlag = isClassBased ? 1536 /* hasClassPropAndMapBindings */ :
            49152 /* hasStylePropAndMapBindings */;
        /** @type {?} */
        const hasOnlyMapsOrOnlyProps = (tNode.flags & hasOnlyMapOrPropsFlag) !== hasOnlyMapOrPropsFlag;
        allow = !hasDuplicates && hasOnlyMapsOrOnlyProps;
    }
    return allow;
}
/**
 * @param {?} tNode
 * @param {?} flag
 * @return {?}
 */
export function patchConfig(tNode, flag) {
    tNode.flags |= flag;
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
    return context[0 /* TotalSourcesPosition */];
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
 * @param {?} tNode
 * @param {?} isClassBased
 * @return {?}
 */
export function getPropValuesStartPosition(context, tNode, isClassBased) {
    /** @type {?} */
    let startPosition = 2 /* ValuesStartPosition */;
    /** @type {?} */
    const flag = isClassBased ? 512 /* hasClassMapBindings */ : 16384 /* hasStyleMapBindings */;
    if (hasConfig(tNode, flag)) {
        startPosition += 4 /* BindingsStartOffset */ + getValuesCount(context);
    }
    return startPosition;
}
/**
 * @param {?} a
 * @param {?} b
 * @return {?}
 */
export function hasValueChangedUnwrapSafeValue(a, b) {
    return hasValueChanged(unwrapSafeValue(a), unwrapSafeValue(b));
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
    // TODO(misko): remove after TNode.classes/styles becomes `string` only
    if (typeof value === 'string')
        return null;
    return isStylingContext(value) ?
        ((/** @type {?} */ (value)))[1 /* InitialStylingValuePosition */] :
        (/** @type {?} */ (value));
}
/**
 * @param {?} value
 * @return {?}
 */
export function isStylingContext(value) {
    // the StylingMapArray is in the format of [initial, prop, string, prop, string]
    // and this is the defining value to distinguish between arrays
    return Array.isArray(value) && value.length >= 2 /* ValuesStartPosition */ &&
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
    // TODO(misko): remove after TNode.classes/styles becomes `string` only
    if (typeof context === 'string')
        return context;
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
        if (char <= 32 /* SPACE */) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3R5bGluZ191dGlscy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvdXRpbC9zdHlsaW5nX3V0aWxzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQU9BLE9BQU8sRUFBQyxlQUFlLEVBQUMsTUFBTSwyQkFBMkIsQ0FBQztBQUkxRCxPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sV0FBVyxDQUFDOztBQUVwQyxNQUFNLE9BQU8seUJBQXlCLEdBQUcsT0FBTzs7QUFDaEQsTUFBTSxPQUFPLHdCQUF3QixHQUFHLENBQUM7Ozs7Ozs7Ozs7QUFVekMsTUFBTSxPQUFPLHFCQUFxQixHQUFHLElBQUk7O0FBRXpDLE1BQU0sT0FBTyxxQkFBcUIsR0FBRyxDQUFDOztNQUVoQyxxQkFBcUIsR0FBRyxDQUFDOzs7Ozs7O0FBTy9CLE1BQU0sT0FBTyx3QkFBd0IsR0FBRyxHQUFHOzs7Ozs7Ozs7Ozs7QUFVM0MsTUFBTSxVQUFVLG9CQUFvQixDQUNoQyxjQUFzQyxFQUFFLGFBQXNCO0lBQ2hFLGNBQWMsR0FBRyxjQUFjLElBQUksb0JBQW9CLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDOUQsT0FBTztRQUNMLHFCQUFxQjtRQUNyQixjQUFjO0tBQ2YsQ0FBQztBQUNKLENBQUM7Ozs7O0FBRUQsTUFBTSxVQUFVLG9CQUFvQixDQUFDLEtBQXlCO0lBQzVELE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUNqQixDQUFDOzs7Ozs7QUFFRCxNQUFNLFVBQVUsU0FBUyxDQUFDLEtBQW1CLEVBQUUsSUFBZ0I7SUFDN0QsT0FBTyxDQUFDLEtBQUssQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQ3BDLENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7QUFhRCxNQUFNLFVBQVUsa0JBQWtCLENBQzlCLEtBQW1CLEVBQUUsWUFBcUIsRUFBRSxlQUF3Qjs7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RUFBRTtnQkFDYixJQUFJLEtBQUssS0FBSyxJQUFJO29CQUFFLEtBQUssR0FBRyxFQUFFLENBQUM7Z0JBQy9CLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDckMsU0FBUyxHQUFHLEtBQUssQ0FBQzthQUNuQjtZQUNELEtBQUssR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1NBQ2Y7YUFBTTtZQUNMLFNBQVMsR0FBRyxJQUFJLENBQUM7U0FDbEI7S0FDRjtJQUNELElBQUksU0FBUyxFQUFFO1FBQ2IsSUFBSSxLQUFLLEtBQUssSUFBSTtZQUFFLEtBQUssR0FBRyxFQUFFLENBQUM7UUFDL0IsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDO1FBQzFDLFNBQVMsR0FBRyxLQUFLLENBQUM7S0FDbkI7SUFDRCxPQUFPLEtBQUssQ0FBQztBQUNmLENBQUM7Ozs7Ozs7QUFJRCxNQUFNLFVBQVUseUJBQXlCLENBQUMsTUFBdUI7SUFDL0QsT0FBTyxNQUFNLENBQUMsY0FBYyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQztBQUNoRSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4qIEBsaWNlbnNlXG4qIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuKlxuKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4qL1xuaW1wb3J0IHt1bndyYXBTYWZlVmFsdWV9IGZyb20gJy4uLy4uL3Nhbml0aXphdGlvbi9ieXBhc3MnO1xuaW1wb3J0IHtDaGFyQ29kZX0gZnJvbSAnLi4vLi4vdXRpbC9jaGFyX2NvZGUnO1xuaW1wb3J0IHtQcm9wZXJ0eUFsaWFzZXMsIFROb2RlRmxhZ3N9IGZyb20gJy4uL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge0xTdHlsaW5nRGF0YSwgU3R5bGluZ01hcEFycmF5LCBTdHlsaW5nTWFwQXJyYXlJbmRleCwgVFN0eWxpbmdDb250ZXh0LCBUU3R5bGluZ0NvbnRleHRJbmRleCwgVFN0eWxpbmdDb250ZXh0UHJvcENvbmZpZ0ZsYWdzLCBUU3R5bGluZ05vZGV9IGZyb20gJy4uL2ludGVyZmFjZXMvc3R5bGluZyc7XG5pbXBvcnQge05PX0NIQU5HRX0gZnJvbSAnLi4vdG9rZW5zJztcblxuZXhwb3J0IGNvbnN0IE1BUF9CQVNFRF9FTlRSWV9QUk9QX05BTUUgPSAnW01BUF0nO1xuZXhwb3J0IGNvbnN0IFRFTVBMQVRFX0RJUkVDVElWRV9JTkRFWCA9IDA7XG5cbi8qKlxuICogRGVmYXVsdCBmYWxsYmFjayB2YWx1ZSBmb3IgYSBzdHlsaW5nIGJpbmRpbmcuXG4gKlxuICogQSB2YWx1ZSBvZiBgbnVsbGAgaXMgdXNlZCBoZXJlIHdoaWNoIHNpZ25hbHMgdG8gdGhlIHN0eWxpbmcgYWxnb3JpdGhtIHRoYXRcbiAqIHRoZSBzdHlsaW5nIHZhbHVlIGlzIG5vdCBwcmVzZW50LiBUaGlzIHdheSBpZiB0aGVyZSBhcmUgbm8gb3RoZXIgdmFsdWVzXG4gKiBkZXRlY3RlZCB0aGVuIGl0IHdpbGwgYmUgcmVtb3ZlZCBvbmNlIHRoZSBzdHlsZS9jbGFzcyBwcm9wZXJ0eSBpcyBkaXJ0eSBhbmRcbiAqIGRpZmZlZCB3aXRoaW4gdGhlIHN0eWxpbmcgYWxnb3JpdGhtIHByZXNlbnQgaW4gYGZsdXNoU3R5bGluZ2AuXG4gKi9cbmV4cG9ydCBjb25zdCBERUZBVUxUX0JJTkRJTkdfVkFMVUUgPSBudWxsO1xuXG5leHBvcnQgY29uc3QgREVGQVVMVF9CSU5ESU5HX0lOREVYID0gMDtcblxuY29uc3QgREVGQVVMVF9UT1RBTF9TT1VSQ0VTID0gMTtcblxuLy8gVGhlIGZpcnN0IGJpdCB2YWx1ZSByZWZsZWN0cyBhIG1hcC1iYXNlZCBiaW5kaW5nIHZhbHVlJ3MgYml0LlxuLy8gVGhlIHJlYXNvbiB3aHkgaXQncyBhbHdheXMgYWN0aXZhdGVkIGZvciBldmVyeSBlbnRyeSBpbiB0aGUgbWFwXG4vLyBpcyBzbyB0aGF0IGlmIGFueSBtYXAtYmluZGluZyB2YWx1ZXMgdXBkYXRlIHRoZW4gYWxsIG90aGVyIHByb3Bcbi8vIGJhc2VkIGJpbmRpbmdzIHdpbGwgcGFzcyB0aGUgZ3VhcmQgY2hlY2sgYXV0b21hdGljYWxseSB3aXRob3V0XG4vLyBhbnkgZXh0cmEgY29kZSBvciBmbGFncy5cbmV4cG9ydCBjb25zdCBERUZBVUxUX0dVQVJEX01BU0tfVkFMVUUgPSAwYjE7XG5cbi8qKlxuICogQ3JlYXRlcyBhIG5ldyBpbnN0YW5jZSBvZiB0aGUgYFRTdHlsaW5nQ29udGV4dGAuXG4gKlxuICogVGhlIGBUU3R5bGluZ0NvbnRleHRgIGlzIHVzZWQgYXMgYSBtYW5pZmVzdCBvZiBhbGwgc3R5bGUgb3IgYWxsIGNsYXNzIGJpbmRpbmdzIG9uXG4gKiBhbiBlbGVtZW50LiBCZWNhdXNlIGl0IGlzIGEgVC1sZXZlbCBkYXRhLXN0cnVjdHVyZSwgaXQgaXMgb25seSBjcmVhdGVkIG9uY2UgcGVyXG4gKiB0Tm9kZSBmb3Igc3R5bGVzIGFuZCBmb3IgY2xhc3Nlcy4gVGhpcyBmdW5jdGlvbiBhbGxvY2F0ZXMgYSBuZXcgaW5zdGFuY2Ugb2YgYVxuICogYFRTdHlsaW5nQ29udGV4dGAgd2l0aCB0aGUgaW5pdGlhbCB2YWx1ZXMgKHNlZSBgaW50ZXJmYWNlcy50c2AgZm9yIG1vcmUgaW5mbykuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhbGxvY1RTdHlsaW5nQ29udGV4dChcbiAgICBpbml0aWFsU3R5bGluZzogU3R5bGluZ01hcEFycmF5IHwgbnVsbCwgaGFzRGlyZWN0aXZlczogYm9vbGVhbik6IFRTdHlsaW5nQ29udGV4dCB7XG4gIGluaXRpYWxTdHlsaW5nID0gaW5pdGlhbFN0eWxpbmcgfHwgYWxsb2NTdHlsaW5nTWFwQXJyYXkobnVsbCk7XG4gIHJldHVybiBbXG4gICAgREVGQVVMVF9UT1RBTF9TT1VSQ0VTLCAgLy8gMSkgdG90YWwgYW1vdW50IG9mIHN0eWxpbmcgc291cmNlcyAodGVtcGxhdGUsIGRpcmVjdGl2ZXMsIGV0Yy4uLilcbiAgICBpbml0aWFsU3R5bGluZywgICAgICAgICAvLyAyKSBpbml0aWFsIHN0eWxpbmcgdmFsdWVzXG4gIF07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhbGxvY1N0eWxpbmdNYXBBcnJheSh2YWx1ZToge30gfCBzdHJpbmcgfCBudWxsKTogU3R5bGluZ01hcEFycmF5IHtcbiAgcmV0dXJuIFt2YWx1ZV07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBoYXNDb25maWcodE5vZGU6IFRTdHlsaW5nTm9kZSwgZmxhZzogVE5vZGVGbGFncykge1xuICByZXR1cm4gKHROb2RlLmZsYWdzICYgZmxhZykgIT09IDA7XG59XG5cbi8qKlxuICogRGV0ZXJtaW5lcyB3aGV0aGVyIG9yIG5vdCB0byBhcHBseSBzdHlsZXMvY2xhc3NlcyBkaXJlY3RseSBvciB2aWEgY29udGV4dCByZXNvbHV0aW9uLlxuICpcbiAqIFRoZXJlIGFyZSB0aHJlZSBjYXNlcyB0aGF0IGFyZSBtYXRjaGVkIGhlcmU6XG4gKiAxLiB0aGVyZSBhcmUgbm8gZGlyZWN0aXZlcyBwcmVzZW50IEFORCBgbmdEZXZNb2RlYCBpcyBmYWxzeVxuICogMi4gdGhlIGBmaXJzdFVwZGF0ZVBhc3NgIGhhcyBub3QgYWxyZWFkeSBydW4gKHdoaWNoIG1lYW5zIHRoYXRcbiAqICAgIHRoZXJlIGFyZSBtb3JlIGJpbmRpbmdzIHRvIHJlZ2lzdGVyIGFuZCwgdGhlcmVmb3JlLCBkaXJlY3RcbiAqICAgIHN0eWxlL2NsYXNzIGFwcGxpY2F0aW9uIGlzIG5vdCB5ZXQgcG9zc2libGUpXG4gKiAzLiBUaGVyZSBhcmUgbm8gY29sbGlzaW9ucyAoaS5lLiBwcm9wZXJ0aWVzIHdpdGggbW9yZSB0aGFuIG9uZSBiaW5kaW5nKSBhY3Jvc3MgbXVsdGlwbGVcbiAqICAgIHNvdXJjZXMgKGkuZS4gdGVtcGxhdGUgKyBkaXJlY3RpdmUsIGRpcmVjdGl2ZSArIGRpcmVjdGl2ZSwgZGlyZWN0aXZlICsgY29tcG9uZW50KVxuICovXG5leHBvcnQgZnVuY3Rpb24gYWxsb3dEaXJlY3RTdHlsaW5nKFxuICAgIHROb2RlOiBUU3R5bGluZ05vZGUsIGlzQ2xhc3NCYXNlZDogYm9vbGVhbiwgZmlyc3RVcGRhdGVQYXNzOiBib29sZWFuKTogYm9vbGVhbiB7XG4gIGxldCBhbGxvdyA9IGZhbHNlO1xuXG4gIC8vIGlmIG5vIGRpcmVjdGl2ZXMgYXJlIHByZXNlbnQgdGhlbiB3ZSBkbyBub3QgbmVlZCBwb3B1bGF0ZSBhIGNvbnRleHQgYXQgYWxsLiBUaGlzXG4gIC8vIGlzIGJlY2F1c2UgZHVwbGljYXRlIHByb3AgYmluZGluZ3MgY2Fubm90IGJlIHJlZ2lzdGVyZWQgdGhyb3VnaCB0aGUgdGVtcGxhdGUuIElmXG4gIC8vIGFuZCB3aGVuIHRoaXMgaGFwcGVucyB3ZSBjYW4gc2FmZWx5IGFwcGx5IHRoZSB2YWx1ZSBkaXJlY3RseSB3aXRob3V0IGNvbnRleHRcbiAgLy8gcmVzb2x1dGlvbi4uLlxuICBjb25zdCBoYXNEaXJlY3RpdmVzID0gaGFzQ29uZmlnKHROb2RlLCBUTm9kZUZsYWdzLmhhc0hvc3RCaW5kaW5ncyk7XG4gIGlmICghaGFzRGlyZWN0aXZlcykge1xuICAgIC8vIGBuZ0Rldk1vZGVgIGlzIHJlcXVpcmVkIHRvIGJlIGNoZWNrZWQgaGVyZSBiZWNhdXNlIHRlc3RzL2RlYnVnZ2luZyByZWx5IG9uIHRoZSBjb250ZXh0IGJlaW5nXG4gICAgLy8gcG9wdWxhdGVkLiBJZiB0aGluZ3MgYXJlIGluIHByb2R1Y3Rpb24gbW9kZSB0aGVuIHRoZXJlIGlzIG5vIG5lZWQgdG8gYnVpbGQgYSBjb250ZXh0XG4gICAgLy8gdGhlcmVmb3JlIHRoZSBkaXJlY3QgYXBwbHkgY2FuIGJlIGFsbG93ZWQgKGV2ZW4gb24gdGhlIGZpcnN0IHVwZGF0ZSkuXG4gICAgYWxsb3cgPSBuZ0Rldk1vZGUgPyAhZmlyc3RVcGRhdGVQYXNzIDogdHJ1ZTtcbiAgfSBlbHNlIGlmICghZmlyc3RVcGRhdGVQYXNzKSB7XG4gICAgY29uc3QgZHVwbGljYXRlU3R5bGluZ0ZsYWcgPVxuICAgICAgICBpc0NsYXNzQmFzZWQgPyBUTm9kZUZsYWdzLmhhc0R1cGxpY2F0ZUNsYXNzQmluZGluZ3MgOiBUTm9kZUZsYWdzLmhhc0R1cGxpY2F0ZVN0eWxlQmluZGluZ3M7XG4gICAgY29uc3QgaGFzRHVwbGljYXRlcyA9IGhhc0NvbmZpZyh0Tm9kZSwgZHVwbGljYXRlU3R5bGluZ0ZsYWcpO1xuICAgIGNvbnN0IGhhc09ubHlNYXBPclByb3BzRmxhZyA9IGlzQ2xhc3NCYXNlZCA/IFROb2RlRmxhZ3MuaGFzQ2xhc3NQcm9wQW5kTWFwQmluZGluZ3MgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFROb2RlRmxhZ3MuaGFzU3R5bGVQcm9wQW5kTWFwQmluZGluZ3M7XG4gICAgY29uc3QgaGFzT25seU1hcHNPck9ubHlQcm9wcyA9ICh0Tm9kZS5mbGFncyAmIGhhc09ubHlNYXBPclByb3BzRmxhZykgIT09IGhhc09ubHlNYXBPclByb3BzRmxhZztcbiAgICBhbGxvdyA9ICFoYXNEdXBsaWNhdGVzICYmIGhhc09ubHlNYXBzT3JPbmx5UHJvcHM7XG4gIH1cblxuICByZXR1cm4gYWxsb3c7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwYXRjaENvbmZpZyh0Tm9kZTogVFN0eWxpbmdOb2RlLCBmbGFnOiBUTm9kZUZsYWdzKTogdm9pZCB7XG4gIHROb2RlLmZsYWdzIHw9IGZsYWc7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRQcm9wKGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCwgaW5kZXg6IG51bWJlcik6IHN0cmluZyB7XG4gIHJldHVybiBjb250ZXh0W2luZGV4ICsgVFN0eWxpbmdDb250ZXh0SW5kZXguUHJvcE9mZnNldF0gYXMgc3RyaW5nO1xufVxuXG5mdW5jdGlvbiBnZXRQcm9wQ29uZmlnKGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCwgaW5kZXg6IG51bWJlcik6IG51bWJlciB7XG4gIHJldHVybiAoY29udGV4dFtpbmRleCArIFRTdHlsaW5nQ29udGV4dEluZGV4LkNvbmZpZ09mZnNldF0gYXMgbnVtYmVyKSAmXG4gICAgICBUU3R5bGluZ0NvbnRleHRQcm9wQ29uZmlnRmxhZ3MuTWFzaztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzU2FuaXRpemF0aW9uUmVxdWlyZWQoY29udGV4dDogVFN0eWxpbmdDb250ZXh0LCBpbmRleDogbnVtYmVyKTogYm9vbGVhbiB7XG4gIHJldHVybiAoZ2V0UHJvcENvbmZpZyhjb250ZXh0LCBpbmRleCkgJiBUU3R5bGluZ0NvbnRleHRQcm9wQ29uZmlnRmxhZ3MuU2FuaXRpemF0aW9uUmVxdWlyZWQpICE9PVxuICAgICAgMDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEd1YXJkTWFzayhcbiAgICBjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQsIGluZGV4OiBudW1iZXIsIGlzSG9zdEJpbmRpbmc6IGJvb2xlYW4pOiBudW1iZXIge1xuICBjb25zdCBwb3NpdGlvbiA9IGluZGV4ICsgKGlzSG9zdEJpbmRpbmcgPyBUU3R5bGluZ0NvbnRleHRJbmRleC5Ib3N0QmluZGluZ3NCaXRHdWFyZE9mZnNldCA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFRTdHlsaW5nQ29udGV4dEluZGV4LlRlbXBsYXRlQml0R3VhcmRPZmZzZXQpO1xuICByZXR1cm4gY29udGV4dFtwb3NpdGlvbl0gYXMgbnVtYmVyO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2V0R3VhcmRNYXNrKFxuICAgIGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCwgaW5kZXg6IG51bWJlciwgbWFza1ZhbHVlOiBudW1iZXIsIGlzSG9zdEJpbmRpbmc6IGJvb2xlYW4pIHtcbiAgY29uc3QgcG9zaXRpb24gPSBpbmRleCArIChpc0hvc3RCaW5kaW5nID8gVFN0eWxpbmdDb250ZXh0SW5kZXguSG9zdEJpbmRpbmdzQml0R3VhcmRPZmZzZXQgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBUU3R5bGluZ0NvbnRleHRJbmRleC5UZW1wbGF0ZUJpdEd1YXJkT2Zmc2V0KTtcbiAgY29udGV4dFtwb3NpdGlvbl0gPSBtYXNrVmFsdWU7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRWYWx1ZXNDb3VudChjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQpOiBudW1iZXIge1xuICByZXR1cm4gZ2V0VG90YWxTb3VyY2VzKGNvbnRleHQpICsgMTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFRvdGFsU291cmNlcyhjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQpOiBudW1iZXIge1xuICByZXR1cm4gY29udGV4dFtUU3R5bGluZ0NvbnRleHRJbmRleC5Ub3RhbFNvdXJjZXNQb3NpdGlvbl07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRCaW5kaW5nVmFsdWUoY29udGV4dDogVFN0eWxpbmdDb250ZXh0LCBpbmRleDogbnVtYmVyLCBvZmZzZXQ6IG51bWJlcikge1xuICByZXR1cm4gY29udGV4dFtpbmRleCArIFRTdHlsaW5nQ29udGV4dEluZGV4LkJpbmRpbmdzU3RhcnRPZmZzZXQgKyBvZmZzZXRdIGFzIG51bWJlciB8IHN0cmluZztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldERlZmF1bHRWYWx1ZShjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQsIGluZGV4OiBudW1iZXIpOiBzdHJpbmd8Ym9vbGVhbnxudWxsIHtcbiAgcmV0dXJuIGNvbnRleHRbaW5kZXggKyBUU3R5bGluZ0NvbnRleHRJbmRleC5CaW5kaW5nc1N0YXJ0T2Zmc2V0ICsgZ2V0VG90YWxTb3VyY2VzKGNvbnRleHQpXSBhc1xuICAgICAgICAgICAgIHN0cmluZyB8XG4gICAgICBib29sZWFuIHwgbnVsbDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNldERlZmF1bHRWYWx1ZShcbiAgICBjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQsIGluZGV4OiBudW1iZXIsIHZhbHVlOiBzdHJpbmcgfCBib29sZWFuIHwgbnVsbCkge1xuICByZXR1cm4gY29udGV4dFtpbmRleCArIFRTdHlsaW5nQ29udGV4dEluZGV4LkJpbmRpbmdzU3RhcnRPZmZzZXQgKyBnZXRUb3RhbFNvdXJjZXMoY29udGV4dCldID1cbiAgICAgICAgICAgICB2YWx1ZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNldFZhbHVlKGRhdGE6IExTdHlsaW5nRGF0YSwgYmluZGluZ0luZGV4OiBudW1iZXIsIHZhbHVlOiBhbnkpIHtcbiAgZGF0YVtiaW5kaW5nSW5kZXhdID0gdmFsdWU7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRWYWx1ZTxUID0gYW55PihkYXRhOiBMU3R5bGluZ0RhdGEsIGJpbmRpbmdJbmRleDogbnVtYmVyKTogVHxudWxsIHtcbiAgcmV0dXJuIGJpbmRpbmdJbmRleCAhPT0gMCA/IGRhdGFbYmluZGluZ0luZGV4XSBhcyBUIDogbnVsbDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFByb3BWYWx1ZXNTdGFydFBvc2l0aW9uKFxuICAgIGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCwgdE5vZGU6IFRTdHlsaW5nTm9kZSwgaXNDbGFzc0Jhc2VkOiBib29sZWFuKSB7XG4gIGxldCBzdGFydFBvc2l0aW9uID0gVFN0eWxpbmdDb250ZXh0SW5kZXguVmFsdWVzU3RhcnRQb3NpdGlvbjtcbiAgY29uc3QgZmxhZyA9IGlzQ2xhc3NCYXNlZCA/IFROb2RlRmxhZ3MuaGFzQ2xhc3NNYXBCaW5kaW5ncyA6IFROb2RlRmxhZ3MuaGFzU3R5bGVNYXBCaW5kaW5ncztcbiAgaWYgKGhhc0NvbmZpZyh0Tm9kZSwgZmxhZykpIHtcbiAgICBzdGFydFBvc2l0aW9uICs9IFRTdHlsaW5nQ29udGV4dEluZGV4LkJpbmRpbmdzU3RhcnRPZmZzZXQgKyBnZXRWYWx1ZXNDb3VudChjb250ZXh0KTtcbiAgfVxuICByZXR1cm4gc3RhcnRQb3NpdGlvbjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGhhc1ZhbHVlQ2hhbmdlZFVud3JhcFNhZmVWYWx1ZShcbiAgICBhOiBOT19DSEFOR0UgfCBTdHlsaW5nTWFwQXJyYXkgfCBudW1iZXIgfCBTdHJpbmcgfCBzdHJpbmcgfCBudWxsIHwgYm9vbGVhbiB8IHVuZGVmaW5lZCB8IHt9LFxuICAgIGI6IE5PX0NIQU5HRSB8IFN0eWxpbmdNYXBBcnJheSB8IG51bWJlciB8IFN0cmluZyB8IHN0cmluZyB8IG51bGwgfCBib29sZWFuIHwgdW5kZWZpbmVkIHxcbiAgICAgICAge30pOiBib29sZWFuIHtcbiAgcmV0dXJuIGhhc1ZhbHVlQ2hhbmdlZCh1bndyYXBTYWZlVmFsdWUoYSksIHVud3JhcFNhZmVWYWx1ZShiKSk7XG59XG5cblxuZXhwb3J0IGZ1bmN0aW9uIGhhc1ZhbHVlQ2hhbmdlZChcbiAgICBhOiBOT19DSEFOR0UgfCBTdHlsaW5nTWFwQXJyYXkgfCBudW1iZXIgfCBzdHJpbmcgfCBudWxsIHwgYm9vbGVhbiB8IHVuZGVmaW5lZCB8IHt9LFxuICAgIGI6IE5PX0NIQU5HRSB8IFN0eWxpbmdNYXBBcnJheSB8IG51bWJlciB8IHN0cmluZyB8IG51bGwgfCBib29sZWFuIHwgdW5kZWZpbmVkIHwge30pOiBib29sZWFuIHtcbiAgaWYgKGIgPT09IE5PX0NIQU5HRSkgcmV0dXJuIGZhbHNlO1xuXG4gIGNvbnN0IGNvbXBhcmVWYWx1ZUEgPSBBcnJheS5pc0FycmF5KGEpID8gYVtTdHlsaW5nTWFwQXJyYXlJbmRleC5SYXdWYWx1ZVBvc2l0aW9uXSA6IGE7XG4gIGNvbnN0IGNvbXBhcmVWYWx1ZUIgPSBBcnJheS5pc0FycmF5KGIpID8gYltTdHlsaW5nTWFwQXJyYXlJbmRleC5SYXdWYWx1ZVBvc2l0aW9uXSA6IGI7XG4gIHJldHVybiAhT2JqZWN0LmlzKGNvbXBhcmVWYWx1ZUEsIGNvbXBhcmVWYWx1ZUIpO1xufVxuXG4vKipcbiAqIERldGVybWluZXMgd2hldGhlciB0aGUgcHJvdmlkZWQgc3R5bGluZyB2YWx1ZSBpcyB0cnV0aHkgb3IgZmFsc3kuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpc1N0eWxpbmdWYWx1ZURlZmluZWQ8VCBleHRlbmRzIHN0cmluZ3xudW1iZXJ8e318bnVsbHx1bmRlZmluZWQ+KHZhbHVlOiBUKTpcbiAgICB2YWx1ZSBpcyBOb25OdWxsYWJsZTxUPiB7XG4gIC8vIHRoZSByZWFzb24gd2h5IG51bGwgaXMgY29tcGFyZWQgYWdhaW5zdCBpcyBiZWNhdXNlXG4gIC8vIGEgQ1NTIGNsYXNzIHZhbHVlIHRoYXQgaXMgc2V0IHRvIGBmYWxzZWAgbXVzdCBiZVxuICAvLyByZXNwZWN0ZWQgKG90aGVyd2lzZSBpdCB3b3VsZCBiZSB0cmVhdGVkIGFzIGZhbHN5KS5cbiAgLy8gRW1wdHkgc3RyaW5nIHZhbHVlcyBhcmUgYmVjYXVzZSBkZXZlbG9wZXJzIHVzdWFsbHlcbiAgLy8gc2V0IGEgdmFsdWUgdG8gYW4gZW1wdHkgc3RyaW5nIHRvIHJlbW92ZSBpdC5cbiAgcmV0dXJuIHZhbHVlICE9IG51bGwgJiYgdmFsdWUgIT09ICcnO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY29uY2F0U3RyaW5nKGE6IHN0cmluZywgYjogc3RyaW5nLCBzZXBhcmF0b3IgPSAnICcpOiBzdHJpbmcge1xuICByZXR1cm4gYSArICgoYi5sZW5ndGggJiYgYS5sZW5ndGgpID8gc2VwYXJhdG9yIDogJycpICsgYjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGh5cGhlbmF0ZSh2YWx1ZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHZhbHVlLnJlcGxhY2UoL1thLXpdW0EtWl0vZywgdiA9PiB2LmNoYXJBdCgwKSArICctJyArIHYuY2hhckF0KDEpKS50b0xvd2VyQ2FzZSgpO1xufVxuXG4vKipcbiAqIFJldHVybnMgYW4gaW5zdGFuY2Ugb2YgYFN0eWxpbmdNYXBBcnJheWAuXG4gKlxuICogVGhpcyBmdW5jdGlvbiBpcyBkZXNpZ25lZCB0byBmaW5kIGFuIGluc3RhbmNlIG9mIGBTdHlsaW5nTWFwQXJyYXlgIGluIGNhc2UgaXQgaXMgc3RvcmVkXG4gKiBpbnNpZGUgb2YgYW4gaW5zdGFuY2Ugb2YgYFRTdHlsaW5nQ29udGV4dGAuIFdoZW4gYSBzdHlsaW5nIGNvbnRleHQgaXMgY3JlYXRlZCBpdFxuICogd2lsbCBjb3B5IG92ZXIgYW4gaW5pdGlhbCBzdHlsaW5nIHZhbHVlcyBmcm9tIHRoZSB0Tm9kZSAod2hpY2ggYXJlIHN0b3JlZCBhcyBhXG4gKiBgU3R5bGluZ01hcEFycmF5YCBvbiB0aGUgYHROb2RlLmNsYXNzZXNgIG9yIGB0Tm9kZS5zdHlsZXNgIHZhbHVlcykuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRTdHlsaW5nTWFwQXJyYXkodmFsdWU6IFRTdHlsaW5nQ29udGV4dCB8IFN0eWxpbmdNYXBBcnJheSB8IHN0cmluZyB8IG51bGwpOlxuICAgIFN0eWxpbmdNYXBBcnJheXxudWxsIHtcbiAgLy8gVE9ETyhtaXNrbyk6IHJlbW92ZSBhZnRlciBUTm9kZS5jbGFzc2VzL3N0eWxlcyBiZWNvbWVzIGBzdHJpbmdgIG9ubHlcbiAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycpIHJldHVybiBudWxsO1xuICByZXR1cm4gaXNTdHlsaW5nQ29udGV4dCh2YWx1ZSkgP1xuICAgICAgKHZhbHVlIGFzIFRTdHlsaW5nQ29udGV4dClbVFN0eWxpbmdDb250ZXh0SW5kZXguSW5pdGlhbFN0eWxpbmdWYWx1ZVBvc2l0aW9uXSA6XG4gICAgICB2YWx1ZSBhcyBTdHlsaW5nTWFwQXJyYXk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc1N0eWxpbmdDb250ZXh0KHZhbHVlOiBhbnkpOiBib29sZWFuIHtcbiAgLy8gdGhlIFN0eWxpbmdNYXBBcnJheSBpcyBpbiB0aGUgZm9ybWF0IG9mIFtpbml0aWFsLCBwcm9wLCBzdHJpbmcsIHByb3AsIHN0cmluZ11cbiAgLy8gYW5kIHRoaXMgaXMgdGhlIGRlZmluaW5nIHZhbHVlIHRvIGRpc3Rpbmd1aXNoIGJldHdlZW4gYXJyYXlzXG4gIHJldHVybiBBcnJheS5pc0FycmF5KHZhbHVlKSAmJiB2YWx1ZS5sZW5ndGggPj0gVFN0eWxpbmdDb250ZXh0SW5kZXguVmFsdWVzU3RhcnRQb3NpdGlvbiAmJlxuICAgICAgdHlwZW9mIHZhbHVlWzFdICE9PSAnc3RyaW5nJztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzU3R5bGluZ01hcEFycmF5KHZhbHVlOiBhbnkpOiBib29sZWFuIHtcbiAgLy8gdGhlIFN0eWxpbmdNYXBBcnJheSBpcyBpbiB0aGUgZm9ybWF0IG9mIFtpbml0aWFsLCBwcm9wLCBzdHJpbmcsIHByb3AsIHN0cmluZ11cbiAgLy8gYW5kIHRoaXMgaXMgdGhlIGRlZmluaW5nIHZhbHVlIHRvIGRpc3Rpbmd1aXNoIGJldHdlZW4gYXJyYXlzXG4gIHJldHVybiBBcnJheS5pc0FycmF5KHZhbHVlKSAmJlxuICAgICAgKHR5cGVvZih2YWx1ZSBhcyBTdHlsaW5nTWFwQXJyYXkpW1N0eWxpbmdNYXBBcnJheUluZGV4LlZhbHVlc1N0YXJ0UG9zaXRpb25dID09PSAnc3RyaW5nJyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRJbml0aWFsU3R5bGluZ1ZhbHVlKGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCB8IFN0eWxpbmdNYXBBcnJheSB8IHN0cmluZyB8IG51bGwpOlxuICAgIHN0cmluZyB7XG4gIC8vIFRPRE8obWlza28pOiByZW1vdmUgYWZ0ZXIgVE5vZGUuY2xhc3Nlcy9zdHlsZXMgYmVjb21lcyBgc3RyaW5nYCBvbmx5XG4gIGlmICh0eXBlb2YgY29udGV4dCA9PT0gJ3N0cmluZycpIHJldHVybiBjb250ZXh0O1xuICBjb25zdCBtYXAgPSBnZXRTdHlsaW5nTWFwQXJyYXkoY29udGV4dCk7XG4gIHJldHVybiBtYXAgJiYgKG1hcFtTdHlsaW5nTWFwQXJyYXlJbmRleC5SYXdWYWx1ZVBvc2l0aW9uXSBhcyBzdHJpbmcgfCBudWxsKSB8fCAnJztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGhhc0NsYXNzSW5wdXQodE5vZGU6IFRTdHlsaW5nTm9kZSkge1xuICByZXR1cm4gKHROb2RlLmZsYWdzICYgVE5vZGVGbGFncy5oYXNDbGFzc0lucHV0KSAhPT0gMDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGhhc1N0eWxlSW5wdXQodE5vZGU6IFRTdHlsaW5nTm9kZSkge1xuICByZXR1cm4gKHROb2RlLmZsYWdzICYgVE5vZGVGbGFncy5oYXNTdHlsZUlucHV0KSAhPT0gMDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldE1hcFByb3AobWFwOiBTdHlsaW5nTWFwQXJyYXksIGluZGV4OiBudW1iZXIpOiBzdHJpbmcge1xuICByZXR1cm4gbWFwW2luZGV4ICsgU3R5bGluZ01hcEFycmF5SW5kZXguUHJvcE9mZnNldF0gYXMgc3RyaW5nO1xufVxuXG5jb25zdCBNQVBfRElSVFlfVkFMVUUgPVxuICAgIHR5cGVvZiBuZ0Rldk1vZGUgIT09ICd1bmRlZmluZWQnICYmIG5nRGV2TW9kZSA/IHt9IDoge01BUF9ESVJUWV9WQUxVRTogdHJ1ZX07XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXRNYXBBc0RpcnR5KG1hcDogU3R5bGluZ01hcEFycmF5KTogdm9pZCB7XG4gIG1hcFtTdHlsaW5nTWFwQXJyYXlJbmRleC5SYXdWYWx1ZVBvc2l0aW9uXSA9IE1BUF9ESVJUWV9WQUxVRTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNldE1hcFZhbHVlKFxuICAgIG1hcDogU3R5bGluZ01hcEFycmF5LCBpbmRleDogbnVtYmVyLCB2YWx1ZTogc3RyaW5nIHwgYm9vbGVhbiB8IG51bGwpOiB2b2lkIHtcbiAgbWFwW2luZGV4ICsgU3R5bGluZ01hcEFycmF5SW5kZXguVmFsdWVPZmZzZXRdID0gdmFsdWU7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRNYXBWYWx1ZShtYXA6IFN0eWxpbmdNYXBBcnJheSwgaW5kZXg6IG51bWJlcik6IHN0cmluZ3xudWxsIHtcbiAgcmV0dXJuIG1hcFtpbmRleCArIFN0eWxpbmdNYXBBcnJheUluZGV4LlZhbHVlT2Zmc2V0XSBhcyBzdHJpbmcgfCBudWxsO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZm9yY2VDbGFzc2VzQXNTdHJpbmcoY2xhc3Nlczogc3RyaW5nIHwge1trZXk6IHN0cmluZ106IGFueX0gfCBudWxsIHwgdW5kZWZpbmVkKTpcbiAgICBzdHJpbmcge1xuICBpZiAoY2xhc3NlcyAmJiB0eXBlb2YgY2xhc3NlcyAhPT0gJ3N0cmluZycpIHtcbiAgICBjbGFzc2VzID0gT2JqZWN0LmtleXMoY2xhc3Nlcykuam9pbignICcpO1xuICB9XG4gIHJldHVybiAoY2xhc3NlcyBhcyBzdHJpbmcpIHx8ICcnO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZm9yY2VTdHlsZXNBc1N0cmluZyhcbiAgICBzdHlsZXM6IHtba2V5OiBzdHJpbmddOiBhbnl9IHwgc3RyaW5nIHwgbnVsbCB8IHVuZGVmaW5lZCwgaHlwaGVuYXRlUHJvcHM6IGJvb2xlYW4pOiBzdHJpbmcge1xuICBpZiAodHlwZW9mIHN0eWxlcyA9PSAnc3RyaW5nJykgcmV0dXJuIHN0eWxlcztcbiAgbGV0IHN0ciA9ICcnO1xuICBpZiAoc3R5bGVzKSB7XG4gICAgY29uc3QgcHJvcHMgPSBPYmplY3Qua2V5cyhzdHlsZXMpO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcHJvcHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IHByb3AgPSBwcm9wc1tpXTtcbiAgICAgIGNvbnN0IHByb3BMYWJlbCA9IGh5cGhlbmF0ZVByb3BzID8gaHlwaGVuYXRlKHByb3ApIDogcHJvcDtcbiAgICAgIGNvbnN0IHZhbHVlID0gc3R5bGVzW3Byb3BdO1xuICAgICAgaWYgKHZhbHVlICE9PSBudWxsKSB7XG4gICAgICAgIHN0ciA9IGNvbmNhdFN0cmluZyhzdHIsIGAke3Byb3BMYWJlbH06JHt2YWx1ZX1gLCAnOycpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gc3RyO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNIb3N0U3R5bGluZ0FjdGl2ZShkaXJlY3RpdmVPclNvdXJjZUlkOiBudW1iZXIpOiBib29sZWFuIHtcbiAgcmV0dXJuIGRpcmVjdGl2ZU9yU291cmNlSWQgIT09IFRFTVBMQVRFX0RJUkVDVElWRV9JTkRFWDtcbn1cblxuLyoqXG4gKiBDb252ZXJ0cyB0aGUgcHJvdmlkZWQgc3R5bGluZyBtYXAgYXJyYXkgaW50byBhIHN0cmluZy5cbiAqXG4gKiBDbGFzc2VzID0+IGBvbmUgdHdvIHRocmVlYFxuICogU3R5bGVzID0+IGBwcm9wOnZhbHVlOyBwcm9wMjp2YWx1ZTJgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzdHlsaW5nTWFwVG9TdHJpbmcobWFwOiBTdHlsaW5nTWFwQXJyYXksIGlzQ2xhc3NCYXNlZDogYm9vbGVhbik6IHN0cmluZyB7XG4gIGxldCBzdHIgPSAnJztcbiAgZm9yIChsZXQgaSA9IFN0eWxpbmdNYXBBcnJheUluZGV4LlZhbHVlc1N0YXJ0UG9zaXRpb247IGkgPCBtYXAubGVuZ3RoO1xuICAgICAgIGkgKz0gU3R5bGluZ01hcEFycmF5SW5kZXguVHVwbGVTaXplKSB7XG4gICAgY29uc3QgcHJvcCA9IGdldE1hcFByb3AobWFwLCBpKTtcbiAgICBjb25zdCB2YWx1ZSA9IGdldE1hcFZhbHVlKG1hcCwgaSkgYXMgc3RyaW5nO1xuICAgIGNvbnN0IGF0dHJWYWx1ZSA9IGNvbmNhdFN0cmluZyhwcm9wLCBpc0NsYXNzQmFzZWQgPyAnJyA6IHZhbHVlLCAnOicpO1xuICAgIHN0ciA9IGNvbmNhdFN0cmluZyhzdHIsIGF0dHJWYWx1ZSwgaXNDbGFzc0Jhc2VkID8gJyAnIDogJzsgJyk7XG4gIH1cbiAgcmV0dXJuIHN0cjtcbn1cblxuLyoqXG4gKiBDb252ZXJ0cyB0aGUgcHJvdmlkZWQgc3R5bGluZyBtYXAgYXJyYXkgaW50byBhIGtleSB2YWx1ZSBtYXAuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzdHlsaW5nTWFwVG9TdHJpbmdNYXAobWFwOiBTdHlsaW5nTWFwQXJyYXkgfCBudWxsKToge1trZXk6IHN0cmluZ106IGFueX0ge1xuICBsZXQgc3RyaW5nTWFwOiB7W2tleTogc3RyaW5nXTogYW55fSA9IHt9O1xuICBpZiAobWFwKSB7XG4gICAgZm9yIChsZXQgaSA9IFN0eWxpbmdNYXBBcnJheUluZGV4LlZhbHVlc1N0YXJ0UG9zaXRpb247IGkgPCBtYXAubGVuZ3RoO1xuICAgICAgICAgaSArPSBTdHlsaW5nTWFwQXJyYXlJbmRleC5UdXBsZVNpemUpIHtcbiAgICAgIGNvbnN0IHByb3AgPSBnZXRNYXBQcm9wKG1hcCwgaSk7XG4gICAgICBjb25zdCB2YWx1ZSA9IGdldE1hcFZhbHVlKG1hcCwgaSkgYXMgc3RyaW5nO1xuICAgICAgc3RyaW5nTWFwW3Byb3BdID0gdmFsdWU7XG4gICAgfVxuICB9XG4gIHJldHVybiBzdHJpbmdNYXA7XG59XG5cbi8qKlxuICogSW5zZXJ0cyB0aGUgcHJvdmlkZWQgaXRlbSBpbnRvIHRoZSBwcm92aWRlZCBzdHlsaW5nIGFycmF5IGF0IHRoZSByaWdodCBzcG90LlxuICpcbiAqIFRoZSBgU3R5bGluZ01hcEFycmF5YCB0eXBlIGlzIGEgc29ydGVkIGtleS92YWx1ZSBhcnJheSBvZiBlbnRyaWVzLiBUaGlzIG1lYW5zXG4gKiB0aGF0IHdoZW4gYSBuZXcgZW50cnkgaXMgaW5zZXJ0ZWQgaXQgbXVzdCBiZSBwbGFjZWQgYXQgdGhlIHJpZ2h0IHNwb3QgaW4gdGhlXG4gKiBhcnJheS4gVGhpcyBmdW5jdGlvbiBmaWd1cmVzIG91dCBleGFjdGx5IHdoZXJlIHRvIHBsYWNlIGl0LlxuICovXG5leHBvcnQgZnVuY3Rpb24gYWRkSXRlbVRvU3R5bGluZ01hcChcbiAgICBzdHlsaW5nTWFwQXJyOiBTdHlsaW5nTWFwQXJyYXksIHByb3A6IHN0cmluZywgdmFsdWU6IHN0cmluZyB8IGJvb2xlYW4gfCBudWxsLFxuICAgIGFsbG93T3ZlcndyaXRlPzogYm9vbGVhbikge1xuICBmb3IgKGxldCBqID0gU3R5bGluZ01hcEFycmF5SW5kZXguVmFsdWVzU3RhcnRQb3NpdGlvbjsgaiA8IHN0eWxpbmdNYXBBcnIubGVuZ3RoO1xuICAgICAgIGogKz0gU3R5bGluZ01hcEFycmF5SW5kZXguVHVwbGVTaXplKSB7XG4gICAgY29uc3QgcHJvcEF0SW5kZXggPSBnZXRNYXBQcm9wKHN0eWxpbmdNYXBBcnIsIGopO1xuICAgIGlmIChwcm9wIDw9IHByb3BBdEluZGV4KSB7XG4gICAgICBsZXQgYXBwbGllZCA9IGZhbHNlO1xuICAgICAgaWYgKHByb3BBdEluZGV4ID09PSBwcm9wKSB7XG4gICAgICAgIGNvbnN0IHZhbHVlQXRJbmRleCA9IHN0eWxpbmdNYXBBcnJbal07XG4gICAgICAgIGlmIChhbGxvd092ZXJ3cml0ZSB8fCAhaXNTdHlsaW5nVmFsdWVEZWZpbmVkKHZhbHVlQXRJbmRleCkpIHtcbiAgICAgICAgICBhcHBsaWVkID0gdHJ1ZTtcbiAgICAgICAgICBzZXRNYXBWYWx1ZShzdHlsaW5nTWFwQXJyLCBqLCB2YWx1ZSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGFwcGxpZWQgPSB0cnVlO1xuICAgICAgICBzdHlsaW5nTWFwQXJyLnNwbGljZShqLCAwLCBwcm9wLCB2YWx1ZSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gYXBwbGllZDtcbiAgICB9XG4gIH1cblxuICBzdHlsaW5nTWFwQXJyLnB1c2gocHJvcCwgdmFsdWUpO1xuICByZXR1cm4gdHJ1ZTtcbn1cblxuLyoqXG4gKiBVc2VkIHRvIGNvbnZlcnQgYSB7a2V5OnZhbHVlfSBtYXAgaW50byBhIGBTdHlsaW5nTWFwQXJyYXlgIGFycmF5LlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gd2lsbCBlaXRoZXIgZ2VuZXJhdGUgYSBuZXcgYFN0eWxpbmdNYXBBcnJheWAgaW5zdGFuY2VcbiAqIG9yIGl0IHdpbGwgcGF0Y2ggdGhlIHByb3ZpZGVkIGBuZXdWYWx1ZXNgIG1hcCB2YWx1ZSBpbnRvIGFuXG4gKiBleGlzdGluZyBgU3R5bGluZ01hcEFycmF5YCB2YWx1ZSAodGhpcyBvbmx5IGhhcHBlbnMgaWYgYGJpbmRpbmdWYWx1ZWBcbiAqIGlzIGFuIGluc3RhbmNlIG9mIGBTdHlsaW5nTWFwQXJyYXlgKS5cbiAqXG4gKiBJZiBhIG5ldyBrZXkvdmFsdWUgbWFwIGlzIHByb3ZpZGVkIHdpdGggYW4gb2xkIGBTdHlsaW5nTWFwQXJyYXlgXG4gKiB2YWx1ZSB0aGVuIGFsbCBwcm9wZXJ0aWVzIHdpbGwgYmUgb3ZlcndyaXR0ZW4gd2l0aCB0aGVpciBuZXdcbiAqIHZhbHVlcyBvciB3aXRoIGBudWxsYC4gVGhpcyBtZWFucyB0aGF0IHRoZSBhcnJheSB3aWxsIG5ldmVyXG4gKiBzaHJpbmsgaW4gc2l6ZSAoYnV0IGl0IHdpbGwgYWxzbyBub3QgYmUgY3JlYXRlZCBhbmQgdGhyb3duXG4gKiBhd2F5IHdoZW5ldmVyIHRoZSBge2tleTp2YWx1ZX1gIG1hcCBlbnRyaWVzIGNoYW5nZSkuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBub3JtYWxpemVJbnRvU3R5bGluZ01hcChcbiAgICBiaW5kaW5nVmFsdWU6IG51bGwgfCBTdHlsaW5nTWFwQXJyYXksXG4gICAgbmV3VmFsdWVzOiB7W2tleTogc3RyaW5nXTogYW55fSB8IHN0cmluZyB8IG51bGwgfCB1bmRlZmluZWQsXG4gICAgbm9ybWFsaXplUHJvcHM/OiBib29sZWFuKTogU3R5bGluZ01hcEFycmF5IHtcbiAgY29uc3Qgc3R5bGluZ01hcEFycjogU3R5bGluZ01hcEFycmF5ID1cbiAgICAgIEFycmF5LmlzQXJyYXkoYmluZGluZ1ZhbHVlKSA/IGJpbmRpbmdWYWx1ZSA6IGFsbG9jU3R5bGluZ01hcEFycmF5KG51bGwpO1xuICBzdHlsaW5nTWFwQXJyW1N0eWxpbmdNYXBBcnJheUluZGV4LlJhd1ZhbHVlUG9zaXRpb25dID0gbmV3VmFsdWVzO1xuXG4gIC8vIGJlY2F1c2UgdGhlIG5ldyB2YWx1ZXMgbWF5IG5vdCBpbmNsdWRlIGFsbCB0aGUgcHJvcGVydGllc1xuICAvLyB0aGF0IHRoZSBvbGQgb25lcyBoYWQsIGFsbCB2YWx1ZXMgYXJlIHNldCB0byBgbnVsbGAgYmVmb3JlXG4gIC8vIHRoZSBuZXcgdmFsdWVzIGFyZSBhcHBsaWVkLiBUaGlzIHdheSwgd2hlbiBmbHVzaGVkLCB0aGVcbiAgLy8gc3R5bGluZyBhbGdvcml0aG0ga25vd3MgZXhhY3RseSB3aGF0IHN0eWxlL2NsYXNzIHZhbHVlc1xuICAvLyB0byByZW1vdmUgZnJvbSB0aGUgZWxlbWVudCAoc2luY2UgdGhleSBhcmUgYG51bGxgKS5cbiAgZm9yIChsZXQgaiA9IFN0eWxpbmdNYXBBcnJheUluZGV4LlZhbHVlc1N0YXJ0UG9zaXRpb247IGogPCBzdHlsaW5nTWFwQXJyLmxlbmd0aDtcbiAgICAgICBqICs9IFN0eWxpbmdNYXBBcnJheUluZGV4LlR1cGxlU2l6ZSkge1xuICAgIHNldE1hcFZhbHVlKHN0eWxpbmdNYXBBcnIsIGosIG51bGwpO1xuICB9XG5cbiAgbGV0IHByb3BzOiBzdHJpbmdbXXxudWxsID0gbnVsbDtcbiAgbGV0IG1hcDoge1trZXk6IHN0cmluZ106IGFueX18dW5kZWZpbmVkfG51bGw7XG4gIGxldCBhbGxWYWx1ZXNUcnVlID0gZmFsc2U7XG4gIGlmICh0eXBlb2YgbmV3VmFsdWVzID09PSAnc3RyaW5nJykgeyAgLy8gW2NsYXNzXSBiaW5kaW5ncyBhbGxvdyBzdHJpbmcgdmFsdWVzXG4gICAgcHJvcHMgPSBzcGxpdE9uV2hpdGVzcGFjZShuZXdWYWx1ZXMpO1xuICAgIGFsbFZhbHVlc1RydWUgPSBwcm9wcyAhPT0gbnVsbDtcbiAgfSBlbHNlIHtcbiAgICBwcm9wcyA9IG5ld1ZhbHVlcyA/IE9iamVjdC5rZXlzKG5ld1ZhbHVlcykgOiBudWxsO1xuICAgIG1hcCA9IG5ld1ZhbHVlcztcbiAgfVxuXG4gIGlmIChwcm9wcykge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcHJvcHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IHByb3AgPSBwcm9wc1tpXTtcbiAgICAgIGNvbnN0IG5ld1Byb3AgPSBub3JtYWxpemVQcm9wcyA/IGh5cGhlbmF0ZShwcm9wKSA6IHByb3A7XG4gICAgICBjb25zdCB2YWx1ZSA9IGFsbFZhbHVlc1RydWUgPyB0cnVlIDogbWFwICFbcHJvcF07XG4gICAgICBhZGRJdGVtVG9TdHlsaW5nTWFwKHN0eWxpbmdNYXBBcnIsIG5ld1Byb3AsIHZhbHVlLCB0cnVlKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gc3R5bGluZ01hcEFycjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNwbGl0T25XaGl0ZXNwYWNlKHRleHQ6IHN0cmluZyk6IHN0cmluZ1tdfG51bGwge1xuICBsZXQgYXJyYXk6IHN0cmluZ1tdfG51bGwgPSBudWxsO1xuICBsZXQgbGVuZ3RoID0gdGV4dC5sZW5ndGg7XG4gIGxldCBzdGFydCA9IDA7XG4gIGxldCBmb3VuZENoYXIgPSBmYWxzZTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IGNoYXIgPSB0ZXh0LmNoYXJDb2RlQXQoaSk7XG4gICAgaWYgKGNoYXIgPD0gQ2hhckNvZGUuU1BBQ0UpIHtcbiAgICAgIGlmIChmb3VuZENoYXIpIHtcbiAgICAgICAgaWYgKGFycmF5ID09PSBudWxsKSBhcnJheSA9IFtdO1xuICAgICAgICBhcnJheS5wdXNoKHRleHQuc3Vic3RyaW5nKHN0YXJ0LCBpKSk7XG4gICAgICAgIGZvdW5kQ2hhciA9IGZhbHNlO1xuICAgICAgfVxuICAgICAgc3RhcnQgPSBpICsgMTtcbiAgICB9IGVsc2Uge1xuICAgICAgZm91bmRDaGFyID0gdHJ1ZTtcbiAgICB9XG4gIH1cbiAgaWYgKGZvdW5kQ2hhcikge1xuICAgIGlmIChhcnJheSA9PT0gbnVsbCkgYXJyYXkgPSBbXTtcbiAgICBhcnJheS5wdXNoKHRleHQuc3Vic3RyaW5nKHN0YXJ0LCBsZW5ndGgpKTtcbiAgICBmb3VuZENoYXIgPSBmYWxzZTtcbiAgfVxuICByZXR1cm4gYXJyYXk7XG59XG5cbi8vIFRPRE8gKG1hdHNrb3xBbmRyZXdLdXNobmlyKTogcmVmYWN0b3IgdGhpcyBvbmNlIHdlIGZpZ3VyZSBvdXQgaG93IHRvIGdlbmVyYXRlIHNlcGFyYXRlXG4vLyBgaW5wdXQoJ2NsYXNzJykgKyBjbGFzc01hcCgpYCBpbnN0cnVjdGlvbnMuXG5leHBvcnQgZnVuY3Rpb24gc2VsZWN0Q2xhc3NCYXNlZElucHV0TmFtZShpbnB1dHM6IFByb3BlcnR5QWxpYXNlcyk6IHN0cmluZyB7XG4gIHJldHVybiBpbnB1dHMuaGFzT3duUHJvcGVydHkoJ2NsYXNzJykgPyAnY2xhc3MnIDogJ2NsYXNzTmFtZSc7XG59XG4iXX0=