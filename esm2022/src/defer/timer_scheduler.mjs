/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ɵɵdefineInjectable } from '../di';
import { INJECTOR } from '../render3/interfaces/view';
import { arrayInsert2, arraySplice } from '../util/array_utils';
import { wrapWithLViewCleanup } from './utils';
/**
 * Returns a function that captures a provided delay.
 * Invoking the returned function schedules a trigger.
 */
export function onTimer(delay) {
    return (callback, lView, withLViewCleanup) => scheduleTimerTrigger(delay, callback, lView, withLViewCleanup);
}
/**
 * Schedules a callback to be invoked after a given timeout.
 *
 * @param delay A number of ms to wait until firing a callback.
 * @param callback A function to be invoked after a timeout.
 * @param lView LView that hosts an instance of a defer block.
 * @param withLViewCleanup A flag that indicates whether a scheduled callback
 *           should be cancelled in case an LView is destroyed before a callback
 *           was invoked.
 */
export function scheduleTimerTrigger(delay, callback, lView, withLViewCleanup) {
    const injector = lView[INJECTOR];
    const scheduler = injector.get(TimerScheduler);
    const cleanupFn = () => scheduler.remove(callback);
    const wrappedCallback = withLViewCleanup ? wrapWithLViewCleanup(callback, lView, cleanupFn) : callback;
    scheduler.add(delay, wrappedCallback);
    return cleanupFn;
}
/**
 * Helper service to schedule `setTimeout`s for batches of defer blocks,
 * to avoid calling `setTimeout` for each defer block (e.g. if defer blocks
 * are created inside a for loop).
 */
export class TimerScheduler {
    constructor() {
        // Indicates whether current callbacks are being invoked.
        this.executingCallbacks = false;
        // Currently scheduled `setTimeout` id.
        this.timeoutId = null;
        // When currently scheduled timer would fire.
        this.invokeTimerAt = null;
        // List of callbacks to be invoked.
        // For each callback we also store a timestamp on when the callback
        // should be invoked. We store timestamps and callback functions
        // in a flat array to avoid creating new objects for each entry.
        // [timestamp1, callback1, timestamp2, callback2, ...]
        this.current = [];
        // List of callbacks collected while invoking current set of callbacks.
        // Those callbacks are added to the "current" queue at the end of
        // the current callback invocation. The shape of this list is the same
        // as the shape of the `current` list.
        this.deferred = [];
    }
    add(delay, callback) {
        const target = this.executingCallbacks ? this.deferred : this.current;
        this.addToQueue(target, Date.now() + delay, callback);
        this.scheduleTimer();
    }
    remove(callback) {
        const callbackIndex = this.removeFromQueue(this.current, callback);
        if (callbackIndex === -1) {
            // Try cleaning up deferred queue only in case
            // we didn't find a callback in the "current" queue.
            this.removeFromQueue(this.deferred, callback);
        }
    }
    addToQueue(target, invokeAt, callback) {
        let insertAtIndex = target.length;
        for (let i = 0; i < target.length; i += 2) {
            const invokeQueuedCallbackAt = target[i];
            if (invokeQueuedCallbackAt > invokeAt) {
                // We've reached a first timer that is scheduled
                // for a later time than what we are trying to insert.
                // This is the location at which we need to insert,
                // no need to iterate further.
                insertAtIndex = i;
                break;
            }
        }
        arrayInsert2(target, insertAtIndex, invokeAt, callback);
    }
    removeFromQueue(target, callback) {
        let index = -1;
        for (let i = 0; i < target.length; i += 2) {
            const queuedCallback = target[i + 1];
            if (queuedCallback === callback) {
                index = i;
                break;
            }
        }
        if (index > -1) {
            // Remove 2 elements: a timestamp slot and
            // the following slot with a callback function.
            arraySplice(target, index, 2);
        }
        return index;
    }
    scheduleTimer() {
        const callback = () => {
            clearTimeout(this.timeoutId);
            this.timeoutId = null;
            this.executingCallbacks = true;
            // Invoke callbacks that were scheduled to run
            // before the current time.
            let now = Date.now();
            let lastCallbackIndex = null;
            for (let i = 0; i < this.current.length; i += 2) {
                const invokeAt = this.current[i];
                const callback = this.current[i + 1];
                if (invokeAt <= now) {
                    callback();
                    // Point at the invoked callback function, which is located
                    // after the timestamp.
                    lastCallbackIndex = i + 1;
                }
                else {
                    // We've reached a timer that should not be invoked yet.
                    break;
                }
            }
            if (lastCallbackIndex !== null) {
                // If last callback index is `null` - no callbacks were invoked,
                // so no cleanup is needed. Otherwise, remove invoked callbacks
                // from the queue.
                arraySplice(this.current, 0, lastCallbackIndex + 1);
            }
            this.executingCallbacks = false;
            // If there are any callbacks added during an invocation
            // of the current ones - move them over to the "current"
            // queue.
            if (this.deferred.length > 0) {
                for (let i = 0; i < this.deferred.length; i += 2) {
                    const invokeAt = this.deferred[i];
                    const callback = this.deferred[i + 1];
                    this.addToQueue(this.current, invokeAt, callback);
                }
                this.deferred.length = 0;
            }
            this.scheduleTimer();
        };
        // Avoid running timer callbacks more than once per
        // average frame duration. This is needed for better
        // batching and to avoid kicking off excessive change
        // detection cycles.
        const FRAME_DURATION_MS = 16; // 1000ms / 60fps
        if (this.current.length > 0) {
            const now = Date.now();
            // First element in the queue points at the timestamp
            // of the first (earliest) event.
            const invokeAt = this.current[0];
            if (!this.timeoutId ||
                // Reschedule a timer in case a queue contains an item with
                // an earlier timestamp and the delta is more than an average
                // frame duration.
                (this.invokeTimerAt && (this.invokeTimerAt - invokeAt > FRAME_DURATION_MS))) {
                if (this.timeoutId !== null) {
                    // There was a timeout already, but an earlier event was added
                    // into the queue. In this case we drop an old timer and setup
                    // a new one with an updated (smaller) timeout.
                    clearTimeout(this.timeoutId);
                    this.timeoutId = null;
                }
                const timeout = Math.max(invokeAt - now, FRAME_DURATION_MS);
                this.invokeTimerAt = invokeAt;
                this.timeoutId = setTimeout(callback, timeout);
            }
        }
    }
    ngOnDestroy() {
        if (this.timeoutId !== null) {
            clearTimeout(this.timeoutId);
            this.timeoutId = null;
        }
        this.current.length = 0;
        this.deferred.length = 0;
    }
    /** @nocollapse */
    static { this.ɵprov = ɵɵdefineInjectable({
        token: TimerScheduler,
        providedIn: 'root',
        factory: () => new TimerScheduler(),
    }); }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGltZXJfc2NoZWR1bGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvZGVmZXIvdGltZXJfc2NoZWR1bGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBQyxrQkFBa0IsRUFBQyxNQUFNLE9BQU8sQ0FBQztBQUN6QyxPQUFPLEVBQUMsUUFBUSxFQUFRLE1BQU0sNEJBQTRCLENBQUM7QUFDM0QsT0FBTyxFQUFDLFlBQVksRUFBRSxXQUFXLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUU5RCxPQUFPLEVBQUMsb0JBQW9CLEVBQUMsTUFBTSxTQUFTLENBQUM7QUFFN0M7OztHQUdHO0FBQ0gsTUFBTSxVQUFVLE9BQU8sQ0FBQyxLQUFhO0lBQ25DLE9BQU8sQ0FBQyxRQUFzQixFQUFFLEtBQVksRUFBRSxnQkFBeUIsRUFBRSxFQUFFLENBQ2hFLG9CQUFvQixDQUFDLEtBQUssRUFBRSxRQUFRLEVBQUUsS0FBSyxFQUFFLGdCQUFnQixDQUFDLENBQUM7QUFDNUUsQ0FBQztBQUVEOzs7Ozs7Ozs7R0FTRztBQUNILE1BQU0sVUFBVSxvQkFBb0IsQ0FDaEMsS0FBYSxFQUFFLFFBQXNCLEVBQUUsS0FBWSxFQUFFLGdCQUF5QjtJQUNoRixNQUFNLFFBQVEsR0FBRyxLQUFLLENBQUMsUUFBUSxDQUFFLENBQUM7SUFDbEMsTUFBTSxTQUFTLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyxjQUFjLENBQUMsQ0FBQztJQUMvQyxNQUFNLFNBQVMsR0FBRyxHQUFHLEVBQUUsQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQ25ELE1BQU0sZUFBZSxHQUNqQixnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsb0JBQW9CLENBQUMsUUFBUSxFQUFFLEtBQUssRUFBRSxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDO0lBQ25G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OEQ7b0JBQzlELDhEQUE4RDtvQkFDOUQsK0NBQStDO29CQUMvQyxZQUFZLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO29CQUM3QixJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQztpQkFDdkI7Z0JBQ0QsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxRQUFRLEdBQUcsR0FBRyxFQUFFLGlCQUFpQixDQUFDLENBQUM7Z0JBQzVELElBQUksQ0FBQyxhQUFhLEdBQUcsUUFBUSxDQUFDO2dCQUM5QixJQUFJLENBQUMsU0FBUyxHQUFHLFVBQVUsQ0FBQyxRQUFRLEVBQUUsT0FBTyxDQUFzQixDQUFDO2FBQ3JFO1NBQ0Y7SUFDSCxDQUFDO0lBRUQsV0FBVztRQUNULElBQUksSUFBSSxDQUFDLFNBQVMsS0FBSyxJQUFJLEVBQUU7WUFDM0IsWUFBWSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUM3QixJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQztTQUN2QjtRQUNELElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQztRQUN4QixJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUM7SUFDM0IsQ0FBQztJQUVELGtCQUFrQjthQUNYLFVBQUssR0FBNkIsa0JBQWtCLENBQUM7UUFDMUQsS0FBSyxFQUFFLGNBQWM7UUFDckIsVUFBVSxFQUFFLE1BQU07UUFDbEIsT0FBTyxFQUFFLEdBQUcsRUFBRSxDQUFDLElBQUksY0FBYyxFQUFFO0tBQ3BDLENBQUMsQUFKVSxDQUlUIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7ybXJtWRlZmluZUluamVjdGFibGV9IGZyb20gJy4uL2RpJztcbmltcG9ydCB7SU5KRUNUT1IsIExWaWV3fSBmcm9tICcuLi9yZW5kZXIzL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge2FycmF5SW5zZXJ0MiwgYXJyYXlTcGxpY2V9IGZyb20gJy4uL3V0aWwvYXJyYXlfdXRpbHMnO1xuXG5pbXBvcnQge3dyYXBXaXRoTFZpZXdDbGVhbnVwfSBmcm9tICcuL3V0aWxzJztcblxuLyoqXG4gKiBSZXR1cm5zIGEgZnVuY3Rpb24gdGhhdCBjYXB0dXJlcyBhIHByb3ZpZGVkIGRlbGF5LlxuICogSW52b2tpbmcgdGhlIHJldHVybmVkIGZ1bmN0aW9uIHNjaGVkdWxlcyBhIHRyaWdnZXIuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBvblRpbWVyKGRlbGF5OiBudW1iZXIpIHtcbiAgcmV0dXJuIChjYWxsYmFjazogVm9pZEZ1bmN0aW9uLCBsVmlldzogTFZpZXcsIHdpdGhMVmlld0NsZWFudXA6IGJvb2xlYW4pID0+XG4gICAgICAgICAgICAgc2NoZWR1bGVUaW1lclRyaWdnZXIoZGVsYXksIGNhbGxiYWNrLCBsVmlldywgd2l0aExWaWV3Q2xlYW51cCk7XG59XG5cbi8qKlxuICogU2NoZWR1bGVzIGEgY2FsbGJhY2sgdG8gYmUgaW52b2tlZCBhZnRlciBhIGdpdmVuIHRpbWVvdXQuXG4gKlxuICogQHBhcmFtIGRlbGF5IEEgbnVtYmVyIG9mIG1zIHRvIHdhaXQgdW50aWwgZmlyaW5nIGEgY2FsbGJhY2suXG4gKiBAcGFyYW0gY2FsbGJhY2sgQSBmdW5jdGlvbiB0byBiZSBpbnZva2VkIGFmdGVyIGEgdGltZW91dC5cbiAqIEBwYXJhbSBsVmlldyBMVmlldyB0aGF0IGhvc3RzIGFuIGluc3RhbmNlIG9mIGEgZGVmZXIgYmxvY2suXG4gKiBAcGFyYW0gd2l0aExWaWV3Q2xlYW51cCBBIGZsYWcgdGhhdCBpbmRpY2F0ZXMgd2hldGhlciBhIHNjaGVkdWxlZCBjYWxsYmFja1xuICogICAgICAgICAgIHNob3VsZCBiZSBjYW5jZWxsZWQgaW4gY2FzZSBhbiBMVmlldyBpcyBkZXN0cm95ZWQgYmVmb3JlIGEgY2FsbGJhY2tcbiAqICAgICAgICAgICB3YXMgaW52b2tlZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNjaGVkdWxlVGltZXJUcmlnZ2VyKFxuICAgIGRlbGF5OiBudW1iZXIsIGNhbGxiYWNrOiBWb2lkRnVuY3Rpb24sIGxWaWV3OiBMVmlldywgd2l0aExWaWV3Q2xlYW51cDogYm9vbGVhbikge1xuICBjb25zdCBpbmplY3RvciA9IGxWaWV3W0lOSkVDVE9SXSE7XG4gIGNvbnN0IHNjaGVkdWxlciA9IGluamVjdG9yLmdldChUaW1lclNjaGVkdWxlcik7XG4gIGNvbnN0IGNsZWFudXBGbiA9ICgpID0+IHNjaGVkdWxlci5yZW1vdmUoY2FsbGJhY2spO1xuICBjb25zdCB3cmFwcGVkQ2FsbGJhY2sgPVxuICAgICAgd2l0aExWaWV3Q2xlYW51cCA/IHdyYXBXaXRoTFZpZXdDbGVhbnVwKGNhbGxiYWNrLCBsVmlldywgY2xlYW51cEZuKSA6IGNhbGxiYWNrO1xuICBzY2hlZHVsZXIuYWRkKGRlbGF5LCB3cmFwcGVkQ2FsbGJhY2spO1xuICByZXR1cm4gY2xlYW51cEZuO1xufVxuXG4vKipcbiAqIEhlbHBlciBzZXJ2aWNlIHRvIHNjaGVkdWxlIGBzZXRUaW1lb3V0YHMgZm9yIGJhdGNoZXMgb2YgZGVmZXIgYmxvY2tzLFxuICogdG8gYXZvaWQgY2FsbGluZyBgc2V0VGltZW91dGAgZm9yIGVhY2ggZGVmZXIgYmxvY2sgKGUuZy4gaWYgZGVmZXIgYmxvY2tzXG4gKiBhcmUgY3JlYXRlZCBpbnNpZGUgYSBmb3IgbG9vcCkuXG4gKi9cbmV4cG9ydCBjbGFzcyBUaW1lclNjaGVkdWxlciB7XG4gIC8vIEluZGljYXRlcyB3aGV0aGVyIGN1cnJlbnQgY2FsbGJhY2tzIGFyZSBiZWluZyBpbnZva2VkLlxuICBleGVjdXRpbmdDYWxsYmFja3MgPSBmYWxzZTtcblxuICAvLyBDdXJyZW50bHkgc2NoZWR1bGVkIGBzZXRUaW1lb3V0YCBpZC5cbiAgdGltZW91dElkOiBudW1iZXJ8bnVsbCA9IG51bGw7XG5cbiAgLy8gV2hlbiBjdXJyZW50bHkgc2NoZWR1bGVkIHRpbWVyIHdvdWxkIGZpcmUuXG4gIGludm9rZVRpbWVyQXQ6IG51bWJlcnxudWxsID0gbnVsbDtcblxuICAvLyBMaXN0IG9mIGNhbGxiYWNrcyB0byBiZSBpbnZva2VkLlxuICAvLyBGb3IgZWFjaCBjYWxsYmFjayB3ZSBhbHNvIHN0b3JlIGEgdGltZXN0YW1wIG9uIHdoZW4gdGhlIGNhbGxiYWNrXG4gIC8vIHNob3VsZCBiZSBpbnZva2VkLiBXZSBzdG9yZSB0aW1lc3RhbXBzIGFuZCBjYWxsYmFjayBmdW5jdGlvbnNcbiAgLy8gaW4gYSBmbGF0IGFycmF5IHRvIGF2b2lkIGNyZWF0aW5nIG5ldyBvYmplY3RzIGZvciBlYWNoIGVudHJ5LlxuICAvLyBbdGltZXN0YW1wMSwgY2FsbGJhY2sxLCB0aW1lc3RhbXAyLCBjYWxsYmFjazIsIC4uLl1cbiAgY3VycmVudDogQXJyYXk8bnVtYmVyfFZvaWRGdW5jdGlvbj4gPSBbXTtcblxuICAvLyBMaXN0IG9mIGNhbGxiYWNrcyBjb2xsZWN0ZWQgd2hpbGUgaW52b2tpbmcgY3VycmVudCBzZXQgb2YgY2FsbGJhY2tzLlxuICAvLyBUaG9zZSBjYWxsYmFja3MgYXJlIGFkZGVkIHRvIHRoZSBcImN1cnJlbnRcIiBxdWV1ZSBhdCB0aGUgZW5kIG9mXG4gIC8vIHRoZSBjdXJyZW50IGNhbGxiYWNrIGludm9jYXRpb24uIFRoZSBzaGFwZSBvZiB0aGlzIGxpc3QgaXMgdGhlIHNhbWVcbiAgLy8gYXMgdGhlIHNoYXBlIG9mIHRoZSBgY3VycmVudGAgbGlzdC5cbiAgZGVmZXJyZWQ6IEFycmF5PG51bWJlcnxWb2lkRnVuY3Rpb24+ID0gW107XG5cbiAgYWRkKGRlbGF5OiBudW1iZXIsIGNhbGxiYWNrOiBWb2lkRnVuY3Rpb24pIHtcbiAgICBjb25zdCB0YXJnZXQgPSB0aGlzLmV4ZWN1dGluZ0NhbGxiYWNrcyA/IHRoaXMuZGVmZXJyZWQgOiB0aGlzLmN1cnJlbnQ7XG4gICAgdGhpcy5hZGRUb1F1ZXVlKHRhcmdldCwgRGF0ZS5ub3coKSArIGRlbGF5LCBjYWxsYmFjayk7XG4gICAgdGhpcy5zY2hlZHVsZVRpbWVyKCk7XG4gIH1cblxuICByZW1vdmUoY2FsbGJhY2s6IFZvaWRGdW5jdGlvbikge1xuICAgIGNvbnN0IGNhbGxiYWNrSW5kZXggPSB0aGlzLnJlbW92ZUZyb21RdWV1ZSh0aGlzLmN1cnJlbnQsIGNhbGxiYWNrKTtcbiAgICBpZiAoY2FsbGJhY2tJbmRleCA9PT0gLTEpIHtcbiAgICAgIC8vIFRyeSBjbGVhbmluZyB1cCBkZWZlcnJlZCBxdWV1ZSBvbmx5IGluIGNhc2VcbiAgICAgIC8vIHdlIGRpZG4ndCBmaW5kIGEgY2FsbGJhY2sgaW4gdGhlIFwiY3VycmVudFwiIHF1ZXVlLlxuICAgICAgdGhpcy5yZW1vdmVGcm9tUXVldWUodGhpcy5kZWZlcnJlZCwgY2FsbGJhY2spO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgYWRkVG9RdWV1ZSh0YXJnZXQ6IEFycmF5PG51bWJlcnxWb2lkRnVuY3Rpb24+LCBpbnZva2VBdDogbnVtYmVyLCBjYWxsYmFjazogVm9pZEZ1bmN0aW9uKSB7XG4gICAgbGV0IGluc2VydEF0SW5kZXggPSB0YXJnZXQubGVuZ3RoO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGFyZ2V0Lmxlbmd0aDsgaSArPSAyKSB7XG4gICAgICBjb25zdCBpbnZva2VRdWV1ZWRDYWxsYmFja0F0ID0gdGFyZ2V0W2ldIGFzIG51bWJlcjtcbiAgICAgIGlmIChpbnZva2VRdWV1ZWRDYWxsYmFja0F0ID4gaW52b2tlQXQpIHtcbiAgICAgICAgLy8gV2UndmUgcmVhY2hlZCBhIGZpcnN0IHRpbWVyIHRoYXQgaXMgc2NoZWR1bGVkXG4gICAgICAgIC8vIGZvciBhIGxhdGVyIHRpbWUgdGhhbiB3aGF0IHdlIGFyZSB0cnlpbmcgdG8gaW5zZXJ0LlxuICAgICAgICAvLyBUaGlzIGlzIHRoZSBsb2NhdGlvbiBhdCB3aGljaCB3ZSBuZWVkIHRvIGluc2VydCxcbiAgICAgICAgLy8gbm8gbmVlZCB0byBpdGVyYXRlIGZ1cnRoZXIuXG4gICAgICAgIGluc2VydEF0SW5kZXggPSBpO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gICAgYXJyYXlJbnNlcnQyKHRhcmdldCwgaW5zZXJ0QXRJbmRleCwgaW52b2tlQXQsIGNhbGxiYWNrKTtcbiAgfVxuXG4gIHByaXZhdGUgcmVtb3ZlRnJvbVF1ZXVlKHRhcmdldDogQXJyYXk8bnVtYmVyfFZvaWRGdW5jdGlvbj4sIGNhbGxiYWNrOiBWb2lkRnVuY3Rpb24pIHtcbiAgICBsZXQgaW5kZXggPSAtMTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRhcmdldC5sZW5ndGg7IGkgKz0gMikge1xuICAgICAgY29uc3QgcXVldWVkQ2FsbGJhY2sgPSB0YXJnZXRbaSArIDFdO1xuICAgICAgaWYgKHF1ZXVlZENhbGxiYWNrID09PSBjYWxsYmFjaykge1xuICAgICAgICBpbmRleCA9IGk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoaW5kZXggPiAtMSkge1xuICAgICAgLy8gUmVtb3ZlIDIgZWxlbWVudHM6IGEgdGltZXN0YW1wIHNsb3QgYW5kXG4gICAgICAvLyB0aGUgZm9sbG93aW5nIHNsb3Qgd2l0aCBhIGNhbGxiYWNrIGZ1bmN0aW9uLlxuICAgICAgYXJyYXlTcGxpY2UodGFyZ2V0LCBpbmRleCwgMik7XG4gICAgfVxuICAgIHJldHVybiBpbmRleDtcbiAgfVxuXG4gIHByaXZhdGUgc2NoZWR1bGVUaW1lcigpIHtcbiAgICBjb25zdCBjYWxsYmFjayA9ICgpID0+IHtcbiAgICAgIGNsZWFyVGltZW91dCh0aGlzLnRpbWVvdXRJZCEpO1xuICAgICAgdGhpcy50aW1lb3V0SWQgPSBudWxsO1xuXG4gICAgICB0aGlzLmV4ZWN1dGluZ0NhbGxiYWNrcyA9IHRydWU7XG5cbiAgICAgIC8vIEludm9rZSBjYWxsYmFja3MgdGhhdCB3ZXJlIHNjaGVkdWxlZCB0byBydW5cbiAgICAgIC8vIGJlZm9yZSB0aGUgY3VycmVudCB0aW1lLlxuICAgICAgbGV0IG5vdyA9IERhdGUubm93KCk7XG4gICAgICBsZXQgbGFzdENhbGxiYWNrSW5kZXg6IG51bWJlcnxudWxsID0gbnVsbDtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5jdXJyZW50Lmxlbmd0aDsgaSArPSAyKSB7XG4gICAgICAgIGNvbnN0IGludm9rZUF0ID0gdGhpcy5jdXJyZW50W2ldIGFzIG51bWJlcjtcbiAgICAgICAgY29uc3QgY2FsbGJhY2sgPSB0aGlzLmN1cnJlbnRbaSArIDFdIGFzIFZvaWRGdW5jdGlvbjtcbiAgICAgICAgaWYgKGludm9rZUF0IDw9IG5vdykge1xuICAgICAgICAgIGNhbGxiYWNrKCk7XG4gICAgICAgICAgLy8gUG9pbnQgYXQgdGhlIGludm9rZWQgY2FsbGJhY2sgZnVuY3Rpb24sIHdoaWNoIGlzIGxvY2F0ZWRcbiAgICAgICAgICAvLyBhZnRlciB0aGUgdGltZXN0YW1wLlxuICAgICAgICAgIGxhc3RDYWxsYmFja0luZGV4ID0gaSArIDE7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gV2UndmUgcmVhY2hlZCBhIHRpbWVyIHRoYXQgc2hvdWxkIG5vdCBiZSBpbnZva2VkIHlldC5cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKGxhc3RDYWxsYmFja0luZGV4ICE9PSBudWxsKSB7XG4gICAgICAgIC8vIElmIGxhc3QgY2FsbGJhY2sgaW5kZXggaXMgYG51bGxgIC0gbm8gY2FsbGJhY2tzIHdlcmUgaW52b2tlZCxcbiAgICAgICAgLy8gc28gbm8gY2xlYW51cCBpcyBuZWVkZWQuIE90aGVyd2lzZSwgcmVtb3ZlIGludm9rZWQgY2FsbGJhY2tzXG4gICAgICAgIC8vIGZyb20gdGhlIHF1ZXVlLlxuICAgICAgICBhcnJheVNwbGljZSh0aGlzLmN1cnJlbnQsIDAsIGxhc3RDYWxsYmFja0luZGV4ICsgMSk7XG4gICAgICB9XG5cbiAgICAgIHRoaXMuZXhlY3V0aW5nQ2FsbGJhY2tzID0gZmFsc2U7XG5cbiAgICAgIC8vIElmIHRoZXJlIGFyZSBhbnkgY2FsbGJhY2tzIGFkZGVkIGR1cmluZyBhbiBpbnZvY2F0aW9uXG4gICAgICAvLyBvZiB0aGUgY3VycmVudCBvbmVzIC0gbW92ZSB0aGVtIG92ZXIgdG8gdGhlIFwiY3VycmVudFwiXG4gICAgICAvLyBxdWV1ZS5cbiAgICAgIGlmICh0aGlzLmRlZmVycmVkLmxlbmd0aCA+IDApIHtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLmRlZmVycmVkLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgICAgICAgY29uc3QgaW52b2tlQXQgPSB0aGlzLmRlZmVycmVkW2ldIGFzIG51bWJlcjtcbiAgICAgICAgICBjb25zdCBjYWxsYmFjayA9IHRoaXMuZGVmZXJyZWRbaSArIDFdIGFzIFZvaWRGdW5jdGlvbjtcbiAgICAgICAgICB0aGlzLmFkZFRvUXVldWUodGhpcy5jdXJyZW50LCBpbnZva2VBdCwgY2FsbGJhY2spO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuZGVmZXJyZWQubGVuZ3RoID0gMDtcbiAgICAgIH1cbiAgICAgIHRoaXMuc2NoZWR1bGVUaW1lcigpO1xuICAgIH07XG5cbiAgICAvLyBBdm9pZCBydW5uaW5nIHRpbWVyIGNhbGxiYWNrcyBtb3JlIHRoYW4gb25jZSBwZXJcbiAgICAvLyBhdmVyYWdlIGZyYW1lIGR1cmF0aW9uLiBUaGlzIGlzIG5lZWRlZCBmb3IgYmV0dGVyXG4gICAgLy8gYmF0Y2hpbmcgYW5kIHRvIGF2b2lkIGtpY2tpbmcgb2ZmIGV4Y2Vzc2l2ZSBjaGFuZ2VcbiAgICAvLyBkZXRlY3Rpb24gY3ljbGVzLlxuICAgIGNvbnN0IEZSQU1FX0RVUkFUSU9OX01TID0gMTY7ICAvLyAxMDAwbXMgLyA2MGZwc1xuXG4gICAgaWYgKHRoaXMuY3VycmVudC5sZW5ndGggPiAwKSB7XG4gICAgICBjb25zdCBub3cgPSBEYXRlLm5vdygpO1xuICAgICAgLy8gRmlyc3QgZWxlbWVudCBpbiB0aGUgcXVldWUgcG9pbnRzIGF0IHRoZSB0aW1lc3RhbXBcbiAgICAgIC8vIG9mIHRoZSBmaXJzdCAoZWFybGllc3QpIGV2ZW50LlxuICAgICAgY29uc3QgaW52b2tlQXQgPSB0aGlzLmN1cnJlbnRbMF0gYXMgbnVtYmVyO1xuICAgICAgaWYgKCF0aGlzLnRpbWVvdXRJZCB8fFxuICAgICAgICAgIC8vIFJlc2NoZWR1bGUgYSB0aW1lciBpbiBjYXNlIGEgcXVldWUgY29udGFpbnMgYW4gaXRlbSB3aXRoXG4gICAgICAgICAgLy8gYW4gZWFybGllciB0aW1lc3RhbXAgYW5kIHRoZSBkZWx0YSBpcyBtb3JlIHRoYW4gYW4gYXZlcmFnZVxuICAgICAgICAgIC8vIGZyYW1lIGR1cmF0aW9uLlxuICAgICAgICAgICh0aGlzLmludm9rZVRpbWVyQXQgJiYgKHRoaXMuaW52b2tlVGltZXJBdCAtIGludm9rZUF0ID4gRlJBTUVfRFVSQVRJT05fTVMpKSkge1xuICAgICAgICBpZiAodGhpcy50aW1lb3V0SWQgIT09IG51bGwpIHtcbiAgICAgICAgICAvLyBUaGVyZSB3YXMgYSB0aW1lb3V0IGFscmVhZHksIGJ1dCBhbiBlYXJsaWVyIGV2ZW50IHdhcyBhZGRlZFxuICAgICAgICAgIC8vIGludG8gdGhlIHF1ZXVlLiBJbiB0aGlzIGNhc2Ugd2UgZHJvcCBhbiBvbGQgdGltZXIgYW5kIHNldHVwXG4gICAgICAgICAgLy8gYSBuZXcgb25lIHdpdGggYW4gdXBkYXRlZCAoc21hbGxlcikgdGltZW91dC5cbiAgICAgICAgICBjbGVhclRpbWVvdXQodGhpcy50aW1lb3V0SWQpO1xuICAgICAgICAgIHRoaXMudGltZW91dElkID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCB0aW1lb3V0ID0gTWF0aC5tYXgoaW52b2tlQXQgLSBub3csIEZSQU1FX0RVUkFUSU9OX01TKTtcbiAgICAgICAgdGhpcy5pbnZva2VUaW1lckF0ID0gaW52b2tlQXQ7XG4gICAgICAgIHRoaXMudGltZW91dElkID0gc2V0VGltZW91dChjYWxsYmFjaywgdGltZW91dCkgYXMgdW5rbm93biBhcyBudW1iZXI7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgbmdPbkRlc3Ryb3koKSB7XG4gICAgaWYgKHRoaXMudGltZW91dElkICE9PSBudWxsKSB7XG4gICAgICBjbGVhclRpbWVvdXQodGhpcy50aW1lb3V0SWQpO1xuICAgICAgdGhpcy50aW1lb3V0SWQgPSBudWxsO1xuICAgIH1cbiAgICB0aGlzLmN1cnJlbnQubGVuZ3RoID0gMDtcbiAgICB0aGlzLmRlZmVycmVkLmxlbmd0aCA9IDA7XG4gIH1cblxuICAvKiogQG5vY29sbGFwc2UgKi9cbiAgc3RhdGljIMm1cHJvdiA9IC8qKiBAcHVyZU9yQnJlYWtNeUNvZGUgKi8gybXJtWRlZmluZUluamVjdGFibGUoe1xuICAgIHRva2VuOiBUaW1lclNjaGVkdWxlcixcbiAgICBwcm92aWRlZEluOiAncm9vdCcsXG4gICAgZmFjdG9yeTogKCkgPT4gbmV3IFRpbWVyU2NoZWR1bGVyKCksXG4gIH0pO1xufVxuIl19