/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { assertEqual, assertLessThanOrEqual } from './assert';
/**
* Equivalent to ES6 spread, add each item to an array.
*
* @param items The items to add
* @param arr The array to which you want to add the items
*/
export function addAllToArray(items, arr) {
    for (let i = 0; i < items.length; i++) {
        arr.push(items[i]);
    }
}
/**
 * Flattens an array.
 */
export function flatten(list, dst) {
    if (dst === undefined)
        dst = list;
    for (let i = 0; i < list.length; i++) {
        let item = list[i];
        if (Array.isArray(item)) {
            // we need to inline it.
            if (dst === list) {
                // Our assumption that the list was already flat was wrong and
                // we need to clone flat since we need to write to it.
                dst = list.slice(0, i);
            }
            flatten(item, dst);
        }
        else if (dst !== list) {
            dst.push(item);
        }
    }
    return dst;
}
export function deepForEach(input, fn) {
    input.forEach(value => Array.isArray(value) ? deepForEach(value, fn) : fn(value));
}
export function addToArray(arr, index, value) {
    // perf: array.push is faster than array.splice!
    if (index >= arr.length) {
        arr.push(value);
    }
    else {
        arr.splice(index, 0, value);
    }
}
export function removeFromArray(arr, index) {
    // perf: array.pop is faster than array.splice!
    if (index >= arr.length - 1) {
        return arr.pop();
    }
    else {
        return arr.splice(index, 1)[0];
    }
}
export function newArray(size, value) {
    const list = [];
    for (let i = 0; i < size; i++) {
        list.push(value);
    }
    return list;
}
/**
 * Remove item from array (Same as `Array.splice()` but faster.)
 *
 * `Array.splice()` is not as fast because it has to allocate an array for the elements which were
 * removed. This causes memory pressure and slows down code when most of the time we don't
 * care about the deleted items array.
 *
 * https://jsperf.com/fast-array-splice (About 20x faster)
 *
 * @param array Array to splice
 * @param index Index of element in array to remove.
 * @param count Number of items to remove.
 */
export function arraySplice(array, index, count) {
    const length = array.length - count;
    while (index < length) {
        array[index] = array[index + count];
        index++;
    }
    while (count--) {
        array.pop(); // shrink the array
    }
}
/**
 * Same as `Array.splice(index, 0, value)` but faster.
 *
 * `Array.splice()` is not fast because it has to allocate an array for the elements which were
 * removed. This causes memory pressure and slows down code when most of the time we don't
 * care about the deleted items array.
 *
 * https://jsperf.com/fast-array-splice (About 20x faster)
 *
 * @param array Array to splice.
 * @param index Index in array where the `value` should be added.
 * @param value Value to add to array.
 */
export function arrayInsert(array, index, value) {
    ngDevMode && assertLessThanOrEqual(index, array.length, 'Can\'t insert past array end.');
    let end = array.length;
    while (end > index) {
        const previousEnd = end - 1;
        array[end] = array[previousEnd];
        end = previousEnd;
    }
    array[index] = value;
}
/**
 * Same as `Array.splice2(index, 0, value1, value2)` but faster.
 *
 * `Array.splice()` is not fast because it has to allocate an array for the elements which were
 * removed. This causes memory pressure and slows down code when most of the time we don't
 * care about the deleted items array.
 *
 * https://jsperf.com/fast-array-splice (About 20x faster)
 *
 * @param array Array to splice.
 * @param index Index in array where the `value` should be added.
 * @param value1 Value to add to array.
 * @param value2 Value to add to array.
 */
export function arrayInsert2(array, index, value1, value2) {
    ngDevMode && assertLessThanOrEqual(index, array.length, 'Can\'t insert past array end.');
    let end = array.length;
    if (end == index) {
        // inserting at the end.
        array.push(value1, value2);
    }
    else if (end === 1) {
        // corner case when we have less items in array than we have items to insert.
        array.push(value2, array[0]);
        array[0] = value1;
    }
    else {
        end--;
        array.push(array[end - 1], array[end]);
        while (end > index) {
            const previousEnd = end - 2;
            array[end] = array[previousEnd];
            end--;
        }
        array[index] = value1;
        array[index + 1] = value2;
    }
}
/**
 * Insert a `value` into an `array` so that the array remains sorted.
 *
 * NOTE:
 * - Duplicates are not allowed, and are ignored.
 * - This uses binary search algorithm for fast inserts.
 *
 * @param array A sorted array to insert into.
 * @param value The value to insert.
 * @returns index of the inserted value.
 */
export function arrayInsertSorted(array, value) {
    let index = arrayIndexOfSorted(array, value);
    if (index < 0) {
        // if we did not find it insert it.
        index = ~index;
        arrayInsert(array, index, value);
    }
    return index;
}
/**
 * Remove `value` from a sorted `array`.
 *
 * NOTE:
 * - This uses binary search algorithm for fast removals.
 *
 * @param array A sorted array to remove from.
 * @param value The value to remove.
 * @returns index of the removed value.
 *   - positive index if value found and removed.
 *   - negative index if value not found. (`~index` to get the value where it should have been
 *     inserted)
 */
export function arrayRemoveSorted(array, value) {
    const index = arrayIndexOfSorted(array, value);
    if (index >= 0) {
        arraySplice(array, index, 1);
    }
    return index;
}
/**
 * Get an index of an `value` in a sorted `array`.
 *
 * NOTE:
 * - This uses binary search algorithm for fast removals.
 *
 * @param array A sorted array to binary search.
 * @param value The value to look for.
 * @returns index of the value.
 *   - positive index if value found.
 *   - negative index if value not found. (`~index` to get the value where it should have been
 *     located)
 */
export function arrayIndexOfSorted(array, value) {
    return _arrayIndexOfSorted(array, value, 0);
}
/**
 * Set a `value` for a `key`.
 *
 * @param arrayMap to modify.
 * @param key The key to locate or create.
 * @param value The value to set for a `key`.
 * @returns index (always even) of where the value vas set.
 */
export function arrayMapSet(arrayMap, key, value) {
    let index = arrayMapIndexOf(arrayMap, key);
    if (index >= 0) {
        // if we found it set it.
        arrayMap[index | 1] = value;
    }
    else {
        index = ~index;
        arrayInsert2(arrayMap, index, key, value);
    }
    return index;
}
/**
 * Retrieve a `value` for a `key` (on `undefined` if not found.)
 *
 * @param arrayMap to search.
 * @param key The key to locate.
 * @return The `value` stored at the `key` location or `undefined if not found.
 */
export function arrayMapGet(arrayMap, key) {
    const index = arrayMapIndexOf(arrayMap, key);
    if (index >= 0) {
        // if we found it retrieve it.
        return arrayMap[index | 1];
    }
    return undefined;
}
/**
 * Retrieve a `key` index value in the array or `-1` if not found.
 *
 * @param arrayMap to search.
 * @param key The key to locate.
 * @returns index of where the key is (or should have been.)
 *   - positive (even) index if key found.
 *   - negative index if key not found. (`~index` (even) to get the index where it should have
 *     been inserted.)
 */
export function arrayMapIndexOf(arrayMap, key) {
    return _arrayIndexOfSorted(arrayMap, key, 1);
}
/**
 * Delete a `key` (and `value`) from the `ArrayMap`.
 *
 * @param arrayMap to modify.
 * @param key The key to locate or delete (if exist).
 * @returns index of where the key was (or should have been.)
 *   - positive (even) index if key found and deleted.
 *   - negative index if key not found. (`~index` (even) to get the index where it should have
 *     been.)
 */
export function arrayMapDelete(arrayMap, key) {
    const index = arrayMapIndexOf(arrayMap, key);
    if (index >= 0) {
        // if we found it remove it.
        arraySplice(arrayMap, index, 2);
    }
    return index;
}
/**
 * INTERNAL: Get an index of an `value` in a sorted `array` by grouping search by `shift`.
 *
 * NOTE:
 * - This uses binary search algorithm for fast removals.
 *
 * @param array A sorted array to binary search.
 * @param value The value to look for.
 * @param shift grouping shift.
 *   - `0` means look at every location
 *   - `1` means only look at every other (even) location (the odd locations are to be ignored as
 *         they are values.)
 * @returns index of the value.
 *   - positive index if value found.
 *   - negative index if value not found. (`~index` to get the value where it should have been
 * inserted)
 */
function _arrayIndexOfSorted(array, value, shift) {
    ngDevMode && assertEqual(Array.isArray(array), true, 'Expecting an array');
    let start = 0;
    let end = array.length >> shift;
    while (end !== start) {
        const middle = start + ((end - start) >> 1); // find the middle.
        const current = array[middle << shift];
        if (value === current) {
            return (middle << shift);
        }
        else if (current > value) {
            end = middle;
        }
        else {
            start = middle + 1; // We already searched middle so make it non-inclusive by adding 1
        }
    }
    return ~(end << shift);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXJyYXlfdXRpbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy91dGlsL2FycmF5X3V0aWxzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBQyxXQUFXLEVBQUUscUJBQXFCLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFFNUQ7Ozs7O0VBS0U7QUFDRixNQUFNLFVBQVUsYUFBYSxDQUFDLEtBQVksRUFBRSxHQUFVO0lBQ3BELEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO1FBQ3JDLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7S0FDcEI7QUFDSCxDQUFDO0FBRUQ7O0dBRUc7QUFDSCxNQUFNLFVBQVUsT0FBTyxDQUFDLElBQVcsRUFBRSxHQUFXO0lBQzlDLElBQUksR0FBRyxLQUFLLFNBQVM7UUFBRSxHQUFHLEdBQUcsSUFBSSxDQUFDO0lBQ2xDLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO1FBQ3BDLElBQUksSUFBSSxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNuQixJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEVBQUU7WUFDdkIsd0JBQXdCO1lBQ3hCLElBQUksR0FBRyxLQUFLLElBQUksRUFBRTtnQkFDaEIsOERBQThEO2dCQUM5RCxzREFBc0Q7Z0JBQ3RELEdBQUcsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQzthQUN4QjtZQUNELE9BQU8sQ0FBQyxJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUM7U0FDcEI7YUFBTSxJQUFJLEdBQUcs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LEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUUsbUJBQW1CO1FBQ2pFLE1BQU0sT0FBTyxHQUFHLEtBQUssQ0FBQyxNQUFNLElBQUksS0FBSyxDQUFDLENBQUM7UUFDdkMsSUFBSSxLQUFLLEtBQUssT0FBTyxFQUFFO1lBQ3JCLE9BQU8sQ0FBQyxNQUFNLElBQUksS0FBSyxDQUFDLENBQUM7U0FDMUI7YUFBTSxJQUFJLE9BQU8sR0FBRyxLQUFLLEVBQUU7WUFDMUIsR0FBRyxHQUFHLE1BQU0sQ0FBQztTQUNkO2FBQU07WUFDTCxLQUFLLEdBQUcsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFFLGtFQUFrRTtTQUN4RjtLQUNGO0lBQ0QsT0FBTyxDQUFDLENBQUMsR0FBRyxJQUFJLEtBQUssQ0FBQyxDQUFDO0FBQ3pCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7YXNzZXJ0RXF1YWwsIGFzc2VydExlc3NUaGFuT3JFcXVhbH0gZnJvbSAnLi9hc3NlcnQnO1xuXG4vKipcbiogRXF1aXZhbGVudCB0byBFUzYgc3ByZWFkLCBhZGQgZWFjaCBpdGVtIHRvIGFuIGFycmF5LlxuKlxuKiBAcGFyYW0gaXRlbXMgVGhlIGl0ZW1zIHRvIGFkZFxuKiBAcGFyYW0gYXJyIFRoZSBhcnJheSB0byB3aGljaCB5b3Ugd2FudCB0byBhZGQgdGhlIGl0ZW1zXG4qL1xuZXhwb3J0IGZ1bmN0aW9uIGFkZEFsbFRvQXJyYXkoaXRlbXM6IGFueVtdLCBhcnI6IGFueVtdKSB7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgaXRlbXMubGVuZ3RoOyBpKyspIHtcbiAgICBhcnIucHVzaChpdGVtc1tpXSk7XG4gIH1cbn1cblxuLyoqXG4gKiBGbGF0dGVucyBhbiBhcnJheS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGZsYXR0ZW4obGlzdDogYW55W10sIGRzdD86IGFueVtdKTogYW55W10ge1xuICBpZiAoZHN0ID09PSB1bmRlZmluZWQpIGRzdCA9IGxpc3Q7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgbGlzdC5sZW5ndGg7IGkrKykge1xuICAgIGxldCBpdGVtID0gbGlzdFtpXTtcbiAgICBpZiAoQXJyYXkuaXNBcnJheShpdGVtKSkge1xuICAgICAgLy8gd2UgbmVlZCB0byBpbmxpbmUgaXQuXG4gICAgICBpZiAoZHN0ID09PSBsaXN0KSB7XG4gICAgICAgIC8vIE91ciBhc3N1bXB0aW9uIHRoYXQgdGhlIGxpc3Qgd2FzIGFscmVhZHkgZmxhdCB3YXMgd3JvbmcgYW5kXG4gICAgICAgIC8vIHdlIG5lZWQgdG8gY2xvbmUgZmxhdCBzaW5jZSB3ZSBuZWVkIHRvIHdyaXRlIHRvIGl0LlxuICAgICAgICBkc3QgPSBsaXN0LnNsaWNlKDAsIGkpO1xuICAgICAgfVxuICAgICAgZmxhdHRlbihpdGVtLCBkc3QpO1xuICAgIH0gZWxzZSBpZiAoZHN0ICE9PSBsaXN0KSB7XG4gICAgICBkc3QucHVzaChpdGVtKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGRzdDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGRlZXBGb3JFYWNoPFQ+KGlucHV0OiAoVCB8IGFueVtdKVtdLCBmbjogKHZhbHVlOiBUKSA9PiB2b2lkKTogdm9pZCB7XG4gIGlucHV0LmZvckVhY2godmFsdWUgPT4gQXJyYXkuaXNBcnJheSh2YWx1ZSkgPyBkZWVwRm9yRWFjaCh2YWx1ZSwgZm4pIDogZm4odmFsdWUpKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGFkZFRvQXJyYXkoYXJyOiBhbnlbXSwgaW5kZXg6IG51bWJlciwgdmFsdWU6IGFueSk6IHZvaWQge1xuICAvLyBwZXJmOiBhcnJheS5wdXNoIGlzIGZhc3RlciB0aGFuIGFycmF5LnNwbGljZSFcbiAgaWYgKGluZGV4ID49IGFyci5sZW5ndGgpIHtcbiAgICBhcnIucHVzaCh2YWx1ZSk7XG4gIH0gZWxzZSB7XG4gICAgYXJyLnNwbGljZShpbmRleCwgMCwgdmFsdWUpO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZW1vdmVGcm9tQXJyYXkoYXJyOiBhbnlbXSwgaW5kZXg6IG51bWJlcik6IGFueSB7XG4gIC8vIHBlcmY6IGFycmF5LnBvcCBpcyBmYXN0ZXIgdGhhbiBhcnJheS5zcGxpY2UhXG4gIGlmIChpbmRleCA+PSBhcnIubGVuZ3RoIC0gMSkge1xuICAgIHJldHVybiBhcnIucG9wKCk7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIGFyci5zcGxpY2UoaW5kZXgsIDEpWzBdO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBuZXdBcnJheTxUID0gYW55PihzaXplOiBudW1iZXIpOiBUW107XG5leHBvcnQgZnVuY3Rpb24gbmV3QXJyYXk8VD4oc2l6ZTogbnVtYmVyLCB2YWx1ZTogVCk6IFRbXTtcbmV4cG9ydCBmdW5jdGlvbiBuZXdBcnJheTxUPihzaXplOiBudW1iZXIsIHZhbHVlPzogVCk6IFRbXSB7XG4gIGNvbnN0IGxpc3Q6IFRbXSA9IFtdO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IHNpemU7IGkrKykge1xuICAgIGxpc3QucHVzaCh2YWx1ZSAhKTtcbiAgfVxuICByZXR1cm4gbGlzdDtcbn1cblxuLyoqXG4gKiBSZW1vdmUgaXRlbSBmcm9tIGFycmF5IChTYW1lIGFzIGBBcnJheS5zcGxpY2UoKWAgYnV0IGZhc3Rlci4pXG4gKlxuICogYEFycmF5LnNwbGljZSgpYCBpcyBub3QgYXMgZmFzdCBiZWNhdXNlIGl0IGhhcyB0byBhbGxvY2F0ZSBhbiBhcnJheSBmb3IgdGhlIGVsZW1lbnRzIHdoaWNoIHdlcmVcbiAqIHJlbW92ZWQuIFRoaXMgY2F1c2VzIG1lbW9yeSBwcmVzc3VyZSBhbmQgc2xvd3MgZG93biBjb2RlIHdoZW4gbW9zdCBvZiB0aGUgdGltZSB3ZSBkb24ndFxuICogY2FyZSBhYm91dCB0aGUgZGVsZXRlZCBpdGVtcyBhcnJheS5cbiAqXG4gKiBodHRwczovL2pzcGVyZi5jb20vZmFzdC1hcnJheS1zcGxpY2UgKEFib3V0IDIweCBmYXN0ZXIpXG4gKlxuICogQHBhcmFtIGFycmF5IEFycmF5IHRvIHNwbGljZVxuICogQHBhcmFtIGluZGV4IEluZGV4IG9mIGVsZW1lbnQgaW4gYXJyYXkgdG8gcmVtb3ZlLlxuICogQHBhcmFtIGNvdW50IE51bWJlciBvZiBpdGVtcyB0byByZW1vdmUuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhcnJheVNwbGljZShhcnJheTogYW55W10sIGluZGV4OiBudW1iZXIsIGNvdW50OiBudW1iZXIpOiB2b2lkIHtcbiAgY29uc3QgbGVuZ3RoID0gYXJyYXkubGVuZ3RoIC0gY291bnQ7XG4gIHdoaWxlIChpbmRleCA8IGxlbmd0aCkge1xuICAgIGFycmF5W2luZGV4XSA9IGFycmF5W2luZGV4ICsgY291bnRdO1xuICAgIGluZGV4Kys7XG4gIH1cbiAgd2hpbGUgKGNvdW50LS0pIHtcbiAgICBhcnJheS5wb3AoKTsgIC8vIHNocmluayB0aGUgYXJyYXlcbiAgfVxufVxuXG4vKipcbiAqIFNhbWUgYXMgYEFycmF5LnNwbGljZShpbmRleCwgMCwgdmFsdWUpYCBidXQgZmFzdGVyLlxuICpcbiAqIGBBcnJheS5zcGxpY2UoKWAgaXMgbm90IGZhc3QgYmVjYXVzZSBpdCBoYXMgdG8gYWxsb2NhdGUgYW4gYXJyYXkgZm9yIHRoZSBlbGVtZW50cyB3aGljaCB3ZXJlXG4gKiByZW1vdmVkLiBUaGlzIGNhdXNlcyBtZW1vcnkgcHJlc3N1cmUgYW5kIHNsb3dzIGRvd24gY29kZSB3aGVuIG1vc3Qgb2YgdGhlIHRpbWUgd2UgZG9uJ3RcbiAqIGNhcmUgYWJvdXQgdGhlIGRlbGV0ZWQgaXRlbXMgYXJyYXkuXG4gKlxuICogaHR0cHM6Ly9qc3BlcmYuY29tL2Zhc3QtYXJyYXktc3BsaWNlIChBYm91dCAyMHggZmFzdGVyKVxuICpcbiAqIEBwYXJhbSBhcnJheSBBcnJheSB0byBzcGxpY2UuXG4gKiBAcGFyYW0gaW5kZXggSW5kZXggaW4gYXJyYXkgd2hlcmUgdGhlIGB2YWx1ZWAgc2hvdWxkIGJlIGFkZGVkLlxuICogQHBhcmFtIHZhbHVlIFZhbHVlIHRvIGFkZCB0byBhcnJheS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFycmF5SW5zZXJ0KGFycmF5OiBhbnlbXSwgaW5kZXg6IG51bWJlciwgdmFsdWU6IGFueSk6IHZvaWQge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0TGVzc1RoYW5PckVxdWFsKGluZGV4LCBhcnJheS5sZW5ndGgsICdDYW5cXCd0IGluc2VydCBwYXN0IGFycmF5IGVuZC4nKTtcbiAgbGV0IGVuZCA9IGFycmF5Lmxlbmd0aDtcbiAgd2hpbGUgKGVuZCA+IGluZGV4KSB7XG4gICAgY29uc3QgcHJldmlvdXNFbmQgPSBlbmQgLSAxO1xuICAgIGFycmF5W2VuZF0gPSBhcnJheVtwcmV2aW91c0VuZF07XG4gICAgZW5kID0gcHJldmlvdXNFbmQ7XG4gIH1cbiAgYXJyYXlbaW5kZXhdID0gdmFsdWU7XG59XG5cbi8qKlxuICogU2FtZSBhcyBgQXJyYXkuc3BsaWNlMihpbmRleCwgMCwgdmFsdWUxLCB2YWx1ZTIpYCBidXQgZmFzdGVyLlxuICpcbiAqIGBBcnJheS5zcGxpY2UoKWAgaXMgbm90IGZhc3QgYmVjYXVzZSBpdCBoYXMgdG8gYWxsb2NhdGUgYW4gYXJyYXkgZm9yIHRoZSBlbGVtZW50cyB3aGljaCB3ZXJlXG4gKiByZW1vdmVkLiBUaGlzIGNhdXNlcyBtZW1vcnkgcHJlc3N1cmUgYW5kIHNsb3dzIGRvd24gY29kZSB3aGVuIG1vc3Qgb2YgdGhlIHRpbWUgd2UgZG9uJ3RcbiAqIGNhcmUgYWJvdXQgdGhlIGRlbGV0ZWQgaXRlbXMgYXJyYXkuXG4gKlxuICogaHR0cHM6Ly9qc3BlcmYuY29tL2Zhc3QtYXJyYXktc3BsaWNlIChBYm91dCAyMHggZmFzdGVyKVxuICpcbiAqIEBwYXJhbSBhcnJheSBBcnJheSB0byBzcGxpY2UuXG4gKiBAcGFyYW0gaW5kZXggSW5kZXggaW4gYXJyYXkgd2hlcmUgdGhlIGB2YWx1ZWAgc2hvdWxkIGJlIGFkZGVkLlxuICogQHBhcmFtIHZhbHVlMSBWYWx1ZSB0byBhZGQgdG8gYXJyYXkuXG4gKiBAcGFyYW0gdmFsdWUyIFZhbHVlIHRvIGFkZCB0byBhcnJheS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFycmF5SW5zZXJ0MihhcnJheTogYW55W10sIGluZGV4OiBudW1iZXIsIHZhbHVlMTogYW55LCB2YWx1ZTI6IGFueSk6IHZvaWQge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0TGVzc1RoYW5PckVxdWFsKGluZGV4LCBhcnJheS5sZW5ndGgsICdDYW5cXCd0IGluc2VydCBwYXN0IGFycmF5IGVuZC4nKTtcbiAgbGV0IGVuZCA9IGFycmF5Lmxlbmd0aDtcbiAgaWYgKGVuZCA9PSBpbmRleCkge1xuICAgIC8vIGluc2VydGluZyBhdCB0aGUgZW5kLlxuICAgIGFycmF5LnB1c2godmFsdWUxLCB2YWx1ZTIpO1xuICB9IGVsc2UgaWYgKGVuZCA9PT0gMSkge1xuICAgIC8vIGNvcm5lciBjYXNlIHdoZW4gd2UgaGF2ZSBsZXNzIGl0ZW1zIGluIGFycmF5IHRoYW4gd2UgaGF2ZSBpdGVtcyB0byBpbnNlcnQuXG4gICAgYXJyYXkucHVzaCh2YWx1ZTIsIGFycmF5WzBdKTtcbiAgICBhcnJheVswXSA9IHZhbHVlMTtcbiAgfSBlbHNlIHtcbiAgICBlbmQtLTtcbiAgICBhcnJheS5wdXNoKGFycmF5W2VuZCAtIDFdLCBhcnJheVtlbmRdKTtcbiAgICB3aGlsZSAoZW5kID4gaW5kZXgpIHtcbiAgICAgIGNvbnN0IHByZXZpb3VzRW5kID0gZW5kIC0gMjtcbiAgICAgIGFycmF5W2VuZF0gPSBhcnJheVtwcmV2aW91c0VuZF07XG4gICAgICBlbmQtLTtcbiAgICB9XG4gICAgYXJyYXlbaW5kZXhdID0gdmFsdWUxO1xuICAgIGFycmF5W2luZGV4ICsgMV0gPSB2YWx1ZTI7XG4gIH1cbn1cblxuLyoqXG4gKiBJbnNlcnQgYSBgdmFsdWVgIGludG8gYW4gYGFycmF5YCBzbyB0aGF0IHRoZSBhcnJheSByZW1haW5zIHNvcnRlZC5cbiAqXG4gKiBOT1RFOlxuICogLSBEdXBsaWNhdGVzIGFyZSBub3QgYWxsb3dlZCwgYW5kIGFyZSBpZ25vcmVkLlxuICogLSBUaGlzIHVzZXMgYmluYXJ5IHNlYXJjaCBhbGdvcml0aG0gZm9yIGZhc3QgaW5zZXJ0cy5cbiAqXG4gKiBAcGFyYW0gYXJyYXkgQSBzb3J0ZWQgYXJyYXkgdG8gaW5zZXJ0IGludG8uXG4gKiBAcGFyYW0gdmFsdWUgVGhlIHZhbHVlIHRvIGluc2VydC5cbiAqIEByZXR1cm5zIGluZGV4IG9mIHRoZSBpbnNlcnRlZCB2YWx1ZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFycmF5SW5zZXJ0U29ydGVkKGFycmF5OiBzdHJpbmdbXSwgdmFsdWU6IHN0cmluZyk6IG51bWJlciB7XG4gIGxldCBpbmRleCA9IGFycmF5SW5kZXhPZlNvcnRlZChhcnJheSwgdmFsdWUpO1xuICBpZiAoaW5kZXggPCAwKSB7XG4gICAgLy8gaWYgd2UgZGlkIG5vdCBmaW5kIGl0IGluc2VydCBpdC5cbiAgICBpbmRleCA9IH5pbmRleDtcbiAgICBhcnJheUluc2VydChhcnJheSwgaW5kZXgsIHZhbHVlKTtcbiAgfVxuICByZXR1cm4gaW5kZXg7XG59XG5cbi8qKlxuICogUmVtb3ZlIGB2YWx1ZWAgZnJvbSBhIHNvcnRlZCBgYXJyYXlgLlxuICpcbiAqIE5PVEU6XG4gKiAtIFRoaXMgdXNlcyBiaW5hcnkgc2VhcmNoIGFsZ29yaXRobSBmb3IgZmFzdCByZW1vdmFscy5cbiAqXG4gKiBAcGFyYW0gYXJyYXkgQSBzb3J0ZWQgYXJyYXkgdG8gcmVtb3ZlIGZyb20uXG4gKiBAcGFyYW0gdmFsdWUgVGhlIHZhbHVlIHRvIHJlbW92ZS5cbiAqIEByZXR1cm5zIGluZGV4IG9mIHRoZSByZW1vdmVkIHZhbHVlLlxuICogICAtIHBvc2l0aXZlIGluZGV4IGlmIHZhbHVlIGZvdW5kIGFuZCByZW1vdmVkLlxuICogICAtIG5lZ2F0aXZlIGluZGV4IGlmIHZhbHVlIG5vdCBmb3VuZC4gKGB+aW5kZXhgIHRvIGdldCB0aGUgdmFsdWUgd2hlcmUgaXQgc2hvdWxkIGhhdmUgYmVlblxuICogICAgIGluc2VydGVkKVxuICovXG5leHBvcnQgZnVuY3Rpb24gYXJyYXlSZW1vdmVTb3J0ZWQoYXJyYXk6IHN0cmluZ1tdLCB2YWx1ZTogc3RyaW5nKTogbnVtYmVyIHtcbiAgY29uc3QgaW5kZXggPSBhcnJheUluZGV4T2ZTb3J0ZWQoYXJyYXksIHZhbHVlKTtcbiAgaWYgKGluZGV4ID49IDApIHtcbiAgICBhcnJheVNwbGljZShhcnJheSwgaW5kZXgsIDEpO1xuICB9XG4gIHJldHVybiBpbmRleDtcbn1cblxuXG4vKipcbiAqIEdldCBhbiBpbmRleCBvZiBhbiBgdmFsdWVgIGluIGEgc29ydGVkIGBhcnJheWAuXG4gKlxuICogTk9URTpcbiAqIC0gVGhpcyB1c2VzIGJpbmFyeSBzZWFyY2ggYWxnb3JpdGhtIGZvciBmYXN0IHJlbW92YWxzLlxuICpcbiAqIEBwYXJhbSBhcnJheSBBIHNvcnRlZCBhcnJheSB0byBiaW5hcnkgc2VhcmNoLlxuICogQHBhcmFtIHZhbHVlIFRoZSB2YWx1ZSB0byBsb29rIGZvci5cbiAqIEByZXR1cm5zIGluZGV4IG9mIHRoZSB2YWx1ZS5cbiAqICAgLSBwb3NpdGl2ZSBpbmRleCBpZiB2YWx1ZSBmb3VuZC5cbiAqICAgLSBuZWdhdGl2ZSBpbmRleCBpZiB2YWx1ZSBub3QgZm91bmQuIChgfmluZGV4YCB0byBnZXQgdGhlIHZhbHVlIHdoZXJlIGl0IHNob3VsZCBoYXZlIGJlZW5cbiAqICAgICBsb2NhdGVkKVxuICovXG5leHBvcnQgZnVuY3Rpb24gYXJyYXlJbmRleE9mU29ydGVkKGFycmF5OiBzdHJpbmdbXSwgdmFsdWU6IHN0cmluZyk6IG51bWJlciB7XG4gIHJldHVybiBfYXJyYXlJbmRleE9mU29ydGVkKGFycmF5LCB2YWx1ZSwgMCk7XG59XG5cblxuLyoqXG4gKiBgQXJyYXlNYXBgIGlzIGFuIGFycmF5IHdoZXJlIGV2ZW4gcG9zaXRpb25zIGNvbnRhaW4ga2V5cyBhbmQgb2RkIHBvc2l0aW9ucyBjb250YWluIHZhbHVlcy5cbiAqXG4gKiBgQXJyYXlNYXBgIHByb3ZpZGVzIGEgdmVyeSBlZmZpY2llbnQgd2F5IG9mIGl0ZXJhdGluZyBvdmVyIGl0cyBjb250ZW50cy4gRm9yIHNtYWxsXG4gKiBzZXRzICh+MTApIHRoZSBjb3N0IG9mIGJpbmFyeSBzZWFyY2hpbmcgYW4gYEFycmF5TWFwYCBoYXMgYWJvdXQgdGhlIHNhbWUgcGVyZm9ybWFuY2VcbiAqIGNoYXJhY3RlcmlzdGljcyB0aGF0IG9mIGEgYE1hcGAgd2l0aCBzaWduaWZpY2FudGx5IGJldHRlciBtZW1vcnkgZm9vdHByaW50LlxuICpcbiAqIElmIHVzZWQgYXMgYSBgTWFwYCB0aGUga2V5cyBhcmUgc3RvcmVkIGluIGFscGhhYmV0aWNhbCBvcmRlciBzbyB0aGF0IHRoZXkgY2FuIGJlIGJpbmFyeSBzZWFyY2hlZFxuICogZm9yIHJldHJpZXZhbC5cbiAqXG4gKiBTZWU6IGBhcnJheU1hcFNldGAsIGBhcnJheU1hcEdldGAsIGBhcnJheU1hcEluZGV4T2ZgLCBgYXJyYXlNYXBEZWxldGVgLlxuICovXG5leHBvcnQgaW50ZXJmYWNlIEFycmF5TWFwPFZBTFVFPiBleHRlbmRzIEFycmF5PFZBTFVFfHN0cmluZz4geyBfX2JyYW5kX186ICdhcnJheS1tYXAnOyB9XG5cbi8qKlxuICogU2V0IGEgYHZhbHVlYCBmb3IgYSBga2V5YC5cbiAqXG4gKiBAcGFyYW0gYXJyYXlNYXAgdG8gbW9kaWZ5LlxuICogQHBhcmFtIGtleSBUaGUga2V5IHRvIGxvY2F0ZSBvciBjcmVhdGUuXG4gKiBAcGFyYW0gdmFsdWUgVGhlIHZhbHVlIHRvIHNldCBmb3IgYSBga2V5YC5cbiAqIEByZXR1cm5zIGluZGV4IChhbHdheXMgZXZlbikgb2Ygd2hlcmUgdGhlIHZhbHVlIHZhcyBzZXQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhcnJheU1hcFNldDxWPihhcnJheU1hcDogQXJyYXlNYXA8Vj4sIGtleTogc3RyaW5nLCB2YWx1ZTogVik6IG51bWJlciB7XG4gIGxldCBpbmRleCA9IGFycmF5TWFwSW5kZXhPZihhcnJheU1hcCwga2V5KTtcbiAgaWYgKGluZGV4ID49IDApIHtcbiAgICAvLyBpZiB3ZSBmb3VuZCBpdCBzZXQgaXQuXG4gICAgYXJyYXlNYXBbaW5kZXggfCAxXSA9IHZhbHVlO1xuICB9IGVsc2Uge1xuICAgIGluZGV4ID0gfmluZGV4O1xuICAgIGFycmF5SW5zZXJ0MihhcnJheU1hcCwgaW5kZXgsIGtleSwgdmFsdWUpO1xuICB9XG4gIHJldHVybiBpbmRleDtcbn1cblxuLyoqXG4gKiBSZXRyaWV2ZSBhIGB2YWx1ZWAgZm9yIGEgYGtleWAgKG9uIGB1bmRlZmluZWRgIGlmIG5vdCBmb3VuZC4pXG4gKiBcbiAqIEBwYXJhbSBhcnJheU1hcCB0byBzZWFyY2guXG4gKiBAcGFyYW0ga2V5IFRoZSBrZXkgdG8gbG9jYXRlLlxuICogQHJldHVybiBUaGUgYHZhbHVlYCBzdG9yZWQgYXQgdGhlIGBrZXlgIGxvY2F0aW9uIG9yIGB1bmRlZmluZWQgaWYgbm90IGZvdW5kLlxuICovXG5leHBvcnQgZnVuY3Rpb24gYXJyYXlNYXBHZXQ8Vj4oYXJyYXlNYXA6IEFycmF5TWFwPFY+LCBrZXk6IHN0cmluZyk6IFZ8dW5kZWZpbmVkIHtcbiAgY29uc3QgaW5kZXggPSBhcnJheU1hcEluZGV4T2YoYXJyYXlNYXAsIGtleSk7XG4gIGlmIChpbmRleCA+PSAwKSB7XG4gICAgLy8gaWYgd2UgZm91bmQgaXQgcmV0cmlldmUgaXQuXG4gICAgcmV0dXJuIGFycmF5TWFwW2luZGV4IHwgMV0gYXMgVjtcbiAgfVxuICByZXR1cm4gdW5kZWZpbmVkO1xufVxuXG4vKipcbiAqIFJldHJpZXZlIGEgYGtleWAgaW5kZXggdmFsdWUgaW4gdGhlIGFycmF5IG9yIGAtMWAgaWYgbm90IGZvdW5kLlxuICpcbiAqIEBwYXJhbSBhcnJheU1hcCB0byBzZWFyY2guXG4gKiBAcGFyYW0ga2V5IFRoZSBrZXkgdG8gbG9jYXRlLlxuICogQHJldHVybnMgaW5kZXggb2Ygd2hlcmUgdGhlIGtleSBpcyAob3Igc2hvdWxkIGhhdmUgYmVlbi4pXG4gKiAgIC0gcG9zaXRpdmUgKGV2ZW4pIGluZGV4IGlmIGtleSBmb3VuZC5cbiAqICAgLSBuZWdhdGl2ZSBpbmRleCBpZiBrZXkgbm90IGZvdW5kLiAoYH5pbmRleGAgKGV2ZW4pIHRvIGdldCB0aGUgaW5kZXggd2hlcmUgaXQgc2hvdWxkIGhhdmVcbiAqICAgICBiZWVuIGluc2VydGVkLilcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFycmF5TWFwSW5kZXhPZjxWPihhcnJheU1hcDogQXJyYXlNYXA8Vj4sIGtleTogc3RyaW5nKTogbnVtYmVyIHtcbiAgcmV0dXJuIF9hcnJheUluZGV4T2ZTb3J0ZWQoYXJyYXlNYXAgYXMgc3RyaW5nW10sIGtleSwgMSk7XG59XG5cbi8qKlxuICogRGVsZXRlIGEgYGtleWAgKGFuZCBgdmFsdWVgKSBmcm9tIHRoZSBgQXJyYXlNYXBgLlxuICpcbiAqIEBwYXJhbSBhcnJheU1hcCB0byBtb2RpZnkuXG4gKiBAcGFyYW0ga2V5IFRoZSBrZXkgdG8gbG9jYXRlIG9yIGRlbGV0ZSAoaWYgZXhpc3QpLlxuICogQHJldHVybnMgaW5kZXggb2Ygd2hlcmUgdGhlIGtleSB3YXMgKG9yIHNob3VsZCBoYXZlIGJlZW4uKVxuICogICAtIHBvc2l0aXZlIChldmVuKSBpbmRleCBpZiBrZXkgZm91bmQgYW5kIGRlbGV0ZWQuXG4gKiAgIC0gbmVnYXRpdmUgaW5kZXggaWYga2V5IG5vdCBmb3VuZC4gKGB+aW5kZXhgIChldmVuKSB0byBnZXQgdGhlIGluZGV4IHdoZXJlIGl0IHNob3VsZCBoYXZlXG4gKiAgICAgYmVlbi4pXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhcnJheU1hcERlbGV0ZTxWPihhcnJheU1hcDogQXJyYXlNYXA8Vj4sIGtleTogc3RyaW5nKTogbnVtYmVyIHtcbiAgY29uc3QgaW5kZXggPSBhcnJheU1hcEluZGV4T2YoYXJyYXlNYXAsIGtleSk7XG4gIGlmIChpbmRleCA+PSAwKSB7XG4gICAgLy8gaWYgd2UgZm91bmQgaXQgcmVtb3ZlIGl0LlxuICAgIGFycmF5U3BsaWNlKGFycmF5TWFwLCBpbmRleCwgMik7XG4gIH1cbiAgcmV0dXJuIGluZGV4O1xufVxuXG5cbi8qKlxuICogSU5URVJOQUw6IEdldCBhbiBpbmRleCBvZiBhbiBgdmFsdWVgIGluIGEgc29ydGVkIGBhcnJheWAgYnkgZ3JvdXBpbmcgc2VhcmNoIGJ5IGBzaGlmdGAuXG4gKlxuICogTk9URTpcbiAqIC0gVGhpcyB1c2VzIGJpbmFyeSBzZWFyY2ggYWxnb3JpdGhtIGZvciBmYXN0IHJlbW92YWxzLlxuICpcbiAqIEBwYXJhbSBhcnJheSBBIHNvcnRlZCBhcnJheSB0byBiaW5hcnkgc2VhcmNoLlxuICogQHBhcmFtIHZhbHVlIFRoZSB2YWx1ZSB0byBsb29rIGZvci5cbiAqIEBwYXJhbSBzaGlmdCBncm91cGluZyBzaGlmdC5cbiAqICAgLSBgMGAgbWVhbnMgbG9vayBhdCBldmVyeSBsb2NhdGlvblxuICogICAtIGAxYCBtZWFucyBvbmx5IGxvb2sgYXQgZXZlcnkgb3RoZXIgKGV2ZW4pIGxvY2F0aW9uICh0aGUgb2RkIGxvY2F0aW9ucyBhcmUgdG8gYmUgaWdub3JlZCBhc1xuICogICAgICAgICB0aGV5IGFyZSB2YWx1ZXMuKVxuICogQHJldHVybnMgaW5kZXggb2YgdGhlIHZhbHVlLlxuICogICAtIHBvc2l0aXZlIGluZGV4IGlmIHZhbHVlIGZvdW5kLlxuICogICAtIG5lZ2F0aXZlIGluZGV4IGlmIHZhbHVlIG5vdCBmb3VuZC4gKGB+aW5kZXhgIHRvIGdldCB0aGUgdmFsdWUgd2hlcmUgaXQgc2hvdWxkIGhhdmUgYmVlblxuICogaW5zZXJ0ZWQpXG4gKi9cbmZ1bmN0aW9uIF9hcnJheUluZGV4T2ZTb3J0ZWQoYXJyYXk6IHN0cmluZ1tdLCB2YWx1ZTogc3RyaW5nLCBzaGlmdDogbnVtYmVyKTogbnVtYmVyIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydEVxdWFsKEFycmF5LmlzQXJyYXkoYXJyYXkpLCB0cnVlLCAnRXhwZWN0aW5nIGFuIGFycmF5Jyk7XG4gIGxldCBzdGFydCA9IDA7XG4gIGxldCBlbmQgPSBhcnJheS5sZW5ndGggPj4gc2hpZnQ7XG4gIHdoaWxlIChlbmQgIT09IHN0YXJ0KSB7XG4gICAgY29uc3QgbWlkZGxlID0gc3RhcnQgKyAoKGVuZCAtIHN0YXJ0KSA+PiAxKTsgIC8vIGZpbmQgdGhlIG1pZGRsZS5cbiAgICBjb25zdCBjdXJyZW50ID0gYXJyYXlbbWlkZGxlIDw8IHNoaWZ0XTtcbiAgICBpZiAodmFsdWUgPT09IGN1cnJlbnQpIHtcbiAgICAgIHJldHVybiAobWlkZGxlIDw8IHNoaWZ0KTtcbiAgICB9IGVsc2UgaWYgKGN1cnJlbnQgPiB2YWx1ZSkge1xuICAgICAgZW5kID0gbWlkZGxlO1xuICAgIH0gZWxzZSB7XG4gICAgICBzdGFydCA9IG1pZGRsZSArIDE7ICAvLyBXZSBhbHJlYWR5IHNlYXJjaGVkIG1pZGRsZSBzbyBtYWtlIGl0IG5vbi1pbmNsdXNpdmUgYnkgYWRkaW5nIDFcbiAgICB9XG4gIH1cbiAgcmV0dXJuIH4oZW5kIDw8IHNoaWZ0KTtcbn1cbiJdfQ==