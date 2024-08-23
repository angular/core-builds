/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
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
        this.unregisterOnDestroy = destroyRef.onDestroy(() => this.destroy());
    }
    afterRun() {
        this.erroredOrDestroyed = false;
        this.pipelinedValue = undefined;
    }
    destroy() {
        this.impl.unregister(this);
        this.unregisterOnDestroy();
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFuYWdlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvYWZ0ZXJfcmVuZGVyL21hbmFnZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLGdCQUFnQixFQUFpQixNQUFNLE9BQU8sQ0FBQztBQUN2RCxPQUFPLEVBQUMsTUFBTSxFQUFDLE1BQU0sWUFBWSxDQUFDO0FBQ2xDLE9BQU8sRUFBQyxNQUFNLEVBQUMsTUFBTSxpQ0FBaUMsQ0FBQztBQUN2RCxPQUFPLEVBQUMsa0JBQWtCLEVBQUMsTUFBTSx5QkFBeUIsQ0FBQztBQUMzRCxPQUFPLEVBQUMsWUFBWSxFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFDakQsT0FBTyxFQUNMLHdCQUF3QixHQUV6QixNQUFNLHVEQUF1RCxDQUFDO0FBRy9ELE1BQU0sT0FBTyxrQkFBa0I7SUFBL0I7UUFDRSxTQUFJLEdBQTJCLElBQUksQ0FBQztJQVl0QyxDQUFDO0lBVkMsT0FBTztRQUNMLElBQUksQ0FBQyxJQUFJLEVBQUUsT0FBTyxFQUFFLENBQUM7SUFDdkIsQ0FBQztJQUVELGtCQUFrQjthQUNYLFVBQUssR0FBNkIsa0JBQWtCLENBQUM7UUFDMUQsS0FBSyxFQUFFLGtCQUFrQjtRQUN6QixVQUFVLEVBQUUsTUFBTTtRQUNsQixPQUFPLEVBQUUsR0FBRyxFQUFFLENBQUMsSUFBSSxrQkFBa0IsRUFBRTtLQUN4QyxDQUFDLEFBSlUsQ0FJVDs7QUFHTCxNQUFNLE9BQU8sZUFBZTtJQUE1QjtRQVFtQixXQUFNLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ3hCLGNBQVMsR0FBRyxNQUFNLENBQUMsd0JBQXdCLENBQUMsQ0FBQztRQUM3QyxpQkFBWSxHQUFHLE1BQU0sQ0FBQyxZQUFZLEVBQUUsRUFBQyxRQUFRLEVBQUUsSUFBSSxFQUFDLENBQUMsQ0FBQztR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LElBQUksQ0FBQyxtQkFBbUIsRUFBRSxDQUFDO0lBQzdCLENBQUM7Q0FDRiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0FmdGVyUmVuZGVyUGhhc2UsIEFmdGVyUmVuZGVyUmVmfSBmcm9tICcuL2FwaSc7XG5pbXBvcnQge05nWm9uZX0gZnJvbSAnLi4vLi4vem9uZSc7XG5pbXBvcnQge2luamVjdH0gZnJvbSAnLi4vLi4vZGkvaW5qZWN0b3JfY29tcGF0aWJpbGl0eSc7XG5pbXBvcnQge8m1ybVkZWZpbmVJbmplY3RhYmxlfSBmcm9tICcuLi8uLi9kaS9pbnRlcmZhY2UvZGVmcyc7XG5pbXBvcnQge0Vycm9ySGFuZGxlcn0gZnJvbSAnLi4vLi4vZXJyb3JfaGFuZGxlcic7XG5pbXBvcnQge1xuICBDaGFuZ2VEZXRlY3Rpb25TY2hlZHVsZXIsXG4gIE5vdGlmaWNhdGlvblNvdXJjZSxcbn0gZnJvbSAnLi4vLi4vY2hhbmdlX2RldGVjdGlvbi9zY2hlZHVsaW5nL3pvbmVsZXNzX3NjaGVkdWxpbmcnO1xuaW1wb3J0IHt0eXBlIERlc3Ryb3lSZWZ9IGZyb20gJy4uLy4uL2xpbmtlci9kZXN0cm95X3JlZic7XG5cbmV4cG9ydCBjbGFzcyBBZnRlclJlbmRlck1hbmFnZXIge1xuICBpbXBsOiBBZnRlclJlbmRlckltcGwgfCBudWxsID0gbnVsbDtcblxuICBleGVjdXRlKCk6IHZvaWQge1xuICAgIHRoaXMuaW1wbD8uZXhlY3V0ZSgpO1xuICB9XG5cbiAgLyoqIEBub2NvbGxhcHNlICovXG4gIHN0YXRpYyDJtXByb3YgPSAvKiogQHB1cmVPckJyZWFrTXlDb2RlICovIMm1ybVkZWZpbmVJbmplY3RhYmxlKHtcbiAgICB0b2tlbjogQWZ0ZXJSZW5kZXJNYW5hZ2VyLFxuICAgIHByb3ZpZGVkSW46ICdyb290JyxcbiAgICBmYWN0b3J5OiAoKSA9PiBuZXcgQWZ0ZXJSZW5kZXJNYW5hZ2VyKCksXG4gIH0pO1xufVxuXG5leHBvcnQgY2xhc3MgQWZ0ZXJSZW5kZXJJbXBsIHtcbiAgc3RhdGljIHJlYWRvbmx5IFBIQVNFUyA9IFtcbiAgICBBZnRlclJlbmRlclBoYXNlLkVhcmx5UmVhZCxcbiAgICBBZnRlclJlbmRlclBoYXNlLldyaXRlLFxuICAgIEFmdGVyUmVuZGVyUGhhc2UuTWl4ZWRSZWFkV3JpdGUsXG4gICAgQWZ0ZXJSZW5kZXJQaGFzZS5SZWFkLFxuICBdIGFzIGNvbnN0O1xuXG4gIHByaXZhdGUgcmVhZG9ubHkgbmdab25lID0gaW5qZWN0KE5nWm9uZSk7XG4gIHByaXZhdGUgcmVhZG9ubHkgc2NoZWR1bGVyID0gaW5qZWN0KENoYW5nZURldGVjdGlvblNjaGVkdWxlcik7XG4gIHByaXZhdGUgcmVhZG9ubHkgZXJyb3JIYW5kbGVyID0gaW5qZWN0KEVycm9ySGFuZGxlciwge29wdGlvbmFsOiB0cnVlfSk7XG5cbiAgLyoqIEN1cnJlbnQgc2V0IG9mIGFjdGl2ZSBzZXF1ZW5jZXMuICovXG4gIHByaXZhdGUgcmVhZG9ubHkgc2VxdWVuY2VzID0gbmV3IFNldDxBZnRlclJlbmRlclNlcXVlbmNlPigpO1xuXG4gIC8qKiBUcmFja3MgcmVnaXN0cmF0aW9ucyBtYWRlIGR1cmluZyB0aGUgY3VycmVudCBzZXQgb2YgZXhlY3V0aW9ucy4gKi9cbiAgcHJpdmF0ZSByZWFkb25seSBkZWZlcnJlZFJlZ2lzdHJhdGlvbnMgPSBuZXcgU2V0PEFmdGVyUmVuZGVyU2VxdWVuY2U+KCk7XG5cbiAgLyoqIFdoZXRoZXIgdGhlIGBBZnRlclJlbmRlck1hbmFnZXJgIGlzIGN1cnJlbnRseSBleGVjdXRpbmcgaG9va3MuICovXG4gIGV4ZWN1dGluZyA9IGZhbHNlO1xuXG4gIC8qKlxuICAgKiBSdW4gdGhlIHNlcXVlbmNlIG9mIHBoYXNlcyBvZiBob29rcywgb25jZSB0aHJvdWdoLiBBcyBhIHJlc3VsdCBvZiBleGVjdXRpbmcgc29tZSBob29rcywgbW9yZVxuICAgKiBtaWdodCBiZSBzY2hlZHVsZWQuXG4gICAqL1xuICBleGVjdXRlKCk6IHZvaWQge1xuICAgIHRoaXMuZXhlY3V0aW5nID0gdHJ1ZTtcbiAgICBmb3IgKGNvbnN0IHBoYXNlIG9mIEFmdGVyUmVuZGVySW1wbC5QSEFTRVMpIHtcbiAgICAgIGZvciAoY29uc3Qgc2VxdWVuY2Ugb2YgdGhpcy5zZXF1ZW5jZXMpIHtcbiAgICAgICAgaWYgKHNlcXVlbmNlLmVycm9yZWRPckRlc3Ryb3llZCB8fCAhc2VxdWVuY2UuaG9va3NbcGhhc2VdKSB7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cblxuICAgICAgICB0cnkge1xuICAgICAgICAgIHNlcXVlbmNlLnBpcGVsaW5lZFZhbHVlID0gdGhpcy5uZ1pvbmUucnVuT3V0c2lkZUFuZ3VsYXIoKCkgPT5cbiAgICAgICAgICAgIHNlcXVlbmNlLmhvb2tzW3BoYXNlXSEoc2VxdWVuY2UucGlwZWxpbmVkVmFsdWUpLFxuICAgICAgICAgICk7XG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgIHNlcXVlbmNlLmVycm9yZWRPckRlc3Ryb3llZCA9IHRydWU7XG4gICAgICAgICAgdGhpcy5lcnJvckhhbmRsZXI/LmhhbmRsZUVycm9yKGVycik7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5leGVjdXRpbmcgPSBmYWxzZTtcblxuICAgIC8vIENsZWFudXAgc3RlcCB0byByZXNldCBzZXF1ZW5jZSBzdGF0ZSBhbmQgYWxzbyBjb2xsZWN0IG9uZS1zaG90IHNlcXVlbmNlcyBmb3IgcmVtb3ZhbC5cbiAgICBmb3IgKGNvbnN0IHNlcXVlbmNlIG9mIHRoaXMuc2VxdWVuY2VzKSB7XG4gICAgICBzZXF1ZW5jZS5hZnRlclJ1bigpO1xuICAgICAgaWYgKHNlcXVlbmNlLm9uY2UpIHtcbiAgICAgICAgdGhpcy5zZXF1ZW5jZXMuZGVsZXRlKHNlcXVlbmNlKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBmb3IgKGNvbnN0IHNlcXVlbmNlIG9mIHRoaXMuZGVmZXJyZWRSZWdpc3RyYXRpb25zKSB7XG4gICAgICB0aGlzLnNlcXVlbmNlcy5hZGQoc2VxdWVuY2UpO1xuICAgIH1cbiAgICBpZiAodGhpcy5kZWZlcnJlZFJlZ2lzdHJhdGlvbnMuc2l6ZSA+IDApIHtcbiAgICAgIHRoaXMuc2NoZWR1bGVyLm5vdGlmeShOb3RpZmljYXRpb25Tb3VyY2UuRGVmZXJyZWRSZW5kZXJIb29rKTtcbiAgICB9XG4gICAgdGhpcy5kZWZlcnJlZFJlZ2lzdHJhdGlvbnMuY2xlYXIoKTtcbiAgfVxuXG4gIHJlZ2lzdGVyKHNlcXVlbmNlOiBBZnRlclJlbmRlclNlcXVlbmNlKTogdm9pZCB7XG4gICAgaWYgKCF0aGlzLmV4ZWN1dGluZykge1xuICAgICAgdGhpcy5zZXF1ZW5jZXMuYWRkKHNlcXVlbmNlKTtcbiAgICAgIC8vIFRyaWdnZXIgYW4gYEFwcGxpY2F0aW9uUmVmLnRpY2soKWAgaWYgb25lIGlzIG5vdCBhbHJlYWR5IHBlbmRpbmcvcnVubmluZywgYmVjYXVzZSB3ZSBoYXZlIGFcbiAgICAgIC8vIG5ldyByZW5kZXIgaG9vayB0aGF0IG5lZWRzIHRvIHJ1bi5cbiAgICAgIHRoaXMuc2NoZWR1bGVyLm5vdGlmeShOb3RpZmljYXRpb25Tb3VyY2UuUmVuZGVySG9vayk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuZGVmZXJyZWRSZWdpc3RyYXRpb25zLmFkZChzZXF1ZW5jZSk7XG4gICAgfVxuICB9XG5cbiAgdW5yZWdpc3RlcihzZXF1ZW5jZTogQWZ0ZXJSZW5kZXJTZXF1ZW5jZSk6IHZvaWQge1xuICAgIGlmICh0aGlzLmV4ZWN1dGluZyAmJiB0aGlzLnNlcXVlbmNlcy5oYXMoc2VxdWVuY2UpKSB7XG4gICAgICAvLyBXZSBjYW4ndCByZW1vdmUgYW4gYEFmdGVyUmVuZGVyU2VxdWVuY2VgIGluIHRoZSBtaWRkbGUgb2YgaXRlcmF0aW9uLlxuICAgICAgLy8gSW5zdGVhZCwgbWFyayBpdCBhcyBkZXN0cm95ZWQgc28gaXQgZG9lc24ndCBydW4gYW55IG1vcmUsIGFuZCBtYXJrIGl0IGFzIG9uZS1zaG90IHNvIGl0J2xsXG4gICAgICAvLyBiZSByZW1vdmVkIGF0IHRoZSBlbmQgb2YgdGhlIGN1cnJlbnQgZXhlY3V0aW9uLlxuICAgICAgc2VxdWVuY2UuZXJyb3JlZE9yRGVzdHJveWVkID0gdHJ1ZTtcbiAgICAgIHNlcXVlbmNlLnBpcGVsaW5lZFZhbHVlID0gdW5kZWZpbmVkO1xuICAgICAgc2VxdWVuY2Uub25jZSA9IHRydWU7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIEl0J3Mgc2FmZSB0byBkaXJlY3RseSByZW1vdmUgdGhpcyBzZXF1ZW5jZS5cbiAgICAgIHRoaXMuc2VxdWVuY2VzLmRlbGV0ZShzZXF1ZW5jZSk7XG4gICAgICB0aGlzLmRlZmVycmVkUmVnaXN0cmF0aW9ucy5kZWxldGUoc2VxdWVuY2UpO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBAbm9jb2xsYXBzZSAqL1xuICBzdGF0aWMgybVwcm92ID0gLyoqIEBwdXJlT3JCcmVha015Q29kZSAqLyDJtcm1ZGVmaW5lSW5qZWN0YWJsZSh7XG4gICAgdG9rZW46IEFmdGVyUmVuZGVySW1wbCxcbiAgICBwcm92aWRlZEluOiAncm9vdCcsXG4gICAgZmFjdG9yeTogKCkgPT4gbmV3IEFmdGVyUmVuZGVySW1wbCgpLFxuICB9KTtcbn1cblxuZXhwb3J0IHR5cGUgQWZ0ZXJSZW5kZXJIb29rID0gKHZhbHVlPzogdW5rbm93bikgPT4gdW5rbm93bjtcbmV4cG9ydCB0eXBlIEFmdGVyUmVuZGVySG9va3MgPSBbXG4gIC8qICAgICAgRWFybHlSZWFkICovIEFmdGVyUmVuZGVySG9vayB8IHVuZGVmaW5lZCxcbiAgLyogICAgICAgICAgV3JpdGUgKi8gQWZ0ZXJSZW5kZXJIb29rIHwgdW5kZWZpbmVkLFxuICAvKiBNaXhlZFJlYWRXcml0ZSAqLyBBZnRlclJlbmRlckhvb2sgfCB1bmRlZmluZWQsXG4gIC8qICAgICAgICAgICBSZWFkICovIEFmdGVyUmVuZGVySG9vayB8IHVuZGVmaW5lZCxcbl07XG5cbmV4cG9ydCBjbGFzcyBBZnRlclJlbmRlclNlcXVlbmNlIGltcGxlbWVudHMgQWZ0ZXJSZW5kZXJSZWYge1xuICAvKipcbiAgICogV2hldGhlciB0aGlzIHNlcXVlbmNlIGVycm9yZWQgb3Igd2FzIGRlc3Ryb3llZCBkdXJpbmcgdGhpcyBleGVjdXRpb24sIGFuZCBob29rcyBzaG91bGQgbm9cbiAgICogbG9uZ2VyIHJ1biBmb3IgaXQuXG4gICAqL1xuICBlcnJvcmVkT3JEZXN0cm95ZWQ6IGJvb2xlYW4gPSBmYWxzZTtcblxuICAvKipcbiAgICogVGhlIHZhbHVlIHJldHVybmVkIGJ5IHRoZSBsYXN0IGhvb2sgZXhlY3V0aW9uIChpZiBhbnkpLCByZWFkeSB0byBiZSBwaXBlbGluZWQgaW50byB0aGUgbmV4dFxuICAgKiBvbmUuXG4gICAqL1xuICBwaXBlbGluZWRWYWx1ZTogdW5rbm93biA9IHVuZGVmaW5lZDtcblxuICBwcml2YXRlIHVucmVnaXN0ZXJPbkRlc3Ryb3k6ICgpID0+IHZvaWQ7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgcmVhZG9ubHkgaW1wbDogQWZ0ZXJSZW5kZXJJbXBsLFxuICAgIHJlYWRvbmx5IGhvb2tzOiBBZnRlclJlbmRlckhvb2tzLFxuICAgIHB1YmxpYyBvbmNlOiBib29sZWFuLFxuICAgIGRlc3Ryb3lSZWY6IERlc3Ryb3lSZWYsXG4gICkge1xuICAgIHRoaXMudW5yZWdpc3Rlck9uRGVzdHJveSA9IGRlc3Ryb3lSZWYub25EZXN0cm95KCgpID0+IHRoaXMuZGVzdHJveSgpKTtcbiAgfVxuXG4gIGFmdGVyUnVuKCk6IHZvaWQge1xuICAgIHRoaXMuZXJyb3JlZE9yRGVzdHJveWVkID0gZmFsc2U7XG4gICAgdGhpcy5waXBlbGluZWRWYWx1ZSA9IHVuZGVmaW5lZDtcbiAgfVxuXG4gIGRlc3Ryb3koKTogdm9pZCB7XG4gICAgdGhpcy5pbXBsLnVucmVnaXN0ZXIodGhpcyk7XG4gICAgdGhpcy51bnJlZ2lzdGVyT25EZXN0cm95KCk7XG4gIH1cbn1cbiJdfQ==