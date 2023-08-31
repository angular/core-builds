/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { assertInInjectionContext, Injector, ɵɵdefineInjectable } from '../di';
import { inject } from '../di/injector_compatibility';
import { RuntimeError } from '../errors';
import { DestroyRef } from '../linker/destroy_ref';
import { assertGreaterThan } from '../util/assert';
import { NgZone } from '../zone';
import { isPlatformBrowser } from './util/misc_utils';
/**
 * Register a callback to be invoked each time the application
 * finishes rendering.
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
 *     });
 *   }
 * }
 * ```
 *
 * @developerPreview
 */
export function afterRender(callback, options) {
    !options && assertInInjectionContext(afterRender);
    const injector = options?.injector ?? inject(Injector);
    if (!isPlatformBrowser(injector)) {
        return { destroy() { } };
    }
    let destroy;
    const unregisterFn = injector.get(DestroyRef).onDestroy(() => destroy?.());
    const manager = injector.get(AfterRenderEventManager);
    // Lazily initialize the handler implementation, if necessary. This is so that it can be
    // tree-shaken if `afterRender` and `afterNextRender` aren't used.
    const handler = manager.handler ??= new AfterRenderCallbackHandlerImpl();
    const ngZone = injector.get(NgZone);
    const instance = new AfterRenderCallback(() => ngZone.runOutsideAngular(callback));
    destroy = () => {
        handler.unregister(instance);
        unregisterFn();
    };
    handler.register(instance);
    return { destroy };
}
/**
 * Register a callback to be invoked the next time the application
 * finishes rendering.
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
 *     });
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
    const manager = injector.get(AfterRenderEventManager);
    // Lazily initialize the handler implementation, if necessary. This is so that it can be
    // tree-shaken if `afterRender` and `afterNextRender` aren't used.
    const handler = manager.handler ??= new AfterRenderCallbackHandlerImpl();
    const ngZone = injector.get(NgZone);
    const instance = new AfterRenderCallback(() => {
        destroy?.();
        ngZone.runOutsideAngular(callback);
    });
    destroy = () => {
        handler.unregister(instance);
        unregisterFn();
    };
    handler.register(instance);
    return { destroy };
}
/**
 * A wrapper around a function to be used as an after render callback.
 */
class AfterRenderCallback {
    constructor(callback) {
        this.callback = callback;
    }
    invoke() {
        this.callback();
    }
}
/**
 * Core functionality for `afterRender` and `afterNextRender`. Kept separate from
 * `AfterRenderEventManager` for tree-shaking.
 */
class AfterRenderCallbackHandlerImpl {
    constructor() {
        this.executingCallbacks = false;
        this.callbacks = new Set();
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
        const target = this.executingCallbacks ? this.deferredCallbacks : this.callbacks;
        target.add(callback);
    }
    unregister(callback) {
        this.callbacks.delete(callback);
        this.deferredCallbacks.delete(callback);
    }
    execute() {
        try {
            this.executingCallbacks = true;
            for (const callback of this.callbacks) {
                callback.invoke();
            }
        }
        finally {
            this.executingCallbacks = false;
            for (const callback of this.deferredCallbacks) {
                this.callbacks.add(callback);
            }
            this.deferredCallbacks.clear();
        }
    }
    destroy() {
        this.callbacks.clear();
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
            this.handler?.execute();
        }
    }
    ngOnDestroy() {
        this.handler?.destroy();
        this.handler = null;
    }
    /** @nocollapse */
    static { this.ɵprov = ɵɵdefineInjectable({
        token: AfterRenderEventManager,
        providedIn: 'root',
        factory: () => new AfterRenderEventManager(),
    }); }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWZ0ZXJfcmVuZGVyX2hvb2tzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9hZnRlcl9yZW5kZXJfaG9va3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLHdCQUF3QixFQUFFLFFBQVEsRUFBRSxrQkFBa0IsRUFBQyxNQUFNLE9BQU8sQ0FBQztBQUM3RSxPQUFPLEVBQUMsTUFBTSxFQUFDLE1BQU0sOEJBQThCLENBQUM7QUFDcEQsT0FBTyxFQUFDLFlBQVksRUFBbUIsTUFBTSxXQUFXLENBQUM7QUFDekQsT0FBTyxFQUFDLFVBQVUsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQ2pELE9BQU8sRUFBQyxpQkFBaUIsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBQ2pELE9BQU8sRUFBQyxNQUFNLEVBQUMsTUFBTSxTQUFTLENBQUM7QUFFL0IsT0FBTyxFQUFDLGlCQUFpQixFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUE0QnBEOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBd0NHO0FBQ0gsTUFBTSxVQUFVLFdBQVcsQ0FBQyxRQUFzQixFQUFFLE9BQTRCO0lBQzlFLENBQUMsT0FBTyxJQUFJLHdCQUF3QixDQUFDLFdBQVcsQ0FBQyxDQUFDO0lBQ2xELE1BQU0sUUFBUSxHQUFHLE9BQU8sRUFBRSxRQUFRLElBQUksTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBRXZELElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxRQUFRLENBQUMsRUFBRTtRQUNoQyxPQUFPLEVBQUMsT0FBTyxLQUFJLENBQUMsRUFBQyxDQUFDO0tBQ3ZCO0lBRUQsSUFBSSxPQUErQixDQUFDO0lBQ3BDLE1BQU0sWUFBWSxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUMsU0FBUyxDQUFDLEdBQUcsRUFBRSxDQUFDLE9BQU8sRUFBRSxFQUFFLENBQUMsQ0FBQztJQUMzRSxNQUFNLE9BQU8sR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLHVCQUF1QixDQUFDLENBQUM7SUFDdEQsd0ZBQXdGO0lBQ3hGLGtFQUFrRTtJQUNsRSxNQUFNLE9BQU8sR0FBRyxPQUFPLENBQUMsT0FBTyxLQUFLLElBQUksOEJBQThCLEVBQUUsQ0FBQztJQUN6RSxNQUFNLE1BQU0sR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQ3BDLE1BQU0sUUFBUSxHQUFHLElBQUksbUJBQW1CLENBQUMsR0FBRyxFQUFFLENBQUMsTUFBTSxDQUFDLGlCQUFpQixDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7SUFFbkYsT0FBTyxHQUFHLEdBQUcsRUFBRTtRQUNiLE9BQU8sQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDN0IsWUFBWSxFQUFFLENBQUM7SUFDakIsQ0FBQyxDQUFDO0lBQ0YsT0FBTyxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUMzQixPQUFPLEVBQUMsT0FBTyxFQUFDLENBQUM7QUFDbkIsQ0FBQztBQUVEOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztHQXlDRztBQUNILE1BQU0sVUFBVSxlQUFlLENBQzNCLFFBQXNCLEVBQUUsT0FBNEI7SUFDdEQsQ0FBQyxPQUFPLElBQUksd0JBQXdCLENBQUMsZUFBZSxDQUFDLENBQUM7SUFDdEQsTUFBTSxRQUFRLEdBQUcsT0FBTyxFQUFFLFFBQVEsSUFBSSxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUM7SUFFdkQsSUFBSSxDQUFDLGlCQUFpQixDQUFDLFFBQVEsQ0FBQyxFQUFFO1FBQ2hDLE9BQU8sRUFBQyxPQUFPLEtBQUksQ0FBQyxFQUFDLENBQUM7S0FDdkI7SUFFRCxJQUFJLE9BQStCLENBQUM7SUFDcEMsTUFBTSxZQUFZLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsQ0FBQyxTQUFTLENBQUMsR0FBRyxFQUFFLENBQUMsT0FBTyxFQUFFLEVBQUUsQ0FBQyxDQUFDO0lBQzNFLE1BQU0sT0FBTyxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsdUJBQXVCLENBQUMsQ0FBQztJQUN0RCx3RkFBd0Y7SUFDeEYsa0VBQWtFO0lBQ2xFLE1BQU0sT0FBTyxHQUFHLE9BQU8sQ0FBQyxPQUFPLEtBQUssSUFBSSw4QkFBOEIsRUFBRSxDQUFDO0lBQ3pFLE1BQU0sTUFBTSxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDcEMsTUFBTSxRQUFRLEdBQUcsSUFBSSxtQkFBbUIsQ0FBQyxHQUFHLEVBQUU7UUFDNUMsT0FBTyxFQUFFLEVBQUUsQ0FBQztRQUNaLE1BQU0sQ0FBQyxpQkFBaUIsQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUNyQyxDQUFDLENBQUMsQ0FBQztJQUVILE9BQU8sR0FBRyxHQUFHLEVBQUU7UUFDYixPQUFPLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQzdCLFlBQVksRUFBRSxDQUFDO0lBQ2pCLENBQUMsQ0FBQztJQUNGLE9BQU8sQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDM0IsT0FBTyxFQUFDLE9BQU8sRUFBQyxDQUFDO0FBQ25CLENBQUM7QUFFRDs7R0FFRztBQUNILE1BQU0sbUJBQW1CO0lBR3ZCLFlBQVksUUFBc0I7UUFDaEMsSUFBSSxDQUFDLFFBQVEsR0FBRyxRQUFRLENBQUM7SUFDM0IsQ0FBQztJQUVELE1BQU07UUFDSixJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7SUFDbEIsQ0FBQztDQUNGO0FBa0NEOzs7R0FHRztBQUNILE1BQU0sOEJBQThCO0lBQXBDO1FBQ1UsdUJBQWtCLEdBQUcsS0FBSyxDQUFDO1FBQzNCLGNBQVMsR0FBRyxJQUFJLEdBQUcsRUFBdUIsQ0FBQztRQUMzQyxzQkFBaUIsR0FBRyxJQUFJLEdBQUcsRUFBdUIsQ0FBQztJQTJDN0QsQ0FBQztJQXpDQyxhQUFhO1FBQ1gsSUFBSSxJQUFJLENBQUMsa0JBQWtCLEVBQUU7WUFDM0IsTUFBTSxJQUFJLFlBQVksMERBRWxCLFNBQVM7Z0JBQ0wsb0VBQW9FO29CQUNoRSx1RUFBdUUsQ0FBQyxDQUFDO1NBQ3RGO0lBQ0gsQ0FBQztJQUVELFFBQVEsQ0FBQyxRQUE2QjtRQUNwQyx5RUFBeUU7UUFDekUsbUNBQW1DO1FBQ25DLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDO1FBQ2pGLE1BQU0sQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDdkIsQ0FBQztJQUVELFVBQVUsQ0FBQyxRQUE2QjtRQUN0QyxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUNoQyxJQUFJLENBQUMsaUJBQWlCLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQzFDLENBQUM7SUFFRCxPQUFPO1FBQ0wsSUFBSTtZQUNGLElBQUksQ0FBQyxrQkFBa0IsR0FBRyxJQUFJLENBQUM7WUFDL0IsS0FBSyxNQUFNLFFBQVEsSUFBSSxJQUFJLENBQUMsU0FBUyxFQUFFO2dCQUNyQyxRQUFRLENBQUMsTUFBTSxFQUFFLENBQUM7YUFDbkI7U0FDRjtnQkFBUztZQUNSLElBQUksQ0FBQyxrQkFBa0IsR0FBRyxLQUFLLENBQUM7WUFDaEMsS0FBSyxNQUFNLFFBQVEsSUFBSSxJQUFJLENBQUMsaUJBQWlCLEVBQUU7Z0JBQzdDLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDO2FBQzlCO1lBQ0QsSUFBSSxDQUFDLGlCQUFpQixDQUFDLEtBQUssRUFBRSxDQUFDO1NBQ2hDO0lBQ0gsQ0FBQztJQUVELE9BQU87UUFDTCxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQ3ZCLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxLQUFLLEVBQUUsQ0FBQztJQUNqQyxDQUFDO0NBQ0Y7QUFFRDs7O0dBR0c7QUFDSCxNQUFNLE9BQU8sdUJBQXVCO0lBQXBDO1FBQ1UsZ0JBQVcsR0FBRyxDQUFDLENBQUM7UUFFeEIsZUFBZTtRQUNmLFlBQU8sR0FBb0MsSUFBSSxDQUFDO0lBbUNsRCxDQUFDO0lBakNDOzs7T0FHRztJQUNILEtBQUs7UUFDSCxJQUFJLENBQUMsT0FBTyxFQUFFLGFBQWEsRUFBRSxDQUFDO1FBQzlCLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztJQUNyQixDQUFDO0lBRUQ7OztPQUdHO0lBQ0gsR0FBRztRQUNELFNBQVMsSUFBSSxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUMsRUFBRSxvQ0FBb0MsQ0FBQyxDQUFDO1FBQzFGLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztRQUVuQixJQUFJLElBQUksQ0FBQyxXQUFXLEtBQUssQ0FBQyxFQUFFO1lBQzFCLElBQUksQ0FBQyxPQUFPLEVBQUUsT0FBTyxFQUFFLENBQUM7U0FDekI7SUFDSCxDQUFDO0lBRUQsV0FBVztRQUNULElBQUksQ0FBQyxPQUFPLEVBQUUsT0FBTyxFQUFFLENBQUM7UUFDeEIsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUM7SUFDdEIsQ0FBQztJQUVELGtCQUFrQjthQUNYLFVBQUssR0FBNkIsa0JBQWtCLENBQUM7UUFDMUQsS0FBSyxFQUFFLHVCQUF1QjtRQUM5QixVQUFVLEVBQUUsTUFBTTtRQUNsQixPQUFPLEVBQUUsR0FBRyxFQUFFLENBQUMsSUFBSSx1QkFBdUIsRUFBRTtLQUM3QyxDQUFDLEFBSlUsQ0FJVCIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge2Fzc2VydEluSW5qZWN0aW9uQ29udGV4dCwgSW5qZWN0b3IsIMm1ybVkZWZpbmVJbmplY3RhYmxlfSBmcm9tICcuLi9kaSc7XG5pbXBvcnQge2luamVjdH0gZnJvbSAnLi4vZGkvaW5qZWN0b3JfY29tcGF0aWJpbGl0eSc7XG5pbXBvcnQge1J1bnRpbWVFcnJvciwgUnVudGltZUVycm9yQ29kZX0gZnJvbSAnLi4vZXJyb3JzJztcbmltcG9ydCB7RGVzdHJveVJlZn0gZnJvbSAnLi4vbGlua2VyL2Rlc3Ryb3lfcmVmJztcbmltcG9ydCB7YXNzZXJ0R3JlYXRlclRoYW59IGZyb20gJy4uL3V0aWwvYXNzZXJ0JztcbmltcG9ydCB7Tmdab25lfSBmcm9tICcuLi96b25lJztcblxuaW1wb3J0IHtpc1BsYXRmb3JtQnJvd3Nlcn0gZnJvbSAnLi91dGlsL21pc2NfdXRpbHMnO1xuXG4vKipcbiAqIE9wdGlvbnMgcGFzc2VkIHRvIGBhZnRlclJlbmRlcmAgYW5kIGBhZnRlck5leHRSZW5kZXJgLlxuICpcbiAqIEBkZXZlbG9wZXJQcmV2aWV3XG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgQWZ0ZXJSZW5kZXJPcHRpb25zIHtcbiAgLyoqXG4gICAqIFRoZSBgSW5qZWN0b3JgIHRvIHVzZSBkdXJpbmcgY3JlYXRpb24uXG4gICAqXG4gICAqIElmIHRoaXMgaXMgbm90IHByb3ZpZGVkLCB0aGUgY3VycmVudCBpbmplY3Rpb24gY29udGV4dCB3aWxsIGJlIHVzZWQgaW5zdGVhZCAodmlhIGBpbmplY3RgKS5cbiAgICovXG4gIGluamVjdG9yPzogSW5qZWN0b3I7XG59XG5cbi8qKlxuICogQSBjYWxsYmFjayB0aGF0IHJ1bnMgYWZ0ZXIgcmVuZGVyLlxuICpcbiAqIEBkZXZlbG9wZXJQcmV2aWV3XG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgQWZ0ZXJSZW5kZXJSZWYge1xuICAvKipcbiAgICogU2h1dCBkb3duIHRoZSBjYWxsYmFjaywgcHJldmVudGluZyBpdCBmcm9tIGJlaW5nIGNhbGxlZCBhZ2Fpbi5cbiAgICovXG4gIGRlc3Ryb3koKTogdm9pZDtcbn1cblxuLyoqXG4gKiBSZWdpc3RlciBhIGNhbGxiYWNrIHRvIGJlIGludm9rZWQgZWFjaCB0aW1lIHRoZSBhcHBsaWNhdGlvblxuICogZmluaXNoZXMgcmVuZGVyaW5nLlxuICpcbiAqIE5vdGUgdGhhdCB0aGUgY2FsbGJhY2sgd2lsbCBydW5cbiAqIC0gaW4gdGhlIG9yZGVyIGl0IHdhcyByZWdpc3RlcmVkXG4gKiAtIG9uY2UgcGVyIHJlbmRlclxuICogLSBvbiBicm93c2VyIHBsYXRmb3JtcyBvbmx5XG4gKlxuICogPGRpdiBjbGFzcz1cImFsZXJ0IGlzLWltcG9ydGFudFwiPlxuICpcbiAqIENvbXBvbmVudHMgYXJlIG5vdCBndWFyYW50ZWVkIHRvIGJlIFtoeWRyYXRlZF0oZ3VpZGUvaHlkcmF0aW9uKSBiZWZvcmUgdGhlIGNhbGxiYWNrIHJ1bnMuXG4gKiBZb3UgbXVzdCB1c2UgY2F1dGlvbiB3aGVuIGRpcmVjdGx5IHJlYWRpbmcgb3Igd3JpdGluZyB0aGUgRE9NIGFuZCBsYXlvdXQuXG4gKlxuICogPC9kaXY+XG4gKlxuICogQHBhcmFtIGNhbGxiYWNrIEEgY2FsbGJhY2sgZnVuY3Rpb24gdG8gcmVnaXN0ZXJcbiAqXG4gKiBAdXNhZ2VOb3Rlc1xuICpcbiAqIFVzZSBgYWZ0ZXJSZW5kZXJgIHRvIHJlYWQgb3Igd3JpdGUgdGhlIERPTSBhZnRlciBlYWNoIHJlbmRlci5cbiAqXG4gKiAjIyMgRXhhbXBsZVxuICogYGBgdHNcbiAqIEBDb21wb25lbnQoe1xuICogICBzZWxlY3RvcjogJ215LWNtcCcsXG4gKiAgIHRlbXBsYXRlOiBgPHNwYW4gI2NvbnRlbnQ+e3sgLi4uIH19PC9zcGFuPmAsXG4gKiB9KVxuICogZXhwb3J0IGNsYXNzIE15Q29tcG9uZW50IHtcbiAqICAgQFZpZXdDaGlsZCgnY29udGVudCcpIGNvbnRlbnRSZWY6IEVsZW1lbnRSZWY7XG4gKlxuICogICBjb25zdHJ1Y3RvcigpIHtcbiAqICAgICBhZnRlclJlbmRlcigoKSA9PiB7XG4gKiAgICAgICBjb25zb2xlLmxvZygnY29udGVudCBoZWlnaHQ6ICcgKyB0aGlzLmNvbnRlbnRSZWYubmF0aXZlRWxlbWVudC5zY3JvbGxIZWlnaHQpO1xuICogICAgIH0pO1xuICogICB9XG4gKiB9XG4gKiBgYGBcbiAqXG4gKiBAZGV2ZWxvcGVyUHJldmlld1xuICovXG5leHBvcnQgZnVuY3Rpb24gYWZ0ZXJSZW5kZXIoY2FsbGJhY2s6IFZvaWRGdW5jdGlvbiwgb3B0aW9ucz86IEFmdGVyUmVuZGVyT3B0aW9ucyk6IEFmdGVyUmVuZGVyUmVmIHtcbiAgIW9wdGlvbnMgJiYgYXNzZXJ0SW5JbmplY3Rpb25Db250ZXh0KGFmdGVyUmVuZGVyKTtcbiAgY29uc3QgaW5qZWN0b3IgPSBvcHRpb25zPy5pbmplY3RvciA/PyBpbmplY3QoSW5qZWN0b3IpO1xuXG4gIGlmICghaXNQbGF0Zm9ybUJyb3dzZXIoaW5qZWN0b3IpKSB7XG4gICAgcmV0dXJuIHtkZXN0cm95KCkge319O1xuICB9XG5cbiAgbGV0IGRlc3Ryb3k6IFZvaWRGdW5jdGlvbnx1bmRlZmluZWQ7XG4gIGNvbnN0IHVucmVnaXN0ZXJGbiA9IGluamVjdG9yLmdldChEZXN0cm95UmVmKS5vbkRlc3Ryb3koKCkgPT4gZGVzdHJveT8uKCkpO1xuICBjb25zdCBtYW5hZ2VyID0gaW5qZWN0b3IuZ2V0KEFmdGVyUmVuZGVyRXZlbnRNYW5hZ2VyKTtcbiAgLy8gTGF6aWx5IGluaXRpYWxpemUgdGhlIGhhbmRsZXIgaW1wbGVtZW50YXRpb24sIGlmIG5lY2Vzc2FyeS4gVGhpcyBpcyBzbyB0aGF0IGl0IGNhbiBiZVxuICAvLyB0cmVlLXNoYWtlbiBpZiBgYWZ0ZXJSZW5kZXJgIGFuZCBgYWZ0ZXJOZXh0UmVuZGVyYCBhcmVuJ3QgdXNlZC5cbiAgY29uc3QgaGFuZGxlciA9IG1hbmFnZXIuaGFuZGxlciA/Pz0gbmV3IEFmdGVyUmVuZGVyQ2FsbGJhY2tIYW5kbGVySW1wbCgpO1xuICBjb25zdCBuZ1pvbmUgPSBpbmplY3Rvci5nZXQoTmdab25lKTtcbiAgY29uc3QgaW5zdGFuY2UgPSBuZXcgQWZ0ZXJSZW5kZXJDYWxsYmFjaygoKSA9PiBuZ1pvbmUucnVuT3V0c2lkZUFuZ3VsYXIoY2FsbGJhY2spKTtcblxuICBkZXN0cm95ID0gKCkgPT4ge1xuICAgIGhhbmRsZXIudW5yZWdpc3RlcihpbnN0YW5jZSk7XG4gICAgdW5yZWdpc3RlckZuKCk7XG4gIH07XG4gIGhhbmRsZXIucmVnaXN0ZXIoaW5zdGFuY2UpO1xuICByZXR1cm4ge2Rlc3Ryb3l9O1xufVxuXG4vKipcbiAqIFJlZ2lzdGVyIGEgY2FsbGJhY2sgdG8gYmUgaW52b2tlZCB0aGUgbmV4dCB0aW1lIHRoZSBhcHBsaWNhdGlvblxuICogZmluaXNoZXMgcmVuZGVyaW5nLlxuICpcbiAqIE5vdGUgdGhhdCB0aGUgY2FsbGJhY2sgd2lsbCBydW5cbiAqIC0gaW4gdGhlIG9yZGVyIGl0IHdhcyByZWdpc3RlcmVkXG4gKiAtIG9uIGJyb3dzZXIgcGxhdGZvcm1zIG9ubHlcbiAqXG4gKiA8ZGl2IGNsYXNzPVwiYWxlcnQgaXMtaW1wb3J0YW50XCI+XG4gKlxuICogQ29tcG9uZW50cyBhcmUgbm90IGd1YXJhbnRlZWQgdG8gYmUgW2h5ZHJhdGVkXShndWlkZS9oeWRyYXRpb24pIGJlZm9yZSB0aGUgY2FsbGJhY2sgcnVucy5cbiAqIFlvdSBtdXN0IHVzZSBjYXV0aW9uIHdoZW4gZGlyZWN0bHkgcmVhZGluZyBvciB3cml0aW5nIHRoZSBET00gYW5kIGxheW91dC5cbiAqXG4gKiA8L2Rpdj5cbiAqXG4gKiBAcGFyYW0gY2FsbGJhY2sgQSBjYWxsYmFjayBmdW5jdGlvbiB0byByZWdpc3RlclxuICpcbiAqIEB1c2FnZU5vdGVzXG4gKlxuICogVXNlIGBhZnRlck5leHRSZW5kZXJgIHRvIHJlYWQgb3Igd3JpdGUgdGhlIERPTSBvbmNlLFxuICogZm9yIGV4YW1wbGUgdG8gaW5pdGlhbGl6ZSBhIG5vbi1Bbmd1bGFyIGxpYnJhcnkuXG4gKlxuICogIyMjIEV4YW1wbGVcbiAqIGBgYHRzXG4gKiBAQ29tcG9uZW50KHtcbiAqICAgc2VsZWN0b3I6ICdteS1jaGFydC1jbXAnLFxuICogICB0ZW1wbGF0ZTogYDxkaXYgI2NoYXJ0Pnt7IC4uLiB9fTwvZGl2PmAsXG4gKiB9KVxuICogZXhwb3J0IGNsYXNzIE15Q2hhcnRDbXAge1xuICogICBAVmlld0NoaWxkKCdjaGFydCcpIGNoYXJ0UmVmOiBFbGVtZW50UmVmO1xuICogICBjaGFydDogTXlDaGFydHxudWxsO1xuICpcbiAqICAgY29uc3RydWN0b3IoKSB7XG4gKiAgICAgYWZ0ZXJOZXh0UmVuZGVyKCgpID0+IHtcbiAqICAgICAgIHRoaXMuY2hhcnQgPSBuZXcgTXlDaGFydCh0aGlzLmNoYXJ0UmVmLm5hdGl2ZUVsZW1lbnQpO1xuICogICAgIH0pO1xuICogICB9XG4gKiB9XG4gKiBgYGBcbiAqXG4gKiBAZGV2ZWxvcGVyUHJldmlld1xuICovXG5leHBvcnQgZnVuY3Rpb24gYWZ0ZXJOZXh0UmVuZGVyKFxuICAgIGNhbGxiYWNrOiBWb2lkRnVuY3Rpb24sIG9wdGlvbnM/OiBBZnRlclJlbmRlck9wdGlvbnMpOiBBZnRlclJlbmRlclJlZiB7XG4gICFvcHRpb25zICYmIGFzc2VydEluSW5qZWN0aW9uQ29udGV4dChhZnRlck5leHRSZW5kZXIpO1xuICBjb25zdCBpbmplY3RvciA9IG9wdGlvbnM/LmluamVjdG9yID8/IGluamVjdChJbmplY3Rvcik7XG5cbiAgaWYgKCFpc1BsYXRmb3JtQnJvd3NlcihpbmplY3RvcikpIHtcbiAgICByZXR1cm4ge2Rlc3Ryb3koKSB7fX07XG4gIH1cblxuICBsZXQgZGVzdHJveTogVm9pZEZ1bmN0aW9ufHVuZGVmaW5lZDtcbiAgY29uc3QgdW5yZWdpc3RlckZuID0gaW5qZWN0b3IuZ2V0KERlc3Ryb3lSZWYpLm9uRGVzdHJveSgoKSA9PiBkZXN0cm95Py4oKSk7XG4gIGNvbnN0IG1hbmFnZXIgPSBpbmplY3Rvci5nZXQoQWZ0ZXJSZW5kZXJFdmVudE1hbmFnZXIpO1xuICAvLyBMYXppbHkgaW5pdGlhbGl6ZSB0aGUgaGFuZGxlciBpbXBsZW1lbnRhdGlvbiwgaWYgbmVjZXNzYXJ5LiBUaGlzIGlzIHNvIHRoYXQgaXQgY2FuIGJlXG4gIC8vIHRyZWUtc2hha2VuIGlmIGBhZnRlclJlbmRlcmAgYW5kIGBhZnRlck5leHRSZW5kZXJgIGFyZW4ndCB1c2VkLlxuICBjb25zdCBoYW5kbGVyID0gbWFuYWdlci5oYW5kbGVyID8/PSBuZXcgQWZ0ZXJSZW5kZXJDYWxsYmFja0hhbmRsZXJJbXBsKCk7XG4gIGNvbnN0IG5nWm9uZSA9IGluamVjdG9yLmdldChOZ1pvbmUpO1xuICBjb25zdCBpbnN0YW5jZSA9IG5ldyBBZnRlclJlbmRlckNhbGxiYWNrKCgpID0+IHtcbiAgICBkZXN0cm95Py4oKTtcbiAgICBuZ1pvbmUucnVuT3V0c2lkZUFuZ3VsYXIoY2FsbGJhY2spO1xuICB9KTtcblxuICBkZXN0cm95ID0gKCkgPT4ge1xuICAgIGhhbmRsZXIudW5yZWdpc3RlcihpbnN0YW5jZSk7XG4gICAgdW5yZWdpc3RlckZuKCk7XG4gIH07XG4gIGhhbmRsZXIucmVnaXN0ZXIoaW5zdGFuY2UpO1xuICByZXR1cm4ge2Rlc3Ryb3l9O1xufVxuXG4vKipcbiAqIEEgd3JhcHBlciBhcm91bmQgYSBmdW5jdGlvbiB0byBiZSB1c2VkIGFzIGFuIGFmdGVyIHJlbmRlciBjYWxsYmFjay5cbiAqL1xuY2xhc3MgQWZ0ZXJSZW5kZXJDYWxsYmFjayB7XG4gIHByaXZhdGUgY2FsbGJhY2s6IFZvaWRGdW5jdGlvbjtcblxuICBjb25zdHJ1Y3RvcihjYWxsYmFjazogVm9pZEZ1bmN0aW9uKSB7XG4gICAgdGhpcy5jYWxsYmFjayA9IGNhbGxiYWNrO1xuICB9XG5cbiAgaW52b2tlKCkge1xuICAgIHRoaXMuY2FsbGJhY2soKTtcbiAgfVxufVxuXG4vKipcbiAqIEltcGxlbWVudHMgYGFmdGVyUmVuZGVyYCBhbmQgYGFmdGVyTmV4dFJlbmRlcmAgY2FsbGJhY2sgaGFuZGxlciBsb2dpYy5cbiAqL1xuaW50ZXJmYWNlIEFmdGVyUmVuZGVyQ2FsbGJhY2tIYW5kbGVyIHtcbiAgLyoqXG4gICAqIFZhbGlkYXRlIHRoYXQgaXQncyBzYWZlIGZvciBhIHJlbmRlciBvcGVyYXRpb24gdG8gYmVnaW4sXG4gICAqIHRocm93aW5nIGlmIG5vdC4gTm90IGd1YXJhbnRlZWQgdG8gYmUgY2FsbGVkIGlmIGEgcmVuZGVyXG4gICAqIG9wZXJhdGlvbiBpcyBzdGFydGVkIGJlZm9yZSBoYW5kbGVyIHdhcyByZWdpc3RlcmVkLlxuICAgKi9cbiAgdmFsaWRhdGVCZWdpbigpOiB2b2lkO1xuXG4gIC8qKlxuICAgKiBSZWdpc3RlciBhIG5ldyBjYWxsYmFjay5cbiAgICovXG4gIHJlZ2lzdGVyKGNhbGxiYWNrOiBBZnRlclJlbmRlckNhbGxiYWNrKTogdm9pZDtcblxuICAvKipcbiAgICogVW5yZWdpc3RlciBhbiBleGlzdGluZyBjYWxsYmFjay5cbiAgICovXG4gIHVucmVnaXN0ZXIoY2FsbGJhY2s6IEFmdGVyUmVuZGVyQ2FsbGJhY2spOiB2b2lkO1xuXG4gIC8qKlxuICAgKiBFeGVjdXRlIGNhbGxiYWNrcy5cbiAgICovXG4gIGV4ZWN1dGUoKTogdm9pZDtcblxuICAvKipcbiAgICogUGVyZm9ybSBhbnkgbmVjZXNzYXJ5IGNsZWFudXAuXG4gICAqL1xuICBkZXN0cm95KCk6IHZvaWQ7XG59XG5cbi8qKlxuICogQ29yZSBmdW5jdGlvbmFsaXR5IGZvciBgYWZ0ZXJSZW5kZXJgIGFuZCBgYWZ0ZXJOZXh0UmVuZGVyYC4gS2VwdCBzZXBhcmF0ZSBmcm9tXG4gKiBgQWZ0ZXJSZW5kZXJFdmVudE1hbmFnZXJgIGZvciB0cmVlLXNoYWtpbmcuXG4gKi9cbmNsYXNzIEFmdGVyUmVuZGVyQ2FsbGJhY2tIYW5kbGVySW1wbCBpbXBsZW1lbnRzIEFmdGVyUmVuZGVyQ2FsbGJhY2tIYW5kbGVyIHtcbiAgcHJpdmF0ZSBleGVjdXRpbmdDYWxsYmFja3MgPSBmYWxzZTtcbiAgcHJpdmF0ZSBjYWxsYmFja3MgPSBuZXcgU2V0PEFmdGVyUmVuZGVyQ2FsbGJhY2s+KCk7XG4gIHByaXZhdGUgZGVmZXJyZWRDYWxsYmFja3MgPSBuZXcgU2V0PEFmdGVyUmVuZGVyQ2FsbGJhY2s+KCk7XG5cbiAgdmFsaWRhdGVCZWdpbigpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5leGVjdXRpbmdDYWxsYmFja3MpIHtcbiAgICAgIHRocm93IG5ldyBSdW50aW1lRXJyb3IoXG4gICAgICAgICAgUnVudGltZUVycm9yQ29kZS5SRUNVUlNJVkVfQVBQTElDQVRJT05fUkVOREVSLFxuICAgICAgICAgIG5nRGV2TW9kZSAmJlxuICAgICAgICAgICAgICAnQSBuZXcgcmVuZGVyIG9wZXJhdGlvbiBiZWdhbiBiZWZvcmUgdGhlIHByZXZpb3VzIG9wZXJhdGlvbiBlbmRlZC4gJyArXG4gICAgICAgICAgICAgICAgICAnRGlkIHlvdSB0cmlnZ2VyIGNoYW5nZSBkZXRlY3Rpb24gZnJvbSBhZnRlclJlbmRlciBvciBhZnRlck5leHRSZW5kZXI/Jyk7XG4gICAgfVxuICB9XG5cbiAgcmVnaXN0ZXIoY2FsbGJhY2s6IEFmdGVyUmVuZGVyQ2FsbGJhY2spOiB2b2lkIHtcbiAgICAvLyBJZiB3ZSdyZSBjdXJyZW50bHkgcnVubmluZyBjYWxsYmFja3MsIG5ldyBjYWxsYmFja3Mgc2hvdWxkIGJlIGRlZmVycmVkXG4gICAgLy8gdW50aWwgdGhlIG5leHQgcmVuZGVyIG9wZXJhdGlvbi5cbiAgICBjb25zdCB0YXJnZXQgPSB0aGlzLmV4ZWN1dGluZ0NhbGxiYWNrcyA/IHRoaXMuZGVmZXJyZWRDYWxsYmFja3MgOiB0aGlzLmNhbGxiYWNrcztcbiAgICB0YXJnZXQuYWRkKGNhbGxiYWNrKTtcbiAgfVxuXG4gIHVucmVnaXN0ZXIoY2FsbGJhY2s6IEFmdGVyUmVuZGVyQ2FsbGJhY2spOiB2b2lkIHtcbiAgICB0aGlzLmNhbGxiYWNrcy5kZWxldGUoY2FsbGJhY2spO1xuICAgIHRoaXMuZGVmZXJyZWRDYWxsYmFja3MuZGVsZXRlKGNhbGxiYWNrKTtcbiAgfVxuXG4gIGV4ZWN1dGUoKTogdm9pZCB7XG4gICAgdHJ5IHtcbiAgICAgIHRoaXMuZXhlY3V0aW5nQ2FsbGJhY2tzID0gdHJ1ZTtcbiAgICAgIGZvciAoY29uc3QgY2FsbGJhY2sgb2YgdGhpcy5jYWxsYmFja3MpIHtcbiAgICAgICAgY2FsbGJhY2suaW52b2tlKCk7XG4gICAgICB9XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIHRoaXMuZXhlY3V0aW5nQ2FsbGJhY2tzID0gZmFsc2U7XG4gICAgICBmb3IgKGNvbnN0IGNhbGxiYWNrIG9mIHRoaXMuZGVmZXJyZWRDYWxsYmFja3MpIHtcbiAgICAgICAgdGhpcy5jYWxsYmFja3MuYWRkKGNhbGxiYWNrKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuZGVmZXJyZWRDYWxsYmFja3MuY2xlYXIoKTtcbiAgICB9XG4gIH1cblxuICBkZXN0cm95KCk6IHZvaWQge1xuICAgIHRoaXMuY2FsbGJhY2tzLmNsZWFyKCk7XG4gICAgdGhpcy5kZWZlcnJlZENhbGxiYWNrcy5jbGVhcigpO1xuICB9XG59XG5cbi8qKlxuICogSW1wbGVtZW50cyBjb3JlIHRpbWluZyBmb3IgYGFmdGVyUmVuZGVyYCBhbmQgYGFmdGVyTmV4dFJlbmRlcmAgZXZlbnRzLlxuICogRGVsZWdhdGVzIHRvIGFuIG9wdGlvbmFsIGBBZnRlclJlbmRlckNhbGxiYWNrSGFuZGxlcmAgZm9yIGltcGxlbWVudGF0aW9uLlxuICovXG5leHBvcnQgY2xhc3MgQWZ0ZXJSZW5kZXJFdmVudE1hbmFnZXIge1xuICBwcml2YXRlIHJlbmRlckRlcHRoID0gMDtcblxuICAvKiBAaW50ZXJuYWwgKi9cbiAgaGFuZGxlcjogQWZ0ZXJSZW5kZXJDYWxsYmFja0hhbmRsZXJ8bnVsbCA9IG51bGw7XG5cbiAgLyoqXG4gICAqIE1hcmsgdGhlIGJlZ2lubmluZyBvZiBhIHJlbmRlciBvcGVyYXRpb24gKGkuZS4gQ0QgY3ljbGUpLlxuICAgKiBUaHJvd3MgaWYgY2FsbGVkIHdoaWxlIGV4ZWN1dGluZyBjYWxsYmFja3MuXG4gICAqL1xuICBiZWdpbigpIHtcbiAgICB0aGlzLmhhbmRsZXI/LnZhbGlkYXRlQmVnaW4oKTtcbiAgICB0aGlzLnJlbmRlckRlcHRoKys7XG4gIH1cblxuICAvKipcbiAgICogTWFyayB0aGUgZW5kIG9mIGEgcmVuZGVyIG9wZXJhdGlvbi4gQ2FsbGJhY2tzIHdpbGwgYmVcbiAgICogZXhlY3V0ZWQgaWYgdGhlcmUgYXJlIG5vIG1vcmUgcGVuZGluZyBvcGVyYXRpb25zLlxuICAgKi9cbiAgZW5kKCkge1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnRHcmVhdGVyVGhhbih0aGlzLnJlbmRlckRlcHRoLCAwLCAncmVuZGVyRGVwdGggbXVzdCBiZSBncmVhdGVyIHRoYW4gMCcpO1xuICAgIHRoaXMucmVuZGVyRGVwdGgtLTtcblxuICAgIGlmICh0aGlzLnJlbmRlckRlcHRoID09PSAwKSB7XG4gICAgICB0aGlzLmhhbmRsZXI/LmV4ZWN1dGUoKTtcbiAgICB9XG4gIH1cblxuICBuZ09uRGVzdHJveSgpIHtcbiAgICB0aGlzLmhhbmRsZXI/LmRlc3Ryb3koKTtcbiAgICB0aGlzLmhhbmRsZXIgPSBudWxsO1xuICB9XG5cbiAgLyoqIEBub2NvbGxhcHNlICovXG4gIHN0YXRpYyDJtXByb3YgPSAvKiogQHB1cmVPckJyZWFrTXlDb2RlICovIMm1ybVkZWZpbmVJbmplY3RhYmxlKHtcbiAgICB0b2tlbjogQWZ0ZXJSZW5kZXJFdmVudE1hbmFnZXIsXG4gICAgcHJvdmlkZWRJbjogJ3Jvb3QnLFxuICAgIGZhY3Rvcnk6ICgpID0+IG5ldyBBZnRlclJlbmRlckV2ZW50TWFuYWdlcigpLFxuICB9KTtcbn1cbiJdfQ==