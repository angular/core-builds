/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
import { setStylingMapsSyncFn } from './bindings';
import { getBindingValue, getValuesCount, isStylingValueDefined } from './util';
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
 * @type {?}
 */
export const syncStylingMap = (/**
 * @param {?} context
 * @param {?} renderer
 * @param {?} element
 * @param {?} data
 * @param {?} applyStylingFn
 * @param {?} sanitizer
 * @param {?} mode
 * @param {?=} targetProp
 * @param {?=} defaultValue
 * @return {?}
 */
(context, renderer, element, data, applyStylingFn, sanitizer, mode, targetProp, defaultValue) => {
    /** @type {?} */
    let targetPropValueWasApplied = false;
    // once the map-based styling code is activate it is never deactivated. For this reason a
    // check to see if the current styling context has any map based bindings is required.
    /** @type {?} */
    const totalMaps = getValuesCount(context, 2 /* MapBindingsPosition */);
    if (totalMaps) {
        /** @type {?} */
        let runTheSyncAlgorithm = true;
        /** @type {?} */
        const loopUntilEnd = !targetProp;
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
});
/**
 * Recursive function designed to apply map-based styling to an element one map at a time.
 *
 * This function is designed to be called from the `syncStylingMap` function and will
 * apply map-based styling data one map at a time to the provided `element`.
 *
 * This function is recursive and it will call itself if a follow-up map value is to be
 * processed. To learn more about how the algorithm works, see `syncStylingMap`.
 * @param {?} context
 * @param {?} renderer
 * @param {?} element
 * @param {?} data
 * @param {?} applyStylingFn
 * @param {?} sanitizer
 * @param {?} mode
 * @param {?} targetProp
 * @param {?} currentMapIndex
 * @param {?} defaultValue
 * @return {?}
 */
function innerSyncStylingMap(context, renderer, element, data, applyStylingFn, sanitizer, mode, targetProp, currentMapIndex, defaultValue) {
    /** @type {?} */
    let targetPropValueWasApplied = false;
    /** @type {?} */
    const totalMaps = getValuesCount(context, 2 /* MapBindingsPosition */);
    if (currentMapIndex < totalMaps) {
        /** @type {?} */
        const bindingIndex = (/** @type {?} */ (getBindingValue(context, 2 /* MapBindingsPosition */, currentMapIndex)));
        /** @type {?} */
        const lStylingMap = (/** @type {?} */ (data[bindingIndex]));
        /** @type {?} */
        let cursor = getCurrentSyncCursor(currentMapIndex);
        while (cursor < lStylingMap.length) {
            /** @type {?} */
            const prop = getMapProp(lStylingMap, cursor);
            /** @type {?} */
            const iteratedTooFar = targetProp && prop > targetProp;
            /** @type {?} */
            const isTargetPropMatched = !iteratedTooFar && prop === targetProp;
            /** @type {?} */
            const value = getMapValue(lStylingMap, cursor);
            /** @type {?} */
            const valueIsDefined = isStylingValueDefined(value);
            // the recursive code is designed to keep applying until
            // it reaches or goes past the target prop. If and when
            // this happens then it will stop processing values, but
            // all other map values must also catch up to the same
            // point. This is why a recursive call is still issued
            // even if the code has iterated too far.
            /** @type {?} */
            const innerMode = iteratedTooFar ? mode : resolveInnerMapMode(mode, valueIsDefined, isTargetPropMatched);
            /** @type {?} */
            const innerProp = iteratedTooFar ? targetProp : prop;
            /** @type {?} */
            let valueApplied = innerSyncStylingMap(context, renderer, element, data, applyStylingFn, sanitizer, innerMode, innerProp, currentMapIndex + 1, defaultValue);
            if (iteratedTooFar) {
                break;
            }
            if (!valueApplied && isValueAllowedToBeApplied(mode, isTargetPropMatched)) {
                /** @type {?} */
                const useDefault = isTargetPropMatched && !valueIsDefined;
                /** @type {?} */
                const valueToApply = useDefault ? defaultValue : value;
                /** @type {?} */
                const bindingIndexToApply = useDefault ? bindingIndex : null;
                /** @type {?} */
                const finalValue = sanitizer ?
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
 * @return {?}
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
 * @param {?} currentMode
 * @param {?} valueIsDefined
 * @param {?} isExactMatch
 * @return {?}
 */
function resolveInnerMapMode(currentMode, valueIsDefined, isExactMatch) {
    /** @type {?} */
    let innerMode = currentMode;
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
 * @param {?} mode
 * @param {?} isTargetPropMatched
 * @return {?}
 */
function isValueAllowedToBeApplied(mode, isTargetPropMatched) {
    /** @type {?} */
    let doApplyValue = (mode & 1 /* ApplyAllValues */) > 0;
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
 * @type {?}
 */
const MAP_CURSORS = [];
/**
 * Used to reset the state of each cursor value being used to iterate over map-based styling
 * bindings.
 * @return {?}
 */
function resetSyncCursors() {
    for (let i = 0; i < MAP_CURSORS.length; i++) {
        MAP_CURSORS[i] = 1 /* ValuesStartPosition */;
    }
}
/**
 * Returns an active cursor value at a given mapIndex location.
 * @param {?} mapIndex
 * @return {?}
 */
function getCurrentSyncCursor(mapIndex) {
    if (mapIndex >= MAP_CURSORS.length) {
        MAP_CURSORS.push(1 /* ValuesStartPosition */);
    }
    return MAP_CURSORS[mapIndex];
}
/**
 * Sets a cursor value at a given mapIndex location.
 * @param {?} mapIndex
 * @param {?} indexValue
 * @return {?}
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
 * @param {?} bindingValue
 * @param {?} newValues
 * @return {?}
 */
export function normalizeIntoStylingMap(bindingValue, newValues) {
    /** @type {?} */
    const lStylingMap = Array.isArray(bindingValue) ? bindingValue : [null];
    lStylingMap[0 /* RawValuePosition */] = newValues || null;
    // because the new values may not include all the properties
    // that the old ones had, all values are set to `null` before
    // the new values are applied. This way, when flushed, the
    // styling algorithm knows exactly what style/class values
    // to remove from the element (since they are `null`).
    for (let j = 1 /* ValuesStartPosition */; j < lStylingMap.length; j += 2 /* TupleSize */) {
        setMapValue(lStylingMap, j, null);
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
        outer: for (let i = 0; i < props.length; i++) {
            /** @type {?} */
            const prop = (/** @type {?} */ (props[i]));
            /** @type {?} */
            const value = allValuesTrue ? true : (/** @type {?} */ (map))[prop];
            for (let j = 1 /* ValuesStartPosition */; j < lStylingMap.length; j += 2 /* TupleSize */) {
                /** @type {?} */
                const propAtIndex = getMapProp(lStylingMap, j);
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
/**
 * @param {?} map
 * @param {?} index
 * @return {?}
 */
export function getMapProp(map, index) {
    return (/** @type {?} */ (map[index + 0 /* PropOffset */]));
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFwX2Jhc2VkX2JpbmRpbmdzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9zdHlsaW5nX25leHQvbWFwX2Jhc2VkX2JpbmRpbmdzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7QUFVQSxPQUFPLEVBQUMsb0JBQW9CLEVBQUMsTUFBTSxZQUFZLENBQUM7QUFFaEQsT0FBTyxFQUFDLGVBQWUsRUFBRSxjQUFjLEVBQUUscUJBQXFCLEVBQUMsTUFBTSxRQUFRLENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUE0RjlFLE1BQU0sT0FBTyxjQUFjOzs7Ozs7Ozs7Ozs7QUFDdkIsQ0FBQyxPQUF3QixFQUFFLFFBQWdELEVBQUUsT0FBaUIsRUFDN0YsSUFBa0IsRUFBRSxjQUE4QixFQUFFLFNBQWlDLEVBQ3JGLElBQXlCLEVBQUUsVUFBMEIsRUFDckQsWUFBNEIsRUFBVyxFQUFFOztRQUNwQyx5QkFBeUIsR0FBRyxLQUFLOzs7O1VBSS9CLFNBQVMsR0FBRyxjQUFjLENBQUMsT0FBTyw4QkFBMkM7SUFDbkYsSUFBSSxTQUFTLEVBQUU7O1lBQ1QsbUJBQW1CLEdBQUcsSUFBSTs7Y0FDeEIsWUFBWSxHQUFHLENBQUMsVUFBVTtRQUVoQyxxRUFBcUU7UUFDckUsc0VBQXNFO1FBQ3RFLHFFQUFxRTtRQUNyRSw2QkFBNkI7UUFDN0IsSUFBSSxZQUFZLElBQUksQ0FBQyxJQUFJLEdBQUcsdUJBQW1DLENBQUMsRUFBRTtZQUNoRSxtQkFBbUIsR0FBRyxLQUFLLENBQUM7WUFDNUIseUJBQXlCLEdBQUcsSUFBSSxDQUFDO1NBQ2xDO1FBRUQsSUFBSSxtQkFBbUIsRUFBRTtZQUN2Qix5QkFBeUIsR0FBRyxtQkFBbUIsQ0FDM0MsT0FBTyxFQUFFLFFBQVEsRUFBRSxP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TyxtQkFBQSxHQUFHLENBQUMsS0FBSyxxQkFBOEIsQ0FBQyxFQUFVLENBQUM7QUFDNUQsQ0FBQzs7Ozs7OztBQUVELE1BQU0sVUFBVSxXQUFXLENBQUMsR0FBZ0IsRUFBRSxLQUFhLEVBQUUsS0FBb0I7SUFDL0UsR0FBRyxDQUFDLEtBQUssc0JBQStCLENBQUMsR0FBRyxLQUFLLENBQUM7QUFDcEQsQ0FBQzs7Ozs7O0FBRUQsTUFBTSxVQUFVLFdBQVcsQ0FBQyxHQUFnQixFQUFFLEtBQWE7SUFDekQsT0FBTyxtQkFBQSxHQUFHLENBQUMsS0FBSyxzQkFBK0IsQ0FBQyxFQUFpQixDQUFDO0FBQ3BFLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiogQGxpY2Vuc2VcbiogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4qXG4qIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4qIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiovXG5pbXBvcnQge1N0eWxlU2FuaXRpemVGbiwgU3R5bGVTYW5pdGl6ZU1vZGV9IGZyb20gJy4uLy4uL3Nhbml0aXphdGlvbi9zdHlsZV9zYW5pdGl6ZXInO1xuaW1wb3J0IHtQcm9jZWR1cmFsUmVuZGVyZXIzLCBSRWxlbWVudCwgUmVuZGVyZXIzfSBmcm9tICcuLi9pbnRlcmZhY2VzL3JlbmRlcmVyJztcblxuaW1wb3J0IHtzZXRTdHlsaW5nTWFwc1N5bmNGbn0gZnJvbSAnLi9iaW5kaW5ncyc7XG5pbXBvcnQge0FwcGx5U3R5bGluZ0ZuLCBMU3R5bGluZ0RhdGEsIExTdHlsaW5nTWFwLCBMU3R5bGluZ01hcEluZGV4LCBTdHlsaW5nTWFwc1N5bmNNb2RlLCBTeW5jU3R5bGluZ01hcHNGbiwgVFN0eWxpbmdDb250ZXh0LCBUU3R5bGluZ0NvbnRleHRJbmRleH0gZnJvbSAnLi9pbnRlcmZhY2VzJztcbmltcG9ydCB7Z2V0QmluZGluZ1ZhbHVlLCBnZXRWYWx1ZXNDb3VudCwgaXNTdHlsaW5nVmFsdWVEZWZpbmVkfSBmcm9tICcuL3V0aWwnO1xuXG5cbi8qKlxuICogLS0tLS0tLS1cbiAqXG4gKiBUaGlzIGZpbGUgY29udGFpbnMgdGhlIGFsZ29yaXRobSBsb2dpYyBmb3IgYXBwbHlpbmcgbWFwLWJhc2VkIGJpbmRpbmdzXG4gKiBzdWNoIGFzIGBbc3R5bGVdYCBhbmQgYFtjbGFzc11gLlxuICpcbiAqIC0tLS0tLS0tXG4gKi9cblxuLyoqXG4gKiBVc2VkIHRvIGFwcGx5IHN0eWxpbmcgdmFsdWVzIHByZXNlbnRseSB3aXRoaW4gYW55IG1hcC1iYXNlZCBiaW5kaW5ncyBvbiBhbiBlbGVtZW50LlxuICpcbiAqIEFuZ3VsYXIgc3VwcG9ydHMgbWFwLWJhc2VkIHN0eWxpbmcgYmluZGluZ3Mgd2hpY2ggY2FuIGJlIGFwcGxpZWQgdmlhIHRoZVxuICogYFtzdHlsZV1gIGFuZCBgW2NsYXNzXWAgYmluZGluZ3Mgd2hpY2ggY2FuIGJlIHBsYWNlZCBvbiBhbnkgSFRNTCBlbGVtZW50LlxuICogVGhlc2UgYmluZGluZ3MgY2FuIHdvcmsgaW5kZXBlbmRlbnRseSwgdG9nZXRoZXIgb3IgYWxvbmdzaWRlIHByb3AtYmFzZWRcbiAqIHN0eWxpbmcgYmluZGluZ3MgKGUuZy4gYDxkaXYgW3N0eWxlXT1cInhcIiBbc3R5bGUud2lkdGhdPVwid1wiPmApLlxuICpcbiAqIElmIGEgbWFwLWJhc2VkIHN0eWxpbmcgYmluZGluZyBpcyBkZXRlY3RlZCBieSB0aGUgY29tcGlsZXIsIHRoZSBmb2xsb3dpbmdcbiAqIEFPVCBjb2RlIGlzIHByb2R1Y2VkOlxuICpcbiAqIGBgYHR5cGVzY3JpcHRcbiAqIHN0eWxlTWFwKGN0eC5zdHlsZXMpOyAvLyBzdHlsZXMgPSB7a2V5OnZhbHVlfVxuICogY2xhc3NNYXAoY3R4LmNsYXNzZXMpOyAvLyBjbGFzc2VzID0ge2tleTp2YWx1ZX18c3RyaW5nXG4gKiBgYGBcbiAqXG4gKiBJZiBhbmQgd2hlbiBlaXRoZXIgb2YgdGhlIGluc3RydWN0aW9ucyBhYm92ZSBhcmUgZXZhbHVhdGVkLCB0aGVuIHRoZSBjb2RlXG4gKiBwcmVzZW50IGluIHRoaXMgZmlsZSBpcyBpbmNsdWRlZCBpbnRvIHRoZSBidW5kbGUuIFRoZSBtZWNoYW5pc20gdXNlZCwgdG9cbiAqIGFjdGl2YXRlIHN1cHBvcnQgZm9yIG1hcC1iYXNlZCBiaW5kaW5ncyBhdCBydW50aW1lIGlzIHBvc3NpYmxlIHZpYSB0aGVcbiAqIGBhY3RpdmVTdHlsaW5nTWFwRmVhdHVyZWAgZnVuY3Rpb24gKHdoaWNoIGlzIGFsc28gcHJlc2VudCBpbiB0aGlzIGZpbGUpLlxuICpcbiAqICMgVGhlIEFsZ29yaXRobVxuICogV2hlbmV2ZXIgYSBtYXAtYmFzZWQgYmluZGluZyB1cGRhdGVzICh3aGljaCBpcyB3aGVuIHRoZSBpZGVudGl0eSBvZiB0aGVcbiAqIG1hcC12YWx1ZSBjaGFuZ2VzKSB0aGVuIHRoZSBtYXAgaXMgaXRlcmF0ZWQgb3ZlciBhbmQgYSBgTFN0eWxpbmdNYXBgIGFycmF5XG4gKiBpcyBwcm9kdWNlZC4gVGhlIGBMU3R5bGluZ01hcGAgaW5zdGFuY2UgaXMgc3RvcmVkIGluIHRoZSBiaW5kaW5nIGxvY2F0aW9uXG4gKiB3aGVyZSB0aGUgYEJJTkRJTkdfSU5ERVhgIGlzIHNpdHVhdGVkIHdoZW4gdGhlIGBzdHlsZU1hcCgpYCBvciBgY2xhc3NNYXAoKWBcbiAqIGluc3RydWN0aW9uIHdlcmUgY2FsbGVkLiBPbmNlIHRoZSBiaW5kaW5nIGNoYW5nZXMsIHRoZW4gdGhlIGludGVybmFsIGBiaXRNYXNrYFxuICogdmFsdWUgaXMgbWFya2VkIGFzIGRpcnR5LlxuICpcbiAqIFN0eWxpbmcgdmFsdWVzIGFyZSBhcHBsaWVkIG9uY2UgQ0QgZXhpdHMgdGhlIGVsZW1lbnQgKHdoaWNoIGhhcHBlbnMgd2hlblxuICogdGhlIGBzZWxlY3QobilgIGluc3RydWN0aW9uIGlzIGNhbGxlZCBvciB0aGUgdGVtcGxhdGUgZnVuY3Rpb24gZXhpdHMpLiBXaGVuXG4gKiB0aGlzIG9jY3VycywgYWxsIHByb3AtYmFzZWQgYmluZGluZ3MgYXJlIGFwcGxpZWQuIElmIGEgbWFwLWJhc2VkIGJpbmRpbmcgaXNcbiAqIHByZXNlbnQgdGhlbiBhIHNwZWNpYWwgZmx1c2hpbmcgZnVuY3Rpb24gKGNhbGxlZCBhIHN5bmMgZnVuY3Rpb24pIGlzIG1hZGVcbiAqIGF2YWlsYWJsZSBhbmQgaXQgd2lsbCBiZSBjYWxsZWQgZWFjaCB0aW1lIGEgc3R5bGluZyBwcm9wZXJ0eSBpcyBmbHVzaGVkLlxuICpcbiAqIFRoZSBmbHVzaGluZyBhbGdvcml0aG0gaXMgZGVzaWduZWQgdG8gYXBwbHkgc3R5bGluZyBmb3IgYSBwcm9wZXJ0eSAod2hpY2ggaXNcbiAqIGEgQ1NTIHByb3BlcnR5IG9yIGEgY2xhc3NOYW1lIHZhbHVlKSBvbmUgYnkgb25lLiBJZiBtYXAtYmFzZWQgYmluZGluZ3NcbiAqIGFyZSBwcmVzZW50LCB0aGVuIHRoZSBmbHVzaGluZyBhbGdvcml0aG0gd2lsbCBrZWVwIGNhbGxpbmcgdGhlIG1hcHMgc3R5bGluZ1xuICogc3luYyBmdW5jdGlvbiBlYWNoIHRpbWUgYSBwcm9wZXJ0eSBpcyB2aXNpdGVkLiBUaGlzIHdheSwgdGhlIGZsdXNoaW5nXG4gKiBiZWhhdmlvciBvZiBtYXAtYmFzZWQgYmluZGluZ3Mgd2lsbCBhbHdheXMgYmUgYXQgdGhlIHNhbWUgcHJvcGVydHkgbGV2ZWxcbiAqIGFzIHRoZSBjdXJyZW50IHByb3AtYmFzZWQgcHJvcGVydHkgYmVpbmcgaXRlcmF0ZWQgb3ZlciAoYmVjYXVzZSBldmVyeXRoaW5nXG4gKiBpcyBhbHBoYWJldGljYWxseSBzb3J0ZWQpLlxuICpcbiAqIExldCdzIGltYWdpbmUgd2UgaGF2ZSB0aGUgZm9sbG93aW5nIEhUTUwgdGVtcGxhdGUgY29kZTpcbiAqXG4gKiBgYGBodG1sXG4gKiA8ZGl2IFtzdHlsZV09XCJ7d2lkdGg6JzEwMHB4JywgaGVpZ2h0OicyMDBweCcsICd6LWluZGV4JzonMTAnfVwiXG4gKiAgICAgIFtzdHlsZS53aWR0aC5weF09XCIyMDBcIj4uLi48L2Rpdj5cbiAqIGBgYFxuICpcbiAqIFdoZW4gQ0Qgb2NjdXJzLCBib3RoIHRoZSBgW3N0eWxlXWAgYW5kIGBbc3R5bGUud2lkdGhdYCBiaW5kaW5nc1xuICogYXJlIGV2YWx1YXRlZC4gVGhlbiB3aGVuIHRoZSBzdHlsZXMgYXJlIGZsdXNoZWQgb24gc2NyZWVuLCB0aGVcbiAqIGZvbGxvd2luZyBvcGVyYXRpb25zIGhhcHBlbjpcbiAqXG4gKiAxLiBgW3N0eWxlLndpZHRoXWAgaXMgYXR0ZW1wdGVkIHRvIGJlIHdyaXR0ZW4gdG8gdGhlIGVsZW1lbnQuXG4gKlxuICogMi4gIE9uY2UgdGhhdCBoYXBwZW5zLCB0aGUgYWxnb3JpdGhtIGluc3RydWN0cyB0aGUgbWFwLWJhc2VkXG4gKiAgICAgZW50cmllcyAoYFtzdHlsZV1gIGluIHRoaXMgY2FzZSkgdG8gXCJjYXRjaCB1cFwiIGFuZCBhcHBseVxuICogICAgIGFsbCB2YWx1ZXMgdXAgdG8gdGhlIGB3aWR0aGAgdmFsdWUuIFdoZW4gdGhpcyBoYXBwZW5zIHRoZVxuICogICAgIGBoZWlnaHRgIHZhbHVlIGlzIGFwcGxpZWQgdG8gdGhlIGVsZW1lbnQgKHNpbmNlIGl0IGlzXG4gKiAgICAgYWxwaGFiZXRpY2FsbHkgc2l0dWF0ZWQgYmVmb3JlIHRoZSBgd2lkdGhgIHByb3BlcnR5KS5cbiAqXG4gKiAzLiBTaW5jZSB0aGVyZSBhcmUgbm8gbW9yZSBwcm9wLWJhc2VkIGVudHJpZXMgYW55bW9yZSwgdGhlXG4gKiAgICBsb29wIGV4aXRzIGFuZCB0aGVuLCBqdXN0IGJlZm9yZSB0aGUgZmx1c2hpbmcgZW5kcywgaXRcbiAqICAgIGluc3RydWN0cyBhbGwgbWFwLWJhc2VkIGJpbmRpbmdzIHRvIFwiZmluaXNoIHVwXCIgYXBwbHlpbmdcbiAqICAgIHRoZWlyIHZhbHVlcy5cbiAqXG4gKiA0LiBUaGUgb25seSByZW1haW5pbmcgdmFsdWUgd2l0aGluIHRoZSBtYXAtYmFzZWQgZW50cmllcyBpc1xuICogICAgdGhlIGB6LWluZGV4YCB2YWx1ZSAoYHdpZHRoYCBnb3Qgc2tpcHBlZCBiZWNhdXNlIGl0IHdhc1xuICogICAgc3VjY2Vzc2Z1bGx5IGFwcGxpZWQgdmlhIHRoZSBwcm9wLWJhc2VkIGBbc3R5bGUud2lkdGhdYFxuICogICAgYmluZGluZykuIFNpbmNlIGFsbCBtYXAtYmFzZWQgZW50cmllcyBhcmUgdG9sZCB0byBcImZpbmlzaCB1cFwiLFxuICogICAgdGhlIGB6LWluZGV4YCB2YWx1ZSBpcyBpdGVyYXRlZCBvdmVyIGFuZCBpdCBpcyB0aGVuIGFwcGxpZWRcbiAqICAgIHRvIHRoZSBlbGVtZW50LlxuICpcbiAqIFRoZSBtb3N0IGltcG9ydGFudCB0aGluZyB0byB0YWtlIG5vdGUgb2YgaGVyZSBpcyB0aGF0IHByb3AtYmFzZWRcbiAqIGJpbmRpbmdzIGFyZSBldmFsdWF0ZWQgaW4gb3JkZXIgYWxvbmdzaWRlIG1hcC1iYXNlZCBiaW5kaW5ncy5cbiAqIFRoaXMgYWxsb3dzIGFsbCBzdHlsaW5nIGFjcm9zcyBhbiBlbGVtZW50IHRvIGJlIGFwcGxpZWQgaW4gTyhuKVxuICogdGltZSAoYSBzaW1pbGFyIGFsZ29yaXRobSBpcyB0aGF0IG9mIHRoZSBhcnJheSBtZXJnZSBhbGdvcml0aG1cbiAqIGluIG1lcmdlIHNvcnQpLlxuICovXG5leHBvcnQgY29uc3Qgc3luY1N0eWxpbmdNYXA6IFN5bmNTdHlsaW5nTWFwc0ZuID1cbiAgICAoY29udGV4dDogVFN0eWxpbmdDb250ZXh0LCByZW5kZXJlcjogUmVuZGVyZXIzIHwgUHJvY2VkdXJhbFJlbmRlcmVyMyB8IG51bGwsIGVsZW1lbnQ6IFJFbGVtZW50LFxuICAgICBkYXRhOiBMU3R5bGluZ0RhdGEsIGFwcGx5U3R5bGluZ0ZuOiBBcHBseVN0eWxpbmdGbiwgc2FuaXRpemVyOiBTdHlsZVNhbml0aXplRm4gfCBudWxsLFxuICAgICBtb2RlOiBTdHlsaW5nTWFwc1N5bmNNb2RlLCB0YXJnZXRQcm9wPzogc3RyaW5nIHwgbnVsbCxcbiAgICAgZGVmYXVsdFZhbHVlPzogc3RyaW5nIHwgbnVsbCk6IGJvb2xlYW4gPT4ge1xuICAgICAgbGV0IHRhcmdldFByb3BWYWx1ZVdhc0FwcGxpZWQgPSBmYWxzZTtcblxuICAgICAgLy8gb25jZSB0aGUgbWFwLWJhc2VkIHN0eWxpbmcgY29kZSBpcyBhY3RpdmF0ZSBpdCBpcyBuZXZlciBkZWFjdGl2YXRlZC4gRm9yIHRoaXMgcmVhc29uIGFcbiAgICAgIC8vIGNoZWNrIHRvIHNlZSBpZiB0aGUgY3VycmVudCBzdHlsaW5nIGNvbnRleHQgaGFzIGFueSBtYXAgYmFzZWQgYmluZGluZ3MgaXMgcmVxdWlyZWQuXG4gICAgICBjb25zdCB0b3RhbE1hcHMgPSBnZXRWYWx1ZXNDb3VudChjb250ZXh0LCBUU3R5bGluZ0NvbnRleHRJbmRleC5NYXBCaW5kaW5nc1Bvc2l0aW9uKTtcbiAgICAgIGlmICh0b3RhbE1hcHMpIHtcbiAgICAgICAgbGV0IHJ1blRoZVN5bmNBbGdvcml0aG0gPSB0cnVlO1xuICAgICAgICBjb25zdCBsb29wVW50aWxFbmQgPSAhdGFyZ2V0UHJvcDtcblxuICAgICAgICAvLyBJZiB0aGUgY29kZSBpcyB0b2xkIHRvIGZpbmlzaCB1cCAocnVuIHVudGlsIHRoZSBlbmQpLCBidXQgdGhlIG1vZGVcbiAgICAgICAgLy8gaGFzbid0IGJlZW4gZmxhZ2dlZCB0byBhcHBseSB2YWx1ZXMgKGl0IG9ubHkgdHJhdmVyc2VzIHZhbHVlcykgdGhlblxuICAgICAgICAvLyB0aGVyZSBpcyBubyBwb2ludCBpbiBpdGVyYXRpbmcgb3ZlciB0aGUgYXJyYXkgYmVjYXVzZSBub3RoaW5nIHdpbGxcbiAgICAgICAgLy8gYmUgYXBwbGllZCB0byB0aGUgZWxlbWVudC5cbiAgICAgICAgaWYgKGxvb3BVbnRpbEVuZCAmJiAobW9kZSAmIH5TdHlsaW5nTWFwc1N5bmNNb2RlLkFwcGx5QWxsVmFsdWVzKSkge1xuICAgICAgICAgIHJ1blRoZVN5bmNBbGdvcml0aG0gPSBmYWxzZTtcbiAgICAgICAgICB0YXJnZXRQcm9wVmFsdWVXYXNBcHBsaWVkID0gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChydW5UaGVTeW5jQWxnb3JpdGhtKSB7XG4gICAgICAgICAgdGFyZ2V0UHJvcFZhbHVlV2FzQXBwbGllZCA9IGlubmVyU3luY1N0eWxpbmdNYXAoXG4gICAgICAgICAgICAgIGNvbnRleHQsIHJlbmRlcmVyLCBlbGVtZW50LCBkYXRhLCBhcHBseVN0eWxpbmdGbiwgc2FuaXRpemVyLCBtb2RlLCB0YXJnZXRQcm9wIHx8IG51bGwsXG4gICAgICAgICAgICAgIDAsIGRlZmF1bHRWYWx1ZSB8fCBudWxsKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChsb29wVW50aWxFbmQpIHtcbiAgICAgICAgICByZXNldFN5bmNDdXJzb3JzKCk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHRhcmdldFByb3BWYWx1ZVdhc0FwcGxpZWQ7XG4gICAgfTtcblxuLyoqXG4gKiBSZWN1cnNpdmUgZnVuY3Rpb24gZGVzaWduZWQgdG8gYXBwbHkgbWFwLWJhc2VkIHN0eWxpbmcgdG8gYW4gZWxlbWVudCBvbmUgbWFwIGF0IGEgdGltZS5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIGlzIGRlc2lnbmVkIHRvIGJlIGNhbGxlZCBmcm9tIHRoZSBgc3luY1N0eWxpbmdNYXBgIGZ1bmN0aW9uIGFuZCB3aWxsXG4gKiBhcHBseSBtYXAtYmFzZWQgc3R5bGluZyBkYXRhIG9uZSBtYXAgYXQgYSB0aW1lIHRvIHRoZSBwcm92aWRlZCBgZWxlbWVudGAuXG4gKlxuICogVGhpcyBmdW5jdGlvbiBpcyByZWN1cnNpdmUgYW5kIGl0IHdpbGwgY2FsbCBpdHNlbGYgaWYgYSBmb2xsb3ctdXAgbWFwIHZhbHVlIGlzIHRvIGJlXG4gKiBwcm9jZXNzZWQuIFRvIGxlYXJuIG1vcmUgYWJvdXQgaG93IHRoZSBhbGdvcml0aG0gd29ya3MsIHNlZSBgc3luY1N0eWxpbmdNYXBgLlxuICovXG5mdW5jdGlvbiBpbm5lclN5bmNTdHlsaW5nTWFwKFxuICAgIGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCwgcmVuZGVyZXI6IFJlbmRlcmVyMyB8IFByb2NlZHVyYWxSZW5kZXJlcjMgfCBudWxsLCBlbGVtZW50OiBSRWxlbWVudCxcbiAgICBkYXRhOiBMU3R5bGluZ0RhdGEsIGFwcGx5U3R5bGluZ0ZuOiBBcHBseVN0eWxpbmdGbiwgc2FuaXRpemVyOiBTdHlsZVNhbml0aXplRm4gfCBudWxsLFxuICAgIG1vZGU6IFN0eWxpbmdNYXBzU3luY01vZGUsIHRhcmdldFByb3A6IHN0cmluZyB8IG51bGwsIGN1cnJlbnRNYXBJbmRleDogbnVtYmVyLFxuICAgIGRlZmF1bHRWYWx1ZTogc3RyaW5nIHwgbnVsbCk6IGJvb2xlYW4ge1xuICBsZXQgdGFyZ2V0UHJvcFZhbHVlV2FzQXBwbGllZCA9IGZhbHNlO1xuXG4gIGNvbnN0IHRvdGFsTWFwcyA9IGdldFZhbHVlc0NvdW50KGNvbnRleHQsIFRTdHlsaW5nQ29udGV4dEluZGV4Lk1hcEJpbmRpbmdzUG9zaXRpb24pO1xuICBpZiAoY3VycmVudE1hcEluZGV4IDwgdG90YWxNYXBzKSB7XG4gICAgY29uc3QgYmluZGluZ0luZGV4ID0gZ2V0QmluZGluZ1ZhbHVlKFxuICAgICAgICBjb250ZXh0LCBUU3R5bGluZ0NvbnRleHRJbmRleC5NYXBCaW5kaW5nc1Bvc2l0aW9uLCBjdXJyZW50TWFwSW5kZXgpIGFzIG51bWJlcjtcbiAgICBjb25zdCBsU3R5bGluZ01hcCA9IGRhdGFbYmluZGluZ0luZGV4XSBhcyBMU3R5bGluZ01hcDtcblxuICAgIGxldCBjdXJzb3IgPSBnZXRDdXJyZW50U3luY0N1cnNvcihjdXJyZW50TWFwSW5kZXgpO1xuICAgIHdoaWxlIChjdXJzb3IgPCBsU3R5bGluZ01hcC5sZW5ndGgpIHtcbiAgICAgIGNvbnN0IHByb3AgPSBnZXRNYXBQcm9wKGxTdHlsaW5nTWFwLCBjdXJzb3IpO1xuICAgICAgY29uc3QgaXRlcmF0ZWRUb29GYXIgPSB0YXJnZXRQcm9wICYmIHByb3AgPiB0YXJnZXRQcm9wO1xuICAgICAgY29uc3QgaXNUYXJnZXRQcm9wTWF0Y2hlZCA9ICFpdGVyYXRlZFRvb0ZhciAmJiBwcm9wID09PSB0YXJnZXRQcm9wO1xuICAgICAgY29uc3QgdmFsdWUgPSBnZXRNYXBWYWx1ZShsU3R5bGluZ01hcCwgY3Vyc29yKTtcbiAgICAgIGNvbnN0IHZhbHVlSXNEZWZpbmVkID0gaXNTdHlsaW5nVmFsdWVEZWZpbmVkKHZhbHVlKTtcblxuICAgICAgLy8gdGhlIHJlY3Vyc2l2ZSBjb2RlIGlzIGRlc2lnbmVkIHRvIGtlZXAgYXBwbHlpbmcgdW50aWxcbiAgICAgIC8vIGl0IHJlYWNoZXMgb3IgZ29lcyBwYXN0IHRoZSB0YXJnZXQgcHJvcC4gSWYgYW5kIHdoZW5cbiAgICAgIC8vIHRoaXMgaGFwcGVucyB0aGVuIGl0IHdpbGwgc3RvcCBwcm9jZXNzaW5nIHZhbHVlcywgYnV0XG4gICAgICAvLyBhbGwgb3RoZXIgbWFwIHZhbHVlcyBtdXN0IGFsc28gY2F0Y2ggdXAgdG8gdGhlIHNhbWVcbiAgICAgIC8vIHBvaW50LiBUaGlzIGlzIHdoeSBhIHJlY3Vyc2l2ZSBjYWxsIGlzIHN0aWxsIGlzc3VlZFxuICAgICAgLy8gZXZlbiBpZiB0aGUgY29kZSBoYXMgaXRlcmF0ZWQgdG9vIGZhci5cbiAgICAgIGNvbnN0IGlubmVyTW9kZSA9XG4gICAgICAgICAgaXRlcmF0ZWRUb29GYXIgPyBtb2RlIDogcmVzb2x2ZUlubmVyTWFwTW9kZShtb2RlLCB2YWx1ZUlzRGVmaW5lZCwgaXNUYXJnZXRQcm9wTWF0Y2hlZCk7XG4gICAgICBjb25zdCBpbm5lclByb3AgPSBpdGVyYXRlZFRvb0ZhciA/IHRhcmdldFByb3AgOiBwcm9wO1xuICAgICAgbGV0IHZhbHVlQXBwbGllZCA9IGlubmVyU3luY1N0eWxpbmdNYXAoXG4gICAgICAgICAgY29udGV4dCwgcmVuZGVyZXIsIGVsZW1lbnQsIGRhdGEsIGFwcGx5U3R5bGluZ0ZuLCBzYW5pdGl6ZXIsIGlubmVyTW9kZSwgaW5uZXJQcm9wLFxuICAgICAgICAgIGN1cnJlbnRNYXBJbmRleCArIDEsIGRlZmF1bHRWYWx1ZSk7XG5cbiAgICAgIGlmIChpdGVyYXRlZFRvb0Zhcikge1xuICAgICAgICBicmVhaztcbiAgICAgIH1cblxuICAgICAgaWYgKCF2YWx1ZUFwcGxpZWQgJiYgaXNWYWx1ZUFsbG93ZWRUb0JlQXBwbGllZChtb2RlLCBpc1RhcmdldFByb3BNYXRjaGVkKSkge1xuICAgICAgICBjb25zdCB1c2VEZWZhdWx0ID0gaXNUYXJnZXRQcm9wTWF0Y2hlZCAmJiAhdmFsdWVJc0RlZmluZWQ7XG4gICAgICAgIGNvbnN0IHZhbHVlVG9BcHBseSA9IHVzZURlZmF1bHQgPyBkZWZhdWx0VmFsdWUgOiB2YWx1ZTtcbiAgICAgICAgY29uc3QgYmluZGluZ0luZGV4VG9BcHBseSA9IHVzZURlZmF1bHQgPyBiaW5kaW5nSW5kZXggOiBudWxsO1xuICAgICAgICBjb25zdCBmaW5hbFZhbHVlID0gc2FuaXRpemVyID9cbiAgICAgICAgICAgIHNhbml0aXplcihwcm9wLCB2YWx1ZVRvQXBwbHksIFN0eWxlU2FuaXRpemVNb2RlLlZhbGlkYXRlQW5kU2FuaXRpemUpIDpcbiAgICAgICAgICAgIHZhbHVlVG9BcHBseTtcbiAgICAgICAgYXBwbHlTdHlsaW5nRm4ocmVuZGVyZXIsIGVsZW1lbnQsIHByb3AsIGZpbmFsVmFsdWUsIGJpbmRpbmdJbmRleFRvQXBwbHkpO1xuICAgICAgICB2YWx1ZUFwcGxpZWQgPSB0cnVlO1xuICAgICAgfVxuXG4gICAgICB0YXJnZXRQcm9wVmFsdWVXYXNBcHBsaWVkID0gdmFsdWVBcHBsaWVkICYmIGlzVGFyZ2V0UHJvcE1hdGNoZWQ7XG4gICAgICBjdXJzb3IgKz0gTFN0eWxpbmdNYXBJbmRleC5UdXBsZVNpemU7XG4gICAgfVxuICAgIHNldEN1cnJlbnRTeW5jQ3Vyc29yKGN1cnJlbnRNYXBJbmRleCwgY3Vyc29yKTtcbiAgfVxuXG4gIHJldHVybiB0YXJnZXRQcm9wVmFsdWVXYXNBcHBsaWVkO1xufVxuXG5cbi8qKlxuICogRW5hYmxlcyBzdXBwb3J0IGZvciBtYXAtYmFzZWQgc3R5bGluZyBiaW5kaW5ncyAoZS5nLiBgW3N0eWxlXWAgYW5kIGBbY2xhc3NdYCBiaW5kaW5ncykuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhY3RpdmVTdHlsaW5nTWFwRmVhdHVyZSgpIHtcbiAgc2V0U3R5bGluZ01hcHNTeW5jRm4oc3luY1N0eWxpbmdNYXApO1xufVxuXG4vKipcbiAqIFVzZWQgdG8gZGV0ZXJtaW5lIHRoZSBtb2RlIGZvciB0aGUgaW5uZXIgcmVjdXJzaXZlIGNhbGwuXG4gKlxuICogSWYgYW4gaW5uZXIgbWFwIGlzIGl0ZXJhdGVkIG9uIHRoZW4gdGhpcyBpcyBkb25lIHNvIGZvciBvbmVcbiAqIG9mIHR3byByZWFzb25zOlxuICpcbiAqIC0gVGhlIHRhcmdldCBwcm9wZXJ0eSB3YXMgZGV0ZWN0ZWQgYW5kIHRoZSBpbm5lciBtYXBcbiAqICAgbXVzdCBub3cgXCJjYXRjaCB1cFwiIChwb2ludGVyLXdpc2UpIHVwIHRvIHdoZXJlIHRoZSBjdXJyZW50XG4gKiAgIG1hcCdzIGN1cnNvciBpcyBzaXR1YXRlZC5cbiAqXG4gKiAtIFRoZSB0YXJnZXQgcHJvcGVydHkgd2FzIG5vdCBkZXRlY3RlZCBpbiB0aGUgY3VycmVudCBtYXBcbiAqICAgYW5kIG11c3QgYmUgZm91bmQgaW4gYW4gaW5uZXIgbWFwLiBUaGlzIGNhbiBvbmx5IGJlIGFsbG93ZWRcbiAqICAgaWYgdGhlIGN1cnJlbnQgbWFwIGl0ZXJhdGlvbiBpcyBub3Qgc2V0IHRvIHNraXAgdGhlIHRhcmdldFxuICogICBwcm9wZXJ0eS5cbiAqL1xuZnVuY3Rpb24gcmVzb2x2ZUlubmVyTWFwTW9kZShcbiAgICBjdXJyZW50TW9kZTogbnVtYmVyLCB2YWx1ZUlzRGVmaW5lZDogYm9vbGVhbiwgaXNFeGFjdE1hdGNoOiBib29sZWFuKTogbnVtYmVyIHtcbiAgbGV0IGlubmVyTW9kZSA9IGN1cnJlbnRNb2RlO1xuICBpZiAoIXZhbHVlSXNEZWZpbmVkICYmIGlzRXhhY3RNYXRjaCAmJiAhKGN1cnJlbnRNb2RlICYgU3R5bGluZ01hcHNTeW5jTW9kZS5Ta2lwVGFyZ2V0UHJvcCkpIHtcbiAgICAvLyBjYXNlIDE6IHNldCB0aGUgbW9kZSB0byBhcHBseSB0aGUgdGFyZ2V0ZWQgcHJvcCB2YWx1ZSBpZiBpdFxuICAgIC8vIGVuZHMgdXAgYmVpbmcgZW5jb3VudGVyZWQgaW4gYW5vdGhlciBtYXAgdmFsdWVcbiAgICBpbm5lck1vZGUgfD0gU3R5bGluZ01hcHNTeW5jTW9kZS5BcHBseVRhcmdldFByb3A7XG4gICAgaW5uZXJNb2RlICY9IH5TdHlsaW5nTWFwc1N5bmNNb2RlLlNraXBUYXJnZXRQcm9wO1xuICB9IGVsc2Uge1xuICAgIC8vIGNhc2UgMjogc2V0IHRoZSBtb2RlIHRvIHNraXAgdGhlIHRhcmdldGVkIHByb3AgdmFsdWUgaWYgaXRcbiAgICAvLyBlbmRzIHVwIGJlaW5nIGVuY291bnRlcmVkIGluIGFub3RoZXIgbWFwIHZhbHVlXG4gICAgaW5uZXJNb2RlIHw9IFN0eWxpbmdNYXBzU3luY01vZGUuU2tpcFRhcmdldFByb3A7XG4gICAgaW5uZXJNb2RlICY9IH5TdHlsaW5nTWFwc1N5bmNNb2RlLkFwcGx5VGFyZ2V0UHJvcDtcbiAgfVxuICByZXR1cm4gaW5uZXJNb2RlO1xufVxuXG4vKipcbiAqIERlY2lkZXMgd2hldGhlciBvciBub3QgYSBwcm9wL3ZhbHVlIGVudHJ5IHdpbGwgYmUgYXBwbGllZCB0byBhbiBlbGVtZW50LlxuICpcbiAqIFRvIGRldGVybWluZSB3aGV0aGVyIG9yIG5vdCBhIHZhbHVlIGlzIHRvIGJlIGFwcGxpZWQsXG4gKiB0aGUgZm9sbG93aW5nIHByb2NlZHVyZSBpcyBldmFsdWF0ZWQ6XG4gKlxuICogRmlyc3QgY2hlY2sgdG8gc2VlIHRoZSBjdXJyZW50IGBtb2RlYCBzdGF0dXM6XG4gKiAgMS4gSWYgdGhlIG1vZGUgdmFsdWUgcGVybWl0cyBhbGwgcHJvcHMgdG8gYmUgYXBwbGllZCB0aGVuIGFsbG93LlxuICogICAgLSBCdXQgZG8gbm90IGFsbG93IGlmIHRoZSBjdXJyZW50IHByb3AgaXMgc2V0IHRvIGJlIHNraXBwZWQuXG4gKiAgMi4gT3RoZXJ3aXNlIGlmIHRoZSBjdXJyZW50IHByb3AgaXMgcGVybWl0dGVkIHRoZW4gYWxsb3cuXG4gKi9cbmZ1bmN0aW9uIGlzVmFsdWVBbGxvd2VkVG9CZUFwcGxpZWQobW9kZTogbnVtYmVyLCBpc1RhcmdldFByb3BNYXRjaGVkOiBib29sZWFuKSB7XG4gIGxldCBkb0FwcGx5VmFsdWUgPSAobW9kZSAmIFN0eWxpbmdNYXBzU3luY01vZGUuQXBwbHlBbGxWYWx1ZXMpID4gMDtcbiAgaWYgKCFkb0FwcGx5VmFsdWUpIHtcbiAgICBpZiAobW9kZSAmIFN0eWxpbmdNYXBzU3luY01vZGUuQXBwbHlUYXJnZXRQcm9wKSB7XG4gICAgICBkb0FwcGx5VmFsdWUgPSBpc1RhcmdldFByb3BNYXRjaGVkO1xuICAgIH1cbiAgfSBlbHNlIGlmICgobW9kZSAmIFN0eWxpbmdNYXBzU3luY01vZGUuU2tpcFRhcmdldFByb3ApICYmIGlzVGFyZ2V0UHJvcE1hdGNoZWQpIHtcbiAgICBkb0FwcGx5VmFsdWUgPSBmYWxzZTtcbiAgfVxuICByZXR1cm4gZG9BcHBseVZhbHVlO1xufVxuXG4vKipcbiAqIFVzZWQgdG8ga2VlcCB0cmFjayBvZiBjb25jdXJyZW50IGN1cnNvciB2YWx1ZXMgZm9yIG11bHRpcGxlIG1hcC1iYXNlZCBzdHlsaW5nIGJpbmRpbmdzIHByZXNlbnQgb25cbiAqIGFuIGVsZW1lbnQuXG4gKi9cbmNvbnN0IE1BUF9DVVJTT1JTOiBudW1iZXJbXSA9IFtdO1xuXG4vKipcbiAqIFVzZWQgdG8gcmVzZXQgdGhlIHN0YXRlIG9mIGVhY2ggY3Vyc29yIHZhbHVlIGJlaW5nIHVzZWQgdG8gaXRlcmF0ZSBvdmVyIG1hcC1iYXNlZCBzdHlsaW5nXG4gKiBiaW5kaW5ncy5cbiAqL1xuZnVuY3Rpb24gcmVzZXRTeW5jQ3Vyc29ycygpIHtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBNQVBfQ1VSU09SUy5sZW5ndGg7IGkrKykge1xuICAgIE1BUF9DVVJTT1JTW2ldID0gTFN0eWxpbmdNYXBJbmRleC5WYWx1ZXNTdGFydFBvc2l0aW9uO1xuICB9XG59XG5cbi8qKlxuICogUmV0dXJucyBhbiBhY3RpdmUgY3Vyc29yIHZhbHVlIGF0IGEgZ2l2ZW4gbWFwSW5kZXggbG9jYXRpb24uXG4gKi9cbmZ1bmN0aW9uIGdldEN1cnJlbnRTeW5jQ3Vyc29yKG1hcEluZGV4OiBudW1iZXIpIHtcbiAgaWYgKG1hcEluZGV4ID49IE1BUF9DVVJTT1JTLmxlbmd0aCkge1xuICAgIE1BUF9DVVJTT1JTLnB1c2goTFN0eWxpbmdNYXBJbmRleC5WYWx1ZXNTdGFydFBvc2l0aW9uKTtcbiAgfVxuICByZXR1cm4gTUFQX0NVUlNPUlNbbWFwSW5kZXhdO1xufVxuXG4vKipcbiAqIFNldHMgYSBjdXJzb3IgdmFsdWUgYXQgYSBnaXZlbiBtYXBJbmRleCBsb2NhdGlvbi5cbiAqL1xuZnVuY3Rpb24gc2V0Q3VycmVudFN5bmNDdXJzb3IobWFwSW5kZXg6IG51bWJlciwgaW5kZXhWYWx1ZTogbnVtYmVyKSB7XG4gIE1BUF9DVVJTT1JTW21hcEluZGV4XSA9IGluZGV4VmFsdWU7XG59XG5cbi8qKlxuICogVXNlZCB0byBjb252ZXJ0IGEge2tleTp2YWx1ZX0gbWFwIGludG8gYSBgTFN0eWxpbmdNYXBgIGFycmF5LlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gd2lsbCBlaXRoZXIgZ2VuZXJhdGUgYSBuZXcgYExTdHlsaW5nTWFwYCBpbnN0YW5jZVxuICogb3IgaXQgd2lsbCBwYXRjaCB0aGUgcHJvdmlkZWQgYG5ld1ZhbHVlc2AgbWFwIHZhbHVlIGludG8gYW5cbiAqIGV4aXN0aW5nIGBMU3R5bGluZ01hcGAgdmFsdWUgKHRoaXMgb25seSBoYXBwZW5zIGlmIGBiaW5kaW5nVmFsdWVgXG4gKiBpcyBhbiBpbnN0YW5jZSBvZiBgTFN0eWxpbmdNYXBgKS5cbiAqXG4gKiBJZiBhIG5ldyBrZXkvdmFsdWUgbWFwIGlzIHByb3ZpZGVkIHdpdGggYW4gb2xkIGBMU3R5bGluZ01hcGBcbiAqIHZhbHVlIHRoZW4gYWxsIHByb3BlcnRpZXMgd2lsbCBiZSBvdmVyd3JpdHRlbiB3aXRoIHRoZWlyIG5ld1xuICogdmFsdWVzIG9yIHdpdGggYG51bGxgLiBUaGlzIG1lYW5zIHRoYXQgdGhlIGFycmF5IHdpbGwgbmV2ZXJcbiAqIHNocmluayBpbiBzaXplIChidXQgaXQgd2lsbCBhbHNvIG5vdCBiZSBjcmVhdGVkIGFuZCB0aHJvd25cbiAqIGF3YXkgd2hlbmV2ZXIgdGhlIHtrZXk6dmFsdWV9IG1hcCBlbnRyaWVzIGNoYW5nZSkuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBub3JtYWxpemVJbnRvU3R5bGluZ01hcChcbiAgICBiaW5kaW5nVmFsdWU6IG51bGwgfCBMU3R5bGluZ01hcCxcbiAgICBuZXdWYWx1ZXM6IHtba2V5OiBzdHJpbmddOiBhbnl9IHwgc3RyaW5nIHwgbnVsbCB8IHVuZGVmaW5lZCk6IExTdHlsaW5nTWFwIHtcbiAgY29uc3QgbFN0eWxpbmdNYXA6IExTdHlsaW5nTWFwID0gQXJyYXkuaXNBcnJheShiaW5kaW5nVmFsdWUpID8gYmluZGluZ1ZhbHVlIDogW251bGxdO1xuICBsU3R5bGluZ01hcFtMU3R5bGluZ01hcEluZGV4LlJhd1ZhbHVlUG9zaXRpb25dID0gbmV3VmFsdWVzIHx8IG51bGw7XG5cbiAgLy8gYmVjYXVzZSB0aGUgbmV3IHZhbHVlcyBtYXkgbm90IGluY2x1ZGUgYWxsIHRoZSBwcm9wZXJ0aWVzXG4gIC8vIHRoYXQgdGhlIG9sZCBvbmVzIGhhZCwgYWxsIHZhbHVlcyBhcmUgc2V0IHRvIGBudWxsYCBiZWZvcmVcbiAgLy8gdGhlIG5ldyB2YWx1ZXMgYXJlIGFwcGxpZWQuIFRoaXMgd2F5LCB3aGVuIGZsdXNoZWQsIHRoZVxuICAvLyBzdHlsaW5nIGFsZ29yaXRobSBrbm93cyBleGFjdGx5IHdoYXQgc3R5bGUvY2xhc3MgdmFsdWVzXG4gIC8vIHRvIHJlbW92ZSBmcm9tIHRoZSBlbGVtZW50IChzaW5jZSB0aGV5IGFyZSBgbnVsbGApLlxuICBmb3IgKGxldCBqID0gTFN0eWxpbmdNYXBJbmRleC5WYWx1ZXNTdGFydFBvc2l0aW9uOyBqIDwgbFN0eWxpbmdNYXAubGVuZ3RoO1xuICAgICAgIGogKz0gTFN0eWxpbmdNYXBJbmRleC5UdXBsZVNpemUpIHtcbiAgICBzZXRNYXBWYWx1ZShsU3R5bGluZ01hcCwgaiwgbnVsbCk7XG4gIH1cblxuICBsZXQgcHJvcHM6IHN0cmluZ1tdfG51bGwgPSBudWxsO1xuICBsZXQgbWFwOiB7W2tleTogc3RyaW5nXTogYW55fXx1bmRlZmluZWR8bnVsbDtcbiAgbGV0IGFsbFZhbHVlc1RydWUgPSBmYWxzZTtcbiAgaWYgKHR5cGVvZiBuZXdWYWx1ZXMgPT09ICdzdHJpbmcnKSB7ICAvLyBbY2xhc3NdIGJpbmRpbmdzIGFsbG93IHN0cmluZyB2YWx1ZXNcbiAgICBpZiAobmV3VmFsdWVzLmxlbmd0aCkge1xuICAgICAgcHJvcHMgPSBuZXdWYWx1ZXMuc3BsaXQoL1xccysvKTtcbiAgICAgIGFsbFZhbHVlc1RydWUgPSB0cnVlO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBwcm9wcyA9IG5ld1ZhbHVlcyA/IE9iamVjdC5rZXlzKG5ld1ZhbHVlcykgOiBudWxsO1xuICAgIG1hcCA9IG5ld1ZhbHVlcztcbiAgfVxuXG4gIGlmIChwcm9wcykge1xuICAgIG91dGVyOiBmb3IgKGxldCBpID0gMDsgaSA8IHByb3BzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBwcm9wID0gcHJvcHNbaV0gYXMgc3RyaW5nO1xuICAgICAgY29uc3QgdmFsdWUgPSBhbGxWYWx1ZXNUcnVlID8gdHJ1ZSA6IG1hcCAhW3Byb3BdO1xuICAgICAgZm9yIChsZXQgaiA9IExTdHlsaW5nTWFwSW5kZXguVmFsdWVzU3RhcnRQb3NpdGlvbjsgaiA8IGxTdHlsaW5nTWFwLmxlbmd0aDtcbiAgICAgICAgICAgaiArPSBMU3R5bGluZ01hcEluZGV4LlR1cGxlU2l6ZSkge1xuICAgICAgICBjb25zdCBwcm9wQXRJbmRleCA9IGdldE1hcFByb3AobFN0eWxpbmdNYXAsIGopO1xuICAgICAgICBpZiAocHJvcCA8PSBwcm9wQXRJbmRleCkge1xuICAgICAgICAgIGlmIChwcm9wQXRJbmRleCA9PT0gcHJvcCkge1xuICAgICAgICAgICAgc2V0TWFwVmFsdWUobFN0eWxpbmdNYXAsIGosIHZhbHVlKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbFN0eWxpbmdNYXAuc3BsaWNlKGosIDAsIHByb3AsIHZhbHVlKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgY29udGludWUgb3V0ZXI7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGxTdHlsaW5nTWFwLnB1c2gocHJvcCwgdmFsdWUpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBsU3R5bGluZ01hcDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldE1hcFByb3AobWFwOiBMU3R5bGluZ01hcCwgaW5kZXg6IG51bWJlcik6IHN0cmluZyB7XG4gIHJldHVybiBtYXBbaW5kZXggKyBMU3R5bGluZ01hcEluZGV4LlByb3BPZmZzZXRdIGFzIHN0cmluZztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNldE1hcFZhbHVlKG1hcDogTFN0eWxpbmdNYXAsIGluZGV4OiBudW1iZXIsIHZhbHVlOiBzdHJpbmcgfCBudWxsKTogdm9pZCB7XG4gIG1hcFtpbmRleCArIExTdHlsaW5nTWFwSW5kZXguVmFsdWVPZmZzZXRdID0gdmFsdWU7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRNYXBWYWx1ZShtYXA6IExTdHlsaW5nTWFwLCBpbmRleDogbnVtYmVyKTogc3RyaW5nfG51bGwge1xuICByZXR1cm4gbWFwW2luZGV4ICsgTFN0eWxpbmdNYXBJbmRleC5WYWx1ZU9mZnNldF0gYXMgc3RyaW5nIHwgbnVsbDtcbn1cbiJdfQ==