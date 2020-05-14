/**
 * @fileoverview added by tsickle
 * Generated from: packages/core/src/change_detection/differs/iterable_differs.ts
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ɵɵdefineInjectable } from '../../di/interface/defs';
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
let IterableDiffers = /** @class */ (() => {
    /**
     * A repository of different iterable diffing strategies used by NgFor, NgClass, and others.
     *
     * \@publicApi
     */
    class IterableDiffers {
        /**
         * @param {?} factories
         */
        constructor(factories) {
            this.factories = factories;
        }
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
    IterableDiffers.ɵprov = ɵɵdefineInjectable({
        token: IterableDiffers,
        providedIn: 'root',
        factory: (/**
         * @return {?}
         */
        () => new IterableDiffers([new DefaultIterableDifferFactory()]))
    });
    return IterableDiffers;
})();
export { IterableDiffers };
if (false) {
    /**
     * @nocollapse
     * @type {?}
     */
    IterableDiffers.ɵprov;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaXRlcmFibGVfZGlmZmVycy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL2NoYW5nZV9kZXRlY3Rpb24vZGlmZmVycy9pdGVyYWJsZV9kaWZmZXJzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQVFBLE9BQU8sRUFBQyxrQkFBa0IsRUFBQyxNQUFNLHlCQUF5QixDQUFDO0FBRTNELE9BQU8sRUFBQyxRQUFRLEVBQUUsUUFBUSxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDckQsT0FBTyxFQUFDLDRCQUE0QixFQUFDLE1BQU0sb0NBQW9DLENBQUM7Ozs7Ozs7OztBQWlCaEYsb0NBU0M7Ozs7Ozs7OztJQURDLHNEQUFvRTs7Ozs7Ozs7OztBQVN0RSxxQ0FnREM7Ozs7Ozs7O0lBM0NDLDBEQUFpRTs7Ozs7Ozs7Ozs7O0lBa0JqRSwrREFHbUQ7Ozs7Ozs7SUFNbkQsa0VBQXlFOzs7Ozs7SUFHekUsK0RBQXNFOzs7Ozs7SUFHdEUsK0RBQXNFOzs7Ozs7SUFHdEUsaUVBQXdFOzs7Ozs7O0lBTXhFLG9FQUEyRTs7Ozs7Ozs7O0FBUTdFLDBDQVlDOzs7Ozs7SUFWQyw0Q0FBbUM7Ozs7O0lBR25DLDZDQUFvQzs7Ozs7SUFHcEMsb0NBQWlCOzs7OztJQUdqQix5Q0FBd0I7Ozs7Ozs7O0FBTzFCLDRDQUE2RTs7Ozs7Ozs7Ozs7QUFVN0UscUNBRUM7Ozs7Ozs7QUFPRCwyQ0FHQzs7Ozs7O0lBRkMsa0VBQWdDOzs7Ozs7SUFDaEMsa0VBQTZEOzs7Ozs7O0FBUS9EOzs7Ozs7SUFBQSxNQUFhLGVBQWU7Ozs7UUFZMUIsWUFBWSxTQUFrQztZQUM1QyxJQUFJLENBQUMsU0FBUyxHQUFHLFNBQVMsQ0FBQztRQUM3QixDQUFDOzs7Ozs7UUFFRCxNQUFNLENBQUMsTUFBTSxDQUFDLFNBQWtDLEVBQUUsTUFBd0I7WUFDeEUsSUFBSSxNQUFNLElBQUksSUFBSSxFQUFFOztzQkFDWixNQUFNLEdBQUcsTUFBTSxDQUFDLFNBQVMsQ0FBQyxLQUFLLEVBQUU7Z0JBQ3ZDLFNBQVMsR0FBRyxTQUFTLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDO2FBQ3RDO1lBRUQsT0FBTyxJQUFJLGVBQWUsQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUN4QyxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztRQXNCRCxNQUFNLENBQUMsTUFBTSxDQUFDLFNBQWtDO1lBQzlDLE9BQU87Z0JBQ0wsT0FBTyxFQUFFLGVBQWU7Z0JBQ3hCLFVBQVU7Ozs7Z0JBQUUsQ0FBQyxNQUF1QixFQUFFLEVBQUU7b0JBQ3RDLElBQUksQ0FBQyxNQUFNLEVBQUU7d0JBQ1gsMEZBQTBGO3dCQUMxRixLQUFLO3dCQUNMLDZFQUE2RTt3QkFDN0UsTUFBTSxJQUFJLEtBQUssQ0FBQyx5REFBeUQsQ0FBQyxDQUFDO3FCQUM1RTtvQkFDRCxPQUFPLGVBQWUsQ0FBQyxNQUFNLENBQUMsU0FBUyxFQUFFLE1BQU0sQ0FBQyxDQUFDO2dCQUNuRCxDQUFDLENBQUE7O2dCQUVELElBQUksRUFBRSxDQUFDLENBQUMsZUFBZSxFQUFFLElBQUksUUFBUSxFQUFFLEVBQUUsSUFBSSxRQUFRLEVBQUUsQ0FBQyxDQUFDO2FBQzFELENBQUM7UUFDSixDQUFDOzs7OztRQUVELElBQUksQ0FBQyxRQUFhOztrQkFDVixPQUFPLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJOzs7O1lBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxFQUFDO1lBQzlELElBQUksT0FBTyxJQUFJLElBQUksRUFBRTtnQkFDbkIsT0FBTyxPQUFPLENBQUM7YUFDaEI7aUJBQU07Z0JBQ0wsTUFBTSxJQUFJLEtBQUssQ0FBQywyQ0FBMkMsUUFBUSxjQUMvRCx1QkFBdUIsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUM7YUFDM0M7UUFDSCxDQUFDOzs7SUFwRU0scUJBQUssR0FBRyxrQkFBa0IsQ0FBQztRQUNoQyxLQUFLLEVBQUUsZUFBZTtRQUN0QixVQUFVLEVBQUUsTUFBTTtRQUNsQixPQUFPOzs7UUFBRSxHQUFHLEVBQUUsQ0FBQyxJQUFJLGVBQWUsQ0FBQyxDQUFDLElBQUksNEJBQTRCLEVBQUUsQ0FBQyxDQUFDLENBQUE7S0FDekUsQ0FBQyxDQUFDO0lBaUVMLHNCQUFDO0tBQUE7U0F2RVksZUFBZTs7Ozs7O0lBRTFCLHNCQUlHOzs7OztJQUtILG9DQUFtQzs7Ozs7O0FBOERyQyxNQUFNLFVBQVUsdUJBQXVCLENBQUMsSUFBUztJQUMvQyxPQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxPQUFPLElBQUksQ0FBQztBQUNyQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge8m1ybVkZWZpbmVJbmplY3RhYmxlfSBmcm9tICcuLi8uLi9kaS9pbnRlcmZhY2UvZGVmcyc7XG5pbXBvcnQge1N0YXRpY1Byb3ZpZGVyfSBmcm9tICcuLi8uLi9kaS9pbnRlcmZhY2UvcHJvdmlkZXInO1xuaW1wb3J0IHtPcHRpb25hbCwgU2tpcFNlbGZ9IGZyb20gJy4uLy4uL2RpL21ldGFkYXRhJztcbmltcG9ydCB7RGVmYXVsdEl0ZXJhYmxlRGlmZmVyRmFjdG9yeX0gZnJvbSAnLi4vZGlmZmVycy9kZWZhdWx0X2l0ZXJhYmxlX2RpZmZlcic7XG5cblxuXG4vKipcbiAqIEEgdHlwZSBkZXNjcmliaW5nIHN1cHBvcnRlZCBpdGVyYWJsZSB0eXBlcy5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCB0eXBlIE5nSXRlcmFibGU8VD4gPSBBcnJheTxUPnxJdGVyYWJsZTxUPjtcblxuLyoqXG4gKiBBIHN0cmF0ZWd5IGZvciB0cmFja2luZyBjaGFuZ2VzIG92ZXIgdGltZSB0byBhbiBpdGVyYWJsZS4gVXNlZCBieSB7QGxpbmsgTmdGb3JPZn0gdG9cbiAqIHJlc3BvbmQgdG8gY2hhbmdlcyBpbiBhbiBpdGVyYWJsZSBieSBlZmZlY3RpbmcgZXF1aXZhbGVudCBjaGFuZ2VzIGluIHRoZSBET00uXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgaW50ZXJmYWNlIEl0ZXJhYmxlRGlmZmVyPFY+IHtcbiAgLyoqXG4gICAqIENvbXB1dGUgYSBkaWZmZXJlbmNlIGJldHdlZW4gdGhlIHByZXZpb3VzIHN0YXRlIGFuZCB0aGUgbmV3IGBvYmplY3RgIHN0YXRlLlxuICAgKlxuICAgKiBAcGFyYW0gb2JqZWN0IGNvbnRhaW5pbmcgdGhlIG5ldyB2YWx1ZS5cbiAgICogQHJldHVybnMgYW4gb2JqZWN0IGRlc2NyaWJpbmcgdGhlIGRpZmZlcmVuY2UuIFRoZSByZXR1cm4gdmFsdWUgaXMgb25seSB2YWxpZCB1bnRpbCB0aGUgbmV4dFxuICAgKiBgZGlmZigpYCBpbnZvY2F0aW9uLlxuICAgKi9cbiAgZGlmZihvYmplY3Q6IE5nSXRlcmFibGU8Vj58dW5kZWZpbmVkfG51bGwpOiBJdGVyYWJsZUNoYW5nZXM8Vj58bnVsbDtcbn1cblxuLyoqXG4gKiBBbiBvYmplY3QgZGVzY3JpYmluZyB0aGUgY2hhbmdlcyBpbiB0aGUgYEl0ZXJhYmxlYCBjb2xsZWN0aW9uIHNpbmNlIGxhc3QgdGltZVxuICogYEl0ZXJhYmxlRGlmZmVyI2RpZmYoKWAgd2FzIGludm9rZWQuXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgaW50ZXJmYWNlIEl0ZXJhYmxlQ2hhbmdlczxWPiB7XG4gIC8qKlxuICAgKiBJdGVyYXRlIG92ZXIgYWxsIGNoYW5nZXMuIGBJdGVyYWJsZUNoYW5nZVJlY29yZGAgd2lsbCBjb250YWluIGluZm9ybWF0aW9uIGFib3V0IGNoYW5nZXNcbiAgICogdG8gZWFjaCBpdGVtLlxuICAgKi9cbiAgZm9yRWFjaEl0ZW0oZm46IChyZWNvcmQ6IEl0ZXJhYmxlQ2hhbmdlUmVjb3JkPFY+KSA9PiB2b2lkKTogdm9pZDtcblxuICAvKipcbiAgICogSXRlcmF0ZSBvdmVyIGEgc2V0IG9mIG9wZXJhdGlvbnMgd2hpY2ggd2hlbiBhcHBsaWVkIHRvIHRoZSBvcmlnaW5hbCBgSXRlcmFibGVgIHdpbGwgcHJvZHVjZSB0aGVcbiAgICogbmV3IGBJdGVyYWJsZWAuXG4gICAqXG4gICAqIE5PVEU6IFRoZXNlIGFyZSBub3QgbmVjZXNzYXJpbHkgdGhlIGFjdHVhbCBvcGVyYXRpb25zIHdoaWNoIHdlcmUgYXBwbGllZCB0byB0aGUgb3JpZ2luYWxcbiAgICogYEl0ZXJhYmxlYCwgcmF0aGVyIHRoZXNlIGFyZSBhIHNldCBvZiBjb21wdXRlZCBvcGVyYXRpb25zIHdoaWNoIG1heSBub3QgYmUgdGhlIHNhbWUgYXMgdGhlXG4gICAqIG9uZXMgYXBwbGllZC5cbiAgICpcbiAgICogQHBhcmFtIHJlY29yZCBBIGNoYW5nZSB3aGljaCBuZWVkcyB0byBiZSBhcHBsaWVkXG4gICAqIEBwYXJhbSBwcmV2aW91c0luZGV4IFRoZSBgSXRlcmFibGVDaGFuZ2VSZWNvcmQjcHJldmlvdXNJbmRleGAgb2YgdGhlIGByZWNvcmRgIHJlZmVycyB0byB0aGVcbiAgICogICAgICAgIG9yaWdpbmFsIGBJdGVyYWJsZWAgbG9jYXRpb24sIHdoZXJlIGFzIGBwcmV2aW91c0luZGV4YCByZWZlcnMgdG8gdGhlIHRyYW5zaWVudCBsb2NhdGlvblxuICAgKiAgICAgICAgb2YgdGhlIGl0ZW0sIGFmdGVyIGFwcGx5aW5nIHRoZSBvcGVyYXRpb25zIHVwIHRvIHRoaXMgcG9pbnQuXG4gICAqIEBwYXJhbSBjdXJyZW50SW5kZXggVGhlIGBJdGVyYWJsZUNoYW5nZVJlY29yZCNjdXJyZW50SW5kZXhgIG9mIHRoZSBgcmVjb3JkYCByZWZlcnMgdG8gdGhlXG4gICAqICAgICAgICBvcmlnaW5hbCBgSXRlcmFibGVgIGxvY2F0aW9uLCB3aGVyZSBhcyBgY3VycmVudEluZGV4YCByZWZlcnMgdG8gdGhlIHRyYW5zaWVudCBsb2NhdGlvblxuICAgKiAgICAgICAgb2YgdGhlIGl0ZW0sIGFmdGVyIGFwcGx5aW5nIHRoZSBvcGVyYXRpb25zIHVwIHRvIHRoaXMgcG9pbnQuXG4gICAqL1xuICBmb3JFYWNoT3BlcmF0aW9uKFxuICAgICAgZm46XG4gICAgICAgICAgKHJlY29yZDogSXRlcmFibGVDaGFuZ2VSZWNvcmQ8Vj4sIHByZXZpb3VzSW5kZXg6IG51bWJlcnxudWxsLFxuICAgICAgICAgICBjdXJyZW50SW5kZXg6IG51bWJlcnxudWxsKSA9PiB2b2lkKTogdm9pZDtcblxuICAvKipcbiAgICogSXRlcmF0ZSBvdmVyIGNoYW5nZXMgaW4gdGhlIG9yZGVyIG9mIG9yaWdpbmFsIGBJdGVyYWJsZWAgc2hvd2luZyB3aGVyZSB0aGUgb3JpZ2luYWwgaXRlbXNcbiAgICogaGF2ZSBtb3ZlZC5cbiAgICovXG4gIGZvckVhY2hQcmV2aW91c0l0ZW0oZm46IChyZWNvcmQ6IEl0ZXJhYmxlQ2hhbmdlUmVjb3JkPFY+KSA9PiB2b2lkKTogdm9pZDtcblxuICAvKiogSXRlcmF0ZSBvdmVyIGFsbCBhZGRlZCBpdGVtcy4gKi9cbiAgZm9yRWFjaEFkZGVkSXRlbShmbjogKHJlY29yZDogSXRlcmFibGVDaGFuZ2VSZWNvcmQ8Vj4pID0+IHZvaWQpOiB2b2lkO1xuXG4gIC8qKiBJdGVyYXRlIG92ZXIgYWxsIG1vdmVkIGl0ZW1zLiAqL1xuICBmb3JFYWNoTW92ZWRJdGVtKGZuOiAocmVjb3JkOiBJdGVyYWJsZUNoYW5nZVJlY29yZDxWPikgPT4gdm9pZCk6IHZvaWQ7XG5cbiAgLyoqIEl0ZXJhdGUgb3ZlciBhbGwgcmVtb3ZlZCBpdGVtcy4gKi9cbiAgZm9yRWFjaFJlbW92ZWRJdGVtKGZuOiAocmVjb3JkOiBJdGVyYWJsZUNoYW5nZVJlY29yZDxWPikgPT4gdm9pZCk6IHZvaWQ7XG5cbiAgLyoqXG4gICAqIEl0ZXJhdGUgb3ZlciBhbGwgaXRlbXMgd2hpY2ggaGFkIHRoZWlyIGlkZW50aXR5IChhcyBjb21wdXRlZCBieSB0aGUgYFRyYWNrQnlGdW5jdGlvbmApXG4gICAqIGNoYW5nZWQuXG4gICAqL1xuICBmb3JFYWNoSWRlbnRpdHlDaGFuZ2UoZm46IChyZWNvcmQ6IEl0ZXJhYmxlQ2hhbmdlUmVjb3JkPFY+KSA9PiB2b2lkKTogdm9pZDtcbn1cblxuLyoqXG4gKiBSZWNvcmQgcmVwcmVzZW50aW5nIHRoZSBpdGVtIGNoYW5nZSBpbmZvcm1hdGlvbi5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgSXRlcmFibGVDaGFuZ2VSZWNvcmQ8Vj4ge1xuICAvKiogQ3VycmVudCBpbmRleCBvZiB0aGUgaXRlbSBpbiBgSXRlcmFibGVgIG9yIG51bGwgaWYgcmVtb3ZlZC4gKi9cbiAgcmVhZG9ubHkgY3VycmVudEluZGV4OiBudW1iZXJ8bnVsbDtcblxuICAvKiogUHJldmlvdXMgaW5kZXggb2YgdGhlIGl0ZW0gaW4gYEl0ZXJhYmxlYCBvciBudWxsIGlmIGFkZGVkLiAqL1xuICByZWFkb25seSBwcmV2aW91c0luZGV4OiBudW1iZXJ8bnVsbDtcblxuICAvKiogVGhlIGl0ZW0uICovXG4gIHJlYWRvbmx5IGl0ZW06IFY7XG5cbiAgLyoqIFRyYWNrIGJ5IGlkZW50aXR5IGFzIGNvbXB1dGVkIGJ5IHRoZSBgVHJhY2tCeUZ1bmN0aW9uYC4gKi9cbiAgcmVhZG9ubHkgdHJhY2tCeUlkOiBhbnk7XG59XG5cbi8qKlxuICogQGRlcHJlY2F0ZWQgdjQuMC4wIC0gVXNlIEl0ZXJhYmxlQ2hhbmdlUmVjb3JkIGluc3RlYWQuXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgQ29sbGVjdGlvbkNoYW5nZVJlY29yZDxWPiBleHRlbmRzIEl0ZXJhYmxlQ2hhbmdlUmVjb3JkPFY+IHt9XG5cbi8qKlxuICogQW4gb3B0aW9uYWwgZnVuY3Rpb24gcGFzc2VkIGludG8gdGhlIGBOZ0Zvck9mYCBkaXJlY3RpdmUgdGhhdCBkZWZpbmVzIGhvdyB0byB0cmFja1xuICogY2hhbmdlcyBmb3IgaXRlbXMgaW4gYW4gaXRlcmFibGUuXG4gKiBUaGUgZnVuY3Rpb24gdGFrZXMgdGhlIGl0ZXJhdGlvbiBpbmRleCBhbmQgaXRlbSBJRC5cbiAqIFdoZW4gc3VwcGxpZWQsIEFuZ3VsYXIgdHJhY2tzIGNoYW5nZXMgYnkgdGhlIHJldHVybiB2YWx1ZSBvZiB0aGUgZnVuY3Rpb24uXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgaW50ZXJmYWNlIFRyYWNrQnlGdW5jdGlvbjxUPiB7XG4gIChpbmRleDogbnVtYmVyLCBpdGVtOiBUKTogYW55O1xufVxuXG4vKipcbiAqIFByb3ZpZGVzIGEgZmFjdG9yeSBmb3Ige0BsaW5rIEl0ZXJhYmxlRGlmZmVyfS5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgSXRlcmFibGVEaWZmZXJGYWN0b3J5IHtcbiAgc3VwcG9ydHMob2JqZWN0czogYW55KTogYm9vbGVhbjtcbiAgY3JlYXRlPFY+KHRyYWNrQnlGbj86IFRyYWNrQnlGdW5jdGlvbjxWPik6IEl0ZXJhYmxlRGlmZmVyPFY+O1xufVxuXG4vKipcbiAqIEEgcmVwb3NpdG9yeSBvZiBkaWZmZXJlbnQgaXRlcmFibGUgZGlmZmluZyBzdHJhdGVnaWVzIHVzZWQgYnkgTmdGb3IsIE5nQ2xhc3MsIGFuZCBvdGhlcnMuXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgY2xhc3MgSXRlcmFibGVEaWZmZXJzIHtcbiAgLyoqIEBub2NvbGxhcHNlICovXG4gIHN0YXRpYyDJtXByb3YgPSDJtcm1ZGVmaW5lSW5qZWN0YWJsZSh7XG4gICAgdG9rZW46IEl0ZXJhYmxlRGlmZmVycyxcbiAgICBwcm92aWRlZEluOiAncm9vdCcsXG4gICAgZmFjdG9yeTogKCkgPT4gbmV3IEl0ZXJhYmxlRGlmZmVycyhbbmV3IERlZmF1bHRJdGVyYWJsZURpZmZlckZhY3RvcnkoKV0pXG4gIH0pO1xuXG4gIC8qKlxuICAgKiBAZGVwcmVjYXRlZCB2NC4wLjAgLSBTaG91bGQgYmUgcHJpdmF0ZVxuICAgKi9cbiAgZmFjdG9yaWVzOiBJdGVyYWJsZURpZmZlckZhY3RvcnlbXTtcbiAgY29uc3RydWN0b3IoZmFjdG9yaWVzOiBJdGVyYWJsZURpZmZlckZhY3RvcnlbXSkge1xuICAgIHRoaXMuZmFjdG9yaWVzID0gZmFjdG9yaWVzO1xuICB9XG5cbiAgc3RhdGljIGNyZWF0ZShmYWN0b3JpZXM6IEl0ZXJhYmxlRGlmZmVyRmFjdG9yeVtdLCBwYXJlbnQ/OiBJdGVyYWJsZURpZmZlcnMpOiBJdGVyYWJsZURpZmZlcnMge1xuICAgIGlmIChwYXJlbnQgIT0gbnVsbCkge1xuICAgICAgY29uc3QgY29waWVkID0gcGFyZW50LmZhY3Rvcmllcy5zbGljZSgpO1xuICAgICAgZmFjdG9yaWVzID0gZmFjdG9yaWVzLmNvbmNhdChjb3BpZWQpO1xuICAgIH1cblxuICAgIHJldHVybiBuZXcgSXRlcmFibGVEaWZmZXJzKGZhY3Rvcmllcyk7XG4gIH1cblxuICAvKipcbiAgICogVGFrZXMgYW4gYXJyYXkgb2Yge0BsaW5rIEl0ZXJhYmxlRGlmZmVyRmFjdG9yeX0gYW5kIHJldHVybnMgYSBwcm92aWRlciB1c2VkIHRvIGV4dGVuZCB0aGVcbiAgICogaW5oZXJpdGVkIHtAbGluayBJdGVyYWJsZURpZmZlcnN9IGluc3RhbmNlIHdpdGggdGhlIHByb3ZpZGVkIGZhY3RvcmllcyBhbmQgcmV0dXJuIGEgbmV3XG4gICAqIHtAbGluayBJdGVyYWJsZURpZmZlcnN9IGluc3RhbmNlLlxuICAgKlxuICAgKiBAdXNhZ2VOb3Rlc1xuICAgKiAjIyMgRXhhbXBsZVxuICAgKlxuICAgKiBUaGUgZm9sbG93aW5nIGV4YW1wbGUgc2hvd3MgaG93IHRvIGV4dGVuZCBhbiBleGlzdGluZyBsaXN0IG9mIGZhY3RvcmllcyxcbiAgICogd2hpY2ggd2lsbCBvbmx5IGJlIGFwcGxpZWQgdG8gdGhlIGluamVjdG9yIGZvciB0aGlzIGNvbXBvbmVudCBhbmQgaXRzIGNoaWxkcmVuLlxuICAgKiBUaGlzIHN0ZXAgaXMgYWxsIHRoYXQncyByZXF1aXJlZCB0byBtYWtlIGEgbmV3IHtAbGluayBJdGVyYWJsZURpZmZlcn0gYXZhaWxhYmxlLlxuICAgKlxuICAgKiBgYGBcbiAgICogQENvbXBvbmVudCh7XG4gICAqICAgdmlld1Byb3ZpZGVyczogW1xuICAgKiAgICAgSXRlcmFibGVEaWZmZXJzLmV4dGVuZChbbmV3IEltbXV0YWJsZUxpc3REaWZmZXIoKV0pXG4gICAqICAgXVxuICAgKiB9KVxuICAgKiBgYGBcbiAgICovXG4gIHN0YXRpYyBleHRlbmQoZmFjdG9yaWVzOiBJdGVyYWJsZURpZmZlckZhY3RvcnlbXSk6IFN0YXRpY1Byb3ZpZGVyIHtcbiAgICByZXR1cm4ge1xuICAgICAgcHJvdmlkZTogSXRlcmFibGVEaWZmZXJzLFxuICAgICAgdXNlRmFjdG9yeTogKHBhcmVudDogSXRlcmFibGVEaWZmZXJzKSA9PiB7XG4gICAgICAgIGlmICghcGFyZW50KSB7XG4gICAgICAgICAgLy8gVHlwaWNhbGx5IHdvdWxkIG9jY3VyIHdoZW4gY2FsbGluZyBJdGVyYWJsZURpZmZlcnMuZXh0ZW5kIGluc2lkZSBvZiBkZXBlbmRlbmNpZXMgcGFzc2VkXG4gICAgICAgICAgLy8gdG9cbiAgICAgICAgICAvLyBib290c3RyYXAoKSwgd2hpY2ggd291bGQgb3ZlcnJpZGUgZGVmYXVsdCBwaXBlcyBpbnN0ZWFkIG9mIGV4dGVuZGluZyB0aGVtLlxuICAgICAgICAgIHRocm93IG5ldyBFcnJvcignQ2Fubm90IGV4dGVuZCBJdGVyYWJsZURpZmZlcnMgd2l0aG91dCBhIHBhcmVudCBpbmplY3RvcicpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBJdGVyYWJsZURpZmZlcnMuY3JlYXRlKGZhY3RvcmllcywgcGFyZW50KTtcbiAgICAgIH0sXG4gICAgICAvLyBEZXBlbmRlbmN5IHRlY2huaWNhbGx5IGlzbid0IG9wdGlvbmFsLCBidXQgd2UgY2FuIHByb3ZpZGUgYSBiZXR0ZXIgZXJyb3IgbWVzc2FnZSB0aGlzIHdheS5cbiAgICAgIGRlcHM6IFtbSXRlcmFibGVEaWZmZXJzLCBuZXcgU2tpcFNlbGYoKSwgbmV3IE9wdGlvbmFsKCldXVxuICAgIH07XG4gIH1cblxuICBmaW5kKGl0ZXJhYmxlOiBhbnkpOiBJdGVyYWJsZURpZmZlckZhY3Rvcnkge1xuICAgIGNvbnN0IGZhY3RvcnkgPSB0aGlzLmZhY3Rvcmllcy5maW5kKGYgPT4gZi5zdXBwb3J0cyhpdGVyYWJsZSkpO1xuICAgIGlmIChmYWN0b3J5ICE9IG51bGwpIHtcbiAgICAgIHJldHVybiBmYWN0b3J5O1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYENhbm5vdCBmaW5kIGEgZGlmZmVyIHN1cHBvcnRpbmcgb2JqZWN0ICcke2l0ZXJhYmxlfScgb2YgdHlwZSAnJHtcbiAgICAgICAgICBnZXRUeXBlTmFtZUZvckRlYnVnZ2luZyhpdGVyYWJsZSl9J2ApO1xuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0VHlwZU5hbWVGb3JEZWJ1Z2dpbmcodHlwZTogYW55KTogc3RyaW5nIHtcbiAgcmV0dXJuIHR5cGVbJ25hbWUnXSB8fCB0eXBlb2YgdHlwZTtcbn1cbiJdfQ==