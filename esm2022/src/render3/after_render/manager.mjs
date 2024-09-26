/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */
import { AfterRenderPhase } from './api';
import { NgZone } from '../../zone';
import { inject } from '../../di/injector_compatibility';
import { ɵɵdefineInjectable } from '../../di/interface/defs';
import { ErrorHandler } from '../../error_handler';
import { ChangeDetectionScheduler, } from '../../change_detection/scheduling/zoneless_scheduling';
export class AfterRenderManager {
    constructor() {
        this.impl = null;
    }
    execute() {
        this.impl?.execute();
    }
    /** @nocollapse */
    static { this.ɵprov = ɵɵdefineInjectable({
        token: AfterRenderManager,
        providedIn: 'root',
        factory: () => new AfterRenderManager(),
    }); }
}
export class AfterRenderImpl {
    constructor() {
        this.ngZone = inject(NgZone);
        this.scheduler = inject(ChangeDetectionScheduler);
        this.errorHandler = inject(ErrorHandler, { optional: true });
        /** Current set of active sequences. */
        this.sequences = new Set();
        /** Tracks registrations made during the current set of executions. */
        this.deferredRegistrations = new Set();
        /** Whether the `AfterRenderManager` is currently executing hooks. */
        this.executing = false;
    }
    static { this.PHASES = [
        AfterRenderPhase.EarlyRead,
        AfterRenderPhase.Write,
        AfterRenderPhase.MixedReadWrite,
        AfterRenderPhase.Read,
    ]; }
    /**
     * Run the sequence of phases of hooks, once through. As a result of executing some hooks, more
     * might be scheduled.
     */
    execute() {
        this.executing = true;
        for (const phase of AfterRenderImpl.PHASES) {
            for (const sequence of this.sequences) {
                if (sequence.erroredOrDestroyed || !sequence.hooks[phase]) {
                    continue;
                }
                try {
                    sequence.pipelinedValue = this.ngZone.runOutsideAngular(() => sequence.hooks[phase](sequence.pipelinedValue));
                }
                catch (err) {
                    sequence.erroredOrDestroyed = true;
                    this.errorHandler?.handleError(err);
                }
            }
        }
        this.executing = false;
        // Cleanup step to reset sequence state and also collect one-shot sequences for removal.
        for (const sequence of this.sequences) {
            sequence.afterRun();
            if (sequence.once) {
                this.sequences.delete(sequence);
            }
        }
        for (const sequence of this.deferredRegistrations) {
            this.sequences.add(sequence);
        }
        if (this.deferredRegistrations.size > 0) {
            this.scheduler.notify(7 /* NotificationSource.DeferredRenderHook */);
        }
        this.deferredRegistrations.clear();
    }
    register(sequence) {
        if (!this.executing) {
            this.sequences.add(sequence);
            // Trigger an `ApplicationRef.tick()` if one is not already pending/running, because we have a
            // new render hook that needs to run.
            this.scheduler.notify(6 /* NotificationSource.RenderHook */);
        }
        else {
            this.deferredRegistrations.add(sequence);
        }
    }
    unregister(sequence) {
        if (this.executing && this.sequences.has(sequence)) {
            // We can't remove an `AfterRenderSequence` in the middle of iteration.
            // Instead, mark it as destroyed so it doesn't run any more, and mark it as one-shot so it'll
            // be removed at the end of the current execution.
            sequence.erroredOrDestroyed = true;
            sequence.pipelinedValue = undefined;
            sequence.once = true;
        }
        else {
            // It's safe to directly remove this sequence.
            this.sequences.delete(sequence);
            this.deferredRegistrations.delete(sequence);
        }
    }
    /** @nocollapse */
    static { this.ɵprov = ɵɵdefineInjectable({
        token: AfterRenderImpl,
        providedIn: 'root',
        factory: () => new AfterRenderImpl(),
    }); }
}
export class AfterRenderSequence {
    constructor(impl, hooks, once, destroyRef) {
        this.impl = impl;
        this.hooks = hooks;
        this.once = once;
        /**
         * Whether this sequence errored or was destroyed during this execution, and hooks should no
         * longer run for it.
         */
        this.erroredOrDestroyed = false;
        /**
         * The value returned by the last hook execution (if any), ready to be pipelined into the next
         * one.
         */
        this.pipelinedValue = undefined;
        this.unregisterOnDestroy = destroyRef?.onDestroy(() => this.destroy());
    }
    afterRun() {
        this.erroredOrDestroyed = false;
        this.pipelinedValue = undefined;
    }
    destroy() {
        this.impl.unregister(this);
        this.unregisterOnDestroy?.();
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFuYWdlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvYWZ0ZXJfcmVuZGVyL21hbmFnZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLGdCQUFnQixFQUFpQixNQUFNLE9BQU8sQ0FBQztBQUN2RCxPQUFPLEVBQUMsTUFBTSxFQUFDLE1BQU0sWUFBWSxDQUFDO0FBQ2xDLE9BQU8sRUFBQyxNQUFNLEVBQUMsTUFBTSxpQ0FBaUMsQ0FBQztBQUN2RCxPQUFPLEVBQUMsa0JBQWtCLEVBQUMsTUFBTSx5QkFBeUIsQ0FBQztBQUMzRCxPQUFPLEVBQUMsWUFBWSxFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFDakQsT0FBTyxFQUNMLHdCQUF3QixHQUV6QixNQUFNLHVEQUF1RCxDQUFDO0FBRy9ELE1BQU0sT0FBTyxrQkFBa0I7SUFBL0I7UUFDRSxTQUFJLEdBQTJCLElBQUksQ0FBQztJQVl0QyxDQUFDO0lBVkMsT0FBTztRQUNMLElBQUksQ0FBQyxJQUFJLEVBQUUsT0FBTyxFQUFFLENBQUM7SUFDdkIsQ0FBQztJQUVELGtCQUFrQjthQUNYLFVBQUssR0FBNkIsa0JBQWtCLENBQUM7UUFDMUQsS0FBSyxFQUFFLGtCQUFrQjtRQUN6QixVQUFVLEVBQUUsTUFBTTtRQUNsQixPQUFPLEVBQUUsR0FBRyxFQUFFLENBQUMsSUFBSSxrQkFBa0IsRUFBRTtLQUN4QyxDQUFDLEFBSlUsQ0FJVDs7QUFHTCxNQUFNLE9BQU8sZUFBZTtJQUE1QjtRQVFtQixXQUFNLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ3hCLGNBQVMsR0FBRyxNQUFNLENBQUMsd0JBQXdCLENBQUMsQ0FBQztRQUM3QyxpQkFBWSxHQUFHLE1BQU0sQ0FBQyxZQUFZLEVBQUUsRUFBQyxRQUFRLEVBQUUsSUFBSSxFQUFDLENBQUMsQ0FBQztRQUV2RSx1Q0FBdUM7UUFDdEIsY0FBUyxHQUFHLElBQUksR0FBRyxFQUF1QixDQUFDO1FBRTVELHNFQUFzRTtRQUNyRCwwQkFBcUIsR0FBRyxJQUFJLEdBQUcsRUFBdUIsQ0FBQztRQUV4RSxxRUFBcUU7UUFDckUsY0FBUyxHQUFHLEtBQUssQ0FBQztJQTJFcEIsQ0FBQzthQTdGaUIsV0FBTSxHQUFHO1FBQ3ZCLGdCQUFnQixDQUFDLFNBQVM7UUFDMUIsZ0JBQWdCLENBQUMsS0FBSztRQUN0QixnQkFBZ0IsQ0FBQyxjQUFjO1FBQy9CLGdCQUFnQixDQUFDLElBQUk7S0FDYixBQUxZLENBS1g7SUFlWDs7O09BR0c7SUFDSCxPQUFPO1FBQ0wsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUM7UUFDdEIsS0FBSyxNQUFNLEtBQUssSUFBSSxlQUFlLENBQUMsTUFBTSxFQUFFLENBQUM7WUFDM0MsS0FBSyxNQUFNLFFBQVEsSUFBSSxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUM7Z0JBQ3RDLElBQUksUUFBUSxDQUFDLGtCQUFrQixJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDO29CQUMxRCxTQUFTO2dCQUNYLENBQUM7Z0JBRUQsSUFBSSxDQUFDO29CQUNILFFBQVEsQ0FBQyxjQUFjLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxpQkFBaUIsQ0FBQyxHQUFHLEVBQUUsQ0FDM0QsUUFBUSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUUsQ0FBQyxRQUFRLENBQUMsY0FBYyxDQUFDLENBQ2hELENBQUM7Z0JBQ0osQ0FBQztnQkFBQyxPQUFPLEdBQUcsRUFBRSxDQUFDO29CQUNiLFFBQVEsQ0FBQyxrQkFBa0IsR0FBRyxJQUFJLENBQUM7b0JBQ25DLElBQUksQ0FBQyxZQUFZLEVBQUUsV0FBVyxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUN0QyxDQUFDO1lBQ0gsQ0FBQztRQUNILENBQUM7UUFDRCxJQUFJLENBQUMsU0FBUyxHQUFHLEtBQUssQ0FBQztRQUV2Qix3RkFBd0Y7UUFDeEYsS0FBSyxNQUFNLFFBQVEsSUFBSSxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUM7WUFDdEMsUUFBUSxDQUFDLFFBQVEsRUFBRSxDQUFDO1lBQ3BCLElBQUksUUFBUSxDQUFDLElBQUksRUFBRSxDQUFDO2dCQUNsQixJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUNsQyxDQUFDO1FBQ0gsQ0FBQztRQUVELEtBQUssTUFBTSxRQUFRLElBQUksSUFBSSxDQUFDLHFCQUFxQixFQUFFLENBQUM7WUFDbEQsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDL0IsQ0FBQztRQUNELElBQUksSUFBSSxDQUFDLHFCQUFxQixDQUFDLElBQUksR0FBRyxDQUFDLEVBQUUsQ0FBQztZQUN4QyxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sK0NBQXVDLENBQUM7UUFDL0QsQ0FBQztRQUNELElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxLQUFLLEVBQUUsQ0FBQztJQUNyQyxDQUFDO0lBRUQsUUFBUSxDQUFDLFFBQTZCO1FBQ3BDLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUM7WUFDcEIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDN0IsOEZBQThGO1lBQzlGLHFDQUFxQztZQUNyQyxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sdUNBQStCLENBQUM7UUFDdkQsQ0FBQzthQUFNLENBQUM7WUFDTixJQUFJLENBQUMscUJBQXFCLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQzNDLENBQUM7SUFDSCxDQUFDO0lBRUQsVUFBVSxDQUFDLFFBQTZCO1FBQ3RDLElBQUksSUFBSSxDQUFDLFNBQVMsSUFBSSxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDO1lBQ25ELHVFQUF1RTtZQUN2RSw2RkFBNkY7WUFDN0Ysa0RBQWtEO1lBQ2xELFFBQVEsQ0FBQyxrQkFBa0IsR0FBRyxJQUFJLENBQUM7WUFDbkMsUUFBUSxDQUFDLGNBQWMsR0FBRyxTQUFTLENBQUM7WUFDcEMsUUFBUSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7UUFDdkIsQ0FBQzthQUFNLENBQUM7WUFDTiw4Q0FBOEM7WUFDOUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDaEMsSUFBSSxDQUFDLHFCQUFxQixDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUM5QyxDQUFDO0lBQ0gsQ0FBQztJQUVELGtCQUFrQjthQUNYLFVBQUssR0FBNkIsa0JBQWtCLENBQUM7UUFDMUQsS0FBSyxFQUFFLGVBQWU7UUFDdEIsVUFBVSxFQUFFLE1BQU07UUFDbEIsT0FBTyxFQUFFLEdBQUcsRUFBRSxDQUFDLElBQUksZUFBZSxFQUFFO0tBQ3JDLENBQUMsQUFKVSxDQUlUOztBQVdMLE1BQU0sT0FBTyxtQkFBbUI7SUFlOUIsWUFDVyxJQUFxQixFQUNyQixLQUF1QixFQUN6QixJQUFhLEVBQ3BCLFVBQTZCO1FBSHBCLFNBQUksR0FBSixJQUFJLENBQWlCO1FBQ3JCLFVBQUssR0FBTCxLQUFLLENBQWtCO1FBQ3pCLFNBQUksR0FBSixJQUFJLENBQVM7UUFqQnRCOzs7V0FHRztRQUNILHVCQUFrQixHQUFZLEtBQUssQ0FBQztRQUVwQzs7O1dBR0c7UUFDSCxtQkFBYyxHQUFZLFNBQVMsQ0FBQztRQVVsQyxJQUFJLENBQUMsbUJBQW1CLEdBQUcsVUFBVSxFQUFFLFNBQVMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQztJQUN6RSxDQUFDO0lBRUQsUUFBUTtRQUNOLElBQUksQ0FBQyxrQkFBa0IsR0FBRyxLQUFLLENBQUM7UUFDaEMsSUFBSSxDQUFDLGNBQWMsR0FBRyxTQUFTLENBQUM7SUFDbEMsQ0FBQztJQUVELE9BQU87UUFDTCxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUMzQixJQUFJLENBQUMsbUJBQW1CLEVBQUUsRUFBRSxDQUFDO0lBQy9CLENBQUM7Q0FDRiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmRldi9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtBZnRlclJlbmRlclBoYXNlLCBBZnRlclJlbmRlclJlZn0gZnJvbSAnLi9hcGknO1xuaW1wb3J0IHtOZ1pvbmV9IGZyb20gJy4uLy4uL3pvbmUnO1xuaW1wb3J0IHtpbmplY3R9IGZyb20gJy4uLy4uL2RpL2luamVjdG9yX2NvbXBhdGliaWxpdHknO1xuaW1wb3J0IHvJtcm1ZGVmaW5lSW5qZWN0YWJsZX0gZnJvbSAnLi4vLi4vZGkvaW50ZXJmYWNlL2RlZnMnO1xuaW1wb3J0IHtFcnJvckhhbmRsZXJ9IGZyb20gJy4uLy4uL2Vycm9yX2hhbmRsZXInO1xuaW1wb3J0IHtcbiAgQ2hhbmdlRGV0ZWN0aW9uU2NoZWR1bGVyLFxuICBOb3RpZmljYXRpb25Tb3VyY2UsXG59IGZyb20gJy4uLy4uL2NoYW5nZV9kZXRlY3Rpb24vc2NoZWR1bGluZy96b25lbGVzc19zY2hlZHVsaW5nJztcbmltcG9ydCB7dHlwZSBEZXN0cm95UmVmfSBmcm9tICcuLi8uLi9saW5rZXIvZGVzdHJveV9yZWYnO1xuXG5leHBvcnQgY2xhc3MgQWZ0ZXJSZW5kZXJNYW5hZ2VyIHtcbiAgaW1wbDogQWZ0ZXJSZW5kZXJJbXBsIHwgbnVsbCA9IG51bGw7XG5cbiAgZXhlY3V0ZSgpOiB2b2lkIHtcbiAgICB0aGlzLmltcGw/LmV4ZWN1dGUoKTtcbiAgfVxuXG4gIC8qKiBAbm9jb2xsYXBzZSAqL1xuICBzdGF0aWMgybVwcm92ID0gLyoqIEBwdXJlT3JCcmVha015Q29kZSAqLyDJtcm1ZGVmaW5lSW5qZWN0YWJsZSh7XG4gICAgdG9rZW46IEFmdGVyUmVuZGVyTWFuYWdlcixcbiAgICBwcm92aWRlZEluOiAncm9vdCcsXG4gICAgZmFjdG9yeTogKCkgPT4gbmV3IEFmdGVyUmVuZGVyTWFuYWdlcigpLFxuICB9KTtcbn1cblxuZXhwb3J0IGNsYXNzIEFmdGVyUmVuZGVySW1wbCB7XG4gIHN0YXRpYyByZWFkb25seSBQSEFTRVMgPSBbXG4gICAgQWZ0ZXJSZW5kZXJQaGFzZS5FYXJseVJlYWQsXG4gICAgQWZ0ZXJSZW5kZXJQaGFzZS5Xcml0ZSxcbiAgICBBZnRlclJlbmRlclBoYXNlLk1peGVkUmVhZFdyaXRlLFxuICAgIEFmdGVyUmVuZGVyUGhhc2UuUmVhZCxcbiAgXSBhcyBjb25zdDtcblxuICBwcml2YXRlIHJlYWRvbmx5IG5nWm9uZSA9IGluamVjdChOZ1pvbmUpO1xuICBwcml2YXRlIHJlYWRvbmx5IHNjaGVkdWxlciA9IGluamVjdChDaGFuZ2VEZXRlY3Rpb25TY2hlZHVsZXIpO1xuICBwcml2YXRlIHJlYWRvbmx5IGVycm9ySGFuZGxlciA9IGluamVjdChFcnJvckhhbmRsZXIsIHtvcHRpb25hbDogdHJ1ZX0pO1xuXG4gIC8qKiBDdXJyZW50IHNldCBvZiBhY3RpdmUgc2VxdWVuY2VzLiAqL1xuICBwcml2YXRlIHJlYWRvbmx5IHNlcXVlbmNlcyA9IG5ldyBTZXQ8QWZ0ZXJSZW5kZXJTZXF1ZW5jZT4oKTtcblxuICAvKiogVHJhY2tzIHJlZ2lzdHJhdGlvbnMgbWFkZSBkdXJpbmcgdGhlIGN1cnJlbnQgc2V0IG9mIGV4ZWN1dGlvbnMuICovXG4gIHByaXZhdGUgcmVhZG9ubHkgZGVmZXJyZWRSZWdpc3RyYXRpb25zID0gbmV3IFNldDxBZnRlclJlbmRlclNlcXVlbmNlPigpO1xuXG4gIC8qKiBXaGV0aGVyIHRoZSBgQWZ0ZXJSZW5kZXJNYW5hZ2VyYCBpcyBjdXJyZW50bHkgZXhlY3V0aW5nIGhvb2tzLiAqL1xuICBleGVjdXRpbmcgPSBmYWxzZTtcblxuICAvKipcbiAgICogUnVuIHRoZSBzZXF1ZW5jZSBvZiBwaGFzZXMgb2YgaG9va3MsIG9uY2UgdGhyb3VnaC4gQXMgYSByZXN1bHQgb2YgZXhlY3V0aW5nIHNvbWUgaG9va3MsIG1vcmVcbiAgICogbWlnaHQgYmUgc2NoZWR1bGVkLlxuICAgKi9cbiAgZXhlY3V0ZSgpOiB2b2lkIHtcbiAgICB0aGlzLmV4ZWN1dGluZyA9IHRydWU7XG4gICAgZm9yIChjb25zdCBwaGFzZSBvZiBBZnRlclJlbmRlckltcGwuUEhBU0VTKSB7XG4gICAgICBmb3IgKGNvbnN0IHNlcXVlbmNlIG9mIHRoaXMuc2VxdWVuY2VzKSB7XG4gICAgICAgIGlmIChzZXF1ZW5jZS5lcnJvcmVkT3JEZXN0cm95ZWQgfHwgIXNlcXVlbmNlLmhvb2tzW3BoYXNlXSkge1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBzZXF1ZW5jZS5waXBlbGluZWRWYWx1ZSA9IHRoaXMubmdab25lLnJ1bk91dHNpZGVBbmd1bGFyKCgpID0+XG4gICAgICAgICAgICBzZXF1ZW5jZS5ob29rc1twaGFzZV0hKHNlcXVlbmNlLnBpcGVsaW5lZFZhbHVlKSxcbiAgICAgICAgICApO1xuICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICBzZXF1ZW5jZS5lcnJvcmVkT3JEZXN0cm95ZWQgPSB0cnVlO1xuICAgICAgICAgIHRoaXMuZXJyb3JIYW5kbGVyPy5oYW5kbGVFcnJvcihlcnIpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMuZXhlY3V0aW5nID0gZmFsc2U7XG5cbiAgICAvLyBDbGVhbnVwIHN0ZXAgdG8gcmVzZXQgc2VxdWVuY2Ugc3RhdGUgYW5kIGFsc28gY29sbGVjdCBvbmUtc2hvdCBzZXF1ZW5jZXMgZm9yIHJlbW92YWwuXG4gICAgZm9yIChjb25zdCBzZXF1ZW5jZSBvZiB0aGlzLnNlcXVlbmNlcykge1xuICAgICAgc2VxdWVuY2UuYWZ0ZXJSdW4oKTtcbiAgICAgIGlmIChzZXF1ZW5jZS5vbmNlKSB7XG4gICAgICAgIHRoaXMuc2VxdWVuY2VzLmRlbGV0ZShzZXF1ZW5jZSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgZm9yIChjb25zdCBzZXF1ZW5jZSBvZiB0aGlzLmRlZmVycmVkUmVnaXN0cmF0aW9ucykge1xuICAgICAgdGhpcy5zZXF1ZW5jZXMuYWRkKHNlcXVlbmNlKTtcbiAgICB9XG4gICAgaWYgKHRoaXMuZGVmZXJyZWRSZWdpc3RyYXRpb25zLnNpemUgPiAwKSB7XG4gICAgICB0aGlzLnNjaGVkdWxlci5ub3RpZnkoTm90aWZpY2F0aW9uU291cmNlLkRlZmVycmVkUmVuZGVySG9vayk7XG4gICAgfVxuICAgIHRoaXMuZGVmZXJyZWRSZWdpc3RyYXRpb25zLmNsZWFyKCk7XG4gIH1cblxuICByZWdpc3RlcihzZXF1ZW5jZTogQWZ0ZXJSZW5kZXJTZXF1ZW5jZSk6IHZvaWQge1xuICAgIGlmICghdGhpcy5leGVjdXRpbmcpIHtcbiAgICAgIHRoaXMuc2VxdWVuY2VzLmFkZChzZXF1ZW5jZSk7XG4gICAgICAvLyBUcmlnZ2VyIGFuIGBBcHBsaWNhdGlvblJlZi50aWNrKClgIGlmIG9uZSBpcyBub3QgYWxyZWFkeSBwZW5kaW5nL3J1bm5pbmcsIGJlY2F1c2Ugd2UgaGF2ZSBhXG4gICAgICAvLyBuZXcgcmVuZGVyIGhvb2sgdGhhdCBuZWVkcyB0byBydW4uXG4gICAgICB0aGlzLnNjaGVkdWxlci5ub3RpZnkoTm90aWZpY2F0aW9uU291cmNlLlJlbmRlckhvb2spO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmRlZmVycmVkUmVnaXN0cmF0aW9ucy5hZGQoc2VxdWVuY2UpO1xuICAgIH1cbiAgfVxuXG4gIHVucmVnaXN0ZXIoc2VxdWVuY2U6IEFmdGVyUmVuZGVyU2VxdWVuY2UpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5leGVjdXRpbmcgJiYgdGhpcy5zZXF1ZW5jZXMuaGFzKHNlcXVlbmNlKSkge1xuICAgICAgLy8gV2UgY2FuJ3QgcmVtb3ZlIGFuIGBBZnRlclJlbmRlclNlcXVlbmNlYCBpbiB0aGUgbWlkZGxlIG9mIGl0ZXJhdGlvbi5cbiAgICAgIC8vIEluc3RlYWQsIG1hcmsgaXQgYXMgZGVzdHJveWVkIHNvIGl0IGRvZXNuJ3QgcnVuIGFueSBtb3JlLCBhbmQgbWFyayBpdCBhcyBvbmUtc2hvdCBzbyBpdCdsbFxuICAgICAgLy8gYmUgcmVtb3ZlZCBhdCB0aGUgZW5kIG9mIHRoZSBjdXJyZW50IGV4ZWN1dGlvbi5cbiAgICAgIHNlcXVlbmNlLmVycm9yZWRPckRlc3Ryb3llZCA9IHRydWU7XG4gICAgICBzZXF1ZW5jZS5waXBlbGluZWRWYWx1ZSA9IHVuZGVmaW5lZDtcbiAgICAgIHNlcXVlbmNlLm9uY2UgPSB0cnVlO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBJdCdzIHNhZmUgdG8gZGlyZWN0bHkgcmVtb3ZlIHRoaXMgc2VxdWVuY2UuXG4gICAgICB0aGlzLnNlcXVlbmNlcy5kZWxldGUoc2VxdWVuY2UpO1xuICAgICAgdGhpcy5kZWZlcnJlZFJlZ2lzdHJhdGlvbnMuZGVsZXRlKHNlcXVlbmNlKTtcbiAgICB9XG4gIH1cblxuICAvKiogQG5vY29sbGFwc2UgKi9cbiAgc3RhdGljIMm1cHJvdiA9IC8qKiBAcHVyZU9yQnJlYWtNeUNvZGUgKi8gybXJtWRlZmluZUluamVjdGFibGUoe1xuICAgIHRva2VuOiBBZnRlclJlbmRlckltcGwsXG4gICAgcHJvdmlkZWRJbjogJ3Jvb3QnLFxuICAgIGZhY3Rvcnk6ICgpID0+IG5ldyBBZnRlclJlbmRlckltcGwoKSxcbiAgfSk7XG59XG5cbmV4cG9ydCB0eXBlIEFmdGVyUmVuZGVySG9vayA9ICh2YWx1ZT86IHVua25vd24pID0+IHVua25vd247XG5leHBvcnQgdHlwZSBBZnRlclJlbmRlckhvb2tzID0gW1xuICAvKiAgICAgIEVhcmx5UmVhZCAqLyBBZnRlclJlbmRlckhvb2sgfCB1bmRlZmluZWQsXG4gIC8qICAgICAgICAgIFdyaXRlICovIEFmdGVyUmVuZGVySG9vayB8IHVuZGVmaW5lZCxcbiAgLyogTWl4ZWRSZWFkV3JpdGUgKi8gQWZ0ZXJSZW5kZXJIb29rIHwgdW5kZWZpbmVkLFxuICAvKiAgICAgICAgICAgUmVhZCAqLyBBZnRlclJlbmRlckhvb2sgfCB1bmRlZmluZWQsXG5dO1xuXG5leHBvcnQgY2xhc3MgQWZ0ZXJSZW5kZXJTZXF1ZW5jZSBpbXBsZW1lbnRzIEFmdGVyUmVuZGVyUmVmIHtcbiAgLyoqXG4gICAqIFdoZXRoZXIgdGhpcyBzZXF1ZW5jZSBlcnJvcmVkIG9yIHdhcyBkZXN0cm95ZWQgZHVyaW5nIHRoaXMgZXhlY3V0aW9uLCBhbmQgaG9va3Mgc2hvdWxkIG5vXG4gICAqIGxvbmdlciBydW4gZm9yIGl0LlxuICAgKi9cbiAgZXJyb3JlZE9yRGVzdHJveWVkOiBib29sZWFuID0gZmFsc2U7XG5cbiAgLyoqXG4gICAqIFRoZSB2YWx1ZSByZXR1cm5lZCBieSB0aGUgbGFzdCBob29rIGV4ZWN1dGlvbiAoaWYgYW55KSwgcmVhZHkgdG8gYmUgcGlwZWxpbmVkIGludG8gdGhlIG5leHRcbiAgICogb25lLlxuICAgKi9cbiAgcGlwZWxpbmVkVmFsdWU6IHVua25vd24gPSB1bmRlZmluZWQ7XG5cbiAgcHJpdmF0ZSB1bnJlZ2lzdGVyT25EZXN0cm95OiAoKCkgPT4gdm9pZCkgfCB1bmRlZmluZWQ7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgcmVhZG9ubHkgaW1wbDogQWZ0ZXJSZW5kZXJJbXBsLFxuICAgIHJlYWRvbmx5IGhvb2tzOiBBZnRlclJlbmRlckhvb2tzLFxuICAgIHB1YmxpYyBvbmNlOiBib29sZWFuLFxuICAgIGRlc3Ryb3lSZWY6IERlc3Ryb3lSZWYgfCBudWxsLFxuICApIHtcbiAgICB0aGlzLnVucmVnaXN0ZXJPbkRlc3Ryb3kgPSBkZXN0cm95UmVmPy5vbkRlc3Ryb3koKCkgPT4gdGhpcy5kZXN0cm95KCkpO1xuICB9XG5cbiAgYWZ0ZXJSdW4oKTogdm9pZCB7XG4gICAgdGhpcy5lcnJvcmVkT3JEZXN0cm95ZWQgPSBmYWxzZTtcbiAgICB0aGlzLnBpcGVsaW5lZFZhbHVlID0gdW5kZWZpbmVkO1xuICB9XG5cbiAgZGVzdHJveSgpOiB2b2lkIHtcbiAgICB0aGlzLmltcGwudW5yZWdpc3Rlcih0aGlzKTtcbiAgICB0aGlzLnVucmVnaXN0ZXJPbkRlc3Ryb3k/LigpO1xuICB9XG59XG4iXX0=