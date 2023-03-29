/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { createSignalFromFunction, defaultEquals } from './api';
import { ReactiveNode, setActiveConsumer } from './graph';
/**
 * Create a computed `Signal` which derives a reactive value from an expression.
 *
 * @developerPreview
 */
export function computed(computation, options) {
    const node = new ComputedImpl(computation, options?.equal ?? defaultEquals);
    // Casting here is required for g3, as TS inference behavior is slightly different between our
    // version/options and g3's.
    return createSignalFromFunction(node, node.signal.bind(node));
}
/**
 * A dedicated symbol used before a computed value has been calculated for the first time.
 * Explicitly typed as `any` so we can use it as signal's value.
 */
const UNSET = Symbol('UNSET');
/**
 * A dedicated symbol used in place of a computed signal value to indicate that a given computation
 * is in progress. Used to detect cycles in computation chains.
 * Explicitly typed as `any` so we can use it as signal's value.
 */
const COMPUTING = Symbol('COMPUTING');
/**
 * A dedicated symbol used in place of a computed signal value to indicate that a given computation
 * failed. The thrown error is cached until the computation gets dirty again.
 * Explicitly typed as `any` so we can use it as signal's value.
 */
const ERRORED = Symbol('ERRORED');
/**
 * A computation, which derives a value from a declarative reactive expression.
 *
 * `Computed`s are both producers and consumers of reactivity.
 */
class ComputedImpl extends ReactiveNode {
    constructor(computation, equal) {
        super();
        this.computation = computation;
        this.equal = equal;
        /**
         * Current value of the computation.
         *
         * This can also be one of the special values `UNSET`, `COMPUTING`, or `ERRORED`.
         */
        this.value = UNSET;
        /**
         * If `value` is `ERRORED`, the error caught from the last computation attempt which will
         * be re-thrown.
         */
        this.error = null;
        /**
         * Flag indicating that the computation is currently stale, meaning that one of the
         * dependencies has notified of a potential change.
         *
         * It's possible that no dependency has _actually_ changed, in which case the `stale`
         * state can be resolved without recomputing the value.
         */
        this.stale = true;
    }
    onConsumerDependencyMayHaveChanged() {
        if (this.stale) {
            // We've already notified consumers that this value has potentially changed.
            return;
        }
        // Record that the currently cached value may be stale.
        this.stale = true;
        // Notify any consumers about the potential change.
        this.producerMayHaveChanged();
    }
    onProducerUpdateValueVersion() {
        if (!this.stale) {
            // The current value and its version are already up to date.
            return;
        }
        // The current value is stale. Check whether we need to produce a new one.
        if (this.value !== UNSET && this.value !== COMPUTING &&
            !this.consumerPollProducersForChange()) {
            // Even though we were previously notified of a potential dependency update, all of
            // our dependencies report that they have not actually changed in value, so we can
            // resolve the stale state without needing to recompute the current value.
            this.stale = false;
            return;
        }
        // The current value is stale, and needs to be recomputed. It still may not change -
        // that depends on whether the newly computed value is equal to the old.
        this.recomputeValue();
    }
    recomputeValue() {
        if (this.value === COMPUTING) {
            // Our computation somehow led to a cyclic read of itself.
            throw new Error('Detected cycle in computations.');
        }
        const oldValue = this.value;
        this.value = COMPUTING;
        // As we're re-running the computation, update our dependent tracking version number.
        this.trackingVersion++;
        const prevConsumer = setActiveConsumer(this);
        let newValue;
        try {
            newValue = this.computation();
        }
        catch (err) {
            newValue = ERRORED;
            this.error = err;
        }
        finally {
            setActiveConsumer(prevConsumer);
        }
        this.stale = false;
        if (oldValue !== UNSET && oldValue !== ERRORED && newValue !== ERRORED &&
            this.equal(oldValue, newValue)) {
            // No change to `valueVersion` - old and new values are
            // semantically equivalent.
            this.value = oldValue;
            return;
        }
        this.value = newValue;
        this.valueVersion++;
    }
    signal() {
        // Check if the value needs updating before returning it.
        this.onProducerUpdateValueVersion();
        // Record that someone looked at this signal.
        this.producerAccessed();
        if (this.value === ERRORED) {
            throw this.error;
        }
        return this.value;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcHV0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9zaWduYWxzL3NyYy9jb21wdXRlZC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQUMsd0JBQXdCLEVBQUUsYUFBYSxFQUEwQixNQUFNLE9BQU8sQ0FBQztBQUN2RixPQUFPLEVBQUMsWUFBWSxFQUFFLGlCQUFpQixFQUFDLE1BQU0sU0FBUyxDQUFDO0FBZXhEOzs7O0dBSUc7QUFDSCxNQUFNLFVBQVUsUUFBUSxDQUFJLFdBQW9CLEVBQUUsT0FBa0M7SUFDbEYsTUFBTSxJQUFJLEdBQUcsSUFBSSxZQUFZLENBQUMsV0FBVyxFQUFFLE9BQU8sRUFBRSxLQUFLLElBQUksYUFBYSxDQUFDLENBQUM7SUFFNUUsOEZBQThGO0lBQzlGLDRCQUE0QjtJQUM1QixPQUFPLHdCQUF3QixDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBeUIsQ0FBQztBQUN4RixDQUFDO0FBRUQ7OztHQUdHO0FBQ0gsTUFBTSxLQUFLLEdBQVEsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBRW5DOzs7O0dBSUc7QUFDSCxNQUFNLFNBQVMsR0FBUSxNQUFNLENBQUMsV0FBVyxDQUFDLENBQUM7QUFFM0M7Ozs7R0FJRztBQUNILE1BQU0sT0FBTyxHQUFRLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQztBQUV2Qzs7OztHQUlHO0FBQ0gsTUFBTSxZQUFnQixTQUFRLFlBQVk7SUFDeEMsWUFBb0IsV0FBb0IsRUFBVSxLQUE0QztRQUM1RixLQUFLLEVBQUUsQ0FBQztRQURVLGdCQUFXLEdBQVgsV0FBVyxDQUFTO1FBQVUsVUFBSyxHQUFMLEtBQUssQ0FBdUM7UUFHOUY7Ozs7V0FJRztRQUNLLFVBQUssR0FBTSxLQUFLLENBQUM7UUFFekI7OztXQUdHO1FBQ0ssVUFBSyxHQUFZLElBQUksQ0FBQztRQUU5Qjs7Ozs7O1dBTUc7UUFDSyxVQUFLLEdBQUcsSUFBSSxDQUFDO0lBckJyQixDQUFDO0lBdUJrQixrQ0FBa0M7UUFDbkQsSUFBSSxJQUFJLENBQUMsS0FBSyxFQUFFO1lBQ2QsNEVBQTRFO1lBQzVFLE9BQU87U0FDUjtRQUVELHVEQUF1RDtRQUN2RCxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQztRQUVsQixtREFBbUQ7UUFDbkQsSUFBSSxDQUFDLHNCQUFzQixFQUFFLENBQUM7SUFDaEMsQ0FBQztJQUVrQiw0QkFBNEI7UUFDN0MsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUU7WUFDZiw0REFBNEQ7WUFDNUQsT0FBTztTQUNSO1FBRUQsMEVBQTBFO1FBRTFFLElBQUksSUFBSSxDQUFDLEtBQUssS0FBSyxLQUFLLElBQUksSUFBSSxDQUFDLEtBQUssS0FBSyxTQUFTO1lBQ2hELENBQUMsSUFBSSxDQUFDLDhCQUE4QixFQUFFLEVBQUU7WUFDMUMsbUZBQW1GO1lBQ25GLGtGQUFrRjtZQUNsRiwwRUFBMEU7WUFDMUUsSUFBSSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUM7WUFDbkIsT0FBTztTQUNSO1FBRUQsb0ZBQW9GO1FBQ3BGLHdFQUF3RTtRQUN4RSxJQUFJLENBQUMsY0FBYyxFQUFFLENBQUM7SUFDeEIsQ0FBQztJQUVPLGNBQWM7UUFDcEIsSUFBSSxJQUFJLENBQUMsS0FBSyxLQUFLLFNBQVMsRUFBRTtZQUM1QiwwREFBMEQ7WUFDMUQsTUFBTSxJQUFJLEtBQUssQ0FBQyxpQ0FBaUMsQ0FBQyxDQUFDO1NBQ3BEO1FBRUQsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQztRQUM1QixJQUFJLENBQUMsS0FBSyxHQUFHLFNBQVMsQ0FBQztRQUV2QixxRkFBcUY7UUFDckYsSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDO1FBQ3ZCLE1BQU0sWUFBWSxHQUFHLGlCQUFpQixDQUFDLElBQUksQ0FBQyxDQUFDO1FBQzdDLElBQUksUUFBVyxDQUFDO1FBQ2hCLElBQUk7WUFDRixRQUFRLEdBQUcsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO1NBQy9CO1FBQUMsT0FBTyxHQUFHLEVBQUU7WUFDWixRQUFRLEdBQUcsT0FBTyxDQUFDO1lBQ25CLElBQUksQ0FBQyxLQUFLLEdBQUcsR0FBRyxDQUFDO1NBQ2xCO2dCQUFTO1lBQ1IsaUJBQWlCLENBQUMsWUFBWSxDQUFDLENBQUM7U0FDakM7UUFFRCxJQUFJLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQztRQUVuQixJQUFJLFFBQVEsS0FBSyxLQUFLLElBQUksUUFBUSxLQUFLLE9BQU8sSUFBSSxRQUFRLEtBQUssT0FBTztZQUNsRSxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsRUFBRSxRQUFRLENBQUMsRUFBRTtZQUNsQyx1REFBdUQ7WUFDdkQsMkJBQTJCO1lBQzNCLElBQUksQ0FBQyxLQUFLLEdBQUcsUUFBUSxDQUFDO1lBQ3RCLE9BQU87U0FDUjtRQUVELElBQUksQ0FBQyxLQUFLLEdBQUcsUUFBUSxDQUFDO1FBQ3RCLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQztJQUN0QixDQUFDO0lBRUQsTUFBTTtRQUNKLHlEQUF5RDtRQUN6RCxJQUFJLENBQUMsNEJBQTRCLEVBQUUsQ0FBQztRQUVwQyw2Q0FBNkM7UUFDN0MsSUFBSSxDQUFDLGdCQUFnQixFQUFFLENBQUM7UUFFeEIsSUFBSSxJQUFJLENBQUMsS0FBSyxLQUFLLE9BQU8sRUFBRTtZQUMxQixNQUFNLElBQUksQ0FBQyxLQUFLLENBQUM7U0FDbEI7UUFFRCxPQUFPLElBQUksQ0FBQyxLQUFLLENBQUM7SUFDcEIsQ0FBQztDQUNGIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7Y3JlYXRlU2lnbmFsRnJvbUZ1bmN0aW9uLCBkZWZhdWx0RXF1YWxzLCBTaWduYWwsIFZhbHVlRXF1YWxpdHlGbn0gZnJvbSAnLi9hcGknO1xuaW1wb3J0IHtSZWFjdGl2ZU5vZGUsIHNldEFjdGl2ZUNvbnN1bWVyfSBmcm9tICcuL2dyYXBoJztcblxuLyoqXG4gKiBPcHRpb25zIHBhc3NlZCB0byB0aGUgYGNvbXB1dGVkYCBjcmVhdGlvbiBmdW5jdGlvbi5cbiAqXG4gKiBAZGV2ZWxvcGVyUHJldmlld1xuICovXG5leHBvcnQgaW50ZXJmYWNlIENyZWF0ZUNvbXB1dGVkT3B0aW9uczxUPiB7XG4gIC8qKlxuICAgKiBBIGNvbXBhcmlzb24gZnVuY3Rpb24gd2hpY2ggZGVmaW5lcyBlcXVhbGl0eSBmb3IgY29tcHV0ZWQgdmFsdWVzLlxuICAgKi9cbiAgZXF1YWw/OiBWYWx1ZUVxdWFsaXR5Rm48VD47XG59XG5cblxuLyoqXG4gKiBDcmVhdGUgYSBjb21wdXRlZCBgU2lnbmFsYCB3aGljaCBkZXJpdmVzIGEgcmVhY3RpdmUgdmFsdWUgZnJvbSBhbiBleHByZXNzaW9uLlxuICpcbiAqIEBkZXZlbG9wZXJQcmV2aWV3XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb21wdXRlZDxUPihjb21wdXRhdGlvbjogKCkgPT4gVCwgb3B0aW9ucz86IENyZWF0ZUNvbXB1dGVkT3B0aW9uczxUPik6IFNpZ25hbDxUPiB7XG4gIGNvbnN0IG5vZGUgPSBuZXcgQ29tcHV0ZWRJbXBsKGNvbXB1dGF0aW9uLCBvcHRpb25zPy5lcXVhbCA/PyBkZWZhdWx0RXF1YWxzKTtcblxuICAvLyBDYXN0aW5nIGhlcmUgaXMgcmVxdWlyZWQgZm9yIGczLCBhcyBUUyBpbmZlcmVuY2UgYmVoYXZpb3IgaXMgc2xpZ2h0bHkgZGlmZmVyZW50IGJldHdlZW4gb3VyXG4gIC8vIHZlcnNpb24vb3B0aW9ucyBhbmQgZzMncy5cbiAgcmV0dXJuIGNyZWF0ZVNpZ25hbEZyb21GdW5jdGlvbihub2RlLCBub2RlLnNpZ25hbC5iaW5kKG5vZGUpKSBhcyB1bmtub3duIGFzIFNpZ25hbDxUPjtcbn1cblxuLyoqXG4gKiBBIGRlZGljYXRlZCBzeW1ib2wgdXNlZCBiZWZvcmUgYSBjb21wdXRlZCB2YWx1ZSBoYXMgYmVlbiBjYWxjdWxhdGVkIGZvciB0aGUgZmlyc3QgdGltZS5cbiAqIEV4cGxpY2l0bHkgdHlwZWQgYXMgYGFueWAgc28gd2UgY2FuIHVzZSBpdCBhcyBzaWduYWwncyB2YWx1ZS5cbiAqL1xuY29uc3QgVU5TRVQ6IGFueSA9IFN5bWJvbCgnVU5TRVQnKTtcblxuLyoqXG4gKiBBIGRlZGljYXRlZCBzeW1ib2wgdXNlZCBpbiBwbGFjZSBvZiBhIGNvbXB1dGVkIHNpZ25hbCB2YWx1ZSB0byBpbmRpY2F0ZSB0aGF0IGEgZ2l2ZW4gY29tcHV0YXRpb25cbiAqIGlzIGluIHByb2dyZXNzLiBVc2VkIHRvIGRldGVjdCBjeWNsZXMgaW4gY29tcHV0YXRpb24gY2hhaW5zLlxuICogRXhwbGljaXRseSB0eXBlZCBhcyBgYW55YCBzbyB3ZSBjYW4gdXNlIGl0IGFzIHNpZ25hbCdzIHZhbHVlLlxuICovXG5jb25zdCBDT01QVVRJTkc6IGFueSA9IFN5bWJvbCgnQ09NUFVUSU5HJyk7XG5cbi8qKlxuICogQSBkZWRpY2F0ZWQgc3ltYm9sIHVzZWQgaW4gcGxhY2Ugb2YgYSBjb21wdXRlZCBzaWduYWwgdmFsdWUgdG8gaW5kaWNhdGUgdGhhdCBhIGdpdmVuIGNvbXB1dGF0aW9uXG4gKiBmYWlsZWQuIFRoZSB0aHJvd24gZXJyb3IgaXMgY2FjaGVkIHVudGlsIHRoZSBjb21wdXRhdGlvbiBnZXRzIGRpcnR5IGFnYWluLlxuICogRXhwbGljaXRseSB0eXBlZCBhcyBgYW55YCBzbyB3ZSBjYW4gdXNlIGl0IGFzIHNpZ25hbCdzIHZhbHVlLlxuICovXG5jb25zdCBFUlJPUkVEOiBhbnkgPSBTeW1ib2woJ0VSUk9SRUQnKTtcblxuLyoqXG4gKiBBIGNvbXB1dGF0aW9uLCB3aGljaCBkZXJpdmVzIGEgdmFsdWUgZnJvbSBhIGRlY2xhcmF0aXZlIHJlYWN0aXZlIGV4cHJlc3Npb24uXG4gKlxuICogYENvbXB1dGVkYHMgYXJlIGJvdGggcHJvZHVjZXJzIGFuZCBjb25zdW1lcnMgb2YgcmVhY3Rpdml0eS5cbiAqL1xuY2xhc3MgQ29tcHV0ZWRJbXBsPFQ+IGV4dGVuZHMgUmVhY3RpdmVOb2RlIHtcbiAgY29uc3RydWN0b3IocHJpdmF0ZSBjb21wdXRhdGlvbjogKCkgPT4gVCwgcHJpdmF0ZSBlcXVhbDogKG9sZFZhbHVlOiBULCBuZXdWYWx1ZTogVCkgPT4gYm9vbGVhbikge1xuICAgIHN1cGVyKCk7XG4gIH1cbiAgLyoqXG4gICAqIEN1cnJlbnQgdmFsdWUgb2YgdGhlIGNvbXB1dGF0aW9uLlxuICAgKlxuICAgKiBUaGlzIGNhbiBhbHNvIGJlIG9uZSBvZiB0aGUgc3BlY2lhbCB2YWx1ZXMgYFVOU0VUYCwgYENPTVBVVElOR2AsIG9yIGBFUlJPUkVEYC5cbiAgICovXG4gIHByaXZhdGUgdmFsdWU6IFQgPSBVTlNFVDtcblxuICAvKipcbiAgICogSWYgYHZhbHVlYCBpcyBgRVJST1JFRGAsIHRoZSBlcnJvciBjYXVnaHQgZnJvbSB0aGUgbGFzdCBjb21wdXRhdGlvbiBhdHRlbXB0IHdoaWNoIHdpbGxcbiAgICogYmUgcmUtdGhyb3duLlxuICAgKi9cbiAgcHJpdmF0ZSBlcnJvcjogdW5rbm93biA9IG51bGw7XG5cbiAgLyoqXG4gICAqIEZsYWcgaW5kaWNhdGluZyB0aGF0IHRoZSBjb21wdXRhdGlvbiBpcyBjdXJyZW50bHkgc3RhbGUsIG1lYW5pbmcgdGhhdCBvbmUgb2YgdGhlXG4gICAqIGRlcGVuZGVuY2llcyBoYXMgbm90aWZpZWQgb2YgYSBwb3RlbnRpYWwgY2hhbmdlLlxuICAgKlxuICAgKiBJdCdzIHBvc3NpYmxlIHRoYXQgbm8gZGVwZW5kZW5jeSBoYXMgX2FjdHVhbGx5XyBjaGFuZ2VkLCBpbiB3aGljaCBjYXNlIHRoZSBgc3RhbGVgXG4gICAqIHN0YXRlIGNhbiBiZSByZXNvbHZlZCB3aXRob3V0IHJlY29tcHV0aW5nIHRoZSB2YWx1ZS5cbiAgICovXG4gIHByaXZhdGUgc3RhbGUgPSB0cnVlO1xuXG4gIHByb3RlY3RlZCBvdmVycmlkZSBvbkNvbnN1bWVyRGVwZW5kZW5jeU1heUhhdmVDaGFuZ2VkKCk6IHZvaWQge1xuICAgIGlmICh0aGlzLnN0YWxlKSB7XG4gICAgICAvLyBXZSd2ZSBhbHJlYWR5IG5vdGlmaWVkIGNvbnN1bWVycyB0aGF0IHRoaXMgdmFsdWUgaGFzIHBvdGVudGlhbGx5IGNoYW5nZWQuXG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gUmVjb3JkIHRoYXQgdGhlIGN1cnJlbnRseSBjYWNoZWQgdmFsdWUgbWF5IGJlIHN0YWxlLlxuICAgIHRoaXMuc3RhbGUgPSB0cnVlO1xuXG4gICAgLy8gTm90aWZ5IGFueSBjb25zdW1lcnMgYWJvdXQgdGhlIHBvdGVudGlhbCBjaGFuZ2UuXG4gICAgdGhpcy5wcm9kdWNlck1heUhhdmVDaGFuZ2VkKCk7XG4gIH1cblxuICBwcm90ZWN0ZWQgb3ZlcnJpZGUgb25Qcm9kdWNlclVwZGF0ZVZhbHVlVmVyc2lvbigpOiB2b2lkIHtcbiAgICBpZiAoIXRoaXMuc3RhbGUpIHtcbiAgICAgIC8vIFRoZSBjdXJyZW50IHZhbHVlIGFuZCBpdHMgdmVyc2lvbiBhcmUgYWxyZWFkeSB1cCB0byBkYXRlLlxuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIFRoZSBjdXJyZW50IHZhbHVlIGlzIHN0YWxlLiBDaGVjayB3aGV0aGVyIHdlIG5lZWQgdG8gcHJvZHVjZSBhIG5ldyBvbmUuXG5cbiAgICBpZiAodGhpcy52YWx1ZSAhPT0gVU5TRVQgJiYgdGhpcy52YWx1ZSAhPT0gQ09NUFVUSU5HICYmXG4gICAgICAgICF0aGlzLmNvbnN1bWVyUG9sbFByb2R1Y2Vyc0ZvckNoYW5nZSgpKSB7XG4gICAgICAvLyBFdmVuIHRob3VnaCB3ZSB3ZXJlIHByZXZpb3VzbHkgbm90aWZpZWQgb2YgYSBwb3RlbnRpYWwgZGVwZW5kZW5jeSB1cGRhdGUsIGFsbCBvZlxuICAgICAgLy8gb3VyIGRlcGVuZGVuY2llcyByZXBvcnQgdGhhdCB0aGV5IGhhdmUgbm90IGFjdHVhbGx5IGNoYW5nZWQgaW4gdmFsdWUsIHNvIHdlIGNhblxuICAgICAgLy8gcmVzb2x2ZSB0aGUgc3RhbGUgc3RhdGUgd2l0aG91dCBuZWVkaW5nIHRvIHJlY29tcHV0ZSB0aGUgY3VycmVudCB2YWx1ZS5cbiAgICAgIHRoaXMuc3RhbGUgPSBmYWxzZTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBUaGUgY3VycmVudCB2YWx1ZSBpcyBzdGFsZSwgYW5kIG5lZWRzIHRvIGJlIHJlY29tcHV0ZWQuIEl0IHN0aWxsIG1heSBub3QgY2hhbmdlIC1cbiAgICAvLyB0aGF0IGRlcGVuZHMgb24gd2hldGhlciB0aGUgbmV3bHkgY29tcHV0ZWQgdmFsdWUgaXMgZXF1YWwgdG8gdGhlIG9sZC5cbiAgICB0aGlzLnJlY29tcHV0ZVZhbHVlKCk7XG4gIH1cblxuICBwcml2YXRlIHJlY29tcHV0ZVZhbHVlKCk6IHZvaWQge1xuICAgIGlmICh0aGlzLnZhbHVlID09PSBDT01QVVRJTkcpIHtcbiAgICAgIC8vIE91ciBjb21wdXRhdGlvbiBzb21laG93IGxlZCB0byBhIGN5Y2xpYyByZWFkIG9mIGl0c2VsZi5cbiAgICAgIHRocm93IG5ldyBFcnJvcignRGV0ZWN0ZWQgY3ljbGUgaW4gY29tcHV0YXRpb25zLicpO1xuICAgIH1cblxuICAgIGNvbnN0IG9sZFZhbHVlID0gdGhpcy52YWx1ZTtcbiAgICB0aGlzLnZhbHVlID0gQ09NUFVUSU5HO1xuXG4gICAgLy8gQXMgd2UncmUgcmUtcnVubmluZyB0aGUgY29tcHV0YXRpb24sIHVwZGF0ZSBvdXIgZGVwZW5kZW50IHRyYWNraW5nIHZlcnNpb24gbnVtYmVyLlxuICAgIHRoaXMudHJhY2tpbmdWZXJzaW9uKys7XG4gICAgY29uc3QgcHJldkNvbnN1bWVyID0gc2V0QWN0aXZlQ29uc3VtZXIodGhpcyk7XG4gICAgbGV0IG5ld1ZhbHVlOiBUO1xuICAgIHRyeSB7XG4gICAgICBuZXdWYWx1ZSA9IHRoaXMuY29tcHV0YXRpb24oKTtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIG5ld1ZhbHVlID0gRVJST1JFRDtcbiAgICAgIHRoaXMuZXJyb3IgPSBlcnI7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIHNldEFjdGl2ZUNvbnN1bWVyKHByZXZDb25zdW1lcik7XG4gICAgfVxuXG4gICAgdGhpcy5zdGFsZSA9IGZhbHNlO1xuXG4gICAgaWYgKG9sZFZhbHVlICE9PSBVTlNFVCAmJiBvbGRWYWx1ZSAhPT0gRVJST1JFRCAmJiBuZXdWYWx1ZSAhPT0gRVJST1JFRCAmJlxuICAgICAgICB0aGlzLmVxdWFsKG9sZFZhbHVlLCBuZXdWYWx1ZSkpIHtcbiAgICAgIC8vIE5vIGNoYW5nZSB0byBgdmFsdWVWZXJzaW9uYCAtIG9sZCBhbmQgbmV3IHZhbHVlcyBhcmVcbiAgICAgIC8vIHNlbWFudGljYWxseSBlcXVpdmFsZW50LlxuICAgICAgdGhpcy52YWx1ZSA9IG9sZFZhbHVlO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMudmFsdWUgPSBuZXdWYWx1ZTtcbiAgICB0aGlzLnZhbHVlVmVyc2lvbisrO1xuICB9XG5cbiAgc2lnbmFsKCk6IFQge1xuICAgIC8vIENoZWNrIGlmIHRoZSB2YWx1ZSBuZWVkcyB1cGRhdGluZyBiZWZvcmUgcmV0dXJuaW5nIGl0LlxuICAgIHRoaXMub25Qcm9kdWNlclVwZGF0ZVZhbHVlVmVyc2lvbigpO1xuXG4gICAgLy8gUmVjb3JkIHRoYXQgc29tZW9uZSBsb29rZWQgYXQgdGhpcyBzaWduYWwuXG4gICAgdGhpcy5wcm9kdWNlckFjY2Vzc2VkKCk7XG5cbiAgICBpZiAodGhpcy52YWx1ZSA9PT0gRVJST1JFRCkge1xuICAgICAgdGhyb3cgdGhpcy5lcnJvcjtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy52YWx1ZTtcbiAgfVxufVxuIl19