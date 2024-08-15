/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { SCHEDULE_IN_ROOT_ZONE_DEFAULT } from '../change_detection/scheduling/flags';
import { RuntimeError } from '../errors';
import { EventEmitter } from '../event_emitter';
import { scheduleCallbackWithRafRace } from '../util/callback_scheduler';
import { noop } from '../util/noop';
import { AsyncStackTaggingZoneSpec } from './async-stack-tagging';
const isAngularZoneProperty = 'isAngularZone';
export const angularZoneInstanceIdProperty = isAngularZoneProperty + '_ID';
let ngZoneInstanceId = 0;
/**
 * An injectable service for executing work inside or outside of the Angular zone.
 *
 * The most common use of this service is to optimize performance when starting a work consisting of
 * one or more asynchronous tasks that don't require UI updates or error handling to be handled by
 * Angular. Such tasks can be kicked off via {@link #runOutsideAngular} and if needed, these tasks
 * can reenter the Angular zone via {@link #run}.
 *
 * <!-- TODO: add/fix links to:
 *   - docs explaining zones and the use of zones in Angular and change-detection
 *   - link to runOutsideAngular/run (throughout this file!)
 *   -->
 *
 * @usageNotes
 * ### Example
 *
 * ```
 * import {Component, NgZone} from '@angular/core';
 * import {NgIf} from '@angular/common';
 *
 * @Component({
 *   selector: 'ng-zone-demo',
 *   template: `
 *     <h2>Demo: NgZone</h2>
 *
 *     <p>Progress: {{progress}}%</p>
 *     <p *ngIf="progress >= 100">Done processing {{label}} of Angular zone!</p>
 *
 *     <button (click)="processWithinAngularZone()">Process within Angular zone</button>
 *     <button (click)="processOutsideOfAngularZone()">Process outside of Angular zone</button>
 *   `,
 * })
 * export class NgZoneDemo {
 *   progress: number = 0;
 *   label: string;
 *
 *   constructor(private _ngZone: NgZone) {}
 *
 *   // Loop inside the Angular zone
 *   // so the UI DOES refresh after each setTimeout cycle
 *   processWithinAngularZone() {
 *     this.label = 'inside';
 *     this.progress = 0;
 *     this._increaseProgress(() => console.log('Inside Done!'));
 *   }
 *
 *   // Loop outside of the Angular zone
 *   // so the UI DOES NOT refresh after each setTimeout cycle
 *   processOutsideOfAngularZone() {
 *     this.label = 'outside';
 *     this.progress = 0;
 *     this._ngZone.runOutsideAngular(() => {
 *       this._increaseProgress(() => {
 *         // reenter the Angular zone and display done
 *         this._ngZone.run(() => { console.log('Outside Done!'); });
 *       });
 *     });
 *   }
 *
 *   _increaseProgress(doneCallback: () => void) {
 *     this.progress += 1;
 *     console.log(`Current progress: ${this.progress}%`);
 *
 *     if (this.progress < 100) {
 *       window.setTimeout(() => this._increaseProgress(doneCallback), 10);
 *     } else {
 *       doneCallback();
 *     }
 *   }
 * }
 * ```
 *
 * @publicApi
 */
export class NgZone {
    constructor(options) {
        this.hasPendingMacrotasks = false;
        this.hasPendingMicrotasks = false;
        /**
         * Whether there are no outstanding microtasks or macrotasks.
         */
        this.isStable = true;
        /**
         * Notifies when code enters Angular Zone. This gets fired first on VM Turn.
         */
        this.onUnstable = new EventEmitter(false);
        /**
         * Notifies when there is no more microtasks enqueued in the current VM Turn.
         * This is a hint for Angular to do change detection, which may enqueue more microtasks.
         * For this reason this event can fire multiple times per VM Turn.
         */
        this.onMicrotaskEmpty = new EventEmitter(false);
        /**
         * Notifies when the last `onMicrotaskEmpty` has run and there are no more microtasks, which
         * implies we are about to relinquish VM turn.
         * This event gets called just once.
         */
        this.onStable = new EventEmitter(false);
        /**
         * Notifies that an error has been delivered.
         */
        this.onError = new EventEmitter(false);
        const { enableLongStackTrace = false, shouldCoalesceEventChangeDetection = false, shouldCoalesceRunChangeDetection = false, scheduleInRootZone = SCHEDULE_IN_ROOT_ZONE_DEFAULT, } = options;
        if (typeof Zone == 'undefined') {
            throw new RuntimeError(908 /* RuntimeErrorCode.MISSING_ZONEJS */, ngDevMode && `In this configuration Angular requires Zone.js`);
        }
        Zone.assertZonePatched();
        const self = this;
        self._nesting = 0;
        self._outer = self._inner = Zone.current;
        // AsyncStackTaggingZoneSpec provides `linked stack traces` to show
        // where the async operation is scheduled. For more details, refer
        // to this article, https://developer.chrome.com/blog/devtools-better-angular-debugging/
        // And we only import this AsyncStackTaggingZoneSpec in development mode,
        // in the production mode, the AsyncStackTaggingZoneSpec will be tree shaken away.
        if (ngDevMode) {
            self._inner = self._inner.fork(new AsyncStackTaggingZoneSpec('Angular'));
        }
        if (Zone['TaskTrackingZoneSpec']) {
            self._inner = self._inner.fork(new Zone['TaskTrackingZoneSpec']());
        }
        if (enableLongStackTrace && Zone['longStackTraceZoneSpec']) {
            self._inner = self._inner.fork(Zone['longStackTraceZoneSpec']);
        }
        // if shouldCoalesceRunChangeDetection is true, all tasks including event tasks will be
        // coalesced, so shouldCoalesceEventChangeDetection option is not necessary and can be skipped.
        self.shouldCoalesceEventChangeDetection =
            !shouldCoalesceRunChangeDetection && shouldCoalesceEventChangeDetection;
        self.shouldCoalesceRunChangeDetection = shouldCoalesceRunChangeDetection;
        self.callbackScheduled = false;
        self.scheduleInRootZone = scheduleInRootZone;
        forkInnerZoneWithAngularBehavior(self);
    }
    /**
      This method checks whether the method call happens within an Angular Zone instance.
    */
    static isInAngularZone() {
        // Zone needs to be checked, because this method might be called even when NoopNgZone is used.
        return typeof Zone !== 'undefined' && Zone.current.get(isAngularZoneProperty) === true;
    }
    /**
      Assures that the method is called within the Angular Zone, otherwise throws an error.
    */
    static assertInAngularZone() {
        if (!NgZone.isInAngularZone()) {
            throw new RuntimeError(909 /* RuntimeErrorCode.UNEXPECTED_ZONE_STATE */, ngDevMode && 'Expected to be in Angular Zone, but it is not!');
        }
    }
    /**
      Assures that the method is called outside of the Angular Zone, otherwise throws an error.
    */
    static assertNotInAngularZone() {
        if (NgZone.isInAngularZone()) {
            throw new RuntimeError(909 /* RuntimeErrorCode.UNEXPECTED_ZONE_STATE */, ngDevMode && 'Expected to not be in Angular Zone, but it is!');
        }
    }
    /**
     * Executes the `fn` function synchronously within the Angular zone and returns value returned by
     * the function.
     *
     * Running functions via `run` allows you to reenter Angular zone from a task that was executed
     * outside of the Angular zone (typically started via {@link #runOutsideAngular}).
     *
     * Any future tasks or microtasks scheduled from within this function will continue executing from
     * within the Angular zone.
     *
     * If a synchronous error happens it will be rethrown and not reported via `onError`.
     */
    run(fn, applyThis, applyArgs) {
        return this._inner.run(fn, applyThis, applyArgs);
    }
    /**
     * Executes the `fn` function synchronously within the Angular zone as a task and returns value
     * returned by the function.
     *
     * Running functions via `run` allows you to reenter Angular zone from a task that was executed
     * outside of the Angular zone (typically started via {@link #runOutsideAngular}).
     *
     * Any future tasks or microtasks scheduled from within this function will continue executing from
     * within the Angular zone.
     *
     * If a synchronous error happens it will be rethrown and not reported via `onError`.
     */
    runTask(fn, applyThis, applyArgs, name) {
        const zone = this._inner;
        const task = zone.scheduleEventTask('NgZoneEvent: ' + name, fn, EMPTY_PAYLOAD, noop, noop);
        try {
            return zone.runTask(task, applyThis, applyArgs);
        }
        finally {
            zone.cancelTask(task);
        }
    }
    /**
     * Same as `run`, except that synchronous errors are caught and forwarded via `onError` and not
     * rethrown.
     */
    runGuarded(fn, applyThis, applyArgs) {
        return this._inner.runGuarded(fn, applyThis, applyArgs);
    }
    /**
     * Executes the `fn` function synchronously in Angular's parent zone and returns value returned by
     * the function.
     *
     * Running functions via {@link #runOutsideAngular} allows you to escape Angular's zone and do
     * work that
     * doesn't trigger Angular change-detection or is subject to Angular's error handling.
     *
     * Any future tasks or microtasks scheduled from within this function will continue executing from
     * outside of the Angular zone.
     *
     * Use {@link #run} to reenter the Angular zone and do work that updates the application model.
     */
    runOutsideAngular(fn) {
        return this._outer.run(fn);
    }
}
const EMPTY_PAYLOAD = {};
function checkStable(zone) {
    // TODO: @JiaLiPassion, should check zone.isCheckStableRunning to prevent
    // re-entry. The case is:
    //
    // @Component({...})
    // export class AppComponent {
    // constructor(private ngZone: NgZone) {
    //   this.ngZone.onStable.subscribe(() => {
    //     this.ngZone.run(() => console.log('stable'););
    //   });
    // }
    //
    // The onStable subscriber run another function inside ngZone
    // which causes `checkStable()` re-entry.
    // But this fix causes some issues in g3, so this fix will be
    // launched in another PR.
    if (zone._nesting == 0 && !zone.hasPendingMicrotasks && !zone.isStable) {
        try {
            zone._nesting++;
            zone.onMicrotaskEmpty.emit(null);
        }
        finally {
            zone._nesting--;
            if (!zone.hasPendingMicrotasks) {
                try {
                    zone.runOutsideAngular(() => zone.onStable.emit(null));
                }
                finally {
                    zone.isStable = true;
                }
            }
        }
    }
}
function delayChangeDetectionForEvents(zone) {
    /**
     * We also need to check _nesting here
     * Consider the following case with shouldCoalesceRunChangeDetection = true
     *
     * ngZone.run(() => {});
     * ngZone.run(() => {});
     *
     * We want the two `ngZone.run()` only trigger one change detection
     * when shouldCoalesceRunChangeDetection is true.
     * And because in this case, change detection run in async way(requestAnimationFrame),
     * so we also need to check the _nesting here to prevent multiple
     * change detections.
     */
    if (zone.isCheckStableRunning || zone.callbackScheduled) {
        return;
    }
    zone.callbackScheduled = true;
    function scheduleCheckStable() {
        scheduleCallbackWithRafRace(() => {
            zone.callbackScheduled = false;
            updateMicroTaskStatus(zone);
            zone.isCheckStableRunning = true;
            checkStable(zone);
            zone.isCheckStableRunning = false;
        });
    }
    if (zone.scheduleInRootZone) {
        Zone.root.run(() => {
            scheduleCheckStable();
        });
    }
    else {
        zone._outer.run(() => {
            scheduleCheckStable();
        });
    }
    updateMicroTaskStatus(zone);
}
function forkInnerZoneWithAngularBehavior(zone) {
    const delayChangeDetectionForEventsDelegate = () => {
        delayChangeDetectionForEvents(zone);
    };
    const instanceId = ngZoneInstanceId++;
    zone._inner = zone._inner.fork({
        name: 'angular',
        properties: {
            [isAngularZoneProperty]: true,
            [angularZoneInstanceIdProperty]: instanceId,
            [angularZoneInstanceIdProperty + instanceId]: true,
        },
        onInvokeTask: (delegate, current, target, task, applyThis, applyArgs) => {
            // Prevent triggering change detection when the flag is detected.
            if (shouldBeIgnoredByZone(applyArgs)) {
                return delegate.invokeTask(target, task, applyThis, applyArgs);
            }
            try {
                onEnter(zone);
                return delegate.invokeTask(target, task, applyThis, applyArgs);
            }
            finally {
                if ((zone.shouldCoalesceEventChangeDetection && task.type === 'eventTask') ||
                    zone.shouldCoalesceRunChangeDetection) {
                    delayChangeDetectionForEventsDelegate();
                }
                onLeave(zone);
            }
        },
        onInvoke: (delegate, current, target, callback, applyThis, applyArgs, source) => {
            try {
                onEnter(zone);
                return delegate.invoke(target, callback, applyThis, applyArgs, source);
            }
            finally {
                if (zone.shouldCoalesceRunChangeDetection &&
                    // Do not delay change detection when the task is the scheduler's tick.
                    // We need to synchronously trigger the stability logic so that the
                    // zone-based scheduler can prevent a duplicate ApplicationRef.tick
                    // by first checking if the scheduler tick is running. This does seem a bit roundabout,
                    // but we _do_ still want to trigger all the correct events when we exit the zone.run
                    // (`onMicrotaskEmpty` and `onStable` _should_ emit; developers can have code which
                    // relies on these events happening after change detection runs).
                    // Note: `zone.callbackScheduled` is already in delayChangeDetectionForEventsDelegate
                    // but is added here as well to prevent reads of applyArgs when not necessary
                    !zone.callbackScheduled &&
                    !isSchedulerTick(applyArgs)) {
                    delayChangeDetectionForEventsDelegate();
                }
                onLeave(zone);
            }
        },
        onHasTask: (delegate, current, target, hasTaskState) => {
            delegate.hasTask(target, hasTaskState);
            if (current === target) {
                // We are only interested in hasTask events which originate from our zone
                // (A child hasTask event is not interesting to us)
                if (hasTaskState.change == 'microTask') {
                    zone._hasPendingMicrotasks = hasTaskState.microTask;
                    updateMicroTaskStatus(zone);
                    checkStable(zone);
                }
                else if (hasTaskState.change == 'macroTask') {
                    zone.hasPendingMacrotasks = hasTaskState.macroTask;
                }
            }
        },
        onHandleError: (delegate, current, target, error) => {
            delegate.handleError(target, error);
            zone.runOutsideAngular(() => zone.onError.emit(error));
            return false;
        },
    });
}
function updateMicroTaskStatus(zone) {
    if (zone._hasPendingMicrotasks ||
        ((zone.shouldCoalesceEventChangeDetection || zone.shouldCoalesceRunChangeDetection) &&
            zone.callbackScheduled === true)) {
        zone.hasPendingMicrotasks = true;
    }
    else {
        zone.hasPendingMicrotasks = false;
    }
}
function onEnter(zone) {
    zone._nesting++;
    if (zone.isStable) {
        zone.isStable = false;
        zone.onUnstable.emit(null);
    }
}
function onLeave(zone) {
    zone._nesting--;
    checkStable(zone);
}
/**
 * Provides a noop implementation of `NgZone` which does nothing. This zone requires explicit calls
 * to framework to perform rendering.
 */
export class NoopNgZone {
    constructor() {
        this.hasPendingMicrotasks = false;
        this.hasPendingMacrotasks = false;
        this.isStable = true;
        this.onUnstable = new EventEmitter();
        this.onMicrotaskEmpty = new EventEmitter();
        this.onStable = new EventEmitter();
        this.onError = new EventEmitter();
    }
    run(fn, applyThis, applyArgs) {
        return fn.apply(applyThis, applyArgs);
    }
    runGuarded(fn, applyThis, applyArgs) {
        return fn.apply(applyThis, applyArgs);
    }
    runOutsideAngular(fn) {
        return fn();
    }
    runTask(fn, applyThis, applyArgs, name) {
        return fn.apply(applyThis, applyArgs);
    }
}
function shouldBeIgnoredByZone(applyArgs) {
    return hasApplyArgsData(applyArgs, '__ignore_ng_zone__');
}
function isSchedulerTick(applyArgs) {
    return hasApplyArgsData(applyArgs, '__scheduler_tick__');
}
function hasApplyArgsData(applyArgs, key) {
    if (!Array.isArray(applyArgs)) {
        return false;
    }
    // We should only ever get 1 arg passed through to invokeTask.
    // Short circuit here incase that behavior changes.
    if (applyArgs.length !== 1) {
        return false;
    }
    return applyArgs[0]?.data?.[key] === true;
}
export function getNgZone(ngZoneToUse = 'zone.js', options) {
    if (ngZoneToUse === 'noop') {
        return new NoopNgZone();
    }
    if (ngZoneToUse === 'zone.js') {
        return new NgZone(options);
    }
    return ngZoneToUse;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmdfem9uZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3pvbmUvbmdfem9uZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQUMsNkJBQTZCLEVBQUMsTUFBTSxzQ0FBc0MsQ0FBQztBQUNuRixPQUFPLEVBQUMsWUFBWSxFQUFtQixNQUFNLFdBQVcsQ0FBQztBQUN6RCxPQUFPLEVBQUMsWUFBWSxFQUFDLE1BQU0sa0JBQWtCLENBQUM7QUFDOUMsT0FBTyxFQUFDLDJCQUEyQixFQUFDLE1BQU0sNEJBQTRCLENBQUM7QUFDdkUsT0FBTyxFQUFDLElBQUksRUFBQyxNQUFNLGNBQWMsQ0FBQztBQUVsQyxPQUFPLEVBQUMseUJBQXlCLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQU1oRSxNQUFNLHFCQUFxQixHQUFHLGVBQWUsQ0FBQztBQUM5QyxNQUFNLENBQUMsTUFBTSw2QkFBNkIsR0FBRyxxQkFBcUIsR0FBRyxLQUFLLENBQUM7QUFFM0UsSUFBSSxnQkFBZ0IsR0FBRyxDQUFDLENBQUM7QUFFekI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7R0F5RUc7QUFDSCxNQUFNLE9BQU8sTUFBTTtJQWlDakIsWUFBWSxPQUlYO1FBcENRLHlCQUFvQixHQUFZLEtBQUssQ0FBQztRQUN0Qyx5QkFBb0IsR0FBWSxLQUFLLENBQUM7UUFFL0M7O1dBRUc7UUFDTSxhQUFRLEdBQVksSUFBSSxDQUFDO1FBRWxDOztXQUVHO1FBQ00sZUFBVSxHQUFzQixJQUFJLFlBQVksQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUVqRTs7OztXQUlHO1FBQ00scUJBQWdCLEdBQXNCLElBQUksWUFBWSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBRXZFOzs7O1dBSUc7UUFDTSxhQUFRLEdBQXNC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SSxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDN0IsQ0FBQztJQUNELE9BQU8sV0FBVyxDQUFDO0FBQ3JCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtTQ0hFRFVMRV9JTl9ST09UX1pPTkVfREVGQVVMVH0gZnJvbSAnLi4vY2hhbmdlX2RldGVjdGlvbi9zY2hlZHVsaW5nL2ZsYWdzJztcbmltcG9ydCB7UnVudGltZUVycm9yLCBSdW50aW1lRXJyb3JDb2RlfSBmcm9tICcuLi9lcnJvcnMnO1xuaW1wb3J0IHtFdmVudEVtaXR0ZXJ9IGZyb20gJy4uL2V2ZW50X2VtaXR0ZXInO1xuaW1wb3J0IHtzY2hlZHVsZUNhbGxiYWNrV2l0aFJhZlJhY2V9IGZyb20gJy4uL3V0aWwvY2FsbGJhY2tfc2NoZWR1bGVyJztcbmltcG9ydCB7bm9vcH0gZnJvbSAnLi4vdXRpbC9ub29wJztcblxuaW1wb3J0IHtBc3luY1N0YWNrVGFnZ2luZ1pvbmVTcGVjfSBmcm9tICcuL2FzeW5jLXN0YWNrLXRhZ2dpbmcnO1xuXG4vLyBUaGUgYmVsb3cgaXMgbmVlZGVkIGFzIG90aGVyd2lzZSBhIG51bWJlciBvZiB0YXJnZXRzIGZhaWwgaW4gRzMgZHVlIHRvOlxuLy8gRVJST1IgLSBbSlNDX1VOREVGSU5FRF9WQVJJQUJMRV0gdmFyaWFibGUgWm9uZSBpcyB1bmRlY2xhcmVkXG5kZWNsYXJlIGNvbnN0IFpvbmU6IGFueTtcblxuY29uc3QgaXNBbmd1bGFyWm9uZVByb3BlcnR5ID0gJ2lzQW5ndWxhclpvbmUnO1xuZXhwb3J0IGNvbnN0IGFuZ3VsYXJab25lSW5zdGFuY2VJZFByb3BlcnR5ID0gaXNBbmd1bGFyWm9uZVByb3BlcnR5ICsgJ19JRCc7XG5cbmxldCBuZ1pvbmVJbnN0YW5jZUlkID0gMDtcblxuLyoqXG4gKiBBbiBpbmplY3RhYmxlIHNlcnZpY2UgZm9yIGV4ZWN1dGluZyB3b3JrIGluc2lkZSBvciBvdXRzaWRlIG9mIHRoZSBBbmd1bGFyIHpvbmUuXG4gKlxuICogVGhlIG1vc3QgY29tbW9uIHVzZSBvZiB0aGlzIHNlcnZpY2UgaXMgdG8gb3B0aW1pemUgcGVyZm9ybWFuY2Ugd2hlbiBzdGFydGluZyBhIHdvcmsgY29uc2lzdGluZyBvZlxuICogb25lIG9yIG1vcmUgYXN5bmNocm9ub3VzIHRhc2tzIHRoYXQgZG9uJ3QgcmVxdWlyZSBVSSB1cGRhdGVzIG9yIGVycm9yIGhhbmRsaW5nIHRvIGJlIGhhbmRsZWQgYnlcbiAqIEFuZ3VsYXIuIFN1Y2ggdGFza3MgY2FuIGJlIGtpY2tlZCBvZmYgdmlhIHtAbGluayAjcnVuT3V0c2lkZUFuZ3VsYXJ9IGFuZCBpZiBuZWVkZWQsIHRoZXNlIHRhc2tzXG4gKiBjYW4gcmVlbnRlciB0aGUgQW5ndWxhciB6b25lIHZpYSB7QGxpbmsgI3J1bn0uXG4gKlxuICogPCEtLSBUT0RPOiBhZGQvZml4IGxpbmtzIHRvOlxuICogICAtIGRvY3MgZXhwbGFpbmluZyB6b25lcyBhbmQgdGhlIHVzZSBvZiB6b25lcyBpbiBBbmd1bGFyIGFuZCBjaGFuZ2UtZGV0ZWN0aW9uXG4gKiAgIC0gbGluayB0byBydW5PdXRzaWRlQW5ndWxhci9ydW4gKHRocm91Z2hvdXQgdGhpcyBmaWxlISlcbiAqICAgLS0+XG4gKlxuICogQHVzYWdlTm90ZXNcbiAqICMjIyBFeGFtcGxlXG4gKlxuICogYGBgXG4gKiBpbXBvcnQge0NvbXBvbmVudCwgTmdab25lfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbiAqIGltcG9ydCB7TmdJZn0gZnJvbSAnQGFuZ3VsYXIvY29tbW9uJztcbiAqXG4gKiBAQ29tcG9uZW50KHtcbiAqICAgc2VsZWN0b3I6ICduZy16b25lLWRlbW8nLFxuICogICB0ZW1wbGF0ZTogYFxuICogICAgIDxoMj5EZW1vOiBOZ1pvbmU8L2gyPlxuICpcbiAqICAgICA8cD5Qcm9ncmVzczoge3twcm9ncmVzc319JTwvcD5cbiAqICAgICA8cCAqbmdJZj1cInByb2dyZXNzID49IDEwMFwiPkRvbmUgcHJvY2Vzc2luZyB7e2xhYmVsfX0gb2YgQW5ndWxhciB6b25lITwvcD5cbiAqXG4gKiAgICAgPGJ1dHRvbiAoY2xpY2spPVwicHJvY2Vzc1dpdGhpbkFuZ3VsYXJab25lKClcIj5Qcm9jZXNzIHdpdGhpbiBBbmd1bGFyIHpvbmU8L2J1dHRvbj5cbiAqICAgICA8YnV0dG9uIChjbGljayk9XCJwcm9jZXNzT3V0c2lkZU9mQW5ndWxhclpvbmUoKVwiPlByb2Nlc3Mgb3V0c2lkZSBvZiBBbmd1bGFyIHpvbmU8L2J1dHRvbj5cbiAqICAgYCxcbiAqIH0pXG4gKiBleHBvcnQgY2xhc3MgTmdab25lRGVtbyB7XG4gKiAgIHByb2dyZXNzOiBudW1iZXIgPSAwO1xuICogICBsYWJlbDogc3RyaW5nO1xuICpcbiAqICAgY29uc3RydWN0b3IocHJpdmF0ZSBfbmdab25lOiBOZ1pvbmUpIHt9XG4gKlxuICogICAvLyBMb29wIGluc2lkZSB0aGUgQW5ndWxhciB6b25lXG4gKiAgIC8vIHNvIHRoZSBVSSBET0VTIHJlZnJlc2ggYWZ0ZXIgZWFjaCBzZXRUaW1lb3V0IGN5Y2xlXG4gKiAgIHByb2Nlc3NXaXRoaW5Bbmd1bGFyWm9uZSgpIHtcbiAqICAgICB0aGlzLmxhYmVsID0gJ2luc2lkZSc7XG4gKiAgICAgdGhpcy5wcm9ncmVzcyA9IDA7XG4gKiAgICAgdGhpcy5faW5jcmVhc2VQcm9ncmVzcygoKSA9PiBjb25zb2xlLmxvZygnSW5zaWRlIERvbmUhJykpO1xuICogICB9XG4gKlxuICogICAvLyBMb29wIG91dHNpZGUgb2YgdGhlIEFuZ3VsYXIgem9uZVxuICogICAvLyBzbyB0aGUgVUkgRE9FUyBOT1QgcmVmcmVzaCBhZnRlciBlYWNoIHNldFRpbWVvdXQgY3ljbGVcbiAqICAgcHJvY2Vzc091dHNpZGVPZkFuZ3VsYXJab25lKCkge1xuICogICAgIHRoaXMubGFiZWwgPSAnb3V0c2lkZSc7XG4gKiAgICAgdGhpcy5wcm9ncmVzcyA9IDA7XG4gKiAgICAgdGhpcy5fbmdab25lLnJ1bk91dHNpZGVBbmd1bGFyKCgpID0+IHtcbiAqICAgICAgIHRoaXMuX2luY3JlYXNlUHJvZ3Jlc3MoKCkgPT4ge1xuICogICAgICAgICAvLyByZWVudGVyIHRoZSBBbmd1bGFyIHpvbmUgYW5kIGRpc3BsYXkgZG9uZVxuICogICAgICAgICB0aGlzLl9uZ1pvbmUucnVuKCgpID0+IHsgY29uc29sZS5sb2coJ091dHNpZGUgRG9uZSEnKTsgfSk7XG4gKiAgICAgICB9KTtcbiAqICAgICB9KTtcbiAqICAgfVxuICpcbiAqICAgX2luY3JlYXNlUHJvZ3Jlc3MoZG9uZUNhbGxiYWNrOiAoKSA9PiB2b2lkKSB7XG4gKiAgICAgdGhpcy5wcm9ncmVzcyArPSAxO1xuICogICAgIGNvbnNvbGUubG9nKGBDdXJyZW50IHByb2dyZXNzOiAke3RoaXMucHJvZ3Jlc3N9JWApO1xuICpcbiAqICAgICBpZiAodGhpcy5wcm9ncmVzcyA8IDEwMCkge1xuICogICAgICAgd2luZG93LnNldFRpbWVvdXQoKCkgPT4gdGhpcy5faW5jcmVhc2VQcm9ncmVzcyhkb25lQ2FsbGJhY2spLCAxMCk7XG4gKiAgICAgfSBlbHNlIHtcbiAqICAgICAgIGRvbmVDYWxsYmFjaygpO1xuICogICAgIH1cbiAqICAgfVxuICogfVxuICogYGBgXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgY2xhc3MgTmdab25lIHtcbiAgcmVhZG9ubHkgaGFzUGVuZGluZ01hY3JvdGFza3M6IGJvb2xlYW4gPSBmYWxzZTtcbiAgcmVhZG9ubHkgaGFzUGVuZGluZ01pY3JvdGFza3M6IGJvb2xlYW4gPSBmYWxzZTtcblxuICAvKipcbiAgICogV2hldGhlciB0aGVyZSBhcmUgbm8gb3V0c3RhbmRpbmcgbWljcm90YXNrcyBvciBtYWNyb3Rhc2tzLlxuICAgKi9cbiAgcmVhZG9ubHkgaXNTdGFibGU6IGJvb2xlYW4gPSB0cnVlO1xuXG4gIC8qKlxuICAgKiBOb3RpZmllcyB3aGVuIGNvZGUgZW50ZXJzIEFuZ3VsYXIgWm9uZS4gVGhpcyBnZXRzIGZpcmVkIGZpcnN0IG9uIFZNIFR1cm4uXG4gICAqL1xuICByZWFkb25seSBvblVuc3RhYmxlOiBFdmVudEVtaXR0ZXI8YW55PiA9IG5ldyBFdmVudEVtaXR0ZXIoZmFsc2UpO1xuXG4gIC8qKlxuICAgKiBOb3RpZmllcyB3aGVuIHRoZXJlIGlzIG5vIG1vcmUgbWljcm90YXNrcyBlbnF1ZXVlZCBpbiB0aGUgY3VycmVudCBWTSBUdXJuLlxuICAgKiBUaGlzIGlzIGEgaGludCBmb3IgQW5ndWxhciB0byBkbyBjaGFuZ2UgZGV0ZWN0aW9uLCB3aGljaCBtYXkgZW5xdWV1ZSBtb3JlIG1pY3JvdGFza3MuXG4gICAqIEZvciB0aGlzIHJlYXNvbiB0aGlzIGV2ZW50IGNhbiBmaXJlIG11bHRpcGxlIHRpbWVzIHBlciBWTSBUdXJuLlxuICAgKi9cbiAgcmVhZG9ubHkgb25NaWNyb3Rhc2tFbXB0eTogRXZlbnRFbWl0dGVyPGFueT4gPSBuZXcgRXZlbnRFbWl0dGVyKGZhbHNlKTtcblxuICAvKipcbiAgICogTm90aWZpZXMgd2hlbiB0aGUgbGFzdCBgb25NaWNyb3Rhc2tFbXB0eWAgaGFzIHJ1biBhbmQgdGhlcmUgYXJlIG5vIG1vcmUgbWljcm90YXNrcywgd2hpY2hcbiAgICogaW1wbGllcyB3ZSBhcmUgYWJvdXQgdG8gcmVsaW5xdWlzaCBWTSB0dXJuLlxuICAgKiBUaGlzIGV2ZW50IGdldHMgY2FsbGVkIGp1c3Qgb25jZS5cbiAgICovXG4gIHJlYWRvbmx5IG9uU3RhYmxlOiBFdmVudEVtaXR0ZXI8YW55PiA9IG5ldyBFdmVudEVtaXR0ZXIoZmFsc2UpO1xuXG4gIC8qKlxuICAgKiBOb3RpZmllcyB0aGF0IGFuIGVycm9yIGhhcyBiZWVuIGRlbGl2ZXJlZC5cbiAgICovXG4gIHJlYWRvbmx5IG9uRXJyb3I6IEV2ZW50RW1pdHRlcjxhbnk+ID0gbmV3IEV2ZW50RW1pdHRlcihmYWxzZSk7XG5cbiAgY29uc3RydWN0b3Iob3B0aW9uczoge1xuICAgIGVuYWJsZUxvbmdTdGFja1RyYWNlPzogYm9vbGVhbjtcbiAgICBzaG91bGRDb2FsZXNjZUV2ZW50Q2hhbmdlRGV0ZWN0aW9uPzogYm9vbGVhbjtcbiAgICBzaG91bGRDb2FsZXNjZVJ1bkNoYW5nZURldGVjdGlvbj86IGJvb2xlYW47XG4gIH0pIHtcbiAgICBjb25zdCB7XG4gICAgICBlbmFibGVMb25nU3RhY2tUcmFjZSA9IGZhbHNlLFxuICAgICAgc2hvdWxkQ29hbGVzY2VFdmVudENoYW5nZURldGVjdGlvbiA9IGZhbHNlLFxuICAgICAgc2hvdWxkQ29hbGVzY2VSdW5DaGFuZ2VEZXRlY3Rpb24gPSBmYWxzZSxcbiAgICAgIHNjaGVkdWxlSW5Sb290Wm9uZSA9IFNDSEVEVUxFX0lOX1JPT1RfWk9ORV9ERUZBVUxULFxuICAgIH0gPSBvcHRpb25zIGFzIEludGVybmFsTmdab25lT3B0aW9ucztcblxuICAgIGlmICh0eXBlb2YgWm9uZSA9PSAndW5kZWZpbmVkJykge1xuICAgICAgdGhyb3cgbmV3IFJ1bnRpbWVFcnJvcihcbiAgICAgICAgUnVudGltZUVycm9yQ29kZS5NSVNTSU5HX1pPTkVKUyxcbiAgICAgICAgbmdEZXZNb2RlICYmIGBJbiB0aGlzIGNvbmZpZ3VyYXRpb24gQW5ndWxhciByZXF1aXJlcyBab25lLmpzYCxcbiAgICAgICk7XG4gICAgfVxuXG4gICAgWm9uZS5hc3NlcnRab25lUGF0Y2hlZCgpO1xuICAgIGNvbnN0IHNlbGYgPSB0aGlzIGFzIGFueSBhcyBOZ1pvbmVQcml2YXRlO1xuICAgIHNlbGYuX25lc3RpbmcgPSAwO1xuXG4gICAgc2VsZi5fb3V0ZXIgPSBzZWxmLl9pbm5lciA9IFpvbmUuY3VycmVudDtcblxuICAgIC8vIEFzeW5jU3RhY2tUYWdnaW5nWm9uZVNwZWMgcHJvdmlkZXMgYGxpbmtlZCBzdGFjayB0cmFjZXNgIHRvIHNob3dcbiAgICAvLyB3aGVyZSB0aGUgYXN5bmMgb3BlcmF0aW9uIGlzIHNjaGVkdWxlZC4gRm9yIG1vcmUgZGV0YWlscywgcmVmZXJcbiAgICAvLyB0byB0aGlzIGFydGljbGUsIGh0dHBzOi8vZGV2ZWxvcGVyLmNocm9tZS5jb20vYmxvZy9kZXZ0b29scy1iZXR0ZXItYW5ndWxhci1kZWJ1Z2dpbmcvXG4gICAgLy8gQW5kIHdlIG9ubHkgaW1wb3J0IHRoaXMgQXN5bmNTdGFja1RhZ2dpbmdab25lU3BlYyBpbiBkZXZlbG9wbWVudCBtb2RlLFxuICAgIC8vIGluIHRoZSBwcm9kdWN0aW9uIG1vZGUsIHRoZSBBc3luY1N0YWNrVGFnZ2luZ1pvbmVTcGVjIHdpbGwgYmUgdHJlZSBzaGFrZW4gYXdheS5cbiAgICBpZiAobmdEZXZNb2RlKSB7XG4gICAgICBzZWxmLl9pbm5lciA9IHNlbGYuX2lubmVyLmZvcmsobmV3IEFzeW5jU3RhY2tUYWdnaW5nWm9uZVNwZWMoJ0FuZ3VsYXInKSk7XG4gICAgfVxuXG4gICAgaWYgKChab25lIGFzIGFueSlbJ1Rhc2tUcmFja2luZ1pvbmVTcGVjJ10pIHtcbiAgICAgIHNlbGYuX2lubmVyID0gc2VsZi5faW5uZXIuZm9yayhuZXcgKChab25lIGFzIGFueSlbJ1Rhc2tUcmFja2luZ1pvbmVTcGVjJ10gYXMgYW55KSgpKTtcbiAgICB9XG5cbiAgICBpZiAoZW5hYmxlTG9uZ1N0YWNrVHJhY2UgJiYgKFpvbmUgYXMgYW55KVsnbG9uZ1N0YWNrVHJhY2Vab25lU3BlYyddKSB7XG4gICAgICBzZWxmLl9pbm5lciA9IHNlbGYuX2lubmVyLmZvcmsoKFpvbmUgYXMgYW55KVsnbG9uZ1N0YWNrVHJhY2Vab25lU3BlYyddKTtcbiAgICB9XG4gICAgLy8gaWYgc2hvdWxkQ29hbGVzY2VSdW5DaGFuZ2VEZXRlY3Rpb24gaXMgdHJ1ZSwgYWxsIHRhc2tzIGluY2x1ZGluZyBldmVudCB0YXNrcyB3aWxsIGJlXG4gICAgLy8gY29hbGVzY2VkLCBzbyBzaG91bGRDb2FsZXNjZUV2ZW50Q2hhbmdlRGV0ZWN0aW9uIG9wdGlvbiBpcyBub3QgbmVjZXNzYXJ5IGFuZCBjYW4gYmUgc2tpcHBlZC5cbiAgICBzZWxmLnNob3VsZENvYWxlc2NlRXZlbnRDaGFuZ2VEZXRlY3Rpb24gPVxuICAgICAgIXNob3VsZENvYWxlc2NlUnVuQ2hhbmdlRGV0ZWN0aW9uICYmIHNob3VsZENvYWxlc2NlRXZlbnRDaGFuZ2VEZXRlY3Rpb247XG4gICAgc2VsZi5zaG91bGRDb2FsZXNjZVJ1bkNoYW5nZURldGVjdGlvbiA9IHNob3VsZENvYWxlc2NlUnVuQ2hhbmdlRGV0ZWN0aW9uO1xuICAgIHNlbGYuY2FsbGJhY2tTY2hlZHVsZWQgPSBmYWxzZTtcbiAgICBzZWxmLnNjaGVkdWxlSW5Sb290Wm9uZSA9IHNjaGVkdWxlSW5Sb290Wm9uZTtcbiAgICBmb3JrSW5uZXJab25lV2l0aEFuZ3VsYXJCZWhhdmlvcihzZWxmKTtcbiAgfVxuXG4gIC8qKlxuICAgIFRoaXMgbWV0aG9kIGNoZWNrcyB3aGV0aGVyIHRoZSBtZXRob2QgY2FsbCBoYXBwZW5zIHdpdGhpbiBhbiBBbmd1bGFyIFpvbmUgaW5zdGFuY2UuXG4gICovXG4gIHN0YXRpYyBpc0luQW5ndWxhclpvbmUoKTogYm9vbGVhbiB7XG4gICAgLy8gWm9uZSBuZWVkcyB0byBiZSBjaGVja2VkLCBiZWNhdXNlIHRoaXMgbWV0aG9kIG1pZ2h0IGJlIGNhbGxlZCBldmVuIHdoZW4gTm9vcE5nWm9uZSBpcyB1c2VkLlxuICAgIHJldHVybiB0eXBlb2YgWm9uZSAhPT0gJ3VuZGVmaW5lZCcgJiYgWm9uZS5jdXJyZW50LmdldChpc0FuZ3VsYXJab25lUHJvcGVydHkpID09PSB0cnVlO1xuICB9XG5cbiAgLyoqXG4gICAgQXNzdXJlcyB0aGF0IHRoZSBtZXRob2QgaXMgY2FsbGVkIHdpdGhpbiB0aGUgQW5ndWxhciBab25lLCBvdGhlcndpc2UgdGhyb3dzIGFuIGVycm9yLlxuICAqL1xuICBzdGF0aWMgYXNzZXJ0SW5Bbmd1bGFyWm9uZSgpOiB2b2lkIHtcbiAgICBpZiAoIU5nWm9uZS5pc0luQW5ndWxhclpvbmUoKSkge1xuICAgICAgdGhyb3cgbmV3IFJ1bnRpbWVFcnJvcihcbiAgICAgICAgUnVudGltZUVycm9yQ29kZS5VTkVYUEVDVEVEX1pPTkVfU1RBVEUsXG4gICAgICAgIG5nRGV2TW9kZSAmJiAnRXhwZWN0ZWQgdG8gYmUgaW4gQW5ndWxhciBab25lLCBidXQgaXQgaXMgbm90IScsXG4gICAgICApO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgIEFzc3VyZXMgdGhhdCB0aGUgbWV0aG9kIGlzIGNhbGxlZCBvdXRzaWRlIG9mIHRoZSBBbmd1bGFyIFpvbmUsIG90aGVyd2lzZSB0aHJvd3MgYW4gZXJyb3IuXG4gICovXG4gIHN0YXRpYyBhc3NlcnROb3RJbkFuZ3VsYXJab25lKCk6IHZvaWQge1xuICAgIGlmIChOZ1pvbmUuaXNJbkFuZ3VsYXJab25lKCkpIHtcbiAgICAgIHRocm93IG5ldyBSdW50aW1lRXJyb3IoXG4gICAgICAgIFJ1bnRpbWVFcnJvckNvZGUuVU5FWFBFQ1RFRF9aT05FX1NUQVRFLFxuICAgICAgICBuZ0Rldk1vZGUgJiYgJ0V4cGVjdGVkIHRvIG5vdCBiZSBpbiBBbmd1bGFyIFpvbmUsIGJ1dCBpdCBpcyEnLFxuICAgICAgKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogRXhlY3V0ZXMgdGhlIGBmbmAgZnVuY3Rpb24gc3luY2hyb25vdXNseSB3aXRoaW4gdGhlIEFuZ3VsYXIgem9uZSBhbmQgcmV0dXJucyB2YWx1ZSByZXR1cm5lZCBieVxuICAgKiB0aGUgZnVuY3Rpb24uXG4gICAqXG4gICAqIFJ1bm5pbmcgZnVuY3Rpb25zIHZpYSBgcnVuYCBhbGxvd3MgeW91IHRvIHJlZW50ZXIgQW5ndWxhciB6b25lIGZyb20gYSB0YXNrIHRoYXQgd2FzIGV4ZWN1dGVkXG4gICAqIG91dHNpZGUgb2YgdGhlIEFuZ3VsYXIgem9uZSAodHlwaWNhbGx5IHN0YXJ0ZWQgdmlhIHtAbGluayAjcnVuT3V0c2lkZUFuZ3VsYXJ9KS5cbiAgICpcbiAgICogQW55IGZ1dHVyZSB0YXNrcyBvciBtaWNyb3Rhc2tzIHNjaGVkdWxlZCBmcm9tIHdpdGhpbiB0aGlzIGZ1bmN0aW9uIHdpbGwgY29udGludWUgZXhlY3V0aW5nIGZyb21cbiAgICogd2l0aGluIHRoZSBBbmd1bGFyIHpvbmUuXG4gICAqXG4gICAqIElmIGEgc3luY2hyb25vdXMgZXJyb3IgaGFwcGVucyBpdCB3aWxsIGJlIHJldGhyb3duIGFuZCBub3QgcmVwb3J0ZWQgdmlhIGBvbkVycm9yYC5cbiAgICovXG4gIHJ1bjxUPihmbjogKC4uLmFyZ3M6IGFueVtdKSA9PiBULCBhcHBseVRoaXM/OiBhbnksIGFwcGx5QXJncz86IGFueVtdKTogVCB7XG4gICAgcmV0dXJuICh0aGlzIGFzIGFueSBhcyBOZ1pvbmVQcml2YXRlKS5faW5uZXIucnVuKGZuLCBhcHBseVRoaXMsIGFwcGx5QXJncyk7XG4gIH1cblxuICAvKipcbiAgICogRXhlY3V0ZXMgdGhlIGBmbmAgZnVuY3Rpb24gc3luY2hyb25vdXNseSB3aXRoaW4gdGhlIEFuZ3VsYXIgem9uZSBhcyBhIHRhc2sgYW5kIHJldHVybnMgdmFsdWVcbiAgICogcmV0dXJuZWQgYnkgdGhlIGZ1bmN0aW9uLlxuICAgKlxuICAgKiBSdW5uaW5nIGZ1bmN0aW9ucyB2aWEgYHJ1bmAgYWxsb3dzIHlvdSB0byByZWVudGVyIEFuZ3VsYXIgem9uZSBmcm9tIGEgdGFzayB0aGF0IHdhcyBleGVjdXRlZFxuICAgKiBvdXRzaWRlIG9mIHRoZSBBbmd1bGFyIHpvbmUgKHR5cGljYWxseSBzdGFydGVkIHZpYSB7QGxpbmsgI3J1bk91dHNpZGVBbmd1bGFyfSkuXG4gICAqXG4gICAqIEFueSBmdXR1cmUgdGFza3Mgb3IgbWljcm90YXNrcyBzY2hlZHVsZWQgZnJvbSB3aXRoaW4gdGhpcyBmdW5jdGlvbiB3aWxsIGNvbnRpbnVlIGV4ZWN1dGluZyBmcm9tXG4gICAqIHdpdGhpbiB0aGUgQW5ndWxhciB6b25lLlxuICAgKlxuICAgKiBJZiBhIHN5bmNocm9ub3VzIGVycm9yIGhhcHBlbnMgaXQgd2lsbCBiZSByZXRocm93biBhbmQgbm90IHJlcG9ydGVkIHZpYSBgb25FcnJvcmAuXG4gICAqL1xuICBydW5UYXNrPFQ+KGZuOiAoLi4uYXJnczogYW55W10pID0+IFQsIGFwcGx5VGhpcz86IGFueSwgYXBwbHlBcmdzPzogYW55W10sIG5hbWU/OiBzdHJpbmcpOiBUIHtcbiAgICBjb25zdCB6b25lID0gKHRoaXMgYXMgYW55IGFzIE5nWm9uZVByaXZhdGUpLl9pbm5lcjtcbiAgICBjb25zdCB0YXNrID0gem9uZS5zY2hlZHVsZUV2ZW50VGFzaygnTmdab25lRXZlbnQ6ICcgKyBuYW1lLCBmbiwgRU1QVFlfUEFZTE9BRCwgbm9vcCwgbm9vcCk7XG4gICAgdHJ5IHtcbiAgICAgIHJldHVybiB6b25lLnJ1blRhc2sodGFzaywgYXBwbHlUaGlzLCBhcHBseUFyZ3MpO1xuICAgIH0gZmluYWxseSB7XG4gICAgICB6b25lLmNhbmNlbFRhc2sodGFzayk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFNhbWUgYXMgYHJ1bmAsIGV4Y2VwdCB0aGF0IHN5bmNocm9ub3VzIGVycm9ycyBhcmUgY2F1Z2h0IGFuZCBmb3J3YXJkZWQgdmlhIGBvbkVycm9yYCBhbmQgbm90XG4gICAqIHJldGhyb3duLlxuICAgKi9cbiAgcnVuR3VhcmRlZDxUPihmbjogKC4uLmFyZ3M6IGFueVtdKSA9PiBULCBhcHBseVRoaXM/OiBhbnksIGFwcGx5QXJncz86IGFueVtdKTogVCB7XG4gICAgcmV0dXJuICh0aGlzIGFzIGFueSBhcyBOZ1pvbmVQcml2YXRlKS5faW5uZXIucnVuR3VhcmRlZChmbiwgYXBwbHlUaGlzLCBhcHBseUFyZ3MpO1xuICB9XG5cbiAgLyoqXG4gICAqIEV4ZWN1dGVzIHRoZSBgZm5gIGZ1bmN0aW9uIHN5bmNocm9ub3VzbHkgaW4gQW5ndWxhcidzIHBhcmVudCB6b25lIGFuZCByZXR1cm5zIHZhbHVlIHJldHVybmVkIGJ5XG4gICAqIHRoZSBmdW5jdGlvbi5cbiAgICpcbiAgICogUnVubmluZyBmdW5jdGlvbnMgdmlhIHtAbGluayAjcnVuT3V0c2lkZUFuZ3VsYXJ9IGFsbG93cyB5b3UgdG8gZXNjYXBlIEFuZ3VsYXIncyB6b25lIGFuZCBkb1xuICAgKiB3b3JrIHRoYXRcbiAgICogZG9lc24ndCB0cmlnZ2VyIEFuZ3VsYXIgY2hhbmdlLWRldGVjdGlvbiBvciBpcyBzdWJqZWN0IHRvIEFuZ3VsYXIncyBlcnJvciBoYW5kbGluZy5cbiAgICpcbiAgICogQW55IGZ1dHVyZSB0YXNrcyBvciBtaWNyb3Rhc2tzIHNjaGVkdWxlZCBmcm9tIHdpdGhpbiB0aGlzIGZ1bmN0aW9uIHdpbGwgY29udGludWUgZXhlY3V0aW5nIGZyb21cbiAgICogb3V0c2lkZSBvZiB0aGUgQW5ndWxhciB6b25lLlxuICAgKlxuICAgKiBVc2Uge0BsaW5rICNydW59IHRvIHJlZW50ZXIgdGhlIEFuZ3VsYXIgem9uZSBhbmQgZG8gd29yayB0aGF0IHVwZGF0ZXMgdGhlIGFwcGxpY2F0aW9uIG1vZGVsLlxuICAgKi9cbiAgcnVuT3V0c2lkZUFuZ3VsYXI8VD4oZm46ICguLi5hcmdzOiBhbnlbXSkgPT4gVCk6IFQge1xuICAgIHJldHVybiAodGhpcyBhcyBhbnkgYXMgTmdab25lUHJpdmF0ZSkuX291dGVyLnJ1bihmbik7XG4gIH1cbn1cblxuY29uc3QgRU1QVFlfUEFZTE9BRCA9IHt9O1xuXG5leHBvcnQgaW50ZXJmYWNlIE5nWm9uZVByaXZhdGUgZXh0ZW5kcyBOZ1pvbmUge1xuICBfb3V0ZXI6IFpvbmU7XG4gIF9pbm5lcjogWm9uZTtcbiAgX25lc3Rpbmc6IG51bWJlcjtcbiAgX2hhc1BlbmRpbmdNaWNyb3Rhc2tzOiBib29sZWFuO1xuXG4gIGhhc1BlbmRpbmdNYWNyb3Rhc2tzOiBib29sZWFuO1xuICBoYXNQZW5kaW5nTWljcm90YXNrczogYm9vbGVhbjtcbiAgY2FsbGJhY2tTY2hlZHVsZWQ6IGJvb2xlYW47XG4gIC8qKlxuICAgKiBBIGZsYWcgdG8gaW5kaWNhdGUgaWYgTmdab25lIGlzIGN1cnJlbnRseSBpbnNpZGVcbiAgICogY2hlY2tTdGFibGUgYW5kIHRvIHByZXZlbnQgcmUtZW50cnkuIFRoZSBmbGFnIGlzXG4gICAqIG5lZWRlZCBiZWNhdXNlIGl0IGlzIHBvc3NpYmxlIHRvIGludm9rZSB0aGUgY2hhbmdlXG4gICAqIGRldGVjdGlvbiBmcm9tIHdpdGhpbiBjaGFuZ2UgZGV0ZWN0aW9uIGxlYWRpbmcgdG9cbiAgICogaW5jb3JyZWN0IGJlaGF2aW9yLlxuICAgKlxuICAgKiBGb3IgZGV0YWlsLCBwbGVhc2UgcmVmZXIgaGVyZSxcbiAgICogaHR0cHM6Ly9naXRodWIuY29tL2FuZ3VsYXIvYW5ndWxhci9wdWxsLzQwNTQwXG4gICAqL1xuICBpc0NoZWNrU3RhYmxlUnVubmluZzogYm9vbGVhbjtcbiAgaXNTdGFibGU6IGJvb2xlYW47XG4gIC8qKlxuICAgKiBPcHRpb25hbGx5IHNwZWNpZnkgY29hbGVzY2luZyBldmVudCBjaGFuZ2UgZGV0ZWN0aW9ucyBvciBub3QuXG4gICAqIENvbnNpZGVyIHRoZSBmb2xsb3dpbmcgY2FzZS5cbiAgICpcbiAgICogPGRpdiAoY2xpY2spPVwiZG9Tb21ldGhpbmcoKVwiPlxuICAgKiAgIDxidXR0b24gKGNsaWNrKT1cImRvU29tZXRoaW5nRWxzZSgpXCI+PC9idXR0b24+XG4gICAqIDwvZGl2PlxuICAgKlxuICAgKiBXaGVuIGJ1dHRvbiBpcyBjbGlja2VkLCBiZWNhdXNlIG9mIHRoZSBldmVudCBidWJibGluZywgYm90aFxuICAgKiBldmVudCBoYW5kbGVycyB3aWxsIGJlIGNhbGxlZCBhbmQgMiBjaGFuZ2UgZGV0ZWN0aW9ucyB3aWxsIGJlXG4gICAqIHRyaWdnZXJlZC4gV2UgY2FuIGNvYWxlc2NlIHN1Y2gga2luZCBvZiBldmVudHMgdG8gdHJpZ2dlclxuICAgKiBjaGFuZ2UgZGV0ZWN0aW9uIG9ubHkgb25jZS5cbiAgICpcbiAgICogQnkgZGVmYXVsdCwgdGhpcyBvcHRpb24gd2lsbCBiZSBmYWxzZS4gU28gdGhlIGV2ZW50cyB3aWxsIG5vdCBiZVxuICAgKiBjb2FsZXNjZWQgYW5kIHRoZSBjaGFuZ2UgZGV0ZWN0aW9uIHdpbGwgYmUgdHJpZ2dlcmVkIG11bHRpcGxlIHRpbWVzLlxuICAgKiBBbmQgaWYgdGhpcyBvcHRpb24gYmUgc2V0IHRvIHRydWUsIHRoZSBjaGFuZ2UgZGV0ZWN0aW9uIHdpbGwgYmVcbiAgICogdHJpZ2dlcmVkIGFzeW5jIGJ5IHNjaGVkdWxpbmcgaXQgaW4gYW4gYW5pbWF0aW9uIGZyYW1lLiBTbyBpbiB0aGUgY2FzZSBhYm92ZSxcbiAgICogdGhlIGNoYW5nZSBkZXRlY3Rpb24gd2lsbCBvbmx5IGJlIHRyaWdnZWQgb25jZS5cbiAgICovXG4gIHNob3VsZENvYWxlc2NlRXZlbnRDaGFuZ2VEZXRlY3Rpb246IGJvb2xlYW47XG4gIC8qKlxuICAgKiBPcHRpb25hbGx5IHNwZWNpZnkgaWYgYE5nWm9uZSNydW4oKWAgbWV0aG9kIGludm9jYXRpb25zIHNob3VsZCBiZSBjb2FsZXNjZWRcbiAgICogaW50byBhIHNpbmdsZSBjaGFuZ2UgZGV0ZWN0aW9uLlxuICAgKlxuICAgKiBDb25zaWRlciB0aGUgZm9sbG93aW5nIGNhc2UuXG4gICAqXG4gICAqIGZvciAobGV0IGkgPSAwOyBpIDwgMTA7IGkgKyspIHtcbiAgICogICBuZ1pvbmUucnVuKCgpID0+IHtcbiAgICogICAgIC8vIGRvIHNvbWV0aGluZ1xuICAgKiAgIH0pO1xuICAgKiB9XG4gICAqXG4gICAqIFRoaXMgY2FzZSB0cmlnZ2VycyB0aGUgY2hhbmdlIGRldGVjdGlvbiBtdWx0aXBsZSB0aW1lcy5cbiAgICogV2l0aCBuZ1pvbmVSdW5Db2FsZXNjaW5nIG9wdGlvbnMsIGFsbCBjaGFuZ2UgZGV0ZWN0aW9ucyBpbiBhbiBldmVudCBsb29wcyB0cmlnZ2VyIG9ubHkgb25jZS5cbiAgICogSW4gYWRkaXRpb24sIHRoZSBjaGFuZ2UgZGV0ZWN0aW9uIGV4ZWN1dGVzIGluIHJlcXVlc3RBbmltYXRpb24uXG4gICAqXG4gICAqL1xuICBzaG91bGRDb2FsZXNjZVJ1bkNoYW5nZURldGVjdGlvbjogYm9vbGVhbjtcblxuICAvKipcbiAgICogV2hldGhlciB0byBzY2hlZHVsZSB0aGUgY29hbGVzY2VkIGNoYW5nZSBkZXRlY3Rpb24gaW4gdGhlIHJvb3Qgem9uZVxuICAgKi9cbiAgc2NoZWR1bGVJblJvb3Rab25lOiBib29sZWFuO1xufVxuXG5mdW5jdGlvbiBjaGVja1N0YWJsZSh6b25lOiBOZ1pvbmVQcml2YXRlKSB7XG4gIC8vIFRPRE86IEBKaWFMaVBhc3Npb24sIHNob3VsZCBjaGVjayB6b25lLmlzQ2hlY2tTdGFibGVSdW5uaW5nIHRvIHByZXZlbnRcbiAgLy8gcmUtZW50cnkuIFRoZSBjYXNlIGlzOlxuICAvL1xuICAvLyBAQ29tcG9uZW50KHsuLi59KVxuICAvLyBleHBvcnQgY2xhc3MgQXBwQ29tcG9uZW50IHtcbiAgLy8gY29uc3RydWN0b3IocHJpdmF0ZSBuZ1pvbmU6IE5nWm9uZSkge1xuICAvLyAgIHRoaXMubmdab25lLm9uU3RhYmxlLnN1YnNjcmliZSgoKSA9PiB7XG4gIC8vICAgICB0aGlzLm5nWm9uZS5ydW4oKCkgPT4gY29uc29sZS5sb2coJ3N0YWJsZScpOyk7XG4gIC8vICAgfSk7XG4gIC8vIH1cbiAgLy9cbiAgLy8gVGhlIG9uU3RhYmxlIHN1YnNjcmliZXIgcnVuIGFub3RoZXIgZnVuY3Rpb24gaW5zaWRlIG5nWm9uZVxuICAvLyB3aGljaCBjYXVzZXMgYGNoZWNrU3RhYmxlKClgIHJlLWVudHJ5LlxuICAvLyBCdXQgdGhpcyBmaXggY2F1c2VzIHNvbWUgaXNzdWVzIGluIGczLCBzbyB0aGlzIGZpeCB3aWxsIGJlXG4gIC8vIGxhdW5jaGVkIGluIGFub3RoZXIgUFIuXG4gIGlmICh6b25lLl9uZXN0aW5nID09IDAgJiYgIXpvbmUuaGFzUGVuZGluZ01pY3JvdGFza3MgJiYgIXpvbmUuaXNTdGFibGUpIHtcbiAgICB0cnkge1xuICAgICAgem9uZS5fbmVzdGluZysrO1xuICAgICAgem9uZS5vbk1pY3JvdGFza0VtcHR5LmVtaXQobnVsbCk7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIHpvbmUuX25lc3RpbmctLTtcbiAgICAgIGlmICghem9uZS5oYXNQZW5kaW5nTWljcm90YXNrcykge1xuICAgICAgICB0cnkge1xuICAgICAgICAgIHpvbmUucnVuT3V0c2lkZUFuZ3VsYXIoKCkgPT4gem9uZS5vblN0YWJsZS5lbWl0KG51bGwpKTtcbiAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICB6b25lLmlzU3RhYmxlID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBkZWxheUNoYW5nZURldGVjdGlvbkZvckV2ZW50cyh6b25lOiBOZ1pvbmVQcml2YXRlKSB7XG4gIC8qKlxuICAgKiBXZSBhbHNvIG5lZWQgdG8gY2hlY2sgX25lc3RpbmcgaGVyZVxuICAgKiBDb25zaWRlciB0aGUgZm9sbG93aW5nIGNhc2Ugd2l0aCBzaG91bGRDb2FsZXNjZVJ1bkNoYW5nZURldGVjdGlvbiA9IHRydWVcbiAgICpcbiAgICogbmdab25lLnJ1bigoKSA9PiB7fSk7XG4gICAqIG5nWm9uZS5ydW4oKCkgPT4ge30pO1xuICAgKlxuICAgKiBXZSB3YW50IHRoZSB0d28gYG5nWm9uZS5ydW4oKWAgb25seSB0cmlnZ2VyIG9uZSBjaGFuZ2UgZGV0ZWN0aW9uXG4gICAqIHdoZW4gc2hvdWxkQ29hbGVzY2VSdW5DaGFuZ2VEZXRlY3Rpb24gaXMgdHJ1ZS5cbiAgICogQW5kIGJlY2F1c2UgaW4gdGhpcyBjYXNlLCBjaGFuZ2UgZGV0ZWN0aW9uIHJ1biBpbiBhc3luYyB3YXkocmVxdWVzdEFuaW1hdGlvbkZyYW1lKSxcbiAgICogc28gd2UgYWxzbyBuZWVkIHRvIGNoZWNrIHRoZSBfbmVzdGluZyBoZXJlIHRvIHByZXZlbnQgbXVsdGlwbGVcbiAgICogY2hhbmdlIGRldGVjdGlvbnMuXG4gICAqL1xuICBpZiAoem9uZS5pc0NoZWNrU3RhYmxlUnVubmluZyB8fCB6b25lLmNhbGxiYWNrU2NoZWR1bGVkKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIHpvbmUuY2FsbGJhY2tTY2hlZHVsZWQgPSB0cnVlO1xuICBmdW5jdGlvbiBzY2hlZHVsZUNoZWNrU3RhYmxlKCkge1xuICAgIHNjaGVkdWxlQ2FsbGJhY2tXaXRoUmFmUmFjZSgoKSA9PiB7XG4gICAgICB6b25lLmNhbGxiYWNrU2NoZWR1bGVkID0gZmFsc2U7XG4gICAgICB1cGRhdGVNaWNyb1Rhc2tTdGF0dXMoem9uZSk7XG4gICAgICB6b25lLmlzQ2hlY2tTdGFibGVSdW5uaW5nID0gdHJ1ZTtcbiAgICAgIGNoZWNrU3RhYmxlKHpvbmUpO1xuICAgICAgem9uZS5pc0NoZWNrU3RhYmxlUnVubmluZyA9IGZhbHNlO1xuICAgIH0pO1xuICB9XG4gIGlmICh6b25lLnNjaGVkdWxlSW5Sb290Wm9uZSkge1xuICAgIFpvbmUucm9vdC5ydW4oKCkgPT4ge1xuICAgICAgc2NoZWR1bGVDaGVja1N0YWJsZSgpO1xuICAgIH0pO1xuICB9IGVsc2Uge1xuICAgIHpvbmUuX291dGVyLnJ1bigoKSA9PiB7XG4gICAgICBzY2hlZHVsZUNoZWNrU3RhYmxlKCk7XG4gICAgfSk7XG4gIH1cbiAgdXBkYXRlTWljcm9UYXNrU3RhdHVzKHpvbmUpO1xufVxuXG5mdW5jdGlvbiBmb3JrSW5uZXJab25lV2l0aEFuZ3VsYXJCZWhhdmlvcih6b25lOiBOZ1pvbmVQcml2YXRlKSB7XG4gIGNvbnN0IGRlbGF5Q2hhbmdlRGV0ZWN0aW9uRm9yRXZlbnRzRGVsZWdhdGUgPSAoKSA9PiB7XG4gICAgZGVsYXlDaGFuZ2VEZXRlY3Rpb25Gb3JFdmVudHMoem9uZSk7XG4gIH07XG4gIGNvbnN0IGluc3RhbmNlSWQgPSBuZ1pvbmVJbnN0YW5jZUlkKys7XG4gIHpvbmUuX2lubmVyID0gem9uZS5faW5uZXIuZm9yayh7XG4gICAgbmFtZTogJ2FuZ3VsYXInLFxuICAgIHByb3BlcnRpZXM6IDxhbnk+e1xuICAgICAgW2lzQW5ndWxhclpvbmVQcm9wZXJ0eV06IHRydWUsXG4gICAgICBbYW5ndWxhclpvbmVJbnN0YW5jZUlkUHJvcGVydHldOiBpbnN0YW5jZUlkLFxuICAgICAgW2FuZ3VsYXJab25lSW5zdGFuY2VJZFByb3BlcnR5ICsgaW5zdGFuY2VJZF06IHRydWUsXG4gICAgfSxcbiAgICBvbkludm9rZVRhc2s6IChcbiAgICAgIGRlbGVnYXRlOiBab25lRGVsZWdhdGUsXG4gICAgICBjdXJyZW50OiBab25lLFxuICAgICAgdGFyZ2V0OiBab25lLFxuICAgICAgdGFzazogVGFzayxcbiAgICAgIGFwcGx5VGhpczogYW55LFxuICAgICAgYXBwbHlBcmdzOiBhbnksXG4gICAgKTogYW55ID0+IHtcbiAgICAgIC8vIFByZXZlbnQgdHJpZ2dlcmluZyBjaGFuZ2UgZGV0ZWN0aW9uIHdoZW4gdGhlIGZsYWcgaXMgZGV0ZWN0ZWQuXG4gICAgICBpZiAoc2hvdWxkQmVJZ25vcmVkQnlab25lKGFwcGx5QXJncykpIHtcbiAgICAgICAgcmV0dXJuIGRlbGVnYXRlLmludm9rZVRhc2sodGFyZ2V0LCB0YXNrLCBhcHBseVRoaXMsIGFwcGx5QXJncyk7XG4gICAgICB9XG5cbiAgICAgIHRyeSB7XG4gICAgICAgIG9uRW50ZXIoem9uZSk7XG4gICAgICAgIHJldHVybiBkZWxlZ2F0ZS5pbnZva2VUYXNrKHRhcmdldCwgdGFzaywgYXBwbHlUaGlzLCBhcHBseUFyZ3MpO1xuICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgaWYgKFxuICAgICAgICAgICh6b25lLnNob3VsZENvYWxlc2NlRXZlbnRDaGFuZ2VEZXRlY3Rpb24gJiYgdGFzay50eXBlID09PSAnZXZlbnRUYXNrJykgfHxcbiAgICAgICAgICB6b25lLnNob3VsZENvYWxlc2NlUnVuQ2hhbmdlRGV0ZWN0aW9uXG4gICAgICAgICkge1xuICAgICAgICAgIGRlbGF5Q2hhbmdlRGV0ZWN0aW9uRm9yRXZlbnRzRGVsZWdhdGUoKTtcbiAgICAgICAgfVxuICAgICAgICBvbkxlYXZlKHpvbmUpO1xuICAgICAgfVxuICAgIH0sXG5cbiAgICBvbkludm9rZTogKFxuICAgICAgZGVsZWdhdGU6IFpvbmVEZWxlZ2F0ZSxcbiAgICAgIGN1cnJlbnQ6IFpvbmUsXG4gICAgICB0YXJnZXQ6IFpvbmUsXG4gICAgICBjYWxsYmFjazogRnVuY3Rpb24sXG4gICAgICBhcHBseVRoaXM6IGFueSxcbiAgICAgIGFwcGx5QXJncz86IGFueVtdLFxuICAgICAgc291cmNlPzogc3RyaW5nLFxuICAgICk6IGFueSA9PiB7XG4gICAgICB0cnkge1xuICAgICAgICBvbkVudGVyKHpvbmUpO1xuICAgICAgICByZXR1cm4gZGVsZWdhdGUuaW52b2tlKHRhcmdldCwgY2FsbGJhY2ssIGFwcGx5VGhpcywgYXBwbHlBcmdzLCBzb3VyY2UpO1xuICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgaWYgKFxuICAgICAgICAgIHpvbmUuc2hvdWxkQ29hbGVzY2VSdW5DaGFuZ2VEZXRlY3Rpb24gJiZcbiAgICAgICAgICAvLyBEbyBub3QgZGVsYXkgY2hhbmdlIGRldGVjdGlvbiB3aGVuIHRoZSB0YXNrIGlzIHRoZSBzY2hlZHVsZXIncyB0aWNrLlxuICAgICAgICAgIC8vIFdlIG5lZWQgdG8gc3luY2hyb25vdXNseSB0cmlnZ2VyIHRoZSBzdGFiaWxpdHkgbG9naWMgc28gdGhhdCB0aGVcbiAgICAgICAgICAvLyB6b25lLWJhc2VkIHNjaGVkdWxlciBjYW4gcHJldmVudCBhIGR1cGxpY2F0ZSBBcHBsaWNhdGlvblJlZi50aWNrXG4gICAgICAgICAgLy8gYnkgZmlyc3QgY2hlY2tpbmcgaWYgdGhlIHNjaGVkdWxlciB0aWNrIGlzIHJ1bm5pbmcuIFRoaXMgZG9lcyBzZWVtIGEgYml0IHJvdW5kYWJvdXQsXG4gICAgICAgICAgLy8gYnV0IHdlIF9kb18gc3RpbGwgd2FudCB0byB0cmlnZ2VyIGFsbCB0aGUgY29ycmVjdCBldmVudHMgd2hlbiB3ZSBleGl0IHRoZSB6b25lLnJ1blxuICAgICAgICAgIC8vIChgb25NaWNyb3Rhc2tFbXB0eWAgYW5kIGBvblN0YWJsZWAgX3Nob3VsZF8gZW1pdDsgZGV2ZWxvcGVycyBjYW4gaGF2ZSBjb2RlIHdoaWNoXG4gICAgICAgICAgLy8gcmVsaWVzIG9uIHRoZXNlIGV2ZW50cyBoYXBwZW5pbmcgYWZ0ZXIgY2hhbmdlIGRldGVjdGlvbiBydW5zKS5cbiAgICAgICAgICAvLyBOb3RlOiBgem9uZS5jYWxsYmFja1NjaGVkdWxlZGAgaXMgYWxyZWFkeSBpbiBkZWxheUNoYW5nZURldGVjdGlvbkZvckV2ZW50c0RlbGVnYXRlXG4gICAgICAgICAgLy8gYnV0IGlzIGFkZGVkIGhlcmUgYXMgd2VsbCB0byBwcmV2ZW50IHJlYWRzIG9mIGFwcGx5QXJncyB3aGVuIG5vdCBuZWNlc3NhcnlcbiAgICAgICAgICAhem9uZS5jYWxsYmFja1NjaGVkdWxlZCAmJlxuICAgICAgICAgICFpc1NjaGVkdWxlclRpY2soYXBwbHlBcmdzKVxuICAgICAgICApIHtcbiAgICAgICAgICBkZWxheUNoYW5nZURldGVjdGlvbkZvckV2ZW50c0RlbGVnYXRlKCk7XG4gICAgICAgIH1cbiAgICAgICAgb25MZWF2ZSh6b25lKTtcbiAgICAgIH1cbiAgICB9LFxuXG4gICAgb25IYXNUYXNrOiAoXG4gICAgICBkZWxlZ2F0ZTogWm9uZURlbGVnYXRlLFxuICAgICAgY3VycmVudDogWm9uZSxcbiAgICAgIHRhcmdldDogWm9uZSxcbiAgICAgIGhhc1Rhc2tTdGF0ZTogSGFzVGFza1N0YXRlLFxuICAgICkgPT4ge1xuICAgICAgZGVsZWdhdGUuaGFzVGFzayh0YXJnZXQsIGhhc1Rhc2tTdGF0ZSk7XG4gICAgICBpZiAoY3VycmVudCA9PT0gdGFyZ2V0KSB7XG4gICAgICAgIC8vIFdlIGFyZSBvbmx5IGludGVyZXN0ZWQgaW4gaGFzVGFzayBldmVudHMgd2hpY2ggb3JpZ2luYXRlIGZyb20gb3VyIHpvbmVcbiAgICAgICAgLy8gKEEgY2hpbGQgaGFzVGFzayBldmVudCBpcyBub3QgaW50ZXJlc3RpbmcgdG8gdXMpXG4gICAgICAgIGlmIChoYXNUYXNrU3RhdGUuY2hhbmdlID09ICdtaWNyb1Rhc2snKSB7XG4gICAgICAgICAgem9uZS5faGFzUGVuZGluZ01pY3JvdGFza3MgPSBoYXNUYXNrU3RhdGUubWljcm9UYXNrO1xuICAgICAgICAgIHVwZGF0ZU1pY3JvVGFza1N0YXR1cyh6b25lKTtcbiAgICAgICAgICBjaGVja1N0YWJsZSh6b25lKTtcbiAgICAgICAgfSBlbHNlIGlmIChoYXNUYXNrU3RhdGUuY2hhbmdlID09ICdtYWNyb1Rhc2snKSB7XG4gICAgICAgICAgem9uZS5oYXNQZW5kaW5nTWFjcm90YXNrcyA9IGhhc1Rhc2tTdGF0ZS5tYWNyb1Rhc2s7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9LFxuXG4gICAgb25IYW5kbGVFcnJvcjogKGRlbGVnYXRlOiBab25lRGVsZWdhdGUsIGN1cnJlbnQ6IFpvbmUsIHRhcmdldDogWm9uZSwgZXJyb3I6IGFueSk6IGJvb2xlYW4gPT4ge1xuICAgICAgZGVsZWdhdGUuaGFuZGxlRXJyb3IodGFyZ2V0LCBlcnJvcik7XG4gICAgICB6b25lLnJ1bk91dHNpZGVBbmd1bGFyKCgpID0+IHpvbmUub25FcnJvci5lbWl0KGVycm9yKSk7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSxcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIHVwZGF0ZU1pY3JvVGFza1N0YXR1cyh6b25lOiBOZ1pvbmVQcml2YXRlKSB7XG4gIGlmIChcbiAgICB6b25lLl9oYXNQZW5kaW5nTWljcm90YXNrcyB8fFxuICAgICgoem9uZS5zaG91bGRDb2FsZXNjZUV2ZW50Q2hhbmdlRGV0ZWN0aW9uIHx8IHpvbmUuc2hvdWxkQ29hbGVzY2VSdW5DaGFuZ2VEZXRlY3Rpb24pICYmXG4gICAgICB6b25lLmNhbGxiYWNrU2NoZWR1bGVkID09PSB0cnVlKVxuICApIHtcbiAgICB6b25lLmhhc1BlbmRpbmdNaWNyb3Rhc2tzID0gdHJ1ZTtcbiAgfSBlbHNlIHtcbiAgICB6b25lLmhhc1BlbmRpbmdNaWNyb3Rhc2tzID0gZmFsc2U7XG4gIH1cbn1cblxuZnVuY3Rpb24gb25FbnRlcih6b25lOiBOZ1pvbmVQcml2YXRlKSB7XG4gIHpvbmUuX25lc3RpbmcrKztcbiAgaWYgKHpvbmUuaXNTdGFibGUpIHtcbiAgICB6b25lLmlzU3RhYmxlID0gZmFsc2U7XG4gICAgem9uZS5vblVuc3RhYmxlLmVtaXQobnVsbCk7XG4gIH1cbn1cblxuZnVuY3Rpb24gb25MZWF2ZSh6b25lOiBOZ1pvbmVQcml2YXRlKSB7XG4gIHpvbmUuX25lc3RpbmctLTtcbiAgY2hlY2tTdGFibGUoem9uZSk7XG59XG5cbi8qKlxuICogUHJvdmlkZXMgYSBub29wIGltcGxlbWVudGF0aW9uIG9mIGBOZ1pvbmVgIHdoaWNoIGRvZXMgbm90aGluZy4gVGhpcyB6b25lIHJlcXVpcmVzIGV4cGxpY2l0IGNhbGxzXG4gKiB0byBmcmFtZXdvcmsgdG8gcGVyZm9ybSByZW5kZXJpbmcuXG4gKi9cbmV4cG9ydCBjbGFzcyBOb29wTmdab25lIGltcGxlbWVudHMgTmdab25lIHtcbiAgcmVhZG9ubHkgaGFzUGVuZGluZ01pY3JvdGFza3MgPSBmYWxzZTtcbiAgcmVhZG9ubHkgaGFzUGVuZGluZ01hY3JvdGFza3MgPSBmYWxzZTtcbiAgcmVhZG9ubHkgaXNTdGFibGUgPSB0cnVlO1xuICByZWFkb25seSBvblVuc3RhYmxlID0gbmV3IEV2ZW50RW1pdHRlcjxhbnk+KCk7XG4gIHJlYWRvbmx5IG9uTWljcm90YXNrRW1wdHkgPSBuZXcgRXZlbnRFbWl0dGVyPGFueT4oKTtcbiAgcmVhZG9ubHkgb25TdGFibGUgPSBuZXcgRXZlbnRFbWl0dGVyPGFueT4oKTtcbiAgcmVhZG9ubHkgb25FcnJvciA9IG5ldyBFdmVudEVtaXR0ZXI8YW55PigpO1xuXG4gIHJ1bjxUPihmbjogKC4uLmFyZ3M6IGFueVtdKSA9PiBULCBhcHBseVRoaXM/OiBhbnksIGFwcGx5QXJncz86IGFueSk6IFQge1xuICAgIHJldHVybiBmbi5hcHBseShhcHBseVRoaXMsIGFwcGx5QXJncyk7XG4gIH1cblxuICBydW5HdWFyZGVkPFQ+KGZuOiAoLi4uYXJnczogYW55W10pID0+IGFueSwgYXBwbHlUaGlzPzogYW55LCBhcHBseUFyZ3M/OiBhbnkpOiBUIHtcbiAgICByZXR1cm4gZm4uYXBwbHkoYXBwbHlUaGlzLCBhcHBseUFyZ3MpO1xuICB9XG5cbiAgcnVuT3V0c2lkZUFuZ3VsYXI8VD4oZm46ICguLi5hcmdzOiBhbnlbXSkgPT4gVCk6IFQge1xuICAgIHJldHVybiBmbigpO1xuICB9XG5cbiAgcnVuVGFzazxUPihmbjogKC4uLmFyZ3M6IGFueVtdKSA9PiBULCBhcHBseVRoaXM/OiBhbnksIGFwcGx5QXJncz86IGFueSwgbmFtZT86IHN0cmluZyk6IFQge1xuICAgIHJldHVybiBmbi5hcHBseShhcHBseVRoaXMsIGFwcGx5QXJncyk7XG4gIH1cbn1cblxuZnVuY3Rpb24gc2hvdWxkQmVJZ25vcmVkQnlab25lKGFwcGx5QXJnczogdW5rbm93bik6IGJvb2xlYW4ge1xuICByZXR1cm4gaGFzQXBwbHlBcmdzRGF0YShhcHBseUFyZ3MsICdfX2lnbm9yZV9uZ196b25lX18nKTtcbn1cblxuZnVuY3Rpb24gaXNTY2hlZHVsZXJUaWNrKGFwcGx5QXJnczogdW5rbm93bik6IGJvb2xlYW4ge1xuICByZXR1cm4gaGFzQXBwbHlBcmdzRGF0YShhcHBseUFyZ3MsICdfX3NjaGVkdWxlcl90aWNrX18nKTtcbn1cblxuZnVuY3Rpb24gaGFzQXBwbHlBcmdzRGF0YShhcHBseUFyZ3M6IHVua25vd24sIGtleTogc3RyaW5nKSB7XG4gIGlmICghQXJyYXkuaXNBcnJheShhcHBseUFyZ3MpKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgLy8gV2Ugc2hvdWxkIG9ubHkgZXZlciBnZXQgMSBhcmcgcGFzc2VkIHRocm91Z2ggdG8gaW52b2tlVGFzay5cbiAgLy8gU2hvcnQgY2lyY3VpdCBoZXJlIGluY2FzZSB0aGF0IGJlaGF2aW9yIGNoYW5nZXMuXG4gIGlmIChhcHBseUFyZ3MubGVuZ3RoICE9PSAxKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgcmV0dXJuIGFwcGx5QXJnc1swXT8uZGF0YT8uW2tleV0gPT09IHRydWU7XG59XG5cbi8vIFNldCBvZiBvcHRpb25zIHJlY29nbml6ZWQgYnkgdGhlIE5nWm9uZS5cbmV4cG9ydCBpbnRlcmZhY2UgSW50ZXJuYWxOZ1pvbmVPcHRpb25zIHtcbiAgZW5hYmxlTG9uZ1N0YWNrVHJhY2U/OiBib29sZWFuO1xuICBzaG91bGRDb2FsZXNjZUV2ZW50Q2hhbmdlRGV0ZWN0aW9uPzogYm9vbGVhbjtcbiAgc2hvdWxkQ29hbGVzY2VSdW5DaGFuZ2VEZXRlY3Rpb24/OiBib29sZWFuO1xuICBzY2hlZHVsZUluUm9vdFpvbmU/OiBib29sZWFuO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0Tmdab25lKFxuICBuZ1pvbmVUb1VzZTogTmdab25lIHwgJ3pvbmUuanMnIHwgJ25vb3AnID0gJ3pvbmUuanMnLFxuICBvcHRpb25zOiBJbnRlcm5hbE5nWm9uZU9wdGlvbnMsXG4pOiBOZ1pvbmUge1xuICBpZiAobmdab25lVG9Vc2UgPT09ICdub29wJykge1xuICAgIHJldHVybiBuZXcgTm9vcE5nWm9uZSgpO1xuICB9XG4gIGlmIChuZ1pvbmVUb1VzZSA9PT0gJ3pvbmUuanMnKSB7XG4gICAgcmV0dXJuIG5ldyBOZ1pvbmUob3B0aW9ucyk7XG4gIH1cbiAgcmV0dXJuIG5nWm9uZVRvVXNlO1xufVxuIl19