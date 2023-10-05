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
            const liveStartKey = liveCollection.key(liveStartIdx);
            const newStartValue = newCollection[liveStartIdx];
            const newStartKey = trackByFn(liveStartIdx, newStartValue);
            if (Object.is(liveStartKey, newStartKey)) {
                liveCollection.updateValue(liveStartIdx, newStartValue);
                liveStartIdx++;
                continue;
            }
            // compare from the end
            // TODO(perf): do _all_ the matching from the end
            const liveEndKey = liveCollection.key(liveEndIdx);
            const newEndItem = newCollection[newEndIdx];
            const newEndKey = trackByFn(newEndIdx, newEndItem);
            if (Object.is(liveEndKey, newEndKey)) {
                liveCollection.updateValue(liveEndIdx, newEndItem);
                liveEndIdx--;
                newEndIdx--;
                continue;
            }
            // Detect swap / moves:
            if (Object.is(newStartKey, liveEndKey) && Object.is(newEndKey, liveStartKey)) {
                // swap on both ends;
                liveCollection.swap(liveStartIdx, liveEndIdx);
                liveCollection.updateValue(liveStartIdx, newStartValue);
                liveCollection.updateValue(liveEndIdx, newEndItem);
                newEndIdx--;
                liveStartIdx++;
                liveEndIdx--;
                continue;
            }
            else if (Object.is(newStartKey, liveEndKey)) {
                // the new item is the same as the live item with the end pointer - this is a move forward
                // to an earlier index;
                liveCollection.move(liveEndIdx, liveStartIdx);
                liveCollection.updateValue(liveStartIdx, newStartValue);
                liveStartIdx++;
                continue;
            }
            // Fallback to the slow path: we need to learn more about the content of the live and new
            // collections.
            detachedItems ??= new MultiMap();
            liveKeysInTheFuture ??= initLiveItemsInTheFuture(liveCollection, liveStartIdx, liveEndIdx);
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
            const newValue = newIterationResult.value;
            const newKey = trackByFn(liveStartIdx, newValue);
            const liveKey = liveCollection.key(liveStartIdx);
            if (Object.is(liveKey, newKey)) {
                // found a match - move on
                liveCollection.updateValue(liveStartIdx, newValue);
                liveStartIdx++;
                newIterationResult = newCollectionIterator.next();
            }
            else {
                detachedItems ??= new MultiMap();
                liveKeysInTheFuture ??= initLiveItemsInTheFuture(liveCollection, liveStartIdx, liveEndIdx);
                // Check if I'm inserting a previously detached item: if so, attach it here
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
    detachedItems?.forEach(item => liveCollection.destroy(item));
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
function initLiveItemsInTheFuture(liveCollection, start, end) {
    const keys = new Set();
    for (let i = start; i <= end; i++) {
        keys.add(liveCollection.key(i));
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
            // THINK: pop from the end or shift from the front? "Correct" vs. "slow".
            listOfKeys.pop();
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGlzdF9yZWNvbmNpbGlhdGlvbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvbGlzdF9yZWNvbmNpbGlhdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFJSDs7OztHQUlHO0FBQ0gsTUFBTSxPQUFnQixjQUFjO0lBT2xDLE9BQU8sQ0FBQyxJQUFPO1FBQ2Isa0JBQWtCO0lBQ3BCLENBQUM7SUFDRCxXQUFXLENBQUMsS0FBYSxFQUFFLEtBQVE7UUFDakMsa0JBQWtCO0lBQ3BCLENBQUM7SUFFRCw0RkFBNEY7SUFDNUYsbUZBQW1GO0lBQ25GLGtCQUFrQjtJQUNsQixJQUFJLENBQUMsTUFBYyxFQUFFLE1BQWM7UUFDakMsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxNQUFNLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFDMUMsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxNQUFNLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFDeEMsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUNwQyxJQUFJLE1BQU0sR0FBRyxRQUFRLEdBQUcsQ0FBQyxFQUFFO1lBQ3pCLE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDeEMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFDL0IsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsU0FBUyxDQUFDLENBQUM7U0FDaEM7YUFBTTtZQUNMLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLE9BQU8sQ0FBQyxDQUFDO1NBQ2hDO0lBQ0gsQ0FBQztJQUNELElBQUksQ0FBQyxTQUFpQixFQUFFLE1BQWM7UUFDcEMsSUFBSSxDQUFDLE1BQU0s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QU0sS0FBSyxJQUFJLE1BQU0sRUFBRTtnQkFDMUIsRUFBRSxDQUFDLEtBQUssRUFBRSxHQUFHLENBQUMsQ0FBQzthQUNoQjtTQUNGO0lBQ0gsQ0FBQztDQUNGIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7VHJhY2tCeUZ1bmN0aW9ufSBmcm9tICcuLi9jaGFuZ2VfZGV0ZWN0aW9uJztcblxuLyoqXG4gKiBBIHR5cGUgcmVwcmVzZW50aW5nIHRoZSBsaXZlIGNvbGxlY3Rpb24gdG8gYmUgcmVjb25jaWxlZCB3aXRoIGFueSBuZXcgKGluY29taW5nKSBjb2xsZWN0aW9uLiBUaGlzXG4gKiBpcyBhbiBhZGFwdGVyIGNsYXNzIHRoYXQgbWFrZXMgaXQgcG9zc2libGUgdG8gd29yayB3aXRoIGRpZmZlcmVudCBpbnRlcm5hbCBkYXRhIHN0cnVjdHVyZXMsXG4gKiByZWdhcmRsZXNzIG9mIHRoZSBhY3R1YWwgdmFsdWVzIG9mIHRoZSBpbmNvbWluZyBjb2xsZWN0aW9uLlxuICovXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgTGl2ZUNvbGxlY3Rpb248VCwgVj4ge1xuICBhYnN0cmFjdCBnZXQgbGVuZ3RoKCk6IG51bWJlcjtcbiAgYWJzdHJhY3QgYXQoaW5kZXg6IG51bWJlcik6IFQ7XG4gIGFic3RyYWN0IGtleShpbmRleDogbnVtYmVyKTogdW5rbm93bjtcbiAgYWJzdHJhY3QgYXR0YWNoKGluZGV4OiBudW1iZXIsIGl0ZW06IFQpOiB2b2lkO1xuICBhYnN0cmFjdCBkZXRhY2goaW5kZXg6IG51bWJlcik6IFQ7XG4gIGFic3RyYWN0IGNyZWF0ZShpbmRleDogbnVtYmVyLCB2YWx1ZTogVik6IFQ7XG4gIGRlc3Ryb3koaXRlbTogVCk6IHZvaWQge1xuICAgIC8vIG5vb3AgYnkgZGVmYXVsdFxuICB9XG4gIHVwZGF0ZVZhbHVlKGluZGV4OiBudW1iZXIsIHZhbHVlOiBWKTogdm9pZCB7XG4gICAgLy8gbm9vcCBieSBkZWZhdWx0XG4gIH1cblxuICAvLyBvcGVyYXRpb25zIGJlbG93IGNvdWxkIGJlIGltcGxlbWVudGVkIG9uIHRvcCBvZiB0aGUgb3BlcmF0aW9ucyBkZWZpbmVkIHNvIGZhciwgYnV0IGhhdmluZ1xuICAvLyB0aGVtIGV4cGxpY2l0bHkgYWxsb3cgY2xlYXIgZXhwcmVzc2lvbiBvZiBpbnRlbnQgYW5kIHBvdGVudGlhbGx5IG1vcmUgcGVyZm9ybWFudFxuICAvLyBpbXBsZW1lbnRhdGlvbnNcbiAgc3dhcChpbmRleDE6IG51bWJlciwgaW5kZXgyOiBudW1iZXIpOiB2b2lkIHtcbiAgICBjb25zdCBzdGFydElkeCA9IE1hdGgubWluKGluZGV4MSwgaW5kZXgyKTtcbiAgICBjb25zdCBlbmRJZHggPSBNYXRoLm1heChpbmRleDEsIGluZGV4Mik7XG4gICAgY29uc3QgZW5kSXRlbSA9IHRoaXMuZGV0YWNoKGVuZElkeCk7XG4gICAgaWYgKGVuZElkeCAtIHN0YXJ0SWR4ID4gMSkge1xuICAgICAgY29uc3Qgc3RhcnRJdGVtID0gdGhpcy5kZXRhY2goc3RhcnRJZHgpO1xuICAgICAgdGhpcy5hdHRhY2goc3RhcnRJZHgsIGVuZEl0ZW0pO1xuICAgICAgdGhpcy5hdHRhY2goZW5kSWR4LCBzdGFydEl0ZW0pO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmF0dGFjaChzdGFydElkeCwgZW5kSXRlbSk7XG4gICAgfVxuICB9XG4gIG1vdmUocHJldkluZGV4OiBudW1iZXIsIG5ld0lkeDogbnVtYmVyKTogdm9pZCB7XG4gICAgdGhpcy5hdHRhY2gobmV3SWR4LCB0aGlzLmRldGFjaChwcmV2SW5kZXgpKTtcbiAgfVxufVxuXG4vKipcbiAqIFRoZSBsaXZlIGNvbGxlY3Rpb24gcmVjb25jaWxpYXRpb24gYWxnb3JpdGhtIHRoYXQgcGVyZm9ybSB2YXJpb3VzIGluLXBsYWNlIG9wZXJhdGlvbnMsIHNvIGl0XG4gKiByZWZsZWN0cyB0aGUgY29udGVudCBvZiB0aGUgbmV3IChpbmNvbWluZykgY29sbGVjdGlvbi5cbiAqXG4gKiBUaGUgcmVjb25jaWxpYXRpb24gYWxnb3JpdGhtIGhhcyAyIGNvZGUgcGF0aHM6XG4gKiAtIFwiZmFzdFwiIHBhdGggdGhhdCBkb24ndCByZXF1aXJlIGFueSBtZW1vcnkgYWxsb2NhdGlvbjtcbiAqIC0gXCJzbG93XCIgcGF0aCB0aGF0IHJlcXVpcmVzIGFkZGl0aW9uYWwgbWVtb3J5IGFsbG9jYXRpb24gZm9yIGludGVybWVkaWF0ZSBkYXRhIHN0cnVjdHVyZXMgdXNlZCB0b1xuICogY29sbGVjdCBhZGRpdGlvbmFsIGluZm9ybWF0aW9uIGFib3V0IHRoZSBsaXZlIGNvbGxlY3Rpb24uXG4gKiBJdCBtaWdodCBoYXBwZW4gdGhhdCB0aGUgYWxnb3JpdGhtIHN3aXRjaGVzIGJldHdlZW4gdGhlIHR3byBtb2RlcyBpbiBxdWVzdGlvbiBpbiBhIHNpbmdsZVxuICogcmVjb25jaWxpYXRpb24gcGF0aCAtIGdlbmVyYWxseSBpdCB0cmllcyB0byBzdGF5IG9uIHRoZSBcImZhc3RcIiBwYXRoIGFzIG11Y2ggYXMgcG9zc2libGUuXG4gKlxuICogVGhlIG92ZXJhbGwgY29tcGxleGl0eSBvZiB0aGUgYWxnb3JpdGhtIGlzIE8obiArIG0pIGZvciBzcGVlZCBhbmQgTyhuKSBmb3IgbWVtb3J5ICh3aGVyZSBuIGlzIHRoZVxuICogbGVuZ3RoIG9mIHRoZSBsaXZlIGNvbGxlY3Rpb24gYW5kIG0gaXMgdGhlIGxlbmd0aCBvZiB0aGUgaW5jb21pbmcgY29sbGVjdGlvbikuIEdpdmVuIHRoZSBwcm9ibGVtXG4gKiBhdCBoYW5kIHRoZSBjb21wbGV4aXR5IC8gcGVyZm9ybWFuY2UgY29uc3RyYWludHMgbWFrZXMgaXQgaW1wb3NzaWJsZSB0byBwZXJmb3JtIHRoZSBhYnNvbHV0ZVxuICogbWluaW11bSBvZiBvcGVyYXRpb24gdG8gcmVjb25jaWxlIHRoZSAyIGNvbGxlY3Rpb25zLiBUaGUgYWxnb3JpdGhtIG1ha2VzIGRpZmZlcmVudCB0cmFkZW9mZnMgdG9cbiAqIHN0YXkgd2l0aGluIHJlYXNvbmFibGUgcGVyZm9ybWFuY2UgYm91bmRzIGFuZCBtYXkgYXBwbHkgc3ViLW9wdGltYWwgbnVtYmVyIG9mIG9wZXJhdGlvbnMgaW5cbiAqIGNlcnRhaW4gc2l0dWF0aW9ucy5cbiAqXG4gKiBAcGFyYW0gbGl2ZUNvbGxlY3Rpb24gdGhlIGN1cnJlbnQsIGxpdmUgY29sbGVjdGlvbjtcbiAqIEBwYXJhbSBuZXdDb2xsZWN0aW9uIHRoZSBuZXcsIGluY29taW5nIGNvbGxlY3Rpb247XG4gKiBAcGFyYW0gdHJhY2tCeUZuIGtleSBnZW5lcmF0aW9uIGZ1bmN0aW9uIHRoYXQgZGV0ZXJtaW5lcyBlcXVhbGl0eSBiZXR3ZWVuIGl0ZW1zIGluIHRoZSBsaWZlIGFuZFxuICogICAgIGluY29taW5nIGNvbGxlY3Rpb247XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZWNvbmNpbGU8VCwgVj4oXG4gICAgbGl2ZUNvbGxlY3Rpb246IExpdmVDb2xsZWN0aW9uPFQsIFY+LCBuZXdDb2xsZWN0aW9uOiBJdGVyYWJsZTxWPnx1bmRlZmluZWR8bnVsbCxcbiAgICB0cmFja0J5Rm46IFRyYWNrQnlGdW5jdGlvbjxWPik6IHZvaWQge1xuICBsZXQgZGV0YWNoZWRJdGVtczogTXVsdGlNYXA8dW5rbm93biwgVD58dW5kZWZpbmVkID0gdW5kZWZpbmVkO1xuICBsZXQgbGl2ZUtleXNJblRoZUZ1dHVyZTogU2V0PHVua25vd24+fHVuZGVmaW5lZCA9IHVuZGVmaW5lZDtcblxuICBsZXQgbGl2ZVN0YXJ0SWR4ID0gMDtcbiAgbGV0IGxpdmVFbmRJZHggPSBsaXZlQ29sbGVjdGlvbi5sZW5ndGggLSAxO1xuXG4gIGlmIChBcnJheS5pc0FycmF5KG5ld0NvbGxlY3Rpb24pKSB7XG4gICAgbGV0IG5ld0VuZElkeCA9IG5ld0NvbGxlY3Rpb24ubGVuZ3RoIC0gMTtcblxuICAgIHdoaWxlIChsaXZlU3RhcnRJZHggPD0gbGl2ZUVuZElkeCAmJiBsaXZlU3RhcnRJZHggPD0gbmV3RW5kSWR4KSB7XG4gICAgICAvLyBjb21wYXJlIGZyb20gdGhlIGJlZ2lubmluZ1xuICAgICAgY29uc3QgbGl2ZVN0YXJ0S2V5ID0gbGl2ZUNvbGxlY3Rpb24ua2V5KGxpdmVTdGFydElkeCk7XG4gICAgICBjb25zdCBuZXdTdGFydFZhbHVlID0gbmV3Q29sbGVjdGlvbltsaXZlU3RhcnRJZHhdO1xuICAgICAgY29uc3QgbmV3U3RhcnRLZXkgPSB0cmFja0J5Rm4obGl2ZVN0YXJ0SWR4LCBuZXdTdGFydFZhbHVlKTtcbiAgICAgIGlmIChPYmplY3QuaXMobGl2ZVN0YXJ0S2V5LCBuZXdTdGFydEtleSkpIHtcbiAgICAgICAgbGl2ZUNvbGxlY3Rpb24udXBkYXRlVmFsdWUobGl2ZVN0YXJ0SWR4LCBuZXdTdGFydFZhbHVlKTtcbiAgICAgICAgbGl2ZVN0YXJ0SWR4Kys7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICAvLyBjb21wYXJlIGZyb20gdGhlIGVuZFxuICAgICAgLy8gVE9ETyhwZXJmKTogZG8gX2FsbF8gdGhlIG1hdGNoaW5nIGZyb20gdGhlIGVuZFxuICAgICAgY29uc3QgbGl2ZUVuZEtleSA9IGxpdmVDb2xsZWN0aW9uLmtleShsaXZlRW5kSWR4KTtcbiAgICAgIGNvbnN0IG5ld0VuZEl0ZW0gPSBuZXdDb2xsZWN0aW9uW25ld0VuZElkeF07XG4gICAgICBjb25zdCBuZXdFbmRLZXkgPSB0cmFja0J5Rm4obmV3RW5kSWR4LCBuZXdFbmRJdGVtKTtcbiAgICAgIGlmIChPYmplY3QuaXMobGl2ZUVuZEtleSwgbmV3RW5kS2V5KSkge1xuICAgICAgICBsaXZlQ29sbGVjdGlvbi51cGRhdGVWYWx1ZShsaXZlRW5kSWR4LCBuZXdFbmRJdGVtKTtcbiAgICAgICAgbGl2ZUVuZElkeC0tO1xuICAgICAgICBuZXdFbmRJZHgtLTtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIC8vIERldGVjdCBzd2FwIC8gbW92ZXM6XG4gICAgICBpZiAoT2JqZWN0LmlzKG5ld1N0YXJ0S2V5LCBsaXZlRW5kS2V5KSAmJiBPYmplY3QuaXMobmV3RW5kS2V5LCBsaXZlU3RhcnRLZXkpKSB7XG4gICAgICAgIC8vIHN3YXAgb24gYm90aCBlbmRzO1xuICAgICAgICBsaXZlQ29sbGVjdGlvbi5zd2FwKGxpdmVTdGFydElkeCwgbGl2ZUVuZElkeCk7XG4gICAgICAgIGxpdmVDb2xsZWN0aW9uLnVwZGF0ZVZhbHVlKGxpdmVTdGFydElkeCwgbmV3U3RhcnRWYWx1ZSk7XG4gICAgICAgIGxpdmVDb2xsZWN0aW9uLnVwZGF0ZVZhbHVlKGxpdmVFbmRJZHgsIG5ld0VuZEl0ZW0pO1xuICAgICAgICBuZXdFbmRJZHgtLTtcbiAgICAgICAgbGl2ZVN0YXJ0SWR4Kys7XG4gICAgICAgIGxpdmVFbmRJZHgtLTtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9IGVsc2UgaWYgKE9iamVjdC5pcyhuZXdTdGFydEtleSwgbGl2ZUVuZEtleSkpIHtcbiAgICAgICAgLy8gdGhlIG5ldyBpdGVtIGlzIHRoZSBzYW1lIGFzIHRoZSBsaXZlIGl0ZW0gd2l0aCB0aGUgZW5kIHBvaW50ZXIgLSB0aGlzIGlzIGEgbW92ZSBmb3J3YXJkXG4gICAgICAgIC8vIHRvIGFuIGVhcmxpZXIgaW5kZXg7XG4gICAgICAgIGxpdmVDb2xsZWN0aW9uLm1vdmUobGl2ZUVuZElkeCwgbGl2ZVN0YXJ0SWR4KTtcbiAgICAgICAgbGl2ZUNvbGxlY3Rpb24udXBkYXRlVmFsdWUobGl2ZVN0YXJ0SWR4LCBuZXdTdGFydFZhbHVlKTtcbiAgICAgICAgbGl2ZVN0YXJ0SWR4Kys7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICAvLyBGYWxsYmFjayB0byB0aGUgc2xvdyBwYXRoOiB3ZSBuZWVkIHRvIGxlYXJuIG1vcmUgYWJvdXQgdGhlIGNvbnRlbnQgb2YgdGhlIGxpdmUgYW5kIG5ld1xuICAgICAgLy8gY29sbGVjdGlvbnMuXG4gICAgICBkZXRhY2hlZEl0ZW1zID8/PSBuZXcgTXVsdGlNYXAoKTtcbiAgICAgIGxpdmVLZXlzSW5UaGVGdXR1cmUgPz89IGluaXRMaXZlSXRlbXNJblRoZUZ1dHVyZShsaXZlQ29sbGVjdGlvbiwgbGl2ZVN0YXJ0SWR4LCBsaXZlRW5kSWR4KTtcblxuICAgICAgLy8gQ2hlY2sgaWYgSSdtIGluc2VydGluZyBhIHByZXZpb3VzbHkgZGV0YWNoZWQgaXRlbTogaWYgc28sIGF0dGFjaCBpdCBoZXJlXG4gICAgICBpZiAoYXR0YWNoUHJldmlvdXNseURldGFjaGVkKGxpdmVDb2xsZWN0aW9uLCBkZXRhY2hlZEl0ZW1zLCBsaXZlU3RhcnRJZHgsIG5ld1N0YXJ0S2V5KSkge1xuICAgICAgICBsaXZlQ29sbGVjdGlvbi51cGRhdGVWYWx1ZShsaXZlU3RhcnRJZHgsIG5ld1N0YXJ0VmFsdWUpO1xuICAgICAgICBsaXZlU3RhcnRJZHgrKztcbiAgICAgICAgbGl2ZUVuZElkeCsrO1xuICAgICAgfSBlbHNlIGlmICghbGl2ZUtleXNJblRoZUZ1dHVyZS5oYXMobmV3U3RhcnRLZXkpKSB7XG4gICAgICAgIC8vIENoZWNrIGlmIHdlIHNlZW4gYSBuZXcgaXRlbSB0aGF0IGRvZXNuJ3QgZXhpc3QgaW4gdGhlIG9sZCBjb2xsZWN0aW9uIGFuZCBtdXN0IGJlIElOU0VSVEVEXG4gICAgICAgIGNvbnN0IG5ld0l0ZW0gPSBsaXZlQ29sbGVjdGlvbi5jcmVhdGUobGl2ZVN0YXJ0SWR4LCBuZXdDb2xsZWN0aW9uW2xpdmVTdGFydElkeF0pO1xuICAgICAgICBsaXZlQ29sbGVjdGlvbi5hdHRhY2gobGl2ZVN0YXJ0SWR4LCBuZXdJdGVtKTtcbiAgICAgICAgbGl2ZVN0YXJ0SWR4Kys7XG4gICAgICAgIGxpdmVFbmRJZHgrKztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIFdlIGtub3cgdGhhdCB0aGUgbmV3IGl0ZW0gZXhpc3RzIGxhdGVyIG9uIGluIG9sZCBjb2xsZWN0aW9uIGJ1dCB3ZSBkb24ndCBrbm93IGl0cyBpbmRleFxuICAgICAgICAvLyBhbmQgYXMgdGhlIGNvbnNlcXVlbmNlIGNhbid0IG1vdmUgaXQgKGRvbid0IGtub3cgd2hlcmUgdG8gZmluZCBpdCkuIERldGFjaCB0aGUgb2xkIGl0ZW0sXG4gICAgICAgIC8vIGhvcGluZyB0aGF0IGl0IHVubG9ja3MgdGhlIGZhc3QgcGF0aCBhZ2Fpbi5cbiAgICAgICAgZGV0YWNoZWRJdGVtcy5zZXQobGl2ZVN0YXJ0S2V5LCBsaXZlQ29sbGVjdGlvbi5kZXRhY2gobGl2ZVN0YXJ0SWR4KSk7XG4gICAgICAgIGxpdmVFbmRJZHgtLTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBGaW5hbCBjbGVhbnVwIHN0ZXBzOlxuICAgIC8vIC0gbW9yZSBpdGVtcyBpbiB0aGUgbmV3IGNvbGxlY3Rpb24gPT4gaW5zZXJ0XG4gICAgd2hpbGUgKGxpdmVTdGFydElkeCA8PSBuZXdFbmRJZHgpIHtcbiAgICAgIGNyZWF0ZU9yQXR0YWNoKFxuICAgICAgICAgIGxpdmVDb2xsZWN0aW9uLCBkZXRhY2hlZEl0ZW1zLCB0cmFja0J5Rm4sIGxpdmVTdGFydElkeCwgbmV3Q29sbGVjdGlvbltsaXZlU3RhcnRJZHhdKTtcbiAgICAgIGxpdmVTdGFydElkeCsrO1xuICAgIH1cblxuICB9IGVsc2UgaWYgKG5ld0NvbGxlY3Rpb24gIT0gbnVsbCkge1xuICAgIC8vIGl0ZXJhYmxlIC0gaW1tZWRpYXRlbHkgZmFsbGJhY2sgdG8gdGhlIHNsb3cgcGF0aFxuICAgIGNvbnN0IG5ld0NvbGxlY3Rpb25JdGVyYXRvciA9IG5ld0NvbGxlY3Rpb25bU3ltYm9sLml0ZXJhdG9yXSgpO1xuICAgIGxldCBuZXdJdGVyYXRpb25SZXN1bHQgPSBuZXdDb2xsZWN0aW9uSXRlcmF0b3IubmV4dCgpO1xuICAgIHdoaWxlICghbmV3SXRlcmF0aW9uUmVzdWx0LmRvbmUgJiYgbGl2ZVN0YXJ0SWR4IDw9IGxpdmVFbmRJZHgpIHtcbiAgICAgIGNvbnN0IG5ld1ZhbHVlID0gbmV3SXRlcmF0aW9uUmVzdWx0LnZhbHVlO1xuICAgICAgY29uc3QgbmV3S2V5ID0gdHJhY2tCeUZuKGxpdmVTdGFydElkeCwgbmV3VmFsdWUpO1xuICAgICAgY29uc3QgbGl2ZUtleSA9IGxpdmVDb2xsZWN0aW9uLmtleShsaXZlU3RhcnRJZHgpO1xuICAgICAgaWYgKE9iamVjdC5pcyhsaXZlS2V5LCBuZXdLZXkpKSB7XG4gICAgICAgIC8vIGZvdW5kIGEgbWF0Y2ggLSBtb3ZlIG9uXG4gICAgICAgIGxpdmVDb2xsZWN0aW9uLnVwZGF0ZVZhbHVlKGxpdmVTdGFydElkeCwgbmV3VmFsdWUpO1xuICAgICAgICBsaXZlU3RhcnRJZHgrKztcbiAgICAgICAgbmV3SXRlcmF0aW9uUmVzdWx0ID0gbmV3Q29sbGVjdGlvbkl0ZXJhdG9yLm5leHQoKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGRldGFjaGVkSXRlbXMgPz89IG5ldyBNdWx0aU1hcCgpO1xuICAgICAgICBsaXZlS2V5c0luVGhlRnV0dXJlID8/PSBpbml0TGl2ZUl0ZW1zSW5UaGVGdXR1cmUobGl2ZUNvbGxlY3Rpb24sIGxpdmVTdGFydElkeCwgbGl2ZUVuZElkeCk7XG5cbiAgICAgICAgLy8gQ2hlY2sgaWYgSSdtIGluc2VydGluZyBhIHByZXZpb3VzbHkgZGV0YWNoZWQgaXRlbTogaWYgc28sIGF0dGFjaCBpdCBoZXJlXG4gICAgICAgIGlmIChhdHRhY2hQcmV2aW91c2x5RGV0YWNoZWQobGl2ZUNvbGxlY3Rpb24sIGRldGFjaGVkSXRlbXMsIGxpdmVTdGFydElkeCwgbmV3S2V5KSkge1xuICAgICAgICAgIGxpdmVDb2xsZWN0aW9uLnVwZGF0ZVZhbHVlKGxpdmVTdGFydElkeCwgbmV3VmFsdWUpO1xuICAgICAgICAgIGxpdmVTdGFydElkeCsrO1xuICAgICAgICAgIGxpdmVFbmRJZHgrKztcbiAgICAgICAgICBuZXdJdGVyYXRpb25SZXN1bHQgPSBuZXdDb2xsZWN0aW9uSXRlcmF0b3IubmV4dCgpO1xuICAgICAgICB9IGVsc2UgaWYgKCFsaXZlS2V5c0luVGhlRnV0dXJlLmhhcyhuZXdLZXkpKSB7XG4gICAgICAgICAgbGl2ZUNvbGxlY3Rpb24uYXR0YWNoKGxpdmVTdGFydElkeCwgbGl2ZUNvbGxlY3Rpb24uY3JlYXRlKGxpdmVTdGFydElkeCwgbmV3VmFsdWUpKTtcbiAgICAgICAgICBsaXZlU3RhcnRJZHgrKztcbiAgICAgICAgICBsaXZlRW5kSWR4Kys7XG4gICAgICAgICAgbmV3SXRlcmF0aW9uUmVzdWx0ID0gbmV3Q29sbGVjdGlvbkl0ZXJhdG9yLm5leHQoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBpdCBpcyBhIG1vdmUgZm9yd2FyZCAtIGRldGFjaCB0aGUgY3VycmVudCBpdGVtIHdpdGhvdXQgYWR2YW5jaW5nIGluIGNvbGxlY3Rpb25zXG4gICAgICAgICAgZGV0YWNoZWRJdGVtcy5zZXQobGl2ZUtleSwgbGl2ZUNvbGxlY3Rpb24uZGV0YWNoKGxpdmVTdGFydElkeCkpO1xuICAgICAgICAgIGxpdmVFbmRJZHgtLTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIC8vIHRoaXMgaXMgYSBuZXcgaXRlbSBhcyB3ZSBydW4gb3V0IG9mIHRoZSBpdGVtcyBpbiB0aGUgb2xkIGNvbGxlY3Rpb24gLSBjcmVhdGUgb3IgYXR0YWNoIGFcbiAgICAvLyBwcmV2aW91c2x5IGRldGFjaGVkIG9uZVxuICAgIHdoaWxlICghbmV3SXRlcmF0aW9uUmVzdWx0LmRvbmUpIHtcbiAgICAgIGNyZWF0ZU9yQXR0YWNoKFxuICAgICAgICAgIGxpdmVDb2xsZWN0aW9uLCBkZXRhY2hlZEl0ZW1zLCB0cmFja0J5Rm4sIGxpdmVDb2xsZWN0aW9uLmxlbmd0aCxcbiAgICAgICAgICBuZXdJdGVyYXRpb25SZXN1bHQudmFsdWUpO1xuICAgICAgbmV3SXRlcmF0aW9uUmVzdWx0ID0gbmV3Q29sbGVjdGlvbkl0ZXJhdG9yLm5leHQoKTtcbiAgICB9XG4gIH1cblxuICAvLyBDbGVhbnVwcyBjb21tb24gdG8gdGhlIGFycmF5IGFuZCBpdGVyYWJsZTpcbiAgLy8gLSBtb3JlIGl0ZW1zIGluIHRoZSBsaXZlIGNvbGxlY3Rpb24gPT4gZGVsZXRlIHN0YXJ0aW5nIGZyb20gdGhlIGVuZDtcbiAgd2hpbGUgKGxpdmVTdGFydElkeCA8PSBsaXZlRW5kSWR4KSB7XG4gICAgbGl2ZUNvbGxlY3Rpb24uZGVzdHJveShsaXZlQ29sbGVjdGlvbi5kZXRhY2gobGl2ZUVuZElkeC0tKSk7XG4gIH1cblxuICAvLyAtIGRlc3Ryb3kgaXRlbXMgdGhhdCB3ZXJlIGRldGFjaGVkIGJ1dCBuZXZlciBhdHRhY2hlZCBhZ2Fpbi5cbiAgZGV0YWNoZWRJdGVtcz8uZm9yRWFjaChpdGVtID0+IGxpdmVDb2xsZWN0aW9uLmRlc3Ryb3koaXRlbSkpO1xufVxuXG5mdW5jdGlvbiBhdHRhY2hQcmV2aW91c2x5RGV0YWNoZWQ8VCwgVj4oXG4gICAgcHJldkNvbGxlY3Rpb246IExpdmVDb2xsZWN0aW9uPFQsIFY+LCBkZXRhY2hlZEl0ZW1zOiBNdWx0aU1hcDx1bmtub3duLCBUPnx1bmRlZmluZWQsXG4gICAgaW5kZXg6IG51bWJlciwga2V5OiB1bmtub3duKTogYm9vbGVhbiB7XG4gIGlmIChkZXRhY2hlZEl0ZW1zICE9PSB1bmRlZmluZWQgJiYgZGV0YWNoZWRJdGVtcy5oYXMoa2V5KSkge1xuICAgIHByZXZDb2xsZWN0aW9uLmF0dGFjaChpbmRleCwgZGV0YWNoZWRJdGVtcy5nZXQoa2V5KSEpO1xuICAgIGRldGFjaGVkSXRlbXMuZGVsZXRlKGtleSk7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG5mdW5jdGlvbiBjcmVhdGVPckF0dGFjaDxULCBWPihcbiAgICBsaXZlQ29sbGVjdGlvbjogTGl2ZUNvbGxlY3Rpb248VCwgVj4sIGRldGFjaGVkSXRlbXM6IE11bHRpTWFwPHVua25vd24sIFQ+fHVuZGVmaW5lZCxcbiAgICB0cmFja0J5Rm46IFRyYWNrQnlGdW5jdGlvbjx1bmtub3duPiwgaW5kZXg6IG51bWJlciwgdmFsdWU6IFYpIHtcbiAgaWYgKCFhdHRhY2hQcmV2aW91c2x5RGV0YWNoZWQobGl2ZUNvbGxlY3Rpb24sIGRldGFjaGVkSXRlbXMsIGluZGV4LCB0cmFja0J5Rm4oaW5kZXgsIHZhbHVlKSkpIHtcbiAgICBjb25zdCBuZXdJdGVtID0gbGl2ZUNvbGxlY3Rpb24uY3JlYXRlKGluZGV4LCB2YWx1ZSk7XG4gICAgbGl2ZUNvbGxlY3Rpb24uYXR0YWNoKGluZGV4LCBuZXdJdGVtKTtcbiAgfSBlbHNlIHtcbiAgICBsaXZlQ29sbGVjdGlvbi51cGRhdGVWYWx1ZShpbmRleCwgdmFsdWUpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGluaXRMaXZlSXRlbXNJblRoZUZ1dHVyZTxUPihcbiAgICBsaXZlQ29sbGVjdGlvbjogTGl2ZUNvbGxlY3Rpb248dW5rbm93biwgdW5rbm93bj4sIHN0YXJ0OiBudW1iZXIsIGVuZDogbnVtYmVyKTogU2V0PHVua25vd24+IHtcbiAgY29uc3Qga2V5cyA9IG5ldyBTZXQoKTtcbiAgZm9yIChsZXQgaSA9IHN0YXJ0OyBpIDw9IGVuZDsgaSsrKSB7XG4gICAga2V5cy5hZGQobGl2ZUNvbGxlY3Rpb24ua2V5KGkpKTtcbiAgfVxuICByZXR1cm4ga2V5cztcbn1cblxuY2xhc3MgTXVsdGlNYXA8SywgVj4ge1xuICBwcml2YXRlIG1hcCA9IG5ldyBNYXA8SywgQXJyYXk8Vj4+KCk7XG5cbiAgaGFzKGtleTogSyk6IGJvb2xlYW4ge1xuICAgIGNvbnN0IGxpc3RPZktleXMgPSB0aGlzLm1hcC5nZXQoa2V5KTtcbiAgICByZXR1cm4gbGlzdE9mS2V5cyAhPT0gdW5kZWZpbmVkICYmIGxpc3RPZktleXMubGVuZ3RoID4gMDtcbiAgfVxuXG4gIGRlbGV0ZShrZXk6IEspOiBib29sZWFuIHtcbiAgICBjb25zdCBsaXN0T2ZLZXlzID0gdGhpcy5tYXAuZ2V0KGtleSk7XG4gICAgaWYgKGxpc3RPZktleXMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgLy8gVEhJTks6IHBvcCBmcm9tIHRoZSBlbmQgb3Igc2hpZnQgZnJvbSB0aGUgZnJvbnQ/IFwiQ29ycmVjdFwiIHZzLiBcInNsb3dcIi5cbiAgICAgIGxpc3RPZktleXMucG9wKCk7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgZ2V0KGtleTogSyk6IFZ8dW5kZWZpbmVkIHtcbiAgICBjb25zdCBsaXN0T2ZLZXlzID0gdGhpcy5tYXAuZ2V0KGtleSk7XG4gICAgcmV0dXJuIGxpc3RPZktleXMgIT09IHVuZGVmaW5lZCAmJiBsaXN0T2ZLZXlzLmxlbmd0aCA+IDAgPyBsaXN0T2ZLZXlzWzBdIDogdW5kZWZpbmVkO1xuICB9XG5cbiAgc2V0KGtleTogSywgdmFsdWU6IFYpOiB2b2lkIHtcbiAgICAvLyBpZiB2YWx1ZSBpcyBhcnJheSwgdGhleSB3ZSBhbHdheXMgc3RvcmUgaXQgYXMgW3ZhbHVlXS5cbiAgICBpZiAoIXRoaXMubWFwLmhhcyhrZXkpKSB7XG4gICAgICB0aGlzLm1hcC5zZXQoa2V5LCBbdmFsdWVdKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgLy8gVEhJTks6IHRoaXMgYWxsb3dzIGR1cGxpY2F0ZSB2YWx1ZXMsIGJ1dCBJIGd1ZXNzIHRoaXMgaXMgZmluZT9cbiAgICAvLyBJcyB0aGUgZXhpc3Rpbmcga2V5IGFuIGFycmF5IG9yIG5vdD9cbiAgICB0aGlzLm1hcC5nZXQoa2V5KT8ucHVzaCh2YWx1ZSk7XG4gIH1cblxuICBmb3JFYWNoKGNiOiAodjogViwgazogSykgPT4gdm9pZCkge1xuICAgIGZvciAoY29uc3QgW2tleSwgdmFsdWVzXSBvZiB0aGlzLm1hcCkge1xuICAgICAgZm9yIChjb25zdCB2YWx1ZSBvZiB2YWx1ZXMpIHtcbiAgICAgICAgY2IodmFsdWUsIGtleSk7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG4iXX0=