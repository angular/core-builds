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
    var result = [];
    var i = 0;
    while (i < list.length) {
        var item = list[i];
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
    var value = loadInternal(index, arr);
    return readElementValue(value);
}
export function readElementValue(value) {
    return (Array.isArray(value) ? value[0] : value);
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvdXRpbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFDSCxPQUFPLEVBQUMsWUFBWSxFQUFDLE1BQU0sMkNBQTJDLENBQUM7QUFDdkUsT0FBTyxFQUFDLGNBQWMsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUV4QyxPQUFPLEVBQUMsYUFBYSxFQUFZLE1BQU0sbUJBQW1CLENBQUM7QUFFM0Q7Ozs7R0FJRztBQUNILE1BQU0sVUFBVSxXQUFXLENBQUMsQ0FBTSxFQUFFLENBQU0sRUFBRSxrQkFBMkI7SUFDckUsSUFBSSxTQUFTLElBQUksa0JBQWtCLEVBQUU7UUFDbkMsT0FBTyxDQUFDLFlBQVksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7S0FDNUI7SUFDRCxpRUFBaUU7SUFDakUsMENBQTBDO0lBQzFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDMUMsQ0FBQztBQUVELE1BQU0sVUFBVSxTQUFTLENBQUMsS0FBVTtJQUNsQyxJQUFJLE9BQU8sS0FBSyxJQUFJLFVBQVU7UUFBRSxPQUFPLEtBQUssQ0FBQyxJQUFJLElBQUksS0FBSyxDQUFDO0lBQzNELElBQUksT0FBTyxLQUFLLElBQUksUUFBUTtRQUFFLE9BQU8sS0FBSyxDQUFDO0lBQzNDLElBQUksS0FBSyxJQUFJLElBQUk7UUFBRSxPQUFPLEVBQUUsQ0FBQztJQUM3QixPQUFPLEVBQUUsR0FBRyxLQUFLLENBQUM7QUFDcEIsQ0FBQztBQUVEOzs7OztHQUtHO0FBQ0gsTUFBTSxVQUFVLGNBQWM7SUFDNUIsT0FBTyxJQUFJLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO0FBQ3JDLENBQUM7QUFFRDs7R0FFRztBQUNILE1BQU0sVUFBVSxPQUFPLENBQUMsSUFBVztJQUNqQyxJQUFNLE1BQU0sR0FBVSxFQUFFLENBQUM7SUFDekIsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBRVYsT0FBTyxDQUFDLEdBQUcsSUFBSSxDQUFDLE1BQU0sRUFBRTtRQUN0QixJQUFNLElBQUksR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDckIsSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxFQUFFO1lBQ3ZCLElBQUksSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUU7Z0JBQ25CLElBQUksR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ3RDLENBQUMsR0FBRyxDQUFDLENBQUM7YUFDUDtpQkFBTTtnQkFDTCxDQUFDLEVBQUUsQ0FBQzthQUNMO1NBQ0Y7YUFBTTtZQUNMLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDbEIsQ0FBQyxFQUFFLENBQUM7U0FDTDtLQUNGO0lBRUQsT0FBTyxNQUFNLENBQUM7QUFDaEIsQ0FBQztBQUVELDhDQUE4QztBQUM5QyxNQUFNLFVBQVUsWUFBWSxDQUFJLEtBQWEsRUFBRSxHQUFjO0lBQzNELFNBQVMsSUFBSSx5QkFBeUIsQ0FBQyxLQUFLLEdBQUcsYUFBYSxFQUFFLEdBQUcsQ0FBQyxDQUFDO0lBQ25FLE9BQU8sR0FBRyxDQUFDLEtBQUssR0FBRyxhQUFhLENBQUMsQ0FBQztBQUNwQyxDQUFDO0FBRUQsTUFBTSxVQUFVLHlCQUF5QixDQUFDLEtBQWEsRUFBRSxHQUFVO0lBQ2pFLGNBQWMsQ0FBQyxLQUFLLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUseUNBQXlDLENBQUMsQ0FBQztBQUN6RixDQUFDO0FBRUQ7Ozs7SUFJSTtBQUNKLE1BQU0sVUFBVSxtQkFBbUIsQ0FBQyxLQUFhLEVBQUUsR0FBYztJQUMvRCxJQUFNLEtBQUssR0FBRyxZQUFZLENBQWUsS0FBSyxFQUFFLEdBQUcsQ0FBQyxDQUFDO0lBQ3JELE9BQU8sZ0JBQWdCLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDakMsQ0FBQztBQUVELE1BQU0sVUFBVSxnQkFBZ0IsQ0FBQyxLQUEyQjtJQUMxRCxPQUFPLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUUsS0FBc0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFpQixDQUFDO0FBQ3JGLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5pbXBvcnQge2Rldk1vZGVFcXVhbH0gZnJvbSAnLi4vY2hhbmdlX2RldGVjdGlvbi9jaGFuZ2VfZGV0ZWN0aW9uX3V0aWwnO1xuaW1wb3J0IHthc3NlcnRMZXNzVGhhbn0gZnJvbSAnLi9hc3NlcnQnO1xuaW1wb3J0IHtMRWxlbWVudE5vZGV9IGZyb20gJy4vaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB7SEVBREVSX09GRlNFVCwgTFZpZXdEYXRhfSBmcm9tICcuL2ludGVyZmFjZXMvdmlldyc7XG5cbi8qKlxuICogUmV0dXJucyB3ZXRoZXIgdGhlIHZhbHVlcyBhcmUgZGlmZmVyZW50IGZyb20gYSBjaGFuZ2UgZGV0ZWN0aW9uIHN0YW5kIHBvaW50LlxuICpcbiAqIENvbnN0cmFpbnRzIGFyZSByZWxheGVkIGluIGNoZWNrTm9DaGFuZ2VzIG1vZGUuIFNlZSBgZGV2TW9kZUVxdWFsYCBmb3IgZGV0YWlscy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzRGlmZmVyZW50KGE6IGFueSwgYjogYW55LCBjaGVja05vQ2hhbmdlc01vZGU6IGJvb2xlYW4pOiBib29sZWFuIHtcbiAgaWYgKG5nRGV2TW9kZSAmJiBjaGVja05vQ2hhbmdlc01vZGUpIHtcbiAgICByZXR1cm4gIWRldk1vZGVFcXVhbChhLCBiKTtcbiAgfVxuICAvLyBOYU4gaXMgdGhlIG9ubHkgdmFsdWUgdGhhdCBpcyBub3QgZXF1YWwgdG8gaXRzZWxmIHNvIHRoZSBmaXJzdFxuICAvLyB0ZXN0IGNoZWNrcyBpZiBib3RoIGEgYW5kIGIgYXJlIG5vdCBOYU5cbiAgcmV0dXJuICEoYSAhPT0gYSAmJiBiICE9PSBiKSAmJiBhICE9PSBiO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc3RyaW5naWZ5KHZhbHVlOiBhbnkpOiBzdHJpbmcge1xuICBpZiAodHlwZW9mIHZhbHVlID09ICdmdW5jdGlvbicpIHJldHVybiB2YWx1ZS5uYW1lIHx8IHZhbHVlO1xuICBpZiAodHlwZW9mIHZhbHVlID09ICdzdHJpbmcnKSByZXR1cm4gdmFsdWU7XG4gIGlmICh2YWx1ZSA9PSBudWxsKSByZXR1cm4gJyc7XG4gIHJldHVybiAnJyArIHZhbHVlO1xufVxuXG4vKipcbiAqICBGdW5jdGlvbiB0aGF0IHRocm93cyBhIFwibm90IGltcGxlbWVudGVkXCIgZXJyb3Igc28gaXQncyBjbGVhciBjZXJ0YWluXG4gKiAgYmVoYXZpb3JzL21ldGhvZHMgYXJlbid0IHlldCByZWFkeS5cbiAqXG4gKiBAcmV0dXJucyBOb3QgaW1wbGVtZW50ZWQgZXJyb3JcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG5vdEltcGxlbWVudGVkKCk6IEVycm9yIHtcbiAgcmV0dXJuIG5ldyBFcnJvcignTm90SW1wbGVtZW50ZWQnKTtcbn1cblxuLyoqXG4gKiBGbGF0dGVucyBhbiBhcnJheSBpbiBub24tcmVjdXJzaXZlIHdheS4gSW5wdXQgYXJyYXlzIGFyZSBub3QgbW9kaWZpZWQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBmbGF0dGVuKGxpc3Q6IGFueVtdKTogYW55W10ge1xuICBjb25zdCByZXN1bHQ6IGFueVtdID0gW107XG4gIGxldCBpID0gMDtcblxuICB3aGlsZSAoaSA8IGxpc3QubGVuZ3RoKSB7XG4gICAgY29uc3QgaXRlbSA9IGxpc3RbaV07XG4gICAgaWYgKEFycmF5LmlzQXJyYXkoaXRlbSkpIHtcbiAgICAgIGlmIChpdGVtLmxlbmd0aCA+IDApIHtcbiAgICAgICAgbGlzdCA9IGl0ZW0uY29uY2F0KGxpc3Quc2xpY2UoaSArIDEpKTtcbiAgICAgICAgaSA9IDA7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpKys7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHJlc3VsdC5wdXNoKGl0ZW0pO1xuICAgICAgaSsrO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiByZXN1bHQ7XG59XG5cbi8qKiBSZXRyaWV2ZXMgYSB2YWx1ZSBmcm9tIGFueSBgTFZpZXdEYXRhYC4gKi9cbmV4cG9ydCBmdW5jdGlvbiBsb2FkSW50ZXJuYWw8VD4oaW5kZXg6IG51bWJlciwgYXJyOiBMVmlld0RhdGEpOiBUIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERhdGFJblJhbmdlSW50ZXJuYWwoaW5kZXggKyBIRUFERVJfT0ZGU0VULCBhcnIpO1xuICByZXR1cm4gYXJyW2luZGV4ICsgSEVBREVSX09GRlNFVF07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhc3NlcnREYXRhSW5SYW5nZUludGVybmFsKGluZGV4OiBudW1iZXIsIGFycjogYW55W10pIHtcbiAgYXNzZXJ0TGVzc1RoYW4oaW5kZXgsIGFyciA/IGFyci5sZW5ndGggOiAwLCAnaW5kZXggZXhwZWN0ZWQgdG8gYmUgYSB2YWxpZCBkYXRhIGluZGV4Jyk7XG59XG5cbi8qKiBSZXRyaWV2ZXMgYW4gZWxlbWVudCB2YWx1ZSBmcm9tIHRoZSBwcm92aWRlZCBgdmlld0RhdGFgLlxuICAqXG4gICogRWxlbWVudHMgdGhhdCBhcmUgcmVhZCBtYXkgYmUgd3JhcHBlZCBpbiBhIHN0eWxlIGNvbnRleHQsXG4gICogdGhlcmVmb3JlIHJlYWRpbmcgdGhlIHZhbHVlIG1heSBpbnZvbHZlIHVud3JhcHBpbmcgdGhhdC5cbiAgKi9cbmV4cG9ydCBmdW5jdGlvbiBsb2FkRWxlbWVudEludGVybmFsKGluZGV4OiBudW1iZXIsIGFycjogTFZpZXdEYXRhKTogTEVsZW1lbnROb2RlIHtcbiAgY29uc3QgdmFsdWUgPSBsb2FkSW50ZXJuYWw8TEVsZW1lbnROb2RlPihpbmRleCwgYXJyKTtcbiAgcmV0dXJuIHJlYWRFbGVtZW50VmFsdWUodmFsdWUpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcmVhZEVsZW1lbnRWYWx1ZSh2YWx1ZTogTEVsZW1lbnROb2RlIHwgYW55W10pOiBMRWxlbWVudE5vZGUge1xuICByZXR1cm4gKEFycmF5LmlzQXJyYXkodmFsdWUpID8gKHZhbHVlIGFzIGFueSBhcyBhbnlbXSlbMF0gOiB2YWx1ZSkgYXMgTEVsZW1lbnROb2RlO1xufVxuIl19