/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Optional, SkipSelf, ɵɵdefineInjectable } from '../../di';
import { DefaultKeyValueDifferFactory } from './default_keyvalue_differ';
/**
 * A repository of different Map diffing strategies used by NgClass, NgStyle, and others.
 *
 * @publicApi
 */
let KeyValueDiffers = /** @class */ (() => {
    class KeyValueDiffers {
        constructor(factories) {
            this.factories = factories;
        }
        static create(factories, parent) {
            if (parent) {
                const copied = parent.factories.slice();
                factories = factories.concat(copied);
            }
            return new KeyValueDiffers(factories);
        }
        /**
         * Takes an array of {@link KeyValueDifferFactory} and returns a provider used to extend the
         * inherited {@link KeyValueDiffers} instance with the provided factories and return a new
         * {@link KeyValueDiffers} instance.
         *
         * @usageNotes
         * ### Example
         *
         * The following example shows how to extend an existing list of factories,
         * which will only be applied to the injector for this component and its children.
         * This step is all that's required to make a new {@link KeyValueDiffer} available.
         *
         * ```
         * @Component({
         *   viewProviders: [
         *     KeyValueDiffers.extend([new ImmutableMapDiffer()])
         *   ]
         * })
         * ```
         */
        static extend(factories) {
            return {
                provide: KeyValueDiffers,
                useFactory: (parent) => {
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
        }
        find(kv) {
            const factory = this.factories.find(f => f.supports(kv));
            if (factory) {
                return factory;
            }
            throw new Error(`Cannot find a differ supporting object '${kv}'`);
        }
    }
    /** @nocollapse */
    KeyValueDiffers.ɵprov = ɵɵdefineInjectable({
        token: KeyValueDiffers,
        providedIn: 'root',
        factory: () => new KeyValueDiffers([new DefaultKeyValueDifferFactory()])
    });
    return KeyValueDiffers;
})();
export { KeyValueDiffers };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoia2V5dmFsdWVfZGlmZmVycy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL2NoYW5nZV9kZXRlY3Rpb24vZGlmZmVycy9rZXl2YWx1ZV9kaWZmZXJzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBQyxRQUFRLEVBQUUsUUFBUSxFQUFrQixrQkFBa0IsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUNoRixPQUFPLEVBQUMsNEJBQTRCLEVBQUMsTUFBTSwyQkFBMkIsQ0FBQztBQXdHdkU7Ozs7R0FJRztBQUNIO0lBQUEsTUFBYSxlQUFlO1FBYTFCLFlBQVksU0FBa0M7WUFDNUMsSUFBSSxDQUFDLFNBQVMsR0FBRyxTQUFTLENBQUM7UUFDN0IsQ0FBQztRQUVELE1BQU0sQ0FBQyxNQUFNLENBQUksU0FBa0MsRUFBRSxNQUF3QjtZQUMzRSxJQUFJLE1BQU0sRUFBRTtnQkFDVixNQUFNLE1BQU0sR0FBRyxNQUFNLENBQUMsU0FBUyxDQUFDLEtBQUssRUFBRSxDQUFDO2dCQUN4QyxTQUFTLEdBQUcsU0FBUyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQzthQUN0QztZQUNELE9BQU8sSUFBSSxlQUFlLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDeEMsQ0FBQztRQUVEOzs7Ozs7Ozs7Ozs7Ozs7Ozs7O1dBbUJHO1FBQ0gsTUFBTSxDQUFDLE1BQU0sQ0FBSSxTQUFrQztZQUNqRCxPQUFPO2dCQUNMLE9BQU8sRUFBRSxlQUFlO2dCQUN4QixVQUFVLEVBQUUsQ0FBQyxNQUF1QixFQUFFLEVBQUU7b0JBQ3RDLElBQUksQ0FBQyxNQUFNLEVBQUU7d0JBQ1gsMEZBQTBGO3dCQUMxRixnRkFBZ0Y7d0JBQ2hGLE1BQU0sSUFBSSxLQUFLLENBQUMseURBQXlELENBQUMsQ0FBQztxQkFDNUU7b0JBQ0QsT0FBTyxlQUFlLENBQUMsTUFBTSxDQUFDLFNBQVMsRUFBRSxNQUFNLENBQUMsQ0FBQztnQkFDbkQsQ0FBQztnQkFDRCw2RkFBNkY7Z0JBQzdGLElBQUksRUFBRSxDQUFDLENBQUMsZUFBZSxFQUFFLElBQUksUUFBUSxFQUFFLEVBQUUsSUFBSSxRQUFRLEVBQUUsQ0FBQyxDQUFDO2FBQzFELENBQUM7UUFDSixDQUFDO1FBRUQsSUFBSSxDQUFDLEVBQU87WUFDVixNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUN6RCxJQUFJLE9BQU8sRUFBRTtnQkFDWCxPQUFPLE9BQU8sQ0FBQzthQUNoQjtZQUNELE1BQU0sSUFBSSxLQUFLLENBQUMsMkNBQTJDLEVBQUUsR0FBRyxDQUFDLENBQUM7UUFDcEUsQ0FBQzs7SUFsRUQsa0JBQWtCO0lBQ1gscUJBQUssR0FBRyxrQkFBa0IsQ0FBQztRQUNoQyxLQUFLLEVBQUUsZUFBZTtRQUN0QixVQUFVLEVBQUUsTUFBTTtRQUNsQixPQUFPLEVBQUUsR0FBRyxFQUFFLENBQUMsSUFBSSxlQUFlLENBQUMsQ0FBQyxJQUFJLDRCQUE0QixFQUFFLENBQUMsQ0FBQztLQUN6RSxDQUFDLENBQUM7SUE4REwsc0JBQUM7S0FBQTtTQXBFWSxlQUFlIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge09wdGlvbmFsLCBTa2lwU2VsZiwgU3RhdGljUHJvdmlkZXIsIMm1ybVkZWZpbmVJbmplY3RhYmxlfSBmcm9tICcuLi8uLi9kaSc7XG5pbXBvcnQge0RlZmF1bHRLZXlWYWx1ZURpZmZlckZhY3Rvcnl9IGZyb20gJy4vZGVmYXVsdF9rZXl2YWx1ZV9kaWZmZXInO1xuXG5cbi8qKlxuICogQSBkaWZmZXIgdGhhdCB0cmFja3MgY2hhbmdlcyBtYWRlIHRvIGFuIG9iamVjdCBvdmVyIHRpbWUuXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgaW50ZXJmYWNlIEtleVZhbHVlRGlmZmVyPEssIFY+IHtcbiAgLyoqXG4gICAqIENvbXB1dGUgYSBkaWZmZXJlbmNlIGJldHdlZW4gdGhlIHByZXZpb3VzIHN0YXRlIGFuZCB0aGUgbmV3IGBvYmplY3RgIHN0YXRlLlxuICAgKlxuICAgKiBAcGFyYW0gb2JqZWN0IGNvbnRhaW5pbmcgdGhlIG5ldyB2YWx1ZS5cbiAgICogQHJldHVybnMgYW4gb2JqZWN0IGRlc2NyaWJpbmcgdGhlIGRpZmZlcmVuY2UuIFRoZSByZXR1cm4gdmFsdWUgaXMgb25seSB2YWxpZCB1bnRpbCB0aGUgbmV4dFxuICAgKiBgZGlmZigpYCBpbnZvY2F0aW9uLlxuICAgKi9cbiAgZGlmZihvYmplY3Q6IE1hcDxLLCBWPik6IEtleVZhbHVlQ2hhbmdlczxLLCBWPnxudWxsO1xuXG4gIC8qKlxuICAgKiBDb21wdXRlIGEgZGlmZmVyZW5jZSBiZXR3ZWVuIHRoZSBwcmV2aW91cyBzdGF0ZSBhbmQgdGhlIG5ldyBgb2JqZWN0YCBzdGF0ZS5cbiAgICpcbiAgICogQHBhcmFtIG9iamVjdCBjb250YWluaW5nIHRoZSBuZXcgdmFsdWUuXG4gICAqIEByZXR1cm5zIGFuIG9iamVjdCBkZXNjcmliaW5nIHRoZSBkaWZmZXJlbmNlLiBUaGUgcmV0dXJuIHZhbHVlIGlzIG9ubHkgdmFsaWQgdW50aWwgdGhlIG5leHRcbiAgICogYGRpZmYoKWAgaW52b2NhdGlvbi5cbiAgICovXG4gIGRpZmYob2JqZWN0OiB7W2tleTogc3RyaW5nXTogVn0pOiBLZXlWYWx1ZUNoYW5nZXM8c3RyaW5nLCBWPnxudWxsO1xuICAvLyBUT0RPKFRTMi4xKTogZGlmZjxLUCBleHRlbmRzIHN0cmluZz4odGhpczogS2V5VmFsdWVEaWZmZXI8S1AsIFY+LCBvYmplY3Q6IFJlY29yZDxLUCwgVj4pOlxuICAvLyBLZXlWYWx1ZURpZmZlcjxLUCwgVj47XG59XG5cbi8qKlxuICogQW4gb2JqZWN0IGRlc2NyaWJpbmcgdGhlIGNoYW5nZXMgaW4gdGhlIGBNYXBgIG9yIGB7W2s6c3RyaW5nXTogc3RyaW5nfWAgc2luY2UgbGFzdCB0aW1lXG4gKiBgS2V5VmFsdWVEaWZmZXIjZGlmZigpYCB3YXMgaW52b2tlZC5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgS2V5VmFsdWVDaGFuZ2VzPEssIFY+IHtcbiAgLyoqXG4gICAqIEl0ZXJhdGUgb3ZlciBhbGwgY2hhbmdlcy4gYEtleVZhbHVlQ2hhbmdlUmVjb3JkYCB3aWxsIGNvbnRhaW4gaW5mb3JtYXRpb24gYWJvdXQgY2hhbmdlc1xuICAgKiB0byBlYWNoIGl0ZW0uXG4gICAqL1xuICBmb3JFYWNoSXRlbShmbjogKHI6IEtleVZhbHVlQ2hhbmdlUmVjb3JkPEssIFY+KSA9PiB2b2lkKTogdm9pZDtcblxuICAvKipcbiAgICogSXRlcmF0ZSBvdmVyIGNoYW5nZXMgaW4gdGhlIG9yZGVyIG9mIG9yaWdpbmFsIE1hcCBzaG93aW5nIHdoZXJlIHRoZSBvcmlnaW5hbCBpdGVtc1xuICAgKiBoYXZlIG1vdmVkLlxuICAgKi9cbiAgZm9yRWFjaFByZXZpb3VzSXRlbShmbjogKHI6IEtleVZhbHVlQ2hhbmdlUmVjb3JkPEssIFY+KSA9PiB2b2lkKTogdm9pZDtcblxuICAvKipcbiAgICogSXRlcmF0ZSBvdmVyIGFsbCBrZXlzIGZvciB3aGljaCB2YWx1ZXMgaGF2ZSBjaGFuZ2VkLlxuICAgKi9cbiAgZm9yRWFjaENoYW5nZWRJdGVtKGZuOiAocjogS2V5VmFsdWVDaGFuZ2VSZWNvcmQ8SywgVj4pID0+IHZvaWQpOiB2b2lkO1xuXG4gIC8qKlxuICAgKiBJdGVyYXRlIG92ZXIgYWxsIGFkZGVkIGl0ZW1zLlxuICAgKi9cbiAgZm9yRWFjaEFkZGVkSXRlbShmbjogKHI6IEtleVZhbHVlQ2hhbmdlUmVjb3JkPEssIFY+KSA9PiB2b2lkKTogdm9pZDtcblxuICAvKipcbiAgICogSXRlcmF0ZSBvdmVyIGFsbCByZW1vdmVkIGl0ZW1zLlxuICAgKi9cbiAgZm9yRWFjaFJlbW92ZWRJdGVtKGZuOiAocjogS2V5VmFsdWVDaGFuZ2VSZWNvcmQ8SywgVj4pID0+IHZvaWQpOiB2b2lkO1xufVxuXG4vKipcbiAqIFJlY29yZCByZXByZXNlbnRpbmcgdGhlIGl0ZW0gY2hhbmdlIGluZm9ybWF0aW9uLlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBLZXlWYWx1ZUNoYW5nZVJlY29yZDxLLCBWPiB7XG4gIC8qKlxuICAgKiBDdXJyZW50IGtleSBpbiB0aGUgTWFwLlxuICAgKi9cbiAgcmVhZG9ubHkga2V5OiBLO1xuXG4gIC8qKlxuICAgKiBDdXJyZW50IHZhbHVlIGZvciB0aGUga2V5IG9yIGBudWxsYCBpZiByZW1vdmVkLlxuICAgKi9cbiAgcmVhZG9ubHkgY3VycmVudFZhbHVlOiBWfG51bGw7XG5cbiAgLyoqXG4gICAqIFByZXZpb3VzIHZhbHVlIGZvciB0aGUga2V5IG9yIGBudWxsYCBpZiBhZGRlZC5cbiAgICovXG4gIHJlYWRvbmx5IHByZXZpb3VzVmFsdWU6IFZ8bnVsbDtcbn1cblxuLyoqXG4gKiBQcm92aWRlcyBhIGZhY3RvcnkgZm9yIHtAbGluayBLZXlWYWx1ZURpZmZlcn0uXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgaW50ZXJmYWNlIEtleVZhbHVlRGlmZmVyRmFjdG9yeSB7XG4gIC8qKlxuICAgKiBUZXN0IHRvIHNlZSBpZiB0aGUgZGlmZmVyIGtub3dzIGhvdyB0byBkaWZmIHRoaXMga2luZCBvZiBvYmplY3QuXG4gICAqL1xuICBzdXBwb3J0cyhvYmplY3RzOiBhbnkpOiBib29sZWFuO1xuXG4gIC8qKlxuICAgKiBDcmVhdGUgYSBgS2V5VmFsdWVEaWZmZXJgLlxuICAgKi9cbiAgY3JlYXRlPEssIFY+KCk6IEtleVZhbHVlRGlmZmVyPEssIFY+O1xufVxuXG4vKipcbiAqIEEgcmVwb3NpdG9yeSBvZiBkaWZmZXJlbnQgTWFwIGRpZmZpbmcgc3RyYXRlZ2llcyB1c2VkIGJ5IE5nQ2xhc3MsIE5nU3R5bGUsIGFuZCBvdGhlcnMuXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgY2xhc3MgS2V5VmFsdWVEaWZmZXJzIHtcbiAgLyoqIEBub2NvbGxhcHNlICovXG4gIHN0YXRpYyDJtXByb3YgPSDJtcm1ZGVmaW5lSW5qZWN0YWJsZSh7XG4gICAgdG9rZW46IEtleVZhbHVlRGlmZmVycyxcbiAgICBwcm92aWRlZEluOiAncm9vdCcsXG4gICAgZmFjdG9yeTogKCkgPT4gbmV3IEtleVZhbHVlRGlmZmVycyhbbmV3IERlZmF1bHRLZXlWYWx1ZURpZmZlckZhY3RvcnkoKV0pXG4gIH0pO1xuXG4gIC8qKlxuICAgKiBAZGVwcmVjYXRlZCB2NC4wLjAgLSBTaG91bGQgYmUgcHJpdmF0ZS5cbiAgICovXG4gIGZhY3RvcmllczogS2V5VmFsdWVEaWZmZXJGYWN0b3J5W107XG5cbiAgY29uc3RydWN0b3IoZmFjdG9yaWVzOiBLZXlWYWx1ZURpZmZlckZhY3RvcnlbXSkge1xuICAgIHRoaXMuZmFjdG9yaWVzID0gZmFjdG9yaWVzO1xuICB9XG5cbiAgc3RhdGljIGNyZWF0ZTxTPihmYWN0b3JpZXM6IEtleVZhbHVlRGlmZmVyRmFjdG9yeVtdLCBwYXJlbnQ/OiBLZXlWYWx1ZURpZmZlcnMpOiBLZXlWYWx1ZURpZmZlcnMge1xuICAgIGlmIChwYXJlbnQpIHtcbiAgICAgIGNvbnN0IGNvcGllZCA9IHBhcmVudC5mYWN0b3JpZXMuc2xpY2UoKTtcbiAgICAgIGZhY3RvcmllcyA9IGZhY3Rvcmllcy5jb25jYXQoY29waWVkKTtcbiAgICB9XG4gICAgcmV0dXJuIG5ldyBLZXlWYWx1ZURpZmZlcnMoZmFjdG9yaWVzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBUYWtlcyBhbiBhcnJheSBvZiB7QGxpbmsgS2V5VmFsdWVEaWZmZXJGYWN0b3J5fSBhbmQgcmV0dXJucyBhIHByb3ZpZGVyIHVzZWQgdG8gZXh0ZW5kIHRoZVxuICAgKiBpbmhlcml0ZWQge0BsaW5rIEtleVZhbHVlRGlmZmVyc30gaW5zdGFuY2Ugd2l0aCB0aGUgcHJvdmlkZWQgZmFjdG9yaWVzIGFuZCByZXR1cm4gYSBuZXdcbiAgICoge0BsaW5rIEtleVZhbHVlRGlmZmVyc30gaW5zdGFuY2UuXG4gICAqXG4gICAqIEB1c2FnZU5vdGVzXG4gICAqICMjIyBFeGFtcGxlXG4gICAqXG4gICAqIFRoZSBmb2xsb3dpbmcgZXhhbXBsZSBzaG93cyBob3cgdG8gZXh0ZW5kIGFuIGV4aXN0aW5nIGxpc3Qgb2YgZmFjdG9yaWVzLFxuICAgKiB3aGljaCB3aWxsIG9ubHkgYmUgYXBwbGllZCB0byB0aGUgaW5qZWN0b3IgZm9yIHRoaXMgY29tcG9uZW50IGFuZCBpdHMgY2hpbGRyZW4uXG4gICAqIFRoaXMgc3RlcCBpcyBhbGwgdGhhdCdzIHJlcXVpcmVkIHRvIG1ha2UgYSBuZXcge0BsaW5rIEtleVZhbHVlRGlmZmVyfSBhdmFpbGFibGUuXG4gICAqXG4gICAqIGBgYFxuICAgKiBAQ29tcG9uZW50KHtcbiAgICogICB2aWV3UHJvdmlkZXJzOiBbXG4gICAqICAgICBLZXlWYWx1ZURpZmZlcnMuZXh0ZW5kKFtuZXcgSW1tdXRhYmxlTWFwRGlmZmVyKCldKVxuICAgKiAgIF1cbiAgICogfSlcbiAgICogYGBgXG4gICAqL1xuICBzdGF0aWMgZXh0ZW5kPFM+KGZhY3RvcmllczogS2V5VmFsdWVEaWZmZXJGYWN0b3J5W10pOiBTdGF0aWNQcm92aWRlciB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHByb3ZpZGU6IEtleVZhbHVlRGlmZmVycyxcbiAgICAgIHVzZUZhY3Rvcnk6IChwYXJlbnQ6IEtleVZhbHVlRGlmZmVycykgPT4ge1xuICAgICAgICBpZiAoIXBhcmVudCkge1xuICAgICAgICAgIC8vIFR5cGljYWxseSB3b3VsZCBvY2N1ciB3aGVuIGNhbGxpbmcgS2V5VmFsdWVEaWZmZXJzLmV4dGVuZCBpbnNpZGUgb2YgZGVwZW5kZW5jaWVzIHBhc3NlZFxuICAgICAgICAgIC8vIHRvIGJvb3RzdHJhcCgpLCB3aGljaCB3b3VsZCBvdmVycmlkZSBkZWZhdWx0IHBpcGVzIGluc3RlYWQgb2YgZXh0ZW5kaW5nIHRoZW0uXG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3QgZXh0ZW5kIEtleVZhbHVlRGlmZmVycyB3aXRob3V0IGEgcGFyZW50IGluamVjdG9yJyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIEtleVZhbHVlRGlmZmVycy5jcmVhdGUoZmFjdG9yaWVzLCBwYXJlbnQpO1xuICAgICAgfSxcbiAgICAgIC8vIERlcGVuZGVuY3kgdGVjaG5pY2FsbHkgaXNuJ3Qgb3B0aW9uYWwsIGJ1dCB3ZSBjYW4gcHJvdmlkZSBhIGJldHRlciBlcnJvciBtZXNzYWdlIHRoaXMgd2F5LlxuICAgICAgZGVwczogW1tLZXlWYWx1ZURpZmZlcnMsIG5ldyBTa2lwU2VsZigpLCBuZXcgT3B0aW9uYWwoKV1dXG4gICAgfTtcbiAgfVxuXG4gIGZpbmQoa3Y6IGFueSk6IEtleVZhbHVlRGlmZmVyRmFjdG9yeSB7XG4gICAgY29uc3QgZmFjdG9yeSA9IHRoaXMuZmFjdG9yaWVzLmZpbmQoZiA9PiBmLnN1cHBvcnRzKGt2KSk7XG4gICAgaWYgKGZhY3RvcnkpIHtcbiAgICAgIHJldHVybiBmYWN0b3J5O1xuICAgIH1cbiAgICB0aHJvdyBuZXcgRXJyb3IoYENhbm5vdCBmaW5kIGEgZGlmZmVyIHN1cHBvcnRpbmcgb2JqZWN0ICcke2t2fSdgKTtcbiAgfVxufVxuIl19