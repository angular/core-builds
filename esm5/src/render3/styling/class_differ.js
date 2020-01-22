/**
* @license
* Copyright Google Inc. All Rights Reserved.
*
* Use of this source code is governed by an MIT-style license that can be
* found in the LICENSE file at https://angular.io/license
*/
import { consumeWhitespace, getLastParsedKey, parseClassName, parseClassNameNext } from './styling_parser';
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
    for (var i = parseClassName(text); i >= 0; i = parseClassNameNext(text, i)) {
        processClassToken(changes, getLastParsedKey(text), isNewValue);
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
    return toggleClass(className, classToRemove, false);
}
/**
 * Toggles a class in `className` string.
 *
 * @param className A string containing classes (whitespace separated)
 * @param classToToggle A class name to remove or add to the `className`
 * @param toggle Whether the resulting `className` should contain or not the `classToToggle`
 * @returns a new class-list which does not have `classToRemove`
 */
export function toggleClass(className, classToToggle, toggle) {
    if (className === '') {
        return toggle ? classToToggle : '';
    }
    var start = 0;
    var end = className.length;
    while (start < end) {
        start = classIndexOf(className, classToToggle, start);
        if (start === -1) {
            if (toggle === true) {
                className = className === '' ? classToToggle : className + ' ' + classToToggle;
            }
            break;
        }
        var removeLength = classToToggle.length;
        if (toggle === true) {
            // we found it and we should have it so just return
            return className;
        }
        else {
            // Cut out the class which should be removed.
            var endWhitespace = consumeWhitespace(className, start + removeLength, end);
            className = className.substring(0, start) + className.substring(endWhitespace, end);
            end = className.length;
        }
    }
    return className;
}
/**
 * Returns an index of `classToSearch` in `className` taking token boundaries into account.
 *
 * `classIndexOf('AB A', 'A', 0)` will be 3 (not 0 since `AB!==A`)
 *
 * @param className A string containing classes (whitespace separated)
 * @param classToSearch A class name to locate
 * @param startingIndex Starting location of search
 * @returns an index of the located class (or -1 if not found)
 */
export function classIndexOf(className, classToSearch, startingIndex) {
    var end = className.length;
    while (true) {
        var foundIndex = className.indexOf(classToSearch, startingIndex);
        if (foundIndex === -1)
            return foundIndex;
        if (foundIndex === 0 || className.charCodeAt(foundIndex - 1) <= 32 /* SPACE */) {
            // Ensure that it has leading whitespace
            var removeLength = classToSearch.length;
            if (foundIndex + removeLength === end ||
                className.charCodeAt(foundIndex + removeLength) <= 32 /* SPACE */) {
                // Ensure that it has trailing whitespace
                return foundIndex;
            }
        }
        // False positive, keep searching from where we left off.
        startingIndex = foundIndex + 1;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xhc3NfZGlmZmVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9zdHlsaW5nL2NsYXNzX2RpZmZlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0VBTUU7QUFJRixPQUFPLEVBQUMsaUJBQWlCLEVBQUUsZ0JBQWdCLEVBQUUsY0FBYyxFQUFFLGtCQUFrQixFQUFDLE1BQU0sa0JBQWtCLENBQUM7QUFHekc7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7R0FzQkc7QUFDSCxNQUFNLFVBQVUsbUJBQW1CLENBQUMsUUFBZ0IsRUFBRSxRQUFnQjtJQUNwRSxJQUFNLE9BQU8sR0FBRyxJQUFJLEdBQUcsRUFBd0IsQ0FBQztJQUNoRCxjQUFjLENBQUMsUUFBUSxFQUFFLE9BQU8sRUFBRSxLQUFLLENBQUMsQ0FBQztJQUN6QyxjQUFjLENBQUMsUUFBUSxFQUFFLE9BQU8sRUFBRSxJQUFJLENBQUMsQ0FBQztJQUN4QyxPQUFPLE9BQU8sQ0FBQztBQUNqQixDQUFDO0FBRUQ7Ozs7Ozs7O0dBUUc7QUFDSCxNQUFNLFVBQVUsY0FBYyxDQUMxQixJQUFZLEVBQUUsT0FBa0MsRUFBRSxVQUFtQjtJQUN2RSxLQUFLLElBQUksQ0FBQyxHQUFHLGNBQWMsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsR0FBRyxrQkFBa0IsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLEVBQUU7UUFDMUUsaUJBQWlCLENBQUMsT0FBTyxFQUFFLGdCQUFnQixDQUFDLElBQUksQ0FBQyxFQUFFLFVBQVUsQ0FBQyxDQUFDO0tBQ2hFO0FBQ0gsQ0FBQztBQUVEOzs7Ozs7Ozs7Ozs7OztHQWNHO0FBQ0gsTUFBTSxVQUFVLGlCQUFpQixDQUM3QixPQUFrQyxFQUFFLEtBQWEsRUFBRSxVQUFtQjtJQUN4RSxJQUFJLFVBQVUsRUFBRTtRQUNkLG9F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MUMsSUFBSSxVQUFVLEdBQUcsWUFBWSxLQUFLLEdBQUc7Z0JBQ2pDLFNBQVMsQ0FBQyxVQUFVLENBQUMsVUFBVSxHQUFHLFlBQVksQ0FBQyxrQkFBa0IsRUFBRTtnQkFDckUseUNBQXlDO2dCQUN6QyxPQUFPLFVBQVUsQ0FBQzthQUNuQjtTQUNGO1FBQ0QseURBQXlEO1FBQ3pELGFBQWEsR0FBRyxVQUFVLEdBQUcsQ0FBQyxDQUFDO0tBQ2hDO0FBQ0gsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuKiBAbGljZW5zZVxuKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbipcbiogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuKi9cblxuaW1wb3J0IHtDaGFyQ29kZX0gZnJvbSAnLi4vLi4vdXRpbC9jaGFyX2NvZGUnO1xuXG5pbXBvcnQge2NvbnN1bWVXaGl0ZXNwYWNlLCBnZXRMYXN0UGFyc2VkS2V5LCBwYXJzZUNsYXNzTmFtZSwgcGFyc2VDbGFzc05hbWVOZXh0fSBmcm9tICcuL3N0eWxpbmdfcGFyc2VyJztcblxuXG4vKipcbiAqIENvbXB1dGVzIHRoZSBkaWZmIGJldHdlZW4gdHdvIGNsYXNzLWxpc3Qgc3RyaW5ncy5cbiAqXG4gKiBFeGFtcGxlOlxuICogIGBvbGRWYWx1ZWAgPT4gYFwiQSBCIENcImBcbiAqICBgbmV3VmFsdWVgID0+IGBcIkEgQyBEXCJgXG4gKiB3aWxsIHJlc3VsdCBpbjpcbiAqIGBgYFxuICogbmV3IE1hcChbXG4gKiAgIFsnQScsIG51bGxdLFxuICogICBbJ0InLCBmYWxzZV0sXG4gKiAgIFsnQycsIG51bGxdLFxuICogICBbJ0QnLCB0cnVlXVxuICogXSlcbiAqIGBgYFxuICpcbiAqIEBwYXJhbSBvbGRWYWx1ZSBQcmV2aW91cyBjbGFzcy1saXN0IHN0cmluZy5cbiAqIEBwYXJhbSBuZXdWYWx1ZSBOZXcgY2xhc3MtbGlzdCBzdHJpbmcuXG4gKiBAcmV0dXJucyBBIGBNYXBgIHdoaWNoIHdpbGwgYmUgZmlsbGVkIHdpdGggY2hhbmdlcy5cbiAqICAgICAgICAtIGB0cnVlYDogQ2xhc3MgbmVlZHMgdG8gYmUgYWRkZWQgdG8gdGhlIGVsZW1lbnQuXG4gKiAgICAgICAgLSBgZmFsc2U6IENsYXNzIG5lZWRzIHRvIGJlIHJlbW92ZWQgZnJvbSB0aGUgZWxlbWVudC5cbiAqICAgICAgICAtIGBudWxsYDogTm8gY2hhbmdlIChsZWF2ZSBjbGFzcyBhcyBpcy4pXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb21wdXRlQ2xhc3NDaGFuZ2VzKG9sZFZhbHVlOiBzdHJpbmcsIG5ld1ZhbHVlOiBzdHJpbmcpOiBNYXA8c3RyaW5nLCBib29sZWFufG51bGw+IHtcbiAgY29uc3QgY2hhbmdlcyA9IG5ldyBNYXA8c3RyaW5nLCBib29sZWFufG51bGw+KCk7XG4gIHNwbGl0Q2xhc3NMaXN0KG9sZFZhbHVlLCBjaGFuZ2VzLCBmYWxzZSk7XG4gIHNwbGl0Q2xhc3NMaXN0KG5ld1ZhbHVlLCBjaGFuZ2VzLCB0cnVlKTtcbiAgcmV0dXJuIGNoYW5nZXM7XG59XG5cbi8qKlxuICogU3BsaXRzIHRoZSBjbGFzcyBsaXN0IGludG8gYXJyYXksIGlnbm9yaW5nIHdoaXRlc3BhY2UgYW5kIGFkZCBpdCB0byBjb3JyZXNwb25kaW5nIGNhdGVnb3JpZXNcbiAqIGBjaGFuZ2VzYC5cbiAqXG4gKiBAcGFyYW0gdGV4dCBDbGFzcyBsaXN0IHRvIHNwbGl0XG4gKiBAcGFyYW0gY2hhbmdlcyBNYXAgd2hpY2ggd2lsbCBiZSBmaWxsZWQgd2l0aCBjaGFuZ2VzLiAoYGZhbHNlYCAtIHJlbW92ZTsgYG51bGxgIC0gbm9vcDtcbiAqICAgICAgICBgdHJ1ZWAgLSBhZGQuKVxuICogQHBhcmFtIGlzTmV3VmFsdWUgYHRydWVgIGlmIHdlIGFyZSBwcm9jZXNzaW5nIG5ldyBsaXN0LlxuICovXG5leHBvcnQgZnVuY3Rpb24gc3BsaXRDbGFzc0xpc3QoXG4gICAgdGV4dDogc3RyaW5nLCBjaGFuZ2VzOiBNYXA8c3RyaW5nLCBib29sZWFufG51bGw+LCBpc05ld1ZhbHVlOiBib29sZWFuKTogdm9pZCB7XG4gIGZvciAobGV0IGkgPSBwYXJzZUNsYXNzTmFtZSh0ZXh0KTsgaSA+PSAwOyBpID0gcGFyc2VDbGFzc05hbWVOZXh0KHRleHQsIGkpKSB7XG4gICAgcHJvY2Vzc0NsYXNzVG9rZW4oY2hhbmdlcywgZ2V0TGFzdFBhcnNlZEtleSh0ZXh0KSwgaXNOZXdWYWx1ZSk7XG4gIH1cbn1cblxuLyoqXG4gKiBQcm9jZXNzZXMgdGhlIHRva2VuIGJ5IGFkZGluZyBpdCB0byB0aGUgYGNoYW5nZXNgIE1hcC5cbiAqXG4gKiBAcGFyYW0gY2hhbmdlcyBNYXAgd2hpY2gga2VlcHMgdHJhY2sgb2Ygd2hhdCBzaG91bGQgYmUgZG9uZSB3aXRoIGVhY2ggdmFsdWUuXG4gKiAgICAgICAgLSBgZmFsc2VgIFRoZSB0b2tlbiBzaG91bGQgYmUgZGVsZXRlZC4gKEl0IHdhcyBpbiBvbGQgbGlzdCwgYnV0IG5vdCBpbiBuZXcgbGlzdC4pXG4gKiAgICAgICAgLSBgbnVsbGAgVGhlIHRva2VuIHNob3VsZCBiZSBpZ25vcmVkLiAoSXQgd2FzIHByZXNlbnQgaW4gb2xkIGxpc3QgYXMgd2VsbCBhcyBuZXcgbGlzdC4pXG4gKiAgICAgICAgLSBgdHJ1ZWAgdGhlIHRva2VuIHNob3VsZCBiZSBhZGRlZC4gKEl0IHdhcyBvbmx5IHByZXNlbnQgaW4gdGhlIG5ldyB2YWx1ZSlcbiAqIEBwYXJhbSB0b2tlbiBUb2tlbiB0byBhZGQgdG8gc2V0LlxuICogQHBhcmFtIGlzTmV3VmFsdWUgVHJ1ZSBpZiBpbnZvY2F0aW9uIHJlcHJlc2VudHMgYW4gYWRkaXRpb24gKHJlbW92YWwgb3RoZXJ3aXNlLilcbiAqICAgICAgICAtIGBmYWxzZWAgbWVhbnMgdGhhdCB3ZSBhcmUgcHJvY2Vzc2luZyB0aGUgb2xkIHZhbHVlLCB3aGljaCBtYXkgbmVlZCB0byBiZSBkZWxldGVkLlxuICogICAgICAgICAgSW5pdGlhbGx5IGFsbCB0b2tlbnMgYXJlIGxhYmVsZWQgYGZhbHNlYCAocmVtb3ZlIGl0LilcbiAqICAgICAgICAtIGB0cnVlYCBtZWFucyB0aGF0IHdlIGFyZSBwcm9jZXNzaW5nIG5ldyB2YWx1ZSB3aGljaCBtYXkgbmVlZCB0byBiZSBhZGRlZC4gSWYgYSB0b2tlblxuICogICAgICAgICAgd2l0aCBzYW1lIGtleSBhbHJlYWR5IGV4aXN0cyB3aXRoIGBmYWxzZWAgdGhlbiB0aGUgcmVzdWx0aW5nIHRva2VuIGlzIGBudWxsYCAobm9cbiAqICAgICAgICAgIGNoYW5nZS4pIElmIG5vIHRva2VuIGV4aXN0cyB0aGVuIHRoZSBuZXcgdG9rZW4gdmFsdWUgaXMgYHRydWVgIChhZGQgaXQuKVxuICovXG5leHBvcnQgZnVuY3Rpb24gcHJvY2Vzc0NsYXNzVG9rZW4oXG4gICAgY2hhbmdlczogTWFwPHN0cmluZywgYm9vbGVhbnxudWxsPiwgdG9rZW46IHN0cmluZywgaXNOZXdWYWx1ZTogYm9vbGVhbikge1xuICBpZiAoaXNOZXdWYWx1ZSkge1xuICAgIC8vIFRoaXMgY29kZSBwYXRoIGlzIGV4ZWN1dGVkIHdoZW4gd2UgYXJlIGl0ZXJhdGluZyBvdmVyIG5ldyB2YWx1ZXMuXG4gICAgY29uc3QgZXhpc3RpbmdUb2tlblZhbHVlID0gY2hhbmdlcy5nZXQodG9rZW4pO1xuICAgIGlmIChleGlzdGluZ1Rva2VuVmFsdWUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgLy8gdGhlIG5ldyBsaXN0IGhhcyBhIHRva2VuIHdoaWNoIGlzIG5vdCBwcmVzZW50IGluIHRoZSBvbGQgbGlzdC4gTWFyayBpdCBmb3IgYWRkaXRpb24uXG4gICAgICBjaGFuZ2VzLnNldCh0b2tlbiwgdHJ1ZSk7XG4gICAgfSBlbHNlIGlmIChleGlzdGluZ1Rva2VuVmFsdWUgPT09IGZhbHNlKSB7XG4gICAgICAvLyBJZiB0aGUgZXhpc3RpbmcgdmFsdWUgaXMgYGZhbHNlYCB0aGlzIG1lYW5zIGl0IHdhcyBpbiB0aGUgb2xkIGxpc3QuIEJlY2F1c2UgaXQgaXMgaW4gdGhlXG4gICAgICAvLyBuZXcgbGlzdCBhcyB3ZWxsIHdlIG1hcmtlZCBpdCBhcyBgbnVsbGAgKG5vb3AuKVxuICAgICAgY2hhbmdlcy5zZXQodG9rZW4sIG51bGwpO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICAvLyBUaGlzIGNvZGUgcGF0aCBpcyBleGVjdXRlZCB3aGVuIHdlIGFyZSBpdGVyYXRpbmcgb3ZlciBwcmV2aW91cyB2YWx1ZXMuXG4gICAgLy8gVGhpcyBtZWFucyB0aGF0IHdlIHN0b3JlIHRoZSB0b2tlbnMgaW4gYGNoYW5nZXNgIHdpdGggYGZhbHNlYCAocmVtb3ZhbHMpLlxuICAgIGNoYW5nZXMuc2V0KHRva2VuLCBmYWxzZSk7XG4gIH1cbn1cblxuLyoqXG4gKiBSZW1vdmVzIGEgY2xhc3MgZnJvbSBhIGBjbGFzc05hbWVgIHN0cmluZy5cbiAqXG4gKiBAcGFyYW0gY2xhc3NOYW1lIEEgc3RyaW5nIGNvbnRhaW5pbmcgY2xhc3NlcyAod2hpdGVzcGFjZSBzZXBhcmF0ZWQpXG4gKiBAcGFyYW0gY2xhc3NUb1JlbW92ZSBBIGNsYXNzIG5hbWUgdG8gcmVtb3ZlIGZyb20gdGhlIGBjbGFzc05hbWVgXG4gKiBAcmV0dXJucyBhIG5ldyBjbGFzcy1saXN0IHdoaWNoIGRvZXMgbm90IGhhdmUgYGNsYXNzVG9SZW1vdmVgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZW1vdmVDbGFzcyhjbGFzc05hbWU6IHN0cmluZywgY2xhc3NUb1JlbW92ZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHRvZ2dsZUNsYXNzKGNsYXNzTmFtZSwgY2xhc3NUb1JlbW92ZSwgZmFsc2UpO1xufVxuXG4vKipcbiAqIFRvZ2dsZXMgYSBjbGFzcyBpbiBgY2xhc3NOYW1lYCBzdHJpbmcuXG4gKlxuICogQHBhcmFtIGNsYXNzTmFtZSBBIHN0cmluZyBjb250YWluaW5nIGNsYXNzZXMgKHdoaXRlc3BhY2Ugc2VwYXJhdGVkKVxuICogQHBhcmFtIGNsYXNzVG9Ub2dnbGUgQSBjbGFzcyBuYW1lIHRvIHJlbW92ZSBvciBhZGQgdG8gdGhlIGBjbGFzc05hbWVgXG4gKiBAcGFyYW0gdG9nZ2xlIFdoZXRoZXIgdGhlIHJlc3VsdGluZyBgY2xhc3NOYW1lYCBzaG91bGQgY29udGFpbiBvciBub3QgdGhlIGBjbGFzc1RvVG9nZ2xlYFxuICogQHJldHVybnMgYSBuZXcgY2xhc3MtbGlzdCB3aGljaCBkb2VzIG5vdCBoYXZlIGBjbGFzc1RvUmVtb3ZlYFxuICovXG5leHBvcnQgZnVuY3Rpb24gdG9nZ2xlQ2xhc3MoY2xhc3NOYW1lOiBzdHJpbmcsIGNsYXNzVG9Ub2dnbGU6IHN0cmluZywgdG9nZ2xlOiBib29sZWFuKTogc3RyaW5nIHtcbiAgaWYgKGNsYXNzTmFtZSA9PT0gJycpIHtcbiAgICByZXR1cm4gdG9nZ2xlID8gY2xhc3NUb1RvZ2dsZSA6ICcnO1xuICB9XG4gIGxldCBzdGFydCA9IDA7XG4gIGxldCBlbmQgPSBjbGFzc05hbWUubGVuZ3RoO1xuICB3aGlsZSAoc3RhcnQgPCBlbmQpIHtcbiAgICBzdGFydCA9IGNsYXNzSW5kZXhPZihjbGFzc05hbWUsIGNsYXNzVG9Ub2dnbGUsIHN0YXJ0KTtcbiAgICBpZiAoc3RhcnQgPT09IC0xKSB7XG4gICAgICBpZiAodG9nZ2xlID09PSB0cnVlKSB7XG4gICAgICAgIGNsYXNzTmFtZSA9IGNsYXNzTmFtZSA9PT0gJycgPyBjbGFzc1RvVG9nZ2xlIDogY2xhc3NOYW1lICsgJyAnICsgY2xhc3NUb1RvZ2dsZTtcbiAgICAgIH1cbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgICBjb25zdCByZW1vdmVMZW5ndGggPSBjbGFzc1RvVG9nZ2xlLmxlbmd0aDtcbiAgICBpZiAodG9nZ2xlID09PSB0cnVlKSB7XG4gICAgICAvLyB3ZSBmb3VuZCBpdCBhbmQgd2Ugc2hvdWxkIGhhdmUgaXQgc28ganVzdCByZXR1cm5cbiAgICAgIHJldHVybiBjbGFzc05hbWU7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIEN1dCBvdXQgdGhlIGNsYXNzIHdoaWNoIHNob3VsZCBiZSByZW1vdmVkLlxuICAgICAgY29uc3QgZW5kV2hpdGVzcGFjZSA9IGNvbnN1bWVXaGl0ZXNwYWNlKGNsYXNzTmFtZSwgc3RhcnQgKyByZW1vdmVMZW5ndGgsIGVuZCk7XG4gICAgICBjbGFzc05hbWUgPSBjbGFzc05hbWUuc3Vic3RyaW5nKDAsIHN0YXJ0KSArIGNsYXNzTmFtZS5zdWJzdHJpbmcoZW5kV2hpdGVzcGFjZSwgZW5kKTtcbiAgICAgIGVuZCA9IGNsYXNzTmFtZS5sZW5ndGg7XG4gICAgfVxuICB9XG4gIHJldHVybiBjbGFzc05hbWU7XG59XG5cbi8qKlxuICogUmV0dXJucyBhbiBpbmRleCBvZiBgY2xhc3NUb1NlYXJjaGAgaW4gYGNsYXNzTmFtZWAgdGFraW5nIHRva2VuIGJvdW5kYXJpZXMgaW50byBhY2NvdW50LlxuICpcbiAqIGBjbGFzc0luZGV4T2YoJ0FCIEEnLCAnQScsIDApYCB3aWxsIGJlIDMgKG5vdCAwIHNpbmNlIGBBQiE9PUFgKVxuICpcbiAqIEBwYXJhbSBjbGFzc05hbWUgQSBzdHJpbmcgY29udGFpbmluZyBjbGFzc2VzICh3aGl0ZXNwYWNlIHNlcGFyYXRlZClcbiAqIEBwYXJhbSBjbGFzc1RvU2VhcmNoIEEgY2xhc3MgbmFtZSB0byBsb2NhdGVcbiAqIEBwYXJhbSBzdGFydGluZ0luZGV4IFN0YXJ0aW5nIGxvY2F0aW9uIG9mIHNlYXJjaFxuICogQHJldHVybnMgYW4gaW5kZXggb2YgdGhlIGxvY2F0ZWQgY2xhc3MgKG9yIC0xIGlmIG5vdCBmb3VuZClcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNsYXNzSW5kZXhPZihcbiAgICBjbGFzc05hbWU6IHN0cmluZywgY2xhc3NUb1NlYXJjaDogc3RyaW5nLCBzdGFydGluZ0luZGV4OiBudW1iZXIpOiBudW1iZXIge1xuICBsZXQgZW5kID0gY2xhc3NOYW1lLmxlbmd0aDtcbiAgd2hpbGUgKHRydWUpIHtcbiAgICBjb25zdCBmb3VuZEluZGV4ID0gY2xhc3NOYW1lLmluZGV4T2YoY2xhc3NUb1NlYXJjaCwgc3RhcnRpbmdJbmRleCk7XG4gICAgaWYgKGZvdW5kSW5kZXggPT09IC0xKSByZXR1cm4gZm91bmRJbmRleDtcbiAgICBpZiAoZm91bmRJbmRleCA9PT0gMCB8fCBjbGFzc05hbWUuY2hhckNvZGVBdChmb3VuZEluZGV4IC0gMSkgPD0gQ2hhckNvZGUuU1BBQ0UpIHtcbiAgICAgIC8vIEVuc3VyZSB0aGF0IGl0IGhhcyBsZWFkaW5nIHdoaXRlc3BhY2VcbiAgICAgIGNvbnN0IHJlbW92ZUxlbmd0aCA9IGNsYXNzVG9TZWFyY2gubGVuZ3RoO1xuICAgICAgaWYgKGZvdW5kSW5kZXggKyByZW1vdmVMZW5ndGggPT09IGVuZCB8fFxuICAgICAgICAgIGNsYXNzTmFtZS5jaGFyQ29kZUF0KGZvdW5kSW5kZXggKyByZW1vdmVMZW5ndGgpIDw9IENoYXJDb2RlLlNQQUNFKSB7XG4gICAgICAgIC8vIEVuc3VyZSB0aGF0IGl0IGhhcyB0cmFpbGluZyB3aGl0ZXNwYWNlXG4gICAgICAgIHJldHVybiBmb3VuZEluZGV4O1xuICAgICAgfVxuICAgIH1cbiAgICAvLyBGYWxzZSBwb3NpdGl2ZSwga2VlcCBzZWFyY2hpbmcgZnJvbSB3aGVyZSB3ZSBsZWZ0IG9mZi5cbiAgICBzdGFydGluZ0luZGV4ID0gZm91bmRJbmRleCArIDE7XG4gIH1cbn0iXX0=