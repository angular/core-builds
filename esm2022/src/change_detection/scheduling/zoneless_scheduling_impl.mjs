/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ApplicationRef } from '../../application/application_ref';
import { Injectable } from '../../di/injectable';
import { inject } from '../../di/injector_compatibility';
import { makeEnvironmentProviders } from '../../di/provider_collection';
import { PendingTasks } from '../../pending_tasks';
import { scheduleCallback } from '../../util/callback_scheduler';
import { performanceMarkFeature } from '../../util/performance';
import { NgZone, NoopNgZone } from '../../zone/ng_zone';
import { ChangeDetectionScheduler, ZONELESS_ENABLED, ZONELESS_SCHEDULER_DISABLED } from './zoneless_scheduling';
import * as i0 from "../../r3_symbols";
export class ChangeDetectionSchedulerImpl {
    constructor() {
        this.appRef = inject(ApplicationRef);
        this.taskService = inject(PendingTasks);
        this.pendingRenderTaskId = null;
        this.shouldRefreshViews = false;
        this.ngZone = inject(NgZone);
        this.runningTick = false;
        this.cancelScheduledCallback = null;
        this.zonelessEnabled = inject(ZONELESS_ENABLED);
        this.disableScheduling = inject(ZONELESS_SCHEDULER_DISABLED, { optional: true }) ?? false;
        this.zoneIsDefined = typeof Zone !== 'undefined';
        // TODO(atscott): These conditions will need to change when zoneless is the default
        // Instead, they should flip to checking if ZoneJS scheduling is provided
        this.disableScheduling ||= !this.zonelessEnabled &&
            // NoopNgZone without enabling zoneless means no scheduling whatsoever
            (this.ngZone instanceof NoopNgZone ||
                // The same goes for the lack of Zone without enabling zoneless scheduling
                !this.zoneIsDefined);
    }
    notify(type = 0 /* NotificationType.RefreshViews */) {
        // When the only source of notification is an afterRender hook will skip straight to the hooks
        // rather than refreshing views in ApplicationRef.tick
        this.shouldRefreshViews ||= type === 0 /* NotificationType.RefreshViews */;
        if (!this.shouldScheduleTick()) {
            return;
        }
        this.pendingRenderTaskId = this.taskService.add();
        this.cancelScheduledCallback = scheduleCallback(() => {
            this.tick(this.shouldRefreshViews);
        });
    }
    shouldScheduleTick() {
        if (this.disableScheduling) {
            return false;
        }
        // already scheduled or running
        if (this.pendingRenderTaskId !== null || this.runningTick) {
            return false;
        }
        // If we're inside the zone don't bother with scheduler. Zone will stabilize
        // eventually and run change detection.
        if (this.zoneIsDefined && NgZone.isInAngularZone()) {
            return false;
        }
        return true;
    }
    /**
     * Calls ApplicationRef._tick inside the `NgZone`.
     *
     * Calling `tick` directly runs change detection and cancels any change detection that had been
     * scheduled previously.
     *
     * @param shouldRefreshViews Passed directly to `ApplicationRef._tick` and skips straight to
     *     render hooks when `false`.
     */
    tick(shouldRefreshViews) {
        // When ngZone.run below exits, onMicrotaskEmpty may emit if the zone is
        // stable. We want to prevent double ticking so we track whether the tick is
        // already running and skip it if so.
        if (this.runningTick || this.appRef.destroyed) {
            return;
        }
        try {
            this.ngZone.run(() => {
                this.runningTick = true;
                this.appRef._tick(shouldRefreshViews);
            });
        }
        finally {
            this.cleanup();
        }
    }
    ngOnDestroy() {
        this.cleanup();
    }
    cleanup() {
        this.shouldRefreshViews = false;
        this.runningTick = false;
        this.cancelScheduledCallback?.();
        this.cancelScheduledCallback = null;
        // If this is the last task, the service will synchronously emit a stable
        // notification. If there is a subscriber that then acts in a way that
        // tries to notify the scheduler again, we need to be able to respond to
        // schedule a new change detection. Therefore, we should clear the task ID
        // before removing it from the pending tasks (or the tasks service should
        // not synchronously emit stable, similar to how Zone stableness only
        // happens if it's still stable after a microtask).
        if (this.pendingRenderTaskId !== null) {
            const taskId = this.pendingRenderTaskId;
            this.pendingRenderTaskId = null;
            this.taskService.remove(taskId);
        }
    }
    static { this.ɵfac = function ChangeDetectionSchedulerImpl_Factory(t) { return new (t || ChangeDetectionSchedulerImpl)(); }; }
    static { this.ɵprov = /*@__PURE__*/ i0.ɵɵdefineInjectable({ token: ChangeDetectionSchedulerImpl, factory: ChangeDetectionSchedulerImpl.ɵfac, providedIn: 'root' }); }
}
(() => { (typeof ngDevMode === "undefined" || ngDevMode) && i0.setClassMetadata(ChangeDetectionSchedulerImpl, [{
        type: Injectable,
        args: [{ providedIn: 'root' }]
    }], () => [], null); })();
export function provideZonelessChangeDetection() {
    performanceMarkFeature('NgZoneless');
    return makeEnvironmentProviders([
        { provide: ChangeDetectionScheduler, useExisting: ChangeDetectionSchedulerImpl },
        { provide: NgZone, useClass: NoopNgZone },
        { provide: ZONELESS_ENABLED, useValue: true },
    ]);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiem9uZWxlc3Nfc2NoZWR1bGluZ19pbXBsLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvY2hhbmdlX2RldGVjdGlvbi9zY2hlZHVsaW5nL3pvbmVsZXNzX3NjaGVkdWxpbmdfaW1wbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0sbUNBQW1DLENBQUM7QUFDakUsT0FBTyxFQUFDLFVBQVUsRUFBQyxNQUFNLHFCQUFxQixDQUFDO0FBQy9DLE9BQU8sRUFBQyxNQUFNLEVBQUMsTUFBTSxpQ0FBaUMsQ0FBQztBQUV2RCxPQUFPLEVBQUMsd0JBQXdCLEVBQUMsTUFBTSw4QkFBOEIsQ0FBQztBQUN0RSxPQUFPLEVBQUMsWUFBWSxFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFDakQsT0FBTyxFQUFDLGdCQUFnQixFQUFDLE1BQU0sK0JBQStCLENBQUM7QUFDL0QsT0FBTyxFQUFDLHNCQUFzQixFQUFDLE1BQU0sd0JBQXdCLENBQUM7QUFDOUQsT0FBTyxFQUFDLE1BQU0sRUFBRSxVQUFVLEVBQUMsTUFBTSxvQkFBb0IsQ0FBQztBQUV0RCxPQUFPLEVBQUMsd0JBQXdCLEVBQW9CLGdCQUFnQixFQUFFLDJCQUEyQixFQUFDLE1BQU0sdUJBQXVCLENBQUM7O0FBR2hJLE1BQU0sT0FBTyw0QkFBNEI7SUFhdkM7UUFaUSxXQUFNLEdBQUcsTUFBTSxDQUFDLGNBQWMsQ0FBQyxDQUFDO1FBQ2hDLGdCQUFXLEdBQUcsTUFBTSxDQUFDLFlBQVksQ0FBQyxDQUFDO1FBQ25DLHdCQUFtQixHQUFnQixJQUFJLENBQUM7UUFDeEMsdUJBQWtCLEdBQUcsS0FBSyxDQUFDO1FBQ2xCLFdBQU0sR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDakMsZ0JBQVcsR0FBRyxLQUFLLENBQUM7UUFDcEIsNEJBQXVCLEdBQXNC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LG1CQUFtQixLQUFLLElBQUksRUFBRSxDQUFDO1lBQ3RDLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxtQkFBbUIsQ0FBQztZQUN4QyxJQUFJLENBQUMsbUJBQW1CLEdBQUcsSUFBSSxDQUFDO1lBQ2hDLElBQUksQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ2xDLENBQUM7SUFDSCxDQUFDOzZGQXZHVSw0QkFBNEI7dUVBQTVCLDRCQUE0QixXQUE1Qiw0QkFBNEIsbUJBRGhCLE1BQU07O2dGQUNsQiw0QkFBNEI7Y0FEeEMsVUFBVTtlQUFDLEVBQUMsVUFBVSxFQUFFLE1BQU0sRUFBQzs7QUEyR2hDLE1BQU0sVUFBVSw4QkFBOEI7SUFDNUMsc0JBQXNCLENBQUMsWUFBWSxDQUFDLENBQUM7SUFDckMsT0FBTyx3QkFBd0IsQ0FBQztRQUM5QixFQUFDLE9BQU8sRUFBRSx3QkFBd0IsRUFBRSxXQUFXLEVBQUUsNEJBQTRCLEVBQUM7UUFDOUUsRUFBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLFFBQVEsRUFBRSxVQUFVLEVBQUM7UUFDdkMsRUFBQyxPQUFPLEVBQUUsZ0JBQWdCLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBQztLQUM1QyxDQUFDLENBQUM7QUFDTCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7QXBwbGljYXRpb25SZWZ9IGZyb20gJy4uLy4uL2FwcGxpY2F0aW9uL2FwcGxpY2F0aW9uX3JlZic7XG5pbXBvcnQge0luamVjdGFibGV9IGZyb20gJy4uLy4uL2RpL2luamVjdGFibGUnO1xuaW1wb3J0IHtpbmplY3R9IGZyb20gJy4uLy4uL2RpL2luamVjdG9yX2NvbXBhdGliaWxpdHknO1xuaW1wb3J0IHtFbnZpcm9ubWVudFByb3ZpZGVyc30gZnJvbSAnLi4vLi4vZGkvaW50ZXJmYWNlL3Byb3ZpZGVyJztcbmltcG9ydCB7bWFrZUVudmlyb25tZW50UHJvdmlkZXJzfSBmcm9tICcuLi8uLi9kaS9wcm92aWRlcl9jb2xsZWN0aW9uJztcbmltcG9ydCB7UGVuZGluZ1Rhc2tzfSBmcm9tICcuLi8uLi9wZW5kaW5nX3Rhc2tzJztcbmltcG9ydCB7c2NoZWR1bGVDYWxsYmFja30gZnJvbSAnLi4vLi4vdXRpbC9jYWxsYmFja19zY2hlZHVsZXInO1xuaW1wb3J0IHtwZXJmb3JtYW5jZU1hcmtGZWF0dXJlfSBmcm9tICcuLi8uLi91dGlsL3BlcmZvcm1hbmNlJztcbmltcG9ydCB7Tmdab25lLCBOb29wTmdab25lfSBmcm9tICcuLi8uLi96b25lL25nX3pvbmUnO1xuXG5pbXBvcnQge0NoYW5nZURldGVjdGlvblNjaGVkdWxlciwgTm90aWZpY2F0aW9uVHlwZSwgWk9ORUxFU1NfRU5BQkxFRCwgWk9ORUxFU1NfU0NIRURVTEVSX0RJU0FCTEVEfSBmcm9tICcuL3pvbmVsZXNzX3NjaGVkdWxpbmcnO1xuXG5ASW5qZWN0YWJsZSh7cHJvdmlkZWRJbjogJ3Jvb3QnfSlcbmV4cG9ydCBjbGFzcyBDaGFuZ2VEZXRlY3Rpb25TY2hlZHVsZXJJbXBsIGltcGxlbWVudHMgQ2hhbmdlRGV0ZWN0aW9uU2NoZWR1bGVyIHtcbiAgcHJpdmF0ZSBhcHBSZWYgPSBpbmplY3QoQXBwbGljYXRpb25SZWYpO1xuICBwcml2YXRlIHRhc2tTZXJ2aWNlID0gaW5qZWN0KFBlbmRpbmdUYXNrcyk7XG4gIHByaXZhdGUgcGVuZGluZ1JlbmRlclRhc2tJZDogbnVtYmVyfG51bGwgPSBudWxsO1xuICBwcml2YXRlIHNob3VsZFJlZnJlc2hWaWV3cyA9IGZhbHNlO1xuICBwcml2YXRlIHJlYWRvbmx5IG5nWm9uZSA9IGluamVjdChOZ1pvbmUpO1xuICBwcml2YXRlIHJ1bm5pbmdUaWNrID0gZmFsc2U7XG4gIHByaXZhdGUgY2FuY2VsU2NoZWR1bGVkQ2FsbGJhY2s6IG51bGx8KCgpID0+IHZvaWQpID0gbnVsbDtcbiAgcHJpdmF0ZSByZWFkb25seSB6b25lbGVzc0VuYWJsZWQgPSBpbmplY3QoWk9ORUxFU1NfRU5BQkxFRCk7XG4gIHByaXZhdGUgcmVhZG9ubHkgZGlzYWJsZVNjaGVkdWxpbmcgPVxuICAgICAgaW5qZWN0KFpPTkVMRVNTX1NDSEVEVUxFUl9ESVNBQkxFRCwge29wdGlvbmFsOiB0cnVlfSkgPz8gZmFsc2U7XG4gIHByaXZhdGUgcmVhZG9ubHkgem9uZUlzRGVmaW5lZCA9IHR5cGVvZiBab25lICE9PSAndW5kZWZpbmVkJztcblxuICBjb25zdHJ1Y3RvcigpIHtcbiAgICAvLyBUT0RPKGF0c2NvdHQpOiBUaGVzZSBjb25kaXRpb25zIHdpbGwgbmVlZCB0byBjaGFuZ2Ugd2hlbiB6b25lbGVzcyBpcyB0aGUgZGVmYXVsdFxuICAgIC8vIEluc3RlYWQsIHRoZXkgc2hvdWxkIGZsaXAgdG8gY2hlY2tpbmcgaWYgWm9uZUpTIHNjaGVkdWxpbmcgaXMgcHJvdmlkZWRcbiAgICB0aGlzLmRpc2FibGVTY2hlZHVsaW5nIHx8PSAhdGhpcy56b25lbGVzc0VuYWJsZWQgJiZcbiAgICAgICAgLy8gTm9vcE5nWm9uZSB3aXRob3V0IGVuYWJsaW5nIHpvbmVsZXNzIG1lYW5zIG5vIHNjaGVkdWxpbmcgd2hhdHNvZXZlclxuICAgICAgICAodGhpcy5uZ1pvbmUgaW5zdGFuY2VvZiBOb29wTmdab25lIHx8XG4gICAgICAgICAvLyBUaGUgc2FtZSBnb2VzIGZvciB0aGUgbGFjayBvZiBab25lIHdpdGhvdXQgZW5hYmxpbmcgem9uZWxlc3Mgc2NoZWR1bGluZ1xuICAgICAgICAgIXRoaXMuem9uZUlzRGVmaW5lZCk7XG4gIH1cblxuICBub3RpZnkodHlwZSA9IE5vdGlmaWNhdGlvblR5cGUuUmVmcmVzaFZpZXdzKTogdm9pZCB7XG4gICAgLy8gV2hlbiB0aGUgb25seSBzb3VyY2Ugb2Ygbm90aWZpY2F0aW9uIGlzIGFuIGFmdGVyUmVuZGVyIGhvb2sgd2lsbCBza2lwIHN0cmFpZ2h0IHRvIHRoZSBob29rc1xuICAgIC8vIHJhdGhlciB0aGFuIHJlZnJlc2hpbmcgdmlld3MgaW4gQXBwbGljYXRpb25SZWYudGlja1xuICAgIHRoaXMuc2hvdWxkUmVmcmVzaFZpZXdzIHx8PSB0eXBlID09PSBOb3RpZmljYXRpb25UeXBlLlJlZnJlc2hWaWV3cztcblxuICAgIGlmICghdGhpcy5zaG91bGRTY2hlZHVsZVRpY2soKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMucGVuZGluZ1JlbmRlclRhc2tJZCA9IHRoaXMudGFza1NlcnZpY2UuYWRkKCk7XG4gICAgdGhpcy5jYW5jZWxTY2hlZHVsZWRDYWxsYmFjayA9IHNjaGVkdWxlQ2FsbGJhY2soKCkgPT4ge1xuICAgICAgdGhpcy50aWNrKHRoaXMuc2hvdWxkUmVmcmVzaFZpZXdzKTtcbiAgICB9KTtcbiAgfVxuXG4gIHByaXZhdGUgc2hvdWxkU2NoZWR1bGVUaWNrKCk6IGJvb2xlYW4ge1xuICAgIGlmICh0aGlzLmRpc2FibGVTY2hlZHVsaW5nKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIC8vIGFscmVhZHkgc2NoZWR1bGVkIG9yIHJ1bm5pbmdcbiAgICBpZiAodGhpcy5wZW5kaW5nUmVuZGVyVGFza0lkICE9PSBudWxsIHx8IHRoaXMucnVubmluZ1RpY2spIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgLy8gSWYgd2UncmUgaW5zaWRlIHRoZSB6b25lIGRvbid0IGJvdGhlciB3aXRoIHNjaGVkdWxlci4gWm9uZSB3aWxsIHN0YWJpbGl6ZVxuICAgIC8vIGV2ZW50dWFsbHkgYW5kIHJ1biBjaGFuZ2UgZGV0ZWN0aW9uLlxuICAgIGlmICh0aGlzLnpvbmVJc0RlZmluZWQgJiYgTmdab25lLmlzSW5Bbmd1bGFyWm9uZSgpKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICAvKipcbiAgICogQ2FsbHMgQXBwbGljYXRpb25SZWYuX3RpY2sgaW5zaWRlIHRoZSBgTmdab25lYC5cbiAgICpcbiAgICogQ2FsbGluZyBgdGlja2AgZGlyZWN0bHkgcnVucyBjaGFuZ2UgZGV0ZWN0aW9uIGFuZCBjYW5jZWxzIGFueSBjaGFuZ2UgZGV0ZWN0aW9uIHRoYXQgaGFkIGJlZW5cbiAgICogc2NoZWR1bGVkIHByZXZpb3VzbHkuXG4gICAqXG4gICAqIEBwYXJhbSBzaG91bGRSZWZyZXNoVmlld3MgUGFzc2VkIGRpcmVjdGx5IHRvIGBBcHBsaWNhdGlvblJlZi5fdGlja2AgYW5kIHNraXBzIHN0cmFpZ2h0IHRvXG4gICAqICAgICByZW5kZXIgaG9va3Mgd2hlbiBgZmFsc2VgLlxuICAgKi9cbiAgdGljayhzaG91bGRSZWZyZXNoVmlld3M6IGJvb2xlYW4pOiB2b2lkIHtcbiAgICAvLyBXaGVuIG5nWm9uZS5ydW4gYmVsb3cgZXhpdHMsIG9uTWljcm90YXNrRW1wdHkgbWF5IGVtaXQgaWYgdGhlIHpvbmUgaXNcbiAgICAvLyBzdGFibGUuIFdlIHdhbnQgdG8gcHJldmVudCBkb3VibGUgdGlja2luZyBzbyB3ZSB0cmFjayB3aGV0aGVyIHRoZSB0aWNrIGlzXG4gICAgLy8gYWxyZWFkeSBydW5uaW5nIGFuZCBza2lwIGl0IGlmIHNvLlxuICAgIGlmICh0aGlzLnJ1bm5pbmdUaWNrIHx8IHRoaXMuYXBwUmVmLmRlc3Ryb3llZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRyeSB7XG4gICAgICB0aGlzLm5nWm9uZS5ydW4oKCkgPT4ge1xuICAgICAgICB0aGlzLnJ1bm5pbmdUaWNrID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5hcHBSZWYuX3RpY2soc2hvdWxkUmVmcmVzaFZpZXdzKTtcbiAgICAgIH0pO1xuICAgIH0gZmluYWxseSB7XG4gICAgICB0aGlzLmNsZWFudXAoKTtcbiAgICB9XG4gIH1cblxuICBuZ09uRGVzdHJveSgpIHtcbiAgICB0aGlzLmNsZWFudXAoKTtcbiAgfVxuXG4gIHByaXZhdGUgY2xlYW51cCgpIHtcbiAgICB0aGlzLnNob3VsZFJlZnJlc2hWaWV3cyA9IGZhbHNlO1xuICAgIHRoaXMucnVubmluZ1RpY2sgPSBmYWxzZTtcbiAgICB0aGlzLmNhbmNlbFNjaGVkdWxlZENhbGxiYWNrPy4oKTtcbiAgICB0aGlzLmNhbmNlbFNjaGVkdWxlZENhbGxiYWNrID0gbnVsbDtcbiAgICAvLyBJZiB0aGlzIGlzIHRoZSBsYXN0IHRhc2ssIHRoZSBzZXJ2aWNlIHdpbGwgc3luY2hyb25vdXNseSBlbWl0IGEgc3RhYmxlXG4gICAgLy8gbm90aWZpY2F0aW9uLiBJZiB0aGVyZSBpcyBhIHN1YnNjcmliZXIgdGhhdCB0aGVuIGFjdHMgaW4gYSB3YXkgdGhhdFxuICAgIC8vIHRyaWVzIHRvIG5vdGlmeSB0aGUgc2NoZWR1bGVyIGFnYWluLCB3ZSBuZWVkIHRvIGJlIGFibGUgdG8gcmVzcG9uZCB0b1xuICAgIC8vIHNjaGVkdWxlIGEgbmV3IGNoYW5nZSBkZXRlY3Rpb24uIFRoZXJlZm9yZSwgd2Ugc2hvdWxkIGNsZWFyIHRoZSB0YXNrIElEXG4gICAgLy8gYmVmb3JlIHJlbW92aW5nIGl0IGZyb20gdGhlIHBlbmRpbmcgdGFza3MgKG9yIHRoZSB0YXNrcyBzZXJ2aWNlIHNob3VsZFxuICAgIC8vIG5vdCBzeW5jaHJvbm91c2x5IGVtaXQgc3RhYmxlLCBzaW1pbGFyIHRvIGhvdyBab25lIHN0YWJsZW5lc3Mgb25seVxuICAgIC8vIGhhcHBlbnMgaWYgaXQncyBzdGlsbCBzdGFibGUgYWZ0ZXIgYSBtaWNyb3Rhc2spLlxuICAgIGlmICh0aGlzLnBlbmRpbmdSZW5kZXJUYXNrSWQgIT09IG51bGwpIHtcbiAgICAgIGNvbnN0IHRhc2tJZCA9IHRoaXMucGVuZGluZ1JlbmRlclRhc2tJZDtcbiAgICAgIHRoaXMucGVuZGluZ1JlbmRlclRhc2tJZCA9IG51bGw7XG4gICAgICB0aGlzLnRhc2tTZXJ2aWNlLnJlbW92ZSh0YXNrSWQpO1xuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gcHJvdmlkZVpvbmVsZXNzQ2hhbmdlRGV0ZWN0aW9uKCk6IEVudmlyb25tZW50UHJvdmlkZXJzIHtcbiAgcGVyZm9ybWFuY2VNYXJrRmVhdHVyZSgnTmdab25lbGVzcycpO1xuICByZXR1cm4gbWFrZUVudmlyb25tZW50UHJvdmlkZXJzKFtcbiAgICB7cHJvdmlkZTogQ2hhbmdlRGV0ZWN0aW9uU2NoZWR1bGVyLCB1c2VFeGlzdGluZzogQ2hhbmdlRGV0ZWN0aW9uU2NoZWR1bGVySW1wbH0sXG4gICAge3Byb3ZpZGU6IE5nWm9uZSwgdXNlQ2xhc3M6IE5vb3BOZ1pvbmV9LFxuICAgIHtwcm92aWRlOiBaT05FTEVTU19FTkFCTEVELCB1c2VWYWx1ZTogdHJ1ZX0sXG4gIF0pO1xufVxuIl19