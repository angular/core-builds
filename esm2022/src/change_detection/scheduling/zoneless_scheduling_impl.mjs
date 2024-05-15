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
import { ChangeDetectionScheduler, ZONELESS_ENABLED, PROVIDED_ZONELESS, ZONELESS_SCHEDULER_DISABLED, } from './zoneless_scheduling';
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
        typeof ngDevMode === 'undefined' || ngDevMode
            ? [{ provide: PROVIDED_ZONELESS, useValue: true }]
            : [],
    ]);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiem9uZWxlc3Nfc2NoZWR1bGluZ19pbXBsLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvY2hhbmdlX2RldGVjdGlvbi9zY2hlZHVsaW5nL3pvbmVsZXNzX3NjaGVkdWxpbmdfaW1wbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQUMsWUFBWSxFQUFDLE1BQU0sTUFBTSxDQUFDO0FBRWxDLE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSxtQ0FBbUMsQ0FBQztBQUNqRSxPQUFPLEVBQUMsVUFBVSxFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFDL0MsT0FBTyxFQUFDLE1BQU0sRUFBQyxNQUFNLGlDQUFpQyxDQUFDO0FBRXZELE9BQU8sRUFBQyx3QkFBd0IsRUFBQyxNQUFNLDhCQUE4QixDQUFDO0FBQ3RFLE9BQU8sRUFBQyxZQUFZLEVBQW1CLE1BQU0sY0FBYyxDQUFDO0FBQzVELE9BQU8sRUFBQyxZQUFZLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUNqRCxPQUFPLEVBQ0wsNkJBQTZCLEVBQzdCLDJCQUEyQixHQUM1QixNQUFNLCtCQUErQixDQUFDO0FBQ3ZDLE9BQU8sRUFBQyxzQkFBc0IsRUFBQyxNQUFNLHdCQUF3QixDQUFDO0FBQzlELE9BQU8sRUFBQyxNQUFNLEVBQUUsVUFBVSxFQUFDLE1BQU0sb0JBQW9CLENBQUM7QUFFdEQsT0FBTyxFQUNMLHdCQUF3QixFQUV4QixnQkFBZ0IsRUFDaEIsaUJBQWlCLEVBQ2pCLDJCQUEyQixHQUM1QixNQUFNLHVCQUF1QixDQUFDOztBQUUvQixNQUFNLHdDQUF3QyxHQUFHLEdBQUcsQ0FBQztBQUNyRCxJQUFJLGlDQUFpQyxHQUFHLENBQUMsQ0FBQztBQUMxQyxJQUFJLDZCQUE2QixHQUFhLEVBQUUsQ0FBQztBQUVqRCxTQUFTLHNDQUFzQztJQUM3QyxpQ0FBaUMsRUFBRSxDQUFDO0lB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RSx3RUFBd0U7UUFDeEUsMEVBQTBFO1FBQzFFLHlFQUF5RTtRQUN6RSxxRUFBcUU7UUFDckUsbURBQW1EO1FBQ25ELElBQUksSUFBSSxDQUFDLG1CQUFtQixLQUFLLElBQUksRUFBRSxDQUFDO1lBQ3RDLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxtQkFBbUIsQ0FBQztZQUN4QyxJQUFJLENBQUMsbUJBQW1CLEdBQUcsSUFBSSxDQUFDO1lBQ2hDLElBQUksQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ2xDLENBQUM7SUFDSCxDQUFDOzZGQXBNVSw0QkFBNEI7dUVBQTVCLDRCQUE0QixXQUE1Qiw0QkFBNEIsbUJBRGhCLE1BQU07O2dGQUNsQiw0QkFBNEI7Y0FEeEMsVUFBVTtlQUFDLEVBQUMsVUFBVSxFQUFFLE1BQU0sRUFBQzs7QUF3TWhDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztHQXNDRztBQUNILE1BQU0sVUFBVSwwQ0FBMEM7SUFDeEQsc0JBQXNCLENBQUMsWUFBWSxDQUFDLENBQUM7SUFDckMsT0FBTyx3QkFBd0IsQ0FBQztRQUM5QixFQUFDLE9BQU8sRUFBRSx3QkFBd0IsRUFBRSxXQUFXLEVBQUUsNEJBQTRCLEVBQUM7UUFDOUUsRUFBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLFFBQVEsRUFBRSxVQUFVLEVBQUM7UUFDdkMsRUFBQyxPQUFPLEVBQUUsZ0JBQWdCLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBQztRQUMzQyxPQUFPLFNBQVMsS0FBSyxXQUFXLElBQUksU0FBUztZQUMzQyxDQUFDLENBQUMsQ0FBQyxFQUFDLE9BQU8sRUFBRSxpQkFBaUIsRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFDLENBQUM7WUFDaEQsQ0FBQyxDQUFDLEVBQUU7S0FDUCxDQUFDLENBQUM7QUFDTCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7U3Vic2NyaXB0aW9ufSBmcm9tICdyeGpzJztcblxuaW1wb3J0IHtBcHBsaWNhdGlvblJlZn0gZnJvbSAnLi4vLi4vYXBwbGljYXRpb24vYXBwbGljYXRpb25fcmVmJztcbmltcG9ydCB7SW5qZWN0YWJsZX0gZnJvbSAnLi4vLi4vZGkvaW5qZWN0YWJsZSc7XG5pbXBvcnQge2luamVjdH0gZnJvbSAnLi4vLi4vZGkvaW5qZWN0b3JfY29tcGF0aWJpbGl0eSc7XG5pbXBvcnQge0Vudmlyb25tZW50UHJvdmlkZXJzfSBmcm9tICcuLi8uLi9kaS9pbnRlcmZhY2UvcHJvdmlkZXInO1xuaW1wb3J0IHttYWtlRW52aXJvbm1lbnRQcm92aWRlcnN9IGZyb20gJy4uLy4uL2RpL3Byb3ZpZGVyX2NvbGxlY3Rpb24nO1xuaW1wb3J0IHtSdW50aW1lRXJyb3IsIFJ1bnRpbWVFcnJvckNvZGV9IGZyb20gJy4uLy4uL2Vycm9ycyc7XG5pbXBvcnQge1BlbmRpbmdUYXNrc30gZnJvbSAnLi4vLi4vcGVuZGluZ190YXNrcyc7XG5pbXBvcnQge1xuICBzY2hlZHVsZUNhbGxiYWNrV2l0aE1pY3JvdGFzayxcbiAgc2NoZWR1bGVDYWxsYmFja1dpdGhSYWZSYWNlLFxufSBmcm9tICcuLi8uLi91dGlsL2NhbGxiYWNrX3NjaGVkdWxlcic7XG5pbXBvcnQge3BlcmZvcm1hbmNlTWFya0ZlYXR1cmV9IGZyb20gJy4uLy4uL3V0aWwvcGVyZm9ybWFuY2UnO1xuaW1wb3J0IHtOZ1pvbmUsIE5vb3BOZ1pvbmV9IGZyb20gJy4uLy4uL3pvbmUvbmdfem9uZSc7XG5cbmltcG9ydCB7XG4gIENoYW5nZURldGVjdGlvblNjaGVkdWxlcixcbiAgTm90aWZpY2F0aW9uU291cmNlLFxuICBaT05FTEVTU19FTkFCTEVELFxuICBQUk9WSURFRF9aT05FTEVTUyxcbiAgWk9ORUxFU1NfU0NIRURVTEVSX0RJU0FCTEVELFxufSBmcm9tICcuL3pvbmVsZXNzX3NjaGVkdWxpbmcnO1xuXG5jb25zdCBDT05TRUNVVElWRV9NSUNST1RBU0tfTk9USUZJQ0FUSU9OX0xJTUlUID0gMTAwO1xubGV0IGNvbnNlY3V0aXZlTWljcm90YXNrTm90aWZpY2F0aW9ucyA9IDA7XG5sZXQgc3RhY2tGcm9tTGFzdEZld05vdGlmaWNhdGlvbnM6IHN0cmluZ1tdID0gW107XG5cbmZ1bmN0aW9uIHRyYWNrTWljcm90YXNrTm90aWZpY2F0aW9uRm9yRGVidWdnaW5nKCkge1xuICBjb25zZWN1dGl2ZU1pY3JvdGFza05vdGlmaWNhdGlvbnMrKztcbiAgaWYgKENPTlNFQ1VUSVZFX01JQ1JPVEFTS19OT1RJRklDQVRJT05fTElNSVQgLSBjb25zZWN1dGl2ZU1pY3JvdGFza05vdGlmaWNhdGlvbnMgPCA1KSB7XG4gICAgY29uc3Qgc3RhY2sgPSBuZXcgRXJyb3IoKS5zdGFjaztcbiAgICBpZiAoc3RhY2spIHtcbiAgICAgIHN0YWNrRnJvbUxhc3RGZXdOb3RpZmljYXRpb25zLnB1c2goc3RhY2spO1xuICAgIH1cbiAgfVxuXG4gIGlmIChjb25zZWN1dGl2ZU1pY3JvdGFza05vdGlmaWNhdGlvbnMgPT09IENPTlNFQ1VUSVZFX01JQ1JPVEFTS19OT1RJRklDQVRJT05fTElNSVQpIHtcbiAgICB0aHJvdyBuZXcgUnVudGltZUVycm9yKFxuICAgICAgUnVudGltZUVycm9yQ29kZS5JTkZJTklURV9DSEFOR0VfREVURUNUSU9OLFxuICAgICAgJ0FuZ3VsYXIgY291bGQgbm90IHN0YWJpbGl6ZSBiZWNhdXNlIHRoZXJlIHdlcmUgZW5kbGVzcyBjaGFuZ2Ugbm90aWZpY2F0aW9ucyB3aXRoaW4gdGhlIGJyb3dzZXIgZXZlbnQgbG9vcC4gJyArXG4gICAgICAgICdUaGUgc3RhY2sgZnJvbSB0aGUgbGFzdCBzZXZlcmFsIG5vdGlmaWNhdGlvbnM6IFxcbicgK1xuICAgICAgICBzdGFja0Zyb21MYXN0RmV3Tm90aWZpY2F0aW9ucy5qb2luKCdcXG4nKSxcbiAgICApO1xuICB9XG59XG5cbkBJbmplY3RhYmxlKHtwcm92aWRlZEluOiAncm9vdCd9KVxuZXhwb3J0IGNsYXNzIENoYW5nZURldGVjdGlvblNjaGVkdWxlckltcGwgaW1wbGVtZW50cyBDaGFuZ2VEZXRlY3Rpb25TY2hlZHVsZXIge1xuICBwcml2YXRlIHJlYWRvbmx5IGFwcFJlZiA9IGluamVjdChBcHBsaWNhdGlvblJlZik7XG4gIHByaXZhdGUgcmVhZG9ubHkgdGFza1NlcnZpY2UgPSBpbmplY3QoUGVuZGluZ1Rhc2tzKTtcbiAgcHJpdmF0ZSByZWFkb25seSBuZ1pvbmUgPSBpbmplY3QoTmdab25lKTtcbiAgcHJpdmF0ZSByZWFkb25seSB6b25lbGVzc0VuYWJsZWQgPSBpbmplY3QoWk9ORUxFU1NfRU5BQkxFRCk7XG4gIHByaXZhdGUgcmVhZG9ubHkgZGlzYWJsZVNjaGVkdWxpbmcgPVxuICAgIGluamVjdChaT05FTEVTU19TQ0hFRFVMRVJfRElTQUJMRUQsIHtvcHRpb25hbDogdHJ1ZX0pID8/IGZhbHNlO1xuICBwcml2YXRlIHJlYWRvbmx5IHpvbmVJc0RlZmluZWQgPSB0eXBlb2YgWm9uZSAhPT0gJ3VuZGVmaW5lZCcgJiYgISFab25lLnJvb3QucnVuO1xuICBwcml2YXRlIHJlYWRvbmx5IHNjaGVkdWxlclRpY2tBcHBseUFyZ3MgPSBbe2RhdGE6IHsnX19zY2hlZHVsZXJfdGlja19fJzogdHJ1ZX19XTtcbiAgcHJpdmF0ZSByZWFkb25seSBzdWJzY3JpcHRpb25zID0gbmV3IFN1YnNjcmlwdGlvbigpO1xuXG4gIHByaXZhdGUgY2FuY2VsU2NoZWR1bGVkQ2FsbGJhY2s6IG51bGwgfCAoKCkgPT4gdm9pZCkgPSBudWxsO1xuICBwcml2YXRlIHNob3VsZFJlZnJlc2hWaWV3cyA9IGZhbHNlO1xuICBwcml2YXRlIHVzZU1pY3JvdGFza1NjaGVkdWxlciA9IGZhbHNlO1xuICBydW5uaW5nVGljayA9IGZhbHNlO1xuICBwZW5kaW5nUmVuZGVyVGFza0lkOiBudW1iZXIgfCBudWxsID0gbnVsbDtcblxuICBjb25zdHJ1Y3RvcigpIHtcbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMuYWRkKFxuICAgICAgdGhpcy5hcHBSZWYuYWZ0ZXJUaWNrLnN1YnNjcmliZSgoKSA9PiB7XG4gICAgICAgIC8vIElmIHRoZSBzY2hlZHVsZXIgaXNuJ3QgcnVubmluZyBhIHRpY2sgYnV0IHRoZSBhcHBsaWNhdGlvbiB0aWNrZWQsIHRoYXQgbWVhbnNcbiAgICAgICAgLy8gc29tZW9uZSBjYWxsZWQgQXBwbGljYXRpb25SZWYudGljayBtYW51YWxseS4gSW4gdGhpcyBjYXNlLCB3ZSBzaG91bGQgY2FuY2VsXG4gICAgICAgIC8vIGFueSBjaGFuZ2UgZGV0ZWN0aW9ucyB0aGF0IGhhZCBiZWVuIHNjaGVkdWxlZCBzbyB3ZSBkb24ndCBydW4gYW4gZXh0cmEgb25lLlxuICAgICAgICBpZiAoIXRoaXMucnVubmluZ1RpY2spIHtcbiAgICAgICAgICB0aGlzLmNsZWFudXAoKTtcbiAgICAgICAgfVxuICAgICAgfSksXG4gICAgKTtcbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMuYWRkKFxuICAgICAgdGhpcy5uZ1pvbmUub25VbnN0YWJsZS5zdWJzY3JpYmUoKCkgPT4ge1xuICAgICAgICAvLyBJZiB0aGUgem9uZSBiZWNvbWVzIHVuc3RhYmxlIHdoZW4gd2UncmUgbm90IHJ1bm5pbmcgdGljayAodGhpcyBoYXBwZW5zIGZyb20gdGhlIHpvbmUucnVuKSxcbiAgICAgICAgLy8gd2Ugc2hvdWxkIGNhbmNlbCBhbnkgc2NoZWR1bGVkIGNoYW5nZSBkZXRlY3Rpb24gaGVyZSBiZWNhdXNlIGF0IHRoaXMgcG9pbnQgd2VcbiAgICAgICAgLy8ga25vdyB0aGF0IHRoZSB6b25lIHdpbGwgc3RhYmlsaXplIGF0IHNvbWUgcG9pbnQgYW5kIHJ1biBjaGFuZ2UgZGV0ZWN0aW9uIGl0c2VsZi5cbiAgICAgICAgaWYgKCF0aGlzLnJ1bm5pbmdUaWNrKSB7XG4gICAgICAgICAgdGhpcy5jbGVhbnVwKCk7XG4gICAgICAgIH1cbiAgICAgIH0pLFxuICAgICk7XG5cbiAgICAvLyBUT0RPKGF0c2NvdHQpOiBUaGVzZSBjb25kaXRpb25zIHdpbGwgbmVlZCB0byBjaGFuZ2Ugd2hlbiB6b25lbGVzcyBpcyB0aGUgZGVmYXVsdFxuICAgIC8vIEluc3RlYWQsIHRoZXkgc2hvdWxkIGZsaXAgdG8gY2hlY2tpbmcgaWYgWm9uZUpTIHNjaGVkdWxpbmcgaXMgcHJvdmlkZWRcbiAgICB0aGlzLmRpc2FibGVTY2hlZHVsaW5nIHx8PVxuICAgICAgIXRoaXMuem9uZWxlc3NFbmFibGVkICYmXG4gICAgICAvLyBOb29wTmdab25lIHdpdGhvdXQgZW5hYmxpbmcgem9uZWxlc3MgbWVhbnMgbm8gc2NoZWR1bGluZyB3aGF0c29ldmVyXG4gICAgICAodGhpcy5uZ1pvbmUgaW5zdGFuY2VvZiBOb29wTmdab25lIHx8XG4gICAgICAgIC8vIFRoZSBzYW1lIGdvZXMgZm9yIHRoZSBsYWNrIG9mIFpvbmUgd2l0aG91dCBlbmFibGluZyB6b25lbGVzcyBzY2hlZHVsaW5nXG4gICAgICAgICF0aGlzLnpvbmVJc0RlZmluZWQpO1xuICB9XG5cbiAgbm90aWZ5KHNvdXJjZTogTm90aWZpY2F0aW9uU291cmNlKTogdm9pZCB7XG4gICAgaWYgKCF0aGlzLnpvbmVsZXNzRW5hYmxlZCAmJiBzb3VyY2UgPT09IE5vdGlmaWNhdGlvblNvdXJjZS5MaXN0ZW5lcikge1xuICAgICAgLy8gV2hlbiB0aGUgbm90aWZpY2F0aW9uIGNvbWVzIGZyb20gYSBsaXN0ZW5lciwgd2Ugc2tpcCB0aGUgbm90aWZpY2F0aW9uIHVubGVzcyB0aGVcbiAgICAgIC8vIGFwcGxpY2F0aW9uIGhhcyBlbmFibGVkIHpvbmVsZXNzLiBJZGVhbGx5LCBsaXN0ZW5lcnMgd291bGRuJ3Qgbm90aWZ5IHRoZSBzY2hlZHVsZXIgYXQgYWxsXG4gICAgICAvLyBhdXRvbWF0aWNhbGx5LiBXZSBkbyBub3Qga25vdyB0aGF0IGEgZGV2ZWxvcGVyIG1hZGUgYSBjaGFuZ2UgaW4gdGhlIGxpc3RlbmVyIGNhbGxiYWNrIHRoYXRcbiAgICAgIC8vIHJlcXVpcmVzIGFuIGBBcHBsaWNhdGlvblJlZi50aWNrYCAoc3luY2hyb25pemUgdGVtcGxhdGVzIC8gcnVuIHJlbmRlciBob29rcykuIFdlIGRvIHRoaXNcbiAgICAgIC8vIG9ubHkgZm9yIGFuIGVhc2llciBtaWdyYXRpb24gZnJvbSBPblB1c2ggY29tcG9uZW50cyB0byB6b25lbGVzcy4gQmVjYXVzZSBsaXN0ZW5lcnMgYXJlXG4gICAgICAvLyB1c3VhbGx5IGV4ZWN1dGVkIGluc2lkZSB0aGUgQW5ndWxhciB6b25lIGFuZCBsaXN0ZW5lcnMgYXV0b21hdGljYWxseSBjYWxsIGBtYXJrVmlld0RpcnR5YCxcbiAgICAgIC8vIGRldmVsb3BlcnMgbmV2ZXIgbmVlZGVkIHRvIG1hbnVhbGx5IHVzZSBgQ2hhbmdlRGV0ZWN0b3JSZWYubWFya0ZvckNoZWNrYCBvciBzb21lIG90aGVyIEFQSVxuICAgICAgLy8gdG8gbWFrZSBsaXN0ZW5lciBjYWxsYmFja3Mgd29yayBjb3JyZWN0bHkgd2l0aCBgT25QdXNoYCBjb21wb25lbnRzLlxuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBzd2l0Y2ggKHNvdXJjZSkge1xuICAgICAgY2FzZSBOb3RpZmljYXRpb25Tb3VyY2UuRGVidWdBcHBseUNoYW5nZXM6XG4gICAgICBjYXNlIE5vdGlmaWNhdGlvblNvdXJjZS5EZWZlckJsb2NrU3RhdGVVcGRhdGU6XG4gICAgICBjYXNlIE5vdGlmaWNhdGlvblNvdXJjZS5NYXJrQW5jZXN0b3JzRm9yVHJhdmVyc2FsOlxuICAgICAgY2FzZSBOb3RpZmljYXRpb25Tb3VyY2UuTWFya0ZvckNoZWNrOlxuICAgICAgY2FzZSBOb3RpZmljYXRpb25Tb3VyY2UuTGlzdGVuZXI6XG4gICAgICBjYXNlIE5vdGlmaWNhdGlvblNvdXJjZS5TZXRJbnB1dDoge1xuICAgICAgICB0aGlzLnNob3VsZFJlZnJlc2hWaWV3cyA9IHRydWU7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgY2FzZSBOb3RpZmljYXRpb25Tb3VyY2UuVmlld0RldGFjaGVkRnJvbURPTTpcbiAgICAgIGNhc2UgTm90aWZpY2F0aW9uU291cmNlLlZpZXdBdHRhY2hlZDpcbiAgICAgIGNhc2UgTm90aWZpY2F0aW9uU291cmNlLk5ld1JlbmRlckhvb2s6XG4gICAgICBjYXNlIE5vdGlmaWNhdGlvblNvdXJjZS5Bc3luY0FuaW1hdGlvbnNMb2FkZWQ6XG4gICAgICBkZWZhdWx0OiB7XG4gICAgICAgIC8vIFRoZXNlIG5vdGlmaWNhdGlvbnMgb25seSBzY2hlZHVsZSBhIHRpY2sgYnV0IGRvIG5vdCBjaGFuZ2Ugd2hldGhlciB3ZSBzaG91bGQgcmVmcmVzaFxuICAgICAgICAvLyB2aWV3cy4gSW5zdGVhZCwgd2Ugb25seSBuZWVkIHRvIHJ1biByZW5kZXIgaG9va3MgdW5sZXNzIGFub3RoZXIgbm90aWZpY2F0aW9uIGZyb20gdGhlXG4gICAgICAgIC8vIG90aGVyIHNldCBpcyBhbHNvIHJlY2VpdmVkIGJlZm9yZSBgdGlja2AgaGFwcGVucy5cbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoIXRoaXMuc2hvdWxkU2NoZWR1bGVUaWNrKCkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIG5nRGV2TW9kZSA9PT0gJ3VuZGVmaW5lZCcgfHwgbmdEZXZNb2RlKSB7XG4gICAgICBpZiAodGhpcy51c2VNaWNyb3Rhc2tTY2hlZHVsZXIpIHtcbiAgICAgICAgdHJhY2tNaWNyb3Rhc2tOb3RpZmljYXRpb25Gb3JEZWJ1Z2dpbmcoKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnNlY3V0aXZlTWljcm90YXNrTm90aWZpY2F0aW9ucyA9IDA7XG4gICAgICAgIHN0YWNrRnJvbUxhc3RGZXdOb3RpZmljYXRpb25zLmxlbmd0aCA9IDA7XG4gICAgICB9XG4gICAgfVxuXG4gICAgY29uc3Qgc2NoZWR1bGVDYWxsYmFjayA9IHRoaXMudXNlTWljcm90YXNrU2NoZWR1bGVyXG4gICAgICA/IHNjaGVkdWxlQ2FsbGJhY2tXaXRoTWljcm90YXNrXG4gICAgICA6IHNjaGVkdWxlQ2FsbGJhY2tXaXRoUmFmUmFjZTtcbiAgICB0aGlzLnBlbmRpbmdSZW5kZXJUYXNrSWQgPSB0aGlzLnRhc2tTZXJ2aWNlLmFkZCgpO1xuICAgIGlmICh0aGlzLnpvbmVJc0RlZmluZWQpIHtcbiAgICAgIFpvbmUucm9vdC5ydW4oKCkgPT4ge1xuICAgICAgICB0aGlzLmNhbmNlbFNjaGVkdWxlZENhbGxiYWNrID0gc2NoZWR1bGVDYWxsYmFjaygoKSA9PiB7XG4gICAgICAgICAgdGhpcy50aWNrKHRoaXMuc2hvdWxkUmVmcmVzaFZpZXdzKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5jYW5jZWxTY2hlZHVsZWRDYWxsYmFjayA9IHNjaGVkdWxlQ2FsbGJhY2soKCkgPT4ge1xuICAgICAgICB0aGlzLnRpY2sodGhpcy5zaG91bGRSZWZyZXNoVmlld3MpO1xuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBzaG91bGRTY2hlZHVsZVRpY2soKTogYm9vbGVhbiB7XG4gICAgaWYgKHRoaXMuZGlzYWJsZVNjaGVkdWxpbmcpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgLy8gYWxyZWFkeSBzY2hlZHVsZWQgb3IgcnVubmluZ1xuICAgIGlmICh0aGlzLnBlbmRpbmdSZW5kZXJUYXNrSWQgIT09IG51bGwgfHwgdGhpcy5ydW5uaW5nVGljayB8fCB0aGlzLmFwcFJlZi5fcnVubmluZ1RpY2spIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgLy8gSWYgd2UncmUgaW5zaWRlIHRoZSB6b25lIGRvbid0IGJvdGhlciB3aXRoIHNjaGVkdWxlci4gWm9uZSB3aWxsIHN0YWJpbGl6ZVxuICAgIC8vIGV2ZW50dWFsbHkgYW5kIHJ1biBjaGFuZ2UgZGV0ZWN0aW9uLlxuICAgIGlmICghdGhpcy56b25lbGVzc0VuYWJsZWQgJiYgdGhpcy56b25lSXNEZWZpbmVkICYmIE5nWm9uZS5pc0luQW5ndWxhclpvbmUoKSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgLyoqXG4gICAqIENhbGxzIEFwcGxpY2F0aW9uUmVmLl90aWNrIGluc2lkZSB0aGUgYE5nWm9uZWAuXG4gICAqXG4gICAqIENhbGxpbmcgYHRpY2tgIGRpcmVjdGx5IHJ1bnMgY2hhbmdlIGRldGVjdGlvbiBhbmQgY2FuY2VscyBhbnkgY2hhbmdlIGRldGVjdGlvbiB0aGF0IGhhZCBiZWVuXG4gICAqIHNjaGVkdWxlZCBwcmV2aW91c2x5LlxuICAgKlxuICAgKiBAcGFyYW0gc2hvdWxkUmVmcmVzaFZpZXdzIFBhc3NlZCBkaXJlY3RseSB0byBgQXBwbGljYXRpb25SZWYuX3RpY2tgIGFuZCBza2lwcyBzdHJhaWdodCB0b1xuICAgKiAgICAgcmVuZGVyIGhvb2tzIHdoZW4gYGZhbHNlYC5cbiAgICovXG4gIHByaXZhdGUgdGljayhzaG91bGRSZWZyZXNoVmlld3M6IGJvb2xlYW4pOiB2b2lkIHtcbiAgICAvLyBXaGVuIG5nWm9uZS5ydW4gYmVsb3cgZXhpdHMsIG9uTWljcm90YXNrRW1wdHkgbWF5IGVtaXQgaWYgdGhlIHpvbmUgaXNcbiAgICAvLyBzdGFibGUuIFdlIHdhbnQgdG8gcHJldmVudCBkb3VibGUgdGlja2luZyBzbyB3ZSB0cmFjayB3aGV0aGVyIHRoZSB0aWNrIGlzXG4gICAgLy8gYWxyZWFkeSBydW5uaW5nIGFuZCBza2lwIGl0IGlmIHNvLlxuICAgIGlmICh0aGlzLnJ1bm5pbmdUaWNrIHx8IHRoaXMuYXBwUmVmLmRlc3Ryb3llZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHRhc2sgPSB0aGlzLnRhc2tTZXJ2aWNlLmFkZCgpO1xuICAgIHRyeSB7XG4gICAgICB0aGlzLm5nWm9uZS5ydW4oXG4gICAgICAgICgpID0+IHtcbiAgICAgICAgICB0aGlzLnJ1bm5pbmdUaWNrID0gdHJ1ZTtcbiAgICAgICAgICB0aGlzLmFwcFJlZi5fdGljayhzaG91bGRSZWZyZXNoVmlld3MpO1xuICAgICAgICB9LFxuICAgICAgICB1bmRlZmluZWQsXG4gICAgICAgIHRoaXMuc2NoZWR1bGVyVGlja0FwcGx5QXJncyxcbiAgICAgICk7XG4gICAgfSBjYXRjaCAoZTogdW5rbm93bikge1xuICAgICAgdGhpcy50YXNrU2VydmljZS5yZW1vdmUodGFzayk7XG4gICAgICB0aHJvdyBlO1xuICAgIH0gZmluYWxseSB7XG4gICAgICB0aGlzLmNsZWFudXAoKTtcbiAgICB9XG4gICAgLy8gSWYgd2UncmUgbm90aWZpZWQgb2YgYSBjaGFuZ2Ugd2l0aGluIDEgbWljcm90YXNrIG9mIHJ1bm5pbmcgY2hhbmdlXG4gICAgLy8gZGV0ZWN0aW9uLCBydW4gYW5vdGhlciByb3VuZCBpbiB0aGUgc2FtZSBldmVudCBsb29wLiBUaGlzIGFsbG93cyBjb2RlXG4gICAgLy8gd2hpY2ggdXNlcyBQcm9taXNlLnJlc29sdmUgKHNlZSBOZ01vZGVsKSB0byBhdm9pZFxuICAgIC8vIEV4cHJlc3Npb25DaGFuZ2VkLi4uRXJyb3IgdG8gc3RpbGwgYmUgcmVmbGVjdGVkIGluIGEgc2luZ2xlIGJyb3dzZXJcbiAgICAvLyBwYWludCwgZXZlbiBpZiB0aGF0IHNwYW5zIG11bHRpcGxlIHJvdW5kcyBvZiBjaGFuZ2UgZGV0ZWN0aW9uLlxuICAgIHRoaXMudXNlTWljcm90YXNrU2NoZWR1bGVyID0gdHJ1ZTtcbiAgICBzY2hlZHVsZUNhbGxiYWNrV2l0aE1pY3JvdGFzaygoKSA9PiB7XG4gICAgICB0aGlzLnVzZU1pY3JvdGFza1NjaGVkdWxlciA9IGZhbHNlO1xuICAgICAgdGhpcy50YXNrU2VydmljZS5yZW1vdmUodGFzayk7XG4gICAgfSk7XG4gIH1cblxuICBuZ09uRGVzdHJveSgpIHtcbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMudW5zdWJzY3JpYmUoKTtcbiAgICB0aGlzLmNsZWFudXAoKTtcbiAgfVxuXG4gIHByaXZhdGUgY2xlYW51cCgpIHtcbiAgICB0aGlzLnNob3VsZFJlZnJlc2hWaWV3cyA9IGZhbHNlO1xuICAgIHRoaXMucnVubmluZ1RpY2sgPSBmYWxzZTtcbiAgICB0aGlzLmNhbmNlbFNjaGVkdWxlZENhbGxiYWNrPy4oKTtcbiAgICB0aGlzLmNhbmNlbFNjaGVkdWxlZENhbGxiYWNrID0gbnVsbDtcbiAgICAvLyBJZiB0aGlzIGlzIHRoZSBsYXN0IHRhc2ssIHRoZSBzZXJ2aWNlIHdpbGwgc3luY2hyb25vdXNseSBlbWl0IGEgc3RhYmxlXG4gICAgLy8gbm90aWZpY2F0aW9uLiBJZiB0aGVyZSBpcyBhIHN1YnNjcmliZXIgdGhhdCB0aGVuIGFjdHMgaW4gYSB3YXkgdGhhdFxuICAgIC8vIHRyaWVzIHRvIG5vdGlmeSB0aGUgc2NoZWR1bGVyIGFnYWluLCB3ZSBuZWVkIHRvIGJlIGFibGUgdG8gcmVzcG9uZCB0b1xuICAgIC8vIHNjaGVkdWxlIGEgbmV3IGNoYW5nZSBkZXRlY3Rpb24uIFRoZXJlZm9yZSwgd2Ugc2hvdWxkIGNsZWFyIHRoZSB0YXNrIElEXG4gICAgLy8gYmVmb3JlIHJlbW92aW5nIGl0IGZyb20gdGhlIHBlbmRpbmcgdGFza3MgKG9yIHRoZSB0YXNrcyBzZXJ2aWNlIHNob3VsZFxuICAgIC8vIG5vdCBzeW5jaHJvbm91c2x5IGVtaXQgc3RhYmxlLCBzaW1pbGFyIHRvIGhvdyBab25lIHN0YWJsZW5lc3Mgb25seVxuICAgIC8vIGhhcHBlbnMgaWYgaXQncyBzdGlsbCBzdGFibGUgYWZ0ZXIgYSBtaWNyb3Rhc2spLlxuICAgIGlmICh0aGlzLnBlbmRpbmdSZW5kZXJUYXNrSWQgIT09IG51bGwpIHtcbiAgICAgIGNvbnN0IHRhc2tJZCA9IHRoaXMucGVuZGluZ1JlbmRlclRhc2tJZDtcbiAgICAgIHRoaXMucGVuZGluZ1JlbmRlclRhc2tJZCA9IG51bGw7XG4gICAgICB0aGlzLnRhc2tTZXJ2aWNlLnJlbW92ZSh0YXNrSWQpO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIFByb3ZpZGVzIGNoYW5nZSBkZXRlY3Rpb24gd2l0aG91dCBab25lSlMgZm9yIHRoZSBhcHBsaWNhdGlvbiBib290c3RyYXBwZWQgdXNpbmdcbiAqIGBib290c3RyYXBBcHBsaWNhdGlvbmAuXG4gKlxuICogVGhpcyBmdW5jdGlvbiBhbGxvd3MgeW91IHRvIGNvbmZpZ3VyZSB0aGUgYXBwbGljYXRpb24gdG8gbm90IHVzZSB0aGUgc3RhdGUvc3RhdGUgY2hhbmdlcyBvZlxuICogWm9uZUpTIHRvIHNjaGVkdWxlIGNoYW5nZSBkZXRlY3Rpb24gaW4gdGhlIGFwcGxpY2F0aW9uLiBUaGlzIHdpbGwgd29yayB3aGVuIFpvbmVKUyBpcyBub3QgcHJlc2VudFxuICogb24gdGhlIHBhZ2UgYXQgYWxsIG9yIGlmIGl0IGV4aXN0cyBiZWNhdXNlIHNvbWV0aGluZyBlbHNlIGlzIHVzaW5nIGl0IChlaXRoZXIgYW5vdGhlciBBbmd1bGFyXG4gKiBhcHBsaWNhdGlvbiB3aGljaCB1c2VzIFpvbmVKUyBmb3Igc2NoZWR1bGluZyBvciBzb21lIG90aGVyIGxpYnJhcnkgdGhhdCByZWxpZXMgb24gWm9uZUpTKS5cbiAqXG4gKiBUaGlzIGNhbiBhbHNvIGJlIGFkZGVkIHRvIHRoZSBgVGVzdEJlZGAgcHJvdmlkZXJzIHRvIGNvbmZpZ3VyZSB0aGUgdGVzdCBlbnZpcm9ubWVudCB0byBtb3JlXG4gKiBjbG9zZWx5IG1hdGNoIHByb2R1Y3Rpb24gYmVoYXZpb3IuIFRoaXMgd2lsbCBoZWxwIGdpdmUgaGlnaGVyIGNvbmZpZGVuY2UgdGhhdCBjb21wb25lbnRzIGFyZVxuICogY29tcGF0aWJsZSB3aXRoIHpvbmVsZXNzIGNoYW5nZSBkZXRlY3Rpb24uXG4gKlxuICogWm9uZUpTIHVzZXMgYnJvd3NlciBldmVudHMgdG8gdHJpZ2dlciBjaGFuZ2UgZGV0ZWN0aW9uLiBXaGVuIHVzaW5nIHRoaXMgcHJvdmlkZXIsIEFuZ3VsYXIgd2lsbFxuICogaW5zdGVhZCB1c2UgQW5ndWxhciBBUElzIHRvIHNjaGVkdWxlIGNoYW5nZSBkZXRlY3Rpb24uIFRoZXNlIEFQSXMgaW5jbHVkZTpcbiAqXG4gKiAtIGBDaGFuZ2VEZXRlY3RvclJlZi5tYXJrRm9yQ2hlY2tgXG4gKiAtIGBDb21wb25lbnRSZWYuc2V0SW5wdXRgXG4gKiAtIHVwZGF0aW5nIGEgc2lnbmFsIHRoYXQgaXMgcmVhZCBpbiBhIHRlbXBsYXRlXG4gKiAtIHdoZW4gYm91bmQgaG9zdCBvciB0ZW1wbGF0ZSBsaXN0ZW5lcnMgYXJlIHRyaWdnZXJlZFxuICogLSBhdHRhY2hpbmcgYSB2aWV3IHRoYXQgd2FzIG1hcmtlZCBkaXJ0eSBieSBvbmUgb2YgdGhlIGFib3ZlXG4gKiAtIHJlbW92aW5nIGEgdmlld1xuICogLSByZWdpc3RlcmluZyBhIHJlbmRlciBob29rICh0ZW1wbGF0ZXMgYXJlIG9ubHkgcmVmcmVzaGVkIGlmIHJlbmRlciBob29rcyBkbyBvbmUgb2YgdGhlIGFib3ZlKVxuICpcbiAqIEB1c2FnZU5vdGVzXG4gKiBgYGB0eXBlc2NyaXB0XG4gKiBib290c3RyYXBBcHBsaWNhdGlvbihNeUFwcCwge3Byb3ZpZGVyczogW1xuICogICBwcm92aWRlRXhwZXJpbWVudGFsWm9uZWxlc3NDaGFuZ2VEZXRlY3Rpb24oKSxcbiAqIF19KTtcbiAqIGBgYFxuICpcbiAqIFRoaXMgQVBJIGlzIGV4cGVyaW1lbnRhbC4gTmVpdGhlciB0aGUgc2hhcGUsIG5vciB0aGUgdW5kZXJseWluZyBiZWhhdmlvciBpcyBzdGFibGUgYW5kIGNhbiBjaGFuZ2VcbiAqIGluIHBhdGNoIHZlcnNpb25zLiBUaGVyZSBhcmUga25vd24gZmVhdHVyZSBnYXBzIGFuZCBBUEkgZXJnb25vbWljIGNvbnNpZGVyYXRpb25zLiBXZSB3aWxsIGl0ZXJhdGVcbiAqIG9uIHRoZSBleGFjdCBBUEkgYmFzZWQgb24gdGhlIGZlZWRiYWNrIGFuZCBvdXIgdW5kZXJzdGFuZGluZyBvZiB0aGUgcHJvYmxlbSBhbmQgc29sdXRpb24gc3BhY2UuXG4gKlxuICogQHB1YmxpY0FwaVxuICogQGV4cGVyaW1lbnRhbFxuICogQHNlZSB7QGxpbmsgYm9vdHN0cmFwQXBwbGljYXRpb259XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwcm92aWRlRXhwZXJpbWVudGFsWm9uZWxlc3NDaGFuZ2VEZXRlY3Rpb24oKTogRW52aXJvbm1lbnRQcm92aWRlcnMge1xuICBwZXJmb3JtYW5jZU1hcmtGZWF0dXJlKCdOZ1pvbmVsZXNzJyk7XG4gIHJldHVybiBtYWtlRW52aXJvbm1lbnRQcm92aWRlcnMoW1xuICAgIHtwcm92aWRlOiBDaGFuZ2VEZXRlY3Rpb25TY2hlZHVsZXIsIHVzZUV4aXN0aW5nOiBDaGFuZ2VEZXRlY3Rpb25TY2hlZHVsZXJJbXBsfSxcbiAgICB7cHJvdmlkZTogTmdab25lLCB1c2VDbGFzczogTm9vcE5nWm9uZX0sXG4gICAge3Byb3ZpZGU6IFpPTkVMRVNTX0VOQUJMRUQsIHVzZVZhbHVlOiB0cnVlfSxcbiAgICB0eXBlb2YgbmdEZXZNb2RlID09PSAndW5kZWZpbmVkJyB8fCBuZ0Rldk1vZGVcbiAgICAgID8gW3twcm92aWRlOiBQUk9WSURFRF9aT05FTEVTUywgdXNlVmFsdWU6IHRydWV9XVxuICAgICAgOiBbXSxcbiAgXSk7XG59XG4iXX0=