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
 * @param {?} value
 * @return {?}
 */
export function renderStringify(value) {
    if (typeof value == 'function')
        return value.name || value;
    if (typeof value == 'string')
        return value;
    if (value == null)
        return '';
    if (typeof value == 'object' && typeof value.type == 'function')
        return value.type.name || value.type;
    return '' + value;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWlzY191dGlscy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvdXRpbC9taXNjX3V0aWxzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBU0EsT0FBTyxFQUFDLE1BQU0sRUFBQyxNQUFNLG1CQUFtQixDQUFDOzs7Ozs7Ozs7QUFVekMsTUFBTSxVQUFVLFdBQVcsQ0FBQyxDQUFNLEVBQUUsQ0FBTTtJQUN4QyxpRUFBaUU7SUFDakUsMENBQTBDO0lBQzFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDMUMsQ0FBQzs7Ozs7O0FBS0QsTUFBTSxVQUFVLGVBQWUsQ0FBQyxLQUFVO0lBQ3hDLElBQUksT0FBTyxLQUFLLElBQUksVUFBVTtRQUFFLE9BQU8sS0FBSyxDQUFDLElBQUksSUFBSSxLQUFLLENBQUM7SUFDM0QsSUFBSSxPQUFPLEtBQUssSUFBSSxRQUFRO1FBQUUsT0FBTyxLQUFLLENBQUM7SUFDM0MsSUFBSSxLQUFLLElBQUksSUFBSTtRQUFFLE9BQU8sRUFBRSxDQUFDO0lBQzdCLElBQUksT0FBTyxLQUFLLElBQUksUUFBUSxJQUFJLE9BQU8sS0FBSyxDQUFDLElBQUksSUFBSSxVQUFVO1FBQzdELE9BQU8sS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLElBQUksS0FBSyxDQUFDLElBQUksQ0FBQztJQUN2QyxPQUFPLEVBQUUsR0FBRyxLQUFLLENBQUM7QUFDcEIsQ0FBQzs7QUFHRCxNQUFNLE9BQU8sZ0JBQWdCLEdBQ3pCLENBQUMsT0FBTyxxQkFBcUIsS0FBSyxXQUFXLElBQUkscUJBQXFCLElBQUssZUFBZTtJQUN6RixVQUFVLENBQWdFLGtCQUFrQjtDQUMzRixDQUFDLElBQUksQ0FBQyxNQUFNLENBQUM7Ozs7Ozs7QUFNbkIsTUFBTSxVQUFVLGVBQWUsQ0FBQyxPQUE2QztJQUMzRSxPQUFPLEVBQUMsSUFBSSxFQUFFLFFBQVEsRUFBRSxNQUFNLEVBQUUsT0FBTyxDQUFDLGFBQWEsQ0FBQyxXQUFXLEVBQUMsQ0FBQztBQUNyRSxDQUFDOzs7Ozs7O0FBTUQsTUFBTSxVQUFVLGlCQUFpQixDQUFDLE9BQTZDO0lBQzdFLE9BQU8sRUFBQyxJQUFJLEVBQUUsVUFBVSxFQUFFLE1BQU0sRUFBRSxPQUFPLENBQUMsYUFBYSxFQUFDLENBQUM7QUFDM0QsQ0FBQzs7Ozs7OztBQU1ELE1BQU0sVUFBVSxhQUFhLENBQUMsT0FBNkM7SUFDekUsT0FBTyxFQUFDLElBQUksRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLE9BQU8sQ0FBQyxhQUFhLENBQUMsSUFBSSxFQUFDLENBQUM7QUFDNUQsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7OztBQWdCRCxNQUFNLE9BQU8sdUJBQXVCLEdBQUcsR0FBRzs7Ozs7OztBQU0xQyxNQUFNLFVBQVUsb0JBQW9CLENBQUMsR0FBVztJQUM5QyxPQUFPLEdBQUcsQ0FBQyxPQUFPLENBQUMsdUJBQXVCLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDbkQsQ0FBQzs7Ozs7OztBQUtELE1BQU0sVUFBVSxhQUFhLENBQUksS0FBb0I7SUFDbkQsSUFBSSxLQUFLLFlBQVksUUFBUSxFQUFFO1FBQzdCLE9BQU8sS0FBSyxFQUFFLENBQUM7S0FDaEI7U0FBTTtRQUNMLE9BQU8sS0FBSyxDQUFDO0tBQ2Q7QUFDSCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge2Fzc2VydERlZmluZWR9IGZyb20gJy4uLy4uL3V0aWwvYXNzZXJ0JztcbmltcG9ydCB7Z2xvYmFsfSBmcm9tICcuLi8uLi91dGlsL2dsb2JhbCc7XG5pbXBvcnQge1JFbGVtZW50fSBmcm9tICcuLi9pbnRlcmZhY2VzL3JlbmRlcmVyJztcbmltcG9ydCB7Q09OVEVYVCwgTFZpZXcsIFJvb3RDb250ZXh0fSBmcm9tICcuLi9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHtnZXRSb290Vmlld30gZnJvbSAnLi92aWV3X3RyYXZlcnNhbF91dGlscyc7XG5cbi8qKlxuICogUmV0dXJucyB3aGV0aGVyIHRoZSB2YWx1ZXMgYXJlIGRpZmZlcmVudCBmcm9tIGEgY2hhbmdlIGRldGVjdGlvbiBzdGFuZCBwb2ludC5cbiAqXG4gKiBDb25zdHJhaW50cyBhcmUgcmVsYXhlZCBpbiBjaGVja05vQ2hhbmdlcyBtb2RlLiBTZWUgYGRldk1vZGVFcXVhbGAgZm9yIGRldGFpbHMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpc0RpZmZlcmVudChhOiBhbnksIGI6IGFueSk6IGJvb2xlYW4ge1xuICAvLyBOYU4gaXMgdGhlIG9ubHkgdmFsdWUgdGhhdCBpcyBub3QgZXF1YWwgdG8gaXRzZWxmIHNvIHRoZSBmaXJzdFxuICAvLyB0ZXN0IGNoZWNrcyBpZiBib3RoIGEgYW5kIGIgYXJlIG5vdCBOYU5cbiAgcmV0dXJuICEoYSAhPT0gYSAmJiBiICE9PSBiKSAmJiBhICE9PSBiO1xufVxuXG4vKipcbiAqIFVzZWQgZm9yIHN0cmluZ2lmeSByZW5kZXIgb3V0cHV0IGluIEl2eS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlbmRlclN0cmluZ2lmeSh2YWx1ZTogYW55KTogc3RyaW5nIHtcbiAgaWYgKHR5cGVvZiB2YWx1ZSA9PSAnZnVuY3Rpb24nKSByZXR1cm4gdmFsdWUubmFtZSB8fCB2YWx1ZTtcbiAgaWYgKHR5cGVvZiB2YWx1ZSA9PSAnc3RyaW5nJykgcmV0dXJuIHZhbHVlO1xuICBpZiAodmFsdWUgPT0gbnVsbCkgcmV0dXJuICcnO1xuICBpZiAodHlwZW9mIHZhbHVlID09ICdvYmplY3QnICYmIHR5cGVvZiB2YWx1ZS50eXBlID09ICdmdW5jdGlvbicpXG4gICAgcmV0dXJuIHZhbHVlLnR5cGUubmFtZSB8fCB2YWx1ZS50eXBlO1xuICByZXR1cm4gJycgKyB2YWx1ZTtcbn1cblxuXG5leHBvcnQgY29uc3QgZGVmYXVsdFNjaGVkdWxlciA9XG4gICAgKHR5cGVvZiByZXF1ZXN0QW5pbWF0aW9uRnJhbWUgIT09ICd1bmRlZmluZWQnICYmIHJlcXVlc3RBbmltYXRpb25GcmFtZSB8fCAgLy8gYnJvd3NlciBvbmx5XG4gICAgIHNldFRpbWVvdXQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gZXZlcnl0aGluZyBlbHNlXG4gICAgICkuYmluZChnbG9iYWwpO1xuXG4vKipcbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtXJlc29sdmVXaW5kb3coZWxlbWVudDogUkVsZW1lbnQgJiB7b3duZXJEb2N1bWVudDogRG9jdW1lbnR9KSB7XG4gIHJldHVybiB7bmFtZTogJ3dpbmRvdycsIHRhcmdldDogZWxlbWVudC5vd25lckRvY3VtZW50LmRlZmF1bHRWaWV3fTtcbn1cblxuLyoqXG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVyZXNvbHZlRG9jdW1lbnQoZWxlbWVudDogUkVsZW1lbnQgJiB7b3duZXJEb2N1bWVudDogRG9jdW1lbnR9KSB7XG4gIHJldHVybiB7bmFtZTogJ2RvY3VtZW50JywgdGFyZ2V0OiBlbGVtZW50Lm93bmVyRG9jdW1lbnR9O1xufVxuXG4vKipcbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtXJlc29sdmVCb2R5KGVsZW1lbnQ6IFJFbGVtZW50ICYge293bmVyRG9jdW1lbnQ6IERvY3VtZW50fSkge1xuICByZXR1cm4ge25hbWU6ICdib2R5JywgdGFyZ2V0OiBlbGVtZW50Lm93bmVyRG9jdW1lbnQuYm9keX07XG59XG5cbi8qKlxuICogVGhlIHNwZWNpYWwgZGVsaW1pdGVyIHdlIHVzZSB0byBzZXBhcmF0ZSBwcm9wZXJ0eSBuYW1lcywgcHJlZml4ZXMsIGFuZCBzdWZmaXhlc1xuICogaW4gcHJvcGVydHkgYmluZGluZyBtZXRhZGF0YS4gU2VlIHN0b3JlQmluZGluZ01ldGFkYXRhKCkuXG4gKlxuICogV2UgaW50ZW50aW9uYWxseSB1c2UgdGhlIFVuaWNvZGUgXCJSRVBMQUNFTUVOVCBDSEFSQUNURVJcIiAoVStGRkZEKSBhcyBhIGRlbGltaXRlclxuICogYmVjYXVzZSBpdCBpcyBhIHZlcnkgdW5jb21tb24gY2hhcmFjdGVyIHRoYXQgaXMgdW5saWtlbHkgdG8gYmUgcGFydCBvZiBhIHVzZXInc1xuICogcHJvcGVydHkgbmFtZXMgb3IgaW50ZXJwb2xhdGlvbiBzdHJpbmdzLiBJZiBpdCBpcyBpbiBmYWN0IHVzZWQgaW4gYSBwcm9wZXJ0eVxuICogYmluZGluZywgRGVidWdFbGVtZW50LnByb3BlcnRpZXMgd2lsbCBub3QgcmV0dXJuIHRoZSBjb3JyZWN0IHZhbHVlIGZvciB0aGF0XG4gKiBiaW5kaW5nLiBIb3dldmVyLCB0aGVyZSBzaG91bGQgYmUgbm8gcnVudGltZSBlZmZlY3QgZm9yIHJlYWwgYXBwbGljYXRpb25zLlxuICpcbiAqIFRoaXMgY2hhcmFjdGVyIGlzIHR5cGljYWxseSByZW5kZXJlZCBhcyBhIHF1ZXN0aW9uIG1hcmsgaW5zaWRlIG9mIGEgZGlhbW9uZC5cbiAqIFNlZSBodHRwczovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9TcGVjaWFsc18oVW5pY29kZV9ibG9jaylcbiAqXG4gKi9cbmV4cG9ydCBjb25zdCBJTlRFUlBPTEFUSU9OX0RFTElNSVRFUiA9IGDvv71gO1xuXG4vKipcbiAqIERldGVybWluZXMgd2hldGhlciBvciBub3QgdGhlIGdpdmVuIHN0cmluZyBpcyBhIHByb3BlcnR5IG1ldGFkYXRhIHN0cmluZy5cbiAqIFNlZSBzdG9yZUJpbmRpbmdNZXRhZGF0YSgpLlxuICovXG5leHBvcnQgZnVuY3Rpb24gaXNQcm9wTWV0YWRhdGFTdHJpbmcoc3RyOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgcmV0dXJuIHN0ci5pbmRleE9mKElOVEVSUE9MQVRJT05fREVMSU1JVEVSKSA+PSAwO1xufVxuXG4vKipcbiAqIFVud3JhcCBhIHZhbHVlIHdoaWNoIG1pZ2h0IGJlIGJlaGluZCBhIGNsb3N1cmUgKGZvciBmb3J3YXJkIGRlY2xhcmF0aW9uIHJlYXNvbnMpLlxuICovXG5leHBvcnQgZnVuY3Rpb24gbWF5YmVVbndyYXBGbjxUPih2YWx1ZTogVCB8ICgoKSA9PiBUKSk6IFQge1xuICBpZiAodmFsdWUgaW5zdGFuY2VvZiBGdW5jdGlvbikge1xuICAgIHJldHVybiB2YWx1ZSgpO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiB2YWx1ZTtcbiAgfVxufVxuIl19