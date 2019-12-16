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
    return toggleClass(className, classToRemove, false);
}
/**
 * Toggles a class in `className` string.
 *
 * @param className A string containing classes (whitespace separated)
 * @param classToToggle A class name to remove or add to the `className`
 * @param toggle Weather the resulting `className` should contain or not the `classToToggle`
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xhc3NfZGlmZmVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9zdHlsaW5nL2NsYXNzX2RpZmZlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0VBTUU7QUFHRixPQUFPLEVBQUMsaUJBQWlCLEVBQUUsaUJBQWlCLEVBQUMsTUFBTSxrQkFBa0IsQ0FBQztBQUV0RTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztHQXNCRztBQUNILE1BQU0sVUFBVSxtQkFBbUIsQ0FBQyxRQUFnQixFQUFFLFFBQWdCO0lBQ3BFLElBQU0sT0FBTyxHQUFHLElBQUksR0FBRyxFQUF3QixDQUFDO0lBQ2hELGNBQWMsQ0FBQyxRQUFRLEVBQUUsT0FBTyxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQ3pDLGNBQWMsQ0FBQyxRQUFRLEVBQUUsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQ3hDLE9BQU8sT0FBTyxDQUFDO0FBQ2pCLENBQUM7QUFFRDs7Ozs7Ozs7R0FRRztBQUNILE1BQU0sVUFBVSxjQUFjLENBQzFCLElBQVksRUFBRSxPQUFrQyxFQUFFLFVBQW1CO0lBQ3ZFLElBQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUM7SUFDeEIsSUFBSSxLQUFLLEdBQUcsQ0FBQyxDQUFDO0lBQ2QsT0FBTyxLQUFLLEdBQUcsR0FBRyxFQUFFO1FBQ2xCLEtBQUssR0FBRyxpQkFBaUIsQ0FBQyxJQUFJLEVBQUUsS0FBSyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBQzVDLElBQU0sUUFBUSxHQUFHLGlCQUFpQixDQUFDLElBQUksRUFBRSxLQUFLLEVBQUUsR0FBRyxDQUFDLENBQUM7UUFDckQsSUFBSSxRQUFRLEtBQUssS0FBSyxFQUFFO1lBQ3RCLGlCQUFpQixDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssRUFBRSxRQUFRLENBQUMs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QUssQ0FBQyxDQUFDO1lBQUUsT0FBTyxVQUFVLENBQUM7UUFDekMsSUFBSSxVQUFVLEtBQUssQ0FBQyxJQUFJLFNBQVMsQ0FBQyxVQUFVLENBQUMsVUFBVSxHQUFHLENBQUMsQ0FBQyxrQkFBa0IsRUFBRTtZQUM5RSx3Q0FBd0M7WUFDeEMsSUFBTSxZQUFZLEdBQUcsYUFBYSxDQUFDLE1BQU0sQ0FBQztZQUMxQyxJQUFJLFVBQVUsR0FBRyxZQUFZLEtBQUssR0FBRztnQkFDakMsU0FBUyxDQUFDLFVBQVUsQ0FBQyxVQUFVLEdBQUcsWUFBWSxDQUFDLGtCQUFrQixFQUFFO2dCQUNyRSx5Q0FBeUM7Z0JBQ3pDLE9BQU8sVUFBVSxDQUFDO2FBQ25CO1NBQ0Y7UUFDRCx5REFBeUQ7UUFDekQsYUFBYSxHQUFHLFVBQVUsR0FBRyxDQUFDLENBQUM7S0FDaEM7QUFDSCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4qIEBsaWNlbnNlXG4qIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuKlxuKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4qL1xuXG5pbXBvcnQge0NoYXJDb2RlfSBmcm9tICcuLi8uLi91dGlsL2NoYXJfY29kZSc7XG5pbXBvcnQge2NvbnN1bWVDbGFzc1Rva2VuLCBjb25zdW1lV2hpdGVzcGFjZX0gZnJvbSAnLi9zdHlsaW5nX3BhcnNlcic7XG5cbi8qKlxuICogQ29tcHV0ZXMgdGhlIGRpZmYgYmV0d2VlbiB0d28gY2xhc3MtbGlzdCBzdHJpbmdzLlxuICpcbiAqIEV4YW1wbGU6XG4gKiAgYG9sZFZhbHVlYCA9PiBgXCJBIEIgQ1wiYFxuICogIGBuZXdWYWx1ZWAgPT4gYFwiQSBDIERcImBcbiAqIHdpbGwgcmVzdWx0IGluOlxuICogYGBgXG4gKiBuZXcgTWFwKFtcbiAqICAgWydBJywgbnVsbF0sXG4gKiAgIFsnQicsIGZhbHNlXSxcbiAqICAgWydDJywgbnVsbF0sXG4gKiAgIFsnRCcsIHRydWVdXG4gKiBdKVxuICogYGBgXG4gKlxuICogQHBhcmFtIG9sZFZhbHVlIFByZXZpb3VzIGNsYXNzLWxpc3Qgc3RyaW5nLlxuICogQHBhcmFtIG5ld1ZhbHVlIE5ldyBjbGFzcy1saXN0IHN0cmluZy5cbiAqIEByZXR1cm5zIEEgYE1hcGAgd2hpY2ggd2lsbCBiZSBmaWxsZWQgd2l0aCBjaGFuZ2VzLlxuICogICAgICAgIC0gYHRydWVgOiBDbGFzcyBuZWVkcyB0byBiZSBhZGRlZCB0byB0aGUgZWxlbWVudC5cbiAqICAgICAgICAtIGBmYWxzZTogQ2xhc3MgbmVlZHMgdG8gYmUgcmVtb3ZlZCBmcm9tIHRoZSBlbGVtZW50LlxuICogICAgICAgIC0gYG51bGxgOiBObyBjaGFuZ2UgKGxlYXZlIGNsYXNzIGFzIGlzLilcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbXB1dGVDbGFzc0NoYW5nZXMob2xkVmFsdWU6IHN0cmluZywgbmV3VmFsdWU6IHN0cmluZyk6IE1hcDxzdHJpbmcsIGJvb2xlYW58bnVsbD4ge1xuICBjb25zdCBjaGFuZ2VzID0gbmV3IE1hcDxzdHJpbmcsIGJvb2xlYW58bnVsbD4oKTtcbiAgc3BsaXRDbGFzc0xpc3Qob2xkVmFsdWUsIGNoYW5nZXMsIGZhbHNlKTtcbiAgc3BsaXRDbGFzc0xpc3QobmV3VmFsdWUsIGNoYW5nZXMsIHRydWUpO1xuICByZXR1cm4gY2hhbmdlcztcbn1cblxuLyoqXG4gKiBTcGxpdHMgdGhlIGNsYXNzIGxpc3QgaW50byBhcnJheSwgaWdub3Jpbmcgd2hpdGVzcGFjZSBhbmQgYWRkIGl0IHRvIGNvcnJlc3BvbmRpbmcgY2F0ZWdvcmllc1xuICogYGNoYW5nZXNgLlxuICpcbiAqIEBwYXJhbSB0ZXh0IENsYXNzIGxpc3QgdG8gc3BsaXRcbiAqIEBwYXJhbSBjaGFuZ2VzIE1hcCB3aGljaCB3aWxsIGJlIGZpbGxlZCB3aXRoIGNoYW5nZXMuIChgZmFsc2VgIC0gcmVtb3ZlOyBgbnVsbGAgLSBub29wO1xuICogICAgICAgIGB0cnVlYCAtIGFkZC4pXG4gKiBAcGFyYW0gaXNOZXdWYWx1ZSBgdHJ1ZWAgaWYgd2UgYXJlIHByb2Nlc3NpbmcgbmV3IGxpc3QuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzcGxpdENsYXNzTGlzdChcbiAgICB0ZXh0OiBzdHJpbmcsIGNoYW5nZXM6IE1hcDxzdHJpbmcsIGJvb2xlYW58bnVsbD4sIGlzTmV3VmFsdWU6IGJvb2xlYW4pOiB2b2lkIHtcbiAgY29uc3QgZW5kID0gdGV4dC5sZW5ndGg7XG4gIGxldCBpbmRleCA9IDA7XG4gIHdoaWxlIChpbmRleCA8IGVuZCkge1xuICAgIGluZGV4ID0gY29uc3VtZVdoaXRlc3BhY2UodGV4dCwgaW5kZXgsIGVuZCk7XG4gICAgY29uc3QgdG9rZW5FbmQgPSBjb25zdW1lQ2xhc3NUb2tlbih0ZXh0LCBpbmRleCwgZW5kKTtcbiAgICBpZiAodG9rZW5FbmQgIT09IGluZGV4KSB7XG4gICAgICBwcm9jZXNzQ2xhc3NUb2tlbihjaGFuZ2VzLCB0ZXh0LnN1YnN0cmluZyhpbmRleCwgdG9rZW5FbmQpLCBpc05ld1ZhbHVlKTtcbiAgICB9XG4gICAgaW5kZXggPSB0b2tlbkVuZDtcbiAgfVxufVxuXG4vKipcbiAqIFByb2Nlc3NlcyB0aGUgdG9rZW4gYnkgYWRkaW5nIGl0IHRvIHRoZSBgY2hhbmdlc2AgTWFwLlxuICpcbiAqIEBwYXJhbSBjaGFuZ2VzIE1hcCB3aGljaCBrZWVwcyB0cmFjayBvZiB3aGF0IHNob3VsZCBiZSBkb25lIHdpdGggZWFjaCB2YWx1ZS5cbiAqICAgICAgICAtIGBmYWxzZWAgVGhlIHRva2VuIHNob3VsZCBiZSBkZWxldGVkLiAoSXQgd2FzIGluIG9sZCBsaXN0LCBidXQgbm90IGluIG5ldyBsaXN0LilcbiAqICAgICAgICAtIGBudWxsYCBUaGUgdG9rZW4gc2hvdWxkIGJlIGlnbm9yZWQuIChJdCB3YXMgcHJlc2VudCBpbiBvbGQgbGlzdCBhcyB3ZWxsIGFzIG5ldyBsaXN0LilcbiAqICAgICAgICAtIGB0cnVlYCB0aGUgdG9rZW4gc2hvdWxkIGJlIGFkZGVkLiAoSXQgd2FzIG9ubHkgcHJlc2VudCBpbiB0aGUgbmV3IHZhbHVlKVxuICogQHBhcmFtIHRva2VuIFRva2VuIHRvIGFkZCB0byBzZXQuXG4gKiBAcGFyYW0gaXNOZXdWYWx1ZSBUcnVlIGlmIGludm9jYXRpb24gcmVwcmVzZW50cyBhbiBhZGRpdGlvbiAocmVtb3ZhbCBvdGhlcndpc2UuKVxuICogICAgICAgIC0gYGZhbHNlYCBtZWFucyB0aGF0IHdlIGFyZSBwcm9jZXNzaW5nIHRoZSBvbGQgdmFsdWUsIHdoaWNoIG1heSBuZWVkIHRvIGJlIGRlbGV0ZWQuXG4gKiAgICAgICAgICBJbml0aWFsbHkgYWxsIHRva2VucyBhcmUgbGFiZWxlZCBgZmFsc2VgIChyZW1vdmUgaXQuKVxuICogICAgICAgIC0gYHRydWVgIG1lYW5zIHRoYXQgd2UgYXJlIHByb2Nlc3NpbmcgbmV3IHZhbHVlIHdoaWNoIG1heSBuZWVkIHRvIGJlIGFkZGVkLiBJZiBhIHRva2VuXG4gKiAgICAgICAgICB3aXRoIHNhbWUga2V5IGFscmVhZHkgZXhpc3RzIHdpdGggYGZhbHNlYCB0aGVuIHRoZSByZXN1bHRpbmcgdG9rZW4gaXMgYG51bGxgIChub1xuICogICAgICAgICAgY2hhbmdlLikgSWYgbm8gdG9rZW4gZXhpc3RzIHRoZW4gdGhlIG5ldyB0b2tlbiB2YWx1ZSBpcyBgdHJ1ZWAgKGFkZCBpdC4pXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwcm9jZXNzQ2xhc3NUb2tlbihcbiAgICBjaGFuZ2VzOiBNYXA8c3RyaW5nLCBib29sZWFufG51bGw+LCB0b2tlbjogc3RyaW5nLCBpc05ld1ZhbHVlOiBib29sZWFuKSB7XG4gIGlmIChpc05ld1ZhbHVlKSB7XG4gICAgLy8gVGhpcyBjb2RlIHBhdGggaXMgZXhlY3V0ZWQgd2hlbiB3ZSBhcmUgaXRlcmF0aW5nIG92ZXIgbmV3IHZhbHVlcy5cbiAgICBjb25zdCBleGlzdGluZ1Rva2VuVmFsdWUgPSBjaGFuZ2VzLmdldCh0b2tlbik7XG4gICAgaWYgKGV4aXN0aW5nVG9rZW5WYWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAvLyB0aGUgbmV3IGxpc3QgaGFzIGEgdG9rZW4gd2hpY2ggaXMgbm90IHByZXNlbnQgaW4gdGhlIG9sZCBsaXN0LiBNYXJrIGl0IGZvciBhZGRpdGlvbi5cbiAgICAgIGNoYW5nZXMuc2V0KHRva2VuLCB0cnVlKTtcbiAgICB9IGVsc2UgaWYgKGV4aXN0aW5nVG9rZW5WYWx1ZSA9PT0gZmFsc2UpIHtcbiAgICAgIC8vIElmIHRoZSBleGlzdGluZyB2YWx1ZSBpcyBgZmFsc2VgIHRoaXMgbWVhbnMgaXQgd2FzIGluIHRoZSBvbGQgbGlzdC4gQmVjYXVzZSBpdCBpcyBpbiB0aGVcbiAgICAgIC8vIG5ldyBsaXN0IGFzIHdlbGwgd2UgbWFya2VkIGl0IGFzIGBudWxsYCAobm9vcC4pXG4gICAgICBjaGFuZ2VzLnNldCh0b2tlbiwgbnVsbCk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIC8vIFRoaXMgY29kZSBwYXRoIGlzIGV4ZWN1dGVkIHdoZW4gd2UgYXJlIGl0ZXJhdGluZyBvdmVyIHByZXZpb3VzIHZhbHVlcy5cbiAgICAvLyBUaGlzIG1lYW5zIHRoYXQgd2Ugc3RvcmUgdGhlIHRva2VucyBpbiBgY2hhbmdlc2Agd2l0aCBgZmFsc2VgIChyZW1vdmFscykuXG4gICAgY2hhbmdlcy5zZXQodG9rZW4sIGZhbHNlKTtcbiAgfVxufVxuXG4vKipcbiAqIFJlbW92ZXMgYSBjbGFzcyBmcm9tIGEgYGNsYXNzTmFtZWAgc3RyaW5nLlxuICpcbiAqIEBwYXJhbSBjbGFzc05hbWUgQSBzdHJpbmcgY29udGFpbmluZyBjbGFzc2VzICh3aGl0ZXNwYWNlIHNlcGFyYXRlZClcbiAqIEBwYXJhbSBjbGFzc1RvUmVtb3ZlIEEgY2xhc3MgbmFtZSB0byByZW1vdmUgZnJvbSB0aGUgYGNsYXNzTmFtZWBcbiAqIEByZXR1cm5zIGEgbmV3IGNsYXNzLWxpc3Qgd2hpY2ggZG9lcyBub3QgaGF2ZSBgY2xhc3NUb1JlbW92ZWBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlbW92ZUNsYXNzKGNsYXNzTmFtZTogc3RyaW5nLCBjbGFzc1RvUmVtb3ZlOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gdG9nZ2xlQ2xhc3MoY2xhc3NOYW1lLCBjbGFzc1RvUmVtb3ZlLCBmYWxzZSk7XG59XG5cbi8qKlxuICogVG9nZ2xlcyBhIGNsYXNzIGluIGBjbGFzc05hbWVgIHN0cmluZy5cbiAqXG4gKiBAcGFyYW0gY2xhc3NOYW1lIEEgc3RyaW5nIGNvbnRhaW5pbmcgY2xhc3NlcyAod2hpdGVzcGFjZSBzZXBhcmF0ZWQpXG4gKiBAcGFyYW0gY2xhc3NUb1RvZ2dsZSBBIGNsYXNzIG5hbWUgdG8gcmVtb3ZlIG9yIGFkZCB0byB0aGUgYGNsYXNzTmFtZWBcbiAqIEBwYXJhbSB0b2dnbGUgV2VhdGhlciB0aGUgcmVzdWx0aW5nIGBjbGFzc05hbWVgIHNob3VsZCBjb250YWluIG9yIG5vdCB0aGUgYGNsYXNzVG9Ub2dnbGVgXG4gKiBAcmV0dXJucyBhIG5ldyBjbGFzcy1saXN0IHdoaWNoIGRvZXMgbm90IGhhdmUgYGNsYXNzVG9SZW1vdmVgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB0b2dnbGVDbGFzcyhjbGFzc05hbWU6IHN0cmluZywgY2xhc3NUb1RvZ2dsZTogc3RyaW5nLCB0b2dnbGU6IGJvb2xlYW4pOiBzdHJpbmcge1xuICBpZiAoY2xhc3NOYW1lID09PSAnJykge1xuICAgIHJldHVybiB0b2dnbGUgPyBjbGFzc1RvVG9nZ2xlIDogJyc7XG4gIH1cbiAgbGV0IHN0YXJ0ID0gMDtcbiAgbGV0IGVuZCA9IGNsYXNzTmFtZS5sZW5ndGg7XG4gIHdoaWxlIChzdGFydCA8IGVuZCkge1xuICAgIHN0YXJ0ID0gY2xhc3NJbmRleE9mKGNsYXNzTmFtZSwgY2xhc3NUb1RvZ2dsZSwgc3RhcnQpO1xuICAgIGlmIChzdGFydCA9PT0gLTEpIHtcbiAgICAgIGlmICh0b2dnbGUgPT09IHRydWUpIHtcbiAgICAgICAgY2xhc3NOYW1lID0gY2xhc3NOYW1lID09PSAnJyA/IGNsYXNzVG9Ub2dnbGUgOiBjbGFzc05hbWUgKyAnICcgKyBjbGFzc1RvVG9nZ2xlO1xuICAgICAgfVxuICAgICAgYnJlYWs7XG4gICAgfVxuICAgIGNvbnN0IHJlbW92ZUxlbmd0aCA9IGNsYXNzVG9Ub2dnbGUubGVuZ3RoO1xuICAgIGlmICh0b2dnbGUgPT09IHRydWUpIHtcbiAgICAgIC8vIHdlIGZvdW5kIGl0IGFuZCB3ZSBzaG91bGQgaGF2ZSBpdCBzbyBqdXN0IHJldHVyblxuICAgICAgcmV0dXJuIGNsYXNzTmFtZTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gQ3V0IG91dCB0aGUgY2xhc3Mgd2hpY2ggc2hvdWxkIGJlIHJlbW92ZWQuXG4gICAgICBjb25zdCBlbmRXaGl0ZXNwYWNlID0gY29uc3VtZVdoaXRlc3BhY2UoY2xhc3NOYW1lLCBzdGFydCArIHJlbW92ZUxlbmd0aCwgZW5kKTtcbiAgICAgIGNsYXNzTmFtZSA9IGNsYXNzTmFtZS5zdWJzdHJpbmcoMCwgc3RhcnQpICsgY2xhc3NOYW1lLnN1YnN0cmluZyhlbmRXaGl0ZXNwYWNlLCBlbmQpO1xuICAgICAgZW5kID0gY2xhc3NOYW1lLmxlbmd0aDtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGNsYXNzTmFtZTtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIGFuIGluZGV4IG9mIGBjbGFzc1RvU2VhcmNoYCBpbiBgY2xhc3NOYW1lYCB0YWtpbmcgdG9rZW4gYm91bmRhcmllcyBpbnRvIGFjY291bnQuXG4gKlxuICogYGNsYXNzSW5kZXhPZignQUIgQScsICdBJywgMClgIHdpbGwgYmUgMyAobm90IDAgc2luY2UgYEFCIT09QWApXG4gKlxuICogQHBhcmFtIGNsYXNzTmFtZSBBIHN0cmluZyBjb250YWluaW5nIGNsYXNzZXMgKHdoaXRlc3BhY2Ugc2VwYXJhdGVkKVxuICogQHBhcmFtIGNsYXNzVG9TZWFyY2ggQSBjbGFzcyBuYW1lIHRvIGxvY2F0ZVxuICogQHBhcmFtIHN0YXJ0aW5nSW5kZXggU3RhcnRpbmcgbG9jYXRpb24gb2Ygc2VhcmNoXG4gKiBAcmV0dXJucyBhbiBpbmRleCBvZiB0aGUgbG9jYXRlZCBjbGFzcyAob3IgLTEgaWYgbm90IGZvdW5kKVxuICovXG5leHBvcnQgZnVuY3Rpb24gY2xhc3NJbmRleE9mKFxuICAgIGNsYXNzTmFtZTogc3RyaW5nLCBjbGFzc1RvU2VhcmNoOiBzdHJpbmcsIHN0YXJ0aW5nSW5kZXg6IG51bWJlcik6IG51bWJlciB7XG4gIGxldCBlbmQgPSBjbGFzc05hbWUubGVuZ3RoO1xuICB3aGlsZSAodHJ1ZSkge1xuICAgIGNvbnN0IGZvdW5kSW5kZXggPSBjbGFzc05hbWUuaW5kZXhPZihjbGFzc1RvU2VhcmNoLCBzdGFydGluZ0luZGV4KTtcbiAgICBpZiAoZm91bmRJbmRleCA9PT0gLTEpIHJldHVybiBmb3VuZEluZGV4O1xuICAgIGlmIChmb3VuZEluZGV4ID09PSAwIHx8IGNsYXNzTmFtZS5jaGFyQ29kZUF0KGZvdW5kSW5kZXggLSAxKSA8PSBDaGFyQ29kZS5TUEFDRSkge1xuICAgICAgLy8gRW5zdXJlIHRoYXQgaXQgaGFzIGxlYWRpbmcgd2hpdGVzcGFjZVxuICAgICAgY29uc3QgcmVtb3ZlTGVuZ3RoID0gY2xhc3NUb1NlYXJjaC5sZW5ndGg7XG4gICAgICBpZiAoZm91bmRJbmRleCArIHJlbW92ZUxlbmd0aCA9PT0gZW5kIHx8XG4gICAgICAgICAgY2xhc3NOYW1lLmNoYXJDb2RlQXQoZm91bmRJbmRleCArIHJlbW92ZUxlbmd0aCkgPD0gQ2hhckNvZGUuU1BBQ0UpIHtcbiAgICAgICAgLy8gRW5zdXJlIHRoYXQgaXQgaGFzIHRyYWlsaW5nIHdoaXRlc3BhY2VcbiAgICAgICAgcmV0dXJuIGZvdW5kSW5kZXg7XG4gICAgICB9XG4gICAgfVxuICAgIC8vIEZhbHNlIHBvc2l0aXZlLCBrZWVwIHNlYXJjaGluZyBmcm9tIHdoZXJlIHdlIGxlZnQgb2ZmLlxuICAgIHN0YXJ0aW5nSW5kZXggPSBmb3VuZEluZGV4ICsgMTtcbiAgfVxufSJdfQ==