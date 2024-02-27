/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import '../util/ng_jit_mode';
import { setThrowInvalidWriteToSignalError } from '@angular/core/primitives/signals';
import { first, map } from 'rxjs/operators';
import { Console } from '../console';
import { inject } from '../di';
import { Injectable } from '../di/injectable';
import { InjectionToken } from '../di/injection_token';
import { Injector } from '../di/injector';
import { EnvironmentInjector } from '../di/r3_injector';
import { INTERNAL_APPLICATION_ERROR_HANDLER } from '../error_handler';
import { RuntimeError, formatRuntimeError } from '../errors';
import { ComponentFactory } from '../linker/component_factory';
import { ComponentFactoryResolver } from '../linker/component_factory_resolver';
import { NgModuleRef } from '../linker/ng_module_factory';
import { PendingTasks } from '../pending_tasks';
import { AfterRenderEventManager } from '../render3/after_render_hooks';
import { isStandalone } from '../render3/definition';
import { MAXIMUM_REFRESH_RERUNS, detectChangesInternal } from '../render3/instructions/change_detection';
import { FLAGS } from '../render3/interfaces/view';
import { publishDefaultGlobalUtils as _publishDefaultGlobalUtils } from '../render3/util/global_utils';
import { requiresRefreshOrTraversal } from '../render3/util/view_utils';
import { TESTABILITY } from '../testability/testability';
import { isPromise } from '../util/lang';
import { ApplicationInitStatus } from './application_init';
import * as i0 from "../r3_symbols";
/**
 * A [DI token](guide/glossary#di-token "DI token definition") that provides a set of callbacks to
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
        this._runningTick = false;
        this._destroyed = false;
        this._destroyListeners = [];
        /** @internal */
        this._views = [];
        this.internalErrorHandler = inject(INTERNAL_APPLICATION_ERROR_HANDLER);
        this.afterRenderEffectManager = inject(AfterRenderEventManager);
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
        this.isStable = inject(PendingTasks).hasPendingTasks.pipe(map(pending => !pending));
        this._injector = inject(EnvironmentInjector);
    }
    /**
     * Indicates whether this instance was destroyed.
     */
    get destroyed() {
        return this._destroyed;
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
                    (standalone ?
                        '' :
                        ' Bootstrap components in the `ngDoBootstrap` method of the root module.');
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
        const ngModule = isBoundToModule(componentFactory) ? undefined : this._injector.get(NgModuleRef);
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
        (typeof ngDevMode === 'undefined' || ngDevMode) && this.warnIfDestroyed();
        if (this._runningTick) {
            throw new RuntimeError(101 /* RuntimeErrorCode.RECURSIVE_APPLICATION_REF_TICK */, ngDevMode && 'ApplicationRef.tick is called recursively');
        }
        try {
            this._runningTick = true;
            this.detectChangesInAttachedViews();
            if ((typeof ngDevMode === 'undefined' || ngDevMode)) {
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
        }
    }
    detectChangesInAttachedViews() {
        let runs = 0;
        const afterRenderEffectManager = this.afterRenderEffectManager;
        while (true) {
            if (runs === MAXIMUM_REFRESH_RERUNS) {
                throw new RuntimeError(103 /* RuntimeErrorCode.INFINITE_CHANGE_DETECTION */, ngDevMode &&
                    'Infinite change detection while refreshing application views. ' +
                        'Ensure afterRender or queueStateUpdate hooks are not continuously causing updates.');
            }
            const isFirstPass = runs === 0;
            for (let { _lView, notifyErrorHandler } of this._views) {
                // When re-checking, only check views which actually need it.
                if (!isFirstPass && !shouldRecheckView(_lView)) {
                    continue;
                }
                this.detectChangesInView(_lView, notifyErrorHandler, isFirstPass);
            }
            runs++;
            afterRenderEffectManager.executeInternalCallbacks();
            // If we have a newly dirty view after running internal callbacks, recheck the views again
            // before running user-provided callbacks
            if (this._views.some(({ _lView }) => shouldRecheckView(_lView))) {
                continue;
            }
            afterRenderEffectManager.execute();
            // If after running all afterRender callbacks we have no more views that need to be refreshed,
            // we can break out of the loop
            if (!this._views.some(({ _lView }) => shouldRecheckView(_lView))) {
                break;
            }
        }
    }
    detectChangesInView(lView, notifyErrorHandler, isFirstPass) {
        let mode;
        if (isFirstPass) {
            // The first pass is always in Global mode, which includes `CheckAlways` views.
            mode = 0 /* ChangeDetectionMode.Global */;
            // Add `RefreshView` flag to ensure this view is refreshed if not already dirty.
            // `RefreshView` flag is used intentionally over `Dirty` because it gets cleared before
            // executing any of the actual refresh code while the `Dirty` flag doesn't get cleared
            // until the end of the refresh. Using `RefreshView` prevents creating a potential
            // difference in the state of the LViewFlags during template execution.
            lView[FLAGS] |= 1024 /* LViewFlags.RefreshView */;
        }
        else if (lView[FLAGS] & 64 /* LViewFlags.Dirty */) {
            // The root view has been explicitly marked for check, so check it in Global mode.
            mode = 0 /* ChangeDetectionMode.Global */;
        }
        else {
            // The view has not been marked for check, but contains a view marked for refresh
            // (likely via a signal). Start this change detection in Targeted mode to skip the root
            // view and check just the view(s) that need refreshed.
            mode = 1 /* ChangeDetectionMode.Targeted */;
        }
        detectChangesInternal(lView, notifyErrorHandler, mode);
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
            this._destroyListeners.forEach(listener => listener());
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
    static { this.ɵfac = function ApplicationRef_Factory(t) { return new (t || ApplicationRef)(); }; }
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
    const whenStablePromise = applicationRef.isStable.pipe(first((isStable) => isStable)).toPromise().then(() => void 0);
    whenStableStore.set(applicationRef, whenStablePromise);
    // Be a good citizen and clean the store `onDestroy` even though we are using `WeakMap`.
    applicationRef.onDestroy(() => whenStableStore?.delete(applicationRef));
    return whenStablePromise;
}
function shouldRecheckView(view) {
    return requiresRefreshOrTraversal(view);
    // TODO(atscott): We need to support rechecking views marked dirty again in afterRender hooks
    // in order to support the transition to zoneless. b/308152025
    /* || !!(view[FLAGS] & LViewFlags.Dirty); */
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwbGljYXRpb25fcmVmLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvYXBwbGljYXRpb24vYXBwbGljYXRpb25fcmVmLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8scUJBQXFCLENBQUM7QUFFN0IsT0FBTyxFQUFDLGlDQUFpQyxFQUFDLE1BQU0sa0NBQWtDLENBQUM7QUFFbkYsT0FBTyxFQUFDLEtBQUssRUFBRSxHQUFHLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUUxQyxPQUFPLEVBQUMsT0FBTyxFQUFDLE1BQU0sWUFBWSxDQUFDO0FBQ25DLE9BQU8sRUFBQyxNQUFNLEVBQUMsTUFBTSxPQUFPLENBQUM7QUFDN0IsT0FBTyxFQUFDLFVBQVUsRUFBQyxNQUFNLGtCQUFrQixDQUFDO0FBQzVDLE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUNyRCxPQUFPLEVBQUMsUUFBUSxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFDeEMsT0FBTyxFQUFDLG1CQUFtQixFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDdEQsT0FBTyxFQUFlLGtDQUFrQyxFQUFDLE1BQU0sa0JBQWtCLENBQUM7QUFDbEYsT0FBTyxFQUFDLFlBQVksRUFBb0Isa0JBQWtCLEVBQUMsTUFBTSxXQUFXLENBQUM7QUFFN0UsT0FBTyxFQUFDLGdCQUFnQixFQUFlLE1BQU0sNkJBQTZCLENBQUM7QUFDM0UsT0FBTyxFQUFDLHdCQUF3QixFQUFDLE1BQU0sc0NBQXNDLENBQUM7QUFDOUUsT0FBTyxFQUFDLFdBQVcsRUFBQyxNQUFNLDZCQUE2QixDQUFDO0FBRXhELE9BQU8sRUFBQyxZQUFZLEVBQUMsTUFBTSxrQkFBa0IsQ0FBQztBQUM5QyxPQUFPLEVBQUMsdUJBQXVCLEVBQUMsTUFBTSwrQkFBK0IsQ0FBQztBQUV0RSxPQUFPLEVBQUMsWUFBWSxFQUFD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QThCO0lBQ3ZELGVBQWUsS0FBSyxJQUFJLE9BQU8sRUFBRSxDQUFDO0lBQ2xDLE1BQU0sZ0JBQWdCLEdBQUcsZUFBZSxDQUFDLEdBQUcsQ0FBQyxjQUFjLENBQUMsQ0FBQztJQUM3RCxJQUFJLGdCQUFnQixFQUFFLENBQUM7UUFDckIsT0FBTyxnQkFBZ0IsQ0FBQztJQUMxQixDQUFDO0lBRUQsTUFBTSxpQkFBaUIsR0FDbkIsY0FBYyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsUUFBUSxFQUFFLEVBQUUsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLFNBQVMsRUFBRSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO0lBQy9GLGVBQWUsQ0FBQyxHQUFHLENBQUMsY0FBYyxFQUFFLGlCQUFpQixDQUFDLENBQUM7SUFFdkQsd0ZBQXdGO0lBQ3hGLGNBQWMsQ0FBQyxTQUFTLENBQUMsR0FBRyxFQUFFLENBQUMsZUFBZSxFQUFFLE1BQU0sQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDO0lBRXhFLE9BQU8saUJBQWlCLENBQUM7QUFDM0IsQ0FBQztBQUdELFNBQVMsaUJBQWlCLENBQUMsSUFBVztJQUNwQyxPQUFPLDBCQUEwQixDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ3hDLDZGQUE2RjtJQUM3Riw4REFBOEQ7SUFDOUQsNENBQTRDO0FBQzlDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0ICcuLi91dGlsL25nX2ppdF9tb2RlJztcblxuaW1wb3J0IHtzZXRUaHJvd0ludmFsaWRXcml0ZVRvU2lnbmFsRXJyb3J9IGZyb20gJ0Bhbmd1bGFyL2NvcmUvcHJpbWl0aXZlcy9zaWduYWxzJztcbmltcG9ydCB7T2JzZXJ2YWJsZX0gZnJvbSAncnhqcyc7XG5pbXBvcnQge2ZpcnN0LCBtYXB9IGZyb20gJ3J4anMvb3BlcmF0b3JzJztcblxuaW1wb3J0IHtDb25zb2xlfSBmcm9tICcuLi9jb25zb2xlJztcbmltcG9ydCB7aW5qZWN0fSBmcm9tICcuLi9kaSc7XG5pbXBvcnQge0luamVjdGFibGV9IGZyb20gJy4uL2RpL2luamVjdGFibGUnO1xuaW1wb3J0IHtJbmplY3Rpb25Ub2tlbn0gZnJvbSAnLi4vZGkvaW5qZWN0aW9uX3Rva2VuJztcbmltcG9ydCB7SW5qZWN0b3J9IGZyb20gJy4uL2RpL2luamVjdG9yJztcbmltcG9ydCB7RW52aXJvbm1lbnRJbmplY3Rvcn0gZnJvbSAnLi4vZGkvcjNfaW5qZWN0b3InO1xuaW1wb3J0IHtFcnJvckhhbmRsZXIsIElOVEVSTkFMX0FQUExJQ0FUSU9OX0VSUk9SX0hBTkRMRVJ9IGZyb20gJy4uL2Vycm9yX2hhbmRsZXInO1xuaW1wb3J0IHtSdW50aW1lRXJyb3IsIFJ1bnRpbWVFcnJvckNvZGUsIGZvcm1hdFJ1bnRpbWVFcnJvcn0gZnJvbSAnLi4vZXJyb3JzJztcbmltcG9ydCB7VHlwZX0gZnJvbSAnLi4vaW50ZXJmYWNlL3R5cGUnO1xuaW1wb3J0IHtDb21wb25lbnRGYWN0b3J5LCBDb21wb25lbnRSZWZ9IGZyb20gJy4uL2xpbmtlci9jb21wb25lbnRfZmFjdG9yeSc7XG5pbXBvcnQge0NvbXBvbmVudEZhY3RvcnlSZXNvbHZlcn0gZnJvbSAnLi4vbGlua2VyL2NvbXBvbmVudF9mYWN0b3J5X3Jlc29sdmVyJztcbmltcG9ydCB7TmdNb2R1bGVSZWZ9IGZyb20gJy4uL2xpbmtlci9uZ19tb2R1bGVfZmFjdG9yeSc7XG5pbXBvcnQge1ZpZXdSZWZ9IGZyb20gJy4uL2xpbmtlci92aWV3X3JlZic7XG5pbXBvcnQge1BlbmRpbmdUYXNrc30gZnJvbSAnLi4vcGVuZGluZ190YXNrcyc7XG5pbXBvcnQge0FmdGVyUmVuZGVyRXZlbnRNYW5hZ2VyfSBmcm9tICcuLi9yZW5kZXIzL2FmdGVyX3JlbmRlcl9ob29rcyc7XG5pbXBvcnQge0NvbXBvbmVudEZhY3RvcnkgYXMgUjNDb21wb25lbnRGYWN0b3J5fSBmcm9tICcuLi9yZW5kZXIzL2NvbXBvbmVudF9yZWYnO1xuaW1wb3J0IHtpc1N0YW5kYWxvbmV9IGZyb20gJy4uL3JlbmRlcjMvZGVmaW5pdGlvbic7XG5pbXBvcnQge0NoYW5nZURldGVjdGlvbk1vZGUsIE1BWElNVU1fUkVGUkVTSF9SRVJVTlMsIGRldGVjdENoYW5nZXNJbnRlcm5hbH0gZnJvbSAnLi4vcmVuZGVyMy9pbnN0cnVjdGlvbnMvY2hhbmdlX2RldGVjdGlvbic7XG5pbXBvcnQge0ZMQUdTLCBMVmlldywgTFZpZXdGbGFnc30gZnJvbSAnLi4vcmVuZGVyMy9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHtwdWJsaXNoRGVmYXVsdEdsb2JhbFV0aWxzIGFzIF9wdWJsaXNoRGVmYXVsdEdsb2JhbFV0aWxzfSBmcm9tICcuLi9yZW5kZXIzL3V0aWwvZ2xvYmFsX3V0aWxzJztcbmltcG9ydCB7cmVxdWlyZXNSZWZyZXNoT3JUcmF2ZXJzYWx9IGZyb20gJy4uL3JlbmRlcjMvdXRpbC92aWV3X3V0aWxzJztcbmltcG9ydCB7Vmlld1JlZiBhcyBJbnRlcm5hbFZpZXdSZWZ9IGZyb20gJy4uL3JlbmRlcjMvdmlld19yZWYnO1xuaW1wb3J0IHtURVNUQUJJTElUWX0gZnJvbSAnLi4vdGVzdGFiaWxpdHkvdGVzdGFiaWxpdHknO1xuaW1wb3J0IHtpc1Byb21pc2V9IGZyb20gJy4uL3V0aWwvbGFuZyc7XG5pbXBvcnQge05nWm9uZX0gZnJvbSAnLi4vem9uZS9uZ196b25lJztcblxuaW1wb3J0IHtBcHBsaWNhdGlvbkluaXRTdGF0dXN9IGZyb20gJy4vYXBwbGljYXRpb25faW5pdCc7XG5cbi8qKlxuICogQSBbREkgdG9rZW5dKGd1aWRlL2dsb3NzYXJ5I2RpLXRva2VuIFwiREkgdG9rZW4gZGVmaW5pdGlvblwiKSB0aGF0IHByb3ZpZGVzIGEgc2V0IG9mIGNhbGxiYWNrcyB0b1xuICogYmUgY2FsbGVkIGZvciBldmVyeSBjb21wb25lbnQgdGhhdCBpcyBib290c3RyYXBwZWQuXG4gKlxuICogRWFjaCBjYWxsYmFjayBtdXN0IHRha2UgYSBgQ29tcG9uZW50UmVmYCBpbnN0YW5jZSBhbmQgcmV0dXJuIG5vdGhpbmcuXG4gKlxuICogYChjb21wb25lbnRSZWY6IENvbXBvbmVudFJlZikgPT4gdm9pZGBcbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBjb25zdCBBUFBfQk9PVFNUUkFQX0xJU1RFTkVSID1cbiAgICBuZXcgSW5qZWN0aW9uVG9rZW48UmVhZG9ubHlBcnJheTwoY29tcFJlZjogQ29tcG9uZW50UmVmPGFueT4pID0+IHZvaWQ+PihcbiAgICAgICAgbmdEZXZNb2RlID8gJ2FwcEJvb3RzdHJhcExpc3RlbmVyJyA6ICcnKTtcblxuZXhwb3J0IGZ1bmN0aW9uIHB1Ymxpc2hEZWZhdWx0R2xvYmFsVXRpbHMoKSB7XG4gIG5nRGV2TW9kZSAmJiBfcHVibGlzaERlZmF1bHRHbG9iYWxVdGlscygpO1xufVxuXG4vKipcbiAqIFNldHMgdGhlIGVycm9yIGZvciBhbiBpbnZhbGlkIHdyaXRlIHRvIGEgc2lnbmFsIHRvIGJlIGFuIEFuZ3VsYXIgYFJ1bnRpbWVFcnJvcmAuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwdWJsaXNoU2lnbmFsQ29uZmlndXJhdGlvbigpOiB2b2lkIHtcbiAgc2V0VGhyb3dJbnZhbGlkV3JpdGVUb1NpZ25hbEVycm9yKCgpID0+IHtcbiAgICB0aHJvdyBuZXcgUnVudGltZUVycm9yKFxuICAgICAgICBSdW50aW1lRXJyb3JDb2RlLlNJR05BTF9XUklURV9GUk9NX0lMTEVHQUxfQ09OVEVYVCxcbiAgICAgICAgbmdEZXZNb2RlICYmXG4gICAgICAgICAgICAnV3JpdGluZyB0byBzaWduYWxzIGlzIG5vdCBhbGxvd2VkIGluIGEgYGNvbXB1dGVkYCBvciBhbiBgZWZmZWN0YCBieSBkZWZhdWx0LiAnICtcbiAgICAgICAgICAgICAgICAnVXNlIGBhbGxvd1NpZ25hbFdyaXRlc2AgaW4gdGhlIGBDcmVhdGVFZmZlY3RPcHRpb25zYCB0byBlbmFibGUgdGhpcyBpbnNpZGUgZWZmZWN0cy4nKTtcbiAgfSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0JvdW5kVG9Nb2R1bGU8Qz4oY2Y6IENvbXBvbmVudEZhY3Rvcnk8Qz4pOiBib29sZWFuIHtcbiAgcmV0dXJuIChjZiBhcyBSM0NvbXBvbmVudEZhY3Rvcnk8Qz4pLmlzQm91bmRUb01vZHVsZTtcbn1cblxuLyoqXG4gKiBBIHRva2VuIGZvciB0aGlyZC1wYXJ0eSBjb21wb25lbnRzIHRoYXQgY2FuIHJlZ2lzdGVyIHRoZW1zZWx2ZXMgd2l0aCBOZ1Byb2JlLlxuICpcbiAqIEBkZXByZWNhdGVkXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBjbGFzcyBOZ1Byb2JlVG9rZW4ge1xuICBjb25zdHJ1Y3RvcihwdWJsaWMgbmFtZTogc3RyaW5nLCBwdWJsaWMgdG9rZW46IGFueSkge31cbn1cblxuLyoqXG4gKiBQcm92aWRlcyBhZGRpdGlvbmFsIG9wdGlvbnMgdG8gdGhlIGJvb3RzdHJhcHBpbmcgcHJvY2Vzcy5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgQm9vdHN0cmFwT3B0aW9ucyB7XG4gIC8qKlxuICAgKiBPcHRpb25hbGx5IHNwZWNpZnkgd2hpY2ggYE5nWm9uZWAgc2hvdWxkIGJlIHVzZWQuXG4gICAqXG4gICAqIC0gUHJvdmlkZSB5b3VyIG93biBgTmdab25lYCBpbnN0YW5jZS5cbiAgICogLSBgem9uZS5qc2AgLSBVc2UgZGVmYXVsdCBgTmdab25lYCB3aGljaCByZXF1aXJlcyBgWm9uZS5qc2AuXG4gICAqIC0gYG5vb3BgIC0gVXNlIGBOb29wTmdab25lYCB3aGljaCBkb2VzIG5vdGhpbmcuXG4gICAqL1xuICBuZ1pvbmU/OiBOZ1pvbmV8J3pvbmUuanMnfCdub29wJztcblxuICAvKipcbiAgICogT3B0aW9uYWxseSBzcGVjaWZ5IGNvYWxlc2NpbmcgZXZlbnQgY2hhbmdlIGRldGVjdGlvbnMgb3Igbm90LlxuICAgKiBDb25zaWRlciB0aGUgZm9sbG93aW5nIGNhc2UuXG4gICAqXG4gICAqIGBgYFxuICAgKiA8ZGl2IChjbGljayk9XCJkb1NvbWV0aGluZygpXCI+XG4gICAqICAgPGJ1dHRvbiAoY2xpY2spPVwiZG9Tb21ldGhpbmdFbHNlKClcIj48L2J1dHRvbj5cbiAgICogPC9kaXY+XG4gICAqIGBgYFxuICAgKlxuICAgKiBXaGVuIGJ1dHRvbiBpcyBjbGlja2VkLCBiZWNhdXNlIG9mIHRoZSBldmVudCBidWJibGluZywgYm90aFxuICAgKiBldmVudCBoYW5kbGVycyB3aWxsIGJlIGNhbGxlZCBhbmQgMiBjaGFuZ2UgZGV0ZWN0aW9ucyB3aWxsIGJlXG4gICAqIHRyaWdnZXJlZC4gV2UgY2FuIGNvYWxlc2NlIHN1Y2gga2luZCBvZiBldmVudHMgdG8gb25seSB0cmlnZ2VyXG4gICAqIGNoYW5nZSBkZXRlY3Rpb24gb25seSBvbmNlLlxuICAgKlxuICAgKiBCeSBkZWZhdWx0LCB0aGlzIG9wdGlvbiB3aWxsIGJlIGZhbHNlLiBTbyB0aGUgZXZlbnRzIHdpbGwgbm90IGJlXG4gICAqIGNvYWxlc2NlZCBhbmQgdGhlIGNoYW5nZSBkZXRlY3Rpb24gd2lsbCBiZSB0cmlnZ2VyZWQgbXVsdGlwbGUgdGltZXMuXG4gICAqIEFuZCBpZiB0aGlzIG9wdGlvbiBiZSBzZXQgdG8gdHJ1ZSwgdGhlIGNoYW5nZSBkZXRlY3Rpb24gd2lsbCBiZVxuICAgKiB0cmlnZ2VyZWQgYXN5bmMgYnkgc2NoZWR1bGluZyBhIGFuaW1hdGlvbiBmcmFtZS4gU28gaW4gdGhlIGNhc2UgYWJvdmUsXG4gICAqIHRoZSBjaGFuZ2UgZGV0ZWN0aW9uIHdpbGwgb25seSBiZSB0cmlnZ2VyZWQgb25jZS5cbiAgICovXG4gIG5nWm9uZUV2ZW50Q29hbGVzY2luZz86IGJvb2xlYW47XG5cbiAgLyoqXG4gICAqIE9wdGlvbmFsbHkgc3BlY2lmeSBpZiBgTmdab25lI3J1bigpYCBtZXRob2QgaW52b2NhdGlvbnMgc2hvdWxkIGJlIGNvYWxlc2NlZFxuICAgKiBpbnRvIGEgc2luZ2xlIGNoYW5nZSBkZXRlY3Rpb24uXG4gICAqXG4gICAqIENvbnNpZGVyIHRoZSBmb2xsb3dpbmcgY2FzZS5cbiAgICogYGBgXG4gICAqIGZvciAobGV0IGkgPSAwOyBpIDwgMTA7IGkgKyspIHtcbiAgICogICBuZ1pvbmUucnVuKCgpID0+IHtcbiAgICogICAgIC8vIGRvIHNvbWV0aGluZ1xuICAgKiAgIH0pO1xuICAgKiB9XG4gICAqIGBgYFxuICAgKlxuICAgKiBUaGlzIGNhc2UgdHJpZ2dlcnMgdGhlIGNoYW5nZSBkZXRlY3Rpb24gbXVsdGlwbGUgdGltZXMuXG4gICAqIFdpdGggbmdab25lUnVuQ29hbGVzY2luZyBvcHRpb25zLCBhbGwgY2hhbmdlIGRldGVjdGlvbnMgaW4gYW4gZXZlbnQgbG9vcCB0cmlnZ2VyIG9ubHkgb25jZS5cbiAgICogSW4gYWRkaXRpb24sIHRoZSBjaGFuZ2UgZGV0ZWN0aW9uIGV4ZWN1dGVzIGluIHJlcXVlc3RBbmltYXRpb24uXG4gICAqXG4gICAqL1xuICBuZ1pvbmVSdW5Db2FsZXNjaW5nPzogYm9vbGVhbjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIF9jYWxsQW5kUmVwb3J0VG9FcnJvckhhbmRsZXIoXG4gICAgZXJyb3JIYW5kbGVyOiBFcnJvckhhbmRsZXIsIG5nWm9uZTogTmdab25lLCBjYWxsYmFjazogKCkgPT4gYW55KTogYW55IHtcbiAgdHJ5IHtcbiAgICBjb25zdCByZXN1bHQgPSBjYWxsYmFjaygpO1xuICAgIGlmIChpc1Byb21pc2UocmVzdWx0KSkge1xuICAgICAgcmV0dXJuIHJlc3VsdC5jYXRjaCgoZTogYW55KSA9PiB7XG4gICAgICAgIG5nWm9uZS5ydW5PdXRzaWRlQW5ndWxhcigoKSA9PiBlcnJvckhhbmRsZXIuaGFuZGxlRXJyb3IoZSkpO1xuICAgICAgICAvLyByZXRocm93IGFzIHRoZSBleGNlcHRpb24gaGFuZGxlciBtaWdodCBub3QgZG8gaXRcbiAgICAgICAgdGhyb3cgZTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHJldHVybiByZXN1bHQ7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICBuZ1pvbmUucnVuT3V0c2lkZUFuZ3VsYXIoKCkgPT4gZXJyb3JIYW5kbGVyLmhhbmRsZUVycm9yKGUpKTtcbiAgICAvLyByZXRocm93IGFzIHRoZSBleGNlcHRpb24gaGFuZGxlciBtaWdodCBub3QgZG8gaXRcbiAgICB0aHJvdyBlO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBvcHRpb25zUmVkdWNlcjxUIGV4dGVuZHMgT2JqZWN0Pihkc3Q6IFQsIG9ianM6IFR8VFtdKTogVCB7XG4gIGlmIChBcnJheS5pc0FycmF5KG9ianMpKSB7XG4gICAgcmV0dXJuIG9ianMucmVkdWNlKG9wdGlvbnNSZWR1Y2VyLCBkc3QpO1xuICB9XG4gIHJldHVybiB7Li4uZHN0LCAuLi5vYmpzfTtcbn1cblxuLyoqXG4gKiBBIHJlZmVyZW5jZSB0byBhbiBBbmd1bGFyIGFwcGxpY2F0aW9uIHJ1bm5pbmcgb24gYSBwYWdlLlxuICpcbiAqIEB1c2FnZU5vdGVzXG4gKiB7QGEgaXMtc3RhYmxlLWV4YW1wbGVzfVxuICogIyMjIGlzU3RhYmxlIGV4YW1wbGVzIGFuZCBjYXZlYXRzXG4gKlxuICogTm90ZSB0d28gaW1wb3J0YW50IHBvaW50cyBhYm91dCBgaXNTdGFibGVgLCBkZW1vbnN0cmF0ZWQgaW4gdGhlIGV4YW1wbGVzIGJlbG93OlxuICogLSB0aGUgYXBwbGljYXRpb24gd2lsbCBuZXZlciBiZSBzdGFibGUgaWYgeW91IHN0YXJ0IGFueSBraW5kXG4gKiBvZiByZWN1cnJlbnQgYXN5bmNocm9ub3VzIHRhc2sgd2hlbiB0aGUgYXBwbGljYXRpb24gc3RhcnRzXG4gKiAoZm9yIGV4YW1wbGUgZm9yIGEgcG9sbGluZyBwcm9jZXNzLCBzdGFydGVkIHdpdGggYSBgc2V0SW50ZXJ2YWxgLCBhIGBzZXRUaW1lb3V0YFxuICogb3IgdXNpbmcgUnhKUyBvcGVyYXRvcnMgbGlrZSBgaW50ZXJ2YWxgKTtcbiAqIC0gdGhlIGBpc1N0YWJsZWAgT2JzZXJ2YWJsZSBydW5zIG91dHNpZGUgb2YgdGhlIEFuZ3VsYXIgem9uZS5cbiAqXG4gKiBMZXQncyBpbWFnaW5lIHRoYXQgeW91IHN0YXJ0IGEgcmVjdXJyZW50IHRhc2tcbiAqIChoZXJlIGluY3JlbWVudGluZyBhIGNvdW50ZXIsIHVzaW5nIFJ4SlMgYGludGVydmFsYCksXG4gKiBhbmQgYXQgdGhlIHNhbWUgdGltZSBzdWJzY3JpYmUgdG8gYGlzU3RhYmxlYC5cbiAqXG4gKiBgYGBcbiAqIGNvbnN0cnVjdG9yKGFwcFJlZjogQXBwbGljYXRpb25SZWYpIHtcbiAqICAgYXBwUmVmLmlzU3RhYmxlLnBpcGUoXG4gKiAgICAgIGZpbHRlcihzdGFibGUgPT4gc3RhYmxlKVxuICogICApLnN1YnNjcmliZSgoKSA9PiBjb25zb2xlLmxvZygnQXBwIGlzIHN0YWJsZSBub3cnKTtcbiAqICAgaW50ZXJ2YWwoMTAwMCkuc3Vic2NyaWJlKGNvdW50ZXIgPT4gY29uc29sZS5sb2coY291bnRlcikpO1xuICogfVxuICogYGBgXG4gKiBJbiB0aGlzIGV4YW1wbGUsIGBpc1N0YWJsZWAgd2lsbCBuZXZlciBlbWl0IGB0cnVlYCxcbiAqIGFuZCB0aGUgdHJhY2UgXCJBcHAgaXMgc3RhYmxlIG5vd1wiIHdpbGwgbmV2ZXIgZ2V0IGxvZ2dlZC5cbiAqXG4gKiBJZiB5b3Ugd2FudCB0byBleGVjdXRlIHNvbWV0aGluZyB3aGVuIHRoZSBhcHAgaXMgc3RhYmxlLFxuICogeW91IGhhdmUgdG8gd2FpdCBmb3IgdGhlIGFwcGxpY2F0aW9uIHRvIGJlIHN0YWJsZVxuICogYmVmb3JlIHN0YXJ0aW5nIHlvdXIgcG9sbGluZyBwcm9jZXNzLlxuICpcbiAqIGBgYFxuICogY29uc3RydWN0b3IoYXBwUmVmOiBBcHBsaWNhdGlvblJlZikge1xuICogICBhcHBSZWYuaXNTdGFibGUucGlwZShcbiAqICAgICBmaXJzdChzdGFibGUgPT4gc3RhYmxlKSxcbiAqICAgICB0YXAoc3RhYmxlID0+IGNvbnNvbGUubG9nKCdBcHAgaXMgc3RhYmxlIG5vdycpKSxcbiAqICAgICBzd2l0Y2hNYXAoKCkgPT4gaW50ZXJ2YWwoMTAwMCkpXG4gKiAgICkuc3Vic2NyaWJlKGNvdW50ZXIgPT4gY29uc29sZS5sb2coY291bnRlcikpO1xuICogfVxuICogYGBgXG4gKiBJbiB0aGlzIGV4YW1wbGUsIHRoZSB0cmFjZSBcIkFwcCBpcyBzdGFibGUgbm93XCIgd2lsbCBiZSBsb2dnZWRcbiAqIGFuZCB0aGVuIHRoZSBjb3VudGVyIHN0YXJ0cyBpbmNyZW1lbnRpbmcgZXZlcnkgc2Vjb25kLlxuICpcbiAqIE5vdGUgYWxzbyB0aGF0IHRoaXMgT2JzZXJ2YWJsZSBydW5zIG91dHNpZGUgb2YgdGhlIEFuZ3VsYXIgem9uZSxcbiAqIHdoaWNoIG1lYW5zIHRoYXQgdGhlIGNvZGUgaW4gdGhlIHN1YnNjcmlwdGlvblxuICogdG8gdGhpcyBPYnNlcnZhYmxlIHdpbGwgbm90IHRyaWdnZXIgdGhlIGNoYW5nZSBkZXRlY3Rpb24uXG4gKlxuICogTGV0J3MgaW1hZ2luZSB0aGF0IGluc3RlYWQgb2YgbG9nZ2luZyB0aGUgY291bnRlciB2YWx1ZSxcbiAqIHlvdSB1cGRhdGUgYSBmaWVsZCBvZiB5b3VyIGNvbXBvbmVudFxuICogYW5kIGRpc3BsYXkgaXQgaW4gaXRzIHRlbXBsYXRlLlxuICpcbiAqIGBgYFxuICogY29uc3RydWN0b3IoYXBwUmVmOiBBcHBsaWNhdGlvblJlZikge1xuICogICBhcHBSZWYuaXNTdGFibGUucGlwZShcbiAqICAgICBmaXJzdChzdGFibGUgPT4gc3RhYmxlKSxcbiAqICAgICBzd2l0Y2hNYXAoKCkgPT4gaW50ZXJ2YWwoMTAwMCkpXG4gKiAgICkuc3Vic2NyaWJlKGNvdW50ZXIgPT4gdGhpcy52YWx1ZSA9IGNvdW50ZXIpO1xuICogfVxuICogYGBgXG4gKiBBcyB0aGUgYGlzU3RhYmxlYCBPYnNlcnZhYmxlIHJ1bnMgb3V0c2lkZSB0aGUgem9uZSxcbiAqIHRoZSBgdmFsdWVgIGZpZWxkIHdpbGwgYmUgdXBkYXRlZCBwcm9wZXJseSxcbiAqIGJ1dCB0aGUgdGVtcGxhdGUgd2lsbCBub3QgYmUgcmVmcmVzaGVkIVxuICpcbiAqIFlvdSdsbCBoYXZlIHRvIG1hbnVhbGx5IHRyaWdnZXIgdGhlIGNoYW5nZSBkZXRlY3Rpb24gdG8gdXBkYXRlIHRoZSB0ZW1wbGF0ZS5cbiAqXG4gKiBgYGBcbiAqIGNvbnN0cnVjdG9yKGFwcFJlZjogQXBwbGljYXRpb25SZWYsIGNkOiBDaGFuZ2VEZXRlY3RvclJlZikge1xuICogICBhcHBSZWYuaXNTdGFibGUucGlwZShcbiAqICAgICBmaXJzdChzdGFibGUgPT4gc3RhYmxlKSxcbiAqICAgICBzd2l0Y2hNYXAoKCkgPT4gaW50ZXJ2YWwoMTAwMCkpXG4gKiAgICkuc3Vic2NyaWJlKGNvdW50ZXIgPT4ge1xuICogICAgIHRoaXMudmFsdWUgPSBjb3VudGVyO1xuICogICAgIGNkLmRldGVjdENoYW5nZXMoKTtcbiAqICAgfSk7XG4gKiB9XG4gKiBgYGBcbiAqXG4gKiBPciBtYWtlIHRoZSBzdWJzY3JpcHRpb24gY2FsbGJhY2sgcnVuIGluc2lkZSB0aGUgem9uZS5cbiAqXG4gKiBgYGBcbiAqIGNvbnN0cnVjdG9yKGFwcFJlZjogQXBwbGljYXRpb25SZWYsIHpvbmU6IE5nWm9uZSkge1xuICogICBhcHBSZWYuaXNTdGFibGUucGlwZShcbiAqICAgICBmaXJzdChzdGFibGUgPT4gc3RhYmxlKSxcbiAqICAgICBzd2l0Y2hNYXAoKCkgPT4gaW50ZXJ2YWwoMTAwMCkpXG4gKiAgICkuc3Vic2NyaWJlKGNvdW50ZXIgPT4gem9uZS5ydW4oKCkgPT4gdGhpcy52YWx1ZSA9IGNvdW50ZXIpKTtcbiAqIH1cbiAqIGBgYFxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuQEluamVjdGFibGUoe3Byb3ZpZGVkSW46ICdyb290J30pXG5leHBvcnQgY2xhc3MgQXBwbGljYXRpb25SZWYge1xuICAvKiogQGludGVybmFsICovXG4gIHByaXZhdGUgX2Jvb3RzdHJhcExpc3RlbmVyczogKChjb21wUmVmOiBDb21wb25lbnRSZWY8YW55PikgPT4gdm9pZClbXSA9IFtdO1xuICBwcml2YXRlIF9ydW5uaW5nVGljazogYm9vbGVhbiA9IGZhbHNlO1xuICBwcml2YXRlIF9kZXN0cm95ZWQgPSBmYWxzZTtcbiAgcHJpdmF0ZSBfZGVzdHJveUxpc3RlbmVyczogQXJyYXk8KCkgPT4gdm9pZD4gPSBbXTtcbiAgLyoqIEBpbnRlcm5hbCAqL1xuICBfdmlld3M6IEludGVybmFsVmlld1JlZjx1bmtub3duPltdID0gW107XG4gIHByaXZhdGUgcmVhZG9ubHkgaW50ZXJuYWxFcnJvckhhbmRsZXIgPSBpbmplY3QoSU5URVJOQUxfQVBQTElDQVRJT05fRVJST1JfSEFORExFUik7XG4gIHByaXZhdGUgcmVhZG9ubHkgYWZ0ZXJSZW5kZXJFZmZlY3RNYW5hZ2VyID0gaW5qZWN0KEFmdGVyUmVuZGVyRXZlbnRNYW5hZ2VyKTtcblxuICAvKipcbiAgICogSW5kaWNhdGVzIHdoZXRoZXIgdGhpcyBpbnN0YW5jZSB3YXMgZGVzdHJveWVkLlxuICAgKi9cbiAgZ2V0IGRlc3Ryb3llZCgpIHtcbiAgICByZXR1cm4gdGhpcy5fZGVzdHJveWVkO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBhIGxpc3Qgb2YgY29tcG9uZW50IHR5cGVzIHJlZ2lzdGVyZWQgdG8gdGhpcyBhcHBsaWNhdGlvbi5cbiAgICogVGhpcyBsaXN0IGlzIHBvcHVsYXRlZCBldmVuIGJlZm9yZSB0aGUgY29tcG9uZW50IGlzIGNyZWF0ZWQuXG4gICAqL1xuICBwdWJsaWMgcmVhZG9ubHkgY29tcG9uZW50VHlwZXM6IFR5cGU8YW55PltdID0gW107XG5cbiAgLyoqXG4gICAqIEdldCBhIGxpc3Qgb2YgY29tcG9uZW50cyByZWdpc3RlcmVkIHRvIHRoaXMgYXBwbGljYXRpb24uXG4gICAqL1xuICBwdWJsaWMgcmVhZG9ubHkgY29tcG9uZW50czogQ29tcG9uZW50UmVmPGFueT5bXSA9IFtdO1xuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGFuIE9ic2VydmFibGUgdGhhdCBpbmRpY2F0ZXMgd2hlbiB0aGUgYXBwbGljYXRpb24gaXMgc3RhYmxlIG9yIHVuc3RhYmxlLlxuICAgKi9cbiAgcHVibGljIHJlYWRvbmx5IGlzU3RhYmxlOiBPYnNlcnZhYmxlPGJvb2xlYW4+ID1cbiAgICAgIGluamVjdChQZW5kaW5nVGFza3MpLmhhc1BlbmRpbmdUYXNrcy5waXBlKG1hcChwZW5kaW5nID0+ICFwZW5kaW5nKSk7XG5cbiAgcHJpdmF0ZSByZWFkb25seSBfaW5qZWN0b3IgPSBpbmplY3QoRW52aXJvbm1lbnRJbmplY3Rvcik7XG4gIC8qKlxuICAgKiBUaGUgYEVudmlyb25tZW50SW5qZWN0b3JgIHVzZWQgdG8gY3JlYXRlIHRoaXMgYXBwbGljYXRpb24uXG4gICAqL1xuICBnZXQgaW5qZWN0b3IoKTogRW52aXJvbm1lbnRJbmplY3RvciB7XG4gICAgcmV0dXJuIHRoaXMuX2luamVjdG9yO1xuICB9XG5cbiAgLyoqXG4gICAqIEJvb3RzdHJhcCBhIGNvbXBvbmVudCBvbnRvIHRoZSBlbGVtZW50IGlkZW50aWZpZWQgYnkgaXRzIHNlbGVjdG9yIG9yLCBvcHRpb25hbGx5LCB0byBhXG4gICAqIHNwZWNpZmllZCBlbGVtZW50LlxuICAgKlxuICAgKiBAdXNhZ2VOb3Rlc1xuICAgKiAjIyMgQm9vdHN0cmFwIHByb2Nlc3NcbiAgICpcbiAgICogV2hlbiBib290c3RyYXBwaW5nIGEgY29tcG9uZW50LCBBbmd1bGFyIG1vdW50cyBpdCBvbnRvIGEgdGFyZ2V0IERPTSBlbGVtZW50XG4gICAqIGFuZCBraWNrcyBvZmYgYXV0b21hdGljIGNoYW5nZSBkZXRlY3Rpb24uIFRoZSB0YXJnZXQgRE9NIGVsZW1lbnQgY2FuIGJlXG4gICAqIHByb3ZpZGVkIHVzaW5nIHRoZSBgcm9vdFNlbGVjdG9yT3JOb2RlYCBhcmd1bWVudC5cbiAgICpcbiAgICogSWYgdGhlIHRhcmdldCBET00gZWxlbWVudCBpcyBub3QgcHJvdmlkZWQsIEFuZ3VsYXIgdHJpZXMgdG8gZmluZCBvbmUgb24gYSBwYWdlXG4gICAqIHVzaW5nIHRoZSBgc2VsZWN0b3JgIG9mIHRoZSBjb21wb25lbnQgdGhhdCBpcyBiZWluZyBib290c3RyYXBwZWRcbiAgICogKGZpcnN0IG1hdGNoZWQgZWxlbWVudCBpcyB1c2VkKS5cbiAgICpcbiAgICogIyMjIEV4YW1wbGVcbiAgICpcbiAgICogR2VuZXJhbGx5LCB3ZSBkZWZpbmUgdGhlIGNvbXBvbmVudCB0byBib290c3RyYXAgaW4gdGhlIGBib290c3RyYXBgIGFycmF5IG9mIGBOZ01vZHVsZWAsXG4gICAqIGJ1dCBpdCByZXF1aXJlcyB1cyB0byBrbm93IHRoZSBjb21wb25lbnQgd2hpbGUgd3JpdGluZyB0aGUgYXBwbGljYXRpb24gY29kZS5cbiAgICpcbiAgICogSW1hZ2luZSBhIHNpdHVhdGlvbiB3aGVyZSB3ZSBoYXZlIHRvIHdhaXQgZm9yIGFuIEFQSSBjYWxsIHRvIGRlY2lkZSBhYm91dCB0aGUgY29tcG9uZW50IHRvXG4gICAqIGJvb3RzdHJhcC4gV2UgY2FuIHVzZSB0aGUgYG5nRG9Cb290c3RyYXBgIGhvb2sgb2YgdGhlIGBOZ01vZHVsZWAgYW5kIGNhbGwgdGhpcyBtZXRob2QgdG9cbiAgICogZHluYW1pY2FsbHkgYm9vdHN0cmFwIGEgY29tcG9uZW50LlxuICAgKlxuICAgKiB7QGV4YW1wbGUgY29yZS90cy9wbGF0Zm9ybS9wbGF0Zm9ybS50cyByZWdpb249J2NvbXBvbmVudFNlbGVjdG9yJ31cbiAgICpcbiAgICogT3B0aW9uYWxseSwgYSBjb21wb25lbnQgY2FuIGJlIG1vdW50ZWQgb250byBhIERPTSBlbGVtZW50IHRoYXQgZG9lcyBub3QgbWF0Y2ggdGhlXG4gICAqIHNlbGVjdG9yIG9mIHRoZSBib290c3RyYXBwZWQgY29tcG9uZW50LlxuICAgKlxuICAgKiBJbiB0aGUgZm9sbG93aW5nIGV4YW1wbGUsIHdlIGFyZSBwcm92aWRpbmcgYSBDU1Mgc2VsZWN0b3IgdG8gbWF0Y2ggdGhlIHRhcmdldCBlbGVtZW50LlxuICAgKlxuICAgKiB7QGV4YW1wbGUgY29yZS90cy9wbGF0Zm9ybS9wbGF0Zm9ybS50cyByZWdpb249J2Nzc1NlbGVjdG9yJ31cbiAgICpcbiAgICogV2hpbGUgaW4gdGhpcyBleGFtcGxlLCB3ZSBhcmUgcHJvdmlkaW5nIHJlZmVyZW5jZSB0byBhIERPTSBub2RlLlxuICAgKlxuICAgKiB7QGV4YW1wbGUgY29yZS90cy9wbGF0Zm9ybS9wbGF0Zm9ybS50cyByZWdpb249J2RvbU5vZGUnfVxuICAgKi9cbiAgYm9vdHN0cmFwPEM+KGNvbXBvbmVudDogVHlwZTxDPiwgcm9vdFNlbGVjdG9yT3JOb2RlPzogc3RyaW5nfGFueSk6IENvbXBvbmVudFJlZjxDPjtcblxuICAvKipcbiAgICogQm9vdHN0cmFwIGEgY29tcG9uZW50IG9udG8gdGhlIGVsZW1lbnQgaWRlbnRpZmllZCBieSBpdHMgc2VsZWN0b3Igb3IsIG9wdGlvbmFsbHksIHRvIGFcbiAgICogc3BlY2lmaWVkIGVsZW1lbnQuXG4gICAqXG4gICAqIEB1c2FnZU5vdGVzXG4gICAqICMjIyBCb290c3RyYXAgcHJvY2Vzc1xuICAgKlxuICAgKiBXaGVuIGJvb3RzdHJhcHBpbmcgYSBjb21wb25lbnQsIEFuZ3VsYXIgbW91bnRzIGl0IG9udG8gYSB0YXJnZXQgRE9NIGVsZW1lbnRcbiAgICogYW5kIGtpY2tzIG9mZiBhdXRvbWF0aWMgY2hhbmdlIGRldGVjdGlvbi4gVGhlIHRhcmdldCBET00gZWxlbWVudCBjYW4gYmVcbiAgICogcHJvdmlkZWQgdXNpbmcgdGhlIGByb290U2VsZWN0b3JPck5vZGVgIGFyZ3VtZW50LlxuICAgKlxuICAgKiBJZiB0aGUgdGFyZ2V0IERPTSBlbGVtZW50IGlzIG5vdCBwcm92aWRlZCwgQW5ndWxhciB0cmllcyB0byBmaW5kIG9uZSBvbiBhIHBhZ2VcbiAgICogdXNpbmcgdGhlIGBzZWxlY3RvcmAgb2YgdGhlIGNvbXBvbmVudCB0aGF0IGlzIGJlaW5nIGJvb3RzdHJhcHBlZFxuICAgKiAoZmlyc3QgbWF0Y2hlZCBlbGVtZW50IGlzIHVzZWQpLlxuICAgKlxuICAgKiAjIyMgRXhhbXBsZVxuICAgKlxuICAgKiBHZW5lcmFsbHksIHdlIGRlZmluZSB0aGUgY29tcG9uZW50IHRvIGJvb3RzdHJhcCBpbiB0aGUgYGJvb3RzdHJhcGAgYXJyYXkgb2YgYE5nTW9kdWxlYCxcbiAgICogYnV0IGl0IHJlcXVpcmVzIHVzIHRvIGtub3cgdGhlIGNvbXBvbmVudCB3aGlsZSB3cml0aW5nIHRoZSBhcHBsaWNhdGlvbiBjb2RlLlxuICAgKlxuICAgKiBJbWFnaW5lIGEgc2l0dWF0aW9uIHdoZXJlIHdlIGhhdmUgdG8gd2FpdCBmb3IgYW4gQVBJIGNhbGwgdG8gZGVjaWRlIGFib3V0IHRoZSBjb21wb25lbnQgdG9cbiAgICogYm9vdHN0cmFwLiBXZSBjYW4gdXNlIHRoZSBgbmdEb0Jvb3RzdHJhcGAgaG9vayBvZiB0aGUgYE5nTW9kdWxlYCBhbmQgY2FsbCB0aGlzIG1ldGhvZCB0b1xuICAgKiBkeW5hbWljYWxseSBib290c3RyYXAgYSBjb21wb25lbnQuXG4gICAqXG4gICAqIHtAZXhhbXBsZSBjb3JlL3RzL3BsYXRmb3JtL3BsYXRmb3JtLnRzIHJlZ2lvbj0nY29tcG9uZW50U2VsZWN0b3InfVxuICAgKlxuICAgKiBPcHRpb25hbGx5LCBhIGNvbXBvbmVudCBjYW4gYmUgbW91bnRlZCBvbnRvIGEgRE9NIGVsZW1lbnQgdGhhdCBkb2VzIG5vdCBtYXRjaCB0aGVcbiAgICogc2VsZWN0b3Igb2YgdGhlIGJvb3RzdHJhcHBlZCBjb21wb25lbnQuXG4gICAqXG4gICAqIEluIHRoZSBmb2xsb3dpbmcgZXhhbXBsZSwgd2UgYXJlIHByb3ZpZGluZyBhIENTUyBzZWxlY3RvciB0byBtYXRjaCB0aGUgdGFyZ2V0IGVsZW1lbnQuXG4gICAqXG4gICAqIHtAZXhhbXBsZSBjb3JlL3RzL3BsYXRmb3JtL3BsYXRmb3JtLnRzIHJlZ2lvbj0nY3NzU2VsZWN0b3InfVxuICAgKlxuICAgKiBXaGlsZSBpbiB0aGlzIGV4YW1wbGUsIHdlIGFyZSBwcm92aWRpbmcgcmVmZXJlbmNlIHRvIGEgRE9NIG5vZGUuXG4gICAqXG4gICAqIHtAZXhhbXBsZSBjb3JlL3RzL3BsYXRmb3JtL3BsYXRmb3JtLnRzIHJlZ2lvbj0nZG9tTm9kZSd9XG4gICAqXG4gICAqIEBkZXByZWNhdGVkIFBhc3NpbmcgQ29tcG9uZW50IGZhY3RvcmllcyBhcyB0aGUgYEFwcGxpY2F0aW9uLmJvb3RzdHJhcGAgZnVuY3Rpb24gYXJndW1lbnQgaXNcbiAgICogICAgIGRlcHJlY2F0ZWQuIFBhc3MgQ29tcG9uZW50IFR5cGVzIGluc3RlYWQuXG4gICAqL1xuICBib290c3RyYXA8Qz4oY29tcG9uZW50RmFjdG9yeTogQ29tcG9uZW50RmFjdG9yeTxDPiwgcm9vdFNlbGVjdG9yT3JOb2RlPzogc3RyaW5nfGFueSk6XG4gICAgICBDb21wb25lbnRSZWY8Qz47XG5cbiAgLyoqXG4gICAqIEJvb3RzdHJhcCBhIGNvbXBvbmVudCBvbnRvIHRoZSBlbGVtZW50IGlkZW50aWZpZWQgYnkgaXRzIHNlbGVjdG9yIG9yLCBvcHRpb25hbGx5LCB0byBhXG4gICAqIHNwZWNpZmllZCBlbGVtZW50LlxuICAgKlxuICAgKiBAdXNhZ2VOb3Rlc1xuICAgKiAjIyMgQm9vdHN0cmFwIHByb2Nlc3NcbiAgICpcbiAgICogV2hlbiBib290c3RyYXBwaW5nIGEgY29tcG9uZW50LCBBbmd1bGFyIG1vdW50cyBpdCBvbnRvIGEgdGFyZ2V0IERPTSBlbGVtZW50XG4gICAqIGFuZCBraWNrcyBvZmYgYXV0b21hdGljIGNoYW5nZSBkZXRlY3Rpb24uIFRoZSB0YXJnZXQgRE9NIGVsZW1lbnQgY2FuIGJlXG4gICAqIHByb3ZpZGVkIHVzaW5nIHRoZSBgcm9vdFNlbGVjdG9yT3JOb2RlYCBhcmd1bWVudC5cbiAgICpcbiAgICogSWYgdGhlIHRhcmdldCBET00gZWxlbWVudCBpcyBub3QgcHJvdmlkZWQsIEFuZ3VsYXIgdHJpZXMgdG8gZmluZCBvbmUgb24gYSBwYWdlXG4gICAqIHVzaW5nIHRoZSBgc2VsZWN0b3JgIG9mIHRoZSBjb21wb25lbnQgdGhhdCBpcyBiZWluZyBib290c3RyYXBwZWRcbiAgICogKGZpcnN0IG1hdGNoZWQgZWxlbWVudCBpcyB1c2VkKS5cbiAgICpcbiAgICogIyMjIEV4YW1wbGVcbiAgICpcbiAgICogR2VuZXJhbGx5LCB3ZSBkZWZpbmUgdGhlIGNvbXBvbmVudCB0byBib290c3RyYXAgaW4gdGhlIGBib290c3RyYXBgIGFycmF5IG9mIGBOZ01vZHVsZWAsXG4gICAqIGJ1dCBpdCByZXF1aXJlcyB1cyB0byBrbm93IHRoZSBjb21wb25lbnQgd2hpbGUgd3JpdGluZyB0aGUgYXBwbGljYXRpb24gY29kZS5cbiAgICpcbiAgICogSW1hZ2luZSBhIHNpdHVhdGlvbiB3aGVyZSB3ZSBoYXZlIHRvIHdhaXQgZm9yIGFuIEFQSSBjYWxsIHRvIGRlY2lkZSBhYm91dCB0aGUgY29tcG9uZW50IHRvXG4gICAqIGJvb3RzdHJhcC4gV2UgY2FuIHVzZSB0aGUgYG5nRG9Cb290c3RyYXBgIGhvb2sgb2YgdGhlIGBOZ01vZHVsZWAgYW5kIGNhbGwgdGhpcyBtZXRob2QgdG9cbiAgICogZHluYW1pY2FsbHkgYm9vdHN0cmFwIGEgY29tcG9uZW50LlxuICAgKlxuICAgKiB7QGV4YW1wbGUgY29yZS90cy9wbGF0Zm9ybS9wbGF0Zm9ybS50cyByZWdpb249J2NvbXBvbmVudFNlbGVjdG9yJ31cbiAgICpcbiAgICogT3B0aW9uYWxseSwgYSBjb21wb25lbnQgY2FuIGJlIG1vdW50ZWQgb250byBhIERPTSBlbGVtZW50IHRoYXQgZG9lcyBub3QgbWF0Y2ggdGhlXG4gICAqIHNlbGVjdG9yIG9mIHRoZSBib290c3RyYXBwZWQgY29tcG9uZW50LlxuICAgKlxuICAgKiBJbiB0aGUgZm9sbG93aW5nIGV4YW1wbGUsIHdlIGFyZSBwcm92aWRpbmcgYSBDU1Mgc2VsZWN0b3IgdG8gbWF0Y2ggdGhlIHRhcmdldCBlbGVtZW50LlxuICAgKlxuICAgKiB7QGV4YW1wbGUgY29yZS90cy9wbGF0Zm9ybS9wbGF0Zm9ybS50cyByZWdpb249J2Nzc1NlbGVjdG9yJ31cbiAgICpcbiAgICogV2hpbGUgaW4gdGhpcyBleGFtcGxlLCB3ZSBhcmUgcHJvdmlkaW5nIHJlZmVyZW5jZSB0byBhIERPTSBub2RlLlxuICAgKlxuICAgKiB7QGV4YW1wbGUgY29yZS90cy9wbGF0Zm9ybS9wbGF0Zm9ybS50cyByZWdpb249J2RvbU5vZGUnfVxuICAgKi9cbiAgYm9vdHN0cmFwPEM+KGNvbXBvbmVudE9yRmFjdG9yeTogQ29tcG9uZW50RmFjdG9yeTxDPnxUeXBlPEM+LCByb290U2VsZWN0b3JPck5vZGU/OiBzdHJpbmd8YW55KTpcbiAgICAgIENvbXBvbmVudFJlZjxDPiB7XG4gICAgKHR5cGVvZiBuZ0Rldk1vZGUgPT09ICd1bmRlZmluZWQnIHx8IG5nRGV2TW9kZSkgJiYgdGhpcy53YXJuSWZEZXN0cm95ZWQoKTtcbiAgICBjb25zdCBpc0NvbXBvbmVudEZhY3RvcnkgPSBjb21wb25lbnRPckZhY3RvcnkgaW5zdGFuY2VvZiBDb21wb25lbnRGYWN0b3J5O1xuICAgIGNvbnN0IGluaXRTdGF0dXMgPSB0aGlzLl9pbmplY3Rvci5nZXQoQXBwbGljYXRpb25Jbml0U3RhdHVzKTtcblxuICAgIGlmICghaW5pdFN0YXR1cy5kb25lKSB7XG4gICAgICBjb25zdCBzdGFuZGFsb25lID0gIWlzQ29tcG9uZW50RmFjdG9yeSAmJiBpc1N0YW5kYWxvbmUoY29tcG9uZW50T3JGYWN0b3J5KTtcbiAgICAgIGNvbnN0IGVycm9yTWVzc2FnZSA9ICh0eXBlb2YgbmdEZXZNb2RlID09PSAndW5kZWZpbmVkJyB8fCBuZ0Rldk1vZGUpICYmXG4gICAgICAgICAgJ0Nhbm5vdCBib290c3RyYXAgYXMgdGhlcmUgYXJlIHN0aWxsIGFzeW5jaHJvbm91cyBpbml0aWFsaXplcnMgcnVubmluZy4nICtcbiAgICAgICAgICAgICAgKHN0YW5kYWxvbmUgP1xuICAgICAgICAgICAgICAgICAgICcnIDpcbiAgICAgICAgICAgICAgICAgICAnIEJvb3RzdHJhcCBjb21wb25lbnRzIGluIHRoZSBgbmdEb0Jvb3RzdHJhcGAgbWV0aG9kIG9mIHRoZSByb290IG1vZHVsZS4nKTtcbiAgICAgIHRocm93IG5ldyBSdW50aW1lRXJyb3IoUnVudGltZUVycm9yQ29kZS5BU1lOQ19JTklUSUFMSVpFUlNfU1RJTExfUlVOTklORywgZXJyb3JNZXNzYWdlKTtcbiAgICB9XG5cbiAgICBsZXQgY29tcG9uZW50RmFjdG9yeTogQ29tcG9uZW50RmFjdG9yeTxDPjtcbiAgICBpZiAoaXNDb21wb25lbnRGYWN0b3J5KSB7XG4gICAgICBjb21wb25lbnRGYWN0b3J5ID0gY29tcG9uZW50T3JGYWN0b3J5O1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCByZXNvbHZlciA9IHRoaXMuX2luamVjdG9yLmdldChDb21wb25lbnRGYWN0b3J5UmVzb2x2ZXIpO1xuICAgICAgY29tcG9uZW50RmFjdG9yeSA9IHJlc29sdmVyLnJlc29sdmVDb21wb25lbnRGYWN0b3J5KGNvbXBvbmVudE9yRmFjdG9yeSkhO1xuICAgIH1cbiAgICB0aGlzLmNvbXBvbmVudFR5cGVzLnB1c2goY29tcG9uZW50RmFjdG9yeS5jb21wb25lbnRUeXBlKTtcblxuICAgIC8vIENyZWF0ZSBhIGZhY3RvcnkgYXNzb2NpYXRlZCB3aXRoIHRoZSBjdXJyZW50IG1vZHVsZSBpZiBpdCdzIG5vdCBib3VuZCB0byBzb21lIG90aGVyXG4gICAgY29uc3QgbmdNb2R1bGUgPVxuICAgICAgICBpc0JvdW5kVG9Nb2R1bGUoY29tcG9uZW50RmFjdG9yeSkgPyB1bmRlZmluZWQgOiB0aGlzLl9pbmplY3Rvci5nZXQoTmdNb2R1bGVSZWYpO1xuICAgIGNvbnN0IHNlbGVjdG9yT3JOb2RlID0gcm9vdFNlbGVjdG9yT3JOb2RlIHx8IGNvbXBvbmVudEZhY3Rvcnkuc2VsZWN0b3I7XG4gICAgY29uc3QgY29tcFJlZiA9IGNvbXBvbmVudEZhY3RvcnkuY3JlYXRlKEluamVjdG9yLk5VTEwsIFtdLCBzZWxlY3Rvck9yTm9kZSwgbmdNb2R1bGUpO1xuICAgIGNvbnN0IG5hdGl2ZUVsZW1lbnQgPSBjb21wUmVmLmxvY2F0aW9uLm5hdGl2ZUVsZW1lbnQ7XG4gICAgY29uc3QgdGVzdGFiaWxpdHkgPSBjb21wUmVmLmluamVjdG9yLmdldChURVNUQUJJTElUWSwgbnVsbCk7XG4gICAgdGVzdGFiaWxpdHk/LnJlZ2lzdGVyQXBwbGljYXRpb24obmF0aXZlRWxlbWVudCk7XG5cbiAgICBjb21wUmVmLm9uRGVzdHJveSgoKSA9PiB7XG4gICAgICB0aGlzLmRldGFjaFZpZXcoY29tcFJlZi5ob3N0Vmlldyk7XG4gICAgICByZW1vdmUodGhpcy5jb21wb25lbnRzLCBjb21wUmVmKTtcbiAgICAgIHRlc3RhYmlsaXR5Py51bnJlZ2lzdGVyQXBwbGljYXRpb24obmF0aXZlRWxlbWVudCk7XG4gICAgfSk7XG5cbiAgICB0aGlzLl9sb2FkQ29tcG9uZW50KGNvbXBSZWYpO1xuICAgIGlmICh0eXBlb2YgbmdEZXZNb2RlID09PSAndW5kZWZpbmVkJyB8fCBuZ0Rldk1vZGUpIHtcbiAgICAgIGNvbnN0IF9jb25zb2xlID0gdGhpcy5faW5qZWN0b3IuZ2V0KENvbnNvbGUpO1xuICAgICAgX2NvbnNvbGUubG9nKGBBbmd1bGFyIGlzIHJ1bm5pbmcgaW4gZGV2ZWxvcG1lbnQgbW9kZS5gKTtcbiAgICB9XG4gICAgcmV0dXJuIGNvbXBSZWY7XG4gIH1cblxuICAvKipcbiAgICogSW52b2tlIHRoaXMgbWV0aG9kIHRvIGV4cGxpY2l0bHkgcHJvY2VzcyBjaGFuZ2UgZGV0ZWN0aW9uIGFuZCBpdHMgc2lkZS1lZmZlY3RzLlxuICAgKlxuICAgKiBJbiBkZXZlbG9wbWVudCBtb2RlLCBgdGljaygpYCBhbHNvIHBlcmZvcm1zIGEgc2Vjb25kIGNoYW5nZSBkZXRlY3Rpb24gY3ljbGUgdG8gZW5zdXJlIHRoYXQgbm9cbiAgICogZnVydGhlciBjaGFuZ2VzIGFyZSBkZXRlY3RlZC4gSWYgYWRkaXRpb25hbCBjaGFuZ2VzIGFyZSBwaWNrZWQgdXAgZHVyaW5nIHRoaXMgc2Vjb25kIGN5Y2xlLFxuICAgKiBiaW5kaW5ncyBpbiB0aGUgYXBwIGhhdmUgc2lkZS1lZmZlY3RzIHRoYXQgY2Fubm90IGJlIHJlc29sdmVkIGluIGEgc2luZ2xlIGNoYW5nZSBkZXRlY3Rpb25cbiAgICogcGFzcy5cbiAgICogSW4gdGhpcyBjYXNlLCBBbmd1bGFyIHRocm93cyBhbiBlcnJvciwgc2luY2UgYW4gQW5ndWxhciBhcHBsaWNhdGlvbiBjYW4gb25seSBoYXZlIG9uZSBjaGFuZ2VcbiAgICogZGV0ZWN0aW9uIHBhc3MgZHVyaW5nIHdoaWNoIGFsbCBjaGFuZ2UgZGV0ZWN0aW9uIG11c3QgY29tcGxldGUuXG4gICAqL1xuICB0aWNrKCk6IHZvaWQge1xuICAgICh0eXBlb2YgbmdEZXZNb2RlID09PSAndW5kZWZpbmVkJyB8fCBuZ0Rldk1vZGUpICYmIHRoaXMud2FybklmRGVzdHJveWVkKCk7XG4gICAgaWYgKHRoaXMuX3J1bm5pbmdUaWNrKSB7XG4gICAgICB0aHJvdyBuZXcgUnVudGltZUVycm9yKFxuICAgICAgICAgIFJ1bnRpbWVFcnJvckNvZGUuUkVDVVJTSVZFX0FQUExJQ0FUSU9OX1JFRl9USUNLLFxuICAgICAgICAgIG5nRGV2TW9kZSAmJiAnQXBwbGljYXRpb25SZWYudGljayBpcyBjYWxsZWQgcmVjdXJzaXZlbHknKTtcbiAgICB9XG5cbiAgICB0cnkge1xuICAgICAgdGhpcy5fcnVubmluZ1RpY2sgPSB0cnVlO1xuXG4gICAgICB0aGlzLmRldGVjdENoYW5nZXNJbkF0dGFjaGVkVmlld3MoKTtcblxuICAgICAgaWYgKCh0eXBlb2YgbmdEZXZNb2RlID09PSAndW5kZWZpbmVkJyB8fCBuZ0Rldk1vZGUpKSB7XG4gICAgICAgIGZvciAobGV0IHZpZXcgb2YgdGhpcy5fdmlld3MpIHtcbiAgICAgICAgICB2aWV3LmNoZWNrTm9DaGFuZ2VzKCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAvLyBBdHRlbnRpb246IERvbid0IHJldGhyb3cgYXMgaXQgY291bGQgY2FuY2VsIHN1YnNjcmlwdGlvbnMgdG8gT2JzZXJ2YWJsZXMhXG4gICAgICB0aGlzLmludGVybmFsRXJyb3JIYW5kbGVyKGUpO1xuICAgIH0gZmluYWxseSB7XG4gICAgICB0aGlzLl9ydW5uaW5nVGljayA9IGZhbHNlO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgZGV0ZWN0Q2hhbmdlc0luQXR0YWNoZWRWaWV3cygpIHtcbiAgICBsZXQgcnVucyA9IDA7XG4gICAgY29uc3QgYWZ0ZXJSZW5kZXJFZmZlY3RNYW5hZ2VyID0gdGhpcy5hZnRlclJlbmRlckVmZmVjdE1hbmFnZXI7XG4gICAgd2hpbGUgKHRydWUpIHtcbiAgICAgIGlmIChydW5zID09PSBNQVhJTVVNX1JFRlJFU0hfUkVSVU5TKSB7XG4gICAgICAgIHRocm93IG5ldyBSdW50aW1lRXJyb3IoXG4gICAgICAgICAgICBSdW50aW1lRXJyb3JDb2RlLklORklOSVRFX0NIQU5HRV9ERVRFQ1RJT04sXG4gICAgICAgICAgICBuZ0Rldk1vZGUgJiZcbiAgICAgICAgICAgICAgICAnSW5maW5pdGUgY2hhbmdlIGRldGVjdGlvbiB3aGlsZSByZWZyZXNoaW5nIGFwcGxpY2F0aW9uIHZpZXdzLiAnICtcbiAgICAgICAgICAgICAgICAgICAgJ0Vuc3VyZSBhZnRlclJlbmRlciBvciBxdWV1ZVN0YXRlVXBkYXRlIGhvb2tzIGFyZSBub3QgY29udGludW91c2x5IGNhdXNpbmcgdXBkYXRlcy4nKTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgaXNGaXJzdFBhc3MgPSBydW5zID09PSAwO1xuICAgICAgZm9yIChsZXQge19sVmlldywgbm90aWZ5RXJyb3JIYW5kbGVyfSBvZiB0aGlzLl92aWV3cykge1xuICAgICAgICAvLyBXaGVuIHJlLWNoZWNraW5nLCBvbmx5IGNoZWNrIHZpZXdzIHdoaWNoIGFjdHVhbGx5IG5lZWQgaXQuXG4gICAgICAgIGlmICghaXNGaXJzdFBhc3MgJiYgIXNob3VsZFJlY2hlY2tWaWV3KF9sVmlldykpIHtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmRldGVjdENoYW5nZXNJblZpZXcoX2xWaWV3LCBub3RpZnlFcnJvckhhbmRsZXIsIGlzRmlyc3RQYXNzKTtcbiAgICAgIH1cbiAgICAgIHJ1bnMrKztcblxuICAgICAgYWZ0ZXJSZW5kZXJFZmZlY3RNYW5hZ2VyLmV4ZWN1dGVJbnRlcm5hbENhbGxiYWNrcygpO1xuICAgICAgLy8gSWYgd2UgaGF2ZSBhIG5ld2x5IGRpcnR5IHZpZXcgYWZ0ZXIgcnVubmluZyBpbnRlcm5hbCBjYWxsYmFja3MsIHJlY2hlY2sgdGhlIHZpZXdzIGFnYWluXG4gICAgICAvLyBiZWZvcmUgcnVubmluZyB1c2VyLXByb3ZpZGVkIGNhbGxiYWNrc1xuICAgICAgaWYgKHRoaXMuX3ZpZXdzLnNvbWUoKHtfbFZpZXd9KSA9PiBzaG91bGRSZWNoZWNrVmlldyhfbFZpZXcpKSkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgYWZ0ZXJSZW5kZXJFZmZlY3RNYW5hZ2VyLmV4ZWN1dGUoKTtcbiAgICAgIC8vIElmIGFmdGVyIHJ1bm5pbmcgYWxsIGFmdGVyUmVuZGVyIGNhbGxiYWNrcyB3ZSBoYXZlIG5vIG1vcmUgdmlld3MgdGhhdCBuZWVkIHRvIGJlIHJlZnJlc2hlZCxcbiAgICAgIC8vIHdlIGNhbiBicmVhayBvdXQgb2YgdGhlIGxvb3BcbiAgICAgIGlmICghdGhpcy5fdmlld3Muc29tZSgoe19sVmlld30pID0+IHNob3VsZFJlY2hlY2tWaWV3KF9sVmlldykpKSB7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgZGV0ZWN0Q2hhbmdlc0luVmlldyhsVmlldzogTFZpZXcsIG5vdGlmeUVycm9ySGFuZGxlcjogYm9vbGVhbiwgaXNGaXJzdFBhc3M6IGJvb2xlYW4pIHtcbiAgICBsZXQgbW9kZTogQ2hhbmdlRGV0ZWN0aW9uTW9kZTtcbiAgICBpZiAoaXNGaXJzdFBhc3MpIHtcbiAgICAgIC8vIFRoZSBmaXJzdCBwYXNzIGlzIGFsd2F5cyBpbiBHbG9iYWwgbW9kZSwgd2hpY2ggaW5jbHVkZXMgYENoZWNrQWx3YXlzYCB2aWV3cy5cbiAgICAgIG1vZGUgPSBDaGFuZ2VEZXRlY3Rpb25Nb2RlLkdsb2JhbDtcbiAgICAgIC8vIEFkZCBgUmVmcmVzaFZpZXdgIGZsYWcgdG8gZW5zdXJlIHRoaXMgdmlldyBpcyByZWZyZXNoZWQgaWYgbm90IGFscmVhZHkgZGlydHkuXG4gICAgICAvLyBgUmVmcmVzaFZpZXdgIGZsYWcgaXMgdXNlZCBpbnRlbnRpb25hbGx5IG92ZXIgYERpcnR5YCBiZWNhdXNlIGl0IGdldHMgY2xlYXJlZCBiZWZvcmVcbiAgICAgIC8vIGV4ZWN1dGluZyBhbnkgb2YgdGhlIGFjdHVhbCByZWZyZXNoIGNvZGUgd2hpbGUgdGhlIGBEaXJ0eWAgZmxhZyBkb2Vzbid0IGdldCBjbGVhcmVkXG4gICAgICAvLyB1bnRpbCB0aGUgZW5kIG9mIHRoZSByZWZyZXNoLiBVc2luZyBgUmVmcmVzaFZpZXdgIHByZXZlbnRzIGNyZWF0aW5nIGEgcG90ZW50aWFsXG4gICAgICAvLyBkaWZmZXJlbmNlIGluIHRoZSBzdGF0ZSBvZiB0aGUgTFZpZXdGbGFncyBkdXJpbmcgdGVtcGxhdGUgZXhlY3V0aW9uLlxuICAgICAgbFZpZXdbRkxBR1NdIHw9IExWaWV3RmxhZ3MuUmVmcmVzaFZpZXc7XG4gICAgfSBlbHNlIGlmIChsVmlld1tGTEFHU10gJiBMVmlld0ZsYWdzLkRpcnR5KSB7XG4gICAgICAvLyBUaGUgcm9vdCB2aWV3IGhhcyBiZWVuIGV4cGxpY2l0bHkgbWFya2VkIGZvciBjaGVjaywgc28gY2hlY2sgaXQgaW4gR2xvYmFsIG1vZGUuXG4gICAgICBtb2RlID0gQ2hhbmdlRGV0ZWN0aW9uTW9kZS5HbG9iYWw7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIFRoZSB2aWV3IGhhcyBub3QgYmVlbiBtYXJrZWQgZm9yIGNoZWNrLCBidXQgY29udGFpbnMgYSB2aWV3IG1hcmtlZCBmb3IgcmVmcmVzaFxuICAgICAgLy8gKGxpa2VseSB2aWEgYSBzaWduYWwpLiBTdGFydCB0aGlzIGNoYW5nZSBkZXRlY3Rpb24gaW4gVGFyZ2V0ZWQgbW9kZSB0byBza2lwIHRoZSByb290XG4gICAgICAvLyB2aWV3IGFuZCBjaGVjayBqdXN0IHRoZSB2aWV3KHMpIHRoYXQgbmVlZCByZWZyZXNoZWQuXG4gICAgICBtb2RlID0gQ2hhbmdlRGV0ZWN0aW9uTW9kZS5UYXJnZXRlZDtcbiAgICB9XG4gICAgZGV0ZWN0Q2hhbmdlc0ludGVybmFsKGxWaWV3LCBub3RpZnlFcnJvckhhbmRsZXIsIG1vZGUpO1xuICB9XG5cbiAgLyoqXG4gICAqIEF0dGFjaGVzIGEgdmlldyBzbyB0aGF0IGl0IHdpbGwgYmUgZGlydHkgY2hlY2tlZC5cbiAgICogVGhlIHZpZXcgd2lsbCBiZSBhdXRvbWF0aWNhbGx5IGRldGFjaGVkIHdoZW4gaXQgaXMgZGVzdHJveWVkLlxuICAgKiBUaGlzIHdpbGwgdGhyb3cgaWYgdGhlIHZpZXcgaXMgYWxyZWFkeSBhdHRhY2hlZCB0byBhIFZpZXdDb250YWluZXIuXG4gICAqL1xuICBhdHRhY2hWaWV3KHZpZXdSZWY6IFZpZXdSZWYpOiB2b2lkIHtcbiAgICAodHlwZW9mIG5nRGV2TW9kZSA9PT0gJ3VuZGVmaW5lZCcgfHwgbmdEZXZNb2RlKSAmJiB0aGlzLndhcm5JZkRlc3Ryb3llZCgpO1xuICAgIGNvbnN0IHZpZXcgPSAodmlld1JlZiBhcyBJbnRlcm5hbFZpZXdSZWY8dW5rbm93bj4pO1xuICAgIHRoaXMuX3ZpZXdzLnB1c2godmlldyk7XG4gICAgdmlldy5hdHRhY2hUb0FwcFJlZih0aGlzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZXRhY2hlcyBhIHZpZXcgZnJvbSBkaXJ0eSBjaGVja2luZyBhZ2Fpbi5cbiAgICovXG4gIGRldGFjaFZpZXcodmlld1JlZjogVmlld1JlZik6IHZvaWQge1xuICAgICh0eXBlb2YgbmdEZXZNb2RlID09PSAndW5kZWZpbmVkJyB8fCBuZ0Rldk1vZGUpICYmIHRoaXMud2FybklmRGVzdHJveWVkKCk7XG4gICAgY29uc3QgdmlldyA9ICh2aWV3UmVmIGFzIEludGVybmFsVmlld1JlZjx1bmtub3duPik7XG4gICAgcmVtb3ZlKHRoaXMuX3ZpZXdzLCB2aWV3KTtcbiAgICB2aWV3LmRldGFjaEZyb21BcHBSZWYoKTtcbiAgfVxuXG4gIHByaXZhdGUgX2xvYWRDb21wb25lbnQoY29tcG9uZW50UmVmOiBDb21wb25lbnRSZWY8YW55Pik6IHZvaWQge1xuICAgIHRoaXMuYXR0YWNoVmlldyhjb21wb25lbnRSZWYuaG9zdFZpZXcpO1xuICAgIHRoaXMudGljaygpO1xuICAgIHRoaXMuY29tcG9uZW50cy5wdXNoKGNvbXBvbmVudFJlZik7XG4gICAgLy8gR2V0IHRoZSBsaXN0ZW5lcnMgbGF6aWx5IHRvIHByZXZlbnQgREkgY3ljbGVzLlxuICAgIGNvbnN0IGxpc3RlbmVycyA9IHRoaXMuX2luamVjdG9yLmdldChBUFBfQk9PVFNUUkFQX0xJU1RFTkVSLCBbXSk7XG4gICAgaWYgKG5nRGV2TW9kZSAmJiAhQXJyYXkuaXNBcnJheShsaXN0ZW5lcnMpKSB7XG4gICAgICB0aHJvdyBuZXcgUnVudGltZUVycm9yKFxuICAgICAgICAgIFJ1bnRpbWVFcnJvckNvZGUuSU5WQUxJRF9NVUxUSV9QUk9WSURFUixcbiAgICAgICAgICAnVW5leHBlY3RlZCB0eXBlIG9mIHRoZSBgQVBQX0JPT1RTVFJBUF9MSVNURU5FUmAgdG9rZW4gdmFsdWUgJyArXG4gICAgICAgICAgICAgIGAoZXhwZWN0ZWQgYW4gYXJyYXksIGJ1dCBnb3QgJHt0eXBlb2YgbGlzdGVuZXJzfSkuIGAgK1xuICAgICAgICAgICAgICAnUGxlYXNlIGNoZWNrIHRoYXQgdGhlIGBBUFBfQk9PVFNUUkFQX0xJU1RFTkVSYCB0b2tlbiBpcyBjb25maWd1cmVkIGFzIGEgJyArXG4gICAgICAgICAgICAgICdgbXVsdGk6IHRydWVgIHByb3ZpZGVyLicpO1xuICAgIH1cbiAgICBbLi4udGhpcy5fYm9vdHN0cmFwTGlzdGVuZXJzLCAuLi5saXN0ZW5lcnNdLmZvckVhY2goKGxpc3RlbmVyKSA9PiBsaXN0ZW5lcihjb21wb25lbnRSZWYpKTtcbiAgfVxuXG4gIC8qKiBAaW50ZXJuYWwgKi9cbiAgbmdPbkRlc3Ryb3koKSB7XG4gICAgaWYgKHRoaXMuX2Rlc3Ryb3llZCkgcmV0dXJuO1xuXG4gICAgdHJ5IHtcbiAgICAgIC8vIENhbGwgYWxsIHRoZSBsaWZlY3ljbGUgaG9va3MuXG4gICAgICB0aGlzLl9kZXN0cm95TGlzdGVuZXJzLmZvckVhY2gobGlzdGVuZXIgPT4gbGlzdGVuZXIoKSk7XG5cbiAgICAgIC8vIERlc3Ryb3kgYWxsIHJlZ2lzdGVyZWQgdmlld3MuXG4gICAgICB0aGlzLl92aWV3cy5zbGljZSgpLmZvckVhY2goKHZpZXcpID0+IHZpZXcuZGVzdHJveSgpKTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgLy8gSW5kaWNhdGUgdGhhdCB0aGlzIGluc3RhbmNlIGlzIGRlc3Ryb3llZC5cbiAgICAgIHRoaXMuX2Rlc3Ryb3llZCA9IHRydWU7XG5cbiAgICAgIC8vIFJlbGVhc2UgYWxsIHJlZmVyZW5jZXMuXG4gICAgICB0aGlzLl92aWV3cyA9IFtdO1xuICAgICAgdGhpcy5fYm9vdHN0cmFwTGlzdGVuZXJzID0gW107XG4gICAgICB0aGlzLl9kZXN0cm95TGlzdGVuZXJzID0gW107XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFJlZ2lzdGVycyBhIGxpc3RlbmVyIHRvIGJlIGNhbGxlZCB3aGVuIGFuIGluc3RhbmNlIGlzIGRlc3Ryb3llZC5cbiAgICpcbiAgICogQHBhcmFtIGNhbGxiYWNrIEEgY2FsbGJhY2sgZnVuY3Rpb24gdG8gYWRkIGFzIGEgbGlzdGVuZXIuXG4gICAqIEByZXR1cm5zIEEgZnVuY3Rpb24gd2hpY2ggdW5yZWdpc3RlcnMgYSBsaXN0ZW5lci5cbiAgICovXG4gIG9uRGVzdHJveShjYWxsYmFjazogKCkgPT4gdm9pZCk6IFZvaWRGdW5jdGlvbiB7XG4gICAgKHR5cGVvZiBuZ0Rldk1vZGUgPT09ICd1bmRlZmluZWQnIHx8IG5nRGV2TW9kZSkgJiYgdGhpcy53YXJuSWZEZXN0cm95ZWQoKTtcbiAgICB0aGlzLl9kZXN0cm95TGlzdGVuZXJzLnB1c2goY2FsbGJhY2spO1xuICAgIHJldHVybiAoKSA9PiByZW1vdmUodGhpcy5fZGVzdHJveUxpc3RlbmVycywgY2FsbGJhY2spO1xuICB9XG5cbiAgLyoqXG4gICAqIERlc3Ryb3lzIGFuIEFuZ3VsYXIgYXBwbGljYXRpb24gcmVwcmVzZW50ZWQgYnkgdGhpcyBgQXBwbGljYXRpb25SZWZgLiBDYWxsaW5nIHRoaXMgZnVuY3Rpb25cbiAgICogd2lsbCBkZXN0cm95IHRoZSBhc3NvY2lhdGVkIGVudmlyb25tZW50IGluamVjdG9ycyBhcyB3ZWxsIGFzIGFsbCB0aGUgYm9vdHN0cmFwcGVkIGNvbXBvbmVudHNcbiAgICogd2l0aCB0aGVpciB2aWV3cy5cbiAgICovXG4gIGRlc3Ryb3koKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuX2Rlc3Ryb3llZCkge1xuICAgICAgdGhyb3cgbmV3IFJ1bnRpbWVFcnJvcihcbiAgICAgICAgICBSdW50aW1lRXJyb3JDb2RlLkFQUExJQ0FUSU9OX1JFRl9BTFJFQURZX0RFU1RST1lFRCxcbiAgICAgICAgICBuZ0Rldk1vZGUgJiYgJ1RoaXMgaW5zdGFuY2Ugb2YgdGhlIGBBcHBsaWNhdGlvblJlZmAgaGFzIGFscmVhZHkgYmVlbiBkZXN0cm95ZWQuJyk7XG4gICAgfVxuXG4gICAgLy8gVGhpcyBpcyBhIHRlbXBvcmFyeSB0eXBlIHRvIHJlcHJlc2VudCBhbiBpbnN0YW5jZSBvZiBhbiBSM0luamVjdG9yLCB3aGljaCBjYW4gYmUgZGVzdHJveWVkLlxuICAgIC8vIFRoZSB0eXBlIHdpbGwgYmUgcmVwbGFjZWQgd2l0aCBhIGRpZmZlcmVudCBvbmUgb25jZSBkZXN0cm95YWJsZSBpbmplY3RvciB0eXBlIGlzIGF2YWlsYWJsZS5cbiAgICB0eXBlIERlc3Ryb3lhYmxlSW5qZWN0b3IgPSBJbmplY3RvciZ7ZGVzdHJveT86IEZ1bmN0aW9uLCBkZXN0cm95ZWQ/OiBib29sZWFufTtcblxuICAgIGNvbnN0IGluamVjdG9yID0gdGhpcy5faW5qZWN0b3IgYXMgRGVzdHJveWFibGVJbmplY3RvcjtcblxuICAgIC8vIENoZWNrIHRoYXQgdGhpcyBpbmplY3RvciBpbnN0YW5jZSBzdXBwb3J0cyBkZXN0cm95IG9wZXJhdGlvbi5cbiAgICBpZiAoaW5qZWN0b3IuZGVzdHJveSAmJiAhaW5qZWN0b3IuZGVzdHJveWVkKSB7XG4gICAgICAvLyBEZXN0cm95aW5nIGFuIHVuZGVybHlpbmcgaW5qZWN0b3Igd2lsbCB0cmlnZ2VyIHRoZSBgbmdPbkRlc3Ryb3lgIGxpZmVjeWNsZVxuICAgICAgLy8gaG9vaywgd2hpY2ggaW52b2tlcyB0aGUgcmVtYWluaW5nIGNsZWFudXAgYWN0aW9ucy5cbiAgICAgIGluamVjdG9yLmRlc3Ryb3koKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgbnVtYmVyIG9mIGF0dGFjaGVkIHZpZXdzLlxuICAgKi9cbiAgZ2V0IHZpZXdDb3VudCgpIHtcbiAgICByZXR1cm4gdGhpcy5fdmlld3MubGVuZ3RoO1xuICB9XG5cbiAgcHJpdmF0ZSB3YXJuSWZEZXN0cm95ZWQoKSB7XG4gICAgaWYgKCh0eXBlb2YgbmdEZXZNb2RlID09PSAndW5kZWZpbmVkJyB8fCBuZ0Rldk1vZGUpICYmIHRoaXMuX2Rlc3Ryb3llZCkge1xuICAgICAgY29uc29sZS53YXJuKGZvcm1hdFJ1bnRpbWVFcnJvcihcbiAgICAgICAgICBSdW50aW1lRXJyb3JDb2RlLkFQUExJQ0FUSU9OX1JFRl9BTFJFQURZX0RFU1RST1lFRCxcbiAgICAgICAgICAnVGhpcyBpbnN0YW5jZSBvZiB0aGUgYEFwcGxpY2F0aW9uUmVmYCBoYXMgYWxyZWFkeSBiZWVuIGRlc3Ryb3llZC4nKSk7XG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZW1vdmU8VD4obGlzdDogVFtdLCBlbDogVCk6IHZvaWQge1xuICBjb25zdCBpbmRleCA9IGxpc3QuaW5kZXhPZihlbCk7XG4gIGlmIChpbmRleCA+IC0xKSB7XG4gICAgbGlzdC5zcGxpY2UoaW5kZXgsIDEpO1xuICB9XG59XG5cbmxldCB3aGVuU3RhYmxlU3RvcmU6IFdlYWtNYXA8QXBwbGljYXRpb25SZWYsIFByb21pc2U8dm9pZD4+fHVuZGVmaW5lZDtcbi8qKlxuICogUmV0dXJucyBhIFByb21pc2UgdGhhdCByZXNvbHZlcyB3aGVuIHRoZSBhcHBsaWNhdGlvbiBiZWNvbWVzIHN0YWJsZSBhZnRlciB0aGlzIG1ldGhvZCBpcyBjYWxsZWRcbiAqIHRoZSBmaXJzdCB0aW1lLlxuICovXG5leHBvcnQgZnVuY3Rpb24gd2hlblN0YWJsZShhcHBsaWNhdGlvblJlZjogQXBwbGljYXRpb25SZWYpOiBQcm9taXNlPHZvaWQ+IHtcbiAgd2hlblN0YWJsZVN0b3JlID8/PSBuZXcgV2Vha01hcCgpO1xuICBjb25zdCBjYWNoZWRXaGVuU3RhYmxlID0gd2hlblN0YWJsZVN0b3JlLmdldChhcHBsaWNhdGlvblJlZik7XG4gIGlmIChjYWNoZWRXaGVuU3RhYmxlKSB7XG4gICAgcmV0dXJuIGNhY2hlZFdoZW5TdGFibGU7XG4gIH1cblxuICBjb25zdCB3aGVuU3RhYmxlUHJvbWlzZSA9XG4gICAgICBhcHBsaWNhdGlvblJlZi5pc1N0YWJsZS5waXBlKGZpcnN0KChpc1N0YWJsZSkgPT4gaXNTdGFibGUpKS50b1Byb21pc2UoKS50aGVuKCgpID0+IHZvaWQgMCk7XG4gIHdoZW5TdGFibGVTdG9yZS5zZXQoYXBwbGljYXRpb25SZWYsIHdoZW5TdGFibGVQcm9taXNlKTtcblxuICAvLyBCZSBhIGdvb2QgY2l0aXplbiBhbmQgY2xlYW4gdGhlIHN0b3JlIGBvbkRlc3Ryb3lgIGV2ZW4gdGhvdWdoIHdlIGFyZSB1c2luZyBgV2Vha01hcGAuXG4gIGFwcGxpY2F0aW9uUmVmLm9uRGVzdHJveSgoKSA9PiB3aGVuU3RhYmxlU3RvcmU/LmRlbGV0ZShhcHBsaWNhdGlvblJlZikpO1xuXG4gIHJldHVybiB3aGVuU3RhYmxlUHJvbWlzZTtcbn1cblxuXG5mdW5jdGlvbiBzaG91bGRSZWNoZWNrVmlldyh2aWV3OiBMVmlldyk6IGJvb2xlYW4ge1xuICByZXR1cm4gcmVxdWlyZXNSZWZyZXNoT3JUcmF2ZXJzYWwodmlldyk7XG4gIC8vIFRPRE8oYXRzY290dCk6IFdlIG5lZWQgdG8gc3VwcG9ydCByZWNoZWNraW5nIHZpZXdzIG1hcmtlZCBkaXJ0eSBhZ2FpbiBpbiBhZnRlclJlbmRlciBob29rc1xuICAvLyBpbiBvcmRlciB0byBzdXBwb3J0IHRoZSB0cmFuc2l0aW9uIHRvIHpvbmVsZXNzLiBiLzMwODE1MjAyNVxuICAvKiB8fCAhISh2aWV3W0ZMQUdTXSAmIExWaWV3RmxhZ3MuRGlydHkpOyAqL1xufVxuIl19