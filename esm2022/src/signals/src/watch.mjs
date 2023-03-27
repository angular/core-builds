/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { BaseConsumer, consumerPollValueStatus, setActiveConsumer } from './graph';
/**
 * Watches a reactive expression and allows it to be scheduled to re-run
 * when any dependencies notify of a change.
 *
 * `Watch` doesn't run reactive expressions itself, but relies on a consumer-
 * provided scheduling operation to coordinate calling `Watch.run()`.
 */
export class Watch extends BaseConsumer {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2F0Y2guanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9zaWduYWxzL3NyYy93YXRjaC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQUMsWUFBWSxFQUFFLHVCQUF1QixFQUFFLGlCQUFpQixFQUFDLE1BQU0sU0FBUyxDQUFDO0FBRWpGOzs7Ozs7R0FNRztBQUNILE1BQU0sT0FBTyxLQUFNLFNBQVEsWUFBWTtJQUdyQyxZQUFvQixLQUFpQixFQUFVLFFBQWdDO1FBQzdFLEtBQUssRUFBRSxDQUFDO1FBRFUsVUFBSyxHQUFMLEtBQUssQ0FBWTtRQUFVLGFBQVEsR0FBUixRQUFRLENBQXdCO1FBRnZFLFVBQUssR0FBRyxLQUFLLENBQUM7SUFJdEIsQ0FBQztJQUVRLE1BQU07UUFDYixJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRTtZQUNmLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUM7U0FDckI7UUFDRCxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQztJQUNwQixDQUFDO0lBRUQ7Ozs7O09BS0c7SUFDSCxHQUFHO1FBQ0QsSUFBSSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUM7UUFDbkIsSUFBSSxJQUFJLENBQUMsZUFBZSxLQUFLLENBQUMsSUFBSSxDQUFDLHVCQUF1QixDQUFDLElBQUksQ0FBQyxFQUFFO1lBQ2hFLE9BQU87U0FDUjtRQUVELE1BQU0sWUFBWSxHQUFHLGlCQUFpQixDQUFDLElBQUksQ0FBQyxDQUFDO1FBQzdDLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQztRQUN2QixJQUFJO1lBQ0YsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO1NBQ2Q7Z0JBQVM7WUFDUixpQkFBaUIsQ0FBQyxZQUFZLENBQUMsQ0FBQztTQUNqQztJQUNILENBQUM7Q0FDRiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0Jhc2VDb25zdW1lciwgY29uc3VtZXJQb2xsVmFsdWVTdGF0dXMsIHNldEFjdGl2ZUNvbnN1bWVyfSBmcm9tICcuL2dyYXBoJztcblxuLyoqXG4gKiBXYXRjaGVzIGEgcmVhY3RpdmUgZXhwcmVzc2lvbiBhbmQgYWxsb3dzIGl0IHRvIGJlIHNjaGVkdWxlZCB0byByZS1ydW5cbiAqIHdoZW4gYW55IGRlcGVuZGVuY2llcyBub3RpZnkgb2YgYSBjaGFuZ2UuXG4gKlxuICogYFdhdGNoYCBkb2Vzbid0IHJ1biByZWFjdGl2ZSBleHByZXNzaW9ucyBpdHNlbGYsIGJ1dCByZWxpZXMgb24gYSBjb25zdW1lci1cbiAqIHByb3ZpZGVkIHNjaGVkdWxpbmcgb3BlcmF0aW9uIHRvIGNvb3JkaW5hdGUgY2FsbGluZyBgV2F0Y2gucnVuKClgLlxuICovXG5leHBvcnQgY2xhc3MgV2F0Y2ggZXh0ZW5kcyBCYXNlQ29uc3VtZXIge1xuICBwcml2YXRlIGRpcnR5ID0gZmFsc2U7XG5cbiAgY29uc3RydWN0b3IocHJpdmF0ZSB3YXRjaDogKCkgPT4gdm9pZCwgcHJpdmF0ZSBzY2hlZHVsZTogKHdhdGNoOiBXYXRjaCkgPT4gdm9pZCkge1xuICAgIHN1cGVyKCk7XG4gIH1cblxuICBvdmVycmlkZSBub3RpZnkoKTogdm9pZCB7XG4gICAgaWYgKCF0aGlzLmRpcnR5KSB7XG4gICAgICB0aGlzLnNjaGVkdWxlKHRoaXMpO1xuICAgIH1cbiAgICB0aGlzLmRpcnR5ID0gdHJ1ZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBFeGVjdXRlIHRoZSByZWFjdGl2ZSBleHByZXNzaW9uIGluIHRoZSBjb250ZXh0IG9mIHRoaXMgYFdhdGNoYCBjb25zdW1lci5cbiAgICpcbiAgICogU2hvdWxkIGJlIGNhbGxlZCBieSB0aGUgdXNlciBzY2hlZHVsaW5nIGFsZ29yaXRobSB3aGVuIHRoZSBwcm92aWRlZFxuICAgKiBgc2NoZWR1bGVgIGhvb2sgaXMgY2FsbGVkIGJ5IGBXYXRjaGAuXG4gICAqL1xuICBydW4oKTogdm9pZCB7XG4gICAgdGhpcy5kaXJ0eSA9IGZhbHNlO1xuICAgIGlmICh0aGlzLnRyYWNraW5nVmVyc2lvbiAhPT0gMCAmJiAhY29uc3VtZXJQb2xsVmFsdWVTdGF0dXModGhpcykpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBwcmV2Q29uc3VtZXIgPSBzZXRBY3RpdmVDb25zdW1lcih0aGlzKTtcbiAgICB0aGlzLnRyYWNraW5nVmVyc2lvbisrO1xuICAgIHRyeSB7XG4gICAgICB0aGlzLndhdGNoKCk7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIHNldEFjdGl2ZUNvbnN1bWVyKHByZXZDb25zdW1lcik7XG4gICAgfVxuICB9XG59XG4iXX0=