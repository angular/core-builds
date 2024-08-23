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
import { RuntimeError, formatRuntimeError } from '../../errors';
import { PendingTasks } from '../../pending_tasks';
import { scheduleCallbackWithMicrotask, scheduleCallbackWithRafRace, } from '../../util/callback_scheduler';
import { performanceMarkFeature } from '../../util/performance';
import { NgZone, NoopNgZone, angularZoneInstanceIdProperty } from '../../zone/ng_zone';
import { ChangeDetectionScheduler, ZONELESS_ENABLED, PROVIDED_ZONELESS, ZONELESS_SCHEDULER_DISABLED, SCHEDULE_IN_ROOT_ZONE, } from './zoneless_scheduling';
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
        this.angularZoneId = this.zoneIsDefined
            ? this.ngZone._inner?.get(angularZoneInstanceIdProperty)
            : null;
        this.scheduleInRootZone = !this.zonelessEnabled &&
            this.zoneIsDefined &&
            (inject(SCHEDULE_IN_ROOT_ZONE, { optional: true }) ?? false);
        this.cancelScheduledCallback = null;
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
            case 0 /* NotificationSource.MarkAncestorsForTraversal */: {
                this.appRef.dirtyFlags |= 2 /* ApplicationRefDirtyFlags.ViewTreeTraversal */;
                break;
            }
            case 3 /* NotificationSource.DebugApplyChanges */:
            case 2 /* NotificationSource.DeferBlockStateUpdate */:
            case 4 /* NotificationSource.MarkForCheck */:
            case 5 /* NotificationSource.Listener */:
            case 1 /* NotificationSource.SetInput */: {
                this.appRef.dirtyFlags |= 4 /* ApplicationRefDirtyFlags.ViewTreeCheck */;
                break;
            }
            case 7 /* NotificationSource.DeferredRenderHook */: {
                // Render hooks are "deferred" when they're triggered from other render hooks. Using the
                // deferred dirty flags ensures that adding new hooks doesn't automatically trigger a loop
                // inside tick().
                this.appRef.deferredDirtyFlags |= 8 /* ApplicationRefDirtyFlags.AfterRender */;
                break;
            }
            case 9 /* NotificationSource.ViewDetachedFromDOM */:
            case 8 /* NotificationSource.ViewAttached */:
            case 6 /* NotificationSource.RenderHook */:
            case 10 /* NotificationSource.AsyncAnimationsLoaded */:
            default: {
                // These notifications only schedule a tick but do not change whether we should refresh
                // views. Instead, we only need to run render hooks unless another notification from the
                // other set is also received before `tick` happens.
                this.appRef.dirtyFlags |= 8 /* ApplicationRefDirtyFlags.AfterRender */;
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
        if (this.scheduleInRootZone) {
            this.cancelScheduledCallback = Zone.root.run(() => scheduleCallback(() => this.tick()));
        }
        else {
            this.cancelScheduledCallback = this.ngZone.runOutsideAngular(() => scheduleCallback(() => this.tick()));
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
        if (!this.zonelessEnabled &&
            this.zoneIsDefined &&
            Zone.current.get(angularZoneInstanceIdProperty + this.angularZoneId)) {
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
    tick() {
        // When ngZone.run below exits, onMicrotaskEmpty may emit if the zone is
        // stable. We want to prevent double ticking so we track whether the tick is
        // already running and skip it if so.
        if (this.runningTick || this.appRef.destroyed) {
            return;
        }
        // The scheduler used to pass "whether to check views" as a boolean flag instead of setting
        // fine-grained dirtiness flags, and global checking was always used on the first pass. This
        // created an interesting edge case: if a notification made a view dirty and then ticked via the
        // scheduler (and not the zone) a global check was still performed.
        //
        // Ideally, this would not be the case, and only zone-based ticks would do global passes.
        // However this is a breaking change and requires fixes in g3. Until this cleanup can be done,
        // we add the `ViewTreeGlobal` flag to request a global check if any views are dirty in a
        // scheduled tick (unless zoneless is enabled, in which case global checks aren't really a
        // thing).
        //
        // TODO(alxhub): clean up and remove this workaround as a breaking change.
        if (!this.zonelessEnabled && this.appRef.dirtyFlags & 7 /* ApplicationRefDirtyFlags.ViewTreeAny */) {
            this.appRef.dirtyFlags |= 1 /* ApplicationRefDirtyFlags.ViewTreeGlobal */;
        }
        const task = this.taskService.add();
        try {
            this.ngZone.run(() => {
                this.runningTick = true;
                this.appRef._tick();
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
    static { this.ɵfac = function ChangeDetectionSchedulerImpl_Factory(__ngFactoryType__) { return new (__ngFactoryType__ || ChangeDetectionSchedulerImpl)(); }; }
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
 * @see [bootstrapApplication](/api/platform-browser/bootstrapApplication)
 */
export function provideExperimentalZonelessChangeDetection() {
    performanceMarkFeature('NgZoneless');
    if ((typeof ngDevMode === 'undefined' || ngDevMode) && typeof Zone !== 'undefined' && Zone) {
        const message = formatRuntimeError(914 /* RuntimeErrorCode.UNEXPECTED_ZONEJS_PRESENT_IN_ZONELESS_MODE */, `The application is using zoneless change detection, but is still loading Zone.js. ` +
            `Consider removing Zone.js to get the full benefits of zoneless. ` +
            `In applications using the Angular CLI, Zone.js is typically included in the "polyfills" section of the angular.json file.`);
        console.warn(message);
    }
    return makeEnvironmentProviders([
        { provide: ChangeDetectionScheduler, useExisting: ChangeDetectionSchedulerImpl },
        { provide: NgZone, useClass: NoopNgZone },
        { provide: ZONELESS_ENABLED, useValue: true },
        { provide: SCHEDULE_IN_ROOT_ZONE, useValue: false },
        typeof ngDevMode === 'undefined' || ngDevMode
            ? [{ provide: PROVIDED_ZONELESS, useValue: true }]
            : [],
    ]);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiem9uZWxlc3Nfc2NoZWR1bGluZ19pbXBsLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvY2hhbmdlX2RldGVjdGlvbi9zY2hlZHVsaW5nL3pvbmVsZXNzX3NjaGVkdWxpbmdfaW1wbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQUMsWUFBWSxFQUFDLE1BQU0sTUFBTSxDQUFDO0FBRWxDLE9BQU8sRUFBQyxjQUFjLEVBQTJCLE1BQU0sbUNBQW1DLENBQUM7QUFDM0YsT0FBTyxFQUFDLFVBQVUsRUFBQyxNQUFNLHFCQUFxQixDQUFDO0FBQy9DLE9BQU8sRUFBQyxNQUFNLEVBQUMsTUFBTSxpQ0FBaUMsQ0FBQztBQUV2RCxPQUFPLEVBQUMsd0JBQXdCLEVBQUMsTUFBTSw4QkFBOEIsQ0FBQztBQUN0RSxPQUFPLEVBQUMsWUFBWSxFQUFvQixrQkFBa0IsRUFBQyxNQUFNLGNBQWMsQ0FBQztBQUNoRixPQUFPLEVBQUMsWUFBWSxFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFDakQsT0FBTyxFQUNMLDZCQUE2QixFQUM3QiwyQkFBMkIsR0FDNUIsTUFBTSwrQkFBK0IsQ0FBQztBQUN2QyxPQUFPLEVBQUMsc0JBQXNCLEVBQUMsTUFBTSx3QkFBd0IsQ0FBQztBQUM5RCxPQUFPLEVBQUMsTUFBTSxFQUFpQixVQUFVLEVBQUUsNkJBQTZCLEVBQUMsTUFBTSxvQkFBb0IsQ0FBQztBQUVwRyxPQUFPLEVBQ0wsd0JBQXdCLEVBRXhCLGdCQUFnQixFQUNoQixpQkFBaUIsRUFDakIsMkJBQTJCLEVBQzNCLHFCQUFxQixHQUN0QixNQUFNLHVCQUF1QixDQUFDOztBQUUvQixNQUFNLHdDQUF3QyxHQUFHLEdBQUcsQ0FBQztBQUNyRCxJQUFJLGlDQUFpQyxHQUFHLENBQUMsQ0FBQztBQUMxQyxJQUFJLDZCQUE2QixHQUFhLEVBQUUsQ0FBQztBQUVq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RUFBQyxDQUFDO1lBQ2hELENBQUMsQ0FBQyxFQUFFO0tBQ1AsQ0FBQyxDQUFDO0FBQ0wsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1N1YnNjcmlwdGlvbn0gZnJvbSAncnhqcyc7XG5cbmltcG9ydCB7QXBwbGljYXRpb25SZWYsIEFwcGxpY2F0aW9uUmVmRGlydHlGbGFnc30gZnJvbSAnLi4vLi4vYXBwbGljYXRpb24vYXBwbGljYXRpb25fcmVmJztcbmltcG9ydCB7SW5qZWN0YWJsZX0gZnJvbSAnLi4vLi4vZGkvaW5qZWN0YWJsZSc7XG5pbXBvcnQge2luamVjdH0gZnJvbSAnLi4vLi4vZGkvaW5qZWN0b3JfY29tcGF0aWJpbGl0eSc7XG5pbXBvcnQge0Vudmlyb25tZW50UHJvdmlkZXJzfSBmcm9tICcuLi8uLi9kaS9pbnRlcmZhY2UvcHJvdmlkZXInO1xuaW1wb3J0IHttYWtlRW52aXJvbm1lbnRQcm92aWRlcnN9IGZyb20gJy4uLy4uL2RpL3Byb3ZpZGVyX2NvbGxlY3Rpb24nO1xuaW1wb3J0IHtSdW50aW1lRXJyb3IsIFJ1bnRpbWVFcnJvckNvZGUsIGZvcm1hdFJ1bnRpbWVFcnJvcn0gZnJvbSAnLi4vLi4vZXJyb3JzJztcbmltcG9ydCB7UGVuZGluZ1Rhc2tzfSBmcm9tICcuLi8uLi9wZW5kaW5nX3Rhc2tzJztcbmltcG9ydCB7XG4gIHNjaGVkdWxlQ2FsbGJhY2tXaXRoTWljcm90YXNrLFxuICBzY2hlZHVsZUNhbGxiYWNrV2l0aFJhZlJhY2UsXG59IGZyb20gJy4uLy4uL3V0aWwvY2FsbGJhY2tfc2NoZWR1bGVyJztcbmltcG9ydCB7cGVyZm9ybWFuY2VNYXJrRmVhdHVyZX0gZnJvbSAnLi4vLi4vdXRpbC9wZXJmb3JtYW5jZSc7XG5pbXBvcnQge05nWm9uZSwgTmdab25lUHJpdmF0ZSwgTm9vcE5nWm9uZSwgYW5ndWxhclpvbmVJbnN0YW5jZUlkUHJvcGVydHl9IGZyb20gJy4uLy4uL3pvbmUvbmdfem9uZSc7XG5cbmltcG9ydCB7XG4gIENoYW5nZURldGVjdGlvblNjaGVkdWxlcixcbiAgTm90aWZpY2F0aW9uU291cmNlLFxuICBaT05FTEVTU19FTkFCTEVELFxuICBQUk9WSURFRF9aT05FTEVTUyxcbiAgWk9ORUxFU1NfU0NIRURVTEVSX0RJU0FCTEVELFxuICBTQ0hFRFVMRV9JTl9ST09UX1pPTkUsXG59IGZyb20gJy4vem9uZWxlc3Nfc2NoZWR1bGluZyc7XG5cbmNvbnN0IENPTlNFQ1VUSVZFX01JQ1JPVEFTS19OT1RJRklDQVRJT05fTElNSVQgPSAxMDA7XG5sZXQgY29uc2VjdXRpdmVNaWNyb3Rhc2tOb3RpZmljYXRpb25zID0gMDtcbmxldCBzdGFja0Zyb21MYXN0RmV3Tm90aWZpY2F0aW9uczogc3RyaW5nW10gPSBbXTtcblxuZnVuY3Rpb24gdHJhY2tNaWNyb3Rhc2tOb3RpZmljYXRpb25Gb3JEZWJ1Z2dpbmcoKSB7XG4gIGNvbnNlY3V0aXZlTWljcm90YXNrTm90aWZpY2F0aW9ucysrO1xuICBpZiAoQ09OU0VDVVRJVkVfTUlDUk9UQVNLX05PVElGSUNBVElPTl9MSU1JVCAtIGNvbnNlY3V0aXZlTWljcm90YXNrTm90aWZpY2F0aW9ucyA8IDUpIHtcbiAgICBjb25zdCBzdGFjayA9IG5ldyBFcnJvcigpLnN0YWNrO1xuICAgIGlmIChzdGFjaykge1xuICAgICAgc3RhY2tGcm9tTGFzdEZld05vdGlmaWNhdGlvbnMucHVzaChzdGFjayk7XG4gICAgfVxuICB9XG5cbiAgaWYgKGNvbnNlY3V0aXZlTWljcm90YXNrTm90aWZpY2F0aW9ucyA9PT0gQ09OU0VDVVRJVkVfTUlDUk9UQVNLX05PVElGSUNBVElPTl9MSU1JVCkge1xuICAgIHRocm93IG5ldyBSdW50aW1lRXJyb3IoXG4gICAgICBSdW50aW1lRXJyb3JDb2RlLklORklOSVRFX0NIQU5HRV9ERVRFQ1RJT04sXG4gICAgICAnQW5ndWxhciBjb3VsZCBub3Qgc3RhYmlsaXplIGJlY2F1c2UgdGhlcmUgd2VyZSBlbmRsZXNzIGNoYW5nZSBub3RpZmljYXRpb25zIHdpdGhpbiB0aGUgYnJvd3NlciBldmVudCBsb29wLiAnICtcbiAgICAgICAgJ1RoZSBzdGFjayBmcm9tIHRoZSBsYXN0IHNldmVyYWwgbm90aWZpY2F0aW9uczogXFxuJyArXG4gICAgICAgIHN0YWNrRnJvbUxhc3RGZXdOb3RpZmljYXRpb25zLmpvaW4oJ1xcbicpLFxuICAgICk7XG4gIH1cbn1cblxuQEluamVjdGFibGUoe3Byb3ZpZGVkSW46ICdyb290J30pXG5leHBvcnQgY2xhc3MgQ2hhbmdlRGV0ZWN0aW9uU2NoZWR1bGVySW1wbCBpbXBsZW1lbnRzIENoYW5nZURldGVjdGlvblNjaGVkdWxlciB7XG4gIHByaXZhdGUgcmVhZG9ubHkgYXBwUmVmID0gaW5qZWN0KEFwcGxpY2F0aW9uUmVmKTtcbiAgcHJpdmF0ZSByZWFkb25seSB0YXNrU2VydmljZSA9IGluamVjdChQZW5kaW5nVGFza3MpO1xuICBwcml2YXRlIHJlYWRvbmx5IG5nWm9uZSA9IGluamVjdChOZ1pvbmUpO1xuICBwcml2YXRlIHJlYWRvbmx5IHpvbmVsZXNzRW5hYmxlZCA9IGluamVjdChaT05FTEVTU19FTkFCTEVEKTtcbiAgcHJpdmF0ZSByZWFkb25seSBkaXNhYmxlU2NoZWR1bGluZyA9XG4gICAgaW5qZWN0KFpPTkVMRVNTX1NDSEVEVUxFUl9ESVNBQkxFRCwge29wdGlvbmFsOiB0cnVlfSkgPz8gZmFsc2U7XG4gIHByaXZhdGUgcmVhZG9ubHkgem9uZUlzRGVmaW5lZCA9IHR5cGVvZiBab25lICE9PSAndW5kZWZpbmVkJyAmJiAhIVpvbmUucm9vdC5ydW47XG4gIHByaXZhdGUgcmVhZG9ubHkgc2NoZWR1bGVyVGlja0FwcGx5QXJncyA9IFt7ZGF0YTogeydfX3NjaGVkdWxlcl90aWNrX18nOiB0cnVlfX1dO1xuICBwcml2YXRlIHJlYWRvbmx5IHN1YnNjcmlwdGlvbnMgPSBuZXcgU3Vic2NyaXB0aW9uKCk7XG4gIHByaXZhdGUgcmVhZG9ubHkgYW5ndWxhclpvbmVJZCA9IHRoaXMuem9uZUlzRGVmaW5lZFxuICAgID8gKHRoaXMubmdab25lIGFzIE5nWm9uZVByaXZhdGUpLl9pbm5lcj8uZ2V0KGFuZ3VsYXJab25lSW5zdGFuY2VJZFByb3BlcnR5KVxuICAgIDogbnVsbDtcbiAgcHJpdmF0ZSByZWFkb25seSBzY2hlZHVsZUluUm9vdFpvbmUgPVxuICAgICF0aGlzLnpvbmVsZXNzRW5hYmxlZCAmJlxuICAgIHRoaXMuem9uZUlzRGVmaW5lZCAmJlxuICAgIChpbmplY3QoU0NIRURVTEVfSU5fUk9PVF9aT05FLCB7b3B0aW9uYWw6IHRydWV9KSA/PyBmYWxzZSk7XG5cbiAgcHJpdmF0ZSBjYW5jZWxTY2hlZHVsZWRDYWxsYmFjazogbnVsbCB8ICgoKSA9PiB2b2lkKSA9IG51bGw7XG4gIHByaXZhdGUgdXNlTWljcm90YXNrU2NoZWR1bGVyID0gZmFsc2U7XG4gIHJ1bm5pbmdUaWNrID0gZmFsc2U7XG4gIHBlbmRpbmdSZW5kZXJUYXNrSWQ6IG51bWJlciB8IG51bGwgPSBudWxsO1xuXG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5hZGQoXG4gICAgICB0aGlzLmFwcFJlZi5hZnRlclRpY2suc3Vic2NyaWJlKCgpID0+IHtcbiAgICAgICAgLy8gSWYgdGhlIHNjaGVkdWxlciBpc24ndCBydW5uaW5nIGEgdGljayBidXQgdGhlIGFwcGxpY2F0aW9uIHRpY2tlZCwgdGhhdCBtZWFuc1xuICAgICAgICAvLyBzb21lb25lIGNhbGxlZCBBcHBsaWNhdGlvblJlZi50aWNrIG1hbnVhbGx5LiBJbiB0aGlzIGNhc2UsIHdlIHNob3VsZCBjYW5jZWxcbiAgICAgICAgLy8gYW55IGNoYW5nZSBkZXRlY3Rpb25zIHRoYXQgaGFkIGJlZW4gc2NoZWR1bGVkIHNvIHdlIGRvbid0IHJ1biBhbiBleHRyYSBvbmUuXG4gICAgICAgIGlmICghdGhpcy5ydW5uaW5nVGljaykge1xuICAgICAgICAgIHRoaXMuY2xlYW51cCgpO1xuICAgICAgICB9XG4gICAgICB9KSxcbiAgICApO1xuICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5hZGQoXG4gICAgICB0aGlzLm5nWm9uZS5vblVuc3RhYmxlLnN1YnNjcmliZSgoKSA9PiB7XG4gICAgICAgIC8vIElmIHRoZSB6b25lIGJlY29tZXMgdW5zdGFibGUgd2hlbiB3ZSdyZSBub3QgcnVubmluZyB0aWNrICh0aGlzIGhhcHBlbnMgZnJvbSB0aGUgem9uZS5ydW4pLFxuICAgICAgICAvLyB3ZSBzaG91bGQgY2FuY2VsIGFueSBzY2hlZHVsZWQgY2hhbmdlIGRldGVjdGlvbiBoZXJlIGJlY2F1c2UgYXQgdGhpcyBwb2ludCB3ZVxuICAgICAgICAvLyBrbm93IHRoYXQgdGhlIHpvbmUgd2lsbCBzdGFiaWxpemUgYXQgc29tZSBwb2ludCBhbmQgcnVuIGNoYW5nZSBkZXRlY3Rpb24gaXRzZWxmLlxuICAgICAgICBpZiAoIXRoaXMucnVubmluZ1RpY2spIHtcbiAgICAgICAgICB0aGlzLmNsZWFudXAoKTtcbiAgICAgICAgfVxuICAgICAgfSksXG4gICAgKTtcblxuICAgIC8vIFRPRE8oYXRzY290dCk6IFRoZXNlIGNvbmRpdGlvbnMgd2lsbCBuZWVkIHRvIGNoYW5nZSB3aGVuIHpvbmVsZXNzIGlzIHRoZSBkZWZhdWx0XG4gICAgLy8gSW5zdGVhZCwgdGhleSBzaG91bGQgZmxpcCB0byBjaGVja2luZyBpZiBab25lSlMgc2NoZWR1bGluZyBpcyBwcm92aWRlZFxuICAgIHRoaXMuZGlzYWJsZVNjaGVkdWxpbmcgfHw9XG4gICAgICAhdGhpcy56b25lbGVzc0VuYWJsZWQgJiZcbiAgICAgIC8vIE5vb3BOZ1pvbmUgd2l0aG91dCBlbmFibGluZyB6b25lbGVzcyBtZWFucyBubyBzY2hlZHVsaW5nIHdoYXRzb2V2ZXJcbiAgICAgICh0aGlzLm5nWm9uZSBpbnN0YW5jZW9mIE5vb3BOZ1pvbmUgfHxcbiAgICAgICAgLy8gVGhlIHNhbWUgZ29lcyBmb3IgdGhlIGxhY2sgb2YgWm9uZSB3aXRob3V0IGVuYWJsaW5nIHpvbmVsZXNzIHNjaGVkdWxpbmdcbiAgICAgICAgIXRoaXMuem9uZUlzRGVmaW5lZCk7XG4gIH1cblxuICBub3RpZnkoc291cmNlOiBOb3RpZmljYXRpb25Tb3VyY2UpOiB2b2lkIHtcbiAgICBpZiAoIXRoaXMuem9uZWxlc3NFbmFibGVkICYmIHNvdXJjZSA9PT0gTm90aWZpY2F0aW9uU291cmNlLkxpc3RlbmVyKSB7XG4gICAgICAvLyBXaGVuIHRoZSBub3RpZmljYXRpb24gY29tZXMgZnJvbSBhIGxpc3RlbmVyLCB3ZSBza2lwIHRoZSBub3RpZmljYXRpb24gdW5sZXNzIHRoZVxuICAgICAgLy8gYXBwbGljYXRpb24gaGFzIGVuYWJsZWQgem9uZWxlc3MuIElkZWFsbHksIGxpc3RlbmVycyB3b3VsZG4ndCBub3RpZnkgdGhlIHNjaGVkdWxlciBhdCBhbGxcbiAgICAgIC8vIGF1dG9tYXRpY2FsbHkuIFdlIGRvIG5vdCBrbm93IHRoYXQgYSBkZXZlbG9wZXIgbWFkZSBhIGNoYW5nZSBpbiB0aGUgbGlzdGVuZXIgY2FsbGJhY2sgdGhhdFxuICAgICAgLy8gcmVxdWlyZXMgYW4gYEFwcGxpY2F0aW9uUmVmLnRpY2tgIChzeW5jaHJvbml6ZSB0ZW1wbGF0ZXMgLyBydW4gcmVuZGVyIGhvb2tzKS4gV2UgZG8gdGhpc1xuICAgICAgLy8gb25seSBmb3IgYW4gZWFzaWVyIG1pZ3JhdGlvbiBmcm9tIE9uUHVzaCBjb21wb25lbnRzIHRvIHpvbmVsZXNzLiBCZWNhdXNlIGxpc3RlbmVycyBhcmVcbiAgICAgIC8vIHVzdWFsbHkgZXhlY3V0ZWQgaW5zaWRlIHRoZSBBbmd1bGFyIHpvbmUgYW5kIGxpc3RlbmVycyBhdXRvbWF0aWNhbGx5IGNhbGwgYG1hcmtWaWV3RGlydHlgLFxuICAgICAgLy8gZGV2ZWxvcGVycyBuZXZlciBuZWVkZWQgdG8gbWFudWFsbHkgdXNlIGBDaGFuZ2VEZXRlY3RvclJlZi5tYXJrRm9yQ2hlY2tgIG9yIHNvbWUgb3RoZXIgQVBJXG4gICAgICAvLyB0byBtYWtlIGxpc3RlbmVyIGNhbGxiYWNrcyB3b3JrIGNvcnJlY3RseSB3aXRoIGBPblB1c2hgIGNvbXBvbmVudHMuXG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHN3aXRjaCAoc291cmNlKSB7XG4gICAgICBjYXNlIE5vdGlmaWNhdGlvblNvdXJjZS5NYXJrQW5jZXN0b3JzRm9yVHJhdmVyc2FsOiB7XG4gICAgICAgIHRoaXMuYXBwUmVmLmRpcnR5RmxhZ3MgfD0gQXBwbGljYXRpb25SZWZEaXJ0eUZsYWdzLlZpZXdUcmVlVHJhdmVyc2FsO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGNhc2UgTm90aWZpY2F0aW9uU291cmNlLkRlYnVnQXBwbHlDaGFuZ2VzOlxuICAgICAgY2FzZSBOb3RpZmljYXRpb25Tb3VyY2UuRGVmZXJCbG9ja1N0YXRlVXBkYXRlOlxuICAgICAgY2FzZSBOb3RpZmljYXRpb25Tb3VyY2UuTWFya0ZvckNoZWNrOlxuICAgICAgY2FzZSBOb3RpZmljYXRpb25Tb3VyY2UuTGlzdGVuZXI6XG4gICAgICBjYXNlIE5vdGlmaWNhdGlvblNvdXJjZS5TZXRJbnB1dDoge1xuICAgICAgICB0aGlzLmFwcFJlZi5kaXJ0eUZsYWdzIHw9IEFwcGxpY2F0aW9uUmVmRGlydHlGbGFncy5WaWV3VHJlZUNoZWNrO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGNhc2UgTm90aWZpY2F0aW9uU291cmNlLkRlZmVycmVkUmVuZGVySG9vazoge1xuICAgICAgICAvLyBSZW5kZXIgaG9va3MgYXJlIFwiZGVmZXJyZWRcIiB3aGVuIHRoZXkncmUgdHJpZ2dlcmVkIGZyb20gb3RoZXIgcmVuZGVyIGhvb2tzLiBVc2luZyB0aGVcbiAgICAgICAgLy8gZGVmZXJyZWQgZGlydHkgZmxhZ3MgZW5zdXJlcyB0aGF0IGFkZGluZyBuZXcgaG9va3MgZG9lc24ndCBhdXRvbWF0aWNhbGx5IHRyaWdnZXIgYSBsb29wXG4gICAgICAgIC8vIGluc2lkZSB0aWNrKCkuXG4gICAgICAgIHRoaXMuYXBwUmVmLmRlZmVycmVkRGlydHlGbGFncyB8PSBBcHBsaWNhdGlvblJlZkRpcnR5RmxhZ3MuQWZ0ZXJSZW5kZXI7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgY2FzZSBOb3RpZmljYXRpb25Tb3VyY2UuVmlld0RldGFjaGVkRnJvbURPTTpcbiAgICAgIGNhc2UgTm90aWZpY2F0aW9uU291cmNlLlZpZXdBdHRhY2hlZDpcbiAgICAgIGNhc2UgTm90aWZpY2F0aW9uU291cmNlLlJlbmRlckhvb2s6XG4gICAgICBjYXNlIE5vdGlmaWNhdGlvblNvdXJjZS5Bc3luY0FuaW1hdGlvbnNMb2FkZWQ6XG4gICAgICBkZWZhdWx0OiB7XG4gICAgICAgIC8vIFRoZXNlIG5vdGlmaWNhdGlvbnMgb25seSBzY2hlZHVsZSBhIHRpY2sgYnV0IGRvIG5vdCBjaGFuZ2Ugd2hldGhlciB3ZSBzaG91bGQgcmVmcmVzaFxuICAgICAgICAvLyB2aWV3cy4gSW5zdGVhZCwgd2Ugb25seSBuZWVkIHRvIHJ1biByZW5kZXIgaG9va3MgdW5sZXNzIGFub3RoZXIgbm90aWZpY2F0aW9uIGZyb20gdGhlXG4gICAgICAgIC8vIG90aGVyIHNldCBpcyBhbHNvIHJlY2VpdmVkIGJlZm9yZSBgdGlja2AgaGFwcGVucy5cbiAgICAgICAgdGhpcy5hcHBSZWYuZGlydHlGbGFncyB8PSBBcHBsaWNhdGlvblJlZkRpcnR5RmxhZ3MuQWZ0ZXJSZW5kZXI7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKCF0aGlzLnNob3VsZFNjaGVkdWxlVGljaygpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBuZ0Rldk1vZGUgPT09ICd1bmRlZmluZWQnIHx8IG5nRGV2TW9kZSkge1xuICAgICAgaWYgKHRoaXMudXNlTWljcm90YXNrU2NoZWR1bGVyKSB7XG4gICAgICAgIHRyYWNrTWljcm90YXNrTm90aWZpY2F0aW9uRm9yRGVidWdnaW5nKCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zZWN1dGl2ZU1pY3JvdGFza05vdGlmaWNhdGlvbnMgPSAwO1xuICAgICAgICBzdGFja0Zyb21MYXN0RmV3Tm90aWZpY2F0aW9ucy5sZW5ndGggPSAwO1xuICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IHNjaGVkdWxlQ2FsbGJhY2sgPSB0aGlzLnVzZU1pY3JvdGFza1NjaGVkdWxlclxuICAgICAgPyBzY2hlZHVsZUNhbGxiYWNrV2l0aE1pY3JvdGFza1xuICAgICAgOiBzY2hlZHVsZUNhbGxiYWNrV2l0aFJhZlJhY2U7XG4gICAgdGhpcy5wZW5kaW5nUmVuZGVyVGFza0lkID0gdGhpcy50YXNrU2VydmljZS5hZGQoKTtcbiAgICBpZiAodGhpcy5zY2hlZHVsZUluUm9vdFpvbmUpIHtcbiAgICAgIHRoaXMuY2FuY2VsU2NoZWR1bGVkQ2FsbGJhY2sgPSBab25lLnJvb3QucnVuKCgpID0+IHNjaGVkdWxlQ2FsbGJhY2soKCkgPT4gdGhpcy50aWNrKCkpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5jYW5jZWxTY2hlZHVsZWRDYWxsYmFjayA9IHRoaXMubmdab25lLnJ1bk91dHNpZGVBbmd1bGFyKCgpID0+XG4gICAgICAgIHNjaGVkdWxlQ2FsbGJhY2soKCkgPT4gdGhpcy50aWNrKCkpLFxuICAgICAgKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIHNob3VsZFNjaGVkdWxlVGljaygpOiBib29sZWFuIHtcbiAgICBpZiAodGhpcy5kaXNhYmxlU2NoZWR1bGluZykge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICAvLyBhbHJlYWR5IHNjaGVkdWxlZCBvciBydW5uaW5nXG4gICAgaWYgKHRoaXMucGVuZGluZ1JlbmRlclRhc2tJZCAhPT0gbnVsbCB8fCB0aGlzLnJ1bm5pbmdUaWNrIHx8IHRoaXMuYXBwUmVmLl9ydW5uaW5nVGljaykge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICAvLyBJZiB3ZSdyZSBpbnNpZGUgdGhlIHpvbmUgZG9uJ3QgYm90aGVyIHdpdGggc2NoZWR1bGVyLiBab25lIHdpbGwgc3RhYmlsaXplXG4gICAgLy8gZXZlbnR1YWxseSBhbmQgcnVuIGNoYW5nZSBkZXRlY3Rpb24uXG4gICAgaWYgKFxuICAgICAgIXRoaXMuem9uZWxlc3NFbmFibGVkICYmXG4gICAgICB0aGlzLnpvbmVJc0RlZmluZWQgJiZcbiAgICAgIFpvbmUuY3VycmVudC5nZXQoYW5ndWxhclpvbmVJbnN0YW5jZUlkUHJvcGVydHkgKyB0aGlzLmFuZ3VsYXJab25lSWQpXG4gICAgKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICAvKipcbiAgICogQ2FsbHMgQXBwbGljYXRpb25SZWYuX3RpY2sgaW5zaWRlIHRoZSBgTmdab25lYC5cbiAgICpcbiAgICogQ2FsbGluZyBgdGlja2AgZGlyZWN0bHkgcnVucyBjaGFuZ2UgZGV0ZWN0aW9uIGFuZCBjYW5jZWxzIGFueSBjaGFuZ2UgZGV0ZWN0aW9uIHRoYXQgaGFkIGJlZW5cbiAgICogc2NoZWR1bGVkIHByZXZpb3VzbHkuXG4gICAqXG4gICAqIEBwYXJhbSBzaG91bGRSZWZyZXNoVmlld3MgUGFzc2VkIGRpcmVjdGx5IHRvIGBBcHBsaWNhdGlvblJlZi5fdGlja2AgYW5kIHNraXBzIHN0cmFpZ2h0IHRvXG4gICAqICAgICByZW5kZXIgaG9va3Mgd2hlbiBgZmFsc2VgLlxuICAgKi9cbiAgcHJpdmF0ZSB0aWNrKCk6IHZvaWQge1xuICAgIC8vIFdoZW4gbmdab25lLnJ1biBiZWxvdyBleGl0cywgb25NaWNyb3Rhc2tFbXB0eSBtYXkgZW1pdCBpZiB0aGUgem9uZSBpc1xuICAgIC8vIHN0YWJsZS4gV2Ugd2FudCB0byBwcmV2ZW50IGRvdWJsZSB0aWNraW5nIHNvIHdlIHRyYWNrIHdoZXRoZXIgdGhlIHRpY2sgaXNcbiAgICAvLyBhbHJlYWR5IHJ1bm5pbmcgYW5kIHNraXAgaXQgaWYgc28uXG4gICAgaWYgKHRoaXMucnVubmluZ1RpY2sgfHwgdGhpcy5hcHBSZWYuZGVzdHJveWVkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gVGhlIHNjaGVkdWxlciB1c2VkIHRvIHBhc3MgXCJ3aGV0aGVyIHRvIGNoZWNrIHZpZXdzXCIgYXMgYSBib29sZWFuIGZsYWcgaW5zdGVhZCBvZiBzZXR0aW5nXG4gICAgLy8gZmluZS1ncmFpbmVkIGRpcnRpbmVzcyBmbGFncywgYW5kIGdsb2JhbCBjaGVja2luZyB3YXMgYWx3YXlzIHVzZWQgb24gdGhlIGZpcnN0IHBhc3MuIFRoaXNcbiAgICAvLyBjcmVhdGVkIGFuIGludGVyZXN0aW5nIGVkZ2UgY2FzZTogaWYgYSBub3RpZmljYXRpb24gbWFkZSBhIHZpZXcgZGlydHkgYW5kIHRoZW4gdGlja2VkIHZpYSB0aGVcbiAgICAvLyBzY2hlZHVsZXIgKGFuZCBub3QgdGhlIHpvbmUpIGEgZ2xvYmFsIGNoZWNrIHdhcyBzdGlsbCBwZXJmb3JtZWQuXG4gICAgLy9cbiAgICAvLyBJZGVhbGx5LCB0aGlzIHdvdWxkIG5vdCBiZSB0aGUgY2FzZSwgYW5kIG9ubHkgem9uZS1iYXNlZCB0aWNrcyB3b3VsZCBkbyBnbG9iYWwgcGFzc2VzLlxuICAgIC8vIEhvd2V2ZXIgdGhpcyBpcyBhIGJyZWFraW5nIGNoYW5nZSBhbmQgcmVxdWlyZXMgZml4ZXMgaW4gZzMuIFVudGlsIHRoaXMgY2xlYW51cCBjYW4gYmUgZG9uZSxcbiAgICAvLyB3ZSBhZGQgdGhlIGBWaWV3VHJlZUdsb2JhbGAgZmxhZyB0byByZXF1ZXN0IGEgZ2xvYmFsIGNoZWNrIGlmIGFueSB2aWV3cyBhcmUgZGlydHkgaW4gYVxuICAgIC8vIHNjaGVkdWxlZCB0aWNrICh1bmxlc3Mgem9uZWxlc3MgaXMgZW5hYmxlZCwgaW4gd2hpY2ggY2FzZSBnbG9iYWwgY2hlY2tzIGFyZW4ndCByZWFsbHkgYVxuICAgIC8vIHRoaW5nKS5cbiAgICAvL1xuICAgIC8vIFRPRE8oYWx4aHViKTogY2xlYW4gdXAgYW5kIHJlbW92ZSB0aGlzIHdvcmthcm91bmQgYXMgYSBicmVha2luZyBjaGFuZ2UuXG4gICAgaWYgKCF0aGlzLnpvbmVsZXNzRW5hYmxlZCAmJiB0aGlzLmFwcFJlZi5kaXJ0eUZsYWdzICYgQXBwbGljYXRpb25SZWZEaXJ0eUZsYWdzLlZpZXdUcmVlQW55KSB7XG4gICAgICB0aGlzLmFwcFJlZi5kaXJ0eUZsYWdzIHw9IEFwcGxpY2F0aW9uUmVmRGlydHlGbGFncy5WaWV3VHJlZUdsb2JhbDtcbiAgICB9XG5cbiAgICBjb25zdCB0YXNrID0gdGhpcy50YXNrU2VydmljZS5hZGQoKTtcbiAgICB0cnkge1xuICAgICAgdGhpcy5uZ1pvbmUucnVuKFxuICAgICAgICAoKSA9PiB7XG4gICAgICAgICAgdGhpcy5ydW5uaW5nVGljayA9IHRydWU7XG4gICAgICAgICAgdGhpcy5hcHBSZWYuX3RpY2soKTtcbiAgICAgICAgfSxcbiAgICAgICAgdW5kZWZpbmVkLFxuICAgICAgICB0aGlzLnNjaGVkdWxlclRpY2tBcHBseUFyZ3MsXG4gICAgICApO1xuICAgIH0gY2F0Y2ggKGU6IHVua25vd24pIHtcbiAgICAgIHRoaXMudGFza1NlcnZpY2UucmVtb3ZlKHRhc2spO1xuICAgICAgdGhyb3cgZTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgdGhpcy5jbGVhbnVwKCk7XG4gICAgfVxuICAgIC8vIElmIHdlJ3JlIG5vdGlmaWVkIG9mIGEgY2hhbmdlIHdpdGhpbiAxIG1pY3JvdGFzayBvZiBydW5uaW5nIGNoYW5nZVxuICAgIC8vIGRldGVjdGlvbiwgcnVuIGFub3RoZXIgcm91bmQgaW4gdGhlIHNhbWUgZXZlbnQgbG9vcC4gVGhpcyBhbGxvd3MgY29kZVxuICAgIC8vIHdoaWNoIHVzZXMgUHJvbWlzZS5yZXNvbHZlIChzZWUgTmdNb2RlbCkgdG8gYXZvaWRcbiAgICAvLyBFeHByZXNzaW9uQ2hhbmdlZC4uLkVycm9yIHRvIHN0aWxsIGJlIHJlZmxlY3RlZCBpbiBhIHNpbmdsZSBicm93c2VyXG4gICAgLy8gcGFpbnQsIGV2ZW4gaWYgdGhhdCBzcGFucyBtdWx0aXBsZSByb3VuZHMgb2YgY2hhbmdlIGRldGVjdGlvbi5cbiAgICB0aGlzLnVzZU1pY3JvdGFza1NjaGVkdWxlciA9IHRydWU7XG4gICAgc2NoZWR1bGVDYWxsYmFja1dpdGhNaWNyb3Rhc2soKCkgPT4ge1xuICAgICAgdGhpcy51c2VNaWNyb3Rhc2tTY2hlZHVsZXIgPSBmYWxzZTtcbiAgICAgIHRoaXMudGFza1NlcnZpY2UucmVtb3ZlKHRhc2spO1xuICAgIH0pO1xuICB9XG5cbiAgbmdPbkRlc3Ryb3koKSB7XG4gICAgdGhpcy5zdWJzY3JpcHRpb25zLnVuc3Vic2NyaWJlKCk7XG4gICAgdGhpcy5jbGVhbnVwKCk7XG4gIH1cblxuICBwcml2YXRlIGNsZWFudXAoKSB7XG4gICAgdGhpcy5ydW5uaW5nVGljayA9IGZhbHNlO1xuICAgIHRoaXMuY2FuY2VsU2NoZWR1bGVkQ2FsbGJhY2s/LigpO1xuICAgIHRoaXMuY2FuY2VsU2NoZWR1bGVkQ2FsbGJhY2sgPSBudWxsO1xuICAgIC8vIElmIHRoaXMgaXMgdGhlIGxhc3QgdGFzaywgdGhlIHNlcnZpY2Ugd2lsbCBzeW5jaHJvbm91c2x5IGVtaXQgYSBzdGFibGVcbiAgICAvLyBub3RpZmljYXRpb24uIElmIHRoZXJlIGlzIGEgc3Vic2NyaWJlciB0aGF0IHRoZW4gYWN0cyBpbiBhIHdheSB0aGF0XG4gICAgLy8gdHJpZXMgdG8gbm90aWZ5IHRoZSBzY2hlZHVsZXIgYWdhaW4sIHdlIG5lZWQgdG8gYmUgYWJsZSB0byByZXNwb25kIHRvXG4gICAgLy8gc2NoZWR1bGUgYSBuZXcgY2hhbmdlIGRldGVjdGlvbi4gVGhlcmVmb3JlLCB3ZSBzaG91bGQgY2xlYXIgdGhlIHRhc2sgSURcbiAgICAvLyBiZWZvcmUgcmVtb3ZpbmcgaXQgZnJvbSB0aGUgcGVuZGluZyB0YXNrcyAob3IgdGhlIHRhc2tzIHNlcnZpY2Ugc2hvdWxkXG4gICAgLy8gbm90IHN5bmNocm9ub3VzbHkgZW1pdCBzdGFibGUsIHNpbWlsYXIgdG8gaG93IFpvbmUgc3RhYmxlbmVzcyBvbmx5XG4gICAgLy8gaGFwcGVucyBpZiBpdCdzIHN0aWxsIHN0YWJsZSBhZnRlciBhIG1pY3JvdGFzaykuXG4gICAgaWYgKHRoaXMucGVuZGluZ1JlbmRlclRhc2tJZCAhPT0gbnVsbCkge1xuICAgICAgY29uc3QgdGFza0lkID0gdGhpcy5wZW5kaW5nUmVuZGVyVGFza0lkO1xuICAgICAgdGhpcy5wZW5kaW5nUmVuZGVyVGFza0lkID0gbnVsbDtcbiAgICAgIHRoaXMudGFza1NlcnZpY2UucmVtb3ZlKHRhc2tJZCk7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogUHJvdmlkZXMgY2hhbmdlIGRldGVjdGlvbiB3aXRob3V0IFpvbmVKUyBmb3IgdGhlIGFwcGxpY2F0aW9uIGJvb3RzdHJhcHBlZCB1c2luZ1xuICogYGJvb3RzdHJhcEFwcGxpY2F0aW9uYC5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIGFsbG93cyB5b3UgdG8gY29uZmlndXJlIHRoZSBhcHBsaWNhdGlvbiB0byBub3QgdXNlIHRoZSBzdGF0ZS9zdGF0ZSBjaGFuZ2VzIG9mXG4gKiBab25lSlMgdG8gc2NoZWR1bGUgY2hhbmdlIGRldGVjdGlvbiBpbiB0aGUgYXBwbGljYXRpb24uIFRoaXMgd2lsbCB3b3JrIHdoZW4gWm9uZUpTIGlzIG5vdCBwcmVzZW50XG4gKiBvbiB0aGUgcGFnZSBhdCBhbGwgb3IgaWYgaXQgZXhpc3RzIGJlY2F1c2Ugc29tZXRoaW5nIGVsc2UgaXMgdXNpbmcgaXQgKGVpdGhlciBhbm90aGVyIEFuZ3VsYXJcbiAqIGFwcGxpY2F0aW9uIHdoaWNoIHVzZXMgWm9uZUpTIGZvciBzY2hlZHVsaW5nIG9yIHNvbWUgb3RoZXIgbGlicmFyeSB0aGF0IHJlbGllcyBvbiBab25lSlMpLlxuICpcbiAqIFRoaXMgY2FuIGFsc28gYmUgYWRkZWQgdG8gdGhlIGBUZXN0QmVkYCBwcm92aWRlcnMgdG8gY29uZmlndXJlIHRoZSB0ZXN0IGVudmlyb25tZW50IHRvIG1vcmVcbiAqIGNsb3NlbHkgbWF0Y2ggcHJvZHVjdGlvbiBiZWhhdmlvci4gVGhpcyB3aWxsIGhlbHAgZ2l2ZSBoaWdoZXIgY29uZmlkZW5jZSB0aGF0IGNvbXBvbmVudHMgYXJlXG4gKiBjb21wYXRpYmxlIHdpdGggem9uZWxlc3MgY2hhbmdlIGRldGVjdGlvbi5cbiAqXG4gKiBab25lSlMgdXNlcyBicm93c2VyIGV2ZW50cyB0byB0cmlnZ2VyIGNoYW5nZSBkZXRlY3Rpb24uIFdoZW4gdXNpbmcgdGhpcyBwcm92aWRlciwgQW5ndWxhciB3aWxsXG4gKiBpbnN0ZWFkIHVzZSBBbmd1bGFyIEFQSXMgdG8gc2NoZWR1bGUgY2hhbmdlIGRldGVjdGlvbi4gVGhlc2UgQVBJcyBpbmNsdWRlOlxuICpcbiAqIC0gYENoYW5nZURldGVjdG9yUmVmLm1hcmtGb3JDaGVja2BcbiAqIC0gYENvbXBvbmVudFJlZi5zZXRJbnB1dGBcbiAqIC0gdXBkYXRpbmcgYSBzaWduYWwgdGhhdCBpcyByZWFkIGluIGEgdGVtcGxhdGVcbiAqIC0gd2hlbiBib3VuZCBob3N0IG9yIHRlbXBsYXRlIGxpc3RlbmVycyBhcmUgdHJpZ2dlcmVkXG4gKiAtIGF0dGFjaGluZyBhIHZpZXcgdGhhdCB3YXMgbWFya2VkIGRpcnR5IGJ5IG9uZSBvZiB0aGUgYWJvdmVcbiAqIC0gcmVtb3ZpbmcgYSB2aWV3XG4gKiAtIHJlZ2lzdGVyaW5nIGEgcmVuZGVyIGhvb2sgKHRlbXBsYXRlcyBhcmUgb25seSByZWZyZXNoZWQgaWYgcmVuZGVyIGhvb2tzIGRvIG9uZSBvZiB0aGUgYWJvdmUpXG4gKlxuICogQHVzYWdlTm90ZXNcbiAqIGBgYHR5cGVzY3JpcHRcbiAqIGJvb3RzdHJhcEFwcGxpY2F0aW9uKE15QXBwLCB7cHJvdmlkZXJzOiBbXG4gKiAgIHByb3ZpZGVFeHBlcmltZW50YWxab25lbGVzc0NoYW5nZURldGVjdGlvbigpLFxuICogXX0pO1xuICogYGBgXG4gKlxuICogVGhpcyBBUEkgaXMgZXhwZXJpbWVudGFsLiBOZWl0aGVyIHRoZSBzaGFwZSwgbm9yIHRoZSB1bmRlcmx5aW5nIGJlaGF2aW9yIGlzIHN0YWJsZSBhbmQgY2FuIGNoYW5nZVxuICogaW4gcGF0Y2ggdmVyc2lvbnMuIFRoZXJlIGFyZSBrbm93biBmZWF0dXJlIGdhcHMgYW5kIEFQSSBlcmdvbm9taWMgY29uc2lkZXJhdGlvbnMuIFdlIHdpbGwgaXRlcmF0ZVxuICogb24gdGhlIGV4YWN0IEFQSSBiYXNlZCBvbiB0aGUgZmVlZGJhY2sgYW5kIG91ciB1bmRlcnN0YW5kaW5nIG9mIHRoZSBwcm9ibGVtIGFuZCBzb2x1dGlvbiBzcGFjZS5cbiAqXG4gKiBAcHVibGljQXBpXG4gKiBAZXhwZXJpbWVudGFsXG4gKiBAc2VlIFtib290c3RyYXBBcHBsaWNhdGlvbl0oL2FwaS9wbGF0Zm9ybS1icm93c2VyL2Jvb3RzdHJhcEFwcGxpY2F0aW9uKVxuICovXG5leHBvcnQgZnVuY3Rpb24gcHJvdmlkZUV4cGVyaW1lbnRhbFpvbmVsZXNzQ2hhbmdlRGV0ZWN0aW9uKCk6IEVudmlyb25tZW50UHJvdmlkZXJzIHtcbiAgcGVyZm9ybWFuY2VNYXJrRmVhdHVyZSgnTmdab25lbGVzcycpO1xuXG4gIGlmICgodHlwZW9mIG5nRGV2TW9kZSA9PT0gJ3VuZGVmaW5lZCcgfHwgbmdEZXZNb2RlKSAmJiB0eXBlb2YgWm9uZSAhPT0gJ3VuZGVmaW5lZCcgJiYgWm9uZSkge1xuICAgIGNvbnN0IG1lc3NhZ2UgPSBmb3JtYXRSdW50aW1lRXJyb3IoXG4gICAgICBSdW50aW1lRXJyb3JDb2RlLlVORVhQRUNURURfWk9ORUpTX1BSRVNFTlRfSU5fWk9ORUxFU1NfTU9ERSxcbiAgICAgIGBUaGUgYXBwbGljYXRpb24gaXMgdXNpbmcgem9uZWxlc3MgY2hhbmdlIGRldGVjdGlvbiwgYnV0IGlzIHN0aWxsIGxvYWRpbmcgWm9uZS5qcy4gYCArXG4gICAgICAgIGBDb25zaWRlciByZW1vdmluZyBab25lLmpzIHRvIGdldCB0aGUgZnVsbCBiZW5lZml0cyBvZiB6b25lbGVzcy4gYCArXG4gICAgICAgIGBJbiBhcHBsaWNhdGlvbnMgdXNpbmcgdGhlIEFuZ3VsYXIgQ0xJLCBab25lLmpzIGlzIHR5cGljYWxseSBpbmNsdWRlZCBpbiB0aGUgXCJwb2x5ZmlsbHNcIiBzZWN0aW9uIG9mIHRoZSBhbmd1bGFyLmpzb24gZmlsZS5gLFxuICAgICk7XG4gICAgY29uc29sZS53YXJuKG1lc3NhZ2UpO1xuICB9XG5cbiAgcmV0dXJuIG1ha2VFbnZpcm9ubWVudFByb3ZpZGVycyhbXG4gICAge3Byb3ZpZGU6IENoYW5nZURldGVjdGlvblNjaGVkdWxlciwgdXNlRXhpc3Rpbmc6IENoYW5nZURldGVjdGlvblNjaGVkdWxlckltcGx9LFxuICAgIHtwcm92aWRlOiBOZ1pvbmUsIHVzZUNsYXNzOiBOb29wTmdab25lfSxcbiAgICB7cHJvdmlkZTogWk9ORUxFU1NfRU5BQkxFRCwgdXNlVmFsdWU6IHRydWV9LFxuICAgIHtwcm92aWRlOiBTQ0hFRFVMRV9JTl9ST09UX1pPTkUsIHVzZVZhbHVlOiBmYWxzZX0sXG4gICAgdHlwZW9mIG5nRGV2TW9kZSA9PT0gJ3VuZGVmaW5lZCcgfHwgbmdEZXZNb2RlXG4gICAgICA/IFt7cHJvdmlkZTogUFJPVklERURfWk9ORUxFU1MsIHVzZVZhbHVlOiB0cnVlfV1cbiAgICAgIDogW10sXG4gIF0pO1xufVxuIl19