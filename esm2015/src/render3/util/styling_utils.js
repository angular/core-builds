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
 * 1. there are no directives present AND ngDevMode is falsy
 * 2. context is locked for template or host bindings (depending on `hostBindingsMode`)
 * 3. There are no collisions (i.e. properties with more than one binding) across multiple
 *    sources (i.e. template + directive, directive + directive, directive + component)
 * @param {?} context
 * @param {?} hostBindingsMode
 * @return {?}
 */
export function allowDirectStyling(context, hostBindingsMode) {
    /** @type {?} */
    let allow = false;
    /** @type {?} */
    const config = getConfig(context);
    /** @type {?} */
    const contextIsLocked = (config & getLockedConfig(hostBindingsMode)) !== 0;
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
        allow = ngDevMode ? contextIsLocked : true;
    }
    else if (contextIsLocked) {
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
 * @param {?} hostBindingsMode
 * @return {?}
 */
export function lockContext(context, hostBindingsMode) {
    patchConfig(context, getLockedConfig(hostBindingsMode));
}
/**
 * @param {?} context
 * @param {?} hostBindingsMode
 * @return {?}
 */
export function isContextLocked(context, hostBindingsMode) {
    return hasConfig(context, getLockedConfig(hostBindingsMode));
}
/**
 * @param {?} hostBindingsMode
 * @return {?}
 */
export function getLockedConfig(hostBindingsMode) {
    return hostBindingsMode ? 256 /* HostBindingsLocked */ :
        128 /* TemplateBindingsLocked */;
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
 * @return {?}
 */
export function forceStylesAsString(styles) {
    /** @type {?} */
    let str = '';
    if (styles) {
        /** @type {?} */
        const props = Object.keys(styles);
        for (let i = 0; i < props.length; i++) {
            /** @type {?} */
            const prop = props[i];
            str = concatString(str, `${prop}:${styles[prop]}`, ';');
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
        if (newValues.length) {
            props = newValues.split(/\s+/);
            allValuesTrue = true;
        }
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
// TODO (matsko|AndrewKushnir): refactor this once we figure out how to generate separate
// `input('class') + classMap()` instructions.
/**
 * @param {?} inputs
 * @return {?}
 */
export function selectClassBasedInputName(inputs) {
    return inputs.hasOwnProperty('class') ? 'class' : 'className';
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3R5bGluZ191dGlscy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvdXRpbC9zdHlsaW5nX3V0aWxzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7QUFTQSxPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sV0FBVyxDQUFDOztBQUVwQyxNQUFNLE9BQU8seUJBQXlCLEdBQUcsT0FBTzs7QUFDaEQsTUFBTSxPQUFPLHdCQUF3QixHQUFHLENBQUM7Ozs7Ozs7Ozs7QUFVekMsTUFBTSxPQUFPLHFCQUFxQixHQUFHLElBQUk7O0FBRXpDLE1BQU0sT0FBTyxxQkFBcUIsR0FBRyxDQUFDOztNQUVoQyxxQkFBcUIsR0FBRyxDQUFDOzs7Ozs7O0FBTy9CLE1BQU0sT0FBTyx3QkFBd0IsR0FBRyxHQUFHOzs7Ozs7Ozs7Ozs7QUFVM0MsTUFBTSxVQUFVLG9CQUFvQixDQUNoQyxjQUFzQyxFQUFFLGFBQXNCO0lBQ2hFLGNBQWMsR0FBRyxjQUFjLElBQUksb0JBQW9CLENBQUMsSUFBSSxDQUFDLENBQUM7O1FBQzFELE1BQU0sa0JBQXlCO0lBQ25DLElBQUksYUFBYSxFQUFFO1FBQ2pCLE1BQU0seUJBQWdDLENBQUM7S0FDeEM7SUFDRCxJQUFJLGNBQWMsQ0FBQyxNQUFNLDhCQUEyQyxFQUFFO1FBQ3BFLE1BQU0sOEJBQW9DLENBQUM7S0FDNUM7SUFDRCxPQUFPO1FBQ0wsTUFBTTtRQUNOLHFCQUFxQjtRQUNyQixjQUFjO0tBQ2YsQ0FBQztBQUNKLENBQUM7Ozs7O0FBRUQsTUFBTSxVQUFVLG9CQUFvQixDQUFDLEtBQXlCO0lBQzVELE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUNqQixDQUFDOzs7OztBQUVELE1BQU0sVUFBVSxTQUFTLENBQUMsT0FBd0I7SUFDaEQsT0FBTyxPQUFPLHdCQUFxQyxDQUFDO0FBQ3RELENBQUM7Ozs7OztBQUVELE1BQU0sVUFBVSxTQUFT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LFNBQVMsS0FBSyxRQUFRLEVBQUUsRUFBRyx1Q0FBdUM7UUFDM0UsSUFBSSxTQUFTLENBQUMsTUFBTSxFQUFFO1lBQ3BCLEtBQUssR0FBRyxTQUFTLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQy9CLGFBQWEsR0FBRyxJQUFJLENBQUM7U0FDdEI7S0FDRjtTQUFNO1FBQ0wsS0FBSyxHQUFHLFNBQVMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO1FBQ2xELEdBQUcsR0FBRyxTQUFTLENBQUM7S0FDakI7SUFFRCxJQUFJLEtBQUssRUFBRTtRQUNULEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFOztrQkFDL0IsSUFBSSxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUM7O2tCQUNmLE9BQU8sR0FBRyxjQUFjLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSTs7a0JBQ2pELEtBQUssR0FBRyxhQUFhLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsbUJBQUEsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDO1lBQ2hELG1CQUFtQixDQUFDLGFBQWEsRUFBRSxPQUFPLEVBQUUsS0FBSyxFQUFFLElBQUksQ0FBQyxDQUFDO1NBQzFEO0tBQ0Y7SUFFRCxPQUFPLGFBQWEsQ0FBQztBQUN2QixDQUFDOzs7Ozs7O0FBSUQsTUFBTSxVQUFVLHlCQUF5QixDQUFDLE1BQXVCO0lBQy9ELE9BQU8sTUFBTSxDQUFDLGNBQWMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUM7QUFDaEUsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuKiBAbGljZW5zZVxuKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbipcbiogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuKi9cbmltcG9ydCB7UHJvcGVydHlBbGlhc2VzLCBUTm9kZSwgVE5vZGVGbGFnc30gZnJvbSAnLi4vaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB7TFN0eWxpbmdEYXRhLCBTdHlsaW5nTWFwQXJyYXksIFN0eWxpbmdNYXBBcnJheUluZGV4LCBUU3R5bGluZ0NvbmZpZywgVFN0eWxpbmdDb250ZXh0LCBUU3R5bGluZ0NvbnRleHRJbmRleCwgVFN0eWxpbmdDb250ZXh0UHJvcENvbmZpZ0ZsYWdzfSBmcm9tICcuLi9pbnRlcmZhY2VzL3N0eWxpbmcnO1xuaW1wb3J0IHtOT19DSEFOR0V9IGZyb20gJy4uL3Rva2Vucyc7XG5cbmV4cG9ydCBjb25zdCBNQVBfQkFTRURfRU5UUllfUFJPUF9OQU1FID0gJ1tNQVBdJztcbmV4cG9ydCBjb25zdCBURU1QTEFURV9ESVJFQ1RJVkVfSU5ERVggPSAwO1xuXG4vKipcbiAqIERlZmF1bHQgZmFsbGJhY2sgdmFsdWUgZm9yIGEgc3R5bGluZyBiaW5kaW5nLlxuICpcbiAqIEEgdmFsdWUgb2YgYG51bGxgIGlzIHVzZWQgaGVyZSB3aGljaCBzaWduYWxzIHRvIHRoZSBzdHlsaW5nIGFsZ29yaXRobSB0aGF0XG4gKiB0aGUgc3R5bGluZyB2YWx1ZSBpcyBub3QgcHJlc2VudC4gVGhpcyB3YXkgaWYgdGhlcmUgYXJlIG5vIG90aGVyIHZhbHVlc1xuICogZGV0ZWN0ZWQgdGhlbiBpdCB3aWxsIGJlIHJlbW92ZWQgb25jZSB0aGUgc3R5bGUvY2xhc3MgcHJvcGVydHkgaXMgZGlydHkgYW5kXG4gKiBkaWZmZWQgd2l0aGluIHRoZSBzdHlsaW5nIGFsZ29yaXRobSBwcmVzZW50IGluIGBmbHVzaFN0eWxpbmdgLlxuICovXG5leHBvcnQgY29uc3QgREVGQVVMVF9CSU5ESU5HX1ZBTFVFID0gbnVsbDtcblxuZXhwb3J0IGNvbnN0IERFRkFVTFRfQklORElOR19JTkRFWCA9IDA7XG5cbmNvbnN0IERFRkFVTFRfVE9UQUxfU09VUkNFUyA9IDE7XG5cbi8vIFRoZSBmaXJzdCBiaXQgdmFsdWUgcmVmbGVjdHMgYSBtYXAtYmFzZWQgYmluZGluZyB2YWx1ZSdzIGJpdC5cbi8vIFRoZSByZWFzb24gd2h5IGl0J3MgYWx3YXlzIGFjdGl2YXRlZCBmb3IgZXZlcnkgZW50cnkgaW4gdGhlIG1hcFxuLy8gaXMgc28gdGhhdCBpZiBhbnkgbWFwLWJpbmRpbmcgdmFsdWVzIHVwZGF0ZSB0aGVuIGFsbCBvdGhlciBwcm9wXG4vLyBiYXNlZCBiaW5kaW5ncyB3aWxsIHBhc3MgdGhlIGd1YXJkIGNoZWNrIGF1dG9tYXRpY2FsbHkgd2l0aG91dFxuLy8gYW55IGV4dHJhIGNvZGUgb3IgZmxhZ3MuXG5leHBvcnQgY29uc3QgREVGQVVMVF9HVUFSRF9NQVNLX1ZBTFVFID0gMGIxO1xuXG4vKipcbiAqIENyZWF0ZXMgYSBuZXcgaW5zdGFuY2Ugb2YgdGhlIGBUU3R5bGluZ0NvbnRleHRgLlxuICpcbiAqIFRoZSBgVFN0eWxpbmdDb250ZXh0YCBpcyB1c2VkIGFzIGEgbWFuaWZlc3Qgb2YgYWxsIHN0eWxlIG9yIGFsbCBjbGFzcyBiaW5kaW5ncyBvblxuICogYW4gZWxlbWVudC4gQmVjYXVzZSBpdCBpcyBhIFQtbGV2ZWwgZGF0YS1zdHJ1Y3R1cmUsIGl0IGlzIG9ubHkgY3JlYXRlZCBvbmNlIHBlclxuICogdE5vZGUgZm9yIHN0eWxlcyBhbmQgZm9yIGNsYXNzZXMuIFRoaXMgZnVuY3Rpb24gYWxsb2NhdGVzIGEgbmV3IGluc3RhbmNlIG9mIGFcbiAqIGBUU3R5bGluZ0NvbnRleHRgIHdpdGggdGhlIGluaXRpYWwgdmFsdWVzIChzZWUgYGludGVyZmFjZXMudHNgIGZvciBtb3JlIGluZm8pLlxuICovXG5leHBvcnQgZnVuY3Rpb24gYWxsb2NUU3R5bGluZ0NvbnRleHQoXG4gICAgaW5pdGlhbFN0eWxpbmc6IFN0eWxpbmdNYXBBcnJheSB8IG51bGwsIGhhc0RpcmVjdGl2ZXM6IGJvb2xlYW4pOiBUU3R5bGluZ0NvbnRleHQge1xuICBpbml0aWFsU3R5bGluZyA9IGluaXRpYWxTdHlsaW5nIHx8IGFsbG9jU3R5bGluZ01hcEFycmF5KG51bGwpO1xuICBsZXQgY29uZmlnID0gVFN0eWxpbmdDb25maWcuSW5pdGlhbDtcbiAgaWYgKGhhc0RpcmVjdGl2ZXMpIHtcbiAgICBjb25maWcgfD0gVFN0eWxpbmdDb25maWcuSGFzRGlyZWN0aXZlcztcbiAgfVxuICBpZiAoaW5pdGlhbFN0eWxpbmcubGVuZ3RoID4gU3R5bGluZ01hcEFycmF5SW5kZXguVmFsdWVzU3RhcnRQb3NpdGlvbikge1xuICAgIGNvbmZpZyB8PSBUU3R5bGluZ0NvbmZpZy5IYXNJbml0aWFsU3R5bGluZztcbiAgfVxuICByZXR1cm4gW1xuICAgIGNvbmZpZywgICAgICAgICAgICAgICAgIC8vIDEpIGNvbmZpZyBmb3IgdGhlIHN0eWxpbmcgY29udGV4dFxuICAgIERFRkFVTFRfVE9UQUxfU09VUkNFUywgIC8vIDIpIHRvdGFsIGFtb3VudCBvZiBzdHlsaW5nIHNvdXJjZXMgKHRlbXBsYXRlLCBkaXJlY3RpdmVzLCBldGMuLi4pXG4gICAgaW5pdGlhbFN0eWxpbmcsICAgICAgICAgLy8gMykgaW5pdGlhbCBzdHlsaW5nIHZhbHVlc1xuICBdO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYWxsb2NTdHlsaW5nTWFwQXJyYXkodmFsdWU6IHt9IHwgc3RyaW5nIHwgbnVsbCk6IFN0eWxpbmdNYXBBcnJheSB7XG4gIHJldHVybiBbdmFsdWVdO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q29uZmlnKGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCkge1xuICByZXR1cm4gY29udGV4dFtUU3R5bGluZ0NvbnRleHRJbmRleC5Db25maWdQb3NpdGlvbl07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBoYXNDb25maWcoY29udGV4dDogVFN0eWxpbmdDb250ZXh0LCBmbGFnOiBUU3R5bGluZ0NvbmZpZykge1xuICByZXR1cm4gKGdldENvbmZpZyhjb250ZXh0KSAmIGZsYWcpICE9PSAwO1xufVxuXG4vKipcbiAqIERldGVybWluZXMgd2hldGhlciBvciBub3QgdG8gYXBwbHkgc3R5bGVzL2NsYXNzZXMgZGlyZWN0bHkgb3IgdmlhIGNvbnRleHQgcmVzb2x1dGlvbi5cbiAqXG4gKiBUaGVyZSBhcmUgdGhyZWUgY2FzZXMgdGhhdCBhcmUgbWF0Y2hlZCBoZXJlOlxuICogMS4gdGhlcmUgYXJlIG5vIGRpcmVjdGl2ZXMgcHJlc2VudCBBTkQgbmdEZXZNb2RlIGlzIGZhbHN5XG4gKiAyLiBjb250ZXh0IGlzIGxvY2tlZCBmb3IgdGVtcGxhdGUgb3IgaG9zdCBiaW5kaW5ncyAoZGVwZW5kaW5nIG9uIGBob3N0QmluZGluZ3NNb2RlYClcbiAqIDMuIFRoZXJlIGFyZSBubyBjb2xsaXNpb25zIChpLmUuIHByb3BlcnRpZXMgd2l0aCBtb3JlIHRoYW4gb25lIGJpbmRpbmcpIGFjcm9zcyBtdWx0aXBsZVxuICogICAgc291cmNlcyAoaS5lLiB0ZW1wbGF0ZSArIGRpcmVjdGl2ZSwgZGlyZWN0aXZlICsgZGlyZWN0aXZlLCBkaXJlY3RpdmUgKyBjb21wb25lbnQpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhbGxvd0RpcmVjdFN0eWxpbmcoY29udGV4dDogVFN0eWxpbmdDb250ZXh0LCBob3N0QmluZGluZ3NNb2RlOiBib29sZWFuKTogYm9vbGVhbiB7XG4gIGxldCBhbGxvdyA9IGZhbHNlO1xuICBjb25zdCBjb25maWcgPSBnZXRDb25maWcoY29udGV4dCk7XG4gIGNvbnN0IGNvbnRleHRJc0xvY2tlZCA9IChjb25maWcgJiBnZXRMb2NrZWRDb25maWcoaG9zdEJpbmRpbmdzTW9kZSkpICE9PSAwO1xuICBjb25zdCBoYXNOb0RpcmVjdGl2ZXMgPSAoY29uZmlnICYgVFN0eWxpbmdDb25maWcuSGFzRGlyZWN0aXZlcykgPT09IDA7XG5cbiAgLy8gaWYgbm8gZGlyZWN0aXZlcyBhcmUgcHJlc2VudCB0aGVuIHdlIGRvIG5vdCBuZWVkIHBvcHVsYXRlIGEgY29udGV4dCBhdCBhbGwuIFRoaXNcbiAgLy8gaXMgYmVjYXVzZSBkdXBsaWNhdGUgcHJvcCBiaW5kaW5ncyBjYW5ub3QgYmUgcmVnaXN0ZXJlZCB0aHJvdWdoIHRoZSB0ZW1wbGF0ZS4gSWZcbiAgLy8gYW5kIHdoZW4gdGhpcyBoYXBwZW5zIHdlIGNhbiBzYWZlbHkgYXBwbHkgdGhlIHZhbHVlIGRpcmVjdGx5IHdpdGhvdXQgY29udGV4dFxuICAvLyByZXNvbHV0aW9uLi4uXG4gIGlmIChoYXNOb0RpcmVjdGl2ZXMpIHtcbiAgICAvLyBgbmdEZXZNb2RlYCBpcyByZXF1aXJlZCB0byBiZSBjaGVja2VkIGhlcmUgYmVjYXVzZSB0ZXN0cy9kZWJ1Z2dpbmcgcmVseSBvbiB0aGUgY29udGV4dCBiZWluZ1xuICAgIC8vIHBvcHVsYXRlZC4gSWYgdGhpbmdzIGFyZSBpbiBwcm9kdWN0aW9uIG1vZGUgdGhlbiB0aGVyZSBpcyBubyBuZWVkIHRvIGJ1aWxkIGEgY29udGV4dFxuICAgIC8vIHRoZXJlZm9yZSB0aGUgZGlyZWN0IGFwcGx5IGNhbiBiZSBhbGxvd2VkIChldmVuIG9uIHRoZSBmaXJzdCB1cGRhdGUpLlxuICAgIGFsbG93ID0gbmdEZXZNb2RlID8gY29udGV4dElzTG9ja2VkIDogdHJ1ZTtcbiAgfSBlbHNlIGlmIChjb250ZXh0SXNMb2NrZWQpIHtcbiAgICBjb25zdCBoYXNOb0NvbGxpc2lvbnMgPSAoY29uZmlnICYgVFN0eWxpbmdDb25maWcuSGFzQ29sbGlzaW9ucykgPT09IDA7XG4gICAgY29uc3QgaGFzT25seU1hcHNPck9ubHlQcm9wcyA9XG4gICAgICAgIChjb25maWcgJiBUU3R5bGluZ0NvbmZpZy5IYXNQcm9wQW5kTWFwQmluZGluZ3MpICE9PSBUU3R5bGluZ0NvbmZpZy5IYXNQcm9wQW5kTWFwQmluZGluZ3M7XG4gICAgYWxsb3cgPSBoYXNOb0NvbGxpc2lvbnMgJiYgaGFzT25seU1hcHNPck9ubHlQcm9wcztcbiAgfVxuXG4gIHJldHVybiBhbGxvdztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNldENvbmZpZyhjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQsIHZhbHVlOiBUU3R5bGluZ0NvbmZpZyk6IHZvaWQge1xuICBjb250ZXh0W1RTdHlsaW5nQ29udGV4dEluZGV4LkNvbmZpZ1Bvc2l0aW9uXSA9IHZhbHVlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcGF0Y2hDb25maWcoY29udGV4dDogVFN0eWxpbmdDb250ZXh0LCBmbGFnOiBUU3R5bGluZ0NvbmZpZyk6IHZvaWQge1xuICBjb250ZXh0W1RTdHlsaW5nQ29udGV4dEluZGV4LkNvbmZpZ1Bvc2l0aW9uXSB8PSBmbGFnO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0UHJvcChjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQsIGluZGV4OiBudW1iZXIpOiBzdHJpbmcge1xuICByZXR1cm4gY29udGV4dFtpbmRleCArIFRTdHlsaW5nQ29udGV4dEluZGV4LlByb3BPZmZzZXRdIGFzIHN0cmluZztcbn1cblxuZnVuY3Rpb24gZ2V0UHJvcENvbmZpZyhjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQsIGluZGV4OiBudW1iZXIpOiBudW1iZXIge1xuICByZXR1cm4gKGNvbnRleHRbaW5kZXggKyBUU3R5bGluZ0NvbnRleHRJbmRleC5Db25maWdPZmZzZXRdIGFzIG51bWJlcikgJlxuICAgICAgVFN0eWxpbmdDb250ZXh0UHJvcENvbmZpZ0ZsYWdzLk1hc2s7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc1Nhbml0aXphdGlvblJlcXVpcmVkKGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCwgaW5kZXg6IG51bWJlcik6IGJvb2xlYW4ge1xuICByZXR1cm4gKGdldFByb3BDb25maWcoY29udGV4dCwgaW5kZXgpICYgVFN0eWxpbmdDb250ZXh0UHJvcENvbmZpZ0ZsYWdzLlNhbml0aXphdGlvblJlcXVpcmVkKSAhPT1cbiAgICAgIDA7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRHdWFyZE1hc2soXG4gICAgY29udGV4dDogVFN0eWxpbmdDb250ZXh0LCBpbmRleDogbnVtYmVyLCBpc0hvc3RCaW5kaW5nOiBib29sZWFuKTogbnVtYmVyIHtcbiAgY29uc3QgcG9zaXRpb24gPSBpbmRleCArIChpc0hvc3RCaW5kaW5nID8gVFN0eWxpbmdDb250ZXh0SW5kZXguSG9zdEJpbmRpbmdzQml0R3VhcmRPZmZzZXQgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBUU3R5bGluZ0NvbnRleHRJbmRleC5UZW1wbGF0ZUJpdEd1YXJkT2Zmc2V0KTtcbiAgcmV0dXJuIGNvbnRleHRbcG9zaXRpb25dIGFzIG51bWJlcjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNldEd1YXJkTWFzayhcbiAgICBjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQsIGluZGV4OiBudW1iZXIsIG1hc2tWYWx1ZTogbnVtYmVyLCBpc0hvc3RCaW5kaW5nOiBib29sZWFuKSB7XG4gIGNvbnN0IHBvc2l0aW9uID0gaW5kZXggKyAoaXNIb3N0QmluZGluZyA/IFRTdHlsaW5nQ29udGV4dEluZGV4Lkhvc3RCaW5kaW5nc0JpdEd1YXJkT2Zmc2V0IDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgVFN0eWxpbmdDb250ZXh0SW5kZXguVGVtcGxhdGVCaXRHdWFyZE9mZnNldCk7XG4gIGNvbnRleHRbcG9zaXRpb25dID0gbWFza1ZhbHVlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0VmFsdWVzQ291bnQoY29udGV4dDogVFN0eWxpbmdDb250ZXh0KTogbnVtYmVyIHtcbiAgcmV0dXJuIGdldFRvdGFsU291cmNlcyhjb250ZXh0KSArIDE7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRUb3RhbFNvdXJjZXMoY29udGV4dDogVFN0eWxpbmdDb250ZXh0KTogbnVtYmVyIHtcbiAgcmV0dXJuIGNvbnRleHRbVFN0eWxpbmdDb250ZXh0SW5kZXguVG90YWxTb3VyY2VzUG9zaXRpb25dO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0QmluZGluZ1ZhbHVlKGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCwgaW5kZXg6IG51bWJlciwgb2Zmc2V0OiBudW1iZXIpIHtcbiAgcmV0dXJuIGNvbnRleHRbaW5kZXggKyBUU3R5bGluZ0NvbnRleHRJbmRleC5CaW5kaW5nc1N0YXJ0T2Zmc2V0ICsgb2Zmc2V0XSBhcyBudW1iZXIgfCBzdHJpbmc7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXREZWZhdWx0VmFsdWUoY29udGV4dDogVFN0eWxpbmdDb250ZXh0LCBpbmRleDogbnVtYmVyKTogc3RyaW5nfGJvb2xlYW58bnVsbCB7XG4gIHJldHVybiBjb250ZXh0W2luZGV4ICsgVFN0eWxpbmdDb250ZXh0SW5kZXguQmluZGluZ3NTdGFydE9mZnNldCArIGdldFRvdGFsU291cmNlcyhjb250ZXh0KV0gYXNcbiAgICAgICAgICAgICBzdHJpbmcgfFxuICAgICAgYm9vbGVhbiB8IG51bGw7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXREZWZhdWx0VmFsdWUoXG4gICAgY29udGV4dDogVFN0eWxpbmdDb250ZXh0LCBpbmRleDogbnVtYmVyLCB2YWx1ZTogc3RyaW5nIHwgYm9vbGVhbiB8IG51bGwpIHtcbiAgcmV0dXJuIGNvbnRleHRbaW5kZXggKyBUU3R5bGluZ0NvbnRleHRJbmRleC5CaW5kaW5nc1N0YXJ0T2Zmc2V0ICsgZ2V0VG90YWxTb3VyY2VzKGNvbnRleHQpXSA9XG4gICAgICAgICAgICAgdmFsdWU7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXRWYWx1ZShkYXRhOiBMU3R5bGluZ0RhdGEsIGJpbmRpbmdJbmRleDogbnVtYmVyLCB2YWx1ZTogYW55KSB7XG4gIGRhdGFbYmluZGluZ0luZGV4XSA9IHZhbHVlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0VmFsdWU8VCA9IGFueT4oZGF0YTogTFN0eWxpbmdEYXRhLCBiaW5kaW5nSW5kZXg6IG51bWJlcik6IFR8bnVsbCB7XG4gIHJldHVybiBiaW5kaW5nSW5kZXggIT09IDAgPyBkYXRhW2JpbmRpbmdJbmRleF0gYXMgVCA6IG51bGw7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBsb2NrQ29udGV4dChjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQsIGhvc3RCaW5kaW5nc01vZGU6IGJvb2xlYW4pOiB2b2lkIHtcbiAgcGF0Y2hDb25maWcoY29udGV4dCwgZ2V0TG9ja2VkQ29uZmlnKGhvc3RCaW5kaW5nc01vZGUpKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzQ29udGV4dExvY2tlZChjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQsIGhvc3RCaW5kaW5nc01vZGU6IGJvb2xlYW4pOiBib29sZWFuIHtcbiAgcmV0dXJuIGhhc0NvbmZpZyhjb250ZXh0LCBnZXRMb2NrZWRDb25maWcoaG9zdEJpbmRpbmdzTW9kZSkpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0TG9ja2VkQ29uZmlnKGhvc3RCaW5kaW5nc01vZGU6IGJvb2xlYW4pIHtcbiAgcmV0dXJuIGhvc3RCaW5kaW5nc01vZGUgPyBUU3R5bGluZ0NvbmZpZy5Ib3N0QmluZGluZ3NMb2NrZWQgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFRTdHlsaW5nQ29uZmlnLlRlbXBsYXRlQmluZGluZ3NMb2NrZWQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRQcm9wVmFsdWVzU3RhcnRQb3NpdGlvbihjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQpIHtcbiAgbGV0IHN0YXJ0UG9zaXRpb24gPSBUU3R5bGluZ0NvbnRleHRJbmRleC5WYWx1ZXNTdGFydFBvc2l0aW9uO1xuICBpZiAoaGFzQ29uZmlnKGNvbnRleHQsIFRTdHlsaW5nQ29uZmlnLkhhc01hcEJpbmRpbmdzKSkge1xuICAgIHN0YXJ0UG9zaXRpb24gKz0gVFN0eWxpbmdDb250ZXh0SW5kZXguQmluZGluZ3NTdGFydE9mZnNldCArIGdldFZhbHVlc0NvdW50KGNvbnRleHQpO1xuICB9XG4gIHJldHVybiBzdGFydFBvc2l0aW9uO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaGFzVmFsdWVDaGFuZ2VkKFxuICAgIGE6IE5PX0NIQU5HRSB8IFN0eWxpbmdNYXBBcnJheSB8IG51bWJlciB8IFN0cmluZyB8IHN0cmluZyB8IG51bGwgfCBib29sZWFuIHwgdW5kZWZpbmVkIHwge30sXG4gICAgYjogTk9fQ0hBTkdFIHwgU3R5bGluZ01hcEFycmF5IHwgbnVtYmVyIHwgU3RyaW5nIHwgc3RyaW5nIHwgbnVsbCB8IGJvb2xlYW4gfCB1bmRlZmluZWQgfFxuICAgICAgICB7fSk6IGJvb2xlYW4ge1xuICBpZiAoYiA9PT0gTk9fQ0hBTkdFKSByZXR1cm4gZmFsc2U7XG5cbiAgY29uc3QgY29tcGFyZVZhbHVlQSA9IEFycmF5LmlzQXJyYXkoYSkgPyBhW1N0eWxpbmdNYXBBcnJheUluZGV4LlJhd1ZhbHVlUG9zaXRpb25dIDogYTtcbiAgY29uc3QgY29tcGFyZVZhbHVlQiA9IEFycmF5LmlzQXJyYXkoYikgPyBiW1N0eWxpbmdNYXBBcnJheUluZGV4LlJhd1ZhbHVlUG9zaXRpb25dIDogYjtcbiAgcmV0dXJuICFPYmplY3QuaXMoY29tcGFyZVZhbHVlQSwgY29tcGFyZVZhbHVlQik7XG59XG5cbi8qKlxuICogRGV0ZXJtaW5lcyB3aGV0aGVyIHRoZSBwcm92aWRlZCBzdHlsaW5nIHZhbHVlIGlzIHRydXRoeSBvciBmYWxzeS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzU3R5bGluZ1ZhbHVlRGVmaW5lZDxUIGV4dGVuZHMgc3RyaW5nfG51bWJlcnx7fXxudWxsfHVuZGVmaW5lZD4odmFsdWU6IFQpOlxuICAgIHZhbHVlIGlzIE5vbk51bGxhYmxlPFQ+IHtcbiAgLy8gdGhlIHJlYXNvbiB3aHkgbnVsbCBpcyBjb21wYXJlZCBhZ2FpbnN0IGlzIGJlY2F1c2VcbiAgLy8gYSBDU1MgY2xhc3MgdmFsdWUgdGhhdCBpcyBzZXQgdG8gYGZhbHNlYCBtdXN0IGJlXG4gIC8vIHJlc3BlY3RlZCAob3RoZXJ3aXNlIGl0IHdvdWxkIGJlIHRyZWF0ZWQgYXMgZmFsc3kpLlxuICAvLyBFbXB0eSBzdHJpbmcgdmFsdWVzIGFyZSBiZWNhdXNlIGRldmVsb3BlcnMgdXN1YWxseVxuICAvLyBzZXQgYSB2YWx1ZSB0byBhbiBlbXB0eSBzdHJpbmcgdG8gcmVtb3ZlIGl0LlxuICByZXR1cm4gdmFsdWUgIT0gbnVsbCAmJiB2YWx1ZSAhPT0gJyc7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjb25jYXRTdHJpbmcoYTogc3RyaW5nLCBiOiBzdHJpbmcsIHNlcGFyYXRvciA9ICcgJyk6IHN0cmluZyB7XG4gIHJldHVybiBhICsgKChiLmxlbmd0aCAmJiBhLmxlbmd0aCkgPyBzZXBhcmF0b3IgOiAnJykgKyBiO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaHlwaGVuYXRlKHZhbHVlOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gdmFsdWUucmVwbGFjZSgvW2Etel1bQS1aXS9nLCB2ID0+IHYuY2hhckF0KDApICsgJy0nICsgdi5jaGFyQXQoMSkpLnRvTG93ZXJDYXNlKCk7XG59XG5cbi8qKlxuICogUmV0dXJucyBhbiBpbnN0YW5jZSBvZiBgU3R5bGluZ01hcEFycmF5YC5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIGlzIGRlc2lnbmVkIHRvIGZpbmQgYW4gaW5zdGFuY2Ugb2YgYFN0eWxpbmdNYXBBcnJheWAgaW4gY2FzZSBpdCBpcyBzdG9yZWRcbiAqIGluc2lkZSBvZiBhbiBpbnN0YW5jZSBvZiBgVFN0eWxpbmdDb250ZXh0YC4gV2hlbiBhIHN0eWxpbmcgY29udGV4dCBpcyBjcmVhdGVkIGl0XG4gKiB3aWxsIGNvcHkgb3ZlciBhbiBpbml0aWFsIHN0eWxpbmcgdmFsdWVzIGZyb20gdGhlIHROb2RlICh3aGljaCBhcmUgc3RvcmVkIGFzIGFcbiAqIGBTdHlsaW5nTWFwQXJyYXlgIG9uIHRoZSBgdE5vZGUuY2xhc3Nlc2Agb3IgYHROb2RlLnN0eWxlc2AgdmFsdWVzKS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldFN0eWxpbmdNYXBBcnJheSh2YWx1ZTogVFN0eWxpbmdDb250ZXh0IHwgU3R5bGluZ01hcEFycmF5IHwgbnVsbCk6XG4gICAgU3R5bGluZ01hcEFycmF5fG51bGwge1xuICByZXR1cm4gaXNTdHlsaW5nQ29udGV4dCh2YWx1ZSkgP1xuICAgICAgKHZhbHVlIGFzIFRTdHlsaW5nQ29udGV4dClbVFN0eWxpbmdDb250ZXh0SW5kZXguSW5pdGlhbFN0eWxpbmdWYWx1ZVBvc2l0aW9uXSA6XG4gICAgICB2YWx1ZSBhcyBTdHlsaW5nTWFwQXJyYXk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc1N0eWxpbmdDb250ZXh0KHZhbHVlOiBhbnkpOiBib29sZWFuIHtcbiAgLy8gdGhlIFN0eWxpbmdNYXBBcnJheSBpcyBpbiB0aGUgZm9ybWF0IG9mIFtpbml0aWFsLCBwcm9wLCBzdHJpbmcsIHByb3AsIHN0cmluZ11cbiAgLy8gYW5kIHRoaXMgaXMgdGhlIGRlZmluaW5nIHZhbHVlIHRvIGRpc3Rpbmd1aXNoIGJldHdlZW4gYXJyYXlzXG4gIHJldHVybiBBcnJheS5pc0FycmF5KHZhbHVlKSAmJiB2YWx1ZS5sZW5ndGggPj0gVFN0eWxpbmdDb250ZXh0SW5kZXguVmFsdWVzU3RhcnRQb3NpdGlvbiAmJlxuICAgICAgdHlwZW9mIHZhbHVlWzFdICE9PSAnc3RyaW5nJztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzU3R5bGluZ01hcEFycmF5KHZhbHVlOiBUU3R5bGluZ0NvbnRleHQgfCBTdHlsaW5nTWFwQXJyYXkgfCBudWxsKTogYm9vbGVhbiB7XG4gIC8vIHRoZSBTdHlsaW5nTWFwQXJyYXkgaXMgaW4gdGhlIGZvcm1hdCBvZiBbaW5pdGlhbCwgcHJvcCwgc3RyaW5nLCBwcm9wLCBzdHJpbmddXG4gIC8vIGFuZCB0aGlzIGlzIHRoZSBkZWZpbmluZyB2YWx1ZSB0byBkaXN0aW5ndWlzaCBiZXR3ZWVuIGFycmF5c1xuICByZXR1cm4gQXJyYXkuaXNBcnJheSh2YWx1ZSkgJiZcbiAgICAgICh0eXBlb2YodmFsdWUgYXMgU3R5bGluZ01hcEFycmF5KVtTdHlsaW5nTWFwQXJyYXlJbmRleC5WYWx1ZXNTdGFydFBvc2l0aW9uXSA9PT0gJ3N0cmluZycpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0SW5pdGlhbFN0eWxpbmdWYWx1ZShjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQgfCBTdHlsaW5nTWFwQXJyYXkgfCBudWxsKTogc3RyaW5nIHtcbiAgY29uc3QgbWFwID0gZ2V0U3R5bGluZ01hcEFycmF5KGNvbnRleHQpO1xuICByZXR1cm4gbWFwICYmIChtYXBbU3R5bGluZ01hcEFycmF5SW5kZXguUmF3VmFsdWVQb3NpdGlvbl0gYXMgc3RyaW5nIHwgbnVsbCkgfHwgJyc7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBoYXNDbGFzc0lucHV0KHROb2RlOiBUTm9kZSkge1xuICByZXR1cm4gKHROb2RlLmZsYWdzICYgVE5vZGVGbGFncy5oYXNDbGFzc0lucHV0KSAhPT0gMDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGhhc1N0eWxlSW5wdXQodE5vZGU6IFROb2RlKSB7XG4gIHJldHVybiAodE5vZGUuZmxhZ3MgJiBUTm9kZUZsYWdzLmhhc1N0eWxlSW5wdXQpICE9PSAwO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0TWFwUHJvcChtYXA6IFN0eWxpbmdNYXBBcnJheSwgaW5kZXg6IG51bWJlcik6IHN0cmluZyB7XG4gIHJldHVybiBtYXBbaW5kZXggKyBTdHlsaW5nTWFwQXJyYXlJbmRleC5Qcm9wT2Zmc2V0XSBhcyBzdHJpbmc7XG59XG5cbmNvbnN0IE1BUF9ESVJUWV9WQUxVRSA9XG4gICAgdHlwZW9mIG5nRGV2TW9kZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbmdEZXZNb2RlID8ge30gOiB7TUFQX0RJUlRZX1ZBTFVFOiB0cnVlfTtcblxuZXhwb3J0IGZ1bmN0aW9uIHNldE1hcEFzRGlydHkobWFwOiBTdHlsaW5nTWFwQXJyYXkpOiB2b2lkIHtcbiAgbWFwW1N0eWxpbmdNYXBBcnJheUluZGV4LlJhd1ZhbHVlUG9zaXRpb25dID0gTUFQX0RJUlRZX1ZBTFVFO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2V0TWFwVmFsdWUoXG4gICAgbWFwOiBTdHlsaW5nTWFwQXJyYXksIGluZGV4OiBudW1iZXIsIHZhbHVlOiBzdHJpbmcgfCBib29sZWFuIHwgbnVsbCk6IHZvaWQge1xuICBtYXBbaW5kZXggKyBTdHlsaW5nTWFwQXJyYXlJbmRleC5WYWx1ZU9mZnNldF0gPSB2YWx1ZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldE1hcFZhbHVlKG1hcDogU3R5bGluZ01hcEFycmF5LCBpbmRleDogbnVtYmVyKTogc3RyaW5nfG51bGwge1xuICByZXR1cm4gbWFwW2luZGV4ICsgU3R5bGluZ01hcEFycmF5SW5kZXguVmFsdWVPZmZzZXRdIGFzIHN0cmluZyB8IG51bGw7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBmb3JjZUNsYXNzZXNBc1N0cmluZyhjbGFzc2VzOiBzdHJpbmcgfCB7W2tleTogc3RyaW5nXTogYW55fSB8IG51bGwgfCB1bmRlZmluZWQpOlxuICAgIHN0cmluZyB7XG4gIGlmIChjbGFzc2VzICYmIHR5cGVvZiBjbGFzc2VzICE9PSAnc3RyaW5nJykge1xuICAgIGNsYXNzZXMgPSBPYmplY3Qua2V5cyhjbGFzc2VzKS5qb2luKCcgJyk7XG4gIH1cbiAgcmV0dXJuIChjbGFzc2VzIGFzIHN0cmluZykgfHwgJyc7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBmb3JjZVN0eWxlc0FzU3RyaW5nKHN0eWxlczoge1trZXk6IHN0cmluZ106IGFueX0gfCBudWxsIHwgdW5kZWZpbmVkKTogc3RyaW5nIHtcbiAgbGV0IHN0ciA9ICcnO1xuICBpZiAoc3R5bGVzKSB7XG4gICAgY29uc3QgcHJvcHMgPSBPYmplY3Qua2V5cyhzdHlsZXMpO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcHJvcHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IHByb3AgPSBwcm9wc1tpXTtcbiAgICAgIHN0ciA9IGNvbmNhdFN0cmluZyhzdHIsIGAke3Byb3B9OiR7c3R5bGVzW3Byb3BdfWAsICc7Jyk7XG4gICAgfVxuICB9XG4gIHJldHVybiBzdHI7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0hvc3RTdHlsaW5nQWN0aXZlKGRpcmVjdGl2ZU9yU291cmNlSWQ6IG51bWJlcik6IGJvb2xlYW4ge1xuICByZXR1cm4gZGlyZWN0aXZlT3JTb3VyY2VJZCAhPT0gVEVNUExBVEVfRElSRUNUSVZFX0lOREVYO1xufVxuXG4vKipcbiAqIENvbnZlcnRzIHRoZSBwcm92aWRlZCBzdHlsaW5nIG1hcCBhcnJheSBpbnRvIGEgc3RyaW5nLlxuICpcbiAqIENsYXNzZXMgPT4gYG9uZSB0d28gdGhyZWVgXG4gKiBTdHlsZXMgPT4gYHByb3A6dmFsdWU7IHByb3AyOnZhbHVlMmBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHN0eWxpbmdNYXBUb1N0cmluZyhtYXA6IFN0eWxpbmdNYXBBcnJheSwgaXNDbGFzc0Jhc2VkOiBib29sZWFuKTogc3RyaW5nIHtcbiAgbGV0IHN0ciA9ICcnO1xuICBmb3IgKGxldCBpID0gU3R5bGluZ01hcEFycmF5SW5kZXguVmFsdWVzU3RhcnRQb3NpdGlvbjsgaSA8IG1hcC5sZW5ndGg7XG4gICAgICAgaSArPSBTdHlsaW5nTWFwQXJyYXlJbmRleC5UdXBsZVNpemUpIHtcbiAgICBjb25zdCBwcm9wID0gZ2V0TWFwUHJvcChtYXAsIGkpO1xuICAgIGNvbnN0IHZhbHVlID0gZ2V0TWFwVmFsdWUobWFwLCBpKSBhcyBzdHJpbmc7XG4gICAgY29uc3QgYXR0clZhbHVlID0gY29uY2F0U3RyaW5nKHByb3AsIGlzQ2xhc3NCYXNlZCA/ICcnIDogdmFsdWUsICc6Jyk7XG4gICAgc3RyID0gY29uY2F0U3RyaW5nKHN0ciwgYXR0clZhbHVlLCBpc0NsYXNzQmFzZWQgPyAnICcgOiAnOyAnKTtcbiAgfVxuICByZXR1cm4gc3RyO1xufVxuXG4vKipcbiAqIENvbnZlcnRzIHRoZSBwcm92aWRlZCBzdHlsaW5nIG1hcCBhcnJheSBpbnRvIGEga2V5IHZhbHVlIG1hcC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHN0eWxpbmdNYXBUb1N0cmluZ01hcChtYXA6IFN0eWxpbmdNYXBBcnJheSB8IG51bGwpOiB7W2tleTogc3RyaW5nXTogYW55fSB7XG4gIGxldCBzdHJpbmdNYXA6IHtba2V5OiBzdHJpbmddOiBhbnl9ID0ge307XG4gIGlmIChtYXApIHtcbiAgICBmb3IgKGxldCBpID0gU3R5bGluZ01hcEFycmF5SW5kZXguVmFsdWVzU3RhcnRQb3NpdGlvbjsgaSA8IG1hcC5sZW5ndGg7XG4gICAgICAgICBpICs9IFN0eWxpbmdNYXBBcnJheUluZGV4LlR1cGxlU2l6ZSkge1xuICAgICAgY29uc3QgcHJvcCA9IGdldE1hcFByb3AobWFwLCBpKTtcbiAgICAgIGNvbnN0IHZhbHVlID0gZ2V0TWFwVmFsdWUobWFwLCBpKSBhcyBzdHJpbmc7XG4gICAgICBzdHJpbmdNYXBbcHJvcF0gPSB2YWx1ZTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHN0cmluZ01hcDtcbn1cblxuLyoqXG4gKiBJbnNlcnRzIHRoZSBwcm92aWRlZCBpdGVtIGludG8gdGhlIHByb3ZpZGVkIHN0eWxpbmcgYXJyYXkgYXQgdGhlIHJpZ2h0IHNwb3QuXG4gKlxuICogVGhlIGBTdHlsaW5nTWFwQXJyYXlgIHR5cGUgaXMgYSBzb3J0ZWQga2V5L3ZhbHVlIGFycmF5IG9mIGVudHJpZXMuIFRoaXMgbWVhbnNcbiAqIHRoYXQgd2hlbiBhIG5ldyBlbnRyeSBpcyBpbnNlcnRlZCBpdCBtdXN0IGJlIHBsYWNlZCBhdCB0aGUgcmlnaHQgc3BvdCBpbiB0aGVcbiAqIGFycmF5LiBUaGlzIGZ1bmN0aW9uIGZpZ3VyZXMgb3V0IGV4YWN0bHkgd2hlcmUgdG8gcGxhY2UgaXQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhZGRJdGVtVG9TdHlsaW5nTWFwKFxuICAgIHN0eWxpbmdNYXBBcnI6IFN0eWxpbmdNYXBBcnJheSwgcHJvcDogc3RyaW5nLCB2YWx1ZTogc3RyaW5nIHwgYm9vbGVhbiB8IG51bGwsXG4gICAgYWxsb3dPdmVyd3JpdGU/OiBib29sZWFuKSB7XG4gIGZvciAobGV0IGogPSBTdHlsaW5nTWFwQXJyYXlJbmRleC5WYWx1ZXNTdGFydFBvc2l0aW9uOyBqIDwgc3R5bGluZ01hcEFyci5sZW5ndGg7XG4gICAgICAgaiArPSBTdHlsaW5nTWFwQXJyYXlJbmRleC5UdXBsZVNpemUpIHtcbiAgICBjb25zdCBwcm9wQXRJbmRleCA9IGdldE1hcFByb3Aoc3R5bGluZ01hcEFyciwgaik7XG4gICAgaWYgKHByb3AgPD0gcHJvcEF0SW5kZXgpIHtcbiAgICAgIGxldCBhcHBsaWVkID0gZmFsc2U7XG4gICAgICBpZiAocHJvcEF0SW5kZXggPT09IHByb3ApIHtcbiAgICAgICAgY29uc3QgdmFsdWVBdEluZGV4ID0gc3R5bGluZ01hcEFycltqXTtcbiAgICAgICAgaWYgKGFsbG93T3ZlcndyaXRlIHx8ICFpc1N0eWxpbmdWYWx1ZURlZmluZWQodmFsdWVBdEluZGV4KSkge1xuICAgICAgICAgIGFwcGxpZWQgPSB0cnVlO1xuICAgICAgICAgIHNldE1hcFZhbHVlKHN0eWxpbmdNYXBBcnIsIGosIHZhbHVlKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYXBwbGllZCA9IHRydWU7XG4gICAgICAgIHN0eWxpbmdNYXBBcnIuc3BsaWNlKGosIDAsIHByb3AsIHZhbHVlKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBhcHBsaWVkO1xuICAgIH1cbiAgfVxuXG4gIHN0eWxpbmdNYXBBcnIucHVzaChwcm9wLCB2YWx1ZSk7XG4gIHJldHVybiB0cnVlO1xufVxuXG4vKipcbiAqIFVzZWQgdG8gY29udmVydCBhIHtrZXk6dmFsdWV9IG1hcCBpbnRvIGEgYFN0eWxpbmdNYXBBcnJheWAgYXJyYXkuXG4gKlxuICogVGhpcyBmdW5jdGlvbiB3aWxsIGVpdGhlciBnZW5lcmF0ZSBhIG5ldyBgU3R5bGluZ01hcEFycmF5YCBpbnN0YW5jZVxuICogb3IgaXQgd2lsbCBwYXRjaCB0aGUgcHJvdmlkZWQgYG5ld1ZhbHVlc2AgbWFwIHZhbHVlIGludG8gYW5cbiAqIGV4aXN0aW5nIGBTdHlsaW5nTWFwQXJyYXlgIHZhbHVlICh0aGlzIG9ubHkgaGFwcGVucyBpZiBgYmluZGluZ1ZhbHVlYFxuICogaXMgYW4gaW5zdGFuY2Ugb2YgYFN0eWxpbmdNYXBBcnJheWApLlxuICpcbiAqIElmIGEgbmV3IGtleS92YWx1ZSBtYXAgaXMgcHJvdmlkZWQgd2l0aCBhbiBvbGQgYFN0eWxpbmdNYXBBcnJheWBcbiAqIHZhbHVlIHRoZW4gYWxsIHByb3BlcnRpZXMgd2lsbCBiZSBvdmVyd3JpdHRlbiB3aXRoIHRoZWlyIG5ld1xuICogdmFsdWVzIG9yIHdpdGggYG51bGxgLiBUaGlzIG1lYW5zIHRoYXQgdGhlIGFycmF5IHdpbGwgbmV2ZXJcbiAqIHNocmluayBpbiBzaXplIChidXQgaXQgd2lsbCBhbHNvIG5vdCBiZSBjcmVhdGVkIGFuZCB0aHJvd25cbiAqIGF3YXkgd2hlbmV2ZXIgdGhlIGB7a2V5OnZhbHVlfWAgbWFwIGVudHJpZXMgY2hhbmdlKS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG5vcm1hbGl6ZUludG9TdHlsaW5nTWFwKFxuICAgIGJpbmRpbmdWYWx1ZTogbnVsbCB8IFN0eWxpbmdNYXBBcnJheSxcbiAgICBuZXdWYWx1ZXM6IHtba2V5OiBzdHJpbmddOiBhbnl9IHwgc3RyaW5nIHwgbnVsbCB8IHVuZGVmaW5lZCxcbiAgICBub3JtYWxpemVQcm9wcz86IGJvb2xlYW4pOiBTdHlsaW5nTWFwQXJyYXkge1xuICBjb25zdCBzdHlsaW5nTWFwQXJyOiBTdHlsaW5nTWFwQXJyYXkgPVxuICAgICAgQXJyYXkuaXNBcnJheShiaW5kaW5nVmFsdWUpID8gYmluZGluZ1ZhbHVlIDogYWxsb2NTdHlsaW5nTWFwQXJyYXkobnVsbCk7XG4gIHN0eWxpbmdNYXBBcnJbU3R5bGluZ01hcEFycmF5SW5kZXguUmF3VmFsdWVQb3NpdGlvbl0gPSBuZXdWYWx1ZXM7XG5cbiAgLy8gYmVjYXVzZSB0aGUgbmV3IHZhbHVlcyBtYXkgbm90IGluY2x1ZGUgYWxsIHRoZSBwcm9wZXJ0aWVzXG4gIC8vIHRoYXQgdGhlIG9sZCBvbmVzIGhhZCwgYWxsIHZhbHVlcyBhcmUgc2V0IHRvIGBudWxsYCBiZWZvcmVcbiAgLy8gdGhlIG5ldyB2YWx1ZXMgYXJlIGFwcGxpZWQuIFRoaXMgd2F5LCB3aGVuIGZsdXNoZWQsIHRoZVxuICAvLyBzdHlsaW5nIGFsZ29yaXRobSBrbm93cyBleGFjdGx5IHdoYXQgc3R5bGUvY2xhc3MgdmFsdWVzXG4gIC8vIHRvIHJlbW92ZSBmcm9tIHRoZSBlbGVtZW50IChzaW5jZSB0aGV5IGFyZSBgbnVsbGApLlxuICBmb3IgKGxldCBqID0gU3R5bGluZ01hcEFycmF5SW5kZXguVmFsdWVzU3RhcnRQb3NpdGlvbjsgaiA8IHN0eWxpbmdNYXBBcnIubGVuZ3RoO1xuICAgICAgIGogKz0gU3R5bGluZ01hcEFycmF5SW5kZXguVHVwbGVTaXplKSB7XG4gICAgc2V0TWFwVmFsdWUoc3R5bGluZ01hcEFyciwgaiwgbnVsbCk7XG4gIH1cblxuICBsZXQgcHJvcHM6IHN0cmluZ1tdfG51bGwgPSBudWxsO1xuICBsZXQgbWFwOiB7W2tleTogc3RyaW5nXTogYW55fXx1bmRlZmluZWR8bnVsbDtcbiAgbGV0IGFsbFZhbHVlc1RydWUgPSBmYWxzZTtcbiAgaWYgKHR5cGVvZiBuZXdWYWx1ZXMgPT09ICdzdHJpbmcnKSB7ICAvLyBbY2xhc3NdIGJpbmRpbmdzIGFsbG93IHN0cmluZyB2YWx1ZXNcbiAgICBpZiAobmV3VmFsdWVzLmxlbmd0aCkge1xuICAgICAgcHJvcHMgPSBuZXdWYWx1ZXMuc3BsaXQoL1xccysvKTtcbiAgICAgIGFsbFZhbHVlc1RydWUgPSB0cnVlO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBwcm9wcyA9IG5ld1ZhbHVlcyA/IE9iamVjdC5rZXlzKG5ld1ZhbHVlcykgOiBudWxsO1xuICAgIG1hcCA9IG5ld1ZhbHVlcztcbiAgfVxuXG4gIGlmIChwcm9wcykge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcHJvcHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IHByb3AgPSBwcm9wc1tpXTtcbiAgICAgIGNvbnN0IG5ld1Byb3AgPSBub3JtYWxpemVQcm9wcyA/IGh5cGhlbmF0ZShwcm9wKSA6IHByb3A7XG4gICAgICBjb25zdCB2YWx1ZSA9IGFsbFZhbHVlc1RydWUgPyB0cnVlIDogbWFwICFbcHJvcF07XG4gICAgICBhZGRJdGVtVG9TdHlsaW5nTWFwKHN0eWxpbmdNYXBBcnIsIG5ld1Byb3AsIHZhbHVlLCB0cnVlKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gc3R5bGluZ01hcEFycjtcbn1cblxuLy8gVE9ETyAobWF0c2tvfEFuZHJld0t1c2huaXIpOiByZWZhY3RvciB0aGlzIG9uY2Ugd2UgZmlndXJlIG91dCBob3cgdG8gZ2VuZXJhdGUgc2VwYXJhdGVcbi8vIGBpbnB1dCgnY2xhc3MnKSArIGNsYXNzTWFwKClgIGluc3RydWN0aW9ucy5cbmV4cG9ydCBmdW5jdGlvbiBzZWxlY3RDbGFzc0Jhc2VkSW5wdXROYW1lKGlucHV0czogUHJvcGVydHlBbGlhc2VzKTogc3RyaW5nIHtcbiAgcmV0dXJuIGlucHV0cy5oYXNPd25Qcm9wZXJ0eSgnY2xhc3MnKSA/ICdjbGFzcycgOiAnY2xhc3NOYW1lJztcbn0iXX0=