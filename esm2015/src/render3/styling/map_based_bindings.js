/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
* @license
* Copyright Google Inc. All Rights Reserved.
*
* Use of this source code is governed by an MIT-style license that can be
* found in the LICENSE file at https://angular.io/license
*/
import { unwrapSafeValue } from '../../sanitization/bypass';
import { getBindingValue, getMapProp, getMapValue, getValue, getValuesCount, isStylingValueDefined } from '../util/styling_utils';
import { setStylingMapsSyncFn } from './bindings';
/**
 * --------
 *
 * This file contains the algorithm logic for applying map-based bindings
 * such as `[style]` and `[class]`.
 *
 * --------
 */
/**
 * Enables support for map-based styling bindings (e.g. `[style]` and `[class]` bindings).
 * @return {?}
 */
export function activateStylingMapFeature() {
    setStylingMapsSyncFn(syncStylingMap);
}
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
 * map-value changes) then the map is iterated over and a `StylingMapArray` array
 * is produced. The `StylingMapArray` instance is stored in the binding location
 * where the `BINDING_INDEX` is situated when the `styleMap()` or `classMap()`
 * instruction were called. Once the binding changes, then the internal `bitMask`
 * value is marked as dirty.
 *
 * Styling values are applied once CD exits the element (which happens when
 * the `advance(n)` instruction is called or the template function exits). When
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
 * @param {?} sourceIndex
 * @param {?} applyStylingFn
 * @param {?} sanitizer
 * @param {?} mode
 * @param {?=} targetProp
 * @param {?=} defaultValue
 * @return {?}
 */
(context, renderer, element, data, sourceIndex, applyStylingFn, sanitizer, mode, targetProp, defaultValue) => {
    /** @type {?} */
    let targetPropValueWasApplied = false;
    // once the map-based styling code is activate it is never deactivated. For this reason a
    // check to see if the current styling context has any map based bindings is required.
    /** @type {?} */
    const totalMaps = getValuesCount(context);
    if (totalMaps) {
        /** @type {?} */
        let runTheSyncAlgorithm = true;
        /** @type {?} */
        const loopUntilEnd = !targetProp;
        // If the code is told to finish up (run until the end), but the mode
        // hasn't been flagged to apply values (it only traverses values) then
        // there is no point in iterating over the array because nothing will
        // be applied to the element.
        if (loopUntilEnd && (mode & 1 /* ApplyAllValues */) === 0) {
            runTheSyncAlgorithm = false;
            targetPropValueWasApplied = true;
        }
        if (runTheSyncAlgorithm) {
            targetPropValueWasApplied = innerSyncStylingMap(context, renderer, element, data, applyStylingFn, sanitizer, mode, targetProp || null, sourceIndex, defaultValue || null);
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
    const totalMaps = getValuesCount(context) - 1;
    // maps have no default value
    /** @type {?} */
    const mapsLimit = totalMaps - 1;
    /** @type {?} */
    const recurseInnerMaps = currentMapIndex < mapsLimit && (mode & 8 /* RecurseInnerMaps */) !== 0;
    /** @type {?} */
    const checkValuesOnly = (mode & 16 /* CheckValuesOnly */) !== 0;
    if (checkValuesOnly) {
        // inner modes do not check values ever (that can only happen
        // when sourceIndex === 0)
        mode &= ~16 /* CheckValuesOnly */;
    }
    /** @type {?} */
    let targetPropValueWasApplied = false;
    if (currentMapIndex <= mapsLimit) {
        /** @type {?} */
        let cursor = getCurrentSyncCursor(currentMapIndex);
        /** @type {?} */
        const bindingIndex = (/** @type {?} */ (getBindingValue(context, 2 /* ValuesStartPosition */, currentMapIndex)));
        /** @type {?} */
        const stylingMapArr = getValue(data, bindingIndex);
        if (stylingMapArr) {
            while (cursor < stylingMapArr.length) {
                /** @type {?} */
                const prop = getMapProp(stylingMapArr, cursor);
                /** @type {?} */
                const iteratedTooFar = targetProp && prop > targetProp;
                /** @type {?} */
                const isTargetPropMatched = !iteratedTooFar && prop === targetProp;
                /** @type {?} */
                const value = getMapValue(stylingMapArr, cursor);
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
                let valueApplied = recurseInnerMaps ?
                    innerSyncStylingMap(context, renderer, element, data, applyStylingFn, sanitizer, innerMode, innerProp, currentMapIndex + 1, defaultValue) :
                    false;
                if (iteratedTooFar) {
                    if (!targetPropValueWasApplied) {
                        targetPropValueWasApplied = valueApplied;
                    }
                    break;
                }
                if (!valueApplied && isValueAllowedToBeApplied(mode, isTargetPropMatched)) {
                    valueApplied = true;
                    if (!checkValuesOnly) {
                        /** @type {?} */
                        const useDefault = isTargetPropMatched && !valueIsDefined;
                        /** @type {?} */
                        const bindingIndexToApply = isTargetPropMatched ? bindingIndex : null;
                        /** @type {?} */
                        let finalValue;
                        if (useDefault) {
                            finalValue = defaultValue;
                        }
                        else {
                            finalValue = sanitizer ?
                                sanitizer(prop, value, 3 /* ValidateAndSanitize */) :
                                (value ? unwrapSafeValue(value) : null);
                        }
                        applyStylingFn(renderer, element, prop, finalValue, bindingIndexToApply);
                    }
                }
                targetPropValueWasApplied = valueApplied && isTargetPropMatched;
                cursor += 2 /* TupleSize */;
            }
            setCurrentSyncCursor(currentMapIndex, cursor);
            // this is a fallback case in the event that the styling map is `null` for this
            // binding but there are other map-based bindings that need to be evaluated
            // afterwards. If the `prop` value is falsy then the intention is to cycle
            // through all of the properties in the remaining maps as well. If the current
            // styling map is too short then there are no values to iterate over. In either
            // case the follow-up maps need to be iterated over.
            if (recurseInnerMaps &&
                (stylingMapArr.length === 1 /* ValuesStartPosition */ || !targetProp)) {
                targetPropValueWasApplied = innerSyncStylingMap(context, renderer, element, data, applyStylingFn, sanitizer, mode, targetProp, currentMapIndex + 1, defaultValue);
            }
        }
        else if (recurseInnerMaps) {
            targetPropValueWasApplied = innerSyncStylingMap(context, renderer, element, data, applyStylingFn, sanitizer, mode, targetProp, currentMapIndex + 1, defaultValue);
        }
    }
    return targetPropValueWasApplied;
}
/**
 * Used to determine the mode for the inner recursive call.
 *
 * If an inner map is iterated on then this is done so for one
 * of two reasons:
 *
 * - value is being applied:
 *   if the value is being applied from this current styling
 *   map then there is no need to apply it in a deeper map
 *   (i.e. the `SkipTargetProp` flag is set)
 *
 * - value is being not applied:
 *   apply the value if it is found in a deeper map.
 *   (i.e. the `SkipTargetProp` flag is unset)
 *
 * When these reasons are encountered the flags will for the
 * inner map mode will be configured.
 * @param {?} currentMode
 * @param {?} valueIsDefined
 * @param {?} isTargetPropMatched
 * @return {?}
 */
function resolveInnerMapMode(currentMode, valueIsDefined, isTargetPropMatched) {
    /** @type {?} */
    let innerMode = currentMode;
    // the statements below figures out whether or not an inner styling map
    // is allowed to apply its value or not. The main thing to keep note
    // of is that if the target prop isn't matched then its expected that
    // all values before it are allowed to be applied so long as "apply all values"
    // is set to true.
    /** @type {?} */
    const applyAllValues = currentMode & 1 /* ApplyAllValues */;
    /** @type {?} */
    const applyTargetProp = currentMode & 2 /* ApplyTargetProp */;
    /** @type {?} */
    const allowInnerApply = !valueIsDefined && (isTargetPropMatched ? applyTargetProp : applyAllValues);
    if (allowInnerApply) {
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
    let doApplyValue = (mode & 1 /* ApplyAllValues */) !== 0;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFwX2Jhc2VkX2JpbmRpbmdzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9zdHlsaW5nL21hcF9iYXNlZF9iaW5kaW5ncy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQU9BLE9BQU8sRUFBQyxlQUFlLEVBQUMsTUFBTSwyQkFBMkIsQ0FBQztBQUkxRCxPQUFPLEVBQUMsZUFBZSxFQUFFLFVBQVUsRUFBRSxXQUFXLEVBQUUsUUFBUSxFQUFFLGNBQWMsRUFBRSxxQkFBcUIsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBRWhJLE9BQU8sRUFBQyxvQkFBb0IsRUFBQyxNQUFNLFlBQVksQ0FBQzs7Ozs7Ozs7Ozs7OztBQWVoRCxNQUFNLFVBQVUseUJBQXlCO0lBQ3ZDLG9CQUFvQixDQUFDLGNBQWMsQ0FBQyxDQUFDO0FBQ3ZDLENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFrRkQsTUFBTSxPQUFPLGNBQWM7Ozs7Ozs7Ozs7Ozs7QUFDdkIsQ0FBQyxPQUF3QixFQUFFLFFBQWdELEVBQUUsT0FBaUIsRUFDN0YsSUFBa0IsRUFBRSxXQUFtQixFQUFFLGNBQThCLEVBQ3ZFLFNBQWlDLEVBQUUsSUFBeUIsRUFBRSxVQUEwQixFQUN4RixZQUFzQyxFQUFXLEVBQUU7O1FBQzlDLHlCQUF5QixHQUFHLEtBQUs7Ozs7VUFJL0IsU0FBUyxHQUFHLGNBQWMsQ0FBQyxPQUFPLENBQUM7SUFDekMsSUFBSSxTQUFTLEVBQUU7O1lBQ1QsbUJBQW1CLEdBQUcsSUFBSTs7Y0FDeEIsWUFBWSxHQUFHLENBQUMsVUFBVTtRQUVoQyxxRUFBcUU7UUFDckUsc0VBQXNFO1FBQ3RFLHFFQUFxRTtRQUNyRSw2QkFBNkI7UUFDN0IsSUFBSSxZQUFZLElBQUksQ0FB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QUFtQixDQUFDO1NBQ3BDO0tBQ0Y7U0FBTSxJQUFJLENBQUMsSUFBSSx5QkFBcUMsQ0FBQyxJQUFJLG1CQUFtQixFQUFFO1FBQzdFLFlBQVksR0FBRyxLQUFLLENBQUM7S0FDdEI7SUFDRCxPQUFPLFlBQVksQ0FBQztBQUN0QixDQUFDOzs7Ozs7TUFNSyxXQUFXLEdBQWEsRUFBRTs7Ozs7O0FBTWhDLFNBQVMsZ0JBQWdCO0lBQ3ZCLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxXQUFXLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO1FBQzNDLFdBQVcsQ0FBQyxDQUFDLENBQUMsOEJBQTJDLENBQUM7S0FDM0Q7QUFDSCxDQUFDOzs7Ozs7QUFLRCxTQUFTLG9CQUFvQixDQUFDLFFBQWdCO0lBQzVDLElBQUksUUFBUSxJQUFJLFdBQVcsQ0FBQyxNQUFNLEVBQUU7UUFDbEMsV0FBVyxDQUFDLElBQUksNkJBQTBDLENBQUM7S0FDNUQ7SUFDRCxPQUFPLFdBQVcsQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUMvQixDQUFDOzs7Ozs7O0FBS0QsU0FBUyxvQkFBb0IsQ0FBQyxRQUFnQixFQUFFLFVBQWtCO0lBQ2hFLFdBQVcsQ0FBQyxRQUFRLENBQUMsR0FBRyxVQUFVLENBQUM7QUFDckMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuKiBAbGljZW5zZVxuKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbipcbiogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuKi9cbmltcG9ydCB7dW53cmFwU2FmZVZhbHVlfSBmcm9tICcuLi8uLi9zYW5pdGl6YXRpb24vYnlwYXNzJztcbmltcG9ydCB7U3R5bGVTYW5pdGl6ZUZuLCBTdHlsZVNhbml0aXplTW9kZX0gZnJvbSAnLi4vLi4vc2FuaXRpemF0aW9uL3N0eWxlX3Nhbml0aXplcic7XG5pbXBvcnQge1Byb2NlZHVyYWxSZW5kZXJlcjMsIFJFbGVtZW50LCBSZW5kZXJlcjN9IGZyb20gJy4uL2ludGVyZmFjZXMvcmVuZGVyZXInO1xuaW1wb3J0IHtBcHBseVN0eWxpbmdGbiwgTFN0eWxpbmdEYXRhLCBTdHlsaW5nTWFwQXJyYXksIFN0eWxpbmdNYXBBcnJheUluZGV4LCBTdHlsaW5nTWFwc1N5bmNNb2RlLCBTeW5jU3R5bGluZ01hcHNGbiwgVFN0eWxpbmdDb250ZXh0LCBUU3R5bGluZ0NvbnRleHRJbmRleH0gZnJvbSAnLi4vaW50ZXJmYWNlcy9zdHlsaW5nJztcbmltcG9ydCB7Z2V0QmluZGluZ1ZhbHVlLCBnZXRNYXBQcm9wLCBnZXRNYXBWYWx1ZSwgZ2V0VmFsdWUsIGdldFZhbHVlc0NvdW50LCBpc1N0eWxpbmdWYWx1ZURlZmluZWR9IGZyb20gJy4uL3V0aWwvc3R5bGluZ191dGlscyc7XG5cbmltcG9ydCB7c2V0U3R5bGluZ01hcHNTeW5jRm59IGZyb20gJy4vYmluZGluZ3MnO1xuXG5cbi8qKlxuICogLS0tLS0tLS1cbiAqXG4gKiBUaGlzIGZpbGUgY29udGFpbnMgdGhlIGFsZ29yaXRobSBsb2dpYyBmb3IgYXBwbHlpbmcgbWFwLWJhc2VkIGJpbmRpbmdzXG4gKiBzdWNoIGFzIGBbc3R5bGVdYCBhbmQgYFtjbGFzc11gLlxuICpcbiAqIC0tLS0tLS0tXG4gKi9cblxuLyoqXG4gKiBFbmFibGVzIHN1cHBvcnQgZm9yIG1hcC1iYXNlZCBzdHlsaW5nIGJpbmRpbmdzIChlLmcuIGBbc3R5bGVdYCBhbmQgYFtjbGFzc11gIGJpbmRpbmdzKS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFjdGl2YXRlU3R5bGluZ01hcEZlYXR1cmUoKSB7XG4gIHNldFN0eWxpbmdNYXBzU3luY0ZuKHN5bmNTdHlsaW5nTWFwKTtcbn1cblxuLyoqXG4gKiBVc2VkIHRvIGFwcGx5IHN0eWxpbmcgdmFsdWVzIHByZXNlbnRseSB3aXRoaW4gYW55IG1hcC1iYXNlZCBiaW5kaW5ncyBvbiBhbiBlbGVtZW50LlxuICpcbiAqIEFuZ3VsYXIgc3VwcG9ydHMgbWFwLWJhc2VkIHN0eWxpbmcgYmluZGluZ3Mgd2hpY2ggY2FuIGJlIGFwcGxpZWQgdmlhIHRoZVxuICogYFtzdHlsZV1gIGFuZCBgW2NsYXNzXWAgYmluZGluZ3Mgd2hpY2ggY2FuIGJlIHBsYWNlZCBvbiBhbnkgSFRNTCBlbGVtZW50LlxuICogVGhlc2UgYmluZGluZ3MgY2FuIHdvcmsgaW5kZXBlbmRlbnRseSwgdG9nZXRoZXIgb3IgYWxvbmdzaWRlIHByb3AtYmFzZWRcbiAqIHN0eWxpbmcgYmluZGluZ3MgKGUuZy4gYDxkaXYgW3N0eWxlXT1cInhcIiBbc3R5bGUud2lkdGhdPVwid1wiPmApLlxuICpcbiAqIElmIGEgbWFwLWJhc2VkIHN0eWxpbmcgYmluZGluZyBpcyBkZXRlY3RlZCBieSB0aGUgY29tcGlsZXIsIHRoZSBmb2xsb3dpbmdcbiAqIEFPVCBjb2RlIGlzIHByb2R1Y2VkOlxuICpcbiAqIGBgYHR5cGVzY3JpcHRcbiAqIHN0eWxlTWFwKGN0eC5zdHlsZXMpOyAvLyBzdHlsZXMgPSB7a2V5OnZhbHVlfVxuICogY2xhc3NNYXAoY3R4LmNsYXNzZXMpOyAvLyBjbGFzc2VzID0ge2tleTp2YWx1ZX18c3RyaW5nXG4gKiBgYGBcbiAqXG4gKiBJZiBhbmQgd2hlbiBlaXRoZXIgb2YgdGhlIGluc3RydWN0aW9ucyBhYm92ZSBhcmUgZXZhbHVhdGVkLCB0aGVuIHRoZSBjb2RlXG4gKiBwcmVzZW50IGluIHRoaXMgZmlsZSBpcyBpbmNsdWRlZCBpbnRvIHRoZSBidW5kbGUuIFRoZSBtZWNoYW5pc20gdXNlZCwgdG9cbiAqIGFjdGl2YXRlIHN1cHBvcnQgZm9yIG1hcC1iYXNlZCBiaW5kaW5ncyBhdCBydW50aW1lIGlzIHBvc3NpYmxlIHZpYSB0aGVcbiAqIGBhY3RpdmVTdHlsaW5nTWFwRmVhdHVyZWAgZnVuY3Rpb24gKHdoaWNoIGlzIGFsc28gcHJlc2VudCBpbiB0aGlzIGZpbGUpLlxuICpcbiAqICMgVGhlIEFsZ29yaXRobVxuICogV2hlbmV2ZXIgYSBtYXAtYmFzZWQgYmluZGluZyB1cGRhdGVzICh3aGljaCBpcyB3aGVuIHRoZSBpZGVudGl0eSBvZiB0aGVcbiAqIG1hcC12YWx1ZSBjaGFuZ2VzKSB0aGVuIHRoZSBtYXAgaXMgaXRlcmF0ZWQgb3ZlciBhbmQgYSBgU3R5bGluZ01hcEFycmF5YCBhcnJheVxuICogaXMgcHJvZHVjZWQuIFRoZSBgU3R5bGluZ01hcEFycmF5YCBpbnN0YW5jZSBpcyBzdG9yZWQgaW4gdGhlIGJpbmRpbmcgbG9jYXRpb25cbiAqIHdoZXJlIHRoZSBgQklORElOR19JTkRFWGAgaXMgc2l0dWF0ZWQgd2hlbiB0aGUgYHN0eWxlTWFwKClgIG9yIGBjbGFzc01hcCgpYFxuICogaW5zdHJ1Y3Rpb24gd2VyZSBjYWxsZWQuIE9uY2UgdGhlIGJpbmRpbmcgY2hhbmdlcywgdGhlbiB0aGUgaW50ZXJuYWwgYGJpdE1hc2tgXG4gKiB2YWx1ZSBpcyBtYXJrZWQgYXMgZGlydHkuXG4gKlxuICogU3R5bGluZyB2YWx1ZXMgYXJlIGFwcGxpZWQgb25jZSBDRCBleGl0cyB0aGUgZWxlbWVudCAod2hpY2ggaGFwcGVucyB3aGVuXG4gKiB0aGUgYGFkdmFuY2UobilgIGluc3RydWN0aW9uIGlzIGNhbGxlZCBvciB0aGUgdGVtcGxhdGUgZnVuY3Rpb24gZXhpdHMpLiBXaGVuXG4gKiB0aGlzIG9jY3VycywgYWxsIHByb3AtYmFzZWQgYmluZGluZ3MgYXJlIGFwcGxpZWQuIElmIGEgbWFwLWJhc2VkIGJpbmRpbmcgaXNcbiAqIHByZXNlbnQgdGhlbiBhIHNwZWNpYWwgZmx1c2hpbmcgZnVuY3Rpb24gKGNhbGxlZCBhIHN5bmMgZnVuY3Rpb24pIGlzIG1hZGVcbiAqIGF2YWlsYWJsZSBhbmQgaXQgd2lsbCBiZSBjYWxsZWQgZWFjaCB0aW1lIGEgc3R5bGluZyBwcm9wZXJ0eSBpcyBmbHVzaGVkLlxuICpcbiAqIFRoZSBmbHVzaGluZyBhbGdvcml0aG0gaXMgZGVzaWduZWQgdG8gYXBwbHkgc3R5bGluZyBmb3IgYSBwcm9wZXJ0eSAod2hpY2ggaXNcbiAqIGEgQ1NTIHByb3BlcnR5IG9yIGEgY2xhc3NOYW1lIHZhbHVlKSBvbmUgYnkgb25lLiBJZiBtYXAtYmFzZWQgYmluZGluZ3NcbiAqIGFyZSBwcmVzZW50LCB0aGVuIHRoZSBmbHVzaGluZyBhbGdvcml0aG0gd2lsbCBrZWVwIGNhbGxpbmcgdGhlIG1hcHMgc3R5bGluZ1xuICogc3luYyBmdW5jdGlvbiBlYWNoIHRpbWUgYSBwcm9wZXJ0eSBpcyB2aXNpdGVkLiBUaGlzIHdheSwgdGhlIGZsdXNoaW5nXG4gKiBiZWhhdmlvciBvZiBtYXAtYmFzZWQgYmluZGluZ3Mgd2lsbCBhbHdheXMgYmUgYXQgdGhlIHNhbWUgcHJvcGVydHkgbGV2ZWxcbiAqIGFzIHRoZSBjdXJyZW50IHByb3AtYmFzZWQgcHJvcGVydHkgYmVpbmcgaXRlcmF0ZWQgb3ZlciAoYmVjYXVzZSBldmVyeXRoaW5nXG4gKiBpcyBhbHBoYWJldGljYWxseSBzb3J0ZWQpLlxuICpcbiAqIExldCdzIGltYWdpbmUgd2UgaGF2ZSB0aGUgZm9sbG93aW5nIEhUTUwgdGVtcGxhdGUgY29kZTpcbiAqXG4gKiBgYGBodG1sXG4gKiA8ZGl2IFtzdHlsZV09XCJ7d2lkdGg6JzEwMHB4JywgaGVpZ2h0OicyMDBweCcsICd6LWluZGV4JzonMTAnfVwiXG4gKiAgICAgIFtzdHlsZS53aWR0aC5weF09XCIyMDBcIj4uLi48L2Rpdj5cbiAqIGBgYFxuICpcbiAqIFdoZW4gQ0Qgb2NjdXJzLCBib3RoIHRoZSBgW3N0eWxlXWAgYW5kIGBbc3R5bGUud2lkdGhdYCBiaW5kaW5nc1xuICogYXJlIGV2YWx1YXRlZC4gVGhlbiB3aGVuIHRoZSBzdHlsZXMgYXJlIGZsdXNoZWQgb24gc2NyZWVuLCB0aGVcbiAqIGZvbGxvd2luZyBvcGVyYXRpb25zIGhhcHBlbjpcbiAqXG4gKiAxLiBgW3N0eWxlLndpZHRoXWAgaXMgYXR0ZW1wdGVkIHRvIGJlIHdyaXR0ZW4gdG8gdGhlIGVsZW1lbnQuXG4gKlxuICogMi4gIE9uY2UgdGhhdCBoYXBwZW5zLCB0aGUgYWxnb3JpdGhtIGluc3RydWN0cyB0aGUgbWFwLWJhc2VkXG4gKiAgICAgZW50cmllcyAoYFtzdHlsZV1gIGluIHRoaXMgY2FzZSkgdG8gXCJjYXRjaCB1cFwiIGFuZCBhcHBseVxuICogICAgIGFsbCB2YWx1ZXMgdXAgdG8gdGhlIGB3aWR0aGAgdmFsdWUuIFdoZW4gdGhpcyBoYXBwZW5zIHRoZVxuICogICAgIGBoZWlnaHRgIHZhbHVlIGlzIGFwcGxpZWQgdG8gdGhlIGVsZW1lbnQgKHNpbmNlIGl0IGlzXG4gKiAgICAgYWxwaGFiZXRpY2FsbHkgc2l0dWF0ZWQgYmVmb3JlIHRoZSBgd2lkdGhgIHByb3BlcnR5KS5cbiAqXG4gKiAzLiBTaW5jZSB0aGVyZSBhcmUgbm8gbW9yZSBwcm9wLWJhc2VkIGVudHJpZXMgYW55bW9yZSwgdGhlXG4gKiAgICBsb29wIGV4aXRzIGFuZCB0aGVuLCBqdXN0IGJlZm9yZSB0aGUgZmx1c2hpbmcgZW5kcywgaXRcbiAqICAgIGluc3RydWN0cyBhbGwgbWFwLWJhc2VkIGJpbmRpbmdzIHRvIFwiZmluaXNoIHVwXCIgYXBwbHlpbmdcbiAqICAgIHRoZWlyIHZhbHVlcy5cbiAqXG4gKiA0LiBUaGUgb25seSByZW1haW5pbmcgdmFsdWUgd2l0aGluIHRoZSBtYXAtYmFzZWQgZW50cmllcyBpc1xuICogICAgdGhlIGB6LWluZGV4YCB2YWx1ZSAoYHdpZHRoYCBnb3Qgc2tpcHBlZCBiZWNhdXNlIGl0IHdhc1xuICogICAgc3VjY2Vzc2Z1bGx5IGFwcGxpZWQgdmlhIHRoZSBwcm9wLWJhc2VkIGBbc3R5bGUud2lkdGhdYFxuICogICAgYmluZGluZykuIFNpbmNlIGFsbCBtYXAtYmFzZWQgZW50cmllcyBhcmUgdG9sZCB0byBcImZpbmlzaCB1cFwiLFxuICogICAgdGhlIGB6LWluZGV4YCB2YWx1ZSBpcyBpdGVyYXRlZCBvdmVyIGFuZCBpdCBpcyB0aGVuIGFwcGxpZWRcbiAqICAgIHRvIHRoZSBlbGVtZW50LlxuICpcbiAqIFRoZSBtb3N0IGltcG9ydGFudCB0aGluZyB0byB0YWtlIG5vdGUgb2YgaGVyZSBpcyB0aGF0IHByb3AtYmFzZWRcbiAqIGJpbmRpbmdzIGFyZSBldmFsdWF0ZWQgaW4gb3JkZXIgYWxvbmdzaWRlIG1hcC1iYXNlZCBiaW5kaW5ncy5cbiAqIFRoaXMgYWxsb3dzIGFsbCBzdHlsaW5nIGFjcm9zcyBhbiBlbGVtZW50IHRvIGJlIGFwcGxpZWQgaW4gTyhuKVxuICogdGltZSAoYSBzaW1pbGFyIGFsZ29yaXRobSBpcyB0aGF0IG9mIHRoZSBhcnJheSBtZXJnZSBhbGdvcml0aG1cbiAqIGluIG1lcmdlIHNvcnQpLlxuICovXG5leHBvcnQgY29uc3Qgc3luY1N0eWxpbmdNYXA6IFN5bmNTdHlsaW5nTWFwc0ZuID1cbiAgICAoY29udGV4dDogVFN0eWxpbmdDb250ZXh0LCByZW5kZXJlcjogUmVuZGVyZXIzIHwgUHJvY2VkdXJhbFJlbmRlcmVyMyB8IG51bGwsIGVsZW1lbnQ6IFJFbGVtZW50LFxuICAgICBkYXRhOiBMU3R5bGluZ0RhdGEsIHNvdXJjZUluZGV4OiBudW1iZXIsIGFwcGx5U3R5bGluZ0ZuOiBBcHBseVN0eWxpbmdGbixcbiAgICAgc2FuaXRpemVyOiBTdHlsZVNhbml0aXplRm4gfCBudWxsLCBtb2RlOiBTdHlsaW5nTWFwc1N5bmNNb2RlLCB0YXJnZXRQcm9wPzogc3RyaW5nIHwgbnVsbCxcbiAgICAgZGVmYXVsdFZhbHVlPzogc3RyaW5nIHwgYm9vbGVhbiB8IG51bGwpOiBib29sZWFuID0+IHtcbiAgICAgIGxldCB0YXJnZXRQcm9wVmFsdWVXYXNBcHBsaWVkID0gZmFsc2U7XG5cbiAgICAgIC8vIG9uY2UgdGhlIG1hcC1iYXNlZCBzdHlsaW5nIGNvZGUgaXMgYWN0aXZhdGUgaXQgaXMgbmV2ZXIgZGVhY3RpdmF0ZWQuIEZvciB0aGlzIHJlYXNvbiBhXG4gICAgICAvLyBjaGVjayB0byBzZWUgaWYgdGhlIGN1cnJlbnQgc3R5bGluZyBjb250ZXh0IGhhcyBhbnkgbWFwIGJhc2VkIGJpbmRpbmdzIGlzIHJlcXVpcmVkLlxuICAgICAgY29uc3QgdG90YWxNYXBzID0gZ2V0VmFsdWVzQ291bnQoY29udGV4dCk7XG4gICAgICBpZiAodG90YWxNYXBzKSB7XG4gICAgICAgIGxldCBydW5UaGVTeW5jQWxnb3JpdGhtID0gdHJ1ZTtcbiAgICAgICAgY29uc3QgbG9vcFVudGlsRW5kID0gIXRhcmdldFByb3A7XG5cbiAgICAgICAgLy8gSWYgdGhlIGNvZGUgaXMgdG9sZCB0byBmaW5pc2ggdXAgKHJ1biB1bnRpbCB0aGUgZW5kKSwgYnV0IHRoZSBtb2RlXG4gICAgICAgIC8vIGhhc24ndCBiZWVuIGZsYWdnZWQgdG8gYXBwbHkgdmFsdWVzIChpdCBvbmx5IHRyYXZlcnNlcyB2YWx1ZXMpIHRoZW5cbiAgICAgICAgLy8gdGhlcmUgaXMgbm8gcG9pbnQgaW4gaXRlcmF0aW5nIG92ZXIgdGhlIGFycmF5IGJlY2F1c2Ugbm90aGluZyB3aWxsXG4gICAgICAgIC8vIGJlIGFwcGxpZWQgdG8gdGhlIGVsZW1lbnQuXG4gICAgICAgIGlmIChsb29wVW50aWxFbmQgJiYgKG1vZGUgJiBTdHlsaW5nTWFwc1N5bmNNb2RlLkFwcGx5QWxsVmFsdWVzKSA9PT0gMCkge1xuICAgICAgICAgIHJ1blRoZVN5bmNBbGdvcml0aG0gPSBmYWxzZTtcbiAgICAgICAgICB0YXJnZXRQcm9wVmFsdWVXYXNBcHBsaWVkID0gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChydW5UaGVTeW5jQWxnb3JpdGhtKSB7XG4gICAgICAgICAgdGFyZ2V0UHJvcFZhbHVlV2FzQXBwbGllZCA9IGlubmVyU3luY1N0eWxpbmdNYXAoXG4gICAgICAgICAgICAgIGNvbnRleHQsIHJlbmRlcmVyLCBlbGVtZW50LCBkYXRhLCBhcHBseVN0eWxpbmdGbiwgc2FuaXRpemVyLCBtb2RlLCB0YXJnZXRQcm9wIHx8IG51bGwsXG4gICAgICAgICAgICAgIHNvdXJjZUluZGV4LCBkZWZhdWx0VmFsdWUgfHwgbnVsbCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAobG9vcFVudGlsRW5kKSB7XG4gICAgICAgICAgcmVzZXRTeW5jQ3Vyc29ycygpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB0YXJnZXRQcm9wVmFsdWVXYXNBcHBsaWVkO1xuICAgIH07XG5cbi8qKlxuICogUmVjdXJzaXZlIGZ1bmN0aW9uIGRlc2lnbmVkIHRvIGFwcGx5IG1hcC1iYXNlZCBzdHlsaW5nIHRvIGFuIGVsZW1lbnQgb25lIG1hcCBhdCBhIHRpbWUuXG4gKlxuICogVGhpcyBmdW5jdGlvbiBpcyBkZXNpZ25lZCB0byBiZSBjYWxsZWQgZnJvbSB0aGUgYHN5bmNTdHlsaW5nTWFwYCBmdW5jdGlvbiBhbmQgd2lsbFxuICogYXBwbHkgbWFwLWJhc2VkIHN0eWxpbmcgZGF0YSBvbmUgbWFwIGF0IGEgdGltZSB0byB0aGUgcHJvdmlkZWQgYGVsZW1lbnRgLlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gaXMgcmVjdXJzaXZlIGFuZCBpdCB3aWxsIGNhbGwgaXRzZWxmIGlmIGEgZm9sbG93LXVwIG1hcCB2YWx1ZSBpcyB0byBiZVxuICogcHJvY2Vzc2VkLiBUbyBsZWFybiBtb3JlIGFib3V0IGhvdyB0aGUgYWxnb3JpdGhtIHdvcmtzLCBzZWUgYHN5bmNTdHlsaW5nTWFwYC5cbiAqL1xuZnVuY3Rpb24gaW5uZXJTeW5jU3R5bGluZ01hcChcbiAgICBjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQsIHJlbmRlcmVyOiBSZW5kZXJlcjMgfCBQcm9jZWR1cmFsUmVuZGVyZXIzIHwgbnVsbCwgZWxlbWVudDogUkVsZW1lbnQsXG4gICAgZGF0YTogTFN0eWxpbmdEYXRhLCBhcHBseVN0eWxpbmdGbjogQXBwbHlTdHlsaW5nRm4sIHNhbml0aXplcjogU3R5bGVTYW5pdGl6ZUZuIHwgbnVsbCxcbiAgICBtb2RlOiBTdHlsaW5nTWFwc1N5bmNNb2RlLCB0YXJnZXRQcm9wOiBzdHJpbmcgfCBudWxsLCBjdXJyZW50TWFwSW5kZXg6IG51bWJlcixcbiAgICBkZWZhdWx0VmFsdWU6IHN0cmluZyB8IGJvb2xlYW4gfCBudWxsKTogYm9vbGVhbiB7XG4gIGNvbnN0IHRvdGFsTWFwcyA9IGdldFZhbHVlc0NvdW50KGNvbnRleHQpIC0gMTsgIC8vIG1hcHMgaGF2ZSBubyBkZWZhdWx0IHZhbHVlXG4gIGNvbnN0IG1hcHNMaW1pdCA9IHRvdGFsTWFwcyAtIDE7XG4gIGNvbnN0IHJlY3Vyc2VJbm5lck1hcHMgPVxuICAgICAgY3VycmVudE1hcEluZGV4IDwgbWFwc0xpbWl0ICYmIChtb2RlICYgU3R5bGluZ01hcHNTeW5jTW9kZS5SZWN1cnNlSW5uZXJNYXBzKSAhPT0gMDtcbiAgY29uc3QgY2hlY2tWYWx1ZXNPbmx5ID0gKG1vZGUgJiBTdHlsaW5nTWFwc1N5bmNNb2RlLkNoZWNrVmFsdWVzT25seSkgIT09IDA7XG5cbiAgaWYgKGNoZWNrVmFsdWVzT25seSkge1xuICAgIC8vIGlubmVyIG1vZGVzIGRvIG5vdCBjaGVjayB2YWx1ZXMgZXZlciAodGhhdCBjYW4gb25seSBoYXBwZW5cbiAgICAvLyB3aGVuIHNvdXJjZUluZGV4ID09PSAwKVxuICAgIG1vZGUgJj0gflN0eWxpbmdNYXBzU3luY01vZGUuQ2hlY2tWYWx1ZXNPbmx5O1xuICB9XG5cbiAgbGV0IHRhcmdldFByb3BWYWx1ZVdhc0FwcGxpZWQgPSBmYWxzZTtcbiAgaWYgKGN1cnJlbnRNYXBJbmRleCA8PSBtYXBzTGltaXQpIHtcbiAgICBsZXQgY3Vyc29yID0gZ2V0Q3VycmVudFN5bmNDdXJzb3IoY3VycmVudE1hcEluZGV4KTtcbiAgICBjb25zdCBiaW5kaW5nSW5kZXggPSBnZXRCaW5kaW5nVmFsdWUoXG4gICAgICAgIGNvbnRleHQsIFRTdHlsaW5nQ29udGV4dEluZGV4LlZhbHVlc1N0YXJ0UG9zaXRpb24sIGN1cnJlbnRNYXBJbmRleCkgYXMgbnVtYmVyO1xuICAgIGNvbnN0IHN0eWxpbmdNYXBBcnIgPSBnZXRWYWx1ZTxTdHlsaW5nTWFwQXJyYXk+KGRhdGEsIGJpbmRpbmdJbmRleCk7XG5cbiAgICBpZiAoc3R5bGluZ01hcEFycikge1xuICAgICAgd2hpbGUgKGN1cnNvciA8IHN0eWxpbmdNYXBBcnIubGVuZ3RoKSB7XG4gICAgICAgIGNvbnN0IHByb3AgPSBnZXRNYXBQcm9wKHN0eWxpbmdNYXBBcnIsIGN1cnNvcik7XG4gICAgICAgIGNvbnN0IGl0ZXJhdGVkVG9vRmFyID0gdGFyZ2V0UHJvcCAmJiBwcm9wID4gdGFyZ2V0UHJvcDtcbiAgICAgICAgY29uc3QgaXNUYXJnZXRQcm9wTWF0Y2hlZCA9ICFpdGVyYXRlZFRvb0ZhciAmJiBwcm9wID09PSB0YXJnZXRQcm9wO1xuICAgICAgICBjb25zdCB2YWx1ZSA9IGdldE1hcFZhbHVlKHN0eWxpbmdNYXBBcnIsIGN1cnNvcik7XG4gICAgICAgIGNvbnN0IHZhbHVlSXNEZWZpbmVkID0gaXNTdHlsaW5nVmFsdWVEZWZpbmVkKHZhbHVlKTtcblxuICAgICAgICAvLyB0aGUgcmVjdXJzaXZlIGNvZGUgaXMgZGVzaWduZWQgdG8ga2VlcCBhcHBseWluZyB1bnRpbFxuICAgICAgICAvLyBpdCByZWFjaGVzIG9yIGdvZXMgcGFzdCB0aGUgdGFyZ2V0IHByb3AuIElmIGFuZCB3aGVuXG4gICAgICAgIC8vIHRoaXMgaGFwcGVucyB0aGVuIGl0IHdpbGwgc3RvcCBwcm9jZXNzaW5nIHZhbHVlcywgYnV0XG4gICAgICAgIC8vIGFsbCBvdGhlciBtYXAgdmFsdWVzIG11c3QgYWxzbyBjYXRjaCB1cCB0byB0aGUgc2FtZVxuICAgICAgICAvLyBwb2ludC4gVGhpcyBpcyB3aHkgYSByZWN1cnNpdmUgY2FsbCBpcyBzdGlsbCBpc3N1ZWRcbiAgICAgICAgLy8gZXZlbiBpZiB0aGUgY29kZSBoYXMgaXRlcmF0ZWQgdG9vIGZhci5cbiAgICAgICAgY29uc3QgaW5uZXJNb2RlID1cbiAgICAgICAgICAgIGl0ZXJhdGVkVG9vRmFyID8gbW9kZSA6IHJlc29sdmVJbm5lck1hcE1vZGUobW9kZSwgdmFsdWVJc0RlZmluZWQsIGlzVGFyZ2V0UHJvcE1hdGNoZWQpO1xuXG4gICAgICAgIGNvbnN0IGlubmVyUHJvcCA9IGl0ZXJhdGVkVG9vRmFyID8gdGFyZ2V0UHJvcCA6IHByb3A7XG4gICAgICAgIGxldCB2YWx1ZUFwcGxpZWQgPSByZWN1cnNlSW5uZXJNYXBzID9cbiAgICAgICAgICAgIGlubmVyU3luY1N0eWxpbmdNYXAoXG4gICAgICAgICAgICAgICAgY29udGV4dCwgcmVuZGVyZXIsIGVsZW1lbnQsIGRhdGEsIGFwcGx5U3R5bGluZ0ZuLCBzYW5pdGl6ZXIsIGlubmVyTW9kZSwgaW5uZXJQcm9wLFxuICAgICAgICAgICAgICAgIGN1cnJlbnRNYXBJbmRleCArIDEsIGRlZmF1bHRWYWx1ZSkgOlxuICAgICAgICAgICAgZmFsc2U7XG5cbiAgICAgICAgaWYgKGl0ZXJhdGVkVG9vRmFyKSB7XG4gICAgICAgICAgaWYgKCF0YXJnZXRQcm9wVmFsdWVXYXNBcHBsaWVkKSB7XG4gICAgICAgICAgICB0YXJnZXRQcm9wVmFsdWVXYXNBcHBsaWVkID0gdmFsdWVBcHBsaWVkO1xuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghdmFsdWVBcHBsaWVkICYmIGlzVmFsdWVBbGxvd2VkVG9CZUFwcGxpZWQobW9kZSwgaXNUYXJnZXRQcm9wTWF0Y2hlZCkpIHtcbiAgICAgICAgICB2YWx1ZUFwcGxpZWQgPSB0cnVlO1xuXG4gICAgICAgICAgaWYgKCFjaGVja1ZhbHVlc09ubHkpIHtcbiAgICAgICAgICAgIGNvbnN0IHVzZURlZmF1bHQgPSBpc1RhcmdldFByb3BNYXRjaGVkICYmICF2YWx1ZUlzRGVmaW5lZDtcbiAgICAgICAgICAgIGNvbnN0IGJpbmRpbmdJbmRleFRvQXBwbHkgPSBpc1RhcmdldFByb3BNYXRjaGVkID8gYmluZGluZ0luZGV4IDogbnVsbDtcblxuICAgICAgICAgICAgbGV0IGZpbmFsVmFsdWU6IGFueTtcbiAgICAgICAgICAgIGlmICh1c2VEZWZhdWx0KSB7XG4gICAgICAgICAgICAgIGZpbmFsVmFsdWUgPSBkZWZhdWx0VmFsdWU7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBmaW5hbFZhbHVlID0gc2FuaXRpemVyID9cbiAgICAgICAgICAgICAgICAgIHNhbml0aXplcihwcm9wLCB2YWx1ZSwgU3R5bGVTYW5pdGl6ZU1vZGUuVmFsaWRhdGVBbmRTYW5pdGl6ZSkgOlxuICAgICAgICAgICAgICAgICAgKHZhbHVlID8gdW53cmFwU2FmZVZhbHVlKHZhbHVlKSA6IG51bGwpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBhcHBseVN0eWxpbmdGbihyZW5kZXJlciwgZWxlbWVudCwgcHJvcCwgZmluYWxWYWx1ZSwgYmluZGluZ0luZGV4VG9BcHBseSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdGFyZ2V0UHJvcFZhbHVlV2FzQXBwbGllZCA9IHZhbHVlQXBwbGllZCAmJiBpc1RhcmdldFByb3BNYXRjaGVkO1xuICAgICAgICBjdXJzb3IgKz0gU3R5bGluZ01hcEFycmF5SW5kZXguVHVwbGVTaXplO1xuICAgICAgfVxuICAgICAgc2V0Q3VycmVudFN5bmNDdXJzb3IoY3VycmVudE1hcEluZGV4LCBjdXJzb3IpO1xuXG4gICAgICAvLyB0aGlzIGlzIGEgZmFsbGJhY2sgY2FzZSBpbiB0aGUgZXZlbnQgdGhhdCB0aGUgc3R5bGluZyBtYXAgaXMgYG51bGxgIGZvciB0aGlzXG4gICAgICAvLyBiaW5kaW5nIGJ1dCB0aGVyZSBhcmUgb3RoZXIgbWFwLWJhc2VkIGJpbmRpbmdzIHRoYXQgbmVlZCB0byBiZSBldmFsdWF0ZWRcbiAgICAgIC8vIGFmdGVyd2FyZHMuIElmIHRoZSBgcHJvcGAgdmFsdWUgaXMgZmFsc3kgdGhlbiB0aGUgaW50ZW50aW9uIGlzIHRvIGN5Y2xlXG4gICAgICAvLyB0aHJvdWdoIGFsbCBvZiB0aGUgcHJvcGVydGllcyBpbiB0aGUgcmVtYWluaW5nIG1hcHMgYXMgd2VsbC4gSWYgdGhlIGN1cnJlbnRcbiAgICAgIC8vIHN0eWxpbmcgbWFwIGlzIHRvbyBzaG9ydCB0aGVuIHRoZXJlIGFyZSBubyB2YWx1ZXMgdG8gaXRlcmF0ZSBvdmVyLiBJbiBlaXRoZXJcbiAgICAgIC8vIGNhc2UgdGhlIGZvbGxvdy11cCBtYXBzIG5lZWQgdG8gYmUgaXRlcmF0ZWQgb3Zlci5cbiAgICAgIGlmIChyZWN1cnNlSW5uZXJNYXBzICYmXG4gICAgICAgICAgKHN0eWxpbmdNYXBBcnIubGVuZ3RoID09PSBTdHlsaW5nTWFwQXJyYXlJbmRleC5WYWx1ZXNTdGFydFBvc2l0aW9uIHx8ICF0YXJnZXRQcm9wKSkge1xuICAgICAgICB0YXJnZXRQcm9wVmFsdWVXYXNBcHBsaWVkID0gaW5uZXJTeW5jU3R5bGluZ01hcChcbiAgICAgICAgICAgIGNvbnRleHQsIHJlbmRlcmVyLCBlbGVtZW50LCBkYXRhLCBhcHBseVN0eWxpbmdGbiwgc2FuaXRpemVyLCBtb2RlLCB0YXJnZXRQcm9wLFxuICAgICAgICAgICAgY3VycmVudE1hcEluZGV4ICsgMSwgZGVmYXVsdFZhbHVlKTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKHJlY3Vyc2VJbm5lck1hcHMpIHtcbiAgICAgIHRhcmdldFByb3BWYWx1ZVdhc0FwcGxpZWQgPSBpbm5lclN5bmNTdHlsaW5nTWFwKFxuICAgICAgICAgIGNvbnRleHQsIHJlbmRlcmVyLCBlbGVtZW50LCBkYXRhLCBhcHBseVN0eWxpbmdGbiwgc2FuaXRpemVyLCBtb2RlLCB0YXJnZXRQcm9wLFxuICAgICAgICAgIGN1cnJlbnRNYXBJbmRleCArIDEsIGRlZmF1bHRWYWx1ZSk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHRhcmdldFByb3BWYWx1ZVdhc0FwcGxpZWQ7XG59XG5cbi8qKlxuICogVXNlZCB0byBkZXRlcm1pbmUgdGhlIG1vZGUgZm9yIHRoZSBpbm5lciByZWN1cnNpdmUgY2FsbC5cbiAqXG4gKiBJZiBhbiBpbm5lciBtYXAgaXMgaXRlcmF0ZWQgb24gdGhlbiB0aGlzIGlzIGRvbmUgc28gZm9yIG9uZVxuICogb2YgdHdvIHJlYXNvbnM6XG4gKlxuICogLSB2YWx1ZSBpcyBiZWluZyBhcHBsaWVkOlxuICogICBpZiB0aGUgdmFsdWUgaXMgYmVpbmcgYXBwbGllZCBmcm9tIHRoaXMgY3VycmVudCBzdHlsaW5nXG4gKiAgIG1hcCB0aGVuIHRoZXJlIGlzIG5vIG5lZWQgdG8gYXBwbHkgaXQgaW4gYSBkZWVwZXIgbWFwXG4gKiAgIChpLmUuIHRoZSBgU2tpcFRhcmdldFByb3BgIGZsYWcgaXMgc2V0KVxuICpcbiAqIC0gdmFsdWUgaXMgYmVpbmcgbm90IGFwcGxpZWQ6XG4gKiAgIGFwcGx5IHRoZSB2YWx1ZSBpZiBpdCBpcyBmb3VuZCBpbiBhIGRlZXBlciBtYXAuXG4gKiAgIChpLmUuIHRoZSBgU2tpcFRhcmdldFByb3BgIGZsYWcgaXMgdW5zZXQpXG4gKlxuICogV2hlbiB0aGVzZSByZWFzb25zIGFyZSBlbmNvdW50ZXJlZCB0aGUgZmxhZ3Mgd2lsbCBmb3IgdGhlXG4gKiBpbm5lciBtYXAgbW9kZSB3aWxsIGJlIGNvbmZpZ3VyZWQuXG4gKi9cbmZ1bmN0aW9uIHJlc29sdmVJbm5lck1hcE1vZGUoXG4gICAgY3VycmVudE1vZGU6IG51bWJlciwgdmFsdWVJc0RlZmluZWQ6IGJvb2xlYW4sIGlzVGFyZ2V0UHJvcE1hdGNoZWQ6IGJvb2xlYW4pOiBudW1iZXIge1xuICBsZXQgaW5uZXJNb2RlID0gY3VycmVudE1vZGU7XG5cbiAgLy8gdGhlIHN0YXRlbWVudHMgYmVsb3cgZmlndXJlcyBvdXQgd2hldGhlciBvciBub3QgYW4gaW5uZXIgc3R5bGluZyBtYXBcbiAgLy8gaXMgYWxsb3dlZCB0byBhcHBseSBpdHMgdmFsdWUgb3Igbm90LiBUaGUgbWFpbiB0aGluZyB0byBrZWVwIG5vdGVcbiAgLy8gb2YgaXMgdGhhdCBpZiB0aGUgdGFyZ2V0IHByb3AgaXNuJ3QgbWF0Y2hlZCB0aGVuIGl0cyBleHBlY3RlZCB0aGF0XG4gIC8vIGFsbCB2YWx1ZXMgYmVmb3JlIGl0IGFyZSBhbGxvd2VkIHRvIGJlIGFwcGxpZWQgc28gbG9uZyBhcyBcImFwcGx5IGFsbCB2YWx1ZXNcIlxuICAvLyBpcyBzZXQgdG8gdHJ1ZS5cbiAgY29uc3QgYXBwbHlBbGxWYWx1ZXMgPSBjdXJyZW50TW9kZSAmIFN0eWxpbmdNYXBzU3luY01vZGUuQXBwbHlBbGxWYWx1ZXM7XG4gIGNvbnN0IGFwcGx5VGFyZ2V0UHJvcCA9IGN1cnJlbnRNb2RlICYgU3R5bGluZ01hcHNTeW5jTW9kZS5BcHBseVRhcmdldFByb3A7XG4gIGNvbnN0IGFsbG93SW5uZXJBcHBseSA9XG4gICAgICAhdmFsdWVJc0RlZmluZWQgJiYgKGlzVGFyZ2V0UHJvcE1hdGNoZWQgPyBhcHBseVRhcmdldFByb3AgOiBhcHBseUFsbFZhbHVlcyk7XG5cbiAgaWYgKGFsbG93SW5uZXJBcHBseSkge1xuICAgIC8vIGNhc2UgMTogc2V0IHRoZSBtb2RlIHRvIGFwcGx5IHRoZSB0YXJnZXRlZCBwcm9wIHZhbHVlIGlmIGl0XG4gICAgLy8gZW5kcyB1cCBiZWluZyBlbmNvdW50ZXJlZCBpbiBhbm90aGVyIG1hcCB2YWx1ZVxuICAgIGlubmVyTW9kZSB8PSBTdHlsaW5nTWFwc1N5bmNNb2RlLkFwcGx5VGFyZ2V0UHJvcDtcbiAgICBpbm5lck1vZGUgJj0gflN0eWxpbmdNYXBzU3luY01vZGUuU2tpcFRhcmdldFByb3A7XG4gIH0gZWxzZSB7XG4gICAgLy8gY2FzZSAyOiBzZXQgdGhlIG1vZGUgdG8gc2tpcCB0aGUgdGFyZ2V0ZWQgcHJvcCB2YWx1ZSBpZiBpdFxuICAgIC8vIGVuZHMgdXAgYmVpbmcgZW5jb3VudGVyZWQgaW4gYW5vdGhlciBtYXAgdmFsdWVcbiAgICBpbm5lck1vZGUgfD0gU3R5bGluZ01hcHNTeW5jTW9kZS5Ta2lwVGFyZ2V0UHJvcDtcbiAgICBpbm5lck1vZGUgJj0gflN0eWxpbmdNYXBzU3luY01vZGUuQXBwbHlUYXJnZXRQcm9wO1xuICB9XG5cbiAgcmV0dXJuIGlubmVyTW9kZTtcbn1cblxuLyoqXG4gKiBEZWNpZGVzIHdoZXRoZXIgb3Igbm90IGEgcHJvcC92YWx1ZSBlbnRyeSB3aWxsIGJlIGFwcGxpZWQgdG8gYW4gZWxlbWVudC5cbiAqXG4gKiBUbyBkZXRlcm1pbmUgd2hldGhlciBvciBub3QgYSB2YWx1ZSBpcyB0byBiZSBhcHBsaWVkLFxuICogdGhlIGZvbGxvd2luZyBwcm9jZWR1cmUgaXMgZXZhbHVhdGVkOlxuICpcbiAqIEZpcnN0IGNoZWNrIHRvIHNlZSB0aGUgY3VycmVudCBgbW9kZWAgc3RhdHVzOlxuICogIDEuIElmIHRoZSBtb2RlIHZhbHVlIHBlcm1pdHMgYWxsIHByb3BzIHRvIGJlIGFwcGxpZWQgdGhlbiBhbGxvdy5cbiAqICAgIC0gQnV0IGRvIG5vdCBhbGxvdyBpZiB0aGUgY3VycmVudCBwcm9wIGlzIHNldCB0byBiZSBza2lwcGVkLlxuICogIDIuIE90aGVyd2lzZSBpZiB0aGUgY3VycmVudCBwcm9wIGlzIHBlcm1pdHRlZCB0aGVuIGFsbG93LlxuICovXG5mdW5jdGlvbiBpc1ZhbHVlQWxsb3dlZFRvQmVBcHBsaWVkKG1vZGU6IFN0eWxpbmdNYXBzU3luY01vZGUsIGlzVGFyZ2V0UHJvcE1hdGNoZWQ6IGJvb2xlYW4pIHtcbiAgbGV0IGRvQXBwbHlWYWx1ZSA9IChtb2RlICYgU3R5bGluZ01hcHNTeW5jTW9kZS5BcHBseUFsbFZhbHVlcykgIT09IDA7XG4gIGlmICghZG9BcHBseVZhbHVlKSB7XG4gICAgaWYgKG1vZGUgJiBTdHlsaW5nTWFwc1N5bmNNb2RlLkFwcGx5VGFyZ2V0UHJvcCkge1xuICAgICAgZG9BcHBseVZhbHVlID0gaXNUYXJnZXRQcm9wTWF0Y2hlZDtcbiAgICB9XG4gIH0gZWxzZSBpZiAoKG1vZGUgJiBTdHlsaW5nTWFwc1N5bmNNb2RlLlNraXBUYXJnZXRQcm9wKSAmJiBpc1RhcmdldFByb3BNYXRjaGVkKSB7XG4gICAgZG9BcHBseVZhbHVlID0gZmFsc2U7XG4gIH1cbiAgcmV0dXJuIGRvQXBwbHlWYWx1ZTtcbn1cblxuLyoqXG4gKiBVc2VkIHRvIGtlZXAgdHJhY2sgb2YgY29uY3VycmVudCBjdXJzb3IgdmFsdWVzIGZvciBtdWx0aXBsZSBtYXAtYmFzZWQgc3R5bGluZyBiaW5kaW5ncyBwcmVzZW50IG9uXG4gKiBhbiBlbGVtZW50LlxuICovXG5jb25zdCBNQVBfQ1VSU09SUzogbnVtYmVyW10gPSBbXTtcblxuLyoqXG4gKiBVc2VkIHRvIHJlc2V0IHRoZSBzdGF0ZSBvZiBlYWNoIGN1cnNvciB2YWx1ZSBiZWluZyB1c2VkIHRvIGl0ZXJhdGUgb3ZlciBtYXAtYmFzZWQgc3R5bGluZ1xuICogYmluZGluZ3MuXG4gKi9cbmZ1bmN0aW9uIHJlc2V0U3luY0N1cnNvcnMoKSB7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgTUFQX0NVUlNPUlMubGVuZ3RoOyBpKyspIHtcbiAgICBNQVBfQ1VSU09SU1tpXSA9IFN0eWxpbmdNYXBBcnJheUluZGV4LlZhbHVlc1N0YXJ0UG9zaXRpb247XG4gIH1cbn1cblxuLyoqXG4gKiBSZXR1cm5zIGFuIGFjdGl2ZSBjdXJzb3IgdmFsdWUgYXQgYSBnaXZlbiBtYXBJbmRleCBsb2NhdGlvbi5cbiAqL1xuZnVuY3Rpb24gZ2V0Q3VycmVudFN5bmNDdXJzb3IobWFwSW5kZXg6IG51bWJlcikge1xuICBpZiAobWFwSW5kZXggPj0gTUFQX0NVUlNPUlMubGVuZ3RoKSB7XG4gICAgTUFQX0NVUlNPUlMucHVzaChTdHlsaW5nTWFwQXJyYXlJbmRleC5WYWx1ZXNTdGFydFBvc2l0aW9uKTtcbiAgfVxuICByZXR1cm4gTUFQX0NVUlNPUlNbbWFwSW5kZXhdO1xufVxuXG4vKipcbiAqIFNldHMgYSBjdXJzb3IgdmFsdWUgYXQgYSBnaXZlbiBtYXBJbmRleCBsb2NhdGlvbi5cbiAqL1xuZnVuY3Rpb24gc2V0Q3VycmVudFN5bmNDdXJzb3IobWFwSW5kZXg6IG51bWJlciwgaW5kZXhWYWx1ZTogbnVtYmVyKSB7XG4gIE1BUF9DVVJTT1JTW21hcEluZGV4XSA9IGluZGV4VmFsdWU7XG59XG4iXX0=