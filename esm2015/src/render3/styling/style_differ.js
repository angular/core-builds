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
    /** @type {?} */
    const end = text.length;
    /** @type {?} */
    let start = 0;
    while (start < end) {
        /** @type {?} */
        const keyStart = consumeWhitespace(text, start, end);
        /** @type {?} */
        const keyEnd = consumeStyleKey(text, keyStart, end);
        if (keyEnd === keyStart) {
            // we reached an end so just quit
            break;
        }
        /** @type {?} */
        const valueStart = consumeSeparator(text, keyEnd, end, 58 /* COLON */);
        /** @type {?} */
        const valueEnd = consumeStyleValue(text, valueStart, end);
        if (ngDevMode && valueStart === valueEnd) {
            throw malformedStyleError(text, valueStart);
        }
        start = consumeSeparator(text, valueEnd, end, 59 /* SEMI_COLON */);
        /** @type {?} */
        const key = text.substring(keyStart, keyEnd);
        /** @type {?} */
        const value = text.substring(valueStart, valueEnd);
        processStyleKeyValue(changes, key, value, isNewValue);
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
    /** @type {?} */
    let start = 0;
    /** @type {?} */
    let end = cssText.length;
    /** @type {?} */
    let lastValueEnd = 0;
    while (start < end) {
        /** @type {?} */
        const possibleKeyIndex = cssText.indexOf(styleToRemove, start);
        if (possibleKeyIndex === -1) {
            // we did not find anything, so just bail.
            break;
        }
        while (start < possibleKeyIndex + 1) {
            /** @type {?} */
            const keyStart = consumeWhitespace(cssText, start, end);
            /** @type {?} */
            const keyEnd = consumeStyleKey(cssText, keyStart, end);
            if (keyEnd === keyStart) {
                // we reached the end
                return cssText;
            }
            /** @type {?} */
            const valueStart = consumeSeparator(cssText, keyEnd, end, 58 /* COLON */);
            /** @type {?} */
            const valueEnd = consumeStyleValue(cssText, valueStart, end);
            if (ngDevMode && valueStart === valueEnd) {
                throw malformedStyleError(cssText, valueStart);
            }
            /** @type {?} */
            const valueEndSep = consumeSeparator(cssText, valueEnd, end, 59 /* SEMI_COLON */);
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
/**
 * @param {?} text
 * @param {?} index
 * @return {?}
 */
function malformedStyleError(text, index) {
    return new Error(`Malformed style at location ${index} in string '` + text.substring(0, index) + '[>>' +
        text.substring(index, index + 1) + '<<]' + text.substr(index + 1) + '\'.');
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3R5bGVfZGlmZmVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9zdHlsaW5nL3N0eWxlX2RpZmZlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFTQSxPQUFPLEVBQUMsZ0JBQWdCLEVBQUUsZUFBZSxFQUFFLGlCQUFpQixFQUFFLGlCQUFpQixFQUFDLE1BQU0sa0JBQWtCLENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQXFDekcsTUFBTSxVQUFVLG1CQUFtQixDQUFDLFFBQWdCLEVBQUUsUUFBZ0I7O1VBQzlELE9BQU8sR0FBb0IsSUFBSSxHQUFHLEVBQW9EO0lBQzVGLGFBQWEsQ0FBQyxRQUFRLEVBQUUsT0FBTyxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQ3hDLGFBQWEsQ0FBQyxRQUFRLEVBQUUsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQ3ZDLE9BQU8sT0FBTyxDQUFDO0FBQ2pCLENBQUM7Ozs7Ozs7Ozs7QUFVRCxNQUFNLFVBQVUsYUFBYSxDQUFDLElBQVksRUFBRSxPQUF3QixFQUFFLFVBQW1COztVQUNqRixHQUFHLEdBQUcsSUFBSSxDQUFDLE1BQU07O1FBQ25CLEtBQUssR0FBRyxDQUFDO0lBQ2IsT0FBTyxLQUFLLEdBQUcsR0FBRyxFQUFFOztjQUNaLFFBQVEsR0FBRyxpQkFBaUIsQ0FBQyxJQUFJLEVBQUUsS0FBSyxFQUFFLEdBQUcsQ0FBQzs7Y0FDOUMsTUFBTSxHQUFHLGVBQWUsQ0FBQyxJQUFJLEVBQUUsUUFBUSxFQUFFLEdBQUcsQ0FBQztRQUNuRCxJQUFJLE1BQU0sS0FBSyxRQUFRLEVBQUU7WUFDdkIsaUNBQWlDO1lBQ2pDLE1BQU07U0FDUDs7Y0FDSyxVQUFVLEdBQUcsZ0JBQWdCLENBQUMsSUFBSSxFQUFFLE1BQU0sRUFBRSxHQUFHLGlCQUFpQjs7Y0FDaEUsUUFBUSxHQUFHLGlCQUFpQixDQUFDLElB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QUN0RixJQUFJLFdBQVcsSUFBSSxHQUFHLEVBQUU7b0JBQ3RCLGtGQUFrRjtvQkFDbEYsOEJBQThCO29CQUM5QixPQUFPLEdBQUcsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsWUFBWSxDQUFDLENBQUM7aUJBQzlDO3FCQUFNO29CQUNMLE9BQU8sR0FBRyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxRQUFRLENBQUMsR0FBRyxPQUFPLENBQUMsU0FBUyxDQUFDLFdBQVcsRUFBRSxHQUFHLENBQUMsQ0FBQztpQkFDaEY7Z0JBQ0QsR0FBRyxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUM7Z0JBQ3JCLEtBQUssR0FBRyxRQUFRLENBQUM7Z0JBQ2pCLE1BQU0sQ0FBRSxVQUFVO2FBQ25CO2lCQUFNO2dCQUNMLHdEQUF3RDtnQkFDeEQsS0FBSyxHQUFHLFdBQVcsQ0FBQzthQUNyQjtZQUNELFlBQVksR0FBRyxRQUFRLENBQUM7U0FDekI7S0FDRjtJQUNELE9BQU8sT0FBTyxDQUFDO0FBQ2pCLENBQUM7Ozs7OztBQUVELFNBQVMsbUJBQW1CLENBQUMsSUFBWSxFQUFFLEtBQWE7SUFDdEQsT0FBTyxJQUFJLEtBQUssQ0FDWiwrQkFBK0IsS0FBSyxjQUFjLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLEdBQUcsS0FBSztRQUNyRixJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssRUFBRSxLQUFLLEdBQUcsQ0FBQyxDQUFDLEdBQUcsS0FBSyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQyxHQUFHLEtBQUssQ0FBQyxDQUFDO0FBQ2pGLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiogQGxpY2Vuc2VcbiogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4qXG4qIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4qIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiovXG5cbmltcG9ydCB7Q2hhckNvZGV9IGZyb20gJy4uLy4uL3V0aWwvY2hhcl9jb2RlJztcbmltcG9ydCB7Y29uc3VtZVNlcGFyYXRvciwgY29uc3VtZVN0eWxlS2V5LCBjb25zdW1lU3R5bGVWYWx1ZSwgY29uc3VtZVdoaXRlc3BhY2V9IGZyb20gJy4vc3R5bGluZ19wYXJzZXInO1xuXG5cblxuLyoqXG4gKiBTdG9yZXMgY2hhbmdlcyB0byBTdHlsZSB2YWx1ZXMuXG4gKiAtIGBrZXlgOiBzdHlsZSBuYW1lLlxuICogLSBgdmFsdWVgOlxuICogICAtIGBvbGRgOiBwcmV2aW91cyB2YWx1ZSAob3IgYG51bGxgKVxuICogICAtIGBuZXdgOiBuZXcgdmFsdWUgKG9yIGBudWxsYCkuXG4gKlxuICogSWYgYG9sZCA9PT0gbmV3YCBkbyBub3RoaW5nLlxuICogSWYgYG9sZCA9PT0gbnVsbGAgdGhlbiBhZGQgYG5ld2AuXG4gKiBJZiBgbmV3ID09PSBudWxsYCB0aGVuIHJlbW92ZSBgb2xkYC5cbiAqL1xuZXhwb3J0IHR5cGUgU3R5bGVDaGFuZ2VzTWFwID0gTWFwPHN0cmluZywge29sZDogc3RyaW5nIHwgbnVsbCwgbmV3OiBzdHJpbmcgfCBudWxsfT47XG5cbi8qKlxuICogQ29tcHV0ZXMgdGhlIGRpZmYgYmV0d2VlbiB0d28gc3R5bGUgc3RyaW5ncy5cbiAqXG4gKiBFeGFtcGxlOlxuICogIGBvbGRWYWx1ZWAgPT4gYFwiYTogMTsgYjogMiwgYzogM1wiYFxuICogIGBuZXdWYWx1ZWAgPT4gYFwiYjogMjsgYzogNDsgZDogNTtcImBcbiAqIHdpbGwgcmVzdWx0IGluOlxuICogYGBgXG4gKiBjaGFuZ2VzID0gTWFwKFxuICogICAnYScsIHsgb2xkOiAgJzEnLCBuZXc6IG51bGwgfSxcbiAqICAgJ2InLCB7IG9sZDogICcyJywgbmV3OiAgJzInIH0sXG4gKiAgICdjJywgeyBvbGQ6ICAnMycsIG5ldzogICc0JyB9LFxuICogICAnZCcsIHsgb2xkOiBudWxsLCBuZXc6ICAnNScgfSxcbiAqIClcbiAqIGBgXG4gKlxuICogQHBhcmFtIG9sZFZhbHVlIFByZXZpb3VzIHN0eWxlIHN0cmluZy5cbiAqIEBwYXJhbSBuZXdWYWx1ZSBOZXcgc3R5bGUgc3RyaW5nLlxuICogQHJldHVybnMgYFN0eWxlQ2hhbmdlc0FycmF5TWFwYC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbXB1dGVTdHlsZUNoYW5nZXMob2xkVmFsdWU6IHN0cmluZywgbmV3VmFsdWU6IHN0cmluZyk6IFN0eWxlQ2hhbmdlc01hcCB7XG4gIGNvbnN0IGNoYW5nZXM6IFN0eWxlQ2hhbmdlc01hcCA9IG5ldyBNYXA8c3RyaW5nLCB7b2xkOiBzdHJpbmcgfCBudWxsLCBuZXc6IHN0cmluZyB8IG51bGx9PigpO1xuICBwYXJzZUtleVZhbHVlKG9sZFZhbHVlLCBjaGFuZ2VzLCBmYWxzZSk7XG4gIHBhcnNlS2V5VmFsdWUobmV3VmFsdWUsIGNoYW5nZXMsIHRydWUpO1xuICByZXR1cm4gY2hhbmdlcztcbn1cblxuLyoqXG4gKiBTcGxpdHMgdGhlIHN0eWxlIGxpc3QgaW50byBhcnJheSwgaWdub3Jpbmcgd2hpdGVzcGFjZSBhbmQgYWRkIGl0IHRvIGNvcnJlc3BvbmRpbmcgY2F0ZWdvcmllc1xuICogY2hhbmdlcy5cbiAqXG4gKiBAcGFyYW0gdGV4dCBTdHlsZSBsaXN0IHRvIHNwbGl0XG4gKiBAcGFyYW0gY2hhbmdlcyBXaGVyZSBjaGFuZ2VzIHdpbGwgYmUgc3RvcmVkLlxuICogQHBhcmFtIGlzTmV3VmFsdWUgYHRydWVgIGlmIHBhcnNpbmcgbmV3IHZhbHVlIChlZmZlY3RzIGhvdyB2YWx1ZXMgZ2V0IGFkZGVkIHRvIGBjaGFuZ2VzYClcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlS2V5VmFsdWUodGV4dDogc3RyaW5nLCBjaGFuZ2VzOiBTdHlsZUNoYW5nZXNNYXAsIGlzTmV3VmFsdWU6IGJvb2xlYW4pOiB2b2lkIHtcbiAgY29uc3QgZW5kID0gdGV4dC5sZW5ndGg7XG4gIGxldCBzdGFydCA9IDA7XG4gIHdoaWxlIChzdGFydCA8IGVuZCkge1xuICAgIGNvbnN0IGtleVN0YXJ0ID0gY29uc3VtZVdoaXRlc3BhY2UodGV4dCwgc3RhcnQsIGVuZCk7XG4gICAgY29uc3Qga2V5RW5kID0gY29uc3VtZVN0eWxlS2V5KHRleHQsIGtleVN0YXJ0LCBlbmQpO1xuICAgIGlmIChrZXlFbmQgPT09IGtleVN0YXJ0KSB7XG4gICAgICAvLyB3ZSByZWFjaGVkIGFuIGVuZCBzbyBqdXN0IHF1aXRcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgICBjb25zdCB2YWx1ZVN0YXJ0ID0gY29uc3VtZVNlcGFyYXRvcih0ZXh0LCBrZXlFbmQsIGVuZCwgQ2hhckNvZGUuQ09MT04pO1xuICAgIGNvbnN0IHZhbHVlRW5kID0gY29uc3VtZVN0eWxlVmFsdWUodGV4dCwgdmFsdWVTdGFydCwgZW5kKTtcbiAgICBpZiAobmdEZXZNb2RlICYmIHZhbHVlU3RhcnQgPT09IHZhbHVlRW5kKSB7XG4gICAgICB0aHJvdyBtYWxmb3JtZWRTdHlsZUVycm9yKHRleHQsIHZhbHVlU3RhcnQpO1xuICAgIH1cbiAgICBzdGFydCA9IGNvbnN1bWVTZXBhcmF0b3IodGV4dCwgdmFsdWVFbmQsIGVuZCwgQ2hhckNvZGUuU0VNSV9DT0xPTik7XG4gICAgY29uc3Qga2V5ID0gdGV4dC5zdWJzdHJpbmcoa2V5U3RhcnQsIGtleUVuZCk7XG4gICAgY29uc3QgdmFsdWUgPSB0ZXh0LnN1YnN0cmluZyh2YWx1ZVN0YXJ0LCB2YWx1ZUVuZCk7XG4gICAgcHJvY2Vzc1N0eWxlS2V5VmFsdWUoY2hhbmdlcywga2V5LCB2YWx1ZSwgaXNOZXdWYWx1ZSk7XG4gIH1cbn1cblxuLyoqXG4gKiBBcHBlbmRzIHN0eWxlIGBrZXlgL2B2YWx1ZWAgaW5mb3JtYXRpb24gaW50byB0aGUgbGlzdCBvZiBgY2hhbmdlc2AuXG4gKlxuICogT25jZSBhbGwgb2YgdGhlIHBhcnNpbmcgaXMgY29tcGxldGUsIHRoZSBgY2hhbmdlc2Agd2lsbCBjb250YWluIGFcbiAqIHNldCBvZiBvcGVyYXRpb25zIHdoaWNoIG5lZWQgdG8gYmUgcGVyZm9ybWVkIG9uIHRoZSBET00gdG8gcmVjb25jaWxlIGl0LlxuICpcbiAqIEBwYXJhbSBjaGFuZ2VzIEFuIGBTdHlsZUNoYW5nZXNNYXAgd2hpY2ggdHJhY2tzIGNoYW5nZXMuXG4gKiBAcGFyYW0ga2V5IFN0eWxlIGtleSB0byBiZSBhZGRlZCB0byB0aGUgYGNoYW5nZXNgLlxuICogQHBhcmFtIHZhbHVlIFN0eWxlIHZhbHVlIHRvIGJlIGFkZGVkIHRvIHRoZSBgY2hhbmdlc2AuXG4gKiBAcGFyYW0gaXNOZXdWYWx1ZSB0cnVlIGlmIGBrZXlgL2B2YWx1ZWAgc2hvdWxkIGJlIHByb2Nlc3NlZCBhcyBuZXcgdmFsdWUuXG4gKi9cbmZ1bmN0aW9uIHByb2Nlc3NTdHlsZUtleVZhbHVlKFxuICAgIGNoYW5nZXM6IFN0eWxlQ2hhbmdlc01hcCwga2V5OiBzdHJpbmcsIHZhbHVlOiBzdHJpbmcsIGlzTmV3VmFsdWU6IGJvb2xlYW4pOiB2b2lkIHtcbiAgaWYgKGlzTmV3VmFsdWUpIHtcbiAgICAvLyBUaGlzIGNvZGUgcGF0aCBpcyBleGVjdXRlZCB3aGVuIHdlIGFyZSBpdGVyYXRpbmcgb3ZlciBuZXcgdmFsdWVzLlxuICAgIGNvbnN0IGV4aXN0aW5nID0gY2hhbmdlcy5nZXQoa2V5KTtcbiAgICBpZiAoZXhpc3RpbmcgPT09IHVuZGVmaW5lZCkge1xuICAgICAgLy8gS2V5IHdlIGhhdmUgbm90IHNlZW4gYmVmb3JlXG4gICAgICBjaGFuZ2VzLnNldChrZXksIHN0eWxlS2V5VmFsdWUobnVsbCwgdmFsdWUpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gQWxyZWFkeSBzZWVuLCB1cGRhdGUgdmFsdWUuXG4gICAgICBleGlzdGluZy5uZXcgPSB2YWx1ZTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgLy8gVGhpcyBjb2RlIHBhdGggaXMgZXhlY3V0ZWQgd2hlbiB3ZSBhcmUgaXRlcmF0aW9uIG92ZXIgcHJldmlvdXMgdmFsdWVzLlxuICAgIGNoYW5nZXMuc2V0KGtleSwgc3R5bGVLZXlWYWx1ZSh2YWx1ZSwgbnVsbCkpO1xuICB9XG59XG5cbmZ1bmN0aW9uIHN0eWxlS2V5VmFsdWUob2xkVmFsdWU6IHN0cmluZyB8IG51bGwsIG5ld1ZhbHVlOiBzdHJpbmcgfCBudWxsKSB7XG4gIHJldHVybiB7b2xkOiBvbGRWYWx1ZSwgbmV3OiBuZXdWYWx1ZX07XG59XG5cbi8qKlxuICogUmVtb3ZlcyBhIHN0eWxlIGZyb20gYSBgY3NzVGV4dGAgc3RyaW5nLlxuICpcbiAqIEBwYXJhbSBjc3NUZXh0IEEgc3RyaW5nIHdoaWNoIGNvbnRhaW5zIHN0eWxpbmcuXG4gKiBAcGFyYW0gc3R5bGVUb1JlbW92ZSBBIHN0eWxlIChhbmQgaXRzIHZhbHVlKSB0byByZW1vdmUgZnJvbSBgY3NzVGV4dGAuXG4gKiBAcmV0dXJucyBhIG5ldyBzdHlsZSB0ZXh0IHdoaWNoIGRvZXMgbm90IGhhdmUgYHN0eWxlVG9SZW1vdmVgIChhbmQgaXRzIHZhbHVlKVxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVtb3ZlU3R5bGUoY3NzVGV4dDogc3RyaW5nLCBzdHlsZVRvUmVtb3ZlOiBzdHJpbmcpOiBzdHJpbmcge1xuICBsZXQgc3RhcnQgPSAwO1xuICBsZXQgZW5kID0gY3NzVGV4dC5sZW5ndGg7XG4gIGxldCBsYXN0VmFsdWVFbmQgPSAwO1xuICB3aGlsZSAoc3RhcnQgPCBlbmQpIHtcbiAgICBjb25zdCBwb3NzaWJsZUtleUluZGV4ID0gY3NzVGV4dC5pbmRleE9mKHN0eWxlVG9SZW1vdmUsIHN0YXJ0KTtcbiAgICBpZiAocG9zc2libGVLZXlJbmRleCA9PT0gLTEpIHtcbiAgICAgIC8vIHdlIGRpZCBub3QgZmluZCBhbnl0aGluZywgc28ganVzdCBiYWlsLlxuICAgICAgYnJlYWs7XG4gICAgfVxuICAgIHdoaWxlIChzdGFydCA8IHBvc3NpYmxlS2V5SW5kZXggKyAxKSB7XG4gICAgICBjb25zdCBrZXlTdGFydCA9IGNvbnN1bWVXaGl0ZXNwYWNlKGNzc1RleHQsIHN0YXJ0LCBlbmQpO1xuICAgICAgY29uc3Qga2V5RW5kID0gY29uc3VtZVN0eWxlS2V5KGNzc1RleHQsIGtleVN0YXJ0LCBlbmQpO1xuICAgICAgaWYgKGtleUVuZCA9PT0ga2V5U3RhcnQpIHtcbiAgICAgICAgLy8gd2UgcmVhY2hlZCB0aGUgZW5kXG4gICAgICAgIHJldHVybiBjc3NUZXh0O1xuICAgICAgfVxuICAgICAgY29uc3QgdmFsdWVTdGFydCA9IGNvbnN1bWVTZXBhcmF0b3IoY3NzVGV4dCwga2V5RW5kLCBlbmQsIENoYXJDb2RlLkNPTE9OKTtcbiAgICAgIGNvbnN0IHZhbHVlRW5kID0gY29uc3VtZVN0eWxlVmFsdWUoY3NzVGV4dCwgdmFsdWVTdGFydCwgZW5kKTtcbiAgICAgIGlmIChuZ0Rldk1vZGUgJiYgdmFsdWVTdGFydCA9PT0gdmFsdWVFbmQpIHtcbiAgICAgICAgdGhyb3cgbWFsZm9ybWVkU3R5bGVFcnJvcihjc3NUZXh0LCB2YWx1ZVN0YXJ0KTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IHZhbHVlRW5kU2VwID0gY29uc3VtZVNlcGFyYXRvcihjc3NUZXh0LCB2YWx1ZUVuZCwgZW5kLCBDaGFyQ29kZS5TRU1JX0NPTE9OKTtcbiAgICAgIGlmIChrZXlTdGFydCA9PSBwb3NzaWJsZUtleUluZGV4ICYmIGtleUVuZCA9PT0gcG9zc2libGVLZXlJbmRleCArIHN0eWxlVG9SZW1vdmUubGVuZ3RoKSB7XG4gICAgICAgIGlmICh2YWx1ZUVuZFNlcCA9PSBlbmQpIHtcbiAgICAgICAgICAvLyBUaGlzIGlzIGEgc3BlY2lhbCBjYXNlIHdoZW4gd2UgYXJlIHRoZSBsYXN0IGtleSBpbiBhIGxpc3QsIHdlIHRoZW4gY2hvcCBvZmYgdGhlXG4gICAgICAgICAgLy8gdHJhaWxpbmcgc2VwYXJhdG9yIGFzIHdlbGwuXG4gICAgICAgICAgY3NzVGV4dCA9IGNzc1RleHQuc3Vic3RyaW5nKDAsIGxhc3RWYWx1ZUVuZCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgY3NzVGV4dCA9IGNzc1RleHQuc3Vic3RyaW5nKDAsIGtleVN0YXJ0KSArIGNzc1RleHQuc3Vic3RyaW5nKHZhbHVlRW5kU2VwLCBlbmQpO1xuICAgICAgICB9XG4gICAgICAgIGVuZCA9IGNzc1RleHQubGVuZ3RoO1xuICAgICAgICBzdGFydCA9IGtleVN0YXJ0O1xuICAgICAgICBicmVhazsgIC8vIHJlc2Nhbi5cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIFRoaXMgd2FzIG5vdCB0aGUgaXRlbSB3ZSBhcmUgbG9va2luZyBmb3IsIGtlZXAgZ29pbmcuXG4gICAgICAgIHN0YXJ0ID0gdmFsdWVFbmRTZXA7XG4gICAgICB9XG4gICAgICBsYXN0VmFsdWVFbmQgPSB2YWx1ZUVuZDtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGNzc1RleHQ7XG59XG5cbmZ1bmN0aW9uIG1hbGZvcm1lZFN0eWxlRXJyb3IodGV4dDogc3RyaW5nLCBpbmRleDogbnVtYmVyKSB7XG4gIHJldHVybiBuZXcgRXJyb3IoXG4gICAgICBgTWFsZm9ybWVkIHN0eWxlIGF0IGxvY2F0aW9uICR7aW5kZXh9IGluIHN0cmluZyAnYCArIHRleHQuc3Vic3RyaW5nKDAsIGluZGV4KSArICdbPj4nICtcbiAgICAgIHRleHQuc3Vic3RyaW5nKGluZGV4LCBpbmRleCArIDEpICsgJzw8XScgKyB0ZXh0LnN1YnN0cihpbmRleCArIDEpICsgJ1xcJy4nKTtcbn0iXX0=