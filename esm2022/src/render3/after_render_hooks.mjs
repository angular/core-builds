/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ChangeDetectionScheduler, } from '../change_detection/scheduling/zoneless_scheduling';
import { assertInInjectionContext, Injector, runInInjectionContext, ɵɵdefineInjectable } from '../di';
import { inject } from '../di/injector_compatibility';
import { ErrorHandler } from '../error_handler';
import { DestroyRef } from '../linker/destroy_ref';
import { assertNotInReactiveContext } from '../render3/reactivity/asserts';
import { performanceMarkFeature } from '../util/performance';
import { isPlatformBrowser } from './util/misc_utils';
/**
 * The phase to run an `afterRender` or `afterNextRender` callback in.
 *
 * Callbacks in the same phase run in the order they are registered. Phases run in the
 * following order after each render:
 *
 *   1. `AfterRenderPhase.EarlyRead`
 *   2. `AfterRenderPhase.Write`
 *   3. `AfterRenderPhase.MixedReadWrite`
 *   4. `AfterRenderPhase.Read`
 *
 * Angular is unable to verify or enforce that phases are used correctly, and instead
 * relies on each developer to follow the guidelines documented for each value and
 * carefully choose the appropriate one, refactoring their code if necessary. By doing
 * so, Angular is better able to minimize the performance degradation associated with
 * manual DOM access, ensuring the best experience for the end users of your application
 * or library.
 *
 * @developerPreview
 */
export var AfterRenderPhase;
(function (AfterRenderPhase) {
    /**
     * Use `AfterRenderPhase.EarlyRead` for callbacks that only need to **read** from the
     * DOM before a subsequent `AfterRenderPhase.Write` callback, for example to perform
     * custom layout that the browser doesn't natively support. **Never** use this phase
     * for callbacks that can write to the DOM or when `AfterRenderPhase.Read` is adequate.
     *
     * <div class="alert is-important">
     *
     * Using this value can degrade performance.
     * Instead, prefer using built-in browser functionality when possible.
     *
     * </div>
     */
    AfterRenderPhase[AfterRenderPhase["EarlyRead"] = 0] = "EarlyRead";
    /**
     * Use `AfterRenderPhase.Write` for callbacks that only **write** to the DOM. **Never**
     * use this phase for callbacks that can read from the DOM.
     */
    AfterRenderPhase[AfterRenderPhase["Write"] = 1] = "Write";
    /**
     * Use `AfterRenderPhase.MixedReadWrite` for callbacks that read from or write to the
     * DOM, that haven't been refactored to use a different phase. **Never** use this phase
     * for callbacks that can use a different phase instead.
     *
     * <div class="alert is-critical">
     *
     * Using this value can **significantly** degrade performance.
     * Instead, prefer refactoring into multiple callbacks using a more specific phase.
     *
     * </div>
     */
    AfterRenderPhase[AfterRenderPhase["MixedReadWrite"] = 2] = "MixedReadWrite";
    /**
     * Use `AfterRenderPhase.Read` for callbacks that only **read** from the DOM. **Never**
     * use this phase for callbacks that can write to the DOM.
     */
    AfterRenderPhase[AfterRenderPhase["Read"] = 3] = "Read";
})(AfterRenderPhase || (AfterRenderPhase = {}));
/** `AfterRenderRef` that does nothing. */
const NOOP_AFTER_RENDER_REF = {
    destroy() { },
};
/**
 * Register a callback to run once before any userspace `afterRender` or
 * `afterNextRender` callbacks.
 *
 * This function should almost always be used instead of `afterRender` or
 * `afterNextRender` for implementing framework functionality. Consider:
 *
 *   1.) `AfterRenderPhase.EarlyRead` is intended to be used for implementing
 *       custom layout. If the framework itself mutates the DOM after *any*
 *       `AfterRenderPhase.EarlyRead` callbacks are run, the phase can no
 *       longer reliably serve its purpose.
 *
 *   2.) Importing `afterRender` in the framework can reduce the ability for it
 *       to be tree-shaken, and the framework shouldn't need much of the behavior.
 */
export function internalAfterNextRender(callback, options) {
    const injector = options?.injector ?? inject(Injector);
    // Similarly to the public `afterNextRender` function, an internal one
    // is only invoked in a browser as long as the runOnServer option is not set.
    if (!options?.runOnServer && !isPlatformBrowser(injector))
        return;
    const afterRenderEventManager = injector.get(AfterRenderEventManager);
    afterRenderEventManager.internalCallbacks.push(callback);
}
/**
 * Register a callback to be invoked each time the application
 * finishes rendering.
 *
 * <div class="alert is-critical">
 *
 * You should always explicitly specify a non-default [phase](api/core/AfterRenderPhase), or you
 * risk significant performance degradation.
 *
 * </div>
 *
 * Note that the callback will run
 * - in the order it was registered
 * - once per render
 * - on browser platforms only
 *
 * <div class="alert is-important">
 *
 * Components are not guaranteed to be [hydrated](guide/hydration) before the callback runs.
 * You must use caution when directly reading or writing the DOM and layout.
 *
 * </div>
 *
 * @param callback A callback function to register
 *
 * @usageNotes
 *
 * Use `afterRender` to read or write the DOM after each render.
 *
 * ### Example
 * ```ts
 * @Component({
 *   selector: 'my-cmp',
 *   template: `<span #content>{{ ... }}</span>`,
 * })
 * export class MyComponent {
 *   @ViewChild('content') contentRef: ElementRef;
 *
 *   constructor() {
 *     afterRender(() => {
 *       console.log('content height: ' + this.contentRef.nativeElement.scrollHeight);
 *     }, {phase: AfterRenderPhase.Read});
 *   }
 * }
 * ```
 *
 * @developerPreview
 */
export function afterRender(callback, options) {
    ngDevMode &&
        assertNotInReactiveContext(afterRender, 'Call `afterRender` outside of a reactive context. For example, schedule the render ' +
            'callback inside the component constructor`.');
    !options && assertInInjectionContext(afterRender);
    const injector = options?.injector ?? inject(Injector);
    if (!isPlatformBrowser(injector)) {
        return NOOP_AFTER_RENDER_REF;
    }
    performanceMarkFeature('NgAfterRender');
    const afterRenderEventManager = injector.get(AfterRenderEventManager);
    // Lazily initialize the handler implementation, if necessary. This is so that it can be
    // tree-shaken if `afterRender` and `afterNextRender` aren't used.
    const callbackHandler = (afterRenderEventManager.handler ??=
        new AfterRenderCallbackHandlerImpl());
    const phase = options?.phase ?? AfterRenderPhase.MixedReadWrite;
    const destroy = () => {
        callbackHandler.unregister(instance);
        unregisterFn();
    };
    const unregisterFn = injector.get(DestroyRef).onDestroy(destroy);
    const instance = runInInjectionContext(injector, () => new AfterRenderCallback(phase, callback));
    callbackHandler.register(instance);
    return { destroy };
}
/**
 * Register a callback to be invoked the next time the application
 * finishes rendering.
 *
 * <div class="alert is-critical">
 *
 * You should always explicitly specify a non-default [phase](api/core/AfterRenderPhase), or you
 * risk significant performance degradation.
 *
 * </div>
 *
 * Note that the callback will run
 * - in the order it was registered
 * - on browser platforms only
 *
 * <div class="alert is-important">
 *
 * Components are not guaranteed to be [hydrated](guide/hydration) before the callback runs.
 * You must use caution when directly reading or writing the DOM and layout.
 *
 * </div>
 *
 * @param callback A callback function to register
 *
 * @usageNotes
 *
 * Use `afterNextRender` to read or write the DOM once,
 * for example to initialize a non-Angular library.
 *
 * ### Example
 * ```ts
 * @Component({
 *   selector: 'my-chart-cmp',
 *   template: `<div #chart>{{ ... }}</div>`,
 * })
 * export class MyChartCmp {
 *   @ViewChild('chart') chartRef: ElementRef;
 *   chart: MyChart|null;
 *
 *   constructor() {
 *     afterNextRender(() => {
 *       this.chart = new MyChart(this.chartRef.nativeElement);
 *     }, {phase: AfterRenderPhase.Write});
 *   }
 * }
 * ```
 *
 * @developerPreview
 */
export function afterNextRender(callback, options) {
    !options && assertInInjectionContext(afterNextRender);
    const injector = options?.injector ?? inject(Injector);
    if (!isPlatformBrowser(injector)) {
        return NOOP_AFTER_RENDER_REF;
    }
    performanceMarkFeature('NgAfterNextRender');
    const afterRenderEventManager = injector.get(AfterRenderEventManager);
    // Lazily initialize the handler implementation, if necessary. This is so that it can be
    // tree-shaken if `afterRender` and `afterNextRender` aren't used.
    const callbackHandler = (afterRenderEventManager.handler ??=
        new AfterRenderCallbackHandlerImpl());
    const phase = options?.phase ?? AfterRenderPhase.MixedReadWrite;
    const destroy = () => {
        callbackHandler.unregister(instance);
        unregisterFn();
    };
    const unregisterFn = injector.get(DestroyRef).onDestroy(destroy);
    const instance = runInInjectionContext(injector, () => new AfterRenderCallback(phase, () => {
        destroy();
        callback();
    }));
    callbackHandler.register(instance);
    return { destroy };
}
/**
 * A wrapper around a function to be used as an after render callback.
 */
class AfterRenderCallback {
    constructor(phase, callbackFn) {
        this.phase = phase;
        this.callbackFn = callbackFn;
        this.errorHandler = inject(ErrorHandler, { optional: true });
        // Registering a callback will notify the scheduler.
        inject(ChangeDetectionScheduler, { optional: true })?.notify(7 /* NotificationSource.NewRenderHook */);
    }
    invoke() {
        try {
            this.callbackFn();
        }
        catch (err) {
            this.errorHandler?.handleError(err);
        }
    }
}
/**
 * Core functionality for `afterRender` and `afterNextRender`. Kept separate from
 * `AfterRenderEventManager` for tree-shaking.
 */
class AfterRenderCallbackHandlerImpl {
    constructor() {
        this.executingCallbacks = false;
        this.buckets = {
            // Note: the order of these keys controls the order the phases are run.
            [AfterRenderPhase.EarlyRead]: new Set(),
            [AfterRenderPhase.Write]: new Set(),
            [AfterRenderPhase.MixedReadWrite]: new Set(),
            [AfterRenderPhase.Read]: new Set(),
        };
        this.deferredCallbacks = new Set();
    }
    register(callback) {
        // If we're currently running callbacks, new callbacks should be deferred
        // until the next render operation.
        const target = this.executingCallbacks ? this.deferredCallbacks : this.buckets[callback.phase];
        target.add(callback);
    }
    unregister(callback) {
        this.buckets[callback.phase].delete(callback);
        this.deferredCallbacks.delete(callback);
    }
    execute() {
        this.executingCallbacks = true;
        for (const bucket of Object.values(this.buckets)) {
            for (const callback of bucket) {
                callback.invoke();
            }
        }
        this.executingCallbacks = false;
        for (const callback of this.deferredCallbacks) {
            this.buckets[callback.phase].add(callback);
        }
        this.deferredCallbacks.clear();
    }
    destroy() {
        for (const bucket of Object.values(this.buckets)) {
            bucket.clear();
        }
        this.deferredCallbacks.clear();
    }
}
/**
 * Implements core timing for `afterRender` and `afterNextRender` events.
 * Delegates to an optional `AfterRenderCallbackHandler` for implementation.
 */
export class AfterRenderEventManager {
    constructor() {
        /* @internal */
        this.handler = null;
        /* @internal */
        this.internalCallbacks = [];
    }
    /**
     * Executes internal and user-provided callbacks.
     */
    execute() {
        this.executeInternalCallbacks();
        this.handler?.execute();
    }
    executeInternalCallbacks() {
        // Note: internal callbacks power `internalAfterNextRender`. Since internal callbacks
        // are fairly trivial, they are kept separate so that `AfterRenderCallbackHandlerImpl`
        // can still be tree-shaken unless used by the application.
        const callbacks = [...this.internalCallbacks];
        this.internalCallbacks.length = 0;
        for (const callback of callbacks) {
            callback();
        }
    }
    ngOnDestroy() {
        this.handler?.destroy();
        this.handler = null;
        this.internalCallbacks.length = 0;
    }
    /** @nocollapse */
    static { this.ɵprov = ɵɵdefineInjectable({
        token: AfterRenderEventManager,
        providedIn: 'root',
        factory: () => new AfterRenderEventManager(),
    }); }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWZ0ZXJfcmVuZGVyX2hvb2tzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9hZnRlcl9yZW5kZXJfaG9va3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUNMLHdCQUF3QixHQUV6QixNQUFNLG9EQUFvRCxDQUFDO0FBQzVELE9BQU8sRUFBQyx3QkFBd0IsRUFBRSxRQUFRLEVBQUUscUJBQXFCLEVBQUUsa0JBQWtCLEVBQUMsTUFBTSxPQUFPLENBQUM7QUFDcEcsT0FBTyxFQUFDLE1BQU0sRUFBQyxNQUFNLDhCQUE4QixDQUFDO0FBQ3BELE9BQU8sRUFBQyxZQUFZLEVBQUMsTUFBTSxrQkFBa0IsQ0FBQztBQUM5QyxPQUFPLEVBQUMsVUFBVSxFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDakQsT0FBTyxFQUFDLDBCQUEwQixFQUFDLE1BQU0sK0JBQStCLENBQUM7QUFDekUsT0FBTyxFQUFDLHNCQUFzQixFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFHM0QsT0FBTyxFQUFDLGlCQUFpQixFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFFcEQ7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7R0FtQkc7QUFDSCxNQUFNLENBQU4sSUFBWSxnQkF5Q1g7QUF6Q0QsV0FBWSxnQkFBZ0I7SUFDMUI7Ozs7Ozs7Ozs7OztPQVlHO0lBQ0gsaUVBQVMsQ0FBQTtJQUVUOzs7T0FHRztJQUNILHlEQUFLLENBQUE7SUFFTDs7Ozs7Ozs7Ozs7T0FXRztJQUNILDJFQUFjLENBQUE7SUFFZDs7O09BR0c7SUFDSCx1REFBSSxDQUFBO0FBQ04sQ0FBQyxFQXpDVyxnQkFBZ0IsS0FBaEIsZ0JBQWdCLFFBeUMzQjtBQTBERCwwQ0FBMEM7QUFDMUMsTUFBTSxxQkFBcUIsR0FBbUI7SUFDNUMsT0FBTyxLQUFJLENBQUM7Q0FDYixDQUFDO0FBRUY7Ozs7Ozs7Ozs7Ozs7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LGlCQUFpQixDQUFDLENBQUM7UUFDOUMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUM7UUFDbEMsS0FBSyxNQUFNLFFBQVEsSUFBSSxTQUFTLEVBQUUsQ0FBQztZQUNqQyxRQUFRLEVBQUUsQ0FBQztRQUNiLENBQUM7SUFDSCxDQUFDO0lBRUQsV0FBVztRQUNULElBQUksQ0FBQyxPQUFPLEVBQUUsT0FBTyxFQUFFLENBQUM7UUFDeEIsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUM7UUFDcEIsSUFBSSxDQUFDLGlCQUFpQixDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUM7SUFDcEMsQ0FBQztJQUVELGtCQUFrQjthQUNYLFVBQUssR0FBNkIsa0JBQWtCLENBQUM7UUFDMUQsS0FBSyxFQUFFLHVCQUF1QjtRQUM5QixVQUFVLEVBQUUsTUFBTTtRQUNsQixPQUFPLEVBQUUsR0FBRyxFQUFFLENBQUMsSUFBSSx1QkFBdUIsRUFBRTtLQUM3QyxDQUFDLEFBSlUsQ0FJVCIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1xuICBDaGFuZ2VEZXRlY3Rpb25TY2hlZHVsZXIsXG4gIE5vdGlmaWNhdGlvblNvdXJjZSxcbn0gZnJvbSAnLi4vY2hhbmdlX2RldGVjdGlvbi9zY2hlZHVsaW5nL3pvbmVsZXNzX3NjaGVkdWxpbmcnO1xuaW1wb3J0IHthc3NlcnRJbkluamVjdGlvbkNvbnRleHQsIEluamVjdG9yLCBydW5JbkluamVjdGlvbkNvbnRleHQsIMm1ybVkZWZpbmVJbmplY3RhYmxlfSBmcm9tICcuLi9kaSc7XG5pbXBvcnQge2luamVjdH0gZnJvbSAnLi4vZGkvaW5qZWN0b3JfY29tcGF0aWJpbGl0eSc7XG5pbXBvcnQge0Vycm9ySGFuZGxlcn0gZnJvbSAnLi4vZXJyb3JfaGFuZGxlcic7XG5pbXBvcnQge0Rlc3Ryb3lSZWZ9IGZyb20gJy4uL2xpbmtlci9kZXN0cm95X3JlZic7XG5pbXBvcnQge2Fzc2VydE5vdEluUmVhY3RpdmVDb250ZXh0fSBmcm9tICcuLi9yZW5kZXIzL3JlYWN0aXZpdHkvYXNzZXJ0cyc7XG5pbXBvcnQge3BlcmZvcm1hbmNlTWFya0ZlYXR1cmV9IGZyb20gJy4uL3V0aWwvcGVyZm9ybWFuY2UnO1xuaW1wb3J0IHtOZ1pvbmV9IGZyb20gJy4uL3pvbmUvbmdfem9uZSc7XG5cbmltcG9ydCB7aXNQbGF0Zm9ybUJyb3dzZXJ9IGZyb20gJy4vdXRpbC9taXNjX3V0aWxzJztcblxuLyoqXG4gKiBUaGUgcGhhc2UgdG8gcnVuIGFuIGBhZnRlclJlbmRlcmAgb3IgYGFmdGVyTmV4dFJlbmRlcmAgY2FsbGJhY2sgaW4uXG4gKlxuICogQ2FsbGJhY2tzIGluIHRoZSBzYW1lIHBoYXNlIHJ1biBpbiB0aGUgb3JkZXIgdGhleSBhcmUgcmVnaXN0ZXJlZC4gUGhhc2VzIHJ1biBpbiB0aGVcbiAqIGZvbGxvd2luZyBvcmRlciBhZnRlciBlYWNoIHJlbmRlcjpcbiAqXG4gKiAgIDEuIGBBZnRlclJlbmRlclBoYXNlLkVhcmx5UmVhZGBcbiAqICAgMi4gYEFmdGVyUmVuZGVyUGhhc2UuV3JpdGVgXG4gKiAgIDMuIGBBZnRlclJlbmRlclBoYXNlLk1peGVkUmVhZFdyaXRlYFxuICogICA0LiBgQWZ0ZXJSZW5kZXJQaGFzZS5SZWFkYFxuICpcbiAqIEFuZ3VsYXIgaXMgdW5hYmxlIHRvIHZlcmlmeSBvciBlbmZvcmNlIHRoYXQgcGhhc2VzIGFyZSB1c2VkIGNvcnJlY3RseSwgYW5kIGluc3RlYWRcbiAqIHJlbGllcyBvbiBlYWNoIGRldmVsb3BlciB0byBmb2xsb3cgdGhlIGd1aWRlbGluZXMgZG9jdW1lbnRlZCBmb3IgZWFjaCB2YWx1ZSBhbmRcbiAqIGNhcmVmdWxseSBjaG9vc2UgdGhlIGFwcHJvcHJpYXRlIG9uZSwgcmVmYWN0b3JpbmcgdGhlaXIgY29kZSBpZiBuZWNlc3NhcnkuIEJ5IGRvaW5nXG4gKiBzbywgQW5ndWxhciBpcyBiZXR0ZXIgYWJsZSB0byBtaW5pbWl6ZSB0aGUgcGVyZm9ybWFuY2UgZGVncmFkYXRpb24gYXNzb2NpYXRlZCB3aXRoXG4gKiBtYW51YWwgRE9NIGFjY2VzcywgZW5zdXJpbmcgdGhlIGJlc3QgZXhwZXJpZW5jZSBmb3IgdGhlIGVuZCB1c2VycyBvZiB5b3VyIGFwcGxpY2F0aW9uXG4gKiBvciBsaWJyYXJ5LlxuICpcbiAqIEBkZXZlbG9wZXJQcmV2aWV3XG4gKi9cbmV4cG9ydCBlbnVtIEFmdGVyUmVuZGVyUGhhc2Uge1xuICAvKipcbiAgICogVXNlIGBBZnRlclJlbmRlclBoYXNlLkVhcmx5UmVhZGAgZm9yIGNhbGxiYWNrcyB0aGF0IG9ubHkgbmVlZCB0byAqKnJlYWQqKiBmcm9tIHRoZVxuICAgKiBET00gYmVmb3JlIGEgc3Vic2VxdWVudCBgQWZ0ZXJSZW5kZXJQaGFzZS5Xcml0ZWAgY2FsbGJhY2ssIGZvciBleGFtcGxlIHRvIHBlcmZvcm1cbiAgICogY3VzdG9tIGxheW91dCB0aGF0IHRoZSBicm93c2VyIGRvZXNuJ3QgbmF0aXZlbHkgc3VwcG9ydC4gKipOZXZlcioqIHVzZSB0aGlzIHBoYXNlXG4gICAqIGZvciBjYWxsYmFja3MgdGhhdCBjYW4gd3JpdGUgdG8gdGhlIERPTSBvciB3aGVuIGBBZnRlclJlbmRlclBoYXNlLlJlYWRgIGlzIGFkZXF1YXRlLlxuICAgKlxuICAgKiA8ZGl2IGNsYXNzPVwiYWxlcnQgaXMtaW1wb3J0YW50XCI+XG4gICAqXG4gICAqIFVzaW5nIHRoaXMgdmFsdWUgY2FuIGRlZ3JhZGUgcGVyZm9ybWFuY2UuXG4gICAqIEluc3RlYWQsIHByZWZlciB1c2luZyBidWlsdC1pbiBicm93c2VyIGZ1bmN0aW9uYWxpdHkgd2hlbiBwb3NzaWJsZS5cbiAgICpcbiAgICogPC9kaXY+XG4gICAqL1xuICBFYXJseVJlYWQsXG5cbiAgLyoqXG4gICAqIFVzZSBgQWZ0ZXJSZW5kZXJQaGFzZS5Xcml0ZWAgZm9yIGNhbGxiYWNrcyB0aGF0IG9ubHkgKip3cml0ZSoqIHRvIHRoZSBET00uICoqTmV2ZXIqKlxuICAgKiB1c2UgdGhpcyBwaGFzZSBmb3IgY2FsbGJhY2tzIHRoYXQgY2FuIHJlYWQgZnJvbSB0aGUgRE9NLlxuICAgKi9cbiAgV3JpdGUsXG5cbiAgLyoqXG4gICAqIFVzZSBgQWZ0ZXJSZW5kZXJQaGFzZS5NaXhlZFJlYWRXcml0ZWAgZm9yIGNhbGxiYWNrcyB0aGF0IHJlYWQgZnJvbSBvciB3cml0ZSB0byB0aGVcbiAgICogRE9NLCB0aGF0IGhhdmVuJ3QgYmVlbiByZWZhY3RvcmVkIHRvIHVzZSBhIGRpZmZlcmVudCBwaGFzZS4gKipOZXZlcioqIHVzZSB0aGlzIHBoYXNlXG4gICAqIGZvciBjYWxsYmFja3MgdGhhdCBjYW4gdXNlIGEgZGlmZmVyZW50IHBoYXNlIGluc3RlYWQuXG4gICAqXG4gICAqIDxkaXYgY2xhc3M9XCJhbGVydCBpcy1jcml0aWNhbFwiPlxuICAgKlxuICAgKiBVc2luZyB0aGlzIHZhbHVlIGNhbiAqKnNpZ25pZmljYW50bHkqKiBkZWdyYWRlIHBlcmZvcm1hbmNlLlxuICAgKiBJbnN0ZWFkLCBwcmVmZXIgcmVmYWN0b3JpbmcgaW50byBtdWx0aXBsZSBjYWxsYmFja3MgdXNpbmcgYSBtb3JlIHNwZWNpZmljIHBoYXNlLlxuICAgKlxuICAgKiA8L2Rpdj5cbiAgICovXG4gIE1peGVkUmVhZFdyaXRlLFxuXG4gIC8qKlxuICAgKiBVc2UgYEFmdGVyUmVuZGVyUGhhc2UuUmVhZGAgZm9yIGNhbGxiYWNrcyB0aGF0IG9ubHkgKipyZWFkKiogZnJvbSB0aGUgRE9NLiAqKk5ldmVyKipcbiAgICogdXNlIHRoaXMgcGhhc2UgZm9yIGNhbGxiYWNrcyB0aGF0IGNhbiB3cml0ZSB0byB0aGUgRE9NLlxuICAgKi9cbiAgUmVhZCxcbn1cblxuLyoqXG4gKiBPcHRpb25zIHBhc3NlZCB0byBgYWZ0ZXJSZW5kZXJgIGFuZCBgYWZ0ZXJOZXh0UmVuZGVyYC5cbiAqXG4gKiBAZGV2ZWxvcGVyUHJldmlld1xuICovXG5leHBvcnQgaW50ZXJmYWNlIEFmdGVyUmVuZGVyT3B0aW9ucyB7XG4gIC8qKlxuICAgKiBUaGUgYEluamVjdG9yYCB0byB1c2UgZHVyaW5nIGNyZWF0aW9uLlxuICAgKlxuICAgKiBJZiB0aGlzIGlzIG5vdCBwcm92aWRlZCwgdGhlIGN1cnJlbnQgaW5qZWN0aW9uIGNvbnRleHQgd2lsbCBiZSB1c2VkIGluc3RlYWQgKHZpYSBgaW5qZWN0YCkuXG4gICAqL1xuICBpbmplY3Rvcj86IEluamVjdG9yO1xuXG4gIC8qKlxuICAgKiBUaGUgcGhhc2UgdGhlIGNhbGxiYWNrIHNob3VsZCBiZSBpbnZva2VkIGluLlxuICAgKlxuICAgKiA8ZGl2IGNsYXNzPVwiYWxlcnQgaXMtY3JpdGljYWxcIj5cbiAgICpcbiAgICogRGVmYXVsdHMgdG8gYEFmdGVyUmVuZGVyUGhhc2UuTWl4ZWRSZWFkV3JpdGVgLiBZb3Ugc2hvdWxkIGNob29zZSBhIG1vcmUgc3BlY2lmaWNcbiAgICogcGhhc2UgaW5zdGVhZC4gU2VlIGBBZnRlclJlbmRlclBoYXNlYCBmb3IgbW9yZSBpbmZvcm1hdGlvbi5cbiAgICpcbiAgICogPC9kaXY+XG4gICAqL1xuICBwaGFzZT86IEFmdGVyUmVuZGVyUGhhc2U7XG59XG5cbi8qKlxuICogQSBjYWxsYmFjayB0aGF0IHJ1bnMgYWZ0ZXIgcmVuZGVyLlxuICpcbiAqIEBkZXZlbG9wZXJQcmV2aWV3XG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgQWZ0ZXJSZW5kZXJSZWYge1xuICAvKipcbiAgICogU2h1dCBkb3duIHRoZSBjYWxsYmFjaywgcHJldmVudGluZyBpdCBmcm9tIGJlaW5nIGNhbGxlZCBhZ2Fpbi5cbiAgICovXG4gIGRlc3Ryb3koKTogdm9pZDtcbn1cblxuLyoqXG4gKiBPcHRpb25zIHBhc3NlZCB0byBgaW50ZXJuYWxBZnRlck5leHRSZW5kZXJgLlxuICovXG5leHBvcnQgaW50ZXJmYWNlIEludGVybmFsQWZ0ZXJOZXh0UmVuZGVyT3B0aW9ucyB7XG4gIC8qKlxuICAgKiBUaGUgYEluamVjdG9yYCB0byB1c2UgZHVyaW5nIGNyZWF0aW9uLlxuICAgKlxuICAgKiBJZiB0aGlzIGlzIG5vdCBwcm92aWRlZCwgdGhlIGN1cnJlbnQgaW5qZWN0aW9uIGNvbnRleHQgd2lsbCBiZSB1c2VkIGluc3RlYWQgKHZpYSBgaW5qZWN0YCkuXG4gICAqL1xuICBpbmplY3Rvcj86IEluamVjdG9yO1xuICAvKipcbiAgICogV2hlbiB0cnVlLCB0aGUgaG9vayB3aWxsIGV4ZWN1dGUgYm90aCBvbiBjbGllbnQgYW5kIG9uIHRoZSBzZXJ2ZXIuXG4gICAqXG4gICAqIFdoZW4gZmFsc2Ugb3IgdW5kZWZpbmVkLCB0aGUgaG9vayBvbmx5IGV4ZWN1dGVzIGluIHRoZSBicm93c2VyLlxuICAgKi9cbiAgcnVuT25TZXJ2ZXI/OiBib29sZWFuO1xufVxuXG4vKiogYEFmdGVyUmVuZGVyUmVmYCB0aGF0IGRvZXMgbm90aGluZy4gKi9cbmNvbnN0IE5PT1BfQUZURVJfUkVOREVSX1JFRjogQWZ0ZXJSZW5kZXJSZWYgPSB7XG4gIGRlc3Ryb3koKSB7fSxcbn07XG5cbi8qKlxuICogUmVnaXN0ZXIgYSBjYWxsYmFjayB0byBydW4gb25jZSBiZWZvcmUgYW55IHVzZXJzcGFjZSBgYWZ0ZXJSZW5kZXJgIG9yXG4gKiBgYWZ0ZXJOZXh0UmVuZGVyYCBjYWxsYmFja3MuXG4gKlxuICogVGhpcyBmdW5jdGlvbiBzaG91bGQgYWxtb3N0IGFsd2F5cyBiZSB1c2VkIGluc3RlYWQgb2YgYGFmdGVyUmVuZGVyYCBvclxuICogYGFmdGVyTmV4dFJlbmRlcmAgZm9yIGltcGxlbWVudGluZyBmcmFtZXdvcmsgZnVuY3Rpb25hbGl0eS4gQ29uc2lkZXI6XG4gKlxuICogICAxLikgYEFmdGVyUmVuZGVyUGhhc2UuRWFybHlSZWFkYCBpcyBpbnRlbmRlZCB0byBiZSB1c2VkIGZvciBpbXBsZW1lbnRpbmdcbiAqICAgICAgIGN1c3RvbSBsYXlvdXQuIElmIHRoZSBmcmFtZXdvcmsgaXRzZWxmIG11dGF0ZXMgdGhlIERPTSBhZnRlciAqYW55KlxuICogICAgICAgYEFmdGVyUmVuZGVyUGhhc2UuRWFybHlSZWFkYCBjYWxsYmFja3MgYXJlIHJ1biwgdGhlIHBoYXNlIGNhbiBub1xuICogICAgICAgbG9uZ2VyIHJlbGlhYmx5IHNlcnZlIGl0cyBwdXJwb3NlLlxuICpcbiAqICAgMi4pIEltcG9ydGluZyBgYWZ0ZXJSZW5kZXJgIGluIHRoZSBmcmFtZXdvcmsgY2FuIHJlZHVjZSB0aGUgYWJpbGl0eSBmb3IgaXRcbiAqICAgICAgIHRvIGJlIHRyZWUtc2hha2VuLCBhbmQgdGhlIGZyYW1ld29yayBzaG91bGRuJ3QgbmVlZCBtdWNoIG9mIHRoZSBiZWhhdmlvci5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGludGVybmFsQWZ0ZXJOZXh0UmVuZGVyKFxuICBjYWxsYmFjazogVm9pZEZ1bmN0aW9uLFxuICBvcHRpb25zPzogSW50ZXJuYWxBZnRlck5leHRSZW5kZXJPcHRpb25zLFxuKSB7XG4gIGNvbnN0IGluamVjdG9yID0gb3B0aW9ucz8uaW5qZWN0b3IgPz8gaW5qZWN0KEluamVjdG9yKTtcblxuICAvLyBTaW1pbGFybHkgdG8gdGhlIHB1YmxpYyBgYWZ0ZXJOZXh0UmVuZGVyYCBmdW5jdGlvbiwgYW4gaW50ZXJuYWwgb25lXG4gIC8vIGlzIG9ubHkgaW52b2tlZCBpbiBhIGJyb3dzZXIgYXMgbG9uZyBhcyB0aGUgcnVuT25TZXJ2ZXIgb3B0aW9uIGlzIG5vdCBzZXQuXG4gIGlmICghb3B0aW9ucz8ucnVuT25TZXJ2ZXIgJiYgIWlzUGxhdGZvcm1Ccm93c2VyKGluamVjdG9yKSkgcmV0dXJuO1xuXG4gIGNvbnN0IGFmdGVyUmVuZGVyRXZlbnRNYW5hZ2VyID0gaW5qZWN0b3IuZ2V0KEFmdGVyUmVuZGVyRXZlbnRNYW5hZ2VyKTtcbiAgYWZ0ZXJSZW5kZXJFdmVudE1hbmFnZXIuaW50ZXJuYWxDYWxsYmFja3MucHVzaChjYWxsYmFjayk7XG59XG5cbi8qKlxuICogUmVnaXN0ZXIgYSBjYWxsYmFjayB0byBiZSBpbnZva2VkIGVhY2ggdGltZSB0aGUgYXBwbGljYXRpb25cbiAqIGZpbmlzaGVzIHJlbmRlcmluZy5cbiAqXG4gKiA8ZGl2IGNsYXNzPVwiYWxlcnQgaXMtY3JpdGljYWxcIj5cbiAqXG4gKiBZb3Ugc2hvdWxkIGFsd2F5cyBleHBsaWNpdGx5IHNwZWNpZnkgYSBub24tZGVmYXVsdCBbcGhhc2VdKGFwaS9jb3JlL0FmdGVyUmVuZGVyUGhhc2UpLCBvciB5b3VcbiAqIHJpc2sgc2lnbmlmaWNhbnQgcGVyZm9ybWFuY2UgZGVncmFkYXRpb24uXG4gKlxuICogPC9kaXY+XG4gKlxuICogTm90ZSB0aGF0IHRoZSBjYWxsYmFjayB3aWxsIHJ1blxuICogLSBpbiB0aGUgb3JkZXIgaXQgd2FzIHJlZ2lzdGVyZWRcbiAqIC0gb25jZSBwZXIgcmVuZGVyXG4gKiAtIG9uIGJyb3dzZXIgcGxhdGZvcm1zIG9ubHlcbiAqXG4gKiA8ZGl2IGNsYXNzPVwiYWxlcnQgaXMtaW1wb3J0YW50XCI+XG4gKlxuICogQ29tcG9uZW50cyBhcmUgbm90IGd1YXJhbnRlZWQgdG8gYmUgW2h5ZHJhdGVkXShndWlkZS9oeWRyYXRpb24pIGJlZm9yZSB0aGUgY2FsbGJhY2sgcnVucy5cbiAqIFlvdSBtdXN0IHVzZSBjYXV0aW9uIHdoZW4gZGlyZWN0bHkgcmVhZGluZyBvciB3cml0aW5nIHRoZSBET00gYW5kIGxheW91dC5cbiAqXG4gKiA8L2Rpdj5cbiAqXG4gKiBAcGFyYW0gY2FsbGJhY2sgQSBjYWxsYmFjayBmdW5jdGlvbiB0byByZWdpc3RlclxuICpcbiAqIEB1c2FnZU5vdGVzXG4gKlxuICogVXNlIGBhZnRlclJlbmRlcmAgdG8gcmVhZCBvciB3cml0ZSB0aGUgRE9NIGFmdGVyIGVhY2ggcmVuZGVyLlxuICpcbiAqICMjIyBFeGFtcGxlXG4gKiBgYGB0c1xuICogQENvbXBvbmVudCh7XG4gKiAgIHNlbGVjdG9yOiAnbXktY21wJyxcbiAqICAgdGVtcGxhdGU6IGA8c3BhbiAjY29udGVudD57eyAuLi4gfX08L3NwYW4+YCxcbiAqIH0pXG4gKiBleHBvcnQgY2xhc3MgTXlDb21wb25lbnQge1xuICogICBAVmlld0NoaWxkKCdjb250ZW50JykgY29udGVudFJlZjogRWxlbWVudFJlZjtcbiAqXG4gKiAgIGNvbnN0cnVjdG9yKCkge1xuICogICAgIGFmdGVyUmVuZGVyKCgpID0+IHtcbiAqICAgICAgIGNvbnNvbGUubG9nKCdjb250ZW50IGhlaWdodDogJyArIHRoaXMuY29udGVudFJlZi5uYXRpdmVFbGVtZW50LnNjcm9sbEhlaWdodCk7XG4gKiAgICAgfSwge3BoYXNlOiBBZnRlclJlbmRlclBoYXNlLlJlYWR9KTtcbiAqICAgfVxuICogfVxuICogYGBgXG4gKlxuICogQGRldmVsb3BlclByZXZpZXdcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFmdGVyUmVuZGVyKGNhbGxiYWNrOiBWb2lkRnVuY3Rpb24sIG9wdGlvbnM/OiBBZnRlclJlbmRlck9wdGlvbnMpOiBBZnRlclJlbmRlclJlZiB7XG4gIG5nRGV2TW9kZSAmJlxuICAgIGFzc2VydE5vdEluUmVhY3RpdmVDb250ZXh0KFxuICAgICAgYWZ0ZXJSZW5kZXIsXG4gICAgICAnQ2FsbCBgYWZ0ZXJSZW5kZXJgIG91dHNpZGUgb2YgYSByZWFjdGl2ZSBjb250ZXh0LiBGb3IgZXhhbXBsZSwgc2NoZWR1bGUgdGhlIHJlbmRlciAnICtcbiAgICAgICAgJ2NhbGxiYWNrIGluc2lkZSB0aGUgY29tcG9uZW50IGNvbnN0cnVjdG9yYC4nLFxuICAgICk7XG5cbiAgIW9wdGlvbnMgJiYgYXNzZXJ0SW5JbmplY3Rpb25Db250ZXh0KGFmdGVyUmVuZGVyKTtcbiAgY29uc3QgaW5qZWN0b3IgPSBvcHRpb25zPy5pbmplY3RvciA/PyBpbmplY3QoSW5qZWN0b3IpO1xuXG4gIGlmICghaXNQbGF0Zm9ybUJyb3dzZXIoaW5qZWN0b3IpKSB7XG4gICAgcmV0dXJuIE5PT1BfQUZURVJfUkVOREVSX1JFRjtcbiAgfVxuXG4gIHBlcmZvcm1hbmNlTWFya0ZlYXR1cmUoJ05nQWZ0ZXJSZW5kZXInKTtcblxuICBjb25zdCBhZnRlclJlbmRlckV2ZW50TWFuYWdlciA9IGluamVjdG9yLmdldChBZnRlclJlbmRlckV2ZW50TWFuYWdlcik7XG4gIC8vIExhemlseSBpbml0aWFsaXplIHRoZSBoYW5kbGVyIGltcGxlbWVudGF0aW9uLCBpZiBuZWNlc3NhcnkuIFRoaXMgaXMgc28gdGhhdCBpdCBjYW4gYmVcbiAgLy8gdHJlZS1zaGFrZW4gaWYgYGFmdGVyUmVuZGVyYCBhbmQgYGFmdGVyTmV4dFJlbmRlcmAgYXJlbid0IHVzZWQuXG4gIGNvbnN0IGNhbGxiYWNrSGFuZGxlciA9IChhZnRlclJlbmRlckV2ZW50TWFuYWdlci5oYW5kbGVyID8/PVxuICAgIG5ldyBBZnRlclJlbmRlckNhbGxiYWNrSGFuZGxlckltcGwoKSk7XG4gIGNvbnN0IHBoYXNlID0gb3B0aW9ucz8ucGhhc2UgPz8gQWZ0ZXJSZW5kZXJQaGFzZS5NaXhlZFJlYWRXcml0ZTtcbiAgY29uc3QgZGVzdHJveSA9ICgpID0+IHtcbiAgICBjYWxsYmFja0hhbmRsZXIudW5yZWdpc3RlcihpbnN0YW5jZSk7XG4gICAgdW5yZWdpc3RlckZuKCk7XG4gIH07XG4gIGNvbnN0IHVucmVnaXN0ZXJGbiA9IGluamVjdG9yLmdldChEZXN0cm95UmVmKS5vbkRlc3Ryb3koZGVzdHJveSk7XG4gIGNvbnN0IGluc3RhbmNlID0gcnVuSW5JbmplY3Rpb25Db250ZXh0KGluamVjdG9yLCAoKSA9PiBuZXcgQWZ0ZXJSZW5kZXJDYWxsYmFjayhwaGFzZSwgY2FsbGJhY2spKTtcblxuICBjYWxsYmFja0hhbmRsZXIucmVnaXN0ZXIoaW5zdGFuY2UpO1xuICByZXR1cm4ge2Rlc3Ryb3l9O1xufVxuXG4vKipcbiAqIFJlZ2lzdGVyIGEgY2FsbGJhY2sgdG8gYmUgaW52b2tlZCB0aGUgbmV4dCB0aW1lIHRoZSBhcHBsaWNhdGlvblxuICogZmluaXNoZXMgcmVuZGVyaW5nLlxuICpcbiAqIDxkaXYgY2xhc3M9XCJhbGVydCBpcy1jcml0aWNhbFwiPlxuICpcbiAqIFlvdSBzaG91bGQgYWx3YXlzIGV4cGxpY2l0bHkgc3BlY2lmeSBhIG5vbi1kZWZhdWx0IFtwaGFzZV0oYXBpL2NvcmUvQWZ0ZXJSZW5kZXJQaGFzZSksIG9yIHlvdVxuICogcmlzayBzaWduaWZpY2FudCBwZXJmb3JtYW5jZSBkZWdyYWRhdGlvbi5cbiAqXG4gKiA8L2Rpdj5cbiAqXG4gKiBOb3RlIHRoYXQgdGhlIGNhbGxiYWNrIHdpbGwgcnVuXG4gKiAtIGluIHRoZSBvcmRlciBpdCB3YXMgcmVnaXN0ZXJlZFxuICogLSBvbiBicm93c2VyIHBsYXRmb3JtcyBvbmx5XG4gKlxuICogPGRpdiBjbGFzcz1cImFsZXJ0IGlzLWltcG9ydGFudFwiPlxuICpcbiAqIENvbXBvbmVudHMgYXJlIG5vdCBndWFyYW50ZWVkIHRvIGJlIFtoeWRyYXRlZF0oZ3VpZGUvaHlkcmF0aW9uKSBiZWZvcmUgdGhlIGNhbGxiYWNrIHJ1bnMuXG4gKiBZb3UgbXVzdCB1c2UgY2F1dGlvbiB3aGVuIGRpcmVjdGx5IHJlYWRpbmcgb3Igd3JpdGluZyB0aGUgRE9NIGFuZCBsYXlvdXQuXG4gKlxuICogPC9kaXY+XG4gKlxuICogQHBhcmFtIGNhbGxiYWNrIEEgY2FsbGJhY2sgZnVuY3Rpb24gdG8gcmVnaXN0ZXJcbiAqXG4gKiBAdXNhZ2VOb3Rlc1xuICpcbiAqIFVzZSBgYWZ0ZXJOZXh0UmVuZGVyYCB0byByZWFkIG9yIHdyaXRlIHRoZSBET00gb25jZSxcbiAqIGZvciBleGFtcGxlIHRvIGluaXRpYWxpemUgYSBub24tQW5ndWxhciBsaWJyYXJ5LlxuICpcbiAqICMjIyBFeGFtcGxlXG4gKiBgYGB0c1xuICogQENvbXBvbmVudCh7XG4gKiAgIHNlbGVjdG9yOiAnbXktY2hhcnQtY21wJyxcbiAqICAgdGVtcGxhdGU6IGA8ZGl2ICNjaGFydD57eyAuLi4gfX08L2Rpdj5gLFxuICogfSlcbiAqIGV4cG9ydCBjbGFzcyBNeUNoYXJ0Q21wIHtcbiAqICAgQFZpZXdDaGlsZCgnY2hhcnQnKSBjaGFydFJlZjogRWxlbWVudFJlZjtcbiAqICAgY2hhcnQ6IE15Q2hhcnR8bnVsbDtcbiAqXG4gKiAgIGNvbnN0cnVjdG9yKCkge1xuICogICAgIGFmdGVyTmV4dFJlbmRlcigoKSA9PiB7XG4gKiAgICAgICB0aGlzLmNoYXJ0ID0gbmV3IE15Q2hhcnQodGhpcy5jaGFydFJlZi5uYXRpdmVFbGVtZW50KTtcbiAqICAgICB9LCB7cGhhc2U6IEFmdGVyUmVuZGVyUGhhc2UuV3JpdGV9KTtcbiAqICAgfVxuICogfVxuICogYGBgXG4gKlxuICogQGRldmVsb3BlclByZXZpZXdcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFmdGVyTmV4dFJlbmRlcihcbiAgY2FsbGJhY2s6IFZvaWRGdW5jdGlvbixcbiAgb3B0aW9ucz86IEFmdGVyUmVuZGVyT3B0aW9ucyxcbik6IEFmdGVyUmVuZGVyUmVmIHtcbiAgIW9wdGlvbnMgJiYgYXNzZXJ0SW5JbmplY3Rpb25Db250ZXh0KGFmdGVyTmV4dFJlbmRlcik7XG4gIGNvbnN0IGluamVjdG9yID0gb3B0aW9ucz8uaW5qZWN0b3IgPz8gaW5qZWN0KEluamVjdG9yKTtcblxuICBpZiAoIWlzUGxhdGZvcm1Ccm93c2VyKGluamVjdG9yKSkge1xuICAgIHJldHVybiBOT09QX0FGVEVSX1JFTkRFUl9SRUY7XG4gIH1cblxuICBwZXJmb3JtYW5jZU1hcmtGZWF0dXJlKCdOZ0FmdGVyTmV4dFJlbmRlcicpO1xuXG4gIGNvbnN0IGFmdGVyUmVuZGVyRXZlbnRNYW5hZ2VyID0gaW5qZWN0b3IuZ2V0KEFmdGVyUmVuZGVyRXZlbnRNYW5hZ2VyKTtcbiAgLy8gTGF6aWx5IGluaXRpYWxpemUgdGhlIGhhbmRsZXIgaW1wbGVtZW50YXRpb24sIGlmIG5lY2Vzc2FyeS4gVGhpcyBpcyBzbyB0aGF0IGl0IGNhbiBiZVxuICAvLyB0cmVlLXNoYWtlbiBpZiBgYWZ0ZXJSZW5kZXJgIGFuZCBgYWZ0ZXJOZXh0UmVuZGVyYCBhcmVuJ3QgdXNlZC5cbiAgY29uc3QgY2FsbGJhY2tIYW5kbGVyID0gKGFmdGVyUmVuZGVyRXZlbnRNYW5hZ2VyLmhhbmRsZXIgPz89XG4gICAgbmV3IEFmdGVyUmVuZGVyQ2FsbGJhY2tIYW5kbGVySW1wbCgpKTtcbiAgY29uc3QgcGhhc2UgPSBvcHRpb25zPy5waGFzZSA/PyBBZnRlclJlbmRlclBoYXNlLk1peGVkUmVhZFdyaXRlO1xuICBjb25zdCBkZXN0cm95ID0gKCkgPT4ge1xuICAgIGNhbGxiYWNrSGFuZGxlci51bnJlZ2lzdGVyKGluc3RhbmNlKTtcbiAgICB1bnJlZ2lzdGVyRm4oKTtcbiAgfTtcbiAgY29uc3QgdW5yZWdpc3RlckZuID0gaW5qZWN0b3IuZ2V0KERlc3Ryb3lSZWYpLm9uRGVzdHJveShkZXN0cm95KTtcbiAgY29uc3QgaW5zdGFuY2UgPSBydW5JbkluamVjdGlvbkNvbnRleHQoXG4gICAgaW5qZWN0b3IsXG4gICAgKCkgPT5cbiAgICAgIG5ldyBBZnRlclJlbmRlckNhbGxiYWNrKHBoYXNlLCAoKSA9PiB7XG4gICAgICAgIGRlc3Ryb3koKTtcbiAgICAgICAgY2FsbGJhY2soKTtcbiAgICAgIH0pLFxuICApO1xuXG4gIGNhbGxiYWNrSGFuZGxlci5yZWdpc3RlcihpbnN0YW5jZSk7XG4gIHJldHVybiB7ZGVzdHJveX07XG59XG5cbi8qKlxuICogQSB3cmFwcGVyIGFyb3VuZCBhIGZ1bmN0aW9uIHRvIGJlIHVzZWQgYXMgYW4gYWZ0ZXIgcmVuZGVyIGNhbGxiYWNrLlxuICovXG5jbGFzcyBBZnRlclJlbmRlckNhbGxiYWNrIHtcbiAgcHJpdmF0ZSBlcnJvckhhbmRsZXIgPSBpbmplY3QoRXJyb3JIYW5kbGVyLCB7b3B0aW9uYWw6IHRydWV9KTtcblxuICBjb25zdHJ1Y3RvcihcbiAgICByZWFkb25seSBwaGFzZTogQWZ0ZXJSZW5kZXJQaGFzZSxcbiAgICBwcml2YXRlIGNhbGxiYWNrRm46IFZvaWRGdW5jdGlvbixcbiAgKSB7XG4gICAgLy8gUmVnaXN0ZXJpbmcgYSBjYWxsYmFjayB3aWxsIG5vdGlmeSB0aGUgc2NoZWR1bGVyLlxuICAgIGluamVjdChDaGFuZ2VEZXRlY3Rpb25TY2hlZHVsZXIsIHtvcHRpb25hbDogdHJ1ZX0pPy5ub3RpZnkoTm90aWZpY2F0aW9uU291cmNlLk5ld1JlbmRlckhvb2spO1xuICB9XG5cbiAgaW52b2tlKCkge1xuICAgIHRyeSB7XG4gICAgICB0aGlzLmNhbGxiYWNrRm4oKTtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIHRoaXMuZXJyb3JIYW5kbGVyPy5oYW5kbGVFcnJvcihlcnIpO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIEltcGxlbWVudHMgYGFmdGVyUmVuZGVyYCBhbmQgYGFmdGVyTmV4dFJlbmRlcmAgY2FsbGJhY2sgaGFuZGxlciBsb2dpYy5cbiAqL1xuaW50ZXJmYWNlIEFmdGVyUmVuZGVyQ2FsbGJhY2tIYW5kbGVyIHtcbiAgLyoqXG4gICAqIFJlZ2lzdGVyIGEgbmV3IGNhbGxiYWNrLlxuICAgKi9cbiAgcmVnaXN0ZXIoY2FsbGJhY2s6IEFmdGVyUmVuZGVyQ2FsbGJhY2spOiB2b2lkO1xuXG4gIC8qKlxuICAgKiBVbnJlZ2lzdGVyIGFuIGV4aXN0aW5nIGNhbGxiYWNrLlxuICAgKi9cbiAgdW5yZWdpc3RlcihjYWxsYmFjazogQWZ0ZXJSZW5kZXJDYWxsYmFjayk6IHZvaWQ7XG5cbiAgLyoqXG4gICAqIEV4ZWN1dGUgY2FsbGJhY2tzLiBSZXR1cm5zIGB0cnVlYCBpZiBhbnkgY2FsbGJhY2tzIHdlcmUgZXhlY3V0ZWQuXG4gICAqL1xuICBleGVjdXRlKCk6IHZvaWQ7XG5cbiAgLyoqXG4gICAqIFBlcmZvcm0gYW55IG5lY2Vzc2FyeSBjbGVhbnVwLlxuICAgKi9cbiAgZGVzdHJveSgpOiB2b2lkO1xufVxuXG4vKipcbiAqIENvcmUgZnVuY3Rpb25hbGl0eSBmb3IgYGFmdGVyUmVuZGVyYCBhbmQgYGFmdGVyTmV4dFJlbmRlcmAuIEtlcHQgc2VwYXJhdGUgZnJvbVxuICogYEFmdGVyUmVuZGVyRXZlbnRNYW5hZ2VyYCBmb3IgdHJlZS1zaGFraW5nLlxuICovXG5jbGFzcyBBZnRlclJlbmRlckNhbGxiYWNrSGFuZGxlckltcGwgaW1wbGVtZW50cyBBZnRlclJlbmRlckNhbGxiYWNrSGFuZGxlciB7XG4gIHByaXZhdGUgZXhlY3V0aW5nQ2FsbGJhY2tzID0gZmFsc2U7XG4gIHByaXZhdGUgYnVja2V0cyA9IHtcbiAgICAvLyBOb3RlOiB0aGUgb3JkZXIgb2YgdGhlc2Uga2V5cyBjb250cm9scyB0aGUgb3JkZXIgdGhlIHBoYXNlcyBhcmUgcnVuLlxuICAgIFtBZnRlclJlbmRlclBoYXNlLkVhcmx5UmVhZF06IG5ldyBTZXQ8QWZ0ZXJSZW5kZXJDYWxsYmFjaz4oKSxcbiAgICBbQWZ0ZXJSZW5kZXJQaGFzZS5Xcml0ZV06IG5ldyBTZXQ8QWZ0ZXJSZW5kZXJDYWxsYmFjaz4oKSxcbiAgICBbQWZ0ZXJSZW5kZXJQaGFzZS5NaXhlZFJlYWRXcml0ZV06IG5ldyBTZXQ8QWZ0ZXJSZW5kZXJDYWxsYmFjaz4oKSxcbiAgICBbQWZ0ZXJSZW5kZXJQaGFzZS5SZWFkXTogbmV3IFNldDxBZnRlclJlbmRlckNhbGxiYWNrPigpLFxuICB9O1xuICBwcml2YXRlIGRlZmVycmVkQ2FsbGJhY2tzID0gbmV3IFNldDxBZnRlclJlbmRlckNhbGxiYWNrPigpO1xuXG4gIHJlZ2lzdGVyKGNhbGxiYWNrOiBBZnRlclJlbmRlckNhbGxiYWNrKTogdm9pZCB7XG4gICAgLy8gSWYgd2UncmUgY3VycmVudGx5IHJ1bm5pbmcgY2FsbGJhY2tzLCBuZXcgY2FsbGJhY2tzIHNob3VsZCBiZSBkZWZlcnJlZFxuICAgIC8vIHVudGlsIHRoZSBuZXh0IHJlbmRlciBvcGVyYXRpb24uXG4gICAgY29uc3QgdGFyZ2V0ID0gdGhpcy5leGVjdXRpbmdDYWxsYmFja3MgPyB0aGlzLmRlZmVycmVkQ2FsbGJhY2tzIDogdGhpcy5idWNrZXRzW2NhbGxiYWNrLnBoYXNlXTtcbiAgICB0YXJnZXQuYWRkKGNhbGxiYWNrKTtcbiAgfVxuXG4gIHVucmVnaXN0ZXIoY2FsbGJhY2s6IEFmdGVyUmVuZGVyQ2FsbGJhY2spOiB2b2lkIHtcbiAgICB0aGlzLmJ1Y2tldHNbY2FsbGJhY2sucGhhc2VdLmRlbGV0ZShjYWxsYmFjayk7XG4gICAgdGhpcy5kZWZlcnJlZENhbGxiYWNrcy5kZWxldGUoY2FsbGJhY2spO1xuICB9XG5cbiAgZXhlY3V0ZSgpOiB2b2lkIHtcbiAgICB0aGlzLmV4ZWN1dGluZ0NhbGxiYWNrcyA9IHRydWU7XG4gICAgZm9yIChjb25zdCBidWNrZXQgb2YgT2JqZWN0LnZhbHVlcyh0aGlzLmJ1Y2tldHMpKSB7XG4gICAgICBmb3IgKGNvbnN0IGNhbGxiYWNrIG9mIGJ1Y2tldCkge1xuICAgICAgICBjYWxsYmFjay5pbnZva2UoKTtcbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5leGVjdXRpbmdDYWxsYmFja3MgPSBmYWxzZTtcblxuICAgIGZvciAoY29uc3QgY2FsbGJhY2sgb2YgdGhpcy5kZWZlcnJlZENhbGxiYWNrcykge1xuICAgICAgdGhpcy5idWNrZXRzW2NhbGxiYWNrLnBoYXNlXS5hZGQoY2FsbGJhY2spO1xuICAgIH1cbiAgICB0aGlzLmRlZmVycmVkQ2FsbGJhY2tzLmNsZWFyKCk7XG4gIH1cblxuICBkZXN0cm95KCk6IHZvaWQge1xuICAgIGZvciAoY29uc3QgYnVja2V0IG9mIE9iamVjdC52YWx1ZXModGhpcy5idWNrZXRzKSkge1xuICAgICAgYnVja2V0LmNsZWFyKCk7XG4gICAgfVxuICAgIHRoaXMuZGVmZXJyZWRDYWxsYmFja3MuY2xlYXIoKTtcbiAgfVxufVxuXG4vKipcbiAqIEltcGxlbWVudHMgY29yZSB0aW1pbmcgZm9yIGBhZnRlclJlbmRlcmAgYW5kIGBhZnRlck5leHRSZW5kZXJgIGV2ZW50cy5cbiAqIERlbGVnYXRlcyB0byBhbiBvcHRpb25hbCBgQWZ0ZXJSZW5kZXJDYWxsYmFja0hhbmRsZXJgIGZvciBpbXBsZW1lbnRhdGlvbi5cbiAqL1xuZXhwb3J0IGNsYXNzIEFmdGVyUmVuZGVyRXZlbnRNYW5hZ2VyIHtcbiAgLyogQGludGVybmFsICovXG4gIGhhbmRsZXI6IEFmdGVyUmVuZGVyQ2FsbGJhY2tIYW5kbGVyIHwgbnVsbCA9IG51bGw7XG5cbiAgLyogQGludGVybmFsICovXG4gIGludGVybmFsQ2FsbGJhY2tzOiBWb2lkRnVuY3Rpb25bXSA9IFtdO1xuXG4gIC8qKlxuICAgKiBFeGVjdXRlcyBpbnRlcm5hbCBhbmQgdXNlci1wcm92aWRlZCBjYWxsYmFja3MuXG4gICAqL1xuICBleGVjdXRlKCk6IHZvaWQge1xuICAgIHRoaXMuZXhlY3V0ZUludGVybmFsQ2FsbGJhY2tzKCk7XG4gICAgdGhpcy5oYW5kbGVyPy5leGVjdXRlKCk7XG4gIH1cblxuICBleGVjdXRlSW50ZXJuYWxDYWxsYmFja3MoKSB7XG4gICAgLy8gTm90ZTogaW50ZXJuYWwgY2FsbGJhY2tzIHBvd2VyIGBpbnRlcm5hbEFmdGVyTmV4dFJlbmRlcmAuIFNpbmNlIGludGVybmFsIGNhbGxiYWNrc1xuICAgIC8vIGFyZSBmYWlybHkgdHJpdmlhbCwgdGhleSBhcmUga2VwdCBzZXBhcmF0ZSBzbyB0aGF0IGBBZnRlclJlbmRlckNhbGxiYWNrSGFuZGxlckltcGxgXG4gICAgLy8gY2FuIHN0aWxsIGJlIHRyZWUtc2hha2VuIHVubGVzcyB1c2VkIGJ5IHRoZSBhcHBsaWNhdGlvbi5cbiAgICBjb25zdCBjYWxsYmFja3MgPSBbLi4udGhpcy5pbnRlcm5hbENhbGxiYWNrc107XG4gICAgdGhpcy5pbnRlcm5hbENhbGxiYWNrcy5sZW5ndGggPSAwO1xuICAgIGZvciAoY29uc3QgY2FsbGJhY2sgb2YgY2FsbGJhY2tzKSB7XG4gICAgICBjYWxsYmFjaygpO1xuICAgIH1cbiAgfVxuXG4gIG5nT25EZXN0cm95KCkge1xuICAgIHRoaXMuaGFuZGxlcj8uZGVzdHJveSgpO1xuICAgIHRoaXMuaGFuZGxlciA9IG51bGw7XG4gICAgdGhpcy5pbnRlcm5hbENhbGxiYWNrcy5sZW5ndGggPSAwO1xuICB9XG5cbiAgLyoqIEBub2NvbGxhcHNlICovXG4gIHN0YXRpYyDJtXByb3YgPSAvKiogQHB1cmVPckJyZWFrTXlDb2RlICovIMm1ybVkZWZpbmVJbmplY3RhYmxlKHtcbiAgICB0b2tlbjogQWZ0ZXJSZW5kZXJFdmVudE1hbmFnZXIsXG4gICAgcHJvdmlkZWRJbjogJ3Jvb3QnLFxuICAgIGZhY3Rvcnk6ICgpID0+IG5ldyBBZnRlclJlbmRlckV2ZW50TWFuYWdlcigpLFxuICB9KTtcbn1cbiJdfQ==