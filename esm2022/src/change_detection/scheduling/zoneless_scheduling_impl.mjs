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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiem9uZWxlc3Nfc2NoZWR1bGluZ19pbXBsLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvY2hhbmdlX2RldGVjdGlvbi9zY2hlZHVsaW5nL3pvbmVsZXNzX3NjaGVkdWxpbmdfaW1wbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0sbUNBQW1DLENBQUM7QUFDakUsT0FBTyxFQUFDLFVBQVUsRUFBQyxNQUFNLHFCQUFxQixDQUFDO0FBQy9DLE9BQU8sRUFBQyxNQUFNLEVBQUMsTUFBTSxpQ0FBaUMsQ0FBQztBQUV2RCxPQUFPLEVBQUMsd0JBQXdCLEVBQUMsTUFBTSw4QkFBOEIsQ0FBQztBQUN0RSxPQUFPLEVBQUMsWUFBWSxFQUFtQixNQUFNLGNBQWMsQ0FBQztBQUM1RCxPQUFPLEVBQUMsWUFBWSxFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFDakQsT0FBTyxFQUFDLDZCQUE2QixFQUFFLDJCQUEyQixFQUFDLE1BQU0sK0JBQStCLENBQUM7QUFDekcsT0FBTyxFQUFDLHNCQUFzQixFQUFDLE1BQU0sd0JBQXdCLENBQUM7QUFDOUQsT0FBTyxFQUFDLE1BQU0sRUFBRSxVQUFVLEVBQUMsTUFBTSxvQkFBb0IsQ0FBQztBQUV0RCxPQUFPLEVBQUMsd0JBQXdCLEVBQXNCLGdCQUFnQixFQUFFLDJCQUEyQixFQUFDLE1BQU0sdUJBQXVCLENBQUM7O0FBRWxJLE1BQU0sd0NBQXdDLEdBQUcsR0FBRyxDQUFDO0FBQ3JELElBQUksaUNBQWlDLEdBQUcsQ0FBQyxDQUFDO0FBQzFDLElBQUksNkJBQTZCLEdBQWEsRUFBRSxDQUFDO0FBRWpELFNBQVMsc0NBQXNDO0lBQzdDLGlDQUFpQyxFQUFFLENBQUM7SUFDcEMsSUFBSSx3Q0FBd0MsR0FBRyxpQ0FBaUMsR0FBRyxDQUFDLEVBQUUsQ0FBQztRQUNyRixNQUFN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QUE0QjtjQUR4QyxVQUFVO2VBQUMsRUFBQyxVQUFVLEVBQUUsTUFBTSxFQUFDOztBQW9MaEM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBc0NHO0FBQ0gsTUFBTSxVQUFVLDBDQUEwQztJQUN4RCxzQkFBc0IsQ0FBQyxZQUFZLENBQUMsQ0FBQztJQUNyQyxPQUFPLHdCQUF3QixDQUFDO1FBQzlCLEVBQUMsT0FBTyxFQUFFLHdCQUF3QixFQUFFLFdBQVcsRUFBRSw0QkFBNEIsRUFBQztRQUM5RSxFQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsUUFBUSxFQUFFLFVBQVUsRUFBQztRQUN2QyxFQUFDLE9BQU8sRUFBRSxnQkFBZ0IsRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFDO0tBQzVDLENBQUMsQ0FBQztBQUNMLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtBcHBsaWNhdGlvblJlZn0gZnJvbSAnLi4vLi4vYXBwbGljYXRpb24vYXBwbGljYXRpb25fcmVmJztcbmltcG9ydCB7SW5qZWN0YWJsZX0gZnJvbSAnLi4vLi4vZGkvaW5qZWN0YWJsZSc7XG5pbXBvcnQge2luamVjdH0gZnJvbSAnLi4vLi4vZGkvaW5qZWN0b3JfY29tcGF0aWJpbGl0eSc7XG5pbXBvcnQge0Vudmlyb25tZW50UHJvdmlkZXJzfSBmcm9tICcuLi8uLi9kaS9pbnRlcmZhY2UvcHJvdmlkZXInO1xuaW1wb3J0IHttYWtlRW52aXJvbm1lbnRQcm92aWRlcnN9IGZyb20gJy4uLy4uL2RpL3Byb3ZpZGVyX2NvbGxlY3Rpb24nO1xuaW1wb3J0IHtSdW50aW1lRXJyb3IsIFJ1bnRpbWVFcnJvckNvZGV9IGZyb20gJy4uLy4uL2Vycm9ycyc7XG5pbXBvcnQge1BlbmRpbmdUYXNrc30gZnJvbSAnLi4vLi4vcGVuZGluZ190YXNrcyc7XG5pbXBvcnQge3NjaGVkdWxlQ2FsbGJhY2tXaXRoTWljcm90YXNrLCBzY2hlZHVsZUNhbGxiYWNrV2l0aFJhZlJhY2V9IGZyb20gJy4uLy4uL3V0aWwvY2FsbGJhY2tfc2NoZWR1bGVyJztcbmltcG9ydCB7cGVyZm9ybWFuY2VNYXJrRmVhdHVyZX0gZnJvbSAnLi4vLi4vdXRpbC9wZXJmb3JtYW5jZSc7XG5pbXBvcnQge05nWm9uZSwgTm9vcE5nWm9uZX0gZnJvbSAnLi4vLi4vem9uZS9uZ196b25lJztcblxuaW1wb3J0IHtDaGFuZ2VEZXRlY3Rpb25TY2hlZHVsZXIsIE5vdGlmaWNhdGlvblNvdXJjZSwgWk9ORUxFU1NfRU5BQkxFRCwgWk9ORUxFU1NfU0NIRURVTEVSX0RJU0FCTEVEfSBmcm9tICcuL3pvbmVsZXNzX3NjaGVkdWxpbmcnO1xuXG5jb25zdCBDT05TRUNVVElWRV9NSUNST1RBU0tfTk9USUZJQ0FUSU9OX0xJTUlUID0gMTAwO1xubGV0IGNvbnNlY3V0aXZlTWljcm90YXNrTm90aWZpY2F0aW9ucyA9IDA7XG5sZXQgc3RhY2tGcm9tTGFzdEZld05vdGlmaWNhdGlvbnM6IHN0cmluZ1tdID0gW107XG5cbmZ1bmN0aW9uIHRyYWNrTWljcm90YXNrTm90aWZpY2F0aW9uRm9yRGVidWdnaW5nKCkge1xuICBjb25zZWN1dGl2ZU1pY3JvdGFza05vdGlmaWNhdGlvbnMrKztcbiAgaWYgKENPTlNFQ1VUSVZFX01JQ1JPVEFTS19OT1RJRklDQVRJT05fTElNSVQgLSBjb25zZWN1dGl2ZU1pY3JvdGFza05vdGlmaWNhdGlvbnMgPCA1KSB7XG4gICAgY29uc3Qgc3RhY2sgPSBuZXcgRXJyb3IoKS5zdGFjaztcbiAgICBpZiAoc3RhY2spIHtcbiAgICAgIHN0YWNrRnJvbUxhc3RGZXdOb3RpZmljYXRpb25zLnB1c2goc3RhY2spO1xuICAgIH1cbiAgfVxuXG4gIGlmIChjb25zZWN1dGl2ZU1pY3JvdGFza05vdGlmaWNhdGlvbnMgPT09IENPTlNFQ1VUSVZFX01JQ1JPVEFTS19OT1RJRklDQVRJT05fTElNSVQpIHtcbiAgICB0aHJvdyBuZXcgUnVudGltZUVycm9yKFxuICAgICAgICBSdW50aW1lRXJyb3JDb2RlLklORklOSVRFX0NIQU5HRV9ERVRFQ1RJT04sXG4gICAgICAgICdBbmd1bGFyIGNvdWxkIG5vdCBzdGFiaWxpemUgYmVjYXVzZSB0aGVyZSB3ZXJlIGVuZGxlc3MgY2hhbmdlIG5vdGlmaWNhdGlvbnMgd2l0aGluIHRoZSBicm93c2VyIGV2ZW50IGxvb3AuICcgK1xuICAgICAgICAgICAgJ1RoZSBzdGFjayBmcm9tIHRoZSBsYXN0IHNldmVyYWwgbm90aWZpY2F0aW9uczogXFxuJyArXG4gICAgICAgICAgICBzdGFja0Zyb21MYXN0RmV3Tm90aWZpY2F0aW9ucy5qb2luKCdcXG4nKSk7XG4gIH1cbn1cblxuQEluamVjdGFibGUoe3Byb3ZpZGVkSW46ICdyb290J30pXG5leHBvcnQgY2xhc3MgQ2hhbmdlRGV0ZWN0aW9uU2NoZWR1bGVySW1wbCBpbXBsZW1lbnRzIENoYW5nZURldGVjdGlvblNjaGVkdWxlciB7XG4gIHByaXZhdGUgYXBwUmVmID0gaW5qZWN0KEFwcGxpY2F0aW9uUmVmKTtcbiAgcHJpdmF0ZSB0YXNrU2VydmljZSA9IGluamVjdChQZW5kaW5nVGFza3MpO1xuICBwcml2YXRlIHBlbmRpbmdSZW5kZXJUYXNrSWQ6IG51bWJlcnxudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBzaG91bGRSZWZyZXNoVmlld3MgPSBmYWxzZTtcbiAgcHJpdmF0ZSByZWFkb25seSBuZ1pvbmUgPSBpbmplY3QoTmdab25lKTtcbiAgcnVubmluZ1RpY2sgPSBmYWxzZTtcbiAgcHJpdmF0ZSBjYW5jZWxTY2hlZHVsZWRDYWxsYmFjazogbnVsbHwoKCkgPT4gdm9pZCkgPSBudWxsO1xuICBwcml2YXRlIHJlYWRvbmx5IHpvbmVsZXNzRW5hYmxlZCA9IGluamVjdChaT05FTEVTU19FTkFCTEVEKTtcbiAgcHJpdmF0ZSByZWFkb25seSBkaXNhYmxlU2NoZWR1bGluZyA9XG4gICAgICBpbmplY3QoWk9ORUxFU1NfU0NIRURVTEVSX0RJU0FCTEVELCB7b3B0aW9uYWw6IHRydWV9KSA/PyBmYWxzZTtcbiAgcHJpdmF0ZSByZWFkb25seSB6b25lSXNEZWZpbmVkID0gdHlwZW9mIFpvbmUgIT09ICd1bmRlZmluZWQnICYmICEhWm9uZS5yb290LnJ1bjtcbiAgcHJpdmF0ZSByZWFkb25seSBzY2hlZHVsZXJUaWNrQXBwbHlBcmdzID0gW3tkYXRhOiB7J19fc2NoZWR1bGVyX3RpY2tfXyc6IHRydWV9fV07XG4gIHByaXZhdGUgcmVhZG9ubHkgYWZ0ZXJUaWNrU3Vic2NyaXB0aW9uID0gdGhpcy5hcHBSZWYuYWZ0ZXJUaWNrLnN1YnNjcmliZSgoKSA9PiB7XG4gICAgLy8gSWYgdGhlIHNjaGVkdWxlciBpc24ndCBydW5uaW5nIGEgdGljayBidXQgdGhlIGFwcGxpY2F0aW9uIHRpY2tlZCwgdGhhdCBtZWFuc1xuICAgIC8vIHNvbWVvbmUgY2FsbGVkIEFwcGxpY2F0aW9uUmVmLnRpY2sgbWFudWFsbHkuIEluIHRoaXMgY2FzZSwgd2Ugc2hvdWxkIGNhbmNlbFxuICAgIC8vIGFueSBjaGFuZ2UgZGV0ZWN0aW9ucyB0aGF0IGhhZCBiZWVuIHNjaGVkdWxlZCBzbyB3ZSBkb24ndCBydW4gYW4gZXh0cmEgb25lLlxuICAgIGlmICghdGhpcy5ydW5uaW5nVGljaykge1xuICAgICAgdGhpcy5jbGVhbnVwKCk7XG4gICAgfVxuICB9KTtcbiAgcHJpdmF0ZSB1c2VNaWNyb3Rhc2tTY2hlZHVsZXIgPSBmYWxzZTtcblxuICBjb25zdHJ1Y3RvcigpIHtcbiAgICAvLyBUT0RPKGF0c2NvdHQpOiBUaGVzZSBjb25kaXRpb25zIHdpbGwgbmVlZCB0byBjaGFuZ2Ugd2hlbiB6b25lbGVzcyBpcyB0aGUgZGVmYXVsdFxuICAgIC8vIEluc3RlYWQsIHRoZXkgc2hvdWxkIGZsaXAgdG8gY2hlY2tpbmcgaWYgWm9uZUpTIHNjaGVkdWxpbmcgaXMgcHJvdmlkZWRcbiAgICB0aGlzLmRpc2FibGVTY2hlZHVsaW5nIHx8PSAhdGhpcy56b25lbGVzc0VuYWJsZWQgJiZcbiAgICAgICAgLy8gTm9vcE5nWm9uZSB3aXRob3V0IGVuYWJsaW5nIHpvbmVsZXNzIG1lYW5zIG5vIHNjaGVkdWxpbmcgd2hhdHNvZXZlclxuICAgICAgICAodGhpcy5uZ1pvbmUgaW5zdGFuY2VvZiBOb29wTmdab25lIHx8XG4gICAgICAgICAvLyBUaGUgc2FtZSBnb2VzIGZvciB0aGUgbGFjayBvZiBab25lIHdpdGhvdXQgZW5hYmxpbmcgem9uZWxlc3Mgc2NoZWR1bGluZ1xuICAgICAgICAgIXRoaXMuem9uZUlzRGVmaW5lZCk7XG4gIH1cblxuICBub3RpZnkoc291cmNlOiBOb3RpZmljYXRpb25Tb3VyY2UpOiB2b2lkIHtcbiAgICBpZiAoIXRoaXMuem9uZWxlc3NFbmFibGVkICYmIHNvdXJjZSA9PT0gTm90aWZpY2F0aW9uU291cmNlLkxpc3RlbmVyKSB7XG4gICAgICAvLyBXaGVuIHRoZSBub3RpZmljYXRpb24gY29tZXMgZnJvbSBhIGxpc3RlbmVyLCB3ZSBza2lwIHRoZSBub3RpZmljYXRpb24gdW5sZXNzIHRoZVxuICAgICAgLy8gYXBwbGljYXRpb24gaGFzIGVuYWJsZWQgem9uZWxlc3MuIElkZWFsbHksIGxpc3RlbmVycyB3b3VsZG4ndCBub3RpZnkgdGhlIHNjaGVkdWxlciBhdCBhbGxcbiAgICAgIC8vIGF1dG9tYXRpY2FsbHkuIFdlIGRvIG5vdCBrbm93IHRoYXQgYSBkZXZlbG9wZXIgbWFkZSBhIGNoYW5nZSBpbiB0aGUgbGlzdGVuZXIgY2FsbGJhY2sgdGhhdFxuICAgICAgLy8gcmVxdWlyZXMgYW4gYEFwcGxpY2F0aW9uUmVmLnRpY2tgIChzeW5jaHJvbml6ZSB0ZW1wbGF0ZXMgLyBydW4gcmVuZGVyIGhvb2tzKS4gV2UgZG8gdGhpc1xuICAgICAgLy8gb25seSBmb3IgYW4gZWFzaWVyIG1pZ3JhdGlvbiBmcm9tIE9uUHVzaCBjb21wb25lbnRzIHRvIHpvbmVsZXNzLiBCZWNhdXNlIGxpc3RlbmVycyBhcmVcbiAgICAgIC8vIHVzdWFsbHkgZXhlY3V0ZWQgaW5zaWRlIHRoZSBBbmd1bGFyIHpvbmUgYW5kIGxpc3RlbmVycyBhdXRvbWF0aWNhbGx5IGNhbGwgYG1hcmtWaWV3RGlydHlgLFxuICAgICAgLy8gZGV2ZWxvcGVycyBuZXZlciBuZWVkZWQgdG8gbWFudWFsbHkgdXNlIGBDaGFuZ2VEZXRlY3RvclJlZi5tYXJrRm9yQ2hlY2tgIG9yIHNvbWUgb3RoZXIgQVBJXG4gICAgICAvLyB0byBtYWtlIGxpc3RlbmVyIGNhbGxiYWNrcyB3b3JrIGNvcnJlY3RseSB3aXRoIGBPblB1c2hgIGNvbXBvbmVudHMuXG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHN3aXRjaCAoc291cmNlKSB7XG4gICAgICBjYXNlIE5vdGlmaWNhdGlvblNvdXJjZS5EZWJ1Z0FwcGx5Q2hhbmdlczpcbiAgICAgIGNhc2UgTm90aWZpY2F0aW9uU291cmNlLkRlZmVyQmxvY2tTdGF0ZVVwZGF0ZTpcbiAgICAgIGNhc2UgTm90aWZpY2F0aW9uU291cmNlLk1hcmtBbmNlc3RvcnNGb3JUcmF2ZXJzYWw6XG4gICAgICBjYXNlIE5vdGlmaWNhdGlvblNvdXJjZS5NYXJrRm9yQ2hlY2s6XG4gICAgICBjYXNlIE5vdGlmaWNhdGlvblNvdXJjZS5MaXN0ZW5lcjpcbiAgICAgIGNhc2UgTm90aWZpY2F0aW9uU291cmNlLlNldElucHV0OiB7XG4gICAgICAgIHRoaXMuc2hvdWxkUmVmcmVzaFZpZXdzID0gdHJ1ZTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBjYXNlIE5vdGlmaWNhdGlvblNvdXJjZS5WaWV3RGV0YWNoZWRGcm9tRE9NOlxuICAgICAgY2FzZSBOb3RpZmljYXRpb25Tb3VyY2UuVmlld0F0dGFjaGVkOlxuICAgICAgY2FzZSBOb3RpZmljYXRpb25Tb3VyY2UuTmV3UmVuZGVySG9vazpcbiAgICAgIGNhc2UgTm90aWZpY2F0aW9uU291cmNlLkFzeW5jQW5pbWF0aW9uc0xvYWRlZDpcbiAgICAgIGRlZmF1bHQ6IHtcbiAgICAgICAgLy8gVGhlc2Ugbm90aWZpY2F0aW9ucyBvbmx5IHNjaGVkdWxlIGEgdGljayBidXQgZG8gbm90IGNoYW5nZSB3aGV0aGVyIHdlIHNob3VsZCByZWZyZXNoXG4gICAgICAgIC8vIHZpZXdzLiBJbnN0ZWFkLCB3ZSBvbmx5IG5lZWQgdG8gcnVuIHJlbmRlciBob29rcyB1bmxlc3MgYW5vdGhlciBub3RpZmljYXRpb24gZnJvbSB0aGVcbiAgICAgICAgLy8gb3RoZXIgc2V0IGlzIGFsc28gcmVjZWl2ZWQgYmVmb3JlIGB0aWNrYCBoYXBwZW5zLlxuICAgICAgfVxuICAgIH1cblxuICAgIGlmICghdGhpcy5zaG91bGRTY2hlZHVsZVRpY2soKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmICgodHlwZW9mIG5nRGV2TW9kZSA9PT0gJ3VuZGVmaW5lZCcgfHwgbmdEZXZNb2RlKSkge1xuICAgICAgaWYgKHRoaXMudXNlTWljcm90YXNrU2NoZWR1bGVyKSB7XG4gICAgICAgIHRyYWNrTWljcm90YXNrTm90aWZpY2F0aW9uRm9yRGVidWdnaW5nKCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zZWN1dGl2ZU1pY3JvdGFza05vdGlmaWNhdGlvbnMgPSAwO1xuICAgICAgICBzdGFja0Zyb21MYXN0RmV3Tm90aWZpY2F0aW9ucy5sZW5ndGggPSAwO1xuICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IHNjaGVkdWxlQ2FsbGJhY2sgPVxuICAgICAgICB0aGlzLnVzZU1pY3JvdGFza1NjaGVkdWxlciA/IHNjaGVkdWxlQ2FsbGJhY2tXaXRoTWljcm90YXNrIDogc2NoZWR1bGVDYWxsYmFja1dpdGhSYWZSYWNlO1xuICAgIHRoaXMucGVuZGluZ1JlbmRlclRhc2tJZCA9IHRoaXMudGFza1NlcnZpY2UuYWRkKCk7XG4gICAgaWYgKHRoaXMuem9uZUlzRGVmaW5lZCkge1xuICAgICAgWm9uZS5yb290LnJ1bigoKSA9PiB7XG4gICAgICAgIHRoaXMuY2FuY2VsU2NoZWR1bGVkQ2FsbGJhY2sgPSBzY2hlZHVsZUNhbGxiYWNrKCgpID0+IHtcbiAgICAgICAgICB0aGlzLnRpY2sodGhpcy5zaG91bGRSZWZyZXNoVmlld3MpO1xuICAgICAgICB9LCBmYWxzZSAvKiogdXNlTmF0aXZlVGltZXJzICovKTtcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmNhbmNlbFNjaGVkdWxlZENhbGxiYWNrID0gc2NoZWR1bGVDYWxsYmFjaygoKSA9PiB7XG4gICAgICAgIHRoaXMudGljayh0aGlzLnNob3VsZFJlZnJlc2hWaWV3cyk7XG4gICAgICB9LCBmYWxzZSAvKiogdXNlTmF0aXZlVGltZXJzICovKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIHNob3VsZFNjaGVkdWxlVGljaygpOiBib29sZWFuIHtcbiAgICBpZiAodGhpcy5kaXNhYmxlU2NoZWR1bGluZykge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICAvLyBhbHJlYWR5IHNjaGVkdWxlZCBvciBydW5uaW5nXG4gICAgaWYgKHRoaXMucGVuZGluZ1JlbmRlclRhc2tJZCAhPT0gbnVsbCB8fCB0aGlzLnJ1bm5pbmdUaWNrIHx8IHRoaXMuYXBwUmVmLl9ydW5uaW5nVGljaykge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICAvLyBJZiB3ZSdyZSBpbnNpZGUgdGhlIHpvbmUgZG9uJ3QgYm90aGVyIHdpdGggc2NoZWR1bGVyLiBab25lIHdpbGwgc3RhYmlsaXplXG4gICAgLy8gZXZlbnR1YWxseSBhbmQgcnVuIGNoYW5nZSBkZXRlY3Rpb24uXG4gICAgaWYgKHRoaXMuem9uZUlzRGVmaW5lZCAmJiBOZ1pvbmUuaXNJbkFuZ3VsYXJab25lKCkpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDYWxscyBBcHBsaWNhdGlvblJlZi5fdGljayBpbnNpZGUgdGhlIGBOZ1pvbmVgLlxuICAgKlxuICAgKiBDYWxsaW5nIGB0aWNrYCBkaXJlY3RseSBydW5zIGNoYW5nZSBkZXRlY3Rpb24gYW5kIGNhbmNlbHMgYW55IGNoYW5nZSBkZXRlY3Rpb24gdGhhdCBoYWQgYmVlblxuICAgKiBzY2hlZHVsZWQgcHJldmlvdXNseS5cbiAgICpcbiAgICogQHBhcmFtIHNob3VsZFJlZnJlc2hWaWV3cyBQYXNzZWQgZGlyZWN0bHkgdG8gYEFwcGxpY2F0aW9uUmVmLl90aWNrYCBhbmQgc2tpcHMgc3RyYWlnaHQgdG9cbiAgICogICAgIHJlbmRlciBob29rcyB3aGVuIGBmYWxzZWAuXG4gICAqL1xuICBwcml2YXRlIHRpY2soc2hvdWxkUmVmcmVzaFZpZXdzOiBib29sZWFuKTogdm9pZCB7XG4gICAgLy8gV2hlbiBuZ1pvbmUucnVuIGJlbG93IGV4aXRzLCBvbk1pY3JvdGFza0VtcHR5IG1heSBlbWl0IGlmIHRoZSB6b25lIGlzXG4gICAgLy8gc3RhYmxlLiBXZSB3YW50IHRvIHByZXZlbnQgZG91YmxlIHRpY2tpbmcgc28gd2UgdHJhY2sgd2hldGhlciB0aGUgdGljayBpc1xuICAgIC8vIGFscmVhZHkgcnVubmluZyBhbmQgc2tpcCBpdCBpZiBzby5cbiAgICBpZiAodGhpcy5ydW5uaW5nVGljayB8fCB0aGlzLmFwcFJlZi5kZXN0cm95ZWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCB0YXNrID0gdGhpcy50YXNrU2VydmljZS5hZGQoKTtcbiAgICB0cnkge1xuICAgICAgdGhpcy5uZ1pvbmUucnVuKCgpID0+IHtcbiAgICAgICAgdGhpcy5ydW5uaW5nVGljayA9IHRydWU7XG4gICAgICAgIHRoaXMuYXBwUmVmLl90aWNrKHNob3VsZFJlZnJlc2hWaWV3cyk7XG4gICAgICB9LCB1bmRlZmluZWQsIHRoaXMuc2NoZWR1bGVyVGlja0FwcGx5QXJncyk7XG4gICAgfSBjYXRjaCAoZTogdW5rbm93bikge1xuICAgICAgdGhpcy50YXNrU2VydmljZS5yZW1vdmUodGFzayk7XG4gICAgICB0aHJvdyBlO1xuICAgIH0gZmluYWxseSB7XG4gICAgICB0aGlzLmNsZWFudXAoKTtcbiAgICB9XG4gICAgLy8gSWYgd2UncmUgbm90aWZpZWQgb2YgYSBjaGFuZ2Ugd2l0aGluIDEgbWljcm90YXNrIG9mIHJ1bm5pbmcgY2hhbmdlXG4gICAgLy8gZGV0ZWN0aW9uLCBydW4gYW5vdGhlciByb3VuZCBpbiB0aGUgc2FtZSBldmVudCBsb29wLiBUaGlzIGFsbG93cyBjb2RlXG4gICAgLy8gd2hpY2ggdXNlcyBQcm9taXNlLnJlc29sdmUgKHNlZSBOZ01vZGVsKSB0byBhdm9pZFxuICAgIC8vIEV4cHJlc3Npb25DaGFuZ2VkLi4uRXJyb3IgdG8gc3RpbGwgYmUgcmVmbGVjdGVkIGluIGEgc2luZ2xlIGJyb3dzZXJcbiAgICAvLyBwYWludCwgZXZlbiBpZiB0aGF0IHNwYW5zIG11bHRpcGxlIHJvdW5kcyBvZiBjaGFuZ2UgZGV0ZWN0aW9uLlxuICAgIHRoaXMudXNlTWljcm90YXNrU2NoZWR1bGVyID0gdHJ1ZTtcbiAgICBzY2hlZHVsZUNhbGxiYWNrV2l0aE1pY3JvdGFzaygoKSA9PiB7XG4gICAgICB0aGlzLnVzZU1pY3JvdGFza1NjaGVkdWxlciA9IGZhbHNlO1xuICAgICAgdGhpcy50YXNrU2VydmljZS5yZW1vdmUodGFzayk7XG4gICAgfSk7XG4gIH1cblxuICBuZ09uRGVzdHJveSgpIHtcbiAgICB0aGlzLmFmdGVyVGlja1N1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xuICAgIHRoaXMuY2xlYW51cCgpO1xuICB9XG5cbiAgcHJpdmF0ZSBjbGVhbnVwKCkge1xuICAgIHRoaXMuc2hvdWxkUmVmcmVzaFZpZXdzID0gZmFsc2U7XG4gICAgdGhpcy5ydW5uaW5nVGljayA9IGZhbHNlO1xuICAgIHRoaXMuY2FuY2VsU2NoZWR1bGVkQ2FsbGJhY2s/LigpO1xuICAgIHRoaXMuY2FuY2VsU2NoZWR1bGVkQ2FsbGJhY2sgPSBudWxsO1xuICAgIC8vIElmIHRoaXMgaXMgdGhlIGxhc3QgdGFzaywgdGhlIHNlcnZpY2Ugd2lsbCBzeW5jaHJvbm91c2x5IGVtaXQgYSBzdGFibGVcbiAgICAvLyBub3RpZmljYXRpb24uIElmIHRoZXJlIGlzIGEgc3Vic2NyaWJlciB0aGF0IHRoZW4gYWN0cyBpbiBhIHdheSB0aGF0XG4gICAgLy8gdHJpZXMgdG8gbm90aWZ5IHRoZSBzY2hlZHVsZXIgYWdhaW4sIHdlIG5lZWQgdG8gYmUgYWJsZSB0byByZXNwb25kIHRvXG4gICAgLy8gc2NoZWR1bGUgYSBuZXcgY2hhbmdlIGRldGVjdGlvbi4gVGhlcmVmb3JlLCB3ZSBzaG91bGQgY2xlYXIgdGhlIHRhc2sgSURcbiAgICAvLyBiZWZvcmUgcmVtb3ZpbmcgaXQgZnJvbSB0aGUgcGVuZGluZyB0YXNrcyAob3IgdGhlIHRhc2tzIHNlcnZpY2Ugc2hvdWxkXG4gICAgLy8gbm90IHN5bmNocm9ub3VzbHkgZW1pdCBzdGFibGUsIHNpbWlsYXIgdG8gaG93IFpvbmUgc3RhYmxlbmVzcyBvbmx5XG4gICAgLy8gaGFwcGVucyBpZiBpdCdzIHN0aWxsIHN0YWJsZSBhZnRlciBhIG1pY3JvdGFzaykuXG4gICAgaWYgKHRoaXMucGVuZGluZ1JlbmRlclRhc2tJZCAhPT0gbnVsbCkge1xuICAgICAgY29uc3QgdGFza0lkID0gdGhpcy5wZW5kaW5nUmVuZGVyVGFza0lkO1xuICAgICAgdGhpcy5wZW5kaW5nUmVuZGVyVGFza0lkID0gbnVsbDtcbiAgICAgIHRoaXMudGFza1NlcnZpY2UucmVtb3ZlKHRhc2tJZCk7XG4gICAgfVxuICB9XG59XG5cblxuLyoqXG4gKiBQcm92aWRlcyBjaGFuZ2UgZGV0ZWN0aW9uIHdpdGhvdXQgWm9uZUpTIGZvciB0aGUgYXBwbGljYXRpb24gYm9vdHN0cmFwcGVkIHVzaW5nXG4gKiBgYm9vdHN0cmFwQXBwbGljYXRpb25gLlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gYWxsb3dzIHlvdSB0byBjb25maWd1cmUgdGhlIGFwcGxpY2F0aW9uIHRvIG5vdCB1c2UgdGhlIHN0YXRlL3N0YXRlIGNoYW5nZXMgb2ZcbiAqIFpvbmVKUyB0byBzY2hlZHVsZSBjaGFuZ2UgZGV0ZWN0aW9uIGluIHRoZSBhcHBsaWNhdGlvbi4gVGhpcyB3aWxsIHdvcmsgd2hlbiBab25lSlMgaXMgbm90IHByZXNlbnRcbiAqIG9uIHRoZSBwYWdlIGF0IGFsbCBvciBpZiBpdCBleGlzdHMgYmVjYXVzZSBzb21ldGhpbmcgZWxzZSBpcyB1c2luZyBpdCAoZWl0aGVyIGFub3RoZXIgQW5ndWxhclxuICogYXBwbGljYXRpb24gd2hpY2ggdXNlcyBab25lSlMgZm9yIHNjaGVkdWxpbmcgb3Igc29tZSBvdGhlciBsaWJyYXJ5IHRoYXQgcmVsaWVzIG9uIFpvbmVKUykuXG4gKlxuICogVGhpcyBjYW4gYWxzbyBiZSBhZGRlZCB0byB0aGUgYFRlc3RCZWRgIHByb3ZpZGVycyB0byBjb25maWd1cmUgdGhlIHRlc3QgZW52aXJvbm1lbnQgdG8gbW9yZVxuICogY2xvc2VseSBtYXRjaCBwcm9kdWN0aW9uIGJlaGF2aW9yLiBUaGlzIHdpbGwgaGVscCBnaXZlIGhpZ2hlciBjb25maWRlbmNlIHRoYXQgY29tcG9uZW50cyBhcmVcbiAqIGNvbXBhdGlibGUgd2l0aCB6b25lbGVzcyBjaGFuZ2UgZGV0ZWN0aW9uLlxuICpcbiAqIFpvbmVKUyB1c2VzIGJyb3dzZXIgZXZlbnRzIHRvIHRyaWdnZXIgY2hhbmdlIGRldGVjdGlvbi4gV2hlbiB1c2luZyB0aGlzIHByb3ZpZGVyLCBBbmd1bGFyIHdpbGxcbiAqIGluc3RlYWQgdXNlIEFuZ3VsYXIgQVBJcyB0byBzY2hlZHVsZSBjaGFuZ2UgZGV0ZWN0aW9uLiBUaGVzZSBBUElzIGluY2x1ZGU6XG4gKlxuICogLSBgQ2hhbmdlRGV0ZWN0b3JSZWYubWFya0ZvckNoZWNrYFxuICogLSBgQ29tcG9uZW50UmVmLnNldElucHV0YFxuICogLSB1cGRhdGluZyBhIHNpZ25hbCB0aGF0IGlzIHJlYWQgaW4gYSB0ZW1wbGF0ZVxuICogLSB3aGVuIGJvdW5kIGhvc3Qgb3IgdGVtcGxhdGUgbGlzdGVuZXJzIGFyZSB0cmlnZ2VyZWRcbiAqIC0gYXR0YWNoaW5nIGEgdmlldyB0aGF0IHdhcyBtYXJrZWQgZGlydHkgYnkgb25lIG9mIHRoZSBhYm92ZVxuICogLSByZW1vdmluZyBhIHZpZXdcbiAqIC0gcmVnaXN0ZXJpbmcgYSByZW5kZXIgaG9vayAodGVtcGxhdGVzIGFyZSBvbmx5IHJlZnJlc2hlZCBpZiByZW5kZXIgaG9va3MgZG8gb25lIG9mIHRoZSBhYm92ZSlcbiAqXG4gKiBAdXNhZ2VOb3Rlc1xuICogYGBgdHlwZXNjcmlwdFxuICogYm9vdHN0cmFwQXBwbGljYXRpb24oTXlBcHAsIHtwcm92aWRlcnM6IFtcbiAqICAgcHJvdmlkZUV4cGVyaW1lbnRhbFpvbmVsZXNzQ2hhbmdlRGV0ZWN0aW9uKCksXG4gKiBdfSk7XG4gKiBgYGBcbiAqXG4gKiBUaGlzIEFQSSBpcyBleHBlcmltZW50YWwuIE5laXRoZXIgdGhlIHNoYXBlLCBub3IgdGhlIHVuZGVybHlpbmcgYmVoYXZpb3IgaXMgc3RhYmxlIGFuZCBjYW4gY2hhbmdlXG4gKiBpbiBwYXRjaCB2ZXJzaW9ucy4gVGhlcmUgYXJlIGtub3duIGZlYXR1cmUgZ2FwcyBhbmQgQVBJIGVyZ29ub21pYyBjb25zaWRlcmF0aW9ucy4gV2Ugd2lsbCBpdGVyYXRlXG4gKiBvbiB0aGUgZXhhY3QgQVBJIGJhc2VkIG9uIHRoZSBmZWVkYmFjayBhbmQgb3VyIHVuZGVyc3RhbmRpbmcgb2YgdGhlIHByb2JsZW0gYW5kIHNvbHV0aW9uIHNwYWNlLlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqIEBleHBlcmltZW50YWxcbiAqIEBzZWUge0BsaW5rIGJvb3RzdHJhcEFwcGxpY2F0aW9ufVxuICovXG5leHBvcnQgZnVuY3Rpb24gcHJvdmlkZUV4cGVyaW1lbnRhbFpvbmVsZXNzQ2hhbmdlRGV0ZWN0aW9uKCk6IEVudmlyb25tZW50UHJvdmlkZXJzIHtcbiAgcGVyZm9ybWFuY2VNYXJrRmVhdHVyZSgnTmdab25lbGVzcycpO1xuICByZXR1cm4gbWFrZUVudmlyb25tZW50UHJvdmlkZXJzKFtcbiAgICB7cHJvdmlkZTogQ2hhbmdlRGV0ZWN0aW9uU2NoZWR1bGVyLCB1c2VFeGlzdGluZzogQ2hhbmdlRGV0ZWN0aW9uU2NoZWR1bGVySW1wbH0sXG4gICAge3Byb3ZpZGU6IE5nWm9uZSwgdXNlQ2xhc3M6IE5vb3BOZ1pvbmV9LFxuICAgIHtwcm92aWRlOiBaT05FTEVTU19FTkFCTEVELCB1c2VWYWx1ZTogdHJ1ZX0sXG4gIF0pO1xufVxuIl19