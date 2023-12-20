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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWZ0ZXJfcmVuZGVyX2hvb2tzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9hZnRlcl9yZW5kZXJfaG9va3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLDBCQUEwQixFQUFDLE1BQU0sb0NBQW9DLENBQUM7QUFDOUUsT0FBTyxFQUFDLHdCQUF3QixFQUFFLFFBQVEsRUFBRSxrQkFBa0IsRUFBQyxNQUFNLE9BQU8sQ0FBQztBQUM3RSxPQUFPLEVBQUMsTUFBTSxFQUFDLE1BQU0sOEJBQThCLENBQUM7QUFDcEQsT0FBTyxFQUFDLFlBQVksRUFBQyxNQUFNLGtCQUFrQixDQUFDO0FBQzlDLE9BQU8sRUFBQyxZQUFZLEVBQW1CLE1BQU0sV0FBVyxDQUFDO0FBQ3pELE9BQU8sRUFBQyxVQUFVLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUNqRCxPQUFPLEVBQUMsaUJBQWlCLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUNqRCxPQUFPLEVBQUMsc0JBQXNCLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUMzRCxPQUFPLEVBQUMsTUFBTSxFQUFDLE1BQU0saUJBQWlCLENBQUM7QUFFdkMsT0FBTyxFQUFDLGlCQUFpQixFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFFcEQ7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7R0FtQkc7QUFDSCxNQUFNLENBQU4sSUFBWSxnQkF5Q1g7QUF6Q0QsV0FBWSxnQkFBZ0I7SUFDMUI7Ozs7Ozs7Ozs7OztPQVlHO0lBQ0gsaUVBQVMsQ0FBQTtJQUVUOzs7T0FHRztJQUNILHlEQUFLLENBQUE7SUFFTDs7Ozs7Ozs7Ozs7T0FXRztJQUNILDJFQUFjLENBQUE7SUFFZDs7O09BR0c7SUFDSCx1REFBSSxDQUFBO0FBQ04sQ0FBQyxFQXpDVyxnQkFBZ0IsS0FBaEIsZ0JBQWdCLFFBeUMzQjtBQW9ERCwwQ0FBMEM7QUFDMUMsTUFBTSxxQkFBcUIsR0FBbUI7SUFDNUMsT0FBTyxLQUFJLENBQUM7Q0FDYixDQUFDO0FBRUY7Ozs7Ozs7Ozs7Ozs7O0dBY0c7QUFDSCxNQUFNLFVBQVUsdUJBQXVCLENBQ25DLFFBQXNCLEVBQUUsT0FBd0M7SUFDbEUsTUFBTSxRQUFRLEdBQUcsT0FBTyxFQUFFLFFBQVEsSUFBSSxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUM7SUFFdkQsc0VBQXNFO0lBQ3RFLGdDQUFnQztJQUNoQyxJQUFJLENBQUMsaUJBQWlCLENBQUMsUUFBUSxDQUFDO1FBQUUsT0FBTztJQUV6QyxNQUFNLHVCQUF1QixHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsdUJBQXVCLENBQUMsQ0FBQztJQUN0RSx1QkFBdUIsQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7QUFDM0QsQ0FBQztBQUVEOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztHQStDRztBQUNILE1BQU0sVUFBVSxXQUFXLENBQUMsUUFBc0IsRUFBRSxPQUE0QjtJQUM5RSxTQUFTO1FBQ0wsMEJBQTBCLENBQ3RCLFdBQVcsRUFDWCxxRkFBcUY7WUFDakYsNkNBQTZDLENBQUMsQ0FBQztJQUUzRCxDQUFDLE9BQU8sSUFBSSx3QkFBd0IsQ0FBQyxXQUFXLENBQUMsQ0FBQztJQUNsRCxNQUFNLFFBQVEsR0FBRyxPQUFPLEVBQUUsUUFBUSxJQUFJLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUV2RCxJQUFJLENBQUMsaUJBQWlCLENBQUMsUUFBUSxDQUFDLEVBQUU7UUFDaEMsT0FBTyxxQkFBcUIsQ0FBQztLQUM5QjtJQUVELHNCQUFzQixDQUFDLGVBQWUsQ0FBQyxDQUFDO0lBRXhDLE1BQU0sdUJBQXVCLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDO0lBQ3RFLHdGQUF3RjtJQUN4RixrRUFBa0U7SUFDbEUsTUFBTSxlQUFlLEdBQUcsdUJBQXVCLENBQUMsT0FBTyxLQUFLLElBQUksOEJBQThCLEVBQUUsQ0FBQztJQUNqRyxNQUFNLEtBQUssR0FBRyxPQUFPLEVBQUUsS0FBSyxJQUFJLGdCQUFnQixDQUFDLGNBQWMsQ0FBQztJQUNoRSxNQUFNLE9BQU8sR0FBRyxHQUFHLEVBQUU7UUFDbkIsZUFBZSxDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUNyQyxZQUFZLEVBQUUsQ0FBQztJQUNqQixDQUFDLENBQUM7SUFDRixNQUFNLFlBQVksR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUNqRSxNQUFNLFFBQVEsR0FBRyxJQUFJLG1CQUFtQixDQUFDLFFBQVEsRUFBRSxLQUFLLEVBQUUsUUFBUSxDQUFDLENBQUM7SUFFcEUsZUFBZSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUNuQyxPQUFPLEVBQUMsT0FBTyxFQUFDLENBQUM7QUFDbkIsQ0FBQztBQUVEOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7R0FnREc7QUFDSCxNQUFNLFVBQVUsZUFBZSxDQUMzQixRQUFzQixFQUFFLE9BQTRCO0lBQ3RELENBQUMsT0FBTyxJQUFJLHdCQUF3QixDQUFDLGVBQWUsQ0FBQyxDQUFDO0lBQ3RELE1BQU0sUUFBUSxHQUFHLE9BQU8sRUFBRSxRQUFRLElBQUksTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBRXZELElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxRQUFRLENBQUMsRUFBRTtRQUNoQyxPQUFPLHFCQUFxQixDQUFDO0tBQzlCO0lBRUQsc0JBQXNCLENBQUMsbUJBQW1CLENBQUMsQ0FBQztJQUU1QyxNQUFNLHVCQUF1QixHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsdUJBQXVCLENBQUMsQ0FBQztJQUN0RSx3RkFBd0Y7SUFDeEYsa0VBQWtFO0lBQ2xFLE1BQU0sZUFBZSxHQUFHLHVCQUF1QixDQUFDLE9BQU8sS0FBSyxJQUFJLDhCQUE4QixFQUFFLENBQUM7SUFDakcsTUFBTSxLQUFLLEdBQUcsT0FBTyxFQUFFLEtBQUssSUFBSSxnQkFBZ0IsQ0FBQyxjQUFjLENBQUM7SUFDaEUsTUFBTSxPQUFPLEdBQUcsR0FBRyxFQUFFO1FBQ25CLGVBQWUsQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDckMsWUFBWSxFQUFFLENBQUM7SUFDakIsQ0FBQyxDQUFDO0lBQ0YsTUFBTSxZQUFZLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDakUsTUFBTSxRQUFRLEdBQUcsSUFBSSxtQkFBbUIsQ0FBQyxRQUFRLEVBQUUsS0FBSyxFQUFFLEdBQUcsRUFBRTtRQUM3RCxPQUFPLEVBQUUsQ0FBQztRQUNWLFFBQVEsRUFBRSxDQUFDO0lBQ2IsQ0FBQyxDQUFDLENBQUM7SUFFSCxlQUFlLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQ25DLE9BQU8sRUFBQyxPQUFPLEVBQUMsQ0FBQztBQUNuQixDQUFDO0FBRUQ7O0dBRUc7QUFDSCxNQUFNLG1CQUFtQjtJQUl2QixZQUNJLFFBQWtCLEVBQWtCLEtBQXVCLEVBQ25ELFVBQXdCO1FBREksVUFBSyxHQUFMLEtBQUssQ0FBa0I7UUFDbkQsZUFBVSxHQUFWLFVBQVUsQ0FBYztRQUNsQyxJQUFJLENBQUMsSUFBSSxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDakMsSUFBSSxDQUFDLFlBQVksR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLFlBQVksRUFBRSxJQUFJLEVBQUUsRUFBQyxRQUFRLEVBQUUsSUFBSSxFQUFDLENBQUMsQ0FBQztJQUN6RSxDQUFDO0lBRUQsTUFBTTtRQUNKLElBQUk7WUFDRixJQUFJLENBQUMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztTQUM5QztRQUFDLE9BQU8sR0FBRyxFQUFFO1lBQ1osSUFBSSxDQUFDLFlBQVksRUFBRSxXQUFXLENBQUMsR0FBRyxDQUFDLENBQUM7U0FDckM7SUFDSCxDQUFDO0NBQ0Y7QUFrQ0Q7OztHQUdHO0FBQ0gsTUFBTSw4QkFBOEI7SUFBcEM7UUFDVSx1QkFBa0IsR0FBRyxLQUFLLENBQUM7UUFDM0IsWUFBTyxHQUFHO1lBQ2hCLHVFQUF1RTtZQUN2RSxDQUFDLGdCQUFnQixDQUFDLFNBQVMsQ0FBQyxFQUFFLElBQUksR0FBRyxFQUF1QjtZQUM1RCxDQUFDLGdCQUFnQixDQUFDLEtBQUssQ0FBQyxFQUFFLElBQUksR0FBRyxFQUF1QjtZQUN4RCxDQUFDLGdCQUFnQixDQUFDLGNBQWMsQ0FBQyxFQUFFLElBQUksR0FBRyxFQUF1QjtZQUNqRSxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxFQUFFLElBQUksR0FBRyxFQUF1QjtTQUN4RCxDQUFDO1FBQ00sc0JBQWlCLEdBQUcsSUFBSSxHQUFHLEVBQXVCLENBQUM7SUE2QzdELENBQUM7SUEzQ0MsYUFBYTtRQUNYLElBQUksSUFBSSxDQUFDLGtCQUFrQixFQUFFO1lBQzNCLE1BQU0sSUFBSSxZQUFZLDBEQUVsQixTQUFTO2dCQUNMLG9FQUFvRTtvQkFDaEUsdUVBQXVFLENBQUMsQ0FBQztTQUN0RjtJQUNILENBQUM7SUFFRCxRQUFRLENBQUMsUUFBNkI7UUFDcEMseUVBQXlFO1FBQ3pFLG1DQUFtQztRQUNuQyxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDL0YsTUFBTSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUN2QixDQUFDO0lBRUQsVUFBVSxDQUFDLFFBQTZCO1FBQ3RDLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUM5QyxJQUFJLENBQUMsaUJBQWlCLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQzFDLENBQUM7SUFFRCxPQUFPO1FBQ0wsSUFBSSxDQUFDLGtCQUFrQixHQUFHLElBQUksQ0FBQztRQUMvQixLQUFLLE1BQU0sTUFBTSxJQUFJLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxFQUFFO1lBQ2hELEtBQUssTUFBTSxRQUFRLElBQUksTUFBTSxFQUFFO2dCQUM3QixRQUFRLENBQUMsTUFBTSxFQUFFLENBQUM7YUFDbkI7U0FDRjtRQUNELElBQUksQ0FBQyxrQkFBa0IsR0FBRyxLQUFLLENBQUM7UUFFaEMsS0FBSyxNQUFNLFFBQVEsSUFBSSxJQUFJLENBQUMsaUJBQWlCLEVBQUU7WUFDN0MsSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1NBQzVDO1FBQ0QsSUFBSSxDQUFDLGlCQUFpQixDQUFDLEtBQUssRUFBRSxDQUFDO0lBQ2pDLENBQUM7SUFFRCxPQUFPO1FBQ0wsS0FBSyxNQUFNLE1BQU0sSUFBSSxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRTtZQUNoRCxNQUFNLENBQUMsS0FBSyxFQUFFLENBQUM7U0FDaEI7UUFDRCxJQUFJLENBQUMsaUJBQWlCLENBQUMsS0FBSyxFQUFFLENBQUM7SUFDakMsQ0FBQztDQUNGO0FBRUQ7OztHQUdHO0FBQ0gsTUFBTSxPQUFPLHVCQUF1QjtJQUFwQztRQUNVLGdCQUFXLEdBQUcsQ0FBQyxDQUFDO1FBRXhCLGVBQWU7UUFDZixZQUFPLEdBQW9DLElBQUksQ0FBQztRQUVoRCxlQUFlO1FBQ2Ysc0JBQWlCLEdBQW1CLEVBQUUsQ0FBQztJQTJDekMsQ0FBQztJQXpDQzs7O09BR0c7SUFDSCxLQUFLO1FBQ0gsSUFBSSxDQUFDLE9BQU8sRUFBRSxhQUFhLEVBQUUsQ0FBQztRQUM5QixJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7SUFDckIsQ0FBQztJQUVEOzs7T0FHRztJQUNILEdBQUc7UUFDRCxTQUFTLElBQUksaUJBQWlCLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDLEVBQUUsb0NBQW9DLENBQUMsQ0FBQztRQUMxRixJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7UUFFbkIsSUFBSSxJQUFJLENBQUMsV0FBVyxLQUFLLENBQUMsRUFBRTtZQUMxQixxRkFBcUY7WUFDckYsc0ZBQXNGO1lBQ3RGLDJEQUEyRDtZQUMzRCxLQUFLLE1BQU0sUUFBUSxJQUFJLElBQUksQ0FBQyxpQkFBaUIsRUFBRTtnQkFDN0MsUUFBUSxFQUFFLENBQUM7YUFDWjtZQUNELElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO1lBQ2xDLElBQUksQ0FBQyxPQUFPLEVBQUUsT0FBTyxFQUFFLENBQUM7U0FDekI7SUFDSCxDQUFDO0lBRUQsV0FBVztRQUNULElBQUksQ0FBQyxPQUFPLEVBQUUsT0FBTyxFQUFFLENBQUM7UUFDeEIsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUM7UUFDcEIsSUFBSSxDQUFDLGlCQUFpQixDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUM7SUFDcEMsQ0FBQztJQUVELGtCQUFrQjthQUNYLFVBQUssR0FBNkIsa0JBQWtCLENBQUM7UUFDMUQsS0FBSyxFQUFFLHVCQUF1QjtRQUM5QixVQUFVLEVBQUUsTUFBTTtRQUNsQixPQUFPLEVBQUUsR0FBRyxFQUFFLENBQUMsSUFBSSx1QkFBdUIsRUFBRTtLQUM3QyxDQUFDLEFBSlUsQ0FJVCIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge2Fzc2VydE5vdEluUmVhY3RpdmVDb250ZXh0fSBmcm9tICcuLi9jb3JlX3JlYWN0aXZpdHlfZXhwb3J0X2ludGVybmFsJztcbmltcG9ydCB7YXNzZXJ0SW5JbmplY3Rpb25Db250ZXh0LCBJbmplY3RvciwgybXJtWRlZmluZUluamVjdGFibGV9IGZyb20gJy4uL2RpJztcbmltcG9ydCB7aW5qZWN0fSBmcm9tICcuLi9kaS9pbmplY3Rvcl9jb21wYXRpYmlsaXR5JztcbmltcG9ydCB7RXJyb3JIYW5kbGVyfSBmcm9tICcuLi9lcnJvcl9oYW5kbGVyJztcbmltcG9ydCB7UnVudGltZUVycm9yLCBSdW50aW1lRXJyb3JDb2RlfSBmcm9tICcuLi9lcnJvcnMnO1xuaW1wb3J0IHtEZXN0cm95UmVmfSBmcm9tICcuLi9saW5rZXIvZGVzdHJveV9yZWYnO1xuaW1wb3J0IHthc3NlcnRHcmVhdGVyVGhhbn0gZnJvbSAnLi4vdXRpbC9hc3NlcnQnO1xuaW1wb3J0IHtwZXJmb3JtYW5jZU1hcmtGZWF0dXJlfSBmcm9tICcuLi91dGlsL3BlcmZvcm1hbmNlJztcbmltcG9ydCB7Tmdab25lfSBmcm9tICcuLi96b25lL25nX3pvbmUnO1xuXG5pbXBvcnQge2lzUGxhdGZvcm1Ccm93c2VyfSBmcm9tICcuL3V0aWwvbWlzY191dGlscyc7XG5cbi8qKlxuICogVGhlIHBoYXNlIHRvIHJ1biBhbiBgYWZ0ZXJSZW5kZXJgIG9yIGBhZnRlck5leHRSZW5kZXJgIGNhbGxiYWNrIGluLlxuICpcbiAqIENhbGxiYWNrcyBpbiB0aGUgc2FtZSBwaGFzZSBydW4gaW4gdGhlIG9yZGVyIHRoZXkgYXJlIHJlZ2lzdGVyZWQuIFBoYXNlcyBydW4gaW4gdGhlXG4gKiBmb2xsb3dpbmcgb3JkZXIgYWZ0ZXIgZWFjaCByZW5kZXI6XG4gKlxuICogICAxLiBgQWZ0ZXJSZW5kZXJQaGFzZS5FYXJseVJlYWRgXG4gKiAgIDIuIGBBZnRlclJlbmRlclBoYXNlLldyaXRlYFxuICogICAzLiBgQWZ0ZXJSZW5kZXJQaGFzZS5NaXhlZFJlYWRXcml0ZWBcbiAqICAgNC4gYEFmdGVyUmVuZGVyUGhhc2UuUmVhZGBcbiAqXG4gKiBBbmd1bGFyIGlzIHVuYWJsZSB0byB2ZXJpZnkgb3IgZW5mb3JjZSB0aGF0IHBoYXNlcyBhcmUgdXNlZCBjb3JyZWN0bHksIGFuZCBpbnN0ZWFkXG4gKiByZWxpZXMgb24gZWFjaCBkZXZlbG9wZXIgdG8gZm9sbG93IHRoZSBndWlkZWxpbmVzIGRvY3VtZW50ZWQgZm9yIGVhY2ggdmFsdWUgYW5kXG4gKiBjYXJlZnVsbHkgY2hvb3NlIHRoZSBhcHByb3ByaWF0ZSBvbmUsIHJlZmFjdG9yaW5nIHRoZWlyIGNvZGUgaWYgbmVjZXNzYXJ5LiBCeSBkb2luZ1xuICogc28sIEFuZ3VsYXIgaXMgYmV0dGVyIGFibGUgdG8gbWluaW1pemUgdGhlIHBlcmZvcm1hbmNlIGRlZ3JhZGF0aW9uIGFzc29jaWF0ZWQgd2l0aFxuICogbWFudWFsIERPTSBhY2Nlc3MsIGVuc3VyaW5nIHRoZSBiZXN0IGV4cGVyaWVuY2UgZm9yIHRoZSBlbmQgdXNlcnMgb2YgeW91ciBhcHBsaWNhdGlvblxuICogb3IgbGlicmFyeS5cbiAqXG4gKiBAZGV2ZWxvcGVyUHJldmlld1xuICovXG5leHBvcnQgZW51bSBBZnRlclJlbmRlclBoYXNlIHtcbiAgLyoqXG4gICAqIFVzZSBgQWZ0ZXJSZW5kZXJQaGFzZS5FYXJseVJlYWRgIGZvciBjYWxsYmFja3MgdGhhdCBvbmx5IG5lZWQgdG8gKipyZWFkKiogZnJvbSB0aGVcbiAgICogRE9NIGJlZm9yZSBhIHN1YnNlcXVlbnQgYEFmdGVyUmVuZGVyUGhhc2UuV3JpdGVgIGNhbGxiYWNrLCBmb3IgZXhhbXBsZSB0byBwZXJmb3JtXG4gICAqIGN1c3RvbSBsYXlvdXQgdGhhdCB0aGUgYnJvd3NlciBkb2Vzbid0IG5hdGl2ZWx5IHN1cHBvcnQuICoqTmV2ZXIqKiB1c2UgdGhpcyBwaGFzZVxuICAgKiBmb3IgY2FsbGJhY2tzIHRoYXQgY2FuIHdyaXRlIHRvIHRoZSBET00gb3Igd2hlbiBgQWZ0ZXJSZW5kZXJQaGFzZS5SZWFkYCBpcyBhZGVxdWF0ZS5cbiAgICpcbiAgICogPGRpdiBjbGFzcz1cImFsZXJ0IGlzLWltcG9ydGFudFwiPlxuICAgKlxuICAgKiBVc2luZyB0aGlzIHZhbHVlIGNhbiBkZWdyYWRlIHBlcmZvcm1hbmNlLlxuICAgKiBJbnN0ZWFkLCBwcmVmZXIgdXNpbmcgYnVpbHQtaW4gYnJvd3NlciBmdW5jdGlvbmFsaXR5IHdoZW4gcG9zc2libGUuXG4gICAqXG4gICAqIDwvZGl2PlxuICAgKi9cbiAgRWFybHlSZWFkLFxuXG4gIC8qKlxuICAgKiBVc2UgYEFmdGVyUmVuZGVyUGhhc2UuV3JpdGVgIGZvciBjYWxsYmFja3MgdGhhdCBvbmx5ICoqd3JpdGUqKiB0byB0aGUgRE9NLiAqKk5ldmVyKipcbiAgICogdXNlIHRoaXMgcGhhc2UgZm9yIGNhbGxiYWNrcyB0aGF0IGNhbiByZWFkIGZyb20gdGhlIERPTS5cbiAgICovXG4gIFdyaXRlLFxuXG4gIC8qKlxuICAgKiBVc2UgYEFmdGVyUmVuZGVyUGhhc2UuTWl4ZWRSZWFkV3JpdGVgIGZvciBjYWxsYmFja3MgdGhhdCByZWFkIGZyb20gb3Igd3JpdGUgdG8gdGhlXG4gICAqIERPTSwgdGhhdCBoYXZlbid0IGJlZW4gcmVmYWN0b3JlZCB0byB1c2UgYSBkaWZmZXJlbnQgcGhhc2UuICoqTmV2ZXIqKiB1c2UgdGhpcyBwaGFzZVxuICAgKiBmb3IgY2FsbGJhY2tzIHRoYXQgY2FuIHVzZSBhIGRpZmZlcmVudCBwaGFzZSBpbnN0ZWFkLlxuICAgKlxuICAgKiA8ZGl2IGNsYXNzPVwiYWxlcnQgaXMtY3JpdGljYWxcIj5cbiAgICpcbiAgICogVXNpbmcgdGhpcyB2YWx1ZSBjYW4gKipzaWduaWZpY2FudGx5KiogZGVncmFkZSBwZXJmb3JtYW5jZS5cbiAgICogSW5zdGVhZCwgcHJlZmVyIHJlZmFjdG9yaW5nIGludG8gbXVsdGlwbGUgY2FsbGJhY2tzIHVzaW5nIGEgbW9yZSBzcGVjaWZpYyBwaGFzZS5cbiAgICpcbiAgICogPC9kaXY+XG4gICAqL1xuICBNaXhlZFJlYWRXcml0ZSxcblxuICAvKipcbiAgICogVXNlIGBBZnRlclJlbmRlclBoYXNlLlJlYWRgIGZvciBjYWxsYmFja3MgdGhhdCBvbmx5ICoqcmVhZCoqIGZyb20gdGhlIERPTS4gKipOZXZlcioqXG4gICAqIHVzZSB0aGlzIHBoYXNlIGZvciBjYWxsYmFja3MgdGhhdCBjYW4gd3JpdGUgdG8gdGhlIERPTS5cbiAgICovXG4gIFJlYWQsXG59XG5cbi8qKlxuICogT3B0aW9ucyBwYXNzZWQgdG8gYGFmdGVyUmVuZGVyYCBhbmQgYGFmdGVyTmV4dFJlbmRlcmAuXG4gKlxuICogQGRldmVsb3BlclByZXZpZXdcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBBZnRlclJlbmRlck9wdGlvbnMge1xuICAvKipcbiAgICogVGhlIGBJbmplY3RvcmAgdG8gdXNlIGR1cmluZyBjcmVhdGlvbi5cbiAgICpcbiAgICogSWYgdGhpcyBpcyBub3QgcHJvdmlkZWQsIHRoZSBjdXJyZW50IGluamVjdGlvbiBjb250ZXh0IHdpbGwgYmUgdXNlZCBpbnN0ZWFkICh2aWEgYGluamVjdGApLlxuICAgKi9cbiAgaW5qZWN0b3I/OiBJbmplY3RvcjtcblxuICAvKipcbiAgICogVGhlIHBoYXNlIHRoZSBjYWxsYmFjayBzaG91bGQgYmUgaW52b2tlZCBpbi5cbiAgICpcbiAgICogPGRpdiBjbGFzcz1cImFsZXJ0IGlzLWNyaXRpY2FsXCI+XG4gICAqXG4gICAqIERlZmF1bHRzIHRvIGBBZnRlclJlbmRlclBoYXNlLk1peGVkUmVhZFdyaXRlYC4gWW91IHNob3VsZCBjaG9vc2UgYSBtb3JlIHNwZWNpZmljXG4gICAqIHBoYXNlIGluc3RlYWQuIFNlZSBgQWZ0ZXJSZW5kZXJQaGFzZWAgZm9yIG1vcmUgaW5mb3JtYXRpb24uXG4gICAqXG4gICAqIDwvZGl2PlxuICAgKi9cbiAgcGhhc2U/OiBBZnRlclJlbmRlclBoYXNlO1xufVxuXG4vKipcbiAqIEEgY2FsbGJhY2sgdGhhdCBydW5zIGFmdGVyIHJlbmRlci5cbiAqXG4gKiBAZGV2ZWxvcGVyUHJldmlld1xuICovXG5leHBvcnQgaW50ZXJmYWNlIEFmdGVyUmVuZGVyUmVmIHtcbiAgLyoqXG4gICAqIFNodXQgZG93biB0aGUgY2FsbGJhY2ssIHByZXZlbnRpbmcgaXQgZnJvbSBiZWluZyBjYWxsZWQgYWdhaW4uXG4gICAqL1xuICBkZXN0cm95KCk6IHZvaWQ7XG59XG5cbi8qKlxuICogT3B0aW9ucyBwYXNzZWQgdG8gYGludGVybmFsQWZ0ZXJOZXh0UmVuZGVyYC5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBJbnRlcm5hbEFmdGVyTmV4dFJlbmRlck9wdGlvbnMge1xuICAvKipcbiAgICogVGhlIGBJbmplY3RvcmAgdG8gdXNlIGR1cmluZyBjcmVhdGlvbi5cbiAgICpcbiAgICogSWYgdGhpcyBpcyBub3QgcHJvdmlkZWQsIHRoZSBjdXJyZW50IGluamVjdGlvbiBjb250ZXh0IHdpbGwgYmUgdXNlZCBpbnN0ZWFkICh2aWEgYGluamVjdGApLlxuICAgKi9cbiAgaW5qZWN0b3I/OiBJbmplY3Rvcjtcbn1cblxuLyoqIGBBZnRlclJlbmRlclJlZmAgdGhhdCBkb2VzIG5vdGhpbmcuICovXG5jb25zdCBOT09QX0FGVEVSX1JFTkRFUl9SRUY6IEFmdGVyUmVuZGVyUmVmID0ge1xuICBkZXN0cm95KCkge31cbn07XG5cbi8qKlxuICogUmVnaXN0ZXIgYSBjYWxsYmFjayB0byBydW4gb25jZSBiZWZvcmUgYW55IHVzZXJzcGFjZSBgYWZ0ZXJSZW5kZXJgIG9yXG4gKiBgYWZ0ZXJOZXh0UmVuZGVyYCBjYWxsYmFja3MuXG4gKlxuICogVGhpcyBmdW5jdGlvbiBzaG91bGQgYWxtb3N0IGFsd2F5cyBiZSB1c2VkIGluc3RlYWQgb2YgYGFmdGVyUmVuZGVyYCBvclxuICogYGFmdGVyTmV4dFJlbmRlcmAgZm9yIGltcGxlbWVudGluZyBmcmFtZXdvcmsgZnVuY3Rpb25hbGl0eS4gQ29uc2lkZXI6XG4gKlxuICogICAxLikgYEFmdGVyUmVuZGVyUGhhc2UuRWFybHlSZWFkYCBpcyBpbnRlbmRlZCB0byBiZSB1c2VkIGZvciBpbXBsZW1lbnRpbmdcbiAqICAgICAgIGN1c3RvbSBsYXlvdXQuIElmIHRoZSBmcmFtZXdvcmsgaXRzZWxmIG11dGF0ZXMgdGhlIERPTSBhZnRlciAqYW55KlxuICogICAgICAgYEFmdGVyUmVuZGVyUGhhc2UuRWFybHlSZWFkYCBjYWxsYmFja3MgYXJlIHJ1biwgdGhlIHBoYXNlIGNhbiBub1xuICogICAgICAgbG9uZ2VyIHJlbGlhYmx5IHNlcnZlIGl0cyBwdXJwb3NlLlxuICpcbiAqICAgMi4pIEltcG9ydGluZyBgYWZ0ZXJSZW5kZXJgIGluIHRoZSBmcmFtZXdvcmsgY2FuIHJlZHVjZSB0aGUgYWJpbGl0eSBmb3IgaXRcbiAqICAgICAgIHRvIGJlIHRyZWUtc2hha2VuLCBhbmQgdGhlIGZyYW1ld29yayBzaG91bGRuJ3QgbmVlZCBtdWNoIG9mIHRoZSBiZWhhdmlvci5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGludGVybmFsQWZ0ZXJOZXh0UmVuZGVyKFxuICAgIGNhbGxiYWNrOiBWb2lkRnVuY3Rpb24sIG9wdGlvbnM/OiBJbnRlcm5hbEFmdGVyTmV4dFJlbmRlck9wdGlvbnMpIHtcbiAgY29uc3QgaW5qZWN0b3IgPSBvcHRpb25zPy5pbmplY3RvciA/PyBpbmplY3QoSW5qZWN0b3IpO1xuXG4gIC8vIFNpbWlsYXJseSB0byB0aGUgcHVibGljIGBhZnRlck5leHRSZW5kZXJgIGZ1bmN0aW9uLCBhbiBpbnRlcm5hbCBvbmVcbiAgLy8gaXMgb25seSBpbnZva2VkIGluIGEgYnJvd3Nlci5cbiAgaWYgKCFpc1BsYXRmb3JtQnJvd3NlcihpbmplY3RvcikpIHJldHVybjtcblxuICBjb25zdCBhZnRlclJlbmRlckV2ZW50TWFuYWdlciA9IGluamVjdG9yLmdldChBZnRlclJlbmRlckV2ZW50TWFuYWdlcik7XG4gIGFmdGVyUmVuZGVyRXZlbnRNYW5hZ2VyLmludGVybmFsQ2FsbGJhY2tzLnB1c2goY2FsbGJhY2spO1xufVxuXG4vKipcbiAqIFJlZ2lzdGVyIGEgY2FsbGJhY2sgdG8gYmUgaW52b2tlZCBlYWNoIHRpbWUgdGhlIGFwcGxpY2F0aW9uXG4gKiBmaW5pc2hlcyByZW5kZXJpbmcuXG4gKlxuICogPGRpdiBjbGFzcz1cImFsZXJ0IGlzLWNyaXRpY2FsXCI+XG4gKlxuICogWW91IHNob3VsZCBhbHdheXMgZXhwbGljaXRseSBzcGVjaWZ5IGEgbm9uLWRlZmF1bHQgW3BoYXNlXShhcGkvY29yZS9BZnRlclJlbmRlclBoYXNlKSwgb3IgeW91XG4gKiByaXNrIHNpZ25pZmljYW50IHBlcmZvcm1hbmNlIGRlZ3JhZGF0aW9uLlxuICpcbiAqIDwvZGl2PlxuICpcbiAqIE5vdGUgdGhhdCB0aGUgY2FsbGJhY2sgd2lsbCBydW5cbiAqIC0gaW4gdGhlIG9yZGVyIGl0IHdhcyByZWdpc3RlcmVkXG4gKiAtIG9uY2UgcGVyIHJlbmRlclxuICogLSBvbiBicm93c2VyIHBsYXRmb3JtcyBvbmx5XG4gKlxuICogPGRpdiBjbGFzcz1cImFsZXJ0IGlzLWltcG9ydGFudFwiPlxuICpcbiAqIENvbXBvbmVudHMgYXJlIG5vdCBndWFyYW50ZWVkIHRvIGJlIFtoeWRyYXRlZF0oZ3VpZGUvaHlkcmF0aW9uKSBiZWZvcmUgdGhlIGNhbGxiYWNrIHJ1bnMuXG4gKiBZb3UgbXVzdCB1c2UgY2F1dGlvbiB3aGVuIGRpcmVjdGx5IHJlYWRpbmcgb3Igd3JpdGluZyB0aGUgRE9NIGFuZCBsYXlvdXQuXG4gKlxuICogPC9kaXY+XG4gKlxuICogQHBhcmFtIGNhbGxiYWNrIEEgY2FsbGJhY2sgZnVuY3Rpb24gdG8gcmVnaXN0ZXJcbiAqXG4gKiBAdXNhZ2VOb3Rlc1xuICpcbiAqIFVzZSBgYWZ0ZXJSZW5kZXJgIHRvIHJlYWQgb3Igd3JpdGUgdGhlIERPTSBhZnRlciBlYWNoIHJlbmRlci5cbiAqXG4gKiAjIyMgRXhhbXBsZVxuICogYGBgdHNcbiAqIEBDb21wb25lbnQoe1xuICogICBzZWxlY3RvcjogJ215LWNtcCcsXG4gKiAgIHRlbXBsYXRlOiBgPHNwYW4gI2NvbnRlbnQ+e3sgLi4uIH19PC9zcGFuPmAsXG4gKiB9KVxuICogZXhwb3J0IGNsYXNzIE15Q29tcG9uZW50IHtcbiAqICAgQFZpZXdDaGlsZCgnY29udGVudCcpIGNvbnRlbnRSZWY6IEVsZW1lbnRSZWY7XG4gKlxuICogICBjb25zdHJ1Y3RvcigpIHtcbiAqICAgICBhZnRlclJlbmRlcigoKSA9PiB7XG4gKiAgICAgICBjb25zb2xlLmxvZygnY29udGVudCBoZWlnaHQ6ICcgKyB0aGlzLmNvbnRlbnRSZWYubmF0aXZlRWxlbWVudC5zY3JvbGxIZWlnaHQpO1xuICogICAgIH0sIHtwaGFzZTogQWZ0ZXJSZW5kZXJQaGFzZS5SZWFkfSk7XG4gKiAgIH1cbiAqIH1cbiAqIGBgYFxuICpcbiAqIEBkZXZlbG9wZXJQcmV2aWV3XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhZnRlclJlbmRlcihjYWxsYmFjazogVm9pZEZ1bmN0aW9uLCBvcHRpb25zPzogQWZ0ZXJSZW5kZXJPcHRpb25zKTogQWZ0ZXJSZW5kZXJSZWYge1xuICBuZ0Rldk1vZGUgJiZcbiAgICAgIGFzc2VydE5vdEluUmVhY3RpdmVDb250ZXh0KFxuICAgICAgICAgIGFmdGVyUmVuZGVyLFxuICAgICAgICAgICdDYWxsIGBhZnRlclJlbmRlcmAgb3V0c2lkZSBvZiBhIHJlYWN0aXZlIGNvbnRleHQuIEZvciBleGFtcGxlLCBzY2hlZHVsZSB0aGUgcmVuZGVyICcgK1xuICAgICAgICAgICAgICAnY2FsbGJhY2sgaW5zaWRlIHRoZSBjb21wb25lbnQgY29uc3RydWN0b3JgLicpO1xuXG4gICFvcHRpb25zICYmIGFzc2VydEluSW5qZWN0aW9uQ29udGV4dChhZnRlclJlbmRlcik7XG4gIGNvbnN0IGluamVjdG9yID0gb3B0aW9ucz8uaW5qZWN0b3IgPz8gaW5qZWN0KEluamVjdG9yKTtcblxuICBpZiAoIWlzUGxhdGZvcm1Ccm93c2VyKGluamVjdG9yKSkge1xuICAgIHJldHVybiBOT09QX0FGVEVSX1JFTkRFUl9SRUY7XG4gIH1cblxuICBwZXJmb3JtYW5jZU1hcmtGZWF0dXJlKCdOZ0FmdGVyUmVuZGVyJyk7XG5cbiAgY29uc3QgYWZ0ZXJSZW5kZXJFdmVudE1hbmFnZXIgPSBpbmplY3Rvci5nZXQoQWZ0ZXJSZW5kZXJFdmVudE1hbmFnZXIpO1xuICAvLyBMYXppbHkgaW5pdGlhbGl6ZSB0aGUgaGFuZGxlciBpbXBsZW1lbnRhdGlvbiwgaWYgbmVjZXNzYXJ5LiBUaGlzIGlzIHNvIHRoYXQgaXQgY2FuIGJlXG4gIC8vIHRyZWUtc2hha2VuIGlmIGBhZnRlclJlbmRlcmAgYW5kIGBhZnRlck5leHRSZW5kZXJgIGFyZW4ndCB1c2VkLlxuICBjb25zdCBjYWxsYmFja0hhbmRsZXIgPSBhZnRlclJlbmRlckV2ZW50TWFuYWdlci5oYW5kbGVyID8/PSBuZXcgQWZ0ZXJSZW5kZXJDYWxsYmFja0hhbmRsZXJJbXBsKCk7XG4gIGNvbnN0IHBoYXNlID0gb3B0aW9ucz8ucGhhc2UgPz8gQWZ0ZXJSZW5kZXJQaGFzZS5NaXhlZFJlYWRXcml0ZTtcbiAgY29uc3QgZGVzdHJveSA9ICgpID0+IHtcbiAgICBjYWxsYmFja0hhbmRsZXIudW5yZWdpc3RlcihpbnN0YW5jZSk7XG4gICAgdW5yZWdpc3RlckZuKCk7XG4gIH07XG4gIGNvbnN0IHVucmVnaXN0ZXJGbiA9IGluamVjdG9yLmdldChEZXN0cm95UmVmKS5vbkRlc3Ryb3koZGVzdHJveSk7XG4gIGNvbnN0IGluc3RhbmNlID0gbmV3IEFmdGVyUmVuZGVyQ2FsbGJhY2soaW5qZWN0b3IsIHBoYXNlLCBjYWxsYmFjayk7XG5cbiAgY2FsbGJhY2tIYW5kbGVyLnJlZ2lzdGVyKGluc3RhbmNlKTtcbiAgcmV0dXJuIHtkZXN0cm95fTtcbn1cblxuLyoqXG4gKiBSZWdpc3RlciBhIGNhbGxiYWNrIHRvIGJlIGludm9rZWQgdGhlIG5leHQgdGltZSB0aGUgYXBwbGljYXRpb25cbiAqIGZpbmlzaGVzIHJlbmRlcmluZy5cbiAqXG4gKiA8ZGl2IGNsYXNzPVwiYWxlcnQgaXMtY3JpdGljYWxcIj5cbiAqXG4gKiBZb3Ugc2hvdWxkIGFsd2F5cyBleHBsaWNpdGx5IHNwZWNpZnkgYSBub24tZGVmYXVsdCBbcGhhc2VdKGFwaS9jb3JlL0FmdGVyUmVuZGVyUGhhc2UpLCBvciB5b3VcbiAqIHJpc2sgc2lnbmlmaWNhbnQgcGVyZm9ybWFuY2UgZGVncmFkYXRpb24uXG4gKlxuICogPC9kaXY+XG4gKlxuICogTm90ZSB0aGF0IHRoZSBjYWxsYmFjayB3aWxsIHJ1blxuICogLSBpbiB0aGUgb3JkZXIgaXQgd2FzIHJlZ2lzdGVyZWRcbiAqIC0gb24gYnJvd3NlciBwbGF0Zm9ybXMgb25seVxuICpcbiAqIDxkaXYgY2xhc3M9XCJhbGVydCBpcy1pbXBvcnRhbnRcIj5cbiAqXG4gKiBDb21wb25lbnRzIGFyZSBub3QgZ3VhcmFudGVlZCB0byBiZSBbaHlkcmF0ZWRdKGd1aWRlL2h5ZHJhdGlvbikgYmVmb3JlIHRoZSBjYWxsYmFjayBydW5zLlxuICogWW91IG11c3QgdXNlIGNhdXRpb24gd2hlbiBkaXJlY3RseSByZWFkaW5nIG9yIHdyaXRpbmcgdGhlIERPTSBhbmQgbGF5b3V0LlxuICpcbiAqIDwvZGl2PlxuICpcbiAqIEBwYXJhbSBjYWxsYmFjayBBIGNhbGxiYWNrIGZ1bmN0aW9uIHRvIHJlZ2lzdGVyXG4gKlxuICogQHVzYWdlTm90ZXNcbiAqXG4gKiBVc2UgYGFmdGVyTmV4dFJlbmRlcmAgdG8gcmVhZCBvciB3cml0ZSB0aGUgRE9NIG9uY2UsXG4gKiBmb3IgZXhhbXBsZSB0byBpbml0aWFsaXplIGEgbm9uLUFuZ3VsYXIgbGlicmFyeS5cbiAqXG4gKiAjIyMgRXhhbXBsZVxuICogYGBgdHNcbiAqIEBDb21wb25lbnQoe1xuICogICBzZWxlY3RvcjogJ215LWNoYXJ0LWNtcCcsXG4gKiAgIHRlbXBsYXRlOiBgPGRpdiAjY2hhcnQ+e3sgLi4uIH19PC9kaXY+YCxcbiAqIH0pXG4gKiBleHBvcnQgY2xhc3MgTXlDaGFydENtcCB7XG4gKiAgIEBWaWV3Q2hpbGQoJ2NoYXJ0JykgY2hhcnRSZWY6IEVsZW1lbnRSZWY7XG4gKiAgIGNoYXJ0OiBNeUNoYXJ0fG51bGw7XG4gKlxuICogICBjb25zdHJ1Y3RvcigpIHtcbiAqICAgICBhZnRlck5leHRSZW5kZXIoKCkgPT4ge1xuICogICAgICAgdGhpcy5jaGFydCA9IG5ldyBNeUNoYXJ0KHRoaXMuY2hhcnRSZWYubmF0aXZlRWxlbWVudCk7XG4gKiAgICAgfSwge3BoYXNlOiBBZnRlclJlbmRlclBoYXNlLldyaXRlfSk7XG4gKiAgIH1cbiAqIH1cbiAqIGBgYFxuICpcbiAqIEBkZXZlbG9wZXJQcmV2aWV3XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhZnRlck5leHRSZW5kZXIoXG4gICAgY2FsbGJhY2s6IFZvaWRGdW5jdGlvbiwgb3B0aW9ucz86IEFmdGVyUmVuZGVyT3B0aW9ucyk6IEFmdGVyUmVuZGVyUmVmIHtcbiAgIW9wdGlvbnMgJiYgYXNzZXJ0SW5JbmplY3Rpb25Db250ZXh0KGFmdGVyTmV4dFJlbmRlcik7XG4gIGNvbnN0IGluamVjdG9yID0gb3B0aW9ucz8uaW5qZWN0b3IgPz8gaW5qZWN0KEluamVjdG9yKTtcblxuICBpZiAoIWlzUGxhdGZvcm1Ccm93c2VyKGluamVjdG9yKSkge1xuICAgIHJldHVybiBOT09QX0FGVEVSX1JFTkRFUl9SRUY7XG4gIH1cblxuICBwZXJmb3JtYW5jZU1hcmtGZWF0dXJlKCdOZ0FmdGVyTmV4dFJlbmRlcicpO1xuXG4gIGNvbnN0IGFmdGVyUmVuZGVyRXZlbnRNYW5hZ2VyID0gaW5qZWN0b3IuZ2V0KEFmdGVyUmVuZGVyRXZlbnRNYW5hZ2VyKTtcbiAgLy8gTGF6aWx5IGluaXRpYWxpemUgdGhlIGhhbmRsZXIgaW1wbGVtZW50YXRpb24sIGlmIG5lY2Vzc2FyeS4gVGhpcyBpcyBzbyB0aGF0IGl0IGNhbiBiZVxuICAvLyB0cmVlLXNoYWtlbiBpZiBgYWZ0ZXJSZW5kZXJgIGFuZCBgYWZ0ZXJOZXh0UmVuZGVyYCBhcmVuJ3QgdXNlZC5cbiAgY29uc3QgY2FsbGJhY2tIYW5kbGVyID0gYWZ0ZXJSZW5kZXJFdmVudE1hbmFnZXIuaGFuZGxlciA/Pz0gbmV3IEFmdGVyUmVuZGVyQ2FsbGJhY2tIYW5kbGVySW1wbCgpO1xuICBjb25zdCBwaGFzZSA9IG9wdGlvbnM/LnBoYXNlID8/IEFmdGVyUmVuZGVyUGhhc2UuTWl4ZWRSZWFkV3JpdGU7XG4gIGNvbnN0IGRlc3Ryb3kgPSAoKSA9PiB7XG4gICAgY2FsbGJhY2tIYW5kbGVyLnVucmVnaXN0ZXIoaW5zdGFuY2UpO1xuICAgIHVucmVnaXN0ZXJGbigpO1xuICB9O1xuICBjb25zdCB1bnJlZ2lzdGVyRm4gPSBpbmplY3Rvci5nZXQoRGVzdHJveVJlZikub25EZXN0cm95KGRlc3Ryb3kpO1xuICBjb25zdCBpbnN0YW5jZSA9IG5ldyBBZnRlclJlbmRlckNhbGxiYWNrKGluamVjdG9yLCBwaGFzZSwgKCkgPT4ge1xuICAgIGRlc3Ryb3koKTtcbiAgICBjYWxsYmFjaygpO1xuICB9KTtcblxuICBjYWxsYmFja0hhbmRsZXIucmVnaXN0ZXIoaW5zdGFuY2UpO1xuICByZXR1cm4ge2Rlc3Ryb3l9O1xufVxuXG4vKipcbiAqIEEgd3JhcHBlciBhcm91bmQgYSBmdW5jdGlvbiB0byBiZSB1c2VkIGFzIGFuIGFmdGVyIHJlbmRlciBjYWxsYmFjay5cbiAqL1xuY2xhc3MgQWZ0ZXJSZW5kZXJDYWxsYmFjayB7XG4gIHByaXZhdGUgem9uZTogTmdab25lO1xuICBwcml2YXRlIGVycm9ySGFuZGxlcjogRXJyb3JIYW5kbGVyfG51bGw7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgICBpbmplY3RvcjogSW5qZWN0b3IsIHB1YmxpYyByZWFkb25seSBwaGFzZTogQWZ0ZXJSZW5kZXJQaGFzZSxcbiAgICAgIHByaXZhdGUgY2FsbGJhY2tGbjogVm9pZEZ1bmN0aW9uKSB7XG4gICAgdGhpcy56b25lID0gaW5qZWN0b3IuZ2V0KE5nWm9uZSk7XG4gICAgdGhpcy5lcnJvckhhbmRsZXIgPSBpbmplY3Rvci5nZXQoRXJyb3JIYW5kbGVyLCBudWxsLCB7b3B0aW9uYWw6IHRydWV9KTtcbiAgfVxuXG4gIGludm9rZSgpIHtcbiAgICB0cnkge1xuICAgICAgdGhpcy56b25lLnJ1bk91dHNpZGVBbmd1bGFyKHRoaXMuY2FsbGJhY2tGbik7XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICB0aGlzLmVycm9ySGFuZGxlcj8uaGFuZGxlRXJyb3IoZXJyKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBJbXBsZW1lbnRzIGBhZnRlclJlbmRlcmAgYW5kIGBhZnRlck5leHRSZW5kZXJgIGNhbGxiYWNrIGhhbmRsZXIgbG9naWMuXG4gKi9cbmludGVyZmFjZSBBZnRlclJlbmRlckNhbGxiYWNrSGFuZGxlciB7XG4gIC8qKlxuICAgKiBWYWxpZGF0ZSB0aGF0IGl0J3Mgc2FmZSBmb3IgYSByZW5kZXIgb3BlcmF0aW9uIHRvIGJlZ2luLFxuICAgKiB0aHJvd2luZyBpZiBub3QuIE5vdCBndWFyYW50ZWVkIHRvIGJlIGNhbGxlZCBpZiBhIHJlbmRlclxuICAgKiBvcGVyYXRpb24gaXMgc3RhcnRlZCBiZWZvcmUgaGFuZGxlciB3YXMgcmVnaXN0ZXJlZC5cbiAgICovXG4gIHZhbGlkYXRlQmVnaW4oKTogdm9pZDtcblxuICAvKipcbiAgICogUmVnaXN0ZXIgYSBuZXcgY2FsbGJhY2suXG4gICAqL1xuICByZWdpc3RlcihjYWxsYmFjazogQWZ0ZXJSZW5kZXJDYWxsYmFjayk6IHZvaWQ7XG5cbiAgLyoqXG4gICAqIFVucmVnaXN0ZXIgYW4gZXhpc3RpbmcgY2FsbGJhY2suXG4gICAqL1xuICB1bnJlZ2lzdGVyKGNhbGxiYWNrOiBBZnRlclJlbmRlckNhbGxiYWNrKTogdm9pZDtcblxuICAvKipcbiAgICogRXhlY3V0ZSBjYWxsYmFja3MuXG4gICAqL1xuICBleGVjdXRlKCk6IHZvaWQ7XG5cbiAgLyoqXG4gICAqIFBlcmZvcm0gYW55IG5lY2Vzc2FyeSBjbGVhbnVwLlxuICAgKi9cbiAgZGVzdHJveSgpOiB2b2lkO1xufVxuXG4vKipcbiAqIENvcmUgZnVuY3Rpb25hbGl0eSBmb3IgYGFmdGVyUmVuZGVyYCBhbmQgYGFmdGVyTmV4dFJlbmRlcmAuIEtlcHQgc2VwYXJhdGUgZnJvbVxuICogYEFmdGVyUmVuZGVyRXZlbnRNYW5hZ2VyYCBmb3IgdHJlZS1zaGFraW5nLlxuICovXG5jbGFzcyBBZnRlclJlbmRlckNhbGxiYWNrSGFuZGxlckltcGwgaW1wbGVtZW50cyBBZnRlclJlbmRlckNhbGxiYWNrSGFuZGxlciB7XG4gIHByaXZhdGUgZXhlY3V0aW5nQ2FsbGJhY2tzID0gZmFsc2U7XG4gIHByaXZhdGUgYnVja2V0cyA9IHtcbiAgICAvLyBOb3RlOiB0aGUgb3JkZXIgb2YgdGhlc2Uga2V5cyBjb250cm9scyB0aGUgb3JkZXIgdGhlIHBoYXNlcyBhcmUgcnVuLlxuICAgIFtBZnRlclJlbmRlclBoYXNlLkVhcmx5UmVhZF06IG5ldyBTZXQ8QWZ0ZXJSZW5kZXJDYWxsYmFjaz4oKSxcbiAgICBbQWZ0ZXJSZW5kZXJQaGFzZS5Xcml0ZV06IG5ldyBTZXQ8QWZ0ZXJSZW5kZXJDYWxsYmFjaz4oKSxcbiAgICBbQWZ0ZXJSZW5kZXJQaGFzZS5NaXhlZFJlYWRXcml0ZV06IG5ldyBTZXQ8QWZ0ZXJSZW5kZXJDYWxsYmFjaz4oKSxcbiAgICBbQWZ0ZXJSZW5kZXJQaGFzZS5SZWFkXTogbmV3IFNldDxBZnRlclJlbmRlckNhbGxiYWNrPigpLFxuICB9O1xuICBwcml2YXRlIGRlZmVycmVkQ2FsbGJhY2tzID0gbmV3IFNldDxBZnRlclJlbmRlckNhbGxiYWNrPigpO1xuXG4gIHZhbGlkYXRlQmVnaW4oKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuZXhlY3V0aW5nQ2FsbGJhY2tzKSB7XG4gICAgICB0aHJvdyBuZXcgUnVudGltZUVycm9yKFxuICAgICAgICAgIFJ1bnRpbWVFcnJvckNvZGUuUkVDVVJTSVZFX0FQUExJQ0FUSU9OX1JFTkRFUixcbiAgICAgICAgICBuZ0Rldk1vZGUgJiZcbiAgICAgICAgICAgICAgJ0EgbmV3IHJlbmRlciBvcGVyYXRpb24gYmVnYW4gYmVmb3JlIHRoZSBwcmV2aW91cyBvcGVyYXRpb24gZW5kZWQuICcgK1xuICAgICAgICAgICAgICAgICAgJ0RpZCB5b3UgdHJpZ2dlciBjaGFuZ2UgZGV0ZWN0aW9uIGZyb20gYWZ0ZXJSZW5kZXIgb3IgYWZ0ZXJOZXh0UmVuZGVyPycpO1xuICAgIH1cbiAgfVxuXG4gIHJlZ2lzdGVyKGNhbGxiYWNrOiBBZnRlclJlbmRlckNhbGxiYWNrKTogdm9pZCB7XG4gICAgLy8gSWYgd2UncmUgY3VycmVudGx5IHJ1bm5pbmcgY2FsbGJhY2tzLCBuZXcgY2FsbGJhY2tzIHNob3VsZCBiZSBkZWZlcnJlZFxuICAgIC8vIHVudGlsIHRoZSBuZXh0IHJlbmRlciBvcGVyYXRpb24uXG4gICAgY29uc3QgdGFyZ2V0ID0gdGhpcy5leGVjdXRpbmdDYWxsYmFja3MgPyB0aGlzLmRlZmVycmVkQ2FsbGJhY2tzIDogdGhpcy5idWNrZXRzW2NhbGxiYWNrLnBoYXNlXTtcbiAgICB0YXJnZXQuYWRkKGNhbGxiYWNrKTtcbiAgfVxuXG4gIHVucmVnaXN0ZXIoY2FsbGJhY2s6IEFmdGVyUmVuZGVyQ2FsbGJhY2spOiB2b2lkIHtcbiAgICB0aGlzLmJ1Y2tldHNbY2FsbGJhY2sucGhhc2VdLmRlbGV0ZShjYWxsYmFjayk7XG4gICAgdGhpcy5kZWZlcnJlZENhbGxiYWNrcy5kZWxldGUoY2FsbGJhY2spO1xuICB9XG5cbiAgZXhlY3V0ZSgpOiB2b2lkIHtcbiAgICB0aGlzLmV4ZWN1dGluZ0NhbGxiYWNrcyA9IHRydWU7XG4gICAgZm9yIChjb25zdCBidWNrZXQgb2YgT2JqZWN0LnZhbHVlcyh0aGlzLmJ1Y2tldHMpKSB7XG4gICAgICBmb3IgKGNvbnN0IGNhbGxiYWNrIG9mIGJ1Y2tldCkge1xuICAgICAgICBjYWxsYmFjay5pbnZva2UoKTtcbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5leGVjdXRpbmdDYWxsYmFja3MgPSBmYWxzZTtcblxuICAgIGZvciAoY29uc3QgY2FsbGJhY2sgb2YgdGhpcy5kZWZlcnJlZENhbGxiYWNrcykge1xuICAgICAgdGhpcy5idWNrZXRzW2NhbGxiYWNrLnBoYXNlXS5hZGQoY2FsbGJhY2spO1xuICAgIH1cbiAgICB0aGlzLmRlZmVycmVkQ2FsbGJhY2tzLmNsZWFyKCk7XG4gIH1cblxuICBkZXN0cm95KCk6IHZvaWQge1xuICAgIGZvciAoY29uc3QgYnVja2V0IG9mIE9iamVjdC52YWx1ZXModGhpcy5idWNrZXRzKSkge1xuICAgICAgYnVja2V0LmNsZWFyKCk7XG4gICAgfVxuICAgIHRoaXMuZGVmZXJyZWRDYWxsYmFja3MuY2xlYXIoKTtcbiAgfVxufVxuXG4vKipcbiAqIEltcGxlbWVudHMgY29yZSB0aW1pbmcgZm9yIGBhZnRlclJlbmRlcmAgYW5kIGBhZnRlck5leHRSZW5kZXJgIGV2ZW50cy5cbiAqIERlbGVnYXRlcyB0byBhbiBvcHRpb25hbCBgQWZ0ZXJSZW5kZXJDYWxsYmFja0hhbmRsZXJgIGZvciBpbXBsZW1lbnRhdGlvbi5cbiAqL1xuZXhwb3J0IGNsYXNzIEFmdGVyUmVuZGVyRXZlbnRNYW5hZ2VyIHtcbiAgcHJpdmF0ZSByZW5kZXJEZXB0aCA9IDA7XG5cbiAgLyogQGludGVybmFsICovXG4gIGhhbmRsZXI6IEFmdGVyUmVuZGVyQ2FsbGJhY2tIYW5kbGVyfG51bGwgPSBudWxsO1xuXG4gIC8qIEBpbnRlcm5hbCAqL1xuICBpbnRlcm5hbENhbGxiYWNrczogVm9pZEZ1bmN0aW9uW10gPSBbXTtcblxuICAvKipcbiAgICogTWFyayB0aGUgYmVnaW5uaW5nIG9mIGEgcmVuZGVyIG9wZXJhdGlvbiAoaS5lLiBDRCBjeWNsZSkuXG4gICAqIFRocm93cyBpZiBjYWxsZWQgd2hpbGUgZXhlY3V0aW5nIGNhbGxiYWNrcy5cbiAgICovXG4gIGJlZ2luKCkge1xuICAgIHRoaXMuaGFuZGxlcj8udmFsaWRhdGVCZWdpbigpO1xuICAgIHRoaXMucmVuZGVyRGVwdGgrKztcbiAgfVxuXG4gIC8qKlxuICAgKiBNYXJrIHRoZSBlbmQgb2YgYSByZW5kZXIgb3BlcmF0aW9uLiBDYWxsYmFja3Mgd2lsbCBiZVxuICAgKiBleGVjdXRlZCBpZiB0aGVyZSBhcmUgbm8gbW9yZSBwZW5kaW5nIG9wZXJhdGlvbnMuXG4gICAqL1xuICBlbmQoKSB7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydEdyZWF0ZXJUaGFuKHRoaXMucmVuZGVyRGVwdGgsIDAsICdyZW5kZXJEZXB0aCBtdXN0IGJlIGdyZWF0ZXIgdGhhbiAwJyk7XG4gICAgdGhpcy5yZW5kZXJEZXB0aC0tO1xuXG4gICAgaWYgKHRoaXMucmVuZGVyRGVwdGggPT09IDApIHtcbiAgICAgIC8vIE5vdGU6IGludGVybmFsIGNhbGxiYWNrcyBwb3dlciBgaW50ZXJuYWxBZnRlck5leHRSZW5kZXJgLiBTaW5jZSBpbnRlcm5hbCBjYWxsYmFja3NcbiAgICAgIC8vIGFyZSBmYWlybHkgdHJpdmlhbCwgdGhleSBhcmUga2VwdCBzZXBhcmF0ZSBzbyB0aGF0IGBBZnRlclJlbmRlckNhbGxiYWNrSGFuZGxlckltcGxgXG4gICAgICAvLyBjYW4gc3RpbGwgYmUgdHJlZS1zaGFrZW4gdW5sZXNzIHVzZWQgYnkgdGhlIGFwcGxpY2F0aW9uLlxuICAgICAgZm9yIChjb25zdCBjYWxsYmFjayBvZiB0aGlzLmludGVybmFsQ2FsbGJhY2tzKSB7XG4gICAgICAgIGNhbGxiYWNrKCk7XG4gICAgICB9XG4gICAgICB0aGlzLmludGVybmFsQ2FsbGJhY2tzLmxlbmd0aCA9IDA7XG4gICAgICB0aGlzLmhhbmRsZXI/LmV4ZWN1dGUoKTtcbiAgICB9XG4gIH1cblxuICBuZ09uRGVzdHJveSgpIHtcbiAgICB0aGlzLmhhbmRsZXI/LmRlc3Ryb3koKTtcbiAgICB0aGlzLmhhbmRsZXIgPSBudWxsO1xuICAgIHRoaXMuaW50ZXJuYWxDYWxsYmFja3MubGVuZ3RoID0gMDtcbiAgfVxuXG4gIC8qKiBAbm9jb2xsYXBzZSAqL1xuICBzdGF0aWMgybVwcm92ID0gLyoqIEBwdXJlT3JCcmVha015Q29kZSAqLyDJtcm1ZGVmaW5lSW5qZWN0YWJsZSh7XG4gICAgdG9rZW46IEFmdGVyUmVuZGVyRXZlbnRNYW5hZ2VyLFxuICAgIHByb3ZpZGVkSW46ICdyb290JyxcbiAgICBmYWN0b3J5OiAoKSA9PiBuZXcgQWZ0ZXJSZW5kZXJFdmVudE1hbmFnZXIoKSxcbiAgfSk7XG59XG4iXX0=