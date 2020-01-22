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
    for (var i = parseStyle(text); i >= 0; i = parseStyleNext(text, i)) {
        processStyleKeyValue(changes, getLastParsedKey(text), getLastParsedValue(text), isNewValue);
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
    if (cssText.indexOf(styleToRemove) === -1) {
        // happy case where we don't need to invoke parser.
        return cssText;
    }
    var lastValueEnd = 0;
    for (var i = parseStyle(cssText); i >= 0; i = parseStyleNext(cssText, i)) {
        var key = getLastParsedKey(cssText);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3R5bGVfZGlmZmVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9zdHlsaW5nL3N0eWxlX2RpZmZlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0VBTUU7QUFFRixPQUFPLEVBQUMsZ0JBQWdCLEVBQUUsa0JBQWtCLEVBQUUscUJBQXFCLEVBQUUsVUFBVSxFQUFFLGNBQWMsRUFBRSxnQkFBZ0IsRUFBQyxNQUFNLGtCQUFrQixDQUFDO0FBZTNJOzs7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBbUJHO0FBQ0gsTUFBTSxVQUFVLG1CQUFtQixDQUFDLFFBQWdCLEVBQUUsUUFBZ0I7SUFDcEUsSUFBTSxPQUFPLEdBQW9CLElBQUksR0FBRyxFQUFvRCxDQUFDO0lBQzdGLGFBQWEsQ0FBQyxRQUFRLEVBQUUsT0FBTyxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQ3hDLGFBQWEsQ0FBQyxRQUFRLEVBQUUsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQ3ZDLE9BQU8sT0FBTyxDQUFDO0FBQ2pCLENBQUM7QUFFRDs7Ozs7OztHQU9HO0FBQ0gsTUFBTSxVQUFVLGFBQWEsQ0FBQyxJQUFZLEVBQUUsT0FBd0IsRUFBRSxVQUFtQjtJQUN2RixLQUFLLElBQUksQ0FBQyxHQUFHLFVBQVUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsR0FBRyxjQUFjLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxFQUFFO1FBQ2xFLG9CQUFvQixDQUFDLE9BQU8sRUFBRSxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsRUFBRSxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsRUFBRSxVQUFVLENBQUMsQ0FBQztLQUM3RjtBQUNILENBQUM7QUFFRDs7Ozs7Ozs7OztHQVVHO0FBQ0gsU0FBUyxvQkFBb0IsQ0FDekIsT0FBd0IsRUFBRSxHQUFXLEVBQUUsS0FBYSxFQUFFLFVBQW1CO0lBQzNFLElBQUksVUFBVSxFQUFFO1FBQ2Qsb0VBQW9FO1FBQ3BFLElBQU0sUUFBUSxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDbEMsSUFBSSxRQUFRLEtBQUssU0FBUyxFQUFFO1lBQzFCLDhCQUE4QjtZQUM5QixPQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxhQUFhLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUM7U0FDOUM7YUFBTTtZQUNMLDhCQUE4QjtZQUM5QixRQUFRLENBQUMsR0FBRyxHQUFHLEtBQUssQ0FBQztTQUN0QjtLQUNGO1NBQU07UUFDTCx5RUFBeUU7UUFDekUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsYUFBYSxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO0tBQzlDO0FBQ0gsQ0FBQztBQUVELFNBQVMsYUFBYSxDQUFDLFFBQXVCLEVBQUUsUUFBdUI7SUFDckUsT0FBTyxFQUFDLEdBQUcsRUFBRSxRQUFRLEVBQUUsR0FBRyxFQUFFLFFBQVEsRUFBQyxDQUFDO0FBQ3hDLENBQUM7QUFFRDs7Ozs7O0dBTUc7QUFDSCxNQUFNLFVBQVUsV0FBVyxDQUFDLE9BQWUsRUFBRSxhQUFxQjtJQUNoRSxJQUFJLE9BQU8sQ0FBQyxPQUFPLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUU7UUFDekMsbURBQW1EO1FBQ25ELE9BQU8sT0FBTyxDQUFDO0tBQ2hCO0lBQ0QsSUFBSSxZQUFZLEdBQUcsQ0FBQyxDQUFDO0lBQ3JCLEtBQUssSUFBSSxDQUFDLEdBQUcsVUFBVSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxHQUFHLGNBQWMsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLEVBQUU7UUFDeEUsSUFBTSxHQUFHLEdBQUcsZ0JBQWdCLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDdEMsSUFBSSxHQUFHLEtBQUssYUFBYSxFQUFFO1lBQ3pCLElBQUksWUFBWSxLQUFLLENBQUMsRUFBRTtnQkFDdEIsT0FBTyxHQUFHLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQy9CLENBQUMsR0FBRyxDQUFDLENBQUM7YUFDUDtpQkFBTSxJQUFJLENBQUMsS0FBSyxPQUFPLENBQUMsTUFBTSxFQUFFO2dCQUMvQixPQUFPLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUFFLFlBQVksQ0FBQyxDQUFDO2FBQzNDO2lCQUFNO2dCQUNMLE9BQU8sR0FBRyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxZQUFZLENBQUMsR0FBRyxJQUFJLEdBQUcsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDM0UsQ0FBQyxHQUFHLFlBQVksR0FBRyxDQUFDLENBQUMsQ0FBRSxzREFBc0Q7YUFDOUU7WUFDRCxnQkFBZ0IsQ0FBQyxPQUFPLENBQUMsQ0FBQztTQUMzQjtRQUNELFlBQVksR0FBRyxxQkFBcUIsRUFBRSxDQUFDO0tBQ3hDO0lBQ0QsT0FBTyxPQUFPLENBQUM7QUFDakIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuKiBAbGljZW5zZVxuKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbipcbiogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuKi9cblxuaW1wb3J0IHtnZXRMYXN0UGFyc2VkS2V5LCBnZXRMYXN0UGFyc2VkVmFsdWUsIGdldExhc3RQYXJzZWRWYWx1ZUVuZCwgcGFyc2VTdHlsZSwgcGFyc2VTdHlsZU5leHQsIHJlc2V0UGFyc2VyU3RhdGV9IGZyb20gJy4vc3R5bGluZ19wYXJzZXInO1xuXG4vKipcbiAqIFN0b3JlcyBjaGFuZ2VzIHRvIFN0eWxlIHZhbHVlcy5cbiAqIC0gYGtleWA6IHN0eWxlIG5hbWUuXG4gKiAtIGB2YWx1ZWA6XG4gKiAgIC0gYG9sZGA6IHByZXZpb3VzIHZhbHVlIChvciBgbnVsbGApXG4gKiAgIC0gYG5ld2A6IG5ldyB2YWx1ZSAob3IgYG51bGxgKS5cbiAqXG4gKiBJZiBgb2xkID09PSBuZXdgIGRvIG5vdGhpbmcuXG4gKiBJZiBgb2xkID09PSBudWxsYCB0aGVuIGFkZCBgbmV3YC5cbiAqIElmIGBuZXcgPT09IG51bGxgIHRoZW4gcmVtb3ZlIGBvbGRgLlxuICovXG5leHBvcnQgdHlwZSBTdHlsZUNoYW5nZXNNYXAgPSBNYXA8c3RyaW5nLCB7b2xkOiBzdHJpbmcgfCBudWxsLCBuZXc6IHN0cmluZyB8IG51bGx9PjtcblxuLyoqXG4gKiBDb21wdXRlcyB0aGUgZGlmZiBiZXR3ZWVuIHR3byBzdHlsZSBzdHJpbmdzLlxuICpcbiAqIEV4YW1wbGU6XG4gKiAgYG9sZFZhbHVlYCA9PiBgXCJhOiAxOyBiOiAyLCBjOiAzXCJgXG4gKiAgYG5ld1ZhbHVlYCA9PiBgXCJiOiAyOyBjOiA0OyBkOiA1O1wiYFxuICogd2lsbCByZXN1bHQgaW46XG4gKiBgYGBcbiAqIGNoYW5nZXMgPSBNYXAoXG4gKiAgICdhJywgeyBvbGQ6ICAnMScsIG5ldzogbnVsbCB9LFxuICogICAnYicsIHsgb2xkOiAgJzInLCBuZXc6ICAnMicgfSxcbiAqICAgJ2MnLCB7IG9sZDogICczJywgbmV3OiAgJzQnIH0sXG4gKiAgICdkJywgeyBvbGQ6IG51bGwsIG5ldzogICc1JyB9LFxuICogKVxuICogYGBcbiAqXG4gKiBAcGFyYW0gb2xkVmFsdWUgUHJldmlvdXMgc3R5bGUgc3RyaW5nLlxuICogQHBhcmFtIG5ld1ZhbHVlIE5ldyBzdHlsZSBzdHJpbmcuXG4gKiBAcmV0dXJucyBgU3R5bGVDaGFuZ2VzQXJyYXlNYXBgLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY29tcHV0ZVN0eWxlQ2hhbmdlcyhvbGRWYWx1ZTogc3RyaW5nLCBuZXdWYWx1ZTogc3RyaW5nKTogU3R5bGVDaGFuZ2VzTWFwIHtcbiAgY29uc3QgY2hhbmdlczogU3R5bGVDaGFuZ2VzTWFwID0gbmV3IE1hcDxzdHJpbmcsIHtvbGQ6IHN0cmluZyB8IG51bGwsIG5ldzogc3RyaW5nIHwgbnVsbH0+KCk7XG4gIHBhcnNlS2V5VmFsdWUob2xkVmFsdWUsIGNoYW5nZXMsIGZhbHNlKTtcbiAgcGFyc2VLZXlWYWx1ZShuZXdWYWx1ZSwgY2hhbmdlcywgdHJ1ZSk7XG4gIHJldHVybiBjaGFuZ2VzO1xufVxuXG4vKipcbiAqIFNwbGl0cyB0aGUgc3R5bGUgbGlzdCBpbnRvIGFycmF5LCBpZ25vcmluZyB3aGl0ZXNwYWNlIGFuZCBhZGQgaXQgdG8gY29ycmVzcG9uZGluZyBjYXRlZ29yaWVzXG4gKiBjaGFuZ2VzLlxuICpcbiAqIEBwYXJhbSB0ZXh0IFN0eWxlIGxpc3QgdG8gc3BsaXRcbiAqIEBwYXJhbSBjaGFuZ2VzIFdoZXJlIGNoYW5nZXMgd2lsbCBiZSBzdG9yZWQuXG4gKiBAcGFyYW0gaXNOZXdWYWx1ZSBgdHJ1ZWAgaWYgcGFyc2luZyBuZXcgdmFsdWUgKGVmZmVjdHMgaG93IHZhbHVlcyBnZXQgYWRkZWQgdG8gYGNoYW5nZXNgKVxuICovXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VLZXlWYWx1ZSh0ZXh0OiBzdHJpbmcsIGNoYW5nZXM6IFN0eWxlQ2hhbmdlc01hcCwgaXNOZXdWYWx1ZTogYm9vbGVhbik6IHZvaWQge1xuICBmb3IgKGxldCBpID0gcGFyc2VTdHlsZSh0ZXh0KTsgaSA+PSAwOyBpID0gcGFyc2VTdHlsZU5leHQodGV4dCwgaSkpIHtcbiAgICBwcm9jZXNzU3R5bGVLZXlWYWx1ZShjaGFuZ2VzLCBnZXRMYXN0UGFyc2VkS2V5KHRleHQpLCBnZXRMYXN0UGFyc2VkVmFsdWUodGV4dCksIGlzTmV3VmFsdWUpO1xuICB9XG59XG5cbi8qKlxuICogQXBwZW5kcyBzdHlsZSBga2V5YC9gdmFsdWVgIGluZm9ybWF0aW9uIGludG8gdGhlIGxpc3Qgb2YgYGNoYW5nZXNgLlxuICpcbiAqIE9uY2UgYWxsIG9mIHRoZSBwYXJzaW5nIGlzIGNvbXBsZXRlLCB0aGUgYGNoYW5nZXNgIHdpbGwgY29udGFpbiBhXG4gKiBzZXQgb2Ygb3BlcmF0aW9ucyB3aGljaCBuZWVkIHRvIGJlIHBlcmZvcm1lZCBvbiB0aGUgRE9NIHRvIHJlY29uY2lsZSBpdC5cbiAqXG4gKiBAcGFyYW0gY2hhbmdlcyBBbiBgU3R5bGVDaGFuZ2VzTWFwIHdoaWNoIHRyYWNrcyBjaGFuZ2VzLlxuICogQHBhcmFtIGtleSBTdHlsZSBrZXkgdG8gYmUgYWRkZWQgdG8gdGhlIGBjaGFuZ2VzYC5cbiAqIEBwYXJhbSB2YWx1ZSBTdHlsZSB2YWx1ZSB0byBiZSBhZGRlZCB0byB0aGUgYGNoYW5nZXNgLlxuICogQHBhcmFtIGlzTmV3VmFsdWUgdHJ1ZSBpZiBga2V5YC9gdmFsdWVgIHNob3VsZCBiZSBwcm9jZXNzZWQgYXMgbmV3IHZhbHVlLlxuICovXG5mdW5jdGlvbiBwcm9jZXNzU3R5bGVLZXlWYWx1ZShcbiAgICBjaGFuZ2VzOiBTdHlsZUNoYW5nZXNNYXAsIGtleTogc3RyaW5nLCB2YWx1ZTogc3RyaW5nLCBpc05ld1ZhbHVlOiBib29sZWFuKTogdm9pZCB7XG4gIGlmIChpc05ld1ZhbHVlKSB7XG4gICAgLy8gVGhpcyBjb2RlIHBhdGggaXMgZXhlY3V0ZWQgd2hlbiB3ZSBhcmUgaXRlcmF0aW5nIG92ZXIgbmV3IHZhbHVlcy5cbiAgICBjb25zdCBleGlzdGluZyA9IGNoYW5nZXMuZ2V0KGtleSk7XG4gICAgaWYgKGV4aXN0aW5nID09PSB1bmRlZmluZWQpIHtcbiAgICAgIC8vIEtleSB3ZSBoYXZlIG5vdCBzZWVuIGJlZm9yZVxuICAgICAgY2hhbmdlcy5zZXQoa2V5LCBzdHlsZUtleVZhbHVlKG51bGwsIHZhbHVlKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIEFscmVhZHkgc2VlbiwgdXBkYXRlIHZhbHVlLlxuICAgICAgZXhpc3RpbmcubmV3ID0gdmFsdWU7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIC8vIFRoaXMgY29kZSBwYXRoIGlzIGV4ZWN1dGVkIHdoZW4gd2UgYXJlIGl0ZXJhdGlvbiBvdmVyIHByZXZpb3VzIHZhbHVlcy5cbiAgICBjaGFuZ2VzLnNldChrZXksIHN0eWxlS2V5VmFsdWUodmFsdWUsIG51bGwpKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBzdHlsZUtleVZhbHVlKG9sZFZhbHVlOiBzdHJpbmcgfCBudWxsLCBuZXdWYWx1ZTogc3RyaW5nIHwgbnVsbCkge1xuICByZXR1cm4ge29sZDogb2xkVmFsdWUsIG5ldzogbmV3VmFsdWV9O1xufVxuXG4vKipcbiAqIFJlbW92ZXMgYSBzdHlsZSBmcm9tIGEgYGNzc1RleHRgIHN0cmluZy5cbiAqXG4gKiBAcGFyYW0gY3NzVGV4dCBBIHN0cmluZyB3aGljaCBjb250YWlucyBzdHlsaW5nLlxuICogQHBhcmFtIHN0eWxlVG9SZW1vdmUgQSBzdHlsZSAoYW5kIGl0cyB2YWx1ZSkgdG8gcmVtb3ZlIGZyb20gYGNzc1RleHRgLlxuICogQHJldHVybnMgYSBuZXcgc3R5bGUgdGV4dCB3aGljaCBkb2VzIG5vdCBoYXZlIGBzdHlsZVRvUmVtb3ZlYCAoYW5kIGl0cyB2YWx1ZSlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlbW92ZVN0eWxlKGNzc1RleHQ6IHN0cmluZywgc3R5bGVUb1JlbW92ZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgaWYgKGNzc1RleHQuaW5kZXhPZihzdHlsZVRvUmVtb3ZlKSA9PT0gLTEpIHtcbiAgICAvLyBoYXBweSBjYXNlIHdoZXJlIHdlIGRvbid0IG5lZWQgdG8gaW52b2tlIHBhcnNlci5cbiAgICByZXR1cm4gY3NzVGV4dDtcbiAgfVxuICBsZXQgbGFzdFZhbHVlRW5kID0gMDtcbiAgZm9yIChsZXQgaSA9IHBhcnNlU3R5bGUoY3NzVGV4dCk7IGkgPj0gMDsgaSA9IHBhcnNlU3R5bGVOZXh0KGNzc1RleHQsIGkpKSB7XG4gICAgY29uc3Qga2V5ID0gZ2V0TGFzdFBhcnNlZEtleShjc3NUZXh0KTtcbiAgICBpZiAoa2V5ID09PSBzdHlsZVRvUmVtb3ZlKSB7XG4gICAgICBpZiAobGFzdFZhbHVlRW5kID09PSAwKSB7XG4gICAgICAgIGNzc1RleHQgPSBjc3NUZXh0LnN1YnN0cmluZyhpKTtcbiAgICAgICAgaSA9IDA7XG4gICAgICB9IGVsc2UgaWYgKGkgPT09IGNzc1RleHQubGVuZ3RoKSB7XG4gICAgICAgIHJldHVybiBjc3NUZXh0LnN1YnN0cmluZygwLCBsYXN0VmFsdWVFbmQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY3NzVGV4dCA9IGNzc1RleHQuc3Vic3RyaW5nKDAsIGxhc3RWYWx1ZUVuZCkgKyAnOyAnICsgY3NzVGV4dC5zdWJzdHJpbmcoaSk7XG4gICAgICAgIGkgPSBsYXN0VmFsdWVFbmQgKyAyOyAgLy8gMiBpcyBmb3IgJzsgJy5sZW5ndGgoc28gdGhhdCB3ZSBza2lwIHRoZSBzZXBhcmF0b3IpXG4gICAgICB9XG4gICAgICByZXNldFBhcnNlclN0YXRlKGNzc1RleHQpO1xuICAgIH1cbiAgICBsYXN0VmFsdWVFbmQgPSBnZXRMYXN0UGFyc2VkVmFsdWVFbmQoKTtcbiAgfVxuICByZXR1cm4gY3NzVGV4dDtcbn1cbiJdfQ==