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
 * @param {?=} initialStyling
 * @return {?}
 */
export function allocTStylingContext(initialStyling) {
    initialStyling = initialStyling || allocStylingMapArray();
    return [
        0 /* Initial */,
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
 * 1. context is locked for template or host bindings (depending on `hostBindingsMode`)
 * 2. There are no collisions (i.e. properties with more than one binding)
 * 3. There are only "prop" or "map" bindings present, but not both
 * @param {?} context
 * @param {?} hostBindingsMode
 * @return {?}
 */
export function allowDirectStyling(context, hostBindingsMode) {
    /** @type {?} */
    const config = getConfig(context);
    return ((config & getLockedConfig(hostBindingsMode)) !== 0) &&
        ((config & 4 /* HasCollisions */) === 0) &&
        ((config & 3 /* HasPropAndMapBindings */) !== 3 /* HasPropAndMapBindings */);
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
    return hostBindingsMode ? 128 /* HostBindingsLocked */ :
        64 /* TemplateBindingsLocked */;
}
/**
 * @param {?} context
 * @return {?}
 */
export function getPropValuesStartPosition(context) {
    /** @type {?} */
    let startPosition = 3 /* ValuesStartPosition */;
    if (hasConfig(context, 2 /* HasMapBindings */)) {
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
            const prop = (/** @type {?} */ (props[i]));
            /** @type {?} */
            const newProp = normalizeProps ? hyphenate(prop) : prop;
            /** @type {?} */
            const value = allValuesTrue ? true : (/** @type {?} */ (map))[prop];
            addItemToStylingMap(stylingMapArr, newProp, value, true);
        }
    }
    return stylingMapArr;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3R5bGluZ191dGlscy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvdXRpbC9zdHlsaW5nX3V0aWxzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7QUFTQSxPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sV0FBVyxDQUFDOztBQUVwQyxNQUFNLE9BQU8seUJBQXlCLEdBQUcsT0FBTzs7QUFDaEQsTUFBTSxPQUFPLHdCQUF3QixHQUFHLENBQUM7Ozs7Ozs7Ozs7QUFVekMsTUFBTSxPQUFPLHFCQUFxQixHQUFHLElBQUk7O0FBRXpDLE1BQU0sT0FBTyxxQkFBcUIsR0FBRyxDQUFDOztNQUVoQyxxQkFBcUIsR0FBRyxDQUFDOzs7Ozs7O0FBTy9CLE1BQU0sT0FBTyx3QkFBd0IsR0FBRyxHQUFHOzs7Ozs7Ozs7OztBQVUzQyxNQUFNLFVBQVUsb0JBQW9CLENBQUMsY0FBdUM7SUFDMUUsY0FBYyxHQUFHLGNBQWMsSUFBSSxvQkFBb0IsRUFBRSxDQUFDO0lBQzFELE9BQU87O1FBRUwscUJBQXFCO1FBQ3JCLGNBQWM7S0FDZixDQUFDO0FBQ0osQ0FBQzs7OztBQUVELE1BQU0sVUFBVSxvQkFBb0I7SUFDbEMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDO0FBQ2QsQ0FBQzs7Ozs7QUFFRCxNQUFNLFVBQVUsU0FBUyxDQUFDLE9BQXdCO0lBQ2hELE9BQU8sT0FBTyx3QkFBcUMsQ0FBQztBQUN0RCxDQUFDOzs7Ozs7QUFFRCxNQUFNLFVBQVUsU0FBUyxDQUFDLE9BQXdCLEVBQUUsSUFBb0I7SUFDdEUsT0FBTyxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDM0MsQ0FBQzs7Ozs7Ozs7Ozs7O0FBVUQsTUFBTSxVQUFVLGtCQUFrQixDQUFDLE9BQXdCLEVBQUUsZ0JBQXlCOztVQUM5RSxNQUFNLEdBQUcsU0FBUyxD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Q2pELEtBQUssR0FBRyxhQUFhLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsbUJBQUEsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDO1lBQ2hELG1CQUFtQixDQUFDLGFBQWEsRUFBRSxPQUFPLEVBQUUsS0FBSyxFQUFFLElBQUksQ0FBQyxDQUFDO1NBQzFEO0tBQ0Y7SUFFRCxPQUFPLGFBQWEsQ0FBQztBQUN2QixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4qIEBsaWNlbnNlXG4qIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuKlxuKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4qL1xuaW1wb3J0IHtUTm9kZSwgVE5vZGVGbGFnc30gZnJvbSAnLi4vaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB7TFN0eWxpbmdEYXRhLCBTdHlsaW5nTWFwQXJyYXksIFN0eWxpbmdNYXBBcnJheUluZGV4LCBUU3R5bGluZ0NvbmZpZywgVFN0eWxpbmdDb250ZXh0LCBUU3R5bGluZ0NvbnRleHRJbmRleCwgVFN0eWxpbmdDb250ZXh0UHJvcENvbmZpZ0ZsYWdzfSBmcm9tICcuLi9pbnRlcmZhY2VzL3N0eWxpbmcnO1xuaW1wb3J0IHtOT19DSEFOR0V9IGZyb20gJy4uL3Rva2Vucyc7XG5cbmV4cG9ydCBjb25zdCBNQVBfQkFTRURfRU5UUllfUFJPUF9OQU1FID0gJ1tNQVBdJztcbmV4cG9ydCBjb25zdCBURU1QTEFURV9ESVJFQ1RJVkVfSU5ERVggPSAwO1xuXG4vKipcbiAqIERlZmF1bHQgZmFsbGJhY2sgdmFsdWUgZm9yIGEgc3R5bGluZyBiaW5kaW5nLlxuICpcbiAqIEEgdmFsdWUgb2YgYG51bGxgIGlzIHVzZWQgaGVyZSB3aGljaCBzaWduYWxzIHRvIHRoZSBzdHlsaW5nIGFsZ29yaXRobSB0aGF0XG4gKiB0aGUgc3R5bGluZyB2YWx1ZSBpcyBub3QgcHJlc2VudC4gVGhpcyB3YXkgaWYgdGhlcmUgYXJlIG5vIG90aGVyIHZhbHVlc1xuICogZGV0ZWN0ZWQgdGhlbiBpdCB3aWxsIGJlIHJlbW92ZWQgb25jZSB0aGUgc3R5bGUvY2xhc3MgcHJvcGVydHkgaXMgZGlydHkgYW5kXG4gKiBkaWZmZWQgd2l0aGluIHRoZSBzdHlsaW5nIGFsZ29yaXRobSBwcmVzZW50IGluIGBmbHVzaFN0eWxpbmdgLlxuICovXG5leHBvcnQgY29uc3QgREVGQVVMVF9CSU5ESU5HX1ZBTFVFID0gbnVsbDtcblxuZXhwb3J0IGNvbnN0IERFRkFVTFRfQklORElOR19JTkRFWCA9IDA7XG5cbmNvbnN0IERFRkFVTFRfVE9UQUxfU09VUkNFUyA9IDE7XG5cbi8vIFRoZSBmaXJzdCBiaXQgdmFsdWUgcmVmbGVjdHMgYSBtYXAtYmFzZWQgYmluZGluZyB2YWx1ZSdzIGJpdC5cbi8vIFRoZSByZWFzb24gd2h5IGl0J3MgYWx3YXlzIGFjdGl2YXRlZCBmb3IgZXZlcnkgZW50cnkgaW4gdGhlIG1hcFxuLy8gaXMgc28gdGhhdCBpZiBhbnkgbWFwLWJpbmRpbmcgdmFsdWVzIHVwZGF0ZSB0aGVuIGFsbCBvdGhlciBwcm9wXG4vLyBiYXNlZCBiaW5kaW5ncyB3aWxsIHBhc3MgdGhlIGd1YXJkIGNoZWNrIGF1dG9tYXRpY2FsbHkgd2l0aG91dFxuLy8gYW55IGV4dHJhIGNvZGUgb3IgZmxhZ3MuXG5leHBvcnQgY29uc3QgREVGQVVMVF9HVUFSRF9NQVNLX1ZBTFVFID0gMGIxO1xuXG4vKipcbiAqIENyZWF0ZXMgYSBuZXcgaW5zdGFuY2Ugb2YgdGhlIGBUU3R5bGluZ0NvbnRleHRgLlxuICpcbiAqIFRoZSBgVFN0eWxpbmdDb250ZXh0YCBpcyB1c2VkIGFzIGEgbWFuaWZlc3Qgb2YgYWxsIHN0eWxlIG9yIGFsbCBjbGFzcyBiaW5kaW5ncyBvblxuICogYW4gZWxlbWVudC4gQmVjYXVzZSBpdCBpcyBhIFQtbGV2ZWwgZGF0YS1zdHJ1Y3R1cmUsIGl0IGlzIG9ubHkgY3JlYXRlZCBvbmNlIHBlclxuICogdE5vZGUgZm9yIHN0eWxlcyBhbmQgZm9yIGNsYXNzZXMuIFRoaXMgZnVuY3Rpb24gYWxsb2NhdGVzIGEgbmV3IGluc3RhbmNlIG9mIGFcbiAqIGBUU3R5bGluZ0NvbnRleHRgIHdpdGggdGhlIGluaXRpYWwgdmFsdWVzIChzZWUgYGludGVyZmFjZXMudHNgIGZvciBtb3JlIGluZm8pLlxuICovXG5leHBvcnQgZnVuY3Rpb24gYWxsb2NUU3R5bGluZ0NvbnRleHQoaW5pdGlhbFN0eWxpbmc/OiBTdHlsaW5nTWFwQXJyYXkgfCBudWxsKTogVFN0eWxpbmdDb250ZXh0IHtcbiAgaW5pdGlhbFN0eWxpbmcgPSBpbml0aWFsU3R5bGluZyB8fCBhbGxvY1N0eWxpbmdNYXBBcnJheSgpO1xuICByZXR1cm4gW1xuICAgIFRTdHlsaW5nQ29uZmlnLkluaXRpYWwsICAvLyAxKSBjb25maWcgZm9yIHRoZSBzdHlsaW5nIGNvbnRleHRcbiAgICBERUZBVUxUX1RPVEFMX1NPVVJDRVMsICAgLy8gMikgdG90YWwgYW1vdW50IG9mIHN0eWxpbmcgc291cmNlcyAodGVtcGxhdGUsIGRpcmVjdGl2ZXMsIGV0Yy4uLilcbiAgICBpbml0aWFsU3R5bGluZywgICAgICAgICAgLy8gMykgaW5pdGlhbCBzdHlsaW5nIHZhbHVlc1xuICBdO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYWxsb2NTdHlsaW5nTWFwQXJyYXkoKTogU3R5bGluZ01hcEFycmF5IHtcbiAgcmV0dXJuIFsnJ107XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRDb25maWcoY29udGV4dDogVFN0eWxpbmdDb250ZXh0KSB7XG4gIHJldHVybiBjb250ZXh0W1RTdHlsaW5nQ29udGV4dEluZGV4LkNvbmZpZ1Bvc2l0aW9uXTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGhhc0NvbmZpZyhjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQsIGZsYWc6IFRTdHlsaW5nQ29uZmlnKSB7XG4gIHJldHVybiAoZ2V0Q29uZmlnKGNvbnRleHQpICYgZmxhZykgIT09IDA7XG59XG5cbi8qKlxuICogRGV0ZXJtaW5lcyB3aGV0aGVyIG9yIG5vdCB0byBhcHBseSBzdHlsZXMvY2xhc3NlcyBkaXJlY3RseSBvciB2aWEgY29udGV4dCByZXNvbHV0aW9uLlxuICpcbiAqIFRoZXJlIGFyZSB0aHJlZSBjYXNlcyB0aGF0IGFyZSBtYXRjaGVkIGhlcmU6XG4gKiAxLiBjb250ZXh0IGlzIGxvY2tlZCBmb3IgdGVtcGxhdGUgb3IgaG9zdCBiaW5kaW5ncyAoZGVwZW5kaW5nIG9uIGBob3N0QmluZGluZ3NNb2RlYClcbiAqIDIuIFRoZXJlIGFyZSBubyBjb2xsaXNpb25zIChpLmUuIHByb3BlcnRpZXMgd2l0aCBtb3JlIHRoYW4gb25lIGJpbmRpbmcpXG4gKiAzLiBUaGVyZSBhcmUgb25seSBcInByb3BcIiBvciBcIm1hcFwiIGJpbmRpbmdzIHByZXNlbnQsIGJ1dCBub3QgYm90aFxuICovXG5leHBvcnQgZnVuY3Rpb24gYWxsb3dEaXJlY3RTdHlsaW5nKGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCwgaG9zdEJpbmRpbmdzTW9kZTogYm9vbGVhbik6IGJvb2xlYW4ge1xuICBjb25zdCBjb25maWcgPSBnZXRDb25maWcoY29udGV4dCk7XG4gIHJldHVybiAoKGNvbmZpZyAmIGdldExvY2tlZENvbmZpZyhob3N0QmluZGluZ3NNb2RlKSkgIT09IDApICYmXG4gICAgICAoKGNvbmZpZyAmIFRTdHlsaW5nQ29uZmlnLkhhc0NvbGxpc2lvbnMpID09PSAwKSAmJlxuICAgICAgKChjb25maWcgJiBUU3R5bGluZ0NvbmZpZy5IYXNQcm9wQW5kTWFwQmluZGluZ3MpICE9PSBUU3R5bGluZ0NvbmZpZy5IYXNQcm9wQW5kTWFwQmluZGluZ3MpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2V0Q29uZmlnKGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCwgdmFsdWU6IFRTdHlsaW5nQ29uZmlnKTogdm9pZCB7XG4gIGNvbnRleHRbVFN0eWxpbmdDb250ZXh0SW5kZXguQ29uZmlnUG9zaXRpb25dID0gdmFsdWU7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwYXRjaENvbmZpZyhjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQsIGZsYWc6IFRTdHlsaW5nQ29uZmlnKTogdm9pZCB7XG4gIGNvbnRleHRbVFN0eWxpbmdDb250ZXh0SW5kZXguQ29uZmlnUG9zaXRpb25dIHw9IGZsYWc7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRQcm9wKGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCwgaW5kZXg6IG51bWJlcik6IHN0cmluZyB7XG4gIHJldHVybiBjb250ZXh0W2luZGV4ICsgVFN0eWxpbmdDb250ZXh0SW5kZXguUHJvcE9mZnNldF0gYXMgc3RyaW5nO1xufVxuXG5mdW5jdGlvbiBnZXRQcm9wQ29uZmlnKGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCwgaW5kZXg6IG51bWJlcik6IG51bWJlciB7XG4gIHJldHVybiAoY29udGV4dFtpbmRleCArIFRTdHlsaW5nQ29udGV4dEluZGV4LkNvbmZpZ09mZnNldF0gYXMgbnVtYmVyKSAmXG4gICAgICBUU3R5bGluZ0NvbnRleHRQcm9wQ29uZmlnRmxhZ3MuTWFzaztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzU2FuaXRpemF0aW9uUmVxdWlyZWQoY29udGV4dDogVFN0eWxpbmdDb250ZXh0LCBpbmRleDogbnVtYmVyKTogYm9vbGVhbiB7XG4gIHJldHVybiAoZ2V0UHJvcENvbmZpZyhjb250ZXh0LCBpbmRleCkgJiBUU3R5bGluZ0NvbnRleHRQcm9wQ29uZmlnRmxhZ3MuU2FuaXRpemF0aW9uUmVxdWlyZWQpICE9PVxuICAgICAgMDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEd1YXJkTWFzayhcbiAgICBjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQsIGluZGV4OiBudW1iZXIsIGlzSG9zdEJpbmRpbmc6IGJvb2xlYW4pOiBudW1iZXIge1xuICBjb25zdCBwb3NpdGlvbiA9IGluZGV4ICsgKGlzSG9zdEJpbmRpbmcgPyBUU3R5bGluZ0NvbnRleHRJbmRleC5Ib3N0QmluZGluZ3NCaXRHdWFyZE9mZnNldCA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFRTdHlsaW5nQ29udGV4dEluZGV4LlRlbXBsYXRlQml0R3VhcmRPZmZzZXQpO1xuICByZXR1cm4gY29udGV4dFtwb3NpdGlvbl0gYXMgbnVtYmVyO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2V0R3VhcmRNYXNrKFxuICAgIGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCwgaW5kZXg6IG51bWJlciwgbWFza1ZhbHVlOiBudW1iZXIsIGlzSG9zdEJpbmRpbmc6IGJvb2xlYW4pIHtcbiAgY29uc3QgcG9zaXRpb24gPSBpbmRleCArIChpc0hvc3RCaW5kaW5nID8gVFN0eWxpbmdDb250ZXh0SW5kZXguSG9zdEJpbmRpbmdzQml0R3VhcmRPZmZzZXQgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBUU3R5bGluZ0NvbnRleHRJbmRleC5UZW1wbGF0ZUJpdEd1YXJkT2Zmc2V0KTtcbiAgY29udGV4dFtwb3NpdGlvbl0gPSBtYXNrVmFsdWU7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRWYWx1ZXNDb3VudChjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQpOiBudW1iZXIge1xuICByZXR1cm4gZ2V0VG90YWxTb3VyY2VzKGNvbnRleHQpICsgMTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFRvdGFsU291cmNlcyhjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQpOiBudW1iZXIge1xuICByZXR1cm4gY29udGV4dFtUU3R5bGluZ0NvbnRleHRJbmRleC5Ub3RhbFNvdXJjZXNQb3NpdGlvbl07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRCaW5kaW5nVmFsdWUoY29udGV4dDogVFN0eWxpbmdDb250ZXh0LCBpbmRleDogbnVtYmVyLCBvZmZzZXQ6IG51bWJlcikge1xuICByZXR1cm4gY29udGV4dFtpbmRleCArIFRTdHlsaW5nQ29udGV4dEluZGV4LkJpbmRpbmdzU3RhcnRPZmZzZXQgKyBvZmZzZXRdIGFzIG51bWJlciB8IHN0cmluZztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldERlZmF1bHRWYWx1ZShjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQsIGluZGV4OiBudW1iZXIpOiBzdHJpbmd8Ym9vbGVhbnxudWxsIHtcbiAgcmV0dXJuIGNvbnRleHRbaW5kZXggKyBUU3R5bGluZ0NvbnRleHRJbmRleC5CaW5kaW5nc1N0YXJ0T2Zmc2V0ICsgZ2V0VG90YWxTb3VyY2VzKGNvbnRleHQpXSBhc1xuICAgICAgICAgICAgIHN0cmluZyB8XG4gICAgICBib29sZWFuIHwgbnVsbDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNldERlZmF1bHRWYWx1ZShcbiAgICBjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQsIGluZGV4OiBudW1iZXIsIHZhbHVlOiBzdHJpbmcgfCBib29sZWFuIHwgbnVsbCkge1xuICByZXR1cm4gY29udGV4dFtpbmRleCArIFRTdHlsaW5nQ29udGV4dEluZGV4LkJpbmRpbmdzU3RhcnRPZmZzZXQgKyBnZXRUb3RhbFNvdXJjZXMoY29udGV4dCldID1cbiAgICAgICAgICAgICB2YWx1ZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNldFZhbHVlKGRhdGE6IExTdHlsaW5nRGF0YSwgYmluZGluZ0luZGV4OiBudW1iZXIsIHZhbHVlOiBhbnkpIHtcbiAgZGF0YVtiaW5kaW5nSW5kZXhdID0gdmFsdWU7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRWYWx1ZTxUID0gYW55PihkYXRhOiBMU3R5bGluZ0RhdGEsIGJpbmRpbmdJbmRleDogbnVtYmVyKTogVHxudWxsIHtcbiAgcmV0dXJuIGJpbmRpbmdJbmRleCA+IDAgPyBkYXRhW2JpbmRpbmdJbmRleF0gYXMgVCA6IG51bGw7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBsb2NrQ29udGV4dChjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQsIGhvc3RCaW5kaW5nc01vZGU6IGJvb2xlYW4pOiB2b2lkIHtcbiAgcGF0Y2hDb25maWcoY29udGV4dCwgZ2V0TG9ja2VkQ29uZmlnKGhvc3RCaW5kaW5nc01vZGUpKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzQ29udGV4dExvY2tlZChjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQsIGhvc3RCaW5kaW5nc01vZGU6IGJvb2xlYW4pOiBib29sZWFuIHtcbiAgcmV0dXJuIGhhc0NvbmZpZyhjb250ZXh0LCBnZXRMb2NrZWRDb25maWcoaG9zdEJpbmRpbmdzTW9kZSkpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0TG9ja2VkQ29uZmlnKGhvc3RCaW5kaW5nc01vZGU6IGJvb2xlYW4pIHtcbiAgcmV0dXJuIGhvc3RCaW5kaW5nc01vZGUgPyBUU3R5bGluZ0NvbmZpZy5Ib3N0QmluZGluZ3NMb2NrZWQgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFRTdHlsaW5nQ29uZmlnLlRlbXBsYXRlQmluZGluZ3NMb2NrZWQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRQcm9wVmFsdWVzU3RhcnRQb3NpdGlvbihjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQpIHtcbiAgbGV0IHN0YXJ0UG9zaXRpb24gPSBUU3R5bGluZ0NvbnRleHRJbmRleC5WYWx1ZXNTdGFydFBvc2l0aW9uO1xuICBpZiAoaGFzQ29uZmlnKGNvbnRleHQsIFRTdHlsaW5nQ29uZmlnLkhhc01hcEJpbmRpbmdzKSkge1xuICAgIHN0YXJ0UG9zaXRpb24gKz0gVFN0eWxpbmdDb250ZXh0SW5kZXguQmluZGluZ3NTdGFydE9mZnNldCArIGdldFZhbHVlc0NvdW50KGNvbnRleHQpO1xuICB9XG4gIHJldHVybiBzdGFydFBvc2l0aW9uO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaGFzVmFsdWVDaGFuZ2VkKFxuICAgIGE6IE5PX0NIQU5HRSB8IFN0eWxpbmdNYXBBcnJheSB8IG51bWJlciB8IFN0cmluZyB8IHN0cmluZyB8IG51bGwgfCBib29sZWFuIHwgdW5kZWZpbmVkIHwge30sXG4gICAgYjogTk9fQ0hBTkdFIHwgU3R5bGluZ01hcEFycmF5IHwgbnVtYmVyIHwgU3RyaW5nIHwgc3RyaW5nIHwgbnVsbCB8IGJvb2xlYW4gfCB1bmRlZmluZWQgfFxuICAgICAgICB7fSk6IGJvb2xlYW4ge1xuICBpZiAoYiA9PT0gTk9fQ0hBTkdFKSByZXR1cm4gZmFsc2U7XG5cbiAgY29uc3QgY29tcGFyZVZhbHVlQSA9IEFycmF5LmlzQXJyYXkoYSkgPyBhW1N0eWxpbmdNYXBBcnJheUluZGV4LlJhd1ZhbHVlUG9zaXRpb25dIDogYTtcbiAgY29uc3QgY29tcGFyZVZhbHVlQiA9IEFycmF5LmlzQXJyYXkoYikgPyBiW1N0eWxpbmdNYXBBcnJheUluZGV4LlJhd1ZhbHVlUG9zaXRpb25dIDogYjtcbiAgcmV0dXJuICFPYmplY3QuaXMoY29tcGFyZVZhbHVlQSwgY29tcGFyZVZhbHVlQik7XG59XG5cbi8qKlxuICogRGV0ZXJtaW5lcyB3aGV0aGVyIHRoZSBwcm92aWRlZCBzdHlsaW5nIHZhbHVlIGlzIHRydXRoeSBvciBmYWxzeS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzU3R5bGluZ1ZhbHVlRGVmaW5lZCh2YWx1ZTogYW55KSB7XG4gIC8vIHRoZSByZWFzb24gd2h5IG51bGwgaXMgY29tcGFyZWQgYWdhaW5zdCBpcyBiZWNhdXNlXG4gIC8vIGEgQ1NTIGNsYXNzIHZhbHVlIHRoYXQgaXMgc2V0IHRvIGBmYWxzZWAgbXVzdCBiZVxuICAvLyByZXNwZWN0ZWQgKG90aGVyd2lzZSBpdCB3b3VsZCBiZSB0cmVhdGVkIGFzIGZhbHN5KS5cbiAgLy8gRW1wdHkgc3RyaW5nIHZhbHVlcyBhcmUgYmVjYXVzZSBkZXZlbG9wZXJzIHVzdWFsbHlcbiAgLy8gc2V0IGEgdmFsdWUgdG8gYW4gZW1wdHkgc3RyaW5nIHRvIHJlbW92ZSBpdC5cbiAgcmV0dXJuIHZhbHVlICE9IG51bGwgJiYgdmFsdWUgIT09ICcnO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY29uY2F0U3RyaW5nKGE6IHN0cmluZywgYjogc3RyaW5nLCBzZXBhcmF0b3IgPSAnICcpOiBzdHJpbmcge1xuICByZXR1cm4gYSArICgoYi5sZW5ndGggJiYgYS5sZW5ndGgpID8gc2VwYXJhdG9yIDogJycpICsgYjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGh5cGhlbmF0ZSh2YWx1ZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHZhbHVlLnJlcGxhY2UoL1thLXpdW0EtWl0vZywgdiA9PiB2LmNoYXJBdCgwKSArICctJyArIHYuY2hhckF0KDEpKS50b0xvd2VyQ2FzZSgpO1xufVxuXG4vKipcbiAqIFJldHVybnMgYW4gaW5zdGFuY2Ugb2YgYFN0eWxpbmdNYXBBcnJheWAuXG4gKlxuICogVGhpcyBmdW5jdGlvbiBpcyBkZXNpZ25lZCB0byBmaW5kIGFuIGluc3RhbmNlIG9mIGBTdHlsaW5nTWFwQXJyYXlgIGluIGNhc2UgaXQgaXMgc3RvcmVkXG4gKiBpbnNpZGUgb2YgYW4gaW5zdGFuY2Ugb2YgYFRTdHlsaW5nQ29udGV4dGAuIFdoZW4gYSBzdHlsaW5nIGNvbnRleHQgaXMgY3JlYXRlZCBpdFxuICogd2lsbCBjb3B5IG92ZXIgYW4gaW5pdGlhbCBzdHlsaW5nIHZhbHVlcyBmcm9tIHRoZSB0Tm9kZSAod2hpY2ggYXJlIHN0b3JlZCBhcyBhXG4gKiBgU3R5bGluZ01hcEFycmF5YCBvbiB0aGUgYHROb2RlLmNsYXNzZXNgIG9yIGB0Tm9kZS5zdHlsZXNgIHZhbHVlcykuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRTdHlsaW5nTWFwQXJyYXkodmFsdWU6IFRTdHlsaW5nQ29udGV4dCB8IFN0eWxpbmdNYXBBcnJheSB8IG51bGwpOlxuICAgIFN0eWxpbmdNYXBBcnJheXxudWxsIHtcbiAgcmV0dXJuIGlzU3R5bGluZ0NvbnRleHQodmFsdWUpID9cbiAgICAgICh2YWx1ZSBhcyBUU3R5bGluZ0NvbnRleHQpW1RTdHlsaW5nQ29udGV4dEluZGV4LkluaXRpYWxTdHlsaW5nVmFsdWVQb3NpdGlvbl0gOlxuICAgICAgdmFsdWUgYXMgU3R5bGluZ01hcEFycmF5O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNTdHlsaW5nQ29udGV4dCh2YWx1ZTogVFN0eWxpbmdDb250ZXh0IHwgU3R5bGluZ01hcEFycmF5IHwgbnVsbCk6IGJvb2xlYW4ge1xuICAvLyB0aGUgU3R5bGluZ01hcEFycmF5IGlzIGluIHRoZSBmb3JtYXQgb2YgW2luaXRpYWwsIHByb3AsIHN0cmluZywgcHJvcCwgc3RyaW5nXVxuICAvLyBhbmQgdGhpcyBpcyB0aGUgZGVmaW5pbmcgdmFsdWUgdG8gZGlzdGluZ3Vpc2ggYmV0d2VlbiBhcnJheXNcbiAgcmV0dXJuIEFycmF5LmlzQXJyYXkodmFsdWUpICYmIHZhbHVlLmxlbmd0aCA+PSBUU3R5bGluZ0NvbnRleHRJbmRleC5WYWx1ZXNTdGFydFBvc2l0aW9uICYmXG4gICAgICB0eXBlb2YgdmFsdWVbMV0gIT09ICdzdHJpbmcnO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNTdHlsaW5nTWFwQXJyYXkodmFsdWU6IFRTdHlsaW5nQ29udGV4dCB8IFN0eWxpbmdNYXBBcnJheSB8IG51bGwpOiBib29sZWFuIHtcbiAgLy8gdGhlIFN0eWxpbmdNYXBBcnJheSBpcyBpbiB0aGUgZm9ybWF0IG9mIFtpbml0aWFsLCBwcm9wLCBzdHJpbmcsIHByb3AsIHN0cmluZ11cbiAgLy8gYW5kIHRoaXMgaXMgdGhlIGRlZmluaW5nIHZhbHVlIHRvIGRpc3Rpbmd1aXNoIGJldHdlZW4gYXJyYXlzXG4gIHJldHVybiBBcnJheS5pc0FycmF5KHZhbHVlKSAmJlxuICAgICAgKHR5cGVvZih2YWx1ZSBhcyBTdHlsaW5nTWFwQXJyYXkpW1N0eWxpbmdNYXBBcnJheUluZGV4LlZhbHVlc1N0YXJ0UG9zaXRpb25dID09PSAnc3RyaW5nJyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRJbml0aWFsU3R5bGluZ1ZhbHVlKGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCB8IFN0eWxpbmdNYXBBcnJheSB8IG51bGwpOiBzdHJpbmcge1xuICBjb25zdCBtYXAgPSBnZXRTdHlsaW5nTWFwQXJyYXkoY29udGV4dCk7XG4gIHJldHVybiBtYXAgJiYgKG1hcFtTdHlsaW5nTWFwQXJyYXlJbmRleC5SYXdWYWx1ZVBvc2l0aW9uXSBhcyBzdHJpbmcgfCBudWxsKSB8fCAnJztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGhhc0NsYXNzSW5wdXQodE5vZGU6IFROb2RlKSB7XG4gIHJldHVybiAodE5vZGUuZmxhZ3MgJiBUTm9kZUZsYWdzLmhhc0NsYXNzSW5wdXQpICE9PSAwO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaGFzU3R5bGVJbnB1dCh0Tm9kZTogVE5vZGUpIHtcbiAgcmV0dXJuICh0Tm9kZS5mbGFncyAmIFROb2RlRmxhZ3MuaGFzU3R5bGVJbnB1dCkgIT09IDA7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRNYXBQcm9wKG1hcDogU3R5bGluZ01hcEFycmF5LCBpbmRleDogbnVtYmVyKTogc3RyaW5nIHtcbiAgcmV0dXJuIG1hcFtpbmRleCArIFN0eWxpbmdNYXBBcnJheUluZGV4LlByb3BPZmZzZXRdIGFzIHN0cmluZztcbn1cblxuY29uc3QgTUFQX0RJUlRZX1ZBTFVFID1cbiAgICB0eXBlb2YgbmdEZXZNb2RlICE9PSAndW5kZWZpbmVkJyAmJiBuZ0Rldk1vZGUgPyB7fSA6IHtNQVBfRElSVFlfVkFMVUU6IHRydWV9O1xuXG5leHBvcnQgZnVuY3Rpb24gc2V0TWFwQXNEaXJ0eShtYXA6IFN0eWxpbmdNYXBBcnJheSk6IHZvaWQge1xuICBtYXBbU3R5bGluZ01hcEFycmF5SW5kZXguUmF3VmFsdWVQb3NpdGlvbl0gPSBNQVBfRElSVFlfVkFMVUU7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXRNYXBWYWx1ZShcbiAgICBtYXA6IFN0eWxpbmdNYXBBcnJheSwgaW5kZXg6IG51bWJlciwgdmFsdWU6IHN0cmluZyB8IGJvb2xlYW4gfCBudWxsKTogdm9pZCB7XG4gIG1hcFtpbmRleCArIFN0eWxpbmdNYXBBcnJheUluZGV4LlZhbHVlT2Zmc2V0XSA9IHZhbHVlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0TWFwVmFsdWUobWFwOiBTdHlsaW5nTWFwQXJyYXksIGluZGV4OiBudW1iZXIpOiBzdHJpbmd8bnVsbCB7XG4gIHJldHVybiBtYXBbaW5kZXggKyBTdHlsaW5nTWFwQXJyYXlJbmRleC5WYWx1ZU9mZnNldF0gYXMgc3RyaW5nIHwgbnVsbDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGZvcmNlQ2xhc3Nlc0FzU3RyaW5nKGNsYXNzZXM6IHN0cmluZyB8IHtba2V5OiBzdHJpbmddOiBhbnl9IHwgbnVsbCB8IHVuZGVmaW5lZCk6XG4gICAgc3RyaW5nIHtcbiAgaWYgKGNsYXNzZXMgJiYgdHlwZW9mIGNsYXNzZXMgIT09ICdzdHJpbmcnKSB7XG4gICAgY2xhc3NlcyA9IE9iamVjdC5rZXlzKGNsYXNzZXMpLmpvaW4oJyAnKTtcbiAgfVxuICByZXR1cm4gKGNsYXNzZXMgYXMgc3RyaW5nKSB8fCAnJztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGZvcmNlU3R5bGVzQXNTdHJpbmcoc3R5bGVzOiB7W2tleTogc3RyaW5nXTogYW55fSB8IG51bGwgfCB1bmRlZmluZWQpOiBzdHJpbmcge1xuICBsZXQgc3RyID0gJyc7XG4gIGlmIChzdHlsZXMpIHtcbiAgICBjb25zdCBwcm9wcyA9IE9iamVjdC5rZXlzKHN0eWxlcyk7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwcm9wcy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgcHJvcCA9IHByb3BzW2ldO1xuICAgICAgc3RyID0gY29uY2F0U3RyaW5nKHN0ciwgYCR7cHJvcH06JHtzdHlsZXNbcHJvcF19YCwgJzsnKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHN0cjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzSG9zdFN0eWxpbmdBY3RpdmUoZGlyZWN0aXZlT3JTb3VyY2VJZDogbnVtYmVyKTogYm9vbGVhbiB7XG4gIHJldHVybiBkaXJlY3RpdmVPclNvdXJjZUlkICE9PSBURU1QTEFURV9ESVJFQ1RJVkVfSU5ERVg7XG59XG5cbi8qKlxuICogQ29udmVydHMgdGhlIHByb3ZpZGVkIHN0eWxpbmcgbWFwIGFycmF5IGludG8gYSBzdHJpbmcuXG4gKlxuICogQ2xhc3NlcyA9PiBgb25lIHR3byB0aHJlZWBcbiAqIFN0eWxlcyA9PiBgcHJvcDp2YWx1ZTsgcHJvcDI6dmFsdWUyYFxuICovXG5leHBvcnQgZnVuY3Rpb24gc3R5bGluZ01hcFRvU3RyaW5nKG1hcDogU3R5bGluZ01hcEFycmF5LCBpc0NsYXNzQmFzZWQ6IGJvb2xlYW4pOiBzdHJpbmcge1xuICBsZXQgc3RyID0gJyc7XG4gIGZvciAobGV0IGkgPSBTdHlsaW5nTWFwQXJyYXlJbmRleC5WYWx1ZXNTdGFydFBvc2l0aW9uOyBpIDwgbWFwLmxlbmd0aDtcbiAgICAgICBpICs9IFN0eWxpbmdNYXBBcnJheUluZGV4LlR1cGxlU2l6ZSkge1xuICAgIGNvbnN0IHByb3AgPSBnZXRNYXBQcm9wKG1hcCwgaSk7XG4gICAgY29uc3QgdmFsdWUgPSBnZXRNYXBWYWx1ZShtYXAsIGkpIGFzIHN0cmluZztcbiAgICBjb25zdCBhdHRyVmFsdWUgPSBjb25jYXRTdHJpbmcocHJvcCwgaXNDbGFzc0Jhc2VkID8gJycgOiB2YWx1ZSwgJzonKTtcbiAgICBzdHIgPSBjb25jYXRTdHJpbmcoc3RyLCBhdHRyVmFsdWUsIGlzQ2xhc3NCYXNlZCA/ICcgJyA6ICc7ICcpO1xuICB9XG4gIHJldHVybiBzdHI7XG59XG5cbi8qKlxuICogQ29udmVydHMgdGhlIHByb3ZpZGVkIHN0eWxpbmcgbWFwIGFycmF5IGludG8gYSBrZXkgdmFsdWUgbWFwLlxuICovXG5leHBvcnQgZnVuY3Rpb24gc3R5bGluZ01hcFRvU3RyaW5nTWFwKG1hcDogU3R5bGluZ01hcEFycmF5IHwgbnVsbCk6IHtba2V5OiBzdHJpbmddOiBhbnl9IHtcbiAgbGV0IHN0cmluZ01hcDoge1trZXk6IHN0cmluZ106IGFueX0gPSB7fTtcbiAgaWYgKG1hcCkge1xuICAgIGZvciAobGV0IGkgPSBTdHlsaW5nTWFwQXJyYXlJbmRleC5WYWx1ZXNTdGFydFBvc2l0aW9uOyBpIDwgbWFwLmxlbmd0aDtcbiAgICAgICAgIGkgKz0gU3R5bGluZ01hcEFycmF5SW5kZXguVHVwbGVTaXplKSB7XG4gICAgICBjb25zdCBwcm9wID0gZ2V0TWFwUHJvcChtYXAsIGkpO1xuICAgICAgY29uc3QgdmFsdWUgPSBnZXRNYXBWYWx1ZShtYXAsIGkpIGFzIHN0cmluZztcbiAgICAgIHN0cmluZ01hcFtwcm9wXSA9IHZhbHVlO1xuICAgIH1cbiAgfVxuICByZXR1cm4gc3RyaW5nTWFwO1xufVxuXG4vKipcbiAqIEluc2VydHMgdGhlIHByb3ZpZGVkIGl0ZW0gaW50byB0aGUgcHJvdmlkZWQgc3R5bGluZyBhcnJheSBhdCB0aGUgcmlnaHQgc3BvdC5cbiAqXG4gKiBUaGUgYFN0eWxpbmdNYXBBcnJheWAgdHlwZSBpcyBhIHNvcnRlZCBrZXkvdmFsdWUgYXJyYXkgb2YgZW50cmllcy4gVGhpcyBtZWFuc1xuICogdGhhdCB3aGVuIGEgbmV3IGVudHJ5IGlzIGluc2VydGVkIGl0IG11c3QgYmUgcGxhY2VkIGF0IHRoZSByaWdodCBzcG90IGluIHRoZVxuICogYXJyYXkuIFRoaXMgZnVuY3Rpb24gZmlndXJlcyBvdXQgZXhhY3RseSB3aGVyZSB0byBwbGFjZSBpdC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFkZEl0ZW1Ub1N0eWxpbmdNYXAoXG4gICAgc3R5bGluZ01hcEFycjogU3R5bGluZ01hcEFycmF5LCBwcm9wOiBzdHJpbmcsIHZhbHVlOiBzdHJpbmcgfCBib29sZWFuIHwgbnVsbCxcbiAgICBhbGxvd092ZXJ3cml0ZT86IGJvb2xlYW4pIHtcbiAgZm9yIChsZXQgaiA9IFN0eWxpbmdNYXBBcnJheUluZGV4LlZhbHVlc1N0YXJ0UG9zaXRpb247IGogPCBzdHlsaW5nTWFwQXJyLmxlbmd0aDtcbiAgICAgICBqICs9IFN0eWxpbmdNYXBBcnJheUluZGV4LlR1cGxlU2l6ZSkge1xuICAgIGNvbnN0IHByb3BBdEluZGV4ID0gZ2V0TWFwUHJvcChzdHlsaW5nTWFwQXJyLCBqKTtcbiAgICBpZiAocHJvcCA8PSBwcm9wQXRJbmRleCkge1xuICAgICAgbGV0IGFwcGxpZWQgPSBmYWxzZTtcbiAgICAgIGlmIChwcm9wQXRJbmRleCA9PT0gcHJvcCkge1xuICAgICAgICBjb25zdCB2YWx1ZUF0SW5kZXggPSBzdHlsaW5nTWFwQXJyW2pdO1xuICAgICAgICBpZiAoYWxsb3dPdmVyd3JpdGUgfHwgIWlzU3R5bGluZ1ZhbHVlRGVmaW5lZCh2YWx1ZUF0SW5kZXgpKSB7XG4gICAgICAgICAgYXBwbGllZCA9IHRydWU7XG4gICAgICAgICAgc2V0TWFwVmFsdWUoc3R5bGluZ01hcEFyciwgaiwgdmFsdWUpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBhcHBsaWVkID0gdHJ1ZTtcbiAgICAgICAgc3R5bGluZ01hcEFyci5zcGxpY2UoaiwgMCwgcHJvcCwgdmFsdWUpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGFwcGxpZWQ7XG4gICAgfVxuICB9XG5cbiAgc3R5bGluZ01hcEFyci5wdXNoKHByb3AsIHZhbHVlKTtcbiAgcmV0dXJuIHRydWU7XG59XG5cbi8qKlxuICogVXNlZCB0byBjb252ZXJ0IGEge2tleTp2YWx1ZX0gbWFwIGludG8gYSBgU3R5bGluZ01hcEFycmF5YCBhcnJheS5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIHdpbGwgZWl0aGVyIGdlbmVyYXRlIGEgbmV3IGBTdHlsaW5nTWFwQXJyYXlgIGluc3RhbmNlXG4gKiBvciBpdCB3aWxsIHBhdGNoIHRoZSBwcm92aWRlZCBgbmV3VmFsdWVzYCBtYXAgdmFsdWUgaW50byBhblxuICogZXhpc3RpbmcgYFN0eWxpbmdNYXBBcnJheWAgdmFsdWUgKHRoaXMgb25seSBoYXBwZW5zIGlmIGBiaW5kaW5nVmFsdWVgXG4gKiBpcyBhbiBpbnN0YW5jZSBvZiBgU3R5bGluZ01hcEFycmF5YCkuXG4gKlxuICogSWYgYSBuZXcga2V5L3ZhbHVlIG1hcCBpcyBwcm92aWRlZCB3aXRoIGFuIG9sZCBgU3R5bGluZ01hcEFycmF5YFxuICogdmFsdWUgdGhlbiBhbGwgcHJvcGVydGllcyB3aWxsIGJlIG92ZXJ3cml0dGVuIHdpdGggdGhlaXIgbmV3XG4gKiB2YWx1ZXMgb3Igd2l0aCBgbnVsbGAuIFRoaXMgbWVhbnMgdGhhdCB0aGUgYXJyYXkgd2lsbCBuZXZlclxuICogc2hyaW5rIGluIHNpemUgKGJ1dCBpdCB3aWxsIGFsc28gbm90IGJlIGNyZWF0ZWQgYW5kIHRocm93blxuICogYXdheSB3aGVuZXZlciB0aGUgYHtrZXk6dmFsdWV9YCBtYXAgZW50cmllcyBjaGFuZ2UpLlxuICovXG5leHBvcnQgZnVuY3Rpb24gbm9ybWFsaXplSW50b1N0eWxpbmdNYXAoXG4gICAgYmluZGluZ1ZhbHVlOiBudWxsIHwgU3R5bGluZ01hcEFycmF5LFxuICAgIG5ld1ZhbHVlczoge1trZXk6IHN0cmluZ106IGFueX0gfCBzdHJpbmcgfCBudWxsIHwgdW5kZWZpbmVkLFxuICAgIG5vcm1hbGl6ZVByb3BzPzogYm9vbGVhbik6IFN0eWxpbmdNYXBBcnJheSB7XG4gIGNvbnN0IHN0eWxpbmdNYXBBcnI6IFN0eWxpbmdNYXBBcnJheSA9IEFycmF5LmlzQXJyYXkoYmluZGluZ1ZhbHVlKSA/IGJpbmRpbmdWYWx1ZSA6IFtudWxsXTtcbiAgc3R5bGluZ01hcEFycltTdHlsaW5nTWFwQXJyYXlJbmRleC5SYXdWYWx1ZVBvc2l0aW9uXSA9IG5ld1ZhbHVlcyB8fCBudWxsO1xuXG4gIC8vIGJlY2F1c2UgdGhlIG5ldyB2YWx1ZXMgbWF5IG5vdCBpbmNsdWRlIGFsbCB0aGUgcHJvcGVydGllc1xuICAvLyB0aGF0IHRoZSBvbGQgb25lcyBoYWQsIGFsbCB2YWx1ZXMgYXJlIHNldCB0byBgbnVsbGAgYmVmb3JlXG4gIC8vIHRoZSBuZXcgdmFsdWVzIGFyZSBhcHBsaWVkLiBUaGlzIHdheSwgd2hlbiBmbHVzaGVkLCB0aGVcbiAgLy8gc3R5bGluZyBhbGdvcml0aG0ga25vd3MgZXhhY3RseSB3aGF0IHN0eWxlL2NsYXNzIHZhbHVlc1xuICAvLyB0byByZW1vdmUgZnJvbSB0aGUgZWxlbWVudCAoc2luY2UgdGhleSBhcmUgYG51bGxgKS5cbiAgZm9yIChsZXQgaiA9IFN0eWxpbmdNYXBBcnJheUluZGV4LlZhbHVlc1N0YXJ0UG9zaXRpb247IGogPCBzdHlsaW5nTWFwQXJyLmxlbmd0aDtcbiAgICAgICBqICs9IFN0eWxpbmdNYXBBcnJheUluZGV4LlR1cGxlU2l6ZSkge1xuICAgIHNldE1hcFZhbHVlKHN0eWxpbmdNYXBBcnIsIGosIG51bGwpO1xuICB9XG5cbiAgbGV0IHByb3BzOiBzdHJpbmdbXXxudWxsID0gbnVsbDtcbiAgbGV0IG1hcDoge1trZXk6IHN0cmluZ106IGFueX18dW5kZWZpbmVkfG51bGw7XG4gIGxldCBhbGxWYWx1ZXNUcnVlID0gZmFsc2U7XG4gIGlmICh0eXBlb2YgbmV3VmFsdWVzID09PSAnc3RyaW5nJykgeyAgLy8gW2NsYXNzXSBiaW5kaW5ncyBhbGxvdyBzdHJpbmcgdmFsdWVzXG4gICAgaWYgKG5ld1ZhbHVlcy5sZW5ndGgpIHtcbiAgICAgIHByb3BzID0gbmV3VmFsdWVzLnNwbGl0KC9cXHMrLyk7XG4gICAgICBhbGxWYWx1ZXNUcnVlID0gdHJ1ZTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgcHJvcHMgPSBuZXdWYWx1ZXMgPyBPYmplY3Qua2V5cyhuZXdWYWx1ZXMpIDogbnVsbDtcbiAgICBtYXAgPSBuZXdWYWx1ZXM7XG4gIH1cblxuICBpZiAocHJvcHMpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHByb3BzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBwcm9wID0gcHJvcHNbaV0gYXMgc3RyaW5nO1xuICAgICAgY29uc3QgbmV3UHJvcCA9IG5vcm1hbGl6ZVByb3BzID8gaHlwaGVuYXRlKHByb3ApIDogcHJvcDtcbiAgICAgIGNvbnN0IHZhbHVlID0gYWxsVmFsdWVzVHJ1ZSA/IHRydWUgOiBtYXAgIVtwcm9wXTtcbiAgICAgIGFkZEl0ZW1Ub1N0eWxpbmdNYXAoc3R5bGluZ01hcEFyciwgbmV3UHJvcCwgdmFsdWUsIHRydWUpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBzdHlsaW5nTWFwQXJyO1xufVxuIl19