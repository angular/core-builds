/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import '../util/ng_jit_mode';
import { setActiveConsumer, setThrowInvalidWriteToSignalError, } from '@angular/core/primitives/signals';
import { Subject } from 'rxjs';
import { first, map } from 'rxjs/operators';
import { ZONELESS_ENABLED } from '../change_detection/scheduling/zoneless_scheduling';
import { Console } from '../console';
import { inject } from '../di';
import { Injectable } from '../di/injectable';
import { InjectionToken } from '../di/injection_token';
import { Injector } from '../di/injector';
import { EnvironmentInjector } from '../di/r3_injector';
import { INTERNAL_APPLICATION_ERROR_HANDLER } from '../error_handler';
import { formatRuntimeError, RuntimeError } from '../errors';
import { ComponentFactory } from '../linker/component_factory';
import { ComponentFactoryResolver } from '../linker/component_factory_resolver';
import { NgModuleRef } from '../linker/ng_module_factory';
import { PendingTasks } from '../pending_tasks';
import { RendererFactory2 } from '../render/api';
import { AfterRenderEventManager } from '../render3/after_render_hooks';
import { isStandalone } from '../render3/definition';
import { detectChangesInternal } from '../render3/instructions/change_detection';
import { publishDefaultGlobalUtils as _publishDefaultGlobalUtils } from '../render3/util/global_utils';
import { requiresRefreshOrTraversal } from '../render3/util/view_utils';
import { TESTABILITY } from '../testability/testability';
import { isPromise } from '../util/lang';
import { ApplicationInitStatus } from './application_init';
import * as i0 from "../r3_symbols";
/**
 * A DI token that provides a set of callbacks to
 * be called for every component that is bootstrapped.
 *
 * Each callback must take a `ComponentRef` instance and return nothing.
 *
 * `(componentRef: ComponentRef) => void`
 *
 * @publicApi
 */
export const APP_BOOTSTRAP_LISTENER = new InjectionToken(ngDevMode ? 'appBootstrapListener' : '');
export function publishDefaultGlobalUtils() {
    ngDevMode && _publishDefaultGlobalUtils();
}
/**
 * Sets the error for an invalid write to a signal to be an Angular `RuntimeError`.
 */
export function publishSignalConfiguration() {
    setThrowInvalidWriteToSignalError(() => {
        throw new RuntimeError(600 /* RuntimeErrorCode.SIGNAL_WRITE_FROM_ILLEGAL_CONTEXT */, ngDevMode &&
            'Writing to signals is not allowed in a `computed` or an `effect` by default. ' +
                'Use `allowSignalWrites` in the `CreateEffectOptions` to enable this inside effects.');
    });
}
export function isBoundToModule(cf) {
    return cf.isBoundToModule;
}
/**
 * A token for third-party components that can register themselves with NgProbe.
 *
 * @deprecated
 * @publicApi
 */
export class NgProbeToken {
    constructor(name, token) {
        this.name = name;
        this.token = token;
    }
}
/** Maximum number of times ApplicationRef will refresh all attached views in a single tick. */
const MAXIMUM_REFRESH_RERUNS = 10;
export function _callAndReportToErrorHandler(errorHandler, ngZone, callback) {
    try {
        const result = callback();
        if (isPromise(result)) {
            return result.catch((e) => {
                ngZone.runOutsideAngular(() => errorHandler.handleError(e));
                // rethrow as the exception handler might not do it
                throw e;
            });
        }
        return result;
    }
    catch (e) {
        ngZone.runOutsideAngular(() => errorHandler.handleError(e));
        // rethrow as the exception handler might not do it
        throw e;
    }
}
export function optionsReducer(dst, objs) {
    if (Array.isArray(objs)) {
        return objs.reduce(optionsReducer, dst);
    }
    return { ...dst, ...objs };
}
/**
 * A reference to an Angular application running on a page.
 *
 * @usageNotes
 * {@a is-stable-examples}
 * ### isStable examples and caveats
 *
 * Note two important points about `isStable`, demonstrated in the examples below:
 * - the application will never be stable if you start any kind
 * of recurrent asynchronous task when the application starts
 * (for example for a polling process, started with a `setInterval`, a `setTimeout`
 * or using RxJS operators like `interval`);
 * - the `isStable` Observable runs outside of the Angular zone.
 *
 * Let's imagine that you start a recurrent task
 * (here incrementing a counter, using RxJS `interval`),
 * and at the same time subscribe to `isStable`.
 *
 * ```
 * constructor(appRef: ApplicationRef) {
 *   appRef.isStable.pipe(
 *      filter(stable => stable)
 *   ).subscribe(() => console.log('App is stable now');
 *   interval(1000).subscribe(counter => console.log(counter));
 * }
 * ```
 * In this example, `isStable` will never emit `true`,
 * and the trace "App is stable now" will never get logged.
 *
 * If you want to execute something when the app is stable,
 * you have to wait for the application to be stable
 * before starting your polling process.
 *
 * ```
 * constructor(appRef: ApplicationRef) {
 *   appRef.isStable.pipe(
 *     first(stable => stable),
 *     tap(stable => console.log('App is stable now')),
 *     switchMap(() => interval(1000))
 *   ).subscribe(counter => console.log(counter));
 * }
 * ```
 * In this example, the trace "App is stable now" will be logged
 * and then the counter starts incrementing every second.
 *
 * Note also that this Observable runs outside of the Angular zone,
 * which means that the code in the subscription
 * to this Observable will not trigger the change detection.
 *
 * Let's imagine that instead of logging the counter value,
 * you update a field of your component
 * and display it in its template.
 *
 * ```
 * constructor(appRef: ApplicationRef) {
 *   appRef.isStable.pipe(
 *     first(stable => stable),
 *     switchMap(() => interval(1000))
 *   ).subscribe(counter => this.value = counter);
 * }
 * ```
 * As the `isStable` Observable runs outside the zone,
 * the `value` field will be updated properly,
 * but the template will not be refreshed!
 *
 * You'll have to manually trigger the change detection to update the template.
 *
 * ```
 * constructor(appRef: ApplicationRef, cd: ChangeDetectorRef) {
 *   appRef.isStable.pipe(
 *     first(stable => stable),
 *     switchMap(() => interval(1000))
 *   ).subscribe(counter => {
 *     this.value = counter;
 *     cd.detectChanges();
 *   });
 * }
 * ```
 *
 * Or make the subscription callback run inside the zone.
 *
 * ```
 * constructor(appRef: ApplicationRef, zone: NgZone) {
 *   appRef.isStable.pipe(
 *     first(stable => stable),
 *     switchMap(() => interval(1000))
 *   ).subscribe(counter => zone.run(() => this.value = counter));
 * }
 * ```
 *
 * @publicApi
 */
export class ApplicationRef {
    constructor() {
        /** @internal */
        this._bootstrapListeners = [];
        /** @internal */
        this._runningTick = false;
        this._destroyed = false;
        this._destroyListeners = [];
        /** @internal */
        this._views = [];
        this.internalErrorHandler = inject(INTERNAL_APPLICATION_ERROR_HANDLER);
        this.afterRenderEffectManager = inject(AfterRenderEventManager);
        this.zonelessEnabled = inject(ZONELESS_ENABLED);
        // Needed for ComponentFixture temporarily during migration of autoDetect behavior
        // Eventually the hostView of the fixture should just attach to ApplicationRef.
        this.externalTestViews = new Set();
        this.beforeRender = new Subject();
        /** @internal */
        this.afterTick = new Subject();
        /**
         * Get a list of component types registered to this application.
         * This list is populated even before the component is created.
         */
        this.componentTypes = [];
        /**
         * Get a list of components registered to this application.
         */
        this.components = [];
        /**
         * Returns an Observable that indicates when the application is stable or unstable.
         */
        this.isStable = inject(PendingTasks).hasPendingTasks.pipe(map((pending) => !pending));
        this._injector = inject(EnvironmentInjector);
    }
    /** @internal */
    get allViews() {
        return [...this.externalTestViews.keys(), ...this._views];
    }
    /**
     * Indicates whether this instance was destroyed.
     */
    get destroyed() {
        return this._destroyed;
    }
    /**
     * @returns A promise that resolves when the application becomes stable
     */
    whenStable() {
        let subscription;
        return new Promise((resolve) => {
            subscription = this.isStable.subscribe({
                next: (stable) => {
                    if (stable) {
                        resolve();
                    }
                },
            });
        }).finally(() => {
            subscription.unsubscribe();
        });
    }
    /**
     * The `EnvironmentInjector` used to create this application.
     */
    get injector() {
        return this._injector;
    }
    /**
     * Bootstrap a component onto the element identified by its selector or, optionally, to a
     * specified element.
     *
     * @usageNotes
     * ### Bootstrap process
     *
     * When bootstrapping a component, Angular mounts it onto a target DOM element
     * and kicks off automatic change detection. The target DOM element can be
     * provided using the `rootSelectorOrNode` argument.
     *
     * If the target DOM element is not provided, Angular tries to find one on a page
     * using the `selector` of the component that is being bootstrapped
     * (first matched element is used).
     *
     * ### Example
     *
     * Generally, we define the component to bootstrap in the `bootstrap` array of `NgModule`,
     * but it requires us to know the component while writing the application code.
     *
     * Imagine a situation where we have to wait for an API call to decide about the component to
     * bootstrap. We can use the `ngDoBootstrap` hook of the `NgModule` and call this method to
     * dynamically bootstrap a component.
     *
     * {@example core/ts/platform/platform.ts region='componentSelector'}
     *
     * Optionally, a component can be mounted onto a DOM element that does not match the
     * selector of the bootstrapped component.
     *
     * In the following example, we are providing a CSS selector to match the target element.
     *
     * {@example core/ts/platform/platform.ts region='cssSelector'}
     *
     * While in this example, we are providing reference to a DOM node.
     *
     * {@example core/ts/platform/platform.ts region='domNode'}
     */
    bootstrap(componentOrFactory, rootSelectorOrNode) {
        (typeof ngDevMode === 'undefined' || ngDevMode) && this.warnIfDestroyed();
        const isComponentFactory = componentOrFactory instanceof ComponentFactory;
        const initStatus = this._injector.get(ApplicationInitStatus);
        if (!initStatus.done) {
            const standalone = !isComponentFactory && isStandalone(componentOrFactory);
            const errorMessage = (typeof ngDevMode === 'undefined' || ngDevMode) &&
                'Cannot bootstrap as there are still asynchronous initializers running.' +
                    (standalone
                        ? ''
                        : ' Bootstrap components in the `ngDoBootstrap` method of the root module.');
            throw new RuntimeError(405 /* RuntimeErrorCode.ASYNC_INITIALIZERS_STILL_RUNNING */, errorMessage);
        }
        let componentFactory;
        if (isComponentFactory) {
            componentFactory = componentOrFactory;
        }
        else {
            const resolver = this._injector.get(ComponentFactoryResolver);
            componentFactory = resolver.resolveComponentFactory(componentOrFactory);
        }
        this.componentTypes.push(componentFactory.componentType);
        // Create a factory associated with the current module if it's not bound to some other
        const ngModule = isBoundToModule(componentFactory)
            ? undefined
            : this._injector.get(NgModuleRef);
        const selectorOrNode = rootSelectorOrNode || componentFactory.selector;
        const compRef = componentFactory.create(Injector.NULL, [], selectorOrNode, ngModule);
        const nativeElement = compRef.location.nativeElement;
        const testability = compRef.injector.get(TESTABILITY, null);
        testability?.registerApplication(nativeElement);
        compRef.onDestroy(() => {
            this.detachView(compRef.hostView);
            remove(this.components, compRef);
            testability?.unregisterApplication(nativeElement);
        });
        this._loadComponent(compRef);
        if (typeof ngDevMode === 'undefined' || ngDevMode) {
            const _console = this._injector.get(Console);
            _console.log(`Angular is running in development mode.`);
        }
        return compRef;
    }
    /**
     * Invoke this method to explicitly process change detection and its side-effects.
     *
     * In development mode, `tick()` also performs a second change detection cycle to ensure that no
     * further changes are detected. If additional changes are picked up during this second cycle,
     * bindings in the app have side-effects that cannot be resolved in a single change detection
     * pass.
     * In this case, Angular throws an error, since an Angular application can only have one change
     * detection pass during which all change detection must complete.
     */
    tick() {
        this._tick(true);
    }
    /** @internal */
    _tick(refreshViews) {
        (typeof ngDevMode === 'undefined' || ngDevMode) && this.warnIfDestroyed();
        if (this._runningTick) {
            throw new RuntimeError(101 /* RuntimeErrorCode.RECURSIVE_APPLICATION_REF_TICK */, ngDevMode && 'ApplicationRef.tick is called recursively');
        }
        const prevConsumer = setActiveConsumer(null);
        try {
            this._runningTick = true;
            this.detectChangesInAttachedViews(refreshViews);
            if (typeof ngDevMode === 'undefined' || ngDevMode) {
                for (let view of this._views) {
                    view.checkNoChanges();
                }
            }
        }
        catch (e) {
            // Attention: Don't rethrow as it could cancel subscriptions to Observables!
            this.internalErrorHandler(e);
        }
        finally {
            this._runningTick = false;
            setActiveConsumer(prevConsumer);
            this.afterTick.next();
        }
    }
    detectChangesInAttachedViews(refreshViews) {
        let rendererFactory = null;
        if (!this._injector.destroyed) {
            rendererFactory = this._injector.get(RendererFactory2, null, { optional: true });
        }
        let runs = 0;
        const afterRenderEffectManager = this.afterRenderEffectManager;
        while (runs < MAXIMUM_REFRESH_RERUNS) {
            const isFirstPass = runs === 0;
            // Some notifications to run a `tick` will only trigger render hooks. so we skip refreshing views the first time through.
            // After the we execute render hooks in the first pass, we loop while views are marked dirty and should refresh them.
            if (refreshViews || !isFirstPass) {
                this.beforeRender.next(isFirstPass);
                for (let { _lView, notifyErrorHandler } of this._views) {
                    detectChangesInViewIfRequired(_lView, notifyErrorHandler, isFirstPass, this.zonelessEnabled);
                }
            }
            else {
                // If we skipped refreshing views above, there might still be unflushed animations
                // because we never called `detectChangesInternal` on the views.
                rendererFactory?.begin?.();
                rendererFactory?.end?.();
            }
            runs++;
            afterRenderEffectManager.executeInternalCallbacks();
            // If we have a newly dirty view after running internal callbacks, recheck the views again
            // before running user-provided callbacks
            if (this.allViews.some(({ _lView }) => requiresRefreshOrTraversal(_lView))) {
                continue;
            }
            afterRenderEffectManager.execute();
            // If after running all afterRender callbacks we have no more views that need to be refreshed,
            // we can break out of the loop
            if (!this.allViews.some(({ _lView }) => requiresRefreshOrTraversal(_lView))) {
                break;
            }
        }
        if ((typeof ngDevMode === 'undefined' || ngDevMode) && runs >= MAXIMUM_REFRESH_RERUNS) {
            throw new RuntimeError(103 /* RuntimeErrorCode.INFINITE_CHANGE_DETECTION */, ngDevMode &&
                'Infinite change detection while refreshing application views. ' +
                    'Ensure views are not calling `markForCheck` on every template execution or ' +
                    'that afterRender hooks always mark views for check.');
        }
    }
    /**
     * Attaches a view so that it will be dirty checked.
     * The view will be automatically detached when it is destroyed.
     * This will throw if the view is already attached to a ViewContainer.
     */
    attachView(viewRef) {
        (typeof ngDevMode === 'undefined' || ngDevMode) && this.warnIfDestroyed();
        const view = viewRef;
        this._views.push(view);
        view.attachToAppRef(this);
    }
    /**
     * Detaches a view from dirty checking again.
     */
    detachView(viewRef) {
        (typeof ngDevMode === 'undefined' || ngDevMode) && this.warnIfDestroyed();
        const view = viewRef;
        remove(this._views, view);
        view.detachFromAppRef();
    }
    _loadComponent(componentRef) {
        this.attachView(componentRef.hostView);
        this.tick();
        this.components.push(componentRef);
        // Get the listeners lazily to prevent DI cycles.
        const listeners = this._injector.get(APP_BOOTSTRAP_LISTENER, []);
        if (ngDevMode && !Array.isArray(listeners)) {
            throw new RuntimeError(-209 /* RuntimeErrorCode.INVALID_MULTI_PROVIDER */, 'Unexpected type of the `APP_BOOTSTRAP_LISTENER` token value ' +
                `(expected an array, but got ${typeof listeners}). ` +
                'Please check that the `APP_BOOTSTRAP_LISTENER` token is configured as a ' +
                '`multi: true` provider.');
        }
        [...this._bootstrapListeners, ...listeners].forEach((listener) => listener(componentRef));
    }
    /** @internal */
    ngOnDestroy() {
        if (this._destroyed)
            return;
        try {
            // Call all the lifecycle hooks.
            this._destroyListeners.forEach((listener) => listener());
            // Destroy all registered views.
            this._views.slice().forEach((view) => view.destroy());
        }
        finally {
            // Indicate that this instance is destroyed.
            this._destroyed = true;
            // Release all references.
            this._views = [];
            this._bootstrapListeners = [];
            this._destroyListeners = [];
        }
    }
    /**
     * Registers a listener to be called when an instance is destroyed.
     *
     * @param callback A callback function to add as a listener.
     * @returns A function which unregisters a listener.
     */
    onDestroy(callback) {
        (typeof ngDevMode === 'undefined' || ngDevMode) && this.warnIfDestroyed();
        this._destroyListeners.push(callback);
        return () => remove(this._destroyListeners, callback);
    }
    /**
     * Destroys an Angular application represented by this `ApplicationRef`. Calling this function
     * will destroy the associated environment injectors as well as all the bootstrapped components
     * with their views.
     */
    destroy() {
        if (this._destroyed) {
            throw new RuntimeError(406 /* RuntimeErrorCode.APPLICATION_REF_ALREADY_DESTROYED */, ngDevMode && 'This instance of the `ApplicationRef` has already been destroyed.');
        }
        const injector = this._injector;
        // Check that this injector instance supports destroy operation.
        if (injector.destroy && !injector.destroyed) {
            // Destroying an underlying injector will trigger the `ngOnDestroy` lifecycle
            // hook, which invokes the remaining cleanup actions.
            injector.destroy();
        }
    }
    /**
     * Returns the number of attached views.
     */
    get viewCount() {
        return this._views.length;
    }
    warnIfDestroyed() {
        if ((typeof ngDevMode === 'undefined' || ngDevMode) && this._destroyed) {
            console.warn(formatRuntimeError(406 /* RuntimeErrorCode.APPLICATION_REF_ALREADY_DESTROYED */, 'This instance of the `ApplicationRef` has already been destroyed.'));
        }
    }
    static { this.ɵfac = function ApplicationRef_Factory(__ngFactoryType__) { return new (__ngFactoryType__ || ApplicationRef)(); }; }
    static { this.ɵprov = /*@__PURE__*/ i0.ɵɵdefineInjectable({ token: ApplicationRef, factory: ApplicationRef.ɵfac, providedIn: 'root' }); }
}
(() => { (typeof ngDevMode === "undefined" || ngDevMode) && i0.setClassMetadata(ApplicationRef, [{
        type: Injectable,
        args: [{ providedIn: 'root' }]
    }], null, null); })();
export function remove(list, el) {
    const index = list.indexOf(el);
    if (index > -1) {
        list.splice(index, 1);
    }
}
let whenStableStore;
/**
 * Returns a Promise that resolves when the application becomes stable after this method is called
 * the first time.
 */
export function whenStable(applicationRef) {
    whenStableStore ??= new WeakMap();
    const cachedWhenStable = whenStableStore.get(applicationRef);
    if (cachedWhenStable) {
        return cachedWhenStable;
    }
    const whenStablePromise = applicationRef.isStable
        .pipe(first((isStable) => isStable))
        .toPromise()
        .then(() => void 0);
    whenStableStore.set(applicationRef, whenStablePromise);
    // Be a good citizen and clean the store `onDestroy` even though we are using `WeakMap`.
    applicationRef.onDestroy(() => whenStableStore?.delete(applicationRef));
    return whenStablePromise;
}
export function detectChangesInViewIfRequired(lView, notifyErrorHandler, isFirstPass, zonelessEnabled) {
    // When re-checking, only check views which actually need it.
    if (!isFirstPass && !requiresRefreshOrTraversal(lView)) {
        return;
    }
    const mode = isFirstPass && !zonelessEnabled
        ? // The first pass is always in Global mode, which includes `CheckAlways` views.
            0 /* ChangeDetectionMode.Global */
        : // Only refresh views with the `RefreshView` flag or views is a changed signal
            1 /* ChangeDetectionMode.Targeted */;
    detectChangesInternal(lView, notifyErrorHandler, mode);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwbGljYXRpb25fcmVmLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvYXBwbGljYXRpb24vYXBwbGljYXRpb25fcmVmLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8scUJBQXFCLENBQUM7QUFFN0IsT0FBTyxFQUNMLGlCQUFpQixFQUNqQixpQ0FBaUMsR0FDbEMsTUFBTSxrQ0FBa0MsQ0FBQztBQUMxQyxPQUFPLEVBQWEsT0FBTyxFQUFlLE1BQU0sTUFBTSxDQUFDO0FBQ3ZELE9BQU8sRUFBQyxLQUFLLEVBQUUsR0FBRyxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFFMUMsT0FBTyxFQUFDLGdCQUFnQixFQUFDLE1BQU0sb0RBQW9ELENBQUM7QUFDcEYsT0FBTyxFQUFDLE9BQU8sRUFBQyxNQUFNLFlBQVksQ0FBQztBQUNuQyxPQUFPLEVBQUMsTUFBTSxFQUFDLE1BQU0sT0FBTyxDQUFDO0FBQzdCLE9BQU8sRUFBQyxVQUFVLEVBQUMsTUFBTSxrQkFBa0IsQ0FBQztBQUM1QyxPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDckQsT0FBTyxFQUFDLFFBQVEsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBQ3hDLE9BQU8sRUFBQyxtQkFBbUIsRUFBa0IsTUFBTSxtQkFBbUIsQ0FBQztBQUN2RSxPQUFPLEVBQWUsa0NBQWtDLEVBQUMsTUFBTSxrQkFBa0IsQ0FBQztBQUNsRixPQUFPLEVBQUMsa0JBQWtCLEVBQUUsWUFBWSxFQUFtQixNQUFNLFdBQVcsQ0FBQztBQUU3RSxPQUFPLEVBQUMsZ0JBQWdCLEVBQWUsTUFBTSw2QkFBNkIsQ0FBQztBQUMzRSxPQUFPLEVBQUMsd0JBQXdCLEVBQUMsTUFBTSxzQ0FBc0MsQ0FBQztBQUM5RSxPQUFPLEVBQUMsV0FBVyxFQUFDLE1BQU0sNkJBQTZCLENBQUM7QUFFeEQsT0FBTyxF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S0FBSyxFQUFFLGtCQUFrQixFQUFFLElBQUksQ0FBQyxDQUFDO0FBQ3pELENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0ICcuLi91dGlsL25nX2ppdF9tb2RlJztcblxuaW1wb3J0IHtcbiAgc2V0QWN0aXZlQ29uc3VtZXIsXG4gIHNldFRocm93SW52YWxpZFdyaXRlVG9TaWduYWxFcnJvcixcbn0gZnJvbSAnQGFuZ3VsYXIvY29yZS9wcmltaXRpdmVzL3NpZ25hbHMnO1xuaW1wb3J0IHtPYnNlcnZhYmxlLCBTdWJqZWN0LCBTdWJzY3JpcHRpb259IGZyb20gJ3J4anMnO1xuaW1wb3J0IHtmaXJzdCwgbWFwfSBmcm9tICdyeGpzL29wZXJhdG9ycyc7XG5cbmltcG9ydCB7Wk9ORUxFU1NfRU5BQkxFRH0gZnJvbSAnLi4vY2hhbmdlX2RldGVjdGlvbi9zY2hlZHVsaW5nL3pvbmVsZXNzX3NjaGVkdWxpbmcnO1xuaW1wb3J0IHtDb25zb2xlfSBmcm9tICcuLi9jb25zb2xlJztcbmltcG9ydCB7aW5qZWN0fSBmcm9tICcuLi9kaSc7XG5pbXBvcnQge0luamVjdGFibGV9IGZyb20gJy4uL2RpL2luamVjdGFibGUnO1xuaW1wb3J0IHtJbmplY3Rpb25Ub2tlbn0gZnJvbSAnLi4vZGkvaW5qZWN0aW9uX3Rva2VuJztcbmltcG9ydCB7SW5qZWN0b3J9IGZyb20gJy4uL2RpL2luamVjdG9yJztcbmltcG9ydCB7RW52aXJvbm1lbnRJbmplY3RvciwgdHlwZSBSM0luamVjdG9yfSBmcm9tICcuLi9kaS9yM19pbmplY3Rvcic7XG5pbXBvcnQge0Vycm9ySGFuZGxlciwgSU5URVJOQUxfQVBQTElDQVRJT05fRVJST1JfSEFORExFUn0gZnJvbSAnLi4vZXJyb3JfaGFuZGxlcic7XG5pbXBvcnQge2Zvcm1hdFJ1bnRpbWVFcnJvciwgUnVudGltZUVycm9yLCBSdW50aW1lRXJyb3JDb2RlfSBmcm9tICcuLi9lcnJvcnMnO1xuaW1wb3J0IHtUeXBlfSBmcm9tICcuLi9pbnRlcmZhY2UvdHlwZSc7XG5pbXBvcnQge0NvbXBvbmVudEZhY3RvcnksIENvbXBvbmVudFJlZn0gZnJvbSAnLi4vbGlua2VyL2NvbXBvbmVudF9mYWN0b3J5JztcbmltcG9ydCB7Q29tcG9uZW50RmFjdG9yeVJlc29sdmVyfSBmcm9tICcuLi9saW5rZXIvY29tcG9uZW50X2ZhY3RvcnlfcmVzb2x2ZXInO1xuaW1wb3J0IHtOZ01vZHVsZVJlZn0gZnJvbSAnLi4vbGlua2VyL25nX21vZHVsZV9mYWN0b3J5JztcbmltcG9ydCB7Vmlld1JlZn0gZnJvbSAnLi4vbGlua2VyL3ZpZXdfcmVmJztcbmltcG9ydCB7UGVuZGluZ1Rhc2tzfSBmcm9tICcuLi9wZW5kaW5nX3Rhc2tzJztcbmltcG9ydCB7UmVuZGVyZXJGYWN0b3J5Mn0gZnJvbSAnLi4vcmVuZGVyL2FwaSc7XG5pbXBvcnQge0FmdGVyUmVuZGVyRXZlbnRNYW5hZ2VyfSBmcm9tICcuLi9yZW5kZXIzL2FmdGVyX3JlbmRlcl9ob29rcyc7XG5pbXBvcnQge0NvbXBvbmVudEZhY3RvcnkgYXMgUjNDb21wb25lbnRGYWN0b3J5fSBmcm9tICcuLi9yZW5kZXIzL2NvbXBvbmVudF9yZWYnO1xuaW1wb3J0IHtpc1N0YW5kYWxvbmV9IGZyb20gJy4uL3JlbmRlcjMvZGVmaW5pdGlvbic7XG5pbXBvcnQge0NoYW5nZURldGVjdGlvbk1vZGUsIGRldGVjdENoYW5nZXNJbnRlcm5hbH0gZnJvbSAnLi4vcmVuZGVyMy9pbnN0cnVjdGlvbnMvY2hhbmdlX2RldGVjdGlvbic7XG5pbXBvcnQge0ZMQUdTLCBMVmlldywgTFZpZXdGbGFnc30gZnJvbSAnLi4vcmVuZGVyMy9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHtwdWJsaXNoRGVmYXVsdEdsb2JhbFV0aWxzIGFzIF9wdWJsaXNoRGVmYXVsdEdsb2JhbFV0aWxzfSBmcm9tICcuLi9yZW5kZXIzL3V0aWwvZ2xvYmFsX3V0aWxzJztcbmltcG9ydCB7cmVxdWlyZXNSZWZyZXNoT3JUcmF2ZXJzYWx9IGZyb20gJy4uL3JlbmRlcjMvdXRpbC92aWV3X3V0aWxzJztcbmltcG9ydCB7Vmlld1JlZiBhcyBJbnRlcm5hbFZpZXdSZWZ9IGZyb20gJy4uL3JlbmRlcjMvdmlld19yZWYnO1xuaW1wb3J0IHtURVNUQUJJTElUWX0gZnJvbSAnLi4vdGVzdGFiaWxpdHkvdGVzdGFiaWxpdHknO1xuaW1wb3J0IHtpc1Byb21pc2V9IGZyb20gJy4uL3V0aWwvbGFuZyc7XG5pbXBvcnQge05nWm9uZX0gZnJvbSAnLi4vem9uZS9uZ196b25lJztcblxuaW1wb3J0IHtBcHBsaWNhdGlvbkluaXRTdGF0dXN9IGZyb20gJy4vYXBwbGljYXRpb25faW5pdCc7XG5cbi8qKlxuICogQSBESSB0b2tlbiB0aGF0IHByb3ZpZGVzIGEgc2V0IG9mIGNhbGxiYWNrcyB0b1xuICogYmUgY2FsbGVkIGZvciBldmVyeSBjb21wb25lbnQgdGhhdCBpcyBib290c3RyYXBwZWQuXG4gKlxuICogRWFjaCBjYWxsYmFjayBtdXN0IHRha2UgYSBgQ29tcG9uZW50UmVmYCBpbnN0YW5jZSBhbmQgcmV0dXJuIG5vdGhpbmcuXG4gKlxuICogYChjb21wb25lbnRSZWY6IENvbXBvbmVudFJlZikgPT4gdm9pZGBcbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBjb25zdCBBUFBfQk9PVFNUUkFQX0xJU1RFTkVSID0gbmV3IEluamVjdGlvblRva2VuPFxuICBSZWFkb25seUFycmF5PChjb21wUmVmOiBDb21wb25lbnRSZWY8YW55PikgPT4gdm9pZD5cbj4obmdEZXZNb2RlID8gJ2FwcEJvb3RzdHJhcExpc3RlbmVyJyA6ICcnKTtcblxuZXhwb3J0IGZ1bmN0aW9uIHB1Ymxpc2hEZWZhdWx0R2xvYmFsVXRpbHMoKSB7XG4gIG5nRGV2TW9kZSAmJiBfcHVibGlzaERlZmF1bHRHbG9iYWxVdGlscygpO1xufVxuXG4vKipcbiAqIFNldHMgdGhlIGVycm9yIGZvciBhbiBpbnZhbGlkIHdyaXRlIHRvIGEgc2lnbmFsIHRvIGJlIGFuIEFuZ3VsYXIgYFJ1bnRpbWVFcnJvcmAuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwdWJsaXNoU2lnbmFsQ29uZmlndXJhdGlvbigpOiB2b2lkIHtcbiAgc2V0VGhyb3dJbnZhbGlkV3JpdGVUb1NpZ25hbEVycm9yKCgpID0+IHtcbiAgICB0aHJvdyBuZXcgUnVudGltZUVycm9yKFxuICAgICAgUnVudGltZUVycm9yQ29kZS5TSUdOQUxfV1JJVEVfRlJPTV9JTExFR0FMX0NPTlRFWFQsXG4gICAgICBuZ0Rldk1vZGUgJiZcbiAgICAgICAgJ1dyaXRpbmcgdG8gc2lnbmFscyBpcyBub3QgYWxsb3dlZCBpbiBhIGBjb21wdXRlZGAgb3IgYW4gYGVmZmVjdGAgYnkgZGVmYXVsdC4gJyArXG4gICAgICAgICAgJ1VzZSBgYWxsb3dTaWduYWxXcml0ZXNgIGluIHRoZSBgQ3JlYXRlRWZmZWN0T3B0aW9uc2AgdG8gZW5hYmxlIHRoaXMgaW5zaWRlIGVmZmVjdHMuJyxcbiAgICApO1xuICB9KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzQm91bmRUb01vZHVsZTxDPihjZjogQ29tcG9uZW50RmFjdG9yeTxDPik6IGJvb2xlYW4ge1xuICByZXR1cm4gKGNmIGFzIFIzQ29tcG9uZW50RmFjdG9yeTxDPikuaXNCb3VuZFRvTW9kdWxlO1xufVxuXG4vKipcbiAqIEEgdG9rZW4gZm9yIHRoaXJkLXBhcnR5IGNvbXBvbmVudHMgdGhhdCBjYW4gcmVnaXN0ZXIgdGhlbXNlbHZlcyB3aXRoIE5nUHJvYmUuXG4gKlxuICogQGRlcHJlY2F0ZWRcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGNsYXNzIE5nUHJvYmVUb2tlbiB7XG4gIGNvbnN0cnVjdG9yKFxuICAgIHB1YmxpYyBuYW1lOiBzdHJpbmcsXG4gICAgcHVibGljIHRva2VuOiBhbnksXG4gICkge31cbn1cblxuLyoqXG4gKiBQcm92aWRlcyBhZGRpdGlvbmFsIG9wdGlvbnMgdG8gdGhlIGJvb3RzdHJhcHBpbmcgcHJvY2Vzcy5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgQm9vdHN0cmFwT3B0aW9ucyB7XG4gIC8qKlxuICAgKiBPcHRpb25hbGx5IHNwZWNpZnkgd2hpY2ggYE5nWm9uZWAgc2hvdWxkIGJlIHVzZWQgd2hlbiBub3QgY29uZmlndXJlZCBpbiB0aGUgcHJvdmlkZXJzLlxuICAgKlxuICAgKiAtIFByb3ZpZGUgeW91ciBvd24gYE5nWm9uZWAgaW5zdGFuY2UuXG4gICAqIC0gYHpvbmUuanNgIC0gVXNlIGRlZmF1bHQgYE5nWm9uZWAgd2hpY2ggcmVxdWlyZXMgYFpvbmUuanNgLlxuICAgKiAtIGBub29wYCAtIFVzZSBgTm9vcE5nWm9uZWAgd2hpY2ggZG9lcyBub3RoaW5nLlxuICAgKi9cbiAgbmdab25lPzogTmdab25lIHwgJ3pvbmUuanMnIHwgJ25vb3AnO1xuXG4gIC8qKlxuICAgKiBPcHRpb25hbGx5IHNwZWNpZnkgY29hbGVzY2luZyBldmVudCBjaGFuZ2UgZGV0ZWN0aW9ucyBvciBub3QuXG4gICAqIENvbnNpZGVyIHRoZSBmb2xsb3dpbmcgY2FzZS5cbiAgICpcbiAgICogYGBgXG4gICAqIDxkaXYgKGNsaWNrKT1cImRvU29tZXRoaW5nKClcIj5cbiAgICogICA8YnV0dG9uIChjbGljayk9XCJkb1NvbWV0aGluZ0Vsc2UoKVwiPjwvYnV0dG9uPlxuICAgKiA8L2Rpdj5cbiAgICogYGBgXG4gICAqXG4gICAqIFdoZW4gYnV0dG9uIGlzIGNsaWNrZWQsIGJlY2F1c2Ugb2YgdGhlIGV2ZW50IGJ1YmJsaW5nLCBib3RoXG4gICAqIGV2ZW50IGhhbmRsZXJzIHdpbGwgYmUgY2FsbGVkIGFuZCAyIGNoYW5nZSBkZXRlY3Rpb25zIHdpbGwgYmVcbiAgICogdHJpZ2dlcmVkLiBXZSBjYW4gY29hbGVzY2Ugc3VjaCBraW5kIG9mIGV2ZW50cyB0byBvbmx5IHRyaWdnZXJcbiAgICogY2hhbmdlIGRldGVjdGlvbiBvbmx5IG9uY2UuXG4gICAqXG4gICAqIEJ5IGRlZmF1bHQsIHRoaXMgb3B0aW9uIHdpbGwgYmUgZmFsc2UuIFNvIHRoZSBldmVudHMgd2lsbCBub3QgYmVcbiAgICogY29hbGVzY2VkIGFuZCB0aGUgY2hhbmdlIGRldGVjdGlvbiB3aWxsIGJlIHRyaWdnZXJlZCBtdWx0aXBsZSB0aW1lcy5cbiAgICogQW5kIGlmIHRoaXMgb3B0aW9uIGJlIHNldCB0byB0cnVlLCB0aGUgY2hhbmdlIGRldGVjdGlvbiB3aWxsIGJlXG4gICAqIHRyaWdnZXJlZCBhc3luYyBieSBzY2hlZHVsaW5nIGEgYW5pbWF0aW9uIGZyYW1lLiBTbyBpbiB0aGUgY2FzZSBhYm92ZSxcbiAgICogdGhlIGNoYW5nZSBkZXRlY3Rpb24gd2lsbCBvbmx5IGJlIHRyaWdnZXJlZCBvbmNlLlxuICAgKi9cbiAgbmdab25lRXZlbnRDb2FsZXNjaW5nPzogYm9vbGVhbjtcblxuICAvKipcbiAgICogT3B0aW9uYWxseSBzcGVjaWZ5IGlmIGBOZ1pvbmUjcnVuKClgIG1ldGhvZCBpbnZvY2F0aW9ucyBzaG91bGQgYmUgY29hbGVzY2VkXG4gICAqIGludG8gYSBzaW5nbGUgY2hhbmdlIGRldGVjdGlvbi5cbiAgICpcbiAgICogQ29uc2lkZXIgdGhlIGZvbGxvd2luZyBjYXNlLlxuICAgKiBgYGBcbiAgICogZm9yIChsZXQgaSA9IDA7IGkgPCAxMDsgaSArKykge1xuICAgKiAgIG5nWm9uZS5ydW4oKCkgPT4ge1xuICAgKiAgICAgLy8gZG8gc29tZXRoaW5nXG4gICAqICAgfSk7XG4gICAqIH1cbiAgICogYGBgXG4gICAqXG4gICAqIFRoaXMgY2FzZSB0cmlnZ2VycyB0aGUgY2hhbmdlIGRldGVjdGlvbiBtdWx0aXBsZSB0aW1lcy5cbiAgICogV2l0aCBuZ1pvbmVSdW5Db2FsZXNjaW5nIG9wdGlvbnMsIGFsbCBjaGFuZ2UgZGV0ZWN0aW9ucyBpbiBhbiBldmVudCBsb29wIHRyaWdnZXIgb25seSBvbmNlLlxuICAgKiBJbiBhZGRpdGlvbiwgdGhlIGNoYW5nZSBkZXRlY3Rpb24gZXhlY3V0ZXMgaW4gcmVxdWVzdEFuaW1hdGlvbi5cbiAgICpcbiAgICovXG4gIG5nWm9uZVJ1bkNvYWxlc2Npbmc/OiBib29sZWFuO1xuXG4gIC8qKlxuICAgKiBXaGVuIGZhbHNlLCBjaGFuZ2UgZGV0ZWN0aW9uIGlzIHNjaGVkdWxlZCB3aGVuIEFuZ3VsYXIgcmVjZWl2ZXNcbiAgICogYSBjbGVhciBpbmRpY2F0aW9uIHRoYXQgdGVtcGxhdGVzIG5lZWQgdG8gYmUgcmVmcmVzaGVkLiBUaGlzIGluY2x1ZGVzOlxuICAgKlxuICAgKiAtIGNhbGxpbmcgYENoYW5nZURldGVjdG9yUmVmLm1hcmtGb3JDaGVja2BcbiAgICogLSBjYWxsaW5nIGBDb21wb25lbnRSZWYuc2V0SW5wdXRgXG4gICAqIC0gdXBkYXRpbmcgYSBzaWduYWwgdGhhdCBpcyByZWFkIGluIGEgdGVtcGxhdGVcbiAgICogLSBhdHRhY2hpbmcgYSB2aWV3IHRoYXQgaXMgbWFya2VkIGRpcnR5XG4gICAqIC0gcmVtb3ZpbmcgYSB2aWV3XG4gICAqIC0gcmVnaXN0ZXJpbmcgYSByZW5kZXIgaG9vayAodGVtcGxhdGVzIGFyZSBvbmx5IHJlZnJlc2hlZCBpZiByZW5kZXIgaG9va3MgZG8gb25lIG9mIHRoZSBhYm92ZSlcbiAgICpcbiAgICogQGRlcHJlY2F0ZWQgVGhpcyBvcHRpb24gd2FzIGludHJvZHVjZWQgb3V0IG9mIGNhdXRpb24gYXMgYSB3YXkgZm9yIGRldmVsb3BlcnMgdG8gb3B0IG91dCBvZiB0aGVcbiAgICogICAgbmV3IGJlaGF2aW9yIGluIHYxOCB3aGljaCBzY2hlZHVsZSBjaGFuZ2UgZGV0ZWN0aW9uIGZvciB0aGUgYWJvdmUgZXZlbnRzIHdoZW4gdGhleSBvY2N1clxuICAgKiAgICBvdXRzaWRlIHRoZSBab25lLiBBZnRlciBtb25pdG9yaW5nIHRoZSByZXN1bHRzIHBvc3QtcmVsZWFzZSwgd2UgaGF2ZSBkZXRlcm1pbmVkIHRoYXQgdGhpc1xuICAgKiAgICBmZWF0dXJlIGlzIHdvcmtpbmcgYXMgZGVzaXJlZCBhbmQgZG8gbm90IGJlbGlldmUgaXQgc2hvdWxkIGV2ZXIgYmUgZGlzYWJsZWQgYnkgc2V0dGluZ1xuICAgKiAgICB0aGlzIG9wdGlvbiB0byBgdHJ1ZWAuXG4gICAqL1xuICBpZ25vcmVDaGFuZ2VzT3V0c2lkZVpvbmU/OiBib29sZWFuO1xufVxuXG4vKiogTWF4aW11bSBudW1iZXIgb2YgdGltZXMgQXBwbGljYXRpb25SZWYgd2lsbCByZWZyZXNoIGFsbCBhdHRhY2hlZCB2aWV3cyBpbiBhIHNpbmdsZSB0aWNrLiAqL1xuY29uc3QgTUFYSU1VTV9SRUZSRVNIX1JFUlVOUyA9IDEwO1xuXG5leHBvcnQgZnVuY3Rpb24gX2NhbGxBbmRSZXBvcnRUb0Vycm9ySGFuZGxlcihcbiAgZXJyb3JIYW5kbGVyOiBFcnJvckhhbmRsZXIsXG4gIG5nWm9uZTogTmdab25lLFxuICBjYWxsYmFjazogKCkgPT4gYW55LFxuKTogYW55IHtcbiAgdHJ5IHtcbiAgICBjb25zdCByZXN1bHQgPSBjYWxsYmFjaygpO1xuICAgIGlmIChpc1Byb21pc2UocmVzdWx0KSkge1xuICAgICAgcmV0dXJuIHJlc3VsdC5jYXRjaCgoZTogYW55KSA9PiB7XG4gICAgICAgIG5nWm9uZS5ydW5PdXRzaWRlQW5ndWxhcigoKSA9PiBlcnJvckhhbmRsZXIuaGFuZGxlRXJyb3IoZSkpO1xuICAgICAgICAvLyByZXRocm93IGFzIHRoZSBleGNlcHRpb24gaGFuZGxlciBtaWdodCBub3QgZG8gaXRcbiAgICAgICAgdGhyb3cgZTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHJldHVybiByZXN1bHQ7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICBuZ1pvbmUucnVuT3V0c2lkZUFuZ3VsYXIoKCkgPT4gZXJyb3JIYW5kbGVyLmhhbmRsZUVycm9yKGUpKTtcbiAgICAvLyByZXRocm93IGFzIHRoZSBleGNlcHRpb24gaGFuZGxlciBtaWdodCBub3QgZG8gaXRcbiAgICB0aHJvdyBlO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBvcHRpb25zUmVkdWNlcjxUIGV4dGVuZHMgT2JqZWN0Pihkc3Q6IFQsIG9ianM6IFQgfCBUW10pOiBUIHtcbiAgaWYgKEFycmF5LmlzQXJyYXkob2JqcykpIHtcbiAgICByZXR1cm4gb2Jqcy5yZWR1Y2Uob3B0aW9uc1JlZHVjZXIsIGRzdCk7XG4gIH1cbiAgcmV0dXJuIHsuLi5kc3QsIC4uLm9ianN9O1xufVxuXG4vKipcbiAqIEEgcmVmZXJlbmNlIHRvIGFuIEFuZ3VsYXIgYXBwbGljYXRpb24gcnVubmluZyBvbiBhIHBhZ2UuXG4gKlxuICogQHVzYWdlTm90ZXNcbiAqIHtAYSBpcy1zdGFibGUtZXhhbXBsZXN9XG4gKiAjIyMgaXNTdGFibGUgZXhhbXBsZXMgYW5kIGNhdmVhdHNcbiAqXG4gKiBOb3RlIHR3byBpbXBvcnRhbnQgcG9pbnRzIGFib3V0IGBpc1N0YWJsZWAsIGRlbW9uc3RyYXRlZCBpbiB0aGUgZXhhbXBsZXMgYmVsb3c6XG4gKiAtIHRoZSBhcHBsaWNhdGlvbiB3aWxsIG5ldmVyIGJlIHN0YWJsZSBpZiB5b3Ugc3RhcnQgYW55IGtpbmRcbiAqIG9mIHJlY3VycmVudCBhc3luY2hyb25vdXMgdGFzayB3aGVuIHRoZSBhcHBsaWNhdGlvbiBzdGFydHNcbiAqIChmb3IgZXhhbXBsZSBmb3IgYSBwb2xsaW5nIHByb2Nlc3MsIHN0YXJ0ZWQgd2l0aCBhIGBzZXRJbnRlcnZhbGAsIGEgYHNldFRpbWVvdXRgXG4gKiBvciB1c2luZyBSeEpTIG9wZXJhdG9ycyBsaWtlIGBpbnRlcnZhbGApO1xuICogLSB0aGUgYGlzU3RhYmxlYCBPYnNlcnZhYmxlIHJ1bnMgb3V0c2lkZSBvZiB0aGUgQW5ndWxhciB6b25lLlxuICpcbiAqIExldCdzIGltYWdpbmUgdGhhdCB5b3Ugc3RhcnQgYSByZWN1cnJlbnQgdGFza1xuICogKGhlcmUgaW5jcmVtZW50aW5nIGEgY291bnRlciwgdXNpbmcgUnhKUyBgaW50ZXJ2YWxgKSxcbiAqIGFuZCBhdCB0aGUgc2FtZSB0aW1lIHN1YnNjcmliZSB0byBgaXNTdGFibGVgLlxuICpcbiAqIGBgYFxuICogY29uc3RydWN0b3IoYXBwUmVmOiBBcHBsaWNhdGlvblJlZikge1xuICogICBhcHBSZWYuaXNTdGFibGUucGlwZShcbiAqICAgICAgZmlsdGVyKHN0YWJsZSA9PiBzdGFibGUpXG4gKiAgICkuc3Vic2NyaWJlKCgpID0+IGNvbnNvbGUubG9nKCdBcHAgaXMgc3RhYmxlIG5vdycpO1xuICogICBpbnRlcnZhbCgxMDAwKS5zdWJzY3JpYmUoY291bnRlciA9PiBjb25zb2xlLmxvZyhjb3VudGVyKSk7XG4gKiB9XG4gKiBgYGBcbiAqIEluIHRoaXMgZXhhbXBsZSwgYGlzU3RhYmxlYCB3aWxsIG5ldmVyIGVtaXQgYHRydWVgLFxuICogYW5kIHRoZSB0cmFjZSBcIkFwcCBpcyBzdGFibGUgbm93XCIgd2lsbCBuZXZlciBnZXQgbG9nZ2VkLlxuICpcbiAqIElmIHlvdSB3YW50IHRvIGV4ZWN1dGUgc29tZXRoaW5nIHdoZW4gdGhlIGFwcCBpcyBzdGFibGUsXG4gKiB5b3UgaGF2ZSB0byB3YWl0IGZvciB0aGUgYXBwbGljYXRpb24gdG8gYmUgc3RhYmxlXG4gKiBiZWZvcmUgc3RhcnRpbmcgeW91ciBwb2xsaW5nIHByb2Nlc3MuXG4gKlxuICogYGBgXG4gKiBjb25zdHJ1Y3RvcihhcHBSZWY6IEFwcGxpY2F0aW9uUmVmKSB7XG4gKiAgIGFwcFJlZi5pc1N0YWJsZS5waXBlKFxuICogICAgIGZpcnN0KHN0YWJsZSA9PiBzdGFibGUpLFxuICogICAgIHRhcChzdGFibGUgPT4gY29uc29sZS5sb2coJ0FwcCBpcyBzdGFibGUgbm93JykpLFxuICogICAgIHN3aXRjaE1hcCgoKSA9PiBpbnRlcnZhbCgxMDAwKSlcbiAqICAgKS5zdWJzY3JpYmUoY291bnRlciA9PiBjb25zb2xlLmxvZyhjb3VudGVyKSk7XG4gKiB9XG4gKiBgYGBcbiAqIEluIHRoaXMgZXhhbXBsZSwgdGhlIHRyYWNlIFwiQXBwIGlzIHN0YWJsZSBub3dcIiB3aWxsIGJlIGxvZ2dlZFxuICogYW5kIHRoZW4gdGhlIGNvdW50ZXIgc3RhcnRzIGluY3JlbWVudGluZyBldmVyeSBzZWNvbmQuXG4gKlxuICogTm90ZSBhbHNvIHRoYXQgdGhpcyBPYnNlcnZhYmxlIHJ1bnMgb3V0c2lkZSBvZiB0aGUgQW5ndWxhciB6b25lLFxuICogd2hpY2ggbWVhbnMgdGhhdCB0aGUgY29kZSBpbiB0aGUgc3Vic2NyaXB0aW9uXG4gKiB0byB0aGlzIE9ic2VydmFibGUgd2lsbCBub3QgdHJpZ2dlciB0aGUgY2hhbmdlIGRldGVjdGlvbi5cbiAqXG4gKiBMZXQncyBpbWFnaW5lIHRoYXQgaW5zdGVhZCBvZiBsb2dnaW5nIHRoZSBjb3VudGVyIHZhbHVlLFxuICogeW91IHVwZGF0ZSBhIGZpZWxkIG9mIHlvdXIgY29tcG9uZW50XG4gKiBhbmQgZGlzcGxheSBpdCBpbiBpdHMgdGVtcGxhdGUuXG4gKlxuICogYGBgXG4gKiBjb25zdHJ1Y3RvcihhcHBSZWY6IEFwcGxpY2F0aW9uUmVmKSB7XG4gKiAgIGFwcFJlZi5pc1N0YWJsZS5waXBlKFxuICogICAgIGZpcnN0KHN0YWJsZSA9PiBzdGFibGUpLFxuICogICAgIHN3aXRjaE1hcCgoKSA9PiBpbnRlcnZhbCgxMDAwKSlcbiAqICAgKS5zdWJzY3JpYmUoY291bnRlciA9PiB0aGlzLnZhbHVlID0gY291bnRlcik7XG4gKiB9XG4gKiBgYGBcbiAqIEFzIHRoZSBgaXNTdGFibGVgIE9ic2VydmFibGUgcnVucyBvdXRzaWRlIHRoZSB6b25lLFxuICogdGhlIGB2YWx1ZWAgZmllbGQgd2lsbCBiZSB1cGRhdGVkIHByb3Blcmx5LFxuICogYnV0IHRoZSB0ZW1wbGF0ZSB3aWxsIG5vdCBiZSByZWZyZXNoZWQhXG4gKlxuICogWW91J2xsIGhhdmUgdG8gbWFudWFsbHkgdHJpZ2dlciB0aGUgY2hhbmdlIGRldGVjdGlvbiB0byB1cGRhdGUgdGhlIHRlbXBsYXRlLlxuICpcbiAqIGBgYFxuICogY29uc3RydWN0b3IoYXBwUmVmOiBBcHBsaWNhdGlvblJlZiwgY2Q6IENoYW5nZURldGVjdG9yUmVmKSB7XG4gKiAgIGFwcFJlZi5pc1N0YWJsZS5waXBlKFxuICogICAgIGZpcnN0KHN0YWJsZSA9PiBzdGFibGUpLFxuICogICAgIHN3aXRjaE1hcCgoKSA9PiBpbnRlcnZhbCgxMDAwKSlcbiAqICAgKS5zdWJzY3JpYmUoY291bnRlciA9PiB7XG4gKiAgICAgdGhpcy52YWx1ZSA9IGNvdW50ZXI7XG4gKiAgICAgY2QuZGV0ZWN0Q2hhbmdlcygpO1xuICogICB9KTtcbiAqIH1cbiAqIGBgYFxuICpcbiAqIE9yIG1ha2UgdGhlIHN1YnNjcmlwdGlvbiBjYWxsYmFjayBydW4gaW5zaWRlIHRoZSB6b25lLlxuICpcbiAqIGBgYFxuICogY29uc3RydWN0b3IoYXBwUmVmOiBBcHBsaWNhdGlvblJlZiwgem9uZTogTmdab25lKSB7XG4gKiAgIGFwcFJlZi5pc1N0YWJsZS5waXBlKFxuICogICAgIGZpcnN0KHN0YWJsZSA9PiBzdGFibGUpLFxuICogICAgIHN3aXRjaE1hcCgoKSA9PiBpbnRlcnZhbCgxMDAwKSlcbiAqICAgKS5zdWJzY3JpYmUoY291bnRlciA9PiB6b25lLnJ1bigoKSA9PiB0aGlzLnZhbHVlID0gY291bnRlcikpO1xuICogfVxuICogYGBgXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5ASW5qZWN0YWJsZSh7cHJvdmlkZWRJbjogJ3Jvb3QnfSlcbmV4cG9ydCBjbGFzcyBBcHBsaWNhdGlvblJlZiB7XG4gIC8qKiBAaW50ZXJuYWwgKi9cbiAgcHJpdmF0ZSBfYm9vdHN0cmFwTGlzdGVuZXJzOiAoKGNvbXBSZWY6IENvbXBvbmVudFJlZjxhbnk+KSA9PiB2b2lkKVtdID0gW107XG4gIC8qKiBAaW50ZXJuYWwgKi9cbiAgX3J1bm5pbmdUaWNrOiBib29sZWFuID0gZmFsc2U7XG4gIHByaXZhdGUgX2Rlc3Ryb3llZCA9IGZhbHNlO1xuICBwcml2YXRlIF9kZXN0cm95TGlzdGVuZXJzOiBBcnJheTwoKSA9PiB2b2lkPiA9IFtdO1xuICAvKiogQGludGVybmFsICovXG4gIF92aWV3czogSW50ZXJuYWxWaWV3UmVmPHVua25vd24+W10gPSBbXTtcbiAgcHJpdmF0ZSByZWFkb25seSBpbnRlcm5hbEVycm9ySGFuZGxlciA9IGluamVjdChJTlRFUk5BTF9BUFBMSUNBVElPTl9FUlJPUl9IQU5ETEVSKTtcbiAgcHJpdmF0ZSByZWFkb25seSBhZnRlclJlbmRlckVmZmVjdE1hbmFnZXIgPSBpbmplY3QoQWZ0ZXJSZW5kZXJFdmVudE1hbmFnZXIpO1xuICBwcml2YXRlIHJlYWRvbmx5IHpvbmVsZXNzRW5hYmxlZCA9IGluamVjdChaT05FTEVTU19FTkFCTEVEKTtcblxuICAvLyBOZWVkZWQgZm9yIENvbXBvbmVudEZpeHR1cmUgdGVtcG9yYXJpbHkgZHVyaW5nIG1pZ3JhdGlvbiBvZiBhdXRvRGV0ZWN0IGJlaGF2aW9yXG4gIC8vIEV2ZW50dWFsbHkgdGhlIGhvc3RWaWV3IG9mIHRoZSBmaXh0dXJlIHNob3VsZCBqdXN0IGF0dGFjaCB0byBBcHBsaWNhdGlvblJlZi5cbiAgcHJpdmF0ZSBleHRlcm5hbFRlc3RWaWV3czogU2V0PEludGVybmFsVmlld1JlZjx1bmtub3duPj4gPSBuZXcgU2V0KCk7XG4gIHByaXZhdGUgYmVmb3JlUmVuZGVyID0gbmV3IFN1YmplY3Q8Ym9vbGVhbj4oKTtcbiAgLyoqIEBpbnRlcm5hbCAqL1xuICBhZnRlclRpY2sgPSBuZXcgU3ViamVjdDx2b2lkPigpO1xuICAvKiogQGludGVybmFsICovXG4gIGdldCBhbGxWaWV3cygpIHtcbiAgICByZXR1cm4gWy4uLnRoaXMuZXh0ZXJuYWxUZXN0Vmlld3Mua2V5cygpLCAuLi50aGlzLl92aWV3c107XG4gIH1cblxuICAvKipcbiAgICogSW5kaWNhdGVzIHdoZXRoZXIgdGhpcyBpbnN0YW5jZSB3YXMgZGVzdHJveWVkLlxuICAgKi9cbiAgZ2V0IGRlc3Ryb3llZCgpIHtcbiAgICByZXR1cm4gdGhpcy5fZGVzdHJveWVkO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBhIGxpc3Qgb2YgY29tcG9uZW50IHR5cGVzIHJlZ2lzdGVyZWQgdG8gdGhpcyBhcHBsaWNhdGlvbi5cbiAgICogVGhpcyBsaXN0IGlzIHBvcHVsYXRlZCBldmVuIGJlZm9yZSB0aGUgY29tcG9uZW50IGlzIGNyZWF0ZWQuXG4gICAqL1xuICBwdWJsaWMgcmVhZG9ubHkgY29tcG9uZW50VHlwZXM6IFR5cGU8YW55PltdID0gW107XG5cbiAgLyoqXG4gICAqIEdldCBhIGxpc3Qgb2YgY29tcG9uZW50cyByZWdpc3RlcmVkIHRvIHRoaXMgYXBwbGljYXRpb24uXG4gICAqL1xuICBwdWJsaWMgcmVhZG9ubHkgY29tcG9uZW50czogQ29tcG9uZW50UmVmPGFueT5bXSA9IFtdO1xuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGFuIE9ic2VydmFibGUgdGhhdCBpbmRpY2F0ZXMgd2hlbiB0aGUgYXBwbGljYXRpb24gaXMgc3RhYmxlIG9yIHVuc3RhYmxlLlxuICAgKi9cbiAgcHVibGljIHJlYWRvbmx5IGlzU3RhYmxlOiBPYnNlcnZhYmxlPGJvb2xlYW4+ID0gaW5qZWN0KFBlbmRpbmdUYXNrcykuaGFzUGVuZGluZ1Rhc2tzLnBpcGUoXG4gICAgbWFwKChwZW5kaW5nKSA9PiAhcGVuZGluZyksXG4gICk7XG5cbiAgLyoqXG4gICAqIEByZXR1cm5zIEEgcHJvbWlzZSB0aGF0IHJlc29sdmVzIHdoZW4gdGhlIGFwcGxpY2F0aW9uIGJlY29tZXMgc3RhYmxlXG4gICAqL1xuICB3aGVuU3RhYmxlKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGxldCBzdWJzY3JpcHRpb246IFN1YnNjcmlwdGlvbjtcbiAgICByZXR1cm4gbmV3IFByb21pc2U8dm9pZD4oKHJlc29sdmUpID0+IHtcbiAgICAgIHN1YnNjcmlwdGlvbiA9IHRoaXMuaXNTdGFibGUuc3Vic2NyaWJlKHtcbiAgICAgICAgbmV4dDogKHN0YWJsZSkgPT4ge1xuICAgICAgICAgIGlmIChzdGFibGUpIHtcbiAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICB9KTtcbiAgICB9KS5maW5hbGx5KCgpID0+IHtcbiAgICAgIHN1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xuICAgIH0pO1xuICB9XG5cbiAgcHJpdmF0ZSByZWFkb25seSBfaW5qZWN0b3IgPSBpbmplY3QoRW52aXJvbm1lbnRJbmplY3Rvcik7XG4gIC8qKlxuICAgKiBUaGUgYEVudmlyb25tZW50SW5qZWN0b3JgIHVzZWQgdG8gY3JlYXRlIHRoaXMgYXBwbGljYXRpb24uXG4gICAqL1xuICBnZXQgaW5qZWN0b3IoKTogRW52aXJvbm1lbnRJbmplY3RvciB7XG4gICAgcmV0dXJuIHRoaXMuX2luamVjdG9yO1xuICB9XG5cbiAgLyoqXG4gICAqIEJvb3RzdHJhcCBhIGNvbXBvbmVudCBvbnRvIHRoZSBlbGVtZW50IGlkZW50aWZpZWQgYnkgaXRzIHNlbGVjdG9yIG9yLCBvcHRpb25hbGx5LCB0byBhXG4gICAqIHNwZWNpZmllZCBlbGVtZW50LlxuICAgKlxuICAgKiBAdXNhZ2VOb3Rlc1xuICAgKiAjIyMgQm9vdHN0cmFwIHByb2Nlc3NcbiAgICpcbiAgICogV2hlbiBib290c3RyYXBwaW5nIGEgY29tcG9uZW50LCBBbmd1bGFyIG1vdW50cyBpdCBvbnRvIGEgdGFyZ2V0IERPTSBlbGVtZW50XG4gICAqIGFuZCBraWNrcyBvZmYgYXV0b21hdGljIGNoYW5nZSBkZXRlY3Rpb24uIFRoZSB0YXJnZXQgRE9NIGVsZW1lbnQgY2FuIGJlXG4gICAqIHByb3ZpZGVkIHVzaW5nIHRoZSBgcm9vdFNlbGVjdG9yT3JOb2RlYCBhcmd1bWVudC5cbiAgICpcbiAgICogSWYgdGhlIHRhcmdldCBET00gZWxlbWVudCBpcyBub3QgcHJvdmlkZWQsIEFuZ3VsYXIgdHJpZXMgdG8gZmluZCBvbmUgb24gYSBwYWdlXG4gICAqIHVzaW5nIHRoZSBgc2VsZWN0b3JgIG9mIHRoZSBjb21wb25lbnQgdGhhdCBpcyBiZWluZyBib290c3RyYXBwZWRcbiAgICogKGZpcnN0IG1hdGNoZWQgZWxlbWVudCBpcyB1c2VkKS5cbiAgICpcbiAgICogIyMjIEV4YW1wbGVcbiAgICpcbiAgICogR2VuZXJhbGx5LCB3ZSBkZWZpbmUgdGhlIGNvbXBvbmVudCB0byBib290c3RyYXAgaW4gdGhlIGBib290c3RyYXBgIGFycmF5IG9mIGBOZ01vZHVsZWAsXG4gICAqIGJ1dCBpdCByZXF1aXJlcyB1cyB0byBrbm93IHRoZSBjb21wb25lbnQgd2hpbGUgd3JpdGluZyB0aGUgYXBwbGljYXRpb24gY29kZS5cbiAgICpcbiAgICogSW1hZ2luZSBhIHNpdHVhdGlvbiB3aGVyZSB3ZSBoYXZlIHRvIHdhaXQgZm9yIGFuIEFQSSBjYWxsIHRvIGRlY2lkZSBhYm91dCB0aGUgY29tcG9uZW50IHRvXG4gICAqIGJvb3RzdHJhcC4gV2UgY2FuIHVzZSB0aGUgYG5nRG9Cb290c3RyYXBgIGhvb2sgb2YgdGhlIGBOZ01vZHVsZWAgYW5kIGNhbGwgdGhpcyBtZXRob2QgdG9cbiAgICogZHluYW1pY2FsbHkgYm9vdHN0cmFwIGEgY29tcG9uZW50LlxuICAgKlxuICAgKiB7QGV4YW1wbGUgY29yZS90cy9wbGF0Zm9ybS9wbGF0Zm9ybS50cyByZWdpb249J2NvbXBvbmVudFNlbGVjdG9yJ31cbiAgICpcbiAgICogT3B0aW9uYWxseSwgYSBjb21wb25lbnQgY2FuIGJlIG1vdW50ZWQgb250byBhIERPTSBlbGVtZW50IHRoYXQgZG9lcyBub3QgbWF0Y2ggdGhlXG4gICAqIHNlbGVjdG9yIG9mIHRoZSBib290c3RyYXBwZWQgY29tcG9uZW50LlxuICAgKlxuICAgKiBJbiB0aGUgZm9sbG93aW5nIGV4YW1wbGUsIHdlIGFyZSBwcm92aWRpbmcgYSBDU1Mgc2VsZWN0b3IgdG8gbWF0Y2ggdGhlIHRhcmdldCBlbGVtZW50LlxuICAgKlxuICAgKiB7QGV4YW1wbGUgY29yZS90cy9wbGF0Zm9ybS9wbGF0Zm9ybS50cyByZWdpb249J2Nzc1NlbGVjdG9yJ31cbiAgICpcbiAgICogV2hpbGUgaW4gdGhpcyBleGFtcGxlLCB3ZSBhcmUgcHJvdmlkaW5nIHJlZmVyZW5jZSB0byBhIERPTSBub2RlLlxuICAgKlxuICAgKiB7QGV4YW1wbGUgY29yZS90cy9wbGF0Zm9ybS9wbGF0Zm9ybS50cyByZWdpb249J2RvbU5vZGUnfVxuICAgKi9cbiAgYm9vdHN0cmFwPEM+KGNvbXBvbmVudDogVHlwZTxDPiwgcm9vdFNlbGVjdG9yT3JOb2RlPzogc3RyaW5nIHwgYW55KTogQ29tcG9uZW50UmVmPEM+O1xuXG4gIC8qKlxuICAgKiBCb290c3RyYXAgYSBjb21wb25lbnQgb250byB0aGUgZWxlbWVudCBpZGVudGlmaWVkIGJ5IGl0cyBzZWxlY3RvciBvciwgb3B0aW9uYWxseSwgdG8gYVxuICAgKiBzcGVjaWZpZWQgZWxlbWVudC5cbiAgICpcbiAgICogQHVzYWdlTm90ZXNcbiAgICogIyMjIEJvb3RzdHJhcCBwcm9jZXNzXG4gICAqXG4gICAqIFdoZW4gYm9vdHN0cmFwcGluZyBhIGNvbXBvbmVudCwgQW5ndWxhciBtb3VudHMgaXQgb250byBhIHRhcmdldCBET00gZWxlbWVudFxuICAgKiBhbmQga2lja3Mgb2ZmIGF1dG9tYXRpYyBjaGFuZ2UgZGV0ZWN0aW9uLiBUaGUgdGFyZ2V0IERPTSBlbGVtZW50IGNhbiBiZVxuICAgKiBwcm92aWRlZCB1c2luZyB0aGUgYHJvb3RTZWxlY3Rvck9yTm9kZWAgYXJndW1lbnQuXG4gICAqXG4gICAqIElmIHRoZSB0YXJnZXQgRE9NIGVsZW1lbnQgaXMgbm90IHByb3ZpZGVkLCBBbmd1bGFyIHRyaWVzIHRvIGZpbmQgb25lIG9uIGEgcGFnZVxuICAgKiB1c2luZyB0aGUgYHNlbGVjdG9yYCBvZiB0aGUgY29tcG9uZW50IHRoYXQgaXMgYmVpbmcgYm9vdHN0cmFwcGVkXG4gICAqIChmaXJzdCBtYXRjaGVkIGVsZW1lbnQgaXMgdXNlZCkuXG4gICAqXG4gICAqICMjIyBFeGFtcGxlXG4gICAqXG4gICAqIEdlbmVyYWxseSwgd2UgZGVmaW5lIHRoZSBjb21wb25lbnQgdG8gYm9vdHN0cmFwIGluIHRoZSBgYm9vdHN0cmFwYCBhcnJheSBvZiBgTmdNb2R1bGVgLFxuICAgKiBidXQgaXQgcmVxdWlyZXMgdXMgdG8ga25vdyB0aGUgY29tcG9uZW50IHdoaWxlIHdyaXRpbmcgdGhlIGFwcGxpY2F0aW9uIGNvZGUuXG4gICAqXG4gICAqIEltYWdpbmUgYSBzaXR1YXRpb24gd2hlcmUgd2UgaGF2ZSB0byB3YWl0IGZvciBhbiBBUEkgY2FsbCB0byBkZWNpZGUgYWJvdXQgdGhlIGNvbXBvbmVudCB0b1xuICAgKiBib290c3RyYXAuIFdlIGNhbiB1c2UgdGhlIGBuZ0RvQm9vdHN0cmFwYCBob29rIG9mIHRoZSBgTmdNb2R1bGVgIGFuZCBjYWxsIHRoaXMgbWV0aG9kIHRvXG4gICAqIGR5bmFtaWNhbGx5IGJvb3RzdHJhcCBhIGNvbXBvbmVudC5cbiAgICpcbiAgICoge0BleGFtcGxlIGNvcmUvdHMvcGxhdGZvcm0vcGxhdGZvcm0udHMgcmVnaW9uPSdjb21wb25lbnRTZWxlY3Rvcid9XG4gICAqXG4gICAqIE9wdGlvbmFsbHksIGEgY29tcG9uZW50IGNhbiBiZSBtb3VudGVkIG9udG8gYSBET00gZWxlbWVudCB0aGF0IGRvZXMgbm90IG1hdGNoIHRoZVxuICAgKiBzZWxlY3RvciBvZiB0aGUgYm9vdHN0cmFwcGVkIGNvbXBvbmVudC5cbiAgICpcbiAgICogSW4gdGhlIGZvbGxvd2luZyBleGFtcGxlLCB3ZSBhcmUgcHJvdmlkaW5nIGEgQ1NTIHNlbGVjdG9yIHRvIG1hdGNoIHRoZSB0YXJnZXQgZWxlbWVudC5cbiAgICpcbiAgICoge0BleGFtcGxlIGNvcmUvdHMvcGxhdGZvcm0vcGxhdGZvcm0udHMgcmVnaW9uPSdjc3NTZWxlY3Rvcid9XG4gICAqXG4gICAqIFdoaWxlIGluIHRoaXMgZXhhbXBsZSwgd2UgYXJlIHByb3ZpZGluZyByZWZlcmVuY2UgdG8gYSBET00gbm9kZS5cbiAgICpcbiAgICoge0BleGFtcGxlIGNvcmUvdHMvcGxhdGZvcm0vcGxhdGZvcm0udHMgcmVnaW9uPSdkb21Ob2RlJ31cbiAgICpcbiAgICogQGRlcHJlY2F0ZWQgUGFzc2luZyBDb21wb25lbnQgZmFjdG9yaWVzIGFzIHRoZSBgQXBwbGljYXRpb24uYm9vdHN0cmFwYCBmdW5jdGlvbiBhcmd1bWVudCBpc1xuICAgKiAgICAgZGVwcmVjYXRlZC4gUGFzcyBDb21wb25lbnQgVHlwZXMgaW5zdGVhZC5cbiAgICovXG4gIGJvb3RzdHJhcDxDPihcbiAgICBjb21wb25lbnRGYWN0b3J5OiBDb21wb25lbnRGYWN0b3J5PEM+LFxuICAgIHJvb3RTZWxlY3Rvck9yTm9kZT86IHN0cmluZyB8IGFueSxcbiAgKTogQ29tcG9uZW50UmVmPEM+O1xuXG4gIC8qKlxuICAgKiBCb290c3RyYXAgYSBjb21wb25lbnQgb250byB0aGUgZWxlbWVudCBpZGVudGlmaWVkIGJ5IGl0cyBzZWxlY3RvciBvciwgb3B0aW9uYWxseSwgdG8gYVxuICAgKiBzcGVjaWZpZWQgZWxlbWVudC5cbiAgICpcbiAgICogQHVzYWdlTm90ZXNcbiAgICogIyMjIEJvb3RzdHJhcCBwcm9jZXNzXG4gICAqXG4gICAqIFdoZW4gYm9vdHN0cmFwcGluZyBhIGNvbXBvbmVudCwgQW5ndWxhciBtb3VudHMgaXQgb250byBhIHRhcmdldCBET00gZWxlbWVudFxuICAgKiBhbmQga2lja3Mgb2ZmIGF1dG9tYXRpYyBjaGFuZ2UgZGV0ZWN0aW9uLiBUaGUgdGFyZ2V0IERPTSBlbGVtZW50IGNhbiBiZVxuICAgKiBwcm92aWRlZCB1c2luZyB0aGUgYHJvb3RTZWxlY3Rvck9yTm9kZWAgYXJndW1lbnQuXG4gICAqXG4gICAqIElmIHRoZSB0YXJnZXQgRE9NIGVsZW1lbnQgaXMgbm90IHByb3ZpZGVkLCBBbmd1bGFyIHRyaWVzIHRvIGZpbmQgb25lIG9uIGEgcGFnZVxuICAgKiB1c2luZyB0aGUgYHNlbGVjdG9yYCBvZiB0aGUgY29tcG9uZW50IHRoYXQgaXMgYmVpbmcgYm9vdHN0cmFwcGVkXG4gICAqIChmaXJzdCBtYXRjaGVkIGVsZW1lbnQgaXMgdXNlZCkuXG4gICAqXG4gICAqICMjIyBFeGFtcGxlXG4gICAqXG4gICAqIEdlbmVyYWxseSwgd2UgZGVmaW5lIHRoZSBjb21wb25lbnQgdG8gYm9vdHN0cmFwIGluIHRoZSBgYm9vdHN0cmFwYCBhcnJheSBvZiBgTmdNb2R1bGVgLFxuICAgKiBidXQgaXQgcmVxdWlyZXMgdXMgdG8ga25vdyB0aGUgY29tcG9uZW50IHdoaWxlIHdyaXRpbmcgdGhlIGFwcGxpY2F0aW9uIGNvZGUuXG4gICAqXG4gICAqIEltYWdpbmUgYSBzaXR1YXRpb24gd2hlcmUgd2UgaGF2ZSB0byB3YWl0IGZvciBhbiBBUEkgY2FsbCB0byBkZWNpZGUgYWJvdXQgdGhlIGNvbXBvbmVudCB0b1xuICAgKiBib290c3RyYXAuIFdlIGNhbiB1c2UgdGhlIGBuZ0RvQm9vdHN0cmFwYCBob29rIG9mIHRoZSBgTmdNb2R1bGVgIGFuZCBjYWxsIHRoaXMgbWV0aG9kIHRvXG4gICAqIGR5bmFtaWNhbGx5IGJvb3RzdHJhcCBhIGNvbXBvbmVudC5cbiAgICpcbiAgICoge0BleGFtcGxlIGNvcmUvdHMvcGxhdGZvcm0vcGxhdGZvcm0udHMgcmVnaW9uPSdjb21wb25lbnRTZWxlY3Rvcid9XG4gICAqXG4gICAqIE9wdGlvbmFsbHksIGEgY29tcG9uZW50IGNhbiBiZSBtb3VudGVkIG9udG8gYSBET00gZWxlbWVudCB0aGF0IGRvZXMgbm90IG1hdGNoIHRoZVxuICAgKiBzZWxlY3RvciBvZiB0aGUgYm9vdHN0cmFwcGVkIGNvbXBvbmVudC5cbiAgICpcbiAgICogSW4gdGhlIGZvbGxvd2luZyBleGFtcGxlLCB3ZSBhcmUgcHJvdmlkaW5nIGEgQ1NTIHNlbGVjdG9yIHRvIG1hdGNoIHRoZSB0YXJnZXQgZWxlbWVudC5cbiAgICpcbiAgICoge0BleGFtcGxlIGNvcmUvdHMvcGxhdGZvcm0vcGxhdGZvcm0udHMgcmVnaW9uPSdjc3NTZWxlY3Rvcid9XG4gICAqXG4gICAqIFdoaWxlIGluIHRoaXMgZXhhbXBsZSwgd2UgYXJlIHByb3ZpZGluZyByZWZlcmVuY2UgdG8gYSBET00gbm9kZS5cbiAgICpcbiAgICoge0BleGFtcGxlIGNvcmUvdHMvcGxhdGZvcm0vcGxhdGZvcm0udHMgcmVnaW9uPSdkb21Ob2RlJ31cbiAgICovXG4gIGJvb3RzdHJhcDxDPihcbiAgICBjb21wb25lbnRPckZhY3Rvcnk6IENvbXBvbmVudEZhY3Rvcnk8Qz4gfCBUeXBlPEM+LFxuICAgIHJvb3RTZWxlY3Rvck9yTm9kZT86IHN0cmluZyB8IGFueSxcbiAgKTogQ29tcG9uZW50UmVmPEM+IHtcbiAgICAodHlwZW9mIG5nRGV2TW9kZSA9PT0gJ3VuZGVmaW5lZCcgfHwgbmdEZXZNb2RlKSAmJiB0aGlzLndhcm5JZkRlc3Ryb3llZCgpO1xuICAgIGNvbnN0IGlzQ29tcG9uZW50RmFjdG9yeSA9IGNvbXBvbmVudE9yRmFjdG9yeSBpbnN0YW5jZW9mIENvbXBvbmVudEZhY3Rvcnk7XG4gICAgY29uc3QgaW5pdFN0YXR1cyA9IHRoaXMuX2luamVjdG9yLmdldChBcHBsaWNhdGlvbkluaXRTdGF0dXMpO1xuXG4gICAgaWYgKCFpbml0U3RhdHVzLmRvbmUpIHtcbiAgICAgIGNvbnN0IHN0YW5kYWxvbmUgPSAhaXNDb21wb25lbnRGYWN0b3J5ICYmIGlzU3RhbmRhbG9uZShjb21wb25lbnRPckZhY3RvcnkpO1xuICAgICAgY29uc3QgZXJyb3JNZXNzYWdlID1cbiAgICAgICAgKHR5cGVvZiBuZ0Rldk1vZGUgPT09ICd1bmRlZmluZWQnIHx8IG5nRGV2TW9kZSkgJiZcbiAgICAgICAgJ0Nhbm5vdCBib290c3RyYXAgYXMgdGhlcmUgYXJlIHN0aWxsIGFzeW5jaHJvbm91cyBpbml0aWFsaXplcnMgcnVubmluZy4nICtcbiAgICAgICAgICAoc3RhbmRhbG9uZVxuICAgICAgICAgICAgPyAnJ1xuICAgICAgICAgICAgOiAnIEJvb3RzdHJhcCBjb21wb25lbnRzIGluIHRoZSBgbmdEb0Jvb3RzdHJhcGAgbWV0aG9kIG9mIHRoZSByb290IG1vZHVsZS4nKTtcbiAgICAgIHRocm93IG5ldyBSdW50aW1lRXJyb3IoUnVudGltZUVycm9yQ29kZS5BU1lOQ19JTklUSUFMSVpFUlNfU1RJTExfUlVOTklORywgZXJyb3JNZXNzYWdlKTtcbiAgICB9XG5cbiAgICBsZXQgY29tcG9uZW50RmFjdG9yeTogQ29tcG9uZW50RmFjdG9yeTxDPjtcbiAgICBpZiAoaXNDb21wb25lbnRGYWN0b3J5KSB7XG4gICAgICBjb21wb25lbnRGYWN0b3J5ID0gY29tcG9uZW50T3JGYWN0b3J5O1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCByZXNvbHZlciA9IHRoaXMuX2luamVjdG9yLmdldChDb21wb25lbnRGYWN0b3J5UmVzb2x2ZXIpO1xuICAgICAgY29tcG9uZW50RmFjdG9yeSA9IHJlc29sdmVyLnJlc29sdmVDb21wb25lbnRGYWN0b3J5KGNvbXBvbmVudE9yRmFjdG9yeSkhO1xuICAgIH1cbiAgICB0aGlzLmNvbXBvbmVudFR5cGVzLnB1c2goY29tcG9uZW50RmFjdG9yeS5jb21wb25lbnRUeXBlKTtcblxuICAgIC8vIENyZWF0ZSBhIGZhY3RvcnkgYXNzb2NpYXRlZCB3aXRoIHRoZSBjdXJyZW50IG1vZHVsZSBpZiBpdCdzIG5vdCBib3VuZCB0byBzb21lIG90aGVyXG4gICAgY29uc3QgbmdNb2R1bGUgPSBpc0JvdW5kVG9Nb2R1bGUoY29tcG9uZW50RmFjdG9yeSlcbiAgICAgID8gdW5kZWZpbmVkXG4gICAgICA6IHRoaXMuX2luamVjdG9yLmdldChOZ01vZHVsZVJlZik7XG4gICAgY29uc3Qgc2VsZWN0b3JPck5vZGUgPSByb290U2VsZWN0b3JPck5vZGUgfHwgY29tcG9uZW50RmFjdG9yeS5zZWxlY3RvcjtcbiAgICBjb25zdCBjb21wUmVmID0gY29tcG9uZW50RmFjdG9yeS5jcmVhdGUoSW5qZWN0b3IuTlVMTCwgW10sIHNlbGVjdG9yT3JOb2RlLCBuZ01vZHVsZSk7XG4gICAgY29uc3QgbmF0aXZlRWxlbWVudCA9IGNvbXBSZWYubG9jYXRpb24ubmF0aXZlRWxlbWVudDtcbiAgICBjb25zdCB0ZXN0YWJpbGl0eSA9IGNvbXBSZWYuaW5qZWN0b3IuZ2V0KFRFU1RBQklMSVRZLCBudWxsKTtcbiAgICB0ZXN0YWJpbGl0eT8ucmVnaXN0ZXJBcHBsaWNhdGlvbihuYXRpdmVFbGVtZW50KTtcblxuICAgIGNvbXBSZWYub25EZXN0cm95KCgpID0+IHtcbiAgICAgIHRoaXMuZGV0YWNoVmlldyhjb21wUmVmLmhvc3RWaWV3KTtcbiAgICAgIHJlbW92ZSh0aGlzLmNvbXBvbmVudHMsIGNvbXBSZWYpO1xuICAgICAgdGVzdGFiaWxpdHk/LnVucmVnaXN0ZXJBcHBsaWNhdGlvbihuYXRpdmVFbGVtZW50KTtcbiAgICB9KTtcblxuICAgIHRoaXMuX2xvYWRDb21wb25lbnQoY29tcFJlZik7XG4gICAgaWYgKHR5cGVvZiBuZ0Rldk1vZGUgPT09ICd1bmRlZmluZWQnIHx8IG5nRGV2TW9kZSkge1xuICAgICAgY29uc3QgX2NvbnNvbGUgPSB0aGlzLl9pbmplY3Rvci5nZXQoQ29uc29sZSk7XG4gICAgICBfY29uc29sZS5sb2coYEFuZ3VsYXIgaXMgcnVubmluZyBpbiBkZXZlbG9wbWVudCBtb2RlLmApO1xuICAgIH1cbiAgICByZXR1cm4gY29tcFJlZjtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbnZva2UgdGhpcyBtZXRob2QgdG8gZXhwbGljaXRseSBwcm9jZXNzIGNoYW5nZSBkZXRlY3Rpb24gYW5kIGl0cyBzaWRlLWVmZmVjdHMuXG4gICAqXG4gICAqIEluIGRldmVsb3BtZW50IG1vZGUsIGB0aWNrKClgIGFsc28gcGVyZm9ybXMgYSBzZWNvbmQgY2hhbmdlIGRldGVjdGlvbiBjeWNsZSB0byBlbnN1cmUgdGhhdCBub1xuICAgKiBmdXJ0aGVyIGNoYW5nZXMgYXJlIGRldGVjdGVkLiBJZiBhZGRpdGlvbmFsIGNoYW5nZXMgYXJlIHBpY2tlZCB1cCBkdXJpbmcgdGhpcyBzZWNvbmQgY3ljbGUsXG4gICAqIGJpbmRpbmdzIGluIHRoZSBhcHAgaGF2ZSBzaWRlLWVmZmVjdHMgdGhhdCBjYW5ub3QgYmUgcmVzb2x2ZWQgaW4gYSBzaW5nbGUgY2hhbmdlIGRldGVjdGlvblxuICAgKiBwYXNzLlxuICAgKiBJbiB0aGlzIGNhc2UsIEFuZ3VsYXIgdGhyb3dzIGFuIGVycm9yLCBzaW5jZSBhbiBBbmd1bGFyIGFwcGxpY2F0aW9uIGNhbiBvbmx5IGhhdmUgb25lIGNoYW5nZVxuICAgKiBkZXRlY3Rpb24gcGFzcyBkdXJpbmcgd2hpY2ggYWxsIGNoYW5nZSBkZXRlY3Rpb24gbXVzdCBjb21wbGV0ZS5cbiAgICovXG4gIHRpY2soKTogdm9pZCB7XG4gICAgdGhpcy5fdGljayh0cnVlKTtcbiAgfVxuXG4gIC8qKiBAaW50ZXJuYWwgKi9cbiAgX3RpY2socmVmcmVzaFZpZXdzOiBib29sZWFuKTogdm9pZCB7XG4gICAgKHR5cGVvZiBuZ0Rldk1vZGUgPT09ICd1bmRlZmluZWQnIHx8IG5nRGV2TW9kZSkgJiYgdGhpcy53YXJuSWZEZXN0cm95ZWQoKTtcbiAgICBpZiAodGhpcy5fcnVubmluZ1RpY2spIHtcbiAgICAgIHRocm93IG5ldyBSdW50aW1lRXJyb3IoXG4gICAgICAgIFJ1bnRpbWVFcnJvckNvZGUuUkVDVVJTSVZFX0FQUExJQ0FUSU9OX1JFRl9USUNLLFxuICAgICAgICBuZ0Rldk1vZGUgJiYgJ0FwcGxpY2F0aW9uUmVmLnRpY2sgaXMgY2FsbGVkIHJlY3Vyc2l2ZWx5JyxcbiAgICAgICk7XG4gICAgfVxuXG4gICAgY29uc3QgcHJldkNvbnN1bWVyID0gc2V0QWN0aXZlQ29uc3VtZXIobnVsbCk7XG4gICAgdHJ5IHtcbiAgICAgIHRoaXMuX3J1bm5pbmdUaWNrID0gdHJ1ZTtcblxuICAgICAgdGhpcy5kZXRlY3RDaGFuZ2VzSW5BdHRhY2hlZFZpZXdzKHJlZnJlc2hWaWV3cyk7XG5cbiAgICAgIGlmICh0eXBlb2YgbmdEZXZNb2RlID09PSAndW5kZWZpbmVkJyB8fCBuZ0Rldk1vZGUpIHtcbiAgICAgICAgZm9yIChsZXQgdmlldyBvZiB0aGlzLl92aWV3cykge1xuICAgICAgICAgIHZpZXcuY2hlY2tOb0NoYW5nZXMoKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIC8vIEF0dGVudGlvbjogRG9uJ3QgcmV0aHJvdyBhcyBpdCBjb3VsZCBjYW5jZWwgc3Vic2NyaXB0aW9ucyB0byBPYnNlcnZhYmxlcyFcbiAgICAgIHRoaXMuaW50ZXJuYWxFcnJvckhhbmRsZXIoZSk7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIHRoaXMuX3J1bm5pbmdUaWNrID0gZmFsc2U7XG4gICAgICBzZXRBY3RpdmVDb25zdW1lcihwcmV2Q29uc3VtZXIpO1xuICAgICAgdGhpcy5hZnRlclRpY2submV4dCgpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgZGV0ZWN0Q2hhbmdlc0luQXR0YWNoZWRWaWV3cyhyZWZyZXNoVmlld3M6IGJvb2xlYW4pIHtcbiAgICBsZXQgcmVuZGVyZXJGYWN0b3J5OiBSZW5kZXJlckZhY3RvcnkyIHwgbnVsbCA9IG51bGw7XG4gICAgaWYgKCEodGhpcy5faW5qZWN0b3IgYXMgUjNJbmplY3RvcikuZGVzdHJveWVkKSB7XG4gICAgICByZW5kZXJlckZhY3RvcnkgPSB0aGlzLl9pbmplY3Rvci5nZXQoUmVuZGVyZXJGYWN0b3J5MiwgbnVsbCwge29wdGlvbmFsOiB0cnVlfSk7XG4gICAgfVxuXG4gICAgbGV0IHJ1bnMgPSAwO1xuICAgIGNvbnN0IGFmdGVyUmVuZGVyRWZmZWN0TWFuYWdlciA9IHRoaXMuYWZ0ZXJSZW5kZXJFZmZlY3RNYW5hZ2VyO1xuICAgIHdoaWxlIChydW5zIDwgTUFYSU1VTV9SRUZSRVNIX1JFUlVOUykge1xuICAgICAgY29uc3QgaXNGaXJzdFBhc3MgPSBydW5zID09PSAwO1xuICAgICAgLy8gU29tZSBub3RpZmljYXRpb25zIHRvIHJ1biBhIGB0aWNrYCB3aWxsIG9ubHkgdHJpZ2dlciByZW5kZXIgaG9va3MuIHNvIHdlIHNraXAgcmVmcmVzaGluZyB2aWV3cyB0aGUgZmlyc3QgdGltZSB0aHJvdWdoLlxuICAgICAgLy8gQWZ0ZXIgdGhlIHdlIGV4ZWN1dGUgcmVuZGVyIGhvb2tzIGluIHRoZSBmaXJzdCBwYXNzLCB3ZSBsb29wIHdoaWxlIHZpZXdzIGFyZSBtYXJrZWQgZGlydHkgYW5kIHNob3VsZCByZWZyZXNoIHRoZW0uXG4gICAgICBpZiAocmVmcmVzaFZpZXdzIHx8ICFpc0ZpcnN0UGFzcykge1xuICAgICAgICB0aGlzLmJlZm9yZVJlbmRlci5uZXh0KGlzRmlyc3RQYXNzKTtcbiAgICAgICAgZm9yIChsZXQge19sVmlldywgbm90aWZ5RXJyb3JIYW5kbGVyfSBvZiB0aGlzLl92aWV3cykge1xuICAgICAgICAgIGRldGVjdENoYW5nZXNJblZpZXdJZlJlcXVpcmVkKFxuICAgICAgICAgICAgX2xWaWV3LFxuICAgICAgICAgICAgbm90aWZ5RXJyb3JIYW5kbGVyLFxuICAgICAgICAgICAgaXNGaXJzdFBhc3MsXG4gICAgICAgICAgICB0aGlzLnpvbmVsZXNzRW5hYmxlZCxcbiAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBJZiB3ZSBza2lwcGVkIHJlZnJlc2hpbmcgdmlld3MgYWJvdmUsIHRoZXJlIG1pZ2h0IHN0aWxsIGJlIHVuZmx1c2hlZCBhbmltYXRpb25zXG4gICAgICAgIC8vIGJlY2F1c2Ugd2UgbmV2ZXIgY2FsbGVkIGBkZXRlY3RDaGFuZ2VzSW50ZXJuYWxgIG9uIHRoZSB2aWV3cy5cbiAgICAgICAgcmVuZGVyZXJGYWN0b3J5Py5iZWdpbj8uKCk7XG4gICAgICAgIHJlbmRlcmVyRmFjdG9yeT8uZW5kPy4oKTtcbiAgICAgIH1cbiAgICAgIHJ1bnMrKztcblxuICAgICAgYWZ0ZXJSZW5kZXJFZmZlY3RNYW5hZ2VyLmV4ZWN1dGVJbnRlcm5hbENhbGxiYWNrcygpO1xuICAgICAgLy8gSWYgd2UgaGF2ZSBhIG5ld2x5IGRpcnR5IHZpZXcgYWZ0ZXIgcnVubmluZyBpbnRlcm5hbCBjYWxsYmFja3MsIHJlY2hlY2sgdGhlIHZpZXdzIGFnYWluXG4gICAgICAvLyBiZWZvcmUgcnVubmluZyB1c2VyLXByb3ZpZGVkIGNhbGxiYWNrc1xuICAgICAgaWYgKHRoaXMuYWxsVmlld3Muc29tZSgoe19sVmlld30pID0+IHJlcXVpcmVzUmVmcmVzaE9yVHJhdmVyc2FsKF9sVmlldykpKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICBhZnRlclJlbmRlckVmZmVjdE1hbmFnZXIuZXhlY3V0ZSgpO1xuICAgICAgLy8gSWYgYWZ0ZXIgcnVubmluZyBhbGwgYWZ0ZXJSZW5kZXIgY2FsbGJhY2tzIHdlIGhhdmUgbm8gbW9yZSB2aWV3cyB0aGF0IG5lZWQgdG8gYmUgcmVmcmVzaGVkLFxuICAgICAgLy8gd2UgY2FuIGJyZWFrIG91dCBvZiB0aGUgbG9vcFxuICAgICAgaWYgKCF0aGlzLmFsbFZpZXdzLnNvbWUoKHtfbFZpZXd9KSA9PiByZXF1aXJlc1JlZnJlc2hPclRyYXZlcnNhbChfbFZpZXcpKSkge1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoKHR5cGVvZiBuZ0Rldk1vZGUgPT09ICd1bmRlZmluZWQnIHx8IG5nRGV2TW9kZSkgJiYgcnVucyA+PSBNQVhJTVVNX1JFRlJFU0hfUkVSVU5TKSB7XG4gICAgICB0aHJvdyBuZXcgUnVudGltZUVycm9yKFxuICAgICAgICBSdW50aW1lRXJyb3JDb2RlLklORklOSVRFX0NIQU5HRV9ERVRFQ1RJT04sXG4gICAgICAgIG5nRGV2TW9kZSAmJlxuICAgICAgICAgICdJbmZpbml0ZSBjaGFuZ2UgZGV0ZWN0aW9uIHdoaWxlIHJlZnJlc2hpbmcgYXBwbGljYXRpb24gdmlld3MuICcgK1xuICAgICAgICAgICAgJ0Vuc3VyZSB2aWV3cyBhcmUgbm90IGNhbGxpbmcgYG1hcmtGb3JDaGVja2Agb24gZXZlcnkgdGVtcGxhdGUgZXhlY3V0aW9uIG9yICcgK1xuICAgICAgICAgICAgJ3RoYXQgYWZ0ZXJSZW5kZXIgaG9va3MgYWx3YXlzIG1hcmsgdmlld3MgZm9yIGNoZWNrLicsXG4gICAgICApO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBBdHRhY2hlcyBhIHZpZXcgc28gdGhhdCBpdCB3aWxsIGJlIGRpcnR5IGNoZWNrZWQuXG4gICAqIFRoZSB2aWV3IHdpbGwgYmUgYXV0b21hdGljYWxseSBkZXRhY2hlZCB3aGVuIGl0IGlzIGRlc3Ryb3llZC5cbiAgICogVGhpcyB3aWxsIHRocm93IGlmIHRoZSB2aWV3IGlzIGFscmVhZHkgYXR0YWNoZWQgdG8gYSBWaWV3Q29udGFpbmVyLlxuICAgKi9cbiAgYXR0YWNoVmlldyh2aWV3UmVmOiBWaWV3UmVmKTogdm9pZCB7XG4gICAgKHR5cGVvZiBuZ0Rldk1vZGUgPT09ICd1bmRlZmluZWQnIHx8IG5nRGV2TW9kZSkgJiYgdGhpcy53YXJuSWZEZXN0cm95ZWQoKTtcbiAgICBjb25zdCB2aWV3ID0gdmlld1JlZiBhcyBJbnRlcm5hbFZpZXdSZWY8dW5rbm93bj47XG4gICAgdGhpcy5fdmlld3MucHVzaCh2aWV3KTtcbiAgICB2aWV3LmF0dGFjaFRvQXBwUmVmKHRoaXMpO1xuICB9XG5cbiAgLyoqXG4gICAqIERldGFjaGVzIGEgdmlldyBmcm9tIGRpcnR5IGNoZWNraW5nIGFnYWluLlxuICAgKi9cbiAgZGV0YWNoVmlldyh2aWV3UmVmOiBWaWV3UmVmKTogdm9pZCB7XG4gICAgKHR5cGVvZiBuZ0Rldk1vZGUgPT09ICd1bmRlZmluZWQnIHx8IG5nRGV2TW9kZSkgJiYgdGhpcy53YXJuSWZEZXN0cm95ZWQoKTtcbiAgICBjb25zdCB2aWV3ID0gdmlld1JlZiBhcyBJbnRlcm5hbFZpZXdSZWY8dW5rbm93bj47XG4gICAgcmVtb3ZlKHRoaXMuX3ZpZXdzLCB2aWV3KTtcbiAgICB2aWV3LmRldGFjaEZyb21BcHBSZWYoKTtcbiAgfVxuXG4gIHByaXZhdGUgX2xvYWRDb21wb25lbnQoY29tcG9uZW50UmVmOiBDb21wb25lbnRSZWY8YW55Pik6IHZvaWQge1xuICAgIHRoaXMuYXR0YWNoVmlldyhjb21wb25lbnRSZWYuaG9zdFZpZXcpO1xuICAgIHRoaXMudGljaygpO1xuICAgIHRoaXMuY29tcG9uZW50cy5wdXNoKGNvbXBvbmVudFJlZik7XG4gICAgLy8gR2V0IHRoZSBsaXN0ZW5lcnMgbGF6aWx5IHRvIHByZXZlbnQgREkgY3ljbGVzLlxuICAgIGNvbnN0IGxpc3RlbmVycyA9IHRoaXMuX2luamVjdG9yLmdldChBUFBfQk9PVFNUUkFQX0xJU1RFTkVSLCBbXSk7XG4gICAgaWYgKG5nRGV2TW9kZSAmJiAhQXJyYXkuaXNBcnJheShsaXN0ZW5lcnMpKSB7XG4gICAgICB0aHJvdyBuZXcgUnVudGltZUVycm9yKFxuICAgICAgICBSdW50aW1lRXJyb3JDb2RlLklOVkFMSURfTVVMVElfUFJPVklERVIsXG4gICAgICAgICdVbmV4cGVjdGVkIHR5cGUgb2YgdGhlIGBBUFBfQk9PVFNUUkFQX0xJU1RFTkVSYCB0b2tlbiB2YWx1ZSAnICtcbiAgICAgICAgICBgKGV4cGVjdGVkIGFuIGFycmF5LCBidXQgZ290ICR7dHlwZW9mIGxpc3RlbmVyc30pLiBgICtcbiAgICAgICAgICAnUGxlYXNlIGNoZWNrIHRoYXQgdGhlIGBBUFBfQk9PVFNUUkFQX0xJU1RFTkVSYCB0b2tlbiBpcyBjb25maWd1cmVkIGFzIGEgJyArXG4gICAgICAgICAgJ2BtdWx0aTogdHJ1ZWAgcHJvdmlkZXIuJyxcbiAgICAgICk7XG4gICAgfVxuICAgIFsuLi50aGlzLl9ib290c3RyYXBMaXN0ZW5lcnMsIC4uLmxpc3RlbmVyc10uZm9yRWFjaCgobGlzdGVuZXIpID0+IGxpc3RlbmVyKGNvbXBvbmVudFJlZikpO1xuICB9XG5cbiAgLyoqIEBpbnRlcm5hbCAqL1xuICBuZ09uRGVzdHJveSgpIHtcbiAgICBpZiAodGhpcy5fZGVzdHJveWVkKSByZXR1cm47XG5cbiAgICB0cnkge1xuICAgICAgLy8gQ2FsbCBhbGwgdGhlIGxpZmVjeWNsZSBob29rcy5cbiAgICAgIHRoaXMuX2Rlc3Ryb3lMaXN0ZW5lcnMuZm9yRWFjaCgobGlzdGVuZXIpID0+IGxpc3RlbmVyKCkpO1xuXG4gICAgICAvLyBEZXN0cm95IGFsbCByZWdpc3RlcmVkIHZpZXdzLlxuICAgICAgdGhpcy5fdmlld3Muc2xpY2UoKS5mb3JFYWNoKCh2aWV3KSA9PiB2aWV3LmRlc3Ryb3koKSk7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIC8vIEluZGljYXRlIHRoYXQgdGhpcyBpbnN0YW5jZSBpcyBkZXN0cm95ZWQuXG4gICAgICB0aGlzLl9kZXN0cm95ZWQgPSB0cnVlO1xuXG4gICAgICAvLyBSZWxlYXNlIGFsbCByZWZlcmVuY2VzLlxuICAgICAgdGhpcy5fdmlld3MgPSBbXTtcbiAgICAgIHRoaXMuX2Jvb3RzdHJhcExpc3RlbmVycyA9IFtdO1xuICAgICAgdGhpcy5fZGVzdHJveUxpc3RlbmVycyA9IFtdO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBSZWdpc3RlcnMgYSBsaXN0ZW5lciB0byBiZSBjYWxsZWQgd2hlbiBhbiBpbnN0YW5jZSBpcyBkZXN0cm95ZWQuXG4gICAqXG4gICAqIEBwYXJhbSBjYWxsYmFjayBBIGNhbGxiYWNrIGZ1bmN0aW9uIHRvIGFkZCBhcyBhIGxpc3RlbmVyLlxuICAgKiBAcmV0dXJucyBBIGZ1bmN0aW9uIHdoaWNoIHVucmVnaXN0ZXJzIGEgbGlzdGVuZXIuXG4gICAqL1xuICBvbkRlc3Ryb3koY2FsbGJhY2s6ICgpID0+IHZvaWQpOiBWb2lkRnVuY3Rpb24ge1xuICAgICh0eXBlb2YgbmdEZXZNb2RlID09PSAndW5kZWZpbmVkJyB8fCBuZ0Rldk1vZGUpICYmIHRoaXMud2FybklmRGVzdHJveWVkKCk7XG4gICAgdGhpcy5fZGVzdHJveUxpc3RlbmVycy5wdXNoKGNhbGxiYWNrKTtcbiAgICByZXR1cm4gKCkgPT4gcmVtb3ZlKHRoaXMuX2Rlc3Ryb3lMaXN0ZW5lcnMsIGNhbGxiYWNrKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZXN0cm95cyBhbiBBbmd1bGFyIGFwcGxpY2F0aW9uIHJlcHJlc2VudGVkIGJ5IHRoaXMgYEFwcGxpY2F0aW9uUmVmYC4gQ2FsbGluZyB0aGlzIGZ1bmN0aW9uXG4gICAqIHdpbGwgZGVzdHJveSB0aGUgYXNzb2NpYXRlZCBlbnZpcm9ubWVudCBpbmplY3RvcnMgYXMgd2VsbCBhcyBhbGwgdGhlIGJvb3RzdHJhcHBlZCBjb21wb25lbnRzXG4gICAqIHdpdGggdGhlaXIgdmlld3MuXG4gICAqL1xuICBkZXN0cm95KCk6IHZvaWQge1xuICAgIGlmICh0aGlzLl9kZXN0cm95ZWQpIHtcbiAgICAgIHRocm93IG5ldyBSdW50aW1lRXJyb3IoXG4gICAgICAgIFJ1bnRpbWVFcnJvckNvZGUuQVBQTElDQVRJT05fUkVGX0FMUkVBRFlfREVTVFJPWUVELFxuICAgICAgICBuZ0Rldk1vZGUgJiYgJ1RoaXMgaW5zdGFuY2Ugb2YgdGhlIGBBcHBsaWNhdGlvblJlZmAgaGFzIGFscmVhZHkgYmVlbiBkZXN0cm95ZWQuJyxcbiAgICAgICk7XG4gICAgfVxuXG4gICAgY29uc3QgaW5qZWN0b3IgPSB0aGlzLl9pbmplY3RvciBhcyBSM0luamVjdG9yO1xuXG4gICAgLy8gQ2hlY2sgdGhhdCB0aGlzIGluamVjdG9yIGluc3RhbmNlIHN1cHBvcnRzIGRlc3Ryb3kgb3BlcmF0aW9uLlxuICAgIGlmIChpbmplY3Rvci5kZXN0cm95ICYmICFpbmplY3Rvci5kZXN0cm95ZWQpIHtcbiAgICAgIC8vIERlc3Ryb3lpbmcgYW4gdW5kZXJseWluZyBpbmplY3RvciB3aWxsIHRyaWdnZXIgdGhlIGBuZ09uRGVzdHJveWAgbGlmZWN5Y2xlXG4gICAgICAvLyBob29rLCB3aGljaCBpbnZva2VzIHRoZSByZW1haW5pbmcgY2xlYW51cCBhY3Rpb25zLlxuICAgICAgaW5qZWN0b3IuZGVzdHJveSgpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBudW1iZXIgb2YgYXR0YWNoZWQgdmlld3MuXG4gICAqL1xuICBnZXQgdmlld0NvdW50KCkge1xuICAgIHJldHVybiB0aGlzLl92aWV3cy5sZW5ndGg7XG4gIH1cblxuICBwcml2YXRlIHdhcm5JZkRlc3Ryb3llZCgpIHtcbiAgICBpZiAoKHR5cGVvZiBuZ0Rldk1vZGUgPT09ICd1bmRlZmluZWQnIHx8IG5nRGV2TW9kZSkgJiYgdGhpcy5fZGVzdHJveWVkKSB7XG4gICAgICBjb25zb2xlLndhcm4oXG4gICAgICAgIGZvcm1hdFJ1bnRpbWVFcnJvcihcbiAgICAgICAgICBSdW50aW1lRXJyb3JDb2RlLkFQUExJQ0FUSU9OX1JFRl9BTFJFQURZX0RFU1RST1lFRCxcbiAgICAgICAgICAnVGhpcyBpbnN0YW5jZSBvZiB0aGUgYEFwcGxpY2F0aW9uUmVmYCBoYXMgYWxyZWFkeSBiZWVuIGRlc3Ryb3llZC4nLFxuICAgICAgICApLFxuICAgICAgKTtcbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlbW92ZTxUPihsaXN0OiBUW10sIGVsOiBUKTogdm9pZCB7XG4gIGNvbnN0IGluZGV4ID0gbGlzdC5pbmRleE9mKGVsKTtcbiAgaWYgKGluZGV4ID4gLTEpIHtcbiAgICBsaXN0LnNwbGljZShpbmRleCwgMSk7XG4gIH1cbn1cblxubGV0IHdoZW5TdGFibGVTdG9yZTogV2Vha01hcDxBcHBsaWNhdGlvblJlZiwgUHJvbWlzZTx2b2lkPj4gfCB1bmRlZmluZWQ7XG4vKipcbiAqIFJldHVybnMgYSBQcm9taXNlIHRoYXQgcmVzb2x2ZXMgd2hlbiB0aGUgYXBwbGljYXRpb24gYmVjb21lcyBzdGFibGUgYWZ0ZXIgdGhpcyBtZXRob2QgaXMgY2FsbGVkXG4gKiB0aGUgZmlyc3QgdGltZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHdoZW5TdGFibGUoYXBwbGljYXRpb25SZWY6IEFwcGxpY2F0aW9uUmVmKTogUHJvbWlzZTx2b2lkPiB7XG4gIHdoZW5TdGFibGVTdG9yZSA/Pz0gbmV3IFdlYWtNYXAoKTtcbiAgY29uc3QgY2FjaGVkV2hlblN0YWJsZSA9IHdoZW5TdGFibGVTdG9yZS5nZXQoYXBwbGljYXRpb25SZWYpO1xuICBpZiAoY2FjaGVkV2hlblN0YWJsZSkge1xuICAgIHJldHVybiBjYWNoZWRXaGVuU3RhYmxlO1xuICB9XG5cbiAgY29uc3Qgd2hlblN0YWJsZVByb21pc2UgPSBhcHBsaWNhdGlvblJlZi5pc1N0YWJsZVxuICAgIC5waXBlKGZpcnN0KChpc1N0YWJsZSkgPT4gaXNTdGFibGUpKVxuICAgIC50b1Byb21pc2UoKVxuICAgIC50aGVuKCgpID0+IHZvaWQgMCk7XG4gIHdoZW5TdGFibGVTdG9yZS5zZXQoYXBwbGljYXRpb25SZWYsIHdoZW5TdGFibGVQcm9taXNlKTtcblxuICAvLyBCZSBhIGdvb2QgY2l0aXplbiBhbmQgY2xlYW4gdGhlIHN0b3JlIGBvbkRlc3Ryb3lgIGV2ZW4gdGhvdWdoIHdlIGFyZSB1c2luZyBgV2Vha01hcGAuXG4gIGFwcGxpY2F0aW9uUmVmLm9uRGVzdHJveSgoKSA9PiB3aGVuU3RhYmxlU3RvcmU/LmRlbGV0ZShhcHBsaWNhdGlvblJlZikpO1xuXG4gIHJldHVybiB3aGVuU3RhYmxlUHJvbWlzZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGRldGVjdENoYW5nZXNJblZpZXdJZlJlcXVpcmVkKFxuICBsVmlldzogTFZpZXcsXG4gIG5vdGlmeUVycm9ySGFuZGxlcjogYm9vbGVhbixcbiAgaXNGaXJzdFBhc3M6IGJvb2xlYW4sXG4gIHpvbmVsZXNzRW5hYmxlZDogYm9vbGVhbixcbikge1xuICAvLyBXaGVuIHJlLWNoZWNraW5nLCBvbmx5IGNoZWNrIHZpZXdzIHdoaWNoIGFjdHVhbGx5IG5lZWQgaXQuXG4gIGlmICghaXNGaXJzdFBhc3MgJiYgIXJlcXVpcmVzUmVmcmVzaE9yVHJhdmVyc2FsKGxWaWV3KSkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGNvbnN0IG1vZGUgPVxuICAgIGlzRmlyc3RQYXNzICYmICF6b25lbGVzc0VuYWJsZWRcbiAgICAgID8gLy8gVGhlIGZpcnN0IHBhc3MgaXMgYWx3YXlzIGluIEdsb2JhbCBtb2RlLCB3aGljaCBpbmNsdWRlcyBgQ2hlY2tBbHdheXNgIHZpZXdzLlxuICAgICAgICAvLyBXaGVuIHVzaW5nIHpvbmVsZXNzLCBhbGwgcm9vdCB2aWV3cyBtdXN0IGJlIGV4cGxpY2l0bHkgbWFya2VkIGZvciByZWZyZXNoLCBldmVuIGlmIHRoZXkgYXJlXG4gICAgICAgIC8vIGBDaGVja0Fsd2F5c2AuXG4gICAgICAgIENoYW5nZURldGVjdGlvbk1vZGUuR2xvYmFsXG4gICAgICA6IC8vIE9ubHkgcmVmcmVzaCB2aWV3cyB3aXRoIHRoZSBgUmVmcmVzaFZpZXdgIGZsYWcgb3Igdmlld3MgaXMgYSBjaGFuZ2VkIHNpZ25hbFxuICAgICAgICBDaGFuZ2VEZXRlY3Rpb25Nb2RlLlRhcmdldGVkO1xuICBkZXRlY3RDaGFuZ2VzSW50ZXJuYWwobFZpZXcsIG5vdGlmeUVycm9ySGFuZGxlciwgbW9kZSk7XG59XG4iXX0=