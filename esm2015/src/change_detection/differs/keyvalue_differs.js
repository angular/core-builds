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
import { Optional, SkipSelf, ΔdefineInjectable } from '../../di';
import { DefaultKeyValueDifferFactory } from './default_keyvalue_differ';
/**
 * A differ that tracks changes made to an object over time.
 *
 * \@publicApi
 * @record
 * @template K, V
 */
export function KeyValueDiffer() { }
if (false) {
    /**
     * Compute a difference between the previous state and the new `object` state.
     *
     * @param {?} object containing the new value.
     * @return {?} an object describing the difference. The return value is only valid until the next
     * `diff()` invocation.
     */
    KeyValueDiffer.prototype.diff = function (object) { };
    /**
     * Compute a difference between the previous state and the new `object` state.
     *
     * @param {?} object containing the new value.
     * @return {?} an object describing the difference. The return value is only valid until the next
     * `diff()` invocation.
     */
    KeyValueDiffer.prototype.diff = function (object) { };
}
/**
 * An object describing the changes in the `Map` or `{[k:string]: string}` since last time
 * `KeyValueDiffer#diff()` was invoked.
 *
 * \@publicApi
 * @record
 * @template K, V
 */
export function KeyValueChanges() { }
if (false) {
    /**
     * Iterate over all changes. `KeyValueChangeRecord` will contain information about changes
     * to each item.
     * @param {?} fn
     * @return {?}
     */
    KeyValueChanges.prototype.forEachItem = function (fn) { };
    /**
     * Iterate over changes in the order of original Map showing where the original items
     * have moved.
     * @param {?} fn
     * @return {?}
     */
    KeyValueChanges.prototype.forEachPreviousItem = function (fn) { };
    /**
     * Iterate over all keys for which values have changed.
     * @param {?} fn
     * @return {?}
     */
    KeyValueChanges.prototype.forEachChangedItem = function (fn) { };
    /**
     * Iterate over all added items.
     * @param {?} fn
     * @return {?}
     */
    KeyValueChanges.prototype.forEachAddedItem = function (fn) { };
    /**
     * Iterate over all removed items.
     * @param {?} fn
     * @return {?}
     */
    KeyValueChanges.prototype.forEachRemovedItem = function (fn) { };
}
/**
 * Record representing the item change information.
 *
 * \@publicApi
 * @record
 * @template K, V
 */
export function KeyValueChangeRecord() { }
if (false) {
    /**
     * Current key in the Map.
     * @type {?}
     */
    KeyValueChangeRecord.prototype.key;
    /**
     * Current value for the key or `null` if removed.
     * @type {?}
     */
    KeyValueChangeRecord.prototype.currentValue;
    /**
     * Previous value for the key or `null` if added.
     * @type {?}
     */
    KeyValueChangeRecord.prototype.previousValue;
}
/**
 * Provides a factory for {\@link KeyValueDiffer}.
 *
 * \@publicApi
 * @record
 */
export function KeyValueDifferFactory() { }
if (false) {
    /**
     * Test to see if the differ knows how to diff this kind of object.
     * @param {?} objects
     * @return {?}
     */
    KeyValueDifferFactory.prototype.supports = function (objects) { };
    /**
     * Create a `KeyValueDiffer`.
     * @template K, V
     * @return {?}
     */
    KeyValueDifferFactory.prototype.create = function () { };
}
/**
 * A repository of different Map diffing strategies used by NgClass, NgStyle, and others.
 *
 * \@publicApi
 */
export class KeyValueDiffers {
    /**
     * @param {?} factories
     */
    constructor(factories) { this.factories = factories; }
    /**
     * @template S
     * @param {?} factories
     * @param {?=} parent
     * @return {?}
     */
    static create(factories, parent) {
        if (parent) {
            /** @type {?} */
            const copied = parent.factories.slice();
            factories = factories.concat(copied);
        }
        return new KeyValueDiffers(factories);
    }
    /**
     * Takes an array of {\@link KeyValueDifferFactory} and returns a provider used to extend the
     * inherited {\@link KeyValueDiffers} instance with the provided factories and return a new
     * {\@link KeyValueDiffers} instance.
     *
     * \@usageNotes
     * ### Example
     *
     * The following example shows how to extend an existing list of factories,
     * which will only be applied to the injector for this component and its children.
     * This step is all that's required to make a new {\@link KeyValueDiffer} available.
     *
     * ```
     * \@Component({
     *   viewProviders: [
     *     KeyValueDiffers.extend([new ImmutableMapDiffer()])
     *   ]
     * })
     * ```
     * @template S
     * @param {?} factories
     * @return {?}
     */
    static extend(factories) {
        return {
            provide: KeyValueDiffers,
            useFactory: (/**
             * @param {?} parent
             * @return {?}
             */
            (parent) => {
                if (!parent) {
                    // Typically would occur when calling KeyValueDiffers.extend inside of dependencies passed
                    // to bootstrap(), which would override default pipes instead of extending them.
                    throw new Error('Cannot extend KeyValueDiffers without a parent injector');
                }
                return KeyValueDiffers.create(factories, parent);
            }),
            // Dependency technically isn't optional, but we can provide a better error message this way.
            deps: [[KeyValueDiffers, new SkipSelf(), new Optional()]]
        };
    }
    /**
     * @param {?} kv
     * @return {?}
     */
    find(kv) {
        /** @type {?} */
        const factory = this.factories.find((/**
         * @param {?} f
         * @return {?}
         */
        f => f.supports(kv)));
        if (factory) {
            return factory;
        }
        throw new Error(`Cannot find a differ supporting object '${kv}'`);
    }
}
/** @nocollapse */
/** @nocollapse */ KeyValueDiffers.ngInjectableDef = ΔdefineInjectable({
    providedIn: 'root',
    factory: (/**
     * @nocollapse @return {?}
     */
    () => new KeyValueDiffers([new DefaultKeyValueDifferFactory()]))
});
if (false) {
    /**
     * @nocollapse
     * @type {?}
     */
    KeyValueDiffers.ngInjectableDef;
    /**
     * @deprecated v4.0.0 - Should be private.
     * @type {?}
     */
    KeyValueDiffers.prototype.factories;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoia2V5dmFsdWVfZGlmZmVycy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL2NoYW5nZV9kZXRlY3Rpb24vZGlmZmVycy9rZXl2YWx1ZV9kaWZmZXJzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBUUEsT0FBTyxFQUFDLFFBQVEsRUFBRSxRQUFRLEVBQWtCLGlCQUFpQixFQUFDLE1BQU0sVUFBVSxDQUFDO0FBQy9FLE9BQU8sRUFBQyw0QkFBNEIsRUFBQyxNQUFNLDJCQUEyQixDQUFDOzs7Ozs7OztBQVF2RSxvQ0FvQkM7Ozs7Ozs7OztJQVpDLHNEQUFvRDs7Ozs7Ozs7SUFTcEQsc0RBQWtFOzs7Ozs7Ozs7O0FBV3BFLHFDQTJCQzs7Ozs7Ozs7SUF0QkMsMERBQStEOzs7Ozs7O0lBTS9ELGtFQUF1RTs7Ozs7O0lBS3ZFLGlFQUFzRTs7Ozs7O0lBS3RFLCtEQUFvRTs7Ozs7O0lBS3BFLGlFQUFzRTs7Ozs7Ozs7O0FBUXhFLDBDQWVDOzs7Ozs7SUFYQyxtQ0FBZ0I7Ozs7O0lBS2hCLDRDQUE4Qjs7Ozs7SUFLOUIsNkNBQStCOzs7Ozs7OztBQVFqQywyQ0FVQzs7Ozs7OztJQU5DLGtFQUFnQzs7Ozs7O0lBS2hDLHlEQUFxQzs7Ozs7OztBQVF2QyxNQUFNLE9BQU8sZUFBZTs7OztJQVkxQixZQUFZLFNBQWtDLElBQUksSUFBSSxDQUFDLFNBQVMsR0FBRyxTQUFTLENBQUMsQ0FBQyxDQUFDOzs7Ozs7O0lBRS9FLE1BQU0sQ0FBQyxNQUFNLENBQUksU0FBa0MsRUFBRSxNQUF3QjtRQUMzRSxJQUFJLE1BQU0sRUFBRTs7a0JBQ0osTUFBTSxHQUFHLE1BQU0sQ0FBQyxTQUFTLENBQUMsS0FBSyxFQUFFO1lBQ3ZDLFNBQVMsR0FBRyxTQUFTLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1NBQ3RDO1FBQ0QsT0FBTyxJQUFJLGVBQWUsQ0FBQyxTQUFTLENBQUMsQ0FBQztJQUN4QyxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7SUFzQkQsTUFBTSxDQUFDLE1BQU0sQ0FBSSxTQUFrQztRQUNqRCxPQUFPO1lBQ0wsT0FBTyxFQUFFLGVBQWU7WUFDeEIsVUFBVTs7OztZQUFFLENBQUMsTUFBdUIsRUFBRSxFQUFFO2dCQUN0QyxJQUFJLENBQUMsTUFBTSxFQUFFO29CQUNYLDBGQUEwRjtvQkFDMUYsZ0ZBQWdGO29CQUNoRixNQUFNLElBQUksS0FBSyxDQUFDLHlEQUF5RCxDQUFDLENBQUM7aUJBQzVFO2dCQUNELE9BQU8sZUFBZSxDQUFDLE1BQU0sQ0FBQyxTQUFTLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFDbkQsQ0FBQyxDQUFBOztZQUVELElBQUksRUFBRSxDQUFDLENBQUMsZUFBZSxFQUFFLElBQUksUUFBUSxFQUFFLEVBQUUsSUFBSSxRQUFRLEVBQUUsQ0FBQyxDQUFDO1NBQzFELENBQUM7SUFDSixDQUFDOzs7OztJQUVELElBQUksQ0FBQyxFQUFPOztjQUNKLE9BQU8sR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUk7Ozs7UUFBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLEVBQUM7UUFDeEQsSUFBSSxPQUFPLEVBQUU7WUFDWCxPQUFPLE9BQU8sQ0FBQztTQUNoQjtRQUNELE1BQU0sSUFBSSxLQUFLLENBQUMsMkNBQTJDLEVBQUUsR0FBRyxDQUFDLENBQUM7SUFDcEUsQ0FBQzs7O0FBOURNLCtCQUFlLEdBQUcsaUJBQWlCLENBQUM7SUFDekMsVUFBVSxFQUFFLE1BQU07SUFDbEIsT0FBTzs7O0lBQUUsR0FBRyxFQUFFLENBQUMsSUFBSSxlQUFlLENBQUMsQ0FBQyxJQUFJLDRCQUE0QixFQUFFLENBQUMsQ0FBQyxDQUFBO0NBQ3pFLENBQUMsQ0FBQzs7Ozs7O0lBSEgsZ0NBR0c7Ozs7O0lBS0gsb0NBQW1DIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge09wdGlvbmFsLCBTa2lwU2VsZiwgU3RhdGljUHJvdmlkZXIsIM6UZGVmaW5lSW5qZWN0YWJsZX0gZnJvbSAnLi4vLi4vZGknO1xuaW1wb3J0IHtEZWZhdWx0S2V5VmFsdWVEaWZmZXJGYWN0b3J5fSBmcm9tICcuL2RlZmF1bHRfa2V5dmFsdWVfZGlmZmVyJztcblxuXG4vKipcbiAqIEEgZGlmZmVyIHRoYXQgdHJhY2tzIGNoYW5nZXMgbWFkZSB0byBhbiBvYmplY3Qgb3ZlciB0aW1lLlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBLZXlWYWx1ZURpZmZlcjxLLCBWPiB7XG4gIC8qKlxuICAgKiBDb21wdXRlIGEgZGlmZmVyZW5jZSBiZXR3ZWVuIHRoZSBwcmV2aW91cyBzdGF0ZSBhbmQgdGhlIG5ldyBgb2JqZWN0YCBzdGF0ZS5cbiAgICpcbiAgICogQHBhcmFtIG9iamVjdCBjb250YWluaW5nIHRoZSBuZXcgdmFsdWUuXG4gICAqIEByZXR1cm5zIGFuIG9iamVjdCBkZXNjcmliaW5nIHRoZSBkaWZmZXJlbmNlLiBUaGUgcmV0dXJuIHZhbHVlIGlzIG9ubHkgdmFsaWQgdW50aWwgdGhlIG5leHRcbiAgICogYGRpZmYoKWAgaW52b2NhdGlvbi5cbiAgICovXG4gIGRpZmYob2JqZWN0OiBNYXA8SywgVj4pOiBLZXlWYWx1ZUNoYW5nZXM8SywgVj58bnVsbDtcblxuICAvKipcbiAgICogQ29tcHV0ZSBhIGRpZmZlcmVuY2UgYmV0d2VlbiB0aGUgcHJldmlvdXMgc3RhdGUgYW5kIHRoZSBuZXcgYG9iamVjdGAgc3RhdGUuXG4gICAqXG4gICAqIEBwYXJhbSBvYmplY3QgY29udGFpbmluZyB0aGUgbmV3IHZhbHVlLlxuICAgKiBAcmV0dXJucyBhbiBvYmplY3QgZGVzY3JpYmluZyB0aGUgZGlmZmVyZW5jZS4gVGhlIHJldHVybiB2YWx1ZSBpcyBvbmx5IHZhbGlkIHVudGlsIHRoZSBuZXh0XG4gICAqIGBkaWZmKClgIGludm9jYXRpb24uXG4gICAqL1xuICBkaWZmKG9iamVjdDoge1trZXk6IHN0cmluZ106IFZ9KTogS2V5VmFsdWVDaGFuZ2VzPHN0cmluZywgVj58bnVsbDtcbiAgLy8gVE9ETyhUUzIuMSk6IGRpZmY8S1AgZXh0ZW5kcyBzdHJpbmc+KHRoaXM6IEtleVZhbHVlRGlmZmVyPEtQLCBWPiwgb2JqZWN0OiBSZWNvcmQ8S1AsIFY+KTpcbiAgLy8gS2V5VmFsdWVEaWZmZXI8S1AsIFY+O1xufVxuXG4vKipcbiAqIEFuIG9iamVjdCBkZXNjcmliaW5nIHRoZSBjaGFuZ2VzIGluIHRoZSBgTWFwYCBvciBge1trOnN0cmluZ106IHN0cmluZ31gIHNpbmNlIGxhc3QgdGltZVxuICogYEtleVZhbHVlRGlmZmVyI2RpZmYoKWAgd2FzIGludm9rZWQuXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgaW50ZXJmYWNlIEtleVZhbHVlQ2hhbmdlczxLLCBWPiB7XG4gIC8qKlxuICAgKiBJdGVyYXRlIG92ZXIgYWxsIGNoYW5nZXMuIGBLZXlWYWx1ZUNoYW5nZVJlY29yZGAgd2lsbCBjb250YWluIGluZm9ybWF0aW9uIGFib3V0IGNoYW5nZXNcbiAgICogdG8gZWFjaCBpdGVtLlxuICAgKi9cbiAgZm9yRWFjaEl0ZW0oZm46IChyOiBLZXlWYWx1ZUNoYW5nZVJlY29yZDxLLCBWPikgPT4gdm9pZCk6IHZvaWQ7XG5cbiAgLyoqXG4gICAqIEl0ZXJhdGUgb3ZlciBjaGFuZ2VzIGluIHRoZSBvcmRlciBvZiBvcmlnaW5hbCBNYXAgc2hvd2luZyB3aGVyZSB0aGUgb3JpZ2luYWwgaXRlbXNcbiAgICogaGF2ZSBtb3ZlZC5cbiAgICovXG4gIGZvckVhY2hQcmV2aW91c0l0ZW0oZm46IChyOiBLZXlWYWx1ZUNoYW5nZVJlY29yZDxLLCBWPikgPT4gdm9pZCk6IHZvaWQ7XG5cbiAgLyoqXG4gICAqIEl0ZXJhdGUgb3ZlciBhbGwga2V5cyBmb3Igd2hpY2ggdmFsdWVzIGhhdmUgY2hhbmdlZC5cbiAgICovXG4gIGZvckVhY2hDaGFuZ2VkSXRlbShmbjogKHI6IEtleVZhbHVlQ2hhbmdlUmVjb3JkPEssIFY+KSA9PiB2b2lkKTogdm9pZDtcblxuICAvKipcbiAgICogSXRlcmF0ZSBvdmVyIGFsbCBhZGRlZCBpdGVtcy5cbiAgICovXG4gIGZvckVhY2hBZGRlZEl0ZW0oZm46IChyOiBLZXlWYWx1ZUNoYW5nZVJlY29yZDxLLCBWPikgPT4gdm9pZCk6IHZvaWQ7XG5cbiAgLyoqXG4gICAqIEl0ZXJhdGUgb3ZlciBhbGwgcmVtb3ZlZCBpdGVtcy5cbiAgICovXG4gIGZvckVhY2hSZW1vdmVkSXRlbShmbjogKHI6IEtleVZhbHVlQ2hhbmdlUmVjb3JkPEssIFY+KSA9PiB2b2lkKTogdm9pZDtcbn1cblxuLyoqXG4gKiBSZWNvcmQgcmVwcmVzZW50aW5nIHRoZSBpdGVtIGNoYW5nZSBpbmZvcm1hdGlvbi5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgS2V5VmFsdWVDaGFuZ2VSZWNvcmQ8SywgVj4ge1xuICAvKipcbiAgICogQ3VycmVudCBrZXkgaW4gdGhlIE1hcC5cbiAgICovXG4gIHJlYWRvbmx5IGtleTogSztcblxuICAvKipcbiAgICogQ3VycmVudCB2YWx1ZSBmb3IgdGhlIGtleSBvciBgbnVsbGAgaWYgcmVtb3ZlZC5cbiAgICovXG4gIHJlYWRvbmx5IGN1cnJlbnRWYWx1ZTogVnxudWxsO1xuXG4gIC8qKlxuICAgKiBQcmV2aW91cyB2YWx1ZSBmb3IgdGhlIGtleSBvciBgbnVsbGAgaWYgYWRkZWQuXG4gICAqL1xuICByZWFkb25seSBwcmV2aW91c1ZhbHVlOiBWfG51bGw7XG59XG5cbi8qKlxuICogUHJvdmlkZXMgYSBmYWN0b3J5IGZvciB7QGxpbmsgS2V5VmFsdWVEaWZmZXJ9LlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBLZXlWYWx1ZURpZmZlckZhY3Rvcnkge1xuICAvKipcbiAgICogVGVzdCB0byBzZWUgaWYgdGhlIGRpZmZlciBrbm93cyBob3cgdG8gZGlmZiB0aGlzIGtpbmQgb2Ygb2JqZWN0LlxuICAgKi9cbiAgc3VwcG9ydHMob2JqZWN0czogYW55KTogYm9vbGVhbjtcblxuICAvKipcbiAgICogQ3JlYXRlIGEgYEtleVZhbHVlRGlmZmVyYC5cbiAgICovXG4gIGNyZWF0ZTxLLCBWPigpOiBLZXlWYWx1ZURpZmZlcjxLLCBWPjtcbn1cblxuLyoqXG4gKiBBIHJlcG9zaXRvcnkgb2YgZGlmZmVyZW50IE1hcCBkaWZmaW5nIHN0cmF0ZWdpZXMgdXNlZCBieSBOZ0NsYXNzLCBOZ1N0eWxlLCBhbmQgb3RoZXJzLlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGNsYXNzIEtleVZhbHVlRGlmZmVycyB7XG4gIC8qKiBAbm9jb2xsYXBzZSAqL1xuICBzdGF0aWMgbmdJbmplY3RhYmxlRGVmID0gzpRkZWZpbmVJbmplY3RhYmxlKHtcbiAgICBwcm92aWRlZEluOiAncm9vdCcsXG4gICAgZmFjdG9yeTogKCkgPT4gbmV3IEtleVZhbHVlRGlmZmVycyhbbmV3IERlZmF1bHRLZXlWYWx1ZURpZmZlckZhY3RvcnkoKV0pXG4gIH0pO1xuXG4gIC8qKlxuICAgKiBAZGVwcmVjYXRlZCB2NC4wLjAgLSBTaG91bGQgYmUgcHJpdmF0ZS5cbiAgICovXG4gIGZhY3RvcmllczogS2V5VmFsdWVEaWZmZXJGYWN0b3J5W107XG5cbiAgY29uc3RydWN0b3IoZmFjdG9yaWVzOiBLZXlWYWx1ZURpZmZlckZhY3RvcnlbXSkgeyB0aGlzLmZhY3RvcmllcyA9IGZhY3RvcmllczsgfVxuXG4gIHN0YXRpYyBjcmVhdGU8Uz4oZmFjdG9yaWVzOiBLZXlWYWx1ZURpZmZlckZhY3RvcnlbXSwgcGFyZW50PzogS2V5VmFsdWVEaWZmZXJzKTogS2V5VmFsdWVEaWZmZXJzIHtcbiAgICBpZiAocGFyZW50KSB7XG4gICAgICBjb25zdCBjb3BpZWQgPSBwYXJlbnQuZmFjdG9yaWVzLnNsaWNlKCk7XG4gICAgICBmYWN0b3JpZXMgPSBmYWN0b3JpZXMuY29uY2F0KGNvcGllZCk7XG4gICAgfVxuICAgIHJldHVybiBuZXcgS2V5VmFsdWVEaWZmZXJzKGZhY3Rvcmllcyk7XG4gIH1cblxuICAvKipcbiAgICogVGFrZXMgYW4gYXJyYXkgb2Yge0BsaW5rIEtleVZhbHVlRGlmZmVyRmFjdG9yeX0gYW5kIHJldHVybnMgYSBwcm92aWRlciB1c2VkIHRvIGV4dGVuZCB0aGVcbiAgICogaW5oZXJpdGVkIHtAbGluayBLZXlWYWx1ZURpZmZlcnN9IGluc3RhbmNlIHdpdGggdGhlIHByb3ZpZGVkIGZhY3RvcmllcyBhbmQgcmV0dXJuIGEgbmV3XG4gICAqIHtAbGluayBLZXlWYWx1ZURpZmZlcnN9IGluc3RhbmNlLlxuICAgKlxuICAgKiBAdXNhZ2VOb3Rlc1xuICAgKiAjIyMgRXhhbXBsZVxuICAgKlxuICAgKiBUaGUgZm9sbG93aW5nIGV4YW1wbGUgc2hvd3MgaG93IHRvIGV4dGVuZCBhbiBleGlzdGluZyBsaXN0IG9mIGZhY3RvcmllcyxcbiAgICogd2hpY2ggd2lsbCBvbmx5IGJlIGFwcGxpZWQgdG8gdGhlIGluamVjdG9yIGZvciB0aGlzIGNvbXBvbmVudCBhbmQgaXRzIGNoaWxkcmVuLlxuICAgKiBUaGlzIHN0ZXAgaXMgYWxsIHRoYXQncyByZXF1aXJlZCB0byBtYWtlIGEgbmV3IHtAbGluayBLZXlWYWx1ZURpZmZlcn0gYXZhaWxhYmxlLlxuICAgKlxuICAgKiBgYGBcbiAgICogQENvbXBvbmVudCh7XG4gICAqICAgdmlld1Byb3ZpZGVyczogW1xuICAgKiAgICAgS2V5VmFsdWVEaWZmZXJzLmV4dGVuZChbbmV3IEltbXV0YWJsZU1hcERpZmZlcigpXSlcbiAgICogICBdXG4gICAqIH0pXG4gICAqIGBgYFxuICAgKi9cbiAgc3RhdGljIGV4dGVuZDxTPihmYWN0b3JpZXM6IEtleVZhbHVlRGlmZmVyRmFjdG9yeVtdKTogU3RhdGljUHJvdmlkZXIge1xuICAgIHJldHVybiB7XG4gICAgICBwcm92aWRlOiBLZXlWYWx1ZURpZmZlcnMsXG4gICAgICB1c2VGYWN0b3J5OiAocGFyZW50OiBLZXlWYWx1ZURpZmZlcnMpID0+IHtcbiAgICAgICAgaWYgKCFwYXJlbnQpIHtcbiAgICAgICAgICAvLyBUeXBpY2FsbHkgd291bGQgb2NjdXIgd2hlbiBjYWxsaW5nIEtleVZhbHVlRGlmZmVycy5leHRlbmQgaW5zaWRlIG9mIGRlcGVuZGVuY2llcyBwYXNzZWRcbiAgICAgICAgICAvLyB0byBib290c3RyYXAoKSwgd2hpY2ggd291bGQgb3ZlcnJpZGUgZGVmYXVsdCBwaXBlcyBpbnN0ZWFkIG9mIGV4dGVuZGluZyB0aGVtLlxuICAgICAgICAgIHRocm93IG5ldyBFcnJvcignQ2Fubm90IGV4dGVuZCBLZXlWYWx1ZURpZmZlcnMgd2l0aG91dCBhIHBhcmVudCBpbmplY3RvcicpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBLZXlWYWx1ZURpZmZlcnMuY3JlYXRlKGZhY3RvcmllcywgcGFyZW50KTtcbiAgICAgIH0sXG4gICAgICAvLyBEZXBlbmRlbmN5IHRlY2huaWNhbGx5IGlzbid0IG9wdGlvbmFsLCBidXQgd2UgY2FuIHByb3ZpZGUgYSBiZXR0ZXIgZXJyb3IgbWVzc2FnZSB0aGlzIHdheS5cbiAgICAgIGRlcHM6IFtbS2V5VmFsdWVEaWZmZXJzLCBuZXcgU2tpcFNlbGYoKSwgbmV3IE9wdGlvbmFsKCldXVxuICAgIH07XG4gIH1cblxuICBmaW5kKGt2OiBhbnkpOiBLZXlWYWx1ZURpZmZlckZhY3Rvcnkge1xuICAgIGNvbnN0IGZhY3RvcnkgPSB0aGlzLmZhY3Rvcmllcy5maW5kKGYgPT4gZi5zdXBwb3J0cyhrdikpO1xuICAgIGlmIChmYWN0b3J5KSB7XG4gICAgICByZXR1cm4gZmFjdG9yeTtcbiAgICB9XG4gICAgdGhyb3cgbmV3IEVycm9yKGBDYW5ub3QgZmluZCBhIGRpZmZlciBzdXBwb3J0aW5nIG9iamVjdCAnJHtrdn0nYCk7XG4gIH1cbn1cbiJdfQ==