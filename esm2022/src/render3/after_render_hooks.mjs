/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { assertNotInReactiveContext } from '../core_reactivity_export_internal';
import { assertInInjectionContext, Injector, ɵɵdefineInjectable } from '../di';
import { inject } from '../di/injector_compatibility';
import { ErrorHandler } from '../error_handler';
import { RuntimeError } from '../errors';
import { DestroyRef } from '../linker/destroy_ref';
import { assertGreaterThan } from '../util/assert';
import { NgZone } from '../zone';
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
        return { destroy() { } };
    }
    let destroy;
    const unregisterFn = injector.get(DestroyRef).onDestroy(() => destroy?.());
    const afterRenderEventManager = injector.get(AfterRenderEventManager);
    // Lazily initialize the handler implementation, if necessary. This is so that it can be
    // tree-shaken if `afterRender` and `afterNextRender` aren't used.
    const callbackHandler = afterRenderEventManager.handler ??= new AfterRenderCallbackHandlerImpl();
    const ngZone = injector.get(NgZone);
    const errorHandler = injector.get(ErrorHandler, null, { optional: true });
    const phase = options?.phase ?? AfterRenderPhase.MixedReadWrite;
    const instance = new AfterRenderCallback(ngZone, errorHandler, phase, callback);
    destroy = () => {
        callbackHandler.unregister(instance);
        unregisterFn();
    };
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
        return { destroy() { } };
    }
    let destroy;
    const unregisterFn = injector.get(DestroyRef).onDestroy(() => destroy?.());
    const afterRenderEventManager = injector.get(AfterRenderEventManager);
    // Lazily initialize the handler implementation, if necessary. This is so that it can be
    // tree-shaken if `afterRender` and `afterNextRender` aren't used.
    const callbackHandler = afterRenderEventManager.handler ??= new AfterRenderCallbackHandlerImpl();
    const ngZone = injector.get(NgZone);
    const errorHandler = injector.get(ErrorHandler, null, { optional: true });
    const phase = options?.phase ?? AfterRenderPhase.MixedReadWrite;
    const instance = new AfterRenderCallback(ngZone, errorHandler, phase, () => {
        destroy?.();
        callback();
    });
    destroy = () => {
        callbackHandler.unregister(instance);
        unregisterFn();
    };
    callbackHandler.register(instance);
    return { destroy };
}
/**
 * A wrapper around a function to be used as an after render callback.
 */
class AfterRenderCallback {
    constructor(zone, errorHandler, phase, callbackFn) {
        this.zone = zone;
        this.errorHandler = errorHandler;
        this.phase = phase;
        this.callbackFn = callbackFn;
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
    validateBegin() {
        if (this.executingCallbacks) {
            throw new RuntimeError(102 /* RuntimeErrorCode.RECURSIVE_APPLICATION_RENDER */, ngDevMode &&
                'A new render operation began before the previous operation ended. ' +
                    'Did you trigger change detection from afterRender or afterNextRender?');
        }
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
        this.renderDepth = 0;
        /* @internal */
        this.handler = null;
        /* @internal */
        this.internalCallbacks = [];
    }
    /**
     * Mark the beginning of a render operation (i.e. CD cycle).
     * Throws if called while executing callbacks.
     */
    begin() {
        this.handler?.validateBegin();
        this.renderDepth++;
    }
    /**
     * Mark the end of a render operation. Callbacks will be
     * executed if there are no more pending operations.
     */
    end() {
        ngDevMode && assertGreaterThan(this.renderDepth, 0, 'renderDepth must be greater than 0');
        this.renderDepth--;
        if (this.renderDepth === 0) {
            // Note: internal callbacks power `internalAfterNextRender`. Since internal callbacks
            // are fairly trivial, they are kept separate so that `AfterRenderCallbackHandlerImpl`
            // can still be tree-shaken unless used by the application.
            for (const callback of this.internalCallbacks) {
                callback();
            }
            this.internalCallbacks.length = 0;
            this.handler?.execute();
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWZ0ZXJfcmVuZGVyX2hvb2tzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9hZnRlcl9yZW5kZXJfaG9va3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLDBCQUEwQixFQUFDLE1BQU0sb0NBQW9DLENBQUM7QUFDOUUsT0FBTyxFQUFDLHdCQUF3QixFQUFFLFFBQVEsRUFBRSxrQkFBa0IsRUFBQyxNQUFNLE9BQU8sQ0FBQztBQUM3RSxPQUFPLEVBQUMsTUFBTSxFQUFDLE1BQU0sOEJBQThCLENBQUM7QUFDcEQsT0FBTyxFQUFDLFlBQVksRUFBQyxNQUFNLGtCQUFrQixDQUFDO0FBQzlDLE9BQU8sRUFBQyxZQUFZLEVBQW1CLE1BQU0sV0FBVyxDQUFDO0FBQ3pELE9BQU8sRUFBQyxVQUFVLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUNqRCxPQUFPLEVBQUMsaUJBQWlCLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUNqRCxPQUFPLEVBQUMsTUFBTSxFQUFDLE1BQU0sU0FBUyxDQUFDO0FBRS9CLE9BQU8sRUFBQyxpQkFBaUIsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBRXBEOzs7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBbUJHO0FBQ0gsTUFBTSxDQUFOLElBQVksZ0JBeUNYO0FBekNELFdBQVksZ0JBQWdCO0lBQzFCOzs7Ozs7Ozs7Ozs7T0FZRztJQUNILGlFQUFTLENBQUE7SUFFVDs7O09BR0c7SUFDSCx5REFBSyxDQUFBO0lBRUw7Ozs7Ozs7Ozs7O09BV0c7SUFDSCwyRUFBYyxDQUFBO0lBRWQ7OztPQUdHO0lBQ0gsdURBQUksQ0FBQTtBQUNOLENBQUMsRUF6Q1csZ0JBQWdCLEtBQWhCLGdCQUFnQixRQXlDM0I7QUFvREQ7Ozs7Ozs7Ozs7Ozs7O0dBY0c7QUFDSCxNQUFNLFVBQVUsdUJBQXVCLENBQ25DLFFBQXNCLEVB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Q0FBQyxPQUFPLEVBQUUsYUFBYSxFQUFFLENBQUM7UUFDOUIsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO0lBQ3JCLENBQUM7SUFFRDs7O09BR0c7SUFDSCxHQUFHO1FBQ0QsU0FBUyxJQUFJLGlCQUFpQixDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQyxFQUFFLG9DQUFvQyxDQUFDLENBQUM7UUFDMUYsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO1FBRW5CLElBQUksSUFBSSxDQUFDLFdBQVcsS0FBSyxDQUFDLEVBQUU7WUFDMUIscUZBQXFGO1lBQ3JGLHNGQUFzRjtZQUN0RiwyREFBMkQ7WUFDM0QsS0FBSyxNQUFNLFFBQVEsSUFBSSxJQUFJLENBQUMsaUJBQWlCLEVBQUU7Z0JBQzdDLFFBQVEsRUFBRSxDQUFDO2FBQ1o7WUFDRCxJQUFJLENBQUMsaUJBQWlCLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQztZQUNsQyxJQUFJLENBQUMsT0FBTyxFQUFFLE9BQU8sRUFBRSxDQUFDO1NBQ3pCO0lBQ0gsQ0FBQztJQUVELFdBQVc7UUFDVCxJQUFJLENBQUMsT0FBTyxFQUFFLE9BQU8sRUFBRSxDQUFDO1FBQ3hCLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDO1FBQ3BCLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO0lBQ3BDLENBQUM7SUFFRCxrQkFBa0I7YUFDWCxVQUFLLEdBQTZCLGtCQUFrQixDQUFDO1FBQzFELEtBQUssRUFBRSx1QkFBdUI7UUFDOUIsVUFBVSxFQUFFLE1BQU07UUFDbEIsT0FBTyxFQUFFLEdBQUcsRUFBRSxDQUFDLElBQUksdUJBQXVCLEVBQUU7S0FDN0MsQ0FBQyxBQUpVLENBSVQiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHthc3NlcnROb3RJblJlYWN0aXZlQ29udGV4dH0gZnJvbSAnLi4vY29yZV9yZWFjdGl2aXR5X2V4cG9ydF9pbnRlcm5hbCc7XG5pbXBvcnQge2Fzc2VydEluSW5qZWN0aW9uQ29udGV4dCwgSW5qZWN0b3IsIMm1ybVkZWZpbmVJbmplY3RhYmxlfSBmcm9tICcuLi9kaSc7XG5pbXBvcnQge2luamVjdH0gZnJvbSAnLi4vZGkvaW5qZWN0b3JfY29tcGF0aWJpbGl0eSc7XG5pbXBvcnQge0Vycm9ySGFuZGxlcn0gZnJvbSAnLi4vZXJyb3JfaGFuZGxlcic7XG5pbXBvcnQge1J1bnRpbWVFcnJvciwgUnVudGltZUVycm9yQ29kZX0gZnJvbSAnLi4vZXJyb3JzJztcbmltcG9ydCB7RGVzdHJveVJlZn0gZnJvbSAnLi4vbGlua2VyL2Rlc3Ryb3lfcmVmJztcbmltcG9ydCB7YXNzZXJ0R3JlYXRlclRoYW59IGZyb20gJy4uL3V0aWwvYXNzZXJ0JztcbmltcG9ydCB7Tmdab25lfSBmcm9tICcuLi96b25lJztcblxuaW1wb3J0IHtpc1BsYXRmb3JtQnJvd3Nlcn0gZnJvbSAnLi91dGlsL21pc2NfdXRpbHMnO1xuXG4vKipcbiAqIFRoZSBwaGFzZSB0byBydW4gYW4gYGFmdGVyUmVuZGVyYCBvciBgYWZ0ZXJOZXh0UmVuZGVyYCBjYWxsYmFjayBpbi5cbiAqXG4gKiBDYWxsYmFja3MgaW4gdGhlIHNhbWUgcGhhc2UgcnVuIGluIHRoZSBvcmRlciB0aGV5IGFyZSByZWdpc3RlcmVkLiBQaGFzZXMgcnVuIGluIHRoZVxuICogZm9sbG93aW5nIG9yZGVyIGFmdGVyIGVhY2ggcmVuZGVyOlxuICpcbiAqICAgMS4gYEFmdGVyUmVuZGVyUGhhc2UuRWFybHlSZWFkYFxuICogICAyLiBgQWZ0ZXJSZW5kZXJQaGFzZS5Xcml0ZWBcbiAqICAgMy4gYEFmdGVyUmVuZGVyUGhhc2UuTWl4ZWRSZWFkV3JpdGVgXG4gKiAgIDQuIGBBZnRlclJlbmRlclBoYXNlLlJlYWRgXG4gKlxuICogQW5ndWxhciBpcyB1bmFibGUgdG8gdmVyaWZ5IG9yIGVuZm9yY2UgdGhhdCBwaGFzZXMgYXJlIHVzZWQgY29ycmVjdGx5LCBhbmQgaW5zdGVhZFxuICogcmVsaWVzIG9uIGVhY2ggZGV2ZWxvcGVyIHRvIGZvbGxvdyB0aGUgZ3VpZGVsaW5lcyBkb2N1bWVudGVkIGZvciBlYWNoIHZhbHVlIGFuZFxuICogY2FyZWZ1bGx5IGNob29zZSB0aGUgYXBwcm9wcmlhdGUgb25lLCByZWZhY3RvcmluZyB0aGVpciBjb2RlIGlmIG5lY2Vzc2FyeS4gQnkgZG9pbmdcbiAqIHNvLCBBbmd1bGFyIGlzIGJldHRlciBhYmxlIHRvIG1pbmltaXplIHRoZSBwZXJmb3JtYW5jZSBkZWdyYWRhdGlvbiBhc3NvY2lhdGVkIHdpdGhcbiAqIG1hbnVhbCBET00gYWNjZXNzLCBlbnN1cmluZyB0aGUgYmVzdCBleHBlcmllbmNlIGZvciB0aGUgZW5kIHVzZXJzIG9mIHlvdXIgYXBwbGljYXRpb25cbiAqIG9yIGxpYnJhcnkuXG4gKlxuICogQGRldmVsb3BlclByZXZpZXdcbiAqL1xuZXhwb3J0IGVudW0gQWZ0ZXJSZW5kZXJQaGFzZSB7XG4gIC8qKlxuICAgKiBVc2UgYEFmdGVyUmVuZGVyUGhhc2UuRWFybHlSZWFkYCBmb3IgY2FsbGJhY2tzIHRoYXQgb25seSBuZWVkIHRvICoqcmVhZCoqIGZyb20gdGhlXG4gICAqIERPTSBiZWZvcmUgYSBzdWJzZXF1ZW50IGBBZnRlclJlbmRlclBoYXNlLldyaXRlYCBjYWxsYmFjaywgZm9yIGV4YW1wbGUgdG8gcGVyZm9ybVxuICAgKiBjdXN0b20gbGF5b3V0IHRoYXQgdGhlIGJyb3dzZXIgZG9lc24ndCBuYXRpdmVseSBzdXBwb3J0LiAqKk5ldmVyKiogdXNlIHRoaXMgcGhhc2VcbiAgICogZm9yIGNhbGxiYWNrcyB0aGF0IGNhbiB3cml0ZSB0byB0aGUgRE9NIG9yIHdoZW4gYEFmdGVyUmVuZGVyUGhhc2UuUmVhZGAgaXMgYWRlcXVhdGUuXG4gICAqXG4gICAqIDxkaXYgY2xhc3M9XCJhbGVydCBpcy1pbXBvcnRhbnRcIj5cbiAgICpcbiAgICogVXNpbmcgdGhpcyB2YWx1ZSBjYW4gZGVncmFkZSBwZXJmb3JtYW5jZS5cbiAgICogSW5zdGVhZCwgcHJlZmVyIHVzaW5nIGJ1aWx0LWluIGJyb3dzZXIgZnVuY3Rpb25hbGl0eSB3aGVuIHBvc3NpYmxlLlxuICAgKlxuICAgKiA8L2Rpdj5cbiAgICovXG4gIEVhcmx5UmVhZCxcblxuICAvKipcbiAgICogVXNlIGBBZnRlclJlbmRlclBoYXNlLldyaXRlYCBmb3IgY2FsbGJhY2tzIHRoYXQgb25seSAqKndyaXRlKiogdG8gdGhlIERPTS4gKipOZXZlcioqXG4gICAqIHVzZSB0aGlzIHBoYXNlIGZvciBjYWxsYmFja3MgdGhhdCBjYW4gcmVhZCBmcm9tIHRoZSBET00uXG4gICAqL1xuICBXcml0ZSxcblxuICAvKipcbiAgICogVXNlIGBBZnRlclJlbmRlclBoYXNlLk1peGVkUmVhZFdyaXRlYCBmb3IgY2FsbGJhY2tzIHRoYXQgcmVhZCBmcm9tIG9yIHdyaXRlIHRvIHRoZVxuICAgKiBET00sIHRoYXQgaGF2ZW4ndCBiZWVuIHJlZmFjdG9yZWQgdG8gdXNlIGEgZGlmZmVyZW50IHBoYXNlLiAqKk5ldmVyKiogdXNlIHRoaXMgcGhhc2VcbiAgICogZm9yIGNhbGxiYWNrcyB0aGF0IGNhbiB1c2UgYSBkaWZmZXJlbnQgcGhhc2UgaW5zdGVhZC5cbiAgICpcbiAgICogPGRpdiBjbGFzcz1cImFsZXJ0IGlzLWNyaXRpY2FsXCI+XG4gICAqXG4gICAqIFVzaW5nIHRoaXMgdmFsdWUgY2FuICoqc2lnbmlmaWNhbnRseSoqIGRlZ3JhZGUgcGVyZm9ybWFuY2UuXG4gICAqIEluc3RlYWQsIHByZWZlciByZWZhY3RvcmluZyBpbnRvIG11bHRpcGxlIGNhbGxiYWNrcyB1c2luZyBhIG1vcmUgc3BlY2lmaWMgcGhhc2UuXG4gICAqXG4gICAqIDwvZGl2PlxuICAgKi9cbiAgTWl4ZWRSZWFkV3JpdGUsXG5cbiAgLyoqXG4gICAqIFVzZSBgQWZ0ZXJSZW5kZXJQaGFzZS5SZWFkYCBmb3IgY2FsbGJhY2tzIHRoYXQgb25seSAqKnJlYWQqKiBmcm9tIHRoZSBET00uICoqTmV2ZXIqKlxuICAgKiB1c2UgdGhpcyBwaGFzZSBmb3IgY2FsbGJhY2tzIHRoYXQgY2FuIHdyaXRlIHRvIHRoZSBET00uXG4gICAqL1xuICBSZWFkLFxufVxuXG4vKipcbiAqIE9wdGlvbnMgcGFzc2VkIHRvIGBhZnRlclJlbmRlcmAgYW5kIGBhZnRlck5leHRSZW5kZXJgLlxuICpcbiAqIEBkZXZlbG9wZXJQcmV2aWV3XG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgQWZ0ZXJSZW5kZXJPcHRpb25zIHtcbiAgLyoqXG4gICAqIFRoZSBgSW5qZWN0b3JgIHRvIHVzZSBkdXJpbmcgY3JlYXRpb24uXG4gICAqXG4gICAqIElmIHRoaXMgaXMgbm90IHByb3ZpZGVkLCB0aGUgY3VycmVudCBpbmplY3Rpb24gY29udGV4dCB3aWxsIGJlIHVzZWQgaW5zdGVhZCAodmlhIGBpbmplY3RgKS5cbiAgICovXG4gIGluamVjdG9yPzogSW5qZWN0b3I7XG5cbiAgLyoqXG4gICAqIFRoZSBwaGFzZSB0aGUgY2FsbGJhY2sgc2hvdWxkIGJlIGludm9rZWQgaW4uXG4gICAqXG4gICAqIDxkaXYgY2xhc3M9XCJhbGVydCBpcy1jcml0aWNhbFwiPlxuICAgKlxuICAgKiBEZWZhdWx0cyB0byBgQWZ0ZXJSZW5kZXJQaGFzZS5NaXhlZFJlYWRXcml0ZWAuIFlvdSBzaG91bGQgY2hvb3NlIGEgbW9yZSBzcGVjaWZpY1xuICAgKiBwaGFzZSBpbnN0ZWFkLiBTZWUgYEFmdGVyUmVuZGVyUGhhc2VgIGZvciBtb3JlIGluZm9ybWF0aW9uLlxuICAgKlxuICAgKiA8L2Rpdj5cbiAgICovXG4gIHBoYXNlPzogQWZ0ZXJSZW5kZXJQaGFzZTtcbn1cblxuLyoqXG4gKiBBIGNhbGxiYWNrIHRoYXQgcnVucyBhZnRlciByZW5kZXIuXG4gKlxuICogQGRldmVsb3BlclByZXZpZXdcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBBZnRlclJlbmRlclJlZiB7XG4gIC8qKlxuICAgKiBTaHV0IGRvd24gdGhlIGNhbGxiYWNrLCBwcmV2ZW50aW5nIGl0IGZyb20gYmVpbmcgY2FsbGVkIGFnYWluLlxuICAgKi9cbiAgZGVzdHJveSgpOiB2b2lkO1xufVxuXG4vKipcbiAqIE9wdGlvbnMgcGFzc2VkIHRvIGBpbnRlcm5hbEFmdGVyTmV4dFJlbmRlcmAuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgSW50ZXJuYWxBZnRlck5leHRSZW5kZXJPcHRpb25zIHtcbiAgLyoqXG4gICAqIFRoZSBgSW5qZWN0b3JgIHRvIHVzZSBkdXJpbmcgY3JlYXRpb24uXG4gICAqXG4gICAqIElmIHRoaXMgaXMgbm90IHByb3ZpZGVkLCB0aGUgY3VycmVudCBpbmplY3Rpb24gY29udGV4dCB3aWxsIGJlIHVzZWQgaW5zdGVhZCAodmlhIGBpbmplY3RgKS5cbiAgICovXG4gIGluamVjdG9yPzogSW5qZWN0b3I7XG59XG5cbi8qKlxuICogUmVnaXN0ZXIgYSBjYWxsYmFjayB0byBydW4gb25jZSBiZWZvcmUgYW55IHVzZXJzcGFjZSBgYWZ0ZXJSZW5kZXJgIG9yXG4gKiBgYWZ0ZXJOZXh0UmVuZGVyYCBjYWxsYmFja3MuXG4gKlxuICogVGhpcyBmdW5jdGlvbiBzaG91bGQgYWxtb3N0IGFsd2F5cyBiZSB1c2VkIGluc3RlYWQgb2YgYGFmdGVyUmVuZGVyYCBvclxuICogYGFmdGVyTmV4dFJlbmRlcmAgZm9yIGltcGxlbWVudGluZyBmcmFtZXdvcmsgZnVuY3Rpb25hbGl0eS4gQ29uc2lkZXI6XG4gKlxuICogICAxLikgYEFmdGVyUmVuZGVyUGhhc2UuRWFybHlSZWFkYCBpcyBpbnRlbmRlZCB0byBiZSB1c2VkIGZvciBpbXBsZW1lbnRpbmdcbiAqICAgICAgIGN1c3RvbSBsYXlvdXQuIElmIHRoZSBmcmFtZXdvcmsgaXRzZWxmIG11dGF0ZXMgdGhlIERPTSBhZnRlciAqYW55KlxuICogICAgICAgYEFmdGVyUmVuZGVyUGhhc2UuRWFybHlSZWFkYCBjYWxsYmFja3MgYXJlIHJ1biwgdGhlIHBoYXNlIGNhbiBub1xuICogICAgICAgbG9uZ2VyIHJlbGlhYmx5IHNlcnZlIGl0cyBwdXJwb3NlLlxuICpcbiAqICAgMi4pIEltcG9ydGluZyBgYWZ0ZXJSZW5kZXJgIGluIHRoZSBmcmFtZXdvcmsgY2FuIHJlZHVjZSB0aGUgYWJpbGl0eSBmb3IgaXRcbiAqICAgICAgIHRvIGJlIHRyZWUtc2hha2VuLCBhbmQgdGhlIGZyYW1ld29yayBzaG91bGRuJ3QgbmVlZCBtdWNoIG9mIHRoZSBiZWhhdmlvci5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGludGVybmFsQWZ0ZXJOZXh0UmVuZGVyKFxuICAgIGNhbGxiYWNrOiBWb2lkRnVuY3Rpb24sIG9wdGlvbnM/OiBJbnRlcm5hbEFmdGVyTmV4dFJlbmRlck9wdGlvbnMpIHtcbiAgY29uc3QgaW5qZWN0b3IgPSBvcHRpb25zPy5pbmplY3RvciA/PyBpbmplY3QoSW5qZWN0b3IpO1xuICBjb25zdCBhZnRlclJlbmRlckV2ZW50TWFuYWdlciA9IGluamVjdG9yLmdldChBZnRlclJlbmRlckV2ZW50TWFuYWdlcik7XG4gIGFmdGVyUmVuZGVyRXZlbnRNYW5hZ2VyLmludGVybmFsQ2FsbGJhY2tzLnB1c2goY2FsbGJhY2spO1xufVxuXG4vKipcbiAqIFJlZ2lzdGVyIGEgY2FsbGJhY2sgdG8gYmUgaW52b2tlZCBlYWNoIHRpbWUgdGhlIGFwcGxpY2F0aW9uXG4gKiBmaW5pc2hlcyByZW5kZXJpbmcuXG4gKlxuICogPGRpdiBjbGFzcz1cImFsZXJ0IGlzLWNyaXRpY2FsXCI+XG4gKlxuICogWW91IHNob3VsZCBhbHdheXMgZXhwbGljaXRseSBzcGVjaWZ5IGEgbm9uLWRlZmF1bHQgW3BoYXNlXShhcGkvY29yZS9BZnRlclJlbmRlclBoYXNlKSwgb3IgeW91XG4gKiByaXNrIHNpZ25pZmljYW50IHBlcmZvcm1hbmNlIGRlZ3JhZGF0aW9uLlxuICpcbiAqIDwvZGl2PlxuICpcbiAqIE5vdGUgdGhhdCB0aGUgY2FsbGJhY2sgd2lsbCBydW5cbiAqIC0gaW4gdGhlIG9yZGVyIGl0IHdhcyByZWdpc3RlcmVkXG4gKiAtIG9uY2UgcGVyIHJlbmRlclxuICogLSBvbiBicm93c2VyIHBsYXRmb3JtcyBvbmx5XG4gKlxuICogPGRpdiBjbGFzcz1cImFsZXJ0IGlzLWltcG9ydGFudFwiPlxuICpcbiAqIENvbXBvbmVudHMgYXJlIG5vdCBndWFyYW50ZWVkIHRvIGJlIFtoeWRyYXRlZF0oZ3VpZGUvaHlkcmF0aW9uKSBiZWZvcmUgdGhlIGNhbGxiYWNrIHJ1bnMuXG4gKiBZb3UgbXVzdCB1c2UgY2F1dGlvbiB3aGVuIGRpcmVjdGx5IHJlYWRpbmcgb3Igd3JpdGluZyB0aGUgRE9NIGFuZCBsYXlvdXQuXG4gKlxuICogPC9kaXY+XG4gKlxuICogQHBhcmFtIGNhbGxiYWNrIEEgY2FsbGJhY2sgZnVuY3Rpb24gdG8gcmVnaXN0ZXJcbiAqXG4gKiBAdXNhZ2VOb3Rlc1xuICpcbiAqIFVzZSBgYWZ0ZXJSZW5kZXJgIHRvIHJlYWQgb3Igd3JpdGUgdGhlIERPTSBhZnRlciBlYWNoIHJlbmRlci5cbiAqXG4gKiAjIyMgRXhhbXBsZVxuICogYGBgdHNcbiAqIEBDb21wb25lbnQoe1xuICogICBzZWxlY3RvcjogJ215LWNtcCcsXG4gKiAgIHRlbXBsYXRlOiBgPHNwYW4gI2NvbnRlbnQ+e3sgLi4uIH19PC9zcGFuPmAsXG4gKiB9KVxuICogZXhwb3J0IGNsYXNzIE15Q29tcG9uZW50IHtcbiAqICAgQFZpZXdDaGlsZCgnY29udGVudCcpIGNvbnRlbnRSZWY6IEVsZW1lbnRSZWY7XG4gKlxuICogICBjb25zdHJ1Y3RvcigpIHtcbiAqICAgICBhZnRlclJlbmRlcigoKSA9PiB7XG4gKiAgICAgICBjb25zb2xlLmxvZygnY29udGVudCBoZWlnaHQ6ICcgKyB0aGlzLmNvbnRlbnRSZWYubmF0aXZlRWxlbWVudC5zY3JvbGxIZWlnaHQpO1xuICogICAgIH0sIHtwaGFzZTogQWZ0ZXJSZW5kZXJQaGFzZS5SZWFkfSk7XG4gKiAgIH1cbiAqIH1cbiAqIGBgYFxuICpcbiAqIEBkZXZlbG9wZXJQcmV2aWV3XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhZnRlclJlbmRlcihjYWxsYmFjazogVm9pZEZ1bmN0aW9uLCBvcHRpb25zPzogQWZ0ZXJSZW5kZXJPcHRpb25zKTogQWZ0ZXJSZW5kZXJSZWYge1xuICBuZ0Rldk1vZGUgJiZcbiAgICAgIGFzc2VydE5vdEluUmVhY3RpdmVDb250ZXh0KFxuICAgICAgICAgIGFmdGVyUmVuZGVyLFxuICAgICAgICAgICdDYWxsIGBhZnRlclJlbmRlcmAgb3V0c2lkZSBvZiBhIHJlYWN0aXZlIGNvbnRleHQuIEZvciBleGFtcGxlLCBzY2hlZHVsZSB0aGUgcmVuZGVyICcgK1xuICAgICAgICAgICAgICAnY2FsbGJhY2sgaW5zaWRlIHRoZSBjb21wb25lbnQgY29uc3RydWN0b3JgLicpO1xuXG4gICFvcHRpb25zICYmIGFzc2VydEluSW5qZWN0aW9uQ29udGV4dChhZnRlclJlbmRlcik7XG4gIGNvbnN0IGluamVjdG9yID0gb3B0aW9ucz8uaW5qZWN0b3IgPz8gaW5qZWN0KEluamVjdG9yKTtcblxuICBpZiAoIWlzUGxhdGZvcm1Ccm93c2VyKGluamVjdG9yKSkge1xuICAgIHJldHVybiB7ZGVzdHJveSgpIHt9fTtcbiAgfVxuXG4gIGxldCBkZXN0cm95OiBWb2lkRnVuY3Rpb258dW5kZWZpbmVkO1xuICBjb25zdCB1bnJlZ2lzdGVyRm4gPSBpbmplY3Rvci5nZXQoRGVzdHJveVJlZikub25EZXN0cm95KCgpID0+IGRlc3Ryb3k/LigpKTtcbiAgY29uc3QgYWZ0ZXJSZW5kZXJFdmVudE1hbmFnZXIgPSBpbmplY3Rvci5nZXQoQWZ0ZXJSZW5kZXJFdmVudE1hbmFnZXIpO1xuICAvLyBMYXppbHkgaW5pdGlhbGl6ZSB0aGUgaGFuZGxlciBpbXBsZW1lbnRhdGlvbiwgaWYgbmVjZXNzYXJ5LiBUaGlzIGlzIHNvIHRoYXQgaXQgY2FuIGJlXG4gIC8vIHRyZWUtc2hha2VuIGlmIGBhZnRlclJlbmRlcmAgYW5kIGBhZnRlck5leHRSZW5kZXJgIGFyZW4ndCB1c2VkLlxuICBjb25zdCBjYWxsYmFja0hhbmRsZXIgPSBhZnRlclJlbmRlckV2ZW50TWFuYWdlci5oYW5kbGVyID8/PSBuZXcgQWZ0ZXJSZW5kZXJDYWxsYmFja0hhbmRsZXJJbXBsKCk7XG4gIGNvbnN0IG5nWm9uZSA9IGluamVjdG9yLmdldChOZ1pvbmUpO1xuICBjb25zdCBlcnJvckhhbmRsZXIgPSBpbmplY3Rvci5nZXQoRXJyb3JIYW5kbGVyLCBudWxsLCB7b3B0aW9uYWw6IHRydWV9KTtcbiAgY29uc3QgcGhhc2UgPSBvcHRpb25zPy5waGFzZSA/PyBBZnRlclJlbmRlclBoYXNlLk1peGVkUmVhZFdyaXRlO1xuICBjb25zdCBpbnN0YW5jZSA9IG5ldyBBZnRlclJlbmRlckNhbGxiYWNrKG5nWm9uZSwgZXJyb3JIYW5kbGVyLCBwaGFzZSwgY2FsbGJhY2spO1xuXG4gIGRlc3Ryb3kgPSAoKSA9PiB7XG4gICAgY2FsbGJhY2tIYW5kbGVyLnVucmVnaXN0ZXIoaW5zdGFuY2UpO1xuICAgIHVucmVnaXN0ZXJGbigpO1xuICB9O1xuICBjYWxsYmFja0hhbmRsZXIucmVnaXN0ZXIoaW5zdGFuY2UpO1xuICByZXR1cm4ge2Rlc3Ryb3l9O1xufVxuXG4vKipcbiAqIFJlZ2lzdGVyIGEgY2FsbGJhY2sgdG8gYmUgaW52b2tlZCB0aGUgbmV4dCB0aW1lIHRoZSBhcHBsaWNhdGlvblxuICogZmluaXNoZXMgcmVuZGVyaW5nLlxuICpcbiAqIDxkaXYgY2xhc3M9XCJhbGVydCBpcy1jcml0aWNhbFwiPlxuICpcbiAqIFlvdSBzaG91bGQgYWx3YXlzIGV4cGxpY2l0bHkgc3BlY2lmeSBhIG5vbi1kZWZhdWx0IFtwaGFzZV0oYXBpL2NvcmUvQWZ0ZXJSZW5kZXJQaGFzZSksIG9yIHlvdVxuICogcmlzayBzaWduaWZpY2FudCBwZXJmb3JtYW5jZSBkZWdyYWRhdGlvbi5cbiAqXG4gKiA8L2Rpdj5cbiAqXG4gKiBOb3RlIHRoYXQgdGhlIGNhbGxiYWNrIHdpbGwgcnVuXG4gKiAtIGluIHRoZSBvcmRlciBpdCB3YXMgcmVnaXN0ZXJlZFxuICogLSBvbiBicm93c2VyIHBsYXRmb3JtcyBvbmx5XG4gKlxuICogPGRpdiBjbGFzcz1cImFsZXJ0IGlzLWltcG9ydGFudFwiPlxuICpcbiAqIENvbXBvbmVudHMgYXJlIG5vdCBndWFyYW50ZWVkIHRvIGJlIFtoeWRyYXRlZF0oZ3VpZGUvaHlkcmF0aW9uKSBiZWZvcmUgdGhlIGNhbGxiYWNrIHJ1bnMuXG4gKiBZb3UgbXVzdCB1c2UgY2F1dGlvbiB3aGVuIGRpcmVjdGx5IHJlYWRpbmcgb3Igd3JpdGluZyB0aGUgRE9NIGFuZCBsYXlvdXQuXG4gKlxuICogPC9kaXY+XG4gKlxuICogQHBhcmFtIGNhbGxiYWNrIEEgY2FsbGJhY2sgZnVuY3Rpb24gdG8gcmVnaXN0ZXJcbiAqXG4gKiBAdXNhZ2VOb3Rlc1xuICpcbiAqIFVzZSBgYWZ0ZXJOZXh0UmVuZGVyYCB0byByZWFkIG9yIHdyaXRlIHRoZSBET00gb25jZSxcbiAqIGZvciBleGFtcGxlIHRvIGluaXRpYWxpemUgYSBub24tQW5ndWxhciBsaWJyYXJ5LlxuICpcbiAqICMjIyBFeGFtcGxlXG4gKiBgYGB0c1xuICogQENvbXBvbmVudCh7XG4gKiAgIHNlbGVjdG9yOiAnbXktY2hhcnQtY21wJyxcbiAqICAgdGVtcGxhdGU6IGA8ZGl2ICNjaGFydD57eyAuLi4gfX08L2Rpdj5gLFxuICogfSlcbiAqIGV4cG9ydCBjbGFzcyBNeUNoYXJ0Q21wIHtcbiAqICAgQFZpZXdDaGlsZCgnY2hhcnQnKSBjaGFydFJlZjogRWxlbWVudFJlZjtcbiAqICAgY2hhcnQ6IE15Q2hhcnR8bnVsbDtcbiAqXG4gKiAgIGNvbnN0cnVjdG9yKCkge1xuICogICAgIGFmdGVyTmV4dFJlbmRlcigoKSA9PiB7XG4gKiAgICAgICB0aGlzLmNoYXJ0ID0gbmV3IE15Q2hhcnQodGhpcy5jaGFydFJlZi5uYXRpdmVFbGVtZW50KTtcbiAqICAgICB9LCB7cGhhc2U6IEFmdGVyUmVuZGVyUGhhc2UuV3JpdGV9KTtcbiAqICAgfVxuICogfVxuICogYGBgXG4gKlxuICogQGRldmVsb3BlclByZXZpZXdcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFmdGVyTmV4dFJlbmRlcihcbiAgICBjYWxsYmFjazogVm9pZEZ1bmN0aW9uLCBvcHRpb25zPzogQWZ0ZXJSZW5kZXJPcHRpb25zKTogQWZ0ZXJSZW5kZXJSZWYge1xuICAhb3B0aW9ucyAmJiBhc3NlcnRJbkluamVjdGlvbkNvbnRleHQoYWZ0ZXJOZXh0UmVuZGVyKTtcbiAgY29uc3QgaW5qZWN0b3IgPSBvcHRpb25zPy5pbmplY3RvciA/PyBpbmplY3QoSW5qZWN0b3IpO1xuXG4gIGlmICghaXNQbGF0Zm9ybUJyb3dzZXIoaW5qZWN0b3IpKSB7XG4gICAgcmV0dXJuIHtkZXN0cm95KCkge319O1xuICB9XG5cbiAgbGV0IGRlc3Ryb3k6IFZvaWRGdW5jdGlvbnx1bmRlZmluZWQ7XG4gIGNvbnN0IHVucmVnaXN0ZXJGbiA9IGluamVjdG9yLmdldChEZXN0cm95UmVmKS5vbkRlc3Ryb3koKCkgPT4gZGVzdHJveT8uKCkpO1xuICBjb25zdCBhZnRlclJlbmRlckV2ZW50TWFuYWdlciA9IGluamVjdG9yLmdldChBZnRlclJlbmRlckV2ZW50TWFuYWdlcik7XG4gIC8vIExhemlseSBpbml0aWFsaXplIHRoZSBoYW5kbGVyIGltcGxlbWVudGF0aW9uLCBpZiBuZWNlc3NhcnkuIFRoaXMgaXMgc28gdGhhdCBpdCBjYW4gYmVcbiAgLy8gdHJlZS1zaGFrZW4gaWYgYGFmdGVyUmVuZGVyYCBhbmQgYGFmdGVyTmV4dFJlbmRlcmAgYXJlbid0IHVzZWQuXG4gIGNvbnN0IGNhbGxiYWNrSGFuZGxlciA9IGFmdGVyUmVuZGVyRXZlbnRNYW5hZ2VyLmhhbmRsZXIgPz89IG5ldyBBZnRlclJlbmRlckNhbGxiYWNrSGFuZGxlckltcGwoKTtcbiAgY29uc3Qgbmdab25lID0gaW5qZWN0b3IuZ2V0KE5nWm9uZSk7XG4gIGNvbnN0IGVycm9ySGFuZGxlciA9IGluamVjdG9yLmdldChFcnJvckhhbmRsZXIsIG51bGwsIHtvcHRpb25hbDogdHJ1ZX0pO1xuICBjb25zdCBwaGFzZSA9IG9wdGlvbnM/LnBoYXNlID8/IEFmdGVyUmVuZGVyUGhhc2UuTWl4ZWRSZWFkV3JpdGU7XG4gIGNvbnN0IGluc3RhbmNlID0gbmV3IEFmdGVyUmVuZGVyQ2FsbGJhY2sobmdab25lLCBlcnJvckhhbmRsZXIsIHBoYXNlLCAoKSA9PiB7XG4gICAgZGVzdHJveT8uKCk7XG4gICAgY2FsbGJhY2soKTtcbiAgfSk7XG5cbiAgZGVzdHJveSA9ICgpID0+IHtcbiAgICBjYWxsYmFja0hhbmRsZXIudW5yZWdpc3RlcihpbnN0YW5jZSk7XG4gICAgdW5yZWdpc3RlckZuKCk7XG4gIH07XG4gIGNhbGxiYWNrSGFuZGxlci5yZWdpc3RlcihpbnN0YW5jZSk7XG4gIHJldHVybiB7ZGVzdHJveX07XG59XG5cbi8qKlxuICogQSB3cmFwcGVyIGFyb3VuZCBhIGZ1bmN0aW9uIHRvIGJlIHVzZWQgYXMgYW4gYWZ0ZXIgcmVuZGVyIGNhbGxiYWNrLlxuICovXG5jbGFzcyBBZnRlclJlbmRlckNhbGxiYWNrIHtcbiAgY29uc3RydWN0b3IoXG4gICAgICBwcml2YXRlIHpvbmU6IE5nWm9uZSwgcHJpdmF0ZSBlcnJvckhhbmRsZXI6IEVycm9ySGFuZGxlcnxudWxsLFxuICAgICAgcHVibGljIHJlYWRvbmx5IHBoYXNlOiBBZnRlclJlbmRlclBoYXNlLCBwcml2YXRlIGNhbGxiYWNrRm46IFZvaWRGdW5jdGlvbikge31cblxuICBpbnZva2UoKSB7XG4gICAgdHJ5IHtcbiAgICAgIHRoaXMuem9uZS5ydW5PdXRzaWRlQW5ndWxhcih0aGlzLmNhbGxiYWNrRm4pO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgdGhpcy5lcnJvckhhbmRsZXI/LmhhbmRsZUVycm9yKGVycik7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogSW1wbGVtZW50cyBgYWZ0ZXJSZW5kZXJgIGFuZCBgYWZ0ZXJOZXh0UmVuZGVyYCBjYWxsYmFjayBoYW5kbGVyIGxvZ2ljLlxuICovXG5pbnRlcmZhY2UgQWZ0ZXJSZW5kZXJDYWxsYmFja0hhbmRsZXIge1xuICAvKipcbiAgICogVmFsaWRhdGUgdGhhdCBpdCdzIHNhZmUgZm9yIGEgcmVuZGVyIG9wZXJhdGlvbiB0byBiZWdpbixcbiAgICogdGhyb3dpbmcgaWYgbm90LiBOb3QgZ3VhcmFudGVlZCB0byBiZSBjYWxsZWQgaWYgYSByZW5kZXJcbiAgICogb3BlcmF0aW9uIGlzIHN0YXJ0ZWQgYmVmb3JlIGhhbmRsZXIgd2FzIHJlZ2lzdGVyZWQuXG4gICAqL1xuICB2YWxpZGF0ZUJlZ2luKCk6IHZvaWQ7XG5cbiAgLyoqXG4gICAqIFJlZ2lzdGVyIGEgbmV3IGNhbGxiYWNrLlxuICAgKi9cbiAgcmVnaXN0ZXIoY2FsbGJhY2s6IEFmdGVyUmVuZGVyQ2FsbGJhY2spOiB2b2lkO1xuXG4gIC8qKlxuICAgKiBVbnJlZ2lzdGVyIGFuIGV4aXN0aW5nIGNhbGxiYWNrLlxuICAgKi9cbiAgdW5yZWdpc3RlcihjYWxsYmFjazogQWZ0ZXJSZW5kZXJDYWxsYmFjayk6IHZvaWQ7XG5cbiAgLyoqXG4gICAqIEV4ZWN1dGUgY2FsbGJhY2tzLlxuICAgKi9cbiAgZXhlY3V0ZSgpOiB2b2lkO1xuXG4gIC8qKlxuICAgKiBQZXJmb3JtIGFueSBuZWNlc3NhcnkgY2xlYW51cC5cbiAgICovXG4gIGRlc3Ryb3koKTogdm9pZDtcbn1cblxuLyoqXG4gKiBDb3JlIGZ1bmN0aW9uYWxpdHkgZm9yIGBhZnRlclJlbmRlcmAgYW5kIGBhZnRlck5leHRSZW5kZXJgLiBLZXB0IHNlcGFyYXRlIGZyb21cbiAqIGBBZnRlclJlbmRlckV2ZW50TWFuYWdlcmAgZm9yIHRyZWUtc2hha2luZy5cbiAqL1xuY2xhc3MgQWZ0ZXJSZW5kZXJDYWxsYmFja0hhbmRsZXJJbXBsIGltcGxlbWVudHMgQWZ0ZXJSZW5kZXJDYWxsYmFja0hhbmRsZXIge1xuICBwcml2YXRlIGV4ZWN1dGluZ0NhbGxiYWNrcyA9IGZhbHNlO1xuICBwcml2YXRlIGJ1Y2tldHMgPSB7XG4gICAgLy8gTm90ZTogdGhlIG9yZGVyIG9mIHRoZXNlIGtleXMgY29udHJvbHMgdGhlIG9yZGVyIHRoZSBwaGFzZXMgYXJlIHJ1bi5cbiAgICBbQWZ0ZXJSZW5kZXJQaGFzZS5FYXJseVJlYWRdOiBuZXcgU2V0PEFmdGVyUmVuZGVyQ2FsbGJhY2s+KCksXG4gICAgW0FmdGVyUmVuZGVyUGhhc2UuV3JpdGVdOiBuZXcgU2V0PEFmdGVyUmVuZGVyQ2FsbGJhY2s+KCksXG4gICAgW0FmdGVyUmVuZGVyUGhhc2UuTWl4ZWRSZWFkV3JpdGVdOiBuZXcgU2V0PEFmdGVyUmVuZGVyQ2FsbGJhY2s+KCksXG4gICAgW0FmdGVyUmVuZGVyUGhhc2UuUmVhZF06IG5ldyBTZXQ8QWZ0ZXJSZW5kZXJDYWxsYmFjaz4oKSxcbiAgfTtcbiAgcHJpdmF0ZSBkZWZlcnJlZENhbGxiYWNrcyA9IG5ldyBTZXQ8QWZ0ZXJSZW5kZXJDYWxsYmFjaz4oKTtcblxuICB2YWxpZGF0ZUJlZ2luKCk6IHZvaWQge1xuICAgIGlmICh0aGlzLmV4ZWN1dGluZ0NhbGxiYWNrcykge1xuICAgICAgdGhyb3cgbmV3IFJ1bnRpbWVFcnJvcihcbiAgICAgICAgICBSdW50aW1lRXJyb3JDb2RlLlJFQ1VSU0lWRV9BUFBMSUNBVElPTl9SRU5ERVIsXG4gICAgICAgICAgbmdEZXZNb2RlICYmXG4gICAgICAgICAgICAgICdBIG5ldyByZW5kZXIgb3BlcmF0aW9uIGJlZ2FuIGJlZm9yZSB0aGUgcHJldmlvdXMgb3BlcmF0aW9uIGVuZGVkLiAnICtcbiAgICAgICAgICAgICAgICAgICdEaWQgeW91IHRyaWdnZXIgY2hhbmdlIGRldGVjdGlvbiBmcm9tIGFmdGVyUmVuZGVyIG9yIGFmdGVyTmV4dFJlbmRlcj8nKTtcbiAgICB9XG4gIH1cblxuICByZWdpc3RlcihjYWxsYmFjazogQWZ0ZXJSZW5kZXJDYWxsYmFjayk6IHZvaWQge1xuICAgIC8vIElmIHdlJ3JlIGN1cnJlbnRseSBydW5uaW5nIGNhbGxiYWNrcywgbmV3IGNhbGxiYWNrcyBzaG91bGQgYmUgZGVmZXJyZWRcbiAgICAvLyB1bnRpbCB0aGUgbmV4dCByZW5kZXIgb3BlcmF0aW9uLlxuICAgIGNvbnN0IHRhcmdldCA9IHRoaXMuZXhlY3V0aW5nQ2FsbGJhY2tzID8gdGhpcy5kZWZlcnJlZENhbGxiYWNrcyA6IHRoaXMuYnVja2V0c1tjYWxsYmFjay5waGFzZV07XG4gICAgdGFyZ2V0LmFkZChjYWxsYmFjayk7XG4gIH1cblxuICB1bnJlZ2lzdGVyKGNhbGxiYWNrOiBBZnRlclJlbmRlckNhbGxiYWNrKTogdm9pZCB7XG4gICAgdGhpcy5idWNrZXRzW2NhbGxiYWNrLnBoYXNlXS5kZWxldGUoY2FsbGJhY2spO1xuICAgIHRoaXMuZGVmZXJyZWRDYWxsYmFja3MuZGVsZXRlKGNhbGxiYWNrKTtcbiAgfVxuXG4gIGV4ZWN1dGUoKTogdm9pZCB7XG4gICAgdGhpcy5leGVjdXRpbmdDYWxsYmFja3MgPSB0cnVlO1xuICAgIGZvciAoY29uc3QgYnVja2V0IG9mIE9iamVjdC52YWx1ZXModGhpcy5idWNrZXRzKSkge1xuICAgICAgZm9yIChjb25zdCBjYWxsYmFjayBvZiBidWNrZXQpIHtcbiAgICAgICAgY2FsbGJhY2suaW52b2tlKCk7XG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMuZXhlY3V0aW5nQ2FsbGJhY2tzID0gZmFsc2U7XG5cbiAgICBmb3IgKGNvbnN0IGNhbGxiYWNrIG9mIHRoaXMuZGVmZXJyZWRDYWxsYmFja3MpIHtcbiAgICAgIHRoaXMuYnVja2V0c1tjYWxsYmFjay5waGFzZV0uYWRkKGNhbGxiYWNrKTtcbiAgICB9XG4gICAgdGhpcy5kZWZlcnJlZENhbGxiYWNrcy5jbGVhcigpO1xuICB9XG5cbiAgZGVzdHJveSgpOiB2b2lkIHtcbiAgICBmb3IgKGNvbnN0IGJ1Y2tldCBvZiBPYmplY3QudmFsdWVzKHRoaXMuYnVja2V0cykpIHtcbiAgICAgIGJ1Y2tldC5jbGVhcigpO1xuICAgIH1cbiAgICB0aGlzLmRlZmVycmVkQ2FsbGJhY2tzLmNsZWFyKCk7XG4gIH1cbn1cblxuLyoqXG4gKiBJbXBsZW1lbnRzIGNvcmUgdGltaW5nIGZvciBgYWZ0ZXJSZW5kZXJgIGFuZCBgYWZ0ZXJOZXh0UmVuZGVyYCBldmVudHMuXG4gKiBEZWxlZ2F0ZXMgdG8gYW4gb3B0aW9uYWwgYEFmdGVyUmVuZGVyQ2FsbGJhY2tIYW5kbGVyYCBmb3IgaW1wbGVtZW50YXRpb24uXG4gKi9cbmV4cG9ydCBjbGFzcyBBZnRlclJlbmRlckV2ZW50TWFuYWdlciB7XG4gIHByaXZhdGUgcmVuZGVyRGVwdGggPSAwO1xuXG4gIC8qIEBpbnRlcm5hbCAqL1xuICBoYW5kbGVyOiBBZnRlclJlbmRlckNhbGxiYWNrSGFuZGxlcnxudWxsID0gbnVsbDtcblxuICAvKiBAaW50ZXJuYWwgKi9cbiAgaW50ZXJuYWxDYWxsYmFja3M6IFZvaWRGdW5jdGlvbltdID0gW107XG5cbiAgLyoqXG4gICAqIE1hcmsgdGhlIGJlZ2lubmluZyBvZiBhIHJlbmRlciBvcGVyYXRpb24gKGkuZS4gQ0QgY3ljbGUpLlxuICAgKiBUaHJvd3MgaWYgY2FsbGVkIHdoaWxlIGV4ZWN1dGluZyBjYWxsYmFja3MuXG4gICAqL1xuICBiZWdpbigpIHtcbiAgICB0aGlzLmhhbmRsZXI/LnZhbGlkYXRlQmVnaW4oKTtcbiAgICB0aGlzLnJlbmRlckRlcHRoKys7XG4gIH1cblxuICAvKipcbiAgICogTWFyayB0aGUgZW5kIG9mIGEgcmVuZGVyIG9wZXJhdGlvbi4gQ2FsbGJhY2tzIHdpbGwgYmVcbiAgICogZXhlY3V0ZWQgaWYgdGhlcmUgYXJlIG5vIG1vcmUgcGVuZGluZyBvcGVyYXRpb25zLlxuICAgKi9cbiAgZW5kKCkge1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnRHcmVhdGVyVGhhbih0aGlzLnJlbmRlckRlcHRoLCAwLCAncmVuZGVyRGVwdGggbXVzdCBiZSBncmVhdGVyIHRoYW4gMCcpO1xuICAgIHRoaXMucmVuZGVyRGVwdGgtLTtcblxuICAgIGlmICh0aGlzLnJlbmRlckRlcHRoID09PSAwKSB7XG4gICAgICAvLyBOb3RlOiBpbnRlcm5hbCBjYWxsYmFja3MgcG93ZXIgYGludGVybmFsQWZ0ZXJOZXh0UmVuZGVyYC4gU2luY2UgaW50ZXJuYWwgY2FsbGJhY2tzXG4gICAgICAvLyBhcmUgZmFpcmx5IHRyaXZpYWwsIHRoZXkgYXJlIGtlcHQgc2VwYXJhdGUgc28gdGhhdCBgQWZ0ZXJSZW5kZXJDYWxsYmFja0hhbmRsZXJJbXBsYFxuICAgICAgLy8gY2FuIHN0aWxsIGJlIHRyZWUtc2hha2VuIHVubGVzcyB1c2VkIGJ5IHRoZSBhcHBsaWNhdGlvbi5cbiAgICAgIGZvciAoY29uc3QgY2FsbGJhY2sgb2YgdGhpcy5pbnRlcm5hbENhbGxiYWNrcykge1xuICAgICAgICBjYWxsYmFjaygpO1xuICAgICAgfVxuICAgICAgdGhpcy5pbnRlcm5hbENhbGxiYWNrcy5sZW5ndGggPSAwO1xuICAgICAgdGhpcy5oYW5kbGVyPy5leGVjdXRlKCk7XG4gICAgfVxuICB9XG5cbiAgbmdPbkRlc3Ryb3koKSB7XG4gICAgdGhpcy5oYW5kbGVyPy5kZXN0cm95KCk7XG4gICAgdGhpcy5oYW5kbGVyID0gbnVsbDtcbiAgICB0aGlzLmludGVybmFsQ2FsbGJhY2tzLmxlbmd0aCA9IDA7XG4gIH1cblxuICAvKiogQG5vY29sbGFwc2UgKi9cbiAgc3RhdGljIMm1cHJvdiA9IC8qKiBAcHVyZU9yQnJlYWtNeUNvZGUgKi8gybXJtWRlZmluZUluamVjdGFibGUoe1xuICAgIHRva2VuOiBBZnRlclJlbmRlckV2ZW50TWFuYWdlcixcbiAgICBwcm92aWRlZEluOiAncm9vdCcsXG4gICAgZmFjdG9yeTogKCkgPT4gbmV3IEFmdGVyUmVuZGVyRXZlbnRNYW5hZ2VyKCksXG4gIH0pO1xufVxuIl19