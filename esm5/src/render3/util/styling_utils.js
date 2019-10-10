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
    initialStyling = initialStyling || allocStylingMapArray();
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
export function allocStylingMapArray() {
    return [''];
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
 * 1. there are no directives present AND ngDevMode is falsy
 * 2. context is locked for template or host bindings (depending on `hostBindingsMode`)
 * 3. There are no collisions (i.e. properties with more than one binding) across multiple
 *    sources (i.e. template + directive, directive + directive, directive + component)
 */
export function allowDirectStyling(context, hostBindingsMode) {
    var allow = false;
    var config = getConfig(context);
    var contextIsLocked = (config & getLockedConfig(hostBindingsMode)) !== 0;
    var hasNoDirectives = (config & 1 /* HasDirectives */) === 0;
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
    return bindingIndex > 0 ? data[bindingIndex] : null;
}
export function lockContext(context, hostBindingsMode) {
    patchConfig(context, getLockedConfig(hostBindingsMode));
}
export function isContextLocked(context, hostBindingsMode) {
    return hasConfig(context, getLockedConfig(hostBindingsMode));
}
export function getLockedConfig(hostBindingsMode) {
    return hostBindingsMode ? 256 /* HostBindingsLocked */ :
        128 /* TemplateBindingsLocked */;
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
export function forceStylesAsString(styles) {
    var str = '';
    if (styles) {
        var props = Object.keys(styles);
        for (var i = 0; i < props.length; i++) {
            var prop = props[i];
            str = concatString(str, prop + ":" + styles[prop], ';');
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
    var stylingMapArr = Array.isArray(bindingValue) ? bindingValue : [null];
    stylingMapArr[0 /* RawValuePosition */] = newValues || null;
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
        for (var i = 0; i < props.length; i++) {
            var prop = props[i];
            var newProp = normalizeProps ? hyphenate(prop) : prop;
            var value = allValuesTrue ? true : map[prop];
            addItemToStylingMap(stylingMapArr, newProp, value, true);
        }
    }
    return stylingMapArr;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3R5bGluZ191dGlscy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvdXRpbC9zdHlsaW5nX3V0aWxzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQVNBLE9BQU8sRUFBQyxTQUFTLEVBQUMsTUFBTSxXQUFXLENBQUM7QUFFcEMsTUFBTSxDQUFDLElBQU0seUJBQXlCLEdBQUcsT0FBTyxDQUFDO0FBQ2pELE1BQU0sQ0FBQyxJQUFNLHdCQUF3QixHQUFHLENBQUMsQ0FBQztBQUUxQzs7Ozs7OztHQU9HO0FBQ0gsTUFBTSxDQUFDLElBQU0scUJBQXFCLEdBQUcsSUFBSSxDQUFDO0FBRTFDLE1BQU0sQ0FBQyxJQUFNLHFCQUFxQixHQUFHLENBQUMsQ0FBQztBQUV2QyxJQUFNLHFCQUFxQixHQUFHLENBQUMsQ0FBQztBQUVoQyxnRUFBZ0U7QUFDaEUsa0VBQWtFO0FBQ2xFLGtFQUFrRTtBQUNsRSxpRUFBaUU7QUFDakUsMkJBQTJCO0FBQzNCLE1BQU0sQ0FBQyxJQUFNLHdCQUF3QixHQUFHLENBQUcsQ0FBQztBQUU1Qzs7Ozs7OztHQU9HO0FBQ0gsTUFBTSxVQUFVLG9CQUFvQixDQUNoQyxjQUFzQyxFQUFFLGFBQXNCO0lBQ2hFLGNBQWMsR0FBRyxjQUFjLElBQUksb0JBQW9CLEVBQUUsQ0FBQztJQUMxRCxJQUFJLE1BQU0sa0JBQXlCLENBQUM7SUFDcEMsSUFBSSxhQUFhLEVBQUU7UUFDakIsTUFBTSx5QkFBZ0MsQ0FBQztLQUN4QztJQUNELElBQUksY0FBYyxDQUFDLE1BQU0sOEJBQTJDLEVBQUU7UUFDcEUsTUFBTSw4QkFBb0MsQ0FBQztLQUM1QztJQUNELE9BQU87UUFDTCxNQUFNO1FBQ04scUJBQXFCO1FBQ3JCLGNBQWM7S0FDZixDQUFDO0FBQ0osQ0FBQztBQUVELE1BQU0sVUFBVSxvQkFBb0I7SUFDbEMsT0FBTyxDQUFDLEVBQUUsQ0FB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QUM3QyxJQUFJLGFBQWEsR0FBRyxLQUFLLENBQUM7SUFDMUIsSUFBSSxPQUFPLFNBQVMsS0FBSyxRQUFRLEVBQUUsRUFBRyx1Q0FBdUM7UUFDM0UsSUFBSSxTQUFTLENBQUMsTUFBTSxFQUFFO1lBQ3BCLEtBQUssR0FBRyxTQUFTLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQy9CLGFBQWEsR0FBRyxJQUFJLENBQUM7U0FDdEI7S0FDRjtTQUFNO1FBQ0wsS0FBSyxHQUFHLFNBQVMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO1FBQ2xELEdBQUcsR0FBRyxTQUFTLENBQUM7S0FDakI7SUFFRCxJQUFJLEtBQUssRUFBRTtRQUNULEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO1lBQ3JDLElBQU0sSUFBSSxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQVcsQ0FBQztZQUNoQyxJQUFNLE9BQU8sR0FBRyxjQUFjLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO1lBQ3hELElBQU0sS0FBSyxHQUFHLGFBQWEsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDakQsbUJBQW1CLENBQUMsYUFBYSxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsSUFBSSxDQUFDLENBQUM7U0FDMUQ7S0FDRjtJQUVELE9BQU8sYUFBYSxDQUFDO0FBQ3ZCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiogQGxpY2Vuc2VcbiogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4qXG4qIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4qIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiovXG5pbXBvcnQge1ROb2RlLCBUTm9kZUZsYWdzfSBmcm9tICcuLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtMU3R5bGluZ0RhdGEsIFN0eWxpbmdNYXBBcnJheSwgU3R5bGluZ01hcEFycmF5SW5kZXgsIFRTdHlsaW5nQ29uZmlnLCBUU3R5bGluZ0NvbnRleHQsIFRTdHlsaW5nQ29udGV4dEluZGV4LCBUU3R5bGluZ0NvbnRleHRQcm9wQ29uZmlnRmxhZ3N9IGZyb20gJy4uL2ludGVyZmFjZXMvc3R5bGluZyc7XG5pbXBvcnQge05PX0NIQU5HRX0gZnJvbSAnLi4vdG9rZW5zJztcblxuZXhwb3J0IGNvbnN0IE1BUF9CQVNFRF9FTlRSWV9QUk9QX05BTUUgPSAnW01BUF0nO1xuZXhwb3J0IGNvbnN0IFRFTVBMQVRFX0RJUkVDVElWRV9JTkRFWCA9IDA7XG5cbi8qKlxuICogRGVmYXVsdCBmYWxsYmFjayB2YWx1ZSBmb3IgYSBzdHlsaW5nIGJpbmRpbmcuXG4gKlxuICogQSB2YWx1ZSBvZiBgbnVsbGAgaXMgdXNlZCBoZXJlIHdoaWNoIHNpZ25hbHMgdG8gdGhlIHN0eWxpbmcgYWxnb3JpdGhtIHRoYXRcbiAqIHRoZSBzdHlsaW5nIHZhbHVlIGlzIG5vdCBwcmVzZW50LiBUaGlzIHdheSBpZiB0aGVyZSBhcmUgbm8gb3RoZXIgdmFsdWVzXG4gKiBkZXRlY3RlZCB0aGVuIGl0IHdpbGwgYmUgcmVtb3ZlZCBvbmNlIHRoZSBzdHlsZS9jbGFzcyBwcm9wZXJ0eSBpcyBkaXJ0eSBhbmRcbiAqIGRpZmZlZCB3aXRoaW4gdGhlIHN0eWxpbmcgYWxnb3JpdGhtIHByZXNlbnQgaW4gYGZsdXNoU3R5bGluZ2AuXG4gKi9cbmV4cG9ydCBjb25zdCBERUZBVUxUX0JJTkRJTkdfVkFMVUUgPSBudWxsO1xuXG5leHBvcnQgY29uc3QgREVGQVVMVF9CSU5ESU5HX0lOREVYID0gMDtcblxuY29uc3QgREVGQVVMVF9UT1RBTF9TT1VSQ0VTID0gMTtcblxuLy8gVGhlIGZpcnN0IGJpdCB2YWx1ZSByZWZsZWN0cyBhIG1hcC1iYXNlZCBiaW5kaW5nIHZhbHVlJ3MgYml0LlxuLy8gVGhlIHJlYXNvbiB3aHkgaXQncyBhbHdheXMgYWN0aXZhdGVkIGZvciBldmVyeSBlbnRyeSBpbiB0aGUgbWFwXG4vLyBpcyBzbyB0aGF0IGlmIGFueSBtYXAtYmluZGluZyB2YWx1ZXMgdXBkYXRlIHRoZW4gYWxsIG90aGVyIHByb3Bcbi8vIGJhc2VkIGJpbmRpbmdzIHdpbGwgcGFzcyB0aGUgZ3VhcmQgY2hlY2sgYXV0b21hdGljYWxseSB3aXRob3V0XG4vLyBhbnkgZXh0cmEgY29kZSBvciBmbGFncy5cbmV4cG9ydCBjb25zdCBERUZBVUxUX0dVQVJEX01BU0tfVkFMVUUgPSAwYjE7XG5cbi8qKlxuICogQ3JlYXRlcyBhIG5ldyBpbnN0YW5jZSBvZiB0aGUgYFRTdHlsaW5nQ29udGV4dGAuXG4gKlxuICogVGhlIGBUU3R5bGluZ0NvbnRleHRgIGlzIHVzZWQgYXMgYSBtYW5pZmVzdCBvZiBhbGwgc3R5bGUgb3IgYWxsIGNsYXNzIGJpbmRpbmdzIG9uXG4gKiBhbiBlbGVtZW50LiBCZWNhdXNlIGl0IGlzIGEgVC1sZXZlbCBkYXRhLXN0cnVjdHVyZSwgaXQgaXMgb25seSBjcmVhdGVkIG9uY2UgcGVyXG4gKiB0Tm9kZSBmb3Igc3R5bGVzIGFuZCBmb3IgY2xhc3Nlcy4gVGhpcyBmdW5jdGlvbiBhbGxvY2F0ZXMgYSBuZXcgaW5zdGFuY2Ugb2YgYVxuICogYFRTdHlsaW5nQ29udGV4dGAgd2l0aCB0aGUgaW5pdGlhbCB2YWx1ZXMgKHNlZSBgaW50ZXJmYWNlcy50c2AgZm9yIG1vcmUgaW5mbykuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhbGxvY1RTdHlsaW5nQ29udGV4dChcbiAgICBpbml0aWFsU3R5bGluZzogU3R5bGluZ01hcEFycmF5IHwgbnVsbCwgaGFzRGlyZWN0aXZlczogYm9vbGVhbik6IFRTdHlsaW5nQ29udGV4dCB7XG4gIGluaXRpYWxTdHlsaW5nID0gaW5pdGlhbFN0eWxpbmcgfHwgYWxsb2NTdHlsaW5nTWFwQXJyYXkoKTtcbiAgbGV0IGNvbmZpZyA9IFRTdHlsaW5nQ29uZmlnLkluaXRpYWw7XG4gIGlmIChoYXNEaXJlY3RpdmVzKSB7XG4gICAgY29uZmlnIHw9IFRTdHlsaW5nQ29uZmlnLkhhc0RpcmVjdGl2ZXM7XG4gIH1cbiAgaWYgKGluaXRpYWxTdHlsaW5nLmxlbmd0aCA+IFN0eWxpbmdNYXBBcnJheUluZGV4LlZhbHVlc1N0YXJ0UG9zaXRpb24pIHtcbiAgICBjb25maWcgfD0gVFN0eWxpbmdDb25maWcuSGFzSW5pdGlhbFN0eWxpbmc7XG4gIH1cbiAgcmV0dXJuIFtcbiAgICBjb25maWcsICAgICAgICAgICAgICAgICAvLyAxKSBjb25maWcgZm9yIHRoZSBzdHlsaW5nIGNvbnRleHRcbiAgICBERUZBVUxUX1RPVEFMX1NPVVJDRVMsICAvLyAyKSB0b3RhbCBhbW91bnQgb2Ygc3R5bGluZyBzb3VyY2VzICh0ZW1wbGF0ZSwgZGlyZWN0aXZlcywgZXRjLi4uKVxuICAgIGluaXRpYWxTdHlsaW5nLCAgICAgICAgIC8vIDMpIGluaXRpYWwgc3R5bGluZyB2YWx1ZXNcbiAgXTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGFsbG9jU3R5bGluZ01hcEFycmF5KCk6IFN0eWxpbmdNYXBBcnJheSB7XG4gIHJldHVybiBbJyddO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q29uZmlnKGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCkge1xuICByZXR1cm4gY29udGV4dFtUU3R5bGluZ0NvbnRleHRJbmRleC5Db25maWdQb3NpdGlvbl07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBoYXNDb25maWcoY29udGV4dDogVFN0eWxpbmdDb250ZXh0LCBmbGFnOiBUU3R5bGluZ0NvbmZpZykge1xuICByZXR1cm4gKGdldENvbmZpZyhjb250ZXh0KSAmIGZsYWcpICE9PSAwO1xufVxuXG4vKipcbiAqIERldGVybWluZXMgd2hldGhlciBvciBub3QgdG8gYXBwbHkgc3R5bGVzL2NsYXNzZXMgZGlyZWN0bHkgb3IgdmlhIGNvbnRleHQgcmVzb2x1dGlvbi5cbiAqXG4gKiBUaGVyZSBhcmUgdGhyZWUgY2FzZXMgdGhhdCBhcmUgbWF0Y2hlZCBoZXJlOlxuICogMS4gdGhlcmUgYXJlIG5vIGRpcmVjdGl2ZXMgcHJlc2VudCBBTkQgbmdEZXZNb2RlIGlzIGZhbHN5XG4gKiAyLiBjb250ZXh0IGlzIGxvY2tlZCBmb3IgdGVtcGxhdGUgb3IgaG9zdCBiaW5kaW5ncyAoZGVwZW5kaW5nIG9uIGBob3N0QmluZGluZ3NNb2RlYClcbiAqIDMuIFRoZXJlIGFyZSBubyBjb2xsaXNpb25zIChpLmUuIHByb3BlcnRpZXMgd2l0aCBtb3JlIHRoYW4gb25lIGJpbmRpbmcpIGFjcm9zcyBtdWx0aXBsZVxuICogICAgc291cmNlcyAoaS5lLiB0ZW1wbGF0ZSArIGRpcmVjdGl2ZSwgZGlyZWN0aXZlICsgZGlyZWN0aXZlLCBkaXJlY3RpdmUgKyBjb21wb25lbnQpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhbGxvd0RpcmVjdFN0eWxpbmcoY29udGV4dDogVFN0eWxpbmdDb250ZXh0LCBob3N0QmluZGluZ3NNb2RlOiBib29sZWFuKTogYm9vbGVhbiB7XG4gIGxldCBhbGxvdyA9IGZhbHNlO1xuICBjb25zdCBjb25maWcgPSBnZXRDb25maWcoY29udGV4dCk7XG4gIGNvbnN0IGNvbnRleHRJc0xvY2tlZCA9IChjb25maWcgJiBnZXRMb2NrZWRDb25maWcoaG9zdEJpbmRpbmdzTW9kZSkpICE9PSAwO1xuICBjb25zdCBoYXNOb0RpcmVjdGl2ZXMgPSAoY29uZmlnICYgVFN0eWxpbmdDb25maWcuSGFzRGlyZWN0aXZlcykgPT09IDA7XG5cbiAgLy8gaWYgbm8gZGlyZWN0aXZlcyBhcmUgcHJlc2VudCB0aGVuIHdlIGRvIG5vdCBuZWVkIHBvcHVsYXRlIGEgY29udGV4dCBhdCBhbGwuIFRoaXNcbiAgLy8gaXMgYmVjYXVzZSBkdXBsaWNhdGUgcHJvcCBiaW5kaW5ncyBjYW5ub3QgYmUgcmVnaXN0ZXJlZCB0aHJvdWdoIHRoZSB0ZW1wbGF0ZS4gSWZcbiAgLy8gYW5kIHdoZW4gdGhpcyBoYXBwZW5zIHdlIGNhbiBzYWZlbHkgYXBwbHkgdGhlIHZhbHVlIGRpcmVjdGx5IHdpdGhvdXQgY29udGV4dFxuICAvLyByZXNvbHV0aW9uLi4uXG4gIGlmIChoYXNOb0RpcmVjdGl2ZXMpIHtcbiAgICAvLyBgbmdEZXZNb2RlYCBpcyByZXF1aXJlZCB0byBiZSBjaGVja2VkIGhlcmUgYmVjYXVzZSB0ZXN0cy9kZWJ1Z2dpbmcgcmVseSBvbiB0aGUgY29udGV4dCBiZWluZ1xuICAgIC8vIHBvcHVsYXRlZC4gSWYgdGhpbmdzIGFyZSBpbiBwcm9kdWN0aW9uIG1vZGUgdGhlbiB0aGVyZSBpcyBubyBuZWVkIHRvIGJ1aWxkIGEgY29udGV4dFxuICAgIC8vIHRoZXJlZm9yZSB0aGUgZGlyZWN0IGFwcGx5IGNhbiBiZSBhbGxvd2VkIChldmVuIG9uIHRoZSBmaXJzdCB1cGRhdGUpLlxuICAgIGFsbG93ID0gbmdEZXZNb2RlID8gY29udGV4dElzTG9ja2VkIDogdHJ1ZTtcbiAgfSBlbHNlIGlmIChjb250ZXh0SXNMb2NrZWQpIHtcbiAgICBjb25zdCBoYXNOb0NvbGxpc2lvbnMgPSAoY29uZmlnICYgVFN0eWxpbmdDb25maWcuSGFzQ29sbGlzaW9ucykgPT09IDA7XG4gICAgY29uc3QgaGFzT25seU1hcHNPck9ubHlQcm9wcyA9XG4gICAgICAgIChjb25maWcgJiBUU3R5bGluZ0NvbmZpZy5IYXNQcm9wQW5kTWFwQmluZGluZ3MpICE9PSBUU3R5bGluZ0NvbmZpZy5IYXNQcm9wQW5kTWFwQmluZGluZ3M7XG4gICAgYWxsb3cgPSBoYXNOb0NvbGxpc2lvbnMgJiYgaGFzT25seU1hcHNPck9ubHlQcm9wcztcbiAgfVxuXG4gIHJldHVybiBhbGxvdztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNldENvbmZpZyhjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQsIHZhbHVlOiBUU3R5bGluZ0NvbmZpZyk6IHZvaWQge1xuICBjb250ZXh0W1RTdHlsaW5nQ29udGV4dEluZGV4LkNvbmZpZ1Bvc2l0aW9uXSA9IHZhbHVlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcGF0Y2hDb25maWcoY29udGV4dDogVFN0eWxpbmdDb250ZXh0LCBmbGFnOiBUU3R5bGluZ0NvbmZpZyk6IHZvaWQge1xuICBjb250ZXh0W1RTdHlsaW5nQ29udGV4dEluZGV4LkNvbmZpZ1Bvc2l0aW9uXSB8PSBmbGFnO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0UHJvcChjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQsIGluZGV4OiBudW1iZXIpOiBzdHJpbmcge1xuICByZXR1cm4gY29udGV4dFtpbmRleCArIFRTdHlsaW5nQ29udGV4dEluZGV4LlByb3BPZmZzZXRdIGFzIHN0cmluZztcbn1cblxuZnVuY3Rpb24gZ2V0UHJvcENvbmZpZyhjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQsIGluZGV4OiBudW1iZXIpOiBudW1iZXIge1xuICByZXR1cm4gKGNvbnRleHRbaW5kZXggKyBUU3R5bGluZ0NvbnRleHRJbmRleC5Db25maWdPZmZzZXRdIGFzIG51bWJlcikgJlxuICAgICAgVFN0eWxpbmdDb250ZXh0UHJvcENvbmZpZ0ZsYWdzLk1hc2s7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc1Nhbml0aXphdGlvblJlcXVpcmVkKGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCwgaW5kZXg6IG51bWJlcik6IGJvb2xlYW4ge1xuICByZXR1cm4gKGdldFByb3BDb25maWcoY29udGV4dCwgaW5kZXgpICYgVFN0eWxpbmdDb250ZXh0UHJvcENvbmZpZ0ZsYWdzLlNhbml0aXphdGlvblJlcXVpcmVkKSAhPT1cbiAgICAgIDA7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRHdWFyZE1hc2soXG4gICAgY29udGV4dDogVFN0eWxpbmdDb250ZXh0LCBpbmRleDogbnVtYmVyLCBpc0hvc3RCaW5kaW5nOiBib29sZWFuKTogbnVtYmVyIHtcbiAgY29uc3QgcG9zaXRpb24gPSBpbmRleCArIChpc0hvc3RCaW5kaW5nID8gVFN0eWxpbmdDb250ZXh0SW5kZXguSG9zdEJpbmRpbmdzQml0R3VhcmRPZmZzZXQgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBUU3R5bGluZ0NvbnRleHRJbmRleC5UZW1wbGF0ZUJpdEd1YXJkT2Zmc2V0KTtcbiAgcmV0dXJuIGNvbnRleHRbcG9zaXRpb25dIGFzIG51bWJlcjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNldEd1YXJkTWFzayhcbiAgICBjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQsIGluZGV4OiBudW1iZXIsIG1hc2tWYWx1ZTogbnVtYmVyLCBpc0hvc3RCaW5kaW5nOiBib29sZWFuKSB7XG4gIGNvbnN0IHBvc2l0aW9uID0gaW5kZXggKyAoaXNIb3N0QmluZGluZyA/IFRTdHlsaW5nQ29udGV4dEluZGV4Lkhvc3RCaW5kaW5nc0JpdEd1YXJkT2Zmc2V0IDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgVFN0eWxpbmdDb250ZXh0SW5kZXguVGVtcGxhdGVCaXRHdWFyZE9mZnNldCk7XG4gIGNvbnRleHRbcG9zaXRpb25dID0gbWFza1ZhbHVlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0VmFsdWVzQ291bnQoY29udGV4dDogVFN0eWxpbmdDb250ZXh0KTogbnVtYmVyIHtcbiAgcmV0dXJuIGdldFRvdGFsU291cmNlcyhjb250ZXh0KSArIDE7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRUb3RhbFNvdXJjZXMoY29udGV4dDogVFN0eWxpbmdDb250ZXh0KTogbnVtYmVyIHtcbiAgcmV0dXJuIGNvbnRleHRbVFN0eWxpbmdDb250ZXh0SW5kZXguVG90YWxTb3VyY2VzUG9zaXRpb25dO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0QmluZGluZ1ZhbHVlKGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCwgaW5kZXg6IG51bWJlciwgb2Zmc2V0OiBudW1iZXIpIHtcbiAgcmV0dXJuIGNvbnRleHRbaW5kZXggKyBUU3R5bGluZ0NvbnRleHRJbmRleC5CaW5kaW5nc1N0YXJ0T2Zmc2V0ICsgb2Zmc2V0XSBhcyBudW1iZXIgfCBzdHJpbmc7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXREZWZhdWx0VmFsdWUoY29udGV4dDogVFN0eWxpbmdDb250ZXh0LCBpbmRleDogbnVtYmVyKTogc3RyaW5nfGJvb2xlYW58bnVsbCB7XG4gIHJldHVybiBjb250ZXh0W2luZGV4ICsgVFN0eWxpbmdDb250ZXh0SW5kZXguQmluZGluZ3NTdGFydE9mZnNldCArIGdldFRvdGFsU291cmNlcyhjb250ZXh0KV0gYXNcbiAgICAgICAgICAgICBzdHJpbmcgfFxuICAgICAgYm9vbGVhbiB8IG51bGw7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXREZWZhdWx0VmFsdWUoXG4gICAgY29udGV4dDogVFN0eWxpbmdDb250ZXh0LCBpbmRleDogbnVtYmVyLCB2YWx1ZTogc3RyaW5nIHwgYm9vbGVhbiB8IG51bGwpIHtcbiAgcmV0dXJuIGNvbnRleHRbaW5kZXggKyBUU3R5bGluZ0NvbnRleHRJbmRleC5CaW5kaW5nc1N0YXJ0T2Zmc2V0ICsgZ2V0VG90YWxTb3VyY2VzKGNvbnRleHQpXSA9XG4gICAgICAgICAgICAgdmFsdWU7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXRWYWx1ZShkYXRhOiBMU3R5bGluZ0RhdGEsIGJpbmRpbmdJbmRleDogbnVtYmVyLCB2YWx1ZTogYW55KSB7XG4gIGRhdGFbYmluZGluZ0luZGV4XSA9IHZhbHVlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0VmFsdWU8VCA9IGFueT4oZGF0YTogTFN0eWxpbmdEYXRhLCBiaW5kaW5nSW5kZXg6IG51bWJlcik6IFR8bnVsbCB7XG4gIHJldHVybiBiaW5kaW5nSW5kZXggPiAwID8gZGF0YVtiaW5kaW5nSW5kZXhdIGFzIFQgOiBudWxsO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gbG9ja0NvbnRleHQoY29udGV4dDogVFN0eWxpbmdDb250ZXh0LCBob3N0QmluZGluZ3NNb2RlOiBib29sZWFuKTogdm9pZCB7XG4gIHBhdGNoQ29uZmlnKGNvbnRleHQsIGdldExvY2tlZENvbmZpZyhob3N0QmluZGluZ3NNb2RlKSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0NvbnRleHRMb2NrZWQoY29udGV4dDogVFN0eWxpbmdDb250ZXh0LCBob3N0QmluZGluZ3NNb2RlOiBib29sZWFuKTogYm9vbGVhbiB7XG4gIHJldHVybiBoYXNDb25maWcoY29udGV4dCwgZ2V0TG9ja2VkQ29uZmlnKGhvc3RCaW5kaW5nc01vZGUpKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldExvY2tlZENvbmZpZyhob3N0QmluZGluZ3NNb2RlOiBib29sZWFuKSB7XG4gIHJldHVybiBob3N0QmluZGluZ3NNb2RlID8gVFN0eWxpbmdDb25maWcuSG9zdEJpbmRpbmdzTG9ja2VkIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBUU3R5bGluZ0NvbmZpZy5UZW1wbGF0ZUJpbmRpbmdzTG9ja2VkO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0UHJvcFZhbHVlc1N0YXJ0UG9zaXRpb24oY29udGV4dDogVFN0eWxpbmdDb250ZXh0KSB7XG4gIGxldCBzdGFydFBvc2l0aW9uID0gVFN0eWxpbmdDb250ZXh0SW5kZXguVmFsdWVzU3RhcnRQb3NpdGlvbjtcbiAgaWYgKGhhc0NvbmZpZyhjb250ZXh0LCBUU3R5bGluZ0NvbmZpZy5IYXNNYXBCaW5kaW5ncykpIHtcbiAgICBzdGFydFBvc2l0aW9uICs9IFRTdHlsaW5nQ29udGV4dEluZGV4LkJpbmRpbmdzU3RhcnRPZmZzZXQgKyBnZXRWYWx1ZXNDb3VudChjb250ZXh0KTtcbiAgfVxuICByZXR1cm4gc3RhcnRQb3NpdGlvbjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGhhc1ZhbHVlQ2hhbmdlZChcbiAgICBhOiBOT19DSEFOR0UgfCBTdHlsaW5nTWFwQXJyYXkgfCBudW1iZXIgfCBTdHJpbmcgfCBzdHJpbmcgfCBudWxsIHwgYm9vbGVhbiB8IHVuZGVmaW5lZCB8IHt9LFxuICAgIGI6IE5PX0NIQU5HRSB8IFN0eWxpbmdNYXBBcnJheSB8IG51bWJlciB8IFN0cmluZyB8IHN0cmluZyB8IG51bGwgfCBib29sZWFuIHwgdW5kZWZpbmVkIHxcbiAgICAgICAge30pOiBib29sZWFuIHtcbiAgaWYgKGIgPT09IE5PX0NIQU5HRSkgcmV0dXJuIGZhbHNlO1xuXG4gIGNvbnN0IGNvbXBhcmVWYWx1ZUEgPSBBcnJheS5pc0FycmF5KGEpID8gYVtTdHlsaW5nTWFwQXJyYXlJbmRleC5SYXdWYWx1ZVBvc2l0aW9uXSA6IGE7XG4gIGNvbnN0IGNvbXBhcmVWYWx1ZUIgPSBBcnJheS5pc0FycmF5KGIpID8gYltTdHlsaW5nTWFwQXJyYXlJbmRleC5SYXdWYWx1ZVBvc2l0aW9uXSA6IGI7XG4gIHJldHVybiAhT2JqZWN0LmlzKGNvbXBhcmVWYWx1ZUEsIGNvbXBhcmVWYWx1ZUIpO1xufVxuXG4vKipcbiAqIERldGVybWluZXMgd2hldGhlciB0aGUgcHJvdmlkZWQgc3R5bGluZyB2YWx1ZSBpcyB0cnV0aHkgb3IgZmFsc3kuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpc1N0eWxpbmdWYWx1ZURlZmluZWQ8VCBleHRlbmRzIHN0cmluZ3xudW1iZXJ8e318bnVsbD4odmFsdWU6IFQpOlxuICAgIHZhbHVlIGlzIE5vbk51bGxhYmxlPFQ+IHtcbiAgLy8gdGhlIHJlYXNvbiB3aHkgbnVsbCBpcyBjb21wYXJlZCBhZ2FpbnN0IGlzIGJlY2F1c2VcbiAgLy8gYSBDU1MgY2xhc3MgdmFsdWUgdGhhdCBpcyBzZXQgdG8gYGZhbHNlYCBtdXN0IGJlXG4gIC8vIHJlc3BlY3RlZCAob3RoZXJ3aXNlIGl0IHdvdWxkIGJlIHRyZWF0ZWQgYXMgZmFsc3kpLlxuICAvLyBFbXB0eSBzdHJpbmcgdmFsdWVzIGFyZSBiZWNhdXNlIGRldmVsb3BlcnMgdXN1YWxseVxuICAvLyBzZXQgYSB2YWx1ZSB0byBhbiBlbXB0eSBzdHJpbmcgdG8gcmVtb3ZlIGl0LlxuICByZXR1cm4gdmFsdWUgIT0gbnVsbCAmJiB2YWx1ZSAhPT0gJyc7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjb25jYXRTdHJpbmcoYTogc3RyaW5nLCBiOiBzdHJpbmcsIHNlcGFyYXRvciA9ICcgJyk6IHN0cmluZyB7XG4gIHJldHVybiBhICsgKChiLmxlbmd0aCAmJiBhLmxlbmd0aCkgPyBzZXBhcmF0b3IgOiAnJykgKyBiO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaHlwaGVuYXRlKHZhbHVlOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gdmFsdWUucmVwbGFjZSgvW2Etel1bQS1aXS9nLCB2ID0+IHYuY2hhckF0KDApICsgJy0nICsgdi5jaGFyQXQoMSkpLnRvTG93ZXJDYXNlKCk7XG59XG5cbi8qKlxuICogUmV0dXJucyBhbiBpbnN0YW5jZSBvZiBgU3R5bGluZ01hcEFycmF5YC5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIGlzIGRlc2lnbmVkIHRvIGZpbmQgYW4gaW5zdGFuY2Ugb2YgYFN0eWxpbmdNYXBBcnJheWAgaW4gY2FzZSBpdCBpcyBzdG9yZWRcbiAqIGluc2lkZSBvZiBhbiBpbnN0YW5jZSBvZiBgVFN0eWxpbmdDb250ZXh0YC4gV2hlbiBhIHN0eWxpbmcgY29udGV4dCBpcyBjcmVhdGVkIGl0XG4gKiB3aWxsIGNvcHkgb3ZlciBhbiBpbml0aWFsIHN0eWxpbmcgdmFsdWVzIGZyb20gdGhlIHROb2RlICh3aGljaCBhcmUgc3RvcmVkIGFzIGFcbiAqIGBTdHlsaW5nTWFwQXJyYXlgIG9uIHRoZSBgdE5vZGUuY2xhc3Nlc2Agb3IgYHROb2RlLnN0eWxlc2AgdmFsdWVzKS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldFN0eWxpbmdNYXBBcnJheSh2YWx1ZTogVFN0eWxpbmdDb250ZXh0IHwgU3R5bGluZ01hcEFycmF5IHwgbnVsbCk6XG4gICAgU3R5bGluZ01hcEFycmF5fG51bGwge1xuICByZXR1cm4gaXNTdHlsaW5nQ29udGV4dCh2YWx1ZSkgP1xuICAgICAgKHZhbHVlIGFzIFRTdHlsaW5nQ29udGV4dClbVFN0eWxpbmdDb250ZXh0SW5kZXguSW5pdGlhbFN0eWxpbmdWYWx1ZVBvc2l0aW9uXSA6XG4gICAgICB2YWx1ZSBhcyBTdHlsaW5nTWFwQXJyYXk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc1N0eWxpbmdDb250ZXh0KHZhbHVlOiBhbnkpOiBib29sZWFuIHtcbiAgLy8gdGhlIFN0eWxpbmdNYXBBcnJheSBpcyBpbiB0aGUgZm9ybWF0IG9mIFtpbml0aWFsLCBwcm9wLCBzdHJpbmcsIHByb3AsIHN0cmluZ11cbiAgLy8gYW5kIHRoaXMgaXMgdGhlIGRlZmluaW5nIHZhbHVlIHRvIGRpc3Rpbmd1aXNoIGJldHdlZW4gYXJyYXlzXG4gIHJldHVybiBBcnJheS5pc0FycmF5KHZhbHVlKSAmJiB2YWx1ZS5sZW5ndGggPj0gVFN0eWxpbmdDb250ZXh0SW5kZXguVmFsdWVzU3RhcnRQb3NpdGlvbiAmJlxuICAgICAgdHlwZW9mIHZhbHVlWzFdICE9PSAnc3RyaW5nJztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzU3R5bGluZ01hcEFycmF5KHZhbHVlOiBUU3R5bGluZ0NvbnRleHQgfCBTdHlsaW5nTWFwQXJyYXkgfCBudWxsKTogYm9vbGVhbiB7XG4gIC8vIHRoZSBTdHlsaW5nTWFwQXJyYXkgaXMgaW4gdGhlIGZvcm1hdCBvZiBbaW5pdGlhbCwgcHJvcCwgc3RyaW5nLCBwcm9wLCBzdHJpbmddXG4gIC8vIGFuZCB0aGlzIGlzIHRoZSBkZWZpbmluZyB2YWx1ZSB0byBkaXN0aW5ndWlzaCBiZXR3ZWVuIGFycmF5c1xuICByZXR1cm4gQXJyYXkuaXNBcnJheSh2YWx1ZSkgJiZcbiAgICAgICh0eXBlb2YodmFsdWUgYXMgU3R5bGluZ01hcEFycmF5KVtTdHlsaW5nTWFwQXJyYXlJbmRleC5WYWx1ZXNTdGFydFBvc2l0aW9uXSA9PT0gJ3N0cmluZycpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0SW5pdGlhbFN0eWxpbmdWYWx1ZShjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQgfCBTdHlsaW5nTWFwQXJyYXkgfCBudWxsKTogc3RyaW5nIHtcbiAgY29uc3QgbWFwID0gZ2V0U3R5bGluZ01hcEFycmF5KGNvbnRleHQpO1xuICByZXR1cm4gbWFwICYmIChtYXBbU3R5bGluZ01hcEFycmF5SW5kZXguUmF3VmFsdWVQb3NpdGlvbl0gYXMgc3RyaW5nIHwgbnVsbCkgfHwgJyc7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBoYXNDbGFzc0lucHV0KHROb2RlOiBUTm9kZSkge1xuICByZXR1cm4gKHROb2RlLmZsYWdzICYgVE5vZGVGbGFncy5oYXNDbGFzc0lucHV0KSAhPT0gMDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGhhc1N0eWxlSW5wdXQodE5vZGU6IFROb2RlKSB7XG4gIHJldHVybiAodE5vZGUuZmxhZ3MgJiBUTm9kZUZsYWdzLmhhc1N0eWxlSW5wdXQpICE9PSAwO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0TWFwUHJvcChtYXA6IFN0eWxpbmdNYXBBcnJheSwgaW5kZXg6IG51bWJlcik6IHN0cmluZyB7XG4gIHJldHVybiBtYXBbaW5kZXggKyBTdHlsaW5nTWFwQXJyYXlJbmRleC5Qcm9wT2Zmc2V0XSBhcyBzdHJpbmc7XG59XG5cbmNvbnN0IE1BUF9ESVJUWV9WQUxVRSA9XG4gICAgdHlwZW9mIG5nRGV2TW9kZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbmdEZXZNb2RlID8ge30gOiB7TUFQX0RJUlRZX1ZBTFVFOiB0cnVlfTtcblxuZXhwb3J0IGZ1bmN0aW9uIHNldE1hcEFzRGlydHkobWFwOiBTdHlsaW5nTWFwQXJyYXkpOiB2b2lkIHtcbiAgbWFwW1N0eWxpbmdNYXBBcnJheUluZGV4LlJhd1ZhbHVlUG9zaXRpb25dID0gTUFQX0RJUlRZX1ZBTFVFO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2V0TWFwVmFsdWUoXG4gICAgbWFwOiBTdHlsaW5nTWFwQXJyYXksIGluZGV4OiBudW1iZXIsIHZhbHVlOiBzdHJpbmcgfCBib29sZWFuIHwgbnVsbCk6IHZvaWQge1xuICBtYXBbaW5kZXggKyBTdHlsaW5nTWFwQXJyYXlJbmRleC5WYWx1ZU9mZnNldF0gPSB2YWx1ZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldE1hcFZhbHVlKG1hcDogU3R5bGluZ01hcEFycmF5LCBpbmRleDogbnVtYmVyKTogc3RyaW5nfG51bGwge1xuICByZXR1cm4gbWFwW2luZGV4ICsgU3R5bGluZ01hcEFycmF5SW5kZXguVmFsdWVPZmZzZXRdIGFzIHN0cmluZyB8IG51bGw7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBmb3JjZUNsYXNzZXNBc1N0cmluZyhjbGFzc2VzOiBzdHJpbmcgfCB7W2tleTogc3RyaW5nXTogYW55fSB8IG51bGwgfCB1bmRlZmluZWQpOlxuICAgIHN0cmluZyB7XG4gIGlmIChjbGFzc2VzICYmIHR5cGVvZiBjbGFzc2VzICE9PSAnc3RyaW5nJykge1xuICAgIGNsYXNzZXMgPSBPYmplY3Qua2V5cyhjbGFzc2VzKS5qb2luKCcgJyk7XG4gIH1cbiAgcmV0dXJuIChjbGFzc2VzIGFzIHN0cmluZykgfHwgJyc7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBmb3JjZVN0eWxlc0FzU3RyaW5nKHN0eWxlczoge1trZXk6IHN0cmluZ106IGFueX0gfCBudWxsIHwgdW5kZWZpbmVkKTogc3RyaW5nIHtcbiAgbGV0IHN0ciA9ICcnO1xuICBpZiAoc3R5bGVzKSB7XG4gICAgY29uc3QgcHJvcHMgPSBPYmplY3Qua2V5cyhzdHlsZXMpO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcHJvcHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IHByb3AgPSBwcm9wc1tpXTtcbiAgICAgIHN0ciA9IGNvbmNhdFN0cmluZyhzdHIsIGAke3Byb3B9OiR7c3R5bGVzW3Byb3BdfWAsICc7Jyk7XG4gICAgfVxuICB9XG4gIHJldHVybiBzdHI7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0hvc3RTdHlsaW5nQWN0aXZlKGRpcmVjdGl2ZU9yU291cmNlSWQ6IG51bWJlcik6IGJvb2xlYW4ge1xuICByZXR1cm4gZGlyZWN0aXZlT3JTb3VyY2VJZCAhPT0gVEVNUExBVEVfRElSRUNUSVZFX0lOREVYO1xufVxuXG4vKipcbiAqIENvbnZlcnRzIHRoZSBwcm92aWRlZCBzdHlsaW5nIG1hcCBhcnJheSBpbnRvIGEgc3RyaW5nLlxuICpcbiAqIENsYXNzZXMgPT4gYG9uZSB0d28gdGhyZWVgXG4gKiBTdHlsZXMgPT4gYHByb3A6dmFsdWU7IHByb3AyOnZhbHVlMmBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHN0eWxpbmdNYXBUb1N0cmluZyhtYXA6IFN0eWxpbmdNYXBBcnJheSwgaXNDbGFzc0Jhc2VkOiBib29sZWFuKTogc3RyaW5nIHtcbiAgbGV0IHN0ciA9ICcnO1xuICBmb3IgKGxldCBpID0gU3R5bGluZ01hcEFycmF5SW5kZXguVmFsdWVzU3RhcnRQb3NpdGlvbjsgaSA8IG1hcC5sZW5ndGg7XG4gICAgICAgaSArPSBTdHlsaW5nTWFwQXJyYXlJbmRleC5UdXBsZVNpemUpIHtcbiAgICBjb25zdCBwcm9wID0gZ2V0TWFwUHJvcChtYXAsIGkpO1xuICAgIGNvbnN0IHZhbHVlID0gZ2V0TWFwVmFsdWUobWFwLCBpKSBhcyBzdHJpbmc7XG4gICAgY29uc3QgYXR0clZhbHVlID0gY29uY2F0U3RyaW5nKHByb3AsIGlzQ2xhc3NCYXNlZCA/ICcnIDogdmFsdWUsICc6Jyk7XG4gICAgc3RyID0gY29uY2F0U3RyaW5nKHN0ciwgYXR0clZhbHVlLCBpc0NsYXNzQmFzZWQgPyAnICcgOiAnOyAnKTtcbiAgfVxuICByZXR1cm4gc3RyO1xufVxuXG4vKipcbiAqIENvbnZlcnRzIHRoZSBwcm92aWRlZCBzdHlsaW5nIG1hcCBhcnJheSBpbnRvIGEga2V5IHZhbHVlIG1hcC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHN0eWxpbmdNYXBUb1N0cmluZ01hcChtYXA6IFN0eWxpbmdNYXBBcnJheSB8IG51bGwpOiB7W2tleTogc3RyaW5nXTogYW55fSB7XG4gIGxldCBzdHJpbmdNYXA6IHtba2V5OiBzdHJpbmddOiBhbnl9ID0ge307XG4gIGlmIChtYXApIHtcbiAgICBmb3IgKGxldCBpID0gU3R5bGluZ01hcEFycmF5SW5kZXguVmFsdWVzU3RhcnRQb3NpdGlvbjsgaSA8IG1hcC5sZW5ndGg7XG4gICAgICAgICBpICs9IFN0eWxpbmdNYXBBcnJheUluZGV4LlR1cGxlU2l6ZSkge1xuICAgICAgY29uc3QgcHJvcCA9IGdldE1hcFByb3AobWFwLCBpKTtcbiAgICAgIGNvbnN0IHZhbHVlID0gZ2V0TWFwVmFsdWUobWFwLCBpKSBhcyBzdHJpbmc7XG4gICAgICBzdHJpbmdNYXBbcHJvcF0gPSB2YWx1ZTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHN0cmluZ01hcDtcbn1cblxuLyoqXG4gKiBJbnNlcnRzIHRoZSBwcm92aWRlZCBpdGVtIGludG8gdGhlIHByb3ZpZGVkIHN0eWxpbmcgYXJyYXkgYXQgdGhlIHJpZ2h0IHNwb3QuXG4gKlxuICogVGhlIGBTdHlsaW5nTWFwQXJyYXlgIHR5cGUgaXMgYSBzb3J0ZWQga2V5L3ZhbHVlIGFycmF5IG9mIGVudHJpZXMuIFRoaXMgbWVhbnNcbiAqIHRoYXQgd2hlbiBhIG5ldyBlbnRyeSBpcyBpbnNlcnRlZCBpdCBtdXN0IGJlIHBsYWNlZCBhdCB0aGUgcmlnaHQgc3BvdCBpbiB0aGVcbiAqIGFycmF5LiBUaGlzIGZ1bmN0aW9uIGZpZ3VyZXMgb3V0IGV4YWN0bHkgd2hlcmUgdG8gcGxhY2UgaXQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhZGRJdGVtVG9TdHlsaW5nTWFwKFxuICAgIHN0eWxpbmdNYXBBcnI6IFN0eWxpbmdNYXBBcnJheSwgcHJvcDogc3RyaW5nLCB2YWx1ZTogc3RyaW5nIHwgYm9vbGVhbiB8IG51bGwsXG4gICAgYWxsb3dPdmVyd3JpdGU/OiBib29sZWFuKSB7XG4gIGZvciAobGV0IGogPSBTdHlsaW5nTWFwQXJyYXlJbmRleC5WYWx1ZXNTdGFydFBvc2l0aW9uOyBqIDwgc3R5bGluZ01hcEFyci5sZW5ndGg7XG4gICAgICAgaiArPSBTdHlsaW5nTWFwQXJyYXlJbmRleC5UdXBsZVNpemUpIHtcbiAgICBjb25zdCBwcm9wQXRJbmRleCA9IGdldE1hcFByb3Aoc3R5bGluZ01hcEFyciwgaik7XG4gICAgaWYgKHByb3AgPD0gcHJvcEF0SW5kZXgpIHtcbiAgICAgIGxldCBhcHBsaWVkID0gZmFsc2U7XG4gICAgICBpZiAocHJvcEF0SW5kZXggPT09IHByb3ApIHtcbiAgICAgICAgY29uc3QgdmFsdWVBdEluZGV4ID0gc3R5bGluZ01hcEFycltqXTtcbiAgICAgICAgaWYgKGFsbG93T3ZlcndyaXRlIHx8ICFpc1N0eWxpbmdWYWx1ZURlZmluZWQodmFsdWVBdEluZGV4KSkge1xuICAgICAgICAgIGFwcGxpZWQgPSB0cnVlO1xuICAgICAgICAgIHNldE1hcFZhbHVlKHN0eWxpbmdNYXBBcnIsIGosIHZhbHVlKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYXBwbGllZCA9IHRydWU7XG4gICAgICAgIHN0eWxpbmdNYXBBcnIuc3BsaWNlKGosIDAsIHByb3AsIHZhbHVlKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBhcHBsaWVkO1xuICAgIH1cbiAgfVxuXG4gIHN0eWxpbmdNYXBBcnIucHVzaChwcm9wLCB2YWx1ZSk7XG4gIHJldHVybiB0cnVlO1xufVxuXG4vKipcbiAqIFVzZWQgdG8gY29udmVydCBhIHtrZXk6dmFsdWV9IG1hcCBpbnRvIGEgYFN0eWxpbmdNYXBBcnJheWAgYXJyYXkuXG4gKlxuICogVGhpcyBmdW5jdGlvbiB3aWxsIGVpdGhlciBnZW5lcmF0ZSBhIG5ldyBgU3R5bGluZ01hcEFycmF5YCBpbnN0YW5jZVxuICogb3IgaXQgd2lsbCBwYXRjaCB0aGUgcHJvdmlkZWQgYG5ld1ZhbHVlc2AgbWFwIHZhbHVlIGludG8gYW5cbiAqIGV4aXN0aW5nIGBTdHlsaW5nTWFwQXJyYXlgIHZhbHVlICh0aGlzIG9ubHkgaGFwcGVucyBpZiBgYmluZGluZ1ZhbHVlYFxuICogaXMgYW4gaW5zdGFuY2Ugb2YgYFN0eWxpbmdNYXBBcnJheWApLlxuICpcbiAqIElmIGEgbmV3IGtleS92YWx1ZSBtYXAgaXMgcHJvdmlkZWQgd2l0aCBhbiBvbGQgYFN0eWxpbmdNYXBBcnJheWBcbiAqIHZhbHVlIHRoZW4gYWxsIHByb3BlcnRpZXMgd2lsbCBiZSBvdmVyd3JpdHRlbiB3aXRoIHRoZWlyIG5ld1xuICogdmFsdWVzIG9yIHdpdGggYG51bGxgLiBUaGlzIG1lYW5zIHRoYXQgdGhlIGFycmF5IHdpbGwgbmV2ZXJcbiAqIHNocmluayBpbiBzaXplIChidXQgaXQgd2lsbCBhbHNvIG5vdCBiZSBjcmVhdGVkIGFuZCB0aHJvd25cbiAqIGF3YXkgd2hlbmV2ZXIgdGhlIGB7a2V5OnZhbHVlfWAgbWFwIGVudHJpZXMgY2hhbmdlKS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG5vcm1hbGl6ZUludG9TdHlsaW5nTWFwKFxuICAgIGJpbmRpbmdWYWx1ZTogbnVsbCB8IFN0eWxpbmdNYXBBcnJheSxcbiAgICBuZXdWYWx1ZXM6IHtba2V5OiBzdHJpbmddOiBhbnl9IHwgc3RyaW5nIHwgbnVsbCB8IHVuZGVmaW5lZCxcbiAgICBub3JtYWxpemVQcm9wcz86IGJvb2xlYW4pOiBTdHlsaW5nTWFwQXJyYXkge1xuICBjb25zdCBzdHlsaW5nTWFwQXJyOiBTdHlsaW5nTWFwQXJyYXkgPSBBcnJheS5pc0FycmF5KGJpbmRpbmdWYWx1ZSkgPyBiaW5kaW5nVmFsdWUgOiBbbnVsbF07XG4gIHN0eWxpbmdNYXBBcnJbU3R5bGluZ01hcEFycmF5SW5kZXguUmF3VmFsdWVQb3NpdGlvbl0gPSBuZXdWYWx1ZXMgfHwgbnVsbDtcblxuICAvLyBiZWNhdXNlIHRoZSBuZXcgdmFsdWVzIG1heSBub3QgaW5jbHVkZSBhbGwgdGhlIHByb3BlcnRpZXNcbiAgLy8gdGhhdCB0aGUgb2xkIG9uZXMgaGFkLCBhbGwgdmFsdWVzIGFyZSBzZXQgdG8gYG51bGxgIGJlZm9yZVxuICAvLyB0aGUgbmV3IHZhbHVlcyBhcmUgYXBwbGllZC4gVGhpcyB3YXksIHdoZW4gZmx1c2hlZCwgdGhlXG4gIC8vIHN0eWxpbmcgYWxnb3JpdGhtIGtub3dzIGV4YWN0bHkgd2hhdCBzdHlsZS9jbGFzcyB2YWx1ZXNcbiAgLy8gdG8gcmVtb3ZlIGZyb20gdGhlIGVsZW1lbnQgKHNpbmNlIHRoZXkgYXJlIGBudWxsYCkuXG4gIGZvciAobGV0IGogPSBTdHlsaW5nTWFwQXJyYXlJbmRleC5WYWx1ZXNTdGFydFBvc2l0aW9uOyBqIDwgc3R5bGluZ01hcEFyci5sZW5ndGg7XG4gICAgICAgaiArPSBTdHlsaW5nTWFwQXJyYXlJbmRleC5UdXBsZVNpemUpIHtcbiAgICBzZXRNYXBWYWx1ZShzdHlsaW5nTWFwQXJyLCBqLCBudWxsKTtcbiAgfVxuXG4gIGxldCBwcm9wczogc3RyaW5nW118bnVsbCA9IG51bGw7XG4gIGxldCBtYXA6IHtba2V5OiBzdHJpbmddOiBhbnl9fHVuZGVmaW5lZHxudWxsO1xuICBsZXQgYWxsVmFsdWVzVHJ1ZSA9IGZhbHNlO1xuICBpZiAodHlwZW9mIG5ld1ZhbHVlcyA9PT0gJ3N0cmluZycpIHsgIC8vIFtjbGFzc10gYmluZGluZ3MgYWxsb3cgc3RyaW5nIHZhbHVlc1xuICAgIGlmIChuZXdWYWx1ZXMubGVuZ3RoKSB7XG4gICAgICBwcm9wcyA9IG5ld1ZhbHVlcy5zcGxpdCgvXFxzKy8pO1xuICAgICAgYWxsVmFsdWVzVHJ1ZSA9IHRydWU7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIHByb3BzID0gbmV3VmFsdWVzID8gT2JqZWN0LmtleXMobmV3VmFsdWVzKSA6IG51bGw7XG4gICAgbWFwID0gbmV3VmFsdWVzO1xuICB9XG5cbiAgaWYgKHByb3BzKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwcm9wcy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgcHJvcCA9IHByb3BzW2ldIGFzIHN0cmluZztcbiAgICAgIGNvbnN0IG5ld1Byb3AgPSBub3JtYWxpemVQcm9wcyA/IGh5cGhlbmF0ZShwcm9wKSA6IHByb3A7XG4gICAgICBjb25zdCB2YWx1ZSA9IGFsbFZhbHVlc1RydWUgPyB0cnVlIDogbWFwICFbcHJvcF07XG4gICAgICBhZGRJdGVtVG9TdHlsaW5nTWFwKHN0eWxpbmdNYXBBcnIsIG5ld1Byb3AsIHZhbHVlLCB0cnVlKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gc3R5bGluZ01hcEFycjtcbn1cbiJdfQ==