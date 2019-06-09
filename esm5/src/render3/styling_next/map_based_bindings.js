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
export var syncStylingMap = function (context, renderer, element, data, applyStylingFn, sanitizer, mode, targetProp, defaultValue) {
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
            targetPropValueWasApplied = innerSyncStylingMap(context, renderer, element, data, applyStylingFn, sanitizer, mode, targetProp || null, 0, defaultValue || null);
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
function innerSyncStylingMap(context, renderer, element, data, applyStylingFn, sanitizer, mode, targetProp, currentMapIndex, defaultValue) {
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
            var valueApplied = innerSyncStylingMap(context, renderer, element, data, applyStylingFn, sanitizer, innerMode, innerProp, currentMapIndex + 1, defaultValue);
            if (iteratedTooFar) {
                break;
            }
            if (!valueApplied && isValueAllowedToBeApplied(mode, isTargetPropMatched)) {
                var useDefault = isTargetPropMatched && !valueIsDefined;
                var valueToApply = useDefault ? defaultValue : value;
                var bindingIndexToApply = useDefault ? bindingIndex : null;
                var finalValue = sanitizer ?
                    sanitizer(prop, valueToApply, 3 /* ValidateAndSanitize */) :
                    valueToApply;
                applyStylingFn(renderer, element, prop, finalValue, bindingIndexToApply);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFwX2Jhc2VkX2JpbmRpbmdzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9zdHlsaW5nX25leHQvbWFwX2Jhc2VkX2JpbmRpbmdzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQVVBLE9BQU8sRUFBQyxvQkFBb0IsRUFBQyxNQUFNLFlBQVksQ0FBQztBQUVoRCxPQUFPLEVBQUMsZUFBZSxFQUFFLGNBQWMsRUFBRSxxQkFBcUIsRUFBQyxNQUFNLFFBQVEsQ0FBQztBQUc5RTs7Ozs7OztHQU9HO0FBRUg7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7R0ErRUc7QUFDSCxNQUFNLENBQUMsSUFBTSxjQUFjLEdBQ3ZCLFVBQUMsT0FBd0IsRUFBRSxRQUFnRCxFQUFFLE9BQWlCLEVBQzdGLElBQWtCLEVBQUUsY0FBOEIsRUFBRSxTQUFpQyxFQUNyRixJQUF5QixFQUFFLFVBQTBCLEVBQ3JELFlBQTRCO0lBQzNCLElBQUkseUJBQXlCLEdBQUcsS0FBSyxDQUFDO0lBRXRDLHlGQUF5RjtJQUN6RixzRkFBc0Y7SUFDdEYsSUFBTSxTQUFTLEdBQUcsY0FBYyxDQUFDLE9BQU8sOEJBQTJDLENBQUM7SUFDcEYsSUFBSSxTQUFTLEVBQUU7UUFDYixJQUFJLG1CQUFtQixHQUFHLElBQUksQ0FBQztRQUMvQixJQUFNLFlBQVksR0FBRyxDQUFDLFVBQVUsQ0FBQztRQUVqQyxxRUFBcUU7UUFDckUsc0VBQXNFO1FBQ3RFLHFFQUFxRTtRQUNyRSw2QkFBNkI7UUFDN0IsSUFBSSxZQUFZLElBQUksQ0FBQyxJQUFJLEdBQUcsdUJBQW1DLENBQUMsRUFBRTtZQUNoRSxtQkFBbUIsR0FBRyxLQUFLLENBQUM7WUFDNUIseUJBQXlCLEdBQUcsSUFBSSxDQUFDO1NBQ2xDO1FB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LElBQUksSUFBSSxXQUFXLEVBQUU7b0JBQ3ZCLElBQUksV0FBVyxLQUFLLElBQUksRUFBRTt3QkFDeEIsV0FBVyxDQUFDLFdBQVcsRUFBRSxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7cUJBQ3BDO3lCQUFNO3dCQUNMLFdBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUM7cUJBQ3ZDO29CQUNELFNBQVMsS0FBSyxDQUFDO2lCQUNoQjthQUNGO1lBQ0QsV0FBVyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUM7U0FDL0I7S0FDRjtJQUVELE9BQU8sV0FBVyxDQUFDO0FBQ3JCLENBQUM7QUFFRCxNQUFNLFVBQVUsVUFBVSxDQUFDLEdBQWdCLEVBQUUsS0FBYTtJQUN4RCxPQUFPLEdBQUcsQ0FBQyxLQUFLLHFCQUE4QixDQUFXLENBQUM7QUFDNUQsQ0FBQztBQUVELE1BQU0sVUFBVSxXQUFXLENBQUMsR0FBZ0IsRUFBRSxLQUFhLEVBQUUsS0FBb0I7SUFDL0UsR0FBRyxDQUFDLEtBQUssc0JBQStCLENBQUMsR0FBRyxLQUFLLENBQUM7QUFDcEQsQ0FBQztBQUVELE1BQU0sVUFBVSxXQUFXLENBQUMsR0FBZ0IsRUFBRSxLQUFhO0lBQ3pELE9BQU8sR0FBRyxDQUFDLEtBQUssc0JBQStCLENBQWtCLENBQUM7QUFDcEUsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuKiBAbGljZW5zZVxuKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbipcbiogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuKi9cbmltcG9ydCB7U3R5bGVTYW5pdGl6ZUZuLCBTdHlsZVNhbml0aXplTW9kZX0gZnJvbSAnLi4vLi4vc2FuaXRpemF0aW9uL3N0eWxlX3Nhbml0aXplcic7XG5pbXBvcnQge1Byb2NlZHVyYWxSZW5kZXJlcjMsIFJFbGVtZW50LCBSZW5kZXJlcjN9IGZyb20gJy4uL2ludGVyZmFjZXMvcmVuZGVyZXInO1xuXG5pbXBvcnQge3NldFN0eWxpbmdNYXBzU3luY0ZufSBmcm9tICcuL2JpbmRpbmdzJztcbmltcG9ydCB7QXBwbHlTdHlsaW5nRm4sIExTdHlsaW5nRGF0YSwgTFN0eWxpbmdNYXAsIExTdHlsaW5nTWFwSW5kZXgsIFN0eWxpbmdNYXBzU3luY01vZGUsIFN5bmNTdHlsaW5nTWFwc0ZuLCBUU3R5bGluZ0NvbnRleHQsIFRTdHlsaW5nQ29udGV4dEluZGV4fSBmcm9tICcuL2ludGVyZmFjZXMnO1xuaW1wb3J0IHtnZXRCaW5kaW5nVmFsdWUsIGdldFZhbHVlc0NvdW50LCBpc1N0eWxpbmdWYWx1ZURlZmluZWR9IGZyb20gJy4vdXRpbCc7XG5cblxuLyoqXG4gKiAtLS0tLS0tLVxuICpcbiAqIFRoaXMgZmlsZSBjb250YWlucyB0aGUgYWxnb3JpdGhtIGxvZ2ljIGZvciBhcHBseWluZyBtYXAtYmFzZWQgYmluZGluZ3NcbiAqIHN1Y2ggYXMgYFtzdHlsZV1gIGFuZCBgW2NsYXNzXWAuXG4gKlxuICogLS0tLS0tLS1cbiAqL1xuXG4vKipcbiAqIFVzZWQgdG8gYXBwbHkgc3R5bGluZyB2YWx1ZXMgcHJlc2VudGx5IHdpdGhpbiBhbnkgbWFwLWJhc2VkIGJpbmRpbmdzIG9uIGFuIGVsZW1lbnQuXG4gKlxuICogQW5ndWxhciBzdXBwb3J0cyBtYXAtYmFzZWQgc3R5bGluZyBiaW5kaW5ncyB3aGljaCBjYW4gYmUgYXBwbGllZCB2aWEgdGhlXG4gKiBgW3N0eWxlXWAgYW5kIGBbY2xhc3NdYCBiaW5kaW5ncyB3aGljaCBjYW4gYmUgcGxhY2VkIG9uIGFueSBIVE1MIGVsZW1lbnQuXG4gKiBUaGVzZSBiaW5kaW5ncyBjYW4gd29yayBpbmRlcGVuZGVudGx5LCB0b2dldGhlciBvciBhbG9uZ3NpZGUgcHJvcC1iYXNlZFxuICogc3R5bGluZyBiaW5kaW5ncyAoZS5nLiBgPGRpdiBbc3R5bGVdPVwieFwiIFtzdHlsZS53aWR0aF09XCJ3XCI+YCkuXG4gKlxuICogSWYgYSBtYXAtYmFzZWQgc3R5bGluZyBiaW5kaW5nIGlzIGRldGVjdGVkIGJ5IHRoZSBjb21waWxlciwgdGhlIGZvbGxvd2luZ1xuICogQU9UIGNvZGUgaXMgcHJvZHVjZWQ6XG4gKlxuICogYGBgdHlwZXNjcmlwdFxuICogc3R5bGVNYXAoY3R4LnN0eWxlcyk7IC8vIHN0eWxlcyA9IHtrZXk6dmFsdWV9XG4gKiBjbGFzc01hcChjdHguY2xhc3Nlcyk7IC8vIGNsYXNzZXMgPSB7a2V5OnZhbHVlfXxzdHJpbmdcbiAqIGBgYFxuICpcbiAqIElmIGFuZCB3aGVuIGVpdGhlciBvZiB0aGUgaW5zdHJ1Y3Rpb25zIGFib3ZlIGFyZSBldmFsdWF0ZWQsIHRoZW4gdGhlIGNvZGVcbiAqIHByZXNlbnQgaW4gdGhpcyBmaWxlIGlzIGluY2x1ZGVkIGludG8gdGhlIGJ1bmRsZS4gVGhlIG1lY2hhbmlzbSB1c2VkLCB0b1xuICogYWN0aXZhdGUgc3VwcG9ydCBmb3IgbWFwLWJhc2VkIGJpbmRpbmdzIGF0IHJ1bnRpbWUgaXMgcG9zc2libGUgdmlhIHRoZVxuICogYGFjdGl2ZVN0eWxpbmdNYXBGZWF0dXJlYCBmdW5jdGlvbiAod2hpY2ggaXMgYWxzbyBwcmVzZW50IGluIHRoaXMgZmlsZSkuXG4gKlxuICogIyBUaGUgQWxnb3JpdGhtXG4gKiBXaGVuZXZlciBhIG1hcC1iYXNlZCBiaW5kaW5nIHVwZGF0ZXMgKHdoaWNoIGlzIHdoZW4gdGhlIGlkZW50aXR5IG9mIHRoZVxuICogbWFwLXZhbHVlIGNoYW5nZXMpIHRoZW4gdGhlIG1hcCBpcyBpdGVyYXRlZCBvdmVyIGFuZCBhIGBMU3R5bGluZ01hcGAgYXJyYXlcbiAqIGlzIHByb2R1Y2VkLiBUaGUgYExTdHlsaW5nTWFwYCBpbnN0YW5jZSBpcyBzdG9yZWQgaW4gdGhlIGJpbmRpbmcgbG9jYXRpb25cbiAqIHdoZXJlIHRoZSBgQklORElOR19JTkRFWGAgaXMgc2l0dWF0ZWQgd2hlbiB0aGUgYHN0eWxlTWFwKClgIG9yIGBjbGFzc01hcCgpYFxuICogaW5zdHJ1Y3Rpb24gd2VyZSBjYWxsZWQuIE9uY2UgdGhlIGJpbmRpbmcgY2hhbmdlcywgdGhlbiB0aGUgaW50ZXJuYWwgYGJpdE1hc2tgXG4gKiB2YWx1ZSBpcyBtYXJrZWQgYXMgZGlydHkuXG4gKlxuICogU3R5bGluZyB2YWx1ZXMgYXJlIGFwcGxpZWQgb25jZSBDRCBleGl0cyB0aGUgZWxlbWVudCAod2hpY2ggaGFwcGVucyB3aGVuXG4gKiB0aGUgYHNlbGVjdChuKWAgaW5zdHJ1Y3Rpb24gaXMgY2FsbGVkIG9yIHRoZSB0ZW1wbGF0ZSBmdW5jdGlvbiBleGl0cykuIFdoZW5cbiAqIHRoaXMgb2NjdXJzLCBhbGwgcHJvcC1iYXNlZCBiaW5kaW5ncyBhcmUgYXBwbGllZC4gSWYgYSBtYXAtYmFzZWQgYmluZGluZyBpc1xuICogcHJlc2VudCB0aGVuIGEgc3BlY2lhbCBmbHVzaGluZyBmdW5jdGlvbiAoY2FsbGVkIGEgc3luYyBmdW5jdGlvbikgaXMgbWFkZVxuICogYXZhaWxhYmxlIGFuZCBpdCB3aWxsIGJlIGNhbGxlZCBlYWNoIHRpbWUgYSBzdHlsaW5nIHByb3BlcnR5IGlzIGZsdXNoZWQuXG4gKlxuICogVGhlIGZsdXNoaW5nIGFsZ29yaXRobSBpcyBkZXNpZ25lZCB0byBhcHBseSBzdHlsaW5nIGZvciBhIHByb3BlcnR5ICh3aGljaCBpc1xuICogYSBDU1MgcHJvcGVydHkgb3IgYSBjbGFzc05hbWUgdmFsdWUpIG9uZSBieSBvbmUuIElmIG1hcC1iYXNlZCBiaW5kaW5nc1xuICogYXJlIHByZXNlbnQsIHRoZW4gdGhlIGZsdXNoaW5nIGFsZ29yaXRobSB3aWxsIGtlZXAgY2FsbGluZyB0aGUgbWFwcyBzdHlsaW5nXG4gKiBzeW5jIGZ1bmN0aW9uIGVhY2ggdGltZSBhIHByb3BlcnR5IGlzIHZpc2l0ZWQuIFRoaXMgd2F5LCB0aGUgZmx1c2hpbmdcbiAqIGJlaGF2aW9yIG9mIG1hcC1iYXNlZCBiaW5kaW5ncyB3aWxsIGFsd2F5cyBiZSBhdCB0aGUgc2FtZSBwcm9wZXJ0eSBsZXZlbFxuICogYXMgdGhlIGN1cnJlbnQgcHJvcC1iYXNlZCBwcm9wZXJ0eSBiZWluZyBpdGVyYXRlZCBvdmVyIChiZWNhdXNlIGV2ZXJ5dGhpbmdcbiAqIGlzIGFscGhhYmV0aWNhbGx5IHNvcnRlZCkuXG4gKlxuICogTGV0J3MgaW1hZ2luZSB3ZSBoYXZlIHRoZSBmb2xsb3dpbmcgSFRNTCB0ZW1wbGF0ZSBjb2RlOlxuICpcbiAqIGBgYGh0bWxcbiAqIDxkaXYgW3N0eWxlXT1cInt3aWR0aDonMTAwcHgnLCBoZWlnaHQ6JzIwMHB4JywgJ3otaW5kZXgnOicxMCd9XCJcbiAqICAgICAgW3N0eWxlLndpZHRoLnB4XT1cIjIwMFwiPi4uLjwvZGl2PlxuICogYGBgXG4gKlxuICogV2hlbiBDRCBvY2N1cnMsIGJvdGggdGhlIGBbc3R5bGVdYCBhbmQgYFtzdHlsZS53aWR0aF1gIGJpbmRpbmdzXG4gKiBhcmUgZXZhbHVhdGVkLiBUaGVuIHdoZW4gdGhlIHN0eWxlcyBhcmUgZmx1c2hlZCBvbiBzY3JlZW4sIHRoZVxuICogZm9sbG93aW5nIG9wZXJhdGlvbnMgaGFwcGVuOlxuICpcbiAqIDEuIGBbc3R5bGUud2lkdGhdYCBpcyBhdHRlbXB0ZWQgdG8gYmUgd3JpdHRlbiB0byB0aGUgZWxlbWVudC5cbiAqXG4gKiAyLiAgT25jZSB0aGF0IGhhcHBlbnMsIHRoZSBhbGdvcml0aG0gaW5zdHJ1Y3RzIHRoZSBtYXAtYmFzZWRcbiAqICAgICBlbnRyaWVzIChgW3N0eWxlXWAgaW4gdGhpcyBjYXNlKSB0byBcImNhdGNoIHVwXCIgYW5kIGFwcGx5XG4gKiAgICAgYWxsIHZhbHVlcyB1cCB0byB0aGUgYHdpZHRoYCB2YWx1ZS4gV2hlbiB0aGlzIGhhcHBlbnMgdGhlXG4gKiAgICAgYGhlaWdodGAgdmFsdWUgaXMgYXBwbGllZCB0byB0aGUgZWxlbWVudCAoc2luY2UgaXQgaXNcbiAqICAgICBhbHBoYWJldGljYWxseSBzaXR1YXRlZCBiZWZvcmUgdGhlIGB3aWR0aGAgcHJvcGVydHkpLlxuICpcbiAqIDMuIFNpbmNlIHRoZXJlIGFyZSBubyBtb3JlIHByb3AtYmFzZWQgZW50cmllcyBhbnltb3JlLCB0aGVcbiAqICAgIGxvb3AgZXhpdHMgYW5kIHRoZW4sIGp1c3QgYmVmb3JlIHRoZSBmbHVzaGluZyBlbmRzLCBpdFxuICogICAgaW5zdHJ1Y3RzIGFsbCBtYXAtYmFzZWQgYmluZGluZ3MgdG8gXCJmaW5pc2ggdXBcIiBhcHBseWluZ1xuICogICAgdGhlaXIgdmFsdWVzLlxuICpcbiAqIDQuIFRoZSBvbmx5IHJlbWFpbmluZyB2YWx1ZSB3aXRoaW4gdGhlIG1hcC1iYXNlZCBlbnRyaWVzIGlzXG4gKiAgICB0aGUgYHotaW5kZXhgIHZhbHVlIChgd2lkdGhgIGdvdCBza2lwcGVkIGJlY2F1c2UgaXQgd2FzXG4gKiAgICBzdWNjZXNzZnVsbHkgYXBwbGllZCB2aWEgdGhlIHByb3AtYmFzZWQgYFtzdHlsZS53aWR0aF1gXG4gKiAgICBiaW5kaW5nKS4gU2luY2UgYWxsIG1hcC1iYXNlZCBlbnRyaWVzIGFyZSB0b2xkIHRvIFwiZmluaXNoIHVwXCIsXG4gKiAgICB0aGUgYHotaW5kZXhgIHZhbHVlIGlzIGl0ZXJhdGVkIG92ZXIgYW5kIGl0IGlzIHRoZW4gYXBwbGllZFxuICogICAgdG8gdGhlIGVsZW1lbnQuXG4gKlxuICogVGhlIG1vc3QgaW1wb3J0YW50IHRoaW5nIHRvIHRha2Ugbm90ZSBvZiBoZXJlIGlzIHRoYXQgcHJvcC1iYXNlZFxuICogYmluZGluZ3MgYXJlIGV2YWx1YXRlZCBpbiBvcmRlciBhbG9uZ3NpZGUgbWFwLWJhc2VkIGJpbmRpbmdzLlxuICogVGhpcyBhbGxvd3MgYWxsIHN0eWxpbmcgYWNyb3NzIGFuIGVsZW1lbnQgdG8gYmUgYXBwbGllZCBpbiBPKG4pXG4gKiB0aW1lIChhIHNpbWlsYXIgYWxnb3JpdGhtIGlzIHRoYXQgb2YgdGhlIGFycmF5IG1lcmdlIGFsZ29yaXRobVxuICogaW4gbWVyZ2Ugc29ydCkuXG4gKi9cbmV4cG9ydCBjb25zdCBzeW5jU3R5bGluZ01hcDogU3luY1N0eWxpbmdNYXBzRm4gPVxuICAgIChjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQsIHJlbmRlcmVyOiBSZW5kZXJlcjMgfCBQcm9jZWR1cmFsUmVuZGVyZXIzIHwgbnVsbCwgZWxlbWVudDogUkVsZW1lbnQsXG4gICAgIGRhdGE6IExTdHlsaW5nRGF0YSwgYXBwbHlTdHlsaW5nRm46IEFwcGx5U3R5bGluZ0ZuLCBzYW5pdGl6ZXI6IFN0eWxlU2FuaXRpemVGbiB8IG51bGwsXG4gICAgIG1vZGU6IFN0eWxpbmdNYXBzU3luY01vZGUsIHRhcmdldFByb3A/OiBzdHJpbmcgfCBudWxsLFxuICAgICBkZWZhdWx0VmFsdWU/OiBzdHJpbmcgfCBudWxsKTogYm9vbGVhbiA9PiB7XG4gICAgICBsZXQgdGFyZ2V0UHJvcFZhbHVlV2FzQXBwbGllZCA9IGZhbHNlO1xuXG4gICAgICAvLyBvbmNlIHRoZSBtYXAtYmFzZWQgc3R5bGluZyBjb2RlIGlzIGFjdGl2YXRlIGl0IGlzIG5ldmVyIGRlYWN0aXZhdGVkLiBGb3IgdGhpcyByZWFzb24gYVxuICAgICAgLy8gY2hlY2sgdG8gc2VlIGlmIHRoZSBjdXJyZW50IHN0eWxpbmcgY29udGV4dCBoYXMgYW55IG1hcCBiYXNlZCBiaW5kaW5ncyBpcyByZXF1aXJlZC5cbiAgICAgIGNvbnN0IHRvdGFsTWFwcyA9IGdldFZhbHVlc0NvdW50KGNvbnRleHQsIFRTdHlsaW5nQ29udGV4dEluZGV4Lk1hcEJpbmRpbmdzUG9zaXRpb24pO1xuICAgICAgaWYgKHRvdGFsTWFwcykge1xuICAgICAgICBsZXQgcnVuVGhlU3luY0FsZ29yaXRobSA9IHRydWU7XG4gICAgICAgIGNvbnN0IGxvb3BVbnRpbEVuZCA9ICF0YXJnZXRQcm9wO1xuXG4gICAgICAgIC8vIElmIHRoZSBjb2RlIGlzIHRvbGQgdG8gZmluaXNoIHVwIChydW4gdW50aWwgdGhlIGVuZCksIGJ1dCB0aGUgbW9kZVxuICAgICAgICAvLyBoYXNuJ3QgYmVlbiBmbGFnZ2VkIHRvIGFwcGx5IHZhbHVlcyAoaXQgb25seSB0cmF2ZXJzZXMgdmFsdWVzKSB0aGVuXG4gICAgICAgIC8vIHRoZXJlIGlzIG5vIHBvaW50IGluIGl0ZXJhdGluZyBvdmVyIHRoZSBhcnJheSBiZWNhdXNlIG5vdGhpbmcgd2lsbFxuICAgICAgICAvLyBiZSBhcHBsaWVkIHRvIHRoZSBlbGVtZW50LlxuICAgICAgICBpZiAobG9vcFVudGlsRW5kICYmIChtb2RlICYgflN0eWxpbmdNYXBzU3luY01vZGUuQXBwbHlBbGxWYWx1ZXMpKSB7XG4gICAgICAgICAgcnVuVGhlU3luY0FsZ29yaXRobSA9IGZhbHNlO1xuICAgICAgICAgIHRhcmdldFByb3BWYWx1ZVdhc0FwcGxpZWQgPSB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHJ1blRoZVN5bmNBbGdvcml0aG0pIHtcbiAgICAgICAgICB0YXJnZXRQcm9wVmFsdWVXYXNBcHBsaWVkID0gaW5uZXJTeW5jU3R5bGluZ01hcChcbiAgICAgICAgICAgICAgY29udGV4dCwgcmVuZGVyZXIsIGVsZW1lbnQsIGRhdGEsIGFwcGx5U3R5bGluZ0ZuLCBzYW5pdGl6ZXIsIG1vZGUsIHRhcmdldFByb3AgfHwgbnVsbCxcbiAgICAgICAgICAgICAgMCwgZGVmYXVsdFZhbHVlIHx8IG51bGwpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGxvb3BVbnRpbEVuZCkge1xuICAgICAgICAgIHJlc2V0U3luY0N1cnNvcnMoKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gdGFyZ2V0UHJvcFZhbHVlV2FzQXBwbGllZDtcbiAgICB9O1xuXG4vKipcbiAqIFJlY3Vyc2l2ZSBmdW5jdGlvbiBkZXNpZ25lZCB0byBhcHBseSBtYXAtYmFzZWQgc3R5bGluZyB0byBhbiBlbGVtZW50IG9uZSBtYXAgYXQgYSB0aW1lLlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gaXMgZGVzaWduZWQgdG8gYmUgY2FsbGVkIGZyb20gdGhlIGBzeW5jU3R5bGluZ01hcGAgZnVuY3Rpb24gYW5kIHdpbGxcbiAqIGFwcGx5IG1hcC1iYXNlZCBzdHlsaW5nIGRhdGEgb25lIG1hcCBhdCBhIHRpbWUgdG8gdGhlIHByb3ZpZGVkIGBlbGVtZW50YC5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIGlzIHJlY3Vyc2l2ZSBhbmQgaXQgd2lsbCBjYWxsIGl0c2VsZiBpZiBhIGZvbGxvdy11cCBtYXAgdmFsdWUgaXMgdG8gYmVcbiAqIHByb2Nlc3NlZC4gVG8gbGVhcm4gbW9yZSBhYm91dCBob3cgdGhlIGFsZ29yaXRobSB3b3Jrcywgc2VlIGBzeW5jU3R5bGluZ01hcGAuXG4gKi9cbmZ1bmN0aW9uIGlubmVyU3luY1N0eWxpbmdNYXAoXG4gICAgY29udGV4dDogVFN0eWxpbmdDb250ZXh0LCByZW5kZXJlcjogUmVuZGVyZXIzIHwgUHJvY2VkdXJhbFJlbmRlcmVyMyB8IG51bGwsIGVsZW1lbnQ6IFJFbGVtZW50LFxuICAgIGRhdGE6IExTdHlsaW5nRGF0YSwgYXBwbHlTdHlsaW5nRm46IEFwcGx5U3R5bGluZ0ZuLCBzYW5pdGl6ZXI6IFN0eWxlU2FuaXRpemVGbiB8IG51bGwsXG4gICAgbW9kZTogU3R5bGluZ01hcHNTeW5jTW9kZSwgdGFyZ2V0UHJvcDogc3RyaW5nIHwgbnVsbCwgY3VycmVudE1hcEluZGV4OiBudW1iZXIsXG4gICAgZGVmYXVsdFZhbHVlOiBzdHJpbmcgfCBudWxsKTogYm9vbGVhbiB7XG4gIGxldCB0YXJnZXRQcm9wVmFsdWVXYXNBcHBsaWVkID0gZmFsc2U7XG5cbiAgY29uc3QgdG90YWxNYXBzID0gZ2V0VmFsdWVzQ291bnQoY29udGV4dCwgVFN0eWxpbmdDb250ZXh0SW5kZXguTWFwQmluZGluZ3NQb3NpdGlvbik7XG4gIGlmIChjdXJyZW50TWFwSW5kZXggPCB0b3RhbE1hcHMpIHtcbiAgICBjb25zdCBiaW5kaW5nSW5kZXggPSBnZXRCaW5kaW5nVmFsdWUoXG4gICAgICAgIGNvbnRleHQsIFRTdHlsaW5nQ29udGV4dEluZGV4Lk1hcEJpbmRpbmdzUG9zaXRpb24sIGN1cnJlbnRNYXBJbmRleCkgYXMgbnVtYmVyO1xuICAgIGNvbnN0IGxTdHlsaW5nTWFwID0gZGF0YVtiaW5kaW5nSW5kZXhdIGFzIExTdHlsaW5nTWFwO1xuXG4gICAgbGV0IGN1cnNvciA9IGdldEN1cnJlbnRTeW5jQ3Vyc29yKGN1cnJlbnRNYXBJbmRleCk7XG4gICAgd2hpbGUgKGN1cnNvciA8IGxTdHlsaW5nTWFwLmxlbmd0aCkge1xuICAgICAgY29uc3QgcHJvcCA9IGdldE1hcFByb3AobFN0eWxpbmdNYXAsIGN1cnNvcik7XG4gICAgICBjb25zdCBpdGVyYXRlZFRvb0ZhciA9IHRhcmdldFByb3AgJiYgcHJvcCA+IHRhcmdldFByb3A7XG4gICAgICBjb25zdCBpc1RhcmdldFByb3BNYXRjaGVkID0gIWl0ZXJhdGVkVG9vRmFyICYmIHByb3AgPT09IHRhcmdldFByb3A7XG4gICAgICBjb25zdCB2YWx1ZSA9IGdldE1hcFZhbHVlKGxTdHlsaW5nTWFwLCBjdXJzb3IpO1xuICAgICAgY29uc3QgdmFsdWVJc0RlZmluZWQgPSBpc1N0eWxpbmdWYWx1ZURlZmluZWQodmFsdWUpO1xuXG4gICAgICAvLyB0aGUgcmVjdXJzaXZlIGNvZGUgaXMgZGVzaWduZWQgdG8ga2VlcCBhcHBseWluZyB1bnRpbFxuICAgICAgLy8gaXQgcmVhY2hlcyBvciBnb2VzIHBhc3QgdGhlIHRhcmdldCBwcm9wLiBJZiBhbmQgd2hlblxuICAgICAgLy8gdGhpcyBoYXBwZW5zIHRoZW4gaXQgd2lsbCBzdG9wIHByb2Nlc3NpbmcgdmFsdWVzLCBidXRcbiAgICAgIC8vIGFsbCBvdGhlciBtYXAgdmFsdWVzIG11c3QgYWxzbyBjYXRjaCB1cCB0byB0aGUgc2FtZVxuICAgICAgLy8gcG9pbnQuIFRoaXMgaXMgd2h5IGEgcmVjdXJzaXZlIGNhbGwgaXMgc3RpbGwgaXNzdWVkXG4gICAgICAvLyBldmVuIGlmIHRoZSBjb2RlIGhhcyBpdGVyYXRlZCB0b28gZmFyLlxuICAgICAgY29uc3QgaW5uZXJNb2RlID1cbiAgICAgICAgICBpdGVyYXRlZFRvb0ZhciA/IG1vZGUgOiByZXNvbHZlSW5uZXJNYXBNb2RlKG1vZGUsIHZhbHVlSXNEZWZpbmVkLCBpc1RhcmdldFByb3BNYXRjaGVkKTtcbiAgICAgIGNvbnN0IGlubmVyUHJvcCA9IGl0ZXJhdGVkVG9vRmFyID8gdGFyZ2V0UHJvcCA6IHByb3A7XG4gICAgICBsZXQgdmFsdWVBcHBsaWVkID0gaW5uZXJTeW5jU3R5bGluZ01hcChcbiAgICAgICAgICBjb250ZXh0LCByZW5kZXJlciwgZWxlbWVudCwgZGF0YSwgYXBwbHlTdHlsaW5nRm4sIHNhbml0aXplciwgaW5uZXJNb2RlLCBpbm5lclByb3AsXG4gICAgICAgICAgY3VycmVudE1hcEluZGV4ICsgMSwgZGVmYXVsdFZhbHVlKTtcblxuICAgICAgaWYgKGl0ZXJhdGVkVG9vRmFyKSB7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuXG4gICAgICBpZiAoIXZhbHVlQXBwbGllZCAmJiBpc1ZhbHVlQWxsb3dlZFRvQmVBcHBsaWVkKG1vZGUsIGlzVGFyZ2V0UHJvcE1hdGNoZWQpKSB7XG4gICAgICAgIGNvbnN0IHVzZURlZmF1bHQgPSBpc1RhcmdldFByb3BNYXRjaGVkICYmICF2YWx1ZUlzRGVmaW5lZDtcbiAgICAgICAgY29uc3QgdmFsdWVUb0FwcGx5ID0gdXNlRGVmYXVsdCA/IGRlZmF1bHRWYWx1ZSA6IHZhbHVlO1xuICAgICAgICBjb25zdCBiaW5kaW5nSW5kZXhUb0FwcGx5ID0gdXNlRGVmYXVsdCA/IGJpbmRpbmdJbmRleCA6IG51bGw7XG4gICAgICAgIGNvbnN0IGZpbmFsVmFsdWUgPSBzYW5pdGl6ZXIgP1xuICAgICAgICAgICAgc2FuaXRpemVyKHByb3AsIHZhbHVlVG9BcHBseSwgU3R5bGVTYW5pdGl6ZU1vZGUuVmFsaWRhdGVBbmRTYW5pdGl6ZSkgOlxuICAgICAgICAgICAgdmFsdWVUb0FwcGx5O1xuICAgICAgICBhcHBseVN0eWxpbmdGbihyZW5kZXJlciwgZWxlbWVudCwgcHJvcCwgZmluYWxWYWx1ZSwgYmluZGluZ0luZGV4VG9BcHBseSk7XG4gICAgICAgIHZhbHVlQXBwbGllZCA9IHRydWU7XG4gICAgICB9XG5cbiAgICAgIHRhcmdldFByb3BWYWx1ZVdhc0FwcGxpZWQgPSB2YWx1ZUFwcGxpZWQgJiYgaXNUYXJnZXRQcm9wTWF0Y2hlZDtcbiAgICAgIGN1cnNvciArPSBMU3R5bGluZ01hcEluZGV4LlR1cGxlU2l6ZTtcbiAgICB9XG4gICAgc2V0Q3VycmVudFN5bmNDdXJzb3IoY3VycmVudE1hcEluZGV4LCBjdXJzb3IpO1xuICB9XG5cbiAgcmV0dXJuIHRhcmdldFByb3BWYWx1ZVdhc0FwcGxpZWQ7XG59XG5cblxuLyoqXG4gKiBFbmFibGVzIHN1cHBvcnQgZm9yIG1hcC1iYXNlZCBzdHlsaW5nIGJpbmRpbmdzIChlLmcuIGBbc3R5bGVdYCBhbmQgYFtjbGFzc11gIGJpbmRpbmdzKS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFjdGl2ZVN0eWxpbmdNYXBGZWF0dXJlKCkge1xuICBzZXRTdHlsaW5nTWFwc1N5bmNGbihzeW5jU3R5bGluZ01hcCk7XG59XG5cbi8qKlxuICogVXNlZCB0byBkZXRlcm1pbmUgdGhlIG1vZGUgZm9yIHRoZSBpbm5lciByZWN1cnNpdmUgY2FsbC5cbiAqXG4gKiBJZiBhbiBpbm5lciBtYXAgaXMgaXRlcmF0ZWQgb24gdGhlbiB0aGlzIGlzIGRvbmUgc28gZm9yIG9uZVxuICogb2YgdHdvIHJlYXNvbnM6XG4gKlxuICogLSBUaGUgdGFyZ2V0IHByb3BlcnR5IHdhcyBkZXRlY3RlZCBhbmQgdGhlIGlubmVyIG1hcFxuICogICBtdXN0IG5vdyBcImNhdGNoIHVwXCIgKHBvaW50ZXItd2lzZSkgdXAgdG8gd2hlcmUgdGhlIGN1cnJlbnRcbiAqICAgbWFwJ3MgY3Vyc29yIGlzIHNpdHVhdGVkLlxuICpcbiAqIC0gVGhlIHRhcmdldCBwcm9wZXJ0eSB3YXMgbm90IGRldGVjdGVkIGluIHRoZSBjdXJyZW50IG1hcFxuICogICBhbmQgbXVzdCBiZSBmb3VuZCBpbiBhbiBpbm5lciBtYXAuIFRoaXMgY2FuIG9ubHkgYmUgYWxsb3dlZFxuICogICBpZiB0aGUgY3VycmVudCBtYXAgaXRlcmF0aW9uIGlzIG5vdCBzZXQgdG8gc2tpcCB0aGUgdGFyZ2V0XG4gKiAgIHByb3BlcnR5LlxuICovXG5mdW5jdGlvbiByZXNvbHZlSW5uZXJNYXBNb2RlKFxuICAgIGN1cnJlbnRNb2RlOiBudW1iZXIsIHZhbHVlSXNEZWZpbmVkOiBib29sZWFuLCBpc0V4YWN0TWF0Y2g6IGJvb2xlYW4pOiBudW1iZXIge1xuICBsZXQgaW5uZXJNb2RlID0gY3VycmVudE1vZGU7XG4gIGlmICghdmFsdWVJc0RlZmluZWQgJiYgaXNFeGFjdE1hdGNoICYmICEoY3VycmVudE1vZGUgJiBTdHlsaW5nTWFwc1N5bmNNb2RlLlNraXBUYXJnZXRQcm9wKSkge1xuICAgIC8vIGNhc2UgMTogc2V0IHRoZSBtb2RlIHRvIGFwcGx5IHRoZSB0YXJnZXRlZCBwcm9wIHZhbHVlIGlmIGl0XG4gICAgLy8gZW5kcyB1cCBiZWluZyBlbmNvdW50ZXJlZCBpbiBhbm90aGVyIG1hcCB2YWx1ZVxuICAgIGlubmVyTW9kZSB8PSBTdHlsaW5nTWFwc1N5bmNNb2RlLkFwcGx5VGFyZ2V0UHJvcDtcbiAgICBpbm5lck1vZGUgJj0gflN0eWxpbmdNYXBzU3luY01vZGUuU2tpcFRhcmdldFByb3A7XG4gIH0gZWxzZSB7XG4gICAgLy8gY2FzZSAyOiBzZXQgdGhlIG1vZGUgdG8gc2tpcCB0aGUgdGFyZ2V0ZWQgcHJvcCB2YWx1ZSBpZiBpdFxuICAgIC8vIGVuZHMgdXAgYmVpbmcgZW5jb3VudGVyZWQgaW4gYW5vdGhlciBtYXAgdmFsdWVcbiAgICBpbm5lck1vZGUgfD0gU3R5bGluZ01hcHNTeW5jTW9kZS5Ta2lwVGFyZ2V0UHJvcDtcbiAgICBpbm5lck1vZGUgJj0gflN0eWxpbmdNYXBzU3luY01vZGUuQXBwbHlUYXJnZXRQcm9wO1xuICB9XG4gIHJldHVybiBpbm5lck1vZGU7XG59XG5cbi8qKlxuICogRGVjaWRlcyB3aGV0aGVyIG9yIG5vdCBhIHByb3AvdmFsdWUgZW50cnkgd2lsbCBiZSBhcHBsaWVkIHRvIGFuIGVsZW1lbnQuXG4gKlxuICogVG8gZGV0ZXJtaW5lIHdoZXRoZXIgb3Igbm90IGEgdmFsdWUgaXMgdG8gYmUgYXBwbGllZCxcbiAqIHRoZSBmb2xsb3dpbmcgcHJvY2VkdXJlIGlzIGV2YWx1YXRlZDpcbiAqXG4gKiBGaXJzdCBjaGVjayB0byBzZWUgdGhlIGN1cnJlbnQgYG1vZGVgIHN0YXR1czpcbiAqICAxLiBJZiB0aGUgbW9kZSB2YWx1ZSBwZXJtaXRzIGFsbCBwcm9wcyB0byBiZSBhcHBsaWVkIHRoZW4gYWxsb3cuXG4gKiAgICAtIEJ1dCBkbyBub3QgYWxsb3cgaWYgdGhlIGN1cnJlbnQgcHJvcCBpcyBzZXQgdG8gYmUgc2tpcHBlZC5cbiAqICAyLiBPdGhlcndpc2UgaWYgdGhlIGN1cnJlbnQgcHJvcCBpcyBwZXJtaXR0ZWQgdGhlbiBhbGxvdy5cbiAqL1xuZnVuY3Rpb24gaXNWYWx1ZUFsbG93ZWRUb0JlQXBwbGllZChtb2RlOiBudW1iZXIsIGlzVGFyZ2V0UHJvcE1hdGNoZWQ6IGJvb2xlYW4pIHtcbiAgbGV0IGRvQXBwbHlWYWx1ZSA9IChtb2RlICYgU3R5bGluZ01hcHNTeW5jTW9kZS5BcHBseUFsbFZhbHVlcykgPiAwO1xuICBpZiAoIWRvQXBwbHlWYWx1ZSkge1xuICAgIGlmIChtb2RlICYgU3R5bGluZ01hcHNTeW5jTW9kZS5BcHBseVRhcmdldFByb3ApIHtcbiAgICAgIGRvQXBwbHlWYWx1ZSA9IGlzVGFyZ2V0UHJvcE1hdGNoZWQ7XG4gICAgfVxuICB9IGVsc2UgaWYgKChtb2RlICYgU3R5bGluZ01hcHNTeW5jTW9kZS5Ta2lwVGFyZ2V0UHJvcCkgJiYgaXNUYXJnZXRQcm9wTWF0Y2hlZCkge1xuICAgIGRvQXBwbHlWYWx1ZSA9IGZhbHNlO1xuICB9XG4gIHJldHVybiBkb0FwcGx5VmFsdWU7XG59XG5cbi8qKlxuICogVXNlZCB0byBrZWVwIHRyYWNrIG9mIGNvbmN1cnJlbnQgY3Vyc29yIHZhbHVlcyBmb3IgbXVsdGlwbGUgbWFwLWJhc2VkIHN0eWxpbmcgYmluZGluZ3MgcHJlc2VudCBvblxuICogYW4gZWxlbWVudC5cbiAqL1xuY29uc3QgTUFQX0NVUlNPUlM6IG51bWJlcltdID0gW107XG5cbi8qKlxuICogVXNlZCB0byByZXNldCB0aGUgc3RhdGUgb2YgZWFjaCBjdXJzb3IgdmFsdWUgYmVpbmcgdXNlZCB0byBpdGVyYXRlIG92ZXIgbWFwLWJhc2VkIHN0eWxpbmdcbiAqIGJpbmRpbmdzLlxuICovXG5mdW5jdGlvbiByZXNldFN5bmNDdXJzb3JzKCkge1xuICBmb3IgKGxldCBpID0gMDsgaSA8IE1BUF9DVVJTT1JTLmxlbmd0aDsgaSsrKSB7XG4gICAgTUFQX0NVUlNPUlNbaV0gPSBMU3R5bGluZ01hcEluZGV4LlZhbHVlc1N0YXJ0UG9zaXRpb247XG4gIH1cbn1cblxuLyoqXG4gKiBSZXR1cm5zIGFuIGFjdGl2ZSBjdXJzb3IgdmFsdWUgYXQgYSBnaXZlbiBtYXBJbmRleCBsb2NhdGlvbi5cbiAqL1xuZnVuY3Rpb24gZ2V0Q3VycmVudFN5bmNDdXJzb3IobWFwSW5kZXg6IG51bWJlcikge1xuICBpZiAobWFwSW5kZXggPj0gTUFQX0NVUlNPUlMubGVuZ3RoKSB7XG4gICAgTUFQX0NVUlNPUlMucHVzaChMU3R5bGluZ01hcEluZGV4LlZhbHVlc1N0YXJ0UG9zaXRpb24pO1xuICB9XG4gIHJldHVybiBNQVBfQ1VSU09SU1ttYXBJbmRleF07XG59XG5cbi8qKlxuICogU2V0cyBhIGN1cnNvciB2YWx1ZSBhdCBhIGdpdmVuIG1hcEluZGV4IGxvY2F0aW9uLlxuICovXG5mdW5jdGlvbiBzZXRDdXJyZW50U3luY0N1cnNvcihtYXBJbmRleDogbnVtYmVyLCBpbmRleFZhbHVlOiBudW1iZXIpIHtcbiAgTUFQX0NVUlNPUlNbbWFwSW5kZXhdID0gaW5kZXhWYWx1ZTtcbn1cblxuLyoqXG4gKiBVc2VkIHRvIGNvbnZlcnQgYSB7a2V5OnZhbHVlfSBtYXAgaW50byBhIGBMU3R5bGluZ01hcGAgYXJyYXkuXG4gKlxuICogVGhpcyBmdW5jdGlvbiB3aWxsIGVpdGhlciBnZW5lcmF0ZSBhIG5ldyBgTFN0eWxpbmdNYXBgIGluc3RhbmNlXG4gKiBvciBpdCB3aWxsIHBhdGNoIHRoZSBwcm92aWRlZCBgbmV3VmFsdWVzYCBtYXAgdmFsdWUgaW50byBhblxuICogZXhpc3RpbmcgYExTdHlsaW5nTWFwYCB2YWx1ZSAodGhpcyBvbmx5IGhhcHBlbnMgaWYgYGJpbmRpbmdWYWx1ZWBcbiAqIGlzIGFuIGluc3RhbmNlIG9mIGBMU3R5bGluZ01hcGApLlxuICpcbiAqIElmIGEgbmV3IGtleS92YWx1ZSBtYXAgaXMgcHJvdmlkZWQgd2l0aCBhbiBvbGQgYExTdHlsaW5nTWFwYFxuICogdmFsdWUgdGhlbiBhbGwgcHJvcGVydGllcyB3aWxsIGJlIG92ZXJ3cml0dGVuIHdpdGggdGhlaXIgbmV3XG4gKiB2YWx1ZXMgb3Igd2l0aCBgbnVsbGAuIFRoaXMgbWVhbnMgdGhhdCB0aGUgYXJyYXkgd2lsbCBuZXZlclxuICogc2hyaW5rIGluIHNpemUgKGJ1dCBpdCB3aWxsIGFsc28gbm90IGJlIGNyZWF0ZWQgYW5kIHRocm93blxuICogYXdheSB3aGVuZXZlciB0aGUge2tleTp2YWx1ZX0gbWFwIGVudHJpZXMgY2hhbmdlKS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG5vcm1hbGl6ZUludG9TdHlsaW5nTWFwKFxuICAgIGJpbmRpbmdWYWx1ZTogbnVsbCB8IExTdHlsaW5nTWFwLFxuICAgIG5ld1ZhbHVlczoge1trZXk6IHN0cmluZ106IGFueX0gfCBzdHJpbmcgfCBudWxsIHwgdW5kZWZpbmVkKTogTFN0eWxpbmdNYXAge1xuICBjb25zdCBsU3R5bGluZ01hcDogTFN0eWxpbmdNYXAgPSBBcnJheS5pc0FycmF5KGJpbmRpbmdWYWx1ZSkgPyBiaW5kaW5nVmFsdWUgOiBbbnVsbF07XG4gIGxTdHlsaW5nTWFwW0xTdHlsaW5nTWFwSW5kZXguUmF3VmFsdWVQb3NpdGlvbl0gPSBuZXdWYWx1ZXMgfHwgbnVsbDtcblxuICAvLyBiZWNhdXNlIHRoZSBuZXcgdmFsdWVzIG1heSBub3QgaW5jbHVkZSBhbGwgdGhlIHByb3BlcnRpZXNcbiAgLy8gdGhhdCB0aGUgb2xkIG9uZXMgaGFkLCBhbGwgdmFsdWVzIGFyZSBzZXQgdG8gYG51bGxgIGJlZm9yZVxuICAvLyB0aGUgbmV3IHZhbHVlcyBhcmUgYXBwbGllZC4gVGhpcyB3YXksIHdoZW4gZmx1c2hlZCwgdGhlXG4gIC8vIHN0eWxpbmcgYWxnb3JpdGhtIGtub3dzIGV4YWN0bHkgd2hhdCBzdHlsZS9jbGFzcyB2YWx1ZXNcbiAgLy8gdG8gcmVtb3ZlIGZyb20gdGhlIGVsZW1lbnQgKHNpbmNlIHRoZXkgYXJlIGBudWxsYCkuXG4gIGZvciAobGV0IGogPSBMU3R5bGluZ01hcEluZGV4LlZhbHVlc1N0YXJ0UG9zaXRpb247IGogPCBsU3R5bGluZ01hcC5sZW5ndGg7XG4gICAgICAgaiArPSBMU3R5bGluZ01hcEluZGV4LlR1cGxlU2l6ZSkge1xuICAgIHNldE1hcFZhbHVlKGxTdHlsaW5nTWFwLCBqLCBudWxsKTtcbiAgfVxuXG4gIGxldCBwcm9wczogc3RyaW5nW118bnVsbCA9IG51bGw7XG4gIGxldCBtYXA6IHtba2V5OiBzdHJpbmddOiBhbnl9fHVuZGVmaW5lZHxudWxsO1xuICBsZXQgYWxsVmFsdWVzVHJ1ZSA9IGZhbHNlO1xuICBpZiAodHlwZW9mIG5ld1ZhbHVlcyA9PT0gJ3N0cmluZycpIHsgIC8vIFtjbGFzc10gYmluZGluZ3MgYWxsb3cgc3RyaW5nIHZhbHVlc1xuICAgIGlmIChuZXdWYWx1ZXMubGVuZ3RoKSB7XG4gICAgICBwcm9wcyA9IG5ld1ZhbHVlcy5zcGxpdCgvXFxzKy8pO1xuICAgICAgYWxsVmFsdWVzVHJ1ZSA9IHRydWU7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIHByb3BzID0gbmV3VmFsdWVzID8gT2JqZWN0LmtleXMobmV3VmFsdWVzKSA6IG51bGw7XG4gICAgbWFwID0gbmV3VmFsdWVzO1xuICB9XG5cbiAgaWYgKHByb3BzKSB7XG4gICAgb3V0ZXI6IGZvciAobGV0IGkgPSAwOyBpIDwgcHJvcHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IHByb3AgPSBwcm9wc1tpXSBhcyBzdHJpbmc7XG4gICAgICBjb25zdCB2YWx1ZSA9IGFsbFZhbHVlc1RydWUgPyB0cnVlIDogbWFwICFbcHJvcF07XG4gICAgICBmb3IgKGxldCBqID0gTFN0eWxpbmdNYXBJbmRleC5WYWx1ZXNTdGFydFBvc2l0aW9uOyBqIDwgbFN0eWxpbmdNYXAubGVuZ3RoO1xuICAgICAgICAgICBqICs9IExTdHlsaW5nTWFwSW5kZXguVHVwbGVTaXplKSB7XG4gICAgICAgIGNvbnN0IHByb3BBdEluZGV4ID0gZ2V0TWFwUHJvcChsU3R5bGluZ01hcCwgaik7XG4gICAgICAgIGlmIChwcm9wIDw9IHByb3BBdEluZGV4KSB7XG4gICAgICAgICAgaWYgKHByb3BBdEluZGV4ID09PSBwcm9wKSB7XG4gICAgICAgICAgICBzZXRNYXBWYWx1ZShsU3R5bGluZ01hcCwgaiwgdmFsdWUpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBsU3R5bGluZ01hcC5zcGxpY2UoaiwgMCwgcHJvcCwgdmFsdWUpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBjb250aW51ZSBvdXRlcjtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgbFN0eWxpbmdNYXAucHVzaChwcm9wLCB2YWx1ZSk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGxTdHlsaW5nTWFwO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0TWFwUHJvcChtYXA6IExTdHlsaW5nTWFwLCBpbmRleDogbnVtYmVyKTogc3RyaW5nIHtcbiAgcmV0dXJuIG1hcFtpbmRleCArIExTdHlsaW5nTWFwSW5kZXguUHJvcE9mZnNldF0gYXMgc3RyaW5nO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2V0TWFwVmFsdWUobWFwOiBMU3R5bGluZ01hcCwgaW5kZXg6IG51bWJlciwgdmFsdWU6IHN0cmluZyB8IG51bGwpOiB2b2lkIHtcbiAgbWFwW2luZGV4ICsgTFN0eWxpbmdNYXBJbmRleC5WYWx1ZU9mZnNldF0gPSB2YWx1ZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldE1hcFZhbHVlKG1hcDogTFN0eWxpbmdNYXAsIGluZGV4OiBudW1iZXIpOiBzdHJpbmd8bnVsbCB7XG4gIHJldHVybiBtYXBbaW5kZXggKyBMU3R5bGluZ01hcEluZGV4LlZhbHVlT2Zmc2V0XSBhcyBzdHJpbmcgfCBudWxsO1xufVxuIl19