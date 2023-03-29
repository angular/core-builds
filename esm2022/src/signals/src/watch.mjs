/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ReactiveNode, setActiveConsumer } from './graph';
const NOOP_CLEANUP_FN = () => { };
/**
 * Watches a reactive expression and allows it to be scheduled to re-run
 * when any dependencies notify of a change.
 *
 * `Watch` doesn't run reactive expressions itself, but relies on a consumer-
 * provided scheduling operation to coordinate calling `Watch.run()`.
 */
export class Watch extends ReactiveNode {
    constructor(watch, schedule) {
        super();
        this.watch = watch;
        this.schedule = schedule;
        this.dirty = false;
        this.cleanupFn = NOOP_CLEANUP_FN;
    }
    notify() {
        if (!this.dirty) {
            this.schedule(this);
        }
        this.dirty = true;
    }
    onConsumerDependencyMayHaveChanged() {
        this.notify();
    }
    onProducerUpdateValueVersion() {
        // Watches are not producers.
    }
    /**
     * Execute the reactive expression in the context of this `Watch` consumer.
     *
     * Should be called by the user scheduling algorithm when the provided
     * `schedule` hook is called by `Watch`.
     */
    run() {
        this.dirty = false;
        if (this.trackingVersion !== 0 && !this.consumerPollProducersForChange()) {
            return;
        }
        const prevConsumer = setActiveConsumer(this);
        this.trackingVersion++;
        try {
            this.cleanupFn();
            this.cleanupFn = this.watch() ?? NOOP_CLEANUP_FN;
        }
        finally {
            setActiveConsumer(prevConsumer);
        }
    }
    cleanup() {
        this.cleanupFn();
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2F0Y2guanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9zaWduYWxzL3NyYy93YXRjaC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQUMsWUFBWSxFQUFFLGlCQUFpQixFQUFDLE1BQU0sU0FBUyxDQUFDO0FBUXhELE1BQU0sZUFBZSxHQUFtQixHQUFHLEVBQUUsR0FBRSxDQUFDLENBQUM7QUFFakQ7Ozs7OztHQU1HO0FBQ0gsTUFBTSxPQUFPLEtBQU0sU0FBUSxZQUFZO0lBSXJDLFlBQW9CLEtBQWdDLEVBQVUsUUFBZ0M7UUFDNUYsS0FBSyxFQUFFLENBQUM7UUFEVSxVQUFLLEdBQUwsS0FBSyxDQUEyQjtRQUFVLGFBQVEsR0FBUixRQUFRLENBQXdCO1FBSHRGLFVBQUssR0FBRyxLQUFLLENBQUM7UUFDZCxjQUFTLEdBQUcsZUFBZSxDQUFDO0lBSXBDLENBQUM7SUFFRCxNQUFNO1FBQ0osSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUU7WUFDZixJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDO1NBQ3JCO1FBQ0QsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUM7SUFDcEIsQ0FBQztJQUVrQixrQ0FBa0M7UUFDbkQsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO0lBQ2hCLENBQUM7SUFFa0IsNEJBQTRCO1FBQzdDLDZCQUE2QjtJQUMvQixDQUFDO0lBRUQ7Ozs7O09BS0c7SUFDSCxHQUFHO1FBQ0QsSUFBSSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUM7UUFDbkIsSUFBSSxJQUFJLENBQUMsZUFBZSxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyw4QkFBOEIsRUFBRSxFQUFFO1lBQ3hFLE9BQU87U0FDUjtRQUVELE1BQU0sWUFBWSxHQUFHLGlCQUFpQixDQUFDLElBQUksQ0FBQyxDQUFDO1FBQzdDLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQztRQUN2QixJQUFJO1lBQ0YsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDO1lBQ2pCLElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLEtBQUssRUFBRSxJQUFJLGVBQWUsQ0FBQztTQUNsRDtnQkFBUztZQUNSLGlCQUFpQixDQUFDLFlBQVksQ0FBQyxDQUFDO1NBQ2pDO0lBQ0gsQ0FBQztJQUVELE9BQU87UUFDTCxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUM7SUFDbkIsQ0FBQztDQUNGIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7UmVhY3RpdmVOb2RlLCBzZXRBY3RpdmVDb25zdW1lcn0gZnJvbSAnLi9ncmFwaCc7XG5cbi8qKlxuICogQSBjbGVhbnVwIGZ1bmN0aW9uIHRoYXQgY2FuIGJlIG9wdGlvbmFsbHkgcmV0dXJuZWQgZnJvbSB0aGUgd2F0Y2ggbG9naWMuIFdoZW4gcmV0dXJuZWQsIHRoZVxuICogY2xlYW51cCBsb2dpYyBydW5zIGJlZm9yZSB0aGUgbmV4dCB3YXRjaCBleGVjdXRpb24uXG4gKi9cbmV4cG9ydCB0eXBlIFdhdGNoQ2xlYW51cEZuID0gKCkgPT4gdm9pZDtcblxuY29uc3QgTk9PUF9DTEVBTlVQX0ZOOiBXYXRjaENsZWFudXBGbiA9ICgpID0+IHt9O1xuXG4vKipcbiAqIFdhdGNoZXMgYSByZWFjdGl2ZSBleHByZXNzaW9uIGFuZCBhbGxvd3MgaXQgdG8gYmUgc2NoZWR1bGVkIHRvIHJlLXJ1blxuICogd2hlbiBhbnkgZGVwZW5kZW5jaWVzIG5vdGlmeSBvZiBhIGNoYW5nZS5cbiAqXG4gKiBgV2F0Y2hgIGRvZXNuJ3QgcnVuIHJlYWN0aXZlIGV4cHJlc3Npb25zIGl0c2VsZiwgYnV0IHJlbGllcyBvbiBhIGNvbnN1bWVyLVxuICogcHJvdmlkZWQgc2NoZWR1bGluZyBvcGVyYXRpb24gdG8gY29vcmRpbmF0ZSBjYWxsaW5nIGBXYXRjaC5ydW4oKWAuXG4gKi9cbmV4cG9ydCBjbGFzcyBXYXRjaCBleHRlbmRzIFJlYWN0aXZlTm9kZSB7XG4gIHByaXZhdGUgZGlydHkgPSBmYWxzZTtcbiAgcHJpdmF0ZSBjbGVhbnVwRm4gPSBOT09QX0NMRUFOVVBfRk47XG5cbiAgY29uc3RydWN0b3IocHJpdmF0ZSB3YXRjaDogKCkgPT4gdm9pZHxXYXRjaENsZWFudXBGbiwgcHJpdmF0ZSBzY2hlZHVsZTogKHdhdGNoOiBXYXRjaCkgPT4gdm9pZCkge1xuICAgIHN1cGVyKCk7XG4gIH1cblxuICBub3RpZnkoKTogdm9pZCB7XG4gICAgaWYgKCF0aGlzLmRpcnR5KSB7XG4gICAgICB0aGlzLnNjaGVkdWxlKHRoaXMpO1xuICAgIH1cbiAgICB0aGlzLmRpcnR5ID0gdHJ1ZTtcbiAgfVxuXG4gIHByb3RlY3RlZCBvdmVycmlkZSBvbkNvbnN1bWVyRGVwZW5kZW5jeU1heUhhdmVDaGFuZ2VkKCk6IHZvaWQge1xuICAgIHRoaXMubm90aWZ5KCk7XG4gIH1cblxuICBwcm90ZWN0ZWQgb3ZlcnJpZGUgb25Qcm9kdWNlclVwZGF0ZVZhbHVlVmVyc2lvbigpOiB2b2lkIHtcbiAgICAvLyBXYXRjaGVzIGFyZSBub3QgcHJvZHVjZXJzLlxuICB9XG5cbiAgLyoqXG4gICAqIEV4ZWN1dGUgdGhlIHJlYWN0aXZlIGV4cHJlc3Npb24gaW4gdGhlIGNvbnRleHQgb2YgdGhpcyBgV2F0Y2hgIGNvbnN1bWVyLlxuICAgKlxuICAgKiBTaG91bGQgYmUgY2FsbGVkIGJ5IHRoZSB1c2VyIHNjaGVkdWxpbmcgYWxnb3JpdGhtIHdoZW4gdGhlIHByb3ZpZGVkXG4gICAqIGBzY2hlZHVsZWAgaG9vayBpcyBjYWxsZWQgYnkgYFdhdGNoYC5cbiAgICovXG4gIHJ1bigpOiB2b2lkIHtcbiAgICB0aGlzLmRpcnR5ID0gZmFsc2U7XG4gICAgaWYgKHRoaXMudHJhY2tpbmdWZXJzaW9uICE9PSAwICYmICF0aGlzLmNvbnN1bWVyUG9sbFByb2R1Y2Vyc0ZvckNoYW5nZSgpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgcHJldkNvbnN1bWVyID0gc2V0QWN0aXZlQ29uc3VtZXIodGhpcyk7XG4gICAgdGhpcy50cmFja2luZ1ZlcnNpb24rKztcbiAgICB0cnkge1xuICAgICAgdGhpcy5jbGVhbnVwRm4oKTtcbiAgICAgIHRoaXMuY2xlYW51cEZuID0gdGhpcy53YXRjaCgpID8/IE5PT1BfQ0xFQU5VUF9GTjtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgc2V0QWN0aXZlQ29uc3VtZXIocHJldkNvbnN1bWVyKTtcbiAgICB9XG4gIH1cblxuICBjbGVhbnVwKCkge1xuICAgIHRoaXMuY2xlYW51cEZuKCk7XG4gIH1cbn1cbiJdfQ==