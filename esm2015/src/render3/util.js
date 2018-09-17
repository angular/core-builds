/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { devModeEqual } from '../change_detection/change_detection_util';
import { assertLessThan } from './assert';
import { HEADER_OFFSET } from './interfaces/view';
/**
 * Returns whether the values are different from a change detection stand point.
 *
 * Constraints are relaxed in checkNoChanges mode. See `devModeEqual` for details.
 * @param {?} a
 * @param {?} b
 * @param {?} checkNoChangesMode
 * @return {?}
 */
export function isDifferent(a, b, checkNoChangesMode) {
    if (ngDevMode && checkNoChangesMode) {
        return !devModeEqual(a, b);
    }
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
    /** @type {?} */
    const result = [];
    /** @type {?} */
    let i = 0;
    while (i < list.length) {
        /** @type {?} */
        const item = list[i];
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
/**
 * Retrieves a value from any `LViewData` or `TData`.
 * @template T
 * @param {?} index
 * @param {?} arr
 * @return {?}
 */
export function loadInternal(index, arr) {
    ngDevMode && assertDataInRangeInternal(index + HEADER_OFFSET, arr);
    return arr[index + HEADER_OFFSET];
}
/**
 * @param {?} index
 * @param {?} arr
 * @return {?}
 */
export function assertDataInRangeInternal(index, arr) {
    assertLessThan(index, arr ? arr.length : 0, 'index expected to be a valid data index');
}
/**
 * Retrieves an element value from the provided `viewData`.
 *
 * Elements that are read may be wrapped in a style context,
 * therefore reading the value may involve unwrapping that.
 * @param {?} index
 * @param {?} arr
 * @return {?}
 */
export function loadElementInternal(index, arr) {
    /** @type {?} */
    const value = loadInternal(index, arr);
    return readElementValue(value);
}
/**
 * @param {?} value
 * @return {?}
 */
export function readElementValue(value) {
    return /** @type {?} */ ((Array.isArray(value) ? (/** @type {?} */ ((value)))[0] : value));
}
/**
 * @param {?} tNode
 * @return {?}
 */
export function isContentQueryHost(tNode) {
    return (tNode.flags & 16384 /* hasContentQuery */) !== 0;
}
/**
 * @param {?} tNode
 * @return {?}
 */
export function isComponent(tNode) {
    return (tNode.flags & 4096 /* isComponent */) === 4096 /* isComponent */;
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvdXRpbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQVFBLE9BQU8sRUFBQyxZQUFZLEVBQUMsTUFBTSwyQ0FBMkMsQ0FBQztBQUN2RSxPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0sVUFBVSxDQUFDO0FBRXhDLE9BQU8sRUFBQyxhQUFhLEVBQW1CLE1BQU0sbUJBQW1CLENBQUM7Ozs7Ozs7Ozs7QUFPbEUsTUFBTSxVQUFVLFdBQVcsQ0FBQyxDQUFNLEVBQUUsQ0FBTSxFQUFFLGtCQUEyQjtJQUNyRSxJQUFJLFNBQVMsSUFBSSxrQkFBa0IsRUFBRTtRQUNuQyxPQUFPLENBQUMsWUFBWSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztLQUM1Qjs7O0lBR0QsT0FBTyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztDQUN6Qzs7Ozs7QUFFRCxNQUFNLFVBQVUsU0FBUyxDQUFDLEtBQVU7SUFDbEMsSUFBSSxPQUFPLEtBQUssSUFBSSxVQUFVO1FBQUUsT0FBTyxLQUFLLENBQUMsSUFBSSxJQUFJLEtBQUssQ0FBQztJQUMzRCxJQUFJLE9BQU8sS0FBSyxJQUFJLFFBQVE7UUFBRSxPQUFPLEtBQUssQ0FBQztJQUMzQyxJQUFJLEtBQUssSUFBSSxJQUFJO1FBQUUsT0FBTyxFQUFFLENBQUM7SUFDN0IsT0FBTyxFQUFFLEdBQUcsS0FBSyxDQUFDO0NBQ25COzs7Ozs7O0FBUUQsTUFBTSxVQUFVLGNBQWM7SUFDNUIsT0FBTyxJQUFJLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO0NBQ3BDOzs7Ozs7QUFLRCxNQUFNLFVBQVUsT0FBTyxDQUFDLElBQVc7O0lBQ2pDLE1BQU0sTUFBTSxHQUFVLEVBQUUsQ0FBQzs7SUFDekIsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBRVYsT0FBTyxDQUFDLEdBQUcsSUFBSSxDQUFDLE1BQU0sRUFBRTs7UUFDdEIsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3JCLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBRTtZQUN2QixJQUFJLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO2dCQUNuQixJQUFJLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUN0QyxDQUFDLEdBQUcsQ0FBQyxDQUFDO2FBQ1A7aUJBQU07Z0JBQ0wsQ0FBQyxFQUFFLENBQUM7YUFDTDtTQUNGO2FBQU07WUFDTCxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ2xCLENBQUMsRUFBRSxDQUFDO1NBQ0w7S0FDRjtJQUVELE9BQU8sTUFBTSxDQUFDO0NBQ2Y7Ozs7Ozs7O0FBR0QsTUFBTSxVQUFVLFlBQVksQ0FBSSxLQUFhLEVBQUUsR0FBc0I7SUFDbkUsU0FBUyxJQUFJLHlCQUF5QixDQUFDLEtBQUssR0FBRyxhQUFhLEVBQUUsR0FBRyxDQUFDLENBQUM7SUFDbkUsT0FBTyxHQUFHLENBQUMsS0FBSyxHQUFHLGFBQWEsQ0FBQyxDQUFDO0NBQ25DOzs7Ozs7QUFFRCxNQUFNLFVBQVUseUJBQXlCLENBQUMsS0FBYSxFQUFFLEdBQVU7SUFDakUsY0FBYyxDQUFDLEtBQUssRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSx5Q0FBeUMsQ0FBQyxDQUFDO0NBQ3hGOzs7Ozs7Ozs7O0FBT0QsTUFBTSxVQUFVLG1CQUFtQixDQUFDLEtBQWEsRUFBRSxHQUFjOztJQUMvRCxNQUFNLEtBQUssR0FBRyxZQUFZLENBQWUsS0FBSyxFQUFFLEdBQUcsQ0FBQyxDQUFDO0lBQ3JELE9BQU8sZ0JBQWdCLENBQUMsS0FBSyxDQUFDLENBQUM7Q0FDaEM7Ozs7O0FBRUQsTUFBTSxVQUFVLGdCQUFnQixDQUFDLEtBQTJCO0lBQzFELHlCQUFPLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsb0JBQUMsS0FBWSxHQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBaUIsRUFBQztDQUNwRjs7Ozs7QUFFRCxNQUFNLFVBQVUsa0JBQWtCLENBQUMsS0FBWTtJQUM3QyxPQUFPLENBQUMsS0FBSyxDQUFDLEtBQUssOEJBQTZCLENBQUMsS0FBSyxDQUFDLENBQUM7Q0FDekQ7Ozs7O0FBRUQsTUFBTSxVQUFVLFdBQVcsQ0FBQyxLQUFZO0lBQ3RDLE9BQU8sQ0FBQyxLQUFLLENBQUMsS0FBSyx5QkFBeUIsQ0FBQywyQkFBMkIsQ0FBQztDQUMxRSIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtkZXZNb2RlRXF1YWx9IGZyb20gJy4uL2NoYW5nZV9kZXRlY3Rpb24vY2hhbmdlX2RldGVjdGlvbl91dGlsJztcbmltcG9ydCB7YXNzZXJ0TGVzc1RoYW59IGZyb20gJy4vYXNzZXJ0JztcbmltcG9ydCB7TEVsZW1lbnROb2RlLCBUTm9kZSwgVE5vZGVGbGFnc30gZnJvbSAnLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtIRUFERVJfT0ZGU0VULCBMVmlld0RhdGEsIFREYXRhfSBmcm9tICcuL2ludGVyZmFjZXMvdmlldyc7XG5cbi8qKlxuICogUmV0dXJucyB3aGV0aGVyIHRoZSB2YWx1ZXMgYXJlIGRpZmZlcmVudCBmcm9tIGEgY2hhbmdlIGRldGVjdGlvbiBzdGFuZCBwb2ludC5cbiAqXG4gKiBDb25zdHJhaW50cyBhcmUgcmVsYXhlZCBpbiBjaGVja05vQ2hhbmdlcyBtb2RlLiBTZWUgYGRldk1vZGVFcXVhbGAgZm9yIGRldGFpbHMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpc0RpZmZlcmVudChhOiBhbnksIGI6IGFueSwgY2hlY2tOb0NoYW5nZXNNb2RlOiBib29sZWFuKTogYm9vbGVhbiB7XG4gIGlmIChuZ0Rldk1vZGUgJiYgY2hlY2tOb0NoYW5nZXNNb2RlKSB7XG4gICAgcmV0dXJuICFkZXZNb2RlRXF1YWwoYSwgYik7XG4gIH1cbiAgLy8gTmFOIGlzIHRoZSBvbmx5IHZhbHVlIHRoYXQgaXMgbm90IGVxdWFsIHRvIGl0c2VsZiBzbyB0aGUgZmlyc3RcbiAgLy8gdGVzdCBjaGVja3MgaWYgYm90aCBhIGFuZCBiIGFyZSBub3QgTmFOXG4gIHJldHVybiAhKGEgIT09IGEgJiYgYiAhPT0gYikgJiYgYSAhPT0gYjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHN0cmluZ2lmeSh2YWx1ZTogYW55KTogc3RyaW5nIHtcbiAgaWYgKHR5cGVvZiB2YWx1ZSA9PSAnZnVuY3Rpb24nKSByZXR1cm4gdmFsdWUubmFtZSB8fCB2YWx1ZTtcbiAgaWYgKHR5cGVvZiB2YWx1ZSA9PSAnc3RyaW5nJykgcmV0dXJuIHZhbHVlO1xuICBpZiAodmFsdWUgPT0gbnVsbCkgcmV0dXJuICcnO1xuICByZXR1cm4gJycgKyB2YWx1ZTtcbn1cblxuLyoqXG4gKiAgRnVuY3Rpb24gdGhhdCB0aHJvd3MgYSBcIm5vdCBpbXBsZW1lbnRlZFwiIGVycm9yIHNvIGl0J3MgY2xlYXIgY2VydGFpblxuICogIGJlaGF2aW9ycy9tZXRob2RzIGFyZW4ndCB5ZXQgcmVhZHkuXG4gKlxuICogQHJldHVybnMgTm90IGltcGxlbWVudGVkIGVycm9yXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBub3RJbXBsZW1lbnRlZCgpOiBFcnJvciB7XG4gIHJldHVybiBuZXcgRXJyb3IoJ05vdEltcGxlbWVudGVkJyk7XG59XG5cbi8qKlxuICogRmxhdHRlbnMgYW4gYXJyYXkgaW4gbm9uLXJlY3Vyc2l2ZSB3YXkuIElucHV0IGFycmF5cyBhcmUgbm90IG1vZGlmaWVkLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZmxhdHRlbihsaXN0OiBhbnlbXSk6IGFueVtdIHtcbiAgY29uc3QgcmVzdWx0OiBhbnlbXSA9IFtdO1xuICBsZXQgaSA9IDA7XG5cbiAgd2hpbGUgKGkgPCBsaXN0Lmxlbmd0aCkge1xuICAgIGNvbnN0IGl0ZW0gPSBsaXN0W2ldO1xuICAgIGlmIChBcnJheS5pc0FycmF5KGl0ZW0pKSB7XG4gICAgICBpZiAoaXRlbS5sZW5ndGggPiAwKSB7XG4gICAgICAgIGxpc3QgPSBpdGVtLmNvbmNhdChsaXN0LnNsaWNlKGkgKyAxKSk7XG4gICAgICAgIGkgPSAwO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaSsrO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICByZXN1bHQucHVzaChpdGVtKTtcbiAgICAgIGkrKztcbiAgICB9XG4gIH1cblxuICByZXR1cm4gcmVzdWx0O1xufVxuXG4vKiogUmV0cmlldmVzIGEgdmFsdWUgZnJvbSBhbnkgYExWaWV3RGF0YWAgb3IgYFREYXRhYC4gKi9cbmV4cG9ydCBmdW5jdGlvbiBsb2FkSW50ZXJuYWw8VD4oaW5kZXg6IG51bWJlciwgYXJyOiBMVmlld0RhdGEgfCBURGF0YSk6IFQge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGF0YUluUmFuZ2VJbnRlcm5hbChpbmRleCArIEhFQURFUl9PRkZTRVQsIGFycik7XG4gIHJldHVybiBhcnJbaW5kZXggKyBIRUFERVJfT0ZGU0VUXTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGFzc2VydERhdGFJblJhbmdlSW50ZXJuYWwoaW5kZXg6IG51bWJlciwgYXJyOiBhbnlbXSkge1xuICBhc3NlcnRMZXNzVGhhbihpbmRleCwgYXJyID8gYXJyLmxlbmd0aCA6IDAsICdpbmRleCBleHBlY3RlZCB0byBiZSBhIHZhbGlkIGRhdGEgaW5kZXgnKTtcbn1cblxuLyoqIFJldHJpZXZlcyBhbiBlbGVtZW50IHZhbHVlIGZyb20gdGhlIHByb3ZpZGVkIGB2aWV3RGF0YWAuXG4gICpcbiAgKiBFbGVtZW50cyB0aGF0IGFyZSByZWFkIG1heSBiZSB3cmFwcGVkIGluIGEgc3R5bGUgY29udGV4dCxcbiAgKiB0aGVyZWZvcmUgcmVhZGluZyB0aGUgdmFsdWUgbWF5IGludm9sdmUgdW53cmFwcGluZyB0aGF0LlxuICAqL1xuZXhwb3J0IGZ1bmN0aW9uIGxvYWRFbGVtZW50SW50ZXJuYWwoaW5kZXg6IG51bWJlciwgYXJyOiBMVmlld0RhdGEpOiBMRWxlbWVudE5vZGUge1xuICBjb25zdCB2YWx1ZSA9IGxvYWRJbnRlcm5hbDxMRWxlbWVudE5vZGU+KGluZGV4LCBhcnIpO1xuICByZXR1cm4gcmVhZEVsZW1lbnRWYWx1ZSh2YWx1ZSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZWFkRWxlbWVudFZhbHVlKHZhbHVlOiBMRWxlbWVudE5vZGUgfCBhbnlbXSk6IExFbGVtZW50Tm9kZSB7XG4gIHJldHVybiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkgPyAodmFsdWUgYXMgYW55IGFzIGFueVtdKVswXSA6IHZhbHVlKSBhcyBMRWxlbWVudE5vZGU7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0NvbnRlbnRRdWVyeUhvc3QodE5vZGU6IFROb2RlKTogYm9vbGVhbiB7XG4gIHJldHVybiAodE5vZGUuZmxhZ3MgJiBUTm9kZUZsYWdzLmhhc0NvbnRlbnRRdWVyeSkgIT09IDA7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0NvbXBvbmVudCh0Tm9kZTogVE5vZGUpOiBib29sZWFuIHtcbiAgcmV0dXJuICh0Tm9kZS5mbGFncyAmIFROb2RlRmxhZ3MuaXNDb21wb25lbnQpID09PSBUTm9kZUZsYWdzLmlzQ29tcG9uZW50O1xufVxuIl19