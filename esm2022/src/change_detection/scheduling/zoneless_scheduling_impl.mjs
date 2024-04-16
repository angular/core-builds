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
        this.zoneIsDefined = typeof Zone !== 'undefined' && !!Zone.root.run;
        this.afterTickSubscription = this.appRef.afterTick.subscribe(() => {
            // If the scheduler isn't running a tick but the application ticked, that means
            // someone called ApplicationRef.tick manually. In this case, we should cancel
            // any change detections that had been scheduled so we don't run an extra one.
            if (!this.runningTick) {
                this.cleanup();
            }
        });
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
        if (this.zoneIsDefined) {
            Zone.root.run(() => {
                this.cancelScheduledCallback = scheduleCallback(() => {
                    this.tick(this.shouldRefreshViews);
                }, false /** useNativeTimers */);
            });
        }
        else {
            this.cancelScheduledCallback = scheduleCallback(() => {
                this.tick(this.shouldRefreshViews);
            }, false /** useNativeTimers */);
        }
    }
    shouldScheduleTick() {
        if (this.disableScheduling) {
            return false;
        }
        // already scheduled or running
        if (this.pendingRenderTaskId !== null || this.runningTick || this.appRef._runningTick) {
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
        this.afterTickSubscription.unsubscribe();
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
/**
 * Provides change detection without ZoneJS for the application bootstrapped using
 * `bootstrapApplication`.
 *
 * This function allows you to configure the application to not use the state/state changes of
 * ZoneJS to schedule change detection in the application. This will work when ZoneJS is not present
 * on the page at all or if it exists because something else is using it (either another Angular
 * application which uses ZoneJS for scheduling or some other library that relies on ZoneJS).
 *
 * This can also be added to the `TestBed` providers to configure the test environment to more
 * closely match production behavior. This will help give higher confidence that components are
 * compatible with zoneless change detection.
 *
 * ZoneJS uses browser events to trigger change detection. When using this provider, Angular will
 * instead use Angular APIs to schedule change detection. These APIs include:
 *
 * - `ChangeDetectorRef.markForCheck`
 * - `ComponentRef.setInput`
 * - updating a signal that is read in a template
 * - when bound host or template listeners are triggered
 * - attaching a view that was marked dirty by one of the above
 * - removing a view
 * - registering a render hook (templates are only refreshed if render hooks do one of the above)
 *
 * @usageNotes
 * ```typescript
 * bootstrapApplication(MyApp, {providers: [
 *   provideExperimentalZonelessChangeDetection(),
 * ]});
 * ```
 *
 * This API is experimental. Neither the shape, nor the underlying behavior is stable and can change
 * in patch versions. There are known feature gaps, including the lack of a public zoneless API
 * which prevents the application from serializing too early with SSR.
 *
 * @publicApi
 * @experimental
 * @see {@link bootstrapApplication}
 */
export function provideExperimentalZonelessChangeDetection() {
    performanceMarkFeature('NgZoneless');
    return makeEnvironmentProviders([
        { provide: ChangeDetectionScheduler, useExisting: ChangeDetectionSchedulerImpl },
        { provide: NgZone, useClass: NoopNgZone },
        { provide: ZONELESS_ENABLED, useValue: true },
    ]);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiem9uZWxlc3Nfc2NoZWR1bGluZ19pbXBsLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvY2hhbmdlX2RldGVjdGlvbi9zY2hlZHVsaW5nL3pvbmVsZXNzX3NjaGVkdWxpbmdfaW1wbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0sbUNBQW1DLENBQUM7QUFDakUsT0FBTyxFQUFDLFVBQVUsRUFBQyxNQUFNLHFCQUFxQixDQUFDO0FBQy9DLE9BQU8sRUFBQyxNQUFNLEVBQUMsTUFBTSxpQ0FBaUMsQ0FBQztBQUV2RCxPQUFPLEVBQUMsd0JBQXdCLEVBQUMsTUFBTSw4QkFBOEIsQ0FBQztBQUN0RSxPQUFPLEVBQUMsWUFBWSxFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFDakQsT0FBTyxFQUFDLGdCQUFnQixFQUFDLE1BQU0sK0JBQStCLENBQUM7QUFDL0QsT0FBTyxFQUFDLHNCQUFzQixFQUFDLE1BQU0sd0JBQXdCLENBQUM7QUFDOUQsT0FBTyxFQUFDLE1BQU0sRUFBRSxVQUFVLEVBQUMsTUFBTSxvQkFBb0IsQ0FBQztBQUV0RCxPQUFPLEVBQUMsd0JBQXdCLEVBQW9CLGdCQUFnQixFQUFFLDJCQUEyQixFQUFDLE1BQU0sdUJBQXVCLENBQUM7O0FBR2hJLE1BQU0sT0FBTyw0QkFBNEI7SUFxQnZDO1FBcEJRLFdBQU0sR0FBRyxNQUFNLENBQUMsY0FBYyxDQUFDLENBQUM7UUFDaEMsZ0JBQVcsR0FBRyxNQUFNLENBQUMsWUFBWSxDQUFDLENBQUM7UUFDbkMsd0JBQW1CLEdBQWdCLElBQUksQ0FBQztRQUN4Qyx1QkFBa0IsR0FBRyxLQUFLLENBQUM7UUFDbEIsV0FBTSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUN6QyxnQkFBVyxHQUFHLEtBQUssQ0FBQztRQUNaLDRCQUF1QixHQUFz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QUFVLEVBQUUsTUFBTSxFQUFDOztBQTZIaEM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBc0NHO0FBQ0gsTUFBTSxVQUFVLDBDQUEwQztJQUN4RCxzQkFBc0IsQ0FBQyxZQUFZLENBQUMsQ0FBQztJQUNyQyxPQUFPLHdCQUF3QixDQUFDO1FBQzlCLEVBQUMsT0FBTyxFQUFFLHdCQUF3QixFQUFFLFdBQVcsRUFBRSw0QkFBNEIsRUFBQztRQUM5RSxFQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsUUFBUSxFQUFFLFVBQVUsRUFBQztRQUN2QyxFQUFDLE9BQU8sRUFBRSxnQkFBZ0IsRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFDO0tBQzVDLENBQUMsQ0FBQztBQUNMLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtBcHBsaWNhdGlvblJlZn0gZnJvbSAnLi4vLi4vYXBwbGljYXRpb24vYXBwbGljYXRpb25fcmVmJztcbmltcG9ydCB7SW5qZWN0YWJsZX0gZnJvbSAnLi4vLi4vZGkvaW5qZWN0YWJsZSc7XG5pbXBvcnQge2luamVjdH0gZnJvbSAnLi4vLi4vZGkvaW5qZWN0b3JfY29tcGF0aWJpbGl0eSc7XG5pbXBvcnQge0Vudmlyb25tZW50UHJvdmlkZXJzfSBmcm9tICcuLi8uLi9kaS9pbnRlcmZhY2UvcHJvdmlkZXInO1xuaW1wb3J0IHttYWtlRW52aXJvbm1lbnRQcm92aWRlcnN9IGZyb20gJy4uLy4uL2RpL3Byb3ZpZGVyX2NvbGxlY3Rpb24nO1xuaW1wb3J0IHtQZW5kaW5nVGFza3N9IGZyb20gJy4uLy4uL3BlbmRpbmdfdGFza3MnO1xuaW1wb3J0IHtzY2hlZHVsZUNhbGxiYWNrfSBmcm9tICcuLi8uLi91dGlsL2NhbGxiYWNrX3NjaGVkdWxlcic7XG5pbXBvcnQge3BlcmZvcm1hbmNlTWFya0ZlYXR1cmV9IGZyb20gJy4uLy4uL3V0aWwvcGVyZm9ybWFuY2UnO1xuaW1wb3J0IHtOZ1pvbmUsIE5vb3BOZ1pvbmV9IGZyb20gJy4uLy4uL3pvbmUvbmdfem9uZSc7XG5cbmltcG9ydCB7Q2hhbmdlRGV0ZWN0aW9uU2NoZWR1bGVyLCBOb3RpZmljYXRpb25UeXBlLCBaT05FTEVTU19FTkFCTEVELCBaT05FTEVTU19TQ0hFRFVMRVJfRElTQUJMRUR9IGZyb20gJy4vem9uZWxlc3Nfc2NoZWR1bGluZyc7XG5cbkBJbmplY3RhYmxlKHtwcm92aWRlZEluOiAncm9vdCd9KVxuZXhwb3J0IGNsYXNzIENoYW5nZURldGVjdGlvblNjaGVkdWxlckltcGwgaW1wbGVtZW50cyBDaGFuZ2VEZXRlY3Rpb25TY2hlZHVsZXIge1xuICBwcml2YXRlIGFwcFJlZiA9IGluamVjdChBcHBsaWNhdGlvblJlZik7XG4gIHByaXZhdGUgdGFza1NlcnZpY2UgPSBpbmplY3QoUGVuZGluZ1Rhc2tzKTtcbiAgcHJpdmF0ZSBwZW5kaW5nUmVuZGVyVGFza0lkOiBudW1iZXJ8bnVsbCA9IG51bGw7XG4gIHByaXZhdGUgc2hvdWxkUmVmcmVzaFZpZXdzID0gZmFsc2U7XG4gIHByaXZhdGUgcmVhZG9ubHkgbmdab25lID0gaW5qZWN0KE5nWm9uZSk7XG4gIHJ1bm5pbmdUaWNrID0gZmFsc2U7XG4gIHByaXZhdGUgY2FuY2VsU2NoZWR1bGVkQ2FsbGJhY2s6IG51bGx8KCgpID0+IHZvaWQpID0gbnVsbDtcbiAgcHJpdmF0ZSByZWFkb25seSB6b25lbGVzc0VuYWJsZWQgPSBpbmplY3QoWk9ORUxFU1NfRU5BQkxFRCk7XG4gIHByaXZhdGUgcmVhZG9ubHkgZGlzYWJsZVNjaGVkdWxpbmcgPVxuICAgICAgaW5qZWN0KFpPTkVMRVNTX1NDSEVEVUxFUl9ESVNBQkxFRCwge29wdGlvbmFsOiB0cnVlfSkgPz8gZmFsc2U7XG4gIHByaXZhdGUgcmVhZG9ubHkgem9uZUlzRGVmaW5lZCA9IHR5cGVvZiBab25lICE9PSAndW5kZWZpbmVkJyAmJiAhIVpvbmUucm9vdC5ydW47XG4gIHByaXZhdGUgcmVhZG9ubHkgYWZ0ZXJUaWNrU3Vic2NyaXB0aW9uID0gdGhpcy5hcHBSZWYuYWZ0ZXJUaWNrLnN1YnNjcmliZSgoKSA9PiB7XG4gICAgLy8gSWYgdGhlIHNjaGVkdWxlciBpc24ndCBydW5uaW5nIGEgdGljayBidXQgdGhlIGFwcGxpY2F0aW9uIHRpY2tlZCwgdGhhdCBtZWFuc1xuICAgIC8vIHNvbWVvbmUgY2FsbGVkIEFwcGxpY2F0aW9uUmVmLnRpY2sgbWFudWFsbHkuIEluIHRoaXMgY2FzZSwgd2Ugc2hvdWxkIGNhbmNlbFxuICAgIC8vIGFueSBjaGFuZ2UgZGV0ZWN0aW9ucyB0aGF0IGhhZCBiZWVuIHNjaGVkdWxlZCBzbyB3ZSBkb24ndCBydW4gYW4gZXh0cmEgb25lLlxuICAgIGlmICghdGhpcy5ydW5uaW5nVGljaykge1xuICAgICAgdGhpcy5jbGVhbnVwKCk7XG4gICAgfVxuICB9KTtcblxuICBjb25zdHJ1Y3RvcigpIHtcbiAgICAvLyBUT0RPKGF0c2NvdHQpOiBUaGVzZSBjb25kaXRpb25zIHdpbGwgbmVlZCB0byBjaGFuZ2Ugd2hlbiB6b25lbGVzcyBpcyB0aGUgZGVmYXVsdFxuICAgIC8vIEluc3RlYWQsIHRoZXkgc2hvdWxkIGZsaXAgdG8gY2hlY2tpbmcgaWYgWm9uZUpTIHNjaGVkdWxpbmcgaXMgcHJvdmlkZWRcbiAgICB0aGlzLmRpc2FibGVTY2hlZHVsaW5nIHx8PSAhdGhpcy56b25lbGVzc0VuYWJsZWQgJiZcbiAgICAgICAgLy8gTm9vcE5nWm9uZSB3aXRob3V0IGVuYWJsaW5nIHpvbmVsZXNzIG1lYW5zIG5vIHNjaGVkdWxpbmcgd2hhdHNvZXZlclxuICAgICAgICAodGhpcy5uZ1pvbmUgaW5zdGFuY2VvZiBOb29wTmdab25lIHx8XG4gICAgICAgICAvLyBUaGUgc2FtZSBnb2VzIGZvciB0aGUgbGFjayBvZiBab25lIHdpdGhvdXQgZW5hYmxpbmcgem9uZWxlc3Mgc2NoZWR1bGluZ1xuICAgICAgICAgIXRoaXMuem9uZUlzRGVmaW5lZCk7XG4gIH1cblxuICBub3RpZnkodHlwZSA9IE5vdGlmaWNhdGlvblR5cGUuUmVmcmVzaFZpZXdzKTogdm9pZCB7XG4gICAgLy8gV2hlbiB0aGUgb25seSBzb3VyY2Ugb2Ygbm90aWZpY2F0aW9uIGlzIGFuIGFmdGVyUmVuZGVyIGhvb2sgd2lsbCBza2lwIHN0cmFpZ2h0IHRvIHRoZSBob29rc1xuICAgIC8vIHJhdGhlciB0aGFuIHJlZnJlc2hpbmcgdmlld3MgaW4gQXBwbGljYXRpb25SZWYudGlja1xuICAgIHRoaXMuc2hvdWxkUmVmcmVzaFZpZXdzIHx8PSB0eXBlID09PSBOb3RpZmljYXRpb25UeXBlLlJlZnJlc2hWaWV3cztcblxuICAgIGlmICghdGhpcy5zaG91bGRTY2hlZHVsZVRpY2soKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMucGVuZGluZ1JlbmRlclRhc2tJZCA9IHRoaXMudGFza1NlcnZpY2UuYWRkKCk7XG4gICAgaWYgKHRoaXMuem9uZUlzRGVmaW5lZCkge1xuICAgICAgWm9uZS5yb290LnJ1bigoKSA9PiB7XG4gICAgICAgIHRoaXMuY2FuY2VsU2NoZWR1bGVkQ2FsbGJhY2sgPSBzY2hlZHVsZUNhbGxiYWNrKCgpID0+IHtcbiAgICAgICAgICB0aGlzLnRpY2sodGhpcy5zaG91bGRSZWZyZXNoVmlld3MpO1xuICAgICAgICB9LCBmYWxzZSAvKiogdXNlTmF0aXZlVGltZXJzICovKTtcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmNhbmNlbFNjaGVkdWxlZENhbGxiYWNrID0gc2NoZWR1bGVDYWxsYmFjaygoKSA9PiB7XG4gICAgICAgIHRoaXMudGljayh0aGlzLnNob3VsZFJlZnJlc2hWaWV3cyk7XG4gICAgICB9LCBmYWxzZSAvKiogdXNlTmF0aXZlVGltZXJzICovKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIHNob3VsZFNjaGVkdWxlVGljaygpOiBib29sZWFuIHtcbiAgICBpZiAodGhpcy5kaXNhYmxlU2NoZWR1bGluZykge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICAvLyBhbHJlYWR5IHNjaGVkdWxlZCBvciBydW5uaW5nXG4gICAgaWYgKHRoaXMucGVuZGluZ1JlbmRlclRhc2tJZCAhPT0gbnVsbCB8fCB0aGlzLnJ1bm5pbmdUaWNrIHx8IHRoaXMuYXBwUmVmLl9ydW5uaW5nVGljaykge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICAvLyBJZiB3ZSdyZSBpbnNpZGUgdGhlIHpvbmUgZG9uJ3QgYm90aGVyIHdpdGggc2NoZWR1bGVyLiBab25lIHdpbGwgc3RhYmlsaXplXG4gICAgLy8gZXZlbnR1YWxseSBhbmQgcnVuIGNoYW5nZSBkZXRlY3Rpb24uXG4gICAgaWYgKHRoaXMuem9uZUlzRGVmaW5lZCAmJiBOZ1pvbmUuaXNJbkFuZ3VsYXJab25lKCkpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDYWxscyBBcHBsaWNhdGlvblJlZi5fdGljayBpbnNpZGUgdGhlIGBOZ1pvbmVgLlxuICAgKlxuICAgKiBDYWxsaW5nIGB0aWNrYCBkaXJlY3RseSBydW5zIGNoYW5nZSBkZXRlY3Rpb24gYW5kIGNhbmNlbHMgYW55IGNoYW5nZSBkZXRlY3Rpb24gdGhhdCBoYWQgYmVlblxuICAgKiBzY2hlZHVsZWQgcHJldmlvdXNseS5cbiAgICpcbiAgICogQHBhcmFtIHNob3VsZFJlZnJlc2hWaWV3cyBQYXNzZWQgZGlyZWN0bHkgdG8gYEFwcGxpY2F0aW9uUmVmLl90aWNrYCBhbmQgc2tpcHMgc3RyYWlnaHQgdG9cbiAgICogICAgIHJlbmRlciBob29rcyB3aGVuIGBmYWxzZWAuXG4gICAqL1xuICBwcml2YXRlIHRpY2soc2hvdWxkUmVmcmVzaFZpZXdzOiBib29sZWFuKTogdm9pZCB7XG4gICAgLy8gV2hlbiBuZ1pvbmUucnVuIGJlbG93IGV4aXRzLCBvbk1pY3JvdGFza0VtcHR5IG1heSBlbWl0IGlmIHRoZSB6b25lIGlzXG4gICAgLy8gc3RhYmxlLiBXZSB3YW50IHRvIHByZXZlbnQgZG91YmxlIHRpY2tpbmcgc28gd2UgdHJhY2sgd2hldGhlciB0aGUgdGljayBpc1xuICAgIC8vIGFscmVhZHkgcnVubmluZyBhbmQgc2tpcCBpdCBpZiBzby5cbiAgICBpZiAodGhpcy5ydW5uaW5nVGljayB8fCB0aGlzLmFwcFJlZi5kZXN0cm95ZWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0cnkge1xuICAgICAgdGhpcy5uZ1pvbmUucnVuKCgpID0+IHtcbiAgICAgICAgdGhpcy5ydW5uaW5nVGljayA9IHRydWU7XG4gICAgICAgIHRoaXMuYXBwUmVmLl90aWNrKHNob3VsZFJlZnJlc2hWaWV3cyk7XG4gICAgICB9KTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgdGhpcy5jbGVhbnVwKCk7XG4gICAgfVxuICB9XG5cbiAgbmdPbkRlc3Ryb3koKSB7XG4gICAgdGhpcy5hZnRlclRpY2tTdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcbiAgICB0aGlzLmNsZWFudXAoKTtcbiAgfVxuXG4gIHByaXZhdGUgY2xlYW51cCgpIHtcbiAgICB0aGlzLnNob3VsZFJlZnJlc2hWaWV3cyA9IGZhbHNlO1xuICAgIHRoaXMucnVubmluZ1RpY2sgPSBmYWxzZTtcbiAgICB0aGlzLmNhbmNlbFNjaGVkdWxlZENhbGxiYWNrPy4oKTtcbiAgICB0aGlzLmNhbmNlbFNjaGVkdWxlZENhbGxiYWNrID0gbnVsbDtcbiAgICAvLyBJZiB0aGlzIGlzIHRoZSBsYXN0IHRhc2ssIHRoZSBzZXJ2aWNlIHdpbGwgc3luY2hyb25vdXNseSBlbWl0IGEgc3RhYmxlXG4gICAgLy8gbm90aWZpY2F0aW9uLiBJZiB0aGVyZSBpcyBhIHN1YnNjcmliZXIgdGhhdCB0aGVuIGFjdHMgaW4gYSB3YXkgdGhhdFxuICAgIC8vIHRyaWVzIHRvIG5vdGlmeSB0aGUgc2NoZWR1bGVyIGFnYWluLCB3ZSBuZWVkIHRvIGJlIGFibGUgdG8gcmVzcG9uZCB0b1xuICAgIC8vIHNjaGVkdWxlIGEgbmV3IGNoYW5nZSBkZXRlY3Rpb24uIFRoZXJlZm9yZSwgd2Ugc2hvdWxkIGNsZWFyIHRoZSB0YXNrIElEXG4gICAgLy8gYmVmb3JlIHJlbW92aW5nIGl0IGZyb20gdGhlIHBlbmRpbmcgdGFza3MgKG9yIHRoZSB0YXNrcyBzZXJ2aWNlIHNob3VsZFxuICAgIC8vIG5vdCBzeW5jaHJvbm91c2x5IGVtaXQgc3RhYmxlLCBzaW1pbGFyIHRvIGhvdyBab25lIHN0YWJsZW5lc3Mgb25seVxuICAgIC8vIGhhcHBlbnMgaWYgaXQncyBzdGlsbCBzdGFibGUgYWZ0ZXIgYSBtaWNyb3Rhc2spLlxuICAgIGlmICh0aGlzLnBlbmRpbmdSZW5kZXJUYXNrSWQgIT09IG51bGwpIHtcbiAgICAgIGNvbnN0IHRhc2tJZCA9IHRoaXMucGVuZGluZ1JlbmRlclRhc2tJZDtcbiAgICAgIHRoaXMucGVuZGluZ1JlbmRlclRhc2tJZCA9IG51bGw7XG4gICAgICB0aGlzLnRhc2tTZXJ2aWNlLnJlbW92ZSh0YXNrSWQpO1xuICAgIH1cbiAgfVxufVxuXG5cbi8qKlxuICogUHJvdmlkZXMgY2hhbmdlIGRldGVjdGlvbiB3aXRob3V0IFpvbmVKUyBmb3IgdGhlIGFwcGxpY2F0aW9uIGJvb3RzdHJhcHBlZCB1c2luZ1xuICogYGJvb3RzdHJhcEFwcGxpY2F0aW9uYC5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIGFsbG93cyB5b3UgdG8gY29uZmlndXJlIHRoZSBhcHBsaWNhdGlvbiB0byBub3QgdXNlIHRoZSBzdGF0ZS9zdGF0ZSBjaGFuZ2VzIG9mXG4gKiBab25lSlMgdG8gc2NoZWR1bGUgY2hhbmdlIGRldGVjdGlvbiBpbiB0aGUgYXBwbGljYXRpb24uIFRoaXMgd2lsbCB3b3JrIHdoZW4gWm9uZUpTIGlzIG5vdCBwcmVzZW50XG4gKiBvbiB0aGUgcGFnZSBhdCBhbGwgb3IgaWYgaXQgZXhpc3RzIGJlY2F1c2Ugc29tZXRoaW5nIGVsc2UgaXMgdXNpbmcgaXQgKGVpdGhlciBhbm90aGVyIEFuZ3VsYXJcbiAqIGFwcGxpY2F0aW9uIHdoaWNoIHVzZXMgWm9uZUpTIGZvciBzY2hlZHVsaW5nIG9yIHNvbWUgb3RoZXIgbGlicmFyeSB0aGF0IHJlbGllcyBvbiBab25lSlMpLlxuICpcbiAqIFRoaXMgY2FuIGFsc28gYmUgYWRkZWQgdG8gdGhlIGBUZXN0QmVkYCBwcm92aWRlcnMgdG8gY29uZmlndXJlIHRoZSB0ZXN0IGVudmlyb25tZW50IHRvIG1vcmVcbiAqIGNsb3NlbHkgbWF0Y2ggcHJvZHVjdGlvbiBiZWhhdmlvci4gVGhpcyB3aWxsIGhlbHAgZ2l2ZSBoaWdoZXIgY29uZmlkZW5jZSB0aGF0IGNvbXBvbmVudHMgYXJlXG4gKiBjb21wYXRpYmxlIHdpdGggem9uZWxlc3MgY2hhbmdlIGRldGVjdGlvbi5cbiAqXG4gKiBab25lSlMgdXNlcyBicm93c2VyIGV2ZW50cyB0byB0cmlnZ2VyIGNoYW5nZSBkZXRlY3Rpb24uIFdoZW4gdXNpbmcgdGhpcyBwcm92aWRlciwgQW5ndWxhciB3aWxsXG4gKiBpbnN0ZWFkIHVzZSBBbmd1bGFyIEFQSXMgdG8gc2NoZWR1bGUgY2hhbmdlIGRldGVjdGlvbi4gVGhlc2UgQVBJcyBpbmNsdWRlOlxuICpcbiAqIC0gYENoYW5nZURldGVjdG9yUmVmLm1hcmtGb3JDaGVja2BcbiAqIC0gYENvbXBvbmVudFJlZi5zZXRJbnB1dGBcbiAqIC0gdXBkYXRpbmcgYSBzaWduYWwgdGhhdCBpcyByZWFkIGluIGEgdGVtcGxhdGVcbiAqIC0gd2hlbiBib3VuZCBob3N0IG9yIHRlbXBsYXRlIGxpc3RlbmVycyBhcmUgdHJpZ2dlcmVkXG4gKiAtIGF0dGFjaGluZyBhIHZpZXcgdGhhdCB3YXMgbWFya2VkIGRpcnR5IGJ5IG9uZSBvZiB0aGUgYWJvdmVcbiAqIC0gcmVtb3ZpbmcgYSB2aWV3XG4gKiAtIHJlZ2lzdGVyaW5nIGEgcmVuZGVyIGhvb2sgKHRlbXBsYXRlcyBhcmUgb25seSByZWZyZXNoZWQgaWYgcmVuZGVyIGhvb2tzIGRvIG9uZSBvZiB0aGUgYWJvdmUpXG4gKlxuICogQHVzYWdlTm90ZXNcbiAqIGBgYHR5cGVzY3JpcHRcbiAqIGJvb3RzdHJhcEFwcGxpY2F0aW9uKE15QXBwLCB7cHJvdmlkZXJzOiBbXG4gKiAgIHByb3ZpZGVFeHBlcmltZW50YWxab25lbGVzc0NoYW5nZURldGVjdGlvbigpLFxuICogXX0pO1xuICogYGBgXG4gKlxuICogVGhpcyBBUEkgaXMgZXhwZXJpbWVudGFsLiBOZWl0aGVyIHRoZSBzaGFwZSwgbm9yIHRoZSB1bmRlcmx5aW5nIGJlaGF2aW9yIGlzIHN0YWJsZSBhbmQgY2FuIGNoYW5nZVxuICogaW4gcGF0Y2ggdmVyc2lvbnMuIFRoZXJlIGFyZSBrbm93biBmZWF0dXJlIGdhcHMsIGluY2x1ZGluZyB0aGUgbGFjayBvZiBhIHB1YmxpYyB6b25lbGVzcyBBUElcbiAqIHdoaWNoIHByZXZlbnRzIHRoZSBhcHBsaWNhdGlvbiBmcm9tIHNlcmlhbGl6aW5nIHRvbyBlYXJseSB3aXRoIFNTUi5cbiAqXG4gKiBAcHVibGljQXBpXG4gKiBAZXhwZXJpbWVudGFsXG4gKiBAc2VlIHtAbGluayBib290c3RyYXBBcHBsaWNhdGlvbn1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHByb3ZpZGVFeHBlcmltZW50YWxab25lbGVzc0NoYW5nZURldGVjdGlvbigpOiBFbnZpcm9ubWVudFByb3ZpZGVycyB7XG4gIHBlcmZvcm1hbmNlTWFya0ZlYXR1cmUoJ05nWm9uZWxlc3MnKTtcbiAgcmV0dXJuIG1ha2VFbnZpcm9ubWVudFByb3ZpZGVycyhbXG4gICAge3Byb3ZpZGU6IENoYW5nZURldGVjdGlvblNjaGVkdWxlciwgdXNlRXhpc3Rpbmc6IENoYW5nZURldGVjdGlvblNjaGVkdWxlckltcGx9LFxuICAgIHtwcm92aWRlOiBOZ1pvbmUsIHVzZUNsYXNzOiBOb29wTmdab25lfSxcbiAgICB7cHJvdmlkZTogWk9ORUxFU1NfRU5BQkxFRCwgdXNlVmFsdWU6IHRydWV9LFxuICBdKTtcbn1cbiJdfQ==