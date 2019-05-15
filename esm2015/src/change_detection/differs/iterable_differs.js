/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ΔdefineInjectable } from '../../di/interface/defs';
import { Optional, SkipSelf } from '../../di/metadata';
import { DefaultIterableDifferFactory } from '../differs/default_iterable_differ';
/**
 * A strategy for tracking changes over time to an iterable. Used by {\@link NgForOf} to
 * respond to changes in an iterable by effecting equivalent changes in the DOM.
 *
 * \@publicApi
 * @record
 * @template V
 */
export function IterableDiffer() { }
if (false) {
    /**
     * Compute a difference between the previous state and the new `object` state.
     *
     * @param {?} object containing the new value.
     * @return {?} an object describing the difference. The return value is only valid until the next
     * `diff()` invocation.
     */
    IterableDiffer.prototype.diff = function (object) { };
}
/**
 * An object describing the changes in the `Iterable` collection since last time
 * `IterableDiffer#diff()` was invoked.
 *
 * \@publicApi
 * @record
 * @template V
 */
export function IterableChanges() { }
if (false) {
    /**
     * Iterate over all changes. `IterableChangeRecord` will contain information about changes
     * to each item.
     * @param {?} fn
     * @return {?}
     */
    IterableChanges.prototype.forEachItem = function (fn) { };
    /**
     * Iterate over a set of operations which when applied to the original `Iterable` will produce the
     * new `Iterable`.
     *
     * NOTE: These are not necessarily the actual operations which were applied to the original
     * `Iterable`, rather these are a set of computed operations which may not be the same as the
     * ones applied.
     *
     * @param {?} fn
     * @return {?}
     */
    IterableChanges.prototype.forEachOperation = function (fn) { };
    /**
     * Iterate over changes in the order of original `Iterable` showing where the original items
     * have moved.
     * @param {?} fn
     * @return {?}
     */
    IterableChanges.prototype.forEachPreviousItem = function (fn) { };
    /**
     * Iterate over all added items.
     * @param {?} fn
     * @return {?}
     */
    IterableChanges.prototype.forEachAddedItem = function (fn) { };
    /**
     * Iterate over all moved items.
     * @param {?} fn
     * @return {?}
     */
    IterableChanges.prototype.forEachMovedItem = function (fn) { };
    /**
     * Iterate over all removed items.
     * @param {?} fn
     * @return {?}
     */
    IterableChanges.prototype.forEachRemovedItem = function (fn) { };
    /**
     * Iterate over all items which had their identity (as computed by the `TrackByFunction`)
     * changed.
     * @param {?} fn
     * @return {?}
     */
    IterableChanges.prototype.forEachIdentityChange = function (fn) { };
}
/**
 * Record representing the item change information.
 *
 * \@publicApi
 * @record
 * @template V
 */
export function IterableChangeRecord() { }
if (false) {
    /**
     * Current index of the item in `Iterable` or null if removed.
     * @type {?}
     */
    IterableChangeRecord.prototype.currentIndex;
    /**
     * Previous index of the item in `Iterable` or null if added.
     * @type {?}
     */
    IterableChangeRecord.prototype.previousIndex;
    /**
     * The item.
     * @type {?}
     */
    IterableChangeRecord.prototype.item;
    /**
     * Track by identity as computed by the `TrackByFunction`.
     * @type {?}
     */
    IterableChangeRecord.prototype.trackById;
}
/**
 * @deprecated v4.0.0 - Use IterableChangeRecord instead.
 * \@publicApi
 * @record
 * @template V
 */
export function CollectionChangeRecord() { }
/**
 * An optional function passed into the `NgForOf` directive that defines how to track
 * changes for items in an iterable.
 * The function takes the iteration index and item ID.
 * When supplied, Angular tracks changes by the return value of the function.
 *
 * \@publicApi
 * @record
 * @template T
 */
export function TrackByFunction() { }
/**
 * Provides a factory for {\@link IterableDiffer}.
 *
 * \@publicApi
 * @record
 */
export function IterableDifferFactory() { }
if (false) {
    /**
     * @param {?} objects
     * @return {?}
     */
    IterableDifferFactory.prototype.supports = function (objects) { };
    /**
     * @template V
     * @param {?=} trackByFn
     * @return {?}
     */
    IterableDifferFactory.prototype.create = function (trackByFn) { };
}
/**
 * A repository of different iterable diffing strategies used by NgFor, NgClass, and others.
 *
 * \@publicApi
 */
export class IterableDiffers {
    /**
     * @param {?} factories
     */
    constructor(factories) { this.factories = factories; }
    /**
     * @param {?} factories
     * @param {?=} parent
     * @return {?}
     */
    static create(factories, parent) {
        if (parent != null) {
            /** @type {?} */
            const copied = parent.factories.slice();
            factories = factories.concat(copied);
        }
        return new IterableDiffers(factories);
    }
    /**
     * Takes an array of {\@link IterableDifferFactory} and returns a provider used to extend the
     * inherited {\@link IterableDiffers} instance with the provided factories and return a new
     * {\@link IterableDiffers} instance.
     *
     * \@usageNotes
     * ### Example
     *
     * The following example shows how to extend an existing list of factories,
     * which will only be applied to the injector for this component and its children.
     * This step is all that's required to make a new {\@link IterableDiffer} available.
     *
     * ```
     * \@Component({
     *   viewProviders: [
     *     IterableDiffers.extend([new ImmutableListDiffer()])
     *   ]
     * })
     * ```
     * @param {?} factories
     * @return {?}
     */
    static extend(factories) {
        return {
            provide: IterableDiffers,
            useFactory: (/**
             * @param {?} parent
             * @return {?}
             */
            (parent) => {
                if (!parent) {
                    // Typically would occur when calling IterableDiffers.extend inside of dependencies passed
                    // to
                    // bootstrap(), which would override default pipes instead of extending them.
                    throw new Error('Cannot extend IterableDiffers without a parent injector');
                }
                return IterableDiffers.create(factories, parent);
            }),
            // Dependency technically isn't optional, but we can provide a better error message this way.
            deps: [[IterableDiffers, new SkipSelf(), new Optional()]]
        };
    }
    /**
     * @param {?} iterable
     * @return {?}
     */
    find(iterable) {
        /** @type {?} */
        const factory = this.factories.find((/**
         * @param {?} f
         * @return {?}
         */
        f => f.supports(iterable)));
        if (factory != null) {
            return factory;
        }
        else {
            throw new Error(`Cannot find a differ supporting object '${iterable}' of type '${getTypeNameForDebugging(iterable)}'`);
        }
    }
}
/** @nocollapse */
/** @nocollapse */ IterableDiffers.ngInjectableDef = ΔdefineInjectable({
    providedIn: 'root',
    factory: (/**
     * @nocollapse @return {?}
     */
    () => new IterableDiffers([new DefaultIterableDifferFactory()]))
});
if (false) {
    /**
     * @nocollapse
     * @type {?}
     */
    IterableDiffers.ngInjectableDef;
    /**
     * @deprecated v4.0.0 - Should be private
     * @type {?}
     */
    IterableDiffers.prototype.factories;
}
/**
 * @param {?} type
 * @return {?}
 */
export function getTypeNameForDebugging(type) {
    return type['name'] || typeof type;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaXRlcmFibGVfZGlmZmVycy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL2NoYW5nZV9kZXRlY3Rpb24vZGlmZmVycy9pdGVyYWJsZV9kaWZmZXJzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBUUEsT0FBTyxFQUFDLGlCQUFpQixFQUFDLE1BQU0seUJBQXlCLENBQUM7QUFFMUQsT0FBTyxFQUFDLFFBQVEsRUFBRSxRQUFRLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUNyRCxPQUFPLEVBQUMsNEJBQTRCLEVBQUMsTUFBTSxvQ0FBb0MsQ0FBQzs7Ozs7Ozs7O0FBaUJoRixvQ0FTQzs7Ozs7Ozs7O0lBREMsc0RBQXFEOzs7Ozs7Ozs7O0FBU3ZELHFDQThDQzs7Ozs7Ozs7SUF6Q0MsMERBQWlFOzs7Ozs7Ozs7Ozs7SUFrQmpFLCtEQUdtRDs7Ozs7OztJQU1uRCxrRUFBeUU7Ozs7OztJQUd6RSwrREFBc0U7Ozs7OztJQUd0RSwrREFBc0U7Ozs7OztJQUd0RSxpRUFBd0U7Ozs7Ozs7SUFJeEUsb0VBQTJFOzs7Ozs7Ozs7QUFRN0UsMENBWUM7Ozs7OztJQVZDLDRDQUFtQzs7Ozs7SUFHbkMsNkNBQW9DOzs7OztJQUdwQyxvQ0FBaUI7Ozs7O0lBR2pCLHlDQUF3Qjs7Ozs7Ozs7QUFPMUIsNENBQTZFOzs7Ozs7Ozs7OztBQVU3RSxxQ0FBc0U7Ozs7Ozs7QUFPdEUsMkNBR0M7Ozs7OztJQUZDLGtFQUFnQzs7Ozs7O0lBQ2hDLGtFQUE2RDs7Ozs7OztBQVEvRCxNQUFNLE9BQU8sZUFBZTs7OztJQVcxQixZQUFZLFNBQWtDLElBQUksSUFBSSxDQUFDLFNBQVMsR0FBRyxTQUFTLENBQUMsQ0FBQyxDQUFDOzs7Ozs7SUFFL0UsTUFBTSxDQUFDLE1BQU0sQ0FBQyxTQUFrQyxFQUFFLE1BQXdCO1FBQ3hFLElBQUksTUFBTSxJQUFJLElBQUksRUFBRTs7a0JBQ1osTUFBTSxHQUFHLE1BQU0sQ0FBQyxTQUFTLENBQUMsS0FBSyxFQUFFO1lBQ3ZDLFNBQVMsR0FBRyxTQUFTLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1NBQ3RDO1FBRUQsT0FBTyxJQUFJLGVBQWUsQ0FBQyxTQUFTLENBQUMsQ0FBQztJQUN4QyxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQXNCRCxNQUFNLENBQUMsTUFBTSxDQUFDLFNBQWtDO1FBQzlDLE9BQU87WUFDTCxPQUFPLEVBQUUsZUFBZTtZQUN4QixVQUFVOzs7O1lBQUUsQ0FBQyxNQUF1QixFQUFFLEVBQUU7Z0JBQ3RDLElBQUksQ0FBQyxNQUFNLEVBQUU7b0JBQ1gsMEZBQTBGO29CQUMxRixLQUFLO29CQUNMLDZFQUE2RTtvQkFDN0UsTUFBTSxJQUFJLEtBQUssQ0FBQyx5REFBeUQsQ0FBQyxDQUFDO2lCQUM1RTtnQkFDRCxPQUFPLGVBQWUsQ0FBQyxNQUFNLENBQUMsU0FBUyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBQ25ELENBQUMsQ0FBQTs7WUFFRCxJQUFJLEVBQUUsQ0FBQyxDQUFDLGVBQWUsRUFBRSxJQUFJLFFBQVEsRUFBRSxFQUFFLElBQUksUUFBUSxFQUFFLENBQUMsQ0FBQztTQUMxRCxDQUFDO0lBQ0osQ0FBQzs7Ozs7SUFFRCxJQUFJLENBQUMsUUFBYTs7Y0FDVixPQUFPLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJOzs7O1FBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxFQUFDO1FBQzlELElBQUksT0FBTyxJQUFJLElBQUksRUFBRTtZQUNuQixPQUFPLE9BQU8sQ0FBQztTQUNoQjthQUFNO1lBQ0wsTUFBTSxJQUFJLEtBQUssQ0FDWCwyQ0FBMkMsUUFBUSxjQUFjLHVCQUF1QixDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQztTQUM1RztJQUNILENBQUM7OztBQWpFTSwrQkFBZSxHQUFHLGlCQUFpQixDQUFDO0lBQ3pDLFVBQVUsRUFBRSxNQUFNO0lBQ2xCLE9BQU87OztJQUFFLEdBQUcsRUFBRSxDQUFDLElBQUksZUFBZSxDQUFDLENBQUMsSUFBSSw0QkFBNEIsRUFBRSxDQUFDLENBQUMsQ0FBQTtDQUN6RSxDQUFDLENBQUM7Ozs7OztJQUhILGdDQUdHOzs7OztJQUtILG9DQUFtQzs7Ozs7O0FBNERyQyxNQUFNLFVBQVUsdUJBQXVCLENBQUMsSUFBUztJQUMvQyxPQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxPQUFPLElBQUksQ0FBQztBQUNyQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge86UZGVmaW5lSW5qZWN0YWJsZX0gZnJvbSAnLi4vLi4vZGkvaW50ZXJmYWNlL2RlZnMnO1xuaW1wb3J0IHtTdGF0aWNQcm92aWRlcn0gZnJvbSAnLi4vLi4vZGkvaW50ZXJmYWNlL3Byb3ZpZGVyJztcbmltcG9ydCB7T3B0aW9uYWwsIFNraXBTZWxmfSBmcm9tICcuLi8uLi9kaS9tZXRhZGF0YSc7XG5pbXBvcnQge0RlZmF1bHRJdGVyYWJsZURpZmZlckZhY3Rvcnl9IGZyb20gJy4uL2RpZmZlcnMvZGVmYXVsdF9pdGVyYWJsZV9kaWZmZXInO1xuXG5cblxuLyoqXG4gKiBBIHR5cGUgZGVzY3JpYmluZyBzdXBwb3J0ZWQgaXRlcmFibGUgdHlwZXMuXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgdHlwZSBOZ0l0ZXJhYmxlPFQ+ID0gQXJyYXk8VD58IEl0ZXJhYmxlPFQ+O1xuXG4vKipcbiAqIEEgc3RyYXRlZ3kgZm9yIHRyYWNraW5nIGNoYW5nZXMgb3ZlciB0aW1lIHRvIGFuIGl0ZXJhYmxlLiBVc2VkIGJ5IHtAbGluayBOZ0Zvck9mfSB0b1xuICogcmVzcG9uZCB0byBjaGFuZ2VzIGluIGFuIGl0ZXJhYmxlIGJ5IGVmZmVjdGluZyBlcXVpdmFsZW50IGNoYW5nZXMgaW4gdGhlIERPTS5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgSXRlcmFibGVEaWZmZXI8Vj4ge1xuICAvKipcbiAgICogQ29tcHV0ZSBhIGRpZmZlcmVuY2UgYmV0d2VlbiB0aGUgcHJldmlvdXMgc3RhdGUgYW5kIHRoZSBuZXcgYG9iamVjdGAgc3RhdGUuXG4gICAqXG4gICAqIEBwYXJhbSBvYmplY3QgY29udGFpbmluZyB0aGUgbmV3IHZhbHVlLlxuICAgKiBAcmV0dXJucyBhbiBvYmplY3QgZGVzY3JpYmluZyB0aGUgZGlmZmVyZW5jZS4gVGhlIHJldHVybiB2YWx1ZSBpcyBvbmx5IHZhbGlkIHVudGlsIHRoZSBuZXh0XG4gICAqIGBkaWZmKClgIGludm9jYXRpb24uXG4gICAqL1xuICBkaWZmKG9iamVjdDogTmdJdGVyYWJsZTxWPik6IEl0ZXJhYmxlQ2hhbmdlczxWPnxudWxsO1xufVxuXG4vKipcbiAqIEFuIG9iamVjdCBkZXNjcmliaW5nIHRoZSBjaGFuZ2VzIGluIHRoZSBgSXRlcmFibGVgIGNvbGxlY3Rpb24gc2luY2UgbGFzdCB0aW1lXG4gKiBgSXRlcmFibGVEaWZmZXIjZGlmZigpYCB3YXMgaW52b2tlZC5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgSXRlcmFibGVDaGFuZ2VzPFY+IHtcbiAgLyoqXG4gICAqIEl0ZXJhdGUgb3ZlciBhbGwgY2hhbmdlcy4gYEl0ZXJhYmxlQ2hhbmdlUmVjb3JkYCB3aWxsIGNvbnRhaW4gaW5mb3JtYXRpb24gYWJvdXQgY2hhbmdlc1xuICAgKiB0byBlYWNoIGl0ZW0uXG4gICAqL1xuICBmb3JFYWNoSXRlbShmbjogKHJlY29yZDogSXRlcmFibGVDaGFuZ2VSZWNvcmQ8Vj4pID0+IHZvaWQpOiB2b2lkO1xuXG4gIC8qKlxuICAgKiBJdGVyYXRlIG92ZXIgYSBzZXQgb2Ygb3BlcmF0aW9ucyB3aGljaCB3aGVuIGFwcGxpZWQgdG8gdGhlIG9yaWdpbmFsIGBJdGVyYWJsZWAgd2lsbCBwcm9kdWNlIHRoZVxuICAgKiBuZXcgYEl0ZXJhYmxlYC5cbiAgICpcbiAgICogTk9URTogVGhlc2UgYXJlIG5vdCBuZWNlc3NhcmlseSB0aGUgYWN0dWFsIG9wZXJhdGlvbnMgd2hpY2ggd2VyZSBhcHBsaWVkIHRvIHRoZSBvcmlnaW5hbFxuICAgKiBgSXRlcmFibGVgLCByYXRoZXIgdGhlc2UgYXJlIGEgc2V0IG9mIGNvbXB1dGVkIG9wZXJhdGlvbnMgd2hpY2ggbWF5IG5vdCBiZSB0aGUgc2FtZSBhcyB0aGVcbiAgICogb25lcyBhcHBsaWVkLlxuICAgKlxuICAgKiBAcGFyYW0gcmVjb3JkIEEgY2hhbmdlIHdoaWNoIG5lZWRzIHRvIGJlIGFwcGxpZWRcbiAgICogQHBhcmFtIHByZXZpb3VzSW5kZXggVGhlIGBJdGVyYWJsZUNoYW5nZVJlY29yZCNwcmV2aW91c0luZGV4YCBvZiB0aGUgYHJlY29yZGAgcmVmZXJzIHRvIHRoZVxuICAgKiAgICAgICAgb3JpZ2luYWwgYEl0ZXJhYmxlYCBsb2NhdGlvbiwgd2hlcmUgYXMgYHByZXZpb3VzSW5kZXhgIHJlZmVycyB0byB0aGUgdHJhbnNpZW50IGxvY2F0aW9uXG4gICAqICAgICAgICBvZiB0aGUgaXRlbSwgYWZ0ZXIgYXBwbHlpbmcgdGhlIG9wZXJhdGlvbnMgdXAgdG8gdGhpcyBwb2ludC5cbiAgICogQHBhcmFtIGN1cnJlbnRJbmRleCBUaGUgYEl0ZXJhYmxlQ2hhbmdlUmVjb3JkI2N1cnJlbnRJbmRleGAgb2YgdGhlIGByZWNvcmRgIHJlZmVycyB0byB0aGVcbiAgICogICAgICAgIG9yaWdpbmFsIGBJdGVyYWJsZWAgbG9jYXRpb24sIHdoZXJlIGFzIGBjdXJyZW50SW5kZXhgIHJlZmVycyB0byB0aGUgdHJhbnNpZW50IGxvY2F0aW9uXG4gICAqICAgICAgICBvZiB0aGUgaXRlbSwgYWZ0ZXIgYXBwbHlpbmcgdGhlIG9wZXJhdGlvbnMgdXAgdG8gdGhpcyBwb2ludC5cbiAgICovXG4gIGZvckVhY2hPcGVyYXRpb24oXG4gICAgICBmbjpcbiAgICAgICAgICAocmVjb3JkOiBJdGVyYWJsZUNoYW5nZVJlY29yZDxWPiwgcHJldmlvdXNJbmRleDogbnVtYmVyfG51bGwsXG4gICAgICAgICAgIGN1cnJlbnRJbmRleDogbnVtYmVyfG51bGwpID0+IHZvaWQpOiB2b2lkO1xuXG4gIC8qKlxuICAgKiBJdGVyYXRlIG92ZXIgY2hhbmdlcyBpbiB0aGUgb3JkZXIgb2Ygb3JpZ2luYWwgYEl0ZXJhYmxlYCBzaG93aW5nIHdoZXJlIHRoZSBvcmlnaW5hbCBpdGVtc1xuICAgKiBoYXZlIG1vdmVkLlxuICAgKi9cbiAgZm9yRWFjaFByZXZpb3VzSXRlbShmbjogKHJlY29yZDogSXRlcmFibGVDaGFuZ2VSZWNvcmQ8Vj4pID0+IHZvaWQpOiB2b2lkO1xuXG4gIC8qKiBJdGVyYXRlIG92ZXIgYWxsIGFkZGVkIGl0ZW1zLiAqL1xuICBmb3JFYWNoQWRkZWRJdGVtKGZuOiAocmVjb3JkOiBJdGVyYWJsZUNoYW5nZVJlY29yZDxWPikgPT4gdm9pZCk6IHZvaWQ7XG5cbiAgLyoqIEl0ZXJhdGUgb3ZlciBhbGwgbW92ZWQgaXRlbXMuICovXG4gIGZvckVhY2hNb3ZlZEl0ZW0oZm46IChyZWNvcmQ6IEl0ZXJhYmxlQ2hhbmdlUmVjb3JkPFY+KSA9PiB2b2lkKTogdm9pZDtcblxuICAvKiogSXRlcmF0ZSBvdmVyIGFsbCByZW1vdmVkIGl0ZW1zLiAqL1xuICBmb3JFYWNoUmVtb3ZlZEl0ZW0oZm46IChyZWNvcmQ6IEl0ZXJhYmxlQ2hhbmdlUmVjb3JkPFY+KSA9PiB2b2lkKTogdm9pZDtcblxuICAvKiogSXRlcmF0ZSBvdmVyIGFsbCBpdGVtcyB3aGljaCBoYWQgdGhlaXIgaWRlbnRpdHkgKGFzIGNvbXB1dGVkIGJ5IHRoZSBgVHJhY2tCeUZ1bmN0aW9uYClcbiAgICogY2hhbmdlZC4gKi9cbiAgZm9yRWFjaElkZW50aXR5Q2hhbmdlKGZuOiAocmVjb3JkOiBJdGVyYWJsZUNoYW5nZVJlY29yZDxWPikgPT4gdm9pZCk6IHZvaWQ7XG59XG5cbi8qKlxuICogUmVjb3JkIHJlcHJlc2VudGluZyB0aGUgaXRlbSBjaGFuZ2UgaW5mb3JtYXRpb24uXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgaW50ZXJmYWNlIEl0ZXJhYmxlQ2hhbmdlUmVjb3JkPFY+IHtcbiAgLyoqIEN1cnJlbnQgaW5kZXggb2YgdGhlIGl0ZW0gaW4gYEl0ZXJhYmxlYCBvciBudWxsIGlmIHJlbW92ZWQuICovXG4gIHJlYWRvbmx5IGN1cnJlbnRJbmRleDogbnVtYmVyfG51bGw7XG5cbiAgLyoqIFByZXZpb3VzIGluZGV4IG9mIHRoZSBpdGVtIGluIGBJdGVyYWJsZWAgb3IgbnVsbCBpZiBhZGRlZC4gKi9cbiAgcmVhZG9ubHkgcHJldmlvdXNJbmRleDogbnVtYmVyfG51bGw7XG5cbiAgLyoqIFRoZSBpdGVtLiAqL1xuICByZWFkb25seSBpdGVtOiBWO1xuXG4gIC8qKiBUcmFjayBieSBpZGVudGl0eSBhcyBjb21wdXRlZCBieSB0aGUgYFRyYWNrQnlGdW5jdGlvbmAuICovXG4gIHJlYWRvbmx5IHRyYWNrQnlJZDogYW55O1xufVxuXG4vKipcbiAqIEBkZXByZWNhdGVkIHY0LjAuMCAtIFVzZSBJdGVyYWJsZUNoYW5nZVJlY29yZCBpbnN0ZWFkLlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgaW50ZXJmYWNlIENvbGxlY3Rpb25DaGFuZ2VSZWNvcmQ8Vj4gZXh0ZW5kcyBJdGVyYWJsZUNoYW5nZVJlY29yZDxWPiB7fVxuXG4vKipcbiAqIEFuIG9wdGlvbmFsIGZ1bmN0aW9uIHBhc3NlZCBpbnRvIHRoZSBgTmdGb3JPZmAgZGlyZWN0aXZlIHRoYXQgZGVmaW5lcyBob3cgdG8gdHJhY2tcbiAqIGNoYW5nZXMgZm9yIGl0ZW1zIGluIGFuIGl0ZXJhYmxlLlxuICogVGhlIGZ1bmN0aW9uIHRha2VzIHRoZSBpdGVyYXRpb24gaW5kZXggYW5kIGl0ZW0gSUQuXG4gKiBXaGVuIHN1cHBsaWVkLCBBbmd1bGFyIHRyYWNrcyBjaGFuZ2VzIGJ5IHRoZSByZXR1cm4gdmFsdWUgb2YgdGhlIGZ1bmN0aW9uLlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBUcmFja0J5RnVuY3Rpb248VD4geyAoaW5kZXg6IG51bWJlciwgaXRlbTogVCk6IGFueTsgfVxuXG4vKipcbiAqIFByb3ZpZGVzIGEgZmFjdG9yeSBmb3Ige0BsaW5rIEl0ZXJhYmxlRGlmZmVyfS5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgSXRlcmFibGVEaWZmZXJGYWN0b3J5IHtcbiAgc3VwcG9ydHMob2JqZWN0czogYW55KTogYm9vbGVhbjtcbiAgY3JlYXRlPFY+KHRyYWNrQnlGbj86IFRyYWNrQnlGdW5jdGlvbjxWPik6IEl0ZXJhYmxlRGlmZmVyPFY+O1xufVxuXG4vKipcbiAqIEEgcmVwb3NpdG9yeSBvZiBkaWZmZXJlbnQgaXRlcmFibGUgZGlmZmluZyBzdHJhdGVnaWVzIHVzZWQgYnkgTmdGb3IsIE5nQ2xhc3MsIGFuZCBvdGhlcnMuXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgY2xhc3MgSXRlcmFibGVEaWZmZXJzIHtcbiAgLyoqIEBub2NvbGxhcHNlICovXG4gIHN0YXRpYyBuZ0luamVjdGFibGVEZWYgPSDOlGRlZmluZUluamVjdGFibGUoe1xuICAgIHByb3ZpZGVkSW46ICdyb290JyxcbiAgICBmYWN0b3J5OiAoKSA9PiBuZXcgSXRlcmFibGVEaWZmZXJzKFtuZXcgRGVmYXVsdEl0ZXJhYmxlRGlmZmVyRmFjdG9yeSgpXSlcbiAgfSk7XG5cbiAgLyoqXG4gICAqIEBkZXByZWNhdGVkIHY0LjAuMCAtIFNob3VsZCBiZSBwcml2YXRlXG4gICAqL1xuICBmYWN0b3JpZXM6IEl0ZXJhYmxlRGlmZmVyRmFjdG9yeVtdO1xuICBjb25zdHJ1Y3RvcihmYWN0b3JpZXM6IEl0ZXJhYmxlRGlmZmVyRmFjdG9yeVtdKSB7IHRoaXMuZmFjdG9yaWVzID0gZmFjdG9yaWVzOyB9XG5cbiAgc3RhdGljIGNyZWF0ZShmYWN0b3JpZXM6IEl0ZXJhYmxlRGlmZmVyRmFjdG9yeVtdLCBwYXJlbnQ/OiBJdGVyYWJsZURpZmZlcnMpOiBJdGVyYWJsZURpZmZlcnMge1xuICAgIGlmIChwYXJlbnQgIT0gbnVsbCkge1xuICAgICAgY29uc3QgY29waWVkID0gcGFyZW50LmZhY3Rvcmllcy5zbGljZSgpO1xuICAgICAgZmFjdG9yaWVzID0gZmFjdG9yaWVzLmNvbmNhdChjb3BpZWQpO1xuICAgIH1cblxuICAgIHJldHVybiBuZXcgSXRlcmFibGVEaWZmZXJzKGZhY3Rvcmllcyk7XG4gIH1cblxuICAvKipcbiAgICogVGFrZXMgYW4gYXJyYXkgb2Yge0BsaW5rIEl0ZXJhYmxlRGlmZmVyRmFjdG9yeX0gYW5kIHJldHVybnMgYSBwcm92aWRlciB1c2VkIHRvIGV4dGVuZCB0aGVcbiAgICogaW5oZXJpdGVkIHtAbGluayBJdGVyYWJsZURpZmZlcnN9IGluc3RhbmNlIHdpdGggdGhlIHByb3ZpZGVkIGZhY3RvcmllcyBhbmQgcmV0dXJuIGEgbmV3XG4gICAqIHtAbGluayBJdGVyYWJsZURpZmZlcnN9IGluc3RhbmNlLlxuICAgKlxuICAgKiBAdXNhZ2VOb3Rlc1xuICAgKiAjIyMgRXhhbXBsZVxuICAgKlxuICAgKiBUaGUgZm9sbG93aW5nIGV4YW1wbGUgc2hvd3MgaG93IHRvIGV4dGVuZCBhbiBleGlzdGluZyBsaXN0IG9mIGZhY3RvcmllcyxcbiAgICogd2hpY2ggd2lsbCBvbmx5IGJlIGFwcGxpZWQgdG8gdGhlIGluamVjdG9yIGZvciB0aGlzIGNvbXBvbmVudCBhbmQgaXRzIGNoaWxkcmVuLlxuICAgKiBUaGlzIHN0ZXAgaXMgYWxsIHRoYXQncyByZXF1aXJlZCB0byBtYWtlIGEgbmV3IHtAbGluayBJdGVyYWJsZURpZmZlcn0gYXZhaWxhYmxlLlxuICAgKlxuICAgKiBgYGBcbiAgICogQENvbXBvbmVudCh7XG4gICAqICAgdmlld1Byb3ZpZGVyczogW1xuICAgKiAgICAgSXRlcmFibGVEaWZmZXJzLmV4dGVuZChbbmV3IEltbXV0YWJsZUxpc3REaWZmZXIoKV0pXG4gICAqICAgXVxuICAgKiB9KVxuICAgKiBgYGBcbiAgICovXG4gIHN0YXRpYyBleHRlbmQoZmFjdG9yaWVzOiBJdGVyYWJsZURpZmZlckZhY3RvcnlbXSk6IFN0YXRpY1Byb3ZpZGVyIHtcbiAgICByZXR1cm4ge1xuICAgICAgcHJvdmlkZTogSXRlcmFibGVEaWZmZXJzLFxuICAgICAgdXNlRmFjdG9yeTogKHBhcmVudDogSXRlcmFibGVEaWZmZXJzKSA9PiB7XG4gICAgICAgIGlmICghcGFyZW50KSB7XG4gICAgICAgICAgLy8gVHlwaWNhbGx5IHdvdWxkIG9jY3VyIHdoZW4gY2FsbGluZyBJdGVyYWJsZURpZmZlcnMuZXh0ZW5kIGluc2lkZSBvZiBkZXBlbmRlbmNpZXMgcGFzc2VkXG4gICAgICAgICAgLy8gdG9cbiAgICAgICAgICAvLyBib290c3RyYXAoKSwgd2hpY2ggd291bGQgb3ZlcnJpZGUgZGVmYXVsdCBwaXBlcyBpbnN0ZWFkIG9mIGV4dGVuZGluZyB0aGVtLlxuICAgICAgICAgIHRocm93IG5ldyBFcnJvcignQ2Fubm90IGV4dGVuZCBJdGVyYWJsZURpZmZlcnMgd2l0aG91dCBhIHBhcmVudCBpbmplY3RvcicpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBJdGVyYWJsZURpZmZlcnMuY3JlYXRlKGZhY3RvcmllcywgcGFyZW50KTtcbiAgICAgIH0sXG4gICAgICAvLyBEZXBlbmRlbmN5IHRlY2huaWNhbGx5IGlzbid0IG9wdGlvbmFsLCBidXQgd2UgY2FuIHByb3ZpZGUgYSBiZXR0ZXIgZXJyb3IgbWVzc2FnZSB0aGlzIHdheS5cbiAgICAgIGRlcHM6IFtbSXRlcmFibGVEaWZmZXJzLCBuZXcgU2tpcFNlbGYoKSwgbmV3IE9wdGlvbmFsKCldXVxuICAgIH07XG4gIH1cblxuICBmaW5kKGl0ZXJhYmxlOiBhbnkpOiBJdGVyYWJsZURpZmZlckZhY3Rvcnkge1xuICAgIGNvbnN0IGZhY3RvcnkgPSB0aGlzLmZhY3Rvcmllcy5maW5kKGYgPT4gZi5zdXBwb3J0cyhpdGVyYWJsZSkpO1xuICAgIGlmIChmYWN0b3J5ICE9IG51bGwpIHtcbiAgICAgIHJldHVybiBmYWN0b3J5O1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgYENhbm5vdCBmaW5kIGEgZGlmZmVyIHN1cHBvcnRpbmcgb2JqZWN0ICcke2l0ZXJhYmxlfScgb2YgdHlwZSAnJHtnZXRUeXBlTmFtZUZvckRlYnVnZ2luZyhpdGVyYWJsZSl9J2ApO1xuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0VHlwZU5hbWVGb3JEZWJ1Z2dpbmcodHlwZTogYW55KTogc3RyaW5nIHtcbiAgcmV0dXJuIHR5cGVbJ25hbWUnXSB8fCB0eXBlb2YgdHlwZTtcbn1cbiJdfQ==