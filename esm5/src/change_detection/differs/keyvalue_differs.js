/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Optional, SkipSelf } from '../../di';
/**
 * A repository of different Map diffing strategies used by NgClass, NgStyle, and others.
 *
 */
var /**
 * A repository of different Map diffing strategies used by NgClass, NgStyle, and others.
 *
 */
KeyValueDiffers = /** @class */ (function () {
    function KeyValueDiffers(factories) {
        this.factories = factories;
    }
    KeyValueDiffers.create = function (factories, parent) {
        if (parent) {
            var copied = parent.factories.slice();
            factories = factories.concat(copied);
        }
        return new KeyValueDiffers(factories);
    };
    /**
     * Takes an array of {@link KeyValueDifferFactory} and returns a provider used to extend the
     * inherited {@link KeyValueDiffers} instance with the provided factories and return a new
     * {@link KeyValueDiffers} instance.
     *
     * The following example shows how to extend an existing list of factories,
     * which will only be applied to the injector for this component and its children.
     * This step is all that's required to make a new {@link KeyValueDiffer} available.
     *
     * ### Example
     *
     * ```
     * @Component({
     *   viewProviders: [
     *     KeyValueDiffers.extend([new ImmutableMapDiffer()])
     *   ]
     * })
     * ```
     */
    /**
       * Takes an array of {@link KeyValueDifferFactory} and returns a provider used to extend the
       * inherited {@link KeyValueDiffers} instance with the provided factories and return a new
       * {@link KeyValueDiffers} instance.
       *
       * The following example shows how to extend an existing list of factories,
       * which will only be applied to the injector for this component and its children.
       * This step is all that's required to make a new {@link KeyValueDiffer} available.
       *
       * ### Example
       *
       * ```
       * @Component({
       *   viewProviders: [
       *     KeyValueDiffers.extend([new ImmutableMapDiffer()])
       *   ]
       * })
       * ```
       */
    KeyValueDiffers.extend = /**
       * Takes an array of {@link KeyValueDifferFactory} and returns a provider used to extend the
       * inherited {@link KeyValueDiffers} instance with the provided factories and return a new
       * {@link KeyValueDiffers} instance.
       *
       * The following example shows how to extend an existing list of factories,
       * which will only be applied to the injector for this component and its children.
       * This step is all that's required to make a new {@link KeyValueDiffer} available.
       *
       * ### Example
       *
       * ```
       * @Component({
       *   viewProviders: [
       *     KeyValueDiffers.extend([new ImmutableMapDiffer()])
       *   ]
       * })
       * ```
       */
    function (factories) {
        return {
            provide: KeyValueDiffers,
            useFactory: function (parent) {
                if (!parent) {
                    // Typically would occur when calling KeyValueDiffers.extend inside of dependencies passed
                    // to bootstrap(), which would override default pipes instead of extending them.
                    throw new Error('Cannot extend KeyValueDiffers without a parent injector');
                }
                return KeyValueDiffers.create(factories, parent);
            },
            // Dependency technically isn't optional, but we can provide a better error message this way.
            deps: [[KeyValueDiffers, new SkipSelf(), new Optional()]]
        };
    };
    KeyValueDiffers.prototype.find = function (kv) {
        var factory = this.factories.find(function (f) { return f.supports(kv); });
        if (factory) {
            return factory;
        }
        throw new Error("Cannot find a differ supporting object '" + kv + "'");
    };
    return KeyValueDiffers;
}());
/**
 * A repository of different Map diffing strategies used by NgClass, NgStyle, and others.
 *
 */
export { KeyValueDiffers };

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoia2V5dmFsdWVfZGlmZmVycy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL2NoYW5nZV9kZXRlY3Rpb24vZGlmZmVycy9rZXl2YWx1ZV9kaWZmZXJzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7QUFRQSxPQUFPLEVBQUMsUUFBUSxFQUFFLFFBQVEsRUFBaUIsTUFBTSxVQUFVLENBQUM7Ozs7O0FBNEc1RDs7OztBQUFBO0lBTUUseUJBQVksU0FBa0M7UUFBSSxJQUFJLENBQUMsU0FBUyxHQUFHLFNBQVMsQ0FBQztLQUFFO0lBRXhFLHNCQUFNLEdBQWIsVUFBaUIsU0FBa0MsRUFBRSxNQUF3QjtRQUMzRSxJQUFJLE1BQU0sRUFBRTtZQUNWLElBQU0sTUFBTSxHQUFHLE1BQU0sQ0FBQyxTQUFTLENBQUMsS0FBSyxFQUFFLENBQUM7WUFDeEMsU0FBUyxHQUFHLFNBQVMsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUM7U0FDdEM7UUFDRCxPQUFPLElBQUksZUFBZSxDQUFDLFNBQVMsQ0FBQyxDQUFDO0tBQ3ZDO0lBRUQ7Ozs7Ozs7Ozs7Ozs7Ozs7OztPQWtCRzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7SUFDSSxzQkFBTTs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQUFiLFVBQWlCLFNBQWtDO1FBQ2pELE9BQU87WUFDTCxPQUFPLEVBQUUsZUFBZTtZQUN4QixVQUFVLEVBQUUsVUFBQyxNQUF1QjtnQkFDbEMsSUFBSSxDQUFDLE1BQU0sRUFBRTs7O29CQUdYLE1BQU0sSUFBSSxLQUFLLENBQUMseURBQXlELENBQUMsQ0FBQztpQkFDNUU7Z0JBQ0QsT0FBTyxlQUFlLENBQUMsTUFBTSxDQUFDLFNBQVMsRUFBRSxNQUFNLENBQUMsQ0FBQzthQUNsRDs7WUFFRCxJQUFJLEVBQUUsQ0FBQyxDQUFDLGVBQWUsRUFBRSxJQUFJLFFBQVEsRUFBRSxFQUFFLElBQUksUUFBUSxFQUFFLENBQUMsQ0FBQztTQUMxRCxDQUFDO0tBQ0g7SUFFRCw4QkFBSSxHQUFKLFVBQUssRUFBTztRQUNWLElBQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLFVBQUEsQ0FBQyxJQUFJLE9BQUEsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsRUFBZCxDQUFjLENBQUMsQ0FBQztRQUN6RCxJQUFJLE9BQU8sRUFBRTtZQUNYLE9BQU8sT0FBTyxDQUFDO1NBQ2hCO1FBQ0QsTUFBTSxJQUFJLEtBQUssQ0FBQyw2Q0FBMkMsRUFBRSxNQUFHLENBQUMsQ0FBQztLQUNuRTswQkE3S0g7SUE4S0MsQ0FBQTs7Ozs7QUExREQsMkJBMERDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge09wdGlvbmFsLCBTa2lwU2VsZiwgU3RhdGljUHJvdmlkZXJ9IGZyb20gJy4uLy4uL2RpJztcblxuXG4vKipcbiAqIEEgZGlmZmVyIHRoYXQgdHJhY2tzIGNoYW5nZXMgbWFkZSB0byBhbiBvYmplY3Qgb3ZlciB0aW1lLlxuICpcbiAqXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgS2V5VmFsdWVEaWZmZXI8SywgVj4ge1xuICAvKipcbiAgICogQ29tcHV0ZSBhIGRpZmZlcmVuY2UgYmV0d2VlbiB0aGUgcHJldmlvdXMgc3RhdGUgYW5kIHRoZSBuZXcgYG9iamVjdGAgc3RhdGUuXG4gICAqXG4gICAqIEBwYXJhbSBvYmplY3QgY29udGFpbmluZyB0aGUgbmV3IHZhbHVlLlxuICAgKiBAcmV0dXJucyBhbiBvYmplY3QgZGVzY3JpYmluZyB0aGUgZGlmZmVyZW5jZS4gVGhlIHJldHVybiB2YWx1ZSBpcyBvbmx5IHZhbGlkIHVudGlsIHRoZSBuZXh0XG4gICAqIGBkaWZmKClgIGludm9jYXRpb24uXG4gICAqL1xuICBkaWZmKG9iamVjdDogTWFwPEssIFY+KTogS2V5VmFsdWVDaGFuZ2VzPEssIFY+O1xuXG4gIC8qKlxuICAgKiBDb21wdXRlIGEgZGlmZmVyZW5jZSBiZXR3ZWVuIHRoZSBwcmV2aW91cyBzdGF0ZSBhbmQgdGhlIG5ldyBgb2JqZWN0YCBzdGF0ZS5cbiAgICpcbiAgICogQHBhcmFtIG9iamVjdCBjb250YWluaW5nIHRoZSBuZXcgdmFsdWUuXG4gICAqIEByZXR1cm5zIGFuIG9iamVjdCBkZXNjcmliaW5nIHRoZSBkaWZmZXJlbmNlLiBUaGUgcmV0dXJuIHZhbHVlIGlzIG9ubHkgdmFsaWQgdW50aWwgdGhlIG5leHRcbiAgICogYGRpZmYoKWAgaW52b2NhdGlvbi5cbiAgICovXG4gIGRpZmYob2JqZWN0OiB7W2tleTogc3RyaW5nXTogVn0pOiBLZXlWYWx1ZUNoYW5nZXM8c3RyaW5nLCBWPjtcbiAgLy8gVE9ETyhUUzIuMSk6IGRpZmY8S1AgZXh0ZW5kcyBzdHJpbmc+KHRoaXM6IEtleVZhbHVlRGlmZmVyPEtQLCBWPiwgb2JqZWN0OiBSZWNvcmQ8S1AsIFY+KTpcbiAgLy8gS2V5VmFsdWVEaWZmZXI8S1AsIFY+O1xufVxuXG4vKipcbiAqIEFuIG9iamVjdCBkZXNjcmliaW5nIHRoZSBjaGFuZ2VzIGluIHRoZSBgTWFwYCBvciBge1trOnN0cmluZ106IHN0cmluZ31gIHNpbmNlIGxhc3QgdGltZVxuICogYEtleVZhbHVlRGlmZmVyI2RpZmYoKWAgd2FzIGludm9rZWQuXG4gKlxuICpcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBLZXlWYWx1ZUNoYW5nZXM8SywgVj4ge1xuICAvKipcbiAgICogSXRlcmF0ZSBvdmVyIGFsbCBjaGFuZ2VzLiBgS2V5VmFsdWVDaGFuZ2VSZWNvcmRgIHdpbGwgY29udGFpbiBpbmZvcm1hdGlvbiBhYm91dCBjaGFuZ2VzXG4gICAqIHRvIGVhY2ggaXRlbS5cbiAgICovXG4gIGZvckVhY2hJdGVtKGZuOiAocjogS2V5VmFsdWVDaGFuZ2VSZWNvcmQ8SywgVj4pID0+IHZvaWQpOiB2b2lkO1xuXG4gIC8qKlxuICAgKiBJdGVyYXRlIG92ZXIgY2hhbmdlcyBpbiB0aGUgb3JkZXIgb2Ygb3JpZ2luYWwgTWFwIHNob3dpbmcgd2hlcmUgdGhlIG9yaWdpbmFsIGl0ZW1zXG4gICAqIGhhdmUgbW92ZWQuXG4gICAqL1xuICBmb3JFYWNoUHJldmlvdXNJdGVtKGZuOiAocjogS2V5VmFsdWVDaGFuZ2VSZWNvcmQ8SywgVj4pID0+IHZvaWQpOiB2b2lkO1xuXG4gIC8qKlxuICAgKiBJdGVyYXRlIG92ZXIgYWxsIGtleXMgZm9yIHdoaWNoIHZhbHVlcyBoYXZlIGNoYW5nZWQuXG4gICAqL1xuICBmb3JFYWNoQ2hhbmdlZEl0ZW0oZm46IChyOiBLZXlWYWx1ZUNoYW5nZVJlY29yZDxLLCBWPikgPT4gdm9pZCk6IHZvaWQ7XG5cbiAgLyoqXG4gICAqIEl0ZXJhdGUgb3ZlciBhbGwgYWRkZWQgaXRlbXMuXG4gICAqL1xuICBmb3JFYWNoQWRkZWRJdGVtKGZuOiAocjogS2V5VmFsdWVDaGFuZ2VSZWNvcmQ8SywgVj4pID0+IHZvaWQpOiB2b2lkO1xuXG4gIC8qKlxuICAgKiBJdGVyYXRlIG92ZXIgYWxsIHJlbW92ZWQgaXRlbXMuXG4gICAqL1xuICBmb3JFYWNoUmVtb3ZlZEl0ZW0oZm46IChyOiBLZXlWYWx1ZUNoYW5nZVJlY29yZDxLLCBWPikgPT4gdm9pZCk6IHZvaWQ7XG59XG5cbi8qKlxuICogUmVjb3JkIHJlcHJlc2VudGluZyB0aGUgaXRlbSBjaGFuZ2UgaW5mb3JtYXRpb24uXG4gKlxuICpcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBLZXlWYWx1ZUNoYW5nZVJlY29yZDxLLCBWPiB7XG4gIC8qKlxuICAgKiBDdXJyZW50IGtleSBpbiB0aGUgTWFwLlxuICAgKi9cbiAgcmVhZG9ubHkga2V5OiBLO1xuXG4gIC8qKlxuICAgKiBDdXJyZW50IHZhbHVlIGZvciB0aGUga2V5IG9yIGBudWxsYCBpZiByZW1vdmVkLlxuICAgKi9cbiAgcmVhZG9ubHkgY3VycmVudFZhbHVlOiBWfG51bGw7XG5cbiAgLyoqXG4gICAqIFByZXZpb3VzIHZhbHVlIGZvciB0aGUga2V5IG9yIGBudWxsYCBpZiBhZGRlZC5cbiAgICovXG4gIHJlYWRvbmx5IHByZXZpb3VzVmFsdWU6IFZ8bnVsbDtcbn1cblxuLyoqXG4gKiBQcm92aWRlcyBhIGZhY3RvcnkgZm9yIHtAbGluayBLZXlWYWx1ZURpZmZlcn0uXG4gKlxuICpcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBLZXlWYWx1ZURpZmZlckZhY3Rvcnkge1xuICAvKipcbiAgICogVGVzdCB0byBzZWUgaWYgdGhlIGRpZmZlciBrbm93cyBob3cgdG8gZGlmZiB0aGlzIGtpbmQgb2Ygb2JqZWN0LlxuICAgKi9cbiAgc3VwcG9ydHMob2JqZWN0czogYW55KTogYm9vbGVhbjtcblxuICAvKipcbiAgICogQ3JlYXRlIGEgYEtleVZhbHVlRGlmZmVyYC5cbiAgICovXG4gIGNyZWF0ZTxLLCBWPigpOiBLZXlWYWx1ZURpZmZlcjxLLCBWPjtcbn1cblxuLyoqXG4gKiBBIHJlcG9zaXRvcnkgb2YgZGlmZmVyZW50IE1hcCBkaWZmaW5nIHN0cmF0ZWdpZXMgdXNlZCBieSBOZ0NsYXNzLCBOZ1N0eWxlLCBhbmQgb3RoZXJzLlxuICpcbiAqL1xuZXhwb3J0IGNsYXNzIEtleVZhbHVlRGlmZmVycyB7XG4gIC8qKlxuICAgKiBAZGVwcmVjYXRlZCB2NC4wLjAgLSBTaG91bGQgYmUgcHJpdmF0ZS5cbiAgICovXG4gIGZhY3RvcmllczogS2V5VmFsdWVEaWZmZXJGYWN0b3J5W107XG5cbiAgY29uc3RydWN0b3IoZmFjdG9yaWVzOiBLZXlWYWx1ZURpZmZlckZhY3RvcnlbXSkgeyB0aGlzLmZhY3RvcmllcyA9IGZhY3RvcmllczsgfVxuXG4gIHN0YXRpYyBjcmVhdGU8Uz4oZmFjdG9yaWVzOiBLZXlWYWx1ZURpZmZlckZhY3RvcnlbXSwgcGFyZW50PzogS2V5VmFsdWVEaWZmZXJzKTogS2V5VmFsdWVEaWZmZXJzIHtcbiAgICBpZiAocGFyZW50KSB7XG4gICAgICBjb25zdCBjb3BpZWQgPSBwYXJlbnQuZmFjdG9yaWVzLnNsaWNlKCk7XG4gICAgICBmYWN0b3JpZXMgPSBmYWN0b3JpZXMuY29uY2F0KGNvcGllZCk7XG4gICAgfVxuICAgIHJldHVybiBuZXcgS2V5VmFsdWVEaWZmZXJzKGZhY3Rvcmllcyk7XG4gIH1cblxuICAvKipcbiAgICogVGFrZXMgYW4gYXJyYXkgb2Yge0BsaW5rIEtleVZhbHVlRGlmZmVyRmFjdG9yeX0gYW5kIHJldHVybnMgYSBwcm92aWRlciB1c2VkIHRvIGV4dGVuZCB0aGVcbiAgICogaW5oZXJpdGVkIHtAbGluayBLZXlWYWx1ZURpZmZlcnN9IGluc3RhbmNlIHdpdGggdGhlIHByb3ZpZGVkIGZhY3RvcmllcyBhbmQgcmV0dXJuIGEgbmV3XG4gICAqIHtAbGluayBLZXlWYWx1ZURpZmZlcnN9IGluc3RhbmNlLlxuICAgKlxuICAgKiBUaGUgZm9sbG93aW5nIGV4YW1wbGUgc2hvd3MgaG93IHRvIGV4dGVuZCBhbiBleGlzdGluZyBsaXN0IG9mIGZhY3RvcmllcyxcbiAgICogd2hpY2ggd2lsbCBvbmx5IGJlIGFwcGxpZWQgdG8gdGhlIGluamVjdG9yIGZvciB0aGlzIGNvbXBvbmVudCBhbmQgaXRzIGNoaWxkcmVuLlxuICAgKiBUaGlzIHN0ZXAgaXMgYWxsIHRoYXQncyByZXF1aXJlZCB0byBtYWtlIGEgbmV3IHtAbGluayBLZXlWYWx1ZURpZmZlcn0gYXZhaWxhYmxlLlxuICAgKlxuICAgKiAjIyMgRXhhbXBsZVxuICAgKlxuICAgKiBgYGBcbiAgICogQENvbXBvbmVudCh7XG4gICAqICAgdmlld1Byb3ZpZGVyczogW1xuICAgKiAgICAgS2V5VmFsdWVEaWZmZXJzLmV4dGVuZChbbmV3IEltbXV0YWJsZU1hcERpZmZlcigpXSlcbiAgICogICBdXG4gICAqIH0pXG4gICAqIGBgYFxuICAgKi9cbiAgc3RhdGljIGV4dGVuZDxTPihmYWN0b3JpZXM6IEtleVZhbHVlRGlmZmVyRmFjdG9yeVtdKTogU3RhdGljUHJvdmlkZXIge1xuICAgIHJldHVybiB7XG4gICAgICBwcm92aWRlOiBLZXlWYWx1ZURpZmZlcnMsXG4gICAgICB1c2VGYWN0b3J5OiAocGFyZW50OiBLZXlWYWx1ZURpZmZlcnMpID0+IHtcbiAgICAgICAgaWYgKCFwYXJlbnQpIHtcbiAgICAgICAgICAvLyBUeXBpY2FsbHkgd291bGQgb2NjdXIgd2hlbiBjYWxsaW5nIEtleVZhbHVlRGlmZmVycy5leHRlbmQgaW5zaWRlIG9mIGRlcGVuZGVuY2llcyBwYXNzZWRcbiAgICAgICAgICAvLyB0byBib290c3RyYXAoKSwgd2hpY2ggd291bGQgb3ZlcnJpZGUgZGVmYXVsdCBwaXBlcyBpbnN0ZWFkIG9mIGV4dGVuZGluZyB0aGVtLlxuICAgICAgICAgIHRocm93IG5ldyBFcnJvcignQ2Fubm90IGV4dGVuZCBLZXlWYWx1ZURpZmZlcnMgd2l0aG91dCBhIHBhcmVudCBpbmplY3RvcicpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBLZXlWYWx1ZURpZmZlcnMuY3JlYXRlKGZhY3RvcmllcywgcGFyZW50KTtcbiAgICAgIH0sXG4gICAgICAvLyBEZXBlbmRlbmN5IHRlY2huaWNhbGx5IGlzbid0IG9wdGlvbmFsLCBidXQgd2UgY2FuIHByb3ZpZGUgYSBiZXR0ZXIgZXJyb3IgbWVzc2FnZSB0aGlzIHdheS5cbiAgICAgIGRlcHM6IFtbS2V5VmFsdWVEaWZmZXJzLCBuZXcgU2tpcFNlbGYoKSwgbmV3IE9wdGlvbmFsKCldXVxuICAgIH07XG4gIH1cblxuICBmaW5kKGt2OiBhbnkpOiBLZXlWYWx1ZURpZmZlckZhY3Rvcnkge1xuICAgIGNvbnN0IGZhY3RvcnkgPSB0aGlzLmZhY3Rvcmllcy5maW5kKGYgPT4gZi5zdXBwb3J0cyhrdikpO1xuICAgIGlmIChmYWN0b3J5KSB7XG4gICAgICByZXR1cm4gZmFjdG9yeTtcbiAgICB9XG4gICAgdGhyb3cgbmV3IEVycm9yKGBDYW5ub3QgZmluZCBhIGRpZmZlciBzdXBwb3J0aW5nIG9iamVjdCAnJHtrdn0nYCk7XG4gIH1cbn1cbiJdfQ==