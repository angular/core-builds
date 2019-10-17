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
// TODO (matsko|AndrewKushnir): refactor this once we figure out how to generate separate
// `input('class') + classMap()` instructions.
export function selectClassBasedInputName(inputs) {
    return inputs.hasOwnProperty('class') ? 'class' : 'className';
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3R5bGluZ191dGlscy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvdXRpbC9zdHlsaW5nX3V0aWxzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQVNBLE9BQU8sRUFBQyxTQUFTLEVBQUMsTUFBTSxXQUFXLENBQUM7QUFFcEMsTUFBTSxDQUFDLElBQU0seUJBQXlCLEdBQUcsT0FBTyxDQUFDO0FBQ2pELE1BQU0sQ0FBQyxJQUFNLHdCQUF3QixHQUFHLENBQUMsQ0FBQztBQUUxQzs7Ozs7OztHQU9HO0FBQ0gsTUFBTSxDQUFDLElBQU0scUJBQXFCLEdBQUcsSUFBSSxDQUFDO0FBRTFDLE1BQU0sQ0FBQyxJQUFNLHFCQUFxQixHQUFHLENBQUMsQ0FBQztBQUV2QyxJQUFNLHFCQUFxQixHQUFHLENBQUMsQ0FBQztBQUVoQyxnRUFBZ0U7QUFDaEUsa0VBQWtFO0FBQ2xFLGtFQUFrRTtBQUNsRSxpRUFBaUU7QUFDakUsMkJBQTJCO0FBQzNCLE1BQU0sQ0FBQyxJQUFNLHdCQUF3QixHQUFHLENBQUcsQ0FBQztBQUU1Qzs7Ozs7OztHQU9HO0FBQ0gsTUFBTSxVQUFVLG9CQUFvQixDQUNoQyxjQUFzQyxFQUFFLGFBQXNCO0lBQ2hFLGNBQWMsR0FBRyxjQUFjLElBQUksb0JBQW9CLEVBQUUsQ0FBQztJQUMxRCxJQUFJLE1BQU0sa0JBQXlCLENBQUM7SUFDcEMsSUFBSSxhQUFhLEVBQUU7UUFDakIsTUFBTSx5QkFBZ0MsQ0FBQztLQUN4QztJQUNELElBQUksY0FBYyxDQUFDLE1BQU0sOEJBQTJDLEVBQUU7UUFDcEUsTUFBTSw4QkFBb0MsQ0FBQztLQUM1QztJQUNELE9BQU87UUFDTCxNQUFNO1FBQ04scUJBQXFCO1FBQ3JCLGNBQWM7S0FDZixDQUFDO0FBQ0osQ0FBQztBQUVELE1BQU0sVUFBVSxvQkFBb0I7SUFDbEMsT0FBTyxDQUFDLEVBQUUsQ0FB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QUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiogQGxpY2Vuc2VcbiogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4qXG4qIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4qIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiovXG5pbXBvcnQge1Byb3BlcnR5QWxpYXNlcywgVE5vZGUsIFROb2RlRmxhZ3N9IGZyb20gJy4uL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge0xTdHlsaW5nRGF0YSwgU3R5bGluZ01hcEFycmF5LCBTdHlsaW5nTWFwQXJyYXlJbmRleCwgVFN0eWxpbmdDb25maWcsIFRTdHlsaW5nQ29udGV4dCwgVFN0eWxpbmdDb250ZXh0SW5kZXgsIFRTdHlsaW5nQ29udGV4dFByb3BDb25maWdGbGFnc30gZnJvbSAnLi4vaW50ZXJmYWNlcy9zdHlsaW5nJztcbmltcG9ydCB7Tk9fQ0hBTkdFfSBmcm9tICcuLi90b2tlbnMnO1xuXG5leHBvcnQgY29uc3QgTUFQX0JBU0VEX0VOVFJZX1BST1BfTkFNRSA9ICdbTUFQXSc7XG5leHBvcnQgY29uc3QgVEVNUExBVEVfRElSRUNUSVZFX0lOREVYID0gMDtcblxuLyoqXG4gKiBEZWZhdWx0IGZhbGxiYWNrIHZhbHVlIGZvciBhIHN0eWxpbmcgYmluZGluZy5cbiAqXG4gKiBBIHZhbHVlIG9mIGBudWxsYCBpcyB1c2VkIGhlcmUgd2hpY2ggc2lnbmFscyB0byB0aGUgc3R5bGluZyBhbGdvcml0aG0gdGhhdFxuICogdGhlIHN0eWxpbmcgdmFsdWUgaXMgbm90IHByZXNlbnQuIFRoaXMgd2F5IGlmIHRoZXJlIGFyZSBubyBvdGhlciB2YWx1ZXNcbiAqIGRldGVjdGVkIHRoZW4gaXQgd2lsbCBiZSByZW1vdmVkIG9uY2UgdGhlIHN0eWxlL2NsYXNzIHByb3BlcnR5IGlzIGRpcnR5IGFuZFxuICogZGlmZmVkIHdpdGhpbiB0aGUgc3R5bGluZyBhbGdvcml0aG0gcHJlc2VudCBpbiBgZmx1c2hTdHlsaW5nYC5cbiAqL1xuZXhwb3J0IGNvbnN0IERFRkFVTFRfQklORElOR19WQUxVRSA9IG51bGw7XG5cbmV4cG9ydCBjb25zdCBERUZBVUxUX0JJTkRJTkdfSU5ERVggPSAwO1xuXG5jb25zdCBERUZBVUxUX1RPVEFMX1NPVVJDRVMgPSAxO1xuXG4vLyBUaGUgZmlyc3QgYml0IHZhbHVlIHJlZmxlY3RzIGEgbWFwLWJhc2VkIGJpbmRpbmcgdmFsdWUncyBiaXQuXG4vLyBUaGUgcmVhc29uIHdoeSBpdCdzIGFsd2F5cyBhY3RpdmF0ZWQgZm9yIGV2ZXJ5IGVudHJ5IGluIHRoZSBtYXBcbi8vIGlzIHNvIHRoYXQgaWYgYW55IG1hcC1iaW5kaW5nIHZhbHVlcyB1cGRhdGUgdGhlbiBhbGwgb3RoZXIgcHJvcFxuLy8gYmFzZWQgYmluZGluZ3Mgd2lsbCBwYXNzIHRoZSBndWFyZCBjaGVjayBhdXRvbWF0aWNhbGx5IHdpdGhvdXRcbi8vIGFueSBleHRyYSBjb2RlIG9yIGZsYWdzLlxuZXhwb3J0IGNvbnN0IERFRkFVTFRfR1VBUkRfTUFTS19WQUxVRSA9IDBiMTtcblxuLyoqXG4gKiBDcmVhdGVzIGEgbmV3IGluc3RhbmNlIG9mIHRoZSBgVFN0eWxpbmdDb250ZXh0YC5cbiAqXG4gKiBUaGUgYFRTdHlsaW5nQ29udGV4dGAgaXMgdXNlZCBhcyBhIG1hbmlmZXN0IG9mIGFsbCBzdHlsZSBvciBhbGwgY2xhc3MgYmluZGluZ3Mgb25cbiAqIGFuIGVsZW1lbnQuIEJlY2F1c2UgaXQgaXMgYSBULWxldmVsIGRhdGEtc3RydWN0dXJlLCBpdCBpcyBvbmx5IGNyZWF0ZWQgb25jZSBwZXJcbiAqIHROb2RlIGZvciBzdHlsZXMgYW5kIGZvciBjbGFzc2VzLiBUaGlzIGZ1bmN0aW9uIGFsbG9jYXRlcyBhIG5ldyBpbnN0YW5jZSBvZiBhXG4gKiBgVFN0eWxpbmdDb250ZXh0YCB3aXRoIHRoZSBpbml0aWFsIHZhbHVlcyAoc2VlIGBpbnRlcmZhY2VzLnRzYCBmb3IgbW9yZSBpbmZvKS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFsbG9jVFN0eWxpbmdDb250ZXh0KFxuICAgIGluaXRpYWxTdHlsaW5nOiBTdHlsaW5nTWFwQXJyYXkgfCBudWxsLCBoYXNEaXJlY3RpdmVzOiBib29sZWFuKTogVFN0eWxpbmdDb250ZXh0IHtcbiAgaW5pdGlhbFN0eWxpbmcgPSBpbml0aWFsU3R5bGluZyB8fCBhbGxvY1N0eWxpbmdNYXBBcnJheSgpO1xuICBsZXQgY29uZmlnID0gVFN0eWxpbmdDb25maWcuSW5pdGlhbDtcbiAgaWYgKGhhc0RpcmVjdGl2ZXMpIHtcbiAgICBjb25maWcgfD0gVFN0eWxpbmdDb25maWcuSGFzRGlyZWN0aXZlcztcbiAgfVxuICBpZiAoaW5pdGlhbFN0eWxpbmcubGVuZ3RoID4gU3R5bGluZ01hcEFycmF5SW5kZXguVmFsdWVzU3RhcnRQb3NpdGlvbikge1xuICAgIGNvbmZpZyB8PSBUU3R5bGluZ0NvbmZpZy5IYXNJbml0aWFsU3R5bGluZztcbiAgfVxuICByZXR1cm4gW1xuICAgIGNvbmZpZywgICAgICAgICAgICAgICAgIC8vIDEpIGNvbmZpZyBmb3IgdGhlIHN0eWxpbmcgY29udGV4dFxuICAgIERFRkFVTFRfVE9UQUxfU09VUkNFUywgIC8vIDIpIHRvdGFsIGFtb3VudCBvZiBzdHlsaW5nIHNvdXJjZXMgKHRlbXBsYXRlLCBkaXJlY3RpdmVzLCBldGMuLi4pXG4gICAgaW5pdGlhbFN0eWxpbmcsICAgICAgICAgLy8gMykgaW5pdGlhbCBzdHlsaW5nIHZhbHVlc1xuICBdO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYWxsb2NTdHlsaW5nTWFwQXJyYXkoKTogU3R5bGluZ01hcEFycmF5IHtcbiAgcmV0dXJuIFsnJ107XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRDb25maWcoY29udGV4dDogVFN0eWxpbmdDb250ZXh0KSB7XG4gIHJldHVybiBjb250ZXh0W1RTdHlsaW5nQ29udGV4dEluZGV4LkNvbmZpZ1Bvc2l0aW9uXTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGhhc0NvbmZpZyhjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQsIGZsYWc6IFRTdHlsaW5nQ29uZmlnKSB7XG4gIHJldHVybiAoZ2V0Q29uZmlnKGNvbnRleHQpICYgZmxhZykgIT09IDA7XG59XG5cbi8qKlxuICogRGV0ZXJtaW5lcyB3aGV0aGVyIG9yIG5vdCB0byBhcHBseSBzdHlsZXMvY2xhc3NlcyBkaXJlY3RseSBvciB2aWEgY29udGV4dCByZXNvbHV0aW9uLlxuICpcbiAqIFRoZXJlIGFyZSB0aHJlZSBjYXNlcyB0aGF0IGFyZSBtYXRjaGVkIGhlcmU6XG4gKiAxLiB0aGVyZSBhcmUgbm8gZGlyZWN0aXZlcyBwcmVzZW50IEFORCBuZ0Rldk1vZGUgaXMgZmFsc3lcbiAqIDIuIGNvbnRleHQgaXMgbG9ja2VkIGZvciB0ZW1wbGF0ZSBvciBob3N0IGJpbmRpbmdzIChkZXBlbmRpbmcgb24gYGhvc3RCaW5kaW5nc01vZGVgKVxuICogMy4gVGhlcmUgYXJlIG5vIGNvbGxpc2lvbnMgKGkuZS4gcHJvcGVydGllcyB3aXRoIG1vcmUgdGhhbiBvbmUgYmluZGluZykgYWNyb3NzIG11bHRpcGxlXG4gKiAgICBzb3VyY2VzIChpLmUuIHRlbXBsYXRlICsgZGlyZWN0aXZlLCBkaXJlY3RpdmUgKyBkaXJlY3RpdmUsIGRpcmVjdGl2ZSArIGNvbXBvbmVudClcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFsbG93RGlyZWN0U3R5bGluZyhjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQsIGhvc3RCaW5kaW5nc01vZGU6IGJvb2xlYW4pOiBib29sZWFuIHtcbiAgbGV0IGFsbG93ID0gZmFsc2U7XG4gIGNvbnN0IGNvbmZpZyA9IGdldENvbmZpZyhjb250ZXh0KTtcbiAgY29uc3QgY29udGV4dElzTG9ja2VkID0gKGNvbmZpZyAmIGdldExvY2tlZENvbmZpZyhob3N0QmluZGluZ3NNb2RlKSkgIT09IDA7XG4gIGNvbnN0IGhhc05vRGlyZWN0aXZlcyA9IChjb25maWcgJiBUU3R5bGluZ0NvbmZpZy5IYXNEaXJlY3RpdmVzKSA9PT0gMDtcblxuICAvLyBpZiBubyBkaXJlY3RpdmVzIGFyZSBwcmVzZW50IHRoZW4gd2UgZG8gbm90IG5lZWQgcG9wdWxhdGUgYSBjb250ZXh0IGF0IGFsbC4gVGhpc1xuICAvLyBpcyBiZWNhdXNlIGR1cGxpY2F0ZSBwcm9wIGJpbmRpbmdzIGNhbm5vdCBiZSByZWdpc3RlcmVkIHRocm91Z2ggdGhlIHRlbXBsYXRlLiBJZlxuICAvLyBhbmQgd2hlbiB0aGlzIGhhcHBlbnMgd2UgY2FuIHNhZmVseSBhcHBseSB0aGUgdmFsdWUgZGlyZWN0bHkgd2l0aG91dCBjb250ZXh0XG4gIC8vIHJlc29sdXRpb24uLi5cbiAgaWYgKGhhc05vRGlyZWN0aXZlcykge1xuICAgIC8vIGBuZ0Rldk1vZGVgIGlzIHJlcXVpcmVkIHRvIGJlIGNoZWNrZWQgaGVyZSBiZWNhdXNlIHRlc3RzL2RlYnVnZ2luZyByZWx5IG9uIHRoZSBjb250ZXh0IGJlaW5nXG4gICAgLy8gcG9wdWxhdGVkLiBJZiB0aGluZ3MgYXJlIGluIHByb2R1Y3Rpb24gbW9kZSB0aGVuIHRoZXJlIGlzIG5vIG5lZWQgdG8gYnVpbGQgYSBjb250ZXh0XG4gICAgLy8gdGhlcmVmb3JlIHRoZSBkaXJlY3QgYXBwbHkgY2FuIGJlIGFsbG93ZWQgKGV2ZW4gb24gdGhlIGZpcnN0IHVwZGF0ZSkuXG4gICAgYWxsb3cgPSBuZ0Rldk1vZGUgPyBjb250ZXh0SXNMb2NrZWQgOiB0cnVlO1xuICB9IGVsc2UgaWYgKGNvbnRleHRJc0xvY2tlZCkge1xuICAgIGNvbnN0IGhhc05vQ29sbGlzaW9ucyA9IChjb25maWcgJiBUU3R5bGluZ0NvbmZpZy5IYXNDb2xsaXNpb25zKSA9PT0gMDtcbiAgICBjb25zdCBoYXNPbmx5TWFwc09yT25seVByb3BzID1cbiAgICAgICAgKGNvbmZpZyAmIFRTdHlsaW5nQ29uZmlnLkhhc1Byb3BBbmRNYXBCaW5kaW5ncykgIT09IFRTdHlsaW5nQ29uZmlnLkhhc1Byb3BBbmRNYXBCaW5kaW5ncztcbiAgICBhbGxvdyA9IGhhc05vQ29sbGlzaW9ucyAmJiBoYXNPbmx5TWFwc09yT25seVByb3BzO1xuICB9XG5cbiAgcmV0dXJuIGFsbG93O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2V0Q29uZmlnKGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCwgdmFsdWU6IFRTdHlsaW5nQ29uZmlnKTogdm9pZCB7XG4gIGNvbnRleHRbVFN0eWxpbmdDb250ZXh0SW5kZXguQ29uZmlnUG9zaXRpb25dID0gdmFsdWU7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwYXRjaENvbmZpZyhjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQsIGZsYWc6IFRTdHlsaW5nQ29uZmlnKTogdm9pZCB7XG4gIGNvbnRleHRbVFN0eWxpbmdDb250ZXh0SW5kZXguQ29uZmlnUG9zaXRpb25dIHw9IGZsYWc7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRQcm9wKGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCwgaW5kZXg6IG51bWJlcik6IHN0cmluZyB7XG4gIHJldHVybiBjb250ZXh0W2luZGV4ICsgVFN0eWxpbmdDb250ZXh0SW5kZXguUHJvcE9mZnNldF0gYXMgc3RyaW5nO1xufVxuXG5mdW5jdGlvbiBnZXRQcm9wQ29uZmlnKGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCwgaW5kZXg6IG51bWJlcik6IG51bWJlciB7XG4gIHJldHVybiAoY29udGV4dFtpbmRleCArIFRTdHlsaW5nQ29udGV4dEluZGV4LkNvbmZpZ09mZnNldF0gYXMgbnVtYmVyKSAmXG4gICAgICBUU3R5bGluZ0NvbnRleHRQcm9wQ29uZmlnRmxhZ3MuTWFzaztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzU2FuaXRpemF0aW9uUmVxdWlyZWQoY29udGV4dDogVFN0eWxpbmdDb250ZXh0LCBpbmRleDogbnVtYmVyKTogYm9vbGVhbiB7XG4gIHJldHVybiAoZ2V0UHJvcENvbmZpZyhjb250ZXh0LCBpbmRleCkgJiBUU3R5bGluZ0NvbnRleHRQcm9wQ29uZmlnRmxhZ3MuU2FuaXRpemF0aW9uUmVxdWlyZWQpICE9PVxuICAgICAgMDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEd1YXJkTWFzayhcbiAgICBjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQsIGluZGV4OiBudW1iZXIsIGlzSG9zdEJpbmRpbmc6IGJvb2xlYW4pOiBudW1iZXIge1xuICBjb25zdCBwb3NpdGlvbiA9IGluZGV4ICsgKGlzSG9zdEJpbmRpbmcgPyBUU3R5bGluZ0NvbnRleHRJbmRleC5Ib3N0QmluZGluZ3NCaXRHdWFyZE9mZnNldCA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFRTdHlsaW5nQ29udGV4dEluZGV4LlRlbXBsYXRlQml0R3VhcmRPZmZzZXQpO1xuICByZXR1cm4gY29udGV4dFtwb3NpdGlvbl0gYXMgbnVtYmVyO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2V0R3VhcmRNYXNrKFxuICAgIGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCwgaW5kZXg6IG51bWJlciwgbWFza1ZhbHVlOiBudW1iZXIsIGlzSG9zdEJpbmRpbmc6IGJvb2xlYW4pIHtcbiAgY29uc3QgcG9zaXRpb24gPSBpbmRleCArIChpc0hvc3RCaW5kaW5nID8gVFN0eWxpbmdDb250ZXh0SW5kZXguSG9zdEJpbmRpbmdzQml0R3VhcmRPZmZzZXQgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBUU3R5bGluZ0NvbnRleHRJbmRleC5UZW1wbGF0ZUJpdEd1YXJkT2Zmc2V0KTtcbiAgY29udGV4dFtwb3NpdGlvbl0gPSBtYXNrVmFsdWU7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRWYWx1ZXNDb3VudChjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQpOiBudW1iZXIge1xuICByZXR1cm4gZ2V0VG90YWxTb3VyY2VzKGNvbnRleHQpICsgMTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFRvdGFsU291cmNlcyhjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQpOiBudW1iZXIge1xuICByZXR1cm4gY29udGV4dFtUU3R5bGluZ0NvbnRleHRJbmRleC5Ub3RhbFNvdXJjZXNQb3NpdGlvbl07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRCaW5kaW5nVmFsdWUoY29udGV4dDogVFN0eWxpbmdDb250ZXh0LCBpbmRleDogbnVtYmVyLCBvZmZzZXQ6IG51bWJlcikge1xuICByZXR1cm4gY29udGV4dFtpbmRleCArIFRTdHlsaW5nQ29udGV4dEluZGV4LkJpbmRpbmdzU3RhcnRPZmZzZXQgKyBvZmZzZXRdIGFzIG51bWJlciB8IHN0cmluZztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldERlZmF1bHRWYWx1ZShjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQsIGluZGV4OiBudW1iZXIpOiBzdHJpbmd8Ym9vbGVhbnxudWxsIHtcbiAgcmV0dXJuIGNvbnRleHRbaW5kZXggKyBUU3R5bGluZ0NvbnRleHRJbmRleC5CaW5kaW5nc1N0YXJ0T2Zmc2V0ICsgZ2V0VG90YWxTb3VyY2VzKGNvbnRleHQpXSBhc1xuICAgICAgICAgICAgIHN0cmluZyB8XG4gICAgICBib29sZWFuIHwgbnVsbDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNldERlZmF1bHRWYWx1ZShcbiAgICBjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQsIGluZGV4OiBudW1iZXIsIHZhbHVlOiBzdHJpbmcgfCBib29sZWFuIHwgbnVsbCkge1xuICByZXR1cm4gY29udGV4dFtpbmRleCArIFRTdHlsaW5nQ29udGV4dEluZGV4LkJpbmRpbmdzU3RhcnRPZmZzZXQgKyBnZXRUb3RhbFNvdXJjZXMoY29udGV4dCldID1cbiAgICAgICAgICAgICB2YWx1ZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNldFZhbHVlKGRhdGE6IExTdHlsaW5nRGF0YSwgYmluZGluZ0luZGV4OiBudW1iZXIsIHZhbHVlOiBhbnkpIHtcbiAgZGF0YVtiaW5kaW5nSW5kZXhdID0gdmFsdWU7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRWYWx1ZTxUID0gYW55PihkYXRhOiBMU3R5bGluZ0RhdGEsIGJpbmRpbmdJbmRleDogbnVtYmVyKTogVHxudWxsIHtcbiAgcmV0dXJuIGJpbmRpbmdJbmRleCA+IDAgPyBkYXRhW2JpbmRpbmdJbmRleF0gYXMgVCA6IG51bGw7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBsb2NrQ29udGV4dChjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQsIGhvc3RCaW5kaW5nc01vZGU6IGJvb2xlYW4pOiB2b2lkIHtcbiAgcGF0Y2hDb25maWcoY29udGV4dCwgZ2V0TG9ja2VkQ29uZmlnKGhvc3RCaW5kaW5nc01vZGUpKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzQ29udGV4dExvY2tlZChjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQsIGhvc3RCaW5kaW5nc01vZGU6IGJvb2xlYW4pOiBib29sZWFuIHtcbiAgcmV0dXJuIGhhc0NvbmZpZyhjb250ZXh0LCBnZXRMb2NrZWRDb25maWcoaG9zdEJpbmRpbmdzTW9kZSkpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0TG9ja2VkQ29uZmlnKGhvc3RCaW5kaW5nc01vZGU6IGJvb2xlYW4pIHtcbiAgcmV0dXJuIGhvc3RCaW5kaW5nc01vZGUgPyBUU3R5bGluZ0NvbmZpZy5Ib3N0QmluZGluZ3NMb2NrZWQgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFRTdHlsaW5nQ29uZmlnLlRlbXBsYXRlQmluZGluZ3NMb2NrZWQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRQcm9wVmFsdWVzU3RhcnRQb3NpdGlvbihjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQpIHtcbiAgbGV0IHN0YXJ0UG9zaXRpb24gPSBUU3R5bGluZ0NvbnRleHRJbmRleC5WYWx1ZXNTdGFydFBvc2l0aW9uO1xuICBpZiAoaGFzQ29uZmlnKGNvbnRleHQsIFRTdHlsaW5nQ29uZmlnLkhhc01hcEJpbmRpbmdzKSkge1xuICAgIHN0YXJ0UG9zaXRpb24gKz0gVFN0eWxpbmdDb250ZXh0SW5kZXguQmluZGluZ3NTdGFydE9mZnNldCArIGdldFZhbHVlc0NvdW50KGNvbnRleHQpO1xuICB9XG4gIHJldHVybiBzdGFydFBvc2l0aW9uO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaGFzVmFsdWVDaGFuZ2VkKFxuICAgIGE6IE5PX0NIQU5HRSB8IFN0eWxpbmdNYXBBcnJheSB8IG51bWJlciB8IFN0cmluZyB8IHN0cmluZyB8IG51bGwgfCBib29sZWFuIHwgdW5kZWZpbmVkIHwge30sXG4gICAgYjogTk9fQ0hBTkdFIHwgU3R5bGluZ01hcEFycmF5IHwgbnVtYmVyIHwgU3RyaW5nIHwgc3RyaW5nIHwgbnVsbCB8IGJvb2xlYW4gfCB1bmRlZmluZWQgfFxuICAgICAgICB7fSk6IGJvb2xlYW4ge1xuICBpZiAoYiA9PT0gTk9fQ0hBTkdFKSByZXR1cm4gZmFsc2U7XG5cbiAgY29uc3QgY29tcGFyZVZhbHVlQSA9IEFycmF5LmlzQXJyYXkoYSkgPyBhW1N0eWxpbmdNYXBBcnJheUluZGV4LlJhd1ZhbHVlUG9zaXRpb25dIDogYTtcbiAgY29uc3QgY29tcGFyZVZhbHVlQiA9IEFycmF5LmlzQXJyYXkoYikgPyBiW1N0eWxpbmdNYXBBcnJheUluZGV4LlJhd1ZhbHVlUG9zaXRpb25dIDogYjtcbiAgcmV0dXJuICFPYmplY3QuaXMoY29tcGFyZVZhbHVlQSwgY29tcGFyZVZhbHVlQik7XG59XG5cbi8qKlxuICogRGV0ZXJtaW5lcyB3aGV0aGVyIHRoZSBwcm92aWRlZCBzdHlsaW5nIHZhbHVlIGlzIHRydXRoeSBvciBmYWxzeS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzU3R5bGluZ1ZhbHVlRGVmaW5lZDxUIGV4dGVuZHMgc3RyaW5nfG51bWJlcnx7fXxudWxsPih2YWx1ZTogVCk6XG4gICAgdmFsdWUgaXMgTm9uTnVsbGFibGU8VD4ge1xuICAvLyB0aGUgcmVhc29uIHdoeSBudWxsIGlzIGNvbXBhcmVkIGFnYWluc3QgaXMgYmVjYXVzZVxuICAvLyBhIENTUyBjbGFzcyB2YWx1ZSB0aGF0IGlzIHNldCB0byBgZmFsc2VgIG11c3QgYmVcbiAgLy8gcmVzcGVjdGVkIChvdGhlcndpc2UgaXQgd291bGQgYmUgdHJlYXRlZCBhcyBmYWxzeSkuXG4gIC8vIEVtcHR5IHN0cmluZyB2YWx1ZXMgYXJlIGJlY2F1c2UgZGV2ZWxvcGVycyB1c3VhbGx5XG4gIC8vIHNldCBhIHZhbHVlIHRvIGFuIGVtcHR5IHN0cmluZyB0byByZW1vdmUgaXQuXG4gIHJldHVybiB2YWx1ZSAhPSBudWxsICYmIHZhbHVlICE9PSAnJztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNvbmNhdFN0cmluZyhhOiBzdHJpbmcsIGI6IHN0cmluZywgc2VwYXJhdG9yID0gJyAnKTogc3RyaW5nIHtcbiAgcmV0dXJuIGEgKyAoKGIubGVuZ3RoICYmIGEubGVuZ3RoKSA/IHNlcGFyYXRvciA6ICcnKSArIGI7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBoeXBoZW5hdGUodmFsdWU6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiB2YWx1ZS5yZXBsYWNlKC9bYS16XVtBLVpdL2csIHYgPT4gdi5jaGFyQXQoMCkgKyAnLScgKyB2LmNoYXJBdCgxKSkudG9Mb3dlckNhc2UoKTtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIGFuIGluc3RhbmNlIG9mIGBTdHlsaW5nTWFwQXJyYXlgLlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gaXMgZGVzaWduZWQgdG8gZmluZCBhbiBpbnN0YW5jZSBvZiBgU3R5bGluZ01hcEFycmF5YCBpbiBjYXNlIGl0IGlzIHN0b3JlZFxuICogaW5zaWRlIG9mIGFuIGluc3RhbmNlIG9mIGBUU3R5bGluZ0NvbnRleHRgLiBXaGVuIGEgc3R5bGluZyBjb250ZXh0IGlzIGNyZWF0ZWQgaXRcbiAqIHdpbGwgY29weSBvdmVyIGFuIGluaXRpYWwgc3R5bGluZyB2YWx1ZXMgZnJvbSB0aGUgdE5vZGUgKHdoaWNoIGFyZSBzdG9yZWQgYXMgYVxuICogYFN0eWxpbmdNYXBBcnJheWAgb24gdGhlIGB0Tm9kZS5jbGFzc2VzYCBvciBgdE5vZGUuc3R5bGVzYCB2YWx1ZXMpLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0U3R5bGluZ01hcEFycmF5KHZhbHVlOiBUU3R5bGluZ0NvbnRleHQgfCBTdHlsaW5nTWFwQXJyYXkgfCBudWxsKTpcbiAgICBTdHlsaW5nTWFwQXJyYXl8bnVsbCB7XG4gIHJldHVybiBpc1N0eWxpbmdDb250ZXh0KHZhbHVlKSA/XG4gICAgICAodmFsdWUgYXMgVFN0eWxpbmdDb250ZXh0KVtUU3R5bGluZ0NvbnRleHRJbmRleC5Jbml0aWFsU3R5bGluZ1ZhbHVlUG9zaXRpb25dIDpcbiAgICAgIHZhbHVlIGFzIFN0eWxpbmdNYXBBcnJheTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzU3R5bGluZ0NvbnRleHQodmFsdWU6IGFueSk6IGJvb2xlYW4ge1xuICAvLyB0aGUgU3R5bGluZ01hcEFycmF5IGlzIGluIHRoZSBmb3JtYXQgb2YgW2luaXRpYWwsIHByb3AsIHN0cmluZywgcHJvcCwgc3RyaW5nXVxuICAvLyBhbmQgdGhpcyBpcyB0aGUgZGVmaW5pbmcgdmFsdWUgdG8gZGlzdGluZ3Vpc2ggYmV0d2VlbiBhcnJheXNcbiAgcmV0dXJuIEFycmF5LmlzQXJyYXkodmFsdWUpICYmIHZhbHVlLmxlbmd0aCA+PSBUU3R5bGluZ0NvbnRleHRJbmRleC5WYWx1ZXNTdGFydFBvc2l0aW9uICYmXG4gICAgICB0eXBlb2YgdmFsdWVbMV0gIT09ICdzdHJpbmcnO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNTdHlsaW5nTWFwQXJyYXkodmFsdWU6IFRTdHlsaW5nQ29udGV4dCB8IFN0eWxpbmdNYXBBcnJheSB8IG51bGwpOiBib29sZWFuIHtcbiAgLy8gdGhlIFN0eWxpbmdNYXBBcnJheSBpcyBpbiB0aGUgZm9ybWF0IG9mIFtpbml0aWFsLCBwcm9wLCBzdHJpbmcsIHByb3AsIHN0cmluZ11cbiAgLy8gYW5kIHRoaXMgaXMgdGhlIGRlZmluaW5nIHZhbHVlIHRvIGRpc3Rpbmd1aXNoIGJldHdlZW4gYXJyYXlzXG4gIHJldHVybiBBcnJheS5pc0FycmF5KHZhbHVlKSAmJlxuICAgICAgKHR5cGVvZih2YWx1ZSBhcyBTdHlsaW5nTWFwQXJyYXkpW1N0eWxpbmdNYXBBcnJheUluZGV4LlZhbHVlc1N0YXJ0UG9zaXRpb25dID09PSAnc3RyaW5nJyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRJbml0aWFsU3R5bGluZ1ZhbHVlKGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCB8IFN0eWxpbmdNYXBBcnJheSB8IG51bGwpOiBzdHJpbmcge1xuICBjb25zdCBtYXAgPSBnZXRTdHlsaW5nTWFwQXJyYXkoY29udGV4dCk7XG4gIHJldHVybiBtYXAgJiYgKG1hcFtTdHlsaW5nTWFwQXJyYXlJbmRleC5SYXdWYWx1ZVBvc2l0aW9uXSBhcyBzdHJpbmcgfCBudWxsKSB8fCAnJztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGhhc0NsYXNzSW5wdXQodE5vZGU6IFROb2RlKSB7XG4gIHJldHVybiAodE5vZGUuZmxhZ3MgJiBUTm9kZUZsYWdzLmhhc0NsYXNzSW5wdXQpICE9PSAwO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaGFzU3R5bGVJbnB1dCh0Tm9kZTogVE5vZGUpIHtcbiAgcmV0dXJuICh0Tm9kZS5mbGFncyAmIFROb2RlRmxhZ3MuaGFzU3R5bGVJbnB1dCkgIT09IDA7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRNYXBQcm9wKG1hcDogU3R5bGluZ01hcEFycmF5LCBpbmRleDogbnVtYmVyKTogc3RyaW5nIHtcbiAgcmV0dXJuIG1hcFtpbmRleCArIFN0eWxpbmdNYXBBcnJheUluZGV4LlByb3BPZmZzZXRdIGFzIHN0cmluZztcbn1cblxuY29uc3QgTUFQX0RJUlRZX1ZBTFVFID1cbiAgICB0eXBlb2YgbmdEZXZNb2RlICE9PSAndW5kZWZpbmVkJyAmJiBuZ0Rldk1vZGUgPyB7fSA6IHtNQVBfRElSVFlfVkFMVUU6IHRydWV9O1xuXG5leHBvcnQgZnVuY3Rpb24gc2V0TWFwQXNEaXJ0eShtYXA6IFN0eWxpbmdNYXBBcnJheSk6IHZvaWQge1xuICBtYXBbU3R5bGluZ01hcEFycmF5SW5kZXguUmF3VmFsdWVQb3NpdGlvbl0gPSBNQVBfRElSVFlfVkFMVUU7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXRNYXBWYWx1ZShcbiAgICBtYXA6IFN0eWxpbmdNYXBBcnJheSwgaW5kZXg6IG51bWJlciwgdmFsdWU6IHN0cmluZyB8IGJvb2xlYW4gfCBudWxsKTogdm9pZCB7XG4gIG1hcFtpbmRleCArIFN0eWxpbmdNYXBBcnJheUluZGV4LlZhbHVlT2Zmc2V0XSA9IHZhbHVlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0TWFwVmFsdWUobWFwOiBTdHlsaW5nTWFwQXJyYXksIGluZGV4OiBudW1iZXIpOiBzdHJpbmd8bnVsbCB7XG4gIHJldHVybiBtYXBbaW5kZXggKyBTdHlsaW5nTWFwQXJyYXlJbmRleC5WYWx1ZU9mZnNldF0gYXMgc3RyaW5nIHwgbnVsbDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGZvcmNlQ2xhc3Nlc0FzU3RyaW5nKGNsYXNzZXM6IHN0cmluZyB8IHtba2V5OiBzdHJpbmddOiBhbnl9IHwgbnVsbCB8IHVuZGVmaW5lZCk6XG4gICAgc3RyaW5nIHtcbiAgaWYgKGNsYXNzZXMgJiYgdHlwZW9mIGNsYXNzZXMgIT09ICdzdHJpbmcnKSB7XG4gICAgY2xhc3NlcyA9IE9iamVjdC5rZXlzKGNsYXNzZXMpLmpvaW4oJyAnKTtcbiAgfVxuICByZXR1cm4gKGNsYXNzZXMgYXMgc3RyaW5nKSB8fCAnJztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGZvcmNlU3R5bGVzQXNTdHJpbmcoc3R5bGVzOiB7W2tleTogc3RyaW5nXTogYW55fSB8IG51bGwgfCB1bmRlZmluZWQpOiBzdHJpbmcge1xuICBsZXQgc3RyID0gJyc7XG4gIGlmIChzdHlsZXMpIHtcbiAgICBjb25zdCBwcm9wcyA9IE9iamVjdC5rZXlzKHN0eWxlcyk7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwcm9wcy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgcHJvcCA9IHByb3BzW2ldO1xuICAgICAgc3RyID0gY29uY2F0U3RyaW5nKHN0ciwgYCR7cHJvcH06JHtzdHlsZXNbcHJvcF19YCwgJzsnKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHN0cjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzSG9zdFN0eWxpbmdBY3RpdmUoZGlyZWN0aXZlT3JTb3VyY2VJZDogbnVtYmVyKTogYm9vbGVhbiB7XG4gIHJldHVybiBkaXJlY3RpdmVPclNvdXJjZUlkICE9PSBURU1QTEFURV9ESVJFQ1RJVkVfSU5ERVg7XG59XG5cbi8qKlxuICogQ29udmVydHMgdGhlIHByb3ZpZGVkIHN0eWxpbmcgbWFwIGFycmF5IGludG8gYSBzdHJpbmcuXG4gKlxuICogQ2xhc3NlcyA9PiBgb25lIHR3byB0aHJlZWBcbiAqIFN0eWxlcyA9PiBgcHJvcDp2YWx1ZTsgcHJvcDI6dmFsdWUyYFxuICovXG5leHBvcnQgZnVuY3Rpb24gc3R5bGluZ01hcFRvU3RyaW5nKG1hcDogU3R5bGluZ01hcEFycmF5LCBpc0NsYXNzQmFzZWQ6IGJvb2xlYW4pOiBzdHJpbmcge1xuICBsZXQgc3RyID0gJyc7XG4gIGZvciAobGV0IGkgPSBTdHlsaW5nTWFwQXJyYXlJbmRleC5WYWx1ZXNTdGFydFBvc2l0aW9uOyBpIDwgbWFwLmxlbmd0aDtcbiAgICAgICBpICs9IFN0eWxpbmdNYXBBcnJheUluZGV4LlR1cGxlU2l6ZSkge1xuICAgIGNvbnN0IHByb3AgPSBnZXRNYXBQcm9wKG1hcCwgaSk7XG4gICAgY29uc3QgdmFsdWUgPSBnZXRNYXBWYWx1ZShtYXAsIGkpIGFzIHN0cmluZztcbiAgICBjb25zdCBhdHRyVmFsdWUgPSBjb25jYXRTdHJpbmcocHJvcCwgaXNDbGFzc0Jhc2VkID8gJycgOiB2YWx1ZSwgJzonKTtcbiAgICBzdHIgPSBjb25jYXRTdHJpbmcoc3RyLCBhdHRyVmFsdWUsIGlzQ2xhc3NCYXNlZCA/ICcgJyA6ICc7ICcpO1xuICB9XG4gIHJldHVybiBzdHI7XG59XG5cbi8qKlxuICogQ29udmVydHMgdGhlIHByb3ZpZGVkIHN0eWxpbmcgbWFwIGFycmF5IGludG8gYSBrZXkgdmFsdWUgbWFwLlxuICovXG5leHBvcnQgZnVuY3Rpb24gc3R5bGluZ01hcFRvU3RyaW5nTWFwKG1hcDogU3R5bGluZ01hcEFycmF5IHwgbnVsbCk6IHtba2V5OiBzdHJpbmddOiBhbnl9IHtcbiAgbGV0IHN0cmluZ01hcDoge1trZXk6IHN0cmluZ106IGFueX0gPSB7fTtcbiAgaWYgKG1hcCkge1xuICAgIGZvciAobGV0IGkgPSBTdHlsaW5nTWFwQXJyYXlJbmRleC5WYWx1ZXNTdGFydFBvc2l0aW9uOyBpIDwgbWFwLmxlbmd0aDtcbiAgICAgICAgIGkgKz0gU3R5bGluZ01hcEFycmF5SW5kZXguVHVwbGVTaXplKSB7XG4gICAgICBjb25zdCBwcm9wID0gZ2V0TWFwUHJvcChtYXAsIGkpO1xuICAgICAgY29uc3QgdmFsdWUgPSBnZXRNYXBWYWx1ZShtYXAsIGkpIGFzIHN0cmluZztcbiAgICAgIHN0cmluZ01hcFtwcm9wXSA9IHZhbHVlO1xuICAgIH1cbiAgfVxuICByZXR1cm4gc3RyaW5nTWFwO1xufVxuXG4vKipcbiAqIEluc2VydHMgdGhlIHByb3ZpZGVkIGl0ZW0gaW50byB0aGUgcHJvdmlkZWQgc3R5bGluZyBhcnJheSBhdCB0aGUgcmlnaHQgc3BvdC5cbiAqXG4gKiBUaGUgYFN0eWxpbmdNYXBBcnJheWAgdHlwZSBpcyBhIHNvcnRlZCBrZXkvdmFsdWUgYXJyYXkgb2YgZW50cmllcy4gVGhpcyBtZWFuc1xuICogdGhhdCB3aGVuIGEgbmV3IGVudHJ5IGlzIGluc2VydGVkIGl0IG11c3QgYmUgcGxhY2VkIGF0IHRoZSByaWdodCBzcG90IGluIHRoZVxuICogYXJyYXkuIFRoaXMgZnVuY3Rpb24gZmlndXJlcyBvdXQgZXhhY3RseSB3aGVyZSB0byBwbGFjZSBpdC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFkZEl0ZW1Ub1N0eWxpbmdNYXAoXG4gICAgc3R5bGluZ01hcEFycjogU3R5bGluZ01hcEFycmF5LCBwcm9wOiBzdHJpbmcsIHZhbHVlOiBzdHJpbmcgfCBib29sZWFuIHwgbnVsbCxcbiAgICBhbGxvd092ZXJ3cml0ZT86IGJvb2xlYW4pIHtcbiAgZm9yIChsZXQgaiA9IFN0eWxpbmdNYXBBcnJheUluZGV4LlZhbHVlc1N0YXJ0UG9zaXRpb247IGogPCBzdHlsaW5nTWFwQXJyLmxlbmd0aDtcbiAgICAgICBqICs9IFN0eWxpbmdNYXBBcnJheUluZGV4LlR1cGxlU2l6ZSkge1xuICAgIGNvbnN0IHByb3BBdEluZGV4ID0gZ2V0TWFwUHJvcChzdHlsaW5nTWFwQXJyLCBqKTtcbiAgICBpZiAocHJvcCA8PSBwcm9wQXRJbmRleCkge1xuICAgICAgbGV0IGFwcGxpZWQgPSBmYWxzZTtcbiAgICAgIGlmIChwcm9wQXRJbmRleCA9PT0gcHJvcCkge1xuICAgICAgICBjb25zdCB2YWx1ZUF0SW5kZXggPSBzdHlsaW5nTWFwQXJyW2pdO1xuICAgICAgICBpZiAoYWxsb3dPdmVyd3JpdGUgfHwgIWlzU3R5bGluZ1ZhbHVlRGVmaW5lZCh2YWx1ZUF0SW5kZXgpKSB7XG4gICAgICAgICAgYXBwbGllZCA9IHRydWU7XG4gICAgICAgICAgc2V0TWFwVmFsdWUoc3R5bGluZ01hcEFyciwgaiwgdmFsdWUpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBhcHBsaWVkID0gdHJ1ZTtcbiAgICAgICAgc3R5bGluZ01hcEFyci5zcGxpY2UoaiwgMCwgcHJvcCwgdmFsdWUpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGFwcGxpZWQ7XG4gICAgfVxuICB9XG5cbiAgc3R5bGluZ01hcEFyci5wdXNoKHByb3AsIHZhbHVlKTtcbiAgcmV0dXJuIHRydWU7XG59XG5cbi8qKlxuICogVXNlZCB0byBjb252ZXJ0IGEge2tleTp2YWx1ZX0gbWFwIGludG8gYSBgU3R5bGluZ01hcEFycmF5YCBhcnJheS5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIHdpbGwgZWl0aGVyIGdlbmVyYXRlIGEgbmV3IGBTdHlsaW5nTWFwQXJyYXlgIGluc3RhbmNlXG4gKiBvciBpdCB3aWxsIHBhdGNoIHRoZSBwcm92aWRlZCBgbmV3VmFsdWVzYCBtYXAgdmFsdWUgaW50byBhblxuICogZXhpc3RpbmcgYFN0eWxpbmdNYXBBcnJheWAgdmFsdWUgKHRoaXMgb25seSBoYXBwZW5zIGlmIGBiaW5kaW5nVmFsdWVgXG4gKiBpcyBhbiBpbnN0YW5jZSBvZiBgU3R5bGluZ01hcEFycmF5YCkuXG4gKlxuICogSWYgYSBuZXcga2V5L3ZhbHVlIG1hcCBpcyBwcm92aWRlZCB3aXRoIGFuIG9sZCBgU3R5bGluZ01hcEFycmF5YFxuICogdmFsdWUgdGhlbiBhbGwgcHJvcGVydGllcyB3aWxsIGJlIG92ZXJ3cml0dGVuIHdpdGggdGhlaXIgbmV3XG4gKiB2YWx1ZXMgb3Igd2l0aCBgbnVsbGAuIFRoaXMgbWVhbnMgdGhhdCB0aGUgYXJyYXkgd2lsbCBuZXZlclxuICogc2hyaW5rIGluIHNpemUgKGJ1dCBpdCB3aWxsIGFsc28gbm90IGJlIGNyZWF0ZWQgYW5kIHRocm93blxuICogYXdheSB3aGVuZXZlciB0aGUgYHtrZXk6dmFsdWV9YCBtYXAgZW50cmllcyBjaGFuZ2UpLlxuICovXG5leHBvcnQgZnVuY3Rpb24gbm9ybWFsaXplSW50b1N0eWxpbmdNYXAoXG4gICAgYmluZGluZ1ZhbHVlOiBudWxsIHwgU3R5bGluZ01hcEFycmF5LFxuICAgIG5ld1ZhbHVlczoge1trZXk6IHN0cmluZ106IGFueX0gfCBzdHJpbmcgfCBudWxsIHwgdW5kZWZpbmVkLFxuICAgIG5vcm1hbGl6ZVByb3BzPzogYm9vbGVhbik6IFN0eWxpbmdNYXBBcnJheSB7XG4gIGNvbnN0IHN0eWxpbmdNYXBBcnI6IFN0eWxpbmdNYXBBcnJheSA9IEFycmF5LmlzQXJyYXkoYmluZGluZ1ZhbHVlKSA/IGJpbmRpbmdWYWx1ZSA6IFtudWxsXTtcbiAgc3R5bGluZ01hcEFycltTdHlsaW5nTWFwQXJyYXlJbmRleC5SYXdWYWx1ZVBvc2l0aW9uXSA9IG5ld1ZhbHVlcyB8fCBudWxsO1xuXG4gIC8vIGJlY2F1c2UgdGhlIG5ldyB2YWx1ZXMgbWF5IG5vdCBpbmNsdWRlIGFsbCB0aGUgcHJvcGVydGllc1xuICAvLyB0aGF0IHRoZSBvbGQgb25lcyBoYWQsIGFsbCB2YWx1ZXMgYXJlIHNldCB0byBgbnVsbGAgYmVmb3JlXG4gIC8vIHRoZSBuZXcgdmFsdWVzIGFyZSBhcHBsaWVkLiBUaGlzIHdheSwgd2hlbiBmbHVzaGVkLCB0aGVcbiAgLy8gc3R5bGluZyBhbGdvcml0aG0ga25vd3MgZXhhY3RseSB3aGF0IHN0eWxlL2NsYXNzIHZhbHVlc1xuICAvLyB0byByZW1vdmUgZnJvbSB0aGUgZWxlbWVudCAoc2luY2UgdGhleSBhcmUgYG51bGxgKS5cbiAgZm9yIChsZXQgaiA9IFN0eWxpbmdNYXBBcnJheUluZGV4LlZhbHVlc1N0YXJ0UG9zaXRpb247IGogPCBzdHlsaW5nTWFwQXJyLmxlbmd0aDtcbiAgICAgICBqICs9IFN0eWxpbmdNYXBBcnJheUluZGV4LlR1cGxlU2l6ZSkge1xuICAgIHNldE1hcFZhbHVlKHN0eWxpbmdNYXBBcnIsIGosIG51bGwpO1xuICB9XG5cbiAgbGV0IHByb3BzOiBzdHJpbmdbXXxudWxsID0gbnVsbDtcbiAgbGV0IG1hcDoge1trZXk6IHN0cmluZ106IGFueX18dW5kZWZpbmVkfG51bGw7XG4gIGxldCBhbGxWYWx1ZXNUcnVlID0gZmFsc2U7XG4gIGlmICh0eXBlb2YgbmV3VmFsdWVzID09PSAnc3RyaW5nJykgeyAgLy8gW2NsYXNzXSBiaW5kaW5ncyBhbGxvdyBzdHJpbmcgdmFsdWVzXG4gICAgaWYgKG5ld1ZhbHVlcy5sZW5ndGgpIHtcbiAgICAgIHByb3BzID0gbmV3VmFsdWVzLnNwbGl0KC9cXHMrLyk7XG4gICAgICBhbGxWYWx1ZXNUcnVlID0gdHJ1ZTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgcHJvcHMgPSBuZXdWYWx1ZXMgPyBPYmplY3Qua2V5cyhuZXdWYWx1ZXMpIDogbnVsbDtcbiAgICBtYXAgPSBuZXdWYWx1ZXM7XG4gIH1cblxuICBpZiAocHJvcHMpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHByb3BzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBwcm9wID0gcHJvcHNbaV07XG4gICAgICBjb25zdCBuZXdQcm9wID0gbm9ybWFsaXplUHJvcHMgPyBoeXBoZW5hdGUocHJvcCkgOiBwcm9wO1xuICAgICAgY29uc3QgdmFsdWUgPSBhbGxWYWx1ZXNUcnVlID8gdHJ1ZSA6IG1hcCAhW3Byb3BdO1xuICAgICAgYWRkSXRlbVRvU3R5bGluZ01hcChzdHlsaW5nTWFwQXJyLCBuZXdQcm9wLCB2YWx1ZSwgdHJ1ZSk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHN0eWxpbmdNYXBBcnI7XG59XG5cbi8vIFRPRE8gKG1hdHNrb3xBbmRyZXdLdXNobmlyKTogcmVmYWN0b3IgdGhpcyBvbmNlIHdlIGZpZ3VyZSBvdXQgaG93IHRvIGdlbmVyYXRlIHNlcGFyYXRlXG4vLyBgaW5wdXQoJ2NsYXNzJykgKyBjbGFzc01hcCgpYCBpbnN0cnVjdGlvbnMuXG5leHBvcnQgZnVuY3Rpb24gc2VsZWN0Q2xhc3NCYXNlZElucHV0TmFtZShpbnB1dHM6IFByb3BlcnR5QWxpYXNlcyk6IHN0cmluZyB7XG4gIHJldHVybiBpbnB1dHMuaGFzT3duUHJvcGVydHkoJ2NsYXNzJykgPyAnY2xhc3MnIDogJ2NsYXNzTmFtZSc7XG59Il19