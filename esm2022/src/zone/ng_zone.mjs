/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { RuntimeError } from '../errors';
import { EventEmitter } from '../event_emitter';
import { getCallbackScheduler } from '../util/callback_scheduler';
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
    constructor({ enableLongStackTrace = false, shouldCoalesceEventChangeDetection = false, shouldCoalesceRunChangeDetection = false }) {
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
            self._inner = self._inner.fork(new Zone['TaskTrackingZoneSpec']);
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
        self.scheduleCallback = getCallbackScheduler();
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
                if (zone.shouldCoalesceRunChangeDetection) {
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
        }
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
    if (!Array.isArray(applyArgs)) {
        return false;
    }
    // We should only ever get 1 arg passed through to invokeTask.
    // Short circuit here incase that behavior changes.
    if (applyArgs.length !== 1) {
        return false;
    }
    // Prevent triggering change detection when the __ignore_ng_zone__ flag is detected.
    return applyArgs[0].data?.['__ignore_ng_zone__'] === true;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmdfem9uZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3pvbmUvbmdfem9uZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFHSCxPQUFPLEVBQUMsWUFBWSxFQUFtQixNQUFNLFdBQVcsQ0FBQztBQUN6RCxPQUFPLEVBQUMsWUFBWSxFQUFDLE1BQU0sa0JBQWtCLENBQUM7QUFDOUMsT0FBTyxFQUFDLG9CQUFvQixFQUFDLE1BQU0sNEJBQTRCLENBQUM7QUFDaEUsT0FBTyxFQUFDLE1BQU0sRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBQ3RDLE9BQU8sRUFBQyxJQUFJLEVBQUMsTUFBTSxjQUFjLENBQUM7QUFFbEMsT0FBTyxFQUFDLHlCQUF5QixFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFNaEU7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7R0F5RUc7QUFDSCxNQUFNLE9BQU8sTUFBTTtJQWlDakIsWUFBWSxFQUNWLG9CQUFvQixHQUFHLEtBQUssRUFDNUIsa0NBQWtDLEdBQUcsS0FBSyxFQUMxQyxnQ0FBZ0MsR0FBRyxLQUFLLEVBQ3pDO1FBcENRLHlCQUFvQixHQUFZLEtBQUssQ0FBQztRQUN0Qyx5QkFBb0IsR0FBWSxLQUFLLENBQUM7UUFFL0M7O1dBRUc7UUFDTSxhQUFRLEdBQVksSUFBSSxDQUFDO1FBRWxDOztXQUVHO1FBQ00sZUFBVSxHQUFzQixJQUFJLFlBQVksQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUVqRTs7OztXQUlHO1FBQ00scUJBQWdCLEdBQXNCLElBQUksWUFBWSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBRXZFOzs7O1dBSUc7UUFDTSxhQUFRLEdBQXNCLElBQUksWUFBWSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBRS9EOztXQUVHO1FBQ00sWUFBTyxH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SUFDbkQsSUFBSSxTQUFTLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRSxDQUFDO1FBQzNCLE9BQU8sS0FBSyxDQUFDO0lBQ2YsQ0FBQztJQUVELG9GQUFvRjtJQUNwRixPQUFPLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxvQkFBb0IsQ0FBQyxLQUFLLElBQUksQ0FBQztBQUM1RCxDQUFDO0FBV0QsTUFBTSxVQUFVLFNBQVMsQ0FDckIsY0FBdUMsU0FBUyxFQUFFLE9BQThCO0lBQ2xGLElBQUksV0FBVyxLQUFLLE1BQU0sRUFBRSxDQUFDO1FBQzNCLE9BQU8sSUFBSSxVQUFVLEVBQUUsQ0FBQztJQUMxQixDQUFDO0lBQ0QsSUFBSSxXQUFXLEtBQUssU0FBUyxFQUFFLENBQUM7UUFDOUIsT0FBTyxJQUFJLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUM3QixDQUFDO0lBQ0QsT0FBTyxXQUFXLENBQUM7QUFDckIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5cbmltcG9ydCB7UnVudGltZUVycm9yLCBSdW50aW1lRXJyb3JDb2RlfSBmcm9tICcuLi9lcnJvcnMnO1xuaW1wb3J0IHtFdmVudEVtaXR0ZXJ9IGZyb20gJy4uL2V2ZW50X2VtaXR0ZXInO1xuaW1wb3J0IHtnZXRDYWxsYmFja1NjaGVkdWxlcn0gZnJvbSAnLi4vdXRpbC9jYWxsYmFja19zY2hlZHVsZXInO1xuaW1wb3J0IHtnbG9iYWx9IGZyb20gJy4uL3V0aWwvZ2xvYmFsJztcbmltcG9ydCB7bm9vcH0gZnJvbSAnLi4vdXRpbC9ub29wJztcblxuaW1wb3J0IHtBc3luY1N0YWNrVGFnZ2luZ1pvbmVTcGVjfSBmcm9tICcuL2FzeW5jLXN0YWNrLXRhZ2dpbmcnO1xuXG4vLyBUaGUgYmVsb3cgaXMgbmVlZGVkIGFzIG90aGVyd2lzZSBhIG51bWJlciBvZiB0YXJnZXRzIGZhaWwgaW4gRzMgZHVlIHRvOlxuLy8gRVJST1IgLSBbSlNDX1VOREVGSU5FRF9WQVJJQUJMRV0gdmFyaWFibGUgWm9uZSBpcyB1bmRlY2xhcmVkXG5kZWNsYXJlIGNvbnN0IFpvbmU6IGFueTtcblxuLyoqXG4gKiBBbiBpbmplY3RhYmxlIHNlcnZpY2UgZm9yIGV4ZWN1dGluZyB3b3JrIGluc2lkZSBvciBvdXRzaWRlIG9mIHRoZSBBbmd1bGFyIHpvbmUuXG4gKlxuICogVGhlIG1vc3QgY29tbW9uIHVzZSBvZiB0aGlzIHNlcnZpY2UgaXMgdG8gb3B0aW1pemUgcGVyZm9ybWFuY2Ugd2hlbiBzdGFydGluZyBhIHdvcmsgY29uc2lzdGluZyBvZlxuICogb25lIG9yIG1vcmUgYXN5bmNocm9ub3VzIHRhc2tzIHRoYXQgZG9uJ3QgcmVxdWlyZSBVSSB1cGRhdGVzIG9yIGVycm9yIGhhbmRsaW5nIHRvIGJlIGhhbmRsZWQgYnlcbiAqIEFuZ3VsYXIuIFN1Y2ggdGFza3MgY2FuIGJlIGtpY2tlZCBvZmYgdmlhIHtAbGluayAjcnVuT3V0c2lkZUFuZ3VsYXJ9IGFuZCBpZiBuZWVkZWQsIHRoZXNlIHRhc2tzXG4gKiBjYW4gcmVlbnRlciB0aGUgQW5ndWxhciB6b25lIHZpYSB7QGxpbmsgI3J1bn0uXG4gKlxuICogPCEtLSBUT0RPOiBhZGQvZml4IGxpbmtzIHRvOlxuICogICAtIGRvY3MgZXhwbGFpbmluZyB6b25lcyBhbmQgdGhlIHVzZSBvZiB6b25lcyBpbiBBbmd1bGFyIGFuZCBjaGFuZ2UtZGV0ZWN0aW9uXG4gKiAgIC0gbGluayB0byBydW5PdXRzaWRlQW5ndWxhci9ydW4gKHRocm91Z2hvdXQgdGhpcyBmaWxlISlcbiAqICAgLS0+XG4gKlxuICogQHVzYWdlTm90ZXNcbiAqICMjIyBFeGFtcGxlXG4gKlxuICogYGBgXG4gKiBpbXBvcnQge0NvbXBvbmVudCwgTmdab25lfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbiAqIGltcG9ydCB7TmdJZn0gZnJvbSAnQGFuZ3VsYXIvY29tbW9uJztcbiAqXG4gKiBAQ29tcG9uZW50KHtcbiAqICAgc2VsZWN0b3I6ICduZy16b25lLWRlbW8nLFxuICogICB0ZW1wbGF0ZTogYFxuICogICAgIDxoMj5EZW1vOiBOZ1pvbmU8L2gyPlxuICpcbiAqICAgICA8cD5Qcm9ncmVzczoge3twcm9ncmVzc319JTwvcD5cbiAqICAgICA8cCAqbmdJZj1cInByb2dyZXNzID49IDEwMFwiPkRvbmUgcHJvY2Vzc2luZyB7e2xhYmVsfX0gb2YgQW5ndWxhciB6b25lITwvcD5cbiAqXG4gKiAgICAgPGJ1dHRvbiAoY2xpY2spPVwicHJvY2Vzc1dpdGhpbkFuZ3VsYXJab25lKClcIj5Qcm9jZXNzIHdpdGhpbiBBbmd1bGFyIHpvbmU8L2J1dHRvbj5cbiAqICAgICA8YnV0dG9uIChjbGljayk9XCJwcm9jZXNzT3V0c2lkZU9mQW5ndWxhclpvbmUoKVwiPlByb2Nlc3Mgb3V0c2lkZSBvZiBBbmd1bGFyIHpvbmU8L2J1dHRvbj5cbiAqICAgYCxcbiAqIH0pXG4gKiBleHBvcnQgY2xhc3MgTmdab25lRGVtbyB7XG4gKiAgIHByb2dyZXNzOiBudW1iZXIgPSAwO1xuICogICBsYWJlbDogc3RyaW5nO1xuICpcbiAqICAgY29uc3RydWN0b3IocHJpdmF0ZSBfbmdab25lOiBOZ1pvbmUpIHt9XG4gKlxuICogICAvLyBMb29wIGluc2lkZSB0aGUgQW5ndWxhciB6b25lXG4gKiAgIC8vIHNvIHRoZSBVSSBET0VTIHJlZnJlc2ggYWZ0ZXIgZWFjaCBzZXRUaW1lb3V0IGN5Y2xlXG4gKiAgIHByb2Nlc3NXaXRoaW5Bbmd1bGFyWm9uZSgpIHtcbiAqICAgICB0aGlzLmxhYmVsID0gJ2luc2lkZSc7XG4gKiAgICAgdGhpcy5wcm9ncmVzcyA9IDA7XG4gKiAgICAgdGhpcy5faW5jcmVhc2VQcm9ncmVzcygoKSA9PiBjb25zb2xlLmxvZygnSW5zaWRlIERvbmUhJykpO1xuICogICB9XG4gKlxuICogICAvLyBMb29wIG91dHNpZGUgb2YgdGhlIEFuZ3VsYXIgem9uZVxuICogICAvLyBzbyB0aGUgVUkgRE9FUyBOT1QgcmVmcmVzaCBhZnRlciBlYWNoIHNldFRpbWVvdXQgY3ljbGVcbiAqICAgcHJvY2Vzc091dHNpZGVPZkFuZ3VsYXJab25lKCkge1xuICogICAgIHRoaXMubGFiZWwgPSAnb3V0c2lkZSc7XG4gKiAgICAgdGhpcy5wcm9ncmVzcyA9IDA7XG4gKiAgICAgdGhpcy5fbmdab25lLnJ1bk91dHNpZGVBbmd1bGFyKCgpID0+IHtcbiAqICAgICAgIHRoaXMuX2luY3JlYXNlUHJvZ3Jlc3MoKCkgPT4ge1xuICogICAgICAgICAvLyByZWVudGVyIHRoZSBBbmd1bGFyIHpvbmUgYW5kIGRpc3BsYXkgZG9uZVxuICogICAgICAgICB0aGlzLl9uZ1pvbmUucnVuKCgpID0+IHsgY29uc29sZS5sb2coJ091dHNpZGUgRG9uZSEnKTsgfSk7XG4gKiAgICAgICB9KTtcbiAqICAgICB9KTtcbiAqICAgfVxuICpcbiAqICAgX2luY3JlYXNlUHJvZ3Jlc3MoZG9uZUNhbGxiYWNrOiAoKSA9PiB2b2lkKSB7XG4gKiAgICAgdGhpcy5wcm9ncmVzcyArPSAxO1xuICogICAgIGNvbnNvbGUubG9nKGBDdXJyZW50IHByb2dyZXNzOiAke3RoaXMucHJvZ3Jlc3N9JWApO1xuICpcbiAqICAgICBpZiAodGhpcy5wcm9ncmVzcyA8IDEwMCkge1xuICogICAgICAgd2luZG93LnNldFRpbWVvdXQoKCkgPT4gdGhpcy5faW5jcmVhc2VQcm9ncmVzcyhkb25lQ2FsbGJhY2spLCAxMCk7XG4gKiAgICAgfSBlbHNlIHtcbiAqICAgICAgIGRvbmVDYWxsYmFjaygpO1xuICogICAgIH1cbiAqICAgfVxuICogfVxuICogYGBgXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgY2xhc3MgTmdab25lIHtcbiAgcmVhZG9ubHkgaGFzUGVuZGluZ01hY3JvdGFza3M6IGJvb2xlYW4gPSBmYWxzZTtcbiAgcmVhZG9ubHkgaGFzUGVuZGluZ01pY3JvdGFza3M6IGJvb2xlYW4gPSBmYWxzZTtcblxuICAvKipcbiAgICogV2hldGhlciB0aGVyZSBhcmUgbm8gb3V0c3RhbmRpbmcgbWljcm90YXNrcyBvciBtYWNyb3Rhc2tzLlxuICAgKi9cbiAgcmVhZG9ubHkgaXNTdGFibGU6IGJvb2xlYW4gPSB0cnVlO1xuXG4gIC8qKlxuICAgKiBOb3RpZmllcyB3aGVuIGNvZGUgZW50ZXJzIEFuZ3VsYXIgWm9uZS4gVGhpcyBnZXRzIGZpcmVkIGZpcnN0IG9uIFZNIFR1cm4uXG4gICAqL1xuICByZWFkb25seSBvblVuc3RhYmxlOiBFdmVudEVtaXR0ZXI8YW55PiA9IG5ldyBFdmVudEVtaXR0ZXIoZmFsc2UpO1xuXG4gIC8qKlxuICAgKiBOb3RpZmllcyB3aGVuIHRoZXJlIGlzIG5vIG1vcmUgbWljcm90YXNrcyBlbnF1ZXVlZCBpbiB0aGUgY3VycmVudCBWTSBUdXJuLlxuICAgKiBUaGlzIGlzIGEgaGludCBmb3IgQW5ndWxhciB0byBkbyBjaGFuZ2UgZGV0ZWN0aW9uLCB3aGljaCBtYXkgZW5xdWV1ZSBtb3JlIG1pY3JvdGFza3MuXG4gICAqIEZvciB0aGlzIHJlYXNvbiB0aGlzIGV2ZW50IGNhbiBmaXJlIG11bHRpcGxlIHRpbWVzIHBlciBWTSBUdXJuLlxuICAgKi9cbiAgcmVhZG9ubHkgb25NaWNyb3Rhc2tFbXB0eTogRXZlbnRFbWl0dGVyPGFueT4gPSBuZXcgRXZlbnRFbWl0dGVyKGZhbHNlKTtcblxuICAvKipcbiAgICogTm90aWZpZXMgd2hlbiB0aGUgbGFzdCBgb25NaWNyb3Rhc2tFbXB0eWAgaGFzIHJ1biBhbmQgdGhlcmUgYXJlIG5vIG1vcmUgbWljcm90YXNrcywgd2hpY2hcbiAgICogaW1wbGllcyB3ZSBhcmUgYWJvdXQgdG8gcmVsaW5xdWlzaCBWTSB0dXJuLlxuICAgKiBUaGlzIGV2ZW50IGdldHMgY2FsbGVkIGp1c3Qgb25jZS5cbiAgICovXG4gIHJlYWRvbmx5IG9uU3RhYmxlOiBFdmVudEVtaXR0ZXI8YW55PiA9IG5ldyBFdmVudEVtaXR0ZXIoZmFsc2UpO1xuXG4gIC8qKlxuICAgKiBOb3RpZmllcyB0aGF0IGFuIGVycm9yIGhhcyBiZWVuIGRlbGl2ZXJlZC5cbiAgICovXG4gIHJlYWRvbmx5IG9uRXJyb3I6IEV2ZW50RW1pdHRlcjxhbnk+ID0gbmV3IEV2ZW50RW1pdHRlcihmYWxzZSk7XG5cbiAgY29uc3RydWN0b3Ioe1xuICAgIGVuYWJsZUxvbmdTdGFja1RyYWNlID0gZmFsc2UsXG4gICAgc2hvdWxkQ29hbGVzY2VFdmVudENoYW5nZURldGVjdGlvbiA9IGZhbHNlLFxuICAgIHNob3VsZENvYWxlc2NlUnVuQ2hhbmdlRGV0ZWN0aW9uID0gZmFsc2VcbiAgfSkge1xuICAgIGlmICh0eXBlb2YgWm9uZSA9PSAndW5kZWZpbmVkJykge1xuICAgICAgdGhyb3cgbmV3IFJ1bnRpbWVFcnJvcihcbiAgICAgICAgICBSdW50aW1lRXJyb3JDb2RlLk1JU1NJTkdfWk9ORUpTLFxuICAgICAgICAgIG5nRGV2TW9kZSAmJiBgSW4gdGhpcyBjb25maWd1cmF0aW9uIEFuZ3VsYXIgcmVxdWlyZXMgWm9uZS5qc2ApO1xuICAgIH1cblxuICAgIFpvbmUuYXNzZXJ0Wm9uZVBhdGNoZWQoKTtcbiAgICBjb25zdCBzZWxmID0gdGhpcyBhcyBhbnkgYXMgTmdab25lUHJpdmF0ZTtcbiAgICBzZWxmLl9uZXN0aW5nID0gMDtcblxuICAgIHNlbGYuX291dGVyID0gc2VsZi5faW5uZXIgPSBab25lLmN1cnJlbnQ7XG5cbiAgICAvLyBBc3luY1N0YWNrVGFnZ2luZ1pvbmVTcGVjIHByb3ZpZGVzIGBsaW5rZWQgc3RhY2sgdHJhY2VzYCB0byBzaG93XG4gICAgLy8gd2hlcmUgdGhlIGFzeW5jIG9wZXJhdGlvbiBpcyBzY2hlZHVsZWQuIEZvciBtb3JlIGRldGFpbHMsIHJlZmVyXG4gICAgLy8gdG8gdGhpcyBhcnRpY2xlLCBodHRwczovL2RldmVsb3Blci5jaHJvbWUuY29tL2Jsb2cvZGV2dG9vbHMtYmV0dGVyLWFuZ3VsYXItZGVidWdnaW5nL1xuICAgIC8vIEFuZCB3ZSBvbmx5IGltcG9ydCB0aGlzIEFzeW5jU3RhY2tUYWdnaW5nWm9uZVNwZWMgaW4gZGV2ZWxvcG1lbnQgbW9kZSxcbiAgICAvLyBpbiB0aGUgcHJvZHVjdGlvbiBtb2RlLCB0aGUgQXN5bmNTdGFja1RhZ2dpbmdab25lU3BlYyB3aWxsIGJlIHRyZWUgc2hha2VuIGF3YXkuXG4gICAgaWYgKG5nRGV2TW9kZSkge1xuICAgICAgc2VsZi5faW5uZXIgPSBzZWxmLl9pbm5lci5mb3JrKG5ldyBBc3luY1N0YWNrVGFnZ2luZ1pvbmVTcGVjKCdBbmd1bGFyJykpO1xuICAgIH1cblxuICAgIGlmICgoWm9uZSBhcyBhbnkpWydUYXNrVHJhY2tpbmdab25lU3BlYyddKSB7XG4gICAgICBzZWxmLl9pbm5lciA9IHNlbGYuX2lubmVyLmZvcmsobmV3ICgoWm9uZSBhcyBhbnkpWydUYXNrVHJhY2tpbmdab25lU3BlYyddIGFzIGFueSkpO1xuICAgIH1cblxuICAgIGlmIChlbmFibGVMb25nU3RhY2tUcmFjZSAmJiAoWm9uZSBhcyBhbnkpWydsb25nU3RhY2tUcmFjZVpvbmVTcGVjJ10pIHtcbiAgICAgIHNlbGYuX2lubmVyID0gc2VsZi5faW5uZXIuZm9yaygoWm9uZSBhcyBhbnkpWydsb25nU3RhY2tUcmFjZVpvbmVTcGVjJ10pO1xuICAgIH1cbiAgICAvLyBpZiBzaG91bGRDb2FsZXNjZVJ1bkNoYW5nZURldGVjdGlvbiBpcyB0cnVlLCBhbGwgdGFza3MgaW5jbHVkaW5nIGV2ZW50IHRhc2tzIHdpbGwgYmVcbiAgICAvLyBjb2FsZXNjZWQsIHNvIHNob3VsZENvYWxlc2NlRXZlbnRDaGFuZ2VEZXRlY3Rpb24gb3B0aW9uIGlzIG5vdCBuZWNlc3NhcnkgYW5kIGNhbiBiZSBza2lwcGVkLlxuICAgIHNlbGYuc2hvdWxkQ29hbGVzY2VFdmVudENoYW5nZURldGVjdGlvbiA9XG4gICAgICAgICFzaG91bGRDb2FsZXNjZVJ1bkNoYW5nZURldGVjdGlvbiAmJiBzaG91bGRDb2FsZXNjZUV2ZW50Q2hhbmdlRGV0ZWN0aW9uO1xuICAgIHNlbGYuc2hvdWxkQ29hbGVzY2VSdW5DaGFuZ2VEZXRlY3Rpb24gPSBzaG91bGRDb2FsZXNjZVJ1bkNoYW5nZURldGVjdGlvbjtcbiAgICBzZWxmLmNhbGxiYWNrU2NoZWR1bGVkID0gZmFsc2U7XG4gICAgc2VsZi5zY2hlZHVsZUNhbGxiYWNrID0gZ2V0Q2FsbGJhY2tTY2hlZHVsZXIoKTtcbiAgICBmb3JrSW5uZXJab25lV2l0aEFuZ3VsYXJCZWhhdmlvcihzZWxmKTtcbiAgfVxuXG4gIC8qKlxuICAgIFRoaXMgbWV0aG9kIGNoZWNrcyB3aGV0aGVyIHRoZSBtZXRob2QgY2FsbCBoYXBwZW5zIHdpdGhpbiBhbiBBbmd1bGFyIFpvbmUgaW5zdGFuY2UuXG4gICovXG4gIHN0YXRpYyBpc0luQW5ndWxhclpvbmUoKTogYm9vbGVhbiB7XG4gICAgLy8gWm9uZSBuZWVkcyB0byBiZSBjaGVja2VkLCBiZWNhdXNlIHRoaXMgbWV0aG9kIG1pZ2h0IGJlIGNhbGxlZCBldmVuIHdoZW4gTm9vcE5nWm9uZSBpcyB1c2VkLlxuICAgIHJldHVybiB0eXBlb2YgWm9uZSAhPT0gJ3VuZGVmaW5lZCcgJiYgWm9uZS5jdXJyZW50LmdldCgnaXNBbmd1bGFyWm9uZScpID09PSB0cnVlO1xuICB9XG5cbiAgLyoqXG4gICAgQXNzdXJlcyB0aGF0IHRoZSBtZXRob2QgaXMgY2FsbGVkIHdpdGhpbiB0aGUgQW5ndWxhciBab25lLCBvdGhlcndpc2UgdGhyb3dzIGFuIGVycm9yLlxuICAqL1xuICBzdGF0aWMgYXNzZXJ0SW5Bbmd1bGFyWm9uZSgpOiB2b2lkIHtcbiAgICBpZiAoIU5nWm9uZS5pc0luQW5ndWxhclpvbmUoKSkge1xuICAgICAgdGhyb3cgbmV3IFJ1bnRpbWVFcnJvcihcbiAgICAgICAgICBSdW50aW1lRXJyb3JDb2RlLlVORVhQRUNURURfWk9ORV9TVEFURSxcbiAgICAgICAgICBuZ0Rldk1vZGUgJiYgJ0V4cGVjdGVkIHRvIGJlIGluIEFuZ3VsYXIgWm9uZSwgYnV0IGl0IGlzIG5vdCEnKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICBBc3N1cmVzIHRoYXQgdGhlIG1ldGhvZCBpcyBjYWxsZWQgb3V0c2lkZSBvZiB0aGUgQW5ndWxhciBab25lLCBvdGhlcndpc2UgdGhyb3dzIGFuIGVycm9yLlxuICAqL1xuICBzdGF0aWMgYXNzZXJ0Tm90SW5Bbmd1bGFyWm9uZSgpOiB2b2lkIHtcbiAgICBpZiAoTmdab25lLmlzSW5Bbmd1bGFyWm9uZSgpKSB7XG4gICAgICB0aHJvdyBuZXcgUnVudGltZUVycm9yKFxuICAgICAgICAgIFJ1bnRpbWVFcnJvckNvZGUuVU5FWFBFQ1RFRF9aT05FX1NUQVRFLFxuICAgICAgICAgIG5nRGV2TW9kZSAmJiAnRXhwZWN0ZWQgdG8gbm90IGJlIGluIEFuZ3VsYXIgWm9uZSwgYnV0IGl0IGlzIScpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBFeGVjdXRlcyB0aGUgYGZuYCBmdW5jdGlvbiBzeW5jaHJvbm91c2x5IHdpdGhpbiB0aGUgQW5ndWxhciB6b25lIGFuZCByZXR1cm5zIHZhbHVlIHJldHVybmVkIGJ5XG4gICAqIHRoZSBmdW5jdGlvbi5cbiAgICpcbiAgICogUnVubmluZyBmdW5jdGlvbnMgdmlhIGBydW5gIGFsbG93cyB5b3UgdG8gcmVlbnRlciBBbmd1bGFyIHpvbmUgZnJvbSBhIHRhc2sgdGhhdCB3YXMgZXhlY3V0ZWRcbiAgICogb3V0c2lkZSBvZiB0aGUgQW5ndWxhciB6b25lICh0eXBpY2FsbHkgc3RhcnRlZCB2aWEge0BsaW5rICNydW5PdXRzaWRlQW5ndWxhcn0pLlxuICAgKlxuICAgKiBBbnkgZnV0dXJlIHRhc2tzIG9yIG1pY3JvdGFza3Mgc2NoZWR1bGVkIGZyb20gd2l0aGluIHRoaXMgZnVuY3Rpb24gd2lsbCBjb250aW51ZSBleGVjdXRpbmcgZnJvbVxuICAgKiB3aXRoaW4gdGhlIEFuZ3VsYXIgem9uZS5cbiAgICpcbiAgICogSWYgYSBzeW5jaHJvbm91cyBlcnJvciBoYXBwZW5zIGl0IHdpbGwgYmUgcmV0aHJvd24gYW5kIG5vdCByZXBvcnRlZCB2aWEgYG9uRXJyb3JgLlxuICAgKi9cbiAgcnVuPFQ+KGZuOiAoLi4uYXJnczogYW55W10pID0+IFQsIGFwcGx5VGhpcz86IGFueSwgYXBwbHlBcmdzPzogYW55W10pOiBUIHtcbiAgICByZXR1cm4gKHRoaXMgYXMgYW55IGFzIE5nWm9uZVByaXZhdGUpLl9pbm5lci5ydW4oZm4sIGFwcGx5VGhpcywgYXBwbHlBcmdzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBFeGVjdXRlcyB0aGUgYGZuYCBmdW5jdGlvbiBzeW5jaHJvbm91c2x5IHdpdGhpbiB0aGUgQW5ndWxhciB6b25lIGFzIGEgdGFzayBhbmQgcmV0dXJucyB2YWx1ZVxuICAgKiByZXR1cm5lZCBieSB0aGUgZnVuY3Rpb24uXG4gICAqXG4gICAqIFJ1bm5pbmcgZnVuY3Rpb25zIHZpYSBgcnVuYCBhbGxvd3MgeW91IHRvIHJlZW50ZXIgQW5ndWxhciB6b25lIGZyb20gYSB0YXNrIHRoYXQgd2FzIGV4ZWN1dGVkXG4gICAqIG91dHNpZGUgb2YgdGhlIEFuZ3VsYXIgem9uZSAodHlwaWNhbGx5IHN0YXJ0ZWQgdmlhIHtAbGluayAjcnVuT3V0c2lkZUFuZ3VsYXJ9KS5cbiAgICpcbiAgICogQW55IGZ1dHVyZSB0YXNrcyBvciBtaWNyb3Rhc2tzIHNjaGVkdWxlZCBmcm9tIHdpdGhpbiB0aGlzIGZ1bmN0aW9uIHdpbGwgY29udGludWUgZXhlY3V0aW5nIGZyb21cbiAgICogd2l0aGluIHRoZSBBbmd1bGFyIHpvbmUuXG4gICAqXG4gICAqIElmIGEgc3luY2hyb25vdXMgZXJyb3IgaGFwcGVucyBpdCB3aWxsIGJlIHJldGhyb3duIGFuZCBub3QgcmVwb3J0ZWQgdmlhIGBvbkVycm9yYC5cbiAgICovXG4gIHJ1blRhc2s8VD4oZm46ICguLi5hcmdzOiBhbnlbXSkgPT4gVCwgYXBwbHlUaGlzPzogYW55LCBhcHBseUFyZ3M/OiBhbnlbXSwgbmFtZT86IHN0cmluZyk6IFQge1xuICAgIGNvbnN0IHpvbmUgPSAodGhpcyBhcyBhbnkgYXMgTmdab25lUHJpdmF0ZSkuX2lubmVyO1xuICAgIGNvbnN0IHRhc2sgPSB6b25lLnNjaGVkdWxlRXZlbnRUYXNrKCdOZ1pvbmVFdmVudDogJyArIG5hbWUsIGZuLCBFTVBUWV9QQVlMT0FELCBub29wLCBub29wKTtcbiAgICB0cnkge1xuICAgICAgcmV0dXJuIHpvbmUucnVuVGFzayh0YXNrLCBhcHBseVRoaXMsIGFwcGx5QXJncyk7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIHpvbmUuY2FuY2VsVGFzayh0YXNrKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogU2FtZSBhcyBgcnVuYCwgZXhjZXB0IHRoYXQgc3luY2hyb25vdXMgZXJyb3JzIGFyZSBjYXVnaHQgYW5kIGZvcndhcmRlZCB2aWEgYG9uRXJyb3JgIGFuZCBub3RcbiAgICogcmV0aHJvd24uXG4gICAqL1xuICBydW5HdWFyZGVkPFQ+KGZuOiAoLi4uYXJnczogYW55W10pID0+IFQsIGFwcGx5VGhpcz86IGFueSwgYXBwbHlBcmdzPzogYW55W10pOiBUIHtcbiAgICByZXR1cm4gKHRoaXMgYXMgYW55IGFzIE5nWm9uZVByaXZhdGUpLl9pbm5lci5ydW5HdWFyZGVkKGZuLCBhcHBseVRoaXMsIGFwcGx5QXJncyk7XG4gIH1cblxuICAvKipcbiAgICogRXhlY3V0ZXMgdGhlIGBmbmAgZnVuY3Rpb24gc3luY2hyb25vdXNseSBpbiBBbmd1bGFyJ3MgcGFyZW50IHpvbmUgYW5kIHJldHVybnMgdmFsdWUgcmV0dXJuZWQgYnlcbiAgICogdGhlIGZ1bmN0aW9uLlxuICAgKlxuICAgKiBSdW5uaW5nIGZ1bmN0aW9ucyB2aWEge0BsaW5rICNydW5PdXRzaWRlQW5ndWxhcn0gYWxsb3dzIHlvdSB0byBlc2NhcGUgQW5ndWxhcidzIHpvbmUgYW5kIGRvXG4gICAqIHdvcmsgdGhhdFxuICAgKiBkb2Vzbid0IHRyaWdnZXIgQW5ndWxhciBjaGFuZ2UtZGV0ZWN0aW9uIG9yIGlzIHN1YmplY3QgdG8gQW5ndWxhcidzIGVycm9yIGhhbmRsaW5nLlxuICAgKlxuICAgKiBBbnkgZnV0dXJlIHRhc2tzIG9yIG1pY3JvdGFza3Mgc2NoZWR1bGVkIGZyb20gd2l0aGluIHRoaXMgZnVuY3Rpb24gd2lsbCBjb250aW51ZSBleGVjdXRpbmcgZnJvbVxuICAgKiBvdXRzaWRlIG9mIHRoZSBBbmd1bGFyIHpvbmUuXG4gICAqXG4gICAqIFVzZSB7QGxpbmsgI3J1bn0gdG8gcmVlbnRlciB0aGUgQW5ndWxhciB6b25lIGFuZCBkbyB3b3JrIHRoYXQgdXBkYXRlcyB0aGUgYXBwbGljYXRpb24gbW9kZWwuXG4gICAqL1xuICBydW5PdXRzaWRlQW5ndWxhcjxUPihmbjogKC4uLmFyZ3M6IGFueVtdKSA9PiBUKTogVCB7XG4gICAgcmV0dXJuICh0aGlzIGFzIGFueSBhcyBOZ1pvbmVQcml2YXRlKS5fb3V0ZXIucnVuKGZuKTtcbiAgfVxufVxuXG5jb25zdCBFTVBUWV9QQVlMT0FEID0ge307XG5cbmludGVyZmFjZSBOZ1pvbmVQcml2YXRlIGV4dGVuZHMgTmdab25lIHtcbiAgX291dGVyOiBab25lO1xuICBfaW5uZXI6IFpvbmU7XG4gIF9uZXN0aW5nOiBudW1iZXI7XG4gIF9oYXNQZW5kaW5nTWljcm90YXNrczogYm9vbGVhbjtcblxuICBoYXNQZW5kaW5nTWFjcm90YXNrczogYm9vbGVhbjtcbiAgaGFzUGVuZGluZ01pY3JvdGFza3M6IGJvb2xlYW47XG4gIGNhbGxiYWNrU2NoZWR1bGVkOiBib29sZWFuO1xuICAvKipcbiAgICogQSBmbGFnIHRvIGluZGljYXRlIGlmIE5nWm9uZSBpcyBjdXJyZW50bHkgaW5zaWRlXG4gICAqIGNoZWNrU3RhYmxlIGFuZCB0byBwcmV2ZW50IHJlLWVudHJ5LiBUaGUgZmxhZyBpc1xuICAgKiBuZWVkZWQgYmVjYXVzZSBpdCBpcyBwb3NzaWJsZSB0byBpbnZva2UgdGhlIGNoYW5nZVxuICAgKiBkZXRlY3Rpb24gZnJvbSB3aXRoaW4gY2hhbmdlIGRldGVjdGlvbiBsZWFkaW5nIHRvXG4gICAqIGluY29ycmVjdCBiZWhhdmlvci5cbiAgICpcbiAgICogRm9yIGRldGFpbCwgcGxlYXNlIHJlZmVyIGhlcmUsXG4gICAqIGh0dHBzOi8vZ2l0aHViLmNvbS9hbmd1bGFyL2FuZ3VsYXIvcHVsbC80MDU0MFxuICAgKi9cbiAgaXNDaGVja1N0YWJsZVJ1bm5pbmc6IGJvb2xlYW47XG4gIGlzU3RhYmxlOiBib29sZWFuO1xuICAvKipcbiAgICogT3B0aW9uYWxseSBzcGVjaWZ5IGNvYWxlc2NpbmcgZXZlbnQgY2hhbmdlIGRldGVjdGlvbnMgb3Igbm90LlxuICAgKiBDb25zaWRlciB0aGUgZm9sbG93aW5nIGNhc2UuXG4gICAqXG4gICAqIDxkaXYgKGNsaWNrKT1cImRvU29tZXRoaW5nKClcIj5cbiAgICogICA8YnV0dG9uIChjbGljayk9XCJkb1NvbWV0aGluZ0Vsc2UoKVwiPjwvYnV0dG9uPlxuICAgKiA8L2Rpdj5cbiAgICpcbiAgICogV2hlbiBidXR0b24gaXMgY2xpY2tlZCwgYmVjYXVzZSBvZiB0aGUgZXZlbnQgYnViYmxpbmcsIGJvdGhcbiAgICogZXZlbnQgaGFuZGxlcnMgd2lsbCBiZSBjYWxsZWQgYW5kIDIgY2hhbmdlIGRldGVjdGlvbnMgd2lsbCBiZVxuICAgKiB0cmlnZ2VyZWQuIFdlIGNhbiBjb2FsZXNjZSBzdWNoIGtpbmQgb2YgZXZlbnRzIHRvIHRyaWdnZXJcbiAgICogY2hhbmdlIGRldGVjdGlvbiBvbmx5IG9uY2UuXG4gICAqXG4gICAqIEJ5IGRlZmF1bHQsIHRoaXMgb3B0aW9uIHdpbGwgYmUgZmFsc2UuIFNvIHRoZSBldmVudHMgd2lsbCBub3QgYmVcbiAgICogY29hbGVzY2VkIGFuZCB0aGUgY2hhbmdlIGRldGVjdGlvbiB3aWxsIGJlIHRyaWdnZXJlZCBtdWx0aXBsZSB0aW1lcy5cbiAgICogQW5kIGlmIHRoaXMgb3B0aW9uIGJlIHNldCB0byB0cnVlLCB0aGUgY2hhbmdlIGRldGVjdGlvbiB3aWxsIGJlXG4gICAqIHRyaWdnZXJlZCBhc3luYyBieSBzY2hlZHVsaW5nIGl0IGluIGFuIGFuaW1hdGlvbiBmcmFtZS4gU28gaW4gdGhlIGNhc2UgYWJvdmUsXG4gICAqIHRoZSBjaGFuZ2UgZGV0ZWN0aW9uIHdpbGwgb25seSBiZSB0cmlnZ2VkIG9uY2UuXG4gICAqL1xuICBzaG91bGRDb2FsZXNjZUV2ZW50Q2hhbmdlRGV0ZWN0aW9uOiBib29sZWFuO1xuICAvKipcbiAgICogT3B0aW9uYWxseSBzcGVjaWZ5IGlmIGBOZ1pvbmUjcnVuKClgIG1ldGhvZCBpbnZvY2F0aW9ucyBzaG91bGQgYmUgY29hbGVzY2VkXG4gICAqIGludG8gYSBzaW5nbGUgY2hhbmdlIGRldGVjdGlvbi5cbiAgICpcbiAgICogQ29uc2lkZXIgdGhlIGZvbGxvd2luZyBjYXNlLlxuICAgKlxuICAgKiBmb3IgKGxldCBpID0gMDsgaSA8IDEwOyBpICsrKSB7XG4gICAqICAgbmdab25lLnJ1bigoKSA9PiB7XG4gICAqICAgICAvLyBkbyBzb21ldGhpbmdcbiAgICogICB9KTtcbiAgICogfVxuICAgKlxuICAgKiBUaGlzIGNhc2UgdHJpZ2dlcnMgdGhlIGNoYW5nZSBkZXRlY3Rpb24gbXVsdGlwbGUgdGltZXMuXG4gICAqIFdpdGggbmdab25lUnVuQ29hbGVzY2luZyBvcHRpb25zLCBhbGwgY2hhbmdlIGRldGVjdGlvbnMgaW4gYW4gZXZlbnQgbG9vcHMgdHJpZ2dlciBvbmx5IG9uY2UuXG4gICAqIEluIGFkZGl0aW9uLCB0aGUgY2hhbmdlIGRldGVjdGlvbiBleGVjdXRlcyBpbiByZXF1ZXN0QW5pbWF0aW9uLlxuICAgKlxuICAgKi9cbiAgc2hvdWxkQ29hbGVzY2VSdW5DaGFuZ2VEZXRlY3Rpb246IGJvb2xlYW47XG5cbiAgc2NoZWR1bGVDYWxsYmFjazogKGNhbGxiYWNrOiBGdW5jdGlvbikgPT4gdm9pZDtcblxuICAvLyBDYWNoZSBhICBcImZha2VcIiB0b3AgZXZlbnRUYXNrIHNvIHlvdSBkb24ndCBuZWVkIHRvIHNjaGVkdWxlIGEgbmV3IHRhc2sgZXZlcnlcbiAgLy8gdGltZSB5b3UgcnVuIGEgYGNoZWNrU3RhYmxlYC5cbiAgZmFrZVRvcEV2ZW50VGFzazogVGFzaztcbn1cblxuZnVuY3Rpb24gY2hlY2tTdGFibGUoem9uZTogTmdab25lUHJpdmF0ZSkge1xuICAvLyBUT0RPOiBASmlhTGlQYXNzaW9uLCBzaG91bGQgY2hlY2sgem9uZS5pc0NoZWNrU3RhYmxlUnVubmluZyB0byBwcmV2ZW50XG4gIC8vIHJlLWVudHJ5LiBUaGUgY2FzZSBpczpcbiAgLy9cbiAgLy8gQENvbXBvbmVudCh7Li4ufSlcbiAgLy8gZXhwb3J0IGNsYXNzIEFwcENvbXBvbmVudCB7XG4gIC8vIGNvbnN0cnVjdG9yKHByaXZhdGUgbmdab25lOiBOZ1pvbmUpIHtcbiAgLy8gICB0aGlzLm5nWm9uZS5vblN0YWJsZS5zdWJzY3JpYmUoKCkgPT4ge1xuICAvLyAgICAgdGhpcy5uZ1pvbmUucnVuKCgpID0+IGNvbnNvbGUubG9nKCdzdGFibGUnKTspO1xuICAvLyAgIH0pO1xuICAvLyB9XG4gIC8vXG4gIC8vIFRoZSBvblN0YWJsZSBzdWJzY3JpYmVyIHJ1biBhbm90aGVyIGZ1bmN0aW9uIGluc2lkZSBuZ1pvbmVcbiAgLy8gd2hpY2ggY2F1c2VzIGBjaGVja1N0YWJsZSgpYCByZS1lbnRyeS5cbiAgLy8gQnV0IHRoaXMgZml4IGNhdXNlcyBzb21lIGlzc3VlcyBpbiBnMywgc28gdGhpcyBmaXggd2lsbCBiZVxuICAvLyBsYXVuY2hlZCBpbiBhbm90aGVyIFBSLlxuICBpZiAoem9uZS5fbmVzdGluZyA9PSAwICYmICF6b25lLmhhc1BlbmRpbmdNaWNyb3Rhc2tzICYmICF6b25lLmlzU3RhYmxlKSB7XG4gICAgdHJ5IHtcbiAgICAgIHpvbmUuX25lc3RpbmcrKztcbiAgICAgIHpvbmUub25NaWNyb3Rhc2tFbXB0eS5lbWl0KG51bGwpO1xuICAgIH0gZmluYWxseSB7XG4gICAgICB6b25lLl9uZXN0aW5nLS07XG4gICAgICBpZiAoIXpvbmUuaGFzUGVuZGluZ01pY3JvdGFza3MpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICB6b25lLnJ1bk91dHNpZGVBbmd1bGFyKCgpID0+IHpvbmUub25TdGFibGUuZW1pdChudWxsKSk7XG4gICAgICAgIH0gZmluYWxseSB7XG4gICAgICAgICAgem9uZS5pc1N0YWJsZSA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gZGVsYXlDaGFuZ2VEZXRlY3Rpb25Gb3JFdmVudHMoem9uZTogTmdab25lUHJpdmF0ZSkge1xuICAvKipcbiAgICogV2UgYWxzbyBuZWVkIHRvIGNoZWNrIF9uZXN0aW5nIGhlcmVcbiAgICogQ29uc2lkZXIgdGhlIGZvbGxvd2luZyBjYXNlIHdpdGggc2hvdWxkQ29hbGVzY2VSdW5DaGFuZ2VEZXRlY3Rpb24gPSB0cnVlXG4gICAqXG4gICAqIG5nWm9uZS5ydW4oKCkgPT4ge30pO1xuICAgKiBuZ1pvbmUucnVuKCgpID0+IHt9KTtcbiAgICpcbiAgICogV2Ugd2FudCB0aGUgdHdvIGBuZ1pvbmUucnVuKClgIG9ubHkgdHJpZ2dlciBvbmUgY2hhbmdlIGRldGVjdGlvblxuICAgKiB3aGVuIHNob3VsZENvYWxlc2NlUnVuQ2hhbmdlRGV0ZWN0aW9uIGlzIHRydWUuXG4gICAqIEFuZCBiZWNhdXNlIGluIHRoaXMgY2FzZSwgY2hhbmdlIGRldGVjdGlvbiBydW4gaW4gYXN5bmMgd2F5KHJlcXVlc3RBbmltYXRpb25GcmFtZSksXG4gICAqIHNvIHdlIGFsc28gbmVlZCB0byBjaGVjayB0aGUgX25lc3RpbmcgaGVyZSB0byBwcmV2ZW50IG11bHRpcGxlXG4gICAqIGNoYW5nZSBkZXRlY3Rpb25zLlxuICAgKi9cbiAgaWYgKHpvbmUuaXNDaGVja1N0YWJsZVJ1bm5pbmcgfHwgem9uZS5jYWxsYmFja1NjaGVkdWxlZCkge1xuICAgIHJldHVybjtcbiAgfVxuICB6b25lLmNhbGxiYWNrU2NoZWR1bGVkID0gdHJ1ZTtcbiAgem9uZS5zY2hlZHVsZUNhbGxiYWNrLmNhbGwoZ2xvYmFsLCAoKSA9PiB7XG4gICAgLy8gVGhpcyBpcyBhIHdvcmsgYXJvdW5kIGZvciBodHRwczovL2dpdGh1Yi5jb20vYW5ndWxhci9hbmd1bGFyL2lzc3Vlcy8zNjgzOS5cbiAgICAvLyBUaGUgY29yZSBpc3N1ZSBpcyB0aGF0IHdoZW4gZXZlbnQgY29hbGVzY2luZyBpcyBlbmFibGVkIGl0IGlzIHBvc3NpYmxlIGZvciBtaWNyb3Rhc2tzXG4gICAgLy8gdG8gZ2V0IGZsdXNoZWQgdG9vIGVhcmx5IChBcyBpcyB0aGUgY2FzZSB3aXRoIGBQcm9taXNlLnRoZW5gKSBiZXR3ZWVuIHRoZVxuICAgIC8vIGNvYWxlc2NpbmcgZXZlbnRUYXNrcy5cbiAgICAvL1xuICAgIC8vIFRvIHdvcmthcm91bmQgdGhpcyB3ZSBzY2hlZHVsZSBhIFwiZmFrZVwiIGV2ZW50VGFzayBiZWZvcmUgd2UgcHJvY2VzcyB0aGVcbiAgICAvLyBjb2FsZXNjaW5nIGV2ZW50VGFza3MuIFRoZSBiZW5lZml0IG9mIHRoaXMgaXMgdGhhdCB0aGUgXCJmYWtlXCIgY29udGFpbmVyIGV2ZW50VGFza1xuICAgIC8vICB3aWxsIHByZXZlbnQgdGhlIG1pY3JvdGFza3MgcXVldWUgZnJvbSBnZXR0aW5nIGRyYWluZWQgaW4gYmV0d2VlbiB0aGUgY29hbGVzY2luZ1xuICAgIC8vIGV2ZW50VGFzayBleGVjdXRpb24uXG4gICAgaWYgKCF6b25lLmZha2VUb3BFdmVudFRhc2spIHtcbiAgICAgIHpvbmUuZmFrZVRvcEV2ZW50VGFzayA9IFpvbmUucm9vdC5zY2hlZHVsZUV2ZW50VGFzaygnZmFrZVRvcEV2ZW50VGFzaycsICgpID0+IHtcbiAgICAgICAgem9uZS5jYWxsYmFja1NjaGVkdWxlZCA9IGZhbHNlO1xuICAgICAgICB1cGRhdGVNaWNyb1Rhc2tTdGF0dXMoem9uZSk7XG4gICAgICAgIHpvbmUuaXNDaGVja1N0YWJsZVJ1bm5pbmcgPSB0cnVlO1xuICAgICAgICBjaGVja1N0YWJsZSh6b25lKTtcbiAgICAgICAgem9uZS5pc0NoZWNrU3RhYmxlUnVubmluZyA9IGZhbHNlO1xuICAgICAgfSwgdW5kZWZpbmVkLCAoKSA9PiB7fSwgKCkgPT4ge30pO1xuICAgIH1cbiAgICB6b25lLmZha2VUb3BFdmVudFRhc2suaW52b2tlKCk7XG4gIH0pO1xuICB1cGRhdGVNaWNyb1Rhc2tTdGF0dXMoem9uZSk7XG59XG5cbmZ1bmN0aW9uIGZvcmtJbm5lclpvbmVXaXRoQW5ndWxhckJlaGF2aW9yKHpvbmU6IE5nWm9uZVByaXZhdGUpIHtcbiAgY29uc3QgZGVsYXlDaGFuZ2VEZXRlY3Rpb25Gb3JFdmVudHNEZWxlZ2F0ZSA9ICgpID0+IHtcbiAgICBkZWxheUNoYW5nZURldGVjdGlvbkZvckV2ZW50cyh6b25lKTtcbiAgfTtcbiAgem9uZS5faW5uZXIgPSB6b25lLl9pbm5lci5mb3JrKHtcbiAgICBuYW1lOiAnYW5ndWxhcicsXG4gICAgcHJvcGVydGllczogPGFueT57J2lzQW5ndWxhclpvbmUnOiB0cnVlfSxcbiAgICBvbkludm9rZVRhc2s6XG4gICAgICAgIChkZWxlZ2F0ZTogWm9uZURlbGVnYXRlLCBjdXJyZW50OiBab25lLCB0YXJnZXQ6IFpvbmUsIHRhc2s6IFRhc2ssIGFwcGx5VGhpczogYW55LFxuICAgICAgICAgYXBwbHlBcmdzOiBhbnkpOiBhbnkgPT4ge1xuICAgICAgICAgIGlmIChzaG91bGRCZUlnbm9yZWRCeVpvbmUoYXBwbHlBcmdzKSkge1xuICAgICAgICAgICAgcmV0dXJuIGRlbGVnYXRlLmludm9rZVRhc2sodGFyZ2V0LCB0YXNrLCBhcHBseVRoaXMsIGFwcGx5QXJncyk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIG9uRW50ZXIoem9uZSk7XG4gICAgICAgICAgICByZXR1cm4gZGVsZWdhdGUuaW52b2tlVGFzayh0YXJnZXQsIHRhc2ssIGFwcGx5VGhpcywgYXBwbHlBcmdzKTtcbiAgICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgICAgaWYgKCh6b25lLnNob3VsZENvYWxlc2NlRXZlbnRDaGFuZ2VEZXRlY3Rpb24gJiYgdGFzay50eXBlID09PSAnZXZlbnRUYXNrJykgfHxcbiAgICAgICAgICAgICAgICB6b25lLnNob3VsZENvYWxlc2NlUnVuQ2hhbmdlRGV0ZWN0aW9uKSB7XG4gICAgICAgICAgICAgIGRlbGF5Q2hhbmdlRGV0ZWN0aW9uRm9yRXZlbnRzRGVsZWdhdGUoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIG9uTGVhdmUoem9uZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgb25JbnZva2U6XG4gICAgICAgIChkZWxlZ2F0ZTogWm9uZURlbGVnYXRlLCBjdXJyZW50OiBab25lLCB0YXJnZXQ6IFpvbmUsIGNhbGxiYWNrOiBGdW5jdGlvbiwgYXBwbHlUaGlzOiBhbnksXG4gICAgICAgICBhcHBseUFyZ3M/OiBhbnlbXSwgc291cmNlPzogc3RyaW5nKTogYW55ID0+IHtcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgb25FbnRlcih6b25lKTtcbiAgICAgICAgICAgIHJldHVybiBkZWxlZ2F0ZS5pbnZva2UodGFyZ2V0LCBjYWxsYmFjaywgYXBwbHlUaGlzLCBhcHBseUFyZ3MsIHNvdXJjZSk7XG4gICAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICAgIGlmICh6b25lLnNob3VsZENvYWxlc2NlUnVuQ2hhbmdlRGV0ZWN0aW9uKSB7XG4gICAgICAgICAgICAgIGRlbGF5Q2hhbmdlRGV0ZWN0aW9uRm9yRXZlbnRzRGVsZWdhdGUoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIG9uTGVhdmUoem9uZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgb25IYXNUYXNrOlxuICAgICAgICAoZGVsZWdhdGU6IFpvbmVEZWxlZ2F0ZSwgY3VycmVudDogWm9uZSwgdGFyZ2V0OiBab25lLCBoYXNUYXNrU3RhdGU6IEhhc1Rhc2tTdGF0ZSkgPT4ge1xuICAgICAgICAgIGRlbGVnYXRlLmhhc1Rhc2sodGFyZ2V0LCBoYXNUYXNrU3RhdGUpO1xuICAgICAgICAgIGlmIChjdXJyZW50ID09PSB0YXJnZXQpIHtcbiAgICAgICAgICAgIC8vIFdlIGFyZSBvbmx5IGludGVyZXN0ZWQgaW4gaGFzVGFzayBldmVudHMgd2hpY2ggb3JpZ2luYXRlIGZyb20gb3VyIHpvbmVcbiAgICAgICAgICAgIC8vIChBIGNoaWxkIGhhc1Rhc2sgZXZlbnQgaXMgbm90IGludGVyZXN0aW5nIHRvIHVzKVxuICAgICAgICAgICAgaWYgKGhhc1Rhc2tTdGF0ZS5jaGFuZ2UgPT0gJ21pY3JvVGFzaycpIHtcbiAgICAgICAgICAgICAgem9uZS5faGFzUGVuZGluZ01pY3JvdGFza3MgPSBoYXNUYXNrU3RhdGUubWljcm9UYXNrO1xuICAgICAgICAgICAgICB1cGRhdGVNaWNyb1Rhc2tTdGF0dXMoem9uZSk7XG4gICAgICAgICAgICAgIGNoZWNrU3RhYmxlKHpvbmUpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChoYXNUYXNrU3RhdGUuY2hhbmdlID09ICdtYWNyb1Rhc2snKSB7XG4gICAgICAgICAgICAgIHpvbmUuaGFzUGVuZGluZ01hY3JvdGFza3MgPSBoYXNUYXNrU3RhdGUubWFjcm9UYXNrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgIG9uSGFuZGxlRXJyb3I6IChkZWxlZ2F0ZTogWm9uZURlbGVnYXRlLCBjdXJyZW50OiBab25lLCB0YXJnZXQ6IFpvbmUsIGVycm9yOiBhbnkpOiBib29sZWFuID0+IHtcbiAgICAgIGRlbGVnYXRlLmhhbmRsZUVycm9yKHRhcmdldCwgZXJyb3IpO1xuICAgICAgem9uZS5ydW5PdXRzaWRlQW5ndWxhcigoKSA9PiB6b25lLm9uRXJyb3IuZW1pdChlcnJvcikpO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfSk7XG59XG5cbmZ1bmN0aW9uIHVwZGF0ZU1pY3JvVGFza1N0YXR1cyh6b25lOiBOZ1pvbmVQcml2YXRlKSB7XG4gIGlmICh6b25lLl9oYXNQZW5kaW5nTWljcm90YXNrcyB8fFxuICAgICAgKCh6b25lLnNob3VsZENvYWxlc2NlRXZlbnRDaGFuZ2VEZXRlY3Rpb24gfHwgem9uZS5zaG91bGRDb2FsZXNjZVJ1bkNoYW5nZURldGVjdGlvbikgJiZcbiAgICAgICB6b25lLmNhbGxiYWNrU2NoZWR1bGVkID09PSB0cnVlKSkge1xuICAgIHpvbmUuaGFzUGVuZGluZ01pY3JvdGFza3MgPSB0cnVlO1xuICB9IGVsc2Uge1xuICAgIHpvbmUuaGFzUGVuZGluZ01pY3JvdGFza3MgPSBmYWxzZTtcbiAgfVxufVxuXG5mdW5jdGlvbiBvbkVudGVyKHpvbmU6IE5nWm9uZVByaXZhdGUpIHtcbiAgem9uZS5fbmVzdGluZysrO1xuICBpZiAoem9uZS5pc1N0YWJsZSkge1xuICAgIHpvbmUuaXNTdGFibGUgPSBmYWxzZTtcbiAgICB6b25lLm9uVW5zdGFibGUuZW1pdChudWxsKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBvbkxlYXZlKHpvbmU6IE5nWm9uZVByaXZhdGUpIHtcbiAgem9uZS5fbmVzdGluZy0tO1xuICBjaGVja1N0YWJsZSh6b25lKTtcbn1cblxuLyoqXG4gKiBQcm92aWRlcyBhIG5vb3AgaW1wbGVtZW50YXRpb24gb2YgYE5nWm9uZWAgd2hpY2ggZG9lcyBub3RoaW5nLiBUaGlzIHpvbmUgcmVxdWlyZXMgZXhwbGljaXQgY2FsbHNcbiAqIHRvIGZyYW1ld29yayB0byBwZXJmb3JtIHJlbmRlcmluZy5cbiAqL1xuZXhwb3J0IGNsYXNzIE5vb3BOZ1pvbmUgaW1wbGVtZW50cyBOZ1pvbmUge1xuICByZWFkb25seSBoYXNQZW5kaW5nTWljcm90YXNrcyA9IGZhbHNlO1xuICByZWFkb25seSBoYXNQZW5kaW5nTWFjcm90YXNrcyA9IGZhbHNlO1xuICByZWFkb25seSBpc1N0YWJsZSA9IHRydWU7XG4gIHJlYWRvbmx5IG9uVW5zdGFibGUgPSBuZXcgRXZlbnRFbWl0dGVyPGFueT4oKTtcbiAgcmVhZG9ubHkgb25NaWNyb3Rhc2tFbXB0eSA9IG5ldyBFdmVudEVtaXR0ZXI8YW55PigpO1xuICByZWFkb25seSBvblN0YWJsZSA9IG5ldyBFdmVudEVtaXR0ZXI8YW55PigpO1xuICByZWFkb25seSBvbkVycm9yID0gbmV3IEV2ZW50RW1pdHRlcjxhbnk+KCk7XG5cbiAgcnVuPFQ+KGZuOiAoLi4uYXJnczogYW55W10pID0+IFQsIGFwcGx5VGhpcz86IGFueSwgYXBwbHlBcmdzPzogYW55KTogVCB7XG4gICAgcmV0dXJuIGZuLmFwcGx5KGFwcGx5VGhpcywgYXBwbHlBcmdzKTtcbiAgfVxuXG4gIHJ1bkd1YXJkZWQ8VD4oZm46ICguLi5hcmdzOiBhbnlbXSkgPT4gYW55LCBhcHBseVRoaXM/OiBhbnksIGFwcGx5QXJncz86IGFueSk6IFQge1xuICAgIHJldHVybiBmbi5hcHBseShhcHBseVRoaXMsIGFwcGx5QXJncyk7XG4gIH1cblxuICBydW5PdXRzaWRlQW5ndWxhcjxUPihmbjogKC4uLmFyZ3M6IGFueVtdKSA9PiBUKTogVCB7XG4gICAgcmV0dXJuIGZuKCk7XG4gIH1cblxuICBydW5UYXNrPFQ+KGZuOiAoLi4uYXJnczogYW55W10pID0+IFQsIGFwcGx5VGhpcz86IGFueSwgYXBwbHlBcmdzPzogYW55LCBuYW1lPzogc3RyaW5nKTogVCB7XG4gICAgcmV0dXJuIGZuLmFwcGx5KGFwcGx5VGhpcywgYXBwbHlBcmdzKTtcbiAgfVxufVxuXG5cbmZ1bmN0aW9uIHNob3VsZEJlSWdub3JlZEJ5Wm9uZShhcHBseUFyZ3M6IHVua25vd24pOiBib29sZWFuIHtcbiAgaWYgKCFBcnJheS5pc0FycmF5KGFwcGx5QXJncykpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICAvLyBXZSBzaG91bGQgb25seSBldmVyIGdldCAxIGFyZyBwYXNzZWQgdGhyb3VnaCB0byBpbnZva2VUYXNrLlxuICAvLyBTaG9ydCBjaXJjdWl0IGhlcmUgaW5jYXNlIHRoYXQgYmVoYXZpb3IgY2hhbmdlcy5cbiAgaWYgKGFwcGx5QXJncy5sZW5ndGggIT09IDEpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICAvLyBQcmV2ZW50IHRyaWdnZXJpbmcgY2hhbmdlIGRldGVjdGlvbiB3aGVuIHRoZSBfX2lnbm9yZV9uZ196b25lX18gZmxhZyBpcyBkZXRlY3RlZC5cbiAgcmV0dXJuIGFwcGx5QXJnc1swXS5kYXRhPy5bJ19faWdub3JlX25nX3pvbmVfXyddID09PSB0cnVlO1xufVxuXG5cbi8vIFNldCBvZiBvcHRpb25zIHJlY29nbml6ZWQgYnkgdGhlIE5nWm9uZS5cbmV4cG9ydCBpbnRlcmZhY2UgSW50ZXJuYWxOZ1pvbmVPcHRpb25zIHtcbiAgZW5hYmxlTG9uZ1N0YWNrVHJhY2U6IGJvb2xlYW47XG4gIHNob3VsZENvYWxlc2NlRXZlbnRDaGFuZ2VEZXRlY3Rpb246IGJvb2xlYW47XG4gIHNob3VsZENvYWxlc2NlUnVuQ2hhbmdlRGV0ZWN0aW9uOiBib29sZWFuO1xufVxuXG5cbmV4cG9ydCBmdW5jdGlvbiBnZXROZ1pvbmUoXG4gICAgbmdab25lVG9Vc2U6IE5nWm9uZXwnem9uZS5qcyd8J25vb3AnID0gJ3pvbmUuanMnLCBvcHRpb25zOiBJbnRlcm5hbE5nWm9uZU9wdGlvbnMpOiBOZ1pvbmUge1xuICBpZiAobmdab25lVG9Vc2UgPT09ICdub29wJykge1xuICAgIHJldHVybiBuZXcgTm9vcE5nWm9uZSgpO1xuICB9XG4gIGlmIChuZ1pvbmVUb1VzZSA9PT0gJ3pvbmUuanMnKSB7XG4gICAgcmV0dXJuIG5ldyBOZ1pvbmUob3B0aW9ucyk7XG4gIH1cbiAgcmV0dXJuIG5nWm9uZVRvVXNlO1xufVxuIl19