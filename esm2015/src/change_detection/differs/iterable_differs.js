/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { defineInjectable } from '../../di/defs';
import { Optional, SkipSelf } from '../../di/metadata';
import { DefaultIterableDifferFactory } from '../differs/default_iterable_differ';
/** @typedef {?} */
var NgIterable;
export { NgIterable };
/**
 * A strategy for tracking changes over time to an iterable. Used by {\@link NgForOf} to
 * respond to changes in an iterable by effecting equivalent changes in the DOM.
 *
 * \@publicApi
 * @record
 * @template V
 */
export function IterableDiffer() { }
/**
 * Compute a difference between the previous state and the new `object` state.
 *
 * \@param object containing the new value.
 * \@return an object describing the difference. The return value is only valid until the next
 * `diff()` invocation.
 * @type {?}
 */
IterableDiffer.prototype.diff;
/**
 * An object describing the changes in the `Iterable` collection since last time
 * `IterableDiffer#diff()` was invoked.
 *
 * \@publicApi
 * @record
 * @template V
 */
export function IterableChanges() { }
/**
 * Iterate over all changes. `IterableChangeRecord` will contain information about changes
 * to each item.
 * @type {?}
 */
IterableChanges.prototype.forEachItem;
/**
 * Iterate over a set of operations which when applied to the original `Iterable` will produce the
 * new `Iterable`.
 *
 * NOTE: These are not necessarily the actual operations which were applied to the original
 * `Iterable`, rather these are a set of computed operations which may not be the same as the
 * ones applied.
 *
 * \@param record A change which needs to be applied
 * \@param previousIndex The `IterableChangeRecord#previousIndex` of the `record` refers to the
 *        original `Iterable` location, where as `previousIndex` refers to the transient location
 *        of the item, after applying the operations up to this point.
 * \@param currentIndex The `IterableChangeRecord#currentIndex` of the `record` refers to the
 *        original `Iterable` location, where as `currentIndex` refers to the transient location
 *        of the item, after applying the operations up to this point.
 * @type {?}
 */
IterableChanges.prototype.forEachOperation;
/**
 * Iterate over changes in the order of original `Iterable` showing where the original items
 * have moved.
 * @type {?}
 */
IterableChanges.prototype.forEachPreviousItem;
/**
 * Iterate over all added items.
 * @type {?}
 */
IterableChanges.prototype.forEachAddedItem;
/**
 * Iterate over all moved items.
 * @type {?}
 */
IterableChanges.prototype.forEachMovedItem;
/**
 * Iterate over all removed items.
 * @type {?}
 */
IterableChanges.prototype.forEachRemovedItem;
/**
 * Iterate over all items which had their identity (as computed by the `TrackByFunction`)
 * changed.
 * @type {?}
 */
IterableChanges.prototype.forEachIdentityChange;
/**
 * Record representing the item change information.
 *
 * \@publicApi
 * @record
 * @template V
 */
export function IterableChangeRecord() { }
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
/**
 * @deprecated v4.0.0 - Use IterableChangeRecord instead.
 * \@publicApi
 * @record
 * @template V
 */
export function CollectionChangeRecord() { }
/**
 * An optional function passed into {\@link NgForOf} that defines how to track
 * items in an iterable (e.g. fby index or id)
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
/** @type {?} */
IterableDifferFactory.prototype.supports;
/** @type {?} */
IterableDifferFactory.prototype.create;
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
            useFactory: (parent) => {
                if (!parent) {
                    // Typically would occur when calling IterableDiffers.extend inside of dependencies passed
                    // to
                    // bootstrap(), which would override default pipes instead of extending them.
                    throw new Error('Cannot extend IterableDiffers without a parent injector');
                }
                return IterableDiffers.create(factories, parent);
            },
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
        const factory = this.factories.find(f => f.supports(iterable));
        if (factory != null) {
            return factory;
        }
        else {
            throw new Error(`Cannot find a differ supporting object '${iterable}' of type '${getTypeNameForDebugging(iterable)}'`);
        }
    }
}
/** @nocollapse */
/** @nocollapse */ IterableDiffers.ngInjectableDef = defineInjectable({
    providedIn: 'root',
    factory: () => new IterableDiffers([new DefaultIterableDifferFactory()])
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaXRlcmFibGVfZGlmZmVycy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL2NoYW5nZV9kZXRlY3Rpb24vZGlmZmVycy9pdGVyYWJsZV9kaWZmZXJzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBUUEsT0FBTyxFQUFDLGdCQUFnQixFQUFDLE1BQU0sZUFBZSxDQUFDO0FBQy9DLE9BQU8sRUFBQyxRQUFRLEVBQUUsUUFBUSxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFFckQsT0FBTyxFQUFDLDRCQUE0QixFQUFDLE1BQU0sb0NBQW9DLENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFpSWhGLE1BQU0sT0FBTyxlQUFlOzs7O0lBVzFCLFlBQVksU0FBa0MsSUFBSSxJQUFJLENBQUMsU0FBUyxHQUFHLFNBQVMsQ0FBQyxFQUFFOzs7Ozs7SUFFL0UsTUFBTSxDQUFDLE1BQU0sQ0FBQyxTQUFrQyxFQUFFLE1BQXdCO1FBQ3hFLElBQUksTUFBTSxJQUFJLElBQUksRUFBRTs7WUFDbEIsTUFBTSxNQUFNLEdBQUcsTUFBTSxDQUFDLFNBQVMsQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUN4QyxTQUFTLEdBQUcsU0FBUyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQztTQUN0QztRQUVELE9BQU8sSUFBSSxlQUFlLENBQUMsU0FBUyxDQUFDLENBQUM7S0FDdkM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lBc0JELE1BQU0sQ0FBQyxNQUFNLENBQUMsU0FBa0M7UUFDOUMsT0FBTztZQUNMLE9BQU8sRUFBRSxlQUFlO1lBQ3hCLFVBQVUsRUFBRSxDQUFDLE1BQXVCLEVBQUUsRUFBRTtnQkFDdEMsSUFBSSxDQUFDLE1BQU0sRUFBRTs7OztvQkFJWCxNQUFNLElBQUksS0FBSyxDQUFDLHlEQUF5RCxDQUFDLENBQUM7aUJBQzVFO2dCQUNELE9BQU8sZUFBZSxDQUFDLE1BQU0sQ0FBQyxTQUFTLEVBQUUsTUFBTSxDQUFDLENBQUM7YUFDbEQ7O1lBRUQsSUFBSSxFQUFFLENBQUMsQ0FBQyxlQUFlLEVBQUUsSUFBSSxRQUFRLEVBQUUsRUFBRSxJQUFJLFFBQVEsRUFBRSxDQUFDLENBQUM7U0FDMUQsQ0FBQztLQUNIOzs7OztJQUVELElBQUksQ0FBQyxRQUFhOztRQUNoQixNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztRQUMvRCxJQUFJLE9BQU8sSUFBSSxJQUFJLEVBQUU7WUFDbkIsT0FBTyxPQUFPLENBQUM7U0FDaEI7YUFBTTtZQUNMLE1BQU0sSUFBSSxLQUFLLENBQ1gsMkNBQTJDLFFBQVEsY0FBYyx1QkFBdUIsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUM7U0FDNUc7S0FDRjs7O0FBakVELGtDQUF5QixnQkFBZ0IsQ0FBQztJQUN4QyxVQUFVLEVBQUUsTUFBTTtJQUNsQixPQUFPLEVBQUUsR0FBRyxFQUFFLENBQUMsSUFBSSxlQUFlLENBQUMsQ0FBQyxJQUFJLDRCQUE0QixFQUFFLENBQUMsQ0FBQztDQUN6RSxDQUFDLENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBaUVMLE1BQU0sVUFBVSx1QkFBdUIsQ0FBQyxJQUFTO0lBQy9DLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLE9BQU8sSUFBSSxDQUFDO0NBQ3BDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge2RlZmluZUluamVjdGFibGV9IGZyb20gJy4uLy4uL2RpL2RlZnMnO1xuaW1wb3J0IHtPcHRpb25hbCwgU2tpcFNlbGZ9IGZyb20gJy4uLy4uL2RpL21ldGFkYXRhJztcbmltcG9ydCB7U3RhdGljUHJvdmlkZXJ9IGZyb20gJy4uLy4uL2RpL3Byb3ZpZGVyJztcbmltcG9ydCB7RGVmYXVsdEl0ZXJhYmxlRGlmZmVyRmFjdG9yeX0gZnJvbSAnLi4vZGlmZmVycy9kZWZhdWx0X2l0ZXJhYmxlX2RpZmZlcic7XG5cblxuLyoqXG4gKiBBIHR5cGUgZGVzY3JpYmluZyBzdXBwb3J0ZWQgaXRlcmFibGUgdHlwZXMuXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgdHlwZSBOZ0l0ZXJhYmxlPFQ+ID0gQXJyYXk8VD58IEl0ZXJhYmxlPFQ+O1xuXG4vKipcbiAqIEEgc3RyYXRlZ3kgZm9yIHRyYWNraW5nIGNoYW5nZXMgb3ZlciB0aW1lIHRvIGFuIGl0ZXJhYmxlLiBVc2VkIGJ5IHtAbGluayBOZ0Zvck9mfSB0b1xuICogcmVzcG9uZCB0byBjaGFuZ2VzIGluIGFuIGl0ZXJhYmxlIGJ5IGVmZmVjdGluZyBlcXVpdmFsZW50IGNoYW5nZXMgaW4gdGhlIERPTS5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgSXRlcmFibGVEaWZmZXI8Vj4ge1xuICAvKipcbiAgICogQ29tcHV0ZSBhIGRpZmZlcmVuY2UgYmV0d2VlbiB0aGUgcHJldmlvdXMgc3RhdGUgYW5kIHRoZSBuZXcgYG9iamVjdGAgc3RhdGUuXG4gICAqXG4gICAqIEBwYXJhbSBvYmplY3QgY29udGFpbmluZyB0aGUgbmV3IHZhbHVlLlxuICAgKiBAcmV0dXJucyBhbiBvYmplY3QgZGVzY3JpYmluZyB0aGUgZGlmZmVyZW5jZS4gVGhlIHJldHVybiB2YWx1ZSBpcyBvbmx5IHZhbGlkIHVudGlsIHRoZSBuZXh0XG4gICAqIGBkaWZmKClgIGludm9jYXRpb24uXG4gICAqL1xuICBkaWZmKG9iamVjdDogTmdJdGVyYWJsZTxWPik6IEl0ZXJhYmxlQ2hhbmdlczxWPnxudWxsO1xufVxuXG4vKipcbiAqIEFuIG9iamVjdCBkZXNjcmliaW5nIHRoZSBjaGFuZ2VzIGluIHRoZSBgSXRlcmFibGVgIGNvbGxlY3Rpb24gc2luY2UgbGFzdCB0aW1lXG4gKiBgSXRlcmFibGVEaWZmZXIjZGlmZigpYCB3YXMgaW52b2tlZC5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgSXRlcmFibGVDaGFuZ2VzPFY+IHtcbiAgLyoqXG4gICAqIEl0ZXJhdGUgb3ZlciBhbGwgY2hhbmdlcy4gYEl0ZXJhYmxlQ2hhbmdlUmVjb3JkYCB3aWxsIGNvbnRhaW4gaW5mb3JtYXRpb24gYWJvdXQgY2hhbmdlc1xuICAgKiB0byBlYWNoIGl0ZW0uXG4gICAqL1xuICBmb3JFYWNoSXRlbShmbjogKHJlY29yZDogSXRlcmFibGVDaGFuZ2VSZWNvcmQ8Vj4pID0+IHZvaWQpOiB2b2lkO1xuXG4gIC8qKlxuICAgKiBJdGVyYXRlIG92ZXIgYSBzZXQgb2Ygb3BlcmF0aW9ucyB3aGljaCB3aGVuIGFwcGxpZWQgdG8gdGhlIG9yaWdpbmFsIGBJdGVyYWJsZWAgd2lsbCBwcm9kdWNlIHRoZVxuICAgKiBuZXcgYEl0ZXJhYmxlYC5cbiAgICpcbiAgICogTk9URTogVGhlc2UgYXJlIG5vdCBuZWNlc3NhcmlseSB0aGUgYWN0dWFsIG9wZXJhdGlvbnMgd2hpY2ggd2VyZSBhcHBsaWVkIHRvIHRoZSBvcmlnaW5hbFxuICAgKiBgSXRlcmFibGVgLCByYXRoZXIgdGhlc2UgYXJlIGEgc2V0IG9mIGNvbXB1dGVkIG9wZXJhdGlvbnMgd2hpY2ggbWF5IG5vdCBiZSB0aGUgc2FtZSBhcyB0aGVcbiAgICogb25lcyBhcHBsaWVkLlxuICAgKlxuICAgKiBAcGFyYW0gcmVjb3JkIEEgY2hhbmdlIHdoaWNoIG5lZWRzIHRvIGJlIGFwcGxpZWRcbiAgICogQHBhcmFtIHByZXZpb3VzSW5kZXggVGhlIGBJdGVyYWJsZUNoYW5nZVJlY29yZCNwcmV2aW91c0luZGV4YCBvZiB0aGUgYHJlY29yZGAgcmVmZXJzIHRvIHRoZVxuICAgKiAgICAgICAgb3JpZ2luYWwgYEl0ZXJhYmxlYCBsb2NhdGlvbiwgd2hlcmUgYXMgYHByZXZpb3VzSW5kZXhgIHJlZmVycyB0byB0aGUgdHJhbnNpZW50IGxvY2F0aW9uXG4gICAqICAgICAgICBvZiB0aGUgaXRlbSwgYWZ0ZXIgYXBwbHlpbmcgdGhlIG9wZXJhdGlvbnMgdXAgdG8gdGhpcyBwb2ludC5cbiAgICogQHBhcmFtIGN1cnJlbnRJbmRleCBUaGUgYEl0ZXJhYmxlQ2hhbmdlUmVjb3JkI2N1cnJlbnRJbmRleGAgb2YgdGhlIGByZWNvcmRgIHJlZmVycyB0byB0aGVcbiAgICogICAgICAgIG9yaWdpbmFsIGBJdGVyYWJsZWAgbG9jYXRpb24sIHdoZXJlIGFzIGBjdXJyZW50SW5kZXhgIHJlZmVycyB0byB0aGUgdHJhbnNpZW50IGxvY2F0aW9uXG4gICAqICAgICAgICBvZiB0aGUgaXRlbSwgYWZ0ZXIgYXBwbHlpbmcgdGhlIG9wZXJhdGlvbnMgdXAgdG8gdGhpcyBwb2ludC5cbiAgICovXG4gIGZvckVhY2hPcGVyYXRpb24oXG4gICAgICBmbjpcbiAgICAgICAgICAocmVjb3JkOiBJdGVyYWJsZUNoYW5nZVJlY29yZDxWPiwgcHJldmlvdXNJbmRleDogbnVtYmVyfG51bGwsXG4gICAgICAgICAgIGN1cnJlbnRJbmRleDogbnVtYmVyfG51bGwpID0+IHZvaWQpOiB2b2lkO1xuXG4gIC8qKlxuICAgKiBJdGVyYXRlIG92ZXIgY2hhbmdlcyBpbiB0aGUgb3JkZXIgb2Ygb3JpZ2luYWwgYEl0ZXJhYmxlYCBzaG93aW5nIHdoZXJlIHRoZSBvcmlnaW5hbCBpdGVtc1xuICAgKiBoYXZlIG1vdmVkLlxuICAgKi9cbiAgZm9yRWFjaFByZXZpb3VzSXRlbShmbjogKHJlY29yZDogSXRlcmFibGVDaGFuZ2VSZWNvcmQ8Vj4pID0+IHZvaWQpOiB2b2lkO1xuXG4gIC8qKiBJdGVyYXRlIG92ZXIgYWxsIGFkZGVkIGl0ZW1zLiAqL1xuICBmb3JFYWNoQWRkZWRJdGVtKGZuOiAocmVjb3JkOiBJdGVyYWJsZUNoYW5nZVJlY29yZDxWPikgPT4gdm9pZCk6IHZvaWQ7XG5cbiAgLyoqIEl0ZXJhdGUgb3ZlciBhbGwgbW92ZWQgaXRlbXMuICovXG4gIGZvckVhY2hNb3ZlZEl0ZW0oZm46IChyZWNvcmQ6IEl0ZXJhYmxlQ2hhbmdlUmVjb3JkPFY+KSA9PiB2b2lkKTogdm9pZDtcblxuICAvKiogSXRlcmF0ZSBvdmVyIGFsbCByZW1vdmVkIGl0ZW1zLiAqL1xuICBmb3JFYWNoUmVtb3ZlZEl0ZW0oZm46IChyZWNvcmQ6IEl0ZXJhYmxlQ2hhbmdlUmVjb3JkPFY+KSA9PiB2b2lkKTogdm9pZDtcblxuICAvKiogSXRlcmF0ZSBvdmVyIGFsbCBpdGVtcyB3aGljaCBoYWQgdGhlaXIgaWRlbnRpdHkgKGFzIGNvbXB1dGVkIGJ5IHRoZSBgVHJhY2tCeUZ1bmN0aW9uYClcbiAgICogY2hhbmdlZC4gKi9cbiAgZm9yRWFjaElkZW50aXR5Q2hhbmdlKGZuOiAocmVjb3JkOiBJdGVyYWJsZUNoYW5nZVJlY29yZDxWPikgPT4gdm9pZCk6IHZvaWQ7XG59XG5cbi8qKlxuICogUmVjb3JkIHJlcHJlc2VudGluZyB0aGUgaXRlbSBjaGFuZ2UgaW5mb3JtYXRpb24uXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgaW50ZXJmYWNlIEl0ZXJhYmxlQ2hhbmdlUmVjb3JkPFY+IHtcbiAgLyoqIEN1cnJlbnQgaW5kZXggb2YgdGhlIGl0ZW0gaW4gYEl0ZXJhYmxlYCBvciBudWxsIGlmIHJlbW92ZWQuICovXG4gIHJlYWRvbmx5IGN1cnJlbnRJbmRleDogbnVtYmVyfG51bGw7XG5cbiAgLyoqIFByZXZpb3VzIGluZGV4IG9mIHRoZSBpdGVtIGluIGBJdGVyYWJsZWAgb3IgbnVsbCBpZiBhZGRlZC4gKi9cbiAgcmVhZG9ubHkgcHJldmlvdXNJbmRleDogbnVtYmVyfG51bGw7XG5cbiAgLyoqIFRoZSBpdGVtLiAqL1xuICByZWFkb25seSBpdGVtOiBWO1xuXG4gIC8qKiBUcmFjayBieSBpZGVudGl0eSBhcyBjb21wdXRlZCBieSB0aGUgYFRyYWNrQnlGdW5jdGlvbmAuICovXG4gIHJlYWRvbmx5IHRyYWNrQnlJZDogYW55O1xufVxuXG4vKipcbiAqIEBkZXByZWNhdGVkIHY0LjAuMCAtIFVzZSBJdGVyYWJsZUNoYW5nZVJlY29yZCBpbnN0ZWFkLlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgaW50ZXJmYWNlIENvbGxlY3Rpb25DaGFuZ2VSZWNvcmQ8Vj4gZXh0ZW5kcyBJdGVyYWJsZUNoYW5nZVJlY29yZDxWPiB7fVxuXG4vKipcbiAqIEFuIG9wdGlvbmFsIGZ1bmN0aW9uIHBhc3NlZCBpbnRvIHtAbGluayBOZ0Zvck9mfSB0aGF0IGRlZmluZXMgaG93IHRvIHRyYWNrXG4gKiBpdGVtcyBpbiBhbiBpdGVyYWJsZSAoZS5nLiBmYnkgaW5kZXggb3IgaWQpXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgaW50ZXJmYWNlIFRyYWNrQnlGdW5jdGlvbjxUPiB7IChpbmRleDogbnVtYmVyLCBpdGVtOiBUKTogYW55OyB9XG5cbi8qKlxuICogUHJvdmlkZXMgYSBmYWN0b3J5IGZvciB7QGxpbmsgSXRlcmFibGVEaWZmZXJ9LlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBJdGVyYWJsZURpZmZlckZhY3Rvcnkge1xuICBzdXBwb3J0cyhvYmplY3RzOiBhbnkpOiBib29sZWFuO1xuICBjcmVhdGU8Vj4odHJhY2tCeUZuPzogVHJhY2tCeUZ1bmN0aW9uPFY+KTogSXRlcmFibGVEaWZmZXI8Vj47XG59XG5cbi8qKlxuICogQSByZXBvc2l0b3J5IG9mIGRpZmZlcmVudCBpdGVyYWJsZSBkaWZmaW5nIHN0cmF0ZWdpZXMgdXNlZCBieSBOZ0ZvciwgTmdDbGFzcywgYW5kIG90aGVycy5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBjbGFzcyBJdGVyYWJsZURpZmZlcnMge1xuICAvKiogQG5vY29sbGFwc2UgKi9cbiAgc3RhdGljIG5nSW5qZWN0YWJsZURlZiA9IGRlZmluZUluamVjdGFibGUoe1xuICAgIHByb3ZpZGVkSW46ICdyb290JyxcbiAgICBmYWN0b3J5OiAoKSA9PiBuZXcgSXRlcmFibGVEaWZmZXJzKFtuZXcgRGVmYXVsdEl0ZXJhYmxlRGlmZmVyRmFjdG9yeSgpXSlcbiAgfSk7XG5cbiAgLyoqXG4gICAqIEBkZXByZWNhdGVkIHY0LjAuMCAtIFNob3VsZCBiZSBwcml2YXRlXG4gICAqL1xuICBmYWN0b3JpZXM6IEl0ZXJhYmxlRGlmZmVyRmFjdG9yeVtdO1xuICBjb25zdHJ1Y3RvcihmYWN0b3JpZXM6IEl0ZXJhYmxlRGlmZmVyRmFjdG9yeVtdKSB7IHRoaXMuZmFjdG9yaWVzID0gZmFjdG9yaWVzOyB9XG5cbiAgc3RhdGljIGNyZWF0ZShmYWN0b3JpZXM6IEl0ZXJhYmxlRGlmZmVyRmFjdG9yeVtdLCBwYXJlbnQ/OiBJdGVyYWJsZURpZmZlcnMpOiBJdGVyYWJsZURpZmZlcnMge1xuICAgIGlmIChwYXJlbnQgIT0gbnVsbCkge1xuICAgICAgY29uc3QgY29waWVkID0gcGFyZW50LmZhY3Rvcmllcy5zbGljZSgpO1xuICAgICAgZmFjdG9yaWVzID0gZmFjdG9yaWVzLmNvbmNhdChjb3BpZWQpO1xuICAgIH1cblxuICAgIHJldHVybiBuZXcgSXRlcmFibGVEaWZmZXJzKGZhY3Rvcmllcyk7XG4gIH1cblxuICAvKipcbiAgICogVGFrZXMgYW4gYXJyYXkgb2Yge0BsaW5rIEl0ZXJhYmxlRGlmZmVyRmFjdG9yeX0gYW5kIHJldHVybnMgYSBwcm92aWRlciB1c2VkIHRvIGV4dGVuZCB0aGVcbiAgICogaW5oZXJpdGVkIHtAbGluayBJdGVyYWJsZURpZmZlcnN9IGluc3RhbmNlIHdpdGggdGhlIHByb3ZpZGVkIGZhY3RvcmllcyBhbmQgcmV0dXJuIGEgbmV3XG4gICAqIHtAbGluayBJdGVyYWJsZURpZmZlcnN9IGluc3RhbmNlLlxuICAgKlxuICAgKiBAdXNhZ2VOb3Rlc1xuICAgKiAjIyMgRXhhbXBsZVxuICAgKlxuICAgKiBUaGUgZm9sbG93aW5nIGV4YW1wbGUgc2hvd3MgaG93IHRvIGV4dGVuZCBhbiBleGlzdGluZyBsaXN0IG9mIGZhY3RvcmllcyxcbiAgICogd2hpY2ggd2lsbCBvbmx5IGJlIGFwcGxpZWQgdG8gdGhlIGluamVjdG9yIGZvciB0aGlzIGNvbXBvbmVudCBhbmQgaXRzIGNoaWxkcmVuLlxuICAgKiBUaGlzIHN0ZXAgaXMgYWxsIHRoYXQncyByZXF1aXJlZCB0byBtYWtlIGEgbmV3IHtAbGluayBJdGVyYWJsZURpZmZlcn0gYXZhaWxhYmxlLlxuICAgKlxuICAgKiBgYGBcbiAgICogQENvbXBvbmVudCh7XG4gICAqICAgdmlld1Byb3ZpZGVyczogW1xuICAgKiAgICAgSXRlcmFibGVEaWZmZXJzLmV4dGVuZChbbmV3IEltbXV0YWJsZUxpc3REaWZmZXIoKV0pXG4gICAqICAgXVxuICAgKiB9KVxuICAgKiBgYGBcbiAgICovXG4gIHN0YXRpYyBleHRlbmQoZmFjdG9yaWVzOiBJdGVyYWJsZURpZmZlckZhY3RvcnlbXSk6IFN0YXRpY1Byb3ZpZGVyIHtcbiAgICByZXR1cm4ge1xuICAgICAgcHJvdmlkZTogSXRlcmFibGVEaWZmZXJzLFxuICAgICAgdXNlRmFjdG9yeTogKHBhcmVudDogSXRlcmFibGVEaWZmZXJzKSA9PiB7XG4gICAgICAgIGlmICghcGFyZW50KSB7XG4gICAgICAgICAgLy8gVHlwaWNhbGx5IHdvdWxkIG9jY3VyIHdoZW4gY2FsbGluZyBJdGVyYWJsZURpZmZlcnMuZXh0ZW5kIGluc2lkZSBvZiBkZXBlbmRlbmNpZXMgcGFzc2VkXG4gICAgICAgICAgLy8gdG9cbiAgICAgICAgICAvLyBib290c3RyYXAoKSwgd2hpY2ggd291bGQgb3ZlcnJpZGUgZGVmYXVsdCBwaXBlcyBpbnN0ZWFkIG9mIGV4dGVuZGluZyB0aGVtLlxuICAgICAgICAgIHRocm93IG5ldyBFcnJvcignQ2Fubm90IGV4dGVuZCBJdGVyYWJsZURpZmZlcnMgd2l0aG91dCBhIHBhcmVudCBpbmplY3RvcicpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBJdGVyYWJsZURpZmZlcnMuY3JlYXRlKGZhY3RvcmllcywgcGFyZW50KTtcbiAgICAgIH0sXG4gICAgICAvLyBEZXBlbmRlbmN5IHRlY2huaWNhbGx5IGlzbid0IG9wdGlvbmFsLCBidXQgd2UgY2FuIHByb3ZpZGUgYSBiZXR0ZXIgZXJyb3IgbWVzc2FnZSB0aGlzIHdheS5cbiAgICAgIGRlcHM6IFtbSXRlcmFibGVEaWZmZXJzLCBuZXcgU2tpcFNlbGYoKSwgbmV3IE9wdGlvbmFsKCldXVxuICAgIH07XG4gIH1cblxuICBmaW5kKGl0ZXJhYmxlOiBhbnkpOiBJdGVyYWJsZURpZmZlckZhY3Rvcnkge1xuICAgIGNvbnN0IGZhY3RvcnkgPSB0aGlzLmZhY3Rvcmllcy5maW5kKGYgPT4gZi5zdXBwb3J0cyhpdGVyYWJsZSkpO1xuICAgIGlmIChmYWN0b3J5ICE9IG51bGwpIHtcbiAgICAgIHJldHVybiBmYWN0b3J5O1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgYENhbm5vdCBmaW5kIGEgZGlmZmVyIHN1cHBvcnRpbmcgb2JqZWN0ICcke2l0ZXJhYmxlfScgb2YgdHlwZSAnJHtnZXRUeXBlTmFtZUZvckRlYnVnZ2luZyhpdGVyYWJsZSl9J2ApO1xuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0VHlwZU5hbWVGb3JEZWJ1Z2dpbmcodHlwZTogYW55KTogc3RyaW5nIHtcbiAgcmV0dXJuIHR5cGVbJ25hbWUnXSB8fCB0eXBlb2YgdHlwZTtcbn1cbiJdfQ==