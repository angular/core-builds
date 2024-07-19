/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ChangeDetectionScheduler, } from '../change_detection/scheduling/zoneless_scheduling';
import { Injector, assertInInjectionContext, runInInjectionContext, ɵɵdefineInjectable } from '../di';
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
 * @deprecated Specify the phase for your callback to run in by passing a spec-object as the first
 *   parameter to `afterRender` or `afterNextRender` instead of a function.
 */
export var AfterRenderPhase;
(function (AfterRenderPhase) {
    /**
     * Use `AfterRenderPhase.EarlyRead` for callbacks that only need to **read** from the
     * DOM before a subsequent `AfterRenderPhase.Write` callback, for example to perform
     * custom layout that the browser doesn't natively support. Prefer the
     * `AfterRenderPhase.EarlyRead` phase if reading can wait until after the write phase.
     * **Never** write to the DOM in this phase.
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
     * read from the DOM in this phase.
     */
    AfterRenderPhase[AfterRenderPhase["Write"] = 1] = "Write";
    /**
     * Use `AfterRenderPhase.MixedReadWrite` for callbacks that read from or write to the
     * DOM, that haven't been refactored to use a different phase. **Never** use this phase if
     * it is possible to divide the work among the other phases instead.
     *
     * <div class="alert is-critical">
     *
     * Using this value can **significantly** degrade performance.
     * Instead, prefer dividing work into the appropriate phase callbacks.
     *
     * </div>
     */
    AfterRenderPhase[AfterRenderPhase["MixedReadWrite"] = 2] = "MixedReadWrite";
    /**
     * Use `AfterRenderPhase.Read` for callbacks that only **read** from the DOM. **Never**
     * write to the DOM in this phase.
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
export function afterRender(callbackOrSpec, options) {
    ngDevMode &&
        assertNotInReactiveContext(afterRender, 'Call `afterRender` outside of a reactive context. For example, schedule the render ' +
            'callback inside the component constructor`.');
    !options && assertInInjectionContext(afterRender);
    const injector = options?.injector ?? inject(Injector);
    if (!isPlatformBrowser(injector)) {
        return NOOP_AFTER_RENDER_REF;
    }
    performanceMarkFeature('NgAfterRender');
    return afterRenderImpl(callbackOrSpec, injector, 
    /* once */ false, options?.phase ?? AfterRenderPhase.MixedReadWrite);
}
export function afterNextRender(callbackOrSpec, options) {
    !options && assertInInjectionContext(afterNextRender);
    const injector = options?.injector ?? inject(Injector);
    if (!isPlatformBrowser(injector)) {
        return NOOP_AFTER_RENDER_REF;
    }
    performanceMarkFeature('NgAfterNextRender');
    return afterRenderImpl(callbackOrSpec, injector, 
    /* once */ true, options?.phase ?? AfterRenderPhase.MixedReadWrite);
}
function getSpec(callbackOrSpec, phase) {
    if (callbackOrSpec instanceof Function) {
        switch (phase) {
            case AfterRenderPhase.EarlyRead:
                return { earlyRead: callbackOrSpec };
            case AfterRenderPhase.Write:
                return { write: callbackOrSpec };
            case AfterRenderPhase.MixedReadWrite:
                return { mixedReadWrite: callbackOrSpec };
            case AfterRenderPhase.Read:
                return { read: callbackOrSpec };
        }
    }
    return callbackOrSpec;
}
/**
 * Shared implementation for `afterRender` and `afterNextRender`.
 */
function afterRenderImpl(callbackOrSpec, injector, once, phase) {
    const spec = getSpec(callbackOrSpec, phase);
    const afterRenderEventManager = injector.get(AfterRenderEventManager);
    // Lazily initialize the handler implementation, if necessary. This is so that it can be
    // tree-shaken if `afterRender` and `afterNextRender` aren't used.
    const callbackHandler = (afterRenderEventManager.handler ??=
        new AfterRenderCallbackHandlerImpl());
    const pipelinedArgs = [];
    const instances = [];
    const destroy = () => {
        for (const instance of instances) {
            callbackHandler.unregister(instance);
        }
        unregisterFn();
    };
    const unregisterFn = injector.get(DestroyRef).onDestroy(destroy);
    let callbacksLeftToRun = 0;
    const registerCallback = (phase, phaseCallback) => {
        if (!phaseCallback) {
            return;
        }
        const callback = once
            ? (...args) => {
                callbacksLeftToRun--;
                if (callbacksLeftToRun < 1) {
                    destroy();
                }
                return phaseCallback(...args);
            }
            : phaseCallback;
        const instance = runInInjectionContext(injector, () => new AfterRenderCallback(phase, pipelinedArgs, callback));
        callbackHandler.register(instance);
        instances.push(instance);
        callbacksLeftToRun++;
    };
    registerCallback(AfterRenderPhase.EarlyRead, spec.earlyRead);
    registerCallback(AfterRenderPhase.Write, spec.write);
    registerCallback(AfterRenderPhase.MixedReadWrite, spec.mixedReadWrite);
    registerCallback(AfterRenderPhase.Read, spec.read);
    return { destroy };
}
/**
 * A wrapper around a function to be used as an after render callback.
 */
class AfterRenderCallback {
    constructor(phase, pipelinedArgs, callbackFn) {
        this.phase = phase;
        this.pipelinedArgs = pipelinedArgs;
        this.callbackFn = callbackFn;
        this.zone = inject(NgZone);
        this.errorHandler = inject(ErrorHandler, { optional: true });
        // Registering a callback will notify the scheduler.
        inject(ChangeDetectionScheduler, { optional: true })?.notify(6 /* NotificationSource.NewRenderHook */);
    }
    invoke() {
        try {
            const result = this.zone.runOutsideAngular(() => this.callbackFn.apply(null, this.pipelinedArgs));
            // Clear out the args and add the result which will be passed to the next phase.
            this.pipelinedArgs.splice(0, this.pipelinedArgs.length, result);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWZ0ZXJfcmVuZGVyX2hvb2tzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9hZnRlcl9yZW5kZXJfaG9va3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUNMLHdCQUF3QixHQUV6QixNQUFNLG9EQUFvRCxDQUFDO0FBQzVELE9BQU8sRUFBQyxRQUFRLEVBQUUsd0JBQXdCLEVBQUUscUJBQXFCLEVBQUUsa0JBQWtCLEVBQUMsTUFBTSxPQUFPLENBQUM7QUFDcEcsT0FBTyxFQUFDLE1BQU0sRUFBQyxNQUFNLDhCQUE4QixDQUFDO0FBQ3BELE9BQU8sRUFBQyxZQUFZLEVBQUMsTUFBTSxrQkFBa0IsQ0FBQztBQUM5QyxPQUFPLEVBQUMsVUFBVSxFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDakQsT0FBTyxFQUFDLDBCQUEwQixFQUFDLE1BQU0sK0JBQStCLENBQUM7QUFDekUsT0FBTyxFQUFDLHNCQUFzQixFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFDM0QsT0FBTyxFQUFDLE1BQU0sRUFBQyxNQUFNLGlCQUFpQixDQUFDO0FBRXZDLE9BQU8sRUFBQyxpQkFBaUIsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBWXBEOzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztHQW9CRztBQUNILE1BQU0sQ0FBTixJQUFZLGdCQTBDWDtBQTFDRCxXQUFZLGdCQUFnQjtJQUMxQjs7Ozs7Ozs7Ozs7OztPQWFHO0lBQ0gsaUVBQVMsQ0FBQTtJQUVUOzs7T0FHRztJQUNILHlEQUFLLENBQUE7SUFFTDs7Ozs7Ozs7Ozs7T0FXRztJQUNILDJFQUFjLENBQUE7SUFFZDs7O09BR0c7SUFDSCx1REFBSSxDQUFBO0FBQ04sQ0FBQyxFQTFDVyxnQkFBZ0IsS0FBaEIsZ0JBQWdCLFFBMEMzQjtBQTZERCwwQ0FBMEM7QUFDMUMsTUFBTSxxQkFBcUIsR0FBbUI7SUFD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RWxELGVBQWU7UUFDZixzQkFBaUIsR0FBbUIsRUFBRSxDQUFDO0lBaUN6QyxDQUFDO0lBL0JDOztPQUVHO0lBQ0gsT0FBTztRQUNMLElBQUksQ0FBQyx3QkFBd0IsRUFBRSxDQUFDO1FBQ2hDLElBQUksQ0FBQyxPQUFPLEVBQUUsT0FBTyxFQUFFLENBQUM7SUFDMUIsQ0FBQztJQUVELHdCQUF3QjtRQUN0QixxRkFBcUY7UUFDckYsc0ZBQXNGO1FBQ3RGLDJEQUEyRDtRQUMzRCxNQUFNLFNBQVMsR0FBRyxDQUFDLEdBQUcsSUFBSSxDQUFDLGlCQUFpQixDQUFDLENBQUM7UUFDOUMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUM7UUFDbEMsS0FBSyxNQUFNLFFBQVEsSUFBSSxTQUFTLEVBQUUsQ0FBQztZQUNqQyxRQUFRLEVBQUUsQ0FBQztRQUNiLENBQUM7SUFDSCxDQUFDO0lBRUQsV0FBVztRQUNULElBQUksQ0FBQyxPQUFPLEVBQUUsT0FBTyxFQUFFLENBQUM7UUFDeEIsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUM7UUFDcEIsSUFBSSxDQUFDLGlCQUFpQixDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUM7SUFDcEMsQ0FBQztJQUVELGtCQUFrQjthQUNYLFVBQUssR0FBNkIsa0JBQWtCLENBQUM7UUFDMUQsS0FBSyxFQUFFLHVCQUF1QjtRQUM5QixVQUFVLEVBQUUsTUFBTTtRQUNsQixPQUFPLEVBQUUsR0FBRyxFQUFFLENBQUMsSUFBSSx1QkFBdUIsRUFBRTtLQUM3QyxDQUFDLEFBSlUsQ0FJVCIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1xuICBDaGFuZ2VEZXRlY3Rpb25TY2hlZHVsZXIsXG4gIE5vdGlmaWNhdGlvblNvdXJjZSxcbn0gZnJvbSAnLi4vY2hhbmdlX2RldGVjdGlvbi9zY2hlZHVsaW5nL3pvbmVsZXNzX3NjaGVkdWxpbmcnO1xuaW1wb3J0IHtJbmplY3RvciwgYXNzZXJ0SW5JbmplY3Rpb25Db250ZXh0LCBydW5JbkluamVjdGlvbkNvbnRleHQsIMm1ybVkZWZpbmVJbmplY3RhYmxlfSBmcm9tICcuLi9kaSc7XG5pbXBvcnQge2luamVjdH0gZnJvbSAnLi4vZGkvaW5qZWN0b3JfY29tcGF0aWJpbGl0eSc7XG5pbXBvcnQge0Vycm9ySGFuZGxlcn0gZnJvbSAnLi4vZXJyb3JfaGFuZGxlcic7XG5pbXBvcnQge0Rlc3Ryb3lSZWZ9IGZyb20gJy4uL2xpbmtlci9kZXN0cm95X3JlZic7XG5pbXBvcnQge2Fzc2VydE5vdEluUmVhY3RpdmVDb250ZXh0fSBmcm9tICcuLi9yZW5kZXIzL3JlYWN0aXZpdHkvYXNzZXJ0cyc7XG5pbXBvcnQge3BlcmZvcm1hbmNlTWFya0ZlYXR1cmV9IGZyb20gJy4uL3V0aWwvcGVyZm9ybWFuY2UnO1xuaW1wb3J0IHtOZ1pvbmV9IGZyb20gJy4uL3pvbmUvbmdfem9uZSc7XG5cbmltcG9ydCB7aXNQbGF0Zm9ybUJyb3dzZXJ9IGZyb20gJy4vdXRpbC9taXNjX3V0aWxzJztcblxuLyoqXG4gKiBBbiBhcmd1bWVudCBsaXN0IGNvbnRhaW5pbmcgdGhlIGZpcnN0IG5vbi1uZXZlciB0eXBlIGluIHRoZSBnaXZlbiB0eXBlIGFycmF5LCBvciBhbiBlbXB0eVxuICogYXJndW1lbnQgbGlzdCBpZiB0aGVyZSBhcmUgbm8gbm9uLW5ldmVyIHR5cGVzIGluIHRoZSB0eXBlIGFycmF5LlxuICovXG5leHBvcnQgdHlwZSDJtUZpcnN0QXZhaWxhYmxlPFQgZXh0ZW5kcyB1bmtub3duW10+ID0gVCBleHRlbmRzIFtpbmZlciBILCAuLi5pbmZlciBSXVxuICA/IFtIXSBleHRlbmRzIFtuZXZlcl1cbiAgICA/IMm1Rmlyc3RBdmFpbGFibGU8Uj5cbiAgICA6IFtIXVxuICA6IFtdO1xuXG4vKipcbiAqIFRoZSBwaGFzZSB0byBydW4gYW4gYGFmdGVyUmVuZGVyYCBvciBgYWZ0ZXJOZXh0UmVuZGVyYCBjYWxsYmFjayBpbi5cbiAqXG4gKiBDYWxsYmFja3MgaW4gdGhlIHNhbWUgcGhhc2UgcnVuIGluIHRoZSBvcmRlciB0aGV5IGFyZSByZWdpc3RlcmVkLiBQaGFzZXMgcnVuIGluIHRoZVxuICogZm9sbG93aW5nIG9yZGVyIGFmdGVyIGVhY2ggcmVuZGVyOlxuICpcbiAqICAgMS4gYEFmdGVyUmVuZGVyUGhhc2UuRWFybHlSZWFkYFxuICogICAyLiBgQWZ0ZXJSZW5kZXJQaGFzZS5Xcml0ZWBcbiAqICAgMy4gYEFmdGVyUmVuZGVyUGhhc2UuTWl4ZWRSZWFkV3JpdGVgXG4gKiAgIDQuIGBBZnRlclJlbmRlclBoYXNlLlJlYWRgXG4gKlxuICogQW5ndWxhciBpcyB1bmFibGUgdG8gdmVyaWZ5IG9yIGVuZm9yY2UgdGhhdCBwaGFzZXMgYXJlIHVzZWQgY29ycmVjdGx5LCBhbmQgaW5zdGVhZFxuICogcmVsaWVzIG9uIGVhY2ggZGV2ZWxvcGVyIHRvIGZvbGxvdyB0aGUgZ3VpZGVsaW5lcyBkb2N1bWVudGVkIGZvciBlYWNoIHZhbHVlIGFuZFxuICogY2FyZWZ1bGx5IGNob29zZSB0aGUgYXBwcm9wcmlhdGUgb25lLCByZWZhY3RvcmluZyB0aGVpciBjb2RlIGlmIG5lY2Vzc2FyeS4gQnkgZG9pbmdcbiAqIHNvLCBBbmd1bGFyIGlzIGJldHRlciBhYmxlIHRvIG1pbmltaXplIHRoZSBwZXJmb3JtYW5jZSBkZWdyYWRhdGlvbiBhc3NvY2lhdGVkIHdpdGhcbiAqIG1hbnVhbCBET00gYWNjZXNzLCBlbnN1cmluZyB0aGUgYmVzdCBleHBlcmllbmNlIGZvciB0aGUgZW5kIHVzZXJzIG9mIHlvdXIgYXBwbGljYXRpb25cbiAqIG9yIGxpYnJhcnkuXG4gKlxuICogQGRlcHJlY2F0ZWQgU3BlY2lmeSB0aGUgcGhhc2UgZm9yIHlvdXIgY2FsbGJhY2sgdG8gcnVuIGluIGJ5IHBhc3NpbmcgYSBzcGVjLW9iamVjdCBhcyB0aGUgZmlyc3RcbiAqICAgcGFyYW1ldGVyIHRvIGBhZnRlclJlbmRlcmAgb3IgYGFmdGVyTmV4dFJlbmRlcmAgaW5zdGVhZCBvZiBhIGZ1bmN0aW9uLlxuICovXG5leHBvcnQgZW51bSBBZnRlclJlbmRlclBoYXNlIHtcbiAgLyoqXG4gICAqIFVzZSBgQWZ0ZXJSZW5kZXJQaGFzZS5FYXJseVJlYWRgIGZvciBjYWxsYmFja3MgdGhhdCBvbmx5IG5lZWQgdG8gKipyZWFkKiogZnJvbSB0aGVcbiAgICogRE9NIGJlZm9yZSBhIHN1YnNlcXVlbnQgYEFmdGVyUmVuZGVyUGhhc2UuV3JpdGVgIGNhbGxiYWNrLCBmb3IgZXhhbXBsZSB0byBwZXJmb3JtXG4gICAqIGN1c3RvbSBsYXlvdXQgdGhhdCB0aGUgYnJvd3NlciBkb2Vzbid0IG5hdGl2ZWx5IHN1cHBvcnQuIFByZWZlciB0aGVcbiAgICogYEFmdGVyUmVuZGVyUGhhc2UuRWFybHlSZWFkYCBwaGFzZSBpZiByZWFkaW5nIGNhbiB3YWl0IHVudGlsIGFmdGVyIHRoZSB3cml0ZSBwaGFzZS5cbiAgICogKipOZXZlcioqIHdyaXRlIHRvIHRoZSBET00gaW4gdGhpcyBwaGFzZS5cbiAgICpcbiAgICogPGRpdiBjbGFzcz1cImFsZXJ0IGlzLWltcG9ydGFudFwiPlxuICAgKlxuICAgKiBVc2luZyB0aGlzIHZhbHVlIGNhbiBkZWdyYWRlIHBlcmZvcm1hbmNlLlxuICAgKiBJbnN0ZWFkLCBwcmVmZXIgdXNpbmcgYnVpbHQtaW4gYnJvd3NlciBmdW5jdGlvbmFsaXR5IHdoZW4gcG9zc2libGUuXG4gICAqXG4gICAqIDwvZGl2PlxuICAgKi9cbiAgRWFybHlSZWFkLFxuXG4gIC8qKlxuICAgKiBVc2UgYEFmdGVyUmVuZGVyUGhhc2UuV3JpdGVgIGZvciBjYWxsYmFja3MgdGhhdCBvbmx5ICoqd3JpdGUqKiB0byB0aGUgRE9NLiAqKk5ldmVyKipcbiAgICogcmVhZCBmcm9tIHRoZSBET00gaW4gdGhpcyBwaGFzZS5cbiAgICovXG4gIFdyaXRlLFxuXG4gIC8qKlxuICAgKiBVc2UgYEFmdGVyUmVuZGVyUGhhc2UuTWl4ZWRSZWFkV3JpdGVgIGZvciBjYWxsYmFja3MgdGhhdCByZWFkIGZyb20gb3Igd3JpdGUgdG8gdGhlXG4gICAqIERPTSwgdGhhdCBoYXZlbid0IGJlZW4gcmVmYWN0b3JlZCB0byB1c2UgYSBkaWZmZXJlbnQgcGhhc2UuICoqTmV2ZXIqKiB1c2UgdGhpcyBwaGFzZSBpZlxuICAgKiBpdCBpcyBwb3NzaWJsZSB0byBkaXZpZGUgdGhlIHdvcmsgYW1vbmcgdGhlIG90aGVyIHBoYXNlcyBpbnN0ZWFkLlxuICAgKlxuICAgKiA8ZGl2IGNsYXNzPVwiYWxlcnQgaXMtY3JpdGljYWxcIj5cbiAgICpcbiAgICogVXNpbmcgdGhpcyB2YWx1ZSBjYW4gKipzaWduaWZpY2FudGx5KiogZGVncmFkZSBwZXJmb3JtYW5jZS5cbiAgICogSW5zdGVhZCwgcHJlZmVyIGRpdmlkaW5nIHdvcmsgaW50byB0aGUgYXBwcm9wcmlhdGUgcGhhc2UgY2FsbGJhY2tzLlxuICAgKlxuICAgKiA8L2Rpdj5cbiAgICovXG4gIE1peGVkUmVhZFdyaXRlLFxuXG4gIC8qKlxuICAgKiBVc2UgYEFmdGVyUmVuZGVyUGhhc2UuUmVhZGAgZm9yIGNhbGxiYWNrcyB0aGF0IG9ubHkgKipyZWFkKiogZnJvbSB0aGUgRE9NLiAqKk5ldmVyKipcbiAgICogd3JpdGUgdG8gdGhlIERPTSBpbiB0aGlzIHBoYXNlLlxuICAgKi9cbiAgUmVhZCxcbn1cblxuLyoqXG4gKiBPcHRpb25zIHBhc3NlZCB0byBgYWZ0ZXJSZW5kZXJgIGFuZCBgYWZ0ZXJOZXh0UmVuZGVyYC5cbiAqXG4gKiBAZGV2ZWxvcGVyUHJldmlld1xuICovXG5leHBvcnQgaW50ZXJmYWNlIEFmdGVyUmVuZGVyT3B0aW9ucyB7XG4gIC8qKlxuICAgKiBUaGUgYEluamVjdG9yYCB0byB1c2UgZHVyaW5nIGNyZWF0aW9uLlxuICAgKlxuICAgKiBJZiB0aGlzIGlzIG5vdCBwcm92aWRlZCwgdGhlIGN1cnJlbnQgaW5qZWN0aW9uIGNvbnRleHQgd2lsbCBiZSB1c2VkIGluc3RlYWQgKHZpYSBgaW5qZWN0YCkuXG4gICAqL1xuICBpbmplY3Rvcj86IEluamVjdG9yO1xuXG4gIC8qKlxuICAgKiBUaGUgcGhhc2UgdGhlIGNhbGxiYWNrIHNob3VsZCBiZSBpbnZva2VkIGluLlxuICAgKlxuICAgKiA8ZGl2IGNsYXNzPVwiYWxlcnQgaXMtY3JpdGljYWxcIj5cbiAgICpcbiAgICogRGVmYXVsdHMgdG8gYEFmdGVyUmVuZGVyUGhhc2UuTWl4ZWRSZWFkV3JpdGVgLiBZb3Ugc2hvdWxkIGNob29zZSBhIG1vcmUgc3BlY2lmaWNcbiAgICogcGhhc2UgaW5zdGVhZC4gU2VlIGBBZnRlclJlbmRlclBoYXNlYCBmb3IgbW9yZSBpbmZvcm1hdGlvbi5cbiAgICpcbiAgICogPC9kaXY+XG4gICAqXG4gICAqIEBkZXByZWNhdGVkIFNwZWNpZnkgdGhlIHBoYXNlIGZvciB5b3VyIGNhbGxiYWNrIHRvIHJ1biBpbiBieSBwYXNzaW5nIGEgc3BlYy1vYmplY3QgYXMgdGhlIGZpcnN0XG4gICAqICAgcGFyYW1ldGVyIHRvIGBhZnRlclJlbmRlcmAgb3IgYGFmdGVyTmV4dFJlbmRlcmAgaW5zdGVhZCBvZiBhIGZ1bmN0aW9uLlxuICAgKi9cbiAgcGhhc2U/OiBBZnRlclJlbmRlclBoYXNlO1xufVxuXG4vKipcbiAqIEEgY2FsbGJhY2sgdGhhdCBydW5zIGFmdGVyIHJlbmRlci5cbiAqXG4gKiBAZGV2ZWxvcGVyUHJldmlld1xuICovXG5leHBvcnQgaW50ZXJmYWNlIEFmdGVyUmVuZGVyUmVmIHtcbiAgLyoqXG4gICAqIFNodXQgZG93biB0aGUgY2FsbGJhY2ssIHByZXZlbnRpbmcgaXQgZnJvbSBiZWluZyBjYWxsZWQgYWdhaW4uXG4gICAqL1xuICBkZXN0cm95KCk6IHZvaWQ7XG59XG5cbi8qKlxuICogT3B0aW9ucyBwYXNzZWQgdG8gYGludGVybmFsQWZ0ZXJOZXh0UmVuZGVyYC5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBJbnRlcm5hbEFmdGVyTmV4dFJlbmRlck9wdGlvbnMge1xuICAvKipcbiAgICogVGhlIGBJbmplY3RvcmAgdG8gdXNlIGR1cmluZyBjcmVhdGlvbi5cbiAgICpcbiAgICogSWYgdGhpcyBpcyBub3QgcHJvdmlkZWQsIHRoZSBjdXJyZW50IGluamVjdGlvbiBjb250ZXh0IHdpbGwgYmUgdXNlZCBpbnN0ZWFkICh2aWEgYGluamVjdGApLlxuICAgKi9cbiAgaW5qZWN0b3I/OiBJbmplY3RvcjtcbiAgLyoqXG4gICAqIFdoZW4gdHJ1ZSwgdGhlIGhvb2sgd2lsbCBleGVjdXRlIGJvdGggb24gY2xpZW50IGFuZCBvbiB0aGUgc2VydmVyLlxuICAgKlxuICAgKiBXaGVuIGZhbHNlIG9yIHVuZGVmaW5lZCwgdGhlIGhvb2sgb25seSBleGVjdXRlcyBpbiB0aGUgYnJvd3Nlci5cbiAgICovXG4gIHJ1bk9uU2VydmVyPzogYm9vbGVhbjtcbn1cblxuLyoqIGBBZnRlclJlbmRlclJlZmAgdGhhdCBkb2VzIG5vdGhpbmcuICovXG5jb25zdCBOT09QX0FGVEVSX1JFTkRFUl9SRUY6IEFmdGVyUmVuZGVyUmVmID0ge1xuICBkZXN0cm95KCkge30sXG59O1xuXG4vKipcbiAqIFJlZ2lzdGVyIGEgY2FsbGJhY2sgdG8gcnVuIG9uY2UgYmVmb3JlIGFueSB1c2Vyc3BhY2UgYGFmdGVyUmVuZGVyYCBvclxuICogYGFmdGVyTmV4dFJlbmRlcmAgY2FsbGJhY2tzLlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gc2hvdWxkIGFsbW9zdCBhbHdheXMgYmUgdXNlZCBpbnN0ZWFkIG9mIGBhZnRlclJlbmRlcmAgb3JcbiAqIGBhZnRlck5leHRSZW5kZXJgIGZvciBpbXBsZW1lbnRpbmcgZnJhbWV3b3JrIGZ1bmN0aW9uYWxpdHkuIENvbnNpZGVyOlxuICpcbiAqICAgMS4pIGBBZnRlclJlbmRlclBoYXNlLkVhcmx5UmVhZGAgaXMgaW50ZW5kZWQgdG8gYmUgdXNlZCBmb3IgaW1wbGVtZW50aW5nXG4gKiAgICAgICBjdXN0b20gbGF5b3V0LiBJZiB0aGUgZnJhbWV3b3JrIGl0c2VsZiBtdXRhdGVzIHRoZSBET00gYWZ0ZXIgKmFueSpcbiAqICAgICAgIGBBZnRlclJlbmRlclBoYXNlLkVhcmx5UmVhZGAgY2FsbGJhY2tzIGFyZSBydW4sIHRoZSBwaGFzZSBjYW4gbm9cbiAqICAgICAgIGxvbmdlciByZWxpYWJseSBzZXJ2ZSBpdHMgcHVycG9zZS5cbiAqXG4gKiAgIDIuKSBJbXBvcnRpbmcgYGFmdGVyUmVuZGVyYCBpbiB0aGUgZnJhbWV3b3JrIGNhbiByZWR1Y2UgdGhlIGFiaWxpdHkgZm9yIGl0XG4gKiAgICAgICB0byBiZSB0cmVlLXNoYWtlbiwgYW5kIHRoZSBmcmFtZXdvcmsgc2hvdWxkbid0IG5lZWQgbXVjaCBvZiB0aGUgYmVoYXZpb3IuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbnRlcm5hbEFmdGVyTmV4dFJlbmRlcihcbiAgY2FsbGJhY2s6IFZvaWRGdW5jdGlvbixcbiAgb3B0aW9ucz86IEludGVybmFsQWZ0ZXJOZXh0UmVuZGVyT3B0aW9ucyxcbikge1xuICBjb25zdCBpbmplY3RvciA9IG9wdGlvbnM/LmluamVjdG9yID8/IGluamVjdChJbmplY3Rvcik7XG5cbiAgLy8gU2ltaWxhcmx5IHRvIHRoZSBwdWJsaWMgYGFmdGVyTmV4dFJlbmRlcmAgZnVuY3Rpb24sIGFuIGludGVybmFsIG9uZVxuICAvLyBpcyBvbmx5IGludm9rZWQgaW4gYSBicm93c2VyIGFzIGxvbmcgYXMgdGhlIHJ1bk9uU2VydmVyIG9wdGlvbiBpcyBub3Qgc2V0LlxuICBpZiAoIW9wdGlvbnM/LnJ1bk9uU2VydmVyICYmICFpc1BsYXRmb3JtQnJvd3NlcihpbmplY3RvcikpIHJldHVybjtcblxuICBjb25zdCBhZnRlclJlbmRlckV2ZW50TWFuYWdlciA9IGluamVjdG9yLmdldChBZnRlclJlbmRlckV2ZW50TWFuYWdlcik7XG4gIGFmdGVyUmVuZGVyRXZlbnRNYW5hZ2VyLmludGVybmFsQ2FsbGJhY2tzLnB1c2goY2FsbGJhY2spO1xufVxuXG4vKipcbiAqIFJlZ2lzdGVyIGNhbGxiYWNrcyB0byBiZSBpbnZva2VkIGVhY2ggdGltZSB0aGUgYXBwbGljYXRpb24gZmluaXNoZXMgcmVuZGVyaW5nLCBkdXJpbmcgdGhlXG4gKiBzcGVjaWZpZWQgcGhhc2VzLiBUaGUgYXZhaWxhYmxlIHBoYXNlcyBhcmU6XG4gKiAtIGBlYXJseVJlYWRgXG4gKiAgIFVzZSB0aGlzIHBoYXNlIHRvICoqcmVhZCoqIGZyb20gdGhlIERPTSBiZWZvcmUgYSBzdWJzZXF1ZW50IGB3cml0ZWAgY2FsbGJhY2ssIGZvciBleGFtcGxlIHRvXG4gKiAgIHBlcmZvcm0gY3VzdG9tIGxheW91dCB0aGF0IHRoZSBicm93c2VyIGRvZXNuJ3QgbmF0aXZlbHkgc3VwcG9ydC4gUHJlZmVyIHRoZSBgcmVhZGAgcGhhc2UgaWZcbiAqICAgcmVhZGluZyBjYW4gd2FpdCB1bnRpbCBhZnRlciB0aGUgd3JpdGUgcGhhc2UuICoqTmV2ZXIqKiB3cml0ZSB0byB0aGUgRE9NIGluIHRoaXMgcGhhc2UuXG4gKiAtIGB3cml0ZWBcbiAqICAgIFVzZSB0aGlzIHBoYXNlIHRvICoqd3JpdGUqKiB0byB0aGUgRE9NLiAqKk5ldmVyKiogcmVhZCBmcm9tIHRoZSBET00gaW4gdGhpcyBwaGFzZS5cbiAqIC0gYG1peGVkUmVhZFdyaXRlYFxuICogICAgVXNlIHRoaXMgcGhhc2UgdG8gcmVhZCBmcm9tIGFuZCB3cml0ZSB0byB0aGUgRE9NIHNpbXVsdGFuZW91c2x5LiAqKk5ldmVyKiogdXNlIHRoaXMgcGhhc2UgaWZcbiAqICAgIGl0IGlzIHBvc3NpYmxlIHRvIGRpdmlkZSB0aGUgd29yayBhbW9uZyB0aGUgb3RoZXIgcGhhc2VzIGluc3RlYWQuXG4gKiAtIGByZWFkYFxuICogICAgVXNlIHRoaXMgcGhhc2UgdG8gKipyZWFkKiogZnJvbSB0aGUgRE9NLiAqKk5ldmVyKiogd3JpdGUgdG8gdGhlIERPTSBpbiB0aGlzIHBoYXNlLlxuICpcbiAqIDxkaXYgY2xhc3M9XCJhbGVydCBpcy1jcml0aWNhbFwiPlxuICpcbiAqIFlvdSBzaG91bGQgcHJlZmVyIHVzaW5nIHRoZSBgcmVhZGAgYW5kIGB3cml0ZWAgcGhhc2VzIG92ZXIgdGhlIGBlYXJseVJlYWRgIGFuZCBgbWl4ZWRSZWFkV3JpdGVgXG4gKiBwaGFzZXMgd2hlbiBwb3NzaWJsZSwgdG8gYXZvaWQgcGVyZm9ybWFuY2UgZGVncmFkYXRpb24uXG4gKlxuICogPC9kaXY+XG4gKlxuICogTm90ZSB0aGF0OlxuICogLSBDYWxsYmFja3MgcnVuIGluIHRoZSBmb2xsb3dpbmcgcGhhc2Ugb3JkZXIgKmFmdGVyIGVhY2ggcmVuZGVyKjpcbiAqICAgMS4gYGVhcmx5UmVhZGBcbiAqICAgMi4gYHdyaXRlYFxuICogICAzLiBgbWl4ZWRSZWFkV3JpdGVgXG4gKiAgIDQuIGByZWFkYFxuICogLSBDYWxsYmFja3MgaW4gdGhlIHNhbWUgcGhhc2UgcnVuIGluIHRoZSBvcmRlciB0aGV5IGFyZSByZWdpc3RlcmVkLlxuICogLSBDYWxsYmFja3MgcnVuIG9uIGJyb3dzZXIgcGxhdGZvcm1zIG9ubHksIHRoZXkgd2lsbCBub3QgcnVuIG9uIHRoZSBzZXJ2ZXIuXG4gKlxuICogVGhlIGZpcnN0IHBoYXNlIGNhbGxiYWNrIHRvIHJ1biBhcyBwYXJ0IG9mIHRoaXMgc3BlYyB3aWxsIHJlY2VpdmUgbm8gcGFyYW1ldGVycy4gRWFjaFxuICogc3Vic2VxdWVudCBwaGFzZSBjYWxsYmFjayBpbiB0aGlzIHNwZWMgd2lsbCByZWNlaXZlIHRoZSByZXR1cm4gdmFsdWUgb2YgdGhlIHByZXZpb3VzbHkgcnVuXG4gKiBwaGFzZSBjYWxsYmFjayBhcyBhIHBhcmFtZXRlci4gVGhpcyBjYW4gYmUgdXNlZCB0byBjb29yZGluYXRlIHdvcmsgYWNyb3NzIG11bHRpcGxlIHBoYXNlcy5cbiAqXG4gKiBBbmd1bGFyIGlzIHVuYWJsZSB0byB2ZXJpZnkgb3IgZW5mb3JjZSB0aGF0IHBoYXNlcyBhcmUgdXNlZCBjb3JyZWN0bHksIGFuZCBpbnN0ZWFkXG4gKiByZWxpZXMgb24gZWFjaCBkZXZlbG9wZXIgdG8gZm9sbG93IHRoZSBndWlkZWxpbmVzIGRvY3VtZW50ZWQgZm9yIGVhY2ggdmFsdWUgYW5kXG4gKiBjYXJlZnVsbHkgY2hvb3NlIHRoZSBhcHByb3ByaWF0ZSBvbmUsIHJlZmFjdG9yaW5nIHRoZWlyIGNvZGUgaWYgbmVjZXNzYXJ5LiBCeSBkb2luZ1xuICogc28sIEFuZ3VsYXIgaXMgYmV0dGVyIGFibGUgdG8gbWluaW1pemUgdGhlIHBlcmZvcm1hbmNlIGRlZ3JhZGF0aW9uIGFzc29jaWF0ZWQgd2l0aFxuICogbWFudWFsIERPTSBhY2Nlc3MsIGVuc3VyaW5nIHRoZSBiZXN0IGV4cGVyaWVuY2UgZm9yIHRoZSBlbmQgdXNlcnMgb2YgeW91ciBhcHBsaWNhdGlvblxuICogb3IgbGlicmFyeS5cbiAqXG4gKiA8ZGl2IGNsYXNzPVwiYWxlcnQgaXMtaW1wb3J0YW50XCI+XG4gKlxuICogQ29tcG9uZW50cyBhcmUgbm90IGd1YXJhbnRlZWQgdG8gYmUgW2h5ZHJhdGVkXShndWlkZS9oeWRyYXRpb24pIGJlZm9yZSB0aGUgY2FsbGJhY2sgcnVucy5cbiAqIFlvdSBtdXN0IHVzZSBjYXV0aW9uIHdoZW4gZGlyZWN0bHkgcmVhZGluZyBvciB3cml0aW5nIHRoZSBET00gYW5kIGxheW91dC5cbiAqXG4gKiA8L2Rpdj5cbiAqXG4gKiBAcGFyYW0gc3BlYyBUaGUgY2FsbGJhY2sgZnVuY3Rpb25zIHRvIHJlZ2lzdGVyXG4gKiBAcGFyYW0gb3B0aW9ucyBPcHRpb25zIHRvIGNvbnRyb2wgdGhlIGJlaGF2aW9yIG9mIHRoZSBjYWxsYmFja1xuICpcbiAqIEB1c2FnZU5vdGVzXG4gKlxuICogVXNlIGBhZnRlclJlbmRlcmAgdG8gcmVhZCBvciB3cml0ZSB0aGUgRE9NIGFmdGVyIGVhY2ggcmVuZGVyLlxuICpcbiAqICMjIyBFeGFtcGxlXG4gKiBgYGB0c1xuICogQENvbXBvbmVudCh7XG4gKiAgIHNlbGVjdG9yOiAnbXktY21wJyxcbiAqICAgdGVtcGxhdGU6IGA8c3BhbiAjY29udGVudD57eyAuLi4gfX08L3NwYW4+YCxcbiAqIH0pXG4gKiBleHBvcnQgY2xhc3MgTXlDb21wb25lbnQge1xuICogICBAVmlld0NoaWxkKCdjb250ZW50JykgY29udGVudFJlZjogRWxlbWVudFJlZjtcbiAqXG4gKiAgIGNvbnN0cnVjdG9yKCkge1xuICogICAgIGFmdGVyUmVuZGVyKHtcbiAqICAgICAgIHJlYWQ6ICgpID0+IHtcbiAqICAgICAgICAgY29uc29sZS5sb2coJ2NvbnRlbnQgaGVpZ2h0OiAnICsgdGhpcy5jb250ZW50UmVmLm5hdGl2ZUVsZW1lbnQuc2Nyb2xsSGVpZ2h0KTtcbiAqICAgICAgIH1cbiAqICAgICB9KTtcbiAqICAgfVxuICogfVxuICogYGBgXG4gKlxuICogQGRldmVsb3BlclByZXZpZXdcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFmdGVyUmVuZGVyPEUgPSBuZXZlciwgVyA9IG5ldmVyLCBNID0gbmV2ZXI+KFxuICBzcGVjOiB7XG4gICAgZWFybHlSZWFkPzogKCkgPT4gRTtcbiAgICB3cml0ZT86ICguLi5hcmdzOiDJtUZpcnN0QXZhaWxhYmxlPFtFXT4pID0+IFc7XG4gICAgbWl4ZWRSZWFkV3JpdGU/OiAoLi4uYXJnczogybVGaXJzdEF2YWlsYWJsZTxbVywgRV0+KSA9PiBNO1xuICAgIHJlYWQ/OiAoLi4uYXJnczogybVGaXJzdEF2YWlsYWJsZTxbTSwgVywgRV0+KSA9PiB2b2lkO1xuICB9LFxuICBvcHRpb25zPzogT21pdDxBZnRlclJlbmRlck9wdGlvbnMsICdwaGFzZSc+LFxuKTogQWZ0ZXJSZW5kZXJSZWY7XG5cbi8qKlxuICogUmVnaXN0ZXIgYSBjYWxsYmFjayB0byBiZSBpbnZva2VkIGVhY2ggdGltZSB0aGUgYXBwbGljYXRpb24gZmluaXNoZXMgcmVuZGVyaW5nLCBkdXJpbmcgdGhlXG4gKiBgbWl4ZWRSZWFkV3JpdGVgIHBoYXNlLlxuICpcbiAqIDxkaXYgY2xhc3M9XCJhbGVydCBpcy1jcml0aWNhbFwiPlxuICpcbiAqIFlvdSBzaG91bGQgcHJlZmVyIHNwZWNpZnlpbmcgYW4gZXhwbGljaXQgcGhhc2UgZm9yIHRoZSBjYWxsYmFjayBpbnN0ZWFkLCBvciB5b3UgcmlzayBzaWduaWZpY2FudFxuICogcGVyZm9ybWFuY2UgZGVncmFkYXRpb24uXG4gKlxuICogPC9kaXY+XG4gKlxuICogTm90ZSB0aGF0IHRoZSBjYWxsYmFjayB3aWxsIHJ1blxuICogLSBpbiB0aGUgb3JkZXIgaXQgd2FzIHJlZ2lzdGVyZWRcbiAqIC0gb25jZSBwZXIgcmVuZGVyXG4gKiAtIG9uIGJyb3dzZXIgcGxhdGZvcm1zIG9ubHlcbiAqIC0gZHVyaW5nIHRoZSBgbWl4ZWRSZWFkV3JpdGVgIHBoYXNlXG4gKlxuICogPGRpdiBjbGFzcz1cImFsZXJ0IGlzLWltcG9ydGFudFwiPlxuICpcbiAqIENvbXBvbmVudHMgYXJlIG5vdCBndWFyYW50ZWVkIHRvIGJlIFtoeWRyYXRlZF0oZ3VpZGUvaHlkcmF0aW9uKSBiZWZvcmUgdGhlIGNhbGxiYWNrIHJ1bnMuXG4gKiBZb3UgbXVzdCB1c2UgY2F1dGlvbiB3aGVuIGRpcmVjdGx5IHJlYWRpbmcgb3Igd3JpdGluZyB0aGUgRE9NIGFuZCBsYXlvdXQuXG4gKlxuICogPC9kaXY+XG4gKlxuICogQHBhcmFtIGNhbGxiYWNrIEEgY2FsbGJhY2sgZnVuY3Rpb24gdG8gcmVnaXN0ZXJcbiAqIEBwYXJhbSBvcHRpb25zIE9wdGlvbnMgdG8gY29udHJvbCB0aGUgYmVoYXZpb3Igb2YgdGhlIGNhbGxiYWNrXG4gKlxuICogQHVzYWdlTm90ZXNcbiAqXG4gKiBVc2UgYGFmdGVyUmVuZGVyYCB0byByZWFkIG9yIHdyaXRlIHRoZSBET00gYWZ0ZXIgZWFjaCByZW5kZXIuXG4gKlxuICogIyMjIEV4YW1wbGVcbiAqIGBgYHRzXG4gKiBAQ29tcG9uZW50KHtcbiAqICAgc2VsZWN0b3I6ICdteS1jbXAnLFxuICogICB0ZW1wbGF0ZTogYDxzcGFuICNjb250ZW50Pnt7IC4uLiB9fTwvc3Bhbj5gLFxuICogfSlcbiAqIGV4cG9ydCBjbGFzcyBNeUNvbXBvbmVudCB7XG4gKiAgIEBWaWV3Q2hpbGQoJ2NvbnRlbnQnKSBjb250ZW50UmVmOiBFbGVtZW50UmVmO1xuICpcbiAqICAgY29uc3RydWN0b3IoKSB7XG4gKiAgICAgYWZ0ZXJSZW5kZXIoe1xuICogICAgICAgcmVhZDogKCkgPT4ge1xuICogICAgICAgICBjb25zb2xlLmxvZygnY29udGVudCBoZWlnaHQ6ICcgKyB0aGlzLmNvbnRlbnRSZWYubmF0aXZlRWxlbWVudC5zY3JvbGxIZWlnaHQpO1xuICogICAgICAgfVxuICogICAgIH0pO1xuICogICB9XG4gKiB9XG4gKiBgYGBcbiAqXG4gKiBAZGV2ZWxvcGVyUHJldmlld1xuICovXG5leHBvcnQgZnVuY3Rpb24gYWZ0ZXJSZW5kZXIoY2FsbGJhY2s6IFZvaWRGdW5jdGlvbiwgb3B0aW9ucz86IEFmdGVyUmVuZGVyT3B0aW9ucyk6IEFmdGVyUmVuZGVyUmVmO1xuXG5leHBvcnQgZnVuY3Rpb24gYWZ0ZXJSZW5kZXIoXG4gIGNhbGxiYWNrT3JTcGVjOlxuICAgIHwgVm9pZEZ1bmN0aW9uXG4gICAgfCB7XG4gICAgICAgIGVhcmx5UmVhZD86ICgpID0+IHVua25vd247XG4gICAgICAgIHdyaXRlPzogKHI/OiB1bmtub3duKSA9PiB1bmtub3duO1xuICAgICAgICBtaXhlZFJlYWRXcml0ZT86IChyPzogdW5rbm93bikgPT4gdW5rbm93bjtcbiAgICAgICAgcmVhZD86IChyPzogdW5rbm93bikgPT4gdm9pZDtcbiAgICAgIH0sXG4gIG9wdGlvbnM/OiBBZnRlclJlbmRlck9wdGlvbnMsXG4pOiBBZnRlclJlbmRlclJlZiB7XG4gIG5nRGV2TW9kZSAmJlxuICAgIGFzc2VydE5vdEluUmVhY3RpdmVDb250ZXh0KFxuICAgICAgYWZ0ZXJSZW5kZXIsXG4gICAgICAnQ2FsbCBgYWZ0ZXJSZW5kZXJgIG91dHNpZGUgb2YgYSByZWFjdGl2ZSBjb250ZXh0LiBGb3IgZXhhbXBsZSwgc2NoZWR1bGUgdGhlIHJlbmRlciAnICtcbiAgICAgICAgJ2NhbGxiYWNrIGluc2lkZSB0aGUgY29tcG9uZW50IGNvbnN0cnVjdG9yYC4nLFxuICAgICk7XG5cbiAgIW9wdGlvbnMgJiYgYXNzZXJ0SW5JbmplY3Rpb25Db250ZXh0KGFmdGVyUmVuZGVyKTtcbiAgY29uc3QgaW5qZWN0b3IgPSBvcHRpb25zPy5pbmplY3RvciA/PyBpbmplY3QoSW5qZWN0b3IpO1xuXG4gIGlmICghaXNQbGF0Zm9ybUJyb3dzZXIoaW5qZWN0b3IpKSB7XG4gICAgcmV0dXJuIE5PT1BfQUZURVJfUkVOREVSX1JFRjtcbiAgfVxuXG4gIHBlcmZvcm1hbmNlTWFya0ZlYXR1cmUoJ05nQWZ0ZXJSZW5kZXInKTtcblxuICByZXR1cm4gYWZ0ZXJSZW5kZXJJbXBsKFxuICAgIGNhbGxiYWNrT3JTcGVjLFxuICAgIGluamVjdG9yLFxuICAgIC8qIG9uY2UgKi8gZmFsc2UsXG4gICAgb3B0aW9ucz8ucGhhc2UgPz8gQWZ0ZXJSZW5kZXJQaGFzZS5NaXhlZFJlYWRXcml0ZSxcbiAgKTtcbn1cblxuLyoqXG4gKiBSZWdpc3RlciBjYWxsYmFja3MgdG8gYmUgaW52b2tlZCB0aGUgbmV4dCB0aW1lIHRoZSBhcHBsaWNhdGlvbiBmaW5pc2hlcyByZW5kZXJpbmcsIGR1cmluZyB0aGVcbiAqIHNwZWNpZmllZCBwaGFzZXMuIFRoZSBhdmFpbGFibGUgcGhhc2VzIGFyZTpcbiAqIC0gYGVhcmx5UmVhZGBcbiAqICAgVXNlIHRoaXMgcGhhc2UgdG8gKipyZWFkKiogZnJvbSB0aGUgRE9NIGJlZm9yZSBhIHN1YnNlcXVlbnQgYHdyaXRlYCBjYWxsYmFjaywgZm9yIGV4YW1wbGUgdG9cbiAqICAgcGVyZm9ybSBjdXN0b20gbGF5b3V0IHRoYXQgdGhlIGJyb3dzZXIgZG9lc24ndCBuYXRpdmVseSBzdXBwb3J0LiBQcmVmZXIgdGhlIGByZWFkYCBwaGFzZSBpZlxuICogICByZWFkaW5nIGNhbiB3YWl0IHVudGlsIGFmdGVyIHRoZSB3cml0ZSBwaGFzZS4gKipOZXZlcioqIHdyaXRlIHRvIHRoZSBET00gaW4gdGhpcyBwaGFzZS5cbiAqIC0gYHdyaXRlYFxuICogICAgVXNlIHRoaXMgcGhhc2UgdG8gKip3cml0ZSoqIHRvIHRoZSBET00uICoqTmV2ZXIqKiByZWFkIGZyb20gdGhlIERPTSBpbiB0aGlzIHBoYXNlLlxuICogLSBgbWl4ZWRSZWFkV3JpdGVgXG4gKiAgICBVc2UgdGhpcyBwaGFzZSB0byByZWFkIGZyb20gYW5kIHdyaXRlIHRvIHRoZSBET00gc2ltdWx0YW5lb3VzbHkuICoqTmV2ZXIqKiB1c2UgdGhpcyBwaGFzZSBpZlxuICogICAgaXQgaXMgcG9zc2libGUgdG8gZGl2aWRlIHRoZSB3b3JrIGFtb25nIHRoZSBvdGhlciBwaGFzZXMgaW5zdGVhZC5cbiAqIC0gYHJlYWRgXG4gKiAgICBVc2UgdGhpcyBwaGFzZSB0byAqKnJlYWQqKiBmcm9tIHRoZSBET00uICoqTmV2ZXIqKiB3cml0ZSB0byB0aGUgRE9NIGluIHRoaXMgcGhhc2UuXG4gKlxuICogPGRpdiBjbGFzcz1cImFsZXJ0IGlzLWNyaXRpY2FsXCI+XG4gKlxuICogWW91IHNob3VsZCBwcmVmZXIgdXNpbmcgdGhlIGByZWFkYCBhbmQgYHdyaXRlYCBwaGFzZXMgb3ZlciB0aGUgYGVhcmx5UmVhZGAgYW5kIGBtaXhlZFJlYWRXcml0ZWBcbiAqIHBoYXNlcyB3aGVuIHBvc3NpYmxlLCB0byBhdm9pZCBwZXJmb3JtYW5jZSBkZWdyYWRhdGlvbi5cbiAqXG4gKiA8L2Rpdj5cbiAqXG4gKiBOb3RlIHRoYXQ6XG4gKiAtIENhbGxiYWNrcyBydW4gaW4gdGhlIGZvbGxvd2luZyBwaGFzZSBvcmRlciAqb25jZSwgYWZ0ZXIgdGhlIG5leHQgcmVuZGVyKjpcbiAqICAgMS4gYGVhcmx5UmVhZGBcbiAqICAgMi4gYHdyaXRlYFxuICogICAzLiBgbWl4ZWRSZWFkV3JpdGVgXG4gKiAgIDQuIGByZWFkYFxuICogLSBDYWxsYmFja3MgaW4gdGhlIHNhbWUgcGhhc2UgcnVuIGluIHRoZSBvcmRlciB0aGV5IGFyZSByZWdpc3RlcmVkLlxuICogLSBDYWxsYmFja3MgcnVuIG9uIGJyb3dzZXIgcGxhdGZvcm1zIG9ubHksIHRoZXkgd2lsbCBub3QgcnVuIG9uIHRoZSBzZXJ2ZXIuXG4gKlxuICogVGhlIGZpcnN0IHBoYXNlIGNhbGxiYWNrIHRvIHJ1biBhcyBwYXJ0IG9mIHRoaXMgc3BlYyB3aWxsIHJlY2VpdmUgbm8gcGFyYW1ldGVycy4gRWFjaFxuICogc3Vic2VxdWVudCBwaGFzZSBjYWxsYmFjayBpbiB0aGlzIHNwZWMgd2lsbCByZWNlaXZlIHRoZSByZXR1cm4gdmFsdWUgb2YgdGhlIHByZXZpb3VzbHkgcnVuXG4gKiBwaGFzZSBjYWxsYmFjayBhcyBhIHBhcmFtZXRlci4gVGhpcyBjYW4gYmUgdXNlZCB0byBjb29yZGluYXRlIHdvcmsgYWNyb3NzIG11bHRpcGxlIHBoYXNlcy5cbiAqXG4gKiBBbmd1bGFyIGlzIHVuYWJsZSB0byB2ZXJpZnkgb3IgZW5mb3JjZSB0aGF0IHBoYXNlcyBhcmUgdXNlZCBjb3JyZWN0bHksIGFuZCBpbnN0ZWFkXG4gKiByZWxpZXMgb24gZWFjaCBkZXZlbG9wZXIgdG8gZm9sbG93IHRoZSBndWlkZWxpbmVzIGRvY3VtZW50ZWQgZm9yIGVhY2ggdmFsdWUgYW5kXG4gKiBjYXJlZnVsbHkgY2hvb3NlIHRoZSBhcHByb3ByaWF0ZSBvbmUsIHJlZmFjdG9yaW5nIHRoZWlyIGNvZGUgaWYgbmVjZXNzYXJ5LiBCeSBkb2luZ1xuICogc28sIEFuZ3VsYXIgaXMgYmV0dGVyIGFibGUgdG8gbWluaW1pemUgdGhlIHBlcmZvcm1hbmNlIGRlZ3JhZGF0aW9uIGFzc29jaWF0ZWQgd2l0aFxuICogbWFudWFsIERPTSBhY2Nlc3MsIGVuc3VyaW5nIHRoZSBiZXN0IGV4cGVyaWVuY2UgZm9yIHRoZSBlbmQgdXNlcnMgb2YgeW91ciBhcHBsaWNhdGlvblxuICogb3IgbGlicmFyeS5cbiAqXG4gKiA8ZGl2IGNsYXNzPVwiYWxlcnQgaXMtaW1wb3J0YW50XCI+XG4gKlxuICogQ29tcG9uZW50cyBhcmUgbm90IGd1YXJhbnRlZWQgdG8gYmUgW2h5ZHJhdGVkXShndWlkZS9oeWRyYXRpb24pIGJlZm9yZSB0aGUgY2FsbGJhY2sgcnVucy5cbiAqIFlvdSBtdXN0IHVzZSBjYXV0aW9uIHdoZW4gZGlyZWN0bHkgcmVhZGluZyBvciB3cml0aW5nIHRoZSBET00gYW5kIGxheW91dC5cbiAqXG4gKiA8L2Rpdj5cbiAqXG4gKiBAcGFyYW0gc3BlYyBUaGUgY2FsbGJhY2sgZnVuY3Rpb25zIHRvIHJlZ2lzdGVyXG4gKiBAcGFyYW0gb3B0aW9ucyBPcHRpb25zIHRvIGNvbnRyb2wgdGhlIGJlaGF2aW9yIG9mIHRoZSBjYWxsYmFja1xuICpcbiAqIEB1c2FnZU5vdGVzXG4gKlxuICogVXNlIGBhZnRlck5leHRSZW5kZXJgIHRvIHJlYWQgb3Igd3JpdGUgdGhlIERPTSBvbmNlLFxuICogZm9yIGV4YW1wbGUgdG8gaW5pdGlhbGl6ZSBhIG5vbi1Bbmd1bGFyIGxpYnJhcnkuXG4gKlxuICogIyMjIEV4YW1wbGVcbiAqIGBgYHRzXG4gKiBAQ29tcG9uZW50KHtcbiAqICAgc2VsZWN0b3I6ICdteS1jaGFydC1jbXAnLFxuICogICB0ZW1wbGF0ZTogYDxkaXYgI2NoYXJ0Pnt7IC4uLiB9fTwvZGl2PmAsXG4gKiB9KVxuICogZXhwb3J0IGNsYXNzIE15Q2hhcnRDbXAge1xuICogICBAVmlld0NoaWxkKCdjaGFydCcpIGNoYXJ0UmVmOiBFbGVtZW50UmVmO1xuICogICBjaGFydDogTXlDaGFydHxudWxsO1xuICpcbiAqICAgY29uc3RydWN0b3IoKSB7XG4gKiAgICAgYWZ0ZXJOZXh0UmVuZGVyKHtcbiAqICAgICAgIHdyaXRlOiAoKSA9PiB7XG4gKiAgICAgICAgIHRoaXMuY2hhcnQgPSBuZXcgTXlDaGFydCh0aGlzLmNoYXJ0UmVmLm5hdGl2ZUVsZW1lbnQpO1xuICogICAgICAgfVxuICogICAgIH0pO1xuICogICB9XG4gKiB9XG4gKiBgYGBcbiAqXG4gKiBAZGV2ZWxvcGVyUHJldmlld1xuICovXG5leHBvcnQgZnVuY3Rpb24gYWZ0ZXJOZXh0UmVuZGVyPEUgPSBuZXZlciwgVyA9IG5ldmVyLCBNID0gbmV2ZXI+KFxuICBzcGVjOiB7XG4gICAgZWFybHlSZWFkPzogKCkgPT4gRTtcbiAgICB3cml0ZT86ICguLi5hcmdzOiDJtUZpcnN0QXZhaWxhYmxlPFtFXT4pID0+IFc7XG4gICAgbWl4ZWRSZWFkV3JpdGU/OiAoLi4uYXJnczogybVGaXJzdEF2YWlsYWJsZTxbVywgRV0+KSA9PiBNO1xuICAgIHJlYWQ/OiAoLi4uYXJnczogybVGaXJzdEF2YWlsYWJsZTxbTSwgVywgRV0+KSA9PiB2b2lkO1xuICB9LFxuICBvcHRpb25zPzogT21pdDxBZnRlclJlbmRlck9wdGlvbnMsICdwaGFzZSc+LFxuKTogQWZ0ZXJSZW5kZXJSZWY7XG5cbi8qKlxuICogUmVnaXN0ZXIgYSBjYWxsYmFjayB0byBiZSBpbnZva2VkIHRoZSBuZXh0IHRpbWUgdGhlIGFwcGxpY2F0aW9uIGZpbmlzaGVzIHJlbmRlcmluZywgZHVyaW5nIHRoZVxuICogYG1peGVkUmVhZFdyaXRlYCBwaGFzZS5cbiAqXG4gKiA8ZGl2IGNsYXNzPVwiYWxlcnQgaXMtY3JpdGljYWxcIj5cbiAqXG4gKiBZb3Ugc2hvdWxkIHByZWZlciBzcGVjaWZ5aW5nIGFuIGV4cGxpY2l0IHBoYXNlIGZvciB0aGUgY2FsbGJhY2sgaW5zdGVhZCwgb3IgeW91IHJpc2sgc2lnbmlmaWNhbnRcbiAqIHBlcmZvcm1hbmNlIGRlZ3JhZGF0aW9uLlxuICpcbiAqIDwvZGl2PlxuICpcbiAqIE5vdGUgdGhhdCB0aGUgY2FsbGJhY2sgd2lsbCBydW5cbiAqIC0gaW4gdGhlIG9yZGVyIGl0IHdhcyByZWdpc3RlcmVkXG4gKiAtIG9uIGJyb3dzZXIgcGxhdGZvcm1zIG9ubHlcbiAqIC0gZHVyaW5nIHRoZSBgbWl4ZWRSZWFkV3JpdGVgIHBoYXNlXG4gKlxuICogPGRpdiBjbGFzcz1cImFsZXJ0IGlzLWltcG9ydGFudFwiPlxuICpcbiAqIENvbXBvbmVudHMgYXJlIG5vdCBndWFyYW50ZWVkIHRvIGJlIFtoeWRyYXRlZF0oZ3VpZGUvaHlkcmF0aW9uKSBiZWZvcmUgdGhlIGNhbGxiYWNrIHJ1bnMuXG4gKiBZb3UgbXVzdCB1c2UgY2F1dGlvbiB3aGVuIGRpcmVjdGx5IHJlYWRpbmcgb3Igd3JpdGluZyB0aGUgRE9NIGFuZCBsYXlvdXQuXG4gKlxuICogPC9kaXY+XG4gKlxuICogQHBhcmFtIGNhbGxiYWNrIEEgY2FsbGJhY2sgZnVuY3Rpb24gdG8gcmVnaXN0ZXJcbiAqIEBwYXJhbSBvcHRpb25zIE9wdGlvbnMgdG8gY29udHJvbCB0aGUgYmVoYXZpb3Igb2YgdGhlIGNhbGxiYWNrXG4gKlxuICogQHVzYWdlTm90ZXNcbiAqXG4gKiBVc2UgYGFmdGVyTmV4dFJlbmRlcmAgdG8gcmVhZCBvciB3cml0ZSB0aGUgRE9NIG9uY2UsXG4gKiBmb3IgZXhhbXBsZSB0byBpbml0aWFsaXplIGEgbm9uLUFuZ3VsYXIgbGlicmFyeS5cbiAqXG4gKiAjIyMgRXhhbXBsZVxuICogYGBgdHNcbiAqIEBDb21wb25lbnQoe1xuICogICBzZWxlY3RvcjogJ215LWNoYXJ0LWNtcCcsXG4gKiAgIHRlbXBsYXRlOiBgPGRpdiAjY2hhcnQ+e3sgLi4uIH19PC9kaXY+YCxcbiAqIH0pXG4gKiBleHBvcnQgY2xhc3MgTXlDaGFydENtcCB7XG4gKiAgIEBWaWV3Q2hpbGQoJ2NoYXJ0JykgY2hhcnRSZWY6IEVsZW1lbnRSZWY7XG4gKiAgIGNoYXJ0OiBNeUNoYXJ0fG51bGw7XG4gKlxuICogICBjb25zdHJ1Y3RvcigpIHtcbiAqICAgICBhZnRlck5leHRSZW5kZXIoe1xuICogICAgICAgd3JpdGU6ICgpID0+IHtcbiAqICAgICAgICAgdGhpcy5jaGFydCA9IG5ldyBNeUNoYXJ0KHRoaXMuY2hhcnRSZWYubmF0aXZlRWxlbWVudCk7XG4gKiAgICAgICB9XG4gKiAgICAgfSk7XG4gKiAgIH1cbiAqIH1cbiAqIGBgYFxuICpcbiAqIEBkZXZlbG9wZXJQcmV2aWV3XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhZnRlck5leHRSZW5kZXIoXG4gIGNhbGxiYWNrOiBWb2lkRnVuY3Rpb24sXG4gIG9wdGlvbnM/OiBBZnRlclJlbmRlck9wdGlvbnMsXG4pOiBBZnRlclJlbmRlclJlZjtcblxuZXhwb3J0IGZ1bmN0aW9uIGFmdGVyTmV4dFJlbmRlcihcbiAgY2FsbGJhY2tPclNwZWM6XG4gICAgfCBWb2lkRnVuY3Rpb25cbiAgICB8IHtcbiAgICAgICAgZWFybHlSZWFkPzogKCkgPT4gdW5rbm93bjtcbiAgICAgICAgd3JpdGU/OiAocj86IHVua25vd24pID0+IHVua25vd247XG4gICAgICAgIG1peGVkUmVhZFdyaXRlPzogKHI/OiB1bmtub3duKSA9PiB1bmtub3duO1xuICAgICAgICByZWFkPzogKHI/OiB1bmtub3duKSA9PiB2b2lkO1xuICAgICAgfSxcbiAgb3B0aW9ucz86IEFmdGVyUmVuZGVyT3B0aW9ucyxcbik6IEFmdGVyUmVuZGVyUmVmIHtcbiAgIW9wdGlvbnMgJiYgYXNzZXJ0SW5JbmplY3Rpb25Db250ZXh0KGFmdGVyTmV4dFJlbmRlcik7XG4gIGNvbnN0IGluamVjdG9yID0gb3B0aW9ucz8uaW5qZWN0b3IgPz8gaW5qZWN0KEluamVjdG9yKTtcblxuICBpZiAoIWlzUGxhdGZvcm1Ccm93c2VyKGluamVjdG9yKSkge1xuICAgIHJldHVybiBOT09QX0FGVEVSX1JFTkRFUl9SRUY7XG4gIH1cblxuICBwZXJmb3JtYW5jZU1hcmtGZWF0dXJlKCdOZ0FmdGVyTmV4dFJlbmRlcicpO1xuXG4gIHJldHVybiBhZnRlclJlbmRlckltcGwoXG4gICAgY2FsbGJhY2tPclNwZWMsXG4gICAgaW5qZWN0b3IsXG4gICAgLyogb25jZSAqLyB0cnVlLFxuICAgIG9wdGlvbnM/LnBoYXNlID8/IEFmdGVyUmVuZGVyUGhhc2UuTWl4ZWRSZWFkV3JpdGUsXG4gICk7XG59XG5cbmZ1bmN0aW9uIGdldFNwZWMoXG4gIGNhbGxiYWNrT3JTcGVjOlxuICAgIHwgVm9pZEZ1bmN0aW9uXG4gICAgfCB7XG4gICAgICAgIGVhcmx5UmVhZD86ICgpID0+IHVua25vd247XG4gICAgICAgIHdyaXRlPzogKHI/OiB1bmtub3duKSA9PiB1bmtub3duO1xuICAgICAgICBtaXhlZFJlYWRXcml0ZT86IChyPzogdW5rbm93bikgPT4gdW5rbm93bjtcbiAgICAgICAgcmVhZD86IChyPzogdW5rbm93bikgPT4gdm9pZDtcbiAgICAgIH0sXG4gIHBoYXNlOiBBZnRlclJlbmRlclBoYXNlLFxuKSB7XG4gIGlmIChjYWxsYmFja09yU3BlYyBpbnN0YW5jZW9mIEZ1bmN0aW9uKSB7XG4gICAgc3dpdGNoIChwaGFzZSkge1xuICAgICAgY2FzZSBBZnRlclJlbmRlclBoYXNlLkVhcmx5UmVhZDpcbiAgICAgICAgcmV0dXJuIHtlYXJseVJlYWQ6IGNhbGxiYWNrT3JTcGVjfTtcbiAgICAgIGNhc2UgQWZ0ZXJSZW5kZXJQaGFzZS5Xcml0ZTpcbiAgICAgICAgcmV0dXJuIHt3cml0ZTogY2FsbGJhY2tPclNwZWN9O1xuICAgICAgY2FzZSBBZnRlclJlbmRlclBoYXNlLk1peGVkUmVhZFdyaXRlOlxuICAgICAgICByZXR1cm4ge21peGVkUmVhZFdyaXRlOiBjYWxsYmFja09yU3BlY307XG4gICAgICBjYXNlIEFmdGVyUmVuZGVyUGhhc2UuUmVhZDpcbiAgICAgICAgcmV0dXJuIHtyZWFkOiBjYWxsYmFja09yU3BlY307XG4gICAgfVxuICB9XG4gIHJldHVybiBjYWxsYmFja09yU3BlYztcbn1cblxuLyoqXG4gKiBTaGFyZWQgaW1wbGVtZW50YXRpb24gZm9yIGBhZnRlclJlbmRlcmAgYW5kIGBhZnRlck5leHRSZW5kZXJgLlxuICovXG5mdW5jdGlvbiBhZnRlclJlbmRlckltcGwoXG4gIGNhbGxiYWNrT3JTcGVjOlxuICAgIHwgVm9pZEZ1bmN0aW9uXG4gICAgfCB7XG4gICAgICAgIGVhcmx5UmVhZD86ICgpID0+IHVua25vd247XG4gICAgICAgIHdyaXRlPzogKHI/OiB1bmtub3duKSA9PiB1bmtub3duO1xuICAgICAgICBtaXhlZFJlYWRXcml0ZT86IChyPzogdW5rbm93bikgPT4gdW5rbm93bjtcbiAgICAgICAgcmVhZD86IChyPzogdW5rbm93bikgPT4gdm9pZDtcbiAgICAgIH0sXG4gIGluamVjdG9yOiBJbmplY3RvcixcbiAgb25jZTogYm9vbGVhbixcbiAgcGhhc2U6IEFmdGVyUmVuZGVyUGhhc2UsXG4pOiBBZnRlclJlbmRlclJlZiB7XG4gIGNvbnN0IHNwZWMgPSBnZXRTcGVjKGNhbGxiYWNrT3JTcGVjLCBwaGFzZSk7XG4gIGNvbnN0IGFmdGVyUmVuZGVyRXZlbnRNYW5hZ2VyID0gaW5qZWN0b3IuZ2V0KEFmdGVyUmVuZGVyRXZlbnRNYW5hZ2VyKTtcbiAgLy8gTGF6aWx5IGluaXRpYWxpemUgdGhlIGhhbmRsZXIgaW1wbGVtZW50YXRpb24sIGlmIG5lY2Vzc2FyeS4gVGhpcyBpcyBzbyB0aGF0IGl0IGNhbiBiZVxuICAvLyB0cmVlLXNoYWtlbiBpZiBgYWZ0ZXJSZW5kZXJgIGFuZCBgYWZ0ZXJOZXh0UmVuZGVyYCBhcmVuJ3QgdXNlZC5cbiAgY29uc3QgY2FsbGJhY2tIYW5kbGVyID0gKGFmdGVyUmVuZGVyRXZlbnRNYW5hZ2VyLmhhbmRsZXIgPz89XG4gICAgbmV3IEFmdGVyUmVuZGVyQ2FsbGJhY2tIYW5kbGVySW1wbCgpKTtcblxuICBjb25zdCBwaXBlbGluZWRBcmdzOiBbXSB8IFt1bmtub3duXSA9IFtdO1xuICBjb25zdCBpbnN0YW5jZXM6IEFmdGVyUmVuZGVyQ2FsbGJhY2tbXSA9IFtdO1xuXG4gIGNvbnN0IGRlc3Ryb3kgPSAoKSA9PiB7XG4gICAgZm9yIChjb25zdCBpbnN0YW5jZSBvZiBpbnN0YW5jZXMpIHtcbiAgICAgIGNhbGxiYWNrSGFuZGxlci51bnJlZ2lzdGVyKGluc3RhbmNlKTtcbiAgICB9XG4gICAgdW5yZWdpc3RlckZuKCk7XG4gIH07XG4gIGNvbnN0IHVucmVnaXN0ZXJGbiA9IGluamVjdG9yLmdldChEZXN0cm95UmVmKS5vbkRlc3Ryb3koZGVzdHJveSk7XG4gIGxldCBjYWxsYmFja3NMZWZ0VG9SdW4gPSAwO1xuXG4gIGNvbnN0IHJlZ2lzdGVyQ2FsbGJhY2sgPSAoXG4gICAgcGhhc2U6IEFmdGVyUmVuZGVyUGhhc2UsXG4gICAgcGhhc2VDYWxsYmFjazogdW5kZWZpbmVkIHwgKCguLi5hcmdzOiB1bmtub3duW10pID0+IHVua25vd24pLFxuICApID0+IHtcbiAgICBpZiAoIXBoYXNlQ2FsbGJhY2spIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3QgY2FsbGJhY2sgPSBvbmNlXG4gICAgICA/ICguLi5hcmdzOiBbdW5rbm93bl0pID0+IHtcbiAgICAgICAgICBjYWxsYmFja3NMZWZ0VG9SdW4tLTtcbiAgICAgICAgICBpZiAoY2FsbGJhY2tzTGVmdFRvUnVuIDwgMSkge1xuICAgICAgICAgICAgZGVzdHJveSgpO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gcGhhc2VDYWxsYmFjayguLi5hcmdzKTtcbiAgICAgICAgfVxuICAgICAgOiBwaGFzZUNhbGxiYWNrO1xuXG4gICAgY29uc3QgaW5zdGFuY2UgPSBydW5JbkluamVjdGlvbkNvbnRleHQoXG4gICAgICBpbmplY3RvcixcbiAgICAgICgpID0+IG5ldyBBZnRlclJlbmRlckNhbGxiYWNrKHBoYXNlLCBwaXBlbGluZWRBcmdzLCBjYWxsYmFjayksXG4gICAgKTtcbiAgICBjYWxsYmFja0hhbmRsZXIucmVnaXN0ZXIoaW5zdGFuY2UpO1xuICAgIGluc3RhbmNlcy5wdXNoKGluc3RhbmNlKTtcbiAgICBjYWxsYmFja3NMZWZ0VG9SdW4rKztcbiAgfTtcblxuICByZWdpc3RlckNhbGxiYWNrKEFmdGVyUmVuZGVyUGhhc2UuRWFybHlSZWFkLCBzcGVjLmVhcmx5UmVhZCk7XG4gIHJlZ2lzdGVyQ2FsbGJhY2soQWZ0ZXJSZW5kZXJQaGFzZS5Xcml0ZSwgc3BlYy53cml0ZSk7XG4gIHJlZ2lzdGVyQ2FsbGJhY2soQWZ0ZXJSZW5kZXJQaGFzZS5NaXhlZFJlYWRXcml0ZSwgc3BlYy5taXhlZFJlYWRXcml0ZSk7XG4gIHJlZ2lzdGVyQ2FsbGJhY2soQWZ0ZXJSZW5kZXJQaGFzZS5SZWFkLCBzcGVjLnJlYWQpO1xuXG4gIHJldHVybiB7ZGVzdHJveX07XG59XG5cbi8qKlxuICogQSB3cmFwcGVyIGFyb3VuZCBhIGZ1bmN0aW9uIHRvIGJlIHVzZWQgYXMgYW4gYWZ0ZXIgcmVuZGVyIGNhbGxiYWNrLlxuICovXG5jbGFzcyBBZnRlclJlbmRlckNhbGxiYWNrIHtcbiAgcHJpdmF0ZSB6b25lID0gaW5qZWN0KE5nWm9uZSk7XG4gIHByaXZhdGUgZXJyb3JIYW5kbGVyID0gaW5qZWN0KEVycm9ySGFuZGxlciwge29wdGlvbmFsOiB0cnVlfSk7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgcmVhZG9ubHkgcGhhc2U6IEFmdGVyUmVuZGVyUGhhc2UsXG4gICAgcHJpdmF0ZSBwaXBlbGluZWRBcmdzOiBbXSB8IFt1bmtub3duXSxcbiAgICBwcml2YXRlIGNhbGxiYWNrRm46ICguLi5hcmdzOiB1bmtub3duW10pID0+IHVua25vd24sXG4gICkge1xuICAgIC8vIFJlZ2lzdGVyaW5nIGEgY2FsbGJhY2sgd2lsbCBub3RpZnkgdGhlIHNjaGVkdWxlci5cbiAgICBpbmplY3QoQ2hhbmdlRGV0ZWN0aW9uU2NoZWR1bGVyLCB7b3B0aW9uYWw6IHRydWV9KT8ubm90aWZ5KE5vdGlmaWNhdGlvblNvdXJjZS5OZXdSZW5kZXJIb29rKTtcbiAgfVxuXG4gIGludm9rZSgpIHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgcmVzdWx0ID0gdGhpcy56b25lLnJ1bk91dHNpZGVBbmd1bGFyKCgpID0+XG4gICAgICAgIHRoaXMuY2FsbGJhY2tGbi5hcHBseShudWxsLCB0aGlzLnBpcGVsaW5lZEFyZ3MgYXMgW3Vua25vd25dKSxcbiAgICAgICk7XG4gICAgICAvLyBDbGVhciBvdXQgdGhlIGFyZ3MgYW5kIGFkZCB0aGUgcmVzdWx0IHdoaWNoIHdpbGwgYmUgcGFzc2VkIHRvIHRoZSBuZXh0IHBoYXNlLlxuICAgICAgdGhpcy5waXBlbGluZWRBcmdzLnNwbGljZSgwLCB0aGlzLnBpcGVsaW5lZEFyZ3MubGVuZ3RoLCByZXN1bHQpO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgdGhpcy5lcnJvckhhbmRsZXI/LmhhbmRsZUVycm9yKGVycik7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogSW1wbGVtZW50cyBgYWZ0ZXJSZW5kZXJgIGFuZCBgYWZ0ZXJOZXh0UmVuZGVyYCBjYWxsYmFjayBoYW5kbGVyIGxvZ2ljLlxuICovXG5pbnRlcmZhY2UgQWZ0ZXJSZW5kZXJDYWxsYmFja0hhbmRsZXIge1xuICAvKipcbiAgICogUmVnaXN0ZXIgYSBuZXcgY2FsbGJhY2suXG4gICAqL1xuICByZWdpc3RlcihjYWxsYmFjazogQWZ0ZXJSZW5kZXJDYWxsYmFjayk6IHZvaWQ7XG5cbiAgLyoqXG4gICAqIFVucmVnaXN0ZXIgYW4gZXhpc3RpbmcgY2FsbGJhY2suXG4gICAqL1xuICB1bnJlZ2lzdGVyKGNhbGxiYWNrOiBBZnRlclJlbmRlckNhbGxiYWNrKTogdm9pZDtcblxuICAvKipcbiAgICogRXhlY3V0ZSBjYWxsYmFja3MuIFJldHVybnMgYHRydWVgIGlmIGFueSBjYWxsYmFja3Mgd2VyZSBleGVjdXRlZC5cbiAgICovXG4gIGV4ZWN1dGUoKTogdm9pZDtcblxuICAvKipcbiAgICogUGVyZm9ybSBhbnkgbmVjZXNzYXJ5IGNsZWFudXAuXG4gICAqL1xuICBkZXN0cm95KCk6IHZvaWQ7XG59XG5cbi8qKlxuICogQ29yZSBmdW5jdGlvbmFsaXR5IGZvciBgYWZ0ZXJSZW5kZXJgIGFuZCBgYWZ0ZXJOZXh0UmVuZGVyYC4gS2VwdCBzZXBhcmF0ZSBmcm9tXG4gKiBgQWZ0ZXJSZW5kZXJFdmVudE1hbmFnZXJgIGZvciB0cmVlLXNoYWtpbmcuXG4gKi9cbmNsYXNzIEFmdGVyUmVuZGVyQ2FsbGJhY2tIYW5kbGVySW1wbCBpbXBsZW1lbnRzIEFmdGVyUmVuZGVyQ2FsbGJhY2tIYW5kbGVyIHtcbiAgcHJpdmF0ZSBleGVjdXRpbmdDYWxsYmFja3MgPSBmYWxzZTtcbiAgcHJpdmF0ZSBidWNrZXRzID0ge1xuICAgIC8vIE5vdGU6IHRoZSBvcmRlciBvZiB0aGVzZSBrZXlzIGNvbnRyb2xzIHRoZSBvcmRlciB0aGUgcGhhc2VzIGFyZSBydW4uXG4gICAgW0FmdGVyUmVuZGVyUGhhc2UuRWFybHlSZWFkXTogbmV3IFNldDxBZnRlclJlbmRlckNhbGxiYWNrPigpLFxuICAgIFtBZnRlclJlbmRlclBoYXNlLldyaXRlXTogbmV3IFNldDxBZnRlclJlbmRlckNhbGxiYWNrPigpLFxuICAgIFtBZnRlclJlbmRlclBoYXNlLk1peGVkUmVhZFdyaXRlXTogbmV3IFNldDxBZnRlclJlbmRlckNhbGxiYWNrPigpLFxuICAgIFtBZnRlclJlbmRlclBoYXNlLlJlYWRdOiBuZXcgU2V0PEFmdGVyUmVuZGVyQ2FsbGJhY2s+KCksXG4gIH07XG4gIHByaXZhdGUgZGVmZXJyZWRDYWxsYmFja3MgPSBuZXcgU2V0PEFmdGVyUmVuZGVyQ2FsbGJhY2s+KCk7XG5cbiAgcmVnaXN0ZXIoY2FsbGJhY2s6IEFmdGVyUmVuZGVyQ2FsbGJhY2spOiB2b2lkIHtcbiAgICAvLyBJZiB3ZSdyZSBjdXJyZW50bHkgcnVubmluZyBjYWxsYmFja3MsIG5ldyBjYWxsYmFja3Mgc2hvdWxkIGJlIGRlZmVycmVkXG4gICAgLy8gdW50aWwgdGhlIG5leHQgcmVuZGVyIG9wZXJhdGlvbi5cbiAgICBjb25zdCB0YXJnZXQgPSB0aGlzLmV4ZWN1dGluZ0NhbGxiYWNrcyA/IHRoaXMuZGVmZXJyZWRDYWxsYmFja3MgOiB0aGlzLmJ1Y2tldHNbY2FsbGJhY2sucGhhc2VdO1xuICAgIHRhcmdldC5hZGQoY2FsbGJhY2spO1xuICB9XG5cbiAgdW5yZWdpc3RlcihjYWxsYmFjazogQWZ0ZXJSZW5kZXJDYWxsYmFjayk6IHZvaWQge1xuICAgIHRoaXMuYnVja2V0c1tjYWxsYmFjay5waGFzZV0uZGVsZXRlKGNhbGxiYWNrKTtcbiAgICB0aGlzLmRlZmVycmVkQ2FsbGJhY2tzLmRlbGV0ZShjYWxsYmFjayk7XG4gIH1cblxuICBleGVjdXRlKCk6IHZvaWQge1xuICAgIHRoaXMuZXhlY3V0aW5nQ2FsbGJhY2tzID0gdHJ1ZTtcbiAgICBmb3IgKGNvbnN0IGJ1Y2tldCBvZiBPYmplY3QudmFsdWVzKHRoaXMuYnVja2V0cykpIHtcbiAgICAgIGZvciAoY29uc3QgY2FsbGJhY2sgb2YgYnVja2V0KSB7XG4gICAgICAgIGNhbGxiYWNrLmludm9rZSgpO1xuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLmV4ZWN1dGluZ0NhbGxiYWNrcyA9IGZhbHNlO1xuXG4gICAgZm9yIChjb25zdCBjYWxsYmFjayBvZiB0aGlzLmRlZmVycmVkQ2FsbGJhY2tzKSB7XG4gICAgICB0aGlzLmJ1Y2tldHNbY2FsbGJhY2sucGhhc2VdLmFkZChjYWxsYmFjayk7XG4gICAgfVxuICAgIHRoaXMuZGVmZXJyZWRDYWxsYmFja3MuY2xlYXIoKTtcbiAgfVxuXG4gIGRlc3Ryb3koKTogdm9pZCB7XG4gICAgZm9yIChjb25zdCBidWNrZXQgb2YgT2JqZWN0LnZhbHVlcyh0aGlzLmJ1Y2tldHMpKSB7XG4gICAgICBidWNrZXQuY2xlYXIoKTtcbiAgICB9XG4gICAgdGhpcy5kZWZlcnJlZENhbGxiYWNrcy5jbGVhcigpO1xuICB9XG59XG5cbi8qKlxuICogSW1wbGVtZW50cyBjb3JlIHRpbWluZyBmb3IgYGFmdGVyUmVuZGVyYCBhbmQgYGFmdGVyTmV4dFJlbmRlcmAgZXZlbnRzLlxuICogRGVsZWdhdGVzIHRvIGFuIG9wdGlvbmFsIGBBZnRlclJlbmRlckNhbGxiYWNrSGFuZGxlcmAgZm9yIGltcGxlbWVudGF0aW9uLlxuICovXG5leHBvcnQgY2xhc3MgQWZ0ZXJSZW5kZXJFdmVudE1hbmFnZXIge1xuICAvKiBAaW50ZXJuYWwgKi9cbiAgaGFuZGxlcjogQWZ0ZXJSZW5kZXJDYWxsYmFja0hhbmRsZXIgfCBudWxsID0gbnVsbDtcblxuICAvKiBAaW50ZXJuYWwgKi9cbiAgaW50ZXJuYWxDYWxsYmFja3M6IFZvaWRGdW5jdGlvbltdID0gW107XG5cbiAgLyoqXG4gICAqIEV4ZWN1dGVzIGludGVybmFsIGFuZCB1c2VyLXByb3ZpZGVkIGNhbGxiYWNrcy5cbiAgICovXG4gIGV4ZWN1dGUoKTogdm9pZCB7XG4gICAgdGhpcy5leGVjdXRlSW50ZXJuYWxDYWxsYmFja3MoKTtcbiAgICB0aGlzLmhhbmRsZXI/LmV4ZWN1dGUoKTtcbiAgfVxuXG4gIGV4ZWN1dGVJbnRlcm5hbENhbGxiYWNrcygpIHtcbiAgICAvLyBOb3RlOiBpbnRlcm5hbCBjYWxsYmFja3MgcG93ZXIgYGludGVybmFsQWZ0ZXJOZXh0UmVuZGVyYC4gU2luY2UgaW50ZXJuYWwgY2FsbGJhY2tzXG4gICAgLy8gYXJlIGZhaXJseSB0cml2aWFsLCB0aGV5IGFyZSBrZXB0IHNlcGFyYXRlIHNvIHRoYXQgYEFmdGVyUmVuZGVyQ2FsbGJhY2tIYW5kbGVySW1wbGBcbiAgICAvLyBjYW4gc3RpbGwgYmUgdHJlZS1zaGFrZW4gdW5sZXNzIHVzZWQgYnkgdGhlIGFwcGxpY2F0aW9uLlxuICAgIGNvbnN0IGNhbGxiYWNrcyA9IFsuLi50aGlzLmludGVybmFsQ2FsbGJhY2tzXTtcbiAgICB0aGlzLmludGVybmFsQ2FsbGJhY2tzLmxlbmd0aCA9IDA7XG4gICAgZm9yIChjb25zdCBjYWxsYmFjayBvZiBjYWxsYmFja3MpIHtcbiAgICAgIGNhbGxiYWNrKCk7XG4gICAgfVxuICB9XG5cbiAgbmdPbkRlc3Ryb3koKSB7XG4gICAgdGhpcy5oYW5kbGVyPy5kZXN0cm95KCk7XG4gICAgdGhpcy5oYW5kbGVyID0gbnVsbDtcbiAgICB0aGlzLmludGVybmFsQ2FsbGJhY2tzLmxlbmd0aCA9IDA7XG4gIH1cblxuICAvKiogQG5vY29sbGFwc2UgKi9cbiAgc3RhdGljIMm1cHJvdiA9IC8qKiBAcHVyZU9yQnJlYWtNeUNvZGUgKi8gybXJtWRlZmluZUluamVjdGFibGUoe1xuICAgIHRva2VuOiBBZnRlclJlbmRlckV2ZW50TWFuYWdlcixcbiAgICBwcm92aWRlZEluOiAncm9vdCcsXG4gICAgZmFjdG9yeTogKCkgPT4gbmV3IEFmdGVyUmVuZGVyRXZlbnRNYW5hZ2VyKCksXG4gIH0pO1xufVxuIl19