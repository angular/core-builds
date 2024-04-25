/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ChangeDetectionScheduler } from '../change_detection/scheduling/zoneless_scheduling';
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
    const callbackHandler = afterRenderEventManager.handler ??= new AfterRenderCallbackHandlerImpl();
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWZ0ZXJfcmVuZGVyX2hvb2tzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9hZnRlcl9yZW5kZXJfaG9va3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLHdCQUF3QixFQUFxQixNQUFNLG9EQUFvRCxDQUFDO0FBQ2hILE9BQU8sRUFBQyx3QkFBd0IsRUFBRSxRQUFRLEVBQUUscUJBQXFCLEVBQUUsa0JBQWtCLEVBQUMsTUFBTSxPQUFPLENBQUM7QUFDcEcsT0FBTyxFQUFDLE1BQU0sRUFBQyxNQUFNLDhCQUE4QixDQUFDO0FBQ3BELE9BQU8sRUFBQyxZQUFZLEVBQUMsTUFBTSxrQkFBa0IsQ0FBQztBQUM5QyxPQUFPLEVBQUMsVUFBVSxFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDakQsT0FBTyxFQUFDLDBCQUEwQixFQUFDLE1BQU0sK0JBQStCLENBQUM7QUFDekUsT0FBTyxFQUFDLHNCQUFzQixFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFHM0QsT0FBTyxFQUFDLGlCQUFpQixFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFFcEQ7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7R0FtQkc7QUFDSCxNQUFNLENBQU4sSUFBWSxnQkF5Q1g7QUF6Q0QsV0FBWSxnQkFBZ0I7SUFDMUI7Ozs7Ozs7Ozs7OztPQVlHO0lBQ0gsaUVBQVMsQ0FBQTtJQUVUOzs7T0FHRztJQUNILHlEQUFLLENBQUE7SUFFTDs7Ozs7Ozs7Ozs7T0FXRztJQUNILDJFQUFjLENBQUE7SUFFZDs7O09BR0c7SUFDSCx1REFBSSxDQUFBO0FBQ04sQ0FBQyxFQXpDVyxnQkFBZ0IsS0FBaEIsZ0JBQWdCLFFBeUMzQjtBQTBERCwwQ0FBMEM7QUFDMUMsTUFBTSxxQkFBcUIsR0FBbUI7SUFDNUMsT0FBTyxLQUFJLENBQUM7Q0FDYixDQUFDO0FBRUY7Ozs7Ozs7Ozs7Ozs7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QUFJLENBQUMsaUJBQWlCLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQztRQUNsQyxLQUFLLE1BQU0sUUFBUSxJQUFJLFNBQVMsRUFBRSxDQUFDO1lBQ2pDLFFBQVEsRUFBRSxDQUFDO1FBQ2IsQ0FBQztJQUNILENBQUM7SUFFRCxXQUFXO1FBQ1QsSUFBSSxDQUFDLE9BQU8sRUFBRSxPQUFPLEVBQUUsQ0FBQztRQUN4QixJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQztRQUNwQixJQUFJLENBQUMsaUJBQWlCLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQztJQUNwQyxDQUFDO0lBRUQsa0JBQWtCO2FBQ1gsVUFBSyxHQUE2QixrQkFBa0IsQ0FBQztRQUMxRCxLQUFLLEVBQUUsdUJBQXVCO1FBQzlCLFVBQVUsRUFBRSxNQUFNO1FBQ2xCLE9BQU8sRUFBRSxHQUFHLEVBQUUsQ0FBQyxJQUFJLHVCQUF1QixFQUFFO0tBQzdDLENBQUMsQUFKVSxDQUlUIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7Q2hhbmdlRGV0ZWN0aW9uU2NoZWR1bGVyLCBOb3RpZmljYXRpb25Tb3VyY2V9IGZyb20gJy4uL2NoYW5nZV9kZXRlY3Rpb24vc2NoZWR1bGluZy96b25lbGVzc19zY2hlZHVsaW5nJztcbmltcG9ydCB7YXNzZXJ0SW5JbmplY3Rpb25Db250ZXh0LCBJbmplY3RvciwgcnVuSW5JbmplY3Rpb25Db250ZXh0LCDJtcm1ZGVmaW5lSW5qZWN0YWJsZX0gZnJvbSAnLi4vZGknO1xuaW1wb3J0IHtpbmplY3R9IGZyb20gJy4uL2RpL2luamVjdG9yX2NvbXBhdGliaWxpdHknO1xuaW1wb3J0IHtFcnJvckhhbmRsZXJ9IGZyb20gJy4uL2Vycm9yX2hhbmRsZXInO1xuaW1wb3J0IHtEZXN0cm95UmVmfSBmcm9tICcuLi9saW5rZXIvZGVzdHJveV9yZWYnO1xuaW1wb3J0IHthc3NlcnROb3RJblJlYWN0aXZlQ29udGV4dH0gZnJvbSAnLi4vcmVuZGVyMy9yZWFjdGl2aXR5L2Fzc2VydHMnO1xuaW1wb3J0IHtwZXJmb3JtYW5jZU1hcmtGZWF0dXJlfSBmcm9tICcuLi91dGlsL3BlcmZvcm1hbmNlJztcbmltcG9ydCB7Tmdab25lfSBmcm9tICcuLi96b25lL25nX3pvbmUnO1xuXG5pbXBvcnQge2lzUGxhdGZvcm1Ccm93c2VyfSBmcm9tICcuL3V0aWwvbWlzY191dGlscyc7XG5cbi8qKlxuICogVGhlIHBoYXNlIHRvIHJ1biBhbiBgYWZ0ZXJSZW5kZXJgIG9yIGBhZnRlck5leHRSZW5kZXJgIGNhbGxiYWNrIGluLlxuICpcbiAqIENhbGxiYWNrcyBpbiB0aGUgc2FtZSBwaGFzZSBydW4gaW4gdGhlIG9yZGVyIHRoZXkgYXJlIHJlZ2lzdGVyZWQuIFBoYXNlcyBydW4gaW4gdGhlXG4gKiBmb2xsb3dpbmcgb3JkZXIgYWZ0ZXIgZWFjaCByZW5kZXI6XG4gKlxuICogICAxLiBgQWZ0ZXJSZW5kZXJQaGFzZS5FYXJseVJlYWRgXG4gKiAgIDIuIGBBZnRlclJlbmRlclBoYXNlLldyaXRlYFxuICogICAzLiBgQWZ0ZXJSZW5kZXJQaGFzZS5NaXhlZFJlYWRXcml0ZWBcbiAqICAgNC4gYEFmdGVyUmVuZGVyUGhhc2UuUmVhZGBcbiAqXG4gKiBBbmd1bGFyIGlzIHVuYWJsZSB0byB2ZXJpZnkgb3IgZW5mb3JjZSB0aGF0IHBoYXNlcyBhcmUgdXNlZCBjb3JyZWN0bHksIGFuZCBpbnN0ZWFkXG4gKiByZWxpZXMgb24gZWFjaCBkZXZlbG9wZXIgdG8gZm9sbG93IHRoZSBndWlkZWxpbmVzIGRvY3VtZW50ZWQgZm9yIGVhY2ggdmFsdWUgYW5kXG4gKiBjYXJlZnVsbHkgY2hvb3NlIHRoZSBhcHByb3ByaWF0ZSBvbmUsIHJlZmFjdG9yaW5nIHRoZWlyIGNvZGUgaWYgbmVjZXNzYXJ5LiBCeSBkb2luZ1xuICogc28sIEFuZ3VsYXIgaXMgYmV0dGVyIGFibGUgdG8gbWluaW1pemUgdGhlIHBlcmZvcm1hbmNlIGRlZ3JhZGF0aW9uIGFzc29jaWF0ZWQgd2l0aFxuICogbWFudWFsIERPTSBhY2Nlc3MsIGVuc3VyaW5nIHRoZSBiZXN0IGV4cGVyaWVuY2UgZm9yIHRoZSBlbmQgdXNlcnMgb2YgeW91ciBhcHBsaWNhdGlvblxuICogb3IgbGlicmFyeS5cbiAqXG4gKiBAZGV2ZWxvcGVyUHJldmlld1xuICovXG5leHBvcnQgZW51bSBBZnRlclJlbmRlclBoYXNlIHtcbiAgLyoqXG4gICAqIFVzZSBgQWZ0ZXJSZW5kZXJQaGFzZS5FYXJseVJlYWRgIGZvciBjYWxsYmFja3MgdGhhdCBvbmx5IG5lZWQgdG8gKipyZWFkKiogZnJvbSB0aGVcbiAgICogRE9NIGJlZm9yZSBhIHN1YnNlcXVlbnQgYEFmdGVyUmVuZGVyUGhhc2UuV3JpdGVgIGNhbGxiYWNrLCBmb3IgZXhhbXBsZSB0byBwZXJmb3JtXG4gICAqIGN1c3RvbSBsYXlvdXQgdGhhdCB0aGUgYnJvd3NlciBkb2Vzbid0IG5hdGl2ZWx5IHN1cHBvcnQuICoqTmV2ZXIqKiB1c2UgdGhpcyBwaGFzZVxuICAgKiBmb3IgY2FsbGJhY2tzIHRoYXQgY2FuIHdyaXRlIHRvIHRoZSBET00gb3Igd2hlbiBgQWZ0ZXJSZW5kZXJQaGFzZS5SZWFkYCBpcyBhZGVxdWF0ZS5cbiAgICpcbiAgICogPGRpdiBjbGFzcz1cImFsZXJ0IGlzLWltcG9ydGFudFwiPlxuICAgKlxuICAgKiBVc2luZyB0aGlzIHZhbHVlIGNhbiBkZWdyYWRlIHBlcmZvcm1hbmNlLlxuICAgKiBJbnN0ZWFkLCBwcmVmZXIgdXNpbmcgYnVpbHQtaW4gYnJvd3NlciBmdW5jdGlvbmFsaXR5IHdoZW4gcG9zc2libGUuXG4gICAqXG4gICAqIDwvZGl2PlxuICAgKi9cbiAgRWFybHlSZWFkLFxuXG4gIC8qKlxuICAgKiBVc2UgYEFmdGVyUmVuZGVyUGhhc2UuV3JpdGVgIGZvciBjYWxsYmFja3MgdGhhdCBvbmx5ICoqd3JpdGUqKiB0byB0aGUgRE9NLiAqKk5ldmVyKipcbiAgICogdXNlIHRoaXMgcGhhc2UgZm9yIGNhbGxiYWNrcyB0aGF0IGNhbiByZWFkIGZyb20gdGhlIERPTS5cbiAgICovXG4gIFdyaXRlLFxuXG4gIC8qKlxuICAgKiBVc2UgYEFmdGVyUmVuZGVyUGhhc2UuTWl4ZWRSZWFkV3JpdGVgIGZvciBjYWxsYmFja3MgdGhhdCByZWFkIGZyb20gb3Igd3JpdGUgdG8gdGhlXG4gICAqIERPTSwgdGhhdCBoYXZlbid0IGJlZW4gcmVmYWN0b3JlZCB0byB1c2UgYSBkaWZmZXJlbnQgcGhhc2UuICoqTmV2ZXIqKiB1c2UgdGhpcyBwaGFzZVxuICAgKiBmb3IgY2FsbGJhY2tzIHRoYXQgY2FuIHVzZSBhIGRpZmZlcmVudCBwaGFzZSBpbnN0ZWFkLlxuICAgKlxuICAgKiA8ZGl2IGNsYXNzPVwiYWxlcnQgaXMtY3JpdGljYWxcIj5cbiAgICpcbiAgICogVXNpbmcgdGhpcyB2YWx1ZSBjYW4gKipzaWduaWZpY2FudGx5KiogZGVncmFkZSBwZXJmb3JtYW5jZS5cbiAgICogSW5zdGVhZCwgcHJlZmVyIHJlZmFjdG9yaW5nIGludG8gbXVsdGlwbGUgY2FsbGJhY2tzIHVzaW5nIGEgbW9yZSBzcGVjaWZpYyBwaGFzZS5cbiAgICpcbiAgICogPC9kaXY+XG4gICAqL1xuICBNaXhlZFJlYWRXcml0ZSxcblxuICAvKipcbiAgICogVXNlIGBBZnRlclJlbmRlclBoYXNlLlJlYWRgIGZvciBjYWxsYmFja3MgdGhhdCBvbmx5ICoqcmVhZCoqIGZyb20gdGhlIERPTS4gKipOZXZlcioqXG4gICAqIHVzZSB0aGlzIHBoYXNlIGZvciBjYWxsYmFja3MgdGhhdCBjYW4gd3JpdGUgdG8gdGhlIERPTS5cbiAgICovXG4gIFJlYWQsXG59XG5cbi8qKlxuICogT3B0aW9ucyBwYXNzZWQgdG8gYGFmdGVyUmVuZGVyYCBhbmQgYGFmdGVyTmV4dFJlbmRlcmAuXG4gKlxuICogQGRldmVsb3BlclByZXZpZXdcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBBZnRlclJlbmRlck9wdGlvbnMge1xuICAvKipcbiAgICogVGhlIGBJbmplY3RvcmAgdG8gdXNlIGR1cmluZyBjcmVhdGlvbi5cbiAgICpcbiAgICogSWYgdGhpcyBpcyBub3QgcHJvdmlkZWQsIHRoZSBjdXJyZW50IGluamVjdGlvbiBjb250ZXh0IHdpbGwgYmUgdXNlZCBpbnN0ZWFkICh2aWEgYGluamVjdGApLlxuICAgKi9cbiAgaW5qZWN0b3I/OiBJbmplY3RvcjtcblxuICAvKipcbiAgICogVGhlIHBoYXNlIHRoZSBjYWxsYmFjayBzaG91bGQgYmUgaW52b2tlZCBpbi5cbiAgICpcbiAgICogPGRpdiBjbGFzcz1cImFsZXJ0IGlzLWNyaXRpY2FsXCI+XG4gICAqXG4gICAqIERlZmF1bHRzIHRvIGBBZnRlclJlbmRlclBoYXNlLk1peGVkUmVhZFdyaXRlYC4gWW91IHNob3VsZCBjaG9vc2UgYSBtb3JlIHNwZWNpZmljXG4gICAqIHBoYXNlIGluc3RlYWQuIFNlZSBgQWZ0ZXJSZW5kZXJQaGFzZWAgZm9yIG1vcmUgaW5mb3JtYXRpb24uXG4gICAqXG4gICAqIDwvZGl2PlxuICAgKi9cbiAgcGhhc2U/OiBBZnRlclJlbmRlclBoYXNlO1xufVxuXG4vKipcbiAqIEEgY2FsbGJhY2sgdGhhdCBydW5zIGFmdGVyIHJlbmRlci5cbiAqXG4gKiBAZGV2ZWxvcGVyUHJldmlld1xuICovXG5leHBvcnQgaW50ZXJmYWNlIEFmdGVyUmVuZGVyUmVmIHtcbiAgLyoqXG4gICAqIFNodXQgZG93biB0aGUgY2FsbGJhY2ssIHByZXZlbnRpbmcgaXQgZnJvbSBiZWluZyBjYWxsZWQgYWdhaW4uXG4gICAqL1xuICBkZXN0cm95KCk6IHZvaWQ7XG59XG5cbi8qKlxuICogT3B0aW9ucyBwYXNzZWQgdG8gYGludGVybmFsQWZ0ZXJOZXh0UmVuZGVyYC5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBJbnRlcm5hbEFmdGVyTmV4dFJlbmRlck9wdGlvbnMge1xuICAvKipcbiAgICogVGhlIGBJbmplY3RvcmAgdG8gdXNlIGR1cmluZyBjcmVhdGlvbi5cbiAgICpcbiAgICogSWYgdGhpcyBpcyBub3QgcHJvdmlkZWQsIHRoZSBjdXJyZW50IGluamVjdGlvbiBjb250ZXh0IHdpbGwgYmUgdXNlZCBpbnN0ZWFkICh2aWEgYGluamVjdGApLlxuICAgKi9cbiAgaW5qZWN0b3I/OiBJbmplY3RvcjtcbiAgLyoqXG4gICAqIFdoZW4gdHJ1ZSwgdGhlIGhvb2sgd2lsbCBleGVjdXRlIGJvdGggb24gY2xpZW50IGFuZCBvbiB0aGUgc2VydmVyLlxuICAgKlxuICAgKiBXaGVuIGZhbHNlIG9yIHVuZGVmaW5lZCwgdGhlIGhvb2sgb25seSBleGVjdXRlcyBpbiB0aGUgYnJvd3Nlci5cbiAgICovXG4gIHJ1bk9uU2VydmVyPzogYm9vbGVhbjtcbn1cblxuLyoqIGBBZnRlclJlbmRlclJlZmAgdGhhdCBkb2VzIG5vdGhpbmcuICovXG5jb25zdCBOT09QX0FGVEVSX1JFTkRFUl9SRUY6IEFmdGVyUmVuZGVyUmVmID0ge1xuICBkZXN0cm95KCkge31cbn07XG5cbi8qKlxuICogUmVnaXN0ZXIgYSBjYWxsYmFjayB0byBydW4gb25jZSBiZWZvcmUgYW55IHVzZXJzcGFjZSBgYWZ0ZXJSZW5kZXJgIG9yXG4gKiBgYWZ0ZXJOZXh0UmVuZGVyYCBjYWxsYmFja3MuXG4gKlxuICogVGhpcyBmdW5jdGlvbiBzaG91bGQgYWxtb3N0IGFsd2F5cyBiZSB1c2VkIGluc3RlYWQgb2YgYGFmdGVyUmVuZGVyYCBvclxuICogYGFmdGVyTmV4dFJlbmRlcmAgZm9yIGltcGxlbWVudGluZyBmcmFtZXdvcmsgZnVuY3Rpb25hbGl0eS4gQ29uc2lkZXI6XG4gKlxuICogICAxLikgYEFmdGVyUmVuZGVyUGhhc2UuRWFybHlSZWFkYCBpcyBpbnRlbmRlZCB0byBiZSB1c2VkIGZvciBpbXBsZW1lbnRpbmdcbiAqICAgICAgIGN1c3RvbSBsYXlvdXQuIElmIHRoZSBmcmFtZXdvcmsgaXRzZWxmIG11dGF0ZXMgdGhlIERPTSBhZnRlciAqYW55KlxuICogICAgICAgYEFmdGVyUmVuZGVyUGhhc2UuRWFybHlSZWFkYCBjYWxsYmFja3MgYXJlIHJ1biwgdGhlIHBoYXNlIGNhbiBub1xuICogICAgICAgbG9uZ2VyIHJlbGlhYmx5IHNlcnZlIGl0cyBwdXJwb3NlLlxuICpcbiAqICAgMi4pIEltcG9ydGluZyBgYWZ0ZXJSZW5kZXJgIGluIHRoZSBmcmFtZXdvcmsgY2FuIHJlZHVjZSB0aGUgYWJpbGl0eSBmb3IgaXRcbiAqICAgICAgIHRvIGJlIHRyZWUtc2hha2VuLCBhbmQgdGhlIGZyYW1ld29yayBzaG91bGRuJ3QgbmVlZCBtdWNoIG9mIHRoZSBiZWhhdmlvci5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGludGVybmFsQWZ0ZXJOZXh0UmVuZGVyKFxuICAgIGNhbGxiYWNrOiBWb2lkRnVuY3Rpb24sIG9wdGlvbnM/OiBJbnRlcm5hbEFmdGVyTmV4dFJlbmRlck9wdGlvbnMpIHtcbiAgY29uc3QgaW5qZWN0b3IgPSBvcHRpb25zPy5pbmplY3RvciA/PyBpbmplY3QoSW5qZWN0b3IpO1xuXG4gIC8vIFNpbWlsYXJseSB0byB0aGUgcHVibGljIGBhZnRlck5leHRSZW5kZXJgIGZ1bmN0aW9uLCBhbiBpbnRlcm5hbCBvbmVcbiAgLy8gaXMgb25seSBpbnZva2VkIGluIGEgYnJvd3NlciBhcyBsb25nIGFzIHRoZSBydW5PblNlcnZlciBvcHRpb24gaXMgbm90IHNldC5cbiAgaWYgKCFvcHRpb25zPy5ydW5PblNlcnZlciAmJiAhaXNQbGF0Zm9ybUJyb3dzZXIoaW5qZWN0b3IpKSByZXR1cm47XG5cbiAgY29uc3QgYWZ0ZXJSZW5kZXJFdmVudE1hbmFnZXIgPSBpbmplY3Rvci5nZXQoQWZ0ZXJSZW5kZXJFdmVudE1hbmFnZXIpO1xuICBhZnRlclJlbmRlckV2ZW50TWFuYWdlci5pbnRlcm5hbENhbGxiYWNrcy5wdXNoKGNhbGxiYWNrKTtcbn1cblxuLyoqXG4gKiBSZWdpc3RlciBhIGNhbGxiYWNrIHRvIGJlIGludm9rZWQgZWFjaCB0aW1lIHRoZSBhcHBsaWNhdGlvblxuICogZmluaXNoZXMgcmVuZGVyaW5nLlxuICpcbiAqIDxkaXYgY2xhc3M9XCJhbGVydCBpcy1jcml0aWNhbFwiPlxuICpcbiAqIFlvdSBzaG91bGQgYWx3YXlzIGV4cGxpY2l0bHkgc3BlY2lmeSBhIG5vbi1kZWZhdWx0IFtwaGFzZV0oYXBpL2NvcmUvQWZ0ZXJSZW5kZXJQaGFzZSksIG9yIHlvdVxuICogcmlzayBzaWduaWZpY2FudCBwZXJmb3JtYW5jZSBkZWdyYWRhdGlvbi5cbiAqXG4gKiA8L2Rpdj5cbiAqXG4gKiBOb3RlIHRoYXQgdGhlIGNhbGxiYWNrIHdpbGwgcnVuXG4gKiAtIGluIHRoZSBvcmRlciBpdCB3YXMgcmVnaXN0ZXJlZFxuICogLSBvbmNlIHBlciByZW5kZXJcbiAqIC0gb24gYnJvd3NlciBwbGF0Zm9ybXMgb25seVxuICpcbiAqIDxkaXYgY2xhc3M9XCJhbGVydCBpcy1pbXBvcnRhbnRcIj5cbiAqXG4gKiBDb21wb25lbnRzIGFyZSBub3QgZ3VhcmFudGVlZCB0byBiZSBbaHlkcmF0ZWRdKGd1aWRlL2h5ZHJhdGlvbikgYmVmb3JlIHRoZSBjYWxsYmFjayBydW5zLlxuICogWW91IG11c3QgdXNlIGNhdXRpb24gd2hlbiBkaXJlY3RseSByZWFkaW5nIG9yIHdyaXRpbmcgdGhlIERPTSBhbmQgbGF5b3V0LlxuICpcbiAqIDwvZGl2PlxuICpcbiAqIEBwYXJhbSBjYWxsYmFjayBBIGNhbGxiYWNrIGZ1bmN0aW9uIHRvIHJlZ2lzdGVyXG4gKlxuICogQHVzYWdlTm90ZXNcbiAqXG4gKiBVc2UgYGFmdGVyUmVuZGVyYCB0byByZWFkIG9yIHdyaXRlIHRoZSBET00gYWZ0ZXIgZWFjaCByZW5kZXIuXG4gKlxuICogIyMjIEV4YW1wbGVcbiAqIGBgYHRzXG4gKiBAQ29tcG9uZW50KHtcbiAqICAgc2VsZWN0b3I6ICdteS1jbXAnLFxuICogICB0ZW1wbGF0ZTogYDxzcGFuICNjb250ZW50Pnt7IC4uLiB9fTwvc3Bhbj5gLFxuICogfSlcbiAqIGV4cG9ydCBjbGFzcyBNeUNvbXBvbmVudCB7XG4gKiAgIEBWaWV3Q2hpbGQoJ2NvbnRlbnQnKSBjb250ZW50UmVmOiBFbGVtZW50UmVmO1xuICpcbiAqICAgY29uc3RydWN0b3IoKSB7XG4gKiAgICAgYWZ0ZXJSZW5kZXIoKCkgPT4ge1xuICogICAgICAgY29uc29sZS5sb2coJ2NvbnRlbnQgaGVpZ2h0OiAnICsgdGhpcy5jb250ZW50UmVmLm5hdGl2ZUVsZW1lbnQuc2Nyb2xsSGVpZ2h0KTtcbiAqICAgICB9LCB7cGhhc2U6IEFmdGVyUmVuZGVyUGhhc2UuUmVhZH0pO1xuICogICB9XG4gKiB9XG4gKiBgYGBcbiAqXG4gKiBAZGV2ZWxvcGVyUHJldmlld1xuICovXG5leHBvcnQgZnVuY3Rpb24gYWZ0ZXJSZW5kZXIoY2FsbGJhY2s6IFZvaWRGdW5jdGlvbiwgb3B0aW9ucz86IEFmdGVyUmVuZGVyT3B0aW9ucyk6IEFmdGVyUmVuZGVyUmVmIHtcbiAgbmdEZXZNb2RlICYmXG4gICAgICBhc3NlcnROb3RJblJlYWN0aXZlQ29udGV4dChcbiAgICAgICAgICBhZnRlclJlbmRlcixcbiAgICAgICAgICAnQ2FsbCBgYWZ0ZXJSZW5kZXJgIG91dHNpZGUgb2YgYSByZWFjdGl2ZSBjb250ZXh0LiBGb3IgZXhhbXBsZSwgc2NoZWR1bGUgdGhlIHJlbmRlciAnICtcbiAgICAgICAgICAgICAgJ2NhbGxiYWNrIGluc2lkZSB0aGUgY29tcG9uZW50IGNvbnN0cnVjdG9yYC4nKTtcblxuICAhb3B0aW9ucyAmJiBhc3NlcnRJbkluamVjdGlvbkNvbnRleHQoYWZ0ZXJSZW5kZXIpO1xuICBjb25zdCBpbmplY3RvciA9IG9wdGlvbnM/LmluamVjdG9yID8/IGluamVjdChJbmplY3Rvcik7XG5cbiAgaWYgKCFpc1BsYXRmb3JtQnJvd3NlcihpbmplY3RvcikpIHtcbiAgICByZXR1cm4gTk9PUF9BRlRFUl9SRU5ERVJfUkVGO1xuICB9XG5cbiAgcGVyZm9ybWFuY2VNYXJrRmVhdHVyZSgnTmdBZnRlclJlbmRlcicpO1xuXG4gIGNvbnN0IGFmdGVyUmVuZGVyRXZlbnRNYW5hZ2VyID0gaW5qZWN0b3IuZ2V0KEFmdGVyUmVuZGVyRXZlbnRNYW5hZ2VyKTtcbiAgLy8gTGF6aWx5IGluaXRpYWxpemUgdGhlIGhhbmRsZXIgaW1wbGVtZW50YXRpb24sIGlmIG5lY2Vzc2FyeS4gVGhpcyBpcyBzbyB0aGF0IGl0IGNhbiBiZVxuICAvLyB0cmVlLXNoYWtlbiBpZiBgYWZ0ZXJSZW5kZXJgIGFuZCBgYWZ0ZXJOZXh0UmVuZGVyYCBhcmVuJ3QgdXNlZC5cbiAgY29uc3QgY2FsbGJhY2tIYW5kbGVyID0gYWZ0ZXJSZW5kZXJFdmVudE1hbmFnZXIuaGFuZGxlciA/Pz0gbmV3IEFmdGVyUmVuZGVyQ2FsbGJhY2tIYW5kbGVySW1wbCgpO1xuICBjb25zdCBwaGFzZSA9IG9wdGlvbnM/LnBoYXNlID8/IEFmdGVyUmVuZGVyUGhhc2UuTWl4ZWRSZWFkV3JpdGU7XG4gIGNvbnN0IGRlc3Ryb3kgPSAoKSA9PiB7XG4gICAgY2FsbGJhY2tIYW5kbGVyLnVucmVnaXN0ZXIoaW5zdGFuY2UpO1xuICAgIHVucmVnaXN0ZXJGbigpO1xuICB9O1xuICBjb25zdCB1bnJlZ2lzdGVyRm4gPSBpbmplY3Rvci5nZXQoRGVzdHJveVJlZikub25EZXN0cm95KGRlc3Ryb3kpO1xuICBjb25zdCBpbnN0YW5jZSA9IHJ1bkluSW5qZWN0aW9uQ29udGV4dChpbmplY3RvciwgKCkgPT4gbmV3IEFmdGVyUmVuZGVyQ2FsbGJhY2socGhhc2UsIGNhbGxiYWNrKSk7XG5cbiAgY2FsbGJhY2tIYW5kbGVyLnJlZ2lzdGVyKGluc3RhbmNlKTtcbiAgcmV0dXJuIHtkZXN0cm95fTtcbn1cblxuLyoqXG4gKiBSZWdpc3RlciBhIGNhbGxiYWNrIHRvIGJlIGludm9rZWQgdGhlIG5leHQgdGltZSB0aGUgYXBwbGljYXRpb25cbiAqIGZpbmlzaGVzIHJlbmRlcmluZy5cbiAqXG4gKiA8ZGl2IGNsYXNzPVwiYWxlcnQgaXMtY3JpdGljYWxcIj5cbiAqXG4gKiBZb3Ugc2hvdWxkIGFsd2F5cyBleHBsaWNpdGx5IHNwZWNpZnkgYSBub24tZGVmYXVsdCBbcGhhc2VdKGFwaS9jb3JlL0FmdGVyUmVuZGVyUGhhc2UpLCBvciB5b3VcbiAqIHJpc2sgc2lnbmlmaWNhbnQgcGVyZm9ybWFuY2UgZGVncmFkYXRpb24uXG4gKlxuICogPC9kaXY+XG4gKlxuICogTm90ZSB0aGF0IHRoZSBjYWxsYmFjayB3aWxsIHJ1blxuICogLSBpbiB0aGUgb3JkZXIgaXQgd2FzIHJlZ2lzdGVyZWRcbiAqIC0gb24gYnJvd3NlciBwbGF0Zm9ybXMgb25seVxuICpcbiAqIDxkaXYgY2xhc3M9XCJhbGVydCBpcy1pbXBvcnRhbnRcIj5cbiAqXG4gKiBDb21wb25lbnRzIGFyZSBub3QgZ3VhcmFudGVlZCB0byBiZSBbaHlkcmF0ZWRdKGd1aWRlL2h5ZHJhdGlvbikgYmVmb3JlIHRoZSBjYWxsYmFjayBydW5zLlxuICogWW91IG11c3QgdXNlIGNhdXRpb24gd2hlbiBkaXJlY3RseSByZWFkaW5nIG9yIHdyaXRpbmcgdGhlIERPTSBhbmQgbGF5b3V0LlxuICpcbiAqIDwvZGl2PlxuICpcbiAqIEBwYXJhbSBjYWxsYmFjayBBIGNhbGxiYWNrIGZ1bmN0aW9uIHRvIHJlZ2lzdGVyXG4gKlxuICogQHVzYWdlTm90ZXNcbiAqXG4gKiBVc2UgYGFmdGVyTmV4dFJlbmRlcmAgdG8gcmVhZCBvciB3cml0ZSB0aGUgRE9NIG9uY2UsXG4gKiBmb3IgZXhhbXBsZSB0byBpbml0aWFsaXplIGEgbm9uLUFuZ3VsYXIgbGlicmFyeS5cbiAqXG4gKiAjIyMgRXhhbXBsZVxuICogYGBgdHNcbiAqIEBDb21wb25lbnQoe1xuICogICBzZWxlY3RvcjogJ215LWNoYXJ0LWNtcCcsXG4gKiAgIHRlbXBsYXRlOiBgPGRpdiAjY2hhcnQ+e3sgLi4uIH19PC9kaXY+YCxcbiAqIH0pXG4gKiBleHBvcnQgY2xhc3MgTXlDaGFydENtcCB7XG4gKiAgIEBWaWV3Q2hpbGQoJ2NoYXJ0JykgY2hhcnRSZWY6IEVsZW1lbnRSZWY7XG4gKiAgIGNoYXJ0OiBNeUNoYXJ0fG51bGw7XG4gKlxuICogICBjb25zdHJ1Y3RvcigpIHtcbiAqICAgICBhZnRlck5leHRSZW5kZXIoKCkgPT4ge1xuICogICAgICAgdGhpcy5jaGFydCA9IG5ldyBNeUNoYXJ0KHRoaXMuY2hhcnRSZWYubmF0aXZlRWxlbWVudCk7XG4gKiAgICAgfSwge3BoYXNlOiBBZnRlclJlbmRlclBoYXNlLldyaXRlfSk7XG4gKiAgIH1cbiAqIH1cbiAqIGBgYFxuICpcbiAqIEBkZXZlbG9wZXJQcmV2aWV3XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhZnRlck5leHRSZW5kZXIoXG4gICAgY2FsbGJhY2s6IFZvaWRGdW5jdGlvbiwgb3B0aW9ucz86IEFmdGVyUmVuZGVyT3B0aW9ucyk6IEFmdGVyUmVuZGVyUmVmIHtcbiAgIW9wdGlvbnMgJiYgYXNzZXJ0SW5JbmplY3Rpb25Db250ZXh0KGFmdGVyTmV4dFJlbmRlcik7XG4gIGNvbnN0IGluamVjdG9yID0gb3B0aW9ucz8uaW5qZWN0b3IgPz8gaW5qZWN0KEluamVjdG9yKTtcblxuICBpZiAoIWlzUGxhdGZvcm1Ccm93c2VyKGluamVjdG9yKSkge1xuICAgIHJldHVybiBOT09QX0FGVEVSX1JFTkRFUl9SRUY7XG4gIH1cblxuICBwZXJmb3JtYW5jZU1hcmtGZWF0dXJlKCdOZ0FmdGVyTmV4dFJlbmRlcicpO1xuXG4gIGNvbnN0IGFmdGVyUmVuZGVyRXZlbnRNYW5hZ2VyID0gaW5qZWN0b3IuZ2V0KEFmdGVyUmVuZGVyRXZlbnRNYW5hZ2VyKTtcbiAgLy8gTGF6aWx5IGluaXRpYWxpemUgdGhlIGhhbmRsZXIgaW1wbGVtZW50YXRpb24sIGlmIG5lY2Vzc2FyeS4gVGhpcyBpcyBzbyB0aGF0IGl0IGNhbiBiZVxuICAvLyB0cmVlLXNoYWtlbiBpZiBgYWZ0ZXJSZW5kZXJgIGFuZCBgYWZ0ZXJOZXh0UmVuZGVyYCBhcmVuJ3QgdXNlZC5cbiAgY29uc3QgY2FsbGJhY2tIYW5kbGVyID0gYWZ0ZXJSZW5kZXJFdmVudE1hbmFnZXIuaGFuZGxlciA/Pz0gbmV3IEFmdGVyUmVuZGVyQ2FsbGJhY2tIYW5kbGVySW1wbCgpO1xuICBjb25zdCBwaGFzZSA9IG9wdGlvbnM/LnBoYXNlID8/IEFmdGVyUmVuZGVyUGhhc2UuTWl4ZWRSZWFkV3JpdGU7XG4gIGNvbnN0IGRlc3Ryb3kgPSAoKSA9PiB7XG4gICAgY2FsbGJhY2tIYW5kbGVyLnVucmVnaXN0ZXIoaW5zdGFuY2UpO1xuICAgIHVucmVnaXN0ZXJGbigpO1xuICB9O1xuICBjb25zdCB1bnJlZ2lzdGVyRm4gPSBpbmplY3Rvci5nZXQoRGVzdHJveVJlZikub25EZXN0cm95KGRlc3Ryb3kpO1xuICBjb25zdCBpbnN0YW5jZSA9IHJ1bkluSW5qZWN0aW9uQ29udGV4dChpbmplY3RvciwgKCkgPT4gbmV3IEFmdGVyUmVuZGVyQ2FsbGJhY2socGhhc2UsICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzdHJveSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYWxsYmFjaygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSkpO1xuXG4gIGNhbGxiYWNrSGFuZGxlci5yZWdpc3RlcihpbnN0YW5jZSk7XG4gIHJldHVybiB7ZGVzdHJveX07XG59XG5cbi8qKlxuICogQSB3cmFwcGVyIGFyb3VuZCBhIGZ1bmN0aW9uIHRvIGJlIHVzZWQgYXMgYW4gYWZ0ZXIgcmVuZGVyIGNhbGxiYWNrLlxuICovXG5jbGFzcyBBZnRlclJlbmRlckNhbGxiYWNrIHtcbiAgcHJpdmF0ZSBlcnJvckhhbmRsZXIgPSBpbmplY3QoRXJyb3JIYW5kbGVyLCB7b3B0aW9uYWw6IHRydWV9KTtcblxuICBjb25zdHJ1Y3RvcihyZWFkb25seSBwaGFzZTogQWZ0ZXJSZW5kZXJQaGFzZSwgcHJpdmF0ZSBjYWxsYmFja0ZuOiBWb2lkRnVuY3Rpb24pIHtcbiAgICAvLyBSZWdpc3RlcmluZyBhIGNhbGxiYWNrIHdpbGwgbm90aWZ5IHRoZSBzY2hlZHVsZXIuXG4gICAgaW5qZWN0KENoYW5nZURldGVjdGlvblNjaGVkdWxlciwge29wdGlvbmFsOiB0cnVlfSk/Lm5vdGlmeShOb3RpZmljYXRpb25Tb3VyY2UuTmV3UmVuZGVySG9vayk7XG4gIH1cblxuICBpbnZva2UoKSB7XG4gICAgdHJ5IHtcbiAgICAgIHRoaXMuY2FsbGJhY2tGbigpO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgdGhpcy5lcnJvckhhbmRsZXI/LmhhbmRsZUVycm9yKGVycik7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogSW1wbGVtZW50cyBgYWZ0ZXJSZW5kZXJgIGFuZCBgYWZ0ZXJOZXh0UmVuZGVyYCBjYWxsYmFjayBoYW5kbGVyIGxvZ2ljLlxuICovXG5pbnRlcmZhY2UgQWZ0ZXJSZW5kZXJDYWxsYmFja0hhbmRsZXIge1xuICAvKipcbiAgICogUmVnaXN0ZXIgYSBuZXcgY2FsbGJhY2suXG4gICAqL1xuICByZWdpc3RlcihjYWxsYmFjazogQWZ0ZXJSZW5kZXJDYWxsYmFjayk6IHZvaWQ7XG5cbiAgLyoqXG4gICAqIFVucmVnaXN0ZXIgYW4gZXhpc3RpbmcgY2FsbGJhY2suXG4gICAqL1xuICB1bnJlZ2lzdGVyKGNhbGxiYWNrOiBBZnRlclJlbmRlckNhbGxiYWNrKTogdm9pZDtcblxuICAvKipcbiAgICogRXhlY3V0ZSBjYWxsYmFja3MuIFJldHVybnMgYHRydWVgIGlmIGFueSBjYWxsYmFja3Mgd2VyZSBleGVjdXRlZC5cbiAgICovXG4gIGV4ZWN1dGUoKTogdm9pZDtcblxuICAvKipcbiAgICogUGVyZm9ybSBhbnkgbmVjZXNzYXJ5IGNsZWFudXAuXG4gICAqL1xuICBkZXN0cm95KCk6IHZvaWQ7XG59XG5cbi8qKlxuICogQ29yZSBmdW5jdGlvbmFsaXR5IGZvciBgYWZ0ZXJSZW5kZXJgIGFuZCBgYWZ0ZXJOZXh0UmVuZGVyYC4gS2VwdCBzZXBhcmF0ZSBmcm9tXG4gKiBgQWZ0ZXJSZW5kZXJFdmVudE1hbmFnZXJgIGZvciB0cmVlLXNoYWtpbmcuXG4gKi9cbmNsYXNzIEFmdGVyUmVuZGVyQ2FsbGJhY2tIYW5kbGVySW1wbCBpbXBsZW1lbnRzIEFmdGVyUmVuZGVyQ2FsbGJhY2tIYW5kbGVyIHtcbiAgcHJpdmF0ZSBleGVjdXRpbmdDYWxsYmFja3MgPSBmYWxzZTtcbiAgcHJpdmF0ZSBidWNrZXRzID0ge1xuICAgIC8vIE5vdGU6IHRoZSBvcmRlciBvZiB0aGVzZSBrZXlzIGNvbnRyb2xzIHRoZSBvcmRlciB0aGUgcGhhc2VzIGFyZSBydW4uXG4gICAgW0FmdGVyUmVuZGVyUGhhc2UuRWFybHlSZWFkXTogbmV3IFNldDxBZnRlclJlbmRlckNhbGxiYWNrPigpLFxuICAgIFtBZnRlclJlbmRlclBoYXNlLldyaXRlXTogbmV3IFNldDxBZnRlclJlbmRlckNhbGxiYWNrPigpLFxuICAgIFtBZnRlclJlbmRlclBoYXNlLk1peGVkUmVhZFdyaXRlXTogbmV3IFNldDxBZnRlclJlbmRlckNhbGxiYWNrPigpLFxuICAgIFtBZnRlclJlbmRlclBoYXNlLlJlYWRdOiBuZXcgU2V0PEFmdGVyUmVuZGVyQ2FsbGJhY2s+KCksXG4gIH07XG4gIHByaXZhdGUgZGVmZXJyZWRDYWxsYmFja3MgPSBuZXcgU2V0PEFmdGVyUmVuZGVyQ2FsbGJhY2s+KCk7XG5cbiAgcmVnaXN0ZXIoY2FsbGJhY2s6IEFmdGVyUmVuZGVyQ2FsbGJhY2spOiB2b2lkIHtcbiAgICAvLyBJZiB3ZSdyZSBjdXJyZW50bHkgcnVubmluZyBjYWxsYmFja3MsIG5ldyBjYWxsYmFja3Mgc2hvdWxkIGJlIGRlZmVycmVkXG4gICAgLy8gdW50aWwgdGhlIG5leHQgcmVuZGVyIG9wZXJhdGlvbi5cbiAgICBjb25zdCB0YXJnZXQgPSB0aGlzLmV4ZWN1dGluZ0NhbGxiYWNrcyA/IHRoaXMuZGVmZXJyZWRDYWxsYmFja3MgOiB0aGlzLmJ1Y2tldHNbY2FsbGJhY2sucGhhc2VdO1xuICAgIHRhcmdldC5hZGQoY2FsbGJhY2spO1xuICB9XG5cbiAgdW5yZWdpc3RlcihjYWxsYmFjazogQWZ0ZXJSZW5kZXJDYWxsYmFjayk6IHZvaWQge1xuICAgIHRoaXMuYnVja2V0c1tjYWxsYmFjay5waGFzZV0uZGVsZXRlKGNhbGxiYWNrKTtcbiAgICB0aGlzLmRlZmVycmVkQ2FsbGJhY2tzLmRlbGV0ZShjYWxsYmFjayk7XG4gIH1cblxuICBleGVjdXRlKCk6IHZvaWQge1xuICAgIHRoaXMuZXhlY3V0aW5nQ2FsbGJhY2tzID0gdHJ1ZTtcbiAgICBmb3IgKGNvbnN0IGJ1Y2tldCBvZiBPYmplY3QudmFsdWVzKHRoaXMuYnVja2V0cykpIHtcbiAgICAgIGZvciAoY29uc3QgY2FsbGJhY2sgb2YgYnVja2V0KSB7XG4gICAgICAgIGNhbGxiYWNrLmludm9rZSgpO1xuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLmV4ZWN1dGluZ0NhbGxiYWNrcyA9IGZhbHNlO1xuXG4gICAgZm9yIChjb25zdCBjYWxsYmFjayBvZiB0aGlzLmRlZmVycmVkQ2FsbGJhY2tzKSB7XG4gICAgICB0aGlzLmJ1Y2tldHNbY2FsbGJhY2sucGhhc2VdLmFkZChjYWxsYmFjayk7XG4gICAgfVxuICAgIHRoaXMuZGVmZXJyZWRDYWxsYmFja3MuY2xlYXIoKTtcbiAgfVxuXG4gIGRlc3Ryb3koKTogdm9pZCB7XG4gICAgZm9yIChjb25zdCBidWNrZXQgb2YgT2JqZWN0LnZhbHVlcyh0aGlzLmJ1Y2tldHMpKSB7XG4gICAgICBidWNrZXQuY2xlYXIoKTtcbiAgICB9XG4gICAgdGhpcy5kZWZlcnJlZENhbGxiYWNrcy5jbGVhcigpO1xuICB9XG59XG5cbi8qKlxuICogSW1wbGVtZW50cyBjb3JlIHRpbWluZyBmb3IgYGFmdGVyUmVuZGVyYCBhbmQgYGFmdGVyTmV4dFJlbmRlcmAgZXZlbnRzLlxuICogRGVsZWdhdGVzIHRvIGFuIG9wdGlvbmFsIGBBZnRlclJlbmRlckNhbGxiYWNrSGFuZGxlcmAgZm9yIGltcGxlbWVudGF0aW9uLlxuICovXG5leHBvcnQgY2xhc3MgQWZ0ZXJSZW5kZXJFdmVudE1hbmFnZXIge1xuICAvKiBAaW50ZXJuYWwgKi9cbiAgaGFuZGxlcjogQWZ0ZXJSZW5kZXJDYWxsYmFja0hhbmRsZXJ8bnVsbCA9IG51bGw7XG5cbiAgLyogQGludGVybmFsICovXG4gIGludGVybmFsQ2FsbGJhY2tzOiBWb2lkRnVuY3Rpb25bXSA9IFtdO1xuXG4gIC8qKlxuICAgKiBFeGVjdXRlcyBpbnRlcm5hbCBhbmQgdXNlci1wcm92aWRlZCBjYWxsYmFja3MuXG4gICAqL1xuICBleGVjdXRlKCk6IHZvaWQge1xuICAgIHRoaXMuZXhlY3V0ZUludGVybmFsQ2FsbGJhY2tzKCk7XG4gICAgdGhpcy5oYW5kbGVyPy5leGVjdXRlKCk7XG4gIH1cblxuICBleGVjdXRlSW50ZXJuYWxDYWxsYmFja3MoKSB7XG4gICAgLy8gTm90ZTogaW50ZXJuYWwgY2FsbGJhY2tzIHBvd2VyIGBpbnRlcm5hbEFmdGVyTmV4dFJlbmRlcmAuIFNpbmNlIGludGVybmFsIGNhbGxiYWNrc1xuICAgIC8vIGFyZSBmYWlybHkgdHJpdmlhbCwgdGhleSBhcmUga2VwdCBzZXBhcmF0ZSBzbyB0aGF0IGBBZnRlclJlbmRlckNhbGxiYWNrSGFuZGxlckltcGxgXG4gICAgLy8gY2FuIHN0aWxsIGJlIHRyZWUtc2hha2VuIHVubGVzcyB1c2VkIGJ5IHRoZSBhcHBsaWNhdGlvbi5cbiAgICBjb25zdCBjYWxsYmFja3MgPSBbLi4udGhpcy5pbnRlcm5hbENhbGxiYWNrc107XG4gICAgdGhpcy5pbnRlcm5hbENhbGxiYWNrcy5sZW5ndGggPSAwO1xuICAgIGZvciAoY29uc3QgY2FsbGJhY2sgb2YgY2FsbGJhY2tzKSB7XG4gICAgICBjYWxsYmFjaygpO1xuICAgIH1cbiAgfVxuXG4gIG5nT25EZXN0cm95KCkge1xuICAgIHRoaXMuaGFuZGxlcj8uZGVzdHJveSgpO1xuICAgIHRoaXMuaGFuZGxlciA9IG51bGw7XG4gICAgdGhpcy5pbnRlcm5hbENhbGxiYWNrcy5sZW5ndGggPSAwO1xuICB9XG5cbiAgLyoqIEBub2NvbGxhcHNlICovXG4gIHN0YXRpYyDJtXByb3YgPSAvKiogQHB1cmVPckJyZWFrTXlDb2RlICovIMm1ybVkZWZpbmVJbmplY3RhYmxlKHtcbiAgICB0b2tlbjogQWZ0ZXJSZW5kZXJFdmVudE1hbmFnZXIsXG4gICAgcHJvdmlkZWRJbjogJ3Jvb3QnLFxuICAgIGZhY3Rvcnk6ICgpID0+IG5ldyBBZnRlclJlbmRlckV2ZW50TWFuYWdlcigpLFxuICB9KTtcbn1cbiJdfQ==