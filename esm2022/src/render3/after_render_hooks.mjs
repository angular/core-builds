/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { assertInInjectionContext, Injector, ɵɵdefineInjectable } from '../di';
import { inject } from '../di/injector_compatibility';
import { ErrorHandler } from '../error_handler';
import { DestroyRef } from '../linker/destroy_ref';
import { assertNotInReactiveContext } from '../render3/reactivity/asserts';
import { performanceMarkFeature } from '../util/performance';
import { NgZone } from '../zone/ng_zone';
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
    destroy() { }
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
    const callbackHandler = afterRenderEventManager.handler ??= new AfterRenderCallbackHandlerImpl();
    const phase = options?.phase ?? AfterRenderPhase.MixedReadWrite;
    const destroy = () => {
        callbackHandler.unregister(instance);
        unregisterFn();
    };
    const unregisterFn = injector.get(DestroyRef).onDestroy(destroy);
    const instance = new AfterRenderCallback(injector, phase, callback);
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
    const callbackHandler = afterRenderEventManager.handler ??= new AfterRenderCallbackHandlerImpl();
    const phase = options?.phase ?? AfterRenderPhase.MixedReadWrite;
    const destroy = () => {
        callbackHandler.unregister(instance);
        unregisterFn();
    };
    const unregisterFn = injector.get(DestroyRef).onDestroy(destroy);
    const instance = new AfterRenderCallback(injector, phase, () => {
        destroy();
        callback();
    });
    callbackHandler.register(instance);
    return { destroy };
}
/**
 * A wrapper around a function to be used as an after render callback.
 */
class AfterRenderCallback {
    constructor(injector, phase, callbackFn) {
        this.phase = phase;
        this.callbackFn = callbackFn;
        this.zone = injector.get(NgZone);
        this.errorHandler = injector.get(ErrorHandler, null, { optional: true });
    }
    invoke() {
        try {
            this.zone.runOutsideAngular(this.callbackFn);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWZ0ZXJfcmVuZGVyX2hvb2tzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9hZnRlcl9yZW5kZXJfaG9va3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLHdCQUF3QixFQUFFLFFBQVEsRUFBRSxrQkFBa0IsRUFBQyxNQUFNLE9BQU8sQ0FBQztBQUM3RSxPQUFPLEVBQUMsTUFBTSxFQUFDLE1BQU0sOEJBQThCLENBQUM7QUFDcEQsT0FBTyxFQUFDLFlBQVksRUFBQyxNQUFNLGtCQUFrQixDQUFDO0FBQzlDLE9BQU8sRUFBQyxVQUFVLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUNqRCxPQUFPLEVBQUMsMEJBQTBCLEVBQUMsTUFBTSwrQkFBK0IsQ0FBQztBQUN6RSxPQUFPLEVBQUMsc0JBQXNCLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUMzRCxPQUFPLEVBQUMsTUFBTSxFQUFDLE1BQU0saUJBQWlCLENBQUM7QUFFdkMsT0FBTyxFQUFDLGlCQUFpQixFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFFcEQ7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7R0FtQkc7QUFDSCxNQUFNLENBQU4sSUFBWSxnQkF5Q1g7QUF6Q0QsV0FBWSxnQkFBZ0I7SUFDMUI7Ozs7Ozs7Ozs7OztPQVlHO0lBQ0gsaUVBQVMsQ0FBQTtJQUVUOzs7T0FHRztJQUNILHlEQUFLLENBQUE7SUFFTDs7Ozs7Ozs7Ozs7T0FXRztJQUNILDJFQUFjLENBQUE7SUFFZDs7O09BR0c7SUFDSCx1REFBSSxDQUFBO0FBQ04sQ0FBQyxFQXpDVyxnQkFBZ0IsS0FBaEIsZ0JBQWdCLFFBeUMzQjtBQTBERCwwQ0FBMEM7QUFDMUMsTUFBTSxxQkFBcUIsR0FBbUI7SUFDNUMsT0FBTyxLQUFJLENBQUM7Q0FDYixDQUFDO0FBRUY7Ozs7Ozs7Ozs7Ozs7O0dBY0c7QUFDSCxNQUFN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QztRQUNsQyxLQUFLLE1BQU0sUUFBUSxJQUFJLFNBQVMsRUFBRSxDQUFDO1lBQ2pDLFFBQVEsRUFBRSxDQUFDO1FBQ2IsQ0FBQztJQUNILENBQUM7SUFFRCxXQUFXO1FBQ1QsSUFBSSxDQUFDLE9BQU8sRUFBRSxPQUFPLEVBQUUsQ0FBQztRQUN4QixJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQztRQUNwQixJQUFJLENBQUMsaUJBQWlCLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQztJQUNwQyxDQUFDO0lBRUQsa0JBQWtCO2FBQ1gsVUFBSyxHQUE2QixrQkFBa0IsQ0FBQztRQUMxRCxLQUFLLEVBQUUsdUJBQXVCO1FBQzlCLFVBQVUsRUFBRSxNQUFNO1FBQ2xCLE9BQU8sRUFBRSxHQUFHLEVBQUUsQ0FBQyxJQUFJLHVCQUF1QixFQUFFO0tBQzdDLENBQUMsQUFKVSxDQUlUIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7YXNzZXJ0SW5JbmplY3Rpb25Db250ZXh0LCBJbmplY3RvciwgybXJtWRlZmluZUluamVjdGFibGV9IGZyb20gJy4uL2RpJztcbmltcG9ydCB7aW5qZWN0fSBmcm9tICcuLi9kaS9pbmplY3Rvcl9jb21wYXRpYmlsaXR5JztcbmltcG9ydCB7RXJyb3JIYW5kbGVyfSBmcm9tICcuLi9lcnJvcl9oYW5kbGVyJztcbmltcG9ydCB7RGVzdHJveVJlZn0gZnJvbSAnLi4vbGlua2VyL2Rlc3Ryb3lfcmVmJztcbmltcG9ydCB7YXNzZXJ0Tm90SW5SZWFjdGl2ZUNvbnRleHR9IGZyb20gJy4uL3JlbmRlcjMvcmVhY3Rpdml0eS9hc3NlcnRzJztcbmltcG9ydCB7cGVyZm9ybWFuY2VNYXJrRmVhdHVyZX0gZnJvbSAnLi4vdXRpbC9wZXJmb3JtYW5jZSc7XG5pbXBvcnQge05nWm9uZX0gZnJvbSAnLi4vem9uZS9uZ196b25lJztcblxuaW1wb3J0IHtpc1BsYXRmb3JtQnJvd3Nlcn0gZnJvbSAnLi91dGlsL21pc2NfdXRpbHMnO1xuXG4vKipcbiAqIFRoZSBwaGFzZSB0byBydW4gYW4gYGFmdGVyUmVuZGVyYCBvciBgYWZ0ZXJOZXh0UmVuZGVyYCBjYWxsYmFjayBpbi5cbiAqXG4gKiBDYWxsYmFja3MgaW4gdGhlIHNhbWUgcGhhc2UgcnVuIGluIHRoZSBvcmRlciB0aGV5IGFyZSByZWdpc3RlcmVkLiBQaGFzZXMgcnVuIGluIHRoZVxuICogZm9sbG93aW5nIG9yZGVyIGFmdGVyIGVhY2ggcmVuZGVyOlxuICpcbiAqICAgMS4gYEFmdGVyUmVuZGVyUGhhc2UuRWFybHlSZWFkYFxuICogICAyLiBgQWZ0ZXJSZW5kZXJQaGFzZS5Xcml0ZWBcbiAqICAgMy4gYEFmdGVyUmVuZGVyUGhhc2UuTWl4ZWRSZWFkV3JpdGVgXG4gKiAgIDQuIGBBZnRlclJlbmRlclBoYXNlLlJlYWRgXG4gKlxuICogQW5ndWxhciBpcyB1bmFibGUgdG8gdmVyaWZ5IG9yIGVuZm9yY2UgdGhhdCBwaGFzZXMgYXJlIHVzZWQgY29ycmVjdGx5LCBhbmQgaW5zdGVhZFxuICogcmVsaWVzIG9uIGVhY2ggZGV2ZWxvcGVyIHRvIGZvbGxvdyB0aGUgZ3VpZGVsaW5lcyBkb2N1bWVudGVkIGZvciBlYWNoIHZhbHVlIGFuZFxuICogY2FyZWZ1bGx5IGNob29zZSB0aGUgYXBwcm9wcmlhdGUgb25lLCByZWZhY3RvcmluZyB0aGVpciBjb2RlIGlmIG5lY2Vzc2FyeS4gQnkgZG9pbmdcbiAqIHNvLCBBbmd1bGFyIGlzIGJldHRlciBhYmxlIHRvIG1pbmltaXplIHRoZSBwZXJmb3JtYW5jZSBkZWdyYWRhdGlvbiBhc3NvY2lhdGVkIHdpdGhcbiAqIG1hbnVhbCBET00gYWNjZXNzLCBlbnN1cmluZyB0aGUgYmVzdCBleHBlcmllbmNlIGZvciB0aGUgZW5kIHVzZXJzIG9mIHlvdXIgYXBwbGljYXRpb25cbiAqIG9yIGxpYnJhcnkuXG4gKlxuICogQGRldmVsb3BlclByZXZpZXdcbiAqL1xuZXhwb3J0IGVudW0gQWZ0ZXJSZW5kZXJQaGFzZSB7XG4gIC8qKlxuICAgKiBVc2UgYEFmdGVyUmVuZGVyUGhhc2UuRWFybHlSZWFkYCBmb3IgY2FsbGJhY2tzIHRoYXQgb25seSBuZWVkIHRvICoqcmVhZCoqIGZyb20gdGhlXG4gICAqIERPTSBiZWZvcmUgYSBzdWJzZXF1ZW50IGBBZnRlclJlbmRlclBoYXNlLldyaXRlYCBjYWxsYmFjaywgZm9yIGV4YW1wbGUgdG8gcGVyZm9ybVxuICAgKiBjdXN0b20gbGF5b3V0IHRoYXQgdGhlIGJyb3dzZXIgZG9lc24ndCBuYXRpdmVseSBzdXBwb3J0LiAqKk5ldmVyKiogdXNlIHRoaXMgcGhhc2VcbiAgICogZm9yIGNhbGxiYWNrcyB0aGF0IGNhbiB3cml0ZSB0byB0aGUgRE9NIG9yIHdoZW4gYEFmdGVyUmVuZGVyUGhhc2UuUmVhZGAgaXMgYWRlcXVhdGUuXG4gICAqXG4gICAqIDxkaXYgY2xhc3M9XCJhbGVydCBpcy1pbXBvcnRhbnRcIj5cbiAgICpcbiAgICogVXNpbmcgdGhpcyB2YWx1ZSBjYW4gZGVncmFkZSBwZXJmb3JtYW5jZS5cbiAgICogSW5zdGVhZCwgcHJlZmVyIHVzaW5nIGJ1aWx0LWluIGJyb3dzZXIgZnVuY3Rpb25hbGl0eSB3aGVuIHBvc3NpYmxlLlxuICAgKlxuICAgKiA8L2Rpdj5cbiAgICovXG4gIEVhcmx5UmVhZCxcblxuICAvKipcbiAgICogVXNlIGBBZnRlclJlbmRlclBoYXNlLldyaXRlYCBmb3IgY2FsbGJhY2tzIHRoYXQgb25seSAqKndyaXRlKiogdG8gdGhlIERPTS4gKipOZXZlcioqXG4gICAqIHVzZSB0aGlzIHBoYXNlIGZvciBjYWxsYmFja3MgdGhhdCBjYW4gcmVhZCBmcm9tIHRoZSBET00uXG4gICAqL1xuICBXcml0ZSxcblxuICAvKipcbiAgICogVXNlIGBBZnRlclJlbmRlclBoYXNlLk1peGVkUmVhZFdyaXRlYCBmb3IgY2FsbGJhY2tzIHRoYXQgcmVhZCBmcm9tIG9yIHdyaXRlIHRvIHRoZVxuICAgKiBET00sIHRoYXQgaGF2ZW4ndCBiZWVuIHJlZmFjdG9yZWQgdG8gdXNlIGEgZGlmZmVyZW50IHBoYXNlLiAqKk5ldmVyKiogdXNlIHRoaXMgcGhhc2VcbiAgICogZm9yIGNhbGxiYWNrcyB0aGF0IGNhbiB1c2UgYSBkaWZmZXJlbnQgcGhhc2UgaW5zdGVhZC5cbiAgICpcbiAgICogPGRpdiBjbGFzcz1cImFsZXJ0IGlzLWNyaXRpY2FsXCI+XG4gICAqXG4gICAqIFVzaW5nIHRoaXMgdmFsdWUgY2FuICoqc2lnbmlmaWNhbnRseSoqIGRlZ3JhZGUgcGVyZm9ybWFuY2UuXG4gICAqIEluc3RlYWQsIHByZWZlciByZWZhY3RvcmluZyBpbnRvIG11bHRpcGxlIGNhbGxiYWNrcyB1c2luZyBhIG1vcmUgc3BlY2lmaWMgcGhhc2UuXG4gICAqXG4gICAqIDwvZGl2PlxuICAgKi9cbiAgTWl4ZWRSZWFkV3JpdGUsXG5cbiAgLyoqXG4gICAqIFVzZSBgQWZ0ZXJSZW5kZXJQaGFzZS5SZWFkYCBmb3IgY2FsbGJhY2tzIHRoYXQgb25seSAqKnJlYWQqKiBmcm9tIHRoZSBET00uICoqTmV2ZXIqKlxuICAgKiB1c2UgdGhpcyBwaGFzZSBmb3IgY2FsbGJhY2tzIHRoYXQgY2FuIHdyaXRlIHRvIHRoZSBET00uXG4gICAqL1xuICBSZWFkLFxufVxuXG4vKipcbiAqIE9wdGlvbnMgcGFzc2VkIHRvIGBhZnRlclJlbmRlcmAgYW5kIGBhZnRlck5leHRSZW5kZXJgLlxuICpcbiAqIEBkZXZlbG9wZXJQcmV2aWV3XG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgQWZ0ZXJSZW5kZXJPcHRpb25zIHtcbiAgLyoqXG4gICAqIFRoZSBgSW5qZWN0b3JgIHRvIHVzZSBkdXJpbmcgY3JlYXRpb24uXG4gICAqXG4gICAqIElmIHRoaXMgaXMgbm90IHByb3ZpZGVkLCB0aGUgY3VycmVudCBpbmplY3Rpb24gY29udGV4dCB3aWxsIGJlIHVzZWQgaW5zdGVhZCAodmlhIGBpbmplY3RgKS5cbiAgICovXG4gIGluamVjdG9yPzogSW5qZWN0b3I7XG5cbiAgLyoqXG4gICAqIFRoZSBwaGFzZSB0aGUgY2FsbGJhY2sgc2hvdWxkIGJlIGludm9rZWQgaW4uXG4gICAqXG4gICAqIDxkaXYgY2xhc3M9XCJhbGVydCBpcy1jcml0aWNhbFwiPlxuICAgKlxuICAgKiBEZWZhdWx0cyB0byBgQWZ0ZXJSZW5kZXJQaGFzZS5NaXhlZFJlYWRXcml0ZWAuIFlvdSBzaG91bGQgY2hvb3NlIGEgbW9yZSBzcGVjaWZpY1xuICAgKiBwaGFzZSBpbnN0ZWFkLiBTZWUgYEFmdGVyUmVuZGVyUGhhc2VgIGZvciBtb3JlIGluZm9ybWF0aW9uLlxuICAgKlxuICAgKiA8L2Rpdj5cbiAgICovXG4gIHBoYXNlPzogQWZ0ZXJSZW5kZXJQaGFzZTtcbn1cblxuLyoqXG4gKiBBIGNhbGxiYWNrIHRoYXQgcnVucyBhZnRlciByZW5kZXIuXG4gKlxuICogQGRldmVsb3BlclByZXZpZXdcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBBZnRlclJlbmRlclJlZiB7XG4gIC8qKlxuICAgKiBTaHV0IGRvd24gdGhlIGNhbGxiYWNrLCBwcmV2ZW50aW5nIGl0IGZyb20gYmVpbmcgY2FsbGVkIGFnYWluLlxuICAgKi9cbiAgZGVzdHJveSgpOiB2b2lkO1xufVxuXG4vKipcbiAqIE9wdGlvbnMgcGFzc2VkIHRvIGBpbnRlcm5hbEFmdGVyTmV4dFJlbmRlcmAuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgSW50ZXJuYWxBZnRlck5leHRSZW5kZXJPcHRpb25zIHtcbiAgLyoqXG4gICAqIFRoZSBgSW5qZWN0b3JgIHRvIHVzZSBkdXJpbmcgY3JlYXRpb24uXG4gICAqXG4gICAqIElmIHRoaXMgaXMgbm90IHByb3ZpZGVkLCB0aGUgY3VycmVudCBpbmplY3Rpb24gY29udGV4dCB3aWxsIGJlIHVzZWQgaW5zdGVhZCAodmlhIGBpbmplY3RgKS5cbiAgICovXG4gIGluamVjdG9yPzogSW5qZWN0b3I7XG4gIC8qKlxuICAgKiBXaGVuIHRydWUsIHRoZSBob29rIHdpbGwgZXhlY3V0ZSBib3RoIG9uIGNsaWVudCBhbmQgb24gdGhlIHNlcnZlci5cbiAgICpcbiAgICogV2hlbiBmYWxzZSBvciB1bmRlZmluZWQsIHRoZSBob29rIG9ubHkgZXhlY3V0ZXMgaW4gdGhlIGJyb3dzZXIuXG4gICAqL1xuICBydW5PblNlcnZlcj86IGJvb2xlYW47XG59XG5cbi8qKiBgQWZ0ZXJSZW5kZXJSZWZgIHRoYXQgZG9lcyBub3RoaW5nLiAqL1xuY29uc3QgTk9PUF9BRlRFUl9SRU5ERVJfUkVGOiBBZnRlclJlbmRlclJlZiA9IHtcbiAgZGVzdHJveSgpIHt9XG59O1xuXG4vKipcbiAqIFJlZ2lzdGVyIGEgY2FsbGJhY2sgdG8gcnVuIG9uY2UgYmVmb3JlIGFueSB1c2Vyc3BhY2UgYGFmdGVyUmVuZGVyYCBvclxuICogYGFmdGVyTmV4dFJlbmRlcmAgY2FsbGJhY2tzLlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gc2hvdWxkIGFsbW9zdCBhbHdheXMgYmUgdXNlZCBpbnN0ZWFkIG9mIGBhZnRlclJlbmRlcmAgb3JcbiAqIGBhZnRlck5leHRSZW5kZXJgIGZvciBpbXBsZW1lbnRpbmcgZnJhbWV3b3JrIGZ1bmN0aW9uYWxpdHkuIENvbnNpZGVyOlxuICpcbiAqICAgMS4pIGBBZnRlclJlbmRlclBoYXNlLkVhcmx5UmVhZGAgaXMgaW50ZW5kZWQgdG8gYmUgdXNlZCBmb3IgaW1wbGVtZW50aW5nXG4gKiAgICAgICBjdXN0b20gbGF5b3V0LiBJZiB0aGUgZnJhbWV3b3JrIGl0c2VsZiBtdXRhdGVzIHRoZSBET00gYWZ0ZXIgKmFueSpcbiAqICAgICAgIGBBZnRlclJlbmRlclBoYXNlLkVhcmx5UmVhZGAgY2FsbGJhY2tzIGFyZSBydW4sIHRoZSBwaGFzZSBjYW4gbm9cbiAqICAgICAgIGxvbmdlciByZWxpYWJseSBzZXJ2ZSBpdHMgcHVycG9zZS5cbiAqXG4gKiAgIDIuKSBJbXBvcnRpbmcgYGFmdGVyUmVuZGVyYCBpbiB0aGUgZnJhbWV3b3JrIGNhbiByZWR1Y2UgdGhlIGFiaWxpdHkgZm9yIGl0XG4gKiAgICAgICB0byBiZSB0cmVlLXNoYWtlbiwgYW5kIHRoZSBmcmFtZXdvcmsgc2hvdWxkbid0IG5lZWQgbXVjaCBvZiB0aGUgYmVoYXZpb3IuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbnRlcm5hbEFmdGVyTmV4dFJlbmRlcihcbiAgICBjYWxsYmFjazogVm9pZEZ1bmN0aW9uLCBvcHRpb25zPzogSW50ZXJuYWxBZnRlck5leHRSZW5kZXJPcHRpb25zKSB7XG4gIGNvbnN0IGluamVjdG9yID0gb3B0aW9ucz8uaW5qZWN0b3IgPz8gaW5qZWN0KEluamVjdG9yKTtcblxuICAvLyBTaW1pbGFybHkgdG8gdGhlIHB1YmxpYyBgYWZ0ZXJOZXh0UmVuZGVyYCBmdW5jdGlvbiwgYW4gaW50ZXJuYWwgb25lXG4gIC8vIGlzIG9ubHkgaW52b2tlZCBpbiBhIGJyb3dzZXIgYXMgbG9uZyBhcyB0aGUgcnVuT25TZXJ2ZXIgb3B0aW9uIGlzIG5vdCBzZXQuXG4gIGlmICghb3B0aW9ucz8ucnVuT25TZXJ2ZXIgJiYgIWlzUGxhdGZvcm1Ccm93c2VyKGluamVjdG9yKSkgcmV0dXJuO1xuXG4gIGNvbnN0IGFmdGVyUmVuZGVyRXZlbnRNYW5hZ2VyID0gaW5qZWN0b3IuZ2V0KEFmdGVyUmVuZGVyRXZlbnRNYW5hZ2VyKTtcbiAgYWZ0ZXJSZW5kZXJFdmVudE1hbmFnZXIuaW50ZXJuYWxDYWxsYmFja3MucHVzaChjYWxsYmFjayk7XG59XG5cbi8qKlxuICogUmVnaXN0ZXIgYSBjYWxsYmFjayB0byBiZSBpbnZva2VkIGVhY2ggdGltZSB0aGUgYXBwbGljYXRpb25cbiAqIGZpbmlzaGVzIHJlbmRlcmluZy5cbiAqXG4gKiA8ZGl2IGNsYXNzPVwiYWxlcnQgaXMtY3JpdGljYWxcIj5cbiAqXG4gKiBZb3Ugc2hvdWxkIGFsd2F5cyBleHBsaWNpdGx5IHNwZWNpZnkgYSBub24tZGVmYXVsdCBbcGhhc2VdKGFwaS9jb3JlL0FmdGVyUmVuZGVyUGhhc2UpLCBvciB5b3VcbiAqIHJpc2sgc2lnbmlmaWNhbnQgcGVyZm9ybWFuY2UgZGVncmFkYXRpb24uXG4gKlxuICogPC9kaXY+XG4gKlxuICogTm90ZSB0aGF0IHRoZSBjYWxsYmFjayB3aWxsIHJ1blxuICogLSBpbiB0aGUgb3JkZXIgaXQgd2FzIHJlZ2lzdGVyZWRcbiAqIC0gb25jZSBwZXIgcmVuZGVyXG4gKiAtIG9uIGJyb3dzZXIgcGxhdGZvcm1zIG9ubHlcbiAqXG4gKiA8ZGl2IGNsYXNzPVwiYWxlcnQgaXMtaW1wb3J0YW50XCI+XG4gKlxuICogQ29tcG9uZW50cyBhcmUgbm90IGd1YXJhbnRlZWQgdG8gYmUgW2h5ZHJhdGVkXShndWlkZS9oeWRyYXRpb24pIGJlZm9yZSB0aGUgY2FsbGJhY2sgcnVucy5cbiAqIFlvdSBtdXN0IHVzZSBjYXV0aW9uIHdoZW4gZGlyZWN0bHkgcmVhZGluZyBvciB3cml0aW5nIHRoZSBET00gYW5kIGxheW91dC5cbiAqXG4gKiA8L2Rpdj5cbiAqXG4gKiBAcGFyYW0gY2FsbGJhY2sgQSBjYWxsYmFjayBmdW5jdGlvbiB0byByZWdpc3RlclxuICpcbiAqIEB1c2FnZU5vdGVzXG4gKlxuICogVXNlIGBhZnRlclJlbmRlcmAgdG8gcmVhZCBvciB3cml0ZSB0aGUgRE9NIGFmdGVyIGVhY2ggcmVuZGVyLlxuICpcbiAqICMjIyBFeGFtcGxlXG4gKiBgYGB0c1xuICogQENvbXBvbmVudCh7XG4gKiAgIHNlbGVjdG9yOiAnbXktY21wJyxcbiAqICAgdGVtcGxhdGU6IGA8c3BhbiAjY29udGVudD57eyAuLi4gfX08L3NwYW4+YCxcbiAqIH0pXG4gKiBleHBvcnQgY2xhc3MgTXlDb21wb25lbnQge1xuICogICBAVmlld0NoaWxkKCdjb250ZW50JykgY29udGVudFJlZjogRWxlbWVudFJlZjtcbiAqXG4gKiAgIGNvbnN0cnVjdG9yKCkge1xuICogICAgIGFmdGVyUmVuZGVyKCgpID0+IHtcbiAqICAgICAgIGNvbnNvbGUubG9nKCdjb250ZW50IGhlaWdodDogJyArIHRoaXMuY29udGVudFJlZi5uYXRpdmVFbGVtZW50LnNjcm9sbEhlaWdodCk7XG4gKiAgICAgfSwge3BoYXNlOiBBZnRlclJlbmRlclBoYXNlLlJlYWR9KTtcbiAqICAgfVxuICogfVxuICogYGBgXG4gKlxuICogQGRldmVsb3BlclByZXZpZXdcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFmdGVyUmVuZGVyKGNhbGxiYWNrOiBWb2lkRnVuY3Rpb24sIG9wdGlvbnM/OiBBZnRlclJlbmRlck9wdGlvbnMpOiBBZnRlclJlbmRlclJlZiB7XG4gIG5nRGV2TW9kZSAmJlxuICAgICAgYXNzZXJ0Tm90SW5SZWFjdGl2ZUNvbnRleHQoXG4gICAgICAgICAgYWZ0ZXJSZW5kZXIsXG4gICAgICAgICAgJ0NhbGwgYGFmdGVyUmVuZGVyYCBvdXRzaWRlIG9mIGEgcmVhY3RpdmUgY29udGV4dC4gRm9yIGV4YW1wbGUsIHNjaGVkdWxlIHRoZSByZW5kZXIgJyArXG4gICAgICAgICAgICAgICdjYWxsYmFjayBpbnNpZGUgdGhlIGNvbXBvbmVudCBjb25zdHJ1Y3RvcmAuJyk7XG5cbiAgIW9wdGlvbnMgJiYgYXNzZXJ0SW5JbmplY3Rpb25Db250ZXh0KGFmdGVyUmVuZGVyKTtcbiAgY29uc3QgaW5qZWN0b3IgPSBvcHRpb25zPy5pbmplY3RvciA/PyBpbmplY3QoSW5qZWN0b3IpO1xuXG4gIGlmICghaXNQbGF0Zm9ybUJyb3dzZXIoaW5qZWN0b3IpKSB7XG4gICAgcmV0dXJuIE5PT1BfQUZURVJfUkVOREVSX1JFRjtcbiAgfVxuXG4gIHBlcmZvcm1hbmNlTWFya0ZlYXR1cmUoJ05nQWZ0ZXJSZW5kZXInKTtcblxuICBjb25zdCBhZnRlclJlbmRlckV2ZW50TWFuYWdlciA9IGluamVjdG9yLmdldChBZnRlclJlbmRlckV2ZW50TWFuYWdlcik7XG4gIC8vIExhemlseSBpbml0aWFsaXplIHRoZSBoYW5kbGVyIGltcGxlbWVudGF0aW9uLCBpZiBuZWNlc3NhcnkuIFRoaXMgaXMgc28gdGhhdCBpdCBjYW4gYmVcbiAgLy8gdHJlZS1zaGFrZW4gaWYgYGFmdGVyUmVuZGVyYCBhbmQgYGFmdGVyTmV4dFJlbmRlcmAgYXJlbid0IHVzZWQuXG4gIGNvbnN0IGNhbGxiYWNrSGFuZGxlciA9IGFmdGVyUmVuZGVyRXZlbnRNYW5hZ2VyLmhhbmRsZXIgPz89IG5ldyBBZnRlclJlbmRlckNhbGxiYWNrSGFuZGxlckltcGwoKTtcbiAgY29uc3QgcGhhc2UgPSBvcHRpb25zPy5waGFzZSA/PyBBZnRlclJlbmRlclBoYXNlLk1peGVkUmVhZFdyaXRlO1xuICBjb25zdCBkZXN0cm95ID0gKCkgPT4ge1xuICAgIGNhbGxiYWNrSGFuZGxlci51bnJlZ2lzdGVyKGluc3RhbmNlKTtcbiAgICB1bnJlZ2lzdGVyRm4oKTtcbiAgfTtcbiAgY29uc3QgdW5yZWdpc3RlckZuID0gaW5qZWN0b3IuZ2V0KERlc3Ryb3lSZWYpLm9uRGVzdHJveShkZXN0cm95KTtcbiAgY29uc3QgaW5zdGFuY2UgPSBuZXcgQWZ0ZXJSZW5kZXJDYWxsYmFjayhpbmplY3RvciwgcGhhc2UsIGNhbGxiYWNrKTtcblxuICBjYWxsYmFja0hhbmRsZXIucmVnaXN0ZXIoaW5zdGFuY2UpO1xuICByZXR1cm4ge2Rlc3Ryb3l9O1xufVxuXG4vKipcbiAqIFJlZ2lzdGVyIGEgY2FsbGJhY2sgdG8gYmUgaW52b2tlZCB0aGUgbmV4dCB0aW1lIHRoZSBhcHBsaWNhdGlvblxuICogZmluaXNoZXMgcmVuZGVyaW5nLlxuICpcbiAqIDxkaXYgY2xhc3M9XCJhbGVydCBpcy1jcml0aWNhbFwiPlxuICpcbiAqIFlvdSBzaG91bGQgYWx3YXlzIGV4cGxpY2l0bHkgc3BlY2lmeSBhIG5vbi1kZWZhdWx0IFtwaGFzZV0oYXBpL2NvcmUvQWZ0ZXJSZW5kZXJQaGFzZSksIG9yIHlvdVxuICogcmlzayBzaWduaWZpY2FudCBwZXJmb3JtYW5jZSBkZWdyYWRhdGlvbi5cbiAqXG4gKiA8L2Rpdj5cbiAqXG4gKiBOb3RlIHRoYXQgdGhlIGNhbGxiYWNrIHdpbGwgcnVuXG4gKiAtIGluIHRoZSBvcmRlciBpdCB3YXMgcmVnaXN0ZXJlZFxuICogLSBvbiBicm93c2VyIHBsYXRmb3JtcyBvbmx5XG4gKlxuICogPGRpdiBjbGFzcz1cImFsZXJ0IGlzLWltcG9ydGFudFwiPlxuICpcbiAqIENvbXBvbmVudHMgYXJlIG5vdCBndWFyYW50ZWVkIHRvIGJlIFtoeWRyYXRlZF0oZ3VpZGUvaHlkcmF0aW9uKSBiZWZvcmUgdGhlIGNhbGxiYWNrIHJ1bnMuXG4gKiBZb3UgbXVzdCB1c2UgY2F1dGlvbiB3aGVuIGRpcmVjdGx5IHJlYWRpbmcgb3Igd3JpdGluZyB0aGUgRE9NIGFuZCBsYXlvdXQuXG4gKlxuICogPC9kaXY+XG4gKlxuICogQHBhcmFtIGNhbGxiYWNrIEEgY2FsbGJhY2sgZnVuY3Rpb24gdG8gcmVnaXN0ZXJcbiAqXG4gKiBAdXNhZ2VOb3Rlc1xuICpcbiAqIFVzZSBgYWZ0ZXJOZXh0UmVuZGVyYCB0byByZWFkIG9yIHdyaXRlIHRoZSBET00gb25jZSxcbiAqIGZvciBleGFtcGxlIHRvIGluaXRpYWxpemUgYSBub24tQW5ndWxhciBsaWJyYXJ5LlxuICpcbiAqICMjIyBFeGFtcGxlXG4gKiBgYGB0c1xuICogQENvbXBvbmVudCh7XG4gKiAgIHNlbGVjdG9yOiAnbXktY2hhcnQtY21wJyxcbiAqICAgdGVtcGxhdGU6IGA8ZGl2ICNjaGFydD57eyAuLi4gfX08L2Rpdj5gLFxuICogfSlcbiAqIGV4cG9ydCBjbGFzcyBNeUNoYXJ0Q21wIHtcbiAqICAgQFZpZXdDaGlsZCgnY2hhcnQnKSBjaGFydFJlZjogRWxlbWVudFJlZjtcbiAqICAgY2hhcnQ6IE15Q2hhcnR8bnVsbDtcbiAqXG4gKiAgIGNvbnN0cnVjdG9yKCkge1xuICogICAgIGFmdGVyTmV4dFJlbmRlcigoKSA9PiB7XG4gKiAgICAgICB0aGlzLmNoYXJ0ID0gbmV3IE15Q2hhcnQodGhpcy5jaGFydFJlZi5uYXRpdmVFbGVtZW50KTtcbiAqICAgICB9LCB7cGhhc2U6IEFmdGVyUmVuZGVyUGhhc2UuV3JpdGV9KTtcbiAqICAgfVxuICogfVxuICogYGBgXG4gKlxuICogQGRldmVsb3BlclByZXZpZXdcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFmdGVyTmV4dFJlbmRlcihcbiAgICBjYWxsYmFjazogVm9pZEZ1bmN0aW9uLCBvcHRpb25zPzogQWZ0ZXJSZW5kZXJPcHRpb25zKTogQWZ0ZXJSZW5kZXJSZWYge1xuICAhb3B0aW9ucyAmJiBhc3NlcnRJbkluamVjdGlvbkNvbnRleHQoYWZ0ZXJOZXh0UmVuZGVyKTtcbiAgY29uc3QgaW5qZWN0b3IgPSBvcHRpb25zPy5pbmplY3RvciA/PyBpbmplY3QoSW5qZWN0b3IpO1xuXG4gIGlmICghaXNQbGF0Zm9ybUJyb3dzZXIoaW5qZWN0b3IpKSB7XG4gICAgcmV0dXJuIE5PT1BfQUZURVJfUkVOREVSX1JFRjtcbiAgfVxuXG4gIHBlcmZvcm1hbmNlTWFya0ZlYXR1cmUoJ05nQWZ0ZXJOZXh0UmVuZGVyJyk7XG5cbiAgY29uc3QgYWZ0ZXJSZW5kZXJFdmVudE1hbmFnZXIgPSBpbmplY3Rvci5nZXQoQWZ0ZXJSZW5kZXJFdmVudE1hbmFnZXIpO1xuICAvLyBMYXppbHkgaW5pdGlhbGl6ZSB0aGUgaGFuZGxlciBpbXBsZW1lbnRhdGlvbiwgaWYgbmVjZXNzYXJ5LiBUaGlzIGlzIHNvIHRoYXQgaXQgY2FuIGJlXG4gIC8vIHRyZWUtc2hha2VuIGlmIGBhZnRlclJlbmRlcmAgYW5kIGBhZnRlck5leHRSZW5kZXJgIGFyZW4ndCB1c2VkLlxuICBjb25zdCBjYWxsYmFja0hhbmRsZXIgPSBhZnRlclJlbmRlckV2ZW50TWFuYWdlci5oYW5kbGVyID8/PSBuZXcgQWZ0ZXJSZW5kZXJDYWxsYmFja0hhbmRsZXJJbXBsKCk7XG4gIGNvbnN0IHBoYXNlID0gb3B0aW9ucz8ucGhhc2UgPz8gQWZ0ZXJSZW5kZXJQaGFzZS5NaXhlZFJlYWRXcml0ZTtcbiAgY29uc3QgZGVzdHJveSA9ICgpID0+IHtcbiAgICBjYWxsYmFja0hhbmRsZXIudW5yZWdpc3RlcihpbnN0YW5jZSk7XG4gICAgdW5yZWdpc3RlckZuKCk7XG4gIH07XG4gIGNvbnN0IHVucmVnaXN0ZXJGbiA9IGluamVjdG9yLmdldChEZXN0cm95UmVmKS5vbkRlc3Ryb3koZGVzdHJveSk7XG4gIGNvbnN0IGluc3RhbmNlID0gbmV3IEFmdGVyUmVuZGVyQ2FsbGJhY2soaW5qZWN0b3IsIHBoYXNlLCAoKSA9PiB7XG4gICAgZGVzdHJveSgpO1xuICAgIGNhbGxiYWNrKCk7XG4gIH0pO1xuXG4gIGNhbGxiYWNrSGFuZGxlci5yZWdpc3RlcihpbnN0YW5jZSk7XG4gIHJldHVybiB7ZGVzdHJveX07XG59XG5cbi8qKlxuICogQSB3cmFwcGVyIGFyb3VuZCBhIGZ1bmN0aW9uIHRvIGJlIHVzZWQgYXMgYW4gYWZ0ZXIgcmVuZGVyIGNhbGxiYWNrLlxuICovXG5jbGFzcyBBZnRlclJlbmRlckNhbGxiYWNrIHtcbiAgcHJpdmF0ZSB6b25lOiBOZ1pvbmU7XG4gIHByaXZhdGUgZXJyb3JIYW5kbGVyOiBFcnJvckhhbmRsZXJ8bnVsbDtcblxuICBjb25zdHJ1Y3RvcihcbiAgICAgIGluamVjdG9yOiBJbmplY3RvciwgcHVibGljIHJlYWRvbmx5IHBoYXNlOiBBZnRlclJlbmRlclBoYXNlLFxuICAgICAgcHJpdmF0ZSBjYWxsYmFja0ZuOiBWb2lkRnVuY3Rpb24pIHtcbiAgICB0aGlzLnpvbmUgPSBpbmplY3Rvci5nZXQoTmdab25lKTtcbiAgICB0aGlzLmVycm9ySGFuZGxlciA9IGluamVjdG9yLmdldChFcnJvckhhbmRsZXIsIG51bGwsIHtvcHRpb25hbDogdHJ1ZX0pO1xuICB9XG5cbiAgaW52b2tlKCkge1xuICAgIHRyeSB7XG4gICAgICB0aGlzLnpvbmUucnVuT3V0c2lkZUFuZ3VsYXIodGhpcy5jYWxsYmFja0ZuKTtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIHRoaXMuZXJyb3JIYW5kbGVyPy5oYW5kbGVFcnJvcihlcnIpO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIEltcGxlbWVudHMgYGFmdGVyUmVuZGVyYCBhbmQgYGFmdGVyTmV4dFJlbmRlcmAgY2FsbGJhY2sgaGFuZGxlciBsb2dpYy5cbiAqL1xuaW50ZXJmYWNlIEFmdGVyUmVuZGVyQ2FsbGJhY2tIYW5kbGVyIHtcbiAgLyoqXG4gICAqIFJlZ2lzdGVyIGEgbmV3IGNhbGxiYWNrLlxuICAgKi9cbiAgcmVnaXN0ZXIoY2FsbGJhY2s6IEFmdGVyUmVuZGVyQ2FsbGJhY2spOiB2b2lkO1xuXG4gIC8qKlxuICAgKiBVbnJlZ2lzdGVyIGFuIGV4aXN0aW5nIGNhbGxiYWNrLlxuICAgKi9cbiAgdW5yZWdpc3RlcihjYWxsYmFjazogQWZ0ZXJSZW5kZXJDYWxsYmFjayk6IHZvaWQ7XG5cbiAgLyoqXG4gICAqIEV4ZWN1dGUgY2FsbGJhY2tzLiBSZXR1cm5zIGB0cnVlYCBpZiBhbnkgY2FsbGJhY2tzIHdlcmUgZXhlY3V0ZWQuXG4gICAqL1xuICBleGVjdXRlKCk6IHZvaWQ7XG5cbiAgLyoqXG4gICAqIFBlcmZvcm0gYW55IG5lY2Vzc2FyeSBjbGVhbnVwLlxuICAgKi9cbiAgZGVzdHJveSgpOiB2b2lkO1xufVxuXG4vKipcbiAqIENvcmUgZnVuY3Rpb25hbGl0eSBmb3IgYGFmdGVyUmVuZGVyYCBhbmQgYGFmdGVyTmV4dFJlbmRlcmAuIEtlcHQgc2VwYXJhdGUgZnJvbVxuICogYEFmdGVyUmVuZGVyRXZlbnRNYW5hZ2VyYCBmb3IgdHJlZS1zaGFraW5nLlxuICovXG5jbGFzcyBBZnRlclJlbmRlckNhbGxiYWNrSGFuZGxlckltcGwgaW1wbGVtZW50cyBBZnRlclJlbmRlckNhbGxiYWNrSGFuZGxlciB7XG4gIHByaXZhdGUgZXhlY3V0aW5nQ2FsbGJhY2tzID0gZmFsc2U7XG4gIHByaXZhdGUgYnVja2V0cyA9IHtcbiAgICAvLyBOb3RlOiB0aGUgb3JkZXIgb2YgdGhlc2Uga2V5cyBjb250cm9scyB0aGUgb3JkZXIgdGhlIHBoYXNlcyBhcmUgcnVuLlxuICAgIFtBZnRlclJlbmRlclBoYXNlLkVhcmx5UmVhZF06IG5ldyBTZXQ8QWZ0ZXJSZW5kZXJDYWxsYmFjaz4oKSxcbiAgICBbQWZ0ZXJSZW5kZXJQaGFzZS5Xcml0ZV06IG5ldyBTZXQ8QWZ0ZXJSZW5kZXJDYWxsYmFjaz4oKSxcbiAgICBbQWZ0ZXJSZW5kZXJQaGFzZS5NaXhlZFJlYWRXcml0ZV06IG5ldyBTZXQ8QWZ0ZXJSZW5kZXJDYWxsYmFjaz4oKSxcbiAgICBbQWZ0ZXJSZW5kZXJQaGFzZS5SZWFkXTogbmV3IFNldDxBZnRlclJlbmRlckNhbGxiYWNrPigpLFxuICB9O1xuICBwcml2YXRlIGRlZmVycmVkQ2FsbGJhY2tzID0gbmV3IFNldDxBZnRlclJlbmRlckNhbGxiYWNrPigpO1xuXG4gIHJlZ2lzdGVyKGNhbGxiYWNrOiBBZnRlclJlbmRlckNhbGxiYWNrKTogdm9pZCB7XG4gICAgLy8gSWYgd2UncmUgY3VycmVudGx5IHJ1bm5pbmcgY2FsbGJhY2tzLCBuZXcgY2FsbGJhY2tzIHNob3VsZCBiZSBkZWZlcnJlZFxuICAgIC8vIHVudGlsIHRoZSBuZXh0IHJlbmRlciBvcGVyYXRpb24uXG4gICAgY29uc3QgdGFyZ2V0ID0gdGhpcy5leGVjdXRpbmdDYWxsYmFja3MgPyB0aGlzLmRlZmVycmVkQ2FsbGJhY2tzIDogdGhpcy5idWNrZXRzW2NhbGxiYWNrLnBoYXNlXTtcbiAgICB0YXJnZXQuYWRkKGNhbGxiYWNrKTtcbiAgfVxuXG4gIHVucmVnaXN0ZXIoY2FsbGJhY2s6IEFmdGVyUmVuZGVyQ2FsbGJhY2spOiB2b2lkIHtcbiAgICB0aGlzLmJ1Y2tldHNbY2FsbGJhY2sucGhhc2VdLmRlbGV0ZShjYWxsYmFjayk7XG4gICAgdGhpcy5kZWZlcnJlZENhbGxiYWNrcy5kZWxldGUoY2FsbGJhY2spO1xuICB9XG5cbiAgZXhlY3V0ZSgpOiB2b2lkIHtcbiAgICB0aGlzLmV4ZWN1dGluZ0NhbGxiYWNrcyA9IHRydWU7XG4gICAgZm9yIChjb25zdCBidWNrZXQgb2YgT2JqZWN0LnZhbHVlcyh0aGlzLmJ1Y2tldHMpKSB7XG4gICAgICBmb3IgKGNvbnN0IGNhbGxiYWNrIG9mIGJ1Y2tldCkge1xuICAgICAgICBjYWxsYmFjay5pbnZva2UoKTtcbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5leGVjdXRpbmdDYWxsYmFja3MgPSBmYWxzZTtcblxuICAgIGZvciAoY29uc3QgY2FsbGJhY2sgb2YgdGhpcy5kZWZlcnJlZENhbGxiYWNrcykge1xuICAgICAgdGhpcy5idWNrZXRzW2NhbGxiYWNrLnBoYXNlXS5hZGQoY2FsbGJhY2spO1xuICAgIH1cbiAgICB0aGlzLmRlZmVycmVkQ2FsbGJhY2tzLmNsZWFyKCk7XG4gIH1cblxuICBkZXN0cm95KCk6IHZvaWQge1xuICAgIGZvciAoY29uc3QgYnVja2V0IG9mIE9iamVjdC52YWx1ZXModGhpcy5idWNrZXRzKSkge1xuICAgICAgYnVja2V0LmNsZWFyKCk7XG4gICAgfVxuICAgIHRoaXMuZGVmZXJyZWRDYWxsYmFja3MuY2xlYXIoKTtcbiAgfVxufVxuXG4vKipcbiAqIEltcGxlbWVudHMgY29yZSB0aW1pbmcgZm9yIGBhZnRlclJlbmRlcmAgYW5kIGBhZnRlck5leHRSZW5kZXJgIGV2ZW50cy5cbiAqIERlbGVnYXRlcyB0byBhbiBvcHRpb25hbCBgQWZ0ZXJSZW5kZXJDYWxsYmFja0hhbmRsZXJgIGZvciBpbXBsZW1lbnRhdGlvbi5cbiAqL1xuZXhwb3J0IGNsYXNzIEFmdGVyUmVuZGVyRXZlbnRNYW5hZ2VyIHtcbiAgLyogQGludGVybmFsICovXG4gIGhhbmRsZXI6IEFmdGVyUmVuZGVyQ2FsbGJhY2tIYW5kbGVyfG51bGwgPSBudWxsO1xuXG4gIC8qIEBpbnRlcm5hbCAqL1xuICBpbnRlcm5hbENhbGxiYWNrczogVm9pZEZ1bmN0aW9uW10gPSBbXTtcblxuICAvKipcbiAgICogRXhlY3V0ZXMgaW50ZXJuYWwgYW5kIHVzZXItcHJvdmlkZWQgY2FsbGJhY2tzLlxuICAgKi9cbiAgZXhlY3V0ZSgpOiB2b2lkIHtcbiAgICB0aGlzLmV4ZWN1dGVJbnRlcm5hbENhbGxiYWNrcygpO1xuICAgIHRoaXMuaGFuZGxlcj8uZXhlY3V0ZSgpO1xuICB9XG5cbiAgZXhlY3V0ZUludGVybmFsQ2FsbGJhY2tzKCkge1xuICAgIC8vIE5vdGU6IGludGVybmFsIGNhbGxiYWNrcyBwb3dlciBgaW50ZXJuYWxBZnRlck5leHRSZW5kZXJgLiBTaW5jZSBpbnRlcm5hbCBjYWxsYmFja3NcbiAgICAvLyBhcmUgZmFpcmx5IHRyaXZpYWwsIHRoZXkgYXJlIGtlcHQgc2VwYXJhdGUgc28gdGhhdCBgQWZ0ZXJSZW5kZXJDYWxsYmFja0hhbmRsZXJJbXBsYFxuICAgIC8vIGNhbiBzdGlsbCBiZSB0cmVlLXNoYWtlbiB1bmxlc3MgdXNlZCBieSB0aGUgYXBwbGljYXRpb24uXG4gICAgY29uc3QgY2FsbGJhY2tzID0gWy4uLnRoaXMuaW50ZXJuYWxDYWxsYmFja3NdO1xuICAgIHRoaXMuaW50ZXJuYWxDYWxsYmFja3MubGVuZ3RoID0gMDtcbiAgICBmb3IgKGNvbnN0IGNhbGxiYWNrIG9mIGNhbGxiYWNrcykge1xuICAgICAgY2FsbGJhY2soKTtcbiAgICB9XG4gIH1cblxuICBuZ09uRGVzdHJveSgpIHtcbiAgICB0aGlzLmhhbmRsZXI/LmRlc3Ryb3koKTtcbiAgICB0aGlzLmhhbmRsZXIgPSBudWxsO1xuICAgIHRoaXMuaW50ZXJuYWxDYWxsYmFja3MubGVuZ3RoID0gMDtcbiAgfVxuXG4gIC8qKiBAbm9jb2xsYXBzZSAqL1xuICBzdGF0aWMgybVwcm92ID0gLyoqIEBwdXJlT3JCcmVha015Q29kZSAqLyDJtcm1ZGVmaW5lSW5qZWN0YWJsZSh7XG4gICAgdG9rZW46IEFmdGVyUmVuZGVyRXZlbnRNYW5hZ2VyLFxuICAgIHByb3ZpZGVkSW46ICdyb290JyxcbiAgICBmYWN0b3J5OiAoKSA9PiBuZXcgQWZ0ZXJSZW5kZXJFdmVudE1hbmFnZXIoKSxcbiAgfSk7XG59XG4iXX0=