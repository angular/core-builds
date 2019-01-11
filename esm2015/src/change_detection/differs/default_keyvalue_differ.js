/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { looseIdentical } from '../../util/comparison';
import { stringify } from '../../util/stringify';
import { isJsObject } from '../change_detection_util';
/**
 * @template K, V
 */
export class DefaultKeyValueDifferFactory {
    constructor() { }
    /**
     * @param {?} obj
     * @return {?}
     */
    supports(obj) { return obj instanceof Map || isJsObject(obj); }
    /**
     * @template K, V
     * @return {?}
     */
    create() { return new DefaultKeyValueDiffer(); }
}
/**
 * @template K, V
 */
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
    /**
     * @return {?}
     */
    get isDirty() {
        return this._additionsHead !== null || this._changesHead !== null ||
            this._removalsHead !== null;
    }
    /**
     * @param {?} fn
     * @return {?}
     */
    forEachItem(fn) {
        /** @type {?} */
        let record;
        for (record = this._mapHead; record !== null; record = record._next) {
            fn(record);
        }
    }
    /**
     * @param {?} fn
     * @return {?}
     */
    forEachPreviousItem(fn) {
        /** @type {?} */
        let record;
        for (record = this._previousMapHead; record !== null; record = record._nextPrevious) {
            fn(record);
        }
    }
    /**
     * @param {?} fn
     * @return {?}
     */
    forEachChangedItem(fn) {
        /** @type {?} */
        let record;
        for (record = this._changesHead; record !== null; record = record._nextChanged) {
            fn(record);
        }
    }
    /**
     * @param {?} fn
     * @return {?}
     */
    forEachAddedItem(fn) {
        /** @type {?} */
        let record;
        for (record = this._additionsHead; record !== null; record = record._nextAdded) {
            fn(record);
        }
    }
    /**
     * @param {?} fn
     * @return {?}
     */
    forEachRemovedItem(fn) {
        /** @type {?} */
        let record;
        for (record = this._removalsHead; record !== null; record = record._nextRemoved) {
            fn(record);
        }
    }
    /**
     * @param {?=} map
     * @return {?}
     */
    diff(map) {
        if (!map) {
            map = new Map();
        }
        else if (!(map instanceof Map || isJsObject(map))) {
            throw new Error(`Error trying to diff '${stringify(map)}'. Only maps and objects are allowed`);
        }
        return this.check(map) ? this : null;
    }
    /**
     * @return {?}
     */
    onDestroy() { }
    /**
     * Check the current state of the map vs the previous.
     * The algorithm is optimised for when the keys do no change.
     * @param {?} map
     * @return {?}
     */
    check(map) {
        this._reset();
        /** @type {?} */
        let insertBefore = this._mapHead;
        this._appendAfter = null;
        this._forEach(map, (value, key) => {
            if (insertBefore && insertBefore.key === key) {
                this._maybeAddToChanges(insertBefore, value);
                this._appendAfter = insertBefore;
                insertBefore = insertBefore._next;
            }
            else {
                /** @type {?} */
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
     * @private
     * @param {?} before
     * @param {?} record
     * @return {?}
     */
    _insertBeforeOrAppend(before, record) {
        if (before) {
            /** @type {?} */
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
    /**
     * @private
     * @param {?} key
     * @param {?} value
     * @return {?}
     */
    _getOrCreateRecordForKey(key, value) {
        if (this._records.has(key)) {
            /** @type {?} */
            const record = (/** @type {?} */ (this._records.get(key)));
            this._maybeAddToChanges(record, value);
            /** @type {?} */
            const prev = record._prev;
            /** @type {?} */
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
        /** @type {?} */
        const record = new KeyValueChangeRecord_(key);
        this._records.set(key, record);
        record.currentValue = value;
        this._addToAdditions(record);
        return record;
    }
    /**
     * \@internal
     * @return {?}
     */
    _reset() {
        if (this.isDirty) {
            /** @type {?} */
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
    /**
     * @private
     * @param {?} record
     * @param {?} newValue
     * @return {?}
     */
    _maybeAddToChanges(record, newValue) {
        if (!looseIdentical(newValue, record.currentValue)) {
            record.previousValue = record.currentValue;
            record.currentValue = newValue;
            this._addToChanges(record);
        }
    }
    /**
     * @private
     * @param {?} record
     * @return {?}
     */
    _addToAdditions(record) {
        if (this._additionsHead === null) {
            this._additionsHead = this._additionsTail = record;
        }
        else {
            (/** @type {?} */ (this._additionsTail))._nextAdded = record;
            this._additionsTail = record;
        }
    }
    /**
     * @private
     * @param {?} record
     * @return {?}
     */
    _addToChanges(record) {
        if (this._changesHead === null) {
            this._changesHead = this._changesTail = record;
        }
        else {
            (/** @type {?} */ (this._changesTail))._nextChanged = record;
            this._changesTail = record;
        }
    }
    /**
     * \@internal
     * @private
     * @template K, V
     * @param {?} obj
     * @param {?} fn
     * @return {?}
     */
    _forEach(obj, fn) {
        if (obj instanceof Map) {
            obj.forEach(fn);
        }
        else {
            Object.keys(obj).forEach(k => fn(obj[k], k));
        }
    }
}
if (false) {
    /**
     * @type {?}
     * @private
     */
    DefaultKeyValueDiffer.prototype._records;
    /**
     * @type {?}
     * @private
     */
    DefaultKeyValueDiffer.prototype._mapHead;
    /**
     * @type {?}
     * @private
     */
    DefaultKeyValueDiffer.prototype._appendAfter;
    /**
     * @type {?}
     * @private
     */
    DefaultKeyValueDiffer.prototype._previousMapHead;
    /**
     * @type {?}
     * @private
     */
    DefaultKeyValueDiffer.prototype._changesHead;
    /**
     * @type {?}
     * @private
     */
    DefaultKeyValueDiffer.prototype._changesTail;
    /**
     * @type {?}
     * @private
     */
    DefaultKeyValueDiffer.prototype._additionsHead;
    /**
     * @type {?}
     * @private
     */
    DefaultKeyValueDiffer.prototype._additionsTail;
    /**
     * @type {?}
     * @private
     */
    DefaultKeyValueDiffer.prototype._removalsHead;
    /**
     * @type {?}
     * @private
     */
    DefaultKeyValueDiffer.prototype._removalsTail;
}
/**
 * @template K, V
 */
class KeyValueChangeRecord_ {
    /**
     * @param {?} key
     */
    constructor(key) {
        this.key = key;
        this.previousValue = null;
        this.currentValue = null;
        /**
         * \@internal
         */
        this._nextPrevious = null;
        /**
         * \@internal
         */
        this._next = null;
        /**
         * \@internal
         */
        this._prev = null;
        /**
         * \@internal
         */
        this._nextAdded = null;
        /**
         * \@internal
         */
        this._nextRemoved = null;
        /**
         * \@internal
         */
        this._nextChanged = null;
    }
}
if (false) {
    /** @type {?} */
    KeyValueChangeRecord_.prototype.previousValue;
    /** @type {?} */
    KeyValueChangeRecord_.prototype.currentValue;
    /**
     * \@internal
     * @type {?}
     */
    KeyValueChangeRecord_.prototype._nextPrevious;
    /**
     * \@internal
     * @type {?}
     */
    KeyValueChangeRecord_.prototype._next;
    /**
     * \@internal
     * @type {?}
     */
    KeyValueChangeRecord_.prototype._prev;
    /**
     * \@internal
     * @type {?}
     */
    KeyValueChangeRecord_.prototype._nextAdded;
    /**
     * \@internal
     * @type {?}
     */
    KeyValueChangeRecord_.prototype._nextRemoved;
    /**
     * \@internal
     * @type {?}
     */
    KeyValueChangeRecord_.prototype._nextChanged;
    /** @type {?} */
    KeyValueChangeRecord_.prototype.key;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVmYXVsdF9rZXl2YWx1ZV9kaWZmZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9jaGFuZ2VfZGV0ZWN0aW9uL2RpZmZlcnMvZGVmYXVsdF9rZXl2YWx1ZV9kaWZmZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFRQSxPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDckQsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLHNCQUFzQixDQUFDO0FBQy9DLE9BQU8sRUFBQyxVQUFVLEVBQUMsTUFBTSwwQkFBMEIsQ0FBQzs7OztBQUlwRCxNQUFNLE9BQU8sNEJBQTRCO0lBQ3ZDLGdCQUFlLENBQUM7Ozs7O0lBQ2hCLFFBQVEsQ0FBQyxHQUFRLElBQWEsT0FBTyxHQUFHLFlBQVksR0FBRyxJQUFJLFVBQVUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7Ozs7O0lBRTdFLE1BQU0sS0FBaUMsT0FBTyxJQUFJLHFCQUFxQixFQUFRLENBQUMsQ0FBQyxDQUFDO0NBQ25GOzs7O0FBRUQsTUFBTSxPQUFPLHFCQUFxQjtJQUFsQztRQUNVLGFBQVEsR0FBRyxJQUFJLEdBQUcsRUFBa0MsQ0FBQztRQUNyRCxhQUFRLEdBQXFDLElBQUksQ0FBQzs7UUFFbEQsaUJBQVksR0FBcUMsSUFBSSxDQUFDO1FBQ3RELHFCQUFnQixHQUFxQyxJQUFJLENBQUM7UUFDMUQsaUJBQVksR0FBcUMsSUFBSSxDQUFDO1FBQ3RELGlCQUFZLEdBQXFDLElBQUksQ0FBQztRQUN0RCxtQkFBYyxHQUFxQyxJQUFJLENBQUM7UUFDeEQsbUJBQWMsR0FBcUMsSUFBSSxDQUFDO1FBQ3hELGtCQUFhLEdBQXFDLElBQUksQ0FBQztRQUN2RCxrQkFBYSxHQUFxQyxJQUFJLENBQUM7SUFvT2pFLENBQUM7Ozs7SUFsT0MsSUFBSSxPQUFPO1FBQ1QsT0FBTyxJQUFJLENB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SUFHNUIsOENBQXVEOzs7OztJQUV2RCxzQ0FBK0M7Ozs7O0lBRS9DLHNDQUErQzs7Ozs7SUFFL0MsMkNBQW9EOzs7OztJQUVwRCw2Q0FBc0Q7Ozs7O0lBRXRELDZDQUFzRDs7SUFFMUMsb0NBQWEiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7bG9vc2VJZGVudGljYWx9IGZyb20gJy4uLy4uL3V0aWwvY29tcGFyaXNvbic7XG5pbXBvcnQge3N0cmluZ2lmeX0gZnJvbSAnLi4vLi4vdXRpbC9zdHJpbmdpZnknO1xuaW1wb3J0IHtpc0pzT2JqZWN0fSBmcm9tICcuLi9jaGFuZ2VfZGV0ZWN0aW9uX3V0aWwnO1xuaW1wb3J0IHtLZXlWYWx1ZUNoYW5nZVJlY29yZCwgS2V5VmFsdWVDaGFuZ2VzLCBLZXlWYWx1ZURpZmZlciwgS2V5VmFsdWVEaWZmZXJGYWN0b3J5fSBmcm9tICcuL2tleXZhbHVlX2RpZmZlcnMnO1xuXG5cbmV4cG9ydCBjbGFzcyBEZWZhdWx0S2V5VmFsdWVEaWZmZXJGYWN0b3J5PEssIFY+IGltcGxlbWVudHMgS2V5VmFsdWVEaWZmZXJGYWN0b3J5IHtcbiAgY29uc3RydWN0b3IoKSB7fVxuICBzdXBwb3J0cyhvYmo6IGFueSk6IGJvb2xlYW4geyByZXR1cm4gb2JqIGluc3RhbmNlb2YgTWFwIHx8IGlzSnNPYmplY3Qob2JqKTsgfVxuXG4gIGNyZWF0ZTxLLCBWPigpOiBLZXlWYWx1ZURpZmZlcjxLLCBWPiB7IHJldHVybiBuZXcgRGVmYXVsdEtleVZhbHVlRGlmZmVyPEssIFY+KCk7IH1cbn1cblxuZXhwb3J0IGNsYXNzIERlZmF1bHRLZXlWYWx1ZURpZmZlcjxLLCBWPiBpbXBsZW1lbnRzIEtleVZhbHVlRGlmZmVyPEssIFY+LCBLZXlWYWx1ZUNoYW5nZXM8SywgVj4ge1xuICBwcml2YXRlIF9yZWNvcmRzID0gbmV3IE1hcDxLLCBLZXlWYWx1ZUNoYW5nZVJlY29yZF88SywgVj4+KCk7XG4gIHByaXZhdGUgX21hcEhlYWQ6IEtleVZhbHVlQ2hhbmdlUmVjb3JkXzxLLCBWPnxudWxsID0gbnVsbDtcbiAgLy8gX2FwcGVuZEFmdGVyIGlzIHVzZWQgaW4gdGhlIGNoZWNrIGxvb3BcbiAgcHJpdmF0ZSBfYXBwZW5kQWZ0ZXI6IEtleVZhbHVlQ2hhbmdlUmVjb3JkXzxLLCBWPnxudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBfcHJldmlvdXNNYXBIZWFkOiBLZXlWYWx1ZUNoYW5nZVJlY29yZF88SywgVj58bnVsbCA9IG51bGw7XG4gIHByaXZhdGUgX2NoYW5nZXNIZWFkOiBLZXlWYWx1ZUNoYW5nZVJlY29yZF88SywgVj58bnVsbCA9IG51bGw7XG4gIHByaXZhdGUgX2NoYW5nZXNUYWlsOiBLZXlWYWx1ZUNoYW5nZVJlY29yZF88SywgVj58bnVsbCA9IG51bGw7XG4gIHByaXZhdGUgX2FkZGl0aW9uc0hlYWQ6IEtleVZhbHVlQ2hhbmdlUmVjb3JkXzxLLCBWPnxudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBfYWRkaXRpb25zVGFpbDogS2V5VmFsdWVDaGFuZ2VSZWNvcmRfPEssIFY+fG51bGwgPSBudWxsO1xuICBwcml2YXRlIF9yZW1vdmFsc0hlYWQ6IEtleVZhbHVlQ2hhbmdlUmVjb3JkXzxLLCBWPnxudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBfcmVtb3ZhbHNUYWlsOiBLZXlWYWx1ZUNoYW5nZVJlY29yZF88SywgVj58bnVsbCA9IG51bGw7XG5cbiAgZ2V0IGlzRGlydHkoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuX2FkZGl0aW9uc0hlYWQgIT09IG51bGwgfHwgdGhpcy5fY2hhbmdlc0hlYWQgIT09IG51bGwgfHxcbiAgICAgICAgdGhpcy5fcmVtb3ZhbHNIZWFkICE9PSBudWxsO1xuICB9XG5cbiAgZm9yRWFjaEl0ZW0oZm46IChyOiBLZXlWYWx1ZUNoYW5nZVJlY29yZDxLLCBWPikgPT4gdm9pZCkge1xuICAgIGxldCByZWNvcmQ6IEtleVZhbHVlQ2hhbmdlUmVjb3JkXzxLLCBWPnxudWxsO1xuICAgIGZvciAocmVjb3JkID0gdGhpcy5fbWFwSGVhZDsgcmVjb3JkICE9PSBudWxsOyByZWNvcmQgPSByZWNvcmQuX25leHQpIHtcbiAgICAgIGZuKHJlY29yZCk7XG4gICAgfVxuICB9XG5cbiAgZm9yRWFjaFByZXZpb3VzSXRlbShmbjogKHI6IEtleVZhbHVlQ2hhbmdlUmVjb3JkPEssIFY+KSA9PiB2b2lkKSB7XG4gICAgbGV0IHJlY29yZDogS2V5VmFsdWVDaGFuZ2VSZWNvcmRfPEssIFY+fG51bGw7XG4gICAgZm9yIChyZWNvcmQgPSB0aGlzLl9wcmV2aW91c01hcEhlYWQ7IHJlY29yZCAhPT0gbnVsbDsgcmVjb3JkID0gcmVjb3JkLl9uZXh0UHJldmlvdXMpIHtcbiAgICAgIGZuKHJlY29yZCk7XG4gICAgfVxuICB9XG5cbiAgZm9yRWFjaENoYW5nZWRJdGVtKGZuOiAocjogS2V5VmFsdWVDaGFuZ2VSZWNvcmQ8SywgVj4pID0+IHZvaWQpIHtcbiAgICBsZXQgcmVjb3JkOiBLZXlWYWx1ZUNoYW5nZVJlY29yZF88SywgVj58bnVsbDtcbiAgICBmb3IgKHJlY29yZCA9IHRoaXMuX2NoYW5nZXNIZWFkOyByZWNvcmQgIT09IG51bGw7IHJlY29yZCA9IHJlY29yZC5fbmV4dENoYW5nZWQpIHtcbiAgICAgIGZuKHJlY29yZCk7XG4gICAgfVxuICB9XG5cbiAgZm9yRWFjaEFkZGVkSXRlbShmbjogKHI6IEtleVZhbHVlQ2hhbmdlUmVjb3JkPEssIFY+KSA9PiB2b2lkKSB7XG4gICAgbGV0IHJlY29yZDogS2V5VmFsdWVDaGFuZ2VSZWNvcmRfPEssIFY+fG51bGw7XG4gICAgZm9yIChyZWNvcmQgPSB0aGlzLl9hZGRpdGlvbnNIZWFkOyByZWNvcmQgIT09IG51bGw7IHJlY29yZCA9IHJlY29yZC5fbmV4dEFkZGVkKSB7XG4gICAgICBmbihyZWNvcmQpO1xuICAgIH1cbiAgfVxuXG4gIGZvckVhY2hSZW1vdmVkSXRlbShmbjogKHI6IEtleVZhbHVlQ2hhbmdlUmVjb3JkPEssIFY+KSA9PiB2b2lkKSB7XG4gICAgbGV0IHJlY29yZDogS2V5VmFsdWVDaGFuZ2VSZWNvcmRfPEssIFY+fG51bGw7XG4gICAgZm9yIChyZWNvcmQgPSB0aGlzLl9yZW1vdmFsc0hlYWQ7IHJlY29yZCAhPT0gbnVsbDsgcmVjb3JkID0gcmVjb3JkLl9uZXh0UmVtb3ZlZCkge1xuICAgICAgZm4ocmVjb3JkKTtcbiAgICB9XG4gIH1cblxuICBkaWZmKG1hcD86IE1hcDxhbnksIGFueT58e1trOiBzdHJpbmddOiBhbnl9fG51bGwpOiBhbnkge1xuICAgIGlmICghbWFwKSB7XG4gICAgICBtYXAgPSBuZXcgTWFwKCk7XG4gICAgfSBlbHNlIGlmICghKG1hcCBpbnN0YW5jZW9mIE1hcCB8fCBpc0pzT2JqZWN0KG1hcCkpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgYEVycm9yIHRyeWluZyB0byBkaWZmICcke3N0cmluZ2lmeShtYXApfScuIE9ubHkgbWFwcyBhbmQgb2JqZWN0cyBhcmUgYWxsb3dlZGApO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLmNoZWNrKG1hcCkgPyB0aGlzIDogbnVsbDtcbiAgfVxuXG4gIG9uRGVzdHJveSgpIHt9XG5cbiAgLyoqXG4gICAqIENoZWNrIHRoZSBjdXJyZW50IHN0YXRlIG9mIHRoZSBtYXAgdnMgdGhlIHByZXZpb3VzLlxuICAgKiBUaGUgYWxnb3JpdGhtIGlzIG9wdGltaXNlZCBmb3Igd2hlbiB0aGUga2V5cyBkbyBubyBjaGFuZ2UuXG4gICAqL1xuICBjaGVjayhtYXA6IE1hcDxhbnksIGFueT58e1trOiBzdHJpbmddOiBhbnl9KTogYm9vbGVhbiB7XG4gICAgdGhpcy5fcmVzZXQoKTtcblxuICAgIGxldCBpbnNlcnRCZWZvcmUgPSB0aGlzLl9tYXBIZWFkO1xuICAgIHRoaXMuX2FwcGVuZEFmdGVyID0gbnVsbDtcblxuICAgIHRoaXMuX2ZvckVhY2gobWFwLCAodmFsdWU6IGFueSwga2V5OiBhbnkpID0+IHtcbiAgICAgIGlmIChpbnNlcnRCZWZvcmUgJiYgaW5zZXJ0QmVmb3JlLmtleSA9PT0ga2V5KSB7XG4gICAgICAgIHRoaXMuX21heWJlQWRkVG9DaGFuZ2VzKGluc2VydEJlZm9yZSwgdmFsdWUpO1xuICAgICAgICB0aGlzLl9hcHBlbmRBZnRlciA9IGluc2VydEJlZm9yZTtcbiAgICAgICAgaW5zZXJ0QmVmb3JlID0gaW5zZXJ0QmVmb3JlLl9uZXh0O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc3QgcmVjb3JkID0gdGhpcy5fZ2V0T3JDcmVhdGVSZWNvcmRGb3JLZXkoa2V5LCB2YWx1ZSk7XG4gICAgICAgIGluc2VydEJlZm9yZSA9IHRoaXMuX2luc2VydEJlZm9yZU9yQXBwZW5kKGluc2VydEJlZm9yZSwgcmVjb3JkKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIC8vIEl0ZW1zIHJlbWFpbmluZyBhdCB0aGUgZW5kIG9mIHRoZSBsaXN0IGhhdmUgYmVlbiBkZWxldGVkXG4gICAgaWYgKGluc2VydEJlZm9yZSkge1xuICAgICAgaWYgKGluc2VydEJlZm9yZS5fcHJldikge1xuICAgICAgICBpbnNlcnRCZWZvcmUuX3ByZXYuX25leHQgPSBudWxsO1xuICAgICAgfVxuXG4gICAgICB0aGlzLl9yZW1vdmFsc0hlYWQgPSBpbnNlcnRCZWZvcmU7XG5cbiAgICAgIGZvciAobGV0IHJlY29yZDogS2V5VmFsdWVDaGFuZ2VSZWNvcmRfPEssIFY+fG51bGwgPSBpbnNlcnRCZWZvcmU7IHJlY29yZCAhPT0gbnVsbDtcbiAgICAgICAgICAgcmVjb3JkID0gcmVjb3JkLl9uZXh0UmVtb3ZlZCkge1xuICAgICAgICBpZiAocmVjb3JkID09PSB0aGlzLl9tYXBIZWFkKSB7XG4gICAgICAgICAgdGhpcy5fbWFwSGVhZCA9IG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fcmVjb3Jkcy5kZWxldGUocmVjb3JkLmtleSk7XG4gICAgICAgIHJlY29yZC5fbmV4dFJlbW92ZWQgPSByZWNvcmQuX25leHQ7XG4gICAgICAgIHJlY29yZC5wcmV2aW91c1ZhbHVlID0gcmVjb3JkLmN1cnJlbnRWYWx1ZTtcbiAgICAgICAgcmVjb3JkLmN1cnJlbnRWYWx1ZSA9IG51bGw7XG4gICAgICAgIHJlY29yZC5fcHJldiA9IG51bGw7XG4gICAgICAgIHJlY29yZC5fbmV4dCA9IG51bGw7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gTWFrZSBzdXJlIHRhaWxzIGhhdmUgbm8gbmV4dCByZWNvcmRzIGZyb20gcHJldmlvdXMgcnVuc1xuICAgIGlmICh0aGlzLl9jaGFuZ2VzVGFpbCkgdGhpcy5fY2hhbmdlc1RhaWwuX25leHRDaGFuZ2VkID0gbnVsbDtcbiAgICBpZiAodGhpcy5fYWRkaXRpb25zVGFpbCkgdGhpcy5fYWRkaXRpb25zVGFpbC5fbmV4dEFkZGVkID0gbnVsbDtcblxuICAgIHJldHVybiB0aGlzLmlzRGlydHk7XG4gIH1cblxuICAvKipcbiAgICogSW5zZXJ0cyBhIHJlY29yZCBiZWZvcmUgYGJlZm9yZWAgb3IgYXBwZW5kIGF0IHRoZSBlbmQgb2YgdGhlIGxpc3Qgd2hlbiBgYmVmb3JlYCBpcyBudWxsLlxuICAgKlxuICAgKiBOb3RlczpcbiAgICogLSBUaGlzIG1ldGhvZCBhcHBlbmRzIGF0IGB0aGlzLl9hcHBlbmRBZnRlcmAsXG4gICAqIC0gVGhpcyBtZXRob2QgdXBkYXRlcyBgdGhpcy5fYXBwZW5kQWZ0ZXJgLFxuICAgKiAtIFRoZSByZXR1cm4gdmFsdWUgaXMgdGhlIG5ldyB2YWx1ZSBmb3IgdGhlIGluc2VydGlvbiBwb2ludGVyLlxuICAgKi9cbiAgcHJpdmF0ZSBfaW5zZXJ0QmVmb3JlT3JBcHBlbmQoXG4gICAgICBiZWZvcmU6IEtleVZhbHVlQ2hhbmdlUmVjb3JkXzxLLCBWPnxudWxsLFxuICAgICAgcmVjb3JkOiBLZXlWYWx1ZUNoYW5nZVJlY29yZF88SywgVj4pOiBLZXlWYWx1ZUNoYW5nZVJlY29yZF88SywgVj58bnVsbCB7XG4gICAgaWYgKGJlZm9yZSkge1xuICAgICAgY29uc3QgcHJldiA9IGJlZm9yZS5fcHJldjtcbiAgICAgIHJlY29yZC5fbmV4dCA9IGJlZm9yZTtcbiAgICAgIHJlY29yZC5fcHJldiA9IHByZXY7XG4gICAgICBiZWZvcmUuX3ByZXYgPSByZWNvcmQ7XG4gICAgICBpZiAocHJldikge1xuICAgICAgICBwcmV2Ll9uZXh0ID0gcmVjb3JkO1xuICAgICAgfVxuICAgICAgaWYgKGJlZm9yZSA9PT0gdGhpcy5fbWFwSGVhZCkge1xuICAgICAgICB0aGlzLl9tYXBIZWFkID0gcmVjb3JkO1xuICAgICAgfVxuXG4gICAgICB0aGlzLl9hcHBlbmRBZnRlciA9IGJlZm9yZTtcbiAgICAgIHJldHVybiBiZWZvcmU7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuX2FwcGVuZEFmdGVyKSB7XG4gICAgICB0aGlzLl9hcHBlbmRBZnRlci5fbmV4dCA9IHJlY29yZDtcbiAgICAgIHJlY29yZC5fcHJldiA9IHRoaXMuX2FwcGVuZEFmdGVyO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLl9tYXBIZWFkID0gcmVjb3JkO1xuICAgIH1cblxuICAgIHRoaXMuX2FwcGVuZEFmdGVyID0gcmVjb3JkO1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgcHJpdmF0ZSBfZ2V0T3JDcmVhdGVSZWNvcmRGb3JLZXkoa2V5OiBLLCB2YWx1ZTogVik6IEtleVZhbHVlQ2hhbmdlUmVjb3JkXzxLLCBWPiB7XG4gICAgaWYgKHRoaXMuX3JlY29yZHMuaGFzKGtleSkpIHtcbiAgICAgIGNvbnN0IHJlY29yZCA9IHRoaXMuX3JlY29yZHMuZ2V0KGtleSkgITtcbiAgICAgIHRoaXMuX21heWJlQWRkVG9DaGFuZ2VzKHJlY29yZCwgdmFsdWUpO1xuICAgICAgY29uc3QgcHJldiA9IHJlY29yZC5fcHJldjtcbiAgICAgIGNvbnN0IG5leHQgPSByZWNvcmQuX25leHQ7XG4gICAgICBpZiAocHJldikge1xuICAgICAgICBwcmV2Ll9uZXh0ID0gbmV4dDtcbiAgICAgIH1cbiAgICAgIGlmIChuZXh0KSB7XG4gICAgICAgIG5leHQuX3ByZXYgPSBwcmV2O1xuICAgICAgfVxuICAgICAgcmVjb3JkLl9uZXh0ID0gbnVsbDtcbiAgICAgIHJlY29yZC5fcHJldiA9IG51bGw7XG5cbiAgICAgIHJldHVybiByZWNvcmQ7XG4gICAgfVxuXG4gICAgY29uc3QgcmVjb3JkID0gbmV3IEtleVZhbHVlQ2hhbmdlUmVjb3JkXzxLLCBWPihrZXkpO1xuICAgIHRoaXMuX3JlY29yZHMuc2V0KGtleSwgcmVjb3JkKTtcbiAgICByZWNvcmQuY3VycmVudFZhbHVlID0gdmFsdWU7XG4gICAgdGhpcy5fYWRkVG9BZGRpdGlvbnMocmVjb3JkKTtcbiAgICByZXR1cm4gcmVjb3JkO1xuICB9XG5cbiAgLyoqIEBpbnRlcm5hbCAqL1xuICBfcmVzZXQoKSB7XG4gICAgaWYgKHRoaXMuaXNEaXJ0eSkge1xuICAgICAgbGV0IHJlY29yZDogS2V5VmFsdWVDaGFuZ2VSZWNvcmRfPEssIFY+fG51bGw7XG4gICAgICAvLyBsZXQgYF9wcmV2aW91c01hcEhlYWRgIGNvbnRhaW4gdGhlIHN0YXRlIG9mIHRoZSBtYXAgYmVmb3JlIHRoZSBjaGFuZ2VzXG4gICAgICB0aGlzLl9wcmV2aW91c01hcEhlYWQgPSB0aGlzLl9tYXBIZWFkO1xuICAgICAgZm9yIChyZWNvcmQgPSB0aGlzLl9wcmV2aW91c01hcEhlYWQ7IHJlY29yZCAhPT0gbnVsbDsgcmVjb3JkID0gcmVjb3JkLl9uZXh0KSB7XG4gICAgICAgIHJlY29yZC5fbmV4dFByZXZpb3VzID0gcmVjb3JkLl9uZXh0O1xuICAgICAgfVxuXG4gICAgICAvLyBVcGRhdGUgYHJlY29yZC5wcmV2aW91c1ZhbHVlYCB3aXRoIHRoZSB2YWx1ZSBvZiB0aGUgaXRlbSBiZWZvcmUgdGhlIGNoYW5nZXNcbiAgICAgIC8vIFdlIG5lZWQgdG8gdXBkYXRlIGFsbCBjaGFuZ2VkIGl0ZW1zICh0aGF0J3MgdGhvc2Ugd2hpY2ggaGF2ZSBiZWVuIGFkZGVkIGFuZCBjaGFuZ2VkKVxuICAgICAgZm9yIChyZWNvcmQgPSB0aGlzLl9jaGFuZ2VzSGVhZDsgcmVjb3JkICE9PSBudWxsOyByZWNvcmQgPSByZWNvcmQuX25leHRDaGFuZ2VkKSB7XG4gICAgICAgIHJlY29yZC5wcmV2aW91c1ZhbHVlID0gcmVjb3JkLmN1cnJlbnRWYWx1ZTtcbiAgICAgIH1cbiAgICAgIGZvciAocmVjb3JkID0gdGhpcy5fYWRkaXRpb25zSGVhZDsgcmVjb3JkICE9IG51bGw7IHJlY29yZCA9IHJlY29yZC5fbmV4dEFkZGVkKSB7XG4gICAgICAgIHJlY29yZC5wcmV2aW91c1ZhbHVlID0gcmVjb3JkLmN1cnJlbnRWYWx1ZTtcbiAgICAgIH1cblxuICAgICAgdGhpcy5fY2hhbmdlc0hlYWQgPSB0aGlzLl9jaGFuZ2VzVGFpbCA9IG51bGw7XG4gICAgICB0aGlzLl9hZGRpdGlvbnNIZWFkID0gdGhpcy5fYWRkaXRpb25zVGFpbCA9IG51bGw7XG4gICAgICB0aGlzLl9yZW1vdmFsc0hlYWQgPSBudWxsO1xuICAgIH1cbiAgfVxuXG4gIC8vIEFkZCB0aGUgcmVjb3JkIG9yIGEgZ2l2ZW4ga2V5IHRvIHRoZSBsaXN0IG9mIGNoYW5nZXMgb25seSB3aGVuIHRoZSB2YWx1ZSBoYXMgYWN0dWFsbHkgY2hhbmdlZFxuICBwcml2YXRlIF9tYXliZUFkZFRvQ2hhbmdlcyhyZWNvcmQ6IEtleVZhbHVlQ2hhbmdlUmVjb3JkXzxLLCBWPiwgbmV3VmFsdWU6IGFueSk6IHZvaWQge1xuICAgIGlmICghbG9vc2VJZGVudGljYWwobmV3VmFsdWUsIHJlY29yZC5jdXJyZW50VmFsdWUpKSB7XG4gICAgICByZWNvcmQucHJldmlvdXNWYWx1ZSA9IHJlY29yZC5jdXJyZW50VmFsdWU7XG4gICAgICByZWNvcmQuY3VycmVudFZhbHVlID0gbmV3VmFsdWU7XG4gICAgICB0aGlzLl9hZGRUb0NoYW5nZXMocmVjb3JkKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIF9hZGRUb0FkZGl0aW9ucyhyZWNvcmQ6IEtleVZhbHVlQ2hhbmdlUmVjb3JkXzxLLCBWPikge1xuICAgIGlmICh0aGlzLl9hZGRpdGlvbnNIZWFkID09PSBudWxsKSB7XG4gICAgICB0aGlzLl9hZGRpdGlvbnNIZWFkID0gdGhpcy5fYWRkaXRpb25zVGFpbCA9IHJlY29yZDtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5fYWRkaXRpb25zVGFpbCAhLl9uZXh0QWRkZWQgPSByZWNvcmQ7XG4gICAgICB0aGlzLl9hZGRpdGlvbnNUYWlsID0gcmVjb3JkO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgX2FkZFRvQ2hhbmdlcyhyZWNvcmQ6IEtleVZhbHVlQ2hhbmdlUmVjb3JkXzxLLCBWPikge1xuICAgIGlmICh0aGlzLl9jaGFuZ2VzSGVhZCA9PT0gbnVsbCkge1xuICAgICAgdGhpcy5fY2hhbmdlc0hlYWQgPSB0aGlzLl9jaGFuZ2VzVGFpbCA9IHJlY29yZDtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5fY2hhbmdlc1RhaWwgIS5fbmV4dENoYW5nZWQgPSByZWNvcmQ7XG4gICAgICB0aGlzLl9jaGFuZ2VzVGFpbCA9IHJlY29yZDtcbiAgICB9XG4gIH1cblxuICAvKiogQGludGVybmFsICovXG4gIHByaXZhdGUgX2ZvckVhY2g8SywgVj4ob2JqOiBNYXA8SywgVj58e1trOiBzdHJpbmddOiBWfSwgZm46ICh2OiBWLCBrOiBhbnkpID0+IHZvaWQpIHtcbiAgICBpZiAob2JqIGluc3RhbmNlb2YgTWFwKSB7XG4gICAgICBvYmouZm9yRWFjaChmbik7XG4gICAgfSBlbHNlIHtcbiAgICAgIE9iamVjdC5rZXlzKG9iaikuZm9yRWFjaChrID0+IGZuKG9ialtrXSwgaykpO1xuICAgIH1cbiAgfVxufVxuXG5jbGFzcyBLZXlWYWx1ZUNoYW5nZVJlY29yZF88SywgVj4gaW1wbGVtZW50cyBLZXlWYWx1ZUNoYW5nZVJlY29yZDxLLCBWPiB7XG4gIHByZXZpb3VzVmFsdWU6IFZ8bnVsbCA9IG51bGw7XG4gIGN1cnJlbnRWYWx1ZTogVnxudWxsID0gbnVsbDtcblxuICAvKiogQGludGVybmFsICovXG4gIF9uZXh0UHJldmlvdXM6IEtleVZhbHVlQ2hhbmdlUmVjb3JkXzxLLCBWPnxudWxsID0gbnVsbDtcbiAgLyoqIEBpbnRlcm5hbCAqL1xuICBfbmV4dDogS2V5VmFsdWVDaGFuZ2VSZWNvcmRfPEssIFY+fG51bGwgPSBudWxsO1xuICAvKiogQGludGVybmFsICovXG4gIF9wcmV2OiBLZXlWYWx1ZUNoYW5nZVJlY29yZF88SywgVj58bnVsbCA9IG51bGw7XG4gIC8qKiBAaW50ZXJuYWwgKi9cbiAgX25leHRBZGRlZDogS2V5VmFsdWVDaGFuZ2VSZWNvcmRfPEssIFY+fG51bGwgPSBudWxsO1xuICAvKiogQGludGVybmFsICovXG4gIF9uZXh0UmVtb3ZlZDogS2V5VmFsdWVDaGFuZ2VSZWNvcmRfPEssIFY+fG51bGwgPSBudWxsO1xuICAvKiogQGludGVybmFsICovXG4gIF9uZXh0Q2hhbmdlZDogS2V5VmFsdWVDaGFuZ2VSZWNvcmRfPEssIFY+fG51bGwgPSBudWxsO1xuXG4gIGNvbnN0cnVjdG9yKHB1YmxpYyBrZXk6IEspIHt9XG59XG4iXX0=