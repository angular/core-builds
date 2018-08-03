/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { devModeEqual } from '../change_detection/change_detection';
import { assertLessThan } from './assert';
import { HEADER_OFFSET } from './interfaces/view';
/**
 * Returns wether the values are different from a change detection stand point.
 *
 * Constraints are relaxed in checkNoChanges mode. See `devModeEqual` for details.
 */
export function isDifferent(a, b, checkNoChangesMode) {
    if (ngDevMode && checkNoChangesMode) {
        return !devModeEqual(a, b);
    }
    // NaN is the only value that is not equal to itself so the first
    // test checks if both a and b are not NaN
    return !(a !== a && b !== b) && a !== b;
}
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
 * @returns Not implemented error
 */
export function notImplemented() {
    return new Error('NotImplemented');
}
/**
 * Flattens an array in non-recursive way. Input arrays are not modified.
 */
export function flatten(list) {
    const result = [];
    let i = 0;
    while (i < list.length) {
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
/** Retrieves a value from any `LViewData`. */
export function loadInternal(index, arr) {
    ngDevMode && assertDataInRangeInternal(index + HEADER_OFFSET, arr);
    return arr[index + HEADER_OFFSET];
}
export function assertDataInRangeInternal(index, arr) {
    assertLessThan(index, arr ? arr.length : 0, 'index expected to be a valid data index');
}
/** Retrieves an element value from the provided `viewData`.
  *
  * Elements that are read may be wrapped in a style context,
  * therefore reading the value may involve unwrapping that.
  */
export function loadElementInternal(index, arr) {
    const value = loadInternal(index, arr);
    return readElementValue(value);
}
export function readElementValue(value) {
    return (Array.isArray(value) ? value[0] : value);
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvdXRpbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFDSCxPQUFPLEVBQUMsWUFBWSxFQUFDLE1BQU0sc0NBQXNDLENBQUM7QUFDbEUsT0FBTyxFQUFDLGNBQWMsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUV4QyxPQUFPLEVBQUMsYUFBYSxFQUFZLE1BQU0sbUJBQW1CLENBQUM7QUFFM0Q7Ozs7R0FJRztBQUNILE1BQU0sc0JBQXNCLENBQU0sRUFBRSxDQUFNLEVBQUUsa0JBQTJCO0lBQ3JFLElBQUksU0FBUyxJQUFJLGtCQUFrQixFQUFFO1FBQ25DLE9BQU8sQ0FBQyxZQUFZLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO0tBQzVCO0lBQ0QsaUVBQWlFO0lBQ2pFLDBDQUEwQztJQUMxQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQzFDLENBQUM7QUFFRCxNQUFNLG9CQUFvQixLQUFVO0lBQ2xDLElBQUksT0FBTyxLQUFLLElBQUksVUFBVTtRQUFFLE9BQU8sS0FBSyxDQUFDLElBQUksSUFBSSxLQUFLLENBQUM7SUFDM0QsSUFBSSxPQUFPLEtBQUssSUFBSSxRQUFRO1FBQUUsT0FBTyxLQUFLLENBQUM7SUFDM0MsSUFBSSxLQUFLLElBQUksSUFBSTtRQUFFLE9BQU8sRUFBRSxDQUFDO0lBQzdCLE9BQU8sRUFBRSxHQUFHLEtBQUssQ0FBQztBQUNwQixDQUFDO0FBRUQ7Ozs7O0dBS0c7QUFDSCxNQUFNO0lBQ0osT0FBTyxJQUFJLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO0FBQ3JDLENBQUM7QUFFRDs7R0FFRztBQUNILE1BQU0sa0JBQWtCLElBQVc7SUFDakMsTUFBTSxNQUFNLEdBQVUsRUFBRSxDQUFDO0lBQ3pCLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUVWLE9BQU8sQ0FBQyxHQUFHLElBQUksQ0FBQyxNQUFNLEVBQUU7UUFDdEIsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3JCLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBRTtZQUN2QixJQUFJLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO2dCQUNuQixJQUFJLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUN0QyxDQUFDLEdBQUcsQ0FBQyxDQUFDO2FBQ1A7aUJBQU07Z0JBQ0wsQ0FBQyxFQUFFLENBQUM7YUFDTDtTQUNGO2FBQU07WUFDTCxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ2xCLENBQUMsRUFBRSxDQUFDO1NBQ0w7S0FDRjtJQUVELE9BQU8sTUFBTSxDQUFDO0FBQ2hCLENBQUM7QUFFRCw4Q0FBOEM7QUFDOUMsTUFBTSx1QkFBMEIsS0FBYSxFQUFFLEdBQWM7SUFDM0QsU0FBUyxJQUFJLHlCQUF5QixDQUFDLEtBQUssR0FBRyxhQUFhLEVBQUUsR0FBRyxDQUFDLENBQUM7SUFDbkUsT0FBTyxHQUFHLENBQUMsS0FBSyxHQUFHLGFBQWEsQ0FBQyxDQUFDO0FBQ3BDLENBQUM7QUFFRCxNQUFNLG9DQUFvQyxLQUFhLEVBQUUsR0FBVTtJQUNqRSxjQUFjLENBQUMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLHlDQUF5QyxDQUFDLENBQUM7QUFDekYsQ0FBQztBQUVEOzs7O0lBSUk7QUFDSixNQUFNLDhCQUE4QixLQUFhLEVBQUUsR0FBYztJQUMvRCxNQUFNLEtBQUssR0FBRyxZQUFZLENBQWUsS0FBSyxFQUFFLEdBQUcsQ0FBQyxDQUFDO0lBQ3JELE9BQU8sZ0JBQWdCLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDakMsQ0FBQztBQUVELE1BQU0sMkJBQTJCLEtBQTJCO0lBQzFELE9BQU8sQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBRSxLQUFzQixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQWlCLENBQUM7QUFDckYsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cbmltcG9ydCB7ZGV2TW9kZUVxdWFsfSBmcm9tICcuLi9jaGFuZ2VfZGV0ZWN0aW9uL2NoYW5nZV9kZXRlY3Rpb24nO1xuaW1wb3J0IHthc3NlcnRMZXNzVGhhbn0gZnJvbSAnLi9hc3NlcnQnO1xuaW1wb3J0IHtMRWxlbWVudE5vZGV9IGZyb20gJy4vaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB7SEVBREVSX09GRlNFVCwgTFZpZXdEYXRhfSBmcm9tICcuL2ludGVyZmFjZXMvdmlldyc7XG5cbi8qKlxuICogUmV0dXJucyB3ZXRoZXIgdGhlIHZhbHVlcyBhcmUgZGlmZmVyZW50IGZyb20gYSBjaGFuZ2UgZGV0ZWN0aW9uIHN0YW5kIHBvaW50LlxuICpcbiAqIENvbnN0cmFpbnRzIGFyZSByZWxheGVkIGluIGNoZWNrTm9DaGFuZ2VzIG1vZGUuIFNlZSBgZGV2TW9kZUVxdWFsYCBmb3IgZGV0YWlscy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzRGlmZmVyZW50KGE6IGFueSwgYjogYW55LCBjaGVja05vQ2hhbmdlc01vZGU6IGJvb2xlYW4pOiBib29sZWFuIHtcbiAgaWYgKG5nRGV2TW9kZSAmJiBjaGVja05vQ2hhbmdlc01vZGUpIHtcbiAgICByZXR1cm4gIWRldk1vZGVFcXVhbChhLCBiKTtcbiAgfVxuICAvLyBOYU4gaXMgdGhlIG9ubHkgdmFsdWUgdGhhdCBpcyBub3QgZXF1YWwgdG8gaXRzZWxmIHNvIHRoZSBmaXJzdFxuICAvLyB0ZXN0IGNoZWNrcyBpZiBib3RoIGEgYW5kIGIgYXJlIG5vdCBOYU5cbiAgcmV0dXJuICEoYSAhPT0gYSAmJiBiICE9PSBiKSAmJiBhICE9PSBiO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc3RyaW5naWZ5KHZhbHVlOiBhbnkpOiBzdHJpbmcge1xuICBpZiAodHlwZW9mIHZhbHVlID09ICdmdW5jdGlvbicpIHJldHVybiB2YWx1ZS5uYW1lIHx8IHZhbHVlO1xuICBpZiAodHlwZW9mIHZhbHVlID09ICdzdHJpbmcnKSByZXR1cm4gdmFsdWU7XG4gIGlmICh2YWx1ZSA9PSBudWxsKSByZXR1cm4gJyc7XG4gIHJldHVybiAnJyArIHZhbHVlO1xufVxuXG4vKipcbiAqICBGdW5jdGlvbiB0aGF0IHRocm93cyBhIFwibm90IGltcGxlbWVudGVkXCIgZXJyb3Igc28gaXQncyBjbGVhciBjZXJ0YWluXG4gKiAgYmVoYXZpb3JzL21ldGhvZHMgYXJlbid0IHlldCByZWFkeS5cbiAqXG4gKiBAcmV0dXJucyBOb3QgaW1wbGVtZW50ZWQgZXJyb3JcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG5vdEltcGxlbWVudGVkKCk6IEVycm9yIHtcbiAgcmV0dXJuIG5ldyBFcnJvcignTm90SW1wbGVtZW50ZWQnKTtcbn1cblxuLyoqXG4gKiBGbGF0dGVucyBhbiBhcnJheSBpbiBub24tcmVjdXJzaXZlIHdheS4gSW5wdXQgYXJyYXlzIGFyZSBub3QgbW9kaWZpZWQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBmbGF0dGVuKGxpc3Q6IGFueVtdKTogYW55W10ge1xuICBjb25zdCByZXN1bHQ6IGFueVtdID0gW107XG4gIGxldCBpID0gMDtcblxuICB3aGlsZSAoaSA8IGxpc3QubGVuZ3RoKSB7XG4gICAgY29uc3QgaXRlbSA9IGxpc3RbaV07XG4gICAgaWYgKEFycmF5LmlzQXJyYXkoaXRlbSkpIHtcbiAgICAgIGlmIChpdGVtLmxlbmd0aCA+IDApIHtcbiAgICAgICAgbGlzdCA9IGl0ZW0uY29uY2F0KGxpc3Quc2xpY2UoaSArIDEpKTtcbiAgICAgICAgaSA9IDA7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpKys7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHJlc3VsdC5wdXNoKGl0ZW0pO1xuICAgICAgaSsrO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiByZXN1bHQ7XG59XG5cbi8qKiBSZXRyaWV2ZXMgYSB2YWx1ZSBmcm9tIGFueSBgTFZpZXdEYXRhYC4gKi9cbmV4cG9ydCBmdW5jdGlvbiBsb2FkSW50ZXJuYWw8VD4oaW5kZXg6IG51bWJlciwgYXJyOiBMVmlld0RhdGEpOiBUIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERhdGFJblJhbmdlSW50ZXJuYWwoaW5kZXggKyBIRUFERVJfT0ZGU0VULCBhcnIpO1xuICByZXR1cm4gYXJyW2luZGV4ICsgSEVBREVSX09GRlNFVF07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhc3NlcnREYXRhSW5SYW5nZUludGVybmFsKGluZGV4OiBudW1iZXIsIGFycjogYW55W10pIHtcbiAgYXNzZXJ0TGVzc1RoYW4oaW5kZXgsIGFyciA/IGFyci5sZW5ndGggOiAwLCAnaW5kZXggZXhwZWN0ZWQgdG8gYmUgYSB2YWxpZCBkYXRhIGluZGV4Jyk7XG59XG5cbi8qKiBSZXRyaWV2ZXMgYW4gZWxlbWVudCB2YWx1ZSBmcm9tIHRoZSBwcm92aWRlZCBgdmlld0RhdGFgLlxuICAqXG4gICogRWxlbWVudHMgdGhhdCBhcmUgcmVhZCBtYXkgYmUgd3JhcHBlZCBpbiBhIHN0eWxlIGNvbnRleHQsXG4gICogdGhlcmVmb3JlIHJlYWRpbmcgdGhlIHZhbHVlIG1heSBpbnZvbHZlIHVud3JhcHBpbmcgdGhhdC5cbiAgKi9cbmV4cG9ydCBmdW5jdGlvbiBsb2FkRWxlbWVudEludGVybmFsKGluZGV4OiBudW1iZXIsIGFycjogTFZpZXdEYXRhKTogTEVsZW1lbnROb2RlIHtcbiAgY29uc3QgdmFsdWUgPSBsb2FkSW50ZXJuYWw8TEVsZW1lbnROb2RlPihpbmRleCwgYXJyKTtcbiAgcmV0dXJuIHJlYWRFbGVtZW50VmFsdWUodmFsdWUpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcmVhZEVsZW1lbnRWYWx1ZSh2YWx1ZTogTEVsZW1lbnROb2RlIHwgYW55W10pOiBMRWxlbWVudE5vZGUge1xuICByZXR1cm4gKEFycmF5LmlzQXJyYXkodmFsdWUpID8gKHZhbHVlIGFzIGFueSBhcyBhbnlbXSlbMF0gOiB2YWx1ZSkgYXMgTEVsZW1lbnROb2RlO1xufVxuIl19