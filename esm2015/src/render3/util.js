/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/**
 * Must use this method for CD (instead of === ) since NaN !== NaN
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
 * @param {?} value
 * @return {?}
 */
export function stringify(value) {
    if (typeof value == 'function')
        return value.name || value;
    if (typeof value == 'string')
        return value;
    if (value == null)
        return '';
    return '' + value;
}
/**
 *  Function that throws a "not implemented" error so it's clear certain
 *  behaviors/methods aren't yet ready.
 *
 * @return {?} Not implemented error
 */
export function notImplemented() {
    return new Error('NotImplemented');
}
/**
 * Flattens an array in non-recursive way. Input arrays are not modified.
 * @param {?} list
 * @return {?}
 */
export function flatten(list) {
    const /** @type {?} */ result = [];
    let /** @type {?} */ i = 0;
    while (i < list.length) {
        const /** @type {?} */ item = list[i];
        if (Array.isArray(item)) {
            if (item.length > 0) {
                list = item.concat(list.slice(i + 1));
                i = 0;
            }
            else {
                i++;
            }
        }
        else {
            result.push(item);
            i++;
        }
    }
    return result;
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvdXRpbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7OztBQVdBLE1BQU0sc0JBQXNCLENBQU0sRUFBRSxDQUFNOzs7SUFHeEMsT0FBTyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztDQUN6Qzs7Ozs7QUFFRCxNQUFNLG9CQUFvQixLQUFVO0lBQ2xDLElBQUksT0FBTyxLQUFLLElBQUksVUFBVTtRQUFFLE9BQU8sS0FBSyxDQUFDLElBQUksSUFBSSxLQUFLLENBQUM7SUFDM0QsSUFBSSxPQUFPLEtBQUssSUFBSSxRQUFRO1FBQUUsT0FBTyxLQUFLLENBQUM7SUFDM0MsSUFBSSxLQUFLLElBQUksSUFBSTtRQUFFLE9BQU8sRUFBRSxDQUFDO0lBQzdCLE9BQU8sRUFBRSxHQUFHLEtBQUssQ0FBQztDQUNuQjs7Ozs7OztBQVFELE1BQU07SUFDSixPQUFPLElBQUksS0FBSyxDQUFDLGdCQUFnQixDQUFDLENBQUM7Q0FDcEM7Ozs7OztBQUtELE1BQU0sa0JBQWtCLElBQVc7SUFDakMsdUJBQU0sTUFBTSxHQUFVLEVBQUUsQ0FBQztJQUN6QixxQkFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBRVYsT0FBTyxDQUFDLEdBQUcsSUFBSSxDQUFDLE1BQU0sRUFBRTtRQUN0Qix1QkFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3JCLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBRTtZQUN2QixJQUFJLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO2dCQUNuQixJQUFJLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUN0QyxDQUFDLEdBQUcsQ0FBQyxDQUFDO2FBQ1A7aUJBQU07Z0JBQ0wsQ0FBQyxFQUFFLENBQUM7YUFDTDtTQUNGO2FBQU07WUFDTCxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ2xCLENBQUMsRUFBRSxDQUFDO1NBQ0w7S0FDRjtJQUVELE9BQU8sTUFBTSxDQUFDO0NBQ2YiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbi8qKlxuKiBNdXN0IHVzZSB0aGlzIG1ldGhvZCBmb3IgQ0QgKGluc3RlYWQgb2YgPT09ICkgc2luY2UgTmFOICE9PSBOYU5cbiovXG5leHBvcnQgZnVuY3Rpb24gaXNEaWZmZXJlbnQoYTogYW55LCBiOiBhbnkpOiBib29sZWFuIHtcbiAgLy8gTmFOIGlzIHRoZSBvbmx5IHZhbHVlIHRoYXQgaXMgbm90IGVxdWFsIHRvIGl0c2VsZiBzbyB0aGUgZmlyc3RcbiAgLy8gdGVzdCBjaGVja3MgaWYgYm90aCBhIGFuZCBiIGFyZSBub3QgTmFOXG4gIHJldHVybiAhKGEgIT09IGEgJiYgYiAhPT0gYikgJiYgYSAhPT0gYjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHN0cmluZ2lmeSh2YWx1ZTogYW55KTogc3RyaW5nIHtcbiAgaWYgKHR5cGVvZiB2YWx1ZSA9PSAnZnVuY3Rpb24nKSByZXR1cm4gdmFsdWUubmFtZSB8fCB2YWx1ZTtcbiAgaWYgKHR5cGVvZiB2YWx1ZSA9PSAnc3RyaW5nJykgcmV0dXJuIHZhbHVlO1xuICBpZiAodmFsdWUgPT0gbnVsbCkgcmV0dXJuICcnO1xuICByZXR1cm4gJycgKyB2YWx1ZTtcbn1cblxuLyoqXG4gKiAgRnVuY3Rpb24gdGhhdCB0aHJvd3MgYSBcIm5vdCBpbXBsZW1lbnRlZFwiIGVycm9yIHNvIGl0J3MgY2xlYXIgY2VydGFpblxuICogIGJlaGF2aW9ycy9tZXRob2RzIGFyZW4ndCB5ZXQgcmVhZHkuXG4gKlxuICogQHJldHVybnMgTm90IGltcGxlbWVudGVkIGVycm9yXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBub3RJbXBsZW1lbnRlZCgpOiBFcnJvciB7XG4gIHJldHVybiBuZXcgRXJyb3IoJ05vdEltcGxlbWVudGVkJyk7XG59XG5cbi8qKlxuICogRmxhdHRlbnMgYW4gYXJyYXkgaW4gbm9uLXJlY3Vyc2l2ZSB3YXkuIElucHV0IGFycmF5cyBhcmUgbm90IG1vZGlmaWVkLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZmxhdHRlbihsaXN0OiBhbnlbXSk6IGFueVtdIHtcbiAgY29uc3QgcmVzdWx0OiBhbnlbXSA9IFtdO1xuICBsZXQgaSA9IDA7XG5cbiAgd2hpbGUgKGkgPCBsaXN0Lmxlbmd0aCkge1xuICAgIGNvbnN0IGl0ZW0gPSBsaXN0W2ldO1xuICAgIGlmIChBcnJheS5pc0FycmF5KGl0ZW0pKSB7XG4gICAgICBpZiAoaXRlbS5sZW5ndGggPiAwKSB7XG4gICAgICAgIGxpc3QgPSBpdGVtLmNvbmNhdChsaXN0LnNsaWNlKGkgKyAxKSk7XG4gICAgICAgIGkgPSAwO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaSsrO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICByZXN1bHQucHVzaChpdGVtKTtcbiAgICAgIGkrKztcbiAgICB9XG4gIH1cblxuICByZXR1cm4gcmVzdWx0O1xufVxuIl19