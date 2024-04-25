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
    notify(source) {
        if (!this.zonelessEnabled && source === 6 /* NotificationSource.Listener */) {
            // When the notification comes from a listener, we skip the notification unless the
            // application has enabled zoneless. Ideally, listeners wouldn't notify the scheduler at all
            // automatically. We do not know that a developer made a change in the listener callback that
            // requires an `ApplicationRef.tick` (synchronize templates / run render hooks). We do this
            // only for an easier migration from OnPush components to zoneless. Because listeners are
            // usually executed inside the Angular zone and listeners automatically call `markViewDirty`,
            // developers never needed to manually use `ChangeDetectorRef.markForCheck` or some other API
            // to make listener callbacks work correctly with `OnPush` components.
            return;
        }
        switch (source) {
            case 3 /* NotificationSource.DebugApplyChanges */:
            case 2 /* NotificationSource.DeferBlockStateUpdate */:
            case 0 /* NotificationSource.MarkAncestorsForTraversal */:
            case 4 /* NotificationSource.MarkForCheck */:
            case 6 /* NotificationSource.Listener */:
            case 5 /* NotificationSource.AnimationQueuedNodeRemoval */:
            case 1 /* NotificationSource.SetInput */: {
                this.shouldRefreshViews = true;
                break;
            }
            case 9 /* NotificationSource.ViewDetachedFromDOM */:
            case 8 /* NotificationSource.ViewAttached */:
            case 7 /* NotificationSource.NewRenderHook */:
            case 10 /* NotificationSource.AsyncAnimationsLoaded */:
            default: {
                // These notifications only schedule a tick but do not change whether we should refresh
                // views. Instead, we only need to run render hooks unless another notification from the
                // other set is also received before `tick` happens.
            }
        }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiem9uZWxlc3Nfc2NoZWR1bGluZ19pbXBsLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvY2hhbmdlX2RldGVjdGlvbi9zY2hlZHVsaW5nL3pvbmVsZXNzX3NjaGVkdWxpbmdfaW1wbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0sbUNBQW1DLENBQUM7QUFDakUsT0FBTyxFQUFDLFVBQVUsRUFBQyxNQUFNLHFCQUFxQixDQUFDO0FBQy9DLE9BQU8sRUFBQyxNQUFNLEVBQUMsTUFBTSxpQ0FBaUMsQ0FBQztBQUV2RCxPQUFPLEVBQUMsd0JBQXdCLEVBQUMsTUFBTSw4QkFBOEIsQ0FBQztBQUN0RSxPQUFPLEVBQUMsWUFBWSxFQUFtQixNQUFNLGNBQWMsQ0FBQztBQUM1RCxPQUFPLEVBQUMsWUFBWSxFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFDakQsT0FBTyxFQUFDLDZCQUE2QixFQUFFLDJCQUEyQixFQUFDLE1BQU0sK0JBQStCLENBQUM7QUFDekcsT0FBTyxFQUFDLHNCQUFzQixFQUFDLE1BQU0sd0JBQXdCLENBQUM7QUFDOUQsT0FBTyxFQUFDLE1BQU0sRUFBRSxVQUFVLEVBQUMsTUFBTSxvQkFBb0IsQ0FBQztBQUV0RCxPQUFPLEVBQUMsd0JBQXdCLEVBQXNCLGdCQUFnQixFQUFFLDJCQUEyQixFQUFDLE1BQU0sdUJBQXVCLENBQUM7O0FBRWxJLE1BQU0sd0NBQXdDLEdBQUcsR0FBRyxDQUFDO0FBQ3JELElBQUksaUNBQWlDLEdBQUcsQ0FBQyxDQUFDO0FBQzFDLElBQUksNkJBQTZCLEdBQWEsRUFBRSxDQUFDO0FBRWpELFNBQVMsc0NBQXNDO0lBQzdDLGlDQUFpQyxFQUFFLENBQUM7SUFDcEMsSUFBSSx3Q0FBd0MsR0FBRyxpQ0FBaUMsR0FBRyxDQUFDLEVBQUUsQ0FBQztRQUNyRixNQUFN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QU07O2dGQUNsQiw0QkFBNEI7Y0FEeEMsVUFBVTtlQUFDLEVBQUMsVUFBVSxFQUFFLE1BQU0sRUFBQzs7QUFxTGhDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztHQXNDRztBQUNILE1BQU0sVUFBVSwwQ0FBMEM7SUFDeEQsc0JBQXNCLENBQUMsWUFBWSxDQUFDLENBQUM7SUFDckMsT0FBTyx3QkFBd0IsQ0FBQztRQUM5QixFQUFDLE9BQU8sRUFBRSx3QkFBd0IsRUFBRSxXQUFXLEVBQUUsNEJBQTRCLEVBQUM7UUFDOUUsRUFBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLFFBQVEsRUFBRSxVQUFVLEVBQUM7UUFDdkMsRUFBQyxPQUFPLEVBQUUsZ0JBQWdCLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBQztLQUM1QyxDQUFDLENBQUM7QUFDTCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7QXBwbGljYXRpb25SZWZ9IGZyb20gJy4uLy4uL2FwcGxpY2F0aW9uL2FwcGxpY2F0aW9uX3JlZic7XG5pbXBvcnQge0luamVjdGFibGV9IGZyb20gJy4uLy4uL2RpL2luamVjdGFibGUnO1xuaW1wb3J0IHtpbmplY3R9IGZyb20gJy4uLy4uL2RpL2luamVjdG9yX2NvbXBhdGliaWxpdHknO1xuaW1wb3J0IHtFbnZpcm9ubWVudFByb3ZpZGVyc30gZnJvbSAnLi4vLi4vZGkvaW50ZXJmYWNlL3Byb3ZpZGVyJztcbmltcG9ydCB7bWFrZUVudmlyb25tZW50UHJvdmlkZXJzfSBmcm9tICcuLi8uLi9kaS9wcm92aWRlcl9jb2xsZWN0aW9uJztcbmltcG9ydCB7UnVudGltZUVycm9yLCBSdW50aW1lRXJyb3JDb2RlfSBmcm9tICcuLi8uLi9lcnJvcnMnO1xuaW1wb3J0IHtQZW5kaW5nVGFza3N9IGZyb20gJy4uLy4uL3BlbmRpbmdfdGFza3MnO1xuaW1wb3J0IHtzY2hlZHVsZUNhbGxiYWNrV2l0aE1pY3JvdGFzaywgc2NoZWR1bGVDYWxsYmFja1dpdGhSYWZSYWNlfSBmcm9tICcuLi8uLi91dGlsL2NhbGxiYWNrX3NjaGVkdWxlcic7XG5pbXBvcnQge3BlcmZvcm1hbmNlTWFya0ZlYXR1cmV9IGZyb20gJy4uLy4uL3V0aWwvcGVyZm9ybWFuY2UnO1xuaW1wb3J0IHtOZ1pvbmUsIE5vb3BOZ1pvbmV9IGZyb20gJy4uLy4uL3pvbmUvbmdfem9uZSc7XG5cbmltcG9ydCB7Q2hhbmdlRGV0ZWN0aW9uU2NoZWR1bGVyLCBOb3RpZmljYXRpb25Tb3VyY2UsIFpPTkVMRVNTX0VOQUJMRUQsIFpPTkVMRVNTX1NDSEVEVUxFUl9ESVNBQkxFRH0gZnJvbSAnLi96b25lbGVzc19zY2hlZHVsaW5nJztcblxuY29uc3QgQ09OU0VDVVRJVkVfTUlDUk9UQVNLX05PVElGSUNBVElPTl9MSU1JVCA9IDEwMDtcbmxldCBjb25zZWN1dGl2ZU1pY3JvdGFza05vdGlmaWNhdGlvbnMgPSAwO1xubGV0IHN0YWNrRnJvbUxhc3RGZXdOb3RpZmljYXRpb25zOiBzdHJpbmdbXSA9IFtdO1xuXG5mdW5jdGlvbiB0cmFja01pY3JvdGFza05vdGlmaWNhdGlvbkZvckRlYnVnZ2luZygpIHtcbiAgY29uc2VjdXRpdmVNaWNyb3Rhc2tOb3RpZmljYXRpb25zKys7XG4gIGlmIChDT05TRUNVVElWRV9NSUNST1RBU0tfTk9USUZJQ0FUSU9OX0xJTUlUIC0gY29uc2VjdXRpdmVNaWNyb3Rhc2tOb3RpZmljYXRpb25zIDwgNSkge1xuICAgIGNvbnN0IHN0YWNrID0gbmV3IEVycm9yKCkuc3RhY2s7XG4gICAgaWYgKHN0YWNrKSB7XG4gICAgICBzdGFja0Zyb21MYXN0RmV3Tm90aWZpY2F0aW9ucy5wdXNoKHN0YWNrKTtcbiAgICB9XG4gIH1cblxuICBpZiAoY29uc2VjdXRpdmVNaWNyb3Rhc2tOb3RpZmljYXRpb25zID09PSBDT05TRUNVVElWRV9NSUNST1RBU0tfTk9USUZJQ0FUSU9OX0xJTUlUKSB7XG4gICAgdGhyb3cgbmV3IFJ1bnRpbWVFcnJvcihcbiAgICAgICAgUnVudGltZUVycm9yQ29kZS5JTkZJTklURV9DSEFOR0VfREVURUNUSU9OLFxuICAgICAgICAnQW5ndWxhciBjb3VsZCBub3Qgc3RhYmlsaXplIGJlY2F1c2UgdGhlcmUgd2VyZSBlbmRsZXNzIGNoYW5nZSBub3RpZmljYXRpb25zIHdpdGhpbiB0aGUgYnJvd3NlciBldmVudCBsb29wLiAnICtcbiAgICAgICAgICAgICdUaGUgc3RhY2sgZnJvbSB0aGUgbGFzdCBzZXZlcmFsIG5vdGlmaWNhdGlvbnM6IFxcbicgK1xuICAgICAgICAgICAgc3RhY2tGcm9tTGFzdEZld05vdGlmaWNhdGlvbnMuam9pbignXFxuJykpO1xuICB9XG59XG5cbkBJbmplY3RhYmxlKHtwcm92aWRlZEluOiAncm9vdCd9KVxuZXhwb3J0IGNsYXNzIENoYW5nZURldGVjdGlvblNjaGVkdWxlckltcGwgaW1wbGVtZW50cyBDaGFuZ2VEZXRlY3Rpb25TY2hlZHVsZXIge1xuICBwcml2YXRlIGFwcFJlZiA9IGluamVjdChBcHBsaWNhdGlvblJlZik7XG4gIHByaXZhdGUgdGFza1NlcnZpY2UgPSBpbmplY3QoUGVuZGluZ1Rhc2tzKTtcbiAgcHJpdmF0ZSBwZW5kaW5nUmVuZGVyVGFza0lkOiBudW1iZXJ8bnVsbCA9IG51bGw7XG4gIHByaXZhdGUgc2hvdWxkUmVmcmVzaFZpZXdzID0gZmFsc2U7XG4gIHByaXZhdGUgcmVhZG9ubHkgbmdab25lID0gaW5qZWN0KE5nWm9uZSk7XG4gIHJ1bm5pbmdUaWNrID0gZmFsc2U7XG4gIHByaXZhdGUgY2FuY2VsU2NoZWR1bGVkQ2FsbGJhY2s6IG51bGx8KCgpID0+IHZvaWQpID0gbnVsbDtcbiAgcHJpdmF0ZSByZWFkb25seSB6b25lbGVzc0VuYWJsZWQgPSBpbmplY3QoWk9ORUxFU1NfRU5BQkxFRCk7XG4gIHByaXZhdGUgcmVhZG9ubHkgZGlzYWJsZVNjaGVkdWxpbmcgPVxuICAgICAgaW5qZWN0KFpPTkVMRVNTX1NDSEVEVUxFUl9ESVNBQkxFRCwge29wdGlvbmFsOiB0cnVlfSkgPz8gZmFsc2U7XG4gIHByaXZhdGUgcmVhZG9ubHkgem9uZUlzRGVmaW5lZCA9IHR5cGVvZiBab25lICE9PSAndW5kZWZpbmVkJyAmJiAhIVpvbmUucm9vdC5ydW47XG4gIHByaXZhdGUgcmVhZG9ubHkgc2NoZWR1bGVyVGlja0FwcGx5QXJncyA9IFt7ZGF0YTogeydfX3NjaGVkdWxlcl90aWNrX18nOiB0cnVlfX1dO1xuICBwcml2YXRlIHJlYWRvbmx5IGFmdGVyVGlja1N1YnNjcmlwdGlvbiA9IHRoaXMuYXBwUmVmLmFmdGVyVGljay5zdWJzY3JpYmUoKCkgPT4ge1xuICAgIC8vIElmIHRoZSBzY2hlZHVsZXIgaXNuJ3QgcnVubmluZyBhIHRpY2sgYnV0IHRoZSBhcHBsaWNhdGlvbiB0aWNrZWQsIHRoYXQgbWVhbnNcbiAgICAvLyBzb21lb25lIGNhbGxlZCBBcHBsaWNhdGlvblJlZi50aWNrIG1hbnVhbGx5LiBJbiB0aGlzIGNhc2UsIHdlIHNob3VsZCBjYW5jZWxcbiAgICAvLyBhbnkgY2hhbmdlIGRldGVjdGlvbnMgdGhhdCBoYWQgYmVlbiBzY2hlZHVsZWQgc28gd2UgZG9uJ3QgcnVuIGFuIGV4dHJhIG9uZS5cbiAgICBpZiAoIXRoaXMucnVubmluZ1RpY2spIHtcbiAgICAgIHRoaXMuY2xlYW51cCgpO1xuICAgIH1cbiAgfSk7XG4gIHByaXZhdGUgdXNlTWljcm90YXNrU2NoZWR1bGVyID0gZmFsc2U7XG5cbiAgY29uc3RydWN0b3IoKSB7XG4gICAgLy8gVE9ETyhhdHNjb3R0KTogVGhlc2UgY29uZGl0aW9ucyB3aWxsIG5lZWQgdG8gY2hhbmdlIHdoZW4gem9uZWxlc3MgaXMgdGhlIGRlZmF1bHRcbiAgICAvLyBJbnN0ZWFkLCB0aGV5IHNob3VsZCBmbGlwIHRvIGNoZWNraW5nIGlmIFpvbmVKUyBzY2hlZHVsaW5nIGlzIHByb3ZpZGVkXG4gICAgdGhpcy5kaXNhYmxlU2NoZWR1bGluZyB8fD0gIXRoaXMuem9uZWxlc3NFbmFibGVkICYmXG4gICAgICAgIC8vIE5vb3BOZ1pvbmUgd2l0aG91dCBlbmFibGluZyB6b25lbGVzcyBtZWFucyBubyBzY2hlZHVsaW5nIHdoYXRzb2V2ZXJcbiAgICAgICAgKHRoaXMubmdab25lIGluc3RhbmNlb2YgTm9vcE5nWm9uZSB8fFxuICAgICAgICAgLy8gVGhlIHNhbWUgZ29lcyBmb3IgdGhlIGxhY2sgb2YgWm9uZSB3aXRob3V0IGVuYWJsaW5nIHpvbmVsZXNzIHNjaGVkdWxpbmdcbiAgICAgICAgICF0aGlzLnpvbmVJc0RlZmluZWQpO1xuICB9XG5cbiAgbm90aWZ5KHNvdXJjZTogTm90aWZpY2F0aW9uU291cmNlKTogdm9pZCB7XG4gICAgaWYgKCF0aGlzLnpvbmVsZXNzRW5hYmxlZCAmJiBzb3VyY2UgPT09IE5vdGlmaWNhdGlvblNvdXJjZS5MaXN0ZW5lcikge1xuICAgICAgLy8gV2hlbiB0aGUgbm90aWZpY2F0aW9uIGNvbWVzIGZyb20gYSBsaXN0ZW5lciwgd2Ugc2tpcCB0aGUgbm90aWZpY2F0aW9uIHVubGVzcyB0aGVcbiAgICAgIC8vIGFwcGxpY2F0aW9uIGhhcyBlbmFibGVkIHpvbmVsZXNzLiBJZGVhbGx5LCBsaXN0ZW5lcnMgd291bGRuJ3Qgbm90aWZ5IHRoZSBzY2hlZHVsZXIgYXQgYWxsXG4gICAgICAvLyBhdXRvbWF0aWNhbGx5LiBXZSBkbyBub3Qga25vdyB0aGF0IGEgZGV2ZWxvcGVyIG1hZGUgYSBjaGFuZ2UgaW4gdGhlIGxpc3RlbmVyIGNhbGxiYWNrIHRoYXRcbiAgICAgIC8vIHJlcXVpcmVzIGFuIGBBcHBsaWNhdGlvblJlZi50aWNrYCAoc3luY2hyb25pemUgdGVtcGxhdGVzIC8gcnVuIHJlbmRlciBob29rcykuIFdlIGRvIHRoaXNcbiAgICAgIC8vIG9ubHkgZm9yIGFuIGVhc2llciBtaWdyYXRpb24gZnJvbSBPblB1c2ggY29tcG9uZW50cyB0byB6b25lbGVzcy4gQmVjYXVzZSBsaXN0ZW5lcnMgYXJlXG4gICAgICAvLyB1c3VhbGx5IGV4ZWN1dGVkIGluc2lkZSB0aGUgQW5ndWxhciB6b25lIGFuZCBsaXN0ZW5lcnMgYXV0b21hdGljYWxseSBjYWxsIGBtYXJrVmlld0RpcnR5YCxcbiAgICAgIC8vIGRldmVsb3BlcnMgbmV2ZXIgbmVlZGVkIHRvIG1hbnVhbGx5IHVzZSBgQ2hhbmdlRGV0ZWN0b3JSZWYubWFya0ZvckNoZWNrYCBvciBzb21lIG90aGVyIEFQSVxuICAgICAgLy8gdG8gbWFrZSBsaXN0ZW5lciBjYWxsYmFja3Mgd29yayBjb3JyZWN0bHkgd2l0aCBgT25QdXNoYCBjb21wb25lbnRzLlxuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBzd2l0Y2ggKHNvdXJjZSkge1xuICAgICAgY2FzZSBOb3RpZmljYXRpb25Tb3VyY2UuRGVidWdBcHBseUNoYW5nZXM6XG4gICAgICBjYXNlIE5vdGlmaWNhdGlvblNvdXJjZS5EZWZlckJsb2NrU3RhdGVVcGRhdGU6XG4gICAgICBjYXNlIE5vdGlmaWNhdGlvblNvdXJjZS5NYXJrQW5jZXN0b3JzRm9yVHJhdmVyc2FsOlxuICAgICAgY2FzZSBOb3RpZmljYXRpb25Tb3VyY2UuTWFya0ZvckNoZWNrOlxuICAgICAgY2FzZSBOb3RpZmljYXRpb25Tb3VyY2UuTGlzdGVuZXI6XG4gICAgICBjYXNlIE5vdGlmaWNhdGlvblNvdXJjZS5BbmltYXRpb25RdWV1ZWROb2RlUmVtb3ZhbDpcbiAgICAgIGNhc2UgTm90aWZpY2F0aW9uU291cmNlLlNldElucHV0OiB7XG4gICAgICAgIHRoaXMuc2hvdWxkUmVmcmVzaFZpZXdzID0gdHJ1ZTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBjYXNlIE5vdGlmaWNhdGlvblNvdXJjZS5WaWV3RGV0YWNoZWRGcm9tRE9NOlxuICAgICAgY2FzZSBOb3RpZmljYXRpb25Tb3VyY2UuVmlld0F0dGFjaGVkOlxuICAgICAgY2FzZSBOb3RpZmljYXRpb25Tb3VyY2UuTmV3UmVuZGVySG9vazpcbiAgICAgIGNhc2UgTm90aWZpY2F0aW9uU291cmNlLkFzeW5jQW5pbWF0aW9uc0xvYWRlZDpcbiAgICAgIGRlZmF1bHQ6IHtcbiAgICAgICAgLy8gVGhlc2Ugbm90aWZpY2F0aW9ucyBvbmx5IHNjaGVkdWxlIGEgdGljayBidXQgZG8gbm90IGNoYW5nZSB3aGV0aGVyIHdlIHNob3VsZCByZWZyZXNoXG4gICAgICAgIC8vIHZpZXdzLiBJbnN0ZWFkLCB3ZSBvbmx5IG5lZWQgdG8gcnVuIHJlbmRlciBob29rcyB1bmxlc3MgYW5vdGhlciBub3RpZmljYXRpb24gZnJvbSB0aGVcbiAgICAgICAgLy8gb3RoZXIgc2V0IGlzIGFsc28gcmVjZWl2ZWQgYmVmb3JlIGB0aWNrYCBoYXBwZW5zLlxuICAgICAgfVxuICAgIH1cblxuICAgIGlmICghdGhpcy5zaG91bGRTY2hlZHVsZVRpY2soKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmICgodHlwZW9mIG5nRGV2TW9kZSA9PT0gJ3VuZGVmaW5lZCcgfHwgbmdEZXZNb2RlKSkge1xuICAgICAgaWYgKHRoaXMudXNlTWljcm90YXNrU2NoZWR1bGVyKSB7XG4gICAgICAgIHRyYWNrTWljcm90YXNrTm90aWZpY2F0aW9uRm9yRGVidWdnaW5nKCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zZWN1dGl2ZU1pY3JvdGFza05vdGlmaWNhdGlvbnMgPSAwO1xuICAgICAgICBzdGFja0Zyb21MYXN0RmV3Tm90aWZpY2F0aW9ucy5sZW5ndGggPSAwO1xuICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IHNjaGVkdWxlQ2FsbGJhY2sgPVxuICAgICAgICB0aGlzLnVzZU1pY3JvdGFza1NjaGVkdWxlciA/IHNjaGVkdWxlQ2FsbGJhY2tXaXRoTWljcm90YXNrIDogc2NoZWR1bGVDYWxsYmFja1dpdGhSYWZSYWNlO1xuICAgIHRoaXMucGVuZGluZ1JlbmRlclRhc2tJZCA9IHRoaXMudGFza1NlcnZpY2UuYWRkKCk7XG4gICAgaWYgKHRoaXMuem9uZUlzRGVmaW5lZCkge1xuICAgICAgWm9uZS5yb290LnJ1bigoKSA9PiB7XG4gICAgICAgIHRoaXMuY2FuY2VsU2NoZWR1bGVkQ2FsbGJhY2sgPSBzY2hlZHVsZUNhbGxiYWNrKCgpID0+IHtcbiAgICAgICAgICB0aGlzLnRpY2sodGhpcy5zaG91bGRSZWZyZXNoVmlld3MpO1xuICAgICAgICB9LCBmYWxzZSAvKiogdXNlTmF0aXZlVGltZXJzICovKTtcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmNhbmNlbFNjaGVkdWxlZENhbGxiYWNrID0gc2NoZWR1bGVDYWxsYmFjaygoKSA9PiB7XG4gICAgICAgIHRoaXMudGljayh0aGlzLnNob3VsZFJlZnJlc2hWaWV3cyk7XG4gICAgICB9LCBmYWxzZSAvKiogdXNlTmF0aXZlVGltZXJzICovKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIHNob3VsZFNjaGVkdWxlVGljaygpOiBib29sZWFuIHtcbiAgICBpZiAodGhpcy5kaXNhYmxlU2NoZWR1bGluZykge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICAvLyBhbHJlYWR5IHNjaGVkdWxlZCBvciBydW5uaW5nXG4gICAgaWYgKHRoaXMucGVuZGluZ1JlbmRlclRhc2tJZCAhPT0gbnVsbCB8fCB0aGlzLnJ1bm5pbmdUaWNrIHx8IHRoaXMuYXBwUmVmLl9ydW5uaW5nVGljaykge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICAvLyBJZiB3ZSdyZSBpbnNpZGUgdGhlIHpvbmUgZG9uJ3QgYm90aGVyIHdpdGggc2NoZWR1bGVyLiBab25lIHdpbGwgc3RhYmlsaXplXG4gICAgLy8gZXZlbnR1YWxseSBhbmQgcnVuIGNoYW5nZSBkZXRlY3Rpb24uXG4gICAgaWYgKHRoaXMuem9uZUlzRGVmaW5lZCAmJiBOZ1pvbmUuaXNJbkFuZ3VsYXJab25lKCkpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDYWxscyBBcHBsaWNhdGlvblJlZi5fdGljayBpbnNpZGUgdGhlIGBOZ1pvbmVgLlxuICAgKlxuICAgKiBDYWxsaW5nIGB0aWNrYCBkaXJlY3RseSBydW5zIGNoYW5nZSBkZXRlY3Rpb24gYW5kIGNhbmNlbHMgYW55IGNoYW5nZSBkZXRlY3Rpb24gdGhhdCBoYWQgYmVlblxuICAgKiBzY2hlZHVsZWQgcHJldmlvdXNseS5cbiAgICpcbiAgICogQHBhcmFtIHNob3VsZFJlZnJlc2hWaWV3cyBQYXNzZWQgZGlyZWN0bHkgdG8gYEFwcGxpY2F0aW9uUmVmLl90aWNrYCBhbmQgc2tpcHMgc3RyYWlnaHQgdG9cbiAgICogICAgIHJlbmRlciBob29rcyB3aGVuIGBmYWxzZWAuXG4gICAqL1xuICBwcml2YXRlIHRpY2soc2hvdWxkUmVmcmVzaFZpZXdzOiBib29sZWFuKTogdm9pZCB7XG4gICAgLy8gV2hlbiBuZ1pvbmUucnVuIGJlbG93IGV4aXRzLCBvbk1pY3JvdGFza0VtcHR5IG1heSBlbWl0IGlmIHRoZSB6b25lIGlzXG4gICAgLy8gc3RhYmxlLiBXZSB3YW50IHRvIHByZXZlbnQgZG91YmxlIHRpY2tpbmcgc28gd2UgdHJhY2sgd2hldGhlciB0aGUgdGljayBpc1xuICAgIC8vIGFscmVhZHkgcnVubmluZyBhbmQgc2tpcCBpdCBpZiBzby5cbiAgICBpZiAodGhpcy5ydW5uaW5nVGljayB8fCB0aGlzLmFwcFJlZi5kZXN0cm95ZWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCB0YXNrID0gdGhpcy50YXNrU2VydmljZS5hZGQoKTtcbiAgICB0cnkge1xuICAgICAgdGhpcy5uZ1pvbmUucnVuKCgpID0+IHtcbiAgICAgICAgdGhpcy5ydW5uaW5nVGljayA9IHRydWU7XG4gICAgICAgIHRoaXMuYXBwUmVmLl90aWNrKHNob3VsZFJlZnJlc2hWaWV3cyk7XG4gICAgICB9LCB1bmRlZmluZWQsIHRoaXMuc2NoZWR1bGVyVGlja0FwcGx5QXJncyk7XG4gICAgfSBjYXRjaCAoZTogdW5rbm93bikge1xuICAgICAgdGhpcy50YXNrU2VydmljZS5yZW1vdmUodGFzayk7XG4gICAgICB0aHJvdyBlO1xuICAgIH0gZmluYWxseSB7XG4gICAgICB0aGlzLmNsZWFudXAoKTtcbiAgICB9XG4gICAgLy8gSWYgd2UncmUgbm90aWZpZWQgb2YgYSBjaGFuZ2Ugd2l0aGluIDEgbWljcm90YXNrIG9mIHJ1bm5pbmcgY2hhbmdlXG4gICAgLy8gZGV0ZWN0aW9uLCBydW4gYW5vdGhlciByb3VuZCBpbiB0aGUgc2FtZSBldmVudCBsb29wLiBUaGlzIGFsbG93cyBjb2RlXG4gICAgLy8gd2hpY2ggdXNlcyBQcm9taXNlLnJlc29sdmUgKHNlZSBOZ01vZGVsKSB0byBhdm9pZFxuICAgIC8vIEV4cHJlc3Npb25DaGFuZ2VkLi4uRXJyb3IgdG8gc3RpbGwgYmUgcmVmbGVjdGVkIGluIGEgc2luZ2xlIGJyb3dzZXJcbiAgICAvLyBwYWludCwgZXZlbiBpZiB0aGF0IHNwYW5zIG11bHRpcGxlIHJvdW5kcyBvZiBjaGFuZ2UgZGV0ZWN0aW9uLlxuICAgIHRoaXMudXNlTWljcm90YXNrU2NoZWR1bGVyID0gdHJ1ZTtcbiAgICBzY2hlZHVsZUNhbGxiYWNrV2l0aE1pY3JvdGFzaygoKSA9PiB7XG4gICAgICB0aGlzLnVzZU1pY3JvdGFza1NjaGVkdWxlciA9IGZhbHNlO1xuICAgICAgdGhpcy50YXNrU2VydmljZS5yZW1vdmUodGFzayk7XG4gICAgfSk7XG4gIH1cblxuICBuZ09uRGVzdHJveSgpIHtcbiAgICB0aGlzLmFmdGVyVGlja1N1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xuICAgIHRoaXMuY2xlYW51cCgpO1xuICB9XG5cbiAgcHJpdmF0ZSBjbGVhbnVwKCkge1xuICAgIHRoaXMuc2hvdWxkUmVmcmVzaFZpZXdzID0gZmFsc2U7XG4gICAgdGhpcy5ydW5uaW5nVGljayA9IGZhbHNlO1xuICAgIHRoaXMuY2FuY2VsU2NoZWR1bGVkQ2FsbGJhY2s/LigpO1xuICAgIHRoaXMuY2FuY2VsU2NoZWR1bGVkQ2FsbGJhY2sgPSBudWxsO1xuICAgIC8vIElmIHRoaXMgaXMgdGhlIGxhc3QgdGFzaywgdGhlIHNlcnZpY2Ugd2lsbCBzeW5jaHJvbm91c2x5IGVtaXQgYSBzdGFibGVcbiAgICAvLyBub3RpZmljYXRpb24uIElmIHRoZXJlIGlzIGEgc3Vic2NyaWJlciB0aGF0IHRoZW4gYWN0cyBpbiBhIHdheSB0aGF0XG4gICAgLy8gdHJpZXMgdG8gbm90aWZ5IHRoZSBzY2hlZHVsZXIgYWdhaW4sIHdlIG5lZWQgdG8gYmUgYWJsZSB0byByZXNwb25kIHRvXG4gICAgLy8gc2NoZWR1bGUgYSBuZXcgY2hhbmdlIGRldGVjdGlvbi4gVGhlcmVmb3JlLCB3ZSBzaG91bGQgY2xlYXIgdGhlIHRhc2sgSURcbiAgICAvLyBiZWZvcmUgcmVtb3ZpbmcgaXQgZnJvbSB0aGUgcGVuZGluZyB0YXNrcyAob3IgdGhlIHRhc2tzIHNlcnZpY2Ugc2hvdWxkXG4gICAgLy8gbm90IHN5bmNocm9ub3VzbHkgZW1pdCBzdGFibGUsIHNpbWlsYXIgdG8gaG93IFpvbmUgc3RhYmxlbmVzcyBvbmx5XG4gICAgLy8gaGFwcGVucyBpZiBpdCdzIHN0aWxsIHN0YWJsZSBhZnRlciBhIG1pY3JvdGFzaykuXG4gICAgaWYgKHRoaXMucGVuZGluZ1JlbmRlclRhc2tJZCAhPT0gbnVsbCkge1xuICAgICAgY29uc3QgdGFza0lkID0gdGhpcy5wZW5kaW5nUmVuZGVyVGFza0lkO1xuICAgICAgdGhpcy5wZW5kaW5nUmVuZGVyVGFza0lkID0gbnVsbDtcbiAgICAgIHRoaXMudGFza1NlcnZpY2UucmVtb3ZlKHRhc2tJZCk7XG4gICAgfVxuICB9XG59XG5cblxuLyoqXG4gKiBQcm92aWRlcyBjaGFuZ2UgZGV0ZWN0aW9uIHdpdGhvdXQgWm9uZUpTIGZvciB0aGUgYXBwbGljYXRpb24gYm9vdHN0cmFwcGVkIHVzaW5nXG4gKiBgYm9vdHN0cmFwQXBwbGljYXRpb25gLlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gYWxsb3dzIHlvdSB0byBjb25maWd1cmUgdGhlIGFwcGxpY2F0aW9uIHRvIG5vdCB1c2UgdGhlIHN0YXRlL3N0YXRlIGNoYW5nZXMgb2ZcbiAqIFpvbmVKUyB0byBzY2hlZHVsZSBjaGFuZ2UgZGV0ZWN0aW9uIGluIHRoZSBhcHBsaWNhdGlvbi4gVGhpcyB3aWxsIHdvcmsgd2hlbiBab25lSlMgaXMgbm90IHByZXNlbnRcbiAqIG9uIHRoZSBwYWdlIGF0IGFsbCBvciBpZiBpdCBleGlzdHMgYmVjYXVzZSBzb21ldGhpbmcgZWxzZSBpcyB1c2luZyBpdCAoZWl0aGVyIGFub3RoZXIgQW5ndWxhclxuICogYXBwbGljYXRpb24gd2hpY2ggdXNlcyBab25lSlMgZm9yIHNjaGVkdWxpbmcgb3Igc29tZSBvdGhlciBsaWJyYXJ5IHRoYXQgcmVsaWVzIG9uIFpvbmVKUykuXG4gKlxuICogVGhpcyBjYW4gYWxzbyBiZSBhZGRlZCB0byB0aGUgYFRlc3RCZWRgIHByb3ZpZGVycyB0byBjb25maWd1cmUgdGhlIHRlc3QgZW52aXJvbm1lbnQgdG8gbW9yZVxuICogY2xvc2VseSBtYXRjaCBwcm9kdWN0aW9uIGJlaGF2aW9yLiBUaGlzIHdpbGwgaGVscCBnaXZlIGhpZ2hlciBjb25maWRlbmNlIHRoYXQgY29tcG9uZW50cyBhcmVcbiAqIGNvbXBhdGlibGUgd2l0aCB6b25lbGVzcyBjaGFuZ2UgZGV0ZWN0aW9uLlxuICpcbiAqIFpvbmVKUyB1c2VzIGJyb3dzZXIgZXZlbnRzIHRvIHRyaWdnZXIgY2hhbmdlIGRldGVjdGlvbi4gV2hlbiB1c2luZyB0aGlzIHByb3ZpZGVyLCBBbmd1bGFyIHdpbGxcbiAqIGluc3RlYWQgdXNlIEFuZ3VsYXIgQVBJcyB0byBzY2hlZHVsZSBjaGFuZ2UgZGV0ZWN0aW9uLiBUaGVzZSBBUElzIGluY2x1ZGU6XG4gKlxuICogLSBgQ2hhbmdlRGV0ZWN0b3JSZWYubWFya0ZvckNoZWNrYFxuICogLSBgQ29tcG9uZW50UmVmLnNldElucHV0YFxuICogLSB1cGRhdGluZyBhIHNpZ25hbCB0aGF0IGlzIHJlYWQgaW4gYSB0ZW1wbGF0ZVxuICogLSB3aGVuIGJvdW5kIGhvc3Qgb3IgdGVtcGxhdGUgbGlzdGVuZXJzIGFyZSB0cmlnZ2VyZWRcbiAqIC0gYXR0YWNoaW5nIGEgdmlldyB0aGF0IHdhcyBtYXJrZWQgZGlydHkgYnkgb25lIG9mIHRoZSBhYm92ZVxuICogLSByZW1vdmluZyBhIHZpZXdcbiAqIC0gcmVnaXN0ZXJpbmcgYSByZW5kZXIgaG9vayAodGVtcGxhdGVzIGFyZSBvbmx5IHJlZnJlc2hlZCBpZiByZW5kZXIgaG9va3MgZG8gb25lIG9mIHRoZSBhYm92ZSlcbiAqXG4gKiBAdXNhZ2VOb3Rlc1xuICogYGBgdHlwZXNjcmlwdFxuICogYm9vdHN0cmFwQXBwbGljYXRpb24oTXlBcHAsIHtwcm92aWRlcnM6IFtcbiAqICAgcHJvdmlkZUV4cGVyaW1lbnRhbFpvbmVsZXNzQ2hhbmdlRGV0ZWN0aW9uKCksXG4gKiBdfSk7XG4gKiBgYGBcbiAqXG4gKiBUaGlzIEFQSSBpcyBleHBlcmltZW50YWwuIE5laXRoZXIgdGhlIHNoYXBlLCBub3IgdGhlIHVuZGVybHlpbmcgYmVoYXZpb3IgaXMgc3RhYmxlIGFuZCBjYW4gY2hhbmdlXG4gKiBpbiBwYXRjaCB2ZXJzaW9ucy4gVGhlcmUgYXJlIGtub3duIGZlYXR1cmUgZ2FwcyBhbmQgQVBJIGVyZ29ub21pYyBjb25zaWRlcmF0aW9ucy4gV2Ugd2lsbCBpdGVyYXRlXG4gKiBvbiB0aGUgZXhhY3QgQVBJIGJhc2VkIG9uIHRoZSBmZWVkYmFjayBhbmQgb3VyIHVuZGVyc3RhbmRpbmcgb2YgdGhlIHByb2JsZW0gYW5kIHNvbHV0aW9uIHNwYWNlLlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqIEBleHBlcmltZW50YWxcbiAqIEBzZWUge0BsaW5rIGJvb3RzdHJhcEFwcGxpY2F0aW9ufVxuICovXG5leHBvcnQgZnVuY3Rpb24gcHJvdmlkZUV4cGVyaW1lbnRhbFpvbmVsZXNzQ2hhbmdlRGV0ZWN0aW9uKCk6IEVudmlyb25tZW50UHJvdmlkZXJzIHtcbiAgcGVyZm9ybWFuY2VNYXJrRmVhdHVyZSgnTmdab25lbGVzcycpO1xuICByZXR1cm4gbWFrZUVudmlyb25tZW50UHJvdmlkZXJzKFtcbiAgICB7cHJvdmlkZTogQ2hhbmdlRGV0ZWN0aW9uU2NoZWR1bGVyLCB1c2VFeGlzdGluZzogQ2hhbmdlRGV0ZWN0aW9uU2NoZWR1bGVySW1wbH0sXG4gICAge3Byb3ZpZGU6IE5nWm9uZSwgdXNlQ2xhc3M6IE5vb3BOZ1pvbmV9LFxuICAgIHtwcm92aWRlOiBaT05FTEVTU19FTkFCTEVELCB1c2VWYWx1ZTogdHJ1ZX0sXG4gIF0pO1xufVxuIl19