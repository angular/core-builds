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
        let force = false;
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
            case 8 /* NotificationSource.DeferredRenderHook */: {
                // Render hooks are "deferred" when they're triggered from other render hooks. Using the
                // deferred dirty flags ensures that adding new hooks doesn't automatically trigger a loop
                // inside tick().
                this.appRef.deferredDirtyFlags |= 8 /* ApplicationRefDirtyFlags.AfterRender */;
                break;
            }
            case 6 /* NotificationSource.CustomElement */: {
                // We use `ViewTreeTraversal` to ensure we refresh the element even if this is triggered
                // during CD. In practice this is a no-op since the elements code also calls via a
                // `markForRefresh()` API which sends `NotificationSource.MarkAncestorsForTraversal` anyway.
                this.appRef.dirtyFlags |= 2 /* ApplicationRefDirtyFlags.ViewTreeTraversal */;
                force = true;
                break;
            }
            case 10 /* NotificationSource.ViewDetachedFromDOM */:
            case 9 /* NotificationSource.ViewAttached */:
            case 7 /* NotificationSource.RenderHook */:
            case 11 /* NotificationSource.AsyncAnimationsLoaded */:
            default: {
                // These notifications only schedule a tick but do not change whether we should refresh
                // views. Instead, we only need to run render hooks unless another notification from the
                // other set is also received before `tick` happens.
                this.appRef.dirtyFlags |= 8 /* ApplicationRefDirtyFlags.AfterRender */;
            }
        }
        if (!this.shouldScheduleTick(force)) {
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
    shouldScheduleTick(force) {
        if (this.disableScheduling && !force) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiem9uZWxlc3Nfc2NoZWR1bGluZ19pbXBsLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvY2hhbmdlX2RldGVjdGlvbi9zY2hlZHVsaW5nL3pvbmVsZXNzX3NjaGVkdWxpbmdfaW1wbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQUMsWUFBWSxFQUFDLE1BQU0sTUFBTSxDQUFDO0FBRWxDLE9BQU8sRUFBQyxjQUFjLEVBQTJCLE1BQU0sbUNBQW1DLENBQUM7QUFDM0YsT0FBTyxFQUFDLFVBQVUsRUFBQyxNQUFNLHFCQUFxQixDQUFDO0FBQy9DLE9BQU8sRUFBQyxNQUFNLEVBQUMsTUFBTSxpQ0FBaUMsQ0FBQztBQUV2RCxPQUFPLEVBQUMsd0JBQXdCLEVBQUMsTUFBTSw4QkFBOEIsQ0FBQztBQUN0RSxPQUFPLEVBQUMsWUFBWSxFQUFvQixrQkFBa0IsRUFBQyxNQUFNLGNBQWMsQ0FBQztBQUNoRixPQUFPLEVBQUMsWUFBWSxFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFDakQsT0FBTyxFQUNMLDZCQUE2QixFQUM3QiwyQkFBMkIsR0FDNUIsTUFBTSwrQkFBK0IsQ0FBQztBQUN2QyxPQUFPLEVBQUMsc0JBQXNCLEVBQUMsTUFBTSx3QkFBd0IsQ0FBQztBQUM5RCxPQUFPLEVBQUMsTUFBTSxFQUFpQixVQUFVLEVBQUUsNkJBQTZCLEVBQUMsTUFBTSxvQkFBb0IsQ0FBQztBQUVwRyxPQUFPLEVBQ0wsd0JBQXdCLEVBRXhCLGdCQUFnQixFQUNoQixpQkFBaUIsRUFDakIsMkJBQTJCLEVBQzNCLHFCQUFxQixHQUN0QixNQUFNLHVCQUF1QixDQUFDOztBQUUvQixNQUFNLHdDQUF3QyxHQUFHLEdBQUcsQ0FBQztBQUNyRCxJQUFJLGlDQUFpQyxHQUFHLENBQUMsQ0FBQztBQUMxQyxJQUFJLDZCQUE2QixHQUFhLEVBQUUsQ0FBQztBQUVq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RSxRQUFRLEVBQUUsVUFBVSxFQUFDO1FBQ3ZDLEVBQUMsT0FBTyxFQUFFLGdCQUFnQixFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUM7UUFDM0MsRUFBQyxPQUFPLEVBQUUscUJBQXFCLEVBQUUsUUFBUSxFQUFFLEtBQUssRUFBQztRQUNqRCxPQUFPLFNBQVMsS0FBSyxXQUFXLElBQUksU0FBUztZQUMzQyxDQUFDLENBQUMsQ0FBQyxFQUFDLE9BQU8sRUFBRSxpQkFBaUIsRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFDLENBQUM7WUFDaEQsQ0FBQyxDQUFDLEVBQUU7S0FDUCxDQUFDLENBQUM7QUFDTCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7U3Vic2NyaXB0aW9ufSBmcm9tICdyeGpzJztcblxuaW1wb3J0IHtBcHBsaWNhdGlvblJlZiwgQXBwbGljYXRpb25SZWZEaXJ0eUZsYWdzfSBmcm9tICcuLi8uLi9hcHBsaWNhdGlvbi9hcHBsaWNhdGlvbl9yZWYnO1xuaW1wb3J0IHtJbmplY3RhYmxlfSBmcm9tICcuLi8uLi9kaS9pbmplY3RhYmxlJztcbmltcG9ydCB7aW5qZWN0fSBmcm9tICcuLi8uLi9kaS9pbmplY3Rvcl9jb21wYXRpYmlsaXR5JztcbmltcG9ydCB7RW52aXJvbm1lbnRQcm92aWRlcnN9IGZyb20gJy4uLy4uL2RpL2ludGVyZmFjZS9wcm92aWRlcic7XG5pbXBvcnQge21ha2VFbnZpcm9ubWVudFByb3ZpZGVyc30gZnJvbSAnLi4vLi4vZGkvcHJvdmlkZXJfY29sbGVjdGlvbic7XG5pbXBvcnQge1J1bnRpbWVFcnJvciwgUnVudGltZUVycm9yQ29kZSwgZm9ybWF0UnVudGltZUVycm9yfSBmcm9tICcuLi8uLi9lcnJvcnMnO1xuaW1wb3J0IHtQZW5kaW5nVGFza3N9IGZyb20gJy4uLy4uL3BlbmRpbmdfdGFza3MnO1xuaW1wb3J0IHtcbiAgc2NoZWR1bGVDYWxsYmFja1dpdGhNaWNyb3Rhc2ssXG4gIHNjaGVkdWxlQ2FsbGJhY2tXaXRoUmFmUmFjZSxcbn0gZnJvbSAnLi4vLi4vdXRpbC9jYWxsYmFja19zY2hlZHVsZXInO1xuaW1wb3J0IHtwZXJmb3JtYW5jZU1hcmtGZWF0dXJlfSBmcm9tICcuLi8uLi91dGlsL3BlcmZvcm1hbmNlJztcbmltcG9ydCB7Tmdab25lLCBOZ1pvbmVQcml2YXRlLCBOb29wTmdab25lLCBhbmd1bGFyWm9uZUluc3RhbmNlSWRQcm9wZXJ0eX0gZnJvbSAnLi4vLi4vem9uZS9uZ196b25lJztcblxuaW1wb3J0IHtcbiAgQ2hhbmdlRGV0ZWN0aW9uU2NoZWR1bGVyLFxuICBOb3RpZmljYXRpb25Tb3VyY2UsXG4gIFpPTkVMRVNTX0VOQUJMRUQsXG4gIFBST1ZJREVEX1pPTkVMRVNTLFxuICBaT05FTEVTU19TQ0hFRFVMRVJfRElTQUJMRUQsXG4gIFNDSEVEVUxFX0lOX1JPT1RfWk9ORSxcbn0gZnJvbSAnLi96b25lbGVzc19zY2hlZHVsaW5nJztcblxuY29uc3QgQ09OU0VDVVRJVkVfTUlDUk9UQVNLX05PVElGSUNBVElPTl9MSU1JVCA9IDEwMDtcbmxldCBjb25zZWN1dGl2ZU1pY3JvdGFza05vdGlmaWNhdGlvbnMgPSAwO1xubGV0IHN0YWNrRnJvbUxhc3RGZXdOb3RpZmljYXRpb25zOiBzdHJpbmdbXSA9IFtdO1xuXG5mdW5jdGlvbiB0cmFja01pY3JvdGFza05vdGlmaWNhdGlvbkZvckRlYnVnZ2luZygpIHtcbiAgY29uc2VjdXRpdmVNaWNyb3Rhc2tOb3RpZmljYXRpb25zKys7XG4gIGlmIChDT05TRUNVVElWRV9NSUNST1RBU0tfTk9USUZJQ0FUSU9OX0xJTUlUIC0gY29uc2VjdXRpdmVNaWNyb3Rhc2tOb3RpZmljYXRpb25zIDwgNSkge1xuICAgIGNvbnN0IHN0YWNrID0gbmV3IEVycm9yKCkuc3RhY2s7XG4gICAgaWYgKHN0YWNrKSB7XG4gICAgICBzdGFja0Zyb21MYXN0RmV3Tm90aWZpY2F0aW9ucy5wdXNoKHN0YWNrKTtcbiAgICB9XG4gIH1cblxuICBpZiAoY29uc2VjdXRpdmVNaWNyb3Rhc2tOb3RpZmljYXRpb25zID09PSBDT05TRUNVVElWRV9NSUNST1RBU0tfTk9USUZJQ0FUSU9OX0xJTUlUKSB7XG4gICAgdGhyb3cgbmV3IFJ1bnRpbWVFcnJvcihcbiAgICAgIFJ1bnRpbWVFcnJvckNvZGUuSU5GSU5JVEVfQ0hBTkdFX0RFVEVDVElPTixcbiAgICAgICdBbmd1bGFyIGNvdWxkIG5vdCBzdGFiaWxpemUgYmVjYXVzZSB0aGVyZSB3ZXJlIGVuZGxlc3MgY2hhbmdlIG5vdGlmaWNhdGlvbnMgd2l0aGluIHRoZSBicm93c2VyIGV2ZW50IGxvb3AuICcgK1xuICAgICAgICAnVGhlIHN0YWNrIGZyb20gdGhlIGxhc3Qgc2V2ZXJhbCBub3RpZmljYXRpb25zOiBcXG4nICtcbiAgICAgICAgc3RhY2tGcm9tTGFzdEZld05vdGlmaWNhdGlvbnMuam9pbignXFxuJyksXG4gICAgKTtcbiAgfVxufVxuXG5ASW5qZWN0YWJsZSh7cHJvdmlkZWRJbjogJ3Jvb3QnfSlcbmV4cG9ydCBjbGFzcyBDaGFuZ2VEZXRlY3Rpb25TY2hlZHVsZXJJbXBsIGltcGxlbWVudHMgQ2hhbmdlRGV0ZWN0aW9uU2NoZWR1bGVyIHtcbiAgcHJpdmF0ZSByZWFkb25seSBhcHBSZWYgPSBpbmplY3QoQXBwbGljYXRpb25SZWYpO1xuICBwcml2YXRlIHJlYWRvbmx5IHRhc2tTZXJ2aWNlID0gaW5qZWN0KFBlbmRpbmdUYXNrcyk7XG4gIHByaXZhdGUgcmVhZG9ubHkgbmdab25lID0gaW5qZWN0KE5nWm9uZSk7XG4gIHByaXZhdGUgcmVhZG9ubHkgem9uZWxlc3NFbmFibGVkID0gaW5qZWN0KFpPTkVMRVNTX0VOQUJMRUQpO1xuICBwcml2YXRlIHJlYWRvbmx5IGRpc2FibGVTY2hlZHVsaW5nID1cbiAgICBpbmplY3QoWk9ORUxFU1NfU0NIRURVTEVSX0RJU0FCTEVELCB7b3B0aW9uYWw6IHRydWV9KSA/PyBmYWxzZTtcbiAgcHJpdmF0ZSByZWFkb25seSB6b25lSXNEZWZpbmVkID0gdHlwZW9mIFpvbmUgIT09ICd1bmRlZmluZWQnICYmICEhWm9uZS5yb290LnJ1bjtcbiAgcHJpdmF0ZSByZWFkb25seSBzY2hlZHVsZXJUaWNrQXBwbHlBcmdzID0gW3tkYXRhOiB7J19fc2NoZWR1bGVyX3RpY2tfXyc6IHRydWV9fV07XG4gIHByaXZhdGUgcmVhZG9ubHkgc3Vic2NyaXB0aW9ucyA9IG5ldyBTdWJzY3JpcHRpb24oKTtcbiAgcHJpdmF0ZSByZWFkb25seSBhbmd1bGFyWm9uZUlkID0gdGhpcy56b25lSXNEZWZpbmVkXG4gICAgPyAodGhpcy5uZ1pvbmUgYXMgTmdab25lUHJpdmF0ZSkuX2lubmVyPy5nZXQoYW5ndWxhclpvbmVJbnN0YW5jZUlkUHJvcGVydHkpXG4gICAgOiBudWxsO1xuICBwcml2YXRlIHJlYWRvbmx5IHNjaGVkdWxlSW5Sb290Wm9uZSA9XG4gICAgIXRoaXMuem9uZWxlc3NFbmFibGVkICYmXG4gICAgdGhpcy56b25lSXNEZWZpbmVkICYmXG4gICAgKGluamVjdChTQ0hFRFVMRV9JTl9ST09UX1pPTkUsIHtvcHRpb25hbDogdHJ1ZX0pID8/IGZhbHNlKTtcblxuICBwcml2YXRlIGNhbmNlbFNjaGVkdWxlZENhbGxiYWNrOiBudWxsIHwgKCgpID0+IHZvaWQpID0gbnVsbDtcbiAgcHJpdmF0ZSB1c2VNaWNyb3Rhc2tTY2hlZHVsZXIgPSBmYWxzZTtcbiAgcnVubmluZ1RpY2sgPSBmYWxzZTtcbiAgcGVuZGluZ1JlbmRlclRhc2tJZDogbnVtYmVyIHwgbnVsbCA9IG51bGw7XG5cbiAgY29uc3RydWN0b3IoKSB7XG4gICAgdGhpcy5zdWJzY3JpcHRpb25zLmFkZChcbiAgICAgIHRoaXMuYXBwUmVmLmFmdGVyVGljay5zdWJzY3JpYmUoKCkgPT4ge1xuICAgICAgICAvLyBJZiB0aGUgc2NoZWR1bGVyIGlzbid0IHJ1bm5pbmcgYSB0aWNrIGJ1dCB0aGUgYXBwbGljYXRpb24gdGlja2VkLCB0aGF0IG1lYW5zXG4gICAgICAgIC8vIHNvbWVvbmUgY2FsbGVkIEFwcGxpY2F0aW9uUmVmLnRpY2sgbWFudWFsbHkuIEluIHRoaXMgY2FzZSwgd2Ugc2hvdWxkIGNhbmNlbFxuICAgICAgICAvLyBhbnkgY2hhbmdlIGRldGVjdGlvbnMgdGhhdCBoYWQgYmVlbiBzY2hlZHVsZWQgc28gd2UgZG9uJ3QgcnVuIGFuIGV4dHJhIG9uZS5cbiAgICAgICAgaWYgKCF0aGlzLnJ1bm5pbmdUaWNrKSB7XG4gICAgICAgICAgdGhpcy5jbGVhbnVwKCk7XG4gICAgICAgIH1cbiAgICAgIH0pLFxuICAgICk7XG4gICAgdGhpcy5zdWJzY3JpcHRpb25zLmFkZChcbiAgICAgIHRoaXMubmdab25lLm9uVW5zdGFibGUuc3Vic2NyaWJlKCgpID0+IHtcbiAgICAgICAgLy8gSWYgdGhlIHpvbmUgYmVjb21lcyB1bnN0YWJsZSB3aGVuIHdlJ3JlIG5vdCBydW5uaW5nIHRpY2sgKHRoaXMgaGFwcGVucyBmcm9tIHRoZSB6b25lLnJ1biksXG4gICAgICAgIC8vIHdlIHNob3VsZCBjYW5jZWwgYW55IHNjaGVkdWxlZCBjaGFuZ2UgZGV0ZWN0aW9uIGhlcmUgYmVjYXVzZSBhdCB0aGlzIHBvaW50IHdlXG4gICAgICAgIC8vIGtub3cgdGhhdCB0aGUgem9uZSB3aWxsIHN0YWJpbGl6ZSBhdCBzb21lIHBvaW50IGFuZCBydW4gY2hhbmdlIGRldGVjdGlvbiBpdHNlbGYuXG4gICAgICAgIGlmICghdGhpcy5ydW5uaW5nVGljaykge1xuICAgICAgICAgIHRoaXMuY2xlYW51cCgpO1xuICAgICAgICB9XG4gICAgICB9KSxcbiAgICApO1xuXG4gICAgLy8gVE9ETyhhdHNjb3R0KTogVGhlc2UgY29uZGl0aW9ucyB3aWxsIG5lZWQgdG8gY2hhbmdlIHdoZW4gem9uZWxlc3MgaXMgdGhlIGRlZmF1bHRcbiAgICAvLyBJbnN0ZWFkLCB0aGV5IHNob3VsZCBmbGlwIHRvIGNoZWNraW5nIGlmIFpvbmVKUyBzY2hlZHVsaW5nIGlzIHByb3ZpZGVkXG4gICAgdGhpcy5kaXNhYmxlU2NoZWR1bGluZyB8fD1cbiAgICAgICF0aGlzLnpvbmVsZXNzRW5hYmxlZCAmJlxuICAgICAgLy8gTm9vcE5nWm9uZSB3aXRob3V0IGVuYWJsaW5nIHpvbmVsZXNzIG1lYW5zIG5vIHNjaGVkdWxpbmcgd2hhdHNvZXZlclxuICAgICAgKHRoaXMubmdab25lIGluc3RhbmNlb2YgTm9vcE5nWm9uZSB8fFxuICAgICAgICAvLyBUaGUgc2FtZSBnb2VzIGZvciB0aGUgbGFjayBvZiBab25lIHdpdGhvdXQgZW5hYmxpbmcgem9uZWxlc3Mgc2NoZWR1bGluZ1xuICAgICAgICAhdGhpcy56b25lSXNEZWZpbmVkKTtcbiAgfVxuXG4gIG5vdGlmeShzb3VyY2U6IE5vdGlmaWNhdGlvblNvdXJjZSk6IHZvaWQge1xuICAgIGlmICghdGhpcy56b25lbGVzc0VuYWJsZWQgJiYgc291cmNlID09PSBOb3RpZmljYXRpb25Tb3VyY2UuTGlzdGVuZXIpIHtcbiAgICAgIC8vIFdoZW4gdGhlIG5vdGlmaWNhdGlvbiBjb21lcyBmcm9tIGEgbGlzdGVuZXIsIHdlIHNraXAgdGhlIG5vdGlmaWNhdGlvbiB1bmxlc3MgdGhlXG4gICAgICAvLyBhcHBsaWNhdGlvbiBoYXMgZW5hYmxlZCB6b25lbGVzcy4gSWRlYWxseSwgbGlzdGVuZXJzIHdvdWxkbid0IG5vdGlmeSB0aGUgc2NoZWR1bGVyIGF0IGFsbFxuICAgICAgLy8gYXV0b21hdGljYWxseS4gV2UgZG8gbm90IGtub3cgdGhhdCBhIGRldmVsb3BlciBtYWRlIGEgY2hhbmdlIGluIHRoZSBsaXN0ZW5lciBjYWxsYmFjayB0aGF0XG4gICAgICAvLyByZXF1aXJlcyBhbiBgQXBwbGljYXRpb25SZWYudGlja2AgKHN5bmNocm9uaXplIHRlbXBsYXRlcyAvIHJ1biByZW5kZXIgaG9va3MpLiBXZSBkbyB0aGlzXG4gICAgICAvLyBvbmx5IGZvciBhbiBlYXNpZXIgbWlncmF0aW9uIGZyb20gT25QdXNoIGNvbXBvbmVudHMgdG8gem9uZWxlc3MuIEJlY2F1c2UgbGlzdGVuZXJzIGFyZVxuICAgICAgLy8gdXN1YWxseSBleGVjdXRlZCBpbnNpZGUgdGhlIEFuZ3VsYXIgem9uZSBhbmQgbGlzdGVuZXJzIGF1dG9tYXRpY2FsbHkgY2FsbCBgbWFya1ZpZXdEaXJ0eWAsXG4gICAgICAvLyBkZXZlbG9wZXJzIG5ldmVyIG5lZWRlZCB0byBtYW51YWxseSB1c2UgYENoYW5nZURldGVjdG9yUmVmLm1hcmtGb3JDaGVja2Agb3Igc29tZSBvdGhlciBBUElcbiAgICAgIC8vIHRvIG1ha2UgbGlzdGVuZXIgY2FsbGJhY2tzIHdvcmsgY29ycmVjdGx5IHdpdGggYE9uUHVzaGAgY29tcG9uZW50cy5cbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBsZXQgZm9yY2UgPSBmYWxzZTtcblxuICAgIHN3aXRjaCAoc291cmNlKSB7XG4gICAgICBjYXNlIE5vdGlmaWNhdGlvblNvdXJjZS5NYXJrQW5jZXN0b3JzRm9yVHJhdmVyc2FsOiB7XG4gICAgICAgIHRoaXMuYXBwUmVmLmRpcnR5RmxhZ3MgfD0gQXBwbGljYXRpb25SZWZEaXJ0eUZsYWdzLlZpZXdUcmVlVHJhdmVyc2FsO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGNhc2UgTm90aWZpY2F0aW9uU291cmNlLkRlYnVnQXBwbHlDaGFuZ2VzOlxuICAgICAgY2FzZSBOb3RpZmljYXRpb25Tb3VyY2UuRGVmZXJCbG9ja1N0YXRlVXBkYXRlOlxuICAgICAgY2FzZSBOb3RpZmljYXRpb25Tb3VyY2UuTWFya0ZvckNoZWNrOlxuICAgICAgY2FzZSBOb3RpZmljYXRpb25Tb3VyY2UuTGlzdGVuZXI6XG4gICAgICBjYXNlIE5vdGlmaWNhdGlvblNvdXJjZS5TZXRJbnB1dDoge1xuICAgICAgICB0aGlzLmFwcFJlZi5kaXJ0eUZsYWdzIHw9IEFwcGxpY2F0aW9uUmVmRGlydHlGbGFncy5WaWV3VHJlZUNoZWNrO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGNhc2UgTm90aWZpY2F0aW9uU291cmNlLkRlZmVycmVkUmVuZGVySG9vazoge1xuICAgICAgICAvLyBSZW5kZXIgaG9va3MgYXJlIFwiZGVmZXJyZWRcIiB3aGVuIHRoZXkncmUgdHJpZ2dlcmVkIGZyb20gb3RoZXIgcmVuZGVyIGhvb2tzLiBVc2luZyB0aGVcbiAgICAgICAgLy8gZGVmZXJyZWQgZGlydHkgZmxhZ3MgZW5zdXJlcyB0aGF0IGFkZGluZyBuZXcgaG9va3MgZG9lc24ndCBhdXRvbWF0aWNhbGx5IHRyaWdnZXIgYSBsb29wXG4gICAgICAgIC8vIGluc2lkZSB0aWNrKCkuXG4gICAgICAgIHRoaXMuYXBwUmVmLmRlZmVycmVkRGlydHlGbGFncyB8PSBBcHBsaWNhdGlvblJlZkRpcnR5RmxhZ3MuQWZ0ZXJSZW5kZXI7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgY2FzZSBOb3RpZmljYXRpb25Tb3VyY2UuQ3VzdG9tRWxlbWVudDoge1xuICAgICAgICAvLyBXZSB1c2UgYFZpZXdUcmVlVHJhdmVyc2FsYCB0byBlbnN1cmUgd2UgcmVmcmVzaCB0aGUgZWxlbWVudCBldmVuIGlmIHRoaXMgaXMgdHJpZ2dlcmVkXG4gICAgICAgIC8vIGR1cmluZyBDRC4gSW4gcHJhY3RpY2UgdGhpcyBpcyBhIG5vLW9wIHNpbmNlIHRoZSBlbGVtZW50cyBjb2RlIGFsc28gY2FsbHMgdmlhIGFcbiAgICAgICAgLy8gYG1hcmtGb3JSZWZyZXNoKClgIEFQSSB3aGljaCBzZW5kcyBgTm90aWZpY2F0aW9uU291cmNlLk1hcmtBbmNlc3RvcnNGb3JUcmF2ZXJzYWxgIGFueXdheS5cbiAgICAgICAgdGhpcy5hcHBSZWYuZGlydHlGbGFncyB8PSBBcHBsaWNhdGlvblJlZkRpcnR5RmxhZ3MuVmlld1RyZWVUcmF2ZXJzYWw7XG4gICAgICAgIGZvcmNlID0gdHJ1ZTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBjYXNlIE5vdGlmaWNhdGlvblNvdXJjZS5WaWV3RGV0YWNoZWRGcm9tRE9NOlxuICAgICAgY2FzZSBOb3RpZmljYXRpb25Tb3VyY2UuVmlld0F0dGFjaGVkOlxuICAgICAgY2FzZSBOb3RpZmljYXRpb25Tb3VyY2UuUmVuZGVySG9vazpcbiAgICAgIGNhc2UgTm90aWZpY2F0aW9uU291cmNlLkFzeW5jQW5pbWF0aW9uc0xvYWRlZDpcbiAgICAgIGRlZmF1bHQ6IHtcbiAgICAgICAgLy8gVGhlc2Ugbm90aWZpY2F0aW9ucyBvbmx5IHNjaGVkdWxlIGEgdGljayBidXQgZG8gbm90IGNoYW5nZSB3aGV0aGVyIHdlIHNob3VsZCByZWZyZXNoXG4gICAgICAgIC8vIHZpZXdzLiBJbnN0ZWFkLCB3ZSBvbmx5IG5lZWQgdG8gcnVuIHJlbmRlciBob29rcyB1bmxlc3MgYW5vdGhlciBub3RpZmljYXRpb24gZnJvbSB0aGVcbiAgICAgICAgLy8gb3RoZXIgc2V0IGlzIGFsc28gcmVjZWl2ZWQgYmVmb3JlIGB0aWNrYCBoYXBwZW5zLlxuICAgICAgICB0aGlzLmFwcFJlZi5kaXJ0eUZsYWdzIHw9IEFwcGxpY2F0aW9uUmVmRGlydHlGbGFncy5BZnRlclJlbmRlcjtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoIXRoaXMuc2hvdWxkU2NoZWR1bGVUaWNrKGZvcmNlKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmICh0eXBlb2YgbmdEZXZNb2RlID09PSAndW5kZWZpbmVkJyB8fCBuZ0Rldk1vZGUpIHtcbiAgICAgIGlmICh0aGlzLnVzZU1pY3JvdGFza1NjaGVkdWxlcikge1xuICAgICAgICB0cmFja01pY3JvdGFza05vdGlmaWNhdGlvbkZvckRlYnVnZ2luZygpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc2VjdXRpdmVNaWNyb3Rhc2tOb3RpZmljYXRpb25zID0gMDtcbiAgICAgICAgc3RhY2tGcm9tTGFzdEZld05vdGlmaWNhdGlvbnMubGVuZ3RoID0gMDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zdCBzY2hlZHVsZUNhbGxiYWNrID0gdGhpcy51c2VNaWNyb3Rhc2tTY2hlZHVsZXJcbiAgICAgID8gc2NoZWR1bGVDYWxsYmFja1dpdGhNaWNyb3Rhc2tcbiAgICAgIDogc2NoZWR1bGVDYWxsYmFja1dpdGhSYWZSYWNlO1xuICAgIHRoaXMucGVuZGluZ1JlbmRlclRhc2tJZCA9IHRoaXMudGFza1NlcnZpY2UuYWRkKCk7XG4gICAgaWYgKHRoaXMuc2NoZWR1bGVJblJvb3Rab25lKSB7XG4gICAgICB0aGlzLmNhbmNlbFNjaGVkdWxlZENhbGxiYWNrID0gWm9uZS5yb290LnJ1bigoKSA9PiBzY2hlZHVsZUNhbGxiYWNrKCgpID0+IHRoaXMudGljaygpKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuY2FuY2VsU2NoZWR1bGVkQ2FsbGJhY2sgPSB0aGlzLm5nWm9uZS5ydW5PdXRzaWRlQW5ndWxhcigoKSA9PlxuICAgICAgICBzY2hlZHVsZUNhbGxiYWNrKCgpID0+IHRoaXMudGljaygpKSxcbiAgICAgICk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBzaG91bGRTY2hlZHVsZVRpY2soZm9yY2U6IGJvb2xlYW4pOiBib29sZWFuIHtcbiAgICBpZiAodGhpcy5kaXNhYmxlU2NoZWR1bGluZyAmJiAhZm9yY2UpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgLy8gYWxyZWFkeSBzY2hlZHVsZWQgb3IgcnVubmluZ1xuICAgIGlmICh0aGlzLnBlbmRpbmdSZW5kZXJUYXNrSWQgIT09IG51bGwgfHwgdGhpcy5ydW5uaW5nVGljayB8fCB0aGlzLmFwcFJlZi5fcnVubmluZ1RpY2spIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgLy8gSWYgd2UncmUgaW5zaWRlIHRoZSB6b25lIGRvbid0IGJvdGhlciB3aXRoIHNjaGVkdWxlci4gWm9uZSB3aWxsIHN0YWJpbGl6ZVxuICAgIC8vIGV2ZW50dWFsbHkgYW5kIHJ1biBjaGFuZ2UgZGV0ZWN0aW9uLlxuICAgIGlmIChcbiAgICAgICF0aGlzLnpvbmVsZXNzRW5hYmxlZCAmJlxuICAgICAgdGhpcy56b25lSXNEZWZpbmVkICYmXG4gICAgICBab25lLmN1cnJlbnQuZ2V0KGFuZ3VsYXJab25lSW5zdGFuY2VJZFByb3BlcnR5ICsgdGhpcy5hbmd1bGFyWm9uZUlkKVxuICAgICkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgLyoqXG4gICAqIENhbGxzIEFwcGxpY2F0aW9uUmVmLl90aWNrIGluc2lkZSB0aGUgYE5nWm9uZWAuXG4gICAqXG4gICAqIENhbGxpbmcgYHRpY2tgIGRpcmVjdGx5IHJ1bnMgY2hhbmdlIGRldGVjdGlvbiBhbmQgY2FuY2VscyBhbnkgY2hhbmdlIGRldGVjdGlvbiB0aGF0IGhhZCBiZWVuXG4gICAqIHNjaGVkdWxlZCBwcmV2aW91c2x5LlxuICAgKlxuICAgKiBAcGFyYW0gc2hvdWxkUmVmcmVzaFZpZXdzIFBhc3NlZCBkaXJlY3RseSB0byBgQXBwbGljYXRpb25SZWYuX3RpY2tgIGFuZCBza2lwcyBzdHJhaWdodCB0b1xuICAgKiAgICAgcmVuZGVyIGhvb2tzIHdoZW4gYGZhbHNlYC5cbiAgICovXG4gIHByaXZhdGUgdGljaygpOiB2b2lkIHtcbiAgICAvLyBXaGVuIG5nWm9uZS5ydW4gYmVsb3cgZXhpdHMsIG9uTWljcm90YXNrRW1wdHkgbWF5IGVtaXQgaWYgdGhlIHpvbmUgaXNcbiAgICAvLyBzdGFibGUuIFdlIHdhbnQgdG8gcHJldmVudCBkb3VibGUgdGlja2luZyBzbyB3ZSB0cmFjayB3aGV0aGVyIHRoZSB0aWNrIGlzXG4gICAgLy8gYWxyZWFkeSBydW5uaW5nIGFuZCBza2lwIGl0IGlmIHNvLlxuICAgIGlmICh0aGlzLnJ1bm5pbmdUaWNrIHx8IHRoaXMuYXBwUmVmLmRlc3Ryb3llZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIFRoZSBzY2hlZHVsZXIgdXNlZCB0byBwYXNzIFwid2hldGhlciB0byBjaGVjayB2aWV3c1wiIGFzIGEgYm9vbGVhbiBmbGFnIGluc3RlYWQgb2Ygc2V0dGluZ1xuICAgIC8vIGZpbmUtZ3JhaW5lZCBkaXJ0aW5lc3MgZmxhZ3MsIGFuZCBnbG9iYWwgY2hlY2tpbmcgd2FzIGFsd2F5cyB1c2VkIG9uIHRoZSBmaXJzdCBwYXNzLiBUaGlzXG4gICAgLy8gY3JlYXRlZCBhbiBpbnRlcmVzdGluZyBlZGdlIGNhc2U6IGlmIGEgbm90aWZpY2F0aW9uIG1hZGUgYSB2aWV3IGRpcnR5IGFuZCB0aGVuIHRpY2tlZCB2aWEgdGhlXG4gICAgLy8gc2NoZWR1bGVyIChhbmQgbm90IHRoZSB6b25lKSBhIGdsb2JhbCBjaGVjayB3YXMgc3RpbGwgcGVyZm9ybWVkLlxuICAgIC8vXG4gICAgLy8gSWRlYWxseSwgdGhpcyB3b3VsZCBub3QgYmUgdGhlIGNhc2UsIGFuZCBvbmx5IHpvbmUtYmFzZWQgdGlja3Mgd291bGQgZG8gZ2xvYmFsIHBhc3Nlcy5cbiAgICAvLyBIb3dldmVyIHRoaXMgaXMgYSBicmVha2luZyBjaGFuZ2UgYW5kIHJlcXVpcmVzIGZpeGVzIGluIGczLiBVbnRpbCB0aGlzIGNsZWFudXAgY2FuIGJlIGRvbmUsXG4gICAgLy8gd2UgYWRkIHRoZSBgVmlld1RyZWVHbG9iYWxgIGZsYWcgdG8gcmVxdWVzdCBhIGdsb2JhbCBjaGVjayBpZiBhbnkgdmlld3MgYXJlIGRpcnR5IGluIGFcbiAgICAvLyBzY2hlZHVsZWQgdGljayAodW5sZXNzIHpvbmVsZXNzIGlzIGVuYWJsZWQsIGluIHdoaWNoIGNhc2UgZ2xvYmFsIGNoZWNrcyBhcmVuJ3QgcmVhbGx5IGFcbiAgICAvLyB0aGluZykuXG4gICAgLy9cbiAgICAvLyBUT0RPKGFseGh1Yik6IGNsZWFuIHVwIGFuZCByZW1vdmUgdGhpcyB3b3JrYXJvdW5kIGFzIGEgYnJlYWtpbmcgY2hhbmdlLlxuICAgIGlmICghdGhpcy56b25lbGVzc0VuYWJsZWQgJiYgdGhpcy5hcHBSZWYuZGlydHlGbGFncyAmIEFwcGxpY2F0aW9uUmVmRGlydHlGbGFncy5WaWV3VHJlZUFueSkge1xuICAgICAgdGhpcy5hcHBSZWYuZGlydHlGbGFncyB8PSBBcHBsaWNhdGlvblJlZkRpcnR5RmxhZ3MuVmlld1RyZWVHbG9iYWw7XG4gICAgfVxuXG4gICAgY29uc3QgdGFzayA9IHRoaXMudGFza1NlcnZpY2UuYWRkKCk7XG4gICAgdHJ5IHtcbiAgICAgIHRoaXMubmdab25lLnJ1bihcbiAgICAgICAgKCkgPT4ge1xuICAgICAgICAgIHRoaXMucnVubmluZ1RpY2sgPSB0cnVlO1xuICAgICAgICAgIHRoaXMuYXBwUmVmLl90aWNrKCk7XG4gICAgICAgIH0sXG4gICAgICAgIHVuZGVmaW5lZCxcbiAgICAgICAgdGhpcy5zY2hlZHVsZXJUaWNrQXBwbHlBcmdzLFxuICAgICAgKTtcbiAgICB9IGNhdGNoIChlOiB1bmtub3duKSB7XG4gICAgICB0aGlzLnRhc2tTZXJ2aWNlLnJlbW92ZSh0YXNrKTtcbiAgICAgIHRocm93IGU7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIHRoaXMuY2xlYW51cCgpO1xuICAgIH1cbiAgICAvLyBJZiB3ZSdyZSBub3RpZmllZCBvZiBhIGNoYW5nZSB3aXRoaW4gMSBtaWNyb3Rhc2sgb2YgcnVubmluZyBjaGFuZ2VcbiAgICAvLyBkZXRlY3Rpb24sIHJ1biBhbm90aGVyIHJvdW5kIGluIHRoZSBzYW1lIGV2ZW50IGxvb3AuIFRoaXMgYWxsb3dzIGNvZGVcbiAgICAvLyB3aGljaCB1c2VzIFByb21pc2UucmVzb2x2ZSAoc2VlIE5nTW9kZWwpIHRvIGF2b2lkXG4gICAgLy8gRXhwcmVzc2lvbkNoYW5nZWQuLi5FcnJvciB0byBzdGlsbCBiZSByZWZsZWN0ZWQgaW4gYSBzaW5nbGUgYnJvd3NlclxuICAgIC8vIHBhaW50LCBldmVuIGlmIHRoYXQgc3BhbnMgbXVsdGlwbGUgcm91bmRzIG9mIGNoYW5nZSBkZXRlY3Rpb24uXG4gICAgdGhpcy51c2VNaWNyb3Rhc2tTY2hlZHVsZXIgPSB0cnVlO1xuICAgIHNjaGVkdWxlQ2FsbGJhY2tXaXRoTWljcm90YXNrKCgpID0+IHtcbiAgICAgIHRoaXMudXNlTWljcm90YXNrU2NoZWR1bGVyID0gZmFsc2U7XG4gICAgICB0aGlzLnRhc2tTZXJ2aWNlLnJlbW92ZSh0YXNrKTtcbiAgICB9KTtcbiAgfVxuXG4gIG5nT25EZXN0cm95KCkge1xuICAgIHRoaXMuc3Vic2NyaXB0aW9ucy51bnN1YnNjcmliZSgpO1xuICAgIHRoaXMuY2xlYW51cCgpO1xuICB9XG5cbiAgcHJpdmF0ZSBjbGVhbnVwKCkge1xuICAgIHRoaXMucnVubmluZ1RpY2sgPSBmYWxzZTtcbiAgICB0aGlzLmNhbmNlbFNjaGVkdWxlZENhbGxiYWNrPy4oKTtcbiAgICB0aGlzLmNhbmNlbFNjaGVkdWxlZENhbGxiYWNrID0gbnVsbDtcbiAgICAvLyBJZiB0aGlzIGlzIHRoZSBsYXN0IHRhc2ssIHRoZSBzZXJ2aWNlIHdpbGwgc3luY2hyb25vdXNseSBlbWl0IGEgc3RhYmxlXG4gICAgLy8gbm90aWZpY2F0aW9uLiBJZiB0aGVyZSBpcyBhIHN1YnNjcmliZXIgdGhhdCB0aGVuIGFjdHMgaW4gYSB3YXkgdGhhdFxuICAgIC8vIHRyaWVzIHRvIG5vdGlmeSB0aGUgc2NoZWR1bGVyIGFnYWluLCB3ZSBuZWVkIHRvIGJlIGFibGUgdG8gcmVzcG9uZCB0b1xuICAgIC8vIHNjaGVkdWxlIGEgbmV3IGNoYW5nZSBkZXRlY3Rpb24uIFRoZXJlZm9yZSwgd2Ugc2hvdWxkIGNsZWFyIHRoZSB0YXNrIElEXG4gICAgLy8gYmVmb3JlIHJlbW92aW5nIGl0IGZyb20gdGhlIHBlbmRpbmcgdGFza3MgKG9yIHRoZSB0YXNrcyBzZXJ2aWNlIHNob3VsZFxuICAgIC8vIG5vdCBzeW5jaHJvbm91c2x5IGVtaXQgc3RhYmxlLCBzaW1pbGFyIHRvIGhvdyBab25lIHN0YWJsZW5lc3Mgb25seVxuICAgIC8vIGhhcHBlbnMgaWYgaXQncyBzdGlsbCBzdGFibGUgYWZ0ZXIgYSBtaWNyb3Rhc2spLlxuICAgIGlmICh0aGlzLnBlbmRpbmdSZW5kZXJUYXNrSWQgIT09IG51bGwpIHtcbiAgICAgIGNvbnN0IHRhc2tJZCA9IHRoaXMucGVuZGluZ1JlbmRlclRhc2tJZDtcbiAgICAgIHRoaXMucGVuZGluZ1JlbmRlclRhc2tJZCA9IG51bGw7XG4gICAgICB0aGlzLnRhc2tTZXJ2aWNlLnJlbW92ZSh0YXNrSWQpO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIFByb3ZpZGVzIGNoYW5nZSBkZXRlY3Rpb24gd2l0aG91dCBab25lSlMgZm9yIHRoZSBhcHBsaWNhdGlvbiBib290c3RyYXBwZWQgdXNpbmdcbiAqIGBib290c3RyYXBBcHBsaWNhdGlvbmAuXG4gKlxuICogVGhpcyBmdW5jdGlvbiBhbGxvd3MgeW91IHRvIGNvbmZpZ3VyZSB0aGUgYXBwbGljYXRpb24gdG8gbm90IHVzZSB0aGUgc3RhdGUvc3RhdGUgY2hhbmdlcyBvZlxuICogWm9uZUpTIHRvIHNjaGVkdWxlIGNoYW5nZSBkZXRlY3Rpb24gaW4gdGhlIGFwcGxpY2F0aW9uLiBUaGlzIHdpbGwgd29yayB3aGVuIFpvbmVKUyBpcyBub3QgcHJlc2VudFxuICogb24gdGhlIHBhZ2UgYXQgYWxsIG9yIGlmIGl0IGV4aXN0cyBiZWNhdXNlIHNvbWV0aGluZyBlbHNlIGlzIHVzaW5nIGl0IChlaXRoZXIgYW5vdGhlciBBbmd1bGFyXG4gKiBhcHBsaWNhdGlvbiB3aGljaCB1c2VzIFpvbmVKUyBmb3Igc2NoZWR1bGluZyBvciBzb21lIG90aGVyIGxpYnJhcnkgdGhhdCByZWxpZXMgb24gWm9uZUpTKS5cbiAqXG4gKiBUaGlzIGNhbiBhbHNvIGJlIGFkZGVkIHRvIHRoZSBgVGVzdEJlZGAgcHJvdmlkZXJzIHRvIGNvbmZpZ3VyZSB0aGUgdGVzdCBlbnZpcm9ubWVudCB0byBtb3JlXG4gKiBjbG9zZWx5IG1hdGNoIHByb2R1Y3Rpb24gYmVoYXZpb3IuIFRoaXMgd2lsbCBoZWxwIGdpdmUgaGlnaGVyIGNvbmZpZGVuY2UgdGhhdCBjb21wb25lbnRzIGFyZVxuICogY29tcGF0aWJsZSB3aXRoIHpvbmVsZXNzIGNoYW5nZSBkZXRlY3Rpb24uXG4gKlxuICogWm9uZUpTIHVzZXMgYnJvd3NlciBldmVudHMgdG8gdHJpZ2dlciBjaGFuZ2UgZGV0ZWN0aW9uLiBXaGVuIHVzaW5nIHRoaXMgcHJvdmlkZXIsIEFuZ3VsYXIgd2lsbFxuICogaW5zdGVhZCB1c2UgQW5ndWxhciBBUElzIHRvIHNjaGVkdWxlIGNoYW5nZSBkZXRlY3Rpb24uIFRoZXNlIEFQSXMgaW5jbHVkZTpcbiAqXG4gKiAtIGBDaGFuZ2VEZXRlY3RvclJlZi5tYXJrRm9yQ2hlY2tgXG4gKiAtIGBDb21wb25lbnRSZWYuc2V0SW5wdXRgXG4gKiAtIHVwZGF0aW5nIGEgc2lnbmFsIHRoYXQgaXMgcmVhZCBpbiBhIHRlbXBsYXRlXG4gKiAtIHdoZW4gYm91bmQgaG9zdCBvciB0ZW1wbGF0ZSBsaXN0ZW5lcnMgYXJlIHRyaWdnZXJlZFxuICogLSBhdHRhY2hpbmcgYSB2aWV3IHRoYXQgd2FzIG1hcmtlZCBkaXJ0eSBieSBvbmUgb2YgdGhlIGFib3ZlXG4gKiAtIHJlbW92aW5nIGEgdmlld1xuICogLSByZWdpc3RlcmluZyBhIHJlbmRlciBob29rICh0ZW1wbGF0ZXMgYXJlIG9ubHkgcmVmcmVzaGVkIGlmIHJlbmRlciBob29rcyBkbyBvbmUgb2YgdGhlIGFib3ZlKVxuICpcbiAqIEB1c2FnZU5vdGVzXG4gKiBgYGB0eXBlc2NyaXB0XG4gKiBib290c3RyYXBBcHBsaWNhdGlvbihNeUFwcCwge3Byb3ZpZGVyczogW1xuICogICBwcm92aWRlRXhwZXJpbWVudGFsWm9uZWxlc3NDaGFuZ2VEZXRlY3Rpb24oKSxcbiAqIF19KTtcbiAqIGBgYFxuICpcbiAqIFRoaXMgQVBJIGlzIGV4cGVyaW1lbnRhbC4gTmVpdGhlciB0aGUgc2hhcGUsIG5vciB0aGUgdW5kZXJseWluZyBiZWhhdmlvciBpcyBzdGFibGUgYW5kIGNhbiBjaGFuZ2VcbiAqIGluIHBhdGNoIHZlcnNpb25zLiBUaGVyZSBhcmUga25vd24gZmVhdHVyZSBnYXBzIGFuZCBBUEkgZXJnb25vbWljIGNvbnNpZGVyYXRpb25zLiBXZSB3aWxsIGl0ZXJhdGVcbiAqIG9uIHRoZSBleGFjdCBBUEkgYmFzZWQgb24gdGhlIGZlZWRiYWNrIGFuZCBvdXIgdW5kZXJzdGFuZGluZyBvZiB0aGUgcHJvYmxlbSBhbmQgc29sdXRpb24gc3BhY2UuXG4gKlxuICogQHB1YmxpY0FwaVxuICogQGV4cGVyaW1lbnRhbFxuICogQHNlZSBbYm9vdHN0cmFwQXBwbGljYXRpb25dKC9hcGkvcGxhdGZvcm0tYnJvd3Nlci9ib290c3RyYXBBcHBsaWNhdGlvbilcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHByb3ZpZGVFeHBlcmltZW50YWxab25lbGVzc0NoYW5nZURldGVjdGlvbigpOiBFbnZpcm9ubWVudFByb3ZpZGVycyB7XG4gIHBlcmZvcm1hbmNlTWFya0ZlYXR1cmUoJ05nWm9uZWxlc3MnKTtcblxuICBpZiAoKHR5cGVvZiBuZ0Rldk1vZGUgPT09ICd1bmRlZmluZWQnIHx8IG5nRGV2TW9kZSkgJiYgdHlwZW9mIFpvbmUgIT09ICd1bmRlZmluZWQnICYmIFpvbmUpIHtcbiAgICBjb25zdCBtZXNzYWdlID0gZm9ybWF0UnVudGltZUVycm9yKFxuICAgICAgUnVudGltZUVycm9yQ29kZS5VTkVYUEVDVEVEX1pPTkVKU19QUkVTRU5UX0lOX1pPTkVMRVNTX01PREUsXG4gICAgICBgVGhlIGFwcGxpY2F0aW9uIGlzIHVzaW5nIHpvbmVsZXNzIGNoYW5nZSBkZXRlY3Rpb24sIGJ1dCBpcyBzdGlsbCBsb2FkaW5nIFpvbmUuanMuIGAgK1xuICAgICAgICBgQ29uc2lkZXIgcmVtb3ZpbmcgWm9uZS5qcyB0byBnZXQgdGhlIGZ1bGwgYmVuZWZpdHMgb2Ygem9uZWxlc3MuIGAgK1xuICAgICAgICBgSW4gYXBwbGljYXRpb25zIHVzaW5nIHRoZSBBbmd1bGFyIENMSSwgWm9uZS5qcyBpcyB0eXBpY2FsbHkgaW5jbHVkZWQgaW4gdGhlIFwicG9seWZpbGxzXCIgc2VjdGlvbiBvZiB0aGUgYW5ndWxhci5qc29uIGZpbGUuYCxcbiAgICApO1xuICAgIGNvbnNvbGUud2FybihtZXNzYWdlKTtcbiAgfVxuXG4gIHJldHVybiBtYWtlRW52aXJvbm1lbnRQcm92aWRlcnMoW1xuICAgIHtwcm92aWRlOiBDaGFuZ2VEZXRlY3Rpb25TY2hlZHVsZXIsIHVzZUV4aXN0aW5nOiBDaGFuZ2VEZXRlY3Rpb25TY2hlZHVsZXJJbXBsfSxcbiAgICB7cHJvdmlkZTogTmdab25lLCB1c2VDbGFzczogTm9vcE5nWm9uZX0sXG4gICAge3Byb3ZpZGU6IFpPTkVMRVNTX0VOQUJMRUQsIHVzZVZhbHVlOiB0cnVlfSxcbiAgICB7cHJvdmlkZTogU0NIRURVTEVfSU5fUk9PVF9aT05FLCB1c2VWYWx1ZTogZmFsc2V9LFxuICAgIHR5cGVvZiBuZ0Rldk1vZGUgPT09ICd1bmRlZmluZWQnIHx8IG5nRGV2TW9kZVxuICAgICAgPyBbe3Byb3ZpZGU6IFBST1ZJREVEX1pPTkVMRVNTLCB1c2VWYWx1ZTogdHJ1ZX1dXG4gICAgICA6IFtdLFxuICBdKTtcbn1cbiJdfQ==