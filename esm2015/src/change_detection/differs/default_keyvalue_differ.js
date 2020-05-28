/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { looseIdentical } from '../../util/comparison';
import { stringify } from '../../util/stringify';
import { isJsObject } from '../change_detection_util';
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
            throw new Error(`Error trying to diff '${stringify(map)}'. Only maps and objects are allowed`);
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
        if (!looseIdentical(newValue, record.currentValue)) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVmYXVsdF9rZXl2YWx1ZV9kaWZmZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9jaGFuZ2VfZGV0ZWN0aW9uL2RpZmZlcnMvZGVmYXVsdF9rZXl2YWx1ZV9kaWZmZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLGNBQWMsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQ3JELE9BQU8sRUFBQyxTQUFTLEVBQUMsTUFBTSxzQkFBc0IsQ0FBQztBQUMvQyxPQUFPLEVBQUMsVUFBVSxFQUFDLE1BQU0sMEJBQTBCLENBQUM7QUFJcEQsTUFBTSxPQUFPLDRCQUE0QjtJQUN2QyxnQkFBZSxDQUFDO0lBQ2hCLFFBQVEsQ0FBQyxHQUFRO1FBQ2YsT0FBTyxHQUFHLFlBQVksR0FBRyxJQUFJLFVBQVUsQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUMvQyxDQUFDO0lBRUQsTUFBTTtRQUNKLE9BQU8sSUFBSSxxQkFBcUIsRUFBUSxDQUFDO0lBQzNDLENBQUM7Q0FDRjtBQUVELE1BQU0sT0FBTyxxQkFBcUI7SUFBbEM7UUFDVSxhQUFRLEdBQUcsSUFBSSxHQUFHLEVBQWtDLENBQUM7UUFDckQsYUFBUSxHQUFxQyxJQUFJLENBQUM7UUFDMUQseUNBQXlDO1FBQ2pDLGlCQUFZLEdBQXFDLElBQUksQ0FBQztRQUN0RCxxQkFBZ0IsR0FBcUMsSUFBSSxDQUFDO1FBQzFELGlCQUFZLEdBQXFDLElBQUksQ0FBQztRQUN0RCxpQkFBWSxHQUFxQyxJQUFJLENBQUM7UUFDdEQsbUJBQWMsR0FBcUMsSUFBSSxDQUFDO1FBQ3hELG1CQUFjLEdBQXFDLElBQUksQ0FBQztRQUN4RCxrQkFBYSxHQUFxQyxJQUFJLENBQUM7UUFDdkQsa0JBQWEsR0FBcUMsSUFBSSxDQUFDO0lBb09qRSxDQUFDO0lBbE9DLElBQUksT0FBTztRQUNULE9BQU8sSUFBSSxDQUFD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QUM5QixJQUFJLENBQUMsWUFBWSxHQUFHLElBQUksQ0FBQyxZQUFZLEdBQUcsTUFBTSxDQUFDO1NBQ2hEO2FBQU07WUFDTCxJQUFJLENBQUMsWUFBYSxDQUFDLFlBQVksR0FBRyxNQUFNLENBQUM7WUFDekMsSUFBSSxDQUFDLFlBQVksR0FBRyxNQUFNLENBQUM7U0FDNUI7SUFDSCxDQUFDO0lBRUQsZ0JBQWdCO0lBQ1IsUUFBUSxDQUFPLEdBQStCLEVBQUUsRUFBMEI7UUFDaEYsSUFBSSxHQUFHLFlBQVksR0FBRyxFQUFFO1lBQ3RCLEdBQUcsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUM7U0FDakI7YUFBTTtZQUNMLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1NBQzlDO0lBQ0gsQ0FBQztDQUNGO0FBRUQsTUFBTSxxQkFBcUI7SUFpQnpCLFlBQW1CLEdBQU07UUFBTixRQUFHLEdBQUgsR0FBRyxDQUFHO1FBaEJ6QixrQkFBYSxHQUFXLElBQUksQ0FBQztRQUM3QixpQkFBWSxHQUFXLElBQUksQ0FBQztRQUU1QixnQkFBZ0I7UUFDaEIsa0JBQWEsR0FBcUMsSUFBSSxDQUFDO1FBQ3ZELGdCQUFnQjtRQUNoQixVQUFLLEdBQXFDLElBQUksQ0FBQztRQUMvQyxnQkFBZ0I7UUFDaEIsVUFBSyxHQUFxQyxJQUFJLENBQUM7UUFDL0MsZ0JBQWdCO1FBQ2hCLGVBQVUsR0FBcUMsSUFBSSxDQUFDO1FBQ3BELGdCQUFnQjtRQUNoQixpQkFBWSxHQUFxQyxJQUFJLENBQUM7UUFDdEQsZ0JBQWdCO1FBQ2hCLGlCQUFZLEdBQXFDLElBQUksQ0FBQztJQUUxQixDQUFDO0NBQzlCIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7bG9vc2VJZGVudGljYWx9IGZyb20gJy4uLy4uL3V0aWwvY29tcGFyaXNvbic7XG5pbXBvcnQge3N0cmluZ2lmeX0gZnJvbSAnLi4vLi4vdXRpbC9zdHJpbmdpZnknO1xuaW1wb3J0IHtpc0pzT2JqZWN0fSBmcm9tICcuLi9jaGFuZ2VfZGV0ZWN0aW9uX3V0aWwnO1xuaW1wb3J0IHtLZXlWYWx1ZUNoYW5nZVJlY29yZCwgS2V5VmFsdWVDaGFuZ2VzLCBLZXlWYWx1ZURpZmZlciwgS2V5VmFsdWVEaWZmZXJGYWN0b3J5fSBmcm9tICcuL2tleXZhbHVlX2RpZmZlcnMnO1xuXG5cbmV4cG9ydCBjbGFzcyBEZWZhdWx0S2V5VmFsdWVEaWZmZXJGYWN0b3J5PEssIFY+IGltcGxlbWVudHMgS2V5VmFsdWVEaWZmZXJGYWN0b3J5IHtcbiAgY29uc3RydWN0b3IoKSB7fVxuICBzdXBwb3J0cyhvYmo6IGFueSk6IGJvb2xlYW4ge1xuICAgIHJldHVybiBvYmogaW5zdGFuY2VvZiBNYXAgfHwgaXNKc09iamVjdChvYmopO1xuICB9XG5cbiAgY3JlYXRlPEssIFY+KCk6IEtleVZhbHVlRGlmZmVyPEssIFY+IHtcbiAgICByZXR1cm4gbmV3IERlZmF1bHRLZXlWYWx1ZURpZmZlcjxLLCBWPigpO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBEZWZhdWx0S2V5VmFsdWVEaWZmZXI8SywgVj4gaW1wbGVtZW50cyBLZXlWYWx1ZURpZmZlcjxLLCBWPiwgS2V5VmFsdWVDaGFuZ2VzPEssIFY+IHtcbiAgcHJpdmF0ZSBfcmVjb3JkcyA9IG5ldyBNYXA8SywgS2V5VmFsdWVDaGFuZ2VSZWNvcmRfPEssIFY+PigpO1xuICBwcml2YXRlIF9tYXBIZWFkOiBLZXlWYWx1ZUNoYW5nZVJlY29yZF88SywgVj58bnVsbCA9IG51bGw7XG4gIC8vIF9hcHBlbmRBZnRlciBpcyB1c2VkIGluIHRoZSBjaGVjayBsb29wXG4gIHByaXZhdGUgX2FwcGVuZEFmdGVyOiBLZXlWYWx1ZUNoYW5nZVJlY29yZF88SywgVj58bnVsbCA9IG51bGw7XG4gIHByaXZhdGUgX3ByZXZpb3VzTWFwSGVhZDogS2V5VmFsdWVDaGFuZ2VSZWNvcmRfPEssIFY+fG51bGwgPSBudWxsO1xuICBwcml2YXRlIF9jaGFuZ2VzSGVhZDogS2V5VmFsdWVDaGFuZ2VSZWNvcmRfPEssIFY+fG51bGwgPSBudWxsO1xuICBwcml2YXRlIF9jaGFuZ2VzVGFpbDogS2V5VmFsdWVDaGFuZ2VSZWNvcmRfPEssIFY+fG51bGwgPSBudWxsO1xuICBwcml2YXRlIF9hZGRpdGlvbnNIZWFkOiBLZXlWYWx1ZUNoYW5nZVJlY29yZF88SywgVj58bnVsbCA9IG51bGw7XG4gIHByaXZhdGUgX2FkZGl0aW9uc1RhaWw6IEtleVZhbHVlQ2hhbmdlUmVjb3JkXzxLLCBWPnxudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBfcmVtb3ZhbHNIZWFkOiBLZXlWYWx1ZUNoYW5nZVJlY29yZF88SywgVj58bnVsbCA9IG51bGw7XG4gIHByaXZhdGUgX3JlbW92YWxzVGFpbDogS2V5VmFsdWVDaGFuZ2VSZWNvcmRfPEssIFY+fG51bGwgPSBudWxsO1xuXG4gIGdldCBpc0RpcnR5KCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLl9hZGRpdGlvbnNIZWFkICE9PSBudWxsIHx8IHRoaXMuX2NoYW5nZXNIZWFkICE9PSBudWxsIHx8XG4gICAgICAgIHRoaXMuX3JlbW92YWxzSGVhZCAhPT0gbnVsbDtcbiAgfVxuXG4gIGZvckVhY2hJdGVtKGZuOiAocjogS2V5VmFsdWVDaGFuZ2VSZWNvcmQ8SywgVj4pID0+IHZvaWQpIHtcbiAgICBsZXQgcmVjb3JkOiBLZXlWYWx1ZUNoYW5nZVJlY29yZF88SywgVj58bnVsbDtcbiAgICBmb3IgKHJlY29yZCA9IHRoaXMuX21hcEhlYWQ7IHJlY29yZCAhPT0gbnVsbDsgcmVjb3JkID0gcmVjb3JkLl9uZXh0KSB7XG4gICAgICBmbihyZWNvcmQpO1xuICAgIH1cbiAgfVxuXG4gIGZvckVhY2hQcmV2aW91c0l0ZW0oZm46IChyOiBLZXlWYWx1ZUNoYW5nZVJlY29yZDxLLCBWPikgPT4gdm9pZCkge1xuICAgIGxldCByZWNvcmQ6IEtleVZhbHVlQ2hhbmdlUmVjb3JkXzxLLCBWPnxudWxsO1xuICAgIGZvciAocmVjb3JkID0gdGhpcy5fcHJldmlvdXNNYXBIZWFkOyByZWNvcmQgIT09IG51bGw7IHJlY29yZCA9IHJlY29yZC5fbmV4dFByZXZpb3VzKSB7XG4gICAgICBmbihyZWNvcmQpO1xuICAgIH1cbiAgfVxuXG4gIGZvckVhY2hDaGFuZ2VkSXRlbShmbjogKHI6IEtleVZhbHVlQ2hhbmdlUmVjb3JkPEssIFY+KSA9PiB2b2lkKSB7XG4gICAgbGV0IHJlY29yZDogS2V5VmFsdWVDaGFuZ2VSZWNvcmRfPEssIFY+fG51bGw7XG4gICAgZm9yIChyZWNvcmQgPSB0aGlzLl9jaGFuZ2VzSGVhZDsgcmVjb3JkICE9PSBudWxsOyByZWNvcmQgPSByZWNvcmQuX25leHRDaGFuZ2VkKSB7XG4gICAgICBmbihyZWNvcmQpO1xuICAgIH1cbiAgfVxuXG4gIGZvckVhY2hBZGRlZEl0ZW0oZm46IChyOiBLZXlWYWx1ZUNoYW5nZVJlY29yZDxLLCBWPikgPT4gdm9pZCkge1xuICAgIGxldCByZWNvcmQ6IEtleVZhbHVlQ2hhbmdlUmVjb3JkXzxLLCBWPnxudWxsO1xuICAgIGZvciAocmVjb3JkID0gdGhpcy5fYWRkaXRpb25zSGVhZDsgcmVjb3JkICE9PSBudWxsOyByZWNvcmQgPSByZWNvcmQuX25leHRBZGRlZCkge1xuICAgICAgZm4ocmVjb3JkKTtcbiAgICB9XG4gIH1cblxuICBmb3JFYWNoUmVtb3ZlZEl0ZW0oZm46IChyOiBLZXlWYWx1ZUNoYW5nZVJlY29yZDxLLCBWPikgPT4gdm9pZCkge1xuICAgIGxldCByZWNvcmQ6IEtleVZhbHVlQ2hhbmdlUmVjb3JkXzxLLCBWPnxudWxsO1xuICAgIGZvciAocmVjb3JkID0gdGhpcy5fcmVtb3ZhbHNIZWFkOyByZWNvcmQgIT09IG51bGw7IHJlY29yZCA9IHJlY29yZC5fbmV4dFJlbW92ZWQpIHtcbiAgICAgIGZuKHJlY29yZCk7XG4gICAgfVxuICB9XG5cbiAgZGlmZihtYXA/OiBNYXA8YW55LCBhbnk+fHtbazogc3RyaW5nXTogYW55fXxudWxsKTogYW55IHtcbiAgICBpZiAoIW1hcCkge1xuICAgICAgbWFwID0gbmV3IE1hcCgpO1xuICAgIH0gZWxzZSBpZiAoIShtYXAgaW5zdGFuY2VvZiBNYXAgfHwgaXNKc09iamVjdChtYXApKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgIGBFcnJvciB0cnlpbmcgdG8gZGlmZiAnJHtzdHJpbmdpZnkobWFwKX0nLiBPbmx5IG1hcHMgYW5kIG9iamVjdHMgYXJlIGFsbG93ZWRgKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5jaGVjayhtYXApID8gdGhpcyA6IG51bGw7XG4gIH1cblxuICBvbkRlc3Ryb3koKSB7fVxuXG4gIC8qKlxuICAgKiBDaGVjayB0aGUgY3VycmVudCBzdGF0ZSBvZiB0aGUgbWFwIHZzIHRoZSBwcmV2aW91cy5cbiAgICogVGhlIGFsZ29yaXRobSBpcyBvcHRpbWlzZWQgZm9yIHdoZW4gdGhlIGtleXMgZG8gbm8gY2hhbmdlLlxuICAgKi9cbiAgY2hlY2sobWFwOiBNYXA8YW55LCBhbnk+fHtbazogc3RyaW5nXTogYW55fSk6IGJvb2xlYW4ge1xuICAgIHRoaXMuX3Jlc2V0KCk7XG5cbiAgICBsZXQgaW5zZXJ0QmVmb3JlID0gdGhpcy5fbWFwSGVhZDtcbiAgICB0aGlzLl9hcHBlbmRBZnRlciA9IG51bGw7XG5cbiAgICB0aGlzLl9mb3JFYWNoKG1hcCwgKHZhbHVlOiBhbnksIGtleTogYW55KSA9PiB7XG4gICAgICBpZiAoaW5zZXJ0QmVmb3JlICYmIGluc2VydEJlZm9yZS5rZXkgPT09IGtleSkge1xuICAgICAgICB0aGlzLl9tYXliZUFkZFRvQ2hhbmdlcyhpbnNlcnRCZWZvcmUsIHZhbHVlKTtcbiAgICAgICAgdGhpcy5fYXBwZW5kQWZ0ZXIgPSBpbnNlcnRCZWZvcmU7XG4gICAgICAgIGluc2VydEJlZm9yZSA9IGluc2VydEJlZm9yZS5fbmV4dDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IHJlY29yZCA9IHRoaXMuX2dldE9yQ3JlYXRlUmVjb3JkRm9yS2V5KGtleSwgdmFsdWUpO1xuICAgICAgICBpbnNlcnRCZWZvcmUgPSB0aGlzLl9pbnNlcnRCZWZvcmVPckFwcGVuZChpbnNlcnRCZWZvcmUsIHJlY29yZCk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICAvLyBJdGVtcyByZW1haW5pbmcgYXQgdGhlIGVuZCBvZiB0aGUgbGlzdCBoYXZlIGJlZW4gZGVsZXRlZFxuICAgIGlmIChpbnNlcnRCZWZvcmUpIHtcbiAgICAgIGlmIChpbnNlcnRCZWZvcmUuX3ByZXYpIHtcbiAgICAgICAgaW5zZXJ0QmVmb3JlLl9wcmV2Ll9uZXh0ID0gbnVsbDtcbiAgICAgIH1cblxuICAgICAgdGhpcy5fcmVtb3ZhbHNIZWFkID0gaW5zZXJ0QmVmb3JlO1xuXG4gICAgICBmb3IgKGxldCByZWNvcmQ6IEtleVZhbHVlQ2hhbmdlUmVjb3JkXzxLLCBWPnxudWxsID0gaW5zZXJ0QmVmb3JlOyByZWNvcmQgIT09IG51bGw7XG4gICAgICAgICAgIHJlY29yZCA9IHJlY29yZC5fbmV4dFJlbW92ZWQpIHtcbiAgICAgICAgaWYgKHJlY29yZCA9PT0gdGhpcy5fbWFwSGVhZCkge1xuICAgICAgICAgIHRoaXMuX21hcEhlYWQgPSBudWxsO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX3JlY29yZHMuZGVsZXRlKHJlY29yZC5rZXkpO1xuICAgICAgICByZWNvcmQuX25leHRSZW1vdmVkID0gcmVjb3JkLl9uZXh0O1xuICAgICAgICByZWNvcmQucHJldmlvdXNWYWx1ZSA9IHJlY29yZC5jdXJyZW50VmFsdWU7XG4gICAgICAgIHJlY29yZC5jdXJyZW50VmFsdWUgPSBudWxsO1xuICAgICAgICByZWNvcmQuX3ByZXYgPSBudWxsO1xuICAgICAgICByZWNvcmQuX25leHQgPSBudWxsO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIE1ha2Ugc3VyZSB0YWlscyBoYXZlIG5vIG5leHQgcmVjb3JkcyBmcm9tIHByZXZpb3VzIHJ1bnNcbiAgICBpZiAodGhpcy5fY2hhbmdlc1RhaWwpIHRoaXMuX2NoYW5nZXNUYWlsLl9uZXh0Q2hhbmdlZCA9IG51bGw7XG4gICAgaWYgKHRoaXMuX2FkZGl0aW9uc1RhaWwpIHRoaXMuX2FkZGl0aW9uc1RhaWwuX25leHRBZGRlZCA9IG51bGw7XG5cbiAgICByZXR1cm4gdGhpcy5pc0RpcnR5O1xuICB9XG5cbiAgLyoqXG4gICAqIEluc2VydHMgYSByZWNvcmQgYmVmb3JlIGBiZWZvcmVgIG9yIGFwcGVuZCBhdCB0aGUgZW5kIG9mIHRoZSBsaXN0IHdoZW4gYGJlZm9yZWAgaXMgbnVsbC5cbiAgICpcbiAgICogTm90ZXM6XG4gICAqIC0gVGhpcyBtZXRob2QgYXBwZW5kcyBhdCBgdGhpcy5fYXBwZW5kQWZ0ZXJgLFxuICAgKiAtIFRoaXMgbWV0aG9kIHVwZGF0ZXMgYHRoaXMuX2FwcGVuZEFmdGVyYCxcbiAgICogLSBUaGUgcmV0dXJuIHZhbHVlIGlzIHRoZSBuZXcgdmFsdWUgZm9yIHRoZSBpbnNlcnRpb24gcG9pbnRlci5cbiAgICovXG4gIHByaXZhdGUgX2luc2VydEJlZm9yZU9yQXBwZW5kKFxuICAgICAgYmVmb3JlOiBLZXlWYWx1ZUNoYW5nZVJlY29yZF88SywgVj58bnVsbCxcbiAgICAgIHJlY29yZDogS2V5VmFsdWVDaGFuZ2VSZWNvcmRfPEssIFY+KTogS2V5VmFsdWVDaGFuZ2VSZWNvcmRfPEssIFY+fG51bGwge1xuICAgIGlmIChiZWZvcmUpIHtcbiAgICAgIGNvbnN0IHByZXYgPSBiZWZvcmUuX3ByZXY7XG4gICAgICByZWNvcmQuX25leHQgPSBiZWZvcmU7XG4gICAgICByZWNvcmQuX3ByZXYgPSBwcmV2O1xuICAgICAgYmVmb3JlLl9wcmV2ID0gcmVjb3JkO1xuICAgICAgaWYgKHByZXYpIHtcbiAgICAgICAgcHJldi5fbmV4dCA9IHJlY29yZDtcbiAgICAgIH1cbiAgICAgIGlmIChiZWZvcmUgPT09IHRoaXMuX21hcEhlYWQpIHtcbiAgICAgICAgdGhpcy5fbWFwSGVhZCA9IHJlY29yZDtcbiAgICAgIH1cblxuICAgICAgdGhpcy5fYXBwZW5kQWZ0ZXIgPSBiZWZvcmU7XG4gICAgICByZXR1cm4gYmVmb3JlO1xuICAgIH1cblxuICAgIGlmICh0aGlzLl9hcHBlbmRBZnRlcikge1xuICAgICAgdGhpcy5fYXBwZW5kQWZ0ZXIuX25leHQgPSByZWNvcmQ7XG4gICAgICByZWNvcmQuX3ByZXYgPSB0aGlzLl9hcHBlbmRBZnRlcjtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5fbWFwSGVhZCA9IHJlY29yZDtcbiAgICB9XG5cbiAgICB0aGlzLl9hcHBlbmRBZnRlciA9IHJlY29yZDtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIHByaXZhdGUgX2dldE9yQ3JlYXRlUmVjb3JkRm9yS2V5KGtleTogSywgdmFsdWU6IFYpOiBLZXlWYWx1ZUNoYW5nZVJlY29yZF88SywgVj4ge1xuICAgIGlmICh0aGlzLl9yZWNvcmRzLmhhcyhrZXkpKSB7XG4gICAgICBjb25zdCByZWNvcmQgPSB0aGlzLl9yZWNvcmRzLmdldChrZXkpITtcbiAgICAgIHRoaXMuX21heWJlQWRkVG9DaGFuZ2VzKHJlY29yZCwgdmFsdWUpO1xuICAgICAgY29uc3QgcHJldiA9IHJlY29yZC5fcHJldjtcbiAgICAgIGNvbnN0IG5leHQgPSByZWNvcmQuX25leHQ7XG4gICAgICBpZiAocHJldikge1xuICAgICAgICBwcmV2Ll9uZXh0ID0gbmV4dDtcbiAgICAgIH1cbiAgICAgIGlmIChuZXh0KSB7XG4gICAgICAgIG5leHQuX3ByZXYgPSBwcmV2O1xuICAgICAgfVxuICAgICAgcmVjb3JkLl9uZXh0ID0gbnVsbDtcbiAgICAgIHJlY29yZC5fcHJldiA9IG51bGw7XG5cbiAgICAgIHJldHVybiByZWNvcmQ7XG4gICAgfVxuXG4gICAgY29uc3QgcmVjb3JkID0gbmV3IEtleVZhbHVlQ2hhbmdlUmVjb3JkXzxLLCBWPihrZXkpO1xuICAgIHRoaXMuX3JlY29yZHMuc2V0KGtleSwgcmVjb3JkKTtcbiAgICByZWNvcmQuY3VycmVudFZhbHVlID0gdmFsdWU7XG4gICAgdGhpcy5fYWRkVG9BZGRpdGlvbnMocmVjb3JkKTtcbiAgICByZXR1cm4gcmVjb3JkO1xuICB9XG5cbiAgLyoqIEBpbnRlcm5hbCAqL1xuICBfcmVzZXQoKSB7XG4gICAgaWYgKHRoaXMuaXNEaXJ0eSkge1xuICAgICAgbGV0IHJlY29yZDogS2V5VmFsdWVDaGFuZ2VSZWNvcmRfPEssIFY+fG51bGw7XG4gICAgICAvLyBsZXQgYF9wcmV2aW91c01hcEhlYWRgIGNvbnRhaW4gdGhlIHN0YXRlIG9mIHRoZSBtYXAgYmVmb3JlIHRoZSBjaGFuZ2VzXG4gICAgICB0aGlzLl9wcmV2aW91c01hcEhlYWQgPSB0aGlzLl9tYXBIZWFkO1xuICAgICAgZm9yIChyZWNvcmQgPSB0aGlzLl9wcmV2aW91c01hcEhlYWQ7IHJlY29yZCAhPT0gbnVsbDsgcmVjb3JkID0gcmVjb3JkLl9uZXh0KSB7XG4gICAgICAgIHJlY29yZC5fbmV4dFByZXZpb3VzID0gcmVjb3JkLl9uZXh0O1xuICAgICAgfVxuXG4gICAgICAvLyBVcGRhdGUgYHJlY29yZC5wcmV2aW91c1ZhbHVlYCB3aXRoIHRoZSB2YWx1ZSBvZiB0aGUgaXRlbSBiZWZvcmUgdGhlIGNoYW5nZXNcbiAgICAgIC8vIFdlIG5lZWQgdG8gdXBkYXRlIGFsbCBjaGFuZ2VkIGl0ZW1zICh0aGF0J3MgdGhvc2Ugd2hpY2ggaGF2ZSBiZWVuIGFkZGVkIGFuZCBjaGFuZ2VkKVxuICAgICAgZm9yIChyZWNvcmQgPSB0aGlzLl9jaGFuZ2VzSGVhZDsgcmVjb3JkICE9PSBudWxsOyByZWNvcmQgPSByZWNvcmQuX25leHRDaGFuZ2VkKSB7XG4gICAgICAgIHJlY29yZC5wcmV2aW91c1ZhbHVlID0gcmVjb3JkLmN1cnJlbnRWYWx1ZTtcbiAgICAgIH1cbiAgICAgIGZvciAocmVjb3JkID0gdGhpcy5fYWRkaXRpb25zSGVhZDsgcmVjb3JkICE9IG51bGw7IHJlY29yZCA9IHJlY29yZC5fbmV4dEFkZGVkKSB7XG4gICAgICAgIHJlY29yZC5wcmV2aW91c1ZhbHVlID0gcmVjb3JkLmN1cnJlbnRWYWx1ZTtcbiAgICAgIH1cblxuICAgICAgdGhpcy5fY2hhbmdlc0hlYWQgPSB0aGlzLl9jaGFuZ2VzVGFpbCA9IG51bGw7XG4gICAgICB0aGlzLl9hZGRpdGlvbnNIZWFkID0gdGhpcy5fYWRkaXRpb25zVGFpbCA9IG51bGw7XG4gICAgICB0aGlzLl9yZW1vdmFsc0hlYWQgPSBudWxsO1xuICAgIH1cbiAgfVxuXG4gIC8vIEFkZCB0aGUgcmVjb3JkIG9yIGEgZ2l2ZW4ga2V5IHRvIHRoZSBsaXN0IG9mIGNoYW5nZXMgb25seSB3aGVuIHRoZSB2YWx1ZSBoYXMgYWN0dWFsbHkgY2hhbmdlZFxuICBwcml2YXRlIF9tYXliZUFkZFRvQ2hhbmdlcyhyZWNvcmQ6IEtleVZhbHVlQ2hhbmdlUmVjb3JkXzxLLCBWPiwgbmV3VmFsdWU6IGFueSk6IHZvaWQge1xuICAgIGlmICghbG9vc2VJZGVudGljYWwobmV3VmFsdWUsIHJlY29yZC5jdXJyZW50VmFsdWUpKSB7XG4gICAgICByZWNvcmQucHJldmlvdXNWYWx1ZSA9IHJlY29yZC5jdXJyZW50VmFsdWU7XG4gICAgICByZWNvcmQuY3VycmVudFZhbHVlID0gbmV3VmFsdWU7XG4gICAgICB0aGlzLl9hZGRUb0NoYW5nZXMocmVjb3JkKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIF9hZGRUb0FkZGl0aW9ucyhyZWNvcmQ6IEtleVZhbHVlQ2hhbmdlUmVjb3JkXzxLLCBWPikge1xuICAgIGlmICh0aGlzLl9hZGRpdGlvbnNIZWFkID09PSBudWxsKSB7XG4gICAgICB0aGlzLl9hZGRpdGlvbnNIZWFkID0gdGhpcy5fYWRkaXRpb25zVGFpbCA9IHJlY29yZDtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5fYWRkaXRpb25zVGFpbCEuX25leHRBZGRlZCA9IHJlY29yZDtcbiAgICAgIHRoaXMuX2FkZGl0aW9uc1RhaWwgPSByZWNvcmQ7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBfYWRkVG9DaGFuZ2VzKHJlY29yZDogS2V5VmFsdWVDaGFuZ2VSZWNvcmRfPEssIFY+KSB7XG4gICAgaWYgKHRoaXMuX2NoYW5nZXNIZWFkID09PSBudWxsKSB7XG4gICAgICB0aGlzLl9jaGFuZ2VzSGVhZCA9IHRoaXMuX2NoYW5nZXNUYWlsID0gcmVjb3JkO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLl9jaGFuZ2VzVGFpbCEuX25leHRDaGFuZ2VkID0gcmVjb3JkO1xuICAgICAgdGhpcy5fY2hhbmdlc1RhaWwgPSByZWNvcmQ7XG4gICAgfVxuICB9XG5cbiAgLyoqIEBpbnRlcm5hbCAqL1xuICBwcml2YXRlIF9mb3JFYWNoPEssIFY+KG9iajogTWFwPEssIFY+fHtbazogc3RyaW5nXTogVn0sIGZuOiAodjogViwgazogYW55KSA9PiB2b2lkKSB7XG4gICAgaWYgKG9iaiBpbnN0YW5jZW9mIE1hcCkge1xuICAgICAgb2JqLmZvckVhY2goZm4pO1xuICAgIH0gZWxzZSB7XG4gICAgICBPYmplY3Qua2V5cyhvYmopLmZvckVhY2goayA9PiBmbihvYmpba10sIGspKTtcbiAgICB9XG4gIH1cbn1cblxuY2xhc3MgS2V5VmFsdWVDaGFuZ2VSZWNvcmRfPEssIFY+IGltcGxlbWVudHMgS2V5VmFsdWVDaGFuZ2VSZWNvcmQ8SywgVj4ge1xuICBwcmV2aW91c1ZhbHVlOiBWfG51bGwgPSBudWxsO1xuICBjdXJyZW50VmFsdWU6IFZ8bnVsbCA9IG51bGw7XG5cbiAgLyoqIEBpbnRlcm5hbCAqL1xuICBfbmV4dFByZXZpb3VzOiBLZXlWYWx1ZUNoYW5nZVJlY29yZF88SywgVj58bnVsbCA9IG51bGw7XG4gIC8qKiBAaW50ZXJuYWwgKi9cbiAgX25leHQ6IEtleVZhbHVlQ2hhbmdlUmVjb3JkXzxLLCBWPnxudWxsID0gbnVsbDtcbiAgLyoqIEBpbnRlcm5hbCAqL1xuICBfcHJldjogS2V5VmFsdWVDaGFuZ2VSZWNvcmRfPEssIFY+fG51bGwgPSBudWxsO1xuICAvKiogQGludGVybmFsICovXG4gIF9uZXh0QWRkZWQ6IEtleVZhbHVlQ2hhbmdlUmVjb3JkXzxLLCBWPnxudWxsID0gbnVsbDtcbiAgLyoqIEBpbnRlcm5hbCAqL1xuICBfbmV4dFJlbW92ZWQ6IEtleVZhbHVlQ2hhbmdlUmVjb3JkXzxLLCBWPnxudWxsID0gbnVsbDtcbiAgLyoqIEBpbnRlcm5hbCAqL1xuICBfbmV4dENoYW5nZWQ6IEtleVZhbHVlQ2hhbmdlUmVjb3JkXzxLLCBWPnxudWxsID0gbnVsbDtcblxuICBjb25zdHJ1Y3RvcihwdWJsaWMga2V5OiBLKSB7fVxufVxuIl19