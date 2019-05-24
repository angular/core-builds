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
 * @param {?} mode
 * @param {?=} targetProp
 * @param {?=} defaultValue
 * @return {?}
 */
(context, renderer, element, data, applyStylingFn, mode, targetProp, defaultValue) => {
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
            targetPropValueWasApplied = innerSyncStylingMap(context, renderer, element, data, applyStylingFn, mode, targetProp || null, 0, defaultValue || null);
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
 * @param {?} mode
 * @param {?} targetProp
 * @param {?} currentMapIndex
 * @param {?} defaultValue
 * @return {?}
 */
function innerSyncStylingMap(context, renderer, element, data, applyStylingFn, mode, targetProp, currentMapIndex, defaultValue) {
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
            let valueApplied = innerSyncStylingMap(context, renderer, element, data, applyStylingFn, innerMode, innerProp, currentMapIndex + 1, defaultValue);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFwX2Jhc2VkX2JpbmRpbmdzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9zdHlsaW5nX25leHQvbWFwX2Jhc2VkX2JpbmRpbmdzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7QUFTQSxPQUFPLEVBQUMsb0JBQW9CLEVBQUMsTUFBTSxZQUFZLENBQUM7QUFFaEQsT0FBTyxFQUFDLGVBQWUsRUFBRSxjQUFjLEVBQUUscUJBQXFCLEVBQUMsTUFBTSxRQUFRLENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUE0RjlFLE1BQU0sT0FBTyxjQUFjOzs7Ozs7Ozs7OztBQUN2QixDQUFDLE9BQXdCLEVBQUUsUUFBZ0QsRUFBRSxPQUFpQixFQUM3RixJQUFrQixFQUFFLGNBQThCLEVBQUUsSUFBeUIsRUFDN0UsVUFBMEIsRUFBRSxZQUE0QixFQUFXLEVBQUU7O1FBQ2hFLHlCQUF5QixHQUFHLEtBQUs7Ozs7VUFJL0IsU0FBUyxHQUFHLGNBQWMsQ0FBQyxPQUFPLDhCQUEyQztJQUNuRixJQUFJLFNBQVMsRUFBRTs7WUFDVCxtQkFBbUIsR0FBRyxJQUFJOztjQUN4QixZQUFZLEdBQUcsQ0FBQyxVQUFVO1FBRWhDLHFFQUFxRTtRQUNyRSxzRUFBc0U7UUFDdEUscUVBQXFFO1FBQ3JFLDZCQUE2QjtRQUM3QixJQUFJLFlBQVksSUFBSSxDQUFDLElBQUksR0FBRyx1QkFBbUMsQ0FBQyxFQUFFO1lBQ2hFLG1CQUFtQixHQUFHLEtBQUssQ0FBQztZQUM1Qix5QkFBeUIsR0FBRyxJQUFJLENBQUM7U0FDbEM7UUFFRCxJQUFJLG1CQUFtQixFQUFFO1lBQ3ZCLHlCQUF5QixHQUFHLG1CQUFtQixDQUMzQyxPQUFPLEVBQUUsUUFBUSxFQUFFLE9BQU8sRUFBRSxJQUFJ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QixDQUFDLEdBQUcsS0FBSyxDQUFDO0FBQ3BELENBQUM7Ozs7OztBQUVELE1BQU0sVUFBVSxXQUFXLENBQUMsR0FBZ0IsRUFBRSxLQUFhO0lBQ3pELE9BQU8sbUJBQUEsR0FBRyxDQUFDLEtBQUssc0JBQStCLENBQUMsRUFBaUIsQ0FBQztBQUNwRSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4qIEBsaWNlbnNlXG4qIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuKlxuKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4qL1xuaW1wb3J0IHtQcm9jZWR1cmFsUmVuZGVyZXIzLCBSRWxlbWVudCwgUmVuZGVyZXIzfSBmcm9tICcuLi9pbnRlcmZhY2VzL3JlbmRlcmVyJztcblxuaW1wb3J0IHtzZXRTdHlsaW5nTWFwc1N5bmNGbn0gZnJvbSAnLi9iaW5kaW5ncyc7XG5pbXBvcnQge0FwcGx5U3R5bGluZ0ZuLCBMU3R5bGluZ0RhdGEsIExTdHlsaW5nTWFwLCBMU3R5bGluZ01hcEluZGV4LCBTdHlsaW5nTWFwc1N5bmNNb2RlLCBTeW5jU3R5bGluZ01hcHNGbiwgVFN0eWxpbmdDb250ZXh0LCBUU3R5bGluZ0NvbnRleHRJbmRleH0gZnJvbSAnLi9pbnRlcmZhY2VzJztcbmltcG9ydCB7Z2V0QmluZGluZ1ZhbHVlLCBnZXRWYWx1ZXNDb3VudCwgaXNTdHlsaW5nVmFsdWVEZWZpbmVkfSBmcm9tICcuL3V0aWwnO1xuXG5cbi8qKlxuICogLS0tLS0tLS1cbiAqXG4gKiBUaGlzIGZpbGUgY29udGFpbnMgdGhlIGFsZ29yaXRobSBsb2dpYyBmb3IgYXBwbHlpbmcgbWFwLWJhc2VkIGJpbmRpbmdzXG4gKiBzdWNoIGFzIGBbc3R5bGVdYCBhbmQgYFtjbGFzc11gLlxuICpcbiAqIC0tLS0tLS0tXG4gKi9cblxuLyoqXG4gKiBVc2VkIHRvIGFwcGx5IHN0eWxpbmcgdmFsdWVzIHByZXNlbnRseSB3aXRoaW4gYW55IG1hcC1iYXNlZCBiaW5kaW5ncyBvbiBhbiBlbGVtZW50LlxuICpcbiAqIEFuZ3VsYXIgc3VwcG9ydHMgbWFwLWJhc2VkIHN0eWxpbmcgYmluZGluZ3Mgd2hpY2ggY2FuIGJlIGFwcGxpZWQgdmlhIHRoZVxuICogYFtzdHlsZV1gIGFuZCBgW2NsYXNzXWAgYmluZGluZ3Mgd2hpY2ggY2FuIGJlIHBsYWNlZCBvbiBhbnkgSFRNTCBlbGVtZW50LlxuICogVGhlc2UgYmluZGluZ3MgY2FuIHdvcmsgaW5kZXBlbmRlbnRseSwgdG9nZXRoZXIgb3IgYWxvbmdzaWRlIHByb3AtYmFzZWRcbiAqIHN0eWxpbmcgYmluZGluZ3MgKGUuZy4gYDxkaXYgW3N0eWxlXT1cInhcIiBbc3R5bGUud2lkdGhdPVwid1wiPmApLlxuICpcbiAqIElmIGEgbWFwLWJhc2VkIHN0eWxpbmcgYmluZGluZyBpcyBkZXRlY3RlZCBieSB0aGUgY29tcGlsZXIsIHRoZSBmb2xsb3dpbmdcbiAqIEFPVCBjb2RlIGlzIHByb2R1Y2VkOlxuICpcbiAqIGBgYHR5cGVzY3JpcHRcbiAqIHN0eWxlTWFwKGN0eC5zdHlsZXMpOyAvLyBzdHlsZXMgPSB7a2V5OnZhbHVlfVxuICogY2xhc3NNYXAoY3R4LmNsYXNzZXMpOyAvLyBjbGFzc2VzID0ge2tleTp2YWx1ZX18c3RyaW5nXG4gKiBgYGBcbiAqXG4gKiBJZiBhbmQgd2hlbiBlaXRoZXIgb2YgdGhlIGluc3RydWN0aW9ucyBhYm92ZSBhcmUgZXZhbHVhdGVkLCB0aGVuIHRoZSBjb2RlXG4gKiBwcmVzZW50IGluIHRoaXMgZmlsZSBpcyBpbmNsdWRlZCBpbnRvIHRoZSBidW5kbGUuIFRoZSBtZWNoYW5pc20gdXNlZCwgdG9cbiAqIGFjdGl2YXRlIHN1cHBvcnQgZm9yIG1hcC1iYXNlZCBiaW5kaW5ncyBhdCBydW50aW1lIGlzIHBvc3NpYmxlIHZpYSB0aGVcbiAqIGBhY3RpdmVTdHlsaW5nTWFwRmVhdHVyZWAgZnVuY3Rpb24gKHdoaWNoIGlzIGFsc28gcHJlc2VudCBpbiB0aGlzIGZpbGUpLlxuICpcbiAqICMgVGhlIEFsZ29yaXRobVxuICogV2hlbmV2ZXIgYSBtYXAtYmFzZWQgYmluZGluZyB1cGRhdGVzICh3aGljaCBpcyB3aGVuIHRoZSBpZGVudGl0eSBvZiB0aGVcbiAqIG1hcC12YWx1ZSBjaGFuZ2VzKSB0aGVuIHRoZSBtYXAgaXMgaXRlcmF0ZWQgb3ZlciBhbmQgYSBgTFN0eWxpbmdNYXBgIGFycmF5XG4gKiBpcyBwcm9kdWNlZC4gVGhlIGBMU3R5bGluZ01hcGAgaW5zdGFuY2UgaXMgc3RvcmVkIGluIHRoZSBiaW5kaW5nIGxvY2F0aW9uXG4gKiB3aGVyZSB0aGUgYEJJTkRJTkdfSU5ERVhgIGlzIHNpdHVhdGVkIHdoZW4gdGhlIGBzdHlsZU1hcCgpYCBvciBgY2xhc3NNYXAoKWBcbiAqIGluc3RydWN0aW9uIHdlcmUgY2FsbGVkLiBPbmNlIHRoZSBiaW5kaW5nIGNoYW5nZXMsIHRoZW4gdGhlIGludGVybmFsIGBiaXRNYXNrYFxuICogdmFsdWUgaXMgbWFya2VkIGFzIGRpcnR5LlxuICpcbiAqIFN0eWxpbmcgdmFsdWVzIGFyZSBhcHBsaWVkIG9uY2UgQ0QgZXhpdHMgdGhlIGVsZW1lbnQgKHdoaWNoIGhhcHBlbnMgd2hlblxuICogdGhlIGBzZWxlY3QobilgIGluc3RydWN0aW9uIGlzIGNhbGxlZCBvciB0aGUgdGVtcGxhdGUgZnVuY3Rpb24gZXhpdHMpLiBXaGVuXG4gKiB0aGlzIG9jY3VycywgYWxsIHByb3AtYmFzZWQgYmluZGluZ3MgYXJlIGFwcGxpZWQuIElmIGEgbWFwLWJhc2VkIGJpbmRpbmcgaXNcbiAqIHByZXNlbnQgdGhlbiBhIHNwZWNpYWwgZmx1c2hpbmcgZnVuY3Rpb24gKGNhbGxlZCBhIHN5bmMgZnVuY3Rpb24pIGlzIG1hZGVcbiAqIGF2YWlsYWJsZSBhbmQgaXQgd2lsbCBiZSBjYWxsZWQgZWFjaCB0aW1lIGEgc3R5bGluZyBwcm9wZXJ0eSBpcyBmbHVzaGVkLlxuICpcbiAqIFRoZSBmbHVzaGluZyBhbGdvcml0aG0gaXMgZGVzaWduZWQgdG8gYXBwbHkgc3R5bGluZyBmb3IgYSBwcm9wZXJ0eSAod2hpY2ggaXNcbiAqIGEgQ1NTIHByb3BlcnR5IG9yIGEgY2xhc3NOYW1lIHZhbHVlKSBvbmUgYnkgb25lLiBJZiBtYXAtYmFzZWQgYmluZGluZ3NcbiAqIGFyZSBwcmVzZW50LCB0aGVuIHRoZSBmbHVzaGluZyBhbGdvcml0aG0gd2lsbCBrZWVwIGNhbGxpbmcgdGhlIG1hcHMgc3R5bGluZ1xuICogc3luYyBmdW5jdGlvbiBlYWNoIHRpbWUgYSBwcm9wZXJ0eSBpcyB2aXNpdGVkLiBUaGlzIHdheSwgdGhlIGZsdXNoaW5nXG4gKiBiZWhhdmlvciBvZiBtYXAtYmFzZWQgYmluZGluZ3Mgd2lsbCBhbHdheXMgYmUgYXQgdGhlIHNhbWUgcHJvcGVydHkgbGV2ZWxcbiAqIGFzIHRoZSBjdXJyZW50IHByb3AtYmFzZWQgcHJvcGVydHkgYmVpbmcgaXRlcmF0ZWQgb3ZlciAoYmVjYXVzZSBldmVyeXRoaW5nXG4gKiBpcyBhbHBoYWJldGljYWxseSBzb3J0ZWQpLlxuICpcbiAqIExldCdzIGltYWdpbmUgd2UgaGF2ZSB0aGUgZm9sbG93aW5nIEhUTUwgdGVtcGxhdGUgY29kZTpcbiAqXG4gKiBgYGBodG1sXG4gKiA8ZGl2IFtzdHlsZV09XCJ7d2lkdGg6JzEwMHB4JywgaGVpZ2h0OicyMDBweCcsICd6LWluZGV4JzonMTAnfVwiXG4gKiAgICAgIFtzdHlsZS53aWR0aC5weF09XCIyMDBcIj4uLi48L2Rpdj5cbiAqIGBgYFxuICpcbiAqIFdoZW4gQ0Qgb2NjdXJzLCBib3RoIHRoZSBgW3N0eWxlXWAgYW5kIGBbc3R5bGUud2lkdGhdYCBiaW5kaW5nc1xuICogYXJlIGV2YWx1YXRlZC4gVGhlbiB3aGVuIHRoZSBzdHlsZXMgYXJlIGZsdXNoZWQgb24gc2NyZWVuLCB0aGVcbiAqIGZvbGxvd2luZyBvcGVyYXRpb25zIGhhcHBlbjpcbiAqXG4gKiAxLiBgW3N0eWxlLndpZHRoXWAgaXMgYXR0ZW1wdGVkIHRvIGJlIHdyaXR0ZW4gdG8gdGhlIGVsZW1lbnQuXG4gKlxuICogMi4gIE9uY2UgdGhhdCBoYXBwZW5zLCB0aGUgYWxnb3JpdGhtIGluc3RydWN0cyB0aGUgbWFwLWJhc2VkXG4gKiAgICAgZW50cmllcyAoYFtzdHlsZV1gIGluIHRoaXMgY2FzZSkgdG8gXCJjYXRjaCB1cFwiIGFuZCBhcHBseVxuICogICAgIGFsbCB2YWx1ZXMgdXAgdG8gdGhlIGB3aWR0aGAgdmFsdWUuIFdoZW4gdGhpcyBoYXBwZW5zIHRoZVxuICogICAgIGBoZWlnaHRgIHZhbHVlIGlzIGFwcGxpZWQgdG8gdGhlIGVsZW1lbnQgKHNpbmNlIGl0IGlzXG4gKiAgICAgYWxwaGFiZXRpY2FsbHkgc2l0dWF0ZWQgYmVmb3JlIHRoZSBgd2lkdGhgIHByb3BlcnR5KS5cbiAqXG4gKiAzLiBTaW5jZSB0aGVyZSBhcmUgbm8gbW9yZSBwcm9wLWJhc2VkIGVudHJpZXMgYW55bW9yZSwgdGhlXG4gKiAgICBsb29wIGV4aXRzIGFuZCB0aGVuLCBqdXN0IGJlZm9yZSB0aGUgZmx1c2hpbmcgZW5kcywgaXRcbiAqICAgIGluc3RydWN0cyBhbGwgbWFwLWJhc2VkIGJpbmRpbmdzIHRvIFwiZmluaXNoIHVwXCIgYXBwbHlpbmdcbiAqICAgIHRoZWlyIHZhbHVlcy5cbiAqXG4gKiA0LiBUaGUgb25seSByZW1haW5pbmcgdmFsdWUgd2l0aGluIHRoZSBtYXAtYmFzZWQgZW50cmllcyBpc1xuICogICAgdGhlIGB6LWluZGV4YCB2YWx1ZSAoYHdpZHRoYCBnb3Qgc2tpcHBlZCBiZWNhdXNlIGl0IHdhc1xuICogICAgc3VjY2Vzc2Z1bGx5IGFwcGxpZWQgdmlhIHRoZSBwcm9wLWJhc2VkIGBbc3R5bGUud2lkdGhdYFxuICogICAgYmluZGluZykuIFNpbmNlIGFsbCBtYXAtYmFzZWQgZW50cmllcyBhcmUgdG9sZCB0byBcImZpbmlzaCB1cFwiLFxuICogICAgdGhlIGB6LWluZGV4YCB2YWx1ZSBpcyBpdGVyYXRlZCBvdmVyIGFuZCBpdCBpcyB0aGVuIGFwcGxpZWRcbiAqICAgIHRvIHRoZSBlbGVtZW50LlxuICpcbiAqIFRoZSBtb3N0IGltcG9ydGFudCB0aGluZyB0byB0YWtlIG5vdGUgb2YgaGVyZSBpcyB0aGF0IHByb3AtYmFzZWRcbiAqIGJpbmRpbmdzIGFyZSBldmFsdWF0ZWQgaW4gb3JkZXIgYWxvbmdzaWRlIG1hcC1iYXNlZCBiaW5kaW5ncy5cbiAqIFRoaXMgYWxsb3dzIGFsbCBzdHlsaW5nIGFjcm9zcyBhbiBlbGVtZW50IHRvIGJlIGFwcGxpZWQgaW4gTyhuKVxuICogdGltZSAoYSBzaW1pbGFyIGFsZ29yaXRobSBpcyB0aGF0IG9mIHRoZSBhcnJheSBtZXJnZSBhbGdvcml0aG1cbiAqIGluIG1lcmdlIHNvcnQpLlxuICovXG5leHBvcnQgY29uc3Qgc3luY1N0eWxpbmdNYXA6IFN5bmNTdHlsaW5nTWFwc0ZuID1cbiAgICAoY29udGV4dDogVFN0eWxpbmdDb250ZXh0LCByZW5kZXJlcjogUmVuZGVyZXIzIHwgUHJvY2VkdXJhbFJlbmRlcmVyMyB8IG51bGwsIGVsZW1lbnQ6IFJFbGVtZW50LFxuICAgICBkYXRhOiBMU3R5bGluZ0RhdGEsIGFwcGx5U3R5bGluZ0ZuOiBBcHBseVN0eWxpbmdGbiwgbW9kZTogU3R5bGluZ01hcHNTeW5jTW9kZSxcbiAgICAgdGFyZ2V0UHJvcD86IHN0cmluZyB8IG51bGwsIGRlZmF1bHRWYWx1ZT86IHN0cmluZyB8IG51bGwpOiBib29sZWFuID0+IHtcbiAgICAgIGxldCB0YXJnZXRQcm9wVmFsdWVXYXNBcHBsaWVkID0gZmFsc2U7XG5cbiAgICAgIC8vIG9uY2UgdGhlIG1hcC1iYXNlZCBzdHlsaW5nIGNvZGUgaXMgYWN0aXZhdGUgaXQgaXMgbmV2ZXIgZGVhY3RpdmF0ZWQuIEZvciB0aGlzIHJlYXNvbiBhXG4gICAgICAvLyBjaGVjayB0byBzZWUgaWYgdGhlIGN1cnJlbnQgc3R5bGluZyBjb250ZXh0IGhhcyBhbnkgbWFwIGJhc2VkIGJpbmRpbmdzIGlzIHJlcXVpcmVkLlxuICAgICAgY29uc3QgdG90YWxNYXBzID0gZ2V0VmFsdWVzQ291bnQoY29udGV4dCwgVFN0eWxpbmdDb250ZXh0SW5kZXguTWFwQmluZGluZ3NQb3NpdGlvbik7XG4gICAgICBpZiAodG90YWxNYXBzKSB7XG4gICAgICAgIGxldCBydW5UaGVTeW5jQWxnb3JpdGhtID0gdHJ1ZTtcbiAgICAgICAgY29uc3QgbG9vcFVudGlsRW5kID0gIXRhcmdldFByb3A7XG5cbiAgICAgICAgLy8gSWYgdGhlIGNvZGUgaXMgdG9sZCB0byBmaW5pc2ggdXAgKHJ1biB1bnRpbCB0aGUgZW5kKSwgYnV0IHRoZSBtb2RlXG4gICAgICAgIC8vIGhhc24ndCBiZWVuIGZsYWdnZWQgdG8gYXBwbHkgdmFsdWVzIChpdCBvbmx5IHRyYXZlcnNlcyB2YWx1ZXMpIHRoZW5cbiAgICAgICAgLy8gdGhlcmUgaXMgbm8gcG9pbnQgaW4gaXRlcmF0aW5nIG92ZXIgdGhlIGFycmF5IGJlY2F1c2Ugbm90aGluZyB3aWxsXG4gICAgICAgIC8vIGJlIGFwcGxpZWQgdG8gdGhlIGVsZW1lbnQuXG4gICAgICAgIGlmIChsb29wVW50aWxFbmQgJiYgKG1vZGUgJiB+U3R5bGluZ01hcHNTeW5jTW9kZS5BcHBseUFsbFZhbHVlcykpIHtcbiAgICAgICAgICBydW5UaGVTeW5jQWxnb3JpdGhtID0gZmFsc2U7XG4gICAgICAgICAgdGFyZ2V0UHJvcFZhbHVlV2FzQXBwbGllZCA9IHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAocnVuVGhlU3luY0FsZ29yaXRobSkge1xuICAgICAgICAgIHRhcmdldFByb3BWYWx1ZVdhc0FwcGxpZWQgPSBpbm5lclN5bmNTdHlsaW5nTWFwKFxuICAgICAgICAgICAgICBjb250ZXh0LCByZW5kZXJlciwgZWxlbWVudCwgZGF0YSwgYXBwbHlTdHlsaW5nRm4sIG1vZGUsIHRhcmdldFByb3AgfHwgbnVsbCwgMCxcbiAgICAgICAgICAgICAgZGVmYXVsdFZhbHVlIHx8IG51bGwpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGxvb3BVbnRpbEVuZCkge1xuICAgICAgICAgIHJlc2V0U3luY0N1cnNvcnMoKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gdGFyZ2V0UHJvcFZhbHVlV2FzQXBwbGllZDtcbiAgICB9O1xuXG4vKipcbiAqIFJlY3Vyc2l2ZSBmdW5jdGlvbiBkZXNpZ25lZCB0byBhcHBseSBtYXAtYmFzZWQgc3R5bGluZyB0byBhbiBlbGVtZW50IG9uZSBtYXAgYXQgYSB0aW1lLlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gaXMgZGVzaWduZWQgdG8gYmUgY2FsbGVkIGZyb20gdGhlIGBzeW5jU3R5bGluZ01hcGAgZnVuY3Rpb24gYW5kIHdpbGxcbiAqIGFwcGx5IG1hcC1iYXNlZCBzdHlsaW5nIGRhdGEgb25lIG1hcCBhdCBhIHRpbWUgdG8gdGhlIHByb3ZpZGVkIGBlbGVtZW50YC5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIGlzIHJlY3Vyc2l2ZSBhbmQgaXQgd2lsbCBjYWxsIGl0c2VsZiBpZiBhIGZvbGxvdy11cCBtYXAgdmFsdWUgaXMgdG8gYmVcbiAqIHByb2Nlc3NlZC4gVG8gbGVhcm4gbW9yZSBhYm91dCBob3cgdGhlIGFsZ29yaXRobSB3b3Jrcywgc2VlIGBzeW5jU3R5bGluZ01hcGAuXG4gKi9cbmZ1bmN0aW9uIGlubmVyU3luY1N0eWxpbmdNYXAoXG4gICAgY29udGV4dDogVFN0eWxpbmdDb250ZXh0LCByZW5kZXJlcjogUmVuZGVyZXIzIHwgUHJvY2VkdXJhbFJlbmRlcmVyMyB8IG51bGwsIGVsZW1lbnQ6IFJFbGVtZW50LFxuICAgIGRhdGE6IExTdHlsaW5nRGF0YSwgYXBwbHlTdHlsaW5nRm46IEFwcGx5U3R5bGluZ0ZuLCBtb2RlOiBTdHlsaW5nTWFwc1N5bmNNb2RlLFxuICAgIHRhcmdldFByb3A6IHN0cmluZyB8IG51bGwsIGN1cnJlbnRNYXBJbmRleDogbnVtYmVyLCBkZWZhdWx0VmFsdWU6IHN0cmluZyB8IG51bGwpOiBib29sZWFuIHtcbiAgbGV0IHRhcmdldFByb3BWYWx1ZVdhc0FwcGxpZWQgPSBmYWxzZTtcblxuICBjb25zdCB0b3RhbE1hcHMgPSBnZXRWYWx1ZXNDb3VudChjb250ZXh0LCBUU3R5bGluZ0NvbnRleHRJbmRleC5NYXBCaW5kaW5nc1Bvc2l0aW9uKTtcbiAgaWYgKGN1cnJlbnRNYXBJbmRleCA8IHRvdGFsTWFwcykge1xuICAgIGNvbnN0IGJpbmRpbmdJbmRleCA9IGdldEJpbmRpbmdWYWx1ZShcbiAgICAgICAgY29udGV4dCwgVFN0eWxpbmdDb250ZXh0SW5kZXguTWFwQmluZGluZ3NQb3NpdGlvbiwgY3VycmVudE1hcEluZGV4KSBhcyBudW1iZXI7XG4gICAgY29uc3QgbFN0eWxpbmdNYXAgPSBkYXRhW2JpbmRpbmdJbmRleF0gYXMgTFN0eWxpbmdNYXA7XG5cbiAgICBsZXQgY3Vyc29yID0gZ2V0Q3VycmVudFN5bmNDdXJzb3IoY3VycmVudE1hcEluZGV4KTtcbiAgICB3aGlsZSAoY3Vyc29yIDwgbFN0eWxpbmdNYXAubGVuZ3RoKSB7XG4gICAgICBjb25zdCBwcm9wID0gZ2V0TWFwUHJvcChsU3R5bGluZ01hcCwgY3Vyc29yKTtcbiAgICAgIGNvbnN0IGl0ZXJhdGVkVG9vRmFyID0gdGFyZ2V0UHJvcCAmJiBwcm9wID4gdGFyZ2V0UHJvcDtcbiAgICAgIGNvbnN0IGlzVGFyZ2V0UHJvcE1hdGNoZWQgPSAhaXRlcmF0ZWRUb29GYXIgJiYgcHJvcCA9PT0gdGFyZ2V0UHJvcDtcbiAgICAgIGNvbnN0IHZhbHVlID0gZ2V0TWFwVmFsdWUobFN0eWxpbmdNYXAsIGN1cnNvcik7XG4gICAgICBjb25zdCB2YWx1ZUlzRGVmaW5lZCA9IGlzU3R5bGluZ1ZhbHVlRGVmaW5lZCh2YWx1ZSk7XG5cbiAgICAgIC8vIHRoZSByZWN1cnNpdmUgY29kZSBpcyBkZXNpZ25lZCB0byBrZWVwIGFwcGx5aW5nIHVudGlsXG4gICAgICAvLyBpdCByZWFjaGVzIG9yIGdvZXMgcGFzdCB0aGUgdGFyZ2V0IHByb3AuIElmIGFuZCB3aGVuXG4gICAgICAvLyB0aGlzIGhhcHBlbnMgdGhlbiBpdCB3aWxsIHN0b3AgcHJvY2Vzc2luZyB2YWx1ZXMsIGJ1dFxuICAgICAgLy8gYWxsIG90aGVyIG1hcCB2YWx1ZXMgbXVzdCBhbHNvIGNhdGNoIHVwIHRvIHRoZSBzYW1lXG4gICAgICAvLyBwb2ludC4gVGhpcyBpcyB3aHkgYSByZWN1cnNpdmUgY2FsbCBpcyBzdGlsbCBpc3N1ZWRcbiAgICAgIC8vIGV2ZW4gaWYgdGhlIGNvZGUgaGFzIGl0ZXJhdGVkIHRvbyBmYXIuXG4gICAgICBjb25zdCBpbm5lck1vZGUgPVxuICAgICAgICAgIGl0ZXJhdGVkVG9vRmFyID8gbW9kZSA6IHJlc29sdmVJbm5lck1hcE1vZGUobW9kZSwgdmFsdWVJc0RlZmluZWQsIGlzVGFyZ2V0UHJvcE1hdGNoZWQpO1xuICAgICAgY29uc3QgaW5uZXJQcm9wID0gaXRlcmF0ZWRUb29GYXIgPyB0YXJnZXRQcm9wIDogcHJvcDtcbiAgICAgIGxldCB2YWx1ZUFwcGxpZWQgPSBpbm5lclN5bmNTdHlsaW5nTWFwKFxuICAgICAgICAgIGNvbnRleHQsIHJlbmRlcmVyLCBlbGVtZW50LCBkYXRhLCBhcHBseVN0eWxpbmdGbiwgaW5uZXJNb2RlLCBpbm5lclByb3AsXG4gICAgICAgICAgY3VycmVudE1hcEluZGV4ICsgMSwgZGVmYXVsdFZhbHVlKTtcblxuICAgICAgaWYgKGl0ZXJhdGVkVG9vRmFyKSB7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuXG4gICAgICBpZiAoIXZhbHVlQXBwbGllZCAmJiBpc1ZhbHVlQWxsb3dlZFRvQmVBcHBsaWVkKG1vZGUsIGlzVGFyZ2V0UHJvcE1hdGNoZWQpKSB7XG4gICAgICAgIGNvbnN0IHVzZURlZmF1bHQgPSBpc1RhcmdldFByb3BNYXRjaGVkICYmICF2YWx1ZUlzRGVmaW5lZDtcbiAgICAgICAgY29uc3QgdmFsdWVUb0FwcGx5ID0gdXNlRGVmYXVsdCA/IGRlZmF1bHRWYWx1ZSA6IHZhbHVlO1xuICAgICAgICBjb25zdCBiaW5kaW5nSW5kZXhUb0FwcGx5ID0gdXNlRGVmYXVsdCA/IGJpbmRpbmdJbmRleCA6IG51bGw7XG4gICAgICAgIGFwcGx5U3R5bGluZ0ZuKHJlbmRlcmVyLCBlbGVtZW50LCBwcm9wLCB2YWx1ZVRvQXBwbHksIGJpbmRpbmdJbmRleFRvQXBwbHkpO1xuICAgICAgICB2YWx1ZUFwcGxpZWQgPSB0cnVlO1xuICAgICAgfVxuXG4gICAgICB0YXJnZXRQcm9wVmFsdWVXYXNBcHBsaWVkID0gdmFsdWVBcHBsaWVkICYmIGlzVGFyZ2V0UHJvcE1hdGNoZWQ7XG4gICAgICBjdXJzb3IgKz0gTFN0eWxpbmdNYXBJbmRleC5UdXBsZVNpemU7XG4gICAgfVxuICAgIHNldEN1cnJlbnRTeW5jQ3Vyc29yKGN1cnJlbnRNYXBJbmRleCwgY3Vyc29yKTtcbiAgfVxuXG4gIHJldHVybiB0YXJnZXRQcm9wVmFsdWVXYXNBcHBsaWVkO1xufVxuXG5cbi8qKlxuICogRW5hYmxlcyBzdXBwb3J0IGZvciBtYXAtYmFzZWQgc3R5bGluZyBiaW5kaW5ncyAoZS5nLiBgW3N0eWxlXWAgYW5kIGBbY2xhc3NdYCBiaW5kaW5ncykuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhY3RpdmVTdHlsaW5nTWFwRmVhdHVyZSgpIHtcbiAgc2V0U3R5bGluZ01hcHNTeW5jRm4oc3luY1N0eWxpbmdNYXApO1xufVxuXG4vKipcbiAqIFVzZWQgdG8gZGV0ZXJtaW5lIHRoZSBtb2RlIGZvciB0aGUgaW5uZXIgcmVjdXJzaXZlIGNhbGwuXG4gKlxuICogSWYgYW4gaW5uZXIgbWFwIGlzIGl0ZXJhdGVkIG9uIHRoZW4gdGhpcyBpcyBkb25lIHNvIGZvciBvbmVcbiAqIG9mIHR3byByZWFzb25zOlxuICpcbiAqIC0gVGhlIHRhcmdldCBwcm9wZXJ0eSB3YXMgZGV0ZWN0ZWQgYW5kIHRoZSBpbm5lciBtYXBcbiAqICAgbXVzdCBub3cgXCJjYXRjaCB1cFwiIChwb2ludGVyLXdpc2UpIHVwIHRvIHdoZXJlIHRoZSBjdXJyZW50XG4gKiAgIG1hcCdzIGN1cnNvciBpcyBzaXR1YXRlZC5cbiAqXG4gKiAtIFRoZSB0YXJnZXQgcHJvcGVydHkgd2FzIG5vdCBkZXRlY3RlZCBpbiB0aGUgY3VycmVudCBtYXBcbiAqICAgYW5kIG11c3QgYmUgZm91bmQgaW4gYW4gaW5uZXIgbWFwLiBUaGlzIGNhbiBvbmx5IGJlIGFsbG93ZWRcbiAqICAgaWYgdGhlIGN1cnJlbnQgbWFwIGl0ZXJhdGlvbiBpcyBub3Qgc2V0IHRvIHNraXAgdGhlIHRhcmdldFxuICogICBwcm9wZXJ0eS5cbiAqL1xuZnVuY3Rpb24gcmVzb2x2ZUlubmVyTWFwTW9kZShcbiAgICBjdXJyZW50TW9kZTogbnVtYmVyLCB2YWx1ZUlzRGVmaW5lZDogYm9vbGVhbiwgaXNFeGFjdE1hdGNoOiBib29sZWFuKTogbnVtYmVyIHtcbiAgbGV0IGlubmVyTW9kZSA9IGN1cnJlbnRNb2RlO1xuICBpZiAoIXZhbHVlSXNEZWZpbmVkICYmIGlzRXhhY3RNYXRjaCAmJiAhKGN1cnJlbnRNb2RlICYgU3R5bGluZ01hcHNTeW5jTW9kZS5Ta2lwVGFyZ2V0UHJvcCkpIHtcbiAgICAvLyBjYXNlIDE6IHNldCB0aGUgbW9kZSB0byBhcHBseSB0aGUgdGFyZ2V0ZWQgcHJvcCB2YWx1ZSBpZiBpdFxuICAgIC8vIGVuZHMgdXAgYmVpbmcgZW5jb3VudGVyZWQgaW4gYW5vdGhlciBtYXAgdmFsdWVcbiAgICBpbm5lck1vZGUgfD0gU3R5bGluZ01hcHNTeW5jTW9kZS5BcHBseVRhcmdldFByb3A7XG4gICAgaW5uZXJNb2RlICY9IH5TdHlsaW5nTWFwc1N5bmNNb2RlLlNraXBUYXJnZXRQcm9wO1xuICB9IGVsc2Uge1xuICAgIC8vIGNhc2UgMjogc2V0IHRoZSBtb2RlIHRvIHNraXAgdGhlIHRhcmdldGVkIHByb3AgdmFsdWUgaWYgaXRcbiAgICAvLyBlbmRzIHVwIGJlaW5nIGVuY291bnRlcmVkIGluIGFub3RoZXIgbWFwIHZhbHVlXG4gICAgaW5uZXJNb2RlIHw9IFN0eWxpbmdNYXBzU3luY01vZGUuU2tpcFRhcmdldFByb3A7XG4gICAgaW5uZXJNb2RlICY9IH5TdHlsaW5nTWFwc1N5bmNNb2RlLkFwcGx5VGFyZ2V0UHJvcDtcbiAgfVxuICByZXR1cm4gaW5uZXJNb2RlO1xufVxuXG4vKipcbiAqIERlY2lkZXMgd2hldGhlciBvciBub3QgYSBwcm9wL3ZhbHVlIGVudHJ5IHdpbGwgYmUgYXBwbGllZCB0byBhbiBlbGVtZW50LlxuICpcbiAqIFRvIGRldGVybWluZSB3aGV0aGVyIG9yIG5vdCBhIHZhbHVlIGlzIHRvIGJlIGFwcGxpZWQsXG4gKiB0aGUgZm9sbG93aW5nIHByb2NlZHVyZSBpcyBldmFsdWF0ZWQ6XG4gKlxuICogRmlyc3QgY2hlY2sgdG8gc2VlIHRoZSBjdXJyZW50IGBtb2RlYCBzdGF0dXM6XG4gKiAgMS4gSWYgdGhlIG1vZGUgdmFsdWUgcGVybWl0cyBhbGwgcHJvcHMgdG8gYmUgYXBwbGllZCB0aGVuIGFsbG93LlxuICogICAgLSBCdXQgZG8gbm90IGFsbG93IGlmIHRoZSBjdXJyZW50IHByb3AgaXMgc2V0IHRvIGJlIHNraXBwZWQuXG4gKiAgMi4gT3RoZXJ3aXNlIGlmIHRoZSBjdXJyZW50IHByb3AgaXMgcGVybWl0dGVkIHRoZW4gYWxsb3cuXG4gKi9cbmZ1bmN0aW9uIGlzVmFsdWVBbGxvd2VkVG9CZUFwcGxpZWQobW9kZTogbnVtYmVyLCBpc1RhcmdldFByb3BNYXRjaGVkOiBib29sZWFuKSB7XG4gIGxldCBkb0FwcGx5VmFsdWUgPSAobW9kZSAmIFN0eWxpbmdNYXBzU3luY01vZGUuQXBwbHlBbGxWYWx1ZXMpID4gMDtcbiAgaWYgKCFkb0FwcGx5VmFsdWUpIHtcbiAgICBpZiAobW9kZSAmIFN0eWxpbmdNYXBzU3luY01vZGUuQXBwbHlUYXJnZXRQcm9wKSB7XG4gICAgICBkb0FwcGx5VmFsdWUgPSBpc1RhcmdldFByb3BNYXRjaGVkO1xuICAgIH1cbiAgfSBlbHNlIGlmICgobW9kZSAmIFN0eWxpbmdNYXBzU3luY01vZGUuU2tpcFRhcmdldFByb3ApICYmIGlzVGFyZ2V0UHJvcE1hdGNoZWQpIHtcbiAgICBkb0FwcGx5VmFsdWUgPSBmYWxzZTtcbiAgfVxuICByZXR1cm4gZG9BcHBseVZhbHVlO1xufVxuXG4vKipcbiAqIFVzZWQgdG8ga2VlcCB0cmFjayBvZiBjb25jdXJyZW50IGN1cnNvciB2YWx1ZXMgZm9yIG11bHRpcGxlIG1hcC1iYXNlZCBzdHlsaW5nIGJpbmRpbmdzIHByZXNlbnQgb25cbiAqIGFuIGVsZW1lbnQuXG4gKi9cbmNvbnN0IE1BUF9DVVJTT1JTOiBudW1iZXJbXSA9IFtdO1xuXG4vKipcbiAqIFVzZWQgdG8gcmVzZXQgdGhlIHN0YXRlIG9mIGVhY2ggY3Vyc29yIHZhbHVlIGJlaW5nIHVzZWQgdG8gaXRlcmF0ZSBvdmVyIG1hcC1iYXNlZCBzdHlsaW5nXG4gKiBiaW5kaW5ncy5cbiAqL1xuZnVuY3Rpb24gcmVzZXRTeW5jQ3Vyc29ycygpIHtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBNQVBfQ1VSU09SUy5sZW5ndGg7IGkrKykge1xuICAgIE1BUF9DVVJTT1JTW2ldID0gTFN0eWxpbmdNYXBJbmRleC5WYWx1ZXNTdGFydFBvc2l0aW9uO1xuICB9XG59XG5cbi8qKlxuICogUmV0dXJucyBhbiBhY3RpdmUgY3Vyc29yIHZhbHVlIGF0IGEgZ2l2ZW4gbWFwSW5kZXggbG9jYXRpb24uXG4gKi9cbmZ1bmN0aW9uIGdldEN1cnJlbnRTeW5jQ3Vyc29yKG1hcEluZGV4OiBudW1iZXIpIHtcbiAgaWYgKG1hcEluZGV4ID49IE1BUF9DVVJTT1JTLmxlbmd0aCkge1xuICAgIE1BUF9DVVJTT1JTLnB1c2goTFN0eWxpbmdNYXBJbmRleC5WYWx1ZXNTdGFydFBvc2l0aW9uKTtcbiAgfVxuICByZXR1cm4gTUFQX0NVUlNPUlNbbWFwSW5kZXhdO1xufVxuXG4vKipcbiAqIFNldHMgYSBjdXJzb3IgdmFsdWUgYXQgYSBnaXZlbiBtYXBJbmRleCBsb2NhdGlvbi5cbiAqL1xuZnVuY3Rpb24gc2V0Q3VycmVudFN5bmNDdXJzb3IobWFwSW5kZXg6IG51bWJlciwgaW5kZXhWYWx1ZTogbnVtYmVyKSB7XG4gIE1BUF9DVVJTT1JTW21hcEluZGV4XSA9IGluZGV4VmFsdWU7XG59XG5cbi8qKlxuICogVXNlZCB0byBjb252ZXJ0IGEge2tleTp2YWx1ZX0gbWFwIGludG8gYSBgTFN0eWxpbmdNYXBgIGFycmF5LlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gd2lsbCBlaXRoZXIgZ2VuZXJhdGUgYSBuZXcgYExTdHlsaW5nTWFwYCBpbnN0YW5jZVxuICogb3IgaXQgd2lsbCBwYXRjaCB0aGUgcHJvdmlkZWQgYG5ld1ZhbHVlc2AgbWFwIHZhbHVlIGludG8gYW5cbiAqIGV4aXN0aW5nIGBMU3R5bGluZ01hcGAgdmFsdWUgKHRoaXMgb25seSBoYXBwZW5zIGlmIGBiaW5kaW5nVmFsdWVgXG4gKiBpcyBhbiBpbnN0YW5jZSBvZiBgTFN0eWxpbmdNYXBgKS5cbiAqXG4gKiBJZiBhIG5ldyBrZXkvdmFsdWUgbWFwIGlzIHByb3ZpZGVkIHdpdGggYW4gb2xkIGBMU3R5bGluZ01hcGBcbiAqIHZhbHVlIHRoZW4gYWxsIHByb3BlcnRpZXMgd2lsbCBiZSBvdmVyd3JpdHRlbiB3aXRoIHRoZWlyIG5ld1xuICogdmFsdWVzIG9yIHdpdGggYG51bGxgLiBUaGlzIG1lYW5zIHRoYXQgdGhlIGFycmF5IHdpbGwgbmV2ZXJcbiAqIHNocmluayBpbiBzaXplIChidXQgaXQgd2lsbCBhbHNvIG5vdCBiZSBjcmVhdGVkIGFuZCB0aHJvd25cbiAqIGF3YXkgd2hlbmV2ZXIgdGhlIHtrZXk6dmFsdWV9IG1hcCBlbnRyaWVzIGNoYW5nZSkuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBub3JtYWxpemVJbnRvU3R5bGluZ01hcChcbiAgICBiaW5kaW5nVmFsdWU6IG51bGwgfCBMU3R5bGluZ01hcCxcbiAgICBuZXdWYWx1ZXM6IHtba2V5OiBzdHJpbmddOiBhbnl9IHwgc3RyaW5nIHwgbnVsbCB8IHVuZGVmaW5lZCk6IExTdHlsaW5nTWFwIHtcbiAgY29uc3QgbFN0eWxpbmdNYXA6IExTdHlsaW5nTWFwID0gQXJyYXkuaXNBcnJheShiaW5kaW5nVmFsdWUpID8gYmluZGluZ1ZhbHVlIDogW251bGxdO1xuICBsU3R5bGluZ01hcFtMU3R5bGluZ01hcEluZGV4LlJhd1ZhbHVlUG9zaXRpb25dID0gbmV3VmFsdWVzIHx8IG51bGw7XG5cbiAgLy8gYmVjYXVzZSB0aGUgbmV3IHZhbHVlcyBtYXkgbm90IGluY2x1ZGUgYWxsIHRoZSBwcm9wZXJ0aWVzXG4gIC8vIHRoYXQgdGhlIG9sZCBvbmVzIGhhZCwgYWxsIHZhbHVlcyBhcmUgc2V0IHRvIGBudWxsYCBiZWZvcmVcbiAgLy8gdGhlIG5ldyB2YWx1ZXMgYXJlIGFwcGxpZWQuIFRoaXMgd2F5LCB3aGVuIGZsdXNoZWQsIHRoZVxuICAvLyBzdHlsaW5nIGFsZ29yaXRobSBrbm93cyBleGFjdGx5IHdoYXQgc3R5bGUvY2xhc3MgdmFsdWVzXG4gIC8vIHRvIHJlbW92ZSBmcm9tIHRoZSBlbGVtZW50IChzaW5jZSB0aGV5IGFyZSBgbnVsbGApLlxuICBmb3IgKGxldCBqID0gTFN0eWxpbmdNYXBJbmRleC5WYWx1ZXNTdGFydFBvc2l0aW9uOyBqIDwgbFN0eWxpbmdNYXAubGVuZ3RoO1xuICAgICAgIGogKz0gTFN0eWxpbmdNYXBJbmRleC5UdXBsZVNpemUpIHtcbiAgICBzZXRNYXBWYWx1ZShsU3R5bGluZ01hcCwgaiwgbnVsbCk7XG4gIH1cblxuICBsZXQgcHJvcHM6IHN0cmluZ1tdfG51bGwgPSBudWxsO1xuICBsZXQgbWFwOiB7W2tleTogc3RyaW5nXTogYW55fXx1bmRlZmluZWR8bnVsbDtcbiAgbGV0IGFsbFZhbHVlc1RydWUgPSBmYWxzZTtcbiAgaWYgKHR5cGVvZiBuZXdWYWx1ZXMgPT09ICdzdHJpbmcnKSB7ICAvLyBbY2xhc3NdIGJpbmRpbmdzIGFsbG93IHN0cmluZyB2YWx1ZXNcbiAgICBpZiAobmV3VmFsdWVzLmxlbmd0aCkge1xuICAgICAgcHJvcHMgPSBuZXdWYWx1ZXMuc3BsaXQoL1xccysvKTtcbiAgICAgIGFsbFZhbHVlc1RydWUgPSB0cnVlO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBwcm9wcyA9IG5ld1ZhbHVlcyA/IE9iamVjdC5rZXlzKG5ld1ZhbHVlcykgOiBudWxsO1xuICAgIG1hcCA9IG5ld1ZhbHVlcztcbiAgfVxuXG4gIGlmIChwcm9wcykge1xuICAgIG91dGVyOiBmb3IgKGxldCBpID0gMDsgaSA8IHByb3BzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBwcm9wID0gcHJvcHNbaV0gYXMgc3RyaW5nO1xuICAgICAgY29uc3QgdmFsdWUgPSBhbGxWYWx1ZXNUcnVlID8gdHJ1ZSA6IG1hcCAhW3Byb3BdO1xuICAgICAgZm9yIChsZXQgaiA9IExTdHlsaW5nTWFwSW5kZXguVmFsdWVzU3RhcnRQb3NpdGlvbjsgaiA8IGxTdHlsaW5nTWFwLmxlbmd0aDtcbiAgICAgICAgICAgaiArPSBMU3R5bGluZ01hcEluZGV4LlR1cGxlU2l6ZSkge1xuICAgICAgICBjb25zdCBwcm9wQXRJbmRleCA9IGdldE1hcFByb3AobFN0eWxpbmdNYXAsIGopO1xuICAgICAgICBpZiAocHJvcCA8PSBwcm9wQXRJbmRleCkge1xuICAgICAgICAgIGlmIChwcm9wQXRJbmRleCA9PT0gcHJvcCkge1xuICAgICAgICAgICAgc2V0TWFwVmFsdWUobFN0eWxpbmdNYXAsIGosIHZhbHVlKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbFN0eWxpbmdNYXAuc3BsaWNlKGosIDAsIHByb3AsIHZhbHVlKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgY29udGludWUgb3V0ZXI7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGxTdHlsaW5nTWFwLnB1c2gocHJvcCwgdmFsdWUpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBsU3R5bGluZ01hcDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldE1hcFByb3AobWFwOiBMU3R5bGluZ01hcCwgaW5kZXg6IG51bWJlcik6IHN0cmluZyB7XG4gIHJldHVybiBtYXBbaW5kZXggKyBMU3R5bGluZ01hcEluZGV4LlByb3BPZmZzZXRdIGFzIHN0cmluZztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNldE1hcFZhbHVlKG1hcDogTFN0eWxpbmdNYXAsIGluZGV4OiBudW1iZXIsIHZhbHVlOiBzdHJpbmcgfCBudWxsKTogdm9pZCB7XG4gIG1hcFtpbmRleCArIExTdHlsaW5nTWFwSW5kZXguVmFsdWVPZmZzZXRdID0gdmFsdWU7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRNYXBWYWx1ZShtYXA6IExTdHlsaW5nTWFwLCBpbmRleDogbnVtYmVyKTogc3RyaW5nfG51bGwge1xuICByZXR1cm4gbWFwW2luZGV4ICsgTFN0eWxpbmdNYXBJbmRleC5WYWx1ZU9mZnNldF0gYXMgc3RyaW5nIHwgbnVsbDtcbn1cbiJdfQ==