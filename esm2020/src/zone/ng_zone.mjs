/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { RuntimeError } from '../errors';
import { EventEmitter } from '../event_emitter';
import { global } from '../util/global';
import { noop } from '../util/noop';
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
        self.lastRequestAnimationFrameId = -1;
        self.nativeRequestAnimationFrame = getNativeRequestAnimationFrame().nativeRequestAnimationFrame;
        forkInnerZoneWithAngularBehavior(self);
    }
    static isInAngularZone() {
        // Zone needs to be checked, because this method might be called even when NoopNgZone is used.
        return typeof Zone !== 'undefined' && Zone.current.get('isAngularZone') === true;
    }
    static assertInAngularZone() {
        if (!NgZone.isInAngularZone()) {
            throw new RuntimeError(909 /* RuntimeErrorCode.UNEXPECTED_ZONE_STATE */, ngDevMode && 'Expected to be in Angular Zone, but it is not!');
        }
    }
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
    if (zone.isCheckStableRunning || zone.lastRequestAnimationFrameId !== -1) {
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
            zone.lastRequestAnimationFrameId !== -1)) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmdfem9uZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3pvbmUvbmdfem9uZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQUMsWUFBWSxFQUFtQixNQUFNLFdBQVcsQ0FBQztBQUN6RCxPQUFPLEVBQUMsWUFBWSxFQUFDLE1BQU0sa0JBQWtCLENBQUM7QUFDOUMsT0FBTyxFQUFDLE1BQU0sRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBQ3RDLE9BQU8sRUFBQyxJQUFJLEVBQUMsTUFBTSxjQUFjLENBQUM7QUFDbEMsT0FBTyxFQUFDLDhCQUE4QixFQUFDLE1BQU0sYUFBYSxDQUFDO0FBRzNEOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBeUVHO0FBQ0gsTUFBTSxPQUFPLE1BQU07SUFrQ2pCLFlBQVksRUFDVixvQkFBb0IsR0FBRyxLQUFLLEVBQzVCLGtDQUFrQyxHQUFHLEtBQUssRUFDMUMsZ0NBQWdDLEdBQUcsS0FBSyxFQUN6QztRQXJDUSx5QkFBb0IsR0FBWSxLQUFLLENBQUM7UUFDdEMseUJBQW9CLEdBQVksS0FBSyxDQUFDO1FBRS9DOztXQUVHO1FBQ00sYUFBUSxHQUFZLElBQUksQ0FBQztRQUVsQzs7V0FFRztRQUNNLGVBQVUsR0FBc0IsSUFBSSxZQUFZLENBQUMsS0FBSyxDQUFDLENBQUM7UUFFakU7Ozs7V0FJRztRQUNNLHFCQUFnQixHQUFzQixJQUFJLFlBQVksQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUV2RTs7OztXQUlHO1FBQ00sYUFBUSxHQUFzQixJQUFJLFlBQVksQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUUvRDs7V0FFRztRQUNNLFlBQU8sR0FBc0IsSUFBSSxZQUFZLENBQUMsS0FBSyxDQUFDLENBQUM7UUFRNUQsSUFBSSxP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TyxDQUFJLEVBQXlCLEVBQUUsU0FBZSxFQUFFLFNBQWUsRUFBRSxJQUFhO1FBQ25GLE9BQU8sRUFBRSxDQUFDLEtBQUssQ0FBQyxTQUFTLEVBQUUsU0FBUyxDQUFDLENBQUM7SUFDeEMsQ0FBQztDQUNGIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7UnVudGltZUVycm9yLCBSdW50aW1lRXJyb3JDb2RlfSBmcm9tICcuLi9lcnJvcnMnO1xuaW1wb3J0IHtFdmVudEVtaXR0ZXJ9IGZyb20gJy4uL2V2ZW50X2VtaXR0ZXInO1xuaW1wb3J0IHtnbG9iYWx9IGZyb20gJy4uL3V0aWwvZ2xvYmFsJztcbmltcG9ydCB7bm9vcH0gZnJvbSAnLi4vdXRpbC9ub29wJztcbmltcG9ydCB7Z2V0TmF0aXZlUmVxdWVzdEFuaW1hdGlvbkZyYW1lfSBmcm9tICcuLi91dGlsL3JhZic7XG5cblxuLyoqXG4gKiBBbiBpbmplY3RhYmxlIHNlcnZpY2UgZm9yIGV4ZWN1dGluZyB3b3JrIGluc2lkZSBvciBvdXRzaWRlIG9mIHRoZSBBbmd1bGFyIHpvbmUuXG4gKlxuICogVGhlIG1vc3QgY29tbW9uIHVzZSBvZiB0aGlzIHNlcnZpY2UgaXMgdG8gb3B0aW1pemUgcGVyZm9ybWFuY2Ugd2hlbiBzdGFydGluZyBhIHdvcmsgY29uc2lzdGluZyBvZlxuICogb25lIG9yIG1vcmUgYXN5bmNocm9ub3VzIHRhc2tzIHRoYXQgZG9uJ3QgcmVxdWlyZSBVSSB1cGRhdGVzIG9yIGVycm9yIGhhbmRsaW5nIHRvIGJlIGhhbmRsZWQgYnlcbiAqIEFuZ3VsYXIuIFN1Y2ggdGFza3MgY2FuIGJlIGtpY2tlZCBvZmYgdmlhIHtAbGluayAjcnVuT3V0c2lkZUFuZ3VsYXJ9IGFuZCBpZiBuZWVkZWQsIHRoZXNlIHRhc2tzXG4gKiBjYW4gcmVlbnRlciB0aGUgQW5ndWxhciB6b25lIHZpYSB7QGxpbmsgI3J1bn0uXG4gKlxuICogPCEtLSBUT0RPOiBhZGQvZml4IGxpbmtzIHRvOlxuICogICAtIGRvY3MgZXhwbGFpbmluZyB6b25lcyBhbmQgdGhlIHVzZSBvZiB6b25lcyBpbiBBbmd1bGFyIGFuZCBjaGFuZ2UtZGV0ZWN0aW9uXG4gKiAgIC0gbGluayB0byBydW5PdXRzaWRlQW5ndWxhci9ydW4gKHRocm91Z2hvdXQgdGhpcyBmaWxlISlcbiAqICAgLS0+XG4gKlxuICogQHVzYWdlTm90ZXNcbiAqICMjIyBFeGFtcGxlXG4gKlxuICogYGBgXG4gKiBpbXBvcnQge0NvbXBvbmVudCwgTmdab25lfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbiAqIGltcG9ydCB7TmdJZn0gZnJvbSAnQGFuZ3VsYXIvY29tbW9uJztcbiAqXG4gKiBAQ29tcG9uZW50KHtcbiAqICAgc2VsZWN0b3I6ICduZy16b25lLWRlbW8nLFxuICogICB0ZW1wbGF0ZTogYFxuICogICAgIDxoMj5EZW1vOiBOZ1pvbmU8L2gyPlxuICpcbiAqICAgICA8cD5Qcm9ncmVzczoge3twcm9ncmVzc319JTwvcD5cbiAqICAgICA8cCAqbmdJZj1cInByb2dyZXNzID49IDEwMFwiPkRvbmUgcHJvY2Vzc2luZyB7e2xhYmVsfX0gb2YgQW5ndWxhciB6b25lITwvcD5cbiAqXG4gKiAgICAgPGJ1dHRvbiAoY2xpY2spPVwicHJvY2Vzc1dpdGhpbkFuZ3VsYXJab25lKClcIj5Qcm9jZXNzIHdpdGhpbiBBbmd1bGFyIHpvbmU8L2J1dHRvbj5cbiAqICAgICA8YnV0dG9uIChjbGljayk9XCJwcm9jZXNzT3V0c2lkZU9mQW5ndWxhclpvbmUoKVwiPlByb2Nlc3Mgb3V0c2lkZSBvZiBBbmd1bGFyIHpvbmU8L2J1dHRvbj5cbiAqICAgYCxcbiAqIH0pXG4gKiBleHBvcnQgY2xhc3MgTmdab25lRGVtbyB7XG4gKiAgIHByb2dyZXNzOiBudW1iZXIgPSAwO1xuICogICBsYWJlbDogc3RyaW5nO1xuICpcbiAqICAgY29uc3RydWN0b3IocHJpdmF0ZSBfbmdab25lOiBOZ1pvbmUpIHt9XG4gKlxuICogICAvLyBMb29wIGluc2lkZSB0aGUgQW5ndWxhciB6b25lXG4gKiAgIC8vIHNvIHRoZSBVSSBET0VTIHJlZnJlc2ggYWZ0ZXIgZWFjaCBzZXRUaW1lb3V0IGN5Y2xlXG4gKiAgIHByb2Nlc3NXaXRoaW5Bbmd1bGFyWm9uZSgpIHtcbiAqICAgICB0aGlzLmxhYmVsID0gJ2luc2lkZSc7XG4gKiAgICAgdGhpcy5wcm9ncmVzcyA9IDA7XG4gKiAgICAgdGhpcy5faW5jcmVhc2VQcm9ncmVzcygoKSA9PiBjb25zb2xlLmxvZygnSW5zaWRlIERvbmUhJykpO1xuICogICB9XG4gKlxuICogICAvLyBMb29wIG91dHNpZGUgb2YgdGhlIEFuZ3VsYXIgem9uZVxuICogICAvLyBzbyB0aGUgVUkgRE9FUyBOT1QgcmVmcmVzaCBhZnRlciBlYWNoIHNldFRpbWVvdXQgY3ljbGVcbiAqICAgcHJvY2Vzc091dHNpZGVPZkFuZ3VsYXJab25lKCkge1xuICogICAgIHRoaXMubGFiZWwgPSAnb3V0c2lkZSc7XG4gKiAgICAgdGhpcy5wcm9ncmVzcyA9IDA7XG4gKiAgICAgdGhpcy5fbmdab25lLnJ1bk91dHNpZGVBbmd1bGFyKCgpID0+IHtcbiAqICAgICAgIHRoaXMuX2luY3JlYXNlUHJvZ3Jlc3MoKCkgPT4ge1xuICogICAgICAgICAvLyByZWVudGVyIHRoZSBBbmd1bGFyIHpvbmUgYW5kIGRpc3BsYXkgZG9uZVxuICogICAgICAgICB0aGlzLl9uZ1pvbmUucnVuKCgpID0+IHsgY29uc29sZS5sb2coJ091dHNpZGUgRG9uZSEnKTsgfSk7XG4gKiAgICAgICB9KTtcbiAqICAgICB9KTtcbiAqICAgfVxuICpcbiAqICAgX2luY3JlYXNlUHJvZ3Jlc3MoZG9uZUNhbGxiYWNrOiAoKSA9PiB2b2lkKSB7XG4gKiAgICAgdGhpcy5wcm9ncmVzcyArPSAxO1xuICogICAgIGNvbnNvbGUubG9nKGBDdXJyZW50IHByb2dyZXNzOiAke3RoaXMucHJvZ3Jlc3N9JWApO1xuICpcbiAqICAgICBpZiAodGhpcy5wcm9ncmVzcyA8IDEwMCkge1xuICogICAgICAgd2luZG93LnNldFRpbWVvdXQoKCkgPT4gdGhpcy5faW5jcmVhc2VQcm9ncmVzcyhkb25lQ2FsbGJhY2spLCAxMCk7XG4gKiAgICAgfSBlbHNlIHtcbiAqICAgICAgIGRvbmVDYWxsYmFjaygpO1xuICogICAgIH1cbiAqICAgfVxuICogfVxuICogYGBgXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgY2xhc3MgTmdab25lIHtcbiAgcmVhZG9ubHkgaGFzUGVuZGluZ01hY3JvdGFza3M6IGJvb2xlYW4gPSBmYWxzZTtcbiAgcmVhZG9ubHkgaGFzUGVuZGluZ01pY3JvdGFza3M6IGJvb2xlYW4gPSBmYWxzZTtcblxuICAvKipcbiAgICogV2hldGhlciB0aGVyZSBhcmUgbm8gb3V0c3RhbmRpbmcgbWljcm90YXNrcyBvciBtYWNyb3Rhc2tzLlxuICAgKi9cbiAgcmVhZG9ubHkgaXNTdGFibGU6IGJvb2xlYW4gPSB0cnVlO1xuXG4gIC8qKlxuICAgKiBOb3RpZmllcyB3aGVuIGNvZGUgZW50ZXJzIEFuZ3VsYXIgWm9uZS4gVGhpcyBnZXRzIGZpcmVkIGZpcnN0IG9uIFZNIFR1cm4uXG4gICAqL1xuICByZWFkb25seSBvblVuc3RhYmxlOiBFdmVudEVtaXR0ZXI8YW55PiA9IG5ldyBFdmVudEVtaXR0ZXIoZmFsc2UpO1xuXG4gIC8qKlxuICAgKiBOb3RpZmllcyB3aGVuIHRoZXJlIGlzIG5vIG1vcmUgbWljcm90YXNrcyBlbnF1ZXVlZCBpbiB0aGUgY3VycmVudCBWTSBUdXJuLlxuICAgKiBUaGlzIGlzIGEgaGludCBmb3IgQW5ndWxhciB0byBkbyBjaGFuZ2UgZGV0ZWN0aW9uLCB3aGljaCBtYXkgZW5xdWV1ZSBtb3JlIG1pY3JvdGFza3MuXG4gICAqIEZvciB0aGlzIHJlYXNvbiB0aGlzIGV2ZW50IGNhbiBmaXJlIG11bHRpcGxlIHRpbWVzIHBlciBWTSBUdXJuLlxuICAgKi9cbiAgcmVhZG9ubHkgb25NaWNyb3Rhc2tFbXB0eTogRXZlbnRFbWl0dGVyPGFueT4gPSBuZXcgRXZlbnRFbWl0dGVyKGZhbHNlKTtcblxuICAvKipcbiAgICogTm90aWZpZXMgd2hlbiB0aGUgbGFzdCBgb25NaWNyb3Rhc2tFbXB0eWAgaGFzIHJ1biBhbmQgdGhlcmUgYXJlIG5vIG1vcmUgbWljcm90YXNrcywgd2hpY2hcbiAgICogaW1wbGllcyB3ZSBhcmUgYWJvdXQgdG8gcmVsaW5xdWlzaCBWTSB0dXJuLlxuICAgKiBUaGlzIGV2ZW50IGdldHMgY2FsbGVkIGp1c3Qgb25jZS5cbiAgICovXG4gIHJlYWRvbmx5IG9uU3RhYmxlOiBFdmVudEVtaXR0ZXI8YW55PiA9IG5ldyBFdmVudEVtaXR0ZXIoZmFsc2UpO1xuXG4gIC8qKlxuICAgKiBOb3RpZmllcyB0aGF0IGFuIGVycm9yIGhhcyBiZWVuIGRlbGl2ZXJlZC5cbiAgICovXG4gIHJlYWRvbmx5IG9uRXJyb3I6IEV2ZW50RW1pdHRlcjxhbnk+ID0gbmV3IEV2ZW50RW1pdHRlcihmYWxzZSk7XG5cblxuICBjb25zdHJ1Y3Rvcih7XG4gICAgZW5hYmxlTG9uZ1N0YWNrVHJhY2UgPSBmYWxzZSxcbiAgICBzaG91bGRDb2FsZXNjZUV2ZW50Q2hhbmdlRGV0ZWN0aW9uID0gZmFsc2UsXG4gICAgc2hvdWxkQ29hbGVzY2VSdW5DaGFuZ2VEZXRlY3Rpb24gPSBmYWxzZVxuICB9KSB7XG4gICAgaWYgKHR5cGVvZiBab25lID09ICd1bmRlZmluZWQnKSB7XG4gICAgICB0aHJvdyBuZXcgUnVudGltZUVycm9yKFxuICAgICAgICAgIFJ1bnRpbWVFcnJvckNvZGUuTUlTU0lOR19aT05FSlMsXG4gICAgICAgICAgbmdEZXZNb2RlICYmIGBJbiB0aGlzIGNvbmZpZ3VyYXRpb24gQW5ndWxhciByZXF1aXJlcyBab25lLmpzYCk7XG4gICAgfVxuXG4gICAgWm9uZS5hc3NlcnRab25lUGF0Y2hlZCgpO1xuICAgIGNvbnN0IHNlbGYgPSB0aGlzIGFzIGFueSBhcyBOZ1pvbmVQcml2YXRlO1xuICAgIHNlbGYuX25lc3RpbmcgPSAwO1xuXG4gICAgc2VsZi5fb3V0ZXIgPSBzZWxmLl9pbm5lciA9IFpvbmUuY3VycmVudDtcblxuICAgIGlmICgoWm9uZSBhcyBhbnkpWydUYXNrVHJhY2tpbmdab25lU3BlYyddKSB7XG4gICAgICBzZWxmLl9pbm5lciA9IHNlbGYuX2lubmVyLmZvcmsobmV3ICgoWm9uZSBhcyBhbnkpWydUYXNrVHJhY2tpbmdab25lU3BlYyddIGFzIGFueSkpO1xuICAgIH1cblxuICAgIGlmIChlbmFibGVMb25nU3RhY2tUcmFjZSAmJiAoWm9uZSBhcyBhbnkpWydsb25nU3RhY2tUcmFjZVpvbmVTcGVjJ10pIHtcbiAgICAgIHNlbGYuX2lubmVyID0gc2VsZi5faW5uZXIuZm9yaygoWm9uZSBhcyBhbnkpWydsb25nU3RhY2tUcmFjZVpvbmVTcGVjJ10pO1xuICAgIH1cbiAgICAvLyBpZiBzaG91bGRDb2FsZXNjZVJ1bkNoYW5nZURldGVjdGlvbiBpcyB0cnVlLCBhbGwgdGFza3MgaW5jbHVkaW5nIGV2ZW50IHRhc2tzIHdpbGwgYmVcbiAgICAvLyBjb2FsZXNjZWQsIHNvIHNob3VsZENvYWxlc2NlRXZlbnRDaGFuZ2VEZXRlY3Rpb24gb3B0aW9uIGlzIG5vdCBuZWNlc3NhcnkgYW5kIGNhbiBiZSBza2lwcGVkLlxuICAgIHNlbGYuc2hvdWxkQ29hbGVzY2VFdmVudENoYW5nZURldGVjdGlvbiA9XG4gICAgICAgICFzaG91bGRDb2FsZXNjZVJ1bkNoYW5nZURldGVjdGlvbiAmJiBzaG91bGRDb2FsZXNjZUV2ZW50Q2hhbmdlRGV0ZWN0aW9uO1xuICAgIHNlbGYuc2hvdWxkQ29hbGVzY2VSdW5DaGFuZ2VEZXRlY3Rpb24gPSBzaG91bGRDb2FsZXNjZVJ1bkNoYW5nZURldGVjdGlvbjtcbiAgICBzZWxmLmxhc3RSZXF1ZXN0QW5pbWF0aW9uRnJhbWVJZCA9IC0xO1xuICAgIHNlbGYubmF0aXZlUmVxdWVzdEFuaW1hdGlvbkZyYW1lID0gZ2V0TmF0aXZlUmVxdWVzdEFuaW1hdGlvbkZyYW1lKCkubmF0aXZlUmVxdWVzdEFuaW1hdGlvbkZyYW1lO1xuICAgIGZvcmtJbm5lclpvbmVXaXRoQW5ndWxhckJlaGF2aW9yKHNlbGYpO1xuICB9XG5cbiAgc3RhdGljIGlzSW5Bbmd1bGFyWm9uZSgpOiBib29sZWFuIHtcbiAgICAvLyBab25lIG5lZWRzIHRvIGJlIGNoZWNrZWQsIGJlY2F1c2UgdGhpcyBtZXRob2QgbWlnaHQgYmUgY2FsbGVkIGV2ZW4gd2hlbiBOb29wTmdab25lIGlzIHVzZWQuXG4gICAgcmV0dXJuIHR5cGVvZiBab25lICE9PSAndW5kZWZpbmVkJyAmJiBab25lLmN1cnJlbnQuZ2V0KCdpc0FuZ3VsYXJab25lJykgPT09IHRydWU7XG4gIH1cblxuICBzdGF0aWMgYXNzZXJ0SW5Bbmd1bGFyWm9uZSgpOiB2b2lkIHtcbiAgICBpZiAoIU5nWm9uZS5pc0luQW5ndWxhclpvbmUoKSkge1xuICAgICAgdGhyb3cgbmV3IFJ1bnRpbWVFcnJvcihcbiAgICAgICAgICBSdW50aW1lRXJyb3JDb2RlLlVORVhQRUNURURfWk9ORV9TVEFURSxcbiAgICAgICAgICBuZ0Rldk1vZGUgJiYgJ0V4cGVjdGVkIHRvIGJlIGluIEFuZ3VsYXIgWm9uZSwgYnV0IGl0IGlzIG5vdCEnKTtcbiAgICB9XG4gIH1cblxuICBzdGF0aWMgYXNzZXJ0Tm90SW5Bbmd1bGFyWm9uZSgpOiB2b2lkIHtcbiAgICBpZiAoTmdab25lLmlzSW5Bbmd1bGFyWm9uZSgpKSB7XG4gICAgICB0aHJvdyBuZXcgUnVudGltZUVycm9yKFxuICAgICAgICAgIFJ1bnRpbWVFcnJvckNvZGUuVU5FWFBFQ1RFRF9aT05FX1NUQVRFLFxuICAgICAgICAgIG5nRGV2TW9kZSAmJiAnRXhwZWN0ZWQgdG8gbm90IGJlIGluIEFuZ3VsYXIgWm9uZSwgYnV0IGl0IGlzIScpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBFeGVjdXRlcyB0aGUgYGZuYCBmdW5jdGlvbiBzeW5jaHJvbm91c2x5IHdpdGhpbiB0aGUgQW5ndWxhciB6b25lIGFuZCByZXR1cm5zIHZhbHVlIHJldHVybmVkIGJ5XG4gICAqIHRoZSBmdW5jdGlvbi5cbiAgICpcbiAgICogUnVubmluZyBmdW5jdGlvbnMgdmlhIGBydW5gIGFsbG93cyB5b3UgdG8gcmVlbnRlciBBbmd1bGFyIHpvbmUgZnJvbSBhIHRhc2sgdGhhdCB3YXMgZXhlY3V0ZWRcbiAgICogb3V0c2lkZSBvZiB0aGUgQW5ndWxhciB6b25lICh0eXBpY2FsbHkgc3RhcnRlZCB2aWEge0BsaW5rICNydW5PdXRzaWRlQW5ndWxhcn0pLlxuICAgKlxuICAgKiBBbnkgZnV0dXJlIHRhc2tzIG9yIG1pY3JvdGFza3Mgc2NoZWR1bGVkIGZyb20gd2l0aGluIHRoaXMgZnVuY3Rpb24gd2lsbCBjb250aW51ZSBleGVjdXRpbmcgZnJvbVxuICAgKiB3aXRoaW4gdGhlIEFuZ3VsYXIgem9uZS5cbiAgICpcbiAgICogSWYgYSBzeW5jaHJvbm91cyBlcnJvciBoYXBwZW5zIGl0IHdpbGwgYmUgcmV0aHJvd24gYW5kIG5vdCByZXBvcnRlZCB2aWEgYG9uRXJyb3JgLlxuICAgKi9cbiAgcnVuPFQ+KGZuOiAoLi4uYXJnczogYW55W10pID0+IFQsIGFwcGx5VGhpcz86IGFueSwgYXBwbHlBcmdzPzogYW55W10pOiBUIHtcbiAgICByZXR1cm4gKHRoaXMgYXMgYW55IGFzIE5nWm9uZVByaXZhdGUpLl9pbm5lci5ydW4oZm4sIGFwcGx5VGhpcywgYXBwbHlBcmdzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBFeGVjdXRlcyB0aGUgYGZuYCBmdW5jdGlvbiBzeW5jaHJvbm91c2x5IHdpdGhpbiB0aGUgQW5ndWxhciB6b25lIGFzIGEgdGFzayBhbmQgcmV0dXJucyB2YWx1ZVxuICAgKiByZXR1cm5lZCBieSB0aGUgZnVuY3Rpb24uXG4gICAqXG4gICAqIFJ1bm5pbmcgZnVuY3Rpb25zIHZpYSBgcnVuYCBhbGxvd3MgeW91IHRvIHJlZW50ZXIgQW5ndWxhciB6b25lIGZyb20gYSB0YXNrIHRoYXQgd2FzIGV4ZWN1dGVkXG4gICAqIG91dHNpZGUgb2YgdGhlIEFuZ3VsYXIgem9uZSAodHlwaWNhbGx5IHN0YXJ0ZWQgdmlhIHtAbGluayAjcnVuT3V0c2lkZUFuZ3VsYXJ9KS5cbiAgICpcbiAgICogQW55IGZ1dHVyZSB0YXNrcyBvciBtaWNyb3Rhc2tzIHNjaGVkdWxlZCBmcm9tIHdpdGhpbiB0aGlzIGZ1bmN0aW9uIHdpbGwgY29udGludWUgZXhlY3V0aW5nIGZyb21cbiAgICogd2l0aGluIHRoZSBBbmd1bGFyIHpvbmUuXG4gICAqXG4gICAqIElmIGEgc3luY2hyb25vdXMgZXJyb3IgaGFwcGVucyBpdCB3aWxsIGJlIHJldGhyb3duIGFuZCBub3QgcmVwb3J0ZWQgdmlhIGBvbkVycm9yYC5cbiAgICovXG4gIHJ1blRhc2s8VD4oZm46ICguLi5hcmdzOiBhbnlbXSkgPT4gVCwgYXBwbHlUaGlzPzogYW55LCBhcHBseUFyZ3M/OiBhbnlbXSwgbmFtZT86IHN0cmluZyk6IFQge1xuICAgIGNvbnN0IHpvbmUgPSAodGhpcyBhcyBhbnkgYXMgTmdab25lUHJpdmF0ZSkuX2lubmVyO1xuICAgIGNvbnN0IHRhc2sgPSB6b25lLnNjaGVkdWxlRXZlbnRUYXNrKCdOZ1pvbmVFdmVudDogJyArIG5hbWUsIGZuLCBFTVBUWV9QQVlMT0FELCBub29wLCBub29wKTtcbiAgICB0cnkge1xuICAgICAgcmV0dXJuIHpvbmUucnVuVGFzayh0YXNrLCBhcHBseVRoaXMsIGFwcGx5QXJncyk7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIHpvbmUuY2FuY2VsVGFzayh0YXNrKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogU2FtZSBhcyBgcnVuYCwgZXhjZXB0IHRoYXQgc3luY2hyb25vdXMgZXJyb3JzIGFyZSBjYXVnaHQgYW5kIGZvcndhcmRlZCB2aWEgYG9uRXJyb3JgIGFuZCBub3RcbiAgICogcmV0aHJvd24uXG4gICAqL1xuICBydW5HdWFyZGVkPFQ+KGZuOiAoLi4uYXJnczogYW55W10pID0+IFQsIGFwcGx5VGhpcz86IGFueSwgYXBwbHlBcmdzPzogYW55W10pOiBUIHtcbiAgICByZXR1cm4gKHRoaXMgYXMgYW55IGFzIE5nWm9uZVByaXZhdGUpLl9pbm5lci5ydW5HdWFyZGVkKGZuLCBhcHBseVRoaXMsIGFwcGx5QXJncyk7XG4gIH1cblxuICAvKipcbiAgICogRXhlY3V0ZXMgdGhlIGBmbmAgZnVuY3Rpb24gc3luY2hyb25vdXNseSBpbiBBbmd1bGFyJ3MgcGFyZW50IHpvbmUgYW5kIHJldHVybnMgdmFsdWUgcmV0dXJuZWQgYnlcbiAgICogdGhlIGZ1bmN0aW9uLlxuICAgKlxuICAgKiBSdW5uaW5nIGZ1bmN0aW9ucyB2aWEge0BsaW5rICNydW5PdXRzaWRlQW5ndWxhcn0gYWxsb3dzIHlvdSB0byBlc2NhcGUgQW5ndWxhcidzIHpvbmUgYW5kIGRvXG4gICAqIHdvcmsgdGhhdFxuICAgKiBkb2Vzbid0IHRyaWdnZXIgQW5ndWxhciBjaGFuZ2UtZGV0ZWN0aW9uIG9yIGlzIHN1YmplY3QgdG8gQW5ndWxhcidzIGVycm9yIGhhbmRsaW5nLlxuICAgKlxuICAgKiBBbnkgZnV0dXJlIHRhc2tzIG9yIG1pY3JvdGFza3Mgc2NoZWR1bGVkIGZyb20gd2l0aGluIHRoaXMgZnVuY3Rpb24gd2lsbCBjb250aW51ZSBleGVjdXRpbmcgZnJvbVxuICAgKiBvdXRzaWRlIG9mIHRoZSBBbmd1bGFyIHpvbmUuXG4gICAqXG4gICAqIFVzZSB7QGxpbmsgI3J1bn0gdG8gcmVlbnRlciB0aGUgQW5ndWxhciB6b25lIGFuZCBkbyB3b3JrIHRoYXQgdXBkYXRlcyB0aGUgYXBwbGljYXRpb24gbW9kZWwuXG4gICAqL1xuICBydW5PdXRzaWRlQW5ndWxhcjxUPihmbjogKC4uLmFyZ3M6IGFueVtdKSA9PiBUKTogVCB7XG4gICAgcmV0dXJuICh0aGlzIGFzIGFueSBhcyBOZ1pvbmVQcml2YXRlKS5fb3V0ZXIucnVuKGZuKTtcbiAgfVxufVxuXG5jb25zdCBFTVBUWV9QQVlMT0FEID0ge307XG5cbmludGVyZmFjZSBOZ1pvbmVQcml2YXRlIGV4dGVuZHMgTmdab25lIHtcbiAgX291dGVyOiBab25lO1xuICBfaW5uZXI6IFpvbmU7XG4gIF9uZXN0aW5nOiBudW1iZXI7XG4gIF9oYXNQZW5kaW5nTWljcm90YXNrczogYm9vbGVhbjtcblxuICBoYXNQZW5kaW5nTWFjcm90YXNrczogYm9vbGVhbjtcbiAgaGFzUGVuZGluZ01pY3JvdGFza3M6IGJvb2xlYW47XG4gIGxhc3RSZXF1ZXN0QW5pbWF0aW9uRnJhbWVJZDogbnVtYmVyO1xuICAvKipcbiAgICogQSBmbGFnIHRvIGluZGljYXRlIGlmIE5nWm9uZSBpcyBjdXJyZW50bHkgaW5zaWRlXG4gICAqIGNoZWNrU3RhYmxlIGFuZCB0byBwcmV2ZW50IHJlLWVudHJ5LiBUaGUgZmxhZyBpc1xuICAgKiBuZWVkZWQgYmVjYXVzZSBpdCBpcyBwb3NzaWJsZSB0byBpbnZva2UgdGhlIGNoYW5nZVxuICAgKiBkZXRlY3Rpb24gZnJvbSB3aXRoaW4gY2hhbmdlIGRldGVjdGlvbiBsZWFkaW5nIHRvXG4gICAqIGluY29ycmVjdCBiZWhhdmlvci5cbiAgICpcbiAgICogRm9yIGRldGFpbCwgcGxlYXNlIHJlZmVyIGhlcmUsXG4gICAqIGh0dHBzOi8vZ2l0aHViLmNvbS9hbmd1bGFyL2FuZ3VsYXIvcHVsbC80MDU0MFxuICAgKi9cbiAgaXNDaGVja1N0YWJsZVJ1bm5pbmc6IGJvb2xlYW47XG4gIGlzU3RhYmxlOiBib29sZWFuO1xuICAvKipcbiAgICogT3B0aW9uYWxseSBzcGVjaWZ5IGNvYWxlc2NpbmcgZXZlbnQgY2hhbmdlIGRldGVjdGlvbnMgb3Igbm90LlxuICAgKiBDb25zaWRlciB0aGUgZm9sbG93aW5nIGNhc2UuXG4gICAqXG4gICAqIDxkaXYgKGNsaWNrKT1cImRvU29tZXRoaW5nKClcIj5cbiAgICogICA8YnV0dG9uIChjbGljayk9XCJkb1NvbWV0aGluZ0Vsc2UoKVwiPjwvYnV0dG9uPlxuICAgKiA8L2Rpdj5cbiAgICpcbiAgICogV2hlbiBidXR0b24gaXMgY2xpY2tlZCwgYmVjYXVzZSBvZiB0aGUgZXZlbnQgYnViYmxpbmcsIGJvdGhcbiAgICogZXZlbnQgaGFuZGxlcnMgd2lsbCBiZSBjYWxsZWQgYW5kIDIgY2hhbmdlIGRldGVjdGlvbnMgd2lsbCBiZVxuICAgKiB0cmlnZ2VyZWQuIFdlIGNhbiBjb2FsZXNjZSBzdWNoIGtpbmQgb2YgZXZlbnRzIHRvIHRyaWdnZXJcbiAgICogY2hhbmdlIGRldGVjdGlvbiBvbmx5IG9uY2UuXG4gICAqXG4gICAqIEJ5IGRlZmF1bHQsIHRoaXMgb3B0aW9uIHdpbGwgYmUgZmFsc2UuIFNvIHRoZSBldmVudHMgd2lsbCBub3QgYmVcbiAgICogY29hbGVzY2VkIGFuZCB0aGUgY2hhbmdlIGRldGVjdGlvbiB3aWxsIGJlIHRyaWdnZXJlZCBtdWx0aXBsZSB0aW1lcy5cbiAgICogQW5kIGlmIHRoaXMgb3B0aW9uIGJlIHNldCB0byB0cnVlLCB0aGUgY2hhbmdlIGRldGVjdGlvbiB3aWxsIGJlXG4gICAqIHRyaWdnZXJlZCBhc3luYyBieSBzY2hlZHVsaW5nIGl0IGluIGFuIGFuaW1hdGlvbiBmcmFtZS4gU28gaW4gdGhlIGNhc2UgYWJvdmUsXG4gICAqIHRoZSBjaGFuZ2UgZGV0ZWN0aW9uIHdpbGwgb25seSBiZSB0cmlnZ2VkIG9uY2UuXG4gICAqL1xuICBzaG91bGRDb2FsZXNjZUV2ZW50Q2hhbmdlRGV0ZWN0aW9uOiBib29sZWFuO1xuICAvKipcbiAgICogT3B0aW9uYWxseSBzcGVjaWZ5IGlmIGBOZ1pvbmUjcnVuKClgIG1ldGhvZCBpbnZvY2F0aW9ucyBzaG91bGQgYmUgY29hbGVzY2VkXG4gICAqIGludG8gYSBzaW5nbGUgY2hhbmdlIGRldGVjdGlvbi5cbiAgICpcbiAgICogQ29uc2lkZXIgdGhlIGZvbGxvd2luZyBjYXNlLlxuICAgKlxuICAgKiBmb3IgKGxldCBpID0gMDsgaSA8IDEwOyBpICsrKSB7XG4gICAqICAgbmdab25lLnJ1bigoKSA9PiB7XG4gICAqICAgICAvLyBkbyBzb21ldGhpbmdcbiAgICogICB9KTtcbiAgICogfVxuICAgKlxuICAgKiBUaGlzIGNhc2UgdHJpZ2dlcnMgdGhlIGNoYW5nZSBkZXRlY3Rpb24gbXVsdGlwbGUgdGltZXMuXG4gICAqIFdpdGggbmdab25lUnVuQ29hbGVzY2luZyBvcHRpb25zLCBhbGwgY2hhbmdlIGRldGVjdGlvbnMgaW4gYW4gZXZlbnQgbG9vcHMgdHJpZ2dlciBvbmx5IG9uY2UuXG4gICAqIEluIGFkZGl0aW9uLCB0aGUgY2hhbmdlIGRldGVjdGlvbiBleGVjdXRlcyBpbiByZXF1ZXN0QW5pbWF0aW9uLlxuICAgKlxuICAgKi9cbiAgc2hvdWxkQ29hbGVzY2VSdW5DaGFuZ2VEZXRlY3Rpb246IGJvb2xlYW47XG5cbiAgbmF0aXZlUmVxdWVzdEFuaW1hdGlvbkZyYW1lOiAoY2FsbGJhY2s6IEZyYW1lUmVxdWVzdENhbGxiYWNrKSA9PiBudW1iZXI7XG5cbiAgLy8gQ2FjaGUgYSAgXCJmYWtlXCIgdG9wIGV2ZW50VGFzayBzbyB5b3UgZG9uJ3QgbmVlZCB0byBzY2hlZHVsZSBhIG5ldyB0YXNrIGV2ZXJ5XG4gIC8vIHRpbWUgeW91IHJ1biBhIGBjaGVja1N0YWJsZWAuXG4gIGZha2VUb3BFdmVudFRhc2s6IFRhc2s7XG59XG5cbmZ1bmN0aW9uIGNoZWNrU3RhYmxlKHpvbmU6IE5nWm9uZVByaXZhdGUpIHtcbiAgLy8gVE9ETzogQEppYUxpUGFzc2lvbiwgc2hvdWxkIGNoZWNrIHpvbmUuaXNDaGVja1N0YWJsZVJ1bm5pbmcgdG8gcHJldmVudFxuICAvLyByZS1lbnRyeS4gVGhlIGNhc2UgaXM6XG4gIC8vXG4gIC8vIEBDb21wb25lbnQoey4uLn0pXG4gIC8vIGV4cG9ydCBjbGFzcyBBcHBDb21wb25lbnQge1xuICAvLyBjb25zdHJ1Y3Rvcihwcml2YXRlIG5nWm9uZTogTmdab25lKSB7XG4gIC8vICAgdGhpcy5uZ1pvbmUub25TdGFibGUuc3Vic2NyaWJlKCgpID0+IHtcbiAgLy8gICAgIHRoaXMubmdab25lLnJ1bigoKSA9PiBjb25zb2xlLmxvZygnc3RhYmxlJyk7KTtcbiAgLy8gICB9KTtcbiAgLy8gfVxuICAvL1xuICAvLyBUaGUgb25TdGFibGUgc3Vic2NyaWJlciBydW4gYW5vdGhlciBmdW5jdGlvbiBpbnNpZGUgbmdab25lXG4gIC8vIHdoaWNoIGNhdXNlcyBgY2hlY2tTdGFibGUoKWAgcmUtZW50cnkuXG4gIC8vIEJ1dCB0aGlzIGZpeCBjYXVzZXMgc29tZSBpc3N1ZXMgaW4gZzMsIHNvIHRoaXMgZml4IHdpbGwgYmVcbiAgLy8gbGF1bmNoZWQgaW4gYW5vdGhlciBQUi5cbiAgaWYgKHpvbmUuX25lc3RpbmcgPT0gMCAmJiAhem9uZS5oYXNQZW5kaW5nTWljcm90YXNrcyAmJiAhem9uZS5pc1N0YWJsZSkge1xuICAgIHRyeSB7XG4gICAgICB6b25lLl9uZXN0aW5nKys7XG4gICAgICB6b25lLm9uTWljcm90YXNrRW1wdHkuZW1pdChudWxsKTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgem9uZS5fbmVzdGluZy0tO1xuICAgICAgaWYgKCF6b25lLmhhc1BlbmRpbmdNaWNyb3Rhc2tzKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgem9uZS5ydW5PdXRzaWRlQW5ndWxhcigoKSA9PiB6b25lLm9uU3RhYmxlLmVtaXQobnVsbCkpO1xuICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgIHpvbmUuaXNTdGFibGUgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIGRlbGF5Q2hhbmdlRGV0ZWN0aW9uRm9yRXZlbnRzKHpvbmU6IE5nWm9uZVByaXZhdGUpIHtcbiAgLyoqXG4gICAqIFdlIGFsc28gbmVlZCB0byBjaGVjayBfbmVzdGluZyBoZXJlXG4gICAqIENvbnNpZGVyIHRoZSBmb2xsb3dpbmcgY2FzZSB3aXRoIHNob3VsZENvYWxlc2NlUnVuQ2hhbmdlRGV0ZWN0aW9uID0gdHJ1ZVxuICAgKlxuICAgKiBuZ1pvbmUucnVuKCgpID0+IHt9KTtcbiAgICogbmdab25lLnJ1bigoKSA9PiB7fSk7XG4gICAqXG4gICAqIFdlIHdhbnQgdGhlIHR3byBgbmdab25lLnJ1bigpYCBvbmx5IHRyaWdnZXIgb25lIGNoYW5nZSBkZXRlY3Rpb25cbiAgICogd2hlbiBzaG91bGRDb2FsZXNjZVJ1bkNoYW5nZURldGVjdGlvbiBpcyB0cnVlLlxuICAgKiBBbmQgYmVjYXVzZSBpbiB0aGlzIGNhc2UsIGNoYW5nZSBkZXRlY3Rpb24gcnVuIGluIGFzeW5jIHdheShyZXF1ZXN0QW5pbWF0aW9uRnJhbWUpLFxuICAgKiBzbyB3ZSBhbHNvIG5lZWQgdG8gY2hlY2sgdGhlIF9uZXN0aW5nIGhlcmUgdG8gcHJldmVudCBtdWx0aXBsZVxuICAgKiBjaGFuZ2UgZGV0ZWN0aW9ucy5cbiAgICovXG4gIGlmICh6b25lLmlzQ2hlY2tTdGFibGVSdW5uaW5nIHx8IHpvbmUubGFzdFJlcXVlc3RBbmltYXRpb25GcmFtZUlkICE9PSAtMSkge1xuICAgIHJldHVybjtcbiAgfVxuICB6b25lLmxhc3RSZXF1ZXN0QW5pbWF0aW9uRnJhbWVJZCA9IHpvbmUubmF0aXZlUmVxdWVzdEFuaW1hdGlvbkZyYW1lLmNhbGwoZ2xvYmFsLCAoKSA9PiB7XG4gICAgLy8gVGhpcyBpcyBhIHdvcmsgYXJvdW5kIGZvciBodHRwczovL2dpdGh1Yi5jb20vYW5ndWxhci9hbmd1bGFyL2lzc3Vlcy8zNjgzOS5cbiAgICAvLyBUaGUgY29yZSBpc3N1ZSBpcyB0aGF0IHdoZW4gZXZlbnQgY29hbGVzY2luZyBpcyBlbmFibGVkIGl0IGlzIHBvc3NpYmxlIGZvciBtaWNyb3Rhc2tzXG4gICAgLy8gdG8gZ2V0IGZsdXNoZWQgdG9vIGVhcmx5IChBcyBpcyB0aGUgY2FzZSB3aXRoIGBQcm9taXNlLnRoZW5gKSBiZXR3ZWVuIHRoZVxuICAgIC8vIGNvYWxlc2NpbmcgZXZlbnRUYXNrcy5cbiAgICAvL1xuICAgIC8vIFRvIHdvcmthcm91bmQgdGhpcyB3ZSBzY2hlZHVsZSBhIFwiZmFrZVwiIGV2ZW50VGFzayBiZWZvcmUgd2UgcHJvY2VzcyB0aGVcbiAgICAvLyBjb2FsZXNjaW5nIGV2ZW50VGFza3MuIFRoZSBiZW5lZml0IG9mIHRoaXMgaXMgdGhhdCB0aGUgXCJmYWtlXCIgY29udGFpbmVyIGV2ZW50VGFza1xuICAgIC8vICB3aWxsIHByZXZlbnQgdGhlIG1pY3JvdGFza3MgcXVldWUgZnJvbSBnZXR0aW5nIGRyYWluZWQgaW4gYmV0d2VlbiB0aGUgY29hbGVzY2luZ1xuICAgIC8vIGV2ZW50VGFzayBleGVjdXRpb24uXG4gICAgaWYgKCF6b25lLmZha2VUb3BFdmVudFRhc2spIHtcbiAgICAgIHpvbmUuZmFrZVRvcEV2ZW50VGFzayA9IFpvbmUucm9vdC5zY2hlZHVsZUV2ZW50VGFzaygnZmFrZVRvcEV2ZW50VGFzaycsICgpID0+IHtcbiAgICAgICAgem9uZS5sYXN0UmVxdWVzdEFuaW1hdGlvbkZyYW1lSWQgPSAtMTtcbiAgICAgICAgdXBkYXRlTWljcm9UYXNrU3RhdHVzKHpvbmUpO1xuICAgICAgICB6b25lLmlzQ2hlY2tTdGFibGVSdW5uaW5nID0gdHJ1ZTtcbiAgICAgICAgY2hlY2tTdGFibGUoem9uZSk7XG4gICAgICAgIHpvbmUuaXNDaGVja1N0YWJsZVJ1bm5pbmcgPSBmYWxzZTtcbiAgICAgIH0sIHVuZGVmaW5lZCwgKCkgPT4ge30sICgpID0+IHt9KTtcbiAgICB9XG4gICAgem9uZS5mYWtlVG9wRXZlbnRUYXNrLmludm9rZSgpO1xuICB9KTtcbiAgdXBkYXRlTWljcm9UYXNrU3RhdHVzKHpvbmUpO1xufVxuXG5mdW5jdGlvbiBmb3JrSW5uZXJab25lV2l0aEFuZ3VsYXJCZWhhdmlvcih6b25lOiBOZ1pvbmVQcml2YXRlKSB7XG4gIGNvbnN0IGRlbGF5Q2hhbmdlRGV0ZWN0aW9uRm9yRXZlbnRzRGVsZWdhdGUgPSAoKSA9PiB7XG4gICAgZGVsYXlDaGFuZ2VEZXRlY3Rpb25Gb3JFdmVudHMoem9uZSk7XG4gIH07XG4gIHpvbmUuX2lubmVyID0gem9uZS5faW5uZXIuZm9yayh7XG4gICAgbmFtZTogJ2FuZ3VsYXInLFxuICAgIHByb3BlcnRpZXM6IDxhbnk+eydpc0FuZ3VsYXJab25lJzogdHJ1ZX0sXG4gICAgb25JbnZva2VUYXNrOlxuICAgICAgICAoZGVsZWdhdGU6IFpvbmVEZWxlZ2F0ZSwgY3VycmVudDogWm9uZSwgdGFyZ2V0OiBab25lLCB0YXNrOiBUYXNrLCBhcHBseVRoaXM6IGFueSxcbiAgICAgICAgIGFwcGx5QXJnczogYW55KTogYW55ID0+IHtcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgb25FbnRlcih6b25lKTtcbiAgICAgICAgICAgIHJldHVybiBkZWxlZ2F0ZS5pbnZva2VUYXNrKHRhcmdldCwgdGFzaywgYXBwbHlUaGlzLCBhcHBseUFyZ3MpO1xuICAgICAgICAgIH0gZmluYWxseSB7XG4gICAgICAgICAgICBpZiAoKHpvbmUuc2hvdWxkQ29hbGVzY2VFdmVudENoYW5nZURldGVjdGlvbiAmJiB0YXNrLnR5cGUgPT09ICdldmVudFRhc2snKSB8fFxuICAgICAgICAgICAgICAgIHpvbmUuc2hvdWxkQ29hbGVzY2VSdW5DaGFuZ2VEZXRlY3Rpb24pIHtcbiAgICAgICAgICAgICAgZGVsYXlDaGFuZ2VEZXRlY3Rpb25Gb3JFdmVudHNEZWxlZ2F0ZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgb25MZWF2ZSh6b25lKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICBvbkludm9rZTpcbiAgICAgICAgKGRlbGVnYXRlOiBab25lRGVsZWdhdGUsIGN1cnJlbnQ6IFpvbmUsIHRhcmdldDogWm9uZSwgY2FsbGJhY2s6IEZ1bmN0aW9uLCBhcHBseVRoaXM6IGFueSxcbiAgICAgICAgIGFwcGx5QXJncz86IGFueVtdLCBzb3VyY2U/OiBzdHJpbmcpOiBhbnkgPT4ge1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICBvbkVudGVyKHpvbmUpO1xuICAgICAgICAgICAgcmV0dXJuIGRlbGVnYXRlLmludm9rZSh0YXJnZXQsIGNhbGxiYWNrLCBhcHBseVRoaXMsIGFwcGx5QXJncywgc291cmNlKTtcbiAgICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgICAgaWYgKHpvbmUuc2hvdWxkQ29hbGVzY2VSdW5DaGFuZ2VEZXRlY3Rpb24pIHtcbiAgICAgICAgICAgICAgZGVsYXlDaGFuZ2VEZXRlY3Rpb25Gb3JFdmVudHNEZWxlZ2F0ZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgb25MZWF2ZSh6b25lKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICBvbkhhc1Rhc2s6XG4gICAgICAgIChkZWxlZ2F0ZTogWm9uZURlbGVnYXRlLCBjdXJyZW50OiBab25lLCB0YXJnZXQ6IFpvbmUsIGhhc1Rhc2tTdGF0ZTogSGFzVGFza1N0YXRlKSA9PiB7XG4gICAgICAgICAgZGVsZWdhdGUuaGFzVGFzayh0YXJnZXQsIGhhc1Rhc2tTdGF0ZSk7XG4gICAgICAgICAgaWYgKGN1cnJlbnQgPT09IHRhcmdldCkge1xuICAgICAgICAgICAgLy8gV2UgYXJlIG9ubHkgaW50ZXJlc3RlZCBpbiBoYXNUYXNrIGV2ZW50cyB3aGljaCBvcmlnaW5hdGUgZnJvbSBvdXIgem9uZVxuICAgICAgICAgICAgLy8gKEEgY2hpbGQgaGFzVGFzayBldmVudCBpcyBub3QgaW50ZXJlc3RpbmcgdG8gdXMpXG4gICAgICAgICAgICBpZiAoaGFzVGFza1N0YXRlLmNoYW5nZSA9PSAnbWljcm9UYXNrJykge1xuICAgICAgICAgICAgICB6b25lLl9oYXNQZW5kaW5nTWljcm90YXNrcyA9IGhhc1Rhc2tTdGF0ZS5taWNyb1Rhc2s7XG4gICAgICAgICAgICAgIHVwZGF0ZU1pY3JvVGFza1N0YXR1cyh6b25lKTtcbiAgICAgICAgICAgICAgY2hlY2tTdGFibGUoem9uZSk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGhhc1Rhc2tTdGF0ZS5jaGFuZ2UgPT0gJ21hY3JvVGFzaycpIHtcbiAgICAgICAgICAgICAgem9uZS5oYXNQZW5kaW5nTWFjcm90YXNrcyA9IGhhc1Rhc2tTdGF0ZS5tYWNyb1Rhc2s7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgb25IYW5kbGVFcnJvcjogKGRlbGVnYXRlOiBab25lRGVsZWdhdGUsIGN1cnJlbnQ6IFpvbmUsIHRhcmdldDogWm9uZSwgZXJyb3I6IGFueSk6IGJvb2xlYW4gPT4ge1xuICAgICAgZGVsZWdhdGUuaGFuZGxlRXJyb3IodGFyZ2V0LCBlcnJvcik7XG4gICAgICB6b25lLnJ1bk91dHNpZGVBbmd1bGFyKCgpID0+IHpvbmUub25FcnJvci5lbWl0KGVycm9yKSk7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9KTtcbn1cblxuZnVuY3Rpb24gdXBkYXRlTWljcm9UYXNrU3RhdHVzKHpvbmU6IE5nWm9uZVByaXZhdGUpIHtcbiAgaWYgKHpvbmUuX2hhc1BlbmRpbmdNaWNyb3Rhc2tzIHx8XG4gICAgICAoKHpvbmUuc2hvdWxkQ29hbGVzY2VFdmVudENoYW5nZURldGVjdGlvbiB8fCB6b25lLnNob3VsZENvYWxlc2NlUnVuQ2hhbmdlRGV0ZWN0aW9uKSAmJlxuICAgICAgIHpvbmUubGFzdFJlcXVlc3RBbmltYXRpb25GcmFtZUlkICE9PSAtMSkpIHtcbiAgICB6b25lLmhhc1BlbmRpbmdNaWNyb3Rhc2tzID0gdHJ1ZTtcbiAgfSBlbHNlIHtcbiAgICB6b25lLmhhc1BlbmRpbmdNaWNyb3Rhc2tzID0gZmFsc2U7XG4gIH1cbn1cblxuZnVuY3Rpb24gb25FbnRlcih6b25lOiBOZ1pvbmVQcml2YXRlKSB7XG4gIHpvbmUuX25lc3RpbmcrKztcbiAgaWYgKHpvbmUuaXNTdGFibGUpIHtcbiAgICB6b25lLmlzU3RhYmxlID0gZmFsc2U7XG4gICAgem9uZS5vblVuc3RhYmxlLmVtaXQobnVsbCk7XG4gIH1cbn1cblxuZnVuY3Rpb24gb25MZWF2ZSh6b25lOiBOZ1pvbmVQcml2YXRlKSB7XG4gIHpvbmUuX25lc3RpbmctLTtcbiAgY2hlY2tTdGFibGUoem9uZSk7XG59XG5cbi8qKlxuICogUHJvdmlkZXMgYSBub29wIGltcGxlbWVudGF0aW9uIG9mIGBOZ1pvbmVgIHdoaWNoIGRvZXMgbm90aGluZy4gVGhpcyB6b25lIHJlcXVpcmVzIGV4cGxpY2l0IGNhbGxzXG4gKiB0byBmcmFtZXdvcmsgdG8gcGVyZm9ybSByZW5kZXJpbmcuXG4gKi9cbmV4cG9ydCBjbGFzcyBOb29wTmdab25lIGltcGxlbWVudHMgTmdab25lIHtcbiAgcmVhZG9ubHkgaGFzUGVuZGluZ01pY3JvdGFza3M6IGJvb2xlYW4gPSBmYWxzZTtcbiAgcmVhZG9ubHkgaGFzUGVuZGluZ01hY3JvdGFza3M6IGJvb2xlYW4gPSBmYWxzZTtcbiAgcmVhZG9ubHkgaXNTdGFibGU6IGJvb2xlYW4gPSB0cnVlO1xuICByZWFkb25seSBvblVuc3RhYmxlOiBFdmVudEVtaXR0ZXI8YW55PiA9IG5ldyBFdmVudEVtaXR0ZXIoKTtcbiAgcmVhZG9ubHkgb25NaWNyb3Rhc2tFbXB0eTogRXZlbnRFbWl0dGVyPGFueT4gPSBuZXcgRXZlbnRFbWl0dGVyKCk7XG4gIHJlYWRvbmx5IG9uU3RhYmxlOiBFdmVudEVtaXR0ZXI8YW55PiA9IG5ldyBFdmVudEVtaXR0ZXIoKTtcbiAgcmVhZG9ubHkgb25FcnJvcjogRXZlbnRFbWl0dGVyPGFueT4gPSBuZXcgRXZlbnRFbWl0dGVyKCk7XG5cbiAgcnVuPFQ+KGZuOiAoLi4uYXJnczogYW55W10pID0+IFQsIGFwcGx5VGhpcz86IGFueSwgYXBwbHlBcmdzPzogYW55KTogVCB7XG4gICAgcmV0dXJuIGZuLmFwcGx5KGFwcGx5VGhpcywgYXBwbHlBcmdzKTtcbiAgfVxuXG4gIHJ1bkd1YXJkZWQ8VD4oZm46ICguLi5hcmdzOiBhbnlbXSkgPT4gYW55LCBhcHBseVRoaXM/OiBhbnksIGFwcGx5QXJncz86IGFueSk6IFQge1xuICAgIHJldHVybiBmbi5hcHBseShhcHBseVRoaXMsIGFwcGx5QXJncyk7XG4gIH1cblxuICBydW5PdXRzaWRlQW5ndWxhcjxUPihmbjogKC4uLmFyZ3M6IGFueVtdKSA9PiBUKTogVCB7XG4gICAgcmV0dXJuIGZuKCk7XG4gIH1cblxuICBydW5UYXNrPFQ+KGZuOiAoLi4uYXJnczogYW55W10pID0+IFQsIGFwcGx5VGhpcz86IGFueSwgYXBwbHlBcmdzPzogYW55LCBuYW1lPzogc3RyaW5nKTogVCB7XG4gICAgcmV0dXJuIGZuLmFwcGx5KGFwcGx5VGhpcywgYXBwbHlBcmdzKTtcbiAgfVxufVxuIl19