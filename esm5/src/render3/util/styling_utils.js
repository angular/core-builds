import { NO_CHANGE } from '../tokens';
export var MAP_BASED_ENTRY_PROP_NAME = '[MAP]';
export var TEMPLATE_DIRECTIVE_INDEX = 0;
/**
 * Default fallback value for a styling binding.
 *
 * A value of `null` is used here which signals to the styling algorithm that
 * the styling value is not present. This way if there are no other values
 * detected then it will be removed once the style/class property is dirty and
 * diffed within the styling algorithm present in `flushStyling`.
 */
export var DEFAULT_BINDING_VALUE = null;
export var DEFAULT_BINDING_INDEX = 0;
var DEFAULT_TOTAL_SOURCES = 1;
// The first bit value reflects a map-based binding value's bit.
// The reason why it's always activated for every entry in the map
// is so that if any map-binding values update then all other prop
// based bindings will pass the guard check automatically without
// any extra code or flags.
export var DEFAULT_GUARD_MASK_VALUE = 1;
/**
 * Creates a new instance of the `TStylingContext`.
 *
 * The `TStylingContext` is used as a manifest of all style or all class bindings on
 * an element. Because it is a T-level data-structure, it is only created once per
 * tNode for styles and for classes. This function allocates a new instance of a
 * `TStylingContext` with the initial values (see `interfaces.ts` for more info).
 */
export function allocTStylingContext(initialStyling, hasDirectives) {
    initialStyling = initialStyling || allocStylingMapArray(null);
    var config = 0 /* Initial */;
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
export function allocStylingMapArray(value) {
    return [value];
}
export function getConfig(context) {
    return context[0 /* ConfigPosition */];
}
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
 */
export function allowDirectStyling(context, firstUpdatePass) {
    var allow = false;
    var config = getConfig(context);
    var hasNoDirectives = (config & 1 /* HasDirectives */) === 0;
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
        var hasNoCollisions = (config & 8 /* HasCollisions */) === 0;
        var hasOnlyMapsOrOnlyProps = (config & 6 /* HasPropAndMapBindings */) !== 6 /* HasPropAndMapBindings */;
        allow = hasNoCollisions && hasOnlyMapsOrOnlyProps;
    }
    return allow;
}
export function setConfig(context, value) {
    context[0 /* ConfigPosition */] = value;
}
export function patchConfig(context, flag) {
    context[0 /* ConfigPosition */] |= flag;
}
export function getProp(context, index) {
    return context[index + 3 /* PropOffset */];
}
function getPropConfig(context, index) {
    return context[index + 0 /* ConfigOffset */] &
        1 /* Mask */;
}
export function isSanitizationRequired(context, index) {
    return (getPropConfig(context, index) & 1 /* SanitizationRequired */) !==
        0;
}
export function getGuardMask(context, index, isHostBinding) {
    var position = index + (isHostBinding ? 2 /* HostBindingsBitGuardOffset */ :
        1 /* TemplateBitGuardOffset */);
    return context[position];
}
export function setGuardMask(context, index, maskValue, isHostBinding) {
    var position = index + (isHostBinding ? 2 /* HostBindingsBitGuardOffset */ :
        1 /* TemplateBitGuardOffset */);
    context[position] = maskValue;
}
export function getValuesCount(context) {
    return getTotalSources(context) + 1;
}
export function getTotalSources(context) {
    return context[1 /* TotalSourcesPosition */];
}
export function getBindingValue(context, index, offset) {
    return context[index + 4 /* BindingsStartOffset */ + offset];
}
export function getDefaultValue(context, index) {
    return context[index + 4 /* BindingsStartOffset */ + getTotalSources(context)];
}
export function setDefaultValue(context, index, value) {
    return context[index + 4 /* BindingsStartOffset */ + getTotalSources(context)] =
        value;
}
export function setValue(data, bindingIndex, value) {
    data[bindingIndex] = value;
}
export function getValue(data, bindingIndex) {
    return bindingIndex !== 0 ? data[bindingIndex] : null;
}
export function getPropValuesStartPosition(context) {
    var startPosition = 3 /* ValuesStartPosition */;
    if (hasConfig(context, 4 /* HasMapBindings */)) {
        startPosition += 4 /* BindingsStartOffset */ + getValuesCount(context);
    }
    return startPosition;
}
export function hasValueChanged(a, b) {
    if (b === NO_CHANGE)
        return false;
    var compareValueA = Array.isArray(a) ? a[0 /* RawValuePosition */] : a;
    var compareValueB = Array.isArray(b) ? b[0 /* RawValuePosition */] : b;
    return !Object.is(compareValueA, compareValueB);
}
/**
 * Determines whether the provided styling value is truthy or falsy.
 */
export function isStylingValueDefined(value) {
    // the reason why null is compared against is because
    // a CSS class value that is set to `false` must be
    // respected (otherwise it would be treated as falsy).
    // Empty string values are because developers usually
    // set a value to an empty string to remove it.
    return value != null && value !== '';
}
export function concatString(a, b, separator) {
    if (separator === void 0) { separator = ' '; }
    return a + ((b.length && a.length) ? separator : '') + b;
}
export function hyphenate(value) {
    return value.replace(/[a-z][A-Z]/g, function (v) { return v.charAt(0) + '-' + v.charAt(1); }).toLowerCase();
}
/**
 * Returns an instance of `StylingMapArray`.
 *
 * This function is designed to find an instance of `StylingMapArray` in case it is stored
 * inside of an instance of `TStylingContext`. When a styling context is created it
 * will copy over an initial styling values from the tNode (which are stored as a
 * `StylingMapArray` on the `tNode.classes` or `tNode.styles` values).
 */
export function getStylingMapArray(value) {
    return isStylingContext(value) ?
        value[2 /* InitialStylingValuePosition */] :
        value;
}
export function isStylingContext(value) {
    // the StylingMapArray is in the format of [initial, prop, string, prop, string]
    // and this is the defining value to distinguish between arrays
    return Array.isArray(value) && value.length >= 3 /* ValuesStartPosition */ &&
        typeof value[1] !== 'string';
}
export function isStylingMapArray(value) {
    // the StylingMapArray is in the format of [initial, prop, string, prop, string]
    // and this is the defining value to distinguish between arrays
    return Array.isArray(value) &&
        (typeof value[1 /* ValuesStartPosition */] === 'string');
}
export function getInitialStylingValue(context) {
    var map = getStylingMapArray(context);
    return map && map[0 /* RawValuePosition */] || '';
}
export function hasClassInput(tNode) {
    return (tNode.flags & 16 /* hasClassInput */) !== 0;
}
export function hasStyleInput(tNode) {
    return (tNode.flags & 32 /* hasStyleInput */) !== 0;
}
export function getMapProp(map, index) {
    return map[index + 0 /* PropOffset */];
}
var MAP_DIRTY_VALUE = typeof ngDevMode !== 'undefined' && ngDevMode ? {} : { MAP_DIRTY_VALUE: true };
export function setMapAsDirty(map) {
    map[0 /* RawValuePosition */] = MAP_DIRTY_VALUE;
}
export function setMapValue(map, index, value) {
    map[index + 1 /* ValueOffset */] = value;
}
export function getMapValue(map, index) {
    return map[index + 1 /* ValueOffset */];
}
export function forceClassesAsString(classes) {
    if (classes && typeof classes !== 'string') {
        classes = Object.keys(classes).join(' ');
    }
    return classes || '';
}
export function forceStylesAsString(styles, hyphenateProps) {
    if (typeof styles == 'string')
        return styles;
    var str = '';
    if (styles) {
        var props = Object.keys(styles);
        for (var i = 0; i < props.length; i++) {
            var prop = props[i];
            var propLabel = hyphenateProps ? hyphenate(prop) : prop;
            var value = styles[prop];
            if (value !== null) {
                str = concatString(str, propLabel + ":" + value, ';');
            }
        }
    }
    return str;
}
export function isHostStylingActive(directiveOrSourceId) {
    return directiveOrSourceId !== TEMPLATE_DIRECTIVE_INDEX;
}
/**
 * Converts the provided styling map array into a string.
 *
 * Classes => `one two three`
 * Styles => `prop:value; prop2:value2`
 */
export function stylingMapToString(map, isClassBased) {
    var str = '';
    for (var i = 1 /* ValuesStartPosition */; i < map.length; i += 2 /* TupleSize */) {
        var prop = getMapProp(map, i);
        var value = getMapValue(map, i);
        var attrValue = concatString(prop, isClassBased ? '' : value, ':');
        str = concatString(str, attrValue, isClassBased ? ' ' : '; ');
    }
    return str;
}
/**
 * Converts the provided styling map array into a key value map.
 */
export function stylingMapToStringMap(map) {
    var stringMap = {};
    if (map) {
        for (var i = 1 /* ValuesStartPosition */; i < map.length; i += 2 /* TupleSize */) {
            var prop = getMapProp(map, i);
            var value = getMapValue(map, i);
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
 */
export function addItemToStylingMap(stylingMapArr, prop, value, allowOverwrite) {
    for (var j = 1 /* ValuesStartPosition */; j < stylingMapArr.length; j += 2 /* TupleSize */) {
        var propAtIndex = getMapProp(stylingMapArr, j);
        if (prop <= propAtIndex) {
            var applied = false;
            if (propAtIndex === prop) {
                var valueAtIndex = stylingMapArr[j];
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
 */
export function normalizeIntoStylingMap(bindingValue, newValues, normalizeProps) {
    var stylingMapArr = Array.isArray(bindingValue) ? bindingValue : allocStylingMapArray(null);
    stylingMapArr[0 /* RawValuePosition */] = newValues;
    // because the new values may not include all the properties
    // that the old ones had, all values are set to `null` before
    // the new values are applied. This way, when flushed, the
    // styling algorithm knows exactly what style/class values
    // to remove from the element (since they are `null`).
    for (var j = 1 /* ValuesStartPosition */; j < stylingMapArr.length; j += 2 /* TupleSize */) {
        setMapValue(stylingMapArr, j, null);
    }
    var props = null;
    var map;
    var allValuesTrue = false;
    if (typeof newValues === 'string') { // [class] bindings allow string values
        props = splitOnWhitespace(newValues);
        allValuesTrue = props !== null;
    }
    else {
        props = newValues ? Object.keys(newValues) : null;
        map = newValues;
    }
    if (props) {
        for (var i = 0; i < props.length; i++) {
            var prop = props[i];
            var newProp = normalizeProps ? hyphenate(prop) : prop;
            var value = allValuesTrue ? true : map[prop];
            addItemToStylingMap(stylingMapArr, newProp, value, true);
        }
    }
    return stylingMapArr;
}
export function splitOnWhitespace(text) {
    var array = null;
    var length = text.length;
    var start = 0;
    var foundChar = false;
    for (var i = 0; i < length; i++) {
        var char = text.charCodeAt(i);
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
export function selectClassBasedInputName(inputs) {
    return inputs.hasOwnProperty('class') ? 'class' : 'className';
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3R5bGluZ191dGlscy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvdXRpbC9zdHlsaW5nX3V0aWxzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQVNBLE9BQU8sRUFBQyxTQUFTLEVBQUMsTUFBTSxXQUFXLENBQUM7QUFFcEMsTUFBTSxDQUFDLElBQU0seUJBQXlCLEdBQUcsT0FBTyxDQUFDO0FBQ2pELE1BQU0sQ0FBQyxJQUFNLHdCQUF3QixHQUFHLENBQUMsQ0FBQztBQUUxQzs7Ozs7OztHQU9HO0FBQ0gsTUFBTSxDQUFDLElBQU0scUJBQXFCLEdBQUcsSUFBSSxDQUFDO0FBRTFDLE1BQU0sQ0FBQyxJQUFNLHFCQUFxQixHQUFHLENBQUMsQ0FBQztBQUV2QyxJQUFNLHFCQUFxQixHQUFHLENBQUMsQ0FBQztBQUVoQyxnRUFBZ0U7QUFDaEUsa0VBQWtFO0FBQ2xFLGtFQUFrRTtBQUNsRSxpRUFBaUU7QUFDakUsMkJBQTJCO0FBQzNCLE1BQU0sQ0FBQyxJQUFNLHdCQUF3QixHQUFHLENBQUcsQ0FBQztBQUU1Qzs7Ozs7OztHQU9HO0FBQ0gsTUFBTSxVQUFVLG9CQUFvQixDQUNoQyxjQUFzQyxFQUFFLGFBQXNCO0lBQ2hFLGNBQWMsR0FBRyxjQUFjLElBQUksb0JBQW9CLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDOUQsSUFBSSxNQUFNLGtCQUF5QixDQUFDO0lBQ3BDLElBQUksYUFBYSxFQUFFO1FBQ2pCLE1BQU0seUJBQWdDLENBQUM7S0FDeEM7SUFDRCxJQUFJLGNBQWMsQ0FBQyxNQUFNLDhCQUEyQyxFQUFFO1FBQ3BFLE1BQU0sOEJBQW9DLENBQUM7S0FDNUM7SUFDRCxPQUFPO1FBQ0wsTUFBTTtRQUNOLHFCQUFxQjtRQUNyQixjQUFjO0tBQ2YsQ0FBQztBQUNKLENBQUM7QUFFRCxNQUFNLFVBQVUsb0JBQW9CLENBQUMsS0FBeUI7SUFD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SSxTQUFTLEVBQUU7Z0JBQ2IsSUFBSSxLQUFLLEtBQUssSUFBSTtvQkFBRSxLQUFLLEdBQUcsRUFBRSxDQUFDO2dCQUMvQixLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ3JDLFNBQVMsR0FBRyxLQUFLLENBQUM7YUFDbkI7WUFDRCxLQUFLLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztTQUNmO2FBQU07WUFDTCxTQUFTLEdBQUcsSUFBSSxDQUFDO1NBQ2xCO0tBQ0Y7SUFDRCxJQUFJLFNBQVMsRUFBRTtRQUNiLElBQUksS0FBSyxLQUFLLElBQUk7WUFBRSxLQUFLLEdBQUcsRUFBRSxDQUFDO1FBQy9CLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLENBQUMsQ0FBQztRQUMxQyxTQUFTLEdBQUcsS0FBSyxDQUFDO0tBQ25CO0lBQ0QsT0FBTyxLQUFLLENBQUM7QUFDZixDQUFDO0FBRUQseUZBQXlGO0FBQ3pGLDhDQUE4QztBQUM5QyxNQUFNLFVBQVUseUJBQXlCLENBQUMsTUFBdUI7SUFDL0QsT0FBTyxNQUFNLENBQUMsY0FBYyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQztBQUNoRSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4qIEBsaWNlbnNlXG4qIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuKlxuKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4qL1xuaW1wb3J0IHtQcm9wZXJ0eUFsaWFzZXMsIFROb2RlLCBUTm9kZUZsYWdzfSBmcm9tICcuLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtMU3R5bGluZ0RhdGEsIFN0eWxpbmdNYXBBcnJheSwgU3R5bGluZ01hcEFycmF5SW5kZXgsIFRTdHlsaW5nQ29uZmlnLCBUU3R5bGluZ0NvbnRleHQsIFRTdHlsaW5nQ29udGV4dEluZGV4LCBUU3R5bGluZ0NvbnRleHRQcm9wQ29uZmlnRmxhZ3N9IGZyb20gJy4uL2ludGVyZmFjZXMvc3R5bGluZyc7XG5pbXBvcnQge05PX0NIQU5HRX0gZnJvbSAnLi4vdG9rZW5zJztcblxuZXhwb3J0IGNvbnN0IE1BUF9CQVNFRF9FTlRSWV9QUk9QX05BTUUgPSAnW01BUF0nO1xuZXhwb3J0IGNvbnN0IFRFTVBMQVRFX0RJUkVDVElWRV9JTkRFWCA9IDA7XG5cbi8qKlxuICogRGVmYXVsdCBmYWxsYmFjayB2YWx1ZSBmb3IgYSBzdHlsaW5nIGJpbmRpbmcuXG4gKlxuICogQSB2YWx1ZSBvZiBgbnVsbGAgaXMgdXNlZCBoZXJlIHdoaWNoIHNpZ25hbHMgdG8gdGhlIHN0eWxpbmcgYWxnb3JpdGhtIHRoYXRcbiAqIHRoZSBzdHlsaW5nIHZhbHVlIGlzIG5vdCBwcmVzZW50LiBUaGlzIHdheSBpZiB0aGVyZSBhcmUgbm8gb3RoZXIgdmFsdWVzXG4gKiBkZXRlY3RlZCB0aGVuIGl0IHdpbGwgYmUgcmVtb3ZlZCBvbmNlIHRoZSBzdHlsZS9jbGFzcyBwcm9wZXJ0eSBpcyBkaXJ0eSBhbmRcbiAqIGRpZmZlZCB3aXRoaW4gdGhlIHN0eWxpbmcgYWxnb3JpdGhtIHByZXNlbnQgaW4gYGZsdXNoU3R5bGluZ2AuXG4gKi9cbmV4cG9ydCBjb25zdCBERUZBVUxUX0JJTkRJTkdfVkFMVUUgPSBudWxsO1xuXG5leHBvcnQgY29uc3QgREVGQVVMVF9CSU5ESU5HX0lOREVYID0gMDtcblxuY29uc3QgREVGQVVMVF9UT1RBTF9TT1VSQ0VTID0gMTtcblxuLy8gVGhlIGZpcnN0IGJpdCB2YWx1ZSByZWZsZWN0cyBhIG1hcC1iYXNlZCBiaW5kaW5nIHZhbHVlJ3MgYml0LlxuLy8gVGhlIHJlYXNvbiB3aHkgaXQncyBhbHdheXMgYWN0aXZhdGVkIGZvciBldmVyeSBlbnRyeSBpbiB0aGUgbWFwXG4vLyBpcyBzbyB0aGF0IGlmIGFueSBtYXAtYmluZGluZyB2YWx1ZXMgdXBkYXRlIHRoZW4gYWxsIG90aGVyIHByb3Bcbi8vIGJhc2VkIGJpbmRpbmdzIHdpbGwgcGFzcyB0aGUgZ3VhcmQgY2hlY2sgYXV0b21hdGljYWxseSB3aXRob3V0XG4vLyBhbnkgZXh0cmEgY29kZSBvciBmbGFncy5cbmV4cG9ydCBjb25zdCBERUZBVUxUX0dVQVJEX01BU0tfVkFMVUUgPSAwYjE7XG5cbi8qKlxuICogQ3JlYXRlcyBhIG5ldyBpbnN0YW5jZSBvZiB0aGUgYFRTdHlsaW5nQ29udGV4dGAuXG4gKlxuICogVGhlIGBUU3R5bGluZ0NvbnRleHRgIGlzIHVzZWQgYXMgYSBtYW5pZmVzdCBvZiBhbGwgc3R5bGUgb3IgYWxsIGNsYXNzIGJpbmRpbmdzIG9uXG4gKiBhbiBlbGVtZW50LiBCZWNhdXNlIGl0IGlzIGEgVC1sZXZlbCBkYXRhLXN0cnVjdHVyZSwgaXQgaXMgb25seSBjcmVhdGVkIG9uY2UgcGVyXG4gKiB0Tm9kZSBmb3Igc3R5bGVzIGFuZCBmb3IgY2xhc3Nlcy4gVGhpcyBmdW5jdGlvbiBhbGxvY2F0ZXMgYSBuZXcgaW5zdGFuY2Ugb2YgYVxuICogYFRTdHlsaW5nQ29udGV4dGAgd2l0aCB0aGUgaW5pdGlhbCB2YWx1ZXMgKHNlZSBgaW50ZXJmYWNlcy50c2AgZm9yIG1vcmUgaW5mbykuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhbGxvY1RTdHlsaW5nQ29udGV4dChcbiAgICBpbml0aWFsU3R5bGluZzogU3R5bGluZ01hcEFycmF5IHwgbnVsbCwgaGFzRGlyZWN0aXZlczogYm9vbGVhbik6IFRTdHlsaW5nQ29udGV4dCB7XG4gIGluaXRpYWxTdHlsaW5nID0gaW5pdGlhbFN0eWxpbmcgfHwgYWxsb2NTdHlsaW5nTWFwQXJyYXkobnVsbCk7XG4gIGxldCBjb25maWcgPSBUU3R5bGluZ0NvbmZpZy5Jbml0aWFsO1xuICBpZiAoaGFzRGlyZWN0aXZlcykge1xuICAgIGNvbmZpZyB8PSBUU3R5bGluZ0NvbmZpZy5IYXNEaXJlY3RpdmVzO1xuICB9XG4gIGlmIChpbml0aWFsU3R5bGluZy5sZW5ndGggPiBTdHlsaW5nTWFwQXJyYXlJbmRleC5WYWx1ZXNTdGFydFBvc2l0aW9uKSB7XG4gICAgY29uZmlnIHw9IFRTdHlsaW5nQ29uZmlnLkhhc0luaXRpYWxTdHlsaW5nO1xuICB9XG4gIHJldHVybiBbXG4gICAgY29uZmlnLCAgICAgICAgICAgICAgICAgLy8gMSkgY29uZmlnIGZvciB0aGUgc3R5bGluZyBjb250ZXh0XG4gICAgREVGQVVMVF9UT1RBTF9TT1VSQ0VTLCAgLy8gMikgdG90YWwgYW1vdW50IG9mIHN0eWxpbmcgc291cmNlcyAodGVtcGxhdGUsIGRpcmVjdGl2ZXMsIGV0Yy4uLilcbiAgICBpbml0aWFsU3R5bGluZywgICAgICAgICAvLyAzKSBpbml0aWFsIHN0eWxpbmcgdmFsdWVzXG4gIF07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhbGxvY1N0eWxpbmdNYXBBcnJheSh2YWx1ZToge30gfCBzdHJpbmcgfCBudWxsKTogU3R5bGluZ01hcEFycmF5IHtcbiAgcmV0dXJuIFt2YWx1ZV07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRDb25maWcoY29udGV4dDogVFN0eWxpbmdDb250ZXh0KSB7XG4gIHJldHVybiBjb250ZXh0W1RTdHlsaW5nQ29udGV4dEluZGV4LkNvbmZpZ1Bvc2l0aW9uXTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGhhc0NvbmZpZyhjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQsIGZsYWc6IFRTdHlsaW5nQ29uZmlnKSB7XG4gIHJldHVybiAoZ2V0Q29uZmlnKGNvbnRleHQpICYgZmxhZykgIT09IDA7XG59XG5cbi8qKlxuICogRGV0ZXJtaW5lcyB3aGV0aGVyIG9yIG5vdCB0byBhcHBseSBzdHlsZXMvY2xhc3NlcyBkaXJlY3RseSBvciB2aWEgY29udGV4dCByZXNvbHV0aW9uLlxuICpcbiAqIFRoZXJlIGFyZSB0aHJlZSBjYXNlcyB0aGF0IGFyZSBtYXRjaGVkIGhlcmU6XG4gKiAxLiB0aGVyZSBhcmUgbm8gZGlyZWN0aXZlcyBwcmVzZW50IEFORCBgbmdEZXZNb2RlYCBpcyBmYWxzeVxuICogMi4gdGhlIGBmaXJzdFVwZGF0ZVBhc3NgIGhhcyBub3QgYWxyZWFkeSBydW4gKHdoaWNoIG1lYW5zIHRoYXRcbiAqICAgIHRoZXJlIGFyZSBtb3JlIGJpbmRpbmdzIHRvIHJlZ2lzdGVyIGFuZCwgdGhlcmVmb3JlLCBkaXJlY3RcbiAqICAgIHN0eWxlL2NsYXNzIGFwcGxpY2F0aW9uIGlzIG5vdCB5ZXQgcG9zc2libGUpXG4gKiAzLiBUaGVyZSBhcmUgbm8gY29sbGlzaW9ucyAoaS5lLiBwcm9wZXJ0aWVzIHdpdGggbW9yZSB0aGFuIG9uZSBiaW5kaW5nKSBhY3Jvc3MgbXVsdGlwbGVcbiAqICAgIHNvdXJjZXMgKGkuZS4gdGVtcGxhdGUgKyBkaXJlY3RpdmUsIGRpcmVjdGl2ZSArIGRpcmVjdGl2ZSwgZGlyZWN0aXZlICsgY29tcG9uZW50KVxuICovXG5leHBvcnQgZnVuY3Rpb24gYWxsb3dEaXJlY3RTdHlsaW5nKGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCwgZmlyc3RVcGRhdGVQYXNzOiBib29sZWFuKTogYm9vbGVhbiB7XG4gIGxldCBhbGxvdyA9IGZhbHNlO1xuICBjb25zdCBjb25maWcgPSBnZXRDb25maWcoY29udGV4dCk7XG4gIGNvbnN0IGhhc05vRGlyZWN0aXZlcyA9IChjb25maWcgJiBUU3R5bGluZ0NvbmZpZy5IYXNEaXJlY3RpdmVzKSA9PT0gMDtcblxuICAvLyBpZiBubyBkaXJlY3RpdmVzIGFyZSBwcmVzZW50IHRoZW4gd2UgZG8gbm90IG5lZWQgcG9wdWxhdGUgYSBjb250ZXh0IGF0IGFsbC4gVGhpc1xuICAvLyBpcyBiZWNhdXNlIGR1cGxpY2F0ZSBwcm9wIGJpbmRpbmdzIGNhbm5vdCBiZSByZWdpc3RlcmVkIHRocm91Z2ggdGhlIHRlbXBsYXRlLiBJZlxuICAvLyBhbmQgd2hlbiB0aGlzIGhhcHBlbnMgd2UgY2FuIHNhZmVseSBhcHBseSB0aGUgdmFsdWUgZGlyZWN0bHkgd2l0aG91dCBjb250ZXh0XG4gIC8vIHJlc29sdXRpb24uLi5cbiAgaWYgKGhhc05vRGlyZWN0aXZlcykge1xuICAgIC8vIGBuZ0Rldk1vZGVgIGlzIHJlcXVpcmVkIHRvIGJlIGNoZWNrZWQgaGVyZSBiZWNhdXNlIHRlc3RzL2RlYnVnZ2luZyByZWx5IG9uIHRoZSBjb250ZXh0IGJlaW5nXG4gICAgLy8gcG9wdWxhdGVkLiBJZiB0aGluZ3MgYXJlIGluIHByb2R1Y3Rpb24gbW9kZSB0aGVuIHRoZXJlIGlzIG5vIG5lZWQgdG8gYnVpbGQgYSBjb250ZXh0XG4gICAgLy8gdGhlcmVmb3JlIHRoZSBkaXJlY3QgYXBwbHkgY2FuIGJlIGFsbG93ZWQgKGV2ZW4gb24gdGhlIGZpcnN0IHVwZGF0ZSkuXG4gICAgYWxsb3cgPSBuZ0Rldk1vZGUgPyAhZmlyc3RVcGRhdGVQYXNzIDogdHJ1ZTtcbiAgfSBlbHNlIGlmICghZmlyc3RVcGRhdGVQYXNzKSB7XG4gICAgY29uc3QgaGFzTm9Db2xsaXNpb25zID0gKGNvbmZpZyAmIFRTdHlsaW5nQ29uZmlnLkhhc0NvbGxpc2lvbnMpID09PSAwO1xuICAgIGNvbnN0IGhhc09ubHlNYXBzT3JPbmx5UHJvcHMgPVxuICAgICAgICAoY29uZmlnICYgVFN0eWxpbmdDb25maWcuSGFzUHJvcEFuZE1hcEJpbmRpbmdzKSAhPT0gVFN0eWxpbmdDb25maWcuSGFzUHJvcEFuZE1hcEJpbmRpbmdzO1xuICAgIGFsbG93ID0gaGFzTm9Db2xsaXNpb25zICYmIGhhc09ubHlNYXBzT3JPbmx5UHJvcHM7XG4gIH1cblxuICByZXR1cm4gYWxsb3c7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXRDb25maWcoY29udGV4dDogVFN0eWxpbmdDb250ZXh0LCB2YWx1ZTogVFN0eWxpbmdDb25maWcpOiB2b2lkIHtcbiAgY29udGV4dFtUU3R5bGluZ0NvbnRleHRJbmRleC5Db25maWdQb3NpdGlvbl0gPSB2YWx1ZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHBhdGNoQ29uZmlnKGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCwgZmxhZzogVFN0eWxpbmdDb25maWcpOiB2b2lkIHtcbiAgY29udGV4dFtUU3R5bGluZ0NvbnRleHRJbmRleC5Db25maWdQb3NpdGlvbl0gfD0gZmxhZztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFByb3AoY29udGV4dDogVFN0eWxpbmdDb250ZXh0LCBpbmRleDogbnVtYmVyKTogc3RyaW5nIHtcbiAgcmV0dXJuIGNvbnRleHRbaW5kZXggKyBUU3R5bGluZ0NvbnRleHRJbmRleC5Qcm9wT2Zmc2V0XSBhcyBzdHJpbmc7XG59XG5cbmZ1bmN0aW9uIGdldFByb3BDb25maWcoY29udGV4dDogVFN0eWxpbmdDb250ZXh0LCBpbmRleDogbnVtYmVyKTogbnVtYmVyIHtcbiAgcmV0dXJuIChjb250ZXh0W2luZGV4ICsgVFN0eWxpbmdDb250ZXh0SW5kZXguQ29uZmlnT2Zmc2V0XSBhcyBudW1iZXIpICZcbiAgICAgIFRTdHlsaW5nQ29udGV4dFByb3BDb25maWdGbGFncy5NYXNrO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNTYW5pdGl6YXRpb25SZXF1aXJlZChjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQsIGluZGV4OiBudW1iZXIpOiBib29sZWFuIHtcbiAgcmV0dXJuIChnZXRQcm9wQ29uZmlnKGNvbnRleHQsIGluZGV4KSAmIFRTdHlsaW5nQ29udGV4dFByb3BDb25maWdGbGFncy5TYW5pdGl6YXRpb25SZXF1aXJlZCkgIT09XG4gICAgICAwO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0R3VhcmRNYXNrKFxuICAgIGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCwgaW5kZXg6IG51bWJlciwgaXNIb3N0QmluZGluZzogYm9vbGVhbik6IG51bWJlciB7XG4gIGNvbnN0IHBvc2l0aW9uID0gaW5kZXggKyAoaXNIb3N0QmluZGluZyA/IFRTdHlsaW5nQ29udGV4dEluZGV4Lkhvc3RCaW5kaW5nc0JpdEd1YXJkT2Zmc2V0IDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgVFN0eWxpbmdDb250ZXh0SW5kZXguVGVtcGxhdGVCaXRHdWFyZE9mZnNldCk7XG4gIHJldHVybiBjb250ZXh0W3Bvc2l0aW9uXSBhcyBudW1iZXI7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXRHdWFyZE1hc2soXG4gICAgY29udGV4dDogVFN0eWxpbmdDb250ZXh0LCBpbmRleDogbnVtYmVyLCBtYXNrVmFsdWU6IG51bWJlciwgaXNIb3N0QmluZGluZzogYm9vbGVhbikge1xuICBjb25zdCBwb3NpdGlvbiA9IGluZGV4ICsgKGlzSG9zdEJpbmRpbmcgPyBUU3R5bGluZ0NvbnRleHRJbmRleC5Ib3N0QmluZGluZ3NCaXRHdWFyZE9mZnNldCA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFRTdHlsaW5nQ29udGV4dEluZGV4LlRlbXBsYXRlQml0R3VhcmRPZmZzZXQpO1xuICBjb250ZXh0W3Bvc2l0aW9uXSA9IG1hc2tWYWx1ZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFZhbHVlc0NvdW50KGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCk6IG51bWJlciB7XG4gIHJldHVybiBnZXRUb3RhbFNvdXJjZXMoY29udGV4dCkgKyAxO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0VG90YWxTb3VyY2VzKGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCk6IG51bWJlciB7XG4gIHJldHVybiBjb250ZXh0W1RTdHlsaW5nQ29udGV4dEluZGV4LlRvdGFsU291cmNlc1Bvc2l0aW9uXTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEJpbmRpbmdWYWx1ZShjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQsIGluZGV4OiBudW1iZXIsIG9mZnNldDogbnVtYmVyKSB7XG4gIHJldHVybiBjb250ZXh0W2luZGV4ICsgVFN0eWxpbmdDb250ZXh0SW5kZXguQmluZGluZ3NTdGFydE9mZnNldCArIG9mZnNldF0gYXMgbnVtYmVyIHwgc3RyaW5nO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0RGVmYXVsdFZhbHVlKGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCwgaW5kZXg6IG51bWJlcik6IHN0cmluZ3xib29sZWFufG51bGwge1xuICByZXR1cm4gY29udGV4dFtpbmRleCArIFRTdHlsaW5nQ29udGV4dEluZGV4LkJpbmRpbmdzU3RhcnRPZmZzZXQgKyBnZXRUb3RhbFNvdXJjZXMoY29udGV4dCldIGFzXG4gICAgICAgICAgICAgc3RyaW5nIHxcbiAgICAgIGJvb2xlYW4gfCBudWxsO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2V0RGVmYXVsdFZhbHVlKFxuICAgIGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCwgaW5kZXg6IG51bWJlciwgdmFsdWU6IHN0cmluZyB8IGJvb2xlYW4gfCBudWxsKSB7XG4gIHJldHVybiBjb250ZXh0W2luZGV4ICsgVFN0eWxpbmdDb250ZXh0SW5kZXguQmluZGluZ3NTdGFydE9mZnNldCArIGdldFRvdGFsU291cmNlcyhjb250ZXh0KV0gPVxuICAgICAgICAgICAgIHZhbHVlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2V0VmFsdWUoZGF0YTogTFN0eWxpbmdEYXRhLCBiaW5kaW5nSW5kZXg6IG51bWJlciwgdmFsdWU6IGFueSkge1xuICBkYXRhW2JpbmRpbmdJbmRleF0gPSB2YWx1ZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFZhbHVlPFQgPSBhbnk+KGRhdGE6IExTdHlsaW5nRGF0YSwgYmluZGluZ0luZGV4OiBudW1iZXIpOiBUfG51bGwge1xuICByZXR1cm4gYmluZGluZ0luZGV4ICE9PSAwID8gZGF0YVtiaW5kaW5nSW5kZXhdIGFzIFQgOiBudWxsO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0UHJvcFZhbHVlc1N0YXJ0UG9zaXRpb24oY29udGV4dDogVFN0eWxpbmdDb250ZXh0KSB7XG4gIGxldCBzdGFydFBvc2l0aW9uID0gVFN0eWxpbmdDb250ZXh0SW5kZXguVmFsdWVzU3RhcnRQb3NpdGlvbjtcbiAgaWYgKGhhc0NvbmZpZyhjb250ZXh0LCBUU3R5bGluZ0NvbmZpZy5IYXNNYXBCaW5kaW5ncykpIHtcbiAgICBzdGFydFBvc2l0aW9uICs9IFRTdHlsaW5nQ29udGV4dEluZGV4LkJpbmRpbmdzU3RhcnRPZmZzZXQgKyBnZXRWYWx1ZXNDb3VudChjb250ZXh0KTtcbiAgfVxuICByZXR1cm4gc3RhcnRQb3NpdGlvbjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGhhc1ZhbHVlQ2hhbmdlZChcbiAgICBhOiBOT19DSEFOR0UgfCBTdHlsaW5nTWFwQXJyYXkgfCBudW1iZXIgfCBTdHJpbmcgfCBzdHJpbmcgfCBudWxsIHwgYm9vbGVhbiB8IHVuZGVmaW5lZCB8IHt9LFxuICAgIGI6IE5PX0NIQU5HRSB8IFN0eWxpbmdNYXBBcnJheSB8IG51bWJlciB8IFN0cmluZyB8IHN0cmluZyB8IG51bGwgfCBib29sZWFuIHwgdW5kZWZpbmVkIHxcbiAgICAgICAge30pOiBib29sZWFuIHtcbiAgaWYgKGIgPT09IE5PX0NIQU5HRSkgcmV0dXJuIGZhbHNlO1xuXG4gIGNvbnN0IGNvbXBhcmVWYWx1ZUEgPSBBcnJheS5pc0FycmF5KGEpID8gYVtTdHlsaW5nTWFwQXJyYXlJbmRleC5SYXdWYWx1ZVBvc2l0aW9uXSA6IGE7XG4gIGNvbnN0IGNvbXBhcmVWYWx1ZUIgPSBBcnJheS5pc0FycmF5KGIpID8gYltTdHlsaW5nTWFwQXJyYXlJbmRleC5SYXdWYWx1ZVBvc2l0aW9uXSA6IGI7XG4gIHJldHVybiAhT2JqZWN0LmlzKGNvbXBhcmVWYWx1ZUEsIGNvbXBhcmVWYWx1ZUIpO1xufVxuXG4vKipcbiAqIERldGVybWluZXMgd2hldGhlciB0aGUgcHJvdmlkZWQgc3R5bGluZyB2YWx1ZSBpcyB0cnV0aHkgb3IgZmFsc3kuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpc1N0eWxpbmdWYWx1ZURlZmluZWQ8VCBleHRlbmRzIHN0cmluZ3xudW1iZXJ8e318bnVsbHx1bmRlZmluZWQ+KHZhbHVlOiBUKTpcbiAgICB2YWx1ZSBpcyBOb25OdWxsYWJsZTxUPiB7XG4gIC8vIHRoZSByZWFzb24gd2h5IG51bGwgaXMgY29tcGFyZWQgYWdhaW5zdCBpcyBiZWNhdXNlXG4gIC8vIGEgQ1NTIGNsYXNzIHZhbHVlIHRoYXQgaXMgc2V0IHRvIGBmYWxzZWAgbXVzdCBiZVxuICAvLyByZXNwZWN0ZWQgKG90aGVyd2lzZSBpdCB3b3VsZCBiZSB0cmVhdGVkIGFzIGZhbHN5KS5cbiAgLy8gRW1wdHkgc3RyaW5nIHZhbHVlcyBhcmUgYmVjYXVzZSBkZXZlbG9wZXJzIHVzdWFsbHlcbiAgLy8gc2V0IGEgdmFsdWUgdG8gYW4gZW1wdHkgc3RyaW5nIHRvIHJlbW92ZSBpdC5cbiAgcmV0dXJuIHZhbHVlICE9IG51bGwgJiYgdmFsdWUgIT09ICcnO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY29uY2F0U3RyaW5nKGE6IHN0cmluZywgYjogc3RyaW5nLCBzZXBhcmF0b3IgPSAnICcpOiBzdHJpbmcge1xuICByZXR1cm4gYSArICgoYi5sZW5ndGggJiYgYS5sZW5ndGgpID8gc2VwYXJhdG9yIDogJycpICsgYjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGh5cGhlbmF0ZSh2YWx1ZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHZhbHVlLnJlcGxhY2UoL1thLXpdW0EtWl0vZywgdiA9PiB2LmNoYXJBdCgwKSArICctJyArIHYuY2hhckF0KDEpKS50b0xvd2VyQ2FzZSgpO1xufVxuXG4vKipcbiAqIFJldHVybnMgYW4gaW5zdGFuY2Ugb2YgYFN0eWxpbmdNYXBBcnJheWAuXG4gKlxuICogVGhpcyBmdW5jdGlvbiBpcyBkZXNpZ25lZCB0byBmaW5kIGFuIGluc3RhbmNlIG9mIGBTdHlsaW5nTWFwQXJyYXlgIGluIGNhc2UgaXQgaXMgc3RvcmVkXG4gKiBpbnNpZGUgb2YgYW4gaW5zdGFuY2Ugb2YgYFRTdHlsaW5nQ29udGV4dGAuIFdoZW4gYSBzdHlsaW5nIGNvbnRleHQgaXMgY3JlYXRlZCBpdFxuICogd2lsbCBjb3B5IG92ZXIgYW4gaW5pdGlhbCBzdHlsaW5nIHZhbHVlcyBmcm9tIHRoZSB0Tm9kZSAod2hpY2ggYXJlIHN0b3JlZCBhcyBhXG4gKiBgU3R5bGluZ01hcEFycmF5YCBvbiB0aGUgYHROb2RlLmNsYXNzZXNgIG9yIGB0Tm9kZS5zdHlsZXNgIHZhbHVlcykuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRTdHlsaW5nTWFwQXJyYXkodmFsdWU6IFRTdHlsaW5nQ29udGV4dCB8IFN0eWxpbmdNYXBBcnJheSB8IG51bGwpOlxuICAgIFN0eWxpbmdNYXBBcnJheXxudWxsIHtcbiAgcmV0dXJuIGlzU3R5bGluZ0NvbnRleHQodmFsdWUpID9cbiAgICAgICh2YWx1ZSBhcyBUU3R5bGluZ0NvbnRleHQpW1RTdHlsaW5nQ29udGV4dEluZGV4LkluaXRpYWxTdHlsaW5nVmFsdWVQb3NpdGlvbl0gOlxuICAgICAgdmFsdWUgYXMgU3R5bGluZ01hcEFycmF5O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNTdHlsaW5nQ29udGV4dCh2YWx1ZTogYW55KTogYm9vbGVhbiB7XG4gIC8vIHRoZSBTdHlsaW5nTWFwQXJyYXkgaXMgaW4gdGhlIGZvcm1hdCBvZiBbaW5pdGlhbCwgcHJvcCwgc3RyaW5nLCBwcm9wLCBzdHJpbmddXG4gIC8vIGFuZCB0aGlzIGlzIHRoZSBkZWZpbmluZyB2YWx1ZSB0byBkaXN0aW5ndWlzaCBiZXR3ZWVuIGFycmF5c1xuICByZXR1cm4gQXJyYXkuaXNBcnJheSh2YWx1ZSkgJiYgdmFsdWUubGVuZ3RoID49IFRTdHlsaW5nQ29udGV4dEluZGV4LlZhbHVlc1N0YXJ0UG9zaXRpb24gJiZcbiAgICAgIHR5cGVvZiB2YWx1ZVsxXSAhPT0gJ3N0cmluZyc7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc1N0eWxpbmdNYXBBcnJheSh2YWx1ZTogYW55KTogYm9vbGVhbiB7XG4gIC8vIHRoZSBTdHlsaW5nTWFwQXJyYXkgaXMgaW4gdGhlIGZvcm1hdCBvZiBbaW5pdGlhbCwgcHJvcCwgc3RyaW5nLCBwcm9wLCBzdHJpbmddXG4gIC8vIGFuZCB0aGlzIGlzIHRoZSBkZWZpbmluZyB2YWx1ZSB0byBkaXN0aW5ndWlzaCBiZXR3ZWVuIGFycmF5c1xuICByZXR1cm4gQXJyYXkuaXNBcnJheSh2YWx1ZSkgJiZcbiAgICAgICh0eXBlb2YodmFsdWUgYXMgU3R5bGluZ01hcEFycmF5KVtTdHlsaW5nTWFwQXJyYXlJbmRleC5WYWx1ZXNTdGFydFBvc2l0aW9uXSA9PT0gJ3N0cmluZycpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0SW5pdGlhbFN0eWxpbmdWYWx1ZShjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQgfCBTdHlsaW5nTWFwQXJyYXkgfCBudWxsKTogc3RyaW5nIHtcbiAgY29uc3QgbWFwID0gZ2V0U3R5bGluZ01hcEFycmF5KGNvbnRleHQpO1xuICByZXR1cm4gbWFwICYmIChtYXBbU3R5bGluZ01hcEFycmF5SW5kZXguUmF3VmFsdWVQb3NpdGlvbl0gYXMgc3RyaW5nIHwgbnVsbCkgfHwgJyc7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBoYXNDbGFzc0lucHV0KHROb2RlOiBUTm9kZSkge1xuICByZXR1cm4gKHROb2RlLmZsYWdzICYgVE5vZGVGbGFncy5oYXNDbGFzc0lucHV0KSAhPT0gMDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGhhc1N0eWxlSW5wdXQodE5vZGU6IFROb2RlKSB7XG4gIHJldHVybiAodE5vZGUuZmxhZ3MgJiBUTm9kZUZsYWdzLmhhc1N0eWxlSW5wdXQpICE9PSAwO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0TWFwUHJvcChtYXA6IFN0eWxpbmdNYXBBcnJheSwgaW5kZXg6IG51bWJlcik6IHN0cmluZyB7XG4gIHJldHVybiBtYXBbaW5kZXggKyBTdHlsaW5nTWFwQXJyYXlJbmRleC5Qcm9wT2Zmc2V0XSBhcyBzdHJpbmc7XG59XG5cbmNvbnN0IE1BUF9ESVJUWV9WQUxVRSA9XG4gICAgdHlwZW9mIG5nRGV2TW9kZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbmdEZXZNb2RlID8ge30gOiB7TUFQX0RJUlRZX1ZBTFVFOiB0cnVlfTtcblxuZXhwb3J0IGZ1bmN0aW9uIHNldE1hcEFzRGlydHkobWFwOiBTdHlsaW5nTWFwQXJyYXkpOiB2b2lkIHtcbiAgbWFwW1N0eWxpbmdNYXBBcnJheUluZGV4LlJhd1ZhbHVlUG9zaXRpb25dID0gTUFQX0RJUlRZX1ZBTFVFO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2V0TWFwVmFsdWUoXG4gICAgbWFwOiBTdHlsaW5nTWFwQXJyYXksIGluZGV4OiBudW1iZXIsIHZhbHVlOiBzdHJpbmcgfCBib29sZWFuIHwgbnVsbCk6IHZvaWQge1xuICBtYXBbaW5kZXggKyBTdHlsaW5nTWFwQXJyYXlJbmRleC5WYWx1ZU9mZnNldF0gPSB2YWx1ZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldE1hcFZhbHVlKG1hcDogU3R5bGluZ01hcEFycmF5LCBpbmRleDogbnVtYmVyKTogc3RyaW5nfG51bGwge1xuICByZXR1cm4gbWFwW2luZGV4ICsgU3R5bGluZ01hcEFycmF5SW5kZXguVmFsdWVPZmZzZXRdIGFzIHN0cmluZyB8IG51bGw7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBmb3JjZUNsYXNzZXNBc1N0cmluZyhjbGFzc2VzOiBzdHJpbmcgfCB7W2tleTogc3RyaW5nXTogYW55fSB8IG51bGwgfCB1bmRlZmluZWQpOlxuICAgIHN0cmluZyB7XG4gIGlmIChjbGFzc2VzICYmIHR5cGVvZiBjbGFzc2VzICE9PSAnc3RyaW5nJykge1xuICAgIGNsYXNzZXMgPSBPYmplY3Qua2V5cyhjbGFzc2VzKS5qb2luKCcgJyk7XG4gIH1cbiAgcmV0dXJuIChjbGFzc2VzIGFzIHN0cmluZykgfHwgJyc7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBmb3JjZVN0eWxlc0FzU3RyaW5nKFxuICAgIHN0eWxlczoge1trZXk6IHN0cmluZ106IGFueX0gfCBzdHJpbmcgfCBudWxsIHwgdW5kZWZpbmVkLCBoeXBoZW5hdGVQcm9wczogYm9vbGVhbik6IHN0cmluZyB7XG4gIGlmICh0eXBlb2Ygc3R5bGVzID09ICdzdHJpbmcnKSByZXR1cm4gc3R5bGVzO1xuICBsZXQgc3RyID0gJyc7XG4gIGlmIChzdHlsZXMpIHtcbiAgICBjb25zdCBwcm9wcyA9IE9iamVjdC5rZXlzKHN0eWxlcyk7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwcm9wcy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgcHJvcCA9IHByb3BzW2ldO1xuICAgICAgY29uc3QgcHJvcExhYmVsID0gaHlwaGVuYXRlUHJvcHMgPyBoeXBoZW5hdGUocHJvcCkgOiBwcm9wO1xuICAgICAgY29uc3QgdmFsdWUgPSBzdHlsZXNbcHJvcF07XG4gICAgICBpZiAodmFsdWUgIT09IG51bGwpIHtcbiAgICAgICAgc3RyID0gY29uY2F0U3RyaW5nKHN0ciwgYCR7cHJvcExhYmVsfToke3ZhbHVlfWAsICc7Jyk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiBzdHI7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0hvc3RTdHlsaW5nQWN0aXZlKGRpcmVjdGl2ZU9yU291cmNlSWQ6IG51bWJlcik6IGJvb2xlYW4ge1xuICByZXR1cm4gZGlyZWN0aXZlT3JTb3VyY2VJZCAhPT0gVEVNUExBVEVfRElSRUNUSVZFX0lOREVYO1xufVxuXG4vKipcbiAqIENvbnZlcnRzIHRoZSBwcm92aWRlZCBzdHlsaW5nIG1hcCBhcnJheSBpbnRvIGEgc3RyaW5nLlxuICpcbiAqIENsYXNzZXMgPT4gYG9uZSB0d28gdGhyZWVgXG4gKiBTdHlsZXMgPT4gYHByb3A6dmFsdWU7IHByb3AyOnZhbHVlMmBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHN0eWxpbmdNYXBUb1N0cmluZyhtYXA6IFN0eWxpbmdNYXBBcnJheSwgaXNDbGFzc0Jhc2VkOiBib29sZWFuKTogc3RyaW5nIHtcbiAgbGV0IHN0ciA9ICcnO1xuICBmb3IgKGxldCBpID0gU3R5bGluZ01hcEFycmF5SW5kZXguVmFsdWVzU3RhcnRQb3NpdGlvbjsgaSA8IG1hcC5sZW5ndGg7XG4gICAgICAgaSArPSBTdHlsaW5nTWFwQXJyYXlJbmRleC5UdXBsZVNpemUpIHtcbiAgICBjb25zdCBwcm9wID0gZ2V0TWFwUHJvcChtYXAsIGkpO1xuICAgIGNvbnN0IHZhbHVlID0gZ2V0TWFwVmFsdWUobWFwLCBpKSBhcyBzdHJpbmc7XG4gICAgY29uc3QgYXR0clZhbHVlID0gY29uY2F0U3RyaW5nKHByb3AsIGlzQ2xhc3NCYXNlZCA/ICcnIDogdmFsdWUsICc6Jyk7XG4gICAgc3RyID0gY29uY2F0U3RyaW5nKHN0ciwgYXR0clZhbHVlLCBpc0NsYXNzQmFzZWQgPyAnICcgOiAnOyAnKTtcbiAgfVxuICByZXR1cm4gc3RyO1xufVxuXG4vKipcbiAqIENvbnZlcnRzIHRoZSBwcm92aWRlZCBzdHlsaW5nIG1hcCBhcnJheSBpbnRvIGEga2V5IHZhbHVlIG1hcC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHN0eWxpbmdNYXBUb1N0cmluZ01hcChtYXA6IFN0eWxpbmdNYXBBcnJheSB8IG51bGwpOiB7W2tleTogc3RyaW5nXTogYW55fSB7XG4gIGxldCBzdHJpbmdNYXA6IHtba2V5OiBzdHJpbmddOiBhbnl9ID0ge307XG4gIGlmIChtYXApIHtcbiAgICBmb3IgKGxldCBpID0gU3R5bGluZ01hcEFycmF5SW5kZXguVmFsdWVzU3RhcnRQb3NpdGlvbjsgaSA8IG1hcC5sZW5ndGg7XG4gICAgICAgICBpICs9IFN0eWxpbmdNYXBBcnJheUluZGV4LlR1cGxlU2l6ZSkge1xuICAgICAgY29uc3QgcHJvcCA9IGdldE1hcFByb3AobWFwLCBpKTtcbiAgICAgIGNvbnN0IHZhbHVlID0gZ2V0TWFwVmFsdWUobWFwLCBpKSBhcyBzdHJpbmc7XG4gICAgICBzdHJpbmdNYXBbcHJvcF0gPSB2YWx1ZTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHN0cmluZ01hcDtcbn1cblxuLyoqXG4gKiBJbnNlcnRzIHRoZSBwcm92aWRlZCBpdGVtIGludG8gdGhlIHByb3ZpZGVkIHN0eWxpbmcgYXJyYXkgYXQgdGhlIHJpZ2h0IHNwb3QuXG4gKlxuICogVGhlIGBTdHlsaW5nTWFwQXJyYXlgIHR5cGUgaXMgYSBzb3J0ZWQga2V5L3ZhbHVlIGFycmF5IG9mIGVudHJpZXMuIFRoaXMgbWVhbnNcbiAqIHRoYXQgd2hlbiBhIG5ldyBlbnRyeSBpcyBpbnNlcnRlZCBpdCBtdXN0IGJlIHBsYWNlZCBhdCB0aGUgcmlnaHQgc3BvdCBpbiB0aGVcbiAqIGFycmF5LiBUaGlzIGZ1bmN0aW9uIGZpZ3VyZXMgb3V0IGV4YWN0bHkgd2hlcmUgdG8gcGxhY2UgaXQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhZGRJdGVtVG9TdHlsaW5nTWFwKFxuICAgIHN0eWxpbmdNYXBBcnI6IFN0eWxpbmdNYXBBcnJheSwgcHJvcDogc3RyaW5nLCB2YWx1ZTogc3RyaW5nIHwgYm9vbGVhbiB8IG51bGwsXG4gICAgYWxsb3dPdmVyd3JpdGU/OiBib29sZWFuKSB7XG4gIGZvciAobGV0IGogPSBTdHlsaW5nTWFwQXJyYXlJbmRleC5WYWx1ZXNTdGFydFBvc2l0aW9uOyBqIDwgc3R5bGluZ01hcEFyci5sZW5ndGg7XG4gICAgICAgaiArPSBTdHlsaW5nTWFwQXJyYXlJbmRleC5UdXBsZVNpemUpIHtcbiAgICBjb25zdCBwcm9wQXRJbmRleCA9IGdldE1hcFByb3Aoc3R5bGluZ01hcEFyciwgaik7XG4gICAgaWYgKHByb3AgPD0gcHJvcEF0SW5kZXgpIHtcbiAgICAgIGxldCBhcHBsaWVkID0gZmFsc2U7XG4gICAgICBpZiAocHJvcEF0SW5kZXggPT09IHByb3ApIHtcbiAgICAgICAgY29uc3QgdmFsdWVBdEluZGV4ID0gc3R5bGluZ01hcEFycltqXTtcbiAgICAgICAgaWYgKGFsbG93T3ZlcndyaXRlIHx8ICFpc1N0eWxpbmdWYWx1ZURlZmluZWQodmFsdWVBdEluZGV4KSkge1xuICAgICAgICAgIGFwcGxpZWQgPSB0cnVlO1xuICAgICAgICAgIHNldE1hcFZhbHVlKHN0eWxpbmdNYXBBcnIsIGosIHZhbHVlKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYXBwbGllZCA9IHRydWU7XG4gICAgICAgIHN0eWxpbmdNYXBBcnIuc3BsaWNlKGosIDAsIHByb3AsIHZhbHVlKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBhcHBsaWVkO1xuICAgIH1cbiAgfVxuXG4gIHN0eWxpbmdNYXBBcnIucHVzaChwcm9wLCB2YWx1ZSk7XG4gIHJldHVybiB0cnVlO1xufVxuXG4vKipcbiAqIFVzZWQgdG8gY29udmVydCBhIHtrZXk6dmFsdWV9IG1hcCBpbnRvIGEgYFN0eWxpbmdNYXBBcnJheWAgYXJyYXkuXG4gKlxuICogVGhpcyBmdW5jdGlvbiB3aWxsIGVpdGhlciBnZW5lcmF0ZSBhIG5ldyBgU3R5bGluZ01hcEFycmF5YCBpbnN0YW5jZVxuICogb3IgaXQgd2lsbCBwYXRjaCB0aGUgcHJvdmlkZWQgYG5ld1ZhbHVlc2AgbWFwIHZhbHVlIGludG8gYW5cbiAqIGV4aXN0aW5nIGBTdHlsaW5nTWFwQXJyYXlgIHZhbHVlICh0aGlzIG9ubHkgaGFwcGVucyBpZiBgYmluZGluZ1ZhbHVlYFxuICogaXMgYW4gaW5zdGFuY2Ugb2YgYFN0eWxpbmdNYXBBcnJheWApLlxuICpcbiAqIElmIGEgbmV3IGtleS92YWx1ZSBtYXAgaXMgcHJvdmlkZWQgd2l0aCBhbiBvbGQgYFN0eWxpbmdNYXBBcnJheWBcbiAqIHZhbHVlIHRoZW4gYWxsIHByb3BlcnRpZXMgd2lsbCBiZSBvdmVyd3JpdHRlbiB3aXRoIHRoZWlyIG5ld1xuICogdmFsdWVzIG9yIHdpdGggYG51bGxgLiBUaGlzIG1lYW5zIHRoYXQgdGhlIGFycmF5IHdpbGwgbmV2ZXJcbiAqIHNocmluayBpbiBzaXplIChidXQgaXQgd2lsbCBhbHNvIG5vdCBiZSBjcmVhdGVkIGFuZCB0aHJvd25cbiAqIGF3YXkgd2hlbmV2ZXIgdGhlIGB7a2V5OnZhbHVlfWAgbWFwIGVudHJpZXMgY2hhbmdlKS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG5vcm1hbGl6ZUludG9TdHlsaW5nTWFwKFxuICAgIGJpbmRpbmdWYWx1ZTogbnVsbCB8IFN0eWxpbmdNYXBBcnJheSxcbiAgICBuZXdWYWx1ZXM6IHtba2V5OiBzdHJpbmddOiBhbnl9IHwgc3RyaW5nIHwgbnVsbCB8IHVuZGVmaW5lZCxcbiAgICBub3JtYWxpemVQcm9wcz86IGJvb2xlYW4pOiBTdHlsaW5nTWFwQXJyYXkge1xuICBjb25zdCBzdHlsaW5nTWFwQXJyOiBTdHlsaW5nTWFwQXJyYXkgPVxuICAgICAgQXJyYXkuaXNBcnJheShiaW5kaW5nVmFsdWUpID8gYmluZGluZ1ZhbHVlIDogYWxsb2NTdHlsaW5nTWFwQXJyYXkobnVsbCk7XG4gIHN0eWxpbmdNYXBBcnJbU3R5bGluZ01hcEFycmF5SW5kZXguUmF3VmFsdWVQb3NpdGlvbl0gPSBuZXdWYWx1ZXM7XG5cbiAgLy8gYmVjYXVzZSB0aGUgbmV3IHZhbHVlcyBtYXkgbm90IGluY2x1ZGUgYWxsIHRoZSBwcm9wZXJ0aWVzXG4gIC8vIHRoYXQgdGhlIG9sZCBvbmVzIGhhZCwgYWxsIHZhbHVlcyBhcmUgc2V0IHRvIGBudWxsYCBiZWZvcmVcbiAgLy8gdGhlIG5ldyB2YWx1ZXMgYXJlIGFwcGxpZWQuIFRoaXMgd2F5LCB3aGVuIGZsdXNoZWQsIHRoZVxuICAvLyBzdHlsaW5nIGFsZ29yaXRobSBrbm93cyBleGFjdGx5IHdoYXQgc3R5bGUvY2xhc3MgdmFsdWVzXG4gIC8vIHRvIHJlbW92ZSBmcm9tIHRoZSBlbGVtZW50IChzaW5jZSB0aGV5IGFyZSBgbnVsbGApLlxuICBmb3IgKGxldCBqID0gU3R5bGluZ01hcEFycmF5SW5kZXguVmFsdWVzU3RhcnRQb3NpdGlvbjsgaiA8IHN0eWxpbmdNYXBBcnIubGVuZ3RoO1xuICAgICAgIGogKz0gU3R5bGluZ01hcEFycmF5SW5kZXguVHVwbGVTaXplKSB7XG4gICAgc2V0TWFwVmFsdWUoc3R5bGluZ01hcEFyciwgaiwgbnVsbCk7XG4gIH1cblxuICBsZXQgcHJvcHM6IHN0cmluZ1tdfG51bGwgPSBudWxsO1xuICBsZXQgbWFwOiB7W2tleTogc3RyaW5nXTogYW55fXx1bmRlZmluZWR8bnVsbDtcbiAgbGV0IGFsbFZhbHVlc1RydWUgPSBmYWxzZTtcbiAgaWYgKHR5cGVvZiBuZXdWYWx1ZXMgPT09ICdzdHJpbmcnKSB7ICAvLyBbY2xhc3NdIGJpbmRpbmdzIGFsbG93IHN0cmluZyB2YWx1ZXNcbiAgICBwcm9wcyA9IHNwbGl0T25XaGl0ZXNwYWNlKG5ld1ZhbHVlcyk7XG4gICAgYWxsVmFsdWVzVHJ1ZSA9IHByb3BzICE9PSBudWxsO1xuICB9IGVsc2Uge1xuICAgIHByb3BzID0gbmV3VmFsdWVzID8gT2JqZWN0LmtleXMobmV3VmFsdWVzKSA6IG51bGw7XG4gICAgbWFwID0gbmV3VmFsdWVzO1xuICB9XG5cbiAgaWYgKHByb3BzKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwcm9wcy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgcHJvcCA9IHByb3BzW2ldO1xuICAgICAgY29uc3QgbmV3UHJvcCA9IG5vcm1hbGl6ZVByb3BzID8gaHlwaGVuYXRlKHByb3ApIDogcHJvcDtcbiAgICAgIGNvbnN0IHZhbHVlID0gYWxsVmFsdWVzVHJ1ZSA/IHRydWUgOiBtYXAgIVtwcm9wXTtcbiAgICAgIGFkZEl0ZW1Ub1N0eWxpbmdNYXAoc3R5bGluZ01hcEFyciwgbmV3UHJvcCwgdmFsdWUsIHRydWUpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBzdHlsaW5nTWFwQXJyO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc3BsaXRPbldoaXRlc3BhY2UodGV4dDogc3RyaW5nKTogc3RyaW5nW118bnVsbCB7XG4gIGxldCBhcnJheTogc3RyaW5nW118bnVsbCA9IG51bGw7XG4gIGxldCBsZW5ndGggPSB0ZXh0Lmxlbmd0aDtcbiAgbGV0IHN0YXJ0ID0gMDtcbiAgbGV0IGZvdW5kQ2hhciA9IGZhbHNlO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3QgY2hhciA9IHRleHQuY2hhckNvZGVBdChpKTtcbiAgICBpZiAoY2hhciA8PSAzMiAvKicgJyovKSB7XG4gICAgICBpZiAoZm91bmRDaGFyKSB7XG4gICAgICAgIGlmIChhcnJheSA9PT0gbnVsbCkgYXJyYXkgPSBbXTtcbiAgICAgICAgYXJyYXkucHVzaCh0ZXh0LnN1YnN0cmluZyhzdGFydCwgaSkpO1xuICAgICAgICBmb3VuZENoYXIgPSBmYWxzZTtcbiAgICAgIH1cbiAgICAgIHN0YXJ0ID0gaSArIDE7XG4gICAgfSBlbHNlIHtcbiAgICAgIGZvdW5kQ2hhciA9IHRydWU7XG4gICAgfVxuICB9XG4gIGlmIChmb3VuZENoYXIpIHtcbiAgICBpZiAoYXJyYXkgPT09IG51bGwpIGFycmF5ID0gW107XG4gICAgYXJyYXkucHVzaCh0ZXh0LnN1YnN0cmluZyhzdGFydCwgbGVuZ3RoKSk7XG4gICAgZm91bmRDaGFyID0gZmFsc2U7XG4gIH1cbiAgcmV0dXJuIGFycmF5O1xufVxuXG4vLyBUT0RPIChtYXRza298QW5kcmV3S3VzaG5pcik6IHJlZmFjdG9yIHRoaXMgb25jZSB3ZSBmaWd1cmUgb3V0IGhvdyB0byBnZW5lcmF0ZSBzZXBhcmF0ZVxuLy8gYGlucHV0KCdjbGFzcycpICsgY2xhc3NNYXAoKWAgaW5zdHJ1Y3Rpb25zLlxuZXhwb3J0IGZ1bmN0aW9uIHNlbGVjdENsYXNzQmFzZWRJbnB1dE5hbWUoaW5wdXRzOiBQcm9wZXJ0eUFsaWFzZXMpOiBzdHJpbmcge1xuICByZXR1cm4gaW5wdXRzLmhhc093blByb3BlcnR5KCdjbGFzcycpID8gJ2NsYXNzJyA6ICdjbGFzc05hbWUnO1xufVxuIl19