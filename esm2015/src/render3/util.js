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
 * Retrieves a value from any `LViewData`.
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvdXRpbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7O0FBT0EsT0FBTyxFQUFDLFlBQVksRUFBQyxNQUFNLDJDQUEyQyxDQUFDO0FBQ3ZFLE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFFeEMsT0FBTyxFQUFDLGFBQWEsRUFBWSxNQUFNLG1CQUFtQixDQUFDOzs7Ozs7Ozs7O0FBTzNELE1BQU0sVUFBVSxXQUFXLENBQUMsQ0FBTSxFQUFFLENBQU0sRUFBRSxrQkFBMkI7SUFDckUsSUFBSSxTQUFTLElBQUksa0JBQWtCLEVBQUU7UUFDbkMsT0FBTyxDQUFDLFlBQVksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7S0FDNUI7OztJQUdELE9BQU8sQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7Q0FDekM7Ozs7O0FBRUQsTUFBTSxVQUFVLFNBQVMsQ0FBQyxLQUFVO0lBQ2xDLElBQUksT0FBTyxLQUFLLElBQUksVUFBVTtRQUFFLE9BQU8sS0FBSyxDQUFDLElBQUksSUFBSSxLQUFLLENBQUM7SUFDM0QsSUFBSSxPQUFPLEtBQUssSUFBSSxRQUFRO1FBQUUsT0FBTyxLQUFLLENBQUM7SUFDM0MsSUFBSSxLQUFLLElBQUksSUFBSTtRQUFFLE9BQU8sRUFBRSxDQUFDO0lBQzdCLE9BQU8sRUFBRSxHQUFHLEtBQUssQ0FBQztDQUNuQjs7Ozs7OztBQVFELE1BQU0sVUFBVSxjQUFjO0lBQzVCLE9BQU8sSUFBSSxLQUFLLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztDQUNwQzs7Ozs7O0FBS0QsTUFBTSxVQUFVLE9BQU8sQ0FBQyxJQUFXOztJQUNqQyxNQUFNLE1BQU0sR0FBVSxFQUFFLENBQUM7O0lBQ3pCLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUVWLE9BQU8sQ0FBQyxHQUFHLElBQUksQ0FBQyxNQUFNLEVBQUU7O1FBQ3RCLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNyQixJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEVBQUU7WUFDdkIsSUFBSSxJQUFJLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRTtnQkFDbkIsSUFBSSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDdEMsQ0FBQyxHQUFHLENBQUMsQ0FBQzthQUNQO2lCQUFNO2dCQUNMLENBQUMsRUFBRSxDQUFDO2FBQ0w7U0FDRjthQUFNO1lBQ0wsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNsQixDQUFDLEVBQUUsQ0FBQztTQUNMO0tBQ0Y7SUFFRCxPQUFPLE1BQU0sQ0FBQztDQUNmOzs7Ozs7OztBQUdELE1BQU0sVUFBVSxZQUFZLENBQUksS0FBYSxFQUFFLEdBQWM7SUFDM0QsU0FBUyxJQUFJLHlCQUF5QixDQUFDLEtBQUssR0FBRyxhQUFhLEVBQUUsR0FBRyxDQUFDLENBQUM7SUFDbkUsT0FBTyxHQUFHLENBQUMsS0FBSyxHQUFHLGFBQWEsQ0FBQyxDQUFDO0NBQ25DOzs7Ozs7QUFFRCxNQUFNLFVBQVUseUJBQXlCLENBQUMsS0FBYSxFQUFFLEdBQVU7SUFDakUsY0FBYyxDQUFDLEtBQUssRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSx5Q0FBeUMsQ0FBQyxDQUFDO0NBQ3hGOzs7Ozs7Ozs7O0FBT0QsTUFBTSxVQUFVLG1CQUFtQixDQUFDLEtBQWEsRUFBRSxHQUFjOztJQUMvRCxNQUFNLEtBQUssR0FBRyxZQUFZLENBQWUsS0FBSyxFQUFFLEdBQUcsQ0FBQyxDQUFDO0lBQ3JELE9BQU8sZ0JBQWdCLENBQUMsS0FBSyxDQUFDLENBQUM7Q0FDaEM7Ozs7O0FBRUQsTUFBTSxVQUFVLGdCQUFnQixDQUFDLEtBQTJCO0lBQzFELHlCQUFPLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsb0JBQUMsS0FBWSxHQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBaUIsRUFBQztDQUNwRiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cbmltcG9ydCB7ZGV2TW9kZUVxdWFsfSBmcm9tICcuLi9jaGFuZ2VfZGV0ZWN0aW9uL2NoYW5nZV9kZXRlY3Rpb25fdXRpbCc7XG5pbXBvcnQge2Fzc2VydExlc3NUaGFufSBmcm9tICcuL2Fzc2VydCc7XG5pbXBvcnQge0xFbGVtZW50Tm9kZX0gZnJvbSAnLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtIRUFERVJfT0ZGU0VULCBMVmlld0RhdGF9IGZyb20gJy4vaW50ZXJmYWNlcy92aWV3JztcblxuLyoqXG4gKiBSZXR1cm5zIHdldGhlciB0aGUgdmFsdWVzIGFyZSBkaWZmZXJlbnQgZnJvbSBhIGNoYW5nZSBkZXRlY3Rpb24gc3RhbmQgcG9pbnQuXG4gKlxuICogQ29uc3RyYWludHMgYXJlIHJlbGF4ZWQgaW4gY2hlY2tOb0NoYW5nZXMgbW9kZS4gU2VlIGBkZXZNb2RlRXF1YWxgIGZvciBkZXRhaWxzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gaXNEaWZmZXJlbnQoYTogYW55LCBiOiBhbnksIGNoZWNrTm9DaGFuZ2VzTW9kZTogYm9vbGVhbik6IGJvb2xlYW4ge1xuICBpZiAobmdEZXZNb2RlICYmIGNoZWNrTm9DaGFuZ2VzTW9kZSkge1xuICAgIHJldHVybiAhZGV2TW9kZUVxdWFsKGEsIGIpO1xuICB9XG4gIC8vIE5hTiBpcyB0aGUgb25seSB2YWx1ZSB0aGF0IGlzIG5vdCBlcXVhbCB0byBpdHNlbGYgc28gdGhlIGZpcnN0XG4gIC8vIHRlc3QgY2hlY2tzIGlmIGJvdGggYSBhbmQgYiBhcmUgbm90IE5hTlxuICByZXR1cm4gIShhICE9PSBhICYmIGIgIT09IGIpICYmIGEgIT09IGI7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzdHJpbmdpZnkodmFsdWU6IGFueSk6IHN0cmluZyB7XG4gIGlmICh0eXBlb2YgdmFsdWUgPT0gJ2Z1bmN0aW9uJykgcmV0dXJuIHZhbHVlLm5hbWUgfHwgdmFsdWU7XG4gIGlmICh0eXBlb2YgdmFsdWUgPT0gJ3N0cmluZycpIHJldHVybiB2YWx1ZTtcbiAgaWYgKHZhbHVlID09IG51bGwpIHJldHVybiAnJztcbiAgcmV0dXJuICcnICsgdmFsdWU7XG59XG5cbi8qKlxuICogIEZ1bmN0aW9uIHRoYXQgdGhyb3dzIGEgXCJub3QgaW1wbGVtZW50ZWRcIiBlcnJvciBzbyBpdCdzIGNsZWFyIGNlcnRhaW5cbiAqICBiZWhhdmlvcnMvbWV0aG9kcyBhcmVuJ3QgeWV0IHJlYWR5LlxuICpcbiAqIEByZXR1cm5zIE5vdCBpbXBsZW1lbnRlZCBlcnJvclxuICovXG5leHBvcnQgZnVuY3Rpb24gbm90SW1wbGVtZW50ZWQoKTogRXJyb3Ige1xuICByZXR1cm4gbmV3IEVycm9yKCdOb3RJbXBsZW1lbnRlZCcpO1xufVxuXG4vKipcbiAqIEZsYXR0ZW5zIGFuIGFycmF5IGluIG5vbi1yZWN1cnNpdmUgd2F5LiBJbnB1dCBhcnJheXMgYXJlIG5vdCBtb2RpZmllZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGZsYXR0ZW4obGlzdDogYW55W10pOiBhbnlbXSB7XG4gIGNvbnN0IHJlc3VsdDogYW55W10gPSBbXTtcbiAgbGV0IGkgPSAwO1xuXG4gIHdoaWxlIChpIDwgbGlzdC5sZW5ndGgpIHtcbiAgICBjb25zdCBpdGVtID0gbGlzdFtpXTtcbiAgICBpZiAoQXJyYXkuaXNBcnJheShpdGVtKSkge1xuICAgICAgaWYgKGl0ZW0ubGVuZ3RoID4gMCkge1xuICAgICAgICBsaXN0ID0gaXRlbS5jb25jYXQobGlzdC5zbGljZShpICsgMSkpO1xuICAgICAgICBpID0gMDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGkrKztcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgcmVzdWx0LnB1c2goaXRlbSk7XG4gICAgICBpKys7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuLyoqIFJldHJpZXZlcyBhIHZhbHVlIGZyb20gYW55IGBMVmlld0RhdGFgLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGxvYWRJbnRlcm5hbDxUPihpbmRleDogbnVtYmVyLCBhcnI6IExWaWV3RGF0YSk6IFQge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGF0YUluUmFuZ2VJbnRlcm5hbChpbmRleCArIEhFQURFUl9PRkZTRVQsIGFycik7XG4gIHJldHVybiBhcnJbaW5kZXggKyBIRUFERVJfT0ZGU0VUXTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGFzc2VydERhdGFJblJhbmdlSW50ZXJuYWwoaW5kZXg6IG51bWJlciwgYXJyOiBhbnlbXSkge1xuICBhc3NlcnRMZXNzVGhhbihpbmRleCwgYXJyID8gYXJyLmxlbmd0aCA6IDAsICdpbmRleCBleHBlY3RlZCB0byBiZSBhIHZhbGlkIGRhdGEgaW5kZXgnKTtcbn1cblxuLyoqIFJldHJpZXZlcyBhbiBlbGVtZW50IHZhbHVlIGZyb20gdGhlIHByb3ZpZGVkIGB2aWV3RGF0YWAuXG4gICpcbiAgKiBFbGVtZW50cyB0aGF0IGFyZSByZWFkIG1heSBiZSB3cmFwcGVkIGluIGEgc3R5bGUgY29udGV4dCxcbiAgKiB0aGVyZWZvcmUgcmVhZGluZyB0aGUgdmFsdWUgbWF5IGludm9sdmUgdW53cmFwcGluZyB0aGF0LlxuICAqL1xuZXhwb3J0IGZ1bmN0aW9uIGxvYWRFbGVtZW50SW50ZXJuYWwoaW5kZXg6IG51bWJlciwgYXJyOiBMVmlld0RhdGEpOiBMRWxlbWVudE5vZGUge1xuICBjb25zdCB2YWx1ZSA9IGxvYWRJbnRlcm5hbDxMRWxlbWVudE5vZGU+KGluZGV4LCBhcnIpO1xuICByZXR1cm4gcmVhZEVsZW1lbnRWYWx1ZSh2YWx1ZSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZWFkRWxlbWVudFZhbHVlKHZhbHVlOiBMRWxlbWVudE5vZGUgfCBhbnlbXSk6IExFbGVtZW50Tm9kZSB7XG4gIHJldHVybiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkgPyAodmFsdWUgYXMgYW55IGFzIGFueVtdKVswXSA6IHZhbHVlKSBhcyBMRWxlbWVudE5vZGU7XG59XG4iXX0=