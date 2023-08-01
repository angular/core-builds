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
    const instance = new AfterRenderCallback(callback);
    destroy = () => {
        manager.unregister(instance);
        unregisterFn();
    };
    manager.register(instance);
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
    const instance = new AfterRenderCallback(() => {
        destroy?.();
        callback();
    });
    destroy = () => {
        manager.unregister(instance);
        unregisterFn();
    };
    manager.register(instance);
    return { destroy };
}
/**
 * A wrapper around a function to be used as an after render callback.
 * @private
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
 * Implements `afterRender` and `afterNextRender` callback manager logic.
 */
export class AfterRenderEventManager {
    constructor() {
        this.callbacks = new Set();
        this.deferredCallbacks = new Set();
        this.renderDepth = 0;
        this.runningCallbacks = false;
    }
    /**
     * Mark the beginning of a render operation (i.e. CD cycle).
     * Throws if called from an `afterRender` callback.
     */
    begin() {
        if (this.runningCallbacks) {
            throw new RuntimeError(102 /* RuntimeErrorCode.RECURSIVE_APPLICATION_RENDER */, ngDevMode &&
                'A new render operation began before the previous operation ended. ' +
                    'Did you trigger change detection from afterRender or afterNextRender?');
        }
        this.renderDepth++;
    }
    /**
     * Mark the end of a render operation. Registered callbacks
     * are invoked if there are no more pending operations.
     */
    end() {
        this.renderDepth--;
        if (this.renderDepth === 0) {
            try {
                this.runningCallbacks = true;
                for (const callback of this.callbacks) {
                    callback.invoke();
                }
            }
            finally {
                this.runningCallbacks = false;
                for (const callback of this.deferredCallbacks) {
                    this.callbacks.add(callback);
                }
                this.deferredCallbacks.clear();
            }
        }
    }
    register(callback) {
        // If we're currently running callbacks, new callbacks should be deferred
        // until the next render operation.
        const target = this.runningCallbacks ? this.deferredCallbacks : this.callbacks;
        target.add(callback);
    }
    unregister(callback) {
        this.callbacks.delete(callback);
        this.deferredCallbacks.delete(callback);
    }
    ngOnDestroy() {
        this.callbacks.clear();
        this.deferredCallbacks.clear();
    }
    /** @nocollapse */
    static { this.ɵprov = ɵɵdefineInjectable({
        token: AfterRenderEventManager,
        providedIn: 'root',
        factory: () => new AfterRenderEventManager(),
    }); }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWZ0ZXJfcmVuZGVyX2hvb2tzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9hZnRlcl9yZW5kZXJfaG9va3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLHdCQUF3QixFQUFFLFFBQVEsRUFBRSxrQkFBa0IsRUFBQyxNQUFNLE9BQU8sQ0FBQztBQUM3RSxPQUFPLEVBQUMsTUFBTSxFQUFDLE1BQU0sOEJBQThCLENBQUM7QUFDcEQsT0FBTyxFQUFDLFlBQVksRUFBbUIsTUFBTSxXQUFXLENBQUM7QUFDekQsT0FBTyxFQUFDLFVBQVUsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBRWpELE9BQU8sRUFBQyxpQkFBaUIsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBNEJwRDs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztHQXdDRztBQUNILE1BQU0sVUFBVSxXQUFXLENBQUMsUUFBc0IsRUFBRSxPQUE0QjtJQUM5RSxDQUFDLE9BQU8sSUFBSSx3QkFBd0IsQ0FBQyxXQUFXLENBQUMsQ0FBQztJQUNsRCxNQUFNLFFBQVEsR0FBRyxPQUFPLEVBQUUsUUFBUSxJQUFJLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUV2RCxJQUFJLENBQUMsaUJBQWlCLENBQUMsUUFBUSxDQUFDLEVBQUU7UUFDaEMsT0FBTyxFQUFDLE9BQU8sS0FBSSxDQUFDLEVBQUMsQ0FBQztLQUN2QjtJQUVELElBQUksT0FBK0IsQ0FBQztJQUNwQyxNQUFNLFlBQVksR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxPQUFPLEVBQUUsRUFBRSxDQUFDLENBQUM7SUFDM0UsTUFBTSxPQUFPLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyx1QkFBdUIsQ0FBQyxDQUFD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QkFDOUIsS0FBSyxNQUFNLFFBQVEsSUFBSSxJQUFJLENBQUMsaUJBQWlCLEVBQUU7b0JBQzdDLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDO2lCQUM5QjtnQkFDRCxJQUFJLENBQUMsaUJBQWlCLENBQUMsS0FBSyxFQUFFLENBQUM7YUFDaEM7U0FDRjtJQUNILENBQUM7SUFFRCxRQUFRLENBQUMsUUFBNkI7UUFDcEMseUVBQXlFO1FBQ3pFLG1DQUFtQztRQUNuQyxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQztRQUMvRSxNQUFNLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQ3ZCLENBQUM7SUFFRCxVQUFVLENBQUMsUUFBNkI7UUFDdEMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDaEMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUMxQyxDQUFDO0lBRUQsV0FBVztRQUNULElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDdkIsSUFBSSxDQUFDLGlCQUFpQixDQUFDLEtBQUssRUFBRSxDQUFDO0lBQ2pDLENBQUM7SUFFRCxrQkFBa0I7YUFDWCxVQUFLLEdBQTZCLGtCQUFrQixDQUFDO1FBQzFELEtBQUssRUFBRSx1QkFBdUI7UUFDOUIsVUFBVSxFQUFFLE1BQU07UUFDbEIsT0FBTyxFQUFFLEdBQUcsRUFBRSxDQUFDLElBQUksdUJBQXVCLEVBQUU7S0FDN0MsQ0FBQyxBQUpVLENBSVQiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHthc3NlcnRJbkluamVjdGlvbkNvbnRleHQsIEluamVjdG9yLCDJtcm1ZGVmaW5lSW5qZWN0YWJsZX0gZnJvbSAnLi4vZGknO1xuaW1wb3J0IHtpbmplY3R9IGZyb20gJy4uL2RpL2luamVjdG9yX2NvbXBhdGliaWxpdHknO1xuaW1wb3J0IHtSdW50aW1lRXJyb3IsIFJ1bnRpbWVFcnJvckNvZGV9IGZyb20gJy4uL2Vycm9ycyc7XG5pbXBvcnQge0Rlc3Ryb3lSZWZ9IGZyb20gJy4uL2xpbmtlci9kZXN0cm95X3JlZic7XG5cbmltcG9ydCB7aXNQbGF0Zm9ybUJyb3dzZXJ9IGZyb20gJy4vdXRpbC9taXNjX3V0aWxzJztcblxuLyoqXG4gKiBPcHRpb25zIHBhc3NlZCB0byBgYWZ0ZXJSZW5kZXJgIGFuZCBgYWZ0ZXJOZXh0UmVuZGVyYC5cbiAqXG4gKiBAZGV2ZWxvcGVyUHJldmlld1xuICovXG5leHBvcnQgaW50ZXJmYWNlIEFmdGVyUmVuZGVyT3B0aW9ucyB7XG4gIC8qKlxuICAgKiBUaGUgYEluamVjdG9yYCB0byB1c2UgZHVyaW5nIGNyZWF0aW9uLlxuICAgKlxuICAgKiBJZiB0aGlzIGlzIG5vdCBwcm92aWRlZCwgdGhlIGN1cnJlbnQgaW5qZWN0aW9uIGNvbnRleHQgd2lsbCBiZSB1c2VkIGluc3RlYWQgKHZpYSBgaW5qZWN0YCkuXG4gICAqL1xuICBpbmplY3Rvcj86IEluamVjdG9yO1xufVxuXG4vKipcbiAqIEEgY2FsbGJhY2sgdGhhdCBydW5zIGFmdGVyIHJlbmRlci5cbiAqXG4gKiBAZGV2ZWxvcGVyUHJldmlld1xuICovXG5leHBvcnQgaW50ZXJmYWNlIEFmdGVyUmVuZGVyUmVmIHtcbiAgLyoqXG4gICAqIFNodXQgZG93biB0aGUgY2FsbGJhY2ssIHByZXZlbnRpbmcgaXQgZnJvbSBiZWluZyBjYWxsZWQgYWdhaW4uXG4gICAqL1xuICBkZXN0cm95KCk6IHZvaWQ7XG59XG5cbi8qKlxuICogUmVnaXN0ZXIgYSBjYWxsYmFjayB0byBiZSBpbnZva2VkIGVhY2ggdGltZSB0aGUgYXBwbGljYXRpb25cbiAqIGZpbmlzaGVzIHJlbmRlcmluZy5cbiAqXG4gKiBOb3RlIHRoYXQgdGhlIGNhbGxiYWNrIHdpbGwgcnVuXG4gKiAtIGluIHRoZSBvcmRlciBpdCB3YXMgcmVnaXN0ZXJlZFxuICogLSBvbmNlIHBlciByZW5kZXJcbiAqIC0gb24gYnJvd3NlciBwbGF0Zm9ybXMgb25seVxuICpcbiAqIDxkaXYgY2xhc3M9XCJhbGVydCBpcy1pbXBvcnRhbnRcIj5cbiAqXG4gKiBDb21wb25lbnRzIGFyZSBub3QgZ3VhcmFudGVlZCB0byBiZSBbaHlkcmF0ZWRdKGd1aWRlL2h5ZHJhdGlvbikgYmVmb3JlIHRoZSBjYWxsYmFjayBydW5zLlxuICogWW91IG11c3QgdXNlIGNhdXRpb24gd2hlbiBkaXJlY3RseSByZWFkaW5nIG9yIHdyaXRpbmcgdGhlIERPTSBhbmQgbGF5b3V0LlxuICpcbiAqIDwvZGl2PlxuICpcbiAqIEBwYXJhbSBjYWxsYmFjayBBIGNhbGxiYWNrIGZ1bmN0aW9uIHRvIHJlZ2lzdGVyXG4gKlxuICogQHVzYWdlTm90ZXNcbiAqXG4gKiBVc2UgYGFmdGVyUmVuZGVyYCB0byByZWFkIG9yIHdyaXRlIHRoZSBET00gYWZ0ZXIgZWFjaCByZW5kZXIuXG4gKlxuICogIyMjIEV4YW1wbGVcbiAqIGBgYHRzXG4gKiBAQ29tcG9uZW50KHtcbiAqICAgc2VsZWN0b3I6ICdteS1jbXAnLFxuICogICB0ZW1wbGF0ZTogYDxzcGFuICNjb250ZW50Pnt7IC4uLiB9fTwvc3Bhbj5gLFxuICogfSlcbiAqIGV4cG9ydCBjbGFzcyBNeUNvbXBvbmVudCB7XG4gKiAgIEBWaWV3Q2hpbGQoJ2NvbnRlbnQnKSBjb250ZW50UmVmOiBFbGVtZW50UmVmO1xuICpcbiAqICAgY29uc3RydWN0b3IoKSB7XG4gKiAgICAgYWZ0ZXJSZW5kZXIoKCkgPT4ge1xuICogICAgICAgY29uc29sZS5sb2coJ2NvbnRlbnQgaGVpZ2h0OiAnICsgdGhpcy5jb250ZW50UmVmLm5hdGl2ZUVsZW1lbnQuc2Nyb2xsSGVpZ2h0KTtcbiAqICAgICB9KTtcbiAqICAgfVxuICogfVxuICogYGBgXG4gKlxuICogQGRldmVsb3BlclByZXZpZXdcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFmdGVyUmVuZGVyKGNhbGxiYWNrOiBWb2lkRnVuY3Rpb24sIG9wdGlvbnM/OiBBZnRlclJlbmRlck9wdGlvbnMpOiBBZnRlclJlbmRlclJlZiB7XG4gICFvcHRpb25zICYmIGFzc2VydEluSW5qZWN0aW9uQ29udGV4dChhZnRlclJlbmRlcik7XG4gIGNvbnN0IGluamVjdG9yID0gb3B0aW9ucz8uaW5qZWN0b3IgPz8gaW5qZWN0KEluamVjdG9yKTtcblxuICBpZiAoIWlzUGxhdGZvcm1Ccm93c2VyKGluamVjdG9yKSkge1xuICAgIHJldHVybiB7ZGVzdHJveSgpIHt9fTtcbiAgfVxuXG4gIGxldCBkZXN0cm95OiBWb2lkRnVuY3Rpb258dW5kZWZpbmVkO1xuICBjb25zdCB1bnJlZ2lzdGVyRm4gPSBpbmplY3Rvci5nZXQoRGVzdHJveVJlZikub25EZXN0cm95KCgpID0+IGRlc3Ryb3k/LigpKTtcbiAgY29uc3QgbWFuYWdlciA9IGluamVjdG9yLmdldChBZnRlclJlbmRlckV2ZW50TWFuYWdlcik7XG4gIGNvbnN0IGluc3RhbmNlID0gbmV3IEFmdGVyUmVuZGVyQ2FsbGJhY2soY2FsbGJhY2spO1xuXG4gIGRlc3Ryb3kgPSAoKSA9PiB7XG4gICAgbWFuYWdlci51bnJlZ2lzdGVyKGluc3RhbmNlKTtcbiAgICB1bnJlZ2lzdGVyRm4oKTtcbiAgfTtcbiAgbWFuYWdlci5yZWdpc3RlcihpbnN0YW5jZSk7XG4gIHJldHVybiB7ZGVzdHJveX07XG59XG5cbi8qKlxuICogUmVnaXN0ZXIgYSBjYWxsYmFjayB0byBiZSBpbnZva2VkIHRoZSBuZXh0IHRpbWUgdGhlIGFwcGxpY2F0aW9uXG4gKiBmaW5pc2hlcyByZW5kZXJpbmcuXG4gKlxuICogTm90ZSB0aGF0IHRoZSBjYWxsYmFjayB3aWxsIHJ1blxuICogLSBpbiB0aGUgb3JkZXIgaXQgd2FzIHJlZ2lzdGVyZWRcbiAqIC0gb24gYnJvd3NlciBwbGF0Zm9ybXMgb25seVxuICpcbiAqIDxkaXYgY2xhc3M9XCJhbGVydCBpcy1pbXBvcnRhbnRcIj5cbiAqXG4gKiBDb21wb25lbnRzIGFyZSBub3QgZ3VhcmFudGVlZCB0byBiZSBbaHlkcmF0ZWRdKGd1aWRlL2h5ZHJhdGlvbikgYmVmb3JlIHRoZSBjYWxsYmFjayBydW5zLlxuICogWW91IG11c3QgdXNlIGNhdXRpb24gd2hlbiBkaXJlY3RseSByZWFkaW5nIG9yIHdyaXRpbmcgdGhlIERPTSBhbmQgbGF5b3V0LlxuICpcbiAqIDwvZGl2PlxuICpcbiAqIEBwYXJhbSBjYWxsYmFjayBBIGNhbGxiYWNrIGZ1bmN0aW9uIHRvIHJlZ2lzdGVyXG4gKlxuICogQHVzYWdlTm90ZXNcbiAqXG4gKiBVc2UgYGFmdGVyTmV4dFJlbmRlcmAgdG8gcmVhZCBvciB3cml0ZSB0aGUgRE9NIG9uY2UsXG4gKiBmb3IgZXhhbXBsZSB0byBpbml0aWFsaXplIGEgbm9uLUFuZ3VsYXIgbGlicmFyeS5cbiAqXG4gKiAjIyMgRXhhbXBsZVxuICogYGBgdHNcbiAqIEBDb21wb25lbnQoe1xuICogICBzZWxlY3RvcjogJ215LWNoYXJ0LWNtcCcsXG4gKiAgIHRlbXBsYXRlOiBgPGRpdiAjY2hhcnQ+e3sgLi4uIH19PC9kaXY+YCxcbiAqIH0pXG4gKiBleHBvcnQgY2xhc3MgTXlDaGFydENtcCB7XG4gKiAgIEBWaWV3Q2hpbGQoJ2NoYXJ0JykgY2hhcnRSZWY6IEVsZW1lbnRSZWY7XG4gKiAgIGNoYXJ0OiBNeUNoYXJ0fG51bGw7XG4gKlxuICogICBjb25zdHJ1Y3RvcigpIHtcbiAqICAgICBhZnRlck5leHRSZW5kZXIoKCkgPT4ge1xuICogICAgICAgdGhpcy5jaGFydCA9IG5ldyBNeUNoYXJ0KHRoaXMuY2hhcnRSZWYubmF0aXZlRWxlbWVudCk7XG4gKiAgICAgfSk7XG4gKiAgIH1cbiAqIH1cbiAqIGBgYFxuICpcbiAqIEBkZXZlbG9wZXJQcmV2aWV3XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhZnRlck5leHRSZW5kZXIoXG4gICAgY2FsbGJhY2s6IFZvaWRGdW5jdGlvbiwgb3B0aW9ucz86IEFmdGVyUmVuZGVyT3B0aW9ucyk6IEFmdGVyUmVuZGVyUmVmIHtcbiAgIW9wdGlvbnMgJiYgYXNzZXJ0SW5JbmplY3Rpb25Db250ZXh0KGFmdGVyTmV4dFJlbmRlcik7XG4gIGNvbnN0IGluamVjdG9yID0gb3B0aW9ucz8uaW5qZWN0b3IgPz8gaW5qZWN0KEluamVjdG9yKTtcblxuICBpZiAoIWlzUGxhdGZvcm1Ccm93c2VyKGluamVjdG9yKSkge1xuICAgIHJldHVybiB7ZGVzdHJveSgpIHt9fTtcbiAgfVxuXG4gIGxldCBkZXN0cm95OiBWb2lkRnVuY3Rpb258dW5kZWZpbmVkO1xuICBjb25zdCB1bnJlZ2lzdGVyRm4gPSBpbmplY3Rvci5nZXQoRGVzdHJveVJlZikub25EZXN0cm95KCgpID0+IGRlc3Ryb3k/LigpKTtcbiAgY29uc3QgbWFuYWdlciA9IGluamVjdG9yLmdldChBZnRlclJlbmRlckV2ZW50TWFuYWdlcik7XG4gIGNvbnN0IGluc3RhbmNlID0gbmV3IEFmdGVyUmVuZGVyQ2FsbGJhY2soKCkgPT4ge1xuICAgIGRlc3Ryb3k/LigpO1xuICAgIGNhbGxiYWNrKCk7XG4gIH0pO1xuXG4gIGRlc3Ryb3kgPSAoKSA9PiB7XG4gICAgbWFuYWdlci51bnJlZ2lzdGVyKGluc3RhbmNlKTtcbiAgICB1bnJlZ2lzdGVyRm4oKTtcbiAgfTtcbiAgbWFuYWdlci5yZWdpc3RlcihpbnN0YW5jZSk7XG4gIHJldHVybiB7ZGVzdHJveX07XG59XG5cbi8qKlxuICogQSB3cmFwcGVyIGFyb3VuZCBhIGZ1bmN0aW9uIHRvIGJlIHVzZWQgYXMgYW4gYWZ0ZXIgcmVuZGVyIGNhbGxiYWNrLlxuICogQHByaXZhdGVcbiAqL1xuY2xhc3MgQWZ0ZXJSZW5kZXJDYWxsYmFjayB7XG4gIHByaXZhdGUgY2FsbGJhY2s6IFZvaWRGdW5jdGlvbjtcblxuICBjb25zdHJ1Y3RvcihjYWxsYmFjazogVm9pZEZ1bmN0aW9uKSB7XG4gICAgdGhpcy5jYWxsYmFjayA9IGNhbGxiYWNrO1xuICB9XG5cbiAgaW52b2tlKCkge1xuICAgIHRoaXMuY2FsbGJhY2soKTtcbiAgfVxufVxuXG4vKipcbiAqIEltcGxlbWVudHMgYGFmdGVyUmVuZGVyYCBhbmQgYGFmdGVyTmV4dFJlbmRlcmAgY2FsbGJhY2sgbWFuYWdlciBsb2dpYy5cbiAqL1xuZXhwb3J0IGNsYXNzIEFmdGVyUmVuZGVyRXZlbnRNYW5hZ2VyIHtcbiAgcHJpdmF0ZSBjYWxsYmFja3MgPSBuZXcgU2V0PEFmdGVyUmVuZGVyQ2FsbGJhY2s+KCk7XG4gIHByaXZhdGUgZGVmZXJyZWRDYWxsYmFja3MgPSBuZXcgU2V0PEFmdGVyUmVuZGVyQ2FsbGJhY2s+KCk7XG4gIHByaXZhdGUgcmVuZGVyRGVwdGggPSAwO1xuICBwcml2YXRlIHJ1bm5pbmdDYWxsYmFja3MgPSBmYWxzZTtcblxuICAvKipcbiAgICogTWFyayB0aGUgYmVnaW5uaW5nIG9mIGEgcmVuZGVyIG9wZXJhdGlvbiAoaS5lLiBDRCBjeWNsZSkuXG4gICAqIFRocm93cyBpZiBjYWxsZWQgZnJvbSBhbiBgYWZ0ZXJSZW5kZXJgIGNhbGxiYWNrLlxuICAgKi9cbiAgYmVnaW4oKSB7XG4gICAgaWYgKHRoaXMucnVubmluZ0NhbGxiYWNrcykge1xuICAgICAgdGhyb3cgbmV3IFJ1bnRpbWVFcnJvcihcbiAgICAgICAgICBSdW50aW1lRXJyb3JDb2RlLlJFQ1VSU0lWRV9BUFBMSUNBVElPTl9SRU5ERVIsXG4gICAgICAgICAgbmdEZXZNb2RlICYmXG4gICAgICAgICAgICAgICdBIG5ldyByZW5kZXIgb3BlcmF0aW9uIGJlZ2FuIGJlZm9yZSB0aGUgcHJldmlvdXMgb3BlcmF0aW9uIGVuZGVkLiAnICtcbiAgICAgICAgICAgICAgICAgICdEaWQgeW91IHRyaWdnZXIgY2hhbmdlIGRldGVjdGlvbiBmcm9tIGFmdGVyUmVuZGVyIG9yIGFmdGVyTmV4dFJlbmRlcj8nKTtcbiAgICB9XG5cbiAgICB0aGlzLnJlbmRlckRlcHRoKys7XG4gIH1cblxuICAvKipcbiAgICogTWFyayB0aGUgZW5kIG9mIGEgcmVuZGVyIG9wZXJhdGlvbi4gUmVnaXN0ZXJlZCBjYWxsYmFja3NcbiAgICogYXJlIGludm9rZWQgaWYgdGhlcmUgYXJlIG5vIG1vcmUgcGVuZGluZyBvcGVyYXRpb25zLlxuICAgKi9cbiAgZW5kKCkge1xuICAgIHRoaXMucmVuZGVyRGVwdGgtLTtcblxuICAgIGlmICh0aGlzLnJlbmRlckRlcHRoID09PSAwKSB7XG4gICAgICB0cnkge1xuICAgICAgICB0aGlzLnJ1bm5pbmdDYWxsYmFja3MgPSB0cnVlO1xuICAgICAgICBmb3IgKGNvbnN0IGNhbGxiYWNrIG9mIHRoaXMuY2FsbGJhY2tzKSB7XG4gICAgICAgICAgY2FsbGJhY2suaW52b2tlKCk7XG4gICAgICAgIH1cbiAgICAgIH0gZmluYWxseSB7XG4gICAgICAgIHRoaXMucnVubmluZ0NhbGxiYWNrcyA9IGZhbHNlO1xuICAgICAgICBmb3IgKGNvbnN0IGNhbGxiYWNrIG9mIHRoaXMuZGVmZXJyZWRDYWxsYmFja3MpIHtcbiAgICAgICAgICB0aGlzLmNhbGxiYWNrcy5hZGQoY2FsbGJhY2spO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuZGVmZXJyZWRDYWxsYmFja3MuY2xlYXIoKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZWdpc3RlcihjYWxsYmFjazogQWZ0ZXJSZW5kZXJDYWxsYmFjaykge1xuICAgIC8vIElmIHdlJ3JlIGN1cnJlbnRseSBydW5uaW5nIGNhbGxiYWNrcywgbmV3IGNhbGxiYWNrcyBzaG91bGQgYmUgZGVmZXJyZWRcbiAgICAvLyB1bnRpbCB0aGUgbmV4dCByZW5kZXIgb3BlcmF0aW9uLlxuICAgIGNvbnN0IHRhcmdldCA9IHRoaXMucnVubmluZ0NhbGxiYWNrcyA/IHRoaXMuZGVmZXJyZWRDYWxsYmFja3MgOiB0aGlzLmNhbGxiYWNrcztcbiAgICB0YXJnZXQuYWRkKGNhbGxiYWNrKTtcbiAgfVxuXG4gIHVucmVnaXN0ZXIoY2FsbGJhY2s6IEFmdGVyUmVuZGVyQ2FsbGJhY2spIHtcbiAgICB0aGlzLmNhbGxiYWNrcy5kZWxldGUoY2FsbGJhY2spO1xuICAgIHRoaXMuZGVmZXJyZWRDYWxsYmFja3MuZGVsZXRlKGNhbGxiYWNrKTtcbiAgfVxuXG4gIG5nT25EZXN0cm95KCkge1xuICAgIHRoaXMuY2FsbGJhY2tzLmNsZWFyKCk7XG4gICAgdGhpcy5kZWZlcnJlZENhbGxiYWNrcy5jbGVhcigpO1xuICB9XG5cbiAgLyoqIEBub2NvbGxhcHNlICovXG4gIHN0YXRpYyDJtXByb3YgPSAvKiogQHB1cmVPckJyZWFrTXlDb2RlICovIMm1ybVkZWZpbmVJbmplY3RhYmxlKHtcbiAgICB0b2tlbjogQWZ0ZXJSZW5kZXJFdmVudE1hbmFnZXIsXG4gICAgcHJvdmlkZWRJbjogJ3Jvb3QnLFxuICAgIGZhY3Rvcnk6ICgpID0+IG5ldyBBZnRlclJlbmRlckV2ZW50TWFuYWdlcigpLFxuICB9KTtcbn1cbiJdfQ==