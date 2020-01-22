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
 * Stores the locations of key/value indexes while parsing styling.
 *
 * In case of `cssText` parsing the indexes are like so:
 * ```
 *   "key1: value1; key2: value2; key3: value3"
 *                  ^   ^ ^     ^             ^
 *                  |   | |     |             +-- textEnd
 *                  |   | |     +---------------- valueEnd
 *                  |   | +---------------------- value
 *                  |   +------------------------ keyEnd
 *                  +---------------------------- key
 * ```
 *
 * In case of `className` parsing the indexes are like so:
 * ```
 *   "key1 key2 key3"
 *         ^   ^    ^
 *         |   |    +-- textEnd
 *         |   +------------------------ keyEnd
 *         +---------------------------- key
 * ```
 * NOTE: `value` and `valueEnd` are used only for styles, not classes.
 * @record
 */
function ParserState() { }
if (false) {
    /** @type {?} */
    ParserState.prototype.textEnd;
    /** @type {?} */
    ParserState.prototype.key;
    /** @type {?} */
    ParserState.prototype.keyEnd;
    /** @type {?} */
    ParserState.prototype.value;
    /** @type {?} */
    ParserState.prototype.valueEnd;
}
// Global state of the parser. (This makes parser non-reentrant, but that is not an issue)
/** @type {?} */
const parserState = {
    textEnd: 0,
    key: 0,
    keyEnd: 0,
    value: 0,
    valueEnd: 0,
};
/**
 * Retrieves the last parsed `key` of style.
 * @param {?} text the text to substring the key from.
 * @return {?}
 */
export function getLastParsedKey(text) {
    return text.substring(parserState.key, parserState.keyEnd);
}
/**
 * Retrieves the last parsed `value` of style.
 * @param {?} text the text to substring the key from.
 * @return {?}
 */
export function getLastParsedValue(text) {
    return text.substring(parserState.value, parserState.valueEnd);
}
/**
 * Initializes `className` string for parsing and parses the first token.
 *
 * This function is intended to be used in this format:
 * ```
 * for (let i = parseClassName(text); i >= 0; i = parseClassNameNext(text, i))) {
 *   const key = getLastParsedKey();
 *   ...
 * }
 * ```
 * @param {?} text `className` to parse
 * @return {?} index where the next invocation of `parseClassNameNext` should resume.
 */
export function parseClassName(text) {
    resetParserState(text);
    return parseClassNameNext(text, consumeWhitespace(text, 0, parserState.textEnd));
}
/**
 * Parses next `className` token.
 *
 * This function is intended to be used in this format:
 * ```
 * for (let i = parseClassName(text); i >= 0; i = parseClassNameNext(text, i))) {
 *   const key = getLastParsedKey();
 *   ...
 * }
 * ```
 *
 * @param {?} text `className` to parse
 * @param {?} index where the parsing should resume.
 * @return {?} index where the next invocation of `parseClassNameNext` should resume.
 */
export function parseClassNameNext(text, index) {
    /** @type {?} */
    const end = parserState.textEnd;
    if (end === index) {
        return -1;
    }
    index = parserState.keyEnd = consumeClassToken(text, parserState.key = index, end);
    return consumeWhitespace(text, index, end);
}
/**
 * Initializes `cssText` string for parsing and parses the first key/values.
 *
 * This function is intended to be used in this format:
 * ```
 * for (let i = parseStyle(text); i >= 0; i = parseStyleNext(text, i))) {
 *   const key = getLastParsedKey();
 *   const value = getLastParsedValue();
 *   ...
 * }
 * ```
 * @param {?} text `cssText` to parse
 * @return {?} index where the next invocation of `parseStyleNext` should resume.
 */
export function parseStyle(text) {
    resetParserState(text);
    return parseStyleNext(text, consumeWhitespace(text, 0, parserState.textEnd));
}
/**
 * Parses the next `cssText` key/values.
 *
 * This function is intended to be used in this format:
 * ```
 * for (let i = parseStyle(text); i >= 0; i = parseStyleNext(text, i))) {
 *   const key = getLastParsedKey();
 *   const value = getLastParsedValue();
 *   ...
 * }
 *
 * @param {?} text `cssText` to parse
 * @param {?} startIndex
 * @return {?} index where the next invocation of `parseStyleNext` should resume.
 */
export function parseStyleNext(text, startIndex) {
    /** @type {?} */
    const end = parserState.textEnd;
    if (end === startIndex) {
        // we reached an end so just quit
        return -1;
    }
    /** @type {?} */
    let index = parserState.keyEnd = consumeStyleKey(text, parserState.key = startIndex, end);
    index = parserState.value = consumeSeparatorWithWhitespace(text, index, end, 58 /* COLON */);
    index = parserState.valueEnd = consumeStyleValue(text, index, end);
    if (ngDevMode && parserState.value === parserState.valueEnd) {
        throw malformedStyleError(text, index);
    }
    return consumeSeparatorWithWhitespace(text, index, end, 59 /* SEMI_COLON */);
}
/**
 * Reset the global state of the styling parser.
 * @param {?} text The styling text to parse.
 * @return {?}
 */
export function resetParserState(text) {
    parserState.key = 0;
    parserState.keyEnd = 0;
    parserState.value = 0;
    parserState.valueEnd = 0;
    parserState.textEnd = text.length;
}
/**
 * Retrieves tha `valueEnd` from the parser global state.
 *
 * See: `ParserState`.
 * @return {?}
 */
export function getLastParsedValueEnd() {
    return parserState.valueEnd;
}
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
export function consumeSeparatorWithWhitespace(text, startIndex, endIndex, separator) {
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
/**
 * @param {?} text
 * @param {?} index
 * @return {?}
 */
function malformedStyleError(text, index) {
    return new Error(`Malformed style at location ${index} in string '` + text.substring(0, index) + '[>>' +
        text.substring(index, index + 1) + '<<]' + text.substr(index + 1) + '\'.');
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3R5bGluZ19wYXJzZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL3N0eWxpbmcvc3R5bGluZ19wYXJzZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQWtDQSwwQkFNQzs7O0lBTEMsOEJBQWdCOztJQUNoQiwwQkFBWTs7SUFDWiw2QkFBZTs7SUFDZiw0QkFBYzs7SUFDZCwrQkFBaUI7Ozs7TUFHYixXQUFXLEdBQWdCO0lBQy9CLE9BQU8sRUFBRSxDQUFDO0lBQ1YsR0FBRyxFQUFFLENBQUM7SUFDTixNQUFNLEVBQUUsQ0FBQztJQUNULEtBQUssRUFBRSxDQUFDO0lBQ1IsUUFBUSxFQUFFLENBQUM7Q0FDWjs7Ozs7O0FBTUQsTUFBTSxVQUFVLGdCQUFnQixDQUFDLElBQVk7SUFDM0MsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDLFdBQVcsQ0FBQyxHQUFHLEVBQUUsV0FBVyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQzdELENBQUM7Ozs7OztBQU1ELE1BQU0sVUFBVSxrQkFBa0IsQ0FBQyxJQUFZO0lBQzdDLE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQyxXQUFXLENBQUMsS0FBSyxFQUFFLFdBQVcsQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUNqRSxDQUFDOzs7Ozs7Ozs7Ozs7OztBQWVELE1BQU0sVUFBVSxjQUFjLENBQUMsSUFBWTtJQUN6QyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUN2QixPQUFPLGtCQUFrQixDQUFDLElBQUksRUFBRSxpQkFBaUIsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxFQUFFLFdBQVcsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO0FBQ25GLENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7QUFpQkQsTUFBTSxVQUFVLGtCQUFrQixDQUFDLElBQVksRUFBRSxLQUFhOztVQUN0RCxHQUFHLEdBQUcsV0FBVyxDQUFDLE9BQU87SUFDL0IsSUFBSSxHQUFHLEtBQUssS0FBSyxFQUFFO1FBQ2pCLE9BQU8sQ0FBQyxDQUFDLENBQUM7S0FDWDtJQUNELEtBQUssR0FBRyxXQUFXLENBQUMsTUFBTSxHQUFHLGlCQUFpQixDQUFDLElBQUksRUFBRSxXQUFXLENBQUMsR0FBRyxHQUFHLEtBQUssRUFBRSxHQUFHLENBQUMsQ0FBQztJQUNuRixPQUFPLGlCQUFpQixDQUFDLElBQUksRUFBRSxLQUFLLEVBQUUsR0FBRyxDQUFDLENBQUM7QUFDN0MsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7O0FBZ0JELE1BQU0sVUFBVSxVQUFVLENBQUMsSUFBWTtJQUNyQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUN2QixPQUFPLGNBQWMsQ0FBQyxJQUFJLEVBQUUsaUJBQWlCLENBQUMsSUFBSSxFQUFFLENBQUMsRUFBRSxXQUFXLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztBQUMvRSxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7O0FBaUJELE1BQU0sVUFBVSxjQUFjLENBQUMsSUFBWSxFQUFFLFVBQWtCOztVQUN2RCxHQUFHLEdBQUcsV0FBVyxDQUFDLE9BQU87SUFDL0IsSUFBSSxHQUFHLEtBQUssVUFBVSxFQUFFO1FBQ3RCLGlDQUFpQztRQUNqQyxPQUFPLENBQUMsQ0FBQyxDQUFDO0tBQ1g7O1FBQ0csS0FBSyxHQUFHLFdBQVcsQ0FBQyxNQUFNLEdBQUcsZUFBZSxDQUFDLElBQUksRUFBRSxXQUFXLENBQUMsR0FBRyxHQUFHLFVBQVUsRUFBRSxHQUFHLENBQUM7SUFDekYsS0FBSyxHQUFHLFdBQVcsQ0FBQyxLQUFLLEdBQUcsOEJBQThCLENBQUMsSUFBSSxFQUFFLEtBQUssRUFBRSxHQUFHLGlCQUFpQixDQUFDO0lBQzdGLEtBQUssR0FBRyxXQUFXLENBQUMsUUFBUSxHQUFHLGlCQUFpQixDQUFDLElBQUksRUFBRSxLQUFLLEVBQUUsR0FBRyxDQUFDLENBQUM7SUFDbkUsSUFBSSxTQUFTLElBQUksV0FBVyxDQUFDLEtBQUssS0FBSyxXQUFXLENBQUMsUUFBUSxFQUFFO1FBQzNELE1BQU0sbUJBQW1CLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDO0tBQ3hDO0lBQ0QsT0FBTyw4QkFBOEIsQ0FBQyxJQUFJLEVBQUUsS0FBSyxFQUFFLEdBQUcsc0JBQXNCLENBQUM7QUFDL0UsQ0FBQzs7Ozs7O0FBTUQsTUFBTSxVQUFVLGdCQUFnQixDQUFDLElBQVk7SUFDM0MsV0FBVyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUM7SUFDcEIsV0FBVyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUM7SUFDdkIsV0FBVyxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUM7SUFDdEIsV0FBVyxDQUFDLFFBQVEsR0FBRyxDQUFDLENBQUM7SUFDekIsV0FBVyxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDO0FBQ3BDLENBQUM7Ozs7Ozs7QUFPRCxNQUFNLFVBQVUscUJBQXFCO0lBQ25DLE9BQU8sV0FBVyxDQUFDLFFBQVEsQ0FBQztBQUM5QixDQUFDOzs7Ozs7Ozs7O0FBV0QsTUFBTSxVQUFVLGlCQUFpQixDQUFDLElBQVksRUFBRSxVQUFrQixFQUFFLFFBQWdCO0lBQ2xGLE9BQU8sVUFBVSxHQUFHLFFBQVEsSUFBSSxJQUFJLENBQUMsVUFBVSxDQUFDLFVBQVUsQ0FBQyxrQkFBa0IsRUFBRTtRQUM3RSxVQUFVLEVBQUUsQ0FBQztLQUNkO0lBQ0QsT0FBTyxVQUFVLENBQUM7QUFDcEIsQ0FBQzs7Ozs7Ozs7O0FBVUQsTUFBTSxVQUFVLGlCQUFpQixDQUFDLElBQVksRUFBRSxVQUFrQixFQUFFLFFBQWdCO0lBQ2xGLE9BQU8sVUFBVSxHQUFHLFFBQVEsSUFBSSxJQUFJLENBQUMsVUFBVSxDQUFDLFVBQVUsQ0FBQyxpQkFBaUIsRUFBRTtRQUM1RSxVQUFVLEVBQUUsQ0FBQztLQUNkO0lBQ0QsT0FBTyxVQUFVLENBQUM7QUFDcEIsQ0FBQzs7Ozs7Ozs7O0FBVUQsTUFBTSxVQUFVLGVBQWUsQ0FBQyxJQUFZLEVBQUUsVUFBa0IsRUFBRSxRQUFnQjs7UUFDNUUsRUFBVTtJQUNkLE9BQU8sVUFBVSxHQUFHLFFBQVE7UUFDckIsQ0FBQyxDQUFDLEVBQUUsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLFVBQVUsQ0FBQyxDQUFDLGtCQUFrQixJQUFJLEVBQUUsd0JBQXdCO1lBQ2xGLENBQUMsQ0FBQyxFQUFFLHVCQUFzQixDQUFDLGNBQWMsSUFBSSxDQUFDLEVBQUUsdUJBQXNCLENBQUMsY0FBYyxDQUFDLENBQUMsRUFBRTtRQUMvRixVQUFVLEVBQUUsQ0FBQztLQUNkO0lBQ0QsT0FBTyxVQUFVLENBQUM7QUFDcEIsQ0FBQzs7Ozs7Ozs7OztBQVVELE1BQU0sVUFBVSw4QkFBOEIsQ0FDMUMsSUFBWSxFQUFFLFVBQWtCLEVBQUUsUUFBZ0IsRUFBRSxTQUFpQjtJQUN2RSxVQUFVLEdBQUcsaUJBQWlCLENBQUMsSUFBSSxFQUFFLFVBQVUsRUFBRSxRQUFRLENBQUMsQ0FBQztJQUMzRCxJQUFJLFVBQVUsR0FBRyxRQUFRLEVBQUU7UUFDekIsSUFBSSxTQUFTLElBQUksSUFBSSxDQUFDLFVBQVUsQ0FBQyxVQUFVLENBQUMsS0FBSyxTQUFTLEVBQUU7WUFDMUQsTUFBTSxjQUFjLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxZQUFZLENBQUMsU0FBUyxDQUFDLEVBQUUsVUFBVSxDQUFDLENBQUM7U0FDeEU7UUFDRCxVQUFVLEVBQUUsQ0FBQztLQUNkO0lBQ0QsVUFBVSxHQUFHLGlCQUFpQixDQUFDLElBQUksRUFBRSxVQUFVLEVBQUUsUUFBUSxDQUFDLENBQUM7SUFDM0QsT0FBTyxVQUFVLENBQUM7QUFDcEIsQ0FBQzs7Ozs7Ozs7O0FBV0QsTUFBTSxVQUFVLGlCQUFpQixDQUFDLElBQVksRUFBRSxVQUFrQixFQUFFLFFBQWdCOztRQUM5RSxHQUFHLEdBQUcsQ0FBQyxDQUFDOzs7UUFDUixHQUFHLEdBQUcsQ0FBQyxDQUFDOzs7UUFDUixHQUFHLEdBQUcsQ0FBQyxDQUFDOzs7UUFDUixDQUFDLEdBQUcsVUFBVTs7UUFDZCxXQUFXLEdBQUcsQ0FBQztJQUNuQixPQUFPLENBQUMsR0FBRyxRQUFRLEVBQUU7O2NBQ2IsRUFBRSxHQUFXLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxFQUFFLENBQUM7UUFDdkMsSUFBSSxFQUFFLHdCQUF3QixFQUFFO1lBQzlCLE9BQU8sV0FBVyxDQUFDO1NBQ3BCO2FBQU0sSUFBSSxFQUFFLDBCQUEwQixJQUFJLEVBQUUsMEJBQTBCLEVBQUU7WUFDdkUsV0FBVyxHQUFHLENBQUMsR0FBRyxpQkFBaUIsQ0FBQyxJQUFJLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxRQUFRLENBQUMsQ0FBQztTQUM1RDthQUFNLElBQ0gsVUFBVTtZQUNOLENBQUMsR0FBRyxDQUFDLElBQUssb0VBQW9FO1lBQ2xGLEdBQUcsZUFBZTtZQUNsQixHQUFHLGVBQWUsSUFBSSxHQUFHLGVBQWUsSUFBSSxFQUFFLHdCQUF3QixFQUFFO1lBQzFFLFdBQVcsR0FBRyxDQUFDLEdBQUcsaUJBQWlCLENBQUMsSUFBSSx3QkFBd0IsQ0FBQyxFQUFFLFFBQVEsQ0FBQyxDQUFDO1NBQzlFO2FBQU0sSUFBSSxFQUFFLGlCQUFpQixFQUFFO1lBQzlCLGtFQUFrRTtZQUNsRSxXQUFXLEdBQUcsQ0FBQyxDQUFDO1NBQ2pCO1FBQ0QsR0FBRyxHQUFHLEdBQUcsQ0FBQztRQUNWLEdBQUcsR0FBRyxHQUFHLENBQUM7UUFDVixHQUFHLEdBQUcsRUFBRSx1QkFBc0IsQ0FBQztLQUNoQztJQUNELE9BQU8sV0FBVyxDQUFDO0FBQ3JCLENBQUM7Ozs7Ozs7Ozs7QUFXRCxNQUFNLFVBQVUsaUJBQWlCLENBQzdCLElBQVksRUFBRSxhQUFxQixFQUFFLFVBQWtCLEVBQUUsUUFBZ0I7O1FBQ3ZFLEdBQUcsR0FBRyxDQUFDLENBQUM7OztRQUNSLEtBQUssR0FBRyxVQUFVO0lBQ3RCLE9BQU8sS0FBSyxHQUFHLFFBQVEsRUFBRTs7Y0FDakIsRUFBRSxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDbkMsSUFBSSxFQUFFLElBQUksYUFBYSxJQUFJLEdBQUcsd0JBQXdCLEVBQUU7WUFDdEQsT0FBTyxLQUFLLENBQUM7U0FDZDtRQUNELElBQUksRUFBRSx1QkFBdUIsSUFBSSxHQUFHLHdCQUF3QixFQUFFO1lBQzVELHFGQUFxRjtZQUNyRixrRUFBa0U7WUFDbEUsR0FBRyxHQUFHLENBQUMsQ0FBQztTQUNUO2FBQU07WUFDTCxHQUFHLEdBQUcsRUFBRSxDQUFDO1NBQ1Y7S0FDRjtJQUNELE1BQU0sU0FBUyxDQUFDLENBQUMsQ0FBQyxjQUFjLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxZQUFZLENBQUMsYUFBYSxDQUFDLEVBQUUsUUFBUSxDQUFDLENBQUMsQ0FBQztRQUNwRSxJQUFJLEtBQUssRUFBRSxDQUFDO0FBQ2hDLENBQUM7Ozs7Ozs7QUFFRCxTQUFTLGNBQWMsQ0FBQyxJQUFZLEVBQUUsU0FBaUIsRUFBRSxLQUFhO0lBQ3BFLE9BQU8sSUFBSSxLQUFLLENBQ1osY0FBYyxTQUFTLGlCQUFpQixLQUFLLGNBQWMsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxLQUFLLENBQUM7UUFDdEYsS0FBSyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxFQUFFLEtBQUssR0FBRyxDQUFDLENBQUMsR0FBRyxLQUFLLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFDLENBQUM7QUFDekYsQ0FBQzs7Ozs7O0FBRUQsU0FBUyxtQkFBbUIsQ0FBQyxJQUFZLEVBQUUsS0FBYTtJQUN0RCxPQUFPLElBQUksS0FBSyxDQUNaLCtCQUErQixLQUFLLGNBQWMsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxLQUFLLENBQUMsR0FBRyxLQUFLO1FBQ3JGLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxFQUFFLEtBQUssR0FBRyxDQUFDLENBQUMsR0FBRyxLQUFLLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFDLENBQUM7QUFDakYsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtDaGFyQ29kZX0gZnJvbSAnLi4vLi4vdXRpbC9jaGFyX2NvZGUnO1xuXG4vKipcbiAqIFN0b3JlcyB0aGUgbG9jYXRpb25zIG9mIGtleS92YWx1ZSBpbmRleGVzIHdoaWxlIHBhcnNpbmcgc3R5bGluZy5cbiAqXG4gKiBJbiBjYXNlIG9mIGBjc3NUZXh0YCBwYXJzaW5nIHRoZSBpbmRleGVzIGFyZSBsaWtlIHNvOlxuICogYGBgXG4gKiAgIFwia2V5MTogdmFsdWUxOyBrZXkyOiB2YWx1ZTI7IGtleTM6IHZhbHVlM1wiXG4gKiAgICAgICAgICAgICAgICAgIF4gICBeIF4gICAgIF4gICAgICAgICAgICAgXlxuICogICAgICAgICAgICAgICAgICB8ICAgfCB8ICAgICB8ICAgICAgICAgICAgICstLSB0ZXh0RW5kXG4gKiAgICAgICAgICAgICAgICAgIHwgICB8IHwgICAgICstLS0tLS0tLS0tLS0tLS0tIHZhbHVlRW5kXG4gKiAgICAgICAgICAgICAgICAgIHwgICB8ICstLS0tLS0tLS0tLS0tLS0tLS0tLS0tIHZhbHVlXG4gKiAgICAgICAgICAgICAgICAgIHwgICArLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGtleUVuZFxuICogICAgICAgICAgICAgICAgICArLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBrZXlcbiAqIGBgYFxuICpcbiAqIEluIGNhc2Ugb2YgYGNsYXNzTmFtZWAgcGFyc2luZyB0aGUgaW5kZXhlcyBhcmUgbGlrZSBzbzpcbiAqIGBgYFxuICogICBcImtleTEga2V5MiBrZXkzXCJcbiAqICAgICAgICAgXiAgIF4gICAgXlxuICogICAgICAgICB8ICAgfCAgICArLS0gdGV4dEVuZFxuICogICAgICAgICB8ICAgKy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBrZXlFbmRcbiAqICAgICAgICAgKy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0ga2V5XG4gKiBgYGBcbiAqIE5PVEU6IGB2YWx1ZWAgYW5kIGB2YWx1ZUVuZGAgYXJlIHVzZWQgb25seSBmb3Igc3R5bGVzLCBub3QgY2xhc3Nlcy5cbiAqL1xuaW50ZXJmYWNlIFBhcnNlclN0YXRlIHtcbiAgdGV4dEVuZDogbnVtYmVyO1xuICBrZXk6IG51bWJlcjtcbiAga2V5RW5kOiBudW1iZXI7XG4gIHZhbHVlOiBudW1iZXI7XG4gIHZhbHVlRW5kOiBudW1iZXI7XG59XG4vLyBHbG9iYWwgc3RhdGUgb2YgdGhlIHBhcnNlci4gKFRoaXMgbWFrZXMgcGFyc2VyIG5vbi1yZWVudHJhbnQsIGJ1dCB0aGF0IGlzIG5vdCBhbiBpc3N1ZSlcbmNvbnN0IHBhcnNlclN0YXRlOiBQYXJzZXJTdGF0ZSA9IHtcbiAgdGV4dEVuZDogMCxcbiAga2V5OiAwLFxuICBrZXlFbmQ6IDAsXG4gIHZhbHVlOiAwLFxuICB2YWx1ZUVuZDogMCxcbn07XG5cbi8qKlxuICogUmV0cmlldmVzIHRoZSBsYXN0IHBhcnNlZCBga2V5YCBvZiBzdHlsZS5cbiAqIEBwYXJhbSB0ZXh0IHRoZSB0ZXh0IHRvIHN1YnN0cmluZyB0aGUga2V5IGZyb20uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRMYXN0UGFyc2VkS2V5KHRleHQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiB0ZXh0LnN1YnN0cmluZyhwYXJzZXJTdGF0ZS5rZXksIHBhcnNlclN0YXRlLmtleUVuZCk7XG59XG5cbi8qKlxuICogUmV0cmlldmVzIHRoZSBsYXN0IHBhcnNlZCBgdmFsdWVgIG9mIHN0eWxlLlxuICogQHBhcmFtIHRleHQgdGhlIHRleHQgdG8gc3Vic3RyaW5nIHRoZSBrZXkgZnJvbS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldExhc3RQYXJzZWRWYWx1ZSh0ZXh0OiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gdGV4dC5zdWJzdHJpbmcocGFyc2VyU3RhdGUudmFsdWUsIHBhcnNlclN0YXRlLnZhbHVlRW5kKTtcbn1cblxuLyoqXG4gKiBJbml0aWFsaXplcyBgY2xhc3NOYW1lYCBzdHJpbmcgZm9yIHBhcnNpbmcgYW5kIHBhcnNlcyB0aGUgZmlyc3QgdG9rZW4uXG4gKlxuICogVGhpcyBmdW5jdGlvbiBpcyBpbnRlbmRlZCB0byBiZSB1c2VkIGluIHRoaXMgZm9ybWF0OlxuICogYGBgXG4gKiBmb3IgKGxldCBpID0gcGFyc2VDbGFzc05hbWUodGV4dCk7IGkgPj0gMDsgaSA9IHBhcnNlQ2xhc3NOYW1lTmV4dCh0ZXh0LCBpKSkpIHtcbiAqICAgY29uc3Qga2V5ID0gZ2V0TGFzdFBhcnNlZEtleSgpO1xuICogICAuLi5cbiAqIH1cbiAqIGBgYFxuICogQHBhcmFtIHRleHQgYGNsYXNzTmFtZWAgdG8gcGFyc2VcbiAqIEByZXR1cm5zIGluZGV4IHdoZXJlIHRoZSBuZXh0IGludm9jYXRpb24gb2YgYHBhcnNlQ2xhc3NOYW1lTmV4dGAgc2hvdWxkIHJlc3VtZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlQ2xhc3NOYW1lKHRleHQ6IHN0cmluZyk6IG51bWJlciB7XG4gIHJlc2V0UGFyc2VyU3RhdGUodGV4dCk7XG4gIHJldHVybiBwYXJzZUNsYXNzTmFtZU5leHQodGV4dCwgY29uc3VtZVdoaXRlc3BhY2UodGV4dCwgMCwgcGFyc2VyU3RhdGUudGV4dEVuZCkpO1xufVxuXG4vKipcbiAqIFBhcnNlcyBuZXh0IGBjbGFzc05hbWVgIHRva2VuLlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gaXMgaW50ZW5kZWQgdG8gYmUgdXNlZCBpbiB0aGlzIGZvcm1hdDpcbiAqIGBgYFxuICogZm9yIChsZXQgaSA9IHBhcnNlQ2xhc3NOYW1lKHRleHQpOyBpID49IDA7IGkgPSBwYXJzZUNsYXNzTmFtZU5leHQodGV4dCwgaSkpKSB7XG4gKiAgIGNvbnN0IGtleSA9IGdldExhc3RQYXJzZWRLZXkoKTtcbiAqICAgLi4uXG4gKiB9XG4gKiBgYGBcbiAqXG4gKiBAcGFyYW0gdGV4dCBgY2xhc3NOYW1lYCB0byBwYXJzZVxuICogQHBhcmFtIGluZGV4IHdoZXJlIHRoZSBwYXJzaW5nIHNob3VsZCByZXN1bWUuXG4gKiBAcmV0dXJucyBpbmRleCB3aGVyZSB0aGUgbmV4dCBpbnZvY2F0aW9uIG9mIGBwYXJzZUNsYXNzTmFtZU5leHRgIHNob3VsZCByZXN1bWUuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZUNsYXNzTmFtZU5leHQodGV4dDogc3RyaW5nLCBpbmRleDogbnVtYmVyKTogbnVtYmVyIHtcbiAgY29uc3QgZW5kID0gcGFyc2VyU3RhdGUudGV4dEVuZDtcbiAgaWYgKGVuZCA9PT0gaW5kZXgpIHtcbiAgICByZXR1cm4gLTE7XG4gIH1cbiAgaW5kZXggPSBwYXJzZXJTdGF0ZS5rZXlFbmQgPSBjb25zdW1lQ2xhc3NUb2tlbih0ZXh0LCBwYXJzZXJTdGF0ZS5rZXkgPSBpbmRleCwgZW5kKTtcbiAgcmV0dXJuIGNvbnN1bWVXaGl0ZXNwYWNlKHRleHQsIGluZGV4LCBlbmQpO1xufVxuXG4vKipcbiAqIEluaXRpYWxpemVzIGBjc3NUZXh0YCBzdHJpbmcgZm9yIHBhcnNpbmcgYW5kIHBhcnNlcyB0aGUgZmlyc3Qga2V5L3ZhbHVlcy5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIGlzIGludGVuZGVkIHRvIGJlIHVzZWQgaW4gdGhpcyBmb3JtYXQ6XG4gKiBgYGBcbiAqIGZvciAobGV0IGkgPSBwYXJzZVN0eWxlKHRleHQpOyBpID49IDA7IGkgPSBwYXJzZVN0eWxlTmV4dCh0ZXh0LCBpKSkpIHtcbiAqICAgY29uc3Qga2V5ID0gZ2V0TGFzdFBhcnNlZEtleSgpO1xuICogICBjb25zdCB2YWx1ZSA9IGdldExhc3RQYXJzZWRWYWx1ZSgpO1xuICogICAuLi5cbiAqIH1cbiAqIGBgYFxuICogQHBhcmFtIHRleHQgYGNzc1RleHRgIHRvIHBhcnNlXG4gKiBAcmV0dXJucyBpbmRleCB3aGVyZSB0aGUgbmV4dCBpbnZvY2F0aW9uIG9mIGBwYXJzZVN0eWxlTmV4dGAgc2hvdWxkIHJlc3VtZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlU3R5bGUodGV4dDogc3RyaW5nKTogbnVtYmVyIHtcbiAgcmVzZXRQYXJzZXJTdGF0ZSh0ZXh0KTtcbiAgcmV0dXJuIHBhcnNlU3R5bGVOZXh0KHRleHQsIGNvbnN1bWVXaGl0ZXNwYWNlKHRleHQsIDAsIHBhcnNlclN0YXRlLnRleHRFbmQpKTtcbn1cblxuLyoqXG4gKiBQYXJzZXMgdGhlIG5leHQgYGNzc1RleHRgIGtleS92YWx1ZXMuXG4gKlxuICogVGhpcyBmdW5jdGlvbiBpcyBpbnRlbmRlZCB0byBiZSB1c2VkIGluIHRoaXMgZm9ybWF0OlxuICogYGBgXG4gKiBmb3IgKGxldCBpID0gcGFyc2VTdHlsZSh0ZXh0KTsgaSA+PSAwOyBpID0gcGFyc2VTdHlsZU5leHQodGV4dCwgaSkpKSB7XG4gKiAgIGNvbnN0IGtleSA9IGdldExhc3RQYXJzZWRLZXkoKTtcbiAqICAgY29uc3QgdmFsdWUgPSBnZXRMYXN0UGFyc2VkVmFsdWUoKTtcbiAqICAgLi4uXG4gKiB9XG4gKlxuICogQHBhcmFtIHRleHQgYGNzc1RleHRgIHRvIHBhcnNlXG4gKiBAcGFyYW0gaW5kZXggd2hlcmUgdGhlIHBhcnNpbmcgc2hvdWxkIHJlc3VtZS5cbiAqIEByZXR1cm5zIGluZGV4IHdoZXJlIHRoZSBuZXh0IGludm9jYXRpb24gb2YgYHBhcnNlU3R5bGVOZXh0YCBzaG91bGQgcmVzdW1lLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VTdHlsZU5leHQodGV4dDogc3RyaW5nLCBzdGFydEluZGV4OiBudW1iZXIpOiBudW1iZXIge1xuICBjb25zdCBlbmQgPSBwYXJzZXJTdGF0ZS50ZXh0RW5kO1xuICBpZiAoZW5kID09PSBzdGFydEluZGV4KSB7XG4gICAgLy8gd2UgcmVhY2hlZCBhbiBlbmQgc28ganVzdCBxdWl0XG4gICAgcmV0dXJuIC0xO1xuICB9XG4gIGxldCBpbmRleCA9IHBhcnNlclN0YXRlLmtleUVuZCA9IGNvbnN1bWVTdHlsZUtleSh0ZXh0LCBwYXJzZXJTdGF0ZS5rZXkgPSBzdGFydEluZGV4LCBlbmQpO1xuICBpbmRleCA9IHBhcnNlclN0YXRlLnZhbHVlID0gY29uc3VtZVNlcGFyYXRvcldpdGhXaGl0ZXNwYWNlKHRleHQsIGluZGV4LCBlbmQsIENoYXJDb2RlLkNPTE9OKTtcbiAgaW5kZXggPSBwYXJzZXJTdGF0ZS52YWx1ZUVuZCA9IGNvbnN1bWVTdHlsZVZhbHVlKHRleHQsIGluZGV4LCBlbmQpO1xuICBpZiAobmdEZXZNb2RlICYmIHBhcnNlclN0YXRlLnZhbHVlID09PSBwYXJzZXJTdGF0ZS52YWx1ZUVuZCkge1xuICAgIHRocm93IG1hbGZvcm1lZFN0eWxlRXJyb3IodGV4dCwgaW5kZXgpO1xuICB9XG4gIHJldHVybiBjb25zdW1lU2VwYXJhdG9yV2l0aFdoaXRlc3BhY2UodGV4dCwgaW5kZXgsIGVuZCwgQ2hhckNvZGUuU0VNSV9DT0xPTik7XG59XG5cbi8qKlxuICogUmVzZXQgdGhlIGdsb2JhbCBzdGF0ZSBvZiB0aGUgc3R5bGluZyBwYXJzZXIuXG4gKiBAcGFyYW0gdGV4dCBUaGUgc3R5bGluZyB0ZXh0IHRvIHBhcnNlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVzZXRQYXJzZXJTdGF0ZSh0ZXh0OiBzdHJpbmcpOiB2b2lkIHtcbiAgcGFyc2VyU3RhdGUua2V5ID0gMDtcbiAgcGFyc2VyU3RhdGUua2V5RW5kID0gMDtcbiAgcGFyc2VyU3RhdGUudmFsdWUgPSAwO1xuICBwYXJzZXJTdGF0ZS52YWx1ZUVuZCA9IDA7XG4gIHBhcnNlclN0YXRlLnRleHRFbmQgPSB0ZXh0Lmxlbmd0aDtcbn1cblxuLyoqXG4gKiBSZXRyaWV2ZXMgdGhhIGB2YWx1ZUVuZGAgZnJvbSB0aGUgcGFyc2VyIGdsb2JhbCBzdGF0ZS5cbiAqXG4gKiBTZWU6IGBQYXJzZXJTdGF0ZWAuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRMYXN0UGFyc2VkVmFsdWVFbmQoKTogbnVtYmVyIHtcbiAgcmV0dXJuIHBhcnNlclN0YXRlLnZhbHVlRW5kO1xufVxuXG4vKipcbiAqIFJldHVybnMgaW5kZXggb2YgbmV4dCBub24td2hpdGVzcGFjZSBjaGFyYWN0ZXIuXG4gKlxuICogQHBhcmFtIHRleHQgVGV4dCB0byBzY2FuXG4gKiBAcGFyYW0gc3RhcnRJbmRleCBTdGFydGluZyBpbmRleCBvZiBjaGFyYWN0ZXIgd2hlcmUgdGhlIHNjYW4gc2hvdWxkIHN0YXJ0LlxuICogQHBhcmFtIGVuZEluZGV4IEVuZGluZyBpbmRleCBvZiBjaGFyYWN0ZXIgd2hlcmUgdGhlIHNjYW4gc2hvdWxkIGVuZC5cbiAqIEByZXR1cm5zIEluZGV4IG9mIG5leHQgbm9uLXdoaXRlc3BhY2UgY2hhcmFjdGVyIChNYXkgYmUgdGhlIHNhbWUgYXMgYHN0YXJ0YCBpZiBubyB3aGl0ZXNwYWNlIGF0XG4gKiAgICAgICAgICB0aGF0IGxvY2F0aW9uLilcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbnN1bWVXaGl0ZXNwYWNlKHRleHQ6IHN0cmluZywgc3RhcnRJbmRleDogbnVtYmVyLCBlbmRJbmRleDogbnVtYmVyKTogbnVtYmVyIHtcbiAgd2hpbGUgKHN0YXJ0SW5kZXggPCBlbmRJbmRleCAmJiB0ZXh0LmNoYXJDb2RlQXQoc3RhcnRJbmRleCkgPD0gQ2hhckNvZGUuU1BBQ0UpIHtcbiAgICBzdGFydEluZGV4Kys7XG4gIH1cbiAgcmV0dXJuIHN0YXJ0SW5kZXg7XG59XG5cbi8qKlxuICogUmV0dXJucyBpbmRleCBvZiBsYXN0IGNoYXIgaW4gY2xhc3MgdG9rZW4uXG4gKlxuICogQHBhcmFtIHRleHQgVGV4dCB0byBzY2FuXG4gKiBAcGFyYW0gc3RhcnRJbmRleCBTdGFydGluZyBpbmRleCBvZiBjaGFyYWN0ZXIgd2hlcmUgdGhlIHNjYW4gc2hvdWxkIHN0YXJ0LlxuICogQHBhcmFtIGVuZEluZGV4IEVuZGluZyBpbmRleCBvZiBjaGFyYWN0ZXIgd2hlcmUgdGhlIHNjYW4gc2hvdWxkIGVuZC5cbiAqIEByZXR1cm5zIEluZGV4IGFmdGVyIGxhc3QgY2hhciBpbiBjbGFzcyB0b2tlbi5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbnN1bWVDbGFzc1Rva2VuKHRleHQ6IHN0cmluZywgc3RhcnRJbmRleDogbnVtYmVyLCBlbmRJbmRleDogbnVtYmVyKTogbnVtYmVyIHtcbiAgd2hpbGUgKHN0YXJ0SW5kZXggPCBlbmRJbmRleCAmJiB0ZXh0LmNoYXJDb2RlQXQoc3RhcnRJbmRleCkgPiBDaGFyQ29kZS5TUEFDRSkge1xuICAgIHN0YXJ0SW5kZXgrKztcbiAgfVxuICByZXR1cm4gc3RhcnRJbmRleDtcbn1cblxuLyoqXG4gKiBDb25zdW1lcyBhbGwgb2YgdGhlIGNoYXJhY3RlcnMgYmVsb25naW5nIHRvIHN0eWxlIGtleSBhbmQgdG9rZW4uXG4gKlxuICogQHBhcmFtIHRleHQgVGV4dCB0byBzY2FuXG4gKiBAcGFyYW0gc3RhcnRJbmRleCBTdGFydGluZyBpbmRleCBvZiBjaGFyYWN0ZXIgd2hlcmUgdGhlIHNjYW4gc2hvdWxkIHN0YXJ0LlxuICogQHBhcmFtIGVuZEluZGV4IEVuZGluZyBpbmRleCBvZiBjaGFyYWN0ZXIgd2hlcmUgdGhlIHNjYW4gc2hvdWxkIGVuZC5cbiAqIEByZXR1cm5zIEluZGV4IGFmdGVyIGxhc3Qgc3R5bGUga2V5IGNoYXJhY3Rlci5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbnN1bWVTdHlsZUtleSh0ZXh0OiBzdHJpbmcsIHN0YXJ0SW5kZXg6IG51bWJlciwgZW5kSW5kZXg6IG51bWJlcik6IG51bWJlciB7XG4gIGxldCBjaDogbnVtYmVyO1xuICB3aGlsZSAoc3RhcnRJbmRleCA8IGVuZEluZGV4ICYmXG4gICAgICAgICAoKGNoID0gdGV4dC5jaGFyQ29kZUF0KHN0YXJ0SW5kZXgpKSA9PT0gQ2hhckNvZGUuREFTSCB8fCBjaCA9PT0gQ2hhckNvZGUuVU5ERVJTQ09SRSB8fFxuICAgICAgICAgICgoY2ggJiBDaGFyQ29kZS5VUFBFUl9DQVNFKSA+PSBDaGFyQ29kZS5BICYmIChjaCAmIENoYXJDb2RlLlVQUEVSX0NBU0UpIDw9IENoYXJDb2RlLlopKSkge1xuICAgIHN0YXJ0SW5kZXgrKztcbiAgfVxuICByZXR1cm4gc3RhcnRJbmRleDtcbn1cblxuLyoqXG4gKiBDb25zdW1lcyBhbGwgd2hpdGVzcGFjZSBhbmQgdGhlIHNlcGFyYXRvciBgOmAgYWZ0ZXIgdGhlIHN0eWxlIGtleS5cbiAqXG4gKiBAcGFyYW0gdGV4dCBUZXh0IHRvIHNjYW5cbiAqIEBwYXJhbSBzdGFydEluZGV4IFN0YXJ0aW5nIGluZGV4IG9mIGNoYXJhY3RlciB3aGVyZSB0aGUgc2NhbiBzaG91bGQgc3RhcnQuXG4gKiBAcGFyYW0gZW5kSW5kZXggRW5kaW5nIGluZGV4IG9mIGNoYXJhY3RlciB3aGVyZSB0aGUgc2NhbiBzaG91bGQgZW5kLlxuICogQHJldHVybnMgSW5kZXggYWZ0ZXIgc2VwYXJhdG9yIGFuZCBzdXJyb3VuZGluZyB3aGl0ZXNwYWNlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY29uc3VtZVNlcGFyYXRvcldpdGhXaGl0ZXNwYWNlKFxuICAgIHRleHQ6IHN0cmluZywgc3RhcnRJbmRleDogbnVtYmVyLCBlbmRJbmRleDogbnVtYmVyLCBzZXBhcmF0b3I6IG51bWJlcik6IG51bWJlciB7XG4gIHN0YXJ0SW5kZXggPSBjb25zdW1lV2hpdGVzcGFjZSh0ZXh0LCBzdGFydEluZGV4LCBlbmRJbmRleCk7XG4gIGlmIChzdGFydEluZGV4IDwgZW5kSW5kZXgpIHtcbiAgICBpZiAobmdEZXZNb2RlICYmIHRleHQuY2hhckNvZGVBdChzdGFydEluZGV4KSAhPT0gc2VwYXJhdG9yKSB7XG4gICAgICB0aHJvdyBleHBlY3RpbmdFcnJvcih0ZXh0LCBTdHJpbmcuZnJvbUNoYXJDb2RlKHNlcGFyYXRvciksIHN0YXJ0SW5kZXgpO1xuICAgIH1cbiAgICBzdGFydEluZGV4Kys7XG4gIH1cbiAgc3RhcnRJbmRleCA9IGNvbnN1bWVXaGl0ZXNwYWNlKHRleHQsIHN0YXJ0SW5kZXgsIGVuZEluZGV4KTtcbiAgcmV0dXJuIHN0YXJ0SW5kZXg7XG59XG5cblxuLyoqXG4gKiBDb25zdW1lcyBzdHlsZSB2YWx1ZSBob25vcmluZyBgdXJsKClgIGFuZCBgXCJcImAgdGV4dC5cbiAqXG4gKiBAcGFyYW0gdGV4dCBUZXh0IHRvIHNjYW5cbiAqIEBwYXJhbSBzdGFydEluZGV4IFN0YXJ0aW5nIGluZGV4IG9mIGNoYXJhY3RlciB3aGVyZSB0aGUgc2NhbiBzaG91bGQgc3RhcnQuXG4gKiBAcGFyYW0gZW5kSW5kZXggRW5kaW5nIGluZGV4IG9mIGNoYXJhY3RlciB3aGVyZSB0aGUgc2NhbiBzaG91bGQgZW5kLlxuICogQHJldHVybnMgSW5kZXggYWZ0ZXIgbGFzdCBzdHlsZSB2YWx1ZSBjaGFyYWN0ZXIuXG4qL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbnN1bWVTdHlsZVZhbHVlKHRleHQ6IHN0cmluZywgc3RhcnRJbmRleDogbnVtYmVyLCBlbmRJbmRleDogbnVtYmVyKTogbnVtYmVyIHtcbiAgbGV0IGNoMSA9IC0xOyAgLy8gMXN0IHByZXZpb3VzIGNoYXJhY3RlclxuICBsZXQgY2gyID0gLTE7ICAvLyAybmQgcHJldmlvdXMgY2hhcmFjdGVyXG4gIGxldCBjaDMgPSAtMTsgIC8vIDNyZCBwcmV2aW91cyBjaGFyYWN0ZXJcbiAgbGV0IGkgPSBzdGFydEluZGV4O1xuICBsZXQgbGFzdENoSW5kZXggPSBpO1xuICB3aGlsZSAoaSA8IGVuZEluZGV4KSB7XG4gICAgY29uc3QgY2g6IG51bWJlciA9IHRleHQuY2hhckNvZGVBdChpKyspO1xuICAgIGlmIChjaCA9PT0gQ2hhckNvZGUuU0VNSV9DT0xPTikge1xuICAgICAgcmV0dXJuIGxhc3RDaEluZGV4O1xuICAgIH0gZWxzZSBpZiAoY2ggPT09IENoYXJDb2RlLkRPVUJMRV9RVU9URSB8fCBjaCA9PT0gQ2hhckNvZGUuU0lOR0xFX1FVT1RFKSB7XG4gICAgICBsYXN0Q2hJbmRleCA9IGkgPSBjb25zdW1lUXVvdGVkVGV4dCh0ZXh0LCBjaCwgaSwgZW5kSW5kZXgpO1xuICAgIH0gZWxzZSBpZiAoXG4gICAgICAgIHN0YXJ0SW5kZXggPT09XG4gICAgICAgICAgICBpIC0gNCAmJiAgLy8gV2UgaGF2ZSBzZWVuIG9ubHkgNCBjaGFyYWN0ZXJzIHNvIGZhciBcIlVSTChcIiAoSWdub3JlIFwiZm9vX1VSTCgpXCIpXG4gICAgICAgIGNoMyA9PT0gQ2hhckNvZGUuVSAmJlxuICAgICAgICBjaDIgPT09IENoYXJDb2RlLlIgJiYgY2gxID09PSBDaGFyQ29kZS5MICYmIGNoID09PSBDaGFyQ29kZS5PUEVOX1BBUkVOKSB7XG4gICAgICBsYXN0Q2hJbmRleCA9IGkgPSBjb25zdW1lUXVvdGVkVGV4dCh0ZXh0LCBDaGFyQ29kZS5DTE9TRV9QQVJFTiwgaSwgZW5kSW5kZXgpO1xuICAgIH0gZWxzZSBpZiAoY2ggPiBDaGFyQ29kZS5TUEFDRSkge1xuICAgICAgLy8gaWYgd2UgaGF2ZSBhIG5vbi13aGl0ZXNwYWNlIGNoYXJhY3RlciB0aGVuIGNhcHR1cmUgaXRzIGxvY2F0aW9uXG4gICAgICBsYXN0Q2hJbmRleCA9IGk7XG4gICAgfVxuICAgIGNoMyA9IGNoMjtcbiAgICBjaDIgPSBjaDE7XG4gICAgY2gxID0gY2ggJiBDaGFyQ29kZS5VUFBFUl9DQVNFO1xuICB9XG4gIHJldHVybiBsYXN0Q2hJbmRleDtcbn1cblxuLyoqXG4gKiBDb25zdW1lcyBhbGwgb2YgdGhlIHF1b3RlZCBjaGFyYWN0ZXJzLlxuICpcbiAqIEBwYXJhbSB0ZXh0IFRleHQgdG8gc2NhblxuICogQHBhcmFtIHF1b3RlQ2hhckNvZGUgQ2hhckNvZGUgb2YgZWl0aGVyIGBcImAgb3IgYCdgIHF1b3RlIG9yIGApYCBmb3IgYHVybCguLi4pYC5cbiAqIEBwYXJhbSBzdGFydEluZGV4IFN0YXJ0aW5nIGluZGV4IG9mIGNoYXJhY3RlciB3aGVyZSB0aGUgc2NhbiBzaG91bGQgc3RhcnQuXG4gKiBAcGFyYW0gZW5kSW5kZXggRW5kaW5nIGluZGV4IG9mIGNoYXJhY3RlciB3aGVyZSB0aGUgc2NhbiBzaG91bGQgZW5kLlxuICogQHJldHVybnMgSW5kZXggYWZ0ZXIgcXVvdGVkIGNoYXJhY3RlcnMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb25zdW1lUXVvdGVkVGV4dChcbiAgICB0ZXh0OiBzdHJpbmcsIHF1b3RlQ2hhckNvZGU6IG51bWJlciwgc3RhcnRJbmRleDogbnVtYmVyLCBlbmRJbmRleDogbnVtYmVyKTogbnVtYmVyIHtcbiAgbGV0IGNoMSA9IC0xOyAgLy8gMXN0IHByZXZpb3VzIGNoYXJhY3RlclxuICBsZXQgaW5kZXggPSBzdGFydEluZGV4O1xuICB3aGlsZSAoaW5kZXggPCBlbmRJbmRleCkge1xuICAgIGNvbnN0IGNoID0gdGV4dC5jaGFyQ29kZUF0KGluZGV4KyspO1xuICAgIGlmIChjaCA9PSBxdW90ZUNoYXJDb2RlICYmIGNoMSAhPT0gQ2hhckNvZGUuQkFDS19TTEFTSCkge1xuICAgICAgcmV0dXJuIGluZGV4O1xuICAgIH1cbiAgICBpZiAoY2ggPT0gQ2hhckNvZGUuQkFDS19TTEFTSCAmJiBjaDEgPT09IENoYXJDb2RlLkJBQ0tfU0xBU0gpIHtcbiAgICAgIC8vIHR3byBiYWNrIHNsYXNoZXMgY2FuY2VsIGVhY2ggb3RoZXIgb3V0LiBGb3IgZXhhbXBsZSBgXCJcXFxcXCJgIHNob3VsZCBwcm9wZXJseSBlbmQgdGhlXG4gICAgICAvLyBxdW90YXRpb24uIChJdCBzaG91bGQgbm90IGFzc3VtZSB0aGF0IHRoZSBsYXN0IGBcImAgaXMgZXNjYXBlZC4pXG4gICAgICBjaDEgPSAwO1xuICAgIH0gZWxzZSB7XG4gICAgICBjaDEgPSBjaDtcbiAgICB9XG4gIH1cbiAgdGhyb3cgbmdEZXZNb2RlID8gZXhwZWN0aW5nRXJyb3IodGV4dCwgU3RyaW5nLmZyb21DaGFyQ29kZShxdW90ZUNoYXJDb2RlKSwgZW5kSW5kZXgpIDpcbiAgICAgICAgICAgICAgICAgICAgbmV3IEVycm9yKCk7XG59XG5cbmZ1bmN0aW9uIGV4cGVjdGluZ0Vycm9yKHRleHQ6IHN0cmluZywgZXhwZWN0aW5nOiBzdHJpbmcsIGluZGV4OiBudW1iZXIpIHtcbiAgcmV0dXJuIG5ldyBFcnJvcihcbiAgICAgIGBFeHBlY3RpbmcgJyR7ZXhwZWN0aW5nfScgYXQgbG9jYXRpb24gJHtpbmRleH0gaW4gc3RyaW5nICdgICsgdGV4dC5zdWJzdHJpbmcoMCwgaW5kZXgpICtcbiAgICAgICdbPj4nICsgdGV4dC5zdWJzdHJpbmcoaW5kZXgsIGluZGV4ICsgMSkgKyAnPDxdJyArIHRleHQuc3Vic3RyKGluZGV4ICsgMSkgKyAnXFwnLicpO1xufVxuXG5mdW5jdGlvbiBtYWxmb3JtZWRTdHlsZUVycm9yKHRleHQ6IHN0cmluZywgaW5kZXg6IG51bWJlcikge1xuICByZXR1cm4gbmV3IEVycm9yKFxuICAgICAgYE1hbGZvcm1lZCBzdHlsZSBhdCBsb2NhdGlvbiAke2luZGV4fSBpbiBzdHJpbmcgJ2AgKyB0ZXh0LnN1YnN0cmluZygwLCBpbmRleCkgKyAnWz4+JyArXG4gICAgICB0ZXh0LnN1YnN0cmluZyhpbmRleCwgaW5kZXggKyAxKSArICc8PF0nICsgdGV4dC5zdWJzdHIoaW5kZXggKyAxKSArICdcXCcuJyk7XG59XG4iXX0=