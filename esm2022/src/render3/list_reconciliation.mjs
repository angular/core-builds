/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */
import { formatRuntimeError } from '../errors';
import { stringifyForError } from './util/stringify_utils';
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
function recordDuplicateKeys(keyToIdx, key, idx) {
    const idxSoFar = keyToIdx.get(key);
    if (idxSoFar !== undefined) {
        idxSoFar.add(idx);
    }
    else {
        keyToIdx.set(key, new Set([idx]));
    }
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
    const duplicateKeys = ngDevMode ? new Map() : undefined;
    if (Array.isArray(newCollection)) {
        let newEndIdx = newCollection.length - 1;
        while (liveStartIdx <= liveEndIdx && liveStartIdx <= newEndIdx) {
            // compare from the beginning
            const liveStartValue = liveCollection.at(liveStartIdx);
            const newStartValue = newCollection[liveStartIdx];
            if (ngDevMode) {
                recordDuplicateKeys(duplicateKeys, trackByFn(liveStartIdx, newStartValue), liveStartIdx);
            }
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
            if (ngDevMode) {
                recordDuplicateKeys(duplicateKeys, trackByFn(newEndIdx, newEndValue), newEndIdx);
            }
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
            liveKeysInTheFuture ??= initLiveItemsInTheFuture(liveCollection, liveStartIdx, liveEndIdx, trackByFn);
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
            if (ngDevMode) {
                recordDuplicateKeys(duplicateKeys, trackByFn(liveStartIdx, newValue), liveStartIdx);
            }
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
                liveKeysInTheFuture ??= initLiveItemsInTheFuture(liveCollection, liveStartIdx, liveEndIdx, trackByFn);
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
    detachedItems?.forEach((item) => {
        liveCollection.destroy(item);
    });
    // report duplicate keys (dev mode only)
    if (ngDevMode) {
        let duplicatedKeysMsg = [];
        for (const [key, idxSet] of duplicateKeys) {
            if (idxSet.size > 1) {
                const idx = [...idxSet].sort((a, b) => a - b);
                for (let i = 1; i < idx.length; i++) {
                    duplicatedKeysMsg.push(`key "${stringifyForError(key)}" at index "${idx[i - 1]}" and "${idx[i]}"`);
                }
            }
        }
        if (duplicatedKeysMsg.length > 0) {
            const message = formatRuntimeError(-955 /* RuntimeErrorCode.LOOP_TRACK_DUPLICATE_KEYS */, 'The provided track expression resulted in duplicated keys for a given collection. ' +
                'Adjust the tracking expression such that it uniquely identifies all the items in the collection. ' +
                'Duplicated keys were: \n' +
                duplicatedKeysMsg.join(', \n') +
                '.');
            // tslint:disable-next-line:no-console
            console.warn(message);
        }
    }
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
            // Note: we don't use `assertNotSame`, because the value needs to be stringified even if
            // there is no error which can freeze the browser for large values (see #58509).
            if (ngDevMode && prevValue === value) {
                throw new Error(`Detected a duplicated value ${value} for the key ${key}`);
            }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGlzdF9yZWNvbmNpbGlhdGlvbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvbGlzdF9yZWNvbmNpbGlhdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFHSCxPQUFPLEVBQUMsa0JBQWtCLEVBQW1CLE1BQU0sV0FBVyxDQUFDO0FBRS9ELE9BQU8sRUFBQyxpQkFBaUIsRUFBQyxNQUFNLHdCQUF3QixDQUFDO0FBRXpEOzs7O0dBSUc7QUFDSCxNQUFNLE9BQWdCLGNBQWM7SUFNbEMsT0FBTyxDQUFDLElBQU87UUFDYixrQkFBa0I7SUFDcEIsQ0FBQztJQUNELFdBQVcsQ0FBQyxLQUFhLEVBQUUsS0FBUTtRQUNqQyxrQkFBa0I7SUFDcEIsQ0FBQztJQUVELDRGQUE0RjtJQUM1RixtRkFBbUY7SUFDbkYsa0JBQWtCO0lBQ2xCLElBQUksQ0FBQyxNQUFjLEVBQUUsTUFBYztRQUNqQyxNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsQ0FBQztRQUMxQyxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsQ0FBQztRQUN4QyxNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ3BDLElBQUksTUFBTSxHQUFHLFFBQVEsR0FBRyxDQUFDLEVBQUUsQ0FBQztZQUMxQixNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ3hDLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLE9BQU8sQ0FBQyxDQUFDO1lBQy9CLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFLFNBQVMsQ0FBQyxDQUFDO1FBQ2pDLENBQUM7YUFBTSxDQUFDO1lBQ04sSUFBSSxDQUFD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Q0FBQztZQUNILENBQUM7UUFDSCxDQUFDO0lBQ0gsQ0FBQztDQUNGIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuZGV2L2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1RyYWNrQnlGdW5jdGlvbn0gZnJvbSAnLi4vY2hhbmdlX2RldGVjdGlvbic7XG5pbXBvcnQge2Zvcm1hdFJ1bnRpbWVFcnJvciwgUnVudGltZUVycm9yQ29kZX0gZnJvbSAnLi4vZXJyb3JzJztcblxuaW1wb3J0IHtzdHJpbmdpZnlGb3JFcnJvcn0gZnJvbSAnLi91dGlsL3N0cmluZ2lmeV91dGlscyc7XG5cbi8qKlxuICogQSB0eXBlIHJlcHJlc2VudGluZyB0aGUgbGl2ZSBjb2xsZWN0aW9uIHRvIGJlIHJlY29uY2lsZWQgd2l0aCBhbnkgbmV3IChpbmNvbWluZykgY29sbGVjdGlvbi4gVGhpc1xuICogaXMgYW4gYWRhcHRlciBjbGFzcyB0aGF0IG1ha2VzIGl0IHBvc3NpYmxlIHRvIHdvcmsgd2l0aCBkaWZmZXJlbnQgaW50ZXJuYWwgZGF0YSBzdHJ1Y3R1cmVzLFxuICogcmVnYXJkbGVzcyBvZiB0aGUgYWN0dWFsIHZhbHVlcyBvZiB0aGUgaW5jb21pbmcgY29sbGVjdGlvbi5cbiAqL1xuZXhwb3J0IGFic3RyYWN0IGNsYXNzIExpdmVDb2xsZWN0aW9uPFQsIFY+IHtcbiAgYWJzdHJhY3QgZ2V0IGxlbmd0aCgpOiBudW1iZXI7XG4gIGFic3RyYWN0IGF0KGluZGV4OiBudW1iZXIpOiBWO1xuICBhYnN0cmFjdCBhdHRhY2goaW5kZXg6IG51bWJlciwgaXRlbTogVCk6IHZvaWQ7XG4gIGFic3RyYWN0IGRldGFjaChpbmRleDogbnVtYmVyKTogVDtcbiAgYWJzdHJhY3QgY3JlYXRlKGluZGV4OiBudW1iZXIsIHZhbHVlOiBWKTogVDtcbiAgZGVzdHJveShpdGVtOiBUKTogdm9pZCB7XG4gICAgLy8gbm9vcCBieSBkZWZhdWx0XG4gIH1cbiAgdXBkYXRlVmFsdWUoaW5kZXg6IG51bWJlciwgdmFsdWU6IFYpOiB2b2lkIHtcbiAgICAvLyBub29wIGJ5IGRlZmF1bHRcbiAgfVxuXG4gIC8vIG9wZXJhdGlvbnMgYmVsb3cgY291bGQgYmUgaW1wbGVtZW50ZWQgb24gdG9wIG9mIHRoZSBvcGVyYXRpb25zIGRlZmluZWQgc28gZmFyLCBidXQgaGF2aW5nXG4gIC8vIHRoZW0gZXhwbGljaXRseSBhbGxvdyBjbGVhciBleHByZXNzaW9uIG9mIGludGVudCBhbmQgcG90ZW50aWFsbHkgbW9yZSBwZXJmb3JtYW50XG4gIC8vIGltcGxlbWVudGF0aW9uc1xuICBzd2FwKGluZGV4MTogbnVtYmVyLCBpbmRleDI6IG51bWJlcik6IHZvaWQge1xuICAgIGNvbnN0IHN0YXJ0SWR4ID0gTWF0aC5taW4oaW5kZXgxLCBpbmRleDIpO1xuICAgIGNvbnN0IGVuZElkeCA9IE1hdGgubWF4KGluZGV4MSwgaW5kZXgyKTtcbiAgICBjb25zdCBlbmRJdGVtID0gdGhpcy5kZXRhY2goZW5kSWR4KTtcbiAgICBpZiAoZW5kSWR4IC0gc3RhcnRJZHggPiAxKSB7XG4gICAgICBjb25zdCBzdGFydEl0ZW0gPSB0aGlzLmRldGFjaChzdGFydElkeCk7XG4gICAgICB0aGlzLmF0dGFjaChzdGFydElkeCwgZW5kSXRlbSk7XG4gICAgICB0aGlzLmF0dGFjaChlbmRJZHgsIHN0YXJ0SXRlbSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuYXR0YWNoKHN0YXJ0SWR4LCBlbmRJdGVtKTtcbiAgICB9XG4gIH1cbiAgbW92ZShwcmV2SW5kZXg6IG51bWJlciwgbmV3SWR4OiBudW1iZXIpOiB2b2lkIHtcbiAgICB0aGlzLmF0dGFjaChuZXdJZHgsIHRoaXMuZGV0YWNoKHByZXZJbmRleCkpO1xuICB9XG59XG5cbmZ1bmN0aW9uIHZhbHVlc01hdGNoaW5nPFY+KFxuICBsaXZlSWR4OiBudW1iZXIsXG4gIGxpdmVWYWx1ZTogVixcbiAgbmV3SWR4OiBudW1iZXIsXG4gIG5ld1ZhbHVlOiBWLFxuICB0cmFja0J5OiBUcmFja0J5RnVuY3Rpb248Vj4sXG4pOiBudW1iZXIge1xuICBpZiAobGl2ZUlkeCA9PT0gbmV3SWR4ICYmIE9iamVjdC5pcyhsaXZlVmFsdWUsIG5ld1ZhbHVlKSkge1xuICAgIC8vIG1hdGNoaW5nIGFuZCBubyB2YWx1ZSBpZGVudGl0eSB0byB1cGRhdGVcbiAgICByZXR1cm4gMTtcbiAgfSBlbHNlIGlmIChPYmplY3QuaXModHJhY2tCeShsaXZlSWR4LCBsaXZlVmFsdWUpLCB0cmFja0J5KG5ld0lkeCwgbmV3VmFsdWUpKSkge1xuICAgIC8vIG1hdGNoaW5nIGJ1dCByZXF1aXJlcyB2YWx1ZSBpZGVudGl0eSB1cGRhdGVcbiAgICByZXR1cm4gLTE7XG4gIH1cblxuICByZXR1cm4gMDtcbn1cblxuZnVuY3Rpb24gcmVjb3JkRHVwbGljYXRlS2V5cyhrZXlUb0lkeDogTWFwPHVua25vd24sIFNldDxudW1iZXI+Piwga2V5OiB1bmtub3duLCBpZHg6IG51bWJlcik6IHZvaWQge1xuICBjb25zdCBpZHhTb0ZhciA9IGtleVRvSWR4LmdldChrZXkpO1xuXG4gIGlmIChpZHhTb0ZhciAhPT0gdW5kZWZpbmVkKSB7XG4gICAgaWR4U29GYXIuYWRkKGlkeCk7XG4gIH0gZWxzZSB7XG4gICAga2V5VG9JZHguc2V0KGtleSwgbmV3IFNldChbaWR4XSkpO1xuICB9XG59XG5cbi8qKlxuICogVGhlIGxpdmUgY29sbGVjdGlvbiByZWNvbmNpbGlhdGlvbiBhbGdvcml0aG0gdGhhdCBwZXJmb3JtIHZhcmlvdXMgaW4tcGxhY2Ugb3BlcmF0aW9ucywgc28gaXRcbiAqIHJlZmxlY3RzIHRoZSBjb250ZW50IG9mIHRoZSBuZXcgKGluY29taW5nKSBjb2xsZWN0aW9uLlxuICpcbiAqIFRoZSByZWNvbmNpbGlhdGlvbiBhbGdvcml0aG0gaGFzIDIgY29kZSBwYXRoczpcbiAqIC0gXCJmYXN0XCIgcGF0aCB0aGF0IGRvbid0IHJlcXVpcmUgYW55IG1lbW9yeSBhbGxvY2F0aW9uO1xuICogLSBcInNsb3dcIiBwYXRoIHRoYXQgcmVxdWlyZXMgYWRkaXRpb25hbCBtZW1vcnkgYWxsb2NhdGlvbiBmb3IgaW50ZXJtZWRpYXRlIGRhdGEgc3RydWN0dXJlcyB1c2VkIHRvXG4gKiBjb2xsZWN0IGFkZGl0aW9uYWwgaW5mb3JtYXRpb24gYWJvdXQgdGhlIGxpdmUgY29sbGVjdGlvbi5cbiAqIEl0IG1pZ2h0IGhhcHBlbiB0aGF0IHRoZSBhbGdvcml0aG0gc3dpdGNoZXMgYmV0d2VlbiB0aGUgdHdvIG1vZGVzIGluIHF1ZXN0aW9uIGluIGEgc2luZ2xlXG4gKiByZWNvbmNpbGlhdGlvbiBwYXRoIC0gZ2VuZXJhbGx5IGl0IHRyaWVzIHRvIHN0YXkgb24gdGhlIFwiZmFzdFwiIHBhdGggYXMgbXVjaCBhcyBwb3NzaWJsZS5cbiAqXG4gKiBUaGUgb3ZlcmFsbCBjb21wbGV4aXR5IG9mIHRoZSBhbGdvcml0aG0gaXMgTyhuICsgbSkgZm9yIHNwZWVkIGFuZCBPKG4pIGZvciBtZW1vcnkgKHdoZXJlIG4gaXMgdGhlXG4gKiBsZW5ndGggb2YgdGhlIGxpdmUgY29sbGVjdGlvbiBhbmQgbSBpcyB0aGUgbGVuZ3RoIG9mIHRoZSBpbmNvbWluZyBjb2xsZWN0aW9uKS4gR2l2ZW4gdGhlIHByb2JsZW1cbiAqIGF0IGhhbmQgdGhlIGNvbXBsZXhpdHkgLyBwZXJmb3JtYW5jZSBjb25zdHJhaW50cyBtYWtlcyBpdCBpbXBvc3NpYmxlIHRvIHBlcmZvcm0gdGhlIGFic29sdXRlXG4gKiBtaW5pbXVtIG9mIG9wZXJhdGlvbiB0byByZWNvbmNpbGUgdGhlIDIgY29sbGVjdGlvbnMuIFRoZSBhbGdvcml0aG0gbWFrZXMgZGlmZmVyZW50IHRyYWRlb2ZmcyB0b1xuICogc3RheSB3aXRoaW4gcmVhc29uYWJsZSBwZXJmb3JtYW5jZSBib3VuZHMgYW5kIG1heSBhcHBseSBzdWItb3B0aW1hbCBudW1iZXIgb2Ygb3BlcmF0aW9ucyBpblxuICogY2VydGFpbiBzaXR1YXRpb25zLlxuICpcbiAqIEBwYXJhbSBsaXZlQ29sbGVjdGlvbiB0aGUgY3VycmVudCwgbGl2ZSBjb2xsZWN0aW9uO1xuICogQHBhcmFtIG5ld0NvbGxlY3Rpb24gdGhlIG5ldywgaW5jb21pbmcgY29sbGVjdGlvbjtcbiAqIEBwYXJhbSB0cmFja0J5Rm4ga2V5IGdlbmVyYXRpb24gZnVuY3Rpb24gdGhhdCBkZXRlcm1pbmVzIGVxdWFsaXR5IGJldHdlZW4gaXRlbXMgaW4gdGhlIGxpZmUgYW5kXG4gKiAgICAgaW5jb21pbmcgY29sbGVjdGlvbjtcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlY29uY2lsZTxULCBWPihcbiAgbGl2ZUNvbGxlY3Rpb246IExpdmVDb2xsZWN0aW9uPFQsIFY+LFxuICBuZXdDb2xsZWN0aW9uOiBJdGVyYWJsZTxWPiB8IHVuZGVmaW5lZCB8IG51bGwsXG4gIHRyYWNrQnlGbjogVHJhY2tCeUZ1bmN0aW9uPFY+LFxuKTogdm9pZCB7XG4gIGxldCBkZXRhY2hlZEl0ZW1zOiBVbmlxdWVWYWx1ZU11bHRpS2V5TWFwPHVua25vd24sIFQ+IHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkO1xuICBsZXQgbGl2ZUtleXNJblRoZUZ1dHVyZTogU2V0PHVua25vd24+IHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkO1xuXG4gIGxldCBsaXZlU3RhcnRJZHggPSAwO1xuICBsZXQgbGl2ZUVuZElkeCA9IGxpdmVDb2xsZWN0aW9uLmxlbmd0aCAtIDE7XG5cbiAgY29uc3QgZHVwbGljYXRlS2V5cyA9IG5nRGV2TW9kZSA/IG5ldyBNYXA8dW5rbm93biwgU2V0PG51bWJlcj4+KCkgOiB1bmRlZmluZWQ7XG5cbiAgaWYgKEFycmF5LmlzQXJyYXkobmV3Q29sbGVjdGlvbikpIHtcbiAgICBsZXQgbmV3RW5kSWR4ID0gbmV3Q29sbGVjdGlvbi5sZW5ndGggLSAxO1xuXG4gICAgd2hpbGUgKGxpdmVTdGFydElkeCA8PSBsaXZlRW5kSWR4ICYmIGxpdmVTdGFydElkeCA8PSBuZXdFbmRJZHgpIHtcbiAgICAgIC8vIGNvbXBhcmUgZnJvbSB0aGUgYmVnaW5uaW5nXG4gICAgICBjb25zdCBsaXZlU3RhcnRWYWx1ZSA9IGxpdmVDb2xsZWN0aW9uLmF0KGxpdmVTdGFydElkeCk7XG4gICAgICBjb25zdCBuZXdTdGFydFZhbHVlID0gbmV3Q29sbGVjdGlvbltsaXZlU3RhcnRJZHhdO1xuXG4gICAgICBpZiAobmdEZXZNb2RlKSB7XG4gICAgICAgIHJlY29yZER1cGxpY2F0ZUtleXMoZHVwbGljYXRlS2V5cyEsIHRyYWNrQnlGbihsaXZlU3RhcnRJZHgsIG5ld1N0YXJ0VmFsdWUpLCBsaXZlU3RhcnRJZHgpO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBpc1N0YXJ0TWF0Y2hpbmcgPSB2YWx1ZXNNYXRjaGluZyhcbiAgICAgICAgbGl2ZVN0YXJ0SWR4LFxuICAgICAgICBsaXZlU3RhcnRWYWx1ZSxcbiAgICAgICAgbGl2ZVN0YXJ0SWR4LFxuICAgICAgICBuZXdTdGFydFZhbHVlLFxuICAgICAgICB0cmFja0J5Rm4sXG4gICAgICApO1xuICAgICAgaWYgKGlzU3RhcnRNYXRjaGluZyAhPT0gMCkge1xuICAgICAgICBpZiAoaXNTdGFydE1hdGNoaW5nIDwgMCkge1xuICAgICAgICAgIGxpdmVDb2xsZWN0aW9uLnVwZGF0ZVZhbHVlKGxpdmVTdGFydElkeCwgbmV3U3RhcnRWYWx1ZSk7XG4gICAgICAgIH1cbiAgICAgICAgbGl2ZVN0YXJ0SWR4Kys7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICAvLyBjb21wYXJlIGZyb20gdGhlIGVuZFxuICAgICAgLy8gVE9ETyhwZXJmKTogZG8gX2FsbF8gdGhlIG1hdGNoaW5nIGZyb20gdGhlIGVuZFxuICAgICAgY29uc3QgbGl2ZUVuZFZhbHVlID0gbGl2ZUNvbGxlY3Rpb24uYXQobGl2ZUVuZElkeCk7XG4gICAgICBjb25zdCBuZXdFbmRWYWx1ZSA9IG5ld0NvbGxlY3Rpb25bbmV3RW5kSWR4XTtcblxuICAgICAgaWYgKG5nRGV2TW9kZSkge1xuICAgICAgICByZWNvcmREdXBsaWNhdGVLZXlzKGR1cGxpY2F0ZUtleXMhLCB0cmFja0J5Rm4obmV3RW5kSWR4LCBuZXdFbmRWYWx1ZSksIG5ld0VuZElkeCk7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGlzRW5kTWF0Y2hpbmcgPSB2YWx1ZXNNYXRjaGluZyhcbiAgICAgICAgbGl2ZUVuZElkeCxcbiAgICAgICAgbGl2ZUVuZFZhbHVlLFxuICAgICAgICBuZXdFbmRJZHgsXG4gICAgICAgIG5ld0VuZFZhbHVlLFxuICAgICAgICB0cmFja0J5Rm4sXG4gICAgICApO1xuICAgICAgaWYgKGlzRW5kTWF0Y2hpbmcgIT09IDApIHtcbiAgICAgICAgaWYgKGlzRW5kTWF0Y2hpbmcgPCAwKSB7XG4gICAgICAgICAgbGl2ZUNvbGxlY3Rpb24udXBkYXRlVmFsdWUobGl2ZUVuZElkeCwgbmV3RW5kVmFsdWUpO1xuICAgICAgICB9XG4gICAgICAgIGxpdmVFbmRJZHgtLTtcbiAgICAgICAgbmV3RW5kSWR4LS07XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICAvLyBEZXRlY3Qgc3dhcCBhbmQgbW92ZXM6XG4gICAgICBjb25zdCBsaXZlU3RhcnRLZXkgPSB0cmFja0J5Rm4obGl2ZVN0YXJ0SWR4LCBsaXZlU3RhcnRWYWx1ZSk7XG4gICAgICBjb25zdCBsaXZlRW5kS2V5ID0gdHJhY2tCeUZuKGxpdmVFbmRJZHgsIGxpdmVFbmRWYWx1ZSk7XG4gICAgICBjb25zdCBuZXdTdGFydEtleSA9IHRyYWNrQnlGbihsaXZlU3RhcnRJZHgsIG5ld1N0YXJ0VmFsdWUpO1xuICAgICAgaWYgKE9iamVjdC5pcyhuZXdTdGFydEtleSwgbGl2ZUVuZEtleSkpIHtcbiAgICAgICAgY29uc3QgbmV3RW5kS2V5ID0gdHJhY2tCeUZuKG5ld0VuZElkeCwgbmV3RW5kVmFsdWUpO1xuICAgICAgICAvLyBkZXRlY3Qgc3dhcCBvbiBib3RoIGVuZHM7XG4gICAgICAgIGlmIChPYmplY3QuaXMobmV3RW5kS2V5LCBsaXZlU3RhcnRLZXkpKSB7XG4gICAgICAgICAgbGl2ZUNvbGxlY3Rpb24uc3dhcChsaXZlU3RhcnRJZHgsIGxpdmVFbmRJZHgpO1xuICAgICAgICAgIGxpdmVDb2xsZWN0aW9uLnVwZGF0ZVZhbHVlKGxpdmVFbmRJZHgsIG5ld0VuZFZhbHVlKTtcbiAgICAgICAgICBuZXdFbmRJZHgtLTtcbiAgICAgICAgICBsaXZlRW5kSWR4LS07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gdGhlIG5ldyBpdGVtIGlzIHRoZSBzYW1lIGFzIHRoZSBsaXZlIGl0ZW0gd2l0aCB0aGUgZW5kIHBvaW50ZXIgLSB0aGlzIGlzIGEgbW92ZSBmb3J3YXJkXG4gICAgICAgICAgLy8gdG8gYW4gZWFybGllciBpbmRleDtcbiAgICAgICAgICBsaXZlQ29sbGVjdGlvbi5tb3ZlKGxpdmVFbmRJZHgsIGxpdmVTdGFydElkeCk7XG4gICAgICAgIH1cbiAgICAgICAgbGl2ZUNvbGxlY3Rpb24udXBkYXRlVmFsdWUobGl2ZVN0YXJ0SWR4LCBuZXdTdGFydFZhbHVlKTtcbiAgICAgICAgbGl2ZVN0YXJ0SWR4Kys7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICAvLyBGYWxsYmFjayB0byB0aGUgc2xvdyBwYXRoOiB3ZSBuZWVkIHRvIGxlYXJuIG1vcmUgYWJvdXQgdGhlIGNvbnRlbnQgb2YgdGhlIGxpdmUgYW5kIG5ld1xuICAgICAgLy8gY29sbGVjdGlvbnMuXG4gICAgICBkZXRhY2hlZEl0ZW1zID8/PSBuZXcgVW5pcXVlVmFsdWVNdWx0aUtleU1hcCgpO1xuICAgICAgbGl2ZUtleXNJblRoZUZ1dHVyZSA/Pz0gaW5pdExpdmVJdGVtc0luVGhlRnV0dXJlKFxuICAgICAgICBsaXZlQ29sbGVjdGlvbixcbiAgICAgICAgbGl2ZVN0YXJ0SWR4LFxuICAgICAgICBsaXZlRW5kSWR4LFxuICAgICAgICB0cmFja0J5Rm4sXG4gICAgICApO1xuXG4gICAgICAvLyBDaGVjayBpZiBJJ20gaW5zZXJ0aW5nIGEgcHJldmlvdXNseSBkZXRhY2hlZCBpdGVtOiBpZiBzbywgYXR0YWNoIGl0IGhlcmVcbiAgICAgIGlmIChhdHRhY2hQcmV2aW91c2x5RGV0YWNoZWQobGl2ZUNvbGxlY3Rpb24sIGRldGFjaGVkSXRlbXMsIGxpdmVTdGFydElkeCwgbmV3U3RhcnRLZXkpKSB7XG4gICAgICAgIGxpdmVDb2xsZWN0aW9uLnVwZGF0ZVZhbHVlKGxpdmVTdGFydElkeCwgbmV3U3RhcnRWYWx1ZSk7XG4gICAgICAgIGxpdmVTdGFydElkeCsrO1xuICAgICAgICBsaXZlRW5kSWR4Kys7XG4gICAgICB9IGVsc2UgaWYgKCFsaXZlS2V5c0luVGhlRnV0dXJlLmhhcyhuZXdTdGFydEtleSkpIHtcbiAgICAgICAgLy8gQ2hlY2sgaWYgd2Ugc2VlbiBhIG5ldyBpdGVtIHRoYXQgZG9lc24ndCBleGlzdCBpbiB0aGUgb2xkIGNvbGxlY3Rpb24gYW5kIG11c3QgYmUgSU5TRVJURURcbiAgICAgICAgY29uc3QgbmV3SXRlbSA9IGxpdmVDb2xsZWN0aW9uLmNyZWF0ZShsaXZlU3RhcnRJZHgsIG5ld0NvbGxlY3Rpb25bbGl2ZVN0YXJ0SWR4XSk7XG4gICAgICAgIGxpdmVDb2xsZWN0aW9uLmF0dGFjaChsaXZlU3RhcnRJZHgsIG5ld0l0ZW0pO1xuICAgICAgICBsaXZlU3RhcnRJZHgrKztcbiAgICAgICAgbGl2ZUVuZElkeCsrO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gV2Uga25vdyB0aGF0IHRoZSBuZXcgaXRlbSBleGlzdHMgbGF0ZXIgb24gaW4gb2xkIGNvbGxlY3Rpb24gYnV0IHdlIGRvbid0IGtub3cgaXRzIGluZGV4XG4gICAgICAgIC8vIGFuZCBhcyB0aGUgY29uc2VxdWVuY2UgY2FuJ3QgbW92ZSBpdCAoZG9uJ3Qga25vdyB3aGVyZSB0byBmaW5kIGl0KS4gRGV0YWNoIHRoZSBvbGQgaXRlbSxcbiAgICAgICAgLy8gaG9waW5nIHRoYXQgaXQgdW5sb2NrcyB0aGUgZmFzdCBwYXRoIGFnYWluLlxuICAgICAgICBkZXRhY2hlZEl0ZW1zLnNldChsaXZlU3RhcnRLZXksIGxpdmVDb2xsZWN0aW9uLmRldGFjaChsaXZlU3RhcnRJZHgpKTtcbiAgICAgICAgbGl2ZUVuZElkeC0tO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIEZpbmFsIGNsZWFudXAgc3RlcHM6XG4gICAgLy8gLSBtb3JlIGl0ZW1zIGluIHRoZSBuZXcgY29sbGVjdGlvbiA9PiBpbnNlcnRcbiAgICB3aGlsZSAobGl2ZVN0YXJ0SWR4IDw9IG5ld0VuZElkeCkge1xuICAgICAgY3JlYXRlT3JBdHRhY2goXG4gICAgICAgIGxpdmVDb2xsZWN0aW9uLFxuICAgICAgICBkZXRhY2hlZEl0ZW1zLFxuICAgICAgICB0cmFja0J5Rm4sXG4gICAgICAgIGxpdmVTdGFydElkeCxcbiAgICAgICAgbmV3Q29sbGVjdGlvbltsaXZlU3RhcnRJZHhdLFxuICAgICAgKTtcbiAgICAgIGxpdmVTdGFydElkeCsrO1xuICAgIH1cbiAgfSBlbHNlIGlmIChuZXdDb2xsZWN0aW9uICE9IG51bGwpIHtcbiAgICAvLyBpdGVyYWJsZSAtIGltbWVkaWF0ZWx5IGZhbGxiYWNrIHRvIHRoZSBzbG93IHBhdGhcbiAgICBjb25zdCBuZXdDb2xsZWN0aW9uSXRlcmF0b3IgPSBuZXdDb2xsZWN0aW9uW1N5bWJvbC5pdGVyYXRvcl0oKTtcbiAgICBsZXQgbmV3SXRlcmF0aW9uUmVzdWx0ID0gbmV3Q29sbGVjdGlvbkl0ZXJhdG9yLm5leHQoKTtcbiAgICB3aGlsZSAoIW5ld0l0ZXJhdGlvblJlc3VsdC5kb25lICYmIGxpdmVTdGFydElkeCA8PSBsaXZlRW5kSWR4KSB7XG4gICAgICBjb25zdCBsaXZlVmFsdWUgPSBsaXZlQ29sbGVjdGlvbi5hdChsaXZlU3RhcnRJZHgpO1xuICAgICAgY29uc3QgbmV3VmFsdWUgPSBuZXdJdGVyYXRpb25SZXN1bHQudmFsdWU7XG5cbiAgICAgIGlmIChuZ0Rldk1vZGUpIHtcbiAgICAgICAgcmVjb3JkRHVwbGljYXRlS2V5cyhkdXBsaWNhdGVLZXlzISwgdHJhY2tCeUZuKGxpdmVTdGFydElkeCwgbmV3VmFsdWUpLCBsaXZlU3RhcnRJZHgpO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBpc1N0YXJ0TWF0Y2hpbmcgPSB2YWx1ZXNNYXRjaGluZyhcbiAgICAgICAgbGl2ZVN0YXJ0SWR4LFxuICAgICAgICBsaXZlVmFsdWUsXG4gICAgICAgIGxpdmVTdGFydElkeCxcbiAgICAgICAgbmV3VmFsdWUsXG4gICAgICAgIHRyYWNrQnlGbixcbiAgICAgICk7XG4gICAgICBpZiAoaXNTdGFydE1hdGNoaW5nICE9PSAwKSB7XG4gICAgICAgIC8vIGZvdW5kIGEgbWF0Y2ggLSBtb3ZlIG9uLCBidXQgdXBkYXRlIHZhbHVlXG4gICAgICAgIGlmIChpc1N0YXJ0TWF0Y2hpbmcgPCAwKSB7XG4gICAgICAgICAgbGl2ZUNvbGxlY3Rpb24udXBkYXRlVmFsdWUobGl2ZVN0YXJ0SWR4LCBuZXdWYWx1ZSk7XG4gICAgICAgIH1cbiAgICAgICAgbGl2ZVN0YXJ0SWR4Kys7XG4gICAgICAgIG5ld0l0ZXJhdGlvblJlc3VsdCA9IG5ld0NvbGxlY3Rpb25JdGVyYXRvci5uZXh0KCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBkZXRhY2hlZEl0ZW1zID8/PSBuZXcgVW5pcXVlVmFsdWVNdWx0aUtleU1hcCgpO1xuICAgICAgICBsaXZlS2V5c0luVGhlRnV0dXJlID8/PSBpbml0TGl2ZUl0ZW1zSW5UaGVGdXR1cmUoXG4gICAgICAgICAgbGl2ZUNvbGxlY3Rpb24sXG4gICAgICAgICAgbGl2ZVN0YXJ0SWR4LFxuICAgICAgICAgIGxpdmVFbmRJZHgsXG4gICAgICAgICAgdHJhY2tCeUZuLFxuICAgICAgICApO1xuXG4gICAgICAgIC8vIENoZWNrIGlmIEknbSBpbnNlcnRpbmcgYSBwcmV2aW91c2x5IGRldGFjaGVkIGl0ZW06IGlmIHNvLCBhdHRhY2ggaXQgaGVyZVxuICAgICAgICBjb25zdCBuZXdLZXkgPSB0cmFja0J5Rm4obGl2ZVN0YXJ0SWR4LCBuZXdWYWx1ZSk7XG4gICAgICAgIGlmIChhdHRhY2hQcmV2aW91c2x5RGV0YWNoZWQobGl2ZUNvbGxlY3Rpb24sIGRldGFjaGVkSXRlbXMsIGxpdmVTdGFydElkeCwgbmV3S2V5KSkge1xuICAgICAgICAgIGxpdmVDb2xsZWN0aW9uLnVwZGF0ZVZhbHVlKGxpdmVTdGFydElkeCwgbmV3VmFsdWUpO1xuICAgICAgICAgIGxpdmVTdGFydElkeCsrO1xuICAgICAgICAgIGxpdmVFbmRJZHgrKztcbiAgICAgICAgICBuZXdJdGVyYXRpb25SZXN1bHQgPSBuZXdDb2xsZWN0aW9uSXRlcmF0b3IubmV4dCgpO1xuICAgICAgICB9IGVsc2UgaWYgKCFsaXZlS2V5c0luVGhlRnV0dXJlLmhhcyhuZXdLZXkpKSB7XG4gICAgICAgICAgbGl2ZUNvbGxlY3Rpb24uYXR0YWNoKGxpdmVTdGFydElkeCwgbGl2ZUNvbGxlY3Rpb24uY3JlYXRlKGxpdmVTdGFydElkeCwgbmV3VmFsdWUpKTtcbiAgICAgICAgICBsaXZlU3RhcnRJZHgrKztcbiAgICAgICAgICBsaXZlRW5kSWR4Kys7XG4gICAgICAgICAgbmV3SXRlcmF0aW9uUmVzdWx0ID0gbmV3Q29sbGVjdGlvbkl0ZXJhdG9yLm5leHQoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBpdCBpcyBhIG1vdmUgZm9yd2FyZCAtIGRldGFjaCB0aGUgY3VycmVudCBpdGVtIHdpdGhvdXQgYWR2YW5jaW5nIGluIGNvbGxlY3Rpb25zXG4gICAgICAgICAgY29uc3QgbGl2ZUtleSA9IHRyYWNrQnlGbihsaXZlU3RhcnRJZHgsIGxpdmVWYWx1ZSk7XG4gICAgICAgICAgZGV0YWNoZWRJdGVtcy5zZXQobGl2ZUtleSwgbGl2ZUNvbGxlY3Rpb24uZGV0YWNoKGxpdmVTdGFydElkeCkpO1xuICAgICAgICAgIGxpdmVFbmRJZHgtLTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIC8vIHRoaXMgaXMgYSBuZXcgaXRlbSBhcyB3ZSBydW4gb3V0IG9mIHRoZSBpdGVtcyBpbiB0aGUgb2xkIGNvbGxlY3Rpb24gLSBjcmVhdGUgb3IgYXR0YWNoIGFcbiAgICAvLyBwcmV2aW91c2x5IGRldGFjaGVkIG9uZVxuICAgIHdoaWxlICghbmV3SXRlcmF0aW9uUmVzdWx0LmRvbmUpIHtcbiAgICAgIGNyZWF0ZU9yQXR0YWNoKFxuICAgICAgICBsaXZlQ29sbGVjdGlvbixcbiAgICAgICAgZGV0YWNoZWRJdGVtcyxcbiAgICAgICAgdHJhY2tCeUZuLFxuICAgICAgICBsaXZlQ29sbGVjdGlvbi5sZW5ndGgsXG4gICAgICAgIG5ld0l0ZXJhdGlvblJlc3VsdC52YWx1ZSxcbiAgICAgICk7XG4gICAgICBuZXdJdGVyYXRpb25SZXN1bHQgPSBuZXdDb2xsZWN0aW9uSXRlcmF0b3IubmV4dCgpO1xuICAgIH1cbiAgfVxuXG4gIC8vIENsZWFudXBzIGNvbW1vbiB0byB0aGUgYXJyYXkgYW5kIGl0ZXJhYmxlOlxuICAvLyAtIG1vcmUgaXRlbXMgaW4gdGhlIGxpdmUgY29sbGVjdGlvbiA9PiBkZWxldGUgc3RhcnRpbmcgZnJvbSB0aGUgZW5kO1xuICB3aGlsZSAobGl2ZVN0YXJ0SWR4IDw9IGxpdmVFbmRJZHgpIHtcbiAgICBsaXZlQ29sbGVjdGlvbi5kZXN0cm95KGxpdmVDb2xsZWN0aW9uLmRldGFjaChsaXZlRW5kSWR4LS0pKTtcbiAgfVxuXG4gIC8vIC0gZGVzdHJveSBpdGVtcyB0aGF0IHdlcmUgZGV0YWNoZWQgYnV0IG5ldmVyIGF0dGFjaGVkIGFnYWluLlxuICBkZXRhY2hlZEl0ZW1zPy5mb3JFYWNoKChpdGVtKSA9PiB7XG4gICAgbGl2ZUNvbGxlY3Rpb24uZGVzdHJveShpdGVtKTtcbiAgfSk7XG5cbiAgLy8gcmVwb3J0IGR1cGxpY2F0ZSBrZXlzIChkZXYgbW9kZSBvbmx5KVxuICBpZiAobmdEZXZNb2RlKSB7XG4gICAgbGV0IGR1cGxpY2F0ZWRLZXlzTXNnID0gW107XG4gICAgZm9yIChjb25zdCBba2V5LCBpZHhTZXRdIG9mIGR1cGxpY2F0ZUtleXMhKSB7XG4gICAgICBpZiAoaWR4U2V0LnNpemUgPiAxKSB7XG4gICAgICAgIGNvbnN0IGlkeCA9IFsuLi5pZHhTZXRdLnNvcnQoKGEsIGIpID0+IGEgLSBiKTtcbiAgICAgICAgZm9yIChsZXQgaSA9IDE7IGkgPCBpZHgubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBkdXBsaWNhdGVkS2V5c01zZy5wdXNoKFxuICAgICAgICAgICAgYGtleSBcIiR7c3RyaW5naWZ5Rm9yRXJyb3Ioa2V5KX1cIiBhdCBpbmRleCBcIiR7aWR4W2kgLSAxXX1cIiBhbmQgXCIke2lkeFtpXX1cImAsXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChkdXBsaWNhdGVkS2V5c01zZy5sZW5ndGggPiAwKSB7XG4gICAgICBjb25zdCBtZXNzYWdlID0gZm9ybWF0UnVudGltZUVycm9yKFxuICAgICAgICBSdW50aW1lRXJyb3JDb2RlLkxPT1BfVFJBQ0tfRFVQTElDQVRFX0tFWVMsXG4gICAgICAgICdUaGUgcHJvdmlkZWQgdHJhY2sgZXhwcmVzc2lvbiByZXN1bHRlZCBpbiBkdXBsaWNhdGVkIGtleXMgZm9yIGEgZ2l2ZW4gY29sbGVjdGlvbi4gJyArXG4gICAgICAgICAgJ0FkanVzdCB0aGUgdHJhY2tpbmcgZXhwcmVzc2lvbiBzdWNoIHRoYXQgaXQgdW5pcXVlbHkgaWRlbnRpZmllcyBhbGwgdGhlIGl0ZW1zIGluIHRoZSBjb2xsZWN0aW9uLiAnICtcbiAgICAgICAgICAnRHVwbGljYXRlZCBrZXlzIHdlcmU6IFxcbicgK1xuICAgICAgICAgIGR1cGxpY2F0ZWRLZXlzTXNnLmpvaW4oJywgXFxuJykgK1xuICAgICAgICAgICcuJyxcbiAgICAgICk7XG5cbiAgICAgIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTpuby1jb25zb2xlXG4gICAgICBjb25zb2xlLndhcm4obWVzc2FnZSk7XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIGF0dGFjaFByZXZpb3VzbHlEZXRhY2hlZDxULCBWPihcbiAgcHJldkNvbGxlY3Rpb246IExpdmVDb2xsZWN0aW9uPFQsIFY+LFxuICBkZXRhY2hlZEl0ZW1zOiBVbmlxdWVWYWx1ZU11bHRpS2V5TWFwPHVua25vd24sIFQ+IHwgdW5kZWZpbmVkLFxuICBpbmRleDogbnVtYmVyLFxuICBrZXk6IHVua25vd24sXG4pOiBib29sZWFuIHtcbiAgaWYgKGRldGFjaGVkSXRlbXMgIT09IHVuZGVmaW5lZCAmJiBkZXRhY2hlZEl0ZW1zLmhhcyhrZXkpKSB7XG4gICAgcHJldkNvbGxlY3Rpb24uYXR0YWNoKGluZGV4LCBkZXRhY2hlZEl0ZW1zLmdldChrZXkpISk7XG4gICAgZGV0YWNoZWRJdGVtcy5kZWxldGUoa2V5KTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuICByZXR1cm4gZmFsc2U7XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZU9yQXR0YWNoPFQsIFY+KFxuICBsaXZlQ29sbGVjdGlvbjogTGl2ZUNvbGxlY3Rpb248VCwgVj4sXG4gIGRldGFjaGVkSXRlbXM6IFVuaXF1ZVZhbHVlTXVsdGlLZXlNYXA8dW5rbm93biwgVD4gfCB1bmRlZmluZWQsXG4gIHRyYWNrQnlGbjogVHJhY2tCeUZ1bmN0aW9uPHVua25vd24+LFxuICBpbmRleDogbnVtYmVyLFxuICB2YWx1ZTogVixcbikge1xuICBpZiAoIWF0dGFjaFByZXZpb3VzbHlEZXRhY2hlZChsaXZlQ29sbGVjdGlvbiwgZGV0YWNoZWRJdGVtcywgaW5kZXgsIHRyYWNrQnlGbihpbmRleCwgdmFsdWUpKSkge1xuICAgIGNvbnN0IG5ld0l0ZW0gPSBsaXZlQ29sbGVjdGlvbi5jcmVhdGUoaW5kZXgsIHZhbHVlKTtcbiAgICBsaXZlQ29sbGVjdGlvbi5hdHRhY2goaW5kZXgsIG5ld0l0ZW0pO1xuICB9IGVsc2Uge1xuICAgIGxpdmVDb2xsZWN0aW9uLnVwZGF0ZVZhbHVlKGluZGV4LCB2YWx1ZSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gaW5pdExpdmVJdGVtc0luVGhlRnV0dXJlPFQ+KFxuICBsaXZlQ29sbGVjdGlvbjogTGl2ZUNvbGxlY3Rpb248dW5rbm93biwgdW5rbm93bj4sXG4gIHN0YXJ0OiBudW1iZXIsXG4gIGVuZDogbnVtYmVyLFxuICB0cmFja0J5Rm46IFRyYWNrQnlGdW5jdGlvbjx1bmtub3duPixcbik6IFNldDx1bmtub3duPiB7XG4gIGNvbnN0IGtleXMgPSBuZXcgU2V0KCk7XG4gIGZvciAobGV0IGkgPSBzdGFydDsgaSA8PSBlbmQ7IGkrKykge1xuICAgIGtleXMuYWRkKHRyYWNrQnlGbihpLCBsaXZlQ29sbGVjdGlvbi5hdChpKSkpO1xuICB9XG4gIHJldHVybiBrZXlzO1xufVxuXG4vKipcbiAqIEEgc3BlY2lmaWMsIHBhcnRpYWwgaW1wbGVtZW50YXRpb24gb2YgdGhlIE1hcCBpbnRlcmZhY2Ugd2l0aCB0aGUgZm9sbG93aW5nIGNoYXJhY3RlcmlzdGljczpcbiAqIC0gYWxsb3dzIG11bHRpcGxlIHZhbHVlcyBmb3IgYSBnaXZlbiBrZXk7XG4gKiAtIG1haW50YWluIEZJRk8gb3JkZXIgZm9yIG11bHRpcGxlIHZhbHVlcyBjb3JyZXNwb25kaW5nIHRvIGEgZ2l2ZW4ga2V5O1xuICogLSBhc3N1bWVzIHRoYXQgYWxsIHZhbHVlcyBhcmUgdW5pcXVlLlxuICpcbiAqIFRoZSBpbXBsZW1lbnRhdGlvbiBhaW1zIGF0IGhhdmluZyB0aGUgbWluaW1hbCBvdmVyaGVhZCBmb3IgY2FzZXMgd2hlcmUga2V5cyBhcmUgX25vdF8gZHVwbGljYXRlZFxuICogKHRoZSBtb3N0IGNvbW1vbiBjYXNlIGluIHRoZSBsaXN0IHJlY29uY2lsaWF0aW9uIGFsZ29yaXRobSkuIFRvIGFjaGlldmUgdGhpcywgdGhlIGZpcnN0IHZhbHVlIGZvclxuICogYSBnaXZlbiBrZXkgaXMgc3RvcmVkIGluIGEgcmVndWxhciBtYXAuIFRoZW4sIHdoZW4gbW9yZSB2YWx1ZXMgYXJlIHNldCBmb3IgYSBnaXZlbiBrZXksIHdlXG4gKiBtYWludGFpbiBhIGZvcm0gb2YgbGlua2VkIGxpc3QgaW4gYSBzZXBhcmF0ZSBtYXAuIFRvIG1haW50YWluIHRoaXMgbGlua2VkIGxpc3Qgd2UgYXNzdW1lIHRoYXQgYWxsXG4gKiB2YWx1ZXMgKGluIHRoZSBlbnRpcmUgY29sbGVjdGlvbikgYXJlIHVuaXF1ZS5cbiAqL1xuZXhwb3J0IGNsYXNzIFVuaXF1ZVZhbHVlTXVsdGlLZXlNYXA8SywgVj4ge1xuICAvLyBBIG1hcCBmcm9tIGEga2V5IHRvIHRoZSBmaXJzdCB2YWx1ZSBjb3JyZXNwb25kaW5nIHRvIHRoaXMga2V5LlxuICBwcml2YXRlIGt2TWFwID0gbmV3IE1hcDxLLCBWPigpO1xuICAvLyBBIG1hcCB0aGF0IGFjdHMgYXMgYSBsaW5rZWQgbGlzdCBvZiB2YWx1ZXMgLSBlYWNoIHZhbHVlIG1hcHMgdG8gdGhlIG5leHQgdmFsdWUgaW4gdGhpcyBcImxpbmtlZFxuICAvLyBsaXN0XCIgKHRoaXMgb25seSB3b3JrcyBpZiB2YWx1ZXMgYXJlIHVuaXF1ZSkuIEFsbG9jYXRlZCBsYXppbHkgdG8gYXZvaWQgbWVtb3J5IGNvbnN1bXB0aW9uIHdoZW5cbiAgLy8gdGhlcmUgYXJlIG5vIGR1cGxpY2F0ZWQgdmFsdWVzLlxuICBwcml2YXRlIF92TWFwOiBNYXA8ViwgVj4gfCB1bmRlZmluZWQgPSB1bmRlZmluZWQ7XG5cbiAgaGFzKGtleTogSyk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLmt2TWFwLmhhcyhrZXkpO1xuICB9XG5cbiAgZGVsZXRlKGtleTogSyk6IGJvb2xlYW4ge1xuICAgIGlmICghdGhpcy5oYXMoa2V5KSkgcmV0dXJuIGZhbHNlO1xuXG4gICAgY29uc3QgdmFsdWUgPSB0aGlzLmt2TWFwLmdldChrZXkpITtcbiAgICBpZiAodGhpcy5fdk1hcCAhPT0gdW5kZWZpbmVkICYmIHRoaXMuX3ZNYXAuaGFzKHZhbHVlKSkge1xuICAgICAgdGhpcy5rdk1hcC5zZXQoa2V5LCB0aGlzLl92TWFwLmdldCh2YWx1ZSkhKTtcbiAgICAgIHRoaXMuX3ZNYXAuZGVsZXRlKHZhbHVlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5rdk1hcC5kZWxldGUoa2V5KTtcbiAgICB9XG5cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIGdldChrZXk6IEspOiBWIHwgdW5kZWZpbmVkIHtcbiAgICByZXR1cm4gdGhpcy5rdk1hcC5nZXQoa2V5KTtcbiAgfVxuXG4gIHNldChrZXk6IEssIHZhbHVlOiBWKTogdm9pZCB7XG4gICAgaWYgKHRoaXMua3ZNYXAuaGFzKGtleSkpIHtcbiAgICAgIGxldCBwcmV2VmFsdWUgPSB0aGlzLmt2TWFwLmdldChrZXkpITtcblxuICAgICAgLy8gTm90ZTogd2UgZG9uJ3QgdXNlIGBhc3NlcnROb3RTYW1lYCwgYmVjYXVzZSB0aGUgdmFsdWUgbmVlZHMgdG8gYmUgc3RyaW5naWZpZWQgZXZlbiBpZlxuICAgICAgLy8gdGhlcmUgaXMgbm8gZXJyb3Igd2hpY2ggY2FuIGZyZWV6ZSB0aGUgYnJvd3NlciBmb3IgbGFyZ2UgdmFsdWVzIChzZWUgIzU4NTA5KS5cbiAgICAgIGlmIChuZ0Rldk1vZGUgJiYgcHJldlZhbHVlID09PSB2YWx1ZSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYERldGVjdGVkIGEgZHVwbGljYXRlZCB2YWx1ZSAke3ZhbHVlfSBmb3IgdGhlIGtleSAke2tleX1gKTtcbiAgICAgIH1cblxuICAgICAgaWYgKHRoaXMuX3ZNYXAgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICB0aGlzLl92TWFwID0gbmV3IE1hcCgpO1xuICAgICAgfVxuXG4gICAgICBjb25zdCB2TWFwID0gdGhpcy5fdk1hcDtcbiAgICAgIHdoaWxlICh2TWFwLmhhcyhwcmV2VmFsdWUpKSB7XG4gICAgICAgIHByZXZWYWx1ZSA9IHZNYXAuZ2V0KHByZXZWYWx1ZSkhO1xuICAgICAgfVxuICAgICAgdk1hcC5zZXQocHJldlZhbHVlLCB2YWx1ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMua3ZNYXAuc2V0KGtleSwgdmFsdWUpO1xuICAgIH1cbiAgfVxuXG4gIGZvckVhY2goY2I6ICh2OiBWLCBrOiBLKSA9PiB2b2lkKSB7XG4gICAgZm9yIChsZXQgW2tleSwgdmFsdWVdIG9mIHRoaXMua3ZNYXApIHtcbiAgICAgIGNiKHZhbHVlLCBrZXkpO1xuICAgICAgaWYgKHRoaXMuX3ZNYXAgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBjb25zdCB2TWFwID0gdGhpcy5fdk1hcDtcbiAgICAgICAgd2hpbGUgKHZNYXAuaGFzKHZhbHVlKSkge1xuICAgICAgICAgIHZhbHVlID0gdk1hcC5nZXQodmFsdWUpITtcbiAgICAgICAgICBjYih2YWx1ZSwga2V5KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxufVxuIl19