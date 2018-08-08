/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { EventEmitter } from '../event_emitter';
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
 * @experimental
 */
export class NgZone {
    constructor({ enableLongStackTrace = false }) {
        this.hasPendingMicrotasks = false;
        this.hasPendingMacrotasks = false;
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
        if (Zone['wtfZoneSpec']) {
            self._inner = self._inner.fork(Zone['wtfZoneSpec']);
        }
        if (Zone['TaskTrackingZoneSpec']) {
            self._inner = self._inner.fork(new Zone['TaskTrackingZoneSpec']);
        }
        if (enableLongStackTrace && Zone['longStackTraceZoneSpec']) {
            self._inner = self._inner.fork(Zone['longStackTraceZoneSpec']);
        }
        forkInnerZoneWithAngularBehavior(self);
    }
    static isInAngularZone() { return Zone.current.get('isAngularZone') === true; }
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
function forkInnerZoneWithAngularBehavior(zone) {
    zone._inner = zone._inner.fork({
        name: 'angular',
        properties: { 'isAngularZone': true },
        onInvokeTask: (delegate, current, target, task, applyThis, applyArgs) => {
            try {
                onEnter(zone);
                return delegate.invokeTask(target, task, applyThis, applyArgs);
            }
            finally {
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
                    zone.hasPendingMicrotasks = hasTaskState.microTask;
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
    run(fn) { return fn(); }
    runGuarded(fn) { return fn(); }
    runOutsideAngular(fn) { return fn(); }
    runTask(fn) { return fn(); }
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmdfem9uZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3pvbmUvbmdfem9uZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQUMsWUFBWSxFQUFDLE1BQU0sa0JBQWtCLENBQUM7QUFFOUM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7R0F5RUc7QUFDSCxNQUFNO0lBaUNKLFlBQVksRUFBQyxvQkFBb0IsR0FBRyxLQUFLLEVBQUM7UUFoQ2pDLHlCQUFvQixHQUFZLEtBQUssQ0FBQztRQUN0Qyx5QkFBb0IsR0FBWSxLQUFLLENBQUM7UUFFL0M7O1dBRUc7UUFDTSxhQUFRLEdBQVksSUFBSSxDQUFDO1FBRWxDOztXQUVHO1FBQ00sZUFBVSxHQUFzQixJQUFJLFlBQVksQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUVqRTs7OztXQUlHO1FBQ00scUJBQWdCLEdBQXNCLElBQUksWUFBWSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBRXZFOzs7O1dBSUc7UUFDTSxhQUFRLEdBQXNCLElBQUksWUFBWSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBRS9EOztXQUVHO1FBQ00sWUFBTyxHQUFzQixJQUFJLFlBQVksQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUc1RCxJQUFJLE9BQU8sSUFBSSxJQUFJLFdBQVcsRUFBRTtZQUM5QixNQUFNLElBQUksS0FBSyxDQUFDLGdEQUFnRCxDQUFDLENBQUM7U0FDbkU7UUFFRCxJQUFJLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztRQUN6QixNQUFNLElBQUksR0FBRyxJQUE0QixDQUFDO1FBQzFDLElBQUksQ0FBQyxRQUFRLEdBQUcsQ0FBQyxDQUFDO1FBRWxCLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENB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QUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztLQUM1QjtBQUNILENBQUM7QUFFRCxpQkFBaUIsSUFBbUI7SUFDbEMsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO0lBQ2hCLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUNwQixDQUFDO0FBRUQ7OztHQUdHO0FBQ0gsTUFBTTtJQUFOO1FBQ1cseUJBQW9CLEdBQVksS0FBSyxDQUFDO1FBQ3RDLHlCQUFvQixHQUFZLEtBQUssQ0FBQztRQUN0QyxhQUFRLEdBQVksSUFBSSxDQUFDO1FBQ3pCLGVBQVUsR0FBc0IsSUFBSSxZQUFZLEVBQUUsQ0FBQztRQUNuRCxxQkFBZ0IsR0FBc0IsSUFBSSxZQUFZLEVBQUUsQ0FBQztRQUN6RCxhQUFRLEdBQXNCLElBQUksWUFBWSxFQUFFLENBQUM7UUFDakQsWUFBTyxHQUFzQixJQUFJLFlBQVksRUFBRSxDQUFDO0lBUzNELENBQUM7SUFQQyxHQUFHLENBQUMsRUFBYSxJQUFTLE9BQU8sRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBRXhDLFVBQVUsQ0FBQyxFQUFhLElBQVMsT0FBTyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFFL0MsaUJBQWlCLENBQUMsRUFBYSxJQUFTLE9BQU8sRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBRXRELE9BQU8sQ0FBSSxFQUFhLElBQVMsT0FBTyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7Q0FDaEQiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7RXZlbnRFbWl0dGVyfSBmcm9tICcuLi9ldmVudF9lbWl0dGVyJztcblxuLyoqXG4gKiBBbiBpbmplY3RhYmxlIHNlcnZpY2UgZm9yIGV4ZWN1dGluZyB3b3JrIGluc2lkZSBvciBvdXRzaWRlIG9mIHRoZSBBbmd1bGFyIHpvbmUuXG4gKlxuICogVGhlIG1vc3QgY29tbW9uIHVzZSBvZiB0aGlzIHNlcnZpY2UgaXMgdG8gb3B0aW1pemUgcGVyZm9ybWFuY2Ugd2hlbiBzdGFydGluZyBhIHdvcmsgY29uc2lzdGluZyBvZlxuICogb25lIG9yIG1vcmUgYXN5bmNocm9ub3VzIHRhc2tzIHRoYXQgZG9uJ3QgcmVxdWlyZSBVSSB1cGRhdGVzIG9yIGVycm9yIGhhbmRsaW5nIHRvIGJlIGhhbmRsZWQgYnlcbiAqIEFuZ3VsYXIuIFN1Y2ggdGFza3MgY2FuIGJlIGtpY2tlZCBvZmYgdmlhIHtAbGluayAjcnVuT3V0c2lkZUFuZ3VsYXJ9IGFuZCBpZiBuZWVkZWQsIHRoZXNlIHRhc2tzXG4gKiBjYW4gcmVlbnRlciB0aGUgQW5ndWxhciB6b25lIHZpYSB7QGxpbmsgI3J1bn0uXG4gKlxuICogPCEtLSBUT0RPOiBhZGQvZml4IGxpbmtzIHRvOlxuICogICAtIGRvY3MgZXhwbGFpbmluZyB6b25lcyBhbmQgdGhlIHVzZSBvZiB6b25lcyBpbiBBbmd1bGFyIGFuZCBjaGFuZ2UtZGV0ZWN0aW9uXG4gKiAgIC0gbGluayB0byBydW5PdXRzaWRlQW5ndWxhci9ydW4gKHRocm91Z2hvdXQgdGhpcyBmaWxlISlcbiAqICAgLS0+XG4gKlxuICogQHVzYWdlTm90ZXNcbiAqICMjIyBFeGFtcGxlXG4gKlxuICogYGBgXG4gKiBpbXBvcnQge0NvbXBvbmVudCwgTmdab25lfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbiAqIGltcG9ydCB7TmdJZn0gZnJvbSAnQGFuZ3VsYXIvY29tbW9uJztcbiAqXG4gKiBAQ29tcG9uZW50KHtcbiAqICAgc2VsZWN0b3I6ICduZy16b25lLWRlbW8nLFxuICogICB0ZW1wbGF0ZTogYFxuICogICAgIDxoMj5EZW1vOiBOZ1pvbmU8L2gyPlxuICpcbiAqICAgICA8cD5Qcm9ncmVzczoge3twcm9ncmVzc319JTwvcD5cbiAqICAgICA8cCAqbmdJZj1cInByb2dyZXNzID49IDEwMFwiPkRvbmUgcHJvY2Vzc2luZyB7e2xhYmVsfX0gb2YgQW5ndWxhciB6b25lITwvcD5cbiAqXG4gKiAgICAgPGJ1dHRvbiAoY2xpY2spPVwicHJvY2Vzc1dpdGhpbkFuZ3VsYXJab25lKClcIj5Qcm9jZXNzIHdpdGhpbiBBbmd1bGFyIHpvbmU8L2J1dHRvbj5cbiAqICAgICA8YnV0dG9uIChjbGljayk9XCJwcm9jZXNzT3V0c2lkZU9mQW5ndWxhclpvbmUoKVwiPlByb2Nlc3Mgb3V0c2lkZSBvZiBBbmd1bGFyIHpvbmU8L2J1dHRvbj5cbiAqICAgYCxcbiAqIH0pXG4gKiBleHBvcnQgY2xhc3MgTmdab25lRGVtbyB7XG4gKiAgIHByb2dyZXNzOiBudW1iZXIgPSAwO1xuICogICBsYWJlbDogc3RyaW5nO1xuICpcbiAqICAgY29uc3RydWN0b3IocHJpdmF0ZSBfbmdab25lOiBOZ1pvbmUpIHt9XG4gKlxuICogICAvLyBMb29wIGluc2lkZSB0aGUgQW5ndWxhciB6b25lXG4gKiAgIC8vIHNvIHRoZSBVSSBET0VTIHJlZnJlc2ggYWZ0ZXIgZWFjaCBzZXRUaW1lb3V0IGN5Y2xlXG4gKiAgIHByb2Nlc3NXaXRoaW5Bbmd1bGFyWm9uZSgpIHtcbiAqICAgICB0aGlzLmxhYmVsID0gJ2luc2lkZSc7XG4gKiAgICAgdGhpcy5wcm9ncmVzcyA9IDA7XG4gKiAgICAgdGhpcy5faW5jcmVhc2VQcm9ncmVzcygoKSA9PiBjb25zb2xlLmxvZygnSW5zaWRlIERvbmUhJykpO1xuICogICB9XG4gKlxuICogICAvLyBMb29wIG91dHNpZGUgb2YgdGhlIEFuZ3VsYXIgem9uZVxuICogICAvLyBzbyB0aGUgVUkgRE9FUyBOT1QgcmVmcmVzaCBhZnRlciBlYWNoIHNldFRpbWVvdXQgY3ljbGVcbiAqICAgcHJvY2Vzc091dHNpZGVPZkFuZ3VsYXJab25lKCkge1xuICogICAgIHRoaXMubGFiZWwgPSAnb3V0c2lkZSc7XG4gKiAgICAgdGhpcy5wcm9ncmVzcyA9IDA7XG4gKiAgICAgdGhpcy5fbmdab25lLnJ1bk91dHNpZGVBbmd1bGFyKCgpID0+IHtcbiAqICAgICAgIHRoaXMuX2luY3JlYXNlUHJvZ3Jlc3MoKCkgPT4ge1xuICogICAgICAgICAvLyByZWVudGVyIHRoZSBBbmd1bGFyIHpvbmUgYW5kIGRpc3BsYXkgZG9uZVxuICogICAgICAgICB0aGlzLl9uZ1pvbmUucnVuKCgpID0+IHsgY29uc29sZS5sb2coJ091dHNpZGUgRG9uZSEnKTsgfSk7XG4gKiAgICAgICB9KTtcbiAqICAgICB9KTtcbiAqICAgfVxuICpcbiAqICAgX2luY3JlYXNlUHJvZ3Jlc3MoZG9uZUNhbGxiYWNrOiAoKSA9PiB2b2lkKSB7XG4gKiAgICAgdGhpcy5wcm9ncmVzcyArPSAxO1xuICogICAgIGNvbnNvbGUubG9nKGBDdXJyZW50IHByb2dyZXNzOiAke3RoaXMucHJvZ3Jlc3N9JWApO1xuICpcbiAqICAgICBpZiAodGhpcy5wcm9ncmVzcyA8IDEwMCkge1xuICogICAgICAgd2luZG93LnNldFRpbWVvdXQoKCkgPT4gdGhpcy5faW5jcmVhc2VQcm9ncmVzcyhkb25lQ2FsbGJhY2spLCAxMCk7XG4gKiAgICAgfSBlbHNlIHtcbiAqICAgICAgIGRvbmVDYWxsYmFjaygpO1xuICogICAgIH1cbiAqICAgfVxuICogfVxuICogYGBgXG4gKlxuICogQGV4cGVyaW1lbnRhbFxuICovXG5leHBvcnQgY2xhc3MgTmdab25lIHtcbiAgcmVhZG9ubHkgaGFzUGVuZGluZ01pY3JvdGFza3M6IGJvb2xlYW4gPSBmYWxzZTtcbiAgcmVhZG9ubHkgaGFzUGVuZGluZ01hY3JvdGFza3M6IGJvb2xlYW4gPSBmYWxzZTtcblxuICAvKipcbiAgICogV2hldGhlciB0aGVyZSBhcmUgbm8gb3V0c3RhbmRpbmcgbWljcm90YXNrcyBvciBtYWNyb3Rhc2tzLlxuICAgKi9cbiAgcmVhZG9ubHkgaXNTdGFibGU6IGJvb2xlYW4gPSB0cnVlO1xuXG4gIC8qKlxuICAgKiBOb3RpZmllcyB3aGVuIGNvZGUgZW50ZXJzIEFuZ3VsYXIgWm9uZS4gVGhpcyBnZXRzIGZpcmVkIGZpcnN0IG9uIFZNIFR1cm4uXG4gICAqL1xuICByZWFkb25seSBvblVuc3RhYmxlOiBFdmVudEVtaXR0ZXI8YW55PiA9IG5ldyBFdmVudEVtaXR0ZXIoZmFsc2UpO1xuXG4gIC8qKlxuICAgKiBOb3RpZmllcyB3aGVuIHRoZXJlIGlzIG5vIG1vcmUgbWljcm90YXNrcyBlbnF1ZXVlZCBpbiB0aGUgY3VycmVudCBWTSBUdXJuLlxuICAgKiBUaGlzIGlzIGEgaGludCBmb3IgQW5ndWxhciB0byBkbyBjaGFuZ2UgZGV0ZWN0aW9uLCB3aGljaCBtYXkgZW5xdWV1ZSBtb3JlIG1pY3JvdGFza3MuXG4gICAqIEZvciB0aGlzIHJlYXNvbiB0aGlzIGV2ZW50IGNhbiBmaXJlIG11bHRpcGxlIHRpbWVzIHBlciBWTSBUdXJuLlxuICAgKi9cbiAgcmVhZG9ubHkgb25NaWNyb3Rhc2tFbXB0eTogRXZlbnRFbWl0dGVyPGFueT4gPSBuZXcgRXZlbnRFbWl0dGVyKGZhbHNlKTtcblxuICAvKipcbiAgICogTm90aWZpZXMgd2hlbiB0aGUgbGFzdCBgb25NaWNyb3Rhc2tFbXB0eWAgaGFzIHJ1biBhbmQgdGhlcmUgYXJlIG5vIG1vcmUgbWljcm90YXNrcywgd2hpY2hcbiAgICogaW1wbGllcyB3ZSBhcmUgYWJvdXQgdG8gcmVsaW5xdWlzaCBWTSB0dXJuLlxuICAgKiBUaGlzIGV2ZW50IGdldHMgY2FsbGVkIGp1c3Qgb25jZS5cbiAgICovXG4gIHJlYWRvbmx5IG9uU3RhYmxlOiBFdmVudEVtaXR0ZXI8YW55PiA9IG5ldyBFdmVudEVtaXR0ZXIoZmFsc2UpO1xuXG4gIC8qKlxuICAgKiBOb3RpZmllcyB0aGF0IGFuIGVycm9yIGhhcyBiZWVuIGRlbGl2ZXJlZC5cbiAgICovXG4gIHJlYWRvbmx5IG9uRXJyb3I6IEV2ZW50RW1pdHRlcjxhbnk+ID0gbmV3IEV2ZW50RW1pdHRlcihmYWxzZSk7XG5cbiAgY29uc3RydWN0b3Ioe2VuYWJsZUxvbmdTdGFja1RyYWNlID0gZmFsc2V9KSB7XG4gICAgaWYgKHR5cGVvZiBab25lID09ICd1bmRlZmluZWQnKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYEluIHRoaXMgY29uZmlndXJhdGlvbiBBbmd1bGFyIHJlcXVpcmVzIFpvbmUuanNgKTtcbiAgICB9XG5cbiAgICBab25lLmFzc2VydFpvbmVQYXRjaGVkKCk7XG4gICAgY29uc3Qgc2VsZiA9IHRoaXMgYXMgYW55IGFzIE5nWm9uZVByaXZhdGU7XG4gICAgc2VsZi5fbmVzdGluZyA9IDA7XG5cbiAgICBzZWxmLl9vdXRlciA9IHNlbGYuX2lubmVyID0gWm9uZS5jdXJyZW50O1xuXG4gICAgaWYgKChab25lIGFzIGFueSlbJ3d0ZlpvbmVTcGVjJ10pIHtcbiAgICAgIHNlbGYuX2lubmVyID0gc2VsZi5faW5uZXIuZm9yaygoWm9uZSBhcyBhbnkpWyd3dGZab25lU3BlYyddKTtcbiAgICB9XG5cbiAgICBpZiAoKFpvbmUgYXMgYW55KVsnVGFza1RyYWNraW5nWm9uZVNwZWMnXSkge1xuICAgICAgc2VsZi5faW5uZXIgPSBzZWxmLl9pbm5lci5mb3JrKG5ldyAoKFpvbmUgYXMgYW55KVsnVGFza1RyYWNraW5nWm9uZVNwZWMnXSBhcyBhbnkpKTtcbiAgICB9XG5cbiAgICBpZiAoZW5hYmxlTG9uZ1N0YWNrVHJhY2UgJiYgKFpvbmUgYXMgYW55KVsnbG9uZ1N0YWNrVHJhY2Vab25lU3BlYyddKSB7XG4gICAgICBzZWxmLl9pbm5lciA9IHNlbGYuX2lubmVyLmZvcmsoKFpvbmUgYXMgYW55KVsnbG9uZ1N0YWNrVHJhY2Vab25lU3BlYyddKTtcbiAgICB9XG5cbiAgICBmb3JrSW5uZXJab25lV2l0aEFuZ3VsYXJCZWhhdmlvcihzZWxmKTtcbiAgfVxuXG4gIHN0YXRpYyBpc0luQW5ndWxhclpvbmUoKTogYm9vbGVhbiB7IHJldHVybiBab25lLmN1cnJlbnQuZ2V0KCdpc0FuZ3VsYXJab25lJykgPT09IHRydWU7IH1cblxuICBzdGF0aWMgYXNzZXJ0SW5Bbmd1bGFyWm9uZSgpOiB2b2lkIHtcbiAgICBpZiAoIU5nWm9uZS5pc0luQW5ndWxhclpvbmUoKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdFeHBlY3RlZCB0byBiZSBpbiBBbmd1bGFyIFpvbmUsIGJ1dCBpdCBpcyBub3QhJyk7XG4gICAgfVxuICB9XG5cbiAgc3RhdGljIGFzc2VydE5vdEluQW5ndWxhclpvbmUoKTogdm9pZCB7XG4gICAgaWYgKE5nWm9uZS5pc0luQW5ndWxhclpvbmUoKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdFeHBlY3RlZCB0byBub3QgYmUgaW4gQW5ndWxhciBab25lLCBidXQgaXQgaXMhJyk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEV4ZWN1dGVzIHRoZSBgZm5gIGZ1bmN0aW9uIHN5bmNocm9ub3VzbHkgd2l0aGluIHRoZSBBbmd1bGFyIHpvbmUgYW5kIHJldHVybnMgdmFsdWUgcmV0dXJuZWQgYnlcbiAgICogdGhlIGZ1bmN0aW9uLlxuICAgKlxuICAgKiBSdW5uaW5nIGZ1bmN0aW9ucyB2aWEgYHJ1bmAgYWxsb3dzIHlvdSB0byByZWVudGVyIEFuZ3VsYXIgem9uZSBmcm9tIGEgdGFzayB0aGF0IHdhcyBleGVjdXRlZFxuICAgKiBvdXRzaWRlIG9mIHRoZSBBbmd1bGFyIHpvbmUgKHR5cGljYWxseSBzdGFydGVkIHZpYSB7QGxpbmsgI3J1bk91dHNpZGVBbmd1bGFyfSkuXG4gICAqXG4gICAqIEFueSBmdXR1cmUgdGFza3Mgb3IgbWljcm90YXNrcyBzY2hlZHVsZWQgZnJvbSB3aXRoaW4gdGhpcyBmdW5jdGlvbiB3aWxsIGNvbnRpbnVlIGV4ZWN1dGluZyBmcm9tXG4gICAqIHdpdGhpbiB0aGUgQW5ndWxhciB6b25lLlxuICAgKlxuICAgKiBJZiBhIHN5bmNocm9ub3VzIGVycm9yIGhhcHBlbnMgaXQgd2lsbCBiZSByZXRocm93biBhbmQgbm90IHJlcG9ydGVkIHZpYSBgb25FcnJvcmAuXG4gICAqL1xuICBydW48VD4oZm46ICguLi5hcmdzOiBhbnlbXSkgPT4gVCwgYXBwbHlUaGlzPzogYW55LCBhcHBseUFyZ3M/OiBhbnlbXSk6IFQge1xuICAgIHJldHVybiAodGhpcyBhcyBhbnkgYXMgTmdab25lUHJpdmF0ZSkuX2lubmVyLnJ1bihmbiwgYXBwbHlUaGlzLCBhcHBseUFyZ3MpIGFzIFQ7XG4gIH1cblxuICAvKipcbiAgICogRXhlY3V0ZXMgdGhlIGBmbmAgZnVuY3Rpb24gc3luY2hyb25vdXNseSB3aXRoaW4gdGhlIEFuZ3VsYXIgem9uZSBhcyBhIHRhc2sgYW5kIHJldHVybnMgdmFsdWVcbiAgICogcmV0dXJuZWQgYnkgdGhlIGZ1bmN0aW9uLlxuICAgKlxuICAgKiBSdW5uaW5nIGZ1bmN0aW9ucyB2aWEgYHJ1bmAgYWxsb3dzIHlvdSB0byByZWVudGVyIEFuZ3VsYXIgem9uZSBmcm9tIGEgdGFzayB0aGF0IHdhcyBleGVjdXRlZFxuICAgKiBvdXRzaWRlIG9mIHRoZSBBbmd1bGFyIHpvbmUgKHR5cGljYWxseSBzdGFydGVkIHZpYSB7QGxpbmsgI3J1bk91dHNpZGVBbmd1bGFyfSkuXG4gICAqXG4gICAqIEFueSBmdXR1cmUgdGFza3Mgb3IgbWljcm90YXNrcyBzY2hlZHVsZWQgZnJvbSB3aXRoaW4gdGhpcyBmdW5jdGlvbiB3aWxsIGNvbnRpbnVlIGV4ZWN1dGluZyBmcm9tXG4gICAqIHdpdGhpbiB0aGUgQW5ndWxhciB6b25lLlxuICAgKlxuICAgKiBJZiBhIHN5bmNocm9ub3VzIGVycm9yIGhhcHBlbnMgaXQgd2lsbCBiZSByZXRocm93biBhbmQgbm90IHJlcG9ydGVkIHZpYSBgb25FcnJvcmAuXG4gICAqL1xuICBydW5UYXNrPFQ+KGZuOiAoLi4uYXJnczogYW55W10pID0+IFQsIGFwcGx5VGhpcz86IGFueSwgYXBwbHlBcmdzPzogYW55W10sIG5hbWU/OiBzdHJpbmcpOiBUIHtcbiAgICBjb25zdCB6b25lID0gKHRoaXMgYXMgYW55IGFzIE5nWm9uZVByaXZhdGUpLl9pbm5lcjtcbiAgICBjb25zdCB0YXNrID0gem9uZS5zY2hlZHVsZUV2ZW50VGFzaygnTmdab25lRXZlbnQ6ICcgKyBuYW1lLCBmbiwgRU1QVFlfUEFZTE9BRCwgbm9vcCwgbm9vcCk7XG4gICAgdHJ5IHtcbiAgICAgIHJldHVybiB6b25lLnJ1blRhc2sodGFzaywgYXBwbHlUaGlzLCBhcHBseUFyZ3MpIGFzIFQ7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIHpvbmUuY2FuY2VsVGFzayh0YXNrKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogU2FtZSBhcyBgcnVuYCwgZXhjZXB0IHRoYXQgc3luY2hyb25vdXMgZXJyb3JzIGFyZSBjYXVnaHQgYW5kIGZvcndhcmRlZCB2aWEgYG9uRXJyb3JgIGFuZCBub3RcbiAgICogcmV0aHJvd24uXG4gICAqL1xuICBydW5HdWFyZGVkPFQ+KGZuOiAoLi4uYXJnczogYW55W10pID0+IFQsIGFwcGx5VGhpcz86IGFueSwgYXBwbHlBcmdzPzogYW55W10pOiBUIHtcbiAgICByZXR1cm4gKHRoaXMgYXMgYW55IGFzIE5nWm9uZVByaXZhdGUpLl9pbm5lci5ydW5HdWFyZGVkKGZuLCBhcHBseVRoaXMsIGFwcGx5QXJncykgYXMgVDtcbiAgfVxuXG4gIC8qKlxuICAgKiBFeGVjdXRlcyB0aGUgYGZuYCBmdW5jdGlvbiBzeW5jaHJvbm91c2x5IGluIEFuZ3VsYXIncyBwYXJlbnQgem9uZSBhbmQgcmV0dXJucyB2YWx1ZSByZXR1cm5lZCBieVxuICAgKiB0aGUgZnVuY3Rpb24uXG4gICAqXG4gICAqIFJ1bm5pbmcgZnVuY3Rpb25zIHZpYSB7QGxpbmsgI3J1bk91dHNpZGVBbmd1bGFyfSBhbGxvd3MgeW91IHRvIGVzY2FwZSBBbmd1bGFyJ3Mgem9uZSBhbmQgZG9cbiAgICogd29yayB0aGF0XG4gICAqIGRvZXNuJ3QgdHJpZ2dlciBBbmd1bGFyIGNoYW5nZS1kZXRlY3Rpb24gb3IgaXMgc3ViamVjdCB0byBBbmd1bGFyJ3MgZXJyb3IgaGFuZGxpbmcuXG4gICAqXG4gICAqIEFueSBmdXR1cmUgdGFza3Mgb3IgbWljcm90YXNrcyBzY2hlZHVsZWQgZnJvbSB3aXRoaW4gdGhpcyBmdW5jdGlvbiB3aWxsIGNvbnRpbnVlIGV4ZWN1dGluZyBmcm9tXG4gICAqIG91dHNpZGUgb2YgdGhlIEFuZ3VsYXIgem9uZS5cbiAgICpcbiAgICogVXNlIHtAbGluayAjcnVufSB0byByZWVudGVyIHRoZSBBbmd1bGFyIHpvbmUgYW5kIGRvIHdvcmsgdGhhdCB1cGRhdGVzIHRoZSBhcHBsaWNhdGlvbiBtb2RlbC5cbiAgICovXG4gIHJ1bk91dHNpZGVBbmd1bGFyPFQ+KGZuOiAoLi4uYXJnczogYW55W10pID0+IFQpOiBUIHtcbiAgICByZXR1cm4gKHRoaXMgYXMgYW55IGFzIE5nWm9uZVByaXZhdGUpLl9vdXRlci5ydW4oZm4pIGFzIFQ7XG4gIH1cbn1cblxuZnVuY3Rpb24gbm9vcCgpIHt9XG5jb25zdCBFTVBUWV9QQVlMT0FEID0ge307XG5cblxuaW50ZXJmYWNlIE5nWm9uZVByaXZhdGUgZXh0ZW5kcyBOZ1pvbmUge1xuICBfb3V0ZXI6IFpvbmU7XG4gIF9pbm5lcjogWm9uZTtcbiAgX25lc3Rpbmc6IG51bWJlcjtcblxuICBoYXNQZW5kaW5nTWljcm90YXNrczogYm9vbGVhbjtcbiAgaGFzUGVuZGluZ01hY3JvdGFza3M6IGJvb2xlYW47XG4gIGlzU3RhYmxlOiBib29sZWFuO1xufVxuXG5mdW5jdGlvbiBjaGVja1N0YWJsZSh6b25lOiBOZ1pvbmVQcml2YXRlKSB7XG4gIGlmICh6b25lLl9uZXN0aW5nID09IDAgJiYgIXpvbmUuaGFzUGVuZGluZ01pY3JvdGFza3MgJiYgIXpvbmUuaXNTdGFibGUpIHtcbiAgICB0cnkge1xuICAgICAgem9uZS5fbmVzdGluZysrO1xuICAgICAgem9uZS5vbk1pY3JvdGFza0VtcHR5LmVtaXQobnVsbCk7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIHpvbmUuX25lc3RpbmctLTtcbiAgICAgIGlmICghem9uZS5oYXNQZW5kaW5nTWljcm90YXNrcykge1xuICAgICAgICB0cnkge1xuICAgICAgICAgIHpvbmUucnVuT3V0c2lkZUFuZ3VsYXIoKCkgPT4gem9uZS5vblN0YWJsZS5lbWl0KG51bGwpKTtcbiAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICB6b25lLmlzU3RhYmxlID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBmb3JrSW5uZXJab25lV2l0aEFuZ3VsYXJCZWhhdmlvcih6b25lOiBOZ1pvbmVQcml2YXRlKSB7XG4gIHpvbmUuX2lubmVyID0gem9uZS5faW5uZXIuZm9yayh7XG4gICAgbmFtZTogJ2FuZ3VsYXInLFxuICAgIHByb3BlcnRpZXM6IDxhbnk+eydpc0FuZ3VsYXJab25lJzogdHJ1ZX0sXG4gICAgb25JbnZva2VUYXNrOiAoZGVsZWdhdGU6IFpvbmVEZWxlZ2F0ZSwgY3VycmVudDogWm9uZSwgdGFyZ2V0OiBab25lLCB0YXNrOiBUYXNrLCBhcHBseVRoaXM6IGFueSxcbiAgICAgICAgICAgICAgICAgICBhcHBseUFyZ3M6IGFueSk6IGFueSA9PiB7XG4gICAgICB0cnkge1xuICAgICAgICBvbkVudGVyKHpvbmUpO1xuICAgICAgICByZXR1cm4gZGVsZWdhdGUuaW52b2tlVGFzayh0YXJnZXQsIHRhc2ssIGFwcGx5VGhpcywgYXBwbHlBcmdzKTtcbiAgICAgIH0gZmluYWxseSB7XG4gICAgICAgIG9uTGVhdmUoem9uZSk7XG4gICAgICB9XG4gICAgfSxcblxuXG4gICAgb25JbnZva2U6IChkZWxlZ2F0ZTogWm9uZURlbGVnYXRlLCBjdXJyZW50OiBab25lLCB0YXJnZXQ6IFpvbmUsIGNhbGxiYWNrOiBGdW5jdGlvbixcbiAgICAgICAgICAgICAgIGFwcGx5VGhpczogYW55LCBhcHBseUFyZ3M6IGFueVtdLCBzb3VyY2U6IHN0cmluZyk6IGFueSA9PiB7XG4gICAgICB0cnkge1xuICAgICAgICBvbkVudGVyKHpvbmUpO1xuICAgICAgICByZXR1cm4gZGVsZWdhdGUuaW52b2tlKHRhcmdldCwgY2FsbGJhY2ssIGFwcGx5VGhpcywgYXBwbHlBcmdzLCBzb3VyY2UpO1xuICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgb25MZWF2ZSh6b25lKTtcbiAgICAgIH1cbiAgICB9LFxuXG4gICAgb25IYXNUYXNrOlxuICAgICAgICAoZGVsZWdhdGU6IFpvbmVEZWxlZ2F0ZSwgY3VycmVudDogWm9uZSwgdGFyZ2V0OiBab25lLCBoYXNUYXNrU3RhdGU6IEhhc1Rhc2tTdGF0ZSkgPT4ge1xuICAgICAgICAgIGRlbGVnYXRlLmhhc1Rhc2sodGFyZ2V0LCBoYXNUYXNrU3RhdGUpO1xuICAgICAgICAgIGlmIChjdXJyZW50ID09PSB0YXJnZXQpIHtcbiAgICAgICAgICAgIC8vIFdlIGFyZSBvbmx5IGludGVyZXN0ZWQgaW4gaGFzVGFzayBldmVudHMgd2hpY2ggb3JpZ2luYXRlIGZyb20gb3VyIHpvbmVcbiAgICAgICAgICAgIC8vIChBIGNoaWxkIGhhc1Rhc2sgZXZlbnQgaXMgbm90IGludGVyZXN0aW5nIHRvIHVzKVxuICAgICAgICAgICAgaWYgKGhhc1Rhc2tTdGF0ZS5jaGFuZ2UgPT0gJ21pY3JvVGFzaycpIHtcbiAgICAgICAgICAgICAgem9uZS5oYXNQZW5kaW5nTWljcm90YXNrcyA9IGhhc1Rhc2tTdGF0ZS5taWNyb1Rhc2s7XG4gICAgICAgICAgICAgIGNoZWNrU3RhYmxlKHpvbmUpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChoYXNUYXNrU3RhdGUuY2hhbmdlID09ICdtYWNyb1Rhc2snKSB7XG4gICAgICAgICAgICAgIHpvbmUuaGFzUGVuZGluZ01hY3JvdGFza3MgPSBoYXNUYXNrU3RhdGUubWFjcm9UYXNrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgIG9uSGFuZGxlRXJyb3I6IChkZWxlZ2F0ZTogWm9uZURlbGVnYXRlLCBjdXJyZW50OiBab25lLCB0YXJnZXQ6IFpvbmUsIGVycm9yOiBhbnkpOiBib29sZWFuID0+IHtcbiAgICAgIGRlbGVnYXRlLmhhbmRsZUVycm9yKHRhcmdldCwgZXJyb3IpO1xuICAgICAgem9uZS5ydW5PdXRzaWRlQW5ndWxhcigoKSA9PiB6b25lLm9uRXJyb3IuZW1pdChlcnJvcikpO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfSk7XG59XG5cbmZ1bmN0aW9uIG9uRW50ZXIoem9uZTogTmdab25lUHJpdmF0ZSkge1xuICB6b25lLl9uZXN0aW5nKys7XG4gIGlmICh6b25lLmlzU3RhYmxlKSB7XG4gICAgem9uZS5pc1N0YWJsZSA9IGZhbHNlO1xuICAgIHpvbmUub25VbnN0YWJsZS5lbWl0KG51bGwpO1xuICB9XG59XG5cbmZ1bmN0aW9uIG9uTGVhdmUoem9uZTogTmdab25lUHJpdmF0ZSkge1xuICB6b25lLl9uZXN0aW5nLS07XG4gIGNoZWNrU3RhYmxlKHpvbmUpO1xufVxuXG4vKipcbiAqIFByb3ZpZGVzIGEgbm9vcCBpbXBsZW1lbnRhdGlvbiBvZiBgTmdab25lYCB3aGljaCBkb2VzIG5vdGhpbmcuIFRoaXMgem9uZSByZXF1aXJlcyBleHBsaWNpdCBjYWxsc1xuICogdG8gZnJhbWV3b3JrIHRvIHBlcmZvcm0gcmVuZGVyaW5nLlxuICovXG5leHBvcnQgY2xhc3MgTm9vcE5nWm9uZSBpbXBsZW1lbnRzIE5nWm9uZSB7XG4gIHJlYWRvbmx5IGhhc1BlbmRpbmdNaWNyb3Rhc2tzOiBib29sZWFuID0gZmFsc2U7XG4gIHJlYWRvbmx5IGhhc1BlbmRpbmdNYWNyb3Rhc2tzOiBib29sZWFuID0gZmFsc2U7XG4gIHJlYWRvbmx5IGlzU3RhYmxlOiBib29sZWFuID0gdHJ1ZTtcbiAgcmVhZG9ubHkgb25VbnN0YWJsZTogRXZlbnRFbWl0dGVyPGFueT4gPSBuZXcgRXZlbnRFbWl0dGVyKCk7XG4gIHJlYWRvbmx5IG9uTWljcm90YXNrRW1wdHk6IEV2ZW50RW1pdHRlcjxhbnk+ID0gbmV3IEV2ZW50RW1pdHRlcigpO1xuICByZWFkb25seSBvblN0YWJsZTogRXZlbnRFbWl0dGVyPGFueT4gPSBuZXcgRXZlbnRFbWl0dGVyKCk7XG4gIHJlYWRvbmx5IG9uRXJyb3I6IEV2ZW50RW1pdHRlcjxhbnk+ID0gbmV3IEV2ZW50RW1pdHRlcigpO1xuXG4gIHJ1bihmbjogKCkgPT4gYW55KTogYW55IHsgcmV0dXJuIGZuKCk7IH1cblxuICBydW5HdWFyZGVkKGZuOiAoKSA9PiBhbnkpOiBhbnkgeyByZXR1cm4gZm4oKTsgfVxuXG4gIHJ1bk91dHNpZGVBbmd1bGFyKGZuOiAoKSA9PiBhbnkpOiBhbnkgeyByZXR1cm4gZm4oKTsgfVxuXG4gIHJ1blRhc2s8VD4oZm46ICgpID0+IGFueSk6IGFueSB7IHJldHVybiBmbigpOyB9XG59XG4iXX0=