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
export function allocTStylingContext(initialStyling) {
    initialStyling = initialStyling || allocStylingMapArray();
    return [
        0 /* Initial */,
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
 * 1. context is locked for template or host bindings (depending on `hostBindingsMode`)
 * 2. There are no collisions (i.e. properties with more than one binding)
 * 3. There are only "prop" or "map" bindings present, but not both
 */
export function allowDirectStyling(context, hostBindingsMode) {
    var config = getConfig(context);
    return ((config & getLockedConfig(hostBindingsMode)) !== 0) &&
        ((config & 4 /* HasCollisions */) === 0) &&
        ((config & 3 /* HasPropAndMapBindings */) !== 3 /* HasPropAndMapBindings */);
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
    return hostBindingsMode ? 128 /* HostBindingsLocked */ :
        64 /* TemplateBindingsLocked */;
}
export function getPropValuesStartPosition(context) {
    var startPosition = 3 /* ValuesStartPosition */;
    if (hasConfig(context, 2 /* HasMapBindings */)) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3R5bGluZ191dGlscy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvdXRpbC9zdHlsaW5nX3V0aWxzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQVNBLE9BQU8sRUFBQyxTQUFTLEVBQUMsTUFBTSxXQUFXLENBQUM7QUFFcEMsTUFBTSxDQUFDLElBQU0seUJBQXlCLEdBQUcsT0FBTyxDQUFDO0FBQ2pELE1BQU0sQ0FBQyxJQUFNLHdCQUF3QixHQUFHLENBQUMsQ0FBQztBQUUxQzs7Ozs7OztHQU9HO0FBQ0gsTUFBTSxDQUFDLElBQU0scUJBQXFCLEdBQUcsSUFBSSxDQUFDO0FBRTFDLE1BQU0sQ0FBQyxJQUFNLHFCQUFxQixHQUFHLENBQUMsQ0FBQztBQUV2QyxJQUFNLHFCQUFxQixHQUFHLENBQUMsQ0FBQztBQUVoQyxnRUFBZ0U7QUFDaEUsa0VBQWtFO0FBQ2xFLGtFQUFrRTtBQUNsRSxpRUFBaUU7QUFDakUsMkJBQTJCO0FBQzNCLE1BQU0sQ0FBQyxJQUFNLHdCQUF3QixHQUFHLENBQUcsQ0FBQztBQUU1Qzs7Ozs7OztHQU9HO0FBQ0gsTUFBTSxVQUFVLG9CQUFvQixDQUFDLGNBQXVDO0lBQzFFLGNBQWMsR0FBRyxjQUFjLElBQUksb0JBQW9CLEVBQUUsQ0FBQztJQUMxRCxPQUFPOztRQUVMLHFCQUFxQjtRQUNyQixjQUFjO0tBQ2YsQ0FBQztBQUNKLENBQUM7QUFFRCxNQUFNLFVBQVUsb0JBQW9CO0lBQ2xDLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQztBQUNkLENBQUM7QUFFRCxNQUFNLFVBQVUsU0FBUyxDQUFDLE9BQXdCO0lBQ2hELE9BQU8sT0FBTyx3QkFBcUMsQ0FBQztBQUN0RCxDQUFDO0FBRUQsTUFBTSxVQUFVLFNBQVMsQ0FBQyxPQUF3QixFQUFFLElBQW9CO0lBQ3RFLE9BQU8sQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQzNDLENBQUM7QUFFRDs7Ozs7OztHQU9HO0FBQ0gsTUFBTSxVQUFVLGtCQUFrQixDQUFDLE9BQXdCLEVBQUUsZ0JBQXlCO0lBQ3BGLElBQU0sTUFBTSxHQUFHLFNBQVMsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUNsQyxPQUFPLENBQUMsQ0FBQyxNQUFNLEdBQUcsZUFBZSxDQUFDLGdCQUFnQixDQUFDLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDdkQsQ0FBQyxDQUFDLE1BQU0sd0JBQStCLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDL0MsQ0FBQyxDQUFDLE1BQU0sZ0NBQXVDLENBQUMsa0NBQXlDLENBQUMsQ0FBQztBQUNqRyxDQUFDO0FBRUQsTUFBTSxVQUFVLFNBQVMsQ0FBQyxPQUF3QixFQUFFLEtBQXFCO0lBQ3ZFLE9BQU8sd0JBQXFDLEdBQUcsS0FBSyxDQUFDO0FBQ3ZELENBQUM7QUFFRCxNQUFNLFVBQVUsV0FBVyxDQUFDLE9BQXdCLEVBQUUsSUFBb0I7SUFDeEUsT0FBTyx3QkFBcUMsSUFBSSxJQUFJLENBQUM7QUFDdkQsQ0FBQztBQUVELE1BQU0sVUFBVSxPQUFPLENBQUMsT0FBd0IsRUFBRSxLQUFhO0lBQzdELE9BQU8sT0FBTyxDQUFDLEtBQUsscUJBQWtDLENBQVcsQ0FBQztBQUNwRSxDQUFDO0FBRUQsU0FBUyxhQUFhLENBQUMsT0FBd0IsRUFBRSxLQUFhO0lBQzVELE9BQVEsT0FBTyxDQUFDLEtBQUssdUJBQW9DLENBQVk7b0JBQzlCLENBQUM7QUFDMUMsQ0FBQztBQUVELE1BQU0sVUFBVSxzQkFBc0IsQ0FBQyxPQUF3QixFQUFFLEtBQWE7SUFDNUUsT0FBTyxDQUFDLGFBQWEsQ0FBQyxPQUFPLEVBQUUsS0FBSyxDQUFDLCtCQUFzRCxDQUFDO1FBQ3hGLENBQUMsQ0FBQztBQUNSLENBQUM7QUFFRCxNQUFNLFVBQVUsWUFBWSxDQUN4QixPQUF3QixFQUFFLEtBQWEsRUFBRSxhQUFzQjtJQUNqRSxJQUFNLFFBQVEsR0FBRyxLQUFLLEdBQUcsQ0FBQyxhQUFhLENBQUMsQ0FBQyxvQ0FBaUQsQ0FBQztzQ0FDTixDQUFDLENBQUM7SUFDdkYsT0FBTyxPQUFPLENBQUMsUUFBUSxDQUFXLENBQUM7QUFDckMsQ0FBQztBQUVELE1BQU0sVUFBVSxZQUFZLENBQ3hCLE9BQXdCLEVBQUUsS0FBYSxFQUFFLFNBQWlCLEVBQUUsYUFBc0I7SUFDcEYsSUFBTSxRQUFRLEdBQUcsS0FBSyxHQUFHLENBQUMsYUFBYSxDQUFDLENBQUMsb0NBQWlELENBQUM7c0NBQ04sQ0FBQyxDQUFDO0lBQ3ZGLE9BQU8sQ0FBQyxRQUFRLENBQUMsR0FBRyxTQUFTLENBQUM7QUFDaEMsQ0FBQztBQUVELE1BQU0sVUFBVSxjQUFjLENBQUMsT0FBd0I7SUFDckQsT0FBTyxlQUFlLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQ3RDLENBQUM7QUFFRCxNQUFNLFVBQVUsZUFBZSxDQUFDLE9BQXdCO0lBQ3RELE9BQU8sT0FBTyw4QkFBMkMsQ0FBQztBQUM1RCxDQUFDO0FBRUQsTUFBTSxVQUFVLGVBQWUsQ0FBQyxPQUF3QixFQUFFLEtBQWEsRUFBRSxNQUFjO0lBQ3JGLE9BQU8sT0FBTyxDQUFDLEtBQUssOEJBQTJDLEdBQUcsTUFBTSxDQUFvQixDQUFDO0FBQy9GLENBQUM7QUFFRCxNQUFNLFVBQVUsZUFBZSxDQUFDLE9BQXdCLEVBQUUsS0FBYTtJQUNyRSxPQUFPLE9BQU8sQ0FBQyxLQUFLLDhCQUEyQyxHQUFHLGVBQWUsQ0FBQyxPQUFPLENBQUMsQ0FFeEUsQ0FBQztBQUNyQixDQUFDO0FBRUQsTUFBTSxVQUFVLGVBQWUsQ0FDM0IsT0FBd0IsRUFBRSxLQUFhLEVBQUUsS0FBOEI7SUFDekUsT0FBTyxPQUFPLENBQUMsS0FBSyw4QkFBMkMsR0FBRyxlQUFlLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDaEYsS0FBSyxDQUFDO0FBQ25CLENBQUM7QUFFRCxNQUFNLFVBQVUsUUFBUSxDQUFDLElBQWtCLEVBQUUsWUFBb0IsRUFBRSxLQUFVO0lBQzNFLElBQUksQ0FBQyxZQUFZLENBQUMsR0FBRyxLQUFLLENBQUM7QUFDN0IsQ0FBQztBQUVELE1BQU0sVUFBVSxRQUFRLENBQVUsSUFBa0IsRUFBRSxZQUFvQjtJQUN4RSxPQUFPLFlBQVksR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxZQUFZLENBQU0sQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO0FBQzNELENBQUM7QUFFRCxNQUFNLFVBQVUsV0FBVyxDQUFDLE9BQXdCLEVBQUUsZ0JBQXlCO0lBQzdFLFdBQVcsQ0FBQyxPQUFPLEVBQUUsZUFBZSxDQUFDLGdCQUFnQixDQUFDLENBQUMsQ0FBQztBQUMxRCxDQUFDO0FBRUQsTUFBTSxVQUFVLGVBQWUsQ0FBQyxPQUF3QixFQUFFLGdCQUF5QjtJQUNqRixPQUFPLFNBQVMsQ0FBQyxPQUFPLEVBQUUsZUFBZSxDQUFDLGdCQUFnQixDQUFDLENBQUMsQ0FBQztBQUMvRCxDQUFDO0FBRUQsTUFBTSxVQUFVLGVBQWUsQ0FBQyxnQkFBeUI7SUFDdkQsT0FBTyxnQkFBZ0IsQ0FBQyxDQUFDLDhCQUFtQyxDQUFDO3VDQUNFLENBQUM7QUFDbEUsQ0FBQztBQUVELE1BQU0sVUFBVSwwQkFBMEIsQ0FBQyxPQUF3QjtJQUNqRSxJQUFJLGFBQWEsOEJBQTJDLENBQUM7SUFDN0QsSUFBSSxTQUFTLENBQUMsT0FBTyx5QkFBZ0MsRUFBRTtRQUNyRCxhQUFhLElBQUksOEJBQTJDLGNBQWMsQ0FBQyxPQUFPLENBQUMsQ0FBQztLQUNyRjtJQUNELE9BQU8sYUFBYSxDQUFDO0FBQ3ZCLENBQUM7QUFFRCxNQUFNLFVBQVUsZUFBZSxDQUMzQixDQUEyRixFQUMzRixDQUNNO0lBQ1IsSUFBSSxDQUFDLEtBQUssU0FBUztRQUFFLE9BQU8sS0FBSyxDQUFDO0lBRWxDLElBQU0sYUFBYSxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsMEJBQXVDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUN0RixJQUFNLGFBQWEsR0FBRyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLDBCQUF1QyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDdEYsT0FBTyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsYUFBYSxFQUFFLGFBQWEsQ0FBQyxDQUFDO0FBQ2xELENBQUM7QUFFRDs7R0FFRztBQUNILE1BQU0sVUFBVSxxQkFBcUIsQ0FBQyxLQUFVO0lBQzlDLHFEQUFxRDtJQUNyRCxtREFBbUQ7SUFDbkQsc0RBQXNEO0lBQ3RELHFEQUFxRDtJQUNyRCwrQ0FBK0M7SUFDL0MsT0FBTyxLQUFLLElBQUksSUFBSSxJQUFJLEtBQUssS0FBSyxFQUFFLENBQUM7QUFDdkMsQ0FBQztBQUVELE1BQU0sVUFBVSxZQUFZLENBQUMsQ0FBUyxFQUFFLENBQVMsRUFBRSxTQUFlO0lBQWYsMEJBQUEsRUFBQSxlQUFlO0lBQ2hFLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxJQUFJLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDM0QsQ0FBQztBQUVELE1BQU0sVUFBVSxTQUFTLENBQUMsS0FBYTtJQUNyQyxPQUFPLEtBQUssQ0FBQyxPQUFPLENBQUMsYUFBYSxFQUFFLFVBQUEsQ0FBQyxJQUFJLE9BQUEsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLEdBQUcsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBL0IsQ0FBK0IsQ0FBQyxDQUFDLFdBQVcsRUFBRSxDQUFDO0FBQzFGLENBQUM7QUFFRDs7Ozs7OztHQU9HO0FBQ0gsTUFBTSxVQUFVLGtCQUFrQixDQUFDLEtBQStDO0lBRWhGLE9BQU8sZ0JBQWdCLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztRQUMzQixLQUF5QixxQ0FBa0QsQ0FBQyxDQUFDO1FBQzlFLEtBQXdCLENBQUM7QUFDL0IsQ0FBQztBQUVELE1BQU0sVUFBVSxnQkFBZ0IsQ0FBQyxLQUFVO0lBQ3pDLGdGQUFnRjtJQUNoRiwrREFBK0Q7SUFDL0QsT0FBTyxLQUFLLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxJQUFJLEtBQUssQ0FBQyxNQUFNLCtCQUE0QztRQUNuRixPQUFPLEtBQUssQ0FBQyxDQUFDLENBQUMsS0FBSyxRQUFRLENBQUM7QUFDbkMsQ0FBQztBQUVELE1BQU0sVUFBVSxpQkFBaUIsQ0FBQyxLQUErQztJQUMvRSxnRkFBZ0Y7SUFDaEYsK0RBQStEO0lBQy9ELE9BQU8sS0FBSyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUM7UUFDdkIsQ0FBQyxPQUFPLEtBQXlCLDZCQUEwQyxLQUFLLFFBQVEsQ0FBQyxDQUFDO0FBQ2hHLENBQUM7QUFFRCxNQUFNLFVBQVUsc0JBQXNCLENBQUMsT0FBaUQ7SUFDdEYsSUFBTSxHQUFHLEdBQUcsa0JBQWtCLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDeEMsT0FBTyxHQUFHLElBQUssR0FBRywwQkFBeUQsSUFBSSxFQUFFLENBQUM7QUFDcEYsQ0FBQztBQUVELE1BQU0sVUFBVSxhQUFhLENBQUMsS0FBWTtJQUN4QyxPQUFPLENBQUMsS0FBSyxDQUFDLEtBQUsseUJBQTJCLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDeEQsQ0FBQztBQUVELE1BQU0sVUFBVSxhQUFhLENBQUMsS0FBWTtJQUN4QyxPQUFPLENBQUMsS0FBSyxDQUFDLEtBQUsseUJBQTJCLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDeEQsQ0FBQztBQUVELE1BQU0sVUFBVSxVQUFVLENBQUMsR0FBb0IsRUFBRSxLQUFhO0lBQzVELE9BQU8sR0FBRyxDQUFDLEtBQUsscUJBQWtDLENBQVcsQ0FBQztBQUNoRSxDQUFDO0FBRUQsSUFBTSxlQUFlLEdBQ2pCLE9BQU8sU0FBUyxLQUFLLFdBQVcsSUFBSSxTQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBQyxlQUFlLEVBQUUsSUFBSSxFQUFDLENBQUM7QUFFakYsTUFBTSxVQUFVLGFBQWEsQ0FBQyxHQUFvQjtJQUNoRCxHQUFHLDBCQUF1QyxHQUFHLGVBQWUsQ0FBQztBQUMvRCxDQUFDO0FBRUQsTUFBTSxVQUFVLFdBQVcsQ0FDdkIsR0FBb0IsRUFBRSxLQUFhLEVBQUUsS0FBOEI7SUFDckUsR0FBRyxDQUFDLEtBQUssc0JBQW1DLENBQUMsR0FBRyxLQUFLLENBQUM7QUFDeEQsQ0FBQztBQUVELE1BQU0sVUFBVSxXQUFXLENBQUMsR0FBb0IsRUFBRSxLQUFhO0lBQzdELE9BQU8sR0FBRyxDQUFDLEtBQUssc0JBQW1DLENBQWtCLENBQUM7QUFDeEUsQ0FBQztBQUVELE1BQU0sVUFBVSxvQkFBb0IsQ0FBQyxPQUF5RDtJQUU1RixJQUFJLE9BQU8sSUFBSSxPQUFPLE9BQU8sS0FBSyxRQUFRLEVBQUU7UUFDMUMsT0FBTyxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0tBQzFDO0lBQ0QsT0FBUSxPQUFrQixJQUFJLEVBQUUsQ0FBQztBQUNuQyxDQUFDO0FBRUQsTUFBTSxVQUFVLG1CQUFtQixDQUFDLE1BQStDO0lBQ2pGLElBQUksR0FBRyxHQUFHLEVBQUUsQ0FBQztJQUNiLElBQUksTUFBTSxFQUFFO1FBQ1YsSUFBTSxLQUFLLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUNsQyxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtZQUNyQyxJQUFNLElBQUksR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDdEIsR0FBRyxHQUFHLFlBQVksQ0FBQyxHQUFHLEVBQUssSUFBSSxTQUFJLE1BQU0sQ0FBQyxJQUFJLENBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQztTQUN6RDtLQUNGO0lBQ0QsT0FBTyxHQUFHLENBQUM7QUFDYixDQUFDO0FBRUQsTUFBTSxVQUFVLG1CQUFtQixDQUFDLG1CQUEyQjtJQUM3RCxPQUFPLG1CQUFtQixLQUFLLHdCQUF3QixDQUFDO0FBQzFELENBQUM7QUFFRDs7Ozs7R0FLRztBQUNILE1BQU0sVUFBVSxrQkFBa0IsQ0FBQyxHQUFvQixFQUFFLFlBQXFCO0lBQzVFLElBQUksR0FBRyxHQUFHLEVBQUUsQ0FBQztJQUNiLEtBQUssSUFBSSxDQUFDLDhCQUEyQyxFQUFFLENBQUMsR0FBRyxHQUFHLENBQUMsTUFBTSxFQUNoRSxDQUFDLHFCQUFrQyxFQUFFO1FBQ3hDLElBQU0sSUFBSSxHQUFHLFVBQVUsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDaEMsSUFBTSxLQUFLLEdBQUcsV0FBVyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQVcsQ0FBQztRQUM1QyxJQUFNLFNBQVMsR0FBRyxZQUFZLENBQUMsSUFBSSxFQUFFLFlBQVksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxLQUFLLEVBQUUsR0FBRyxDQUFDLENBQUM7UUFDckUsR0FBRyxHQUFHLFlBQVksQ0FBQyxHQUFHLEVBQUUsU0FBUyxFQUFFLFlBQVksQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQztLQUMvRDtJQUNELE9BQU8sR0FBRyxDQUFDO0FBQ2IsQ0FBQztBQUVEOztHQUVHO0FBQ0gsTUFBTSxVQUFVLHFCQUFxQixDQUFDLEdBQTJCO0lBQy9ELElBQUksU0FBUyxHQUF5QixFQUFFLENBQUM7SUFDekMsSUFBSSxHQUFHLEVBQUU7UUFDUCxLQUFLLElBQUksQ0FBQyw4QkFBMkMsRUFBRSxDQUFDLEdBQUcsR0FBRyxDQUFDLE1BQU0sRUFDaEUsQ0FBQyxxQkFBa0MsRUFBRTtZQUN4QyxJQUFNLElBQUksR0FBRyxVQUFVLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2hDLElBQU0sS0FBSyxHQUFHLFdBQVcsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFXLENBQUM7WUFDNUMsU0FBUyxDQUFDLElBQUksQ0FBQyxHQUFHLEtBQUssQ0FBQztTQUN6QjtLQUNGO0lBQ0QsT0FBTyxTQUFTLENBQUM7QUFDbkIsQ0FBQztBQUVEOzs7Ozs7R0FNRztBQUNILE1BQU0sVUFBVSxtQkFBbUIsQ0FDL0IsYUFBOEIsRUFBRSxJQUFZLEVBQUUsS0FBOEIsRUFDNUUsY0FBd0I7SUFDMUIsS0FBSyxJQUFJLENBQUMsOEJBQTJDLEVBQUUsQ0FBQyxHQUFHLGFBQWEsQ0FBQyxNQUFNLEVBQzFFLENBQUMscUJBQWtDLEVBQUU7UUFDeEMsSUFBTSxXQUFXLEdBQUcsVUFBVSxDQUFDLGFBQWEsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUNqRCxJQUFJLElBQUksSUFBSSxXQUFXLEVBQUU7WUFDdkIsSUFBSSxPQUFPLEdBQUcsS0FBSyxDQUFDO1lBQ3BCLElBQUksV0FBVyxLQUFLLElBQUksRUFBRTtnQkFDeEIsSUFBTSxZQUFZLEdBQUcsYUFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUN0QyxJQUFJLGNBQWMsSUFBSSxDQUFDLHFCQUFxQixDQUFDLFlBQVksQ0FBQyxFQUFFO29CQUMxRCxPQUFPLEdBQUcsSUFBSSxDQUFDO29CQUNmLFdBQVcsQ0FBQyxhQUFhLEVBQUUsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO2lCQUN0QzthQUNGO2lCQUFNO2dCQUNMLE9BQU8sR0FBRyxJQUFJLENBQUM7Z0JBQ2YsYUFBYSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQzthQUN6QztZQUNELE9BQU8sT0FBTyxDQUFDO1NBQ2hCO0tBQ0Y7SUFFRCxhQUFhLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQztJQUNoQyxPQUFPLElBQUksQ0FBQztBQUNkLENBQUM7QUFFRDs7Ozs7Ozs7Ozs7OztHQWFHO0FBQ0gsTUFBTSxVQUFVLHVCQUF1QixDQUNuQyxZQUFvQyxFQUNwQyxTQUEyRCxFQUMzRCxjQUF3QjtJQUMxQixJQUFNLGFBQWEsR0FBb0IsS0FBSyxDQUFDLE9BQU8sQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQzNGLGFBQWEsMEJBQXVDLEdBQUcsU0FBUyxJQUFJLElBQUksQ0FBQztJQUV6RSw0REFBNEQ7SUFDNUQsNkRBQTZEO0lBQzdELDBEQUEwRDtJQUMxRCwwREFBMEQ7SUFDMUQsc0RBQXNEO0lBQ3RELEtBQUssSUFBSSxDQUFDLDhCQUEyQyxFQUFFLENBQUMsR0FBRyxhQUFhLENBQUMsTUFBTSxFQUMxRSxDQUFDLHFCQUFrQyxFQUFFO1FBQ3hDLFdBQVcsQ0FBQyxhQUFhLEVBQUUsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO0tBQ3JDO0lBRUQsSUFBSSxLQUFLLEdBQWtCLElBQUksQ0FBQztJQUNoQyxJQUFJLEdBQXdDLENBQUM7SUFDN0MsSUFBSSxhQUFhLEdBQUcsS0FBSyxDQUFDO0lBQzFCLElBQUksT0FBTyxTQUFTLEtBQUssUUFBUSxFQUFFLEVBQUcsdUNBQXVDO1FBQzNFLElBQUksU0FBUyxDQUFDLE1BQU0sRUFBRTtZQUNwQixLQUFLLEdBQUcsU0FBUyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUMvQixhQUFhLEdBQUcsSUFBSSxDQUFDO1NBQ3RCO0tBQ0Y7U0FBTTtRQUNMLEtBQUssR0FBRyxTQUFTLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztRQUNsRCxHQUFHLEdBQUcsU0FBUyxDQUFDO0tBQ2pCO0lBRUQsSUFBSSxLQUFLLEVBQUU7UUFDVCxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtZQUNyQyxJQUFNLElBQUksR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFXLENBQUM7WUFDaEMsSUFBTSxPQUFPLEdBQUcsY0FBYyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztZQUN4RCxJQUFNLEtBQUssR0FBRyxhQUFhLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsR0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ2pELG1CQUFtQixDQUFDLGFBQWEsRUFBRSxPQUFPLEVBQUUsS0FBSyxFQUFFLElBQUksQ0FBQyxDQUFDO1NBQzFEO0tBQ0Y7SUFFRCxPQUFPLGFBQWEsQ0FBQztBQUN2QixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4qIEBsaWNlbnNlXG4qIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuKlxuKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4qL1xuaW1wb3J0IHtUTm9kZSwgVE5vZGVGbGFnc30gZnJvbSAnLi4vaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB7TFN0eWxpbmdEYXRhLCBTdHlsaW5nTWFwQXJyYXksIFN0eWxpbmdNYXBBcnJheUluZGV4LCBUU3R5bGluZ0NvbmZpZywgVFN0eWxpbmdDb250ZXh0LCBUU3R5bGluZ0NvbnRleHRJbmRleCwgVFN0eWxpbmdDb250ZXh0UHJvcENvbmZpZ0ZsYWdzfSBmcm9tICcuLi9pbnRlcmZhY2VzL3N0eWxpbmcnO1xuaW1wb3J0IHtOT19DSEFOR0V9IGZyb20gJy4uL3Rva2Vucyc7XG5cbmV4cG9ydCBjb25zdCBNQVBfQkFTRURfRU5UUllfUFJPUF9OQU1FID0gJ1tNQVBdJztcbmV4cG9ydCBjb25zdCBURU1QTEFURV9ESVJFQ1RJVkVfSU5ERVggPSAwO1xuXG4vKipcbiAqIERlZmF1bHQgZmFsbGJhY2sgdmFsdWUgZm9yIGEgc3R5bGluZyBiaW5kaW5nLlxuICpcbiAqIEEgdmFsdWUgb2YgYG51bGxgIGlzIHVzZWQgaGVyZSB3aGljaCBzaWduYWxzIHRvIHRoZSBzdHlsaW5nIGFsZ29yaXRobSB0aGF0XG4gKiB0aGUgc3R5bGluZyB2YWx1ZSBpcyBub3QgcHJlc2VudC4gVGhpcyB3YXkgaWYgdGhlcmUgYXJlIG5vIG90aGVyIHZhbHVlc1xuICogZGV0ZWN0ZWQgdGhlbiBpdCB3aWxsIGJlIHJlbW92ZWQgb25jZSB0aGUgc3R5bGUvY2xhc3MgcHJvcGVydHkgaXMgZGlydHkgYW5kXG4gKiBkaWZmZWQgd2l0aGluIHRoZSBzdHlsaW5nIGFsZ29yaXRobSBwcmVzZW50IGluIGBmbHVzaFN0eWxpbmdgLlxuICovXG5leHBvcnQgY29uc3QgREVGQVVMVF9CSU5ESU5HX1ZBTFVFID0gbnVsbDtcblxuZXhwb3J0IGNvbnN0IERFRkFVTFRfQklORElOR19JTkRFWCA9IDA7XG5cbmNvbnN0IERFRkFVTFRfVE9UQUxfU09VUkNFUyA9IDE7XG5cbi8vIFRoZSBmaXJzdCBiaXQgdmFsdWUgcmVmbGVjdHMgYSBtYXAtYmFzZWQgYmluZGluZyB2YWx1ZSdzIGJpdC5cbi8vIFRoZSByZWFzb24gd2h5IGl0J3MgYWx3YXlzIGFjdGl2YXRlZCBmb3IgZXZlcnkgZW50cnkgaW4gdGhlIG1hcFxuLy8gaXMgc28gdGhhdCBpZiBhbnkgbWFwLWJpbmRpbmcgdmFsdWVzIHVwZGF0ZSB0aGVuIGFsbCBvdGhlciBwcm9wXG4vLyBiYXNlZCBiaW5kaW5ncyB3aWxsIHBhc3MgdGhlIGd1YXJkIGNoZWNrIGF1dG9tYXRpY2FsbHkgd2l0aG91dFxuLy8gYW55IGV4dHJhIGNvZGUgb3IgZmxhZ3MuXG5leHBvcnQgY29uc3QgREVGQVVMVF9HVUFSRF9NQVNLX1ZBTFVFID0gMGIxO1xuXG4vKipcbiAqIENyZWF0ZXMgYSBuZXcgaW5zdGFuY2Ugb2YgdGhlIGBUU3R5bGluZ0NvbnRleHRgLlxuICpcbiAqIFRoZSBgVFN0eWxpbmdDb250ZXh0YCBpcyB1c2VkIGFzIGEgbWFuaWZlc3Qgb2YgYWxsIHN0eWxlIG9yIGFsbCBjbGFzcyBiaW5kaW5ncyBvblxuICogYW4gZWxlbWVudC4gQmVjYXVzZSBpdCBpcyBhIFQtbGV2ZWwgZGF0YS1zdHJ1Y3R1cmUsIGl0IGlzIG9ubHkgY3JlYXRlZCBvbmNlIHBlclxuICogdE5vZGUgZm9yIHN0eWxlcyBhbmQgZm9yIGNsYXNzZXMuIFRoaXMgZnVuY3Rpb24gYWxsb2NhdGVzIGEgbmV3IGluc3RhbmNlIG9mIGFcbiAqIGBUU3R5bGluZ0NvbnRleHRgIHdpdGggdGhlIGluaXRpYWwgdmFsdWVzIChzZWUgYGludGVyZmFjZXMudHNgIGZvciBtb3JlIGluZm8pLlxuICovXG5leHBvcnQgZnVuY3Rpb24gYWxsb2NUU3R5bGluZ0NvbnRleHQoaW5pdGlhbFN0eWxpbmc/OiBTdHlsaW5nTWFwQXJyYXkgfCBudWxsKTogVFN0eWxpbmdDb250ZXh0IHtcbiAgaW5pdGlhbFN0eWxpbmcgPSBpbml0aWFsU3R5bGluZyB8fCBhbGxvY1N0eWxpbmdNYXBBcnJheSgpO1xuICByZXR1cm4gW1xuICAgIFRTdHlsaW5nQ29uZmlnLkluaXRpYWwsICAvLyAxKSBjb25maWcgZm9yIHRoZSBzdHlsaW5nIGNvbnRleHRcbiAgICBERUZBVUxUX1RPVEFMX1NPVVJDRVMsICAgLy8gMikgdG90YWwgYW1vdW50IG9mIHN0eWxpbmcgc291cmNlcyAodGVtcGxhdGUsIGRpcmVjdGl2ZXMsIGV0Yy4uLilcbiAgICBpbml0aWFsU3R5bGluZywgICAgICAgICAgLy8gMykgaW5pdGlhbCBzdHlsaW5nIHZhbHVlc1xuICBdO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYWxsb2NTdHlsaW5nTWFwQXJyYXkoKTogU3R5bGluZ01hcEFycmF5IHtcbiAgcmV0dXJuIFsnJ107XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRDb25maWcoY29udGV4dDogVFN0eWxpbmdDb250ZXh0KSB7XG4gIHJldHVybiBjb250ZXh0W1RTdHlsaW5nQ29udGV4dEluZGV4LkNvbmZpZ1Bvc2l0aW9uXTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGhhc0NvbmZpZyhjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQsIGZsYWc6IFRTdHlsaW5nQ29uZmlnKSB7XG4gIHJldHVybiAoZ2V0Q29uZmlnKGNvbnRleHQpICYgZmxhZykgIT09IDA7XG59XG5cbi8qKlxuICogRGV0ZXJtaW5lcyB3aGV0aGVyIG9yIG5vdCB0byBhcHBseSBzdHlsZXMvY2xhc3NlcyBkaXJlY3RseSBvciB2aWEgY29udGV4dCByZXNvbHV0aW9uLlxuICpcbiAqIFRoZXJlIGFyZSB0aHJlZSBjYXNlcyB0aGF0IGFyZSBtYXRjaGVkIGhlcmU6XG4gKiAxLiBjb250ZXh0IGlzIGxvY2tlZCBmb3IgdGVtcGxhdGUgb3IgaG9zdCBiaW5kaW5ncyAoZGVwZW5kaW5nIG9uIGBob3N0QmluZGluZ3NNb2RlYClcbiAqIDIuIFRoZXJlIGFyZSBubyBjb2xsaXNpb25zIChpLmUuIHByb3BlcnRpZXMgd2l0aCBtb3JlIHRoYW4gb25lIGJpbmRpbmcpXG4gKiAzLiBUaGVyZSBhcmUgb25seSBcInByb3BcIiBvciBcIm1hcFwiIGJpbmRpbmdzIHByZXNlbnQsIGJ1dCBub3QgYm90aFxuICovXG5leHBvcnQgZnVuY3Rpb24gYWxsb3dEaXJlY3RTdHlsaW5nKGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCwgaG9zdEJpbmRpbmdzTW9kZTogYm9vbGVhbik6IGJvb2xlYW4ge1xuICBjb25zdCBjb25maWcgPSBnZXRDb25maWcoY29udGV4dCk7XG4gIHJldHVybiAoKGNvbmZpZyAmIGdldExvY2tlZENvbmZpZyhob3N0QmluZGluZ3NNb2RlKSkgIT09IDApICYmXG4gICAgICAoKGNvbmZpZyAmIFRTdHlsaW5nQ29uZmlnLkhhc0NvbGxpc2lvbnMpID09PSAwKSAmJlxuICAgICAgKChjb25maWcgJiBUU3R5bGluZ0NvbmZpZy5IYXNQcm9wQW5kTWFwQmluZGluZ3MpICE9PSBUU3R5bGluZ0NvbmZpZy5IYXNQcm9wQW5kTWFwQmluZGluZ3MpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2V0Q29uZmlnKGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCwgdmFsdWU6IFRTdHlsaW5nQ29uZmlnKTogdm9pZCB7XG4gIGNvbnRleHRbVFN0eWxpbmdDb250ZXh0SW5kZXguQ29uZmlnUG9zaXRpb25dID0gdmFsdWU7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwYXRjaENvbmZpZyhjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQsIGZsYWc6IFRTdHlsaW5nQ29uZmlnKTogdm9pZCB7XG4gIGNvbnRleHRbVFN0eWxpbmdDb250ZXh0SW5kZXguQ29uZmlnUG9zaXRpb25dIHw9IGZsYWc7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRQcm9wKGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCwgaW5kZXg6IG51bWJlcik6IHN0cmluZyB7XG4gIHJldHVybiBjb250ZXh0W2luZGV4ICsgVFN0eWxpbmdDb250ZXh0SW5kZXguUHJvcE9mZnNldF0gYXMgc3RyaW5nO1xufVxuXG5mdW5jdGlvbiBnZXRQcm9wQ29uZmlnKGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCwgaW5kZXg6IG51bWJlcik6IG51bWJlciB7XG4gIHJldHVybiAoY29udGV4dFtpbmRleCArIFRTdHlsaW5nQ29udGV4dEluZGV4LkNvbmZpZ09mZnNldF0gYXMgbnVtYmVyKSAmXG4gICAgICBUU3R5bGluZ0NvbnRleHRQcm9wQ29uZmlnRmxhZ3MuTWFzaztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzU2FuaXRpemF0aW9uUmVxdWlyZWQoY29udGV4dDogVFN0eWxpbmdDb250ZXh0LCBpbmRleDogbnVtYmVyKTogYm9vbGVhbiB7XG4gIHJldHVybiAoZ2V0UHJvcENvbmZpZyhjb250ZXh0LCBpbmRleCkgJiBUU3R5bGluZ0NvbnRleHRQcm9wQ29uZmlnRmxhZ3MuU2FuaXRpemF0aW9uUmVxdWlyZWQpICE9PVxuICAgICAgMDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEd1YXJkTWFzayhcbiAgICBjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQsIGluZGV4OiBudW1iZXIsIGlzSG9zdEJpbmRpbmc6IGJvb2xlYW4pOiBudW1iZXIge1xuICBjb25zdCBwb3NpdGlvbiA9IGluZGV4ICsgKGlzSG9zdEJpbmRpbmcgPyBUU3R5bGluZ0NvbnRleHRJbmRleC5Ib3N0QmluZGluZ3NCaXRHdWFyZE9mZnNldCA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFRTdHlsaW5nQ29udGV4dEluZGV4LlRlbXBsYXRlQml0R3VhcmRPZmZzZXQpO1xuICByZXR1cm4gY29udGV4dFtwb3NpdGlvbl0gYXMgbnVtYmVyO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2V0R3VhcmRNYXNrKFxuICAgIGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCwgaW5kZXg6IG51bWJlciwgbWFza1ZhbHVlOiBudW1iZXIsIGlzSG9zdEJpbmRpbmc6IGJvb2xlYW4pIHtcbiAgY29uc3QgcG9zaXRpb24gPSBpbmRleCArIChpc0hvc3RCaW5kaW5nID8gVFN0eWxpbmdDb250ZXh0SW5kZXguSG9zdEJpbmRpbmdzQml0R3VhcmRPZmZzZXQgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBUU3R5bGluZ0NvbnRleHRJbmRleC5UZW1wbGF0ZUJpdEd1YXJkT2Zmc2V0KTtcbiAgY29udGV4dFtwb3NpdGlvbl0gPSBtYXNrVmFsdWU7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRWYWx1ZXNDb3VudChjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQpOiBudW1iZXIge1xuICByZXR1cm4gZ2V0VG90YWxTb3VyY2VzKGNvbnRleHQpICsgMTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFRvdGFsU291cmNlcyhjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQpOiBudW1iZXIge1xuICByZXR1cm4gY29udGV4dFtUU3R5bGluZ0NvbnRleHRJbmRleC5Ub3RhbFNvdXJjZXNQb3NpdGlvbl07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRCaW5kaW5nVmFsdWUoY29udGV4dDogVFN0eWxpbmdDb250ZXh0LCBpbmRleDogbnVtYmVyLCBvZmZzZXQ6IG51bWJlcikge1xuICByZXR1cm4gY29udGV4dFtpbmRleCArIFRTdHlsaW5nQ29udGV4dEluZGV4LkJpbmRpbmdzU3RhcnRPZmZzZXQgKyBvZmZzZXRdIGFzIG51bWJlciB8IHN0cmluZztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldERlZmF1bHRWYWx1ZShjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQsIGluZGV4OiBudW1iZXIpOiBzdHJpbmd8Ym9vbGVhbnxudWxsIHtcbiAgcmV0dXJuIGNvbnRleHRbaW5kZXggKyBUU3R5bGluZ0NvbnRleHRJbmRleC5CaW5kaW5nc1N0YXJ0T2Zmc2V0ICsgZ2V0VG90YWxTb3VyY2VzKGNvbnRleHQpXSBhc1xuICAgICAgICAgICAgIHN0cmluZyB8XG4gICAgICBib29sZWFuIHwgbnVsbDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNldERlZmF1bHRWYWx1ZShcbiAgICBjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQsIGluZGV4OiBudW1iZXIsIHZhbHVlOiBzdHJpbmcgfCBib29sZWFuIHwgbnVsbCkge1xuICByZXR1cm4gY29udGV4dFtpbmRleCArIFRTdHlsaW5nQ29udGV4dEluZGV4LkJpbmRpbmdzU3RhcnRPZmZzZXQgKyBnZXRUb3RhbFNvdXJjZXMoY29udGV4dCldID1cbiAgICAgICAgICAgICB2YWx1ZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNldFZhbHVlKGRhdGE6IExTdHlsaW5nRGF0YSwgYmluZGluZ0luZGV4OiBudW1iZXIsIHZhbHVlOiBhbnkpIHtcbiAgZGF0YVtiaW5kaW5nSW5kZXhdID0gdmFsdWU7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRWYWx1ZTxUID0gYW55PihkYXRhOiBMU3R5bGluZ0RhdGEsIGJpbmRpbmdJbmRleDogbnVtYmVyKTogVHxudWxsIHtcbiAgcmV0dXJuIGJpbmRpbmdJbmRleCA+IDAgPyBkYXRhW2JpbmRpbmdJbmRleF0gYXMgVCA6IG51bGw7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBsb2NrQ29udGV4dChjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQsIGhvc3RCaW5kaW5nc01vZGU6IGJvb2xlYW4pOiB2b2lkIHtcbiAgcGF0Y2hDb25maWcoY29udGV4dCwgZ2V0TG9ja2VkQ29uZmlnKGhvc3RCaW5kaW5nc01vZGUpKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzQ29udGV4dExvY2tlZChjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQsIGhvc3RCaW5kaW5nc01vZGU6IGJvb2xlYW4pOiBib29sZWFuIHtcbiAgcmV0dXJuIGhhc0NvbmZpZyhjb250ZXh0LCBnZXRMb2NrZWRDb25maWcoaG9zdEJpbmRpbmdzTW9kZSkpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0TG9ja2VkQ29uZmlnKGhvc3RCaW5kaW5nc01vZGU6IGJvb2xlYW4pIHtcbiAgcmV0dXJuIGhvc3RCaW5kaW5nc01vZGUgPyBUU3R5bGluZ0NvbmZpZy5Ib3N0QmluZGluZ3NMb2NrZWQgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFRTdHlsaW5nQ29uZmlnLlRlbXBsYXRlQmluZGluZ3NMb2NrZWQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRQcm9wVmFsdWVzU3RhcnRQb3NpdGlvbihjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQpIHtcbiAgbGV0IHN0YXJ0UG9zaXRpb24gPSBUU3R5bGluZ0NvbnRleHRJbmRleC5WYWx1ZXNTdGFydFBvc2l0aW9uO1xuICBpZiAoaGFzQ29uZmlnKGNvbnRleHQsIFRTdHlsaW5nQ29uZmlnLkhhc01hcEJpbmRpbmdzKSkge1xuICAgIHN0YXJ0UG9zaXRpb24gKz0gVFN0eWxpbmdDb250ZXh0SW5kZXguQmluZGluZ3NTdGFydE9mZnNldCArIGdldFZhbHVlc0NvdW50KGNvbnRleHQpO1xuICB9XG4gIHJldHVybiBzdGFydFBvc2l0aW9uO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaGFzVmFsdWVDaGFuZ2VkKFxuICAgIGE6IE5PX0NIQU5HRSB8IFN0eWxpbmdNYXBBcnJheSB8IG51bWJlciB8IFN0cmluZyB8IHN0cmluZyB8IG51bGwgfCBib29sZWFuIHwgdW5kZWZpbmVkIHwge30sXG4gICAgYjogTk9fQ0hBTkdFIHwgU3R5bGluZ01hcEFycmF5IHwgbnVtYmVyIHwgU3RyaW5nIHwgc3RyaW5nIHwgbnVsbCB8IGJvb2xlYW4gfCB1bmRlZmluZWQgfFxuICAgICAgICB7fSk6IGJvb2xlYW4ge1xuICBpZiAoYiA9PT0gTk9fQ0hBTkdFKSByZXR1cm4gZmFsc2U7XG5cbiAgY29uc3QgY29tcGFyZVZhbHVlQSA9IEFycmF5LmlzQXJyYXkoYSkgPyBhW1N0eWxpbmdNYXBBcnJheUluZGV4LlJhd1ZhbHVlUG9zaXRpb25dIDogYTtcbiAgY29uc3QgY29tcGFyZVZhbHVlQiA9IEFycmF5LmlzQXJyYXkoYikgPyBiW1N0eWxpbmdNYXBBcnJheUluZGV4LlJhd1ZhbHVlUG9zaXRpb25dIDogYjtcbiAgcmV0dXJuICFPYmplY3QuaXMoY29tcGFyZVZhbHVlQSwgY29tcGFyZVZhbHVlQik7XG59XG5cbi8qKlxuICogRGV0ZXJtaW5lcyB3aGV0aGVyIHRoZSBwcm92aWRlZCBzdHlsaW5nIHZhbHVlIGlzIHRydXRoeSBvciBmYWxzeS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzU3R5bGluZ1ZhbHVlRGVmaW5lZCh2YWx1ZTogYW55KSB7XG4gIC8vIHRoZSByZWFzb24gd2h5IG51bGwgaXMgY29tcGFyZWQgYWdhaW5zdCBpcyBiZWNhdXNlXG4gIC8vIGEgQ1NTIGNsYXNzIHZhbHVlIHRoYXQgaXMgc2V0IHRvIGBmYWxzZWAgbXVzdCBiZVxuICAvLyByZXNwZWN0ZWQgKG90aGVyd2lzZSBpdCB3b3VsZCBiZSB0cmVhdGVkIGFzIGZhbHN5KS5cbiAgLy8gRW1wdHkgc3RyaW5nIHZhbHVlcyBhcmUgYmVjYXVzZSBkZXZlbG9wZXJzIHVzdWFsbHlcbiAgLy8gc2V0IGEgdmFsdWUgdG8gYW4gZW1wdHkgc3RyaW5nIHRvIHJlbW92ZSBpdC5cbiAgcmV0dXJuIHZhbHVlICE9IG51bGwgJiYgdmFsdWUgIT09ICcnO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY29uY2F0U3RyaW5nKGE6IHN0cmluZywgYjogc3RyaW5nLCBzZXBhcmF0b3IgPSAnICcpOiBzdHJpbmcge1xuICByZXR1cm4gYSArICgoYi5sZW5ndGggJiYgYS5sZW5ndGgpID8gc2VwYXJhdG9yIDogJycpICsgYjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGh5cGhlbmF0ZSh2YWx1ZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHZhbHVlLnJlcGxhY2UoL1thLXpdW0EtWl0vZywgdiA9PiB2LmNoYXJBdCgwKSArICctJyArIHYuY2hhckF0KDEpKS50b0xvd2VyQ2FzZSgpO1xufVxuXG4vKipcbiAqIFJldHVybnMgYW4gaW5zdGFuY2Ugb2YgYFN0eWxpbmdNYXBBcnJheWAuXG4gKlxuICogVGhpcyBmdW5jdGlvbiBpcyBkZXNpZ25lZCB0byBmaW5kIGFuIGluc3RhbmNlIG9mIGBTdHlsaW5nTWFwQXJyYXlgIGluIGNhc2UgaXQgaXMgc3RvcmVkXG4gKiBpbnNpZGUgb2YgYW4gaW5zdGFuY2Ugb2YgYFRTdHlsaW5nQ29udGV4dGAuIFdoZW4gYSBzdHlsaW5nIGNvbnRleHQgaXMgY3JlYXRlZCBpdFxuICogd2lsbCBjb3B5IG92ZXIgYW4gaW5pdGlhbCBzdHlsaW5nIHZhbHVlcyBmcm9tIHRoZSB0Tm9kZSAod2hpY2ggYXJlIHN0b3JlZCBhcyBhXG4gKiBgU3R5bGluZ01hcEFycmF5YCBvbiB0aGUgYHROb2RlLmNsYXNzZXNgIG9yIGB0Tm9kZS5zdHlsZXNgIHZhbHVlcykuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRTdHlsaW5nTWFwQXJyYXkodmFsdWU6IFRTdHlsaW5nQ29udGV4dCB8IFN0eWxpbmdNYXBBcnJheSB8IG51bGwpOlxuICAgIFN0eWxpbmdNYXBBcnJheXxudWxsIHtcbiAgcmV0dXJuIGlzU3R5bGluZ0NvbnRleHQodmFsdWUpID9cbiAgICAgICh2YWx1ZSBhcyBUU3R5bGluZ0NvbnRleHQpW1RTdHlsaW5nQ29udGV4dEluZGV4LkluaXRpYWxTdHlsaW5nVmFsdWVQb3NpdGlvbl0gOlxuICAgICAgdmFsdWUgYXMgU3R5bGluZ01hcEFycmF5O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNTdHlsaW5nQ29udGV4dCh2YWx1ZTogYW55KTogYm9vbGVhbiB7XG4gIC8vIHRoZSBTdHlsaW5nTWFwQXJyYXkgaXMgaW4gdGhlIGZvcm1hdCBvZiBbaW5pdGlhbCwgcHJvcCwgc3RyaW5nLCBwcm9wLCBzdHJpbmddXG4gIC8vIGFuZCB0aGlzIGlzIHRoZSBkZWZpbmluZyB2YWx1ZSB0byBkaXN0aW5ndWlzaCBiZXR3ZWVuIGFycmF5c1xuICByZXR1cm4gQXJyYXkuaXNBcnJheSh2YWx1ZSkgJiYgdmFsdWUubGVuZ3RoID49IFRTdHlsaW5nQ29udGV4dEluZGV4LlZhbHVlc1N0YXJ0UG9zaXRpb24gJiZcbiAgICAgIHR5cGVvZiB2YWx1ZVsxXSAhPT0gJ3N0cmluZyc7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc1N0eWxpbmdNYXBBcnJheSh2YWx1ZTogVFN0eWxpbmdDb250ZXh0IHwgU3R5bGluZ01hcEFycmF5IHwgbnVsbCk6IGJvb2xlYW4ge1xuICAvLyB0aGUgU3R5bGluZ01hcEFycmF5IGlzIGluIHRoZSBmb3JtYXQgb2YgW2luaXRpYWwsIHByb3AsIHN0cmluZywgcHJvcCwgc3RyaW5nXVxuICAvLyBhbmQgdGhpcyBpcyB0aGUgZGVmaW5pbmcgdmFsdWUgdG8gZGlzdGluZ3Vpc2ggYmV0d2VlbiBhcnJheXNcbiAgcmV0dXJuIEFycmF5LmlzQXJyYXkodmFsdWUpICYmXG4gICAgICAodHlwZW9mKHZhbHVlIGFzIFN0eWxpbmdNYXBBcnJheSlbU3R5bGluZ01hcEFycmF5SW5kZXguVmFsdWVzU3RhcnRQb3NpdGlvbl0gPT09ICdzdHJpbmcnKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEluaXRpYWxTdHlsaW5nVmFsdWUoY29udGV4dDogVFN0eWxpbmdDb250ZXh0IHwgU3R5bGluZ01hcEFycmF5IHwgbnVsbCk6IHN0cmluZyB7XG4gIGNvbnN0IG1hcCA9IGdldFN0eWxpbmdNYXBBcnJheShjb250ZXh0KTtcbiAgcmV0dXJuIG1hcCAmJiAobWFwW1N0eWxpbmdNYXBBcnJheUluZGV4LlJhd1ZhbHVlUG9zaXRpb25dIGFzIHN0cmluZyB8IG51bGwpIHx8ICcnO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaGFzQ2xhc3NJbnB1dCh0Tm9kZTogVE5vZGUpIHtcbiAgcmV0dXJuICh0Tm9kZS5mbGFncyAmIFROb2RlRmxhZ3MuaGFzQ2xhc3NJbnB1dCkgIT09IDA7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBoYXNTdHlsZUlucHV0KHROb2RlOiBUTm9kZSkge1xuICByZXR1cm4gKHROb2RlLmZsYWdzICYgVE5vZGVGbGFncy5oYXNTdHlsZUlucHV0KSAhPT0gMDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldE1hcFByb3AobWFwOiBTdHlsaW5nTWFwQXJyYXksIGluZGV4OiBudW1iZXIpOiBzdHJpbmcge1xuICByZXR1cm4gbWFwW2luZGV4ICsgU3R5bGluZ01hcEFycmF5SW5kZXguUHJvcE9mZnNldF0gYXMgc3RyaW5nO1xufVxuXG5jb25zdCBNQVBfRElSVFlfVkFMVUUgPVxuICAgIHR5cGVvZiBuZ0Rldk1vZGUgIT09ICd1bmRlZmluZWQnICYmIG5nRGV2TW9kZSA/IHt9IDoge01BUF9ESVJUWV9WQUxVRTogdHJ1ZX07XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXRNYXBBc0RpcnR5KG1hcDogU3R5bGluZ01hcEFycmF5KTogdm9pZCB7XG4gIG1hcFtTdHlsaW5nTWFwQXJyYXlJbmRleC5SYXdWYWx1ZVBvc2l0aW9uXSA9IE1BUF9ESVJUWV9WQUxVRTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNldE1hcFZhbHVlKFxuICAgIG1hcDogU3R5bGluZ01hcEFycmF5LCBpbmRleDogbnVtYmVyLCB2YWx1ZTogc3RyaW5nIHwgYm9vbGVhbiB8IG51bGwpOiB2b2lkIHtcbiAgbWFwW2luZGV4ICsgU3R5bGluZ01hcEFycmF5SW5kZXguVmFsdWVPZmZzZXRdID0gdmFsdWU7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRNYXBWYWx1ZShtYXA6IFN0eWxpbmdNYXBBcnJheSwgaW5kZXg6IG51bWJlcik6IHN0cmluZ3xudWxsIHtcbiAgcmV0dXJuIG1hcFtpbmRleCArIFN0eWxpbmdNYXBBcnJheUluZGV4LlZhbHVlT2Zmc2V0XSBhcyBzdHJpbmcgfCBudWxsO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZm9yY2VDbGFzc2VzQXNTdHJpbmcoY2xhc3Nlczogc3RyaW5nIHwge1trZXk6IHN0cmluZ106IGFueX0gfCBudWxsIHwgdW5kZWZpbmVkKTpcbiAgICBzdHJpbmcge1xuICBpZiAoY2xhc3NlcyAmJiB0eXBlb2YgY2xhc3NlcyAhPT0gJ3N0cmluZycpIHtcbiAgICBjbGFzc2VzID0gT2JqZWN0LmtleXMoY2xhc3Nlcykuam9pbignICcpO1xuICB9XG4gIHJldHVybiAoY2xhc3NlcyBhcyBzdHJpbmcpIHx8ICcnO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZm9yY2VTdHlsZXNBc1N0cmluZyhzdHlsZXM6IHtba2V5OiBzdHJpbmddOiBhbnl9IHwgbnVsbCB8IHVuZGVmaW5lZCk6IHN0cmluZyB7XG4gIGxldCBzdHIgPSAnJztcbiAgaWYgKHN0eWxlcykge1xuICAgIGNvbnN0IHByb3BzID0gT2JqZWN0LmtleXMoc3R5bGVzKTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHByb3BzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBwcm9wID0gcHJvcHNbaV07XG4gICAgICBzdHIgPSBjb25jYXRTdHJpbmcoc3RyLCBgJHtwcm9wfToke3N0eWxlc1twcm9wXX1gLCAnOycpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gc3RyO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNIb3N0U3R5bGluZ0FjdGl2ZShkaXJlY3RpdmVPclNvdXJjZUlkOiBudW1iZXIpOiBib29sZWFuIHtcbiAgcmV0dXJuIGRpcmVjdGl2ZU9yU291cmNlSWQgIT09IFRFTVBMQVRFX0RJUkVDVElWRV9JTkRFWDtcbn1cblxuLyoqXG4gKiBDb252ZXJ0cyB0aGUgcHJvdmlkZWQgc3R5bGluZyBtYXAgYXJyYXkgaW50byBhIHN0cmluZy5cbiAqXG4gKiBDbGFzc2VzID0+IGBvbmUgdHdvIHRocmVlYFxuICogU3R5bGVzID0+IGBwcm9wOnZhbHVlOyBwcm9wMjp2YWx1ZTJgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzdHlsaW5nTWFwVG9TdHJpbmcobWFwOiBTdHlsaW5nTWFwQXJyYXksIGlzQ2xhc3NCYXNlZDogYm9vbGVhbik6IHN0cmluZyB7XG4gIGxldCBzdHIgPSAnJztcbiAgZm9yIChsZXQgaSA9IFN0eWxpbmdNYXBBcnJheUluZGV4LlZhbHVlc1N0YXJ0UG9zaXRpb247IGkgPCBtYXAubGVuZ3RoO1xuICAgICAgIGkgKz0gU3R5bGluZ01hcEFycmF5SW5kZXguVHVwbGVTaXplKSB7XG4gICAgY29uc3QgcHJvcCA9IGdldE1hcFByb3AobWFwLCBpKTtcbiAgICBjb25zdCB2YWx1ZSA9IGdldE1hcFZhbHVlKG1hcCwgaSkgYXMgc3RyaW5nO1xuICAgIGNvbnN0IGF0dHJWYWx1ZSA9IGNvbmNhdFN0cmluZyhwcm9wLCBpc0NsYXNzQmFzZWQgPyAnJyA6IHZhbHVlLCAnOicpO1xuICAgIHN0ciA9IGNvbmNhdFN0cmluZyhzdHIsIGF0dHJWYWx1ZSwgaXNDbGFzc0Jhc2VkID8gJyAnIDogJzsgJyk7XG4gIH1cbiAgcmV0dXJuIHN0cjtcbn1cblxuLyoqXG4gKiBDb252ZXJ0cyB0aGUgcHJvdmlkZWQgc3R5bGluZyBtYXAgYXJyYXkgaW50byBhIGtleSB2YWx1ZSBtYXAuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzdHlsaW5nTWFwVG9TdHJpbmdNYXAobWFwOiBTdHlsaW5nTWFwQXJyYXkgfCBudWxsKToge1trZXk6IHN0cmluZ106IGFueX0ge1xuICBsZXQgc3RyaW5nTWFwOiB7W2tleTogc3RyaW5nXTogYW55fSA9IHt9O1xuICBpZiAobWFwKSB7XG4gICAgZm9yIChsZXQgaSA9IFN0eWxpbmdNYXBBcnJheUluZGV4LlZhbHVlc1N0YXJ0UG9zaXRpb247IGkgPCBtYXAubGVuZ3RoO1xuICAgICAgICAgaSArPSBTdHlsaW5nTWFwQXJyYXlJbmRleC5UdXBsZVNpemUpIHtcbiAgICAgIGNvbnN0IHByb3AgPSBnZXRNYXBQcm9wKG1hcCwgaSk7XG4gICAgICBjb25zdCB2YWx1ZSA9IGdldE1hcFZhbHVlKG1hcCwgaSkgYXMgc3RyaW5nO1xuICAgICAgc3RyaW5nTWFwW3Byb3BdID0gdmFsdWU7XG4gICAgfVxuICB9XG4gIHJldHVybiBzdHJpbmdNYXA7XG59XG5cbi8qKlxuICogSW5zZXJ0cyB0aGUgcHJvdmlkZWQgaXRlbSBpbnRvIHRoZSBwcm92aWRlZCBzdHlsaW5nIGFycmF5IGF0IHRoZSByaWdodCBzcG90LlxuICpcbiAqIFRoZSBgU3R5bGluZ01hcEFycmF5YCB0eXBlIGlzIGEgc29ydGVkIGtleS92YWx1ZSBhcnJheSBvZiBlbnRyaWVzLiBUaGlzIG1lYW5zXG4gKiB0aGF0IHdoZW4gYSBuZXcgZW50cnkgaXMgaW5zZXJ0ZWQgaXQgbXVzdCBiZSBwbGFjZWQgYXQgdGhlIHJpZ2h0IHNwb3QgaW4gdGhlXG4gKiBhcnJheS4gVGhpcyBmdW5jdGlvbiBmaWd1cmVzIG91dCBleGFjdGx5IHdoZXJlIHRvIHBsYWNlIGl0LlxuICovXG5leHBvcnQgZnVuY3Rpb24gYWRkSXRlbVRvU3R5bGluZ01hcChcbiAgICBzdHlsaW5nTWFwQXJyOiBTdHlsaW5nTWFwQXJyYXksIHByb3A6IHN0cmluZywgdmFsdWU6IHN0cmluZyB8IGJvb2xlYW4gfCBudWxsLFxuICAgIGFsbG93T3ZlcndyaXRlPzogYm9vbGVhbikge1xuICBmb3IgKGxldCBqID0gU3R5bGluZ01hcEFycmF5SW5kZXguVmFsdWVzU3RhcnRQb3NpdGlvbjsgaiA8IHN0eWxpbmdNYXBBcnIubGVuZ3RoO1xuICAgICAgIGogKz0gU3R5bGluZ01hcEFycmF5SW5kZXguVHVwbGVTaXplKSB7XG4gICAgY29uc3QgcHJvcEF0SW5kZXggPSBnZXRNYXBQcm9wKHN0eWxpbmdNYXBBcnIsIGopO1xuICAgIGlmIChwcm9wIDw9IHByb3BBdEluZGV4KSB7XG4gICAgICBsZXQgYXBwbGllZCA9IGZhbHNlO1xuICAgICAgaWYgKHByb3BBdEluZGV4ID09PSBwcm9wKSB7XG4gICAgICAgIGNvbnN0IHZhbHVlQXRJbmRleCA9IHN0eWxpbmdNYXBBcnJbal07XG4gICAgICAgIGlmIChhbGxvd092ZXJ3cml0ZSB8fCAhaXNTdHlsaW5nVmFsdWVEZWZpbmVkKHZhbHVlQXRJbmRleCkpIHtcbiAgICAgICAgICBhcHBsaWVkID0gdHJ1ZTtcbiAgICAgICAgICBzZXRNYXBWYWx1ZShzdHlsaW5nTWFwQXJyLCBqLCB2YWx1ZSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGFwcGxpZWQgPSB0cnVlO1xuICAgICAgICBzdHlsaW5nTWFwQXJyLnNwbGljZShqLCAwLCBwcm9wLCB2YWx1ZSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gYXBwbGllZDtcbiAgICB9XG4gIH1cblxuICBzdHlsaW5nTWFwQXJyLnB1c2gocHJvcCwgdmFsdWUpO1xuICByZXR1cm4gdHJ1ZTtcbn1cblxuLyoqXG4gKiBVc2VkIHRvIGNvbnZlcnQgYSB7a2V5OnZhbHVlfSBtYXAgaW50byBhIGBTdHlsaW5nTWFwQXJyYXlgIGFycmF5LlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gd2lsbCBlaXRoZXIgZ2VuZXJhdGUgYSBuZXcgYFN0eWxpbmdNYXBBcnJheWAgaW5zdGFuY2VcbiAqIG9yIGl0IHdpbGwgcGF0Y2ggdGhlIHByb3ZpZGVkIGBuZXdWYWx1ZXNgIG1hcCB2YWx1ZSBpbnRvIGFuXG4gKiBleGlzdGluZyBgU3R5bGluZ01hcEFycmF5YCB2YWx1ZSAodGhpcyBvbmx5IGhhcHBlbnMgaWYgYGJpbmRpbmdWYWx1ZWBcbiAqIGlzIGFuIGluc3RhbmNlIG9mIGBTdHlsaW5nTWFwQXJyYXlgKS5cbiAqXG4gKiBJZiBhIG5ldyBrZXkvdmFsdWUgbWFwIGlzIHByb3ZpZGVkIHdpdGggYW4gb2xkIGBTdHlsaW5nTWFwQXJyYXlgXG4gKiB2YWx1ZSB0aGVuIGFsbCBwcm9wZXJ0aWVzIHdpbGwgYmUgb3ZlcndyaXR0ZW4gd2l0aCB0aGVpciBuZXdcbiAqIHZhbHVlcyBvciB3aXRoIGBudWxsYC4gVGhpcyBtZWFucyB0aGF0IHRoZSBhcnJheSB3aWxsIG5ldmVyXG4gKiBzaHJpbmsgaW4gc2l6ZSAoYnV0IGl0IHdpbGwgYWxzbyBub3QgYmUgY3JlYXRlZCBhbmQgdGhyb3duXG4gKiBhd2F5IHdoZW5ldmVyIHRoZSBge2tleTp2YWx1ZX1gIG1hcCBlbnRyaWVzIGNoYW5nZSkuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBub3JtYWxpemVJbnRvU3R5bGluZ01hcChcbiAgICBiaW5kaW5nVmFsdWU6IG51bGwgfCBTdHlsaW5nTWFwQXJyYXksXG4gICAgbmV3VmFsdWVzOiB7W2tleTogc3RyaW5nXTogYW55fSB8IHN0cmluZyB8IG51bGwgfCB1bmRlZmluZWQsXG4gICAgbm9ybWFsaXplUHJvcHM/OiBib29sZWFuKTogU3R5bGluZ01hcEFycmF5IHtcbiAgY29uc3Qgc3R5bGluZ01hcEFycjogU3R5bGluZ01hcEFycmF5ID0gQXJyYXkuaXNBcnJheShiaW5kaW5nVmFsdWUpID8gYmluZGluZ1ZhbHVlIDogW251bGxdO1xuICBzdHlsaW5nTWFwQXJyW1N0eWxpbmdNYXBBcnJheUluZGV4LlJhd1ZhbHVlUG9zaXRpb25dID0gbmV3VmFsdWVzIHx8IG51bGw7XG5cbiAgLy8gYmVjYXVzZSB0aGUgbmV3IHZhbHVlcyBtYXkgbm90IGluY2x1ZGUgYWxsIHRoZSBwcm9wZXJ0aWVzXG4gIC8vIHRoYXQgdGhlIG9sZCBvbmVzIGhhZCwgYWxsIHZhbHVlcyBhcmUgc2V0IHRvIGBudWxsYCBiZWZvcmVcbiAgLy8gdGhlIG5ldyB2YWx1ZXMgYXJlIGFwcGxpZWQuIFRoaXMgd2F5LCB3aGVuIGZsdXNoZWQsIHRoZVxuICAvLyBzdHlsaW5nIGFsZ29yaXRobSBrbm93cyBleGFjdGx5IHdoYXQgc3R5bGUvY2xhc3MgdmFsdWVzXG4gIC8vIHRvIHJlbW92ZSBmcm9tIHRoZSBlbGVtZW50IChzaW5jZSB0aGV5IGFyZSBgbnVsbGApLlxuICBmb3IgKGxldCBqID0gU3R5bGluZ01hcEFycmF5SW5kZXguVmFsdWVzU3RhcnRQb3NpdGlvbjsgaiA8IHN0eWxpbmdNYXBBcnIubGVuZ3RoO1xuICAgICAgIGogKz0gU3R5bGluZ01hcEFycmF5SW5kZXguVHVwbGVTaXplKSB7XG4gICAgc2V0TWFwVmFsdWUoc3R5bGluZ01hcEFyciwgaiwgbnVsbCk7XG4gIH1cblxuICBsZXQgcHJvcHM6IHN0cmluZ1tdfG51bGwgPSBudWxsO1xuICBsZXQgbWFwOiB7W2tleTogc3RyaW5nXTogYW55fXx1bmRlZmluZWR8bnVsbDtcbiAgbGV0IGFsbFZhbHVlc1RydWUgPSBmYWxzZTtcbiAgaWYgKHR5cGVvZiBuZXdWYWx1ZXMgPT09ICdzdHJpbmcnKSB7ICAvLyBbY2xhc3NdIGJpbmRpbmdzIGFsbG93IHN0cmluZyB2YWx1ZXNcbiAgICBpZiAobmV3VmFsdWVzLmxlbmd0aCkge1xuICAgICAgcHJvcHMgPSBuZXdWYWx1ZXMuc3BsaXQoL1xccysvKTtcbiAgICAgIGFsbFZhbHVlc1RydWUgPSB0cnVlO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBwcm9wcyA9IG5ld1ZhbHVlcyA/IE9iamVjdC5rZXlzKG5ld1ZhbHVlcykgOiBudWxsO1xuICAgIG1hcCA9IG5ld1ZhbHVlcztcbiAgfVxuXG4gIGlmIChwcm9wcykge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcHJvcHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IHByb3AgPSBwcm9wc1tpXSBhcyBzdHJpbmc7XG4gICAgICBjb25zdCBuZXdQcm9wID0gbm9ybWFsaXplUHJvcHMgPyBoeXBoZW5hdGUocHJvcCkgOiBwcm9wO1xuICAgICAgY29uc3QgdmFsdWUgPSBhbGxWYWx1ZXNUcnVlID8gdHJ1ZSA6IG1hcCAhW3Byb3BdO1xuICAgICAgYWRkSXRlbVRvU3R5bGluZ01hcChzdHlsaW5nTWFwQXJyLCBuZXdQcm9wLCB2YWx1ZSwgdHJ1ZSk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHN0eWxpbmdNYXBBcnI7XG59XG4iXX0=