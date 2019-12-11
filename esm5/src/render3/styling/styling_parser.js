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
 * @param text Text to scan
 * @param startIndex Starting index of character where the scan should start.
 * @param endIndex Ending index of character where the scan should end.
 * @returns Index of next non-whitespace character (May be the same as `start` if no whitespace at
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
 * @param text Text to scan
 * @param startIndex Starting index of character where the scan should start.
 * @param endIndex Ending index of character where the scan should end.
 * @returns Index after last char in class token.
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
 * @param text Text to scan
 * @param startIndex Starting index of character where the scan should start.
 * @param endIndex Ending index of character where the scan should end.
 * @returns Index after last style key character.
 */
export function consumeStyleKey(text, startIndex, endIndex) {
    var ch;
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
 * @param text Text to scan
 * @param startIndex Starting index of character where the scan should start.
 * @param endIndex Ending index of character where the scan should end.
 * @returns Index after separator and surrounding whitespace.
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
 * @param text Text to scan
 * @param startIndex Starting index of character where the scan should start.
 * @param endIndex Ending index of character where the scan should end.
 * @returns Index after last style value character.
*/
export function consumeStyleValue(text, startIndex, endIndex) {
    var ch1 = -1; // 1st previous character
    var ch2 = -1; // 2nd previous character
    var ch3 = -1; // 3rd previous character
    var i = startIndex;
    var lastChIndex = i;
    while (i < endIndex) {
        var ch = text.charCodeAt(i++);
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
 * @param text Text to scan
 * @param quoteCharCode CharCode of either `"` or `'` quote or `)` for `url(...)`.
 * @param startIndex Starting index of character where the scan should start.
 * @param endIndex Ending index of character where the scan should end.
 * @returns Index after quoted characters.
 */
export function consumeQuotedText(text, quoteCharCode, startIndex, endIndex) {
    var ch1 = -1; // 1st previous character
    var index = startIndex;
    while (index < endIndex) {
        var ch = text.charCodeAt(index++);
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
function expectingError(text, expecting, index) {
    return new Error("Expecting '" + expecting + "' at location " + index + " in string '" + text.substring(0, index) +
        '[>>' + text.substring(index, index + 1) + '<<]' + text.substr(index + 1) + '\'.');
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3R5bGluZ19wYXJzZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL3N0eWxpbmcvc3R5bGluZ19wYXJzZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBSUg7Ozs7Ozs7O0dBUUc7QUFDSCxNQUFNLFVBQVUsaUJBQWlCLENBQUMsSUFBWSxFQUFFLFVBQWtCLEVBQUUsUUFBZ0I7SUFDbEYsT0FBTyxVQUFVLEdBQUcsUUFBUSxJQUFJLElBQUksQ0FBQyxVQUFVLENBQUMsVUFBVSxDQUFDLGtCQUFrQixFQUFFO1FBQzdFLFVBQVUsRUFBRSxDQUFDO0tBQ2Q7SUFDRCxPQUFPLFVBQVUsQ0FBQztBQUNwQixDQUFDO0FBRUQ7Ozs7Ozs7R0FPRztBQUNILE1BQU0sVUFBVSxpQkFBaUIsQ0FBQyxJQUFZLEVBQUUsVUFBa0IsRUFBRSxRQUFnQjtJQUNsRixPQUFPLFVBQVUsR0FBRyxRQUFRLElBQUksSUFBSSxDQUFDLFVBQVUsQ0FBQyxVQUFVLENBQUMsaUJBQWlCLEVBQUU7UUFDNUUsVUFBVSxFQUFFLENBQUM7S0FDZDtJQUNELE9BQU8sVUFBVSxDQUFDO0FBQ3BCLENBQUM7QUFFRDs7Ozs7OztHQU9HO0FBQ0gsTUFBTSxVQUFVLGVBQWUsQ0FBQyxJQUFZLEVBQUUsVUFBa0IsRUFBRSxRQUFnQjtJQUNoRixJQUFJLEVBQVUsQ0FBQztJQUNmLE9BQU8sVUFBVSxHQUFHLFFBQVE7UUFDckIsQ0FBQyxDQUFDLEVBQUUsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLFVBQVUsQ0FBQyxDQUFDLGtCQUFrQixJQUFJLEVBQUUsd0JBQXdCO1lBQ2xGLENBQUMsQ0FBQyxFQUFFLHVCQUFzQixDQUFDLGNBQWMsSUFBSSxDQUFDLEVBQUUsdUJBQXNCLENBQUMsY0FBYyxDQUFDLENBQUMsRUFBRTtRQUMvRixVQUFVLEVBQUUsQ0FBQztL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QUM1RCxxRkFBcUY7WUFDckYsa0VBQWtFO1lBQ2xFLEdBQUcsR0FBRyxDQUFDLENBQUM7U0FDVDthQUFNO1lBQ0wsR0FBRyxHQUFHLEVBQUUsQ0FBQztTQUNWO0tBQ0Y7SUFDRCxNQUFNLFNBQVMsQ0FBQyxDQUFDLENBQUMsY0FBYyxDQUFDLElBQUksRUFBRSxNQUFNLENBQUMsWUFBWSxDQUFDLGFBQWEsQ0FBQyxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUM7UUFDcEUsSUFBSSxLQUFLLEVBQUUsQ0FBQztBQUNoQyxDQUFDO0FBRUQsU0FBUyxjQUFjLENBQUMsSUFBWSxFQUFFLFNBQWlCLEVBQUUsS0FBYTtJQUNwRSxPQUFPLElBQUksS0FBSyxDQUNaLGdCQUFjLFNBQVMsc0JBQWlCLEtBQUssaUJBQWMsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxLQUFLLENBQUM7UUFDdEYsS0FBSyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxFQUFFLEtBQUssR0FBRyxDQUFDLENBQUMsR0FBRyxLQUFLLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFDLENBQUM7QUFDekYsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtDaGFyQ29kZX0gZnJvbSAnLi4vLi4vdXRpbC9jaGFyX2NvZGUnO1xuXG4vKipcbiAqIFJldHVybnMgaW5kZXggb2YgbmV4dCBub24td2hpdGVzcGFjZSBjaGFyYWN0ZXIuXG4gKlxuICogQHBhcmFtIHRleHQgVGV4dCB0byBzY2FuXG4gKiBAcGFyYW0gc3RhcnRJbmRleCBTdGFydGluZyBpbmRleCBvZiBjaGFyYWN0ZXIgd2hlcmUgdGhlIHNjYW4gc2hvdWxkIHN0YXJ0LlxuICogQHBhcmFtIGVuZEluZGV4IEVuZGluZyBpbmRleCBvZiBjaGFyYWN0ZXIgd2hlcmUgdGhlIHNjYW4gc2hvdWxkIGVuZC5cbiAqIEByZXR1cm5zIEluZGV4IG9mIG5leHQgbm9uLXdoaXRlc3BhY2UgY2hhcmFjdGVyIChNYXkgYmUgdGhlIHNhbWUgYXMgYHN0YXJ0YCBpZiBubyB3aGl0ZXNwYWNlIGF0XG4gKiAgICAgICAgICB0aGF0IGxvY2F0aW9uLilcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbnN1bWVXaGl0ZXNwYWNlKHRleHQ6IHN0cmluZywgc3RhcnRJbmRleDogbnVtYmVyLCBlbmRJbmRleDogbnVtYmVyKTogbnVtYmVyIHtcbiAgd2hpbGUgKHN0YXJ0SW5kZXggPCBlbmRJbmRleCAmJiB0ZXh0LmNoYXJDb2RlQXQoc3RhcnRJbmRleCkgPD0gQ2hhckNvZGUuU1BBQ0UpIHtcbiAgICBzdGFydEluZGV4Kys7XG4gIH1cbiAgcmV0dXJuIHN0YXJ0SW5kZXg7XG59XG5cbi8qKlxuICogUmV0dXJucyBpbmRleCBvZiBsYXN0IGNoYXIgaW4gY2xhc3MgdG9rZW4uXG4gKlxuICogQHBhcmFtIHRleHQgVGV4dCB0byBzY2FuXG4gKiBAcGFyYW0gc3RhcnRJbmRleCBTdGFydGluZyBpbmRleCBvZiBjaGFyYWN0ZXIgd2hlcmUgdGhlIHNjYW4gc2hvdWxkIHN0YXJ0LlxuICogQHBhcmFtIGVuZEluZGV4IEVuZGluZyBpbmRleCBvZiBjaGFyYWN0ZXIgd2hlcmUgdGhlIHNjYW4gc2hvdWxkIGVuZC5cbiAqIEByZXR1cm5zIEluZGV4IGFmdGVyIGxhc3QgY2hhciBpbiBjbGFzcyB0b2tlbi5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbnN1bWVDbGFzc1Rva2VuKHRleHQ6IHN0cmluZywgc3RhcnRJbmRleDogbnVtYmVyLCBlbmRJbmRleDogbnVtYmVyKTogbnVtYmVyIHtcbiAgd2hpbGUgKHN0YXJ0SW5kZXggPCBlbmRJbmRleCAmJiB0ZXh0LmNoYXJDb2RlQXQoc3RhcnRJbmRleCkgPiBDaGFyQ29kZS5TUEFDRSkge1xuICAgIHN0YXJ0SW5kZXgrKztcbiAgfVxuICByZXR1cm4gc3RhcnRJbmRleDtcbn1cblxuLyoqXG4gKiBDb25zdW1lcyBhbGwgb2YgdGhlIGNoYXJhY3RlcnMgYmVsb25naW5nIHRvIHN0eWxlIGtleSBhbmQgdG9rZW4uXG4gKlxuICogQHBhcmFtIHRleHQgVGV4dCB0byBzY2FuXG4gKiBAcGFyYW0gc3RhcnRJbmRleCBTdGFydGluZyBpbmRleCBvZiBjaGFyYWN0ZXIgd2hlcmUgdGhlIHNjYW4gc2hvdWxkIHN0YXJ0LlxuICogQHBhcmFtIGVuZEluZGV4IEVuZGluZyBpbmRleCBvZiBjaGFyYWN0ZXIgd2hlcmUgdGhlIHNjYW4gc2hvdWxkIGVuZC5cbiAqIEByZXR1cm5zIEluZGV4IGFmdGVyIGxhc3Qgc3R5bGUga2V5IGNoYXJhY3Rlci5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbnN1bWVTdHlsZUtleSh0ZXh0OiBzdHJpbmcsIHN0YXJ0SW5kZXg6IG51bWJlciwgZW5kSW5kZXg6IG51bWJlcik6IG51bWJlciB7XG4gIGxldCBjaDogbnVtYmVyO1xuICB3aGlsZSAoc3RhcnRJbmRleCA8IGVuZEluZGV4ICYmXG4gICAgICAgICAoKGNoID0gdGV4dC5jaGFyQ29kZUF0KHN0YXJ0SW5kZXgpKSA9PT0gQ2hhckNvZGUuREFTSCB8fCBjaCA9PT0gQ2hhckNvZGUuVU5ERVJTQ09SRSB8fFxuICAgICAgICAgICgoY2ggJiBDaGFyQ29kZS5VUFBFUl9DQVNFKSA+PSBDaGFyQ29kZS5BICYmIChjaCAmIENoYXJDb2RlLlVQUEVSX0NBU0UpIDw9IENoYXJDb2RlLlopKSkge1xuICAgIHN0YXJ0SW5kZXgrKztcbiAgfVxuICByZXR1cm4gc3RhcnRJbmRleDtcbn1cblxuLyoqXG4gKiBDb25zdW1lcyBhbGwgd2hpdGVzcGFjZSBhbmQgdGhlIHNlcGFyYXRvciBgOmAgYWZ0ZXIgdGhlIHN0eWxlIGtleS5cbiAqXG4gKiBAcGFyYW0gdGV4dCBUZXh0IHRvIHNjYW5cbiAqIEBwYXJhbSBzdGFydEluZGV4IFN0YXJ0aW5nIGluZGV4IG9mIGNoYXJhY3RlciB3aGVyZSB0aGUgc2NhbiBzaG91bGQgc3RhcnQuXG4gKiBAcGFyYW0gZW5kSW5kZXggRW5kaW5nIGluZGV4IG9mIGNoYXJhY3RlciB3aGVyZSB0aGUgc2NhbiBzaG91bGQgZW5kLlxuICogQHJldHVybnMgSW5kZXggYWZ0ZXIgc2VwYXJhdG9yIGFuZCBzdXJyb3VuZGluZyB3aGl0ZXNwYWNlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY29uc3VtZVNlcGFyYXRvcihcbiAgICB0ZXh0OiBzdHJpbmcsIHN0YXJ0SW5kZXg6IG51bWJlciwgZW5kSW5kZXg6IG51bWJlciwgc2VwYXJhdG9yOiBudW1iZXIpOiBudW1iZXIge1xuICBzdGFydEluZGV4ID0gY29uc3VtZVdoaXRlc3BhY2UodGV4dCwgc3RhcnRJbmRleCwgZW5kSW5kZXgpO1xuICBpZiAoc3RhcnRJbmRleCA8IGVuZEluZGV4KSB7XG4gICAgaWYgKG5nRGV2TW9kZSAmJiB0ZXh0LmNoYXJDb2RlQXQoc3RhcnRJbmRleCkgIT09IHNlcGFyYXRvcikge1xuICAgICAgdGhyb3cgZXhwZWN0aW5nRXJyb3IodGV4dCwgU3RyaW5nLmZyb21DaGFyQ29kZShzZXBhcmF0b3IpLCBzdGFydEluZGV4KTtcbiAgICB9XG4gICAgc3RhcnRJbmRleCsrO1xuICB9XG4gIHN0YXJ0SW5kZXggPSBjb25zdW1lV2hpdGVzcGFjZSh0ZXh0LCBzdGFydEluZGV4LCBlbmRJbmRleCk7XG4gIHJldHVybiBzdGFydEluZGV4O1xufVxuXG5cbi8qKlxuICogQ29uc3VtZXMgc3R5bGUgdmFsdWUgaG9ub3JpbmcgYHVybCgpYCBhbmQgYFwiXCJgIHRleHQuXG4gKlxuICogQHBhcmFtIHRleHQgVGV4dCB0byBzY2FuXG4gKiBAcGFyYW0gc3RhcnRJbmRleCBTdGFydGluZyBpbmRleCBvZiBjaGFyYWN0ZXIgd2hlcmUgdGhlIHNjYW4gc2hvdWxkIHN0YXJ0LlxuICogQHBhcmFtIGVuZEluZGV4IEVuZGluZyBpbmRleCBvZiBjaGFyYWN0ZXIgd2hlcmUgdGhlIHNjYW4gc2hvdWxkIGVuZC5cbiAqIEByZXR1cm5zIEluZGV4IGFmdGVyIGxhc3Qgc3R5bGUgdmFsdWUgY2hhcmFjdGVyLlxuKi9cbmV4cG9ydCBmdW5jdGlvbiBjb25zdW1lU3R5bGVWYWx1ZSh0ZXh0OiBzdHJpbmcsIHN0YXJ0SW5kZXg6IG51bWJlciwgZW5kSW5kZXg6IG51bWJlcik6IG51bWJlciB7XG4gIGxldCBjaDEgPSAtMTsgIC8vIDFzdCBwcmV2aW91cyBjaGFyYWN0ZXJcbiAgbGV0IGNoMiA9IC0xOyAgLy8gMm5kIHByZXZpb3VzIGNoYXJhY3RlclxuICBsZXQgY2gzID0gLTE7ICAvLyAzcmQgcHJldmlvdXMgY2hhcmFjdGVyXG4gIGxldCBpID0gc3RhcnRJbmRleDtcbiAgbGV0IGxhc3RDaEluZGV4ID0gaTtcbiAgd2hpbGUgKGkgPCBlbmRJbmRleCkge1xuICAgIGNvbnN0IGNoOiBudW1iZXIgPSB0ZXh0LmNoYXJDb2RlQXQoaSsrKTtcbiAgICBpZiAoY2ggPT09IENoYXJDb2RlLlNFTUlfQ09MT04pIHtcbiAgICAgIHJldHVybiBsYXN0Q2hJbmRleDtcbiAgICB9IGVsc2UgaWYgKGNoID09PSBDaGFyQ29kZS5ET1VCTEVfUVVPVEUgfHwgY2ggPT09IENoYXJDb2RlLlNJTkdMRV9RVU9URSkge1xuICAgICAgbGFzdENoSW5kZXggPSBpID0gY29uc3VtZVF1b3RlZFRleHQodGV4dCwgY2gsIGksIGVuZEluZGV4KTtcbiAgICB9IGVsc2UgaWYgKFxuICAgICAgICBzdGFydEluZGV4ID09PVxuICAgICAgICAgICAgaSAtIDQgJiYgIC8vIFdlIGhhdmUgc2VlbiBvbmx5IDQgY2hhcmFjdGVycyBzbyBmYXIgXCJVUkwoXCIgKElnbm9yZSBcImZvb19VUkwoKVwiKVxuICAgICAgICBjaDMgPT09IENoYXJDb2RlLlUgJiZcbiAgICAgICAgY2gyID09PSBDaGFyQ29kZS5SICYmIGNoMSA9PT0gQ2hhckNvZGUuTCAmJiBjaCA9PT0gQ2hhckNvZGUuT1BFTl9QQVJFTikge1xuICAgICAgbGFzdENoSW5kZXggPSBpID0gY29uc3VtZVF1b3RlZFRleHQodGV4dCwgQ2hhckNvZGUuQ0xPU0VfUEFSRU4sIGksIGVuZEluZGV4KTtcbiAgICB9IGVsc2UgaWYgKGNoID4gQ2hhckNvZGUuU1BBQ0UpIHtcbiAgICAgIC8vIGlmIHdlIGhhdmUgYSBub24td2hpdGVzcGFjZSBjaGFyYWN0ZXIgdGhlbiBjYXB0dXJlIGl0cyBsb2NhdGlvblxuICAgICAgbGFzdENoSW5kZXggPSBpO1xuICAgIH1cbiAgICBjaDMgPSBjaDI7XG4gICAgY2gyID0gY2gxO1xuICAgIGNoMSA9IGNoICYgQ2hhckNvZGUuVVBQRVJfQ0FTRTtcbiAgfVxuICByZXR1cm4gbGFzdENoSW5kZXg7XG59XG5cbi8qKlxuICogQ29uc3VtZXMgYWxsIG9mIHRoZSBxdW90ZWQgY2hhcmFjdGVycy5cbiAqXG4gKiBAcGFyYW0gdGV4dCBUZXh0IHRvIHNjYW5cbiAqIEBwYXJhbSBxdW90ZUNoYXJDb2RlIENoYXJDb2RlIG9mIGVpdGhlciBgXCJgIG9yIGAnYCBxdW90ZSBvciBgKWAgZm9yIGB1cmwoLi4uKWAuXG4gKiBAcGFyYW0gc3RhcnRJbmRleCBTdGFydGluZyBpbmRleCBvZiBjaGFyYWN0ZXIgd2hlcmUgdGhlIHNjYW4gc2hvdWxkIHN0YXJ0LlxuICogQHBhcmFtIGVuZEluZGV4IEVuZGluZyBpbmRleCBvZiBjaGFyYWN0ZXIgd2hlcmUgdGhlIHNjYW4gc2hvdWxkIGVuZC5cbiAqIEByZXR1cm5zIEluZGV4IGFmdGVyIHF1b3RlZCBjaGFyYWN0ZXJzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY29uc3VtZVF1b3RlZFRleHQoXG4gICAgdGV4dDogc3RyaW5nLCBxdW90ZUNoYXJDb2RlOiBudW1iZXIsIHN0YXJ0SW5kZXg6IG51bWJlciwgZW5kSW5kZXg6IG51bWJlcik6IG51bWJlciB7XG4gIGxldCBjaDEgPSAtMTsgIC8vIDFzdCBwcmV2aW91cyBjaGFyYWN0ZXJcbiAgbGV0IGluZGV4ID0gc3RhcnRJbmRleDtcbiAgd2hpbGUgKGluZGV4IDwgZW5kSW5kZXgpIHtcbiAgICBjb25zdCBjaCA9IHRleHQuY2hhckNvZGVBdChpbmRleCsrKTtcbiAgICBpZiAoY2ggPT0gcXVvdGVDaGFyQ29kZSAmJiBjaDEgIT09IENoYXJDb2RlLkJBQ0tfU0xBU0gpIHtcbiAgICAgIHJldHVybiBpbmRleDtcbiAgICB9XG4gICAgaWYgKGNoID09IENoYXJDb2RlLkJBQ0tfU0xBU0ggJiYgY2gxID09PSBDaGFyQ29kZS5CQUNLX1NMQVNIKSB7XG4gICAgICAvLyB0d28gYmFjayBzbGFzaGVzIGNhbmNlbCBlYWNoIG90aGVyIG91dC4gRm9yIGV4YW1wbGUgYFwiXFxcXFwiYCBzaG91bGQgcHJvcGVybHkgZW5kIHRoZVxuICAgICAgLy8gcXVvdGF0aW9uLiAoSXQgc2hvdWxkIG5vdCBhc3N1bWUgdGhhdCB0aGUgbGFzdCBgXCJgIGlzIGVzY2FwZWQuKVxuICAgICAgY2gxID0gMDtcbiAgICB9IGVsc2Uge1xuICAgICAgY2gxID0gY2g7XG4gICAgfVxuICB9XG4gIHRocm93IG5nRGV2TW9kZSA/IGV4cGVjdGluZ0Vycm9yKHRleHQsIFN0cmluZy5mcm9tQ2hhckNvZGUocXVvdGVDaGFyQ29kZSksIGVuZEluZGV4KSA6XG4gICAgICAgICAgICAgICAgICAgIG5ldyBFcnJvcigpO1xufVxuXG5mdW5jdGlvbiBleHBlY3RpbmdFcnJvcih0ZXh0OiBzdHJpbmcsIGV4cGVjdGluZzogc3RyaW5nLCBpbmRleDogbnVtYmVyKSB7XG4gIHJldHVybiBuZXcgRXJyb3IoXG4gICAgICBgRXhwZWN0aW5nICcke2V4cGVjdGluZ30nIGF0IGxvY2F0aW9uICR7aW5kZXh9IGluIHN0cmluZyAnYCArIHRleHQuc3Vic3RyaW5nKDAsIGluZGV4KSArXG4gICAgICAnWz4+JyArIHRleHQuc3Vic3RyaW5nKGluZGV4LCBpbmRleCArIDEpICsgJzw8XScgKyB0ZXh0LnN1YnN0cihpbmRleCArIDEpICsgJ1xcJy4nKTtcbn0iXX0=