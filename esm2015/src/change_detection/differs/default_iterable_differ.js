/**
 * @fileoverview added by tsickle
 * Generated from: packages/core/src/change_detection/differs/default_iterable_differ.ts
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
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
import { isListLikeIterable, iterateListLike } from '../change_detection_util';
export class DefaultIterableDifferFactory {
    constructor() { }
    /**
     * @param {?} obj
     * @return {?}
     */
    supports(obj) {
        return isListLikeIterable(obj);
    }
    /**
     * @template V
     * @param {?=} trackByFn
     * @return {?}
     */
    create(trackByFn) {
        return new DefaultIterableDiffer(trackByFn);
    }
}
/** @type {?} */
const trackByIdentity = (/**
 * @param {?} index
 * @param {?} item
 * @return {?}
 */
(index, item) => item);
/**
 * @deprecated v4.0.0 - Should not be part of public API.
 * \@publicApi
 * @template V
 */
export class DefaultIterableDiffer {
    /**
     * @param {?=} trackByFn
     */
    constructor(trackByFn) {
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
    /**
     * @param {?} fn
     * @return {?}
     */
    forEachItem(fn) {
        /** @type {?} */
        let record;
        for (record = this._itHead; record !== null; record = record._next) {
            fn(record);
        }
    }
    /**
     * @param {?} fn
     * @return {?}
     */
    forEachOperation(fn) {
        /** @type {?} */
        let nextIt = this._itHead;
        /** @type {?} */
        let nextRemove = this._removalsHead;
        /** @type {?} */
        let addRemoveOffset = 0;
        /** @type {?} */
        let moveOffsets = null;
        while (nextIt || nextRemove) {
            // Figure out which is the next record to process
            // Order: remove, add, move
            /** @type {?} */
            const record = !nextRemove ||
                nextIt &&
                    (/** @type {?} */ (nextIt.currentIndex)) <
                        getPreviousIndex(nextRemove, addRemoveOffset, moveOffsets) ?
                (/** @type {?} */ (nextIt)) :
                nextRemove;
            /** @type {?} */
            const adjPreviousIndex = getPreviousIndex(record, addRemoveOffset, moveOffsets);
            /** @type {?} */
            const currentIndex = record.currentIndex;
            // consume the item, and adjust the addRemoveOffset and update moveDistance if necessary
            if (record === nextRemove) {
                addRemoveOffset--;
                nextRemove = nextRemove._nextRemoved;
            }
            else {
                nextIt = (/** @type {?} */ (nextIt))._next;
                if (record.previousIndex == null) {
                    addRemoveOffset++;
                }
                else {
                    // INVARIANT:  currentIndex < previousIndex
                    if (!moveOffsets)
                        moveOffsets = [];
                    /** @type {?} */
                    const localMovePreviousIndex = adjPreviousIndex - addRemoveOffset;
                    /** @type {?} */
                    const localCurrentIndex = (/** @type {?} */ (currentIndex)) - addRemoveOffset;
                    if (localMovePreviousIndex != localCurrentIndex) {
                        for (let i = 0; i < localMovePreviousIndex; i++) {
                            /** @type {?} */
                            const offset = i < moveOffsets.length ? moveOffsets[i] : (moveOffsets[i] = 0);
                            /** @type {?} */
                            const index = offset + i;
                            if (localCurrentIndex <= index && index < localMovePreviousIndex) {
                                moveOffsets[i] = offset + 1;
                            }
                        }
                        /** @type {?} */
                        const previousIndex = record.previousIndex;
                        moveOffsets[previousIndex] = localCurrentIndex - localMovePreviousIndex;
                    }
                }
            }
            if (adjPreviousIndex !== currentIndex) {
                fn(record, adjPreviousIndex, currentIndex);
            }
        }
    }
    /**
     * @param {?} fn
     * @return {?}
     */
    forEachPreviousItem(fn) {
        /** @type {?} */
        let record;
        for (record = this._previousItHead; record !== null; record = record._nextPrevious) {
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
    forEachMovedItem(fn) {
        /** @type {?} */
        let record;
        for (record = this._movesHead; record !== null; record = record._nextMoved) {
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
     * @param {?} fn
     * @return {?}
     */
    forEachIdentityChange(fn) {
        /** @type {?} */
        let record;
        for (record = this._identityChangesHead; record !== null; record = record._nextIdentityChange) {
            fn(record);
        }
    }
    /**
     * @param {?} collection
     * @return {?}
     */
    diff(collection) {
        if (collection == null)
            collection = [];
        if (!isListLikeIterable(collection)) {
            throw new Error(`Error trying to diff '${stringify(collection)}'. Only arrays and iterables are allowed`);
        }
        if (this.check(collection)) {
            return this;
        }
        else {
            return null;
        }
    }
    /**
     * @return {?}
     */
    onDestroy() { }
    /**
     * @param {?} collection
     * @return {?}
     */
    check(collection) {
        this._reset();
        /** @type {?} */
        let record = this._itHead;
        /** @type {?} */
        let mayBeDirty = false;
        /** @type {?} */
        let index;
        /** @type {?} */
        let item;
        /** @type {?} */
        let itemTrackBy;
        if (Array.isArray(collection)) {
            ((/** @type {?} */ (this))).length = collection.length;
            for (let index = 0; index < this.length; index++) {
                item = collection[index];
                itemTrackBy = this._trackByFn(index, item);
                if (record === null || !looseIdentical(record.trackById, itemTrackBy)) {
                    record = this._mismatch(record, item, itemTrackBy, index);
                    mayBeDirty = true;
                }
                else {
                    if (mayBeDirty) {
                        // TODO(misko): can we limit this to duplicates only?
                        record = this._verifyReinsertion(record, item, itemTrackBy, index);
                    }
                    if (!looseIdentical(record.item, item))
                        this._addIdentityChange(record, item);
                }
                record = record._next;
            }
        }
        else {
            index = 0;
            iterateListLike(collection, (/**
             * @param {?} item
             * @return {?}
             */
            (item) => {
                itemTrackBy = this._trackByFn(index, item);
                if (record === null || !looseIdentical(record.trackById, itemTrackBy)) {
                    record = this._mismatch(record, item, itemTrackBy, index);
                    mayBeDirty = true;
                }
                else {
                    if (mayBeDirty) {
                        // TODO(misko): can we limit this to duplicates only?
                        record = this._verifyReinsertion(record, item, itemTrackBy, index);
                    }
                    if (!looseIdentical(record.item, item))
                        this._addIdentityChange(record, item);
                }
                record = record._next;
                index++;
            }));
            ((/** @type {?} */ (this))).length = index;
        }
        this._truncate(record);
        ((/** @type {?} */ (this))).collection = collection;
        return this.isDirty;
    }
    /* CollectionChanges is considered dirty if it has any additions, moves, removals, or identity
       * changes.
       */
    /**
     * @return {?}
     */
    get isDirty() {
        return this._additionsHead !== null || this._movesHead !== null ||
            this._removalsHead !== null || this._identityChangesHead !== null;
    }
    /**
     * Reset the state of the change objects to show no changes. This means set previousKey to
     * currentKey, and clear all of the queues (additions, moves, removals).
     * Set the previousIndexes of moved and added items to their currentIndexes
     * Reset the list of additions, moves and removals
     *
     * \@internal
     * @return {?}
     */
    _reset() {
        if (this.isDirty) {
            /** @type {?} */
            let record;
            /** @type {?} */
            let nextRecord;
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
    }
    /**
     * This is the core function which handles differences between collections.
     *
     * - `record` is the record which we saw at this position last time. If null then it is a new
     *   item.
     * - `item` is the current item in the collection
     * - `index` is the position of the item in the collection
     *
     * \@internal
     * @param {?} record
     * @param {?} item
     * @param {?} itemTrackBy
     * @param {?} index
     * @return {?}
     */
    _mismatch(record, item, itemTrackBy, index) {
        // The previous record after which we will append the current one.
        /** @type {?} */
        let previousRecord;
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
    }
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
     * \@internal
     * @param {?} record
     * @param {?} item
     * @param {?} itemTrackBy
     * @param {?} index
     * @return {?}
     */
    _verifyReinsertion(record, item, itemTrackBy, index) {
        /** @type {?} */
        let reinsertRecord = this._unlinkedRecords === null ? null : this._unlinkedRecords.get(itemTrackBy, null);
        if (reinsertRecord !== null) {
            record = this._reinsertAfter(reinsertRecord, (/** @type {?} */ (record._prev)), index);
        }
        else if (record.currentIndex != index) {
            record.currentIndex = index;
            this._addToMoves(record, index);
        }
        return record;
    }
    /**
     * Get rid of any excess {\@link IterableChangeRecord_}s from the previous collection
     *
     * - `record` The first excess {\@link IterableChangeRecord_}.
     *
     * \@internal
     * @param {?} record
     * @return {?}
     */
    _truncate(record) {
        // Anything after that needs to be removed;
        while (record !== null) {
            /** @type {?} */
            const nextRecord = record._next;
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
    }
    /**
     * \@internal
     * @param {?} record
     * @param {?} prevRecord
     * @param {?} index
     * @return {?}
     */
    _reinsertAfter(record, prevRecord, index) {
        if (this._unlinkedRecords !== null) {
            this._unlinkedRecords.remove(record);
        }
        /** @type {?} */
        const prev = record._prevRemoved;
        /** @type {?} */
        const next = record._nextRemoved;
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
    }
    /**
     * \@internal
     * @param {?} record
     * @param {?} prevRecord
     * @param {?} index
     * @return {?}
     */
    _moveAfter(record, prevRecord, index) {
        this._unlink(record);
        this._insertAfter(record, prevRecord, index);
        this._addToMoves(record, index);
        return record;
    }
    /**
     * \@internal
     * @param {?} record
     * @param {?} prevRecord
     * @param {?} index
     * @return {?}
     */
    _addAfter(record, prevRecord, index) {
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
    }
    /**
     * \@internal
     * @param {?} record
     * @param {?} prevRecord
     * @param {?} index
     * @return {?}
     */
    _insertAfter(record, prevRecord, index) {
        // TODO(vicb):
        // assert(record != prevRecord);
        // assert(record._next === null);
        // assert(record._prev === null);
        // TODO(vicb):
        // assert(record != prevRecord);
        // assert(record._next === null);
        // assert(record._prev === null);
        /** @type {?} */
        const next = prevRecord === null ? this._itHead : prevRecord._next;
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
    }
    /**
     * \@internal
     * @param {?} record
     * @return {?}
     */
    _remove(record) {
        return this._addToRemovals(this._unlink(record));
    }
    /**
     * \@internal
     * @param {?} record
     * @return {?}
     */
    _unlink(record) {
        if (this._linkedRecords !== null) {
            this._linkedRecords.remove(record);
        }
        /** @type {?} */
        const prev = record._prev;
        /** @type {?} */
        const next = record._next;
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
    }
    /**
     * \@internal
     * @param {?} record
     * @param {?} toIndex
     * @return {?}
     */
    _addToMoves(record, toIndex) {
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
    }
    /**
     * @private
     * @param {?} record
     * @return {?}
     */
    _addToRemovals(record) {
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
    }
    /**
     * \@internal
     * @param {?} record
     * @param {?} item
     * @return {?}
     */
    _addIdentityChange(record, item) {
        record.item = item;
        if (this._identityChangesTail === null) {
            this._identityChangesTail = this._identityChangesHead = record;
        }
        else {
            this._identityChangesTail = this._identityChangesTail._nextIdentityChange = record;
        }
        return record;
    }
}
if (false) {
    /** @type {?} */
    DefaultIterableDiffer.prototype.length;
    /** @type {?} */
    DefaultIterableDiffer.prototype.collection;
    /**
     * @type {?}
     * @private
     */
    DefaultIterableDiffer.prototype._linkedRecords;
    /**
     * @type {?}
     * @private
     */
    DefaultIterableDiffer.prototype._unlinkedRecords;
    /**
     * @type {?}
     * @private
     */
    DefaultIterableDiffer.prototype._previousItHead;
    /**
     * @type {?}
     * @private
     */
    DefaultIterableDiffer.prototype._itHead;
    /**
     * @type {?}
     * @private
     */
    DefaultIterableDiffer.prototype._itTail;
    /**
     * @type {?}
     * @private
     */
    DefaultIterableDiffer.prototype._additionsHead;
    /**
     * @type {?}
     * @private
     */
    DefaultIterableDiffer.prototype._additionsTail;
    /**
     * @type {?}
     * @private
     */
    DefaultIterableDiffer.prototype._movesHead;
    /**
     * @type {?}
     * @private
     */
    DefaultIterableDiffer.prototype._movesTail;
    /**
     * @type {?}
     * @private
     */
    DefaultIterableDiffer.prototype._removalsHead;
    /**
     * @type {?}
     * @private
     */
    DefaultIterableDiffer.prototype._removalsTail;
    /**
     * @type {?}
     * @private
     */
    DefaultIterableDiffer.prototype._identityChangesHead;
    /**
     * @type {?}
     * @private
     */
    DefaultIterableDiffer.prototype._identityChangesTail;
    /**
     * @type {?}
     * @private
     */
    DefaultIterableDiffer.prototype._trackByFn;
}
/**
 * @template V
 */
export class IterableChangeRecord_ {
    /**
     * @param {?} item
     * @param {?} trackById
     */
    constructor(item, trackById) {
        this.item = item;
        this.trackById = trackById;
        this.currentIndex = null;
        this.previousIndex = null;
        /**
         * \@internal
         */
        this._nextPrevious = null;
        /**
         * \@internal
         */
        this._prev = null;
        /**
         * \@internal
         */
        this._next = null;
        /**
         * \@internal
         */
        this._prevDup = null;
        /**
         * \@internal
         */
        this._nextDup = null;
        /**
         * \@internal
         */
        this._prevRemoved = null;
        /**
         * \@internal
         */
        this._nextRemoved = null;
        /**
         * \@internal
         */
        this._nextAdded = null;
        /**
         * \@internal
         */
        this._nextMoved = null;
        /**
         * \@internal
         */
        this._nextIdentityChange = null;
    }
}
if (false) {
    /** @type {?} */
    IterableChangeRecord_.prototype.currentIndex;
    /** @type {?} */
    IterableChangeRecord_.prototype.previousIndex;
    /**
     * \@internal
     * @type {?}
     */
    IterableChangeRecord_.prototype._nextPrevious;
    /**
     * \@internal
     * @type {?}
     */
    IterableChangeRecord_.prototype._prev;
    /**
     * \@internal
     * @type {?}
     */
    IterableChangeRecord_.prototype._next;
    /**
     * \@internal
     * @type {?}
     */
    IterableChangeRecord_.prototype._prevDup;
    /**
     * \@internal
     * @type {?}
     */
    IterableChangeRecord_.prototype._nextDup;
    /**
     * \@internal
     * @type {?}
     */
    IterableChangeRecord_.prototype._prevRemoved;
    /**
     * \@internal
     * @type {?}
     */
    IterableChangeRecord_.prototype._nextRemoved;
    /**
     * \@internal
     * @type {?}
     */
    IterableChangeRecord_.prototype._nextAdded;
    /**
     * \@internal
     * @type {?}
     */
    IterableChangeRecord_.prototype._nextMoved;
    /**
     * \@internal
     * @type {?}
     */
    IterableChangeRecord_.prototype._nextIdentityChange;
    /** @type {?} */
    IterableChangeRecord_.prototype.item;
    /** @type {?} */
    IterableChangeRecord_.prototype.trackById;
}
// A linked list of CollectionChangeRecords with the same IterableChangeRecord_.item
/**
 * @template V
 */
class _DuplicateItemRecordList {
    constructor() {
        /**
         * \@internal
         */
        this._head = null;
        /**
         * \@internal
         */
        this._tail = null;
    }
    /**
     * Append the record to the list of duplicates.
     *
     * Note: by design all records in the list of duplicates hold the same value in record.item.
     * @param {?} record
     * @return {?}
     */
    add(record) {
        if (this._head === null) {
            this._head = this._tail = record;
            record._nextDup = null;
            record._prevDup = null;
        }
        else {
            // TODO(vicb):
            // assert(record.item ==  _head.item ||
            //       record.item is num && record.item.isNaN && _head.item is num && _head.item.isNaN);
            (/** @type {?} */ (this._tail))._nextDup = record;
            record._prevDup = this._tail;
            record._nextDup = null;
            this._tail = record;
        }
    }
    // Returns a IterableChangeRecord_ having IterableChangeRecord_.trackById == trackById and
    // IterableChangeRecord_.currentIndex >= atOrAfterIndex
    /**
     * @param {?} trackById
     * @param {?} atOrAfterIndex
     * @return {?}
     */
    get(trackById, atOrAfterIndex) {
        /** @type {?} */
        let record;
        for (record = this._head; record !== null; record = record._nextDup) {
            if ((atOrAfterIndex === null || atOrAfterIndex <= (/** @type {?} */ (record.currentIndex))) &&
                looseIdentical(record.trackById, trackById)) {
                return record;
            }
        }
        return null;
    }
    /**
     * Remove one {\@link IterableChangeRecord_} from the list of duplicates.
     *
     * Returns whether the list of duplicates is empty.
     * @param {?} record
     * @return {?}
     */
    remove(record) {
        // TODO(vicb):
        // assert(() {
        //  // verify that the record being removed is in the list.
        //  for (IterableChangeRecord_ cursor = _head; cursor != null; cursor = cursor._nextDup) {
        //    if (identical(cursor, record)) return true;
        //  }
        //  return false;
        //});
        // TODO(vicb):
        // assert(() {
        //  // verify that the record being removed is in the list.
        //  for (IterableChangeRecord_ cursor = _head; cursor != null; cursor = cursor._nextDup) {
        //    if (identical(cursor, record)) return true;
        //  }
        //  return false;
        //});
        /** @type {?} */
        const prev = record._prevDup;
        /** @type {?} */
        const next = record._nextDup;
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
    }
}
if (false) {
    /**
     * \@internal
     * @type {?}
     */
    _DuplicateItemRecordList.prototype._head;
    /**
     * \@internal
     * @type {?}
     */
    _DuplicateItemRecordList.prototype._tail;
}
/**
 * @template V
 */
class _DuplicateMap {
    constructor() {
        this.map = new Map();
    }
    /**
     * @param {?} record
     * @return {?}
     */
    put(record) {
        /** @type {?} */
        const key = record.trackById;
        /** @type {?} */
        let duplicates = this.map.get(key);
        if (!duplicates) {
            duplicates = new _DuplicateItemRecordList();
            this.map.set(key, duplicates);
        }
        duplicates.add(record);
    }
    /**
     * Retrieve the `value` using key. Because the IterableChangeRecord_ value may be one which we
     * have already iterated over, we use the `atOrAfterIndex` to pretend it is not there.
     *
     * Use case: `[a, b, c, a, a]` if we are at index `3` which is the second `a` then asking if we
     * have any more `a`s needs to return the second `a`.
     * @param {?} trackById
     * @param {?} atOrAfterIndex
     * @return {?}
     */
    get(trackById, atOrAfterIndex) {
        /** @type {?} */
        const key = trackById;
        /** @type {?} */
        const recordList = this.map.get(key);
        return recordList ? recordList.get(trackById, atOrAfterIndex) : null;
    }
    /**
     * Removes a {\@link IterableChangeRecord_} from the list of duplicates.
     *
     * The list of duplicates also is removed from the map if it gets empty.
     * @param {?} record
     * @return {?}
     */
    remove(record) {
        /** @type {?} */
        const key = record.trackById;
        /** @type {?} */
        const recordList = (/** @type {?} */ (this.map.get(key)));
        // Remove the list of duplicates when it gets empty
        if (recordList.remove(record)) {
            this.map.delete(key);
        }
        return record;
    }
    /**
     * @return {?}
     */
    get isEmpty() {
        return this.map.size === 0;
    }
    /**
     * @return {?}
     */
    clear() {
        this.map.clear();
    }
}
if (false) {
    /** @type {?} */
    _DuplicateMap.prototype.map;
}
/**
 * @param {?} item
 * @param {?} addRemoveOffset
 * @param {?} moveOffsets
 * @return {?}
 */
function getPreviousIndex(item, addRemoveOffset, moveOffsets) {
    /** @type {?} */
    const previousIndex = item.previousIndex;
    if (previousIndex === null)
        return previousIndex;
    /** @type {?} */
    let moveOffset = 0;
    if (moveOffsets && previousIndex < moveOffsets.length) {
        moveOffset = moveOffsets[previousIndex];
    }
    return previousIndex + addRemoveOffset + moveOffset;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVmYXVsdF9pdGVyYWJsZV9kaWZmZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9jaGFuZ2VfZGV0ZWN0aW9uL2RpZmZlcnMvZGVmYXVsdF9pdGVyYWJsZV9kaWZmZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBUUEsT0FBTyxFQUFDLGNBQWMsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQ3JELE9BQU8sRUFBQyxTQUFTLEVBQUMsTUFBTSxzQkFBc0IsQ0FBQztBQUMvQyxPQUFPLEVBQUMsa0JBQWtCLEVBQUUsZUFBZSxFQUFDLE1BQU0sMEJBQTBCLENBQUM7QUFLN0UsTUFBTSxPQUFPLDRCQUE0QjtJQUN2QyxnQkFBZSxDQUFDOzs7OztJQUNoQixRQUFRLENBQUMsR0FBMEI7UUFDakMsT0FBTyxrQkFBa0IsQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUNqQyxDQUFDOzs7Ozs7SUFFRCxNQUFNLENBQUksU0FBOEI7UUFDdEMsT0FBTyxJQUFJLHFCQUFxQixDQUFJLFNBQVMsQ0FBQyxDQUFDO0lBQ2pELENBQUM7Q0FDRjs7TUFFSyxlQUFlOzs7OztBQUFHLENBQUMsS0FBYSxFQUFFLElBQVMsRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFBOzs7Ozs7QUFNMUQsTUFBTSxPQUFPLHFCQUFxQjs7OztJQXNCaEMsWUFBWSxTQUE4QjtRQXJCMUIsV0FBTSxHQUFXLENBQUMsQ0FBQzs7UUFJM0IsbUJBQWMsR0FBMEIsSUFBSSxDQUFDOztRQUU3QyxxQkFBZ0IsR0FBMEIsSUFBSSxDQUFDO1FBQy9DLG9CQUFlLEdBQWtDLElBQUksQ0FBQztRQUN0RCxZQUFPLEdBQWtDLElBQUksQ0FBQztRQUM5QyxZQUFPLEdBQWtDLElBQUksQ0FBQztRQUM5QyxtQkFBYyxHQUFrQyxJQUFJLENBQUM7UUFDckQsbUJBQWMsR0FBa0MsSUFBSSxDQUFDO1FBQ3JELGVBQVUsR0FB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QUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7U0FDdEI7UUFDRCxPQUFPLE1BQU0sQ0FBQztJQUNoQixDQUFDOzs7O0lBRUQsSUFBSSxPQUFPO1FBQ1QsT0FBTyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksS0FBSyxDQUFDLENBQUM7SUFDN0IsQ0FBQzs7OztJQUVELEtBQUs7UUFDSCxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssRUFBRSxDQUFDO0lBQ25CLENBQUM7Q0FDRjs7O0lBaERDLDRCQUFrRDs7Ozs7Ozs7QUFrRHBELFNBQVMsZ0JBQWdCLENBQUMsSUFBUyxFQUFFLGVBQXVCLEVBQUUsV0FBMEI7O1VBQ2hGLGFBQWEsR0FBRyxJQUFJLENBQUMsYUFBYTtJQUN4QyxJQUFJLGFBQWEsS0FBSyxJQUFJO1FBQUUsT0FBTyxhQUFhLENBQUM7O1FBQzdDLFVBQVUsR0FBRyxDQUFDO0lBQ2xCLElBQUksV0FBVyxJQUFJLGFBQWEsR0FBRyxXQUFXLENBQUMsTUFBTSxFQUFFO1FBQ3JELFVBQVUsR0FBRyxXQUFXLENBQUMsYUFBYSxDQUFDLENBQUM7S0FDekM7SUFDRCxPQUFPLGFBQWEsR0FBRyxlQUFlLEdBQUcsVUFBVSxDQUFDO0FBQ3RELENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7bG9vc2VJZGVudGljYWx9IGZyb20gJy4uLy4uL3V0aWwvY29tcGFyaXNvbic7XG5pbXBvcnQge3N0cmluZ2lmeX0gZnJvbSAnLi4vLi4vdXRpbC9zdHJpbmdpZnknO1xuaW1wb3J0IHtpc0xpc3RMaWtlSXRlcmFibGUsIGl0ZXJhdGVMaXN0TGlrZX0gZnJvbSAnLi4vY2hhbmdlX2RldGVjdGlvbl91dGlsJztcblxuaW1wb3J0IHtJdGVyYWJsZUNoYW5nZVJlY29yZCwgSXRlcmFibGVDaGFuZ2VzLCBJdGVyYWJsZURpZmZlciwgSXRlcmFibGVEaWZmZXJGYWN0b3J5LCBOZ0l0ZXJhYmxlLCBUcmFja0J5RnVuY3Rpb259IGZyb20gJy4vaXRlcmFibGVfZGlmZmVycyc7XG5cblxuZXhwb3J0IGNsYXNzIERlZmF1bHRJdGVyYWJsZURpZmZlckZhY3RvcnkgaW1wbGVtZW50cyBJdGVyYWJsZURpZmZlckZhY3Rvcnkge1xuICBjb25zdHJ1Y3RvcigpIHt9XG4gIHN1cHBvcnRzKG9iajogT2JqZWN0fG51bGx8dW5kZWZpbmVkKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIGlzTGlzdExpa2VJdGVyYWJsZShvYmopO1xuICB9XG5cbiAgY3JlYXRlPFY+KHRyYWNrQnlGbj86IFRyYWNrQnlGdW5jdGlvbjxWPik6IERlZmF1bHRJdGVyYWJsZURpZmZlcjxWPiB7XG4gICAgcmV0dXJuIG5ldyBEZWZhdWx0SXRlcmFibGVEaWZmZXI8Vj4odHJhY2tCeUZuKTtcbiAgfVxufVxuXG5jb25zdCB0cmFja0J5SWRlbnRpdHkgPSAoaW5kZXg6IG51bWJlciwgaXRlbTogYW55KSA9PiBpdGVtO1xuXG4vKipcbiAqIEBkZXByZWNhdGVkIHY0LjAuMCAtIFNob3VsZCBub3QgYmUgcGFydCBvZiBwdWJsaWMgQVBJLlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgY2xhc3MgRGVmYXVsdEl0ZXJhYmxlRGlmZmVyPFY+IGltcGxlbWVudHMgSXRlcmFibGVEaWZmZXI8Vj4sIEl0ZXJhYmxlQ2hhbmdlczxWPiB7XG4gIHB1YmxpYyByZWFkb25seSBsZW5ndGg6IG51bWJlciA9IDA7XG4gIC8vIFRPRE8oaXNzdWUvMjQ1NzEpOiByZW1vdmUgJyEnLlxuICBwdWJsaWMgcmVhZG9ubHkgY29sbGVjdGlvbiE6IFZbXXxJdGVyYWJsZTxWPnxudWxsO1xuICAvLyBLZWVwcyB0cmFjayBvZiB0aGUgdXNlZCByZWNvcmRzIGF0IGFueSBwb2ludCBpbiB0aW1lIChkdXJpbmcgJiBhY3Jvc3MgYF9jaGVjaygpYCBjYWxscylcbiAgcHJpdmF0ZSBfbGlua2VkUmVjb3JkczogX0R1cGxpY2F0ZU1hcDxWPnxudWxsID0gbnVsbDtcbiAgLy8gS2VlcHMgdHJhY2sgb2YgdGhlIHJlbW92ZWQgcmVjb3JkcyBhdCBhbnkgcG9pbnQgaW4gdGltZSBkdXJpbmcgYF9jaGVjaygpYCBjYWxscy5cbiAgcHJpdmF0ZSBfdW5saW5rZWRSZWNvcmRzOiBfRHVwbGljYXRlTWFwPFY+fG51bGwgPSBudWxsO1xuICBwcml2YXRlIF9wcmV2aW91c0l0SGVhZDogSXRlcmFibGVDaGFuZ2VSZWNvcmRfPFY+fG51bGwgPSBudWxsO1xuICBwcml2YXRlIF9pdEhlYWQ6IEl0ZXJhYmxlQ2hhbmdlUmVjb3JkXzxWPnxudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBfaXRUYWlsOiBJdGVyYWJsZUNoYW5nZVJlY29yZF88Vj58bnVsbCA9IG51bGw7XG4gIHByaXZhdGUgX2FkZGl0aW9uc0hlYWQ6IEl0ZXJhYmxlQ2hhbmdlUmVjb3JkXzxWPnxudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBfYWRkaXRpb25zVGFpbDogSXRlcmFibGVDaGFuZ2VSZWNvcmRfPFY+fG51bGwgPSBudWxsO1xuICBwcml2YXRlIF9tb3Zlc0hlYWQ6IEl0ZXJhYmxlQ2hhbmdlUmVjb3JkXzxWPnxudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBfbW92ZXNUYWlsOiBJdGVyYWJsZUNoYW5nZVJlY29yZF88Vj58bnVsbCA9IG51bGw7XG4gIHByaXZhdGUgX3JlbW92YWxzSGVhZDogSXRlcmFibGVDaGFuZ2VSZWNvcmRfPFY+fG51bGwgPSBudWxsO1xuICBwcml2YXRlIF9yZW1vdmFsc1RhaWw6IEl0ZXJhYmxlQ2hhbmdlUmVjb3JkXzxWPnxudWxsID0gbnVsbDtcbiAgLy8gS2VlcHMgdHJhY2sgb2YgcmVjb3JkcyB3aGVyZSBjdXN0b20gdHJhY2sgYnkgaXMgdGhlIHNhbWUsIGJ1dCBpdGVtIGlkZW50aXR5IGhhcyBjaGFuZ2VkXG4gIHByaXZhdGUgX2lkZW50aXR5Q2hhbmdlc0hlYWQ6IEl0ZXJhYmxlQ2hhbmdlUmVjb3JkXzxWPnxudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBfaWRlbnRpdHlDaGFuZ2VzVGFpbDogSXRlcmFibGVDaGFuZ2VSZWNvcmRfPFY+fG51bGwgPSBudWxsO1xuICBwcml2YXRlIF90cmFja0J5Rm46IFRyYWNrQnlGdW5jdGlvbjxWPjtcblxuICBjb25zdHJ1Y3Rvcih0cmFja0J5Rm4/OiBUcmFja0J5RnVuY3Rpb248Vj4pIHtcbiAgICB0aGlzLl90cmFja0J5Rm4gPSB0cmFja0J5Rm4gfHwgdHJhY2tCeUlkZW50aXR5O1xuICB9XG5cbiAgZm9yRWFjaEl0ZW0oZm46IChyZWNvcmQ6IEl0ZXJhYmxlQ2hhbmdlUmVjb3JkXzxWPikgPT4gdm9pZCkge1xuICAgIGxldCByZWNvcmQ6IEl0ZXJhYmxlQ2hhbmdlUmVjb3JkXzxWPnxudWxsO1xuICAgIGZvciAocmVjb3JkID0gdGhpcy5faXRIZWFkOyByZWNvcmQgIT09IG51bGw7IHJlY29yZCA9IHJlY29yZC5fbmV4dCkge1xuICAgICAgZm4ocmVjb3JkKTtcbiAgICB9XG4gIH1cblxuICBmb3JFYWNoT3BlcmF0aW9uKFxuICAgICAgZm46IChpdGVtOiBJdGVyYWJsZUNoYW5nZVJlY29yZDxWPiwgcHJldmlvdXNJbmRleDogbnVtYmVyfG51bGwsIGN1cnJlbnRJbmRleDogbnVtYmVyfG51bGwpID0+XG4gICAgICAgICAgdm9pZCkge1xuICAgIGxldCBuZXh0SXQgPSB0aGlzLl9pdEhlYWQ7XG4gICAgbGV0IG5leHRSZW1vdmUgPSB0aGlzLl9yZW1vdmFsc0hlYWQ7XG4gICAgbGV0IGFkZFJlbW92ZU9mZnNldCA9IDA7XG4gICAgbGV0IG1vdmVPZmZzZXRzOiBudW1iZXJbXXxudWxsID0gbnVsbDtcbiAgICB3aGlsZSAobmV4dEl0IHx8IG5leHRSZW1vdmUpIHtcbiAgICAgIC8vIEZpZ3VyZSBvdXQgd2hpY2ggaXMgdGhlIG5leHQgcmVjb3JkIHRvIHByb2Nlc3NcbiAgICAgIC8vIE9yZGVyOiByZW1vdmUsIGFkZCwgbW92ZVxuICAgICAgY29uc3QgcmVjb3JkOiBJdGVyYWJsZUNoYW5nZVJlY29yZDxWPiA9ICFuZXh0UmVtb3ZlIHx8XG4gICAgICAgICAgICAgIG5leHRJdCAmJlxuICAgICAgICAgICAgICAgICAgbmV4dEl0LmN1cnJlbnRJbmRleCEgPFxuICAgICAgICAgICAgICAgICAgICAgIGdldFByZXZpb3VzSW5kZXgobmV4dFJlbW92ZSwgYWRkUmVtb3ZlT2Zmc2V0LCBtb3ZlT2Zmc2V0cykgP1xuICAgICAgICAgIG5leHRJdCEgOlxuICAgICAgICAgIG5leHRSZW1vdmU7XG4gICAgICBjb25zdCBhZGpQcmV2aW91c0luZGV4ID0gZ2V0UHJldmlvdXNJbmRleChyZWNvcmQsIGFkZFJlbW92ZU9mZnNldCwgbW92ZU9mZnNldHMpO1xuICAgICAgY29uc3QgY3VycmVudEluZGV4ID0gcmVjb3JkLmN1cnJlbnRJbmRleDtcblxuICAgICAgLy8gY29uc3VtZSB0aGUgaXRlbSwgYW5kIGFkanVzdCB0aGUgYWRkUmVtb3ZlT2Zmc2V0IGFuZCB1cGRhdGUgbW92ZURpc3RhbmNlIGlmIG5lY2Vzc2FyeVxuICAgICAgaWYgKHJlY29yZCA9PT0gbmV4dFJlbW92ZSkge1xuICAgICAgICBhZGRSZW1vdmVPZmZzZXQtLTtcbiAgICAgICAgbmV4dFJlbW92ZSA9IG5leHRSZW1vdmUuX25leHRSZW1vdmVkO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbmV4dEl0ID0gbmV4dEl0IS5fbmV4dDtcbiAgICAgICAgaWYgKHJlY29yZC5wcmV2aW91c0luZGV4ID09IG51bGwpIHtcbiAgICAgICAgICBhZGRSZW1vdmVPZmZzZXQrKztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBJTlZBUklBTlQ6ICBjdXJyZW50SW5kZXggPCBwcmV2aW91c0luZGV4XG4gICAgICAgICAgaWYgKCFtb3ZlT2Zmc2V0cykgbW92ZU9mZnNldHMgPSBbXTtcbiAgICAgICAgICBjb25zdCBsb2NhbE1vdmVQcmV2aW91c0luZGV4ID0gYWRqUHJldmlvdXNJbmRleCAtIGFkZFJlbW92ZU9mZnNldDtcbiAgICAgICAgICBjb25zdCBsb2NhbEN1cnJlbnRJbmRleCA9IGN1cnJlbnRJbmRleCEgLSBhZGRSZW1vdmVPZmZzZXQ7XG4gICAgICAgICAgaWYgKGxvY2FsTW92ZVByZXZpb3VzSW5kZXggIT0gbG9jYWxDdXJyZW50SW5kZXgpIHtcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbG9jYWxNb3ZlUHJldmlvdXNJbmRleDsgaSsrKSB7XG4gICAgICAgICAgICAgIGNvbnN0IG9mZnNldCA9IGkgPCBtb3ZlT2Zmc2V0cy5sZW5ndGggPyBtb3ZlT2Zmc2V0c1tpXSA6IChtb3ZlT2Zmc2V0c1tpXSA9IDApO1xuICAgICAgICAgICAgICBjb25zdCBpbmRleCA9IG9mZnNldCArIGk7XG4gICAgICAgICAgICAgIGlmIChsb2NhbEN1cnJlbnRJbmRleCA8PSBpbmRleCAmJiBpbmRleCA8IGxvY2FsTW92ZVByZXZpb3VzSW5kZXgpIHtcbiAgICAgICAgICAgICAgICBtb3ZlT2Zmc2V0c1tpXSA9IG9mZnNldCArIDE7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IHByZXZpb3VzSW5kZXggPSByZWNvcmQucHJldmlvdXNJbmRleDtcbiAgICAgICAgICAgIG1vdmVPZmZzZXRzW3ByZXZpb3VzSW5kZXhdID0gbG9jYWxDdXJyZW50SW5kZXggLSBsb2NhbE1vdmVQcmV2aW91c0luZGV4O1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAoYWRqUHJldmlvdXNJbmRleCAhPT0gY3VycmVudEluZGV4KSB7XG4gICAgICAgIGZuKHJlY29yZCwgYWRqUHJldmlvdXNJbmRleCwgY3VycmVudEluZGV4KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBmb3JFYWNoUHJldmlvdXNJdGVtKGZuOiAocmVjb3JkOiBJdGVyYWJsZUNoYW5nZVJlY29yZF88Vj4pID0+IHZvaWQpIHtcbiAgICBsZXQgcmVjb3JkOiBJdGVyYWJsZUNoYW5nZVJlY29yZF88Vj58bnVsbDtcbiAgICBmb3IgKHJlY29yZCA9IHRoaXMuX3ByZXZpb3VzSXRIZWFkOyByZWNvcmQgIT09IG51bGw7IHJlY29yZCA9IHJlY29yZC5fbmV4dFByZXZpb3VzKSB7XG4gICAgICBmbihyZWNvcmQpO1xuICAgIH1cbiAgfVxuXG4gIGZvckVhY2hBZGRlZEl0ZW0oZm46IChyZWNvcmQ6IEl0ZXJhYmxlQ2hhbmdlUmVjb3JkXzxWPikgPT4gdm9pZCkge1xuICAgIGxldCByZWNvcmQ6IEl0ZXJhYmxlQ2hhbmdlUmVjb3JkXzxWPnxudWxsO1xuICAgIGZvciAocmVjb3JkID0gdGhpcy5fYWRkaXRpb25zSGVhZDsgcmVjb3JkICE9PSBudWxsOyByZWNvcmQgPSByZWNvcmQuX25leHRBZGRlZCkge1xuICAgICAgZm4ocmVjb3JkKTtcbiAgICB9XG4gIH1cblxuICBmb3JFYWNoTW92ZWRJdGVtKGZuOiAocmVjb3JkOiBJdGVyYWJsZUNoYW5nZVJlY29yZF88Vj4pID0+IHZvaWQpIHtcbiAgICBsZXQgcmVjb3JkOiBJdGVyYWJsZUNoYW5nZVJlY29yZF88Vj58bnVsbDtcbiAgICBmb3IgKHJlY29yZCA9IHRoaXMuX21vdmVzSGVhZDsgcmVjb3JkICE9PSBudWxsOyByZWNvcmQgPSByZWNvcmQuX25leHRNb3ZlZCkge1xuICAgICAgZm4ocmVjb3JkKTtcbiAgICB9XG4gIH1cblxuICBmb3JFYWNoUmVtb3ZlZEl0ZW0oZm46IChyZWNvcmQ6IEl0ZXJhYmxlQ2hhbmdlUmVjb3JkXzxWPikgPT4gdm9pZCkge1xuICAgIGxldCByZWNvcmQ6IEl0ZXJhYmxlQ2hhbmdlUmVjb3JkXzxWPnxudWxsO1xuICAgIGZvciAocmVjb3JkID0gdGhpcy5fcmVtb3ZhbHNIZWFkOyByZWNvcmQgIT09IG51bGw7IHJlY29yZCA9IHJlY29yZC5fbmV4dFJlbW92ZWQpIHtcbiAgICAgIGZuKHJlY29yZCk7XG4gICAgfVxuICB9XG5cbiAgZm9yRWFjaElkZW50aXR5Q2hhbmdlKGZuOiAocmVjb3JkOiBJdGVyYWJsZUNoYW5nZVJlY29yZF88Vj4pID0+IHZvaWQpIHtcbiAgICBsZXQgcmVjb3JkOiBJdGVyYWJsZUNoYW5nZVJlY29yZF88Vj58bnVsbDtcbiAgICBmb3IgKHJlY29yZCA9IHRoaXMuX2lkZW50aXR5Q2hhbmdlc0hlYWQ7IHJlY29yZCAhPT0gbnVsbDsgcmVjb3JkID0gcmVjb3JkLl9uZXh0SWRlbnRpdHlDaGFuZ2UpIHtcbiAgICAgIGZuKHJlY29yZCk7XG4gICAgfVxuICB9XG5cbiAgZGlmZihjb2xsZWN0aW9uOiBOZ0l0ZXJhYmxlPFY+fG51bGx8dW5kZWZpbmVkKTogRGVmYXVsdEl0ZXJhYmxlRGlmZmVyPFY+fG51bGwge1xuICAgIGlmIChjb2xsZWN0aW9uID09IG51bGwpIGNvbGxlY3Rpb24gPSBbXTtcbiAgICBpZiAoIWlzTGlzdExpa2VJdGVyYWJsZShjb2xsZWN0aW9uKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgIGBFcnJvciB0cnlpbmcgdG8gZGlmZiAnJHtzdHJpbmdpZnkoY29sbGVjdGlvbil9Jy4gT25seSBhcnJheXMgYW5kIGl0ZXJhYmxlcyBhcmUgYWxsb3dlZGApO1xuICAgIH1cblxuICAgIGlmICh0aGlzLmNoZWNrKGNvbGxlY3Rpb24pKSB7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICB9XG5cbiAgb25EZXN0cm95KCkge31cblxuICBjaGVjayhjb2xsZWN0aW9uOiBOZ0l0ZXJhYmxlPFY+KTogYm9vbGVhbiB7XG4gICAgdGhpcy5fcmVzZXQoKTtcblxuICAgIGxldCByZWNvcmQ6IEl0ZXJhYmxlQ2hhbmdlUmVjb3JkXzxWPnxudWxsID0gdGhpcy5faXRIZWFkO1xuICAgIGxldCBtYXlCZURpcnR5OiBib29sZWFuID0gZmFsc2U7XG4gICAgbGV0IGluZGV4OiBudW1iZXI7XG4gICAgbGV0IGl0ZW06IFY7XG4gICAgbGV0IGl0ZW1UcmFja0J5OiBhbnk7XG4gICAgaWYgKEFycmF5LmlzQXJyYXkoY29sbGVjdGlvbikpIHtcbiAgICAgICh0aGlzIGFzIHtsZW5ndGg6IG51bWJlcn0pLmxlbmd0aCA9IGNvbGxlY3Rpb24ubGVuZ3RoO1xuXG4gICAgICBmb3IgKGxldCBpbmRleCA9IDA7IGluZGV4IDwgdGhpcy5sZW5ndGg7IGluZGV4KyspIHtcbiAgICAgICAgaXRlbSA9IGNvbGxlY3Rpb25baW5kZXhdO1xuICAgICAgICBpdGVtVHJhY2tCeSA9IHRoaXMuX3RyYWNrQnlGbihpbmRleCwgaXRlbSk7XG4gICAgICAgIGlmIChyZWNvcmQgPT09IG51bGwgfHwgIWxvb3NlSWRlbnRpY2FsKHJlY29yZC50cmFja0J5SWQsIGl0ZW1UcmFja0J5KSkge1xuICAgICAgICAgIHJlY29yZCA9IHRoaXMuX21pc21hdGNoKHJlY29yZCwgaXRlbSwgaXRlbVRyYWNrQnksIGluZGV4KTtcbiAgICAgICAgICBtYXlCZURpcnR5ID0gdHJ1ZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBpZiAobWF5QmVEaXJ0eSkge1xuICAgICAgICAgICAgLy8gVE9ETyhtaXNrbyk6IGNhbiB3ZSBsaW1pdCB0aGlzIHRvIGR1cGxpY2F0ZXMgb25seT9cbiAgICAgICAgICAgIHJlY29yZCA9IHRoaXMuX3ZlcmlmeVJlaW5zZXJ0aW9uKHJlY29yZCwgaXRlbSwgaXRlbVRyYWNrQnksIGluZGV4KTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKCFsb29zZUlkZW50aWNhbChyZWNvcmQuaXRlbSwgaXRlbSkpIHRoaXMuX2FkZElkZW50aXR5Q2hhbmdlKHJlY29yZCwgaXRlbSk7XG4gICAgICAgIH1cblxuICAgICAgICByZWNvcmQgPSByZWNvcmQuX25leHQ7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGluZGV4ID0gMDtcbiAgICAgIGl0ZXJhdGVMaXN0TGlrZShjb2xsZWN0aW9uLCAoaXRlbTogVikgPT4ge1xuICAgICAgICBpdGVtVHJhY2tCeSA9IHRoaXMuX3RyYWNrQnlGbihpbmRleCwgaXRlbSk7XG4gICAgICAgIGlmIChyZWNvcmQgPT09IG51bGwgfHwgIWxvb3NlSWRlbnRpY2FsKHJlY29yZC50cmFja0J5SWQsIGl0ZW1UcmFja0J5KSkge1xuICAgICAgICAgIHJlY29yZCA9IHRoaXMuX21pc21hdGNoKHJlY29yZCwgaXRlbSwgaXRlbVRyYWNrQnksIGluZGV4KTtcbiAgICAgICAgICBtYXlCZURpcnR5ID0gdHJ1ZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBpZiAobWF5QmVEaXJ0eSkge1xuICAgICAgICAgICAgLy8gVE9ETyhtaXNrbyk6IGNhbiB3ZSBsaW1pdCB0aGlzIHRvIGR1cGxpY2F0ZXMgb25seT9cbiAgICAgICAgICAgIHJlY29yZCA9IHRoaXMuX3ZlcmlmeVJlaW5zZXJ0aW9uKHJlY29yZCwgaXRlbSwgaXRlbVRyYWNrQnksIGluZGV4KTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKCFsb29zZUlkZW50aWNhbChyZWNvcmQuaXRlbSwgaXRlbSkpIHRoaXMuX2FkZElkZW50aXR5Q2hhbmdlKHJlY29yZCwgaXRlbSk7XG4gICAgICAgIH1cbiAgICAgICAgcmVjb3JkID0gcmVjb3JkLl9uZXh0O1xuICAgICAgICBpbmRleCsrO1xuICAgICAgfSk7XG4gICAgICAodGhpcyBhcyB7bGVuZ3RoOiBudW1iZXJ9KS5sZW5ndGggPSBpbmRleDtcbiAgICB9XG5cbiAgICB0aGlzLl90cnVuY2F0ZShyZWNvcmQpO1xuICAgICh0aGlzIGFzIHtjb2xsZWN0aW9uOiBWW10gfCBJdGVyYWJsZTxWPn0pLmNvbGxlY3Rpb24gPSBjb2xsZWN0aW9uO1xuICAgIHJldHVybiB0aGlzLmlzRGlydHk7XG4gIH1cblxuICAvKiBDb2xsZWN0aW9uQ2hhbmdlcyBpcyBjb25zaWRlcmVkIGRpcnR5IGlmIGl0IGhhcyBhbnkgYWRkaXRpb25zLCBtb3ZlcywgcmVtb3ZhbHMsIG9yIGlkZW50aXR5XG4gICAqIGNoYW5nZXMuXG4gICAqL1xuICBnZXQgaXNEaXJ0eSgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5fYWRkaXRpb25zSGVhZCAhPT0gbnVsbCB8fCB0aGlzLl9tb3Zlc0hlYWQgIT09IG51bGwgfHxcbiAgICAgICAgdGhpcy5fcmVtb3ZhbHNIZWFkICE9PSBudWxsIHx8IHRoaXMuX2lkZW50aXR5Q2hhbmdlc0hlYWQgIT09IG51bGw7XG4gIH1cblxuICAvKipcbiAgICogUmVzZXQgdGhlIHN0YXRlIG9mIHRoZSBjaGFuZ2Ugb2JqZWN0cyB0byBzaG93IG5vIGNoYW5nZXMuIFRoaXMgbWVhbnMgc2V0IHByZXZpb3VzS2V5IHRvXG4gICAqIGN1cnJlbnRLZXksIGFuZCBjbGVhciBhbGwgb2YgdGhlIHF1ZXVlcyAoYWRkaXRpb25zLCBtb3ZlcywgcmVtb3ZhbHMpLlxuICAgKiBTZXQgdGhlIHByZXZpb3VzSW5kZXhlcyBvZiBtb3ZlZCBhbmQgYWRkZWQgaXRlbXMgdG8gdGhlaXIgY3VycmVudEluZGV4ZXNcbiAgICogUmVzZXQgdGhlIGxpc3Qgb2YgYWRkaXRpb25zLCBtb3ZlcyBhbmQgcmVtb3ZhbHNcbiAgICpcbiAgICogQGludGVybmFsXG4gICAqL1xuICBfcmVzZXQoKSB7XG4gICAgaWYgKHRoaXMuaXNEaXJ0eSkge1xuICAgICAgbGV0IHJlY29yZDogSXRlcmFibGVDaGFuZ2VSZWNvcmRfPFY+fG51bGw7XG4gICAgICBsZXQgbmV4dFJlY29yZDogSXRlcmFibGVDaGFuZ2VSZWNvcmRfPFY+fG51bGw7XG5cbiAgICAgIGZvciAocmVjb3JkID0gdGhpcy5fcHJldmlvdXNJdEhlYWQgPSB0aGlzLl9pdEhlYWQ7IHJlY29yZCAhPT0gbnVsbDsgcmVjb3JkID0gcmVjb3JkLl9uZXh0KSB7XG4gICAgICAgIHJlY29yZC5fbmV4dFByZXZpb3VzID0gcmVjb3JkLl9uZXh0O1xuICAgICAgfVxuXG4gICAgICBmb3IgKHJlY29yZCA9IHRoaXMuX2FkZGl0aW9uc0hlYWQ7IHJlY29yZCAhPT0gbnVsbDsgcmVjb3JkID0gcmVjb3JkLl9uZXh0QWRkZWQpIHtcbiAgICAgICAgcmVjb3JkLnByZXZpb3VzSW5kZXggPSByZWNvcmQuY3VycmVudEluZGV4O1xuICAgICAgfVxuICAgICAgdGhpcy5fYWRkaXRpb25zSGVhZCA9IHRoaXMuX2FkZGl0aW9uc1RhaWwgPSBudWxsO1xuXG4gICAgICBmb3IgKHJlY29yZCA9IHRoaXMuX21vdmVzSGVhZDsgcmVjb3JkICE9PSBudWxsOyByZWNvcmQgPSBuZXh0UmVjb3JkKSB7XG4gICAgICAgIHJlY29yZC5wcmV2aW91c0luZGV4ID0gcmVjb3JkLmN1cnJlbnRJbmRleDtcbiAgICAgICAgbmV4dFJlY29yZCA9IHJlY29yZC5fbmV4dE1vdmVkO1xuICAgICAgfVxuICAgICAgdGhpcy5fbW92ZXNIZWFkID0gdGhpcy5fbW92ZXNUYWlsID0gbnVsbDtcbiAgICAgIHRoaXMuX3JlbW92YWxzSGVhZCA9IHRoaXMuX3JlbW92YWxzVGFpbCA9IG51bGw7XG4gICAgICB0aGlzLl9pZGVudGl0eUNoYW5nZXNIZWFkID0gdGhpcy5faWRlbnRpdHlDaGFuZ2VzVGFpbCA9IG51bGw7XG5cbiAgICAgIC8vIFRPRE8odmljYik6IHdoZW4gYXNzZXJ0IGdldHMgc3VwcG9ydGVkXG4gICAgICAvLyBhc3NlcnQoIXRoaXMuaXNEaXJ0eSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFRoaXMgaXMgdGhlIGNvcmUgZnVuY3Rpb24gd2hpY2ggaGFuZGxlcyBkaWZmZXJlbmNlcyBiZXR3ZWVuIGNvbGxlY3Rpb25zLlxuICAgKlxuICAgKiAtIGByZWNvcmRgIGlzIHRoZSByZWNvcmQgd2hpY2ggd2Ugc2F3IGF0IHRoaXMgcG9zaXRpb24gbGFzdCB0aW1lLiBJZiBudWxsIHRoZW4gaXQgaXMgYSBuZXdcbiAgICogICBpdGVtLlxuICAgKiAtIGBpdGVtYCBpcyB0aGUgY3VycmVudCBpdGVtIGluIHRoZSBjb2xsZWN0aW9uXG4gICAqIC0gYGluZGV4YCBpcyB0aGUgcG9zaXRpb24gb2YgdGhlIGl0ZW0gaW4gdGhlIGNvbGxlY3Rpb25cbiAgICpcbiAgICogQGludGVybmFsXG4gICAqL1xuICBfbWlzbWF0Y2gocmVjb3JkOiBJdGVyYWJsZUNoYW5nZVJlY29yZF88Vj58bnVsbCwgaXRlbTogViwgaXRlbVRyYWNrQnk6IGFueSwgaW5kZXg6IG51bWJlcik6XG4gICAgICBJdGVyYWJsZUNoYW5nZVJlY29yZF88Vj4ge1xuICAgIC8vIFRoZSBwcmV2aW91cyByZWNvcmQgYWZ0ZXIgd2hpY2ggd2Ugd2lsbCBhcHBlbmQgdGhlIGN1cnJlbnQgb25lLlxuICAgIGxldCBwcmV2aW91c1JlY29yZDogSXRlcmFibGVDaGFuZ2VSZWNvcmRfPFY+fG51bGw7XG5cbiAgICBpZiAocmVjb3JkID09PSBudWxsKSB7XG4gICAgICBwcmV2aW91c1JlY29yZCA9IHRoaXMuX2l0VGFpbDtcbiAgICB9IGVsc2Uge1xuICAgICAgcHJldmlvdXNSZWNvcmQgPSByZWNvcmQuX3ByZXY7XG4gICAgICAvLyBSZW1vdmUgdGhlIHJlY29yZCBmcm9tIHRoZSBjb2xsZWN0aW9uIHNpbmNlIHdlIGtub3cgaXQgZG9lcyBub3QgbWF0Y2ggdGhlIGl0ZW0uXG4gICAgICB0aGlzLl9yZW1vdmUocmVjb3JkKTtcbiAgICB9XG5cbiAgICAvLyBBdHRlbXB0IHRvIHNlZSBpZiB3ZSBoYXZlIHNlZW4gdGhlIGl0ZW0gYmVmb3JlLlxuICAgIHJlY29yZCA9IHRoaXMuX2xpbmtlZFJlY29yZHMgPT09IG51bGwgPyBudWxsIDogdGhpcy5fbGlua2VkUmVjb3Jkcy5nZXQoaXRlbVRyYWNrQnksIGluZGV4KTtcbiAgICBpZiAocmVjb3JkICE9PSBudWxsKSB7XG4gICAgICAvLyBXZSBoYXZlIHNlZW4gdGhpcyBiZWZvcmUsIHdlIG5lZWQgdG8gbW92ZSBpdCBmb3J3YXJkIGluIHRoZSBjb2xsZWN0aW9uLlxuICAgICAgLy8gQnV0IGZpcnN0IHdlIG5lZWQgdG8gY2hlY2sgaWYgaWRlbnRpdHkgY2hhbmdlZCwgc28gd2UgY2FuIHVwZGF0ZSBpbiB2aWV3IGlmIG5lY2Vzc2FyeVxuICAgICAgaWYgKCFsb29zZUlkZW50aWNhbChyZWNvcmQuaXRlbSwgaXRlbSkpIHRoaXMuX2FkZElkZW50aXR5Q2hhbmdlKHJlY29yZCwgaXRlbSk7XG5cbiAgICAgIHRoaXMuX21vdmVBZnRlcihyZWNvcmQsIHByZXZpb3VzUmVjb3JkLCBpbmRleCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIE5ldmVyIHNlZW4gaXQsIGNoZWNrIGV2aWN0ZWQgbGlzdC5cbiAgICAgIHJlY29yZCA9IHRoaXMuX3VubGlua2VkUmVjb3JkcyA9PT0gbnVsbCA/IG51bGwgOiB0aGlzLl91bmxpbmtlZFJlY29yZHMuZ2V0KGl0ZW1UcmFja0J5LCBudWxsKTtcbiAgICAgIGlmIChyZWNvcmQgIT09IG51bGwpIHtcbiAgICAgICAgLy8gSXQgaXMgYW4gaXRlbSB3aGljaCB3ZSBoYXZlIGV2aWN0ZWQgZWFybGllcjogcmVpbnNlcnQgaXQgYmFjayBpbnRvIHRoZSBsaXN0LlxuICAgICAgICAvLyBCdXQgZmlyc3Qgd2UgbmVlZCB0byBjaGVjayBpZiBpZGVudGl0eSBjaGFuZ2VkLCBzbyB3ZSBjYW4gdXBkYXRlIGluIHZpZXcgaWYgbmVjZXNzYXJ5XG4gICAgICAgIGlmICghbG9vc2VJZGVudGljYWwocmVjb3JkLml0ZW0sIGl0ZW0pKSB0aGlzLl9hZGRJZGVudGl0eUNoYW5nZShyZWNvcmQsIGl0ZW0pO1xuXG4gICAgICAgIHRoaXMuX3JlaW5zZXJ0QWZ0ZXIocmVjb3JkLCBwcmV2aW91c1JlY29yZCwgaW5kZXgpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gSXQgaXMgYSBuZXcgaXRlbTogYWRkIGl0LlxuICAgICAgICByZWNvcmQgPVxuICAgICAgICAgICAgdGhpcy5fYWRkQWZ0ZXIobmV3IEl0ZXJhYmxlQ2hhbmdlUmVjb3JkXzxWPihpdGVtLCBpdGVtVHJhY2tCeSksIHByZXZpb3VzUmVjb3JkLCBpbmRleCk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiByZWNvcmQ7XG4gIH1cblxuICAvKipcbiAgICogVGhpcyBjaGVjayBpcyBvbmx5IG5lZWRlZCBpZiBhbiBhcnJheSBjb250YWlucyBkdXBsaWNhdGVzLiAoU2hvcnQgY2lyY3VpdCBvZiBub3RoaW5nIGRpcnR5KVxuICAgKlxuICAgKiBVc2UgY2FzZTogYFthLCBhXWAgPT4gYFtiLCBhLCBhXWBcbiAgICpcbiAgICogSWYgd2UgZGlkIG5vdCBoYXZlIHRoaXMgY2hlY2sgdGhlbiB0aGUgaW5zZXJ0aW9uIG9mIGBiYCB3b3VsZDpcbiAgICogICAxKSBldmljdCBmaXJzdCBgYWBcbiAgICogICAyKSBpbnNlcnQgYGJgIGF0IGAwYCBpbmRleC5cbiAgICogICAzKSBsZWF2ZSBgYWAgYXQgaW5kZXggYDFgIGFzIGlzLiA8LS0gdGhpcyBpcyB3cm9uZyFcbiAgICogICAzKSByZWluc2VydCBgYWAgYXQgaW5kZXggMi4gPC0tIHRoaXMgaXMgd3JvbmchXG4gICAqXG4gICAqIFRoZSBjb3JyZWN0IGJlaGF2aW9yIGlzOlxuICAgKiAgIDEpIGV2aWN0IGZpcnN0IGBhYFxuICAgKiAgIDIpIGluc2VydCBgYmAgYXQgYDBgIGluZGV4LlxuICAgKiAgIDMpIHJlaW5zZXJ0IGBhYCBhdCBpbmRleCAxLlxuICAgKiAgIDMpIG1vdmUgYGFgIGF0IGZyb20gYDFgIHRvIGAyYC5cbiAgICpcbiAgICpcbiAgICogRG91YmxlIGNoZWNrIHRoYXQgd2UgaGF2ZSBub3QgZXZpY3RlZCBhIGR1cGxpY2F0ZSBpdGVtLiBXZSBuZWVkIHRvIGNoZWNrIGlmIHRoZSBpdGVtIHR5cGUgbWF5XG4gICAqIGhhdmUgYWxyZWFkeSBiZWVuIHJlbW92ZWQ6XG4gICAqIFRoZSBpbnNlcnRpb24gb2YgYiB3aWxsIGV2aWN0IHRoZSBmaXJzdCAnYScuIElmIHdlIGRvbid0IHJlaW5zZXJ0IGl0IG5vdyBpdCB3aWxsIGJlIHJlaW5zZXJ0ZWRcbiAgICogYXQgdGhlIGVuZC4gV2hpY2ggd2lsbCBzaG93IHVwIGFzIHRoZSB0d28gJ2EncyBzd2l0Y2hpbmcgcG9zaXRpb24uIFRoaXMgaXMgaW5jb3JyZWN0LCBzaW5jZSBhXG4gICAqIGJldHRlciB3YXkgdG8gdGhpbmsgb2YgaXQgaXMgYXMgaW5zZXJ0IG9mICdiJyByYXRoZXIgdGhlbiBzd2l0Y2ggJ2EnIHdpdGggJ2InIGFuZCB0aGVuIGFkZCAnYSdcbiAgICogYXQgdGhlIGVuZC5cbiAgICpcbiAgICogQGludGVybmFsXG4gICAqL1xuICBfdmVyaWZ5UmVpbnNlcnRpb24ocmVjb3JkOiBJdGVyYWJsZUNoYW5nZVJlY29yZF88Vj4sIGl0ZW06IFYsIGl0ZW1UcmFja0J5OiBhbnksIGluZGV4OiBudW1iZXIpOlxuICAgICAgSXRlcmFibGVDaGFuZ2VSZWNvcmRfPFY+IHtcbiAgICBsZXQgcmVpbnNlcnRSZWNvcmQ6IEl0ZXJhYmxlQ2hhbmdlUmVjb3JkXzxWPnxudWxsID1cbiAgICAgICAgdGhpcy5fdW5saW5rZWRSZWNvcmRzID09PSBudWxsID8gbnVsbCA6IHRoaXMuX3VubGlua2VkUmVjb3Jkcy5nZXQoaXRlbVRyYWNrQnksIG51bGwpO1xuICAgIGlmIChyZWluc2VydFJlY29yZCAhPT0gbnVsbCkge1xuICAgICAgcmVjb3JkID0gdGhpcy5fcmVpbnNlcnRBZnRlcihyZWluc2VydFJlY29yZCwgcmVjb3JkLl9wcmV2ISwgaW5kZXgpO1xuICAgIH0gZWxzZSBpZiAocmVjb3JkLmN1cnJlbnRJbmRleCAhPSBpbmRleCkge1xuICAgICAgcmVjb3JkLmN1cnJlbnRJbmRleCA9IGluZGV4O1xuICAgICAgdGhpcy5fYWRkVG9Nb3ZlcyhyZWNvcmQsIGluZGV4KTtcbiAgICB9XG4gICAgcmV0dXJuIHJlY29yZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgcmlkIG9mIGFueSBleGNlc3Mge0BsaW5rIEl0ZXJhYmxlQ2hhbmdlUmVjb3JkX31zIGZyb20gdGhlIHByZXZpb3VzIGNvbGxlY3Rpb25cbiAgICpcbiAgICogLSBgcmVjb3JkYCBUaGUgZmlyc3QgZXhjZXNzIHtAbGluayBJdGVyYWJsZUNoYW5nZVJlY29yZF99LlxuICAgKlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIF90cnVuY2F0ZShyZWNvcmQ6IEl0ZXJhYmxlQ2hhbmdlUmVjb3JkXzxWPnxudWxsKSB7XG4gICAgLy8gQW55dGhpbmcgYWZ0ZXIgdGhhdCBuZWVkcyB0byBiZSByZW1vdmVkO1xuICAgIHdoaWxlIChyZWNvcmQgIT09IG51bGwpIHtcbiAgICAgIGNvbnN0IG5leHRSZWNvcmQ6IEl0ZXJhYmxlQ2hhbmdlUmVjb3JkXzxWPnxudWxsID0gcmVjb3JkLl9uZXh0O1xuICAgICAgdGhpcy5fYWRkVG9SZW1vdmFscyh0aGlzLl91bmxpbmsocmVjb3JkKSk7XG4gICAgICByZWNvcmQgPSBuZXh0UmVjb3JkO1xuICAgIH1cbiAgICBpZiAodGhpcy5fdW5saW5rZWRSZWNvcmRzICE9PSBudWxsKSB7XG4gICAgICB0aGlzLl91bmxpbmtlZFJlY29yZHMuY2xlYXIoKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5fYWRkaXRpb25zVGFpbCAhPT0gbnVsbCkge1xuICAgICAgdGhpcy5fYWRkaXRpb25zVGFpbC5fbmV4dEFkZGVkID0gbnVsbDtcbiAgICB9XG4gICAgaWYgKHRoaXMuX21vdmVzVGFpbCAhPT0gbnVsbCkge1xuICAgICAgdGhpcy5fbW92ZXNUYWlsLl9uZXh0TW92ZWQgPSBudWxsO1xuICAgIH1cbiAgICBpZiAodGhpcy5faXRUYWlsICE9PSBudWxsKSB7XG4gICAgICB0aGlzLl9pdFRhaWwuX25leHQgPSBudWxsO1xuICAgIH1cbiAgICBpZiAodGhpcy5fcmVtb3ZhbHNUYWlsICE9PSBudWxsKSB7XG4gICAgICB0aGlzLl9yZW1vdmFsc1RhaWwuX25leHRSZW1vdmVkID0gbnVsbDtcbiAgICB9XG4gICAgaWYgKHRoaXMuX2lkZW50aXR5Q2hhbmdlc1RhaWwgIT09IG51bGwpIHtcbiAgICAgIHRoaXMuX2lkZW50aXR5Q2hhbmdlc1RhaWwuX25leHRJZGVudGl0eUNoYW5nZSA9IG51bGw7XG4gICAgfVxuICB9XG5cbiAgLyoqIEBpbnRlcm5hbCAqL1xuICBfcmVpbnNlcnRBZnRlcihcbiAgICAgIHJlY29yZDogSXRlcmFibGVDaGFuZ2VSZWNvcmRfPFY+LCBwcmV2UmVjb3JkOiBJdGVyYWJsZUNoYW5nZVJlY29yZF88Vj58bnVsbCxcbiAgICAgIGluZGV4OiBudW1iZXIpOiBJdGVyYWJsZUNoYW5nZVJlY29yZF88Vj4ge1xuICAgIGlmICh0aGlzLl91bmxpbmtlZFJlY29yZHMgIT09IG51bGwpIHtcbiAgICAgIHRoaXMuX3VubGlua2VkUmVjb3Jkcy5yZW1vdmUocmVjb3JkKTtcbiAgICB9XG4gICAgY29uc3QgcHJldiA9IHJlY29yZC5fcHJldlJlbW92ZWQ7XG4gICAgY29uc3QgbmV4dCA9IHJlY29yZC5fbmV4dFJlbW92ZWQ7XG5cbiAgICBpZiAocHJldiA9PT0gbnVsbCkge1xuICAgICAgdGhpcy5fcmVtb3ZhbHNIZWFkID0gbmV4dDtcbiAgICB9IGVsc2Uge1xuICAgICAgcHJldi5fbmV4dFJlbW92ZWQgPSBuZXh0O1xuICAgIH1cbiAgICBpZiAobmV4dCA9PT0gbnVsbCkge1xuICAgICAgdGhpcy5fcmVtb3ZhbHNUYWlsID0gcHJldjtcbiAgICB9IGVsc2Uge1xuICAgICAgbmV4dC5fcHJldlJlbW92ZWQgPSBwcmV2O1xuICAgIH1cblxuICAgIHRoaXMuX2luc2VydEFmdGVyKHJlY29yZCwgcHJldlJlY29yZCwgaW5kZXgpO1xuICAgIHRoaXMuX2FkZFRvTW92ZXMocmVjb3JkLCBpbmRleCk7XG4gICAgcmV0dXJuIHJlY29yZDtcbiAgfVxuXG4gIC8qKiBAaW50ZXJuYWwgKi9cbiAgX21vdmVBZnRlcihcbiAgICAgIHJlY29yZDogSXRlcmFibGVDaGFuZ2VSZWNvcmRfPFY+LCBwcmV2UmVjb3JkOiBJdGVyYWJsZUNoYW5nZVJlY29yZF88Vj58bnVsbCxcbiAgICAgIGluZGV4OiBudW1iZXIpOiBJdGVyYWJsZUNoYW5nZVJlY29yZF88Vj4ge1xuICAgIHRoaXMuX3VubGluayhyZWNvcmQpO1xuICAgIHRoaXMuX2luc2VydEFmdGVyKHJlY29yZCwgcHJldlJlY29yZCwgaW5kZXgpO1xuICAgIHRoaXMuX2FkZFRvTW92ZXMocmVjb3JkLCBpbmRleCk7XG4gICAgcmV0dXJuIHJlY29yZDtcbiAgfVxuXG4gIC8qKiBAaW50ZXJuYWwgKi9cbiAgX2FkZEFmdGVyKFxuICAgICAgcmVjb3JkOiBJdGVyYWJsZUNoYW5nZVJlY29yZF88Vj4sIHByZXZSZWNvcmQ6IEl0ZXJhYmxlQ2hhbmdlUmVjb3JkXzxWPnxudWxsLFxuICAgICAgaW5kZXg6IG51bWJlcik6IEl0ZXJhYmxlQ2hhbmdlUmVjb3JkXzxWPiB7XG4gICAgdGhpcy5faW5zZXJ0QWZ0ZXIocmVjb3JkLCBwcmV2UmVjb3JkLCBpbmRleCk7XG5cbiAgICBpZiAodGhpcy5fYWRkaXRpb25zVGFpbCA9PT0gbnVsbCkge1xuICAgICAgLy8gVE9ETyh2aWNiKTpcbiAgICAgIC8vIGFzc2VydCh0aGlzLl9hZGRpdGlvbnNIZWFkID09PSBudWxsKTtcbiAgICAgIHRoaXMuX2FkZGl0aW9uc1RhaWwgPSB0aGlzLl9hZGRpdGlvbnNIZWFkID0gcmVjb3JkO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBUT0RPKHZpY2IpOlxuICAgICAgLy8gYXNzZXJ0KF9hZGRpdGlvbnNUYWlsLl9uZXh0QWRkZWQgPT09IG51bGwpO1xuICAgICAgLy8gYXNzZXJ0KHJlY29yZC5fbmV4dEFkZGVkID09PSBudWxsKTtcbiAgICAgIHRoaXMuX2FkZGl0aW9uc1RhaWwgPSB0aGlzLl9hZGRpdGlvbnNUYWlsLl9uZXh0QWRkZWQgPSByZWNvcmQ7XG4gICAgfVxuICAgIHJldHVybiByZWNvcmQ7XG4gIH1cblxuICAvKiogQGludGVybmFsICovXG4gIF9pbnNlcnRBZnRlcihcbiAgICAgIHJlY29yZDogSXRlcmFibGVDaGFuZ2VSZWNvcmRfPFY+LCBwcmV2UmVjb3JkOiBJdGVyYWJsZUNoYW5nZVJlY29yZF88Vj58bnVsbCxcbiAgICAgIGluZGV4OiBudW1iZXIpOiBJdGVyYWJsZUNoYW5nZVJlY29yZF88Vj4ge1xuICAgIC8vIFRPRE8odmljYik6XG4gICAgLy8gYXNzZXJ0KHJlY29yZCAhPSBwcmV2UmVjb3JkKTtcbiAgICAvLyBhc3NlcnQocmVjb3JkLl9uZXh0ID09PSBudWxsKTtcbiAgICAvLyBhc3NlcnQocmVjb3JkLl9wcmV2ID09PSBudWxsKTtcblxuICAgIGNvbnN0IG5leHQ6IEl0ZXJhYmxlQ2hhbmdlUmVjb3JkXzxWPnxudWxsID1cbiAgICAgICAgcHJldlJlY29yZCA9PT0gbnVsbCA/IHRoaXMuX2l0SGVhZCA6IHByZXZSZWNvcmQuX25leHQ7XG4gICAgLy8gVE9ETyh2aWNiKTpcbiAgICAvLyBhc3NlcnQobmV4dCAhPSByZWNvcmQpO1xuICAgIC8vIGFzc2VydChwcmV2UmVjb3JkICE9IHJlY29yZCk7XG4gICAgcmVjb3JkLl9uZXh0ID0gbmV4dDtcbiAgICByZWNvcmQuX3ByZXYgPSBwcmV2UmVjb3JkO1xuICAgIGlmIChuZXh0ID09PSBudWxsKSB7XG4gICAgICB0aGlzLl9pdFRhaWwgPSByZWNvcmQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIG5leHQuX3ByZXYgPSByZWNvcmQ7XG4gICAgfVxuICAgIGlmIChwcmV2UmVjb3JkID09PSBudWxsKSB7XG4gICAgICB0aGlzLl9pdEhlYWQgPSByZWNvcmQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIHByZXZSZWNvcmQuX25leHQgPSByZWNvcmQ7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuX2xpbmtlZFJlY29yZHMgPT09IG51bGwpIHtcbiAgICAgIHRoaXMuX2xpbmtlZFJlY29yZHMgPSBuZXcgX0R1cGxpY2F0ZU1hcDxWPigpO1xuICAgIH1cbiAgICB0aGlzLl9saW5rZWRSZWNvcmRzLnB1dChyZWNvcmQpO1xuXG4gICAgcmVjb3JkLmN1cnJlbnRJbmRleCA9IGluZGV4O1xuICAgIHJldHVybiByZWNvcmQ7XG4gIH1cblxuICAvKiogQGludGVybmFsICovXG4gIF9yZW1vdmUocmVjb3JkOiBJdGVyYWJsZUNoYW5nZVJlY29yZF88Vj4pOiBJdGVyYWJsZUNoYW5nZVJlY29yZF88Vj4ge1xuICAgIHJldHVybiB0aGlzLl9hZGRUb1JlbW92YWxzKHRoaXMuX3VubGluayhyZWNvcmQpKTtcbiAgfVxuXG4gIC8qKiBAaW50ZXJuYWwgKi9cbiAgX3VubGluayhyZWNvcmQ6IEl0ZXJhYmxlQ2hhbmdlUmVjb3JkXzxWPik6IEl0ZXJhYmxlQ2hhbmdlUmVjb3JkXzxWPiB7XG4gICAgaWYgKHRoaXMuX2xpbmtlZFJlY29yZHMgIT09IG51bGwpIHtcbiAgICAgIHRoaXMuX2xpbmtlZFJlY29yZHMucmVtb3ZlKHJlY29yZCk7XG4gICAgfVxuXG4gICAgY29uc3QgcHJldiA9IHJlY29yZC5fcHJldjtcbiAgICBjb25zdCBuZXh0ID0gcmVjb3JkLl9uZXh0O1xuXG4gICAgLy8gVE9ETyh2aWNiKTpcbiAgICAvLyBhc3NlcnQoKHJlY29yZC5fcHJldiA9IG51bGwpID09PSBudWxsKTtcbiAgICAvLyBhc3NlcnQoKHJlY29yZC5fbmV4dCA9IG51bGwpID09PSBudWxsKTtcblxuICAgIGlmIChwcmV2ID09PSBudWxsKSB7XG4gICAgICB0aGlzLl9pdEhlYWQgPSBuZXh0O1xuICAgIH0gZWxzZSB7XG4gICAgICBwcmV2Ll9uZXh0ID0gbmV4dDtcbiAgICB9XG4gICAgaWYgKG5leHQgPT09IG51bGwpIHtcbiAgICAgIHRoaXMuX2l0VGFpbCA9IHByZXY7XG4gICAgfSBlbHNlIHtcbiAgICAgIG5leHQuX3ByZXYgPSBwcmV2O1xuICAgIH1cblxuICAgIHJldHVybiByZWNvcmQ7XG4gIH1cblxuICAvKiogQGludGVybmFsICovXG4gIF9hZGRUb01vdmVzKHJlY29yZDogSXRlcmFibGVDaGFuZ2VSZWNvcmRfPFY+LCB0b0luZGV4OiBudW1iZXIpOiBJdGVyYWJsZUNoYW5nZVJlY29yZF88Vj4ge1xuICAgIC8vIFRPRE8odmljYik6XG4gICAgLy8gYXNzZXJ0KHJlY29yZC5fbmV4dE1vdmVkID09PSBudWxsKTtcblxuICAgIGlmIChyZWNvcmQucHJldmlvdXNJbmRleCA9PT0gdG9JbmRleCkge1xuICAgICAgcmV0dXJuIHJlY29yZDtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5fbW92ZXNUYWlsID09PSBudWxsKSB7XG4gICAgICAvLyBUT0RPKHZpY2IpOlxuICAgICAgLy8gYXNzZXJ0KF9tb3Zlc0hlYWQgPT09IG51bGwpO1xuICAgICAgdGhpcy5fbW92ZXNUYWlsID0gdGhpcy5fbW92ZXNIZWFkID0gcmVjb3JkO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBUT0RPKHZpY2IpOlxuICAgICAgLy8gYXNzZXJ0KF9tb3Zlc1RhaWwuX25leHRNb3ZlZCA9PT0gbnVsbCk7XG4gICAgICB0aGlzLl9tb3Zlc1RhaWwgPSB0aGlzLl9tb3Zlc1RhaWwuX25leHRNb3ZlZCA9IHJlY29yZDtcbiAgICB9XG5cbiAgICByZXR1cm4gcmVjb3JkO1xuICB9XG5cbiAgcHJpdmF0ZSBfYWRkVG9SZW1vdmFscyhyZWNvcmQ6IEl0ZXJhYmxlQ2hhbmdlUmVjb3JkXzxWPik6IEl0ZXJhYmxlQ2hhbmdlUmVjb3JkXzxWPiB7XG4gICAgaWYgKHRoaXMuX3VubGlua2VkUmVjb3JkcyA9PT0gbnVsbCkge1xuICAgICAgdGhpcy5fdW5saW5rZWRSZWNvcmRzID0gbmV3IF9EdXBsaWNhdGVNYXA8Vj4oKTtcbiAgICB9XG4gICAgdGhpcy5fdW5saW5rZWRSZWNvcmRzLnB1dChyZWNvcmQpO1xuICAgIHJlY29yZC5jdXJyZW50SW5kZXggPSBudWxsO1xuICAgIHJlY29yZC5fbmV4dFJlbW92ZWQgPSBudWxsO1xuXG4gICAgaWYgKHRoaXMuX3JlbW92YWxzVGFpbCA9PT0gbnVsbCkge1xuICAgICAgLy8gVE9ETyh2aWNiKTpcbiAgICAgIC8vIGFzc2VydChfcmVtb3ZhbHNIZWFkID09PSBudWxsKTtcbiAgICAgIHRoaXMuX3JlbW92YWxzVGFpbCA9IHRoaXMuX3JlbW92YWxzSGVhZCA9IHJlY29yZDtcbiAgICAgIHJlY29yZC5fcHJldlJlbW92ZWQgPSBudWxsO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBUT0RPKHZpY2IpOlxuICAgICAgLy8gYXNzZXJ0KF9yZW1vdmFsc1RhaWwuX25leHRSZW1vdmVkID09PSBudWxsKTtcbiAgICAgIC8vIGFzc2VydChyZWNvcmQuX25leHRSZW1vdmVkID09PSBudWxsKTtcbiAgICAgIHJlY29yZC5fcHJldlJlbW92ZWQgPSB0aGlzLl9yZW1vdmFsc1RhaWw7XG4gICAgICB0aGlzLl9yZW1vdmFsc1RhaWwgPSB0aGlzLl9yZW1vdmFsc1RhaWwuX25leHRSZW1vdmVkID0gcmVjb3JkO1xuICAgIH1cbiAgICByZXR1cm4gcmVjb3JkO1xuICB9XG5cbiAgLyoqIEBpbnRlcm5hbCAqL1xuICBfYWRkSWRlbnRpdHlDaGFuZ2UocmVjb3JkOiBJdGVyYWJsZUNoYW5nZVJlY29yZF88Vj4sIGl0ZW06IFYpIHtcbiAgICByZWNvcmQuaXRlbSA9IGl0ZW07XG4gICAgaWYgKHRoaXMuX2lkZW50aXR5Q2hhbmdlc1RhaWwgPT09IG51bGwpIHtcbiAgICAgIHRoaXMuX2lkZW50aXR5Q2hhbmdlc1RhaWwgPSB0aGlzLl9pZGVudGl0eUNoYW5nZXNIZWFkID0gcmVjb3JkO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLl9pZGVudGl0eUNoYW5nZXNUYWlsID0gdGhpcy5faWRlbnRpdHlDaGFuZ2VzVGFpbC5fbmV4dElkZW50aXR5Q2hhbmdlID0gcmVjb3JkO1xuICAgIH1cbiAgICByZXR1cm4gcmVjb3JkO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBJdGVyYWJsZUNoYW5nZVJlY29yZF88Vj4gaW1wbGVtZW50cyBJdGVyYWJsZUNoYW5nZVJlY29yZDxWPiB7XG4gIGN1cnJlbnRJbmRleDogbnVtYmVyfG51bGwgPSBudWxsO1xuICBwcmV2aW91c0luZGV4OiBudW1iZXJ8bnVsbCA9IG51bGw7XG5cbiAgLyoqIEBpbnRlcm5hbCAqL1xuICBfbmV4dFByZXZpb3VzOiBJdGVyYWJsZUNoYW5nZVJlY29yZF88Vj58bnVsbCA9IG51bGw7XG4gIC8qKiBAaW50ZXJuYWwgKi9cbiAgX3ByZXY6IEl0ZXJhYmxlQ2hhbmdlUmVjb3JkXzxWPnxudWxsID0gbnVsbDtcbiAgLyoqIEBpbnRlcm5hbCAqL1xuICBfbmV4dDogSXRlcmFibGVDaGFuZ2VSZWNvcmRfPFY+fG51bGwgPSBudWxsO1xuICAvKiogQGludGVybmFsICovXG4gIF9wcmV2RHVwOiBJdGVyYWJsZUNoYW5nZVJlY29yZF88Vj58bnVsbCA9IG51bGw7XG4gIC8qKiBAaW50ZXJuYWwgKi9cbiAgX25leHREdXA6IEl0ZXJhYmxlQ2hhbmdlUmVjb3JkXzxWPnxudWxsID0gbnVsbDtcbiAgLyoqIEBpbnRlcm5hbCAqL1xuICBfcHJldlJlbW92ZWQ6IEl0ZXJhYmxlQ2hhbmdlUmVjb3JkXzxWPnxudWxsID0gbnVsbDtcbiAgLyoqIEBpbnRlcm5hbCAqL1xuICBfbmV4dFJlbW92ZWQ6IEl0ZXJhYmxlQ2hhbmdlUmVjb3JkXzxWPnxudWxsID0gbnVsbDtcbiAgLyoqIEBpbnRlcm5hbCAqL1xuICBfbmV4dEFkZGVkOiBJdGVyYWJsZUNoYW5nZVJlY29yZF88Vj58bnVsbCA9IG51bGw7XG4gIC8qKiBAaW50ZXJuYWwgKi9cbiAgX25leHRNb3ZlZDogSXRlcmFibGVDaGFuZ2VSZWNvcmRfPFY+fG51bGwgPSBudWxsO1xuICAvKiogQGludGVybmFsICovXG4gIF9uZXh0SWRlbnRpdHlDaGFuZ2U6IEl0ZXJhYmxlQ2hhbmdlUmVjb3JkXzxWPnxudWxsID0gbnVsbDtcblxuXG4gIGNvbnN0cnVjdG9yKHB1YmxpYyBpdGVtOiBWLCBwdWJsaWMgdHJhY2tCeUlkOiBhbnkpIHt9XG59XG5cbi8vIEEgbGlua2VkIGxpc3Qgb2YgQ29sbGVjdGlvbkNoYW5nZVJlY29yZHMgd2l0aCB0aGUgc2FtZSBJdGVyYWJsZUNoYW5nZVJlY29yZF8uaXRlbVxuY2xhc3MgX0R1cGxpY2F0ZUl0ZW1SZWNvcmRMaXN0PFY+IHtcbiAgLyoqIEBpbnRlcm5hbCAqL1xuICBfaGVhZDogSXRlcmFibGVDaGFuZ2VSZWNvcmRfPFY+fG51bGwgPSBudWxsO1xuICAvKiogQGludGVybmFsICovXG4gIF90YWlsOiBJdGVyYWJsZUNoYW5nZVJlY29yZF88Vj58bnVsbCA9IG51bGw7XG5cbiAgLyoqXG4gICAqIEFwcGVuZCB0aGUgcmVjb3JkIHRvIHRoZSBsaXN0IG9mIGR1cGxpY2F0ZXMuXG4gICAqXG4gICAqIE5vdGU6IGJ5IGRlc2lnbiBhbGwgcmVjb3JkcyBpbiB0aGUgbGlzdCBvZiBkdXBsaWNhdGVzIGhvbGQgdGhlIHNhbWUgdmFsdWUgaW4gcmVjb3JkLml0ZW0uXG4gICAqL1xuICBhZGQocmVjb3JkOiBJdGVyYWJsZUNoYW5nZVJlY29yZF88Vj4pOiB2b2lkIHtcbiAgICBpZiAodGhpcy5faGVhZCA9PT0gbnVsbCkge1xuICAgICAgdGhpcy5faGVhZCA9IHRoaXMuX3RhaWwgPSByZWNvcmQ7XG4gICAgICByZWNvcmQuX25leHREdXAgPSBudWxsO1xuICAgICAgcmVjb3JkLl9wcmV2RHVwID0gbnVsbDtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gVE9ETyh2aWNiKTpcbiAgICAgIC8vIGFzc2VydChyZWNvcmQuaXRlbSA9PSAgX2hlYWQuaXRlbSB8fFxuICAgICAgLy8gICAgICAgcmVjb3JkLml0ZW0gaXMgbnVtICYmIHJlY29yZC5pdGVtLmlzTmFOICYmIF9oZWFkLml0ZW0gaXMgbnVtICYmIF9oZWFkLml0ZW0uaXNOYU4pO1xuICAgICAgdGhpcy5fdGFpbCEuX25leHREdXAgPSByZWNvcmQ7XG4gICAgICByZWNvcmQuX3ByZXZEdXAgPSB0aGlzLl90YWlsO1xuICAgICAgcmVjb3JkLl9uZXh0RHVwID0gbnVsbDtcbiAgICAgIHRoaXMuX3RhaWwgPSByZWNvcmQ7XG4gICAgfVxuICB9XG5cbiAgLy8gUmV0dXJucyBhIEl0ZXJhYmxlQ2hhbmdlUmVjb3JkXyBoYXZpbmcgSXRlcmFibGVDaGFuZ2VSZWNvcmRfLnRyYWNrQnlJZCA9PSB0cmFja0J5SWQgYW5kXG4gIC8vIEl0ZXJhYmxlQ2hhbmdlUmVjb3JkXy5jdXJyZW50SW5kZXggPj0gYXRPckFmdGVySW5kZXhcbiAgZ2V0KHRyYWNrQnlJZDogYW55LCBhdE9yQWZ0ZXJJbmRleDogbnVtYmVyfG51bGwpOiBJdGVyYWJsZUNoYW5nZVJlY29yZF88Vj58bnVsbCB7XG4gICAgbGV0IHJlY29yZDogSXRlcmFibGVDaGFuZ2VSZWNvcmRfPFY+fG51bGw7XG4gICAgZm9yIChyZWNvcmQgPSB0aGlzLl9oZWFkOyByZWNvcmQgIT09IG51bGw7IHJlY29yZCA9IHJlY29yZC5fbmV4dER1cCkge1xuICAgICAgaWYgKChhdE9yQWZ0ZXJJbmRleCA9PT0gbnVsbCB8fCBhdE9yQWZ0ZXJJbmRleCA8PSByZWNvcmQuY3VycmVudEluZGV4ISkgJiZcbiAgICAgICAgICBsb29zZUlkZW50aWNhbChyZWNvcmQudHJhY2tCeUlkLCB0cmFja0J5SWQpKSB7XG4gICAgICAgIHJldHVybiByZWNvcmQ7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlbW92ZSBvbmUge0BsaW5rIEl0ZXJhYmxlQ2hhbmdlUmVjb3JkX30gZnJvbSB0aGUgbGlzdCBvZiBkdXBsaWNhdGVzLlxuICAgKlxuICAgKiBSZXR1cm5zIHdoZXRoZXIgdGhlIGxpc3Qgb2YgZHVwbGljYXRlcyBpcyBlbXB0eS5cbiAgICovXG4gIHJlbW92ZShyZWNvcmQ6IEl0ZXJhYmxlQ2hhbmdlUmVjb3JkXzxWPik6IGJvb2xlYW4ge1xuICAgIC8vIFRPRE8odmljYik6XG4gICAgLy8gYXNzZXJ0KCgpIHtcbiAgICAvLyAgLy8gdmVyaWZ5IHRoYXQgdGhlIHJlY29yZCBiZWluZyByZW1vdmVkIGlzIGluIHRoZSBsaXN0LlxuICAgIC8vICBmb3IgKEl0ZXJhYmxlQ2hhbmdlUmVjb3JkXyBjdXJzb3IgPSBfaGVhZDsgY3Vyc29yICE9IG51bGw7IGN1cnNvciA9IGN1cnNvci5fbmV4dER1cCkge1xuICAgIC8vICAgIGlmIChpZGVudGljYWwoY3Vyc29yLCByZWNvcmQpKSByZXR1cm4gdHJ1ZTtcbiAgICAvLyAgfVxuICAgIC8vICByZXR1cm4gZmFsc2U7XG4gICAgLy99KTtcblxuICAgIGNvbnN0IHByZXY6IEl0ZXJhYmxlQ2hhbmdlUmVjb3JkXzxWPnxudWxsID0gcmVjb3JkLl9wcmV2RHVwO1xuICAgIGNvbnN0IG5leHQ6IEl0ZXJhYmxlQ2hhbmdlUmVjb3JkXzxWPnxudWxsID0gcmVjb3JkLl9uZXh0RHVwO1xuICAgIGlmIChwcmV2ID09PSBudWxsKSB7XG4gICAgICB0aGlzLl9oZWFkID0gbmV4dDtcbiAgICB9IGVsc2Uge1xuICAgICAgcHJldi5fbmV4dER1cCA9IG5leHQ7XG4gICAgfVxuICAgIGlmIChuZXh0ID09PSBudWxsKSB7XG4gICAgICB0aGlzLl90YWlsID0gcHJldjtcbiAgICB9IGVsc2Uge1xuICAgICAgbmV4dC5fcHJldkR1cCA9IHByZXY7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLl9oZWFkID09PSBudWxsO1xuICB9XG59XG5cbmNsYXNzIF9EdXBsaWNhdGVNYXA8Vj4ge1xuICBtYXAgPSBuZXcgTWFwPGFueSwgX0R1cGxpY2F0ZUl0ZW1SZWNvcmRMaXN0PFY+PigpO1xuXG4gIHB1dChyZWNvcmQ6IEl0ZXJhYmxlQ2hhbmdlUmVjb3JkXzxWPikge1xuICAgIGNvbnN0IGtleSA9IHJlY29yZC50cmFja0J5SWQ7XG5cbiAgICBsZXQgZHVwbGljYXRlcyA9IHRoaXMubWFwLmdldChrZXkpO1xuICAgIGlmICghZHVwbGljYXRlcykge1xuICAgICAgZHVwbGljYXRlcyA9IG5ldyBfRHVwbGljYXRlSXRlbVJlY29yZExpc3Q8Vj4oKTtcbiAgICAgIHRoaXMubWFwLnNldChrZXksIGR1cGxpY2F0ZXMpO1xuICAgIH1cbiAgICBkdXBsaWNhdGVzLmFkZChyZWNvcmQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHJpZXZlIHRoZSBgdmFsdWVgIHVzaW5nIGtleS4gQmVjYXVzZSB0aGUgSXRlcmFibGVDaGFuZ2VSZWNvcmRfIHZhbHVlIG1heSBiZSBvbmUgd2hpY2ggd2VcbiAgICogaGF2ZSBhbHJlYWR5IGl0ZXJhdGVkIG92ZXIsIHdlIHVzZSB0aGUgYGF0T3JBZnRlckluZGV4YCB0byBwcmV0ZW5kIGl0IGlzIG5vdCB0aGVyZS5cbiAgICpcbiAgICogVXNlIGNhc2U6IGBbYSwgYiwgYywgYSwgYV1gIGlmIHdlIGFyZSBhdCBpbmRleCBgM2Agd2hpY2ggaXMgdGhlIHNlY29uZCBgYWAgdGhlbiBhc2tpbmcgaWYgd2VcbiAgICogaGF2ZSBhbnkgbW9yZSBgYWBzIG5lZWRzIHRvIHJldHVybiB0aGUgc2Vjb25kIGBhYC5cbiAgICovXG4gIGdldCh0cmFja0J5SWQ6IGFueSwgYXRPckFmdGVySW5kZXg6IG51bWJlcnxudWxsKTogSXRlcmFibGVDaGFuZ2VSZWNvcmRfPFY+fG51bGwge1xuICAgIGNvbnN0IGtleSA9IHRyYWNrQnlJZDtcbiAgICBjb25zdCByZWNvcmRMaXN0ID0gdGhpcy5tYXAuZ2V0KGtleSk7XG4gICAgcmV0dXJuIHJlY29yZExpc3QgPyByZWNvcmRMaXN0LmdldCh0cmFja0J5SWQsIGF0T3JBZnRlckluZGV4KSA6IG51bGw7XG4gIH1cblxuICAvKipcbiAgICogUmVtb3ZlcyBhIHtAbGluayBJdGVyYWJsZUNoYW5nZVJlY29yZF99IGZyb20gdGhlIGxpc3Qgb2YgZHVwbGljYXRlcy5cbiAgICpcbiAgICogVGhlIGxpc3Qgb2YgZHVwbGljYXRlcyBhbHNvIGlzIHJlbW92ZWQgZnJvbSB0aGUgbWFwIGlmIGl0IGdldHMgZW1wdHkuXG4gICAqL1xuICByZW1vdmUocmVjb3JkOiBJdGVyYWJsZUNoYW5nZVJlY29yZF88Vj4pOiBJdGVyYWJsZUNoYW5nZVJlY29yZF88Vj4ge1xuICAgIGNvbnN0IGtleSA9IHJlY29yZC50cmFja0J5SWQ7XG4gICAgY29uc3QgcmVjb3JkTGlzdDogX0R1cGxpY2F0ZUl0ZW1SZWNvcmRMaXN0PFY+ID0gdGhpcy5tYXAuZ2V0KGtleSkhO1xuICAgIC8vIFJlbW92ZSB0aGUgbGlzdCBvZiBkdXBsaWNhdGVzIHdoZW4gaXQgZ2V0cyBlbXB0eVxuICAgIGlmIChyZWNvcmRMaXN0LnJlbW92ZShyZWNvcmQpKSB7XG4gICAgICB0aGlzLm1hcC5kZWxldGUoa2V5KTtcbiAgICB9XG4gICAgcmV0dXJuIHJlY29yZDtcbiAgfVxuXG4gIGdldCBpc0VtcHR5KCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLm1hcC5zaXplID09PSAwO1xuICB9XG5cbiAgY2xlYXIoKSB7XG4gICAgdGhpcy5tYXAuY2xlYXIoKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBnZXRQcmV2aW91c0luZGV4KGl0ZW06IGFueSwgYWRkUmVtb3ZlT2Zmc2V0OiBudW1iZXIsIG1vdmVPZmZzZXRzOiBudW1iZXJbXXxudWxsKTogbnVtYmVyIHtcbiAgY29uc3QgcHJldmlvdXNJbmRleCA9IGl0ZW0ucHJldmlvdXNJbmRleDtcbiAgaWYgKHByZXZpb3VzSW5kZXggPT09IG51bGwpIHJldHVybiBwcmV2aW91c0luZGV4O1xuICBsZXQgbW92ZU9mZnNldCA9IDA7XG4gIGlmIChtb3ZlT2Zmc2V0cyAmJiBwcmV2aW91c0luZGV4IDwgbW92ZU9mZnNldHMubGVuZ3RoKSB7XG4gICAgbW92ZU9mZnNldCA9IG1vdmVPZmZzZXRzW3ByZXZpb3VzSW5kZXhdO1xuICB9XG4gIHJldHVybiBwcmV2aW91c0luZGV4ICsgYWRkUmVtb3ZlT2Zmc2V0ICsgbW92ZU9mZnNldDtcbn1cbiJdfQ==