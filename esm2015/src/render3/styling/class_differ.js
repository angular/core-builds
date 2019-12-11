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
    /** @type {?} */
    let start = 0;
    /** @type {?} */
    let end = className.length;
    while (start < end) {
        start = className.indexOf(classToRemove, start);
        if (start === -1) {
            // we did not find anything, so just bail.
            break;
        }
        /** @type {?} */
        const removeLength = classToRemove.length;
        /** @type {?} */
        const hasLeadingWhiteSpace = start === 0 || className.charCodeAt(start - 1) <= 32 /* SPACE */;
        /** @type {?} */
        const hasTrailingWhiteSpace = start + removeLength === end ||
            className.charCodeAt(start + removeLength) <= 32 /* SPACE */;
        if (hasLeadingWhiteSpace && hasTrailingWhiteSpace) {
            // Cut out the class which should be removed.
            /** @type {?} */
            const endWhitespace = consumeWhitespace(className, start + removeLength, end);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xhc3NfZGlmZmVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9zdHlsaW5nL2NsYXNzX2RpZmZlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFTQSxPQUFPLEVBQUMsaUJBQWlCLEVBQUUsaUJBQWlCLEVBQUMsTUFBTSxrQkFBa0IsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBeUJ0RSxNQUFNLFVBQVUsbUJBQW1CLENBQUMsUUFBZ0IsRUFBRSxRQUFnQjs7VUFDOUQsT0FBTyxHQUFHLElBQUksR0FBRyxFQUF3QjtJQUMvQyxjQUFjLENBQUMsUUFBUSxFQUFFLE9BQU8sRUFBRSxLQUFLLENBQUMsQ0FBQztJQUN6QyxjQUFjLENBQUMsUUFBUSxFQUFFLE9BQU8sRUFBRSxJQUFJLENBQUMsQ0FBQztJQUN4QyxPQUFPLE9BQU8sQ0FBQztBQUNqQixDQUFDOzs7Ozs7Ozs7OztBQVdELE1BQU0sVUFBVSxjQUFjLENBQzFCLElBQVksRUFBRSxPQUFrQyxFQUFFLFVBQW1COztVQUNqRSxHQUFHLEdBQUcsSUFBSSxDQUFDLE1BQU07O1FBQ25CLEtBQUssR0FBRyxDQUFDO0lBQ2IsT0FBTyxLQUFLLEdBQUcsR0FBRyxFQUFFO1FBQ2xCLEtBQUssR0FBRyxpQkFBaUIsQ0FBQyxJQUFJLEVBQUUsS0FBSyxFQUFFLEdBQUcsQ0FBQyxDQUFDOztjQUN0QyxRQUFRLEdBQUcsaUJBQWlCLENBQUMsSUFBSSxFQUFFLEtBQUssRUFBRSxHQUFHLENBQUM7UUFDcEQsSUFBSSxRQUFRLEtBQUssS0FBSyxFQUFFO1lBQ3RCLGlCQUFpQixDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssRUFBRSxRQUFRLENBQUMsRUFBRSxVQUFVLENBQUMsQ0FBQztTQUN6RTtRQUNELEtBQUssR0FBRyxRQUFRLENBQUM7S0FDbEI7QUFDSCxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7OztBQWlCRCxNQUFNLFVBQVUsaUJBQWlCLENBQzdCLE9BQWtDLEVBQUUsS0FBYSxFQUFFLFVBQW1CO0lBQ3hFLElBQUksVUFBVSxFQUFFOzs7Y0FFUixrQkFBa0IsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQztRQUM3QyxJQUFJLGtCQUFrQixLQUFLLFNBQVMsRUFBRTtZQUNwQyx1RkFBdUY7WUFDdkYsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLENBQUM7U0FDMUI7YUFBTSxJQUFJLGtCQUFrQixLQUFLLEtBQUssRUFBRTtZQUN2QywyRkFBMkY7WUFDM0Ysa0RBQWtEO1lBQ2xELE9BQU8sQ0FBQyxHQUFHLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxDQUFDO1NBQzFCO0tBQ0Y7U0FBTTtRQUNMLHlFQUF5RTtRQUN6RSw0RUFBNEU7UUFDNUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7S0FDM0I7QUFDSCxDQUFDOzs7Ozs7OztBQVNELE1BQU0sVUFBVSxXQUFXLENBQUMsU0FBaUIsRUFBRSxhQUFxQjs7UUFDOUQsS0FBSyxHQUFHLENBQUM7O1FBQ1QsR0FBRyxHQUFHLFNBQVMsQ0FBQyxNQUFNO0lBQzFCLE9BQU8sS0FBSyxHQUFHLEdBQUcsRUFBRTtRQUNsQixLQUFLLEdBQUcsU0FBUyxDQUFDLE9BQU8sQ0FBQyxhQUFhLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDaEQsSUFBSSxLQUFLLEtBQUssQ0FBQyxDQUFDLEVBQUU7WUFDaEIsMENBQTBDO1lBQzFDLE1BQU07U0FDUDs7Y0FDSyxZQUFZLEdBQUcsYUFBYSxDQUFDLE1BQU07O2NBQ25DLG9CQUFvQixHQUFHLEtBQUssS0FBSyxDQUFDLElBQUksU0FBUyxDQUFDLFVBQVUsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLGtCQUFrQjs7Y0FDdkYscUJBQXFCLEdBQUcsS0FBSyxHQUFHLFlBQVksS0FBSyxHQUFHO1lBQ3RELFNBQVMsQ0FBQyxVQUFVLENBQUMsS0FBSyxHQUFHLFlBQVksQ0FBQyxrQkFBa0I7UUFDaEUsSUFBSSxvQkFBb0IsSUFBSSxxQkFBcUIsRUFBRTs7O2tCQUUzQyxhQUFhLEdBQUcsaUJBQWlCLENBQUMsU0FBUyxFQUFFLEtBQUssR0FBRyxZQUFZLEVBQUUsR0FBRyxDQUFDO1lBQzdFLFNBQVMsR0FBRyxTQUFTLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxLQUFLLENBQUMsR0FBRyxTQUFTLENBQUMsU0FBUyxDQUFDLGFBQWEsRUFBRSxHQUFHLENBQUMsQ0FBQztZQUNwRixHQUFHLEdBQUcsU0FBUyxDQUFDLE1BQU0sQ0FBQztTQUN4QjthQUFNO1lBQ0wscUVBQXFFO1lBQ3JFLEtBQUssR0FBRyxLQUFLLEdBQUcsWUFBWSxDQUFDO1NBQzlCO0tBQ0Y7SUFDRCxPQUFPLFNBQVMsQ0FBQztBQUNuQixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4qIEBsaWNlbnNlXG4qIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuKlxuKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4qL1xuXG5pbXBvcnQge0NoYXJDb2RlfSBmcm9tICcuLi8uLi91dGlsL2NoYXJfY29kZSc7XG5pbXBvcnQge2NvbnN1bWVDbGFzc1Rva2VuLCBjb25zdW1lV2hpdGVzcGFjZX0gZnJvbSAnLi9zdHlsaW5nX3BhcnNlcic7XG5cbi8qKlxuICogQ29tcHV0ZXMgdGhlIGRpZmYgYmV0d2VlbiB0d28gY2xhc3MtbGlzdCBzdHJpbmdzLlxuICpcbiAqIEV4YW1wbGU6XG4gKiAgYG9sZFZhbHVlYCA9PiBgXCJBIEIgQ1wiYFxuICogIGBuZXdWYWx1ZWAgPT4gYFwiQSBDIERcImBcbiAqIHdpbGwgcmVzdWx0IGluOlxuICogYGBgXG4gKiBuZXcgTWFwKFtcbiAqICAgWydBJywgbnVsbF0sXG4gKiAgIFsnQicsIGZhbHNlXSxcbiAqICAgWydDJywgbnVsbF0sXG4gKiAgIFsnRCcsIHRydWVdXG4gKiBdKVxuICogYGBgXG4gKlxuICogQHBhcmFtIG9sZFZhbHVlIFByZXZpb3VzIGNsYXNzLWxpc3Qgc3RyaW5nLlxuICogQHBhcmFtIG5ld1ZhbHVlIE5ldyBjbGFzcy1saXN0IHN0cmluZy5cbiAqIEByZXR1cm5zIEEgYE1hcGAgd2hpY2ggd2lsbCBiZSBmaWxsZWQgd2l0aCBjaGFuZ2VzLlxuICogICAgICAgIC0gYHRydWVgOiBDbGFzcyBuZWVkcyB0byBiZSBhZGRlZCB0byB0aGUgZWxlbWVudC5cbiAqICAgICAgICAtIGBmYWxzZTogQ2xhc3MgbmVlZHMgdG8gYmUgcmVtb3ZlZCBmcm9tIHRoZSBlbGVtZW50LlxuICogICAgICAgIC0gYG51bGxgOiBObyBjaGFuZ2UgKGxlYXZlIGNsYXNzIGFzIGlzLilcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbXB1dGVDbGFzc0NoYW5nZXMob2xkVmFsdWU6IHN0cmluZywgbmV3VmFsdWU6IHN0cmluZyk6IE1hcDxzdHJpbmcsIGJvb2xlYW58bnVsbD4ge1xuICBjb25zdCBjaGFuZ2VzID0gbmV3IE1hcDxzdHJpbmcsIGJvb2xlYW58bnVsbD4oKTtcbiAgc3BsaXRDbGFzc0xpc3Qob2xkVmFsdWUsIGNoYW5nZXMsIGZhbHNlKTtcbiAgc3BsaXRDbGFzc0xpc3QobmV3VmFsdWUsIGNoYW5nZXMsIHRydWUpO1xuICByZXR1cm4gY2hhbmdlcztcbn1cblxuLyoqXG4gKiBTcGxpdHMgdGhlIGNsYXNzIGxpc3QgaW50byBhcnJheSwgaWdub3Jpbmcgd2hpdGVzcGFjZSBhbmQgYWRkIGl0IHRvIGNvcnJlc3BvbmRpbmcgY2F0ZWdvcmllc1xuICogYGNoYW5nZXNgLlxuICpcbiAqIEBwYXJhbSB0ZXh0IENsYXNzIGxpc3QgdG8gc3BsaXRcbiAqIEBwYXJhbSBjaGFuZ2VzIE1hcCB3aGljaCB3aWxsIGJlIGZpbGxlZCB3aXRoIGNoYW5nZXMuIChgZmFsc2VgIC0gcmVtb3ZlOyBgbnVsbGAgLSBub29wO1xuICogICAgICAgIGB0cnVlYCAtIGFkZC4pXG4gKiBAcGFyYW0gaXNOZXdWYWx1ZSBgdHJ1ZWAgaWYgd2UgYXJlIHByb2Nlc3NpbmcgbmV3IGxpc3QuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzcGxpdENsYXNzTGlzdChcbiAgICB0ZXh0OiBzdHJpbmcsIGNoYW5nZXM6IE1hcDxzdHJpbmcsIGJvb2xlYW58bnVsbD4sIGlzTmV3VmFsdWU6IGJvb2xlYW4pOiB2b2lkIHtcbiAgY29uc3QgZW5kID0gdGV4dC5sZW5ndGg7XG4gIGxldCBpbmRleCA9IDA7XG4gIHdoaWxlIChpbmRleCA8IGVuZCkge1xuICAgIGluZGV4ID0gY29uc3VtZVdoaXRlc3BhY2UodGV4dCwgaW5kZXgsIGVuZCk7XG4gICAgY29uc3QgdG9rZW5FbmQgPSBjb25zdW1lQ2xhc3NUb2tlbih0ZXh0LCBpbmRleCwgZW5kKTtcbiAgICBpZiAodG9rZW5FbmQgIT09IGluZGV4KSB7XG4gICAgICBwcm9jZXNzQ2xhc3NUb2tlbihjaGFuZ2VzLCB0ZXh0LnN1YnN0cmluZyhpbmRleCwgdG9rZW5FbmQpLCBpc05ld1ZhbHVlKTtcbiAgICB9XG4gICAgaW5kZXggPSB0b2tlbkVuZDtcbiAgfVxufVxuXG4vKipcbiAqIFByb2Nlc3NlcyB0aGUgdG9rZW4gYnkgYWRkaW5nIGl0IHRvIHRoZSBgY2hhbmdlc2AgTWFwLlxuICpcbiAqIEBwYXJhbSBjaGFuZ2VzIE1hcCB3aGljaCBrZWVwcyB0cmFjayBvZiB3aGF0IHNob3VsZCBiZSBkb25lIHdpdGggZWFjaCB2YWx1ZS5cbiAqICAgICAgICAtIGBmYWxzZWAgVGhlIHRva2VuIHNob3VsZCBiZSBkZWxldGVkLiAoSXQgd2FzIGluIG9sZCBsaXN0LCBidXQgbm90IGluIG5ldyBsaXN0LilcbiAqICAgICAgICAtIGBudWxsYCBUaGUgdG9rZW4gc2hvdWxkIGJlIGlnbm9yZWQuIChJdCB3YXMgcHJlc2VudCBpbiBvbGQgbGlzdCBhcyB3ZWxsIGFzIG5ldyBsaXN0LilcbiAqICAgICAgICAtIGB0cnVlYCB0aGUgdG9rZW4gc2hvdWxkIGJlIGFkZGVkLiAoSXQgd2FzIG9ubHkgcHJlc2VudCBpbiB0aGUgbmV3IHZhbHVlKVxuICogQHBhcmFtIHRva2VuIFRva2VuIHRvIGFkZCB0byBzZXQuXG4gKiBAcGFyYW0gaXNOZXdWYWx1ZSBUcnVlIGlmIGludm9jYXRpb24gcmVwcmVzZW50cyBhbiBhZGRpdGlvbiAocmVtb3ZhbCBvdGhlcndpc2UuKVxuICogICAgICAgIC0gYGZhbHNlYCBtZWFucyB0aGF0IHdlIGFyZSBwcm9jZXNzaW5nIHRoZSBvbGQgdmFsdWUsIHdoaWNoIG1heSBuZWVkIHRvIGJlIGRlbGV0ZWQuXG4gKiAgICAgICAgICBJbml0aWFsbHkgYWxsIHRva2VucyBhcmUgbGFiZWxlZCBgZmFsc2VgIChyZW1vdmUgaXQuKVxuICogICAgICAgIC0gYHRydWVgIG1lYW5zIHRoYXQgd2UgYXJlIHByb2Nlc3NpbmcgbmV3IHZhbHVlIHdoaWNoIG1heSBuZWVkIHRvIGJlIGFkZGVkLiBJZiBhIHRva2VuXG4gKiAgICAgICAgICB3aXRoIHNhbWUga2V5IGFscmVhZHkgZXhpc3RzIHdpdGggYGZhbHNlYCB0aGVuIHRoZSByZXN1bHRpbmcgdG9rZW4gaXMgYG51bGxgIChub1xuICogICAgICAgICAgY2hhbmdlLikgSWYgbm8gdG9rZW4gZXhpc3RzIHRoZW4gdGhlIG5ldyB0b2tlbiB2YWx1ZSBpcyBgdHJ1ZWAgKGFkZCBpdC4pXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwcm9jZXNzQ2xhc3NUb2tlbihcbiAgICBjaGFuZ2VzOiBNYXA8c3RyaW5nLCBib29sZWFufG51bGw+LCB0b2tlbjogc3RyaW5nLCBpc05ld1ZhbHVlOiBib29sZWFuKSB7XG4gIGlmIChpc05ld1ZhbHVlKSB7XG4gICAgLy8gVGhpcyBjb2RlIHBhdGggaXMgZXhlY3V0ZWQgd2hlbiB3ZSBhcmUgaXRlcmF0aW5nIG92ZXIgbmV3IHZhbHVlcy5cbiAgICBjb25zdCBleGlzdGluZ1Rva2VuVmFsdWUgPSBjaGFuZ2VzLmdldCh0b2tlbik7XG4gICAgaWYgKGV4aXN0aW5nVG9rZW5WYWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAvLyB0aGUgbmV3IGxpc3QgaGFzIGEgdG9rZW4gd2hpY2ggaXMgbm90IHByZXNlbnQgaW4gdGhlIG9sZCBsaXN0LiBNYXJrIGl0IGZvciBhZGRpdGlvbi5cbiAgICAgIGNoYW5nZXMuc2V0KHRva2VuLCB0cnVlKTtcbiAgICB9IGVsc2UgaWYgKGV4aXN0aW5nVG9rZW5WYWx1ZSA9PT0gZmFsc2UpIHtcbiAgICAgIC8vIElmIHRoZSBleGlzdGluZyB2YWx1ZSBpcyBgZmFsc2VgIHRoaXMgbWVhbnMgaXQgd2FzIGluIHRoZSBvbGQgbGlzdC4gQmVjYXVzZSBpdCBpcyBpbiB0aGVcbiAgICAgIC8vIG5ldyBsaXN0IGFzIHdlbGwgd2UgbWFya2VkIGl0IGFzIGBudWxsYCAobm9vcC4pXG4gICAgICBjaGFuZ2VzLnNldCh0b2tlbiwgbnVsbCk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIC8vIFRoaXMgY29kZSBwYXRoIGlzIGV4ZWN1dGVkIHdoZW4gd2UgYXJlIGl0ZXJhdGluZyBvdmVyIHByZXZpb3VzIHZhbHVlcy5cbiAgICAvLyBUaGlzIG1lYW5zIHRoYXQgd2Ugc3RvcmUgdGhlIHRva2VucyBpbiBgY2hhbmdlc2Agd2l0aCBgZmFsc2VgIChyZW1vdmFscykuXG4gICAgY2hhbmdlcy5zZXQodG9rZW4sIGZhbHNlKTtcbiAgfVxufVxuXG4vKipcbiAqIFJlbW92ZXMgYSBjbGFzcyBmcm9tIGEgYGNsYXNzTmFtZWAgc3RyaW5nLlxuICpcbiAqIEBwYXJhbSBjbGFzc05hbWUgQSBzdHJpbmcgY29udGFpbmluZyBjbGFzc2VzICh3aGl0ZXNwYWNlIHNlcGFyYXRlZClcbiAqIEBwYXJhbSBjbGFzc1RvUmVtb3ZlIEEgY2xhc3MgbmFtZSB0byByZW1vdmUgZnJvbSB0aGUgYGNsYXNzTmFtZWBcbiAqIEByZXR1cm5zIGEgbmV3IGNsYXNzLWxpc3Qgd2hpY2ggZG9lcyBub3QgaGF2ZSBgY2xhc3NUb1JlbW92ZWBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlbW92ZUNsYXNzKGNsYXNzTmFtZTogc3RyaW5nLCBjbGFzc1RvUmVtb3ZlOiBzdHJpbmcpOiBzdHJpbmcge1xuICBsZXQgc3RhcnQgPSAwO1xuICBsZXQgZW5kID0gY2xhc3NOYW1lLmxlbmd0aDtcbiAgd2hpbGUgKHN0YXJ0IDwgZW5kKSB7XG4gICAgc3RhcnQgPSBjbGFzc05hbWUuaW5kZXhPZihjbGFzc1RvUmVtb3ZlLCBzdGFydCk7XG4gICAgaWYgKHN0YXJ0ID09PSAtMSkge1xuICAgICAgLy8gd2UgZGlkIG5vdCBmaW5kIGFueXRoaW5nLCBzbyBqdXN0IGJhaWwuXG4gICAgICBicmVhaztcbiAgICB9XG4gICAgY29uc3QgcmVtb3ZlTGVuZ3RoID0gY2xhc3NUb1JlbW92ZS5sZW5ndGg7XG4gICAgY29uc3QgaGFzTGVhZGluZ1doaXRlU3BhY2UgPSBzdGFydCA9PT0gMCB8fCBjbGFzc05hbWUuY2hhckNvZGVBdChzdGFydCAtIDEpIDw9IENoYXJDb2RlLlNQQUNFO1xuICAgIGNvbnN0IGhhc1RyYWlsaW5nV2hpdGVTcGFjZSA9IHN0YXJ0ICsgcmVtb3ZlTGVuZ3RoID09PSBlbmQgfHxcbiAgICAgICAgY2xhc3NOYW1lLmNoYXJDb2RlQXQoc3RhcnQgKyByZW1vdmVMZW5ndGgpIDw9IENoYXJDb2RlLlNQQUNFO1xuICAgIGlmIChoYXNMZWFkaW5nV2hpdGVTcGFjZSAmJiBoYXNUcmFpbGluZ1doaXRlU3BhY2UpIHtcbiAgICAgIC8vIEN1dCBvdXQgdGhlIGNsYXNzIHdoaWNoIHNob3VsZCBiZSByZW1vdmVkLlxuICAgICAgY29uc3QgZW5kV2hpdGVzcGFjZSA9IGNvbnN1bWVXaGl0ZXNwYWNlKGNsYXNzTmFtZSwgc3RhcnQgKyByZW1vdmVMZW5ndGgsIGVuZCk7XG4gICAgICBjbGFzc05hbWUgPSBjbGFzc05hbWUuc3Vic3RyaW5nKDAsIHN0YXJ0KSArIGNsYXNzTmFtZS5zdWJzdHJpbmcoZW5kV2hpdGVzcGFjZSwgZW5kKTtcbiAgICAgIGVuZCA9IGNsYXNzTmFtZS5sZW5ndGg7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIGluIHRoaXMgY2FzZSB3ZSBhcmUgb25seSBhIHN1YnN0cmluZyBvZiB0aGUgYWN0dWFsIGNsYXNzLCBtb3ZlIG9uLlxuICAgICAgc3RhcnQgPSBzdGFydCArIHJlbW92ZUxlbmd0aDtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGNsYXNzTmFtZTtcbn0iXX0=