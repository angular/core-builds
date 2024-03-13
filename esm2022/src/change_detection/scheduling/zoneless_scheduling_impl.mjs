/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ApplicationRef } from '../../application/application_ref';
import { inject, Injectable, makeEnvironmentProviders } from '../../di';
import { PendingTasks } from '../../pending_tasks';
import { getCallbackScheduler } from '../../util/callback_scheduler';
import { NgZone, NoopNgZone } from '../../zone/ng_zone';
import { ChangeDetectionScheduler } from './zoneless_scheduling';
import * as i0 from "../../r3_symbols";
class ChangeDetectionSchedulerImpl {
    constructor() {
        this.appRef = inject(ApplicationRef);
        this.taskService = inject(PendingTasks);
        this.pendingRenderTaskId = null;
        this.shouldRefreshViews = false;
        this.schedule = getCallbackScheduler();
    }
    notify(type = 0 /* NotificationType.RefreshViews */) {
        // When the only source of notification is an afterRender hook will skip straight to the hooks
        // rather than refreshing views in ApplicationRef.tick
        this.shouldRefreshViews ||= type === 0 /* NotificationType.RefreshViews */;
        if (this.pendingRenderTaskId !== null) {
            return;
        }
        this.pendingRenderTaskId = this.taskService.add();
        this.schedule(() => {
            this.tick();
        });
    }
    tick() {
        try {
            if (!this.appRef.destroyed) {
                this.appRef._tick(this.shouldRefreshViews);
            }
        }
        finally {
            this.shouldRefreshViews = false;
            // If this is the last task, the service will synchronously emit a stable notification. If
            // there is a subscriber that then acts in a way that tries to notify the scheduler again,
            // we need to be able to respond to schedule a new change detection. Therefore, we should
            // clear the task ID before removing it from the pending tasks (or the tasks service should
            // not synchronously emit stable, similar to how Zone stableness only happens if it's still
            // stable after a microtask).
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
    }], null, null); })();
export function provideZonelessChangeDetection() {
    return makeEnvironmentProviders([
        { provide: ChangeDetectionScheduler, useExisting: ChangeDetectionSchedulerImpl },
        { provide: NgZone, useClass: NoopNgZone },
    ]);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiem9uZWxlc3Nfc2NoZWR1bGluZ19pbXBsLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvY2hhbmdlX2RldGVjdGlvbi9zY2hlZHVsaW5nL3pvbmVsZXNzX3NjaGVkdWxpbmdfaW1wbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0sbUNBQW1DLENBQUM7QUFDakUsT0FBTyxFQUF1QixNQUFNLEVBQUUsVUFBVSxFQUFFLHdCQUF3QixFQUFDLE1BQU0sVUFBVSxDQUFDO0FBQzVGLE9BQU8sRUFBQyxZQUFZLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUNqRCxPQUFPLEVBQUMsb0JBQW9CLEVBQUMsTUFBTSwrQkFBK0IsQ0FBQztBQUNuRSxPQUFPLEVBQUMsTUFBTSxFQUFFLFVBQVUsRUFBQyxNQUFNLG9CQUFvQixDQUFDO0FBRXRELE9BQU8sRUFBQyx3QkFBd0IsRUFBbUIsTUFBTSx1QkFBdUIsQ0FBQzs7QUFFakYsTUFDTSw0QkFBNEI7SUFEbEM7UUFFVSxXQUFNLEdBQUcsTUFBTSxDQUFDLGNBQWMsQ0FBQyxDQUFDO1FBQ2hDLGdCQUFXLEdBQUcsTUFBTSxDQUFDLFlBQVksQ0FBQyxDQUFDO1FBQ25DLHdCQUFtQixHQUFnQixJQUFJLENBQUM7UUFDeEMsdUJBQWtCLEdBQUcsS0FBSyxDQUFDO1FBQ2xCLGFBQVEsR0FBRyxvQkFBb0IsRUFBRSxDQUFDO0tBbUNwRDtJQWpDQyxNQUFNLENBQUMsSUFBSSx3Q0FBZ0M7UUFDekMsOEZBQThGO1FBQzlGLHNEQUFzRDtRQUN0RCxJQUFJLENBQUMsa0JBQWtCLEtBQUssSUFBSSwwQ0FBa0MsQ0FBQztRQUNuRSxJQUFJLElBQUksQ0FBQyxtQkFBbUIsS0FBSyxJQUFJLEVBQUUsQ0FBQztZQUN0QyxPQUFPO1FBQ1QsQ0FBQztRQUVELElBQUksQ0FBQyxtQkFBbUIsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLEdBQUcsRUFBRSxDQUFDO1FBQ2xELElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxFQUFFO1lBQ2pCLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUNkLENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztJQUdPLElBQUk7UUFDVixJQUFJLENBQUM7WUFDSCxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLEVBQUUsQ0FBQztnQkFDM0IsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLENBQUM7WUFDN0MsQ0FBQztRQUNILENBQUM7Z0JBQVMsQ0FBQztZQUNULElBQUksQ0FBQyxrQkFBa0IsR0FBRyxLQUFLLENBQUM7WUFDaEMsMEZBQTBGO1lBQzFGLDBGQUEwRjtZQUMxRix5RkFBeUY7WUFDekYsMkZBQTJGO1lBQzNGLDJGQUEyRjtZQUMzRiw2QkFBNkI7WUFDN0IsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLG1CQUFvQixDQUFDO1lBQ3pDLElBQUksQ0FBQyxtQkFBbUIsR0FBRyxJQUFJLENBQUM7WUFDaEMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDbEMsQ0FBQztJQUNILENBQUM7NkZBdkNHLDRCQUE0Qjt1RUFBNUIsNEJBQTRCLFdBQTVCLDRCQUE0QixtQkFEVCxNQUFNOztnRkFDekIsNEJBQTRCO2NBRGpDLFVBQVU7ZUFBQyxFQUFDLFVBQVUsRUFBRSxNQUFNLEVBQUM7O0FBMkNoQyxNQUFNLFVBQVUsOEJBQThCO0lBQzVDLE9BQU8sd0JBQXdCLENBQUM7UUFDOUIsRUFBQyxPQUFPLEVBQUUsd0JBQXdCLEVBQUUsV0FBVyxFQUFFLDRCQUE0QixFQUFDO1FBQzlFLEVBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxRQUFRLEVBQUUsVUFBVSxFQUFDO0tBQ3hDLENBQUMsQ0FBQztBQUNMLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtBcHBsaWNhdGlvblJlZn0gZnJvbSAnLi4vLi4vYXBwbGljYXRpb24vYXBwbGljYXRpb25fcmVmJztcbmltcG9ydCB7RW52aXJvbm1lbnRQcm92aWRlcnMsIGluamVjdCwgSW5qZWN0YWJsZSwgbWFrZUVudmlyb25tZW50UHJvdmlkZXJzfSBmcm9tICcuLi8uLi9kaSc7XG5pbXBvcnQge1BlbmRpbmdUYXNrc30gZnJvbSAnLi4vLi4vcGVuZGluZ190YXNrcyc7XG5pbXBvcnQge2dldENhbGxiYWNrU2NoZWR1bGVyfSBmcm9tICcuLi8uLi91dGlsL2NhbGxiYWNrX3NjaGVkdWxlcic7XG5pbXBvcnQge05nWm9uZSwgTm9vcE5nWm9uZX0gZnJvbSAnLi4vLi4vem9uZS9uZ196b25lJztcblxuaW1wb3J0IHtDaGFuZ2VEZXRlY3Rpb25TY2hlZHVsZXIsIE5vdGlmaWNhdGlvblR5cGV9IGZyb20gJy4vem9uZWxlc3Nfc2NoZWR1bGluZyc7XG5cbkBJbmplY3RhYmxlKHtwcm92aWRlZEluOiAncm9vdCd9KVxuY2xhc3MgQ2hhbmdlRGV0ZWN0aW9uU2NoZWR1bGVySW1wbCBpbXBsZW1lbnRzIENoYW5nZURldGVjdGlvblNjaGVkdWxlciB7XG4gIHByaXZhdGUgYXBwUmVmID0gaW5qZWN0KEFwcGxpY2F0aW9uUmVmKTtcbiAgcHJpdmF0ZSB0YXNrU2VydmljZSA9IGluamVjdChQZW5kaW5nVGFza3MpO1xuICBwcml2YXRlIHBlbmRpbmdSZW5kZXJUYXNrSWQ6IG51bWJlcnxudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBzaG91bGRSZWZyZXNoVmlld3MgPSBmYWxzZTtcbiAgcHJpdmF0ZSByZWFkb25seSBzY2hlZHVsZSA9IGdldENhbGxiYWNrU2NoZWR1bGVyKCk7XG5cbiAgbm90aWZ5KHR5cGUgPSBOb3RpZmljYXRpb25UeXBlLlJlZnJlc2hWaWV3cyk6IHZvaWQge1xuICAgIC8vIFdoZW4gdGhlIG9ubHkgc291cmNlIG9mIG5vdGlmaWNhdGlvbiBpcyBhbiBhZnRlclJlbmRlciBob29rIHdpbGwgc2tpcCBzdHJhaWdodCB0byB0aGUgaG9va3NcbiAgICAvLyByYXRoZXIgdGhhbiByZWZyZXNoaW5nIHZpZXdzIGluIEFwcGxpY2F0aW9uUmVmLnRpY2tcbiAgICB0aGlzLnNob3VsZFJlZnJlc2hWaWV3cyB8fD0gdHlwZSA9PT0gTm90aWZpY2F0aW9uVHlwZS5SZWZyZXNoVmlld3M7XG4gICAgaWYgKHRoaXMucGVuZGluZ1JlbmRlclRhc2tJZCAhPT0gbnVsbCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMucGVuZGluZ1JlbmRlclRhc2tJZCA9IHRoaXMudGFza1NlcnZpY2UuYWRkKCk7XG4gICAgdGhpcy5zY2hlZHVsZSgoKSA9PiB7XG4gICAgICB0aGlzLnRpY2soKTtcbiAgICB9KTtcbiAgfVxuXG5cbiAgcHJpdmF0ZSB0aWNrKCkge1xuICAgIHRyeSB7XG4gICAgICBpZiAoIXRoaXMuYXBwUmVmLmRlc3Ryb3llZCkge1xuICAgICAgICB0aGlzLmFwcFJlZi5fdGljayh0aGlzLnNob3VsZFJlZnJlc2hWaWV3cyk7XG4gICAgICB9XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIHRoaXMuc2hvdWxkUmVmcmVzaFZpZXdzID0gZmFsc2U7XG4gICAgICAvLyBJZiB0aGlzIGlzIHRoZSBsYXN0IHRhc2ssIHRoZSBzZXJ2aWNlIHdpbGwgc3luY2hyb25vdXNseSBlbWl0IGEgc3RhYmxlIG5vdGlmaWNhdGlvbi4gSWZcbiAgICAgIC8vIHRoZXJlIGlzIGEgc3Vic2NyaWJlciB0aGF0IHRoZW4gYWN0cyBpbiBhIHdheSB0aGF0IHRyaWVzIHRvIG5vdGlmeSB0aGUgc2NoZWR1bGVyIGFnYWluLFxuICAgICAgLy8gd2UgbmVlZCB0byBiZSBhYmxlIHRvIHJlc3BvbmQgdG8gc2NoZWR1bGUgYSBuZXcgY2hhbmdlIGRldGVjdGlvbi4gVGhlcmVmb3JlLCB3ZSBzaG91bGRcbiAgICAgIC8vIGNsZWFyIHRoZSB0YXNrIElEIGJlZm9yZSByZW1vdmluZyBpdCBmcm9tIHRoZSBwZW5kaW5nIHRhc2tzIChvciB0aGUgdGFza3Mgc2VydmljZSBzaG91bGRcbiAgICAgIC8vIG5vdCBzeW5jaHJvbm91c2x5IGVtaXQgc3RhYmxlLCBzaW1pbGFyIHRvIGhvdyBab25lIHN0YWJsZW5lc3Mgb25seSBoYXBwZW5zIGlmIGl0J3Mgc3RpbGxcbiAgICAgIC8vIHN0YWJsZSBhZnRlciBhIG1pY3JvdGFzaykuXG4gICAgICBjb25zdCB0YXNrSWQgPSB0aGlzLnBlbmRpbmdSZW5kZXJUYXNrSWQhO1xuICAgICAgdGhpcy5wZW5kaW5nUmVuZGVyVGFza0lkID0gbnVsbDtcbiAgICAgIHRoaXMudGFza1NlcnZpY2UucmVtb3ZlKHRhc2tJZCk7XG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwcm92aWRlWm9uZWxlc3NDaGFuZ2VEZXRlY3Rpb24oKTogRW52aXJvbm1lbnRQcm92aWRlcnMge1xuICByZXR1cm4gbWFrZUVudmlyb25tZW50UHJvdmlkZXJzKFtcbiAgICB7cHJvdmlkZTogQ2hhbmdlRGV0ZWN0aW9uU2NoZWR1bGVyLCB1c2VFeGlzdGluZzogQ2hhbmdlRGV0ZWN0aW9uU2NoZWR1bGVySW1wbH0sXG4gICAge3Byb3ZpZGU6IE5nWm9uZSwgdXNlQ2xhc3M6IE5vb3BOZ1pvbmV9LFxuICBdKTtcbn1cbiJdfQ==