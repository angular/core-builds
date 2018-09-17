/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,uselessCode} checked by tsc
 */
import { devModeEqual } from '../change_detection/change_detection_util';
import { assertLessThan } from './assert';
import { HEADER_OFFSET } from './interfaces/view';
/**
 * Returns wether the values are different from a change detection stand point.
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvdXRpbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7O0FBT0EsT0FBTyxFQUFDLFlBQVksRUFBQyxNQUFNLDJDQUEyQyxDQUFDO0FBQ3ZFLE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFFeEMsT0FBTyxFQUFDLGFBQWEsRUFBbUIsTUFBTSxtQkFBbUIsQ0FBQzs7Ozs7Ozs7OztBQU9sRSxNQUFNLFVBQVUsV0FBVyxDQUFDLENBQU0sRUFBRSxDQUFNLEVBQUUsa0JBQTJCO0lBQ3JFLElBQUksU0FBUyxJQUFJLGtCQUFrQixFQUFFO1FBQ25DLE9BQU8sQ0FBQyxZQUFZLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO0tBQzVCOzs7SUFHRCxPQUFPLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO0NBQ3pDOzs7OztBQUVELE1BQU0sVUFBVSxTQUFTLENBQUMsS0FBVTtJQUNsQyxJQUFJLE9BQU8sS0FBSyxJQUFJLFVBQVU7UUFBRSxPQUFPLEtBQUssQ0FBQyxJQUFJLElBQUksS0FBSyxDQUFDO0lBQzNELElBQUksT0FBTyxLQUFLLElBQUksUUFBUTtRQUFFLE9BQU8sS0FBSyxDQUFDO0lBQzNDLElBQUksS0FBSyxJQUFJLElBQUk7UUFBRSxPQUFPLEVBQUUsQ0FBQztJQUM3QixPQUFPLEVBQUUsR0FBRyxLQUFLLENBQUM7Q0FDbkI7Ozs7Ozs7QUFRRCxNQUFNLFVBQVUsY0FBYztJQUM1QixPQUFPLElBQUksS0FBSyxDQUFDLGdCQUFnQixDQUFDLENBQUM7Q0FDcEM7Ozs7OztBQUtELE1BQU0sVUFBVSxPQUFPLENBQUMsSUFBVzs7SUFDakMsTUFBTSxNQUFNLEdBQVUsRUFBRSxDQUFDOztJQUN6QixJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7SUFFVixPQUFPLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxFQUFFOztRQUN0QixNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDckIsSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxFQUFFO1lBQ3ZCLElBQUksSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUU7Z0JBQ25CLElBQUksR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ3RDLENBQUMsR0FBRyxDQUFDLENBQUM7YUFDUDtpQkFBTTtnQkFDTCxDQUFDLEVBQUUsQ0FBQzthQUNMO1NBQ0Y7YUFBTTtZQUNMLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDbEIsQ0FBQyxFQUFFLENBQUM7U0FDTDtLQUNGO0lBRUQsT0FBTyxNQUFNLENBQUM7Q0FDZjs7Ozs7Ozs7QUFHRCxNQUFNLFVBQVUsWUFBWSxDQUFJLEtBQWEsRUFBRSxHQUFzQjtJQUNuRSxTQUFTLElBQUkseUJBQXlCLENBQUMsS0FBSyxHQUFHLGFBQWEsRUFBRSxHQUFHLENBQUMsQ0FBQztJQUNuRSxPQUFPLEdBQUcsQ0FBQyxLQUFLLEdBQUcsYUFBYSxDQUFDLENBQUM7Q0FDbkM7Ozs7OztBQUVELE1BQU0sVUFBVSx5QkFBeUIsQ0FBQyxLQUFhLEVBQUUsR0FBVTtJQUNqRSxjQUFjLENBQUMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLHlDQUF5QyxDQUFDLENBQUM7Q0FDeEY7Ozs7Ozs7Ozs7QUFPRCxNQUFNLFVBQVUsbUJBQW1CLENBQUMsS0FBYSxFQUFFLEdBQWM7O0lBQy9ELE1BQU0sS0FBSyxHQUFHLFlBQVksQ0FBZSxLQUFLLEVBQUUsR0FBRyxDQUFDLENBQUM7SUFDckQsT0FBTyxnQkFBZ0IsQ0FBQyxLQUFLLENBQUMsQ0FBQztDQUNoQzs7Ozs7QUFFRCxNQUFNLFVBQVUsZ0JBQWdCLENBQUMsS0FBMkI7SUFDMUQseUJBQU8sQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxvQkFBQyxLQUFZLEdBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFpQixFQUFDO0NBQ3BGIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0IHtkZXZNb2RlRXF1YWx9IGZyb20gJy4uL2NoYW5nZV9kZXRlY3Rpb24vY2hhbmdlX2RldGVjdGlvbl91dGlsJztcbmltcG9ydCB7YXNzZXJ0TGVzc1RoYW59IGZyb20gJy4vYXNzZXJ0JztcbmltcG9ydCB7TEVsZW1lbnROb2RlfSBmcm9tICcuL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge0hFQURFUl9PRkZTRVQsIExWaWV3RGF0YSwgVERhdGF9IGZyb20gJy4vaW50ZXJmYWNlcy92aWV3JztcblxuLyoqXG4gKiBSZXR1cm5zIHdldGhlciB0aGUgdmFsdWVzIGFyZSBkaWZmZXJlbnQgZnJvbSBhIGNoYW5nZSBkZXRlY3Rpb24gc3RhbmQgcG9pbnQuXG4gKlxuICogQ29uc3RyYWludHMgYXJlIHJlbGF4ZWQgaW4gY2hlY2tOb0NoYW5nZXMgbW9kZS4gU2VlIGBkZXZNb2RlRXF1YWxgIGZvciBkZXRhaWxzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gaXNEaWZmZXJlbnQoYTogYW55LCBiOiBhbnksIGNoZWNrTm9DaGFuZ2VzTW9kZTogYm9vbGVhbik6IGJvb2xlYW4ge1xuICBpZiAobmdEZXZNb2RlICYmIGNoZWNrTm9DaGFuZ2VzTW9kZSkge1xuICAgIHJldHVybiAhZGV2TW9kZUVxdWFsKGEsIGIpO1xuICB9XG4gIC8vIE5hTiBpcyB0aGUgb25seSB2YWx1ZSB0aGF0IGlzIG5vdCBlcXVhbCB0byBpdHNlbGYgc28gdGhlIGZpcnN0XG4gIC8vIHRlc3QgY2hlY2tzIGlmIGJvdGggYSBhbmQgYiBhcmUgbm90IE5hTlxuICByZXR1cm4gIShhICE9PSBhICYmIGIgIT09IGIpICYmIGEgIT09IGI7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzdHJpbmdpZnkodmFsdWU6IGFueSk6IHN0cmluZyB7XG4gIGlmICh0eXBlb2YgdmFsdWUgPT0gJ2Z1bmN0aW9uJykgcmV0dXJuIHZhbHVlLm5hbWUgfHwgdmFsdWU7XG4gIGlmICh0eXBlb2YgdmFsdWUgPT0gJ3N0cmluZycpIHJldHVybiB2YWx1ZTtcbiAgaWYgKHZhbHVlID09IG51bGwpIHJldHVybiAnJztcbiAgcmV0dXJuICcnICsgdmFsdWU7XG59XG5cbi8qKlxuICogIEZ1bmN0aW9uIHRoYXQgdGhyb3dzIGEgXCJub3QgaW1wbGVtZW50ZWRcIiBlcnJvciBzbyBpdCdzIGNsZWFyIGNlcnRhaW5cbiAqICBiZWhhdmlvcnMvbWV0aG9kcyBhcmVuJ3QgeWV0IHJlYWR5LlxuICpcbiAqIEByZXR1cm5zIE5vdCBpbXBsZW1lbnRlZCBlcnJvclxuICovXG5leHBvcnQgZnVuY3Rpb24gbm90SW1wbGVtZW50ZWQoKTogRXJyb3Ige1xuICByZXR1cm4gbmV3IEVycm9yKCdOb3RJbXBsZW1lbnRlZCcpO1xufVxuXG4vKipcbiAqIEZsYXR0ZW5zIGFuIGFycmF5IGluIG5vbi1yZWN1cnNpdmUgd2F5LiBJbnB1dCBhcnJheXMgYXJlIG5vdCBtb2RpZmllZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGZsYXR0ZW4obGlzdDogYW55W10pOiBhbnlbXSB7XG4gIGNvbnN0IHJlc3VsdDogYW55W10gPSBbXTtcbiAgbGV0IGkgPSAwO1xuXG4gIHdoaWxlIChpIDwgbGlzdC5sZW5ndGgpIHtcbiAgICBjb25zdCBpdGVtID0gbGlzdFtpXTtcbiAgICBpZiAoQXJyYXkuaXNBcnJheShpdGVtKSkge1xuICAgICAgaWYgKGl0ZW0ubGVuZ3RoID4gMCkge1xuICAgICAgICBsaXN0ID0gaXRlbS5jb25jYXQobGlzdC5zbGljZShpICsgMSkpO1xuICAgICAgICBpID0gMDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGkrKztcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgcmVzdWx0LnB1c2goaXRlbSk7XG4gICAgICBpKys7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuLyoqIFJldHJpZXZlcyBhIHZhbHVlIGZyb20gYW55IGBMVmlld0RhdGFgIG9yIGBURGF0YWAuICovXG5leHBvcnQgZnVuY3Rpb24gbG9hZEludGVybmFsPFQ+KGluZGV4OiBudW1iZXIsIGFycjogTFZpZXdEYXRhIHwgVERhdGEpOiBUIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERhdGFJblJhbmdlSW50ZXJuYWwoaW5kZXggKyBIRUFERVJfT0ZGU0VULCBhcnIpO1xuICByZXR1cm4gYXJyW2luZGV4ICsgSEVBREVSX09GRlNFVF07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhc3NlcnREYXRhSW5SYW5nZUludGVybmFsKGluZGV4OiBudW1iZXIsIGFycjogYW55W10pIHtcbiAgYXNzZXJ0TGVzc1RoYW4oaW5kZXgsIGFyciA/IGFyci5sZW5ndGggOiAwLCAnaW5kZXggZXhwZWN0ZWQgdG8gYmUgYSB2YWxpZCBkYXRhIGluZGV4Jyk7XG59XG5cbi8qKiBSZXRyaWV2ZXMgYW4gZWxlbWVudCB2YWx1ZSBmcm9tIHRoZSBwcm92aWRlZCBgdmlld0RhdGFgLlxuICAqXG4gICogRWxlbWVudHMgdGhhdCBhcmUgcmVhZCBtYXkgYmUgd3JhcHBlZCBpbiBhIHN0eWxlIGNvbnRleHQsXG4gICogdGhlcmVmb3JlIHJlYWRpbmcgdGhlIHZhbHVlIG1heSBpbnZvbHZlIHVud3JhcHBpbmcgdGhhdC5cbiAgKi9cbmV4cG9ydCBmdW5jdGlvbiBsb2FkRWxlbWVudEludGVybmFsKGluZGV4OiBudW1iZXIsIGFycjogTFZpZXdEYXRhKTogTEVsZW1lbnROb2RlIHtcbiAgY29uc3QgdmFsdWUgPSBsb2FkSW50ZXJuYWw8TEVsZW1lbnROb2RlPihpbmRleCwgYXJyKTtcbiAgcmV0dXJuIHJlYWRFbGVtZW50VmFsdWUodmFsdWUpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcmVhZEVsZW1lbnRWYWx1ZSh2YWx1ZTogTEVsZW1lbnROb2RlIHwgYW55W10pOiBMRWxlbWVudE5vZGUge1xuICByZXR1cm4gKEFycmF5LmlzQXJyYXkodmFsdWUpID8gKHZhbHVlIGFzIGFueSBhcyBhbnlbXSlbMF0gOiB2YWx1ZSkgYXMgTEVsZW1lbnROb2RlO1xufVxuIl19