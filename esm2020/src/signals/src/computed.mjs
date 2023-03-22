/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { createSignalFromFunction, defaultEquals } from './api';
import { consumerPollValueStatus, nextReactiveId, producerAccessed, producerNotifyConsumers, setActiveConsumer } from './graph';
import { newWeakRef } from './weak_ref';
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
        this.ref = newWeakRef(this);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcHV0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9zaWduYWxzL3NyYy9jb21wdXRlZC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQUMsd0JBQXdCLEVBQUUsYUFBYSxFQUEwQixNQUFNLE9BQU8sQ0FBQztBQUN2RixPQUFPLEVBQXVCLHVCQUF1QixFQUFRLGNBQWMsRUFBWSxnQkFBZ0IsRUFBYyx1QkFBdUIsRUFBRSxpQkFBaUIsRUFBQyxNQUFNLFNBQVMsQ0FBQztBQUNoTCxPQUFPLEVBQUMsVUFBVSxFQUFDLE1BQU0sWUFBWSxDQUFDO0FBRXRDOzs7O0dBSUc7QUFDSCxNQUFNLFVBQVUsUUFBUSxDQUNwQixXQUFvQixFQUFFLFFBQTRCLGFBQWE7SUFDakUsTUFBTSxJQUFJLEdBQUcsSUFBSSxZQUFZLENBQUMsV0FBVyxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQ2xELE9BQU8sd0JBQXdCLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztBQUMxRCxDQUFDO0FBRUQ7OztHQUdHO0FBQ0gsTUFBTSxLQUFLLEdBQVEsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBRW5DOzs7O0dBSUc7QUFDSCxNQUFNLFNBQVMsR0FBUSxNQUFNLENBQUMsV0FBVyxDQUFDLENBQUM7QUFFM0M7Ozs7R0FJRztBQUNILE1BQU0sT0FBTyxHQUFRLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQztBQUV2Qzs7OztHQUlHO0FBQ0gsTUFBTSxZQUFZO0lBOEJoQixZQUFvQixXQUFvQixFQUFVLEtBQTRDO1FBQTFFLGdCQUFXLEdBQVgsV0FBVyxDQUFTO1FBQVUsVUFBSyxHQUFMLEtBQUssQ0FBdUM7UUE3QjlGOzs7O1dBSUc7UUFDSyxVQUFLLEdBQU0sS0FBSyxDQUFDO1FBRXpCOzs7V0FHRztR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QUFDO0lBQ3BCLENBQUM7Q0FDRiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge2NyZWF0ZVNpZ25hbEZyb21GdW5jdGlvbiwgZGVmYXVsdEVxdWFscywgU2lnbmFsLCBWYWx1ZUVxdWFsaXR5Rm59IGZyb20gJy4vYXBpJztcbmltcG9ydCB7Q29uc3VtZXIsIENvbnN1bWVySWQsIGNvbnN1bWVyUG9sbFZhbHVlU3RhdHVzLCBFZGdlLCBuZXh0UmVhY3RpdmVJZCwgUHJvZHVjZXIsIHByb2R1Y2VyQWNjZXNzZWQsIFByb2R1Y2VySWQsIHByb2R1Y2VyTm90aWZ5Q29uc3VtZXJzLCBzZXRBY3RpdmVDb25zdW1lcn0gZnJvbSAnLi9ncmFwaCc7XG5pbXBvcnQge25ld1dlYWtSZWZ9IGZyb20gJy4vd2Vha19yZWYnO1xuXG4vKipcbiAqIENyZWF0ZSBhIGNvbXB1dGVkIGBTaWduYWxgIHdoaWNoIGRlcml2ZXMgYSByZWFjdGl2ZSB2YWx1ZSBmcm9tIGFuIGV4cHJlc3Npb24uXG4gKlxuICogQGRldmVsb3BlclByZXZpZXdcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbXB1dGVkPFQ+KFxuICAgIGNvbXB1dGF0aW9uOiAoKSA9PiBULCBlcXVhbDogVmFsdWVFcXVhbGl0eUZuPFQ+ID0gZGVmYXVsdEVxdWFscyk6IFNpZ25hbDxUPiB7XG4gIGNvbnN0IG5vZGUgPSBuZXcgQ29tcHV0ZWRJbXBsKGNvbXB1dGF0aW9uLCBlcXVhbCk7XG4gIHJldHVybiBjcmVhdGVTaWduYWxGcm9tRnVuY3Rpb24obm9kZS5zaWduYWwuYmluZChub2RlKSk7XG59XG5cbi8qKlxuICogQSBkZWRpY2F0ZWQgc3ltYm9sIHVzZWQgYmVmb3JlIGEgY29tcHV0ZWQgdmFsdWUgaGFzIGJlZW4gY2FsY3VsYXRlZCBmb3IgdGhlIGZpcnN0IHRpbWUuXG4gKiBFeHBsaWNpdGx5IHR5cGVkIGFzIGBhbnlgIHNvIHdlIGNhbiB1c2UgaXQgYXMgc2lnbmFsJ3MgdmFsdWUuXG4gKi9cbmNvbnN0IFVOU0VUOiBhbnkgPSBTeW1ib2woJ1VOU0VUJyk7XG5cbi8qKlxuICogQSBkZWRpY2F0ZWQgc3ltYm9sIHVzZWQgaW4gcGxhY2Ugb2YgYSBjb21wdXRlZCBzaWduYWwgdmFsdWUgdG8gaW5kaWNhdGUgdGhhdCBhIGdpdmVuIGNvbXB1dGF0aW9uXG4gKiBpcyBpbiBwcm9ncmVzcy4gVXNlZCB0byBkZXRlY3QgY3ljbGVzIGluIGNvbXB1dGF0aW9uIGNoYWlucy5cbiAqIEV4cGxpY2l0bHkgdHlwZWQgYXMgYGFueWAgc28gd2UgY2FuIHVzZSBpdCBhcyBzaWduYWwncyB2YWx1ZS5cbiAqL1xuY29uc3QgQ09NUFVUSU5HOiBhbnkgPSBTeW1ib2woJ0NPTVBVVElORycpO1xuXG4vKipcbiAqIEEgZGVkaWNhdGVkIHN5bWJvbCB1c2VkIGluIHBsYWNlIG9mIGEgY29tcHV0ZWQgc2lnbmFsIHZhbHVlIHRvIGluZGljYXRlIHRoYXQgYSBnaXZlbiBjb21wdXRhdGlvblxuICogZmFpbGVkLiBUaGUgdGhyb3duIGVycm9yIGlzIGNhY2hlZCB1bnRpbCB0aGUgY29tcHV0YXRpb24gZ2V0cyBkaXJ0eSBhZ2Fpbi5cbiAqIEV4cGxpY2l0bHkgdHlwZWQgYXMgYGFueWAgc28gd2UgY2FuIHVzZSBpdCBhcyBzaWduYWwncyB2YWx1ZS5cbiAqL1xuY29uc3QgRVJST1JFRDogYW55ID0gU3ltYm9sKCdFUlJPUkVEJyk7XG5cbi8qKlxuICogQSBjb21wdXRhdGlvbiwgd2hpY2ggZGVyaXZlcyBhIHZhbHVlIGZyb20gYSBkZWNsYXJhdGl2ZSByZWFjdGl2ZSBleHByZXNzaW9uLlxuICpcbiAqIGBDb21wdXRlZGBzIGFyZSBib3RoIGBQcm9kdWNlcmBzIGFuZCBgQ29uc3VtZXJgcyBvZiByZWFjdGl2aXR5LlxuICovXG5jbGFzcyBDb21wdXRlZEltcGw8VD4gaW1wbGVtZW50cyBQcm9kdWNlciwgQ29uc3VtZXIge1xuICAvKipcbiAgICogQ3VycmVudCB2YWx1ZSBvZiB0aGUgY29tcHV0YXRpb24uXG4gICAqXG4gICAqIFRoaXMgY2FuIGFsc28gYmUgb25lIG9mIHRoZSBzcGVjaWFsIHZhbHVlcyBgVU5TRVRgLCBgQ09NUFVUSU5HYCwgb3IgYEVSUk9SRURgLlxuICAgKi9cbiAgcHJpdmF0ZSB2YWx1ZTogVCA9IFVOU0VUO1xuXG4gIC8qKlxuICAgKiBJZiBgdmFsdWVgIGlzIGBFUlJPUkVEYCwgdGhlIGVycm9yIGNhdWdodCBmcm9tIHRoZSBsYXN0IGNvbXB1dGF0aW9uIGF0dGVtcHQgd2hpY2ggd2lsbFxuICAgKiBiZSByZS10aHJvd24uXG4gICAqL1xuICBwcml2YXRlIGVycm9yOiB1bmtub3duID0gbnVsbDtcblxuICAvKipcbiAgICogRmxhZyBpbmRpY2F0aW5nIHRoYXQgdGhlIGNvbXB1dGF0aW9uIGlzIGN1cnJlbnRseSBzdGFsZSwgbWVhbmluZyB0aGF0IG9uZSBvZiB0aGVcbiAgICogZGVwZW5kZW5jaWVzIGhhcyBub3RpZmllZCBvZiBhIHBvdGVudGlhbCBjaGFuZ2UuXG4gICAqXG4gICAqIEl0J3MgcG9zc2libGUgdGhhdCBubyBkZXBlbmRlbmN5IGhhcyBfYWN0dWFsbHlfIGNoYW5nZWQsIGluIHdoaWNoIGNhc2UgdGhlIGBzdGFsZWBcbiAgICogc3RhdGUgY2FuIGJlIHJlc29sdmVkIHdpdGhvdXQgcmVjb21wdXRpbmcgdGhlIHZhbHVlLlxuICAgKi9cbiAgcHJpdmF0ZSBzdGFsZSA9IHRydWU7XG5cbiAgcmVhZG9ubHkgaWQgPSBuZXh0UmVhY3RpdmVJZCgpO1xuICByZWFkb25seSByZWYgPSBuZXdXZWFrUmVmKHRoaXMpO1xuICByZWFkb25seSBwcm9kdWNlcnMgPSBuZXcgTWFwPFByb2R1Y2VySWQsIEVkZ2U+KCk7XG4gIHJlYWRvbmx5IGNvbnN1bWVycyA9IG5ldyBNYXA8Q29uc3VtZXJJZCwgRWRnZT4oKTtcbiAgdHJhY2tpbmdWZXJzaW9uID0gMDtcbiAgdmFsdWVWZXJzaW9uID0gMDtcblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIGNvbXB1dGF0aW9uOiAoKSA9PiBULCBwcml2YXRlIGVxdWFsOiAob2xkVmFsdWU6IFQsIG5ld1ZhbHVlOiBUKSA9PiBib29sZWFuKSB7fVxuXG4gIGNoZWNrRm9yQ2hhbmdlZFZhbHVlKCk6IHZvaWQge1xuICAgIGlmICghdGhpcy5zdGFsZSkge1xuICAgICAgLy8gVGhlIGN1cnJlbnQgdmFsdWUgYW5kIGl0cyB2ZXJzaW9uIGFyZSBhbHJlYWR5IHVwIHRvIGRhdGUuXG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gVGhlIGN1cnJlbnQgdmFsdWUgaXMgc3RhbGUuIENoZWNrIHdoZXRoZXIgd2UgbmVlZCB0byBwcm9kdWNlIGEgbmV3IG9uZS5cblxuICAgIGlmICh0aGlzLnZhbHVlICE9PSBVTlNFVCAmJiB0aGlzLnZhbHVlICE9PSBDT01QVVRJTkcgJiYgIWNvbnN1bWVyUG9sbFZhbHVlU3RhdHVzKHRoaXMpKSB7XG4gICAgICAvLyBFdmVuIHRob3VnaCB3ZSB3ZXJlIHByZXZpb3VzbHkgbm90aWZpZWQgb2YgYSBwb3RlbnRpYWwgZGVwZW5kZW5jeSB1cGRhdGUsIGFsbCBvZlxuICAgICAgLy8gb3VyIGRlcGVuZGVuY2llcyByZXBvcnQgdGhhdCB0aGV5IGhhdmUgbm90IGFjdHVhbGx5IGNoYW5nZWQgaW4gdmFsdWUsIHNvIHdlIGNhblxuICAgICAgLy8gcmVzb2x2ZSB0aGUgc3RhbGUgc3RhdGUgd2l0aG91dCBuZWVkaW5nIHRvIHJlY29tcHV0ZSB0aGUgY3VycmVudCB2YWx1ZS5cbiAgICAgIHRoaXMuc3RhbGUgPSBmYWxzZTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBUaGUgY3VycmVudCB2YWx1ZSBpcyBzdGFsZSwgYW5kIG5lZWRzIHRvIGJlIHJlY29tcHV0ZWQuIEl0IHN0aWxsIG1heSBub3QgY2hhbmdlIC1cbiAgICAvLyB0aGF0IGRlcGVuZHMgb24gd2hldGhlciB0aGUgbmV3bHkgY29tcHV0ZWQgdmFsdWUgaXMgZXF1YWwgdG8gdGhlIG9sZC5cbiAgICB0aGlzLnJlY29tcHV0ZVZhbHVlKCk7XG4gIH1cblxuICBwcml2YXRlIHJlY29tcHV0ZVZhbHVlKCk6IHZvaWQge1xuICAgIGlmICh0aGlzLnZhbHVlID09PSBDT01QVVRJTkcpIHtcbiAgICAgIC8vIE91ciBjb21wdXRhdGlvbiBzb21laG93IGxlZCB0byBhIGN5Y2xpYyByZWFkIG9mIGl0c2VsZi5cbiAgICAgIHRocm93IG5ldyBFcnJvcignRGV0ZWN0ZWQgY3ljbGUgaW4gY29tcHV0YXRpb25zLicpO1xuICAgIH1cblxuICAgIGNvbnN0IG9sZFZhbHVlID0gdGhpcy52YWx1ZTtcbiAgICB0aGlzLnZhbHVlID0gQ09NUFVUSU5HO1xuXG4gICAgLy8gQXMgd2UncmUgcmUtcnVubmluZyB0aGUgY29tcHV0YXRpb24sIHVwZGF0ZSBvdXIgZGVwZW5kZW50IHRyYWNraW5nIHZlcnNpb24gbnVtYmVyLlxuICAgIHRoaXMudHJhY2tpbmdWZXJzaW9uKys7XG4gICAgY29uc3QgcHJldkNvbnN1bWVyID0gc2V0QWN0aXZlQ29uc3VtZXIodGhpcyk7XG4gICAgbGV0IG5ld1ZhbHVlOiBUO1xuICAgIHRyeSB7XG4gICAgICBuZXdWYWx1ZSA9IHRoaXMuY29tcHV0YXRpb24oKTtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIG5ld1ZhbHVlID0gRVJST1JFRDtcbiAgICAgIHRoaXMuZXJyb3IgPSBlcnI7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIHNldEFjdGl2ZUNvbnN1bWVyKHByZXZDb25zdW1lcik7XG4gICAgfVxuXG4gICAgdGhpcy5zdGFsZSA9IGZhbHNlO1xuXG4gICAgaWYgKG9sZFZhbHVlICE9PSBVTlNFVCAmJiBvbGRWYWx1ZSAhPT0gRVJST1JFRCAmJiBuZXdWYWx1ZSAhPT0gRVJST1JFRCAmJlxuICAgICAgICB0aGlzLmVxdWFsKG9sZFZhbHVlLCBuZXdWYWx1ZSkpIHtcbiAgICAgIC8vIE5vIGNoYW5nZSB0byBgdmFsdWVWZXJzaW9uYCAtIG9sZCBhbmQgbmV3IHZhbHVlcyBhcmVcbiAgICAgIC8vIHNlbWFudGljYWxseSBlcXVpdmFsZW50LlxuICAgICAgdGhpcy52YWx1ZSA9IG9sZFZhbHVlO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMudmFsdWUgPSBuZXdWYWx1ZTtcbiAgICB0aGlzLnZhbHVlVmVyc2lvbisrO1xuICB9XG5cbiAgbm90aWZ5KCk6IHZvaWQge1xuICAgIGlmICh0aGlzLnN0YWxlKSB7XG4gICAgICAvLyBXZSd2ZSBhbHJlYWR5IG5vdGlmaWVkIGNvbnN1bWVycyB0aGF0IHRoaXMgdmFsdWUgaGFzIHBvdGVudGlhbGx5IGNoYW5nZWQuXG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gUmVjb3JkIHRoYXQgdGhlIGN1cnJlbnRseSBjYWNoZWQgdmFsdWUgbWF5IGJlIHN0YWxlLlxuICAgIHRoaXMuc3RhbGUgPSB0cnVlO1xuXG4gICAgLy8gTm90aWZ5IGFueSBjb25zdW1lcnMgYWJvdXQgdGhlIHBvdGVudGlhbCBjaGFuZ2UuXG4gICAgcHJvZHVjZXJOb3RpZnlDb25zdW1lcnModGhpcyk7XG4gIH1cblxuICBzaWduYWwoKTogVCB7XG4gICAgLy8gQ2hlY2sgaWYgdGhlIHZhbHVlIG5lZWRzIHVwZGF0aW5nIGJlZm9yZSByZXR1cm5pbmcgaXQuXG4gICAgdGhpcy5jaGVja0ZvckNoYW5nZWRWYWx1ZSgpO1xuXG4gICAgLy8gUmVjb3JkIHRoYXQgc29tZW9uZSBsb29rZWQgYXQgdGhpcyBzaWduYWwuXG4gICAgcHJvZHVjZXJBY2Nlc3NlZCh0aGlzKTtcblxuICAgIGlmICh0aGlzLnZhbHVlID09PSBFUlJPUkVEKSB7XG4gICAgICB0aHJvdyB0aGlzLmVycm9yO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLnZhbHVlO1xuICB9XG59XG4iXX0=