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
import { NgZone, NoopNgZone } from '../../zone/ng_zone';
import { ChangeDetectionScheduler } from './zoneless_scheduling';
import * as i0 from "../../r3_symbols";
class ChangeDetectionSchedulerImpl {
    constructor() {
        this.appRef = inject(ApplicationRef);
        this.taskService = inject(PendingTasks);
        this.pendingRenderTaskId = null;
    }
    notify() {
        if (this.pendingRenderTaskId !== null)
            return;
        this.pendingRenderTaskId = this.taskService.add();
        setTimeout(() => {
            try {
                if (!this.appRef.destroyed) {
                    this.appRef.tick();
                }
            }
            finally {
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
        });
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiem9uZWxlc3Nfc2NoZWR1bGluZ19pbXBsLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvY2hhbmdlX2RldGVjdGlvbi9zY2hlZHVsaW5nL3pvbmVsZXNzX3NjaGVkdWxpbmdfaW1wbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0sbUNBQW1DLENBQUM7QUFDakUsT0FBTyxFQUF1QixNQUFNLEVBQUUsVUFBVSxFQUFFLHdCQUF3QixFQUFDLE1BQU0sVUFBVSxDQUFDO0FBQzVGLE9BQU8sRUFBQyxZQUFZLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUNqRCxPQUFPLEVBQUMsTUFBTSxFQUFFLFVBQVUsRUFBQyxNQUFNLG9CQUFvQixDQUFDO0FBRXRELE9BQU8sRUFBQyx3QkFBd0IsRUFBQyxNQUFNLHVCQUF1QixDQUFDOztBQUUvRCxNQUNNLDRCQUE0QjtJQURsQztRQUVVLFdBQU0sR0FBRyxNQUFNLENBQUMsY0FBYyxDQUFDLENBQUM7UUFDaEMsZ0JBQVcsR0FBRyxNQUFNLENBQUMsWUFBWSxDQUFDLENBQUM7UUFDbkMsd0JBQW1CLEdBQWdCLElBQUksQ0FBQztLQXdCakQ7SUF0QkMsTUFBTTtRQUNKLElBQUksSUFBSSxDQUFDLG1CQUFtQixLQUFLLElBQUk7WUFBRSxPQUFPO1FBRTlDLElBQUksQ0FBQyxtQkFBbUIsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLEdBQUcsRUFBRSxDQUFDO1FBQ2xELFVBQVUsQ0FBQyxHQUFHLEVBQUU7WUFDZCxJQUFJLENBQUM7Z0JBQ0gsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxFQUFFLENBQUM7b0JBQzNCLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLENBQUM7Z0JBQ3JCLENBQUM7WUFDSCxDQUFDO29CQUFTLENBQUM7Z0JBQ1QsMEZBQTBGO2dCQUMxRiwwRkFBMEY7Z0JBQzFGLHlGQUF5RjtnQkFDekYsMkZBQTJGO2dCQUMzRiwyRkFBMkY7Z0JBQzNGLDZCQUE2QjtnQkFDN0IsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLG1CQUFvQixDQUFDO2dCQUN6QyxJQUFJLENBQUMsbUJBQW1CLEdBQUcsSUFBSSxDQUFDO2dCQUNoQyxJQUFJLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUNsQyxDQUFDO1FBQ0gsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDOzZGQTFCRyw0QkFBNEI7dUVBQTVCLDRCQUE0QixXQUE1Qiw0QkFBNEIsbUJBRFQsTUFBTTs7Z0ZBQ3pCLDRCQUE0QjtjQURqQyxVQUFVO2VBQUMsRUFBQyxVQUFVLEVBQUUsTUFBTSxFQUFDOztBQThCaEMsTUFBTSxVQUFVLDhCQUE4QjtJQUM1QyxPQUFPLHdCQUF3QixDQUFDO1FBQzlCLEVBQUMsT0FBTyxFQUFFLHdCQUF3QixFQUFFLFdBQVcsRUFBRSw0QkFBNEIsRUFBQztRQUM5RSxFQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsUUFBUSxFQUFFLFVBQVUsRUFBQztLQUN4QyxDQUFDLENBQUM7QUFDTCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7QXBwbGljYXRpb25SZWZ9IGZyb20gJy4uLy4uL2FwcGxpY2F0aW9uL2FwcGxpY2F0aW9uX3JlZic7XG5pbXBvcnQge0Vudmlyb25tZW50UHJvdmlkZXJzLCBpbmplY3QsIEluamVjdGFibGUsIG1ha2VFbnZpcm9ubWVudFByb3ZpZGVyc30gZnJvbSAnLi4vLi4vZGknO1xuaW1wb3J0IHtQZW5kaW5nVGFza3N9IGZyb20gJy4uLy4uL3BlbmRpbmdfdGFza3MnO1xuaW1wb3J0IHtOZ1pvbmUsIE5vb3BOZ1pvbmV9IGZyb20gJy4uLy4uL3pvbmUvbmdfem9uZSc7XG5cbmltcG9ydCB7Q2hhbmdlRGV0ZWN0aW9uU2NoZWR1bGVyfSBmcm9tICcuL3pvbmVsZXNzX3NjaGVkdWxpbmcnO1xuXG5ASW5qZWN0YWJsZSh7cHJvdmlkZWRJbjogJ3Jvb3QnfSlcbmNsYXNzIENoYW5nZURldGVjdGlvblNjaGVkdWxlckltcGwgaW1wbGVtZW50cyBDaGFuZ2VEZXRlY3Rpb25TY2hlZHVsZXIge1xuICBwcml2YXRlIGFwcFJlZiA9IGluamVjdChBcHBsaWNhdGlvblJlZik7XG4gIHByaXZhdGUgdGFza1NlcnZpY2UgPSBpbmplY3QoUGVuZGluZ1Rhc2tzKTtcbiAgcHJpdmF0ZSBwZW5kaW5nUmVuZGVyVGFza0lkOiBudW1iZXJ8bnVsbCA9IG51bGw7XG5cbiAgbm90aWZ5KCk6IHZvaWQge1xuICAgIGlmICh0aGlzLnBlbmRpbmdSZW5kZXJUYXNrSWQgIT09IG51bGwpIHJldHVybjtcblxuICAgIHRoaXMucGVuZGluZ1JlbmRlclRhc2tJZCA9IHRoaXMudGFza1NlcnZpY2UuYWRkKCk7XG4gICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICB0cnkge1xuICAgICAgICBpZiAoIXRoaXMuYXBwUmVmLmRlc3Ryb3llZCkge1xuICAgICAgICAgIHRoaXMuYXBwUmVmLnRpY2soKTtcbiAgICAgICAgfVxuICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgLy8gSWYgdGhpcyBpcyB0aGUgbGFzdCB0YXNrLCB0aGUgc2VydmljZSB3aWxsIHN5bmNocm9ub3VzbHkgZW1pdCBhIHN0YWJsZSBub3RpZmljYXRpb24uIElmXG4gICAgICAgIC8vIHRoZXJlIGlzIGEgc3Vic2NyaWJlciB0aGF0IHRoZW4gYWN0cyBpbiBhIHdheSB0aGF0IHRyaWVzIHRvIG5vdGlmeSB0aGUgc2NoZWR1bGVyIGFnYWluLFxuICAgICAgICAvLyB3ZSBuZWVkIHRvIGJlIGFibGUgdG8gcmVzcG9uZCB0byBzY2hlZHVsZSBhIG5ldyBjaGFuZ2UgZGV0ZWN0aW9uLiBUaGVyZWZvcmUsIHdlIHNob3VsZFxuICAgICAgICAvLyBjbGVhciB0aGUgdGFzayBJRCBiZWZvcmUgcmVtb3ZpbmcgaXQgZnJvbSB0aGUgcGVuZGluZyB0YXNrcyAob3IgdGhlIHRhc2tzIHNlcnZpY2Ugc2hvdWxkXG4gICAgICAgIC8vIG5vdCBzeW5jaHJvbm91c2x5IGVtaXQgc3RhYmxlLCBzaW1pbGFyIHRvIGhvdyBab25lIHN0YWJsZW5lc3Mgb25seSBoYXBwZW5zIGlmIGl0J3Mgc3RpbGxcbiAgICAgICAgLy8gc3RhYmxlIGFmdGVyIGEgbWljcm90YXNrKS5cbiAgICAgICAgY29uc3QgdGFza0lkID0gdGhpcy5wZW5kaW5nUmVuZGVyVGFza0lkITtcbiAgICAgICAgdGhpcy5wZW5kaW5nUmVuZGVyVGFza0lkID0gbnVsbDtcbiAgICAgICAgdGhpcy50YXNrU2VydmljZS5yZW1vdmUodGFza0lkKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gcHJvdmlkZVpvbmVsZXNzQ2hhbmdlRGV0ZWN0aW9uKCk6IEVudmlyb25tZW50UHJvdmlkZXJzIHtcbiAgcmV0dXJuIG1ha2VFbnZpcm9ubWVudFByb3ZpZGVycyhbXG4gICAge3Byb3ZpZGU6IENoYW5nZURldGVjdGlvblNjaGVkdWxlciwgdXNlRXhpc3Rpbmc6IENoYW5nZURldGVjdGlvblNjaGVkdWxlckltcGx9LFxuICAgIHtwcm92aWRlOiBOZ1pvbmUsIHVzZUNsYXNzOiBOb29wTmdab25lfSxcbiAgXSk7XG59XG4iXX0=