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
        this.disableScheduling ||=
            !this.zonelessEnabled &&
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiem9uZWxlc3Nfc2NoZWR1bGluZ19pbXBsLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvY2hhbmdlX2RldGVjdGlvbi9zY2hlZHVsaW5nL3pvbmVsZXNzX3NjaGVkdWxpbmdfaW1wbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQUMsWUFBWSxFQUFDLE1BQU0sTUFBTSxDQUFDO0FBRWxDLE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSxtQ0FBbUMsQ0FBQztBQUNqRSxPQUFPLEVBQUMsVUFBVSxFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFDL0MsT0FBTyxFQUFDLE1BQU0sRUFBQyxNQUFNLGlDQUFpQyxDQUFDO0FBRXZELE9BQU8sRUFBQyx3QkFBd0IsRUFBQyxNQUFNLDhCQUE4QixDQUFDO0FBQ3RFLE9BQU8sRUFBQyxZQUFZLEVBQW1CLE1BQU0sY0FBYyxDQUFDO0FBQzVELE9BQU8sRUFBQyxZQUFZLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUNqRCxPQUFPLEVBQ0wsNkJBQTZCLEVBQzdCLDJCQUEyQixHQUM1QixNQUFNLCtCQUErQixDQUFDO0FBQ3ZDLE9BQU8sRUFBQyxzQkFBc0IsRUFBQyxNQUFNLHdCQUF3QixDQUFDO0FBQzlELE9BQU8sRUFBQyxNQUFNLEVBQUUsVUFBVSxFQUFDLE1BQU0sb0JBQW9CLENBQUM7QUFFdEQsT0FBTyxFQUNMLHdCQUF3QixFQUV4QixnQkFBZ0IsRUFDaEIsMkJBQTJCLEdBQzVCLE1BQU0sdUJBQXVCLENBQUM7O0FBRS9CLE1BQU0sd0NBQXdDLEdBQUcsR0FBRyxDQUFDO0FBQ3JELElBQUksaUNBQWlDLEdBQUcsQ0FBQyxDQUFDO0FBQzFDLElBQUksNkJBQTZCLEdBQWEsRUFBRSxDQUFDO0FBRWpELFNBQVMsc0NBQXNDO0lBQzdDLGlDQUFpQyxFQUFFLENBQUM7SUFDcEMsSUFBSSx3Q0FB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QXlFO1FBQ3pFLHNFQUFzRTtRQUN0RSx3RUFBd0U7UUFDeEUsMEVBQTBFO1FBQzFFLHlFQUF5RTtRQUN6RSxxRUFBcUU7UUFDckUsbURBQW1EO1FBQ25ELElBQUksSUFBSSxDQUFDLG1CQUFtQixLQUFLLElBQUksRUFBRSxDQUFDO1lBQ3RDLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxtQkFBbUIsQ0FBQztZQUN4QyxJQUFJLENBQUMsbUJBQW1CLEdBQUcsSUFBSSxDQUFDO1lBQ2hDLElBQUksQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ2xDLENBQUM7SUFDSCxDQUFDOzZGQXJNVSw0QkFBNEI7dUVBQTVCLDRCQUE0QixXQUE1Qiw0QkFBNEIsbUJBRGhCLE1BQU07O2dGQUNsQiw0QkFBNEI7Y0FEeEMsVUFBVTtlQUFDLEVBQUMsVUFBVSxFQUFFLE1BQU0sRUFBQzs7QUF5TWhDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztHQXNDRztBQUNILE1BQU0sVUFBVSwwQ0FBMEM7SUFDeEQsc0JBQXNCLENBQUMsWUFBWSxDQUFDLENBQUM7SUFDckMsT0FBTyx3QkFBd0IsQ0FBQztRQUM5QixFQUFDLE9BQU8sRUFBRSx3QkFBd0IsRUFBRSxXQUFXLEVBQUUsNEJBQTRCLEVBQUM7UUFDOUUsRUFBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLFFBQVEsRUFBRSxVQUFVLEVBQUM7UUFDdkMsRUFBQyxPQUFPLEVBQUUsZ0JBQWdCLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBQztLQUM1QyxDQUFDLENBQUM7QUFDTCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7U3Vic2NyaXB0aW9ufSBmcm9tICdyeGpzJztcblxuaW1wb3J0IHtBcHBsaWNhdGlvblJlZn0gZnJvbSAnLi4vLi4vYXBwbGljYXRpb24vYXBwbGljYXRpb25fcmVmJztcbmltcG9ydCB7SW5qZWN0YWJsZX0gZnJvbSAnLi4vLi4vZGkvaW5qZWN0YWJsZSc7XG5pbXBvcnQge2luamVjdH0gZnJvbSAnLi4vLi4vZGkvaW5qZWN0b3JfY29tcGF0aWJpbGl0eSc7XG5pbXBvcnQge0Vudmlyb25tZW50UHJvdmlkZXJzfSBmcm9tICcuLi8uLi9kaS9pbnRlcmZhY2UvcHJvdmlkZXInO1xuaW1wb3J0IHttYWtlRW52aXJvbm1lbnRQcm92aWRlcnN9IGZyb20gJy4uLy4uL2RpL3Byb3ZpZGVyX2NvbGxlY3Rpb24nO1xuaW1wb3J0IHtSdW50aW1lRXJyb3IsIFJ1bnRpbWVFcnJvckNvZGV9IGZyb20gJy4uLy4uL2Vycm9ycyc7XG5pbXBvcnQge1BlbmRpbmdUYXNrc30gZnJvbSAnLi4vLi4vcGVuZGluZ190YXNrcyc7XG5pbXBvcnQge1xuICBzY2hlZHVsZUNhbGxiYWNrV2l0aE1pY3JvdGFzayxcbiAgc2NoZWR1bGVDYWxsYmFja1dpdGhSYWZSYWNlLFxufSBmcm9tICcuLi8uLi91dGlsL2NhbGxiYWNrX3NjaGVkdWxlcic7XG5pbXBvcnQge3BlcmZvcm1hbmNlTWFya0ZlYXR1cmV9IGZyb20gJy4uLy4uL3V0aWwvcGVyZm9ybWFuY2UnO1xuaW1wb3J0IHtOZ1pvbmUsIE5vb3BOZ1pvbmV9IGZyb20gJy4uLy4uL3pvbmUvbmdfem9uZSc7XG5cbmltcG9ydCB7XG4gIENoYW5nZURldGVjdGlvblNjaGVkdWxlcixcbiAgTm90aWZpY2F0aW9uU291cmNlLFxuICBaT05FTEVTU19FTkFCTEVELFxuICBaT05FTEVTU19TQ0hFRFVMRVJfRElTQUJMRUQsXG59IGZyb20gJy4vem9uZWxlc3Nfc2NoZWR1bGluZyc7XG5cbmNvbnN0IENPTlNFQ1VUSVZFX01JQ1JPVEFTS19OT1RJRklDQVRJT05fTElNSVQgPSAxMDA7XG5sZXQgY29uc2VjdXRpdmVNaWNyb3Rhc2tOb3RpZmljYXRpb25zID0gMDtcbmxldCBzdGFja0Zyb21MYXN0RmV3Tm90aWZpY2F0aW9uczogc3RyaW5nW10gPSBbXTtcblxuZnVuY3Rpb24gdHJhY2tNaWNyb3Rhc2tOb3RpZmljYXRpb25Gb3JEZWJ1Z2dpbmcoKSB7XG4gIGNvbnNlY3V0aXZlTWljcm90YXNrTm90aWZpY2F0aW9ucysrO1xuICBpZiAoQ09OU0VDVVRJVkVfTUlDUk9UQVNLX05PVElGSUNBVElPTl9MSU1JVCAtIGNvbnNlY3V0aXZlTWljcm90YXNrTm90aWZpY2F0aW9ucyA8IDUpIHtcbiAgICBjb25zdCBzdGFjayA9IG5ldyBFcnJvcigpLnN0YWNrO1xuICAgIGlmIChzdGFjaykge1xuICAgICAgc3RhY2tGcm9tTGFzdEZld05vdGlmaWNhdGlvbnMucHVzaChzdGFjayk7XG4gICAgfVxuICB9XG5cbiAgaWYgKGNvbnNlY3V0aXZlTWljcm90YXNrTm90aWZpY2F0aW9ucyA9PT0gQ09OU0VDVVRJVkVfTUlDUk9UQVNLX05PVElGSUNBVElPTl9MSU1JVCkge1xuICAgIHRocm93IG5ldyBSdW50aW1lRXJyb3IoXG4gICAgICBSdW50aW1lRXJyb3JDb2RlLklORklOSVRFX0NIQU5HRV9ERVRFQ1RJT04sXG4gICAgICAnQW5ndWxhciBjb3VsZCBub3Qgc3RhYmlsaXplIGJlY2F1c2UgdGhlcmUgd2VyZSBlbmRsZXNzIGNoYW5nZSBub3RpZmljYXRpb25zIHdpdGhpbiB0aGUgYnJvd3NlciBldmVudCBsb29wLiAnICtcbiAgICAgICAgJ1RoZSBzdGFjayBmcm9tIHRoZSBsYXN0IHNldmVyYWwgbm90aWZpY2F0aW9uczogXFxuJyArXG4gICAgICAgIHN0YWNrRnJvbUxhc3RGZXdOb3RpZmljYXRpb25zLmpvaW4oJ1xcbicpLFxuICAgICk7XG4gIH1cbn1cblxuQEluamVjdGFibGUoe3Byb3ZpZGVkSW46ICdyb290J30pXG5leHBvcnQgY2xhc3MgQ2hhbmdlRGV0ZWN0aW9uU2NoZWR1bGVySW1wbCBpbXBsZW1lbnRzIENoYW5nZURldGVjdGlvblNjaGVkdWxlciB7XG4gIHByaXZhdGUgcmVhZG9ubHkgYXBwUmVmID0gaW5qZWN0KEFwcGxpY2F0aW9uUmVmKTtcbiAgcHJpdmF0ZSByZWFkb25seSB0YXNrU2VydmljZSA9IGluamVjdChQZW5kaW5nVGFza3MpO1xuICBwcml2YXRlIHJlYWRvbmx5IG5nWm9uZSA9IGluamVjdChOZ1pvbmUpO1xuICBwcml2YXRlIHJlYWRvbmx5IHpvbmVsZXNzRW5hYmxlZCA9IGluamVjdChaT05FTEVTU19FTkFCTEVEKTtcbiAgcHJpdmF0ZSByZWFkb25seSBkaXNhYmxlU2NoZWR1bGluZyA9XG4gICAgaW5qZWN0KFpPTkVMRVNTX1NDSEVEVUxFUl9ESVNBQkxFRCwge29wdGlvbmFsOiB0cnVlfSkgPz8gZmFsc2U7XG4gIHByaXZhdGUgcmVhZG9ubHkgem9uZUlzRGVmaW5lZCA9IHR5cGVvZiBab25lICE9PSAndW5kZWZpbmVkJyAmJiAhIVpvbmUucm9vdC5ydW47XG4gIHByaXZhdGUgcmVhZG9ubHkgc2NoZWR1bGVyVGlja0FwcGx5QXJncyA9IFt7ZGF0YTogeydfX3NjaGVkdWxlcl90aWNrX18nOiB0cnVlfX1dO1xuICBwcml2YXRlIHJlYWRvbmx5IHN1YnNjcmlwdGlvbnMgPSBuZXcgU3Vic2NyaXB0aW9uKCk7XG5cbiAgcHJpdmF0ZSBjYW5jZWxTY2hlZHVsZWRDYWxsYmFjazogbnVsbCB8ICgoKSA9PiB2b2lkKSA9IG51bGw7XG4gIHByaXZhdGUgc2hvdWxkUmVmcmVzaFZpZXdzID0gZmFsc2U7XG4gIHByaXZhdGUgcGVuZGluZ1JlbmRlclRhc2tJZDogbnVtYmVyIHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgdXNlTWljcm90YXNrU2NoZWR1bGVyID0gZmFsc2U7XG4gIHJ1bm5pbmdUaWNrID0gZmFsc2U7XG5cbiAgY29uc3RydWN0b3IoKSB7XG4gICAgdGhpcy5zdWJzY3JpcHRpb25zLmFkZChcbiAgICAgIHRoaXMuYXBwUmVmLmFmdGVyVGljay5zdWJzY3JpYmUoKCkgPT4ge1xuICAgICAgICAvLyBJZiB0aGUgc2NoZWR1bGVyIGlzbid0IHJ1bm5pbmcgYSB0aWNrIGJ1dCB0aGUgYXBwbGljYXRpb24gdGlja2VkLCB0aGF0IG1lYW5zXG4gICAgICAgIC8vIHNvbWVvbmUgY2FsbGVkIEFwcGxpY2F0aW9uUmVmLnRpY2sgbWFudWFsbHkuIEluIHRoaXMgY2FzZSwgd2Ugc2hvdWxkIGNhbmNlbFxuICAgICAgICAvLyBhbnkgY2hhbmdlIGRldGVjdGlvbnMgdGhhdCBoYWQgYmVlbiBzY2hlZHVsZWQgc28gd2UgZG9uJ3QgcnVuIGFuIGV4dHJhIG9uZS5cbiAgICAgICAgaWYgKCF0aGlzLnJ1bm5pbmdUaWNrKSB7XG4gICAgICAgICAgdGhpcy5jbGVhbnVwKCk7XG4gICAgICAgIH1cbiAgICAgIH0pLFxuICAgICk7XG4gICAgdGhpcy5zdWJzY3JpcHRpb25zLmFkZChcbiAgICAgIHRoaXMubmdab25lLm9uVW5zdGFibGUuc3Vic2NyaWJlKCgpID0+IHtcbiAgICAgICAgLy8gSWYgdGhlIHpvbmUgYmVjb21lcyB1bnN0YWJsZSB3aGVuIHdlJ3JlIG5vdCBydW5uaW5nIHRpY2sgKHRoaXMgaGFwcGVucyBmcm9tIHRoZSB6b25lLnJ1biksXG4gICAgICAgIC8vIHdlIHNob3VsZCBjYW5jZWwgYW55IHNjaGVkdWxlZCBjaGFuZ2UgZGV0ZWN0aW9uIGhlcmUgYmVjYXVzZSBhdCB0aGlzIHBvaW50IHdlXG4gICAgICAgIC8vIGtub3cgdGhhdCB0aGUgem9uZSB3aWxsIHN0YWJpbGl6ZSBhdCBzb21lIHBvaW50IGFuZCBydW4gY2hhbmdlIGRldGVjdGlvbiBpdHNlbGYuXG4gICAgICAgIGlmICghdGhpcy5ydW5uaW5nVGljaykge1xuICAgICAgICAgIHRoaXMuY2xlYW51cCgpO1xuICAgICAgICB9XG4gICAgICB9KSxcbiAgICApO1xuXG4gICAgLy8gVE9ETyhhdHNjb3R0KTogVGhlc2UgY29uZGl0aW9ucyB3aWxsIG5lZWQgdG8gY2hhbmdlIHdoZW4gem9uZWxlc3MgaXMgdGhlIGRlZmF1bHRcbiAgICAvLyBJbnN0ZWFkLCB0aGV5IHNob3VsZCBmbGlwIHRvIGNoZWNraW5nIGlmIFpvbmVKUyBzY2hlZHVsaW5nIGlzIHByb3ZpZGVkXG4gICAgdGhpcy5kaXNhYmxlU2NoZWR1bGluZyB8fD1cbiAgICAgICF0aGlzLnpvbmVsZXNzRW5hYmxlZCAmJlxuICAgICAgLy8gTm9vcE5nWm9uZSB3aXRob3V0IGVuYWJsaW5nIHpvbmVsZXNzIG1lYW5zIG5vIHNjaGVkdWxpbmcgd2hhdHNvZXZlclxuICAgICAgKHRoaXMubmdab25lIGluc3RhbmNlb2YgTm9vcE5nWm9uZSB8fFxuICAgICAgICAvLyBUaGUgc2FtZSBnb2VzIGZvciB0aGUgbGFjayBvZiBab25lIHdpdGhvdXQgZW5hYmxpbmcgem9uZWxlc3Mgc2NoZWR1bGluZ1xuICAgICAgICAhdGhpcy56b25lSXNEZWZpbmVkKTtcbiAgfVxuXG4gIG5vdGlmeShzb3VyY2U6IE5vdGlmaWNhdGlvblNvdXJjZSk6IHZvaWQge1xuICAgIGlmICghdGhpcy56b25lbGVzc0VuYWJsZWQgJiYgc291cmNlID09PSBOb3RpZmljYXRpb25Tb3VyY2UuTGlzdGVuZXIpIHtcbiAgICAgIC8vIFdoZW4gdGhlIG5vdGlmaWNhdGlvbiBjb21lcyBmcm9tIGEgbGlzdGVuZXIsIHdlIHNraXAgdGhlIG5vdGlmaWNhdGlvbiB1bmxlc3MgdGhlXG4gICAgICAvLyBhcHBsaWNhdGlvbiBoYXMgZW5hYmxlZCB6b25lbGVzcy4gSWRlYWxseSwgbGlzdGVuZXJzIHdvdWxkbid0IG5vdGlmeSB0aGUgc2NoZWR1bGVyIGF0IGFsbFxuICAgICAgLy8gYXV0b21hdGljYWxseS4gV2UgZG8gbm90IGtub3cgdGhhdCBhIGRldmVsb3BlciBtYWRlIGEgY2hhbmdlIGluIHRoZSBsaXN0ZW5lciBjYWxsYmFjayB0aGF0XG4gICAgICAvLyByZXF1aXJlcyBhbiBgQXBwbGljYXRpb25SZWYudGlja2AgKHN5bmNocm9uaXplIHRlbXBsYXRlcyAvIHJ1biByZW5kZXIgaG9va3MpLiBXZSBkbyB0aGlzXG4gICAgICAvLyBvbmx5IGZvciBhbiBlYXNpZXIgbWlncmF0aW9uIGZyb20gT25QdXNoIGNvbXBvbmVudHMgdG8gem9uZWxlc3MuIEJlY2F1c2UgbGlzdGVuZXJzIGFyZVxuICAgICAgLy8gdXN1YWxseSBleGVjdXRlZCBpbnNpZGUgdGhlIEFuZ3VsYXIgem9uZSBhbmQgbGlzdGVuZXJzIGF1dG9tYXRpY2FsbHkgY2FsbCBgbWFya1ZpZXdEaXJ0eWAsXG4gICAgICAvLyBkZXZlbG9wZXJzIG5ldmVyIG5lZWRlZCB0byBtYW51YWxseSB1c2UgYENoYW5nZURldGVjdG9yUmVmLm1hcmtGb3JDaGVja2Agb3Igc29tZSBvdGhlciBBUElcbiAgICAgIC8vIHRvIG1ha2UgbGlzdGVuZXIgY2FsbGJhY2tzIHdvcmsgY29ycmVjdGx5IHdpdGggYE9uUHVzaGAgY29tcG9uZW50cy5cbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgc3dpdGNoIChzb3VyY2UpIHtcbiAgICAgIGNhc2UgTm90aWZpY2F0aW9uU291cmNlLkRlYnVnQXBwbHlDaGFuZ2VzOlxuICAgICAgY2FzZSBOb3RpZmljYXRpb25Tb3VyY2UuRGVmZXJCbG9ja1N0YXRlVXBkYXRlOlxuICAgICAgY2FzZSBOb3RpZmljYXRpb25Tb3VyY2UuTWFya0FuY2VzdG9yc0ZvclRyYXZlcnNhbDpcbiAgICAgIGNhc2UgTm90aWZpY2F0aW9uU291cmNlLk1hcmtGb3JDaGVjazpcbiAgICAgIGNhc2UgTm90aWZpY2F0aW9uU291cmNlLkxpc3RlbmVyOlxuICAgICAgY2FzZSBOb3RpZmljYXRpb25Tb3VyY2UuQW5pbWF0aW9uUXVldWVkTm9kZVJlbW92YWw6XG4gICAgICBjYXNlIE5vdGlmaWNhdGlvblNvdXJjZS5TZXRJbnB1dDoge1xuICAgICAgICB0aGlzLnNob3VsZFJlZnJlc2hWaWV3cyA9IHRydWU7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgY2FzZSBOb3RpZmljYXRpb25Tb3VyY2UuVmlld0RldGFjaGVkRnJvbURPTTpcbiAgICAgIGNhc2UgTm90aWZpY2F0aW9uU291cmNlLlZpZXdBdHRhY2hlZDpcbiAgICAgIGNhc2UgTm90aWZpY2F0aW9uU291cmNlLk5ld1JlbmRlckhvb2s6XG4gICAgICBjYXNlIE5vdGlmaWNhdGlvblNvdXJjZS5Bc3luY0FuaW1hdGlvbnNMb2FkZWQ6XG4gICAgICBkZWZhdWx0OiB7XG4gICAgICAgIC8vIFRoZXNlIG5vdGlmaWNhdGlvbnMgb25seSBzY2hlZHVsZSBhIHRpY2sgYnV0IGRvIG5vdCBjaGFuZ2Ugd2hldGhlciB3ZSBzaG91bGQgcmVmcmVzaFxuICAgICAgICAvLyB2aWV3cy4gSW5zdGVhZCwgd2Ugb25seSBuZWVkIHRvIHJ1biByZW5kZXIgaG9va3MgdW5sZXNzIGFub3RoZXIgbm90aWZpY2F0aW9uIGZyb20gdGhlXG4gICAgICAgIC8vIG90aGVyIHNldCBpcyBhbHNvIHJlY2VpdmVkIGJlZm9yZSBgdGlja2AgaGFwcGVucy5cbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoIXRoaXMuc2hvdWxkU2NoZWR1bGVUaWNrKCkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIG5nRGV2TW9kZSA9PT0gJ3VuZGVmaW5lZCcgfHwgbmdEZXZNb2RlKSB7XG4gICAgICBpZiAodGhpcy51c2VNaWNyb3Rhc2tTY2hlZHVsZXIpIHtcbiAgICAgICAgdHJhY2tNaWNyb3Rhc2tOb3RpZmljYXRpb25Gb3JEZWJ1Z2dpbmcoKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnNlY3V0aXZlTWljcm90YXNrTm90aWZpY2F0aW9ucyA9IDA7XG4gICAgICAgIHN0YWNrRnJvbUxhc3RGZXdOb3RpZmljYXRpb25zLmxlbmd0aCA9IDA7XG4gICAgICB9XG4gICAgfVxuXG4gICAgY29uc3Qgc2NoZWR1bGVDYWxsYmFjayA9IHRoaXMudXNlTWljcm90YXNrU2NoZWR1bGVyXG4gICAgICA/IHNjaGVkdWxlQ2FsbGJhY2tXaXRoTWljcm90YXNrXG4gICAgICA6IHNjaGVkdWxlQ2FsbGJhY2tXaXRoUmFmUmFjZTtcbiAgICB0aGlzLnBlbmRpbmdSZW5kZXJUYXNrSWQgPSB0aGlzLnRhc2tTZXJ2aWNlLmFkZCgpO1xuICAgIGlmICh0aGlzLnpvbmVJc0RlZmluZWQpIHtcbiAgICAgIFpvbmUucm9vdC5ydW4oKCkgPT4ge1xuICAgICAgICB0aGlzLmNhbmNlbFNjaGVkdWxlZENhbGxiYWNrID0gc2NoZWR1bGVDYWxsYmFjaygoKSA9PiB7XG4gICAgICAgICAgdGhpcy50aWNrKHRoaXMuc2hvdWxkUmVmcmVzaFZpZXdzKTtcbiAgICAgICAgfSwgZmFsc2UgLyoqIHVzZU5hdGl2ZVRpbWVycyAqLyk7XG4gICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5jYW5jZWxTY2hlZHVsZWRDYWxsYmFjayA9IHNjaGVkdWxlQ2FsbGJhY2soKCkgPT4ge1xuICAgICAgICB0aGlzLnRpY2sodGhpcy5zaG91bGRSZWZyZXNoVmlld3MpO1xuICAgICAgfSwgZmFsc2UgLyoqIHVzZU5hdGl2ZVRpbWVycyAqLyk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBzaG91bGRTY2hlZHVsZVRpY2soKTogYm9vbGVhbiB7XG4gICAgaWYgKHRoaXMuZGlzYWJsZVNjaGVkdWxpbmcpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgLy8gYWxyZWFkeSBzY2hlZHVsZWQgb3IgcnVubmluZ1xuICAgIGlmICh0aGlzLnBlbmRpbmdSZW5kZXJUYXNrSWQgIT09IG51bGwgfHwgdGhpcy5ydW5uaW5nVGljayB8fCB0aGlzLmFwcFJlZi5fcnVubmluZ1RpY2spIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgLy8gSWYgd2UncmUgaW5zaWRlIHRoZSB6b25lIGRvbid0IGJvdGhlciB3aXRoIHNjaGVkdWxlci4gWm9uZSB3aWxsIHN0YWJpbGl6ZVxuICAgIC8vIGV2ZW50dWFsbHkgYW5kIHJ1biBjaGFuZ2UgZGV0ZWN0aW9uLlxuICAgIGlmICh0aGlzLnpvbmVJc0RlZmluZWQgJiYgTmdab25lLmlzSW5Bbmd1bGFyWm9uZSgpKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICAvKipcbiAgICogQ2FsbHMgQXBwbGljYXRpb25SZWYuX3RpY2sgaW5zaWRlIHRoZSBgTmdab25lYC5cbiAgICpcbiAgICogQ2FsbGluZyBgdGlja2AgZGlyZWN0bHkgcnVucyBjaGFuZ2UgZGV0ZWN0aW9uIGFuZCBjYW5jZWxzIGFueSBjaGFuZ2UgZGV0ZWN0aW9uIHRoYXQgaGFkIGJlZW5cbiAgICogc2NoZWR1bGVkIHByZXZpb3VzbHkuXG4gICAqXG4gICAqIEBwYXJhbSBzaG91bGRSZWZyZXNoVmlld3MgUGFzc2VkIGRpcmVjdGx5IHRvIGBBcHBsaWNhdGlvblJlZi5fdGlja2AgYW5kIHNraXBzIHN0cmFpZ2h0IHRvXG4gICAqICAgICByZW5kZXIgaG9va3Mgd2hlbiBgZmFsc2VgLlxuICAgKi9cbiAgcHJpdmF0ZSB0aWNrKHNob3VsZFJlZnJlc2hWaWV3czogYm9vbGVhbik6IHZvaWQge1xuICAgIC8vIFdoZW4gbmdab25lLnJ1biBiZWxvdyBleGl0cywgb25NaWNyb3Rhc2tFbXB0eSBtYXkgZW1pdCBpZiB0aGUgem9uZSBpc1xuICAgIC8vIHN0YWJsZS4gV2Ugd2FudCB0byBwcmV2ZW50IGRvdWJsZSB0aWNraW5nIHNvIHdlIHRyYWNrIHdoZXRoZXIgdGhlIHRpY2sgaXNcbiAgICAvLyBhbHJlYWR5IHJ1bm5pbmcgYW5kIHNraXAgaXQgaWYgc28uXG4gICAgaWYgKHRoaXMucnVubmluZ1RpY2sgfHwgdGhpcy5hcHBSZWYuZGVzdHJveWVkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgdGFzayA9IHRoaXMudGFza1NlcnZpY2UuYWRkKCk7XG4gICAgdHJ5IHtcbiAgICAgIHRoaXMubmdab25lLnJ1bihcbiAgICAgICAgKCkgPT4ge1xuICAgICAgICAgIHRoaXMucnVubmluZ1RpY2sgPSB0cnVlO1xuICAgICAgICAgIHRoaXMuYXBwUmVmLl90aWNrKHNob3VsZFJlZnJlc2hWaWV3cyk7XG4gICAgICAgIH0sXG4gICAgICAgIHVuZGVmaW5lZCxcbiAgICAgICAgdGhpcy5zY2hlZHVsZXJUaWNrQXBwbHlBcmdzLFxuICAgICAgKTtcbiAgICB9IGNhdGNoIChlOiB1bmtub3duKSB7XG4gICAgICB0aGlzLnRhc2tTZXJ2aWNlLnJlbW92ZSh0YXNrKTtcbiAgICAgIHRocm93IGU7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIHRoaXMuY2xlYW51cCgpO1xuICAgIH1cbiAgICAvLyBJZiB3ZSdyZSBub3RpZmllZCBvZiBhIGNoYW5nZSB3aXRoaW4gMSBtaWNyb3Rhc2sgb2YgcnVubmluZyBjaGFuZ2VcbiAgICAvLyBkZXRlY3Rpb24sIHJ1biBhbm90aGVyIHJvdW5kIGluIHRoZSBzYW1lIGV2ZW50IGxvb3AuIFRoaXMgYWxsb3dzIGNvZGVcbiAgICAvLyB3aGljaCB1c2VzIFByb21pc2UucmVzb2x2ZSAoc2VlIE5nTW9kZWwpIHRvIGF2b2lkXG4gICAgLy8gRXhwcmVzc2lvbkNoYW5nZWQuLi5FcnJvciB0byBzdGlsbCBiZSByZWZsZWN0ZWQgaW4gYSBzaW5nbGUgYnJvd3NlclxuICAgIC8vIHBhaW50LCBldmVuIGlmIHRoYXQgc3BhbnMgbXVsdGlwbGUgcm91bmRzIG9mIGNoYW5nZSBkZXRlY3Rpb24uXG4gICAgdGhpcy51c2VNaWNyb3Rhc2tTY2hlZHVsZXIgPSB0cnVlO1xuICAgIHNjaGVkdWxlQ2FsbGJhY2tXaXRoTWljcm90YXNrKCgpID0+IHtcbiAgICAgIHRoaXMudXNlTWljcm90YXNrU2NoZWR1bGVyID0gZmFsc2U7XG4gICAgICB0aGlzLnRhc2tTZXJ2aWNlLnJlbW92ZSh0YXNrKTtcbiAgICB9KTtcbiAgfVxuXG4gIG5nT25EZXN0cm95KCkge1xuICAgIHRoaXMuc3Vic2NyaXB0aW9ucy51bnN1YnNjcmliZSgpO1xuICAgIHRoaXMuY2xlYW51cCgpO1xuICB9XG5cbiAgcHJpdmF0ZSBjbGVhbnVwKCkge1xuICAgIHRoaXMuc2hvdWxkUmVmcmVzaFZpZXdzID0gZmFsc2U7XG4gICAgdGhpcy5ydW5uaW5nVGljayA9IGZhbHNlO1xuICAgIHRoaXMuY2FuY2VsU2NoZWR1bGVkQ2FsbGJhY2s/LigpO1xuICAgIHRoaXMuY2FuY2VsU2NoZWR1bGVkQ2FsbGJhY2sgPSBudWxsO1xuICAgIC8vIElmIHRoaXMgaXMgdGhlIGxhc3QgdGFzaywgdGhlIHNlcnZpY2Ugd2lsbCBzeW5jaHJvbm91c2x5IGVtaXQgYSBzdGFibGVcbiAgICAvLyBub3RpZmljYXRpb24uIElmIHRoZXJlIGlzIGEgc3Vic2NyaWJlciB0aGF0IHRoZW4gYWN0cyBpbiBhIHdheSB0aGF0XG4gICAgLy8gdHJpZXMgdG8gbm90aWZ5IHRoZSBzY2hlZHVsZXIgYWdhaW4sIHdlIG5lZWQgdG8gYmUgYWJsZSB0byByZXNwb25kIHRvXG4gICAgLy8gc2NoZWR1bGUgYSBuZXcgY2hhbmdlIGRldGVjdGlvbi4gVGhlcmVmb3JlLCB3ZSBzaG91bGQgY2xlYXIgdGhlIHRhc2sgSURcbiAgICAvLyBiZWZvcmUgcmVtb3ZpbmcgaXQgZnJvbSB0aGUgcGVuZGluZyB0YXNrcyAob3IgdGhlIHRhc2tzIHNlcnZpY2Ugc2hvdWxkXG4gICAgLy8gbm90IHN5bmNocm9ub3VzbHkgZW1pdCBzdGFibGUsIHNpbWlsYXIgdG8gaG93IFpvbmUgc3RhYmxlbmVzcyBvbmx5XG4gICAgLy8gaGFwcGVucyBpZiBpdCdzIHN0aWxsIHN0YWJsZSBhZnRlciBhIG1pY3JvdGFzaykuXG4gICAgaWYgKHRoaXMucGVuZGluZ1JlbmRlclRhc2tJZCAhPT0gbnVsbCkge1xuICAgICAgY29uc3QgdGFza0lkID0gdGhpcy5wZW5kaW5nUmVuZGVyVGFza0lkO1xuICAgICAgdGhpcy5wZW5kaW5nUmVuZGVyVGFza0lkID0gbnVsbDtcbiAgICAgIHRoaXMudGFza1NlcnZpY2UucmVtb3ZlKHRhc2tJZCk7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogUHJvdmlkZXMgY2hhbmdlIGRldGVjdGlvbiB3aXRob3V0IFpvbmVKUyBmb3IgdGhlIGFwcGxpY2F0aW9uIGJvb3RzdHJhcHBlZCB1c2luZ1xuICogYGJvb3RzdHJhcEFwcGxpY2F0aW9uYC5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIGFsbG93cyB5b3UgdG8gY29uZmlndXJlIHRoZSBhcHBsaWNhdGlvbiB0byBub3QgdXNlIHRoZSBzdGF0ZS9zdGF0ZSBjaGFuZ2VzIG9mXG4gKiBab25lSlMgdG8gc2NoZWR1bGUgY2hhbmdlIGRldGVjdGlvbiBpbiB0aGUgYXBwbGljYXRpb24uIFRoaXMgd2lsbCB3b3JrIHdoZW4gWm9uZUpTIGlzIG5vdCBwcmVzZW50XG4gKiBvbiB0aGUgcGFnZSBhdCBhbGwgb3IgaWYgaXQgZXhpc3RzIGJlY2F1c2Ugc29tZXRoaW5nIGVsc2UgaXMgdXNpbmcgaXQgKGVpdGhlciBhbm90aGVyIEFuZ3VsYXJcbiAqIGFwcGxpY2F0aW9uIHdoaWNoIHVzZXMgWm9uZUpTIGZvciBzY2hlZHVsaW5nIG9yIHNvbWUgb3RoZXIgbGlicmFyeSB0aGF0IHJlbGllcyBvbiBab25lSlMpLlxuICpcbiAqIFRoaXMgY2FuIGFsc28gYmUgYWRkZWQgdG8gdGhlIGBUZXN0QmVkYCBwcm92aWRlcnMgdG8gY29uZmlndXJlIHRoZSB0ZXN0IGVudmlyb25tZW50IHRvIG1vcmVcbiAqIGNsb3NlbHkgbWF0Y2ggcHJvZHVjdGlvbiBiZWhhdmlvci4gVGhpcyB3aWxsIGhlbHAgZ2l2ZSBoaWdoZXIgY29uZmlkZW5jZSB0aGF0IGNvbXBvbmVudHMgYXJlXG4gKiBjb21wYXRpYmxlIHdpdGggem9uZWxlc3MgY2hhbmdlIGRldGVjdGlvbi5cbiAqXG4gKiBab25lSlMgdXNlcyBicm93c2VyIGV2ZW50cyB0byB0cmlnZ2VyIGNoYW5nZSBkZXRlY3Rpb24uIFdoZW4gdXNpbmcgdGhpcyBwcm92aWRlciwgQW5ndWxhciB3aWxsXG4gKiBpbnN0ZWFkIHVzZSBBbmd1bGFyIEFQSXMgdG8gc2NoZWR1bGUgY2hhbmdlIGRldGVjdGlvbi4gVGhlc2UgQVBJcyBpbmNsdWRlOlxuICpcbiAqIC0gYENoYW5nZURldGVjdG9yUmVmLm1hcmtGb3JDaGVja2BcbiAqIC0gYENvbXBvbmVudFJlZi5zZXRJbnB1dGBcbiAqIC0gdXBkYXRpbmcgYSBzaWduYWwgdGhhdCBpcyByZWFkIGluIGEgdGVtcGxhdGVcbiAqIC0gd2hlbiBib3VuZCBob3N0IG9yIHRlbXBsYXRlIGxpc3RlbmVycyBhcmUgdHJpZ2dlcmVkXG4gKiAtIGF0dGFjaGluZyBhIHZpZXcgdGhhdCB3YXMgbWFya2VkIGRpcnR5IGJ5IG9uZSBvZiB0aGUgYWJvdmVcbiAqIC0gcmVtb3ZpbmcgYSB2aWV3XG4gKiAtIHJlZ2lzdGVyaW5nIGEgcmVuZGVyIGhvb2sgKHRlbXBsYXRlcyBhcmUgb25seSByZWZyZXNoZWQgaWYgcmVuZGVyIGhvb2tzIGRvIG9uZSBvZiB0aGUgYWJvdmUpXG4gKlxuICogQHVzYWdlTm90ZXNcbiAqIGBgYHR5cGVzY3JpcHRcbiAqIGJvb3RzdHJhcEFwcGxpY2F0aW9uKE15QXBwLCB7cHJvdmlkZXJzOiBbXG4gKiAgIHByb3ZpZGVFeHBlcmltZW50YWxab25lbGVzc0NoYW5nZURldGVjdGlvbigpLFxuICogXX0pO1xuICogYGBgXG4gKlxuICogVGhpcyBBUEkgaXMgZXhwZXJpbWVudGFsLiBOZWl0aGVyIHRoZSBzaGFwZSwgbm9yIHRoZSB1bmRlcmx5aW5nIGJlaGF2aW9yIGlzIHN0YWJsZSBhbmQgY2FuIGNoYW5nZVxuICogaW4gcGF0Y2ggdmVyc2lvbnMuIFRoZXJlIGFyZSBrbm93biBmZWF0dXJlIGdhcHMgYW5kIEFQSSBlcmdvbm9taWMgY29uc2lkZXJhdGlvbnMuIFdlIHdpbGwgaXRlcmF0ZVxuICogb24gdGhlIGV4YWN0IEFQSSBiYXNlZCBvbiB0aGUgZmVlZGJhY2sgYW5kIG91ciB1bmRlcnN0YW5kaW5nIG9mIHRoZSBwcm9ibGVtIGFuZCBzb2x1dGlvbiBzcGFjZS5cbiAqXG4gKiBAcHVibGljQXBpXG4gKiBAZXhwZXJpbWVudGFsXG4gKiBAc2VlIHtAbGluayBib290c3RyYXBBcHBsaWNhdGlvbn1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHByb3ZpZGVFeHBlcmltZW50YWxab25lbGVzc0NoYW5nZURldGVjdGlvbigpOiBFbnZpcm9ubWVudFByb3ZpZGVycyB7XG4gIHBlcmZvcm1hbmNlTWFya0ZlYXR1cmUoJ05nWm9uZWxlc3MnKTtcbiAgcmV0dXJuIG1ha2VFbnZpcm9ubWVudFByb3ZpZGVycyhbXG4gICAge3Byb3ZpZGU6IENoYW5nZURldGVjdGlvblNjaGVkdWxlciwgdXNlRXhpc3Rpbmc6IENoYW5nZURldGVjdGlvblNjaGVkdWxlckltcGx9LFxuICAgIHtwcm92aWRlOiBOZ1pvbmUsIHVzZUNsYXNzOiBOb29wTmdab25lfSxcbiAgICB7cHJvdmlkZTogWk9ORUxFU1NfRU5BQkxFRCwgdXNlVmFsdWU6IHRydWV9LFxuICBdKTtcbn1cbiJdfQ==