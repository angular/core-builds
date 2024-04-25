/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Subscription } from 'rxjs';
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
        this.ngZone = inject(NgZone);
        this.zonelessEnabled = inject(ZONELESS_ENABLED);
        this.disableScheduling = inject(ZONELESS_SCHEDULER_DISABLED, { optional: true }) ?? false;
        this.zoneIsDefined = typeof Zone !== 'undefined' && !!Zone.root.run;
        this.schedulerTickApplyArgs = [{ data: { '__scheduler_tick__': true } }];
        this.subscriptions = new Subscription();
        this.cancelScheduledCallback = null;
        this.shouldRefreshViews = false;
        this.pendingRenderTaskId = null;
        this.useMicrotaskScheduler = false;
        this.runningTick = false;
        this.subscriptions.add(this.appRef.afterTick.subscribe(() => {
            // If the scheduler isn't running a tick but the application ticked, that means
            // someone called ApplicationRef.tick manually. In this case, we should cancel
            // any change detections that had been scheduled so we don't run an extra one.
            if (!this.runningTick) {
                this.cleanup();
            }
        }));
        this.subscriptions.add(this.ngZone.onUnstable.subscribe(() => {
            // If the zone becomes unstable when we're not running tick (this happens from the zone.run),
            // we should cancel any scheduled change detection here because at this point we
            // know that the zone will stabilize at some point and run change detection itself.
            if (!this.runningTick) {
                this.cleanup();
            }
        }));
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
        this.subscriptions.unsubscribe();
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiem9uZWxlc3Nfc2NoZWR1bGluZ19pbXBsLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvY2hhbmdlX2RldGVjdGlvbi9zY2hlZHVsaW5nL3pvbmVsZXNzX3NjaGVkdWxpbmdfaW1wbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQUMsWUFBWSxFQUFDLE1BQU0sTUFBTSxDQUFDO0FBRWxDLE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSxtQ0FBbUMsQ0FBQztBQUNqRSxPQUFPLEVBQUMsVUFBVSxFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFDL0MsT0FBTyxFQUFDLE1BQU0sRUFBQyxNQUFNLGlDQUFpQyxDQUFDO0FBRXZELE9BQU8sRUFBQyx3QkFBd0IsRUFBQyxNQUFNLDhCQUE4QixDQUFDO0FBQ3RFLE9BQU8sRUFBQyxZQUFZLEVBQW1CLE1BQU0sY0FBYyxDQUFDO0FBQzVELE9BQU8sRUFBQyxZQUFZLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUNqRCxPQUFPLEVBQUMsNkJBQTZCLEVBQUUsMkJBQTJCLEVBQUMsTUFBTSwrQkFBK0IsQ0FBQztBQUN6RyxPQUFPLEVBQUMsc0JBQXNCLEVBQUMsTUFBTSx3QkFBd0IsQ0FBQztBQUM5RCxPQUFPLEVBQUMsTUFBTSxFQUFFLFVBQVUsRUFBQyxNQUFNLG9CQUFvQixDQUFDO0FBRXRELE9BQU8sRUFBQyx3QkFBd0IsRUFBc0IsZ0JBQWdCLEVBQUUsMkJBQTJCLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQzs7QUFFbEksTUFBTSx3Q0FBd0MsR0FBRyxHQUFHLENBQUM7QUFDckQsSUFBSSxpQ0FBaUMsR0FBRyxDQUFDLENBQUM7QUFDMUMsSUFBSSw2QkFBNkIsR0FBYSxFQUFFLENBQUM7QUFFakQsU0FBUyxzQ0FBc0M7SUFDN0MsaUNBQWlDLEVBQUUsQ0FBQztJQUNwQyxJQUFJLHdDQUF3QyxH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QUF5RTtRQUN6RSxzRUFBc0U7UUFDdEUsd0VBQXdFO1FBQ3hFLDBFQUEwRTtRQUMxRSx5RUFBeUU7UUFDekUscUVBQXFFO1FBQ3JFLG1EQUFtRDtRQUNuRCxJQUFJLElBQUksQ0FBQyxtQkFBbUIsS0FBSyxJQUFJLEVBQUUsQ0FBQztZQUN0QyxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsbUJBQW1CLENBQUM7WUFDeEMsSUFBSSxDQUFDLG1CQUFtQixHQUFHLElBQUksQ0FBQztZQUNoQyxJQUFJLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUNsQyxDQUFDO0lBQ0gsQ0FBQzs2RkEzTFUsNEJBQTRCO3VFQUE1Qiw0QkFBNEIsV0FBNUIsNEJBQTRCLG1CQURoQixNQUFNOztnRkFDbEIsNEJBQTRCO2NBRHhDLFVBQVU7ZUFBQyxFQUFDLFVBQVUsRUFBRSxNQUFNLEVBQUM7O0FBZ01oQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7R0FzQ0c7QUFDSCxNQUFNLFVBQVUsMENBQTBDO0lBQ3hELHNCQUFzQixDQUFDLFlBQVksQ0FBQyxDQUFDO0lBQ3JDLE9BQU8sd0JBQXdCLENBQUM7UUFDOUIsRUFBQyxPQUFPLEVBQUUsd0JBQXdCLEVBQUUsV0FBVyxFQUFFLDRCQUE0QixFQUFDO1FBQzlFLEVBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxRQUFRLEVBQUUsVUFBVSxFQUFDO1FBQ3ZDLEVBQUMsT0FBTyxFQUFFLGdCQUFnQixFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUM7S0FDNUMsQ0FBQyxDQUFDO0FBQ0wsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1N1YnNjcmlwdGlvbn0gZnJvbSAncnhqcyc7XG5cbmltcG9ydCB7QXBwbGljYXRpb25SZWZ9IGZyb20gJy4uLy4uL2FwcGxpY2F0aW9uL2FwcGxpY2F0aW9uX3JlZic7XG5pbXBvcnQge0luamVjdGFibGV9IGZyb20gJy4uLy4uL2RpL2luamVjdGFibGUnO1xuaW1wb3J0IHtpbmplY3R9IGZyb20gJy4uLy4uL2RpL2luamVjdG9yX2NvbXBhdGliaWxpdHknO1xuaW1wb3J0IHtFbnZpcm9ubWVudFByb3ZpZGVyc30gZnJvbSAnLi4vLi4vZGkvaW50ZXJmYWNlL3Byb3ZpZGVyJztcbmltcG9ydCB7bWFrZUVudmlyb25tZW50UHJvdmlkZXJzfSBmcm9tICcuLi8uLi9kaS9wcm92aWRlcl9jb2xsZWN0aW9uJztcbmltcG9ydCB7UnVudGltZUVycm9yLCBSdW50aW1lRXJyb3JDb2RlfSBmcm9tICcuLi8uLi9lcnJvcnMnO1xuaW1wb3J0IHtQZW5kaW5nVGFza3N9IGZyb20gJy4uLy4uL3BlbmRpbmdfdGFza3MnO1xuaW1wb3J0IHtzY2hlZHVsZUNhbGxiYWNrV2l0aE1pY3JvdGFzaywgc2NoZWR1bGVDYWxsYmFja1dpdGhSYWZSYWNlfSBmcm9tICcuLi8uLi91dGlsL2NhbGxiYWNrX3NjaGVkdWxlcic7XG5pbXBvcnQge3BlcmZvcm1hbmNlTWFya0ZlYXR1cmV9IGZyb20gJy4uLy4uL3V0aWwvcGVyZm9ybWFuY2UnO1xuaW1wb3J0IHtOZ1pvbmUsIE5vb3BOZ1pvbmV9IGZyb20gJy4uLy4uL3pvbmUvbmdfem9uZSc7XG5cbmltcG9ydCB7Q2hhbmdlRGV0ZWN0aW9uU2NoZWR1bGVyLCBOb3RpZmljYXRpb25Tb3VyY2UsIFpPTkVMRVNTX0VOQUJMRUQsIFpPTkVMRVNTX1NDSEVEVUxFUl9ESVNBQkxFRH0gZnJvbSAnLi96b25lbGVzc19zY2hlZHVsaW5nJztcblxuY29uc3QgQ09OU0VDVVRJVkVfTUlDUk9UQVNLX05PVElGSUNBVElPTl9MSU1JVCA9IDEwMDtcbmxldCBjb25zZWN1dGl2ZU1pY3JvdGFza05vdGlmaWNhdGlvbnMgPSAwO1xubGV0IHN0YWNrRnJvbUxhc3RGZXdOb3RpZmljYXRpb25zOiBzdHJpbmdbXSA9IFtdO1xuXG5mdW5jdGlvbiB0cmFja01pY3JvdGFza05vdGlmaWNhdGlvbkZvckRlYnVnZ2luZygpIHtcbiAgY29uc2VjdXRpdmVNaWNyb3Rhc2tOb3RpZmljYXRpb25zKys7XG4gIGlmIChDT05TRUNVVElWRV9NSUNST1RBU0tfTk9USUZJQ0FUSU9OX0xJTUlUIC0gY29uc2VjdXRpdmVNaWNyb3Rhc2tOb3RpZmljYXRpb25zIDwgNSkge1xuICAgIGNvbnN0IHN0YWNrID0gbmV3IEVycm9yKCkuc3RhY2s7XG4gICAgaWYgKHN0YWNrKSB7XG4gICAgICBzdGFja0Zyb21MYXN0RmV3Tm90aWZpY2F0aW9ucy5wdXNoKHN0YWNrKTtcbiAgICB9XG4gIH1cblxuICBpZiAoY29uc2VjdXRpdmVNaWNyb3Rhc2tOb3RpZmljYXRpb25zID09PSBDT05TRUNVVElWRV9NSUNST1RBU0tfTk9USUZJQ0FUSU9OX0xJTUlUKSB7XG4gICAgdGhyb3cgbmV3IFJ1bnRpbWVFcnJvcihcbiAgICAgICAgUnVudGltZUVycm9yQ29kZS5JTkZJTklURV9DSEFOR0VfREVURUNUSU9OLFxuICAgICAgICAnQW5ndWxhciBjb3VsZCBub3Qgc3RhYmlsaXplIGJlY2F1c2UgdGhlcmUgd2VyZSBlbmRsZXNzIGNoYW5nZSBub3RpZmljYXRpb25zIHdpdGhpbiB0aGUgYnJvd3NlciBldmVudCBsb29wLiAnICtcbiAgICAgICAgICAgICdUaGUgc3RhY2sgZnJvbSB0aGUgbGFzdCBzZXZlcmFsIG5vdGlmaWNhdGlvbnM6IFxcbicgK1xuICAgICAgICAgICAgc3RhY2tGcm9tTGFzdEZld05vdGlmaWNhdGlvbnMuam9pbignXFxuJykpO1xuICB9XG59XG5cbkBJbmplY3RhYmxlKHtwcm92aWRlZEluOiAncm9vdCd9KVxuZXhwb3J0IGNsYXNzIENoYW5nZURldGVjdGlvblNjaGVkdWxlckltcGwgaW1wbGVtZW50cyBDaGFuZ2VEZXRlY3Rpb25TY2hlZHVsZXIge1xuICBwcml2YXRlIHJlYWRvbmx5IGFwcFJlZiA9IGluamVjdChBcHBsaWNhdGlvblJlZik7XG4gIHByaXZhdGUgcmVhZG9ubHkgdGFza1NlcnZpY2UgPSBpbmplY3QoUGVuZGluZ1Rhc2tzKTtcbiAgcHJpdmF0ZSByZWFkb25seSBuZ1pvbmUgPSBpbmplY3QoTmdab25lKTtcbiAgcHJpdmF0ZSByZWFkb25seSB6b25lbGVzc0VuYWJsZWQgPSBpbmplY3QoWk9ORUxFU1NfRU5BQkxFRCk7XG4gIHByaXZhdGUgcmVhZG9ubHkgZGlzYWJsZVNjaGVkdWxpbmcgPVxuICAgICAgaW5qZWN0KFpPTkVMRVNTX1NDSEVEVUxFUl9ESVNBQkxFRCwge29wdGlvbmFsOiB0cnVlfSkgPz8gZmFsc2U7XG4gIHByaXZhdGUgcmVhZG9ubHkgem9uZUlzRGVmaW5lZCA9IHR5cGVvZiBab25lICE9PSAndW5kZWZpbmVkJyAmJiAhIVpvbmUucm9vdC5ydW47XG4gIHByaXZhdGUgcmVhZG9ubHkgc2NoZWR1bGVyVGlja0FwcGx5QXJncyA9IFt7ZGF0YTogeydfX3NjaGVkdWxlcl90aWNrX18nOiB0cnVlfX1dO1xuICBwcml2YXRlIHJlYWRvbmx5IHN1YnNjcmlwdGlvbnMgPSBuZXcgU3Vic2NyaXB0aW9uKCk7XG5cbiAgcHJpdmF0ZSBjYW5jZWxTY2hlZHVsZWRDYWxsYmFjazogbnVsbHwoKCkgPT4gdm9pZCkgPSBudWxsO1xuICBwcml2YXRlIHNob3VsZFJlZnJlc2hWaWV3cyA9IGZhbHNlO1xuICBwcml2YXRlIHBlbmRpbmdSZW5kZXJUYXNrSWQ6IG51bWJlcnxudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSB1c2VNaWNyb3Rhc2tTY2hlZHVsZXIgPSBmYWxzZTtcbiAgcnVubmluZ1RpY2sgPSBmYWxzZTtcblxuICBjb25zdHJ1Y3RvcigpIHtcbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMuYWRkKHRoaXMuYXBwUmVmLmFmdGVyVGljay5zdWJzY3JpYmUoKCkgPT4ge1xuICAgICAgLy8gSWYgdGhlIHNjaGVkdWxlciBpc24ndCBydW5uaW5nIGEgdGljayBidXQgdGhlIGFwcGxpY2F0aW9uIHRpY2tlZCwgdGhhdCBtZWFuc1xuICAgICAgLy8gc29tZW9uZSBjYWxsZWQgQXBwbGljYXRpb25SZWYudGljayBtYW51YWxseS4gSW4gdGhpcyBjYXNlLCB3ZSBzaG91bGQgY2FuY2VsXG4gICAgICAvLyBhbnkgY2hhbmdlIGRldGVjdGlvbnMgdGhhdCBoYWQgYmVlbiBzY2hlZHVsZWQgc28gd2UgZG9uJ3QgcnVuIGFuIGV4dHJhIG9uZS5cbiAgICAgIGlmICghdGhpcy5ydW5uaW5nVGljaykge1xuICAgICAgICB0aGlzLmNsZWFudXAoKTtcbiAgICAgIH1cbiAgICB9KSk7XG4gICAgdGhpcy5zdWJzY3JpcHRpb25zLmFkZCh0aGlzLm5nWm9uZS5vblVuc3RhYmxlLnN1YnNjcmliZSgoKSA9PiB7XG4gICAgICAvLyBJZiB0aGUgem9uZSBiZWNvbWVzIHVuc3RhYmxlIHdoZW4gd2UncmUgbm90IHJ1bm5pbmcgdGljayAodGhpcyBoYXBwZW5zIGZyb20gdGhlIHpvbmUucnVuKSxcbiAgICAgIC8vIHdlIHNob3VsZCBjYW5jZWwgYW55IHNjaGVkdWxlZCBjaGFuZ2UgZGV0ZWN0aW9uIGhlcmUgYmVjYXVzZSBhdCB0aGlzIHBvaW50IHdlXG4gICAgICAvLyBrbm93IHRoYXQgdGhlIHpvbmUgd2lsbCBzdGFiaWxpemUgYXQgc29tZSBwb2ludCBhbmQgcnVuIGNoYW5nZSBkZXRlY3Rpb24gaXRzZWxmLlxuICAgICAgaWYgKCF0aGlzLnJ1bm5pbmdUaWNrKSB7XG4gICAgICAgIHRoaXMuY2xlYW51cCgpO1xuICAgICAgfVxuICAgIH0pKTtcblxuICAgIC8vIFRPRE8oYXRzY290dCk6IFRoZXNlIGNvbmRpdGlvbnMgd2lsbCBuZWVkIHRvIGNoYW5nZSB3aGVuIHpvbmVsZXNzIGlzIHRoZSBkZWZhdWx0XG4gICAgLy8gSW5zdGVhZCwgdGhleSBzaG91bGQgZmxpcCB0byBjaGVja2luZyBpZiBab25lSlMgc2NoZWR1bGluZyBpcyBwcm92aWRlZFxuICAgIHRoaXMuZGlzYWJsZVNjaGVkdWxpbmcgfHw9ICF0aGlzLnpvbmVsZXNzRW5hYmxlZCAmJlxuICAgICAgICAvLyBOb29wTmdab25lIHdpdGhvdXQgZW5hYmxpbmcgem9uZWxlc3MgbWVhbnMgbm8gc2NoZWR1bGluZyB3aGF0c29ldmVyXG4gICAgICAgICh0aGlzLm5nWm9uZSBpbnN0YW5jZW9mIE5vb3BOZ1pvbmUgfHxcbiAgICAgICAgIC8vIFRoZSBzYW1lIGdvZXMgZm9yIHRoZSBsYWNrIG9mIFpvbmUgd2l0aG91dCBlbmFibGluZyB6b25lbGVzcyBzY2hlZHVsaW5nXG4gICAgICAgICAhdGhpcy56b25lSXNEZWZpbmVkKTtcbiAgfVxuXG4gIG5vdGlmeShzb3VyY2U6IE5vdGlmaWNhdGlvblNvdXJjZSk6IHZvaWQge1xuICAgIGlmICghdGhpcy56b25lbGVzc0VuYWJsZWQgJiYgc291cmNlID09PSBOb3RpZmljYXRpb25Tb3VyY2UuTGlzdGVuZXIpIHtcbiAgICAgIC8vIFdoZW4gdGhlIG5vdGlmaWNhdGlvbiBjb21lcyBmcm9tIGEgbGlzdGVuZXIsIHdlIHNraXAgdGhlIG5vdGlmaWNhdGlvbiB1bmxlc3MgdGhlXG4gICAgICAvLyBhcHBsaWNhdGlvbiBoYXMgZW5hYmxlZCB6b25lbGVzcy4gSWRlYWxseSwgbGlzdGVuZXJzIHdvdWxkbid0IG5vdGlmeSB0aGUgc2NoZWR1bGVyIGF0IGFsbFxuICAgICAgLy8gYXV0b21hdGljYWxseS4gV2UgZG8gbm90IGtub3cgdGhhdCBhIGRldmVsb3BlciBtYWRlIGEgY2hhbmdlIGluIHRoZSBsaXN0ZW5lciBjYWxsYmFjayB0aGF0XG4gICAgICAvLyByZXF1aXJlcyBhbiBgQXBwbGljYXRpb25SZWYudGlja2AgKHN5bmNocm9uaXplIHRlbXBsYXRlcyAvIHJ1biByZW5kZXIgaG9va3MpLiBXZSBkbyB0aGlzXG4gICAgICAvLyBvbmx5IGZvciBhbiBlYXNpZXIgbWlncmF0aW9uIGZyb20gT25QdXNoIGNvbXBvbmVudHMgdG8gem9uZWxlc3MuIEJlY2F1c2UgbGlzdGVuZXJzIGFyZVxuICAgICAgLy8gdXN1YWxseSBleGVjdXRlZCBpbnNpZGUgdGhlIEFuZ3VsYXIgem9uZSBhbmQgbGlzdGVuZXJzIGF1dG9tYXRpY2FsbHkgY2FsbCBgbWFya1ZpZXdEaXJ0eWAsXG4gICAgICAvLyBkZXZlbG9wZXJzIG5ldmVyIG5lZWRlZCB0byBtYW51YWxseSB1c2UgYENoYW5nZURldGVjdG9yUmVmLm1hcmtGb3JDaGVja2Agb3Igc29tZSBvdGhlciBBUElcbiAgICAgIC8vIHRvIG1ha2UgbGlzdGVuZXIgY2FsbGJhY2tzIHdvcmsgY29ycmVjdGx5IHdpdGggYE9uUHVzaGAgY29tcG9uZW50cy5cbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgc3dpdGNoIChzb3VyY2UpIHtcbiAgICAgIGNhc2UgTm90aWZpY2F0aW9uU291cmNlLkRlYnVnQXBwbHlDaGFuZ2VzOlxuICAgICAgY2FzZSBOb3RpZmljYXRpb25Tb3VyY2UuRGVmZXJCbG9ja1N0YXRlVXBkYXRlOlxuICAgICAgY2FzZSBOb3RpZmljYXRpb25Tb3VyY2UuTWFya0FuY2VzdG9yc0ZvclRyYXZlcnNhbDpcbiAgICAgIGNhc2UgTm90aWZpY2F0aW9uU291cmNlLk1hcmtGb3JDaGVjazpcbiAgICAgIGNhc2UgTm90aWZpY2F0aW9uU291cmNlLkxpc3RlbmVyOlxuICAgICAgY2FzZSBOb3RpZmljYXRpb25Tb3VyY2UuQW5pbWF0aW9uUXVldWVkTm9kZVJlbW92YWw6XG4gICAgICBjYXNlIE5vdGlmaWNhdGlvblNvdXJjZS5TZXRJbnB1dDoge1xuICAgICAgICB0aGlzLnNob3VsZFJlZnJlc2hWaWV3cyA9IHRydWU7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgY2FzZSBOb3RpZmljYXRpb25Tb3VyY2UuVmlld0RldGFjaGVkRnJvbURPTTpcbiAgICAgIGNhc2UgTm90aWZpY2F0aW9uU291cmNlLlZpZXdBdHRhY2hlZDpcbiAgICAgIGNhc2UgTm90aWZpY2F0aW9uU291cmNlLk5ld1JlbmRlckhvb2s6XG4gICAgICBjYXNlIE5vdGlmaWNhdGlvblNvdXJjZS5Bc3luY0FuaW1hdGlvbnNMb2FkZWQ6XG4gICAgICBkZWZhdWx0OiB7XG4gICAgICAgIC8vIFRoZXNlIG5vdGlmaWNhdGlvbnMgb25seSBzY2hlZHVsZSBhIHRpY2sgYnV0IGRvIG5vdCBjaGFuZ2Ugd2hldGhlciB3ZSBzaG91bGQgcmVmcmVzaFxuICAgICAgICAvLyB2aWV3cy4gSW5zdGVhZCwgd2Ugb25seSBuZWVkIHRvIHJ1biByZW5kZXIgaG9va3MgdW5sZXNzIGFub3RoZXIgbm90aWZpY2F0aW9uIGZyb20gdGhlXG4gICAgICAgIC8vIG90aGVyIHNldCBpcyBhbHNvIHJlY2VpdmVkIGJlZm9yZSBgdGlja2AgaGFwcGVucy5cbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoIXRoaXMuc2hvdWxkU2NoZWR1bGVUaWNrKCkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAoKHR5cGVvZiBuZ0Rldk1vZGUgPT09ICd1bmRlZmluZWQnIHx8IG5nRGV2TW9kZSkpIHtcbiAgICAgIGlmICh0aGlzLnVzZU1pY3JvdGFza1NjaGVkdWxlcikge1xuICAgICAgICB0cmFja01pY3JvdGFza05vdGlmaWNhdGlvbkZvckRlYnVnZ2luZygpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc2VjdXRpdmVNaWNyb3Rhc2tOb3RpZmljYXRpb25zID0gMDtcbiAgICAgICAgc3RhY2tGcm9tTGFzdEZld05vdGlmaWNhdGlvbnMubGVuZ3RoID0gMDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zdCBzY2hlZHVsZUNhbGxiYWNrID1cbiAgICAgICAgdGhpcy51c2VNaWNyb3Rhc2tTY2hlZHVsZXIgPyBzY2hlZHVsZUNhbGxiYWNrV2l0aE1pY3JvdGFzayA6IHNjaGVkdWxlQ2FsbGJhY2tXaXRoUmFmUmFjZTtcbiAgICB0aGlzLnBlbmRpbmdSZW5kZXJUYXNrSWQgPSB0aGlzLnRhc2tTZXJ2aWNlLmFkZCgpO1xuICAgIGlmICh0aGlzLnpvbmVJc0RlZmluZWQpIHtcbiAgICAgIFpvbmUucm9vdC5ydW4oKCkgPT4ge1xuICAgICAgICB0aGlzLmNhbmNlbFNjaGVkdWxlZENhbGxiYWNrID0gc2NoZWR1bGVDYWxsYmFjaygoKSA9PiB7XG4gICAgICAgICAgdGhpcy50aWNrKHRoaXMuc2hvdWxkUmVmcmVzaFZpZXdzKTtcbiAgICAgICAgfSwgZmFsc2UgLyoqIHVzZU5hdGl2ZVRpbWVycyAqLyk7XG4gICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5jYW5jZWxTY2hlZHVsZWRDYWxsYmFjayA9IHNjaGVkdWxlQ2FsbGJhY2soKCkgPT4ge1xuICAgICAgICB0aGlzLnRpY2sodGhpcy5zaG91bGRSZWZyZXNoVmlld3MpO1xuICAgICAgfSwgZmFsc2UgLyoqIHVzZU5hdGl2ZVRpbWVycyAqLyk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBzaG91bGRTY2hlZHVsZVRpY2soKTogYm9vbGVhbiB7XG4gICAgaWYgKHRoaXMuZGlzYWJsZVNjaGVkdWxpbmcpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgLy8gYWxyZWFkeSBzY2hlZHVsZWQgb3IgcnVubmluZ1xuICAgIGlmICh0aGlzLnBlbmRpbmdSZW5kZXJUYXNrSWQgIT09IG51bGwgfHwgdGhpcy5ydW5uaW5nVGljayB8fCB0aGlzLmFwcFJlZi5fcnVubmluZ1RpY2spIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgLy8gSWYgd2UncmUgaW5zaWRlIHRoZSB6b25lIGRvbid0IGJvdGhlciB3aXRoIHNjaGVkdWxlci4gWm9uZSB3aWxsIHN0YWJpbGl6ZVxuICAgIC8vIGV2ZW50dWFsbHkgYW5kIHJ1biBjaGFuZ2UgZGV0ZWN0aW9uLlxuICAgIGlmICh0aGlzLnpvbmVJc0RlZmluZWQgJiYgTmdab25lLmlzSW5Bbmd1bGFyWm9uZSgpKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICAvKipcbiAgICogQ2FsbHMgQXBwbGljYXRpb25SZWYuX3RpY2sgaW5zaWRlIHRoZSBgTmdab25lYC5cbiAgICpcbiAgICogQ2FsbGluZyBgdGlja2AgZGlyZWN0bHkgcnVucyBjaGFuZ2UgZGV0ZWN0aW9uIGFuZCBjYW5jZWxzIGFueSBjaGFuZ2UgZGV0ZWN0aW9uIHRoYXQgaGFkIGJlZW5cbiAgICogc2NoZWR1bGVkIHByZXZpb3VzbHkuXG4gICAqXG4gICAqIEBwYXJhbSBzaG91bGRSZWZyZXNoVmlld3MgUGFzc2VkIGRpcmVjdGx5IHRvIGBBcHBsaWNhdGlvblJlZi5fdGlja2AgYW5kIHNraXBzIHN0cmFpZ2h0IHRvXG4gICAqICAgICByZW5kZXIgaG9va3Mgd2hlbiBgZmFsc2VgLlxuICAgKi9cbiAgcHJpdmF0ZSB0aWNrKHNob3VsZFJlZnJlc2hWaWV3czogYm9vbGVhbik6IHZvaWQge1xuICAgIC8vIFdoZW4gbmdab25lLnJ1biBiZWxvdyBleGl0cywgb25NaWNyb3Rhc2tFbXB0eSBtYXkgZW1pdCBpZiB0aGUgem9uZSBpc1xuICAgIC8vIHN0YWJsZS4gV2Ugd2FudCB0byBwcmV2ZW50IGRvdWJsZSB0aWNraW5nIHNvIHdlIHRyYWNrIHdoZXRoZXIgdGhlIHRpY2sgaXNcbiAgICAvLyBhbHJlYWR5IHJ1bm5pbmcgYW5kIHNraXAgaXQgaWYgc28uXG4gICAgaWYgKHRoaXMucnVubmluZ1RpY2sgfHwgdGhpcy5hcHBSZWYuZGVzdHJveWVkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgdGFzayA9IHRoaXMudGFza1NlcnZpY2UuYWRkKCk7XG4gICAgdHJ5IHtcbiAgICAgIHRoaXMubmdab25lLnJ1bigoKSA9PiB7XG4gICAgICAgIHRoaXMucnVubmluZ1RpY2sgPSB0cnVlO1xuICAgICAgICB0aGlzLmFwcFJlZi5fdGljayhzaG91bGRSZWZyZXNoVmlld3MpO1xuICAgICAgfSwgdW5kZWZpbmVkLCB0aGlzLnNjaGVkdWxlclRpY2tBcHBseUFyZ3MpO1xuICAgIH0gY2F0Y2ggKGU6IHVua25vd24pIHtcbiAgICAgIHRoaXMudGFza1NlcnZpY2UucmVtb3ZlKHRhc2spO1xuICAgICAgdGhyb3cgZTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgdGhpcy5jbGVhbnVwKCk7XG4gICAgfVxuICAgIC8vIElmIHdlJ3JlIG5vdGlmaWVkIG9mIGEgY2hhbmdlIHdpdGhpbiAxIG1pY3JvdGFzayBvZiBydW5uaW5nIGNoYW5nZVxuICAgIC8vIGRldGVjdGlvbiwgcnVuIGFub3RoZXIgcm91bmQgaW4gdGhlIHNhbWUgZXZlbnQgbG9vcC4gVGhpcyBhbGxvd3MgY29kZVxuICAgIC8vIHdoaWNoIHVzZXMgUHJvbWlzZS5yZXNvbHZlIChzZWUgTmdNb2RlbCkgdG8gYXZvaWRcbiAgICAvLyBFeHByZXNzaW9uQ2hhbmdlZC4uLkVycm9yIHRvIHN0aWxsIGJlIHJlZmxlY3RlZCBpbiBhIHNpbmdsZSBicm93c2VyXG4gICAgLy8gcGFpbnQsIGV2ZW4gaWYgdGhhdCBzcGFucyBtdWx0aXBsZSByb3VuZHMgb2YgY2hhbmdlIGRldGVjdGlvbi5cbiAgICB0aGlzLnVzZU1pY3JvdGFza1NjaGVkdWxlciA9IHRydWU7XG4gICAgc2NoZWR1bGVDYWxsYmFja1dpdGhNaWNyb3Rhc2soKCkgPT4ge1xuICAgICAgdGhpcy51c2VNaWNyb3Rhc2tTY2hlZHVsZXIgPSBmYWxzZTtcbiAgICAgIHRoaXMudGFza1NlcnZpY2UucmVtb3ZlKHRhc2spO1xuICAgIH0pO1xuICB9XG5cbiAgbmdPbkRlc3Ryb3koKSB7XG4gICAgdGhpcy5zdWJzY3JpcHRpb25zLnVuc3Vic2NyaWJlKCk7XG4gICAgdGhpcy5jbGVhbnVwKCk7XG4gIH1cblxuICBwcml2YXRlIGNsZWFudXAoKSB7XG4gICAgdGhpcy5zaG91bGRSZWZyZXNoVmlld3MgPSBmYWxzZTtcbiAgICB0aGlzLnJ1bm5pbmdUaWNrID0gZmFsc2U7XG4gICAgdGhpcy5jYW5jZWxTY2hlZHVsZWRDYWxsYmFjaz8uKCk7XG4gICAgdGhpcy5jYW5jZWxTY2hlZHVsZWRDYWxsYmFjayA9IG51bGw7XG4gICAgLy8gSWYgdGhpcyBpcyB0aGUgbGFzdCB0YXNrLCB0aGUgc2VydmljZSB3aWxsIHN5bmNocm9ub3VzbHkgZW1pdCBhIHN0YWJsZVxuICAgIC8vIG5vdGlmaWNhdGlvbi4gSWYgdGhlcmUgaXMgYSBzdWJzY3JpYmVyIHRoYXQgdGhlbiBhY3RzIGluIGEgd2F5IHRoYXRcbiAgICAvLyB0cmllcyB0byBub3RpZnkgdGhlIHNjaGVkdWxlciBhZ2Fpbiwgd2UgbmVlZCB0byBiZSBhYmxlIHRvIHJlc3BvbmQgdG9cbiAgICAvLyBzY2hlZHVsZSBhIG5ldyBjaGFuZ2UgZGV0ZWN0aW9uLiBUaGVyZWZvcmUsIHdlIHNob3VsZCBjbGVhciB0aGUgdGFzayBJRFxuICAgIC8vIGJlZm9yZSByZW1vdmluZyBpdCBmcm9tIHRoZSBwZW5kaW5nIHRhc2tzIChvciB0aGUgdGFza3Mgc2VydmljZSBzaG91bGRcbiAgICAvLyBub3Qgc3luY2hyb25vdXNseSBlbWl0IHN0YWJsZSwgc2ltaWxhciB0byBob3cgWm9uZSBzdGFibGVuZXNzIG9ubHlcbiAgICAvLyBoYXBwZW5zIGlmIGl0J3Mgc3RpbGwgc3RhYmxlIGFmdGVyIGEgbWljcm90YXNrKS5cbiAgICBpZiAodGhpcy5wZW5kaW5nUmVuZGVyVGFza0lkICE9PSBudWxsKSB7XG4gICAgICBjb25zdCB0YXNrSWQgPSB0aGlzLnBlbmRpbmdSZW5kZXJUYXNrSWQ7XG4gICAgICB0aGlzLnBlbmRpbmdSZW5kZXJUYXNrSWQgPSBudWxsO1xuICAgICAgdGhpcy50YXNrU2VydmljZS5yZW1vdmUodGFza0lkKTtcbiAgICB9XG4gIH1cbn1cblxuXG4vKipcbiAqIFByb3ZpZGVzIGNoYW5nZSBkZXRlY3Rpb24gd2l0aG91dCBab25lSlMgZm9yIHRoZSBhcHBsaWNhdGlvbiBib290c3RyYXBwZWQgdXNpbmdcbiAqIGBib290c3RyYXBBcHBsaWNhdGlvbmAuXG4gKlxuICogVGhpcyBmdW5jdGlvbiBhbGxvd3MgeW91IHRvIGNvbmZpZ3VyZSB0aGUgYXBwbGljYXRpb24gdG8gbm90IHVzZSB0aGUgc3RhdGUvc3RhdGUgY2hhbmdlcyBvZlxuICogWm9uZUpTIHRvIHNjaGVkdWxlIGNoYW5nZSBkZXRlY3Rpb24gaW4gdGhlIGFwcGxpY2F0aW9uLiBUaGlzIHdpbGwgd29yayB3aGVuIFpvbmVKUyBpcyBub3QgcHJlc2VudFxuICogb24gdGhlIHBhZ2UgYXQgYWxsIG9yIGlmIGl0IGV4aXN0cyBiZWNhdXNlIHNvbWV0aGluZyBlbHNlIGlzIHVzaW5nIGl0IChlaXRoZXIgYW5vdGhlciBBbmd1bGFyXG4gKiBhcHBsaWNhdGlvbiB3aGljaCB1c2VzIFpvbmVKUyBmb3Igc2NoZWR1bGluZyBvciBzb21lIG90aGVyIGxpYnJhcnkgdGhhdCByZWxpZXMgb24gWm9uZUpTKS5cbiAqXG4gKiBUaGlzIGNhbiBhbHNvIGJlIGFkZGVkIHRvIHRoZSBgVGVzdEJlZGAgcHJvdmlkZXJzIHRvIGNvbmZpZ3VyZSB0aGUgdGVzdCBlbnZpcm9ubWVudCB0byBtb3JlXG4gKiBjbG9zZWx5IG1hdGNoIHByb2R1Y3Rpb24gYmVoYXZpb3IuIFRoaXMgd2lsbCBoZWxwIGdpdmUgaGlnaGVyIGNvbmZpZGVuY2UgdGhhdCBjb21wb25lbnRzIGFyZVxuICogY29tcGF0aWJsZSB3aXRoIHpvbmVsZXNzIGNoYW5nZSBkZXRlY3Rpb24uXG4gKlxuICogWm9uZUpTIHVzZXMgYnJvd3NlciBldmVudHMgdG8gdHJpZ2dlciBjaGFuZ2UgZGV0ZWN0aW9uLiBXaGVuIHVzaW5nIHRoaXMgcHJvdmlkZXIsIEFuZ3VsYXIgd2lsbFxuICogaW5zdGVhZCB1c2UgQW5ndWxhciBBUElzIHRvIHNjaGVkdWxlIGNoYW5nZSBkZXRlY3Rpb24uIFRoZXNlIEFQSXMgaW5jbHVkZTpcbiAqXG4gKiAtIGBDaGFuZ2VEZXRlY3RvclJlZi5tYXJrRm9yQ2hlY2tgXG4gKiAtIGBDb21wb25lbnRSZWYuc2V0SW5wdXRgXG4gKiAtIHVwZGF0aW5nIGEgc2lnbmFsIHRoYXQgaXMgcmVhZCBpbiBhIHRlbXBsYXRlXG4gKiAtIHdoZW4gYm91bmQgaG9zdCBvciB0ZW1wbGF0ZSBsaXN0ZW5lcnMgYXJlIHRyaWdnZXJlZFxuICogLSBhdHRhY2hpbmcgYSB2aWV3IHRoYXQgd2FzIG1hcmtlZCBkaXJ0eSBieSBvbmUgb2YgdGhlIGFib3ZlXG4gKiAtIHJlbW92aW5nIGEgdmlld1xuICogLSByZWdpc3RlcmluZyBhIHJlbmRlciBob29rICh0ZW1wbGF0ZXMgYXJlIG9ubHkgcmVmcmVzaGVkIGlmIHJlbmRlciBob29rcyBkbyBvbmUgb2YgdGhlIGFib3ZlKVxuICpcbiAqIEB1c2FnZU5vdGVzXG4gKiBgYGB0eXBlc2NyaXB0XG4gKiBib290c3RyYXBBcHBsaWNhdGlvbihNeUFwcCwge3Byb3ZpZGVyczogW1xuICogICBwcm92aWRlRXhwZXJpbWVudGFsWm9uZWxlc3NDaGFuZ2VEZXRlY3Rpb24oKSxcbiAqIF19KTtcbiAqIGBgYFxuICpcbiAqIFRoaXMgQVBJIGlzIGV4cGVyaW1lbnRhbC4gTmVpdGhlciB0aGUgc2hhcGUsIG5vciB0aGUgdW5kZXJseWluZyBiZWhhdmlvciBpcyBzdGFibGUgYW5kIGNhbiBjaGFuZ2VcbiAqIGluIHBhdGNoIHZlcnNpb25zLiBUaGVyZSBhcmUga25vd24gZmVhdHVyZSBnYXBzIGFuZCBBUEkgZXJnb25vbWljIGNvbnNpZGVyYXRpb25zLiBXZSB3aWxsIGl0ZXJhdGVcbiAqIG9uIHRoZSBleGFjdCBBUEkgYmFzZWQgb24gdGhlIGZlZWRiYWNrIGFuZCBvdXIgdW5kZXJzdGFuZGluZyBvZiB0aGUgcHJvYmxlbSBhbmQgc29sdXRpb24gc3BhY2UuXG4gKlxuICogQHB1YmxpY0FwaVxuICogQGV4cGVyaW1lbnRhbFxuICogQHNlZSB7QGxpbmsgYm9vdHN0cmFwQXBwbGljYXRpb259XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwcm92aWRlRXhwZXJpbWVudGFsWm9uZWxlc3NDaGFuZ2VEZXRlY3Rpb24oKTogRW52aXJvbm1lbnRQcm92aWRlcnMge1xuICBwZXJmb3JtYW5jZU1hcmtGZWF0dXJlKCdOZ1pvbmVsZXNzJyk7XG4gIHJldHVybiBtYWtlRW52aXJvbm1lbnRQcm92aWRlcnMoW1xuICAgIHtwcm92aWRlOiBDaGFuZ2VEZXRlY3Rpb25TY2hlZHVsZXIsIHVzZUV4aXN0aW5nOiBDaGFuZ2VEZXRlY3Rpb25TY2hlZHVsZXJJbXBsfSxcbiAgICB7cHJvdmlkZTogTmdab25lLCB1c2VDbGFzczogTm9vcE5nWm9uZX0sXG4gICAge3Byb3ZpZGU6IFpPTkVMRVNTX0VOQUJMRUQsIHVzZVZhbHVlOiB0cnVlfSxcbiAgXSk7XG59XG4iXX0=