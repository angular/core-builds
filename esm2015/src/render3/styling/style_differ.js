/**
 * @fileoverview added by tsickle
 * Generated from: packages/core/src/render3/styling/style_differ.ts
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
* @license
* Copyright Google Inc. All Rights Reserved.
*
* Use of this source code is governed by an MIT-style license that can be
* found in the LICENSE file at https://angular.io/license
*/
import { getLastParsedKey, getLastParsedValue, getLastParsedValueEnd, parseStyle, parseStyleNext, resetParserState } from './styling_parser';
/**
 * Computes the diff between two style strings.
 *
 * Example:
 *  `oldValue` => `"a: 1; b: 2, c: 3"`
 *  `newValue` => `"b: 2; c: 4; d: 5;"`
 * will result in:
 * ```
 * changes = Map(
 *   'a', { old:  '1', new: null },
 *   'b', { old:  '2', new:  '2' },
 *   'c', { old:  '3', new:  '4' },
 *   'd', { old: null, new:  '5' },
 * )
 * ``
 *
 * @param {?} oldValue Previous style string.
 * @param {?} newValue New style string.
 * @return {?} `StyleChangesArrayMap`.
 */
export function computeStyleChanges(oldValue, newValue) {
    /** @type {?} */
    const changes = new Map();
    parseKeyValue(oldValue, changes, false);
    parseKeyValue(newValue, changes, true);
    return changes;
}
/**
 * Splits the style list into array, ignoring whitespace and add it to corresponding categories
 * changes.
 *
 * @param {?} text Style list to split
 * @param {?} changes Where changes will be stored.
 * @param {?} isNewValue `true` if parsing new value (effects how values get added to `changes`)
 * @return {?}
 */
export function parseKeyValue(text, changes, isNewValue) {
    for (let i = parseStyle(text); i >= 0; i = parseStyleNext(text, i)) {
        processStyleKeyValue(changes, getLastParsedKey(text), getLastParsedValue(text), isNewValue);
    }
}
/**
 * Appends style `key`/`value` information into the list of `changes`.
 *
 * Once all of the parsing is complete, the `changes` will contain a
 * set of operations which need to be performed on the DOM to reconcile it.
 *
 * @param {?} changes An `StyleChangesMap which tracks changes.
 * @param {?} key Style key to be added to the `changes`.
 * @param {?} value Style value to be added to the `changes`.
 * @param {?} isNewValue true if `key`/`value` should be processed as new value.
 * @return {?}
 */
function processStyleKeyValue(changes, key, value, isNewValue) {
    if (isNewValue) {
        // This code path is executed when we are iterating over new values.
        /** @type {?} */
        const existing = changes.get(key);
        if (existing === undefined) {
            // Key we have not seen before
            changes.set(key, styleKeyValue(null, value));
        }
        else {
            // Already seen, update value.
            existing.new = value;
        }
    }
    else {
        // This code path is executed when we are iteration over previous values.
        changes.set(key, styleKeyValue(value, null));
    }
}
/**
 * @param {?} oldValue
 * @param {?} newValue
 * @return {?}
 */
function styleKeyValue(oldValue, newValue) {
    return { old: oldValue, new: newValue };
}
/**
 * Removes a style from a `cssText` string.
 *
 * @param {?} cssText A string which contains styling.
 * @param {?} styleToRemove A style (and its value) to remove from `cssText`.
 * @return {?} a new style text which does not have `styleToRemove` (and its value)
 */
export function removeStyle(cssText, styleToRemove) {
    if (cssText.indexOf(styleToRemove) === -1) {
        // happy case where we don't need to invoke parser.
        return cssText;
    }
    /** @type {?} */
    let lastValueEnd = 0;
    for (let i = parseStyle(cssText); i >= 0; i = parseStyleNext(cssText, i)) {
        /** @type {?} */
        const key = getLastParsedKey(cssText);
        if (key === styleToRemove) {
            if (lastValueEnd === 0) {
                cssText = cssText.substring(i);
                i = 0;
            }
            else if (i === cssText.length) {
                return cssText.substring(0, lastValueEnd);
            }
            else {
                cssText = cssText.substring(0, lastValueEnd) + '; ' + cssText.substring(i);
                i = lastValueEnd + 2; // 2 is for '; '.length(so that we skip the separator)
            }
            resetParserState(cssText);
        }
        lastValueEnd = getLastParsedValueEnd();
    }
    return cssText;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3R5bGVfZGlmZmVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9zdHlsaW5nL3N0eWxlX2RpZmZlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFRQSxPQUFPLEVBQUMsZ0JBQWdCLEVBQUUsa0JBQWtCLEVBQUUscUJBQXFCLEVBQUUsVUFBVSxFQUFFLGNBQWMsRUFBRSxnQkFBZ0IsRUFBQyxNQUFNLGtCQUFrQixDQUFDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFtQzNJLE1BQU0sVUFBVSxtQkFBbUIsQ0FBQyxRQUFnQixFQUFFLFFBQWdCOztVQUM5RCxPQUFPLEdBQW9CLElBQUksR0FBRyxFQUFvRDtJQUM1RixhQUFhLENBQUMsUUFBUSxFQUFFLE9BQU8sRUFBRSxLQUFLLENBQUMsQ0FBQztJQUN4QyxhQUFhLENBQUMsUUFBUSxFQUFFLE9BQU8sRUFBRSxJQUFJLENBQUMsQ0FBQztJQUN2QyxPQUFPLE9BQU8sQ0FBQztBQUNqQixDQUFDOzs7Ozs7Ozs7O0FBVUQsTUFBTSxVQUFVLGFBQWEsQ0FBQyxJQUFZLEVBQUUsT0FBd0IsRUFBRSxVQUFtQjtJQUN2RixLQUFLLElBQUksQ0FBQyxHQUFHLFVBQVUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsR0FBRyxjQUFjLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxFQUFFO1FBQ2xFLG9CQUFvQixDQUFDLE9BQU8sRUFBRSxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsRUFBRSxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsRUFBRSxVQUFVLENBQUMsQ0FBQztLQUM3RjtBQUNILENBQUM7Ozs7Ozs7Ozs7Ozs7QUFhRCxTQUFTLG9CQUFvQixDQUN6QixPQUF3QixFQUFFLEdBQVcsRUFBRSxLQUFhLEVBQUUsVUFBbUI7SUFDM0UsSUFBSSxVQUFVLEVBQUU7OztjQUVSLFFBQVEsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQztRQUNqQyxJQUFJLFFBQVEsS0FBSyxTQUFTLEVBQUU7WUFDMUIsOEJBQThCO1lBQzlCLE9BQU8sQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLGFBQWEsQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQztTQUM5QzthQUFNO1lBQ0wsOEJBQThCO1lBQzlCLFFBQVEsQ0FBQyxHQUFHLEdBQUcsS0FBSyxDQUFDO1NBQ3RCO0tBQ0Y7U0FBTTtRQUNMLHlFQUF5RTtRQUN6RSxPQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxhQUFhLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7S0FDOUM7QUFDSCxDQUFDOzs7Ozs7QUFFRCxTQUFTLGFBQWEsQ0FBQyxRQUF1QixFQUFFLFFBQXVCO0lBQ3JFLE9BQU8sRUFBQyxHQUFHLEVBQUUsUUFBUSxFQUFFLEdBQUcsRUFBRSxRQUFRLEVBQUMsQ0FBQztBQUN4QyxDQUFDOzs7Ozs7OztBQVNELE1BQU0sVUFBVSxXQUFXLENBQUMsT0FBZSxFQUFFLGFBQXFCO0lBQ2hFLElBQUksT0FBTyxDQUFDLE9BQU8sQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRTtRQUN6QyxtREFBbUQ7UUFDbkQsT0FBTyxPQUFPLENBQUM7S0FDaEI7O1FBQ0csWUFBWSxHQUFHLENBQUM7SUFDcEIsS0FBSyxJQUFJLENBQUMsR0FBRyxVQUFVLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLEdBQUcsY0FBYyxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUMsRUFBRTs7Y0FDbEUsR0FBRyxHQUFHLGdCQUFnQixDQUFDLE9BQU8sQ0FBQztRQUNyQyxJQUFJLEdBQUcsS0FBSyxhQUFhLEVBQUU7WUFDekIsSUFBSSxZQUFZLEtBQUssQ0FBQyxFQUFFO2dCQUN0QixPQUFPLEdBQUcsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDL0IsQ0FBQyxHQUFHLENBQUMsQ0FBQzthQUNQO2lCQUFNLElBQUksQ0FBQyxLQUFLLE9BQU8sQ0FBQyxNQUFNLEVBQUU7Z0JBQy9CLE9BQU8sT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsWUFBWSxDQUFDLENBQUM7YUFDM0M7aUJBQU07Z0JBQ0wsT0FBTyxHQUFHLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUFFLFlBQVksQ0FBQyxHQUFHLElBQUksR0FBRyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUMzRSxDQUFDLEdBQUcsWUFBWSxHQUFHLENBQUMsQ0FBQyxDQUFFLHNEQUFzRDthQUM5RTtZQUNELGdCQUFnQixDQUFDLE9BQU8sQ0FBQyxDQUFDO1NBQzNCO1FBQ0QsWUFBWSxHQUFHLHFCQUFxQixFQUFFLENBQUM7S0FDeEM7SUFDRCxPQUFPLE9BQU8sQ0FBQztBQUNqQixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4qIEBsaWNlbnNlXG4qIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuKlxuKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4qL1xuXG5pbXBvcnQge2dldExhc3RQYXJzZWRLZXksIGdldExhc3RQYXJzZWRWYWx1ZSwgZ2V0TGFzdFBhcnNlZFZhbHVlRW5kLCBwYXJzZVN0eWxlLCBwYXJzZVN0eWxlTmV4dCwgcmVzZXRQYXJzZXJTdGF0ZX0gZnJvbSAnLi9zdHlsaW5nX3BhcnNlcic7XG5cbi8qKlxuICogU3RvcmVzIGNoYW5nZXMgdG8gU3R5bGUgdmFsdWVzLlxuICogLSBga2V5YDogc3R5bGUgbmFtZS5cbiAqIC0gYHZhbHVlYDpcbiAqICAgLSBgb2xkYDogcHJldmlvdXMgdmFsdWUgKG9yIGBudWxsYClcbiAqICAgLSBgbmV3YDogbmV3IHZhbHVlIChvciBgbnVsbGApLlxuICpcbiAqIElmIGBvbGQgPT09IG5ld2AgZG8gbm90aGluZy5cbiAqIElmIGBvbGQgPT09IG51bGxgIHRoZW4gYWRkIGBuZXdgLlxuICogSWYgYG5ldyA9PT0gbnVsbGAgdGhlbiByZW1vdmUgYG9sZGAuXG4gKi9cbmV4cG9ydCB0eXBlIFN0eWxlQ2hhbmdlc01hcCA9IE1hcDxzdHJpbmcsIHtvbGQ6IHN0cmluZyB8IG51bGwsIG5ldzogc3RyaW5nIHwgbnVsbH0+O1xuXG4vKipcbiAqIENvbXB1dGVzIHRoZSBkaWZmIGJldHdlZW4gdHdvIHN0eWxlIHN0cmluZ3MuXG4gKlxuICogRXhhbXBsZTpcbiAqICBgb2xkVmFsdWVgID0+IGBcImE6IDE7IGI6IDIsIGM6IDNcImBcbiAqICBgbmV3VmFsdWVgID0+IGBcImI6IDI7IGM6IDQ7IGQ6IDU7XCJgXG4gKiB3aWxsIHJlc3VsdCBpbjpcbiAqIGBgYFxuICogY2hhbmdlcyA9IE1hcChcbiAqICAgJ2EnLCB7IG9sZDogICcxJywgbmV3OiBudWxsIH0sXG4gKiAgICdiJywgeyBvbGQ6ICAnMicsIG5ldzogICcyJyB9LFxuICogICAnYycsIHsgb2xkOiAgJzMnLCBuZXc6ICAnNCcgfSxcbiAqICAgJ2QnLCB7IG9sZDogbnVsbCwgbmV3OiAgJzUnIH0sXG4gKiApXG4gKiBgYFxuICpcbiAqIEBwYXJhbSBvbGRWYWx1ZSBQcmV2aW91cyBzdHlsZSBzdHJpbmcuXG4gKiBAcGFyYW0gbmV3VmFsdWUgTmV3IHN0eWxlIHN0cmluZy5cbiAqIEByZXR1cm5zIGBTdHlsZUNoYW5nZXNBcnJheU1hcGAuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb21wdXRlU3R5bGVDaGFuZ2VzKG9sZFZhbHVlOiBzdHJpbmcsIG5ld1ZhbHVlOiBzdHJpbmcpOiBTdHlsZUNoYW5nZXNNYXAge1xuICBjb25zdCBjaGFuZ2VzOiBTdHlsZUNoYW5nZXNNYXAgPSBuZXcgTWFwPHN0cmluZywge29sZDogc3RyaW5nIHwgbnVsbCwgbmV3OiBzdHJpbmcgfCBudWxsfT4oKTtcbiAgcGFyc2VLZXlWYWx1ZShvbGRWYWx1ZSwgY2hhbmdlcywgZmFsc2UpO1xuICBwYXJzZUtleVZhbHVlKG5ld1ZhbHVlLCBjaGFuZ2VzLCB0cnVlKTtcbiAgcmV0dXJuIGNoYW5nZXM7XG59XG5cbi8qKlxuICogU3BsaXRzIHRoZSBzdHlsZSBsaXN0IGludG8gYXJyYXksIGlnbm9yaW5nIHdoaXRlc3BhY2UgYW5kIGFkZCBpdCB0byBjb3JyZXNwb25kaW5nIGNhdGVnb3JpZXNcbiAqIGNoYW5nZXMuXG4gKlxuICogQHBhcmFtIHRleHQgU3R5bGUgbGlzdCB0byBzcGxpdFxuICogQHBhcmFtIGNoYW5nZXMgV2hlcmUgY2hhbmdlcyB3aWxsIGJlIHN0b3JlZC5cbiAqIEBwYXJhbSBpc05ld1ZhbHVlIGB0cnVlYCBpZiBwYXJzaW5nIG5ldyB2YWx1ZSAoZWZmZWN0cyBob3cgdmFsdWVzIGdldCBhZGRlZCB0byBgY2hhbmdlc2ApXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZUtleVZhbHVlKHRleHQ6IHN0cmluZywgY2hhbmdlczogU3R5bGVDaGFuZ2VzTWFwLCBpc05ld1ZhbHVlOiBib29sZWFuKTogdm9pZCB7XG4gIGZvciAobGV0IGkgPSBwYXJzZVN0eWxlKHRleHQpOyBpID49IDA7IGkgPSBwYXJzZVN0eWxlTmV4dCh0ZXh0LCBpKSkge1xuICAgIHByb2Nlc3NTdHlsZUtleVZhbHVlKGNoYW5nZXMsIGdldExhc3RQYXJzZWRLZXkodGV4dCksIGdldExhc3RQYXJzZWRWYWx1ZSh0ZXh0KSwgaXNOZXdWYWx1ZSk7XG4gIH1cbn1cblxuLyoqXG4gKiBBcHBlbmRzIHN0eWxlIGBrZXlgL2B2YWx1ZWAgaW5mb3JtYXRpb24gaW50byB0aGUgbGlzdCBvZiBgY2hhbmdlc2AuXG4gKlxuICogT25jZSBhbGwgb2YgdGhlIHBhcnNpbmcgaXMgY29tcGxldGUsIHRoZSBgY2hhbmdlc2Agd2lsbCBjb250YWluIGFcbiAqIHNldCBvZiBvcGVyYXRpb25zIHdoaWNoIG5lZWQgdG8gYmUgcGVyZm9ybWVkIG9uIHRoZSBET00gdG8gcmVjb25jaWxlIGl0LlxuICpcbiAqIEBwYXJhbSBjaGFuZ2VzIEFuIGBTdHlsZUNoYW5nZXNNYXAgd2hpY2ggdHJhY2tzIGNoYW5nZXMuXG4gKiBAcGFyYW0ga2V5IFN0eWxlIGtleSB0byBiZSBhZGRlZCB0byB0aGUgYGNoYW5nZXNgLlxuICogQHBhcmFtIHZhbHVlIFN0eWxlIHZhbHVlIHRvIGJlIGFkZGVkIHRvIHRoZSBgY2hhbmdlc2AuXG4gKiBAcGFyYW0gaXNOZXdWYWx1ZSB0cnVlIGlmIGBrZXlgL2B2YWx1ZWAgc2hvdWxkIGJlIHByb2Nlc3NlZCBhcyBuZXcgdmFsdWUuXG4gKi9cbmZ1bmN0aW9uIHByb2Nlc3NTdHlsZUtleVZhbHVlKFxuICAgIGNoYW5nZXM6IFN0eWxlQ2hhbmdlc01hcCwga2V5OiBzdHJpbmcsIHZhbHVlOiBzdHJpbmcsIGlzTmV3VmFsdWU6IGJvb2xlYW4pOiB2b2lkIHtcbiAgaWYgKGlzTmV3VmFsdWUpIHtcbiAgICAvLyBUaGlzIGNvZGUgcGF0aCBpcyBleGVjdXRlZCB3aGVuIHdlIGFyZSBpdGVyYXRpbmcgb3ZlciBuZXcgdmFsdWVzLlxuICAgIGNvbnN0IGV4aXN0aW5nID0gY2hhbmdlcy5nZXQoa2V5KTtcbiAgICBpZiAoZXhpc3RpbmcgPT09IHVuZGVmaW5lZCkge1xuICAgICAgLy8gS2V5IHdlIGhhdmUgbm90IHNlZW4gYmVmb3JlXG4gICAgICBjaGFuZ2VzLnNldChrZXksIHN0eWxlS2V5VmFsdWUobnVsbCwgdmFsdWUpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gQWxyZWFkeSBzZWVuLCB1cGRhdGUgdmFsdWUuXG4gICAgICBleGlzdGluZy5uZXcgPSB2YWx1ZTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgLy8gVGhpcyBjb2RlIHBhdGggaXMgZXhlY3V0ZWQgd2hlbiB3ZSBhcmUgaXRlcmF0aW9uIG92ZXIgcHJldmlvdXMgdmFsdWVzLlxuICAgIGNoYW5nZXMuc2V0KGtleSwgc3R5bGVLZXlWYWx1ZSh2YWx1ZSwgbnVsbCkpO1xuICB9XG59XG5cbmZ1bmN0aW9uIHN0eWxlS2V5VmFsdWUob2xkVmFsdWU6IHN0cmluZyB8IG51bGwsIG5ld1ZhbHVlOiBzdHJpbmcgfCBudWxsKSB7XG4gIHJldHVybiB7b2xkOiBvbGRWYWx1ZSwgbmV3OiBuZXdWYWx1ZX07XG59XG5cbi8qKlxuICogUmVtb3ZlcyBhIHN0eWxlIGZyb20gYSBgY3NzVGV4dGAgc3RyaW5nLlxuICpcbiAqIEBwYXJhbSBjc3NUZXh0IEEgc3RyaW5nIHdoaWNoIGNvbnRhaW5zIHN0eWxpbmcuXG4gKiBAcGFyYW0gc3R5bGVUb1JlbW92ZSBBIHN0eWxlIChhbmQgaXRzIHZhbHVlKSB0byByZW1vdmUgZnJvbSBgY3NzVGV4dGAuXG4gKiBAcmV0dXJucyBhIG5ldyBzdHlsZSB0ZXh0IHdoaWNoIGRvZXMgbm90IGhhdmUgYHN0eWxlVG9SZW1vdmVgIChhbmQgaXRzIHZhbHVlKVxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVtb3ZlU3R5bGUoY3NzVGV4dDogc3RyaW5nLCBzdHlsZVRvUmVtb3ZlOiBzdHJpbmcpOiBzdHJpbmcge1xuICBpZiAoY3NzVGV4dC5pbmRleE9mKHN0eWxlVG9SZW1vdmUpID09PSAtMSkge1xuICAgIC8vIGhhcHB5IGNhc2Ugd2hlcmUgd2UgZG9uJ3QgbmVlZCB0byBpbnZva2UgcGFyc2VyLlxuICAgIHJldHVybiBjc3NUZXh0O1xuICB9XG4gIGxldCBsYXN0VmFsdWVFbmQgPSAwO1xuICBmb3IgKGxldCBpID0gcGFyc2VTdHlsZShjc3NUZXh0KTsgaSA+PSAwOyBpID0gcGFyc2VTdHlsZU5leHQoY3NzVGV4dCwgaSkpIHtcbiAgICBjb25zdCBrZXkgPSBnZXRMYXN0UGFyc2VkS2V5KGNzc1RleHQpO1xuICAgIGlmIChrZXkgPT09IHN0eWxlVG9SZW1vdmUpIHtcbiAgICAgIGlmIChsYXN0VmFsdWVFbmQgPT09IDApIHtcbiAgICAgICAgY3NzVGV4dCA9IGNzc1RleHQuc3Vic3RyaW5nKGkpO1xuICAgICAgICBpID0gMDtcbiAgICAgIH0gZWxzZSBpZiAoaSA9PT0gY3NzVGV4dC5sZW5ndGgpIHtcbiAgICAgICAgcmV0dXJuIGNzc1RleHQuc3Vic3RyaW5nKDAsIGxhc3RWYWx1ZUVuZCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjc3NUZXh0ID0gY3NzVGV4dC5zdWJzdHJpbmcoMCwgbGFzdFZhbHVlRW5kKSArICc7ICcgKyBjc3NUZXh0LnN1YnN0cmluZyhpKTtcbiAgICAgICAgaSA9IGxhc3RWYWx1ZUVuZCArIDI7ICAvLyAyIGlzIGZvciAnOyAnLmxlbmd0aChzbyB0aGF0IHdlIHNraXAgdGhlIHNlcGFyYXRvcilcbiAgICAgIH1cbiAgICAgIHJlc2V0UGFyc2VyU3RhdGUoY3NzVGV4dCk7XG4gICAgfVxuICAgIGxhc3RWYWx1ZUVuZCA9IGdldExhc3RQYXJzZWRWYWx1ZUVuZCgpO1xuICB9XG4gIHJldHVybiBjc3NUZXh0O1xufVxuIl19