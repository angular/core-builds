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
import { performanceMark } from '../util/performance';
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
    performanceMark('mark_use_counter', { detail: { feature: 'NgAfterRender' } });
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
    performanceMark('mark_use_counter', { detail: { feature: 'NgAfterNextRender' } });
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWZ0ZXJfcmVuZGVyX2hvb2tzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9hZnRlcl9yZW5kZXJfaG9va3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLDBCQUEwQixFQUFDLE1BQU0sb0NBQW9DLENBQUM7QUFDOUUsT0FBTyxFQUFDLHdCQUF3QixFQUFFLFFBQVEsRUFBRSxrQkFBa0IsRUFBQyxNQUFNLE9BQU8sQ0FBQztBQUM3RSxPQUFPLEVBQUMsTUFBTSxFQUFDLE1BQU0sOEJBQThCLENBQUM7QUFDcEQsT0FBTyxFQUFDLFlBQVksRUFBQyxNQUFNLGtCQUFrQixDQUFDO0FBQzlDLE9BQU8sRUFBQyxZQUFZLEVBQW1CLE1BQU0sV0FBVyxDQUFDO0FBQ3pELE9BQU8sRUFBQyxVQUFVLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUNqRCxPQUFPLEVBQUMsaUJBQWlCLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUNqRCxPQUFPLEVBQUMsZUFBZSxFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFDcEQsT0FBTyxFQUFDLE1BQU0sRUFBQyxNQUFNLFNBQVMsQ0FBQztBQUUvQixPQUFPLEVBQUMsaUJBQWlCLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUVwRDs7Ozs7Ozs7Ozs7Ozs7Ozs7OztHQW1CRztBQUNILE1BQU0sQ0FBTixJQUFZLGdCQXlDWDtBQXpDRCxXQUFZLGdCQUFnQjtJQUMxQjs7Ozs7Ozs7Ozs7O09BWUc7SUFDSCxpRUFBUyxDQUFBO0lBRVQ7OztPQUdHO0lBQ0gseURBQUssQ0FBQTtJQUVMOzs7Ozs7Ozs7OztPQVdHO0lBQ0gsMkVBQWMsQ0FBQTtJQUVkOzs7T0FHRztJQUNILHVEQUFJLENBQUE7QUFDTixDQUFDLEVBekNXLGdCQUFnQixLQUFoQixnQkFBZ0IsUUF5QzNCO0FBb0RELDBDQUEwQztBQUMx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SUFBSSxDQUFDLE9BQU8sRUFBRSxhQUFhLEVBQUUsQ0FBQztRQUM5QixJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7SUFDckIsQ0FBQztJQUVEOzs7T0FHRztJQUNILEdBQUc7UUFDRCxTQUFTLElBQUksaUJBQWlCLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDLEVBQUUsb0NBQW9DLENBQUMsQ0FBQztRQUMxRixJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7UUFFbkIsSUFBSSxJQUFJLENBQUMsV0FBVyxLQUFLLENBQUMsRUFBRTtZQUMxQixxRkFBcUY7WUFDckYsc0ZBQXNGO1lBQ3RGLDJEQUEyRDtZQUMzRCxLQUFLLE1BQU0sUUFBUSxJQUFJLElBQUksQ0FBQyxpQkFBaUIsRUFBRTtnQkFDN0MsUUFBUSxFQUFFLENBQUM7YUFDWjtZQUNELElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO1lBQ2xDLElBQUksQ0FBQyxPQUFPLEVBQUUsT0FBTyxFQUFFLENBQUM7U0FDekI7SUFDSCxDQUFDO0lBRUQsV0FBVztRQUNULElBQUksQ0FBQyxPQUFPLEVBQUUsT0FBTyxFQUFFLENBQUM7UUFDeEIsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUM7UUFDcEIsSUFBSSxDQUFDLGlCQUFpQixDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUM7SUFDcEMsQ0FBQztJQUVELGtCQUFrQjthQUNYLFVBQUssR0FBNkIsa0JBQWtCLENBQUM7UUFDMUQsS0FBSyxFQUFFLHVCQUF1QjtRQUM5QixVQUFVLEVBQUUsTUFBTTtRQUNsQixPQUFPLEVBQUUsR0FBRyxFQUFFLENBQUMsSUFBSSx1QkFBdUIsRUFBRTtLQUM3QyxDQUFDLEFBSlUsQ0FJVCIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge2Fzc2VydE5vdEluUmVhY3RpdmVDb250ZXh0fSBmcm9tICcuLi9jb3JlX3JlYWN0aXZpdHlfZXhwb3J0X2ludGVybmFsJztcbmltcG9ydCB7YXNzZXJ0SW5JbmplY3Rpb25Db250ZXh0LCBJbmplY3RvciwgybXJtWRlZmluZUluamVjdGFibGV9IGZyb20gJy4uL2RpJztcbmltcG9ydCB7aW5qZWN0fSBmcm9tICcuLi9kaS9pbmplY3Rvcl9jb21wYXRpYmlsaXR5JztcbmltcG9ydCB7RXJyb3JIYW5kbGVyfSBmcm9tICcuLi9lcnJvcl9oYW5kbGVyJztcbmltcG9ydCB7UnVudGltZUVycm9yLCBSdW50aW1lRXJyb3JDb2RlfSBmcm9tICcuLi9lcnJvcnMnO1xuaW1wb3J0IHtEZXN0cm95UmVmfSBmcm9tICcuLi9saW5rZXIvZGVzdHJveV9yZWYnO1xuaW1wb3J0IHthc3NlcnRHcmVhdGVyVGhhbn0gZnJvbSAnLi4vdXRpbC9hc3NlcnQnO1xuaW1wb3J0IHtwZXJmb3JtYW5jZU1hcmt9IGZyb20gJy4uL3V0aWwvcGVyZm9ybWFuY2UnO1xuaW1wb3J0IHtOZ1pvbmV9IGZyb20gJy4uL3pvbmUnO1xuXG5pbXBvcnQge2lzUGxhdGZvcm1Ccm93c2VyfSBmcm9tICcuL3V0aWwvbWlzY191dGlscyc7XG5cbi8qKlxuICogVGhlIHBoYXNlIHRvIHJ1biBhbiBgYWZ0ZXJSZW5kZXJgIG9yIGBhZnRlck5leHRSZW5kZXJgIGNhbGxiYWNrIGluLlxuICpcbiAqIENhbGxiYWNrcyBpbiB0aGUgc2FtZSBwaGFzZSBydW4gaW4gdGhlIG9yZGVyIHRoZXkgYXJlIHJlZ2lzdGVyZWQuIFBoYXNlcyBydW4gaW4gdGhlXG4gKiBmb2xsb3dpbmcgb3JkZXIgYWZ0ZXIgZWFjaCByZW5kZXI6XG4gKlxuICogICAxLiBgQWZ0ZXJSZW5kZXJQaGFzZS5FYXJseVJlYWRgXG4gKiAgIDIuIGBBZnRlclJlbmRlclBoYXNlLldyaXRlYFxuICogICAzLiBgQWZ0ZXJSZW5kZXJQaGFzZS5NaXhlZFJlYWRXcml0ZWBcbiAqICAgNC4gYEFmdGVyUmVuZGVyUGhhc2UuUmVhZGBcbiAqXG4gKiBBbmd1bGFyIGlzIHVuYWJsZSB0byB2ZXJpZnkgb3IgZW5mb3JjZSB0aGF0IHBoYXNlcyBhcmUgdXNlZCBjb3JyZWN0bHksIGFuZCBpbnN0ZWFkXG4gKiByZWxpZXMgb24gZWFjaCBkZXZlbG9wZXIgdG8gZm9sbG93IHRoZSBndWlkZWxpbmVzIGRvY3VtZW50ZWQgZm9yIGVhY2ggdmFsdWUgYW5kXG4gKiBjYXJlZnVsbHkgY2hvb3NlIHRoZSBhcHByb3ByaWF0ZSBvbmUsIHJlZmFjdG9yaW5nIHRoZWlyIGNvZGUgaWYgbmVjZXNzYXJ5LiBCeSBkb2luZ1xuICogc28sIEFuZ3VsYXIgaXMgYmV0dGVyIGFibGUgdG8gbWluaW1pemUgdGhlIHBlcmZvcm1hbmNlIGRlZ3JhZGF0aW9uIGFzc29jaWF0ZWQgd2l0aFxuICogbWFudWFsIERPTSBhY2Nlc3MsIGVuc3VyaW5nIHRoZSBiZXN0IGV4cGVyaWVuY2UgZm9yIHRoZSBlbmQgdXNlcnMgb2YgeW91ciBhcHBsaWNhdGlvblxuICogb3IgbGlicmFyeS5cbiAqXG4gKiBAZGV2ZWxvcGVyUHJldmlld1xuICovXG5leHBvcnQgZW51bSBBZnRlclJlbmRlclBoYXNlIHtcbiAgLyoqXG4gICAqIFVzZSBgQWZ0ZXJSZW5kZXJQaGFzZS5FYXJseVJlYWRgIGZvciBjYWxsYmFja3MgdGhhdCBvbmx5IG5lZWQgdG8gKipyZWFkKiogZnJvbSB0aGVcbiAgICogRE9NIGJlZm9yZSBhIHN1YnNlcXVlbnQgYEFmdGVyUmVuZGVyUGhhc2UuV3JpdGVgIGNhbGxiYWNrLCBmb3IgZXhhbXBsZSB0byBwZXJmb3JtXG4gICAqIGN1c3RvbSBsYXlvdXQgdGhhdCB0aGUgYnJvd3NlciBkb2Vzbid0IG5hdGl2ZWx5IHN1cHBvcnQuICoqTmV2ZXIqKiB1c2UgdGhpcyBwaGFzZVxuICAgKiBmb3IgY2FsbGJhY2tzIHRoYXQgY2FuIHdyaXRlIHRvIHRoZSBET00gb3Igd2hlbiBgQWZ0ZXJSZW5kZXJQaGFzZS5SZWFkYCBpcyBhZGVxdWF0ZS5cbiAgICpcbiAgICogPGRpdiBjbGFzcz1cImFsZXJ0IGlzLWltcG9ydGFudFwiPlxuICAgKlxuICAgKiBVc2luZyB0aGlzIHZhbHVlIGNhbiBkZWdyYWRlIHBlcmZvcm1hbmNlLlxuICAgKiBJbnN0ZWFkLCBwcmVmZXIgdXNpbmcgYnVpbHQtaW4gYnJvd3NlciBmdW5jdGlvbmFsaXR5IHdoZW4gcG9zc2libGUuXG4gICAqXG4gICAqIDwvZGl2PlxuICAgKi9cbiAgRWFybHlSZWFkLFxuXG4gIC8qKlxuICAgKiBVc2UgYEFmdGVyUmVuZGVyUGhhc2UuV3JpdGVgIGZvciBjYWxsYmFja3MgdGhhdCBvbmx5ICoqd3JpdGUqKiB0byB0aGUgRE9NLiAqKk5ldmVyKipcbiAgICogdXNlIHRoaXMgcGhhc2UgZm9yIGNhbGxiYWNrcyB0aGF0IGNhbiByZWFkIGZyb20gdGhlIERPTS5cbiAgICovXG4gIFdyaXRlLFxuXG4gIC8qKlxuICAgKiBVc2UgYEFmdGVyUmVuZGVyUGhhc2UuTWl4ZWRSZWFkV3JpdGVgIGZvciBjYWxsYmFja3MgdGhhdCByZWFkIGZyb20gb3Igd3JpdGUgdG8gdGhlXG4gICAqIERPTSwgdGhhdCBoYXZlbid0IGJlZW4gcmVmYWN0b3JlZCB0byB1c2UgYSBkaWZmZXJlbnQgcGhhc2UuICoqTmV2ZXIqKiB1c2UgdGhpcyBwaGFzZVxuICAgKiBmb3IgY2FsbGJhY2tzIHRoYXQgY2FuIHVzZSBhIGRpZmZlcmVudCBwaGFzZSBpbnN0ZWFkLlxuICAgKlxuICAgKiA8ZGl2IGNsYXNzPVwiYWxlcnQgaXMtY3JpdGljYWxcIj5cbiAgICpcbiAgICogVXNpbmcgdGhpcyB2YWx1ZSBjYW4gKipzaWduaWZpY2FudGx5KiogZGVncmFkZSBwZXJmb3JtYW5jZS5cbiAgICogSW5zdGVhZCwgcHJlZmVyIHJlZmFjdG9yaW5nIGludG8gbXVsdGlwbGUgY2FsbGJhY2tzIHVzaW5nIGEgbW9yZSBzcGVjaWZpYyBwaGFzZS5cbiAgICpcbiAgICogPC9kaXY+XG4gICAqL1xuICBNaXhlZFJlYWRXcml0ZSxcblxuICAvKipcbiAgICogVXNlIGBBZnRlclJlbmRlclBoYXNlLlJlYWRgIGZvciBjYWxsYmFja3MgdGhhdCBvbmx5ICoqcmVhZCoqIGZyb20gdGhlIERPTS4gKipOZXZlcioqXG4gICAqIHVzZSB0aGlzIHBoYXNlIGZvciBjYWxsYmFja3MgdGhhdCBjYW4gd3JpdGUgdG8gdGhlIERPTS5cbiAgICovXG4gIFJlYWQsXG59XG5cbi8qKlxuICogT3B0aW9ucyBwYXNzZWQgdG8gYGFmdGVyUmVuZGVyYCBhbmQgYGFmdGVyTmV4dFJlbmRlcmAuXG4gKlxuICogQGRldmVsb3BlclByZXZpZXdcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBBZnRlclJlbmRlck9wdGlvbnMge1xuICAvKipcbiAgICogVGhlIGBJbmplY3RvcmAgdG8gdXNlIGR1cmluZyBjcmVhdGlvbi5cbiAgICpcbiAgICogSWYgdGhpcyBpcyBub3QgcHJvdmlkZWQsIHRoZSBjdXJyZW50IGluamVjdGlvbiBjb250ZXh0IHdpbGwgYmUgdXNlZCBpbnN0ZWFkICh2aWEgYGluamVjdGApLlxuICAgKi9cbiAgaW5qZWN0b3I/OiBJbmplY3RvcjtcblxuICAvKipcbiAgICogVGhlIHBoYXNlIHRoZSBjYWxsYmFjayBzaG91bGQgYmUgaW52b2tlZCBpbi5cbiAgICpcbiAgICogPGRpdiBjbGFzcz1cImFsZXJ0IGlzLWNyaXRpY2FsXCI+XG4gICAqXG4gICAqIERlZmF1bHRzIHRvIGBBZnRlclJlbmRlclBoYXNlLk1peGVkUmVhZFdyaXRlYC4gWW91IHNob3VsZCBjaG9vc2UgYSBtb3JlIHNwZWNpZmljXG4gICAqIHBoYXNlIGluc3RlYWQuIFNlZSBgQWZ0ZXJSZW5kZXJQaGFzZWAgZm9yIG1vcmUgaW5mb3JtYXRpb24uXG4gICAqXG4gICAqIDwvZGl2PlxuICAgKi9cbiAgcGhhc2U/OiBBZnRlclJlbmRlclBoYXNlO1xufVxuXG4vKipcbiAqIEEgY2FsbGJhY2sgdGhhdCBydW5zIGFmdGVyIHJlbmRlci5cbiAqXG4gKiBAZGV2ZWxvcGVyUHJldmlld1xuICovXG5leHBvcnQgaW50ZXJmYWNlIEFmdGVyUmVuZGVyUmVmIHtcbiAgLyoqXG4gICAqIFNodXQgZG93biB0aGUgY2FsbGJhY2ssIHByZXZlbnRpbmcgaXQgZnJvbSBiZWluZyBjYWxsZWQgYWdhaW4uXG4gICAqL1xuICBkZXN0cm95KCk6IHZvaWQ7XG59XG5cbi8qKlxuICogT3B0aW9ucyBwYXNzZWQgdG8gYGludGVybmFsQWZ0ZXJOZXh0UmVuZGVyYC5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBJbnRlcm5hbEFmdGVyTmV4dFJlbmRlck9wdGlvbnMge1xuICAvKipcbiAgICogVGhlIGBJbmplY3RvcmAgdG8gdXNlIGR1cmluZyBjcmVhdGlvbi5cbiAgICpcbiAgICogSWYgdGhpcyBpcyBub3QgcHJvdmlkZWQsIHRoZSBjdXJyZW50IGluamVjdGlvbiBjb250ZXh0IHdpbGwgYmUgdXNlZCBpbnN0ZWFkICh2aWEgYGluamVjdGApLlxuICAgKi9cbiAgaW5qZWN0b3I/OiBJbmplY3Rvcjtcbn1cblxuLyoqIGBBZnRlclJlbmRlclJlZmAgdGhhdCBkb2VzIG5vdGhpbmcuICovXG5jb25zdCBOT09QX0FGVEVSX1JFTkRFUl9SRUY6IEFmdGVyUmVuZGVyUmVmID0ge1xuICBkZXN0cm95KCkge31cbn07XG5cbi8qKlxuICogUmVnaXN0ZXIgYSBjYWxsYmFjayB0byBydW4gb25jZSBiZWZvcmUgYW55IHVzZXJzcGFjZSBgYWZ0ZXJSZW5kZXJgIG9yXG4gKiBgYWZ0ZXJOZXh0UmVuZGVyYCBjYWxsYmFja3MuXG4gKlxuICogVGhpcyBmdW5jdGlvbiBzaG91bGQgYWxtb3N0IGFsd2F5cyBiZSB1c2VkIGluc3RlYWQgb2YgYGFmdGVyUmVuZGVyYCBvclxuICogYGFmdGVyTmV4dFJlbmRlcmAgZm9yIGltcGxlbWVudGluZyBmcmFtZXdvcmsgZnVuY3Rpb25hbGl0eS4gQ29uc2lkZXI6XG4gKlxuICogICAxLikgYEFmdGVyUmVuZGVyUGhhc2UuRWFybHlSZWFkYCBpcyBpbnRlbmRlZCB0byBiZSB1c2VkIGZvciBpbXBsZW1lbnRpbmdcbiAqICAgICAgIGN1c3RvbSBsYXlvdXQuIElmIHRoZSBmcmFtZXdvcmsgaXRzZWxmIG11dGF0ZXMgdGhlIERPTSBhZnRlciAqYW55KlxuICogICAgICAgYEFmdGVyUmVuZGVyUGhhc2UuRWFybHlSZWFkYCBjYWxsYmFja3MgYXJlIHJ1biwgdGhlIHBoYXNlIGNhbiBub1xuICogICAgICAgbG9uZ2VyIHJlbGlhYmx5IHNlcnZlIGl0cyBwdXJwb3NlLlxuICpcbiAqICAgMi4pIEltcG9ydGluZyBgYWZ0ZXJSZW5kZXJgIGluIHRoZSBmcmFtZXdvcmsgY2FuIHJlZHVjZSB0aGUgYWJpbGl0eSBmb3IgaXRcbiAqICAgICAgIHRvIGJlIHRyZWUtc2hha2VuLCBhbmQgdGhlIGZyYW1ld29yayBzaG91bGRuJ3QgbmVlZCBtdWNoIG9mIHRoZSBiZWhhdmlvci5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGludGVybmFsQWZ0ZXJOZXh0UmVuZGVyKFxuICAgIGNhbGxiYWNrOiBWb2lkRnVuY3Rpb24sIG9wdGlvbnM/OiBJbnRlcm5hbEFmdGVyTmV4dFJlbmRlck9wdGlvbnMpIHtcbiAgY29uc3QgaW5qZWN0b3IgPSBvcHRpb25zPy5pbmplY3RvciA/PyBpbmplY3QoSW5qZWN0b3IpO1xuXG4gIC8vIFNpbWlsYXJseSB0byB0aGUgcHVibGljIGBhZnRlck5leHRSZW5kZXJgIGZ1bmN0aW9uLCBhbiBpbnRlcm5hbCBvbmVcbiAgLy8gaXMgb25seSBpbnZva2VkIGluIGEgYnJvd3Nlci5cbiAgaWYgKCFpc1BsYXRmb3JtQnJvd3NlcihpbmplY3RvcikpIHJldHVybjtcblxuICBjb25zdCBhZnRlclJlbmRlckV2ZW50TWFuYWdlciA9IGluamVjdG9yLmdldChBZnRlclJlbmRlckV2ZW50TWFuYWdlcik7XG4gIGFmdGVyUmVuZGVyRXZlbnRNYW5hZ2VyLmludGVybmFsQ2FsbGJhY2tzLnB1c2goY2FsbGJhY2spO1xufVxuXG4vKipcbiAqIFJlZ2lzdGVyIGEgY2FsbGJhY2sgdG8gYmUgaW52b2tlZCBlYWNoIHRpbWUgdGhlIGFwcGxpY2F0aW9uXG4gKiBmaW5pc2hlcyByZW5kZXJpbmcuXG4gKlxuICogPGRpdiBjbGFzcz1cImFsZXJ0IGlzLWNyaXRpY2FsXCI+XG4gKlxuICogWW91IHNob3VsZCBhbHdheXMgZXhwbGljaXRseSBzcGVjaWZ5IGEgbm9uLWRlZmF1bHQgW3BoYXNlXShhcGkvY29yZS9BZnRlclJlbmRlclBoYXNlKSwgb3IgeW91XG4gKiByaXNrIHNpZ25pZmljYW50IHBlcmZvcm1hbmNlIGRlZ3JhZGF0aW9uLlxuICpcbiAqIDwvZGl2PlxuICpcbiAqIE5vdGUgdGhhdCB0aGUgY2FsbGJhY2sgd2lsbCBydW5cbiAqIC0gaW4gdGhlIG9yZGVyIGl0IHdhcyByZWdpc3RlcmVkXG4gKiAtIG9uY2UgcGVyIHJlbmRlclxuICogLSBvbiBicm93c2VyIHBsYXRmb3JtcyBvbmx5XG4gKlxuICogPGRpdiBjbGFzcz1cImFsZXJ0IGlzLWltcG9ydGFudFwiPlxuICpcbiAqIENvbXBvbmVudHMgYXJlIG5vdCBndWFyYW50ZWVkIHRvIGJlIFtoeWRyYXRlZF0oZ3VpZGUvaHlkcmF0aW9uKSBiZWZvcmUgdGhlIGNhbGxiYWNrIHJ1bnMuXG4gKiBZb3UgbXVzdCB1c2UgY2F1dGlvbiB3aGVuIGRpcmVjdGx5IHJlYWRpbmcgb3Igd3JpdGluZyB0aGUgRE9NIGFuZCBsYXlvdXQuXG4gKlxuICogPC9kaXY+XG4gKlxuICogQHBhcmFtIGNhbGxiYWNrIEEgY2FsbGJhY2sgZnVuY3Rpb24gdG8gcmVnaXN0ZXJcbiAqXG4gKiBAdXNhZ2VOb3Rlc1xuICpcbiAqIFVzZSBgYWZ0ZXJSZW5kZXJgIHRvIHJlYWQgb3Igd3JpdGUgdGhlIERPTSBhZnRlciBlYWNoIHJlbmRlci5cbiAqXG4gKiAjIyMgRXhhbXBsZVxuICogYGBgdHNcbiAqIEBDb21wb25lbnQoe1xuICogICBzZWxlY3RvcjogJ215LWNtcCcsXG4gKiAgIHRlbXBsYXRlOiBgPHNwYW4gI2NvbnRlbnQ+e3sgLi4uIH19PC9zcGFuPmAsXG4gKiB9KVxuICogZXhwb3J0IGNsYXNzIE15Q29tcG9uZW50IHtcbiAqICAgQFZpZXdDaGlsZCgnY29udGVudCcpIGNvbnRlbnRSZWY6IEVsZW1lbnRSZWY7XG4gKlxuICogICBjb25zdHJ1Y3RvcigpIHtcbiAqICAgICBhZnRlclJlbmRlcigoKSA9PiB7XG4gKiAgICAgICBjb25zb2xlLmxvZygnY29udGVudCBoZWlnaHQ6ICcgKyB0aGlzLmNvbnRlbnRSZWYubmF0aXZlRWxlbWVudC5zY3JvbGxIZWlnaHQpO1xuICogICAgIH0sIHtwaGFzZTogQWZ0ZXJSZW5kZXJQaGFzZS5SZWFkfSk7XG4gKiAgIH1cbiAqIH1cbiAqIGBgYFxuICpcbiAqIEBkZXZlbG9wZXJQcmV2aWV3XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhZnRlclJlbmRlcihjYWxsYmFjazogVm9pZEZ1bmN0aW9uLCBvcHRpb25zPzogQWZ0ZXJSZW5kZXJPcHRpb25zKTogQWZ0ZXJSZW5kZXJSZWYge1xuICBuZ0Rldk1vZGUgJiZcbiAgICAgIGFzc2VydE5vdEluUmVhY3RpdmVDb250ZXh0KFxuICAgICAgICAgIGFmdGVyUmVuZGVyLFxuICAgICAgICAgICdDYWxsIGBhZnRlclJlbmRlcmAgb3V0c2lkZSBvZiBhIHJlYWN0aXZlIGNvbnRleHQuIEZvciBleGFtcGxlLCBzY2hlZHVsZSB0aGUgcmVuZGVyICcgK1xuICAgICAgICAgICAgICAnY2FsbGJhY2sgaW5zaWRlIHRoZSBjb21wb25lbnQgY29uc3RydWN0b3JgLicpO1xuXG4gICFvcHRpb25zICYmIGFzc2VydEluSW5qZWN0aW9uQ29udGV4dChhZnRlclJlbmRlcik7XG4gIGNvbnN0IGluamVjdG9yID0gb3B0aW9ucz8uaW5qZWN0b3IgPz8gaW5qZWN0KEluamVjdG9yKTtcblxuICBpZiAoIWlzUGxhdGZvcm1Ccm93c2VyKGluamVjdG9yKSkge1xuICAgIHJldHVybiBOT09QX0FGVEVSX1JFTkRFUl9SRUY7XG4gIH1cblxuICBwZXJmb3JtYW5jZU1hcmsoJ21hcmtfdXNlX2NvdW50ZXInLCB7ZGV0YWlsOiB7ZmVhdHVyZTogJ05nQWZ0ZXJSZW5kZXInfX0pO1xuXG4gIGNvbnN0IGFmdGVyUmVuZGVyRXZlbnRNYW5hZ2VyID0gaW5qZWN0b3IuZ2V0KEFmdGVyUmVuZGVyRXZlbnRNYW5hZ2VyKTtcbiAgLy8gTGF6aWx5IGluaXRpYWxpemUgdGhlIGhhbmRsZXIgaW1wbGVtZW50YXRpb24sIGlmIG5lY2Vzc2FyeS4gVGhpcyBpcyBzbyB0aGF0IGl0IGNhbiBiZVxuICAvLyB0cmVlLXNoYWtlbiBpZiBgYWZ0ZXJSZW5kZXJgIGFuZCBgYWZ0ZXJOZXh0UmVuZGVyYCBhcmVuJ3QgdXNlZC5cbiAgY29uc3QgY2FsbGJhY2tIYW5kbGVyID0gYWZ0ZXJSZW5kZXJFdmVudE1hbmFnZXIuaGFuZGxlciA/Pz0gbmV3IEFmdGVyUmVuZGVyQ2FsbGJhY2tIYW5kbGVySW1wbCgpO1xuICBjb25zdCBwaGFzZSA9IG9wdGlvbnM/LnBoYXNlID8/IEFmdGVyUmVuZGVyUGhhc2UuTWl4ZWRSZWFkV3JpdGU7XG4gIGNvbnN0IGRlc3Ryb3kgPSAoKSA9PiB7XG4gICAgY2FsbGJhY2tIYW5kbGVyLnVucmVnaXN0ZXIoaW5zdGFuY2UpO1xuICAgIHVucmVnaXN0ZXJGbigpO1xuICB9O1xuICBjb25zdCB1bnJlZ2lzdGVyRm4gPSBpbmplY3Rvci5nZXQoRGVzdHJveVJlZikub25EZXN0cm95KGRlc3Ryb3kpO1xuICBjb25zdCBpbnN0YW5jZSA9IG5ldyBBZnRlclJlbmRlckNhbGxiYWNrKGluamVjdG9yLCBwaGFzZSwgY2FsbGJhY2spO1xuXG4gIGNhbGxiYWNrSGFuZGxlci5yZWdpc3RlcihpbnN0YW5jZSk7XG4gIHJldHVybiB7ZGVzdHJveX07XG59XG5cbi8qKlxuICogUmVnaXN0ZXIgYSBjYWxsYmFjayB0byBiZSBpbnZva2VkIHRoZSBuZXh0IHRpbWUgdGhlIGFwcGxpY2F0aW9uXG4gKiBmaW5pc2hlcyByZW5kZXJpbmcuXG4gKlxuICogPGRpdiBjbGFzcz1cImFsZXJ0IGlzLWNyaXRpY2FsXCI+XG4gKlxuICogWW91IHNob3VsZCBhbHdheXMgZXhwbGljaXRseSBzcGVjaWZ5IGEgbm9uLWRlZmF1bHQgW3BoYXNlXShhcGkvY29yZS9BZnRlclJlbmRlclBoYXNlKSwgb3IgeW91XG4gKiByaXNrIHNpZ25pZmljYW50IHBlcmZvcm1hbmNlIGRlZ3JhZGF0aW9uLlxuICpcbiAqIDwvZGl2PlxuICpcbiAqIE5vdGUgdGhhdCB0aGUgY2FsbGJhY2sgd2lsbCBydW5cbiAqIC0gaW4gdGhlIG9yZGVyIGl0IHdhcyByZWdpc3RlcmVkXG4gKiAtIG9uIGJyb3dzZXIgcGxhdGZvcm1zIG9ubHlcbiAqXG4gKiA8ZGl2IGNsYXNzPVwiYWxlcnQgaXMtaW1wb3J0YW50XCI+XG4gKlxuICogQ29tcG9uZW50cyBhcmUgbm90IGd1YXJhbnRlZWQgdG8gYmUgW2h5ZHJhdGVkXShndWlkZS9oeWRyYXRpb24pIGJlZm9yZSB0aGUgY2FsbGJhY2sgcnVucy5cbiAqIFlvdSBtdXN0IHVzZSBjYXV0aW9uIHdoZW4gZGlyZWN0bHkgcmVhZGluZyBvciB3cml0aW5nIHRoZSBET00gYW5kIGxheW91dC5cbiAqXG4gKiA8L2Rpdj5cbiAqXG4gKiBAcGFyYW0gY2FsbGJhY2sgQSBjYWxsYmFjayBmdW5jdGlvbiB0byByZWdpc3RlclxuICpcbiAqIEB1c2FnZU5vdGVzXG4gKlxuICogVXNlIGBhZnRlck5leHRSZW5kZXJgIHRvIHJlYWQgb3Igd3JpdGUgdGhlIERPTSBvbmNlLFxuICogZm9yIGV4YW1wbGUgdG8gaW5pdGlhbGl6ZSBhIG5vbi1Bbmd1bGFyIGxpYnJhcnkuXG4gKlxuICogIyMjIEV4YW1wbGVcbiAqIGBgYHRzXG4gKiBAQ29tcG9uZW50KHtcbiAqICAgc2VsZWN0b3I6ICdteS1jaGFydC1jbXAnLFxuICogICB0ZW1wbGF0ZTogYDxkaXYgI2NoYXJ0Pnt7IC4uLiB9fTwvZGl2PmAsXG4gKiB9KVxuICogZXhwb3J0IGNsYXNzIE15Q2hhcnRDbXAge1xuICogICBAVmlld0NoaWxkKCdjaGFydCcpIGNoYXJ0UmVmOiBFbGVtZW50UmVmO1xuICogICBjaGFydDogTXlDaGFydHxudWxsO1xuICpcbiAqICAgY29uc3RydWN0b3IoKSB7XG4gKiAgICAgYWZ0ZXJOZXh0UmVuZGVyKCgpID0+IHtcbiAqICAgICAgIHRoaXMuY2hhcnQgPSBuZXcgTXlDaGFydCh0aGlzLmNoYXJ0UmVmLm5hdGl2ZUVsZW1lbnQpO1xuICogICAgIH0sIHtwaGFzZTogQWZ0ZXJSZW5kZXJQaGFzZS5Xcml0ZX0pO1xuICogICB9XG4gKiB9XG4gKiBgYGBcbiAqXG4gKiBAZGV2ZWxvcGVyUHJldmlld1xuICovXG5leHBvcnQgZnVuY3Rpb24gYWZ0ZXJOZXh0UmVuZGVyKFxuICAgIGNhbGxiYWNrOiBWb2lkRnVuY3Rpb24sIG9wdGlvbnM/OiBBZnRlclJlbmRlck9wdGlvbnMpOiBBZnRlclJlbmRlclJlZiB7XG4gICFvcHRpb25zICYmIGFzc2VydEluSW5qZWN0aW9uQ29udGV4dChhZnRlck5leHRSZW5kZXIpO1xuICBjb25zdCBpbmplY3RvciA9IG9wdGlvbnM/LmluamVjdG9yID8/IGluamVjdChJbmplY3Rvcik7XG5cbiAgaWYgKCFpc1BsYXRmb3JtQnJvd3NlcihpbmplY3RvcikpIHtcbiAgICByZXR1cm4gTk9PUF9BRlRFUl9SRU5ERVJfUkVGO1xuICB9XG5cbiAgcGVyZm9ybWFuY2VNYXJrKCdtYXJrX3VzZV9jb3VudGVyJywge2RldGFpbDoge2ZlYXR1cmU6ICdOZ0FmdGVyTmV4dFJlbmRlcid9fSk7XG5cbiAgY29uc3QgYWZ0ZXJSZW5kZXJFdmVudE1hbmFnZXIgPSBpbmplY3Rvci5nZXQoQWZ0ZXJSZW5kZXJFdmVudE1hbmFnZXIpO1xuICAvLyBMYXppbHkgaW5pdGlhbGl6ZSB0aGUgaGFuZGxlciBpbXBsZW1lbnRhdGlvbiwgaWYgbmVjZXNzYXJ5LiBUaGlzIGlzIHNvIHRoYXQgaXQgY2FuIGJlXG4gIC8vIHRyZWUtc2hha2VuIGlmIGBhZnRlclJlbmRlcmAgYW5kIGBhZnRlck5leHRSZW5kZXJgIGFyZW4ndCB1c2VkLlxuICBjb25zdCBjYWxsYmFja0hhbmRsZXIgPSBhZnRlclJlbmRlckV2ZW50TWFuYWdlci5oYW5kbGVyID8/PSBuZXcgQWZ0ZXJSZW5kZXJDYWxsYmFja0hhbmRsZXJJbXBsKCk7XG4gIGNvbnN0IHBoYXNlID0gb3B0aW9ucz8ucGhhc2UgPz8gQWZ0ZXJSZW5kZXJQaGFzZS5NaXhlZFJlYWRXcml0ZTtcbiAgY29uc3QgZGVzdHJveSA9ICgpID0+IHtcbiAgICBjYWxsYmFja0hhbmRsZXIudW5yZWdpc3RlcihpbnN0YW5jZSk7XG4gICAgdW5yZWdpc3RlckZuKCk7XG4gIH07XG4gIGNvbnN0IHVucmVnaXN0ZXJGbiA9IGluamVjdG9yLmdldChEZXN0cm95UmVmKS5vbkRlc3Ryb3koZGVzdHJveSk7XG4gIGNvbnN0IGluc3RhbmNlID0gbmV3IEFmdGVyUmVuZGVyQ2FsbGJhY2soaW5qZWN0b3IsIHBoYXNlLCAoKSA9PiB7XG4gICAgZGVzdHJveSgpO1xuICAgIGNhbGxiYWNrKCk7XG4gIH0pO1xuXG4gIGNhbGxiYWNrSGFuZGxlci5yZWdpc3RlcihpbnN0YW5jZSk7XG4gIHJldHVybiB7ZGVzdHJveX07XG59XG5cbi8qKlxuICogQSB3cmFwcGVyIGFyb3VuZCBhIGZ1bmN0aW9uIHRvIGJlIHVzZWQgYXMgYW4gYWZ0ZXIgcmVuZGVyIGNhbGxiYWNrLlxuICovXG5jbGFzcyBBZnRlclJlbmRlckNhbGxiYWNrIHtcbiAgcHJpdmF0ZSB6b25lOiBOZ1pvbmU7XG4gIHByaXZhdGUgZXJyb3JIYW5kbGVyOiBFcnJvckhhbmRsZXJ8bnVsbDtcblxuICBjb25zdHJ1Y3RvcihcbiAgICAgIGluamVjdG9yOiBJbmplY3RvciwgcHVibGljIHJlYWRvbmx5IHBoYXNlOiBBZnRlclJlbmRlclBoYXNlLFxuICAgICAgcHJpdmF0ZSBjYWxsYmFja0ZuOiBWb2lkRnVuY3Rpb24pIHtcbiAgICB0aGlzLnpvbmUgPSBpbmplY3Rvci5nZXQoTmdab25lKTtcbiAgICB0aGlzLmVycm9ySGFuZGxlciA9IGluamVjdG9yLmdldChFcnJvckhhbmRsZXIsIG51bGwsIHtvcHRpb25hbDogdHJ1ZX0pO1xuICB9XG5cbiAgaW52b2tlKCkge1xuICAgIHRyeSB7XG4gICAgICB0aGlzLnpvbmUucnVuT3V0c2lkZUFuZ3VsYXIodGhpcy5jYWxsYmFja0ZuKTtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIHRoaXMuZXJyb3JIYW5kbGVyPy5oYW5kbGVFcnJvcihlcnIpO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIEltcGxlbWVudHMgYGFmdGVyUmVuZGVyYCBhbmQgYGFmdGVyTmV4dFJlbmRlcmAgY2FsbGJhY2sgaGFuZGxlciBsb2dpYy5cbiAqL1xuaW50ZXJmYWNlIEFmdGVyUmVuZGVyQ2FsbGJhY2tIYW5kbGVyIHtcbiAgLyoqXG4gICAqIFZhbGlkYXRlIHRoYXQgaXQncyBzYWZlIGZvciBhIHJlbmRlciBvcGVyYXRpb24gdG8gYmVnaW4sXG4gICAqIHRocm93aW5nIGlmIG5vdC4gTm90IGd1YXJhbnRlZWQgdG8gYmUgY2FsbGVkIGlmIGEgcmVuZGVyXG4gICAqIG9wZXJhdGlvbiBpcyBzdGFydGVkIGJlZm9yZSBoYW5kbGVyIHdhcyByZWdpc3RlcmVkLlxuICAgKi9cbiAgdmFsaWRhdGVCZWdpbigpOiB2b2lkO1xuXG4gIC8qKlxuICAgKiBSZWdpc3RlciBhIG5ldyBjYWxsYmFjay5cbiAgICovXG4gIHJlZ2lzdGVyKGNhbGxiYWNrOiBBZnRlclJlbmRlckNhbGxiYWNrKTogdm9pZDtcblxuICAvKipcbiAgICogVW5yZWdpc3RlciBhbiBleGlzdGluZyBjYWxsYmFjay5cbiAgICovXG4gIHVucmVnaXN0ZXIoY2FsbGJhY2s6IEFmdGVyUmVuZGVyQ2FsbGJhY2spOiB2b2lkO1xuXG4gIC8qKlxuICAgKiBFeGVjdXRlIGNhbGxiYWNrcy5cbiAgICovXG4gIGV4ZWN1dGUoKTogdm9pZDtcblxuICAvKipcbiAgICogUGVyZm9ybSBhbnkgbmVjZXNzYXJ5IGNsZWFudXAuXG4gICAqL1xuICBkZXN0cm95KCk6IHZvaWQ7XG59XG5cbi8qKlxuICogQ29yZSBmdW5jdGlvbmFsaXR5IGZvciBgYWZ0ZXJSZW5kZXJgIGFuZCBgYWZ0ZXJOZXh0UmVuZGVyYC4gS2VwdCBzZXBhcmF0ZSBmcm9tXG4gKiBgQWZ0ZXJSZW5kZXJFdmVudE1hbmFnZXJgIGZvciB0cmVlLXNoYWtpbmcuXG4gKi9cbmNsYXNzIEFmdGVyUmVuZGVyQ2FsbGJhY2tIYW5kbGVySW1wbCBpbXBsZW1lbnRzIEFmdGVyUmVuZGVyQ2FsbGJhY2tIYW5kbGVyIHtcbiAgcHJpdmF0ZSBleGVjdXRpbmdDYWxsYmFja3MgPSBmYWxzZTtcbiAgcHJpdmF0ZSBidWNrZXRzID0ge1xuICAgIC8vIE5vdGU6IHRoZSBvcmRlciBvZiB0aGVzZSBrZXlzIGNvbnRyb2xzIHRoZSBvcmRlciB0aGUgcGhhc2VzIGFyZSBydW4uXG4gICAgW0FmdGVyUmVuZGVyUGhhc2UuRWFybHlSZWFkXTogbmV3IFNldDxBZnRlclJlbmRlckNhbGxiYWNrPigpLFxuICAgIFtBZnRlclJlbmRlclBoYXNlLldyaXRlXTogbmV3IFNldDxBZnRlclJlbmRlckNhbGxiYWNrPigpLFxuICAgIFtBZnRlclJlbmRlclBoYXNlLk1peGVkUmVhZFdyaXRlXTogbmV3IFNldDxBZnRlclJlbmRlckNhbGxiYWNrPigpLFxuICAgIFtBZnRlclJlbmRlclBoYXNlLlJlYWRdOiBuZXcgU2V0PEFmdGVyUmVuZGVyQ2FsbGJhY2s+KCksXG4gIH07XG4gIHByaXZhdGUgZGVmZXJyZWRDYWxsYmFja3MgPSBuZXcgU2V0PEFmdGVyUmVuZGVyQ2FsbGJhY2s+KCk7XG5cbiAgdmFsaWRhdGVCZWdpbigpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5leGVjdXRpbmdDYWxsYmFja3MpIHtcbiAgICAgIHRocm93IG5ldyBSdW50aW1lRXJyb3IoXG4gICAgICAgICAgUnVudGltZUVycm9yQ29kZS5SRUNVUlNJVkVfQVBQTElDQVRJT05fUkVOREVSLFxuICAgICAgICAgIG5nRGV2TW9kZSAmJlxuICAgICAgICAgICAgICAnQSBuZXcgcmVuZGVyIG9wZXJhdGlvbiBiZWdhbiBiZWZvcmUgdGhlIHByZXZpb3VzIG9wZXJhdGlvbiBlbmRlZC4gJyArXG4gICAgICAgICAgICAgICAgICAnRGlkIHlvdSB0cmlnZ2VyIGNoYW5nZSBkZXRlY3Rpb24gZnJvbSBhZnRlclJlbmRlciBvciBhZnRlck5leHRSZW5kZXI/Jyk7XG4gICAgfVxuICB9XG5cbiAgcmVnaXN0ZXIoY2FsbGJhY2s6IEFmdGVyUmVuZGVyQ2FsbGJhY2spOiB2b2lkIHtcbiAgICAvLyBJZiB3ZSdyZSBjdXJyZW50bHkgcnVubmluZyBjYWxsYmFja3MsIG5ldyBjYWxsYmFja3Mgc2hvdWxkIGJlIGRlZmVycmVkXG4gICAgLy8gdW50aWwgdGhlIG5leHQgcmVuZGVyIG9wZXJhdGlvbi5cbiAgICBjb25zdCB0YXJnZXQgPSB0aGlzLmV4ZWN1dGluZ0NhbGxiYWNrcyA/IHRoaXMuZGVmZXJyZWRDYWxsYmFja3MgOiB0aGlzLmJ1Y2tldHNbY2FsbGJhY2sucGhhc2VdO1xuICAgIHRhcmdldC5hZGQoY2FsbGJhY2spO1xuICB9XG5cbiAgdW5yZWdpc3RlcihjYWxsYmFjazogQWZ0ZXJSZW5kZXJDYWxsYmFjayk6IHZvaWQge1xuICAgIHRoaXMuYnVja2V0c1tjYWxsYmFjay5waGFzZV0uZGVsZXRlKGNhbGxiYWNrKTtcbiAgICB0aGlzLmRlZmVycmVkQ2FsbGJhY2tzLmRlbGV0ZShjYWxsYmFjayk7XG4gIH1cblxuICBleGVjdXRlKCk6IHZvaWQge1xuICAgIHRoaXMuZXhlY3V0aW5nQ2FsbGJhY2tzID0gdHJ1ZTtcbiAgICBmb3IgKGNvbnN0IGJ1Y2tldCBvZiBPYmplY3QudmFsdWVzKHRoaXMuYnVja2V0cykpIHtcbiAgICAgIGZvciAoY29uc3QgY2FsbGJhY2sgb2YgYnVja2V0KSB7XG4gICAgICAgIGNhbGxiYWNrLmludm9rZSgpO1xuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLmV4ZWN1dGluZ0NhbGxiYWNrcyA9IGZhbHNlO1xuXG4gICAgZm9yIChjb25zdCBjYWxsYmFjayBvZiB0aGlzLmRlZmVycmVkQ2FsbGJhY2tzKSB7XG4gICAgICB0aGlzLmJ1Y2tldHNbY2FsbGJhY2sucGhhc2VdLmFkZChjYWxsYmFjayk7XG4gICAgfVxuICAgIHRoaXMuZGVmZXJyZWRDYWxsYmFja3MuY2xlYXIoKTtcbiAgfVxuXG4gIGRlc3Ryb3koKTogdm9pZCB7XG4gICAgZm9yIChjb25zdCBidWNrZXQgb2YgT2JqZWN0LnZhbHVlcyh0aGlzLmJ1Y2tldHMpKSB7XG4gICAgICBidWNrZXQuY2xlYXIoKTtcbiAgICB9XG4gICAgdGhpcy5kZWZlcnJlZENhbGxiYWNrcy5jbGVhcigpO1xuICB9XG59XG5cbi8qKlxuICogSW1wbGVtZW50cyBjb3JlIHRpbWluZyBmb3IgYGFmdGVyUmVuZGVyYCBhbmQgYGFmdGVyTmV4dFJlbmRlcmAgZXZlbnRzLlxuICogRGVsZWdhdGVzIHRvIGFuIG9wdGlvbmFsIGBBZnRlclJlbmRlckNhbGxiYWNrSGFuZGxlcmAgZm9yIGltcGxlbWVudGF0aW9uLlxuICovXG5leHBvcnQgY2xhc3MgQWZ0ZXJSZW5kZXJFdmVudE1hbmFnZXIge1xuICBwcml2YXRlIHJlbmRlckRlcHRoID0gMDtcblxuICAvKiBAaW50ZXJuYWwgKi9cbiAgaGFuZGxlcjogQWZ0ZXJSZW5kZXJDYWxsYmFja0hhbmRsZXJ8bnVsbCA9IG51bGw7XG5cbiAgLyogQGludGVybmFsICovXG4gIGludGVybmFsQ2FsbGJhY2tzOiBWb2lkRnVuY3Rpb25bXSA9IFtdO1xuXG4gIC8qKlxuICAgKiBNYXJrIHRoZSBiZWdpbm5pbmcgb2YgYSByZW5kZXIgb3BlcmF0aW9uIChpLmUuIENEIGN5Y2xlKS5cbiAgICogVGhyb3dzIGlmIGNhbGxlZCB3aGlsZSBleGVjdXRpbmcgY2FsbGJhY2tzLlxuICAgKi9cbiAgYmVnaW4oKSB7XG4gICAgdGhpcy5oYW5kbGVyPy52YWxpZGF0ZUJlZ2luKCk7XG4gICAgdGhpcy5yZW5kZXJEZXB0aCsrO1xuICB9XG5cbiAgLyoqXG4gICAqIE1hcmsgdGhlIGVuZCBvZiBhIHJlbmRlciBvcGVyYXRpb24uIENhbGxiYWNrcyB3aWxsIGJlXG4gICAqIGV4ZWN1dGVkIGlmIHRoZXJlIGFyZSBubyBtb3JlIHBlbmRpbmcgb3BlcmF0aW9ucy5cbiAgICovXG4gIGVuZCgpIHtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0R3JlYXRlclRoYW4odGhpcy5yZW5kZXJEZXB0aCwgMCwgJ3JlbmRlckRlcHRoIG11c3QgYmUgZ3JlYXRlciB0aGFuIDAnKTtcbiAgICB0aGlzLnJlbmRlckRlcHRoLS07XG5cbiAgICBpZiAodGhpcy5yZW5kZXJEZXB0aCA9PT0gMCkge1xuICAgICAgLy8gTm90ZTogaW50ZXJuYWwgY2FsbGJhY2tzIHBvd2VyIGBpbnRlcm5hbEFmdGVyTmV4dFJlbmRlcmAuIFNpbmNlIGludGVybmFsIGNhbGxiYWNrc1xuICAgICAgLy8gYXJlIGZhaXJseSB0cml2aWFsLCB0aGV5IGFyZSBrZXB0IHNlcGFyYXRlIHNvIHRoYXQgYEFmdGVyUmVuZGVyQ2FsbGJhY2tIYW5kbGVySW1wbGBcbiAgICAgIC8vIGNhbiBzdGlsbCBiZSB0cmVlLXNoYWtlbiB1bmxlc3MgdXNlZCBieSB0aGUgYXBwbGljYXRpb24uXG4gICAgICBmb3IgKGNvbnN0IGNhbGxiYWNrIG9mIHRoaXMuaW50ZXJuYWxDYWxsYmFja3MpIHtcbiAgICAgICAgY2FsbGJhY2soKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuaW50ZXJuYWxDYWxsYmFja3MubGVuZ3RoID0gMDtcbiAgICAgIHRoaXMuaGFuZGxlcj8uZXhlY3V0ZSgpO1xuICAgIH1cbiAgfVxuXG4gIG5nT25EZXN0cm95KCkge1xuICAgIHRoaXMuaGFuZGxlcj8uZGVzdHJveSgpO1xuICAgIHRoaXMuaGFuZGxlciA9IG51bGw7XG4gICAgdGhpcy5pbnRlcm5hbENhbGxiYWNrcy5sZW5ndGggPSAwO1xuICB9XG5cbiAgLyoqIEBub2NvbGxhcHNlICovXG4gIHN0YXRpYyDJtXByb3YgPSAvKiogQHB1cmVPckJyZWFrTXlDb2RlICovIMm1ybVkZWZpbmVJbmplY3RhYmxlKHtcbiAgICB0b2tlbjogQWZ0ZXJSZW5kZXJFdmVudE1hbmFnZXIsXG4gICAgcHJvdmlkZWRJbjogJ3Jvb3QnLFxuICAgIGZhY3Rvcnk6ICgpID0+IG5ldyBBZnRlclJlbmRlckV2ZW50TWFuYWdlcigpLFxuICB9KTtcbn1cbiJdfQ==