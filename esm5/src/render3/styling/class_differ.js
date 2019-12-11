/**
* @license
* Copyright Google Inc. All Rights Reserved.
*
* Use of this source code is governed by an MIT-style license that can be
* found in the LICENSE file at https://angular.io/license
*/
import { consumeClassToken, consumeWhitespace } from './styling_parser';
/**
 * Computes the diff between two class-list strings.
 *
 * Example:
 *  `oldValue` => `"A B C"`
 *  `newValue` => `"A C D"`
 * will result in:
 * ```
 * new Map([
 *   ['A', null],
 *   ['B', false],
 *   ['C', null],
 *   ['D', true]
 * ])
 * ```
 *
 * @param oldValue Previous class-list string.
 * @param newValue New class-list string.
 * @returns A `Map` which will be filled with changes.
 *        - `true`: Class needs to be added to the element.
 *        - `false: Class needs to be removed from the element.
 *        - `null`: No change (leave class as is.)
 */
export function computeClassChanges(oldValue, newValue) {
    var changes = new Map();
    splitClassList(oldValue, changes, false);
    splitClassList(newValue, changes, true);
    return changes;
}
/**
 * Splits the class list into array, ignoring whitespace and add it to corresponding categories
 * `changes`.
 *
 * @param text Class list to split
 * @param changes Map which will be filled with changes. (`false` - remove; `null` - noop;
 *        `true` - add.)
 * @param isNewValue `true` if we are processing new list.
 */
export function splitClassList(text, changes, isNewValue) {
    var end = text.length;
    var index = 0;
    while (index < end) {
        index = consumeWhitespace(text, index, end);
        var tokenEnd = consumeClassToken(text, index, end);
        if (tokenEnd !== index) {
            processClassToken(changes, text.substring(index, tokenEnd), isNewValue);
        }
        index = tokenEnd;
    }
}
/**
 * Processes the token by adding it to the `changes` Map.
 *
 * @param changes Map which keeps track of what should be done with each value.
 *        - `false` The token should be deleted. (It was in old list, but not in new list.)
 *        - `null` The token should be ignored. (It was present in old list as well as new list.)
 *        - `true` the token should be added. (It was only present in the new value)
 * @param token Token to add to set.
 * @param isNewValue True if invocation represents an addition (removal otherwise.)
 *        - `false` means that we are processing the old value, which may need to be deleted.
 *          Initially all tokens are labeled `false` (remove it.)
 *        - `true` means that we are processing new value which may need to be added. If a token
 *          with same key already exists with `false` then the resulting token is `null` (no
 *          change.) If no token exists then the new token value is `true` (add it.)
 */
export function processClassToken(changes, token, isNewValue) {
    if (isNewValue) {
        // This code path is executed when we are iterating over new values.
        var existingTokenValue = changes.get(token);
        if (existingTokenValue === undefined) {
            // the new list has a token which is not present in the old list. Mark it for addition.
            changes.set(token, true);
        }
        else if (existingTokenValue === false) {
            // If the existing value is `false` this means it was in the old list. Because it is in the
            // new list as well we marked it as `null` (noop.)
            changes.set(token, null);
        }
    }
    else {
        // This code path is executed when we are iterating over previous values.
        // This means that we store the tokens in `changes` with `false` (removals).
        changes.set(token, false);
    }
}
/**
 * Removes a class from a `className` string.
 *
 * @param className A string containing classes (whitespace separated)
 * @param classToRemove A class name to remove from the `className`
 * @returns a new class-list which does not have `classToRemove`
 */
export function removeClass(className, classToRemove) {
    var start = 0;
    var end = className.length;
    while (start < end) {
        start = className.indexOf(classToRemove, start);
        if (start === -1) {
            // we did not find anything, so just bail.
            break;
        }
        var removeLength = classToRemove.length;
        var hasLeadingWhiteSpace = start === 0 || className.charCodeAt(start - 1) <= 32 /* SPACE */;
        var hasTrailingWhiteSpace = start + removeLength === end ||
            className.charCodeAt(start + removeLength) <= 32 /* SPACE */;
        if (hasLeadingWhiteSpace && hasTrailingWhiteSpace) {
            // Cut out the class which should be removed.
            var endWhitespace = consumeWhitespace(className, start + removeLength, end);
            className = className.substring(0, start) + className.substring(endWhitespace, end);
            end = className.length;
        }
        else {
            // in this case we are only a substring of the actual class, move on.
            start = start + removeLength;
        }
    }
    return className;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xhc3NfZGlmZmVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9zdHlsaW5nL2NsYXNzX2RpZmZlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0VBTUU7QUFHRixPQUFPLEVBQUMsaUJBQWlCLEVBQUUsaUJBQWlCLEVBQUMsTUFBTSxrQkFBa0IsQ0FBQztBQUV0RTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztHQXNCRztBQUNILE1BQU0sVUFBVSxtQkFBbUIsQ0FBQyxRQUFnQixFQUFFLFFBQWdCO0lBQ3BFLElBQU0sT0FBTyxHQUFHLElBQUksR0FBRyxFQUF3QixDQUFDO0lBQ2hELGNBQWMsQ0FBQyxRQUFRLEVBQUUsT0FBTyxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQ3pDLGNBQWMsQ0FBQyxRQUFRLEVBQUUsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQ3hDLE9BQU8sT0FBTyxDQUFDO0FBQ2pCLENBQUM7QUFFRDs7Ozs7Ozs7R0FRRztBQUNILE1BQU0sVUFBVSxjQUFjLENBQzFCLElBQVksRUFBRSxPQUFrQyxFQUFFLFVBQW1CO0lBQ3ZFLElBQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUM7SUFDeEIsSUFBSSxLQUFLLEdBQUcsQ0FBQyxDQUFDO0lBQ2QsT0FBTyxLQUFLLEdBQUcsR0FBRyxFQUFFO1FBQ2xCLEtBQUssR0FBRyxpQkFBaUIsQ0FBQyxJQUFJLEVBQUUsS0FBSyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBQzVDLElBQU0sUUFBUSxHQUFHLGlCQUFpQixDQUFDLElBQUksRUFBRSxLQUFLLEVBQUUsR0FBRyxDQUFDLENBQUM7UUFDckQsSUFBSSxRQUFRLEtBQUssS0FBSyxFQUFFO1lBQ3RCLGlCQUFpQixDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssRUFBRSxRQUFRLENBQUMsRUFBRSxVQUFVLENBQUMsQ0FBQztTQUN6RTtRQUNELEtBQUssR0FBRyxRQUFRLENBQUM7S0FDbEI7QUFDSCxDQUFDO0FBRUQ7Ozs7Ozs7Ozs7Ozs7O0dBY0c7QUFDSCxNQUFNLFVBQVUsaUJBQWlCLENBQzdCLE9BQWtDLEVBQUUsS0FBYSxFQUFFLFVBQW1CO0lBQ3hFLElBQUksVUFBVSxFQUFFO1FBQ2Qsb0VBQW9FO1FBQ3BFLElBQU0sa0JBQWtCLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUM5QyxJQUFJLGtCQUFrQixLQUFLLFNBQVMsRUFBRTtZQUNwQyx1RkFBdUY7WUFDdkYsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLENBQUM7U0FDMUI7YUFBTSxJQUFJLGtCQUFrQixLQUFLLEtBQUssRUFBRTtZQUN2QywyRkFBMkY7WUFDM0Ysa0RBQWtEO1lBQ2xELE9BQU8sQ0FBQyxHQUFHLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxDQUFDO1NBQzFCO0tBQ0Y7U0FBTTtRQUNMLHlFQUF5RTtRQUN6RSw0RUFBNEU7UUFDNUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7S0FDM0I7QUFDSCxDQUFDO0FBRUQ7Ozs7OztHQU1HO0FBQ0gsTUFBTSxVQUFVLFdBQVcsQ0FBQyxTQUFpQixFQUFFLGFBQXFCO0lBQ2xFLElBQUksS0FBSyxHQUFHLENBQUMsQ0FBQztJQUNkLElBQUksR0FBRyxHQUFHLFNBQVMsQ0FBQyxNQUFNLENBQUM7SUFDM0IsT0FBTyxLQUFLLEdBQUcsR0FBRyxFQUFFO1FBQ2xCLEtBQUssR0FBRyxTQUFTLENBQUMsT0FBTyxDQUFDLGFBQWEsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUNoRCxJQUFJLEtBQUssS0FBSyxDQUFDLENBQUMsRUFBRTtZQUNoQiwwQ0FBMEM7WUFDMUMsTUFBTTtTQUNQO1FBQ0QsSUFBTSxZQUFZLEdBQUcsYUFBYSxDQUFDLE1BQU0sQ0FBQztRQUMxQyxJQUFNLG9CQUFvQixHQUFHLEtBQUssS0FBSyxDQUFDLElBQUksU0FBUyxDQUFDLFVBQVUsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLGtCQUFrQixDQUFDO1FBQzlGLElBQU0scUJBQXFCLEdBQUcsS0FBSyxHQUFHLFlBQVksS0FBSyxHQUFHO1lBQ3RELFNBQVMsQ0FBQyxVQUFVLENBQUMsS0FBSyxHQUFHLFlBQVksQ0FBQyxrQkFBa0IsQ0FBQztRQUNqRSxJQUFJLG9CQUFvQixJQUFJLHFCQUFxQixFQUFFO1lBQ2pELDZDQUE2QztZQUM3QyxJQUFNLGFBQWEsR0FBRyxpQkFBaUIsQ0FBQyxTQUFTLEVBQUUsS0FBSyxHQUFHLFlBQVksRUFBRSxHQUFHLENBQUMsQ0FBQztZQUM5RSxTQUFTLEdBQUcsU0FBUyxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLEdBQUcsU0FBUyxDQUFDLFNBQVMsQ0FBQyxhQUFhLEVBQUUsR0FBRyxDQUFDLENBQUM7WUFDcEYsR0FBRyxHQUFHLFNBQVMsQ0FBQyxNQUFNLENBQUM7U0FDeEI7YUFBTTtZQUNMLHFFQUFxRTtZQUNyRSxLQUFLLEdBQUcsS0FBSyxHQUFHLFlBQVksQ0FBQztTQUM5QjtLQUNGO0lBQ0QsT0FBTyxTQUFTLENBQUM7QUFDbkIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuKiBAbGljZW5zZVxuKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbipcbiogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuKi9cblxuaW1wb3J0IHtDaGFyQ29kZX0gZnJvbSAnLi4vLi4vdXRpbC9jaGFyX2NvZGUnO1xuaW1wb3J0IHtjb25zdW1lQ2xhc3NUb2tlbiwgY29uc3VtZVdoaXRlc3BhY2V9IGZyb20gJy4vc3R5bGluZ19wYXJzZXInO1xuXG4vKipcbiAqIENvbXB1dGVzIHRoZSBkaWZmIGJldHdlZW4gdHdvIGNsYXNzLWxpc3Qgc3RyaW5ncy5cbiAqXG4gKiBFeGFtcGxlOlxuICogIGBvbGRWYWx1ZWAgPT4gYFwiQSBCIENcImBcbiAqICBgbmV3VmFsdWVgID0+IGBcIkEgQyBEXCJgXG4gKiB3aWxsIHJlc3VsdCBpbjpcbiAqIGBgYFxuICogbmV3IE1hcChbXG4gKiAgIFsnQScsIG51bGxdLFxuICogICBbJ0InLCBmYWxzZV0sXG4gKiAgIFsnQycsIG51bGxdLFxuICogICBbJ0QnLCB0cnVlXVxuICogXSlcbiAqIGBgYFxuICpcbiAqIEBwYXJhbSBvbGRWYWx1ZSBQcmV2aW91cyBjbGFzcy1saXN0IHN0cmluZy5cbiAqIEBwYXJhbSBuZXdWYWx1ZSBOZXcgY2xhc3MtbGlzdCBzdHJpbmcuXG4gKiBAcmV0dXJucyBBIGBNYXBgIHdoaWNoIHdpbGwgYmUgZmlsbGVkIHdpdGggY2hhbmdlcy5cbiAqICAgICAgICAtIGB0cnVlYDogQ2xhc3MgbmVlZHMgdG8gYmUgYWRkZWQgdG8gdGhlIGVsZW1lbnQuXG4gKiAgICAgICAgLSBgZmFsc2U6IENsYXNzIG5lZWRzIHRvIGJlIHJlbW92ZWQgZnJvbSB0aGUgZWxlbWVudC5cbiAqICAgICAgICAtIGBudWxsYDogTm8gY2hhbmdlIChsZWF2ZSBjbGFzcyBhcyBpcy4pXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb21wdXRlQ2xhc3NDaGFuZ2VzKG9sZFZhbHVlOiBzdHJpbmcsIG5ld1ZhbHVlOiBzdHJpbmcpOiBNYXA8c3RyaW5nLCBib29sZWFufG51bGw+IHtcbiAgY29uc3QgY2hhbmdlcyA9IG5ldyBNYXA8c3RyaW5nLCBib29sZWFufG51bGw+KCk7XG4gIHNwbGl0Q2xhc3NMaXN0KG9sZFZhbHVlLCBjaGFuZ2VzLCBmYWxzZSk7XG4gIHNwbGl0Q2xhc3NMaXN0KG5ld1ZhbHVlLCBjaGFuZ2VzLCB0cnVlKTtcbiAgcmV0dXJuIGNoYW5nZXM7XG59XG5cbi8qKlxuICogU3BsaXRzIHRoZSBjbGFzcyBsaXN0IGludG8gYXJyYXksIGlnbm9yaW5nIHdoaXRlc3BhY2UgYW5kIGFkZCBpdCB0byBjb3JyZXNwb25kaW5nIGNhdGVnb3JpZXNcbiAqIGBjaGFuZ2VzYC5cbiAqXG4gKiBAcGFyYW0gdGV4dCBDbGFzcyBsaXN0IHRvIHNwbGl0XG4gKiBAcGFyYW0gY2hhbmdlcyBNYXAgd2hpY2ggd2lsbCBiZSBmaWxsZWQgd2l0aCBjaGFuZ2VzLiAoYGZhbHNlYCAtIHJlbW92ZTsgYG51bGxgIC0gbm9vcDtcbiAqICAgICAgICBgdHJ1ZWAgLSBhZGQuKVxuICogQHBhcmFtIGlzTmV3VmFsdWUgYHRydWVgIGlmIHdlIGFyZSBwcm9jZXNzaW5nIG5ldyBsaXN0LlxuICovXG5leHBvcnQgZnVuY3Rpb24gc3BsaXRDbGFzc0xpc3QoXG4gICAgdGV4dDogc3RyaW5nLCBjaGFuZ2VzOiBNYXA8c3RyaW5nLCBib29sZWFufG51bGw+LCBpc05ld1ZhbHVlOiBib29sZWFuKTogdm9pZCB7XG4gIGNvbnN0IGVuZCA9IHRleHQubGVuZ3RoO1xuICBsZXQgaW5kZXggPSAwO1xuICB3aGlsZSAoaW5kZXggPCBlbmQpIHtcbiAgICBpbmRleCA9IGNvbnN1bWVXaGl0ZXNwYWNlKHRleHQsIGluZGV4LCBlbmQpO1xuICAgIGNvbnN0IHRva2VuRW5kID0gY29uc3VtZUNsYXNzVG9rZW4odGV4dCwgaW5kZXgsIGVuZCk7XG4gICAgaWYgKHRva2VuRW5kICE9PSBpbmRleCkge1xuICAgICAgcHJvY2Vzc0NsYXNzVG9rZW4oY2hhbmdlcywgdGV4dC5zdWJzdHJpbmcoaW5kZXgsIHRva2VuRW5kKSwgaXNOZXdWYWx1ZSk7XG4gICAgfVxuICAgIGluZGV4ID0gdG9rZW5FbmQ7XG4gIH1cbn1cblxuLyoqXG4gKiBQcm9jZXNzZXMgdGhlIHRva2VuIGJ5IGFkZGluZyBpdCB0byB0aGUgYGNoYW5nZXNgIE1hcC5cbiAqXG4gKiBAcGFyYW0gY2hhbmdlcyBNYXAgd2hpY2gga2VlcHMgdHJhY2sgb2Ygd2hhdCBzaG91bGQgYmUgZG9uZSB3aXRoIGVhY2ggdmFsdWUuXG4gKiAgICAgICAgLSBgZmFsc2VgIFRoZSB0b2tlbiBzaG91bGQgYmUgZGVsZXRlZC4gKEl0IHdhcyBpbiBvbGQgbGlzdCwgYnV0IG5vdCBpbiBuZXcgbGlzdC4pXG4gKiAgICAgICAgLSBgbnVsbGAgVGhlIHRva2VuIHNob3VsZCBiZSBpZ25vcmVkLiAoSXQgd2FzIHByZXNlbnQgaW4gb2xkIGxpc3QgYXMgd2VsbCBhcyBuZXcgbGlzdC4pXG4gKiAgICAgICAgLSBgdHJ1ZWAgdGhlIHRva2VuIHNob3VsZCBiZSBhZGRlZC4gKEl0IHdhcyBvbmx5IHByZXNlbnQgaW4gdGhlIG5ldyB2YWx1ZSlcbiAqIEBwYXJhbSB0b2tlbiBUb2tlbiB0byBhZGQgdG8gc2V0LlxuICogQHBhcmFtIGlzTmV3VmFsdWUgVHJ1ZSBpZiBpbnZvY2F0aW9uIHJlcHJlc2VudHMgYW4gYWRkaXRpb24gKHJlbW92YWwgb3RoZXJ3aXNlLilcbiAqICAgICAgICAtIGBmYWxzZWAgbWVhbnMgdGhhdCB3ZSBhcmUgcHJvY2Vzc2luZyB0aGUgb2xkIHZhbHVlLCB3aGljaCBtYXkgbmVlZCB0byBiZSBkZWxldGVkLlxuICogICAgICAgICAgSW5pdGlhbGx5IGFsbCB0b2tlbnMgYXJlIGxhYmVsZWQgYGZhbHNlYCAocmVtb3ZlIGl0LilcbiAqICAgICAgICAtIGB0cnVlYCBtZWFucyB0aGF0IHdlIGFyZSBwcm9jZXNzaW5nIG5ldyB2YWx1ZSB3aGljaCBtYXkgbmVlZCB0byBiZSBhZGRlZC4gSWYgYSB0b2tlblxuICogICAgICAgICAgd2l0aCBzYW1lIGtleSBhbHJlYWR5IGV4aXN0cyB3aXRoIGBmYWxzZWAgdGhlbiB0aGUgcmVzdWx0aW5nIHRva2VuIGlzIGBudWxsYCAobm9cbiAqICAgICAgICAgIGNoYW5nZS4pIElmIG5vIHRva2VuIGV4aXN0cyB0aGVuIHRoZSBuZXcgdG9rZW4gdmFsdWUgaXMgYHRydWVgIChhZGQgaXQuKVxuICovXG5leHBvcnQgZnVuY3Rpb24gcHJvY2Vzc0NsYXNzVG9rZW4oXG4gICAgY2hhbmdlczogTWFwPHN0cmluZywgYm9vbGVhbnxudWxsPiwgdG9rZW46IHN0cmluZywgaXNOZXdWYWx1ZTogYm9vbGVhbikge1xuICBpZiAoaXNOZXdWYWx1ZSkge1xuICAgIC8vIFRoaXMgY29kZSBwYXRoIGlzIGV4ZWN1dGVkIHdoZW4gd2UgYXJlIGl0ZXJhdGluZyBvdmVyIG5ldyB2YWx1ZXMuXG4gICAgY29uc3QgZXhpc3RpbmdUb2tlblZhbHVlID0gY2hhbmdlcy5nZXQodG9rZW4pO1xuICAgIGlmIChleGlzdGluZ1Rva2VuVmFsdWUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgLy8gdGhlIG5ldyBsaXN0IGhhcyBhIHRva2VuIHdoaWNoIGlzIG5vdCBwcmVzZW50IGluIHRoZSBvbGQgbGlzdC4gTWFyayBpdCBmb3IgYWRkaXRpb24uXG4gICAgICBjaGFuZ2VzLnNldCh0b2tlbiwgdHJ1ZSk7XG4gICAgfSBlbHNlIGlmIChleGlzdGluZ1Rva2VuVmFsdWUgPT09IGZhbHNlKSB7XG4gICAgICAvLyBJZiB0aGUgZXhpc3RpbmcgdmFsdWUgaXMgYGZhbHNlYCB0aGlzIG1lYW5zIGl0IHdhcyBpbiB0aGUgb2xkIGxpc3QuIEJlY2F1c2UgaXQgaXMgaW4gdGhlXG4gICAgICAvLyBuZXcgbGlzdCBhcyB3ZWxsIHdlIG1hcmtlZCBpdCBhcyBgbnVsbGAgKG5vb3AuKVxuICAgICAgY2hhbmdlcy5zZXQodG9rZW4sIG51bGwpO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICAvLyBUaGlzIGNvZGUgcGF0aCBpcyBleGVjdXRlZCB3aGVuIHdlIGFyZSBpdGVyYXRpbmcgb3ZlciBwcmV2aW91cyB2YWx1ZXMuXG4gICAgLy8gVGhpcyBtZWFucyB0aGF0IHdlIHN0b3JlIHRoZSB0b2tlbnMgaW4gYGNoYW5nZXNgIHdpdGggYGZhbHNlYCAocmVtb3ZhbHMpLlxuICAgIGNoYW5nZXMuc2V0KHRva2VuLCBmYWxzZSk7XG4gIH1cbn1cblxuLyoqXG4gKiBSZW1vdmVzIGEgY2xhc3MgZnJvbSBhIGBjbGFzc05hbWVgIHN0cmluZy5cbiAqXG4gKiBAcGFyYW0gY2xhc3NOYW1lIEEgc3RyaW5nIGNvbnRhaW5pbmcgY2xhc3NlcyAod2hpdGVzcGFjZSBzZXBhcmF0ZWQpXG4gKiBAcGFyYW0gY2xhc3NUb1JlbW92ZSBBIGNsYXNzIG5hbWUgdG8gcmVtb3ZlIGZyb20gdGhlIGBjbGFzc05hbWVgXG4gKiBAcmV0dXJucyBhIG5ldyBjbGFzcy1saXN0IHdoaWNoIGRvZXMgbm90IGhhdmUgYGNsYXNzVG9SZW1vdmVgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZW1vdmVDbGFzcyhjbGFzc05hbWU6IHN0cmluZywgY2xhc3NUb1JlbW92ZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgbGV0IHN0YXJ0ID0gMDtcbiAgbGV0IGVuZCA9IGNsYXNzTmFtZS5sZW5ndGg7XG4gIHdoaWxlIChzdGFydCA8IGVuZCkge1xuICAgIHN0YXJ0ID0gY2xhc3NOYW1lLmluZGV4T2YoY2xhc3NUb1JlbW92ZSwgc3RhcnQpO1xuICAgIGlmIChzdGFydCA9PT0gLTEpIHtcbiAgICAgIC8vIHdlIGRpZCBub3QgZmluZCBhbnl0aGluZywgc28ganVzdCBiYWlsLlxuICAgICAgYnJlYWs7XG4gICAgfVxuICAgIGNvbnN0IHJlbW92ZUxlbmd0aCA9IGNsYXNzVG9SZW1vdmUubGVuZ3RoO1xuICAgIGNvbnN0IGhhc0xlYWRpbmdXaGl0ZVNwYWNlID0gc3RhcnQgPT09IDAgfHwgY2xhc3NOYW1lLmNoYXJDb2RlQXQoc3RhcnQgLSAxKSA8PSBDaGFyQ29kZS5TUEFDRTtcbiAgICBjb25zdCBoYXNUcmFpbGluZ1doaXRlU3BhY2UgPSBzdGFydCArIHJlbW92ZUxlbmd0aCA9PT0gZW5kIHx8XG4gICAgICAgIGNsYXNzTmFtZS5jaGFyQ29kZUF0KHN0YXJ0ICsgcmVtb3ZlTGVuZ3RoKSA8PSBDaGFyQ29kZS5TUEFDRTtcbiAgICBpZiAoaGFzTGVhZGluZ1doaXRlU3BhY2UgJiYgaGFzVHJhaWxpbmdXaGl0ZVNwYWNlKSB7XG4gICAgICAvLyBDdXQgb3V0IHRoZSBjbGFzcyB3aGljaCBzaG91bGQgYmUgcmVtb3ZlZC5cbiAgICAgIGNvbnN0IGVuZFdoaXRlc3BhY2UgPSBjb25zdW1lV2hpdGVzcGFjZShjbGFzc05hbWUsIHN0YXJ0ICsgcmVtb3ZlTGVuZ3RoLCBlbmQpO1xuICAgICAgY2xhc3NOYW1lID0gY2xhc3NOYW1lLnN1YnN0cmluZygwLCBzdGFydCkgKyBjbGFzc05hbWUuc3Vic3RyaW5nKGVuZFdoaXRlc3BhY2UsIGVuZCk7XG4gICAgICBlbmQgPSBjbGFzc05hbWUubGVuZ3RoO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBpbiB0aGlzIGNhc2Ugd2UgYXJlIG9ubHkgYSBzdWJzdHJpbmcgb2YgdGhlIGFjdHVhbCBjbGFzcywgbW92ZSBvbi5cbiAgICAgIHN0YXJ0ID0gc3RhcnQgKyByZW1vdmVMZW5ndGg7XG4gICAgfVxuICB9XG4gIHJldHVybiBjbGFzc05hbWU7XG59Il19