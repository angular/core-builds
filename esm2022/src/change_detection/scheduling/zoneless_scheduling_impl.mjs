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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiem9uZWxlc3Nfc2NoZWR1bGluZ19pbXBsLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvY2hhbmdlX2RldGVjdGlvbi9zY2hlZHVsaW5nL3pvbmVsZXNzX3NjaGVkdWxpbmdfaW1wbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQUMsWUFBWSxFQUFDLE1BQU0sTUFBTSxDQUFDO0FBRWxDLE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSxtQ0FBbUMsQ0FBQztBQUNqRSxPQUFPLEVBQUMsVUFBVSxFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFDL0MsT0FBTyxFQUFDLE1BQU0sRUFBQyxNQUFNLGlDQUFpQyxDQUFDO0FBRXZELE9BQU8sRUFBQyx3QkFBd0IsRUFBQyxNQUFNLDhCQUE4QixDQUFDO0FBQ3RFLE9BQU8sRUFBQyxZQUFZLEVBQW1CLE1BQU0sY0FBYyxDQUFDO0FBQzVELE9BQU8sRUFBQyxZQUFZLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUNqRCxPQUFPLEVBQ0wsNkJBQTZCLEVBQzdCLDJCQUEyQixHQUM1QixNQUFNLCtCQUErQixDQUFDO0FBQ3ZDLE9BQU8sRUFBQyxzQkFBc0IsRUFBQyxNQUFNLHdCQUF3QixDQUFDO0FBQzlELE9BQU8sRUFBQyxNQUFNLEVBQUUsVUFBVSxFQUFDLE1BQU0sb0JBQW9CLENBQUM7QUFFdEQsT0FBTyxFQUNMLHdCQUF3QixFQUV4QixnQkFBZ0IsRUFDaEIsMkJBQTJCLEdBQzVCLE1BQU0sdUJBQXVCLENBQUM7O0FBRS9CLE1BQU0sd0NBQXdDLEdBQUcsR0FBRyxDQUFDO0FBQ3JELElBQUksaUNBQWlDLEdBQUcsQ0FBQyxDQUFDO0FBQzFDLElBQUksNkJBQTZCLEdBQWEsRUFBRSxDQUFDO0FBRWpELFNBQVMsc0NBQXNDO0lBQzdDLGlDQUFpQyxFQUFFLENBQUM7SUFDcEMsSUFBSSx3Q0FB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ekUscUVBQXFFO1FBQ3JFLG1EQUFtRDtRQUNuRCxJQUFJLElBQUksQ0FBQyxtQkFBbUIsS0FBSyxJQUFJLEVBQUUsQ0FBQztZQUN0QyxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsbUJBQW1CLENBQUM7WUFDeEMsSUFBSSxDQUFDLG1CQUFtQixHQUFHLElBQUksQ0FBQztZQUNoQyxJQUFJLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUNsQyxDQUFDO0lBQ0gsQ0FBQzs2RkFwTVUsNEJBQTRCO3VFQUE1Qiw0QkFBNEIsV0FBNUIsNEJBQTRCLG1CQURoQixNQUFNOztnRkFDbEIsNEJBQTRCO2NBRHhDLFVBQVU7ZUFBQyxFQUFDLFVBQVUsRUFBRSxNQUFNLEVBQUM7O0FBd01oQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7R0FzQ0c7QUFDSCxNQUFNLFVBQVUsMENBQTBDO0lBQ3hELHNCQUFzQixDQUFDLFlBQVksQ0FBQyxDQUFDO0lBQ3JDLE9BQU8sd0JBQXdCLENBQUM7UUFDOUIsRUFBQyxPQUFPLEVBQUUsd0JBQXdCLEVBQUUsV0FBVyxFQUFFLDRCQUE0QixFQUFDO1FBQzlFLEVBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxRQUFRLEVBQUUsVUFBVSxFQUFDO1FBQ3ZDLEVBQUMsT0FBTyxFQUFFLGdCQUFnQixFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUM7S0FDNUMsQ0FBQyxDQUFDO0FBQ0wsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1N1YnNjcmlwdGlvbn0gZnJvbSAncnhqcyc7XG5cbmltcG9ydCB7QXBwbGljYXRpb25SZWZ9IGZyb20gJy4uLy4uL2FwcGxpY2F0aW9uL2FwcGxpY2F0aW9uX3JlZic7XG5pbXBvcnQge0luamVjdGFibGV9IGZyb20gJy4uLy4uL2RpL2luamVjdGFibGUnO1xuaW1wb3J0IHtpbmplY3R9IGZyb20gJy4uLy4uL2RpL2luamVjdG9yX2NvbXBhdGliaWxpdHknO1xuaW1wb3J0IHtFbnZpcm9ubWVudFByb3ZpZGVyc30gZnJvbSAnLi4vLi4vZGkvaW50ZXJmYWNlL3Byb3ZpZGVyJztcbmltcG9ydCB7bWFrZUVudmlyb25tZW50UHJvdmlkZXJzfSBmcm9tICcuLi8uLi9kaS9wcm92aWRlcl9jb2xsZWN0aW9uJztcbmltcG9ydCB7UnVudGltZUVycm9yLCBSdW50aW1lRXJyb3JDb2RlfSBmcm9tICcuLi8uLi9lcnJvcnMnO1xuaW1wb3J0IHtQZW5kaW5nVGFza3N9IGZyb20gJy4uLy4uL3BlbmRpbmdfdGFza3MnO1xuaW1wb3J0IHtcbiAgc2NoZWR1bGVDYWxsYmFja1dpdGhNaWNyb3Rhc2ssXG4gIHNjaGVkdWxlQ2FsbGJhY2tXaXRoUmFmUmFjZSxcbn0gZnJvbSAnLi4vLi4vdXRpbC9jYWxsYmFja19zY2hlZHVsZXInO1xuaW1wb3J0IHtwZXJmb3JtYW5jZU1hcmtGZWF0dXJlfSBmcm9tICcuLi8uLi91dGlsL3BlcmZvcm1hbmNlJztcbmltcG9ydCB7Tmdab25lLCBOb29wTmdab25lfSBmcm9tICcuLi8uLi96b25lL25nX3pvbmUnO1xuXG5pbXBvcnQge1xuICBDaGFuZ2VEZXRlY3Rpb25TY2hlZHVsZXIsXG4gIE5vdGlmaWNhdGlvblNvdXJjZSxcbiAgWk9ORUxFU1NfRU5BQkxFRCxcbiAgWk9ORUxFU1NfU0NIRURVTEVSX0RJU0FCTEVELFxufSBmcm9tICcuL3pvbmVsZXNzX3NjaGVkdWxpbmcnO1xuXG5jb25zdCBDT05TRUNVVElWRV9NSUNST1RBU0tfTk9USUZJQ0FUSU9OX0xJTUlUID0gMTAwO1xubGV0IGNvbnNlY3V0aXZlTWljcm90YXNrTm90aWZpY2F0aW9ucyA9IDA7XG5sZXQgc3RhY2tGcm9tTGFzdEZld05vdGlmaWNhdGlvbnM6IHN0cmluZ1tdID0gW107XG5cbmZ1bmN0aW9uIHRyYWNrTWljcm90YXNrTm90aWZpY2F0aW9uRm9yRGVidWdnaW5nKCkge1xuICBjb25zZWN1dGl2ZU1pY3JvdGFza05vdGlmaWNhdGlvbnMrKztcbiAgaWYgKENPTlNFQ1VUSVZFX01JQ1JPVEFTS19OT1RJRklDQVRJT05fTElNSVQgLSBjb25zZWN1dGl2ZU1pY3JvdGFza05vdGlmaWNhdGlvbnMgPCA1KSB7XG4gICAgY29uc3Qgc3RhY2sgPSBuZXcgRXJyb3IoKS5zdGFjaztcbiAgICBpZiAoc3RhY2spIHtcbiAgICAgIHN0YWNrRnJvbUxhc3RGZXdOb3RpZmljYXRpb25zLnB1c2goc3RhY2spO1xuICAgIH1cbiAgfVxuXG4gIGlmIChjb25zZWN1dGl2ZU1pY3JvdGFza05vdGlmaWNhdGlvbnMgPT09IENPTlNFQ1VUSVZFX01JQ1JPVEFTS19OT1RJRklDQVRJT05fTElNSVQpIHtcbiAgICB0aHJvdyBuZXcgUnVudGltZUVycm9yKFxuICAgICAgUnVudGltZUVycm9yQ29kZS5JTkZJTklURV9DSEFOR0VfREVURUNUSU9OLFxuICAgICAgJ0FuZ3VsYXIgY291bGQgbm90IHN0YWJpbGl6ZSBiZWNhdXNlIHRoZXJlIHdlcmUgZW5kbGVzcyBjaGFuZ2Ugbm90aWZpY2F0aW9ucyB3aXRoaW4gdGhlIGJyb3dzZXIgZXZlbnQgbG9vcC4gJyArXG4gICAgICAgICdUaGUgc3RhY2sgZnJvbSB0aGUgbGFzdCBzZXZlcmFsIG5vdGlmaWNhdGlvbnM6IFxcbicgK1xuICAgICAgICBzdGFja0Zyb21MYXN0RmV3Tm90aWZpY2F0aW9ucy5qb2luKCdcXG4nKSxcbiAgICApO1xuICB9XG59XG5cbkBJbmplY3RhYmxlKHtwcm92aWRlZEluOiAncm9vdCd9KVxuZXhwb3J0IGNsYXNzIENoYW5nZURldGVjdGlvblNjaGVkdWxlckltcGwgaW1wbGVtZW50cyBDaGFuZ2VEZXRlY3Rpb25TY2hlZHVsZXIge1xuICBwcml2YXRlIHJlYWRvbmx5IGFwcFJlZiA9IGluamVjdChBcHBsaWNhdGlvblJlZik7XG4gIHByaXZhdGUgcmVhZG9ubHkgdGFza1NlcnZpY2UgPSBpbmplY3QoUGVuZGluZ1Rhc2tzKTtcbiAgcHJpdmF0ZSByZWFkb25seSBuZ1pvbmUgPSBpbmplY3QoTmdab25lKTtcbiAgcHJpdmF0ZSByZWFkb25seSB6b25lbGVzc0VuYWJsZWQgPSBpbmplY3QoWk9ORUxFU1NfRU5BQkxFRCk7XG4gIHByaXZhdGUgcmVhZG9ubHkgZGlzYWJsZVNjaGVkdWxpbmcgPVxuICAgIGluamVjdChaT05FTEVTU19TQ0hFRFVMRVJfRElTQUJMRUQsIHtvcHRpb25hbDogdHJ1ZX0pID8/IGZhbHNlO1xuICBwcml2YXRlIHJlYWRvbmx5IHpvbmVJc0RlZmluZWQgPSB0eXBlb2YgWm9uZSAhPT0gJ3VuZGVmaW5lZCcgJiYgISFab25lLnJvb3QucnVuO1xuICBwcml2YXRlIHJlYWRvbmx5IHNjaGVkdWxlclRpY2tBcHBseUFyZ3MgPSBbe2RhdGE6IHsnX19zY2hlZHVsZXJfdGlja19fJzogdHJ1ZX19XTtcbiAgcHJpdmF0ZSByZWFkb25seSBzdWJzY3JpcHRpb25zID0gbmV3IFN1YnNjcmlwdGlvbigpO1xuXG4gIHByaXZhdGUgY2FuY2VsU2NoZWR1bGVkQ2FsbGJhY2s6IG51bGwgfCAoKCkgPT4gdm9pZCkgPSBudWxsO1xuICBwcml2YXRlIHNob3VsZFJlZnJlc2hWaWV3cyA9IGZhbHNlO1xuICBwcml2YXRlIHBlbmRpbmdSZW5kZXJUYXNrSWQ6IG51bWJlciB8IG51bGwgPSBudWxsO1xuICBwcml2YXRlIHVzZU1pY3JvdGFza1NjaGVkdWxlciA9IGZhbHNlO1xuICBydW5uaW5nVGljayA9IGZhbHNlO1xuXG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5hZGQoXG4gICAgICB0aGlzLmFwcFJlZi5hZnRlclRpY2suc3Vic2NyaWJlKCgpID0+IHtcbiAgICAgICAgLy8gSWYgdGhlIHNjaGVkdWxlciBpc24ndCBydW5uaW5nIGEgdGljayBidXQgdGhlIGFwcGxpY2F0aW9uIHRpY2tlZCwgdGhhdCBtZWFuc1xuICAgICAgICAvLyBzb21lb25lIGNhbGxlZCBBcHBsaWNhdGlvblJlZi50aWNrIG1hbnVhbGx5LiBJbiB0aGlzIGNhc2UsIHdlIHNob3VsZCBjYW5jZWxcbiAgICAgICAgLy8gYW55IGNoYW5nZSBkZXRlY3Rpb25zIHRoYXQgaGFkIGJlZW4gc2NoZWR1bGVkIHNvIHdlIGRvbid0IHJ1biBhbiBleHRyYSBvbmUuXG4gICAgICAgIGlmICghdGhpcy5ydW5uaW5nVGljaykge1xuICAgICAgICAgIHRoaXMuY2xlYW51cCgpO1xuICAgICAgICB9XG4gICAgICB9KSxcbiAgICApO1xuICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5hZGQoXG4gICAgICB0aGlzLm5nWm9uZS5vblVuc3RhYmxlLnN1YnNjcmliZSgoKSA9PiB7XG4gICAgICAgIC8vIElmIHRoZSB6b25lIGJlY29tZXMgdW5zdGFibGUgd2hlbiB3ZSdyZSBub3QgcnVubmluZyB0aWNrICh0aGlzIGhhcHBlbnMgZnJvbSB0aGUgem9uZS5ydW4pLFxuICAgICAgICAvLyB3ZSBzaG91bGQgY2FuY2VsIGFueSBzY2hlZHVsZWQgY2hhbmdlIGRldGVjdGlvbiBoZXJlIGJlY2F1c2UgYXQgdGhpcyBwb2ludCB3ZVxuICAgICAgICAvLyBrbm93IHRoYXQgdGhlIHpvbmUgd2lsbCBzdGFiaWxpemUgYXQgc29tZSBwb2ludCBhbmQgcnVuIGNoYW5nZSBkZXRlY3Rpb24gaXRzZWxmLlxuICAgICAgICBpZiAoIXRoaXMucnVubmluZ1RpY2spIHtcbiAgICAgICAgICB0aGlzLmNsZWFudXAoKTtcbiAgICAgICAgfVxuICAgICAgfSksXG4gICAgKTtcblxuICAgIC8vIFRPRE8oYXRzY290dCk6IFRoZXNlIGNvbmRpdGlvbnMgd2lsbCBuZWVkIHRvIGNoYW5nZSB3aGVuIHpvbmVsZXNzIGlzIHRoZSBkZWZhdWx0XG4gICAgLy8gSW5zdGVhZCwgdGhleSBzaG91bGQgZmxpcCB0byBjaGVja2luZyBpZiBab25lSlMgc2NoZWR1bGluZyBpcyBwcm92aWRlZFxuICAgIHRoaXMuZGlzYWJsZVNjaGVkdWxpbmcgfHw9XG4gICAgICAhdGhpcy56b25lbGVzc0VuYWJsZWQgJiZcbiAgICAgIC8vIE5vb3BOZ1pvbmUgd2l0aG91dCBlbmFibGluZyB6b25lbGVzcyBtZWFucyBubyBzY2hlZHVsaW5nIHdoYXRzb2V2ZXJcbiAgICAgICh0aGlzLm5nWm9uZSBpbnN0YW5jZW9mIE5vb3BOZ1pvbmUgfHxcbiAgICAgICAgLy8gVGhlIHNhbWUgZ29lcyBmb3IgdGhlIGxhY2sgb2YgWm9uZSB3aXRob3V0IGVuYWJsaW5nIHpvbmVsZXNzIHNjaGVkdWxpbmdcbiAgICAgICAgIXRoaXMuem9uZUlzRGVmaW5lZCk7XG4gIH1cblxuICBub3RpZnkoc291cmNlOiBOb3RpZmljYXRpb25Tb3VyY2UpOiB2b2lkIHtcbiAgICBpZiAoIXRoaXMuem9uZWxlc3NFbmFibGVkICYmIHNvdXJjZSA9PT0gTm90aWZpY2F0aW9uU291cmNlLkxpc3RlbmVyKSB7XG4gICAgICAvLyBXaGVuIHRoZSBub3RpZmljYXRpb24gY29tZXMgZnJvbSBhIGxpc3RlbmVyLCB3ZSBza2lwIHRoZSBub3RpZmljYXRpb24gdW5sZXNzIHRoZVxuICAgICAgLy8gYXBwbGljYXRpb24gaGFzIGVuYWJsZWQgem9uZWxlc3MuIElkZWFsbHksIGxpc3RlbmVycyB3b3VsZG4ndCBub3RpZnkgdGhlIHNjaGVkdWxlciBhdCBhbGxcbiAgICAgIC8vIGF1dG9tYXRpY2FsbHkuIFdlIGRvIG5vdCBrbm93IHRoYXQgYSBkZXZlbG9wZXIgbWFkZSBhIGNoYW5nZSBpbiB0aGUgbGlzdGVuZXIgY2FsbGJhY2sgdGhhdFxuICAgICAgLy8gcmVxdWlyZXMgYW4gYEFwcGxpY2F0aW9uUmVmLnRpY2tgIChzeW5jaHJvbml6ZSB0ZW1wbGF0ZXMgLyBydW4gcmVuZGVyIGhvb2tzKS4gV2UgZG8gdGhpc1xuICAgICAgLy8gb25seSBmb3IgYW4gZWFzaWVyIG1pZ3JhdGlvbiBmcm9tIE9uUHVzaCBjb21wb25lbnRzIHRvIHpvbmVsZXNzLiBCZWNhdXNlIGxpc3RlbmVycyBhcmVcbiAgICAgIC8vIHVzdWFsbHkgZXhlY3V0ZWQgaW5zaWRlIHRoZSBBbmd1bGFyIHpvbmUgYW5kIGxpc3RlbmVycyBhdXRvbWF0aWNhbGx5IGNhbGwgYG1hcmtWaWV3RGlydHlgLFxuICAgICAgLy8gZGV2ZWxvcGVycyBuZXZlciBuZWVkZWQgdG8gbWFudWFsbHkgdXNlIGBDaGFuZ2VEZXRlY3RvclJlZi5tYXJrRm9yQ2hlY2tgIG9yIHNvbWUgb3RoZXIgQVBJXG4gICAgICAvLyB0byBtYWtlIGxpc3RlbmVyIGNhbGxiYWNrcyB3b3JrIGNvcnJlY3RseSB3aXRoIGBPblB1c2hgIGNvbXBvbmVudHMuXG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHN3aXRjaCAoc291cmNlKSB7XG4gICAgICBjYXNlIE5vdGlmaWNhdGlvblNvdXJjZS5EZWJ1Z0FwcGx5Q2hhbmdlczpcbiAgICAgIGNhc2UgTm90aWZpY2F0aW9uU291cmNlLkRlZmVyQmxvY2tTdGF0ZVVwZGF0ZTpcbiAgICAgIGNhc2UgTm90aWZpY2F0aW9uU291cmNlLk1hcmtBbmNlc3RvcnNGb3JUcmF2ZXJzYWw6XG4gICAgICBjYXNlIE5vdGlmaWNhdGlvblNvdXJjZS5NYXJrRm9yQ2hlY2s6XG4gICAgICBjYXNlIE5vdGlmaWNhdGlvblNvdXJjZS5MaXN0ZW5lcjpcbiAgICAgIGNhc2UgTm90aWZpY2F0aW9uU291cmNlLlNldElucHV0OiB7XG4gICAgICAgIHRoaXMuc2hvdWxkUmVmcmVzaFZpZXdzID0gdHJ1ZTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBjYXNlIE5vdGlmaWNhdGlvblNvdXJjZS5WaWV3RGV0YWNoZWRGcm9tRE9NOlxuICAgICAgY2FzZSBOb3RpZmljYXRpb25Tb3VyY2UuVmlld0F0dGFjaGVkOlxuICAgICAgY2FzZSBOb3RpZmljYXRpb25Tb3VyY2UuTmV3UmVuZGVySG9vazpcbiAgICAgIGNhc2UgTm90aWZpY2F0aW9uU291cmNlLkFzeW5jQW5pbWF0aW9uc0xvYWRlZDpcbiAgICAgIGRlZmF1bHQ6IHtcbiAgICAgICAgLy8gVGhlc2Ugbm90aWZpY2F0aW9ucyBvbmx5IHNjaGVkdWxlIGEgdGljayBidXQgZG8gbm90IGNoYW5nZSB3aGV0aGVyIHdlIHNob3VsZCByZWZyZXNoXG4gICAgICAgIC8vIHZpZXdzLiBJbnN0ZWFkLCB3ZSBvbmx5IG5lZWQgdG8gcnVuIHJlbmRlciBob29rcyB1bmxlc3MgYW5vdGhlciBub3RpZmljYXRpb24gZnJvbSB0aGVcbiAgICAgICAgLy8gb3RoZXIgc2V0IGlzIGFsc28gcmVjZWl2ZWQgYmVmb3JlIGB0aWNrYCBoYXBwZW5zLlxuICAgICAgfVxuICAgIH1cblxuICAgIGlmICghdGhpcy5zaG91bGRTY2hlZHVsZVRpY2soKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmICh0eXBlb2YgbmdEZXZNb2RlID09PSAndW5kZWZpbmVkJyB8fCBuZ0Rldk1vZGUpIHtcbiAgICAgIGlmICh0aGlzLnVzZU1pY3JvdGFza1NjaGVkdWxlcikge1xuICAgICAgICB0cmFja01pY3JvdGFza05vdGlmaWNhdGlvbkZvckRlYnVnZ2luZygpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc2VjdXRpdmVNaWNyb3Rhc2tOb3RpZmljYXRpb25zID0gMDtcbiAgICAgICAgc3RhY2tGcm9tTGFzdEZld05vdGlmaWNhdGlvbnMubGVuZ3RoID0gMDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zdCBzY2hlZHVsZUNhbGxiYWNrID0gdGhpcy51c2VNaWNyb3Rhc2tTY2hlZHVsZXJcbiAgICAgID8gc2NoZWR1bGVDYWxsYmFja1dpdGhNaWNyb3Rhc2tcbiAgICAgIDogc2NoZWR1bGVDYWxsYmFja1dpdGhSYWZSYWNlO1xuICAgIHRoaXMucGVuZGluZ1JlbmRlclRhc2tJZCA9IHRoaXMudGFza1NlcnZpY2UuYWRkKCk7XG4gICAgaWYgKHRoaXMuem9uZUlzRGVmaW5lZCkge1xuICAgICAgWm9uZS5yb290LnJ1bigoKSA9PiB7XG4gICAgICAgIHRoaXMuY2FuY2VsU2NoZWR1bGVkQ2FsbGJhY2sgPSBzY2hlZHVsZUNhbGxiYWNrKCgpID0+IHtcbiAgICAgICAgICB0aGlzLnRpY2sodGhpcy5zaG91bGRSZWZyZXNoVmlld3MpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmNhbmNlbFNjaGVkdWxlZENhbGxiYWNrID0gc2NoZWR1bGVDYWxsYmFjaygoKSA9PiB7XG4gICAgICAgIHRoaXMudGljayh0aGlzLnNob3VsZFJlZnJlc2hWaWV3cyk7XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIHNob3VsZFNjaGVkdWxlVGljaygpOiBib29sZWFuIHtcbiAgICBpZiAodGhpcy5kaXNhYmxlU2NoZWR1bGluZykge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICAvLyBhbHJlYWR5IHNjaGVkdWxlZCBvciBydW5uaW5nXG4gICAgaWYgKHRoaXMucGVuZGluZ1JlbmRlclRhc2tJZCAhPT0gbnVsbCB8fCB0aGlzLnJ1bm5pbmdUaWNrIHx8IHRoaXMuYXBwUmVmLl9ydW5uaW5nVGljaykge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICAvLyBJZiB3ZSdyZSBpbnNpZGUgdGhlIHpvbmUgZG9uJ3QgYm90aGVyIHdpdGggc2NoZWR1bGVyLiBab25lIHdpbGwgc3RhYmlsaXplXG4gICAgLy8gZXZlbnR1YWxseSBhbmQgcnVuIGNoYW5nZSBkZXRlY3Rpb24uXG4gICAgaWYgKHRoaXMuem9uZUlzRGVmaW5lZCAmJiBOZ1pvbmUuaXNJbkFuZ3VsYXJab25lKCkpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDYWxscyBBcHBsaWNhdGlvblJlZi5fdGljayBpbnNpZGUgdGhlIGBOZ1pvbmVgLlxuICAgKlxuICAgKiBDYWxsaW5nIGB0aWNrYCBkaXJlY3RseSBydW5zIGNoYW5nZSBkZXRlY3Rpb24gYW5kIGNhbmNlbHMgYW55IGNoYW5nZSBkZXRlY3Rpb24gdGhhdCBoYWQgYmVlblxuICAgKiBzY2hlZHVsZWQgcHJldmlvdXNseS5cbiAgICpcbiAgICogQHBhcmFtIHNob3VsZFJlZnJlc2hWaWV3cyBQYXNzZWQgZGlyZWN0bHkgdG8gYEFwcGxpY2F0aW9uUmVmLl90aWNrYCBhbmQgc2tpcHMgc3RyYWlnaHQgdG9cbiAgICogICAgIHJlbmRlciBob29rcyB3aGVuIGBmYWxzZWAuXG4gICAqL1xuICBwcml2YXRlIHRpY2soc2hvdWxkUmVmcmVzaFZpZXdzOiBib29sZWFuKTogdm9pZCB7XG4gICAgLy8gV2hlbiBuZ1pvbmUucnVuIGJlbG93IGV4aXRzLCBvbk1pY3JvdGFza0VtcHR5IG1heSBlbWl0IGlmIHRoZSB6b25lIGlzXG4gICAgLy8gc3RhYmxlLiBXZSB3YW50IHRvIHByZXZlbnQgZG91YmxlIHRpY2tpbmcgc28gd2UgdHJhY2sgd2hldGhlciB0aGUgdGljayBpc1xuICAgIC8vIGFscmVhZHkgcnVubmluZyBhbmQgc2tpcCBpdCBpZiBzby5cbiAgICBpZiAodGhpcy5ydW5uaW5nVGljayB8fCB0aGlzLmFwcFJlZi5kZXN0cm95ZWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCB0YXNrID0gdGhpcy50YXNrU2VydmljZS5hZGQoKTtcbiAgICB0cnkge1xuICAgICAgdGhpcy5uZ1pvbmUucnVuKFxuICAgICAgICAoKSA9PiB7XG4gICAgICAgICAgdGhpcy5ydW5uaW5nVGljayA9IHRydWU7XG4gICAgICAgICAgdGhpcy5hcHBSZWYuX3RpY2soc2hvdWxkUmVmcmVzaFZpZXdzKTtcbiAgICAgICAgfSxcbiAgICAgICAgdW5kZWZpbmVkLFxuICAgICAgICB0aGlzLnNjaGVkdWxlclRpY2tBcHBseUFyZ3MsXG4gICAgICApO1xuICAgIH0gY2F0Y2ggKGU6IHVua25vd24pIHtcbiAgICAgIHRoaXMudGFza1NlcnZpY2UucmVtb3ZlKHRhc2spO1xuICAgICAgdGhyb3cgZTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgdGhpcy5jbGVhbnVwKCk7XG4gICAgfVxuICAgIC8vIElmIHdlJ3JlIG5vdGlmaWVkIG9mIGEgY2hhbmdlIHdpdGhpbiAxIG1pY3JvdGFzayBvZiBydW5uaW5nIGNoYW5nZVxuICAgIC8vIGRldGVjdGlvbiwgcnVuIGFub3RoZXIgcm91bmQgaW4gdGhlIHNhbWUgZXZlbnQgbG9vcC4gVGhpcyBhbGxvd3MgY29kZVxuICAgIC8vIHdoaWNoIHVzZXMgUHJvbWlzZS5yZXNvbHZlIChzZWUgTmdNb2RlbCkgdG8gYXZvaWRcbiAgICAvLyBFeHByZXNzaW9uQ2hhbmdlZC4uLkVycm9yIHRvIHN0aWxsIGJlIHJlZmxlY3RlZCBpbiBhIHNpbmdsZSBicm93c2VyXG4gICAgLy8gcGFpbnQsIGV2ZW4gaWYgdGhhdCBzcGFucyBtdWx0aXBsZSByb3VuZHMgb2YgY2hhbmdlIGRldGVjdGlvbi5cbiAgICB0aGlzLnVzZU1pY3JvdGFza1NjaGVkdWxlciA9IHRydWU7XG4gICAgc2NoZWR1bGVDYWxsYmFja1dpdGhNaWNyb3Rhc2soKCkgPT4ge1xuICAgICAgdGhpcy51c2VNaWNyb3Rhc2tTY2hlZHVsZXIgPSBmYWxzZTtcbiAgICAgIHRoaXMudGFza1NlcnZpY2UucmVtb3ZlKHRhc2spO1xuICAgIH0pO1xuICB9XG5cbiAgbmdPbkRlc3Ryb3koKSB7XG4gICAgdGhpcy5zdWJzY3JpcHRpb25zLnVuc3Vic2NyaWJlKCk7XG4gICAgdGhpcy5jbGVhbnVwKCk7XG4gIH1cblxuICBwcml2YXRlIGNsZWFudXAoKSB7XG4gICAgdGhpcy5zaG91bGRSZWZyZXNoVmlld3MgPSBmYWxzZTtcbiAgICB0aGlzLnJ1bm5pbmdUaWNrID0gZmFsc2U7XG4gICAgdGhpcy5jYW5jZWxTY2hlZHVsZWRDYWxsYmFjaz8uKCk7XG4gICAgdGhpcy5jYW5jZWxTY2hlZHVsZWRDYWxsYmFjayA9IG51bGw7XG4gICAgLy8gSWYgdGhpcyBpcyB0aGUgbGFzdCB0YXNrLCB0aGUgc2VydmljZSB3aWxsIHN5bmNocm9ub3VzbHkgZW1pdCBhIHN0YWJsZVxuICAgIC8vIG5vdGlmaWNhdGlvbi4gSWYgdGhlcmUgaXMgYSBzdWJzY3JpYmVyIHRoYXQgdGhlbiBhY3RzIGluIGEgd2F5IHRoYXRcbiAgICAvLyB0cmllcyB0byBub3RpZnkgdGhlIHNjaGVkdWxlciBhZ2Fpbiwgd2UgbmVlZCB0byBiZSBhYmxlIHRvIHJlc3BvbmQgdG9cbiAgICAvLyBzY2hlZHVsZSBhIG5ldyBjaGFuZ2UgZGV0ZWN0aW9uLiBUaGVyZWZvcmUsIHdlIHNob3VsZCBjbGVhciB0aGUgdGFzayBJRFxuICAgIC8vIGJlZm9yZSByZW1vdmluZyBpdCBmcm9tIHRoZSBwZW5kaW5nIHRhc2tzIChvciB0aGUgdGFza3Mgc2VydmljZSBzaG91bGRcbiAgICAvLyBub3Qgc3luY2hyb25vdXNseSBlbWl0IHN0YWJsZSwgc2ltaWxhciB0byBob3cgWm9uZSBzdGFibGVuZXNzIG9ubHlcbiAgICAvLyBoYXBwZW5zIGlmIGl0J3Mgc3RpbGwgc3RhYmxlIGFmdGVyIGEgbWljcm90YXNrKS5cbiAgICBpZiAodGhpcy5wZW5kaW5nUmVuZGVyVGFza0lkICE9PSBudWxsKSB7XG4gICAgICBjb25zdCB0YXNrSWQgPSB0aGlzLnBlbmRpbmdSZW5kZXJUYXNrSWQ7XG4gICAgICB0aGlzLnBlbmRpbmdSZW5kZXJUYXNrSWQgPSBudWxsO1xuICAgICAgdGhpcy50YXNrU2VydmljZS5yZW1vdmUodGFza0lkKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBQcm92aWRlcyBjaGFuZ2UgZGV0ZWN0aW9uIHdpdGhvdXQgWm9uZUpTIGZvciB0aGUgYXBwbGljYXRpb24gYm9vdHN0cmFwcGVkIHVzaW5nXG4gKiBgYm9vdHN0cmFwQXBwbGljYXRpb25gLlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gYWxsb3dzIHlvdSB0byBjb25maWd1cmUgdGhlIGFwcGxpY2F0aW9uIHRvIG5vdCB1c2UgdGhlIHN0YXRlL3N0YXRlIGNoYW5nZXMgb2ZcbiAqIFpvbmVKUyB0byBzY2hlZHVsZSBjaGFuZ2UgZGV0ZWN0aW9uIGluIHRoZSBhcHBsaWNhdGlvbi4gVGhpcyB3aWxsIHdvcmsgd2hlbiBab25lSlMgaXMgbm90IHByZXNlbnRcbiAqIG9uIHRoZSBwYWdlIGF0IGFsbCBvciBpZiBpdCBleGlzdHMgYmVjYXVzZSBzb21ldGhpbmcgZWxzZSBpcyB1c2luZyBpdCAoZWl0aGVyIGFub3RoZXIgQW5ndWxhclxuICogYXBwbGljYXRpb24gd2hpY2ggdXNlcyBab25lSlMgZm9yIHNjaGVkdWxpbmcgb3Igc29tZSBvdGhlciBsaWJyYXJ5IHRoYXQgcmVsaWVzIG9uIFpvbmVKUykuXG4gKlxuICogVGhpcyBjYW4gYWxzbyBiZSBhZGRlZCB0byB0aGUgYFRlc3RCZWRgIHByb3ZpZGVycyB0byBjb25maWd1cmUgdGhlIHRlc3QgZW52aXJvbm1lbnQgdG8gbW9yZVxuICogY2xvc2VseSBtYXRjaCBwcm9kdWN0aW9uIGJlaGF2aW9yLiBUaGlzIHdpbGwgaGVscCBnaXZlIGhpZ2hlciBjb25maWRlbmNlIHRoYXQgY29tcG9uZW50cyBhcmVcbiAqIGNvbXBhdGlibGUgd2l0aCB6b25lbGVzcyBjaGFuZ2UgZGV0ZWN0aW9uLlxuICpcbiAqIFpvbmVKUyB1c2VzIGJyb3dzZXIgZXZlbnRzIHRvIHRyaWdnZXIgY2hhbmdlIGRldGVjdGlvbi4gV2hlbiB1c2luZyB0aGlzIHByb3ZpZGVyLCBBbmd1bGFyIHdpbGxcbiAqIGluc3RlYWQgdXNlIEFuZ3VsYXIgQVBJcyB0byBzY2hlZHVsZSBjaGFuZ2UgZGV0ZWN0aW9uLiBUaGVzZSBBUElzIGluY2x1ZGU6XG4gKlxuICogLSBgQ2hhbmdlRGV0ZWN0b3JSZWYubWFya0ZvckNoZWNrYFxuICogLSBgQ29tcG9uZW50UmVmLnNldElucHV0YFxuICogLSB1cGRhdGluZyBhIHNpZ25hbCB0aGF0IGlzIHJlYWQgaW4gYSB0ZW1wbGF0ZVxuICogLSB3aGVuIGJvdW5kIGhvc3Qgb3IgdGVtcGxhdGUgbGlzdGVuZXJzIGFyZSB0cmlnZ2VyZWRcbiAqIC0gYXR0YWNoaW5nIGEgdmlldyB0aGF0IHdhcyBtYXJrZWQgZGlydHkgYnkgb25lIG9mIHRoZSBhYm92ZVxuICogLSByZW1vdmluZyBhIHZpZXdcbiAqIC0gcmVnaXN0ZXJpbmcgYSByZW5kZXIgaG9vayAodGVtcGxhdGVzIGFyZSBvbmx5IHJlZnJlc2hlZCBpZiByZW5kZXIgaG9va3MgZG8gb25lIG9mIHRoZSBhYm92ZSlcbiAqXG4gKiBAdXNhZ2VOb3Rlc1xuICogYGBgdHlwZXNjcmlwdFxuICogYm9vdHN0cmFwQXBwbGljYXRpb24oTXlBcHAsIHtwcm92aWRlcnM6IFtcbiAqICAgcHJvdmlkZUV4cGVyaW1lbnRhbFpvbmVsZXNzQ2hhbmdlRGV0ZWN0aW9uKCksXG4gKiBdfSk7XG4gKiBgYGBcbiAqXG4gKiBUaGlzIEFQSSBpcyBleHBlcmltZW50YWwuIE5laXRoZXIgdGhlIHNoYXBlLCBub3IgdGhlIHVuZGVybHlpbmcgYmVoYXZpb3IgaXMgc3RhYmxlIGFuZCBjYW4gY2hhbmdlXG4gKiBpbiBwYXRjaCB2ZXJzaW9ucy4gVGhlcmUgYXJlIGtub3duIGZlYXR1cmUgZ2FwcyBhbmQgQVBJIGVyZ29ub21pYyBjb25zaWRlcmF0aW9ucy4gV2Ugd2lsbCBpdGVyYXRlXG4gKiBvbiB0aGUgZXhhY3QgQVBJIGJhc2VkIG9uIHRoZSBmZWVkYmFjayBhbmQgb3VyIHVuZGVyc3RhbmRpbmcgb2YgdGhlIHByb2JsZW0gYW5kIHNvbHV0aW9uIHNwYWNlLlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqIEBleHBlcmltZW50YWxcbiAqIEBzZWUge0BsaW5rIGJvb3RzdHJhcEFwcGxpY2F0aW9ufVxuICovXG5leHBvcnQgZnVuY3Rpb24gcHJvdmlkZUV4cGVyaW1lbnRhbFpvbmVsZXNzQ2hhbmdlRGV0ZWN0aW9uKCk6IEVudmlyb25tZW50UHJvdmlkZXJzIHtcbiAgcGVyZm9ybWFuY2VNYXJrRmVhdHVyZSgnTmdab25lbGVzcycpO1xuICByZXR1cm4gbWFrZUVudmlyb25tZW50UHJvdmlkZXJzKFtcbiAgICB7cHJvdmlkZTogQ2hhbmdlRGV0ZWN0aW9uU2NoZWR1bGVyLCB1c2VFeGlzdGluZzogQ2hhbmdlRGV0ZWN0aW9uU2NoZWR1bGVySW1wbH0sXG4gICAge3Byb3ZpZGU6IE5nWm9uZSwgdXNlQ2xhc3M6IE5vb3BOZ1pvbmV9LFxuICAgIHtwcm92aWRlOiBaT05FTEVTU19FTkFCTEVELCB1c2VWYWx1ZTogdHJ1ZX0sXG4gIF0pO1xufVxuIl19