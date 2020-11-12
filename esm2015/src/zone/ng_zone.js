/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { EventEmitter } from '../event_emitter';
import { global } from '../util/global';
import { getNativeRequestAnimationFrame } from '../util/raf';
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
    constructor({ enableLongStackTrace = false, shouldCoalesceEventChangeDetection = false }) {
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
            throw new Error(`In this configuration Angular requires Zone.js`);
        }
        Zone.assertZonePatched();
        const self = this;
        self._nesting = 0;
        self._outer = self._inner = Zone.current;
        if (Zone['TaskTrackingZoneSpec']) {
            self._inner = self._inner.fork(new Zone['TaskTrackingZoneSpec']);
        }
        if (enableLongStackTrace && Zone['longStackTraceZoneSpec']) {
            self._inner = self._inner.fork(Zone['longStackTraceZoneSpec']);
        }
        self.shouldCoalesceEventChangeDetection = shouldCoalesceEventChangeDetection;
        self.lastRequestAnimationFrameId = -1;
        self.nativeRequestAnimationFrame = getNativeRequestAnimationFrame().nativeRequestAnimationFrame;
        forkInnerZoneWithAngularBehavior(self);
    }
    static isInAngularZone() {
        return Zone.current.get('isAngularZone') === true;
    }
    static assertInAngularZone() {
        if (!NgZone.isInAngularZone()) {
            throw new Error('Expected to be in Angular Zone, but it is not!');
        }
    }
    static assertNotInAngularZone() {
        if (NgZone.isInAngularZone()) {
            throw new Error('Expected to not be in Angular Zone, but it is!');
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
function noop() { }
const EMPTY_PAYLOAD = {};
function checkStable(zone) {
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
    if (zone.lastRequestAnimationFrameId !== -1) {
        return;
    }
    zone.lastRequestAnimationFrameId = zone.nativeRequestAnimationFrame.call(global, () => {
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
                zone.lastRequestAnimationFrameId = -1;
                updateMicroTaskStatus(zone);
                checkStable(zone);
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
    const maybeDelayChangeDetection = !!zone.shouldCoalesceEventChangeDetection &&
        zone.nativeRequestAnimationFrame && delayChangeDetectionForEventsDelegate;
    zone._inner = zone._inner.fork({
        name: 'angular',
        properties: { 'isAngularZone': true, 'maybeDelayChangeDetection': maybeDelayChangeDetection },
        onInvokeTask: (delegate, current, target, task, applyThis, applyArgs) => {
            try {
                onEnter(zone);
                return delegate.invokeTask(target, task, applyThis, applyArgs);
            }
            finally {
                if (maybeDelayChangeDetection && task.type === 'eventTask') {
                    maybeDelayChangeDetection();
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
        (zone.shouldCoalesceEventChangeDetection && zone.lastRequestAnimationFrameId !== -1)) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmdfem9uZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3pvbmUvbmdfem9uZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQUMsWUFBWSxFQUFDLE1BQU0sa0JBQWtCLENBQUM7QUFDOUMsT0FBTyxFQUFDLE1BQU0sRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBQ3RDLE9BQU8sRUFBQyw4QkFBOEIsRUFBQyxNQUFNLGFBQWEsQ0FBQztBQUczRDs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztHQXlFRztBQUNILE1BQU0sT0FBTyxNQUFNO0lBa0NqQixZQUFZLEVBQUMsb0JBQW9CLEdBQUcsS0FBSyxFQUFFLGtDQUFrQyxHQUFHLEtBQUssRUFBQztRQWpDN0UseUJBQW9CLEdBQVksS0FBSyxDQUFDO1FBQ3RDLHlCQUFvQixHQUFZLEtBQUssQ0FBQztRQUUvQzs7V0FFRztRQUNNLGFBQVEsR0FBWSxJQUFJLENBQUM7UUFFbEM7O1dBRUc7UUFDTSxlQUFVLEdBQXNCLElBQUksWUFBWSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBRWpFOzs7O1dBSUc7UUFDTSxxQkFBZ0IsR0FBc0IsSUFBSSxZQUFZLENBQUMsS0FBSyxDQUFDLENBQUM7UUFFdkU7Ozs7V0FJRztRQUNNLGFBQVEsR0FBc0IsSUFBSSxZQUFZLENBQUMsS0FBSyxDQUFDLENBQUM7UUFFL0Q7O1dBRUc7UUFDTSxZQUFPLEdBQXNCLElBQUksWUFBWSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBSTVELElBQUksT0FBTyxJQUFJLElBQUksV0FBVyxFQUFFO1lBQzlCLE1BQU0sSUFBSSxLQUFLLENBQUMsZ0RBQWdELENBQUMsQ0FBQztTQUNuRTtRQUVELElBQUksQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO1FB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Q2pELFlBQU8sR0FBc0IsSUFBSSxZQUFZLEVBQUUsQ0FBQztJQWlCM0QsQ0FBQztJQWZDLEdBQUcsQ0FBSSxFQUF5QixFQUFFLFNBQWUsRUFBRSxTQUFlO1FBQ2hFLE9BQU8sRUFBRSxDQUFDLEtBQUssQ0FBQyxTQUFTLEVBQUUsU0FBUyxDQUFDLENBQUM7SUFDeEMsQ0FBQztJQUVELFVBQVUsQ0FBSSxFQUEyQixFQUFFLFNBQWUsRUFBRSxTQUFlO1FBQ3pFLE9BQU8sRUFBRSxDQUFDLEtBQUssQ0FBQyxTQUFTLEVBQUUsU0FBUyxDQUFDLENBQUM7SUFDeEMsQ0FBQztJQUVELGlCQUFpQixDQUFJLEVBQXlCO1FBQzVDLE9BQU8sRUFBRSxFQUFFLENBQUM7SUFDZCxDQUFDO0lBRUQsT0FBTyxDQUFJLEVBQXlCLEVBQUUsU0FBZSxFQUFFLFNBQWUsRUFBRSxJQUFhO1FBQ25GLE9BQU8sRUFBRSxDQUFDLEtBQUssQ0FBQyxTQUFTLEVBQUUsU0FBUyxDQUFDLENBQUM7SUFDeEMsQ0FBQztDQUNGIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7RXZlbnRFbWl0dGVyfSBmcm9tICcuLi9ldmVudF9lbWl0dGVyJztcbmltcG9ydCB7Z2xvYmFsfSBmcm9tICcuLi91dGlsL2dsb2JhbCc7XG5pbXBvcnQge2dldE5hdGl2ZVJlcXVlc3RBbmltYXRpb25GcmFtZX0gZnJvbSAnLi4vdXRpbC9yYWYnO1xuXG5cbi8qKlxuICogQW4gaW5qZWN0YWJsZSBzZXJ2aWNlIGZvciBleGVjdXRpbmcgd29yayBpbnNpZGUgb3Igb3V0c2lkZSBvZiB0aGUgQW5ndWxhciB6b25lLlxuICpcbiAqIFRoZSBtb3N0IGNvbW1vbiB1c2Ugb2YgdGhpcyBzZXJ2aWNlIGlzIHRvIG9wdGltaXplIHBlcmZvcm1hbmNlIHdoZW4gc3RhcnRpbmcgYSB3b3JrIGNvbnNpc3Rpbmcgb2ZcbiAqIG9uZSBvciBtb3JlIGFzeW5jaHJvbm91cyB0YXNrcyB0aGF0IGRvbid0IHJlcXVpcmUgVUkgdXBkYXRlcyBvciBlcnJvciBoYW5kbGluZyB0byBiZSBoYW5kbGVkIGJ5XG4gKiBBbmd1bGFyLiBTdWNoIHRhc2tzIGNhbiBiZSBraWNrZWQgb2ZmIHZpYSB7QGxpbmsgI3J1bk91dHNpZGVBbmd1bGFyfSBhbmQgaWYgbmVlZGVkLCB0aGVzZSB0YXNrc1xuICogY2FuIHJlZW50ZXIgdGhlIEFuZ3VsYXIgem9uZSB2aWEge0BsaW5rICNydW59LlxuICpcbiAqIDwhLS0gVE9ETzogYWRkL2ZpeCBsaW5rcyB0bzpcbiAqICAgLSBkb2NzIGV4cGxhaW5pbmcgem9uZXMgYW5kIHRoZSB1c2Ugb2Ygem9uZXMgaW4gQW5ndWxhciBhbmQgY2hhbmdlLWRldGVjdGlvblxuICogICAtIGxpbmsgdG8gcnVuT3V0c2lkZUFuZ3VsYXIvcnVuICh0aHJvdWdob3V0IHRoaXMgZmlsZSEpXG4gKiAgIC0tPlxuICpcbiAqIEB1c2FnZU5vdGVzXG4gKiAjIyMgRXhhbXBsZVxuICpcbiAqIGBgYFxuICogaW1wb3J0IHtDb21wb25lbnQsIE5nWm9uZX0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG4gKiBpbXBvcnQge05nSWZ9IGZyb20gJ0Bhbmd1bGFyL2NvbW1vbic7XG4gKlxuICogQENvbXBvbmVudCh7XG4gKiAgIHNlbGVjdG9yOiAnbmctem9uZS1kZW1vJyxcbiAqICAgdGVtcGxhdGU6IGBcbiAqICAgICA8aDI+RGVtbzogTmdab25lPC9oMj5cbiAqXG4gKiAgICAgPHA+UHJvZ3Jlc3M6IHt7cHJvZ3Jlc3N9fSU8L3A+XG4gKiAgICAgPHAgKm5nSWY9XCJwcm9ncmVzcyA+PSAxMDBcIj5Eb25lIHByb2Nlc3Npbmcge3tsYWJlbH19IG9mIEFuZ3VsYXIgem9uZSE8L3A+XG4gKlxuICogICAgIDxidXR0b24gKGNsaWNrKT1cInByb2Nlc3NXaXRoaW5Bbmd1bGFyWm9uZSgpXCI+UHJvY2VzcyB3aXRoaW4gQW5ndWxhciB6b25lPC9idXR0b24+XG4gKiAgICAgPGJ1dHRvbiAoY2xpY2spPVwicHJvY2Vzc091dHNpZGVPZkFuZ3VsYXJab25lKClcIj5Qcm9jZXNzIG91dHNpZGUgb2YgQW5ndWxhciB6b25lPC9idXR0b24+XG4gKiAgIGAsXG4gKiB9KVxuICogZXhwb3J0IGNsYXNzIE5nWm9uZURlbW8ge1xuICogICBwcm9ncmVzczogbnVtYmVyID0gMDtcbiAqICAgbGFiZWw6IHN0cmluZztcbiAqXG4gKiAgIGNvbnN0cnVjdG9yKHByaXZhdGUgX25nWm9uZTogTmdab25lKSB7fVxuICpcbiAqICAgLy8gTG9vcCBpbnNpZGUgdGhlIEFuZ3VsYXIgem9uZVxuICogICAvLyBzbyB0aGUgVUkgRE9FUyByZWZyZXNoIGFmdGVyIGVhY2ggc2V0VGltZW91dCBjeWNsZVxuICogICBwcm9jZXNzV2l0aGluQW5ndWxhclpvbmUoKSB7XG4gKiAgICAgdGhpcy5sYWJlbCA9ICdpbnNpZGUnO1xuICogICAgIHRoaXMucHJvZ3Jlc3MgPSAwO1xuICogICAgIHRoaXMuX2luY3JlYXNlUHJvZ3Jlc3MoKCkgPT4gY29uc29sZS5sb2coJ0luc2lkZSBEb25lIScpKTtcbiAqICAgfVxuICpcbiAqICAgLy8gTG9vcCBvdXRzaWRlIG9mIHRoZSBBbmd1bGFyIHpvbmVcbiAqICAgLy8gc28gdGhlIFVJIERPRVMgTk9UIHJlZnJlc2ggYWZ0ZXIgZWFjaCBzZXRUaW1lb3V0IGN5Y2xlXG4gKiAgIHByb2Nlc3NPdXRzaWRlT2ZBbmd1bGFyWm9uZSgpIHtcbiAqICAgICB0aGlzLmxhYmVsID0gJ291dHNpZGUnO1xuICogICAgIHRoaXMucHJvZ3Jlc3MgPSAwO1xuICogICAgIHRoaXMuX25nWm9uZS5ydW5PdXRzaWRlQW5ndWxhcigoKSA9PiB7XG4gKiAgICAgICB0aGlzLl9pbmNyZWFzZVByb2dyZXNzKCgpID0+IHtcbiAqICAgICAgICAgLy8gcmVlbnRlciB0aGUgQW5ndWxhciB6b25lIGFuZCBkaXNwbGF5IGRvbmVcbiAqICAgICAgICAgdGhpcy5fbmdab25lLnJ1bigoKSA9PiB7IGNvbnNvbGUubG9nKCdPdXRzaWRlIERvbmUhJyk7IH0pO1xuICogICAgICAgfSk7XG4gKiAgICAgfSk7XG4gKiAgIH1cbiAqXG4gKiAgIF9pbmNyZWFzZVByb2dyZXNzKGRvbmVDYWxsYmFjazogKCkgPT4gdm9pZCkge1xuICogICAgIHRoaXMucHJvZ3Jlc3MgKz0gMTtcbiAqICAgICBjb25zb2xlLmxvZyhgQ3VycmVudCBwcm9ncmVzczogJHt0aGlzLnByb2dyZXNzfSVgKTtcbiAqXG4gKiAgICAgaWYgKHRoaXMucHJvZ3Jlc3MgPCAxMDApIHtcbiAqICAgICAgIHdpbmRvdy5zZXRUaW1lb3V0KCgpID0+IHRoaXMuX2luY3JlYXNlUHJvZ3Jlc3MoZG9uZUNhbGxiYWNrKSwgMTApO1xuICogICAgIH0gZWxzZSB7XG4gKiAgICAgICBkb25lQ2FsbGJhY2soKTtcbiAqICAgICB9XG4gKiAgIH1cbiAqIH1cbiAqIGBgYFxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGNsYXNzIE5nWm9uZSB7XG4gIHJlYWRvbmx5IGhhc1BlbmRpbmdNYWNyb3Rhc2tzOiBib29sZWFuID0gZmFsc2U7XG4gIHJlYWRvbmx5IGhhc1BlbmRpbmdNaWNyb3Rhc2tzOiBib29sZWFuID0gZmFsc2U7XG5cbiAgLyoqXG4gICAqIFdoZXRoZXIgdGhlcmUgYXJlIG5vIG91dHN0YW5kaW5nIG1pY3JvdGFza3Mgb3IgbWFjcm90YXNrcy5cbiAgICovXG4gIHJlYWRvbmx5IGlzU3RhYmxlOiBib29sZWFuID0gdHJ1ZTtcblxuICAvKipcbiAgICogTm90aWZpZXMgd2hlbiBjb2RlIGVudGVycyBBbmd1bGFyIFpvbmUuIFRoaXMgZ2V0cyBmaXJlZCBmaXJzdCBvbiBWTSBUdXJuLlxuICAgKi9cbiAgcmVhZG9ubHkgb25VbnN0YWJsZTogRXZlbnRFbWl0dGVyPGFueT4gPSBuZXcgRXZlbnRFbWl0dGVyKGZhbHNlKTtcblxuICAvKipcbiAgICogTm90aWZpZXMgd2hlbiB0aGVyZSBpcyBubyBtb3JlIG1pY3JvdGFza3MgZW5xdWV1ZWQgaW4gdGhlIGN1cnJlbnQgVk0gVHVybi5cbiAgICogVGhpcyBpcyBhIGhpbnQgZm9yIEFuZ3VsYXIgdG8gZG8gY2hhbmdlIGRldGVjdGlvbiwgd2hpY2ggbWF5IGVucXVldWUgbW9yZSBtaWNyb3Rhc2tzLlxuICAgKiBGb3IgdGhpcyByZWFzb24gdGhpcyBldmVudCBjYW4gZmlyZSBtdWx0aXBsZSB0aW1lcyBwZXIgVk0gVHVybi5cbiAgICovXG4gIHJlYWRvbmx5IG9uTWljcm90YXNrRW1wdHk6IEV2ZW50RW1pdHRlcjxhbnk+ID0gbmV3IEV2ZW50RW1pdHRlcihmYWxzZSk7XG5cbiAgLyoqXG4gICAqIE5vdGlmaWVzIHdoZW4gdGhlIGxhc3QgYG9uTWljcm90YXNrRW1wdHlgIGhhcyBydW4gYW5kIHRoZXJlIGFyZSBubyBtb3JlIG1pY3JvdGFza3MsIHdoaWNoXG4gICAqIGltcGxpZXMgd2UgYXJlIGFib3V0IHRvIHJlbGlucXVpc2ggVk0gdHVybi5cbiAgICogVGhpcyBldmVudCBnZXRzIGNhbGxlZCBqdXN0IG9uY2UuXG4gICAqL1xuICByZWFkb25seSBvblN0YWJsZTogRXZlbnRFbWl0dGVyPGFueT4gPSBuZXcgRXZlbnRFbWl0dGVyKGZhbHNlKTtcblxuICAvKipcbiAgICogTm90aWZpZXMgdGhhdCBhbiBlcnJvciBoYXMgYmVlbiBkZWxpdmVyZWQuXG4gICAqL1xuICByZWFkb25seSBvbkVycm9yOiBFdmVudEVtaXR0ZXI8YW55PiA9IG5ldyBFdmVudEVtaXR0ZXIoZmFsc2UpO1xuXG5cbiAgY29uc3RydWN0b3Ioe2VuYWJsZUxvbmdTdGFja1RyYWNlID0gZmFsc2UsIHNob3VsZENvYWxlc2NlRXZlbnRDaGFuZ2VEZXRlY3Rpb24gPSBmYWxzZX0pIHtcbiAgICBpZiAodHlwZW9mIFpvbmUgPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgSW4gdGhpcyBjb25maWd1cmF0aW9uIEFuZ3VsYXIgcmVxdWlyZXMgWm9uZS5qc2ApO1xuICAgIH1cblxuICAgIFpvbmUuYXNzZXJ0Wm9uZVBhdGNoZWQoKTtcbiAgICBjb25zdCBzZWxmID0gdGhpcyBhcyBhbnkgYXMgTmdab25lUHJpdmF0ZTtcbiAgICBzZWxmLl9uZXN0aW5nID0gMDtcblxuICAgIHNlbGYuX291dGVyID0gc2VsZi5faW5uZXIgPSBab25lLmN1cnJlbnQ7XG5cbiAgICBpZiAoKFpvbmUgYXMgYW55KVsnVGFza1RyYWNraW5nWm9uZVNwZWMnXSkge1xuICAgICAgc2VsZi5faW5uZXIgPSBzZWxmLl9pbm5lci5mb3JrKG5ldyAoKFpvbmUgYXMgYW55KVsnVGFza1RyYWNraW5nWm9uZVNwZWMnXSBhcyBhbnkpKTtcbiAgICB9XG5cbiAgICBpZiAoZW5hYmxlTG9uZ1N0YWNrVHJhY2UgJiYgKFpvbmUgYXMgYW55KVsnbG9uZ1N0YWNrVHJhY2Vab25lU3BlYyddKSB7XG4gICAgICBzZWxmLl9pbm5lciA9IHNlbGYuX2lubmVyLmZvcmsoKFpvbmUgYXMgYW55KVsnbG9uZ1N0YWNrVHJhY2Vab25lU3BlYyddKTtcbiAgICB9XG5cbiAgICBzZWxmLnNob3VsZENvYWxlc2NlRXZlbnRDaGFuZ2VEZXRlY3Rpb24gPSBzaG91bGRDb2FsZXNjZUV2ZW50Q2hhbmdlRGV0ZWN0aW9uO1xuICAgIHNlbGYubGFzdFJlcXVlc3RBbmltYXRpb25GcmFtZUlkID0gLTE7XG4gICAgc2VsZi5uYXRpdmVSZXF1ZXN0QW5pbWF0aW9uRnJhbWUgPSBnZXROYXRpdmVSZXF1ZXN0QW5pbWF0aW9uRnJhbWUoKS5uYXRpdmVSZXF1ZXN0QW5pbWF0aW9uRnJhbWU7XG4gICAgZm9ya0lubmVyWm9uZVdpdGhBbmd1bGFyQmVoYXZpb3Ioc2VsZik7XG4gIH1cblxuICBzdGF0aWMgaXNJbkFuZ3VsYXJab25lKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiBab25lLmN1cnJlbnQuZ2V0KCdpc0FuZ3VsYXJab25lJykgPT09IHRydWU7XG4gIH1cblxuICBzdGF0aWMgYXNzZXJ0SW5Bbmd1bGFyWm9uZSgpOiB2b2lkIHtcbiAgICBpZiAoIU5nWm9uZS5pc0luQW5ndWxhclpvbmUoKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdFeHBlY3RlZCB0byBiZSBpbiBBbmd1bGFyIFpvbmUsIGJ1dCBpdCBpcyBub3QhJyk7XG4gICAgfVxuICB9XG5cbiAgc3RhdGljIGFzc2VydE5vdEluQW5ndWxhclpvbmUoKTogdm9pZCB7XG4gICAgaWYgKE5nWm9uZS5pc0luQW5ndWxhclpvbmUoKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdFeHBlY3RlZCB0byBub3QgYmUgaW4gQW5ndWxhciBab25lLCBidXQgaXQgaXMhJyk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEV4ZWN1dGVzIHRoZSBgZm5gIGZ1bmN0aW9uIHN5bmNocm9ub3VzbHkgd2l0aGluIHRoZSBBbmd1bGFyIHpvbmUgYW5kIHJldHVybnMgdmFsdWUgcmV0dXJuZWQgYnlcbiAgICogdGhlIGZ1bmN0aW9uLlxuICAgKlxuICAgKiBSdW5uaW5nIGZ1bmN0aW9ucyB2aWEgYHJ1bmAgYWxsb3dzIHlvdSB0byByZWVudGVyIEFuZ3VsYXIgem9uZSBmcm9tIGEgdGFzayB0aGF0IHdhcyBleGVjdXRlZFxuICAgKiBvdXRzaWRlIG9mIHRoZSBBbmd1bGFyIHpvbmUgKHR5cGljYWxseSBzdGFydGVkIHZpYSB7QGxpbmsgI3J1bk91dHNpZGVBbmd1bGFyfSkuXG4gICAqXG4gICAqIEFueSBmdXR1cmUgdGFza3Mgb3IgbWljcm90YXNrcyBzY2hlZHVsZWQgZnJvbSB3aXRoaW4gdGhpcyBmdW5jdGlvbiB3aWxsIGNvbnRpbnVlIGV4ZWN1dGluZyBmcm9tXG4gICAqIHdpdGhpbiB0aGUgQW5ndWxhciB6b25lLlxuICAgKlxuICAgKiBJZiBhIHN5bmNocm9ub3VzIGVycm9yIGhhcHBlbnMgaXQgd2lsbCBiZSByZXRocm93biBhbmQgbm90IHJlcG9ydGVkIHZpYSBgb25FcnJvcmAuXG4gICAqL1xuICBydW48VD4oZm46ICguLi5hcmdzOiBhbnlbXSkgPT4gVCwgYXBwbHlUaGlzPzogYW55LCBhcHBseUFyZ3M/OiBhbnlbXSk6IFQge1xuICAgIHJldHVybiAodGhpcyBhcyBhbnkgYXMgTmdab25lUHJpdmF0ZSkuX2lubmVyLnJ1bihmbiwgYXBwbHlUaGlzLCBhcHBseUFyZ3MpO1xuICB9XG5cbiAgLyoqXG4gICAqIEV4ZWN1dGVzIHRoZSBgZm5gIGZ1bmN0aW9uIHN5bmNocm9ub3VzbHkgd2l0aGluIHRoZSBBbmd1bGFyIHpvbmUgYXMgYSB0YXNrIGFuZCByZXR1cm5zIHZhbHVlXG4gICAqIHJldHVybmVkIGJ5IHRoZSBmdW5jdGlvbi5cbiAgICpcbiAgICogUnVubmluZyBmdW5jdGlvbnMgdmlhIGBydW5gIGFsbG93cyB5b3UgdG8gcmVlbnRlciBBbmd1bGFyIHpvbmUgZnJvbSBhIHRhc2sgdGhhdCB3YXMgZXhlY3V0ZWRcbiAgICogb3V0c2lkZSBvZiB0aGUgQW5ndWxhciB6b25lICh0eXBpY2FsbHkgc3RhcnRlZCB2aWEge0BsaW5rICNydW5PdXRzaWRlQW5ndWxhcn0pLlxuICAgKlxuICAgKiBBbnkgZnV0dXJlIHRhc2tzIG9yIG1pY3JvdGFza3Mgc2NoZWR1bGVkIGZyb20gd2l0aGluIHRoaXMgZnVuY3Rpb24gd2lsbCBjb250aW51ZSBleGVjdXRpbmcgZnJvbVxuICAgKiB3aXRoaW4gdGhlIEFuZ3VsYXIgem9uZS5cbiAgICpcbiAgICogSWYgYSBzeW5jaHJvbm91cyBlcnJvciBoYXBwZW5zIGl0IHdpbGwgYmUgcmV0aHJvd24gYW5kIG5vdCByZXBvcnRlZCB2aWEgYG9uRXJyb3JgLlxuICAgKi9cbiAgcnVuVGFzazxUPihmbjogKC4uLmFyZ3M6IGFueVtdKSA9PiBULCBhcHBseVRoaXM/OiBhbnksIGFwcGx5QXJncz86IGFueVtdLCBuYW1lPzogc3RyaW5nKTogVCB7XG4gICAgY29uc3Qgem9uZSA9ICh0aGlzIGFzIGFueSBhcyBOZ1pvbmVQcml2YXRlKS5faW5uZXI7XG4gICAgY29uc3QgdGFzayA9IHpvbmUuc2NoZWR1bGVFdmVudFRhc2soJ05nWm9uZUV2ZW50OiAnICsgbmFtZSwgZm4sIEVNUFRZX1BBWUxPQUQsIG5vb3AsIG5vb3ApO1xuICAgIHRyeSB7XG4gICAgICByZXR1cm4gem9uZS5ydW5UYXNrKHRhc2ssIGFwcGx5VGhpcywgYXBwbHlBcmdzKTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgem9uZS5jYW5jZWxUYXNrKHRhc2spO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBTYW1lIGFzIGBydW5gLCBleGNlcHQgdGhhdCBzeW5jaHJvbm91cyBlcnJvcnMgYXJlIGNhdWdodCBhbmQgZm9yd2FyZGVkIHZpYSBgb25FcnJvcmAgYW5kIG5vdFxuICAgKiByZXRocm93bi5cbiAgICovXG4gIHJ1bkd1YXJkZWQ8VD4oZm46ICguLi5hcmdzOiBhbnlbXSkgPT4gVCwgYXBwbHlUaGlzPzogYW55LCBhcHBseUFyZ3M/OiBhbnlbXSk6IFQge1xuICAgIHJldHVybiAodGhpcyBhcyBhbnkgYXMgTmdab25lUHJpdmF0ZSkuX2lubmVyLnJ1bkd1YXJkZWQoZm4sIGFwcGx5VGhpcywgYXBwbHlBcmdzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBFeGVjdXRlcyB0aGUgYGZuYCBmdW5jdGlvbiBzeW5jaHJvbm91c2x5IGluIEFuZ3VsYXIncyBwYXJlbnQgem9uZSBhbmQgcmV0dXJucyB2YWx1ZSByZXR1cm5lZCBieVxuICAgKiB0aGUgZnVuY3Rpb24uXG4gICAqXG4gICAqIFJ1bm5pbmcgZnVuY3Rpb25zIHZpYSB7QGxpbmsgI3J1bk91dHNpZGVBbmd1bGFyfSBhbGxvd3MgeW91IHRvIGVzY2FwZSBBbmd1bGFyJ3Mgem9uZSBhbmQgZG9cbiAgICogd29yayB0aGF0XG4gICAqIGRvZXNuJ3QgdHJpZ2dlciBBbmd1bGFyIGNoYW5nZS1kZXRlY3Rpb24gb3IgaXMgc3ViamVjdCB0byBBbmd1bGFyJ3MgZXJyb3IgaGFuZGxpbmcuXG4gICAqXG4gICAqIEFueSBmdXR1cmUgdGFza3Mgb3IgbWljcm90YXNrcyBzY2hlZHVsZWQgZnJvbSB3aXRoaW4gdGhpcyBmdW5jdGlvbiB3aWxsIGNvbnRpbnVlIGV4ZWN1dGluZyBmcm9tXG4gICAqIG91dHNpZGUgb2YgdGhlIEFuZ3VsYXIgem9uZS5cbiAgICpcbiAgICogVXNlIHtAbGluayAjcnVufSB0byByZWVudGVyIHRoZSBBbmd1bGFyIHpvbmUgYW5kIGRvIHdvcmsgdGhhdCB1cGRhdGVzIHRoZSBhcHBsaWNhdGlvbiBtb2RlbC5cbiAgICovXG4gIHJ1bk91dHNpZGVBbmd1bGFyPFQ+KGZuOiAoLi4uYXJnczogYW55W10pID0+IFQpOiBUIHtcbiAgICByZXR1cm4gKHRoaXMgYXMgYW55IGFzIE5nWm9uZVByaXZhdGUpLl9vdXRlci5ydW4oZm4pO1xuICB9XG59XG5cbmZ1bmN0aW9uIG5vb3AoKSB7fVxuY29uc3QgRU1QVFlfUEFZTE9BRCA9IHt9O1xuXG5pbnRlcmZhY2UgTmdab25lUHJpdmF0ZSBleHRlbmRzIE5nWm9uZSB7XG4gIF9vdXRlcjogWm9uZTtcbiAgX2lubmVyOiBab25lO1xuICBfbmVzdGluZzogbnVtYmVyO1xuICBfaGFzUGVuZGluZ01pY3JvdGFza3M6IGJvb2xlYW47XG5cbiAgaGFzUGVuZGluZ01hY3JvdGFza3M6IGJvb2xlYW47XG4gIGhhc1BlbmRpbmdNaWNyb3Rhc2tzOiBib29sZWFuO1xuICBsYXN0UmVxdWVzdEFuaW1hdGlvbkZyYW1lSWQ6IG51bWJlcjtcbiAgaXNTdGFibGU6IGJvb2xlYW47XG4gIHNob3VsZENvYWxlc2NlRXZlbnRDaGFuZ2VEZXRlY3Rpb246IGJvb2xlYW47XG4gIG5hdGl2ZVJlcXVlc3RBbmltYXRpb25GcmFtZTogKGNhbGxiYWNrOiBGcmFtZVJlcXVlc3RDYWxsYmFjaykgPT4gbnVtYmVyO1xuXG4gIC8vIENhY2hlIG9mICBcImZha2VcIiB0b3AgZXZlbnRUYXNrLiBUaGlzIGlzIGRvbmUgc28gdGhhdCB3ZSBkb24ndCBuZWVkIHRvIHNjaGVkdWxlIGEgbmV3IHRhc2sgZXZlcnlcbiAgLy8gdGltZSB3ZSB3YW50IHRvIHJ1biBhIGBjaGVja1N0YWJsZWAuXG4gIGZha2VUb3BFdmVudFRhc2s6IFRhc2s7XG59XG5cbmZ1bmN0aW9uIGNoZWNrU3RhYmxlKHpvbmU6IE5nWm9uZVByaXZhdGUpIHtcbiAgaWYgKHpvbmUuX25lc3RpbmcgPT0gMCAmJiAhem9uZS5oYXNQZW5kaW5nTWljcm90YXNrcyAmJiAhem9uZS5pc1N0YWJsZSkge1xuICAgIHRyeSB7XG4gICAgICB6b25lLl9uZXN0aW5nKys7XG4gICAgICB6b25lLm9uTWljcm90YXNrRW1wdHkuZW1pdChudWxsKTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgem9uZS5fbmVzdGluZy0tO1xuICAgICAgaWYgKCF6b25lLmhhc1BlbmRpbmdNaWNyb3Rhc2tzKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgem9uZS5ydW5PdXRzaWRlQW5ndWxhcigoKSA9PiB6b25lLm9uU3RhYmxlLmVtaXQobnVsbCkpO1xuICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgIHpvbmUuaXNTdGFibGUgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIGRlbGF5Q2hhbmdlRGV0ZWN0aW9uRm9yRXZlbnRzKHpvbmU6IE5nWm9uZVByaXZhdGUpIHtcbiAgaWYgKHpvbmUubGFzdFJlcXVlc3RBbmltYXRpb25GcmFtZUlkICE9PSAtMSkge1xuICAgIHJldHVybjtcbiAgfVxuICB6b25lLmxhc3RSZXF1ZXN0QW5pbWF0aW9uRnJhbWVJZCA9IHpvbmUubmF0aXZlUmVxdWVzdEFuaW1hdGlvbkZyYW1lLmNhbGwoZ2xvYmFsLCAoKSA9PiB7XG4gICAgLy8gVGhpcyBpcyBhIHdvcmsgYXJvdW5kIGZvciBodHRwczovL2dpdGh1Yi5jb20vYW5ndWxhci9hbmd1bGFyL2lzc3Vlcy8zNjgzOS5cbiAgICAvLyBUaGUgY29yZSBpc3N1ZSBpcyB0aGF0IHdoZW4gZXZlbnQgY29hbGVzY2luZyBpcyBlbmFibGVkIGl0IGlzIHBvc3NpYmxlIGZvciBtaWNyb3Rhc2tzXG4gICAgLy8gdG8gZ2V0IGZsdXNoZWQgdG9vIGVhcmx5IChBcyBpcyB0aGUgY2FzZSB3aXRoIGBQcm9taXNlLnRoZW5gKSBiZXR3ZWVuIHRoZVxuICAgIC8vIGNvYWxlc2NpbmcgZXZlbnRUYXNrcy5cbiAgICAvL1xuICAgIC8vIFRvIHdvcmthcm91bmQgdGhpcyB3ZSBzY2hlZHVsZSBhIFwiZmFrZVwiIGV2ZW50VGFzayBiZWZvcmUgd2UgcHJvY2VzcyB0aGVcbiAgICAvLyBjb2FsZXNjaW5nIGV2ZW50VGFza3MuIFRoZSBiZW5lZml0IG9mIHRoaXMgaXMgdGhhdCB0aGUgXCJmYWtlXCIgY29udGFpbmVyIGV2ZW50VGFza1xuICAgIC8vICB3aWxsIHByZXZlbnQgdGhlIG1pY3JvdGFza3MgcXVldWUgZnJvbSBnZXR0aW5nIGRyYWluZWQgaW4gYmV0d2VlbiB0aGUgY29hbGVzY2luZ1xuICAgIC8vIGV2ZW50VGFzayBleGVjdXRpb24uXG4gICAgaWYgKCF6b25lLmZha2VUb3BFdmVudFRhc2spIHtcbiAgICAgIHpvbmUuZmFrZVRvcEV2ZW50VGFzayA9IFpvbmUucm9vdC5zY2hlZHVsZUV2ZW50VGFzaygnZmFrZVRvcEV2ZW50VGFzaycsICgpID0+IHtcbiAgICAgICAgem9uZS5sYXN0UmVxdWVzdEFuaW1hdGlvbkZyYW1lSWQgPSAtMTtcbiAgICAgICAgdXBkYXRlTWljcm9UYXNrU3RhdHVzKHpvbmUpO1xuICAgICAgICBjaGVja1N0YWJsZSh6b25lKTtcbiAgICAgIH0sIHVuZGVmaW5lZCwgKCkgPT4ge30sICgpID0+IHt9KTtcbiAgICB9XG4gICAgem9uZS5mYWtlVG9wRXZlbnRUYXNrLmludm9rZSgpO1xuICB9KTtcbiAgdXBkYXRlTWljcm9UYXNrU3RhdHVzKHpvbmUpO1xufVxuXG5mdW5jdGlvbiBmb3JrSW5uZXJab25lV2l0aEFuZ3VsYXJCZWhhdmlvcih6b25lOiBOZ1pvbmVQcml2YXRlKSB7XG4gIGNvbnN0IGRlbGF5Q2hhbmdlRGV0ZWN0aW9uRm9yRXZlbnRzRGVsZWdhdGUgPSAoKSA9PiB7XG4gICAgZGVsYXlDaGFuZ2VEZXRlY3Rpb25Gb3JFdmVudHMoem9uZSk7XG4gIH07XG4gIGNvbnN0IG1heWJlRGVsYXlDaGFuZ2VEZXRlY3Rpb24gPSAhIXpvbmUuc2hvdWxkQ29hbGVzY2VFdmVudENoYW5nZURldGVjdGlvbiAmJlxuICAgICAgem9uZS5uYXRpdmVSZXF1ZXN0QW5pbWF0aW9uRnJhbWUgJiYgZGVsYXlDaGFuZ2VEZXRlY3Rpb25Gb3JFdmVudHNEZWxlZ2F0ZTtcbiAgem9uZS5faW5uZXIgPSB6b25lLl9pbm5lci5mb3JrKHtcbiAgICBuYW1lOiAnYW5ndWxhcicsXG4gICAgcHJvcGVydGllczpcbiAgICAgICAgPGFueT57J2lzQW5ndWxhclpvbmUnOiB0cnVlLCAnbWF5YmVEZWxheUNoYW5nZURldGVjdGlvbic6IG1heWJlRGVsYXlDaGFuZ2VEZXRlY3Rpb259LFxuICAgIG9uSW52b2tlVGFzazpcbiAgICAgICAgKGRlbGVnYXRlOiBab25lRGVsZWdhdGUsIGN1cnJlbnQ6IFpvbmUsIHRhcmdldDogWm9uZSwgdGFzazogVGFzaywgYXBwbHlUaGlzOiBhbnksXG4gICAgICAgICBhcHBseUFyZ3M6IGFueSk6IGFueSA9PiB7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIG9uRW50ZXIoem9uZSk7XG4gICAgICAgICAgICByZXR1cm4gZGVsZWdhdGUuaW52b2tlVGFzayh0YXJnZXQsIHRhc2ssIGFwcGx5VGhpcywgYXBwbHlBcmdzKTtcbiAgICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgICAgaWYgKG1heWJlRGVsYXlDaGFuZ2VEZXRlY3Rpb24gJiYgdGFzay50eXBlID09PSAnZXZlbnRUYXNrJykge1xuICAgICAgICAgICAgICBtYXliZURlbGF5Q2hhbmdlRGV0ZWN0aW9uKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBvbkxlYXZlKHpvbmUpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuXG4gICAgb25JbnZva2U6XG4gICAgICAgIChkZWxlZ2F0ZTogWm9uZURlbGVnYXRlLCBjdXJyZW50OiBab25lLCB0YXJnZXQ6IFpvbmUsIGNhbGxiYWNrOiBGdW5jdGlvbiwgYXBwbHlUaGlzOiBhbnksXG4gICAgICAgICBhcHBseUFyZ3M/OiBhbnlbXSwgc291cmNlPzogc3RyaW5nKTogYW55ID0+IHtcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgb25FbnRlcih6b25lKTtcbiAgICAgICAgICAgIHJldHVybiBkZWxlZ2F0ZS5pbnZva2UodGFyZ2V0LCBjYWxsYmFjaywgYXBwbHlUaGlzLCBhcHBseUFyZ3MsIHNvdXJjZSk7XG4gICAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICAgIG9uTGVhdmUoem9uZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgb25IYXNUYXNrOlxuICAgICAgICAoZGVsZWdhdGU6IFpvbmVEZWxlZ2F0ZSwgY3VycmVudDogWm9uZSwgdGFyZ2V0OiBab25lLCBoYXNUYXNrU3RhdGU6IEhhc1Rhc2tTdGF0ZSkgPT4ge1xuICAgICAgICAgIGRlbGVnYXRlLmhhc1Rhc2sodGFyZ2V0LCBoYXNUYXNrU3RhdGUpO1xuICAgICAgICAgIGlmIChjdXJyZW50ID09PSB0YXJnZXQpIHtcbiAgICAgICAgICAgIC8vIFdlIGFyZSBvbmx5IGludGVyZXN0ZWQgaW4gaGFzVGFzayBldmVudHMgd2hpY2ggb3JpZ2luYXRlIGZyb20gb3VyIHpvbmVcbiAgICAgICAgICAgIC8vIChBIGNoaWxkIGhhc1Rhc2sgZXZlbnQgaXMgbm90IGludGVyZXN0aW5nIHRvIHVzKVxuICAgICAgICAgICAgaWYgKGhhc1Rhc2tTdGF0ZS5jaGFuZ2UgPT0gJ21pY3JvVGFzaycpIHtcbiAgICAgICAgICAgICAgem9uZS5faGFzUGVuZGluZ01pY3JvdGFza3MgPSBoYXNUYXNrU3RhdGUubWljcm9UYXNrO1xuICAgICAgICAgICAgICB1cGRhdGVNaWNyb1Rhc2tTdGF0dXMoem9uZSk7XG4gICAgICAgICAgICAgIGNoZWNrU3RhYmxlKHpvbmUpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChoYXNUYXNrU3RhdGUuY2hhbmdlID09ICdtYWNyb1Rhc2snKSB7XG4gICAgICAgICAgICAgIHpvbmUuaGFzUGVuZGluZ01hY3JvdGFza3MgPSBoYXNUYXNrU3RhdGUubWFjcm9UYXNrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgIG9uSGFuZGxlRXJyb3I6IChkZWxlZ2F0ZTogWm9uZURlbGVnYXRlLCBjdXJyZW50OiBab25lLCB0YXJnZXQ6IFpvbmUsIGVycm9yOiBhbnkpOiBib29sZWFuID0+IHtcbiAgICAgIGRlbGVnYXRlLmhhbmRsZUVycm9yKHRhcmdldCwgZXJyb3IpO1xuICAgICAgem9uZS5ydW5PdXRzaWRlQW5ndWxhcigoKSA9PiB6b25lLm9uRXJyb3IuZW1pdChlcnJvcikpO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfSk7XG59XG5cbmZ1bmN0aW9uIHVwZGF0ZU1pY3JvVGFza1N0YXR1cyh6b25lOiBOZ1pvbmVQcml2YXRlKSB7XG4gIGlmICh6b25lLl9oYXNQZW5kaW5nTWljcm90YXNrcyB8fFxuICAgICAgKHpvbmUuc2hvdWxkQ29hbGVzY2VFdmVudENoYW5nZURldGVjdGlvbiAmJiB6b25lLmxhc3RSZXF1ZXN0QW5pbWF0aW9uRnJhbWVJZCAhPT0gLTEpKSB7XG4gICAgem9uZS5oYXNQZW5kaW5nTWljcm90YXNrcyA9IHRydWU7XG4gIH0gZWxzZSB7XG4gICAgem9uZS5oYXNQZW5kaW5nTWljcm90YXNrcyA9IGZhbHNlO1xuICB9XG59XG5cbmZ1bmN0aW9uIG9uRW50ZXIoem9uZTogTmdab25lUHJpdmF0ZSkge1xuICB6b25lLl9uZXN0aW5nKys7XG4gIGlmICh6b25lLmlzU3RhYmxlKSB7XG4gICAgem9uZS5pc1N0YWJsZSA9IGZhbHNlO1xuICAgIHpvbmUub25VbnN0YWJsZS5lbWl0KG51bGwpO1xuICB9XG59XG5cbmZ1bmN0aW9uIG9uTGVhdmUoem9uZTogTmdab25lUHJpdmF0ZSkge1xuICB6b25lLl9uZXN0aW5nLS07XG4gIGNoZWNrU3RhYmxlKHpvbmUpO1xufVxuXG4vKipcbiAqIFByb3ZpZGVzIGEgbm9vcCBpbXBsZW1lbnRhdGlvbiBvZiBgTmdab25lYCB3aGljaCBkb2VzIG5vdGhpbmcuIFRoaXMgem9uZSByZXF1aXJlcyBleHBsaWNpdCBjYWxsc1xuICogdG8gZnJhbWV3b3JrIHRvIHBlcmZvcm0gcmVuZGVyaW5nLlxuICovXG5leHBvcnQgY2xhc3MgTm9vcE5nWm9uZSBpbXBsZW1lbnRzIE5nWm9uZSB7XG4gIHJlYWRvbmx5IGhhc1BlbmRpbmdNaWNyb3Rhc2tzOiBib29sZWFuID0gZmFsc2U7XG4gIHJlYWRvbmx5IGhhc1BlbmRpbmdNYWNyb3Rhc2tzOiBib29sZWFuID0gZmFsc2U7XG4gIHJlYWRvbmx5IGlzU3RhYmxlOiBib29sZWFuID0gdHJ1ZTtcbiAgcmVhZG9ubHkgb25VbnN0YWJsZTogRXZlbnRFbWl0dGVyPGFueT4gPSBuZXcgRXZlbnRFbWl0dGVyKCk7XG4gIHJlYWRvbmx5IG9uTWljcm90YXNrRW1wdHk6IEV2ZW50RW1pdHRlcjxhbnk+ID0gbmV3IEV2ZW50RW1pdHRlcigpO1xuICByZWFkb25seSBvblN0YWJsZTogRXZlbnRFbWl0dGVyPGFueT4gPSBuZXcgRXZlbnRFbWl0dGVyKCk7XG4gIHJlYWRvbmx5IG9uRXJyb3I6IEV2ZW50RW1pdHRlcjxhbnk+ID0gbmV3IEV2ZW50RW1pdHRlcigpO1xuXG4gIHJ1bjxUPihmbjogKC4uLmFyZ3M6IGFueVtdKSA9PiBULCBhcHBseVRoaXM/OiBhbnksIGFwcGx5QXJncz86IGFueSk6IFQge1xuICAgIHJldHVybiBmbi5hcHBseShhcHBseVRoaXMsIGFwcGx5QXJncyk7XG4gIH1cblxuICBydW5HdWFyZGVkPFQ+KGZuOiAoLi4uYXJnczogYW55W10pID0+IGFueSwgYXBwbHlUaGlzPzogYW55LCBhcHBseUFyZ3M/OiBhbnkpOiBUIHtcbiAgICByZXR1cm4gZm4uYXBwbHkoYXBwbHlUaGlzLCBhcHBseUFyZ3MpO1xuICB9XG5cbiAgcnVuT3V0c2lkZUFuZ3VsYXI8VD4oZm46ICguLi5hcmdzOiBhbnlbXSkgPT4gVCk6IFQge1xuICAgIHJldHVybiBmbigpO1xuICB9XG5cbiAgcnVuVGFzazxUPihmbjogKC4uLmFyZ3M6IGFueVtdKSA9PiBULCBhcHBseVRoaXM/OiBhbnksIGFwcGx5QXJncz86IGFueSwgbmFtZT86IHN0cmluZyk6IFQge1xuICAgIHJldHVybiBmbi5hcHBseShhcHBseVRoaXMsIGFwcGx5QXJncyk7XG4gIH1cbn1cbiJdfQ==