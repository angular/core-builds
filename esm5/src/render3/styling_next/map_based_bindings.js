import { setStylingMapsSyncFn } from './bindings';
import { getBindingValue, getValuesCount, isStylingValueDefined } from './util';
/**
 * --------
 *
 * This file contains the algorithm logic for applying map-based bindings
 * such as `[style]` and `[class]`.
 *
 * --------
 */
/**
 * Used to apply styling values presently within any map-based bindings on an element.
 *
 * Angular supports map-based styling bindings which can be applied via the
 * `[style]` and `[class]` bindings which can be placed on any HTML element.
 * These bindings can work independently, together or alongside prop-based
 * styling bindings (e.g. `<div [style]="x" [style.width]="w">`).
 *
 * If a map-based styling binding is detected by the compiler, the following
 * AOT code is produced:
 *
 * ```typescript
 * styleMap(ctx.styles); // styles = {key:value}
 * classMap(ctx.classes); // classes = {key:value}|string
 * ```
 *
 * If and when either of the instructions above are evaluated, then the code
 * present in this file is included into the bundle. The mechanism used, to
 * activate support for map-based bindings at runtime is possible via the
 * `activeStylingMapFeature` function (which is also present in this file).
 *
 * # The Algorithm
 * Whenever a map-based binding updates (which is when the identity of the
 * map-value changes) then the map is iterated over and a `LStylingMap` array
 * is produced. The `LStylingMap` instance is stored in the binding location
 * where the `BINDING_INDEX` is situated when the `styleMap()` or `classMap()`
 * instruction were called. Once the binding changes, then the internal `bitMask`
 * value is marked as dirty.
 *
 * Styling values are applied once CD exits the element (which happens when
 * the `select(n)` instruction is called or the template function exits). When
 * this occurs, all prop-based bindings are applied. If a map-based binding is
 * present then a special flushing function (called a sync function) is made
 * available and it will be called each time a styling property is flushed.
 *
 * The flushing algorithm is designed to apply styling for a property (which is
 * a CSS property or a className value) one by one. If map-based bindings
 * are present, then the flushing algorithm will keep calling the maps styling
 * sync function each time a property is visited. This way, the flushing
 * behavior of map-based bindings will always be at the same property level
 * as the current prop-based property being iterated over (because everything
 * is alphabetically sorted).
 *
 * Let's imagine we have the following HTML template code:
 *
 * ```html
 * <div [style]="{width:'100px', height:'200px', 'z-index':'10'}"
 *      [style.width.px]="200">...</div>
 * ```
 *
 * When CD occurs, both the `[style]` and `[style.width]` bindings
 * are evaluated. Then when the styles are flushed on screen, the
 * following operations happen:
 *
 * 1. `[style.width]` is attempted to be written to the element.
 *
 * 2.  Once that happens, the algorithm instructs the map-based
 *     entries (`[style]` in this case) to "catch up" and apply
 *     all values up to the `width` value. When this happens the
 *     `height` value is applied to the element (since it is
 *     alphabetically situated before the `width` property).
 *
 * 3. Since there are no more prop-based entries anymore, the
 *    loop exits and then, just before the flushing ends, it
 *    instructs all map-based bindings to "finish up" applying
 *    their values.
 *
 * 4. The only remaining value within the map-based entries is
 *    the `z-index` value (`width` got skipped because it was
 *    successfully applied via the prop-based `[style.width]`
 *    binding). Since all map-based entries are told to "finish up",
 *    the `z-index` value is iterated over and it is then applied
 *    to the element.
 *
 * The most important thing to take note of here is that prop-based
 * bindings are evaluated in order alongside map-based bindings.
 * This allows all styling across an element to be applied in O(n)
 * time (a similar algorithm is that of the array merge algorithm
 * in merge sort).
 */
export var syncStylingMap = function (context, renderer, element, data, applyStylingFn, mode, targetProp, defaultValue) {
    var targetPropValueWasApplied = false;
    // once the map-based styling code is activate it is never deactivated. For this reason a
    // check to see if the current styling context has any map based bindings is required.
    var totalMaps = getValuesCount(context, 2 /* MapBindingsPosition */);
    if (totalMaps) {
        var runTheSyncAlgorithm = true;
        var loopUntilEnd = !targetProp;
        // If the code is told to finish up (run until the end), but the mode
        // hasn't been flagged to apply values (it only traverses values) then
        // there is no point in iterating over the array because nothing will
        // be applied to the element.
        if (loopUntilEnd && (mode & ~1 /* ApplyAllValues */)) {
            runTheSyncAlgorithm = false;
            targetPropValueWasApplied = true;
        }
        if (runTheSyncAlgorithm) {
            targetPropValueWasApplied = innerSyncStylingMap(context, renderer, element, data, applyStylingFn, mode, targetProp || null, 0, defaultValue || null);
        }
        if (loopUntilEnd) {
            resetSyncCursors();
        }
    }
    return targetPropValueWasApplied;
};
/**
 * Recursive function designed to apply map-based styling to an element one map at a time.
 *
 * This function is designed to be called from the `syncStylingMap` function and will
 * apply map-based styling data one map at a time to the provided `element`.
 *
 * This function is recursive and it will call itself if a follow-up map value is to be
 * processed. To learn more about how the algorithm works, see `syncStylingMap`.
 */
function innerSyncStylingMap(context, renderer, element, data, applyStylingFn, mode, targetProp, currentMapIndex, defaultValue) {
    var targetPropValueWasApplied = false;
    var totalMaps = getValuesCount(context, 2 /* MapBindingsPosition */);
    if (currentMapIndex < totalMaps) {
        var bindingIndex = getBindingValue(context, 2 /* MapBindingsPosition */, currentMapIndex);
        var lStylingMap = data[bindingIndex];
        var cursor = getCurrentSyncCursor(currentMapIndex);
        while (cursor < lStylingMap.length) {
            var prop = getMapProp(lStylingMap, cursor);
            var iteratedTooFar = targetProp && prop > targetProp;
            var isTargetPropMatched = !iteratedTooFar && prop === targetProp;
            var value = getMapValue(lStylingMap, cursor);
            var valueIsDefined = isStylingValueDefined(value);
            // the recursive code is designed to keep applying until
            // it reaches or goes past the target prop. If and when
            // this happens then it will stop processing values, but
            // all other map values must also catch up to the same
            // point. This is why a recursive call is still issued
            // even if the code has iterated too far.
            var innerMode = iteratedTooFar ? mode : resolveInnerMapMode(mode, valueIsDefined, isTargetPropMatched);
            var innerProp = iteratedTooFar ? targetProp : prop;
            var valueApplied = innerSyncStylingMap(context, renderer, element, data, applyStylingFn, innerMode, innerProp, currentMapIndex + 1, defaultValue);
            if (iteratedTooFar) {
                break;
            }
            if (!valueApplied && isValueAllowedToBeApplied(mode, isTargetPropMatched)) {
                var useDefault = isTargetPropMatched && !valueIsDefined;
                var valueToApply = useDefault ? defaultValue : value;
                var bindingIndexToApply = useDefault ? bindingIndex : null;
                applyStylingFn(renderer, element, prop, valueToApply, bindingIndexToApply);
                valueApplied = true;
            }
            targetPropValueWasApplied = valueApplied && isTargetPropMatched;
            cursor += 2 /* TupleSize */;
        }
        setCurrentSyncCursor(currentMapIndex, cursor);
    }
    return targetPropValueWasApplied;
}
/**
 * Enables support for map-based styling bindings (e.g. `[style]` and `[class]` bindings).
 */
export function activeStylingMapFeature() {
    setStylingMapsSyncFn(syncStylingMap);
}
/**
 * Used to determine the mode for the inner recursive call.
 *
 * If an inner map is iterated on then this is done so for one
 * of two reasons:
 *
 * - The target property was detected and the inner map
 *   must now "catch up" (pointer-wise) up to where the current
 *   map's cursor is situated.
 *
 * - The target property was not detected in the current map
 *   and must be found in an inner map. This can only be allowed
 *   if the current map iteration is not set to skip the target
 *   property.
 */
function resolveInnerMapMode(currentMode, valueIsDefined, isExactMatch) {
    var innerMode = currentMode;
    if (!valueIsDefined && isExactMatch && !(currentMode & 4 /* SkipTargetProp */)) {
        // case 1: set the mode to apply the targeted prop value if it
        // ends up being encountered in another map value
        innerMode |= 2 /* ApplyTargetProp */;
        innerMode &= ~4 /* SkipTargetProp */;
    }
    else {
        // case 2: set the mode to skip the targeted prop value if it
        // ends up being encountered in another map value
        innerMode |= 4 /* SkipTargetProp */;
        innerMode &= ~2 /* ApplyTargetProp */;
    }
    return innerMode;
}
/**
 * Decides whether or not a prop/value entry will be applied to an element.
 *
 * To determine whether or not a value is to be applied,
 * the following procedure is evaluated:
 *
 * First check to see the current `mode` status:
 *  1. If the mode value permits all props to be applied then allow.
 *    - But do not allow if the current prop is set to be skipped.
 *  2. Otherwise if the current prop is permitted then allow.
 */
function isValueAllowedToBeApplied(mode, isTargetPropMatched) {
    var doApplyValue = (mode & 1 /* ApplyAllValues */) > 0;
    if (!doApplyValue) {
        if (mode & 2 /* ApplyTargetProp */) {
            doApplyValue = isTargetPropMatched;
        }
    }
    else if ((mode & 4 /* SkipTargetProp */) && isTargetPropMatched) {
        doApplyValue = false;
    }
    return doApplyValue;
}
/**
 * Used to keep track of concurrent cursor values for multiple map-based styling bindings present on
 * an element.
 */
var MAP_CURSORS = [];
/**
 * Used to reset the state of each cursor value being used to iterate over map-based styling
 * bindings.
 */
function resetSyncCursors() {
    for (var i = 0; i < MAP_CURSORS.length; i++) {
        MAP_CURSORS[i] = 1 /* ValuesStartPosition */;
    }
}
/**
 * Returns an active cursor value at a given mapIndex location.
 */
function getCurrentSyncCursor(mapIndex) {
    if (mapIndex >= MAP_CURSORS.length) {
        MAP_CURSORS.push(1 /* ValuesStartPosition */);
    }
    return MAP_CURSORS[mapIndex];
}
/**
 * Sets a cursor value at a given mapIndex location.
 */
function setCurrentSyncCursor(mapIndex, indexValue) {
    MAP_CURSORS[mapIndex] = indexValue;
}
/**
 * Used to convert a {key:value} map into a `LStylingMap` array.
 *
 * This function will either generate a new `LStylingMap` instance
 * or it will patch the provided `newValues` map value into an
 * existing `LStylingMap` value (this only happens if `bindingValue`
 * is an instance of `LStylingMap`).
 *
 * If a new key/value map is provided with an old `LStylingMap`
 * value then all properties will be overwritten with their new
 * values or with `null`. This means that the array will never
 * shrink in size (but it will also not be created and thrown
 * away whenever the {key:value} map entries change).
 */
export function normalizeIntoStylingMap(bindingValue, newValues) {
    var lStylingMap = Array.isArray(bindingValue) ? bindingValue : [null];
    lStylingMap[0 /* RawValuePosition */] = newValues || null;
    // because the new values may not include all the properties
    // that the old ones had, all values are set to `null` before
    // the new values are applied. This way, when flushed, the
    // styling algorithm knows exactly what style/class values
    // to remove from the element (since they are `null`).
    for (var j = 1 /* ValuesStartPosition */; j < lStylingMap.length; j += 2 /* TupleSize */) {
        setMapValue(lStylingMap, j, null);
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
        outer: for (var i = 0; i < props.length; i++) {
            var prop = props[i];
            var value = allValuesTrue ? true : map[prop];
            for (var j = 1 /* ValuesStartPosition */; j < lStylingMap.length; j += 2 /* TupleSize */) {
                var propAtIndex = getMapProp(lStylingMap, j);
                if (prop <= propAtIndex) {
                    if (propAtIndex === prop) {
                        setMapValue(lStylingMap, j, value);
                    }
                    else {
                        lStylingMap.splice(j, 0, prop, value);
                    }
                    continue outer;
                }
            }
            lStylingMap.push(prop, value);
        }
    }
    return lStylingMap;
}
export function getMapProp(map, index) {
    return map[index + 0 /* PropOffset */];
}
export function setMapValue(map, index, value) {
    map[index + 1 /* ValueOffset */] = value;
}
export function getMapValue(map, index) {
    return map[index + 1 /* ValueOffset */];
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFwX2Jhc2VkX2JpbmRpbmdzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9zdHlsaW5nX25leHQvbWFwX2Jhc2VkX2JpbmRpbmdzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQVNBLE9BQU8sRUFBQyxvQkFBb0IsRUFBQyxNQUFNLFlBQVksQ0FBQztBQUVoRCxPQUFPLEVBQUMsZUFBZSxFQUFFLGNBQWMsRUFBRSxxQkFBcUIsRUFBQyxNQUFNLFFBQVEsQ0FBQztBQUc5RTs7Ozs7OztHQU9HO0FBRUg7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7R0ErRUc7QUFDSCxNQUFNLENBQUMsSUFBTSxjQUFjLEdBQ3ZCLFVBQUMsT0FBd0IsRUFBRSxRQUFnRCxFQUFFLE9BQWlCLEVBQzdGLElBQWtCLEVBQUUsY0FBOEIsRUFBRSxJQUF5QixFQUM3RSxVQUEwQixFQUFFLFlBQTRCO0lBQ3ZELElBQUkseUJBQXlCLEdBQUcsS0FBSyxDQUFDO0lBRXRDLHlGQUF5RjtJQUN6RixzRkFBc0Y7SUFDdEYsSUFBTSxTQUFTLEdBQUcsY0FBYyxDQUFDLE9BQU8sOEJBQTJDLENBQUM7SUFDcEYsSUFBSSxTQUFTLEVBQUU7UUFDYixJQUFJLG1CQUFtQixHQUFHLElBQUksQ0FBQztRQUMvQixJQUFNLFlBQVksR0FBRyxDQUFDLFVBQVUsQ0FBQztRQUVqQyxxRUFBcUU7UUFDckUsc0VBQXNFO1FBQ3RFLHFFQUFxRTtRQUNyRSw2QkFBNkI7UUFDN0IsSUFBSSxZQUFZLElBQUksQ0FBQyxJQUFJLEdBQUcsdUJBQW1DLENBQUMsRUFBRTtZQUNoRSxtQkFBbUIsR0FBRyxLQUFLLENBQUM7WUFDNUIseUJBQXlCLEdBQUcsSUFBSSxDQUFDO1NBQ2xDO1FBRUQsSUFBSSxtQkFB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QyxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUM7cUJBQ3ZDO29CQUNELFNBQVMsS0FBSyxDQUFDO2lCQUNoQjthQUNGO1lBQ0QsV0FBVyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUM7U0FDL0I7S0FDRjtJQUVELE9BQU8sV0FBVyxDQUFDO0FBQ3JCLENBQUM7QUFFRCxNQUFNLFVBQVUsVUFBVSxDQUFDLEdBQWdCLEVBQUUsS0FBYTtJQUN4RCxPQUFPLEdBQUcsQ0FBQyxLQUFLLHFCQUE4QixDQUFXLENBQUM7QUFDNUQsQ0FBQztBQUVELE1BQU0sVUFBVSxXQUFXLENBQUMsR0FBZ0IsRUFBRSxLQUFhLEVBQUUsS0FBb0I7SUFDL0UsR0FBRyxDQUFDLEtBQUssc0JBQStCLENBQUMsR0FBRyxLQUFLLENBQUM7QUFDcEQsQ0FBQztBQUVELE1BQU0sVUFBVSxXQUFXLENBQUMsR0FBZ0IsRUFBRSxLQUFhO0lBQ3pELE9BQU8sR0FBRyxDQUFDLEtBQUssc0JBQStCLENBQWtCLENBQUM7QUFDcEUsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuKiBAbGljZW5zZVxuKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbipcbiogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuKi9cbmltcG9ydCB7UHJvY2VkdXJhbFJlbmRlcmVyMywgUkVsZW1lbnQsIFJlbmRlcmVyM30gZnJvbSAnLi4vaW50ZXJmYWNlcy9yZW5kZXJlcic7XG5cbmltcG9ydCB7c2V0U3R5bGluZ01hcHNTeW5jRm59IGZyb20gJy4vYmluZGluZ3MnO1xuaW1wb3J0IHtBcHBseVN0eWxpbmdGbiwgTFN0eWxpbmdEYXRhLCBMU3R5bGluZ01hcCwgTFN0eWxpbmdNYXBJbmRleCwgU3R5bGluZ01hcHNTeW5jTW9kZSwgU3luY1N0eWxpbmdNYXBzRm4sIFRTdHlsaW5nQ29udGV4dCwgVFN0eWxpbmdDb250ZXh0SW5kZXh9IGZyb20gJy4vaW50ZXJmYWNlcyc7XG5pbXBvcnQge2dldEJpbmRpbmdWYWx1ZSwgZ2V0VmFsdWVzQ291bnQsIGlzU3R5bGluZ1ZhbHVlRGVmaW5lZH0gZnJvbSAnLi91dGlsJztcblxuXG4vKipcbiAqIC0tLS0tLS0tXG4gKlxuICogVGhpcyBmaWxlIGNvbnRhaW5zIHRoZSBhbGdvcml0aG0gbG9naWMgZm9yIGFwcGx5aW5nIG1hcC1iYXNlZCBiaW5kaW5nc1xuICogc3VjaCBhcyBgW3N0eWxlXWAgYW5kIGBbY2xhc3NdYC5cbiAqXG4gKiAtLS0tLS0tLVxuICovXG5cbi8qKlxuICogVXNlZCB0byBhcHBseSBzdHlsaW5nIHZhbHVlcyBwcmVzZW50bHkgd2l0aGluIGFueSBtYXAtYmFzZWQgYmluZGluZ3Mgb24gYW4gZWxlbWVudC5cbiAqXG4gKiBBbmd1bGFyIHN1cHBvcnRzIG1hcC1iYXNlZCBzdHlsaW5nIGJpbmRpbmdzIHdoaWNoIGNhbiBiZSBhcHBsaWVkIHZpYSB0aGVcbiAqIGBbc3R5bGVdYCBhbmQgYFtjbGFzc11gIGJpbmRpbmdzIHdoaWNoIGNhbiBiZSBwbGFjZWQgb24gYW55IEhUTUwgZWxlbWVudC5cbiAqIFRoZXNlIGJpbmRpbmdzIGNhbiB3b3JrIGluZGVwZW5kZW50bHksIHRvZ2V0aGVyIG9yIGFsb25nc2lkZSBwcm9wLWJhc2VkXG4gKiBzdHlsaW5nIGJpbmRpbmdzIChlLmcuIGA8ZGl2IFtzdHlsZV09XCJ4XCIgW3N0eWxlLndpZHRoXT1cIndcIj5gKS5cbiAqXG4gKiBJZiBhIG1hcC1iYXNlZCBzdHlsaW5nIGJpbmRpbmcgaXMgZGV0ZWN0ZWQgYnkgdGhlIGNvbXBpbGVyLCB0aGUgZm9sbG93aW5nXG4gKiBBT1QgY29kZSBpcyBwcm9kdWNlZDpcbiAqXG4gKiBgYGB0eXBlc2NyaXB0XG4gKiBzdHlsZU1hcChjdHguc3R5bGVzKTsgLy8gc3R5bGVzID0ge2tleTp2YWx1ZX1cbiAqIGNsYXNzTWFwKGN0eC5jbGFzc2VzKTsgLy8gY2xhc3NlcyA9IHtrZXk6dmFsdWV9fHN0cmluZ1xuICogYGBgXG4gKlxuICogSWYgYW5kIHdoZW4gZWl0aGVyIG9mIHRoZSBpbnN0cnVjdGlvbnMgYWJvdmUgYXJlIGV2YWx1YXRlZCwgdGhlbiB0aGUgY29kZVxuICogcHJlc2VudCBpbiB0aGlzIGZpbGUgaXMgaW5jbHVkZWQgaW50byB0aGUgYnVuZGxlLiBUaGUgbWVjaGFuaXNtIHVzZWQsIHRvXG4gKiBhY3RpdmF0ZSBzdXBwb3J0IGZvciBtYXAtYmFzZWQgYmluZGluZ3MgYXQgcnVudGltZSBpcyBwb3NzaWJsZSB2aWEgdGhlXG4gKiBgYWN0aXZlU3R5bGluZ01hcEZlYXR1cmVgIGZ1bmN0aW9uICh3aGljaCBpcyBhbHNvIHByZXNlbnQgaW4gdGhpcyBmaWxlKS5cbiAqXG4gKiAjIFRoZSBBbGdvcml0aG1cbiAqIFdoZW5ldmVyIGEgbWFwLWJhc2VkIGJpbmRpbmcgdXBkYXRlcyAod2hpY2ggaXMgd2hlbiB0aGUgaWRlbnRpdHkgb2YgdGhlXG4gKiBtYXAtdmFsdWUgY2hhbmdlcykgdGhlbiB0aGUgbWFwIGlzIGl0ZXJhdGVkIG92ZXIgYW5kIGEgYExTdHlsaW5nTWFwYCBhcnJheVxuICogaXMgcHJvZHVjZWQuIFRoZSBgTFN0eWxpbmdNYXBgIGluc3RhbmNlIGlzIHN0b3JlZCBpbiB0aGUgYmluZGluZyBsb2NhdGlvblxuICogd2hlcmUgdGhlIGBCSU5ESU5HX0lOREVYYCBpcyBzaXR1YXRlZCB3aGVuIHRoZSBgc3R5bGVNYXAoKWAgb3IgYGNsYXNzTWFwKClgXG4gKiBpbnN0cnVjdGlvbiB3ZXJlIGNhbGxlZC4gT25jZSB0aGUgYmluZGluZyBjaGFuZ2VzLCB0aGVuIHRoZSBpbnRlcm5hbCBgYml0TWFza2BcbiAqIHZhbHVlIGlzIG1hcmtlZCBhcyBkaXJ0eS5cbiAqXG4gKiBTdHlsaW5nIHZhbHVlcyBhcmUgYXBwbGllZCBvbmNlIENEIGV4aXRzIHRoZSBlbGVtZW50ICh3aGljaCBoYXBwZW5zIHdoZW5cbiAqIHRoZSBgc2VsZWN0KG4pYCBpbnN0cnVjdGlvbiBpcyBjYWxsZWQgb3IgdGhlIHRlbXBsYXRlIGZ1bmN0aW9uIGV4aXRzKS4gV2hlblxuICogdGhpcyBvY2N1cnMsIGFsbCBwcm9wLWJhc2VkIGJpbmRpbmdzIGFyZSBhcHBsaWVkLiBJZiBhIG1hcC1iYXNlZCBiaW5kaW5nIGlzXG4gKiBwcmVzZW50IHRoZW4gYSBzcGVjaWFsIGZsdXNoaW5nIGZ1bmN0aW9uIChjYWxsZWQgYSBzeW5jIGZ1bmN0aW9uKSBpcyBtYWRlXG4gKiBhdmFpbGFibGUgYW5kIGl0IHdpbGwgYmUgY2FsbGVkIGVhY2ggdGltZSBhIHN0eWxpbmcgcHJvcGVydHkgaXMgZmx1c2hlZC5cbiAqXG4gKiBUaGUgZmx1c2hpbmcgYWxnb3JpdGhtIGlzIGRlc2lnbmVkIHRvIGFwcGx5IHN0eWxpbmcgZm9yIGEgcHJvcGVydHkgKHdoaWNoIGlzXG4gKiBhIENTUyBwcm9wZXJ0eSBvciBhIGNsYXNzTmFtZSB2YWx1ZSkgb25lIGJ5IG9uZS4gSWYgbWFwLWJhc2VkIGJpbmRpbmdzXG4gKiBhcmUgcHJlc2VudCwgdGhlbiB0aGUgZmx1c2hpbmcgYWxnb3JpdGhtIHdpbGwga2VlcCBjYWxsaW5nIHRoZSBtYXBzIHN0eWxpbmdcbiAqIHN5bmMgZnVuY3Rpb24gZWFjaCB0aW1lIGEgcHJvcGVydHkgaXMgdmlzaXRlZC4gVGhpcyB3YXksIHRoZSBmbHVzaGluZ1xuICogYmVoYXZpb3Igb2YgbWFwLWJhc2VkIGJpbmRpbmdzIHdpbGwgYWx3YXlzIGJlIGF0IHRoZSBzYW1lIHByb3BlcnR5IGxldmVsXG4gKiBhcyB0aGUgY3VycmVudCBwcm9wLWJhc2VkIHByb3BlcnR5IGJlaW5nIGl0ZXJhdGVkIG92ZXIgKGJlY2F1c2UgZXZlcnl0aGluZ1xuICogaXMgYWxwaGFiZXRpY2FsbHkgc29ydGVkKS5cbiAqXG4gKiBMZXQncyBpbWFnaW5lIHdlIGhhdmUgdGhlIGZvbGxvd2luZyBIVE1MIHRlbXBsYXRlIGNvZGU6XG4gKlxuICogYGBgaHRtbFxuICogPGRpdiBbc3R5bGVdPVwie3dpZHRoOicxMDBweCcsIGhlaWdodDonMjAwcHgnLCAnei1pbmRleCc6JzEwJ31cIlxuICogICAgICBbc3R5bGUud2lkdGgucHhdPVwiMjAwXCI+Li4uPC9kaXY+XG4gKiBgYGBcbiAqXG4gKiBXaGVuIENEIG9jY3VycywgYm90aCB0aGUgYFtzdHlsZV1gIGFuZCBgW3N0eWxlLndpZHRoXWAgYmluZGluZ3NcbiAqIGFyZSBldmFsdWF0ZWQuIFRoZW4gd2hlbiB0aGUgc3R5bGVzIGFyZSBmbHVzaGVkIG9uIHNjcmVlbiwgdGhlXG4gKiBmb2xsb3dpbmcgb3BlcmF0aW9ucyBoYXBwZW46XG4gKlxuICogMS4gYFtzdHlsZS53aWR0aF1gIGlzIGF0dGVtcHRlZCB0byBiZSB3cml0dGVuIHRvIHRoZSBlbGVtZW50LlxuICpcbiAqIDIuICBPbmNlIHRoYXQgaGFwcGVucywgdGhlIGFsZ29yaXRobSBpbnN0cnVjdHMgdGhlIG1hcC1iYXNlZFxuICogICAgIGVudHJpZXMgKGBbc3R5bGVdYCBpbiB0aGlzIGNhc2UpIHRvIFwiY2F0Y2ggdXBcIiBhbmQgYXBwbHlcbiAqICAgICBhbGwgdmFsdWVzIHVwIHRvIHRoZSBgd2lkdGhgIHZhbHVlLiBXaGVuIHRoaXMgaGFwcGVucyB0aGVcbiAqICAgICBgaGVpZ2h0YCB2YWx1ZSBpcyBhcHBsaWVkIHRvIHRoZSBlbGVtZW50IChzaW5jZSBpdCBpc1xuICogICAgIGFscGhhYmV0aWNhbGx5IHNpdHVhdGVkIGJlZm9yZSB0aGUgYHdpZHRoYCBwcm9wZXJ0eSkuXG4gKlxuICogMy4gU2luY2UgdGhlcmUgYXJlIG5vIG1vcmUgcHJvcC1iYXNlZCBlbnRyaWVzIGFueW1vcmUsIHRoZVxuICogICAgbG9vcCBleGl0cyBhbmQgdGhlbiwganVzdCBiZWZvcmUgdGhlIGZsdXNoaW5nIGVuZHMsIGl0XG4gKiAgICBpbnN0cnVjdHMgYWxsIG1hcC1iYXNlZCBiaW5kaW5ncyB0byBcImZpbmlzaCB1cFwiIGFwcGx5aW5nXG4gKiAgICB0aGVpciB2YWx1ZXMuXG4gKlxuICogNC4gVGhlIG9ubHkgcmVtYWluaW5nIHZhbHVlIHdpdGhpbiB0aGUgbWFwLWJhc2VkIGVudHJpZXMgaXNcbiAqICAgIHRoZSBgei1pbmRleGAgdmFsdWUgKGB3aWR0aGAgZ290IHNraXBwZWQgYmVjYXVzZSBpdCB3YXNcbiAqICAgIHN1Y2Nlc3NmdWxseSBhcHBsaWVkIHZpYSB0aGUgcHJvcC1iYXNlZCBgW3N0eWxlLndpZHRoXWBcbiAqICAgIGJpbmRpbmcpLiBTaW5jZSBhbGwgbWFwLWJhc2VkIGVudHJpZXMgYXJlIHRvbGQgdG8gXCJmaW5pc2ggdXBcIixcbiAqICAgIHRoZSBgei1pbmRleGAgdmFsdWUgaXMgaXRlcmF0ZWQgb3ZlciBhbmQgaXQgaXMgdGhlbiBhcHBsaWVkXG4gKiAgICB0byB0aGUgZWxlbWVudC5cbiAqXG4gKiBUaGUgbW9zdCBpbXBvcnRhbnQgdGhpbmcgdG8gdGFrZSBub3RlIG9mIGhlcmUgaXMgdGhhdCBwcm9wLWJhc2VkXG4gKiBiaW5kaW5ncyBhcmUgZXZhbHVhdGVkIGluIG9yZGVyIGFsb25nc2lkZSBtYXAtYmFzZWQgYmluZGluZ3MuXG4gKiBUaGlzIGFsbG93cyBhbGwgc3R5bGluZyBhY3Jvc3MgYW4gZWxlbWVudCB0byBiZSBhcHBsaWVkIGluIE8obilcbiAqIHRpbWUgKGEgc2ltaWxhciBhbGdvcml0aG0gaXMgdGhhdCBvZiB0aGUgYXJyYXkgbWVyZ2UgYWxnb3JpdGhtXG4gKiBpbiBtZXJnZSBzb3J0KS5cbiAqL1xuZXhwb3J0IGNvbnN0IHN5bmNTdHlsaW5nTWFwOiBTeW5jU3R5bGluZ01hcHNGbiA9XG4gICAgKGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCwgcmVuZGVyZXI6IFJlbmRlcmVyMyB8IFByb2NlZHVyYWxSZW5kZXJlcjMgfCBudWxsLCBlbGVtZW50OiBSRWxlbWVudCxcbiAgICAgZGF0YTogTFN0eWxpbmdEYXRhLCBhcHBseVN0eWxpbmdGbjogQXBwbHlTdHlsaW5nRm4sIG1vZGU6IFN0eWxpbmdNYXBzU3luY01vZGUsXG4gICAgIHRhcmdldFByb3A/OiBzdHJpbmcgfCBudWxsLCBkZWZhdWx0VmFsdWU/OiBzdHJpbmcgfCBudWxsKTogYm9vbGVhbiA9PiB7XG4gICAgICBsZXQgdGFyZ2V0UHJvcFZhbHVlV2FzQXBwbGllZCA9IGZhbHNlO1xuXG4gICAgICAvLyBvbmNlIHRoZSBtYXAtYmFzZWQgc3R5bGluZyBjb2RlIGlzIGFjdGl2YXRlIGl0IGlzIG5ldmVyIGRlYWN0aXZhdGVkLiBGb3IgdGhpcyByZWFzb24gYVxuICAgICAgLy8gY2hlY2sgdG8gc2VlIGlmIHRoZSBjdXJyZW50IHN0eWxpbmcgY29udGV4dCBoYXMgYW55IG1hcCBiYXNlZCBiaW5kaW5ncyBpcyByZXF1aXJlZC5cbiAgICAgIGNvbnN0IHRvdGFsTWFwcyA9IGdldFZhbHVlc0NvdW50KGNvbnRleHQsIFRTdHlsaW5nQ29udGV4dEluZGV4Lk1hcEJpbmRpbmdzUG9zaXRpb24pO1xuICAgICAgaWYgKHRvdGFsTWFwcykge1xuICAgICAgICBsZXQgcnVuVGhlU3luY0FsZ29yaXRobSA9IHRydWU7XG4gICAgICAgIGNvbnN0IGxvb3BVbnRpbEVuZCA9ICF0YXJnZXRQcm9wO1xuXG4gICAgICAgIC8vIElmIHRoZSBjb2RlIGlzIHRvbGQgdG8gZmluaXNoIHVwIChydW4gdW50aWwgdGhlIGVuZCksIGJ1dCB0aGUgbW9kZVxuICAgICAgICAvLyBoYXNuJ3QgYmVlbiBmbGFnZ2VkIHRvIGFwcGx5IHZhbHVlcyAoaXQgb25seSB0cmF2ZXJzZXMgdmFsdWVzKSB0aGVuXG4gICAgICAgIC8vIHRoZXJlIGlzIG5vIHBvaW50IGluIGl0ZXJhdGluZyBvdmVyIHRoZSBhcnJheSBiZWNhdXNlIG5vdGhpbmcgd2lsbFxuICAgICAgICAvLyBiZSBhcHBsaWVkIHRvIHRoZSBlbGVtZW50LlxuICAgICAgICBpZiAobG9vcFVudGlsRW5kICYmIChtb2RlICYgflN0eWxpbmdNYXBzU3luY01vZGUuQXBwbHlBbGxWYWx1ZXMpKSB7XG4gICAgICAgICAgcnVuVGhlU3luY0FsZ29yaXRobSA9IGZhbHNlO1xuICAgICAgICAgIHRhcmdldFByb3BWYWx1ZVdhc0FwcGxpZWQgPSB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHJ1blRoZVN5bmNBbGdvcml0aG0pIHtcbiAgICAgICAgICB0YXJnZXRQcm9wVmFsdWVXYXNBcHBsaWVkID0gaW5uZXJTeW5jU3R5bGluZ01hcChcbiAgICAgICAgICAgICAgY29udGV4dCwgcmVuZGVyZXIsIGVsZW1lbnQsIGRhdGEsIGFwcGx5U3R5bGluZ0ZuLCBtb2RlLCB0YXJnZXRQcm9wIHx8IG51bGwsIDAsXG4gICAgICAgICAgICAgIGRlZmF1bHRWYWx1ZSB8fCBudWxsKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChsb29wVW50aWxFbmQpIHtcbiAgICAgICAgICByZXNldFN5bmNDdXJzb3JzKCk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHRhcmdldFByb3BWYWx1ZVdhc0FwcGxpZWQ7XG4gICAgfTtcblxuLyoqXG4gKiBSZWN1cnNpdmUgZnVuY3Rpb24gZGVzaWduZWQgdG8gYXBwbHkgbWFwLWJhc2VkIHN0eWxpbmcgdG8gYW4gZWxlbWVudCBvbmUgbWFwIGF0IGEgdGltZS5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIGlzIGRlc2lnbmVkIHRvIGJlIGNhbGxlZCBmcm9tIHRoZSBgc3luY1N0eWxpbmdNYXBgIGZ1bmN0aW9uIGFuZCB3aWxsXG4gKiBhcHBseSBtYXAtYmFzZWQgc3R5bGluZyBkYXRhIG9uZSBtYXAgYXQgYSB0aW1lIHRvIHRoZSBwcm92aWRlZCBgZWxlbWVudGAuXG4gKlxuICogVGhpcyBmdW5jdGlvbiBpcyByZWN1cnNpdmUgYW5kIGl0IHdpbGwgY2FsbCBpdHNlbGYgaWYgYSBmb2xsb3ctdXAgbWFwIHZhbHVlIGlzIHRvIGJlXG4gKiBwcm9jZXNzZWQuIFRvIGxlYXJuIG1vcmUgYWJvdXQgaG93IHRoZSBhbGdvcml0aG0gd29ya3MsIHNlZSBgc3luY1N0eWxpbmdNYXBgLlxuICovXG5mdW5jdGlvbiBpbm5lclN5bmNTdHlsaW5nTWFwKFxuICAgIGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCwgcmVuZGVyZXI6IFJlbmRlcmVyMyB8IFByb2NlZHVyYWxSZW5kZXJlcjMgfCBudWxsLCBlbGVtZW50OiBSRWxlbWVudCxcbiAgICBkYXRhOiBMU3R5bGluZ0RhdGEsIGFwcGx5U3R5bGluZ0ZuOiBBcHBseVN0eWxpbmdGbiwgbW9kZTogU3R5bGluZ01hcHNTeW5jTW9kZSxcbiAgICB0YXJnZXRQcm9wOiBzdHJpbmcgfCBudWxsLCBjdXJyZW50TWFwSW5kZXg6IG51bWJlciwgZGVmYXVsdFZhbHVlOiBzdHJpbmcgfCBudWxsKTogYm9vbGVhbiB7XG4gIGxldCB0YXJnZXRQcm9wVmFsdWVXYXNBcHBsaWVkID0gZmFsc2U7XG5cbiAgY29uc3QgdG90YWxNYXBzID0gZ2V0VmFsdWVzQ291bnQoY29udGV4dCwgVFN0eWxpbmdDb250ZXh0SW5kZXguTWFwQmluZGluZ3NQb3NpdGlvbik7XG4gIGlmIChjdXJyZW50TWFwSW5kZXggPCB0b3RhbE1hcHMpIHtcbiAgICBjb25zdCBiaW5kaW5nSW5kZXggPSBnZXRCaW5kaW5nVmFsdWUoXG4gICAgICAgIGNvbnRleHQsIFRTdHlsaW5nQ29udGV4dEluZGV4Lk1hcEJpbmRpbmdzUG9zaXRpb24sIGN1cnJlbnRNYXBJbmRleCkgYXMgbnVtYmVyO1xuICAgIGNvbnN0IGxTdHlsaW5nTWFwID0gZGF0YVtiaW5kaW5nSW5kZXhdIGFzIExTdHlsaW5nTWFwO1xuXG4gICAgbGV0IGN1cnNvciA9IGdldEN1cnJlbnRTeW5jQ3Vyc29yKGN1cnJlbnRNYXBJbmRleCk7XG4gICAgd2hpbGUgKGN1cnNvciA8IGxTdHlsaW5nTWFwLmxlbmd0aCkge1xuICAgICAgY29uc3QgcHJvcCA9IGdldE1hcFByb3AobFN0eWxpbmdNYXAsIGN1cnNvcik7XG4gICAgICBjb25zdCBpdGVyYXRlZFRvb0ZhciA9IHRhcmdldFByb3AgJiYgcHJvcCA+IHRhcmdldFByb3A7XG4gICAgICBjb25zdCBpc1RhcmdldFByb3BNYXRjaGVkID0gIWl0ZXJhdGVkVG9vRmFyICYmIHByb3AgPT09IHRhcmdldFByb3A7XG4gICAgICBjb25zdCB2YWx1ZSA9IGdldE1hcFZhbHVlKGxTdHlsaW5nTWFwLCBjdXJzb3IpO1xuICAgICAgY29uc3QgdmFsdWVJc0RlZmluZWQgPSBpc1N0eWxpbmdWYWx1ZURlZmluZWQodmFsdWUpO1xuXG4gICAgICAvLyB0aGUgcmVjdXJzaXZlIGNvZGUgaXMgZGVzaWduZWQgdG8ga2VlcCBhcHBseWluZyB1bnRpbFxuICAgICAgLy8gaXQgcmVhY2hlcyBvciBnb2VzIHBhc3QgdGhlIHRhcmdldCBwcm9wLiBJZiBhbmQgd2hlblxuICAgICAgLy8gdGhpcyBoYXBwZW5zIHRoZW4gaXQgd2lsbCBzdG9wIHByb2Nlc3NpbmcgdmFsdWVzLCBidXRcbiAgICAgIC8vIGFsbCBvdGhlciBtYXAgdmFsdWVzIG11c3QgYWxzbyBjYXRjaCB1cCB0byB0aGUgc2FtZVxuICAgICAgLy8gcG9pbnQuIFRoaXMgaXMgd2h5IGEgcmVjdXJzaXZlIGNhbGwgaXMgc3RpbGwgaXNzdWVkXG4gICAgICAvLyBldmVuIGlmIHRoZSBjb2RlIGhhcyBpdGVyYXRlZCB0b28gZmFyLlxuICAgICAgY29uc3QgaW5uZXJNb2RlID1cbiAgICAgICAgICBpdGVyYXRlZFRvb0ZhciA/IG1vZGUgOiByZXNvbHZlSW5uZXJNYXBNb2RlKG1vZGUsIHZhbHVlSXNEZWZpbmVkLCBpc1RhcmdldFByb3BNYXRjaGVkKTtcbiAgICAgIGNvbnN0IGlubmVyUHJvcCA9IGl0ZXJhdGVkVG9vRmFyID8gdGFyZ2V0UHJvcCA6IHByb3A7XG4gICAgICBsZXQgdmFsdWVBcHBsaWVkID0gaW5uZXJTeW5jU3R5bGluZ01hcChcbiAgICAgICAgICBjb250ZXh0LCByZW5kZXJlciwgZWxlbWVudCwgZGF0YSwgYXBwbHlTdHlsaW5nRm4sIGlubmVyTW9kZSwgaW5uZXJQcm9wLFxuICAgICAgICAgIGN1cnJlbnRNYXBJbmRleCArIDEsIGRlZmF1bHRWYWx1ZSk7XG5cbiAgICAgIGlmIChpdGVyYXRlZFRvb0Zhcikge1xuICAgICAgICBicmVhaztcbiAgICAgIH1cblxuICAgICAgaWYgKCF2YWx1ZUFwcGxpZWQgJiYgaXNWYWx1ZUFsbG93ZWRUb0JlQXBwbGllZChtb2RlLCBpc1RhcmdldFByb3BNYXRjaGVkKSkge1xuICAgICAgICBjb25zdCB1c2VEZWZhdWx0ID0gaXNUYXJnZXRQcm9wTWF0Y2hlZCAmJiAhdmFsdWVJc0RlZmluZWQ7XG4gICAgICAgIGNvbnN0IHZhbHVlVG9BcHBseSA9IHVzZURlZmF1bHQgPyBkZWZhdWx0VmFsdWUgOiB2YWx1ZTtcbiAgICAgICAgY29uc3QgYmluZGluZ0luZGV4VG9BcHBseSA9IHVzZURlZmF1bHQgPyBiaW5kaW5nSW5kZXggOiBudWxsO1xuICAgICAgICBhcHBseVN0eWxpbmdGbihyZW5kZXJlciwgZWxlbWVudCwgcHJvcCwgdmFsdWVUb0FwcGx5LCBiaW5kaW5nSW5kZXhUb0FwcGx5KTtcbiAgICAgICAgdmFsdWVBcHBsaWVkID0gdHJ1ZTtcbiAgICAgIH1cblxuICAgICAgdGFyZ2V0UHJvcFZhbHVlV2FzQXBwbGllZCA9IHZhbHVlQXBwbGllZCAmJiBpc1RhcmdldFByb3BNYXRjaGVkO1xuICAgICAgY3Vyc29yICs9IExTdHlsaW5nTWFwSW5kZXguVHVwbGVTaXplO1xuICAgIH1cbiAgICBzZXRDdXJyZW50U3luY0N1cnNvcihjdXJyZW50TWFwSW5kZXgsIGN1cnNvcik7XG4gIH1cblxuICByZXR1cm4gdGFyZ2V0UHJvcFZhbHVlV2FzQXBwbGllZDtcbn1cblxuXG4vKipcbiAqIEVuYWJsZXMgc3VwcG9ydCBmb3IgbWFwLWJhc2VkIHN0eWxpbmcgYmluZGluZ3MgKGUuZy4gYFtzdHlsZV1gIGFuZCBgW2NsYXNzXWAgYmluZGluZ3MpLlxuICovXG5leHBvcnQgZnVuY3Rpb24gYWN0aXZlU3R5bGluZ01hcEZlYXR1cmUoKSB7XG4gIHNldFN0eWxpbmdNYXBzU3luY0ZuKHN5bmNTdHlsaW5nTWFwKTtcbn1cblxuLyoqXG4gKiBVc2VkIHRvIGRldGVybWluZSB0aGUgbW9kZSBmb3IgdGhlIGlubmVyIHJlY3Vyc2l2ZSBjYWxsLlxuICpcbiAqIElmIGFuIGlubmVyIG1hcCBpcyBpdGVyYXRlZCBvbiB0aGVuIHRoaXMgaXMgZG9uZSBzbyBmb3Igb25lXG4gKiBvZiB0d28gcmVhc29uczpcbiAqXG4gKiAtIFRoZSB0YXJnZXQgcHJvcGVydHkgd2FzIGRldGVjdGVkIGFuZCB0aGUgaW5uZXIgbWFwXG4gKiAgIG11c3Qgbm93IFwiY2F0Y2ggdXBcIiAocG9pbnRlci13aXNlKSB1cCB0byB3aGVyZSB0aGUgY3VycmVudFxuICogICBtYXAncyBjdXJzb3IgaXMgc2l0dWF0ZWQuXG4gKlxuICogLSBUaGUgdGFyZ2V0IHByb3BlcnR5IHdhcyBub3QgZGV0ZWN0ZWQgaW4gdGhlIGN1cnJlbnQgbWFwXG4gKiAgIGFuZCBtdXN0IGJlIGZvdW5kIGluIGFuIGlubmVyIG1hcC4gVGhpcyBjYW4gb25seSBiZSBhbGxvd2VkXG4gKiAgIGlmIHRoZSBjdXJyZW50IG1hcCBpdGVyYXRpb24gaXMgbm90IHNldCB0byBza2lwIHRoZSB0YXJnZXRcbiAqICAgcHJvcGVydHkuXG4gKi9cbmZ1bmN0aW9uIHJlc29sdmVJbm5lck1hcE1vZGUoXG4gICAgY3VycmVudE1vZGU6IG51bWJlciwgdmFsdWVJc0RlZmluZWQ6IGJvb2xlYW4sIGlzRXhhY3RNYXRjaDogYm9vbGVhbik6IG51bWJlciB7XG4gIGxldCBpbm5lck1vZGUgPSBjdXJyZW50TW9kZTtcbiAgaWYgKCF2YWx1ZUlzRGVmaW5lZCAmJiBpc0V4YWN0TWF0Y2ggJiYgIShjdXJyZW50TW9kZSAmIFN0eWxpbmdNYXBzU3luY01vZGUuU2tpcFRhcmdldFByb3ApKSB7XG4gICAgLy8gY2FzZSAxOiBzZXQgdGhlIG1vZGUgdG8gYXBwbHkgdGhlIHRhcmdldGVkIHByb3AgdmFsdWUgaWYgaXRcbiAgICAvLyBlbmRzIHVwIGJlaW5nIGVuY291bnRlcmVkIGluIGFub3RoZXIgbWFwIHZhbHVlXG4gICAgaW5uZXJNb2RlIHw9IFN0eWxpbmdNYXBzU3luY01vZGUuQXBwbHlUYXJnZXRQcm9wO1xuICAgIGlubmVyTW9kZSAmPSB+U3R5bGluZ01hcHNTeW5jTW9kZS5Ta2lwVGFyZ2V0UHJvcDtcbiAgfSBlbHNlIHtcbiAgICAvLyBjYXNlIDI6IHNldCB0aGUgbW9kZSB0byBza2lwIHRoZSB0YXJnZXRlZCBwcm9wIHZhbHVlIGlmIGl0XG4gICAgLy8gZW5kcyB1cCBiZWluZyBlbmNvdW50ZXJlZCBpbiBhbm90aGVyIG1hcCB2YWx1ZVxuICAgIGlubmVyTW9kZSB8PSBTdHlsaW5nTWFwc1N5bmNNb2RlLlNraXBUYXJnZXRQcm9wO1xuICAgIGlubmVyTW9kZSAmPSB+U3R5bGluZ01hcHNTeW5jTW9kZS5BcHBseVRhcmdldFByb3A7XG4gIH1cbiAgcmV0dXJuIGlubmVyTW9kZTtcbn1cblxuLyoqXG4gKiBEZWNpZGVzIHdoZXRoZXIgb3Igbm90IGEgcHJvcC92YWx1ZSBlbnRyeSB3aWxsIGJlIGFwcGxpZWQgdG8gYW4gZWxlbWVudC5cbiAqXG4gKiBUbyBkZXRlcm1pbmUgd2hldGhlciBvciBub3QgYSB2YWx1ZSBpcyB0byBiZSBhcHBsaWVkLFxuICogdGhlIGZvbGxvd2luZyBwcm9jZWR1cmUgaXMgZXZhbHVhdGVkOlxuICpcbiAqIEZpcnN0IGNoZWNrIHRvIHNlZSB0aGUgY3VycmVudCBgbW9kZWAgc3RhdHVzOlxuICogIDEuIElmIHRoZSBtb2RlIHZhbHVlIHBlcm1pdHMgYWxsIHByb3BzIHRvIGJlIGFwcGxpZWQgdGhlbiBhbGxvdy5cbiAqICAgIC0gQnV0IGRvIG5vdCBhbGxvdyBpZiB0aGUgY3VycmVudCBwcm9wIGlzIHNldCB0byBiZSBza2lwcGVkLlxuICogIDIuIE90aGVyd2lzZSBpZiB0aGUgY3VycmVudCBwcm9wIGlzIHBlcm1pdHRlZCB0aGVuIGFsbG93LlxuICovXG5mdW5jdGlvbiBpc1ZhbHVlQWxsb3dlZFRvQmVBcHBsaWVkKG1vZGU6IG51bWJlciwgaXNUYXJnZXRQcm9wTWF0Y2hlZDogYm9vbGVhbikge1xuICBsZXQgZG9BcHBseVZhbHVlID0gKG1vZGUgJiBTdHlsaW5nTWFwc1N5bmNNb2RlLkFwcGx5QWxsVmFsdWVzKSA+IDA7XG4gIGlmICghZG9BcHBseVZhbHVlKSB7XG4gICAgaWYgKG1vZGUgJiBTdHlsaW5nTWFwc1N5bmNNb2RlLkFwcGx5VGFyZ2V0UHJvcCkge1xuICAgICAgZG9BcHBseVZhbHVlID0gaXNUYXJnZXRQcm9wTWF0Y2hlZDtcbiAgICB9XG4gIH0gZWxzZSBpZiAoKG1vZGUgJiBTdHlsaW5nTWFwc1N5bmNNb2RlLlNraXBUYXJnZXRQcm9wKSAmJiBpc1RhcmdldFByb3BNYXRjaGVkKSB7XG4gICAgZG9BcHBseVZhbHVlID0gZmFsc2U7XG4gIH1cbiAgcmV0dXJuIGRvQXBwbHlWYWx1ZTtcbn1cblxuLyoqXG4gKiBVc2VkIHRvIGtlZXAgdHJhY2sgb2YgY29uY3VycmVudCBjdXJzb3IgdmFsdWVzIGZvciBtdWx0aXBsZSBtYXAtYmFzZWQgc3R5bGluZyBiaW5kaW5ncyBwcmVzZW50IG9uXG4gKiBhbiBlbGVtZW50LlxuICovXG5jb25zdCBNQVBfQ1VSU09SUzogbnVtYmVyW10gPSBbXTtcblxuLyoqXG4gKiBVc2VkIHRvIHJlc2V0IHRoZSBzdGF0ZSBvZiBlYWNoIGN1cnNvciB2YWx1ZSBiZWluZyB1c2VkIHRvIGl0ZXJhdGUgb3ZlciBtYXAtYmFzZWQgc3R5bGluZ1xuICogYmluZGluZ3MuXG4gKi9cbmZ1bmN0aW9uIHJlc2V0U3luY0N1cnNvcnMoKSB7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgTUFQX0NVUlNPUlMubGVuZ3RoOyBpKyspIHtcbiAgICBNQVBfQ1VSU09SU1tpXSA9IExTdHlsaW5nTWFwSW5kZXguVmFsdWVzU3RhcnRQb3NpdGlvbjtcbiAgfVxufVxuXG4vKipcbiAqIFJldHVybnMgYW4gYWN0aXZlIGN1cnNvciB2YWx1ZSBhdCBhIGdpdmVuIG1hcEluZGV4IGxvY2F0aW9uLlxuICovXG5mdW5jdGlvbiBnZXRDdXJyZW50U3luY0N1cnNvcihtYXBJbmRleDogbnVtYmVyKSB7XG4gIGlmIChtYXBJbmRleCA+PSBNQVBfQ1VSU09SUy5sZW5ndGgpIHtcbiAgICBNQVBfQ1VSU09SUy5wdXNoKExTdHlsaW5nTWFwSW5kZXguVmFsdWVzU3RhcnRQb3NpdGlvbik7XG4gIH1cbiAgcmV0dXJuIE1BUF9DVVJTT1JTW21hcEluZGV4XTtcbn1cblxuLyoqXG4gKiBTZXRzIGEgY3Vyc29yIHZhbHVlIGF0IGEgZ2l2ZW4gbWFwSW5kZXggbG9jYXRpb24uXG4gKi9cbmZ1bmN0aW9uIHNldEN1cnJlbnRTeW5jQ3Vyc29yKG1hcEluZGV4OiBudW1iZXIsIGluZGV4VmFsdWU6IG51bWJlcikge1xuICBNQVBfQ1VSU09SU1ttYXBJbmRleF0gPSBpbmRleFZhbHVlO1xufVxuXG4vKipcbiAqIFVzZWQgdG8gY29udmVydCBhIHtrZXk6dmFsdWV9IG1hcCBpbnRvIGEgYExTdHlsaW5nTWFwYCBhcnJheS5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIHdpbGwgZWl0aGVyIGdlbmVyYXRlIGEgbmV3IGBMU3R5bGluZ01hcGAgaW5zdGFuY2VcbiAqIG9yIGl0IHdpbGwgcGF0Y2ggdGhlIHByb3ZpZGVkIGBuZXdWYWx1ZXNgIG1hcCB2YWx1ZSBpbnRvIGFuXG4gKiBleGlzdGluZyBgTFN0eWxpbmdNYXBgIHZhbHVlICh0aGlzIG9ubHkgaGFwcGVucyBpZiBgYmluZGluZ1ZhbHVlYFxuICogaXMgYW4gaW5zdGFuY2Ugb2YgYExTdHlsaW5nTWFwYCkuXG4gKlxuICogSWYgYSBuZXcga2V5L3ZhbHVlIG1hcCBpcyBwcm92aWRlZCB3aXRoIGFuIG9sZCBgTFN0eWxpbmdNYXBgXG4gKiB2YWx1ZSB0aGVuIGFsbCBwcm9wZXJ0aWVzIHdpbGwgYmUgb3ZlcndyaXR0ZW4gd2l0aCB0aGVpciBuZXdcbiAqIHZhbHVlcyBvciB3aXRoIGBudWxsYC4gVGhpcyBtZWFucyB0aGF0IHRoZSBhcnJheSB3aWxsIG5ldmVyXG4gKiBzaHJpbmsgaW4gc2l6ZSAoYnV0IGl0IHdpbGwgYWxzbyBub3QgYmUgY3JlYXRlZCBhbmQgdGhyb3duXG4gKiBhd2F5IHdoZW5ldmVyIHRoZSB7a2V5OnZhbHVlfSBtYXAgZW50cmllcyBjaGFuZ2UpLlxuICovXG5leHBvcnQgZnVuY3Rpb24gbm9ybWFsaXplSW50b1N0eWxpbmdNYXAoXG4gICAgYmluZGluZ1ZhbHVlOiBudWxsIHwgTFN0eWxpbmdNYXAsXG4gICAgbmV3VmFsdWVzOiB7W2tleTogc3RyaW5nXTogYW55fSB8IHN0cmluZyB8IG51bGwgfCB1bmRlZmluZWQpOiBMU3R5bGluZ01hcCB7XG4gIGNvbnN0IGxTdHlsaW5nTWFwOiBMU3R5bGluZ01hcCA9IEFycmF5LmlzQXJyYXkoYmluZGluZ1ZhbHVlKSA/IGJpbmRpbmdWYWx1ZSA6IFtudWxsXTtcbiAgbFN0eWxpbmdNYXBbTFN0eWxpbmdNYXBJbmRleC5SYXdWYWx1ZVBvc2l0aW9uXSA9IG5ld1ZhbHVlcyB8fCBudWxsO1xuXG4gIC8vIGJlY2F1c2UgdGhlIG5ldyB2YWx1ZXMgbWF5IG5vdCBpbmNsdWRlIGFsbCB0aGUgcHJvcGVydGllc1xuICAvLyB0aGF0IHRoZSBvbGQgb25lcyBoYWQsIGFsbCB2YWx1ZXMgYXJlIHNldCB0byBgbnVsbGAgYmVmb3JlXG4gIC8vIHRoZSBuZXcgdmFsdWVzIGFyZSBhcHBsaWVkLiBUaGlzIHdheSwgd2hlbiBmbHVzaGVkLCB0aGVcbiAgLy8gc3R5bGluZyBhbGdvcml0aG0ga25vd3MgZXhhY3RseSB3aGF0IHN0eWxlL2NsYXNzIHZhbHVlc1xuICAvLyB0byByZW1vdmUgZnJvbSB0aGUgZWxlbWVudCAoc2luY2UgdGhleSBhcmUgYG51bGxgKS5cbiAgZm9yIChsZXQgaiA9IExTdHlsaW5nTWFwSW5kZXguVmFsdWVzU3RhcnRQb3NpdGlvbjsgaiA8IGxTdHlsaW5nTWFwLmxlbmd0aDtcbiAgICAgICBqICs9IExTdHlsaW5nTWFwSW5kZXguVHVwbGVTaXplKSB7XG4gICAgc2V0TWFwVmFsdWUobFN0eWxpbmdNYXAsIGosIG51bGwpO1xuICB9XG5cbiAgbGV0IHByb3BzOiBzdHJpbmdbXXxudWxsID0gbnVsbDtcbiAgbGV0IG1hcDoge1trZXk6IHN0cmluZ106IGFueX18dW5kZWZpbmVkfG51bGw7XG4gIGxldCBhbGxWYWx1ZXNUcnVlID0gZmFsc2U7XG4gIGlmICh0eXBlb2YgbmV3VmFsdWVzID09PSAnc3RyaW5nJykgeyAgLy8gW2NsYXNzXSBiaW5kaW5ncyBhbGxvdyBzdHJpbmcgdmFsdWVzXG4gICAgaWYgKG5ld1ZhbHVlcy5sZW5ndGgpIHtcbiAgICAgIHByb3BzID0gbmV3VmFsdWVzLnNwbGl0KC9cXHMrLyk7XG4gICAgICBhbGxWYWx1ZXNUcnVlID0gdHJ1ZTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgcHJvcHMgPSBuZXdWYWx1ZXMgPyBPYmplY3Qua2V5cyhuZXdWYWx1ZXMpIDogbnVsbDtcbiAgICBtYXAgPSBuZXdWYWx1ZXM7XG4gIH1cblxuICBpZiAocHJvcHMpIHtcbiAgICBvdXRlcjogZm9yIChsZXQgaSA9IDA7IGkgPCBwcm9wcy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgcHJvcCA9IHByb3BzW2ldIGFzIHN0cmluZztcbiAgICAgIGNvbnN0IHZhbHVlID0gYWxsVmFsdWVzVHJ1ZSA/IHRydWUgOiBtYXAgIVtwcm9wXTtcbiAgICAgIGZvciAobGV0IGogPSBMU3R5bGluZ01hcEluZGV4LlZhbHVlc1N0YXJ0UG9zaXRpb247IGogPCBsU3R5bGluZ01hcC5sZW5ndGg7XG4gICAgICAgICAgIGogKz0gTFN0eWxpbmdNYXBJbmRleC5UdXBsZVNpemUpIHtcbiAgICAgICAgY29uc3QgcHJvcEF0SW5kZXggPSBnZXRNYXBQcm9wKGxTdHlsaW5nTWFwLCBqKTtcbiAgICAgICAgaWYgKHByb3AgPD0gcHJvcEF0SW5kZXgpIHtcbiAgICAgICAgICBpZiAocHJvcEF0SW5kZXggPT09IHByb3ApIHtcbiAgICAgICAgICAgIHNldE1hcFZhbHVlKGxTdHlsaW5nTWFwLCBqLCB2YWx1ZSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGxTdHlsaW5nTWFwLnNwbGljZShqLCAwLCBwcm9wLCB2YWx1ZSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGNvbnRpbnVlIG91dGVyO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBsU3R5bGluZ01hcC5wdXNoKHByb3AsIHZhbHVlKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gbFN0eWxpbmdNYXA7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRNYXBQcm9wKG1hcDogTFN0eWxpbmdNYXAsIGluZGV4OiBudW1iZXIpOiBzdHJpbmcge1xuICByZXR1cm4gbWFwW2luZGV4ICsgTFN0eWxpbmdNYXBJbmRleC5Qcm9wT2Zmc2V0XSBhcyBzdHJpbmc7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXRNYXBWYWx1ZShtYXA6IExTdHlsaW5nTWFwLCBpbmRleDogbnVtYmVyLCB2YWx1ZTogc3RyaW5nIHwgbnVsbCk6IHZvaWQge1xuICBtYXBbaW5kZXggKyBMU3R5bGluZ01hcEluZGV4LlZhbHVlT2Zmc2V0XSA9IHZhbHVlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0TWFwVmFsdWUobWFwOiBMU3R5bGluZ01hcCwgaW5kZXg6IG51bWJlcik6IHN0cmluZ3xudWxsIHtcbiAgcmV0dXJuIG1hcFtpbmRleCArIExTdHlsaW5nTWFwSW5kZXguVmFsdWVPZmZzZXRdIGFzIHN0cmluZyB8IG51bGw7XG59XG4iXX0=