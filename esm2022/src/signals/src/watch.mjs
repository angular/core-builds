/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ReactiveNode, setActiveConsumer } from './graph';
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
            this.watch();
        }
        finally {
            setActiveConsumer(prevConsumer);
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2F0Y2guanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9zaWduYWxzL3NyYy93YXRjaC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQUMsWUFBWSxFQUFFLGlCQUFpQixFQUFDLE1BQU0sU0FBUyxDQUFDO0FBRXhEOzs7Ozs7R0FNRztBQUNILE1BQU0sT0FBTyxLQUFNLFNBQVEsWUFBWTtJQUdyQyxZQUFvQixLQUFpQixFQUFVLFFBQWdDO1FBQzdFLEtBQUssRUFBRSxDQUFDO1FBRFUsVUFBSyxHQUFMLEtBQUssQ0FBWTtRQUFVLGFBQVEsR0FBUixRQUFRLENBQXdCO1FBRnZFLFVBQUssR0FBRyxLQUFLLENBQUM7SUFJdEIsQ0FBQztJQUVELE1BQU07UUFDSixJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRTtZQUNmLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUM7U0FDckI7UUFDRCxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQztJQUNwQixDQUFDO0lBRWtCLGtDQUFrQztRQUNuRCxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7SUFDaEIsQ0FBQztJQUVrQiw0QkFBNEI7UUFDN0MsNkJBQTZCO0lBQy9CLENBQUM7SUFFRDs7Ozs7T0FLRztJQUNILEdBQUc7UUFDRCxJQUFJLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQztRQUNuQixJQUFJLElBQUksQ0FBQyxlQUFlLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLDhCQUE4QixFQUFFLEVBQUU7WUFDeEUsT0FBTztTQUNSO1FBRUQsTUFBTSxZQUFZLEdBQUcsaUJBQWlCLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDN0MsSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDO1FBQ3ZCLElBQUk7WUFDRixJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7U0FDZDtnQkFBUztZQUNSLGlCQUFpQixDQUFDLFlBQVksQ0FBQyxDQUFDO1NBQ2pDO0lBQ0gsQ0FBQztDQUNGIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7UmVhY3RpdmVOb2RlLCBzZXRBY3RpdmVDb25zdW1lcn0gZnJvbSAnLi9ncmFwaCc7XG5cbi8qKlxuICogV2F0Y2hlcyBhIHJlYWN0aXZlIGV4cHJlc3Npb24gYW5kIGFsbG93cyBpdCB0byBiZSBzY2hlZHVsZWQgdG8gcmUtcnVuXG4gKiB3aGVuIGFueSBkZXBlbmRlbmNpZXMgbm90aWZ5IG9mIGEgY2hhbmdlLlxuICpcbiAqIGBXYXRjaGAgZG9lc24ndCBydW4gcmVhY3RpdmUgZXhwcmVzc2lvbnMgaXRzZWxmLCBidXQgcmVsaWVzIG9uIGEgY29uc3VtZXItXG4gKiBwcm92aWRlZCBzY2hlZHVsaW5nIG9wZXJhdGlvbiB0byBjb29yZGluYXRlIGNhbGxpbmcgYFdhdGNoLnJ1bigpYC5cbiAqL1xuZXhwb3J0IGNsYXNzIFdhdGNoIGV4dGVuZHMgUmVhY3RpdmVOb2RlIHtcbiAgcHJpdmF0ZSBkaXJ0eSA9IGZhbHNlO1xuXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgd2F0Y2g6ICgpID0+IHZvaWQsIHByaXZhdGUgc2NoZWR1bGU6ICh3YXRjaDogV2F0Y2gpID0+IHZvaWQpIHtcbiAgICBzdXBlcigpO1xuICB9XG5cbiAgbm90aWZ5KCk6IHZvaWQge1xuICAgIGlmICghdGhpcy5kaXJ0eSkge1xuICAgICAgdGhpcy5zY2hlZHVsZSh0aGlzKTtcbiAgICB9XG4gICAgdGhpcy5kaXJ0eSA9IHRydWU7XG4gIH1cblxuICBwcm90ZWN0ZWQgb3ZlcnJpZGUgb25Db25zdW1lckRlcGVuZGVuY3lNYXlIYXZlQ2hhbmdlZCgpOiB2b2lkIHtcbiAgICB0aGlzLm5vdGlmeSgpO1xuICB9XG5cbiAgcHJvdGVjdGVkIG92ZXJyaWRlIG9uUHJvZHVjZXJVcGRhdGVWYWx1ZVZlcnNpb24oKTogdm9pZCB7XG4gICAgLy8gV2F0Y2hlcyBhcmUgbm90IHByb2R1Y2Vycy5cbiAgfVxuXG4gIC8qKlxuICAgKiBFeGVjdXRlIHRoZSByZWFjdGl2ZSBleHByZXNzaW9uIGluIHRoZSBjb250ZXh0IG9mIHRoaXMgYFdhdGNoYCBjb25zdW1lci5cbiAgICpcbiAgICogU2hvdWxkIGJlIGNhbGxlZCBieSB0aGUgdXNlciBzY2hlZHVsaW5nIGFsZ29yaXRobSB3aGVuIHRoZSBwcm92aWRlZFxuICAgKiBgc2NoZWR1bGVgIGhvb2sgaXMgY2FsbGVkIGJ5IGBXYXRjaGAuXG4gICAqL1xuICBydW4oKTogdm9pZCB7XG4gICAgdGhpcy5kaXJ0eSA9IGZhbHNlO1xuICAgIGlmICh0aGlzLnRyYWNraW5nVmVyc2lvbiAhPT0gMCAmJiAhdGhpcy5jb25zdW1lclBvbGxQcm9kdWNlcnNGb3JDaGFuZ2UoKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHByZXZDb25zdW1lciA9IHNldEFjdGl2ZUNvbnN1bWVyKHRoaXMpO1xuICAgIHRoaXMudHJhY2tpbmdWZXJzaW9uKys7XG4gICAgdHJ5IHtcbiAgICAgIHRoaXMud2F0Y2goKTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgc2V0QWN0aXZlQ29uc3VtZXIocHJldkNvbnN1bWVyKTtcbiAgICB9XG4gIH1cbn1cbiJdfQ==