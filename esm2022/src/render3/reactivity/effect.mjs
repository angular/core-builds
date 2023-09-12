/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { assertInInjectionContext } from '../../di/contextual';
import { InjectionToken } from '../../di/injection_token';
import { Injector } from '../../di/injector';
import { inject } from '../../di/injector_compatibility';
import { ɵɵdefineInjectable } from '../../di/interface/defs';
import { ErrorHandler } from '../../error_handler';
import { DestroyRef } from '../../linker/destroy_ref';
import { isInNotificationPhase, watch } from '../../signals';
/**
 * Not public API, which guarantees `EffectScheduler` only ever comes from the application root
 * injector.
 */
export const APP_EFFECT_SCHEDULER = new InjectionToken('', {
    providedIn: 'root',
    factory: () => inject(EffectScheduler),
});
/**
 * A scheduler which manages the execution of effects.
 */
export class EffectScheduler {
    /** @nocollapse */
    static { this.ɵprov = ɵɵdefineInjectable({
        token: EffectScheduler,
        providedIn: 'root',
        factory: () => new ZoneAwareMicrotaskScheduler(),
    }); }
}
/**
 * An `EffectScheduler` which is capable of queueing scheduled effects per-zone, and flushing them
 * as an explicit operation.
 */
export class ZoneAwareQueueingScheduler {
    constructor() {
        this.queuedEffectCount = 0;
        this.queues = new Map();
    }
    scheduleEffect(handle) {
        const zone = handle.creationZone;
        if (!this.queues.has(zone)) {
            this.queues.set(zone, new Set());
        }
        const queue = this.queues.get(zone);
        if (queue.has(handle)) {
            return;
        }
        this.queuedEffectCount++;
        queue.add(handle);
    }
    /**
     * Run all scheduled effects.
     *
     * Execution order of effects within the same zone is guaranteed to be FIFO, but there is no
     * ordering guarantee between effects scheduled in different zones.
     */
    flush() {
        while (this.queuedEffectCount > 0) {
            for (const [zone, queue] of this.queues) {
                // `zone` here must be defined.
                if (zone === null) {
                    this.flushQueue(queue);
                }
                else {
                    zone.run(() => this.flushQueue(queue));
                }
            }
        }
    }
    flushQueue(queue) {
        for (const handle of queue) {
            queue.delete(handle);
            this.queuedEffectCount--;
            // TODO: what happens if this throws an error?
            handle.run();
        }
    }
    /** @nocollapse */
    static { this.ɵprov = ɵɵdefineInjectable({
        token: ZoneAwareQueueingScheduler,
        providedIn: 'root',
        factory: () => new ZoneAwareQueueingScheduler(),
    }); }
}
/**
 * A wrapper around `ZoneAwareQueueingScheduler` that schedules flushing via the microtask queue
 * when.
 */
export class ZoneAwareMicrotaskScheduler {
    constructor() {
        this.hasQueuedFlush = false;
        this.delegate = new ZoneAwareQueueingScheduler();
        this.flushTask = () => {
            // Leave `hasQueuedFlush` as `true` so we don't queue another microtask if more effects are
            // scheduled during flushing. The flush of the `ZoneAwareQueueingScheduler` delegate is
            // guaranteed to empty the queue.
            this.delegate.flush();
            this.hasQueuedFlush = false;
            // This is a variable initialization, not a method.
            // tslint:disable-next-line:semicolon
        };
    }
    scheduleEffect(handle) {
        this.delegate.scheduleEffect(handle);
        if (!this.hasQueuedFlush) {
            queueMicrotask(this.flushTask);
            this.hasQueuedFlush = true;
        }
    }
}
/**
 * Core reactive node for an Angular effect.
 *
 * `EffectHandle` combines the reactive graph's `Watch` base node for effects with the framework's
 * scheduling abstraction (`EffectScheduler`) as well as automatic cleanup via `DestroyRef` if
 * available/requested.
 */
class EffectHandle {
    constructor(scheduler, effectFn, creationZone, destroyRef, errorHandler, allowSignalWrites) {
        this.scheduler = scheduler;
        this.effectFn = effectFn;
        this.creationZone = creationZone;
        this.errorHandler = errorHandler;
        this.alive = true;
        this.watcher =
            watch((onCleanup) => this.runEffect(onCleanup), () => this.schedule(), allowSignalWrites);
        this.unregisterOnDestroy = destroyRef?.onDestroy(() => this.destroy());
    }
    runEffect(onCleanup) {
        if (!this.alive) {
            // Running a destroyed effect is a no-op.
            return;
        }
        if (ngDevMode && isInNotificationPhase()) {
            throw new Error(`Schedulers cannot synchronously execute effects while scheduling.`);
        }
        try {
            this.effectFn(onCleanup);
        }
        catch (err) {
            this.errorHandler?.handleError(err);
        }
    }
    run() {
        this.watcher.run();
    }
    schedule() {
        if (!this.alive) {
            return;
        }
        this.scheduler.scheduleEffect(this);
    }
    notify() {
        this.watcher.notify();
    }
    destroy() {
        this.alive = false;
        this.watcher.cleanup();
        this.unregisterOnDestroy?.();
        // Note: if the effect is currently scheduled, it's not un-scheduled, and so the scheduler will
        // retain a reference to it. Attempting to execute it will be a no-op.
    }
}
/**
 * Create a global `Effect` for the given reactive function.
 *
 * @developerPreview
 */
export function effect(effectFn, options) {
    !options?.injector && assertInInjectionContext(effect);
    const injector = options?.injector ?? inject(Injector);
    const errorHandler = injector.get(ErrorHandler, null, { optional: true });
    const destroyRef = options?.manualCleanup !== true ? injector.get(DestroyRef) : null;
    const handle = new EffectHandle(injector.get(APP_EFFECT_SCHEDULER), effectFn, (typeof Zone === 'undefined') ? null : Zone.current, destroyRef, errorHandler, options?.allowSignalWrites ?? false);
    // Effects start dirty.
    handle.notify();
    return handle;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWZmZWN0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9yZWFjdGl2aXR5L2VmZmVjdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQUMsd0JBQXdCLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUM3RCxPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0sMEJBQTBCLENBQUM7QUFDeEQsT0FBTyxFQUFDLFFBQVEsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQzNDLE9BQU8sRUFBQyxNQUFNLEVBQUMsTUFBTSxpQ0FBaUMsQ0FBQztBQUN2RCxPQUFPLEVBQUMsa0JBQWtCLEVBQUMsTUFBTSx5QkFBeUIsQ0FBQztBQUMzRCxPQUFPLEVBQUMsWUFBWSxFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFDakQsT0FBTyxFQUFDLFVBQVUsRUFBQyxNQUFNLDBCQUEwQixDQUFDO0FBQ3BELE9BQU8sRUFBQyxxQkFBcUIsRUFBRSxLQUFLLEVBQWdELE1BQU0sZUFBZSxDQUFDO0FBc0IxRzs7O0dBR0c7QUFDSCxNQUFNLENBQUMsTUFBTSxvQkFBb0IsR0FBRyxJQUFJLGNBQWMsQ0FBQyxFQUFFLEVBQUU7SUFDekQsVUFBVSxFQUFFLE1BQU07SUFDbEIsT0FBTyxFQUFFLEdBQUcsRUFBRSxDQUFDLE1BQU0sQ0FBQyxlQUFlLENBQUM7Q0FDdkMsQ0FBQyxDQUFDO0FBRUg7O0dBRUc7QUFDSCxNQUFNLE9BQWdCLGVBQWU7SUFRbkMsa0JBQWtCO2FBQ1gsVUFBSyxHQUE2QixrQkFBa0IsQ0FBQztRQUMxRCxLQUFLLEVBQUUsZUFBZTtRQUN0QixVQUFVLEVBQUUsTUFBTTtRQUNsQixPQUFPLEVBQUUsR0FBRyxFQUFFLENBQUMsSUFBSSwyQkFBMkIsRUFBRTtLQUNqRCxDQUFDLENBQUM7O0FBYUw7OztHQUdHO0FBQ0gsTUFBTSxPQUFPLDBCQUEw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QUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7YXNzZXJ0SW5JbmplY3Rpb25Db250ZXh0fSBmcm9tICcuLi8uLi9kaS9jb250ZXh0dWFsJztcbmltcG9ydCB7SW5qZWN0aW9uVG9rZW59IGZyb20gJy4uLy4uL2RpL2luamVjdGlvbl90b2tlbic7XG5pbXBvcnQge0luamVjdG9yfSBmcm9tICcuLi8uLi9kaS9pbmplY3Rvcic7XG5pbXBvcnQge2luamVjdH0gZnJvbSAnLi4vLi4vZGkvaW5qZWN0b3JfY29tcGF0aWJpbGl0eSc7XG5pbXBvcnQge8m1ybVkZWZpbmVJbmplY3RhYmxlfSBmcm9tICcuLi8uLi9kaS9pbnRlcmZhY2UvZGVmcyc7XG5pbXBvcnQge0Vycm9ySGFuZGxlcn0gZnJvbSAnLi4vLi4vZXJyb3JfaGFuZGxlcic7XG5pbXBvcnQge0Rlc3Ryb3lSZWZ9IGZyb20gJy4uLy4uL2xpbmtlci9kZXN0cm95X3JlZic7XG5pbXBvcnQge2lzSW5Ob3RpZmljYXRpb25QaGFzZSwgd2F0Y2gsIFdhdGNoLCBXYXRjaENsZWFudXBGbiwgV2F0Y2hDbGVhbnVwUmVnaXN0ZXJGbn0gZnJvbSAnLi4vLi4vc2lnbmFscyc7XG5cblxuLyoqXG4gKiBBbiBlZmZlY3QgY2FuLCBvcHRpb25hbGx5LCByZWdpc3RlciBhIGNsZWFudXAgZnVuY3Rpb24uIElmIHJlZ2lzdGVyZWQsIHRoZSBjbGVhbnVwIGlzIGV4ZWN1dGVkXG4gKiBiZWZvcmUgdGhlIG5leHQgZWZmZWN0IHJ1bi4gVGhlIGNsZWFudXAgZnVuY3Rpb24gbWFrZXMgaXQgcG9zc2libGUgdG8gXCJjYW5jZWxcIiBhbnkgd29yayB0aGF0IHRoZVxuICogcHJldmlvdXMgZWZmZWN0IHJ1biBtaWdodCBoYXZlIHN0YXJ0ZWQuXG4gKlxuICogQGRldmVsb3BlclByZXZpZXdcbiAqL1xuZXhwb3J0IHR5cGUgRWZmZWN0Q2xlYW51cEZuID0gKCkgPT4gdm9pZDtcblxuLyoqXG4gKiBBIGNhbGxiYWNrIHBhc3NlZCB0byB0aGUgZWZmZWN0IGZ1bmN0aW9uIHRoYXQgbWFrZXMgaXQgcG9zc2libGUgdG8gcmVnaXN0ZXIgY2xlYW51cCBsb2dpYy5cbiAqL1xuZXhwb3J0IHR5cGUgRWZmZWN0Q2xlYW51cFJlZ2lzdGVyRm4gPSAoY2xlYW51cEZuOiBFZmZlY3RDbGVhbnVwRm4pID0+IHZvaWQ7XG5cbmV4cG9ydCBpbnRlcmZhY2UgU2NoZWR1bGFibGVFZmZlY3Qge1xuICBydW4oKTogdm9pZDtcbiAgY3JlYXRpb25ab25lOiB1bmtub3duO1xufVxuXG4vKipcbiAqIE5vdCBwdWJsaWMgQVBJLCB3aGljaCBndWFyYW50ZWVzIGBFZmZlY3RTY2hlZHVsZXJgIG9ubHkgZXZlciBjb21lcyBmcm9tIHRoZSBhcHBsaWNhdGlvbiByb290XG4gKiBpbmplY3Rvci5cbiAqL1xuZXhwb3J0IGNvbnN0IEFQUF9FRkZFQ1RfU0NIRURVTEVSID0gbmV3IEluamVjdGlvblRva2VuKCcnLCB7XG4gIHByb3ZpZGVkSW46ICdyb290JyxcbiAgZmFjdG9yeTogKCkgPT4gaW5qZWN0KEVmZmVjdFNjaGVkdWxlciksXG59KTtcblxuLyoqXG4gKiBBIHNjaGVkdWxlciB3aGljaCBtYW5hZ2VzIHRoZSBleGVjdXRpb24gb2YgZWZmZWN0cy5cbiAqL1xuZXhwb3J0IGFic3RyYWN0IGNsYXNzIEVmZmVjdFNjaGVkdWxlciB7XG4gIC8qKlxuICAgKiBTY2hlZHVsZSB0aGUgZ2l2ZW4gZWZmZWN0IHRvIGJlIGV4ZWN1dGVkIGF0IGEgbGF0ZXIgdGltZS5cbiAgICpcbiAgICogSXQgaXMgYW4gZXJyb3IgdG8gYXR0ZW1wdCB0byBleGVjdXRlIGFueSBlZmZlY3RzIHN5bmNocm9ub3VzbHkgZHVyaW5nIGEgc2NoZWR1bGluZyBvcGVyYXRpb24uXG4gICAqL1xuICBhYnN0cmFjdCBzY2hlZHVsZUVmZmVjdChlOiBTY2hlZHVsYWJsZUVmZmVjdCk6IHZvaWQ7XG5cbiAgLyoqIEBub2NvbGxhcHNlICovXG4gIHN0YXRpYyDJtXByb3YgPSAvKiogQHB1cmVPckJyZWFrTXlDb2RlICovIMm1ybVkZWZpbmVJbmplY3RhYmxlKHtcbiAgICB0b2tlbjogRWZmZWN0U2NoZWR1bGVyLFxuICAgIHByb3ZpZGVkSW46ICdyb290JyxcbiAgICBmYWN0b3J5OiAoKSA9PiBuZXcgWm9uZUF3YXJlTWljcm90YXNrU2NoZWR1bGVyKCksXG4gIH0pO1xufVxuXG4vKipcbiAqIEludGVyZmFjZSB0byBhbiBgRWZmZWN0U2NoZWR1bGVyYCBjYXBhYmxlIG9mIHJ1bm5pbmcgc2NoZWR1bGVkIGVmZmVjdHMgc3luY2hyb25vdXNseS5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBGbHVzaGFibGVFZmZlY3RSdW5uZXIge1xuICAvKipcbiAgICogUnVuIGFueSBzY2hlZHVsZWQgZWZmZWN0cy5cbiAgICovXG4gIGZsdXNoKCk6IHZvaWQ7XG59XG5cbi8qKlxuICogQW4gYEVmZmVjdFNjaGVkdWxlcmAgd2hpY2ggaXMgY2FwYWJsZSBvZiBxdWV1ZWluZyBzY2hlZHVsZWQgZWZmZWN0cyBwZXItem9uZSwgYW5kIGZsdXNoaW5nIHRoZW1cbiAqIGFzIGFuIGV4cGxpY2l0IG9wZXJhdGlvbi5cbiAqL1xuZXhwb3J0IGNsYXNzIFpvbmVBd2FyZVF1ZXVlaW5nU2NoZWR1bGVyIGltcGxlbWVudHMgRWZmZWN0U2NoZWR1bGVyLCBGbHVzaGFibGVFZmZlY3RSdW5uZXIge1xuICBwcml2YXRlIHF1ZXVlZEVmZmVjdENvdW50ID0gMDtcbiAgcHJpdmF0ZSBxdWV1ZXMgPSBuZXcgTWFwPFpvbmV8bnVsbCwgU2V0PFNjaGVkdWxhYmxlRWZmZWN0Pj4oKTtcblxuICBzY2hlZHVsZUVmZmVjdChoYW5kbGU6IFNjaGVkdWxhYmxlRWZmZWN0KTogdm9pZCB7XG4gICAgY29uc3Qgem9uZSA9IGhhbmRsZS5jcmVhdGlvblpvbmUgYXMgWm9uZSB8IG51bGw7XG4gICAgaWYgKCF0aGlzLnF1ZXVlcy5oYXMoem9uZSkpIHtcbiAgICAgIHRoaXMucXVldWVzLnNldCh6b25lLCBuZXcgU2V0KCkpO1xuICAgIH1cblxuICAgIGNvbnN0IHF1ZXVlID0gdGhpcy5xdWV1ZXMuZ2V0KHpvbmUpITtcbiAgICBpZiAocXVldWUuaGFzKGhhbmRsZSkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy5xdWV1ZWRFZmZlY3RDb3VudCsrO1xuICAgIHF1ZXVlLmFkZChoYW5kbGUpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJ1biBhbGwgc2NoZWR1bGVkIGVmZmVjdHMuXG4gICAqXG4gICAqIEV4ZWN1dGlvbiBvcmRlciBvZiBlZmZlY3RzIHdpdGhpbiB0aGUgc2FtZSB6b25lIGlzIGd1YXJhbnRlZWQgdG8gYmUgRklGTywgYnV0IHRoZXJlIGlzIG5vXG4gICAqIG9yZGVyaW5nIGd1YXJhbnRlZSBiZXR3ZWVuIGVmZmVjdHMgc2NoZWR1bGVkIGluIGRpZmZlcmVudCB6b25lcy5cbiAgICovXG4gIGZsdXNoKCk6IHZvaWQge1xuICAgIHdoaWxlICh0aGlzLnF1ZXVlZEVmZmVjdENvdW50ID4gMCkge1xuICAgICAgZm9yIChjb25zdCBbem9uZSwgcXVldWVdIG9mIHRoaXMucXVldWVzKSB7XG4gICAgICAgIC8vIGB6b25lYCBoZXJlIG11c3QgYmUgZGVmaW5lZC5cbiAgICAgICAgaWYgKHpvbmUgPT09IG51bGwpIHtcbiAgICAgICAgICB0aGlzLmZsdXNoUXVldWUocXVldWUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHpvbmUucnVuKCgpID0+IHRoaXMuZmx1c2hRdWV1ZShxdWV1ZSkpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBmbHVzaFF1ZXVlKHF1ZXVlOiBTZXQ8U2NoZWR1bGFibGVFZmZlY3Q+KTogdm9pZCB7XG4gICAgZm9yIChjb25zdCBoYW5kbGUgb2YgcXVldWUpIHtcbiAgICAgIHF1ZXVlLmRlbGV0ZShoYW5kbGUpO1xuICAgICAgdGhpcy5xdWV1ZWRFZmZlY3RDb3VudC0tO1xuXG4gICAgICAvLyBUT0RPOiB3aGF0IGhhcHBlbnMgaWYgdGhpcyB0aHJvd3MgYW4gZXJyb3I/XG4gICAgICBoYW5kbGUucnVuKCk7XG4gICAgfVxuICB9XG5cbiAgLyoqIEBub2NvbGxhcHNlICovXG4gIHN0YXRpYyDJtXByb3YgPSAvKiogQHB1cmVPckJyZWFrTXlDb2RlICovIMm1ybVkZWZpbmVJbmplY3RhYmxlKHtcbiAgICB0b2tlbjogWm9uZUF3YXJlUXVldWVpbmdTY2hlZHVsZXIsXG4gICAgcHJvdmlkZWRJbjogJ3Jvb3QnLFxuICAgIGZhY3Rvcnk6ICgpID0+IG5ldyBab25lQXdhcmVRdWV1ZWluZ1NjaGVkdWxlcigpLFxuICB9KTtcbn1cblxuLyoqXG4gKiBBIHdyYXBwZXIgYXJvdW5kIGBab25lQXdhcmVRdWV1ZWluZ1NjaGVkdWxlcmAgdGhhdCBzY2hlZHVsZXMgZmx1c2hpbmcgdmlhIHRoZSBtaWNyb3Rhc2sgcXVldWVcbiAqIHdoZW4uXG4gKi9cbmV4cG9ydCBjbGFzcyBab25lQXdhcmVNaWNyb3Rhc2tTY2hlZHVsZXIgaW1wbGVtZW50cyBFZmZlY3RTY2hlZHVsZXIge1xuICBwcml2YXRlIGhhc1F1ZXVlZEZsdXNoID0gZmFsc2U7XG4gIHByaXZhdGUgZGVsZWdhdGUgPSBuZXcgWm9uZUF3YXJlUXVldWVpbmdTY2hlZHVsZXIoKTtcbiAgcHJpdmF0ZSBmbHVzaFRhc2sgPSAoKSA9PiB7XG4gICAgLy8gTGVhdmUgYGhhc1F1ZXVlZEZsdXNoYCBhcyBgdHJ1ZWAgc28gd2UgZG9uJ3QgcXVldWUgYW5vdGhlciBtaWNyb3Rhc2sgaWYgbW9yZSBlZmZlY3RzIGFyZVxuICAgIC8vIHNjaGVkdWxlZCBkdXJpbmcgZmx1c2hpbmcuIFRoZSBmbHVzaCBvZiB0aGUgYFpvbmVBd2FyZVF1ZXVlaW5nU2NoZWR1bGVyYCBkZWxlZ2F0ZSBpc1xuICAgIC8vIGd1YXJhbnRlZWQgdG8gZW1wdHkgdGhlIHF1ZXVlLlxuICAgIHRoaXMuZGVsZWdhdGUuZmx1c2goKTtcbiAgICB0aGlzLmhhc1F1ZXVlZEZsdXNoID0gZmFsc2U7XG5cbiAgICAvLyBUaGlzIGlzIGEgdmFyaWFibGUgaW5pdGlhbGl6YXRpb24sIG5vdCBhIG1ldGhvZC5cbiAgICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6c2VtaWNvbG9uXG4gIH07XG5cbiAgc2NoZWR1bGVFZmZlY3QoaGFuZGxlOiBTY2hlZHVsYWJsZUVmZmVjdCk6IHZvaWQge1xuICAgIHRoaXMuZGVsZWdhdGUuc2NoZWR1bGVFZmZlY3QoaGFuZGxlKTtcblxuICAgIGlmICghdGhpcy5oYXNRdWV1ZWRGbHVzaCkge1xuICAgICAgcXVldWVNaWNyb3Rhc2sodGhpcy5mbHVzaFRhc2spO1xuICAgICAgdGhpcy5oYXNRdWV1ZWRGbHVzaCA9IHRydWU7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogQ29yZSByZWFjdGl2ZSBub2RlIGZvciBhbiBBbmd1bGFyIGVmZmVjdC5cbiAqXG4gKiBgRWZmZWN0SGFuZGxlYCBjb21iaW5lcyB0aGUgcmVhY3RpdmUgZ3JhcGgncyBgV2F0Y2hgIGJhc2Ugbm9kZSBmb3IgZWZmZWN0cyB3aXRoIHRoZSBmcmFtZXdvcmsnc1xuICogc2NoZWR1bGluZyBhYnN0cmFjdGlvbiAoYEVmZmVjdFNjaGVkdWxlcmApIGFzIHdlbGwgYXMgYXV0b21hdGljIGNsZWFudXAgdmlhIGBEZXN0cm95UmVmYCBpZlxuICogYXZhaWxhYmxlL3JlcXVlc3RlZC5cbiAqL1xuY2xhc3MgRWZmZWN0SGFuZGxlIGltcGxlbWVudHMgRWZmZWN0UmVmLCBTY2hlZHVsYWJsZUVmZmVjdCB7XG4gIHByaXZhdGUgYWxpdmUgPSB0cnVlO1xuICB1bnJlZ2lzdGVyT25EZXN0cm95OiAoKCkgPT4gdm9pZCl8dW5kZWZpbmVkO1xuICBwcm90ZWN0ZWQgd2F0Y2hlcjogV2F0Y2g7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgICBwcml2YXRlIHNjaGVkdWxlcjogRWZmZWN0U2NoZWR1bGVyLFxuICAgICAgcHJpdmF0ZSBlZmZlY3RGbjogKG9uQ2xlYW51cDogRWZmZWN0Q2xlYW51cFJlZ2lzdGVyRm4pID0+IHZvaWQsXG4gICAgICBwdWJsaWMgY3JlYXRpb25ab25lOiBab25lfG51bGwsIGRlc3Ryb3lSZWY6IERlc3Ryb3lSZWZ8bnVsbCxcbiAgICAgIHByaXZhdGUgZXJyb3JIYW5kbGVyOiBFcnJvckhhbmRsZXJ8bnVsbCwgYWxsb3dTaWduYWxXcml0ZXM6IGJvb2xlYW4pIHtcbiAgICB0aGlzLndhdGNoZXIgPVxuICAgICAgICB3YXRjaCgob25DbGVhbnVwKSA9PiB0aGlzLnJ1bkVmZmVjdChvbkNsZWFudXApLCAoKSA9PiB0aGlzLnNjaGVkdWxlKCksIGFsbG93U2lnbmFsV3JpdGVzKTtcbiAgICB0aGlzLnVucmVnaXN0ZXJPbkRlc3Ryb3kgPSBkZXN0cm95UmVmPy5vbkRlc3Ryb3koKCkgPT4gdGhpcy5kZXN0cm95KCkpO1xuICB9XG5cbiAgcHJpdmF0ZSBydW5FZmZlY3Qob25DbGVhbnVwOiBXYXRjaENsZWFudXBSZWdpc3RlckZuKTogdm9pZCB7XG4gICAgaWYgKCF0aGlzLmFsaXZlKSB7XG4gICAgICAvLyBSdW5uaW5nIGEgZGVzdHJveWVkIGVmZmVjdCBpcyBhIG5vLW9wLlxuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAobmdEZXZNb2RlICYmIGlzSW5Ob3RpZmljYXRpb25QaGFzZSgpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYFNjaGVkdWxlcnMgY2Fubm90IHN5bmNocm9ub3VzbHkgZXhlY3V0ZSBlZmZlY3RzIHdoaWxlIHNjaGVkdWxpbmcuYCk7XG4gICAgfVxuXG4gICAgdHJ5IHtcbiAgICAgIHRoaXMuZWZmZWN0Rm4ob25DbGVhbnVwKTtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIHRoaXMuZXJyb3JIYW5kbGVyPy5oYW5kbGVFcnJvcihlcnIpO1xuICAgIH1cbiAgfVxuXG4gIHJ1bigpOiB2b2lkIHtcbiAgICB0aGlzLndhdGNoZXIucnVuKCk7XG4gIH1cblxuICBwcml2YXRlIHNjaGVkdWxlKCk6IHZvaWQge1xuICAgIGlmICghdGhpcy5hbGl2ZSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuc2NoZWR1bGVyLnNjaGVkdWxlRWZmZWN0KHRoaXMpO1xuICB9XG5cbiAgbm90aWZ5KCk6IHZvaWQge1xuICAgIHRoaXMud2F0Y2hlci5ub3RpZnkoKTtcbiAgfVxuXG4gIGRlc3Ryb3koKTogdm9pZCB7XG4gICAgdGhpcy5hbGl2ZSA9IGZhbHNlO1xuXG4gICAgdGhpcy53YXRjaGVyLmNsZWFudXAoKTtcbiAgICB0aGlzLnVucmVnaXN0ZXJPbkRlc3Ryb3k/LigpO1xuXG4gICAgLy8gTm90ZTogaWYgdGhlIGVmZmVjdCBpcyBjdXJyZW50bHkgc2NoZWR1bGVkLCBpdCdzIG5vdCB1bi1zY2hlZHVsZWQsIGFuZCBzbyB0aGUgc2NoZWR1bGVyIHdpbGxcbiAgICAvLyByZXRhaW4gYSByZWZlcmVuY2UgdG8gaXQuIEF0dGVtcHRpbmcgdG8gZXhlY3V0ZSBpdCB3aWxsIGJlIGEgbm8tb3AuXG4gIH1cbn1cblxuLyoqXG4gKiBBIGdsb2JhbCByZWFjdGl2ZSBlZmZlY3QsIHdoaWNoIGNhbiBiZSBtYW51YWxseSBkZXN0cm95ZWQuXG4gKlxuICogQGRldmVsb3BlclByZXZpZXdcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBFZmZlY3RSZWYge1xuICAvKipcbiAgICogU2h1dCBkb3duIHRoZSBlZmZlY3QsIHJlbW92aW5nIGl0IGZyb20gYW55IHVwY29taW5nIHNjaGVkdWxlZCBleGVjdXRpb25zLlxuICAgKi9cbiAgZGVzdHJveSgpOiB2b2lkO1xufVxuXG4vKipcbiAqIE9wdGlvbnMgcGFzc2VkIHRvIHRoZSBgZWZmZWN0YCBmdW5jdGlvbi5cbiAqXG4gKiBAZGV2ZWxvcGVyUHJldmlld1xuICovXG5leHBvcnQgaW50ZXJmYWNlIENyZWF0ZUVmZmVjdE9wdGlvbnMge1xuICAvKipcbiAgICogVGhlIGBJbmplY3RvcmAgaW4gd2hpY2ggdG8gY3JlYXRlIHRoZSBlZmZlY3QuXG4gICAqXG4gICAqIElmIHRoaXMgaXMgbm90IHByb3ZpZGVkLCB0aGUgY3VycmVudCBbaW5qZWN0aW9uIGNvbnRleHRdKGd1aWRlL2RlcGVuZGVuY3ktaW5qZWN0aW9uLWNvbnRleHQpXG4gICAqIHdpbGwgYmUgdXNlZCBpbnN0ZWFkICh2aWEgYGluamVjdGApLlxuICAgKi9cbiAgaW5qZWN0b3I/OiBJbmplY3RvcjtcblxuICAvKipcbiAgICogV2hldGhlciB0aGUgYGVmZmVjdGAgc2hvdWxkIHJlcXVpcmUgbWFudWFsIGNsZWFudXAuXG4gICAqXG4gICAqIElmIHRoaXMgaXMgYGZhbHNlYCAodGhlIGRlZmF1bHQpIHRoZSBlZmZlY3Qgd2lsbCBhdXRvbWF0aWNhbGx5IHJlZ2lzdGVyIGl0c2VsZiB0byBiZSBjbGVhbmVkIHVwXG4gICAqIHdpdGggdGhlIGN1cnJlbnQgYERlc3Ryb3lSZWZgLlxuICAgKi9cbiAgbWFudWFsQ2xlYW51cD86IGJvb2xlYW47XG5cbiAgLyoqXG4gICAqIFdoZXRoZXIgdGhlIGBlZmZlY3RgIHNob3VsZCBhbGxvdyB3cml0aW5nIHRvIHNpZ25hbHMuXG4gICAqXG4gICAqIFVzaW5nIGVmZmVjdHMgdG8gc3luY2hyb25pemUgZGF0YSBieSB3cml0aW5nIHRvIHNpZ25hbHMgY2FuIGxlYWQgdG8gY29uZnVzaW5nIGFuZCBwb3RlbnRpYWxseVxuICAgKiBpbmNvcnJlY3QgYmVoYXZpb3IsIGFuZCBzaG91bGQgYmUgZW5hYmxlZCBvbmx5IHdoZW4gbmVjZXNzYXJ5LlxuICAgKi9cbiAgYWxsb3dTaWduYWxXcml0ZXM/OiBib29sZWFuO1xufVxuXG4vKipcbiAqIENyZWF0ZSBhIGdsb2JhbCBgRWZmZWN0YCBmb3IgdGhlIGdpdmVuIHJlYWN0aXZlIGZ1bmN0aW9uLlxuICpcbiAqIEBkZXZlbG9wZXJQcmV2aWV3XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlZmZlY3QoXG4gICAgZWZmZWN0Rm46IChvbkNsZWFudXA6IEVmZmVjdENsZWFudXBSZWdpc3RlckZuKSA9PiB2b2lkLFxuICAgIG9wdGlvbnM/OiBDcmVhdGVFZmZlY3RPcHRpb25zKTogRWZmZWN0UmVmIHtcbiAgIW9wdGlvbnM/LmluamVjdG9yICYmIGFzc2VydEluSW5qZWN0aW9uQ29udGV4dChlZmZlY3QpO1xuICBjb25zdCBpbmplY3RvciA9IG9wdGlvbnM/LmluamVjdG9yID8/IGluamVjdChJbmplY3Rvcik7XG4gIGNvbnN0IGVycm9ySGFuZGxlciA9IGluamVjdG9yLmdldChFcnJvckhhbmRsZXIsIG51bGwsIHtvcHRpb25hbDogdHJ1ZX0pO1xuICBjb25zdCBkZXN0cm95UmVmID0gb3B0aW9ucz8ubWFudWFsQ2xlYW51cCAhPT0gdHJ1ZSA/IGluamVjdG9yLmdldChEZXN0cm95UmVmKSA6IG51bGw7XG5cbiAgY29uc3QgaGFuZGxlID0gbmV3IEVmZmVjdEhhbmRsZShcbiAgICAgIGluamVjdG9yLmdldChBUFBfRUZGRUNUX1NDSEVEVUxFUiksIGVmZmVjdEZuLFxuICAgICAgKHR5cGVvZiBab25lID09PSAndW5kZWZpbmVkJykgPyBudWxsIDogWm9uZS5jdXJyZW50LCBkZXN0cm95UmVmLCBlcnJvckhhbmRsZXIsXG4gICAgICBvcHRpb25zPy5hbGxvd1NpZ25hbFdyaXRlcyA/PyBmYWxzZSk7XG5cbiAgLy8gRWZmZWN0cyBzdGFydCBkaXJ0eS5cbiAgaGFuZGxlLm5vdGlmeSgpO1xuXG4gIHJldHVybiBoYW5kbGU7XG59XG4iXX0=