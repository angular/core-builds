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
 */
export var syncStylingMap = function (context, renderer, element, data, sourceIndex, applyStylingFn, sanitizer, mode, targetProp, defaultValue) {
    var targetPropValueWasApplied = false;
    // once the map-based styling code is activate it is never deactivated. For this reason a
    // check to see if the current styling context has any map based bindings is required.
    var totalMaps = getValuesCount(context);
    if (totalMaps) {
        var runTheSyncAlgorithm = true;
        var loopUntilEnd = !targetProp;
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
    var totalMaps = getValuesCount(context) - 1; // maps have no default value
    var mapsLimit = totalMaps - 1;
    var recurseInnerMaps = currentMapIndex < mapsLimit && (mode & 8 /* RecurseInnerMaps */) !== 0;
    var checkValuesOnly = (mode & 16 /* CheckValuesOnly */) !== 0;
    if (checkValuesOnly) {
        // inner modes do not check values ever (that can only happen
        // when sourceIndex === 0)
        mode &= ~16 /* CheckValuesOnly */;
    }
    var targetPropValueWasApplied = false;
    if (currentMapIndex <= mapsLimit) {
        var cursor = getCurrentSyncCursor(currentMapIndex);
        var bindingIndex = getBindingValue(context, 2 /* ValuesStartPosition */, currentMapIndex);
        var stylingMapArr = getValue(data, bindingIndex);
        if (stylingMapArr) {
            while (cursor < stylingMapArr.length) {
                var prop = getMapProp(stylingMapArr, cursor);
                var iteratedTooFar = targetProp && prop > targetProp;
                var isTargetPropMatched = !iteratedTooFar && prop === targetProp;
                var value = getMapValue(stylingMapArr, cursor);
                var valueIsDefined = isStylingValueDefined(value);
                // the recursive code is designed to keep applying until
                // it reaches or goes past the target prop. If and when
                // this happens then it will stop processing values, but
                // all other map values must also catch up to the same
                // point. This is why a recursive call is still issued
                // even if the code has iterated too far.
                var innerMode = iteratedTooFar ? mode : resolveInnerMapMode(mode, valueIsDefined, isTargetPropMatched);
                var innerProp = iteratedTooFar ? targetProp : prop;
                var valueApplied = recurseInnerMaps ?
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
                        var useDefault = isTargetPropMatched && !valueIsDefined;
                        var bindingIndexToApply = isTargetPropMatched ? bindingIndex : null;
                        var finalValue = void 0;
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
 */
function resolveInnerMapMode(currentMode, valueIsDefined, isTargetPropMatched) {
    var innerMode = currentMode;
    // the statements below figures out whether or not an inner styling map
    // is allowed to apply its value or not. The main thing to keep note
    // of is that if the target prop isn't matched then its expected that
    // all values before it are allowed to be applied so long as "apply all values"
    // is set to true.
    var applyAllValues = currentMode & 1 /* ApplyAllValues */;
    var applyTargetProp = currentMode & 2 /* ApplyTargetProp */;
    var allowInnerApply = !valueIsDefined && (isTargetPropMatched ? applyTargetProp : applyAllValues);
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
 */
function isValueAllowedToBeApplied(mode, isTargetPropMatched) {
    var doApplyValue = (mode & 1 /* ApplyAllValues */) !== 0;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFwX2Jhc2VkX2JpbmRpbmdzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9zdHlsaW5nL21hcF9iYXNlZF9iaW5kaW5ncy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0VBTUU7QUFDRixPQUFPLEVBQUMsZUFBZSxFQUFDLE1BQU0sMkJBQTJCLENBQUM7QUFJMUQsT0FBTyxFQUFDLGVBQWUsRUFBRSxVQUFVLEVBQUUsV0FBVyxFQUFFLFFBQVEsRUFBRSxjQUFjLEVBQUUscUJBQXFCLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUVoSSxPQUFPLEVBQUMsb0JBQW9CLEVBQUMsTUFBTSxZQUFZLENBQUM7QUFHaEQ7Ozs7Ozs7R0FPRztBQUVIOztHQUVHO0FBQ0gsTUFBTSxVQUFVLHlCQUF5QjtJQUN2QyxvQkFBb0IsQ0FBQyxjQUFjLENBQUMsQ0FBQztBQUN2QyxDQUFDO0FBRUQ7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7R0ErRUc7QUFDSCxNQUFNLENBQUMsSUFBTSxjQUFjLEdBQ3ZCLFVBQUMsT0FBd0IsRUFBRSxRQUFnRCxFQUFFLE9BQWlCLEVBQzdGLElBQWtCLEVBQUUsV0FBbUIsRUFBRSxjQUE4QixFQUN2RSxTQUFpQyxFQUFFLElBQXlCLEVBQUUsVUFBMEIsRUFDeEYsWUFBc0M7SUFDckMsSUFBSSx5QkFBeUIsR0FBRyxLQUFLLENBQUM7SUFFdEMseUZBQXlGO0lBQ3pGLHNGQUFzRjtJQUN0RixJQUFNLFNBQVMsR0FBRyxjQUFjLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDMUMsSUFBSSxTQUFTLEVBQUU7UUFDYixJQUFJLG1CQUFtQixHQUFHLElBQUksQ0FBQztRQUMvQixJQUFNLFlBQVksR0FBRyxDQUFDLFVBQVUsQ0FB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NUQ7SUFDRCxPQUFPLFdBQVcsQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUMvQixDQUFDO0FBRUQ7O0dBRUc7QUFDSCxTQUFTLG9CQUFvQixDQUFDLFFBQWdCLEVBQUUsVUFBa0I7SUFDaEUsV0FBVyxDQUFDLFFBQVEsQ0FBQyxHQUFHLFVBQVUsQ0FBQztBQUNyQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4qIEBsaWNlbnNlXG4qIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuKlxuKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4qL1xuaW1wb3J0IHt1bndyYXBTYWZlVmFsdWV9IGZyb20gJy4uLy4uL3Nhbml0aXphdGlvbi9ieXBhc3MnO1xuaW1wb3J0IHtTdHlsZVNhbml0aXplRm4sIFN0eWxlU2FuaXRpemVNb2RlfSBmcm9tICcuLi8uLi9zYW5pdGl6YXRpb24vc3R5bGVfc2FuaXRpemVyJztcbmltcG9ydCB7UHJvY2VkdXJhbFJlbmRlcmVyMywgUkVsZW1lbnQsIFJlbmRlcmVyM30gZnJvbSAnLi4vaW50ZXJmYWNlcy9yZW5kZXJlcic7XG5pbXBvcnQge0FwcGx5U3R5bGluZ0ZuLCBMU3R5bGluZ0RhdGEsIFN0eWxpbmdNYXBBcnJheSwgU3R5bGluZ01hcEFycmF5SW5kZXgsIFN0eWxpbmdNYXBzU3luY01vZGUsIFN5bmNTdHlsaW5nTWFwc0ZuLCBUU3R5bGluZ0NvbnRleHQsIFRTdHlsaW5nQ29udGV4dEluZGV4fSBmcm9tICcuLi9pbnRlcmZhY2VzL3N0eWxpbmcnO1xuaW1wb3J0IHtnZXRCaW5kaW5nVmFsdWUsIGdldE1hcFByb3AsIGdldE1hcFZhbHVlLCBnZXRWYWx1ZSwgZ2V0VmFsdWVzQ291bnQsIGlzU3R5bGluZ1ZhbHVlRGVmaW5lZH0gZnJvbSAnLi4vdXRpbC9zdHlsaW5nX3V0aWxzJztcblxuaW1wb3J0IHtzZXRTdHlsaW5nTWFwc1N5bmNGbn0gZnJvbSAnLi9iaW5kaW5ncyc7XG5cblxuLyoqXG4gKiAtLS0tLS0tLVxuICpcbiAqIFRoaXMgZmlsZSBjb250YWlucyB0aGUgYWxnb3JpdGhtIGxvZ2ljIGZvciBhcHBseWluZyBtYXAtYmFzZWQgYmluZGluZ3NcbiAqIHN1Y2ggYXMgYFtzdHlsZV1gIGFuZCBgW2NsYXNzXWAuXG4gKlxuICogLS0tLS0tLS1cbiAqL1xuXG4vKipcbiAqIEVuYWJsZXMgc3VwcG9ydCBmb3IgbWFwLWJhc2VkIHN0eWxpbmcgYmluZGluZ3MgKGUuZy4gYFtzdHlsZV1gIGFuZCBgW2NsYXNzXWAgYmluZGluZ3MpLlxuICovXG5leHBvcnQgZnVuY3Rpb24gYWN0aXZhdGVTdHlsaW5nTWFwRmVhdHVyZSgpIHtcbiAgc2V0U3R5bGluZ01hcHNTeW5jRm4oc3luY1N0eWxpbmdNYXApO1xufVxuXG4vKipcbiAqIFVzZWQgdG8gYXBwbHkgc3R5bGluZyB2YWx1ZXMgcHJlc2VudGx5IHdpdGhpbiBhbnkgbWFwLWJhc2VkIGJpbmRpbmdzIG9uIGFuIGVsZW1lbnQuXG4gKlxuICogQW5ndWxhciBzdXBwb3J0cyBtYXAtYmFzZWQgc3R5bGluZyBiaW5kaW5ncyB3aGljaCBjYW4gYmUgYXBwbGllZCB2aWEgdGhlXG4gKiBgW3N0eWxlXWAgYW5kIGBbY2xhc3NdYCBiaW5kaW5ncyB3aGljaCBjYW4gYmUgcGxhY2VkIG9uIGFueSBIVE1MIGVsZW1lbnQuXG4gKiBUaGVzZSBiaW5kaW5ncyBjYW4gd29yayBpbmRlcGVuZGVudGx5LCB0b2dldGhlciBvciBhbG9uZ3NpZGUgcHJvcC1iYXNlZFxuICogc3R5bGluZyBiaW5kaW5ncyAoZS5nLiBgPGRpdiBbc3R5bGVdPVwieFwiIFtzdHlsZS53aWR0aF09XCJ3XCI+YCkuXG4gKlxuICogSWYgYSBtYXAtYmFzZWQgc3R5bGluZyBiaW5kaW5nIGlzIGRldGVjdGVkIGJ5IHRoZSBjb21waWxlciwgdGhlIGZvbGxvd2luZ1xuICogQU9UIGNvZGUgaXMgcHJvZHVjZWQ6XG4gKlxuICogYGBgdHlwZXNjcmlwdFxuICogc3R5bGVNYXAoY3R4LnN0eWxlcyk7IC8vIHN0eWxlcyA9IHtrZXk6dmFsdWV9XG4gKiBjbGFzc01hcChjdHguY2xhc3Nlcyk7IC8vIGNsYXNzZXMgPSB7a2V5OnZhbHVlfXxzdHJpbmdcbiAqIGBgYFxuICpcbiAqIElmIGFuZCB3aGVuIGVpdGhlciBvZiB0aGUgaW5zdHJ1Y3Rpb25zIGFib3ZlIGFyZSBldmFsdWF0ZWQsIHRoZW4gdGhlIGNvZGVcbiAqIHByZXNlbnQgaW4gdGhpcyBmaWxlIGlzIGluY2x1ZGVkIGludG8gdGhlIGJ1bmRsZS4gVGhlIG1lY2hhbmlzbSB1c2VkLCB0b1xuICogYWN0aXZhdGUgc3VwcG9ydCBmb3IgbWFwLWJhc2VkIGJpbmRpbmdzIGF0IHJ1bnRpbWUgaXMgcG9zc2libGUgdmlhIHRoZVxuICogYGFjdGl2ZVN0eWxpbmdNYXBGZWF0dXJlYCBmdW5jdGlvbiAod2hpY2ggaXMgYWxzbyBwcmVzZW50IGluIHRoaXMgZmlsZSkuXG4gKlxuICogIyBUaGUgQWxnb3JpdGhtXG4gKiBXaGVuZXZlciBhIG1hcC1iYXNlZCBiaW5kaW5nIHVwZGF0ZXMgKHdoaWNoIGlzIHdoZW4gdGhlIGlkZW50aXR5IG9mIHRoZVxuICogbWFwLXZhbHVlIGNoYW5nZXMpIHRoZW4gdGhlIG1hcCBpcyBpdGVyYXRlZCBvdmVyIGFuZCBhIGBTdHlsaW5nTWFwQXJyYXlgIGFycmF5XG4gKiBpcyBwcm9kdWNlZC4gVGhlIGBTdHlsaW5nTWFwQXJyYXlgIGluc3RhbmNlIGlzIHN0b3JlZCBpbiB0aGUgYmluZGluZyBsb2NhdGlvblxuICogd2hlcmUgdGhlIGBCSU5ESU5HX0lOREVYYCBpcyBzaXR1YXRlZCB3aGVuIHRoZSBgc3R5bGVNYXAoKWAgb3IgYGNsYXNzTWFwKClgXG4gKiBpbnN0cnVjdGlvbiB3ZXJlIGNhbGxlZC4gT25jZSB0aGUgYmluZGluZyBjaGFuZ2VzLCB0aGVuIHRoZSBpbnRlcm5hbCBgYml0TWFza2BcbiAqIHZhbHVlIGlzIG1hcmtlZCBhcyBkaXJ0eS5cbiAqXG4gKiBTdHlsaW5nIHZhbHVlcyBhcmUgYXBwbGllZCBvbmNlIENEIGV4aXRzIHRoZSBlbGVtZW50ICh3aGljaCBoYXBwZW5zIHdoZW5cbiAqIHRoZSBgYWR2YW5jZShuKWAgaW5zdHJ1Y3Rpb24gaXMgY2FsbGVkIG9yIHRoZSB0ZW1wbGF0ZSBmdW5jdGlvbiBleGl0cykuIFdoZW5cbiAqIHRoaXMgb2NjdXJzLCBhbGwgcHJvcC1iYXNlZCBiaW5kaW5ncyBhcmUgYXBwbGllZC4gSWYgYSBtYXAtYmFzZWQgYmluZGluZyBpc1xuICogcHJlc2VudCB0aGVuIGEgc3BlY2lhbCBmbHVzaGluZyBmdW5jdGlvbiAoY2FsbGVkIGEgc3luYyBmdW5jdGlvbikgaXMgbWFkZVxuICogYXZhaWxhYmxlIGFuZCBpdCB3aWxsIGJlIGNhbGxlZCBlYWNoIHRpbWUgYSBzdHlsaW5nIHByb3BlcnR5IGlzIGZsdXNoZWQuXG4gKlxuICogVGhlIGZsdXNoaW5nIGFsZ29yaXRobSBpcyBkZXNpZ25lZCB0byBhcHBseSBzdHlsaW5nIGZvciBhIHByb3BlcnR5ICh3aGljaCBpc1xuICogYSBDU1MgcHJvcGVydHkgb3IgYSBjbGFzc05hbWUgdmFsdWUpIG9uZSBieSBvbmUuIElmIG1hcC1iYXNlZCBiaW5kaW5nc1xuICogYXJlIHByZXNlbnQsIHRoZW4gdGhlIGZsdXNoaW5nIGFsZ29yaXRobSB3aWxsIGtlZXAgY2FsbGluZyB0aGUgbWFwcyBzdHlsaW5nXG4gKiBzeW5jIGZ1bmN0aW9uIGVhY2ggdGltZSBhIHByb3BlcnR5IGlzIHZpc2l0ZWQuIFRoaXMgd2F5LCB0aGUgZmx1c2hpbmdcbiAqIGJlaGF2aW9yIG9mIG1hcC1iYXNlZCBiaW5kaW5ncyB3aWxsIGFsd2F5cyBiZSBhdCB0aGUgc2FtZSBwcm9wZXJ0eSBsZXZlbFxuICogYXMgdGhlIGN1cnJlbnQgcHJvcC1iYXNlZCBwcm9wZXJ0eSBiZWluZyBpdGVyYXRlZCBvdmVyIChiZWNhdXNlIGV2ZXJ5dGhpbmdcbiAqIGlzIGFscGhhYmV0aWNhbGx5IHNvcnRlZCkuXG4gKlxuICogTGV0J3MgaW1hZ2luZSB3ZSBoYXZlIHRoZSBmb2xsb3dpbmcgSFRNTCB0ZW1wbGF0ZSBjb2RlOlxuICpcbiAqIGBgYGh0bWxcbiAqIDxkaXYgW3N0eWxlXT1cInt3aWR0aDonMTAwcHgnLCBoZWlnaHQ6JzIwMHB4JywgJ3otaW5kZXgnOicxMCd9XCJcbiAqICAgICAgW3N0eWxlLndpZHRoLnB4XT1cIjIwMFwiPi4uLjwvZGl2PlxuICogYGBgXG4gKlxuICogV2hlbiBDRCBvY2N1cnMsIGJvdGggdGhlIGBbc3R5bGVdYCBhbmQgYFtzdHlsZS53aWR0aF1gIGJpbmRpbmdzXG4gKiBhcmUgZXZhbHVhdGVkLiBUaGVuIHdoZW4gdGhlIHN0eWxlcyBhcmUgZmx1c2hlZCBvbiBzY3JlZW4sIHRoZVxuICogZm9sbG93aW5nIG9wZXJhdGlvbnMgaGFwcGVuOlxuICpcbiAqIDEuIGBbc3R5bGUud2lkdGhdYCBpcyBhdHRlbXB0ZWQgdG8gYmUgd3JpdHRlbiB0byB0aGUgZWxlbWVudC5cbiAqXG4gKiAyLiAgT25jZSB0aGF0IGhhcHBlbnMsIHRoZSBhbGdvcml0aG0gaW5zdHJ1Y3RzIHRoZSBtYXAtYmFzZWRcbiAqICAgICBlbnRyaWVzIChgW3N0eWxlXWAgaW4gdGhpcyBjYXNlKSB0byBcImNhdGNoIHVwXCIgYW5kIGFwcGx5XG4gKiAgICAgYWxsIHZhbHVlcyB1cCB0byB0aGUgYHdpZHRoYCB2YWx1ZS4gV2hlbiB0aGlzIGhhcHBlbnMgdGhlXG4gKiAgICAgYGhlaWdodGAgdmFsdWUgaXMgYXBwbGllZCB0byB0aGUgZWxlbWVudCAoc2luY2UgaXQgaXNcbiAqICAgICBhbHBoYWJldGljYWxseSBzaXR1YXRlZCBiZWZvcmUgdGhlIGB3aWR0aGAgcHJvcGVydHkpLlxuICpcbiAqIDMuIFNpbmNlIHRoZXJlIGFyZSBubyBtb3JlIHByb3AtYmFzZWQgZW50cmllcyBhbnltb3JlLCB0aGVcbiAqICAgIGxvb3AgZXhpdHMgYW5kIHRoZW4sIGp1c3QgYmVmb3JlIHRoZSBmbHVzaGluZyBlbmRzLCBpdFxuICogICAgaW5zdHJ1Y3RzIGFsbCBtYXAtYmFzZWQgYmluZGluZ3MgdG8gXCJmaW5pc2ggdXBcIiBhcHBseWluZ1xuICogICAgdGhlaXIgdmFsdWVzLlxuICpcbiAqIDQuIFRoZSBvbmx5IHJlbWFpbmluZyB2YWx1ZSB3aXRoaW4gdGhlIG1hcC1iYXNlZCBlbnRyaWVzIGlzXG4gKiAgICB0aGUgYHotaW5kZXhgIHZhbHVlIChgd2lkdGhgIGdvdCBza2lwcGVkIGJlY2F1c2UgaXQgd2FzXG4gKiAgICBzdWNjZXNzZnVsbHkgYXBwbGllZCB2aWEgdGhlIHByb3AtYmFzZWQgYFtzdHlsZS53aWR0aF1gXG4gKiAgICBiaW5kaW5nKS4gU2luY2UgYWxsIG1hcC1iYXNlZCBlbnRyaWVzIGFyZSB0b2xkIHRvIFwiZmluaXNoIHVwXCIsXG4gKiAgICB0aGUgYHotaW5kZXhgIHZhbHVlIGlzIGl0ZXJhdGVkIG92ZXIgYW5kIGl0IGlzIHRoZW4gYXBwbGllZFxuICogICAgdG8gdGhlIGVsZW1lbnQuXG4gKlxuICogVGhlIG1vc3QgaW1wb3J0YW50IHRoaW5nIHRvIHRha2Ugbm90ZSBvZiBoZXJlIGlzIHRoYXQgcHJvcC1iYXNlZFxuICogYmluZGluZ3MgYXJlIGV2YWx1YXRlZCBpbiBvcmRlciBhbG9uZ3NpZGUgbWFwLWJhc2VkIGJpbmRpbmdzLlxuICogVGhpcyBhbGxvd3MgYWxsIHN0eWxpbmcgYWNyb3NzIGFuIGVsZW1lbnQgdG8gYmUgYXBwbGllZCBpbiBPKG4pXG4gKiB0aW1lIChhIHNpbWlsYXIgYWxnb3JpdGhtIGlzIHRoYXQgb2YgdGhlIGFycmF5IG1lcmdlIGFsZ29yaXRobVxuICogaW4gbWVyZ2Ugc29ydCkuXG4gKi9cbmV4cG9ydCBjb25zdCBzeW5jU3R5bGluZ01hcDogU3luY1N0eWxpbmdNYXBzRm4gPVxuICAgIChjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQsIHJlbmRlcmVyOiBSZW5kZXJlcjMgfCBQcm9jZWR1cmFsUmVuZGVyZXIzIHwgbnVsbCwgZWxlbWVudDogUkVsZW1lbnQsXG4gICAgIGRhdGE6IExTdHlsaW5nRGF0YSwgc291cmNlSW5kZXg6IG51bWJlciwgYXBwbHlTdHlsaW5nRm46IEFwcGx5U3R5bGluZ0ZuLFxuICAgICBzYW5pdGl6ZXI6IFN0eWxlU2FuaXRpemVGbiB8IG51bGwsIG1vZGU6IFN0eWxpbmdNYXBzU3luY01vZGUsIHRhcmdldFByb3A/OiBzdHJpbmcgfCBudWxsLFxuICAgICBkZWZhdWx0VmFsdWU/OiBzdHJpbmcgfCBib29sZWFuIHwgbnVsbCk6IGJvb2xlYW4gPT4ge1xuICAgICAgbGV0IHRhcmdldFByb3BWYWx1ZVdhc0FwcGxpZWQgPSBmYWxzZTtcblxuICAgICAgLy8gb25jZSB0aGUgbWFwLWJhc2VkIHN0eWxpbmcgY29kZSBpcyBhY3RpdmF0ZSBpdCBpcyBuZXZlciBkZWFjdGl2YXRlZC4gRm9yIHRoaXMgcmVhc29uIGFcbiAgICAgIC8vIGNoZWNrIHRvIHNlZSBpZiB0aGUgY3VycmVudCBzdHlsaW5nIGNvbnRleHQgaGFzIGFueSBtYXAgYmFzZWQgYmluZGluZ3MgaXMgcmVxdWlyZWQuXG4gICAgICBjb25zdCB0b3RhbE1hcHMgPSBnZXRWYWx1ZXNDb3VudChjb250ZXh0KTtcbiAgICAgIGlmICh0b3RhbE1hcHMpIHtcbiAgICAgICAgbGV0IHJ1blRoZVN5bmNBbGdvcml0aG0gPSB0cnVlO1xuICAgICAgICBjb25zdCBsb29wVW50aWxFbmQgPSAhdGFyZ2V0UHJvcDtcblxuICAgICAgICAvLyBJZiB0aGUgY29kZSBpcyB0b2xkIHRvIGZpbmlzaCB1cCAocnVuIHVudGlsIHRoZSBlbmQpLCBidXQgdGhlIG1vZGVcbiAgICAgICAgLy8gaGFzbid0IGJlZW4gZmxhZ2dlZCB0byBhcHBseSB2YWx1ZXMgKGl0IG9ubHkgdHJhdmVyc2VzIHZhbHVlcykgdGhlblxuICAgICAgICAvLyB0aGVyZSBpcyBubyBwb2ludCBpbiBpdGVyYXRpbmcgb3ZlciB0aGUgYXJyYXkgYmVjYXVzZSBub3RoaW5nIHdpbGxcbiAgICAgICAgLy8gYmUgYXBwbGllZCB0byB0aGUgZWxlbWVudC5cbiAgICAgICAgaWYgKGxvb3BVbnRpbEVuZCAmJiAobW9kZSAmIFN0eWxpbmdNYXBzU3luY01vZGUuQXBwbHlBbGxWYWx1ZXMpID09PSAwKSB7XG4gICAgICAgICAgcnVuVGhlU3luY0FsZ29yaXRobSA9IGZhbHNlO1xuICAgICAgICAgIHRhcmdldFByb3BWYWx1ZVdhc0FwcGxpZWQgPSB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHJ1blRoZVN5bmNBbGdvcml0aG0pIHtcbiAgICAgICAgICB0YXJnZXRQcm9wVmFsdWVXYXNBcHBsaWVkID0gaW5uZXJTeW5jU3R5bGluZ01hcChcbiAgICAgICAgICAgICAgY29udGV4dCwgcmVuZGVyZXIsIGVsZW1lbnQsIGRhdGEsIGFwcGx5U3R5bGluZ0ZuLCBzYW5pdGl6ZXIsIG1vZGUsIHRhcmdldFByb3AgfHwgbnVsbCxcbiAgICAgICAgICAgICAgc291cmNlSW5kZXgsIGRlZmF1bHRWYWx1ZSB8fCBudWxsKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChsb29wVW50aWxFbmQpIHtcbiAgICAgICAgICByZXNldFN5bmNDdXJzb3JzKCk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHRhcmdldFByb3BWYWx1ZVdhc0FwcGxpZWQ7XG4gICAgfTtcblxuLyoqXG4gKiBSZWN1cnNpdmUgZnVuY3Rpb24gZGVzaWduZWQgdG8gYXBwbHkgbWFwLWJhc2VkIHN0eWxpbmcgdG8gYW4gZWxlbWVudCBvbmUgbWFwIGF0IGEgdGltZS5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIGlzIGRlc2lnbmVkIHRvIGJlIGNhbGxlZCBmcm9tIHRoZSBgc3luY1N0eWxpbmdNYXBgIGZ1bmN0aW9uIGFuZCB3aWxsXG4gKiBhcHBseSBtYXAtYmFzZWQgc3R5bGluZyBkYXRhIG9uZSBtYXAgYXQgYSB0aW1lIHRvIHRoZSBwcm92aWRlZCBgZWxlbWVudGAuXG4gKlxuICogVGhpcyBmdW5jdGlvbiBpcyByZWN1cnNpdmUgYW5kIGl0IHdpbGwgY2FsbCBpdHNlbGYgaWYgYSBmb2xsb3ctdXAgbWFwIHZhbHVlIGlzIHRvIGJlXG4gKiBwcm9jZXNzZWQuIFRvIGxlYXJuIG1vcmUgYWJvdXQgaG93IHRoZSBhbGdvcml0aG0gd29ya3MsIHNlZSBgc3luY1N0eWxpbmdNYXBgLlxuICovXG5mdW5jdGlvbiBpbm5lclN5bmNTdHlsaW5nTWFwKFxuICAgIGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCwgcmVuZGVyZXI6IFJlbmRlcmVyMyB8IFByb2NlZHVyYWxSZW5kZXJlcjMgfCBudWxsLCBlbGVtZW50OiBSRWxlbWVudCxcbiAgICBkYXRhOiBMU3R5bGluZ0RhdGEsIGFwcGx5U3R5bGluZ0ZuOiBBcHBseVN0eWxpbmdGbiwgc2FuaXRpemVyOiBTdHlsZVNhbml0aXplRm4gfCBudWxsLFxuICAgIG1vZGU6IFN0eWxpbmdNYXBzU3luY01vZGUsIHRhcmdldFByb3A6IHN0cmluZyB8IG51bGwsIGN1cnJlbnRNYXBJbmRleDogbnVtYmVyLFxuICAgIGRlZmF1bHRWYWx1ZTogc3RyaW5nIHwgYm9vbGVhbiB8IG51bGwpOiBib29sZWFuIHtcbiAgY29uc3QgdG90YWxNYXBzID0gZ2V0VmFsdWVzQ291bnQoY29udGV4dCkgLSAxOyAgLy8gbWFwcyBoYXZlIG5vIGRlZmF1bHQgdmFsdWVcbiAgY29uc3QgbWFwc0xpbWl0ID0gdG90YWxNYXBzIC0gMTtcbiAgY29uc3QgcmVjdXJzZUlubmVyTWFwcyA9XG4gICAgICBjdXJyZW50TWFwSW5kZXggPCBtYXBzTGltaXQgJiYgKG1vZGUgJiBTdHlsaW5nTWFwc1N5bmNNb2RlLlJlY3Vyc2VJbm5lck1hcHMpICE9PSAwO1xuICBjb25zdCBjaGVja1ZhbHVlc09ubHkgPSAobW9kZSAmIFN0eWxpbmdNYXBzU3luY01vZGUuQ2hlY2tWYWx1ZXNPbmx5KSAhPT0gMDtcblxuICBpZiAoY2hlY2tWYWx1ZXNPbmx5KSB7XG4gICAgLy8gaW5uZXIgbW9kZXMgZG8gbm90IGNoZWNrIHZhbHVlcyBldmVyICh0aGF0IGNhbiBvbmx5IGhhcHBlblxuICAgIC8vIHdoZW4gc291cmNlSW5kZXggPT09IDApXG4gICAgbW9kZSAmPSB+U3R5bGluZ01hcHNTeW5jTW9kZS5DaGVja1ZhbHVlc09ubHk7XG4gIH1cblxuICBsZXQgdGFyZ2V0UHJvcFZhbHVlV2FzQXBwbGllZCA9IGZhbHNlO1xuICBpZiAoY3VycmVudE1hcEluZGV4IDw9IG1hcHNMaW1pdCkge1xuICAgIGxldCBjdXJzb3IgPSBnZXRDdXJyZW50U3luY0N1cnNvcihjdXJyZW50TWFwSW5kZXgpO1xuICAgIGNvbnN0IGJpbmRpbmdJbmRleCA9IGdldEJpbmRpbmdWYWx1ZShcbiAgICAgICAgY29udGV4dCwgVFN0eWxpbmdDb250ZXh0SW5kZXguVmFsdWVzU3RhcnRQb3NpdGlvbiwgY3VycmVudE1hcEluZGV4KSBhcyBudW1iZXI7XG4gICAgY29uc3Qgc3R5bGluZ01hcEFyciA9IGdldFZhbHVlPFN0eWxpbmdNYXBBcnJheT4oZGF0YSwgYmluZGluZ0luZGV4KTtcblxuICAgIGlmIChzdHlsaW5nTWFwQXJyKSB7XG4gICAgICB3aGlsZSAoY3Vyc29yIDwgc3R5bGluZ01hcEFyci5sZW5ndGgpIHtcbiAgICAgICAgY29uc3QgcHJvcCA9IGdldE1hcFByb3Aoc3R5bGluZ01hcEFyciwgY3Vyc29yKTtcbiAgICAgICAgY29uc3QgaXRlcmF0ZWRUb29GYXIgPSB0YXJnZXRQcm9wICYmIHByb3AgPiB0YXJnZXRQcm9wO1xuICAgICAgICBjb25zdCBpc1RhcmdldFByb3BNYXRjaGVkID0gIWl0ZXJhdGVkVG9vRmFyICYmIHByb3AgPT09IHRhcmdldFByb3A7XG4gICAgICAgIGNvbnN0IHZhbHVlID0gZ2V0TWFwVmFsdWUoc3R5bGluZ01hcEFyciwgY3Vyc29yKTtcbiAgICAgICAgY29uc3QgdmFsdWVJc0RlZmluZWQgPSBpc1N0eWxpbmdWYWx1ZURlZmluZWQodmFsdWUpO1xuXG4gICAgICAgIC8vIHRoZSByZWN1cnNpdmUgY29kZSBpcyBkZXNpZ25lZCB0byBrZWVwIGFwcGx5aW5nIHVudGlsXG4gICAgICAgIC8vIGl0IHJlYWNoZXMgb3IgZ29lcyBwYXN0IHRoZSB0YXJnZXQgcHJvcC4gSWYgYW5kIHdoZW5cbiAgICAgICAgLy8gdGhpcyBoYXBwZW5zIHRoZW4gaXQgd2lsbCBzdG9wIHByb2Nlc3NpbmcgdmFsdWVzLCBidXRcbiAgICAgICAgLy8gYWxsIG90aGVyIG1hcCB2YWx1ZXMgbXVzdCBhbHNvIGNhdGNoIHVwIHRvIHRoZSBzYW1lXG4gICAgICAgIC8vIHBvaW50LiBUaGlzIGlzIHdoeSBhIHJlY3Vyc2l2ZSBjYWxsIGlzIHN0aWxsIGlzc3VlZFxuICAgICAgICAvLyBldmVuIGlmIHRoZSBjb2RlIGhhcyBpdGVyYXRlZCB0b28gZmFyLlxuICAgICAgICBjb25zdCBpbm5lck1vZGUgPVxuICAgICAgICAgICAgaXRlcmF0ZWRUb29GYXIgPyBtb2RlIDogcmVzb2x2ZUlubmVyTWFwTW9kZShtb2RlLCB2YWx1ZUlzRGVmaW5lZCwgaXNUYXJnZXRQcm9wTWF0Y2hlZCk7XG5cbiAgICAgICAgY29uc3QgaW5uZXJQcm9wID0gaXRlcmF0ZWRUb29GYXIgPyB0YXJnZXRQcm9wIDogcHJvcDtcbiAgICAgICAgbGV0IHZhbHVlQXBwbGllZCA9IHJlY3Vyc2VJbm5lck1hcHMgP1xuICAgICAgICAgICAgaW5uZXJTeW5jU3R5bGluZ01hcChcbiAgICAgICAgICAgICAgICBjb250ZXh0LCByZW5kZXJlciwgZWxlbWVudCwgZGF0YSwgYXBwbHlTdHlsaW5nRm4sIHNhbml0aXplciwgaW5uZXJNb2RlLCBpbm5lclByb3AsXG4gICAgICAgICAgICAgICAgY3VycmVudE1hcEluZGV4ICsgMSwgZGVmYXVsdFZhbHVlKSA6XG4gICAgICAgICAgICBmYWxzZTtcblxuICAgICAgICBpZiAoaXRlcmF0ZWRUb29GYXIpIHtcbiAgICAgICAgICBpZiAoIXRhcmdldFByb3BWYWx1ZVdhc0FwcGxpZWQpIHtcbiAgICAgICAgICAgIHRhcmdldFByb3BWYWx1ZVdhc0FwcGxpZWQgPSB2YWx1ZUFwcGxpZWQ7XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCF2YWx1ZUFwcGxpZWQgJiYgaXNWYWx1ZUFsbG93ZWRUb0JlQXBwbGllZChtb2RlLCBpc1RhcmdldFByb3BNYXRjaGVkKSkge1xuICAgICAgICAgIHZhbHVlQXBwbGllZCA9IHRydWU7XG5cbiAgICAgICAgICBpZiAoIWNoZWNrVmFsdWVzT25seSkge1xuICAgICAgICAgICAgY29uc3QgdXNlRGVmYXVsdCA9IGlzVGFyZ2V0UHJvcE1hdGNoZWQgJiYgIXZhbHVlSXNEZWZpbmVkO1xuICAgICAgICAgICAgY29uc3QgYmluZGluZ0luZGV4VG9BcHBseSA9IGlzVGFyZ2V0UHJvcE1hdGNoZWQgPyBiaW5kaW5nSW5kZXggOiBudWxsO1xuXG4gICAgICAgICAgICBsZXQgZmluYWxWYWx1ZTogYW55O1xuICAgICAgICAgICAgaWYgKHVzZURlZmF1bHQpIHtcbiAgICAgICAgICAgICAgZmluYWxWYWx1ZSA9IGRlZmF1bHRWYWx1ZTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGZpbmFsVmFsdWUgPSBzYW5pdGl6ZXIgP1xuICAgICAgICAgICAgICAgICAgc2FuaXRpemVyKHByb3AsIHZhbHVlLCBTdHlsZVNhbml0aXplTW9kZS5WYWxpZGF0ZUFuZFNhbml0aXplKSA6XG4gICAgICAgICAgICAgICAgICAodmFsdWUgPyB1bndyYXBTYWZlVmFsdWUodmFsdWUpIDogbnVsbCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGFwcGx5U3R5bGluZ0ZuKHJlbmRlcmVyLCBlbGVtZW50LCBwcm9wLCBmaW5hbFZhbHVlLCBiaW5kaW5nSW5kZXhUb0FwcGx5KTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB0YXJnZXRQcm9wVmFsdWVXYXNBcHBsaWVkID0gdmFsdWVBcHBsaWVkICYmIGlzVGFyZ2V0UHJvcE1hdGNoZWQ7XG4gICAgICAgIGN1cnNvciArPSBTdHlsaW5nTWFwQXJyYXlJbmRleC5UdXBsZVNpemU7XG4gICAgICB9XG4gICAgICBzZXRDdXJyZW50U3luY0N1cnNvcihjdXJyZW50TWFwSW5kZXgsIGN1cnNvcik7XG5cbiAgICAgIC8vIHRoaXMgaXMgYSBmYWxsYmFjayBjYXNlIGluIHRoZSBldmVudCB0aGF0IHRoZSBzdHlsaW5nIG1hcCBpcyBgbnVsbGAgZm9yIHRoaXNcbiAgICAgIC8vIGJpbmRpbmcgYnV0IHRoZXJlIGFyZSBvdGhlciBtYXAtYmFzZWQgYmluZGluZ3MgdGhhdCBuZWVkIHRvIGJlIGV2YWx1YXRlZFxuICAgICAgLy8gYWZ0ZXJ3YXJkcy4gSWYgdGhlIGBwcm9wYCB2YWx1ZSBpcyBmYWxzeSB0aGVuIHRoZSBpbnRlbnRpb24gaXMgdG8gY3ljbGVcbiAgICAgIC8vIHRocm91Z2ggYWxsIG9mIHRoZSBwcm9wZXJ0aWVzIGluIHRoZSByZW1haW5pbmcgbWFwcyBhcyB3ZWxsLiBJZiB0aGUgY3VycmVudFxuICAgICAgLy8gc3R5bGluZyBtYXAgaXMgdG9vIHNob3J0IHRoZW4gdGhlcmUgYXJlIG5vIHZhbHVlcyB0byBpdGVyYXRlIG92ZXIuIEluIGVpdGhlclxuICAgICAgLy8gY2FzZSB0aGUgZm9sbG93LXVwIG1hcHMgbmVlZCB0byBiZSBpdGVyYXRlZCBvdmVyLlxuICAgICAgaWYgKHJlY3Vyc2VJbm5lck1hcHMgJiZcbiAgICAgICAgICAoc3R5bGluZ01hcEFyci5sZW5ndGggPT09IFN0eWxpbmdNYXBBcnJheUluZGV4LlZhbHVlc1N0YXJ0UG9zaXRpb24gfHwgIXRhcmdldFByb3ApKSB7XG4gICAgICAgIHRhcmdldFByb3BWYWx1ZVdhc0FwcGxpZWQgPSBpbm5lclN5bmNTdHlsaW5nTWFwKFxuICAgICAgICAgICAgY29udGV4dCwgcmVuZGVyZXIsIGVsZW1lbnQsIGRhdGEsIGFwcGx5U3R5bGluZ0ZuLCBzYW5pdGl6ZXIsIG1vZGUsIHRhcmdldFByb3AsXG4gICAgICAgICAgICBjdXJyZW50TWFwSW5kZXggKyAxLCBkZWZhdWx0VmFsdWUpO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAocmVjdXJzZUlubmVyTWFwcykge1xuICAgICAgdGFyZ2V0UHJvcFZhbHVlV2FzQXBwbGllZCA9IGlubmVyU3luY1N0eWxpbmdNYXAoXG4gICAgICAgICAgY29udGV4dCwgcmVuZGVyZXIsIGVsZW1lbnQsIGRhdGEsIGFwcGx5U3R5bGluZ0ZuLCBzYW5pdGl6ZXIsIG1vZGUsIHRhcmdldFByb3AsXG4gICAgICAgICAgY3VycmVudE1hcEluZGV4ICsgMSwgZGVmYXVsdFZhbHVlKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gdGFyZ2V0UHJvcFZhbHVlV2FzQXBwbGllZDtcbn1cblxuLyoqXG4gKiBVc2VkIHRvIGRldGVybWluZSB0aGUgbW9kZSBmb3IgdGhlIGlubmVyIHJlY3Vyc2l2ZSBjYWxsLlxuICpcbiAqIElmIGFuIGlubmVyIG1hcCBpcyBpdGVyYXRlZCBvbiB0aGVuIHRoaXMgaXMgZG9uZSBzbyBmb3Igb25lXG4gKiBvZiB0d28gcmVhc29uczpcbiAqXG4gKiAtIHZhbHVlIGlzIGJlaW5nIGFwcGxpZWQ6XG4gKiAgIGlmIHRoZSB2YWx1ZSBpcyBiZWluZyBhcHBsaWVkIGZyb20gdGhpcyBjdXJyZW50IHN0eWxpbmdcbiAqICAgbWFwIHRoZW4gdGhlcmUgaXMgbm8gbmVlZCB0byBhcHBseSBpdCBpbiBhIGRlZXBlciBtYXBcbiAqICAgKGkuZS4gdGhlIGBTa2lwVGFyZ2V0UHJvcGAgZmxhZyBpcyBzZXQpXG4gKlxuICogLSB2YWx1ZSBpcyBiZWluZyBub3QgYXBwbGllZDpcbiAqICAgYXBwbHkgdGhlIHZhbHVlIGlmIGl0IGlzIGZvdW5kIGluIGEgZGVlcGVyIG1hcC5cbiAqICAgKGkuZS4gdGhlIGBTa2lwVGFyZ2V0UHJvcGAgZmxhZyBpcyB1bnNldClcbiAqXG4gKiBXaGVuIHRoZXNlIHJlYXNvbnMgYXJlIGVuY291bnRlcmVkIHRoZSBmbGFncyB3aWxsIGZvciB0aGVcbiAqIGlubmVyIG1hcCBtb2RlIHdpbGwgYmUgY29uZmlndXJlZC5cbiAqL1xuZnVuY3Rpb24gcmVzb2x2ZUlubmVyTWFwTW9kZShcbiAgICBjdXJyZW50TW9kZTogbnVtYmVyLCB2YWx1ZUlzRGVmaW5lZDogYm9vbGVhbiwgaXNUYXJnZXRQcm9wTWF0Y2hlZDogYm9vbGVhbik6IG51bWJlciB7XG4gIGxldCBpbm5lck1vZGUgPSBjdXJyZW50TW9kZTtcblxuICAvLyB0aGUgc3RhdGVtZW50cyBiZWxvdyBmaWd1cmVzIG91dCB3aGV0aGVyIG9yIG5vdCBhbiBpbm5lciBzdHlsaW5nIG1hcFxuICAvLyBpcyBhbGxvd2VkIHRvIGFwcGx5IGl0cyB2YWx1ZSBvciBub3QuIFRoZSBtYWluIHRoaW5nIHRvIGtlZXAgbm90ZVxuICAvLyBvZiBpcyB0aGF0IGlmIHRoZSB0YXJnZXQgcHJvcCBpc24ndCBtYXRjaGVkIHRoZW4gaXRzIGV4cGVjdGVkIHRoYXRcbiAgLy8gYWxsIHZhbHVlcyBiZWZvcmUgaXQgYXJlIGFsbG93ZWQgdG8gYmUgYXBwbGllZCBzbyBsb25nIGFzIFwiYXBwbHkgYWxsIHZhbHVlc1wiXG4gIC8vIGlzIHNldCB0byB0cnVlLlxuICBjb25zdCBhcHBseUFsbFZhbHVlcyA9IGN1cnJlbnRNb2RlICYgU3R5bGluZ01hcHNTeW5jTW9kZS5BcHBseUFsbFZhbHVlcztcbiAgY29uc3QgYXBwbHlUYXJnZXRQcm9wID0gY3VycmVudE1vZGUgJiBTdHlsaW5nTWFwc1N5bmNNb2RlLkFwcGx5VGFyZ2V0UHJvcDtcbiAgY29uc3QgYWxsb3dJbm5lckFwcGx5ID1cbiAgICAgICF2YWx1ZUlzRGVmaW5lZCAmJiAoaXNUYXJnZXRQcm9wTWF0Y2hlZCA/IGFwcGx5VGFyZ2V0UHJvcCA6IGFwcGx5QWxsVmFsdWVzKTtcblxuICBpZiAoYWxsb3dJbm5lckFwcGx5KSB7XG4gICAgLy8gY2FzZSAxOiBzZXQgdGhlIG1vZGUgdG8gYXBwbHkgdGhlIHRhcmdldGVkIHByb3AgdmFsdWUgaWYgaXRcbiAgICAvLyBlbmRzIHVwIGJlaW5nIGVuY291bnRlcmVkIGluIGFub3RoZXIgbWFwIHZhbHVlXG4gICAgaW5uZXJNb2RlIHw9IFN0eWxpbmdNYXBzU3luY01vZGUuQXBwbHlUYXJnZXRQcm9wO1xuICAgIGlubmVyTW9kZSAmPSB+U3R5bGluZ01hcHNTeW5jTW9kZS5Ta2lwVGFyZ2V0UHJvcDtcbiAgfSBlbHNlIHtcbiAgICAvLyBjYXNlIDI6IHNldCB0aGUgbW9kZSB0byBza2lwIHRoZSB0YXJnZXRlZCBwcm9wIHZhbHVlIGlmIGl0XG4gICAgLy8gZW5kcyB1cCBiZWluZyBlbmNvdW50ZXJlZCBpbiBhbm90aGVyIG1hcCB2YWx1ZVxuICAgIGlubmVyTW9kZSB8PSBTdHlsaW5nTWFwc1N5bmNNb2RlLlNraXBUYXJnZXRQcm9wO1xuICAgIGlubmVyTW9kZSAmPSB+U3R5bGluZ01hcHNTeW5jTW9kZS5BcHBseVRhcmdldFByb3A7XG4gIH1cblxuICByZXR1cm4gaW5uZXJNb2RlO1xufVxuXG4vKipcbiAqIERlY2lkZXMgd2hldGhlciBvciBub3QgYSBwcm9wL3ZhbHVlIGVudHJ5IHdpbGwgYmUgYXBwbGllZCB0byBhbiBlbGVtZW50LlxuICpcbiAqIFRvIGRldGVybWluZSB3aGV0aGVyIG9yIG5vdCBhIHZhbHVlIGlzIHRvIGJlIGFwcGxpZWQsXG4gKiB0aGUgZm9sbG93aW5nIHByb2NlZHVyZSBpcyBldmFsdWF0ZWQ6XG4gKlxuICogRmlyc3QgY2hlY2sgdG8gc2VlIHRoZSBjdXJyZW50IGBtb2RlYCBzdGF0dXM6XG4gKiAgMS4gSWYgdGhlIG1vZGUgdmFsdWUgcGVybWl0cyBhbGwgcHJvcHMgdG8gYmUgYXBwbGllZCB0aGVuIGFsbG93LlxuICogICAgLSBCdXQgZG8gbm90IGFsbG93IGlmIHRoZSBjdXJyZW50IHByb3AgaXMgc2V0IHRvIGJlIHNraXBwZWQuXG4gKiAgMi4gT3RoZXJ3aXNlIGlmIHRoZSBjdXJyZW50IHByb3AgaXMgcGVybWl0dGVkIHRoZW4gYWxsb3cuXG4gKi9cbmZ1bmN0aW9uIGlzVmFsdWVBbGxvd2VkVG9CZUFwcGxpZWQobW9kZTogU3R5bGluZ01hcHNTeW5jTW9kZSwgaXNUYXJnZXRQcm9wTWF0Y2hlZDogYm9vbGVhbikge1xuICBsZXQgZG9BcHBseVZhbHVlID0gKG1vZGUgJiBTdHlsaW5nTWFwc1N5bmNNb2RlLkFwcGx5QWxsVmFsdWVzKSAhPT0gMDtcbiAgaWYgKCFkb0FwcGx5VmFsdWUpIHtcbiAgICBpZiAobW9kZSAmIFN0eWxpbmdNYXBzU3luY01vZGUuQXBwbHlUYXJnZXRQcm9wKSB7XG4gICAgICBkb0FwcGx5VmFsdWUgPSBpc1RhcmdldFByb3BNYXRjaGVkO1xuICAgIH1cbiAgfSBlbHNlIGlmICgobW9kZSAmIFN0eWxpbmdNYXBzU3luY01vZGUuU2tpcFRhcmdldFByb3ApICYmIGlzVGFyZ2V0UHJvcE1hdGNoZWQpIHtcbiAgICBkb0FwcGx5VmFsdWUgPSBmYWxzZTtcbiAgfVxuICByZXR1cm4gZG9BcHBseVZhbHVlO1xufVxuXG4vKipcbiAqIFVzZWQgdG8ga2VlcCB0cmFjayBvZiBjb25jdXJyZW50IGN1cnNvciB2YWx1ZXMgZm9yIG11bHRpcGxlIG1hcC1iYXNlZCBzdHlsaW5nIGJpbmRpbmdzIHByZXNlbnQgb25cbiAqIGFuIGVsZW1lbnQuXG4gKi9cbmNvbnN0IE1BUF9DVVJTT1JTOiBudW1iZXJbXSA9IFtdO1xuXG4vKipcbiAqIFVzZWQgdG8gcmVzZXQgdGhlIHN0YXRlIG9mIGVhY2ggY3Vyc29yIHZhbHVlIGJlaW5nIHVzZWQgdG8gaXRlcmF0ZSBvdmVyIG1hcC1iYXNlZCBzdHlsaW5nXG4gKiBiaW5kaW5ncy5cbiAqL1xuZnVuY3Rpb24gcmVzZXRTeW5jQ3Vyc29ycygpIHtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBNQVBfQ1VSU09SUy5sZW5ndGg7IGkrKykge1xuICAgIE1BUF9DVVJTT1JTW2ldID0gU3R5bGluZ01hcEFycmF5SW5kZXguVmFsdWVzU3RhcnRQb3NpdGlvbjtcbiAgfVxufVxuXG4vKipcbiAqIFJldHVybnMgYW4gYWN0aXZlIGN1cnNvciB2YWx1ZSBhdCBhIGdpdmVuIG1hcEluZGV4IGxvY2F0aW9uLlxuICovXG5mdW5jdGlvbiBnZXRDdXJyZW50U3luY0N1cnNvcihtYXBJbmRleDogbnVtYmVyKSB7XG4gIGlmIChtYXBJbmRleCA+PSBNQVBfQ1VSU09SUy5sZW5ndGgpIHtcbiAgICBNQVBfQ1VSU09SUy5wdXNoKFN0eWxpbmdNYXBBcnJheUluZGV4LlZhbHVlc1N0YXJ0UG9zaXRpb24pO1xuICB9XG4gIHJldHVybiBNQVBfQ1VSU09SU1ttYXBJbmRleF07XG59XG5cbi8qKlxuICogU2V0cyBhIGN1cnNvciB2YWx1ZSBhdCBhIGdpdmVuIG1hcEluZGV4IGxvY2F0aW9uLlxuICovXG5mdW5jdGlvbiBzZXRDdXJyZW50U3luY0N1cnNvcihtYXBJbmRleDogbnVtYmVyLCBpbmRleFZhbHVlOiBudW1iZXIpIHtcbiAgTUFQX0NVUlNPUlNbbWFwSW5kZXhdID0gaW5kZXhWYWx1ZTtcbn1cbiJdfQ==