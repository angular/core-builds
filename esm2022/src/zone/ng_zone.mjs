/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { RuntimeError } from '../errors';
import { EventEmitter } from '../event_emitter';
import { scheduleCallbackWithRafRace } from '../util/callback_scheduler';
import { global } from '../util/global';
import { noop } from '../util/noop';
import { AsyncStackTaggingZoneSpec } from './async-stack-tagging';
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
    constructor({ enableLongStackTrace = false, shouldCoalesceEventChangeDetection = false, shouldCoalesceRunChangeDetection = false, }) {
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
        self.scheduleCallback = scheduleCallbackWithRafRace;
        forkInnerZoneWithAngularBehavior(self);
    }
    /**
      This method checks whether the method call happens within an Angular Zone instance.
    */
    static isInAngularZone() {
        // Zone needs to be checked, because this method might be called even when NoopNgZone is used.
        return typeof Zone !== 'undefined' && Zone.current.get('isAngularZone') === true;
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
    zone.scheduleCallback.call(global, () => {
        // This is a work around for https://github.com/angular/angular/issues/36839.
        // The core issue is that when event coalescing is enabled it is possible for microtasks
        // to get flushed too early (As is the case with `Promise.then`) between the
        // coalescing eventTasks.
        //
        // To workaround this we schedule a "fake" eventTask before we process the
        // coalescing eventTasks. The benefit of this is that the "fake" container eventTask
        //  will prevent the microtasks queue from getting drained in between the coalescing
        // eventTask execution.
        if (!zone.fakeTopEventTask) {
            zone.fakeTopEventTask = Zone.root.scheduleEventTask('fakeTopEventTask', () => {
                zone.callbackScheduled = false;
                updateMicroTaskStatus(zone);
                zone.isCheckStableRunning = true;
                checkStable(zone);
                zone.isCheckStableRunning = false;
            }, undefined, () => { }, () => { });
        }
        zone.fakeTopEventTask.invoke();
    });
    updateMicroTaskStatus(zone);
}
function forkInnerZoneWithAngularBehavior(zone) {
    const delayChangeDetectionForEventsDelegate = () => {
        delayChangeDetectionForEvents(zone);
    };
    zone._inner = zone._inner.fork({
        name: 'angular',
        properties: { 'isAngularZone': true },
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmdfem9uZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3pvbmUvbmdfem9uZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQUMsWUFBWSxFQUFtQixNQUFNLFdBQVcsQ0FBQztBQUN6RCxPQUFPLEVBQUMsWUFBWSxFQUFDLE1BQU0sa0JBQWtCLENBQUM7QUFDOUMsT0FBTyxFQUFDLDJCQUEyQixFQUFDLE1BQU0sNEJBQTRCLENBQUM7QUFDdkUsT0FBTyxFQUFDLE1BQU0sRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBQ3RDLE9BQU8sRUFBQyxJQUFJLEVBQUMsTUFBTSxjQUFjLENBQUM7QUFFbEMsT0FBTyxFQUFDLHlCQUF5QixFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFNaEU7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7R0F5RUc7QUFDSCxNQUFNLE9BQU8sTUFBTTtJQWlDakIsWUFBWSxFQUNWLG9CQUFvQixHQUFHLEtBQUssRUFDNUIsa0NBQWtDLEdBQUcsS0FBSyxFQUMxQyxnQ0FBZ0MsR0FBRyxLQUFLLEdBQ3pDO1FBcENRLHlCQUFvQixHQUFZLEtBQUssQ0FBQztRQUN0Qyx5QkFBb0IsR0FBWSxLQUFLLENBQUM7UUFFL0M7O1dBRUc7UUFDTSxhQUFRLEdBQVksSUFBSSxDQUFDO1FBRWxDOztXQUVHO1FBQ00sZUFBVSxHQUFzQixJQUFJLFlBQVksQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUVqRTs7OztXQUlHO1FBQ00scUJBQWdCLEdBQXNCLElBQUksWUFBWSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBRXZFOzs7O1dBSUc7UUFDTSxhQUFRLEdBQXNCLElBQUksWUFBWSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBRS9EOztXQUVHO1FBQ00sWUFBTyxH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RUFBRSxDQUFDLEtBQUssQ0FBQyxTQUFTLEVBQUUsU0FBUyxDQUFDLENBQUM7SUFDeEMsQ0FBQztDQUNGO0FBRUQsU0FBUyxxQkFBcUIsQ0FBQyxTQUFrQjtJQUMvQyxPQUFPLGdCQUFnQixDQUFDLFNBQVMsRUFBRSxvQkFBb0IsQ0FBQyxDQUFDO0FBQzNELENBQUM7QUFFRCxTQUFTLGVBQWUsQ0FBQyxTQUFrQjtJQUN6QyxPQUFPLGdCQUFnQixDQUFDLFNBQVMsRUFBRSxvQkFBb0IsQ0FBQyxDQUFDO0FBQzNELENBQUM7QUFFRCxTQUFTLGdCQUFnQixDQUFDLFNBQWtCLEVBQUUsR0FBVztJQUN2RCxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDO1FBQzlCLE9BQU8sS0FBSyxDQUFDO0lBQ2YsQ0FBQztJQUVELDhEQUE4RDtJQUM5RCxtREFBbUQ7SUFDbkQsSUFBSSxTQUFTLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRSxDQUFDO1FBQzNCLE9BQU8sS0FBSyxDQUFDO0lBQ2YsQ0FBQztJQUVELE9BQU8sU0FBUyxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksRUFBRSxDQUFDLEdBQUcsQ0FBQyxLQUFLLElBQUksQ0FBQztBQUM1QyxDQUFDO0FBU0QsTUFBTSxVQUFVLFNBQVMsQ0FDdkIsY0FBMkMsU0FBUyxFQUNwRCxPQUE4QjtJQUU5QixJQUFJLFdBQVcsS0FBSyxNQUFNLEVBQUUsQ0FBQztRQUMzQixPQUFPLElBQUksVUFBVSxFQUFFLENBQUM7SUFDMUIsQ0FBQztJQUNELElBQUksV0FBVyxLQUFLLFNBQVMsRUFBRSxDQUFDO1FBQzlCLE9BQU8sSUFBSSxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDN0IsQ0FBQztJQUNELE9BQU8sV0FBVyxDQUFDO0FBQ3JCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtSdW50aW1lRXJyb3IsIFJ1bnRpbWVFcnJvckNvZGV9IGZyb20gJy4uL2Vycm9ycyc7XG5pbXBvcnQge0V2ZW50RW1pdHRlcn0gZnJvbSAnLi4vZXZlbnRfZW1pdHRlcic7XG5pbXBvcnQge3NjaGVkdWxlQ2FsbGJhY2tXaXRoUmFmUmFjZX0gZnJvbSAnLi4vdXRpbC9jYWxsYmFja19zY2hlZHVsZXInO1xuaW1wb3J0IHtnbG9iYWx9IGZyb20gJy4uL3V0aWwvZ2xvYmFsJztcbmltcG9ydCB7bm9vcH0gZnJvbSAnLi4vdXRpbC9ub29wJztcblxuaW1wb3J0IHtBc3luY1N0YWNrVGFnZ2luZ1pvbmVTcGVjfSBmcm9tICcuL2FzeW5jLXN0YWNrLXRhZ2dpbmcnO1xuXG4vLyBUaGUgYmVsb3cgaXMgbmVlZGVkIGFzIG90aGVyd2lzZSBhIG51bWJlciBvZiB0YXJnZXRzIGZhaWwgaW4gRzMgZHVlIHRvOlxuLy8gRVJST1IgLSBbSlNDX1VOREVGSU5FRF9WQVJJQUJMRV0gdmFyaWFibGUgWm9uZSBpcyB1bmRlY2xhcmVkXG5kZWNsYXJlIGNvbnN0IFpvbmU6IGFueTtcblxuLyoqXG4gKiBBbiBpbmplY3RhYmxlIHNlcnZpY2UgZm9yIGV4ZWN1dGluZyB3b3JrIGluc2lkZSBvciBvdXRzaWRlIG9mIHRoZSBBbmd1bGFyIHpvbmUuXG4gKlxuICogVGhlIG1vc3QgY29tbW9uIHVzZSBvZiB0aGlzIHNlcnZpY2UgaXMgdG8gb3B0aW1pemUgcGVyZm9ybWFuY2Ugd2hlbiBzdGFydGluZyBhIHdvcmsgY29uc2lzdGluZyBvZlxuICogb25lIG9yIG1vcmUgYXN5bmNocm9ub3VzIHRhc2tzIHRoYXQgZG9uJ3QgcmVxdWlyZSBVSSB1cGRhdGVzIG9yIGVycm9yIGhhbmRsaW5nIHRvIGJlIGhhbmRsZWQgYnlcbiAqIEFuZ3VsYXIuIFN1Y2ggdGFza3MgY2FuIGJlIGtpY2tlZCBvZmYgdmlhIHtAbGluayAjcnVuT3V0c2lkZUFuZ3VsYXJ9IGFuZCBpZiBuZWVkZWQsIHRoZXNlIHRhc2tzXG4gKiBjYW4gcmVlbnRlciB0aGUgQW5ndWxhciB6b25lIHZpYSB7QGxpbmsgI3J1bn0uXG4gKlxuICogPCEtLSBUT0RPOiBhZGQvZml4IGxpbmtzIHRvOlxuICogICAtIGRvY3MgZXhwbGFpbmluZyB6b25lcyBhbmQgdGhlIHVzZSBvZiB6b25lcyBpbiBBbmd1bGFyIGFuZCBjaGFuZ2UtZGV0ZWN0aW9uXG4gKiAgIC0gbGluayB0byBydW5PdXRzaWRlQW5ndWxhci9ydW4gKHRocm91Z2hvdXQgdGhpcyBmaWxlISlcbiAqICAgLS0+XG4gKlxuICogQHVzYWdlTm90ZXNcbiAqICMjIyBFeGFtcGxlXG4gKlxuICogYGBgXG4gKiBpbXBvcnQge0NvbXBvbmVudCwgTmdab25lfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbiAqIGltcG9ydCB7TmdJZn0gZnJvbSAnQGFuZ3VsYXIvY29tbW9uJztcbiAqXG4gKiBAQ29tcG9uZW50KHtcbiAqICAgc2VsZWN0b3I6ICduZy16b25lLWRlbW8nLFxuICogICB0ZW1wbGF0ZTogYFxuICogICAgIDxoMj5EZW1vOiBOZ1pvbmU8L2gyPlxuICpcbiAqICAgICA8cD5Qcm9ncmVzczoge3twcm9ncmVzc319JTwvcD5cbiAqICAgICA8cCAqbmdJZj1cInByb2dyZXNzID49IDEwMFwiPkRvbmUgcHJvY2Vzc2luZyB7e2xhYmVsfX0gb2YgQW5ndWxhciB6b25lITwvcD5cbiAqXG4gKiAgICAgPGJ1dHRvbiAoY2xpY2spPVwicHJvY2Vzc1dpdGhpbkFuZ3VsYXJab25lKClcIj5Qcm9jZXNzIHdpdGhpbiBBbmd1bGFyIHpvbmU8L2J1dHRvbj5cbiAqICAgICA8YnV0dG9uIChjbGljayk9XCJwcm9jZXNzT3V0c2lkZU9mQW5ndWxhclpvbmUoKVwiPlByb2Nlc3Mgb3V0c2lkZSBvZiBBbmd1bGFyIHpvbmU8L2J1dHRvbj5cbiAqICAgYCxcbiAqIH0pXG4gKiBleHBvcnQgY2xhc3MgTmdab25lRGVtbyB7XG4gKiAgIHByb2dyZXNzOiBudW1iZXIgPSAwO1xuICogICBsYWJlbDogc3RyaW5nO1xuICpcbiAqICAgY29uc3RydWN0b3IocHJpdmF0ZSBfbmdab25lOiBOZ1pvbmUpIHt9XG4gKlxuICogICAvLyBMb29wIGluc2lkZSB0aGUgQW5ndWxhciB6b25lXG4gKiAgIC8vIHNvIHRoZSBVSSBET0VTIHJlZnJlc2ggYWZ0ZXIgZWFjaCBzZXRUaW1lb3V0IGN5Y2xlXG4gKiAgIHByb2Nlc3NXaXRoaW5Bbmd1bGFyWm9uZSgpIHtcbiAqICAgICB0aGlzLmxhYmVsID0gJ2luc2lkZSc7XG4gKiAgICAgdGhpcy5wcm9ncmVzcyA9IDA7XG4gKiAgICAgdGhpcy5faW5jcmVhc2VQcm9ncmVzcygoKSA9PiBjb25zb2xlLmxvZygnSW5zaWRlIERvbmUhJykpO1xuICogICB9XG4gKlxuICogICAvLyBMb29wIG91dHNpZGUgb2YgdGhlIEFuZ3VsYXIgem9uZVxuICogICAvLyBzbyB0aGUgVUkgRE9FUyBOT1QgcmVmcmVzaCBhZnRlciBlYWNoIHNldFRpbWVvdXQgY3ljbGVcbiAqICAgcHJvY2Vzc091dHNpZGVPZkFuZ3VsYXJab25lKCkge1xuICogICAgIHRoaXMubGFiZWwgPSAnb3V0c2lkZSc7XG4gKiAgICAgdGhpcy5wcm9ncmVzcyA9IDA7XG4gKiAgICAgdGhpcy5fbmdab25lLnJ1bk91dHNpZGVBbmd1bGFyKCgpID0+IHtcbiAqICAgICAgIHRoaXMuX2luY3JlYXNlUHJvZ3Jlc3MoKCkgPT4ge1xuICogICAgICAgICAvLyByZWVudGVyIHRoZSBBbmd1bGFyIHpvbmUgYW5kIGRpc3BsYXkgZG9uZVxuICogICAgICAgICB0aGlzLl9uZ1pvbmUucnVuKCgpID0+IHsgY29uc29sZS5sb2coJ091dHNpZGUgRG9uZSEnKTsgfSk7XG4gKiAgICAgICB9KTtcbiAqICAgICB9KTtcbiAqICAgfVxuICpcbiAqICAgX2luY3JlYXNlUHJvZ3Jlc3MoZG9uZUNhbGxiYWNrOiAoKSA9PiB2b2lkKSB7XG4gKiAgICAgdGhpcy5wcm9ncmVzcyArPSAxO1xuICogICAgIGNvbnNvbGUubG9nKGBDdXJyZW50IHByb2dyZXNzOiAke3RoaXMucHJvZ3Jlc3N9JWApO1xuICpcbiAqICAgICBpZiAodGhpcy5wcm9ncmVzcyA8IDEwMCkge1xuICogICAgICAgd2luZG93LnNldFRpbWVvdXQoKCkgPT4gdGhpcy5faW5jcmVhc2VQcm9ncmVzcyhkb25lQ2FsbGJhY2spLCAxMCk7XG4gKiAgICAgfSBlbHNlIHtcbiAqICAgICAgIGRvbmVDYWxsYmFjaygpO1xuICogICAgIH1cbiAqICAgfVxuICogfVxuICogYGBgXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgY2xhc3MgTmdab25lIHtcbiAgcmVhZG9ubHkgaGFzUGVuZGluZ01hY3JvdGFza3M6IGJvb2xlYW4gPSBmYWxzZTtcbiAgcmVhZG9ubHkgaGFzUGVuZGluZ01pY3JvdGFza3M6IGJvb2xlYW4gPSBmYWxzZTtcblxuICAvKipcbiAgICogV2hldGhlciB0aGVyZSBhcmUgbm8gb3V0c3RhbmRpbmcgbWljcm90YXNrcyBvciBtYWNyb3Rhc2tzLlxuICAgKi9cbiAgcmVhZG9ubHkgaXNTdGFibGU6IGJvb2xlYW4gPSB0cnVlO1xuXG4gIC8qKlxuICAgKiBOb3RpZmllcyB3aGVuIGNvZGUgZW50ZXJzIEFuZ3VsYXIgWm9uZS4gVGhpcyBnZXRzIGZpcmVkIGZpcnN0IG9uIFZNIFR1cm4uXG4gICAqL1xuICByZWFkb25seSBvblVuc3RhYmxlOiBFdmVudEVtaXR0ZXI8YW55PiA9IG5ldyBFdmVudEVtaXR0ZXIoZmFsc2UpO1xuXG4gIC8qKlxuICAgKiBOb3RpZmllcyB3aGVuIHRoZXJlIGlzIG5vIG1vcmUgbWljcm90YXNrcyBlbnF1ZXVlZCBpbiB0aGUgY3VycmVudCBWTSBUdXJuLlxuICAgKiBUaGlzIGlzIGEgaGludCBmb3IgQW5ndWxhciB0byBkbyBjaGFuZ2UgZGV0ZWN0aW9uLCB3aGljaCBtYXkgZW5xdWV1ZSBtb3JlIG1pY3JvdGFza3MuXG4gICAqIEZvciB0aGlzIHJlYXNvbiB0aGlzIGV2ZW50IGNhbiBmaXJlIG11bHRpcGxlIHRpbWVzIHBlciBWTSBUdXJuLlxuICAgKi9cbiAgcmVhZG9ubHkgb25NaWNyb3Rhc2tFbXB0eTogRXZlbnRFbWl0dGVyPGFueT4gPSBuZXcgRXZlbnRFbWl0dGVyKGZhbHNlKTtcblxuICAvKipcbiAgICogTm90aWZpZXMgd2hlbiB0aGUgbGFzdCBgb25NaWNyb3Rhc2tFbXB0eWAgaGFzIHJ1biBhbmQgdGhlcmUgYXJlIG5vIG1vcmUgbWljcm90YXNrcywgd2hpY2hcbiAgICogaW1wbGllcyB3ZSBhcmUgYWJvdXQgdG8gcmVsaW5xdWlzaCBWTSB0dXJuLlxuICAgKiBUaGlzIGV2ZW50IGdldHMgY2FsbGVkIGp1c3Qgb25jZS5cbiAgICovXG4gIHJlYWRvbmx5IG9uU3RhYmxlOiBFdmVudEVtaXR0ZXI8YW55PiA9IG5ldyBFdmVudEVtaXR0ZXIoZmFsc2UpO1xuXG4gIC8qKlxuICAgKiBOb3RpZmllcyB0aGF0IGFuIGVycm9yIGhhcyBiZWVuIGRlbGl2ZXJlZC5cbiAgICovXG4gIHJlYWRvbmx5IG9uRXJyb3I6IEV2ZW50RW1pdHRlcjxhbnk+ID0gbmV3IEV2ZW50RW1pdHRlcihmYWxzZSk7XG5cbiAgY29uc3RydWN0b3Ioe1xuICAgIGVuYWJsZUxvbmdTdGFja1RyYWNlID0gZmFsc2UsXG4gICAgc2hvdWxkQ29hbGVzY2VFdmVudENoYW5nZURldGVjdGlvbiA9IGZhbHNlLFxuICAgIHNob3VsZENvYWxlc2NlUnVuQ2hhbmdlRGV0ZWN0aW9uID0gZmFsc2UsXG4gIH0pIHtcbiAgICBpZiAodHlwZW9mIFpvbmUgPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIHRocm93IG5ldyBSdW50aW1lRXJyb3IoXG4gICAgICAgIFJ1bnRpbWVFcnJvckNvZGUuTUlTU0lOR19aT05FSlMsXG4gICAgICAgIG5nRGV2TW9kZSAmJiBgSW4gdGhpcyBjb25maWd1cmF0aW9uIEFuZ3VsYXIgcmVxdWlyZXMgWm9uZS5qc2AsXG4gICAgICApO1xuICAgIH1cblxuICAgIFpvbmUuYXNzZXJ0Wm9uZVBhdGNoZWQoKTtcbiAgICBjb25zdCBzZWxmID0gdGhpcyBhcyBhbnkgYXMgTmdab25lUHJpdmF0ZTtcbiAgICBzZWxmLl9uZXN0aW5nID0gMDtcblxuICAgIHNlbGYuX291dGVyID0gc2VsZi5faW5uZXIgPSBab25lLmN1cnJlbnQ7XG5cbiAgICAvLyBBc3luY1N0YWNrVGFnZ2luZ1pvbmVTcGVjIHByb3ZpZGVzIGBsaW5rZWQgc3RhY2sgdHJhY2VzYCB0byBzaG93XG4gICAgLy8gd2hlcmUgdGhlIGFzeW5jIG9wZXJhdGlvbiBpcyBzY2hlZHVsZWQuIEZvciBtb3JlIGRldGFpbHMsIHJlZmVyXG4gICAgLy8gdG8gdGhpcyBhcnRpY2xlLCBodHRwczovL2RldmVsb3Blci5jaHJvbWUuY29tL2Jsb2cvZGV2dG9vbHMtYmV0dGVyLWFuZ3VsYXItZGVidWdnaW5nL1xuICAgIC8vIEFuZCB3ZSBvbmx5IGltcG9ydCB0aGlzIEFzeW5jU3RhY2tUYWdnaW5nWm9uZVNwZWMgaW4gZGV2ZWxvcG1lbnQgbW9kZSxcbiAgICAvLyBpbiB0aGUgcHJvZHVjdGlvbiBtb2RlLCB0aGUgQXN5bmNTdGFja1RhZ2dpbmdab25lU3BlYyB3aWxsIGJlIHRyZWUgc2hha2VuIGF3YXkuXG4gICAgaWYgKG5nRGV2TW9kZSkge1xuICAgICAgc2VsZi5faW5uZXIgPSBzZWxmLl9pbm5lci5mb3JrKG5ldyBBc3luY1N0YWNrVGFnZ2luZ1pvbmVTcGVjKCdBbmd1bGFyJykpO1xuICAgIH1cblxuICAgIGlmICgoWm9uZSBhcyBhbnkpWydUYXNrVHJhY2tpbmdab25lU3BlYyddKSB7XG4gICAgICBzZWxmLl9pbm5lciA9IHNlbGYuX2lubmVyLmZvcmsobmV3ICgoWm9uZSBhcyBhbnkpWydUYXNrVHJhY2tpbmdab25lU3BlYyddIGFzIGFueSkoKSk7XG4gICAgfVxuXG4gICAgaWYgKGVuYWJsZUxvbmdTdGFja1RyYWNlICYmIChab25lIGFzIGFueSlbJ2xvbmdTdGFja1RyYWNlWm9uZVNwZWMnXSkge1xuICAgICAgc2VsZi5faW5uZXIgPSBzZWxmLl9pbm5lci5mb3JrKChab25lIGFzIGFueSlbJ2xvbmdTdGFja1RyYWNlWm9uZVNwZWMnXSk7XG4gICAgfVxuICAgIC8vIGlmIHNob3VsZENvYWxlc2NlUnVuQ2hhbmdlRGV0ZWN0aW9uIGlzIHRydWUsIGFsbCB0YXNrcyBpbmNsdWRpbmcgZXZlbnQgdGFza3Mgd2lsbCBiZVxuICAgIC8vIGNvYWxlc2NlZCwgc28gc2hvdWxkQ29hbGVzY2VFdmVudENoYW5nZURldGVjdGlvbiBvcHRpb24gaXMgbm90IG5lY2Vzc2FyeSBhbmQgY2FuIGJlIHNraXBwZWQuXG4gICAgc2VsZi5zaG91bGRDb2FsZXNjZUV2ZW50Q2hhbmdlRGV0ZWN0aW9uID1cbiAgICAgICFzaG91bGRDb2FsZXNjZVJ1bkNoYW5nZURldGVjdGlvbiAmJiBzaG91bGRDb2FsZXNjZUV2ZW50Q2hhbmdlRGV0ZWN0aW9uO1xuICAgIHNlbGYuc2hvdWxkQ29hbGVzY2VSdW5DaGFuZ2VEZXRlY3Rpb24gPSBzaG91bGRDb2FsZXNjZVJ1bkNoYW5nZURldGVjdGlvbjtcbiAgICBzZWxmLmNhbGxiYWNrU2NoZWR1bGVkID0gZmFsc2U7XG4gICAgc2VsZi5zY2hlZHVsZUNhbGxiYWNrID0gc2NoZWR1bGVDYWxsYmFja1dpdGhSYWZSYWNlO1xuICAgIGZvcmtJbm5lclpvbmVXaXRoQW5ndWxhckJlaGF2aW9yKHNlbGYpO1xuICB9XG5cbiAgLyoqXG4gICAgVGhpcyBtZXRob2QgY2hlY2tzIHdoZXRoZXIgdGhlIG1ldGhvZCBjYWxsIGhhcHBlbnMgd2l0aGluIGFuIEFuZ3VsYXIgWm9uZSBpbnN0YW5jZS5cbiAgKi9cbiAgc3RhdGljIGlzSW5Bbmd1bGFyWm9uZSgpOiBib29sZWFuIHtcbiAgICAvLyBab25lIG5lZWRzIHRvIGJlIGNoZWNrZWQsIGJlY2F1c2UgdGhpcyBtZXRob2QgbWlnaHQgYmUgY2FsbGVkIGV2ZW4gd2hlbiBOb29wTmdab25lIGlzIHVzZWQuXG4gICAgcmV0dXJuIHR5cGVvZiBab25lICE9PSAndW5kZWZpbmVkJyAmJiBab25lLmN1cnJlbnQuZ2V0KCdpc0FuZ3VsYXJab25lJykgPT09IHRydWU7XG4gIH1cblxuICAvKipcbiAgICBBc3N1cmVzIHRoYXQgdGhlIG1ldGhvZCBpcyBjYWxsZWQgd2l0aGluIHRoZSBBbmd1bGFyIFpvbmUsIG90aGVyd2lzZSB0aHJvd3MgYW4gZXJyb3IuXG4gICovXG4gIHN0YXRpYyBhc3NlcnRJbkFuZ3VsYXJab25lKCk6IHZvaWQge1xuICAgIGlmICghTmdab25lLmlzSW5Bbmd1bGFyWm9uZSgpKSB7XG4gICAgICB0aHJvdyBuZXcgUnVudGltZUVycm9yKFxuICAgICAgICBSdW50aW1lRXJyb3JDb2RlLlVORVhQRUNURURfWk9ORV9TVEFURSxcbiAgICAgICAgbmdEZXZNb2RlICYmICdFeHBlY3RlZCB0byBiZSBpbiBBbmd1bGFyIFpvbmUsIGJ1dCBpdCBpcyBub3QhJyxcbiAgICAgICk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAgQXNzdXJlcyB0aGF0IHRoZSBtZXRob2QgaXMgY2FsbGVkIG91dHNpZGUgb2YgdGhlIEFuZ3VsYXIgWm9uZSwgb3RoZXJ3aXNlIHRocm93cyBhbiBlcnJvci5cbiAgKi9cbiAgc3RhdGljIGFzc2VydE5vdEluQW5ndWxhclpvbmUoKTogdm9pZCB7XG4gICAgaWYgKE5nWm9uZS5pc0luQW5ndWxhclpvbmUoKSkge1xuICAgICAgdGhyb3cgbmV3IFJ1bnRpbWVFcnJvcihcbiAgICAgICAgUnVudGltZUVycm9yQ29kZS5VTkVYUEVDVEVEX1pPTkVfU1RBVEUsXG4gICAgICAgIG5nRGV2TW9kZSAmJiAnRXhwZWN0ZWQgdG8gbm90IGJlIGluIEFuZ3VsYXIgWm9uZSwgYnV0IGl0IGlzIScsXG4gICAgICApO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBFeGVjdXRlcyB0aGUgYGZuYCBmdW5jdGlvbiBzeW5jaHJvbm91c2x5IHdpdGhpbiB0aGUgQW5ndWxhciB6b25lIGFuZCByZXR1cm5zIHZhbHVlIHJldHVybmVkIGJ5XG4gICAqIHRoZSBmdW5jdGlvbi5cbiAgICpcbiAgICogUnVubmluZyBmdW5jdGlvbnMgdmlhIGBydW5gIGFsbG93cyB5b3UgdG8gcmVlbnRlciBBbmd1bGFyIHpvbmUgZnJvbSBhIHRhc2sgdGhhdCB3YXMgZXhlY3V0ZWRcbiAgICogb3V0c2lkZSBvZiB0aGUgQW5ndWxhciB6b25lICh0eXBpY2FsbHkgc3RhcnRlZCB2aWEge0BsaW5rICNydW5PdXRzaWRlQW5ndWxhcn0pLlxuICAgKlxuICAgKiBBbnkgZnV0dXJlIHRhc2tzIG9yIG1pY3JvdGFza3Mgc2NoZWR1bGVkIGZyb20gd2l0aGluIHRoaXMgZnVuY3Rpb24gd2lsbCBjb250aW51ZSBleGVjdXRpbmcgZnJvbVxuICAgKiB3aXRoaW4gdGhlIEFuZ3VsYXIgem9uZS5cbiAgICpcbiAgICogSWYgYSBzeW5jaHJvbm91cyBlcnJvciBoYXBwZW5zIGl0IHdpbGwgYmUgcmV0aHJvd24gYW5kIG5vdCByZXBvcnRlZCB2aWEgYG9uRXJyb3JgLlxuICAgKi9cbiAgcnVuPFQ+KGZuOiAoLi4uYXJnczogYW55W10pID0+IFQsIGFwcGx5VGhpcz86IGFueSwgYXBwbHlBcmdzPzogYW55W10pOiBUIHtcbiAgICByZXR1cm4gKHRoaXMgYXMgYW55IGFzIE5nWm9uZVByaXZhdGUpLl9pbm5lci5ydW4oZm4sIGFwcGx5VGhpcywgYXBwbHlBcmdzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBFeGVjdXRlcyB0aGUgYGZuYCBmdW5jdGlvbiBzeW5jaHJvbm91c2x5IHdpdGhpbiB0aGUgQW5ndWxhciB6b25lIGFzIGEgdGFzayBhbmQgcmV0dXJucyB2YWx1ZVxuICAgKiByZXR1cm5lZCBieSB0aGUgZnVuY3Rpb24uXG4gICAqXG4gICAqIFJ1bm5pbmcgZnVuY3Rpb25zIHZpYSBgcnVuYCBhbGxvd3MgeW91IHRvIHJlZW50ZXIgQW5ndWxhciB6b25lIGZyb20gYSB0YXNrIHRoYXQgd2FzIGV4ZWN1dGVkXG4gICAqIG91dHNpZGUgb2YgdGhlIEFuZ3VsYXIgem9uZSAodHlwaWNhbGx5IHN0YXJ0ZWQgdmlhIHtAbGluayAjcnVuT3V0c2lkZUFuZ3VsYXJ9KS5cbiAgICpcbiAgICogQW55IGZ1dHVyZSB0YXNrcyBvciBtaWNyb3Rhc2tzIHNjaGVkdWxlZCBmcm9tIHdpdGhpbiB0aGlzIGZ1bmN0aW9uIHdpbGwgY29udGludWUgZXhlY3V0aW5nIGZyb21cbiAgICogd2l0aGluIHRoZSBBbmd1bGFyIHpvbmUuXG4gICAqXG4gICAqIElmIGEgc3luY2hyb25vdXMgZXJyb3IgaGFwcGVucyBpdCB3aWxsIGJlIHJldGhyb3duIGFuZCBub3QgcmVwb3J0ZWQgdmlhIGBvbkVycm9yYC5cbiAgICovXG4gIHJ1blRhc2s8VD4oZm46ICguLi5hcmdzOiBhbnlbXSkgPT4gVCwgYXBwbHlUaGlzPzogYW55LCBhcHBseUFyZ3M/OiBhbnlbXSwgbmFtZT86IHN0cmluZyk6IFQge1xuICAgIGNvbnN0IHpvbmUgPSAodGhpcyBhcyBhbnkgYXMgTmdab25lUHJpdmF0ZSkuX2lubmVyO1xuICAgIGNvbnN0IHRhc2sgPSB6b25lLnNjaGVkdWxlRXZlbnRUYXNrKCdOZ1pvbmVFdmVudDogJyArIG5hbWUsIGZuLCBFTVBUWV9QQVlMT0FELCBub29wLCBub29wKTtcbiAgICB0cnkge1xuICAgICAgcmV0dXJuIHpvbmUucnVuVGFzayh0YXNrLCBhcHBseVRoaXMsIGFwcGx5QXJncyk7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIHpvbmUuY2FuY2VsVGFzayh0YXNrKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogU2FtZSBhcyBgcnVuYCwgZXhjZXB0IHRoYXQgc3luY2hyb25vdXMgZXJyb3JzIGFyZSBjYXVnaHQgYW5kIGZvcndhcmRlZCB2aWEgYG9uRXJyb3JgIGFuZCBub3RcbiAgICogcmV0aHJvd24uXG4gICAqL1xuICBydW5HdWFyZGVkPFQ+KGZuOiAoLi4uYXJnczogYW55W10pID0+IFQsIGFwcGx5VGhpcz86IGFueSwgYXBwbHlBcmdzPzogYW55W10pOiBUIHtcbiAgICByZXR1cm4gKHRoaXMgYXMgYW55IGFzIE5nWm9uZVByaXZhdGUpLl9pbm5lci5ydW5HdWFyZGVkKGZuLCBhcHBseVRoaXMsIGFwcGx5QXJncyk7XG4gIH1cblxuICAvKipcbiAgICogRXhlY3V0ZXMgdGhlIGBmbmAgZnVuY3Rpb24gc3luY2hyb25vdXNseSBpbiBBbmd1bGFyJ3MgcGFyZW50IHpvbmUgYW5kIHJldHVybnMgdmFsdWUgcmV0dXJuZWQgYnlcbiAgICogdGhlIGZ1bmN0aW9uLlxuICAgKlxuICAgKiBSdW5uaW5nIGZ1bmN0aW9ucyB2aWEge0BsaW5rICNydW5PdXRzaWRlQW5ndWxhcn0gYWxsb3dzIHlvdSB0byBlc2NhcGUgQW5ndWxhcidzIHpvbmUgYW5kIGRvXG4gICAqIHdvcmsgdGhhdFxuICAgKiBkb2Vzbid0IHRyaWdnZXIgQW5ndWxhciBjaGFuZ2UtZGV0ZWN0aW9uIG9yIGlzIHN1YmplY3QgdG8gQW5ndWxhcidzIGVycm9yIGhhbmRsaW5nLlxuICAgKlxuICAgKiBBbnkgZnV0dXJlIHRhc2tzIG9yIG1pY3JvdGFza3Mgc2NoZWR1bGVkIGZyb20gd2l0aGluIHRoaXMgZnVuY3Rpb24gd2lsbCBjb250aW51ZSBleGVjdXRpbmcgZnJvbVxuICAgKiBvdXRzaWRlIG9mIHRoZSBBbmd1bGFyIHpvbmUuXG4gICAqXG4gICAqIFVzZSB7QGxpbmsgI3J1bn0gdG8gcmVlbnRlciB0aGUgQW5ndWxhciB6b25lIGFuZCBkbyB3b3JrIHRoYXQgdXBkYXRlcyB0aGUgYXBwbGljYXRpb24gbW9kZWwuXG4gICAqL1xuICBydW5PdXRzaWRlQW5ndWxhcjxUPihmbjogKC4uLmFyZ3M6IGFueVtdKSA9PiBUKTogVCB7XG4gICAgcmV0dXJuICh0aGlzIGFzIGFueSBhcyBOZ1pvbmVQcml2YXRlKS5fb3V0ZXIucnVuKGZuKTtcbiAgfVxufVxuXG5jb25zdCBFTVBUWV9QQVlMT0FEID0ge307XG5cbmludGVyZmFjZSBOZ1pvbmVQcml2YXRlIGV4dGVuZHMgTmdab25lIHtcbiAgX291dGVyOiBab25lO1xuICBfaW5uZXI6IFpvbmU7XG4gIF9uZXN0aW5nOiBudW1iZXI7XG4gIF9oYXNQZW5kaW5nTWljcm90YXNrczogYm9vbGVhbjtcblxuICBoYXNQZW5kaW5nTWFjcm90YXNrczogYm9vbGVhbjtcbiAgaGFzUGVuZGluZ01pY3JvdGFza3M6IGJvb2xlYW47XG4gIGNhbGxiYWNrU2NoZWR1bGVkOiBib29sZWFuO1xuICAvKipcbiAgICogQSBmbGFnIHRvIGluZGljYXRlIGlmIE5nWm9uZSBpcyBjdXJyZW50bHkgaW5zaWRlXG4gICAqIGNoZWNrU3RhYmxlIGFuZCB0byBwcmV2ZW50IHJlLWVudHJ5LiBUaGUgZmxhZyBpc1xuICAgKiBuZWVkZWQgYmVjYXVzZSBpdCBpcyBwb3NzaWJsZSB0byBpbnZva2UgdGhlIGNoYW5nZVxuICAgKiBkZXRlY3Rpb24gZnJvbSB3aXRoaW4gY2hhbmdlIGRldGVjdGlvbiBsZWFkaW5nIHRvXG4gICAqIGluY29ycmVjdCBiZWhhdmlvci5cbiAgICpcbiAgICogRm9yIGRldGFpbCwgcGxlYXNlIHJlZmVyIGhlcmUsXG4gICAqIGh0dHBzOi8vZ2l0aHViLmNvbS9hbmd1bGFyL2FuZ3VsYXIvcHVsbC80MDU0MFxuICAgKi9cbiAgaXNDaGVja1N0YWJsZVJ1bm5pbmc6IGJvb2xlYW47XG4gIGlzU3RhYmxlOiBib29sZWFuO1xuICAvKipcbiAgICogT3B0aW9uYWxseSBzcGVjaWZ5IGNvYWxlc2NpbmcgZXZlbnQgY2hhbmdlIGRldGVjdGlvbnMgb3Igbm90LlxuICAgKiBDb25zaWRlciB0aGUgZm9sbG93aW5nIGNhc2UuXG4gICAqXG4gICAqIDxkaXYgKGNsaWNrKT1cImRvU29tZXRoaW5nKClcIj5cbiAgICogICA8YnV0dG9uIChjbGljayk9XCJkb1NvbWV0aGluZ0Vsc2UoKVwiPjwvYnV0dG9uPlxuICAgKiA8L2Rpdj5cbiAgICpcbiAgICogV2hlbiBidXR0b24gaXMgY2xpY2tlZCwgYmVjYXVzZSBvZiB0aGUgZXZlbnQgYnViYmxpbmcsIGJvdGhcbiAgICogZXZlbnQgaGFuZGxlcnMgd2lsbCBiZSBjYWxsZWQgYW5kIDIgY2hhbmdlIGRldGVjdGlvbnMgd2lsbCBiZVxuICAgKiB0cmlnZ2VyZWQuIFdlIGNhbiBjb2FsZXNjZSBzdWNoIGtpbmQgb2YgZXZlbnRzIHRvIHRyaWdnZXJcbiAgICogY2hhbmdlIGRldGVjdGlvbiBvbmx5IG9uY2UuXG4gICAqXG4gICAqIEJ5IGRlZmF1bHQsIHRoaXMgb3B0aW9uIHdpbGwgYmUgZmFsc2UuIFNvIHRoZSBldmVudHMgd2lsbCBub3QgYmVcbiAgICogY29hbGVzY2VkIGFuZCB0aGUgY2hhbmdlIGRldGVjdGlvbiB3aWxsIGJlIHRyaWdnZXJlZCBtdWx0aXBsZSB0aW1lcy5cbiAgICogQW5kIGlmIHRoaXMgb3B0aW9uIGJlIHNldCB0byB0cnVlLCB0aGUgY2hhbmdlIGRldGVjdGlvbiB3aWxsIGJlXG4gICAqIHRyaWdnZXJlZCBhc3luYyBieSBzY2hlZHVsaW5nIGl0IGluIGFuIGFuaW1hdGlvbiBmcmFtZS4gU28gaW4gdGhlIGNhc2UgYWJvdmUsXG4gICAqIHRoZSBjaGFuZ2UgZGV0ZWN0aW9uIHdpbGwgb25seSBiZSB0cmlnZ2VkIG9uY2UuXG4gICAqL1xuICBzaG91bGRDb2FsZXNjZUV2ZW50Q2hhbmdlRGV0ZWN0aW9uOiBib29sZWFuO1xuICAvKipcbiAgICogT3B0aW9uYWxseSBzcGVjaWZ5IGlmIGBOZ1pvbmUjcnVuKClgIG1ldGhvZCBpbnZvY2F0aW9ucyBzaG91bGQgYmUgY29hbGVzY2VkXG4gICAqIGludG8gYSBzaW5nbGUgY2hhbmdlIGRldGVjdGlvbi5cbiAgICpcbiAgICogQ29uc2lkZXIgdGhlIGZvbGxvd2luZyBjYXNlLlxuICAgKlxuICAgKiBmb3IgKGxldCBpID0gMDsgaSA8IDEwOyBpICsrKSB7XG4gICAqICAgbmdab25lLnJ1bigoKSA9PiB7XG4gICAqICAgICAvLyBkbyBzb21ldGhpbmdcbiAgICogICB9KTtcbiAgICogfVxuICAgKlxuICAgKiBUaGlzIGNhc2UgdHJpZ2dlcnMgdGhlIGNoYW5nZSBkZXRlY3Rpb24gbXVsdGlwbGUgdGltZXMuXG4gICAqIFdpdGggbmdab25lUnVuQ29hbGVzY2luZyBvcHRpb25zLCBhbGwgY2hhbmdlIGRldGVjdGlvbnMgaW4gYW4gZXZlbnQgbG9vcHMgdHJpZ2dlciBvbmx5IG9uY2UuXG4gICAqIEluIGFkZGl0aW9uLCB0aGUgY2hhbmdlIGRldGVjdGlvbiBleGVjdXRlcyBpbiByZXF1ZXN0QW5pbWF0aW9uLlxuICAgKlxuICAgKi9cbiAgc2hvdWxkQ29hbGVzY2VSdW5DaGFuZ2VEZXRlY3Rpb246IGJvb2xlYW47XG5cbiAgc2NoZWR1bGVDYWxsYmFjazogKGNhbGxiYWNrOiBGdW5jdGlvbikgPT4gdm9pZDtcblxuICAvLyBDYWNoZSBhICBcImZha2VcIiB0b3AgZXZlbnRUYXNrIHNvIHlvdSBkb24ndCBuZWVkIHRvIHNjaGVkdWxlIGEgbmV3IHRhc2sgZXZlcnlcbiAgLy8gdGltZSB5b3UgcnVuIGEgYGNoZWNrU3RhYmxlYC5cbiAgZmFrZVRvcEV2ZW50VGFzazogVGFzaztcbn1cblxuZnVuY3Rpb24gY2hlY2tTdGFibGUoem9uZTogTmdab25lUHJpdmF0ZSkge1xuICAvLyBUT0RPOiBASmlhTGlQYXNzaW9uLCBzaG91bGQgY2hlY2sgem9uZS5pc0NoZWNrU3RhYmxlUnVubmluZyB0byBwcmV2ZW50XG4gIC8vIHJlLWVudHJ5LiBUaGUgY2FzZSBpczpcbiAgLy9cbiAgLy8gQENvbXBvbmVudCh7Li4ufSlcbiAgLy8gZXhwb3J0IGNsYXNzIEFwcENvbXBvbmVudCB7XG4gIC8vIGNvbnN0cnVjdG9yKHByaXZhdGUgbmdab25lOiBOZ1pvbmUpIHtcbiAgLy8gICB0aGlzLm5nWm9uZS5vblN0YWJsZS5zdWJzY3JpYmUoKCkgPT4ge1xuICAvLyAgICAgdGhpcy5uZ1pvbmUucnVuKCgpID0+IGNvbnNvbGUubG9nKCdzdGFibGUnKTspO1xuICAvLyAgIH0pO1xuICAvLyB9XG4gIC8vXG4gIC8vIFRoZSBvblN0YWJsZSBzdWJzY3JpYmVyIHJ1biBhbm90aGVyIGZ1bmN0aW9uIGluc2lkZSBuZ1pvbmVcbiAgLy8gd2hpY2ggY2F1c2VzIGBjaGVja1N0YWJsZSgpYCByZS1lbnRyeS5cbiAgLy8gQnV0IHRoaXMgZml4IGNhdXNlcyBzb21lIGlzc3VlcyBpbiBnMywgc28gdGhpcyBmaXggd2lsbCBiZVxuICAvLyBsYXVuY2hlZCBpbiBhbm90aGVyIFBSLlxuICBpZiAoem9uZS5fbmVzdGluZyA9PSAwICYmICF6b25lLmhhc1BlbmRpbmdNaWNyb3Rhc2tzICYmICF6b25lLmlzU3RhYmxlKSB7XG4gICAgdHJ5IHtcbiAgICAgIHpvbmUuX25lc3RpbmcrKztcbiAgICAgIHpvbmUub25NaWNyb3Rhc2tFbXB0eS5lbWl0KG51bGwpO1xuICAgIH0gZmluYWxseSB7XG4gICAgICB6b25lLl9uZXN0aW5nLS07XG4gICAgICBpZiAoIXpvbmUuaGFzUGVuZGluZ01pY3JvdGFza3MpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICB6b25lLnJ1bk91dHNpZGVBbmd1bGFyKCgpID0+IHpvbmUub25TdGFibGUuZW1pdChudWxsKSk7XG4gICAgICAgIH0gZmluYWxseSB7XG4gICAgICAgICAgem9uZS5pc1N0YWJsZSA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gZGVsYXlDaGFuZ2VEZXRlY3Rpb25Gb3JFdmVudHMoem9uZTogTmdab25lUHJpdmF0ZSkge1xuICAvKipcbiAgICogV2UgYWxzbyBuZWVkIHRvIGNoZWNrIF9uZXN0aW5nIGhlcmVcbiAgICogQ29uc2lkZXIgdGhlIGZvbGxvd2luZyBjYXNlIHdpdGggc2hvdWxkQ29hbGVzY2VSdW5DaGFuZ2VEZXRlY3Rpb24gPSB0cnVlXG4gICAqXG4gICAqIG5nWm9uZS5ydW4oKCkgPT4ge30pO1xuICAgKiBuZ1pvbmUucnVuKCgpID0+IHt9KTtcbiAgICpcbiAgICogV2Ugd2FudCB0aGUgdHdvIGBuZ1pvbmUucnVuKClgIG9ubHkgdHJpZ2dlciBvbmUgY2hhbmdlIGRldGVjdGlvblxuICAgKiB3aGVuIHNob3VsZENvYWxlc2NlUnVuQ2hhbmdlRGV0ZWN0aW9uIGlzIHRydWUuXG4gICAqIEFuZCBiZWNhdXNlIGluIHRoaXMgY2FzZSwgY2hhbmdlIGRldGVjdGlvbiBydW4gaW4gYXN5bmMgd2F5KHJlcXVlc3RBbmltYXRpb25GcmFtZSksXG4gICAqIHNvIHdlIGFsc28gbmVlZCB0byBjaGVjayB0aGUgX25lc3RpbmcgaGVyZSB0byBwcmV2ZW50IG11bHRpcGxlXG4gICAqIGNoYW5nZSBkZXRlY3Rpb25zLlxuICAgKi9cbiAgaWYgKHpvbmUuaXNDaGVja1N0YWJsZVJ1bm5pbmcgfHwgem9uZS5jYWxsYmFja1NjaGVkdWxlZCkge1xuICAgIHJldHVybjtcbiAgfVxuICB6b25lLmNhbGxiYWNrU2NoZWR1bGVkID0gdHJ1ZTtcbiAgem9uZS5zY2hlZHVsZUNhbGxiYWNrLmNhbGwoZ2xvYmFsLCAoKSA9PiB7XG4gICAgLy8gVGhpcyBpcyBhIHdvcmsgYXJvdW5kIGZvciBodHRwczovL2dpdGh1Yi5jb20vYW5ndWxhci9hbmd1bGFyL2lzc3Vlcy8zNjgzOS5cbiAgICAvLyBUaGUgY29yZSBpc3N1ZSBpcyB0aGF0IHdoZW4gZXZlbnQgY29hbGVzY2luZyBpcyBlbmFibGVkIGl0IGlzIHBvc3NpYmxlIGZvciBtaWNyb3Rhc2tzXG4gICAgLy8gdG8gZ2V0IGZsdXNoZWQgdG9vIGVhcmx5IChBcyBpcyB0aGUgY2FzZSB3aXRoIGBQcm9taXNlLnRoZW5gKSBiZXR3ZWVuIHRoZVxuICAgIC8vIGNvYWxlc2NpbmcgZXZlbnRUYXNrcy5cbiAgICAvL1xuICAgIC8vIFRvIHdvcmthcm91bmQgdGhpcyB3ZSBzY2hlZHVsZSBhIFwiZmFrZVwiIGV2ZW50VGFzayBiZWZvcmUgd2UgcHJvY2VzcyB0aGVcbiAgICAvLyBjb2FsZXNjaW5nIGV2ZW50VGFza3MuIFRoZSBiZW5lZml0IG9mIHRoaXMgaXMgdGhhdCB0aGUgXCJmYWtlXCIgY29udGFpbmVyIGV2ZW50VGFza1xuICAgIC8vICB3aWxsIHByZXZlbnQgdGhlIG1pY3JvdGFza3MgcXVldWUgZnJvbSBnZXR0aW5nIGRyYWluZWQgaW4gYmV0d2VlbiB0aGUgY29hbGVzY2luZ1xuICAgIC8vIGV2ZW50VGFzayBleGVjdXRpb24uXG4gICAgaWYgKCF6b25lLmZha2VUb3BFdmVudFRhc2spIHtcbiAgICAgIHpvbmUuZmFrZVRvcEV2ZW50VGFzayA9IFpvbmUucm9vdC5zY2hlZHVsZUV2ZW50VGFzayhcbiAgICAgICAgJ2Zha2VUb3BFdmVudFRhc2snLFxuICAgICAgICAoKSA9PiB7XG4gICAgICAgICAgem9uZS5jYWxsYmFja1NjaGVkdWxlZCA9IGZhbHNlO1xuICAgICAgICAgIHVwZGF0ZU1pY3JvVGFza1N0YXR1cyh6b25lKTtcbiAgICAgICAgICB6b25lLmlzQ2hlY2tTdGFibGVSdW5uaW5nID0gdHJ1ZTtcbiAgICAgICAgICBjaGVja1N0YWJsZSh6b25lKTtcbiAgICAgICAgICB6b25lLmlzQ2hlY2tTdGFibGVSdW5uaW5nID0gZmFsc2U7XG4gICAgICAgIH0sXG4gICAgICAgIHVuZGVmaW5lZCxcbiAgICAgICAgKCkgPT4ge30sXG4gICAgICAgICgpID0+IHt9LFxuICAgICAgKTtcbiAgICB9XG4gICAgem9uZS5mYWtlVG9wRXZlbnRUYXNrLmludm9rZSgpO1xuICB9KTtcbiAgdXBkYXRlTWljcm9UYXNrU3RhdHVzKHpvbmUpO1xufVxuXG5mdW5jdGlvbiBmb3JrSW5uZXJab25lV2l0aEFuZ3VsYXJCZWhhdmlvcih6b25lOiBOZ1pvbmVQcml2YXRlKSB7XG4gIGNvbnN0IGRlbGF5Q2hhbmdlRGV0ZWN0aW9uRm9yRXZlbnRzRGVsZWdhdGUgPSAoKSA9PiB7XG4gICAgZGVsYXlDaGFuZ2VEZXRlY3Rpb25Gb3JFdmVudHMoem9uZSk7XG4gIH07XG4gIHpvbmUuX2lubmVyID0gem9uZS5faW5uZXIuZm9yayh7XG4gICAgbmFtZTogJ2FuZ3VsYXInLFxuICAgIHByb3BlcnRpZXM6IDxhbnk+eydpc0FuZ3VsYXJab25lJzogdHJ1ZX0sXG4gICAgb25JbnZva2VUYXNrOiAoXG4gICAgICBkZWxlZ2F0ZTogWm9uZURlbGVnYXRlLFxuICAgICAgY3VycmVudDogWm9uZSxcbiAgICAgIHRhcmdldDogWm9uZSxcbiAgICAgIHRhc2s6IFRhc2ssXG4gICAgICBhcHBseVRoaXM6IGFueSxcbiAgICAgIGFwcGx5QXJnczogYW55LFxuICAgICk6IGFueSA9PiB7XG4gICAgICAvLyBQcmV2ZW50IHRyaWdnZXJpbmcgY2hhbmdlIGRldGVjdGlvbiB3aGVuIHRoZSBmbGFnIGlzIGRldGVjdGVkLlxuICAgICAgaWYgKHNob3VsZEJlSWdub3JlZEJ5Wm9uZShhcHBseUFyZ3MpKSB7XG4gICAgICAgIHJldHVybiBkZWxlZ2F0ZS5pbnZva2VUYXNrKHRhcmdldCwgdGFzaywgYXBwbHlUaGlzLCBhcHBseUFyZ3MpO1xuICAgICAgfVxuXG4gICAgICB0cnkge1xuICAgICAgICBvbkVudGVyKHpvbmUpO1xuICAgICAgICByZXR1cm4gZGVsZWdhdGUuaW52b2tlVGFzayh0YXJnZXQsIHRhc2ssIGFwcGx5VGhpcywgYXBwbHlBcmdzKTtcbiAgICAgIH0gZmluYWxseSB7XG4gICAgICAgIGlmIChcbiAgICAgICAgICAoem9uZS5zaG91bGRDb2FsZXNjZUV2ZW50Q2hhbmdlRGV0ZWN0aW9uICYmIHRhc2sudHlwZSA9PT0gJ2V2ZW50VGFzaycpIHx8XG4gICAgICAgICAgem9uZS5zaG91bGRDb2FsZXNjZVJ1bkNoYW5nZURldGVjdGlvblxuICAgICAgICApIHtcbiAgICAgICAgICBkZWxheUNoYW5nZURldGVjdGlvbkZvckV2ZW50c0RlbGVnYXRlKCk7XG4gICAgICAgIH1cbiAgICAgICAgb25MZWF2ZSh6b25lKTtcbiAgICAgIH1cbiAgICB9LFxuXG4gICAgb25JbnZva2U6IChcbiAgICAgIGRlbGVnYXRlOiBab25lRGVsZWdhdGUsXG4gICAgICBjdXJyZW50OiBab25lLFxuICAgICAgdGFyZ2V0OiBab25lLFxuICAgICAgY2FsbGJhY2s6IEZ1bmN0aW9uLFxuICAgICAgYXBwbHlUaGlzOiBhbnksXG4gICAgICBhcHBseUFyZ3M/OiBhbnlbXSxcbiAgICAgIHNvdXJjZT86IHN0cmluZyxcbiAgICApOiBhbnkgPT4ge1xuICAgICAgdHJ5IHtcbiAgICAgICAgb25FbnRlcih6b25lKTtcbiAgICAgICAgcmV0dXJuIGRlbGVnYXRlLmludm9rZSh0YXJnZXQsIGNhbGxiYWNrLCBhcHBseVRoaXMsIGFwcGx5QXJncywgc291cmNlKTtcbiAgICAgIH0gZmluYWxseSB7XG4gICAgICAgIGlmIChcbiAgICAgICAgICB6b25lLnNob3VsZENvYWxlc2NlUnVuQ2hhbmdlRGV0ZWN0aW9uICYmXG4gICAgICAgICAgLy8gRG8gbm90IGRlbGF5IGNoYW5nZSBkZXRlY3Rpb24gd2hlbiB0aGUgdGFzayBpcyB0aGUgc2NoZWR1bGVyJ3MgdGljay5cbiAgICAgICAgICAvLyBXZSBuZWVkIHRvIHN5bmNocm9ub3VzbHkgdHJpZ2dlciB0aGUgc3RhYmlsaXR5IGxvZ2ljIHNvIHRoYXQgdGhlXG4gICAgICAgICAgLy8gem9uZS1iYXNlZCBzY2hlZHVsZXIgY2FuIHByZXZlbnQgYSBkdXBsaWNhdGUgQXBwbGljYXRpb25SZWYudGlja1xuICAgICAgICAgIC8vIGJ5IGZpcnN0IGNoZWNraW5nIGlmIHRoZSBzY2hlZHVsZXIgdGljayBpcyBydW5uaW5nLiBUaGlzIGRvZXMgc2VlbSBhIGJpdCByb3VuZGFib3V0LFxuICAgICAgICAgIC8vIGJ1dCB3ZSBfZG9fIHN0aWxsIHdhbnQgdG8gdHJpZ2dlciBhbGwgdGhlIGNvcnJlY3QgZXZlbnRzIHdoZW4gd2UgZXhpdCB0aGUgem9uZS5ydW5cbiAgICAgICAgICAvLyAoYG9uTWljcm90YXNrRW1wdHlgIGFuZCBgb25TdGFibGVgIF9zaG91bGRfIGVtaXQ7IGRldmVsb3BlcnMgY2FuIGhhdmUgY29kZSB3aGljaFxuICAgICAgICAgIC8vIHJlbGllcyBvbiB0aGVzZSBldmVudHMgaGFwcGVuaW5nIGFmdGVyIGNoYW5nZSBkZXRlY3Rpb24gcnVucykuXG4gICAgICAgICAgLy8gTm90ZTogYHpvbmUuY2FsbGJhY2tTY2hlZHVsZWRgIGlzIGFscmVhZHkgaW4gZGVsYXlDaGFuZ2VEZXRlY3Rpb25Gb3JFdmVudHNEZWxlZ2F0ZVxuICAgICAgICAgIC8vIGJ1dCBpcyBhZGRlZCBoZXJlIGFzIHdlbGwgdG8gcHJldmVudCByZWFkcyBvZiBhcHBseUFyZ3Mgd2hlbiBub3QgbmVjZXNzYXJ5XG4gICAgICAgICAgIXpvbmUuY2FsbGJhY2tTY2hlZHVsZWQgJiZcbiAgICAgICAgICAhaXNTY2hlZHVsZXJUaWNrKGFwcGx5QXJncylcbiAgICAgICAgKSB7XG4gICAgICAgICAgZGVsYXlDaGFuZ2VEZXRlY3Rpb25Gb3JFdmVudHNEZWxlZ2F0ZSgpO1xuICAgICAgICB9XG4gICAgICAgIG9uTGVhdmUoem9uZSk7XG4gICAgICB9XG4gICAgfSxcblxuICAgIG9uSGFzVGFzazogKFxuICAgICAgZGVsZWdhdGU6IFpvbmVEZWxlZ2F0ZSxcbiAgICAgIGN1cnJlbnQ6IFpvbmUsXG4gICAgICB0YXJnZXQ6IFpvbmUsXG4gICAgICBoYXNUYXNrU3RhdGU6IEhhc1Rhc2tTdGF0ZSxcbiAgICApID0+IHtcbiAgICAgIGRlbGVnYXRlLmhhc1Rhc2sodGFyZ2V0LCBoYXNUYXNrU3RhdGUpO1xuICAgICAgaWYgKGN1cnJlbnQgPT09IHRhcmdldCkge1xuICAgICAgICAvLyBXZSBhcmUgb25seSBpbnRlcmVzdGVkIGluIGhhc1Rhc2sgZXZlbnRzIHdoaWNoIG9yaWdpbmF0ZSBmcm9tIG91ciB6b25lXG4gICAgICAgIC8vIChBIGNoaWxkIGhhc1Rhc2sgZXZlbnQgaXMgbm90IGludGVyZXN0aW5nIHRvIHVzKVxuICAgICAgICBpZiAoaGFzVGFza1N0YXRlLmNoYW5nZSA9PSAnbWljcm9UYXNrJykge1xuICAgICAgICAgIHpvbmUuX2hhc1BlbmRpbmdNaWNyb3Rhc2tzID0gaGFzVGFza1N0YXRlLm1pY3JvVGFzaztcbiAgICAgICAgICB1cGRhdGVNaWNyb1Rhc2tTdGF0dXMoem9uZSk7XG4gICAgICAgICAgY2hlY2tTdGFibGUoem9uZSk7XG4gICAgICAgIH0gZWxzZSBpZiAoaGFzVGFza1N0YXRlLmNoYW5nZSA9PSAnbWFjcm9UYXNrJykge1xuICAgICAgICAgIHpvbmUuaGFzUGVuZGluZ01hY3JvdGFza3MgPSBoYXNUYXNrU3RhdGUubWFjcm9UYXNrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSxcblxuICAgIG9uSGFuZGxlRXJyb3I6IChkZWxlZ2F0ZTogWm9uZURlbGVnYXRlLCBjdXJyZW50OiBab25lLCB0YXJnZXQ6IFpvbmUsIGVycm9yOiBhbnkpOiBib29sZWFuID0+IHtcbiAgICAgIGRlbGVnYXRlLmhhbmRsZUVycm9yKHRhcmdldCwgZXJyb3IpO1xuICAgICAgem9uZS5ydW5PdXRzaWRlQW5ndWxhcigoKSA9PiB6b25lLm9uRXJyb3IuZW1pdChlcnJvcikpO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH0sXG4gIH0pO1xufVxuXG5mdW5jdGlvbiB1cGRhdGVNaWNyb1Rhc2tTdGF0dXMoem9uZTogTmdab25lUHJpdmF0ZSkge1xuICBpZiAoXG4gICAgem9uZS5faGFzUGVuZGluZ01pY3JvdGFza3MgfHxcbiAgICAoKHpvbmUuc2hvdWxkQ29hbGVzY2VFdmVudENoYW5nZURldGVjdGlvbiB8fCB6b25lLnNob3VsZENvYWxlc2NlUnVuQ2hhbmdlRGV0ZWN0aW9uKSAmJlxuICAgICAgem9uZS5jYWxsYmFja1NjaGVkdWxlZCA9PT0gdHJ1ZSlcbiAgKSB7XG4gICAgem9uZS5oYXNQZW5kaW5nTWljcm90YXNrcyA9IHRydWU7XG4gIH0gZWxzZSB7XG4gICAgem9uZS5oYXNQZW5kaW5nTWljcm90YXNrcyA9IGZhbHNlO1xuICB9XG59XG5cbmZ1bmN0aW9uIG9uRW50ZXIoem9uZTogTmdab25lUHJpdmF0ZSkge1xuICB6b25lLl9uZXN0aW5nKys7XG4gIGlmICh6b25lLmlzU3RhYmxlKSB7XG4gICAgem9uZS5pc1N0YWJsZSA9IGZhbHNlO1xuICAgIHpvbmUub25VbnN0YWJsZS5lbWl0KG51bGwpO1xuICB9XG59XG5cbmZ1bmN0aW9uIG9uTGVhdmUoem9uZTogTmdab25lUHJpdmF0ZSkge1xuICB6b25lLl9uZXN0aW5nLS07XG4gIGNoZWNrU3RhYmxlKHpvbmUpO1xufVxuXG4vKipcbiAqIFByb3ZpZGVzIGEgbm9vcCBpbXBsZW1lbnRhdGlvbiBvZiBgTmdab25lYCB3aGljaCBkb2VzIG5vdGhpbmcuIFRoaXMgem9uZSByZXF1aXJlcyBleHBsaWNpdCBjYWxsc1xuICogdG8gZnJhbWV3b3JrIHRvIHBlcmZvcm0gcmVuZGVyaW5nLlxuICovXG5leHBvcnQgY2xhc3MgTm9vcE5nWm9uZSBpbXBsZW1lbnRzIE5nWm9uZSB7XG4gIHJlYWRvbmx5IGhhc1BlbmRpbmdNaWNyb3Rhc2tzID0gZmFsc2U7XG4gIHJlYWRvbmx5IGhhc1BlbmRpbmdNYWNyb3Rhc2tzID0gZmFsc2U7XG4gIHJlYWRvbmx5IGlzU3RhYmxlID0gdHJ1ZTtcbiAgcmVhZG9ubHkgb25VbnN0YWJsZSA9IG5ldyBFdmVudEVtaXR0ZXI8YW55PigpO1xuICByZWFkb25seSBvbk1pY3JvdGFza0VtcHR5ID0gbmV3IEV2ZW50RW1pdHRlcjxhbnk+KCk7XG4gIHJlYWRvbmx5IG9uU3RhYmxlID0gbmV3IEV2ZW50RW1pdHRlcjxhbnk+KCk7XG4gIHJlYWRvbmx5IG9uRXJyb3IgPSBuZXcgRXZlbnRFbWl0dGVyPGFueT4oKTtcblxuICBydW48VD4oZm46ICguLi5hcmdzOiBhbnlbXSkgPT4gVCwgYXBwbHlUaGlzPzogYW55LCBhcHBseUFyZ3M/OiBhbnkpOiBUIHtcbiAgICByZXR1cm4gZm4uYXBwbHkoYXBwbHlUaGlzLCBhcHBseUFyZ3MpO1xuICB9XG5cbiAgcnVuR3VhcmRlZDxUPihmbjogKC4uLmFyZ3M6IGFueVtdKSA9PiBhbnksIGFwcGx5VGhpcz86IGFueSwgYXBwbHlBcmdzPzogYW55KTogVCB7XG4gICAgcmV0dXJuIGZuLmFwcGx5KGFwcGx5VGhpcywgYXBwbHlBcmdzKTtcbiAgfVxuXG4gIHJ1bk91dHNpZGVBbmd1bGFyPFQ+KGZuOiAoLi4uYXJnczogYW55W10pID0+IFQpOiBUIHtcbiAgICByZXR1cm4gZm4oKTtcbiAgfVxuXG4gIHJ1blRhc2s8VD4oZm46ICguLi5hcmdzOiBhbnlbXSkgPT4gVCwgYXBwbHlUaGlzPzogYW55LCBhcHBseUFyZ3M/OiBhbnksIG5hbWU/OiBzdHJpbmcpOiBUIHtcbiAgICByZXR1cm4gZm4uYXBwbHkoYXBwbHlUaGlzLCBhcHBseUFyZ3MpO1xuICB9XG59XG5cbmZ1bmN0aW9uIHNob3VsZEJlSWdub3JlZEJ5Wm9uZShhcHBseUFyZ3M6IHVua25vd24pOiBib29sZWFuIHtcbiAgcmV0dXJuIGhhc0FwcGx5QXJnc0RhdGEoYXBwbHlBcmdzLCAnX19pZ25vcmVfbmdfem9uZV9fJyk7XG59XG5cbmZ1bmN0aW9uIGlzU2NoZWR1bGVyVGljayhhcHBseUFyZ3M6IHVua25vd24pOiBib29sZWFuIHtcbiAgcmV0dXJuIGhhc0FwcGx5QXJnc0RhdGEoYXBwbHlBcmdzLCAnX19zY2hlZHVsZXJfdGlja19fJyk7XG59XG5cbmZ1bmN0aW9uIGhhc0FwcGx5QXJnc0RhdGEoYXBwbHlBcmdzOiB1bmtub3duLCBrZXk6IHN0cmluZykge1xuICBpZiAoIUFycmF5LmlzQXJyYXkoYXBwbHlBcmdzKSkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIC8vIFdlIHNob3VsZCBvbmx5IGV2ZXIgZ2V0IDEgYXJnIHBhc3NlZCB0aHJvdWdoIHRvIGludm9rZVRhc2suXG4gIC8vIFNob3J0IGNpcmN1aXQgaGVyZSBpbmNhc2UgdGhhdCBiZWhhdmlvciBjaGFuZ2VzLlxuICBpZiAoYXBwbHlBcmdzLmxlbmd0aCAhPT0gMSkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIHJldHVybiBhcHBseUFyZ3NbMF0/LmRhdGE/LltrZXldID09PSB0cnVlO1xufVxuXG4vLyBTZXQgb2Ygb3B0aW9ucyByZWNvZ25pemVkIGJ5IHRoZSBOZ1pvbmUuXG5leHBvcnQgaW50ZXJmYWNlIEludGVybmFsTmdab25lT3B0aW9ucyB7XG4gIGVuYWJsZUxvbmdTdGFja1RyYWNlOiBib29sZWFuO1xuICBzaG91bGRDb2FsZXNjZUV2ZW50Q2hhbmdlRGV0ZWN0aW9uOiBib29sZWFuO1xuICBzaG91bGRDb2FsZXNjZVJ1bkNoYW5nZURldGVjdGlvbjogYm9vbGVhbjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldE5nWm9uZShcbiAgbmdab25lVG9Vc2U6IE5nWm9uZSB8ICd6b25lLmpzJyB8ICdub29wJyA9ICd6b25lLmpzJyxcbiAgb3B0aW9uczogSW50ZXJuYWxOZ1pvbmVPcHRpb25zLFxuKTogTmdab25lIHtcbiAgaWYgKG5nWm9uZVRvVXNlID09PSAnbm9vcCcpIHtcbiAgICByZXR1cm4gbmV3IE5vb3BOZ1pvbmUoKTtcbiAgfVxuICBpZiAobmdab25lVG9Vc2UgPT09ICd6b25lLmpzJykge1xuICAgIHJldHVybiBuZXcgTmdab25lKG9wdGlvbnMpO1xuICB9XG4gIHJldHVybiBuZ1pvbmVUb1VzZTtcbn1cbiJdfQ==