/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { assertNotSame } from '../util/assert';
/**
 * A type representing the live collection to be reconciled with any new (incoming) collection. This
 * is an adapter class that makes it possible to work with different internal data structures,
 * regardless of the actual values of the incoming collection.
 */
export class LiveCollection {
    destroy(item) {
        // noop by default
    }
    updateValue(index, value) {
        // noop by default
    }
    // operations below could be implemented on top of the operations defined so far, but having
    // them explicitly allow clear expression of intent and potentially more performant
    // implementations
    swap(index1, index2) {
        const startIdx = Math.min(index1, index2);
        const endIdx = Math.max(index1, index2);
        const endItem = this.detach(endIdx);
        if (endIdx - startIdx > 1) {
            const startItem = this.detach(startIdx);
            this.attach(startIdx, endItem);
            this.attach(endIdx, startItem);
        }
        else {
            this.attach(startIdx, endItem);
        }
    }
    move(prevIndex, newIdx) {
        this.attach(newIdx, this.detach(prevIndex));
    }
}
function valuesMatching(liveIdx, liveValue, newIdx, newValue, trackBy) {
    if (liveIdx === newIdx && Object.is(liveValue, newValue)) {
        // matching and no value identity to update
        return 1;
    }
    else if (Object.is(trackBy(liveIdx, liveValue), trackBy(newIdx, newValue))) {
        // matching but requires value identity update
        return -1;
    }
    return 0;
}
/**
 * The live collection reconciliation algorithm that perform various in-place operations, so it
 * reflects the content of the new (incoming) collection.
 *
 * The reconciliation algorithm has 2 code paths:
 * - "fast" path that don't require any memory allocation;
 * - "slow" path that requires additional memory allocation for intermediate data structures used to
 * collect additional information about the live collection.
 * It might happen that the algorithm switches between the two modes in question in a single
 * reconciliation path - generally it tries to stay on the "fast" path as much as possible.
 *
 * The overall complexity of the algorithm is O(n + m) for speed and O(n) for memory (where n is the
 * length of the live collection and m is the length of the incoming collection). Given the problem
 * at hand the complexity / performance constraints makes it impossible to perform the absolute
 * minimum of operation to reconcile the 2 collections. The algorithm makes different tradeoffs to
 * stay within reasonable performance bounds and may apply sub-optimal number of operations in
 * certain situations.
 *
 * @param liveCollection the current, live collection;
 * @param newCollection the new, incoming collection;
 * @param trackByFn key generation function that determines equality between items in the life and
 *     incoming collection;
 */
export function reconcile(liveCollection, newCollection, trackByFn) {
    let detachedItems = undefined;
    let liveKeysInTheFuture = undefined;
    let liveStartIdx = 0;
    let liveEndIdx = liveCollection.length - 1;
    if (Array.isArray(newCollection)) {
        let newEndIdx = newCollection.length - 1;
        while (liveStartIdx <= liveEndIdx && liveStartIdx <= newEndIdx) {
            // compare from the beginning
            const liveStartValue = liveCollection.at(liveStartIdx);
            const newStartValue = newCollection[liveStartIdx];
            const isStartMatching = valuesMatching(liveStartIdx, liveStartValue, liveStartIdx, newStartValue, trackByFn);
            if (isStartMatching !== 0) {
                if (isStartMatching < 0) {
                    liveCollection.updateValue(liveStartIdx, newStartValue);
                }
                liveStartIdx++;
                continue;
            }
            // compare from the end
            // TODO(perf): do _all_ the matching from the end
            const liveEndValue = liveCollection.at(liveEndIdx);
            const newEndValue = newCollection[newEndIdx];
            const isEndMatching = valuesMatching(liveEndIdx, liveEndValue, newEndIdx, newEndValue, trackByFn);
            if (isEndMatching !== 0) {
                if (isEndMatching < 0) {
                    liveCollection.updateValue(liveEndIdx, newEndValue);
                }
                liveEndIdx--;
                newEndIdx--;
                continue;
            }
            // Detect swap and moves:
            const liveStartKey = trackByFn(liveStartIdx, liveStartValue);
            const liveEndKey = trackByFn(liveEndIdx, liveEndValue);
            const newStartKey = trackByFn(liveStartIdx, newStartValue);
            if (Object.is(newStartKey, liveEndKey)) {
                const newEndKey = trackByFn(newEndIdx, newEndValue);
                // detect swap on both ends;
                if (Object.is(newEndKey, liveStartKey)) {
                    liveCollection.swap(liveStartIdx, liveEndIdx);
                    liveCollection.updateValue(liveEndIdx, newEndValue);
                    newEndIdx--;
                    liveEndIdx--;
                }
                else {
                    // the new item is the same as the live item with the end pointer - this is a move forward
                    // to an earlier index;
                    liveCollection.move(liveEndIdx, liveStartIdx);
                }
                liveCollection.updateValue(liveStartIdx, newStartValue);
                liveStartIdx++;
                continue;
            }
            // Fallback to the slow path: we need to learn more about the content of the live and new
            // collections.
            detachedItems ??= new UniqueValueMultiKeyMap();
            liveKeysInTheFuture ??=
                initLiveItemsInTheFuture(liveCollection, liveStartIdx, liveEndIdx, trackByFn);
            // Check if I'm inserting a previously detached item: if so, attach it here
            if (attachPreviouslyDetached(liveCollection, detachedItems, liveStartIdx, newStartKey)) {
                liveCollection.updateValue(liveStartIdx, newStartValue);
                liveStartIdx++;
                liveEndIdx++;
            }
            else if (!liveKeysInTheFuture.has(newStartKey)) {
                // Check if we seen a new item that doesn't exist in the old collection and must be INSERTED
                const newItem = liveCollection.create(liveStartIdx, newCollection[liveStartIdx]);
                liveCollection.attach(liveStartIdx, newItem);
                liveStartIdx++;
                liveEndIdx++;
            }
            else {
                // We know that the new item exists later on in old collection but we don't know its index
                // and as the consequence can't move it (don't know where to find it). Detach the old item,
                // hoping that it unlocks the fast path again.
                detachedItems.set(liveStartKey, liveCollection.detach(liveStartIdx));
                liveEndIdx--;
            }
        }
        // Final cleanup steps:
        // - more items in the new collection => insert
        while (liveStartIdx <= newEndIdx) {
            createOrAttach(liveCollection, detachedItems, trackByFn, liveStartIdx, newCollection[liveStartIdx]);
            liveStartIdx++;
        }
    }
    else if (newCollection != null) {
        // iterable - immediately fallback to the slow path
        const newCollectionIterator = newCollection[Symbol.iterator]();
        let newIterationResult = newCollectionIterator.next();
        while (!newIterationResult.done && liveStartIdx <= liveEndIdx) {
            const liveValue = liveCollection.at(liveStartIdx);
            const newValue = newIterationResult.value;
            const isStartMatching = valuesMatching(liveStartIdx, liveValue, liveStartIdx, newValue, trackByFn);
            if (isStartMatching !== 0) {
                // found a match - move on, but update value
                if (isStartMatching < 0) {
                    liveCollection.updateValue(liveStartIdx, newValue);
                }
                liveStartIdx++;
                newIterationResult = newCollectionIterator.next();
            }
            else {
                detachedItems ??= new UniqueValueMultiKeyMap();
                liveKeysInTheFuture ??=
                    initLiveItemsInTheFuture(liveCollection, liveStartIdx, liveEndIdx, trackByFn);
                // Check if I'm inserting a previously detached item: if so, attach it here
                const newKey = trackByFn(liveStartIdx, newValue);
                if (attachPreviouslyDetached(liveCollection, detachedItems, liveStartIdx, newKey)) {
                    liveCollection.updateValue(liveStartIdx, newValue);
                    liveStartIdx++;
                    liveEndIdx++;
                    newIterationResult = newCollectionIterator.next();
                }
                else if (!liveKeysInTheFuture.has(newKey)) {
                    liveCollection.attach(liveStartIdx, liveCollection.create(liveStartIdx, newValue));
                    liveStartIdx++;
                    liveEndIdx++;
                    newIterationResult = newCollectionIterator.next();
                }
                else {
                    // it is a move forward - detach the current item without advancing in collections
                    const liveKey = trackByFn(liveStartIdx, liveValue);
                    detachedItems.set(liveKey, liveCollection.detach(liveStartIdx));
                    liveEndIdx--;
                }
            }
        }
        // this is a new item as we run out of the items in the old collection - create or attach a
        // previously detached one
        while (!newIterationResult.done) {
            createOrAttach(liveCollection, detachedItems, trackByFn, liveCollection.length, newIterationResult.value);
            newIterationResult = newCollectionIterator.next();
        }
    }
    // Cleanups common to the array and iterable:
    // - more items in the live collection => delete starting from the end;
    while (liveStartIdx <= liveEndIdx) {
        liveCollection.destroy(liveCollection.detach(liveEndIdx--));
    }
    // - destroy items that were detached but never attached again.
    detachedItems?.forEach(item => {
        liveCollection.destroy(item);
    });
}
function attachPreviouslyDetached(prevCollection, detachedItems, index, key) {
    if (detachedItems !== undefined && detachedItems.has(key)) {
        prevCollection.attach(index, detachedItems.get(key));
        detachedItems.delete(key);
        return true;
    }
    return false;
}
function createOrAttach(liveCollection, detachedItems, trackByFn, index, value) {
    if (!attachPreviouslyDetached(liveCollection, detachedItems, index, trackByFn(index, value))) {
        const newItem = liveCollection.create(index, value);
        liveCollection.attach(index, newItem);
    }
    else {
        liveCollection.updateValue(index, value);
    }
}
function initLiveItemsInTheFuture(liveCollection, start, end, trackByFn) {
    const keys = new Set();
    for (let i = start; i <= end; i++) {
        keys.add(trackByFn(i, liveCollection.at(i)));
    }
    return keys;
}
/**
 * A specific, partial implementation of the Map interface with the following characteristics:
 * - allows multiple values for a given key;
 * - maintain FIFO order for multiple values corresponding to a given key;
 * - assumes that all values are unique.
 *
 * The implementation aims at having the minimal overhead for cases where keys are _not_ duplicated
 * (the most common case in the list reconciliation algorithm). To achieve this, the first value for
 * a given key is stored in a regular map. Then, when more values are set for a given key, we
 * maintain a form of linked list in a separate map. To maintain this linked list we assume that all
 * values (in the entire collection) are unique.
 */
export class UniqueValueMultiKeyMap {
    constructor() {
        // A map from a key to the first value corresponding to this key.
        this.kvMap = new Map();
        // A map that acts as a linked list of values - each value maps to the next value in this "linked
        // list" (this only works if values are unique). Allocated lazily to avoid memory consumption when
        // there are no duplicated values.
        this._vMap = undefined;
    }
    has(key) {
        return this.kvMap.has(key);
    }
    delete(key) {
        if (!this.has(key))
            return false;
        const value = this.kvMap.get(key);
        if (this._vMap !== undefined && this._vMap.has(value)) {
            this.kvMap.set(key, this._vMap.get(value));
            this._vMap.delete(value);
        }
        else {
            this.kvMap.delete(key);
        }
        return true;
    }
    get(key) {
        return this.kvMap.get(key);
    }
    set(key, value) {
        if (this.kvMap.has(key)) {
            let prevValue = this.kvMap.get(key);
            ngDevMode &&
                assertNotSame(prevValue, value, `Detected a duplicated value ${value} for the key ${key}`);
            if (this._vMap === undefined) {
                this._vMap = new Map();
            }
            const vMap = this._vMap;
            while (vMap.has(prevValue)) {
                prevValue = vMap.get(prevValue);
            }
            vMap.set(prevValue, value);
        }
        else {
            this.kvMap.set(key, value);
        }
    }
    forEach(cb) {
        for (let [key, value] of this.kvMap) {
            cb(value, key);
            if (this._vMap !== undefined) {
                const vMap = this._vMap;
                while (vMap.has(value)) {
                    value = vMap.get(value);
                    cb(value, key);
                }
            }
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGlzdF9yZWNvbmNpbGlhdGlvbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvbGlzdF9yZWNvbmNpbGlhdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFHSCxPQUFPLEVBQUMsYUFBYSxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFFN0M7Ozs7R0FJRztBQUNILE1BQU0sT0FBZ0IsY0FBYztJQU1sQyxPQUFPLENBQUMsSUFBTztRQUNiLGtCQUFrQjtJQUNwQixDQUFDO0lBQ0QsV0FBVyxDQUFDLEtBQWEsRUFBRSxLQUFRO1FBQ2pDLGtCQUFrQjtJQUNwQixDQUFDO0lBRUQsNEZBQTRGO0lBQzVGLG1GQUFtRjtJQUNuRixrQkFBa0I7SUFDbEIsSUFBSSxDQUFDLE1BQWMsRUFBRSxNQUFjO1FBQ2pDLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBQzFDLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBQ3hDLE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDcEMsSUFBSSxNQUFNLEdBQUcsUUFBUSxHQUFHLENBQUMsRUFBRTtZQUN6QixNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ3hDLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLE9BQU8sQ0FBQyxDQUFDO1lBQy9CLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFLFNBQVMsQ0FBQyxDQUFDO1NBQ2hDO2FBQU07WUFDTCxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRSxPQUFPLENBQUMsQ0FBQztTQUNoQztJQUNILENBQUM7SUFDRCxJQUFJLENBQUMsU0FBaUIsRUFBRSxNQUFjO1FBQ3BDLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQztJQUM5QyxDQUFDO0NBQ0Y7QUFFRCxTQUFTLGNBQWMsQ0FDbkIsT0FBZSxFQUFFLFNBQVksRUFBRSxNQUFjLEVBQUUsUUFBVyxFQUMxRCxPQUEyQjtJQUM3QixJQUFJLE9BQU8sS0FBSyxNQUFNLElBQUksTUFBTSxDQUFDLEVBQUUsQ0FBQyxTQUFTLEVBQUUsUUFBUSxDQUFDLEVBQUU7UUFDeEQsMkNBQTJDO1FBQzNDLE9BQU8sQ0FBQyxDQUFDO0tBQ1Y7U0FBTSxJQUFJLE1BQU0sQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxTQUFTLENBQUMsRUFBRSxPQUFPLENBQUMsTUFBTSxFQUFFLFFBQVEsQ0FBQyxDQUFDLEVBQUU7UUFDNUUsOENBQThDO1FBQzlDLE9BQU8sQ0FBQyxDQUFDLENBQUM7S0FDWDtJQUVELE9BQU8sQ0FBQyxDQUFDO0FBQ1gsQ0FBQztBQUVEOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBc0JHO0FBQ0gsTUFBTSxVQUFVLFNBQVMsQ0FDckIsY0FBb0MsRUFBRSxhQUF5QyxFQUMvRSxTQUE2QjtJQUMvQixJQUFJLGFBQWEsR0FBaUQsU0FBUyxDQUFDO0lBQzVFLElBQUksbUJBQW1CLEdBQTJCLFNBQVMsQ0FBQztJQUU1RCxJQUFJLFlBQVksR0FBRyxDQUFDLENBQUM7SUFDckIsSUFBSSxVQUFVLEdBQUcsY0FBYyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUM7SUFFM0MsSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLGFBQWEsQ0FBQyxFQUFFO1FBQ2hDLElBQUksU0FBUyxHQUFHLGFBQWEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO1FBRXpDLE9BQU8sWUFBWSxJQUFJLFVBQVUsSUFBSSxZQUFZLElBQUksU0FBUyxFQUFFO1lBQzlELDZCQUE2QjtZQUM3QixNQUFNLGNBQWMsR0FBRyxjQUFjLENBQUMsRUFBRSxDQUFDLFlBQVksQ0FBQyxDQUFDO1lBQ3ZELE1BQU0sYUFBYSxHQUFHLGFBQWEsQ0FBQyxZQUFZLENBQUMsQ0FBQztZQUNsRCxNQUFNLGVBQWUsR0FDakIsY0FBYyxDQUFDLFlBQVksRUFBRSxjQUFjLEVBQUUsWUFBWSxFQUFFLGFBQWEsRUFBRSxTQUFTLENBQUMsQ0FBQztZQUN6RixJQUFJLGVBQWUsS0FBSyxDQUFDLEVBQUU7Z0JBQ3pCLElBQUksZUFBZSxHQUFHLENBQUMsRUFBRTtvQkFDdkIsY0FBYyxDQUFDLFdBQVcsQ0FBQyxZQUFZLEVBQUUsYUFBYSxDQUFDLENBQUM7aUJBQ3pEO2dCQUNELFlBQVksRUFBRSxDQUFDO2dCQUNmLFNBQVM7YUFDVjtZQUVELHVCQUF1QjtZQUN2QixpREFBaUQ7WUFDakQsTUFBTSxZQUFZLEdBQUcsY0FBYyxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUNuRCxNQUFNLFdBQVcsR0FBRyxhQUFhLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDN0MsTUFBTSxhQUFhLEdBQ2YsY0FBYyxDQUFDLFVBQVUsRUFBRSxZQUFZLEVBQUUsU0FBUyxFQUFFLFdBQVcsRUFBRSxTQUFTLENBQUMsQ0FBQztZQUNoRixJQUFJLGFBQWEsS0FBSyxDQUFDLEVBQUU7Z0JBQ3ZCLElBQUksYUFBYSxHQUFHLENBQUMsRUFBRTtvQkFDckIsY0FBYyxDQUFDLFdBQVcsQ0FBQyxVQUFVLEVBQUUsV0FBVyxDQUFDLENBQUM7aUJBQ3JEO2dCQUNELFVBQVUsRUFBRSxDQUFDO2dCQUNiLFNBQVMsRUFBRSxDQUFDO2dCQUNaLFNBQVM7YUFDVjtZQUVELHlCQUF5QjtZQUN6QixNQUFNLFlBQVksR0FBRyxTQUFTLENBQUMsWUFBWSxFQUFFLGNBQWMsQ0FBQyxDQUFDO1lBQzdELE1BQU0sVUFBVSxHQUFHLFNBQVMsQ0FBQyxVQUFVLEVBQUUsWUFBWSxDQUFDLENBQUM7WUFDdkQsTUFBTSxXQUFXLEdBQUcsU0FBUyxDQUFDLFlBQVksRUFBRSxhQUFhLENBQUMsQ0FBQztZQUMzRCxJQUFJLE1BQU0sQ0FBQyxFQUFFLENBQUMsV0FBVyxFQUFFLFVBQVUsQ0FBQyxFQUFFO2dCQUN0QyxNQUFNLFNBQVMsR0FBRyxTQUFTLENBQUMsU0FBUyxFQUFFLFdBQVcsQ0FBQyxDQUFDO2dCQUNwRCw0QkFBNEI7Z0JBQzVCLElBQUksTUFBTSxDQUFDLEVBQUUsQ0FBQyxTQUFTLEVBQUUsWUFBWSxDQUFDLEVBQUU7b0JBQ3RDLGNBQWMsQ0FBQyxJQUFJLENBQUMsWUFBWSxFQUFFLFVBQVUsQ0FBQyxDQUFDO29CQUM5QyxjQUFjLENBQUMsV0FBVyxDQUFDLFVBQVUsRUFBRSxXQUFXLENBQUMsQ0FBQztvQkFDcEQsU0FBUyxFQUFFLENBQUM7b0JBQ1osVUFBVSxFQUFFLENBQUM7aUJBQ2Q7cUJBQU07b0JBQ0wsMEZBQTBGO29CQUMxRix1QkFBdUI7b0JBQ3ZCLGNBQWMsQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLFlBQVksQ0FBQyxDQUFDO2lCQUMvQztnQkFDRCxjQUFjLENBQUMsV0FBVyxDQUFDLFlBQVksRUFBRSxhQUFhLENBQUMsQ0FBQztnQkFDeEQsWUFBWSxFQUFFLENBQUM7Z0JBQ2YsU0FBUzthQUNWO1lBRUQseUZBQXlGO1lBQ3pGLGVBQWU7WUFDZixhQUFhLEtBQUssSUFBSSxzQkFBc0IsRUFBRSxDQUFDO1lBQy9DLG1CQUFtQjtnQkFDZix3QkFBd0IsQ0FBQyxjQUFjLEVBQUUsWUFBWSxFQUFFLFVBQVUsRUFBRSxTQUFTLENBQUMsQ0FBQztZQUVsRiwyRUFBMkU7WUFDM0UsSUFBSSx3QkFBd0IsQ0FBQyxjQUFjLEVBQUUsYUFBYSxFQUFFLFlBQVksRUFBRSxXQUFXLENBQUMsRUFBRTtnQkFDdEYsY0FBYyxDQUFDLFdBQVcsQ0FBQyxZQUFZLEVBQUUsYUFBYSxDQUFDLENBQUM7Z0JBQ3hELFlBQVksRUFBRSxDQUFDO2dCQUNmLFVBQVUsRUFBRSxDQUFDO2FBQ2Q7aUJBQU0sSUFBSSxDQUFDLG1CQUFtQixDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsRUFBRTtnQkFDaEQsNEZBQTRGO2dCQUM1RixNQUFNLE9BQU8sR0FBRyxjQUFjLENBQUMsTUFBTSxDQUFDLFlBQVksRUFBRSxhQUFhLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQztnQkFDakYsY0FBYyxDQUFDLE1BQU0sQ0FBQyxZQUFZLEVBQUUsT0FBTyxDQUFDLENBQUM7Z0JBQzdDLFlBQVksRUFBRSxDQUFDO2dCQUNmLFVBQVUsRUFBRSxDQUFDO2FBQ2Q7aUJBQU07Z0JBQ0wsMEZBQTBGO2dCQUMxRiwyRkFBMkY7Z0JBQzNGLDhDQUE4QztnQkFDOUMsYUFBYSxDQUFDLEdBQUcsQ0FBQyxZQUFZLEVBQUUsY0FBYyxDQUFDLE1BQU0sQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDO2dCQUNyRSxVQUFVLEVBQUUsQ0FBQzthQUNkO1NBQ0Y7UUFFRCx1QkFBdUI7UUFDdkIsK0NBQStDO1FBQy9DLE9BQU8sWUFBWSxJQUFJLFNBQVMsRUFBRTtZQUNoQyxjQUFjLENBQ1YsY0FBYyxFQUFFLGFBQWEsRUFBRSxTQUFTLEVBQUUsWUFBWSxFQUFFLGFBQWEsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDO1lBQ3pGLFlBQVksRUFBRSxDQUFDO1NBQ2hCO0tBRUY7U0FBTSxJQUFJLGFBQWEsSUFBSSxJQUFJLEVBQUU7UUFDaEMsbURBQW1EO1FBQ25ELE1BQU0scUJBQXFCLEdBQUcsYUFBYSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDO1FBQy9ELElBQUksa0JBQWtCLEdBQUcscUJBQXFCLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDdEQsT0FBTyxDQUFDLGtCQUFrQixDQUFDLElBQUksSUFBSSxZQUFZLElBQUksVUFBVSxFQUFFO1lBQzdELE1BQU0sU0FBUyxHQUFHLGNBQWMsQ0FBQyxFQUFFLENBQUMsWUFBWSxDQUFDLENBQUM7WUFDbEQsTUFBTSxRQUFRLEdBQUcsa0JBQWtCLENBQUMsS0FBSyxDQUFDO1lBQzFDLE1BQU0sZUFBZSxHQUNqQixjQUFjLENBQUMsWUFBWSxFQUFFLFNBQVMsRUFBRSxZQUFZLEVBQUUsUUFBUSxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQy9FLElBQUksZUFBZSxLQUFLLENBQUMsRUFBRTtnQkFDekIsNENBQTRDO2dCQUM1QyxJQUFJLGVBQWUsR0FBRyxDQUFDLEVBQUU7b0JBQ3ZCLGNBQWMsQ0FBQyxXQUFXLENBQUMsWUFBWSxFQUFFLFFBQVEsQ0FBQyxDQUFDO2lCQUNwRDtnQkFDRCxZQUFZLEVBQUUsQ0FBQztnQkFDZixrQkFBa0IsR0FBRyxxQkFBcUIsQ0FBQyxJQUFJLEVBQUUsQ0FBQzthQUNuRDtpQkFBTTtnQkFDTCxhQUFhLEtBQUssSUFBSSxzQkFBc0IsRUFBRSxDQUFDO2dCQUMvQyxtQkFBbUI7b0JBQ2Ysd0JBQXdCLENBQUMsY0FBYyxFQUFFLFlBQVksRUFBRSxVQUFVLEVBQUUsU0FBUyxDQUFDLENBQUM7Z0JBRWxGLDJFQUEyRTtnQkFDM0UsTUFBTSxNQUFNLEdBQUcsU0FBUyxDQUFDLFlBQVksRUFBRSxRQUFRLENBQUMsQ0FBQztnQkFDakQsSUFBSSx3QkFBd0IsQ0FBQyxjQUFjLEVBQUUsYUFBYSxFQUFFLFlBQVksRUFBRSxNQUFNLENBQUMsRUFBRTtvQkFDakYsY0FBYyxDQUFDLFdBQVcsQ0FBQyxZQUFZLEVBQUUsUUFBUSxDQUFDLENBQUM7b0JBQ25ELFlBQVksRUFBRSxDQUFDO29CQUNmLFVBQVUsRUFBRSxDQUFDO29CQUNiLGtCQUFrQixHQUFHLHFCQUFxQixDQUFDLElBQUksRUFBRSxDQUFDO2lCQUNuRDtxQkFBTSxJQUFJLENBQUMsbUJBQW1CLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxFQUFFO29CQUMzQyxjQUFjLENBQUMsTUFBTSxDQUFDLFlBQVksRUFBRSxjQUFjLENBQUMsTUFBTSxDQUFDLFlBQVksRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFDO29CQUNuRixZQUFZLEVBQUUsQ0FBQztvQkFDZixVQUFVLEVBQUUsQ0FBQztvQkFDYixrQkFBa0IsR0FBRyxxQkFBcUIsQ0FBQyxJQUFJLEVBQUUsQ0FBQztpQkFDbkQ7cUJBQU07b0JBQ0wsa0ZBQWtGO29CQUNsRixNQUFNLE9BQU8sR0FBRyxTQUFTLENBQUMsWUFBWSxFQUFFLFNBQVMsQ0FBQyxDQUFDO29CQUNuRCxhQUFhLENBQUMsR0FBRyxDQUFDLE9BQU8sRUFBRSxjQUFjLENBQUMsTUFBTSxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUM7b0JBQ2hFLFVBQVUsRUFBRSxDQUFDO2lCQUNkO2FBQ0Y7U0FDRjtRQUVELDJGQUEyRjtRQUMzRiwwQkFBMEI7UUFDMUIsT0FBTyxDQUFDLGtCQUFrQixDQUFDLElBQUksRUFBRTtZQUMvQixjQUFjLENBQ1YsY0FBYyxFQUFFLGFBQWEsRUFBRSxTQUFTLEVBQUUsY0FBYyxDQUFDLE1BQU0sRUFDL0Qsa0JBQWtCLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDOUIsa0JBQWtCLEdBQUcscUJBQXFCLENBQUMsSUFBSSxFQUFFLENBQUM7U0FDbkQ7S0FDRjtJQUVELDZDQUE2QztJQUM3Qyx1RUFBdUU7SUFDdkUsT0FBTyxZQUFZLElBQUksVUFBVSxFQUFFO1FBQ2pDLGNBQWMsQ0FBQyxPQUFPLENBQUMsY0FBYyxDQUFDLE1BQU0sQ0FBQyxVQUFVLEVBQUUsQ0FBQyxDQUFDLENBQUM7S0FDN0Q7SUFHRCwrREFBK0Q7SUFDL0QsYUFBYSxFQUFFLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBRTtRQUM1QixjQUFjLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQy9CLENBQUMsQ0FBQyxDQUFDO0FBQ0wsQ0FBQztBQUVELFNBQVMsd0JBQXdCLENBQzdCLGNBQW9DLEVBQ3BDLGFBQTJELEVBQUUsS0FBYSxFQUMxRSxHQUFZO0lBQ2QsSUFBSSxhQUFhLEtBQUssU0FBUyxJQUFJLGFBQWEsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEVBQUU7UUFDekQsY0FBYyxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsYUFBYSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUUsQ0FBQyxDQUFDO1FBQ3RELGFBQWEsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDMUIsT0FBTyxJQUFJLENBQUM7S0FDYjtJQUNELE9BQU8sS0FBSyxDQUFDO0FBQ2YsQ0FBQztBQUVELFNBQVMsY0FBYyxDQUNuQixjQUFvQyxFQUNwQyxhQUEyRCxFQUMzRCxTQUFtQyxFQUFFLEtBQWEsRUFBRSxLQUFRO0lBQzlELElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxjQUFjLEVBQUUsYUFBYSxFQUFFLEtBQUssRUFBRSxTQUFTLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDLEVBQUU7UUFDNUYsTUFBTSxPQUFPLEdBQUcsY0FBYyxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDcEQsY0FBYyxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsT0FBTyxDQUFDLENBQUM7S0FDdkM7U0FBTTtRQUNMLGNBQWMsQ0FBQyxXQUFXLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO0tBQzFDO0FBQ0gsQ0FBQztBQUVELFNBQVMsd0JBQXdCLENBQzdCLGNBQWdELEVBQUUsS0FBYSxFQUFFLEdBQVcsRUFDNUUsU0FBbUM7SUFDckMsTUFBTSxJQUFJLEdBQUcsSUFBSSxHQUFHLEVBQUUsQ0FBQztJQUN2QixLQUFLLElBQUksQ0FBQyxHQUFHLEtBQUssRUFBRSxDQUFDLElBQUksR0FBRyxFQUFFLENBQUMsRUFBRSxFQUFFO1FBQ2pDLElBQUksQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxjQUFjLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztLQUM5QztJQUNELE9BQU8sSUFBSSxDQUFDO0FBQ2QsQ0FBQztBQUVEOzs7Ozs7Ozs7OztHQVdHO0FBQ0gsTUFBTSxPQUFPLHNCQUFzQjtJQUFuQztRQUNFLGlFQUFpRTtRQUN6RCxVQUFLLEdBQUcsSUFBSSxHQUFHLEVBQVEsQ0FBQztRQUNoQyxpR0FBaUc7UUFDakcsa0dBQWtHO1FBQ2xHLGtDQUFrQztRQUMxQixVQUFLLEdBQXdCLFNBQVMsQ0FBQztJQXlEakQsQ0FBQztJQXZEQyxHQUFHLENBQUMsR0FBTTtRQUNSLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDN0IsQ0FBQztJQUVELE1BQU0sQ0FBQyxHQUFNO1FBQ1gsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDO1lBQUUsT0FBTyxLQUFLLENBQUM7UUFFakMsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFFLENBQUM7UUFDbkMsSUFBSSxJQUFJLENBQUMsS0FBSyxLQUFLLFNBQVMsSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsRUFBRTtZQUNyRCxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFFLENBQUMsQ0FBQztZQUM1QyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQztTQUMxQjthQUFNO1lBQ0wsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7U0FDeEI7UUFFRCxPQUFPLElBQUksQ0FBQztJQUNkLENBQUM7SUFFRCxHQUFHLENBQUMsR0FBTTtRQUNSLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDN0IsQ0FBQztJQUVELEdBQUcsQ0FBQyxHQUFNLEVBQUUsS0FBUTtRQUNsQixJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFFO1lBQ3ZCLElBQUksU0FBUyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBRSxDQUFDO1lBQ3JDLFNBQVM7Z0JBQ0wsYUFBYSxDQUNULFNBQVMsRUFBRSxLQUFLLEVBQUUsK0JBQStCLEtBQUssZ0JBQWdCLEdBQUcsRUFBRSxDQUFDLENBQUM7WUFFckYsSUFBSSxJQUFJLENBQUMsS0FBSyxLQUFLLFNBQVMsRUFBRTtnQkFDNUIsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLEdBQUcsRUFBRSxDQUFDO2FBQ3hCO1lBRUQsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQztZQUN4QixPQUFPLElBQUksQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLEVBQUU7Z0JBQzFCLFNBQVMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBRSxDQUFDO2FBQ2xDO1lBQ0QsSUFBSSxDQUFDLEdBQUcsQ0FBQyxTQUFTLEVBQUUsS0FBSyxDQUFDLENBQUM7U0FDNUI7YUFBTTtZQUNMLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxLQUFLLENBQUMsQ0FBQztTQUM1QjtJQUNILENBQUM7SUFFRCxPQUFPLENBQUMsRUFBd0I7UUFDOUIsS0FBSyxJQUFJLENBQUMsR0FBRyxFQUFFLEtBQUssQ0FBQyxJQUFJLElBQUksQ0FBQyxLQUFLLEVBQUU7WUFDbkMsRUFBRSxDQUFDLEtBQUssRUFBRSxHQUFHLENBQUMsQ0FBQztZQUNmLElBQUksSUFBSSxDQUFDLEtBQUssS0FBSyxTQUFTLEVBQUU7Z0JBQzVCLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUM7Z0JBQ3hCLE9BQU8sSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsRUFBRTtvQkFDdEIsS0FBSyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFFLENBQUM7b0JBQ3pCLEVBQUUsQ0FBQyxLQUFLLEVBQUUsR0FBRyxDQUFDLENBQUM7aUJBQ2hCO2FBQ0Y7U0FDRjtJQUNILENBQUM7Q0FDRiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1RyYWNrQnlGdW5jdGlvbn0gZnJvbSAnLi4vY2hhbmdlX2RldGVjdGlvbic7XG5pbXBvcnQge2Fzc2VydE5vdFNhbWV9IGZyb20gJy4uL3V0aWwvYXNzZXJ0JztcblxuLyoqXG4gKiBBIHR5cGUgcmVwcmVzZW50aW5nIHRoZSBsaXZlIGNvbGxlY3Rpb24gdG8gYmUgcmVjb25jaWxlZCB3aXRoIGFueSBuZXcgKGluY29taW5nKSBjb2xsZWN0aW9uLiBUaGlzXG4gKiBpcyBhbiBhZGFwdGVyIGNsYXNzIHRoYXQgbWFrZXMgaXQgcG9zc2libGUgdG8gd29yayB3aXRoIGRpZmZlcmVudCBpbnRlcm5hbCBkYXRhIHN0cnVjdHVyZXMsXG4gKiByZWdhcmRsZXNzIG9mIHRoZSBhY3R1YWwgdmFsdWVzIG9mIHRoZSBpbmNvbWluZyBjb2xsZWN0aW9uLlxuICovXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgTGl2ZUNvbGxlY3Rpb248VCwgVj4ge1xuICBhYnN0cmFjdCBnZXQgbGVuZ3RoKCk6IG51bWJlcjtcbiAgYWJzdHJhY3QgYXQoaW5kZXg6IG51bWJlcik6IFY7XG4gIGFic3RyYWN0IGF0dGFjaChpbmRleDogbnVtYmVyLCBpdGVtOiBUKTogdm9pZDtcbiAgYWJzdHJhY3QgZGV0YWNoKGluZGV4OiBudW1iZXIpOiBUO1xuICBhYnN0cmFjdCBjcmVhdGUoaW5kZXg6IG51bWJlciwgdmFsdWU6IFYpOiBUO1xuICBkZXN0cm95KGl0ZW06IFQpOiB2b2lkIHtcbiAgICAvLyBub29wIGJ5IGRlZmF1bHRcbiAgfVxuICB1cGRhdGVWYWx1ZShpbmRleDogbnVtYmVyLCB2YWx1ZTogVik6IHZvaWQge1xuICAgIC8vIG5vb3AgYnkgZGVmYXVsdFxuICB9XG5cbiAgLy8gb3BlcmF0aW9ucyBiZWxvdyBjb3VsZCBiZSBpbXBsZW1lbnRlZCBvbiB0b3Agb2YgdGhlIG9wZXJhdGlvbnMgZGVmaW5lZCBzbyBmYXIsIGJ1dCBoYXZpbmdcbiAgLy8gdGhlbSBleHBsaWNpdGx5IGFsbG93IGNsZWFyIGV4cHJlc3Npb24gb2YgaW50ZW50IGFuZCBwb3RlbnRpYWxseSBtb3JlIHBlcmZvcm1hbnRcbiAgLy8gaW1wbGVtZW50YXRpb25zXG4gIHN3YXAoaW5kZXgxOiBudW1iZXIsIGluZGV4MjogbnVtYmVyKTogdm9pZCB7XG4gICAgY29uc3Qgc3RhcnRJZHggPSBNYXRoLm1pbihpbmRleDEsIGluZGV4Mik7XG4gICAgY29uc3QgZW5kSWR4ID0gTWF0aC5tYXgoaW5kZXgxLCBpbmRleDIpO1xuICAgIGNvbnN0IGVuZEl0ZW0gPSB0aGlzLmRldGFjaChlbmRJZHgpO1xuICAgIGlmIChlbmRJZHggLSBzdGFydElkeCA+IDEpIHtcbiAgICAgIGNvbnN0IHN0YXJ0SXRlbSA9IHRoaXMuZGV0YWNoKHN0YXJ0SWR4KTtcbiAgICAgIHRoaXMuYXR0YWNoKHN0YXJ0SWR4LCBlbmRJdGVtKTtcbiAgICAgIHRoaXMuYXR0YWNoKGVuZElkeCwgc3RhcnRJdGVtKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5hdHRhY2goc3RhcnRJZHgsIGVuZEl0ZW0pO1xuICAgIH1cbiAgfVxuICBtb3ZlKHByZXZJbmRleDogbnVtYmVyLCBuZXdJZHg6IG51bWJlcik6IHZvaWQge1xuICAgIHRoaXMuYXR0YWNoKG5ld0lkeCwgdGhpcy5kZXRhY2gocHJldkluZGV4KSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gdmFsdWVzTWF0Y2hpbmc8Vj4oXG4gICAgbGl2ZUlkeDogbnVtYmVyLCBsaXZlVmFsdWU6IFYsIG5ld0lkeDogbnVtYmVyLCBuZXdWYWx1ZTogVixcbiAgICB0cmFja0J5OiBUcmFja0J5RnVuY3Rpb248Vj4pOiBudW1iZXIge1xuICBpZiAobGl2ZUlkeCA9PT0gbmV3SWR4ICYmIE9iamVjdC5pcyhsaXZlVmFsdWUsIG5ld1ZhbHVlKSkge1xuICAgIC8vIG1hdGNoaW5nIGFuZCBubyB2YWx1ZSBpZGVudGl0eSB0byB1cGRhdGVcbiAgICByZXR1cm4gMTtcbiAgfSBlbHNlIGlmIChPYmplY3QuaXModHJhY2tCeShsaXZlSWR4LCBsaXZlVmFsdWUpLCB0cmFja0J5KG5ld0lkeCwgbmV3VmFsdWUpKSkge1xuICAgIC8vIG1hdGNoaW5nIGJ1dCByZXF1aXJlcyB2YWx1ZSBpZGVudGl0eSB1cGRhdGVcbiAgICByZXR1cm4gLTE7XG4gIH1cblxuICByZXR1cm4gMDtcbn1cblxuLyoqXG4gKiBUaGUgbGl2ZSBjb2xsZWN0aW9uIHJlY29uY2lsaWF0aW9uIGFsZ29yaXRobSB0aGF0IHBlcmZvcm0gdmFyaW91cyBpbi1wbGFjZSBvcGVyYXRpb25zLCBzbyBpdFxuICogcmVmbGVjdHMgdGhlIGNvbnRlbnQgb2YgdGhlIG5ldyAoaW5jb21pbmcpIGNvbGxlY3Rpb24uXG4gKlxuICogVGhlIHJlY29uY2lsaWF0aW9uIGFsZ29yaXRobSBoYXMgMiBjb2RlIHBhdGhzOlxuICogLSBcImZhc3RcIiBwYXRoIHRoYXQgZG9uJ3QgcmVxdWlyZSBhbnkgbWVtb3J5IGFsbG9jYXRpb247XG4gKiAtIFwic2xvd1wiIHBhdGggdGhhdCByZXF1aXJlcyBhZGRpdGlvbmFsIG1lbW9yeSBhbGxvY2F0aW9uIGZvciBpbnRlcm1lZGlhdGUgZGF0YSBzdHJ1Y3R1cmVzIHVzZWQgdG9cbiAqIGNvbGxlY3QgYWRkaXRpb25hbCBpbmZvcm1hdGlvbiBhYm91dCB0aGUgbGl2ZSBjb2xsZWN0aW9uLlxuICogSXQgbWlnaHQgaGFwcGVuIHRoYXQgdGhlIGFsZ29yaXRobSBzd2l0Y2hlcyBiZXR3ZWVuIHRoZSB0d28gbW9kZXMgaW4gcXVlc3Rpb24gaW4gYSBzaW5nbGVcbiAqIHJlY29uY2lsaWF0aW9uIHBhdGggLSBnZW5lcmFsbHkgaXQgdHJpZXMgdG8gc3RheSBvbiB0aGUgXCJmYXN0XCIgcGF0aCBhcyBtdWNoIGFzIHBvc3NpYmxlLlxuICpcbiAqIFRoZSBvdmVyYWxsIGNvbXBsZXhpdHkgb2YgdGhlIGFsZ29yaXRobSBpcyBPKG4gKyBtKSBmb3Igc3BlZWQgYW5kIE8obikgZm9yIG1lbW9yeSAod2hlcmUgbiBpcyB0aGVcbiAqIGxlbmd0aCBvZiB0aGUgbGl2ZSBjb2xsZWN0aW9uIGFuZCBtIGlzIHRoZSBsZW5ndGggb2YgdGhlIGluY29taW5nIGNvbGxlY3Rpb24pLiBHaXZlbiB0aGUgcHJvYmxlbVxuICogYXQgaGFuZCB0aGUgY29tcGxleGl0eSAvIHBlcmZvcm1hbmNlIGNvbnN0cmFpbnRzIG1ha2VzIGl0IGltcG9zc2libGUgdG8gcGVyZm9ybSB0aGUgYWJzb2x1dGVcbiAqIG1pbmltdW0gb2Ygb3BlcmF0aW9uIHRvIHJlY29uY2lsZSB0aGUgMiBjb2xsZWN0aW9ucy4gVGhlIGFsZ29yaXRobSBtYWtlcyBkaWZmZXJlbnQgdHJhZGVvZmZzIHRvXG4gKiBzdGF5IHdpdGhpbiByZWFzb25hYmxlIHBlcmZvcm1hbmNlIGJvdW5kcyBhbmQgbWF5IGFwcGx5IHN1Yi1vcHRpbWFsIG51bWJlciBvZiBvcGVyYXRpb25zIGluXG4gKiBjZXJ0YWluIHNpdHVhdGlvbnMuXG4gKlxuICogQHBhcmFtIGxpdmVDb2xsZWN0aW9uIHRoZSBjdXJyZW50LCBsaXZlIGNvbGxlY3Rpb247XG4gKiBAcGFyYW0gbmV3Q29sbGVjdGlvbiB0aGUgbmV3LCBpbmNvbWluZyBjb2xsZWN0aW9uO1xuICogQHBhcmFtIHRyYWNrQnlGbiBrZXkgZ2VuZXJhdGlvbiBmdW5jdGlvbiB0aGF0IGRldGVybWluZXMgZXF1YWxpdHkgYmV0d2VlbiBpdGVtcyBpbiB0aGUgbGlmZSBhbmRcbiAqICAgICBpbmNvbWluZyBjb2xsZWN0aW9uO1xuICovXG5leHBvcnQgZnVuY3Rpb24gcmVjb25jaWxlPFQsIFY+KFxuICAgIGxpdmVDb2xsZWN0aW9uOiBMaXZlQ29sbGVjdGlvbjxULCBWPiwgbmV3Q29sbGVjdGlvbjogSXRlcmFibGU8Vj58dW5kZWZpbmVkfG51bGwsXG4gICAgdHJhY2tCeUZuOiBUcmFja0J5RnVuY3Rpb248Vj4pOiB2b2lkIHtcbiAgbGV0IGRldGFjaGVkSXRlbXM6IFVuaXF1ZVZhbHVlTXVsdGlLZXlNYXA8dW5rbm93biwgVD58dW5kZWZpbmVkID0gdW5kZWZpbmVkO1xuICBsZXQgbGl2ZUtleXNJblRoZUZ1dHVyZTogU2V0PHVua25vd24+fHVuZGVmaW5lZCA9IHVuZGVmaW5lZDtcblxuICBsZXQgbGl2ZVN0YXJ0SWR4ID0gMDtcbiAgbGV0IGxpdmVFbmRJZHggPSBsaXZlQ29sbGVjdGlvbi5sZW5ndGggLSAxO1xuXG4gIGlmIChBcnJheS5pc0FycmF5KG5ld0NvbGxlY3Rpb24pKSB7XG4gICAgbGV0IG5ld0VuZElkeCA9IG5ld0NvbGxlY3Rpb24ubGVuZ3RoIC0gMTtcblxuICAgIHdoaWxlIChsaXZlU3RhcnRJZHggPD0gbGl2ZUVuZElkeCAmJiBsaXZlU3RhcnRJZHggPD0gbmV3RW5kSWR4KSB7XG4gICAgICAvLyBjb21wYXJlIGZyb20gdGhlIGJlZ2lubmluZ1xuICAgICAgY29uc3QgbGl2ZVN0YXJ0VmFsdWUgPSBsaXZlQ29sbGVjdGlvbi5hdChsaXZlU3RhcnRJZHgpO1xuICAgICAgY29uc3QgbmV3U3RhcnRWYWx1ZSA9IG5ld0NvbGxlY3Rpb25bbGl2ZVN0YXJ0SWR4XTtcbiAgICAgIGNvbnN0IGlzU3RhcnRNYXRjaGluZyA9XG4gICAgICAgICAgdmFsdWVzTWF0Y2hpbmcobGl2ZVN0YXJ0SWR4LCBsaXZlU3RhcnRWYWx1ZSwgbGl2ZVN0YXJ0SWR4LCBuZXdTdGFydFZhbHVlLCB0cmFja0J5Rm4pO1xuICAgICAgaWYgKGlzU3RhcnRNYXRjaGluZyAhPT0gMCkge1xuICAgICAgICBpZiAoaXNTdGFydE1hdGNoaW5nIDwgMCkge1xuICAgICAgICAgIGxpdmVDb2xsZWN0aW9uLnVwZGF0ZVZhbHVlKGxpdmVTdGFydElkeCwgbmV3U3RhcnRWYWx1ZSk7XG4gICAgICAgIH1cbiAgICAgICAgbGl2ZVN0YXJ0SWR4Kys7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICAvLyBjb21wYXJlIGZyb20gdGhlIGVuZFxuICAgICAgLy8gVE9ETyhwZXJmKTogZG8gX2FsbF8gdGhlIG1hdGNoaW5nIGZyb20gdGhlIGVuZFxuICAgICAgY29uc3QgbGl2ZUVuZFZhbHVlID0gbGl2ZUNvbGxlY3Rpb24uYXQobGl2ZUVuZElkeCk7XG4gICAgICBjb25zdCBuZXdFbmRWYWx1ZSA9IG5ld0NvbGxlY3Rpb25bbmV3RW5kSWR4XTtcbiAgICAgIGNvbnN0IGlzRW5kTWF0Y2hpbmcgPVxuICAgICAgICAgIHZhbHVlc01hdGNoaW5nKGxpdmVFbmRJZHgsIGxpdmVFbmRWYWx1ZSwgbmV3RW5kSWR4LCBuZXdFbmRWYWx1ZSwgdHJhY2tCeUZuKTtcbiAgICAgIGlmIChpc0VuZE1hdGNoaW5nICE9PSAwKSB7XG4gICAgICAgIGlmIChpc0VuZE1hdGNoaW5nIDwgMCkge1xuICAgICAgICAgIGxpdmVDb2xsZWN0aW9uLnVwZGF0ZVZhbHVlKGxpdmVFbmRJZHgsIG5ld0VuZFZhbHVlKTtcbiAgICAgICAgfVxuICAgICAgICBsaXZlRW5kSWR4LS07XG4gICAgICAgIG5ld0VuZElkeC0tO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgLy8gRGV0ZWN0IHN3YXAgYW5kIG1vdmVzOlxuICAgICAgY29uc3QgbGl2ZVN0YXJ0S2V5ID0gdHJhY2tCeUZuKGxpdmVTdGFydElkeCwgbGl2ZVN0YXJ0VmFsdWUpO1xuICAgICAgY29uc3QgbGl2ZUVuZEtleSA9IHRyYWNrQnlGbihsaXZlRW5kSWR4LCBsaXZlRW5kVmFsdWUpO1xuICAgICAgY29uc3QgbmV3U3RhcnRLZXkgPSB0cmFja0J5Rm4obGl2ZVN0YXJ0SWR4LCBuZXdTdGFydFZhbHVlKTtcbiAgICAgIGlmIChPYmplY3QuaXMobmV3U3RhcnRLZXksIGxpdmVFbmRLZXkpKSB7XG4gICAgICAgIGNvbnN0IG5ld0VuZEtleSA9IHRyYWNrQnlGbihuZXdFbmRJZHgsIG5ld0VuZFZhbHVlKTtcbiAgICAgICAgLy8gZGV0ZWN0IHN3YXAgb24gYm90aCBlbmRzO1xuICAgICAgICBpZiAoT2JqZWN0LmlzKG5ld0VuZEtleSwgbGl2ZVN0YXJ0S2V5KSkge1xuICAgICAgICAgIGxpdmVDb2xsZWN0aW9uLnN3YXAobGl2ZVN0YXJ0SWR4LCBsaXZlRW5kSWR4KTtcbiAgICAgICAgICBsaXZlQ29sbGVjdGlvbi51cGRhdGVWYWx1ZShsaXZlRW5kSWR4LCBuZXdFbmRWYWx1ZSk7XG4gICAgICAgICAgbmV3RW5kSWR4LS07XG4gICAgICAgICAgbGl2ZUVuZElkeC0tO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIHRoZSBuZXcgaXRlbSBpcyB0aGUgc2FtZSBhcyB0aGUgbGl2ZSBpdGVtIHdpdGggdGhlIGVuZCBwb2ludGVyIC0gdGhpcyBpcyBhIG1vdmUgZm9yd2FyZFxuICAgICAgICAgIC8vIHRvIGFuIGVhcmxpZXIgaW5kZXg7XG4gICAgICAgICAgbGl2ZUNvbGxlY3Rpb24ubW92ZShsaXZlRW5kSWR4LCBsaXZlU3RhcnRJZHgpO1xuICAgICAgICB9XG4gICAgICAgIGxpdmVDb2xsZWN0aW9uLnVwZGF0ZVZhbHVlKGxpdmVTdGFydElkeCwgbmV3U3RhcnRWYWx1ZSk7XG4gICAgICAgIGxpdmVTdGFydElkeCsrO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgLy8gRmFsbGJhY2sgdG8gdGhlIHNsb3cgcGF0aDogd2UgbmVlZCB0byBsZWFybiBtb3JlIGFib3V0IHRoZSBjb250ZW50IG9mIHRoZSBsaXZlIGFuZCBuZXdcbiAgICAgIC8vIGNvbGxlY3Rpb25zLlxuICAgICAgZGV0YWNoZWRJdGVtcyA/Pz0gbmV3IFVuaXF1ZVZhbHVlTXVsdGlLZXlNYXAoKTtcbiAgICAgIGxpdmVLZXlzSW5UaGVGdXR1cmUgPz89XG4gICAgICAgICAgaW5pdExpdmVJdGVtc0luVGhlRnV0dXJlKGxpdmVDb2xsZWN0aW9uLCBsaXZlU3RhcnRJZHgsIGxpdmVFbmRJZHgsIHRyYWNrQnlGbik7XG5cbiAgICAgIC8vIENoZWNrIGlmIEknbSBpbnNlcnRpbmcgYSBwcmV2aW91c2x5IGRldGFjaGVkIGl0ZW06IGlmIHNvLCBhdHRhY2ggaXQgaGVyZVxuICAgICAgaWYgKGF0dGFjaFByZXZpb3VzbHlEZXRhY2hlZChsaXZlQ29sbGVjdGlvbiwgZGV0YWNoZWRJdGVtcywgbGl2ZVN0YXJ0SWR4LCBuZXdTdGFydEtleSkpIHtcbiAgICAgICAgbGl2ZUNvbGxlY3Rpb24udXBkYXRlVmFsdWUobGl2ZVN0YXJ0SWR4LCBuZXdTdGFydFZhbHVlKTtcbiAgICAgICAgbGl2ZVN0YXJ0SWR4Kys7XG4gICAgICAgIGxpdmVFbmRJZHgrKztcbiAgICAgIH0gZWxzZSBpZiAoIWxpdmVLZXlzSW5UaGVGdXR1cmUuaGFzKG5ld1N0YXJ0S2V5KSkge1xuICAgICAgICAvLyBDaGVjayBpZiB3ZSBzZWVuIGEgbmV3IGl0ZW0gdGhhdCBkb2Vzbid0IGV4aXN0IGluIHRoZSBvbGQgY29sbGVjdGlvbiBhbmQgbXVzdCBiZSBJTlNFUlRFRFxuICAgICAgICBjb25zdCBuZXdJdGVtID0gbGl2ZUNvbGxlY3Rpb24uY3JlYXRlKGxpdmVTdGFydElkeCwgbmV3Q29sbGVjdGlvbltsaXZlU3RhcnRJZHhdKTtcbiAgICAgICAgbGl2ZUNvbGxlY3Rpb24uYXR0YWNoKGxpdmVTdGFydElkeCwgbmV3SXRlbSk7XG4gICAgICAgIGxpdmVTdGFydElkeCsrO1xuICAgICAgICBsaXZlRW5kSWR4Kys7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBXZSBrbm93IHRoYXQgdGhlIG5ldyBpdGVtIGV4aXN0cyBsYXRlciBvbiBpbiBvbGQgY29sbGVjdGlvbiBidXQgd2UgZG9uJ3Qga25vdyBpdHMgaW5kZXhcbiAgICAgICAgLy8gYW5kIGFzIHRoZSBjb25zZXF1ZW5jZSBjYW4ndCBtb3ZlIGl0IChkb24ndCBrbm93IHdoZXJlIHRvIGZpbmQgaXQpLiBEZXRhY2ggdGhlIG9sZCBpdGVtLFxuICAgICAgICAvLyBob3BpbmcgdGhhdCBpdCB1bmxvY2tzIHRoZSBmYXN0IHBhdGggYWdhaW4uXG4gICAgICAgIGRldGFjaGVkSXRlbXMuc2V0KGxpdmVTdGFydEtleSwgbGl2ZUNvbGxlY3Rpb24uZGV0YWNoKGxpdmVTdGFydElkeCkpO1xuICAgICAgICBsaXZlRW5kSWR4LS07XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gRmluYWwgY2xlYW51cCBzdGVwczpcbiAgICAvLyAtIG1vcmUgaXRlbXMgaW4gdGhlIG5ldyBjb2xsZWN0aW9uID0+IGluc2VydFxuICAgIHdoaWxlIChsaXZlU3RhcnRJZHggPD0gbmV3RW5kSWR4KSB7XG4gICAgICBjcmVhdGVPckF0dGFjaChcbiAgICAgICAgICBsaXZlQ29sbGVjdGlvbiwgZGV0YWNoZWRJdGVtcywgdHJhY2tCeUZuLCBsaXZlU3RhcnRJZHgsIG5ld0NvbGxlY3Rpb25bbGl2ZVN0YXJ0SWR4XSk7XG4gICAgICBsaXZlU3RhcnRJZHgrKztcbiAgICB9XG5cbiAgfSBlbHNlIGlmIChuZXdDb2xsZWN0aW9uICE9IG51bGwpIHtcbiAgICAvLyBpdGVyYWJsZSAtIGltbWVkaWF0ZWx5IGZhbGxiYWNrIHRvIHRoZSBzbG93IHBhdGhcbiAgICBjb25zdCBuZXdDb2xsZWN0aW9uSXRlcmF0b3IgPSBuZXdDb2xsZWN0aW9uW1N5bWJvbC5pdGVyYXRvcl0oKTtcbiAgICBsZXQgbmV3SXRlcmF0aW9uUmVzdWx0ID0gbmV3Q29sbGVjdGlvbkl0ZXJhdG9yLm5leHQoKTtcbiAgICB3aGlsZSAoIW5ld0l0ZXJhdGlvblJlc3VsdC5kb25lICYmIGxpdmVTdGFydElkeCA8PSBsaXZlRW5kSWR4KSB7XG4gICAgICBjb25zdCBsaXZlVmFsdWUgPSBsaXZlQ29sbGVjdGlvbi5hdChsaXZlU3RhcnRJZHgpO1xuICAgICAgY29uc3QgbmV3VmFsdWUgPSBuZXdJdGVyYXRpb25SZXN1bHQudmFsdWU7XG4gICAgICBjb25zdCBpc1N0YXJ0TWF0Y2hpbmcgPVxuICAgICAgICAgIHZhbHVlc01hdGNoaW5nKGxpdmVTdGFydElkeCwgbGl2ZVZhbHVlLCBsaXZlU3RhcnRJZHgsIG5ld1ZhbHVlLCB0cmFja0J5Rm4pO1xuICAgICAgaWYgKGlzU3RhcnRNYXRjaGluZyAhPT0gMCkge1xuICAgICAgICAvLyBmb3VuZCBhIG1hdGNoIC0gbW92ZSBvbiwgYnV0IHVwZGF0ZSB2YWx1ZVxuICAgICAgICBpZiAoaXNTdGFydE1hdGNoaW5nIDwgMCkge1xuICAgICAgICAgIGxpdmVDb2xsZWN0aW9uLnVwZGF0ZVZhbHVlKGxpdmVTdGFydElkeCwgbmV3VmFsdWUpO1xuICAgICAgICB9XG4gICAgICAgIGxpdmVTdGFydElkeCsrO1xuICAgICAgICBuZXdJdGVyYXRpb25SZXN1bHQgPSBuZXdDb2xsZWN0aW9uSXRlcmF0b3IubmV4dCgpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZGV0YWNoZWRJdGVtcyA/Pz0gbmV3IFVuaXF1ZVZhbHVlTXVsdGlLZXlNYXAoKTtcbiAgICAgICAgbGl2ZUtleXNJblRoZUZ1dHVyZSA/Pz1cbiAgICAgICAgICAgIGluaXRMaXZlSXRlbXNJblRoZUZ1dHVyZShsaXZlQ29sbGVjdGlvbiwgbGl2ZVN0YXJ0SWR4LCBsaXZlRW5kSWR4LCB0cmFja0J5Rm4pO1xuXG4gICAgICAgIC8vIENoZWNrIGlmIEknbSBpbnNlcnRpbmcgYSBwcmV2aW91c2x5IGRldGFjaGVkIGl0ZW06IGlmIHNvLCBhdHRhY2ggaXQgaGVyZVxuICAgICAgICBjb25zdCBuZXdLZXkgPSB0cmFja0J5Rm4obGl2ZVN0YXJ0SWR4LCBuZXdWYWx1ZSk7XG4gICAgICAgIGlmIChhdHRhY2hQcmV2aW91c2x5RGV0YWNoZWQobGl2ZUNvbGxlY3Rpb24sIGRldGFjaGVkSXRlbXMsIGxpdmVTdGFydElkeCwgbmV3S2V5KSkge1xuICAgICAgICAgIGxpdmVDb2xsZWN0aW9uLnVwZGF0ZVZhbHVlKGxpdmVTdGFydElkeCwgbmV3VmFsdWUpO1xuICAgICAgICAgIGxpdmVTdGFydElkeCsrO1xuICAgICAgICAgIGxpdmVFbmRJZHgrKztcbiAgICAgICAgICBuZXdJdGVyYXRpb25SZXN1bHQgPSBuZXdDb2xsZWN0aW9uSXRlcmF0b3IubmV4dCgpO1xuICAgICAgICB9IGVsc2UgaWYgKCFsaXZlS2V5c0luVGhlRnV0dXJlLmhhcyhuZXdLZXkpKSB7XG4gICAgICAgICAgbGl2ZUNvbGxlY3Rpb24uYXR0YWNoKGxpdmVTdGFydElkeCwgbGl2ZUNvbGxlY3Rpb24uY3JlYXRlKGxpdmVTdGFydElkeCwgbmV3VmFsdWUpKTtcbiAgICAgICAgICBsaXZlU3RhcnRJZHgrKztcbiAgICAgICAgICBsaXZlRW5kSWR4Kys7XG4gICAgICAgICAgbmV3SXRlcmF0aW9uUmVzdWx0ID0gbmV3Q29sbGVjdGlvbkl0ZXJhdG9yLm5leHQoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBpdCBpcyBhIG1vdmUgZm9yd2FyZCAtIGRldGFjaCB0aGUgY3VycmVudCBpdGVtIHdpdGhvdXQgYWR2YW5jaW5nIGluIGNvbGxlY3Rpb25zXG4gICAgICAgICAgY29uc3QgbGl2ZUtleSA9IHRyYWNrQnlGbihsaXZlU3RhcnRJZHgsIGxpdmVWYWx1ZSk7XG4gICAgICAgICAgZGV0YWNoZWRJdGVtcy5zZXQobGl2ZUtleSwgbGl2ZUNvbGxlY3Rpb24uZGV0YWNoKGxpdmVTdGFydElkeCkpO1xuICAgICAgICAgIGxpdmVFbmRJZHgtLTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIC8vIHRoaXMgaXMgYSBuZXcgaXRlbSBhcyB3ZSBydW4gb3V0IG9mIHRoZSBpdGVtcyBpbiB0aGUgb2xkIGNvbGxlY3Rpb24gLSBjcmVhdGUgb3IgYXR0YWNoIGFcbiAgICAvLyBwcmV2aW91c2x5IGRldGFjaGVkIG9uZVxuICAgIHdoaWxlICghbmV3SXRlcmF0aW9uUmVzdWx0LmRvbmUpIHtcbiAgICAgIGNyZWF0ZU9yQXR0YWNoKFxuICAgICAgICAgIGxpdmVDb2xsZWN0aW9uLCBkZXRhY2hlZEl0ZW1zLCB0cmFja0J5Rm4sIGxpdmVDb2xsZWN0aW9uLmxlbmd0aCxcbiAgICAgICAgICBuZXdJdGVyYXRpb25SZXN1bHQudmFsdWUpO1xuICAgICAgbmV3SXRlcmF0aW9uUmVzdWx0ID0gbmV3Q29sbGVjdGlvbkl0ZXJhdG9yLm5leHQoKTtcbiAgICB9XG4gIH1cblxuICAvLyBDbGVhbnVwcyBjb21tb24gdG8gdGhlIGFycmF5IGFuZCBpdGVyYWJsZTpcbiAgLy8gLSBtb3JlIGl0ZW1zIGluIHRoZSBsaXZlIGNvbGxlY3Rpb24gPT4gZGVsZXRlIHN0YXJ0aW5nIGZyb20gdGhlIGVuZDtcbiAgd2hpbGUgKGxpdmVTdGFydElkeCA8PSBsaXZlRW5kSWR4KSB7XG4gICAgbGl2ZUNvbGxlY3Rpb24uZGVzdHJveShsaXZlQ29sbGVjdGlvbi5kZXRhY2gobGl2ZUVuZElkeC0tKSk7XG4gIH1cblxuXG4gIC8vIC0gZGVzdHJveSBpdGVtcyB0aGF0IHdlcmUgZGV0YWNoZWQgYnV0IG5ldmVyIGF0dGFjaGVkIGFnYWluLlxuICBkZXRhY2hlZEl0ZW1zPy5mb3JFYWNoKGl0ZW0gPT4ge1xuICAgIGxpdmVDb2xsZWN0aW9uLmRlc3Ryb3koaXRlbSk7XG4gIH0pO1xufVxuXG5mdW5jdGlvbiBhdHRhY2hQcmV2aW91c2x5RGV0YWNoZWQ8VCwgVj4oXG4gICAgcHJldkNvbGxlY3Rpb246IExpdmVDb2xsZWN0aW9uPFQsIFY+LFxuICAgIGRldGFjaGVkSXRlbXM6IFVuaXF1ZVZhbHVlTXVsdGlLZXlNYXA8dW5rbm93biwgVD58dW5kZWZpbmVkLCBpbmRleDogbnVtYmVyLFxuICAgIGtleTogdW5rbm93bik6IGJvb2xlYW4ge1xuICBpZiAoZGV0YWNoZWRJdGVtcyAhPT0gdW5kZWZpbmVkICYmIGRldGFjaGVkSXRlbXMuaGFzKGtleSkpIHtcbiAgICBwcmV2Q29sbGVjdGlvbi5hdHRhY2goaW5kZXgsIGRldGFjaGVkSXRlbXMuZ2V0KGtleSkhKTtcbiAgICBkZXRhY2hlZEl0ZW1zLmRlbGV0ZShrZXkpO1xuICAgIHJldHVybiB0cnVlO1xuICB9XG4gIHJldHVybiBmYWxzZTtcbn1cblxuZnVuY3Rpb24gY3JlYXRlT3JBdHRhY2g8VCwgVj4oXG4gICAgbGl2ZUNvbGxlY3Rpb246IExpdmVDb2xsZWN0aW9uPFQsIFY+LFxuICAgIGRldGFjaGVkSXRlbXM6IFVuaXF1ZVZhbHVlTXVsdGlLZXlNYXA8dW5rbm93biwgVD58dW5kZWZpbmVkLFxuICAgIHRyYWNrQnlGbjogVHJhY2tCeUZ1bmN0aW9uPHVua25vd24+LCBpbmRleDogbnVtYmVyLCB2YWx1ZTogVikge1xuICBpZiAoIWF0dGFjaFByZXZpb3VzbHlEZXRhY2hlZChsaXZlQ29sbGVjdGlvbiwgZGV0YWNoZWRJdGVtcywgaW5kZXgsIHRyYWNrQnlGbihpbmRleCwgdmFsdWUpKSkge1xuICAgIGNvbnN0IG5ld0l0ZW0gPSBsaXZlQ29sbGVjdGlvbi5jcmVhdGUoaW5kZXgsIHZhbHVlKTtcbiAgICBsaXZlQ29sbGVjdGlvbi5hdHRhY2goaW5kZXgsIG5ld0l0ZW0pO1xuICB9IGVsc2Uge1xuICAgIGxpdmVDb2xsZWN0aW9uLnVwZGF0ZVZhbHVlKGluZGV4LCB2YWx1ZSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gaW5pdExpdmVJdGVtc0luVGhlRnV0dXJlPFQ+KFxuICAgIGxpdmVDb2xsZWN0aW9uOiBMaXZlQ29sbGVjdGlvbjx1bmtub3duLCB1bmtub3duPiwgc3RhcnQ6IG51bWJlciwgZW5kOiBudW1iZXIsXG4gICAgdHJhY2tCeUZuOiBUcmFja0J5RnVuY3Rpb248dW5rbm93bj4pOiBTZXQ8dW5rbm93bj4ge1xuICBjb25zdCBrZXlzID0gbmV3IFNldCgpO1xuICBmb3IgKGxldCBpID0gc3RhcnQ7IGkgPD0gZW5kOyBpKyspIHtcbiAgICBrZXlzLmFkZCh0cmFja0J5Rm4oaSwgbGl2ZUNvbGxlY3Rpb24uYXQoaSkpKTtcbiAgfVxuICByZXR1cm4ga2V5cztcbn1cblxuLyoqXG4gKiBBIHNwZWNpZmljLCBwYXJ0aWFsIGltcGxlbWVudGF0aW9uIG9mIHRoZSBNYXAgaW50ZXJmYWNlIHdpdGggdGhlIGZvbGxvd2luZyBjaGFyYWN0ZXJpc3RpY3M6XG4gKiAtIGFsbG93cyBtdWx0aXBsZSB2YWx1ZXMgZm9yIGEgZ2l2ZW4ga2V5O1xuICogLSBtYWludGFpbiBGSUZPIG9yZGVyIGZvciBtdWx0aXBsZSB2YWx1ZXMgY29ycmVzcG9uZGluZyB0byBhIGdpdmVuIGtleTtcbiAqIC0gYXNzdW1lcyB0aGF0IGFsbCB2YWx1ZXMgYXJlIHVuaXF1ZS5cbiAqXG4gKiBUaGUgaW1wbGVtZW50YXRpb24gYWltcyBhdCBoYXZpbmcgdGhlIG1pbmltYWwgb3ZlcmhlYWQgZm9yIGNhc2VzIHdoZXJlIGtleXMgYXJlIF9ub3RfIGR1cGxpY2F0ZWRcbiAqICh0aGUgbW9zdCBjb21tb24gY2FzZSBpbiB0aGUgbGlzdCByZWNvbmNpbGlhdGlvbiBhbGdvcml0aG0pLiBUbyBhY2hpZXZlIHRoaXMsIHRoZSBmaXJzdCB2YWx1ZSBmb3JcbiAqIGEgZ2l2ZW4ga2V5IGlzIHN0b3JlZCBpbiBhIHJlZ3VsYXIgbWFwLiBUaGVuLCB3aGVuIG1vcmUgdmFsdWVzIGFyZSBzZXQgZm9yIGEgZ2l2ZW4ga2V5LCB3ZVxuICogbWFpbnRhaW4gYSBmb3JtIG9mIGxpbmtlZCBsaXN0IGluIGEgc2VwYXJhdGUgbWFwLiBUbyBtYWludGFpbiB0aGlzIGxpbmtlZCBsaXN0IHdlIGFzc3VtZSB0aGF0IGFsbFxuICogdmFsdWVzIChpbiB0aGUgZW50aXJlIGNvbGxlY3Rpb24pIGFyZSB1bmlxdWUuXG4gKi9cbmV4cG9ydCBjbGFzcyBVbmlxdWVWYWx1ZU11bHRpS2V5TWFwPEssIFY+IHtcbiAgLy8gQSBtYXAgZnJvbSBhIGtleSB0byB0aGUgZmlyc3QgdmFsdWUgY29ycmVzcG9uZGluZyB0byB0aGlzIGtleS5cbiAgcHJpdmF0ZSBrdk1hcCA9IG5ldyBNYXA8SywgVj4oKTtcbiAgLy8gQSBtYXAgdGhhdCBhY3RzIGFzIGEgbGlua2VkIGxpc3Qgb2YgdmFsdWVzIC0gZWFjaCB2YWx1ZSBtYXBzIHRvIHRoZSBuZXh0IHZhbHVlIGluIHRoaXMgXCJsaW5rZWRcbiAgLy8gbGlzdFwiICh0aGlzIG9ubHkgd29ya3MgaWYgdmFsdWVzIGFyZSB1bmlxdWUpLiBBbGxvY2F0ZWQgbGF6aWx5IHRvIGF2b2lkIG1lbW9yeSBjb25zdW1wdGlvbiB3aGVuXG4gIC8vIHRoZXJlIGFyZSBubyBkdXBsaWNhdGVkIHZhbHVlcy5cbiAgcHJpdmF0ZSBfdk1hcDogTWFwPFYsIFY+fHVuZGVmaW5lZCA9IHVuZGVmaW5lZDtcblxuICBoYXMoa2V5OiBLKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMua3ZNYXAuaGFzKGtleSk7XG4gIH1cblxuICBkZWxldGUoa2V5OiBLKTogYm9vbGVhbiB7XG4gICAgaWYgKCF0aGlzLmhhcyhrZXkpKSByZXR1cm4gZmFsc2U7XG5cbiAgICBjb25zdCB2YWx1ZSA9IHRoaXMua3ZNYXAuZ2V0KGtleSkhO1xuICAgIGlmICh0aGlzLl92TWFwICE9PSB1bmRlZmluZWQgJiYgdGhpcy5fdk1hcC5oYXModmFsdWUpKSB7XG4gICAgICB0aGlzLmt2TWFwLnNldChrZXksIHRoaXMuX3ZNYXAuZ2V0KHZhbHVlKSEpO1xuICAgICAgdGhpcy5fdk1hcC5kZWxldGUodmFsdWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmt2TWFwLmRlbGV0ZShrZXkpO1xuICAgIH1cblxuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgZ2V0KGtleTogSyk6IFZ8dW5kZWZpbmVkIHtcbiAgICByZXR1cm4gdGhpcy5rdk1hcC5nZXQoa2V5KTtcbiAgfVxuXG4gIHNldChrZXk6IEssIHZhbHVlOiBWKTogdm9pZCB7XG4gICAgaWYgKHRoaXMua3ZNYXAuaGFzKGtleSkpIHtcbiAgICAgIGxldCBwcmV2VmFsdWUgPSB0aGlzLmt2TWFwLmdldChrZXkpITtcbiAgICAgIG5nRGV2TW9kZSAmJlxuICAgICAgICAgIGFzc2VydE5vdFNhbWUoXG4gICAgICAgICAgICAgIHByZXZWYWx1ZSwgdmFsdWUsIGBEZXRlY3RlZCBhIGR1cGxpY2F0ZWQgdmFsdWUgJHt2YWx1ZX0gZm9yIHRoZSBrZXkgJHtrZXl9YCk7XG5cbiAgICAgIGlmICh0aGlzLl92TWFwID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgdGhpcy5fdk1hcCA9IG5ldyBNYXAoKTtcbiAgICAgIH1cblxuICAgICAgY29uc3Qgdk1hcCA9IHRoaXMuX3ZNYXA7XG4gICAgICB3aGlsZSAodk1hcC5oYXMocHJldlZhbHVlKSkge1xuICAgICAgICBwcmV2VmFsdWUgPSB2TWFwLmdldChwcmV2VmFsdWUpITtcbiAgICAgIH1cbiAgICAgIHZNYXAuc2V0KHByZXZWYWx1ZSwgdmFsdWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmt2TWFwLnNldChrZXksIHZhbHVlKTtcbiAgICB9XG4gIH1cblxuICBmb3JFYWNoKGNiOiAodjogViwgazogSykgPT4gdm9pZCkge1xuICAgIGZvciAobGV0IFtrZXksIHZhbHVlXSBvZiB0aGlzLmt2TWFwKSB7XG4gICAgICBjYih2YWx1ZSwga2V5KTtcbiAgICAgIGlmICh0aGlzLl92TWFwICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgY29uc3Qgdk1hcCA9IHRoaXMuX3ZNYXA7XG4gICAgICAgIHdoaWxlICh2TWFwLmhhcyh2YWx1ZSkpIHtcbiAgICAgICAgICB2YWx1ZSA9IHZNYXAuZ2V0KHZhbHVlKSE7XG4gICAgICAgICAgY2IodmFsdWUsIGtleSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cbiJdfQ==