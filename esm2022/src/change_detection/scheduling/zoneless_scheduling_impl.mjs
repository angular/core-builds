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
import { scheduleCallbackWithMicrotask, scheduleCallbackWithRafRace, } from '../../util/callback_scheduler';
import { performanceMarkFeature } from '../../util/performance';
import { NgZone, NoopNgZone } from '../../zone/ng_zone';
import { ChangeDetectionScheduler, ZONELESS_ENABLED, ZONELESS_SCHEDULER_DISABLED, } from './zoneless_scheduling';
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
        this.useMicrotaskScheduler = false;
        this.runningTick = false;
        this.pendingRenderTaskId = null;
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
        this.disableScheduling ||=
            !this.zonelessEnabled &&
                // NoopNgZone without enabling zoneless means no scheduling whatsoever
                (this.ngZone instanceof NoopNgZone ||
                    // The same goes for the lack of Zone without enabling zoneless scheduling
                    !this.zoneIsDefined);
    }
    notify(source) {
        if (!this.zonelessEnabled && source === 5 /* NotificationSource.Listener */) {
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
            case 5 /* NotificationSource.Listener */:
            case 1 /* NotificationSource.SetInput */: {
                this.shouldRefreshViews = true;
                break;
            }
            case 8 /* NotificationSource.ViewDetachedFromDOM */:
            case 7 /* NotificationSource.ViewAttached */:
            case 6 /* NotificationSource.NewRenderHook */:
            case 9 /* NotificationSource.AsyncAnimationsLoaded */:
            default: {
                // These notifications only schedule a tick but do not change whether we should refresh
                // views. Instead, we only need to run render hooks unless another notification from the
                // other set is also received before `tick` happens.
            }
        }
        if (!this.shouldScheduleTick()) {
            return;
        }
        if (typeof ngDevMode === 'undefined' || ngDevMode) {
            if (this.useMicrotaskScheduler) {
                trackMicrotaskNotificationForDebugging();
            }
            else {
                consecutiveMicrotaskNotifications = 0;
                stackFromLastFewNotifications.length = 0;
            }
        }
        const scheduleCallback = this.useMicrotaskScheduler
            ? scheduleCallbackWithMicrotask
            : scheduleCallbackWithRafRace;
        this.pendingRenderTaskId = this.taskService.add();
        if (this.zoneIsDefined) {
            Zone.root.run(() => {
                this.cancelScheduledCallback = scheduleCallback(() => {
                    this.tick(this.shouldRefreshViews);
                });
            });
        }
        else {
            this.cancelScheduledCallback = scheduleCallback(() => {
                this.tick(this.shouldRefreshViews);
            });
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
        if (!this.zonelessEnabled && this.zoneIsDefined && NgZone.isInAngularZone()) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiem9uZWxlc3Nfc2NoZWR1bGluZ19pbXBsLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvY2hhbmdlX2RldGVjdGlvbi9zY2hlZHVsaW5nL3pvbmVsZXNzX3NjaGVkdWxpbmdfaW1wbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQUMsWUFBWSxFQUFDLE1BQU0sTUFBTSxDQUFDO0FBRWxDLE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSxtQ0FBbUMsQ0FBQztBQUNqRSxPQUFPLEVBQUMsVUFBVSxFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFDL0MsT0FBTyxFQUFDLE1BQU0sRUFBQyxNQUFNLGlDQUFpQyxDQUFDO0FBRXZELE9BQU8sRUFBQyx3QkFBd0IsRUFBQyxNQUFNLDhCQUE4QixDQUFDO0FBQ3RFLE9BQU8sRUFBQyxZQUFZLEVBQW1CLE1BQU0sY0FBYyxDQUFDO0FBQzVELE9BQU8sRUFBQyxZQUFZLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUNqRCxPQUFPLEVBQ0wsNkJBQTZCLEVBQzdCLDJCQUEyQixHQUM1QixNQUFNLCtCQUErQixDQUFDO0FBQ3ZDLE9BQU8sRUFBQyxzQkFBc0IsRUFBQyxNQUFNLHdCQUF3QixDQUFDO0FBQzlELE9BQU8sRUFBQyxNQUFNLEVBQUUsVUFBVSxFQUFDLE1BQU0sb0JBQW9CLENBQUM7QUFFdEQsT0FBTyxFQUNMLHdCQUF3QixFQUV4QixnQkFBZ0IsRUFDaEIsMkJBQTJCLEdBQzVCLE1BQU0sdUJBQXVCLENBQUM7O0FBRS9CLE1BQU0sd0NBQXdDLEdBQUcsR0FBRyxDQUFDO0FBQ3JELElBQUksaUNBQWlDLEdBQUcsQ0FBQyxDQUFDO0FBQzFDLElBQUksNkJBQTZCLEdBQWEsRUFBRSxDQUFDO0FBRWpELFNBQVMsc0NBQXNDO0lBQzdDLGlDQUFpQyxFQUFFLENBQUM7SUFDcEMsSUFBSSx3Q0FB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RSwwRUFBMEU7UUFDMUUseUVBQXlFO1FBQ3pFLHFFQUFxRTtRQUNyRSxtREFBbUQ7UUFDbkQsSUFBSSxJQUFJLENBQUMsbUJBQW1CLEtBQUssSUFBSSxFQUFFLENBQUM7WUFDdEMsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLG1CQUFtQixDQUFDO1lBQ3hDLElBQUksQ0FBQyxtQkFBbUIsR0FBRyxJQUFJLENBQUM7WUFDaEMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDbEMsQ0FBQztJQUNILENBQUM7NkZBcE1VLDRCQUE0Qjt1RUFBNUIsNEJBQTRCLFdBQTVCLDRCQUE0QixtQkFEaEIsTUFBTTs7Z0ZBQ2xCLDRCQUE0QjtjQUR4QyxVQUFVO2VBQUMsRUFBQyxVQUFVLEVBQUUsTUFBTSxFQUFDOztBQXdNaEM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBc0NHO0FBQ0gsTUFBTSxVQUFVLDBDQUEwQztJQUN4RCxzQkFBc0IsQ0FBQyxZQUFZLENBQUMsQ0FBQztJQUNyQyxPQUFPLHdCQUF3QixDQUFDO1FBQzlCLEVBQUMsT0FBTyxFQUFFLHdCQUF3QixFQUFFLFdBQVcsRUFBRSw0QkFBNEIsRUFBQztRQUM5RSxFQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsUUFBUSxFQUFFLFVBQVUsRUFBQztRQUN2QyxFQUFDLE9BQU8sRUFBRSxnQkFBZ0IsRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFDO0tBQzVDLENBQUMsQ0FBQztBQUNMLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtTdWJzY3JpcHRpb259IGZyb20gJ3J4anMnO1xuXG5pbXBvcnQge0FwcGxpY2F0aW9uUmVmfSBmcm9tICcuLi8uLi9hcHBsaWNhdGlvbi9hcHBsaWNhdGlvbl9yZWYnO1xuaW1wb3J0IHtJbmplY3RhYmxlfSBmcm9tICcuLi8uLi9kaS9pbmplY3RhYmxlJztcbmltcG9ydCB7aW5qZWN0fSBmcm9tICcuLi8uLi9kaS9pbmplY3Rvcl9jb21wYXRpYmlsaXR5JztcbmltcG9ydCB7RW52aXJvbm1lbnRQcm92aWRlcnN9IGZyb20gJy4uLy4uL2RpL2ludGVyZmFjZS9wcm92aWRlcic7XG5pbXBvcnQge21ha2VFbnZpcm9ubWVudFByb3ZpZGVyc30gZnJvbSAnLi4vLi4vZGkvcHJvdmlkZXJfY29sbGVjdGlvbic7XG5pbXBvcnQge1J1bnRpbWVFcnJvciwgUnVudGltZUVycm9yQ29kZX0gZnJvbSAnLi4vLi4vZXJyb3JzJztcbmltcG9ydCB7UGVuZGluZ1Rhc2tzfSBmcm9tICcuLi8uLi9wZW5kaW5nX3Rhc2tzJztcbmltcG9ydCB7XG4gIHNjaGVkdWxlQ2FsbGJhY2tXaXRoTWljcm90YXNrLFxuICBzY2hlZHVsZUNhbGxiYWNrV2l0aFJhZlJhY2UsXG59IGZyb20gJy4uLy4uL3V0aWwvY2FsbGJhY2tfc2NoZWR1bGVyJztcbmltcG9ydCB7cGVyZm9ybWFuY2VNYXJrRmVhdHVyZX0gZnJvbSAnLi4vLi4vdXRpbC9wZXJmb3JtYW5jZSc7XG5pbXBvcnQge05nWm9uZSwgTm9vcE5nWm9uZX0gZnJvbSAnLi4vLi4vem9uZS9uZ196b25lJztcblxuaW1wb3J0IHtcbiAgQ2hhbmdlRGV0ZWN0aW9uU2NoZWR1bGVyLFxuICBOb3RpZmljYXRpb25Tb3VyY2UsXG4gIFpPTkVMRVNTX0VOQUJMRUQsXG4gIFpPTkVMRVNTX1NDSEVEVUxFUl9ESVNBQkxFRCxcbn0gZnJvbSAnLi96b25lbGVzc19zY2hlZHVsaW5nJztcblxuY29uc3QgQ09OU0VDVVRJVkVfTUlDUk9UQVNLX05PVElGSUNBVElPTl9MSU1JVCA9IDEwMDtcbmxldCBjb25zZWN1dGl2ZU1pY3JvdGFza05vdGlmaWNhdGlvbnMgPSAwO1xubGV0IHN0YWNrRnJvbUxhc3RGZXdOb3RpZmljYXRpb25zOiBzdHJpbmdbXSA9IFtdO1xuXG5mdW5jdGlvbiB0cmFja01pY3JvdGFza05vdGlmaWNhdGlvbkZvckRlYnVnZ2luZygpIHtcbiAgY29uc2VjdXRpdmVNaWNyb3Rhc2tOb3RpZmljYXRpb25zKys7XG4gIGlmIChDT05TRUNVVElWRV9NSUNST1RBU0tfTk9USUZJQ0FUSU9OX0xJTUlUIC0gY29uc2VjdXRpdmVNaWNyb3Rhc2tOb3RpZmljYXRpb25zIDwgNSkge1xuICAgIGNvbnN0IHN0YWNrID0gbmV3IEVycm9yKCkuc3RhY2s7XG4gICAgaWYgKHN0YWNrKSB7XG4gICAgICBzdGFja0Zyb21MYXN0RmV3Tm90aWZpY2F0aW9ucy5wdXNoKHN0YWNrKTtcbiAgICB9XG4gIH1cblxuICBpZiAoY29uc2VjdXRpdmVNaWNyb3Rhc2tOb3RpZmljYXRpb25zID09PSBDT05TRUNVVElWRV9NSUNST1RBU0tfTk9USUZJQ0FUSU9OX0xJTUlUKSB7XG4gICAgdGhyb3cgbmV3IFJ1bnRpbWVFcnJvcihcbiAgICAgIFJ1bnRpbWVFcnJvckNvZGUuSU5GSU5JVEVfQ0hBTkdFX0RFVEVDVElPTixcbiAgICAgICdBbmd1bGFyIGNvdWxkIG5vdCBzdGFiaWxpemUgYmVjYXVzZSB0aGVyZSB3ZXJlIGVuZGxlc3MgY2hhbmdlIG5vdGlmaWNhdGlvbnMgd2l0aGluIHRoZSBicm93c2VyIGV2ZW50IGxvb3AuICcgK1xuICAgICAgICAnVGhlIHN0YWNrIGZyb20gdGhlIGxhc3Qgc2V2ZXJhbCBub3RpZmljYXRpb25zOiBcXG4nICtcbiAgICAgICAgc3RhY2tGcm9tTGFzdEZld05vdGlmaWNhdGlvbnMuam9pbignXFxuJyksXG4gICAgKTtcbiAgfVxufVxuXG5ASW5qZWN0YWJsZSh7cHJvdmlkZWRJbjogJ3Jvb3QnfSlcbmV4cG9ydCBjbGFzcyBDaGFuZ2VEZXRlY3Rpb25TY2hlZHVsZXJJbXBsIGltcGxlbWVudHMgQ2hhbmdlRGV0ZWN0aW9uU2NoZWR1bGVyIHtcbiAgcHJpdmF0ZSByZWFkb25seSBhcHBSZWYgPSBpbmplY3QoQXBwbGljYXRpb25SZWYpO1xuICBwcml2YXRlIHJlYWRvbmx5IHRhc2tTZXJ2aWNlID0gaW5qZWN0KFBlbmRpbmdUYXNrcyk7XG4gIHByaXZhdGUgcmVhZG9ubHkgbmdab25lID0gaW5qZWN0KE5nWm9uZSk7XG4gIHByaXZhdGUgcmVhZG9ubHkgem9uZWxlc3NFbmFibGVkID0gaW5qZWN0KFpPTkVMRVNTX0VOQUJMRUQpO1xuICBwcml2YXRlIHJlYWRvbmx5IGRpc2FibGVTY2hlZHVsaW5nID1cbiAgICBpbmplY3QoWk9ORUxFU1NfU0NIRURVTEVSX0RJU0FCTEVELCB7b3B0aW9uYWw6IHRydWV9KSA/PyBmYWxzZTtcbiAgcHJpdmF0ZSByZWFkb25seSB6b25lSXNEZWZpbmVkID0gdHlwZW9mIFpvbmUgIT09ICd1bmRlZmluZWQnICYmICEhWm9uZS5yb290LnJ1bjtcbiAgcHJpdmF0ZSByZWFkb25seSBzY2hlZHVsZXJUaWNrQXBwbHlBcmdzID0gW3tkYXRhOiB7J19fc2NoZWR1bGVyX3RpY2tfXyc6IHRydWV9fV07XG4gIHByaXZhdGUgcmVhZG9ubHkgc3Vic2NyaXB0aW9ucyA9IG5ldyBTdWJzY3JpcHRpb24oKTtcblxuICBwcml2YXRlIGNhbmNlbFNjaGVkdWxlZENhbGxiYWNrOiBudWxsIHwgKCgpID0+IHZvaWQpID0gbnVsbDtcbiAgcHJpdmF0ZSBzaG91bGRSZWZyZXNoVmlld3MgPSBmYWxzZTtcbiAgcHJpdmF0ZSB1c2VNaWNyb3Rhc2tTY2hlZHVsZXIgPSBmYWxzZTtcbiAgcnVubmluZ1RpY2sgPSBmYWxzZTtcbiAgcGVuZGluZ1JlbmRlclRhc2tJZDogbnVtYmVyIHwgbnVsbCA9IG51bGw7XG5cbiAgY29uc3RydWN0b3IoKSB7XG4gICAgdGhpcy5zdWJzY3JpcHRpb25zLmFkZChcbiAgICAgIHRoaXMuYXBwUmVmLmFmdGVyVGljay5zdWJzY3JpYmUoKCkgPT4ge1xuICAgICAgICAvLyBJZiB0aGUgc2NoZWR1bGVyIGlzbid0IHJ1bm5pbmcgYSB0aWNrIGJ1dCB0aGUgYXBwbGljYXRpb24gdGlja2VkLCB0aGF0IG1lYW5zXG4gICAgICAgIC8vIHNvbWVvbmUgY2FsbGVkIEFwcGxpY2F0aW9uUmVmLnRpY2sgbWFudWFsbHkuIEluIHRoaXMgY2FzZSwgd2Ugc2hvdWxkIGNhbmNlbFxuICAgICAgICAvLyBhbnkgY2hhbmdlIGRldGVjdGlvbnMgdGhhdCBoYWQgYmVlbiBzY2hlZHVsZWQgc28gd2UgZG9uJ3QgcnVuIGFuIGV4dHJhIG9uZS5cbiAgICAgICAgaWYgKCF0aGlzLnJ1bm5pbmdUaWNrKSB7XG4gICAgICAgICAgdGhpcy5jbGVhbnVwKCk7XG4gICAgICAgIH1cbiAgICAgIH0pLFxuICAgICk7XG4gICAgdGhpcy5zdWJzY3JpcHRpb25zLmFkZChcbiAgICAgIHRoaXMubmdab25lLm9uVW5zdGFibGUuc3Vic2NyaWJlKCgpID0+IHtcbiAgICAgICAgLy8gSWYgdGhlIHpvbmUgYmVjb21lcyB1bnN0YWJsZSB3aGVuIHdlJ3JlIG5vdCBydW5uaW5nIHRpY2sgKHRoaXMgaGFwcGVucyBmcm9tIHRoZSB6b25lLnJ1biksXG4gICAgICAgIC8vIHdlIHNob3VsZCBjYW5jZWwgYW55IHNjaGVkdWxlZCBjaGFuZ2UgZGV0ZWN0aW9uIGhlcmUgYmVjYXVzZSBhdCB0aGlzIHBvaW50IHdlXG4gICAgICAgIC8vIGtub3cgdGhhdCB0aGUgem9uZSB3aWxsIHN0YWJpbGl6ZSBhdCBzb21lIHBvaW50IGFuZCBydW4gY2hhbmdlIGRldGVjdGlvbiBpdHNlbGYuXG4gICAgICAgIGlmICghdGhpcy5ydW5uaW5nVGljaykge1xuICAgICAgICAgIHRoaXMuY2xlYW51cCgpO1xuICAgICAgICB9XG4gICAgICB9KSxcbiAgICApO1xuXG4gICAgLy8gVE9ETyhhdHNjb3R0KTogVGhlc2UgY29uZGl0aW9ucyB3aWxsIG5lZWQgdG8gY2hhbmdlIHdoZW4gem9uZWxlc3MgaXMgdGhlIGRlZmF1bHRcbiAgICAvLyBJbnN0ZWFkLCB0aGV5IHNob3VsZCBmbGlwIHRvIGNoZWNraW5nIGlmIFpvbmVKUyBzY2hlZHVsaW5nIGlzIHByb3ZpZGVkXG4gICAgdGhpcy5kaXNhYmxlU2NoZWR1bGluZyB8fD1cbiAgICAgICF0aGlzLnpvbmVsZXNzRW5hYmxlZCAmJlxuICAgICAgLy8gTm9vcE5nWm9uZSB3aXRob3V0IGVuYWJsaW5nIHpvbmVsZXNzIG1lYW5zIG5vIHNjaGVkdWxpbmcgd2hhdHNvZXZlclxuICAgICAgKHRoaXMubmdab25lIGluc3RhbmNlb2YgTm9vcE5nWm9uZSB8fFxuICAgICAgICAvLyBUaGUgc2FtZSBnb2VzIGZvciB0aGUgbGFjayBvZiBab25lIHdpdGhvdXQgZW5hYmxpbmcgem9uZWxlc3Mgc2NoZWR1bGluZ1xuICAgICAgICAhdGhpcy56b25lSXNEZWZpbmVkKTtcbiAgfVxuXG4gIG5vdGlmeShzb3VyY2U6IE5vdGlmaWNhdGlvblNvdXJjZSk6IHZvaWQge1xuICAgIGlmICghdGhpcy56b25lbGVzc0VuYWJsZWQgJiYgc291cmNlID09PSBOb3RpZmljYXRpb25Tb3VyY2UuTGlzdGVuZXIpIHtcbiAgICAgIC8vIFdoZW4gdGhlIG5vdGlmaWNhdGlvbiBjb21lcyBmcm9tIGEgbGlzdGVuZXIsIHdlIHNraXAgdGhlIG5vdGlmaWNhdGlvbiB1bmxlc3MgdGhlXG4gICAgICAvLyBhcHBsaWNhdGlvbiBoYXMgZW5hYmxlZCB6b25lbGVzcy4gSWRlYWxseSwgbGlzdGVuZXJzIHdvdWxkbid0IG5vdGlmeSB0aGUgc2NoZWR1bGVyIGF0IGFsbFxuICAgICAgLy8gYXV0b21hdGljYWxseS4gV2UgZG8gbm90IGtub3cgdGhhdCBhIGRldmVsb3BlciBtYWRlIGEgY2hhbmdlIGluIHRoZSBsaXN0ZW5lciBjYWxsYmFjayB0aGF0XG4gICAgICAvLyByZXF1aXJlcyBhbiBgQXBwbGljYXRpb25SZWYudGlja2AgKHN5bmNocm9uaXplIHRlbXBsYXRlcyAvIHJ1biByZW5kZXIgaG9va3MpLiBXZSBkbyB0aGlzXG4gICAgICAvLyBvbmx5IGZvciBhbiBlYXNpZXIgbWlncmF0aW9uIGZyb20gT25QdXNoIGNvbXBvbmVudHMgdG8gem9uZWxlc3MuIEJlY2F1c2UgbGlzdGVuZXJzIGFyZVxuICAgICAgLy8gdXN1YWxseSBleGVjdXRlZCBpbnNpZGUgdGhlIEFuZ3VsYXIgem9uZSBhbmQgbGlzdGVuZXJzIGF1dG9tYXRpY2FsbHkgY2FsbCBgbWFya1ZpZXdEaXJ0eWAsXG4gICAgICAvLyBkZXZlbG9wZXJzIG5ldmVyIG5lZWRlZCB0byBtYW51YWxseSB1c2UgYENoYW5nZURldGVjdG9yUmVmLm1hcmtGb3JDaGVja2Agb3Igc29tZSBvdGhlciBBUElcbiAgICAgIC8vIHRvIG1ha2UgbGlzdGVuZXIgY2FsbGJhY2tzIHdvcmsgY29ycmVjdGx5IHdpdGggYE9uUHVzaGAgY29tcG9uZW50cy5cbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgc3dpdGNoIChzb3VyY2UpIHtcbiAgICAgIGNhc2UgTm90aWZpY2F0aW9uU291cmNlLkRlYnVnQXBwbHlDaGFuZ2VzOlxuICAgICAgY2FzZSBOb3RpZmljYXRpb25Tb3VyY2UuRGVmZXJCbG9ja1N0YXRlVXBkYXRlOlxuICAgICAgY2FzZSBOb3RpZmljYXRpb25Tb3VyY2UuTWFya0FuY2VzdG9yc0ZvclRyYXZlcnNhbDpcbiAgICAgIGNhc2UgTm90aWZpY2F0aW9uU291cmNlLk1hcmtGb3JDaGVjazpcbiAgICAgIGNhc2UgTm90aWZpY2F0aW9uU291cmNlLkxpc3RlbmVyOlxuICAgICAgY2FzZSBOb3RpZmljYXRpb25Tb3VyY2UuU2V0SW5wdXQ6IHtcbiAgICAgICAgdGhpcy5zaG91bGRSZWZyZXNoVmlld3MgPSB0cnVlO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGNhc2UgTm90aWZpY2F0aW9uU291cmNlLlZpZXdEZXRhY2hlZEZyb21ET006XG4gICAgICBjYXNlIE5vdGlmaWNhdGlvblNvdXJjZS5WaWV3QXR0YWNoZWQ6XG4gICAgICBjYXNlIE5vdGlmaWNhdGlvblNvdXJjZS5OZXdSZW5kZXJIb29rOlxuICAgICAgY2FzZSBOb3RpZmljYXRpb25Tb3VyY2UuQXN5bmNBbmltYXRpb25zTG9hZGVkOlxuICAgICAgZGVmYXVsdDoge1xuICAgICAgICAvLyBUaGVzZSBub3RpZmljYXRpb25zIG9ubHkgc2NoZWR1bGUgYSB0aWNrIGJ1dCBkbyBub3QgY2hhbmdlIHdoZXRoZXIgd2Ugc2hvdWxkIHJlZnJlc2hcbiAgICAgICAgLy8gdmlld3MuIEluc3RlYWQsIHdlIG9ubHkgbmVlZCB0byBydW4gcmVuZGVyIGhvb2tzIHVubGVzcyBhbm90aGVyIG5vdGlmaWNhdGlvbiBmcm9tIHRoZVxuICAgICAgICAvLyBvdGhlciBzZXQgaXMgYWxzbyByZWNlaXZlZCBiZWZvcmUgYHRpY2tgIGhhcHBlbnMuXG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKCF0aGlzLnNob3VsZFNjaGVkdWxlVGljaygpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBuZ0Rldk1vZGUgPT09ICd1bmRlZmluZWQnIHx8IG5nRGV2TW9kZSkge1xuICAgICAgaWYgKHRoaXMudXNlTWljcm90YXNrU2NoZWR1bGVyKSB7XG4gICAgICAgIHRyYWNrTWljcm90YXNrTm90aWZpY2F0aW9uRm9yRGVidWdnaW5nKCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zZWN1dGl2ZU1pY3JvdGFza05vdGlmaWNhdGlvbnMgPSAwO1xuICAgICAgICBzdGFja0Zyb21MYXN0RmV3Tm90aWZpY2F0aW9ucy5sZW5ndGggPSAwO1xuICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IHNjaGVkdWxlQ2FsbGJhY2sgPSB0aGlzLnVzZU1pY3JvdGFza1NjaGVkdWxlclxuICAgICAgPyBzY2hlZHVsZUNhbGxiYWNrV2l0aE1pY3JvdGFza1xuICAgICAgOiBzY2hlZHVsZUNhbGxiYWNrV2l0aFJhZlJhY2U7XG4gICAgdGhpcy5wZW5kaW5nUmVuZGVyVGFza0lkID0gdGhpcy50YXNrU2VydmljZS5hZGQoKTtcbiAgICBpZiAodGhpcy56b25lSXNEZWZpbmVkKSB7XG4gICAgICBab25lLnJvb3QucnVuKCgpID0+IHtcbiAgICAgICAgdGhpcy5jYW5jZWxTY2hlZHVsZWRDYWxsYmFjayA9IHNjaGVkdWxlQ2FsbGJhY2soKCkgPT4ge1xuICAgICAgICAgIHRoaXMudGljayh0aGlzLnNob3VsZFJlZnJlc2hWaWV3cyk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuY2FuY2VsU2NoZWR1bGVkQ2FsbGJhY2sgPSBzY2hlZHVsZUNhbGxiYWNrKCgpID0+IHtcbiAgICAgICAgdGhpcy50aWNrKHRoaXMuc2hvdWxkUmVmcmVzaFZpZXdzKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgc2hvdWxkU2NoZWR1bGVUaWNrKCk6IGJvb2xlYW4ge1xuICAgIGlmICh0aGlzLmRpc2FibGVTY2hlZHVsaW5nKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIC8vIGFscmVhZHkgc2NoZWR1bGVkIG9yIHJ1bm5pbmdcbiAgICBpZiAodGhpcy5wZW5kaW5nUmVuZGVyVGFza0lkICE9PSBudWxsIHx8IHRoaXMucnVubmluZ1RpY2sgfHwgdGhpcy5hcHBSZWYuX3J1bm5pbmdUaWNrKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIC8vIElmIHdlJ3JlIGluc2lkZSB0aGUgem9uZSBkb24ndCBib3RoZXIgd2l0aCBzY2hlZHVsZXIuIFpvbmUgd2lsbCBzdGFiaWxpemVcbiAgICAvLyBldmVudHVhbGx5IGFuZCBydW4gY2hhbmdlIGRldGVjdGlvbi5cbiAgICBpZiAoIXRoaXMuem9uZWxlc3NFbmFibGVkICYmIHRoaXMuem9uZUlzRGVmaW5lZCAmJiBOZ1pvbmUuaXNJbkFuZ3VsYXJab25lKCkpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDYWxscyBBcHBsaWNhdGlvblJlZi5fdGljayBpbnNpZGUgdGhlIGBOZ1pvbmVgLlxuICAgKlxuICAgKiBDYWxsaW5nIGB0aWNrYCBkaXJlY3RseSBydW5zIGNoYW5nZSBkZXRlY3Rpb24gYW5kIGNhbmNlbHMgYW55IGNoYW5nZSBkZXRlY3Rpb24gdGhhdCBoYWQgYmVlblxuICAgKiBzY2hlZHVsZWQgcHJldmlvdXNseS5cbiAgICpcbiAgICogQHBhcmFtIHNob3VsZFJlZnJlc2hWaWV3cyBQYXNzZWQgZGlyZWN0bHkgdG8gYEFwcGxpY2F0aW9uUmVmLl90aWNrYCBhbmQgc2tpcHMgc3RyYWlnaHQgdG9cbiAgICogICAgIHJlbmRlciBob29rcyB3aGVuIGBmYWxzZWAuXG4gICAqL1xuICBwcml2YXRlIHRpY2soc2hvdWxkUmVmcmVzaFZpZXdzOiBib29sZWFuKTogdm9pZCB7XG4gICAgLy8gV2hlbiBuZ1pvbmUucnVuIGJlbG93IGV4aXRzLCBvbk1pY3JvdGFza0VtcHR5IG1heSBlbWl0IGlmIHRoZSB6b25lIGlzXG4gICAgLy8gc3RhYmxlLiBXZSB3YW50IHRvIHByZXZlbnQgZG91YmxlIHRpY2tpbmcgc28gd2UgdHJhY2sgd2hldGhlciB0aGUgdGljayBpc1xuICAgIC8vIGFscmVhZHkgcnVubmluZyBhbmQgc2tpcCBpdCBpZiBzby5cbiAgICBpZiAodGhpcy5ydW5uaW5nVGljayB8fCB0aGlzLmFwcFJlZi5kZXN0cm95ZWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCB0YXNrID0gdGhpcy50YXNrU2VydmljZS5hZGQoKTtcbiAgICB0cnkge1xuICAgICAgdGhpcy5uZ1pvbmUucnVuKFxuICAgICAgICAoKSA9PiB7XG4gICAgICAgICAgdGhpcy5ydW5uaW5nVGljayA9IHRydWU7XG4gICAgICAgICAgdGhpcy5hcHBSZWYuX3RpY2soc2hvdWxkUmVmcmVzaFZpZXdzKTtcbiAgICAgICAgfSxcbiAgICAgICAgdW5kZWZpbmVkLFxuICAgICAgICB0aGlzLnNjaGVkdWxlclRpY2tBcHBseUFyZ3MsXG4gICAgICApO1xuICAgIH0gY2F0Y2ggKGU6IHVua25vd24pIHtcbiAgICAgIHRoaXMudGFza1NlcnZpY2UucmVtb3ZlKHRhc2spO1xuICAgICAgdGhyb3cgZTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgdGhpcy5jbGVhbnVwKCk7XG4gICAgfVxuICAgIC8vIElmIHdlJ3JlIG5vdGlmaWVkIG9mIGEgY2hhbmdlIHdpdGhpbiAxIG1pY3JvdGFzayBvZiBydW5uaW5nIGNoYW5nZVxuICAgIC8vIGRldGVjdGlvbiwgcnVuIGFub3RoZXIgcm91bmQgaW4gdGhlIHNhbWUgZXZlbnQgbG9vcC4gVGhpcyBhbGxvd3MgY29kZVxuICAgIC8vIHdoaWNoIHVzZXMgUHJvbWlzZS5yZXNvbHZlIChzZWUgTmdNb2RlbCkgdG8gYXZvaWRcbiAgICAvLyBFeHByZXNzaW9uQ2hhbmdlZC4uLkVycm9yIHRvIHN0aWxsIGJlIHJlZmxlY3RlZCBpbiBhIHNpbmdsZSBicm93c2VyXG4gICAgLy8gcGFpbnQsIGV2ZW4gaWYgdGhhdCBzcGFucyBtdWx0aXBsZSByb3VuZHMgb2YgY2hhbmdlIGRldGVjdGlvbi5cbiAgICB0aGlzLnVzZU1pY3JvdGFza1NjaGVkdWxlciA9IHRydWU7XG4gICAgc2NoZWR1bGVDYWxsYmFja1dpdGhNaWNyb3Rhc2soKCkgPT4ge1xuICAgICAgdGhpcy51c2VNaWNyb3Rhc2tTY2hlZHVsZXIgPSBmYWxzZTtcbiAgICAgIHRoaXMudGFza1NlcnZpY2UucmVtb3ZlKHRhc2spO1xuICAgIH0pO1xuICB9XG5cbiAgbmdPbkRlc3Ryb3koKSB7XG4gICAgdGhpcy5zdWJzY3JpcHRpb25zLnVuc3Vic2NyaWJlKCk7XG4gICAgdGhpcy5jbGVhbnVwKCk7XG4gIH1cblxuICBwcml2YXRlIGNsZWFudXAoKSB7XG4gICAgdGhpcy5zaG91bGRSZWZyZXNoVmlld3MgPSBmYWxzZTtcbiAgICB0aGlzLnJ1bm5pbmdUaWNrID0gZmFsc2U7XG4gICAgdGhpcy5jYW5jZWxTY2hlZHVsZWRDYWxsYmFjaz8uKCk7XG4gICAgdGhpcy5jYW5jZWxTY2hlZHVsZWRDYWxsYmFjayA9IG51bGw7XG4gICAgLy8gSWYgdGhpcyBpcyB0aGUgbGFzdCB0YXNrLCB0aGUgc2VydmljZSB3aWxsIHN5bmNocm9ub3VzbHkgZW1pdCBhIHN0YWJsZVxuICAgIC8vIG5vdGlmaWNhdGlvbi4gSWYgdGhlcmUgaXMgYSBzdWJzY3JpYmVyIHRoYXQgdGhlbiBhY3RzIGluIGEgd2F5IHRoYXRcbiAgICAvLyB0cmllcyB0byBub3RpZnkgdGhlIHNjaGVkdWxlciBhZ2Fpbiwgd2UgbmVlZCB0byBiZSBhYmxlIHRvIHJlc3BvbmQgdG9cbiAgICAvLyBzY2hlZHVsZSBhIG5ldyBjaGFuZ2UgZGV0ZWN0aW9uLiBUaGVyZWZvcmUsIHdlIHNob3VsZCBjbGVhciB0aGUgdGFzayBJRFxuICAgIC8vIGJlZm9yZSByZW1vdmluZyBpdCBmcm9tIHRoZSBwZW5kaW5nIHRhc2tzIChvciB0aGUgdGFza3Mgc2VydmljZSBzaG91bGRcbiAgICAvLyBub3Qgc3luY2hyb25vdXNseSBlbWl0IHN0YWJsZSwgc2ltaWxhciB0byBob3cgWm9uZSBzdGFibGVuZXNzIG9ubHlcbiAgICAvLyBoYXBwZW5zIGlmIGl0J3Mgc3RpbGwgc3RhYmxlIGFmdGVyIGEgbWljcm90YXNrKS5cbiAgICBpZiAodGhpcy5wZW5kaW5nUmVuZGVyVGFza0lkICE9PSBudWxsKSB7XG4gICAgICBjb25zdCB0YXNrSWQgPSB0aGlzLnBlbmRpbmdSZW5kZXJUYXNrSWQ7XG4gICAgICB0aGlzLnBlbmRpbmdSZW5kZXJUYXNrSWQgPSBudWxsO1xuICAgICAgdGhpcy50YXNrU2VydmljZS5yZW1vdmUodGFza0lkKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBQcm92aWRlcyBjaGFuZ2UgZGV0ZWN0aW9uIHdpdGhvdXQgWm9uZUpTIGZvciB0aGUgYXBwbGljYXRpb24gYm9vdHN0cmFwcGVkIHVzaW5nXG4gKiBgYm9vdHN0cmFwQXBwbGljYXRpb25gLlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gYWxsb3dzIHlvdSB0byBjb25maWd1cmUgdGhlIGFwcGxpY2F0aW9uIHRvIG5vdCB1c2UgdGhlIHN0YXRlL3N0YXRlIGNoYW5nZXMgb2ZcbiAqIFpvbmVKUyB0byBzY2hlZHVsZSBjaGFuZ2UgZGV0ZWN0aW9uIGluIHRoZSBhcHBsaWNhdGlvbi4gVGhpcyB3aWxsIHdvcmsgd2hlbiBab25lSlMgaXMgbm90IHByZXNlbnRcbiAqIG9uIHRoZSBwYWdlIGF0IGFsbCBvciBpZiBpdCBleGlzdHMgYmVjYXVzZSBzb21ldGhpbmcgZWxzZSBpcyB1c2luZyBpdCAoZWl0aGVyIGFub3RoZXIgQW5ndWxhclxuICogYXBwbGljYXRpb24gd2hpY2ggdXNlcyBab25lSlMgZm9yIHNjaGVkdWxpbmcgb3Igc29tZSBvdGhlciBsaWJyYXJ5IHRoYXQgcmVsaWVzIG9uIFpvbmVKUykuXG4gKlxuICogVGhpcyBjYW4gYWxzbyBiZSBhZGRlZCB0byB0aGUgYFRlc3RCZWRgIHByb3ZpZGVycyB0byBjb25maWd1cmUgdGhlIHRlc3QgZW52aXJvbm1lbnQgdG8gbW9yZVxuICogY2xvc2VseSBtYXRjaCBwcm9kdWN0aW9uIGJlaGF2aW9yLiBUaGlzIHdpbGwgaGVscCBnaXZlIGhpZ2hlciBjb25maWRlbmNlIHRoYXQgY29tcG9uZW50cyBhcmVcbiAqIGNvbXBhdGlibGUgd2l0aCB6b25lbGVzcyBjaGFuZ2UgZGV0ZWN0aW9uLlxuICpcbiAqIFpvbmVKUyB1c2VzIGJyb3dzZXIgZXZlbnRzIHRvIHRyaWdnZXIgY2hhbmdlIGRldGVjdGlvbi4gV2hlbiB1c2luZyB0aGlzIHByb3ZpZGVyLCBBbmd1bGFyIHdpbGxcbiAqIGluc3RlYWQgdXNlIEFuZ3VsYXIgQVBJcyB0byBzY2hlZHVsZSBjaGFuZ2UgZGV0ZWN0aW9uLiBUaGVzZSBBUElzIGluY2x1ZGU6XG4gKlxuICogLSBgQ2hhbmdlRGV0ZWN0b3JSZWYubWFya0ZvckNoZWNrYFxuICogLSBgQ29tcG9uZW50UmVmLnNldElucHV0YFxuICogLSB1cGRhdGluZyBhIHNpZ25hbCB0aGF0IGlzIHJlYWQgaW4gYSB0ZW1wbGF0ZVxuICogLSB3aGVuIGJvdW5kIGhvc3Qgb3IgdGVtcGxhdGUgbGlzdGVuZXJzIGFyZSB0cmlnZ2VyZWRcbiAqIC0gYXR0YWNoaW5nIGEgdmlldyB0aGF0IHdhcyBtYXJrZWQgZGlydHkgYnkgb25lIG9mIHRoZSBhYm92ZVxuICogLSByZW1vdmluZyBhIHZpZXdcbiAqIC0gcmVnaXN0ZXJpbmcgYSByZW5kZXIgaG9vayAodGVtcGxhdGVzIGFyZSBvbmx5IHJlZnJlc2hlZCBpZiByZW5kZXIgaG9va3MgZG8gb25lIG9mIHRoZSBhYm92ZSlcbiAqXG4gKiBAdXNhZ2VOb3Rlc1xuICogYGBgdHlwZXNjcmlwdFxuICogYm9vdHN0cmFwQXBwbGljYXRpb24oTXlBcHAsIHtwcm92aWRlcnM6IFtcbiAqICAgcHJvdmlkZUV4cGVyaW1lbnRhbFpvbmVsZXNzQ2hhbmdlRGV0ZWN0aW9uKCksXG4gKiBdfSk7XG4gKiBgYGBcbiAqXG4gKiBUaGlzIEFQSSBpcyBleHBlcmltZW50YWwuIE5laXRoZXIgdGhlIHNoYXBlLCBub3IgdGhlIHVuZGVybHlpbmcgYmVoYXZpb3IgaXMgc3RhYmxlIGFuZCBjYW4gY2hhbmdlXG4gKiBpbiBwYXRjaCB2ZXJzaW9ucy4gVGhlcmUgYXJlIGtub3duIGZlYXR1cmUgZ2FwcyBhbmQgQVBJIGVyZ29ub21pYyBjb25zaWRlcmF0aW9ucy4gV2Ugd2lsbCBpdGVyYXRlXG4gKiBvbiB0aGUgZXhhY3QgQVBJIGJhc2VkIG9uIHRoZSBmZWVkYmFjayBhbmQgb3VyIHVuZGVyc3RhbmRpbmcgb2YgdGhlIHByb2JsZW0gYW5kIHNvbHV0aW9uIHNwYWNlLlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqIEBleHBlcmltZW50YWxcbiAqIEBzZWUge0BsaW5rIGJvb3RzdHJhcEFwcGxpY2F0aW9ufVxuICovXG5leHBvcnQgZnVuY3Rpb24gcHJvdmlkZUV4cGVyaW1lbnRhbFpvbmVsZXNzQ2hhbmdlRGV0ZWN0aW9uKCk6IEVudmlyb25tZW50UHJvdmlkZXJzIHtcbiAgcGVyZm9ybWFuY2VNYXJrRmVhdHVyZSgnTmdab25lbGVzcycpO1xuICByZXR1cm4gbWFrZUVudmlyb25tZW50UHJvdmlkZXJzKFtcbiAgICB7cHJvdmlkZTogQ2hhbmdlRGV0ZWN0aW9uU2NoZWR1bGVyLCB1c2VFeGlzdGluZzogQ2hhbmdlRGV0ZWN0aW9uU2NoZWR1bGVySW1wbH0sXG4gICAge3Byb3ZpZGU6IE5nWm9uZSwgdXNlQ2xhc3M6IE5vb3BOZ1pvbmV9LFxuICAgIHtwcm92aWRlOiBaT05FTEVTU19FTkFCTEVELCB1c2VWYWx1ZTogdHJ1ZX0sXG4gIF0pO1xufVxuIl19