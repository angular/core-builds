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
import { global } from '../../util/global';
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
        this.raceTimeoutAndRequestAnimationFrame();
    }
    /**
     * Run change detection after the first of setTimeout and requestAnimationFrame resolves.
     *
     * - `requestAnimationFrame` ensures that change detection runs ahead of a browser repaint.
     * This ensures that the create and update passes of a change detection always happen
     * in the same frame.
     * - When the browser is resource-starved, `rAF` can execute _before_ a `setTimeout` because
     * rendering is a very high priority process. This means that `setTimeout` cannot guarantee
     * same-frame create and update pass, when `setTimeout` is used to schedule the update phase.
     * - While `rAF` gives us the desirable same-frame updates, it has two limitations that
     * prevent it from being used alone. First, it does not run in background tabs, which would
     * prevent Angular from initializing an application when opened in a new tab (for example).
     * Second, repeated calls to requestAnimationFrame will execute at the refresh rate of the
     * hardware (~16ms for a 60Hz display). This would cause significant slowdown of tests that
     * are written with several updates and asserts in the form of "update; await stable; assert;".
     * - Both `setTimeout` and `rAF` are able to "coalesce" several events from a single user
     * interaction into a single change detection. Importantly, this reduces view tree traversals when
     * compared to an alternative timing mechanism like `queueMicrotask`, where change detection would
     * then be interleaves between each event.
     *
     * By running change detection after the first of `setTimeout` and `rAF` to execute, we get the
     * best of both worlds.
     */
    async raceTimeoutAndRequestAnimationFrame() {
        const timeout = new Promise(resolve => setTimeout(resolve));
        const rAF = typeof global['requestAnimationFrame'] === 'function' ?
            new Promise(resolve => requestAnimationFrame(() => resolve())) :
            null;
        await Promise.race([timeout, rAF]);
        this.tick();
    }
    tick() {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiem9uZWxlc3Nfc2NoZWR1bGluZ19pbXBsLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvY2hhbmdlX2RldGVjdGlvbi9zY2hlZHVsaW5nL3pvbmVsZXNzX3NjaGVkdWxpbmdfaW1wbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0sbUNBQW1DLENBQUM7QUFDakUsT0FBTyxFQUF1QixNQUFNLEVBQUUsVUFBVSxFQUFFLHdCQUF3QixFQUFDLE1BQU0sVUFBVSxDQUFDO0FBQzVGLE9BQU8sRUFBQyxZQUFZLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUNqRCxPQUFPLEVBQUMsTUFBTSxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDekMsT0FBTyxFQUFDLE1BQU0sRUFBRSxVQUFVLEVBQUMsTUFBTSxvQkFBb0IsQ0FBQztBQUV0RCxPQUFPLEVBQUMsd0JBQXdCLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQzs7QUFFL0QsTUFDTSw0QkFBNEI7SUFEbEM7UUFFVSxXQUFNLEdBQUcsTUFBTSxDQUFDLGNBQWMsQ0FBQyxDQUFDO1FBQ2hDLGdCQUFXLEdBQUcsTUFBTSxDQUFDLFlBQVksQ0FBQyxDQUFDO1FBQ25DLHdCQUFtQixHQUFnQixJQUFJLENBQUM7S0EyRGpEO0lBekRDLE1BQU07UUFDSixJQUFJLElBQUksQ0FBQyxtQkFBbUIsS0FBSyxJQUFJO1lBQUUsT0FBTztRQUU5QyxJQUFJLENBQUMsbUJBQW1CLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxHQUFHLEVBQUUsQ0FBQztRQUNsRCxJQUFJLENBQUMsbUNBQW1DLEVBQUUsQ0FBQztJQUM3QyxDQUFDO0lBRUQ7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7T0FzQkc7SUFDSyxLQUFLLENBQUMsbUNBQW1DO1FBQy9DLE1BQU0sT0FBTyxHQUFHLElBQUksT0FBTyxDQUFPLE9BQU8sQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7UUFDbEUsTUFBTSxHQUFHLEdBQUcsT0FBTyxNQUFNLENBQUMsdUJBQXVCLENBQUMsS0FBSyxVQUFVLENBQUMsQ0FBQztZQUMvRCxJQUFJLE9BQU8sQ0FBTyxPQUFPLENBQUMsRUFBRSxDQUFDLHFCQUFxQixDQUFDLEdBQUcsRUFBRSxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3RFLElBQUksQ0FBQztRQUNULE1BQU0sT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLE9BQU8sRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDO1FBRW5DLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztJQUNkLENBQUM7SUFFTyxJQUFJO1FBQ1YsSUFBSSxDQUFDO1lBQ0gsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxFQUFFLENBQUM7Z0JBQzNCLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDckIsQ0FBQztRQUNILENBQUM7Z0JBQVMsQ0FBQztZQUNULDBGQUEwRjtZQUMxRiwwRkFBMEY7WUFDMUYseUZBQXlGO1lBQ3pGLDJGQUEyRjtZQUMzRiwyRkFBMkY7WUFDM0YsNkJBQTZCO1lBQzdCLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxtQkFBb0IsQ0FBQztZQUN6QyxJQUFJLENBQUMsbUJBQW1CLEdBQUcsSUFBSSxDQUFDO1lBQ2hDLElBQUksQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ2xDLENBQUM7SUFDSCxDQUFDOzZGQTdERyw0QkFBNEI7dUVBQTVCLDRCQUE0QixXQUE1Qiw0QkFBNEIsbUJBRFQsTUFBTTs7Z0ZBQ3pCLDRCQUE0QjtjQURqQyxVQUFVO2VBQUMsRUFBQyxVQUFVLEVBQUUsTUFBTSxFQUFDOztBQWlFaEMsTUFBTSxVQUFVLDhCQUE4QjtJQUM1QyxPQUFPLHdCQUF3QixDQUFDO1FBQzlCLEVBQUMsT0FBTyxFQUFFLHdCQUF3QixFQUFFLFdBQVcsRUFBRSw0QkFBNEIsRUFBQztRQUM5RSxFQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsUUFBUSxFQUFFLFVBQVUsRUFBQztLQUN4QyxDQUFDLENBQUM7QUFDTCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7QXBwbGljYXRpb25SZWZ9IGZyb20gJy4uLy4uL2FwcGxpY2F0aW9uL2FwcGxpY2F0aW9uX3JlZic7XG5pbXBvcnQge0Vudmlyb25tZW50UHJvdmlkZXJzLCBpbmplY3QsIEluamVjdGFibGUsIG1ha2VFbnZpcm9ubWVudFByb3ZpZGVyc30gZnJvbSAnLi4vLi4vZGknO1xuaW1wb3J0IHtQZW5kaW5nVGFza3N9IGZyb20gJy4uLy4uL3BlbmRpbmdfdGFza3MnO1xuaW1wb3J0IHtnbG9iYWx9IGZyb20gJy4uLy4uL3V0aWwvZ2xvYmFsJztcbmltcG9ydCB7Tmdab25lLCBOb29wTmdab25lfSBmcm9tICcuLi8uLi96b25lL25nX3pvbmUnO1xuXG5pbXBvcnQge0NoYW5nZURldGVjdGlvblNjaGVkdWxlcn0gZnJvbSAnLi96b25lbGVzc19zY2hlZHVsaW5nJztcblxuQEluamVjdGFibGUoe3Byb3ZpZGVkSW46ICdyb290J30pXG5jbGFzcyBDaGFuZ2VEZXRlY3Rpb25TY2hlZHVsZXJJbXBsIGltcGxlbWVudHMgQ2hhbmdlRGV0ZWN0aW9uU2NoZWR1bGVyIHtcbiAgcHJpdmF0ZSBhcHBSZWYgPSBpbmplY3QoQXBwbGljYXRpb25SZWYpO1xuICBwcml2YXRlIHRhc2tTZXJ2aWNlID0gaW5qZWN0KFBlbmRpbmdUYXNrcyk7XG4gIHByaXZhdGUgcGVuZGluZ1JlbmRlclRhc2tJZDogbnVtYmVyfG51bGwgPSBudWxsO1xuXG4gIG5vdGlmeSgpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5wZW5kaW5nUmVuZGVyVGFza0lkICE9PSBudWxsKSByZXR1cm47XG5cbiAgICB0aGlzLnBlbmRpbmdSZW5kZXJUYXNrSWQgPSB0aGlzLnRhc2tTZXJ2aWNlLmFkZCgpO1xuICAgIHRoaXMucmFjZVRpbWVvdXRBbmRSZXF1ZXN0QW5pbWF0aW9uRnJhbWUoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSdW4gY2hhbmdlIGRldGVjdGlvbiBhZnRlciB0aGUgZmlyc3Qgb2Ygc2V0VGltZW91dCBhbmQgcmVxdWVzdEFuaW1hdGlvbkZyYW1lIHJlc29sdmVzLlxuICAgKlxuICAgKiAtIGByZXF1ZXN0QW5pbWF0aW9uRnJhbWVgIGVuc3VyZXMgdGhhdCBjaGFuZ2UgZGV0ZWN0aW9uIHJ1bnMgYWhlYWQgb2YgYSBicm93c2VyIHJlcGFpbnQuXG4gICAqIFRoaXMgZW5zdXJlcyB0aGF0IHRoZSBjcmVhdGUgYW5kIHVwZGF0ZSBwYXNzZXMgb2YgYSBjaGFuZ2UgZGV0ZWN0aW9uIGFsd2F5cyBoYXBwZW5cbiAgICogaW4gdGhlIHNhbWUgZnJhbWUuXG4gICAqIC0gV2hlbiB0aGUgYnJvd3NlciBpcyByZXNvdXJjZS1zdGFydmVkLCBgckFGYCBjYW4gZXhlY3V0ZSBfYmVmb3JlXyBhIGBzZXRUaW1lb3V0YCBiZWNhdXNlXG4gICAqIHJlbmRlcmluZyBpcyBhIHZlcnkgaGlnaCBwcmlvcml0eSBwcm9jZXNzLiBUaGlzIG1lYW5zIHRoYXQgYHNldFRpbWVvdXRgIGNhbm5vdCBndWFyYW50ZWVcbiAgICogc2FtZS1mcmFtZSBjcmVhdGUgYW5kIHVwZGF0ZSBwYXNzLCB3aGVuIGBzZXRUaW1lb3V0YCBpcyB1c2VkIHRvIHNjaGVkdWxlIHRoZSB1cGRhdGUgcGhhc2UuXG4gICAqIC0gV2hpbGUgYHJBRmAgZ2l2ZXMgdXMgdGhlIGRlc2lyYWJsZSBzYW1lLWZyYW1lIHVwZGF0ZXMsIGl0IGhhcyB0d28gbGltaXRhdGlvbnMgdGhhdFxuICAgKiBwcmV2ZW50IGl0IGZyb20gYmVpbmcgdXNlZCBhbG9uZS4gRmlyc3QsIGl0IGRvZXMgbm90IHJ1biBpbiBiYWNrZ3JvdW5kIHRhYnMsIHdoaWNoIHdvdWxkXG4gICAqIHByZXZlbnQgQW5ndWxhciBmcm9tIGluaXRpYWxpemluZyBhbiBhcHBsaWNhdGlvbiB3aGVuIG9wZW5lZCBpbiBhIG5ldyB0YWIgKGZvciBleGFtcGxlKS5cbiAgICogU2Vjb25kLCByZXBlYXRlZCBjYWxscyB0byByZXF1ZXN0QW5pbWF0aW9uRnJhbWUgd2lsbCBleGVjdXRlIGF0IHRoZSByZWZyZXNoIHJhdGUgb2YgdGhlXG4gICAqIGhhcmR3YXJlICh+MTZtcyBmb3IgYSA2MEh6IGRpc3BsYXkpLiBUaGlzIHdvdWxkIGNhdXNlIHNpZ25pZmljYW50IHNsb3dkb3duIG9mIHRlc3RzIHRoYXRcbiAgICogYXJlIHdyaXR0ZW4gd2l0aCBzZXZlcmFsIHVwZGF0ZXMgYW5kIGFzc2VydHMgaW4gdGhlIGZvcm0gb2YgXCJ1cGRhdGU7IGF3YWl0IHN0YWJsZTsgYXNzZXJ0O1wiLlxuICAgKiAtIEJvdGggYHNldFRpbWVvdXRgIGFuZCBgckFGYCBhcmUgYWJsZSB0byBcImNvYWxlc2NlXCIgc2V2ZXJhbCBldmVudHMgZnJvbSBhIHNpbmdsZSB1c2VyXG4gICAqIGludGVyYWN0aW9uIGludG8gYSBzaW5nbGUgY2hhbmdlIGRldGVjdGlvbi4gSW1wb3J0YW50bHksIHRoaXMgcmVkdWNlcyB2aWV3IHRyZWUgdHJhdmVyc2FscyB3aGVuXG4gICAqIGNvbXBhcmVkIHRvIGFuIGFsdGVybmF0aXZlIHRpbWluZyBtZWNoYW5pc20gbGlrZSBgcXVldWVNaWNyb3Rhc2tgLCB3aGVyZSBjaGFuZ2UgZGV0ZWN0aW9uIHdvdWxkXG4gICAqIHRoZW4gYmUgaW50ZXJsZWF2ZXMgYmV0d2VlbiBlYWNoIGV2ZW50LlxuICAgKlxuICAgKiBCeSBydW5uaW5nIGNoYW5nZSBkZXRlY3Rpb24gYWZ0ZXIgdGhlIGZpcnN0IG9mIGBzZXRUaW1lb3V0YCBhbmQgYHJBRmAgdG8gZXhlY3V0ZSwgd2UgZ2V0IHRoZVxuICAgKiBiZXN0IG9mIGJvdGggd29ybGRzLlxuICAgKi9cbiAgcHJpdmF0ZSBhc3luYyByYWNlVGltZW91dEFuZFJlcXVlc3RBbmltYXRpb25GcmFtZSgpIHtcbiAgICBjb25zdCB0aW1lb3V0ID0gbmV3IFByb21pc2U8dm9pZD4ocmVzb2x2ZSA9PiBzZXRUaW1lb3V0KHJlc29sdmUpKTtcbiAgICBjb25zdCByQUYgPSB0eXBlb2YgZ2xvYmFsWydyZXF1ZXN0QW5pbWF0aW9uRnJhbWUnXSA9PT0gJ2Z1bmN0aW9uJyA/XG4gICAgICAgIG5ldyBQcm9taXNlPHZvaWQ+KHJlc29sdmUgPT4gcmVxdWVzdEFuaW1hdGlvbkZyYW1lKCgpID0+IHJlc29sdmUoKSkpIDpcbiAgICAgICAgbnVsbDtcbiAgICBhd2FpdCBQcm9taXNlLnJhY2UoW3RpbWVvdXQsIHJBRl0pO1xuXG4gICAgdGhpcy50aWNrKCk7XG4gIH1cblxuICBwcml2YXRlIHRpY2soKSB7XG4gICAgdHJ5IHtcbiAgICAgIGlmICghdGhpcy5hcHBSZWYuZGVzdHJveWVkKSB7XG4gICAgICAgIHRoaXMuYXBwUmVmLnRpY2soKTtcbiAgICAgIH1cbiAgICB9IGZpbmFsbHkge1xuICAgICAgLy8gSWYgdGhpcyBpcyB0aGUgbGFzdCB0YXNrLCB0aGUgc2VydmljZSB3aWxsIHN5bmNocm9ub3VzbHkgZW1pdCBhIHN0YWJsZSBub3RpZmljYXRpb24uIElmXG4gICAgICAvLyB0aGVyZSBpcyBhIHN1YnNjcmliZXIgdGhhdCB0aGVuIGFjdHMgaW4gYSB3YXkgdGhhdCB0cmllcyB0byBub3RpZnkgdGhlIHNjaGVkdWxlciBhZ2FpbixcbiAgICAgIC8vIHdlIG5lZWQgdG8gYmUgYWJsZSB0byByZXNwb25kIHRvIHNjaGVkdWxlIGEgbmV3IGNoYW5nZSBkZXRlY3Rpb24uIFRoZXJlZm9yZSwgd2Ugc2hvdWxkXG4gICAgICAvLyBjbGVhciB0aGUgdGFzayBJRCBiZWZvcmUgcmVtb3ZpbmcgaXQgZnJvbSB0aGUgcGVuZGluZyB0YXNrcyAob3IgdGhlIHRhc2tzIHNlcnZpY2Ugc2hvdWxkXG4gICAgICAvLyBub3Qgc3luY2hyb25vdXNseSBlbWl0IHN0YWJsZSwgc2ltaWxhciB0byBob3cgWm9uZSBzdGFibGVuZXNzIG9ubHkgaGFwcGVucyBpZiBpdCdzIHN0aWxsXG4gICAgICAvLyBzdGFibGUgYWZ0ZXIgYSBtaWNyb3Rhc2spLlxuICAgICAgY29uc3QgdGFza0lkID0gdGhpcy5wZW5kaW5nUmVuZGVyVGFza0lkITtcbiAgICAgIHRoaXMucGVuZGluZ1JlbmRlclRhc2tJZCA9IG51bGw7XG4gICAgICB0aGlzLnRhc2tTZXJ2aWNlLnJlbW92ZSh0YXNrSWQpO1xuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gcHJvdmlkZVpvbmVsZXNzQ2hhbmdlRGV0ZWN0aW9uKCk6IEVudmlyb25tZW50UHJvdmlkZXJzIHtcbiAgcmV0dXJuIG1ha2VFbnZpcm9ubWVudFByb3ZpZGVycyhbXG4gICAge3Byb3ZpZGU6IENoYW5nZURldGVjdGlvblNjaGVkdWxlciwgdXNlRXhpc3Rpbmc6IENoYW5nZURldGVjdGlvblNjaGVkdWxlckltcGx9LFxuICAgIHtwcm92aWRlOiBOZ1pvbmUsIHVzZUNsYXNzOiBOb29wTmdab25lfSxcbiAgXSk7XG59XG4iXX0=