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
import { RuntimeError } from '../../errors';
import { PendingTasks } from '../../pending_tasks';
import { scheduleCallbackWithMicrotask, scheduleCallbackWithRafRace } from '../../util/callback_scheduler';
import { performanceMarkFeature } from '../../util/performance';
import { NgZone, NoopNgZone } from '../../zone/ng_zone';
import { ChangeDetectionScheduler, ZONELESS_ENABLED, ZONELESS_SCHEDULER_DISABLED } from './zoneless_scheduling';
import * as i0 from "../../r3_symbols";
const CONSECUTIVE_MICROTASK_NOTIFICATION_LIMIT = 100;
let consecutiveMicrotaskNotifications = 0;
let stackFromLastFewNotifications = [];
function trackMicrotaskNotificationForDebugging() {
    consecutiveMicrotaskNotifications++;
    if (CONSECUTIVE_MICROTASK_NOTIFICATION_LIMIT - consecutiveMicrotaskNotifications < 5) {
        const stack = new Error().stack;
        if (stack) {
            stackFromLastFewNotifications.push(stack);
        }
    }
    if (consecutiveMicrotaskNotifications === CONSECUTIVE_MICROTASK_NOTIFICATION_LIMIT) {
        throw new RuntimeError(103 /* RuntimeErrorCode.INFINITE_CHANGE_DETECTION */, 'Angular could not stabilize because there were endless change notifications within the browser event loop. ' +
            'The stack from the last several notifications: \n' +
            stackFromLastFewNotifications.join('\n'));
    }
}
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
        this.schedulerTickApplyArgs = [{ data: { '__scheduler_tick__': true } }];
        this.afterTickSubscription = this.appRef.afterTick.subscribe(() => {
            // If the scheduler isn't running a tick but the application ticked, that means
            // someone called ApplicationRef.tick manually. In this case, we should cancel
            // any change detections that had been scheduled so we don't run an extra one.
            if (!this.runningTick) {
                this.cleanup();
            }
        });
        this.useMicrotaskScheduler = false;
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
        if ((typeof ngDevMode === 'undefined' || ngDevMode)) {
            if (this.useMicrotaskScheduler) {
                trackMicrotaskNotificationForDebugging();
            }
            else {
                consecutiveMicrotaskNotifications = 0;
                stackFromLastFewNotifications.length = 0;
            }
        }
        const scheduleCallback = this.useMicrotaskScheduler ? scheduleCallbackWithMicrotask : scheduleCallbackWithRafRace;
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
        const task = this.taskService.add();
        try {
            this.ngZone.run(() => {
                this.runningTick = true;
                this.appRef._tick(shouldRefreshViews);
            }, undefined, this.schedulerTickApplyArgs);
        }
        catch (e) {
            this.taskService.remove(task);
            throw e;
        }
        finally {
            this.cleanup();
        }
        // If we're notified of a change within 1 microtask of running change
        // detection, run another round in the same event loop. This allows code
        // which uses Promise.resolve (see NgModel) to avoid
        // ExpressionChanged...Error to still be reflected in a single browser
        // paint, even if that spans multiple rounds of change detection.
        this.useMicrotaskScheduler = true;
        scheduleCallbackWithMicrotask(() => {
            this.useMicrotaskScheduler = false;
            this.taskService.remove(task);
        });
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
 * in patch versions. There are known feature gaps and API ergonomic considerations. We will iterate
 * on the exact API based on the feedback and our understanding of the problem and solution space.
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiem9uZWxlc3Nfc2NoZWR1bGluZ19pbXBsLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvY2hhbmdlX2RldGVjdGlvbi9zY2hlZHVsaW5nL3pvbmVsZXNzX3NjaGVkdWxpbmdfaW1wbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0sbUNBQW1DLENBQUM7QUFDakUsT0FBTyxFQUFDLFVBQVUsRUFBQyxNQUFNLHFCQUFxQixDQUFDO0FBQy9DLE9BQU8sRUFBQyxNQUFNLEVBQUMsTUFBTSxpQ0FBaUMsQ0FBQztBQUV2RCxPQUFPLEVBQUMsd0JBQXdCLEVBQUMsTUFBTSw4QkFBOEIsQ0FBQztBQUN0RSxPQUFPLEVBQUMsWUFBWSxFQUFtQixNQUFNLGNBQWMsQ0FBQztBQUM1RCxPQUFPLEVBQUMsWUFBWSxFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFDakQsT0FBTyxFQUFDLDZCQUE2QixFQUFFLDJCQUEyQixFQUFDLE1BQU0sK0JBQStCLENBQUM7QUFDekcsT0FBTyxFQUFDLHNCQUFzQixFQUFDLE1BQU0sd0JBQXdCLENBQUM7QUFDOUQsT0FBTyxFQUFDLE1BQU0sRUFBRSxVQUFVLEVBQUMsTUFBTSxvQkFBb0IsQ0FBQztBQUV0RCxPQUFPLEVBQUMsd0JBQXdCLEVBQW9CLGdCQUFnQixFQUFFLDJCQUEyQixFQUFDLE1BQU0sdUJBQXVCLENBQUM7O0FBRWhJLE1BQU0sd0NBQXdDLEdBQUcsR0FBRyxDQUFDO0FBQ3JELElBQUksaUNBQWlDLEdBQUcsQ0FBQyxDQUFDO0FBQzFDLElBQUksNkJBQTZCLEdBQWEsRUFBRSxDQUFDO0FBRWpELFNBQVMsc0NBQXNDO0lBQzdDLGlDQUFpQyxFQUFFLENBQUM7SUFDcEMsSUFBSSx3Q0FBd0MsR0FBRyxpQ0FBaUMsR0FBRyxDQUFDLEVBQUUsQ0FBQztRQUNyRixNQUFN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QWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7QXBwbGljYXRpb25SZWZ9IGZyb20gJy4uLy4uL2FwcGxpY2F0aW9uL2FwcGxpY2F0aW9uX3JlZic7XG5pbXBvcnQge0luamVjdGFibGV9IGZyb20gJy4uLy4uL2RpL2luamVjdGFibGUnO1xuaW1wb3J0IHtpbmplY3R9IGZyb20gJy4uLy4uL2RpL2luamVjdG9yX2NvbXBhdGliaWxpdHknO1xuaW1wb3J0IHtFbnZpcm9ubWVudFByb3ZpZGVyc30gZnJvbSAnLi4vLi4vZGkvaW50ZXJmYWNlL3Byb3ZpZGVyJztcbmltcG9ydCB7bWFrZUVudmlyb25tZW50UHJvdmlkZXJzfSBmcm9tICcuLi8uLi9kaS9wcm92aWRlcl9jb2xsZWN0aW9uJztcbmltcG9ydCB7UnVudGltZUVycm9yLCBSdW50aW1lRXJyb3JDb2RlfSBmcm9tICcuLi8uLi9lcnJvcnMnO1xuaW1wb3J0IHtQZW5kaW5nVGFza3N9IGZyb20gJy4uLy4uL3BlbmRpbmdfdGFza3MnO1xuaW1wb3J0IHtzY2hlZHVsZUNhbGxiYWNrV2l0aE1pY3JvdGFzaywgc2NoZWR1bGVDYWxsYmFja1dpdGhSYWZSYWNlfSBmcm9tICcuLi8uLi91dGlsL2NhbGxiYWNrX3NjaGVkdWxlcic7XG5pbXBvcnQge3BlcmZvcm1hbmNlTWFya0ZlYXR1cmV9IGZyb20gJy4uLy4uL3V0aWwvcGVyZm9ybWFuY2UnO1xuaW1wb3J0IHtOZ1pvbmUsIE5vb3BOZ1pvbmV9IGZyb20gJy4uLy4uL3pvbmUvbmdfem9uZSc7XG5cbmltcG9ydCB7Q2hhbmdlRGV0ZWN0aW9uU2NoZWR1bGVyLCBOb3RpZmljYXRpb25UeXBlLCBaT05FTEVTU19FTkFCTEVELCBaT05FTEVTU19TQ0hFRFVMRVJfRElTQUJMRUR9IGZyb20gJy4vem9uZWxlc3Nfc2NoZWR1bGluZyc7XG5cbmNvbnN0IENPTlNFQ1VUSVZFX01JQ1JPVEFTS19OT1RJRklDQVRJT05fTElNSVQgPSAxMDA7XG5sZXQgY29uc2VjdXRpdmVNaWNyb3Rhc2tOb3RpZmljYXRpb25zID0gMDtcbmxldCBzdGFja0Zyb21MYXN0RmV3Tm90aWZpY2F0aW9uczogc3RyaW5nW10gPSBbXTtcblxuZnVuY3Rpb24gdHJhY2tNaWNyb3Rhc2tOb3RpZmljYXRpb25Gb3JEZWJ1Z2dpbmcoKSB7XG4gIGNvbnNlY3V0aXZlTWljcm90YXNrTm90aWZpY2F0aW9ucysrO1xuICBpZiAoQ09OU0VDVVRJVkVfTUlDUk9UQVNLX05PVElGSUNBVElPTl9MSU1JVCAtIGNvbnNlY3V0aXZlTWljcm90YXNrTm90aWZpY2F0aW9ucyA8IDUpIHtcbiAgICBjb25zdCBzdGFjayA9IG5ldyBFcnJvcigpLnN0YWNrO1xuICAgIGlmIChzdGFjaykge1xuICAgICAgc3RhY2tGcm9tTGFzdEZld05vdGlmaWNhdGlvbnMucHVzaChzdGFjayk7XG4gICAgfVxuICB9XG5cbiAgaWYgKGNvbnNlY3V0aXZlTWljcm90YXNrTm90aWZpY2F0aW9ucyA9PT0gQ09OU0VDVVRJVkVfTUlDUk9UQVNLX05PVElGSUNBVElPTl9MSU1JVCkge1xuICAgIHRocm93IG5ldyBSdW50aW1lRXJyb3IoXG4gICAgICAgIFJ1bnRpbWVFcnJvckNvZGUuSU5GSU5JVEVfQ0hBTkdFX0RFVEVDVElPTixcbiAgICAgICAgJ0FuZ3VsYXIgY291bGQgbm90IHN0YWJpbGl6ZSBiZWNhdXNlIHRoZXJlIHdlcmUgZW5kbGVzcyBjaGFuZ2Ugbm90aWZpY2F0aW9ucyB3aXRoaW4gdGhlIGJyb3dzZXIgZXZlbnQgbG9vcC4gJyArXG4gICAgICAgICAgICAnVGhlIHN0YWNrIGZyb20gdGhlIGxhc3Qgc2V2ZXJhbCBub3RpZmljYXRpb25zOiBcXG4nICtcbiAgICAgICAgICAgIHN0YWNrRnJvbUxhc3RGZXdOb3RpZmljYXRpb25zLmpvaW4oJ1xcbicpKTtcbiAgfVxufVxuXG5ASW5qZWN0YWJsZSh7cHJvdmlkZWRJbjogJ3Jvb3QnfSlcbmV4cG9ydCBjbGFzcyBDaGFuZ2VEZXRlY3Rpb25TY2hlZHVsZXJJbXBsIGltcGxlbWVudHMgQ2hhbmdlRGV0ZWN0aW9uU2NoZWR1bGVyIHtcbiAgcHJpdmF0ZSBhcHBSZWYgPSBpbmplY3QoQXBwbGljYXRpb25SZWYpO1xuICBwcml2YXRlIHRhc2tTZXJ2aWNlID0gaW5qZWN0KFBlbmRpbmdUYXNrcyk7XG4gIHByaXZhdGUgcGVuZGluZ1JlbmRlclRhc2tJZDogbnVtYmVyfG51bGwgPSBudWxsO1xuICBwcml2YXRlIHNob3VsZFJlZnJlc2hWaWV3cyA9IGZhbHNlO1xuICBwcml2YXRlIHJlYWRvbmx5IG5nWm9uZSA9IGluamVjdChOZ1pvbmUpO1xuICBydW5uaW5nVGljayA9IGZhbHNlO1xuICBwcml2YXRlIGNhbmNlbFNjaGVkdWxlZENhbGxiYWNrOiBudWxsfCgoKSA9PiB2b2lkKSA9IG51bGw7XG4gIHByaXZhdGUgcmVhZG9ubHkgem9uZWxlc3NFbmFibGVkID0gaW5qZWN0KFpPTkVMRVNTX0VOQUJMRUQpO1xuICBwcml2YXRlIHJlYWRvbmx5IGRpc2FibGVTY2hlZHVsaW5nID1cbiAgICAgIGluamVjdChaT05FTEVTU19TQ0hFRFVMRVJfRElTQUJMRUQsIHtvcHRpb25hbDogdHJ1ZX0pID8/IGZhbHNlO1xuICBwcml2YXRlIHJlYWRvbmx5IHpvbmVJc0RlZmluZWQgPSB0eXBlb2YgWm9uZSAhPT0gJ3VuZGVmaW5lZCcgJiYgISFab25lLnJvb3QucnVuO1xuICBwcml2YXRlIHJlYWRvbmx5IHNjaGVkdWxlclRpY2tBcHBseUFyZ3MgPSBbe2RhdGE6IHsnX19zY2hlZHVsZXJfdGlja19fJzogdHJ1ZX19XTtcbiAgcHJpdmF0ZSByZWFkb25seSBhZnRlclRpY2tTdWJzY3JpcHRpb24gPSB0aGlzLmFwcFJlZi5hZnRlclRpY2suc3Vic2NyaWJlKCgpID0+IHtcbiAgICAvLyBJZiB0aGUgc2NoZWR1bGVyIGlzbid0IHJ1bm5pbmcgYSB0aWNrIGJ1dCB0aGUgYXBwbGljYXRpb24gdGlja2VkLCB0aGF0IG1lYW5zXG4gICAgLy8gc29tZW9uZSBjYWxsZWQgQXBwbGljYXRpb25SZWYudGljayBtYW51YWxseS4gSW4gdGhpcyBjYXNlLCB3ZSBzaG91bGQgY2FuY2VsXG4gICAgLy8gYW55IGNoYW5nZSBkZXRlY3Rpb25zIHRoYXQgaGFkIGJlZW4gc2NoZWR1bGVkIHNvIHdlIGRvbid0IHJ1biBhbiBleHRyYSBvbmUuXG4gICAgaWYgKCF0aGlzLnJ1bm5pbmdUaWNrKSB7XG4gICAgICB0aGlzLmNsZWFudXAoKTtcbiAgICB9XG4gIH0pO1xuICBwcml2YXRlIHVzZU1pY3JvdGFza1NjaGVkdWxlciA9IGZhbHNlO1xuXG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIC8vIFRPRE8oYXRzY290dCk6IFRoZXNlIGNvbmRpdGlvbnMgd2lsbCBuZWVkIHRvIGNoYW5nZSB3aGVuIHpvbmVsZXNzIGlzIHRoZSBkZWZhdWx0XG4gICAgLy8gSW5zdGVhZCwgdGhleSBzaG91bGQgZmxpcCB0byBjaGVja2luZyBpZiBab25lSlMgc2NoZWR1bGluZyBpcyBwcm92aWRlZFxuICAgIHRoaXMuZGlzYWJsZVNjaGVkdWxpbmcgfHw9ICF0aGlzLnpvbmVsZXNzRW5hYmxlZCAmJlxuICAgICAgICAvLyBOb29wTmdab25lIHdpdGhvdXQgZW5hYmxpbmcgem9uZWxlc3MgbWVhbnMgbm8gc2NoZWR1bGluZyB3aGF0c29ldmVyXG4gICAgICAgICh0aGlzLm5nWm9uZSBpbnN0YW5jZW9mIE5vb3BOZ1pvbmUgfHxcbiAgICAgICAgIC8vIFRoZSBzYW1lIGdvZXMgZm9yIHRoZSBsYWNrIG9mIFpvbmUgd2l0aG91dCBlbmFibGluZyB6b25lbGVzcyBzY2hlZHVsaW5nXG4gICAgICAgICAhdGhpcy56b25lSXNEZWZpbmVkKTtcbiAgfVxuXG4gIG5vdGlmeSh0eXBlID0gTm90aWZpY2F0aW9uVHlwZS5SZWZyZXNoVmlld3MpOiB2b2lkIHtcbiAgICAvLyBXaGVuIHRoZSBvbmx5IHNvdXJjZSBvZiBub3RpZmljYXRpb24gaXMgYW4gYWZ0ZXJSZW5kZXIgaG9vayB3aWxsIHNraXAgc3RyYWlnaHQgdG8gdGhlIGhvb2tzXG4gICAgLy8gcmF0aGVyIHRoYW4gcmVmcmVzaGluZyB2aWV3cyBpbiBBcHBsaWNhdGlvblJlZi50aWNrXG4gICAgdGhpcy5zaG91bGRSZWZyZXNoVmlld3MgfHw9IHR5cGUgPT09IE5vdGlmaWNhdGlvblR5cGUuUmVmcmVzaFZpZXdzO1xuXG4gICAgaWYgKCF0aGlzLnNob3VsZFNjaGVkdWxlVGljaygpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKCh0eXBlb2YgbmdEZXZNb2RlID09PSAndW5kZWZpbmVkJyB8fCBuZ0Rldk1vZGUpKSB7XG4gICAgICBpZiAodGhpcy51c2VNaWNyb3Rhc2tTY2hlZHVsZXIpIHtcbiAgICAgICAgdHJhY2tNaWNyb3Rhc2tOb3RpZmljYXRpb25Gb3JEZWJ1Z2dpbmcoKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnNlY3V0aXZlTWljcm90YXNrTm90aWZpY2F0aW9ucyA9IDA7XG4gICAgICAgIHN0YWNrRnJvbUxhc3RGZXdOb3RpZmljYXRpb25zLmxlbmd0aCA9IDA7XG4gICAgICB9XG4gICAgfVxuXG4gICAgY29uc3Qgc2NoZWR1bGVDYWxsYmFjayA9XG4gICAgICAgIHRoaXMudXNlTWljcm90YXNrU2NoZWR1bGVyID8gc2NoZWR1bGVDYWxsYmFja1dpdGhNaWNyb3Rhc2sgOiBzY2hlZHVsZUNhbGxiYWNrV2l0aFJhZlJhY2U7XG4gICAgdGhpcy5wZW5kaW5nUmVuZGVyVGFza0lkID0gdGhpcy50YXNrU2VydmljZS5hZGQoKTtcbiAgICBpZiAodGhpcy56b25lSXNEZWZpbmVkKSB7XG4gICAgICBab25lLnJvb3QucnVuKCgpID0+IHtcbiAgICAgICAgdGhpcy5jYW5jZWxTY2hlZHVsZWRDYWxsYmFjayA9IHNjaGVkdWxlQ2FsbGJhY2soKCkgPT4ge1xuICAgICAgICAgIHRoaXMudGljayh0aGlzLnNob3VsZFJlZnJlc2hWaWV3cyk7XG4gICAgICAgIH0sIGZhbHNlIC8qKiB1c2VOYXRpdmVUaW1lcnMgKi8pO1xuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuY2FuY2VsU2NoZWR1bGVkQ2FsbGJhY2sgPSBzY2hlZHVsZUNhbGxiYWNrKCgpID0+IHtcbiAgICAgICAgdGhpcy50aWNrKHRoaXMuc2hvdWxkUmVmcmVzaFZpZXdzKTtcbiAgICAgIH0sIGZhbHNlIC8qKiB1c2VOYXRpdmVUaW1lcnMgKi8pO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgc2hvdWxkU2NoZWR1bGVUaWNrKCk6IGJvb2xlYW4ge1xuICAgIGlmICh0aGlzLmRpc2FibGVTY2hlZHVsaW5nKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIC8vIGFscmVhZHkgc2NoZWR1bGVkIG9yIHJ1bm5pbmdcbiAgICBpZiAodGhpcy5wZW5kaW5nUmVuZGVyVGFza0lkICE9PSBudWxsIHx8IHRoaXMucnVubmluZ1RpY2sgfHwgdGhpcy5hcHBSZWYuX3J1bm5pbmdUaWNrKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIC8vIElmIHdlJ3JlIGluc2lkZSB0aGUgem9uZSBkb24ndCBib3RoZXIgd2l0aCBzY2hlZHVsZXIuIFpvbmUgd2lsbCBzdGFiaWxpemVcbiAgICAvLyBldmVudHVhbGx5IGFuZCBydW4gY2hhbmdlIGRldGVjdGlvbi5cbiAgICBpZiAodGhpcy56b25lSXNEZWZpbmVkICYmIE5nWm9uZS5pc0luQW5ndWxhclpvbmUoKSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgLyoqXG4gICAqIENhbGxzIEFwcGxpY2F0aW9uUmVmLl90aWNrIGluc2lkZSB0aGUgYE5nWm9uZWAuXG4gICAqXG4gICAqIENhbGxpbmcgYHRpY2tgIGRpcmVjdGx5IHJ1bnMgY2hhbmdlIGRldGVjdGlvbiBhbmQgY2FuY2VscyBhbnkgY2hhbmdlIGRldGVjdGlvbiB0aGF0IGhhZCBiZWVuXG4gICAqIHNjaGVkdWxlZCBwcmV2aW91c2x5LlxuICAgKlxuICAgKiBAcGFyYW0gc2hvdWxkUmVmcmVzaFZpZXdzIFBhc3NlZCBkaXJlY3RseSB0byBgQXBwbGljYXRpb25SZWYuX3RpY2tgIGFuZCBza2lwcyBzdHJhaWdodCB0b1xuICAgKiAgICAgcmVuZGVyIGhvb2tzIHdoZW4gYGZhbHNlYC5cbiAgICovXG4gIHByaXZhdGUgdGljayhzaG91bGRSZWZyZXNoVmlld3M6IGJvb2xlYW4pOiB2b2lkIHtcbiAgICAvLyBXaGVuIG5nWm9uZS5ydW4gYmVsb3cgZXhpdHMsIG9uTWljcm90YXNrRW1wdHkgbWF5IGVtaXQgaWYgdGhlIHpvbmUgaXNcbiAgICAvLyBzdGFibGUuIFdlIHdhbnQgdG8gcHJldmVudCBkb3VibGUgdGlja2luZyBzbyB3ZSB0cmFjayB3aGV0aGVyIHRoZSB0aWNrIGlzXG4gICAgLy8gYWxyZWFkeSBydW5uaW5nIGFuZCBza2lwIGl0IGlmIHNvLlxuICAgIGlmICh0aGlzLnJ1bm5pbmdUaWNrIHx8IHRoaXMuYXBwUmVmLmRlc3Ryb3llZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHRhc2sgPSB0aGlzLnRhc2tTZXJ2aWNlLmFkZCgpO1xuICAgIHRyeSB7XG4gICAgICB0aGlzLm5nWm9uZS5ydW4oKCkgPT4ge1xuICAgICAgICB0aGlzLnJ1bm5pbmdUaWNrID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5hcHBSZWYuX3RpY2soc2hvdWxkUmVmcmVzaFZpZXdzKTtcbiAgICAgIH0sIHVuZGVmaW5lZCwgdGhpcy5zY2hlZHVsZXJUaWNrQXBwbHlBcmdzKTtcbiAgICB9IGNhdGNoIChlOiB1bmtub3duKSB7XG4gICAgICB0aGlzLnRhc2tTZXJ2aWNlLnJlbW92ZSh0YXNrKTtcbiAgICAgIHRocm93IGU7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIHRoaXMuY2xlYW51cCgpO1xuICAgIH1cbiAgICAvLyBJZiB3ZSdyZSBub3RpZmllZCBvZiBhIGNoYW5nZSB3aXRoaW4gMSBtaWNyb3Rhc2sgb2YgcnVubmluZyBjaGFuZ2VcbiAgICAvLyBkZXRlY3Rpb24sIHJ1biBhbm90aGVyIHJvdW5kIGluIHRoZSBzYW1lIGV2ZW50IGxvb3AuIFRoaXMgYWxsb3dzIGNvZGVcbiAgICAvLyB3aGljaCB1c2VzIFByb21pc2UucmVzb2x2ZSAoc2VlIE5nTW9kZWwpIHRvIGF2b2lkXG4gICAgLy8gRXhwcmVzc2lvbkNoYW5nZWQuLi5FcnJvciB0byBzdGlsbCBiZSByZWZsZWN0ZWQgaW4gYSBzaW5nbGUgYnJvd3NlclxuICAgIC8vIHBhaW50LCBldmVuIGlmIHRoYXQgc3BhbnMgbXVsdGlwbGUgcm91bmRzIG9mIGNoYW5nZSBkZXRlY3Rpb24uXG4gICAgdGhpcy51c2VNaWNyb3Rhc2tTY2hlZHVsZXIgPSB0cnVlO1xuICAgIHNjaGVkdWxlQ2FsbGJhY2tXaXRoTWljcm90YXNrKCgpID0+IHtcbiAgICAgIHRoaXMudXNlTWljcm90YXNrU2NoZWR1bGVyID0gZmFsc2U7XG4gICAgICB0aGlzLnRhc2tTZXJ2aWNlLnJlbW92ZSh0YXNrKTtcbiAgICB9KTtcbiAgfVxuXG4gIG5nT25EZXN0cm95KCkge1xuICAgIHRoaXMuYWZ0ZXJUaWNrU3Vic2NyaXB0aW9uLnVuc3Vic2NyaWJlKCk7XG4gICAgdGhpcy5jbGVhbnVwKCk7XG4gIH1cblxuICBwcml2YXRlIGNsZWFudXAoKSB7XG4gICAgdGhpcy5zaG91bGRSZWZyZXNoVmlld3MgPSBmYWxzZTtcbiAgICB0aGlzLnJ1bm5pbmdUaWNrID0gZmFsc2U7XG4gICAgdGhpcy5jYW5jZWxTY2hlZHVsZWRDYWxsYmFjaz8uKCk7XG4gICAgdGhpcy5jYW5jZWxTY2hlZHVsZWRDYWxsYmFjayA9IG51bGw7XG4gICAgLy8gSWYgdGhpcyBpcyB0aGUgbGFzdCB0YXNrLCB0aGUgc2VydmljZSB3aWxsIHN5bmNocm9ub3VzbHkgZW1pdCBhIHN0YWJsZVxuICAgIC8vIG5vdGlmaWNhdGlvbi4gSWYgdGhlcmUgaXMgYSBzdWJzY3JpYmVyIHRoYXQgdGhlbiBhY3RzIGluIGEgd2F5IHRoYXRcbiAgICAvLyB0cmllcyB0byBub3RpZnkgdGhlIHNjaGVkdWxlciBhZ2Fpbiwgd2UgbmVlZCB0byBiZSBhYmxlIHRvIHJlc3BvbmQgdG9cbiAgICAvLyBzY2hlZHVsZSBhIG5ldyBjaGFuZ2UgZGV0ZWN0aW9uLiBUaGVyZWZvcmUsIHdlIHNob3VsZCBjbGVhciB0aGUgdGFzayBJRFxuICAgIC8vIGJlZm9yZSByZW1vdmluZyBpdCBmcm9tIHRoZSBwZW5kaW5nIHRhc2tzIChvciB0aGUgdGFza3Mgc2VydmljZSBzaG91bGRcbiAgICAvLyBub3Qgc3luY2hyb25vdXNseSBlbWl0IHN0YWJsZSwgc2ltaWxhciB0byBob3cgWm9uZSBzdGFibGVuZXNzIG9ubHlcbiAgICAvLyBoYXBwZW5zIGlmIGl0J3Mgc3RpbGwgc3RhYmxlIGFmdGVyIGEgbWljcm90YXNrKS5cbiAgICBpZiAodGhpcy5wZW5kaW5nUmVuZGVyVGFza0lkICE9PSBudWxsKSB7XG4gICAgICBjb25zdCB0YXNrSWQgPSB0aGlzLnBlbmRpbmdSZW5kZXJUYXNrSWQ7XG4gICAgICB0aGlzLnBlbmRpbmdSZW5kZXJUYXNrSWQgPSBudWxsO1xuICAgICAgdGhpcy50YXNrU2VydmljZS5yZW1vdmUodGFza0lkKTtcbiAgICB9XG4gIH1cbn1cblxuXG4vKipcbiAqIFByb3ZpZGVzIGNoYW5nZSBkZXRlY3Rpb24gd2l0aG91dCBab25lSlMgZm9yIHRoZSBhcHBsaWNhdGlvbiBib290c3RyYXBwZWQgdXNpbmdcbiAqIGBib290c3RyYXBBcHBsaWNhdGlvbmAuXG4gKlxuICogVGhpcyBmdW5jdGlvbiBhbGxvd3MgeW91IHRvIGNvbmZpZ3VyZSB0aGUgYXBwbGljYXRpb24gdG8gbm90IHVzZSB0aGUgc3RhdGUvc3RhdGUgY2hhbmdlcyBvZlxuICogWm9uZUpTIHRvIHNjaGVkdWxlIGNoYW5nZSBkZXRlY3Rpb24gaW4gdGhlIGFwcGxpY2F0aW9uLiBUaGlzIHdpbGwgd29yayB3aGVuIFpvbmVKUyBpcyBub3QgcHJlc2VudFxuICogb24gdGhlIHBhZ2UgYXQgYWxsIG9yIGlmIGl0IGV4aXN0cyBiZWNhdXNlIHNvbWV0aGluZyBlbHNlIGlzIHVzaW5nIGl0IChlaXRoZXIgYW5vdGhlciBBbmd1bGFyXG4gKiBhcHBsaWNhdGlvbiB3aGljaCB1c2VzIFpvbmVKUyBmb3Igc2NoZWR1bGluZyBvciBzb21lIG90aGVyIGxpYnJhcnkgdGhhdCByZWxpZXMgb24gWm9uZUpTKS5cbiAqXG4gKiBUaGlzIGNhbiBhbHNvIGJlIGFkZGVkIHRvIHRoZSBgVGVzdEJlZGAgcHJvdmlkZXJzIHRvIGNvbmZpZ3VyZSB0aGUgdGVzdCBlbnZpcm9ubWVudCB0byBtb3JlXG4gKiBjbG9zZWx5IG1hdGNoIHByb2R1Y3Rpb24gYmVoYXZpb3IuIFRoaXMgd2lsbCBoZWxwIGdpdmUgaGlnaGVyIGNvbmZpZGVuY2UgdGhhdCBjb21wb25lbnRzIGFyZVxuICogY29tcGF0aWJsZSB3aXRoIHpvbmVsZXNzIGNoYW5nZSBkZXRlY3Rpb24uXG4gKlxuICogWm9uZUpTIHVzZXMgYnJvd3NlciBldmVudHMgdG8gdHJpZ2dlciBjaGFuZ2UgZGV0ZWN0aW9uLiBXaGVuIHVzaW5nIHRoaXMgcHJvdmlkZXIsIEFuZ3VsYXIgd2lsbFxuICogaW5zdGVhZCB1c2UgQW5ndWxhciBBUElzIHRvIHNjaGVkdWxlIGNoYW5nZSBkZXRlY3Rpb24uIFRoZXNlIEFQSXMgaW5jbHVkZTpcbiAqXG4gKiAtIGBDaGFuZ2VEZXRlY3RvclJlZi5tYXJrRm9yQ2hlY2tgXG4gKiAtIGBDb21wb25lbnRSZWYuc2V0SW5wdXRgXG4gKiAtIHVwZGF0aW5nIGEgc2lnbmFsIHRoYXQgaXMgcmVhZCBpbiBhIHRlbXBsYXRlXG4gKiAtIHdoZW4gYm91bmQgaG9zdCBvciB0ZW1wbGF0ZSBsaXN0ZW5lcnMgYXJlIHRyaWdnZXJlZFxuICogLSBhdHRhY2hpbmcgYSB2aWV3IHRoYXQgd2FzIG1hcmtlZCBkaXJ0eSBieSBvbmUgb2YgdGhlIGFib3ZlXG4gKiAtIHJlbW92aW5nIGEgdmlld1xuICogLSByZWdpc3RlcmluZyBhIHJlbmRlciBob29rICh0ZW1wbGF0ZXMgYXJlIG9ubHkgcmVmcmVzaGVkIGlmIHJlbmRlciBob29rcyBkbyBvbmUgb2YgdGhlIGFib3ZlKVxuICpcbiAqIEB1c2FnZU5vdGVzXG4gKiBgYGB0eXBlc2NyaXB0XG4gKiBib290c3RyYXBBcHBsaWNhdGlvbihNeUFwcCwge3Byb3ZpZGVyczogW1xuICogICBwcm92aWRlRXhwZXJpbWVudGFsWm9uZWxlc3NDaGFuZ2VEZXRlY3Rpb24oKSxcbiAqIF19KTtcbiAqIGBgYFxuICpcbiAqIFRoaXMgQVBJIGlzIGV4cGVyaW1lbnRhbC4gTmVpdGhlciB0aGUgc2hhcGUsIG5vciB0aGUgdW5kZXJseWluZyBiZWhhdmlvciBpcyBzdGFibGUgYW5kIGNhbiBjaGFuZ2VcbiAqIGluIHBhdGNoIHZlcnNpb25zLiBUaGVyZSBhcmUga25vd24gZmVhdHVyZSBnYXBzIGFuZCBBUEkgZXJnb25vbWljIGNvbnNpZGVyYXRpb25zLiBXZSB3aWxsIGl0ZXJhdGVcbiAqIG9uIHRoZSBleGFjdCBBUEkgYmFzZWQgb24gdGhlIGZlZWRiYWNrIGFuZCBvdXIgdW5kZXJzdGFuZGluZyBvZiB0aGUgcHJvYmxlbSBhbmQgc29sdXRpb24gc3BhY2UuXG4gKlxuICogQHB1YmxpY0FwaVxuICogQGV4cGVyaW1lbnRhbFxuICogQHNlZSB7QGxpbmsgYm9vdHN0cmFwQXBwbGljYXRpb259XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwcm92aWRlRXhwZXJpbWVudGFsWm9uZWxlc3NDaGFuZ2VEZXRlY3Rpb24oKTogRW52aXJvbm1lbnRQcm92aWRlcnMge1xuICBwZXJmb3JtYW5jZU1hcmtGZWF0dXJlKCdOZ1pvbmVsZXNzJyk7XG4gIHJldHVybiBtYWtlRW52aXJvbm1lbnRQcm92aWRlcnMoW1xuICAgIHtwcm92aWRlOiBDaGFuZ2VEZXRlY3Rpb25TY2hlZHVsZXIsIHVzZUV4aXN0aW5nOiBDaGFuZ2VEZXRlY3Rpb25TY2hlZHVsZXJJbXBsfSxcbiAgICB7cHJvdmlkZTogTmdab25lLCB1c2VDbGFzczogTm9vcE5nWm9uZX0sXG4gICAge3Byb3ZpZGU6IFpPTkVMRVNTX0VOQUJMRUQsIHVzZVZhbHVlOiB0cnVlfSxcbiAgXSk7XG59XG4iXX0=