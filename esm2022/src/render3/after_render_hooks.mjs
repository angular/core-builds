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
        inject(ChangeDetectionScheduler, { optional: true })?.notify(1 /* NotificationType.AfterRenderHooks */);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWZ0ZXJfcmVuZGVyX2hvb2tzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9hZnRlcl9yZW5kZXJfaG9va3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLHdCQUF3QixFQUFtQixNQUFNLG9EQUFvRCxDQUFDO0FBQzlHLE9BQU8sRUFBQyx3QkFBd0IsRUFBRSxRQUFRLEVBQUUscUJBQXFCLEVBQUUsa0JBQWtCLEVBQUMsTUFBTSxPQUFPLENBQUM7QUFDcEcsT0FBTyxFQUFDLE1BQU0sRUFBQyxNQUFNLDhCQUE4QixDQUFDO0FBQ3BELE9BQU8sRUFBQyxZQUFZLEVBQUMsTUFBTSxrQkFBa0IsQ0FBQztBQUM5QyxPQUFPLEVBQUMsVUFBVSxFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDakQsT0FBTyxFQUFDLDBCQUEwQixFQUFDLE1BQU0sK0JBQStCLENBQUM7QUFDekUsT0FBTyxFQUFDLHNCQUFzQixFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFHM0QsT0FBTyxFQUFDLGlCQUFpQixFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFFcEQ7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7R0FtQkc7QUFDSCxNQUFNLENBQU4sSUFBWSxnQkF5Q1g7QUF6Q0QsV0FBWSxnQkFBZ0I7SUFDMUI7Ozs7Ozs7Ozs7OztPQVlHO0lBQ0gsaUVBQVMsQ0FBQTtJQUVUOzs7T0FHRztJQUNILHlEQUFLLENBQUE7SUFFTDs7Ozs7Ozs7Ozs7T0FXRztJQUNILDJFQUFjLENBQUE7SUFFZDs7O09BR0c7SUFDSCx1REFBSSxDQUFBO0FBQ04sQ0FBQyxFQXpDVyxnQkFBZ0IsS0FBaEIsZ0JBQWdCLFFBeUMzQjtBQTBERCwwQ0FBMEM7QUFDMUMsTUFBTSxxQkFBcUIsR0FBbUI7SUFDNUMsT0FBTyxLQUFJLENBQUM7Q0FDYixDQUFDO0FBRUY7Ozs7Ozs7Ozs7Ozs7O0dBY0c7QUFDSCxNQUFNLFVBQVUsdUJBQXVCLENBQ25DLFFBQXNCLEVBQUUsT0FBd0M7SUFDbEUsTUFBTSxRQUFRLEdBQUcsT0FBTyxFQUFFLFFBQVEsSUFBSSxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUM7SUFFdkQsc0VBQXNFO0lBQ3RFLDZFQUE2RTtJQUM3RSxJQUFJLENBQUMsT0FBTyxFQUFFLFdBQVcsSUFBSSxDQUFDLGlCQUFpQixDQUFDLFFBQVEsQ0FBQztRQUFFLE9BQU87SUFFbEUsTUFBTSx1QkFBdUIsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLHVCQUF1QixDQUFDLENBQUM7SUFDdEUsdUJBQXVCLENBQUMsaUJBQWlCLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0FBQzNELENBQUM7QUFFRDs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7R0ErQ0c7QUFDSCxNQUFNLFVBQVUsV0FBVyxDQUFDLFFBQXNCLEVBQUUsT0FBNEI7SUFDOUUsU0FBUztRQUNMLDBCQUEwQixDQUN0QixXQUFXLEVBQ1gscUZBQXFGO1lBQ2pGLDZDQUE2QyxDQUFDLENBQUM7SUFFM0QsQ0FBQyxPQUFPLElBQUksd0JBQXdCLENBQUMsV0FBVyxDQUFDLENBQUM7SUFDbEQsTUFBTSxRQUFRLEdBQUcsT0FBTyxFQUFFLFFBQVEsSUFBSSxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUM7SUFFdkQsSUFBSSxDQUFDLGlCQUFpQixDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUM7UUFDakMsT0FBTyxxQkFBcUIsQ0FBQztJQUMvQixDQUFDO0lBRUQsc0JBQXNCLENBQUMsZUFBZSxDQUFDLENBQUM7SUFFeEMsTUFBTSx1QkFBdUIsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLHVCQUF1QixDQUFDLENBQUM7SUFDdEUsd0ZBQXdGO0lBQ3hGLGtFQUFrRTtJQUNsRSxNQUFNLGVBQWUsR0FBRyx1QkFBdUIsQ0FBQyxPQUFPLEtBQUssSUFBSSw4QkFBOEIsRUFBRSxDQUFDO0lBQ2pHLE1BQU0sS0FBSyxHQUFHLE9BQU8sRUFBRSxLQUFLLElBQUksZ0JBQWdCLENBQUMsY0FBYyxDQUFDO0lBQ2hFLE1BQU0sT0FBTyxHQUFHLEdBQUcsRUFBRTtRQUNuQixlQUFlLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ3JDLFlBQVksRUFBRSxDQUFDO0lBQ2pCLENBQUMsQ0FBQztJQUNGLE1BQU0sWUFBWSxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQ2pFLE1BQU0sUUFBUSxHQUFHLHFCQUFxQixDQUFDLFFBQVEsRUFBRSxHQUFHLEVBQUUsQ0FBQyxJQUFJLG1CQUFtQixDQUFDLEtBQUssRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFDO0lBRWpHLGVBQWUsQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDbkMsT0FBTyxFQUFDLE9BQU8sRUFBQyxDQUFDO0FBQ25CLENBQUM7QUFFRDs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBZ0RHO0FBQ0gsTUFBTSxVQUFVLGVBQWUsQ0FDM0IsUUFBc0IsRUFBRSxPQUE0QjtJQUN0RCxDQUFDLE9BQU8sSUFBSSx3QkFBd0IsQ0FBQyxlQUFlLENBQUMsQ0FBQztJQUN0RCxNQUFNLFFBQVEsR0FBRyxPQUFPLEVBQUUsUUFBUSxJQUFJLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUV2RCxJQUFJLENBQUMsaUJBQWlCLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQztRQUNqQyxPQUFPLHFCQUFxQixDQUFDO0lBQy9CLENBQUM7SUFFRCxzQkFBc0IsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO0lBRTVDLE1BQU0sdUJBQXVCLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDO0lBQ3RFLHdGQUF3RjtJQUN4RixrRUFBa0U7SUFDbEUsTUFBTSxlQUFlLEdBQUcsdUJBQXVCLENBQUMsT0FBTyxLQUFLLElBQUksOEJBQThCLEVBQUUsQ0FBQztJQUNqRyxNQUFNLEtBQUssR0FBRyxPQUFPLEVBQUUsS0FBSyxJQUFJLGdCQUFnQixDQUFDLGNBQWMsQ0FBQztJQUNoRSxNQUFNLE9BQU8sR0FBRyxHQUFHLEVBQUU7UUFDbkIsZUFBZSxDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUNyQyxZQUFZLEVBQUUsQ0FBQztJQUNqQixDQUFDLENBQUM7SUFDRixNQUFNLFlBQVksR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUNqRSxNQUFNLFFBQVEsR0FBRyxxQkFBcUIsQ0FBQyxRQUFRLEVBQUUsR0FBRyxFQUFFLENBQUMsSUFBSSxtQkFBbUIsQ0FBQyxLQUFLLEVBQUUsR0FBRyxFQUFFO1FBQ3hDLE9BQU8sRUFBRSxDQUFDO1FBQ1YsUUFBUSxFQUFFLENBQUM7SUFDYixDQUFDLENBQUMsQ0FBQyxDQUFDO0lBRXJELGVBQWUsQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDbkMsT0FBTyxFQUFDLE9BQU8sRUFBQyxDQUFDO0FBQ25CLENBQUM7QUFFRDs7R0FFRztBQUNILE1BQU0sbUJBQW1CO0lBR3ZCLFlBQXFCLEtBQXVCLEVBQVUsVUFBd0I7UUFBekQsVUFBSyxHQUFMLEtBQUssQ0FBa0I7UUFBVSxlQUFVLEdBQVYsVUFBVSxDQUFjO1FBRnRFLGlCQUFZLEdBQUcsTUFBTSxDQUFDLFlBQVksRUFBRSxFQUFDLFFBQVEsRUFBRSxJQUFJLEVBQUMsQ0FBQyxDQUFDO1FBRzVELG9EQUFvRDtRQUNwRCxNQUFNLENBQUMsd0JBQXdCLEVBQUUsRUFBQyxRQUFRLEVBQUUsSUFBSSxFQUFDLENBQUMsRUFBRSxNQUFNLDJDQUFtQyxDQUFDO0lBQ2hHLENBQUM7SUFFRCxNQUFNO1FBQ0osSUFBSSxDQUFDO1lBQ0gsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO1FBQ3BCLENBQUM7UUFBQyxPQUFPLEdBQUcsRUFBRSxDQUFDO1lBQ2IsSUFBSSxDQUFDLFlBQVksRUFBRSxXQUFXLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDdEMsQ0FBQztJQUNILENBQUM7Q0FDRjtBQTJCRDs7O0dBR0c7QUFDSCxNQUFNLDhCQUE4QjtJQUFwQztRQUNVLHVCQUFrQixHQUFHLEtBQUssQ0FBQztRQUMzQixZQUFPLEdBQUc7WUFDaEIsdUVBQXVFO1lBQ3ZFLENBQUMsZ0JBQWdCLENBQUMsU0FBUyxDQUFDLEVBQUUsSUFBSSxHQUFHLEVBQXVCO1lBQzVELENBQUMsZ0JBQWdCLENBQUMsS0FBSyxDQUFDLEVBQUUsSUFBSSxHQUFHLEVBQXVCO1lBQ3hELENBQUMsZ0JBQWdCLENBQUMsY0FBYyxDQUFDLEVBQUUsSUFBSSxHQUFHLEVBQXVCO1lBQ2pFLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLEVBQUUsSUFBSSxHQUFHLEVBQXVCO1NBQ3hELENBQUM7UUFDTSxzQkFBaUIsR0FBRyxJQUFJLEdBQUcsRUFBdUIsQ0FBQztJQW1DN0QsQ0FBQztJQWpDQyxRQUFRLENBQUMsUUFBNkI7UUFDcEMseUVBQXlFO1FBQ3pFLG1DQUFtQztRQUNuQyxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDL0YsTUFBTSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUN2QixDQUFDO0lBRUQsVUFBVSxDQUFDLFFBQTZCO1FBQ3RDLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUM5QyxJQUFJLENBQUMsaUJBQWlCLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQzFDLENBQUM7SUFFRCxPQUFPO1FBQ0wsSUFBSSxDQUFDLGtCQUFrQixHQUFHLElBQUksQ0FBQztRQUMvQixLQUFLLE1BQU0sTUFBTSxJQUFJLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7WUFDakQsS0FBSyxNQUFNLFFBQVEsSUFBSSxNQUFNLEVBQUUsQ0FBQztnQkFDOUIsUUFBUSxDQUFDLE1BQU0sRUFBRSxDQUFDO1lBQ3BCLENBQUM7UUFDSCxDQUFDO1FBQ0QsSUFBSSxDQUFDLGtCQUFrQixHQUFHLEtBQUssQ0FBQztRQUVoQyxLQUFLLE1BQU0sUUFBUSxJQUFJLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO1lBQzlDLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUM3QyxDQUFDO1FBQ0QsSUFBSSxDQUFDLGlCQUFpQixDQUFDLEtBQUssRUFBRSxDQUFDO0lBQ2pDLENBQUM7SUFFRCxPQUFPO1FBQ0wsS0FBSyxNQUFNLE1BQU0sSUFBSSxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDO1lBQ2pELE1BQU0sQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUNqQixDQUFDO1FBQ0QsSUFBSSxDQUFDLGlCQUFpQixDQUFDLEtBQUssRUFBRSxDQUFDO0lBQ2pDLENBQUM7Q0FDRjtBQUVEOzs7R0FHRztBQUNILE1BQU0sT0FBTyx1QkFBdUI7SUFBcEM7UUFDRSxlQUFlO1FBQ2YsWUFBTyxHQUFvQyxJQUFJLENBQUM7UUFFaEQsZUFBZTtRQUNmLHNCQUFpQixHQUFtQixFQUFFLENBQUM7SUFpQ3pDLENBQUM7SUEvQkM7O09BRUc7SUFDSCxPQUFPO1FBQ0wsSUFBSSxDQUFDLHdCQUF3QixFQUFFLENBQUM7UUFDaEMsSUFBSSxDQUFDLE9BQU8sRUFBRSxPQUFPLEVBQUUsQ0FBQztJQUMxQixDQUFDO0lBRUQsd0JBQXdCO1FBQ3RCLHFGQUFxRjtRQUNyRixzRkFBc0Y7UUFDdEYsMkRBQTJEO1FBQzNELE1BQU0sU0FBUyxHQUFHLENBQUMsR0FBRyxJQUFJLENBQUMsaUJBQWlCLENBQUMsQ0FBQztRQUM5QyxJQUFJLENBQUMsaUJBQWlCLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQztRQUNsQyxLQUFLLE1BQU0sUUFBUSxJQUFJLFNBQVMsRUFBRSxDQUFDO1lBQ2pDLFFBQVEsRUFBRSxDQUFDO1FBQ2IsQ0FBQztJQUNILENBQUM7SUFFRCxXQUFXO1FBQ1QsSUFBSSxDQUFDLE9BQU8sRUFBRSxPQUFPLEVBQUUsQ0FBQztRQUN4QixJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQztRQUNwQixJQUFJLENBQUMsaUJBQWlCLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQztJQUNwQyxDQUFDO0lBRUQsa0JBQWtCO2FBQ1gsVUFBSyxHQUE2QixrQkFBa0IsQ0FBQztRQUMxRCxLQUFLLEVBQUUsdUJBQXVCO1FBQzlCLFVBQVUsRUFBRSxNQUFNO1FBQ2xCLE9BQU8sRUFBRSxHQUFHLEVBQUUsQ0FBQyxJQUFJLHVCQUF1QixFQUFFO0tBQzdDLENBQUMsQUFKVSxDQUlUIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7Q2hhbmdlRGV0ZWN0aW9uU2NoZWR1bGVyLCBOb3RpZmljYXRpb25UeXBlfSBmcm9tICcuLi9jaGFuZ2VfZGV0ZWN0aW9uL3NjaGVkdWxpbmcvem9uZWxlc3Nfc2NoZWR1bGluZyc7XG5pbXBvcnQge2Fzc2VydEluSW5qZWN0aW9uQ29udGV4dCwgSW5qZWN0b3IsIHJ1bkluSW5qZWN0aW9uQ29udGV4dCwgybXJtWRlZmluZUluamVjdGFibGV9IGZyb20gJy4uL2RpJztcbmltcG9ydCB7aW5qZWN0fSBmcm9tICcuLi9kaS9pbmplY3Rvcl9jb21wYXRpYmlsaXR5JztcbmltcG9ydCB7RXJyb3JIYW5kbGVyfSBmcm9tICcuLi9lcnJvcl9oYW5kbGVyJztcbmltcG9ydCB7RGVzdHJveVJlZn0gZnJvbSAnLi4vbGlua2VyL2Rlc3Ryb3lfcmVmJztcbmltcG9ydCB7YXNzZXJ0Tm90SW5SZWFjdGl2ZUNvbnRleHR9IGZyb20gJy4uL3JlbmRlcjMvcmVhY3Rpdml0eS9hc3NlcnRzJztcbmltcG9ydCB7cGVyZm9ybWFuY2VNYXJrRmVhdHVyZX0gZnJvbSAnLi4vdXRpbC9wZXJmb3JtYW5jZSc7XG5pbXBvcnQge05nWm9uZX0gZnJvbSAnLi4vem9uZS9uZ196b25lJztcblxuaW1wb3J0IHtpc1BsYXRmb3JtQnJvd3Nlcn0gZnJvbSAnLi91dGlsL21pc2NfdXRpbHMnO1xuXG4vKipcbiAqIFRoZSBwaGFzZSB0byBydW4gYW4gYGFmdGVyUmVuZGVyYCBvciBgYWZ0ZXJOZXh0UmVuZGVyYCBjYWxsYmFjayBpbi5cbiAqXG4gKiBDYWxsYmFja3MgaW4gdGhlIHNhbWUgcGhhc2UgcnVuIGluIHRoZSBvcmRlciB0aGV5IGFyZSByZWdpc3RlcmVkLiBQaGFzZXMgcnVuIGluIHRoZVxuICogZm9sbG93aW5nIG9yZGVyIGFmdGVyIGVhY2ggcmVuZGVyOlxuICpcbiAqICAgMS4gYEFmdGVyUmVuZGVyUGhhc2UuRWFybHlSZWFkYFxuICogICAyLiBgQWZ0ZXJSZW5kZXJQaGFzZS5Xcml0ZWBcbiAqICAgMy4gYEFmdGVyUmVuZGVyUGhhc2UuTWl4ZWRSZWFkV3JpdGVgXG4gKiAgIDQuIGBBZnRlclJlbmRlclBoYXNlLlJlYWRgXG4gKlxuICogQW5ndWxhciBpcyB1bmFibGUgdG8gdmVyaWZ5IG9yIGVuZm9yY2UgdGhhdCBwaGFzZXMgYXJlIHVzZWQgY29ycmVjdGx5LCBhbmQgaW5zdGVhZFxuICogcmVsaWVzIG9uIGVhY2ggZGV2ZWxvcGVyIHRvIGZvbGxvdyB0aGUgZ3VpZGVsaW5lcyBkb2N1bWVudGVkIGZvciBlYWNoIHZhbHVlIGFuZFxuICogY2FyZWZ1bGx5IGNob29zZSB0aGUgYXBwcm9wcmlhdGUgb25lLCByZWZhY3RvcmluZyB0aGVpciBjb2RlIGlmIG5lY2Vzc2FyeS4gQnkgZG9pbmdcbiAqIHNvLCBBbmd1bGFyIGlzIGJldHRlciBhYmxlIHRvIG1pbmltaXplIHRoZSBwZXJmb3JtYW5jZSBkZWdyYWRhdGlvbiBhc3NvY2lhdGVkIHdpdGhcbiAqIG1hbnVhbCBET00gYWNjZXNzLCBlbnN1cmluZyB0aGUgYmVzdCBleHBlcmllbmNlIGZvciB0aGUgZW5kIHVzZXJzIG9mIHlvdXIgYXBwbGljYXRpb25cbiAqIG9yIGxpYnJhcnkuXG4gKlxuICogQGRldmVsb3BlclByZXZpZXdcbiAqL1xuZXhwb3J0IGVudW0gQWZ0ZXJSZW5kZXJQaGFzZSB7XG4gIC8qKlxuICAgKiBVc2UgYEFmdGVyUmVuZGVyUGhhc2UuRWFybHlSZWFkYCBmb3IgY2FsbGJhY2tzIHRoYXQgb25seSBuZWVkIHRvICoqcmVhZCoqIGZyb20gdGhlXG4gICAqIERPTSBiZWZvcmUgYSBzdWJzZXF1ZW50IGBBZnRlclJlbmRlclBoYXNlLldyaXRlYCBjYWxsYmFjaywgZm9yIGV4YW1wbGUgdG8gcGVyZm9ybVxuICAgKiBjdXN0b20gbGF5b3V0IHRoYXQgdGhlIGJyb3dzZXIgZG9lc24ndCBuYXRpdmVseSBzdXBwb3J0LiAqKk5ldmVyKiogdXNlIHRoaXMgcGhhc2VcbiAgICogZm9yIGNhbGxiYWNrcyB0aGF0IGNhbiB3cml0ZSB0byB0aGUgRE9NIG9yIHdoZW4gYEFmdGVyUmVuZGVyUGhhc2UuUmVhZGAgaXMgYWRlcXVhdGUuXG4gICAqXG4gICAqIDxkaXYgY2xhc3M9XCJhbGVydCBpcy1pbXBvcnRhbnRcIj5cbiAgICpcbiAgICogVXNpbmcgdGhpcyB2YWx1ZSBjYW4gZGVncmFkZSBwZXJmb3JtYW5jZS5cbiAgICogSW5zdGVhZCwgcHJlZmVyIHVzaW5nIGJ1aWx0LWluIGJyb3dzZXIgZnVuY3Rpb25hbGl0eSB3aGVuIHBvc3NpYmxlLlxuICAgKlxuICAgKiA8L2Rpdj5cbiAgICovXG4gIEVhcmx5UmVhZCxcblxuICAvKipcbiAgICogVXNlIGBBZnRlclJlbmRlclBoYXNlLldyaXRlYCBmb3IgY2FsbGJhY2tzIHRoYXQgb25seSAqKndyaXRlKiogdG8gdGhlIERPTS4gKipOZXZlcioqXG4gICAqIHVzZSB0aGlzIHBoYXNlIGZvciBjYWxsYmFja3MgdGhhdCBjYW4gcmVhZCBmcm9tIHRoZSBET00uXG4gICAqL1xuICBXcml0ZSxcblxuICAvKipcbiAgICogVXNlIGBBZnRlclJlbmRlclBoYXNlLk1peGVkUmVhZFdyaXRlYCBmb3IgY2FsbGJhY2tzIHRoYXQgcmVhZCBmcm9tIG9yIHdyaXRlIHRvIHRoZVxuICAgKiBET00sIHRoYXQgaGF2ZW4ndCBiZWVuIHJlZmFjdG9yZWQgdG8gdXNlIGEgZGlmZmVyZW50IHBoYXNlLiAqKk5ldmVyKiogdXNlIHRoaXMgcGhhc2VcbiAgICogZm9yIGNhbGxiYWNrcyB0aGF0IGNhbiB1c2UgYSBkaWZmZXJlbnQgcGhhc2UgaW5zdGVhZC5cbiAgICpcbiAgICogPGRpdiBjbGFzcz1cImFsZXJ0IGlzLWNyaXRpY2FsXCI+XG4gICAqXG4gICAqIFVzaW5nIHRoaXMgdmFsdWUgY2FuICoqc2lnbmlmaWNhbnRseSoqIGRlZ3JhZGUgcGVyZm9ybWFuY2UuXG4gICAqIEluc3RlYWQsIHByZWZlciByZWZhY3RvcmluZyBpbnRvIG11bHRpcGxlIGNhbGxiYWNrcyB1c2luZyBhIG1vcmUgc3BlY2lmaWMgcGhhc2UuXG4gICAqXG4gICAqIDwvZGl2PlxuICAgKi9cbiAgTWl4ZWRSZWFkV3JpdGUsXG5cbiAgLyoqXG4gICAqIFVzZSBgQWZ0ZXJSZW5kZXJQaGFzZS5SZWFkYCBmb3IgY2FsbGJhY2tzIHRoYXQgb25seSAqKnJlYWQqKiBmcm9tIHRoZSBET00uICoqTmV2ZXIqKlxuICAgKiB1c2UgdGhpcyBwaGFzZSBmb3IgY2FsbGJhY2tzIHRoYXQgY2FuIHdyaXRlIHRvIHRoZSBET00uXG4gICAqL1xuICBSZWFkLFxufVxuXG4vKipcbiAqIE9wdGlvbnMgcGFzc2VkIHRvIGBhZnRlclJlbmRlcmAgYW5kIGBhZnRlck5leHRSZW5kZXJgLlxuICpcbiAqIEBkZXZlbG9wZXJQcmV2aWV3XG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgQWZ0ZXJSZW5kZXJPcHRpb25zIHtcbiAgLyoqXG4gICAqIFRoZSBgSW5qZWN0b3JgIHRvIHVzZSBkdXJpbmcgY3JlYXRpb24uXG4gICAqXG4gICAqIElmIHRoaXMgaXMgbm90IHByb3ZpZGVkLCB0aGUgY3VycmVudCBpbmplY3Rpb24gY29udGV4dCB3aWxsIGJlIHVzZWQgaW5zdGVhZCAodmlhIGBpbmplY3RgKS5cbiAgICovXG4gIGluamVjdG9yPzogSW5qZWN0b3I7XG5cbiAgLyoqXG4gICAqIFRoZSBwaGFzZSB0aGUgY2FsbGJhY2sgc2hvdWxkIGJlIGludm9rZWQgaW4uXG4gICAqXG4gICAqIDxkaXYgY2xhc3M9XCJhbGVydCBpcy1jcml0aWNhbFwiPlxuICAgKlxuICAgKiBEZWZhdWx0cyB0byBgQWZ0ZXJSZW5kZXJQaGFzZS5NaXhlZFJlYWRXcml0ZWAuIFlvdSBzaG91bGQgY2hvb3NlIGEgbW9yZSBzcGVjaWZpY1xuICAgKiBwaGFzZSBpbnN0ZWFkLiBTZWUgYEFmdGVyUmVuZGVyUGhhc2VgIGZvciBtb3JlIGluZm9ybWF0aW9uLlxuICAgKlxuICAgKiA8L2Rpdj5cbiAgICovXG4gIHBoYXNlPzogQWZ0ZXJSZW5kZXJQaGFzZTtcbn1cblxuLyoqXG4gKiBBIGNhbGxiYWNrIHRoYXQgcnVucyBhZnRlciByZW5kZXIuXG4gKlxuICogQGRldmVsb3BlclByZXZpZXdcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBBZnRlclJlbmRlclJlZiB7XG4gIC8qKlxuICAgKiBTaHV0IGRvd24gdGhlIGNhbGxiYWNrLCBwcmV2ZW50aW5nIGl0IGZyb20gYmVpbmcgY2FsbGVkIGFnYWluLlxuICAgKi9cbiAgZGVzdHJveSgpOiB2b2lkO1xufVxuXG4vKipcbiAqIE9wdGlvbnMgcGFzc2VkIHRvIGBpbnRlcm5hbEFmdGVyTmV4dFJlbmRlcmAuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgSW50ZXJuYWxBZnRlck5leHRSZW5kZXJPcHRpb25zIHtcbiAgLyoqXG4gICAqIFRoZSBgSW5qZWN0b3JgIHRvIHVzZSBkdXJpbmcgY3JlYXRpb24uXG4gICAqXG4gICAqIElmIHRoaXMgaXMgbm90IHByb3ZpZGVkLCB0aGUgY3VycmVudCBpbmplY3Rpb24gY29udGV4dCB3aWxsIGJlIHVzZWQgaW5zdGVhZCAodmlhIGBpbmplY3RgKS5cbiAgICovXG4gIGluamVjdG9yPzogSW5qZWN0b3I7XG4gIC8qKlxuICAgKiBXaGVuIHRydWUsIHRoZSBob29rIHdpbGwgZXhlY3V0ZSBib3RoIG9uIGNsaWVudCBhbmQgb24gdGhlIHNlcnZlci5cbiAgICpcbiAgICogV2hlbiBmYWxzZSBvciB1bmRlZmluZWQsIHRoZSBob29rIG9ubHkgZXhlY3V0ZXMgaW4gdGhlIGJyb3dzZXIuXG4gICAqL1xuICBydW5PblNlcnZlcj86IGJvb2xlYW47XG59XG5cbi8qKiBgQWZ0ZXJSZW5kZXJSZWZgIHRoYXQgZG9lcyBub3RoaW5nLiAqL1xuY29uc3QgTk9PUF9BRlRFUl9SRU5ERVJfUkVGOiBBZnRlclJlbmRlclJlZiA9IHtcbiAgZGVzdHJveSgpIHt9XG59O1xuXG4vKipcbiAqIFJlZ2lzdGVyIGEgY2FsbGJhY2sgdG8gcnVuIG9uY2UgYmVmb3JlIGFueSB1c2Vyc3BhY2UgYGFmdGVyUmVuZGVyYCBvclxuICogYGFmdGVyTmV4dFJlbmRlcmAgY2FsbGJhY2tzLlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gc2hvdWxkIGFsbW9zdCBhbHdheXMgYmUgdXNlZCBpbnN0ZWFkIG9mIGBhZnRlclJlbmRlcmAgb3JcbiAqIGBhZnRlck5leHRSZW5kZXJgIGZvciBpbXBsZW1lbnRpbmcgZnJhbWV3b3JrIGZ1bmN0aW9uYWxpdHkuIENvbnNpZGVyOlxuICpcbiAqICAgMS4pIGBBZnRlclJlbmRlclBoYXNlLkVhcmx5UmVhZGAgaXMgaW50ZW5kZWQgdG8gYmUgdXNlZCBmb3IgaW1wbGVtZW50aW5nXG4gKiAgICAgICBjdXN0b20gbGF5b3V0LiBJZiB0aGUgZnJhbWV3b3JrIGl0c2VsZiBtdXRhdGVzIHRoZSBET00gYWZ0ZXIgKmFueSpcbiAqICAgICAgIGBBZnRlclJlbmRlclBoYXNlLkVhcmx5UmVhZGAgY2FsbGJhY2tzIGFyZSBydW4sIHRoZSBwaGFzZSBjYW4gbm9cbiAqICAgICAgIGxvbmdlciByZWxpYWJseSBzZXJ2ZSBpdHMgcHVycG9zZS5cbiAqXG4gKiAgIDIuKSBJbXBvcnRpbmcgYGFmdGVyUmVuZGVyYCBpbiB0aGUgZnJhbWV3b3JrIGNhbiByZWR1Y2UgdGhlIGFiaWxpdHkgZm9yIGl0XG4gKiAgICAgICB0byBiZSB0cmVlLXNoYWtlbiwgYW5kIHRoZSBmcmFtZXdvcmsgc2hvdWxkbid0IG5lZWQgbXVjaCBvZiB0aGUgYmVoYXZpb3IuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbnRlcm5hbEFmdGVyTmV4dFJlbmRlcihcbiAgICBjYWxsYmFjazogVm9pZEZ1bmN0aW9uLCBvcHRpb25zPzogSW50ZXJuYWxBZnRlck5leHRSZW5kZXJPcHRpb25zKSB7XG4gIGNvbnN0IGluamVjdG9yID0gb3B0aW9ucz8uaW5qZWN0b3IgPz8gaW5qZWN0KEluamVjdG9yKTtcblxuICAvLyBTaW1pbGFybHkgdG8gdGhlIHB1YmxpYyBgYWZ0ZXJOZXh0UmVuZGVyYCBmdW5jdGlvbiwgYW4gaW50ZXJuYWwgb25lXG4gIC8vIGlzIG9ubHkgaW52b2tlZCBpbiBhIGJyb3dzZXIgYXMgbG9uZyBhcyB0aGUgcnVuT25TZXJ2ZXIgb3B0aW9uIGlzIG5vdCBzZXQuXG4gIGlmICghb3B0aW9ucz8ucnVuT25TZXJ2ZXIgJiYgIWlzUGxhdGZvcm1Ccm93c2VyKGluamVjdG9yKSkgcmV0dXJuO1xuXG4gIGNvbnN0IGFmdGVyUmVuZGVyRXZlbnRNYW5hZ2VyID0gaW5qZWN0b3IuZ2V0KEFmdGVyUmVuZGVyRXZlbnRNYW5hZ2VyKTtcbiAgYWZ0ZXJSZW5kZXJFdmVudE1hbmFnZXIuaW50ZXJuYWxDYWxsYmFja3MucHVzaChjYWxsYmFjayk7XG59XG5cbi8qKlxuICogUmVnaXN0ZXIgYSBjYWxsYmFjayB0byBiZSBpbnZva2VkIGVhY2ggdGltZSB0aGUgYXBwbGljYXRpb25cbiAqIGZpbmlzaGVzIHJlbmRlcmluZy5cbiAqXG4gKiA8ZGl2IGNsYXNzPVwiYWxlcnQgaXMtY3JpdGljYWxcIj5cbiAqXG4gKiBZb3Ugc2hvdWxkIGFsd2F5cyBleHBsaWNpdGx5IHNwZWNpZnkgYSBub24tZGVmYXVsdCBbcGhhc2VdKGFwaS9jb3JlL0FmdGVyUmVuZGVyUGhhc2UpLCBvciB5b3VcbiAqIHJpc2sgc2lnbmlmaWNhbnQgcGVyZm9ybWFuY2UgZGVncmFkYXRpb24uXG4gKlxuICogPC9kaXY+XG4gKlxuICogTm90ZSB0aGF0IHRoZSBjYWxsYmFjayB3aWxsIHJ1blxuICogLSBpbiB0aGUgb3JkZXIgaXQgd2FzIHJlZ2lzdGVyZWRcbiAqIC0gb25jZSBwZXIgcmVuZGVyXG4gKiAtIG9uIGJyb3dzZXIgcGxhdGZvcm1zIG9ubHlcbiAqXG4gKiA8ZGl2IGNsYXNzPVwiYWxlcnQgaXMtaW1wb3J0YW50XCI+XG4gKlxuICogQ29tcG9uZW50cyBhcmUgbm90IGd1YXJhbnRlZWQgdG8gYmUgW2h5ZHJhdGVkXShndWlkZS9oeWRyYXRpb24pIGJlZm9yZSB0aGUgY2FsbGJhY2sgcnVucy5cbiAqIFlvdSBtdXN0IHVzZSBjYXV0aW9uIHdoZW4gZGlyZWN0bHkgcmVhZGluZyBvciB3cml0aW5nIHRoZSBET00gYW5kIGxheW91dC5cbiAqXG4gKiA8L2Rpdj5cbiAqXG4gKiBAcGFyYW0gY2FsbGJhY2sgQSBjYWxsYmFjayBmdW5jdGlvbiB0byByZWdpc3RlclxuICpcbiAqIEB1c2FnZU5vdGVzXG4gKlxuICogVXNlIGBhZnRlclJlbmRlcmAgdG8gcmVhZCBvciB3cml0ZSB0aGUgRE9NIGFmdGVyIGVhY2ggcmVuZGVyLlxuICpcbiAqICMjIyBFeGFtcGxlXG4gKiBgYGB0c1xuICogQENvbXBvbmVudCh7XG4gKiAgIHNlbGVjdG9yOiAnbXktY21wJyxcbiAqICAgdGVtcGxhdGU6IGA8c3BhbiAjY29udGVudD57eyAuLi4gfX08L3NwYW4+YCxcbiAqIH0pXG4gKiBleHBvcnQgY2xhc3MgTXlDb21wb25lbnQge1xuICogICBAVmlld0NoaWxkKCdjb250ZW50JykgY29udGVudFJlZjogRWxlbWVudFJlZjtcbiAqXG4gKiAgIGNvbnN0cnVjdG9yKCkge1xuICogICAgIGFmdGVyUmVuZGVyKCgpID0+IHtcbiAqICAgICAgIGNvbnNvbGUubG9nKCdjb250ZW50IGhlaWdodDogJyArIHRoaXMuY29udGVudFJlZi5uYXRpdmVFbGVtZW50LnNjcm9sbEhlaWdodCk7XG4gKiAgICAgfSwge3BoYXNlOiBBZnRlclJlbmRlclBoYXNlLlJlYWR9KTtcbiAqICAgfVxuICogfVxuICogYGBgXG4gKlxuICogQGRldmVsb3BlclByZXZpZXdcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFmdGVyUmVuZGVyKGNhbGxiYWNrOiBWb2lkRnVuY3Rpb24sIG9wdGlvbnM/OiBBZnRlclJlbmRlck9wdGlvbnMpOiBBZnRlclJlbmRlclJlZiB7XG4gIG5nRGV2TW9kZSAmJlxuICAgICAgYXNzZXJ0Tm90SW5SZWFjdGl2ZUNvbnRleHQoXG4gICAgICAgICAgYWZ0ZXJSZW5kZXIsXG4gICAgICAgICAgJ0NhbGwgYGFmdGVyUmVuZGVyYCBvdXRzaWRlIG9mIGEgcmVhY3RpdmUgY29udGV4dC4gRm9yIGV4YW1wbGUsIHNjaGVkdWxlIHRoZSByZW5kZXIgJyArXG4gICAgICAgICAgICAgICdjYWxsYmFjayBpbnNpZGUgdGhlIGNvbXBvbmVudCBjb25zdHJ1Y3RvcmAuJyk7XG5cbiAgIW9wdGlvbnMgJiYgYXNzZXJ0SW5JbmplY3Rpb25Db250ZXh0KGFmdGVyUmVuZGVyKTtcbiAgY29uc3QgaW5qZWN0b3IgPSBvcHRpb25zPy5pbmplY3RvciA/PyBpbmplY3QoSW5qZWN0b3IpO1xuXG4gIGlmICghaXNQbGF0Zm9ybUJyb3dzZXIoaW5qZWN0b3IpKSB7XG4gICAgcmV0dXJuIE5PT1BfQUZURVJfUkVOREVSX1JFRjtcbiAgfVxuXG4gIHBlcmZvcm1hbmNlTWFya0ZlYXR1cmUoJ05nQWZ0ZXJSZW5kZXInKTtcblxuICBjb25zdCBhZnRlclJlbmRlckV2ZW50TWFuYWdlciA9IGluamVjdG9yLmdldChBZnRlclJlbmRlckV2ZW50TWFuYWdlcik7XG4gIC8vIExhemlseSBpbml0aWFsaXplIHRoZSBoYW5kbGVyIGltcGxlbWVudGF0aW9uLCBpZiBuZWNlc3NhcnkuIFRoaXMgaXMgc28gdGhhdCBpdCBjYW4gYmVcbiAgLy8gdHJlZS1zaGFrZW4gaWYgYGFmdGVyUmVuZGVyYCBhbmQgYGFmdGVyTmV4dFJlbmRlcmAgYXJlbid0IHVzZWQuXG4gIGNvbnN0IGNhbGxiYWNrSGFuZGxlciA9IGFmdGVyUmVuZGVyRXZlbnRNYW5hZ2VyLmhhbmRsZXIgPz89IG5ldyBBZnRlclJlbmRlckNhbGxiYWNrSGFuZGxlckltcGwoKTtcbiAgY29uc3QgcGhhc2UgPSBvcHRpb25zPy5waGFzZSA/PyBBZnRlclJlbmRlclBoYXNlLk1peGVkUmVhZFdyaXRlO1xuICBjb25zdCBkZXN0cm95ID0gKCkgPT4ge1xuICAgIGNhbGxiYWNrSGFuZGxlci51bnJlZ2lzdGVyKGluc3RhbmNlKTtcbiAgICB1bnJlZ2lzdGVyRm4oKTtcbiAgfTtcbiAgY29uc3QgdW5yZWdpc3RlckZuID0gaW5qZWN0b3IuZ2V0KERlc3Ryb3lSZWYpLm9uRGVzdHJveShkZXN0cm95KTtcbiAgY29uc3QgaW5zdGFuY2UgPSBydW5JbkluamVjdGlvbkNvbnRleHQoaW5qZWN0b3IsICgpID0+IG5ldyBBZnRlclJlbmRlckNhbGxiYWNrKHBoYXNlLCBjYWxsYmFjaykpO1xuXG4gIGNhbGxiYWNrSGFuZGxlci5yZWdpc3RlcihpbnN0YW5jZSk7XG4gIHJldHVybiB7ZGVzdHJveX07XG59XG5cbi8qKlxuICogUmVnaXN0ZXIgYSBjYWxsYmFjayB0byBiZSBpbnZva2VkIHRoZSBuZXh0IHRpbWUgdGhlIGFwcGxpY2F0aW9uXG4gKiBmaW5pc2hlcyByZW5kZXJpbmcuXG4gKlxuICogPGRpdiBjbGFzcz1cImFsZXJ0IGlzLWNyaXRpY2FsXCI+XG4gKlxuICogWW91IHNob3VsZCBhbHdheXMgZXhwbGljaXRseSBzcGVjaWZ5IGEgbm9uLWRlZmF1bHQgW3BoYXNlXShhcGkvY29yZS9BZnRlclJlbmRlclBoYXNlKSwgb3IgeW91XG4gKiByaXNrIHNpZ25pZmljYW50IHBlcmZvcm1hbmNlIGRlZ3JhZGF0aW9uLlxuICpcbiAqIDwvZGl2PlxuICpcbiAqIE5vdGUgdGhhdCB0aGUgY2FsbGJhY2sgd2lsbCBydW5cbiAqIC0gaW4gdGhlIG9yZGVyIGl0IHdhcyByZWdpc3RlcmVkXG4gKiAtIG9uIGJyb3dzZXIgcGxhdGZvcm1zIG9ubHlcbiAqXG4gKiA8ZGl2IGNsYXNzPVwiYWxlcnQgaXMtaW1wb3J0YW50XCI+XG4gKlxuICogQ29tcG9uZW50cyBhcmUgbm90IGd1YXJhbnRlZWQgdG8gYmUgW2h5ZHJhdGVkXShndWlkZS9oeWRyYXRpb24pIGJlZm9yZSB0aGUgY2FsbGJhY2sgcnVucy5cbiAqIFlvdSBtdXN0IHVzZSBjYXV0aW9uIHdoZW4gZGlyZWN0bHkgcmVhZGluZyBvciB3cml0aW5nIHRoZSBET00gYW5kIGxheW91dC5cbiAqXG4gKiA8L2Rpdj5cbiAqXG4gKiBAcGFyYW0gY2FsbGJhY2sgQSBjYWxsYmFjayBmdW5jdGlvbiB0byByZWdpc3RlclxuICpcbiAqIEB1c2FnZU5vdGVzXG4gKlxuICogVXNlIGBhZnRlck5leHRSZW5kZXJgIHRvIHJlYWQgb3Igd3JpdGUgdGhlIERPTSBvbmNlLFxuICogZm9yIGV4YW1wbGUgdG8gaW5pdGlhbGl6ZSBhIG5vbi1Bbmd1bGFyIGxpYnJhcnkuXG4gKlxuICogIyMjIEV4YW1wbGVcbiAqIGBgYHRzXG4gKiBAQ29tcG9uZW50KHtcbiAqICAgc2VsZWN0b3I6ICdteS1jaGFydC1jbXAnLFxuICogICB0ZW1wbGF0ZTogYDxkaXYgI2NoYXJ0Pnt7IC4uLiB9fTwvZGl2PmAsXG4gKiB9KVxuICogZXhwb3J0IGNsYXNzIE15Q2hhcnRDbXAge1xuICogICBAVmlld0NoaWxkKCdjaGFydCcpIGNoYXJ0UmVmOiBFbGVtZW50UmVmO1xuICogICBjaGFydDogTXlDaGFydHxudWxsO1xuICpcbiAqICAgY29uc3RydWN0b3IoKSB7XG4gKiAgICAgYWZ0ZXJOZXh0UmVuZGVyKCgpID0+IHtcbiAqICAgICAgIHRoaXMuY2hhcnQgPSBuZXcgTXlDaGFydCh0aGlzLmNoYXJ0UmVmLm5hdGl2ZUVsZW1lbnQpO1xuICogICAgIH0sIHtwaGFzZTogQWZ0ZXJSZW5kZXJQaGFzZS5Xcml0ZX0pO1xuICogICB9XG4gKiB9XG4gKiBgYGBcbiAqXG4gKiBAZGV2ZWxvcGVyUHJldmlld1xuICovXG5leHBvcnQgZnVuY3Rpb24gYWZ0ZXJOZXh0UmVuZGVyKFxuICAgIGNhbGxiYWNrOiBWb2lkRnVuY3Rpb24sIG9wdGlvbnM/OiBBZnRlclJlbmRlck9wdGlvbnMpOiBBZnRlclJlbmRlclJlZiB7XG4gICFvcHRpb25zICYmIGFzc2VydEluSW5qZWN0aW9uQ29udGV4dChhZnRlck5leHRSZW5kZXIpO1xuICBjb25zdCBpbmplY3RvciA9IG9wdGlvbnM/LmluamVjdG9yID8/IGluamVjdChJbmplY3Rvcik7XG5cbiAgaWYgKCFpc1BsYXRmb3JtQnJvd3NlcihpbmplY3RvcikpIHtcbiAgICByZXR1cm4gTk9PUF9BRlRFUl9SRU5ERVJfUkVGO1xuICB9XG5cbiAgcGVyZm9ybWFuY2VNYXJrRmVhdHVyZSgnTmdBZnRlck5leHRSZW5kZXInKTtcblxuICBjb25zdCBhZnRlclJlbmRlckV2ZW50TWFuYWdlciA9IGluamVjdG9yLmdldChBZnRlclJlbmRlckV2ZW50TWFuYWdlcik7XG4gIC8vIExhemlseSBpbml0aWFsaXplIHRoZSBoYW5kbGVyIGltcGxlbWVudGF0aW9uLCBpZiBuZWNlc3NhcnkuIFRoaXMgaXMgc28gdGhhdCBpdCBjYW4gYmVcbiAgLy8gdHJlZS1zaGFrZW4gaWYgYGFmdGVyUmVuZGVyYCBhbmQgYGFmdGVyTmV4dFJlbmRlcmAgYXJlbid0IHVzZWQuXG4gIGNvbnN0IGNhbGxiYWNrSGFuZGxlciA9IGFmdGVyUmVuZGVyRXZlbnRNYW5hZ2VyLmhhbmRsZXIgPz89IG5ldyBBZnRlclJlbmRlckNhbGxiYWNrSGFuZGxlckltcGwoKTtcbiAgY29uc3QgcGhhc2UgPSBvcHRpb25zPy5waGFzZSA/PyBBZnRlclJlbmRlclBoYXNlLk1peGVkUmVhZFdyaXRlO1xuICBjb25zdCBkZXN0cm95ID0gKCkgPT4ge1xuICAgIGNhbGxiYWNrSGFuZGxlci51bnJlZ2lzdGVyKGluc3RhbmNlKTtcbiAgICB1bnJlZ2lzdGVyRm4oKTtcbiAgfTtcbiAgY29uc3QgdW5yZWdpc3RlckZuID0gaW5qZWN0b3IuZ2V0KERlc3Ryb3lSZWYpLm9uRGVzdHJveShkZXN0cm95KTtcbiAgY29uc3QgaW5zdGFuY2UgPSBydW5JbkluamVjdGlvbkNvbnRleHQoaW5qZWN0b3IsICgpID0+IG5ldyBBZnRlclJlbmRlckNhbGxiYWNrKHBoYXNlLCAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc3Ryb3koKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2soKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pKTtcblxuICBjYWxsYmFja0hhbmRsZXIucmVnaXN0ZXIoaW5zdGFuY2UpO1xuICByZXR1cm4ge2Rlc3Ryb3l9O1xufVxuXG4vKipcbiAqIEEgd3JhcHBlciBhcm91bmQgYSBmdW5jdGlvbiB0byBiZSB1c2VkIGFzIGFuIGFmdGVyIHJlbmRlciBjYWxsYmFjay5cbiAqL1xuY2xhc3MgQWZ0ZXJSZW5kZXJDYWxsYmFjayB7XG4gIHByaXZhdGUgZXJyb3JIYW5kbGVyID0gaW5qZWN0KEVycm9ySGFuZGxlciwge29wdGlvbmFsOiB0cnVlfSk7XG5cbiAgY29uc3RydWN0b3IocmVhZG9ubHkgcGhhc2U6IEFmdGVyUmVuZGVyUGhhc2UsIHByaXZhdGUgY2FsbGJhY2tGbjogVm9pZEZ1bmN0aW9uKSB7XG4gICAgLy8gUmVnaXN0ZXJpbmcgYSBjYWxsYmFjayB3aWxsIG5vdGlmeSB0aGUgc2NoZWR1bGVyLlxuICAgIGluamVjdChDaGFuZ2VEZXRlY3Rpb25TY2hlZHVsZXIsIHtvcHRpb25hbDogdHJ1ZX0pPy5ub3RpZnkoTm90aWZpY2F0aW9uVHlwZS5BZnRlclJlbmRlckhvb2tzKTtcbiAgfVxuXG4gIGludm9rZSgpIHtcbiAgICB0cnkge1xuICAgICAgdGhpcy5jYWxsYmFja0ZuKCk7XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICB0aGlzLmVycm9ySGFuZGxlcj8uaGFuZGxlRXJyb3IoZXJyKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBJbXBsZW1lbnRzIGBhZnRlclJlbmRlcmAgYW5kIGBhZnRlck5leHRSZW5kZXJgIGNhbGxiYWNrIGhhbmRsZXIgbG9naWMuXG4gKi9cbmludGVyZmFjZSBBZnRlclJlbmRlckNhbGxiYWNrSGFuZGxlciB7XG4gIC8qKlxuICAgKiBSZWdpc3RlciBhIG5ldyBjYWxsYmFjay5cbiAgICovXG4gIHJlZ2lzdGVyKGNhbGxiYWNrOiBBZnRlclJlbmRlckNhbGxiYWNrKTogdm9pZDtcblxuICAvKipcbiAgICogVW5yZWdpc3RlciBhbiBleGlzdGluZyBjYWxsYmFjay5cbiAgICovXG4gIHVucmVnaXN0ZXIoY2FsbGJhY2s6IEFmdGVyUmVuZGVyQ2FsbGJhY2spOiB2b2lkO1xuXG4gIC8qKlxuICAgKiBFeGVjdXRlIGNhbGxiYWNrcy4gUmV0dXJucyBgdHJ1ZWAgaWYgYW55IGNhbGxiYWNrcyB3ZXJlIGV4ZWN1dGVkLlxuICAgKi9cbiAgZXhlY3V0ZSgpOiB2b2lkO1xuXG4gIC8qKlxuICAgKiBQZXJmb3JtIGFueSBuZWNlc3NhcnkgY2xlYW51cC5cbiAgICovXG4gIGRlc3Ryb3koKTogdm9pZDtcbn1cblxuLyoqXG4gKiBDb3JlIGZ1bmN0aW9uYWxpdHkgZm9yIGBhZnRlclJlbmRlcmAgYW5kIGBhZnRlck5leHRSZW5kZXJgLiBLZXB0IHNlcGFyYXRlIGZyb21cbiAqIGBBZnRlclJlbmRlckV2ZW50TWFuYWdlcmAgZm9yIHRyZWUtc2hha2luZy5cbiAqL1xuY2xhc3MgQWZ0ZXJSZW5kZXJDYWxsYmFja0hhbmRsZXJJbXBsIGltcGxlbWVudHMgQWZ0ZXJSZW5kZXJDYWxsYmFja0hhbmRsZXIge1xuICBwcml2YXRlIGV4ZWN1dGluZ0NhbGxiYWNrcyA9IGZhbHNlO1xuICBwcml2YXRlIGJ1Y2tldHMgPSB7XG4gICAgLy8gTm90ZTogdGhlIG9yZGVyIG9mIHRoZXNlIGtleXMgY29udHJvbHMgdGhlIG9yZGVyIHRoZSBwaGFzZXMgYXJlIHJ1bi5cbiAgICBbQWZ0ZXJSZW5kZXJQaGFzZS5FYXJseVJlYWRdOiBuZXcgU2V0PEFmdGVyUmVuZGVyQ2FsbGJhY2s+KCksXG4gICAgW0FmdGVyUmVuZGVyUGhhc2UuV3JpdGVdOiBuZXcgU2V0PEFmdGVyUmVuZGVyQ2FsbGJhY2s+KCksXG4gICAgW0FmdGVyUmVuZGVyUGhhc2UuTWl4ZWRSZWFkV3JpdGVdOiBuZXcgU2V0PEFmdGVyUmVuZGVyQ2FsbGJhY2s+KCksXG4gICAgW0FmdGVyUmVuZGVyUGhhc2UuUmVhZF06IG5ldyBTZXQ8QWZ0ZXJSZW5kZXJDYWxsYmFjaz4oKSxcbiAgfTtcbiAgcHJpdmF0ZSBkZWZlcnJlZENhbGxiYWNrcyA9IG5ldyBTZXQ8QWZ0ZXJSZW5kZXJDYWxsYmFjaz4oKTtcblxuICByZWdpc3RlcihjYWxsYmFjazogQWZ0ZXJSZW5kZXJDYWxsYmFjayk6IHZvaWQge1xuICAgIC8vIElmIHdlJ3JlIGN1cnJlbnRseSBydW5uaW5nIGNhbGxiYWNrcywgbmV3IGNhbGxiYWNrcyBzaG91bGQgYmUgZGVmZXJyZWRcbiAgICAvLyB1bnRpbCB0aGUgbmV4dCByZW5kZXIgb3BlcmF0aW9uLlxuICAgIGNvbnN0IHRhcmdldCA9IHRoaXMuZXhlY3V0aW5nQ2FsbGJhY2tzID8gdGhpcy5kZWZlcnJlZENhbGxiYWNrcyA6IHRoaXMuYnVja2V0c1tjYWxsYmFjay5waGFzZV07XG4gICAgdGFyZ2V0LmFkZChjYWxsYmFjayk7XG4gIH1cblxuICB1bnJlZ2lzdGVyKGNhbGxiYWNrOiBBZnRlclJlbmRlckNhbGxiYWNrKTogdm9pZCB7XG4gICAgdGhpcy5idWNrZXRzW2NhbGxiYWNrLnBoYXNlXS5kZWxldGUoY2FsbGJhY2spO1xuICAgIHRoaXMuZGVmZXJyZWRDYWxsYmFja3MuZGVsZXRlKGNhbGxiYWNrKTtcbiAgfVxuXG4gIGV4ZWN1dGUoKTogdm9pZCB7XG4gICAgdGhpcy5leGVjdXRpbmdDYWxsYmFja3MgPSB0cnVlO1xuICAgIGZvciAoY29uc3QgYnVja2V0IG9mIE9iamVjdC52YWx1ZXModGhpcy5idWNrZXRzKSkge1xuICAgICAgZm9yIChjb25zdCBjYWxsYmFjayBvZiBidWNrZXQpIHtcbiAgICAgICAgY2FsbGJhY2suaW52b2tlKCk7XG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMuZXhlY3V0aW5nQ2FsbGJhY2tzID0gZmFsc2U7XG5cbiAgICBmb3IgKGNvbnN0IGNhbGxiYWNrIG9mIHRoaXMuZGVmZXJyZWRDYWxsYmFja3MpIHtcbiAgICAgIHRoaXMuYnVja2V0c1tjYWxsYmFjay5waGFzZV0uYWRkKGNhbGxiYWNrKTtcbiAgICB9XG4gICAgdGhpcy5kZWZlcnJlZENhbGxiYWNrcy5jbGVhcigpO1xuICB9XG5cbiAgZGVzdHJveSgpOiB2b2lkIHtcbiAgICBmb3IgKGNvbnN0IGJ1Y2tldCBvZiBPYmplY3QudmFsdWVzKHRoaXMuYnVja2V0cykpIHtcbiAgICAgIGJ1Y2tldC5jbGVhcigpO1xuICAgIH1cbiAgICB0aGlzLmRlZmVycmVkQ2FsbGJhY2tzLmNsZWFyKCk7XG4gIH1cbn1cblxuLyoqXG4gKiBJbXBsZW1lbnRzIGNvcmUgdGltaW5nIGZvciBgYWZ0ZXJSZW5kZXJgIGFuZCBgYWZ0ZXJOZXh0UmVuZGVyYCBldmVudHMuXG4gKiBEZWxlZ2F0ZXMgdG8gYW4gb3B0aW9uYWwgYEFmdGVyUmVuZGVyQ2FsbGJhY2tIYW5kbGVyYCBmb3IgaW1wbGVtZW50YXRpb24uXG4gKi9cbmV4cG9ydCBjbGFzcyBBZnRlclJlbmRlckV2ZW50TWFuYWdlciB7XG4gIC8qIEBpbnRlcm5hbCAqL1xuICBoYW5kbGVyOiBBZnRlclJlbmRlckNhbGxiYWNrSGFuZGxlcnxudWxsID0gbnVsbDtcblxuICAvKiBAaW50ZXJuYWwgKi9cbiAgaW50ZXJuYWxDYWxsYmFja3M6IFZvaWRGdW5jdGlvbltdID0gW107XG5cbiAgLyoqXG4gICAqIEV4ZWN1dGVzIGludGVybmFsIGFuZCB1c2VyLXByb3ZpZGVkIGNhbGxiYWNrcy5cbiAgICovXG4gIGV4ZWN1dGUoKTogdm9pZCB7XG4gICAgdGhpcy5leGVjdXRlSW50ZXJuYWxDYWxsYmFja3MoKTtcbiAgICB0aGlzLmhhbmRsZXI/LmV4ZWN1dGUoKTtcbiAgfVxuXG4gIGV4ZWN1dGVJbnRlcm5hbENhbGxiYWNrcygpIHtcbiAgICAvLyBOb3RlOiBpbnRlcm5hbCBjYWxsYmFja3MgcG93ZXIgYGludGVybmFsQWZ0ZXJOZXh0UmVuZGVyYC4gU2luY2UgaW50ZXJuYWwgY2FsbGJhY2tzXG4gICAgLy8gYXJlIGZhaXJseSB0cml2aWFsLCB0aGV5IGFyZSBrZXB0IHNlcGFyYXRlIHNvIHRoYXQgYEFmdGVyUmVuZGVyQ2FsbGJhY2tIYW5kbGVySW1wbGBcbiAgICAvLyBjYW4gc3RpbGwgYmUgdHJlZS1zaGFrZW4gdW5sZXNzIHVzZWQgYnkgdGhlIGFwcGxpY2F0aW9uLlxuICAgIGNvbnN0IGNhbGxiYWNrcyA9IFsuLi50aGlzLmludGVybmFsQ2FsbGJhY2tzXTtcbiAgICB0aGlzLmludGVybmFsQ2FsbGJhY2tzLmxlbmd0aCA9IDA7XG4gICAgZm9yIChjb25zdCBjYWxsYmFjayBvZiBjYWxsYmFja3MpIHtcbiAgICAgIGNhbGxiYWNrKCk7XG4gICAgfVxuICB9XG5cbiAgbmdPbkRlc3Ryb3koKSB7XG4gICAgdGhpcy5oYW5kbGVyPy5kZXN0cm95KCk7XG4gICAgdGhpcy5oYW5kbGVyID0gbnVsbDtcbiAgICB0aGlzLmludGVybmFsQ2FsbGJhY2tzLmxlbmd0aCA9IDA7XG4gIH1cblxuICAvKiogQG5vY29sbGFwc2UgKi9cbiAgc3RhdGljIMm1cHJvdiA9IC8qKiBAcHVyZU9yQnJlYWtNeUNvZGUgKi8gybXJtWRlZmluZUluamVjdGFibGUoe1xuICAgIHRva2VuOiBBZnRlclJlbmRlckV2ZW50TWFuYWdlcixcbiAgICBwcm92aWRlZEluOiAncm9vdCcsXG4gICAgZmFjdG9yeTogKCkgPT4gbmV3IEFmdGVyUmVuZGVyRXZlbnRNYW5hZ2VyKCksXG4gIH0pO1xufVxuIl19