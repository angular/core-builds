/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { consumerPollValueStatus, nextReactiveId, setActiveConsumer } from './graph';
import { WeakRef } from './weak_ref';
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
        this.ref = new WeakRef(this);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2F0Y2guanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9zaWduYWxzL3NyYy93YXRjaC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQVcsdUJBQXVCLEVBQVEsY0FBYyxFQUFjLGlCQUFpQixFQUFDLE1BQU0sU0FBUyxDQUFDO0FBQy9HLE9BQU8sRUFBQyxPQUFPLEVBQUMsTUFBTSxZQUFZLENBQUM7QUFFbkM7Ozs7OztHQU1HO0FBQ0gsTUFBTSxPQUFPLEtBQUs7SUFRaEIsWUFBb0IsS0FBaUIsRUFBVSxRQUFnQztRQUEzRCxVQUFLLEdBQUwsS0FBSyxDQUFZO1FBQVUsYUFBUSxHQUFSLFFBQVEsQ0FBd0I7UUFQdEUsT0FBRSxHQUFHLGNBQWMsRUFBRSxDQUFDO1FBQ3RCLFFBQUcsR0FBRyxJQUFJLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUN4QixjQUFTLEdBQUcsSUFBSSxHQUFHLEVBQW9CLENBQUM7UUFDakQsb0JBQWUsR0FBRyxDQUFDLENBQUM7UUFFWixVQUFLLEdBQUcsS0FBSyxDQUFDO0lBRTRELENBQUM7SUFFbkYsTUFBTTtRQUNKLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFO1lBQ2YsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQztTQUNyQjtRQUNELElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDO0lBQ3BCLENBQUM7SUFFRDs7Ozs7T0FLRztJQUNILEdBQUc7UUFDRCxJQUFJLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQztRQUNuQixJQUFJLElBQUksQ0FBQyxlQUFlLEtBQUssQ0FBQyxJQUFJLENBQUMsdUJBQXVCLENBQUMsSUFBSSxDQUFDLEVBQUU7WUFDaEUsT0FBTztTQUNSO1FBRUQsTUFBTSxZQUFZLEdBQUcsaUJBQWlCLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDN0MsSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDO1FBQ3ZCLElBQUk7WUFDRixJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7U0FDZDtnQkFBUztZQUNSLGlCQUFpQixDQUFDLFlBQVksQ0FBQyxDQUFDO1NBQ2pDO0lBQ0gsQ0FBQztDQUNGIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7Q29uc3VtZXIsIGNvbnN1bWVyUG9sbFZhbHVlU3RhdHVzLCBFZGdlLCBuZXh0UmVhY3RpdmVJZCwgUHJvZHVjZXJJZCwgc2V0QWN0aXZlQ29uc3VtZXJ9IGZyb20gJy4vZ3JhcGgnO1xuaW1wb3J0IHtXZWFrUmVmfSBmcm9tICcuL3dlYWtfcmVmJztcblxuLyoqXG4gKiBXYXRjaGVzIGEgcmVhY3RpdmUgZXhwcmVzc2lvbiBhbmQgYWxsb3dzIGl0IHRvIGJlIHNjaGVkdWxlZCB0byByZS1ydW5cbiAqIHdoZW4gYW55IGRlcGVuZGVuY2llcyBub3RpZnkgb2YgYSBjaGFuZ2UuXG4gKlxuICogYFdhdGNoYCBkb2Vzbid0IHJ1biByZWFjdGl2ZSBleHByZXNzaW9ucyBpdHNlbGYsIGJ1dCByZWxpZXMgb24gYSBjb25zdW1lci1cbiAqIHByb3ZpZGVkIHNjaGVkdWxpbmcgb3BlcmF0aW9uIHRvIGNvb3JkaW5hdGUgY2FsbGluZyBgV2F0Y2gucnVuKClgLlxuICovXG5leHBvcnQgY2xhc3MgV2F0Y2ggaW1wbGVtZW50cyBDb25zdW1lciB7XG4gIHJlYWRvbmx5IGlkID0gbmV4dFJlYWN0aXZlSWQoKTtcbiAgcmVhZG9ubHkgcmVmID0gbmV3IFdlYWtSZWYodGhpcyk7XG4gIHJlYWRvbmx5IHByb2R1Y2VycyA9IG5ldyBNYXA8UHJvZHVjZXJJZCwgRWRnZT4oKTtcbiAgdHJhY2tpbmdWZXJzaW9uID0gMDtcblxuICBwcml2YXRlIGRpcnR5ID0gZmFsc2U7XG5cbiAgY29uc3RydWN0b3IocHJpdmF0ZSB3YXRjaDogKCkgPT4gdm9pZCwgcHJpdmF0ZSBzY2hlZHVsZTogKHdhdGNoOiBXYXRjaCkgPT4gdm9pZCkge31cblxuICBub3RpZnkoKTogdm9pZCB7XG4gICAgaWYgKCF0aGlzLmRpcnR5KSB7XG4gICAgICB0aGlzLnNjaGVkdWxlKHRoaXMpO1xuICAgIH1cbiAgICB0aGlzLmRpcnR5ID0gdHJ1ZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBFeGVjdXRlIHRoZSByZWFjdGl2ZSBleHByZXNzaW9uIGluIHRoZSBjb250ZXh0IG9mIHRoaXMgYFdhdGNoYCBjb25zdW1lci5cbiAgICpcbiAgICogU2hvdWxkIGJlIGNhbGxlZCBieSB0aGUgdXNlciBzY2hlZHVsaW5nIGFsZ29yaXRobSB3aGVuIHRoZSBwcm92aWRlZFxuICAgKiBgc2NoZWR1bGVgIGhvb2sgaXMgY2FsbGVkIGJ5IGBXYXRjaGAuXG4gICAqL1xuICBydW4oKTogdm9pZCB7XG4gICAgdGhpcy5kaXJ0eSA9IGZhbHNlO1xuICAgIGlmICh0aGlzLnRyYWNraW5nVmVyc2lvbiAhPT0gMCAmJiAhY29uc3VtZXJQb2xsVmFsdWVTdGF0dXModGhpcykpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBwcmV2Q29uc3VtZXIgPSBzZXRBY3RpdmVDb25zdW1lcih0aGlzKTtcbiAgICB0aGlzLnRyYWNraW5nVmVyc2lvbisrO1xuICAgIHRyeSB7XG4gICAgICB0aGlzLndhdGNoKCk7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIHNldEFjdGl2ZUNvbnN1bWVyKHByZXZDb25zdW1lcik7XG4gICAgfVxuICB9XG59XG4iXX0=