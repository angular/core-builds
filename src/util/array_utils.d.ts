/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/**
* Equivalent to ES6 spread, add each item to an array.
*
* @param items The items to add
* @param arr The array to which you want to add the items
*/
export declare function addAllToArray(items: any[], arr: any[]): void;
/**
 * Flattens an array.
 */
export declare function flatten(list: any[], dst?: any[]): any[];
export declare function deepForEach<T>(input: (T | any[])[], fn: (value: T) => void): void;
export declare function addToArray(arr: any[], index: number, value: any): void;
export declare function removeFromArray(arr: any[], index: number): any;
export declare function newArray<T = any>(size: number): T[];
export declare function newArray<T>(size: number, value: T): T[];
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
export declare function arraySplice(array: any[], index: number, count: number): void;
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
export declare function arrayInsert(array: any[], index: number, value: any): void;
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
export declare function arrayInsert2(array: any[], index: number, value1: any, value2: any): void;
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
export declare function arrayInsertSorted(array: string[], value: string): number;
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
export declare function arrayRemoveSorted(array: string[], value: string): number;
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
export declare function arrayIndexOfSorted(array: string[], value: string): number;
/**
 * `ArrayMap` is an array where even positions contain keys and odd positions contain values.
 *
 * `ArrayMap` provides a very efficient way of iterating over its contents. For small
 * sets (~10) the cost of binary searching an `ArrayMap` has about the same performance
 * characteristics that of a `Map` with significantly better memory footprint.
 *
 * If used as a `Map` the keys are stored in alphabetical order so that they can be binary searched
 * for retrieval.
 *
 * See: `arrayMapSet`, `arrayMapGet`, `arrayMapIndexOf`, `arrayMapDelete`.
 */
export interface ArrayMap<VALUE> extends Array<VALUE | string> {
    __brand__: 'array-map';
}
/**
 * Set a `value` for a `key`.
 *
 * @param arrayMap to modify.
 * @param key The key to locate or create.
 * @param value The value to set for a `key`.
 * @returns index (always even) of where the value vas set.
 */
export declare function arrayMapSet<V>(arrayMap: ArrayMap<V>, key: string, value: V): number;
/**
 * Retrieve a `value` for a `key` (on `undefined` if not found.)
 *
 * @param arrayMap to search.
 * @param key The key to locate.
 * @return The `value` stored at the `key` location or `undefined if not found.
 */
export declare function arrayMapGet<V>(arrayMap: ArrayMap<V>, key: string): V | undefined;
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
export declare function arrayMapIndexOf<V>(arrayMap: ArrayMap<V>, key: string): number;
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
export declare function arrayMapDelete<V>(arrayMap: ArrayMap<V>, key: string): number;
