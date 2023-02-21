/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { createSignalFromFunction, defaultEquals } from './api';
import { nextReactiveId, producerAccessed, producerNotifyConsumers } from './graph';
import { WeakRef } from './weak_ref';
/**
 * Backing type for a `SettableSignal`, a mutable reactive value.
 */
class SettableSignalImpl {
    constructor(value, equal) {
        this.value = value;
        this.equal = equal;
        this.id = nextReactiveId();
        this.ref = new WeakRef(this);
        this.consumers = new Map();
        this.valueVersion = 0;
    }
    checkForChangedValue() {
        // Settable signals can only change when set, so there's nothing to check here.
    }
    /**
     * Directly update the value of the signal to a new value, which may or may not be
     * equal to the previous.
     *
     * In the event that `newValue` is semantically equal to the current value, `set` is
     * a no-op.
     */
    set(newValue) {
        if (!this.equal(this.value, newValue)) {
            this.value = newValue;
            this.valueVersion++;
            producerNotifyConsumers(this);
        }
    }
    /**
     * Derive a new value for the signal from its current value using the `updater` function.
     *
     * This is equivalent to calling `set` on the result of running `updater` on the current
     * value.
     */
    update(updater) {
        this.set(updater(this.value));
    }
    /**
     * Calls `mutator` on the current value and assumes that it has been mutated.
     */
    mutate(mutator) {
        // Mutate bypasses equality checks as it's by definition changing the value.
        mutator(this.value);
        this.valueVersion++;
        producerNotifyConsumers(this);
    }
    signal() {
        producerAccessed(this);
        return this.value;
    }
}
/**
 * Create a `Signal` that can be set or updated directly.
 *
 * @developerPreview
 */
export function signal(initialValue, equal = defaultEquals) {
    const signalNode = new SettableSignalImpl(initialValue, equal);
    // Casting here is required for g3.
    const signalFn = createSignalFromFunction(signalNode.signal.bind(signalNode), {
        set: signalNode.set.bind(signalNode),
        update: signalNode.update.bind(signalNode),
        mutate: signalNode.mutate.bind(signalNode),
    });
    return signalFn;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2lnbmFsLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvc2lnbmFscy9zcmMvc2lnbmFsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBQyx3QkFBd0IsRUFBRSxhQUFhLEVBQTBCLE1BQU0sT0FBTyxDQUFDO0FBQ3ZGLE9BQU8sRUFBbUIsY0FBYyxFQUFZLGdCQUFnQixFQUFFLHVCQUF1QixFQUFDLE1BQU0sU0FBUyxDQUFDO0FBQzlHLE9BQU8sRUFBQyxPQUFPLEVBQUMsTUFBTSxZQUFZLENBQUM7QUEwQm5DOztHQUVHO0FBQ0gsTUFBTSxrQkFBa0I7SUFDdEIsWUFBb0IsS0FBUSxFQUFVLEtBQXlCO1FBQTNDLFVBQUssR0FBTCxLQUFLLENBQUc7UUFBVSxVQUFLLEdBQUwsS0FBSyxDQUFvQjtRQUV0RCxPQUFFLEdBQUcsY0FBYyxFQUFFLENBQUM7UUFDdEIsUUFBRyxHQUFHLElBQUksT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3hCLGNBQVMsR0FBRyxJQUFJLEdBQUcsRUFBb0IsQ0FBQztRQUNqRCxpQkFBWSxHQUFHLENBQUMsQ0FBQztJQUxpRCxDQUFDO0lBT25FLG9CQUFvQjtRQUNsQiwrRUFBK0U7SUFDakYsQ0FBQztJQUVEOzs7Ozs7T0FNRztJQUNILEdBQUcsQ0FBQyxRQUFXO1FBQ2IsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxRQUFRLENBQUMsRUFBRTtZQUNyQyxJQUFJLENBQUMsS0FBSyxHQUFHLFFBQVEsQ0FBQztZQUN0QixJQUFJLENBQUMsWUFBWSxFQUFFLENBQUM7WUFDcEIsdUJBQXVCLENBQUMsSUFBSSxDQUFDLENBQUM7U0FDL0I7SUFDSCxDQUFDO0lBRUQ7Ozs7O09BS0c7SUFDSCxNQUFNLENBQUMsT0FBd0I7UUFDN0IsSUFBSSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7SUFDaEMsQ0FBQztJQUVEOztPQUVHO0lBQ0gsTUFBTSxDQUFDLE9BQTJCO1FBQ2hDLDRFQUE0RTtRQUM1RSxPQUFPLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3BCLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQztRQUNwQix1QkFBdUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUNoQyxDQUFDO0lBRUQsTUFBTTtRQUNKLGdCQUFnQixDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3ZCLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQztJQUNwQixDQUFDO0NBQ0Y7QUFFRDs7OztHQUlHO0FBQ0gsTUFBTSxVQUFVLE1BQU0sQ0FDbEIsWUFBZSxFQUFFLFFBQTRCLGFBQWE7SUFDNUQsTUFBTSxVQUFVLEdBQUcsSUFBSSxrQkFBa0IsQ0FBQyxZQUFZLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDL0QsbUNBQW1DO0lBQ25DLE1BQU0sUUFBUSxHQUFHLHdCQUF3QixDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxFQUFFO1FBQzNELEdBQUcsRUFBRSxVQUFVLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUM7UUFDcEMsTUFBTSxFQUFFLFVBQVUsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQztRQUMxQyxNQUFNLEVBQUUsVUFBVSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDO0tBQzNDLENBQWlDLENBQUM7SUFDcEQsT0FBTyxRQUFRLENBQUM7QUFDbEIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge2NyZWF0ZVNpZ25hbEZyb21GdW5jdGlvbiwgZGVmYXVsdEVxdWFscywgU2lnbmFsLCBWYWx1ZUVxdWFsaXR5Rm59IGZyb20gJy4vYXBpJztcbmltcG9ydCB7Q29uc3VtZXJJZCwgRWRnZSwgbmV4dFJlYWN0aXZlSWQsIFByb2R1Y2VyLCBwcm9kdWNlckFjY2Vzc2VkLCBwcm9kdWNlck5vdGlmeUNvbnN1bWVyc30gZnJvbSAnLi9ncmFwaCc7XG5pbXBvcnQge1dlYWtSZWZ9IGZyb20gJy4vd2Vha19yZWYnO1xuXG4vKipcbiAqIEEgYFNpZ25hbGAgd2l0aCBhIHZhbHVlIHRoYXQgY2FuIGJlIG11dGF0ZWQgdmlhIGEgc2V0dGVyIGludGVyZmFjZS5cbiAqXG4gKiBAZGV2ZWxvcGVyUHJldmlld1xuICovXG5leHBvcnQgaW50ZXJmYWNlIFNldHRhYmxlU2lnbmFsPFQ+IGV4dGVuZHMgU2lnbmFsPFQ+IHtcbiAgLyoqXG4gICAqIERpcmVjdGx5IHNldCB0aGUgc2lnbmFsIHRvIGEgbmV3IHZhbHVlLCBhbmQgbm90aWZ5IGFueSBkZXBlbmRlbnRzLlxuICAgKi9cbiAgc2V0KHZhbHVlOiBUKTogdm9pZDtcblxuICAvKipcbiAgICogVXBkYXRlIHRoZSB2YWx1ZSBvZiB0aGUgc2lnbmFsIGJhc2VkIG9uIGl0cyBjdXJyZW50IHZhbHVlLCBhbmRcbiAgICogbm90aWZ5IGFueSBkZXBlbmRlbnRzLlxuICAgKi9cbiAgdXBkYXRlKHVwZGF0ZUZuOiAodmFsdWU6IFQpID0+IFQpOiB2b2lkO1xuXG4gIC8qKlxuICAgKiBVcGRhdGUgdGhlIGN1cnJlbnQgdmFsdWUgYnkgbXV0YXRpbmcgaXQgaW4tcGxhY2UsIGFuZFxuICAgKiBub3RpZnkgYW55IGRlcGVuZGVudHMuXG4gICAqL1xuICBtdXRhdGUobXV0YXRvckZuOiAodmFsdWU6IFQpID0+IHZvaWQpOiB2b2lkO1xufVxuXG4vKipcbiAqIEJhY2tpbmcgdHlwZSBmb3IgYSBgU2V0dGFibGVTaWduYWxgLCBhIG11dGFibGUgcmVhY3RpdmUgdmFsdWUuXG4gKi9cbmNsYXNzIFNldHRhYmxlU2lnbmFsSW1wbDxUPiBpbXBsZW1lbnRzIFByb2R1Y2VyIHtcbiAgY29uc3RydWN0b3IocHJpdmF0ZSB2YWx1ZTogVCwgcHJpdmF0ZSBlcXVhbDogVmFsdWVFcXVhbGl0eUZuPFQ+KSB7fVxuXG4gIHJlYWRvbmx5IGlkID0gbmV4dFJlYWN0aXZlSWQoKTtcbiAgcmVhZG9ubHkgcmVmID0gbmV3IFdlYWtSZWYodGhpcyk7XG4gIHJlYWRvbmx5IGNvbnN1bWVycyA9IG5ldyBNYXA8Q29uc3VtZXJJZCwgRWRnZT4oKTtcbiAgdmFsdWVWZXJzaW9uID0gMDtcblxuICBjaGVja0ZvckNoYW5nZWRWYWx1ZSgpOiB2b2lkIHtcbiAgICAvLyBTZXR0YWJsZSBzaWduYWxzIGNhbiBvbmx5IGNoYW5nZSB3aGVuIHNldCwgc28gdGhlcmUncyBub3RoaW5nIHRvIGNoZWNrIGhlcmUuXG4gIH1cblxuICAvKipcbiAgICogRGlyZWN0bHkgdXBkYXRlIHRoZSB2YWx1ZSBvZiB0aGUgc2lnbmFsIHRvIGEgbmV3IHZhbHVlLCB3aGljaCBtYXkgb3IgbWF5IG5vdCBiZVxuICAgKiBlcXVhbCB0byB0aGUgcHJldmlvdXMuXG4gICAqXG4gICAqIEluIHRoZSBldmVudCB0aGF0IGBuZXdWYWx1ZWAgaXMgc2VtYW50aWNhbGx5IGVxdWFsIHRvIHRoZSBjdXJyZW50IHZhbHVlLCBgc2V0YCBpc1xuICAgKiBhIG5vLW9wLlxuICAgKi9cbiAgc2V0KG5ld1ZhbHVlOiBUKTogdm9pZCB7XG4gICAgaWYgKCF0aGlzLmVxdWFsKHRoaXMudmFsdWUsIG5ld1ZhbHVlKSkge1xuICAgICAgdGhpcy52YWx1ZSA9IG5ld1ZhbHVlO1xuICAgICAgdGhpcy52YWx1ZVZlcnNpb24rKztcbiAgICAgIHByb2R1Y2VyTm90aWZ5Q29uc3VtZXJzKHRoaXMpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBEZXJpdmUgYSBuZXcgdmFsdWUgZm9yIHRoZSBzaWduYWwgZnJvbSBpdHMgY3VycmVudCB2YWx1ZSB1c2luZyB0aGUgYHVwZGF0ZXJgIGZ1bmN0aW9uLlxuICAgKlxuICAgKiBUaGlzIGlzIGVxdWl2YWxlbnQgdG8gY2FsbGluZyBgc2V0YCBvbiB0aGUgcmVzdWx0IG9mIHJ1bm5pbmcgYHVwZGF0ZXJgIG9uIHRoZSBjdXJyZW50XG4gICAqIHZhbHVlLlxuICAgKi9cbiAgdXBkYXRlKHVwZGF0ZXI6ICh2YWx1ZTogVCkgPT4gVCk6IHZvaWQge1xuICAgIHRoaXMuc2V0KHVwZGF0ZXIodGhpcy52YWx1ZSkpO1xuICB9XG5cbiAgLyoqXG4gICAqIENhbGxzIGBtdXRhdG9yYCBvbiB0aGUgY3VycmVudCB2YWx1ZSBhbmQgYXNzdW1lcyB0aGF0IGl0IGhhcyBiZWVuIG11dGF0ZWQuXG4gICAqL1xuICBtdXRhdGUobXV0YXRvcjogKHZhbHVlOiBUKSA9PiB2b2lkKTogdm9pZCB7XG4gICAgLy8gTXV0YXRlIGJ5cGFzc2VzIGVxdWFsaXR5IGNoZWNrcyBhcyBpdCdzIGJ5IGRlZmluaXRpb24gY2hhbmdpbmcgdGhlIHZhbHVlLlxuICAgIG11dGF0b3IodGhpcy52YWx1ZSk7XG4gICAgdGhpcy52YWx1ZVZlcnNpb24rKztcbiAgICBwcm9kdWNlck5vdGlmeUNvbnN1bWVycyh0aGlzKTtcbiAgfVxuXG4gIHNpZ25hbCgpOiBUIHtcbiAgICBwcm9kdWNlckFjY2Vzc2VkKHRoaXMpO1xuICAgIHJldHVybiB0aGlzLnZhbHVlO1xuICB9XG59XG5cbi8qKlxuICogQ3JlYXRlIGEgYFNpZ25hbGAgdGhhdCBjYW4gYmUgc2V0IG9yIHVwZGF0ZWQgZGlyZWN0bHkuXG4gKlxuICogQGRldmVsb3BlclByZXZpZXdcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNpZ25hbDxUPihcbiAgICBpbml0aWFsVmFsdWU6IFQsIGVxdWFsOiBWYWx1ZUVxdWFsaXR5Rm48VD4gPSBkZWZhdWx0RXF1YWxzKTogU2V0dGFibGVTaWduYWw8VD4ge1xuICBjb25zdCBzaWduYWxOb2RlID0gbmV3IFNldHRhYmxlU2lnbmFsSW1wbChpbml0aWFsVmFsdWUsIGVxdWFsKTtcbiAgLy8gQ2FzdGluZyBoZXJlIGlzIHJlcXVpcmVkIGZvciBnMy5cbiAgY29uc3Qgc2lnbmFsRm4gPSBjcmVhdGVTaWduYWxGcm9tRnVuY3Rpb24oc2lnbmFsTm9kZS5zaWduYWwuYmluZChzaWduYWxOb2RlKSwge1xuICAgICAgICAgICAgICAgICAgICAgc2V0OiBzaWduYWxOb2RlLnNldC5iaW5kKHNpZ25hbE5vZGUpLFxuICAgICAgICAgICAgICAgICAgICAgdXBkYXRlOiBzaWduYWxOb2RlLnVwZGF0ZS5iaW5kKHNpZ25hbE5vZGUpLFxuICAgICAgICAgICAgICAgICAgICAgbXV0YXRlOiBzaWduYWxOb2RlLm11dGF0ZS5iaW5kKHNpZ25hbE5vZGUpLFxuICAgICAgICAgICAgICAgICAgIH0pIGFzIHVua25vd24gYXMgU2V0dGFibGVTaWduYWw8VD47XG4gIHJldHVybiBzaWduYWxGbjtcbn1cbiJdfQ==