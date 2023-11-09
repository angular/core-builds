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
import { performanceMarkFeature } from '../util/performance';
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
    // is only invoked in a browser.
    if (!isPlatformBrowser(injector))
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWZ0ZXJfcmVuZGVyX2hvb2tzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9hZnRlcl9yZW5kZXJfaG9va3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLDBCQUEwQixFQUFDLE1BQU0sb0NBQW9DLENBQUM7QUFDOUUsT0FBTyxFQUFDLHdCQUF3QixFQUFFLFFBQVEsRUFBRSxrQkFBa0IsRUFBQyxNQUFNLE9BQU8sQ0FBQztBQUM3RSxPQUFPLEVBQUMsTUFBTSxFQUFDLE1BQU0sOEJBQThCLENBQUM7QUFDcEQsT0FBTyxFQUFDLFlBQVksRUFBQyxNQUFNLGtCQUFrQixDQUFDO0FBQzlDLE9BQU8sRUFBQyxZQUFZLEVBQW1CLE1BQU0sV0FBVyxDQUFDO0FBQ3pELE9BQU8sRUFBQyxVQUFVLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUNqRCxPQUFPLEVBQUMsaUJBQWlCLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUNqRCxPQUFPLEVBQUMsc0JBQXNCLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUMzRCxPQUFPLEVBQUMsTUFBTSxFQUFDLE1BQU0sU0FBUyxDQUFDO0FBRS9CLE9BQU8sRUFBQyxpQkFBaUIsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBRXBEOzs7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBbUJHO0FBQ0gsTUFBTSxDQUFOLElBQVksZ0JBeUNYO0FBekNELFdBQVksZ0JBQWdCO0lBQzFCOzs7Ozs7Ozs7Ozs7T0FZRztJQUNILGlFQUFTLENBQUE7SUFFVDs7O09BR0c7SUFDSCx5REFBSyxDQUFBO0lBRUw7Ozs7Ozs7Ozs7O09BV0c7SUFDSCwyRUFBYyxDQUFBO0lBRWQ7OztPQUdHO0lBQ0gsdURBQUksQ0FBQTtBQUNOLENBQUMsRUF6Q1csZ0JBQWdCLEtBQWhCLGdCQUFnQixRQXlDM0I7QUFvREQsMENBQTBDO0FB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QyxPQUFPLEVBQUUsYUFBYSxFQUFFLENBQUM7UUFDOUIsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO0lBQ3JCLENBQUM7SUFFRDs7O09BR0c7SUFDSCxHQUFHO1FBQ0QsU0FBUyxJQUFJLGlCQUFpQixDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQyxFQUFFLG9DQUFvQyxDQUFDLENBQUM7UUFDMUYsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO1FBRW5CLElBQUksSUFBSSxDQUFDLFdBQVcsS0FBSyxDQUFDLEVBQUUsQ0FBQztZQUMzQixxRkFBcUY7WUFDckYsc0ZBQXNGO1lBQ3RGLDJEQUEyRDtZQUMzRCxLQUFLLE1BQU0sUUFBUSxJQUFJLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO2dCQUM5QyxRQUFRLEVBQUUsQ0FBQztZQUNiLENBQUM7WUFDRCxJQUFJLENBQUMsaUJBQWlCLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQztZQUNsQyxJQUFJLENBQUMsT0FBTyxFQUFFLE9BQU8sRUFBRSxDQUFDO1FBQzFCLENBQUM7SUFDSCxDQUFDO0lBRUQsV0FBVztRQUNULElBQUksQ0FBQyxPQUFPLEVBQUUsT0FBTyxFQUFFLENBQUM7UUFDeEIsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUM7UUFDcEIsSUFBSSxDQUFDLGlCQUFpQixDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUM7SUFDcEMsQ0FBQztJQUVELGtCQUFrQjthQUNYLFVBQUssR0FBNkIsa0JBQWtCLENBQUM7UUFDMUQsS0FBSyxFQUFFLHVCQUF1QjtRQUM5QixVQUFVLEVBQUUsTUFBTTtRQUNsQixPQUFPLEVBQUUsR0FBRyxFQUFFLENBQUMsSUFBSSx1QkFBdUIsRUFBRTtLQUM3QyxDQUFDLEFBSlUsQ0FJVCIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge2Fzc2VydE5vdEluUmVhY3RpdmVDb250ZXh0fSBmcm9tICcuLi9jb3JlX3JlYWN0aXZpdHlfZXhwb3J0X2ludGVybmFsJztcbmltcG9ydCB7YXNzZXJ0SW5JbmplY3Rpb25Db250ZXh0LCBJbmplY3RvciwgybXJtWRlZmluZUluamVjdGFibGV9IGZyb20gJy4uL2RpJztcbmltcG9ydCB7aW5qZWN0fSBmcm9tICcuLi9kaS9pbmplY3Rvcl9jb21wYXRpYmlsaXR5JztcbmltcG9ydCB7RXJyb3JIYW5kbGVyfSBmcm9tICcuLi9lcnJvcl9oYW5kbGVyJztcbmltcG9ydCB7UnVudGltZUVycm9yLCBSdW50aW1lRXJyb3JDb2RlfSBmcm9tICcuLi9lcnJvcnMnO1xuaW1wb3J0IHtEZXN0cm95UmVmfSBmcm9tICcuLi9saW5rZXIvZGVzdHJveV9yZWYnO1xuaW1wb3J0IHthc3NlcnRHcmVhdGVyVGhhbn0gZnJvbSAnLi4vdXRpbC9hc3NlcnQnO1xuaW1wb3J0IHtwZXJmb3JtYW5jZU1hcmtGZWF0dXJlfSBmcm9tICcuLi91dGlsL3BlcmZvcm1hbmNlJztcbmltcG9ydCB7Tmdab25lfSBmcm9tICcuLi96b25lJztcblxuaW1wb3J0IHtpc1BsYXRmb3JtQnJvd3Nlcn0gZnJvbSAnLi91dGlsL21pc2NfdXRpbHMnO1xuXG4vKipcbiAqIFRoZSBwaGFzZSB0byBydW4gYW4gYGFmdGVyUmVuZGVyYCBvciBgYWZ0ZXJOZXh0UmVuZGVyYCBjYWxsYmFjayBpbi5cbiAqXG4gKiBDYWxsYmFja3MgaW4gdGhlIHNhbWUgcGhhc2UgcnVuIGluIHRoZSBvcmRlciB0aGV5IGFyZSByZWdpc3RlcmVkLiBQaGFzZXMgcnVuIGluIHRoZVxuICogZm9sbG93aW5nIG9yZGVyIGFmdGVyIGVhY2ggcmVuZGVyOlxuICpcbiAqICAgMS4gYEFmdGVyUmVuZGVyUGhhc2UuRWFybHlSZWFkYFxuICogICAyLiBgQWZ0ZXJSZW5kZXJQaGFzZS5Xcml0ZWBcbiAqICAgMy4gYEFmdGVyUmVuZGVyUGhhc2UuTWl4ZWRSZWFkV3JpdGVgXG4gKiAgIDQuIGBBZnRlclJlbmRlclBoYXNlLlJlYWRgXG4gKlxuICogQW5ndWxhciBpcyB1bmFibGUgdG8gdmVyaWZ5IG9yIGVuZm9yY2UgdGhhdCBwaGFzZXMgYXJlIHVzZWQgY29ycmVjdGx5LCBhbmQgaW5zdGVhZFxuICogcmVsaWVzIG9uIGVhY2ggZGV2ZWxvcGVyIHRvIGZvbGxvdyB0aGUgZ3VpZGVsaW5lcyBkb2N1bWVudGVkIGZvciBlYWNoIHZhbHVlIGFuZFxuICogY2FyZWZ1bGx5IGNob29zZSB0aGUgYXBwcm9wcmlhdGUgb25lLCByZWZhY3RvcmluZyB0aGVpciBjb2RlIGlmIG5lY2Vzc2FyeS4gQnkgZG9pbmdcbiAqIHNvLCBBbmd1bGFyIGlzIGJldHRlciBhYmxlIHRvIG1pbmltaXplIHRoZSBwZXJmb3JtYW5jZSBkZWdyYWRhdGlvbiBhc3NvY2lhdGVkIHdpdGhcbiAqIG1hbnVhbCBET00gYWNjZXNzLCBlbnN1cmluZyB0aGUgYmVzdCBleHBlcmllbmNlIGZvciB0aGUgZW5kIHVzZXJzIG9mIHlvdXIgYXBwbGljYXRpb25cbiAqIG9yIGxpYnJhcnkuXG4gKlxuICogQGRldmVsb3BlclByZXZpZXdcbiAqL1xuZXhwb3J0IGVudW0gQWZ0ZXJSZW5kZXJQaGFzZSB7XG4gIC8qKlxuICAgKiBVc2UgYEFmdGVyUmVuZGVyUGhhc2UuRWFybHlSZWFkYCBmb3IgY2FsbGJhY2tzIHRoYXQgb25seSBuZWVkIHRvICoqcmVhZCoqIGZyb20gdGhlXG4gICAqIERPTSBiZWZvcmUgYSBzdWJzZXF1ZW50IGBBZnRlclJlbmRlclBoYXNlLldyaXRlYCBjYWxsYmFjaywgZm9yIGV4YW1wbGUgdG8gcGVyZm9ybVxuICAgKiBjdXN0b20gbGF5b3V0IHRoYXQgdGhlIGJyb3dzZXIgZG9lc24ndCBuYXRpdmVseSBzdXBwb3J0LiAqKk5ldmVyKiogdXNlIHRoaXMgcGhhc2VcbiAgICogZm9yIGNhbGxiYWNrcyB0aGF0IGNhbiB3cml0ZSB0byB0aGUgRE9NIG9yIHdoZW4gYEFmdGVyUmVuZGVyUGhhc2UuUmVhZGAgaXMgYWRlcXVhdGUuXG4gICAqXG4gICAqIDxkaXYgY2xhc3M9XCJhbGVydCBpcy1pbXBvcnRhbnRcIj5cbiAgICpcbiAgICogVXNpbmcgdGhpcyB2YWx1ZSBjYW4gZGVncmFkZSBwZXJmb3JtYW5jZS5cbiAgICogSW5zdGVhZCwgcHJlZmVyIHVzaW5nIGJ1aWx0LWluIGJyb3dzZXIgZnVuY3Rpb25hbGl0eSB3aGVuIHBvc3NpYmxlLlxuICAgKlxuICAgKiA8L2Rpdj5cbiAgICovXG4gIEVhcmx5UmVhZCxcblxuICAvKipcbiAgICogVXNlIGBBZnRlclJlbmRlclBoYXNlLldyaXRlYCBmb3IgY2FsbGJhY2tzIHRoYXQgb25seSAqKndyaXRlKiogdG8gdGhlIERPTS4gKipOZXZlcioqXG4gICAqIHVzZSB0aGlzIHBoYXNlIGZvciBjYWxsYmFja3MgdGhhdCBjYW4gcmVhZCBmcm9tIHRoZSBET00uXG4gICAqL1xuICBXcml0ZSxcblxuICAvKipcbiAgICogVXNlIGBBZnRlclJlbmRlclBoYXNlLk1peGVkUmVhZFdyaXRlYCBmb3IgY2FsbGJhY2tzIHRoYXQgcmVhZCBmcm9tIG9yIHdyaXRlIHRvIHRoZVxuICAgKiBET00sIHRoYXQgaGF2ZW4ndCBiZWVuIHJlZmFjdG9yZWQgdG8gdXNlIGEgZGlmZmVyZW50IHBoYXNlLiAqKk5ldmVyKiogdXNlIHRoaXMgcGhhc2VcbiAgICogZm9yIGNhbGxiYWNrcyB0aGF0IGNhbiB1c2UgYSBkaWZmZXJlbnQgcGhhc2UgaW5zdGVhZC5cbiAgICpcbiAgICogPGRpdiBjbGFzcz1cImFsZXJ0IGlzLWNyaXRpY2FsXCI+XG4gICAqXG4gICAqIFVzaW5nIHRoaXMgdmFsdWUgY2FuICoqc2lnbmlmaWNhbnRseSoqIGRlZ3JhZGUgcGVyZm9ybWFuY2UuXG4gICAqIEluc3RlYWQsIHByZWZlciByZWZhY3RvcmluZyBpbnRvIG11bHRpcGxlIGNhbGxiYWNrcyB1c2luZyBhIG1vcmUgc3BlY2lmaWMgcGhhc2UuXG4gICAqXG4gICAqIDwvZGl2PlxuICAgKi9cbiAgTWl4ZWRSZWFkV3JpdGUsXG5cbiAgLyoqXG4gICAqIFVzZSBgQWZ0ZXJSZW5kZXJQaGFzZS5SZWFkYCBmb3IgY2FsbGJhY2tzIHRoYXQgb25seSAqKnJlYWQqKiBmcm9tIHRoZSBET00uICoqTmV2ZXIqKlxuICAgKiB1c2UgdGhpcyBwaGFzZSBmb3IgY2FsbGJhY2tzIHRoYXQgY2FuIHdyaXRlIHRvIHRoZSBET00uXG4gICAqL1xuICBSZWFkLFxufVxuXG4vKipcbiAqIE9wdGlvbnMgcGFzc2VkIHRvIGBhZnRlclJlbmRlcmAgYW5kIGBhZnRlck5leHRSZW5kZXJgLlxuICpcbiAqIEBkZXZlbG9wZXJQcmV2aWV3XG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgQWZ0ZXJSZW5kZXJPcHRpb25zIHtcbiAgLyoqXG4gICAqIFRoZSBgSW5qZWN0b3JgIHRvIHVzZSBkdXJpbmcgY3JlYXRpb24uXG4gICAqXG4gICAqIElmIHRoaXMgaXMgbm90IHByb3ZpZGVkLCB0aGUgY3VycmVudCBpbmplY3Rpb24gY29udGV4dCB3aWxsIGJlIHVzZWQgaW5zdGVhZCAodmlhIGBpbmplY3RgKS5cbiAgICovXG4gIGluamVjdG9yPzogSW5qZWN0b3I7XG5cbiAgLyoqXG4gICAqIFRoZSBwaGFzZSB0aGUgY2FsbGJhY2sgc2hvdWxkIGJlIGludm9rZWQgaW4uXG4gICAqXG4gICAqIDxkaXYgY2xhc3M9XCJhbGVydCBpcy1jcml0aWNhbFwiPlxuICAgKlxuICAgKiBEZWZhdWx0cyB0byBgQWZ0ZXJSZW5kZXJQaGFzZS5NaXhlZFJlYWRXcml0ZWAuIFlvdSBzaG91bGQgY2hvb3NlIGEgbW9yZSBzcGVjaWZpY1xuICAgKiBwaGFzZSBpbnN0ZWFkLiBTZWUgYEFmdGVyUmVuZGVyUGhhc2VgIGZvciBtb3JlIGluZm9ybWF0aW9uLlxuICAgKlxuICAgKiA8L2Rpdj5cbiAgICovXG4gIHBoYXNlPzogQWZ0ZXJSZW5kZXJQaGFzZTtcbn1cblxuLyoqXG4gKiBBIGNhbGxiYWNrIHRoYXQgcnVucyBhZnRlciByZW5kZXIuXG4gKlxuICogQGRldmVsb3BlclByZXZpZXdcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBBZnRlclJlbmRlclJlZiB7XG4gIC8qKlxuICAgKiBTaHV0IGRvd24gdGhlIGNhbGxiYWNrLCBwcmV2ZW50aW5nIGl0IGZyb20gYmVpbmcgY2FsbGVkIGFnYWluLlxuICAgKi9cbiAgZGVzdHJveSgpOiB2b2lkO1xufVxuXG4vKipcbiAqIE9wdGlvbnMgcGFzc2VkIHRvIGBpbnRlcm5hbEFmdGVyTmV4dFJlbmRlcmAuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgSW50ZXJuYWxBZnRlck5leHRSZW5kZXJPcHRpb25zIHtcbiAgLyoqXG4gICAqIFRoZSBgSW5qZWN0b3JgIHRvIHVzZSBkdXJpbmcgY3JlYXRpb24uXG4gICAqXG4gICAqIElmIHRoaXMgaXMgbm90IHByb3ZpZGVkLCB0aGUgY3VycmVudCBpbmplY3Rpb24gY29udGV4dCB3aWxsIGJlIHVzZWQgaW5zdGVhZCAodmlhIGBpbmplY3RgKS5cbiAgICovXG4gIGluamVjdG9yPzogSW5qZWN0b3I7XG59XG5cbi8qKiBgQWZ0ZXJSZW5kZXJSZWZgIHRoYXQgZG9lcyBub3RoaW5nLiAqL1xuY29uc3QgTk9PUF9BRlRFUl9SRU5ERVJfUkVGOiBBZnRlclJlbmRlclJlZiA9IHtcbiAgZGVzdHJveSgpIHt9XG59O1xuXG4vKipcbiAqIFJlZ2lzdGVyIGEgY2FsbGJhY2sgdG8gcnVuIG9uY2UgYmVmb3JlIGFueSB1c2Vyc3BhY2UgYGFmdGVyUmVuZGVyYCBvclxuICogYGFmdGVyTmV4dFJlbmRlcmAgY2FsbGJhY2tzLlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gc2hvdWxkIGFsbW9zdCBhbHdheXMgYmUgdXNlZCBpbnN0ZWFkIG9mIGBhZnRlclJlbmRlcmAgb3JcbiAqIGBhZnRlck5leHRSZW5kZXJgIGZvciBpbXBsZW1lbnRpbmcgZnJhbWV3b3JrIGZ1bmN0aW9uYWxpdHkuIENvbnNpZGVyOlxuICpcbiAqICAgMS4pIGBBZnRlclJlbmRlclBoYXNlLkVhcmx5UmVhZGAgaXMgaW50ZW5kZWQgdG8gYmUgdXNlZCBmb3IgaW1wbGVtZW50aW5nXG4gKiAgICAgICBjdXN0b20gbGF5b3V0LiBJZiB0aGUgZnJhbWV3b3JrIGl0c2VsZiBtdXRhdGVzIHRoZSBET00gYWZ0ZXIgKmFueSpcbiAqICAgICAgIGBBZnRlclJlbmRlclBoYXNlLkVhcmx5UmVhZGAgY2FsbGJhY2tzIGFyZSBydW4sIHRoZSBwaGFzZSBjYW4gbm9cbiAqICAgICAgIGxvbmdlciByZWxpYWJseSBzZXJ2ZSBpdHMgcHVycG9zZS5cbiAqXG4gKiAgIDIuKSBJbXBvcnRpbmcgYGFmdGVyUmVuZGVyYCBpbiB0aGUgZnJhbWV3b3JrIGNhbiByZWR1Y2UgdGhlIGFiaWxpdHkgZm9yIGl0XG4gKiAgICAgICB0byBiZSB0cmVlLXNoYWtlbiwgYW5kIHRoZSBmcmFtZXdvcmsgc2hvdWxkbid0IG5lZWQgbXVjaCBvZiB0aGUgYmVoYXZpb3IuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbnRlcm5hbEFmdGVyTmV4dFJlbmRlcihcbiAgICBjYWxsYmFjazogVm9pZEZ1bmN0aW9uLCBvcHRpb25zPzogSW50ZXJuYWxBZnRlck5leHRSZW5kZXJPcHRpb25zKSB7XG4gIGNvbnN0IGluamVjdG9yID0gb3B0aW9ucz8uaW5qZWN0b3IgPz8gaW5qZWN0KEluamVjdG9yKTtcblxuICAvLyBTaW1pbGFybHkgdG8gdGhlIHB1YmxpYyBgYWZ0ZXJOZXh0UmVuZGVyYCBmdW5jdGlvbiwgYW4gaW50ZXJuYWwgb25lXG4gIC8vIGlzIG9ubHkgaW52b2tlZCBpbiBhIGJyb3dzZXIuXG4gIGlmICghaXNQbGF0Zm9ybUJyb3dzZXIoaW5qZWN0b3IpKSByZXR1cm47XG5cbiAgY29uc3QgYWZ0ZXJSZW5kZXJFdmVudE1hbmFnZXIgPSBpbmplY3Rvci5nZXQoQWZ0ZXJSZW5kZXJFdmVudE1hbmFnZXIpO1xuICBhZnRlclJlbmRlckV2ZW50TWFuYWdlci5pbnRlcm5hbENhbGxiYWNrcy5wdXNoKGNhbGxiYWNrKTtcbn1cblxuLyoqXG4gKiBSZWdpc3RlciBhIGNhbGxiYWNrIHRvIGJlIGludm9rZWQgZWFjaCB0aW1lIHRoZSBhcHBsaWNhdGlvblxuICogZmluaXNoZXMgcmVuZGVyaW5nLlxuICpcbiAqIDxkaXYgY2xhc3M9XCJhbGVydCBpcy1jcml0aWNhbFwiPlxuICpcbiAqIFlvdSBzaG91bGQgYWx3YXlzIGV4cGxpY2l0bHkgc3BlY2lmeSBhIG5vbi1kZWZhdWx0IFtwaGFzZV0oYXBpL2NvcmUvQWZ0ZXJSZW5kZXJQaGFzZSksIG9yIHlvdVxuICogcmlzayBzaWduaWZpY2FudCBwZXJmb3JtYW5jZSBkZWdyYWRhdGlvbi5cbiAqXG4gKiA8L2Rpdj5cbiAqXG4gKiBOb3RlIHRoYXQgdGhlIGNhbGxiYWNrIHdpbGwgcnVuXG4gKiAtIGluIHRoZSBvcmRlciBpdCB3YXMgcmVnaXN0ZXJlZFxuICogLSBvbmNlIHBlciByZW5kZXJcbiAqIC0gb24gYnJvd3NlciBwbGF0Zm9ybXMgb25seVxuICpcbiAqIDxkaXYgY2xhc3M9XCJhbGVydCBpcy1pbXBvcnRhbnRcIj5cbiAqXG4gKiBDb21wb25lbnRzIGFyZSBub3QgZ3VhcmFudGVlZCB0byBiZSBbaHlkcmF0ZWRdKGd1aWRlL2h5ZHJhdGlvbikgYmVmb3JlIHRoZSBjYWxsYmFjayBydW5zLlxuICogWW91IG11c3QgdXNlIGNhdXRpb24gd2hlbiBkaXJlY3RseSByZWFkaW5nIG9yIHdyaXRpbmcgdGhlIERPTSBhbmQgbGF5b3V0LlxuICpcbiAqIDwvZGl2PlxuICpcbiAqIEBwYXJhbSBjYWxsYmFjayBBIGNhbGxiYWNrIGZ1bmN0aW9uIHRvIHJlZ2lzdGVyXG4gKlxuICogQHVzYWdlTm90ZXNcbiAqXG4gKiBVc2UgYGFmdGVyUmVuZGVyYCB0byByZWFkIG9yIHdyaXRlIHRoZSBET00gYWZ0ZXIgZWFjaCByZW5kZXIuXG4gKlxuICogIyMjIEV4YW1wbGVcbiAqIGBgYHRzXG4gKiBAQ29tcG9uZW50KHtcbiAqICAgc2VsZWN0b3I6ICdteS1jbXAnLFxuICogICB0ZW1wbGF0ZTogYDxzcGFuICNjb250ZW50Pnt7IC4uLiB9fTwvc3Bhbj5gLFxuICogfSlcbiAqIGV4cG9ydCBjbGFzcyBNeUNvbXBvbmVudCB7XG4gKiAgIEBWaWV3Q2hpbGQoJ2NvbnRlbnQnKSBjb250ZW50UmVmOiBFbGVtZW50UmVmO1xuICpcbiAqICAgY29uc3RydWN0b3IoKSB7XG4gKiAgICAgYWZ0ZXJSZW5kZXIoKCkgPT4ge1xuICogICAgICAgY29uc29sZS5sb2coJ2NvbnRlbnQgaGVpZ2h0OiAnICsgdGhpcy5jb250ZW50UmVmLm5hdGl2ZUVsZW1lbnQuc2Nyb2xsSGVpZ2h0KTtcbiAqICAgICB9LCB7cGhhc2U6IEFmdGVyUmVuZGVyUGhhc2UuUmVhZH0pO1xuICogICB9XG4gKiB9XG4gKiBgYGBcbiAqXG4gKiBAZGV2ZWxvcGVyUHJldmlld1xuICovXG5leHBvcnQgZnVuY3Rpb24gYWZ0ZXJSZW5kZXIoY2FsbGJhY2s6IFZvaWRGdW5jdGlvbiwgb3B0aW9ucz86IEFmdGVyUmVuZGVyT3B0aW9ucyk6IEFmdGVyUmVuZGVyUmVmIHtcbiAgbmdEZXZNb2RlICYmXG4gICAgICBhc3NlcnROb3RJblJlYWN0aXZlQ29udGV4dChcbiAgICAgICAgICBhZnRlclJlbmRlcixcbiAgICAgICAgICAnQ2FsbCBgYWZ0ZXJSZW5kZXJgIG91dHNpZGUgb2YgYSByZWFjdGl2ZSBjb250ZXh0LiBGb3IgZXhhbXBsZSwgc2NoZWR1bGUgdGhlIHJlbmRlciAnICtcbiAgICAgICAgICAgICAgJ2NhbGxiYWNrIGluc2lkZSB0aGUgY29tcG9uZW50IGNvbnN0cnVjdG9yYC4nKTtcblxuICAhb3B0aW9ucyAmJiBhc3NlcnRJbkluamVjdGlvbkNvbnRleHQoYWZ0ZXJSZW5kZXIpO1xuICBjb25zdCBpbmplY3RvciA9IG9wdGlvbnM/LmluamVjdG9yID8/IGluamVjdChJbmplY3Rvcik7XG5cbiAgaWYgKCFpc1BsYXRmb3JtQnJvd3NlcihpbmplY3RvcikpIHtcbiAgICByZXR1cm4gTk9PUF9BRlRFUl9SRU5ERVJfUkVGO1xuICB9XG5cbiAgcGVyZm9ybWFuY2VNYXJrRmVhdHVyZSgnTmdBZnRlclJlbmRlcicpO1xuXG4gIGNvbnN0IGFmdGVyUmVuZGVyRXZlbnRNYW5hZ2VyID0gaW5qZWN0b3IuZ2V0KEFmdGVyUmVuZGVyRXZlbnRNYW5hZ2VyKTtcbiAgLy8gTGF6aWx5IGluaXRpYWxpemUgdGhlIGhhbmRsZXIgaW1wbGVtZW50YXRpb24sIGlmIG5lY2Vzc2FyeS4gVGhpcyBpcyBzbyB0aGF0IGl0IGNhbiBiZVxuICAvLyB0cmVlLXNoYWtlbiBpZiBgYWZ0ZXJSZW5kZXJgIGFuZCBgYWZ0ZXJOZXh0UmVuZGVyYCBhcmVuJ3QgdXNlZC5cbiAgY29uc3QgY2FsbGJhY2tIYW5kbGVyID0gYWZ0ZXJSZW5kZXJFdmVudE1hbmFnZXIuaGFuZGxlciA/Pz0gbmV3IEFmdGVyUmVuZGVyQ2FsbGJhY2tIYW5kbGVySW1wbCgpO1xuICBjb25zdCBwaGFzZSA9IG9wdGlvbnM/LnBoYXNlID8/IEFmdGVyUmVuZGVyUGhhc2UuTWl4ZWRSZWFkV3JpdGU7XG4gIGNvbnN0IGRlc3Ryb3kgPSAoKSA9PiB7XG4gICAgY2FsbGJhY2tIYW5kbGVyLnVucmVnaXN0ZXIoaW5zdGFuY2UpO1xuICAgIHVucmVnaXN0ZXJGbigpO1xuICB9O1xuICBjb25zdCB1bnJlZ2lzdGVyRm4gPSBpbmplY3Rvci5nZXQoRGVzdHJveVJlZikub25EZXN0cm95KGRlc3Ryb3kpO1xuICBjb25zdCBpbnN0YW5jZSA9IG5ldyBBZnRlclJlbmRlckNhbGxiYWNrKGluamVjdG9yLCBwaGFzZSwgY2FsbGJhY2spO1xuXG4gIGNhbGxiYWNrSGFuZGxlci5yZWdpc3RlcihpbnN0YW5jZSk7XG4gIHJldHVybiB7ZGVzdHJveX07XG59XG5cbi8qKlxuICogUmVnaXN0ZXIgYSBjYWxsYmFjayB0byBiZSBpbnZva2VkIHRoZSBuZXh0IHRpbWUgdGhlIGFwcGxpY2F0aW9uXG4gKiBmaW5pc2hlcyByZW5kZXJpbmcuXG4gKlxuICogPGRpdiBjbGFzcz1cImFsZXJ0IGlzLWNyaXRpY2FsXCI+XG4gKlxuICogWW91IHNob3VsZCBhbHdheXMgZXhwbGljaXRseSBzcGVjaWZ5IGEgbm9uLWRlZmF1bHQgW3BoYXNlXShhcGkvY29yZS9BZnRlclJlbmRlclBoYXNlKSwgb3IgeW91XG4gKiByaXNrIHNpZ25pZmljYW50IHBlcmZvcm1hbmNlIGRlZ3JhZGF0aW9uLlxuICpcbiAqIDwvZGl2PlxuICpcbiAqIE5vdGUgdGhhdCB0aGUgY2FsbGJhY2sgd2lsbCBydW5cbiAqIC0gaW4gdGhlIG9yZGVyIGl0IHdhcyByZWdpc3RlcmVkXG4gKiAtIG9uIGJyb3dzZXIgcGxhdGZvcm1zIG9ubHlcbiAqXG4gKiA8ZGl2IGNsYXNzPVwiYWxlcnQgaXMtaW1wb3J0YW50XCI+XG4gKlxuICogQ29tcG9uZW50cyBhcmUgbm90IGd1YXJhbnRlZWQgdG8gYmUgW2h5ZHJhdGVkXShndWlkZS9oeWRyYXRpb24pIGJlZm9yZSB0aGUgY2FsbGJhY2sgcnVucy5cbiAqIFlvdSBtdXN0IHVzZSBjYXV0aW9uIHdoZW4gZGlyZWN0bHkgcmVhZGluZyBvciB3cml0aW5nIHRoZSBET00gYW5kIGxheW91dC5cbiAqXG4gKiA8L2Rpdj5cbiAqXG4gKiBAcGFyYW0gY2FsbGJhY2sgQSBjYWxsYmFjayBmdW5jdGlvbiB0byByZWdpc3RlclxuICpcbiAqIEB1c2FnZU5vdGVzXG4gKlxuICogVXNlIGBhZnRlck5leHRSZW5kZXJgIHRvIHJlYWQgb3Igd3JpdGUgdGhlIERPTSBvbmNlLFxuICogZm9yIGV4YW1wbGUgdG8gaW5pdGlhbGl6ZSBhIG5vbi1Bbmd1bGFyIGxpYnJhcnkuXG4gKlxuICogIyMjIEV4YW1wbGVcbiAqIGBgYHRzXG4gKiBAQ29tcG9uZW50KHtcbiAqICAgc2VsZWN0b3I6ICdteS1jaGFydC1jbXAnLFxuICogICB0ZW1wbGF0ZTogYDxkaXYgI2NoYXJ0Pnt7IC4uLiB9fTwvZGl2PmAsXG4gKiB9KVxuICogZXhwb3J0IGNsYXNzIE15Q2hhcnRDbXAge1xuICogICBAVmlld0NoaWxkKCdjaGFydCcpIGNoYXJ0UmVmOiBFbGVtZW50UmVmO1xuICogICBjaGFydDogTXlDaGFydHxudWxsO1xuICpcbiAqICAgY29uc3RydWN0b3IoKSB7XG4gKiAgICAgYWZ0ZXJOZXh0UmVuZGVyKCgpID0+IHtcbiAqICAgICAgIHRoaXMuY2hhcnQgPSBuZXcgTXlDaGFydCh0aGlzLmNoYXJ0UmVmLm5hdGl2ZUVsZW1lbnQpO1xuICogICAgIH0sIHtwaGFzZTogQWZ0ZXJSZW5kZXJQaGFzZS5Xcml0ZX0pO1xuICogICB9XG4gKiB9XG4gKiBgYGBcbiAqXG4gKiBAZGV2ZWxvcGVyUHJldmlld1xuICovXG5leHBvcnQgZnVuY3Rpb24gYWZ0ZXJOZXh0UmVuZGVyKFxuICAgIGNhbGxiYWNrOiBWb2lkRnVuY3Rpb24sIG9wdGlvbnM/OiBBZnRlclJlbmRlck9wdGlvbnMpOiBBZnRlclJlbmRlclJlZiB7XG4gICFvcHRpb25zICYmIGFzc2VydEluSW5qZWN0aW9uQ29udGV4dChhZnRlck5leHRSZW5kZXIpO1xuICBjb25zdCBpbmplY3RvciA9IG9wdGlvbnM/LmluamVjdG9yID8/IGluamVjdChJbmplY3Rvcik7XG5cbiAgaWYgKCFpc1BsYXRmb3JtQnJvd3NlcihpbmplY3RvcikpIHtcbiAgICByZXR1cm4gTk9PUF9BRlRFUl9SRU5ERVJfUkVGO1xuICB9XG5cbiAgcGVyZm9ybWFuY2VNYXJrRmVhdHVyZSgnTmdBZnRlck5leHRSZW5kZXInKTtcblxuICBjb25zdCBhZnRlclJlbmRlckV2ZW50TWFuYWdlciA9IGluamVjdG9yLmdldChBZnRlclJlbmRlckV2ZW50TWFuYWdlcik7XG4gIC8vIExhemlseSBpbml0aWFsaXplIHRoZSBoYW5kbGVyIGltcGxlbWVudGF0aW9uLCBpZiBuZWNlc3NhcnkuIFRoaXMgaXMgc28gdGhhdCBpdCBjYW4gYmVcbiAgLy8gdHJlZS1zaGFrZW4gaWYgYGFmdGVyUmVuZGVyYCBhbmQgYGFmdGVyTmV4dFJlbmRlcmAgYXJlbid0IHVzZWQuXG4gIGNvbnN0IGNhbGxiYWNrSGFuZGxlciA9IGFmdGVyUmVuZGVyRXZlbnRNYW5hZ2VyLmhhbmRsZXIgPz89IG5ldyBBZnRlclJlbmRlckNhbGxiYWNrSGFuZGxlckltcGwoKTtcbiAgY29uc3QgcGhhc2UgPSBvcHRpb25zPy5waGFzZSA/PyBBZnRlclJlbmRlclBoYXNlLk1peGVkUmVhZFdyaXRlO1xuICBjb25zdCBkZXN0cm95ID0gKCkgPT4ge1xuICAgIGNhbGxiYWNrSGFuZGxlci51bnJlZ2lzdGVyKGluc3RhbmNlKTtcbiAgICB1bnJlZ2lzdGVyRm4oKTtcbiAgfTtcbiAgY29uc3QgdW5yZWdpc3RlckZuID0gaW5qZWN0b3IuZ2V0KERlc3Ryb3lSZWYpLm9uRGVzdHJveShkZXN0cm95KTtcbiAgY29uc3QgaW5zdGFuY2UgPSBuZXcgQWZ0ZXJSZW5kZXJDYWxsYmFjayhpbmplY3RvciwgcGhhc2UsICgpID0+IHtcbiAgICBkZXN0cm95KCk7XG4gICAgY2FsbGJhY2soKTtcbiAgfSk7XG5cbiAgY2FsbGJhY2tIYW5kbGVyLnJlZ2lzdGVyKGluc3RhbmNlKTtcbiAgcmV0dXJuIHtkZXN0cm95fTtcbn1cblxuLyoqXG4gKiBBIHdyYXBwZXIgYXJvdW5kIGEgZnVuY3Rpb24gdG8gYmUgdXNlZCBhcyBhbiBhZnRlciByZW5kZXIgY2FsbGJhY2suXG4gKi9cbmNsYXNzIEFmdGVyUmVuZGVyQ2FsbGJhY2sge1xuICBwcml2YXRlIHpvbmU6IE5nWm9uZTtcbiAgcHJpdmF0ZSBlcnJvckhhbmRsZXI6IEVycm9ySGFuZGxlcnxudWxsO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgICAgaW5qZWN0b3I6IEluamVjdG9yLCBwdWJsaWMgcmVhZG9ubHkgcGhhc2U6IEFmdGVyUmVuZGVyUGhhc2UsXG4gICAgICBwcml2YXRlIGNhbGxiYWNrRm46IFZvaWRGdW5jdGlvbikge1xuICAgIHRoaXMuem9uZSA9IGluamVjdG9yLmdldChOZ1pvbmUpO1xuICAgIHRoaXMuZXJyb3JIYW5kbGVyID0gaW5qZWN0b3IuZ2V0KEVycm9ySGFuZGxlciwgbnVsbCwge29wdGlvbmFsOiB0cnVlfSk7XG4gIH1cblxuICBpbnZva2UoKSB7XG4gICAgdHJ5IHtcbiAgICAgIHRoaXMuem9uZS5ydW5PdXRzaWRlQW5ndWxhcih0aGlzLmNhbGxiYWNrRm4pO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgdGhpcy5lcnJvckhhbmRsZXI/LmhhbmRsZUVycm9yKGVycik7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogSW1wbGVtZW50cyBgYWZ0ZXJSZW5kZXJgIGFuZCBgYWZ0ZXJOZXh0UmVuZGVyYCBjYWxsYmFjayBoYW5kbGVyIGxvZ2ljLlxuICovXG5pbnRlcmZhY2UgQWZ0ZXJSZW5kZXJDYWxsYmFja0hhbmRsZXIge1xuICAvKipcbiAgICogVmFsaWRhdGUgdGhhdCBpdCdzIHNhZmUgZm9yIGEgcmVuZGVyIG9wZXJhdGlvbiB0byBiZWdpbixcbiAgICogdGhyb3dpbmcgaWYgbm90LiBOb3QgZ3VhcmFudGVlZCB0byBiZSBjYWxsZWQgaWYgYSByZW5kZXJcbiAgICogb3BlcmF0aW9uIGlzIHN0YXJ0ZWQgYmVmb3JlIGhhbmRsZXIgd2FzIHJlZ2lzdGVyZWQuXG4gICAqL1xuICB2YWxpZGF0ZUJlZ2luKCk6IHZvaWQ7XG5cbiAgLyoqXG4gICAqIFJlZ2lzdGVyIGEgbmV3IGNhbGxiYWNrLlxuICAgKi9cbiAgcmVnaXN0ZXIoY2FsbGJhY2s6IEFmdGVyUmVuZGVyQ2FsbGJhY2spOiB2b2lkO1xuXG4gIC8qKlxuICAgKiBVbnJlZ2lzdGVyIGFuIGV4aXN0aW5nIGNhbGxiYWNrLlxuICAgKi9cbiAgdW5yZWdpc3RlcihjYWxsYmFjazogQWZ0ZXJSZW5kZXJDYWxsYmFjayk6IHZvaWQ7XG5cbiAgLyoqXG4gICAqIEV4ZWN1dGUgY2FsbGJhY2tzLlxuICAgKi9cbiAgZXhlY3V0ZSgpOiB2b2lkO1xuXG4gIC8qKlxuICAgKiBQZXJmb3JtIGFueSBuZWNlc3NhcnkgY2xlYW51cC5cbiAgICovXG4gIGRlc3Ryb3koKTogdm9pZDtcbn1cblxuLyoqXG4gKiBDb3JlIGZ1bmN0aW9uYWxpdHkgZm9yIGBhZnRlclJlbmRlcmAgYW5kIGBhZnRlck5leHRSZW5kZXJgLiBLZXB0IHNlcGFyYXRlIGZyb21cbiAqIGBBZnRlclJlbmRlckV2ZW50TWFuYWdlcmAgZm9yIHRyZWUtc2hha2luZy5cbiAqL1xuY2xhc3MgQWZ0ZXJSZW5kZXJDYWxsYmFja0hhbmRsZXJJbXBsIGltcGxlbWVudHMgQWZ0ZXJSZW5kZXJDYWxsYmFja0hhbmRsZXIge1xuICBwcml2YXRlIGV4ZWN1dGluZ0NhbGxiYWNrcyA9IGZhbHNlO1xuICBwcml2YXRlIGJ1Y2tldHMgPSB7XG4gICAgLy8gTm90ZTogdGhlIG9yZGVyIG9mIHRoZXNlIGtleXMgY29udHJvbHMgdGhlIG9yZGVyIHRoZSBwaGFzZXMgYXJlIHJ1bi5cbiAgICBbQWZ0ZXJSZW5kZXJQaGFzZS5FYXJseVJlYWRdOiBuZXcgU2V0PEFmdGVyUmVuZGVyQ2FsbGJhY2s+KCksXG4gICAgW0FmdGVyUmVuZGVyUGhhc2UuV3JpdGVdOiBuZXcgU2V0PEFmdGVyUmVuZGVyQ2FsbGJhY2s+KCksXG4gICAgW0FmdGVyUmVuZGVyUGhhc2UuTWl4ZWRSZWFkV3JpdGVdOiBuZXcgU2V0PEFmdGVyUmVuZGVyQ2FsbGJhY2s+KCksXG4gICAgW0FmdGVyUmVuZGVyUGhhc2UuUmVhZF06IG5ldyBTZXQ8QWZ0ZXJSZW5kZXJDYWxsYmFjaz4oKSxcbiAgfTtcbiAgcHJpdmF0ZSBkZWZlcnJlZENhbGxiYWNrcyA9IG5ldyBTZXQ8QWZ0ZXJSZW5kZXJDYWxsYmFjaz4oKTtcblxuICB2YWxpZGF0ZUJlZ2luKCk6IHZvaWQge1xuICAgIGlmICh0aGlzLmV4ZWN1dGluZ0NhbGxiYWNrcykge1xuICAgICAgdGhyb3cgbmV3IFJ1bnRpbWVFcnJvcihcbiAgICAgICAgICBSdW50aW1lRXJyb3JDb2RlLlJFQ1VSU0lWRV9BUFBMSUNBVElPTl9SRU5ERVIsXG4gICAgICAgICAgbmdEZXZNb2RlICYmXG4gICAgICAgICAgICAgICdBIG5ldyByZW5kZXIgb3BlcmF0aW9uIGJlZ2FuIGJlZm9yZSB0aGUgcHJldmlvdXMgb3BlcmF0aW9uIGVuZGVkLiAnICtcbiAgICAgICAgICAgICAgICAgICdEaWQgeW91IHRyaWdnZXIgY2hhbmdlIGRldGVjdGlvbiBmcm9tIGFmdGVyUmVuZGVyIG9yIGFmdGVyTmV4dFJlbmRlcj8nKTtcbiAgICB9XG4gIH1cblxuICByZWdpc3RlcihjYWxsYmFjazogQWZ0ZXJSZW5kZXJDYWxsYmFjayk6IHZvaWQge1xuICAgIC8vIElmIHdlJ3JlIGN1cnJlbnRseSBydW5uaW5nIGNhbGxiYWNrcywgbmV3IGNhbGxiYWNrcyBzaG91bGQgYmUgZGVmZXJyZWRcbiAgICAvLyB1bnRpbCB0aGUgbmV4dCByZW5kZXIgb3BlcmF0aW9uLlxuICAgIGNvbnN0IHRhcmdldCA9IHRoaXMuZXhlY3V0aW5nQ2FsbGJhY2tzID8gdGhpcy5kZWZlcnJlZENhbGxiYWNrcyA6IHRoaXMuYnVja2V0c1tjYWxsYmFjay5waGFzZV07XG4gICAgdGFyZ2V0LmFkZChjYWxsYmFjayk7XG4gIH1cblxuICB1bnJlZ2lzdGVyKGNhbGxiYWNrOiBBZnRlclJlbmRlckNhbGxiYWNrKTogdm9pZCB7XG4gICAgdGhpcy5idWNrZXRzW2NhbGxiYWNrLnBoYXNlXS5kZWxldGUoY2FsbGJhY2spO1xuICAgIHRoaXMuZGVmZXJyZWRDYWxsYmFja3MuZGVsZXRlKGNhbGxiYWNrKTtcbiAgfVxuXG4gIGV4ZWN1dGUoKTogdm9pZCB7XG4gICAgdGhpcy5leGVjdXRpbmdDYWxsYmFja3MgPSB0cnVlO1xuICAgIGZvciAoY29uc3QgYnVja2V0IG9mIE9iamVjdC52YWx1ZXModGhpcy5idWNrZXRzKSkge1xuICAgICAgZm9yIChjb25zdCBjYWxsYmFjayBvZiBidWNrZXQpIHtcbiAgICAgICAgY2FsbGJhY2suaW52b2tlKCk7XG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMuZXhlY3V0aW5nQ2FsbGJhY2tzID0gZmFsc2U7XG5cbiAgICBmb3IgKGNvbnN0IGNhbGxiYWNrIG9mIHRoaXMuZGVmZXJyZWRDYWxsYmFja3MpIHtcbiAgICAgIHRoaXMuYnVja2V0c1tjYWxsYmFjay5waGFzZV0uYWRkKGNhbGxiYWNrKTtcbiAgICB9XG4gICAgdGhpcy5kZWZlcnJlZENhbGxiYWNrcy5jbGVhcigpO1xuICB9XG5cbiAgZGVzdHJveSgpOiB2b2lkIHtcbiAgICBmb3IgKGNvbnN0IGJ1Y2tldCBvZiBPYmplY3QudmFsdWVzKHRoaXMuYnVja2V0cykpIHtcbiAgICAgIGJ1Y2tldC5jbGVhcigpO1xuICAgIH1cbiAgICB0aGlzLmRlZmVycmVkQ2FsbGJhY2tzLmNsZWFyKCk7XG4gIH1cbn1cblxuLyoqXG4gKiBJbXBsZW1lbnRzIGNvcmUgdGltaW5nIGZvciBgYWZ0ZXJSZW5kZXJgIGFuZCBgYWZ0ZXJOZXh0UmVuZGVyYCBldmVudHMuXG4gKiBEZWxlZ2F0ZXMgdG8gYW4gb3B0aW9uYWwgYEFmdGVyUmVuZGVyQ2FsbGJhY2tIYW5kbGVyYCBmb3IgaW1wbGVtZW50YXRpb24uXG4gKi9cbmV4cG9ydCBjbGFzcyBBZnRlclJlbmRlckV2ZW50TWFuYWdlciB7XG4gIHByaXZhdGUgcmVuZGVyRGVwdGggPSAwO1xuXG4gIC8qIEBpbnRlcm5hbCAqL1xuICBoYW5kbGVyOiBBZnRlclJlbmRlckNhbGxiYWNrSGFuZGxlcnxudWxsID0gbnVsbDtcblxuICAvKiBAaW50ZXJuYWwgKi9cbiAgaW50ZXJuYWxDYWxsYmFja3M6IFZvaWRGdW5jdGlvbltdID0gW107XG5cbiAgLyoqXG4gICAqIE1hcmsgdGhlIGJlZ2lubmluZyBvZiBhIHJlbmRlciBvcGVyYXRpb24gKGkuZS4gQ0QgY3ljbGUpLlxuICAgKiBUaHJvd3MgaWYgY2FsbGVkIHdoaWxlIGV4ZWN1dGluZyBjYWxsYmFja3MuXG4gICAqL1xuICBiZWdpbigpIHtcbiAgICB0aGlzLmhhbmRsZXI/LnZhbGlkYXRlQmVnaW4oKTtcbiAgICB0aGlzLnJlbmRlckRlcHRoKys7XG4gIH1cblxuICAvKipcbiAgICogTWFyayB0aGUgZW5kIG9mIGEgcmVuZGVyIG9wZXJhdGlvbi4gQ2FsbGJhY2tzIHdpbGwgYmVcbiAgICogZXhlY3V0ZWQgaWYgdGhlcmUgYXJlIG5vIG1vcmUgcGVuZGluZyBvcGVyYXRpb25zLlxuICAgKi9cbiAgZW5kKCkge1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnRHcmVhdGVyVGhhbih0aGlzLnJlbmRlckRlcHRoLCAwLCAncmVuZGVyRGVwdGggbXVzdCBiZSBncmVhdGVyIHRoYW4gMCcpO1xuICAgIHRoaXMucmVuZGVyRGVwdGgtLTtcblxuICAgIGlmICh0aGlzLnJlbmRlckRlcHRoID09PSAwKSB7XG4gICAgICAvLyBOb3RlOiBpbnRlcm5hbCBjYWxsYmFja3MgcG93ZXIgYGludGVybmFsQWZ0ZXJOZXh0UmVuZGVyYC4gU2luY2UgaW50ZXJuYWwgY2FsbGJhY2tzXG4gICAgICAvLyBhcmUgZmFpcmx5IHRyaXZpYWwsIHRoZXkgYXJlIGtlcHQgc2VwYXJhdGUgc28gdGhhdCBgQWZ0ZXJSZW5kZXJDYWxsYmFja0hhbmRsZXJJbXBsYFxuICAgICAgLy8gY2FuIHN0aWxsIGJlIHRyZWUtc2hha2VuIHVubGVzcyB1c2VkIGJ5IHRoZSBhcHBsaWNhdGlvbi5cbiAgICAgIGZvciAoY29uc3QgY2FsbGJhY2sgb2YgdGhpcy5pbnRlcm5hbENhbGxiYWNrcykge1xuICAgICAgICBjYWxsYmFjaygpO1xuICAgICAgfVxuICAgICAgdGhpcy5pbnRlcm5hbENhbGxiYWNrcy5sZW5ndGggPSAwO1xuICAgICAgdGhpcy5oYW5kbGVyPy5leGVjdXRlKCk7XG4gICAgfVxuICB9XG5cbiAgbmdPbkRlc3Ryb3koKSB7XG4gICAgdGhpcy5oYW5kbGVyPy5kZXN0cm95KCk7XG4gICAgdGhpcy5oYW5kbGVyID0gbnVsbDtcbiAgICB0aGlzLmludGVybmFsQ2FsbGJhY2tzLmxlbmd0aCA9IDA7XG4gIH1cblxuICAvKiogQG5vY29sbGFwc2UgKi9cbiAgc3RhdGljIMm1cHJvdiA9IC8qKiBAcHVyZU9yQnJlYWtNeUNvZGUgKi8gybXJtWRlZmluZUluamVjdGFibGUoe1xuICAgIHRva2VuOiBBZnRlclJlbmRlckV2ZW50TWFuYWdlcixcbiAgICBwcm92aWRlZEluOiAncm9vdCcsXG4gICAgZmFjdG9yeTogKCkgPT4gbmV3IEFmdGVyUmVuZGVyRXZlbnRNYW5hZ2VyKCksXG4gIH0pO1xufVxuIl19