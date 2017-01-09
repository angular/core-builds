import { ChangeDetectorRef } from '../change_detector_ref';
import { IterableChangeRecord, IterableChanges, IterableDiffer, IterableDifferFactory, TrackByFn } from './iterable_differs';
export declare class DefaultIterableDifferFactory implements IterableDifferFactory {
    constructor();
    supports(obj: Object): boolean;
    create<V>(cdRef: ChangeDetectorRef, trackByFn?: TrackByFn): DefaultIterableDiffer<V>;
}
/**
 * @deprecated v4.0.0 - Should not be part of public API.
 */
export declare class DefaultIterableDiffer<V> implements IterableDiffer<V>, IterableChanges<V> {
    private _trackByFn;
    private _length;
    private _collection;
    private _linkedRecords;
    private _unlinkedRecords;
    private _previousItHead;
    private _itHead;
    private _itTail;
    private _additionsHead;
    private _additionsTail;
    private _movesHead;
    private _movesTail;
    private _removalsHead;
    private _removalsTail;
    private _identityChangesHead;
    private _identityChangesTail;
    constructor(_trackByFn?: TrackByFn);
    collection: any;
    length: number;
    forEachItem(fn: (record: IterableChangeRecord_<V>) => void): void;
    forEachOperation(fn: (item: IterableChangeRecord_<V>, previousIndex: number, currentIndex: number) => void): void;
    forEachPreviousItem(fn: (record: IterableChangeRecord_<V>) => void): void;
    forEachAddedItem(fn: (record: IterableChangeRecord_<V>) => void): void;
    forEachMovedItem(fn: (record: IterableChangeRecord_<V>) => void): void;
    forEachRemovedItem(fn: (record: IterableChangeRecord_<V>) => void): void;
    forEachIdentityChange(fn: (record: IterableChangeRecord_<V>) => void): void;
    diff(collection: V[] | Set<V>[] | any): DefaultIterableDiffer<V>;
    onDestroy(): void;
    check(collection: V[] | Set<V>[] | any): boolean;
    isDirty: boolean;
    private _addToRemovals(record);
    toString(): string;
}
/**
 * @stable
 */
export declare class IterableChangeRecord_<V> implements IterableChangeRecord<V> {
    item: V;
    trackById: any;
    currentIndex: number;
    previousIndex: number;
    constructor(item: V, trackById: any);
    toString(): string;
}
