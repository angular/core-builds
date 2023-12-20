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
        self.lastRequestAnimationFrameId = -1;
        self.nativeRequestAnimationFrame = getNativeRequestAnimationFrame().nativeRequestAnimationFrame;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmdfem9uZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3pvbmUvbmdfem9uZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFHSCxPQUFPLEVBQUMsWUFBWSxFQUFtQixNQUFNLFdBQVcsQ0FBQztBQUN6RCxPQUFPLEVBQUMsWUFBWSxFQUFDLE1BQU0sa0JBQWtCLENBQUM7QUFDOUMsT0FBTyxFQUFDLE1BQU0sRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBQ3RDLE9BQU8sRUFBQyxJQUFJLEVBQUMsTUFBTSxjQUFjLENBQUM7QUFDbEMsT0FBTyxFQUFDLDhCQUE4QixFQUFDLE1BQU0sYUFBYSxDQUFDO0FBRTNELE9BQU8sRUFBQyx5QkFBeUIsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBTWhFOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBeUVHO0FBQ0gsTUFBTSxPQUFPLE1BQU07SUFpQ2pCLFlBQVksRUFDVixvQkFBb0IsR0FBRyxLQUFLLEVBQzVCLGtDQUFrQyxHQUFHLEtBQUssRUFDMUMsZ0NBQWdDLEdBQUcsS0FBSyxFQUN6QztRQXBDUSx5QkFBb0IsR0FBWSxLQUFLLENBQUM7UUFDdEMseUJBQW9CLEdBQVksS0FBSyxDQUFDO1FBRS9DOztXQUVHO1FBQ00sYUFBUSxHQUFZLElBQUksQ0FBQztRQUVsQzs7V0FFRztRQUNNLGVBQVUsR0FBc0IsSUFBSSxZQUFZLENBQUMsS0FBSyxDQUFDLENBQUM7UUFFakU7Ozs7V0FJRztRQUNNLHFCQUFnQixHQUFzQixJQUFJLFlBQVksQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUV2RTs7OztXQUlHO1FBQ00sYUFBUSxHQUFzQixJQUFJLFlBQVksQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUUvRDs7V0FFRztRQUNNLFlBQU8sR0FB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S0FDekI7SUFDRCxJQUFJLFdBQVcsS0FBSyxTQUFTLEVBQUU7UUFDN0IsT0FBTyxJQUFJLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQztLQUM1QjtJQUNELE9BQU8sV0FBVyxDQUFDO0FBQ3JCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuXG5pbXBvcnQge1J1bnRpbWVFcnJvciwgUnVudGltZUVycm9yQ29kZX0gZnJvbSAnLi4vZXJyb3JzJztcbmltcG9ydCB7RXZlbnRFbWl0dGVyfSBmcm9tICcuLi9ldmVudF9lbWl0dGVyJztcbmltcG9ydCB7Z2xvYmFsfSBmcm9tICcuLi91dGlsL2dsb2JhbCc7XG5pbXBvcnQge25vb3B9IGZyb20gJy4uL3V0aWwvbm9vcCc7XG5pbXBvcnQge2dldE5hdGl2ZVJlcXVlc3RBbmltYXRpb25GcmFtZX0gZnJvbSAnLi4vdXRpbC9yYWYnO1xuXG5pbXBvcnQge0FzeW5jU3RhY2tUYWdnaW5nWm9uZVNwZWN9IGZyb20gJy4vYXN5bmMtc3RhY2stdGFnZ2luZyc7XG5cbi8vIFRoZSBiZWxvdyBpcyBuZWVkZWQgYXMgb3RoZXJ3aXNlIGEgbnVtYmVyIG9mIHRhcmdldHMgZmFpbCBpbiBHMyBkdWUgdG86XG4vLyBFUlJPUiAtIFtKU0NfVU5ERUZJTkVEX1ZBUklBQkxFXSB2YXJpYWJsZSBab25lIGlzIHVuZGVjbGFyZWRcbmRlY2xhcmUgY29uc3QgWm9uZTogYW55O1xuXG4vKipcbiAqIEFuIGluamVjdGFibGUgc2VydmljZSBmb3IgZXhlY3V0aW5nIHdvcmsgaW5zaWRlIG9yIG91dHNpZGUgb2YgdGhlIEFuZ3VsYXIgem9uZS5cbiAqXG4gKiBUaGUgbW9zdCBjb21tb24gdXNlIG9mIHRoaXMgc2VydmljZSBpcyB0byBvcHRpbWl6ZSBwZXJmb3JtYW5jZSB3aGVuIHN0YXJ0aW5nIGEgd29yayBjb25zaXN0aW5nIG9mXG4gKiBvbmUgb3IgbW9yZSBhc3luY2hyb25vdXMgdGFza3MgdGhhdCBkb24ndCByZXF1aXJlIFVJIHVwZGF0ZXMgb3IgZXJyb3IgaGFuZGxpbmcgdG8gYmUgaGFuZGxlZCBieVxuICogQW5ndWxhci4gU3VjaCB0YXNrcyBjYW4gYmUga2lja2VkIG9mZiB2aWEge0BsaW5rICNydW5PdXRzaWRlQW5ndWxhcn0gYW5kIGlmIG5lZWRlZCwgdGhlc2UgdGFza3NcbiAqIGNhbiByZWVudGVyIHRoZSBBbmd1bGFyIHpvbmUgdmlhIHtAbGluayAjcnVufS5cbiAqXG4gKiA8IS0tIFRPRE86IGFkZC9maXggbGlua3MgdG86XG4gKiAgIC0gZG9jcyBleHBsYWluaW5nIHpvbmVzIGFuZCB0aGUgdXNlIG9mIHpvbmVzIGluIEFuZ3VsYXIgYW5kIGNoYW5nZS1kZXRlY3Rpb25cbiAqICAgLSBsaW5rIHRvIHJ1bk91dHNpZGVBbmd1bGFyL3J1biAodGhyb3VnaG91dCB0aGlzIGZpbGUhKVxuICogICAtLT5cbiAqXG4gKiBAdXNhZ2VOb3Rlc1xuICogIyMjIEV4YW1wbGVcbiAqXG4gKiBgYGBcbiAqIGltcG9ydCB7Q29tcG9uZW50LCBOZ1pvbmV9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuICogaW1wb3J0IHtOZ0lmfSBmcm9tICdAYW5ndWxhci9jb21tb24nO1xuICpcbiAqIEBDb21wb25lbnQoe1xuICogICBzZWxlY3RvcjogJ25nLXpvbmUtZGVtbycsXG4gKiAgIHRlbXBsYXRlOiBgXG4gKiAgICAgPGgyPkRlbW86IE5nWm9uZTwvaDI+XG4gKlxuICogICAgIDxwPlByb2dyZXNzOiB7e3Byb2dyZXNzfX0lPC9wPlxuICogICAgIDxwICpuZ0lmPVwicHJvZ3Jlc3MgPj0gMTAwXCI+RG9uZSBwcm9jZXNzaW5nIHt7bGFiZWx9fSBvZiBBbmd1bGFyIHpvbmUhPC9wPlxuICpcbiAqICAgICA8YnV0dG9uIChjbGljayk9XCJwcm9jZXNzV2l0aGluQW5ndWxhclpvbmUoKVwiPlByb2Nlc3Mgd2l0aGluIEFuZ3VsYXIgem9uZTwvYnV0dG9uPlxuICogICAgIDxidXR0b24gKGNsaWNrKT1cInByb2Nlc3NPdXRzaWRlT2ZBbmd1bGFyWm9uZSgpXCI+UHJvY2VzcyBvdXRzaWRlIG9mIEFuZ3VsYXIgem9uZTwvYnV0dG9uPlxuICogICBgLFxuICogfSlcbiAqIGV4cG9ydCBjbGFzcyBOZ1pvbmVEZW1vIHtcbiAqICAgcHJvZ3Jlc3M6IG51bWJlciA9IDA7XG4gKiAgIGxhYmVsOiBzdHJpbmc7XG4gKlxuICogICBjb25zdHJ1Y3Rvcihwcml2YXRlIF9uZ1pvbmU6IE5nWm9uZSkge31cbiAqXG4gKiAgIC8vIExvb3AgaW5zaWRlIHRoZSBBbmd1bGFyIHpvbmVcbiAqICAgLy8gc28gdGhlIFVJIERPRVMgcmVmcmVzaCBhZnRlciBlYWNoIHNldFRpbWVvdXQgY3ljbGVcbiAqICAgcHJvY2Vzc1dpdGhpbkFuZ3VsYXJab25lKCkge1xuICogICAgIHRoaXMubGFiZWwgPSAnaW5zaWRlJztcbiAqICAgICB0aGlzLnByb2dyZXNzID0gMDtcbiAqICAgICB0aGlzLl9pbmNyZWFzZVByb2dyZXNzKCgpID0+IGNvbnNvbGUubG9nKCdJbnNpZGUgRG9uZSEnKSk7XG4gKiAgIH1cbiAqXG4gKiAgIC8vIExvb3Agb3V0c2lkZSBvZiB0aGUgQW5ndWxhciB6b25lXG4gKiAgIC8vIHNvIHRoZSBVSSBET0VTIE5PVCByZWZyZXNoIGFmdGVyIGVhY2ggc2V0VGltZW91dCBjeWNsZVxuICogICBwcm9jZXNzT3V0c2lkZU9mQW5ndWxhclpvbmUoKSB7XG4gKiAgICAgdGhpcy5sYWJlbCA9ICdvdXRzaWRlJztcbiAqICAgICB0aGlzLnByb2dyZXNzID0gMDtcbiAqICAgICB0aGlzLl9uZ1pvbmUucnVuT3V0c2lkZUFuZ3VsYXIoKCkgPT4ge1xuICogICAgICAgdGhpcy5faW5jcmVhc2VQcm9ncmVzcygoKSA9PiB7XG4gKiAgICAgICAgIC8vIHJlZW50ZXIgdGhlIEFuZ3VsYXIgem9uZSBhbmQgZGlzcGxheSBkb25lXG4gKiAgICAgICAgIHRoaXMuX25nWm9uZS5ydW4oKCkgPT4geyBjb25zb2xlLmxvZygnT3V0c2lkZSBEb25lIScpOyB9KTtcbiAqICAgICAgIH0pO1xuICogICAgIH0pO1xuICogICB9XG4gKlxuICogICBfaW5jcmVhc2VQcm9ncmVzcyhkb25lQ2FsbGJhY2s6ICgpID0+IHZvaWQpIHtcbiAqICAgICB0aGlzLnByb2dyZXNzICs9IDE7XG4gKiAgICAgY29uc29sZS5sb2coYEN1cnJlbnQgcHJvZ3Jlc3M6ICR7dGhpcy5wcm9ncmVzc30lYCk7XG4gKlxuICogICAgIGlmICh0aGlzLnByb2dyZXNzIDwgMTAwKSB7XG4gKiAgICAgICB3aW5kb3cuc2V0VGltZW91dCgoKSA9PiB0aGlzLl9pbmNyZWFzZVByb2dyZXNzKGRvbmVDYWxsYmFjayksIDEwKTtcbiAqICAgICB9IGVsc2Uge1xuICogICAgICAgZG9uZUNhbGxiYWNrKCk7XG4gKiAgICAgfVxuICogICB9XG4gKiB9XG4gKiBgYGBcbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBjbGFzcyBOZ1pvbmUge1xuICByZWFkb25seSBoYXNQZW5kaW5nTWFjcm90YXNrczogYm9vbGVhbiA9IGZhbHNlO1xuICByZWFkb25seSBoYXNQZW5kaW5nTWljcm90YXNrczogYm9vbGVhbiA9IGZhbHNlO1xuXG4gIC8qKlxuICAgKiBXaGV0aGVyIHRoZXJlIGFyZSBubyBvdXRzdGFuZGluZyBtaWNyb3Rhc2tzIG9yIG1hY3JvdGFza3MuXG4gICAqL1xuICByZWFkb25seSBpc1N0YWJsZTogYm9vbGVhbiA9IHRydWU7XG5cbiAgLyoqXG4gICAqIE5vdGlmaWVzIHdoZW4gY29kZSBlbnRlcnMgQW5ndWxhciBab25lLiBUaGlzIGdldHMgZmlyZWQgZmlyc3Qgb24gVk0gVHVybi5cbiAgICovXG4gIHJlYWRvbmx5IG9uVW5zdGFibGU6IEV2ZW50RW1pdHRlcjxhbnk+ID0gbmV3IEV2ZW50RW1pdHRlcihmYWxzZSk7XG5cbiAgLyoqXG4gICAqIE5vdGlmaWVzIHdoZW4gdGhlcmUgaXMgbm8gbW9yZSBtaWNyb3Rhc2tzIGVucXVldWVkIGluIHRoZSBjdXJyZW50IFZNIFR1cm4uXG4gICAqIFRoaXMgaXMgYSBoaW50IGZvciBBbmd1bGFyIHRvIGRvIGNoYW5nZSBkZXRlY3Rpb24sIHdoaWNoIG1heSBlbnF1ZXVlIG1vcmUgbWljcm90YXNrcy5cbiAgICogRm9yIHRoaXMgcmVhc29uIHRoaXMgZXZlbnQgY2FuIGZpcmUgbXVsdGlwbGUgdGltZXMgcGVyIFZNIFR1cm4uXG4gICAqL1xuICByZWFkb25seSBvbk1pY3JvdGFza0VtcHR5OiBFdmVudEVtaXR0ZXI8YW55PiA9IG5ldyBFdmVudEVtaXR0ZXIoZmFsc2UpO1xuXG4gIC8qKlxuICAgKiBOb3RpZmllcyB3aGVuIHRoZSBsYXN0IGBvbk1pY3JvdGFza0VtcHR5YCBoYXMgcnVuIGFuZCB0aGVyZSBhcmUgbm8gbW9yZSBtaWNyb3Rhc2tzLCB3aGljaFxuICAgKiBpbXBsaWVzIHdlIGFyZSBhYm91dCB0byByZWxpbnF1aXNoIFZNIHR1cm4uXG4gICAqIFRoaXMgZXZlbnQgZ2V0cyBjYWxsZWQganVzdCBvbmNlLlxuICAgKi9cbiAgcmVhZG9ubHkgb25TdGFibGU6IEV2ZW50RW1pdHRlcjxhbnk+ID0gbmV3IEV2ZW50RW1pdHRlcihmYWxzZSk7XG5cbiAgLyoqXG4gICAqIE5vdGlmaWVzIHRoYXQgYW4gZXJyb3IgaGFzIGJlZW4gZGVsaXZlcmVkLlxuICAgKi9cbiAgcmVhZG9ubHkgb25FcnJvcjogRXZlbnRFbWl0dGVyPGFueT4gPSBuZXcgRXZlbnRFbWl0dGVyKGZhbHNlKTtcblxuICBjb25zdHJ1Y3Rvcih7XG4gICAgZW5hYmxlTG9uZ1N0YWNrVHJhY2UgPSBmYWxzZSxcbiAgICBzaG91bGRDb2FsZXNjZUV2ZW50Q2hhbmdlRGV0ZWN0aW9uID0gZmFsc2UsXG4gICAgc2hvdWxkQ29hbGVzY2VSdW5DaGFuZ2VEZXRlY3Rpb24gPSBmYWxzZVxuICB9KSB7XG4gICAgaWYgKHR5cGVvZiBab25lID09ICd1bmRlZmluZWQnKSB7XG4gICAgICB0aHJvdyBuZXcgUnVudGltZUVycm9yKFxuICAgICAgICAgIFJ1bnRpbWVFcnJvckNvZGUuTUlTU0lOR19aT05FSlMsXG4gICAgICAgICAgbmdEZXZNb2RlICYmIGBJbiB0aGlzIGNvbmZpZ3VyYXRpb24gQW5ndWxhciByZXF1aXJlcyBab25lLmpzYCk7XG4gICAgfVxuXG4gICAgWm9uZS5hc3NlcnRab25lUGF0Y2hlZCgpO1xuICAgIGNvbnN0IHNlbGYgPSB0aGlzIGFzIGFueSBhcyBOZ1pvbmVQcml2YXRlO1xuICAgIHNlbGYuX25lc3RpbmcgPSAwO1xuXG4gICAgc2VsZi5fb3V0ZXIgPSBzZWxmLl9pbm5lciA9IFpvbmUuY3VycmVudDtcblxuICAgIC8vIEFzeW5jU3RhY2tUYWdnaW5nWm9uZVNwZWMgcHJvdmlkZXMgYGxpbmtlZCBzdGFjayB0cmFjZXNgIHRvIHNob3dcbiAgICAvLyB3aGVyZSB0aGUgYXN5bmMgb3BlcmF0aW9uIGlzIHNjaGVkdWxlZC4gRm9yIG1vcmUgZGV0YWlscywgcmVmZXJcbiAgICAvLyB0byB0aGlzIGFydGljbGUsIGh0dHBzOi8vZGV2ZWxvcGVyLmNocm9tZS5jb20vYmxvZy9kZXZ0b29scy1iZXR0ZXItYW5ndWxhci1kZWJ1Z2dpbmcvXG4gICAgLy8gQW5kIHdlIG9ubHkgaW1wb3J0IHRoaXMgQXN5bmNTdGFja1RhZ2dpbmdab25lU3BlYyBpbiBkZXZlbG9wbWVudCBtb2RlLFxuICAgIC8vIGluIHRoZSBwcm9kdWN0aW9uIG1vZGUsIHRoZSBBc3luY1N0YWNrVGFnZ2luZ1pvbmVTcGVjIHdpbGwgYmUgdHJlZSBzaGFrZW4gYXdheS5cbiAgICBpZiAobmdEZXZNb2RlKSB7XG4gICAgICBzZWxmLl9pbm5lciA9IHNlbGYuX2lubmVyLmZvcmsobmV3IEFzeW5jU3RhY2tUYWdnaW5nWm9uZVNwZWMoJ0FuZ3VsYXInKSk7XG4gICAgfVxuXG4gICAgaWYgKChab25lIGFzIGFueSlbJ1Rhc2tUcmFja2luZ1pvbmVTcGVjJ10pIHtcbiAgICAgIHNlbGYuX2lubmVyID0gc2VsZi5faW5uZXIuZm9yayhuZXcgKChab25lIGFzIGFueSlbJ1Rhc2tUcmFja2luZ1pvbmVTcGVjJ10gYXMgYW55KSk7XG4gICAgfVxuXG4gICAgaWYgKGVuYWJsZUxvbmdTdGFja1RyYWNlICYmIChab25lIGFzIGFueSlbJ2xvbmdTdGFja1RyYWNlWm9uZVNwZWMnXSkge1xuICAgICAgc2VsZi5faW5uZXIgPSBzZWxmLl9pbm5lci5mb3JrKChab25lIGFzIGFueSlbJ2xvbmdTdGFja1RyYWNlWm9uZVNwZWMnXSk7XG4gICAgfVxuICAgIC8vIGlmIHNob3VsZENvYWxlc2NlUnVuQ2hhbmdlRGV0ZWN0aW9uIGlzIHRydWUsIGFsbCB0YXNrcyBpbmNsdWRpbmcgZXZlbnQgdGFza3Mgd2lsbCBiZVxuICAgIC8vIGNvYWxlc2NlZCwgc28gc2hvdWxkQ29hbGVzY2VFdmVudENoYW5nZURldGVjdGlvbiBvcHRpb24gaXMgbm90IG5lY2Vzc2FyeSBhbmQgY2FuIGJlIHNraXBwZWQuXG4gICAgc2VsZi5zaG91bGRDb2FsZXNjZUV2ZW50Q2hhbmdlRGV0ZWN0aW9uID1cbiAgICAgICAgIXNob3VsZENvYWxlc2NlUnVuQ2hhbmdlRGV0ZWN0aW9uICYmIHNob3VsZENvYWxlc2NlRXZlbnRDaGFuZ2VEZXRlY3Rpb247XG4gICAgc2VsZi5zaG91bGRDb2FsZXNjZVJ1bkNoYW5nZURldGVjdGlvbiA9IHNob3VsZENvYWxlc2NlUnVuQ2hhbmdlRGV0ZWN0aW9uO1xuICAgIHNlbGYubGFzdFJlcXVlc3RBbmltYXRpb25GcmFtZUlkID0gLTE7XG4gICAgc2VsZi5uYXRpdmVSZXF1ZXN0QW5pbWF0aW9uRnJhbWUgPSBnZXROYXRpdmVSZXF1ZXN0QW5pbWF0aW9uRnJhbWUoKS5uYXRpdmVSZXF1ZXN0QW5pbWF0aW9uRnJhbWU7XG4gICAgZm9ya0lubmVyWm9uZVdpdGhBbmd1bGFyQmVoYXZpb3Ioc2VsZik7XG4gIH1cblxuICAvKipcbiAgICBUaGlzIG1ldGhvZCBjaGVja3Mgd2hldGhlciB0aGUgbWV0aG9kIGNhbGwgaGFwcGVucyB3aXRoaW4gYW4gQW5ndWxhciBab25lIGluc3RhbmNlLlxuICAqL1xuICBzdGF0aWMgaXNJbkFuZ3VsYXJab25lKCk6IGJvb2xlYW4ge1xuICAgIC8vIFpvbmUgbmVlZHMgdG8gYmUgY2hlY2tlZCwgYmVjYXVzZSB0aGlzIG1ldGhvZCBtaWdodCBiZSBjYWxsZWQgZXZlbiB3aGVuIE5vb3BOZ1pvbmUgaXMgdXNlZC5cbiAgICByZXR1cm4gdHlwZW9mIFpvbmUgIT09ICd1bmRlZmluZWQnICYmIFpvbmUuY3VycmVudC5nZXQoJ2lzQW5ndWxhclpvbmUnKSA9PT0gdHJ1ZTtcbiAgfVxuXG4gIC8qKlxuICAgIEFzc3VyZXMgdGhhdCB0aGUgbWV0aG9kIGlzIGNhbGxlZCB3aXRoaW4gdGhlIEFuZ3VsYXIgWm9uZSwgb3RoZXJ3aXNlIHRocm93cyBhbiBlcnJvci5cbiAgKi9cbiAgc3RhdGljIGFzc2VydEluQW5ndWxhclpvbmUoKTogdm9pZCB7XG4gICAgaWYgKCFOZ1pvbmUuaXNJbkFuZ3VsYXJab25lKCkpIHtcbiAgICAgIHRocm93IG5ldyBSdW50aW1lRXJyb3IoXG4gICAgICAgICAgUnVudGltZUVycm9yQ29kZS5VTkVYUEVDVEVEX1pPTkVfU1RBVEUsXG4gICAgICAgICAgbmdEZXZNb2RlICYmICdFeHBlY3RlZCB0byBiZSBpbiBBbmd1bGFyIFpvbmUsIGJ1dCBpdCBpcyBub3QhJyk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAgQXNzdXJlcyB0aGF0IHRoZSBtZXRob2QgaXMgY2FsbGVkIG91dHNpZGUgb2YgdGhlIEFuZ3VsYXIgWm9uZSwgb3RoZXJ3aXNlIHRocm93cyBhbiBlcnJvci5cbiAgKi9cbiAgc3RhdGljIGFzc2VydE5vdEluQW5ndWxhclpvbmUoKTogdm9pZCB7XG4gICAgaWYgKE5nWm9uZS5pc0luQW5ndWxhclpvbmUoKSkge1xuICAgICAgdGhyb3cgbmV3IFJ1bnRpbWVFcnJvcihcbiAgICAgICAgICBSdW50aW1lRXJyb3JDb2RlLlVORVhQRUNURURfWk9ORV9TVEFURSxcbiAgICAgICAgICBuZ0Rldk1vZGUgJiYgJ0V4cGVjdGVkIHRvIG5vdCBiZSBpbiBBbmd1bGFyIFpvbmUsIGJ1dCBpdCBpcyEnKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogRXhlY3V0ZXMgdGhlIGBmbmAgZnVuY3Rpb24gc3luY2hyb25vdXNseSB3aXRoaW4gdGhlIEFuZ3VsYXIgem9uZSBhbmQgcmV0dXJucyB2YWx1ZSByZXR1cm5lZCBieVxuICAgKiB0aGUgZnVuY3Rpb24uXG4gICAqXG4gICAqIFJ1bm5pbmcgZnVuY3Rpb25zIHZpYSBgcnVuYCBhbGxvd3MgeW91IHRvIHJlZW50ZXIgQW5ndWxhciB6b25lIGZyb20gYSB0YXNrIHRoYXQgd2FzIGV4ZWN1dGVkXG4gICAqIG91dHNpZGUgb2YgdGhlIEFuZ3VsYXIgem9uZSAodHlwaWNhbGx5IHN0YXJ0ZWQgdmlhIHtAbGluayAjcnVuT3V0c2lkZUFuZ3VsYXJ9KS5cbiAgICpcbiAgICogQW55IGZ1dHVyZSB0YXNrcyBvciBtaWNyb3Rhc2tzIHNjaGVkdWxlZCBmcm9tIHdpdGhpbiB0aGlzIGZ1bmN0aW9uIHdpbGwgY29udGludWUgZXhlY3V0aW5nIGZyb21cbiAgICogd2l0aGluIHRoZSBBbmd1bGFyIHpvbmUuXG4gICAqXG4gICAqIElmIGEgc3luY2hyb25vdXMgZXJyb3IgaGFwcGVucyBpdCB3aWxsIGJlIHJldGhyb3duIGFuZCBub3QgcmVwb3J0ZWQgdmlhIGBvbkVycm9yYC5cbiAgICovXG4gIHJ1bjxUPihmbjogKC4uLmFyZ3M6IGFueVtdKSA9PiBULCBhcHBseVRoaXM/OiBhbnksIGFwcGx5QXJncz86IGFueVtdKTogVCB7XG4gICAgcmV0dXJuICh0aGlzIGFzIGFueSBhcyBOZ1pvbmVQcml2YXRlKS5faW5uZXIucnVuKGZuLCBhcHBseVRoaXMsIGFwcGx5QXJncyk7XG4gIH1cblxuICAvKipcbiAgICogRXhlY3V0ZXMgdGhlIGBmbmAgZnVuY3Rpb24gc3luY2hyb25vdXNseSB3aXRoaW4gdGhlIEFuZ3VsYXIgem9uZSBhcyBhIHRhc2sgYW5kIHJldHVybnMgdmFsdWVcbiAgICogcmV0dXJuZWQgYnkgdGhlIGZ1bmN0aW9uLlxuICAgKlxuICAgKiBSdW5uaW5nIGZ1bmN0aW9ucyB2aWEgYHJ1bmAgYWxsb3dzIHlvdSB0byByZWVudGVyIEFuZ3VsYXIgem9uZSBmcm9tIGEgdGFzayB0aGF0IHdhcyBleGVjdXRlZFxuICAgKiBvdXRzaWRlIG9mIHRoZSBBbmd1bGFyIHpvbmUgKHR5cGljYWxseSBzdGFydGVkIHZpYSB7QGxpbmsgI3J1bk91dHNpZGVBbmd1bGFyfSkuXG4gICAqXG4gICAqIEFueSBmdXR1cmUgdGFza3Mgb3IgbWljcm90YXNrcyBzY2hlZHVsZWQgZnJvbSB3aXRoaW4gdGhpcyBmdW5jdGlvbiB3aWxsIGNvbnRpbnVlIGV4ZWN1dGluZyBmcm9tXG4gICAqIHdpdGhpbiB0aGUgQW5ndWxhciB6b25lLlxuICAgKlxuICAgKiBJZiBhIHN5bmNocm9ub3VzIGVycm9yIGhhcHBlbnMgaXQgd2lsbCBiZSByZXRocm93biBhbmQgbm90IHJlcG9ydGVkIHZpYSBgb25FcnJvcmAuXG4gICAqL1xuICBydW5UYXNrPFQ+KGZuOiAoLi4uYXJnczogYW55W10pID0+IFQsIGFwcGx5VGhpcz86IGFueSwgYXBwbHlBcmdzPzogYW55W10sIG5hbWU/OiBzdHJpbmcpOiBUIHtcbiAgICBjb25zdCB6b25lID0gKHRoaXMgYXMgYW55IGFzIE5nWm9uZVByaXZhdGUpLl9pbm5lcjtcbiAgICBjb25zdCB0YXNrID0gem9uZS5zY2hlZHVsZUV2ZW50VGFzaygnTmdab25lRXZlbnQ6ICcgKyBuYW1lLCBmbiwgRU1QVFlfUEFZTE9BRCwgbm9vcCwgbm9vcCk7XG4gICAgdHJ5IHtcbiAgICAgIHJldHVybiB6b25lLnJ1blRhc2sodGFzaywgYXBwbHlUaGlzLCBhcHBseUFyZ3MpO1xuICAgIH0gZmluYWxseSB7XG4gICAgICB6b25lLmNhbmNlbFRhc2sodGFzayk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFNhbWUgYXMgYHJ1bmAsIGV4Y2VwdCB0aGF0IHN5bmNocm9ub3VzIGVycm9ycyBhcmUgY2F1Z2h0IGFuZCBmb3J3YXJkZWQgdmlhIGBvbkVycm9yYCBhbmQgbm90XG4gICAqIHJldGhyb3duLlxuICAgKi9cbiAgcnVuR3VhcmRlZDxUPihmbjogKC4uLmFyZ3M6IGFueVtdKSA9PiBULCBhcHBseVRoaXM/OiBhbnksIGFwcGx5QXJncz86IGFueVtdKTogVCB7XG4gICAgcmV0dXJuICh0aGlzIGFzIGFueSBhcyBOZ1pvbmVQcml2YXRlKS5faW5uZXIucnVuR3VhcmRlZChmbiwgYXBwbHlUaGlzLCBhcHBseUFyZ3MpO1xuICB9XG5cbiAgLyoqXG4gICAqIEV4ZWN1dGVzIHRoZSBgZm5gIGZ1bmN0aW9uIHN5bmNocm9ub3VzbHkgaW4gQW5ndWxhcidzIHBhcmVudCB6b25lIGFuZCByZXR1cm5zIHZhbHVlIHJldHVybmVkIGJ5XG4gICAqIHRoZSBmdW5jdGlvbi5cbiAgICpcbiAgICogUnVubmluZyBmdW5jdGlvbnMgdmlhIHtAbGluayAjcnVuT3V0c2lkZUFuZ3VsYXJ9IGFsbG93cyB5b3UgdG8gZXNjYXBlIEFuZ3VsYXIncyB6b25lIGFuZCBkb1xuICAgKiB3b3JrIHRoYXRcbiAgICogZG9lc24ndCB0cmlnZ2VyIEFuZ3VsYXIgY2hhbmdlLWRldGVjdGlvbiBvciBpcyBzdWJqZWN0IHRvIEFuZ3VsYXIncyBlcnJvciBoYW5kbGluZy5cbiAgICpcbiAgICogQW55IGZ1dHVyZSB0YXNrcyBvciBtaWNyb3Rhc2tzIHNjaGVkdWxlZCBmcm9tIHdpdGhpbiB0aGlzIGZ1bmN0aW9uIHdpbGwgY29udGludWUgZXhlY3V0aW5nIGZyb21cbiAgICogb3V0c2lkZSBvZiB0aGUgQW5ndWxhciB6b25lLlxuICAgKlxuICAgKiBVc2Uge0BsaW5rICNydW59IHRvIHJlZW50ZXIgdGhlIEFuZ3VsYXIgem9uZSBhbmQgZG8gd29yayB0aGF0IHVwZGF0ZXMgdGhlIGFwcGxpY2F0aW9uIG1vZGVsLlxuICAgKi9cbiAgcnVuT3V0c2lkZUFuZ3VsYXI8VD4oZm46ICguLi5hcmdzOiBhbnlbXSkgPT4gVCk6IFQge1xuICAgIHJldHVybiAodGhpcyBhcyBhbnkgYXMgTmdab25lUHJpdmF0ZSkuX291dGVyLnJ1bihmbik7XG4gIH1cbn1cblxuY29uc3QgRU1QVFlfUEFZTE9BRCA9IHt9O1xuXG5pbnRlcmZhY2UgTmdab25lUHJpdmF0ZSBleHRlbmRzIE5nWm9uZSB7XG4gIF9vdXRlcjogWm9uZTtcbiAgX2lubmVyOiBab25lO1xuICBfbmVzdGluZzogbnVtYmVyO1xuICBfaGFzUGVuZGluZ01pY3JvdGFza3M6IGJvb2xlYW47XG5cbiAgaGFzUGVuZGluZ01hY3JvdGFza3M6IGJvb2xlYW47XG4gIGhhc1BlbmRpbmdNaWNyb3Rhc2tzOiBib29sZWFuO1xuICBsYXN0UmVxdWVzdEFuaW1hdGlvbkZyYW1lSWQ6IG51bWJlcjtcbiAgLyoqXG4gICAqIEEgZmxhZyB0byBpbmRpY2F0ZSBpZiBOZ1pvbmUgaXMgY3VycmVudGx5IGluc2lkZVxuICAgKiBjaGVja1N0YWJsZSBhbmQgdG8gcHJldmVudCByZS1lbnRyeS4gVGhlIGZsYWcgaXNcbiAgICogbmVlZGVkIGJlY2F1c2UgaXQgaXMgcG9zc2libGUgdG8gaW52b2tlIHRoZSBjaGFuZ2VcbiAgICogZGV0ZWN0aW9uIGZyb20gd2l0aGluIGNoYW5nZSBkZXRlY3Rpb24gbGVhZGluZyB0b1xuICAgKiBpbmNvcnJlY3QgYmVoYXZpb3IuXG4gICAqXG4gICAqIEZvciBkZXRhaWwsIHBsZWFzZSByZWZlciBoZXJlLFxuICAgKiBodHRwczovL2dpdGh1Yi5jb20vYW5ndWxhci9hbmd1bGFyL3B1bGwvNDA1NDBcbiAgICovXG4gIGlzQ2hlY2tTdGFibGVSdW5uaW5nOiBib29sZWFuO1xuICBpc1N0YWJsZTogYm9vbGVhbjtcbiAgLyoqXG4gICAqIE9wdGlvbmFsbHkgc3BlY2lmeSBjb2FsZXNjaW5nIGV2ZW50IGNoYW5nZSBkZXRlY3Rpb25zIG9yIG5vdC5cbiAgICogQ29uc2lkZXIgdGhlIGZvbGxvd2luZyBjYXNlLlxuICAgKlxuICAgKiA8ZGl2IChjbGljayk9XCJkb1NvbWV0aGluZygpXCI+XG4gICAqICAgPGJ1dHRvbiAoY2xpY2spPVwiZG9Tb21ldGhpbmdFbHNlKClcIj48L2J1dHRvbj5cbiAgICogPC9kaXY+XG4gICAqXG4gICAqIFdoZW4gYnV0dG9uIGlzIGNsaWNrZWQsIGJlY2F1c2Ugb2YgdGhlIGV2ZW50IGJ1YmJsaW5nLCBib3RoXG4gICAqIGV2ZW50IGhhbmRsZXJzIHdpbGwgYmUgY2FsbGVkIGFuZCAyIGNoYW5nZSBkZXRlY3Rpb25zIHdpbGwgYmVcbiAgICogdHJpZ2dlcmVkLiBXZSBjYW4gY29hbGVzY2Ugc3VjaCBraW5kIG9mIGV2ZW50cyB0byB0cmlnZ2VyXG4gICAqIGNoYW5nZSBkZXRlY3Rpb24gb25seSBvbmNlLlxuICAgKlxuICAgKiBCeSBkZWZhdWx0LCB0aGlzIG9wdGlvbiB3aWxsIGJlIGZhbHNlLiBTbyB0aGUgZXZlbnRzIHdpbGwgbm90IGJlXG4gICAqIGNvYWxlc2NlZCBhbmQgdGhlIGNoYW5nZSBkZXRlY3Rpb24gd2lsbCBiZSB0cmlnZ2VyZWQgbXVsdGlwbGUgdGltZXMuXG4gICAqIEFuZCBpZiB0aGlzIG9wdGlvbiBiZSBzZXQgdG8gdHJ1ZSwgdGhlIGNoYW5nZSBkZXRlY3Rpb24gd2lsbCBiZVxuICAgKiB0cmlnZ2VyZWQgYXN5bmMgYnkgc2NoZWR1bGluZyBpdCBpbiBhbiBhbmltYXRpb24gZnJhbWUuIFNvIGluIHRoZSBjYXNlIGFib3ZlLFxuICAgKiB0aGUgY2hhbmdlIGRldGVjdGlvbiB3aWxsIG9ubHkgYmUgdHJpZ2dlZCBvbmNlLlxuICAgKi9cbiAgc2hvdWxkQ29hbGVzY2VFdmVudENoYW5nZURldGVjdGlvbjogYm9vbGVhbjtcbiAgLyoqXG4gICAqIE9wdGlvbmFsbHkgc3BlY2lmeSBpZiBgTmdab25lI3J1bigpYCBtZXRob2QgaW52b2NhdGlvbnMgc2hvdWxkIGJlIGNvYWxlc2NlZFxuICAgKiBpbnRvIGEgc2luZ2xlIGNoYW5nZSBkZXRlY3Rpb24uXG4gICAqXG4gICAqIENvbnNpZGVyIHRoZSBmb2xsb3dpbmcgY2FzZS5cbiAgICpcbiAgICogZm9yIChsZXQgaSA9IDA7IGkgPCAxMDsgaSArKykge1xuICAgKiAgIG5nWm9uZS5ydW4oKCkgPT4ge1xuICAgKiAgICAgLy8gZG8gc29tZXRoaW5nXG4gICAqICAgfSk7XG4gICAqIH1cbiAgICpcbiAgICogVGhpcyBjYXNlIHRyaWdnZXJzIHRoZSBjaGFuZ2UgZGV0ZWN0aW9uIG11bHRpcGxlIHRpbWVzLlxuICAgKiBXaXRoIG5nWm9uZVJ1bkNvYWxlc2Npbmcgb3B0aW9ucywgYWxsIGNoYW5nZSBkZXRlY3Rpb25zIGluIGFuIGV2ZW50IGxvb3BzIHRyaWdnZXIgb25seSBvbmNlLlxuICAgKiBJbiBhZGRpdGlvbiwgdGhlIGNoYW5nZSBkZXRlY3Rpb24gZXhlY3V0ZXMgaW4gcmVxdWVzdEFuaW1hdGlvbi5cbiAgICpcbiAgICovXG4gIHNob3VsZENvYWxlc2NlUnVuQ2hhbmdlRGV0ZWN0aW9uOiBib29sZWFuO1xuXG4gIG5hdGl2ZVJlcXVlc3RBbmltYXRpb25GcmFtZTogKGNhbGxiYWNrOiBGcmFtZVJlcXVlc3RDYWxsYmFjaykgPT4gbnVtYmVyO1xuXG4gIC8vIENhY2hlIGEgIFwiZmFrZVwiIHRvcCBldmVudFRhc2sgc28geW91IGRvbid0IG5lZWQgdG8gc2NoZWR1bGUgYSBuZXcgdGFzayBldmVyeVxuICAvLyB0aW1lIHlvdSBydW4gYSBgY2hlY2tTdGFibGVgLlxuICBmYWtlVG9wRXZlbnRUYXNrOiBUYXNrO1xufVxuXG5mdW5jdGlvbiBjaGVja1N0YWJsZSh6b25lOiBOZ1pvbmVQcml2YXRlKSB7XG4gIC8vIFRPRE86IEBKaWFMaVBhc3Npb24sIHNob3VsZCBjaGVjayB6b25lLmlzQ2hlY2tTdGFibGVSdW5uaW5nIHRvIHByZXZlbnRcbiAgLy8gcmUtZW50cnkuIFRoZSBjYXNlIGlzOlxuICAvL1xuICAvLyBAQ29tcG9uZW50KHsuLi59KVxuICAvLyBleHBvcnQgY2xhc3MgQXBwQ29tcG9uZW50IHtcbiAgLy8gY29uc3RydWN0b3IocHJpdmF0ZSBuZ1pvbmU6IE5nWm9uZSkge1xuICAvLyAgIHRoaXMubmdab25lLm9uU3RhYmxlLnN1YnNjcmliZSgoKSA9PiB7XG4gIC8vICAgICB0aGlzLm5nWm9uZS5ydW4oKCkgPT4gY29uc29sZS5sb2coJ3N0YWJsZScpOyk7XG4gIC8vICAgfSk7XG4gIC8vIH1cbiAgLy9cbiAgLy8gVGhlIG9uU3RhYmxlIHN1YnNjcmliZXIgcnVuIGFub3RoZXIgZnVuY3Rpb24gaW5zaWRlIG5nWm9uZVxuICAvLyB3aGljaCBjYXVzZXMgYGNoZWNrU3RhYmxlKClgIHJlLWVudHJ5LlxuICAvLyBCdXQgdGhpcyBmaXggY2F1c2VzIHNvbWUgaXNzdWVzIGluIGczLCBzbyB0aGlzIGZpeCB3aWxsIGJlXG4gIC8vIGxhdW5jaGVkIGluIGFub3RoZXIgUFIuXG4gIGlmICh6b25lLl9uZXN0aW5nID09IDAgJiYgIXpvbmUuaGFzUGVuZGluZ01pY3JvdGFza3MgJiYgIXpvbmUuaXNTdGFibGUpIHtcbiAgICB0cnkge1xuICAgICAgem9uZS5fbmVzdGluZysrO1xuICAgICAgem9uZS5vbk1pY3JvdGFza0VtcHR5LmVtaXQobnVsbCk7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIHpvbmUuX25lc3RpbmctLTtcbiAgICAgIGlmICghem9uZS5oYXNQZW5kaW5nTWljcm90YXNrcykge1xuICAgICAgICB0cnkge1xuICAgICAgICAgIHpvbmUucnVuT3V0c2lkZUFuZ3VsYXIoKCkgPT4gem9uZS5vblN0YWJsZS5lbWl0KG51bGwpKTtcbiAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICB6b25lLmlzU3RhYmxlID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBkZWxheUNoYW5nZURldGVjdGlvbkZvckV2ZW50cyh6b25lOiBOZ1pvbmVQcml2YXRlKSB7XG4gIC8qKlxuICAgKiBXZSBhbHNvIG5lZWQgdG8gY2hlY2sgX25lc3RpbmcgaGVyZVxuICAgKiBDb25zaWRlciB0aGUgZm9sbG93aW5nIGNhc2Ugd2l0aCBzaG91bGRDb2FsZXNjZVJ1bkNoYW5nZURldGVjdGlvbiA9IHRydWVcbiAgICpcbiAgICogbmdab25lLnJ1bigoKSA9PiB7fSk7XG4gICAqIG5nWm9uZS5ydW4oKCkgPT4ge30pO1xuICAgKlxuICAgKiBXZSB3YW50IHRoZSB0d28gYG5nWm9uZS5ydW4oKWAgb25seSB0cmlnZ2VyIG9uZSBjaGFuZ2UgZGV0ZWN0aW9uXG4gICAqIHdoZW4gc2hvdWxkQ29hbGVzY2VSdW5DaGFuZ2VEZXRlY3Rpb24gaXMgdHJ1ZS5cbiAgICogQW5kIGJlY2F1c2UgaW4gdGhpcyBjYXNlLCBjaGFuZ2UgZGV0ZWN0aW9uIHJ1biBpbiBhc3luYyB3YXkocmVxdWVzdEFuaW1hdGlvbkZyYW1lKSxcbiAgICogc28gd2UgYWxzbyBuZWVkIHRvIGNoZWNrIHRoZSBfbmVzdGluZyBoZXJlIHRvIHByZXZlbnQgbXVsdGlwbGVcbiAgICogY2hhbmdlIGRldGVjdGlvbnMuXG4gICAqL1xuICBpZiAoem9uZS5pc0NoZWNrU3RhYmxlUnVubmluZyB8fCB6b25lLmxhc3RSZXF1ZXN0QW5pbWF0aW9uRnJhbWVJZCAhPT0gLTEpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgem9uZS5sYXN0UmVxdWVzdEFuaW1hdGlvbkZyYW1lSWQgPSB6b25lLm5hdGl2ZVJlcXVlc3RBbmltYXRpb25GcmFtZS5jYWxsKGdsb2JhbCwgKCkgPT4ge1xuICAgIC8vIFRoaXMgaXMgYSB3b3JrIGFyb3VuZCBmb3IgaHR0cHM6Ly9naXRodWIuY29tL2FuZ3VsYXIvYW5ndWxhci9pc3N1ZXMvMzY4MzkuXG4gICAgLy8gVGhlIGNvcmUgaXNzdWUgaXMgdGhhdCB3aGVuIGV2ZW50IGNvYWxlc2NpbmcgaXMgZW5hYmxlZCBpdCBpcyBwb3NzaWJsZSBmb3IgbWljcm90YXNrc1xuICAgIC8vIHRvIGdldCBmbHVzaGVkIHRvbyBlYXJseSAoQXMgaXMgdGhlIGNhc2Ugd2l0aCBgUHJvbWlzZS50aGVuYCkgYmV0d2VlbiB0aGVcbiAgICAvLyBjb2FsZXNjaW5nIGV2ZW50VGFza3MuXG4gICAgLy9cbiAgICAvLyBUbyB3b3JrYXJvdW5kIHRoaXMgd2Ugc2NoZWR1bGUgYSBcImZha2VcIiBldmVudFRhc2sgYmVmb3JlIHdlIHByb2Nlc3MgdGhlXG4gICAgLy8gY29hbGVzY2luZyBldmVudFRhc2tzLiBUaGUgYmVuZWZpdCBvZiB0aGlzIGlzIHRoYXQgdGhlIFwiZmFrZVwiIGNvbnRhaW5lciBldmVudFRhc2tcbiAgICAvLyAgd2lsbCBwcmV2ZW50IHRoZSBtaWNyb3Rhc2tzIHF1ZXVlIGZyb20gZ2V0dGluZyBkcmFpbmVkIGluIGJldHdlZW4gdGhlIGNvYWxlc2NpbmdcbiAgICAvLyBldmVudFRhc2sgZXhlY3V0aW9uLlxuICAgIGlmICghem9uZS5mYWtlVG9wRXZlbnRUYXNrKSB7XG4gICAgICB6b25lLmZha2VUb3BFdmVudFRhc2sgPSBab25lLnJvb3Quc2NoZWR1bGVFdmVudFRhc2soJ2Zha2VUb3BFdmVudFRhc2snLCAoKSA9PiB7XG4gICAgICAgIHpvbmUubGFzdFJlcXVlc3RBbmltYXRpb25GcmFtZUlkID0gLTE7XG4gICAgICAgIHVwZGF0ZU1pY3JvVGFza1N0YXR1cyh6b25lKTtcbiAgICAgICAgem9uZS5pc0NoZWNrU3RhYmxlUnVubmluZyA9IHRydWU7XG4gICAgICAgIGNoZWNrU3RhYmxlKHpvbmUpO1xuICAgICAgICB6b25lLmlzQ2hlY2tTdGFibGVSdW5uaW5nID0gZmFsc2U7XG4gICAgICB9LCB1bmRlZmluZWQsICgpID0+IHt9LCAoKSA9PiB7fSk7XG4gICAgfVxuICAgIHpvbmUuZmFrZVRvcEV2ZW50VGFzay5pbnZva2UoKTtcbiAgfSk7XG4gIHVwZGF0ZU1pY3JvVGFza1N0YXR1cyh6b25lKTtcbn1cblxuZnVuY3Rpb24gZm9ya0lubmVyWm9uZVdpdGhBbmd1bGFyQmVoYXZpb3Ioem9uZTogTmdab25lUHJpdmF0ZSkge1xuICBjb25zdCBkZWxheUNoYW5nZURldGVjdGlvbkZvckV2ZW50c0RlbGVnYXRlID0gKCkgPT4ge1xuICAgIGRlbGF5Q2hhbmdlRGV0ZWN0aW9uRm9yRXZlbnRzKHpvbmUpO1xuICB9O1xuICB6b25lLl9pbm5lciA9IHpvbmUuX2lubmVyLmZvcmsoe1xuICAgIG5hbWU6ICdhbmd1bGFyJyxcbiAgICBwcm9wZXJ0aWVzOiA8YW55PnsnaXNBbmd1bGFyWm9uZSc6IHRydWV9LFxuICAgIG9uSW52b2tlVGFzazpcbiAgICAgICAgKGRlbGVnYXRlOiBab25lRGVsZWdhdGUsIGN1cnJlbnQ6IFpvbmUsIHRhcmdldDogWm9uZSwgdGFzazogVGFzaywgYXBwbHlUaGlzOiBhbnksXG4gICAgICAgICBhcHBseUFyZ3M6IGFueSk6IGFueSA9PiB7XG4gICAgICAgICAgaWYgKHNob3VsZEJlSWdub3JlZEJ5Wm9uZShhcHBseUFyZ3MpKSB7XG4gICAgICAgICAgICByZXR1cm4gZGVsZWdhdGUuaW52b2tlVGFzayh0YXJnZXQsIHRhc2ssIGFwcGx5VGhpcywgYXBwbHlBcmdzKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgb25FbnRlcih6b25lKTtcbiAgICAgICAgICAgIHJldHVybiBkZWxlZ2F0ZS5pbnZva2VUYXNrKHRhcmdldCwgdGFzaywgYXBwbHlUaGlzLCBhcHBseUFyZ3MpO1xuICAgICAgICAgIH0gZmluYWxseSB7XG4gICAgICAgICAgICBpZiAoKHpvbmUuc2hvdWxkQ29hbGVzY2VFdmVudENoYW5nZURldGVjdGlvbiAmJiB0YXNrLnR5cGUgPT09ICdldmVudFRhc2snKSB8fFxuICAgICAgICAgICAgICAgIHpvbmUuc2hvdWxkQ29hbGVzY2VSdW5DaGFuZ2VEZXRlY3Rpb24pIHtcbiAgICAgICAgICAgICAgZGVsYXlDaGFuZ2VEZXRlY3Rpb25Gb3JFdmVudHNEZWxlZ2F0ZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgb25MZWF2ZSh6b25lKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICBvbkludm9rZTpcbiAgICAgICAgKGRlbGVnYXRlOiBab25lRGVsZWdhdGUsIGN1cnJlbnQ6IFpvbmUsIHRhcmdldDogWm9uZSwgY2FsbGJhY2s6IEZ1bmN0aW9uLCBhcHBseVRoaXM6IGFueSxcbiAgICAgICAgIGFwcGx5QXJncz86IGFueVtdLCBzb3VyY2U/OiBzdHJpbmcpOiBhbnkgPT4ge1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICBvbkVudGVyKHpvbmUpO1xuICAgICAgICAgICAgcmV0dXJuIGRlbGVnYXRlLmludm9rZSh0YXJnZXQsIGNhbGxiYWNrLCBhcHBseVRoaXMsIGFwcGx5QXJncywgc291cmNlKTtcbiAgICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgICAgaWYgKHpvbmUuc2hvdWxkQ29hbGVzY2VSdW5DaGFuZ2VEZXRlY3Rpb24pIHtcbiAgICAgICAgICAgICAgZGVsYXlDaGFuZ2VEZXRlY3Rpb25Gb3JFdmVudHNEZWxlZ2F0ZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgb25MZWF2ZSh6b25lKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICBvbkhhc1Rhc2s6XG4gICAgICAgIChkZWxlZ2F0ZTogWm9uZURlbGVnYXRlLCBjdXJyZW50OiBab25lLCB0YXJnZXQ6IFpvbmUsIGhhc1Rhc2tTdGF0ZTogSGFzVGFza1N0YXRlKSA9PiB7XG4gICAgICAgICAgZGVsZWdhdGUuaGFzVGFzayh0YXJnZXQsIGhhc1Rhc2tTdGF0ZSk7XG4gICAgICAgICAgaWYgKGN1cnJlbnQgPT09IHRhcmdldCkge1xuICAgICAgICAgICAgLy8gV2UgYXJlIG9ubHkgaW50ZXJlc3RlZCBpbiBoYXNUYXNrIGV2ZW50cyB3aGljaCBvcmlnaW5hdGUgZnJvbSBvdXIgem9uZVxuICAgICAgICAgICAgLy8gKEEgY2hpbGQgaGFzVGFzayBldmVudCBpcyBub3QgaW50ZXJlc3RpbmcgdG8gdXMpXG4gICAgICAgICAgICBpZiAoaGFzVGFza1N0YXRlLmNoYW5nZSA9PSAnbWljcm9UYXNrJykge1xuICAgICAgICAgICAgICB6b25lLl9oYXNQZW5kaW5nTWljcm90YXNrcyA9IGhhc1Rhc2tTdGF0ZS5taWNyb1Rhc2s7XG4gICAgICAgICAgICAgIHVwZGF0ZU1pY3JvVGFza1N0YXR1cyh6b25lKTtcbiAgICAgICAgICAgICAgY2hlY2tTdGFibGUoem9uZSk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGhhc1Rhc2tTdGF0ZS5jaGFuZ2UgPT0gJ21hY3JvVGFzaycpIHtcbiAgICAgICAgICAgICAgem9uZS5oYXNQZW5kaW5nTWFjcm90YXNrcyA9IGhhc1Rhc2tTdGF0ZS5tYWNyb1Rhc2s7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgb25IYW5kbGVFcnJvcjogKGRlbGVnYXRlOiBab25lRGVsZWdhdGUsIGN1cnJlbnQ6IFpvbmUsIHRhcmdldDogWm9uZSwgZXJyb3I6IGFueSk6IGJvb2xlYW4gPT4ge1xuICAgICAgZGVsZWdhdGUuaGFuZGxlRXJyb3IodGFyZ2V0LCBlcnJvcik7XG4gICAgICB6b25lLnJ1bk91dHNpZGVBbmd1bGFyKCgpID0+IHpvbmUub25FcnJvci5lbWl0KGVycm9yKSk7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9KTtcbn1cblxuZnVuY3Rpb24gdXBkYXRlTWljcm9UYXNrU3RhdHVzKHpvbmU6IE5nWm9uZVByaXZhdGUpIHtcbiAgaWYgKHpvbmUuX2hhc1BlbmRpbmdNaWNyb3Rhc2tzIHx8XG4gICAgICAoKHpvbmUuc2hvdWxkQ29hbGVzY2VFdmVudENoYW5nZURldGVjdGlvbiB8fCB6b25lLnNob3VsZENvYWxlc2NlUnVuQ2hhbmdlRGV0ZWN0aW9uKSAmJlxuICAgICAgIHpvbmUubGFzdFJlcXVlc3RBbmltYXRpb25GcmFtZUlkICE9PSAtMSkpIHtcbiAgICB6b25lLmhhc1BlbmRpbmdNaWNyb3Rhc2tzID0gdHJ1ZTtcbiAgfSBlbHNlIHtcbiAgICB6b25lLmhhc1BlbmRpbmdNaWNyb3Rhc2tzID0gZmFsc2U7XG4gIH1cbn1cblxuZnVuY3Rpb24gb25FbnRlcih6b25lOiBOZ1pvbmVQcml2YXRlKSB7XG4gIHpvbmUuX25lc3RpbmcrKztcbiAgaWYgKHpvbmUuaXNTdGFibGUpIHtcbiAgICB6b25lLmlzU3RhYmxlID0gZmFsc2U7XG4gICAgem9uZS5vblVuc3RhYmxlLmVtaXQobnVsbCk7XG4gIH1cbn1cblxuZnVuY3Rpb24gb25MZWF2ZSh6b25lOiBOZ1pvbmVQcml2YXRlKSB7XG4gIHpvbmUuX25lc3RpbmctLTtcbiAgY2hlY2tTdGFibGUoem9uZSk7XG59XG5cbi8qKlxuICogUHJvdmlkZXMgYSBub29wIGltcGxlbWVudGF0aW9uIG9mIGBOZ1pvbmVgIHdoaWNoIGRvZXMgbm90aGluZy4gVGhpcyB6b25lIHJlcXVpcmVzIGV4cGxpY2l0IGNhbGxzXG4gKiB0byBmcmFtZXdvcmsgdG8gcGVyZm9ybSByZW5kZXJpbmcuXG4gKi9cbmV4cG9ydCBjbGFzcyBOb29wTmdab25lIGltcGxlbWVudHMgTmdab25lIHtcbiAgcmVhZG9ubHkgaGFzUGVuZGluZ01pY3JvdGFza3MgPSBmYWxzZTtcbiAgcmVhZG9ubHkgaGFzUGVuZGluZ01hY3JvdGFza3MgPSBmYWxzZTtcbiAgcmVhZG9ubHkgaXNTdGFibGUgPSB0cnVlO1xuICByZWFkb25seSBvblVuc3RhYmxlID0gbmV3IEV2ZW50RW1pdHRlcjxhbnk+KCk7XG4gIHJlYWRvbmx5IG9uTWljcm90YXNrRW1wdHkgPSBuZXcgRXZlbnRFbWl0dGVyPGFueT4oKTtcbiAgcmVhZG9ubHkgb25TdGFibGUgPSBuZXcgRXZlbnRFbWl0dGVyPGFueT4oKTtcbiAgcmVhZG9ubHkgb25FcnJvciA9IG5ldyBFdmVudEVtaXR0ZXI8YW55PigpO1xuXG4gIHJ1bjxUPihmbjogKC4uLmFyZ3M6IGFueVtdKSA9PiBULCBhcHBseVRoaXM/OiBhbnksIGFwcGx5QXJncz86IGFueSk6IFQge1xuICAgIHJldHVybiBmbi5hcHBseShhcHBseVRoaXMsIGFwcGx5QXJncyk7XG4gIH1cblxuICBydW5HdWFyZGVkPFQ+KGZuOiAoLi4uYXJnczogYW55W10pID0+IGFueSwgYXBwbHlUaGlzPzogYW55LCBhcHBseUFyZ3M/OiBhbnkpOiBUIHtcbiAgICByZXR1cm4gZm4uYXBwbHkoYXBwbHlUaGlzLCBhcHBseUFyZ3MpO1xuICB9XG5cbiAgcnVuT3V0c2lkZUFuZ3VsYXI8VD4oZm46ICguLi5hcmdzOiBhbnlbXSkgPT4gVCk6IFQge1xuICAgIHJldHVybiBmbigpO1xuICB9XG5cbiAgcnVuVGFzazxUPihmbjogKC4uLmFyZ3M6IGFueVtdKSA9PiBULCBhcHBseVRoaXM/OiBhbnksIGFwcGx5QXJncz86IGFueSwgbmFtZT86IHN0cmluZyk6IFQge1xuICAgIHJldHVybiBmbi5hcHBseShhcHBseVRoaXMsIGFwcGx5QXJncyk7XG4gIH1cbn1cblxuXG5mdW5jdGlvbiBzaG91bGRCZUlnbm9yZWRCeVpvbmUoYXBwbHlBcmdzOiB1bmtub3duKTogYm9vbGVhbiB7XG4gIGlmICghQXJyYXkuaXNBcnJheShhcHBseUFyZ3MpKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgLy8gV2Ugc2hvdWxkIG9ubHkgZXZlciBnZXQgMSBhcmcgcGFzc2VkIHRocm91Z2ggdG8gaW52b2tlVGFzay5cbiAgLy8gU2hvcnQgY2lyY3VpdCBoZXJlIGluY2FzZSB0aGF0IGJlaGF2aW9yIGNoYW5nZXMuXG4gIGlmIChhcHBseUFyZ3MubGVuZ3RoICE9PSAxKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgLy8gUHJldmVudCB0cmlnZ2VyaW5nIGNoYW5nZSBkZXRlY3Rpb24gd2hlbiB0aGUgX19pZ25vcmVfbmdfem9uZV9fIGZsYWcgaXMgZGV0ZWN0ZWQuXG4gIHJldHVybiBhcHBseUFyZ3NbMF0uZGF0YT8uWydfX2lnbm9yZV9uZ196b25lX18nXSA9PT0gdHJ1ZTtcbn1cblxuXG4vLyBTZXQgb2Ygb3B0aW9ucyByZWNvZ25pemVkIGJ5IHRoZSBOZ1pvbmUuXG5leHBvcnQgaW50ZXJmYWNlIEludGVybmFsTmdab25lT3B0aW9ucyB7XG4gIGVuYWJsZUxvbmdTdGFja1RyYWNlOiBib29sZWFuO1xuICBzaG91bGRDb2FsZXNjZUV2ZW50Q2hhbmdlRGV0ZWN0aW9uOiBib29sZWFuO1xuICBzaG91bGRDb2FsZXNjZVJ1bkNoYW5nZURldGVjdGlvbjogYm9vbGVhbjtcbn1cblxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0Tmdab25lKFxuICAgIG5nWm9uZVRvVXNlOiBOZ1pvbmV8J3pvbmUuanMnfCdub29wJyA9ICd6b25lLmpzJywgb3B0aW9uczogSW50ZXJuYWxOZ1pvbmVPcHRpb25zKTogTmdab25lIHtcbiAgaWYgKG5nWm9uZVRvVXNlID09PSAnbm9vcCcpIHtcbiAgICByZXR1cm4gbmV3IE5vb3BOZ1pvbmUoKTtcbiAgfVxuICBpZiAobmdab25lVG9Vc2UgPT09ICd6b25lLmpzJykge1xuICAgIHJldHVybiBuZXcgTmdab25lKG9wdGlvbnMpO1xuICB9XG4gIHJldHVybiBuZ1pvbmVUb1VzZTtcbn1cbiJdfQ==