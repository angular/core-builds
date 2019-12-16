/**
 * @fileoverview added by tsickle
 * Generated from: packages/core/src/render3/styling/class_differ.ts
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
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
 * @param {?} oldValue Previous class-list string.
 * @param {?} newValue New class-list string.
 * @return {?} A `Map` which will be filled with changes.
 *        - `true`: Class needs to be added to the element.
 *        - `false: Class needs to be removed from the element.
 *        - `null`: No change (leave class as is.)
 */
export function computeClassChanges(oldValue, newValue) {
    /** @type {?} */
    const changes = new Map();
    splitClassList(oldValue, changes, false);
    splitClassList(newValue, changes, true);
    return changes;
}
/**
 * Splits the class list into array, ignoring whitespace and add it to corresponding categories
 * `changes`.
 *
 * @param {?} text Class list to split
 * @param {?} changes Map which will be filled with changes. (`false` - remove; `null` - noop;
 *        `true` - add.)
 * @param {?} isNewValue `true` if we are processing new list.
 * @return {?}
 */
export function splitClassList(text, changes, isNewValue) {
    /** @type {?} */
    const end = text.length;
    /** @type {?} */
    let index = 0;
    while (index < end) {
        index = consumeWhitespace(text, index, end);
        /** @type {?} */
        const tokenEnd = consumeClassToken(text, index, end);
        if (tokenEnd !== index) {
            processClassToken(changes, text.substring(index, tokenEnd), isNewValue);
        }
        index = tokenEnd;
    }
}
/**
 * Processes the token by adding it to the `changes` Map.
 *
 * @param {?} changes Map which keeps track of what should be done with each value.
 *        - `false` The token should be deleted. (It was in old list, but not in new list.)
 *        - `null` The token should be ignored. (It was present in old list as well as new list.)
 *        - `true` the token should be added. (It was only present in the new value)
 * @param {?} token Token to add to set.
 * @param {?} isNewValue True if invocation represents an addition (removal otherwise.)
 *        - `false` means that we are processing the old value, which may need to be deleted.
 *          Initially all tokens are labeled `false` (remove it.)
 *        - `true` means that we are processing new value which may need to be added. If a token
 *          with same key already exists with `false` then the resulting token is `null` (no
 *          change.) If no token exists then the new token value is `true` (add it.)
 * @return {?}
 */
export function processClassToken(changes, token, isNewValue) {
    if (isNewValue) {
        // This code path is executed when we are iterating over new values.
        /** @type {?} */
        const existingTokenValue = changes.get(token);
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
 * @param {?} className A string containing classes (whitespace separated)
 * @param {?} classToRemove A class name to remove from the `className`
 * @return {?} a new class-list which does not have `classToRemove`
 */
export function removeClass(className, classToRemove) {
    return toggleClass(className, classToRemove, false);
}
/**
 * Toggles a class in `className` string.
 *
 * @param {?} className A string containing classes (whitespace separated)
 * @param {?} classToToggle A class name to remove or add to the `className`
 * @param {?} toggle Weather the resulting `className` should contain or not the `classToToggle`
 * @return {?} a new class-list which does not have `classToRemove`
 */
export function toggleClass(className, classToToggle, toggle) {
    if (className === '') {
        return toggle ? classToToggle : '';
    }
    /** @type {?} */
    let start = 0;
    /** @type {?} */
    let end = className.length;
    while (start < end) {
        start = classIndexOf(className, classToToggle, start);
        if (start === -1) {
            if (toggle === true) {
                className = className === '' ? classToToggle : className + ' ' + classToToggle;
            }
            break;
        }
        /** @type {?} */
        const removeLength = classToToggle.length;
        if (toggle === true) {
            // we found it and we should have it so just return
            return className;
        }
        else {
            // Cut out the class which should be removed.
            /** @type {?} */
            const endWhitespace = consumeWhitespace(className, start + removeLength, end);
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
 * @param {?} className A string containing classes (whitespace separated)
 * @param {?} classToSearch A class name to locate
 * @param {?} startingIndex Starting location of search
 * @return {?} an index of the located class (or -1 if not found)
 */
export function classIndexOf(className, classToSearch, startingIndex) {
    /** @type {?} */
    let end = className.length;
    while (true) {
        /** @type {?} */
        const foundIndex = className.indexOf(classToSearch, startingIndex);
        if (foundIndex === -1)
            return foundIndex;
        if (foundIndex === 0 || className.charCodeAt(foundIndex - 1) <= 32 /* SPACE */) {
            // Ensure that it has leading whitespace
            /** @type {?} */
            const removeLength = classToSearch.length;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xhc3NfZGlmZmVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9zdHlsaW5nL2NsYXNzX2RpZmZlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFTQSxPQUFPLEVBQUMsaUJBQWlCLEVBQUUsaUJBQWlCLEVBQUMsTUFBTSxrQkFBa0IsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBeUJ0RSxNQUFNLFVBQVUsbUJBQW1CLENBQUMsUUFBZ0IsRUFBRSxRQUFnQjs7VUFDOUQsT0FBTyxHQUFHLElBQUksR0FBRyxFQUF3QjtJQUMvQyxjQUFjLENBQUMsUUFBUSxFQUFFLE9BQU8sRUFBRSxLQUFLLENBQUMsQ0FBQztJQUN6QyxjQUFjLENBQUMsUUFBUSxFQUFFLE9BQU8sRUFBRSxJQUFJLENBQUMsQ0FBQztJQUN4QyxPQUFPLE9BQU8sQ0FBQztBQUNqQixDQUFDOzs7Ozs7Ozs7OztBQVdELE1BQU0sVUFBVSxjQUFjLENBQzFCLElBQVksRUFBRSxPQUFrQyxFQUFFLFVBQW1COztVQUNqRSxHQUFHLEdBQUcsSUFBSSxDQUFDLE1BQU07O1FBQ25CLEtBQUssR0FBRyxDQUFDO0lBQ2IsT0FBTyxLQUFLLEdBQUcsR0FBRyxFQUFFO1FBQ2xCLEtBQUssR0FBRyxpQkFBaUIsQ0FBQyxJQUFJLEVBQUUsS0FBSyxFQUFFLEdBQUcsQ0FBQyxDQUFDOztjQUN0QyxRQUFRLEdBQUcsaUJBQWlCLENBQUMsSUFBSSxFQUFFLEtBQUssRUFBRSxHQUFHLENBQUM7UUFDcEQsSUFBSSxRQUFRLEtBQUssS0FBSyxFQUFFO1lBQ3RCLGlCQUFpQixDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssRUFBRSxRQUFRLENBQUMsRUFBRSxVQUFVLENBQUMsQ0FBQztTQUN6RTtRQUNELEtBQUssR0FBRyxRQUFRLENBQUM7S0FDbEI7QUFDSCxD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SyxHQUFHO2dCQUNqQyxTQUFTLENBQUMsVUFBVSxDQUFDLFVBQVUsR0FBRyxZQUFZLENBQUMsa0JBQWtCLEVBQUU7Z0JBQ3JFLHlDQUF5QztnQkFDekMsT0FBTyxVQUFVLENBQUM7YUFDbkI7U0FDRjtRQUNELHlEQUF5RDtRQUN6RCxhQUFhLEdBQUcsVUFBVSxHQUFHLENBQUMsQ0FBQztLQUNoQztBQUNILENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiogQGxpY2Vuc2VcbiogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4qXG4qIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4qIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiovXG5cbmltcG9ydCB7Q2hhckNvZGV9IGZyb20gJy4uLy4uL3V0aWwvY2hhcl9jb2RlJztcbmltcG9ydCB7Y29uc3VtZUNsYXNzVG9rZW4sIGNvbnN1bWVXaGl0ZXNwYWNlfSBmcm9tICcuL3N0eWxpbmdfcGFyc2VyJztcblxuLyoqXG4gKiBDb21wdXRlcyB0aGUgZGlmZiBiZXR3ZWVuIHR3byBjbGFzcy1saXN0IHN0cmluZ3MuXG4gKlxuICogRXhhbXBsZTpcbiAqICBgb2xkVmFsdWVgID0+IGBcIkEgQiBDXCJgXG4gKiAgYG5ld1ZhbHVlYCA9PiBgXCJBIEMgRFwiYFxuICogd2lsbCByZXN1bHQgaW46XG4gKiBgYGBcbiAqIG5ldyBNYXAoW1xuICogICBbJ0EnLCBudWxsXSxcbiAqICAgWydCJywgZmFsc2VdLFxuICogICBbJ0MnLCBudWxsXSxcbiAqICAgWydEJywgdHJ1ZV1cbiAqIF0pXG4gKiBgYGBcbiAqXG4gKiBAcGFyYW0gb2xkVmFsdWUgUHJldmlvdXMgY2xhc3MtbGlzdCBzdHJpbmcuXG4gKiBAcGFyYW0gbmV3VmFsdWUgTmV3IGNsYXNzLWxpc3Qgc3RyaW5nLlxuICogQHJldHVybnMgQSBgTWFwYCB3aGljaCB3aWxsIGJlIGZpbGxlZCB3aXRoIGNoYW5nZXMuXG4gKiAgICAgICAgLSBgdHJ1ZWA6IENsYXNzIG5lZWRzIHRvIGJlIGFkZGVkIHRvIHRoZSBlbGVtZW50LlxuICogICAgICAgIC0gYGZhbHNlOiBDbGFzcyBuZWVkcyB0byBiZSByZW1vdmVkIGZyb20gdGhlIGVsZW1lbnQuXG4gKiAgICAgICAgLSBgbnVsbGA6IE5vIGNoYW5nZSAobGVhdmUgY2xhc3MgYXMgaXMuKVxuICovXG5leHBvcnQgZnVuY3Rpb24gY29tcHV0ZUNsYXNzQ2hhbmdlcyhvbGRWYWx1ZTogc3RyaW5nLCBuZXdWYWx1ZTogc3RyaW5nKTogTWFwPHN0cmluZywgYm9vbGVhbnxudWxsPiB7XG4gIGNvbnN0IGNoYW5nZXMgPSBuZXcgTWFwPHN0cmluZywgYm9vbGVhbnxudWxsPigpO1xuICBzcGxpdENsYXNzTGlzdChvbGRWYWx1ZSwgY2hhbmdlcywgZmFsc2UpO1xuICBzcGxpdENsYXNzTGlzdChuZXdWYWx1ZSwgY2hhbmdlcywgdHJ1ZSk7XG4gIHJldHVybiBjaGFuZ2VzO1xufVxuXG4vKipcbiAqIFNwbGl0cyB0aGUgY2xhc3MgbGlzdCBpbnRvIGFycmF5LCBpZ25vcmluZyB3aGl0ZXNwYWNlIGFuZCBhZGQgaXQgdG8gY29ycmVzcG9uZGluZyBjYXRlZ29yaWVzXG4gKiBgY2hhbmdlc2AuXG4gKlxuICogQHBhcmFtIHRleHQgQ2xhc3MgbGlzdCB0byBzcGxpdFxuICogQHBhcmFtIGNoYW5nZXMgTWFwIHdoaWNoIHdpbGwgYmUgZmlsbGVkIHdpdGggY2hhbmdlcy4gKGBmYWxzZWAgLSByZW1vdmU7IGBudWxsYCAtIG5vb3A7XG4gKiAgICAgICAgYHRydWVgIC0gYWRkLilcbiAqIEBwYXJhbSBpc05ld1ZhbHVlIGB0cnVlYCBpZiB3ZSBhcmUgcHJvY2Vzc2luZyBuZXcgbGlzdC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNwbGl0Q2xhc3NMaXN0KFxuICAgIHRleHQ6IHN0cmluZywgY2hhbmdlczogTWFwPHN0cmluZywgYm9vbGVhbnxudWxsPiwgaXNOZXdWYWx1ZTogYm9vbGVhbik6IHZvaWQge1xuICBjb25zdCBlbmQgPSB0ZXh0Lmxlbmd0aDtcbiAgbGV0IGluZGV4ID0gMDtcbiAgd2hpbGUgKGluZGV4IDwgZW5kKSB7XG4gICAgaW5kZXggPSBjb25zdW1lV2hpdGVzcGFjZSh0ZXh0LCBpbmRleCwgZW5kKTtcbiAgICBjb25zdCB0b2tlbkVuZCA9IGNvbnN1bWVDbGFzc1Rva2VuKHRleHQsIGluZGV4LCBlbmQpO1xuICAgIGlmICh0b2tlbkVuZCAhPT0gaW5kZXgpIHtcbiAgICAgIHByb2Nlc3NDbGFzc1Rva2VuKGNoYW5nZXMsIHRleHQuc3Vic3RyaW5nKGluZGV4LCB0b2tlbkVuZCksIGlzTmV3VmFsdWUpO1xuICAgIH1cbiAgICBpbmRleCA9IHRva2VuRW5kO1xuICB9XG59XG5cbi8qKlxuICogUHJvY2Vzc2VzIHRoZSB0b2tlbiBieSBhZGRpbmcgaXQgdG8gdGhlIGBjaGFuZ2VzYCBNYXAuXG4gKlxuICogQHBhcmFtIGNoYW5nZXMgTWFwIHdoaWNoIGtlZXBzIHRyYWNrIG9mIHdoYXQgc2hvdWxkIGJlIGRvbmUgd2l0aCBlYWNoIHZhbHVlLlxuICogICAgICAgIC0gYGZhbHNlYCBUaGUgdG9rZW4gc2hvdWxkIGJlIGRlbGV0ZWQuIChJdCB3YXMgaW4gb2xkIGxpc3QsIGJ1dCBub3QgaW4gbmV3IGxpc3QuKVxuICogICAgICAgIC0gYG51bGxgIFRoZSB0b2tlbiBzaG91bGQgYmUgaWdub3JlZC4gKEl0IHdhcyBwcmVzZW50IGluIG9sZCBsaXN0IGFzIHdlbGwgYXMgbmV3IGxpc3QuKVxuICogICAgICAgIC0gYHRydWVgIHRoZSB0b2tlbiBzaG91bGQgYmUgYWRkZWQuIChJdCB3YXMgb25seSBwcmVzZW50IGluIHRoZSBuZXcgdmFsdWUpXG4gKiBAcGFyYW0gdG9rZW4gVG9rZW4gdG8gYWRkIHRvIHNldC5cbiAqIEBwYXJhbSBpc05ld1ZhbHVlIFRydWUgaWYgaW52b2NhdGlvbiByZXByZXNlbnRzIGFuIGFkZGl0aW9uIChyZW1vdmFsIG90aGVyd2lzZS4pXG4gKiAgICAgICAgLSBgZmFsc2VgIG1lYW5zIHRoYXQgd2UgYXJlIHByb2Nlc3NpbmcgdGhlIG9sZCB2YWx1ZSwgd2hpY2ggbWF5IG5lZWQgdG8gYmUgZGVsZXRlZC5cbiAqICAgICAgICAgIEluaXRpYWxseSBhbGwgdG9rZW5zIGFyZSBsYWJlbGVkIGBmYWxzZWAgKHJlbW92ZSBpdC4pXG4gKiAgICAgICAgLSBgdHJ1ZWAgbWVhbnMgdGhhdCB3ZSBhcmUgcHJvY2Vzc2luZyBuZXcgdmFsdWUgd2hpY2ggbWF5IG5lZWQgdG8gYmUgYWRkZWQuIElmIGEgdG9rZW5cbiAqICAgICAgICAgIHdpdGggc2FtZSBrZXkgYWxyZWFkeSBleGlzdHMgd2l0aCBgZmFsc2VgIHRoZW4gdGhlIHJlc3VsdGluZyB0b2tlbiBpcyBgbnVsbGAgKG5vXG4gKiAgICAgICAgICBjaGFuZ2UuKSBJZiBubyB0b2tlbiBleGlzdHMgdGhlbiB0aGUgbmV3IHRva2VuIHZhbHVlIGlzIGB0cnVlYCAoYWRkIGl0LilcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHByb2Nlc3NDbGFzc1Rva2VuKFxuICAgIGNoYW5nZXM6IE1hcDxzdHJpbmcsIGJvb2xlYW58bnVsbD4sIHRva2VuOiBzdHJpbmcsIGlzTmV3VmFsdWU6IGJvb2xlYW4pIHtcbiAgaWYgKGlzTmV3VmFsdWUpIHtcbiAgICAvLyBUaGlzIGNvZGUgcGF0aCBpcyBleGVjdXRlZCB3aGVuIHdlIGFyZSBpdGVyYXRpbmcgb3ZlciBuZXcgdmFsdWVzLlxuICAgIGNvbnN0IGV4aXN0aW5nVG9rZW5WYWx1ZSA9IGNoYW5nZXMuZ2V0KHRva2VuKTtcbiAgICBpZiAoZXhpc3RpbmdUb2tlblZhbHVlID09PSB1bmRlZmluZWQpIHtcbiAgICAgIC8vIHRoZSBuZXcgbGlzdCBoYXMgYSB0b2tlbiB3aGljaCBpcyBub3QgcHJlc2VudCBpbiB0aGUgb2xkIGxpc3QuIE1hcmsgaXQgZm9yIGFkZGl0aW9uLlxuICAgICAgY2hhbmdlcy5zZXQodG9rZW4sIHRydWUpO1xuICAgIH0gZWxzZSBpZiAoZXhpc3RpbmdUb2tlblZhbHVlID09PSBmYWxzZSkge1xuICAgICAgLy8gSWYgdGhlIGV4aXN0aW5nIHZhbHVlIGlzIGBmYWxzZWAgdGhpcyBtZWFucyBpdCB3YXMgaW4gdGhlIG9sZCBsaXN0LiBCZWNhdXNlIGl0IGlzIGluIHRoZVxuICAgICAgLy8gbmV3IGxpc3QgYXMgd2VsbCB3ZSBtYXJrZWQgaXQgYXMgYG51bGxgIChub29wLilcbiAgICAgIGNoYW5nZXMuc2V0KHRva2VuLCBudWxsKTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgLy8gVGhpcyBjb2RlIHBhdGggaXMgZXhlY3V0ZWQgd2hlbiB3ZSBhcmUgaXRlcmF0aW5nIG92ZXIgcHJldmlvdXMgdmFsdWVzLlxuICAgIC8vIFRoaXMgbWVhbnMgdGhhdCB3ZSBzdG9yZSB0aGUgdG9rZW5zIGluIGBjaGFuZ2VzYCB3aXRoIGBmYWxzZWAgKHJlbW92YWxzKS5cbiAgICBjaGFuZ2VzLnNldCh0b2tlbiwgZmFsc2UpO1xuICB9XG59XG5cbi8qKlxuICogUmVtb3ZlcyBhIGNsYXNzIGZyb20gYSBgY2xhc3NOYW1lYCBzdHJpbmcuXG4gKlxuICogQHBhcmFtIGNsYXNzTmFtZSBBIHN0cmluZyBjb250YWluaW5nIGNsYXNzZXMgKHdoaXRlc3BhY2Ugc2VwYXJhdGVkKVxuICogQHBhcmFtIGNsYXNzVG9SZW1vdmUgQSBjbGFzcyBuYW1lIHRvIHJlbW92ZSBmcm9tIHRoZSBgY2xhc3NOYW1lYFxuICogQHJldHVybnMgYSBuZXcgY2xhc3MtbGlzdCB3aGljaCBkb2VzIG5vdCBoYXZlIGBjbGFzc1RvUmVtb3ZlYFxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVtb3ZlQ2xhc3MoY2xhc3NOYW1lOiBzdHJpbmcsIGNsYXNzVG9SZW1vdmU6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiB0b2dnbGVDbGFzcyhjbGFzc05hbWUsIGNsYXNzVG9SZW1vdmUsIGZhbHNlKTtcbn1cblxuLyoqXG4gKiBUb2dnbGVzIGEgY2xhc3MgaW4gYGNsYXNzTmFtZWAgc3RyaW5nLlxuICpcbiAqIEBwYXJhbSBjbGFzc05hbWUgQSBzdHJpbmcgY29udGFpbmluZyBjbGFzc2VzICh3aGl0ZXNwYWNlIHNlcGFyYXRlZClcbiAqIEBwYXJhbSBjbGFzc1RvVG9nZ2xlIEEgY2xhc3MgbmFtZSB0byByZW1vdmUgb3IgYWRkIHRvIHRoZSBgY2xhc3NOYW1lYFxuICogQHBhcmFtIHRvZ2dsZSBXZWF0aGVyIHRoZSByZXN1bHRpbmcgYGNsYXNzTmFtZWAgc2hvdWxkIGNvbnRhaW4gb3Igbm90IHRoZSBgY2xhc3NUb1RvZ2dsZWBcbiAqIEByZXR1cm5zIGEgbmV3IGNsYXNzLWxpc3Qgd2hpY2ggZG9lcyBub3QgaGF2ZSBgY2xhc3NUb1JlbW92ZWBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHRvZ2dsZUNsYXNzKGNsYXNzTmFtZTogc3RyaW5nLCBjbGFzc1RvVG9nZ2xlOiBzdHJpbmcsIHRvZ2dsZTogYm9vbGVhbik6IHN0cmluZyB7XG4gIGlmIChjbGFzc05hbWUgPT09ICcnKSB7XG4gICAgcmV0dXJuIHRvZ2dsZSA/IGNsYXNzVG9Ub2dnbGUgOiAnJztcbiAgfVxuICBsZXQgc3RhcnQgPSAwO1xuICBsZXQgZW5kID0gY2xhc3NOYW1lLmxlbmd0aDtcbiAgd2hpbGUgKHN0YXJ0IDwgZW5kKSB7XG4gICAgc3RhcnQgPSBjbGFzc0luZGV4T2YoY2xhc3NOYW1lLCBjbGFzc1RvVG9nZ2xlLCBzdGFydCk7XG4gICAgaWYgKHN0YXJ0ID09PSAtMSkge1xuICAgICAgaWYgKHRvZ2dsZSA9PT0gdHJ1ZSkge1xuICAgICAgICBjbGFzc05hbWUgPSBjbGFzc05hbWUgPT09ICcnID8gY2xhc3NUb1RvZ2dsZSA6IGNsYXNzTmFtZSArICcgJyArIGNsYXNzVG9Ub2dnbGU7XG4gICAgICB9XG4gICAgICBicmVhaztcbiAgICB9XG4gICAgY29uc3QgcmVtb3ZlTGVuZ3RoID0gY2xhc3NUb1RvZ2dsZS5sZW5ndGg7XG4gICAgaWYgKHRvZ2dsZSA9PT0gdHJ1ZSkge1xuICAgICAgLy8gd2UgZm91bmQgaXQgYW5kIHdlIHNob3VsZCBoYXZlIGl0IHNvIGp1c3QgcmV0dXJuXG4gICAgICByZXR1cm4gY2xhc3NOYW1lO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBDdXQgb3V0IHRoZSBjbGFzcyB3aGljaCBzaG91bGQgYmUgcmVtb3ZlZC5cbiAgICAgIGNvbnN0IGVuZFdoaXRlc3BhY2UgPSBjb25zdW1lV2hpdGVzcGFjZShjbGFzc05hbWUsIHN0YXJ0ICsgcmVtb3ZlTGVuZ3RoLCBlbmQpO1xuICAgICAgY2xhc3NOYW1lID0gY2xhc3NOYW1lLnN1YnN0cmluZygwLCBzdGFydCkgKyBjbGFzc05hbWUuc3Vic3RyaW5nKGVuZFdoaXRlc3BhY2UsIGVuZCk7XG4gICAgICBlbmQgPSBjbGFzc05hbWUubGVuZ3RoO1xuICAgIH1cbiAgfVxuICByZXR1cm4gY2xhc3NOYW1lO1xufVxuXG4vKipcbiAqIFJldHVybnMgYW4gaW5kZXggb2YgYGNsYXNzVG9TZWFyY2hgIGluIGBjbGFzc05hbWVgIHRha2luZyB0b2tlbiBib3VuZGFyaWVzIGludG8gYWNjb3VudC5cbiAqXG4gKiBgY2xhc3NJbmRleE9mKCdBQiBBJywgJ0EnLCAwKWAgd2lsbCBiZSAzIChub3QgMCBzaW5jZSBgQUIhPT1BYClcbiAqXG4gKiBAcGFyYW0gY2xhc3NOYW1lIEEgc3RyaW5nIGNvbnRhaW5pbmcgY2xhc3NlcyAod2hpdGVzcGFjZSBzZXBhcmF0ZWQpXG4gKiBAcGFyYW0gY2xhc3NUb1NlYXJjaCBBIGNsYXNzIG5hbWUgdG8gbG9jYXRlXG4gKiBAcGFyYW0gc3RhcnRpbmdJbmRleCBTdGFydGluZyBsb2NhdGlvbiBvZiBzZWFyY2hcbiAqIEByZXR1cm5zIGFuIGluZGV4IG9mIHRoZSBsb2NhdGVkIGNsYXNzIChvciAtMSBpZiBub3QgZm91bmQpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjbGFzc0luZGV4T2YoXG4gICAgY2xhc3NOYW1lOiBzdHJpbmcsIGNsYXNzVG9TZWFyY2g6IHN0cmluZywgc3RhcnRpbmdJbmRleDogbnVtYmVyKTogbnVtYmVyIHtcbiAgbGV0IGVuZCA9IGNsYXNzTmFtZS5sZW5ndGg7XG4gIHdoaWxlICh0cnVlKSB7XG4gICAgY29uc3QgZm91bmRJbmRleCA9IGNsYXNzTmFtZS5pbmRleE9mKGNsYXNzVG9TZWFyY2gsIHN0YXJ0aW5nSW5kZXgpO1xuICAgIGlmIChmb3VuZEluZGV4ID09PSAtMSkgcmV0dXJuIGZvdW5kSW5kZXg7XG4gICAgaWYgKGZvdW5kSW5kZXggPT09IDAgfHwgY2xhc3NOYW1lLmNoYXJDb2RlQXQoZm91bmRJbmRleCAtIDEpIDw9IENoYXJDb2RlLlNQQUNFKSB7XG4gICAgICAvLyBFbnN1cmUgdGhhdCBpdCBoYXMgbGVhZGluZyB3aGl0ZXNwYWNlXG4gICAgICBjb25zdCByZW1vdmVMZW5ndGggPSBjbGFzc1RvU2VhcmNoLmxlbmd0aDtcbiAgICAgIGlmIChmb3VuZEluZGV4ICsgcmVtb3ZlTGVuZ3RoID09PSBlbmQgfHxcbiAgICAgICAgICBjbGFzc05hbWUuY2hhckNvZGVBdChmb3VuZEluZGV4ICsgcmVtb3ZlTGVuZ3RoKSA8PSBDaGFyQ29kZS5TUEFDRSkge1xuICAgICAgICAvLyBFbnN1cmUgdGhhdCBpdCBoYXMgdHJhaWxpbmcgd2hpdGVzcGFjZVxuICAgICAgICByZXR1cm4gZm91bmRJbmRleDtcbiAgICAgIH1cbiAgICB9XG4gICAgLy8gRmFsc2UgcG9zaXRpdmUsIGtlZXAgc2VhcmNoaW5nIGZyb20gd2hlcmUgd2UgbGVmdCBvZmYuXG4gICAgc3RhcnRpbmdJbmRleCA9IGZvdW5kSW5kZXggKyAxO1xuICB9XG59Il19