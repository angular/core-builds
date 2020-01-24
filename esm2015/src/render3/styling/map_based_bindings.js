/**
 * @fileoverview added by tsickle
 * Generated from: packages/core/src/render3/styling/map_based_bindings.ts
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFwX2Jhc2VkX2JpbmRpbmdzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9zdHlsaW5nL21hcF9iYXNlZF9iaW5kaW5ncy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFPQSxPQUFPLEVBQUMsZUFBZSxFQUFDLE1BQU0sMkJBQTJCLENBQUM7QUFJMUQsT0FBTyxFQUFDLGVBQWUsRUFBRSxVQUFVLEVBQUUsV0FBVyxFQUFFLFFBQVEsRUFBRSxjQUFjLEVBQUUscUJBQXFCLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUVoSSxPQUFPLEVBQUMsb0JBQW9CLEVBQUMsTUFBTSxZQUFZLENBQUM7Ozs7Ozs7Ozs7Ozs7QUFlaEQsTUFBTSxVQUFVLHlCQUF5QjtJQUN2QyxvQkFBb0IsQ0FBQyxjQUFjLENBQUMsQ0FBQztBQUN2QyxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBa0ZELE1BQU0sT0FBTyxjQUFjOzs7Ozs7Ozs7Ozs7O0FBQ3ZCLENBQUMsT0FBd0IsRUFBRSxRQUFnRCxFQUFFLE9BQWlCLEVBQzdGLElBQWtCLEVBQUUsV0FBbUIsRUFBRSxjQUE4QixFQUN2RSxTQUFpQyxFQUFFLElBQXlCLEVBQUUsVUFBMEIsRUFDeEYsWUFBc0MsRUFBVyxFQUFFOztRQUM5Qyx5QkFBeUIsR0FBRyxLQUFLOzs7O1VBSS9CLFNBQVMsR0FBRyxjQUFjLENBQUMsT0FBTyxDQUFDO0lBQ3pDLElBQUksU0FBUyxFQUFFOztZQUNULG1CQUFtQixHQUFHLElBQUk7O2NBQ3hCLFlBQVksR0FBRyxDQUFDLFVBQVU7UUFFaEMscUVBQXFFO1FBQ3JFLHNFQUFzRTtRQUN0RSxxRUFBcUU7UUFDckUsNkJBQTZCO1FBQzdCLElBQUksWUFBWSxJQUFJLENB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QkFBbUIsQ0FBQztTQUNwQztLQUNGO1NBQU0sSUFBSSxDQUFDLElBQUkseUJBQXFDLENBQUMsSUFBSSxtQkFBbUIsRUFBRTtRQUM3RSxZQUFZLEdBQUcsS0FBSyxDQUFDO0tBQ3RCO0lBQ0QsT0FBTyxZQUFZLENBQUM7QUFDdEIsQ0FBQzs7Ozs7O01BTUssV0FBVyxHQUFhLEVBQUU7Ozs7OztBQU1oQyxTQUFTLGdCQUFnQjtJQUN2QixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsV0FBVyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtRQUMzQyxXQUFXLENBQUMsQ0FBQyxDQUFDLDhCQUEyQyxDQUFDO0tBQzNEO0FBQ0gsQ0FBQzs7Ozs7O0FBS0QsU0FBUyxvQkFBb0IsQ0FBQyxRQUFnQjtJQUM1QyxJQUFJLFFBQVEsSUFBSSxXQUFXLENBQUMsTUFBTSxFQUFFO1FBQ2xDLFdBQVcsQ0FBQyxJQUFJLDZCQUEwQyxDQUFDO0tBQzVEO0lBQ0QsT0FBTyxXQUFXLENBQUMsUUFBUSxDQUFDLENBQUM7QUFDL0IsQ0FBQzs7Ozs7OztBQUtELFNBQVMsb0JBQW9CLENBQUMsUUFBZ0IsRUFBRSxVQUFrQjtJQUNoRSxXQUFXLENBQUMsUUFBUSxDQUFDLEdBQUcsVUFBVSxDQUFDO0FBQ3JDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiogQGxpY2Vuc2VcbiogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4qXG4qIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4qIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiovXG5pbXBvcnQge3Vud3JhcFNhZmVWYWx1ZX0gZnJvbSAnLi4vLi4vc2FuaXRpemF0aW9uL2J5cGFzcyc7XG5pbXBvcnQge1N0eWxlU2FuaXRpemVGbiwgU3R5bGVTYW5pdGl6ZU1vZGV9IGZyb20gJy4uLy4uL3Nhbml0aXphdGlvbi9zdHlsZV9zYW5pdGl6ZXInO1xuaW1wb3J0IHtQcm9jZWR1cmFsUmVuZGVyZXIzLCBSRWxlbWVudCwgUmVuZGVyZXIzfSBmcm9tICcuLi9pbnRlcmZhY2VzL3JlbmRlcmVyJztcbmltcG9ydCB7QXBwbHlTdHlsaW5nRm4sIExTdHlsaW5nRGF0YSwgU3R5bGluZ01hcEFycmF5LCBTdHlsaW5nTWFwQXJyYXlJbmRleCwgU3R5bGluZ01hcHNTeW5jTW9kZSwgU3luY1N0eWxpbmdNYXBzRm4sIFRTdHlsaW5nQ29udGV4dCwgVFN0eWxpbmdDb250ZXh0SW5kZXh9IGZyb20gJy4uL2ludGVyZmFjZXMvc3R5bGluZyc7XG5pbXBvcnQge2dldEJpbmRpbmdWYWx1ZSwgZ2V0TWFwUHJvcCwgZ2V0TWFwVmFsdWUsIGdldFZhbHVlLCBnZXRWYWx1ZXNDb3VudCwgaXNTdHlsaW5nVmFsdWVEZWZpbmVkfSBmcm9tICcuLi91dGlsL3N0eWxpbmdfdXRpbHMnO1xuXG5pbXBvcnQge3NldFN0eWxpbmdNYXBzU3luY0ZufSBmcm9tICcuL2JpbmRpbmdzJztcblxuXG4vKipcbiAqIC0tLS0tLS0tXG4gKlxuICogVGhpcyBmaWxlIGNvbnRhaW5zIHRoZSBhbGdvcml0aG0gbG9naWMgZm9yIGFwcGx5aW5nIG1hcC1iYXNlZCBiaW5kaW5nc1xuICogc3VjaCBhcyBgW3N0eWxlXWAgYW5kIGBbY2xhc3NdYC5cbiAqXG4gKiAtLS0tLS0tLVxuICovXG5cbi8qKlxuICogRW5hYmxlcyBzdXBwb3J0IGZvciBtYXAtYmFzZWQgc3R5bGluZyBiaW5kaW5ncyAoZS5nLiBgW3N0eWxlXWAgYW5kIGBbY2xhc3NdYCBiaW5kaW5ncykuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhY3RpdmF0ZVN0eWxpbmdNYXBGZWF0dXJlKCkge1xuICBzZXRTdHlsaW5nTWFwc1N5bmNGbihzeW5jU3R5bGluZ01hcCk7XG59XG5cbi8qKlxuICogVXNlZCB0byBhcHBseSBzdHlsaW5nIHZhbHVlcyBwcmVzZW50bHkgd2l0aGluIGFueSBtYXAtYmFzZWQgYmluZGluZ3Mgb24gYW4gZWxlbWVudC5cbiAqXG4gKiBBbmd1bGFyIHN1cHBvcnRzIG1hcC1iYXNlZCBzdHlsaW5nIGJpbmRpbmdzIHdoaWNoIGNhbiBiZSBhcHBsaWVkIHZpYSB0aGVcbiAqIGBbc3R5bGVdYCBhbmQgYFtjbGFzc11gIGJpbmRpbmdzIHdoaWNoIGNhbiBiZSBwbGFjZWQgb24gYW55IEhUTUwgZWxlbWVudC5cbiAqIFRoZXNlIGJpbmRpbmdzIGNhbiB3b3JrIGluZGVwZW5kZW50bHksIHRvZ2V0aGVyIG9yIGFsb25nc2lkZSBwcm9wLWJhc2VkXG4gKiBzdHlsaW5nIGJpbmRpbmdzIChlLmcuIGA8ZGl2IFtzdHlsZV09XCJ4XCIgW3N0eWxlLndpZHRoXT1cIndcIj5gKS5cbiAqXG4gKiBJZiBhIG1hcC1iYXNlZCBzdHlsaW5nIGJpbmRpbmcgaXMgZGV0ZWN0ZWQgYnkgdGhlIGNvbXBpbGVyLCB0aGUgZm9sbG93aW5nXG4gKiBBT1QgY29kZSBpcyBwcm9kdWNlZDpcbiAqXG4gKiBgYGB0eXBlc2NyaXB0XG4gKiBzdHlsZU1hcChjdHguc3R5bGVzKTsgLy8gc3R5bGVzID0ge2tleTp2YWx1ZX1cbiAqIGNsYXNzTWFwKGN0eC5jbGFzc2VzKTsgLy8gY2xhc3NlcyA9IHtrZXk6dmFsdWV9fHN0cmluZ1xuICogYGBgXG4gKlxuICogSWYgYW5kIHdoZW4gZWl0aGVyIG9mIHRoZSBpbnN0cnVjdGlvbnMgYWJvdmUgYXJlIGV2YWx1YXRlZCwgdGhlbiB0aGUgY29kZVxuICogcHJlc2VudCBpbiB0aGlzIGZpbGUgaXMgaW5jbHVkZWQgaW50byB0aGUgYnVuZGxlLiBUaGUgbWVjaGFuaXNtIHVzZWQsIHRvXG4gKiBhY3RpdmF0ZSBzdXBwb3J0IGZvciBtYXAtYmFzZWQgYmluZGluZ3MgYXQgcnVudGltZSBpcyBwb3NzaWJsZSB2aWEgdGhlXG4gKiBgYWN0aXZlU3R5bGluZ01hcEZlYXR1cmVgIGZ1bmN0aW9uICh3aGljaCBpcyBhbHNvIHByZXNlbnQgaW4gdGhpcyBmaWxlKS5cbiAqXG4gKiAjIFRoZSBBbGdvcml0aG1cbiAqIFdoZW5ldmVyIGEgbWFwLWJhc2VkIGJpbmRpbmcgdXBkYXRlcyAod2hpY2ggaXMgd2hlbiB0aGUgaWRlbnRpdHkgb2YgdGhlXG4gKiBtYXAtdmFsdWUgY2hhbmdlcykgdGhlbiB0aGUgbWFwIGlzIGl0ZXJhdGVkIG92ZXIgYW5kIGEgYFN0eWxpbmdNYXBBcnJheWAgYXJyYXlcbiAqIGlzIHByb2R1Y2VkLiBUaGUgYFN0eWxpbmdNYXBBcnJheWAgaW5zdGFuY2UgaXMgc3RvcmVkIGluIHRoZSBiaW5kaW5nIGxvY2F0aW9uXG4gKiB3aGVyZSB0aGUgYEJJTkRJTkdfSU5ERVhgIGlzIHNpdHVhdGVkIHdoZW4gdGhlIGBzdHlsZU1hcCgpYCBvciBgY2xhc3NNYXAoKWBcbiAqIGluc3RydWN0aW9uIHdlcmUgY2FsbGVkLiBPbmNlIHRoZSBiaW5kaW5nIGNoYW5nZXMsIHRoZW4gdGhlIGludGVybmFsIGBiaXRNYXNrYFxuICogdmFsdWUgaXMgbWFya2VkIGFzIGRpcnR5LlxuICpcbiAqIFN0eWxpbmcgdmFsdWVzIGFyZSBhcHBsaWVkIG9uY2UgQ0QgZXhpdHMgdGhlIGVsZW1lbnQgKHdoaWNoIGhhcHBlbnMgd2hlblxuICogdGhlIGBhZHZhbmNlKG4pYCBpbnN0cnVjdGlvbiBpcyBjYWxsZWQgb3IgdGhlIHRlbXBsYXRlIGZ1bmN0aW9uIGV4aXRzKS4gV2hlblxuICogdGhpcyBvY2N1cnMsIGFsbCBwcm9wLWJhc2VkIGJpbmRpbmdzIGFyZSBhcHBsaWVkLiBJZiBhIG1hcC1iYXNlZCBiaW5kaW5nIGlzXG4gKiBwcmVzZW50IHRoZW4gYSBzcGVjaWFsIGZsdXNoaW5nIGZ1bmN0aW9uIChjYWxsZWQgYSBzeW5jIGZ1bmN0aW9uKSBpcyBtYWRlXG4gKiBhdmFpbGFibGUgYW5kIGl0IHdpbGwgYmUgY2FsbGVkIGVhY2ggdGltZSBhIHN0eWxpbmcgcHJvcGVydHkgaXMgZmx1c2hlZC5cbiAqXG4gKiBUaGUgZmx1c2hpbmcgYWxnb3JpdGhtIGlzIGRlc2lnbmVkIHRvIGFwcGx5IHN0eWxpbmcgZm9yIGEgcHJvcGVydHkgKHdoaWNoIGlzXG4gKiBhIENTUyBwcm9wZXJ0eSBvciBhIGNsYXNzTmFtZSB2YWx1ZSkgb25lIGJ5IG9uZS4gSWYgbWFwLWJhc2VkIGJpbmRpbmdzXG4gKiBhcmUgcHJlc2VudCwgdGhlbiB0aGUgZmx1c2hpbmcgYWxnb3JpdGhtIHdpbGwga2VlcCBjYWxsaW5nIHRoZSBtYXBzIHN0eWxpbmdcbiAqIHN5bmMgZnVuY3Rpb24gZWFjaCB0aW1lIGEgcHJvcGVydHkgaXMgdmlzaXRlZC4gVGhpcyB3YXksIHRoZSBmbHVzaGluZ1xuICogYmVoYXZpb3Igb2YgbWFwLWJhc2VkIGJpbmRpbmdzIHdpbGwgYWx3YXlzIGJlIGF0IHRoZSBzYW1lIHByb3BlcnR5IGxldmVsXG4gKiBhcyB0aGUgY3VycmVudCBwcm9wLWJhc2VkIHByb3BlcnR5IGJlaW5nIGl0ZXJhdGVkIG92ZXIgKGJlY2F1c2UgZXZlcnl0aGluZ1xuICogaXMgYWxwaGFiZXRpY2FsbHkgc29ydGVkKS5cbiAqXG4gKiBMZXQncyBpbWFnaW5lIHdlIGhhdmUgdGhlIGZvbGxvd2luZyBIVE1MIHRlbXBsYXRlIGNvZGU6XG4gKlxuICogYGBgaHRtbFxuICogPGRpdiBbc3R5bGVdPVwie3dpZHRoOicxMDBweCcsIGhlaWdodDonMjAwcHgnLCAnei1pbmRleCc6JzEwJ31cIlxuICogICAgICBbc3R5bGUud2lkdGgucHhdPVwiMjAwXCI+Li4uPC9kaXY+XG4gKiBgYGBcbiAqXG4gKiBXaGVuIENEIG9jY3VycywgYm90aCB0aGUgYFtzdHlsZV1gIGFuZCBgW3N0eWxlLndpZHRoXWAgYmluZGluZ3NcbiAqIGFyZSBldmFsdWF0ZWQuIFRoZW4gd2hlbiB0aGUgc3R5bGVzIGFyZSBmbHVzaGVkIG9uIHNjcmVlbiwgdGhlXG4gKiBmb2xsb3dpbmcgb3BlcmF0aW9ucyBoYXBwZW46XG4gKlxuICogMS4gYFtzdHlsZS53aWR0aF1gIGlzIGF0dGVtcHRlZCB0byBiZSB3cml0dGVuIHRvIHRoZSBlbGVtZW50LlxuICpcbiAqIDIuICBPbmNlIHRoYXQgaGFwcGVucywgdGhlIGFsZ29yaXRobSBpbnN0cnVjdHMgdGhlIG1hcC1iYXNlZFxuICogICAgIGVudHJpZXMgKGBbc3R5bGVdYCBpbiB0aGlzIGNhc2UpIHRvIFwiY2F0Y2ggdXBcIiBhbmQgYXBwbHlcbiAqICAgICBhbGwgdmFsdWVzIHVwIHRvIHRoZSBgd2lkdGhgIHZhbHVlLiBXaGVuIHRoaXMgaGFwcGVucyB0aGVcbiAqICAgICBgaGVpZ2h0YCB2YWx1ZSBpcyBhcHBsaWVkIHRvIHRoZSBlbGVtZW50IChzaW5jZSBpdCBpc1xuICogICAgIGFscGhhYmV0aWNhbGx5IHNpdHVhdGVkIGJlZm9yZSB0aGUgYHdpZHRoYCBwcm9wZXJ0eSkuXG4gKlxuICogMy4gU2luY2UgdGhlcmUgYXJlIG5vIG1vcmUgcHJvcC1iYXNlZCBlbnRyaWVzIGFueW1vcmUsIHRoZVxuICogICAgbG9vcCBleGl0cyBhbmQgdGhlbiwganVzdCBiZWZvcmUgdGhlIGZsdXNoaW5nIGVuZHMsIGl0XG4gKiAgICBpbnN0cnVjdHMgYWxsIG1hcC1iYXNlZCBiaW5kaW5ncyB0byBcImZpbmlzaCB1cFwiIGFwcGx5aW5nXG4gKiAgICB0aGVpciB2YWx1ZXMuXG4gKlxuICogNC4gVGhlIG9ubHkgcmVtYWluaW5nIHZhbHVlIHdpdGhpbiB0aGUgbWFwLWJhc2VkIGVudHJpZXMgaXNcbiAqICAgIHRoZSBgei1pbmRleGAgdmFsdWUgKGB3aWR0aGAgZ290IHNraXBwZWQgYmVjYXVzZSBpdCB3YXNcbiAqICAgIHN1Y2Nlc3NmdWxseSBhcHBsaWVkIHZpYSB0aGUgcHJvcC1iYXNlZCBgW3N0eWxlLndpZHRoXWBcbiAqICAgIGJpbmRpbmcpLiBTaW5jZSBhbGwgbWFwLWJhc2VkIGVudHJpZXMgYXJlIHRvbGQgdG8gXCJmaW5pc2ggdXBcIixcbiAqICAgIHRoZSBgei1pbmRleGAgdmFsdWUgaXMgaXRlcmF0ZWQgb3ZlciBhbmQgaXQgaXMgdGhlbiBhcHBsaWVkXG4gKiAgICB0byB0aGUgZWxlbWVudC5cbiAqXG4gKiBUaGUgbW9zdCBpbXBvcnRhbnQgdGhpbmcgdG8gdGFrZSBub3RlIG9mIGhlcmUgaXMgdGhhdCBwcm9wLWJhc2VkXG4gKiBiaW5kaW5ncyBhcmUgZXZhbHVhdGVkIGluIG9yZGVyIGFsb25nc2lkZSBtYXAtYmFzZWQgYmluZGluZ3MuXG4gKiBUaGlzIGFsbG93cyBhbGwgc3R5bGluZyBhY3Jvc3MgYW4gZWxlbWVudCB0byBiZSBhcHBsaWVkIGluIE8obilcbiAqIHRpbWUgKGEgc2ltaWxhciBhbGdvcml0aG0gaXMgdGhhdCBvZiB0aGUgYXJyYXkgbWVyZ2UgYWxnb3JpdGhtXG4gKiBpbiBtZXJnZSBzb3J0KS5cbiAqL1xuZXhwb3J0IGNvbnN0IHN5bmNTdHlsaW5nTWFwOiBTeW5jU3R5bGluZ01hcHNGbiA9XG4gICAgKGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCwgcmVuZGVyZXI6IFJlbmRlcmVyMyB8IFByb2NlZHVyYWxSZW5kZXJlcjMgfCBudWxsLCBlbGVtZW50OiBSRWxlbWVudCxcbiAgICAgZGF0YTogTFN0eWxpbmdEYXRhLCBzb3VyY2VJbmRleDogbnVtYmVyLCBhcHBseVN0eWxpbmdGbjogQXBwbHlTdHlsaW5nRm4sXG4gICAgIHNhbml0aXplcjogU3R5bGVTYW5pdGl6ZUZuIHwgbnVsbCwgbW9kZTogU3R5bGluZ01hcHNTeW5jTW9kZSwgdGFyZ2V0UHJvcD86IHN0cmluZyB8IG51bGwsXG4gICAgIGRlZmF1bHRWYWx1ZT86IHN0cmluZyB8IGJvb2xlYW4gfCBudWxsKTogYm9vbGVhbiA9PiB7XG4gICAgICBsZXQgdGFyZ2V0UHJvcFZhbHVlV2FzQXBwbGllZCA9IGZhbHNlO1xuXG4gICAgICAvLyBvbmNlIHRoZSBtYXAtYmFzZWQgc3R5bGluZyBjb2RlIGlzIGFjdGl2YXRlIGl0IGlzIG5ldmVyIGRlYWN0aXZhdGVkLiBGb3IgdGhpcyByZWFzb24gYVxuICAgICAgLy8gY2hlY2sgdG8gc2VlIGlmIHRoZSBjdXJyZW50IHN0eWxpbmcgY29udGV4dCBoYXMgYW55IG1hcCBiYXNlZCBiaW5kaW5ncyBpcyByZXF1aXJlZC5cbiAgICAgIGNvbnN0IHRvdGFsTWFwcyA9IGdldFZhbHVlc0NvdW50KGNvbnRleHQpO1xuICAgICAgaWYgKHRvdGFsTWFwcykge1xuICAgICAgICBsZXQgcnVuVGhlU3luY0FsZ29yaXRobSA9IHRydWU7XG4gICAgICAgIGNvbnN0IGxvb3BVbnRpbEVuZCA9ICF0YXJnZXRQcm9wO1xuXG4gICAgICAgIC8vIElmIHRoZSBjb2RlIGlzIHRvbGQgdG8gZmluaXNoIHVwIChydW4gdW50aWwgdGhlIGVuZCksIGJ1dCB0aGUgbW9kZVxuICAgICAgICAvLyBoYXNuJ3QgYmVlbiBmbGFnZ2VkIHRvIGFwcGx5IHZhbHVlcyAoaXQgb25seSB0cmF2ZXJzZXMgdmFsdWVzKSB0aGVuXG4gICAgICAgIC8vIHRoZXJlIGlzIG5vIHBvaW50IGluIGl0ZXJhdGluZyBvdmVyIHRoZSBhcnJheSBiZWNhdXNlIG5vdGhpbmcgd2lsbFxuICAgICAgICAvLyBiZSBhcHBsaWVkIHRvIHRoZSBlbGVtZW50LlxuICAgICAgICBpZiAobG9vcFVudGlsRW5kICYmIChtb2RlICYgU3R5bGluZ01hcHNTeW5jTW9kZS5BcHBseUFsbFZhbHVlcykgPT09IDApIHtcbiAgICAgICAgICBydW5UaGVTeW5jQWxnb3JpdGhtID0gZmFsc2U7XG4gICAgICAgICAgdGFyZ2V0UHJvcFZhbHVlV2FzQXBwbGllZCA9IHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAocnVuVGhlU3luY0FsZ29yaXRobSkge1xuICAgICAgICAgIHRhcmdldFByb3BWYWx1ZVdhc0FwcGxpZWQgPSBpbm5lclN5bmNTdHlsaW5nTWFwKFxuICAgICAgICAgICAgICBjb250ZXh0LCByZW5kZXJlciwgZWxlbWVudCwgZGF0YSwgYXBwbHlTdHlsaW5nRm4sIHNhbml0aXplciwgbW9kZSwgdGFyZ2V0UHJvcCB8fCBudWxsLFxuICAgICAgICAgICAgICBzb3VyY2VJbmRleCwgZGVmYXVsdFZhbHVlIHx8IG51bGwpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGxvb3BVbnRpbEVuZCkge1xuICAgICAgICAgIHJlc2V0U3luY0N1cnNvcnMoKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gdGFyZ2V0UHJvcFZhbHVlV2FzQXBwbGllZDtcbiAgICB9O1xuXG4vKipcbiAqIFJlY3Vyc2l2ZSBmdW5jdGlvbiBkZXNpZ25lZCB0byBhcHBseSBtYXAtYmFzZWQgc3R5bGluZyB0byBhbiBlbGVtZW50IG9uZSBtYXAgYXQgYSB0aW1lLlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gaXMgZGVzaWduZWQgdG8gYmUgY2FsbGVkIGZyb20gdGhlIGBzeW5jU3R5bGluZ01hcGAgZnVuY3Rpb24gYW5kIHdpbGxcbiAqIGFwcGx5IG1hcC1iYXNlZCBzdHlsaW5nIGRhdGEgb25lIG1hcCBhdCBhIHRpbWUgdG8gdGhlIHByb3ZpZGVkIGBlbGVtZW50YC5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIGlzIHJlY3Vyc2l2ZSBhbmQgaXQgd2lsbCBjYWxsIGl0c2VsZiBpZiBhIGZvbGxvdy11cCBtYXAgdmFsdWUgaXMgdG8gYmVcbiAqIHByb2Nlc3NlZC4gVG8gbGVhcm4gbW9yZSBhYm91dCBob3cgdGhlIGFsZ29yaXRobSB3b3Jrcywgc2VlIGBzeW5jU3R5bGluZ01hcGAuXG4gKi9cbmZ1bmN0aW9uIGlubmVyU3luY1N0eWxpbmdNYXAoXG4gICAgY29udGV4dDogVFN0eWxpbmdDb250ZXh0LCByZW5kZXJlcjogUmVuZGVyZXIzIHwgUHJvY2VkdXJhbFJlbmRlcmVyMyB8IG51bGwsIGVsZW1lbnQ6IFJFbGVtZW50LFxuICAgIGRhdGE6IExTdHlsaW5nRGF0YSwgYXBwbHlTdHlsaW5nRm46IEFwcGx5U3R5bGluZ0ZuLCBzYW5pdGl6ZXI6IFN0eWxlU2FuaXRpemVGbiB8IG51bGwsXG4gICAgbW9kZTogU3R5bGluZ01hcHNTeW5jTW9kZSwgdGFyZ2V0UHJvcDogc3RyaW5nIHwgbnVsbCwgY3VycmVudE1hcEluZGV4OiBudW1iZXIsXG4gICAgZGVmYXVsdFZhbHVlOiBzdHJpbmcgfCBib29sZWFuIHwgbnVsbCk6IGJvb2xlYW4ge1xuICBjb25zdCB0b3RhbE1hcHMgPSBnZXRWYWx1ZXNDb3VudChjb250ZXh0KSAtIDE7ICAvLyBtYXBzIGhhdmUgbm8gZGVmYXVsdCB2YWx1ZVxuICBjb25zdCBtYXBzTGltaXQgPSB0b3RhbE1hcHMgLSAxO1xuICBjb25zdCByZWN1cnNlSW5uZXJNYXBzID1cbiAgICAgIGN1cnJlbnRNYXBJbmRleCA8IG1hcHNMaW1pdCAmJiAobW9kZSAmIFN0eWxpbmdNYXBzU3luY01vZGUuUmVjdXJzZUlubmVyTWFwcykgIT09IDA7XG4gIGNvbnN0IGNoZWNrVmFsdWVzT25seSA9IChtb2RlICYgU3R5bGluZ01hcHNTeW5jTW9kZS5DaGVja1ZhbHVlc09ubHkpICE9PSAwO1xuXG4gIGlmIChjaGVja1ZhbHVlc09ubHkpIHtcbiAgICAvLyBpbm5lciBtb2RlcyBkbyBub3QgY2hlY2sgdmFsdWVzIGV2ZXIgKHRoYXQgY2FuIG9ubHkgaGFwcGVuXG4gICAgLy8gd2hlbiBzb3VyY2VJbmRleCA9PT0gMClcbiAgICBtb2RlICY9IH5TdHlsaW5nTWFwc1N5bmNNb2RlLkNoZWNrVmFsdWVzT25seTtcbiAgfVxuXG4gIGxldCB0YXJnZXRQcm9wVmFsdWVXYXNBcHBsaWVkID0gZmFsc2U7XG4gIGlmIChjdXJyZW50TWFwSW5kZXggPD0gbWFwc0xpbWl0KSB7XG4gICAgbGV0IGN1cnNvciA9IGdldEN1cnJlbnRTeW5jQ3Vyc29yKGN1cnJlbnRNYXBJbmRleCk7XG4gICAgY29uc3QgYmluZGluZ0luZGV4ID0gZ2V0QmluZGluZ1ZhbHVlKFxuICAgICAgICBjb250ZXh0LCBUU3R5bGluZ0NvbnRleHRJbmRleC5WYWx1ZXNTdGFydFBvc2l0aW9uLCBjdXJyZW50TWFwSW5kZXgpIGFzIG51bWJlcjtcbiAgICBjb25zdCBzdHlsaW5nTWFwQXJyID0gZ2V0VmFsdWU8U3R5bGluZ01hcEFycmF5PihkYXRhLCBiaW5kaW5nSW5kZXgpO1xuXG4gICAgaWYgKHN0eWxpbmdNYXBBcnIpIHtcbiAgICAgIHdoaWxlIChjdXJzb3IgPCBzdHlsaW5nTWFwQXJyLmxlbmd0aCkge1xuICAgICAgICBjb25zdCBwcm9wID0gZ2V0TWFwUHJvcChzdHlsaW5nTWFwQXJyLCBjdXJzb3IpO1xuICAgICAgICBjb25zdCBpdGVyYXRlZFRvb0ZhciA9IHRhcmdldFByb3AgJiYgcHJvcCA+IHRhcmdldFByb3A7XG4gICAgICAgIGNvbnN0IGlzVGFyZ2V0UHJvcE1hdGNoZWQgPSAhaXRlcmF0ZWRUb29GYXIgJiYgcHJvcCA9PT0gdGFyZ2V0UHJvcDtcbiAgICAgICAgY29uc3QgdmFsdWUgPSBnZXRNYXBWYWx1ZShzdHlsaW5nTWFwQXJyLCBjdXJzb3IpO1xuICAgICAgICBjb25zdCB2YWx1ZUlzRGVmaW5lZCA9IGlzU3R5bGluZ1ZhbHVlRGVmaW5lZCh2YWx1ZSk7XG5cbiAgICAgICAgLy8gdGhlIHJlY3Vyc2l2ZSBjb2RlIGlzIGRlc2lnbmVkIHRvIGtlZXAgYXBwbHlpbmcgdW50aWxcbiAgICAgICAgLy8gaXQgcmVhY2hlcyBvciBnb2VzIHBhc3QgdGhlIHRhcmdldCBwcm9wLiBJZiBhbmQgd2hlblxuICAgICAgICAvLyB0aGlzIGhhcHBlbnMgdGhlbiBpdCB3aWxsIHN0b3AgcHJvY2Vzc2luZyB2YWx1ZXMsIGJ1dFxuICAgICAgICAvLyBhbGwgb3RoZXIgbWFwIHZhbHVlcyBtdXN0IGFsc28gY2F0Y2ggdXAgdG8gdGhlIHNhbWVcbiAgICAgICAgLy8gcG9pbnQuIFRoaXMgaXMgd2h5IGEgcmVjdXJzaXZlIGNhbGwgaXMgc3RpbGwgaXNzdWVkXG4gICAgICAgIC8vIGV2ZW4gaWYgdGhlIGNvZGUgaGFzIGl0ZXJhdGVkIHRvbyBmYXIuXG4gICAgICAgIGNvbnN0IGlubmVyTW9kZSA9XG4gICAgICAgICAgICBpdGVyYXRlZFRvb0ZhciA/IG1vZGUgOiByZXNvbHZlSW5uZXJNYXBNb2RlKG1vZGUsIHZhbHVlSXNEZWZpbmVkLCBpc1RhcmdldFByb3BNYXRjaGVkKTtcblxuICAgICAgICBjb25zdCBpbm5lclByb3AgPSBpdGVyYXRlZFRvb0ZhciA/IHRhcmdldFByb3AgOiBwcm9wO1xuICAgICAgICBsZXQgdmFsdWVBcHBsaWVkID0gcmVjdXJzZUlubmVyTWFwcyA/XG4gICAgICAgICAgICBpbm5lclN5bmNTdHlsaW5nTWFwKFxuICAgICAgICAgICAgICAgIGNvbnRleHQsIHJlbmRlcmVyLCBlbGVtZW50LCBkYXRhLCBhcHBseVN0eWxpbmdGbiwgc2FuaXRpemVyLCBpbm5lck1vZGUsIGlubmVyUHJvcCxcbiAgICAgICAgICAgICAgICBjdXJyZW50TWFwSW5kZXggKyAxLCBkZWZhdWx0VmFsdWUpIDpcbiAgICAgICAgICAgIGZhbHNlO1xuXG4gICAgICAgIGlmIChpdGVyYXRlZFRvb0Zhcikge1xuICAgICAgICAgIGlmICghdGFyZ2V0UHJvcFZhbHVlV2FzQXBwbGllZCkge1xuICAgICAgICAgICAgdGFyZ2V0UHJvcFZhbHVlV2FzQXBwbGllZCA9IHZhbHVlQXBwbGllZDtcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIXZhbHVlQXBwbGllZCAmJiBpc1ZhbHVlQWxsb3dlZFRvQmVBcHBsaWVkKG1vZGUsIGlzVGFyZ2V0UHJvcE1hdGNoZWQpKSB7XG4gICAgICAgICAgdmFsdWVBcHBsaWVkID0gdHJ1ZTtcblxuICAgICAgICAgIGlmICghY2hlY2tWYWx1ZXNPbmx5KSB7XG4gICAgICAgICAgICBjb25zdCB1c2VEZWZhdWx0ID0gaXNUYXJnZXRQcm9wTWF0Y2hlZCAmJiAhdmFsdWVJc0RlZmluZWQ7XG4gICAgICAgICAgICBjb25zdCBiaW5kaW5nSW5kZXhUb0FwcGx5ID0gaXNUYXJnZXRQcm9wTWF0Y2hlZCA/IGJpbmRpbmdJbmRleCA6IG51bGw7XG5cbiAgICAgICAgICAgIGxldCBmaW5hbFZhbHVlOiBhbnk7XG4gICAgICAgICAgICBpZiAodXNlRGVmYXVsdCkge1xuICAgICAgICAgICAgICBmaW5hbFZhbHVlID0gZGVmYXVsdFZhbHVlO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgZmluYWxWYWx1ZSA9IHNhbml0aXplciA/XG4gICAgICAgICAgICAgICAgICBzYW5pdGl6ZXIocHJvcCwgdmFsdWUsIFN0eWxlU2FuaXRpemVNb2RlLlZhbGlkYXRlQW5kU2FuaXRpemUpIDpcbiAgICAgICAgICAgICAgICAgICh2YWx1ZSA/IHVud3JhcFNhZmVWYWx1ZSh2YWx1ZSkgOiBudWxsKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgYXBwbHlTdHlsaW5nRm4ocmVuZGVyZXIsIGVsZW1lbnQsIHByb3AsIGZpbmFsVmFsdWUsIGJpbmRpbmdJbmRleFRvQXBwbHkpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHRhcmdldFByb3BWYWx1ZVdhc0FwcGxpZWQgPSB2YWx1ZUFwcGxpZWQgJiYgaXNUYXJnZXRQcm9wTWF0Y2hlZDtcbiAgICAgICAgY3Vyc29yICs9IFN0eWxpbmdNYXBBcnJheUluZGV4LlR1cGxlU2l6ZTtcbiAgICAgIH1cbiAgICAgIHNldEN1cnJlbnRTeW5jQ3Vyc29yKGN1cnJlbnRNYXBJbmRleCwgY3Vyc29yKTtcblxuICAgICAgLy8gdGhpcyBpcyBhIGZhbGxiYWNrIGNhc2UgaW4gdGhlIGV2ZW50IHRoYXQgdGhlIHN0eWxpbmcgbWFwIGlzIGBudWxsYCBmb3IgdGhpc1xuICAgICAgLy8gYmluZGluZyBidXQgdGhlcmUgYXJlIG90aGVyIG1hcC1iYXNlZCBiaW5kaW5ncyB0aGF0IG5lZWQgdG8gYmUgZXZhbHVhdGVkXG4gICAgICAvLyBhZnRlcndhcmRzLiBJZiB0aGUgYHByb3BgIHZhbHVlIGlzIGZhbHN5IHRoZW4gdGhlIGludGVudGlvbiBpcyB0byBjeWNsZVxuICAgICAgLy8gdGhyb3VnaCBhbGwgb2YgdGhlIHByb3BlcnRpZXMgaW4gdGhlIHJlbWFpbmluZyBtYXBzIGFzIHdlbGwuIElmIHRoZSBjdXJyZW50XG4gICAgICAvLyBzdHlsaW5nIG1hcCBpcyB0b28gc2hvcnQgdGhlbiB0aGVyZSBhcmUgbm8gdmFsdWVzIHRvIGl0ZXJhdGUgb3Zlci4gSW4gZWl0aGVyXG4gICAgICAvLyBjYXNlIHRoZSBmb2xsb3ctdXAgbWFwcyBuZWVkIHRvIGJlIGl0ZXJhdGVkIG92ZXIuXG4gICAgICBpZiAocmVjdXJzZUlubmVyTWFwcyAmJlxuICAgICAgICAgIChzdHlsaW5nTWFwQXJyLmxlbmd0aCA9PT0gU3R5bGluZ01hcEFycmF5SW5kZXguVmFsdWVzU3RhcnRQb3NpdGlvbiB8fCAhdGFyZ2V0UHJvcCkpIHtcbiAgICAgICAgdGFyZ2V0UHJvcFZhbHVlV2FzQXBwbGllZCA9IGlubmVyU3luY1N0eWxpbmdNYXAoXG4gICAgICAgICAgICBjb250ZXh0LCByZW5kZXJlciwgZWxlbWVudCwgZGF0YSwgYXBwbHlTdHlsaW5nRm4sIHNhbml0aXplciwgbW9kZSwgdGFyZ2V0UHJvcCxcbiAgICAgICAgICAgIGN1cnJlbnRNYXBJbmRleCArIDEsIGRlZmF1bHRWYWx1ZSk7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChyZWN1cnNlSW5uZXJNYXBzKSB7XG4gICAgICB0YXJnZXRQcm9wVmFsdWVXYXNBcHBsaWVkID0gaW5uZXJTeW5jU3R5bGluZ01hcChcbiAgICAgICAgICBjb250ZXh0LCByZW5kZXJlciwgZWxlbWVudCwgZGF0YSwgYXBwbHlTdHlsaW5nRm4sIHNhbml0aXplciwgbW9kZSwgdGFyZ2V0UHJvcCxcbiAgICAgICAgICBjdXJyZW50TWFwSW5kZXggKyAxLCBkZWZhdWx0VmFsdWUpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiB0YXJnZXRQcm9wVmFsdWVXYXNBcHBsaWVkO1xufVxuXG4vKipcbiAqIFVzZWQgdG8gZGV0ZXJtaW5lIHRoZSBtb2RlIGZvciB0aGUgaW5uZXIgcmVjdXJzaXZlIGNhbGwuXG4gKlxuICogSWYgYW4gaW5uZXIgbWFwIGlzIGl0ZXJhdGVkIG9uIHRoZW4gdGhpcyBpcyBkb25lIHNvIGZvciBvbmVcbiAqIG9mIHR3byByZWFzb25zOlxuICpcbiAqIC0gdmFsdWUgaXMgYmVpbmcgYXBwbGllZDpcbiAqICAgaWYgdGhlIHZhbHVlIGlzIGJlaW5nIGFwcGxpZWQgZnJvbSB0aGlzIGN1cnJlbnQgc3R5bGluZ1xuICogICBtYXAgdGhlbiB0aGVyZSBpcyBubyBuZWVkIHRvIGFwcGx5IGl0IGluIGEgZGVlcGVyIG1hcFxuICogICAoaS5lLiB0aGUgYFNraXBUYXJnZXRQcm9wYCBmbGFnIGlzIHNldClcbiAqXG4gKiAtIHZhbHVlIGlzIGJlaW5nIG5vdCBhcHBsaWVkOlxuICogICBhcHBseSB0aGUgdmFsdWUgaWYgaXQgaXMgZm91bmQgaW4gYSBkZWVwZXIgbWFwLlxuICogICAoaS5lLiB0aGUgYFNraXBUYXJnZXRQcm9wYCBmbGFnIGlzIHVuc2V0KVxuICpcbiAqIFdoZW4gdGhlc2UgcmVhc29ucyBhcmUgZW5jb3VudGVyZWQgdGhlIGZsYWdzIHdpbGwgZm9yIHRoZVxuICogaW5uZXIgbWFwIG1vZGUgd2lsbCBiZSBjb25maWd1cmVkLlxuICovXG5mdW5jdGlvbiByZXNvbHZlSW5uZXJNYXBNb2RlKFxuICAgIGN1cnJlbnRNb2RlOiBudW1iZXIsIHZhbHVlSXNEZWZpbmVkOiBib29sZWFuLCBpc1RhcmdldFByb3BNYXRjaGVkOiBib29sZWFuKTogbnVtYmVyIHtcbiAgbGV0IGlubmVyTW9kZSA9IGN1cnJlbnRNb2RlO1xuXG4gIC8vIHRoZSBzdGF0ZW1lbnRzIGJlbG93IGZpZ3VyZXMgb3V0IHdoZXRoZXIgb3Igbm90IGFuIGlubmVyIHN0eWxpbmcgbWFwXG4gIC8vIGlzIGFsbG93ZWQgdG8gYXBwbHkgaXRzIHZhbHVlIG9yIG5vdC4gVGhlIG1haW4gdGhpbmcgdG8ga2VlcCBub3RlXG4gIC8vIG9mIGlzIHRoYXQgaWYgdGhlIHRhcmdldCBwcm9wIGlzbid0IG1hdGNoZWQgdGhlbiBpdHMgZXhwZWN0ZWQgdGhhdFxuICAvLyBhbGwgdmFsdWVzIGJlZm9yZSBpdCBhcmUgYWxsb3dlZCB0byBiZSBhcHBsaWVkIHNvIGxvbmcgYXMgXCJhcHBseSBhbGwgdmFsdWVzXCJcbiAgLy8gaXMgc2V0IHRvIHRydWUuXG4gIGNvbnN0IGFwcGx5QWxsVmFsdWVzID0gY3VycmVudE1vZGUgJiBTdHlsaW5nTWFwc1N5bmNNb2RlLkFwcGx5QWxsVmFsdWVzO1xuICBjb25zdCBhcHBseVRhcmdldFByb3AgPSBjdXJyZW50TW9kZSAmIFN0eWxpbmdNYXBzU3luY01vZGUuQXBwbHlUYXJnZXRQcm9wO1xuICBjb25zdCBhbGxvd0lubmVyQXBwbHkgPVxuICAgICAgIXZhbHVlSXNEZWZpbmVkICYmIChpc1RhcmdldFByb3BNYXRjaGVkID8gYXBwbHlUYXJnZXRQcm9wIDogYXBwbHlBbGxWYWx1ZXMpO1xuXG4gIGlmIChhbGxvd0lubmVyQXBwbHkpIHtcbiAgICAvLyBjYXNlIDE6IHNldCB0aGUgbW9kZSB0byBhcHBseSB0aGUgdGFyZ2V0ZWQgcHJvcCB2YWx1ZSBpZiBpdFxuICAgIC8vIGVuZHMgdXAgYmVpbmcgZW5jb3VudGVyZWQgaW4gYW5vdGhlciBtYXAgdmFsdWVcbiAgICBpbm5lck1vZGUgfD0gU3R5bGluZ01hcHNTeW5jTW9kZS5BcHBseVRhcmdldFByb3A7XG4gICAgaW5uZXJNb2RlICY9IH5TdHlsaW5nTWFwc1N5bmNNb2RlLlNraXBUYXJnZXRQcm9wO1xuICB9IGVsc2Uge1xuICAgIC8vIGNhc2UgMjogc2V0IHRoZSBtb2RlIHRvIHNraXAgdGhlIHRhcmdldGVkIHByb3AgdmFsdWUgaWYgaXRcbiAgICAvLyBlbmRzIHVwIGJlaW5nIGVuY291bnRlcmVkIGluIGFub3RoZXIgbWFwIHZhbHVlXG4gICAgaW5uZXJNb2RlIHw9IFN0eWxpbmdNYXBzU3luY01vZGUuU2tpcFRhcmdldFByb3A7XG4gICAgaW5uZXJNb2RlICY9IH5TdHlsaW5nTWFwc1N5bmNNb2RlLkFwcGx5VGFyZ2V0UHJvcDtcbiAgfVxuXG4gIHJldHVybiBpbm5lck1vZGU7XG59XG5cbi8qKlxuICogRGVjaWRlcyB3aGV0aGVyIG9yIG5vdCBhIHByb3AvdmFsdWUgZW50cnkgd2lsbCBiZSBhcHBsaWVkIHRvIGFuIGVsZW1lbnQuXG4gKlxuICogVG8gZGV0ZXJtaW5lIHdoZXRoZXIgb3Igbm90IGEgdmFsdWUgaXMgdG8gYmUgYXBwbGllZCxcbiAqIHRoZSBmb2xsb3dpbmcgcHJvY2VkdXJlIGlzIGV2YWx1YXRlZDpcbiAqXG4gKiBGaXJzdCBjaGVjayB0byBzZWUgdGhlIGN1cnJlbnQgYG1vZGVgIHN0YXR1czpcbiAqICAxLiBJZiB0aGUgbW9kZSB2YWx1ZSBwZXJtaXRzIGFsbCBwcm9wcyB0byBiZSBhcHBsaWVkIHRoZW4gYWxsb3cuXG4gKiAgICAtIEJ1dCBkbyBub3QgYWxsb3cgaWYgdGhlIGN1cnJlbnQgcHJvcCBpcyBzZXQgdG8gYmUgc2tpcHBlZC5cbiAqICAyLiBPdGhlcndpc2UgaWYgdGhlIGN1cnJlbnQgcHJvcCBpcyBwZXJtaXR0ZWQgdGhlbiBhbGxvdy5cbiAqL1xuZnVuY3Rpb24gaXNWYWx1ZUFsbG93ZWRUb0JlQXBwbGllZChtb2RlOiBTdHlsaW5nTWFwc1N5bmNNb2RlLCBpc1RhcmdldFByb3BNYXRjaGVkOiBib29sZWFuKSB7XG4gIGxldCBkb0FwcGx5VmFsdWUgPSAobW9kZSAmIFN0eWxpbmdNYXBzU3luY01vZGUuQXBwbHlBbGxWYWx1ZXMpICE9PSAwO1xuICBpZiAoIWRvQXBwbHlWYWx1ZSkge1xuICAgIGlmIChtb2RlICYgU3R5bGluZ01hcHNTeW5jTW9kZS5BcHBseVRhcmdldFByb3ApIHtcbiAgICAgIGRvQXBwbHlWYWx1ZSA9IGlzVGFyZ2V0UHJvcE1hdGNoZWQ7XG4gICAgfVxuICB9IGVsc2UgaWYgKChtb2RlICYgU3R5bGluZ01hcHNTeW5jTW9kZS5Ta2lwVGFyZ2V0UHJvcCkgJiYgaXNUYXJnZXRQcm9wTWF0Y2hlZCkge1xuICAgIGRvQXBwbHlWYWx1ZSA9IGZhbHNlO1xuICB9XG4gIHJldHVybiBkb0FwcGx5VmFsdWU7XG59XG5cbi8qKlxuICogVXNlZCB0byBrZWVwIHRyYWNrIG9mIGNvbmN1cnJlbnQgY3Vyc29yIHZhbHVlcyBmb3IgbXVsdGlwbGUgbWFwLWJhc2VkIHN0eWxpbmcgYmluZGluZ3MgcHJlc2VudCBvblxuICogYW4gZWxlbWVudC5cbiAqL1xuY29uc3QgTUFQX0NVUlNPUlM6IG51bWJlcltdID0gW107XG5cbi8qKlxuICogVXNlZCB0byByZXNldCB0aGUgc3RhdGUgb2YgZWFjaCBjdXJzb3IgdmFsdWUgYmVpbmcgdXNlZCB0byBpdGVyYXRlIG92ZXIgbWFwLWJhc2VkIHN0eWxpbmdcbiAqIGJpbmRpbmdzLlxuICovXG5mdW5jdGlvbiByZXNldFN5bmNDdXJzb3JzKCkge1xuICBmb3IgKGxldCBpID0gMDsgaSA8IE1BUF9DVVJTT1JTLmxlbmd0aDsgaSsrKSB7XG4gICAgTUFQX0NVUlNPUlNbaV0gPSBTdHlsaW5nTWFwQXJyYXlJbmRleC5WYWx1ZXNTdGFydFBvc2l0aW9uO1xuICB9XG59XG5cbi8qKlxuICogUmV0dXJucyBhbiBhY3RpdmUgY3Vyc29yIHZhbHVlIGF0IGEgZ2l2ZW4gbWFwSW5kZXggbG9jYXRpb24uXG4gKi9cbmZ1bmN0aW9uIGdldEN1cnJlbnRTeW5jQ3Vyc29yKG1hcEluZGV4OiBudW1iZXIpIHtcbiAgaWYgKG1hcEluZGV4ID49IE1BUF9DVVJTT1JTLmxlbmd0aCkge1xuICAgIE1BUF9DVVJTT1JTLnB1c2goU3R5bGluZ01hcEFycmF5SW5kZXguVmFsdWVzU3RhcnRQb3NpdGlvbik7XG4gIH1cbiAgcmV0dXJuIE1BUF9DVVJTT1JTW21hcEluZGV4XTtcbn1cblxuLyoqXG4gKiBTZXRzIGEgY3Vyc29yIHZhbHVlIGF0IGEgZ2l2ZW4gbWFwSW5kZXggbG9jYXRpb24uXG4gKi9cbmZ1bmN0aW9uIHNldEN1cnJlbnRTeW5jQ3Vyc29yKG1hcEluZGV4OiBudW1iZXIsIGluZGV4VmFsdWU6IG51bWJlcikge1xuICBNQVBfQ1VSU09SU1ttYXBJbmRleF0gPSBpbmRleFZhbHVlO1xufVxuIl19