/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
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
            detachedItems ??= new MultiMap();
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
                detachedItems ??= new MultiMap();
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
class MultiMap {
    constructor() {
        this.map = new Map();
    }
    has(key) {
        const listOfKeys = this.map.get(key);
        return listOfKeys !== undefined && listOfKeys.length > 0;
    }
    delete(key) {
        const listOfKeys = this.map.get(key);
        if (listOfKeys !== undefined) {
            listOfKeys.shift();
            return true;
        }
        return false;
    }
    get(key) {
        const listOfKeys = this.map.get(key);
        return listOfKeys !== undefined && listOfKeys.length > 0 ? listOfKeys[0] : undefined;
    }
    set(key, value) {
        // if value is array, they we always store it as [value].
        if (!this.map.has(key)) {
            this.map.set(key, [value]);
            return;
        }
        // THINK: this allows duplicate values, but I guess this is fine?
        // Is the existing key an array or not?
        this.map.get(key)?.push(value);
    }
    forEach(cb) {
        for (const [key, values] of this.map) {
            for (const value of values) {
                cb(value, key);
            }
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGlzdF9yZWNvbmNpbGlhdGlvbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvbGlzdF9yZWNvbmNpbGlhdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFJSDs7OztHQUlHO0FBQ0gsTUFBTSxPQUFnQixjQUFjO0lBTWxDLE9BQU8sQ0FBQyxJQUFPO1FBQ2Isa0JBQWtCO0lBQ3BCLENBQUM7SUFDRCxXQUFXLENBQUMsS0FBYSxFQUFFLEtBQVE7UUFDakMsa0JBQWtCO0lBQ3BCLENBQUM7SUFFRCw0RkFBNEY7SUFDNUYsbUZBQW1GO0lBQ25GLGtCQUFrQjtJQUNsQixJQUFJLENBQUMsTUFBYyxFQUFFLE1BQWM7UUFDakMsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxNQUFNLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFDMUMsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxNQUFNLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFDeEMsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUNwQyxJQUFJLE1BQU0sR0FBRyxRQUFRLEdBQUcsQ0FBQyxFQUFFLENBQUM7WUFDMUIsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUN4QyxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRSxPQUFPLENBQUMsQ0FBQztZQUMvQixJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRSxTQUFTLENBQUMsQ0FBQztRQUNqQyxDQUFDO2FBQU0sQ0FBQztZQUNOLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLE9BQU8sQ0FBQyxDQUFDO1FBQ2pDLENBQUM7SUFDSCxDQUFDO0lBQ0QsSUFBSSxDQUFDLFNBQWlCLEVBQUUsTUFBYztR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LGlFQUFpRTtRQUNqRSx1Q0FBdUM7UUFDdkMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ2pDLENBQUM7SUFFRCxPQUFPLENBQUMsRUFBd0I7UUFDOUIsS0FBSyxNQUFNLENBQUMsR0FBRyxFQUFFLE1BQU0sQ0FBQyxJQUFJLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQztZQUNyQyxLQUFLLE1BQU0sS0FBSyxJQUFJLE1BQU0sRUFBRSxDQUFDO2dCQUMzQixFQUFFLENBQUMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1lBQ2pCLENBQUM7UUFDSCxDQUFDO0lBQ0gsQ0FBQztDQUNGIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7VHJhY2tCeUZ1bmN0aW9ufSBmcm9tICcuLi9jaGFuZ2VfZGV0ZWN0aW9uJztcblxuLyoqXG4gKiBBIHR5cGUgcmVwcmVzZW50aW5nIHRoZSBsaXZlIGNvbGxlY3Rpb24gdG8gYmUgcmVjb25jaWxlZCB3aXRoIGFueSBuZXcgKGluY29taW5nKSBjb2xsZWN0aW9uLiBUaGlzXG4gKiBpcyBhbiBhZGFwdGVyIGNsYXNzIHRoYXQgbWFrZXMgaXQgcG9zc2libGUgdG8gd29yayB3aXRoIGRpZmZlcmVudCBpbnRlcm5hbCBkYXRhIHN0cnVjdHVyZXMsXG4gKiByZWdhcmRsZXNzIG9mIHRoZSBhY3R1YWwgdmFsdWVzIG9mIHRoZSBpbmNvbWluZyBjb2xsZWN0aW9uLlxuICovXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgTGl2ZUNvbGxlY3Rpb248VCwgVj4ge1xuICBhYnN0cmFjdCBnZXQgbGVuZ3RoKCk6IG51bWJlcjtcbiAgYWJzdHJhY3QgYXQoaW5kZXg6IG51bWJlcik6IFY7XG4gIGFic3RyYWN0IGF0dGFjaChpbmRleDogbnVtYmVyLCBpdGVtOiBUKTogdm9pZDtcbiAgYWJzdHJhY3QgZGV0YWNoKGluZGV4OiBudW1iZXIpOiBUO1xuICBhYnN0cmFjdCBjcmVhdGUoaW5kZXg6IG51bWJlciwgdmFsdWU6IFYpOiBUO1xuICBkZXN0cm95KGl0ZW06IFQpOiB2b2lkIHtcbiAgICAvLyBub29wIGJ5IGRlZmF1bHRcbiAgfVxuICB1cGRhdGVWYWx1ZShpbmRleDogbnVtYmVyLCB2YWx1ZTogVik6IHZvaWQge1xuICAgIC8vIG5vb3AgYnkgZGVmYXVsdFxuICB9XG5cbiAgLy8gb3BlcmF0aW9ucyBiZWxvdyBjb3VsZCBiZSBpbXBsZW1lbnRlZCBvbiB0b3Agb2YgdGhlIG9wZXJhdGlvbnMgZGVmaW5lZCBzbyBmYXIsIGJ1dCBoYXZpbmdcbiAgLy8gdGhlbSBleHBsaWNpdGx5IGFsbG93IGNsZWFyIGV4cHJlc3Npb24gb2YgaW50ZW50IGFuZCBwb3RlbnRpYWxseSBtb3JlIHBlcmZvcm1hbnRcbiAgLy8gaW1wbGVtZW50YXRpb25zXG4gIHN3YXAoaW5kZXgxOiBudW1iZXIsIGluZGV4MjogbnVtYmVyKTogdm9pZCB7XG4gICAgY29uc3Qgc3RhcnRJZHggPSBNYXRoLm1pbihpbmRleDEsIGluZGV4Mik7XG4gICAgY29uc3QgZW5kSWR4ID0gTWF0aC5tYXgoaW5kZXgxLCBpbmRleDIpO1xuICAgIGNvbnN0IGVuZEl0ZW0gPSB0aGlzLmRldGFjaChlbmRJZHgpO1xuICAgIGlmIChlbmRJZHggLSBzdGFydElkeCA+IDEpIHtcbiAgICAgIGNvbnN0IHN0YXJ0SXRlbSA9IHRoaXMuZGV0YWNoKHN0YXJ0SWR4KTtcbiAgICAgIHRoaXMuYXR0YWNoKHN0YXJ0SWR4LCBlbmRJdGVtKTtcbiAgICAgIHRoaXMuYXR0YWNoKGVuZElkeCwgc3RhcnRJdGVtKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5hdHRhY2goc3RhcnRJZHgsIGVuZEl0ZW0pO1xuICAgIH1cbiAgfVxuICBtb3ZlKHByZXZJbmRleDogbnVtYmVyLCBuZXdJZHg6IG51bWJlcik6IHZvaWQge1xuICAgIHRoaXMuYXR0YWNoKG5ld0lkeCwgdGhpcy5kZXRhY2gocHJldkluZGV4KSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gdmFsdWVzTWF0Y2hpbmc8Vj4oXG4gICAgbGl2ZUlkeDogbnVtYmVyLCBsaXZlVmFsdWU6IFYsIG5ld0lkeDogbnVtYmVyLCBuZXdWYWx1ZTogVixcbiAgICB0cmFja0J5OiBUcmFja0J5RnVuY3Rpb248Vj4pOiBudW1iZXIge1xuICBpZiAobGl2ZUlkeCA9PT0gbmV3SWR4ICYmIE9iamVjdC5pcyhsaXZlVmFsdWUsIG5ld1ZhbHVlKSkge1xuICAgIC8vIG1hdGNoaW5nIGFuZCBubyB2YWx1ZSBpZGVudGl0eSB0byB1cGRhdGVcbiAgICByZXR1cm4gMTtcbiAgfSBlbHNlIGlmIChPYmplY3QuaXModHJhY2tCeShsaXZlSWR4LCBsaXZlVmFsdWUpLCB0cmFja0J5KG5ld0lkeCwgbmV3VmFsdWUpKSkge1xuICAgIC8vIG1hdGNoaW5nIGJ1dCByZXF1aXJlcyB2YWx1ZSBpZGVudGl0eSB1cGRhdGVcbiAgICByZXR1cm4gLTE7XG4gIH1cblxuICByZXR1cm4gMDtcbn1cblxuLyoqXG4gKiBUaGUgbGl2ZSBjb2xsZWN0aW9uIHJlY29uY2lsaWF0aW9uIGFsZ29yaXRobSB0aGF0IHBlcmZvcm0gdmFyaW91cyBpbi1wbGFjZSBvcGVyYXRpb25zLCBzbyBpdFxuICogcmVmbGVjdHMgdGhlIGNvbnRlbnQgb2YgdGhlIG5ldyAoaW5jb21pbmcpIGNvbGxlY3Rpb24uXG4gKlxuICogVGhlIHJlY29uY2lsaWF0aW9uIGFsZ29yaXRobSBoYXMgMiBjb2RlIHBhdGhzOlxuICogLSBcImZhc3RcIiBwYXRoIHRoYXQgZG9uJ3QgcmVxdWlyZSBhbnkgbWVtb3J5IGFsbG9jYXRpb247XG4gKiAtIFwic2xvd1wiIHBhdGggdGhhdCByZXF1aXJlcyBhZGRpdGlvbmFsIG1lbW9yeSBhbGxvY2F0aW9uIGZvciBpbnRlcm1lZGlhdGUgZGF0YSBzdHJ1Y3R1cmVzIHVzZWQgdG9cbiAqIGNvbGxlY3QgYWRkaXRpb25hbCBpbmZvcm1hdGlvbiBhYm91dCB0aGUgbGl2ZSBjb2xsZWN0aW9uLlxuICogSXQgbWlnaHQgaGFwcGVuIHRoYXQgdGhlIGFsZ29yaXRobSBzd2l0Y2hlcyBiZXR3ZWVuIHRoZSB0d28gbW9kZXMgaW4gcXVlc3Rpb24gaW4gYSBzaW5nbGVcbiAqIHJlY29uY2lsaWF0aW9uIHBhdGggLSBnZW5lcmFsbHkgaXQgdHJpZXMgdG8gc3RheSBvbiB0aGUgXCJmYXN0XCIgcGF0aCBhcyBtdWNoIGFzIHBvc3NpYmxlLlxuICpcbiAqIFRoZSBvdmVyYWxsIGNvbXBsZXhpdHkgb2YgdGhlIGFsZ29yaXRobSBpcyBPKG4gKyBtKSBmb3Igc3BlZWQgYW5kIE8obikgZm9yIG1lbW9yeSAod2hlcmUgbiBpcyB0aGVcbiAqIGxlbmd0aCBvZiB0aGUgbGl2ZSBjb2xsZWN0aW9uIGFuZCBtIGlzIHRoZSBsZW5ndGggb2YgdGhlIGluY29taW5nIGNvbGxlY3Rpb24pLiBHaXZlbiB0aGUgcHJvYmxlbVxuICogYXQgaGFuZCB0aGUgY29tcGxleGl0eSAvIHBlcmZvcm1hbmNlIGNvbnN0cmFpbnRzIG1ha2VzIGl0IGltcG9zc2libGUgdG8gcGVyZm9ybSB0aGUgYWJzb2x1dGVcbiAqIG1pbmltdW0gb2Ygb3BlcmF0aW9uIHRvIHJlY29uY2lsZSB0aGUgMiBjb2xsZWN0aW9ucy4gVGhlIGFsZ29yaXRobSBtYWtlcyBkaWZmZXJlbnQgdHJhZGVvZmZzIHRvXG4gKiBzdGF5IHdpdGhpbiByZWFzb25hYmxlIHBlcmZvcm1hbmNlIGJvdW5kcyBhbmQgbWF5IGFwcGx5IHN1Yi1vcHRpbWFsIG51bWJlciBvZiBvcGVyYXRpb25zIGluXG4gKiBjZXJ0YWluIHNpdHVhdGlvbnMuXG4gKlxuICogQHBhcmFtIGxpdmVDb2xsZWN0aW9uIHRoZSBjdXJyZW50LCBsaXZlIGNvbGxlY3Rpb247XG4gKiBAcGFyYW0gbmV3Q29sbGVjdGlvbiB0aGUgbmV3LCBpbmNvbWluZyBjb2xsZWN0aW9uO1xuICogQHBhcmFtIHRyYWNrQnlGbiBrZXkgZ2VuZXJhdGlvbiBmdW5jdGlvbiB0aGF0IGRldGVybWluZXMgZXF1YWxpdHkgYmV0d2VlbiBpdGVtcyBpbiB0aGUgbGlmZSBhbmRcbiAqICAgICBpbmNvbWluZyBjb2xsZWN0aW9uO1xuICovXG5leHBvcnQgZnVuY3Rpb24gcmVjb25jaWxlPFQsIFY+KFxuICAgIGxpdmVDb2xsZWN0aW9uOiBMaXZlQ29sbGVjdGlvbjxULCBWPiwgbmV3Q29sbGVjdGlvbjogSXRlcmFibGU8Vj58dW5kZWZpbmVkfG51bGwsXG4gICAgdHJhY2tCeUZuOiBUcmFja0J5RnVuY3Rpb248Vj4pOiB2b2lkIHtcbiAgbGV0IGRldGFjaGVkSXRlbXM6IE11bHRpTWFwPHVua25vd24sIFQ+fHVuZGVmaW5lZCA9IHVuZGVmaW5lZDtcbiAgbGV0IGxpdmVLZXlzSW5UaGVGdXR1cmU6IFNldDx1bmtub3duPnx1bmRlZmluZWQgPSB1bmRlZmluZWQ7XG5cbiAgbGV0IGxpdmVTdGFydElkeCA9IDA7XG4gIGxldCBsaXZlRW5kSWR4ID0gbGl2ZUNvbGxlY3Rpb24ubGVuZ3RoIC0gMTtcblxuICBpZiAoQXJyYXkuaXNBcnJheShuZXdDb2xsZWN0aW9uKSkge1xuICAgIGxldCBuZXdFbmRJZHggPSBuZXdDb2xsZWN0aW9uLmxlbmd0aCAtIDE7XG5cbiAgICB3aGlsZSAobGl2ZVN0YXJ0SWR4IDw9IGxpdmVFbmRJZHggJiYgbGl2ZVN0YXJ0SWR4IDw9IG5ld0VuZElkeCkge1xuICAgICAgLy8gY29tcGFyZSBmcm9tIHRoZSBiZWdpbm5pbmdcbiAgICAgIGNvbnN0IGxpdmVTdGFydFZhbHVlID0gbGl2ZUNvbGxlY3Rpb24uYXQobGl2ZVN0YXJ0SWR4KTtcbiAgICAgIGNvbnN0IG5ld1N0YXJ0VmFsdWUgPSBuZXdDb2xsZWN0aW9uW2xpdmVTdGFydElkeF07XG4gICAgICBjb25zdCBpc1N0YXJ0TWF0Y2hpbmcgPVxuICAgICAgICAgIHZhbHVlc01hdGNoaW5nKGxpdmVTdGFydElkeCwgbGl2ZVN0YXJ0VmFsdWUsIGxpdmVTdGFydElkeCwgbmV3U3RhcnRWYWx1ZSwgdHJhY2tCeUZuKTtcbiAgICAgIGlmIChpc1N0YXJ0TWF0Y2hpbmcgIT09IDApIHtcbiAgICAgICAgaWYgKGlzU3RhcnRNYXRjaGluZyA8IDApIHtcbiAgICAgICAgICBsaXZlQ29sbGVjdGlvbi51cGRhdGVWYWx1ZShsaXZlU3RhcnRJZHgsIG5ld1N0YXJ0VmFsdWUpO1xuICAgICAgICB9XG4gICAgICAgIGxpdmVTdGFydElkeCsrO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgLy8gY29tcGFyZSBmcm9tIHRoZSBlbmRcbiAgICAgIC8vIFRPRE8ocGVyZik6IGRvIF9hbGxfIHRoZSBtYXRjaGluZyBmcm9tIHRoZSBlbmRcbiAgICAgIGNvbnN0IGxpdmVFbmRWYWx1ZSA9IGxpdmVDb2xsZWN0aW9uLmF0KGxpdmVFbmRJZHgpO1xuICAgICAgY29uc3QgbmV3RW5kVmFsdWUgPSBuZXdDb2xsZWN0aW9uW25ld0VuZElkeF07XG4gICAgICBjb25zdCBpc0VuZE1hdGNoaW5nID1cbiAgICAgICAgICB2YWx1ZXNNYXRjaGluZyhsaXZlRW5kSWR4LCBsaXZlRW5kVmFsdWUsIG5ld0VuZElkeCwgbmV3RW5kVmFsdWUsIHRyYWNrQnlGbik7XG4gICAgICBpZiAoaXNFbmRNYXRjaGluZyAhPT0gMCkge1xuICAgICAgICBpZiAoaXNFbmRNYXRjaGluZyA8IDApIHtcbiAgICAgICAgICBsaXZlQ29sbGVjdGlvbi51cGRhdGVWYWx1ZShsaXZlRW5kSWR4LCBuZXdFbmRWYWx1ZSk7XG4gICAgICAgIH1cbiAgICAgICAgbGl2ZUVuZElkeC0tO1xuICAgICAgICBuZXdFbmRJZHgtLTtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIC8vIERldGVjdCBzd2FwIGFuZCBtb3ZlczpcbiAgICAgIGNvbnN0IGxpdmVTdGFydEtleSA9IHRyYWNrQnlGbihsaXZlU3RhcnRJZHgsIGxpdmVTdGFydFZhbHVlKTtcbiAgICAgIGNvbnN0IGxpdmVFbmRLZXkgPSB0cmFja0J5Rm4obGl2ZUVuZElkeCwgbGl2ZUVuZFZhbHVlKTtcbiAgICAgIGNvbnN0IG5ld1N0YXJ0S2V5ID0gdHJhY2tCeUZuKGxpdmVTdGFydElkeCwgbmV3U3RhcnRWYWx1ZSk7XG4gICAgICBpZiAoT2JqZWN0LmlzKG5ld1N0YXJ0S2V5LCBsaXZlRW5kS2V5KSkge1xuICAgICAgICBjb25zdCBuZXdFbmRLZXkgPSB0cmFja0J5Rm4obmV3RW5kSWR4LCBuZXdFbmRWYWx1ZSk7XG4gICAgICAgIC8vIGRldGVjdCBzd2FwIG9uIGJvdGggZW5kcztcbiAgICAgICAgaWYgKE9iamVjdC5pcyhuZXdFbmRLZXksIGxpdmVTdGFydEtleSkpIHtcbiAgICAgICAgICBsaXZlQ29sbGVjdGlvbi5zd2FwKGxpdmVTdGFydElkeCwgbGl2ZUVuZElkeCk7XG4gICAgICAgICAgbGl2ZUNvbGxlY3Rpb24udXBkYXRlVmFsdWUobGl2ZUVuZElkeCwgbmV3RW5kVmFsdWUpO1xuICAgICAgICAgIG5ld0VuZElkeC0tO1xuICAgICAgICAgIGxpdmVFbmRJZHgtLTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyB0aGUgbmV3IGl0ZW0gaXMgdGhlIHNhbWUgYXMgdGhlIGxpdmUgaXRlbSB3aXRoIHRoZSBlbmQgcG9pbnRlciAtIHRoaXMgaXMgYSBtb3ZlIGZvcndhcmRcbiAgICAgICAgICAvLyB0byBhbiBlYXJsaWVyIGluZGV4O1xuICAgICAgICAgIGxpdmVDb2xsZWN0aW9uLm1vdmUobGl2ZUVuZElkeCwgbGl2ZVN0YXJ0SWR4KTtcbiAgICAgICAgfVxuICAgICAgICBsaXZlQ29sbGVjdGlvbi51cGRhdGVWYWx1ZShsaXZlU3RhcnRJZHgsIG5ld1N0YXJ0VmFsdWUpO1xuICAgICAgICBsaXZlU3RhcnRJZHgrKztcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIC8vIEZhbGxiYWNrIHRvIHRoZSBzbG93IHBhdGg6IHdlIG5lZWQgdG8gbGVhcm4gbW9yZSBhYm91dCB0aGUgY29udGVudCBvZiB0aGUgbGl2ZSBhbmQgbmV3XG4gICAgICAvLyBjb2xsZWN0aW9ucy5cbiAgICAgIGRldGFjaGVkSXRlbXMgPz89IG5ldyBNdWx0aU1hcCgpO1xuICAgICAgbGl2ZUtleXNJblRoZUZ1dHVyZSA/Pz1cbiAgICAgICAgICBpbml0TGl2ZUl0ZW1zSW5UaGVGdXR1cmUobGl2ZUNvbGxlY3Rpb24sIGxpdmVTdGFydElkeCwgbGl2ZUVuZElkeCwgdHJhY2tCeUZuKTtcblxuICAgICAgLy8gQ2hlY2sgaWYgSSdtIGluc2VydGluZyBhIHByZXZpb3VzbHkgZGV0YWNoZWQgaXRlbTogaWYgc28sIGF0dGFjaCBpdCBoZXJlXG4gICAgICBpZiAoYXR0YWNoUHJldmlvdXNseURldGFjaGVkKGxpdmVDb2xsZWN0aW9uLCBkZXRhY2hlZEl0ZW1zLCBsaXZlU3RhcnRJZHgsIG5ld1N0YXJ0S2V5KSkge1xuICAgICAgICBsaXZlQ29sbGVjdGlvbi51cGRhdGVWYWx1ZShsaXZlU3RhcnRJZHgsIG5ld1N0YXJ0VmFsdWUpO1xuICAgICAgICBsaXZlU3RhcnRJZHgrKztcbiAgICAgICAgbGl2ZUVuZElkeCsrO1xuICAgICAgfSBlbHNlIGlmICghbGl2ZUtleXNJblRoZUZ1dHVyZS5oYXMobmV3U3RhcnRLZXkpKSB7XG4gICAgICAgIC8vIENoZWNrIGlmIHdlIHNlZW4gYSBuZXcgaXRlbSB0aGF0IGRvZXNuJ3QgZXhpc3QgaW4gdGhlIG9sZCBjb2xsZWN0aW9uIGFuZCBtdXN0IGJlIElOU0VSVEVEXG4gICAgICAgIGNvbnN0IG5ld0l0ZW0gPSBsaXZlQ29sbGVjdGlvbi5jcmVhdGUobGl2ZVN0YXJ0SWR4LCBuZXdDb2xsZWN0aW9uW2xpdmVTdGFydElkeF0pO1xuICAgICAgICBsaXZlQ29sbGVjdGlvbi5hdHRhY2gobGl2ZVN0YXJ0SWR4LCBuZXdJdGVtKTtcbiAgICAgICAgbGl2ZVN0YXJ0SWR4Kys7XG4gICAgICAgIGxpdmVFbmRJZHgrKztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIFdlIGtub3cgdGhhdCB0aGUgbmV3IGl0ZW0gZXhpc3RzIGxhdGVyIG9uIGluIG9sZCBjb2xsZWN0aW9uIGJ1dCB3ZSBkb24ndCBrbm93IGl0cyBpbmRleFxuICAgICAgICAvLyBhbmQgYXMgdGhlIGNvbnNlcXVlbmNlIGNhbid0IG1vdmUgaXQgKGRvbid0IGtub3cgd2hlcmUgdG8gZmluZCBpdCkuIERldGFjaCB0aGUgb2xkIGl0ZW0sXG4gICAgICAgIC8vIGhvcGluZyB0aGF0IGl0IHVubG9ja3MgdGhlIGZhc3QgcGF0aCBhZ2Fpbi5cbiAgICAgICAgZGV0YWNoZWRJdGVtcy5zZXQobGl2ZVN0YXJ0S2V5LCBsaXZlQ29sbGVjdGlvbi5kZXRhY2gobGl2ZVN0YXJ0SWR4KSk7XG4gICAgICAgIGxpdmVFbmRJZHgtLTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBGaW5hbCBjbGVhbnVwIHN0ZXBzOlxuICAgIC8vIC0gbW9yZSBpdGVtcyBpbiB0aGUgbmV3IGNvbGxlY3Rpb24gPT4gaW5zZXJ0XG4gICAgd2hpbGUgKGxpdmVTdGFydElkeCA8PSBuZXdFbmRJZHgpIHtcbiAgICAgIGNyZWF0ZU9yQXR0YWNoKFxuICAgICAgICAgIGxpdmVDb2xsZWN0aW9uLCBkZXRhY2hlZEl0ZW1zLCB0cmFja0J5Rm4sIGxpdmVTdGFydElkeCwgbmV3Q29sbGVjdGlvbltsaXZlU3RhcnRJZHhdKTtcbiAgICAgIGxpdmVTdGFydElkeCsrO1xuICAgIH1cblxuICB9IGVsc2UgaWYgKG5ld0NvbGxlY3Rpb24gIT0gbnVsbCkge1xuICAgIC8vIGl0ZXJhYmxlIC0gaW1tZWRpYXRlbHkgZmFsbGJhY2sgdG8gdGhlIHNsb3cgcGF0aFxuICAgIGNvbnN0IG5ld0NvbGxlY3Rpb25JdGVyYXRvciA9IG5ld0NvbGxlY3Rpb25bU3ltYm9sLml0ZXJhdG9yXSgpO1xuICAgIGxldCBuZXdJdGVyYXRpb25SZXN1bHQgPSBuZXdDb2xsZWN0aW9uSXRlcmF0b3IubmV4dCgpO1xuICAgIHdoaWxlICghbmV3SXRlcmF0aW9uUmVzdWx0LmRvbmUgJiYgbGl2ZVN0YXJ0SWR4IDw9IGxpdmVFbmRJZHgpIHtcbiAgICAgIGNvbnN0IGxpdmVWYWx1ZSA9IGxpdmVDb2xsZWN0aW9uLmF0KGxpdmVTdGFydElkeCk7XG4gICAgICBjb25zdCBuZXdWYWx1ZSA9IG5ld0l0ZXJhdGlvblJlc3VsdC52YWx1ZTtcbiAgICAgIGNvbnN0IGlzU3RhcnRNYXRjaGluZyA9XG4gICAgICAgICAgdmFsdWVzTWF0Y2hpbmcobGl2ZVN0YXJ0SWR4LCBsaXZlVmFsdWUsIGxpdmVTdGFydElkeCwgbmV3VmFsdWUsIHRyYWNrQnlGbik7XG4gICAgICBpZiAoaXNTdGFydE1hdGNoaW5nICE9PSAwKSB7XG4gICAgICAgIC8vIGZvdW5kIGEgbWF0Y2ggLSBtb3ZlIG9uLCBidXQgdXBkYXRlIHZhbHVlXG4gICAgICAgIGlmIChpc1N0YXJ0TWF0Y2hpbmcgPCAwKSB7XG4gICAgICAgICAgbGl2ZUNvbGxlY3Rpb24udXBkYXRlVmFsdWUobGl2ZVN0YXJ0SWR4LCBuZXdWYWx1ZSk7XG4gICAgICAgIH1cbiAgICAgICAgbGl2ZVN0YXJ0SWR4Kys7XG4gICAgICAgIG5ld0l0ZXJhdGlvblJlc3VsdCA9IG5ld0NvbGxlY3Rpb25JdGVyYXRvci5uZXh0KCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBkZXRhY2hlZEl0ZW1zID8/PSBuZXcgTXVsdGlNYXAoKTtcbiAgICAgICAgbGl2ZUtleXNJblRoZUZ1dHVyZSA/Pz1cbiAgICAgICAgICAgIGluaXRMaXZlSXRlbXNJblRoZUZ1dHVyZShsaXZlQ29sbGVjdGlvbiwgbGl2ZVN0YXJ0SWR4LCBsaXZlRW5kSWR4LCB0cmFja0J5Rm4pO1xuXG4gICAgICAgIC8vIENoZWNrIGlmIEknbSBpbnNlcnRpbmcgYSBwcmV2aW91c2x5IGRldGFjaGVkIGl0ZW06IGlmIHNvLCBhdHRhY2ggaXQgaGVyZVxuICAgICAgICBjb25zdCBuZXdLZXkgPSB0cmFja0J5Rm4obGl2ZVN0YXJ0SWR4LCBuZXdWYWx1ZSk7XG4gICAgICAgIGlmIChhdHRhY2hQcmV2aW91c2x5RGV0YWNoZWQobGl2ZUNvbGxlY3Rpb24sIGRldGFjaGVkSXRlbXMsIGxpdmVTdGFydElkeCwgbmV3S2V5KSkge1xuICAgICAgICAgIGxpdmVDb2xsZWN0aW9uLnVwZGF0ZVZhbHVlKGxpdmVTdGFydElkeCwgbmV3VmFsdWUpO1xuICAgICAgICAgIGxpdmVTdGFydElkeCsrO1xuICAgICAgICAgIGxpdmVFbmRJZHgrKztcbiAgICAgICAgICBuZXdJdGVyYXRpb25SZXN1bHQgPSBuZXdDb2xsZWN0aW9uSXRlcmF0b3IubmV4dCgpO1xuICAgICAgICB9IGVsc2UgaWYgKCFsaXZlS2V5c0luVGhlRnV0dXJlLmhhcyhuZXdLZXkpKSB7XG4gICAgICAgICAgbGl2ZUNvbGxlY3Rpb24uYXR0YWNoKGxpdmVTdGFydElkeCwgbGl2ZUNvbGxlY3Rpb24uY3JlYXRlKGxpdmVTdGFydElkeCwgbmV3VmFsdWUpKTtcbiAgICAgICAgICBsaXZlU3RhcnRJZHgrKztcbiAgICAgICAgICBsaXZlRW5kSWR4Kys7XG4gICAgICAgICAgbmV3SXRlcmF0aW9uUmVzdWx0ID0gbmV3Q29sbGVjdGlvbkl0ZXJhdG9yLm5leHQoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBpdCBpcyBhIG1vdmUgZm9yd2FyZCAtIGRldGFjaCB0aGUgY3VycmVudCBpdGVtIHdpdGhvdXQgYWR2YW5jaW5nIGluIGNvbGxlY3Rpb25zXG4gICAgICAgICAgY29uc3QgbGl2ZUtleSA9IHRyYWNrQnlGbihsaXZlU3RhcnRJZHgsIGxpdmVWYWx1ZSk7XG4gICAgICAgICAgZGV0YWNoZWRJdGVtcy5zZXQobGl2ZUtleSwgbGl2ZUNvbGxlY3Rpb24uZGV0YWNoKGxpdmVTdGFydElkeCkpO1xuICAgICAgICAgIGxpdmVFbmRJZHgtLTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIC8vIHRoaXMgaXMgYSBuZXcgaXRlbSBhcyB3ZSBydW4gb3V0IG9mIHRoZSBpdGVtcyBpbiB0aGUgb2xkIGNvbGxlY3Rpb24gLSBjcmVhdGUgb3IgYXR0YWNoIGFcbiAgICAvLyBwcmV2aW91c2x5IGRldGFjaGVkIG9uZVxuICAgIHdoaWxlICghbmV3SXRlcmF0aW9uUmVzdWx0LmRvbmUpIHtcbiAgICAgIGNyZWF0ZU9yQXR0YWNoKFxuICAgICAgICAgIGxpdmVDb2xsZWN0aW9uLCBkZXRhY2hlZEl0ZW1zLCB0cmFja0J5Rm4sIGxpdmVDb2xsZWN0aW9uLmxlbmd0aCxcbiAgICAgICAgICBuZXdJdGVyYXRpb25SZXN1bHQudmFsdWUpO1xuICAgICAgbmV3SXRlcmF0aW9uUmVzdWx0ID0gbmV3Q29sbGVjdGlvbkl0ZXJhdG9yLm5leHQoKTtcbiAgICB9XG4gIH1cblxuICAvLyBDbGVhbnVwcyBjb21tb24gdG8gdGhlIGFycmF5IGFuZCBpdGVyYWJsZTpcbiAgLy8gLSBtb3JlIGl0ZW1zIGluIHRoZSBsaXZlIGNvbGxlY3Rpb24gPT4gZGVsZXRlIHN0YXJ0aW5nIGZyb20gdGhlIGVuZDtcbiAgd2hpbGUgKGxpdmVTdGFydElkeCA8PSBsaXZlRW5kSWR4KSB7XG4gICAgbGl2ZUNvbGxlY3Rpb24uZGVzdHJveShsaXZlQ29sbGVjdGlvbi5kZXRhY2gobGl2ZUVuZElkeC0tKSk7XG4gIH1cblxuXG4gIC8vIC0gZGVzdHJveSBpdGVtcyB0aGF0IHdlcmUgZGV0YWNoZWQgYnV0IG5ldmVyIGF0dGFjaGVkIGFnYWluLlxuICBkZXRhY2hlZEl0ZW1zPy5mb3JFYWNoKGl0ZW0gPT4ge1xuICAgIGxpdmVDb2xsZWN0aW9uLmRlc3Ryb3koaXRlbSk7XG4gIH0pO1xufVxuXG5mdW5jdGlvbiBhdHRhY2hQcmV2aW91c2x5RGV0YWNoZWQ8VCwgVj4oXG4gICAgcHJldkNvbGxlY3Rpb246IExpdmVDb2xsZWN0aW9uPFQsIFY+LCBkZXRhY2hlZEl0ZW1zOiBNdWx0aU1hcDx1bmtub3duLCBUPnx1bmRlZmluZWQsXG4gICAgaW5kZXg6IG51bWJlciwga2V5OiB1bmtub3duKTogYm9vbGVhbiB7XG4gIGlmIChkZXRhY2hlZEl0ZW1zICE9PSB1bmRlZmluZWQgJiYgZGV0YWNoZWRJdGVtcy5oYXMoa2V5KSkge1xuICAgIHByZXZDb2xsZWN0aW9uLmF0dGFjaChpbmRleCwgZGV0YWNoZWRJdGVtcy5nZXQoa2V5KSEpO1xuICAgIGRldGFjaGVkSXRlbXMuZGVsZXRlKGtleSk7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG5mdW5jdGlvbiBjcmVhdGVPckF0dGFjaDxULCBWPihcbiAgICBsaXZlQ29sbGVjdGlvbjogTGl2ZUNvbGxlY3Rpb248VCwgVj4sIGRldGFjaGVkSXRlbXM6IE11bHRpTWFwPHVua25vd24sIFQ+fHVuZGVmaW5lZCxcbiAgICB0cmFja0J5Rm46IFRyYWNrQnlGdW5jdGlvbjx1bmtub3duPiwgaW5kZXg6IG51bWJlciwgdmFsdWU6IFYpIHtcbiAgaWYgKCFhdHRhY2hQcmV2aW91c2x5RGV0YWNoZWQobGl2ZUNvbGxlY3Rpb24sIGRldGFjaGVkSXRlbXMsIGluZGV4LCB0cmFja0J5Rm4oaW5kZXgsIHZhbHVlKSkpIHtcbiAgICBjb25zdCBuZXdJdGVtID0gbGl2ZUNvbGxlY3Rpb24uY3JlYXRlKGluZGV4LCB2YWx1ZSk7XG4gICAgbGl2ZUNvbGxlY3Rpb24uYXR0YWNoKGluZGV4LCBuZXdJdGVtKTtcbiAgfSBlbHNlIHtcbiAgICBsaXZlQ29sbGVjdGlvbi51cGRhdGVWYWx1ZShpbmRleCwgdmFsdWUpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGluaXRMaXZlSXRlbXNJblRoZUZ1dHVyZTxUPihcbiAgICBsaXZlQ29sbGVjdGlvbjogTGl2ZUNvbGxlY3Rpb248dW5rbm93biwgdW5rbm93bj4sIHN0YXJ0OiBudW1iZXIsIGVuZDogbnVtYmVyLFxuICAgIHRyYWNrQnlGbjogVHJhY2tCeUZ1bmN0aW9uPHVua25vd24+KTogU2V0PHVua25vd24+IHtcbiAgY29uc3Qga2V5cyA9IG5ldyBTZXQoKTtcbiAgZm9yIChsZXQgaSA9IHN0YXJ0OyBpIDw9IGVuZDsgaSsrKSB7XG4gICAga2V5cy5hZGQodHJhY2tCeUZuKGksIGxpdmVDb2xsZWN0aW9uLmF0KGkpKSk7XG4gIH1cbiAgcmV0dXJuIGtleXM7XG59XG5cbmNsYXNzIE11bHRpTWFwPEssIFY+IHtcbiAgcHJpdmF0ZSBtYXAgPSBuZXcgTWFwPEssIEFycmF5PFY+PigpO1xuXG4gIGhhcyhrZXk6IEspOiBib29sZWFuIHtcbiAgICBjb25zdCBsaXN0T2ZLZXlzID0gdGhpcy5tYXAuZ2V0KGtleSk7XG4gICAgcmV0dXJuIGxpc3RPZktleXMgIT09IHVuZGVmaW5lZCAmJiBsaXN0T2ZLZXlzLmxlbmd0aCA+IDA7XG4gIH1cblxuICBkZWxldGUoa2V5OiBLKTogYm9vbGVhbiB7XG4gICAgY29uc3QgbGlzdE9mS2V5cyA9IHRoaXMubWFwLmdldChrZXkpO1xuICAgIGlmIChsaXN0T2ZLZXlzICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGxpc3RPZktleXMuc2hpZnQoKTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBnZXQoa2V5OiBLKTogVnx1bmRlZmluZWQge1xuICAgIGNvbnN0IGxpc3RPZktleXMgPSB0aGlzLm1hcC5nZXQoa2V5KTtcbiAgICByZXR1cm4gbGlzdE9mS2V5cyAhPT0gdW5kZWZpbmVkICYmIGxpc3RPZktleXMubGVuZ3RoID4gMCA/IGxpc3RPZktleXNbMF0gOiB1bmRlZmluZWQ7XG4gIH1cblxuICBzZXQoa2V5OiBLLCB2YWx1ZTogVik6IHZvaWQge1xuICAgIC8vIGlmIHZhbHVlIGlzIGFycmF5LCB0aGV5IHdlIGFsd2F5cyBzdG9yZSBpdCBhcyBbdmFsdWVdLlxuICAgIGlmICghdGhpcy5tYXAuaGFzKGtleSkpIHtcbiAgICAgIHRoaXMubWFwLnNldChrZXksIFt2YWx1ZV0pO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICAvLyBUSElOSzogdGhpcyBhbGxvd3MgZHVwbGljYXRlIHZhbHVlcywgYnV0IEkgZ3Vlc3MgdGhpcyBpcyBmaW5lP1xuICAgIC8vIElzIHRoZSBleGlzdGluZyBrZXkgYW4gYXJyYXkgb3Igbm90P1xuICAgIHRoaXMubWFwLmdldChrZXkpPy5wdXNoKHZhbHVlKTtcbiAgfVxuXG4gIGZvckVhY2goY2I6ICh2OiBWLCBrOiBLKSA9PiB2b2lkKSB7XG4gICAgZm9yIChjb25zdCBba2V5LCB2YWx1ZXNdIG9mIHRoaXMubWFwKSB7XG4gICAgICBmb3IgKGNvbnN0IHZhbHVlIG9mIHZhbHVlcykge1xuICAgICAgICBjYih2YWx1ZSwga2V5KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cbiJdfQ==