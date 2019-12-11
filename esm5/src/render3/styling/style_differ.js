/**
* @license
* Copyright Google Inc. All Rights Reserved.
*
* Use of this source code is governed by an MIT-style license that can be
* found in the LICENSE file at https://angular.io/license
*/
import { consumeSeparator, consumeStyleKey, consumeStyleValue, consumeWhitespace } from './styling_parser';
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
 * @param oldValue Previous style string.
 * @param newValue New style string.
 * @returns `StyleChangesArrayMap`.
 */
export function computeStyleChanges(oldValue, newValue) {
    var changes = new Map();
    parseKeyValue(oldValue, changes, false);
    parseKeyValue(newValue, changes, true);
    return changes;
}
/**
 * Splits the style list into array, ignoring whitespace and add it to corresponding categories
 * changes.
 *
 * @param text Style list to split
 * @param changes Where changes will be stored.
 * @param isNewValue `true` if parsing new value (effects how values get added to `changes`)
 */
export function parseKeyValue(text, changes, isNewValue) {
    var end = text.length;
    var start = 0;
    while (start < end) {
        var keyStart = consumeWhitespace(text, start, end);
        var keyEnd = consumeStyleKey(text, keyStart, end);
        if (keyEnd === keyStart) {
            // we reached an end so just quit
            break;
        }
        var valueStart = consumeSeparator(text, keyEnd, end, 58 /* COLON */);
        var valueEnd = consumeStyleValue(text, valueStart, end);
        if (ngDevMode && valueStart === valueEnd) {
            throw malformedStyleError(text, valueStart);
        }
        start = consumeSeparator(text, valueEnd, end, 59 /* SEMI_COLON */);
        var key = text.substring(keyStart, keyEnd);
        var value = text.substring(valueStart, valueEnd);
        processStyleKeyValue(changes, key, value, isNewValue);
    }
}
/**
 * Appends style `key`/`value` information into the list of `changes`.
 *
 * Once all of the parsing is complete, the `changes` will contain a
 * set of operations which need to be performed on the DOM to reconcile it.
 *
 * @param changes An `StyleChangesMap which tracks changes.
 * @param key Style key to be added to the `changes`.
 * @param value Style value to be added to the `changes`.
 * @param isNewValue true if `key`/`value` should be processed as new value.
 */
function processStyleKeyValue(changes, key, value, isNewValue) {
    if (isNewValue) {
        // This code path is executed when we are iterating over new values.
        var existing = changes.get(key);
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
function styleKeyValue(oldValue, newValue) {
    return { old: oldValue, new: newValue };
}
/**
 * Removes a style from a `cssText` string.
 *
 * @param cssText A string which contains styling.
 * @param styleToRemove A style (and its value) to remove from `cssText`.
 * @returns a new style text which does not have `styleToRemove` (and its value)
 */
export function removeStyle(cssText, styleToRemove) {
    var start = 0;
    var end = cssText.length;
    var lastValueEnd = 0;
    while (start < end) {
        var possibleKeyIndex = cssText.indexOf(styleToRemove, start);
        if (possibleKeyIndex === -1) {
            // we did not find anything, so just bail.
            break;
        }
        while (start < possibleKeyIndex + 1) {
            var keyStart = consumeWhitespace(cssText, start, end);
            var keyEnd = consumeStyleKey(cssText, keyStart, end);
            if (keyEnd === keyStart) {
                // we reached the end
                return cssText;
            }
            var valueStart = consumeSeparator(cssText, keyEnd, end, 58 /* COLON */);
            var valueEnd = consumeStyleValue(cssText, valueStart, end);
            if (ngDevMode && valueStart === valueEnd) {
                throw malformedStyleError(cssText, valueStart);
            }
            var valueEndSep = consumeSeparator(cssText, valueEnd, end, 59 /* SEMI_COLON */);
            if (keyStart == possibleKeyIndex && keyEnd === possibleKeyIndex + styleToRemove.length) {
                if (valueEndSep == end) {
                    // This is a special case when we are the last key in a list, we then chop off the
                    // trailing separator as well.
                    cssText = cssText.substring(0, lastValueEnd);
                }
                else {
                    cssText = cssText.substring(0, keyStart) + cssText.substring(valueEndSep, end);
                }
                end = cssText.length;
                start = keyStart;
                break; // rescan.
            }
            else {
                // This was not the item we are looking for, keep going.
                start = valueEndSep;
            }
            lastValueEnd = valueEnd;
        }
    }
    return cssText;
}
function malformedStyleError(text, index) {
    return new Error("Malformed style at location " + index + " in string '" + text.substring(0, index) + '[>>' +
        text.substring(index, index + 1) + '<<]' + text.substr(index + 1) + '\'.');
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3R5bGVfZGlmZmVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9zdHlsaW5nL3N0eWxlX2RpZmZlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0VBTUU7QUFHRixPQUFPLEVBQUMsZ0JBQWdCLEVBQUUsZUFBZSxFQUFFLGlCQUFpQixFQUFFLGlCQUFpQixFQUFDLE1BQU0sa0JBQWtCLENBQUM7QUFpQnpHOzs7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBbUJHO0FBQ0gsTUFBTSxVQUFVLG1CQUFtQixDQUFDLFFBQWdCLEVBQUUsUUFBZ0I7SUFDcEUsSUFBTSxPQUFPLEdBQW9CLElBQUksR0FBRyxFQUFvRCxDQUFDO0lBQzdGLGFBQWEsQ0FBQyxRQUFRLEVBQUUsT0FBTyxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQ3hDLGFBQWEsQ0FBQyxRQUFRLEVBQUUsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQ3ZDLE9BQU8sT0FBTyxDQUFDO0FBQ2pCLENBQUM7QUFFRDs7Ozs7OztHQU9HO0FBQ0gsTUFBTSxVQUFVLGFBQWEsQ0FBQyxJQUFZLEVBQUUsT0FBd0IsRUFBRSxVQUFtQjtJQUN2RixJQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDO0lBQ3hCLElBQUksS0FBSyxHQUFHLENBQUMsQ0FBQztJQUNkLE9BQU8sS0FBSyxHQUFHLEdBQUcsRUFBRTtRQUNsQixJQUFNLFFBQVEsR0FBRyxpQkFBaUIsQ0FBQyxJQUFJLEVBQUUsS0FBSyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBQ3JELElBQU0sTUFBTSxHQUFHLGVBQWUsQ0FBQyxJQUFJLEVBQUUsUUFBUSxFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBQ3BELElBQUksTUFBTSxLQUFLLFFBQVEsRUFBRTtZQUN2QixpQ0FBaUM7WUFDakMsTUFBTTtTQUNQO1FBQ0QsSUFBTSxVQUFVLEdB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LEtBQUssR0FBRyxDQUFDLENBQUMsR0FBRyxLQUFLLENBQUMsQ0FBQztBQUNqRixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4qIEBsaWNlbnNlXG4qIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuKlxuKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4qL1xuXG5pbXBvcnQge0NoYXJDb2RlfSBmcm9tICcuLi8uLi91dGlsL2NoYXJfY29kZSc7XG5pbXBvcnQge2NvbnN1bWVTZXBhcmF0b3IsIGNvbnN1bWVTdHlsZUtleSwgY29uc3VtZVN0eWxlVmFsdWUsIGNvbnN1bWVXaGl0ZXNwYWNlfSBmcm9tICcuL3N0eWxpbmdfcGFyc2VyJztcblxuXG5cbi8qKlxuICogU3RvcmVzIGNoYW5nZXMgdG8gU3R5bGUgdmFsdWVzLlxuICogLSBga2V5YDogc3R5bGUgbmFtZS5cbiAqIC0gYHZhbHVlYDpcbiAqICAgLSBgb2xkYDogcHJldmlvdXMgdmFsdWUgKG9yIGBudWxsYClcbiAqICAgLSBgbmV3YDogbmV3IHZhbHVlIChvciBgbnVsbGApLlxuICpcbiAqIElmIGBvbGQgPT09IG5ld2AgZG8gbm90aGluZy5cbiAqIElmIGBvbGQgPT09IG51bGxgIHRoZW4gYWRkIGBuZXdgLlxuICogSWYgYG5ldyA9PT0gbnVsbGAgdGhlbiByZW1vdmUgYG9sZGAuXG4gKi9cbmV4cG9ydCB0eXBlIFN0eWxlQ2hhbmdlc01hcCA9IE1hcDxzdHJpbmcsIHtvbGQ6IHN0cmluZyB8IG51bGwsIG5ldzogc3RyaW5nIHwgbnVsbH0+O1xuXG4vKipcbiAqIENvbXB1dGVzIHRoZSBkaWZmIGJldHdlZW4gdHdvIHN0eWxlIHN0cmluZ3MuXG4gKlxuICogRXhhbXBsZTpcbiAqICBgb2xkVmFsdWVgID0+IGBcImE6IDE7IGI6IDIsIGM6IDNcImBcbiAqICBgbmV3VmFsdWVgID0+IGBcImI6IDI7IGM6IDQ7IGQ6IDU7XCJgXG4gKiB3aWxsIHJlc3VsdCBpbjpcbiAqIGBgYFxuICogY2hhbmdlcyA9IE1hcChcbiAqICAgJ2EnLCB7IG9sZDogICcxJywgbmV3OiBudWxsIH0sXG4gKiAgICdiJywgeyBvbGQ6ICAnMicsIG5ldzogICcyJyB9LFxuICogICAnYycsIHsgb2xkOiAgJzMnLCBuZXc6ICAnNCcgfSxcbiAqICAgJ2QnLCB7IG9sZDogbnVsbCwgbmV3OiAgJzUnIH0sXG4gKiApXG4gKiBgYFxuICpcbiAqIEBwYXJhbSBvbGRWYWx1ZSBQcmV2aW91cyBzdHlsZSBzdHJpbmcuXG4gKiBAcGFyYW0gbmV3VmFsdWUgTmV3IHN0eWxlIHN0cmluZy5cbiAqIEByZXR1cm5zIGBTdHlsZUNoYW5nZXNBcnJheU1hcGAuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb21wdXRlU3R5bGVDaGFuZ2VzKG9sZFZhbHVlOiBzdHJpbmcsIG5ld1ZhbHVlOiBzdHJpbmcpOiBTdHlsZUNoYW5nZXNNYXAge1xuICBjb25zdCBjaGFuZ2VzOiBTdHlsZUNoYW5nZXNNYXAgPSBuZXcgTWFwPHN0cmluZywge29sZDogc3RyaW5nIHwgbnVsbCwgbmV3OiBzdHJpbmcgfCBudWxsfT4oKTtcbiAgcGFyc2VLZXlWYWx1ZShvbGRWYWx1ZSwgY2hhbmdlcywgZmFsc2UpO1xuICBwYXJzZUtleVZhbHVlKG5ld1ZhbHVlLCBjaGFuZ2VzLCB0cnVlKTtcbiAgcmV0dXJuIGNoYW5nZXM7XG59XG5cbi8qKlxuICogU3BsaXRzIHRoZSBzdHlsZSBsaXN0IGludG8gYXJyYXksIGlnbm9yaW5nIHdoaXRlc3BhY2UgYW5kIGFkZCBpdCB0byBjb3JyZXNwb25kaW5nIGNhdGVnb3JpZXNcbiAqIGNoYW5nZXMuXG4gKlxuICogQHBhcmFtIHRleHQgU3R5bGUgbGlzdCB0byBzcGxpdFxuICogQHBhcmFtIGNoYW5nZXMgV2hlcmUgY2hhbmdlcyB3aWxsIGJlIHN0b3JlZC5cbiAqIEBwYXJhbSBpc05ld1ZhbHVlIGB0cnVlYCBpZiBwYXJzaW5nIG5ldyB2YWx1ZSAoZWZmZWN0cyBob3cgdmFsdWVzIGdldCBhZGRlZCB0byBgY2hhbmdlc2ApXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZUtleVZhbHVlKHRleHQ6IHN0cmluZywgY2hhbmdlczogU3R5bGVDaGFuZ2VzTWFwLCBpc05ld1ZhbHVlOiBib29sZWFuKTogdm9pZCB7XG4gIGNvbnN0IGVuZCA9IHRleHQubGVuZ3RoO1xuICBsZXQgc3RhcnQgPSAwO1xuICB3aGlsZSAoc3RhcnQgPCBlbmQpIHtcbiAgICBjb25zdCBrZXlTdGFydCA9IGNvbnN1bWVXaGl0ZXNwYWNlKHRleHQsIHN0YXJ0LCBlbmQpO1xuICAgIGNvbnN0IGtleUVuZCA9IGNvbnN1bWVTdHlsZUtleSh0ZXh0LCBrZXlTdGFydCwgZW5kKTtcbiAgICBpZiAoa2V5RW5kID09PSBrZXlTdGFydCkge1xuICAgICAgLy8gd2UgcmVhY2hlZCBhbiBlbmQgc28ganVzdCBxdWl0XG4gICAgICBicmVhaztcbiAgICB9XG4gICAgY29uc3QgdmFsdWVTdGFydCA9IGNvbnN1bWVTZXBhcmF0b3IodGV4dCwga2V5RW5kLCBlbmQsIENoYXJDb2RlLkNPTE9OKTtcbiAgICBjb25zdCB2YWx1ZUVuZCA9IGNvbnN1bWVTdHlsZVZhbHVlKHRleHQsIHZhbHVlU3RhcnQsIGVuZCk7XG4gICAgaWYgKG5nRGV2TW9kZSAmJiB2YWx1ZVN0YXJ0ID09PSB2YWx1ZUVuZCkge1xuICAgICAgdGhyb3cgbWFsZm9ybWVkU3R5bGVFcnJvcih0ZXh0LCB2YWx1ZVN0YXJ0KTtcbiAgICB9XG4gICAgc3RhcnQgPSBjb25zdW1lU2VwYXJhdG9yKHRleHQsIHZhbHVlRW5kLCBlbmQsIENoYXJDb2RlLlNFTUlfQ09MT04pO1xuICAgIGNvbnN0IGtleSA9IHRleHQuc3Vic3RyaW5nKGtleVN0YXJ0LCBrZXlFbmQpO1xuICAgIGNvbnN0IHZhbHVlID0gdGV4dC5zdWJzdHJpbmcodmFsdWVTdGFydCwgdmFsdWVFbmQpO1xuICAgIHByb2Nlc3NTdHlsZUtleVZhbHVlKGNoYW5nZXMsIGtleSwgdmFsdWUsIGlzTmV3VmFsdWUpO1xuICB9XG59XG5cbi8qKlxuICogQXBwZW5kcyBzdHlsZSBga2V5YC9gdmFsdWVgIGluZm9ybWF0aW9uIGludG8gdGhlIGxpc3Qgb2YgYGNoYW5nZXNgLlxuICpcbiAqIE9uY2UgYWxsIG9mIHRoZSBwYXJzaW5nIGlzIGNvbXBsZXRlLCB0aGUgYGNoYW5nZXNgIHdpbGwgY29udGFpbiBhXG4gKiBzZXQgb2Ygb3BlcmF0aW9ucyB3aGljaCBuZWVkIHRvIGJlIHBlcmZvcm1lZCBvbiB0aGUgRE9NIHRvIHJlY29uY2lsZSBpdC5cbiAqXG4gKiBAcGFyYW0gY2hhbmdlcyBBbiBgU3R5bGVDaGFuZ2VzTWFwIHdoaWNoIHRyYWNrcyBjaGFuZ2VzLlxuICogQHBhcmFtIGtleSBTdHlsZSBrZXkgdG8gYmUgYWRkZWQgdG8gdGhlIGBjaGFuZ2VzYC5cbiAqIEBwYXJhbSB2YWx1ZSBTdHlsZSB2YWx1ZSB0byBiZSBhZGRlZCB0byB0aGUgYGNoYW5nZXNgLlxuICogQHBhcmFtIGlzTmV3VmFsdWUgdHJ1ZSBpZiBga2V5YC9gdmFsdWVgIHNob3VsZCBiZSBwcm9jZXNzZWQgYXMgbmV3IHZhbHVlLlxuICovXG5mdW5jdGlvbiBwcm9jZXNzU3R5bGVLZXlWYWx1ZShcbiAgICBjaGFuZ2VzOiBTdHlsZUNoYW5nZXNNYXAsIGtleTogc3RyaW5nLCB2YWx1ZTogc3RyaW5nLCBpc05ld1ZhbHVlOiBib29sZWFuKTogdm9pZCB7XG4gIGlmIChpc05ld1ZhbHVlKSB7XG4gICAgLy8gVGhpcyBjb2RlIHBhdGggaXMgZXhlY3V0ZWQgd2hlbiB3ZSBhcmUgaXRlcmF0aW5nIG92ZXIgbmV3IHZhbHVlcy5cbiAgICBjb25zdCBleGlzdGluZyA9IGNoYW5nZXMuZ2V0KGtleSk7XG4gICAgaWYgKGV4aXN0aW5nID09PSB1bmRlZmluZWQpIHtcbiAgICAgIC8vIEtleSB3ZSBoYXZlIG5vdCBzZWVuIGJlZm9yZVxuICAgICAgY2hhbmdlcy5zZXQoa2V5LCBzdHlsZUtleVZhbHVlKG51bGwsIHZhbHVlKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIEFscmVhZHkgc2VlbiwgdXBkYXRlIHZhbHVlLlxuICAgICAgZXhpc3RpbmcubmV3ID0gdmFsdWU7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIC8vIFRoaXMgY29kZSBwYXRoIGlzIGV4ZWN1dGVkIHdoZW4gd2UgYXJlIGl0ZXJhdGlvbiBvdmVyIHByZXZpb3VzIHZhbHVlcy5cbiAgICBjaGFuZ2VzLnNldChrZXksIHN0eWxlS2V5VmFsdWUodmFsdWUsIG51bGwpKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBzdHlsZUtleVZhbHVlKG9sZFZhbHVlOiBzdHJpbmcgfCBudWxsLCBuZXdWYWx1ZTogc3RyaW5nIHwgbnVsbCkge1xuICByZXR1cm4ge29sZDogb2xkVmFsdWUsIG5ldzogbmV3VmFsdWV9O1xufVxuXG4vKipcbiAqIFJlbW92ZXMgYSBzdHlsZSBmcm9tIGEgYGNzc1RleHRgIHN0cmluZy5cbiAqXG4gKiBAcGFyYW0gY3NzVGV4dCBBIHN0cmluZyB3aGljaCBjb250YWlucyBzdHlsaW5nLlxuICogQHBhcmFtIHN0eWxlVG9SZW1vdmUgQSBzdHlsZSAoYW5kIGl0cyB2YWx1ZSkgdG8gcmVtb3ZlIGZyb20gYGNzc1RleHRgLlxuICogQHJldHVybnMgYSBuZXcgc3R5bGUgdGV4dCB3aGljaCBkb2VzIG5vdCBoYXZlIGBzdHlsZVRvUmVtb3ZlYCAoYW5kIGl0cyB2YWx1ZSlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlbW92ZVN0eWxlKGNzc1RleHQ6IHN0cmluZywgc3R5bGVUb1JlbW92ZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgbGV0IHN0YXJ0ID0gMDtcbiAgbGV0IGVuZCA9IGNzc1RleHQubGVuZ3RoO1xuICBsZXQgbGFzdFZhbHVlRW5kID0gMDtcbiAgd2hpbGUgKHN0YXJ0IDwgZW5kKSB7XG4gICAgY29uc3QgcG9zc2libGVLZXlJbmRleCA9IGNzc1RleHQuaW5kZXhPZihzdHlsZVRvUmVtb3ZlLCBzdGFydCk7XG4gICAgaWYgKHBvc3NpYmxlS2V5SW5kZXggPT09IC0xKSB7XG4gICAgICAvLyB3ZSBkaWQgbm90IGZpbmQgYW55dGhpbmcsIHNvIGp1c3QgYmFpbC5cbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgICB3aGlsZSAoc3RhcnQgPCBwb3NzaWJsZUtleUluZGV4ICsgMSkge1xuICAgICAgY29uc3Qga2V5U3RhcnQgPSBjb25zdW1lV2hpdGVzcGFjZShjc3NUZXh0LCBzdGFydCwgZW5kKTtcbiAgICAgIGNvbnN0IGtleUVuZCA9IGNvbnN1bWVTdHlsZUtleShjc3NUZXh0LCBrZXlTdGFydCwgZW5kKTtcbiAgICAgIGlmIChrZXlFbmQgPT09IGtleVN0YXJ0KSB7XG4gICAgICAgIC8vIHdlIHJlYWNoZWQgdGhlIGVuZFxuICAgICAgICByZXR1cm4gY3NzVGV4dDtcbiAgICAgIH1cbiAgICAgIGNvbnN0IHZhbHVlU3RhcnQgPSBjb25zdW1lU2VwYXJhdG9yKGNzc1RleHQsIGtleUVuZCwgZW5kLCBDaGFyQ29kZS5DT0xPTik7XG4gICAgICBjb25zdCB2YWx1ZUVuZCA9IGNvbnN1bWVTdHlsZVZhbHVlKGNzc1RleHQsIHZhbHVlU3RhcnQsIGVuZCk7XG4gICAgICBpZiAobmdEZXZNb2RlICYmIHZhbHVlU3RhcnQgPT09IHZhbHVlRW5kKSB7XG4gICAgICAgIHRocm93IG1hbGZvcm1lZFN0eWxlRXJyb3IoY3NzVGV4dCwgdmFsdWVTdGFydCk7XG4gICAgICB9XG4gICAgICBjb25zdCB2YWx1ZUVuZFNlcCA9IGNvbnN1bWVTZXBhcmF0b3IoY3NzVGV4dCwgdmFsdWVFbmQsIGVuZCwgQ2hhckNvZGUuU0VNSV9DT0xPTik7XG4gICAgICBpZiAoa2V5U3RhcnQgPT0gcG9zc2libGVLZXlJbmRleCAmJiBrZXlFbmQgPT09IHBvc3NpYmxlS2V5SW5kZXggKyBzdHlsZVRvUmVtb3ZlLmxlbmd0aCkge1xuICAgICAgICBpZiAodmFsdWVFbmRTZXAgPT0gZW5kKSB7XG4gICAgICAgICAgLy8gVGhpcyBpcyBhIHNwZWNpYWwgY2FzZSB3aGVuIHdlIGFyZSB0aGUgbGFzdCBrZXkgaW4gYSBsaXN0LCB3ZSB0aGVuIGNob3Agb2ZmIHRoZVxuICAgICAgICAgIC8vIHRyYWlsaW5nIHNlcGFyYXRvciBhcyB3ZWxsLlxuICAgICAgICAgIGNzc1RleHQgPSBjc3NUZXh0LnN1YnN0cmluZygwLCBsYXN0VmFsdWVFbmQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGNzc1RleHQgPSBjc3NUZXh0LnN1YnN0cmluZygwLCBrZXlTdGFydCkgKyBjc3NUZXh0LnN1YnN0cmluZyh2YWx1ZUVuZFNlcCwgZW5kKTtcbiAgICAgICAgfVxuICAgICAgICBlbmQgPSBjc3NUZXh0Lmxlbmd0aDtcbiAgICAgICAgc3RhcnQgPSBrZXlTdGFydDtcbiAgICAgICAgYnJlYWs7ICAvLyByZXNjYW4uXG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBUaGlzIHdhcyBub3QgdGhlIGl0ZW0gd2UgYXJlIGxvb2tpbmcgZm9yLCBrZWVwIGdvaW5nLlxuICAgICAgICBzdGFydCA9IHZhbHVlRW5kU2VwO1xuICAgICAgfVxuICAgICAgbGFzdFZhbHVlRW5kID0gdmFsdWVFbmQ7XG4gICAgfVxuICB9XG4gIHJldHVybiBjc3NUZXh0O1xufVxuXG5mdW5jdGlvbiBtYWxmb3JtZWRTdHlsZUVycm9yKHRleHQ6IHN0cmluZywgaW5kZXg6IG51bWJlcikge1xuICByZXR1cm4gbmV3IEVycm9yKFxuICAgICAgYE1hbGZvcm1lZCBzdHlsZSBhdCBsb2NhdGlvbiAke2luZGV4fSBpbiBzdHJpbmcgJ2AgKyB0ZXh0LnN1YnN0cmluZygwLCBpbmRleCkgKyAnWz4+JyArXG4gICAgICB0ZXh0LnN1YnN0cmluZyhpbmRleCwgaW5kZXggKyAxKSArICc8PF0nICsgdGV4dC5zdWJzdHIoaW5kZXggKyAxKSArICdcXCcuJyk7XG59Il19