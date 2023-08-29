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
    const ngZone = injector.get(NgZone);
    const instance = new AfterRenderCallback(() => ngZone.runOutsideAngular(callback));
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
    const ngZone = injector.get(NgZone);
    const instance = new AfterRenderCallback(() => {
        destroy?.();
        ngZone.runOutsideAngular(callback);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWZ0ZXJfcmVuZGVyX2hvb2tzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9hZnRlcl9yZW5kZXJfaG9va3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLHdCQUF3QixFQUFFLFFBQVEsRUFBRSxrQkFBa0IsRUFBQyxNQUFNLE9BQU8sQ0FBQztBQUM3RSxPQUFPLEVBQUMsTUFBTSxFQUFDLE1BQU0sOEJBQThCLENBQUM7QUFDcEQsT0FBTyxFQUFDLFlBQVksRUFBbUIsTUFBTSxXQUFXLENBQUM7QUFDekQsT0FBTyxFQUFDLFVBQVUsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQ2pELE9BQU8sRUFBQyxNQUFNLEVBQUMsTUFBTSxTQUFTLENBQUM7QUFFL0IsT0FBTyxFQUFDLGlCQUFpQixFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUE0QnBEOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBd0NHO0FBQ0gsTUFBTSxVQUFVLFdBQVcsQ0FBQyxRQUFzQixFQUFFLE9BQTRCO0lBQzlFLENBQUMsT0FBTyxJQUFJLHdCQUF3QixDQUFDLFdBQVcsQ0FBQyxDQUFDO0lBQ2xELE1BQU0sUUFBUSxHQUFHLE9BQU8sRUFBRSxRQUFRLElBQUksTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBRXZELElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxRQUFRLENBQUMsRUFBRTtRQUNoQyxPQUFPLEVBQUMsT0FBTyxLQUFJLENBQUMsRUFBQyxDQUFDO0tBQ3ZCO0lBRUQsSUFBSSxPQUErQixDQUFDO0lBQ3BDLE1BQU0sWUFBWSxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUMsU0FBUyxDQUFDLEdBQUcsRUFBRSxDQUFDLE9BQU8sRUFBRSxFQUFFLENBQUMsQ0FBQztJQUMzRSxNQUFNLE9BQU8s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QixVQUFVLEVBQUUsTUFBTTtRQUNsQixPQUFPLEVBQUUsR0FBRyxFQUFFLENBQUMsSUFBSSx1QkFBdUIsRUFBRTtLQUM3QyxDQUFDLEFBSlUsQ0FJVCIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge2Fzc2VydEluSW5qZWN0aW9uQ29udGV4dCwgSW5qZWN0b3IsIMm1ybVkZWZpbmVJbmplY3RhYmxlfSBmcm9tICcuLi9kaSc7XG5pbXBvcnQge2luamVjdH0gZnJvbSAnLi4vZGkvaW5qZWN0b3JfY29tcGF0aWJpbGl0eSc7XG5pbXBvcnQge1J1bnRpbWVFcnJvciwgUnVudGltZUVycm9yQ29kZX0gZnJvbSAnLi4vZXJyb3JzJztcbmltcG9ydCB7RGVzdHJveVJlZn0gZnJvbSAnLi4vbGlua2VyL2Rlc3Ryb3lfcmVmJztcbmltcG9ydCB7Tmdab25lfSBmcm9tICcuLi96b25lJztcblxuaW1wb3J0IHtpc1BsYXRmb3JtQnJvd3Nlcn0gZnJvbSAnLi91dGlsL21pc2NfdXRpbHMnO1xuXG4vKipcbiAqIE9wdGlvbnMgcGFzc2VkIHRvIGBhZnRlclJlbmRlcmAgYW5kIGBhZnRlck5leHRSZW5kZXJgLlxuICpcbiAqIEBkZXZlbG9wZXJQcmV2aWV3XG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgQWZ0ZXJSZW5kZXJPcHRpb25zIHtcbiAgLyoqXG4gICAqIFRoZSBgSW5qZWN0b3JgIHRvIHVzZSBkdXJpbmcgY3JlYXRpb24uXG4gICAqXG4gICAqIElmIHRoaXMgaXMgbm90IHByb3ZpZGVkLCB0aGUgY3VycmVudCBpbmplY3Rpb24gY29udGV4dCB3aWxsIGJlIHVzZWQgaW5zdGVhZCAodmlhIGBpbmplY3RgKS5cbiAgICovXG4gIGluamVjdG9yPzogSW5qZWN0b3I7XG59XG5cbi8qKlxuICogQSBjYWxsYmFjayB0aGF0IHJ1bnMgYWZ0ZXIgcmVuZGVyLlxuICpcbiAqIEBkZXZlbG9wZXJQcmV2aWV3XG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgQWZ0ZXJSZW5kZXJSZWYge1xuICAvKipcbiAgICogU2h1dCBkb3duIHRoZSBjYWxsYmFjaywgcHJldmVudGluZyBpdCBmcm9tIGJlaW5nIGNhbGxlZCBhZ2Fpbi5cbiAgICovXG4gIGRlc3Ryb3koKTogdm9pZDtcbn1cblxuLyoqXG4gKiBSZWdpc3RlciBhIGNhbGxiYWNrIHRvIGJlIGludm9rZWQgZWFjaCB0aW1lIHRoZSBhcHBsaWNhdGlvblxuICogZmluaXNoZXMgcmVuZGVyaW5nLlxuICpcbiAqIE5vdGUgdGhhdCB0aGUgY2FsbGJhY2sgd2lsbCBydW5cbiAqIC0gaW4gdGhlIG9yZGVyIGl0IHdhcyByZWdpc3RlcmVkXG4gKiAtIG9uY2UgcGVyIHJlbmRlclxuICogLSBvbiBicm93c2VyIHBsYXRmb3JtcyBvbmx5XG4gKlxuICogPGRpdiBjbGFzcz1cImFsZXJ0IGlzLWltcG9ydGFudFwiPlxuICpcbiAqIENvbXBvbmVudHMgYXJlIG5vdCBndWFyYW50ZWVkIHRvIGJlIFtoeWRyYXRlZF0oZ3VpZGUvaHlkcmF0aW9uKSBiZWZvcmUgdGhlIGNhbGxiYWNrIHJ1bnMuXG4gKiBZb3UgbXVzdCB1c2UgY2F1dGlvbiB3aGVuIGRpcmVjdGx5IHJlYWRpbmcgb3Igd3JpdGluZyB0aGUgRE9NIGFuZCBsYXlvdXQuXG4gKlxuICogPC9kaXY+XG4gKlxuICogQHBhcmFtIGNhbGxiYWNrIEEgY2FsbGJhY2sgZnVuY3Rpb24gdG8gcmVnaXN0ZXJcbiAqXG4gKiBAdXNhZ2VOb3Rlc1xuICpcbiAqIFVzZSBgYWZ0ZXJSZW5kZXJgIHRvIHJlYWQgb3Igd3JpdGUgdGhlIERPTSBhZnRlciBlYWNoIHJlbmRlci5cbiAqXG4gKiAjIyMgRXhhbXBsZVxuICogYGBgdHNcbiAqIEBDb21wb25lbnQoe1xuICogICBzZWxlY3RvcjogJ215LWNtcCcsXG4gKiAgIHRlbXBsYXRlOiBgPHNwYW4gI2NvbnRlbnQ+e3sgLi4uIH19PC9zcGFuPmAsXG4gKiB9KVxuICogZXhwb3J0IGNsYXNzIE15Q29tcG9uZW50IHtcbiAqICAgQFZpZXdDaGlsZCgnY29udGVudCcpIGNvbnRlbnRSZWY6IEVsZW1lbnRSZWY7XG4gKlxuICogICBjb25zdHJ1Y3RvcigpIHtcbiAqICAgICBhZnRlclJlbmRlcigoKSA9PiB7XG4gKiAgICAgICBjb25zb2xlLmxvZygnY29udGVudCBoZWlnaHQ6ICcgKyB0aGlzLmNvbnRlbnRSZWYubmF0aXZlRWxlbWVudC5zY3JvbGxIZWlnaHQpO1xuICogICAgIH0pO1xuICogICB9XG4gKiB9XG4gKiBgYGBcbiAqXG4gKiBAZGV2ZWxvcGVyUHJldmlld1xuICovXG5leHBvcnQgZnVuY3Rpb24gYWZ0ZXJSZW5kZXIoY2FsbGJhY2s6IFZvaWRGdW5jdGlvbiwgb3B0aW9ucz86IEFmdGVyUmVuZGVyT3B0aW9ucyk6IEFmdGVyUmVuZGVyUmVmIHtcbiAgIW9wdGlvbnMgJiYgYXNzZXJ0SW5JbmplY3Rpb25Db250ZXh0KGFmdGVyUmVuZGVyKTtcbiAgY29uc3QgaW5qZWN0b3IgPSBvcHRpb25zPy5pbmplY3RvciA/PyBpbmplY3QoSW5qZWN0b3IpO1xuXG4gIGlmICghaXNQbGF0Zm9ybUJyb3dzZXIoaW5qZWN0b3IpKSB7XG4gICAgcmV0dXJuIHtkZXN0cm95KCkge319O1xuICB9XG5cbiAgbGV0IGRlc3Ryb3k6IFZvaWRGdW5jdGlvbnx1bmRlZmluZWQ7XG4gIGNvbnN0IHVucmVnaXN0ZXJGbiA9IGluamVjdG9yLmdldChEZXN0cm95UmVmKS5vbkRlc3Ryb3koKCkgPT4gZGVzdHJveT8uKCkpO1xuICBjb25zdCBtYW5hZ2VyID0gaW5qZWN0b3IuZ2V0KEFmdGVyUmVuZGVyRXZlbnRNYW5hZ2VyKTtcbiAgY29uc3Qgbmdab25lID0gaW5qZWN0b3IuZ2V0KE5nWm9uZSk7XG4gIGNvbnN0IGluc3RhbmNlID0gbmV3IEFmdGVyUmVuZGVyQ2FsbGJhY2soKCkgPT4gbmdab25lLnJ1bk91dHNpZGVBbmd1bGFyKGNhbGxiYWNrKSk7XG5cbiAgZGVzdHJveSA9ICgpID0+IHtcbiAgICBtYW5hZ2VyLnVucmVnaXN0ZXIoaW5zdGFuY2UpO1xuICAgIHVucmVnaXN0ZXJGbigpO1xuICB9O1xuICBtYW5hZ2VyLnJlZ2lzdGVyKGluc3RhbmNlKTtcbiAgcmV0dXJuIHtkZXN0cm95fTtcbn1cblxuLyoqXG4gKiBSZWdpc3RlciBhIGNhbGxiYWNrIHRvIGJlIGludm9rZWQgdGhlIG5leHQgdGltZSB0aGUgYXBwbGljYXRpb25cbiAqIGZpbmlzaGVzIHJlbmRlcmluZy5cbiAqXG4gKiBOb3RlIHRoYXQgdGhlIGNhbGxiYWNrIHdpbGwgcnVuXG4gKiAtIGluIHRoZSBvcmRlciBpdCB3YXMgcmVnaXN0ZXJlZFxuICogLSBvbiBicm93c2VyIHBsYXRmb3JtcyBvbmx5XG4gKlxuICogPGRpdiBjbGFzcz1cImFsZXJ0IGlzLWltcG9ydGFudFwiPlxuICpcbiAqIENvbXBvbmVudHMgYXJlIG5vdCBndWFyYW50ZWVkIHRvIGJlIFtoeWRyYXRlZF0oZ3VpZGUvaHlkcmF0aW9uKSBiZWZvcmUgdGhlIGNhbGxiYWNrIHJ1bnMuXG4gKiBZb3UgbXVzdCB1c2UgY2F1dGlvbiB3aGVuIGRpcmVjdGx5IHJlYWRpbmcgb3Igd3JpdGluZyB0aGUgRE9NIGFuZCBsYXlvdXQuXG4gKlxuICogPC9kaXY+XG4gKlxuICogQHBhcmFtIGNhbGxiYWNrIEEgY2FsbGJhY2sgZnVuY3Rpb24gdG8gcmVnaXN0ZXJcbiAqXG4gKiBAdXNhZ2VOb3Rlc1xuICpcbiAqIFVzZSBgYWZ0ZXJOZXh0UmVuZGVyYCB0byByZWFkIG9yIHdyaXRlIHRoZSBET00gb25jZSxcbiAqIGZvciBleGFtcGxlIHRvIGluaXRpYWxpemUgYSBub24tQW5ndWxhciBsaWJyYXJ5LlxuICpcbiAqICMjIyBFeGFtcGxlXG4gKiBgYGB0c1xuICogQENvbXBvbmVudCh7XG4gKiAgIHNlbGVjdG9yOiAnbXktY2hhcnQtY21wJyxcbiAqICAgdGVtcGxhdGU6IGA8ZGl2ICNjaGFydD57eyAuLi4gfX08L2Rpdj5gLFxuICogfSlcbiAqIGV4cG9ydCBjbGFzcyBNeUNoYXJ0Q21wIHtcbiAqICAgQFZpZXdDaGlsZCgnY2hhcnQnKSBjaGFydFJlZjogRWxlbWVudFJlZjtcbiAqICAgY2hhcnQ6IE15Q2hhcnR8bnVsbDtcbiAqXG4gKiAgIGNvbnN0cnVjdG9yKCkge1xuICogICAgIGFmdGVyTmV4dFJlbmRlcigoKSA9PiB7XG4gKiAgICAgICB0aGlzLmNoYXJ0ID0gbmV3IE15Q2hhcnQodGhpcy5jaGFydFJlZi5uYXRpdmVFbGVtZW50KTtcbiAqICAgICB9KTtcbiAqICAgfVxuICogfVxuICogYGBgXG4gKlxuICogQGRldmVsb3BlclByZXZpZXdcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFmdGVyTmV4dFJlbmRlcihcbiAgICBjYWxsYmFjazogVm9pZEZ1bmN0aW9uLCBvcHRpb25zPzogQWZ0ZXJSZW5kZXJPcHRpb25zKTogQWZ0ZXJSZW5kZXJSZWYge1xuICAhb3B0aW9ucyAmJiBhc3NlcnRJbkluamVjdGlvbkNvbnRleHQoYWZ0ZXJOZXh0UmVuZGVyKTtcbiAgY29uc3QgaW5qZWN0b3IgPSBvcHRpb25zPy5pbmplY3RvciA/PyBpbmplY3QoSW5qZWN0b3IpO1xuXG4gIGlmICghaXNQbGF0Zm9ybUJyb3dzZXIoaW5qZWN0b3IpKSB7XG4gICAgcmV0dXJuIHtkZXN0cm95KCkge319O1xuICB9XG5cbiAgbGV0IGRlc3Ryb3k6IFZvaWRGdW5jdGlvbnx1bmRlZmluZWQ7XG4gIGNvbnN0IHVucmVnaXN0ZXJGbiA9IGluamVjdG9yLmdldChEZXN0cm95UmVmKS5vbkRlc3Ryb3koKCkgPT4gZGVzdHJveT8uKCkpO1xuICBjb25zdCBtYW5hZ2VyID0gaW5qZWN0b3IuZ2V0KEFmdGVyUmVuZGVyRXZlbnRNYW5hZ2VyKTtcbiAgY29uc3Qgbmdab25lID0gaW5qZWN0b3IuZ2V0KE5nWm9uZSk7XG4gIGNvbnN0IGluc3RhbmNlID0gbmV3IEFmdGVyUmVuZGVyQ2FsbGJhY2soKCkgPT4ge1xuICAgIGRlc3Ryb3k/LigpO1xuICAgIG5nWm9uZS5ydW5PdXRzaWRlQW5ndWxhcihjYWxsYmFjayk7XG4gIH0pO1xuXG4gIGRlc3Ryb3kgPSAoKSA9PiB7XG4gICAgbWFuYWdlci51bnJlZ2lzdGVyKGluc3RhbmNlKTtcbiAgICB1bnJlZ2lzdGVyRm4oKTtcbiAgfTtcbiAgbWFuYWdlci5yZWdpc3RlcihpbnN0YW5jZSk7XG4gIHJldHVybiB7ZGVzdHJveX07XG59XG5cbi8qKlxuICogQSB3cmFwcGVyIGFyb3VuZCBhIGZ1bmN0aW9uIHRvIGJlIHVzZWQgYXMgYW4gYWZ0ZXIgcmVuZGVyIGNhbGxiYWNrLlxuICogQHByaXZhdGVcbiAqL1xuY2xhc3MgQWZ0ZXJSZW5kZXJDYWxsYmFjayB7XG4gIHByaXZhdGUgY2FsbGJhY2s6IFZvaWRGdW5jdGlvbjtcblxuICBjb25zdHJ1Y3RvcihjYWxsYmFjazogVm9pZEZ1bmN0aW9uKSB7XG4gICAgdGhpcy5jYWxsYmFjayA9IGNhbGxiYWNrO1xuICB9XG5cbiAgaW52b2tlKCkge1xuICAgIHRoaXMuY2FsbGJhY2soKTtcbiAgfVxufVxuXG4vKipcbiAqIEltcGxlbWVudHMgYGFmdGVyUmVuZGVyYCBhbmQgYGFmdGVyTmV4dFJlbmRlcmAgY2FsbGJhY2sgbWFuYWdlciBsb2dpYy5cbiAqL1xuZXhwb3J0IGNsYXNzIEFmdGVyUmVuZGVyRXZlbnRNYW5hZ2VyIHtcbiAgcHJpdmF0ZSBjYWxsYmFja3MgPSBuZXcgU2V0PEFmdGVyUmVuZGVyQ2FsbGJhY2s+KCk7XG4gIHByaXZhdGUgZGVmZXJyZWRDYWxsYmFja3MgPSBuZXcgU2V0PEFmdGVyUmVuZGVyQ2FsbGJhY2s+KCk7XG4gIHByaXZhdGUgcmVuZGVyRGVwdGggPSAwO1xuICBwcml2YXRlIHJ1bm5pbmdDYWxsYmFja3MgPSBmYWxzZTtcblxuICAvKipcbiAgICogTWFyayB0aGUgYmVnaW5uaW5nIG9mIGEgcmVuZGVyIG9wZXJhdGlvbiAoaS5lLiBDRCBjeWNsZSkuXG4gICAqIFRocm93cyBpZiBjYWxsZWQgZnJvbSBhbiBgYWZ0ZXJSZW5kZXJgIGNhbGxiYWNrLlxuICAgKi9cbiAgYmVnaW4oKSB7XG4gICAgaWYgKHRoaXMucnVubmluZ0NhbGxiYWNrcykge1xuICAgICAgdGhyb3cgbmV3IFJ1bnRpbWVFcnJvcihcbiAgICAgICAgICBSdW50aW1lRXJyb3JDb2RlLlJFQ1VSU0lWRV9BUFBMSUNBVElPTl9SRU5ERVIsXG4gICAgICAgICAgbmdEZXZNb2RlICYmXG4gICAgICAgICAgICAgICdBIG5ldyByZW5kZXIgb3BlcmF0aW9uIGJlZ2FuIGJlZm9yZSB0aGUgcHJldmlvdXMgb3BlcmF0aW9uIGVuZGVkLiAnICtcbiAgICAgICAgICAgICAgICAgICdEaWQgeW91IHRyaWdnZXIgY2hhbmdlIGRldGVjdGlvbiBmcm9tIGFmdGVyUmVuZGVyIG9yIGFmdGVyTmV4dFJlbmRlcj8nKTtcbiAgICB9XG5cbiAgICB0aGlzLnJlbmRlckRlcHRoKys7XG4gIH1cblxuICAvKipcbiAgICogTWFyayB0aGUgZW5kIG9mIGEgcmVuZGVyIG9wZXJhdGlvbi4gUmVnaXN0ZXJlZCBjYWxsYmFja3NcbiAgICogYXJlIGludm9rZWQgaWYgdGhlcmUgYXJlIG5vIG1vcmUgcGVuZGluZyBvcGVyYXRpb25zLlxuICAgKi9cbiAgZW5kKCkge1xuICAgIHRoaXMucmVuZGVyRGVwdGgtLTtcblxuICAgIGlmICh0aGlzLnJlbmRlckRlcHRoID09PSAwKSB7XG4gICAgICB0cnkge1xuICAgICAgICB0aGlzLnJ1bm5pbmdDYWxsYmFja3MgPSB0cnVlO1xuICAgICAgICBmb3IgKGNvbnN0IGNhbGxiYWNrIG9mIHRoaXMuY2FsbGJhY2tzKSB7XG4gICAgICAgICAgY2FsbGJhY2suaW52b2tlKCk7XG4gICAgICAgIH1cbiAgICAgIH0gZmluYWxseSB7XG4gICAgICAgIHRoaXMucnVubmluZ0NhbGxiYWNrcyA9IGZhbHNlO1xuICAgICAgICBmb3IgKGNvbnN0IGNhbGxiYWNrIG9mIHRoaXMuZGVmZXJyZWRDYWxsYmFja3MpIHtcbiAgICAgICAgICB0aGlzLmNhbGxiYWNrcy5hZGQoY2FsbGJhY2spO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuZGVmZXJyZWRDYWxsYmFja3MuY2xlYXIoKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZWdpc3RlcihjYWxsYmFjazogQWZ0ZXJSZW5kZXJDYWxsYmFjaykge1xuICAgIC8vIElmIHdlJ3JlIGN1cnJlbnRseSBydW5uaW5nIGNhbGxiYWNrcywgbmV3IGNhbGxiYWNrcyBzaG91bGQgYmUgZGVmZXJyZWRcbiAgICAvLyB1bnRpbCB0aGUgbmV4dCByZW5kZXIgb3BlcmF0aW9uLlxuICAgIGNvbnN0IHRhcmdldCA9IHRoaXMucnVubmluZ0NhbGxiYWNrcyA/IHRoaXMuZGVmZXJyZWRDYWxsYmFja3MgOiB0aGlzLmNhbGxiYWNrcztcbiAgICB0YXJnZXQuYWRkKGNhbGxiYWNrKTtcbiAgfVxuXG4gIHVucmVnaXN0ZXIoY2FsbGJhY2s6IEFmdGVyUmVuZGVyQ2FsbGJhY2spIHtcbiAgICB0aGlzLmNhbGxiYWNrcy5kZWxldGUoY2FsbGJhY2spO1xuICAgIHRoaXMuZGVmZXJyZWRDYWxsYmFja3MuZGVsZXRlKGNhbGxiYWNrKTtcbiAgfVxuXG4gIG5nT25EZXN0cm95KCkge1xuICAgIHRoaXMuY2FsbGJhY2tzLmNsZWFyKCk7XG4gICAgdGhpcy5kZWZlcnJlZENhbGxiYWNrcy5jbGVhcigpO1xuICB9XG5cbiAgLyoqIEBub2NvbGxhcHNlICovXG4gIHN0YXRpYyDJtXByb3YgPSAvKiogQHB1cmVPckJyZWFrTXlDb2RlICovIMm1ybVkZWZpbmVJbmplY3RhYmxlKHtcbiAgICB0b2tlbjogQWZ0ZXJSZW5kZXJFdmVudE1hbmFnZXIsXG4gICAgcHJvdmlkZWRJbjogJ3Jvb3QnLFxuICAgIGZhY3Rvcnk6ICgpID0+IG5ldyBBZnRlclJlbmRlckV2ZW50TWFuYWdlcigpLFxuICB9KTtcbn1cbiJdfQ==