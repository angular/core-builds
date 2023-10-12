/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { inject, ɵɵdefineInjectable } from '../di';
import { INJECTOR } from '../render3/interfaces/view';
import { NgZone } from '../zone';
import { wrapWithLViewCleanup } from './utils';
/**
 * Helper function to schedule a callback to be invoked when a browser becomes idle.
 *
 * @param callback A function to be invoked when a browser becomes idle.
 * @param lView LView that hosts an instance of a defer block.
 * @param withLViewCleanup A flag that indicates whether a scheduled callback
 *           should be cancelled in case an LView is destroyed before a callback
 *           was invoked.
 */
export function onIdle(callback, lView, withLViewCleanup) {
    const injector = lView[INJECTOR];
    const scheduler = injector.get(IdleScheduler);
    const cleanupFn = () => scheduler.remove(callback);
    const wrappedCallback = withLViewCleanup ? wrapWithLViewCleanup(callback, lView, cleanupFn) : callback;
    scheduler.add(wrappedCallback);
    return cleanupFn;
}
/**
 * Use shims for the `requestIdleCallback` and `cancelIdleCallback` functions for
 * environments where those functions are not available (e.g. Node.js and Safari).
 *
 * Note: we wrap the `requestIdleCallback` call into a function, so that it can be
 * overridden/mocked in test environment and picked up by the runtime code.
 */
const _requestIdleCallback = () => typeof requestIdleCallback !== 'undefined' ? requestIdleCallback : setTimeout;
const _cancelIdleCallback = () => typeof requestIdleCallback !== 'undefined' ? cancelIdleCallback : clearTimeout;
/**
 * Helper service to schedule `requestIdleCallback`s for batches of defer blocks,
 * to avoid calling `requestIdleCallback` for each defer block (e.g. if
 * defer blocks are defined inside a for loop).
 */
export class IdleScheduler {
    constructor() {
        // Indicates whether current callbacks are being invoked.
        this.executingCallbacks = false;
        // Currently scheduled idle callback id.
        this.idleId = null;
        // Set of callbacks to be invoked next.
        this.current = new Set();
        // Set of callbacks collected while invoking current set of callbacks.
        // Those callbacks are scheduled for the next idle period.
        this.deferred = new Set();
        this.ngZone = inject(NgZone);
        this.requestIdleCallback = _requestIdleCallback().bind(globalThis);
        this.cancelIdleCallback = _cancelIdleCallback().bind(globalThis);
    }
    add(callback) {
        const target = this.executingCallbacks ? this.deferred : this.current;
        target.add(callback);
        if (this.idleId === null) {
            this.scheduleIdleCallback();
        }
    }
    remove(callback) {
        this.current.delete(callback);
        this.deferred.delete(callback);
    }
    scheduleIdleCallback() {
        const callback = () => {
            this.cancelIdleCallback(this.idleId);
            this.idleId = null;
            this.executingCallbacks = true;
            for (const callback of this.current) {
                callback();
            }
            this.current.clear();
            this.executingCallbacks = false;
            // If there are any callbacks added during an invocation
            // of the current ones - make them "current" and schedule
            // a new idle callback.
            if (this.deferred.size > 0) {
                for (const callback of this.deferred) {
                    this.current.add(callback);
                }
                this.deferred.clear();
                this.scheduleIdleCallback();
            }
        };
        // Ensure that the callback runs in the NgZone since
        // the `requestIdleCallback` is not currently patched by Zone.js.
        this.idleId = this.requestIdleCallback(() => this.ngZone.run(callback));
    }
    ngOnDestroy() {
        if (this.idleId !== null) {
            this.cancelIdleCallback(this.idleId);
            this.idleId = null;
        }
        this.current.clear();
        this.deferred.clear();
    }
    /** @nocollapse */
    static { this.ɵprov = ɵɵdefineInjectable({
        token: IdleScheduler,
        providedIn: 'root',
        factory: () => new IdleScheduler(),
    }); }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaWRsZV9zY2hlZHVsZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9kZWZlci9pZGxlX3NjaGVkdWxlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQUMsTUFBTSxFQUFFLGtCQUFrQixFQUFDLE1BQU0sT0FBTyxDQUFDO0FBQ2pELE9BQU8sRUFBQyxRQUFRLEVBQVEsTUFBTSw0QkFBNEIsQ0FBQztBQUMzRCxPQUFPLEVBQUMsTUFBTSxFQUFDLE1BQU0sU0FBUyxDQUFDO0FBRS9CLE9BQU8sRUFBQyxvQkFBb0IsRUFBQyxNQUFNLFNBQVMsQ0FBQztBQUU3Qzs7Ozs7Ozs7R0FRRztBQUNILE1BQU0sVUFBVSxNQUFNLENBQUMsUUFBc0IsRUFBRSxLQUFZLEVBQUUsZ0JBQXlCO0lBQ3BGLE1BQU0sUUFBUSxHQUFHLEtBQUssQ0FBQyxRQUFRLENBQUUsQ0FBQztJQUNsQyxNQUFNLFNBQVMsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLGFBQWEsQ0FBQyxDQUFDO0lBQzlDLE1BQU0sU0FBUyxHQUFHLEdBQUcsRUFBRSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDbkQsTUFBTSxlQUFlLEdBQ2pCLGdCQUFnQixDQUFDLENBQUMsQ0FBQyxvQkFBb0IsQ0FBQyxRQUFRLEVBQUUsS0FBSyxFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUM7SUFDbkYsU0FBUyxDQUFDLEdBQUcsQ0FBQyxlQUFlLENBQUMsQ0FBQztJQUMvQixPQUFPLFNBQVMsQ0FBQztBQUNuQixDQUFDO0FBRUQ7Ozs7OztHQU1HO0FBQ0gsTUFBTSxvQkFBb0IsR0FBRyxHQUFHLEVBQUUsQ0FDOUIsT0FBTyxtQkFBbUIsS0FBSyxXQUFXLENBQUMsQ0FBQyxDQUFDLG1CQUFtQixDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUM7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Q0FBQztTQUNwQjtRQUNELElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDckIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLEVBQUUsQ0FBQztJQUN4QixDQUFDO0lBRUQsa0JBQWtCO2FBQ1gsVUFBSyxHQUE2QixrQkFBa0IsQ0FBQztRQUMxRCxLQUFLLEVBQUUsYUFBYTtRQUNwQixVQUFVLEVBQUUsTUFBTTtRQUNsQixPQUFPLEVBQUUsR0FBRyxFQUFFLENBQUMsSUFBSSxhQUFhLEVBQUU7S0FDbkMsQ0FBQyxBQUpVLENBSVQiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtpbmplY3QsIMm1ybVkZWZpbmVJbmplY3RhYmxlfSBmcm9tICcuLi9kaSc7XG5pbXBvcnQge0lOSkVDVE9SLCBMVmlld30gZnJvbSAnLi4vcmVuZGVyMy9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHtOZ1pvbmV9IGZyb20gJy4uL3pvbmUnO1xuXG5pbXBvcnQge3dyYXBXaXRoTFZpZXdDbGVhbnVwfSBmcm9tICcuL3V0aWxzJztcblxuLyoqXG4gKiBIZWxwZXIgZnVuY3Rpb24gdG8gc2NoZWR1bGUgYSBjYWxsYmFjayB0byBiZSBpbnZva2VkIHdoZW4gYSBicm93c2VyIGJlY29tZXMgaWRsZS5cbiAqXG4gKiBAcGFyYW0gY2FsbGJhY2sgQSBmdW5jdGlvbiB0byBiZSBpbnZva2VkIHdoZW4gYSBicm93c2VyIGJlY29tZXMgaWRsZS5cbiAqIEBwYXJhbSBsVmlldyBMVmlldyB0aGF0IGhvc3RzIGFuIGluc3RhbmNlIG9mIGEgZGVmZXIgYmxvY2suXG4gKiBAcGFyYW0gd2l0aExWaWV3Q2xlYW51cCBBIGZsYWcgdGhhdCBpbmRpY2F0ZXMgd2hldGhlciBhIHNjaGVkdWxlZCBjYWxsYmFja1xuICogICAgICAgICAgIHNob3VsZCBiZSBjYW5jZWxsZWQgaW4gY2FzZSBhbiBMVmlldyBpcyBkZXN0cm95ZWQgYmVmb3JlIGEgY2FsbGJhY2tcbiAqICAgICAgICAgICB3YXMgaW52b2tlZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG9uSWRsZShjYWxsYmFjazogVm9pZEZ1bmN0aW9uLCBsVmlldzogTFZpZXcsIHdpdGhMVmlld0NsZWFudXA6IGJvb2xlYW4pIHtcbiAgY29uc3QgaW5qZWN0b3IgPSBsVmlld1tJTkpFQ1RPUl0hO1xuICBjb25zdCBzY2hlZHVsZXIgPSBpbmplY3Rvci5nZXQoSWRsZVNjaGVkdWxlcik7XG4gIGNvbnN0IGNsZWFudXBGbiA9ICgpID0+IHNjaGVkdWxlci5yZW1vdmUoY2FsbGJhY2spO1xuICBjb25zdCB3cmFwcGVkQ2FsbGJhY2sgPVxuICAgICAgd2l0aExWaWV3Q2xlYW51cCA/IHdyYXBXaXRoTFZpZXdDbGVhbnVwKGNhbGxiYWNrLCBsVmlldywgY2xlYW51cEZuKSA6IGNhbGxiYWNrO1xuICBzY2hlZHVsZXIuYWRkKHdyYXBwZWRDYWxsYmFjayk7XG4gIHJldHVybiBjbGVhbnVwRm47XG59XG5cbi8qKlxuICogVXNlIHNoaW1zIGZvciB0aGUgYHJlcXVlc3RJZGxlQ2FsbGJhY2tgIGFuZCBgY2FuY2VsSWRsZUNhbGxiYWNrYCBmdW5jdGlvbnMgZm9yXG4gKiBlbnZpcm9ubWVudHMgd2hlcmUgdGhvc2UgZnVuY3Rpb25zIGFyZSBub3QgYXZhaWxhYmxlIChlLmcuIE5vZGUuanMgYW5kIFNhZmFyaSkuXG4gKlxuICogTm90ZTogd2Ugd3JhcCB0aGUgYHJlcXVlc3RJZGxlQ2FsbGJhY2tgIGNhbGwgaW50byBhIGZ1bmN0aW9uLCBzbyB0aGF0IGl0IGNhbiBiZVxuICogb3ZlcnJpZGRlbi9tb2NrZWQgaW4gdGVzdCBlbnZpcm9ubWVudCBhbmQgcGlja2VkIHVwIGJ5IHRoZSBydW50aW1lIGNvZGUuXG4gKi9cbmNvbnN0IF9yZXF1ZXN0SWRsZUNhbGxiYWNrID0gKCkgPT5cbiAgICB0eXBlb2YgcmVxdWVzdElkbGVDYWxsYmFjayAhPT0gJ3VuZGVmaW5lZCcgPyByZXF1ZXN0SWRsZUNhbGxiYWNrIDogc2V0VGltZW91dDtcbmNvbnN0IF9jYW5jZWxJZGxlQ2FsbGJhY2sgPSAoKSA9PlxuICAgIHR5cGVvZiByZXF1ZXN0SWRsZUNhbGxiYWNrICE9PSAndW5kZWZpbmVkJyA/IGNhbmNlbElkbGVDYWxsYmFjayA6IGNsZWFyVGltZW91dDtcblxuLyoqXG4gKiBIZWxwZXIgc2VydmljZSB0byBzY2hlZHVsZSBgcmVxdWVzdElkbGVDYWxsYmFja2BzIGZvciBiYXRjaGVzIG9mIGRlZmVyIGJsb2NrcyxcbiAqIHRvIGF2b2lkIGNhbGxpbmcgYHJlcXVlc3RJZGxlQ2FsbGJhY2tgIGZvciBlYWNoIGRlZmVyIGJsb2NrIChlLmcuIGlmXG4gKiBkZWZlciBibG9ja3MgYXJlIGRlZmluZWQgaW5zaWRlIGEgZm9yIGxvb3ApLlxuICovXG5leHBvcnQgY2xhc3MgSWRsZVNjaGVkdWxlciB7XG4gIC8vIEluZGljYXRlcyB3aGV0aGVyIGN1cnJlbnQgY2FsbGJhY2tzIGFyZSBiZWluZyBpbnZva2VkLlxuICBleGVjdXRpbmdDYWxsYmFja3MgPSBmYWxzZTtcblxuICAvLyBDdXJyZW50bHkgc2NoZWR1bGVkIGlkbGUgY2FsbGJhY2sgaWQuXG4gIGlkbGVJZDogbnVtYmVyfG51bGwgPSBudWxsO1xuXG4gIC8vIFNldCBvZiBjYWxsYmFja3MgdG8gYmUgaW52b2tlZCBuZXh0LlxuICBjdXJyZW50ID0gbmV3IFNldDxWb2lkRnVuY3Rpb24+KCk7XG5cbiAgLy8gU2V0IG9mIGNhbGxiYWNrcyBjb2xsZWN0ZWQgd2hpbGUgaW52b2tpbmcgY3VycmVudCBzZXQgb2YgY2FsbGJhY2tzLlxuICAvLyBUaG9zZSBjYWxsYmFja3MgYXJlIHNjaGVkdWxlZCBmb3IgdGhlIG5leHQgaWRsZSBwZXJpb2QuXG4gIGRlZmVycmVkID0gbmV3IFNldDxWb2lkRnVuY3Rpb24+KCk7XG5cbiAgbmdab25lID0gaW5qZWN0KE5nWm9uZSk7XG5cbiAgcmVxdWVzdElkbGVDYWxsYmFjayA9IF9yZXF1ZXN0SWRsZUNhbGxiYWNrKCkuYmluZChnbG9iYWxUaGlzKTtcbiAgY2FuY2VsSWRsZUNhbGxiYWNrID0gX2NhbmNlbElkbGVDYWxsYmFjaygpLmJpbmQoZ2xvYmFsVGhpcyk7XG5cbiAgYWRkKGNhbGxiYWNrOiBWb2lkRnVuY3Rpb24pIHtcbiAgICBjb25zdCB0YXJnZXQgPSB0aGlzLmV4ZWN1dGluZ0NhbGxiYWNrcyA/IHRoaXMuZGVmZXJyZWQgOiB0aGlzLmN1cnJlbnQ7XG4gICAgdGFyZ2V0LmFkZChjYWxsYmFjayk7XG4gICAgaWYgKHRoaXMuaWRsZUlkID09PSBudWxsKSB7XG4gICAgICB0aGlzLnNjaGVkdWxlSWRsZUNhbGxiYWNrKCk7XG4gICAgfVxuICB9XG5cbiAgcmVtb3ZlKGNhbGxiYWNrOiBWb2lkRnVuY3Rpb24pIHtcbiAgICB0aGlzLmN1cnJlbnQuZGVsZXRlKGNhbGxiYWNrKTtcbiAgICB0aGlzLmRlZmVycmVkLmRlbGV0ZShjYWxsYmFjayk7XG4gIH1cblxuICBwcml2YXRlIHNjaGVkdWxlSWRsZUNhbGxiYWNrKCkge1xuICAgIGNvbnN0IGNhbGxiYWNrID0gKCkgPT4ge1xuICAgICAgdGhpcy5jYW5jZWxJZGxlQ2FsbGJhY2sodGhpcy5pZGxlSWQhKTtcbiAgICAgIHRoaXMuaWRsZUlkID0gbnVsbDtcblxuICAgICAgdGhpcy5leGVjdXRpbmdDYWxsYmFja3MgPSB0cnVlO1xuXG4gICAgICBmb3IgKGNvbnN0IGNhbGxiYWNrIG9mIHRoaXMuY3VycmVudCkge1xuICAgICAgICBjYWxsYmFjaygpO1xuICAgICAgfVxuICAgICAgdGhpcy5jdXJyZW50LmNsZWFyKCk7XG5cbiAgICAgIHRoaXMuZXhlY3V0aW5nQ2FsbGJhY2tzID0gZmFsc2U7XG5cbiAgICAgIC8vIElmIHRoZXJlIGFyZSBhbnkgY2FsbGJhY2tzIGFkZGVkIGR1cmluZyBhbiBpbnZvY2F0aW9uXG4gICAgICAvLyBvZiB0aGUgY3VycmVudCBvbmVzIC0gbWFrZSB0aGVtIFwiY3VycmVudFwiIGFuZCBzY2hlZHVsZVxuICAgICAgLy8gYSBuZXcgaWRsZSBjYWxsYmFjay5cbiAgICAgIGlmICh0aGlzLmRlZmVycmVkLnNpemUgPiAwKSB7XG4gICAgICAgIGZvciAoY29uc3QgY2FsbGJhY2sgb2YgdGhpcy5kZWZlcnJlZCkge1xuICAgICAgICAgIHRoaXMuY3VycmVudC5hZGQoY2FsbGJhY2spO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuZGVmZXJyZWQuY2xlYXIoKTtcbiAgICAgICAgdGhpcy5zY2hlZHVsZUlkbGVDYWxsYmFjaygpO1xuICAgICAgfVxuICAgIH07XG4gICAgLy8gRW5zdXJlIHRoYXQgdGhlIGNhbGxiYWNrIHJ1bnMgaW4gdGhlIE5nWm9uZSBzaW5jZVxuICAgIC8vIHRoZSBgcmVxdWVzdElkbGVDYWxsYmFja2AgaXMgbm90IGN1cnJlbnRseSBwYXRjaGVkIGJ5IFpvbmUuanMuXG4gICAgdGhpcy5pZGxlSWQgPSB0aGlzLnJlcXVlc3RJZGxlQ2FsbGJhY2soKCkgPT4gdGhpcy5uZ1pvbmUucnVuKGNhbGxiYWNrKSkgYXMgbnVtYmVyO1xuICB9XG5cbiAgbmdPbkRlc3Ryb3koKSB7XG4gICAgaWYgKHRoaXMuaWRsZUlkICE9PSBudWxsKSB7XG4gICAgICB0aGlzLmNhbmNlbElkbGVDYWxsYmFjayh0aGlzLmlkbGVJZCk7XG4gICAgICB0aGlzLmlkbGVJZCA9IG51bGw7XG4gICAgfVxuICAgIHRoaXMuY3VycmVudC5jbGVhcigpO1xuICAgIHRoaXMuZGVmZXJyZWQuY2xlYXIoKTtcbiAgfVxuXG4gIC8qKiBAbm9jb2xsYXBzZSAqL1xuICBzdGF0aWMgybVwcm92ID0gLyoqIEBwdXJlT3JCcmVha015Q29kZSAqLyDJtcm1ZGVmaW5lSW5qZWN0YWJsZSh7XG4gICAgdG9rZW46IElkbGVTY2hlZHVsZXIsXG4gICAgcHJvdmlkZWRJbjogJ3Jvb3QnLFxuICAgIGZhY3Rvcnk6ICgpID0+IG5ldyBJZGxlU2NoZWR1bGVyKCksXG4gIH0pO1xufVxuIl19