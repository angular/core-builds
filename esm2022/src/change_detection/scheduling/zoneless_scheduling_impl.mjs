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
import { PendingTasks } from '../../pending_tasks';
import { getCallbackScheduler } from '../../util/callback_scheduler';
import { NgZone, NoopNgZone } from '../../zone/ng_zone';
import { ChangeDetectionScheduler, ZONELESS_ENABLED, ZONELESS_SCHEDULER_DISABLED } from './zoneless_scheduling';
import * as i0 from "../../r3_symbols";
export class ChangeDetectionSchedulerImpl {
    constructor() {
        this.appRef = inject(ApplicationRef);
        this.taskService = inject(PendingTasks);
        this.pendingRenderTaskId = null;
        this.shouldRefreshViews = false;
        this.schedule = getCallbackScheduler();
        this.ngZone = inject(NgZone);
        this.runningTick = false;
        this.cancelScheduledCallback = null;
        this.zonelessEnabled = inject(ZONELESS_ENABLED);
        this.disableScheduling = inject(ZONELESS_SCHEDULER_DISABLED, { optional: true }) ?? false;
        this.zoneIsDefined = typeof Zone !== 'undefined';
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
        this.pendingRenderTaskId = this.taskService.add();
        if (Zone?.root?.run) {
            Zone.root.run(() => {
                this.cancelScheduledCallback = this.schedule(() => {
                    this.tick(this.shouldRefreshViews);
                });
            });
        }
        else {
            this.cancelScheduledCallback = this.schedule(() => {
                this.tick(this.shouldRefreshViews);
            });
        }
    }
    shouldScheduleTick() {
        if (this.disableScheduling) {
            return false;
        }
        // already scheduled or running
        if (this.pendingRenderTaskId !== null || this.runningTick) {
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
        try {
            this.ngZone.run(() => {
                this.runningTick = true;
                this.appRef._tick(shouldRefreshViews);
            });
        }
        finally {
            this.cleanup();
        }
    }
    ngOnDestroy() {
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
        if (this.pendingRenderTaskId) {
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
export function provideZonelessChangeDetection() {
    return makeEnvironmentProviders([
        { provide: ChangeDetectionScheduler, useExisting: ChangeDetectionSchedulerImpl },
        { provide: NgZone, useClass: NoopNgZone },
        { provide: ZONELESS_ENABLED, useValue: true },
    ]);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiem9uZWxlc3Nfc2NoZWR1bGluZ19pbXBsLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvY2hhbmdlX2RldGVjdGlvbi9zY2hlZHVsaW5nL3pvbmVsZXNzX3NjaGVkdWxpbmdfaW1wbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0sbUNBQW1DLENBQUM7QUFDakUsT0FBTyxFQUFDLFVBQVUsRUFBQyxNQUFNLHFCQUFxQixDQUFDO0FBQy9DLE9BQU8sRUFBQyxNQUFNLEVBQUMsTUFBTSxpQ0FBaUMsQ0FBQztBQUV2RCxPQUFPLEVBQUMsd0JBQXdCLEVBQUMsTUFBTSw4QkFBOEIsQ0FBQztBQUN0RSxPQUFPLEVBQUMsWUFBWSxFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFDakQsT0FBTyxFQUFDLG9CQUFvQixFQUFDLE1BQU0sK0JBQStCLENBQUM7QUFDbkUsT0FBTyxFQUFDLE1BQU0sRUFBRSxVQUFVLEVBQUMsTUFBTSxvQkFBb0IsQ0FBQztBQUV0RCxPQUFPLEVBQUMsd0JBQXdCLEVBQW9CLGdCQUFnQixFQUFFLDJCQUEyQixFQUFDLE1BQU0sdUJBQXVCLENBQUM7O0FBR2hJLE1BQU0sT0FBTyw0QkFBNEI7SUFjdkM7UUFiUSxXQUFNLEdBQUcsTUFBTSxDQUFDLGNBQWMsQ0FBQyxDQUFDO1FBQ2hDLGdCQUFXLEdBQUcsTUFBTSxDQUFDLFlBQVksQ0FBQyxDQUFDO1FBQ25DLHdCQUFtQixHQUFnQixJQUFJLENBQUM7UUFDeEMsdUJBQWtCLEdBQUcsS0FBSyxDQUFDO1FBQ2xCLGFBQVEsR0FBRyxvQkFBb0IsRUFBRSxDQUFDO1FBQ2xDLFdBQU0sR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDakMsZ0JBQVcsR0FBRyxLQUFLLENBQUM7UUFDcEIsNEJBQXVCLEdBQXNCLElBQUksQ0FBQztR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QUM7SUFFTyxPQUFPO1FBQ2IsSUFBSSxDQUFDLGtCQUFrQixHQUFHLEtBQUssQ0FBQztRQUNoQyxJQUFJLENBQUMsV0FBVyxHQUFHLEtBQUssQ0FBQztRQUN6QixJQUFJLENBQUMsdUJBQXVCLEVBQUUsRUFBRSxDQUFDO1FBQ2pDLElBQUksQ0FBQyx1QkFBdUIsR0FBRyxJQUFJLENBQUM7UUFDcEMseUVBQXlFO1FBQ3pFLHNFQUFzRTtRQUN0RSx3RUFBd0U7UUFDeEUsMEVBQTBFO1FBQzFFLHlFQUF5RTtRQUN6RSxxRUFBcUU7UUFDckUsbURBQW1EO1FBQ25ELElBQUksSUFBSSxDQUFDLG1CQUFtQixFQUFFLENBQUM7WUFDN0IsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLG1CQUFtQixDQUFDO1lBQ3hDLElBQUksQ0FBQyxtQkFBbUIsR0FBRyxJQUFJLENBQUM7WUFDaEMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDbEMsQ0FBQztJQUNILENBQUM7NkZBaEhVLDRCQUE0Qjt1RUFBNUIsNEJBQTRCLFdBQTVCLDRCQUE0QixtQkFEaEIsTUFBTTs7Z0ZBQ2xCLDRCQUE0QjtjQUR4QyxVQUFVO2VBQUMsRUFBQyxVQUFVLEVBQUUsTUFBTSxFQUFDOztBQW9IaEMsTUFBTSxVQUFVLDhCQUE4QjtJQUM1QyxPQUFPLHdCQUF3QixDQUFDO1FBQzlCLEVBQUMsT0FBTyxFQUFFLHdCQUF3QixFQUFFLFdBQVcsRUFBRSw0QkFBNEIsRUFBQztRQUM5RSxFQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsUUFBUSxFQUFFLFVBQVUsRUFBQztRQUN2QyxFQUFDLE9BQU8sRUFBRSxnQkFBZ0IsRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFDO0tBQzVDLENBQUMsQ0FBQztBQUNMLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtBcHBsaWNhdGlvblJlZn0gZnJvbSAnLi4vLi4vYXBwbGljYXRpb24vYXBwbGljYXRpb25fcmVmJztcbmltcG9ydCB7SW5qZWN0YWJsZX0gZnJvbSAnLi4vLi4vZGkvaW5qZWN0YWJsZSc7XG5pbXBvcnQge2luamVjdH0gZnJvbSAnLi4vLi4vZGkvaW5qZWN0b3JfY29tcGF0aWJpbGl0eSc7XG5pbXBvcnQge0Vudmlyb25tZW50UHJvdmlkZXJzfSBmcm9tICcuLi8uLi9kaS9pbnRlcmZhY2UvcHJvdmlkZXInO1xuaW1wb3J0IHttYWtlRW52aXJvbm1lbnRQcm92aWRlcnN9IGZyb20gJy4uLy4uL2RpL3Byb3ZpZGVyX2NvbGxlY3Rpb24nO1xuaW1wb3J0IHtQZW5kaW5nVGFza3N9IGZyb20gJy4uLy4uL3BlbmRpbmdfdGFza3MnO1xuaW1wb3J0IHtnZXRDYWxsYmFja1NjaGVkdWxlcn0gZnJvbSAnLi4vLi4vdXRpbC9jYWxsYmFja19zY2hlZHVsZXInO1xuaW1wb3J0IHtOZ1pvbmUsIE5vb3BOZ1pvbmV9IGZyb20gJy4uLy4uL3pvbmUvbmdfem9uZSc7XG5cbmltcG9ydCB7Q2hhbmdlRGV0ZWN0aW9uU2NoZWR1bGVyLCBOb3RpZmljYXRpb25UeXBlLCBaT05FTEVTU19FTkFCTEVELCBaT05FTEVTU19TQ0hFRFVMRVJfRElTQUJMRUR9IGZyb20gJy4vem9uZWxlc3Nfc2NoZWR1bGluZyc7XG5cbkBJbmplY3RhYmxlKHtwcm92aWRlZEluOiAncm9vdCd9KVxuZXhwb3J0IGNsYXNzIENoYW5nZURldGVjdGlvblNjaGVkdWxlckltcGwgaW1wbGVtZW50cyBDaGFuZ2VEZXRlY3Rpb25TY2hlZHVsZXIge1xuICBwcml2YXRlIGFwcFJlZiA9IGluamVjdChBcHBsaWNhdGlvblJlZik7XG4gIHByaXZhdGUgdGFza1NlcnZpY2UgPSBpbmplY3QoUGVuZGluZ1Rhc2tzKTtcbiAgcHJpdmF0ZSBwZW5kaW5nUmVuZGVyVGFza0lkOiBudW1iZXJ8bnVsbCA9IG51bGw7XG4gIHByaXZhdGUgc2hvdWxkUmVmcmVzaFZpZXdzID0gZmFsc2U7XG4gIHByaXZhdGUgcmVhZG9ubHkgc2NoZWR1bGUgPSBnZXRDYWxsYmFja1NjaGVkdWxlcigpO1xuICBwcml2YXRlIHJlYWRvbmx5IG5nWm9uZSA9IGluamVjdChOZ1pvbmUpO1xuICBwcml2YXRlIHJ1bm5pbmdUaWNrID0gZmFsc2U7XG4gIHByaXZhdGUgY2FuY2VsU2NoZWR1bGVkQ2FsbGJhY2s6IG51bGx8KCgpID0+IHZvaWQpID0gbnVsbDtcbiAgcHJpdmF0ZSByZWFkb25seSB6b25lbGVzc0VuYWJsZWQgPSBpbmplY3QoWk9ORUxFU1NfRU5BQkxFRCk7XG4gIHByaXZhdGUgcmVhZG9ubHkgZGlzYWJsZVNjaGVkdWxpbmcgPVxuICAgICAgaW5qZWN0KFpPTkVMRVNTX1NDSEVEVUxFUl9ESVNBQkxFRCwge29wdGlvbmFsOiB0cnVlfSkgPz8gZmFsc2U7XG4gIHByaXZhdGUgcmVhZG9ubHkgem9uZUlzRGVmaW5lZCA9IHR5cGVvZiBab25lICE9PSAndW5kZWZpbmVkJztcblxuICBjb25zdHJ1Y3RvcigpIHtcbiAgICAvLyBUT0RPKGF0c2NvdHQpOiBUaGVzZSBjb25kaXRpb25zIHdpbGwgbmVlZCB0byBjaGFuZ2Ugd2hlbiB6b25lbGVzcyBpcyB0aGUgZGVmYXVsdFxuICAgIC8vIEluc3RlYWQsIHRoZXkgc2hvdWxkIGZsaXAgdG8gY2hlY2tpbmcgaWYgWm9uZUpTIHNjaGVkdWxpbmcgaXMgcHJvdmlkZWRcbiAgICB0aGlzLmRpc2FibGVTY2hlZHVsaW5nIHx8PSAhdGhpcy56b25lbGVzc0VuYWJsZWQgJiZcbiAgICAgICAgLy8gTm9vcE5nWm9uZSB3aXRob3V0IGVuYWJsaW5nIHpvbmVsZXNzIG1lYW5zIG5vIHNjaGVkdWxpbmcgd2hhdHNvZXZlclxuICAgICAgICAodGhpcy5uZ1pvbmUgaW5zdGFuY2VvZiBOb29wTmdab25lIHx8XG4gICAgICAgICAvLyBUaGUgc2FtZSBnb2VzIGZvciB0aGUgbGFjayBvZiBab25lIHdpdGhvdXQgZW5hYmxpbmcgem9uZWxlc3Mgc2NoZWR1bGluZ1xuICAgICAgICAgIXRoaXMuem9uZUlzRGVmaW5lZCk7XG4gIH1cblxuICBub3RpZnkodHlwZSA9IE5vdGlmaWNhdGlvblR5cGUuUmVmcmVzaFZpZXdzKTogdm9pZCB7XG4gICAgLy8gV2hlbiB0aGUgb25seSBzb3VyY2Ugb2Ygbm90aWZpY2F0aW9uIGlzIGFuIGFmdGVyUmVuZGVyIGhvb2sgd2lsbCBza2lwIHN0cmFpZ2h0IHRvIHRoZSBob29rc1xuICAgIC8vIHJhdGhlciB0aGFuIHJlZnJlc2hpbmcgdmlld3MgaW4gQXBwbGljYXRpb25SZWYudGlja1xuICAgIHRoaXMuc2hvdWxkUmVmcmVzaFZpZXdzIHx8PSB0eXBlID09PSBOb3RpZmljYXRpb25UeXBlLlJlZnJlc2hWaWV3cztcblxuICAgIGlmICghdGhpcy5zaG91bGRTY2hlZHVsZVRpY2soKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMucGVuZGluZ1JlbmRlclRhc2tJZCA9IHRoaXMudGFza1NlcnZpY2UuYWRkKCk7XG4gICAgaWYgKFpvbmU/LnJvb3Q/LnJ1bikge1xuICAgICAgWm9uZS5yb290LnJ1bigoKSA9PiB7XG4gICAgICAgIHRoaXMuY2FuY2VsU2NoZWR1bGVkQ2FsbGJhY2sgPSB0aGlzLnNjaGVkdWxlKCgpID0+IHtcbiAgICAgICAgICB0aGlzLnRpY2sodGhpcy5zaG91bGRSZWZyZXNoVmlld3MpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmNhbmNlbFNjaGVkdWxlZENhbGxiYWNrID0gdGhpcy5zY2hlZHVsZSgoKSA9PiB7XG4gICAgICAgIHRoaXMudGljayh0aGlzLnNob3VsZFJlZnJlc2hWaWV3cyk7XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIHNob3VsZFNjaGVkdWxlVGljaygpOiBib29sZWFuIHtcbiAgICBpZiAodGhpcy5kaXNhYmxlU2NoZWR1bGluZykge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICAvLyBhbHJlYWR5IHNjaGVkdWxlZCBvciBydW5uaW5nXG4gICAgaWYgKHRoaXMucGVuZGluZ1JlbmRlclRhc2tJZCAhPT0gbnVsbCB8fCB0aGlzLnJ1bm5pbmdUaWNrKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIC8vIElmIHdlJ3JlIGluc2lkZSB0aGUgem9uZSBkb24ndCBib3RoZXIgd2l0aCBzY2hlZHVsZXIuIFpvbmUgd2lsbCBzdGFiaWxpemVcbiAgICAvLyBldmVudHVhbGx5IGFuZCBydW4gY2hhbmdlIGRldGVjdGlvbi5cbiAgICBpZiAodGhpcy56b25lSXNEZWZpbmVkICYmIE5nWm9uZS5pc0luQW5ndWxhclpvbmUoKSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgLyoqXG4gICAqIENhbGxzIEFwcGxpY2F0aW9uUmVmLl90aWNrIGluc2lkZSB0aGUgYE5nWm9uZWAuXG4gICAqXG4gICAqIENhbGxpbmcgYHRpY2tgIGRpcmVjdGx5IHJ1bnMgY2hhbmdlIGRldGVjdGlvbiBhbmQgY2FuY2VscyBhbnkgY2hhbmdlIGRldGVjdGlvbiB0aGF0IGhhZCBiZWVuXG4gICAqIHNjaGVkdWxlZCBwcmV2aW91c2x5LlxuICAgKlxuICAgKiBAcGFyYW0gc2hvdWxkUmVmcmVzaFZpZXdzIFBhc3NlZCBkaXJlY3RseSB0byBgQXBwbGljYXRpb25SZWYuX3RpY2tgIGFuZCBza2lwcyBzdHJhaWdodCB0b1xuICAgKiAgICAgcmVuZGVyIGhvb2tzIHdoZW4gYGZhbHNlYC5cbiAgICovXG4gIHRpY2soc2hvdWxkUmVmcmVzaFZpZXdzOiBib29sZWFuKTogdm9pZCB7XG4gICAgLy8gV2hlbiBuZ1pvbmUucnVuIGJlbG93IGV4aXRzLCBvbk1pY3JvdGFza0VtcHR5IG1heSBlbWl0IGlmIHRoZSB6b25lIGlzXG4gICAgLy8gc3RhYmxlLiBXZSB3YW50IHRvIHByZXZlbnQgZG91YmxlIHRpY2tpbmcgc28gd2UgdHJhY2sgd2hldGhlciB0aGUgdGljayBpc1xuICAgIC8vIGFscmVhZHkgcnVubmluZyBhbmQgc2tpcCBpdCBpZiBzby5cbiAgICBpZiAodGhpcy5ydW5uaW5nVGljayB8fCB0aGlzLmFwcFJlZi5kZXN0cm95ZWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0cnkge1xuICAgICAgdGhpcy5uZ1pvbmUucnVuKCgpID0+IHtcbiAgICAgICAgdGhpcy5ydW5uaW5nVGljayA9IHRydWU7XG4gICAgICAgIHRoaXMuYXBwUmVmLl90aWNrKHNob3VsZFJlZnJlc2hWaWV3cyk7XG4gICAgICB9KTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgdGhpcy5jbGVhbnVwKCk7XG4gICAgfVxuICB9XG5cbiAgbmdPbkRlc3Ryb3koKSB7XG4gICAgdGhpcy5jbGVhbnVwKCk7XG4gIH1cblxuICBwcml2YXRlIGNsZWFudXAoKSB7XG4gICAgdGhpcy5zaG91bGRSZWZyZXNoVmlld3MgPSBmYWxzZTtcbiAgICB0aGlzLnJ1bm5pbmdUaWNrID0gZmFsc2U7XG4gICAgdGhpcy5jYW5jZWxTY2hlZHVsZWRDYWxsYmFjaz8uKCk7XG4gICAgdGhpcy5jYW5jZWxTY2hlZHVsZWRDYWxsYmFjayA9IG51bGw7XG4gICAgLy8gSWYgdGhpcyBpcyB0aGUgbGFzdCB0YXNrLCB0aGUgc2VydmljZSB3aWxsIHN5bmNocm9ub3VzbHkgZW1pdCBhIHN0YWJsZVxuICAgIC8vIG5vdGlmaWNhdGlvbi4gSWYgdGhlcmUgaXMgYSBzdWJzY3JpYmVyIHRoYXQgdGhlbiBhY3RzIGluIGEgd2F5IHRoYXRcbiAgICAvLyB0cmllcyB0byBub3RpZnkgdGhlIHNjaGVkdWxlciBhZ2Fpbiwgd2UgbmVlZCB0byBiZSBhYmxlIHRvIHJlc3BvbmQgdG9cbiAgICAvLyBzY2hlZHVsZSBhIG5ldyBjaGFuZ2UgZGV0ZWN0aW9uLiBUaGVyZWZvcmUsIHdlIHNob3VsZCBjbGVhciB0aGUgdGFzayBJRFxuICAgIC8vIGJlZm9yZSByZW1vdmluZyBpdCBmcm9tIHRoZSBwZW5kaW5nIHRhc2tzIChvciB0aGUgdGFza3Mgc2VydmljZSBzaG91bGRcbiAgICAvLyBub3Qgc3luY2hyb25vdXNseSBlbWl0IHN0YWJsZSwgc2ltaWxhciB0byBob3cgWm9uZSBzdGFibGVuZXNzIG9ubHlcbiAgICAvLyBoYXBwZW5zIGlmIGl0J3Mgc3RpbGwgc3RhYmxlIGFmdGVyIGEgbWljcm90YXNrKS5cbiAgICBpZiAodGhpcy5wZW5kaW5nUmVuZGVyVGFza0lkKSB7XG4gICAgICBjb25zdCB0YXNrSWQgPSB0aGlzLnBlbmRpbmdSZW5kZXJUYXNrSWQ7XG4gICAgICB0aGlzLnBlbmRpbmdSZW5kZXJUYXNrSWQgPSBudWxsO1xuICAgICAgdGhpcy50YXNrU2VydmljZS5yZW1vdmUodGFza0lkKTtcbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHByb3ZpZGVab25lbGVzc0NoYW5nZURldGVjdGlvbigpOiBFbnZpcm9ubWVudFByb3ZpZGVycyB7XG4gIHJldHVybiBtYWtlRW52aXJvbm1lbnRQcm92aWRlcnMoW1xuICAgIHtwcm92aWRlOiBDaGFuZ2VEZXRlY3Rpb25TY2hlZHVsZXIsIHVzZUV4aXN0aW5nOiBDaGFuZ2VEZXRlY3Rpb25TY2hlZHVsZXJJbXBsfSxcbiAgICB7cHJvdmlkZTogTmdab25lLCB1c2VDbGFzczogTm9vcE5nWm9uZX0sXG4gICAge3Byb3ZpZGU6IFpPTkVMRVNTX0VOQUJMRUQsIHVzZVZhbHVlOiB0cnVlfSxcbiAgXSk7XG59XG4iXX0=