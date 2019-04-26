/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { global } from '../../util/global';
/**
 * Returns whether the values are different from a change detection stand point.
 *
 * Constraints are relaxed in checkNoChanges mode. See `devModeEqual` for details.
 * @param {?} a
 * @param {?} b
 * @return {?}
 */
export function isDifferent(a, b) {
    // NaN is the only value that is not equal to itself so the first
    // test checks if both a and b are not NaN
    return !(a !== a && b !== b) && a !== b;
}
/**
 * Used for stringify render output in Ivy.
 * Important! This function is very performance-sensitive and we should
 * be extra careful not to introduce megamorphic reads in it.
 * @param {?} value
 * @return {?}
 */
export function renderStringify(value) {
    if (typeof value === 'function')
        return value.name || value;
    if (typeof value === 'string')
        return value;
    if (value == null)
        return '';
    return '' + value;
}
/**
 * Used to stringify a value so that it can be displayed in an error message.
 * Important! This function contains a megamorphic read and should only be
 * used for error messages.
 * @param {?} value
 * @return {?}
 */
export function stringifyForError(value) {
    if (typeof value === 'object' && value != null && typeof value.type === 'function') {
        return value.type.name || value.type;
    }
    return renderStringify(value);
}
/** @type {?} */
export const defaultScheduler = (typeof requestAnimationFrame !== 'undefined' && requestAnimationFrame || // browser only
    setTimeout // everything else
).bind(global);
/**
 *
 * \@codeGenApi
 * @param {?} element
 * @return {?}
 */
export function ɵɵresolveWindow(element) {
    return { name: 'window', target: element.ownerDocument.defaultView };
}
/**
 *
 * \@codeGenApi
 * @param {?} element
 * @return {?}
 */
export function ɵɵresolveDocument(element) {
    return { name: 'document', target: element.ownerDocument };
}
/**
 *
 * \@codeGenApi
 * @param {?} element
 * @return {?}
 */
export function ɵɵresolveBody(element) {
    return { name: 'body', target: element.ownerDocument.body };
}
/**
 * The special delimiter we use to separate property names, prefixes, and suffixes
 * in property binding metadata. See storeBindingMetadata().
 *
 * We intentionally use the Unicode "REPLACEMENT CHARACTER" (U+FFFD) as a delimiter
 * because it is a very uncommon character that is unlikely to be part of a user's
 * property names or interpolation strings. If it is in fact used in a property
 * binding, DebugElement.properties will not return the correct value for that
 * binding. However, there should be no runtime effect for real applications.
 *
 * This character is typically rendered as a question mark inside of a diamond.
 * See https://en.wikipedia.org/wiki/Specials_(Unicode_block)
 *
 * @type {?}
 */
export const INTERPOLATION_DELIMITER = `�`;
/**
 * Determines whether or not the given string is a property metadata string.
 * See storeBindingMetadata().
 * @param {?} str
 * @return {?}
 */
export function isPropMetadataString(str) {
    return str.indexOf(INTERPOLATION_DELIMITER) >= 0;
}
/**
 * Unwrap a value which might be behind a closure (for forward declaration reasons).
 * @template T
 * @param {?} value
 * @return {?}
 */
export function maybeUnwrapFn(value) {
    if (value instanceof Function) {
        return value();
    }
    else {
        return value;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWlzY191dGlscy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvdXRpbC9taXNjX3V0aWxzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBUUEsT0FBTyxFQUFDLE1BQU0sRUFBQyxNQUFNLG1CQUFtQixDQUFDOzs7Ozs7Ozs7QUFRekMsTUFBTSxVQUFVLFdBQVcsQ0FBQyxDQUFNLEVBQUUsQ0FBTTtJQUN4QyxpRUFBaUU7SUFDakUsMENBQTBDO0lBQzFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDMUMsQ0FBQzs7Ozs7Ozs7QUFPRCxNQUFNLFVBQVUsZUFBZSxDQUFDLEtBQVU7SUFDeEMsSUFBSSxPQUFPLEtBQUssS0FBSyxVQUFVO1FBQUUsT0FBTyxLQUFLLENBQUMsSUFBSSxJQUFJLEtBQUssQ0FBQztJQUM1RCxJQUFJLE9BQU8sS0FBSyxLQUFLLFFBQVE7UUFBRSxPQUFPLEtBQUssQ0FBQztJQUM1QyxJQUFJLEtBQUssSUFBSSxJQUFJO1FBQUUsT0FBTyxFQUFFLENBQUM7SUFDN0IsT0FBTyxFQUFFLEdBQUcsS0FBSyxDQUFDO0FBQ3BCLENBQUM7Ozs7Ozs7O0FBUUQsTUFBTSxVQUFVLGlCQUFpQixDQUFDLEtBQVU7SUFDMUMsSUFBSSxPQUFPLEtBQUssS0FBSyxRQUFRLElBQUksS0FBSyxJQUFJLElBQUksSUFBSSxPQUFPLEtBQUssQ0FBQyxJQUFJLEtBQUssVUFBVSxFQUFFO1FBQ2xGLE9BQU8sS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLElBQUksS0FBSyxDQUFDLElBQUksQ0FBQztLQUN0QztJQUVELE9BQU8sZUFBZSxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQ2hDLENBQUM7O0FBR0QsTUFBTSxPQUFPLGdCQUFnQixHQUN6QixDQUFDLE9BQU8scUJBQXFCLEtBQUssV0FBVyxJQUFJLHFCQUFxQixJQUFLLGVBQWU7SUFDekYsVUFBVSxDQUFnRSxrQkFBa0I7Q0FDM0YsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDOzs7Ozs7O0FBTW5CLE1BQU0sVUFBVSxlQUFlLENBQUMsT0FBNkM7SUFDM0UsT0FBTyxFQUFDLElBQUksRUFBRSxRQUFRLEVBQUUsTUFBTSxFQUFFLE9BQU8sQ0FBQyxhQUFhLENBQUMsV0FBVyxFQUFDLENBQUM7QUFDckUsQ0FBQzs7Ozs7OztBQU1ELE1BQU0sVUFBVSxpQkFBaUIsQ0FBQyxPQUE2QztJQUM3RSxPQUFPLEVBQUMsSUFBSSxFQUFFLFVBQVUsRUFBRSxNQUFNLEVBQUUsT0FBTyxDQUFDLGFBQWEsRUFBQyxDQUFDO0FBQzNELENBQUM7Ozs7Ozs7QUFNRCxNQUFNLFVBQVUsYUFBYSxDQUFDLE9BQTZDO0lBQ3pFLE9BQU8sRUFBQyxJQUFJLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxPQUFPLENBQUMsYUFBYSxDQUFDLElBQUksRUFBQyxDQUFDO0FBQzVELENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7QUFnQkQsTUFBTSxPQUFPLHVCQUF1QixHQUFHLEdBQUc7Ozs7Ozs7QUFNMUMsTUFBTSxVQUFVLG9CQUFvQixDQUFDLEdBQVc7SUFDOUMsT0FBTyxHQUFHLENBQUMsT0FBTyxDQUFDLHVCQUF1QixDQUFDLElBQUksQ0FBQyxDQUFDO0FBQ25ELENBQUM7Ozs7Ozs7QUFLRCxNQUFNLFVBQVUsYUFBYSxDQUFJLEtBQW9CO0lBQ25ELElBQUksS0FBSyxZQUFZLFFBQVEsRUFBRTtRQUM3QixPQUFPLEtBQUssRUFBRSxDQUFDO0tBQ2hCO1NBQU07UUFDTCxPQUFPLEtBQUssQ0FBQztLQUNkO0FBQ0gsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtnbG9iYWx9IGZyb20gJy4uLy4uL3V0aWwvZ2xvYmFsJztcbmltcG9ydCB7UkVsZW1lbnR9IGZyb20gJy4uL2ludGVyZmFjZXMvcmVuZGVyZXInO1xuXG4vKipcbiAqIFJldHVybnMgd2hldGhlciB0aGUgdmFsdWVzIGFyZSBkaWZmZXJlbnQgZnJvbSBhIGNoYW5nZSBkZXRlY3Rpb24gc3RhbmQgcG9pbnQuXG4gKlxuICogQ29uc3RyYWludHMgYXJlIHJlbGF4ZWQgaW4gY2hlY2tOb0NoYW5nZXMgbW9kZS4gU2VlIGBkZXZNb2RlRXF1YWxgIGZvciBkZXRhaWxzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gaXNEaWZmZXJlbnQoYTogYW55LCBiOiBhbnkpOiBib29sZWFuIHtcbiAgLy8gTmFOIGlzIHRoZSBvbmx5IHZhbHVlIHRoYXQgaXMgbm90IGVxdWFsIHRvIGl0c2VsZiBzbyB0aGUgZmlyc3RcbiAgLy8gdGVzdCBjaGVja3MgaWYgYm90aCBhIGFuZCBiIGFyZSBub3QgTmFOXG4gIHJldHVybiAhKGEgIT09IGEgJiYgYiAhPT0gYikgJiYgYSAhPT0gYjtcbn1cblxuLyoqXG4gKiBVc2VkIGZvciBzdHJpbmdpZnkgcmVuZGVyIG91dHB1dCBpbiBJdnkuXG4gKiBJbXBvcnRhbnQhIFRoaXMgZnVuY3Rpb24gaXMgdmVyeSBwZXJmb3JtYW5jZS1zZW5zaXRpdmUgYW5kIHdlIHNob3VsZFxuICogYmUgZXh0cmEgY2FyZWZ1bCBub3QgdG8gaW50cm9kdWNlIG1lZ2Ftb3JwaGljIHJlYWRzIGluIGl0LlxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVuZGVyU3RyaW5naWZ5KHZhbHVlOiBhbnkpOiBzdHJpbmcge1xuICBpZiAodHlwZW9mIHZhbHVlID09PSAnZnVuY3Rpb24nKSByZXR1cm4gdmFsdWUubmFtZSB8fCB2YWx1ZTtcbiAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycpIHJldHVybiB2YWx1ZTtcbiAgaWYgKHZhbHVlID09IG51bGwpIHJldHVybiAnJztcbiAgcmV0dXJuICcnICsgdmFsdWU7XG59XG5cblxuLyoqXG4gKiBVc2VkIHRvIHN0cmluZ2lmeSBhIHZhbHVlIHNvIHRoYXQgaXQgY2FuIGJlIGRpc3BsYXllZCBpbiBhbiBlcnJvciBtZXNzYWdlLlxuICogSW1wb3J0YW50ISBUaGlzIGZ1bmN0aW9uIGNvbnRhaW5zIGEgbWVnYW1vcnBoaWMgcmVhZCBhbmQgc2hvdWxkIG9ubHkgYmVcbiAqIHVzZWQgZm9yIGVycm9yIG1lc3NhZ2VzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gc3RyaW5naWZ5Rm9yRXJyb3IodmFsdWU6IGFueSkge1xuICBpZiAodHlwZW9mIHZhbHVlID09PSAnb2JqZWN0JyAmJiB2YWx1ZSAhPSBudWxsICYmIHR5cGVvZiB2YWx1ZS50eXBlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgcmV0dXJuIHZhbHVlLnR5cGUubmFtZSB8fCB2YWx1ZS50eXBlO1xuICB9XG5cbiAgcmV0dXJuIHJlbmRlclN0cmluZ2lmeSh2YWx1ZSk7XG59XG5cblxuZXhwb3J0IGNvbnN0IGRlZmF1bHRTY2hlZHVsZXIgPVxuICAgICh0eXBlb2YgcmVxdWVzdEFuaW1hdGlvbkZyYW1lICE9PSAndW5kZWZpbmVkJyAmJiByZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHwgIC8vIGJyb3dzZXIgb25seVxuICAgICBzZXRUaW1lb3V0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGV2ZXJ5dGhpbmcgZWxzZVxuICAgICApLmJpbmQoZ2xvYmFsKTtcblxuLyoqXG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVyZXNvbHZlV2luZG93KGVsZW1lbnQ6IFJFbGVtZW50ICYge293bmVyRG9jdW1lbnQ6IERvY3VtZW50fSkge1xuICByZXR1cm4ge25hbWU6ICd3aW5kb3cnLCB0YXJnZXQ6IGVsZW1lbnQub3duZXJEb2N1bWVudC5kZWZhdWx0Vmlld307XG59XG5cbi8qKlxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1cmVzb2x2ZURvY3VtZW50KGVsZW1lbnQ6IFJFbGVtZW50ICYge293bmVyRG9jdW1lbnQ6IERvY3VtZW50fSkge1xuICByZXR1cm4ge25hbWU6ICdkb2N1bWVudCcsIHRhcmdldDogZWxlbWVudC5vd25lckRvY3VtZW50fTtcbn1cblxuLyoqXG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVyZXNvbHZlQm9keShlbGVtZW50OiBSRWxlbWVudCAmIHtvd25lckRvY3VtZW50OiBEb2N1bWVudH0pIHtcbiAgcmV0dXJuIHtuYW1lOiAnYm9keScsIHRhcmdldDogZWxlbWVudC5vd25lckRvY3VtZW50LmJvZHl9O1xufVxuXG4vKipcbiAqIFRoZSBzcGVjaWFsIGRlbGltaXRlciB3ZSB1c2UgdG8gc2VwYXJhdGUgcHJvcGVydHkgbmFtZXMsIHByZWZpeGVzLCBhbmQgc3VmZml4ZXNcbiAqIGluIHByb3BlcnR5IGJpbmRpbmcgbWV0YWRhdGEuIFNlZSBzdG9yZUJpbmRpbmdNZXRhZGF0YSgpLlxuICpcbiAqIFdlIGludGVudGlvbmFsbHkgdXNlIHRoZSBVbmljb2RlIFwiUkVQTEFDRU1FTlQgQ0hBUkFDVEVSXCIgKFUrRkZGRCkgYXMgYSBkZWxpbWl0ZXJcbiAqIGJlY2F1c2UgaXQgaXMgYSB2ZXJ5IHVuY29tbW9uIGNoYXJhY3RlciB0aGF0IGlzIHVubGlrZWx5IHRvIGJlIHBhcnQgb2YgYSB1c2VyJ3NcbiAqIHByb3BlcnR5IG5hbWVzIG9yIGludGVycG9sYXRpb24gc3RyaW5ncy4gSWYgaXQgaXMgaW4gZmFjdCB1c2VkIGluIGEgcHJvcGVydHlcbiAqIGJpbmRpbmcsIERlYnVnRWxlbWVudC5wcm9wZXJ0aWVzIHdpbGwgbm90IHJldHVybiB0aGUgY29ycmVjdCB2YWx1ZSBmb3IgdGhhdFxuICogYmluZGluZy4gSG93ZXZlciwgdGhlcmUgc2hvdWxkIGJlIG5vIHJ1bnRpbWUgZWZmZWN0IGZvciByZWFsIGFwcGxpY2F0aW9ucy5cbiAqXG4gKiBUaGlzIGNoYXJhY3RlciBpcyB0eXBpY2FsbHkgcmVuZGVyZWQgYXMgYSBxdWVzdGlvbiBtYXJrIGluc2lkZSBvZiBhIGRpYW1vbmQuXG4gKiBTZWUgaHR0cHM6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvU3BlY2lhbHNfKFVuaWNvZGVfYmxvY2spXG4gKlxuICovXG5leHBvcnQgY29uc3QgSU5URVJQT0xBVElPTl9ERUxJTUlURVIgPSBg77+9YDtcblxuLyoqXG4gKiBEZXRlcm1pbmVzIHdoZXRoZXIgb3Igbm90IHRoZSBnaXZlbiBzdHJpbmcgaXMgYSBwcm9wZXJ0eSBtZXRhZGF0YSBzdHJpbmcuXG4gKiBTZWUgc3RvcmVCaW5kaW5nTWV0YWRhdGEoKS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzUHJvcE1ldGFkYXRhU3RyaW5nKHN0cjogc3RyaW5nKTogYm9vbGVhbiB7XG4gIHJldHVybiBzdHIuaW5kZXhPZihJTlRFUlBPTEFUSU9OX0RFTElNSVRFUikgPj0gMDtcbn1cblxuLyoqXG4gKiBVbndyYXAgYSB2YWx1ZSB3aGljaCBtaWdodCBiZSBiZWhpbmQgYSBjbG9zdXJlIChmb3IgZm9yd2FyZCBkZWNsYXJhdGlvbiByZWFzb25zKS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG1heWJlVW53cmFwRm48VD4odmFsdWU6IFQgfCAoKCkgPT4gVCkpOiBUIHtcbiAgaWYgKHZhbHVlIGluc3RhbmNlb2YgRnVuY3Rpb24pIHtcbiAgICByZXR1cm4gdmFsdWUoKTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gdmFsdWU7XG4gIH1cbn1cbiJdfQ==