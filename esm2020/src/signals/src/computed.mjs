/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { createSignalFromFunction, defaultEquals } from './api';
import { consumerPollValueStatus, nextReactiveId, producerAccessed, producerNotifyConsumers, setActiveConsumer } from './graph';
import { WeakRef } from './weak_ref';
/**
 * Create a computed `Signal` which derives a reactive value from an expression.
 *
 * @developerPreview
 */
export function computed(computation, equal = defaultEquals) {
    const node = new ComputedImpl(computation, equal);
    return createSignalFromFunction(node.signal.bind(node));
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
 * `Computed`s are both `Producer`s and `Consumer`s of reactivity.
 */
class ComputedImpl {
    constructor(computation, equal) {
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
        this.id = nextReactiveId();
        this.ref = new WeakRef(this);
        this.producers = new Map();
        this.consumers = new Map();
        this.trackingVersion = 0;
        this.valueVersion = 0;
    }
    checkForChangedValue() {
        if (!this.stale) {
            // The current value and its version are already up to date.
            return;
        }
        // The current value is stale. Check whether we need to produce a new one.
        if (this.value !== UNSET && this.value !== COMPUTING && !consumerPollValueStatus(this)) {
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
    notify() {
        if (this.stale) {
            // We've already notified consumers that this value has potentially changed.
            return;
        }
        // Record that the currently cached value may be stale.
        this.stale = true;
        // Notify any consumers about the potential change.
        producerNotifyConsumers(this);
    }
    signal() {
        // Check if the value needs updating before returning it.
        this.checkForChangedValue();
        // Record that someone looked at this signal.
        producerAccessed(this);
        if (this.value === ERRORED) {
            throw this.error;
        }
        return this.value;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcHV0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9zaWduYWxzL3NyYy9jb21wdXRlZC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQUMsd0JBQXdCLEVBQUUsYUFBYSxFQUEwQixNQUFNLE9BQU8sQ0FBQztBQUN2RixPQUFPLEVBQXVCLHVCQUF1QixFQUFRLGNBQWMsRUFBWSxnQkFBZ0IsRUFBYyx1QkFBdUIsRUFBRSxpQkFBaUIsRUFBQyxNQUFNLFNBQVMsQ0FBQztBQUNoTCxPQUFPLEVBQUMsT0FBTyxFQUFDLE1BQU0sWUFBWSxDQUFDO0FBRW5DOzs7O0dBSUc7QUFDSCxNQUFNLFVBQVUsUUFBUSxDQUNwQixXQUFvQixFQUFFLFFBQTRCLGFBQWE7SUFDakUsTUFBTSxJQUFJLEdBQUcsSUFBSSxZQUFZLENBQUMsV0FBVyxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQ2xELE9BQU8sd0JBQXdCLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztBQUMxRCxDQUFDO0FBRUQ7OztHQUdHO0FBQ0gsTUFBTSxLQUFLLEdBQVEsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBRW5DOzs7O0dBSUc7QUFDSCxNQUFNLFNBQVMsR0FBUSxNQUFNLENBQUMsV0FBVyxDQUFDLENBQUM7QUFFM0M7Ozs7R0FJRztBQUNILE1BQU0sT0FBTyxHQUFRLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQztBQUV2Qzs7OztHQUlHO0FBQ0gsTUFBTSxZQUFZO0lBOEJoQixZQUFvQixXQUFvQixFQUFVLEtBQTRDO1FBQTFFLGdCQUFXLEdBQVgsV0FBVyxDQUFTO1FBQVUsVUFBSyxHQUFMLEtBQUssQ0FBdUM7UUE3QjlGOzs7O1dBSUc7UUFDSyxVQUFLLEdBQU0sS0FBSyxDQUFDO1FBRXpCOzs7V0FHRztR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QUFLLENBQUM7SUFDcEIsQ0FBQztDQUNGIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7Y3JlYXRlU2lnbmFsRnJvbUZ1bmN0aW9uLCBkZWZhdWx0RXF1YWxzLCBTaWduYWwsIFZhbHVlRXF1YWxpdHlGbn0gZnJvbSAnLi9hcGknO1xuaW1wb3J0IHtDb25zdW1lciwgQ29uc3VtZXJJZCwgY29uc3VtZXJQb2xsVmFsdWVTdGF0dXMsIEVkZ2UsIG5leHRSZWFjdGl2ZUlkLCBQcm9kdWNlciwgcHJvZHVjZXJBY2Nlc3NlZCwgUHJvZHVjZXJJZCwgcHJvZHVjZXJOb3RpZnlDb25zdW1lcnMsIHNldEFjdGl2ZUNvbnN1bWVyfSBmcm9tICcuL2dyYXBoJztcbmltcG9ydCB7V2Vha1JlZn0gZnJvbSAnLi93ZWFrX3JlZic7XG5cbi8qKlxuICogQ3JlYXRlIGEgY29tcHV0ZWQgYFNpZ25hbGAgd2hpY2ggZGVyaXZlcyBhIHJlYWN0aXZlIHZhbHVlIGZyb20gYW4gZXhwcmVzc2lvbi5cbiAqXG4gKiBAZGV2ZWxvcGVyUHJldmlld1xuICovXG5leHBvcnQgZnVuY3Rpb24gY29tcHV0ZWQ8VD4oXG4gICAgY29tcHV0YXRpb246ICgpID0+IFQsIGVxdWFsOiBWYWx1ZUVxdWFsaXR5Rm48VD4gPSBkZWZhdWx0RXF1YWxzKTogU2lnbmFsPFQ+IHtcbiAgY29uc3Qgbm9kZSA9IG5ldyBDb21wdXRlZEltcGwoY29tcHV0YXRpb24sIGVxdWFsKTtcbiAgcmV0dXJuIGNyZWF0ZVNpZ25hbEZyb21GdW5jdGlvbihub2RlLnNpZ25hbC5iaW5kKG5vZGUpKTtcbn1cblxuLyoqXG4gKiBBIGRlZGljYXRlZCBzeW1ib2wgdXNlZCBiZWZvcmUgYSBjb21wdXRlZCB2YWx1ZSBoYXMgYmVlbiBjYWxjdWxhdGVkIGZvciB0aGUgZmlyc3QgdGltZS5cbiAqIEV4cGxpY2l0bHkgdHlwZWQgYXMgYGFueWAgc28gd2UgY2FuIHVzZSBpdCBhcyBzaWduYWwncyB2YWx1ZS5cbiAqL1xuY29uc3QgVU5TRVQ6IGFueSA9IFN5bWJvbCgnVU5TRVQnKTtcblxuLyoqXG4gKiBBIGRlZGljYXRlZCBzeW1ib2wgdXNlZCBpbiBwbGFjZSBvZiBhIGNvbXB1dGVkIHNpZ25hbCB2YWx1ZSB0byBpbmRpY2F0ZSB0aGF0IGEgZ2l2ZW4gY29tcHV0YXRpb25cbiAqIGlzIGluIHByb2dyZXNzLiBVc2VkIHRvIGRldGVjdCBjeWNsZXMgaW4gY29tcHV0YXRpb24gY2hhaW5zLlxuICogRXhwbGljaXRseSB0eXBlZCBhcyBgYW55YCBzbyB3ZSBjYW4gdXNlIGl0IGFzIHNpZ25hbCdzIHZhbHVlLlxuICovXG5jb25zdCBDT01QVVRJTkc6IGFueSA9IFN5bWJvbCgnQ09NUFVUSU5HJyk7XG5cbi8qKlxuICogQSBkZWRpY2F0ZWQgc3ltYm9sIHVzZWQgaW4gcGxhY2Ugb2YgYSBjb21wdXRlZCBzaWduYWwgdmFsdWUgdG8gaW5kaWNhdGUgdGhhdCBhIGdpdmVuIGNvbXB1dGF0aW9uXG4gKiBmYWlsZWQuIFRoZSB0aHJvd24gZXJyb3IgaXMgY2FjaGVkIHVudGlsIHRoZSBjb21wdXRhdGlvbiBnZXRzIGRpcnR5IGFnYWluLlxuICogRXhwbGljaXRseSB0eXBlZCBhcyBgYW55YCBzbyB3ZSBjYW4gdXNlIGl0IGFzIHNpZ25hbCdzIHZhbHVlLlxuICovXG5jb25zdCBFUlJPUkVEOiBhbnkgPSBTeW1ib2woJ0VSUk9SRUQnKTtcblxuLyoqXG4gKiBBIGNvbXB1dGF0aW9uLCB3aGljaCBkZXJpdmVzIGEgdmFsdWUgZnJvbSBhIGRlY2xhcmF0aXZlIHJlYWN0aXZlIGV4cHJlc3Npb24uXG4gKlxuICogYENvbXB1dGVkYHMgYXJlIGJvdGggYFByb2R1Y2VyYHMgYW5kIGBDb25zdW1lcmBzIG9mIHJlYWN0aXZpdHkuXG4gKi9cbmNsYXNzIENvbXB1dGVkSW1wbDxUPiBpbXBsZW1lbnRzIFByb2R1Y2VyLCBDb25zdW1lciB7XG4gIC8qKlxuICAgKiBDdXJyZW50IHZhbHVlIG9mIHRoZSBjb21wdXRhdGlvbi5cbiAgICpcbiAgICogVGhpcyBjYW4gYWxzbyBiZSBvbmUgb2YgdGhlIHNwZWNpYWwgdmFsdWVzIGBVTlNFVGAsIGBDT01QVVRJTkdgLCBvciBgRVJST1JFRGAuXG4gICAqL1xuICBwcml2YXRlIHZhbHVlOiBUID0gVU5TRVQ7XG5cbiAgLyoqXG4gICAqIElmIGB2YWx1ZWAgaXMgYEVSUk9SRURgLCB0aGUgZXJyb3IgY2F1Z2h0IGZyb20gdGhlIGxhc3QgY29tcHV0YXRpb24gYXR0ZW1wdCB3aGljaCB3aWxsXG4gICAqIGJlIHJlLXRocm93bi5cbiAgICovXG4gIHByaXZhdGUgZXJyb3I6IHVua25vd24gPSBudWxsO1xuXG4gIC8qKlxuICAgKiBGbGFnIGluZGljYXRpbmcgdGhhdCB0aGUgY29tcHV0YXRpb24gaXMgY3VycmVudGx5IHN0YWxlLCBtZWFuaW5nIHRoYXQgb25lIG9mIHRoZVxuICAgKiBkZXBlbmRlbmNpZXMgaGFzIG5vdGlmaWVkIG9mIGEgcG90ZW50aWFsIGNoYW5nZS5cbiAgICpcbiAgICogSXQncyBwb3NzaWJsZSB0aGF0IG5vIGRlcGVuZGVuY3kgaGFzIF9hY3R1YWxseV8gY2hhbmdlZCwgaW4gd2hpY2ggY2FzZSB0aGUgYHN0YWxlYFxuICAgKiBzdGF0ZSBjYW4gYmUgcmVzb2x2ZWQgd2l0aG91dCByZWNvbXB1dGluZyB0aGUgdmFsdWUuXG4gICAqL1xuICBwcml2YXRlIHN0YWxlID0gdHJ1ZTtcblxuICByZWFkb25seSBpZCA9IG5leHRSZWFjdGl2ZUlkKCk7XG4gIHJlYWRvbmx5IHJlZiA9IG5ldyBXZWFrUmVmKHRoaXMpO1xuICByZWFkb25seSBwcm9kdWNlcnMgPSBuZXcgTWFwPFByb2R1Y2VySWQsIEVkZ2U+KCk7XG4gIHJlYWRvbmx5IGNvbnN1bWVycyA9IG5ldyBNYXA8Q29uc3VtZXJJZCwgRWRnZT4oKTtcbiAgdHJhY2tpbmdWZXJzaW9uID0gMDtcbiAgdmFsdWVWZXJzaW9uID0gMDtcblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIGNvbXB1dGF0aW9uOiAoKSA9PiBULCBwcml2YXRlIGVxdWFsOiAob2xkVmFsdWU6IFQsIG5ld1ZhbHVlOiBUKSA9PiBib29sZWFuKSB7fVxuXG4gIGNoZWNrRm9yQ2hhbmdlZFZhbHVlKCk6IHZvaWQge1xuICAgIGlmICghdGhpcy5zdGFsZSkge1xuICAgICAgLy8gVGhlIGN1cnJlbnQgdmFsdWUgYW5kIGl0cyB2ZXJzaW9uIGFyZSBhbHJlYWR5IHVwIHRvIGRhdGUuXG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gVGhlIGN1cnJlbnQgdmFsdWUgaXMgc3RhbGUuIENoZWNrIHdoZXRoZXIgd2UgbmVlZCB0byBwcm9kdWNlIGEgbmV3IG9uZS5cblxuICAgIGlmICh0aGlzLnZhbHVlICE9PSBVTlNFVCAmJiB0aGlzLnZhbHVlICE9PSBDT01QVVRJTkcgJiYgIWNvbnN1bWVyUG9sbFZhbHVlU3RhdHVzKHRoaXMpKSB7XG4gICAgICAvLyBFdmVuIHRob3VnaCB3ZSB3ZXJlIHByZXZpb3VzbHkgbm90aWZpZWQgb2YgYSBwb3RlbnRpYWwgZGVwZW5kZW5jeSB1cGRhdGUsIGFsbCBvZlxuICAgICAgLy8gb3VyIGRlcGVuZGVuY2llcyByZXBvcnQgdGhhdCB0aGV5IGhhdmUgbm90IGFjdHVhbGx5IGNoYW5nZWQgaW4gdmFsdWUsIHNvIHdlIGNhblxuICAgICAgLy8gcmVzb2x2ZSB0aGUgc3RhbGUgc3RhdGUgd2l0aG91dCBuZWVkaW5nIHRvIHJlY29tcHV0ZSB0aGUgY3VycmVudCB2YWx1ZS5cbiAgICAgIHRoaXMuc3RhbGUgPSBmYWxzZTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBUaGUgY3VycmVudCB2YWx1ZSBpcyBzdGFsZSwgYW5kIG5lZWRzIHRvIGJlIHJlY29tcHV0ZWQuIEl0IHN0aWxsIG1heSBub3QgY2hhbmdlIC1cbiAgICAvLyB0aGF0IGRlcGVuZHMgb24gd2hldGhlciB0aGUgbmV3bHkgY29tcHV0ZWQgdmFsdWUgaXMgZXF1YWwgdG8gdGhlIG9sZC5cbiAgICB0aGlzLnJlY29tcHV0ZVZhbHVlKCk7XG4gIH1cblxuICBwcml2YXRlIHJlY29tcHV0ZVZhbHVlKCk6IHZvaWQge1xuICAgIGlmICh0aGlzLnZhbHVlID09PSBDT01QVVRJTkcpIHtcbiAgICAgIC8vIE91ciBjb21wdXRhdGlvbiBzb21laG93IGxlZCB0byBhIGN5Y2xpYyByZWFkIG9mIGl0c2VsZi5cbiAgICAgIHRocm93IG5ldyBFcnJvcignRGV0ZWN0ZWQgY3ljbGUgaW4gY29tcHV0YXRpb25zLicpO1xuICAgIH1cblxuICAgIGNvbnN0IG9sZFZhbHVlID0gdGhpcy52YWx1ZTtcbiAgICB0aGlzLnZhbHVlID0gQ09NUFVUSU5HO1xuXG4gICAgLy8gQXMgd2UncmUgcmUtcnVubmluZyB0aGUgY29tcHV0YXRpb24sIHVwZGF0ZSBvdXIgZGVwZW5kZW50IHRyYWNraW5nIHZlcnNpb24gbnVtYmVyLlxuICAgIHRoaXMudHJhY2tpbmdWZXJzaW9uKys7XG4gICAgY29uc3QgcHJldkNvbnN1bWVyID0gc2V0QWN0aXZlQ29uc3VtZXIodGhpcyk7XG4gICAgbGV0IG5ld1ZhbHVlOiBUO1xuICAgIHRyeSB7XG4gICAgICBuZXdWYWx1ZSA9IHRoaXMuY29tcHV0YXRpb24oKTtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIG5ld1ZhbHVlID0gRVJST1JFRDtcbiAgICAgIHRoaXMuZXJyb3IgPSBlcnI7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIHNldEFjdGl2ZUNvbnN1bWVyKHByZXZDb25zdW1lcik7XG4gICAgfVxuXG4gICAgdGhpcy5zdGFsZSA9IGZhbHNlO1xuXG4gICAgaWYgKG9sZFZhbHVlICE9PSBVTlNFVCAmJiBvbGRWYWx1ZSAhPT0gRVJST1JFRCAmJiBuZXdWYWx1ZSAhPT0gRVJST1JFRCAmJlxuICAgICAgICB0aGlzLmVxdWFsKG9sZFZhbHVlLCBuZXdWYWx1ZSkpIHtcbiAgICAgIC8vIE5vIGNoYW5nZSB0byBgdmFsdWVWZXJzaW9uYCAtIG9sZCBhbmQgbmV3IHZhbHVlcyBhcmVcbiAgICAgIC8vIHNlbWFudGljYWxseSBlcXVpdmFsZW50LlxuICAgICAgdGhpcy52YWx1ZSA9IG9sZFZhbHVlO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMudmFsdWUgPSBuZXdWYWx1ZTtcbiAgICB0aGlzLnZhbHVlVmVyc2lvbisrO1xuICB9XG5cbiAgbm90aWZ5KCk6IHZvaWQge1xuICAgIGlmICh0aGlzLnN0YWxlKSB7XG4gICAgICAvLyBXZSd2ZSBhbHJlYWR5IG5vdGlmaWVkIGNvbnN1bWVycyB0aGF0IHRoaXMgdmFsdWUgaGFzIHBvdGVudGlhbGx5IGNoYW5nZWQuXG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gUmVjb3JkIHRoYXQgdGhlIGN1cnJlbnRseSBjYWNoZWQgdmFsdWUgbWF5IGJlIHN0YWxlLlxuICAgIHRoaXMuc3RhbGUgPSB0cnVlO1xuXG4gICAgLy8gTm90aWZ5IGFueSBjb25zdW1lcnMgYWJvdXQgdGhlIHBvdGVudGlhbCBjaGFuZ2UuXG4gICAgcHJvZHVjZXJOb3RpZnlDb25zdW1lcnModGhpcyk7XG4gIH1cblxuICBzaWduYWwoKTogVCB7XG4gICAgLy8gQ2hlY2sgaWYgdGhlIHZhbHVlIG5lZWRzIHVwZGF0aW5nIGJlZm9yZSByZXR1cm5pbmcgaXQuXG4gICAgdGhpcy5jaGVja0ZvckNoYW5nZWRWYWx1ZSgpO1xuXG4gICAgLy8gUmVjb3JkIHRoYXQgc29tZW9uZSBsb29rZWQgYXQgdGhpcyBzaWduYWwuXG4gICAgcHJvZHVjZXJBY2Nlc3NlZCh0aGlzKTtcblxuICAgIGlmICh0aGlzLnZhbHVlID09PSBFUlJPUkVEKSB7XG4gICAgICB0aHJvdyB0aGlzLmVycm9yO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLnZhbHVlO1xuICB9XG59XG4iXX0=