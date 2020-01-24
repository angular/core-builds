/**
* @license
* Copyright Google Inc. All Rights Reserved.
*
* Use of this source code is governed by an MIT-style license that can be
* found in the LICENSE file at https://angular.io/license
*/
import { unwrapSafeValue } from '../../sanitization/bypass';
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
    return [
        DEFAULT_TOTAL_SOURCES,
        initialStyling,
    ];
}
export function allocStylingMapArray(value) {
    return [value];
}
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
 */
export function allowDirectStyling(tNode, isClassBased, firstUpdatePass) {
    var allow = false;
    // if no directives are present then we do not need populate a context at all. This
    // is because duplicate prop bindings cannot be registered through the template. If
    // and when this happens we can safely apply the value directly without context
    // resolution...
    var hasDirectives = hasConfig(tNode, 128 /* hasHostBindings */);
    if (!hasDirectives) {
        // `ngDevMode` is required to be checked here because tests/debugging rely on the context being
        // populated. If things are in production mode then there is no need to build a context
        // therefore the direct apply can be allowed (even on the first update).
        allow = ngDevMode ? !firstUpdatePass : true;
    }
    else if (!firstUpdatePass) {
        var duplicateStylingFlag = isClassBased ? 8192 /* hasDuplicateClassBindings */ : 262144 /* hasDuplicateStyleBindings */;
        var hasDuplicates = hasConfig(tNode, duplicateStylingFlag);
        var hasOnlyMapOrPropsFlag = isClassBased ? 1536 /* hasClassPropAndMapBindings */ :
            49152 /* hasStylePropAndMapBindings */;
        var hasOnlyMapsOrOnlyProps = (tNode.flags & hasOnlyMapOrPropsFlag) !== hasOnlyMapOrPropsFlag;
        allow = !hasDuplicates && hasOnlyMapsOrOnlyProps;
    }
    return allow;
}
export function patchConfig(tNode, flag) {
    tNode.flags |= flag;
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
    return context[0 /* TotalSourcesPosition */];
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
export function getPropValuesStartPosition(context, tNode, isClassBased) {
    var startPosition = 2 /* ValuesStartPosition */;
    var flag = isClassBased ? 512 /* hasClassMapBindings */ : 16384 /* hasStyleMapBindings */;
    if (hasConfig(tNode, flag)) {
        startPosition += 4 /* BindingsStartOffset */ + getValuesCount(context);
    }
    return startPosition;
}
export function hasValueChangedUnwrapSafeValue(a, b) {
    return hasValueChanged(unwrapSafeValue(a), unwrapSafeValue(b));
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
        value[1 /* InitialStylingValuePosition */] :
        value;
}
export function isStylingContext(value) {
    // the StylingMapArray is in the format of [initial, prop, string, prop, string]
    // and this is the defining value to distinguish between arrays
    return Array.isArray(value) && value.length >= 2 /* ValuesStartPosition */ &&
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3R5bGluZ191dGlscy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvdXRpbC9zdHlsaW5nX3V0aWxzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7RUFNRTtBQUNGLE9BQU8sRUFBQyxlQUFlLEVBQUMsTUFBTSwyQkFBMkIsQ0FBQztBQUcxRCxPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sV0FBVyxDQUFDO0FBRXBDLE1BQU0sQ0FBQyxJQUFNLHlCQUF5QixHQUFHLE9BQU8sQ0FBQztBQUNqRCxNQUFNLENBQUMsSUFBTSx3QkFBd0IsR0FBRyxDQUFDLENBQUM7QUFFMUM7Ozs7Ozs7R0FPRztBQUNILE1BQU0sQ0FBQyxJQUFNLHFCQUFxQixHQUFHLElBQUksQ0FBQztBQUUxQyxNQUFNLENBQUMsSUFBTSxxQkFBcUIsR0FBRyxDQUFDLENBQUM7QUFFdkMsSUFBTSxxQkFBcUIsR0FBRyxDQUFDLENBQUM7QUFFaEMsZ0VBQWdFO0FBQ2hFLGtFQUFrRTtBQUNsRSxrRUFBa0U7QUFDbEUsaUVBQWlFO0FBQ2pFLDJCQUEyQjtBQUMzQixNQUFNLENBQUMsSUFBTSx3QkFBd0IsR0FBRyxDQUFHLENBQUM7QUFFNUM7Ozs7Ozs7R0FPRztBQUNILE1BQU0sVUFBVSxvQkFBb0IsQ0FDaEMsY0FBc0MsRUFBRSxhQUFzQjtJQUNoRSxjQUFjLEdBQUcsY0FBYyxJQUFJLG9CQUFvQixDQUFDLElBQUksQ0FBQyxDQUFDO0lBQzlELE9BQU87UUFDTCxxQkFBcUI7UUFDckIsY0FBYztLQUNmLENBQUM7QUFDSixDQUFDO0FBRUQsTUFBTSxVQUFVLG9CQUFvQixDQUFDLEtBQXlCO0lBQzVELE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUNqQixDQUFDO0FBRUQsTUFBTSxVQUFVLFNBQVMsQ0FBQyxLQUFtQixFQUFFLElBQWdCO0lBQzdELE9BQU8sQ0FBQyxLQUFLLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUNwQyxDQUFDO0FBRUQ7Ozs7Ozs7Ozs7R0FVRztBQUNILE1BQU0sVUFBVSxrQkFBa0IsQ0FDOUIsS0FBbUIsRUFBRSxZQUFxQixFQUFFLGVBQXdCO0lBQ3RFLElBQUksS0FBSyxHQUFHLEtBQUssQ0FBQztJQUVsQixtRkFBbUY7SUFDbkYsbUZBQW1GO0lBQ25GLCtFQUErRTtJQUMvRSxnQkFBZ0I7SUFDaEIsSUFBTSxhQUFhLEdBQUcsU0FBUyxDQUFDLEtBQUssNEJBQTZCLENBQUM7SUFDbkUsSUFBSSxDQUFDLGFBQWEsRUFBRTtRQUNsQiwrRkFBK0Y7UUFDL0YsdUZBQXVGO1FBQ3ZGLHdFQUF3RTtRQUN4RSxLQUFLLEdBQUcsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO0tBQzdDO1NBQU0sSUFBSSxDQUFDLGVBQWUsRUFBRTtRQUMzQixJQUFNLG9CQUFvQixHQUN0QixZQUFZLENBQUMsQ0FBQyxzQ0FBc0MsQ0FBQyx1Q0FBcUMsQ0FBQztRQUMvRixJQUFNLGFBQWEsR0FBRyxTQUFTLENBQUMsS0FBSyxFQUFFLG9CQUFvQixDQUFDLENBQUM7UUFDN0QsSUFBTSxxQkFBcUIsR0FBRyxZQUFZLENBQUMsQ0FBQyx1Q0FBdUMsQ0FBQztrREFDRixDQUFDO1FBQ25GLElBQU0sc0JBQXNCLEdBQUcsQ0FBQyxLQUFLLENBQUMsS0FBSyxHQUFHLHFCQUFxQixDQUFDLEtBQUsscUJBQXFCLENBQUM7UUFDL0YsS0FBSyxHQUFHLENBQUMsYUFBYSxJQUFJLHNCQUFzQixDQUFDO0tBQ2xEO0lBRUQsT0FBTyxLQUFLLENBQUM7QUFDZixDQUFDO0FBRUQsTUFBTSxVQUFVLFdBQVcsQ0FBQyxLQUFtQixFQUFFLElBQWdCO0lBQy9ELEtBQUssQ0FBQyxLQUFLLElBQUksSUFBSSxDQUFDO0FBQ3RCLENBQUM7QUFFRCxNQUFNLFVBQVUsT0FBTyxDQUFDLE9BQXdCLEVBQUUsS0FBYTtJQUM3RCxPQUFPLE9BQU8sQ0FBQyxLQUFLLHFCQUFrQyxDQUFXLENBQUM7QUFDcEUsQ0FBQztBQUVELFNBQVMsYUFBYSxDQUFDLE9BQXdCLEVBQUUsS0FBYTtJQUM1RCxPQUFRLE9BQU8sQ0FBQyxLQUFLLHVCQUFvQyxDQUFZO29CQUM5QixDQUFDO0FBQzFDLENBQUM7QUFFRCxNQUFNLFVBQVUsc0JBQXNCLENBQUMsT0FBd0IsRUFBRSxLQUFhO0lBQzVFLE9BQU8sQ0FBQyxhQUFhLENBQUMsT0FBTyxFQUFFLEtBQUssQ0FBQywrQkFBc0QsQ0FBQztRQUN4RixDQUFDLENBQUM7QUFDUixDQUFDO0FBRUQsTUFBTSxVQUFVLFlBQVksQ0FDeEIsT0FBd0IsRUFBRSxLQUFhLEVBQUUsYUFBc0I7SUFDakUsSUFBTSxRQUFRLEdBQUcsS0FBSyxHQUFHLENBQUMsYUFBYSxDQUFDLENBQUMsb0NBQWlELENBQUM7c0NBQ04sQ0FBQyxDQUFDO0lBQ3ZGLE9BQU8sT0FBTyxDQUFDLFFBQVEsQ0FBVyxDQUFDO0FBQ3JDLENBQUM7QUFFRCxNQUFNLFVBQVUsWUFBWSxDQUN4QixPQUF3QixFQUFFLEtBQWEsRUFBRSxTQUFpQixFQUFFLGFBQXNCO0lBQ3BGLElBQU0sUUFBUSxHQUFHLEtBQUssR0FBRyxDQUFDLGFBQWEsQ0FBQyxDQUFDLG9DQUFpRCxDQUFDO3NDQUNOLENBQUMsQ0FBQztJQUN2RixPQUFPLENBQUMsUUFBUSxDQUFDLEdBQUcsU0FBUyxDQUFDO0FBQ2hDLENBQUM7QUFFRCxNQUFNLFVBQVUsY0FBYyxDQUFDLE9BQXdCO0lBQ3JELE9BQU8sZUFBZSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUN0QyxDQUFDO0FBRUQsTUFBTSxVQUFVLGVBQWUsQ0FBQyxPQUF3QjtJQUN0RCxPQUFPLE9BQU8sOEJBQTJDLENBQUM7QUFDNUQsQ0FBQztBQUVELE1BQU0sVUFBVSxlQUFlLENBQUMsT0FBd0IsRUFBRSxLQUFhLEVBQUUsTUFBYztJQUNyRixPQUFPLE9BQU8sQ0FBQyxLQUFLLDhCQUEyQyxHQUFHLE1BQU0sQ0FBb0IsQ0FBQztBQUMvRixDQUFDO0FBRUQsTUFBTSxVQUFVLGVBQWUsQ0FBQyxPQUF3QixFQUFFLEtBQWE7SUFDckUsT0FBTyxPQUFPLENBQUMsS0FBSyw4QkFBMkMsR0FBRyxlQUFlLENBQUMsT0FBTyxDQUFDLENBRXhFLENBQUM7QUFDckIsQ0FBQztBQUVELE1BQU0sVUFBVSxlQUFlLENBQzNCLE9BQXdCLEVBQUUsS0FBYSxFQUFFLEtBQThCO0lBQ3pFLE9BQU8sT0FBTyxDQUFDLEtBQUssOEJBQTJDLEdBQUcsZUFBZSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ2hGLEtBQUssQ0FBQztBQUNuQixDQUFDO0FBRUQsTUFBTSxVQUFVLFFBQVEsQ0FBQyxJQUFrQixFQUFFLFlBQW9CLEVBQUUsS0FBVTtJQUMzRSxJQUFJLENBQUMsWUFBWSxDQUFDLEdBQUcsS0FBSyxDQUFDO0FBQzdCLENBQUM7QUFFRCxNQUFNLFVBQVUsUUFBUSxDQUFVLElBQWtCLEVBQUUsWUFBb0I7SUFDeEUsT0FBTyxZQUFZLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFNLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztBQUM3RCxDQUFDO0FBRUQsTUFBTSxVQUFVLDBCQUEwQixDQUN0QyxPQUF3QixFQUFFLEtBQW1CLEVBQUUsWUFBcUI7SUFDdEUsSUFBSSxhQUFhLDhCQUEyQyxDQUFDO0lBQzdELElBQU0sSUFBSSxHQUFHLFlBQVksQ0FBQyxDQUFDLCtCQUFnQyxDQUFDLGdDQUErQixDQUFDO0lBQzVGLElBQUksU0FBUyxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsRUFBRTtRQUMxQixhQUFhLElBQUksOEJBQTJDLGNBQWMsQ0FBQyxPQUFPLENBQUMsQ0FBQztLQUNyRjtJQUNELE9BQU8sYUFBYSxDQUFDO0FBQ3ZCLENBQUM7QUFFRCxNQUFNLFVBQVUsOEJBQThCLENBQzFDLENBQTJGLEVBQzNGLENBQ007SUFDUixPQUFPLGVBQWUsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLEVBQUUsZUFBZSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDakUsQ0FBQztBQUdELE1BQU0sVUFBVSxlQUFlLENBQzNCLENBQWtGLEVBQ2xGLENBQWtGO0lBQ3BGLElBQUksQ0FBQyxLQUFLLFNBQVM7UUFBRSxPQUFPLEtBQUssQ0FBQztJQUVsQyxJQUFNLGFBQWEsR0FBRyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLDBCQUF1QyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDdEYsSUFBTSxhQUFhLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQywwQkFBdUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3RGLE9BQU8sQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLGFBQWEsRUFBRSxhQUFhLENBQUMsQ0FBQztBQUNsRCxDQUFDO0FBRUQ7O0dBRUc7QUFDSCxNQUFNLFVBQVUscUJBQXFCLENBQTRDLEtBQVE7SUFFdkYscURBQXFEO0lBQ3JELG1EQUFtRDtJQUNuRCxzREFBc0Q7SUFDdEQscURBQXFEO0lBQ3JELCtDQUErQztJQUMvQyxPQUFPLEtBQUssSUFBSSxJQUFJLElBQUksS0FBSyxLQUFLLEVBQUUsQ0FBQztBQUN2QyxDQUFDO0FBRUQsTUFBTSxVQUFVLFlBQVksQ0FBQyxDQUFTLEVBQUUsQ0FBUyxFQUFFLFNBQWU7SUFBZiwwQkFBQSxFQUFBLGVBQWU7SUFDaEUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLElBQUksQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUMzRCxDQUFDO0FBRUQsTUFBTSxVQUFVLFNBQVMsQ0FBQyxLQUFhO0lBQ3JDLE9BQU8sS0FBSyxDQUFDLE9BQU8sQ0FBQyxhQUFhLEVBQUUsVUFBQSxDQUFDLElBQUksT0FBQSxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUcsR0FBRyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUEvQixDQUErQixDQUFDLENBQUMsV0FBVyxFQUFFLENBQUM7QUFDMUYsQ0FBQztBQUVEOzs7Ozs7O0dBT0c7QUFDSCxNQUFNLFVBQVUsa0JBQWtCLENBQUMsS0FBK0M7SUFFaEYsT0FBTyxnQkFBZ0IsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1FBQzNCLEtBQXlCLHFDQUFrRCxDQUFDLENBQUM7UUFDOUUsS0FBd0IsQ0FBQztBQUMvQixDQUFDO0FBRUQsTUFBTSxVQUFVLGdCQUFnQixDQUFDLEtBQVU7SUFDekMsZ0ZBQWdGO0lBQ2hGLCtEQUErRDtJQUMvRCxPQUFPLEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLElBQUksS0FBSyxDQUFDLE1BQU0sK0JBQTRDO1FBQ25GLE9BQU8sS0FBSyxDQUFDLENBQUMsQ0FBQyxLQUFLLFFBQVEsQ0FBQztBQUNuQyxDQUFDO0FBRUQsTUFBTSxVQUFVLGlCQUFpQixDQUFDLEtBQVU7SUFDMUMsZ0ZBQWdGO0lBQ2hGLCtEQUErRDtJQUMvRCxPQUFPLEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDO1FBQ3ZCLENBQUMsT0FBTyxLQUF5Qiw2QkFBMEMsS0FBSyxRQUFRLENBQUMsQ0FBQztBQUNoRyxDQUFDO0FBRUQsTUFBTSxVQUFVLHNCQUFzQixDQUFDLE9BQWlEO0lBQ3RGLElBQU0sR0FBRyxHQUFHLGtCQUFrQixDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQ3hDLE9BQU8sR0FBRyxJQUFLLEdBQUcsMEJBQXlELElBQUksRUFBRSxDQUFDO0FBQ3BGLENBQUM7QUFFRCxNQUFNLFVBQVUsYUFBYSxDQUFDLEtBQW1CO0lBQy9DLE9BQU8sQ0FBQyxLQUFLLENBQUMsS0FBSyx5QkFBMkIsQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUN4RCxDQUFDO0FBRUQsTUFBTSxVQUFVLGFBQWEsQ0FBQyxLQUFtQjtJQUMvQyxPQUFPLENBQUMsS0FBSyxDQUFDLEtBQUsseUJBQTJCLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDeEQsQ0FBQztBQUVELE1BQU0sVUFBVSxVQUFVLENBQUMsR0FBb0IsRUFBRSxLQUFhO0lBQzVELE9BQU8sR0FBRyxDQUFDLEtBQUsscUJBQWtDLENBQVcsQ0FBQztBQUNoRSxDQUFDO0FBRUQsSUFBTSxlQUFlLEdBQ2pCLE9BQU8sU0FBUyxLQUFLLFdBQVcsSUFBSSxTQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBQyxlQUFlLEVBQUUsSUFBSSxFQUFDLENBQUM7QUFFakYsTUFBTSxVQUFVLGFBQWEsQ0FBQyxHQUFvQjtJQUNoRCxHQUFHLDBCQUF1QyxHQUFHLGVBQWUsQ0FBQztBQUMvRCxDQUFDO0FBRUQsTUFBTSxVQUFVLFdBQVcsQ0FDdkIsR0FBb0IsRUFBRSxLQUFhLEVBQUUsS0FBOEI7SUFDckUsR0FBRyxDQUFDLEtBQUssc0JBQW1DLENBQUMsR0FBRyxLQUFLLENBQUM7QUFDeEQsQ0FBQztBQUVELE1BQU0sVUFBVSxXQUFXLENBQUMsR0FBb0IsRUFBRSxLQUFhO0lBQzdELE9BQU8sR0FBRyxDQUFDLEtBQUssc0JBQW1DLENBQWtCLENBQUM7QUFDeEUsQ0FBQztBQUVELE1BQU0sVUFBVSxvQkFBb0IsQ0FBQyxPQUF5RDtJQUU1RixJQUFJLE9BQU8sSUFBSSxPQUFPLE9BQU8sS0FBSyxRQUFRLEVBQUU7UUFDMUMsT0FBTyxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0tBQzFDO0lBQ0QsT0FBUSxPQUFrQixJQUFJLEVBQUUsQ0FBQztBQUNuQyxDQUFDO0FBRUQsTUFBTSxVQUFVLG1CQUFtQixDQUMvQixNQUF3RCxFQUFFLGNBQXVCO0lBQ25GLElBQUksT0FBTyxNQUFNLElBQUksUUFBUTtRQUFFLE9BQU8sTUFBTSxDQUFDO0lBQzdDLElBQUksR0FBRyxHQUFHLEVBQUUsQ0FBQztJQUNiLElBQUksTUFBTSxFQUFFO1FBQ1YsSUFBTSxLQUFLLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUNsQyxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtZQUNyQyxJQUFNLElBQUksR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDdEIsSUFBTSxTQUFTLEdBQUcsY0FBYyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztZQUMxRCxJQUFNLEtBQUssR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDM0IsSUFBSSxLQUFLLEtBQUssSUFBSSxFQUFFO2dCQUNsQixHQUFHLEdBQUcsWUFBWSxDQUFDLEdBQUcsRUFBSyxTQUFTLFNBQUksS0FBTyxFQUFFLEdBQUcsQ0FBQyxDQUFDO2FBQ3ZEO1NBQ0Y7S0FDRjtJQUNELE9BQU8sR0FBRyxDQUFDO0FBQ2IsQ0FBQztBQUVELE1BQU0sVUFBVSxtQkFBbUIsQ0FBQyxtQkFBMkI7SUFDN0QsT0FBTyxtQkFBbUIsS0FBSyx3QkFBd0IsQ0FBQztBQUMxRCxDQUFDO0FBRUQ7Ozs7O0dBS0c7QUFDSCxNQUFNLFVBQVUsa0JBQWtCLENBQUMsR0FBb0IsRUFBRSxZQUFxQjtJQUM1RSxJQUFJLEdBQUcsR0FBRyxFQUFFLENBQUM7SUFDYixLQUFLLElBQUksQ0FBQyw4QkFBMkMsRUFBRSxDQUFDLEdBQUcsR0FBRyxDQUFDLE1BQU0sRUFDaEUsQ0FBQyxxQkFBa0MsRUFBRTtRQUN4QyxJQUFNLElBQUksR0FBRyxVQUFVLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ2hDLElBQU0sS0FBSyxHQUFHLFdBQVcsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFXLENBQUM7UUFDNUMsSUFBTSxTQUFTLEdBQUcsWUFBWSxDQUFDLElBQUksRUFBRSxZQUFZLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBQ3JFLEdBQUcsR0FBRyxZQUFZLENBQUMsR0FBRyxFQUFFLFNBQVMsRUFBRSxZQUFZLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUM7S0FDL0Q7SUFDRCxPQUFPLEdBQUcsQ0FBQztBQUNiLENBQUM7QUFFRDs7R0FFRztBQUNILE1BQU0sVUFBVSxxQkFBcUIsQ0FBQyxHQUEyQjtJQUMvRCxJQUFJLFNBQVMsR0FBeUIsRUFBRSxDQUFDO0lBQ3pDLElBQUksR0FBRyxFQUFFO1FBQ1AsS0FBSyxJQUFJLENBQUMsOEJBQTJDLEVBQUUsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxNQUFNLEVBQ2hFLENBQUMscUJBQWtDLEVBQUU7WUFDeEMsSUFBTSxJQUFJLEdBQUcsVUFBVSxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNoQyxJQUFNLEtBQUssR0FBRyxXQUFXLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBVyxDQUFDO1lBQzVDLFNBQVMsQ0FBQyxJQUFJLENBQUMsR0FBRyxLQUFLLENBQUM7U0FDekI7S0FDRjtJQUNELE9BQU8sU0FBUyxDQUFDO0FBQ25CLENBQUM7QUFFRDs7Ozs7O0dBTUc7QUFDSCxNQUFNLFVBQVUsbUJBQW1CLENBQy9CLGFBQThCLEVBQUUsSUFBWSxFQUFFLEtBQThCLEVBQzVFLGNBQXdCO0lBQzFCLEtBQUssSUFBSSxDQUFDLDhCQUEyQyxFQUFFLENBQUMsR0FBRyxhQUFhLENBQUMsTUFBTSxFQUMxRSxDQUFDLHFCQUFrQyxFQUFFO1FBQ3hDLElBQU0sV0FBVyxHQUFHLFVBQVUsQ0FBQyxhQUFhLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDakQsSUFBSSxJQUFJLElBQUksV0FBVyxFQUFFO1lBQ3ZCLElBQUksT0FBTyxHQUFHLEtBQUssQ0FBQztZQUNwQixJQUFJLFdBQVcsS0FBSyxJQUFJLEVBQUU7Z0JBQ3hCLElBQU0sWUFBWSxHQUFHLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDdEMsSUFBSSxjQUFjLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxZQUFZLENBQUMsRUFBRTtvQkFDMUQsT0FBTyxHQUFHLElBQUksQ0FBQztvQkFDZixXQUFXLENBQUMsYUFBYSxFQUFFLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztpQkFDdEM7YUFDRjtpQkFBTTtnQkFDTCxPQUFPLEdBQUcsSUFBSSxDQUFDO2dCQUNmLGFBQWEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUM7YUFDekM7WUFDRCxPQUFPLE9BQU8sQ0FBQztTQUNoQjtLQUNGO0lBRUQsYUFBYSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDaEMsT0FBTyxJQUFJLENBQUM7QUFDZCxDQUFDO0FBRUQ7Ozs7Ozs7Ozs7Ozs7R0FhRztBQUNILE1BQU0sVUFBVSx1QkFBdUIsQ0FDbkMsWUFBb0MsRUFDcEMsU0FBMkQsRUFDM0QsY0FBd0I7SUFDMUIsSUFBTSxhQUFhLEdBQ2YsS0FBSyxDQUFDLE9BQU8sQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUM1RSxhQUFhLDBCQUF1QyxHQUFHLFNBQVMsQ0FBQztJQUVqRSw0REFBNEQ7SUFDNUQsNkRBQTZEO0lBQzdELDBEQUEwRDtJQUMxRCwwREFBMEQ7SUFDMUQsc0RBQXNEO0lBQ3RELEtBQUssSUFBSSxDQUFDLDhCQUEyQyxFQUFFLENBQUMsR0FBRyxhQUFhLENBQUMsTUFBTSxFQUMxRSxDQUFDLHFCQUFrQyxFQUFFO1FBQ3hDLFdBQVcsQ0FBQyxhQUFhLEVBQUUsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO0tBQ3JDO0lBRUQsSUFBSSxLQUFLLEdBQWtCLElBQUksQ0FBQztJQUNoQyxJQUFJLEdBQXdDLENBQUM7SUFDN0MsSUFBSSxhQUFhLEdBQUcsS0FBSyxDQUFDO0lBQzFCLElBQUksT0FBTyxTQUFTLEtBQUssUUFBUSxFQUFFLEVBQUcsdUNBQXVDO1FBQzNFLEtBQUssR0FBRyxpQkFBaUIsQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUNyQyxhQUFhLEdBQUcsS0FBSyxLQUFLLElBQUksQ0FBQztLQUNoQztTQUFNO1FBQ0wsS0FBSyxHQUFHLFNBQVMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO1FBQ2xELEdBQUcsR0FBRyxTQUFTLENBQUM7S0FDakI7SUFFRCxJQUFJLEtBQUssRUFBRTtRQUNULEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO1lBQ3JDLElBQU0sSUFBSSxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN0QixJQUFNLE9BQU8sR0FBRyxjQUFjLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO1lBQ3hELElBQU0sS0FBSyxHQUFHLGFBQWEsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDakQsbUJBQW1CLENBQUMsYUFBYSxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsSUFBSSxDQUFDLENBQUM7U0FDMUQ7S0FDRjtJQUVELE9BQU8sYUFBYSxDQUFDO0FBQ3ZCLENBQUM7QUFFRCxNQUFNLFVBQVUsaUJBQWlCLENBQUMsSUFBWTtJQUM1QyxJQUFJLEtBQUssR0FBa0IsSUFBSSxDQUFDO0lBQ2hDLElBQUksTUFBTSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUM7SUFDekIsSUFBSSxLQUFLLEdBQUcsQ0FBQyxDQUFDO0lBQ2QsSUFBSSxTQUFTLEdBQUcsS0FBSyxDQUFDO0lBQ3RCLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7UUFDL0IsSUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNoQyxJQUFJLElBQUksSUFBSSxFQUFFLENBQUMsT0FBTyxFQUFFO1lBQ3RCLElBQUksU0FBUyxFQUFFO2dCQUNiLElBQUksS0FBSyxLQUFLLElBQUk7b0JBQUUsS0FBSyxHQUFHLEVBQUUsQ0FBQztnQkFDL0IsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNyQyxTQUFTLEdBQUcsS0FBSyxDQUFDO2FBQ25CO1lBQ0QsS0FBSyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7U0FDZjthQUFNO1lBQ0wsU0FBUyxHQUFHLElBQUksQ0FBQztTQUNsQjtLQUNGO0lBQ0QsSUFBSSxTQUFTLEVBQUU7UUFDYixJQUFJLEtBQUssS0FBSyxJQUFJO1lBQUUsS0FBSyxHQUFHLEVBQUUsQ0FBQztRQUMvQixLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUM7UUFDMUMsU0FBUyxHQUFHLEtBQUssQ0FBQztLQUNuQjtJQUNELE9BQU8sS0FBSyxDQUFDO0FBQ2YsQ0FBQztBQUVELHlGQUF5RjtBQUN6Riw4Q0FBOEM7QUFDOUMsTUFBTSxVQUFVLHlCQUF5QixDQUFDLE1BQXVCO0lBQy9ELE9BQU8sTUFBTSxDQUFDLGNBQWMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUM7QUFDaEUsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuKiBAbGljZW5zZVxuKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbipcbiogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuKi9cbmltcG9ydCB7dW53cmFwU2FmZVZhbHVlfSBmcm9tICcuLi8uLi9zYW5pdGl6YXRpb24vYnlwYXNzJztcbmltcG9ydCB7UHJvcGVydHlBbGlhc2VzLCBUTm9kZUZsYWdzfSBmcm9tICcuLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtMU3R5bGluZ0RhdGEsIFN0eWxpbmdNYXBBcnJheSwgU3R5bGluZ01hcEFycmF5SW5kZXgsIFRTdHlsaW5nQ29udGV4dCwgVFN0eWxpbmdDb250ZXh0SW5kZXgsIFRTdHlsaW5nQ29udGV4dFByb3BDb25maWdGbGFncywgVFN0eWxpbmdOb2RlfSBmcm9tICcuLi9pbnRlcmZhY2VzL3N0eWxpbmcnO1xuaW1wb3J0IHtOT19DSEFOR0V9IGZyb20gJy4uL3Rva2Vucyc7XG5cbmV4cG9ydCBjb25zdCBNQVBfQkFTRURfRU5UUllfUFJPUF9OQU1FID0gJ1tNQVBdJztcbmV4cG9ydCBjb25zdCBURU1QTEFURV9ESVJFQ1RJVkVfSU5ERVggPSAwO1xuXG4vKipcbiAqIERlZmF1bHQgZmFsbGJhY2sgdmFsdWUgZm9yIGEgc3R5bGluZyBiaW5kaW5nLlxuICpcbiAqIEEgdmFsdWUgb2YgYG51bGxgIGlzIHVzZWQgaGVyZSB3aGljaCBzaWduYWxzIHRvIHRoZSBzdHlsaW5nIGFsZ29yaXRobSB0aGF0XG4gKiB0aGUgc3R5bGluZyB2YWx1ZSBpcyBub3QgcHJlc2VudC4gVGhpcyB3YXkgaWYgdGhlcmUgYXJlIG5vIG90aGVyIHZhbHVlc1xuICogZGV0ZWN0ZWQgdGhlbiBpdCB3aWxsIGJlIHJlbW92ZWQgb25jZSB0aGUgc3R5bGUvY2xhc3MgcHJvcGVydHkgaXMgZGlydHkgYW5kXG4gKiBkaWZmZWQgd2l0aGluIHRoZSBzdHlsaW5nIGFsZ29yaXRobSBwcmVzZW50IGluIGBmbHVzaFN0eWxpbmdgLlxuICovXG5leHBvcnQgY29uc3QgREVGQVVMVF9CSU5ESU5HX1ZBTFVFID0gbnVsbDtcblxuZXhwb3J0IGNvbnN0IERFRkFVTFRfQklORElOR19JTkRFWCA9IDA7XG5cbmNvbnN0IERFRkFVTFRfVE9UQUxfU09VUkNFUyA9IDE7XG5cbi8vIFRoZSBmaXJzdCBiaXQgdmFsdWUgcmVmbGVjdHMgYSBtYXAtYmFzZWQgYmluZGluZyB2YWx1ZSdzIGJpdC5cbi8vIFRoZSByZWFzb24gd2h5IGl0J3MgYWx3YXlzIGFjdGl2YXRlZCBmb3IgZXZlcnkgZW50cnkgaW4gdGhlIG1hcFxuLy8gaXMgc28gdGhhdCBpZiBhbnkgbWFwLWJpbmRpbmcgdmFsdWVzIHVwZGF0ZSB0aGVuIGFsbCBvdGhlciBwcm9wXG4vLyBiYXNlZCBiaW5kaW5ncyB3aWxsIHBhc3MgdGhlIGd1YXJkIGNoZWNrIGF1dG9tYXRpY2FsbHkgd2l0aG91dFxuLy8gYW55IGV4dHJhIGNvZGUgb3IgZmxhZ3MuXG5leHBvcnQgY29uc3QgREVGQVVMVF9HVUFSRF9NQVNLX1ZBTFVFID0gMGIxO1xuXG4vKipcbiAqIENyZWF0ZXMgYSBuZXcgaW5zdGFuY2Ugb2YgdGhlIGBUU3R5bGluZ0NvbnRleHRgLlxuICpcbiAqIFRoZSBgVFN0eWxpbmdDb250ZXh0YCBpcyB1c2VkIGFzIGEgbWFuaWZlc3Qgb2YgYWxsIHN0eWxlIG9yIGFsbCBjbGFzcyBiaW5kaW5ncyBvblxuICogYW4gZWxlbWVudC4gQmVjYXVzZSBpdCBpcyBhIFQtbGV2ZWwgZGF0YS1zdHJ1Y3R1cmUsIGl0IGlzIG9ubHkgY3JlYXRlZCBvbmNlIHBlclxuICogdE5vZGUgZm9yIHN0eWxlcyBhbmQgZm9yIGNsYXNzZXMuIFRoaXMgZnVuY3Rpb24gYWxsb2NhdGVzIGEgbmV3IGluc3RhbmNlIG9mIGFcbiAqIGBUU3R5bGluZ0NvbnRleHRgIHdpdGggdGhlIGluaXRpYWwgdmFsdWVzIChzZWUgYGludGVyZmFjZXMudHNgIGZvciBtb3JlIGluZm8pLlxuICovXG5leHBvcnQgZnVuY3Rpb24gYWxsb2NUU3R5bGluZ0NvbnRleHQoXG4gICAgaW5pdGlhbFN0eWxpbmc6IFN0eWxpbmdNYXBBcnJheSB8IG51bGwsIGhhc0RpcmVjdGl2ZXM6IGJvb2xlYW4pOiBUU3R5bGluZ0NvbnRleHQge1xuICBpbml0aWFsU3R5bGluZyA9IGluaXRpYWxTdHlsaW5nIHx8IGFsbG9jU3R5bGluZ01hcEFycmF5KG51bGwpO1xuICByZXR1cm4gW1xuICAgIERFRkFVTFRfVE9UQUxfU09VUkNFUywgIC8vIDEpIHRvdGFsIGFtb3VudCBvZiBzdHlsaW5nIHNvdXJjZXMgKHRlbXBsYXRlLCBkaXJlY3RpdmVzLCBldGMuLi4pXG4gICAgaW5pdGlhbFN0eWxpbmcsICAgICAgICAgLy8gMikgaW5pdGlhbCBzdHlsaW5nIHZhbHVlc1xuICBdO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYWxsb2NTdHlsaW5nTWFwQXJyYXkodmFsdWU6IHt9IHwgc3RyaW5nIHwgbnVsbCk6IFN0eWxpbmdNYXBBcnJheSB7XG4gIHJldHVybiBbdmFsdWVdO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaGFzQ29uZmlnKHROb2RlOiBUU3R5bGluZ05vZGUsIGZsYWc6IFROb2RlRmxhZ3MpIHtcbiAgcmV0dXJuICh0Tm9kZS5mbGFncyAmIGZsYWcpICE9PSAwO1xufVxuXG4vKipcbiAqIERldGVybWluZXMgd2hldGhlciBvciBub3QgdG8gYXBwbHkgc3R5bGVzL2NsYXNzZXMgZGlyZWN0bHkgb3IgdmlhIGNvbnRleHQgcmVzb2x1dGlvbi5cbiAqXG4gKiBUaGVyZSBhcmUgdGhyZWUgY2FzZXMgdGhhdCBhcmUgbWF0Y2hlZCBoZXJlOlxuICogMS4gdGhlcmUgYXJlIG5vIGRpcmVjdGl2ZXMgcHJlc2VudCBBTkQgYG5nRGV2TW9kZWAgaXMgZmFsc3lcbiAqIDIuIHRoZSBgZmlyc3RVcGRhdGVQYXNzYCBoYXMgbm90IGFscmVhZHkgcnVuICh3aGljaCBtZWFucyB0aGF0XG4gKiAgICB0aGVyZSBhcmUgbW9yZSBiaW5kaW5ncyB0byByZWdpc3RlciBhbmQsIHRoZXJlZm9yZSwgZGlyZWN0XG4gKiAgICBzdHlsZS9jbGFzcyBhcHBsaWNhdGlvbiBpcyBub3QgeWV0IHBvc3NpYmxlKVxuICogMy4gVGhlcmUgYXJlIG5vIGNvbGxpc2lvbnMgKGkuZS4gcHJvcGVydGllcyB3aXRoIG1vcmUgdGhhbiBvbmUgYmluZGluZykgYWNyb3NzIG11bHRpcGxlXG4gKiAgICBzb3VyY2VzIChpLmUuIHRlbXBsYXRlICsgZGlyZWN0aXZlLCBkaXJlY3RpdmUgKyBkaXJlY3RpdmUsIGRpcmVjdGl2ZSArIGNvbXBvbmVudClcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFsbG93RGlyZWN0U3R5bGluZyhcbiAgICB0Tm9kZTogVFN0eWxpbmdOb2RlLCBpc0NsYXNzQmFzZWQ6IGJvb2xlYW4sIGZpcnN0VXBkYXRlUGFzczogYm9vbGVhbik6IGJvb2xlYW4ge1xuICBsZXQgYWxsb3cgPSBmYWxzZTtcblxuICAvLyBpZiBubyBkaXJlY3RpdmVzIGFyZSBwcmVzZW50IHRoZW4gd2UgZG8gbm90IG5lZWQgcG9wdWxhdGUgYSBjb250ZXh0IGF0IGFsbC4gVGhpc1xuICAvLyBpcyBiZWNhdXNlIGR1cGxpY2F0ZSBwcm9wIGJpbmRpbmdzIGNhbm5vdCBiZSByZWdpc3RlcmVkIHRocm91Z2ggdGhlIHRlbXBsYXRlLiBJZlxuICAvLyBhbmQgd2hlbiB0aGlzIGhhcHBlbnMgd2UgY2FuIHNhZmVseSBhcHBseSB0aGUgdmFsdWUgZGlyZWN0bHkgd2l0aG91dCBjb250ZXh0XG4gIC8vIHJlc29sdXRpb24uLi5cbiAgY29uc3QgaGFzRGlyZWN0aXZlcyA9IGhhc0NvbmZpZyh0Tm9kZSwgVE5vZGVGbGFncy5oYXNIb3N0QmluZGluZ3MpO1xuICBpZiAoIWhhc0RpcmVjdGl2ZXMpIHtcbiAgICAvLyBgbmdEZXZNb2RlYCBpcyByZXF1aXJlZCB0byBiZSBjaGVja2VkIGhlcmUgYmVjYXVzZSB0ZXN0cy9kZWJ1Z2dpbmcgcmVseSBvbiB0aGUgY29udGV4dCBiZWluZ1xuICAgIC8vIHBvcHVsYXRlZC4gSWYgdGhpbmdzIGFyZSBpbiBwcm9kdWN0aW9uIG1vZGUgdGhlbiB0aGVyZSBpcyBubyBuZWVkIHRvIGJ1aWxkIGEgY29udGV4dFxuICAgIC8vIHRoZXJlZm9yZSB0aGUgZGlyZWN0IGFwcGx5IGNhbiBiZSBhbGxvd2VkIChldmVuIG9uIHRoZSBmaXJzdCB1cGRhdGUpLlxuICAgIGFsbG93ID0gbmdEZXZNb2RlID8gIWZpcnN0VXBkYXRlUGFzcyA6IHRydWU7XG4gIH0gZWxzZSBpZiAoIWZpcnN0VXBkYXRlUGFzcykge1xuICAgIGNvbnN0IGR1cGxpY2F0ZVN0eWxpbmdGbGFnID1cbiAgICAgICAgaXNDbGFzc0Jhc2VkID8gVE5vZGVGbGFncy5oYXNEdXBsaWNhdGVDbGFzc0JpbmRpbmdzIDogVE5vZGVGbGFncy5oYXNEdXBsaWNhdGVTdHlsZUJpbmRpbmdzO1xuICAgIGNvbnN0IGhhc0R1cGxpY2F0ZXMgPSBoYXNDb25maWcodE5vZGUsIGR1cGxpY2F0ZVN0eWxpbmdGbGFnKTtcbiAgICBjb25zdCBoYXNPbmx5TWFwT3JQcm9wc0ZsYWcgPSBpc0NsYXNzQmFzZWQgPyBUTm9kZUZsYWdzLmhhc0NsYXNzUHJvcEFuZE1hcEJpbmRpbmdzIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBUTm9kZUZsYWdzLmhhc1N0eWxlUHJvcEFuZE1hcEJpbmRpbmdzO1xuICAgIGNvbnN0IGhhc09ubHlNYXBzT3JPbmx5UHJvcHMgPSAodE5vZGUuZmxhZ3MgJiBoYXNPbmx5TWFwT3JQcm9wc0ZsYWcpICE9PSBoYXNPbmx5TWFwT3JQcm9wc0ZsYWc7XG4gICAgYWxsb3cgPSAhaGFzRHVwbGljYXRlcyAmJiBoYXNPbmx5TWFwc09yT25seVByb3BzO1xuICB9XG5cbiAgcmV0dXJuIGFsbG93O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcGF0Y2hDb25maWcodE5vZGU6IFRTdHlsaW5nTm9kZSwgZmxhZzogVE5vZGVGbGFncyk6IHZvaWQge1xuICB0Tm9kZS5mbGFncyB8PSBmbGFnO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0UHJvcChjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQsIGluZGV4OiBudW1iZXIpOiBzdHJpbmcge1xuICByZXR1cm4gY29udGV4dFtpbmRleCArIFRTdHlsaW5nQ29udGV4dEluZGV4LlByb3BPZmZzZXRdIGFzIHN0cmluZztcbn1cblxuZnVuY3Rpb24gZ2V0UHJvcENvbmZpZyhjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQsIGluZGV4OiBudW1iZXIpOiBudW1iZXIge1xuICByZXR1cm4gKGNvbnRleHRbaW5kZXggKyBUU3R5bGluZ0NvbnRleHRJbmRleC5Db25maWdPZmZzZXRdIGFzIG51bWJlcikgJlxuICAgICAgVFN0eWxpbmdDb250ZXh0UHJvcENvbmZpZ0ZsYWdzLk1hc2s7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc1Nhbml0aXphdGlvblJlcXVpcmVkKGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCwgaW5kZXg6IG51bWJlcik6IGJvb2xlYW4ge1xuICByZXR1cm4gKGdldFByb3BDb25maWcoY29udGV4dCwgaW5kZXgpICYgVFN0eWxpbmdDb250ZXh0UHJvcENvbmZpZ0ZsYWdzLlNhbml0aXphdGlvblJlcXVpcmVkKSAhPT1cbiAgICAgIDA7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRHdWFyZE1hc2soXG4gICAgY29udGV4dDogVFN0eWxpbmdDb250ZXh0LCBpbmRleDogbnVtYmVyLCBpc0hvc3RCaW5kaW5nOiBib29sZWFuKTogbnVtYmVyIHtcbiAgY29uc3QgcG9zaXRpb24gPSBpbmRleCArIChpc0hvc3RCaW5kaW5nID8gVFN0eWxpbmdDb250ZXh0SW5kZXguSG9zdEJpbmRpbmdzQml0R3VhcmRPZmZzZXQgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBUU3R5bGluZ0NvbnRleHRJbmRleC5UZW1wbGF0ZUJpdEd1YXJkT2Zmc2V0KTtcbiAgcmV0dXJuIGNvbnRleHRbcG9zaXRpb25dIGFzIG51bWJlcjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNldEd1YXJkTWFzayhcbiAgICBjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQsIGluZGV4OiBudW1iZXIsIG1hc2tWYWx1ZTogbnVtYmVyLCBpc0hvc3RCaW5kaW5nOiBib29sZWFuKSB7XG4gIGNvbnN0IHBvc2l0aW9uID0gaW5kZXggKyAoaXNIb3N0QmluZGluZyA/IFRTdHlsaW5nQ29udGV4dEluZGV4Lkhvc3RCaW5kaW5nc0JpdEd1YXJkT2Zmc2V0IDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgVFN0eWxpbmdDb250ZXh0SW5kZXguVGVtcGxhdGVCaXRHdWFyZE9mZnNldCk7XG4gIGNvbnRleHRbcG9zaXRpb25dID0gbWFza1ZhbHVlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0VmFsdWVzQ291bnQoY29udGV4dDogVFN0eWxpbmdDb250ZXh0KTogbnVtYmVyIHtcbiAgcmV0dXJuIGdldFRvdGFsU291cmNlcyhjb250ZXh0KSArIDE7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRUb3RhbFNvdXJjZXMoY29udGV4dDogVFN0eWxpbmdDb250ZXh0KTogbnVtYmVyIHtcbiAgcmV0dXJuIGNvbnRleHRbVFN0eWxpbmdDb250ZXh0SW5kZXguVG90YWxTb3VyY2VzUG9zaXRpb25dO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0QmluZGluZ1ZhbHVlKGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCwgaW5kZXg6IG51bWJlciwgb2Zmc2V0OiBudW1iZXIpIHtcbiAgcmV0dXJuIGNvbnRleHRbaW5kZXggKyBUU3R5bGluZ0NvbnRleHRJbmRleC5CaW5kaW5nc1N0YXJ0T2Zmc2V0ICsgb2Zmc2V0XSBhcyBudW1iZXIgfCBzdHJpbmc7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXREZWZhdWx0VmFsdWUoY29udGV4dDogVFN0eWxpbmdDb250ZXh0LCBpbmRleDogbnVtYmVyKTogc3RyaW5nfGJvb2xlYW58bnVsbCB7XG4gIHJldHVybiBjb250ZXh0W2luZGV4ICsgVFN0eWxpbmdDb250ZXh0SW5kZXguQmluZGluZ3NTdGFydE9mZnNldCArIGdldFRvdGFsU291cmNlcyhjb250ZXh0KV0gYXNcbiAgICAgICAgICAgICBzdHJpbmcgfFxuICAgICAgYm9vbGVhbiB8IG51bGw7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXREZWZhdWx0VmFsdWUoXG4gICAgY29udGV4dDogVFN0eWxpbmdDb250ZXh0LCBpbmRleDogbnVtYmVyLCB2YWx1ZTogc3RyaW5nIHwgYm9vbGVhbiB8IG51bGwpIHtcbiAgcmV0dXJuIGNvbnRleHRbaW5kZXggKyBUU3R5bGluZ0NvbnRleHRJbmRleC5CaW5kaW5nc1N0YXJ0T2Zmc2V0ICsgZ2V0VG90YWxTb3VyY2VzKGNvbnRleHQpXSA9XG4gICAgICAgICAgICAgdmFsdWU7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXRWYWx1ZShkYXRhOiBMU3R5bGluZ0RhdGEsIGJpbmRpbmdJbmRleDogbnVtYmVyLCB2YWx1ZTogYW55KSB7XG4gIGRhdGFbYmluZGluZ0luZGV4XSA9IHZhbHVlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0VmFsdWU8VCA9IGFueT4oZGF0YTogTFN0eWxpbmdEYXRhLCBiaW5kaW5nSW5kZXg6IG51bWJlcik6IFR8bnVsbCB7XG4gIHJldHVybiBiaW5kaW5nSW5kZXggIT09IDAgPyBkYXRhW2JpbmRpbmdJbmRleF0gYXMgVCA6IG51bGw7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRQcm9wVmFsdWVzU3RhcnRQb3NpdGlvbihcbiAgICBjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQsIHROb2RlOiBUU3R5bGluZ05vZGUsIGlzQ2xhc3NCYXNlZDogYm9vbGVhbikge1xuICBsZXQgc3RhcnRQb3NpdGlvbiA9IFRTdHlsaW5nQ29udGV4dEluZGV4LlZhbHVlc1N0YXJ0UG9zaXRpb247XG4gIGNvbnN0IGZsYWcgPSBpc0NsYXNzQmFzZWQgPyBUTm9kZUZsYWdzLmhhc0NsYXNzTWFwQmluZGluZ3MgOiBUTm9kZUZsYWdzLmhhc1N0eWxlTWFwQmluZGluZ3M7XG4gIGlmIChoYXNDb25maWcodE5vZGUsIGZsYWcpKSB7XG4gICAgc3RhcnRQb3NpdGlvbiArPSBUU3R5bGluZ0NvbnRleHRJbmRleC5CaW5kaW5nc1N0YXJ0T2Zmc2V0ICsgZ2V0VmFsdWVzQ291bnQoY29udGV4dCk7XG4gIH1cbiAgcmV0dXJuIHN0YXJ0UG9zaXRpb247XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBoYXNWYWx1ZUNoYW5nZWRVbndyYXBTYWZlVmFsdWUoXG4gICAgYTogTk9fQ0hBTkdFIHwgU3R5bGluZ01hcEFycmF5IHwgbnVtYmVyIHwgU3RyaW5nIHwgc3RyaW5nIHwgbnVsbCB8IGJvb2xlYW4gfCB1bmRlZmluZWQgfCB7fSxcbiAgICBiOiBOT19DSEFOR0UgfCBTdHlsaW5nTWFwQXJyYXkgfCBudW1iZXIgfCBTdHJpbmcgfCBzdHJpbmcgfCBudWxsIHwgYm9vbGVhbiB8IHVuZGVmaW5lZCB8XG4gICAgICAgIHt9KTogYm9vbGVhbiB7XG4gIHJldHVybiBoYXNWYWx1ZUNoYW5nZWQodW53cmFwU2FmZVZhbHVlKGEpLCB1bndyYXBTYWZlVmFsdWUoYikpO1xufVxuXG5cbmV4cG9ydCBmdW5jdGlvbiBoYXNWYWx1ZUNoYW5nZWQoXG4gICAgYTogTk9fQ0hBTkdFIHwgU3R5bGluZ01hcEFycmF5IHwgbnVtYmVyIHwgc3RyaW5nIHwgbnVsbCB8IGJvb2xlYW4gfCB1bmRlZmluZWQgfCB7fSxcbiAgICBiOiBOT19DSEFOR0UgfCBTdHlsaW5nTWFwQXJyYXkgfCBudW1iZXIgfCBzdHJpbmcgfCBudWxsIHwgYm9vbGVhbiB8IHVuZGVmaW5lZCB8IHt9KTogYm9vbGVhbiB7XG4gIGlmIChiID09PSBOT19DSEFOR0UpIHJldHVybiBmYWxzZTtcblxuICBjb25zdCBjb21wYXJlVmFsdWVBID0gQXJyYXkuaXNBcnJheShhKSA/IGFbU3R5bGluZ01hcEFycmF5SW5kZXguUmF3VmFsdWVQb3NpdGlvbl0gOiBhO1xuICBjb25zdCBjb21wYXJlVmFsdWVCID0gQXJyYXkuaXNBcnJheShiKSA/IGJbU3R5bGluZ01hcEFycmF5SW5kZXguUmF3VmFsdWVQb3NpdGlvbl0gOiBiO1xuICByZXR1cm4gIU9iamVjdC5pcyhjb21wYXJlVmFsdWVBLCBjb21wYXJlVmFsdWVCKTtcbn1cblxuLyoqXG4gKiBEZXRlcm1pbmVzIHdoZXRoZXIgdGhlIHByb3ZpZGVkIHN0eWxpbmcgdmFsdWUgaXMgdHJ1dGh5IG9yIGZhbHN5LlxuICovXG5leHBvcnQgZnVuY3Rpb24gaXNTdHlsaW5nVmFsdWVEZWZpbmVkPFQgZXh0ZW5kcyBzdHJpbmd8bnVtYmVyfHt9fG51bGx8dW5kZWZpbmVkPih2YWx1ZTogVCk6XG4gICAgdmFsdWUgaXMgTm9uTnVsbGFibGU8VD4ge1xuICAvLyB0aGUgcmVhc29uIHdoeSBudWxsIGlzIGNvbXBhcmVkIGFnYWluc3QgaXMgYmVjYXVzZVxuICAvLyBhIENTUyBjbGFzcyB2YWx1ZSB0aGF0IGlzIHNldCB0byBgZmFsc2VgIG11c3QgYmVcbiAgLy8gcmVzcGVjdGVkIChvdGhlcndpc2UgaXQgd291bGQgYmUgdHJlYXRlZCBhcyBmYWxzeSkuXG4gIC8vIEVtcHR5IHN0cmluZyB2YWx1ZXMgYXJlIGJlY2F1c2UgZGV2ZWxvcGVycyB1c3VhbGx5XG4gIC8vIHNldCBhIHZhbHVlIHRvIGFuIGVtcHR5IHN0cmluZyB0byByZW1vdmUgaXQuXG4gIHJldHVybiB2YWx1ZSAhPSBudWxsICYmIHZhbHVlICE9PSAnJztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNvbmNhdFN0cmluZyhhOiBzdHJpbmcsIGI6IHN0cmluZywgc2VwYXJhdG9yID0gJyAnKTogc3RyaW5nIHtcbiAgcmV0dXJuIGEgKyAoKGIubGVuZ3RoICYmIGEubGVuZ3RoKSA/IHNlcGFyYXRvciA6ICcnKSArIGI7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBoeXBoZW5hdGUodmFsdWU6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiB2YWx1ZS5yZXBsYWNlKC9bYS16XVtBLVpdL2csIHYgPT4gdi5jaGFyQXQoMCkgKyAnLScgKyB2LmNoYXJBdCgxKSkudG9Mb3dlckNhc2UoKTtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIGFuIGluc3RhbmNlIG9mIGBTdHlsaW5nTWFwQXJyYXlgLlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gaXMgZGVzaWduZWQgdG8gZmluZCBhbiBpbnN0YW5jZSBvZiBgU3R5bGluZ01hcEFycmF5YCBpbiBjYXNlIGl0IGlzIHN0b3JlZFxuICogaW5zaWRlIG9mIGFuIGluc3RhbmNlIG9mIGBUU3R5bGluZ0NvbnRleHRgLiBXaGVuIGEgc3R5bGluZyBjb250ZXh0IGlzIGNyZWF0ZWQgaXRcbiAqIHdpbGwgY29weSBvdmVyIGFuIGluaXRpYWwgc3R5bGluZyB2YWx1ZXMgZnJvbSB0aGUgdE5vZGUgKHdoaWNoIGFyZSBzdG9yZWQgYXMgYVxuICogYFN0eWxpbmdNYXBBcnJheWAgb24gdGhlIGB0Tm9kZS5jbGFzc2VzYCBvciBgdE5vZGUuc3R5bGVzYCB2YWx1ZXMpLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0U3R5bGluZ01hcEFycmF5KHZhbHVlOiBUU3R5bGluZ0NvbnRleHQgfCBTdHlsaW5nTWFwQXJyYXkgfCBudWxsKTpcbiAgICBTdHlsaW5nTWFwQXJyYXl8bnVsbCB7XG4gIHJldHVybiBpc1N0eWxpbmdDb250ZXh0KHZhbHVlKSA/XG4gICAgICAodmFsdWUgYXMgVFN0eWxpbmdDb250ZXh0KVtUU3R5bGluZ0NvbnRleHRJbmRleC5Jbml0aWFsU3R5bGluZ1ZhbHVlUG9zaXRpb25dIDpcbiAgICAgIHZhbHVlIGFzIFN0eWxpbmdNYXBBcnJheTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzU3R5bGluZ0NvbnRleHQodmFsdWU6IGFueSk6IGJvb2xlYW4ge1xuICAvLyB0aGUgU3R5bGluZ01hcEFycmF5IGlzIGluIHRoZSBmb3JtYXQgb2YgW2luaXRpYWwsIHByb3AsIHN0cmluZywgcHJvcCwgc3RyaW5nXVxuICAvLyBhbmQgdGhpcyBpcyB0aGUgZGVmaW5pbmcgdmFsdWUgdG8gZGlzdGluZ3Vpc2ggYmV0d2VlbiBhcnJheXNcbiAgcmV0dXJuIEFycmF5LmlzQXJyYXkodmFsdWUpICYmIHZhbHVlLmxlbmd0aCA+PSBUU3R5bGluZ0NvbnRleHRJbmRleC5WYWx1ZXNTdGFydFBvc2l0aW9uICYmXG4gICAgICB0eXBlb2YgdmFsdWVbMV0gIT09ICdzdHJpbmcnO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNTdHlsaW5nTWFwQXJyYXkodmFsdWU6IGFueSk6IGJvb2xlYW4ge1xuICAvLyB0aGUgU3R5bGluZ01hcEFycmF5IGlzIGluIHRoZSBmb3JtYXQgb2YgW2luaXRpYWwsIHByb3AsIHN0cmluZywgcHJvcCwgc3RyaW5nXVxuICAvLyBhbmQgdGhpcyBpcyB0aGUgZGVmaW5pbmcgdmFsdWUgdG8gZGlzdGluZ3Vpc2ggYmV0d2VlbiBhcnJheXNcbiAgcmV0dXJuIEFycmF5LmlzQXJyYXkodmFsdWUpICYmXG4gICAgICAodHlwZW9mKHZhbHVlIGFzIFN0eWxpbmdNYXBBcnJheSlbU3R5bGluZ01hcEFycmF5SW5kZXguVmFsdWVzU3RhcnRQb3NpdGlvbl0gPT09ICdzdHJpbmcnKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEluaXRpYWxTdHlsaW5nVmFsdWUoY29udGV4dDogVFN0eWxpbmdDb250ZXh0IHwgU3R5bGluZ01hcEFycmF5IHwgbnVsbCk6IHN0cmluZyB7XG4gIGNvbnN0IG1hcCA9IGdldFN0eWxpbmdNYXBBcnJheShjb250ZXh0KTtcbiAgcmV0dXJuIG1hcCAmJiAobWFwW1N0eWxpbmdNYXBBcnJheUluZGV4LlJhd1ZhbHVlUG9zaXRpb25dIGFzIHN0cmluZyB8IG51bGwpIHx8ICcnO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaGFzQ2xhc3NJbnB1dCh0Tm9kZTogVFN0eWxpbmdOb2RlKSB7XG4gIHJldHVybiAodE5vZGUuZmxhZ3MgJiBUTm9kZUZsYWdzLmhhc0NsYXNzSW5wdXQpICE9PSAwO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaGFzU3R5bGVJbnB1dCh0Tm9kZTogVFN0eWxpbmdOb2RlKSB7XG4gIHJldHVybiAodE5vZGUuZmxhZ3MgJiBUTm9kZUZsYWdzLmhhc1N0eWxlSW5wdXQpICE9PSAwO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0TWFwUHJvcChtYXA6IFN0eWxpbmdNYXBBcnJheSwgaW5kZXg6IG51bWJlcik6IHN0cmluZyB7XG4gIHJldHVybiBtYXBbaW5kZXggKyBTdHlsaW5nTWFwQXJyYXlJbmRleC5Qcm9wT2Zmc2V0XSBhcyBzdHJpbmc7XG59XG5cbmNvbnN0IE1BUF9ESVJUWV9WQUxVRSA9XG4gICAgdHlwZW9mIG5nRGV2TW9kZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbmdEZXZNb2RlID8ge30gOiB7TUFQX0RJUlRZX1ZBTFVFOiB0cnVlfTtcblxuZXhwb3J0IGZ1bmN0aW9uIHNldE1hcEFzRGlydHkobWFwOiBTdHlsaW5nTWFwQXJyYXkpOiB2b2lkIHtcbiAgbWFwW1N0eWxpbmdNYXBBcnJheUluZGV4LlJhd1ZhbHVlUG9zaXRpb25dID0gTUFQX0RJUlRZX1ZBTFVFO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2V0TWFwVmFsdWUoXG4gICAgbWFwOiBTdHlsaW5nTWFwQXJyYXksIGluZGV4OiBudW1iZXIsIHZhbHVlOiBzdHJpbmcgfCBib29sZWFuIHwgbnVsbCk6IHZvaWQge1xuICBtYXBbaW5kZXggKyBTdHlsaW5nTWFwQXJyYXlJbmRleC5WYWx1ZU9mZnNldF0gPSB2YWx1ZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldE1hcFZhbHVlKG1hcDogU3R5bGluZ01hcEFycmF5LCBpbmRleDogbnVtYmVyKTogc3RyaW5nfG51bGwge1xuICByZXR1cm4gbWFwW2luZGV4ICsgU3R5bGluZ01hcEFycmF5SW5kZXguVmFsdWVPZmZzZXRdIGFzIHN0cmluZyB8IG51bGw7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBmb3JjZUNsYXNzZXNBc1N0cmluZyhjbGFzc2VzOiBzdHJpbmcgfCB7W2tleTogc3RyaW5nXTogYW55fSB8IG51bGwgfCB1bmRlZmluZWQpOlxuICAgIHN0cmluZyB7XG4gIGlmIChjbGFzc2VzICYmIHR5cGVvZiBjbGFzc2VzICE9PSAnc3RyaW5nJykge1xuICAgIGNsYXNzZXMgPSBPYmplY3Qua2V5cyhjbGFzc2VzKS5qb2luKCcgJyk7XG4gIH1cbiAgcmV0dXJuIChjbGFzc2VzIGFzIHN0cmluZykgfHwgJyc7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBmb3JjZVN0eWxlc0FzU3RyaW5nKFxuICAgIHN0eWxlczoge1trZXk6IHN0cmluZ106IGFueX0gfCBzdHJpbmcgfCBudWxsIHwgdW5kZWZpbmVkLCBoeXBoZW5hdGVQcm9wczogYm9vbGVhbik6IHN0cmluZyB7XG4gIGlmICh0eXBlb2Ygc3R5bGVzID09ICdzdHJpbmcnKSByZXR1cm4gc3R5bGVzO1xuICBsZXQgc3RyID0gJyc7XG4gIGlmIChzdHlsZXMpIHtcbiAgICBjb25zdCBwcm9wcyA9IE9iamVjdC5rZXlzKHN0eWxlcyk7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwcm9wcy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgcHJvcCA9IHByb3BzW2ldO1xuICAgICAgY29uc3QgcHJvcExhYmVsID0gaHlwaGVuYXRlUHJvcHMgPyBoeXBoZW5hdGUocHJvcCkgOiBwcm9wO1xuICAgICAgY29uc3QgdmFsdWUgPSBzdHlsZXNbcHJvcF07XG4gICAgICBpZiAodmFsdWUgIT09IG51bGwpIHtcbiAgICAgICAgc3RyID0gY29uY2F0U3RyaW5nKHN0ciwgYCR7cHJvcExhYmVsfToke3ZhbHVlfWAsICc7Jyk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiBzdHI7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0hvc3RTdHlsaW5nQWN0aXZlKGRpcmVjdGl2ZU9yU291cmNlSWQ6IG51bWJlcik6IGJvb2xlYW4ge1xuICByZXR1cm4gZGlyZWN0aXZlT3JTb3VyY2VJZCAhPT0gVEVNUExBVEVfRElSRUNUSVZFX0lOREVYO1xufVxuXG4vKipcbiAqIENvbnZlcnRzIHRoZSBwcm92aWRlZCBzdHlsaW5nIG1hcCBhcnJheSBpbnRvIGEgc3RyaW5nLlxuICpcbiAqIENsYXNzZXMgPT4gYG9uZSB0d28gdGhyZWVgXG4gKiBTdHlsZXMgPT4gYHByb3A6dmFsdWU7IHByb3AyOnZhbHVlMmBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHN0eWxpbmdNYXBUb1N0cmluZyhtYXA6IFN0eWxpbmdNYXBBcnJheSwgaXNDbGFzc0Jhc2VkOiBib29sZWFuKTogc3RyaW5nIHtcbiAgbGV0IHN0ciA9ICcnO1xuICBmb3IgKGxldCBpID0gU3R5bGluZ01hcEFycmF5SW5kZXguVmFsdWVzU3RhcnRQb3NpdGlvbjsgaSA8IG1hcC5sZW5ndGg7XG4gICAgICAgaSArPSBTdHlsaW5nTWFwQXJyYXlJbmRleC5UdXBsZVNpemUpIHtcbiAgICBjb25zdCBwcm9wID0gZ2V0TWFwUHJvcChtYXAsIGkpO1xuICAgIGNvbnN0IHZhbHVlID0gZ2V0TWFwVmFsdWUobWFwLCBpKSBhcyBzdHJpbmc7XG4gICAgY29uc3QgYXR0clZhbHVlID0gY29uY2F0U3RyaW5nKHByb3AsIGlzQ2xhc3NCYXNlZCA/ICcnIDogdmFsdWUsICc6Jyk7XG4gICAgc3RyID0gY29uY2F0U3RyaW5nKHN0ciwgYXR0clZhbHVlLCBpc0NsYXNzQmFzZWQgPyAnICcgOiAnOyAnKTtcbiAgfVxuICByZXR1cm4gc3RyO1xufVxuXG4vKipcbiAqIENvbnZlcnRzIHRoZSBwcm92aWRlZCBzdHlsaW5nIG1hcCBhcnJheSBpbnRvIGEga2V5IHZhbHVlIG1hcC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHN0eWxpbmdNYXBUb1N0cmluZ01hcChtYXA6IFN0eWxpbmdNYXBBcnJheSB8IG51bGwpOiB7W2tleTogc3RyaW5nXTogYW55fSB7XG4gIGxldCBzdHJpbmdNYXA6IHtba2V5OiBzdHJpbmddOiBhbnl9ID0ge307XG4gIGlmIChtYXApIHtcbiAgICBmb3IgKGxldCBpID0gU3R5bGluZ01hcEFycmF5SW5kZXguVmFsdWVzU3RhcnRQb3NpdGlvbjsgaSA8IG1hcC5sZW5ndGg7XG4gICAgICAgICBpICs9IFN0eWxpbmdNYXBBcnJheUluZGV4LlR1cGxlU2l6ZSkge1xuICAgICAgY29uc3QgcHJvcCA9IGdldE1hcFByb3AobWFwLCBpKTtcbiAgICAgIGNvbnN0IHZhbHVlID0gZ2V0TWFwVmFsdWUobWFwLCBpKSBhcyBzdHJpbmc7XG4gICAgICBzdHJpbmdNYXBbcHJvcF0gPSB2YWx1ZTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHN0cmluZ01hcDtcbn1cblxuLyoqXG4gKiBJbnNlcnRzIHRoZSBwcm92aWRlZCBpdGVtIGludG8gdGhlIHByb3ZpZGVkIHN0eWxpbmcgYXJyYXkgYXQgdGhlIHJpZ2h0IHNwb3QuXG4gKlxuICogVGhlIGBTdHlsaW5nTWFwQXJyYXlgIHR5cGUgaXMgYSBzb3J0ZWQga2V5L3ZhbHVlIGFycmF5IG9mIGVudHJpZXMuIFRoaXMgbWVhbnNcbiAqIHRoYXQgd2hlbiBhIG5ldyBlbnRyeSBpcyBpbnNlcnRlZCBpdCBtdXN0IGJlIHBsYWNlZCBhdCB0aGUgcmlnaHQgc3BvdCBpbiB0aGVcbiAqIGFycmF5LiBUaGlzIGZ1bmN0aW9uIGZpZ3VyZXMgb3V0IGV4YWN0bHkgd2hlcmUgdG8gcGxhY2UgaXQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhZGRJdGVtVG9TdHlsaW5nTWFwKFxuICAgIHN0eWxpbmdNYXBBcnI6IFN0eWxpbmdNYXBBcnJheSwgcHJvcDogc3RyaW5nLCB2YWx1ZTogc3RyaW5nIHwgYm9vbGVhbiB8IG51bGwsXG4gICAgYWxsb3dPdmVyd3JpdGU/OiBib29sZWFuKSB7XG4gIGZvciAobGV0IGogPSBTdHlsaW5nTWFwQXJyYXlJbmRleC5WYWx1ZXNTdGFydFBvc2l0aW9uOyBqIDwgc3R5bGluZ01hcEFyci5sZW5ndGg7XG4gICAgICAgaiArPSBTdHlsaW5nTWFwQXJyYXlJbmRleC5UdXBsZVNpemUpIHtcbiAgICBjb25zdCBwcm9wQXRJbmRleCA9IGdldE1hcFByb3Aoc3R5bGluZ01hcEFyciwgaik7XG4gICAgaWYgKHByb3AgPD0gcHJvcEF0SW5kZXgpIHtcbiAgICAgIGxldCBhcHBsaWVkID0gZmFsc2U7XG4gICAgICBpZiAocHJvcEF0SW5kZXggPT09IHByb3ApIHtcbiAgICAgICAgY29uc3QgdmFsdWVBdEluZGV4ID0gc3R5bGluZ01hcEFycltqXTtcbiAgICAgICAgaWYgKGFsbG93T3ZlcndyaXRlIHx8ICFpc1N0eWxpbmdWYWx1ZURlZmluZWQodmFsdWVBdEluZGV4KSkge1xuICAgICAgICAgIGFwcGxpZWQgPSB0cnVlO1xuICAgICAgICAgIHNldE1hcFZhbHVlKHN0eWxpbmdNYXBBcnIsIGosIHZhbHVlKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYXBwbGllZCA9IHRydWU7XG4gICAgICAgIHN0eWxpbmdNYXBBcnIuc3BsaWNlKGosIDAsIHByb3AsIHZhbHVlKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBhcHBsaWVkO1xuICAgIH1cbiAgfVxuXG4gIHN0eWxpbmdNYXBBcnIucHVzaChwcm9wLCB2YWx1ZSk7XG4gIHJldHVybiB0cnVlO1xufVxuXG4vKipcbiAqIFVzZWQgdG8gY29udmVydCBhIHtrZXk6dmFsdWV9IG1hcCBpbnRvIGEgYFN0eWxpbmdNYXBBcnJheWAgYXJyYXkuXG4gKlxuICogVGhpcyBmdW5jdGlvbiB3aWxsIGVpdGhlciBnZW5lcmF0ZSBhIG5ldyBgU3R5bGluZ01hcEFycmF5YCBpbnN0YW5jZVxuICogb3IgaXQgd2lsbCBwYXRjaCB0aGUgcHJvdmlkZWQgYG5ld1ZhbHVlc2AgbWFwIHZhbHVlIGludG8gYW5cbiAqIGV4aXN0aW5nIGBTdHlsaW5nTWFwQXJyYXlgIHZhbHVlICh0aGlzIG9ubHkgaGFwcGVucyBpZiBgYmluZGluZ1ZhbHVlYFxuICogaXMgYW4gaW5zdGFuY2Ugb2YgYFN0eWxpbmdNYXBBcnJheWApLlxuICpcbiAqIElmIGEgbmV3IGtleS92YWx1ZSBtYXAgaXMgcHJvdmlkZWQgd2l0aCBhbiBvbGQgYFN0eWxpbmdNYXBBcnJheWBcbiAqIHZhbHVlIHRoZW4gYWxsIHByb3BlcnRpZXMgd2lsbCBiZSBvdmVyd3JpdHRlbiB3aXRoIHRoZWlyIG5ld1xuICogdmFsdWVzIG9yIHdpdGggYG51bGxgLiBUaGlzIG1lYW5zIHRoYXQgdGhlIGFycmF5IHdpbGwgbmV2ZXJcbiAqIHNocmluayBpbiBzaXplIChidXQgaXQgd2lsbCBhbHNvIG5vdCBiZSBjcmVhdGVkIGFuZCB0aHJvd25cbiAqIGF3YXkgd2hlbmV2ZXIgdGhlIGB7a2V5OnZhbHVlfWAgbWFwIGVudHJpZXMgY2hhbmdlKS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG5vcm1hbGl6ZUludG9TdHlsaW5nTWFwKFxuICAgIGJpbmRpbmdWYWx1ZTogbnVsbCB8IFN0eWxpbmdNYXBBcnJheSxcbiAgICBuZXdWYWx1ZXM6IHtba2V5OiBzdHJpbmddOiBhbnl9IHwgc3RyaW5nIHwgbnVsbCB8IHVuZGVmaW5lZCxcbiAgICBub3JtYWxpemVQcm9wcz86IGJvb2xlYW4pOiBTdHlsaW5nTWFwQXJyYXkge1xuICBjb25zdCBzdHlsaW5nTWFwQXJyOiBTdHlsaW5nTWFwQXJyYXkgPVxuICAgICAgQXJyYXkuaXNBcnJheShiaW5kaW5nVmFsdWUpID8gYmluZGluZ1ZhbHVlIDogYWxsb2NTdHlsaW5nTWFwQXJyYXkobnVsbCk7XG4gIHN0eWxpbmdNYXBBcnJbU3R5bGluZ01hcEFycmF5SW5kZXguUmF3VmFsdWVQb3NpdGlvbl0gPSBuZXdWYWx1ZXM7XG5cbiAgLy8gYmVjYXVzZSB0aGUgbmV3IHZhbHVlcyBtYXkgbm90IGluY2x1ZGUgYWxsIHRoZSBwcm9wZXJ0aWVzXG4gIC8vIHRoYXQgdGhlIG9sZCBvbmVzIGhhZCwgYWxsIHZhbHVlcyBhcmUgc2V0IHRvIGBudWxsYCBiZWZvcmVcbiAgLy8gdGhlIG5ldyB2YWx1ZXMgYXJlIGFwcGxpZWQuIFRoaXMgd2F5LCB3aGVuIGZsdXNoZWQsIHRoZVxuICAvLyBzdHlsaW5nIGFsZ29yaXRobSBrbm93cyBleGFjdGx5IHdoYXQgc3R5bGUvY2xhc3MgdmFsdWVzXG4gIC8vIHRvIHJlbW92ZSBmcm9tIHRoZSBlbGVtZW50IChzaW5jZSB0aGV5IGFyZSBgbnVsbGApLlxuICBmb3IgKGxldCBqID0gU3R5bGluZ01hcEFycmF5SW5kZXguVmFsdWVzU3RhcnRQb3NpdGlvbjsgaiA8IHN0eWxpbmdNYXBBcnIubGVuZ3RoO1xuICAgICAgIGogKz0gU3R5bGluZ01hcEFycmF5SW5kZXguVHVwbGVTaXplKSB7XG4gICAgc2V0TWFwVmFsdWUoc3R5bGluZ01hcEFyciwgaiwgbnVsbCk7XG4gIH1cblxuICBsZXQgcHJvcHM6IHN0cmluZ1tdfG51bGwgPSBudWxsO1xuICBsZXQgbWFwOiB7W2tleTogc3RyaW5nXTogYW55fXx1bmRlZmluZWR8bnVsbDtcbiAgbGV0IGFsbFZhbHVlc1RydWUgPSBmYWxzZTtcbiAgaWYgKHR5cGVvZiBuZXdWYWx1ZXMgPT09ICdzdHJpbmcnKSB7ICAvLyBbY2xhc3NdIGJpbmRpbmdzIGFsbG93IHN0cmluZyB2YWx1ZXNcbiAgICBwcm9wcyA9IHNwbGl0T25XaGl0ZXNwYWNlKG5ld1ZhbHVlcyk7XG4gICAgYWxsVmFsdWVzVHJ1ZSA9IHByb3BzICE9PSBudWxsO1xuICB9IGVsc2Uge1xuICAgIHByb3BzID0gbmV3VmFsdWVzID8gT2JqZWN0LmtleXMobmV3VmFsdWVzKSA6IG51bGw7XG4gICAgbWFwID0gbmV3VmFsdWVzO1xuICB9XG5cbiAgaWYgKHByb3BzKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwcm9wcy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgcHJvcCA9IHByb3BzW2ldO1xuICAgICAgY29uc3QgbmV3UHJvcCA9IG5vcm1hbGl6ZVByb3BzID8gaHlwaGVuYXRlKHByb3ApIDogcHJvcDtcbiAgICAgIGNvbnN0IHZhbHVlID0gYWxsVmFsdWVzVHJ1ZSA/IHRydWUgOiBtYXAgIVtwcm9wXTtcbiAgICAgIGFkZEl0ZW1Ub1N0eWxpbmdNYXAoc3R5bGluZ01hcEFyciwgbmV3UHJvcCwgdmFsdWUsIHRydWUpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBzdHlsaW5nTWFwQXJyO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc3BsaXRPbldoaXRlc3BhY2UodGV4dDogc3RyaW5nKTogc3RyaW5nW118bnVsbCB7XG4gIGxldCBhcnJheTogc3RyaW5nW118bnVsbCA9IG51bGw7XG4gIGxldCBsZW5ndGggPSB0ZXh0Lmxlbmd0aDtcbiAgbGV0IHN0YXJ0ID0gMDtcbiAgbGV0IGZvdW5kQ2hhciA9IGZhbHNlO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3QgY2hhciA9IHRleHQuY2hhckNvZGVBdChpKTtcbiAgICBpZiAoY2hhciA8PSAzMiAvKicgJyovKSB7XG4gICAgICBpZiAoZm91bmRDaGFyKSB7XG4gICAgICAgIGlmIChhcnJheSA9PT0gbnVsbCkgYXJyYXkgPSBbXTtcbiAgICAgICAgYXJyYXkucHVzaCh0ZXh0LnN1YnN0cmluZyhzdGFydCwgaSkpO1xuICAgICAgICBmb3VuZENoYXIgPSBmYWxzZTtcbiAgICAgIH1cbiAgICAgIHN0YXJ0ID0gaSArIDE7XG4gICAgfSBlbHNlIHtcbiAgICAgIGZvdW5kQ2hhciA9IHRydWU7XG4gICAgfVxuICB9XG4gIGlmIChmb3VuZENoYXIpIHtcbiAgICBpZiAoYXJyYXkgPT09IG51bGwpIGFycmF5ID0gW107XG4gICAgYXJyYXkucHVzaCh0ZXh0LnN1YnN0cmluZyhzdGFydCwgbGVuZ3RoKSk7XG4gICAgZm91bmRDaGFyID0gZmFsc2U7XG4gIH1cbiAgcmV0dXJuIGFycmF5O1xufVxuXG4vLyBUT0RPIChtYXRza298QW5kcmV3S3VzaG5pcik6IHJlZmFjdG9yIHRoaXMgb25jZSB3ZSBmaWd1cmUgb3V0IGhvdyB0byBnZW5lcmF0ZSBzZXBhcmF0ZVxuLy8gYGlucHV0KCdjbGFzcycpICsgY2xhc3NNYXAoKWAgaW5zdHJ1Y3Rpb25zLlxuZXhwb3J0IGZ1bmN0aW9uIHNlbGVjdENsYXNzQmFzZWRJbnB1dE5hbWUoaW5wdXRzOiBQcm9wZXJ0eUFsaWFzZXMpOiBzdHJpbmcge1xuICByZXR1cm4gaW5wdXRzLmhhc093blByb3BlcnR5KCdjbGFzcycpID8gJ2NsYXNzJyA6ICdjbGFzc05hbWUnO1xufVxuIl19