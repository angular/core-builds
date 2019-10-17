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
    initialStyling = initialStyling || allocStylingMapArray();
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
 * @return {?}
 */
export function allocStylingMapArray() {
    return [''];
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
    return bindingIndex > 0 ? (/** @type {?} */ (data[bindingIndex])) : null;
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
    const stylingMapArr = Array.isArray(bindingValue) ? bindingValue : [null];
    stylingMapArr[0 /* RawValuePosition */] = newValues || null;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3R5bGluZ191dGlscy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvdXRpbC9zdHlsaW5nX3V0aWxzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7QUFTQSxPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sV0FBVyxDQUFDOztBQUVwQyxNQUFNLE9BQU8seUJBQXlCLEdBQUcsT0FBTzs7QUFDaEQsTUFBTSxPQUFPLHdCQUF3QixHQUFHLENBQUM7Ozs7Ozs7Ozs7QUFVekMsTUFBTSxPQUFPLHFCQUFxQixHQUFHLElBQUk7O0FBRXpDLE1BQU0sT0FBTyxxQkFBcUIsR0FBRyxDQUFDOztNQUVoQyxxQkFBcUIsR0FBRyxDQUFDOzs7Ozs7O0FBTy9CLE1BQU0sT0FBTyx3QkFBd0IsR0FBRyxHQUFHOzs7Ozs7Ozs7Ozs7QUFVM0MsTUFBTSxVQUFVLG9CQUFvQixDQUNoQyxjQUFzQyxFQUFFLGFBQXNCO0lBQ2hFLGNBQWMsR0FBRyxjQUFjLElBQUksb0JBQW9CLEVBQUUsQ0FBQzs7UUFDdEQsTUFBTSxrQkFBeUI7SUFDbkMsSUFBSSxhQUFhLEVBQUU7UUFDakIsTUFBTSx5QkFBZ0MsQ0FBQztLQUN4QztJQUNELElBQUksY0FBYyxDQUFDLE1BQU0sOEJBQTJDLEVBQUU7UUFDcEUsTUFBTSw4QkFBb0MsQ0FBQztLQUM1QztJQUNELE9BQU87UUFDTCxNQUFNO1FBQ04scUJBQXFCO1FBQ3JCLGNBQWM7S0FDZixDQUFDO0FBQ0osQ0FBQzs7OztBQUVELE1BQU0sVUFBVSxvQkFBb0I7SUFDbEMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDO0FBQ2QsQ0FBQzs7Ozs7QUFFRCxNQUFNLFVBQVUsU0FBUyxDQUFDLE9BQXdCO0lBQ2hELE9BQU8sT0FBTyx3QkFBcUMsQ0FBQztBQUN0RCxDQUFDOzs7Ozs7QUFFRCxNQUFNLFVBQVUsU0FBUyxDQUFDLE9BQXdCLEVBQUUsSUFBb0I7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RSxFQUFHLHVDQUF1QztRQUMzRSxJQUFJLFNBQVMsQ0FBQyxNQUFNLEVBQUU7WUFDcEIsS0FBSyxHQUFHLFNBQVMsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDL0IsYUFBYSxHQUFHLElBQUksQ0FBQztTQUN0QjtLQUNGO1NBQU07UUFDTCxLQUFLLEdBQUcsU0FBUyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7UUFDbEQsR0FBRyxHQUFHLFNBQVMsQ0FBQztLQUNqQjtJQUVELElBQUksS0FBSyxFQUFFO1FBQ1QsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7O2tCQUMvQixJQUFJLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQzs7a0JBQ2YsT0FBTyxHQUFHLGNBQWMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJOztrQkFDakQsS0FBSyxHQUFHLGFBQWEsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxtQkFBQSxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUM7WUFDaEQsbUJBQW1CLENBQUMsYUFBYSxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsSUFBSSxDQUFDLENBQUM7U0FDMUQ7S0FDRjtJQUVELE9BQU8sYUFBYSxDQUFDO0FBQ3ZCLENBQUM7Ozs7Ozs7QUFJRCxNQUFNLFVBQVUseUJBQXlCLENBQUMsTUFBdUI7SUFDL0QsT0FBTyxNQUFNLENBQUMsY0FBYyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQztBQUNoRSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4qIEBsaWNlbnNlXG4qIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuKlxuKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4qL1xuaW1wb3J0IHtQcm9wZXJ0eUFsaWFzZXMsIFROb2RlLCBUTm9kZUZsYWdzfSBmcm9tICcuLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtMU3R5bGluZ0RhdGEsIFN0eWxpbmdNYXBBcnJheSwgU3R5bGluZ01hcEFycmF5SW5kZXgsIFRTdHlsaW5nQ29uZmlnLCBUU3R5bGluZ0NvbnRleHQsIFRTdHlsaW5nQ29udGV4dEluZGV4LCBUU3R5bGluZ0NvbnRleHRQcm9wQ29uZmlnRmxhZ3N9IGZyb20gJy4uL2ludGVyZmFjZXMvc3R5bGluZyc7XG5pbXBvcnQge05PX0NIQU5HRX0gZnJvbSAnLi4vdG9rZW5zJztcblxuZXhwb3J0IGNvbnN0IE1BUF9CQVNFRF9FTlRSWV9QUk9QX05BTUUgPSAnW01BUF0nO1xuZXhwb3J0IGNvbnN0IFRFTVBMQVRFX0RJUkVDVElWRV9JTkRFWCA9IDA7XG5cbi8qKlxuICogRGVmYXVsdCBmYWxsYmFjayB2YWx1ZSBmb3IgYSBzdHlsaW5nIGJpbmRpbmcuXG4gKlxuICogQSB2YWx1ZSBvZiBgbnVsbGAgaXMgdXNlZCBoZXJlIHdoaWNoIHNpZ25hbHMgdG8gdGhlIHN0eWxpbmcgYWxnb3JpdGhtIHRoYXRcbiAqIHRoZSBzdHlsaW5nIHZhbHVlIGlzIG5vdCBwcmVzZW50LiBUaGlzIHdheSBpZiB0aGVyZSBhcmUgbm8gb3RoZXIgdmFsdWVzXG4gKiBkZXRlY3RlZCB0aGVuIGl0IHdpbGwgYmUgcmVtb3ZlZCBvbmNlIHRoZSBzdHlsZS9jbGFzcyBwcm9wZXJ0eSBpcyBkaXJ0eSBhbmRcbiAqIGRpZmZlZCB3aXRoaW4gdGhlIHN0eWxpbmcgYWxnb3JpdGhtIHByZXNlbnQgaW4gYGZsdXNoU3R5bGluZ2AuXG4gKi9cbmV4cG9ydCBjb25zdCBERUZBVUxUX0JJTkRJTkdfVkFMVUUgPSBudWxsO1xuXG5leHBvcnQgY29uc3QgREVGQVVMVF9CSU5ESU5HX0lOREVYID0gMDtcblxuY29uc3QgREVGQVVMVF9UT1RBTF9TT1VSQ0VTID0gMTtcblxuLy8gVGhlIGZpcnN0IGJpdCB2YWx1ZSByZWZsZWN0cyBhIG1hcC1iYXNlZCBiaW5kaW5nIHZhbHVlJ3MgYml0LlxuLy8gVGhlIHJlYXNvbiB3aHkgaXQncyBhbHdheXMgYWN0aXZhdGVkIGZvciBldmVyeSBlbnRyeSBpbiB0aGUgbWFwXG4vLyBpcyBzbyB0aGF0IGlmIGFueSBtYXAtYmluZGluZyB2YWx1ZXMgdXBkYXRlIHRoZW4gYWxsIG90aGVyIHByb3Bcbi8vIGJhc2VkIGJpbmRpbmdzIHdpbGwgcGFzcyB0aGUgZ3VhcmQgY2hlY2sgYXV0b21hdGljYWxseSB3aXRob3V0XG4vLyBhbnkgZXh0cmEgY29kZSBvciBmbGFncy5cbmV4cG9ydCBjb25zdCBERUZBVUxUX0dVQVJEX01BU0tfVkFMVUUgPSAwYjE7XG5cbi8qKlxuICogQ3JlYXRlcyBhIG5ldyBpbnN0YW5jZSBvZiB0aGUgYFRTdHlsaW5nQ29udGV4dGAuXG4gKlxuICogVGhlIGBUU3R5bGluZ0NvbnRleHRgIGlzIHVzZWQgYXMgYSBtYW5pZmVzdCBvZiBhbGwgc3R5bGUgb3IgYWxsIGNsYXNzIGJpbmRpbmdzIG9uXG4gKiBhbiBlbGVtZW50LiBCZWNhdXNlIGl0IGlzIGEgVC1sZXZlbCBkYXRhLXN0cnVjdHVyZSwgaXQgaXMgb25seSBjcmVhdGVkIG9uY2UgcGVyXG4gKiB0Tm9kZSBmb3Igc3R5bGVzIGFuZCBmb3IgY2xhc3Nlcy4gVGhpcyBmdW5jdGlvbiBhbGxvY2F0ZXMgYSBuZXcgaW5zdGFuY2Ugb2YgYVxuICogYFRTdHlsaW5nQ29udGV4dGAgd2l0aCB0aGUgaW5pdGlhbCB2YWx1ZXMgKHNlZSBgaW50ZXJmYWNlcy50c2AgZm9yIG1vcmUgaW5mbykuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhbGxvY1RTdHlsaW5nQ29udGV4dChcbiAgICBpbml0aWFsU3R5bGluZzogU3R5bGluZ01hcEFycmF5IHwgbnVsbCwgaGFzRGlyZWN0aXZlczogYm9vbGVhbik6IFRTdHlsaW5nQ29udGV4dCB7XG4gIGluaXRpYWxTdHlsaW5nID0gaW5pdGlhbFN0eWxpbmcgfHwgYWxsb2NTdHlsaW5nTWFwQXJyYXkoKTtcbiAgbGV0IGNvbmZpZyA9IFRTdHlsaW5nQ29uZmlnLkluaXRpYWw7XG4gIGlmIChoYXNEaXJlY3RpdmVzKSB7XG4gICAgY29uZmlnIHw9IFRTdHlsaW5nQ29uZmlnLkhhc0RpcmVjdGl2ZXM7XG4gIH1cbiAgaWYgKGluaXRpYWxTdHlsaW5nLmxlbmd0aCA+IFN0eWxpbmdNYXBBcnJheUluZGV4LlZhbHVlc1N0YXJ0UG9zaXRpb24pIHtcbiAgICBjb25maWcgfD0gVFN0eWxpbmdDb25maWcuSGFzSW5pdGlhbFN0eWxpbmc7XG4gIH1cbiAgcmV0dXJuIFtcbiAgICBjb25maWcsICAgICAgICAgICAgICAgICAvLyAxKSBjb25maWcgZm9yIHRoZSBzdHlsaW5nIGNvbnRleHRcbiAgICBERUZBVUxUX1RPVEFMX1NPVVJDRVMsICAvLyAyKSB0b3RhbCBhbW91bnQgb2Ygc3R5bGluZyBzb3VyY2VzICh0ZW1wbGF0ZSwgZGlyZWN0aXZlcywgZXRjLi4uKVxuICAgIGluaXRpYWxTdHlsaW5nLCAgICAgICAgIC8vIDMpIGluaXRpYWwgc3R5bGluZyB2YWx1ZXNcbiAgXTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGFsbG9jU3R5bGluZ01hcEFycmF5KCk6IFN0eWxpbmdNYXBBcnJheSB7XG4gIHJldHVybiBbJyddO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q29uZmlnKGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCkge1xuICByZXR1cm4gY29udGV4dFtUU3R5bGluZ0NvbnRleHRJbmRleC5Db25maWdQb3NpdGlvbl07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBoYXNDb25maWcoY29udGV4dDogVFN0eWxpbmdDb250ZXh0LCBmbGFnOiBUU3R5bGluZ0NvbmZpZykge1xuICByZXR1cm4gKGdldENvbmZpZyhjb250ZXh0KSAmIGZsYWcpICE9PSAwO1xufVxuXG4vKipcbiAqIERldGVybWluZXMgd2hldGhlciBvciBub3QgdG8gYXBwbHkgc3R5bGVzL2NsYXNzZXMgZGlyZWN0bHkgb3IgdmlhIGNvbnRleHQgcmVzb2x1dGlvbi5cbiAqXG4gKiBUaGVyZSBhcmUgdGhyZWUgY2FzZXMgdGhhdCBhcmUgbWF0Y2hlZCBoZXJlOlxuICogMS4gdGhlcmUgYXJlIG5vIGRpcmVjdGl2ZXMgcHJlc2VudCBBTkQgbmdEZXZNb2RlIGlzIGZhbHN5XG4gKiAyLiBjb250ZXh0IGlzIGxvY2tlZCBmb3IgdGVtcGxhdGUgb3IgaG9zdCBiaW5kaW5ncyAoZGVwZW5kaW5nIG9uIGBob3N0QmluZGluZ3NNb2RlYClcbiAqIDMuIFRoZXJlIGFyZSBubyBjb2xsaXNpb25zIChpLmUuIHByb3BlcnRpZXMgd2l0aCBtb3JlIHRoYW4gb25lIGJpbmRpbmcpIGFjcm9zcyBtdWx0aXBsZVxuICogICAgc291cmNlcyAoaS5lLiB0ZW1wbGF0ZSArIGRpcmVjdGl2ZSwgZGlyZWN0aXZlICsgZGlyZWN0aXZlLCBkaXJlY3RpdmUgKyBjb21wb25lbnQpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhbGxvd0RpcmVjdFN0eWxpbmcoY29udGV4dDogVFN0eWxpbmdDb250ZXh0LCBob3N0QmluZGluZ3NNb2RlOiBib29sZWFuKTogYm9vbGVhbiB7XG4gIGxldCBhbGxvdyA9IGZhbHNlO1xuICBjb25zdCBjb25maWcgPSBnZXRDb25maWcoY29udGV4dCk7XG4gIGNvbnN0IGNvbnRleHRJc0xvY2tlZCA9IChjb25maWcgJiBnZXRMb2NrZWRDb25maWcoaG9zdEJpbmRpbmdzTW9kZSkpICE9PSAwO1xuICBjb25zdCBoYXNOb0RpcmVjdGl2ZXMgPSAoY29uZmlnICYgVFN0eWxpbmdDb25maWcuSGFzRGlyZWN0aXZlcykgPT09IDA7XG5cbiAgLy8gaWYgbm8gZGlyZWN0aXZlcyBhcmUgcHJlc2VudCB0aGVuIHdlIGRvIG5vdCBuZWVkIHBvcHVsYXRlIGEgY29udGV4dCBhdCBhbGwuIFRoaXNcbiAgLy8gaXMgYmVjYXVzZSBkdXBsaWNhdGUgcHJvcCBiaW5kaW5ncyBjYW5ub3QgYmUgcmVnaXN0ZXJlZCB0aHJvdWdoIHRoZSB0ZW1wbGF0ZS4gSWZcbiAgLy8gYW5kIHdoZW4gdGhpcyBoYXBwZW5zIHdlIGNhbiBzYWZlbHkgYXBwbHkgdGhlIHZhbHVlIGRpcmVjdGx5IHdpdGhvdXQgY29udGV4dFxuICAvLyByZXNvbHV0aW9uLi4uXG4gIGlmIChoYXNOb0RpcmVjdGl2ZXMpIHtcbiAgICAvLyBgbmdEZXZNb2RlYCBpcyByZXF1aXJlZCB0byBiZSBjaGVja2VkIGhlcmUgYmVjYXVzZSB0ZXN0cy9kZWJ1Z2dpbmcgcmVseSBvbiB0aGUgY29udGV4dCBiZWluZ1xuICAgIC8vIHBvcHVsYXRlZC4gSWYgdGhpbmdzIGFyZSBpbiBwcm9kdWN0aW9uIG1vZGUgdGhlbiB0aGVyZSBpcyBubyBuZWVkIHRvIGJ1aWxkIGEgY29udGV4dFxuICAgIC8vIHRoZXJlZm9yZSB0aGUgZGlyZWN0IGFwcGx5IGNhbiBiZSBhbGxvd2VkIChldmVuIG9uIHRoZSBmaXJzdCB1cGRhdGUpLlxuICAgIGFsbG93ID0gbmdEZXZNb2RlID8gY29udGV4dElzTG9ja2VkIDogdHJ1ZTtcbiAgfSBlbHNlIGlmIChjb250ZXh0SXNMb2NrZWQpIHtcbiAgICBjb25zdCBoYXNOb0NvbGxpc2lvbnMgPSAoY29uZmlnICYgVFN0eWxpbmdDb25maWcuSGFzQ29sbGlzaW9ucykgPT09IDA7XG4gICAgY29uc3QgaGFzT25seU1hcHNPck9ubHlQcm9wcyA9XG4gICAgICAgIChjb25maWcgJiBUU3R5bGluZ0NvbmZpZy5IYXNQcm9wQW5kTWFwQmluZGluZ3MpICE9PSBUU3R5bGluZ0NvbmZpZy5IYXNQcm9wQW5kTWFwQmluZGluZ3M7XG4gICAgYWxsb3cgPSBoYXNOb0NvbGxpc2lvbnMgJiYgaGFzT25seU1hcHNPck9ubHlQcm9wcztcbiAgfVxuXG4gIHJldHVybiBhbGxvdztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNldENvbmZpZyhjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQsIHZhbHVlOiBUU3R5bGluZ0NvbmZpZyk6IHZvaWQge1xuICBjb250ZXh0W1RTdHlsaW5nQ29udGV4dEluZGV4LkNvbmZpZ1Bvc2l0aW9uXSA9IHZhbHVlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcGF0Y2hDb25maWcoY29udGV4dDogVFN0eWxpbmdDb250ZXh0LCBmbGFnOiBUU3R5bGluZ0NvbmZpZyk6IHZvaWQge1xuICBjb250ZXh0W1RTdHlsaW5nQ29udGV4dEluZGV4LkNvbmZpZ1Bvc2l0aW9uXSB8PSBmbGFnO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0UHJvcChjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQsIGluZGV4OiBudW1iZXIpOiBzdHJpbmcge1xuICByZXR1cm4gY29udGV4dFtpbmRleCArIFRTdHlsaW5nQ29udGV4dEluZGV4LlByb3BPZmZzZXRdIGFzIHN0cmluZztcbn1cblxuZnVuY3Rpb24gZ2V0UHJvcENvbmZpZyhjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQsIGluZGV4OiBudW1iZXIpOiBudW1iZXIge1xuICByZXR1cm4gKGNvbnRleHRbaW5kZXggKyBUU3R5bGluZ0NvbnRleHRJbmRleC5Db25maWdPZmZzZXRdIGFzIG51bWJlcikgJlxuICAgICAgVFN0eWxpbmdDb250ZXh0UHJvcENvbmZpZ0ZsYWdzLk1hc2s7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc1Nhbml0aXphdGlvblJlcXVpcmVkKGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCwgaW5kZXg6IG51bWJlcik6IGJvb2xlYW4ge1xuICByZXR1cm4gKGdldFByb3BDb25maWcoY29udGV4dCwgaW5kZXgpICYgVFN0eWxpbmdDb250ZXh0UHJvcENvbmZpZ0ZsYWdzLlNhbml0aXphdGlvblJlcXVpcmVkKSAhPT1cbiAgICAgIDA7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRHdWFyZE1hc2soXG4gICAgY29udGV4dDogVFN0eWxpbmdDb250ZXh0LCBpbmRleDogbnVtYmVyLCBpc0hvc3RCaW5kaW5nOiBib29sZWFuKTogbnVtYmVyIHtcbiAgY29uc3QgcG9zaXRpb24gPSBpbmRleCArIChpc0hvc3RCaW5kaW5nID8gVFN0eWxpbmdDb250ZXh0SW5kZXguSG9zdEJpbmRpbmdzQml0R3VhcmRPZmZzZXQgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBUU3R5bGluZ0NvbnRleHRJbmRleC5UZW1wbGF0ZUJpdEd1YXJkT2Zmc2V0KTtcbiAgcmV0dXJuIGNvbnRleHRbcG9zaXRpb25dIGFzIG51bWJlcjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNldEd1YXJkTWFzayhcbiAgICBjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQsIGluZGV4OiBudW1iZXIsIG1hc2tWYWx1ZTogbnVtYmVyLCBpc0hvc3RCaW5kaW5nOiBib29sZWFuKSB7XG4gIGNvbnN0IHBvc2l0aW9uID0gaW5kZXggKyAoaXNIb3N0QmluZGluZyA/IFRTdHlsaW5nQ29udGV4dEluZGV4Lkhvc3RCaW5kaW5nc0JpdEd1YXJkT2Zmc2V0IDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgVFN0eWxpbmdDb250ZXh0SW5kZXguVGVtcGxhdGVCaXRHdWFyZE9mZnNldCk7XG4gIGNvbnRleHRbcG9zaXRpb25dID0gbWFza1ZhbHVlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0VmFsdWVzQ291bnQoY29udGV4dDogVFN0eWxpbmdDb250ZXh0KTogbnVtYmVyIHtcbiAgcmV0dXJuIGdldFRvdGFsU291cmNlcyhjb250ZXh0KSArIDE7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRUb3RhbFNvdXJjZXMoY29udGV4dDogVFN0eWxpbmdDb250ZXh0KTogbnVtYmVyIHtcbiAgcmV0dXJuIGNvbnRleHRbVFN0eWxpbmdDb250ZXh0SW5kZXguVG90YWxTb3VyY2VzUG9zaXRpb25dO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0QmluZGluZ1ZhbHVlKGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCwgaW5kZXg6IG51bWJlciwgb2Zmc2V0OiBudW1iZXIpIHtcbiAgcmV0dXJuIGNvbnRleHRbaW5kZXggKyBUU3R5bGluZ0NvbnRleHRJbmRleC5CaW5kaW5nc1N0YXJ0T2Zmc2V0ICsgb2Zmc2V0XSBhcyBudW1iZXIgfCBzdHJpbmc7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXREZWZhdWx0VmFsdWUoY29udGV4dDogVFN0eWxpbmdDb250ZXh0LCBpbmRleDogbnVtYmVyKTogc3RyaW5nfGJvb2xlYW58bnVsbCB7XG4gIHJldHVybiBjb250ZXh0W2luZGV4ICsgVFN0eWxpbmdDb250ZXh0SW5kZXguQmluZGluZ3NTdGFydE9mZnNldCArIGdldFRvdGFsU291cmNlcyhjb250ZXh0KV0gYXNcbiAgICAgICAgICAgICBzdHJpbmcgfFxuICAgICAgYm9vbGVhbiB8IG51bGw7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXREZWZhdWx0VmFsdWUoXG4gICAgY29udGV4dDogVFN0eWxpbmdDb250ZXh0LCBpbmRleDogbnVtYmVyLCB2YWx1ZTogc3RyaW5nIHwgYm9vbGVhbiB8IG51bGwpIHtcbiAgcmV0dXJuIGNvbnRleHRbaW5kZXggKyBUU3R5bGluZ0NvbnRleHRJbmRleC5CaW5kaW5nc1N0YXJ0T2Zmc2V0ICsgZ2V0VG90YWxTb3VyY2VzKGNvbnRleHQpXSA9XG4gICAgICAgICAgICAgdmFsdWU7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXRWYWx1ZShkYXRhOiBMU3R5bGluZ0RhdGEsIGJpbmRpbmdJbmRleDogbnVtYmVyLCB2YWx1ZTogYW55KSB7XG4gIGRhdGFbYmluZGluZ0luZGV4XSA9IHZhbHVlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0VmFsdWU8VCA9IGFueT4oZGF0YTogTFN0eWxpbmdEYXRhLCBiaW5kaW5nSW5kZXg6IG51bWJlcik6IFR8bnVsbCB7XG4gIHJldHVybiBiaW5kaW5nSW5kZXggPiAwID8gZGF0YVtiaW5kaW5nSW5kZXhdIGFzIFQgOiBudWxsO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gbG9ja0NvbnRleHQoY29udGV4dDogVFN0eWxpbmdDb250ZXh0LCBob3N0QmluZGluZ3NNb2RlOiBib29sZWFuKTogdm9pZCB7XG4gIHBhdGNoQ29uZmlnKGNvbnRleHQsIGdldExvY2tlZENvbmZpZyhob3N0QmluZGluZ3NNb2RlKSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0NvbnRleHRMb2NrZWQoY29udGV4dDogVFN0eWxpbmdDb250ZXh0LCBob3N0QmluZGluZ3NNb2RlOiBib29sZWFuKTogYm9vbGVhbiB7XG4gIHJldHVybiBoYXNDb25maWcoY29udGV4dCwgZ2V0TG9ja2VkQ29uZmlnKGhvc3RCaW5kaW5nc01vZGUpKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldExvY2tlZENvbmZpZyhob3N0QmluZGluZ3NNb2RlOiBib29sZWFuKSB7XG4gIHJldHVybiBob3N0QmluZGluZ3NNb2RlID8gVFN0eWxpbmdDb25maWcuSG9zdEJpbmRpbmdzTG9ja2VkIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBUU3R5bGluZ0NvbmZpZy5UZW1wbGF0ZUJpbmRpbmdzTG9ja2VkO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0UHJvcFZhbHVlc1N0YXJ0UG9zaXRpb24oY29udGV4dDogVFN0eWxpbmdDb250ZXh0KSB7XG4gIGxldCBzdGFydFBvc2l0aW9uID0gVFN0eWxpbmdDb250ZXh0SW5kZXguVmFsdWVzU3RhcnRQb3NpdGlvbjtcbiAgaWYgKGhhc0NvbmZpZyhjb250ZXh0LCBUU3R5bGluZ0NvbmZpZy5IYXNNYXBCaW5kaW5ncykpIHtcbiAgICBzdGFydFBvc2l0aW9uICs9IFRTdHlsaW5nQ29udGV4dEluZGV4LkJpbmRpbmdzU3RhcnRPZmZzZXQgKyBnZXRWYWx1ZXNDb3VudChjb250ZXh0KTtcbiAgfVxuICByZXR1cm4gc3RhcnRQb3NpdGlvbjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGhhc1ZhbHVlQ2hhbmdlZChcbiAgICBhOiBOT19DSEFOR0UgfCBTdHlsaW5nTWFwQXJyYXkgfCBudW1iZXIgfCBTdHJpbmcgfCBzdHJpbmcgfCBudWxsIHwgYm9vbGVhbiB8IHVuZGVmaW5lZCB8IHt9LFxuICAgIGI6IE5PX0NIQU5HRSB8IFN0eWxpbmdNYXBBcnJheSB8IG51bWJlciB8IFN0cmluZyB8IHN0cmluZyB8IG51bGwgfCBib29sZWFuIHwgdW5kZWZpbmVkIHxcbiAgICAgICAge30pOiBib29sZWFuIHtcbiAgaWYgKGIgPT09IE5PX0NIQU5HRSkgcmV0dXJuIGZhbHNlO1xuXG4gIGNvbnN0IGNvbXBhcmVWYWx1ZUEgPSBBcnJheS5pc0FycmF5KGEpID8gYVtTdHlsaW5nTWFwQXJyYXlJbmRleC5SYXdWYWx1ZVBvc2l0aW9uXSA6IGE7XG4gIGNvbnN0IGNvbXBhcmVWYWx1ZUIgPSBBcnJheS5pc0FycmF5KGIpID8gYltTdHlsaW5nTWFwQXJyYXlJbmRleC5SYXdWYWx1ZVBvc2l0aW9uXSA6IGI7XG4gIHJldHVybiAhT2JqZWN0LmlzKGNvbXBhcmVWYWx1ZUEsIGNvbXBhcmVWYWx1ZUIpO1xufVxuXG4vKipcbiAqIERldGVybWluZXMgd2hldGhlciB0aGUgcHJvdmlkZWQgc3R5bGluZyB2YWx1ZSBpcyB0cnV0aHkgb3IgZmFsc3kuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpc1N0eWxpbmdWYWx1ZURlZmluZWQ8VCBleHRlbmRzIHN0cmluZ3xudW1iZXJ8e318bnVsbD4odmFsdWU6IFQpOlxuICAgIHZhbHVlIGlzIE5vbk51bGxhYmxlPFQ+IHtcbiAgLy8gdGhlIHJlYXNvbiB3aHkgbnVsbCBpcyBjb21wYXJlZCBhZ2FpbnN0IGlzIGJlY2F1c2VcbiAgLy8gYSBDU1MgY2xhc3MgdmFsdWUgdGhhdCBpcyBzZXQgdG8gYGZhbHNlYCBtdXN0IGJlXG4gIC8vIHJlc3BlY3RlZCAob3RoZXJ3aXNlIGl0IHdvdWxkIGJlIHRyZWF0ZWQgYXMgZmFsc3kpLlxuICAvLyBFbXB0eSBzdHJpbmcgdmFsdWVzIGFyZSBiZWNhdXNlIGRldmVsb3BlcnMgdXN1YWxseVxuICAvLyBzZXQgYSB2YWx1ZSB0byBhbiBlbXB0eSBzdHJpbmcgdG8gcmVtb3ZlIGl0LlxuICByZXR1cm4gdmFsdWUgIT0gbnVsbCAmJiB2YWx1ZSAhPT0gJyc7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjb25jYXRTdHJpbmcoYTogc3RyaW5nLCBiOiBzdHJpbmcsIHNlcGFyYXRvciA9ICcgJyk6IHN0cmluZyB7XG4gIHJldHVybiBhICsgKChiLmxlbmd0aCAmJiBhLmxlbmd0aCkgPyBzZXBhcmF0b3IgOiAnJykgKyBiO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaHlwaGVuYXRlKHZhbHVlOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gdmFsdWUucmVwbGFjZSgvW2Etel1bQS1aXS9nLCB2ID0+IHYuY2hhckF0KDApICsgJy0nICsgdi5jaGFyQXQoMSkpLnRvTG93ZXJDYXNlKCk7XG59XG5cbi8qKlxuICogUmV0dXJucyBhbiBpbnN0YW5jZSBvZiBgU3R5bGluZ01hcEFycmF5YC5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIGlzIGRlc2lnbmVkIHRvIGZpbmQgYW4gaW5zdGFuY2Ugb2YgYFN0eWxpbmdNYXBBcnJheWAgaW4gY2FzZSBpdCBpcyBzdG9yZWRcbiAqIGluc2lkZSBvZiBhbiBpbnN0YW5jZSBvZiBgVFN0eWxpbmdDb250ZXh0YC4gV2hlbiBhIHN0eWxpbmcgY29udGV4dCBpcyBjcmVhdGVkIGl0XG4gKiB3aWxsIGNvcHkgb3ZlciBhbiBpbml0aWFsIHN0eWxpbmcgdmFsdWVzIGZyb20gdGhlIHROb2RlICh3aGljaCBhcmUgc3RvcmVkIGFzIGFcbiAqIGBTdHlsaW5nTWFwQXJyYXlgIG9uIHRoZSBgdE5vZGUuY2xhc3Nlc2Agb3IgYHROb2RlLnN0eWxlc2AgdmFsdWVzKS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldFN0eWxpbmdNYXBBcnJheSh2YWx1ZTogVFN0eWxpbmdDb250ZXh0IHwgU3R5bGluZ01hcEFycmF5IHwgbnVsbCk6XG4gICAgU3R5bGluZ01hcEFycmF5fG51bGwge1xuICByZXR1cm4gaXNTdHlsaW5nQ29udGV4dCh2YWx1ZSkgP1xuICAgICAgKHZhbHVlIGFzIFRTdHlsaW5nQ29udGV4dClbVFN0eWxpbmdDb250ZXh0SW5kZXguSW5pdGlhbFN0eWxpbmdWYWx1ZVBvc2l0aW9uXSA6XG4gICAgICB2YWx1ZSBhcyBTdHlsaW5nTWFwQXJyYXk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc1N0eWxpbmdDb250ZXh0KHZhbHVlOiBhbnkpOiBib29sZWFuIHtcbiAgLy8gdGhlIFN0eWxpbmdNYXBBcnJheSBpcyBpbiB0aGUgZm9ybWF0IG9mIFtpbml0aWFsLCBwcm9wLCBzdHJpbmcsIHByb3AsIHN0cmluZ11cbiAgLy8gYW5kIHRoaXMgaXMgdGhlIGRlZmluaW5nIHZhbHVlIHRvIGRpc3Rpbmd1aXNoIGJldHdlZW4gYXJyYXlzXG4gIHJldHVybiBBcnJheS5pc0FycmF5KHZhbHVlKSAmJiB2YWx1ZS5sZW5ndGggPj0gVFN0eWxpbmdDb250ZXh0SW5kZXguVmFsdWVzU3RhcnRQb3NpdGlvbiAmJlxuICAgICAgdHlwZW9mIHZhbHVlWzFdICE9PSAnc3RyaW5nJztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzU3R5bGluZ01hcEFycmF5KHZhbHVlOiBUU3R5bGluZ0NvbnRleHQgfCBTdHlsaW5nTWFwQXJyYXkgfCBudWxsKTogYm9vbGVhbiB7XG4gIC8vIHRoZSBTdHlsaW5nTWFwQXJyYXkgaXMgaW4gdGhlIGZvcm1hdCBvZiBbaW5pdGlhbCwgcHJvcCwgc3RyaW5nLCBwcm9wLCBzdHJpbmddXG4gIC8vIGFuZCB0aGlzIGlzIHRoZSBkZWZpbmluZyB2YWx1ZSB0byBkaXN0aW5ndWlzaCBiZXR3ZWVuIGFycmF5c1xuICByZXR1cm4gQXJyYXkuaXNBcnJheSh2YWx1ZSkgJiZcbiAgICAgICh0eXBlb2YodmFsdWUgYXMgU3R5bGluZ01hcEFycmF5KVtTdHlsaW5nTWFwQXJyYXlJbmRleC5WYWx1ZXNTdGFydFBvc2l0aW9uXSA9PT0gJ3N0cmluZycpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0SW5pdGlhbFN0eWxpbmdWYWx1ZShjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQgfCBTdHlsaW5nTWFwQXJyYXkgfCBudWxsKTogc3RyaW5nIHtcbiAgY29uc3QgbWFwID0gZ2V0U3R5bGluZ01hcEFycmF5KGNvbnRleHQpO1xuICByZXR1cm4gbWFwICYmIChtYXBbU3R5bGluZ01hcEFycmF5SW5kZXguUmF3VmFsdWVQb3NpdGlvbl0gYXMgc3RyaW5nIHwgbnVsbCkgfHwgJyc7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBoYXNDbGFzc0lucHV0KHROb2RlOiBUTm9kZSkge1xuICByZXR1cm4gKHROb2RlLmZsYWdzICYgVE5vZGVGbGFncy5oYXNDbGFzc0lucHV0KSAhPT0gMDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGhhc1N0eWxlSW5wdXQodE5vZGU6IFROb2RlKSB7XG4gIHJldHVybiAodE5vZGUuZmxhZ3MgJiBUTm9kZUZsYWdzLmhhc1N0eWxlSW5wdXQpICE9PSAwO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0TWFwUHJvcChtYXA6IFN0eWxpbmdNYXBBcnJheSwgaW5kZXg6IG51bWJlcik6IHN0cmluZyB7XG4gIHJldHVybiBtYXBbaW5kZXggKyBTdHlsaW5nTWFwQXJyYXlJbmRleC5Qcm9wT2Zmc2V0XSBhcyBzdHJpbmc7XG59XG5cbmNvbnN0IE1BUF9ESVJUWV9WQUxVRSA9XG4gICAgdHlwZW9mIG5nRGV2TW9kZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbmdEZXZNb2RlID8ge30gOiB7TUFQX0RJUlRZX1ZBTFVFOiB0cnVlfTtcblxuZXhwb3J0IGZ1bmN0aW9uIHNldE1hcEFzRGlydHkobWFwOiBTdHlsaW5nTWFwQXJyYXkpOiB2b2lkIHtcbiAgbWFwW1N0eWxpbmdNYXBBcnJheUluZGV4LlJhd1ZhbHVlUG9zaXRpb25dID0gTUFQX0RJUlRZX1ZBTFVFO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2V0TWFwVmFsdWUoXG4gICAgbWFwOiBTdHlsaW5nTWFwQXJyYXksIGluZGV4OiBudW1iZXIsIHZhbHVlOiBzdHJpbmcgfCBib29sZWFuIHwgbnVsbCk6IHZvaWQge1xuICBtYXBbaW5kZXggKyBTdHlsaW5nTWFwQXJyYXlJbmRleC5WYWx1ZU9mZnNldF0gPSB2YWx1ZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldE1hcFZhbHVlKG1hcDogU3R5bGluZ01hcEFycmF5LCBpbmRleDogbnVtYmVyKTogc3RyaW5nfG51bGwge1xuICByZXR1cm4gbWFwW2luZGV4ICsgU3R5bGluZ01hcEFycmF5SW5kZXguVmFsdWVPZmZzZXRdIGFzIHN0cmluZyB8IG51bGw7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBmb3JjZUNsYXNzZXNBc1N0cmluZyhjbGFzc2VzOiBzdHJpbmcgfCB7W2tleTogc3RyaW5nXTogYW55fSB8IG51bGwgfCB1bmRlZmluZWQpOlxuICAgIHN0cmluZyB7XG4gIGlmIChjbGFzc2VzICYmIHR5cGVvZiBjbGFzc2VzICE9PSAnc3RyaW5nJykge1xuICAgIGNsYXNzZXMgPSBPYmplY3Qua2V5cyhjbGFzc2VzKS5qb2luKCcgJyk7XG4gIH1cbiAgcmV0dXJuIChjbGFzc2VzIGFzIHN0cmluZykgfHwgJyc7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBmb3JjZVN0eWxlc0FzU3RyaW5nKHN0eWxlczoge1trZXk6IHN0cmluZ106IGFueX0gfCBudWxsIHwgdW5kZWZpbmVkKTogc3RyaW5nIHtcbiAgbGV0IHN0ciA9ICcnO1xuICBpZiAoc3R5bGVzKSB7XG4gICAgY29uc3QgcHJvcHMgPSBPYmplY3Qua2V5cyhzdHlsZXMpO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcHJvcHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IHByb3AgPSBwcm9wc1tpXTtcbiAgICAgIHN0ciA9IGNvbmNhdFN0cmluZyhzdHIsIGAke3Byb3B9OiR7c3R5bGVzW3Byb3BdfWAsICc7Jyk7XG4gICAgfVxuICB9XG4gIHJldHVybiBzdHI7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0hvc3RTdHlsaW5nQWN0aXZlKGRpcmVjdGl2ZU9yU291cmNlSWQ6IG51bWJlcik6IGJvb2xlYW4ge1xuICByZXR1cm4gZGlyZWN0aXZlT3JTb3VyY2VJZCAhPT0gVEVNUExBVEVfRElSRUNUSVZFX0lOREVYO1xufVxuXG4vKipcbiAqIENvbnZlcnRzIHRoZSBwcm92aWRlZCBzdHlsaW5nIG1hcCBhcnJheSBpbnRvIGEgc3RyaW5nLlxuICpcbiAqIENsYXNzZXMgPT4gYG9uZSB0d28gdGhyZWVgXG4gKiBTdHlsZXMgPT4gYHByb3A6dmFsdWU7IHByb3AyOnZhbHVlMmBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHN0eWxpbmdNYXBUb1N0cmluZyhtYXA6IFN0eWxpbmdNYXBBcnJheSwgaXNDbGFzc0Jhc2VkOiBib29sZWFuKTogc3RyaW5nIHtcbiAgbGV0IHN0ciA9ICcnO1xuICBmb3IgKGxldCBpID0gU3R5bGluZ01hcEFycmF5SW5kZXguVmFsdWVzU3RhcnRQb3NpdGlvbjsgaSA8IG1hcC5sZW5ndGg7XG4gICAgICAgaSArPSBTdHlsaW5nTWFwQXJyYXlJbmRleC5UdXBsZVNpemUpIHtcbiAgICBjb25zdCBwcm9wID0gZ2V0TWFwUHJvcChtYXAsIGkpO1xuICAgIGNvbnN0IHZhbHVlID0gZ2V0TWFwVmFsdWUobWFwLCBpKSBhcyBzdHJpbmc7XG4gICAgY29uc3QgYXR0clZhbHVlID0gY29uY2F0U3RyaW5nKHByb3AsIGlzQ2xhc3NCYXNlZCA/ICcnIDogdmFsdWUsICc6Jyk7XG4gICAgc3RyID0gY29uY2F0U3RyaW5nKHN0ciwgYXR0clZhbHVlLCBpc0NsYXNzQmFzZWQgPyAnICcgOiAnOyAnKTtcbiAgfVxuICByZXR1cm4gc3RyO1xufVxuXG4vKipcbiAqIENvbnZlcnRzIHRoZSBwcm92aWRlZCBzdHlsaW5nIG1hcCBhcnJheSBpbnRvIGEga2V5IHZhbHVlIG1hcC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHN0eWxpbmdNYXBUb1N0cmluZ01hcChtYXA6IFN0eWxpbmdNYXBBcnJheSB8IG51bGwpOiB7W2tleTogc3RyaW5nXTogYW55fSB7XG4gIGxldCBzdHJpbmdNYXA6IHtba2V5OiBzdHJpbmddOiBhbnl9ID0ge307XG4gIGlmIChtYXApIHtcbiAgICBmb3IgKGxldCBpID0gU3R5bGluZ01hcEFycmF5SW5kZXguVmFsdWVzU3RhcnRQb3NpdGlvbjsgaSA8IG1hcC5sZW5ndGg7XG4gICAgICAgICBpICs9IFN0eWxpbmdNYXBBcnJheUluZGV4LlR1cGxlU2l6ZSkge1xuICAgICAgY29uc3QgcHJvcCA9IGdldE1hcFByb3AobWFwLCBpKTtcbiAgICAgIGNvbnN0IHZhbHVlID0gZ2V0TWFwVmFsdWUobWFwLCBpKSBhcyBzdHJpbmc7XG4gICAgICBzdHJpbmdNYXBbcHJvcF0gPSB2YWx1ZTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHN0cmluZ01hcDtcbn1cblxuLyoqXG4gKiBJbnNlcnRzIHRoZSBwcm92aWRlZCBpdGVtIGludG8gdGhlIHByb3ZpZGVkIHN0eWxpbmcgYXJyYXkgYXQgdGhlIHJpZ2h0IHNwb3QuXG4gKlxuICogVGhlIGBTdHlsaW5nTWFwQXJyYXlgIHR5cGUgaXMgYSBzb3J0ZWQga2V5L3ZhbHVlIGFycmF5IG9mIGVudHJpZXMuIFRoaXMgbWVhbnNcbiAqIHRoYXQgd2hlbiBhIG5ldyBlbnRyeSBpcyBpbnNlcnRlZCBpdCBtdXN0IGJlIHBsYWNlZCBhdCB0aGUgcmlnaHQgc3BvdCBpbiB0aGVcbiAqIGFycmF5LiBUaGlzIGZ1bmN0aW9uIGZpZ3VyZXMgb3V0IGV4YWN0bHkgd2hlcmUgdG8gcGxhY2UgaXQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhZGRJdGVtVG9TdHlsaW5nTWFwKFxuICAgIHN0eWxpbmdNYXBBcnI6IFN0eWxpbmdNYXBBcnJheSwgcHJvcDogc3RyaW5nLCB2YWx1ZTogc3RyaW5nIHwgYm9vbGVhbiB8IG51bGwsXG4gICAgYWxsb3dPdmVyd3JpdGU/OiBib29sZWFuKSB7XG4gIGZvciAobGV0IGogPSBTdHlsaW5nTWFwQXJyYXlJbmRleC5WYWx1ZXNTdGFydFBvc2l0aW9uOyBqIDwgc3R5bGluZ01hcEFyci5sZW5ndGg7XG4gICAgICAgaiArPSBTdHlsaW5nTWFwQXJyYXlJbmRleC5UdXBsZVNpemUpIHtcbiAgICBjb25zdCBwcm9wQXRJbmRleCA9IGdldE1hcFByb3Aoc3R5bGluZ01hcEFyciwgaik7XG4gICAgaWYgKHByb3AgPD0gcHJvcEF0SW5kZXgpIHtcbiAgICAgIGxldCBhcHBsaWVkID0gZmFsc2U7XG4gICAgICBpZiAocHJvcEF0SW5kZXggPT09IHByb3ApIHtcbiAgICAgICAgY29uc3QgdmFsdWVBdEluZGV4ID0gc3R5bGluZ01hcEFycltqXTtcbiAgICAgICAgaWYgKGFsbG93T3ZlcndyaXRlIHx8ICFpc1N0eWxpbmdWYWx1ZURlZmluZWQodmFsdWVBdEluZGV4KSkge1xuICAgICAgICAgIGFwcGxpZWQgPSB0cnVlO1xuICAgICAgICAgIHNldE1hcFZhbHVlKHN0eWxpbmdNYXBBcnIsIGosIHZhbHVlKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYXBwbGllZCA9IHRydWU7XG4gICAgICAgIHN0eWxpbmdNYXBBcnIuc3BsaWNlKGosIDAsIHByb3AsIHZhbHVlKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBhcHBsaWVkO1xuICAgIH1cbiAgfVxuXG4gIHN0eWxpbmdNYXBBcnIucHVzaChwcm9wLCB2YWx1ZSk7XG4gIHJldHVybiB0cnVlO1xufVxuXG4vKipcbiAqIFVzZWQgdG8gY29udmVydCBhIHtrZXk6dmFsdWV9IG1hcCBpbnRvIGEgYFN0eWxpbmdNYXBBcnJheWAgYXJyYXkuXG4gKlxuICogVGhpcyBmdW5jdGlvbiB3aWxsIGVpdGhlciBnZW5lcmF0ZSBhIG5ldyBgU3R5bGluZ01hcEFycmF5YCBpbnN0YW5jZVxuICogb3IgaXQgd2lsbCBwYXRjaCB0aGUgcHJvdmlkZWQgYG5ld1ZhbHVlc2AgbWFwIHZhbHVlIGludG8gYW5cbiAqIGV4aXN0aW5nIGBTdHlsaW5nTWFwQXJyYXlgIHZhbHVlICh0aGlzIG9ubHkgaGFwcGVucyBpZiBgYmluZGluZ1ZhbHVlYFxuICogaXMgYW4gaW5zdGFuY2Ugb2YgYFN0eWxpbmdNYXBBcnJheWApLlxuICpcbiAqIElmIGEgbmV3IGtleS92YWx1ZSBtYXAgaXMgcHJvdmlkZWQgd2l0aCBhbiBvbGQgYFN0eWxpbmdNYXBBcnJheWBcbiAqIHZhbHVlIHRoZW4gYWxsIHByb3BlcnRpZXMgd2lsbCBiZSBvdmVyd3JpdHRlbiB3aXRoIHRoZWlyIG5ld1xuICogdmFsdWVzIG9yIHdpdGggYG51bGxgLiBUaGlzIG1lYW5zIHRoYXQgdGhlIGFycmF5IHdpbGwgbmV2ZXJcbiAqIHNocmluayBpbiBzaXplIChidXQgaXQgd2lsbCBhbHNvIG5vdCBiZSBjcmVhdGVkIGFuZCB0aHJvd25cbiAqIGF3YXkgd2hlbmV2ZXIgdGhlIGB7a2V5OnZhbHVlfWAgbWFwIGVudHJpZXMgY2hhbmdlKS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG5vcm1hbGl6ZUludG9TdHlsaW5nTWFwKFxuICAgIGJpbmRpbmdWYWx1ZTogbnVsbCB8IFN0eWxpbmdNYXBBcnJheSxcbiAgICBuZXdWYWx1ZXM6IHtba2V5OiBzdHJpbmddOiBhbnl9IHwgc3RyaW5nIHwgbnVsbCB8IHVuZGVmaW5lZCxcbiAgICBub3JtYWxpemVQcm9wcz86IGJvb2xlYW4pOiBTdHlsaW5nTWFwQXJyYXkge1xuICBjb25zdCBzdHlsaW5nTWFwQXJyOiBTdHlsaW5nTWFwQXJyYXkgPSBBcnJheS5pc0FycmF5KGJpbmRpbmdWYWx1ZSkgPyBiaW5kaW5nVmFsdWUgOiBbbnVsbF07XG4gIHN0eWxpbmdNYXBBcnJbU3R5bGluZ01hcEFycmF5SW5kZXguUmF3VmFsdWVQb3NpdGlvbl0gPSBuZXdWYWx1ZXMgfHwgbnVsbDtcblxuICAvLyBiZWNhdXNlIHRoZSBuZXcgdmFsdWVzIG1heSBub3QgaW5jbHVkZSBhbGwgdGhlIHByb3BlcnRpZXNcbiAgLy8gdGhhdCB0aGUgb2xkIG9uZXMgaGFkLCBhbGwgdmFsdWVzIGFyZSBzZXQgdG8gYG51bGxgIGJlZm9yZVxuICAvLyB0aGUgbmV3IHZhbHVlcyBhcmUgYXBwbGllZC4gVGhpcyB3YXksIHdoZW4gZmx1c2hlZCwgdGhlXG4gIC8vIHN0eWxpbmcgYWxnb3JpdGhtIGtub3dzIGV4YWN0bHkgd2hhdCBzdHlsZS9jbGFzcyB2YWx1ZXNcbiAgLy8gdG8gcmVtb3ZlIGZyb20gdGhlIGVsZW1lbnQgKHNpbmNlIHRoZXkgYXJlIGBudWxsYCkuXG4gIGZvciAobGV0IGogPSBTdHlsaW5nTWFwQXJyYXlJbmRleC5WYWx1ZXNTdGFydFBvc2l0aW9uOyBqIDwgc3R5bGluZ01hcEFyci5sZW5ndGg7XG4gICAgICAgaiArPSBTdHlsaW5nTWFwQXJyYXlJbmRleC5UdXBsZVNpemUpIHtcbiAgICBzZXRNYXBWYWx1ZShzdHlsaW5nTWFwQXJyLCBqLCBudWxsKTtcbiAgfVxuXG4gIGxldCBwcm9wczogc3RyaW5nW118bnVsbCA9IG51bGw7XG4gIGxldCBtYXA6IHtba2V5OiBzdHJpbmddOiBhbnl9fHVuZGVmaW5lZHxudWxsO1xuICBsZXQgYWxsVmFsdWVzVHJ1ZSA9IGZhbHNlO1xuICBpZiAodHlwZW9mIG5ld1ZhbHVlcyA9PT0gJ3N0cmluZycpIHsgIC8vIFtjbGFzc10gYmluZGluZ3MgYWxsb3cgc3RyaW5nIHZhbHVlc1xuICAgIGlmIChuZXdWYWx1ZXMubGVuZ3RoKSB7XG4gICAgICBwcm9wcyA9IG5ld1ZhbHVlcy5zcGxpdCgvXFxzKy8pO1xuICAgICAgYWxsVmFsdWVzVHJ1ZSA9IHRydWU7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIHByb3BzID0gbmV3VmFsdWVzID8gT2JqZWN0LmtleXMobmV3VmFsdWVzKSA6IG51bGw7XG4gICAgbWFwID0gbmV3VmFsdWVzO1xuICB9XG5cbiAgaWYgKHByb3BzKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwcm9wcy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgcHJvcCA9IHByb3BzW2ldO1xuICAgICAgY29uc3QgbmV3UHJvcCA9IG5vcm1hbGl6ZVByb3BzID8gaHlwaGVuYXRlKHByb3ApIDogcHJvcDtcbiAgICAgIGNvbnN0IHZhbHVlID0gYWxsVmFsdWVzVHJ1ZSA/IHRydWUgOiBtYXAgIVtwcm9wXTtcbiAgICAgIGFkZEl0ZW1Ub1N0eWxpbmdNYXAoc3R5bGluZ01hcEFyciwgbmV3UHJvcCwgdmFsdWUsIHRydWUpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBzdHlsaW5nTWFwQXJyO1xufVxuXG4vLyBUT0RPIChtYXRza298QW5kcmV3S3VzaG5pcik6IHJlZmFjdG9yIHRoaXMgb25jZSB3ZSBmaWd1cmUgb3V0IGhvdyB0byBnZW5lcmF0ZSBzZXBhcmF0ZVxuLy8gYGlucHV0KCdjbGFzcycpICsgY2xhc3NNYXAoKWAgaW5zdHJ1Y3Rpb25zLlxuZXhwb3J0IGZ1bmN0aW9uIHNlbGVjdENsYXNzQmFzZWRJbnB1dE5hbWUoaW5wdXRzOiBQcm9wZXJ0eUFsaWFzZXMpOiBzdHJpbmcge1xuICByZXR1cm4gaW5wdXRzLmhhc093blByb3BlcnR5KCdjbGFzcycpID8gJ2NsYXNzJyA6ICdjbGFzc05hbWUnO1xufSJdfQ==