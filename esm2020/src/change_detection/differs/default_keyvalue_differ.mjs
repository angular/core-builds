/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { RuntimeError } from '../../errors';
import { isJsObject } from '../../util/iterable';
import { stringify } from '../../util/stringify';
export class DefaultKeyValueDifferFactory {
    constructor() { }
    supports(obj) {
        return obj instanceof Map || isJsObject(obj);
    }
    create() {
        return new DefaultKeyValueDiffer();
    }
}
export class DefaultKeyValueDiffer {
    constructor() {
        this._records = new Map();
        this._mapHead = null;
        // _appendAfter is used in the check loop
        this._appendAfter = null;
        this._previousMapHead = null;
        this._changesHead = null;
        this._changesTail = null;
        this._additionsHead = null;
        this._additionsTail = null;
        this._removalsHead = null;
        this._removalsTail = null;
    }
    get isDirty() {
        return this._additionsHead !== null || this._changesHead !== null ||
            this._removalsHead !== null;
    }
    forEachItem(fn) {
        let record;
        for (record = this._mapHead; record !== null; record = record._next) {
            fn(record);
        }
    }
    forEachPreviousItem(fn) {
        let record;
        for (record = this._previousMapHead; record !== null; record = record._nextPrevious) {
            fn(record);
        }
    }
    forEachChangedItem(fn) {
        let record;
        for (record = this._changesHead; record !== null; record = record._nextChanged) {
            fn(record);
        }
    }
    forEachAddedItem(fn) {
        let record;
        for (record = this._additionsHead; record !== null; record = record._nextAdded) {
            fn(record);
        }
    }
    forEachRemovedItem(fn) {
        let record;
        for (record = this._removalsHead; record !== null; record = record._nextRemoved) {
            fn(record);
        }
    }
    diff(map) {
        if (!map) {
            map = new Map();
        }
        else if (!(map instanceof Map || isJsObject(map))) {
            const errorMessage = (typeof ngDevMode === 'undefined' || ngDevMode) ?
                `Error trying to diff '${stringify(map)}'. Only maps and objects are allowed` :
                '';
            throw new RuntimeError(900 /* RuntimeErrorCode.INVALID_DIFFER_INPUT */, errorMessage);
        }
        return this.check(map) ? this : null;
    }
    onDestroy() { }
    /**
     * Check the current state of the map vs the previous.
     * The algorithm is optimised for when the keys do no change.
     */
    check(map) {
        this._reset();
        let insertBefore = this._mapHead;
        this._appendAfter = null;
        this._forEach(map, (value, key) => {
            if (insertBefore && insertBefore.key === key) {
                this._maybeAddToChanges(insertBefore, value);
                this._appendAfter = insertBefore;
                insertBefore = insertBefore._next;
            }
            else {
                const record = this._getOrCreateRecordForKey(key, value);
                insertBefore = this._insertBeforeOrAppend(insertBefore, record);
            }
        });
        // Items remaining at the end of the list have been deleted
        if (insertBefore) {
            if (insertBefore._prev) {
                insertBefore._prev._next = null;
            }
            this._removalsHead = insertBefore;
            for (let record = insertBefore; record !== null; record = record._nextRemoved) {
                if (record === this._mapHead) {
                    this._mapHead = null;
                }
                this._records.delete(record.key);
                record._nextRemoved = record._next;
                record.previousValue = record.currentValue;
                record.currentValue = null;
                record._prev = null;
                record._next = null;
            }
        }
        // Make sure tails have no next records from previous runs
        if (this._changesTail)
            this._changesTail._nextChanged = null;
        if (this._additionsTail)
            this._additionsTail._nextAdded = null;
        return this.isDirty;
    }
    /**
     * Inserts a record before `before` or append at the end of the list when `before` is null.
     *
     * Notes:
     * - This method appends at `this._appendAfter`,
     * - This method updates `this._appendAfter`,
     * - The return value is the new value for the insertion pointer.
     */
    _insertBeforeOrAppend(before, record) {
        if (before) {
            const prev = before._prev;
            record._next = before;
            record._prev = prev;
            before._prev = record;
            if (prev) {
                prev._next = record;
            }
            if (before === this._mapHead) {
                this._mapHead = record;
            }
            this._appendAfter = before;
            return before;
        }
        if (this._appendAfter) {
            this._appendAfter._next = record;
            record._prev = this._appendAfter;
        }
        else {
            this._mapHead = record;
        }
        this._appendAfter = record;
        return null;
    }
    _getOrCreateRecordForKey(key, value) {
        if (this._records.has(key)) {
            const record = this._records.get(key);
            this._maybeAddToChanges(record, value);
            const prev = record._prev;
            const next = record._next;
            if (prev) {
                prev._next = next;
            }
            if (next) {
                next._prev = prev;
            }
            record._next = null;
            record._prev = null;
            return record;
        }
        const record = new KeyValueChangeRecord_(key);
        this._records.set(key, record);
        record.currentValue = value;
        this._addToAdditions(record);
        return record;
    }
    /** @internal */
    _reset() {
        if (this.isDirty) {
            let record;
            // let `_previousMapHead` contain the state of the map before the changes
            this._previousMapHead = this._mapHead;
            for (record = this._previousMapHead; record !== null; record = record._next) {
                record._nextPrevious = record._next;
            }
            // Update `record.previousValue` with the value of the item before the changes
            // We need to update all changed items (that's those which have been added and changed)
            for (record = this._changesHead; record !== null; record = record._nextChanged) {
                record.previousValue = record.currentValue;
            }
            for (record = this._additionsHead; record != null; record = record._nextAdded) {
                record.previousValue = record.currentValue;
            }
            this._changesHead = this._changesTail = null;
            this._additionsHead = this._additionsTail = null;
            this._removalsHead = null;
        }
    }
    // Add the record or a given key to the list of changes only when the value has actually changed
    _maybeAddToChanges(record, newValue) {
        if (!Object.is(newValue, record.currentValue)) {
            record.previousValue = record.currentValue;
            record.currentValue = newValue;
            this._addToChanges(record);
        }
    }
    _addToAdditions(record) {
        if (this._additionsHead === null) {
            this._additionsHead = this._additionsTail = record;
        }
        else {
            this._additionsTail._nextAdded = record;
            this._additionsTail = record;
        }
    }
    _addToChanges(record) {
        if (this._changesHead === null) {
            this._changesHead = this._changesTail = record;
        }
        else {
            this._changesTail._nextChanged = record;
            this._changesTail = record;
        }
    }
    /** @internal */
    _forEach(obj, fn) {
        if (obj instanceof Map) {
            obj.forEach(fn);
        }
        else {
            Object.keys(obj).forEach(k => fn(obj[k], k));
        }
    }
}
class KeyValueChangeRecord_ {
    constructor(key) {
        this.key = key;
        this.previousValue = null;
        this.currentValue = null;
        /** @internal */
        this._nextPrevious = null;
        /** @internal */
        this._next = null;
        /** @internal */
        this._prev = null;
        /** @internal */
        this._nextAdded = null;
        /** @internal */
        this._nextRemoved = null;
        /** @internal */
        this._nextChanged = null;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVmYXVsdF9rZXl2YWx1ZV9kaWZmZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9jaGFuZ2VfZGV0ZWN0aW9uL2RpZmZlcnMvZGVmYXVsdF9rZXl2YWx1ZV9kaWZmZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLFlBQVksRUFBbUIsTUFBTSxjQUFjLENBQUM7QUFDNUQsT0FBTyxFQUFDLFVBQVUsRUFBQyxNQUFNLHFCQUFxQixDQUFDO0FBQy9DLE9BQU8sRUFBQyxTQUFTLEVBQUMsTUFBTSxzQkFBc0IsQ0FBQztBQUsvQyxNQUFNLE9BQU8sNEJBQTRCO0lBQ3ZDLGdCQUFlLENBQUM7SUFDaEIsUUFBUSxDQUFDLEdBQVE7UUFDZixPQUFPLEdBQUcsWUFBWSxHQUFHLElBQUksVUFBVSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQy9DLENBQUM7SUFFRCxNQUFNO1FBQ0osT0FBTyxJQUFJLHFCQUFxQixFQUFRLENBQUM7SUFDM0MsQ0FBQztDQUNGO0FBRUQsTUFBTSxPQUFPLHFCQUFxQjtJQUFsQztRQUNVLGFBQVEsR0FBRyxJQUFJLEdBQUcsRUFBa0MsQ0FBQztRQUNyRCxhQUFRLEdBQXFDLElBQUksQ0FBQztRQUMxRCx5Q0FBeUM7UUFDakMsaUJBQVksR0FBcUMsSUFBSSxDQUFDO1FBQ3RELHFCQUFnQixHQUFxQyxJQUFJLENBQUM7UUFDMUQsaUJBQVksR0FBcUMsSUFBSSxDQUFDO1FBQ3RELGlCQUFZLEdBQXFDLElBQUksQ0FBQztRQUN0RCxtQkFBYyxHQUFxQyxJQUFJLENBQUM7UUFDeEQsbUJBQWMsR0FBcUMsSUFBSSxDQUFDO1FBQ3hELGtCQUFhLEdBQXFDLElBQUksQ0FBQztRQUN2RCxrQkFBYSxHQUFxQyxJQUFJLENBQUM7SUFzT2pFLENBQUM7SUFwT0MsSUFBSSxPQUFPO1FBQ1QsT0FBTyxJQUFJLENBQUMs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QXFDLElBQUksQ0FBQztJQUUxQixDQUFDO0NBQzlCIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7UnVudGltZUVycm9yLCBSdW50aW1lRXJyb3JDb2RlfSBmcm9tICcuLi8uLi9lcnJvcnMnO1xuaW1wb3J0IHtpc0pzT2JqZWN0fSBmcm9tICcuLi8uLi91dGlsL2l0ZXJhYmxlJztcbmltcG9ydCB7c3RyaW5naWZ5fSBmcm9tICcuLi8uLi91dGlsL3N0cmluZ2lmeSc7XG5cbmltcG9ydCB7S2V5VmFsdWVDaGFuZ2VSZWNvcmQsIEtleVZhbHVlQ2hhbmdlcywgS2V5VmFsdWVEaWZmZXIsIEtleVZhbHVlRGlmZmVyRmFjdG9yeX0gZnJvbSAnLi9rZXl2YWx1ZV9kaWZmZXJzJztcblxuXG5leHBvcnQgY2xhc3MgRGVmYXVsdEtleVZhbHVlRGlmZmVyRmFjdG9yeTxLLCBWPiBpbXBsZW1lbnRzIEtleVZhbHVlRGlmZmVyRmFjdG9yeSB7XG4gIGNvbnN0cnVjdG9yKCkge31cbiAgc3VwcG9ydHMob2JqOiBhbnkpOiBib29sZWFuIHtcbiAgICByZXR1cm4gb2JqIGluc3RhbmNlb2YgTWFwIHx8IGlzSnNPYmplY3Qob2JqKTtcbiAgfVxuXG4gIGNyZWF0ZTxLLCBWPigpOiBLZXlWYWx1ZURpZmZlcjxLLCBWPiB7XG4gICAgcmV0dXJuIG5ldyBEZWZhdWx0S2V5VmFsdWVEaWZmZXI8SywgVj4oKTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgRGVmYXVsdEtleVZhbHVlRGlmZmVyPEssIFY+IGltcGxlbWVudHMgS2V5VmFsdWVEaWZmZXI8SywgVj4sIEtleVZhbHVlQ2hhbmdlczxLLCBWPiB7XG4gIHByaXZhdGUgX3JlY29yZHMgPSBuZXcgTWFwPEssIEtleVZhbHVlQ2hhbmdlUmVjb3JkXzxLLCBWPj4oKTtcbiAgcHJpdmF0ZSBfbWFwSGVhZDogS2V5VmFsdWVDaGFuZ2VSZWNvcmRfPEssIFY+fG51bGwgPSBudWxsO1xuICAvLyBfYXBwZW5kQWZ0ZXIgaXMgdXNlZCBpbiB0aGUgY2hlY2sgbG9vcFxuICBwcml2YXRlIF9hcHBlbmRBZnRlcjogS2V5VmFsdWVDaGFuZ2VSZWNvcmRfPEssIFY+fG51bGwgPSBudWxsO1xuICBwcml2YXRlIF9wcmV2aW91c01hcEhlYWQ6IEtleVZhbHVlQ2hhbmdlUmVjb3JkXzxLLCBWPnxudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBfY2hhbmdlc0hlYWQ6IEtleVZhbHVlQ2hhbmdlUmVjb3JkXzxLLCBWPnxudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBfY2hhbmdlc1RhaWw6IEtleVZhbHVlQ2hhbmdlUmVjb3JkXzxLLCBWPnxudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBfYWRkaXRpb25zSGVhZDogS2V5VmFsdWVDaGFuZ2VSZWNvcmRfPEssIFY+fG51bGwgPSBudWxsO1xuICBwcml2YXRlIF9hZGRpdGlvbnNUYWlsOiBLZXlWYWx1ZUNoYW5nZVJlY29yZF88SywgVj58bnVsbCA9IG51bGw7XG4gIHByaXZhdGUgX3JlbW92YWxzSGVhZDogS2V5VmFsdWVDaGFuZ2VSZWNvcmRfPEssIFY+fG51bGwgPSBudWxsO1xuICBwcml2YXRlIF9yZW1vdmFsc1RhaWw6IEtleVZhbHVlQ2hhbmdlUmVjb3JkXzxLLCBWPnxudWxsID0gbnVsbDtcblxuICBnZXQgaXNEaXJ0eSgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5fYWRkaXRpb25zSGVhZCAhPT0gbnVsbCB8fCB0aGlzLl9jaGFuZ2VzSGVhZCAhPT0gbnVsbCB8fFxuICAgICAgICB0aGlzLl9yZW1vdmFsc0hlYWQgIT09IG51bGw7XG4gIH1cblxuICBmb3JFYWNoSXRlbShmbjogKHI6IEtleVZhbHVlQ2hhbmdlUmVjb3JkPEssIFY+KSA9PiB2b2lkKSB7XG4gICAgbGV0IHJlY29yZDogS2V5VmFsdWVDaGFuZ2VSZWNvcmRfPEssIFY+fG51bGw7XG4gICAgZm9yIChyZWNvcmQgPSB0aGlzLl9tYXBIZWFkOyByZWNvcmQgIT09IG51bGw7IHJlY29yZCA9IHJlY29yZC5fbmV4dCkge1xuICAgICAgZm4ocmVjb3JkKTtcbiAgICB9XG4gIH1cblxuICBmb3JFYWNoUHJldmlvdXNJdGVtKGZuOiAocjogS2V5VmFsdWVDaGFuZ2VSZWNvcmQ8SywgVj4pID0+IHZvaWQpIHtcbiAgICBsZXQgcmVjb3JkOiBLZXlWYWx1ZUNoYW5nZVJlY29yZF88SywgVj58bnVsbDtcbiAgICBmb3IgKHJlY29yZCA9IHRoaXMuX3ByZXZpb3VzTWFwSGVhZDsgcmVjb3JkICE9PSBudWxsOyByZWNvcmQgPSByZWNvcmQuX25leHRQcmV2aW91cykge1xuICAgICAgZm4ocmVjb3JkKTtcbiAgICB9XG4gIH1cblxuICBmb3JFYWNoQ2hhbmdlZEl0ZW0oZm46IChyOiBLZXlWYWx1ZUNoYW5nZVJlY29yZDxLLCBWPikgPT4gdm9pZCkge1xuICAgIGxldCByZWNvcmQ6IEtleVZhbHVlQ2hhbmdlUmVjb3JkXzxLLCBWPnxudWxsO1xuICAgIGZvciAocmVjb3JkID0gdGhpcy5fY2hhbmdlc0hlYWQ7IHJlY29yZCAhPT0gbnVsbDsgcmVjb3JkID0gcmVjb3JkLl9uZXh0Q2hhbmdlZCkge1xuICAgICAgZm4ocmVjb3JkKTtcbiAgICB9XG4gIH1cblxuICBmb3JFYWNoQWRkZWRJdGVtKGZuOiAocjogS2V5VmFsdWVDaGFuZ2VSZWNvcmQ8SywgVj4pID0+IHZvaWQpIHtcbiAgICBsZXQgcmVjb3JkOiBLZXlWYWx1ZUNoYW5nZVJlY29yZF88SywgVj58bnVsbDtcbiAgICBmb3IgKHJlY29yZCA9IHRoaXMuX2FkZGl0aW9uc0hlYWQ7IHJlY29yZCAhPT0gbnVsbDsgcmVjb3JkID0gcmVjb3JkLl9uZXh0QWRkZWQpIHtcbiAgICAgIGZuKHJlY29yZCk7XG4gICAgfVxuICB9XG5cbiAgZm9yRWFjaFJlbW92ZWRJdGVtKGZuOiAocjogS2V5VmFsdWVDaGFuZ2VSZWNvcmQ8SywgVj4pID0+IHZvaWQpIHtcbiAgICBsZXQgcmVjb3JkOiBLZXlWYWx1ZUNoYW5nZVJlY29yZF88SywgVj58bnVsbDtcbiAgICBmb3IgKHJlY29yZCA9IHRoaXMuX3JlbW92YWxzSGVhZDsgcmVjb3JkICE9PSBudWxsOyByZWNvcmQgPSByZWNvcmQuX25leHRSZW1vdmVkKSB7XG4gICAgICBmbihyZWNvcmQpO1xuICAgIH1cbiAgfVxuXG4gIGRpZmYobWFwPzogTWFwPGFueSwgYW55Pnx7W2s6IHN0cmluZ106IGFueX18bnVsbCk6IGFueSB7XG4gICAgaWYgKCFtYXApIHtcbiAgICAgIG1hcCA9IG5ldyBNYXAoKTtcbiAgICB9IGVsc2UgaWYgKCEobWFwIGluc3RhbmNlb2YgTWFwIHx8IGlzSnNPYmplY3QobWFwKSkpIHtcbiAgICAgIGNvbnN0IGVycm9yTWVzc2FnZSA9ICh0eXBlb2YgbmdEZXZNb2RlID09PSAndW5kZWZpbmVkJyB8fCBuZ0Rldk1vZGUpID9cbiAgICAgICAgICBgRXJyb3IgdHJ5aW5nIHRvIGRpZmYgJyR7c3RyaW5naWZ5KG1hcCl9Jy4gT25seSBtYXBzIGFuZCBvYmplY3RzIGFyZSBhbGxvd2VkYCA6XG4gICAgICAgICAgJyc7XG4gICAgICB0aHJvdyBuZXcgUnVudGltZUVycm9yKFJ1bnRpbWVFcnJvckNvZGUuSU5WQUxJRF9ESUZGRVJfSU5QVVQsIGVycm9yTWVzc2FnZSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuY2hlY2sobWFwKSA/IHRoaXMgOiBudWxsO1xuICB9XG5cbiAgb25EZXN0cm95KCkge31cblxuICAvKipcbiAgICogQ2hlY2sgdGhlIGN1cnJlbnQgc3RhdGUgb2YgdGhlIG1hcCB2cyB0aGUgcHJldmlvdXMuXG4gICAqIFRoZSBhbGdvcml0aG0gaXMgb3B0aW1pc2VkIGZvciB3aGVuIHRoZSBrZXlzIGRvIG5vIGNoYW5nZS5cbiAgICovXG4gIGNoZWNrKG1hcDogTWFwPGFueSwgYW55Pnx7W2s6IHN0cmluZ106IGFueX0pOiBib29sZWFuIHtcbiAgICB0aGlzLl9yZXNldCgpO1xuXG4gICAgbGV0IGluc2VydEJlZm9yZSA9IHRoaXMuX21hcEhlYWQ7XG4gICAgdGhpcy5fYXBwZW5kQWZ0ZXIgPSBudWxsO1xuXG4gICAgdGhpcy5fZm9yRWFjaChtYXAsICh2YWx1ZTogYW55LCBrZXk6IGFueSkgPT4ge1xuICAgICAgaWYgKGluc2VydEJlZm9yZSAmJiBpbnNlcnRCZWZvcmUua2V5ID09PSBrZXkpIHtcbiAgICAgICAgdGhpcy5fbWF5YmVBZGRUb0NoYW5nZXMoaW5zZXJ0QmVmb3JlLCB2YWx1ZSk7XG4gICAgICAgIHRoaXMuX2FwcGVuZEFmdGVyID0gaW5zZXJ0QmVmb3JlO1xuICAgICAgICBpbnNlcnRCZWZvcmUgPSBpbnNlcnRCZWZvcmUuX25leHQ7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdCByZWNvcmQgPSB0aGlzLl9nZXRPckNyZWF0ZVJlY29yZEZvcktleShrZXksIHZhbHVlKTtcbiAgICAgICAgaW5zZXJ0QmVmb3JlID0gdGhpcy5faW5zZXJ0QmVmb3JlT3JBcHBlbmQoaW5zZXJ0QmVmb3JlLCByZWNvcmQpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgLy8gSXRlbXMgcmVtYWluaW5nIGF0IHRoZSBlbmQgb2YgdGhlIGxpc3QgaGF2ZSBiZWVuIGRlbGV0ZWRcbiAgICBpZiAoaW5zZXJ0QmVmb3JlKSB7XG4gICAgICBpZiAoaW5zZXJ0QmVmb3JlLl9wcmV2KSB7XG4gICAgICAgIGluc2VydEJlZm9yZS5fcHJldi5fbmV4dCA9IG51bGw7XG4gICAgICB9XG5cbiAgICAgIHRoaXMuX3JlbW92YWxzSGVhZCA9IGluc2VydEJlZm9yZTtcblxuICAgICAgZm9yIChsZXQgcmVjb3JkOiBLZXlWYWx1ZUNoYW5nZVJlY29yZF88SywgVj58bnVsbCA9IGluc2VydEJlZm9yZTsgcmVjb3JkICE9PSBudWxsO1xuICAgICAgICAgICByZWNvcmQgPSByZWNvcmQuX25leHRSZW1vdmVkKSB7XG4gICAgICAgIGlmIChyZWNvcmQgPT09IHRoaXMuX21hcEhlYWQpIHtcbiAgICAgICAgICB0aGlzLl9tYXBIZWFkID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9yZWNvcmRzLmRlbGV0ZShyZWNvcmQua2V5KTtcbiAgICAgICAgcmVjb3JkLl9uZXh0UmVtb3ZlZCA9IHJlY29yZC5fbmV4dDtcbiAgICAgICAgcmVjb3JkLnByZXZpb3VzVmFsdWUgPSByZWNvcmQuY3VycmVudFZhbHVlO1xuICAgICAgICByZWNvcmQuY3VycmVudFZhbHVlID0gbnVsbDtcbiAgICAgICAgcmVjb3JkLl9wcmV2ID0gbnVsbDtcbiAgICAgICAgcmVjb3JkLl9uZXh0ID0gbnVsbDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBNYWtlIHN1cmUgdGFpbHMgaGF2ZSBubyBuZXh0IHJlY29yZHMgZnJvbSBwcmV2aW91cyBydW5zXG4gICAgaWYgKHRoaXMuX2NoYW5nZXNUYWlsKSB0aGlzLl9jaGFuZ2VzVGFpbC5fbmV4dENoYW5nZWQgPSBudWxsO1xuICAgIGlmICh0aGlzLl9hZGRpdGlvbnNUYWlsKSB0aGlzLl9hZGRpdGlvbnNUYWlsLl9uZXh0QWRkZWQgPSBudWxsO1xuXG4gICAgcmV0dXJuIHRoaXMuaXNEaXJ0eTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbnNlcnRzIGEgcmVjb3JkIGJlZm9yZSBgYmVmb3JlYCBvciBhcHBlbmQgYXQgdGhlIGVuZCBvZiB0aGUgbGlzdCB3aGVuIGBiZWZvcmVgIGlzIG51bGwuXG4gICAqXG4gICAqIE5vdGVzOlxuICAgKiAtIFRoaXMgbWV0aG9kIGFwcGVuZHMgYXQgYHRoaXMuX2FwcGVuZEFmdGVyYCxcbiAgICogLSBUaGlzIG1ldGhvZCB1cGRhdGVzIGB0aGlzLl9hcHBlbmRBZnRlcmAsXG4gICAqIC0gVGhlIHJldHVybiB2YWx1ZSBpcyB0aGUgbmV3IHZhbHVlIGZvciB0aGUgaW5zZXJ0aW9uIHBvaW50ZXIuXG4gICAqL1xuICBwcml2YXRlIF9pbnNlcnRCZWZvcmVPckFwcGVuZChcbiAgICAgIGJlZm9yZTogS2V5VmFsdWVDaGFuZ2VSZWNvcmRfPEssIFY+fG51bGwsXG4gICAgICByZWNvcmQ6IEtleVZhbHVlQ2hhbmdlUmVjb3JkXzxLLCBWPik6IEtleVZhbHVlQ2hhbmdlUmVjb3JkXzxLLCBWPnxudWxsIHtcbiAgICBpZiAoYmVmb3JlKSB7XG4gICAgICBjb25zdCBwcmV2ID0gYmVmb3JlLl9wcmV2O1xuICAgICAgcmVjb3JkLl9uZXh0ID0gYmVmb3JlO1xuICAgICAgcmVjb3JkLl9wcmV2ID0gcHJldjtcbiAgICAgIGJlZm9yZS5fcHJldiA9IHJlY29yZDtcbiAgICAgIGlmIChwcmV2KSB7XG4gICAgICAgIHByZXYuX25leHQgPSByZWNvcmQ7XG4gICAgICB9XG4gICAgICBpZiAoYmVmb3JlID09PSB0aGlzLl9tYXBIZWFkKSB7XG4gICAgICAgIHRoaXMuX21hcEhlYWQgPSByZWNvcmQ7XG4gICAgICB9XG5cbiAgICAgIHRoaXMuX2FwcGVuZEFmdGVyID0gYmVmb3JlO1xuICAgICAgcmV0dXJuIGJlZm9yZTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5fYXBwZW5kQWZ0ZXIpIHtcbiAgICAgIHRoaXMuX2FwcGVuZEFmdGVyLl9uZXh0ID0gcmVjb3JkO1xuICAgICAgcmVjb3JkLl9wcmV2ID0gdGhpcy5fYXBwZW5kQWZ0ZXI7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX21hcEhlYWQgPSByZWNvcmQ7XG4gICAgfVxuXG4gICAgdGhpcy5fYXBwZW5kQWZ0ZXIgPSByZWNvcmQ7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICBwcml2YXRlIF9nZXRPckNyZWF0ZVJlY29yZEZvcktleShrZXk6IEssIHZhbHVlOiBWKTogS2V5VmFsdWVDaGFuZ2VSZWNvcmRfPEssIFY+IHtcbiAgICBpZiAodGhpcy5fcmVjb3Jkcy5oYXMoa2V5KSkge1xuICAgICAgY29uc3QgcmVjb3JkID0gdGhpcy5fcmVjb3Jkcy5nZXQoa2V5KSE7XG4gICAgICB0aGlzLl9tYXliZUFkZFRvQ2hhbmdlcyhyZWNvcmQsIHZhbHVlKTtcbiAgICAgIGNvbnN0IHByZXYgPSByZWNvcmQuX3ByZXY7XG4gICAgICBjb25zdCBuZXh0ID0gcmVjb3JkLl9uZXh0O1xuICAgICAgaWYgKHByZXYpIHtcbiAgICAgICAgcHJldi5fbmV4dCA9IG5leHQ7XG4gICAgICB9XG4gICAgICBpZiAobmV4dCkge1xuICAgICAgICBuZXh0Ll9wcmV2ID0gcHJldjtcbiAgICAgIH1cbiAgICAgIHJlY29yZC5fbmV4dCA9IG51bGw7XG4gICAgICByZWNvcmQuX3ByZXYgPSBudWxsO1xuXG4gICAgICByZXR1cm4gcmVjb3JkO1xuICAgIH1cblxuICAgIGNvbnN0IHJlY29yZCA9IG5ldyBLZXlWYWx1ZUNoYW5nZVJlY29yZF88SywgVj4oa2V5KTtcbiAgICB0aGlzLl9yZWNvcmRzLnNldChrZXksIHJlY29yZCk7XG4gICAgcmVjb3JkLmN1cnJlbnRWYWx1ZSA9IHZhbHVlO1xuICAgIHRoaXMuX2FkZFRvQWRkaXRpb25zKHJlY29yZCk7XG4gICAgcmV0dXJuIHJlY29yZDtcbiAgfVxuXG4gIC8qKiBAaW50ZXJuYWwgKi9cbiAgX3Jlc2V0KCkge1xuICAgIGlmICh0aGlzLmlzRGlydHkpIHtcbiAgICAgIGxldCByZWNvcmQ6IEtleVZhbHVlQ2hhbmdlUmVjb3JkXzxLLCBWPnxudWxsO1xuICAgICAgLy8gbGV0IGBfcHJldmlvdXNNYXBIZWFkYCBjb250YWluIHRoZSBzdGF0ZSBvZiB0aGUgbWFwIGJlZm9yZSB0aGUgY2hhbmdlc1xuICAgICAgdGhpcy5fcHJldmlvdXNNYXBIZWFkID0gdGhpcy5fbWFwSGVhZDtcbiAgICAgIGZvciAocmVjb3JkID0gdGhpcy5fcHJldmlvdXNNYXBIZWFkOyByZWNvcmQgIT09IG51bGw7IHJlY29yZCA9IHJlY29yZC5fbmV4dCkge1xuICAgICAgICByZWNvcmQuX25leHRQcmV2aW91cyA9IHJlY29yZC5fbmV4dDtcbiAgICAgIH1cblxuICAgICAgLy8gVXBkYXRlIGByZWNvcmQucHJldmlvdXNWYWx1ZWAgd2l0aCB0aGUgdmFsdWUgb2YgdGhlIGl0ZW0gYmVmb3JlIHRoZSBjaGFuZ2VzXG4gICAgICAvLyBXZSBuZWVkIHRvIHVwZGF0ZSBhbGwgY2hhbmdlZCBpdGVtcyAodGhhdCdzIHRob3NlIHdoaWNoIGhhdmUgYmVlbiBhZGRlZCBhbmQgY2hhbmdlZClcbiAgICAgIGZvciAocmVjb3JkID0gdGhpcy5fY2hhbmdlc0hlYWQ7IHJlY29yZCAhPT0gbnVsbDsgcmVjb3JkID0gcmVjb3JkLl9uZXh0Q2hhbmdlZCkge1xuICAgICAgICByZWNvcmQucHJldmlvdXNWYWx1ZSA9IHJlY29yZC5jdXJyZW50VmFsdWU7XG4gICAgICB9XG4gICAgICBmb3IgKHJlY29yZCA9IHRoaXMuX2FkZGl0aW9uc0hlYWQ7IHJlY29yZCAhPSBudWxsOyByZWNvcmQgPSByZWNvcmQuX25leHRBZGRlZCkge1xuICAgICAgICByZWNvcmQucHJldmlvdXNWYWx1ZSA9IHJlY29yZC5jdXJyZW50VmFsdWU7XG4gICAgICB9XG5cbiAgICAgIHRoaXMuX2NoYW5nZXNIZWFkID0gdGhpcy5fY2hhbmdlc1RhaWwgPSBudWxsO1xuICAgICAgdGhpcy5fYWRkaXRpb25zSGVhZCA9IHRoaXMuX2FkZGl0aW9uc1RhaWwgPSBudWxsO1xuICAgICAgdGhpcy5fcmVtb3ZhbHNIZWFkID0gbnVsbDtcbiAgICB9XG4gIH1cblxuICAvLyBBZGQgdGhlIHJlY29yZCBvciBhIGdpdmVuIGtleSB0byB0aGUgbGlzdCBvZiBjaGFuZ2VzIG9ubHkgd2hlbiB0aGUgdmFsdWUgaGFzIGFjdHVhbGx5IGNoYW5nZWRcbiAgcHJpdmF0ZSBfbWF5YmVBZGRUb0NoYW5nZXMocmVjb3JkOiBLZXlWYWx1ZUNoYW5nZVJlY29yZF88SywgVj4sIG5ld1ZhbHVlOiBhbnkpOiB2b2lkIHtcbiAgICBpZiAoIU9iamVjdC5pcyhuZXdWYWx1ZSwgcmVjb3JkLmN1cnJlbnRWYWx1ZSkpIHtcbiAgICAgIHJlY29yZC5wcmV2aW91c1ZhbHVlID0gcmVjb3JkLmN1cnJlbnRWYWx1ZTtcbiAgICAgIHJlY29yZC5jdXJyZW50VmFsdWUgPSBuZXdWYWx1ZTtcbiAgICAgIHRoaXMuX2FkZFRvQ2hhbmdlcyhyZWNvcmQpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgX2FkZFRvQWRkaXRpb25zKHJlY29yZDogS2V5VmFsdWVDaGFuZ2VSZWNvcmRfPEssIFY+KSB7XG4gICAgaWYgKHRoaXMuX2FkZGl0aW9uc0hlYWQgPT09IG51bGwpIHtcbiAgICAgIHRoaXMuX2FkZGl0aW9uc0hlYWQgPSB0aGlzLl9hZGRpdGlvbnNUYWlsID0gcmVjb3JkO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLl9hZGRpdGlvbnNUYWlsIS5fbmV4dEFkZGVkID0gcmVjb3JkO1xuICAgICAgdGhpcy5fYWRkaXRpb25zVGFpbCA9IHJlY29yZDtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIF9hZGRUb0NoYW5nZXMocmVjb3JkOiBLZXlWYWx1ZUNoYW5nZVJlY29yZF88SywgVj4pIHtcbiAgICBpZiAodGhpcy5fY2hhbmdlc0hlYWQgPT09IG51bGwpIHtcbiAgICAgIHRoaXMuX2NoYW5nZXNIZWFkID0gdGhpcy5fY2hhbmdlc1RhaWwgPSByZWNvcmQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX2NoYW5nZXNUYWlsIS5fbmV4dENoYW5nZWQgPSByZWNvcmQ7XG4gICAgICB0aGlzLl9jaGFuZ2VzVGFpbCA9IHJlY29yZDtcbiAgICB9XG4gIH1cblxuICAvKiogQGludGVybmFsICovXG4gIHByaXZhdGUgX2ZvckVhY2g8SywgVj4ob2JqOiBNYXA8SywgVj58e1trOiBzdHJpbmddOiBWfSwgZm46ICh2OiBWLCBrOiBhbnkpID0+IHZvaWQpIHtcbiAgICBpZiAob2JqIGluc3RhbmNlb2YgTWFwKSB7XG4gICAgICBvYmouZm9yRWFjaChmbik7XG4gICAgfSBlbHNlIHtcbiAgICAgIE9iamVjdC5rZXlzKG9iaikuZm9yRWFjaChrID0+IGZuKG9ialtrXSwgaykpO1xuICAgIH1cbiAgfVxufVxuXG5jbGFzcyBLZXlWYWx1ZUNoYW5nZVJlY29yZF88SywgVj4gaW1wbGVtZW50cyBLZXlWYWx1ZUNoYW5nZVJlY29yZDxLLCBWPiB7XG4gIHByZXZpb3VzVmFsdWU6IFZ8bnVsbCA9IG51bGw7XG4gIGN1cnJlbnRWYWx1ZTogVnxudWxsID0gbnVsbDtcblxuICAvKiogQGludGVybmFsICovXG4gIF9uZXh0UHJldmlvdXM6IEtleVZhbHVlQ2hhbmdlUmVjb3JkXzxLLCBWPnxudWxsID0gbnVsbDtcbiAgLyoqIEBpbnRlcm5hbCAqL1xuICBfbmV4dDogS2V5VmFsdWVDaGFuZ2VSZWNvcmRfPEssIFY+fG51bGwgPSBudWxsO1xuICAvKiogQGludGVybmFsICovXG4gIF9wcmV2OiBLZXlWYWx1ZUNoYW5nZVJlY29yZF88SywgVj58bnVsbCA9IG51bGw7XG4gIC8qKiBAaW50ZXJuYWwgKi9cbiAgX25leHRBZGRlZDogS2V5VmFsdWVDaGFuZ2VSZWNvcmRfPEssIFY+fG51bGwgPSBudWxsO1xuICAvKiogQGludGVybmFsICovXG4gIF9uZXh0UmVtb3ZlZDogS2V5VmFsdWVDaGFuZ2VSZWNvcmRfPEssIFY+fG51bGwgPSBudWxsO1xuICAvKiogQGludGVybmFsICovXG4gIF9uZXh0Q2hhbmdlZDogS2V5VmFsdWVDaGFuZ2VSZWNvcmRfPEssIFY+fG51bGwgPSBudWxsO1xuXG4gIGNvbnN0cnVjdG9yKHB1YmxpYyBrZXk6IEspIHt9XG59XG4iXX0=