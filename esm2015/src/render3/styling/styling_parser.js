/**
 * @fileoverview added by tsickle
 * Generated from: packages/core/src/render3/styling/styling_parser.ts
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/**
 * Returns index of next non-whitespace character.
 *
 * @param {?} text Text to scan
 * @param {?} startIndex Starting index of character where the scan should start.
 * @param {?} endIndex Ending index of character where the scan should end.
 * @return {?} Index of next non-whitespace character (May be the same as `start` if no whitespace at
 *          that location.)
 */
export function consumeWhitespace(text, startIndex, endIndex) {
    while (startIndex < endIndex && text.charCodeAt(startIndex) <= 32 /* SPACE */) {
        startIndex++;
    }
    return startIndex;
}
/**
 * Returns index of last char in class token.
 *
 * @param {?} text Text to scan
 * @param {?} startIndex Starting index of character where the scan should start.
 * @param {?} endIndex Ending index of character where the scan should end.
 * @return {?} Index after last char in class token.
 */
export function consumeClassToken(text, startIndex, endIndex) {
    while (startIndex < endIndex && text.charCodeAt(startIndex) > 32 /* SPACE */) {
        startIndex++;
    }
    return startIndex;
}
/**
 * Consumes all of the characters belonging to style key and token.
 *
 * @param {?} text Text to scan
 * @param {?} startIndex Starting index of character where the scan should start.
 * @param {?} endIndex Ending index of character where the scan should end.
 * @return {?} Index after last style key character.
 */
export function consumeStyleKey(text, startIndex, endIndex) {
    /** @type {?} */
    let ch;
    while (startIndex < endIndex &&
        ((ch = text.charCodeAt(startIndex)) === 45 /* DASH */ || ch === 95 /* UNDERSCORE */ ||
            ((ch & -33 /* UPPER_CASE */) >= 65 /* A */ && (ch & -33 /* UPPER_CASE */) <= 90 /* Z */))) {
        startIndex++;
    }
    return startIndex;
}
/**
 * Consumes all whitespace and the separator `:` after the style key.
 *
 * @param {?} text Text to scan
 * @param {?} startIndex Starting index of character where the scan should start.
 * @param {?} endIndex Ending index of character where the scan should end.
 * @param {?} separator
 * @return {?} Index after separator and surrounding whitespace.
 */
export function consumeSeparator(text, startIndex, endIndex, separator) {
    startIndex = consumeWhitespace(text, startIndex, endIndex);
    if (startIndex < endIndex) {
        if (ngDevMode && text.charCodeAt(startIndex) !== separator) {
            throw expectingError(text, String.fromCharCode(separator), startIndex);
        }
        startIndex++;
    }
    startIndex = consumeWhitespace(text, startIndex, endIndex);
    return startIndex;
}
/**
 * Consumes style value honoring `url()` and `""` text.
 *
 * @param {?} text Text to scan
 * @param {?} startIndex Starting index of character where the scan should start.
 * @param {?} endIndex Ending index of character where the scan should end.
 * @return {?} Index after last style value character.
 */
export function consumeStyleValue(text, startIndex, endIndex) {
    /** @type {?} */
    let ch1 = -1;
    // 1st previous character
    /** @type {?} */
    let ch2 = -1;
    // 2nd previous character
    /** @type {?} */
    let ch3 = -1;
    // 3rd previous character
    /** @type {?} */
    let i = startIndex;
    /** @type {?} */
    let lastChIndex = i;
    while (i < endIndex) {
        /** @type {?} */
        const ch = text.charCodeAt(i++);
        if (ch === 59 /* SEMI_COLON */) {
            return lastChIndex;
        }
        else if (ch === 34 /* DOUBLE_QUOTE */ || ch === 39 /* SINGLE_QUOTE */) {
            lastChIndex = i = consumeQuotedText(text, ch, i, endIndex);
        }
        else if (startIndex ===
            i - 4 && // We have seen only 4 characters so far "URL(" (Ignore "foo_URL()")
            ch3 === 85 /* U */ &&
            ch2 === 82 /* R */ && ch1 === 76 /* L */ && ch === 40 /* OPEN_PAREN */) {
            lastChIndex = i = consumeQuotedText(text, 41 /* CLOSE_PAREN */, i, endIndex);
        }
        else if (ch > 32 /* SPACE */) {
            // if we have a non-whitespace character then capture its location
            lastChIndex = i;
        }
        ch3 = ch2;
        ch2 = ch1;
        ch1 = ch & -33 /* UPPER_CASE */;
    }
    return lastChIndex;
}
/**
 * Consumes all of the quoted characters.
 *
 * @param {?} text Text to scan
 * @param {?} quoteCharCode CharCode of either `"` or `'` quote or `)` for `url(...)`.
 * @param {?} startIndex Starting index of character where the scan should start.
 * @param {?} endIndex Ending index of character where the scan should end.
 * @return {?} Index after quoted characters.
 */
export function consumeQuotedText(text, quoteCharCode, startIndex, endIndex) {
    /** @type {?} */
    let ch1 = -1;
    // 1st previous character
    /** @type {?} */
    let index = startIndex;
    while (index < endIndex) {
        /** @type {?} */
        const ch = text.charCodeAt(index++);
        if (ch == quoteCharCode && ch1 !== 92 /* BACK_SLASH */) {
            return index;
        }
        if (ch == 92 /* BACK_SLASH */ && ch1 === 92 /* BACK_SLASH */) {
            // two back slashes cancel each other out. For example `"\\"` should properly end the
            // quotation. (It should not assume that the last `"` is escaped.)
            ch1 = 0;
        }
        else {
            ch1 = ch;
        }
    }
    throw ngDevMode ? expectingError(text, String.fromCharCode(quoteCharCode), endIndex) :
        new Error();
}
/**
 * @param {?} text
 * @param {?} expecting
 * @param {?} index
 * @return {?}
 */
function expectingError(text, expecting, index) {
    return new Error(`Expecting '${expecting}' at location ${index} in string '` + text.substring(0, index) +
        '[>>' + text.substring(index, index + 1) + '<<]' + text.substr(index + 1) + '\'.');
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3R5bGluZ19wYXJzZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL3N0eWxpbmcvc3R5bGluZ19wYXJzZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBbUJBLE1BQU0sVUFBVSxpQkFBaUIsQ0FBQyxJQUFZLEVBQUUsVUFBa0IsRUFBRSxRQUFnQjtJQUNsRixPQUFPLFVBQVUsR0FBRyxRQUFRLElBQUksSUFBSSxDQUFDLFVBQVUsQ0FBQyxVQUFVLENBQUMsa0JBQWtCLEVBQUU7UUFDN0UsVUFBVSxFQUFFLENBQUM7S0FDZDtJQUNELE9BQU8sVUFBVSxDQUFDO0FBQ3BCLENBQUM7Ozs7Ozs7OztBQVVELE1BQU0sVUFBVSxpQkFBaUIsQ0FBQyxJQUFZLEVBQUUsVUFBa0IsRUFBRSxRQUFnQjtJQUNsRixPQUFPLFVBQVUsR0FBRyxRQUFRLElBQUksSUFBSSxDQUFDLFVBQVUsQ0FBQyxVQUFVLENBQUMsaUJBQWlCLEVBQUU7UUFDNUUsVUFBVSxFQUFFLENBQUM7S0FDZDtJQUNELE9BQU8sVUFBVSxDQUFDO0FBQ3BCLENBQUM7Ozs7Ozs7OztBQVVELE1BQU0sVUFBVSxlQUFlLENBQUMsSUFBWSxFQUFFLFVBQWtCLEVBQUUsUUFBZ0I7O1FBQzVFLEVBQVU7SUFDZCxPQUFPLFVBQVUsR0FBRyxRQUFRO1FBQ3JCLENBQUMsQ0FBQyxFQUFFLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxVQUFVLENBQUMsQ0FBQyxrQkFBa0IsSUFBSSxFQUFFLHdCQUF3QjtZQUNsRixDQUFDLENBQUMsRUFBRSx1QkFBc0IsQ0FBQyxjQUFjLElBQUksQ0FBQyxFQUFFLHVCQUFzQixDQUFDLGNBQWMsQ0FBQyxDQUFDLEVBQUU7UUFDL0YsVUFBVSxFQUFFLENBQUM7S0FDZDtJQUNELE9BQU8sVUFBVSxDQUFDO0FBQ3BCLENBQUM7Ozs7Ozs7Ozs7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QUM7UUFDcEUsSUFBSSxLQUFLLEVBQUUsQ0FBQztBQUNoQyxDQUFDOzs7Ozs7O0FBRUQsU0FBUyxjQUFjLENBQUMsSUFBWSxFQUFFLFNBQWlCLEVBQUUsS0FBYTtJQUNwRSxPQUFPLElBQUksS0FBSyxDQUNaLGNBQWMsU0FBUyxpQkFBaUIsS0FBSyxjQUFjLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDO1FBQ3RGLEtBQUssR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssRUFBRSxLQUFLLEdBQUcsQ0FBQyxDQUFDLEdBQUcsS0FBSyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQyxHQUFHLEtBQUssQ0FBQyxDQUFDO0FBQ3pGLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7Q2hhckNvZGV9IGZyb20gJy4uLy4uL3V0aWwvY2hhcl9jb2RlJztcblxuLyoqXG4gKiBSZXR1cm5zIGluZGV4IG9mIG5leHQgbm9uLXdoaXRlc3BhY2UgY2hhcmFjdGVyLlxuICpcbiAqIEBwYXJhbSB0ZXh0IFRleHQgdG8gc2NhblxuICogQHBhcmFtIHN0YXJ0SW5kZXggU3RhcnRpbmcgaW5kZXggb2YgY2hhcmFjdGVyIHdoZXJlIHRoZSBzY2FuIHNob3VsZCBzdGFydC5cbiAqIEBwYXJhbSBlbmRJbmRleCBFbmRpbmcgaW5kZXggb2YgY2hhcmFjdGVyIHdoZXJlIHRoZSBzY2FuIHNob3VsZCBlbmQuXG4gKiBAcmV0dXJucyBJbmRleCBvZiBuZXh0IG5vbi13aGl0ZXNwYWNlIGNoYXJhY3RlciAoTWF5IGJlIHRoZSBzYW1lIGFzIGBzdGFydGAgaWYgbm8gd2hpdGVzcGFjZSBhdFxuICogICAgICAgICAgdGhhdCBsb2NhdGlvbi4pXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb25zdW1lV2hpdGVzcGFjZSh0ZXh0OiBzdHJpbmcsIHN0YXJ0SW5kZXg6IG51bWJlciwgZW5kSW5kZXg6IG51bWJlcik6IG51bWJlciB7XG4gIHdoaWxlIChzdGFydEluZGV4IDwgZW5kSW5kZXggJiYgdGV4dC5jaGFyQ29kZUF0KHN0YXJ0SW5kZXgpIDw9IENoYXJDb2RlLlNQQUNFKSB7XG4gICAgc3RhcnRJbmRleCsrO1xuICB9XG4gIHJldHVybiBzdGFydEluZGV4O1xufVxuXG4vKipcbiAqIFJldHVybnMgaW5kZXggb2YgbGFzdCBjaGFyIGluIGNsYXNzIHRva2VuLlxuICpcbiAqIEBwYXJhbSB0ZXh0IFRleHQgdG8gc2NhblxuICogQHBhcmFtIHN0YXJ0SW5kZXggU3RhcnRpbmcgaW5kZXggb2YgY2hhcmFjdGVyIHdoZXJlIHRoZSBzY2FuIHNob3VsZCBzdGFydC5cbiAqIEBwYXJhbSBlbmRJbmRleCBFbmRpbmcgaW5kZXggb2YgY2hhcmFjdGVyIHdoZXJlIHRoZSBzY2FuIHNob3VsZCBlbmQuXG4gKiBAcmV0dXJucyBJbmRleCBhZnRlciBsYXN0IGNoYXIgaW4gY2xhc3MgdG9rZW4uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb25zdW1lQ2xhc3NUb2tlbih0ZXh0OiBzdHJpbmcsIHN0YXJ0SW5kZXg6IG51bWJlciwgZW5kSW5kZXg6IG51bWJlcik6IG51bWJlciB7XG4gIHdoaWxlIChzdGFydEluZGV4IDwgZW5kSW5kZXggJiYgdGV4dC5jaGFyQ29kZUF0KHN0YXJ0SW5kZXgpID4gQ2hhckNvZGUuU1BBQ0UpIHtcbiAgICBzdGFydEluZGV4Kys7XG4gIH1cbiAgcmV0dXJuIHN0YXJ0SW5kZXg7XG59XG5cbi8qKlxuICogQ29uc3VtZXMgYWxsIG9mIHRoZSBjaGFyYWN0ZXJzIGJlbG9uZ2luZyB0byBzdHlsZSBrZXkgYW5kIHRva2VuLlxuICpcbiAqIEBwYXJhbSB0ZXh0IFRleHQgdG8gc2NhblxuICogQHBhcmFtIHN0YXJ0SW5kZXggU3RhcnRpbmcgaW5kZXggb2YgY2hhcmFjdGVyIHdoZXJlIHRoZSBzY2FuIHNob3VsZCBzdGFydC5cbiAqIEBwYXJhbSBlbmRJbmRleCBFbmRpbmcgaW5kZXggb2YgY2hhcmFjdGVyIHdoZXJlIHRoZSBzY2FuIHNob3VsZCBlbmQuXG4gKiBAcmV0dXJucyBJbmRleCBhZnRlciBsYXN0IHN0eWxlIGtleSBjaGFyYWN0ZXIuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb25zdW1lU3R5bGVLZXkodGV4dDogc3RyaW5nLCBzdGFydEluZGV4OiBudW1iZXIsIGVuZEluZGV4OiBudW1iZXIpOiBudW1iZXIge1xuICBsZXQgY2g6IG51bWJlcjtcbiAgd2hpbGUgKHN0YXJ0SW5kZXggPCBlbmRJbmRleCAmJlxuICAgICAgICAgKChjaCA9IHRleHQuY2hhckNvZGVBdChzdGFydEluZGV4KSkgPT09IENoYXJDb2RlLkRBU0ggfHwgY2ggPT09IENoYXJDb2RlLlVOREVSU0NPUkUgfHxcbiAgICAgICAgICAoKGNoICYgQ2hhckNvZGUuVVBQRVJfQ0FTRSkgPj0gQ2hhckNvZGUuQSAmJiAoY2ggJiBDaGFyQ29kZS5VUFBFUl9DQVNFKSA8PSBDaGFyQ29kZS5aKSkpIHtcbiAgICBzdGFydEluZGV4Kys7XG4gIH1cbiAgcmV0dXJuIHN0YXJ0SW5kZXg7XG59XG5cbi8qKlxuICogQ29uc3VtZXMgYWxsIHdoaXRlc3BhY2UgYW5kIHRoZSBzZXBhcmF0b3IgYDpgIGFmdGVyIHRoZSBzdHlsZSBrZXkuXG4gKlxuICogQHBhcmFtIHRleHQgVGV4dCB0byBzY2FuXG4gKiBAcGFyYW0gc3RhcnRJbmRleCBTdGFydGluZyBpbmRleCBvZiBjaGFyYWN0ZXIgd2hlcmUgdGhlIHNjYW4gc2hvdWxkIHN0YXJ0LlxuICogQHBhcmFtIGVuZEluZGV4IEVuZGluZyBpbmRleCBvZiBjaGFyYWN0ZXIgd2hlcmUgdGhlIHNjYW4gc2hvdWxkIGVuZC5cbiAqIEByZXR1cm5zIEluZGV4IGFmdGVyIHNlcGFyYXRvciBhbmQgc3Vycm91bmRpbmcgd2hpdGVzcGFjZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbnN1bWVTZXBhcmF0b3IoXG4gICAgdGV4dDogc3RyaW5nLCBzdGFydEluZGV4OiBudW1iZXIsIGVuZEluZGV4OiBudW1iZXIsIHNlcGFyYXRvcjogbnVtYmVyKTogbnVtYmVyIHtcbiAgc3RhcnRJbmRleCA9IGNvbnN1bWVXaGl0ZXNwYWNlKHRleHQsIHN0YXJ0SW5kZXgsIGVuZEluZGV4KTtcbiAgaWYgKHN0YXJ0SW5kZXggPCBlbmRJbmRleCkge1xuICAgIGlmIChuZ0Rldk1vZGUgJiYgdGV4dC5jaGFyQ29kZUF0KHN0YXJ0SW5kZXgpICE9PSBzZXBhcmF0b3IpIHtcbiAgICAgIHRocm93IGV4cGVjdGluZ0Vycm9yKHRleHQsIFN0cmluZy5mcm9tQ2hhckNvZGUoc2VwYXJhdG9yKSwgc3RhcnRJbmRleCk7XG4gICAgfVxuICAgIHN0YXJ0SW5kZXgrKztcbiAgfVxuICBzdGFydEluZGV4ID0gY29uc3VtZVdoaXRlc3BhY2UodGV4dCwgc3RhcnRJbmRleCwgZW5kSW5kZXgpO1xuICByZXR1cm4gc3RhcnRJbmRleDtcbn1cblxuXG4vKipcbiAqIENvbnN1bWVzIHN0eWxlIHZhbHVlIGhvbm9yaW5nIGB1cmwoKWAgYW5kIGBcIlwiYCB0ZXh0LlxuICpcbiAqIEBwYXJhbSB0ZXh0IFRleHQgdG8gc2NhblxuICogQHBhcmFtIHN0YXJ0SW5kZXggU3RhcnRpbmcgaW5kZXggb2YgY2hhcmFjdGVyIHdoZXJlIHRoZSBzY2FuIHNob3VsZCBzdGFydC5cbiAqIEBwYXJhbSBlbmRJbmRleCBFbmRpbmcgaW5kZXggb2YgY2hhcmFjdGVyIHdoZXJlIHRoZSBzY2FuIHNob3VsZCBlbmQuXG4gKiBAcmV0dXJucyBJbmRleCBhZnRlciBsYXN0IHN0eWxlIHZhbHVlIGNoYXJhY3Rlci5cbiovXG5leHBvcnQgZnVuY3Rpb24gY29uc3VtZVN0eWxlVmFsdWUodGV4dDogc3RyaW5nLCBzdGFydEluZGV4OiBudW1iZXIsIGVuZEluZGV4OiBudW1iZXIpOiBudW1iZXIge1xuICBsZXQgY2gxID0gLTE7ICAvLyAxc3QgcHJldmlvdXMgY2hhcmFjdGVyXG4gIGxldCBjaDIgPSAtMTsgIC8vIDJuZCBwcmV2aW91cyBjaGFyYWN0ZXJcbiAgbGV0IGNoMyA9IC0xOyAgLy8gM3JkIHByZXZpb3VzIGNoYXJhY3RlclxuICBsZXQgaSA9IHN0YXJ0SW5kZXg7XG4gIGxldCBsYXN0Q2hJbmRleCA9IGk7XG4gIHdoaWxlIChpIDwgZW5kSW5kZXgpIHtcbiAgICBjb25zdCBjaDogbnVtYmVyID0gdGV4dC5jaGFyQ29kZUF0KGkrKyk7XG4gICAgaWYgKGNoID09PSBDaGFyQ29kZS5TRU1JX0NPTE9OKSB7XG4gICAgICByZXR1cm4gbGFzdENoSW5kZXg7XG4gICAgfSBlbHNlIGlmIChjaCA9PT0gQ2hhckNvZGUuRE9VQkxFX1FVT1RFIHx8IGNoID09PSBDaGFyQ29kZS5TSU5HTEVfUVVPVEUpIHtcbiAgICAgIGxhc3RDaEluZGV4ID0gaSA9IGNvbnN1bWVRdW90ZWRUZXh0KHRleHQsIGNoLCBpLCBlbmRJbmRleCk7XG4gICAgfSBlbHNlIGlmIChcbiAgICAgICAgc3RhcnRJbmRleCA9PT1cbiAgICAgICAgICAgIGkgLSA0ICYmICAvLyBXZSBoYXZlIHNlZW4gb25seSA0IGNoYXJhY3RlcnMgc28gZmFyIFwiVVJMKFwiIChJZ25vcmUgXCJmb29fVVJMKClcIilcbiAgICAgICAgY2gzID09PSBDaGFyQ29kZS5VICYmXG4gICAgICAgIGNoMiA9PT0gQ2hhckNvZGUuUiAmJiBjaDEgPT09IENoYXJDb2RlLkwgJiYgY2ggPT09IENoYXJDb2RlLk9QRU5fUEFSRU4pIHtcbiAgICAgIGxhc3RDaEluZGV4ID0gaSA9IGNvbnN1bWVRdW90ZWRUZXh0KHRleHQsIENoYXJDb2RlLkNMT1NFX1BBUkVOLCBpLCBlbmRJbmRleCk7XG4gICAgfSBlbHNlIGlmIChjaCA+IENoYXJDb2RlLlNQQUNFKSB7XG4gICAgICAvLyBpZiB3ZSBoYXZlIGEgbm9uLXdoaXRlc3BhY2UgY2hhcmFjdGVyIHRoZW4gY2FwdHVyZSBpdHMgbG9jYXRpb25cbiAgICAgIGxhc3RDaEluZGV4ID0gaTtcbiAgICB9XG4gICAgY2gzID0gY2gyO1xuICAgIGNoMiA9IGNoMTtcbiAgICBjaDEgPSBjaCAmIENoYXJDb2RlLlVQUEVSX0NBU0U7XG4gIH1cbiAgcmV0dXJuIGxhc3RDaEluZGV4O1xufVxuXG4vKipcbiAqIENvbnN1bWVzIGFsbCBvZiB0aGUgcXVvdGVkIGNoYXJhY3RlcnMuXG4gKlxuICogQHBhcmFtIHRleHQgVGV4dCB0byBzY2FuXG4gKiBAcGFyYW0gcXVvdGVDaGFyQ29kZSBDaGFyQ29kZSBvZiBlaXRoZXIgYFwiYCBvciBgJ2AgcXVvdGUgb3IgYClgIGZvciBgdXJsKC4uLilgLlxuICogQHBhcmFtIHN0YXJ0SW5kZXggU3RhcnRpbmcgaW5kZXggb2YgY2hhcmFjdGVyIHdoZXJlIHRoZSBzY2FuIHNob3VsZCBzdGFydC5cbiAqIEBwYXJhbSBlbmRJbmRleCBFbmRpbmcgaW5kZXggb2YgY2hhcmFjdGVyIHdoZXJlIHRoZSBzY2FuIHNob3VsZCBlbmQuXG4gKiBAcmV0dXJucyBJbmRleCBhZnRlciBxdW90ZWQgY2hhcmFjdGVycy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbnN1bWVRdW90ZWRUZXh0KFxuICAgIHRleHQ6IHN0cmluZywgcXVvdGVDaGFyQ29kZTogbnVtYmVyLCBzdGFydEluZGV4OiBudW1iZXIsIGVuZEluZGV4OiBudW1iZXIpOiBudW1iZXIge1xuICBsZXQgY2gxID0gLTE7ICAvLyAxc3QgcHJldmlvdXMgY2hhcmFjdGVyXG4gIGxldCBpbmRleCA9IHN0YXJ0SW5kZXg7XG4gIHdoaWxlIChpbmRleCA8IGVuZEluZGV4KSB7XG4gICAgY29uc3QgY2ggPSB0ZXh0LmNoYXJDb2RlQXQoaW5kZXgrKyk7XG4gICAgaWYgKGNoID09IHF1b3RlQ2hhckNvZGUgJiYgY2gxICE9PSBDaGFyQ29kZS5CQUNLX1NMQVNIKSB7XG4gICAgICByZXR1cm4gaW5kZXg7XG4gICAgfVxuICAgIGlmIChjaCA9PSBDaGFyQ29kZS5CQUNLX1NMQVNIICYmIGNoMSA9PT0gQ2hhckNvZGUuQkFDS19TTEFTSCkge1xuICAgICAgLy8gdHdvIGJhY2sgc2xhc2hlcyBjYW5jZWwgZWFjaCBvdGhlciBvdXQuIEZvciBleGFtcGxlIGBcIlxcXFxcImAgc2hvdWxkIHByb3Blcmx5IGVuZCB0aGVcbiAgICAgIC8vIHF1b3RhdGlvbi4gKEl0IHNob3VsZCBub3QgYXNzdW1lIHRoYXQgdGhlIGxhc3QgYFwiYCBpcyBlc2NhcGVkLilcbiAgICAgIGNoMSA9IDA7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNoMSA9IGNoO1xuICAgIH1cbiAgfVxuICB0aHJvdyBuZ0Rldk1vZGUgPyBleHBlY3RpbmdFcnJvcih0ZXh0LCBTdHJpbmcuZnJvbUNoYXJDb2RlKHF1b3RlQ2hhckNvZGUpLCBlbmRJbmRleCkgOlxuICAgICAgICAgICAgICAgICAgICBuZXcgRXJyb3IoKTtcbn1cblxuZnVuY3Rpb24gZXhwZWN0aW5nRXJyb3IodGV4dDogc3RyaW5nLCBleHBlY3Rpbmc6IHN0cmluZywgaW5kZXg6IG51bWJlcikge1xuICByZXR1cm4gbmV3IEVycm9yKFxuICAgICAgYEV4cGVjdGluZyAnJHtleHBlY3Rpbmd9JyBhdCBsb2NhdGlvbiAke2luZGV4fSBpbiBzdHJpbmcgJ2AgKyB0ZXh0LnN1YnN0cmluZygwLCBpbmRleCkgK1xuICAgICAgJ1s+PicgKyB0ZXh0LnN1YnN0cmluZyhpbmRleCwgaW5kZXggKyAxKSArICc8PF0nICsgdGV4dC5zdWJzdHIoaW5kZXggKyAxKSArICdcXCcuJyk7XG59Il19