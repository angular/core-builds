/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { consumerPollValueStatus, nextReactiveId, setActiveConsumer } from './graph';
import { newWeakRef } from './weak_ref';
/**
 * Watches a reactive expression and allows it to be scheduled to re-run
 * when any dependencies notify of a change.
 *
 * `Watch` doesn't run reactive expressions itself, but relies on a consumer-
 * provided scheduling operation to coordinate calling `Watch.run()`.
 */
export class Watch {
    constructor(watch, schedule) {
        this.watch = watch;
        this.schedule = schedule;
        this.id = nextReactiveId();
        this.ref = newWeakRef(this);
        this.producers = new Map();
        this.trackingVersion = 0;
        this.dirty = false;
    }
    notify() {
        if (!this.dirty) {
            this.schedule(this);
        }
        this.dirty = true;
    }
    /**
     * Execute the reactive expression in the context of this `Watch` consumer.
     *
     * Should be called by the user scheduling algorithm when the provided
     * `schedule` hook is called by `Watch`.
     */
    run() {
        this.dirty = false;
        if (this.trackingVersion !== 0 && !consumerPollValueStatus(this)) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2F0Y2guanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9zaWduYWxzL3NyYy93YXRjaC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQVcsdUJBQXVCLEVBQVEsY0FBYyxFQUFjLGlCQUFpQixFQUFDLE1BQU0sU0FBUyxDQUFDO0FBQy9HLE9BQU8sRUFBQyxVQUFVLEVBQUMsTUFBTSxZQUFZLENBQUM7QUFFdEM7Ozs7OztHQU1HO0FBQ0gsTUFBTSxPQUFPLEtBQUs7SUFRaEIsWUFBb0IsS0FBaUIsRUFBVSxRQUFnQztRQUEzRCxVQUFLLEdBQUwsS0FBSyxDQUFZO1FBQVUsYUFBUSxHQUFSLFFBQVEsQ0FBd0I7UUFQdEUsT0FBRSxHQUFHLGNBQWMsRUFBRSxDQUFDO1FBQ3RCLFFBQUcsR0FBRyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDdkIsY0FBUyxHQUFHLElBQUksR0FBRyxFQUFvQixDQUFDO1FBQ2pELG9CQUFlLEdBQUcsQ0FBQyxDQUFDO1FBRVosVUFBSyxHQUFHLEtBQUssQ0FBQztJQUU0RCxDQUFDO0lBRW5GLE1BQU07UUFDSixJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRTtZQUNmLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUM7U0FDckI7UUFDRCxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQztJQUNwQixDQUFDO0lBRUQ7Ozs7O09BS0c7SUFDSCxHQUFHO1FBQ0QsSUFBSSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUM7UUFDbkIsSUFBSSxJQUFJLENBQUMsZUFBZSxLQUFLLENBQUMsSUFBSSxDQUFDLHVCQUF1QixDQUFDLElBQUksQ0FBQyxFQUFFO1lBQ2hFLE9BQU87U0FDUjtRQUVELE1BQU0sWUFBWSxHQUFHLGlCQUFpQixDQUFDLElBQUksQ0FBQyxDQUFDO1FBQzdDLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQztRQUN2QixJQUFJO1lBQ0YsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO1NBQ2Q7Z0JBQVM7WUFDUixpQkFBaUIsQ0FBQyxZQUFZLENBQUMsQ0FBQztTQUNqQztJQUNILENBQUM7Q0FDRiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0NvbnN1bWVyLCBjb25zdW1lclBvbGxWYWx1ZVN0YXR1cywgRWRnZSwgbmV4dFJlYWN0aXZlSWQsIFByb2R1Y2VySWQsIHNldEFjdGl2ZUNvbnN1bWVyfSBmcm9tICcuL2dyYXBoJztcbmltcG9ydCB7bmV3V2Vha1JlZn0gZnJvbSAnLi93ZWFrX3JlZic7XG5cbi8qKlxuICogV2F0Y2hlcyBhIHJlYWN0aXZlIGV4cHJlc3Npb24gYW5kIGFsbG93cyBpdCB0byBiZSBzY2hlZHVsZWQgdG8gcmUtcnVuXG4gKiB3aGVuIGFueSBkZXBlbmRlbmNpZXMgbm90aWZ5IG9mIGEgY2hhbmdlLlxuICpcbiAqIGBXYXRjaGAgZG9lc24ndCBydW4gcmVhY3RpdmUgZXhwcmVzc2lvbnMgaXRzZWxmLCBidXQgcmVsaWVzIG9uIGEgY29uc3VtZXItXG4gKiBwcm92aWRlZCBzY2hlZHVsaW5nIG9wZXJhdGlvbiB0byBjb29yZGluYXRlIGNhbGxpbmcgYFdhdGNoLnJ1bigpYC5cbiAqL1xuZXhwb3J0IGNsYXNzIFdhdGNoIGltcGxlbWVudHMgQ29uc3VtZXIge1xuICByZWFkb25seSBpZCA9IG5leHRSZWFjdGl2ZUlkKCk7XG4gIHJlYWRvbmx5IHJlZiA9IG5ld1dlYWtSZWYodGhpcyk7XG4gIHJlYWRvbmx5IHByb2R1Y2VycyA9IG5ldyBNYXA8UHJvZHVjZXJJZCwgRWRnZT4oKTtcbiAgdHJhY2tpbmdWZXJzaW9uID0gMDtcblxuICBwcml2YXRlIGRpcnR5ID0gZmFsc2U7XG5cbiAgY29uc3RydWN0b3IocHJpdmF0ZSB3YXRjaDogKCkgPT4gdm9pZCwgcHJpdmF0ZSBzY2hlZHVsZTogKHdhdGNoOiBXYXRjaCkgPT4gdm9pZCkge31cblxuICBub3RpZnkoKTogdm9pZCB7XG4gICAgaWYgKCF0aGlzLmRpcnR5KSB7XG4gICAgICB0aGlzLnNjaGVkdWxlKHRoaXMpO1xuICAgIH1cbiAgICB0aGlzLmRpcnR5ID0gdHJ1ZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBFeGVjdXRlIHRoZSByZWFjdGl2ZSBleHByZXNzaW9uIGluIHRoZSBjb250ZXh0IG9mIHRoaXMgYFdhdGNoYCBjb25zdW1lci5cbiAgICpcbiAgICogU2hvdWxkIGJlIGNhbGxlZCBieSB0aGUgdXNlciBzY2hlZHVsaW5nIGFsZ29yaXRobSB3aGVuIHRoZSBwcm92aWRlZFxuICAgKiBgc2NoZWR1bGVgIGhvb2sgaXMgY2FsbGVkIGJ5IGBXYXRjaGAuXG4gICAqL1xuICBydW4oKTogdm9pZCB7XG4gICAgdGhpcy5kaXJ0eSA9IGZhbHNlO1xuICAgIGlmICh0aGlzLnRyYWNraW5nVmVyc2lvbiAhPT0gMCAmJiAhY29uc3VtZXJQb2xsVmFsdWVTdGF0dXModGhpcykpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBwcmV2Q29uc3VtZXIgPSBzZXRBY3RpdmVDb25zdW1lcih0aGlzKTtcbiAgICB0aGlzLnRyYWNraW5nVmVyc2lvbisrO1xuICAgIHRyeSB7XG4gICAgICB0aGlzLndhdGNoKCk7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIHNldEFjdGl2ZUNvbnN1bWVyKHByZXZDb25zdW1lcik7XG4gICAgfVxuICB9XG59XG4iXX0=