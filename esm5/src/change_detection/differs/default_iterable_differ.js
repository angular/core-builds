/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { looseIdentical } from '../../util/comparison';
import { stringify } from '../../util/stringify';
import { isListLikeIterable, iterateListLike } from '../change_detection_util';
var DefaultIterableDifferFactory = /** @class */ (function () {
    function DefaultIterableDifferFactory() {
    }
    DefaultIterableDifferFactory.prototype.supports = function (obj) {
        return isListLikeIterable(obj);
    };
    DefaultIterableDifferFactory.prototype.create = function (trackByFn) {
        return new DefaultIterableDiffer(trackByFn);
    };
    return DefaultIterableDifferFactory;
}());
export { DefaultIterableDifferFactory };
var trackByIdentity = function (index, item) { return item; };
/**
 * @deprecated v4.0.0 - Should not be part of public API.
 * @publicApi
 */
var DefaultIterableDiffer = /** @class */ (function () {
    function DefaultIterableDiffer(trackByFn) {
        this.length = 0;
        // Keeps track of the used records at any point in time (during & across `_check()` calls)
        this._linkedRecords = null;
        // Keeps track of the removed records at any point in time during `_check()` calls.
        this._unlinkedRecords = null;
        this._previousItHead = null;
        this._itHead = null;
        this._itTail = null;
        this._additionsHead = null;
        this._additionsTail = null;
        this._movesHead = null;
        this._movesTail = null;
        this._removalsHead = null;
        this._removalsTail = null;
        // Keeps track of records where custom track by is the same, but item identity has changed
        this._identityChangesHead = null;
        this._identityChangesTail = null;
        this._trackByFn = trackByFn || trackByIdentity;
    }
    DefaultIterableDiffer.prototype.forEachItem = function (fn) {
        var record;
        for (record = this._itHead; record !== null; record = record._next) {
            fn(record);
        }
    };
    DefaultIterableDiffer.prototype.forEachOperation = function (fn) {
        var nextIt = this._itHead;
        var nextRemove = this._removalsHead;
        var addRemoveOffset = 0;
        var moveOffsets = null;
        while (nextIt || nextRemove) {
            // Figure out which is the next record to process
            // Order: remove, add, move
            var record = !nextRemove ||
                nextIt &&
                    nextIt.currentIndex <
                        getPreviousIndex(nextRemove, addRemoveOffset, moveOffsets) ?
                nextIt :
                nextRemove;
            var adjPreviousIndex = getPreviousIndex(record, addRemoveOffset, moveOffsets);
            var currentIndex = record.currentIndex;
            // consume the item, and adjust the addRemoveOffset and update moveDistance if necessary
            if (record === nextRemove) {
                addRemoveOffset--;
                nextRemove = nextRemove._nextRemoved;
            }
            else {
                nextIt = nextIt._next;
                if (record.previousIndex == null) {
                    addRemoveOffset++;
                }
                else {
                    // INVARIANT:  currentIndex < previousIndex
                    if (!moveOffsets)
                        moveOffsets = [];
                    var localMovePreviousIndex = adjPreviousIndex - addRemoveOffset;
                    var localCurrentIndex = currentIndex - addRemoveOffset;
                    if (localMovePreviousIndex != localCurrentIndex) {
                        for (var i = 0; i < localMovePreviousIndex; i++) {
                            var offset = i < moveOffsets.length ? moveOffsets[i] : (moveOffsets[i] = 0);
                            var index = offset + i;
                            if (localCurrentIndex <= index && index < localMovePreviousIndex) {
                                moveOffsets[i] = offset + 1;
                            }
                        }
                        var previousIndex = record.previousIndex;
                        moveOffsets[previousIndex] = localCurrentIndex - localMovePreviousIndex;
                    }
                }
            }
            if (adjPreviousIndex !== currentIndex) {
                fn(record, adjPreviousIndex, currentIndex);
            }
        }
    };
    DefaultIterableDiffer.prototype.forEachPreviousItem = function (fn) {
        var record;
        for (record = this._previousItHead; record !== null; record = record._nextPrevious) {
            fn(record);
        }
    };
    DefaultIterableDiffer.prototype.forEachAddedItem = function (fn) {
        var record;
        for (record = this._additionsHead; record !== null; record = record._nextAdded) {
            fn(record);
        }
    };
    DefaultIterableDiffer.prototype.forEachMovedItem = function (fn) {
        var record;
        for (record = this._movesHead; record !== null; record = record._nextMoved) {
            fn(record);
        }
    };
    DefaultIterableDiffer.prototype.forEachRemovedItem = function (fn) {
        var record;
        for (record = this._removalsHead; record !== null; record = record._nextRemoved) {
            fn(record);
        }
    };
    DefaultIterableDiffer.prototype.forEachIdentityChange = function (fn) {
        var record;
        for (record = this._identityChangesHead; record !== null; record = record._nextIdentityChange) {
            fn(record);
        }
    };
    DefaultIterableDiffer.prototype.diff = function (collection) {
        if (collection == null)
            collection = [];
        if (!isListLikeIterable(collection)) {
            throw new Error("Error trying to diff '" + stringify(collection) + "'. Only arrays and iterables are allowed");
        }
        if (this.check(collection)) {
            return this;
        }
        else {
            return null;
        }
    };
    DefaultIterableDiffer.prototype.onDestroy = function () { };
    DefaultIterableDiffer.prototype.check = function (collection) {
        var _this = this;
        this._reset();
        var record = this._itHead;
        var mayBeDirty = false;
        var index;
        var item;
        var itemTrackBy;
        if (Array.isArray(collection)) {
            this.length = collection.length;
            for (var index_1 = 0; index_1 < this.length; index_1++) {
                item = collection[index_1];
                itemTrackBy = this._trackByFn(index_1, item);
                if (record === null || !looseIdentical(record.trackById, itemTrackBy)) {
                    record = this._mismatch(record, item, itemTrackBy, index_1);
                    mayBeDirty = true;
                }
                else {
                    if (mayBeDirty) {
                        // TODO(misko): can we limit this to duplicates only?
                        record = this._verifyReinsertion(record, item, itemTrackBy, index_1);
                    }
                    if (!looseIdentical(record.item, item))
                        this._addIdentityChange(record, item);
                }
                record = record._next;
            }
        }
        else {
            index = 0;
            iterateListLike(collection, function (item) {
                itemTrackBy = _this._trackByFn(index, item);
                if (record === null || !looseIdentical(record.trackById, itemTrackBy)) {
                    record = _this._mismatch(record, item, itemTrackBy, index);
                    mayBeDirty = true;
                }
                else {
                    if (mayBeDirty) {
                        // TODO(misko): can we limit this to duplicates only?
                        record = _this._verifyReinsertion(record, item, itemTrackBy, index);
                    }
                    if (!looseIdentical(record.item, item))
                        _this._addIdentityChange(record, item);
                }
                record = record._next;
                index++;
            });
            this.length = index;
        }
        this._truncate(record);
        this.collection = collection;
        return this.isDirty;
    };
    Object.defineProperty(DefaultIterableDiffer.prototype, "isDirty", {
        /* CollectionChanges is considered dirty if it has any additions, moves, removals, or identity
         * changes.
         */
        get: function () {
            return this._additionsHead !== null || this._movesHead !== null ||
                this._removalsHead !== null || this._identityChangesHead !== null;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Reset the state of the change objects to show no changes. This means set previousKey to
     * currentKey, and clear all of the queues (additions, moves, removals).
     * Set the previousIndexes of moved and added items to their currentIndexes
     * Reset the list of additions, moves and removals
     *
     * @internal
     */
    DefaultIterableDiffer.prototype._reset = function () {
        if (this.isDirty) {
            var record = void 0;
            var nextRecord = void 0;
            for (record = this._previousItHead = this._itHead; record !== null; record = record._next) {
                record._nextPrevious = record._next;
            }
            for (record = this._additionsHead; record !== null; record = record._nextAdded) {
                record.previousIndex = record.currentIndex;
            }
            this._additionsHead = this._additionsTail = null;
            for (record = this._movesHead; record !== null; record = nextRecord) {
                record.previousIndex = record.currentIndex;
                nextRecord = record._nextMoved;
            }
            this._movesHead = this._movesTail = null;
            this._removalsHead = this._removalsTail = null;
            this._identityChangesHead = this._identityChangesTail = null;
            // TODO(vicb): when assert gets supported
            // assert(!this.isDirty);
        }
    };
    /**
     * This is the core function which handles differences between collections.
     *
     * - `record` is the record which we saw at this position last time. If null then it is a new
     *   item.
     * - `item` is the current item in the collection
     * - `index` is the position of the item in the collection
     *
     * @internal
     */
    DefaultIterableDiffer.prototype._mismatch = function (record, item, itemTrackBy, index) {
        // The previous record after which we will append the current one.
        var previousRecord;
        if (record === null) {
            previousRecord = this._itTail;
        }
        else {
            previousRecord = record._prev;
            // Remove the record from the collection since we know it does not match the item.
            this._remove(record);
        }
        // Attempt to see if we have seen the item before.
        record = this._linkedRecords === null ? null : this._linkedRecords.get(itemTrackBy, index);
        if (record !== null) {
            // We have seen this before, we need to move it forward in the collection.
            // But first we need to check if identity changed, so we can update in view if necessary
            if (!looseIdentical(record.item, item))
                this._addIdentityChange(record, item);
            this._moveAfter(record, previousRecord, index);
        }
        else {
            // Never seen it, check evicted list.
            record = this._unlinkedRecords === null ? null : this._unlinkedRecords.get(itemTrackBy, null);
            if (record !== null) {
                // It is an item which we have evicted earlier: reinsert it back into the list.
                // But first we need to check if identity changed, so we can update in view if necessary
                if (!looseIdentical(record.item, item))
                    this._addIdentityChange(record, item);
                this._reinsertAfter(record, previousRecord, index);
            }
            else {
                // It is a new item: add it.
                record =
                    this._addAfter(new IterableChangeRecord_(item, itemTrackBy), previousRecord, index);
            }
        }
        return record;
    };
    /**
     * This check is only needed if an array contains duplicates. (Short circuit of nothing dirty)
     *
     * Use case: `[a, a]` => `[b, a, a]`
     *
     * If we did not have this check then the insertion of `b` would:
     *   1) evict first `a`
     *   2) insert `b` at `0` index.
     *   3) leave `a` at index `1` as is. <-- this is wrong!
     *   3) reinsert `a` at index 2. <-- this is wrong!
     *
     * The correct behavior is:
     *   1) evict first `a`
     *   2) insert `b` at `0` index.
     *   3) reinsert `a` at index 1.
     *   3) move `a` at from `1` to `2`.
     *
     *
     * Double check that we have not evicted a duplicate item. We need to check if the item type may
     * have already been removed:
     * The insertion of b will evict the first 'a'. If we don't reinsert it now it will be reinserted
     * at the end. Which will show up as the two 'a's switching position. This is incorrect, since a
     * better way to think of it is as insert of 'b' rather then switch 'a' with 'b' and then add 'a'
     * at the end.
     *
     * @internal
     */
    DefaultIterableDiffer.prototype._verifyReinsertion = function (record, item, itemTrackBy, index) {
        var reinsertRecord = this._unlinkedRecords === null ? null : this._unlinkedRecords.get(itemTrackBy, null);
        if (reinsertRecord !== null) {
            record = this._reinsertAfter(reinsertRecord, record._prev, index);
        }
        else if (record.currentIndex != index) {
            record.currentIndex = index;
            this._addToMoves(record, index);
        }
        return record;
    };
    /**
     * Get rid of any excess {@link IterableChangeRecord_}s from the previous collection
     *
     * - `record` The first excess {@link IterableChangeRecord_}.
     *
     * @internal
     */
    DefaultIterableDiffer.prototype._truncate = function (record) {
        // Anything after that needs to be removed;
        while (record !== null) {
            var nextRecord = record._next;
            this._addToRemovals(this._unlink(record));
            record = nextRecord;
        }
        if (this._unlinkedRecords !== null) {
            this._unlinkedRecords.clear();
        }
        if (this._additionsTail !== null) {
            this._additionsTail._nextAdded = null;
        }
        if (this._movesTail !== null) {
            this._movesTail._nextMoved = null;
        }
        if (this._itTail !== null) {
            this._itTail._next = null;
        }
        if (this._removalsTail !== null) {
            this._removalsTail._nextRemoved = null;
        }
        if (this._identityChangesTail !== null) {
            this._identityChangesTail._nextIdentityChange = null;
        }
    };
    /** @internal */
    DefaultIterableDiffer.prototype._reinsertAfter = function (record, prevRecord, index) {
        if (this._unlinkedRecords !== null) {
            this._unlinkedRecords.remove(record);
        }
        var prev = record._prevRemoved;
        var next = record._nextRemoved;
        if (prev === null) {
            this._removalsHead = next;
        }
        else {
            prev._nextRemoved = next;
        }
        if (next === null) {
            this._removalsTail = prev;
        }
        else {
            next._prevRemoved = prev;
        }
        this._insertAfter(record, prevRecord, index);
        this._addToMoves(record, index);
        return record;
    };
    /** @internal */
    DefaultIterableDiffer.prototype._moveAfter = function (record, prevRecord, index) {
        this._unlink(record);
        this._insertAfter(record, prevRecord, index);
        this._addToMoves(record, index);
        return record;
    };
    /** @internal */
    DefaultIterableDiffer.prototype._addAfter = function (record, prevRecord, index) {
        this._insertAfter(record, prevRecord, index);
        if (this._additionsTail === null) {
            // TODO(vicb):
            // assert(this._additionsHead === null);
            this._additionsTail = this._additionsHead = record;
        }
        else {
            // TODO(vicb):
            // assert(_additionsTail._nextAdded === null);
            // assert(record._nextAdded === null);
            this._additionsTail = this._additionsTail._nextAdded = record;
        }
        return record;
    };
    /** @internal */
    DefaultIterableDiffer.prototype._insertAfter = function (record, prevRecord, index) {
        // TODO(vicb):
        // assert(record != prevRecord);
        // assert(record._next === null);
        // assert(record._prev === null);
        var next = prevRecord === null ? this._itHead : prevRecord._next;
        // TODO(vicb):
        // assert(next != record);
        // assert(prevRecord != record);
        record._next = next;
        record._prev = prevRecord;
        if (next === null) {
            this._itTail = record;
        }
        else {
            next._prev = record;
        }
        if (prevRecord === null) {
            this._itHead = record;
        }
        else {
            prevRecord._next = record;
        }
        if (this._linkedRecords === null) {
            this._linkedRecords = new _DuplicateMap();
        }
        this._linkedRecords.put(record);
        record.currentIndex = index;
        return record;
    };
    /** @internal */
    DefaultIterableDiffer.prototype._remove = function (record) {
        return this._addToRemovals(this._unlink(record));
    };
    /** @internal */
    DefaultIterableDiffer.prototype._unlink = function (record) {
        if (this._linkedRecords !== null) {
            this._linkedRecords.remove(record);
        }
        var prev = record._prev;
        var next = record._next;
        // TODO(vicb):
        // assert((record._prev = null) === null);
        // assert((record._next = null) === null);
        if (prev === null) {
            this._itHead = next;
        }
        else {
            prev._next = next;
        }
        if (next === null) {
            this._itTail = prev;
        }
        else {
            next._prev = prev;
        }
        return record;
    };
    /** @internal */
    DefaultIterableDiffer.prototype._addToMoves = function (record, toIndex) {
        // TODO(vicb):
        // assert(record._nextMoved === null);
        if (record.previousIndex === toIndex) {
            return record;
        }
        if (this._movesTail === null) {
            // TODO(vicb):
            // assert(_movesHead === null);
            this._movesTail = this._movesHead = record;
        }
        else {
            // TODO(vicb):
            // assert(_movesTail._nextMoved === null);
            this._movesTail = this._movesTail._nextMoved = record;
        }
        return record;
    };
    DefaultIterableDiffer.prototype._addToRemovals = function (record) {
        if (this._unlinkedRecords === null) {
            this._unlinkedRecords = new _DuplicateMap();
        }
        this._unlinkedRecords.put(record);
        record.currentIndex = null;
        record._nextRemoved = null;
        if (this._removalsTail === null) {
            // TODO(vicb):
            // assert(_removalsHead === null);
            this._removalsTail = this._removalsHead = record;
            record._prevRemoved = null;
        }
        else {
            // TODO(vicb):
            // assert(_removalsTail._nextRemoved === null);
            // assert(record._nextRemoved === null);
            record._prevRemoved = this._removalsTail;
            this._removalsTail = this._removalsTail._nextRemoved = record;
        }
        return record;
    };
    /** @internal */
    DefaultIterableDiffer.prototype._addIdentityChange = function (record, item) {
        record.item = item;
        if (this._identityChangesTail === null) {
            this._identityChangesTail = this._identityChangesHead = record;
        }
        else {
            this._identityChangesTail = this._identityChangesTail._nextIdentityChange = record;
        }
        return record;
    };
    return DefaultIterableDiffer;
}());
export { DefaultIterableDiffer };
var IterableChangeRecord_ = /** @class */ (function () {
    function IterableChangeRecord_(item, trackById) {
        this.item = item;
        this.trackById = trackById;
        this.currentIndex = null;
        this.previousIndex = null;
        /** @internal */
        this._nextPrevious = null;
        /** @internal */
        this._prev = null;
        /** @internal */
        this._next = null;
        /** @internal */
        this._prevDup = null;
        /** @internal */
        this._nextDup = null;
        /** @internal */
        this._prevRemoved = null;
        /** @internal */
        this._nextRemoved = null;
        /** @internal */
        this._nextAdded = null;
        /** @internal */
        this._nextMoved = null;
        /** @internal */
        this._nextIdentityChange = null;
    }
    return IterableChangeRecord_;
}());
export { IterableChangeRecord_ };
// A linked list of CollectionChangeRecords with the same IterableChangeRecord_.item
var _DuplicateItemRecordList = /** @class */ (function () {
    function _DuplicateItemRecordList() {
        /** @internal */
        this._head = null;
        /** @internal */
        this._tail = null;
    }
    /**
     * Append the record to the list of duplicates.
     *
     * Note: by design all records in the list of duplicates hold the same value in record.item.
     */
    _DuplicateItemRecordList.prototype.add = function (record) {
        if (this._head === null) {
            this._head = this._tail = record;
            record._nextDup = null;
            record._prevDup = null;
        }
        else {
            // TODO(vicb):
            // assert(record.item ==  _head.item ||
            //       record.item is num && record.item.isNaN && _head.item is num && _head.item.isNaN);
            this._tail._nextDup = record;
            record._prevDup = this._tail;
            record._nextDup = null;
            this._tail = record;
        }
    };
    // Returns a IterableChangeRecord_ having IterableChangeRecord_.trackById == trackById and
    // IterableChangeRecord_.currentIndex >= atOrAfterIndex
    _DuplicateItemRecordList.prototype.get = function (trackById, atOrAfterIndex) {
        var record;
        for (record = this._head; record !== null; record = record._nextDup) {
            if ((atOrAfterIndex === null || atOrAfterIndex <= record.currentIndex) &&
                looseIdentical(record.trackById, trackById)) {
                return record;
            }
        }
        return null;
    };
    /**
     * Remove one {@link IterableChangeRecord_} from the list of duplicates.
     *
     * Returns whether the list of duplicates is empty.
     */
    _DuplicateItemRecordList.prototype.remove = function (record) {
        // TODO(vicb):
        // assert(() {
        //  // verify that the record being removed is in the list.
        //  for (IterableChangeRecord_ cursor = _head; cursor != null; cursor = cursor._nextDup) {
        //    if (identical(cursor, record)) return true;
        //  }
        //  return false;
        //});
        var prev = record._prevDup;
        var next = record._nextDup;
        if (prev === null) {
            this._head = next;
        }
        else {
            prev._nextDup = next;
        }
        if (next === null) {
            this._tail = prev;
        }
        else {
            next._prevDup = prev;
        }
        return this._head === null;
    };
    return _DuplicateItemRecordList;
}());
var _DuplicateMap = /** @class */ (function () {
    function _DuplicateMap() {
        this.map = new Map();
    }
    _DuplicateMap.prototype.put = function (record) {
        var key = record.trackById;
        var duplicates = this.map.get(key);
        if (!duplicates) {
            duplicates = new _DuplicateItemRecordList();
            this.map.set(key, duplicates);
        }
        duplicates.add(record);
    };
    /**
     * Retrieve the `value` using key. Because the IterableChangeRecord_ value may be one which we
     * have already iterated over, we use the `atOrAfterIndex` to pretend it is not there.
     *
     * Use case: `[a, b, c, a, a]` if we are at index `3` which is the second `a` then asking if we
     * have any more `a`s needs to return the second `a`.
     */
    _DuplicateMap.prototype.get = function (trackById, atOrAfterIndex) {
        var key = trackById;
        var recordList = this.map.get(key);
        return recordList ? recordList.get(trackById, atOrAfterIndex) : null;
    };
    /**
     * Removes a {@link IterableChangeRecord_} from the list of duplicates.
     *
     * The list of duplicates also is removed from the map if it gets empty.
     */
    _DuplicateMap.prototype.remove = function (record) {
        var key = record.trackById;
        var recordList = this.map.get(key);
        // Remove the list of duplicates when it gets empty
        if (recordList.remove(record)) {
            this.map.delete(key);
        }
        return record;
    };
    Object.defineProperty(_DuplicateMap.prototype, "isEmpty", {
        get: function () {
            return this.map.size === 0;
        },
        enumerable: true,
        configurable: true
    });
    _DuplicateMap.prototype.clear = function () {
        this.map.clear();
    };
    return _DuplicateMap;
}());
function getPreviousIndex(item, addRemoveOffset, moveOffsets) {
    var previousIndex = item.previousIndex;
    if (previousIndex === null)
        return previousIndex;
    var moveOffset = 0;
    if (moveOffsets && previousIndex < moveOffsets.length) {
        moveOffset = moveOffsets[previousIndex];
    }
    return previousIndex + addRemoveOffset + moveOffset;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVmYXVsdF9pdGVyYWJsZV9kaWZmZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9jaGFuZ2VfZGV0ZWN0aW9uL2RpZmZlcnMvZGVmYXVsdF9pdGVyYWJsZV9kaWZmZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLGNBQWMsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQ3JELE9BQU8sRUFBQyxTQUFTLEVBQUMsTUFBTSxzQkFBc0IsQ0FBQztBQUMvQyxPQUFPLEVBQUMsa0JBQWtCLEVBQUUsZUFBZSxFQUFDLE1BQU0sMEJBQTBCLENBQUM7QUFLN0U7SUFDRTtJQUFlLENBQUM7SUFDaEIsK0NBQVEsR0FBUixVQUFTLEdBQTBCO1FBQ2pDLE9BQU8sa0JBQWtCLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDakMsQ0FBQztJQUVELDZDQUFNLEdBQU4sVUFBVSxTQUE4QjtRQUN0QyxPQUFPLElBQUkscUJBQXFCLENBQUksU0FBUyxDQUFDLENBQUM7SUFDakQsQ0FBQztJQUNILG1DQUFDO0FBQUQsQ0FBQyxBQVRELElBU0M7O0FBRUQsSUFBTSxlQUFlLEdBQUcsVUFBQyxLQUFhLEVBQUUsSUFBUyxJQUFLLE9BQUEsSUFBSSxFQUFKLENBQUksQ0FBQztBQUUzRDs7O0dBR0c7QUFDSDtJQXNCRSwrQkFBWSxTQUE4QjtRQXJCMUIsV0FBTSxHQUFXLENBQUMsQ0FBQztRQUduQywwRkFBMEY7UUFDbEYsbUJBQWMsR0FBMEIsSUFBSSxDQUFDO1FBQ3JELG1GQUFtRjtRQUMzRSxxQkFBZ0IsR0FBMEIsSUFBSSxDQUFDO1FBQy9DLG9CQUFlLEdBQWtDLElBQUksQ0FBQztRQUN0RCxZQUFPLEdBQWtDLElBQUksQ0FBQztRQUM5QyxZQUFPLEdBQWtDLElBQUksQ0FBQztRQUM5QyxtQkFBYyxHQUFrQyxJQUFJLENBQUM7UUFD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RztJQUNILDhCQUFNLEdBQU4sVUFBTyxNQUFnQztRQUNyQyxJQUFNLEdBQUcsR0FBRyxNQUFNLENBQUMsU0FBUyxDQUFDO1FBQzdCLElBQU0sVUFBVSxHQUFnQyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUUsQ0FBQztRQUNuRSxtREFBbUQ7UUFDbkQsSUFBSSxVQUFVLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxFQUFFO1lBQzdCLElBQUksQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1NBQ3RCO1FBQ0QsT0FBTyxNQUFNLENBQUM7SUFDaEIsQ0FBQztJQUVELHNCQUFJLGtDQUFPO2FBQVg7WUFDRSxPQUFPLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxLQUFLLENBQUMsQ0FBQztRQUM3QixDQUFDOzs7T0FBQTtJQUVELDZCQUFLLEdBQUw7UUFDRSxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssRUFBRSxDQUFDO0lBQ25CLENBQUM7SUFDSCxvQkFBQztBQUFELENBQUMsQUFqREQsSUFpREM7QUFFRCxTQUFTLGdCQUFnQixDQUFDLElBQVMsRUFBRSxlQUF1QixFQUFFLFdBQTBCO0lBQ3RGLElBQU0sYUFBYSxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUM7SUFDekMsSUFBSSxhQUFhLEtBQUssSUFBSTtRQUFFLE9BQU8sYUFBYSxDQUFDO0lBQ2pELElBQUksVUFBVSxHQUFHLENBQUMsQ0FBQztJQUNuQixJQUFJLFdBQVcsSUFBSSxhQUFhLEdBQUcsV0FBVyxDQUFDLE1BQU0sRUFBRTtRQUNyRCxVQUFVLEdBQUcsV0FBVyxDQUFDLGFBQWEsQ0FBQyxDQUFDO0tBQ3pDO0lBQ0QsT0FBTyxhQUFhLEdBQUcsZUFBZSxHQUFHLFVBQVUsQ0FBQztBQUN0RCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge2xvb3NlSWRlbnRpY2FsfSBmcm9tICcuLi8uLi91dGlsL2NvbXBhcmlzb24nO1xuaW1wb3J0IHtzdHJpbmdpZnl9IGZyb20gJy4uLy4uL3V0aWwvc3RyaW5naWZ5JztcbmltcG9ydCB7aXNMaXN0TGlrZUl0ZXJhYmxlLCBpdGVyYXRlTGlzdExpa2V9IGZyb20gJy4uL2NoYW5nZV9kZXRlY3Rpb25fdXRpbCc7XG5cbmltcG9ydCB7SXRlcmFibGVDaGFuZ2VSZWNvcmQsIEl0ZXJhYmxlQ2hhbmdlcywgSXRlcmFibGVEaWZmZXIsIEl0ZXJhYmxlRGlmZmVyRmFjdG9yeSwgTmdJdGVyYWJsZSwgVHJhY2tCeUZ1bmN0aW9ufSBmcm9tICcuL2l0ZXJhYmxlX2RpZmZlcnMnO1xuXG5cbmV4cG9ydCBjbGFzcyBEZWZhdWx0SXRlcmFibGVEaWZmZXJGYWN0b3J5IGltcGxlbWVudHMgSXRlcmFibGVEaWZmZXJGYWN0b3J5IHtcbiAgY29uc3RydWN0b3IoKSB7fVxuICBzdXBwb3J0cyhvYmo6IE9iamVjdHxudWxsfHVuZGVmaW5lZCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiBpc0xpc3RMaWtlSXRlcmFibGUob2JqKTtcbiAgfVxuXG4gIGNyZWF0ZTxWPih0cmFja0J5Rm4/OiBUcmFja0J5RnVuY3Rpb248Vj4pOiBEZWZhdWx0SXRlcmFibGVEaWZmZXI8Vj4ge1xuICAgIHJldHVybiBuZXcgRGVmYXVsdEl0ZXJhYmxlRGlmZmVyPFY+KHRyYWNrQnlGbik7XG4gIH1cbn1cblxuY29uc3QgdHJhY2tCeUlkZW50aXR5ID0gKGluZGV4OiBudW1iZXIsIGl0ZW06IGFueSkgPT4gaXRlbTtcblxuLyoqXG4gKiBAZGVwcmVjYXRlZCB2NC4wLjAgLSBTaG91bGQgbm90IGJlIHBhcnQgb2YgcHVibGljIEFQSS5cbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGNsYXNzIERlZmF1bHRJdGVyYWJsZURpZmZlcjxWPiBpbXBsZW1lbnRzIEl0ZXJhYmxlRGlmZmVyPFY+LCBJdGVyYWJsZUNoYW5nZXM8Vj4ge1xuICBwdWJsaWMgcmVhZG9ubHkgbGVuZ3RoOiBudW1iZXIgPSAwO1xuICAvLyBUT0RPKGlzc3VlLzI0NTcxKTogcmVtb3ZlICchJy5cbiAgcHVibGljIHJlYWRvbmx5IGNvbGxlY3Rpb24hOiBWW118SXRlcmFibGU8Vj58bnVsbDtcbiAgLy8gS2VlcHMgdHJhY2sgb2YgdGhlIHVzZWQgcmVjb3JkcyBhdCBhbnkgcG9pbnQgaW4gdGltZSAoZHVyaW5nICYgYWNyb3NzIGBfY2hlY2soKWAgY2FsbHMpXG4gIHByaXZhdGUgX2xpbmtlZFJlY29yZHM6IF9EdXBsaWNhdGVNYXA8Vj58bnVsbCA9IG51bGw7XG4gIC8vIEtlZXBzIHRyYWNrIG9mIHRoZSByZW1vdmVkIHJlY29yZHMgYXQgYW55IHBvaW50IGluIHRpbWUgZHVyaW5nIGBfY2hlY2soKWAgY2FsbHMuXG4gIHByaXZhdGUgX3VubGlua2VkUmVjb3JkczogX0R1cGxpY2F0ZU1hcDxWPnxudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBfcHJldmlvdXNJdEhlYWQ6IEl0ZXJhYmxlQ2hhbmdlUmVjb3JkXzxWPnxudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBfaXRIZWFkOiBJdGVyYWJsZUNoYW5nZVJlY29yZF88Vj58bnVsbCA9IG51bGw7XG4gIHByaXZhdGUgX2l0VGFpbDogSXRlcmFibGVDaGFuZ2VSZWNvcmRfPFY+fG51bGwgPSBudWxsO1xuICBwcml2YXRlIF9hZGRpdGlvbnNIZWFkOiBJdGVyYWJsZUNoYW5nZVJlY29yZF88Vj58bnVsbCA9IG51bGw7XG4gIHByaXZhdGUgX2FkZGl0aW9uc1RhaWw6IEl0ZXJhYmxlQ2hhbmdlUmVjb3JkXzxWPnxudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBfbW92ZXNIZWFkOiBJdGVyYWJsZUNoYW5nZVJlY29yZF88Vj58bnVsbCA9IG51bGw7XG4gIHByaXZhdGUgX21vdmVzVGFpbDogSXRlcmFibGVDaGFuZ2VSZWNvcmRfPFY+fG51bGwgPSBudWxsO1xuICBwcml2YXRlIF9yZW1vdmFsc0hlYWQ6IEl0ZXJhYmxlQ2hhbmdlUmVjb3JkXzxWPnxudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBfcmVtb3ZhbHNUYWlsOiBJdGVyYWJsZUNoYW5nZVJlY29yZF88Vj58bnVsbCA9IG51bGw7XG4gIC8vIEtlZXBzIHRyYWNrIG9mIHJlY29yZHMgd2hlcmUgY3VzdG9tIHRyYWNrIGJ5IGlzIHRoZSBzYW1lLCBidXQgaXRlbSBpZGVudGl0eSBoYXMgY2hhbmdlZFxuICBwcml2YXRlIF9pZGVudGl0eUNoYW5nZXNIZWFkOiBJdGVyYWJsZUNoYW5nZVJlY29yZF88Vj58bnVsbCA9IG51bGw7XG4gIHByaXZhdGUgX2lkZW50aXR5Q2hhbmdlc1RhaWw6IEl0ZXJhYmxlQ2hhbmdlUmVjb3JkXzxWPnxudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBfdHJhY2tCeUZuOiBUcmFja0J5RnVuY3Rpb248Vj47XG5cbiAgY29uc3RydWN0b3IodHJhY2tCeUZuPzogVHJhY2tCeUZ1bmN0aW9uPFY+KSB7XG4gICAgdGhpcy5fdHJhY2tCeUZuID0gdHJhY2tCeUZuIHx8IHRyYWNrQnlJZGVudGl0eTtcbiAgfVxuXG4gIGZvckVhY2hJdGVtKGZuOiAocmVjb3JkOiBJdGVyYWJsZUNoYW5nZVJlY29yZF88Vj4pID0+IHZvaWQpIHtcbiAgICBsZXQgcmVjb3JkOiBJdGVyYWJsZUNoYW5nZVJlY29yZF88Vj58bnVsbDtcbiAgICBmb3IgKHJlY29yZCA9IHRoaXMuX2l0SGVhZDsgcmVjb3JkICE9PSBudWxsOyByZWNvcmQgPSByZWNvcmQuX25leHQpIHtcbiAgICAgIGZuKHJlY29yZCk7XG4gICAgfVxuICB9XG5cbiAgZm9yRWFjaE9wZXJhdGlvbihcbiAgICAgIGZuOiAoaXRlbTogSXRlcmFibGVDaGFuZ2VSZWNvcmQ8Vj4sIHByZXZpb3VzSW5kZXg6IG51bWJlcnxudWxsLCBjdXJyZW50SW5kZXg6IG51bWJlcnxudWxsKSA9PlxuICAgICAgICAgIHZvaWQpIHtcbiAgICBsZXQgbmV4dEl0ID0gdGhpcy5faXRIZWFkO1xuICAgIGxldCBuZXh0UmVtb3ZlID0gdGhpcy5fcmVtb3ZhbHNIZWFkO1xuICAgIGxldCBhZGRSZW1vdmVPZmZzZXQgPSAwO1xuICAgIGxldCBtb3ZlT2Zmc2V0czogbnVtYmVyW118bnVsbCA9IG51bGw7XG4gICAgd2hpbGUgKG5leHRJdCB8fCBuZXh0UmVtb3ZlKSB7XG4gICAgICAvLyBGaWd1cmUgb3V0IHdoaWNoIGlzIHRoZSBuZXh0IHJlY29yZCB0byBwcm9jZXNzXG4gICAgICAvLyBPcmRlcjogcmVtb3ZlLCBhZGQsIG1vdmVcbiAgICAgIGNvbnN0IHJlY29yZDogSXRlcmFibGVDaGFuZ2VSZWNvcmQ8Vj4gPSAhbmV4dFJlbW92ZSB8fFxuICAgICAgICAgICAgICBuZXh0SXQgJiZcbiAgICAgICAgICAgICAgICAgIG5leHRJdC5jdXJyZW50SW5kZXghIDxcbiAgICAgICAgICAgICAgICAgICAgICBnZXRQcmV2aW91c0luZGV4KG5leHRSZW1vdmUsIGFkZFJlbW92ZU9mZnNldCwgbW92ZU9mZnNldHMpID9cbiAgICAgICAgICBuZXh0SXQhIDpcbiAgICAgICAgICBuZXh0UmVtb3ZlO1xuICAgICAgY29uc3QgYWRqUHJldmlvdXNJbmRleCA9IGdldFByZXZpb3VzSW5kZXgocmVjb3JkLCBhZGRSZW1vdmVPZmZzZXQsIG1vdmVPZmZzZXRzKTtcbiAgICAgIGNvbnN0IGN1cnJlbnRJbmRleCA9IHJlY29yZC5jdXJyZW50SW5kZXg7XG5cbiAgICAgIC8vIGNvbnN1bWUgdGhlIGl0ZW0sIGFuZCBhZGp1c3QgdGhlIGFkZFJlbW92ZU9mZnNldCBhbmQgdXBkYXRlIG1vdmVEaXN0YW5jZSBpZiBuZWNlc3NhcnlcbiAgICAgIGlmIChyZWNvcmQgPT09IG5leHRSZW1vdmUpIHtcbiAgICAgICAgYWRkUmVtb3ZlT2Zmc2V0LS07XG4gICAgICAgIG5leHRSZW1vdmUgPSBuZXh0UmVtb3ZlLl9uZXh0UmVtb3ZlZDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG5leHRJdCA9IG5leHRJdCEuX25leHQ7XG4gICAgICAgIGlmIChyZWNvcmQucHJldmlvdXNJbmRleCA9PSBudWxsKSB7XG4gICAgICAgICAgYWRkUmVtb3ZlT2Zmc2V0Kys7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gSU5WQVJJQU5UOiAgY3VycmVudEluZGV4IDwgcHJldmlvdXNJbmRleFxuICAgICAgICAgIGlmICghbW92ZU9mZnNldHMpIG1vdmVPZmZzZXRzID0gW107XG4gICAgICAgICAgY29uc3QgbG9jYWxNb3ZlUHJldmlvdXNJbmRleCA9IGFkalByZXZpb3VzSW5kZXggLSBhZGRSZW1vdmVPZmZzZXQ7XG4gICAgICAgICAgY29uc3QgbG9jYWxDdXJyZW50SW5kZXggPSBjdXJyZW50SW5kZXghIC0gYWRkUmVtb3ZlT2Zmc2V0O1xuICAgICAgICAgIGlmIChsb2NhbE1vdmVQcmV2aW91c0luZGV4ICE9IGxvY2FsQ3VycmVudEluZGV4KSB7XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxvY2FsTW92ZVByZXZpb3VzSW5kZXg7IGkrKykge1xuICAgICAgICAgICAgICBjb25zdCBvZmZzZXQgPSBpIDwgbW92ZU9mZnNldHMubGVuZ3RoID8gbW92ZU9mZnNldHNbaV0gOiAobW92ZU9mZnNldHNbaV0gPSAwKTtcbiAgICAgICAgICAgICAgY29uc3QgaW5kZXggPSBvZmZzZXQgKyBpO1xuICAgICAgICAgICAgICBpZiAobG9jYWxDdXJyZW50SW5kZXggPD0gaW5kZXggJiYgaW5kZXggPCBsb2NhbE1vdmVQcmV2aW91c0luZGV4KSB7XG4gICAgICAgICAgICAgICAgbW92ZU9mZnNldHNbaV0gPSBvZmZzZXQgKyAxO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBwcmV2aW91c0luZGV4ID0gcmVjb3JkLnByZXZpb3VzSW5kZXg7XG4gICAgICAgICAgICBtb3ZlT2Zmc2V0c1twcmV2aW91c0luZGV4XSA9IGxvY2FsQ3VycmVudEluZGV4IC0gbG9jYWxNb3ZlUHJldmlvdXNJbmRleDtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKGFkalByZXZpb3VzSW5kZXggIT09IGN1cnJlbnRJbmRleCkge1xuICAgICAgICBmbihyZWNvcmQsIGFkalByZXZpb3VzSW5kZXgsIGN1cnJlbnRJbmRleCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgZm9yRWFjaFByZXZpb3VzSXRlbShmbjogKHJlY29yZDogSXRlcmFibGVDaGFuZ2VSZWNvcmRfPFY+KSA9PiB2b2lkKSB7XG4gICAgbGV0IHJlY29yZDogSXRlcmFibGVDaGFuZ2VSZWNvcmRfPFY+fG51bGw7XG4gICAgZm9yIChyZWNvcmQgPSB0aGlzLl9wcmV2aW91c0l0SGVhZDsgcmVjb3JkICE9PSBudWxsOyByZWNvcmQgPSByZWNvcmQuX25leHRQcmV2aW91cykge1xuICAgICAgZm4ocmVjb3JkKTtcbiAgICB9XG4gIH1cblxuICBmb3JFYWNoQWRkZWRJdGVtKGZuOiAocmVjb3JkOiBJdGVyYWJsZUNoYW5nZVJlY29yZF88Vj4pID0+IHZvaWQpIHtcbiAgICBsZXQgcmVjb3JkOiBJdGVyYWJsZUNoYW5nZVJlY29yZF88Vj58bnVsbDtcbiAgICBmb3IgKHJlY29yZCA9IHRoaXMuX2FkZGl0aW9uc0hlYWQ7IHJlY29yZCAhPT0gbnVsbDsgcmVjb3JkID0gcmVjb3JkLl9uZXh0QWRkZWQpIHtcbiAgICAgIGZuKHJlY29yZCk7XG4gICAgfVxuICB9XG5cbiAgZm9yRWFjaE1vdmVkSXRlbShmbjogKHJlY29yZDogSXRlcmFibGVDaGFuZ2VSZWNvcmRfPFY+KSA9PiB2b2lkKSB7XG4gICAgbGV0IHJlY29yZDogSXRlcmFibGVDaGFuZ2VSZWNvcmRfPFY+fG51bGw7XG4gICAgZm9yIChyZWNvcmQgPSB0aGlzLl9tb3Zlc0hlYWQ7IHJlY29yZCAhPT0gbnVsbDsgcmVjb3JkID0gcmVjb3JkLl9uZXh0TW92ZWQpIHtcbiAgICAgIGZuKHJlY29yZCk7XG4gICAgfVxuICB9XG5cbiAgZm9yRWFjaFJlbW92ZWRJdGVtKGZuOiAocmVjb3JkOiBJdGVyYWJsZUNoYW5nZVJlY29yZF88Vj4pID0+IHZvaWQpIHtcbiAgICBsZXQgcmVjb3JkOiBJdGVyYWJsZUNoYW5nZVJlY29yZF88Vj58bnVsbDtcbiAgICBmb3IgKHJlY29yZCA9IHRoaXMuX3JlbW92YWxzSGVhZDsgcmVjb3JkICE9PSBudWxsOyByZWNvcmQgPSByZWNvcmQuX25leHRSZW1vdmVkKSB7XG4gICAgICBmbihyZWNvcmQpO1xuICAgIH1cbiAgfVxuXG4gIGZvckVhY2hJZGVudGl0eUNoYW5nZShmbjogKHJlY29yZDogSXRlcmFibGVDaGFuZ2VSZWNvcmRfPFY+KSA9PiB2b2lkKSB7XG4gICAgbGV0IHJlY29yZDogSXRlcmFibGVDaGFuZ2VSZWNvcmRfPFY+fG51bGw7XG4gICAgZm9yIChyZWNvcmQgPSB0aGlzLl9pZGVudGl0eUNoYW5nZXNIZWFkOyByZWNvcmQgIT09IG51bGw7IHJlY29yZCA9IHJlY29yZC5fbmV4dElkZW50aXR5Q2hhbmdlKSB7XG4gICAgICBmbihyZWNvcmQpO1xuICAgIH1cbiAgfVxuXG4gIGRpZmYoY29sbGVjdGlvbjogTmdJdGVyYWJsZTxWPnxudWxsfHVuZGVmaW5lZCk6IERlZmF1bHRJdGVyYWJsZURpZmZlcjxWPnxudWxsIHtcbiAgICBpZiAoY29sbGVjdGlvbiA9PSBudWxsKSBjb2xsZWN0aW9uID0gW107XG4gICAgaWYgKCFpc0xpc3RMaWtlSXRlcmFibGUoY29sbGVjdGlvbikpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICBgRXJyb3IgdHJ5aW5nIHRvIGRpZmYgJyR7c3RyaW5naWZ5KGNvbGxlY3Rpb24pfScuIE9ubHkgYXJyYXlzIGFuZCBpdGVyYWJsZXMgYXJlIGFsbG93ZWRgKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5jaGVjayhjb2xsZWN0aW9uKSkge1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgfVxuXG4gIG9uRGVzdHJveSgpIHt9XG5cbiAgY2hlY2soY29sbGVjdGlvbjogTmdJdGVyYWJsZTxWPik6IGJvb2xlYW4ge1xuICAgIHRoaXMuX3Jlc2V0KCk7XG5cbiAgICBsZXQgcmVjb3JkOiBJdGVyYWJsZUNoYW5nZVJlY29yZF88Vj58bnVsbCA9IHRoaXMuX2l0SGVhZDtcbiAgICBsZXQgbWF5QmVEaXJ0eTogYm9vbGVhbiA9IGZhbHNlO1xuICAgIGxldCBpbmRleDogbnVtYmVyO1xuICAgIGxldCBpdGVtOiBWO1xuICAgIGxldCBpdGVtVHJhY2tCeTogYW55O1xuICAgIGlmIChBcnJheS5pc0FycmF5KGNvbGxlY3Rpb24pKSB7XG4gICAgICAodGhpcyBhcyB7bGVuZ3RoOiBudW1iZXJ9KS5sZW5ndGggPSBjb2xsZWN0aW9uLmxlbmd0aDtcblxuICAgICAgZm9yIChsZXQgaW5kZXggPSAwOyBpbmRleCA8IHRoaXMubGVuZ3RoOyBpbmRleCsrKSB7XG4gICAgICAgIGl0ZW0gPSBjb2xsZWN0aW9uW2luZGV4XTtcbiAgICAgICAgaXRlbVRyYWNrQnkgPSB0aGlzLl90cmFja0J5Rm4oaW5kZXgsIGl0ZW0pO1xuICAgICAgICBpZiAocmVjb3JkID09PSBudWxsIHx8ICFsb29zZUlkZW50aWNhbChyZWNvcmQudHJhY2tCeUlkLCBpdGVtVHJhY2tCeSkpIHtcbiAgICAgICAgICByZWNvcmQgPSB0aGlzLl9taXNtYXRjaChyZWNvcmQsIGl0ZW0sIGl0ZW1UcmFja0J5LCBpbmRleCk7XG4gICAgICAgICAgbWF5QmVEaXJ0eSA9IHRydWU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaWYgKG1heUJlRGlydHkpIHtcbiAgICAgICAgICAgIC8vIFRPRE8obWlza28pOiBjYW4gd2UgbGltaXQgdGhpcyB0byBkdXBsaWNhdGVzIG9ubHk/XG4gICAgICAgICAgICByZWNvcmQgPSB0aGlzLl92ZXJpZnlSZWluc2VydGlvbihyZWNvcmQsIGl0ZW0sIGl0ZW1UcmFja0J5LCBpbmRleCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmICghbG9vc2VJZGVudGljYWwocmVjb3JkLml0ZW0sIGl0ZW0pKSB0aGlzLl9hZGRJZGVudGl0eUNoYW5nZShyZWNvcmQsIGl0ZW0pO1xuICAgICAgICB9XG5cbiAgICAgICAgcmVjb3JkID0gcmVjb3JkLl9uZXh0O1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBpbmRleCA9IDA7XG4gICAgICBpdGVyYXRlTGlzdExpa2UoY29sbGVjdGlvbiwgKGl0ZW06IFYpID0+IHtcbiAgICAgICAgaXRlbVRyYWNrQnkgPSB0aGlzLl90cmFja0J5Rm4oaW5kZXgsIGl0ZW0pO1xuICAgICAgICBpZiAocmVjb3JkID09PSBudWxsIHx8ICFsb29zZUlkZW50aWNhbChyZWNvcmQudHJhY2tCeUlkLCBpdGVtVHJhY2tCeSkpIHtcbiAgICAgICAgICByZWNvcmQgPSB0aGlzLl9taXNtYXRjaChyZWNvcmQsIGl0ZW0sIGl0ZW1UcmFja0J5LCBpbmRleCk7XG4gICAgICAgICAgbWF5QmVEaXJ0eSA9IHRydWU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaWYgKG1heUJlRGlydHkpIHtcbiAgICAgICAgICAgIC8vIFRPRE8obWlza28pOiBjYW4gd2UgbGltaXQgdGhpcyB0byBkdXBsaWNhdGVzIG9ubHk/XG4gICAgICAgICAgICByZWNvcmQgPSB0aGlzLl92ZXJpZnlSZWluc2VydGlvbihyZWNvcmQsIGl0ZW0sIGl0ZW1UcmFja0J5LCBpbmRleCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmICghbG9vc2VJZGVudGljYWwocmVjb3JkLml0ZW0sIGl0ZW0pKSB0aGlzLl9hZGRJZGVudGl0eUNoYW5nZShyZWNvcmQsIGl0ZW0pO1xuICAgICAgICB9XG4gICAgICAgIHJlY29yZCA9IHJlY29yZC5fbmV4dDtcbiAgICAgICAgaW5kZXgrKztcbiAgICAgIH0pO1xuICAgICAgKHRoaXMgYXMge2xlbmd0aDogbnVtYmVyfSkubGVuZ3RoID0gaW5kZXg7XG4gICAgfVxuXG4gICAgdGhpcy5fdHJ1bmNhdGUocmVjb3JkKTtcbiAgICAodGhpcyBhcyB7Y29sbGVjdGlvbjogVltdIHwgSXRlcmFibGU8Vj59KS5jb2xsZWN0aW9uID0gY29sbGVjdGlvbjtcbiAgICByZXR1cm4gdGhpcy5pc0RpcnR5O1xuICB9XG5cbiAgLyogQ29sbGVjdGlvbkNoYW5nZXMgaXMgY29uc2lkZXJlZCBkaXJ0eSBpZiBpdCBoYXMgYW55IGFkZGl0aW9ucywgbW92ZXMsIHJlbW92YWxzLCBvciBpZGVudGl0eVxuICAgKiBjaGFuZ2VzLlxuICAgKi9cbiAgZ2V0IGlzRGlydHkoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuX2FkZGl0aW9uc0hlYWQgIT09IG51bGwgfHwgdGhpcy5fbW92ZXNIZWFkICE9PSBudWxsIHx8XG4gICAgICAgIHRoaXMuX3JlbW92YWxzSGVhZCAhPT0gbnVsbCB8fCB0aGlzLl9pZGVudGl0eUNoYW5nZXNIZWFkICE9PSBudWxsO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlc2V0IHRoZSBzdGF0ZSBvZiB0aGUgY2hhbmdlIG9iamVjdHMgdG8gc2hvdyBubyBjaGFuZ2VzLiBUaGlzIG1lYW5zIHNldCBwcmV2aW91c0tleSB0b1xuICAgKiBjdXJyZW50S2V5LCBhbmQgY2xlYXIgYWxsIG9mIHRoZSBxdWV1ZXMgKGFkZGl0aW9ucywgbW92ZXMsIHJlbW92YWxzKS5cbiAgICogU2V0IHRoZSBwcmV2aW91c0luZGV4ZXMgb2YgbW92ZWQgYW5kIGFkZGVkIGl0ZW1zIHRvIHRoZWlyIGN1cnJlbnRJbmRleGVzXG4gICAqIFJlc2V0IHRoZSBsaXN0IG9mIGFkZGl0aW9ucywgbW92ZXMgYW5kIHJlbW92YWxzXG4gICAqXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgX3Jlc2V0KCkge1xuICAgIGlmICh0aGlzLmlzRGlydHkpIHtcbiAgICAgIGxldCByZWNvcmQ6IEl0ZXJhYmxlQ2hhbmdlUmVjb3JkXzxWPnxudWxsO1xuICAgICAgbGV0IG5leHRSZWNvcmQ6IEl0ZXJhYmxlQ2hhbmdlUmVjb3JkXzxWPnxudWxsO1xuXG4gICAgICBmb3IgKHJlY29yZCA9IHRoaXMuX3ByZXZpb3VzSXRIZWFkID0gdGhpcy5faXRIZWFkOyByZWNvcmQgIT09IG51bGw7IHJlY29yZCA9IHJlY29yZC5fbmV4dCkge1xuICAgICAgICByZWNvcmQuX25leHRQcmV2aW91cyA9IHJlY29yZC5fbmV4dDtcbiAgICAgIH1cblxuICAgICAgZm9yIChyZWNvcmQgPSB0aGlzLl9hZGRpdGlvbnNIZWFkOyByZWNvcmQgIT09IG51bGw7IHJlY29yZCA9IHJlY29yZC5fbmV4dEFkZGVkKSB7XG4gICAgICAgIHJlY29yZC5wcmV2aW91c0luZGV4ID0gcmVjb3JkLmN1cnJlbnRJbmRleDtcbiAgICAgIH1cbiAgICAgIHRoaXMuX2FkZGl0aW9uc0hlYWQgPSB0aGlzLl9hZGRpdGlvbnNUYWlsID0gbnVsbDtcblxuICAgICAgZm9yIChyZWNvcmQgPSB0aGlzLl9tb3Zlc0hlYWQ7IHJlY29yZCAhPT0gbnVsbDsgcmVjb3JkID0gbmV4dFJlY29yZCkge1xuICAgICAgICByZWNvcmQucHJldmlvdXNJbmRleCA9IHJlY29yZC5jdXJyZW50SW5kZXg7XG4gICAgICAgIG5leHRSZWNvcmQgPSByZWNvcmQuX25leHRNb3ZlZDtcbiAgICAgIH1cbiAgICAgIHRoaXMuX21vdmVzSGVhZCA9IHRoaXMuX21vdmVzVGFpbCA9IG51bGw7XG4gICAgICB0aGlzLl9yZW1vdmFsc0hlYWQgPSB0aGlzLl9yZW1vdmFsc1RhaWwgPSBudWxsO1xuICAgICAgdGhpcy5faWRlbnRpdHlDaGFuZ2VzSGVhZCA9IHRoaXMuX2lkZW50aXR5Q2hhbmdlc1RhaWwgPSBudWxsO1xuXG4gICAgICAvLyBUT0RPKHZpY2IpOiB3aGVuIGFzc2VydCBnZXRzIHN1cHBvcnRlZFxuICAgICAgLy8gYXNzZXJ0KCF0aGlzLmlzRGlydHkpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBUaGlzIGlzIHRoZSBjb3JlIGZ1bmN0aW9uIHdoaWNoIGhhbmRsZXMgZGlmZmVyZW5jZXMgYmV0d2VlbiBjb2xsZWN0aW9ucy5cbiAgICpcbiAgICogLSBgcmVjb3JkYCBpcyB0aGUgcmVjb3JkIHdoaWNoIHdlIHNhdyBhdCB0aGlzIHBvc2l0aW9uIGxhc3QgdGltZS4gSWYgbnVsbCB0aGVuIGl0IGlzIGEgbmV3XG4gICAqICAgaXRlbS5cbiAgICogLSBgaXRlbWAgaXMgdGhlIGN1cnJlbnQgaXRlbSBpbiB0aGUgY29sbGVjdGlvblxuICAgKiAtIGBpbmRleGAgaXMgdGhlIHBvc2l0aW9uIG9mIHRoZSBpdGVtIGluIHRoZSBjb2xsZWN0aW9uXG4gICAqXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgX21pc21hdGNoKHJlY29yZDogSXRlcmFibGVDaGFuZ2VSZWNvcmRfPFY+fG51bGwsIGl0ZW06IFYsIGl0ZW1UcmFja0J5OiBhbnksIGluZGV4OiBudW1iZXIpOlxuICAgICAgSXRlcmFibGVDaGFuZ2VSZWNvcmRfPFY+IHtcbiAgICAvLyBUaGUgcHJldmlvdXMgcmVjb3JkIGFmdGVyIHdoaWNoIHdlIHdpbGwgYXBwZW5kIHRoZSBjdXJyZW50IG9uZS5cbiAgICBsZXQgcHJldmlvdXNSZWNvcmQ6IEl0ZXJhYmxlQ2hhbmdlUmVjb3JkXzxWPnxudWxsO1xuXG4gICAgaWYgKHJlY29yZCA9PT0gbnVsbCkge1xuICAgICAgcHJldmlvdXNSZWNvcmQgPSB0aGlzLl9pdFRhaWw7XG4gICAgfSBlbHNlIHtcbiAgICAgIHByZXZpb3VzUmVjb3JkID0gcmVjb3JkLl9wcmV2O1xuICAgICAgLy8gUmVtb3ZlIHRoZSByZWNvcmQgZnJvbSB0aGUgY29sbGVjdGlvbiBzaW5jZSB3ZSBrbm93IGl0IGRvZXMgbm90IG1hdGNoIHRoZSBpdGVtLlxuICAgICAgdGhpcy5fcmVtb3ZlKHJlY29yZCk7XG4gICAgfVxuXG4gICAgLy8gQXR0ZW1wdCB0byBzZWUgaWYgd2UgaGF2ZSBzZWVuIHRoZSBpdGVtIGJlZm9yZS5cbiAgICByZWNvcmQgPSB0aGlzLl9saW5rZWRSZWNvcmRzID09PSBudWxsID8gbnVsbCA6IHRoaXMuX2xpbmtlZFJlY29yZHMuZ2V0KGl0ZW1UcmFja0J5LCBpbmRleCk7XG4gICAgaWYgKHJlY29yZCAhPT0gbnVsbCkge1xuICAgICAgLy8gV2UgaGF2ZSBzZWVuIHRoaXMgYmVmb3JlLCB3ZSBuZWVkIHRvIG1vdmUgaXQgZm9yd2FyZCBpbiB0aGUgY29sbGVjdGlvbi5cbiAgICAgIC8vIEJ1dCBmaXJzdCB3ZSBuZWVkIHRvIGNoZWNrIGlmIGlkZW50aXR5IGNoYW5nZWQsIHNvIHdlIGNhbiB1cGRhdGUgaW4gdmlldyBpZiBuZWNlc3NhcnlcbiAgICAgIGlmICghbG9vc2VJZGVudGljYWwocmVjb3JkLml0ZW0sIGl0ZW0pKSB0aGlzLl9hZGRJZGVudGl0eUNoYW5nZShyZWNvcmQsIGl0ZW0pO1xuXG4gICAgICB0aGlzLl9tb3ZlQWZ0ZXIocmVjb3JkLCBwcmV2aW91c1JlY29yZCwgaW5kZXgpO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBOZXZlciBzZWVuIGl0LCBjaGVjayBldmljdGVkIGxpc3QuXG4gICAgICByZWNvcmQgPSB0aGlzLl91bmxpbmtlZFJlY29yZHMgPT09IG51bGwgPyBudWxsIDogdGhpcy5fdW5saW5rZWRSZWNvcmRzLmdldChpdGVtVHJhY2tCeSwgbnVsbCk7XG4gICAgICBpZiAocmVjb3JkICE9PSBudWxsKSB7XG4gICAgICAgIC8vIEl0IGlzIGFuIGl0ZW0gd2hpY2ggd2UgaGF2ZSBldmljdGVkIGVhcmxpZXI6IHJlaW5zZXJ0IGl0IGJhY2sgaW50byB0aGUgbGlzdC5cbiAgICAgICAgLy8gQnV0IGZpcnN0IHdlIG5lZWQgdG8gY2hlY2sgaWYgaWRlbnRpdHkgY2hhbmdlZCwgc28gd2UgY2FuIHVwZGF0ZSBpbiB2aWV3IGlmIG5lY2Vzc2FyeVxuICAgICAgICBpZiAoIWxvb3NlSWRlbnRpY2FsKHJlY29yZC5pdGVtLCBpdGVtKSkgdGhpcy5fYWRkSWRlbnRpdHlDaGFuZ2UocmVjb3JkLCBpdGVtKTtcblxuICAgICAgICB0aGlzLl9yZWluc2VydEFmdGVyKHJlY29yZCwgcHJldmlvdXNSZWNvcmQsIGluZGV4KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIEl0IGlzIGEgbmV3IGl0ZW06IGFkZCBpdC5cbiAgICAgICAgcmVjb3JkID1cbiAgICAgICAgICAgIHRoaXMuX2FkZEFmdGVyKG5ldyBJdGVyYWJsZUNoYW5nZVJlY29yZF88Vj4oaXRlbSwgaXRlbVRyYWNrQnkpLCBwcmV2aW91c1JlY29yZCwgaW5kZXgpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcmVjb3JkO1xuICB9XG5cbiAgLyoqXG4gICAqIFRoaXMgY2hlY2sgaXMgb25seSBuZWVkZWQgaWYgYW4gYXJyYXkgY29udGFpbnMgZHVwbGljYXRlcy4gKFNob3J0IGNpcmN1aXQgb2Ygbm90aGluZyBkaXJ0eSlcbiAgICpcbiAgICogVXNlIGNhc2U6IGBbYSwgYV1gID0+IGBbYiwgYSwgYV1gXG4gICAqXG4gICAqIElmIHdlIGRpZCBub3QgaGF2ZSB0aGlzIGNoZWNrIHRoZW4gdGhlIGluc2VydGlvbiBvZiBgYmAgd291bGQ6XG4gICAqICAgMSkgZXZpY3QgZmlyc3QgYGFgXG4gICAqICAgMikgaW5zZXJ0IGBiYCBhdCBgMGAgaW5kZXguXG4gICAqICAgMykgbGVhdmUgYGFgIGF0IGluZGV4IGAxYCBhcyBpcy4gPC0tIHRoaXMgaXMgd3JvbmchXG4gICAqICAgMykgcmVpbnNlcnQgYGFgIGF0IGluZGV4IDIuIDwtLSB0aGlzIGlzIHdyb25nIVxuICAgKlxuICAgKiBUaGUgY29ycmVjdCBiZWhhdmlvciBpczpcbiAgICogICAxKSBldmljdCBmaXJzdCBgYWBcbiAgICogICAyKSBpbnNlcnQgYGJgIGF0IGAwYCBpbmRleC5cbiAgICogICAzKSByZWluc2VydCBgYWAgYXQgaW5kZXggMS5cbiAgICogICAzKSBtb3ZlIGBhYCBhdCBmcm9tIGAxYCB0byBgMmAuXG4gICAqXG4gICAqXG4gICAqIERvdWJsZSBjaGVjayB0aGF0IHdlIGhhdmUgbm90IGV2aWN0ZWQgYSBkdXBsaWNhdGUgaXRlbS4gV2UgbmVlZCB0byBjaGVjayBpZiB0aGUgaXRlbSB0eXBlIG1heVxuICAgKiBoYXZlIGFscmVhZHkgYmVlbiByZW1vdmVkOlxuICAgKiBUaGUgaW5zZXJ0aW9uIG9mIGIgd2lsbCBldmljdCB0aGUgZmlyc3QgJ2EnLiBJZiB3ZSBkb24ndCByZWluc2VydCBpdCBub3cgaXQgd2lsbCBiZSByZWluc2VydGVkXG4gICAqIGF0IHRoZSBlbmQuIFdoaWNoIHdpbGwgc2hvdyB1cCBhcyB0aGUgdHdvICdhJ3Mgc3dpdGNoaW5nIHBvc2l0aW9uLiBUaGlzIGlzIGluY29ycmVjdCwgc2luY2UgYVxuICAgKiBiZXR0ZXIgd2F5IHRvIHRoaW5rIG9mIGl0IGlzIGFzIGluc2VydCBvZiAnYicgcmF0aGVyIHRoZW4gc3dpdGNoICdhJyB3aXRoICdiJyBhbmQgdGhlbiBhZGQgJ2EnXG4gICAqIGF0IHRoZSBlbmQuXG4gICAqXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgX3ZlcmlmeVJlaW5zZXJ0aW9uKHJlY29yZDogSXRlcmFibGVDaGFuZ2VSZWNvcmRfPFY+LCBpdGVtOiBWLCBpdGVtVHJhY2tCeTogYW55LCBpbmRleDogbnVtYmVyKTpcbiAgICAgIEl0ZXJhYmxlQ2hhbmdlUmVjb3JkXzxWPiB7XG4gICAgbGV0IHJlaW5zZXJ0UmVjb3JkOiBJdGVyYWJsZUNoYW5nZVJlY29yZF88Vj58bnVsbCA9XG4gICAgICAgIHRoaXMuX3VubGlua2VkUmVjb3JkcyA9PT0gbnVsbCA/IG51bGwgOiB0aGlzLl91bmxpbmtlZFJlY29yZHMuZ2V0KGl0ZW1UcmFja0J5LCBudWxsKTtcbiAgICBpZiAocmVpbnNlcnRSZWNvcmQgIT09IG51bGwpIHtcbiAgICAgIHJlY29yZCA9IHRoaXMuX3JlaW5zZXJ0QWZ0ZXIocmVpbnNlcnRSZWNvcmQsIHJlY29yZC5fcHJldiEsIGluZGV4KTtcbiAgICB9IGVsc2UgaWYgKHJlY29yZC5jdXJyZW50SW5kZXggIT0gaW5kZXgpIHtcbiAgICAgIHJlY29yZC5jdXJyZW50SW5kZXggPSBpbmRleDtcbiAgICAgIHRoaXMuX2FkZFRvTW92ZXMocmVjb3JkLCBpbmRleCk7XG4gICAgfVxuICAgIHJldHVybiByZWNvcmQ7XG4gIH1cblxuICAvKipcbiAgICogR2V0IHJpZCBvZiBhbnkgZXhjZXNzIHtAbGluayBJdGVyYWJsZUNoYW5nZVJlY29yZF99cyBmcm9tIHRoZSBwcmV2aW91cyBjb2xsZWN0aW9uXG4gICAqXG4gICAqIC0gYHJlY29yZGAgVGhlIGZpcnN0IGV4Y2VzcyB7QGxpbmsgSXRlcmFibGVDaGFuZ2VSZWNvcmRffS5cbiAgICpcbiAgICogQGludGVybmFsXG4gICAqL1xuICBfdHJ1bmNhdGUocmVjb3JkOiBJdGVyYWJsZUNoYW5nZVJlY29yZF88Vj58bnVsbCkge1xuICAgIC8vIEFueXRoaW5nIGFmdGVyIHRoYXQgbmVlZHMgdG8gYmUgcmVtb3ZlZDtcbiAgICB3aGlsZSAocmVjb3JkICE9PSBudWxsKSB7XG4gICAgICBjb25zdCBuZXh0UmVjb3JkOiBJdGVyYWJsZUNoYW5nZVJlY29yZF88Vj58bnVsbCA9IHJlY29yZC5fbmV4dDtcbiAgICAgIHRoaXMuX2FkZFRvUmVtb3ZhbHModGhpcy5fdW5saW5rKHJlY29yZCkpO1xuICAgICAgcmVjb3JkID0gbmV4dFJlY29yZDtcbiAgICB9XG4gICAgaWYgKHRoaXMuX3VubGlua2VkUmVjb3JkcyAhPT0gbnVsbCkge1xuICAgICAgdGhpcy5fdW5saW5rZWRSZWNvcmRzLmNsZWFyKCk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuX2FkZGl0aW9uc1RhaWwgIT09IG51bGwpIHtcbiAgICAgIHRoaXMuX2FkZGl0aW9uc1RhaWwuX25leHRBZGRlZCA9IG51bGw7XG4gICAgfVxuICAgIGlmICh0aGlzLl9tb3Zlc1RhaWwgIT09IG51bGwpIHtcbiAgICAgIHRoaXMuX21vdmVzVGFpbC5fbmV4dE1vdmVkID0gbnVsbDtcbiAgICB9XG4gICAgaWYgKHRoaXMuX2l0VGFpbCAhPT0gbnVsbCkge1xuICAgICAgdGhpcy5faXRUYWlsLl9uZXh0ID0gbnVsbDtcbiAgICB9XG4gICAgaWYgKHRoaXMuX3JlbW92YWxzVGFpbCAhPT0gbnVsbCkge1xuICAgICAgdGhpcy5fcmVtb3ZhbHNUYWlsLl9uZXh0UmVtb3ZlZCA9IG51bGw7XG4gICAgfVxuICAgIGlmICh0aGlzLl9pZGVudGl0eUNoYW5nZXNUYWlsICE9PSBudWxsKSB7XG4gICAgICB0aGlzLl9pZGVudGl0eUNoYW5nZXNUYWlsLl9uZXh0SWRlbnRpdHlDaGFuZ2UgPSBudWxsO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBAaW50ZXJuYWwgKi9cbiAgX3JlaW5zZXJ0QWZ0ZXIoXG4gICAgICByZWNvcmQ6IEl0ZXJhYmxlQ2hhbmdlUmVjb3JkXzxWPiwgcHJldlJlY29yZDogSXRlcmFibGVDaGFuZ2VSZWNvcmRfPFY+fG51bGwsXG4gICAgICBpbmRleDogbnVtYmVyKTogSXRlcmFibGVDaGFuZ2VSZWNvcmRfPFY+IHtcbiAgICBpZiAodGhpcy5fdW5saW5rZWRSZWNvcmRzICE9PSBudWxsKSB7XG4gICAgICB0aGlzLl91bmxpbmtlZFJlY29yZHMucmVtb3ZlKHJlY29yZCk7XG4gICAgfVxuICAgIGNvbnN0IHByZXYgPSByZWNvcmQuX3ByZXZSZW1vdmVkO1xuICAgIGNvbnN0IG5leHQgPSByZWNvcmQuX25leHRSZW1vdmVkO1xuXG4gICAgaWYgKHByZXYgPT09IG51bGwpIHtcbiAgICAgIHRoaXMuX3JlbW92YWxzSGVhZCA9IG5leHQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIHByZXYuX25leHRSZW1vdmVkID0gbmV4dDtcbiAgICB9XG4gICAgaWYgKG5leHQgPT09IG51bGwpIHtcbiAgICAgIHRoaXMuX3JlbW92YWxzVGFpbCA9IHByZXY7XG4gICAgfSBlbHNlIHtcbiAgICAgIG5leHQuX3ByZXZSZW1vdmVkID0gcHJldjtcbiAgICB9XG5cbiAgICB0aGlzLl9pbnNlcnRBZnRlcihyZWNvcmQsIHByZXZSZWNvcmQsIGluZGV4KTtcbiAgICB0aGlzLl9hZGRUb01vdmVzKHJlY29yZCwgaW5kZXgpO1xuICAgIHJldHVybiByZWNvcmQ7XG4gIH1cblxuICAvKiogQGludGVybmFsICovXG4gIF9tb3ZlQWZ0ZXIoXG4gICAgICByZWNvcmQ6IEl0ZXJhYmxlQ2hhbmdlUmVjb3JkXzxWPiwgcHJldlJlY29yZDogSXRlcmFibGVDaGFuZ2VSZWNvcmRfPFY+fG51bGwsXG4gICAgICBpbmRleDogbnVtYmVyKTogSXRlcmFibGVDaGFuZ2VSZWNvcmRfPFY+IHtcbiAgICB0aGlzLl91bmxpbmsocmVjb3JkKTtcbiAgICB0aGlzLl9pbnNlcnRBZnRlcihyZWNvcmQsIHByZXZSZWNvcmQsIGluZGV4KTtcbiAgICB0aGlzLl9hZGRUb01vdmVzKHJlY29yZCwgaW5kZXgpO1xuICAgIHJldHVybiByZWNvcmQ7XG4gIH1cblxuICAvKiogQGludGVybmFsICovXG4gIF9hZGRBZnRlcihcbiAgICAgIHJlY29yZDogSXRlcmFibGVDaGFuZ2VSZWNvcmRfPFY+LCBwcmV2UmVjb3JkOiBJdGVyYWJsZUNoYW5nZVJlY29yZF88Vj58bnVsbCxcbiAgICAgIGluZGV4OiBudW1iZXIpOiBJdGVyYWJsZUNoYW5nZVJlY29yZF88Vj4ge1xuICAgIHRoaXMuX2luc2VydEFmdGVyKHJlY29yZCwgcHJldlJlY29yZCwgaW5kZXgpO1xuXG4gICAgaWYgKHRoaXMuX2FkZGl0aW9uc1RhaWwgPT09IG51bGwpIHtcbiAgICAgIC8vIFRPRE8odmljYik6XG4gICAgICAvLyBhc3NlcnQodGhpcy5fYWRkaXRpb25zSGVhZCA9PT0gbnVsbCk7XG4gICAgICB0aGlzLl9hZGRpdGlvbnNUYWlsID0gdGhpcy5fYWRkaXRpb25zSGVhZCA9IHJlY29yZDtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gVE9ETyh2aWNiKTpcbiAgICAgIC8vIGFzc2VydChfYWRkaXRpb25zVGFpbC5fbmV4dEFkZGVkID09PSBudWxsKTtcbiAgICAgIC8vIGFzc2VydChyZWNvcmQuX25leHRBZGRlZCA9PT0gbnVsbCk7XG4gICAgICB0aGlzLl9hZGRpdGlvbnNUYWlsID0gdGhpcy5fYWRkaXRpb25zVGFpbC5fbmV4dEFkZGVkID0gcmVjb3JkO1xuICAgIH1cbiAgICByZXR1cm4gcmVjb3JkO1xuICB9XG5cbiAgLyoqIEBpbnRlcm5hbCAqL1xuICBfaW5zZXJ0QWZ0ZXIoXG4gICAgICByZWNvcmQ6IEl0ZXJhYmxlQ2hhbmdlUmVjb3JkXzxWPiwgcHJldlJlY29yZDogSXRlcmFibGVDaGFuZ2VSZWNvcmRfPFY+fG51bGwsXG4gICAgICBpbmRleDogbnVtYmVyKTogSXRlcmFibGVDaGFuZ2VSZWNvcmRfPFY+IHtcbiAgICAvLyBUT0RPKHZpY2IpOlxuICAgIC8vIGFzc2VydChyZWNvcmQgIT0gcHJldlJlY29yZCk7XG4gICAgLy8gYXNzZXJ0KHJlY29yZC5fbmV4dCA9PT0gbnVsbCk7XG4gICAgLy8gYXNzZXJ0KHJlY29yZC5fcHJldiA9PT0gbnVsbCk7XG5cbiAgICBjb25zdCBuZXh0OiBJdGVyYWJsZUNoYW5nZVJlY29yZF88Vj58bnVsbCA9XG4gICAgICAgIHByZXZSZWNvcmQgPT09IG51bGwgPyB0aGlzLl9pdEhlYWQgOiBwcmV2UmVjb3JkLl9uZXh0O1xuICAgIC8vIFRPRE8odmljYik6XG4gICAgLy8gYXNzZXJ0KG5leHQgIT0gcmVjb3JkKTtcbiAgICAvLyBhc3NlcnQocHJldlJlY29yZCAhPSByZWNvcmQpO1xuICAgIHJlY29yZC5fbmV4dCA9IG5leHQ7XG4gICAgcmVjb3JkLl9wcmV2ID0gcHJldlJlY29yZDtcbiAgICBpZiAobmV4dCA9PT0gbnVsbCkge1xuICAgICAgdGhpcy5faXRUYWlsID0gcmVjb3JkO1xuICAgIH0gZWxzZSB7XG4gICAgICBuZXh0Ll9wcmV2ID0gcmVjb3JkO1xuICAgIH1cbiAgICBpZiAocHJldlJlY29yZCA9PT0gbnVsbCkge1xuICAgICAgdGhpcy5faXRIZWFkID0gcmVjb3JkO1xuICAgIH0gZWxzZSB7XG4gICAgICBwcmV2UmVjb3JkLl9uZXh0ID0gcmVjb3JkO1xuICAgIH1cblxuICAgIGlmICh0aGlzLl9saW5rZWRSZWNvcmRzID09PSBudWxsKSB7XG4gICAgICB0aGlzLl9saW5rZWRSZWNvcmRzID0gbmV3IF9EdXBsaWNhdGVNYXA8Vj4oKTtcbiAgICB9XG4gICAgdGhpcy5fbGlua2VkUmVjb3Jkcy5wdXQocmVjb3JkKTtcblxuICAgIHJlY29yZC5jdXJyZW50SW5kZXggPSBpbmRleDtcbiAgICByZXR1cm4gcmVjb3JkO1xuICB9XG5cbiAgLyoqIEBpbnRlcm5hbCAqL1xuICBfcmVtb3ZlKHJlY29yZDogSXRlcmFibGVDaGFuZ2VSZWNvcmRfPFY+KTogSXRlcmFibGVDaGFuZ2VSZWNvcmRfPFY+IHtcbiAgICByZXR1cm4gdGhpcy5fYWRkVG9SZW1vdmFscyh0aGlzLl91bmxpbmsocmVjb3JkKSk7XG4gIH1cblxuICAvKiogQGludGVybmFsICovXG4gIF91bmxpbmsocmVjb3JkOiBJdGVyYWJsZUNoYW5nZVJlY29yZF88Vj4pOiBJdGVyYWJsZUNoYW5nZVJlY29yZF88Vj4ge1xuICAgIGlmICh0aGlzLl9saW5rZWRSZWNvcmRzICE9PSBudWxsKSB7XG4gICAgICB0aGlzLl9saW5rZWRSZWNvcmRzLnJlbW92ZShyZWNvcmQpO1xuICAgIH1cblxuICAgIGNvbnN0IHByZXYgPSByZWNvcmQuX3ByZXY7XG4gICAgY29uc3QgbmV4dCA9IHJlY29yZC5fbmV4dDtcblxuICAgIC8vIFRPRE8odmljYik6XG4gICAgLy8gYXNzZXJ0KChyZWNvcmQuX3ByZXYgPSBudWxsKSA9PT0gbnVsbCk7XG4gICAgLy8gYXNzZXJ0KChyZWNvcmQuX25leHQgPSBudWxsKSA9PT0gbnVsbCk7XG5cbiAgICBpZiAocHJldiA9PT0gbnVsbCkge1xuICAgICAgdGhpcy5faXRIZWFkID0gbmV4dDtcbiAgICB9IGVsc2Uge1xuICAgICAgcHJldi5fbmV4dCA9IG5leHQ7XG4gICAgfVxuICAgIGlmIChuZXh0ID09PSBudWxsKSB7XG4gICAgICB0aGlzLl9pdFRhaWwgPSBwcmV2O1xuICAgIH0gZWxzZSB7XG4gICAgICBuZXh0Ll9wcmV2ID0gcHJldjtcbiAgICB9XG5cbiAgICByZXR1cm4gcmVjb3JkO1xuICB9XG5cbiAgLyoqIEBpbnRlcm5hbCAqL1xuICBfYWRkVG9Nb3ZlcyhyZWNvcmQ6IEl0ZXJhYmxlQ2hhbmdlUmVjb3JkXzxWPiwgdG9JbmRleDogbnVtYmVyKTogSXRlcmFibGVDaGFuZ2VSZWNvcmRfPFY+IHtcbiAgICAvLyBUT0RPKHZpY2IpOlxuICAgIC8vIGFzc2VydChyZWNvcmQuX25leHRNb3ZlZCA9PT0gbnVsbCk7XG5cbiAgICBpZiAocmVjb3JkLnByZXZpb3VzSW5kZXggPT09IHRvSW5kZXgpIHtcbiAgICAgIHJldHVybiByZWNvcmQ7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuX21vdmVzVGFpbCA9PT0gbnVsbCkge1xuICAgICAgLy8gVE9ETyh2aWNiKTpcbiAgICAgIC8vIGFzc2VydChfbW92ZXNIZWFkID09PSBudWxsKTtcbiAgICAgIHRoaXMuX21vdmVzVGFpbCA9IHRoaXMuX21vdmVzSGVhZCA9IHJlY29yZDtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gVE9ETyh2aWNiKTpcbiAgICAgIC8vIGFzc2VydChfbW92ZXNUYWlsLl9uZXh0TW92ZWQgPT09IG51bGwpO1xuICAgICAgdGhpcy5fbW92ZXNUYWlsID0gdGhpcy5fbW92ZXNUYWlsLl9uZXh0TW92ZWQgPSByZWNvcmQ7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlY29yZDtcbiAgfVxuXG4gIHByaXZhdGUgX2FkZFRvUmVtb3ZhbHMocmVjb3JkOiBJdGVyYWJsZUNoYW5nZVJlY29yZF88Vj4pOiBJdGVyYWJsZUNoYW5nZVJlY29yZF88Vj4ge1xuICAgIGlmICh0aGlzLl91bmxpbmtlZFJlY29yZHMgPT09IG51bGwpIHtcbiAgICAgIHRoaXMuX3VubGlua2VkUmVjb3JkcyA9IG5ldyBfRHVwbGljYXRlTWFwPFY+KCk7XG4gICAgfVxuICAgIHRoaXMuX3VubGlua2VkUmVjb3Jkcy5wdXQocmVjb3JkKTtcbiAgICByZWNvcmQuY3VycmVudEluZGV4ID0gbnVsbDtcbiAgICByZWNvcmQuX25leHRSZW1vdmVkID0gbnVsbDtcblxuICAgIGlmICh0aGlzLl9yZW1vdmFsc1RhaWwgPT09IG51bGwpIHtcbiAgICAgIC8vIFRPRE8odmljYik6XG4gICAgICAvLyBhc3NlcnQoX3JlbW92YWxzSGVhZCA9PT0gbnVsbCk7XG4gICAgICB0aGlzLl9yZW1vdmFsc1RhaWwgPSB0aGlzLl9yZW1vdmFsc0hlYWQgPSByZWNvcmQ7XG4gICAgICByZWNvcmQuX3ByZXZSZW1vdmVkID0gbnVsbDtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gVE9ETyh2aWNiKTpcbiAgICAgIC8vIGFzc2VydChfcmVtb3ZhbHNUYWlsLl9uZXh0UmVtb3ZlZCA9PT0gbnVsbCk7XG4gICAgICAvLyBhc3NlcnQocmVjb3JkLl9uZXh0UmVtb3ZlZCA9PT0gbnVsbCk7XG4gICAgICByZWNvcmQuX3ByZXZSZW1vdmVkID0gdGhpcy5fcmVtb3ZhbHNUYWlsO1xuICAgICAgdGhpcy5fcmVtb3ZhbHNUYWlsID0gdGhpcy5fcmVtb3ZhbHNUYWlsLl9uZXh0UmVtb3ZlZCA9IHJlY29yZDtcbiAgICB9XG4gICAgcmV0dXJuIHJlY29yZDtcbiAgfVxuXG4gIC8qKiBAaW50ZXJuYWwgKi9cbiAgX2FkZElkZW50aXR5Q2hhbmdlKHJlY29yZDogSXRlcmFibGVDaGFuZ2VSZWNvcmRfPFY+LCBpdGVtOiBWKSB7XG4gICAgcmVjb3JkLml0ZW0gPSBpdGVtO1xuICAgIGlmICh0aGlzLl9pZGVudGl0eUNoYW5nZXNUYWlsID09PSBudWxsKSB7XG4gICAgICB0aGlzLl9pZGVudGl0eUNoYW5nZXNUYWlsID0gdGhpcy5faWRlbnRpdHlDaGFuZ2VzSGVhZCA9IHJlY29yZDtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5faWRlbnRpdHlDaGFuZ2VzVGFpbCA9IHRoaXMuX2lkZW50aXR5Q2hhbmdlc1RhaWwuX25leHRJZGVudGl0eUNoYW5nZSA9IHJlY29yZDtcbiAgICB9XG4gICAgcmV0dXJuIHJlY29yZDtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgSXRlcmFibGVDaGFuZ2VSZWNvcmRfPFY+IGltcGxlbWVudHMgSXRlcmFibGVDaGFuZ2VSZWNvcmQ8Vj4ge1xuICBjdXJyZW50SW5kZXg6IG51bWJlcnxudWxsID0gbnVsbDtcbiAgcHJldmlvdXNJbmRleDogbnVtYmVyfG51bGwgPSBudWxsO1xuXG4gIC8qKiBAaW50ZXJuYWwgKi9cbiAgX25leHRQcmV2aW91czogSXRlcmFibGVDaGFuZ2VSZWNvcmRfPFY+fG51bGwgPSBudWxsO1xuICAvKiogQGludGVybmFsICovXG4gIF9wcmV2OiBJdGVyYWJsZUNoYW5nZVJlY29yZF88Vj58bnVsbCA9IG51bGw7XG4gIC8qKiBAaW50ZXJuYWwgKi9cbiAgX25leHQ6IEl0ZXJhYmxlQ2hhbmdlUmVjb3JkXzxWPnxudWxsID0gbnVsbDtcbiAgLyoqIEBpbnRlcm5hbCAqL1xuICBfcHJldkR1cDogSXRlcmFibGVDaGFuZ2VSZWNvcmRfPFY+fG51bGwgPSBudWxsO1xuICAvKiogQGludGVybmFsICovXG4gIF9uZXh0RHVwOiBJdGVyYWJsZUNoYW5nZVJlY29yZF88Vj58bnVsbCA9IG51bGw7XG4gIC8qKiBAaW50ZXJuYWwgKi9cbiAgX3ByZXZSZW1vdmVkOiBJdGVyYWJsZUNoYW5nZVJlY29yZF88Vj58bnVsbCA9IG51bGw7XG4gIC8qKiBAaW50ZXJuYWwgKi9cbiAgX25leHRSZW1vdmVkOiBJdGVyYWJsZUNoYW5nZVJlY29yZF88Vj58bnVsbCA9IG51bGw7XG4gIC8qKiBAaW50ZXJuYWwgKi9cbiAgX25leHRBZGRlZDogSXRlcmFibGVDaGFuZ2VSZWNvcmRfPFY+fG51bGwgPSBudWxsO1xuICAvKiogQGludGVybmFsICovXG4gIF9uZXh0TW92ZWQ6IEl0ZXJhYmxlQ2hhbmdlUmVjb3JkXzxWPnxudWxsID0gbnVsbDtcbiAgLyoqIEBpbnRlcm5hbCAqL1xuICBfbmV4dElkZW50aXR5Q2hhbmdlOiBJdGVyYWJsZUNoYW5nZVJlY29yZF88Vj58bnVsbCA9IG51bGw7XG5cblxuICBjb25zdHJ1Y3RvcihwdWJsaWMgaXRlbTogViwgcHVibGljIHRyYWNrQnlJZDogYW55KSB7fVxufVxuXG4vLyBBIGxpbmtlZCBsaXN0IG9mIENvbGxlY3Rpb25DaGFuZ2VSZWNvcmRzIHdpdGggdGhlIHNhbWUgSXRlcmFibGVDaGFuZ2VSZWNvcmRfLml0ZW1cbmNsYXNzIF9EdXBsaWNhdGVJdGVtUmVjb3JkTGlzdDxWPiB7XG4gIC8qKiBAaW50ZXJuYWwgKi9cbiAgX2hlYWQ6IEl0ZXJhYmxlQ2hhbmdlUmVjb3JkXzxWPnxudWxsID0gbnVsbDtcbiAgLyoqIEBpbnRlcm5hbCAqL1xuICBfdGFpbDogSXRlcmFibGVDaGFuZ2VSZWNvcmRfPFY+fG51bGwgPSBudWxsO1xuXG4gIC8qKlxuICAgKiBBcHBlbmQgdGhlIHJlY29yZCB0byB0aGUgbGlzdCBvZiBkdXBsaWNhdGVzLlxuICAgKlxuICAgKiBOb3RlOiBieSBkZXNpZ24gYWxsIHJlY29yZHMgaW4gdGhlIGxpc3Qgb2YgZHVwbGljYXRlcyBob2xkIHRoZSBzYW1lIHZhbHVlIGluIHJlY29yZC5pdGVtLlxuICAgKi9cbiAgYWRkKHJlY29yZDogSXRlcmFibGVDaGFuZ2VSZWNvcmRfPFY+KTogdm9pZCB7XG4gICAgaWYgKHRoaXMuX2hlYWQgPT09IG51bGwpIHtcbiAgICAgIHRoaXMuX2hlYWQgPSB0aGlzLl90YWlsID0gcmVjb3JkO1xuICAgICAgcmVjb3JkLl9uZXh0RHVwID0gbnVsbDtcbiAgICAgIHJlY29yZC5fcHJldkR1cCA9IG51bGw7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIFRPRE8odmljYik6XG4gICAgICAvLyBhc3NlcnQocmVjb3JkLml0ZW0gPT0gIF9oZWFkLml0ZW0gfHxcbiAgICAgIC8vICAgICAgIHJlY29yZC5pdGVtIGlzIG51bSAmJiByZWNvcmQuaXRlbS5pc05hTiAmJiBfaGVhZC5pdGVtIGlzIG51bSAmJiBfaGVhZC5pdGVtLmlzTmFOKTtcbiAgICAgIHRoaXMuX3RhaWwhLl9uZXh0RHVwID0gcmVjb3JkO1xuICAgICAgcmVjb3JkLl9wcmV2RHVwID0gdGhpcy5fdGFpbDtcbiAgICAgIHJlY29yZC5fbmV4dER1cCA9IG51bGw7XG4gICAgICB0aGlzLl90YWlsID0gcmVjb3JkO1xuICAgIH1cbiAgfVxuXG4gIC8vIFJldHVybnMgYSBJdGVyYWJsZUNoYW5nZVJlY29yZF8gaGF2aW5nIEl0ZXJhYmxlQ2hhbmdlUmVjb3JkXy50cmFja0J5SWQgPT0gdHJhY2tCeUlkIGFuZFxuICAvLyBJdGVyYWJsZUNoYW5nZVJlY29yZF8uY3VycmVudEluZGV4ID49IGF0T3JBZnRlckluZGV4XG4gIGdldCh0cmFja0J5SWQ6IGFueSwgYXRPckFmdGVySW5kZXg6IG51bWJlcnxudWxsKTogSXRlcmFibGVDaGFuZ2VSZWNvcmRfPFY+fG51bGwge1xuICAgIGxldCByZWNvcmQ6IEl0ZXJhYmxlQ2hhbmdlUmVjb3JkXzxWPnxudWxsO1xuICAgIGZvciAocmVjb3JkID0gdGhpcy5faGVhZDsgcmVjb3JkICE9PSBudWxsOyByZWNvcmQgPSByZWNvcmQuX25leHREdXApIHtcbiAgICAgIGlmICgoYXRPckFmdGVySW5kZXggPT09IG51bGwgfHwgYXRPckFmdGVySW5kZXggPD0gcmVjb3JkLmN1cnJlbnRJbmRleCEpICYmXG4gICAgICAgICAgbG9vc2VJZGVudGljYWwocmVjb3JkLnRyYWNrQnlJZCwgdHJhY2tCeUlkKSkge1xuICAgICAgICByZXR1cm4gcmVjb3JkO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZW1vdmUgb25lIHtAbGluayBJdGVyYWJsZUNoYW5nZVJlY29yZF99IGZyb20gdGhlIGxpc3Qgb2YgZHVwbGljYXRlcy5cbiAgICpcbiAgICogUmV0dXJucyB3aGV0aGVyIHRoZSBsaXN0IG9mIGR1cGxpY2F0ZXMgaXMgZW1wdHkuXG4gICAqL1xuICByZW1vdmUocmVjb3JkOiBJdGVyYWJsZUNoYW5nZVJlY29yZF88Vj4pOiBib29sZWFuIHtcbiAgICAvLyBUT0RPKHZpY2IpOlxuICAgIC8vIGFzc2VydCgoKSB7XG4gICAgLy8gIC8vIHZlcmlmeSB0aGF0IHRoZSByZWNvcmQgYmVpbmcgcmVtb3ZlZCBpcyBpbiB0aGUgbGlzdC5cbiAgICAvLyAgZm9yIChJdGVyYWJsZUNoYW5nZVJlY29yZF8gY3Vyc29yID0gX2hlYWQ7IGN1cnNvciAhPSBudWxsOyBjdXJzb3IgPSBjdXJzb3IuX25leHREdXApIHtcbiAgICAvLyAgICBpZiAoaWRlbnRpY2FsKGN1cnNvciwgcmVjb3JkKSkgcmV0dXJuIHRydWU7XG4gICAgLy8gIH1cbiAgICAvLyAgcmV0dXJuIGZhbHNlO1xuICAgIC8vfSk7XG5cbiAgICBjb25zdCBwcmV2OiBJdGVyYWJsZUNoYW5nZVJlY29yZF88Vj58bnVsbCA9IHJlY29yZC5fcHJldkR1cDtcbiAgICBjb25zdCBuZXh0OiBJdGVyYWJsZUNoYW5nZVJlY29yZF88Vj58bnVsbCA9IHJlY29yZC5fbmV4dER1cDtcbiAgICBpZiAocHJldiA9PT0gbnVsbCkge1xuICAgICAgdGhpcy5faGVhZCA9IG5leHQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIHByZXYuX25leHREdXAgPSBuZXh0O1xuICAgIH1cbiAgICBpZiAobmV4dCA9PT0gbnVsbCkge1xuICAgICAgdGhpcy5fdGFpbCA9IHByZXY7XG4gICAgfSBlbHNlIHtcbiAgICAgIG5leHQuX3ByZXZEdXAgPSBwcmV2O1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5faGVhZCA9PT0gbnVsbDtcbiAgfVxufVxuXG5jbGFzcyBfRHVwbGljYXRlTWFwPFY+IHtcbiAgbWFwID0gbmV3IE1hcDxhbnksIF9EdXBsaWNhdGVJdGVtUmVjb3JkTGlzdDxWPj4oKTtcblxuICBwdXQocmVjb3JkOiBJdGVyYWJsZUNoYW5nZVJlY29yZF88Vj4pIHtcbiAgICBjb25zdCBrZXkgPSByZWNvcmQudHJhY2tCeUlkO1xuXG4gICAgbGV0IGR1cGxpY2F0ZXMgPSB0aGlzLm1hcC5nZXQoa2V5KTtcbiAgICBpZiAoIWR1cGxpY2F0ZXMpIHtcbiAgICAgIGR1cGxpY2F0ZXMgPSBuZXcgX0R1cGxpY2F0ZUl0ZW1SZWNvcmRMaXN0PFY+KCk7XG4gICAgICB0aGlzLm1hcC5zZXQoa2V5LCBkdXBsaWNhdGVzKTtcbiAgICB9XG4gICAgZHVwbGljYXRlcy5hZGQocmVjb3JkKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXRyaWV2ZSB0aGUgYHZhbHVlYCB1c2luZyBrZXkuIEJlY2F1c2UgdGhlIEl0ZXJhYmxlQ2hhbmdlUmVjb3JkXyB2YWx1ZSBtYXkgYmUgb25lIHdoaWNoIHdlXG4gICAqIGhhdmUgYWxyZWFkeSBpdGVyYXRlZCBvdmVyLCB3ZSB1c2UgdGhlIGBhdE9yQWZ0ZXJJbmRleGAgdG8gcHJldGVuZCBpdCBpcyBub3QgdGhlcmUuXG4gICAqXG4gICAqIFVzZSBjYXNlOiBgW2EsIGIsIGMsIGEsIGFdYCBpZiB3ZSBhcmUgYXQgaW5kZXggYDNgIHdoaWNoIGlzIHRoZSBzZWNvbmQgYGFgIHRoZW4gYXNraW5nIGlmIHdlXG4gICAqIGhhdmUgYW55IG1vcmUgYGFgcyBuZWVkcyB0byByZXR1cm4gdGhlIHNlY29uZCBgYWAuXG4gICAqL1xuICBnZXQodHJhY2tCeUlkOiBhbnksIGF0T3JBZnRlckluZGV4OiBudW1iZXJ8bnVsbCk6IEl0ZXJhYmxlQ2hhbmdlUmVjb3JkXzxWPnxudWxsIHtcbiAgICBjb25zdCBrZXkgPSB0cmFja0J5SWQ7XG4gICAgY29uc3QgcmVjb3JkTGlzdCA9IHRoaXMubWFwLmdldChrZXkpO1xuICAgIHJldHVybiByZWNvcmRMaXN0ID8gcmVjb3JkTGlzdC5nZXQodHJhY2tCeUlkLCBhdE9yQWZ0ZXJJbmRleCkgOiBudWxsO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlbW92ZXMgYSB7QGxpbmsgSXRlcmFibGVDaGFuZ2VSZWNvcmRffSBmcm9tIHRoZSBsaXN0IG9mIGR1cGxpY2F0ZXMuXG4gICAqXG4gICAqIFRoZSBsaXN0IG9mIGR1cGxpY2F0ZXMgYWxzbyBpcyByZW1vdmVkIGZyb20gdGhlIG1hcCBpZiBpdCBnZXRzIGVtcHR5LlxuICAgKi9cbiAgcmVtb3ZlKHJlY29yZDogSXRlcmFibGVDaGFuZ2VSZWNvcmRfPFY+KTogSXRlcmFibGVDaGFuZ2VSZWNvcmRfPFY+IHtcbiAgICBjb25zdCBrZXkgPSByZWNvcmQudHJhY2tCeUlkO1xuICAgIGNvbnN0IHJlY29yZExpc3Q6IF9EdXBsaWNhdGVJdGVtUmVjb3JkTGlzdDxWPiA9IHRoaXMubWFwLmdldChrZXkpITtcbiAgICAvLyBSZW1vdmUgdGhlIGxpc3Qgb2YgZHVwbGljYXRlcyB3aGVuIGl0IGdldHMgZW1wdHlcbiAgICBpZiAocmVjb3JkTGlzdC5yZW1vdmUocmVjb3JkKSkge1xuICAgICAgdGhpcy5tYXAuZGVsZXRlKGtleSk7XG4gICAgfVxuICAgIHJldHVybiByZWNvcmQ7XG4gIH1cblxuICBnZXQgaXNFbXB0eSgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5tYXAuc2l6ZSA9PT0gMDtcbiAgfVxuXG4gIGNsZWFyKCkge1xuICAgIHRoaXMubWFwLmNsZWFyKCk7XG4gIH1cbn1cblxuZnVuY3Rpb24gZ2V0UHJldmlvdXNJbmRleChpdGVtOiBhbnksIGFkZFJlbW92ZU9mZnNldDogbnVtYmVyLCBtb3ZlT2Zmc2V0czogbnVtYmVyW118bnVsbCk6IG51bWJlciB7XG4gIGNvbnN0IHByZXZpb3VzSW5kZXggPSBpdGVtLnByZXZpb3VzSW5kZXg7XG4gIGlmIChwcmV2aW91c0luZGV4ID09PSBudWxsKSByZXR1cm4gcHJldmlvdXNJbmRleDtcbiAgbGV0IG1vdmVPZmZzZXQgPSAwO1xuICBpZiAobW92ZU9mZnNldHMgJiYgcHJldmlvdXNJbmRleCA8IG1vdmVPZmZzZXRzLmxlbmd0aCkge1xuICAgIG1vdmVPZmZzZXQgPSBtb3ZlT2Zmc2V0c1twcmV2aW91c0luZGV4XTtcbiAgfVxuICByZXR1cm4gcHJldmlvdXNJbmRleCArIGFkZFJlbW92ZU9mZnNldCArIG1vdmVPZmZzZXQ7XG59XG4iXX0=