/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { formatRuntimeError } from '../errors';
import { assertNotSame } from '../util/assert';
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
                recordDuplicateKeys(duplicateKeys, trackByFn(liveEndIdx, newEndValue), liveEndIdx);
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
            const message = formatRuntimeError(955 /* RuntimeErrorCode.LOOP_TRACK_DUPLICATE_KEYS */, 'The provided track expression resulted in duplicated keys for a given collection. ' +
                'Adjust the tracking expression such that it uniquely identifies all the items in the collection. ' +
                'Duplicated keys were: \n' + duplicatedKeysMsg.join(', \n') + '.');
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGlzdF9yZWNvbmNpbGlhdGlvbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvbGlzdF9yZWNvbmNpbGlhdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFHSCxPQUFPLEVBQUMsa0JBQWtCLEVBQW1CLE1BQU0sV0FBVyxDQUFDO0FBQy9ELE9BQU8sRUFBQyxhQUFhLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUU3QyxPQUFPLEVBQUMsaUJBQWlCLEVBQUMsTUFBTSx3QkFBd0IsQ0FBQztBQUV6RDs7OztHQUlHO0FBQ0gsTUFBTSxPQUFnQixjQUFjO0lBTWxDLE9BQU8sQ0FBQyxJQUFPO1FBQ2Isa0JBQWtCO0lBQ3BCLENBQUM7SUFDRCxXQUFXLENBQUMsS0FBYSxFQUFFLEtBQVE7UUFDakMsa0JBQWtCO0lBQ3BCLENBQUM7SUFFRCw0RkFBNEY7SUFDNUYsbUZBQW1GO0lBQ25GLGtCQUFrQjtJQUNsQixJQUFJLENBQUMsTUFBYyxFQUFFLE1BQWM7UUFDakMsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxNQUFNLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFDMUMsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxNQUFNLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFDeEMsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUNwQyxJQUFJLE1BQU0sR0FBRyxRQUFRLEdBQUcsQ0FBQyxFQUFFLENBQUM7WUFDMUIsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUN4QyxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRSxPQUFPLENBQUMsQ0FBQztZQUMvQixJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRSxTQUFTLENB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QztJQUNILENBQUM7Q0FDRiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1RyYWNrQnlGdW5jdGlvbn0gZnJvbSAnLi4vY2hhbmdlX2RldGVjdGlvbic7XG5pbXBvcnQge2Zvcm1hdFJ1bnRpbWVFcnJvciwgUnVudGltZUVycm9yQ29kZX0gZnJvbSAnLi4vZXJyb3JzJztcbmltcG9ydCB7YXNzZXJ0Tm90U2FtZX0gZnJvbSAnLi4vdXRpbC9hc3NlcnQnO1xuXG5pbXBvcnQge3N0cmluZ2lmeUZvckVycm9yfSBmcm9tICcuL3V0aWwvc3RyaW5naWZ5X3V0aWxzJztcblxuLyoqXG4gKiBBIHR5cGUgcmVwcmVzZW50aW5nIHRoZSBsaXZlIGNvbGxlY3Rpb24gdG8gYmUgcmVjb25jaWxlZCB3aXRoIGFueSBuZXcgKGluY29taW5nKSBjb2xsZWN0aW9uLiBUaGlzXG4gKiBpcyBhbiBhZGFwdGVyIGNsYXNzIHRoYXQgbWFrZXMgaXQgcG9zc2libGUgdG8gd29yayB3aXRoIGRpZmZlcmVudCBpbnRlcm5hbCBkYXRhIHN0cnVjdHVyZXMsXG4gKiByZWdhcmRsZXNzIG9mIHRoZSBhY3R1YWwgdmFsdWVzIG9mIHRoZSBpbmNvbWluZyBjb2xsZWN0aW9uLlxuICovXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgTGl2ZUNvbGxlY3Rpb248VCwgVj4ge1xuICBhYnN0cmFjdCBnZXQgbGVuZ3RoKCk6IG51bWJlcjtcbiAgYWJzdHJhY3QgYXQoaW5kZXg6IG51bWJlcik6IFY7XG4gIGFic3RyYWN0IGF0dGFjaChpbmRleDogbnVtYmVyLCBpdGVtOiBUKTogdm9pZDtcbiAgYWJzdHJhY3QgZGV0YWNoKGluZGV4OiBudW1iZXIpOiBUO1xuICBhYnN0cmFjdCBjcmVhdGUoaW5kZXg6IG51bWJlciwgdmFsdWU6IFYpOiBUO1xuICBkZXN0cm95KGl0ZW06IFQpOiB2b2lkIHtcbiAgICAvLyBub29wIGJ5IGRlZmF1bHRcbiAgfVxuICB1cGRhdGVWYWx1ZShpbmRleDogbnVtYmVyLCB2YWx1ZTogVik6IHZvaWQge1xuICAgIC8vIG5vb3AgYnkgZGVmYXVsdFxuICB9XG5cbiAgLy8gb3BlcmF0aW9ucyBiZWxvdyBjb3VsZCBiZSBpbXBsZW1lbnRlZCBvbiB0b3Agb2YgdGhlIG9wZXJhdGlvbnMgZGVmaW5lZCBzbyBmYXIsIGJ1dCBoYXZpbmdcbiAgLy8gdGhlbSBleHBsaWNpdGx5IGFsbG93IGNsZWFyIGV4cHJlc3Npb24gb2YgaW50ZW50IGFuZCBwb3RlbnRpYWxseSBtb3JlIHBlcmZvcm1hbnRcbiAgLy8gaW1wbGVtZW50YXRpb25zXG4gIHN3YXAoaW5kZXgxOiBudW1iZXIsIGluZGV4MjogbnVtYmVyKTogdm9pZCB7XG4gICAgY29uc3Qgc3RhcnRJZHggPSBNYXRoLm1pbihpbmRleDEsIGluZGV4Mik7XG4gICAgY29uc3QgZW5kSWR4ID0gTWF0aC5tYXgoaW5kZXgxLCBpbmRleDIpO1xuICAgIGNvbnN0IGVuZEl0ZW0gPSB0aGlzLmRldGFjaChlbmRJZHgpO1xuICAgIGlmIChlbmRJZHggLSBzdGFydElkeCA+IDEpIHtcbiAgICAgIGNvbnN0IHN0YXJ0SXRlbSA9IHRoaXMuZGV0YWNoKHN0YXJ0SWR4KTtcbiAgICAgIHRoaXMuYXR0YWNoKHN0YXJ0SWR4LCBlbmRJdGVtKTtcbiAgICAgIHRoaXMuYXR0YWNoKGVuZElkeCwgc3RhcnRJdGVtKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5hdHRhY2goc3RhcnRJZHgsIGVuZEl0ZW0pO1xuICAgIH1cbiAgfVxuICBtb3ZlKHByZXZJbmRleDogbnVtYmVyLCBuZXdJZHg6IG51bWJlcik6IHZvaWQge1xuICAgIHRoaXMuYXR0YWNoKG5ld0lkeCwgdGhpcy5kZXRhY2gocHJldkluZGV4KSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gdmFsdWVzTWF0Y2hpbmc8Vj4oXG4gICAgbGl2ZUlkeDogbnVtYmVyLCBsaXZlVmFsdWU6IFYsIG5ld0lkeDogbnVtYmVyLCBuZXdWYWx1ZTogVixcbiAgICB0cmFja0J5OiBUcmFja0J5RnVuY3Rpb248Vj4pOiBudW1iZXIge1xuICBpZiAobGl2ZUlkeCA9PT0gbmV3SWR4ICYmIE9iamVjdC5pcyhsaXZlVmFsdWUsIG5ld1ZhbHVlKSkge1xuICAgIC8vIG1hdGNoaW5nIGFuZCBubyB2YWx1ZSBpZGVudGl0eSB0byB1cGRhdGVcbiAgICByZXR1cm4gMTtcbiAgfSBlbHNlIGlmIChPYmplY3QuaXModHJhY2tCeShsaXZlSWR4LCBsaXZlVmFsdWUpLCB0cmFja0J5KG5ld0lkeCwgbmV3VmFsdWUpKSkge1xuICAgIC8vIG1hdGNoaW5nIGJ1dCByZXF1aXJlcyB2YWx1ZSBpZGVudGl0eSB1cGRhdGVcbiAgICByZXR1cm4gLTE7XG4gIH1cblxuICByZXR1cm4gMDtcbn1cblxuZnVuY3Rpb24gcmVjb3JkRHVwbGljYXRlS2V5cyhrZXlUb0lkeDogTWFwPHVua25vd24sIFNldDxudW1iZXI+Piwga2V5OiB1bmtub3duLCBpZHg6IG51bWJlcik6IHZvaWQge1xuICBjb25zdCBpZHhTb0ZhciA9IGtleVRvSWR4LmdldChrZXkpO1xuXG4gIGlmIChpZHhTb0ZhciAhPT0gdW5kZWZpbmVkKSB7XG4gICAgaWR4U29GYXIuYWRkKGlkeCk7XG4gIH0gZWxzZSB7XG4gICAga2V5VG9JZHguc2V0KGtleSwgbmV3IFNldChbaWR4XSkpO1xuICB9XG59XG5cbi8qKlxuICogVGhlIGxpdmUgY29sbGVjdGlvbiByZWNvbmNpbGlhdGlvbiBhbGdvcml0aG0gdGhhdCBwZXJmb3JtIHZhcmlvdXMgaW4tcGxhY2Ugb3BlcmF0aW9ucywgc28gaXRcbiAqIHJlZmxlY3RzIHRoZSBjb250ZW50IG9mIHRoZSBuZXcgKGluY29taW5nKSBjb2xsZWN0aW9uLlxuICpcbiAqIFRoZSByZWNvbmNpbGlhdGlvbiBhbGdvcml0aG0gaGFzIDIgY29kZSBwYXRoczpcbiAqIC0gXCJmYXN0XCIgcGF0aCB0aGF0IGRvbid0IHJlcXVpcmUgYW55IG1lbW9yeSBhbGxvY2F0aW9uO1xuICogLSBcInNsb3dcIiBwYXRoIHRoYXQgcmVxdWlyZXMgYWRkaXRpb25hbCBtZW1vcnkgYWxsb2NhdGlvbiBmb3IgaW50ZXJtZWRpYXRlIGRhdGEgc3RydWN0dXJlcyB1c2VkIHRvXG4gKiBjb2xsZWN0IGFkZGl0aW9uYWwgaW5mb3JtYXRpb24gYWJvdXQgdGhlIGxpdmUgY29sbGVjdGlvbi5cbiAqIEl0IG1pZ2h0IGhhcHBlbiB0aGF0IHRoZSBhbGdvcml0aG0gc3dpdGNoZXMgYmV0d2VlbiB0aGUgdHdvIG1vZGVzIGluIHF1ZXN0aW9uIGluIGEgc2luZ2xlXG4gKiByZWNvbmNpbGlhdGlvbiBwYXRoIC0gZ2VuZXJhbGx5IGl0IHRyaWVzIHRvIHN0YXkgb24gdGhlIFwiZmFzdFwiIHBhdGggYXMgbXVjaCBhcyBwb3NzaWJsZS5cbiAqXG4gKiBUaGUgb3ZlcmFsbCBjb21wbGV4aXR5IG9mIHRoZSBhbGdvcml0aG0gaXMgTyhuICsgbSkgZm9yIHNwZWVkIGFuZCBPKG4pIGZvciBtZW1vcnkgKHdoZXJlIG4gaXMgdGhlXG4gKiBsZW5ndGggb2YgdGhlIGxpdmUgY29sbGVjdGlvbiBhbmQgbSBpcyB0aGUgbGVuZ3RoIG9mIHRoZSBpbmNvbWluZyBjb2xsZWN0aW9uKS4gR2l2ZW4gdGhlIHByb2JsZW1cbiAqIGF0IGhhbmQgdGhlIGNvbXBsZXhpdHkgLyBwZXJmb3JtYW5jZSBjb25zdHJhaW50cyBtYWtlcyBpdCBpbXBvc3NpYmxlIHRvIHBlcmZvcm0gdGhlIGFic29sdXRlXG4gKiBtaW5pbXVtIG9mIG9wZXJhdGlvbiB0byByZWNvbmNpbGUgdGhlIDIgY29sbGVjdGlvbnMuIFRoZSBhbGdvcml0aG0gbWFrZXMgZGlmZmVyZW50IHRyYWRlb2ZmcyB0b1xuICogc3RheSB3aXRoaW4gcmVhc29uYWJsZSBwZXJmb3JtYW5jZSBib3VuZHMgYW5kIG1heSBhcHBseSBzdWItb3B0aW1hbCBudW1iZXIgb2Ygb3BlcmF0aW9ucyBpblxuICogY2VydGFpbiBzaXR1YXRpb25zLlxuICpcbiAqIEBwYXJhbSBsaXZlQ29sbGVjdGlvbiB0aGUgY3VycmVudCwgbGl2ZSBjb2xsZWN0aW9uO1xuICogQHBhcmFtIG5ld0NvbGxlY3Rpb24gdGhlIG5ldywgaW5jb21pbmcgY29sbGVjdGlvbjtcbiAqIEBwYXJhbSB0cmFja0J5Rm4ga2V5IGdlbmVyYXRpb24gZnVuY3Rpb24gdGhhdCBkZXRlcm1pbmVzIGVxdWFsaXR5IGJldHdlZW4gaXRlbXMgaW4gdGhlIGxpZmUgYW5kXG4gKiAgICAgaW5jb21pbmcgY29sbGVjdGlvbjtcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlY29uY2lsZTxULCBWPihcbiAgICBsaXZlQ29sbGVjdGlvbjogTGl2ZUNvbGxlY3Rpb248VCwgVj4sIG5ld0NvbGxlY3Rpb246IEl0ZXJhYmxlPFY+fHVuZGVmaW5lZHxudWxsLFxuICAgIHRyYWNrQnlGbjogVHJhY2tCeUZ1bmN0aW9uPFY+KTogdm9pZCB7XG4gIGxldCBkZXRhY2hlZEl0ZW1zOiBVbmlxdWVWYWx1ZU11bHRpS2V5TWFwPHVua25vd24sIFQ+fHVuZGVmaW5lZCA9IHVuZGVmaW5lZDtcbiAgbGV0IGxpdmVLZXlzSW5UaGVGdXR1cmU6IFNldDx1bmtub3duPnx1bmRlZmluZWQgPSB1bmRlZmluZWQ7XG5cbiAgbGV0IGxpdmVTdGFydElkeCA9IDA7XG4gIGxldCBsaXZlRW5kSWR4ID0gbGl2ZUNvbGxlY3Rpb24ubGVuZ3RoIC0gMTtcblxuICBjb25zdCBkdXBsaWNhdGVLZXlzID0gbmdEZXZNb2RlID8gbmV3IE1hcDx1bmtub3duLCBTZXQ8bnVtYmVyPj4oKSA6IHVuZGVmaW5lZDtcblxuICBpZiAoQXJyYXkuaXNBcnJheShuZXdDb2xsZWN0aW9uKSkge1xuICAgIGxldCBuZXdFbmRJZHggPSBuZXdDb2xsZWN0aW9uLmxlbmd0aCAtIDE7XG5cbiAgICB3aGlsZSAobGl2ZVN0YXJ0SWR4IDw9IGxpdmVFbmRJZHggJiYgbGl2ZVN0YXJ0SWR4IDw9IG5ld0VuZElkeCkge1xuICAgICAgLy8gY29tcGFyZSBmcm9tIHRoZSBiZWdpbm5pbmdcbiAgICAgIGNvbnN0IGxpdmVTdGFydFZhbHVlID0gbGl2ZUNvbGxlY3Rpb24uYXQobGl2ZVN0YXJ0SWR4KTtcbiAgICAgIGNvbnN0IG5ld1N0YXJ0VmFsdWUgPSBuZXdDb2xsZWN0aW9uW2xpdmVTdGFydElkeF07XG5cbiAgICAgIGlmIChuZ0Rldk1vZGUpIHtcbiAgICAgICAgcmVjb3JkRHVwbGljYXRlS2V5cyhkdXBsaWNhdGVLZXlzISwgdHJhY2tCeUZuKGxpdmVTdGFydElkeCwgbmV3U3RhcnRWYWx1ZSksIGxpdmVTdGFydElkeCk7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGlzU3RhcnRNYXRjaGluZyA9XG4gICAgICAgICAgdmFsdWVzTWF0Y2hpbmcobGl2ZVN0YXJ0SWR4LCBsaXZlU3RhcnRWYWx1ZSwgbGl2ZVN0YXJ0SWR4LCBuZXdTdGFydFZhbHVlLCB0cmFja0J5Rm4pO1xuICAgICAgaWYgKGlzU3RhcnRNYXRjaGluZyAhPT0gMCkge1xuICAgICAgICBpZiAoaXNTdGFydE1hdGNoaW5nIDwgMCkge1xuICAgICAgICAgIGxpdmVDb2xsZWN0aW9uLnVwZGF0ZVZhbHVlKGxpdmVTdGFydElkeCwgbmV3U3RhcnRWYWx1ZSk7XG4gICAgICAgIH1cbiAgICAgICAgbGl2ZVN0YXJ0SWR4Kys7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICAvLyBjb21wYXJlIGZyb20gdGhlIGVuZFxuICAgICAgLy8gVE9ETyhwZXJmKTogZG8gX2FsbF8gdGhlIG1hdGNoaW5nIGZyb20gdGhlIGVuZFxuICAgICAgY29uc3QgbGl2ZUVuZFZhbHVlID0gbGl2ZUNvbGxlY3Rpb24uYXQobGl2ZUVuZElkeCk7XG4gICAgICBjb25zdCBuZXdFbmRWYWx1ZSA9IG5ld0NvbGxlY3Rpb25bbmV3RW5kSWR4XTtcblxuICAgICAgaWYgKG5nRGV2TW9kZSkge1xuICAgICAgICByZWNvcmREdXBsaWNhdGVLZXlzKGR1cGxpY2F0ZUtleXMhLCB0cmFja0J5Rm4obGl2ZUVuZElkeCwgbmV3RW5kVmFsdWUpLCBsaXZlRW5kSWR4KTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgaXNFbmRNYXRjaGluZyA9XG4gICAgICAgICAgdmFsdWVzTWF0Y2hpbmcobGl2ZUVuZElkeCwgbGl2ZUVuZFZhbHVlLCBuZXdFbmRJZHgsIG5ld0VuZFZhbHVlLCB0cmFja0J5Rm4pO1xuICAgICAgaWYgKGlzRW5kTWF0Y2hpbmcgIT09IDApIHtcbiAgICAgICAgaWYgKGlzRW5kTWF0Y2hpbmcgPCAwKSB7XG4gICAgICAgICAgbGl2ZUNvbGxlY3Rpb24udXBkYXRlVmFsdWUobGl2ZUVuZElkeCwgbmV3RW5kVmFsdWUpO1xuICAgICAgICB9XG4gICAgICAgIGxpdmVFbmRJZHgtLTtcbiAgICAgICAgbmV3RW5kSWR4LS07XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICAvLyBEZXRlY3Qgc3dhcCBhbmQgbW92ZXM6XG4gICAgICBjb25zdCBsaXZlU3RhcnRLZXkgPSB0cmFja0J5Rm4obGl2ZVN0YXJ0SWR4LCBsaXZlU3RhcnRWYWx1ZSk7XG4gICAgICBjb25zdCBsaXZlRW5kS2V5ID0gdHJhY2tCeUZuKGxpdmVFbmRJZHgsIGxpdmVFbmRWYWx1ZSk7XG4gICAgICBjb25zdCBuZXdTdGFydEtleSA9IHRyYWNrQnlGbihsaXZlU3RhcnRJZHgsIG5ld1N0YXJ0VmFsdWUpO1xuICAgICAgaWYgKE9iamVjdC5pcyhuZXdTdGFydEtleSwgbGl2ZUVuZEtleSkpIHtcbiAgICAgICAgY29uc3QgbmV3RW5kS2V5ID0gdHJhY2tCeUZuKG5ld0VuZElkeCwgbmV3RW5kVmFsdWUpO1xuICAgICAgICAvLyBkZXRlY3Qgc3dhcCBvbiBib3RoIGVuZHM7XG4gICAgICAgIGlmIChPYmplY3QuaXMobmV3RW5kS2V5LCBsaXZlU3RhcnRLZXkpKSB7XG4gICAgICAgICAgbGl2ZUNvbGxlY3Rpb24uc3dhcChsaXZlU3RhcnRJZHgsIGxpdmVFbmRJZHgpO1xuICAgICAgICAgIGxpdmVDb2xsZWN0aW9uLnVwZGF0ZVZhbHVlKGxpdmVFbmRJZHgsIG5ld0VuZFZhbHVlKTtcbiAgICAgICAgICBuZXdFbmRJZHgtLTtcbiAgICAgICAgICBsaXZlRW5kSWR4LS07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gdGhlIG5ldyBpdGVtIGlzIHRoZSBzYW1lIGFzIHRoZSBsaXZlIGl0ZW0gd2l0aCB0aGUgZW5kIHBvaW50ZXIgLSB0aGlzIGlzIGEgbW92ZSBmb3J3YXJkXG4gICAgICAgICAgLy8gdG8gYW4gZWFybGllciBpbmRleDtcbiAgICAgICAgICBsaXZlQ29sbGVjdGlvbi5tb3ZlKGxpdmVFbmRJZHgsIGxpdmVTdGFydElkeCk7XG4gICAgICAgIH1cbiAgICAgICAgbGl2ZUNvbGxlY3Rpb24udXBkYXRlVmFsdWUobGl2ZVN0YXJ0SWR4LCBuZXdTdGFydFZhbHVlKTtcbiAgICAgICAgbGl2ZVN0YXJ0SWR4Kys7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICAvLyBGYWxsYmFjayB0byB0aGUgc2xvdyBwYXRoOiB3ZSBuZWVkIHRvIGxlYXJuIG1vcmUgYWJvdXQgdGhlIGNvbnRlbnQgb2YgdGhlIGxpdmUgYW5kIG5ld1xuICAgICAgLy8gY29sbGVjdGlvbnMuXG4gICAgICBkZXRhY2hlZEl0ZW1zID8/PSBuZXcgVW5pcXVlVmFsdWVNdWx0aUtleU1hcCgpO1xuICAgICAgbGl2ZUtleXNJblRoZUZ1dHVyZSA/Pz1cbiAgICAgICAgICBpbml0TGl2ZUl0ZW1zSW5UaGVGdXR1cmUobGl2ZUNvbGxlY3Rpb24sIGxpdmVTdGFydElkeCwgbGl2ZUVuZElkeCwgdHJhY2tCeUZuKTtcblxuICAgICAgLy8gQ2hlY2sgaWYgSSdtIGluc2VydGluZyBhIHByZXZpb3VzbHkgZGV0YWNoZWQgaXRlbTogaWYgc28sIGF0dGFjaCBpdCBoZXJlXG4gICAgICBpZiAoYXR0YWNoUHJldmlvdXNseURldGFjaGVkKGxpdmVDb2xsZWN0aW9uLCBkZXRhY2hlZEl0ZW1zLCBsaXZlU3RhcnRJZHgsIG5ld1N0YXJ0S2V5KSkge1xuICAgICAgICBsaXZlQ29sbGVjdGlvbi51cGRhdGVWYWx1ZShsaXZlU3RhcnRJZHgsIG5ld1N0YXJ0VmFsdWUpO1xuICAgICAgICBsaXZlU3RhcnRJZHgrKztcbiAgICAgICAgbGl2ZUVuZElkeCsrO1xuICAgICAgfSBlbHNlIGlmICghbGl2ZUtleXNJblRoZUZ1dHVyZS5oYXMobmV3U3RhcnRLZXkpKSB7XG4gICAgICAgIC8vIENoZWNrIGlmIHdlIHNlZW4gYSBuZXcgaXRlbSB0aGF0IGRvZXNuJ3QgZXhpc3QgaW4gdGhlIG9sZCBjb2xsZWN0aW9uIGFuZCBtdXN0IGJlIElOU0VSVEVEXG4gICAgICAgIGNvbnN0IG5ld0l0ZW0gPSBsaXZlQ29sbGVjdGlvbi5jcmVhdGUobGl2ZVN0YXJ0SWR4LCBuZXdDb2xsZWN0aW9uW2xpdmVTdGFydElkeF0pO1xuICAgICAgICBsaXZlQ29sbGVjdGlvbi5hdHRhY2gobGl2ZVN0YXJ0SWR4LCBuZXdJdGVtKTtcbiAgICAgICAgbGl2ZVN0YXJ0SWR4Kys7XG4gICAgICAgIGxpdmVFbmRJZHgrKztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIFdlIGtub3cgdGhhdCB0aGUgbmV3IGl0ZW0gZXhpc3RzIGxhdGVyIG9uIGluIG9sZCBjb2xsZWN0aW9uIGJ1dCB3ZSBkb24ndCBrbm93IGl0cyBpbmRleFxuICAgICAgICAvLyBhbmQgYXMgdGhlIGNvbnNlcXVlbmNlIGNhbid0IG1vdmUgaXQgKGRvbid0IGtub3cgd2hlcmUgdG8gZmluZCBpdCkuIERldGFjaCB0aGUgb2xkIGl0ZW0sXG4gICAgICAgIC8vIGhvcGluZyB0aGF0IGl0IHVubG9ja3MgdGhlIGZhc3QgcGF0aCBhZ2Fpbi5cbiAgICAgICAgZGV0YWNoZWRJdGVtcy5zZXQobGl2ZVN0YXJ0S2V5LCBsaXZlQ29sbGVjdGlvbi5kZXRhY2gobGl2ZVN0YXJ0SWR4KSk7XG4gICAgICAgIGxpdmVFbmRJZHgtLTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBGaW5hbCBjbGVhbnVwIHN0ZXBzOlxuICAgIC8vIC0gbW9yZSBpdGVtcyBpbiB0aGUgbmV3IGNvbGxlY3Rpb24gPT4gaW5zZXJ0XG4gICAgd2hpbGUgKGxpdmVTdGFydElkeCA8PSBuZXdFbmRJZHgpIHtcbiAgICAgIGNyZWF0ZU9yQXR0YWNoKFxuICAgICAgICAgIGxpdmVDb2xsZWN0aW9uLCBkZXRhY2hlZEl0ZW1zLCB0cmFja0J5Rm4sIGxpdmVTdGFydElkeCwgbmV3Q29sbGVjdGlvbltsaXZlU3RhcnRJZHhdKTtcbiAgICAgIGxpdmVTdGFydElkeCsrO1xuICAgIH1cblxuICB9IGVsc2UgaWYgKG5ld0NvbGxlY3Rpb24gIT0gbnVsbCkge1xuICAgIC8vIGl0ZXJhYmxlIC0gaW1tZWRpYXRlbHkgZmFsbGJhY2sgdG8gdGhlIHNsb3cgcGF0aFxuICAgIGNvbnN0IG5ld0NvbGxlY3Rpb25JdGVyYXRvciA9IG5ld0NvbGxlY3Rpb25bU3ltYm9sLml0ZXJhdG9yXSgpO1xuICAgIGxldCBuZXdJdGVyYXRpb25SZXN1bHQgPSBuZXdDb2xsZWN0aW9uSXRlcmF0b3IubmV4dCgpO1xuICAgIHdoaWxlICghbmV3SXRlcmF0aW9uUmVzdWx0LmRvbmUgJiYgbGl2ZVN0YXJ0SWR4IDw9IGxpdmVFbmRJZHgpIHtcbiAgICAgIGNvbnN0IGxpdmVWYWx1ZSA9IGxpdmVDb2xsZWN0aW9uLmF0KGxpdmVTdGFydElkeCk7XG4gICAgICBjb25zdCBuZXdWYWx1ZSA9IG5ld0l0ZXJhdGlvblJlc3VsdC52YWx1ZTtcblxuICAgICAgaWYgKG5nRGV2TW9kZSkge1xuICAgICAgICByZWNvcmREdXBsaWNhdGVLZXlzKGR1cGxpY2F0ZUtleXMhLCB0cmFja0J5Rm4obGl2ZVN0YXJ0SWR4LCBuZXdWYWx1ZSksIGxpdmVTdGFydElkeCk7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGlzU3RhcnRNYXRjaGluZyA9XG4gICAgICAgICAgdmFsdWVzTWF0Y2hpbmcobGl2ZVN0YXJ0SWR4LCBsaXZlVmFsdWUsIGxpdmVTdGFydElkeCwgbmV3VmFsdWUsIHRyYWNrQnlGbik7XG4gICAgICBpZiAoaXNTdGFydE1hdGNoaW5nICE9PSAwKSB7XG4gICAgICAgIC8vIGZvdW5kIGEgbWF0Y2ggLSBtb3ZlIG9uLCBidXQgdXBkYXRlIHZhbHVlXG4gICAgICAgIGlmIChpc1N0YXJ0TWF0Y2hpbmcgPCAwKSB7XG4gICAgICAgICAgbGl2ZUNvbGxlY3Rpb24udXBkYXRlVmFsdWUobGl2ZVN0YXJ0SWR4LCBuZXdWYWx1ZSk7XG4gICAgICAgIH1cbiAgICAgICAgbGl2ZVN0YXJ0SWR4Kys7XG4gICAgICAgIG5ld0l0ZXJhdGlvblJlc3VsdCA9IG5ld0NvbGxlY3Rpb25JdGVyYXRvci5uZXh0KCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBkZXRhY2hlZEl0ZW1zID8/PSBuZXcgVW5pcXVlVmFsdWVNdWx0aUtleU1hcCgpO1xuICAgICAgICBsaXZlS2V5c0luVGhlRnV0dXJlID8/PVxuICAgICAgICAgICAgaW5pdExpdmVJdGVtc0luVGhlRnV0dXJlKGxpdmVDb2xsZWN0aW9uLCBsaXZlU3RhcnRJZHgsIGxpdmVFbmRJZHgsIHRyYWNrQnlGbik7XG5cbiAgICAgICAgLy8gQ2hlY2sgaWYgSSdtIGluc2VydGluZyBhIHByZXZpb3VzbHkgZGV0YWNoZWQgaXRlbTogaWYgc28sIGF0dGFjaCBpdCBoZXJlXG4gICAgICAgIGNvbnN0IG5ld0tleSA9IHRyYWNrQnlGbihsaXZlU3RhcnRJZHgsIG5ld1ZhbHVlKTtcbiAgICAgICAgaWYgKGF0dGFjaFByZXZpb3VzbHlEZXRhY2hlZChsaXZlQ29sbGVjdGlvbiwgZGV0YWNoZWRJdGVtcywgbGl2ZVN0YXJ0SWR4LCBuZXdLZXkpKSB7XG4gICAgICAgICAgbGl2ZUNvbGxlY3Rpb24udXBkYXRlVmFsdWUobGl2ZVN0YXJ0SWR4LCBuZXdWYWx1ZSk7XG4gICAgICAgICAgbGl2ZVN0YXJ0SWR4Kys7XG4gICAgICAgICAgbGl2ZUVuZElkeCsrO1xuICAgICAgICAgIG5ld0l0ZXJhdGlvblJlc3VsdCA9IG5ld0NvbGxlY3Rpb25JdGVyYXRvci5uZXh0KCk7XG4gICAgICAgIH0gZWxzZSBpZiAoIWxpdmVLZXlzSW5UaGVGdXR1cmUuaGFzKG5ld0tleSkpIHtcbiAgICAgICAgICBsaXZlQ29sbGVjdGlvbi5hdHRhY2gobGl2ZVN0YXJ0SWR4LCBsaXZlQ29sbGVjdGlvbi5jcmVhdGUobGl2ZVN0YXJ0SWR4LCBuZXdWYWx1ZSkpO1xuICAgICAgICAgIGxpdmVTdGFydElkeCsrO1xuICAgICAgICAgIGxpdmVFbmRJZHgrKztcbiAgICAgICAgICBuZXdJdGVyYXRpb25SZXN1bHQgPSBuZXdDb2xsZWN0aW9uSXRlcmF0b3IubmV4dCgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIGl0IGlzIGEgbW92ZSBmb3J3YXJkIC0gZGV0YWNoIHRoZSBjdXJyZW50IGl0ZW0gd2l0aG91dCBhZHZhbmNpbmcgaW4gY29sbGVjdGlvbnNcbiAgICAgICAgICBjb25zdCBsaXZlS2V5ID0gdHJhY2tCeUZuKGxpdmVTdGFydElkeCwgbGl2ZVZhbHVlKTtcbiAgICAgICAgICBkZXRhY2hlZEl0ZW1zLnNldChsaXZlS2V5LCBsaXZlQ29sbGVjdGlvbi5kZXRhY2gobGl2ZVN0YXJ0SWR4KSk7XG4gICAgICAgICAgbGl2ZUVuZElkeC0tO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gdGhpcyBpcyBhIG5ldyBpdGVtIGFzIHdlIHJ1biBvdXQgb2YgdGhlIGl0ZW1zIGluIHRoZSBvbGQgY29sbGVjdGlvbiAtIGNyZWF0ZSBvciBhdHRhY2ggYVxuICAgIC8vIHByZXZpb3VzbHkgZGV0YWNoZWQgb25lXG4gICAgd2hpbGUgKCFuZXdJdGVyYXRpb25SZXN1bHQuZG9uZSkge1xuICAgICAgY3JlYXRlT3JBdHRhY2goXG4gICAgICAgICAgbGl2ZUNvbGxlY3Rpb24sIGRldGFjaGVkSXRlbXMsIHRyYWNrQnlGbiwgbGl2ZUNvbGxlY3Rpb24ubGVuZ3RoLFxuICAgICAgICAgIG5ld0l0ZXJhdGlvblJlc3VsdC52YWx1ZSk7XG4gICAgICBuZXdJdGVyYXRpb25SZXN1bHQgPSBuZXdDb2xsZWN0aW9uSXRlcmF0b3IubmV4dCgpO1xuICAgIH1cbiAgfVxuXG4gIC8vIENsZWFudXBzIGNvbW1vbiB0byB0aGUgYXJyYXkgYW5kIGl0ZXJhYmxlOlxuICAvLyAtIG1vcmUgaXRlbXMgaW4gdGhlIGxpdmUgY29sbGVjdGlvbiA9PiBkZWxldGUgc3RhcnRpbmcgZnJvbSB0aGUgZW5kO1xuICB3aGlsZSAobGl2ZVN0YXJ0SWR4IDw9IGxpdmVFbmRJZHgpIHtcbiAgICBsaXZlQ29sbGVjdGlvbi5kZXN0cm95KGxpdmVDb2xsZWN0aW9uLmRldGFjaChsaXZlRW5kSWR4LS0pKTtcbiAgfVxuXG5cbiAgLy8gLSBkZXN0cm95IGl0ZW1zIHRoYXQgd2VyZSBkZXRhY2hlZCBidXQgbmV2ZXIgYXR0YWNoZWQgYWdhaW4uXG4gIGRldGFjaGVkSXRlbXM/LmZvckVhY2goaXRlbSA9PiB7XG4gICAgbGl2ZUNvbGxlY3Rpb24uZGVzdHJveShpdGVtKTtcbiAgfSk7XG5cbiAgLy8gcmVwb3J0IGR1cGxpY2F0ZSBrZXlzIChkZXYgbW9kZSBvbmx5KVxuICBpZiAobmdEZXZNb2RlKSB7XG4gICAgbGV0IGR1cGxpY2F0ZWRLZXlzTXNnID0gW107XG4gICAgZm9yIChjb25zdCBba2V5LCBpZHhTZXRdIG9mIGR1cGxpY2F0ZUtleXMhKSB7XG4gICAgICBpZiAoaWR4U2V0LnNpemUgPiAxKSB7XG4gICAgICAgIGNvbnN0IGlkeCA9IFsuLi5pZHhTZXRdLnNvcnQoKGEsIGIpID0+IGEgLSBiKTtcbiAgICAgICAgZm9yIChsZXQgaSA9IDE7IGkgPCBpZHgubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBkdXBsaWNhdGVkS2V5c01zZy5wdXNoKFxuICAgICAgICAgICAgICBga2V5IFwiJHtzdHJpbmdpZnlGb3JFcnJvcihrZXkpfVwiIGF0IGluZGV4IFwiJHtpZHhbaSAtIDFdfVwiIGFuZCBcIiR7aWR4W2ldfVwiYCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoZHVwbGljYXRlZEtleXNNc2cubGVuZ3RoID4gMCkge1xuICAgICAgY29uc3QgbWVzc2FnZSA9IGZvcm1hdFJ1bnRpbWVFcnJvcihcbiAgICAgICAgICBSdW50aW1lRXJyb3JDb2RlLkxPT1BfVFJBQ0tfRFVQTElDQVRFX0tFWVMsXG4gICAgICAgICAgJ1RoZSBwcm92aWRlZCB0cmFjayBleHByZXNzaW9uIHJlc3VsdGVkIGluIGR1cGxpY2F0ZWQga2V5cyBmb3IgYSBnaXZlbiBjb2xsZWN0aW9uLiAnICtcbiAgICAgICAgICAgICAgJ0FkanVzdCB0aGUgdHJhY2tpbmcgZXhwcmVzc2lvbiBzdWNoIHRoYXQgaXQgdW5pcXVlbHkgaWRlbnRpZmllcyBhbGwgdGhlIGl0ZW1zIGluIHRoZSBjb2xsZWN0aW9uLiAnICtcbiAgICAgICAgICAgICAgJ0R1cGxpY2F0ZWQga2V5cyB3ZXJlOiBcXG4nICsgZHVwbGljYXRlZEtleXNNc2cuam9pbignLCBcXG4nKSArICcuJyk7XG5cbiAgICAgIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTpuby1jb25zb2xlXG4gICAgICBjb25zb2xlLndhcm4obWVzc2FnZSk7XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIGF0dGFjaFByZXZpb3VzbHlEZXRhY2hlZDxULCBWPihcbiAgICBwcmV2Q29sbGVjdGlvbjogTGl2ZUNvbGxlY3Rpb248VCwgVj4sXG4gICAgZGV0YWNoZWRJdGVtczogVW5pcXVlVmFsdWVNdWx0aUtleU1hcDx1bmtub3duLCBUPnx1bmRlZmluZWQsIGluZGV4OiBudW1iZXIsXG4gICAga2V5OiB1bmtub3duKTogYm9vbGVhbiB7XG4gIGlmIChkZXRhY2hlZEl0ZW1zICE9PSB1bmRlZmluZWQgJiYgZGV0YWNoZWRJdGVtcy5oYXMoa2V5KSkge1xuICAgIHByZXZDb2xsZWN0aW9uLmF0dGFjaChpbmRleCwgZGV0YWNoZWRJdGVtcy5nZXQoa2V5KSEpO1xuICAgIGRldGFjaGVkSXRlbXMuZGVsZXRlKGtleSk7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG5mdW5jdGlvbiBjcmVhdGVPckF0dGFjaDxULCBWPihcbiAgICBsaXZlQ29sbGVjdGlvbjogTGl2ZUNvbGxlY3Rpb248VCwgVj4sXG4gICAgZGV0YWNoZWRJdGVtczogVW5pcXVlVmFsdWVNdWx0aUtleU1hcDx1bmtub3duLCBUPnx1bmRlZmluZWQsXG4gICAgdHJhY2tCeUZuOiBUcmFja0J5RnVuY3Rpb248dW5rbm93bj4sIGluZGV4OiBudW1iZXIsIHZhbHVlOiBWKSB7XG4gIGlmICghYXR0YWNoUHJldmlvdXNseURldGFjaGVkKGxpdmVDb2xsZWN0aW9uLCBkZXRhY2hlZEl0ZW1zLCBpbmRleCwgdHJhY2tCeUZuKGluZGV4LCB2YWx1ZSkpKSB7XG4gICAgY29uc3QgbmV3SXRlbSA9IGxpdmVDb2xsZWN0aW9uLmNyZWF0ZShpbmRleCwgdmFsdWUpO1xuICAgIGxpdmVDb2xsZWN0aW9uLmF0dGFjaChpbmRleCwgbmV3SXRlbSk7XG4gIH0gZWxzZSB7XG4gICAgbGl2ZUNvbGxlY3Rpb24udXBkYXRlVmFsdWUoaW5kZXgsIHZhbHVlKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBpbml0TGl2ZUl0ZW1zSW5UaGVGdXR1cmU8VD4oXG4gICAgbGl2ZUNvbGxlY3Rpb246IExpdmVDb2xsZWN0aW9uPHVua25vd24sIHVua25vd24+LCBzdGFydDogbnVtYmVyLCBlbmQ6IG51bWJlcixcbiAgICB0cmFja0J5Rm46IFRyYWNrQnlGdW5jdGlvbjx1bmtub3duPik6IFNldDx1bmtub3duPiB7XG4gIGNvbnN0IGtleXMgPSBuZXcgU2V0KCk7XG4gIGZvciAobGV0IGkgPSBzdGFydDsgaSA8PSBlbmQ7IGkrKykge1xuICAgIGtleXMuYWRkKHRyYWNrQnlGbihpLCBsaXZlQ29sbGVjdGlvbi5hdChpKSkpO1xuICB9XG4gIHJldHVybiBrZXlzO1xufVxuXG4vKipcbiAqIEEgc3BlY2lmaWMsIHBhcnRpYWwgaW1wbGVtZW50YXRpb24gb2YgdGhlIE1hcCBpbnRlcmZhY2Ugd2l0aCB0aGUgZm9sbG93aW5nIGNoYXJhY3RlcmlzdGljczpcbiAqIC0gYWxsb3dzIG11bHRpcGxlIHZhbHVlcyBmb3IgYSBnaXZlbiBrZXk7XG4gKiAtIG1haW50YWluIEZJRk8gb3JkZXIgZm9yIG11bHRpcGxlIHZhbHVlcyBjb3JyZXNwb25kaW5nIHRvIGEgZ2l2ZW4ga2V5O1xuICogLSBhc3N1bWVzIHRoYXQgYWxsIHZhbHVlcyBhcmUgdW5pcXVlLlxuICpcbiAqIFRoZSBpbXBsZW1lbnRhdGlvbiBhaW1zIGF0IGhhdmluZyB0aGUgbWluaW1hbCBvdmVyaGVhZCBmb3IgY2FzZXMgd2hlcmUga2V5cyBhcmUgX25vdF8gZHVwbGljYXRlZFxuICogKHRoZSBtb3N0IGNvbW1vbiBjYXNlIGluIHRoZSBsaXN0IHJlY29uY2lsaWF0aW9uIGFsZ29yaXRobSkuIFRvIGFjaGlldmUgdGhpcywgdGhlIGZpcnN0IHZhbHVlIGZvclxuICogYSBnaXZlbiBrZXkgaXMgc3RvcmVkIGluIGEgcmVndWxhciBtYXAuIFRoZW4sIHdoZW4gbW9yZSB2YWx1ZXMgYXJlIHNldCBmb3IgYSBnaXZlbiBrZXksIHdlXG4gKiBtYWludGFpbiBhIGZvcm0gb2YgbGlua2VkIGxpc3QgaW4gYSBzZXBhcmF0ZSBtYXAuIFRvIG1haW50YWluIHRoaXMgbGlua2VkIGxpc3Qgd2UgYXNzdW1lIHRoYXQgYWxsXG4gKiB2YWx1ZXMgKGluIHRoZSBlbnRpcmUgY29sbGVjdGlvbikgYXJlIHVuaXF1ZS5cbiAqL1xuZXhwb3J0IGNsYXNzIFVuaXF1ZVZhbHVlTXVsdGlLZXlNYXA8SywgVj4ge1xuICAvLyBBIG1hcCBmcm9tIGEga2V5IHRvIHRoZSBmaXJzdCB2YWx1ZSBjb3JyZXNwb25kaW5nIHRvIHRoaXMga2V5LlxuICBwcml2YXRlIGt2TWFwID0gbmV3IE1hcDxLLCBWPigpO1xuICAvLyBBIG1hcCB0aGF0IGFjdHMgYXMgYSBsaW5rZWQgbGlzdCBvZiB2YWx1ZXMgLSBlYWNoIHZhbHVlIG1hcHMgdG8gdGhlIG5leHQgdmFsdWUgaW4gdGhpcyBcImxpbmtlZFxuICAvLyBsaXN0XCIgKHRoaXMgb25seSB3b3JrcyBpZiB2YWx1ZXMgYXJlIHVuaXF1ZSkuIEFsbG9jYXRlZCBsYXppbHkgdG8gYXZvaWQgbWVtb3J5IGNvbnN1bXB0aW9uIHdoZW5cbiAgLy8gdGhlcmUgYXJlIG5vIGR1cGxpY2F0ZWQgdmFsdWVzLlxuICBwcml2YXRlIF92TWFwOiBNYXA8ViwgVj58dW5kZWZpbmVkID0gdW5kZWZpbmVkO1xuXG4gIGhhcyhrZXk6IEspOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5rdk1hcC5oYXMoa2V5KTtcbiAgfVxuXG4gIGRlbGV0ZShrZXk6IEspOiBib29sZWFuIHtcbiAgICBpZiAoIXRoaXMuaGFzKGtleSkpIHJldHVybiBmYWxzZTtcblxuICAgIGNvbnN0IHZhbHVlID0gdGhpcy5rdk1hcC5nZXQoa2V5KSE7XG4gICAgaWYgKHRoaXMuX3ZNYXAgIT09IHVuZGVmaW5lZCAmJiB0aGlzLl92TWFwLmhhcyh2YWx1ZSkpIHtcbiAgICAgIHRoaXMua3ZNYXAuc2V0KGtleSwgdGhpcy5fdk1hcC5nZXQodmFsdWUpISk7XG4gICAgICB0aGlzLl92TWFwLmRlbGV0ZSh2YWx1ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMua3ZNYXAuZGVsZXRlKGtleSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICBnZXQoa2V5OiBLKTogVnx1bmRlZmluZWQge1xuICAgIHJldHVybiB0aGlzLmt2TWFwLmdldChrZXkpO1xuICB9XG5cbiAgc2V0KGtleTogSywgdmFsdWU6IFYpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5rdk1hcC5oYXMoa2V5KSkge1xuICAgICAgbGV0IHByZXZWYWx1ZSA9IHRoaXMua3ZNYXAuZ2V0KGtleSkhO1xuICAgICAgbmdEZXZNb2RlICYmXG4gICAgICAgICAgYXNzZXJ0Tm90U2FtZShcbiAgICAgICAgICAgICAgcHJldlZhbHVlLCB2YWx1ZSwgYERldGVjdGVkIGEgZHVwbGljYXRlZCB2YWx1ZSAke3ZhbHVlfSBmb3IgdGhlIGtleSAke2tleX1gKTtcblxuICAgICAgaWYgKHRoaXMuX3ZNYXAgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICB0aGlzLl92TWFwID0gbmV3IE1hcCgpO1xuICAgICAgfVxuXG4gICAgICBjb25zdCB2TWFwID0gdGhpcy5fdk1hcDtcbiAgICAgIHdoaWxlICh2TWFwLmhhcyhwcmV2VmFsdWUpKSB7XG4gICAgICAgIHByZXZWYWx1ZSA9IHZNYXAuZ2V0KHByZXZWYWx1ZSkhO1xuICAgICAgfVxuICAgICAgdk1hcC5zZXQocHJldlZhbHVlLCB2YWx1ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMua3ZNYXAuc2V0KGtleSwgdmFsdWUpO1xuICAgIH1cbiAgfVxuXG4gIGZvckVhY2goY2I6ICh2OiBWLCBrOiBLKSA9PiB2b2lkKSB7XG4gICAgZm9yIChsZXQgW2tleSwgdmFsdWVdIG9mIHRoaXMua3ZNYXApIHtcbiAgICAgIGNiKHZhbHVlLCBrZXkpO1xuICAgICAgaWYgKHRoaXMuX3ZNYXAgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBjb25zdCB2TWFwID0gdGhpcy5fdk1hcDtcbiAgICAgICAgd2hpbGUgKHZNYXAuaGFzKHZhbHVlKSkge1xuICAgICAgICAgIHZhbHVlID0gdk1hcC5nZXQodmFsdWUpITtcbiAgICAgICAgICBjYih2YWx1ZSwga2V5KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxufVxuIl19