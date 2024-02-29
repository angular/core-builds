/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import '../util/ng_jit_mode';
import { setActiveConsumer, setThrowInvalidWriteToSignalError } from '@angular/core/primitives/signals';
import { first, map } from 'rxjs/operators';
import { Console } from '../console';
import { inject } from '../di';
import { Injectable } from '../di/injectable';
import { InjectionToken } from '../di/injection_token';
import { Injector } from '../di/injector';
import { EnvironmentInjector } from '../di/r3_injector';
import { INTERNAL_APPLICATION_ERROR_HANDLER } from '../error_handler';
import { formatRuntimeError, RuntimeError } from '../errors';
import { isG3 } from '../is_internal';
import { ComponentFactory } from '../linker/component_factory';
import { ComponentFactoryResolver } from '../linker/component_factory_resolver';
import { NgModuleRef } from '../linker/ng_module_factory';
import { PendingTasks } from '../pending_tasks';
import { AfterRenderEventManager } from '../render3/after_render_hooks';
import { isStandalone } from '../render3/definition';
import { detectChangesInternal, MAXIMUM_REFRESH_RERUNS } from '../render3/instructions/change_detection';
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
        const prevConsumer = setActiveConsumer(null);
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
            setActiveConsumer(prevConsumer);
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
    return requiresRefreshOrTraversal(view) ||
        // TODO(atscott): Remove isG3 check and make this a breaking change for v18
        (isG3 && !!(view[FLAGS] & 64 /* LViewFlags.Dirty */));
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwbGljYXRpb25fcmVmLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvYXBwbGljYXRpb24vYXBwbGljYXRpb25fcmVmLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8scUJBQXFCLENBQUM7QUFFN0IsT0FBTyxFQUFDLGlCQUFpQixFQUFFLGlDQUFpQyxFQUFDLE1BQU0sa0NBQWtDLENBQUM7QUFFdEcsT0FBTyxFQUFDLEtBQUssRUFBRSxHQUFHLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUUxQyxPQUFPLEVBQUMsT0FBTyxFQUFDLE1BQU0sWUFBWSxDQUFDO0FBQ25DLE9BQU8sRUFBQyxNQUFNLEVBQUMsTUFBTSxPQUFPLENBQUM7QUFDN0IsT0FBTyxFQUFDLFVBQVUsRUFBQyxNQUFNLGtCQUFrQixDQUFDO0FBQzVDLE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUNyRCxPQUFPLEVBQUMsUUFBUSxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFDeEMsT0FBTyxFQUFDLG1CQUFtQixFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDdEQsT0FBTyxFQUFlLGtDQUFrQyxFQUFDLE1BQU0sa0JBQWtCLENBQUM7QUFDbEYsT0FBTyxFQUFDLGtCQUFrQixFQUFFLFlBQVksRUFBbUIsTUFBTSxXQUFXLENBQUM7QUFFN0UsT0FBTyxFQUFDLElBQUksRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBQ3BDLE9BQU8sRUFBQyxnQkFBZ0IsRUFBZSxNQUFNLDZCQUE2QixDQUFDO0FBQzNFLE9BQU8sRUFBQyx3QkFBd0IsRUFBQyxNQUFNLHNDQUFzQyxDQUFDO0FBQzlFLE9BQU8sRUFBQyxXQUFXLEVBQUMsTUFBTSw2QkFBNkIsQ0FBQztBQUV4RCxPQUFPLEVBQUMsWUFBWSxFQUFDLE1BQU0sa0JBQWtCLENBQUM7QUFDOUMsT0FBTyxFQUFDLHVCQUF1QixFQUFDLE1BQU0sK0JBQStCLENBQUM7QUFFdEUsT0FBTyxFQUFDLFlBQVksRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQ25ELE9BQU8sRUFBc0IscUJBQXFCLEVBQUUsc0JBQXNCLEVBQUMsTUFBTSwwQ0FBMEMsQ0FBQztBQUM1SCxPQUFPLEVBQUMsS0FBSyxFQUFvQixNQUFNLDRCQUE0QixDQUFDO0FBQ3BFLE9BQU8sRUFBQyx5QkFBeUIsSUFBSSwwQkFBMEIsRUFBQyxNQUFNLDhCQUE4QixDQUFDO0FBQ3JHLE9BQU8sRUFBQywwQkFBMEIsRUFBQyxNQUFNLDRCQUE0QixDQUFDO0FBRXRFLE9BQU8sRUFBQyxXQUFXLEVBQUMsTUFBTSw0QkFBNEIsQ0FBQztBQUN2RCxPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sY0FBYyxDQUFDO0FBR3ZDLE9BQU8sRUFBQyxxQkFBcUIsRUFBQyxNQUFNLG9CQUFvQixDQUFDOztBQUV6RDs7Ozs7Ozs7O0dBU0c7QUFDSCxNQUFNLENBQUMsTUFBTSxzQkFBc0IsR0FDL0IsSUFBSSxjQUFjLENBQ2QsU0FBUyxDQUFDLENBQUMsQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUM7QUFFakQsTUFBTSxVQUFVLHlCQUF5QjtJQUN2QyxTQUFTLElBQUksMEJBQTBCLEVBQUUsQ0FBQztBQUM1QyxDQUFDO0FBRUQ7O0dBRUc7QUFDSCxNQUFNLFVBQVUsMEJBQTBCO0lBQ3hDLGlDQUFpQyxDQUFDLEdBQUcsRUFBRTtRQUNyQyxNQUFNLElBQUksWUFBWSwrREFFbEIsU0FBUztZQUNMLCtFQUErRTtnQkFDM0UscUZBQXFGLENBQUMsQ0FBQztJQUNyRyxDQUFDLENBQUMsQ0FBQztBQUNMLENBQUM7QUFFRCxNQUFNLFVBQVUsZUFBZSxDQUFJLEVBQXVCO0lBQ3hELE9BQVEsRUFBNEIsQ0FBQyxlQUFlLENBQUM7QUFDdkQsQ0FBQztBQUVEOzs7OztHQUtHO0FBQ0gsTUFBTSxPQUFPLFlBQVk7SUFDdkIsWUFBbUIsSUFBWSxFQUFTLEtBQVU7UUFBL0IsU0FBSSxHQUFKLElBQUksQ0FBUTtRQUFTLFVBQUssR0FBTCxLQUFLLENBQUs7SUFBRyxDQUFDO0NBQ3ZEO0FBNkRELE1BQU0sVUFBVSw0QkFBNEIsQ0FDeEMsWUFBMEIsRUFBRSxNQUFjLEVBQUUsUUFBbUI7SUFDakUsSUFBSSxDQUFDO1FBQ0gsTUFBTSxNQUFNLEdBQUcsUUFBUSxFQUFFLENBQUM7UUFDMUIsSUFBSSxTQUFTLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQztZQUN0QixPQUFPLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFNLEVBQUUsRUFBRTtnQkFDN0IsTUFBTSxDQUFDLGlCQUFpQixDQUFDLEdBQUcsRUFBRSxDQUFDLFlBQVksQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDNUQsbURBQW1EO2dCQUNuRCxNQUFNLENBQUMsQ0FBQztZQUNWLENBQUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQztRQUVELE9BQU8sTUFBTSxDQUFDO0lBQ2hCLENBQUM7SUFBQyxPQUFPLENBQUMsRUFBRSxDQUFDO1FBQ1gsTUFBTSxDQUFDLGlCQUFpQixDQUFDLEdBQUcsRUFBRSxDQUFDLFlBQVksQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUM1RCxtREFBbUQ7UUFDbkQsTUFBTSxDQUFDLENBQUM7SUFDVixDQUFDO0FBQ0gsQ0FBQztBQUVELE1BQU0sVUFBVSxjQUFjLENBQW1CLEdBQU0sRUFBRSxJQUFXO0lBQ2xFLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO1FBQ3hCLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxjQUFjLEVBQUUsR0FBRyxDQUFDLENBQUM7SUFDMUMsQ0FBQztJQUNELE9BQU8sRUFBQyxHQUFHLEdBQUcsRUFBRSxHQUFHLElBQUksRUFBQyxDQUFDO0FBQzNCLENBQUM7QUFFRDs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztHQTJGRztBQUVILE1BQU0sT0FBTyxjQUFjO0lBRDNCO1FBRUUsZ0JBQWdCO1FBQ1Isd0JBQW1CLEdBQTZDLEVBQUUsQ0FBQztRQUNuRSxpQkFBWSxHQUFZLEtBQUssQ0FBQztRQUM5QixlQUFVLEdBQUcsS0FBSyxDQUFDO1FBQ25CLHNCQUFpQixHQUFzQixFQUFFLENBQUM7UUFDbEQsZ0JBQWdCO1FBQ2hCLFdBQU0sR0FBK0IsRUFBRSxDQUFDO1FBQ3ZCLHlCQUFvQixHQUFHLE1BQU0sQ0FBQyxrQ0FBa0MsQ0FBQyxDQUFDO1FBQ2xFLDZCQUF3QixHQUFHLE1BQU0sQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDO1FBUzVFOzs7V0FHRztRQUNhLG1CQUFjLEdBQWdCLEVBQUUsQ0FBQztRQUVqRDs7V0FFRztRQUNhLGVBQVUsR0FBd0IsRUFBRSxDQUFDO1FBRXJEOztXQUVHO1FBQ2EsYUFBUSxHQUNwQixNQUFNLENBQUMsWUFBWSxDQUFDLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7UUFFdkQsY0FBUyxHQUFHLE1BQU0sQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO0tBa1kxRDtJQTFaQzs7T0FFRztJQUNILElBQUksU0FBUztRQUNYLE9BQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQztJQUN6QixDQUFDO0lBb0JEOztPQUVHO0lBQ0gsSUFBSSxRQUFRO1FBQ1YsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDO0lBQ3hCLENBQUM7SUFvRkQ7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztPQW9DRztJQUNILFNBQVMsQ0FBSSxrQkFBK0MsRUFBRSxrQkFBK0I7UUFFM0YsQ0FBQyxPQUFPLFNBQVMsS0FBSyxXQUFXLElBQUksU0FBUyxDQUFDLElBQUksSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDO1FBQzFFLE1BQU0sa0JBQWtCLEdBQUcsa0JBQWtCLFlBQVksZ0JBQWdCLENBQUM7UUFDMUUsTUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMscUJBQXFCLENBQUMsQ0FBQztRQUU3RCxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksRUFBRSxDQUFDO1lBQ3JCLE1BQU0sVUFBVSxHQUFHLENBQUMsa0JBQWtCLElBQUksWUFBWSxDQUFDLGtCQUFrQixDQUFDLENBQUM7WUFDM0UsTUFBTSxZQUFZLEdBQUcsQ0FBQyxPQUFPLFNBQVMsS0FBSyxXQUFXLElBQUksU0FBUyxDQUFDO2dCQUNoRSx3RUFBd0U7b0JBQ3BFLENBQUMsVUFBVSxDQUFDLENBQUM7d0JBQ1IsRUFBRSxDQUFDLENBQUM7d0JBQ0oseUVBQXlFLENBQUMsQ0FBQztZQUN4RixNQUFNLElBQUksWUFBWSw4REFBb0QsWUFBWSxDQUFDLENBQUM7UUFDMUYsQ0FBQztRQUVELElBQUksZ0JBQXFDLENBQUM7UUFDMUMsSUFBSSxrQkFBa0IsRUFBRSxDQUFDO1lBQ3ZCLGdCQUFnQixHQUFHLGtCQUFrQixDQUFDO1FBQ3hDLENBQUM7YUFBTSxDQUFDO1lBQ04sTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsd0JBQXdCLENBQUMsQ0FBQztZQUM5RCxnQkFBZ0IsR0FBRyxRQUFRLENBQUMsdUJBQXVCLENBQUMsa0JBQWtCLENBQUUsQ0FBQztRQUMzRSxDQUFDO1FBQ0QsSUFBSSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsYUFBYSxDQUFDLENBQUM7UUFFekQsc0ZBQXNGO1FBQ3RGLE1BQU0sUUFBUSxHQUNWLGVBQWUsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBQ3BGLE1BQU0sY0FBYyxHQUFHLGtCQUFrQixJQUFJLGdCQUFnQixDQUFDLFFBQVEsQ0FBQztRQUN2RSxNQUFNLE9BQU8sR0FBRyxnQkFBZ0IsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxFQUFFLEVBQUUsY0FBYyxFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBQ3JGLE1BQU0sYUFBYSxHQUFHLE9BQU8sQ0FBQyxRQUFRLENBQUMsYUFBYSxDQUFDO1FBQ3JELE1BQU0sV0FBVyxHQUFHLE9BQU8sQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLFdBQVcsRUFBRSxJQUFJLENBQUMsQ0FBQztRQUM1RCxXQUFXLEVBQUUsbUJBQW1CLENBQUMsYUFBYSxDQUFDLENBQUM7UUFFaEQsT0FBTyxDQUFDLFNBQVMsQ0FBQyxHQUFHLEVBQUU7WUFDckIsSUFBSSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDbEMsTUFBTSxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFDakMsV0FBVyxFQUFFLHFCQUFxQixDQUFDLGFBQWEsQ0FBQyxDQUFDO1FBQ3BELENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLGNBQWMsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUM3QixJQUFJLE9BQU8sU0FBUyxLQUFLLFdBQVcsSUFBSSxTQUFTLEVBQUUsQ0FBQztZQUNsRCxNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUM3QyxRQUFRLENBQUMsR0FBRyxDQUFDLHlDQUF5QyxDQUFDLENBQUM7UUFDMUQsQ0FBQztRQUNELE9BQU8sT0FBTyxDQUFDO0lBQ2pCLENBQUM7SUFFRDs7Ozs7Ozs7O09BU0c7SUFDSCxJQUFJO1FBQ0YsQ0FBQyxPQUFPLFNBQVMsS0FBSyxXQUFXLElBQUksU0FBUyxDQUFDLElBQUksSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDO1FBQzFFLElBQUksSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDO1lBQ3RCLE1BQU0sSUFBSSxZQUFZLDREQUVsQixTQUFTLElBQUksMkNBQTJDLENBQUMsQ0FBQztRQUNoRSxDQUFDO1FBRUQsTUFBTSxZQUFZLEdBQUcsaUJBQWlCLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDN0MsSUFBSSxDQUFDO1lBQ0gsSUFBSSxDQUFDLFlBQVksR0FBRyxJQUFJLENBQUM7WUFFekIsSUFBSSxDQUFDLDRCQUE0QixFQUFFLENBQUM7WUFFcEMsSUFBSSxDQUFDLE9BQU8sU0FBUyxLQUFLLFdBQVcsSUFBSSxTQUFTLENBQUMsRUFBRSxDQUFDO2dCQUNwRCxLQUFLLElBQUksSUFBSSxJQUFJLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztvQkFDN0IsSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDO2dCQUN4QixDQUFDO1lBQ0gsQ0FBQztRQUNILENBQUM7UUFBQyxPQUFPLENBQUMsRUFBRSxDQUFDO1lBQ1gsNEVBQTRFO1lBQzVFLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUMvQixDQUFDO2dCQUFTLENBQUM7WUFDVCxJQUFJLENBQUMsWUFBWSxHQUFHLEtBQUssQ0FBQztZQUMxQixpQkFBaUIsQ0FBQyxZQUFZLENBQUMsQ0FBQztRQUNsQyxDQUFDO0lBQ0gsQ0FBQztJQUVPLDRCQUE0QjtRQUNsQyxJQUFJLElBQUksR0FBRyxDQUFDLENBQUM7UUFDYixNQUFNLHdCQUF3QixHQUFHLElBQUksQ0FBQyx3QkFBd0IsQ0FBQztRQUMvRCxPQUFPLElBQUksRUFBRSxDQUFDO1lBQ1osSUFBSSxJQUFJLEtBQUssc0JBQXNCLEVBQUUsQ0FBQztnQkFDcEMsTUFBTSxJQUFJLFlBQVksdURBRWxCLFNBQVM7b0JBQ0wsZ0VBQWdFO3dCQUM1RCxvRkFBb0YsQ0FBQyxDQUFDO1lBQ3BHLENBQUM7WUFFRCxNQUFNLFdBQVcsR0FBRyxJQUFJLEtBQUssQ0FBQyxDQUFDO1lBQy9CLEtBQUssSUFBSSxFQUFDLE1BQU0sRUFBRSxrQkFBa0IsRUFBQyxJQUFJLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztnQkFDckQsNkRBQTZEO2dCQUM3RCxJQUFJLENBQUMsV0FBVyxJQUFJLENBQUMsaUJBQWlCLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQztvQkFDL0MsU0FBUztnQkFDWCxDQUFDO2dCQUNELElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxNQUFNLEVBQUUsa0JBQWtCLEVBQUUsV0FBVyxDQUFDLENBQUM7WUFDcEUsQ0FBQztZQUNELElBQUksRUFBRSxDQUFDO1lBRVAsd0JBQXdCLENBQUMsd0JBQXdCLEVBQUUsQ0FBQztZQUNwRCwwRkFBMEY7WUFDMUYseUNBQXlDO1lBQ3pDLElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFDLE1BQU0sRUFBQyxFQUFFLEVBQUUsQ0FBQyxpQkFBaUIsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUM7Z0JBQzlELFNBQVM7WUFDWCxDQUFDO1lBRUQsd0JBQXdCLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDbkMsOEZBQThGO1lBQzlGLCtCQUErQjtZQUMvQixJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFDLE1BQU0sRUFBQyxFQUFFLEVBQUUsQ0FBQyxpQkFBaUIsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUM7Z0JBQy9ELE1BQU07WUFDUixDQUFDO1FBQ0gsQ0FBQztJQUNILENBQUM7SUFFTyxtQkFBbUIsQ0FBQyxLQUFZLEVBQUUsa0JBQTJCLEVBQUUsV0FBb0I7UUFDekYsSUFBSSxJQUF5QixDQUFDO1FBQzlCLElBQUksV0FBVyxFQUFFLENBQUM7WUFDaEIsK0VBQStFO1lBQy9FLElBQUkscUNBQTZCLENBQUM7WUFDbEMsZ0ZBQWdGO1lBQ2hGLHVGQUF1RjtZQUN2RixzRkFBc0Y7WUFDdEYsa0ZBQWtGO1lBQ2xGLHVFQUF1RTtZQUN2RSxLQUFLLENBQUMsS0FBSyxDQUFDLHFDQUEwQixDQUFDO1FBQ3pDLENBQUM7YUFBTSxJQUFJLEtBQUssQ0FBQyxLQUFLLENBQUMsNEJBQW1CLEVBQUUsQ0FBQztZQUMzQyxrRkFBa0Y7WUFDbEYsSUFBSSxxQ0FBNkIsQ0FBQztRQUNwQyxDQUFDO2FBQU0sQ0FBQztZQUNOLGlGQUFpRjtZQUNqRix1RkFBdUY7WUFDdkYsdURBQXVEO1lBQ3ZELElBQUksdUNBQStCLENBQUM7UUFDdEMsQ0FBQztRQUNELHFCQUFxQixDQUFDLEtBQUssRUFBRSxrQkFBa0IsRUFBRSxJQUFJLENBQUMsQ0FBQztJQUN6RCxDQUFDO0lBRUQ7Ozs7T0FJRztJQUNILFVBQVUsQ0FBQyxPQUFnQjtRQUN6QixDQUFDLE9BQU8sU0FBUyxLQUFLLFdBQVcsSUFBSSxTQUFTLENBQUMsSUFBSSxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUM7UUFDMUUsTUFBTSxJQUFJLEdBQUksT0FBb0MsQ0FBQztRQUNuRCxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUN2QixJQUFJLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQzVCLENBQUM7SUFFRDs7T0FFRztJQUNILFVBQVUsQ0FBQyxPQUFnQjtRQUN6QixDQUFDLE9BQU8sU0FBUyxLQUFLLFdBQVcsSUFBSSxTQUFTLENBQUMsSUFBSSxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUM7UUFDMUUsTUFBTSxJQUFJLEdBQUksT0FBb0MsQ0FBQztRQUNuRCxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsQ0FBQztRQUMxQixJQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztJQUMxQixDQUFDO0lBRU8sY0FBYyxDQUFDLFlBQStCO1FBQ3BELElBQUksQ0FBQyxVQUFVLENBQUMsWUFBWSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ3ZDLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUNaLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDO1FBQ25DLGlEQUFpRDtRQUNqRCxNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxzQkFBc0IsRUFBRSxFQUFFLENBQUMsQ0FBQztRQUNqRSxJQUFJLFNBQVMsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQztZQUMzQyxNQUFNLElBQUksWUFBWSxxREFFbEIsOERBQThEO2dCQUMxRCwrQkFBK0IsT0FBTyxTQUFTLEtBQUs7Z0JBQ3BELDBFQUEwRTtnQkFDMUUseUJBQXlCLENBQUMsQ0FBQztRQUNyQyxDQUFDO1FBQ0QsQ0FBQyxHQUFHLElBQUksQ0FBQyxtQkFBbUIsRUFBRSxHQUFHLFNBQVMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLFFBQVEsRUFBRSxFQUFFLENBQUMsUUFBUSxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUM7SUFDNUYsQ0FBQztJQUVELGdCQUFnQjtJQUNoQixXQUFXO1FBQ1QsSUFBSSxJQUFJLENBQUMsVUFBVTtZQUFFLE9BQU87UUFFNUIsSUFBSSxDQUFDO1lBQ0gsZ0NBQWdDO1lBQ2hDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO1lBRXZELGdDQUFnQztZQUNoQyxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRSxDQUFDLE9BQU8sQ0FBQyxDQUFDLElBQUksRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUM7UUFDeEQsQ0FBQztnQkFBUyxDQUFDO1lBQ1QsNENBQTRDO1lBQzVDLElBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDO1lBRXZCLDBCQUEwQjtZQUMxQixJQUFJLENBQUMsTUFBTSxHQUFHLEVBQUUsQ0FBQztZQUNqQixJQUFJLENBQUMsbUJBQW1CLEdBQUcsRUFBRSxDQUFDO1lBQzlCLElBQUksQ0FBQyxpQkFBaUIsR0FBRyxFQUFFLENBQUM7UUFDOUIsQ0FBQztJQUNILENBQUM7SUFFRDs7Ozs7T0FLRztJQUNILFNBQVMsQ0FBQyxRQUFvQjtRQUM1QixDQUFDLE9BQU8sU0FBUyxLQUFLLFdBQVcsSUFBSSxTQUFTLENBQUMsSUFBSSxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUM7UUFDMUUsSUFBSSxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUN0QyxPQUFPLEdBQUcsRUFBRSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsaUJBQWlCLEVBQUUsUUFBUSxDQUFDLENBQUM7SUFDeEQsQ0FBQztJQUVEOzs7O09BSUc7SUFDSCxPQUFPO1FBQ0wsSUFBSSxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7WUFDcEIsTUFBTSxJQUFJLFlBQVksK0RBRWxCLFNBQVMsSUFBSSxtRUFBbUUsQ0FBQyxDQUFDO1FBQ3hGLENBQUM7UUFNRCxNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsU0FBZ0MsQ0FBQztRQUV2RCxnRUFBZ0U7UUFDaEUsSUFBSSxRQUFRLENBQUMsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDLFNBQVMsRUFBRSxDQUFDO1lBQzVDLDZFQUE2RTtZQUM3RSxxREFBcUQ7WUFDckQsUUFBUSxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ3JCLENBQUM7SUFDSCxDQUFDO0lBRUQ7O09BRUc7SUFDSCxJQUFJLFNBQVM7UUFDWCxPQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDO0lBQzVCLENBQUM7SUFFTyxlQUFlO1FBQ3JCLElBQUksQ0FBQyxPQUFPLFNBQVMsS0FBSyxXQUFXLElBQUksU0FBUyxDQUFDLElBQUksSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO1lBQ3ZFLE9BQU8sQ0FBQyxJQUFJLENBQUMsa0JBQWtCLCtEQUUzQixtRUFBbUUsQ0FBQyxDQUFDLENBQUM7UUFDNUUsQ0FBQztJQUNILENBQUM7K0VBcGFVLGNBQWM7dUVBQWQsY0FBYyxXQUFkLGNBQWMsbUJBREYsTUFBTTs7Z0ZBQ2xCLGNBQWM7Y0FEMUIsVUFBVTtlQUFDLEVBQUMsVUFBVSxFQUFFLE1BQU0sRUFBQzs7QUF3YWhDLE1BQU0sVUFBVSxNQUFNLENBQUksSUFBUyxFQUFFLEVBQUs7SUFDeEMsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQztJQUMvQixJQUFJLEtBQUssR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDO1FBQ2YsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFDeEIsQ0FBQztBQUNILENBQUM7QUFFRCxJQUFJLGVBQWlFLENBQUM7QUFDdEU7OztHQUdHO0FBQ0gsTUFBTSxVQUFVLFVBQVUsQ0FBQyxjQUE4QjtJQUN2RCxlQUFlLEtBQUssSUFBSSxPQUFPLEVBQUUsQ0FBQztJQUNsQyxNQUFNLGdCQUFnQixHQUFHLGVBQWUsQ0FBQyxHQUFHLENBQUMsY0FBYyxDQUFDLENBQUM7SUFDN0QsSUFBSSxnQkFBZ0IsRUFBRSxDQUFDO1FBQ3JCLE9BQU8sZ0JBQWdCLENBQUM7SUFDMUIsQ0FBQztJQUVELE1BQU0saUJBQWlCLEdBQ25CLGNBQWMsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLFFBQVEsRUFBRSxFQUFFLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxTQUFTLEVBQUUsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztJQUMvRixlQUFlLENBQUMsR0FBRyxDQUFDLGNBQWMsRUFBRSxpQkFBaUIsQ0FBQyxDQUFDO0lBRXZELHdGQUF3RjtJQUN4RixjQUFjLENBQUMsU0FBUyxDQUFDLEdBQUcsRUFBRSxDQUFDLGVBQWUsRUFBRSxNQUFNLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQztJQUV4RSxPQUFPLGlCQUFpQixDQUFDO0FBQzNCLENBQUM7QUFHRCxTQUFTLGlCQUFpQixDQUFDLElBQVc7SUFDcEMsT0FBTywwQkFBMEIsQ0FBQyxJQUFJLENBQUM7UUFDbkMsMkVBQTJFO1FBQzNFLENBQUMsSUFBSSxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsNEJBQW1CLENBQUMsQ0FBQyxDQUFDO0FBQ25ELENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0ICcuLi91dGlsL25nX2ppdF9tb2RlJztcblxuaW1wb3J0IHtzZXRBY3RpdmVDb25zdW1lciwgc2V0VGhyb3dJbnZhbGlkV3JpdGVUb1NpZ25hbEVycm9yfSBmcm9tICdAYW5ndWxhci9jb3JlL3ByaW1pdGl2ZXMvc2lnbmFscyc7XG5pbXBvcnQge09ic2VydmFibGV9IGZyb20gJ3J4anMnO1xuaW1wb3J0IHtmaXJzdCwgbWFwfSBmcm9tICdyeGpzL29wZXJhdG9ycyc7XG5cbmltcG9ydCB7Q29uc29sZX0gZnJvbSAnLi4vY29uc29sZSc7XG5pbXBvcnQge2luamVjdH0gZnJvbSAnLi4vZGknO1xuaW1wb3J0IHtJbmplY3RhYmxlfSBmcm9tICcuLi9kaS9pbmplY3RhYmxlJztcbmltcG9ydCB7SW5qZWN0aW9uVG9rZW59IGZyb20gJy4uL2RpL2luamVjdGlvbl90b2tlbic7XG5pbXBvcnQge0luamVjdG9yfSBmcm9tICcuLi9kaS9pbmplY3Rvcic7XG5pbXBvcnQge0Vudmlyb25tZW50SW5qZWN0b3J9IGZyb20gJy4uL2RpL3IzX2luamVjdG9yJztcbmltcG9ydCB7RXJyb3JIYW5kbGVyLCBJTlRFUk5BTF9BUFBMSUNBVElPTl9FUlJPUl9IQU5ETEVSfSBmcm9tICcuLi9lcnJvcl9oYW5kbGVyJztcbmltcG9ydCB7Zm9ybWF0UnVudGltZUVycm9yLCBSdW50aW1lRXJyb3IsIFJ1bnRpbWVFcnJvckNvZGV9IGZyb20gJy4uL2Vycm9ycyc7XG5pbXBvcnQge1R5cGV9IGZyb20gJy4uL2ludGVyZmFjZS90eXBlJztcbmltcG9ydCB7aXNHM30gZnJvbSAnLi4vaXNfaW50ZXJuYWwnO1xuaW1wb3J0IHtDb21wb25lbnRGYWN0b3J5LCBDb21wb25lbnRSZWZ9IGZyb20gJy4uL2xpbmtlci9jb21wb25lbnRfZmFjdG9yeSc7XG5pbXBvcnQge0NvbXBvbmVudEZhY3RvcnlSZXNvbHZlcn0gZnJvbSAnLi4vbGlua2VyL2NvbXBvbmVudF9mYWN0b3J5X3Jlc29sdmVyJztcbmltcG9ydCB7TmdNb2R1bGVSZWZ9IGZyb20gJy4uL2xpbmtlci9uZ19tb2R1bGVfZmFjdG9yeSc7XG5pbXBvcnQge1ZpZXdSZWZ9IGZyb20gJy4uL2xpbmtlci92aWV3X3JlZic7XG5pbXBvcnQge1BlbmRpbmdUYXNrc30gZnJvbSAnLi4vcGVuZGluZ190YXNrcyc7XG5pbXBvcnQge0FmdGVyUmVuZGVyRXZlbnRNYW5hZ2VyfSBmcm9tICcuLi9yZW5kZXIzL2FmdGVyX3JlbmRlcl9ob29rcyc7XG5pbXBvcnQge0NvbXBvbmVudEZhY3RvcnkgYXMgUjNDb21wb25lbnRGYWN0b3J5fSBmcm9tICcuLi9yZW5kZXIzL2NvbXBvbmVudF9yZWYnO1xuaW1wb3J0IHtpc1N0YW5kYWxvbmV9IGZyb20gJy4uL3JlbmRlcjMvZGVmaW5pdGlvbic7XG5pbXBvcnQge0NoYW5nZURldGVjdGlvbk1vZGUsIGRldGVjdENoYW5nZXNJbnRlcm5hbCwgTUFYSU1VTV9SRUZSRVNIX1JFUlVOU30gZnJvbSAnLi4vcmVuZGVyMy9pbnN0cnVjdGlvbnMvY2hhbmdlX2RldGVjdGlvbic7XG5pbXBvcnQge0ZMQUdTLCBMVmlldywgTFZpZXdGbGFnc30gZnJvbSAnLi4vcmVuZGVyMy9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHtwdWJsaXNoRGVmYXVsdEdsb2JhbFV0aWxzIGFzIF9wdWJsaXNoRGVmYXVsdEdsb2JhbFV0aWxzfSBmcm9tICcuLi9yZW5kZXIzL3V0aWwvZ2xvYmFsX3V0aWxzJztcbmltcG9ydCB7cmVxdWlyZXNSZWZyZXNoT3JUcmF2ZXJzYWx9IGZyb20gJy4uL3JlbmRlcjMvdXRpbC92aWV3X3V0aWxzJztcbmltcG9ydCB7Vmlld1JlZiBhcyBJbnRlcm5hbFZpZXdSZWZ9IGZyb20gJy4uL3JlbmRlcjMvdmlld19yZWYnO1xuaW1wb3J0IHtURVNUQUJJTElUWX0gZnJvbSAnLi4vdGVzdGFiaWxpdHkvdGVzdGFiaWxpdHknO1xuaW1wb3J0IHtpc1Byb21pc2V9IGZyb20gJy4uL3V0aWwvbGFuZyc7XG5pbXBvcnQge05nWm9uZX0gZnJvbSAnLi4vem9uZS9uZ196b25lJztcblxuaW1wb3J0IHtBcHBsaWNhdGlvbkluaXRTdGF0dXN9IGZyb20gJy4vYXBwbGljYXRpb25faW5pdCc7XG5cbi8qKlxuICogQSBbREkgdG9rZW5dKGd1aWRlL2dsb3NzYXJ5I2RpLXRva2VuIFwiREkgdG9rZW4gZGVmaW5pdGlvblwiKSB0aGF0IHByb3ZpZGVzIGEgc2V0IG9mIGNhbGxiYWNrcyB0b1xuICogYmUgY2FsbGVkIGZvciBldmVyeSBjb21wb25lbnQgdGhhdCBpcyBib290c3RyYXBwZWQuXG4gKlxuICogRWFjaCBjYWxsYmFjayBtdXN0IHRha2UgYSBgQ29tcG9uZW50UmVmYCBpbnN0YW5jZSBhbmQgcmV0dXJuIG5vdGhpbmcuXG4gKlxuICogYChjb21wb25lbnRSZWY6IENvbXBvbmVudFJlZikgPT4gdm9pZGBcbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBjb25zdCBBUFBfQk9PVFNUUkFQX0xJU1RFTkVSID1cbiAgICBuZXcgSW5qZWN0aW9uVG9rZW48UmVhZG9ubHlBcnJheTwoY29tcFJlZjogQ29tcG9uZW50UmVmPGFueT4pID0+IHZvaWQ+PihcbiAgICAgICAgbmdEZXZNb2RlID8gJ2FwcEJvb3RzdHJhcExpc3RlbmVyJyA6ICcnKTtcblxuZXhwb3J0IGZ1bmN0aW9uIHB1Ymxpc2hEZWZhdWx0R2xvYmFsVXRpbHMoKSB7XG4gIG5nRGV2TW9kZSAmJiBfcHVibGlzaERlZmF1bHRHbG9iYWxVdGlscygpO1xufVxuXG4vKipcbiAqIFNldHMgdGhlIGVycm9yIGZvciBhbiBpbnZhbGlkIHdyaXRlIHRvIGEgc2lnbmFsIHRvIGJlIGFuIEFuZ3VsYXIgYFJ1bnRpbWVFcnJvcmAuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwdWJsaXNoU2lnbmFsQ29uZmlndXJhdGlvbigpOiB2b2lkIHtcbiAgc2V0VGhyb3dJbnZhbGlkV3JpdGVUb1NpZ25hbEVycm9yKCgpID0+IHtcbiAgICB0aHJvdyBuZXcgUnVudGltZUVycm9yKFxuICAgICAgICBSdW50aW1lRXJyb3JDb2RlLlNJR05BTF9XUklURV9GUk9NX0lMTEVHQUxfQ09OVEVYVCxcbiAgICAgICAgbmdEZXZNb2RlICYmXG4gICAgICAgICAgICAnV3JpdGluZyB0byBzaWduYWxzIGlzIG5vdCBhbGxvd2VkIGluIGEgYGNvbXB1dGVkYCBvciBhbiBgZWZmZWN0YCBieSBkZWZhdWx0LiAnICtcbiAgICAgICAgICAgICAgICAnVXNlIGBhbGxvd1NpZ25hbFdyaXRlc2AgaW4gdGhlIGBDcmVhdGVFZmZlY3RPcHRpb25zYCB0byBlbmFibGUgdGhpcyBpbnNpZGUgZWZmZWN0cy4nKTtcbiAgfSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0JvdW5kVG9Nb2R1bGU8Qz4oY2Y6IENvbXBvbmVudEZhY3Rvcnk8Qz4pOiBib29sZWFuIHtcbiAgcmV0dXJuIChjZiBhcyBSM0NvbXBvbmVudEZhY3Rvcnk8Qz4pLmlzQm91bmRUb01vZHVsZTtcbn1cblxuLyoqXG4gKiBBIHRva2VuIGZvciB0aGlyZC1wYXJ0eSBjb21wb25lbnRzIHRoYXQgY2FuIHJlZ2lzdGVyIHRoZW1zZWx2ZXMgd2l0aCBOZ1Byb2JlLlxuICpcbiAqIEBkZXByZWNhdGVkXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBjbGFzcyBOZ1Byb2JlVG9rZW4ge1xuICBjb25zdHJ1Y3RvcihwdWJsaWMgbmFtZTogc3RyaW5nLCBwdWJsaWMgdG9rZW46IGFueSkge31cbn1cblxuLyoqXG4gKiBQcm92aWRlcyBhZGRpdGlvbmFsIG9wdGlvbnMgdG8gdGhlIGJvb3RzdHJhcHBpbmcgcHJvY2Vzcy5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgQm9vdHN0cmFwT3B0aW9ucyB7XG4gIC8qKlxuICAgKiBPcHRpb25hbGx5IHNwZWNpZnkgd2hpY2ggYE5nWm9uZWAgc2hvdWxkIGJlIHVzZWQuXG4gICAqXG4gICAqIC0gUHJvdmlkZSB5b3VyIG93biBgTmdab25lYCBpbnN0YW5jZS5cbiAgICogLSBgem9uZS5qc2AgLSBVc2UgZGVmYXVsdCBgTmdab25lYCB3aGljaCByZXF1aXJlcyBgWm9uZS5qc2AuXG4gICAqIC0gYG5vb3BgIC0gVXNlIGBOb29wTmdab25lYCB3aGljaCBkb2VzIG5vdGhpbmcuXG4gICAqL1xuICBuZ1pvbmU/OiBOZ1pvbmV8J3pvbmUuanMnfCdub29wJztcblxuICAvKipcbiAgICogT3B0aW9uYWxseSBzcGVjaWZ5IGNvYWxlc2NpbmcgZXZlbnQgY2hhbmdlIGRldGVjdGlvbnMgb3Igbm90LlxuICAgKiBDb25zaWRlciB0aGUgZm9sbG93aW5nIGNhc2UuXG4gICAqXG4gICAqIGBgYFxuICAgKiA8ZGl2IChjbGljayk9XCJkb1NvbWV0aGluZygpXCI+XG4gICAqICAgPGJ1dHRvbiAoY2xpY2spPVwiZG9Tb21ldGhpbmdFbHNlKClcIj48L2J1dHRvbj5cbiAgICogPC9kaXY+XG4gICAqIGBgYFxuICAgKlxuICAgKiBXaGVuIGJ1dHRvbiBpcyBjbGlja2VkLCBiZWNhdXNlIG9mIHRoZSBldmVudCBidWJibGluZywgYm90aFxuICAgKiBldmVudCBoYW5kbGVycyB3aWxsIGJlIGNhbGxlZCBhbmQgMiBjaGFuZ2UgZGV0ZWN0aW9ucyB3aWxsIGJlXG4gICAqIHRyaWdnZXJlZC4gV2UgY2FuIGNvYWxlc2NlIHN1Y2gga2luZCBvZiBldmVudHMgdG8gb25seSB0cmlnZ2VyXG4gICAqIGNoYW5nZSBkZXRlY3Rpb24gb25seSBvbmNlLlxuICAgKlxuICAgKiBCeSBkZWZhdWx0LCB0aGlzIG9wdGlvbiB3aWxsIGJlIGZhbHNlLiBTbyB0aGUgZXZlbnRzIHdpbGwgbm90IGJlXG4gICAqIGNvYWxlc2NlZCBhbmQgdGhlIGNoYW5nZSBkZXRlY3Rpb24gd2lsbCBiZSB0cmlnZ2VyZWQgbXVsdGlwbGUgdGltZXMuXG4gICAqIEFuZCBpZiB0aGlzIG9wdGlvbiBiZSBzZXQgdG8gdHJ1ZSwgdGhlIGNoYW5nZSBkZXRlY3Rpb24gd2lsbCBiZVxuICAgKiB0cmlnZ2VyZWQgYXN5bmMgYnkgc2NoZWR1bGluZyBhIGFuaW1hdGlvbiBmcmFtZS4gU28gaW4gdGhlIGNhc2UgYWJvdmUsXG4gICAqIHRoZSBjaGFuZ2UgZGV0ZWN0aW9uIHdpbGwgb25seSBiZSB0cmlnZ2VyZWQgb25jZS5cbiAgICovXG4gIG5nWm9uZUV2ZW50Q29hbGVzY2luZz86IGJvb2xlYW47XG5cbiAgLyoqXG4gICAqIE9wdGlvbmFsbHkgc3BlY2lmeSBpZiBgTmdab25lI3J1bigpYCBtZXRob2QgaW52b2NhdGlvbnMgc2hvdWxkIGJlIGNvYWxlc2NlZFxuICAgKiBpbnRvIGEgc2luZ2xlIGNoYW5nZSBkZXRlY3Rpb24uXG4gICAqXG4gICAqIENvbnNpZGVyIHRoZSBmb2xsb3dpbmcgY2FzZS5cbiAgICogYGBgXG4gICAqIGZvciAobGV0IGkgPSAwOyBpIDwgMTA7IGkgKyspIHtcbiAgICogICBuZ1pvbmUucnVuKCgpID0+IHtcbiAgICogICAgIC8vIGRvIHNvbWV0aGluZ1xuICAgKiAgIH0pO1xuICAgKiB9XG4gICAqIGBgYFxuICAgKlxuICAgKiBUaGlzIGNhc2UgdHJpZ2dlcnMgdGhlIGNoYW5nZSBkZXRlY3Rpb24gbXVsdGlwbGUgdGltZXMuXG4gICAqIFdpdGggbmdab25lUnVuQ29hbGVzY2luZyBvcHRpb25zLCBhbGwgY2hhbmdlIGRldGVjdGlvbnMgaW4gYW4gZXZlbnQgbG9vcCB0cmlnZ2VyIG9ubHkgb25jZS5cbiAgICogSW4gYWRkaXRpb24sIHRoZSBjaGFuZ2UgZGV0ZWN0aW9uIGV4ZWN1dGVzIGluIHJlcXVlc3RBbmltYXRpb24uXG4gICAqXG4gICAqL1xuICBuZ1pvbmVSdW5Db2FsZXNjaW5nPzogYm9vbGVhbjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIF9jYWxsQW5kUmVwb3J0VG9FcnJvckhhbmRsZXIoXG4gICAgZXJyb3JIYW5kbGVyOiBFcnJvckhhbmRsZXIsIG5nWm9uZTogTmdab25lLCBjYWxsYmFjazogKCkgPT4gYW55KTogYW55IHtcbiAgdHJ5IHtcbiAgICBjb25zdCByZXN1bHQgPSBjYWxsYmFjaygpO1xuICAgIGlmIChpc1Byb21pc2UocmVzdWx0KSkge1xuICAgICAgcmV0dXJuIHJlc3VsdC5jYXRjaCgoZTogYW55KSA9PiB7XG4gICAgICAgIG5nWm9uZS5ydW5PdXRzaWRlQW5ndWxhcigoKSA9PiBlcnJvckhhbmRsZXIuaGFuZGxlRXJyb3IoZSkpO1xuICAgICAgICAvLyByZXRocm93IGFzIHRoZSBleGNlcHRpb24gaGFuZGxlciBtaWdodCBub3QgZG8gaXRcbiAgICAgICAgdGhyb3cgZTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHJldHVybiByZXN1bHQ7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICBuZ1pvbmUucnVuT3V0c2lkZUFuZ3VsYXIoKCkgPT4gZXJyb3JIYW5kbGVyLmhhbmRsZUVycm9yKGUpKTtcbiAgICAvLyByZXRocm93IGFzIHRoZSBleGNlcHRpb24gaGFuZGxlciBtaWdodCBub3QgZG8gaXRcbiAgICB0aHJvdyBlO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBvcHRpb25zUmVkdWNlcjxUIGV4dGVuZHMgT2JqZWN0Pihkc3Q6IFQsIG9ianM6IFR8VFtdKTogVCB7XG4gIGlmIChBcnJheS5pc0FycmF5KG9ianMpKSB7XG4gICAgcmV0dXJuIG9ianMucmVkdWNlKG9wdGlvbnNSZWR1Y2VyLCBkc3QpO1xuICB9XG4gIHJldHVybiB7Li4uZHN0LCAuLi5vYmpzfTtcbn1cblxuLyoqXG4gKiBBIHJlZmVyZW5jZSB0byBhbiBBbmd1bGFyIGFwcGxpY2F0aW9uIHJ1bm5pbmcgb24gYSBwYWdlLlxuICpcbiAqIEB1c2FnZU5vdGVzXG4gKiB7QGEgaXMtc3RhYmxlLWV4YW1wbGVzfVxuICogIyMjIGlzU3RhYmxlIGV4YW1wbGVzIGFuZCBjYXZlYXRzXG4gKlxuICogTm90ZSB0d28gaW1wb3J0YW50IHBvaW50cyBhYm91dCBgaXNTdGFibGVgLCBkZW1vbnN0cmF0ZWQgaW4gdGhlIGV4YW1wbGVzIGJlbG93OlxuICogLSB0aGUgYXBwbGljYXRpb24gd2lsbCBuZXZlciBiZSBzdGFibGUgaWYgeW91IHN0YXJ0IGFueSBraW5kXG4gKiBvZiByZWN1cnJlbnQgYXN5bmNocm9ub3VzIHRhc2sgd2hlbiB0aGUgYXBwbGljYXRpb24gc3RhcnRzXG4gKiAoZm9yIGV4YW1wbGUgZm9yIGEgcG9sbGluZyBwcm9jZXNzLCBzdGFydGVkIHdpdGggYSBgc2V0SW50ZXJ2YWxgLCBhIGBzZXRUaW1lb3V0YFxuICogb3IgdXNpbmcgUnhKUyBvcGVyYXRvcnMgbGlrZSBgaW50ZXJ2YWxgKTtcbiAqIC0gdGhlIGBpc1N0YWJsZWAgT2JzZXJ2YWJsZSBydW5zIG91dHNpZGUgb2YgdGhlIEFuZ3VsYXIgem9uZS5cbiAqXG4gKiBMZXQncyBpbWFnaW5lIHRoYXQgeW91IHN0YXJ0IGEgcmVjdXJyZW50IHRhc2tcbiAqIChoZXJlIGluY3JlbWVudGluZyBhIGNvdW50ZXIsIHVzaW5nIFJ4SlMgYGludGVydmFsYCksXG4gKiBhbmQgYXQgdGhlIHNhbWUgdGltZSBzdWJzY3JpYmUgdG8gYGlzU3RhYmxlYC5cbiAqXG4gKiBgYGBcbiAqIGNvbnN0cnVjdG9yKGFwcFJlZjogQXBwbGljYXRpb25SZWYpIHtcbiAqICAgYXBwUmVmLmlzU3RhYmxlLnBpcGUoXG4gKiAgICAgIGZpbHRlcihzdGFibGUgPT4gc3RhYmxlKVxuICogICApLnN1YnNjcmliZSgoKSA9PiBjb25zb2xlLmxvZygnQXBwIGlzIHN0YWJsZSBub3cnKTtcbiAqICAgaW50ZXJ2YWwoMTAwMCkuc3Vic2NyaWJlKGNvdW50ZXIgPT4gY29uc29sZS5sb2coY291bnRlcikpO1xuICogfVxuICogYGBgXG4gKiBJbiB0aGlzIGV4YW1wbGUsIGBpc1N0YWJsZWAgd2lsbCBuZXZlciBlbWl0IGB0cnVlYCxcbiAqIGFuZCB0aGUgdHJhY2UgXCJBcHAgaXMgc3RhYmxlIG5vd1wiIHdpbGwgbmV2ZXIgZ2V0IGxvZ2dlZC5cbiAqXG4gKiBJZiB5b3Ugd2FudCB0byBleGVjdXRlIHNvbWV0aGluZyB3aGVuIHRoZSBhcHAgaXMgc3RhYmxlLFxuICogeW91IGhhdmUgdG8gd2FpdCBmb3IgdGhlIGFwcGxpY2F0aW9uIHRvIGJlIHN0YWJsZVxuICogYmVmb3JlIHN0YXJ0aW5nIHlvdXIgcG9sbGluZyBwcm9jZXNzLlxuICpcbiAqIGBgYFxuICogY29uc3RydWN0b3IoYXBwUmVmOiBBcHBsaWNhdGlvblJlZikge1xuICogICBhcHBSZWYuaXNTdGFibGUucGlwZShcbiAqICAgICBmaXJzdChzdGFibGUgPT4gc3RhYmxlKSxcbiAqICAgICB0YXAoc3RhYmxlID0+IGNvbnNvbGUubG9nKCdBcHAgaXMgc3RhYmxlIG5vdycpKSxcbiAqICAgICBzd2l0Y2hNYXAoKCkgPT4gaW50ZXJ2YWwoMTAwMCkpXG4gKiAgICkuc3Vic2NyaWJlKGNvdW50ZXIgPT4gY29uc29sZS5sb2coY291bnRlcikpO1xuICogfVxuICogYGBgXG4gKiBJbiB0aGlzIGV4YW1wbGUsIHRoZSB0cmFjZSBcIkFwcCBpcyBzdGFibGUgbm93XCIgd2lsbCBiZSBsb2dnZWRcbiAqIGFuZCB0aGVuIHRoZSBjb3VudGVyIHN0YXJ0cyBpbmNyZW1lbnRpbmcgZXZlcnkgc2Vjb25kLlxuICpcbiAqIE5vdGUgYWxzbyB0aGF0IHRoaXMgT2JzZXJ2YWJsZSBydW5zIG91dHNpZGUgb2YgdGhlIEFuZ3VsYXIgem9uZSxcbiAqIHdoaWNoIG1lYW5zIHRoYXQgdGhlIGNvZGUgaW4gdGhlIHN1YnNjcmlwdGlvblxuICogdG8gdGhpcyBPYnNlcnZhYmxlIHdpbGwgbm90IHRyaWdnZXIgdGhlIGNoYW5nZSBkZXRlY3Rpb24uXG4gKlxuICogTGV0J3MgaW1hZ2luZSB0aGF0IGluc3RlYWQgb2YgbG9nZ2luZyB0aGUgY291bnRlciB2YWx1ZSxcbiAqIHlvdSB1cGRhdGUgYSBmaWVsZCBvZiB5b3VyIGNvbXBvbmVudFxuICogYW5kIGRpc3BsYXkgaXQgaW4gaXRzIHRlbXBsYXRlLlxuICpcbiAqIGBgYFxuICogY29uc3RydWN0b3IoYXBwUmVmOiBBcHBsaWNhdGlvblJlZikge1xuICogICBhcHBSZWYuaXNTdGFibGUucGlwZShcbiAqICAgICBmaXJzdChzdGFibGUgPT4gc3RhYmxlKSxcbiAqICAgICBzd2l0Y2hNYXAoKCkgPT4gaW50ZXJ2YWwoMTAwMCkpXG4gKiAgICkuc3Vic2NyaWJlKGNvdW50ZXIgPT4gdGhpcy52YWx1ZSA9IGNvdW50ZXIpO1xuICogfVxuICogYGBgXG4gKiBBcyB0aGUgYGlzU3RhYmxlYCBPYnNlcnZhYmxlIHJ1bnMgb3V0c2lkZSB0aGUgem9uZSxcbiAqIHRoZSBgdmFsdWVgIGZpZWxkIHdpbGwgYmUgdXBkYXRlZCBwcm9wZXJseSxcbiAqIGJ1dCB0aGUgdGVtcGxhdGUgd2lsbCBub3QgYmUgcmVmcmVzaGVkIVxuICpcbiAqIFlvdSdsbCBoYXZlIHRvIG1hbnVhbGx5IHRyaWdnZXIgdGhlIGNoYW5nZSBkZXRlY3Rpb24gdG8gdXBkYXRlIHRoZSB0ZW1wbGF0ZS5cbiAqXG4gKiBgYGBcbiAqIGNvbnN0cnVjdG9yKGFwcFJlZjogQXBwbGljYXRpb25SZWYsIGNkOiBDaGFuZ2VEZXRlY3RvclJlZikge1xuICogICBhcHBSZWYuaXNTdGFibGUucGlwZShcbiAqICAgICBmaXJzdChzdGFibGUgPT4gc3RhYmxlKSxcbiAqICAgICBzd2l0Y2hNYXAoKCkgPT4gaW50ZXJ2YWwoMTAwMCkpXG4gKiAgICkuc3Vic2NyaWJlKGNvdW50ZXIgPT4ge1xuICogICAgIHRoaXMudmFsdWUgPSBjb3VudGVyO1xuICogICAgIGNkLmRldGVjdENoYW5nZXMoKTtcbiAqICAgfSk7XG4gKiB9XG4gKiBgYGBcbiAqXG4gKiBPciBtYWtlIHRoZSBzdWJzY3JpcHRpb24gY2FsbGJhY2sgcnVuIGluc2lkZSB0aGUgem9uZS5cbiAqXG4gKiBgYGBcbiAqIGNvbnN0cnVjdG9yKGFwcFJlZjogQXBwbGljYXRpb25SZWYsIHpvbmU6IE5nWm9uZSkge1xuICogICBhcHBSZWYuaXNTdGFibGUucGlwZShcbiAqICAgICBmaXJzdChzdGFibGUgPT4gc3RhYmxlKSxcbiAqICAgICBzd2l0Y2hNYXAoKCkgPT4gaW50ZXJ2YWwoMTAwMCkpXG4gKiAgICkuc3Vic2NyaWJlKGNvdW50ZXIgPT4gem9uZS5ydW4oKCkgPT4gdGhpcy52YWx1ZSA9IGNvdW50ZXIpKTtcbiAqIH1cbiAqIGBgYFxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuQEluamVjdGFibGUoe3Byb3ZpZGVkSW46ICdyb290J30pXG5leHBvcnQgY2xhc3MgQXBwbGljYXRpb25SZWYge1xuICAvKiogQGludGVybmFsICovXG4gIHByaXZhdGUgX2Jvb3RzdHJhcExpc3RlbmVyczogKChjb21wUmVmOiBDb21wb25lbnRSZWY8YW55PikgPT4gdm9pZClbXSA9IFtdO1xuICBwcml2YXRlIF9ydW5uaW5nVGljazogYm9vbGVhbiA9IGZhbHNlO1xuICBwcml2YXRlIF9kZXN0cm95ZWQgPSBmYWxzZTtcbiAgcHJpdmF0ZSBfZGVzdHJveUxpc3RlbmVyczogQXJyYXk8KCkgPT4gdm9pZD4gPSBbXTtcbiAgLyoqIEBpbnRlcm5hbCAqL1xuICBfdmlld3M6IEludGVybmFsVmlld1JlZjx1bmtub3duPltdID0gW107XG4gIHByaXZhdGUgcmVhZG9ubHkgaW50ZXJuYWxFcnJvckhhbmRsZXIgPSBpbmplY3QoSU5URVJOQUxfQVBQTElDQVRJT05fRVJST1JfSEFORExFUik7XG4gIHByaXZhdGUgcmVhZG9ubHkgYWZ0ZXJSZW5kZXJFZmZlY3RNYW5hZ2VyID0gaW5qZWN0KEFmdGVyUmVuZGVyRXZlbnRNYW5hZ2VyKTtcblxuICAvKipcbiAgICogSW5kaWNhdGVzIHdoZXRoZXIgdGhpcyBpbnN0YW5jZSB3YXMgZGVzdHJveWVkLlxuICAgKi9cbiAgZ2V0IGRlc3Ryb3llZCgpIHtcbiAgICByZXR1cm4gdGhpcy5fZGVzdHJveWVkO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBhIGxpc3Qgb2YgY29tcG9uZW50IHR5cGVzIHJlZ2lzdGVyZWQgdG8gdGhpcyBhcHBsaWNhdGlvbi5cbiAgICogVGhpcyBsaXN0IGlzIHBvcHVsYXRlZCBldmVuIGJlZm9yZSB0aGUgY29tcG9uZW50IGlzIGNyZWF0ZWQuXG4gICAqL1xuICBwdWJsaWMgcmVhZG9ubHkgY29tcG9uZW50VHlwZXM6IFR5cGU8YW55PltdID0gW107XG5cbiAgLyoqXG4gICAqIEdldCBhIGxpc3Qgb2YgY29tcG9uZW50cyByZWdpc3RlcmVkIHRvIHRoaXMgYXBwbGljYXRpb24uXG4gICAqL1xuICBwdWJsaWMgcmVhZG9ubHkgY29tcG9uZW50czogQ29tcG9uZW50UmVmPGFueT5bXSA9IFtdO1xuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGFuIE9ic2VydmFibGUgdGhhdCBpbmRpY2F0ZXMgd2hlbiB0aGUgYXBwbGljYXRpb24gaXMgc3RhYmxlIG9yIHVuc3RhYmxlLlxuICAgKi9cbiAgcHVibGljIHJlYWRvbmx5IGlzU3RhYmxlOiBPYnNlcnZhYmxlPGJvb2xlYW4+ID1cbiAgICAgIGluamVjdChQZW5kaW5nVGFza3MpLmhhc1BlbmRpbmdUYXNrcy5waXBlKG1hcChwZW5kaW5nID0+ICFwZW5kaW5nKSk7XG5cbiAgcHJpdmF0ZSByZWFkb25seSBfaW5qZWN0b3IgPSBpbmplY3QoRW52aXJvbm1lbnRJbmplY3Rvcik7XG4gIC8qKlxuICAgKiBUaGUgYEVudmlyb25tZW50SW5qZWN0b3JgIHVzZWQgdG8gY3JlYXRlIHRoaXMgYXBwbGljYXRpb24uXG4gICAqL1xuICBnZXQgaW5qZWN0b3IoKTogRW52aXJvbm1lbnRJbmplY3RvciB7XG4gICAgcmV0dXJuIHRoaXMuX2luamVjdG9yO1xuICB9XG5cbiAgLyoqXG4gICAqIEJvb3RzdHJhcCBhIGNvbXBvbmVudCBvbnRvIHRoZSBlbGVtZW50IGlkZW50aWZpZWQgYnkgaXRzIHNlbGVjdG9yIG9yLCBvcHRpb25hbGx5LCB0byBhXG4gICAqIHNwZWNpZmllZCBlbGVtZW50LlxuICAgKlxuICAgKiBAdXNhZ2VOb3Rlc1xuICAgKiAjIyMgQm9vdHN0cmFwIHByb2Nlc3NcbiAgICpcbiAgICogV2hlbiBib290c3RyYXBwaW5nIGEgY29tcG9uZW50LCBBbmd1bGFyIG1vdW50cyBpdCBvbnRvIGEgdGFyZ2V0IERPTSBlbGVtZW50XG4gICAqIGFuZCBraWNrcyBvZmYgYXV0b21hdGljIGNoYW5nZSBkZXRlY3Rpb24uIFRoZSB0YXJnZXQgRE9NIGVsZW1lbnQgY2FuIGJlXG4gICAqIHByb3ZpZGVkIHVzaW5nIHRoZSBgcm9vdFNlbGVjdG9yT3JOb2RlYCBhcmd1bWVudC5cbiAgICpcbiAgICogSWYgdGhlIHRhcmdldCBET00gZWxlbWVudCBpcyBub3QgcHJvdmlkZWQsIEFuZ3VsYXIgdHJpZXMgdG8gZmluZCBvbmUgb24gYSBwYWdlXG4gICAqIHVzaW5nIHRoZSBgc2VsZWN0b3JgIG9mIHRoZSBjb21wb25lbnQgdGhhdCBpcyBiZWluZyBib290c3RyYXBwZWRcbiAgICogKGZpcnN0IG1hdGNoZWQgZWxlbWVudCBpcyB1c2VkKS5cbiAgICpcbiAgICogIyMjIEV4YW1wbGVcbiAgICpcbiAgICogR2VuZXJhbGx5LCB3ZSBkZWZpbmUgdGhlIGNvbXBvbmVudCB0byBib290c3RyYXAgaW4gdGhlIGBib290c3RyYXBgIGFycmF5IG9mIGBOZ01vZHVsZWAsXG4gICAqIGJ1dCBpdCByZXF1aXJlcyB1cyB0byBrbm93IHRoZSBjb21wb25lbnQgd2hpbGUgd3JpdGluZyB0aGUgYXBwbGljYXRpb24gY29kZS5cbiAgICpcbiAgICogSW1hZ2luZSBhIHNpdHVhdGlvbiB3aGVyZSB3ZSBoYXZlIHRvIHdhaXQgZm9yIGFuIEFQSSBjYWxsIHRvIGRlY2lkZSBhYm91dCB0aGUgY29tcG9uZW50IHRvXG4gICAqIGJvb3RzdHJhcC4gV2UgY2FuIHVzZSB0aGUgYG5nRG9Cb290c3RyYXBgIGhvb2sgb2YgdGhlIGBOZ01vZHVsZWAgYW5kIGNhbGwgdGhpcyBtZXRob2QgdG9cbiAgICogZHluYW1pY2FsbHkgYm9vdHN0cmFwIGEgY29tcG9uZW50LlxuICAgKlxuICAgKiB7QGV4YW1wbGUgY29yZS90cy9wbGF0Zm9ybS9wbGF0Zm9ybS50cyByZWdpb249J2NvbXBvbmVudFNlbGVjdG9yJ31cbiAgICpcbiAgICogT3B0aW9uYWxseSwgYSBjb21wb25lbnQgY2FuIGJlIG1vdW50ZWQgb250byBhIERPTSBlbGVtZW50IHRoYXQgZG9lcyBub3QgbWF0Y2ggdGhlXG4gICAqIHNlbGVjdG9yIG9mIHRoZSBib290c3RyYXBwZWQgY29tcG9uZW50LlxuICAgKlxuICAgKiBJbiB0aGUgZm9sbG93aW5nIGV4YW1wbGUsIHdlIGFyZSBwcm92aWRpbmcgYSBDU1Mgc2VsZWN0b3IgdG8gbWF0Y2ggdGhlIHRhcmdldCBlbGVtZW50LlxuICAgKlxuICAgKiB7QGV4YW1wbGUgY29yZS90cy9wbGF0Zm9ybS9wbGF0Zm9ybS50cyByZWdpb249J2Nzc1NlbGVjdG9yJ31cbiAgICpcbiAgICogV2hpbGUgaW4gdGhpcyBleGFtcGxlLCB3ZSBhcmUgcHJvdmlkaW5nIHJlZmVyZW5jZSB0byBhIERPTSBub2RlLlxuICAgKlxuICAgKiB7QGV4YW1wbGUgY29yZS90cy9wbGF0Zm9ybS9wbGF0Zm9ybS50cyByZWdpb249J2RvbU5vZGUnfVxuICAgKi9cbiAgYm9vdHN0cmFwPEM+KGNvbXBvbmVudDogVHlwZTxDPiwgcm9vdFNlbGVjdG9yT3JOb2RlPzogc3RyaW5nfGFueSk6IENvbXBvbmVudFJlZjxDPjtcblxuICAvKipcbiAgICogQm9vdHN0cmFwIGEgY29tcG9uZW50IG9udG8gdGhlIGVsZW1lbnQgaWRlbnRpZmllZCBieSBpdHMgc2VsZWN0b3Igb3IsIG9wdGlvbmFsbHksIHRvIGFcbiAgICogc3BlY2lmaWVkIGVsZW1lbnQuXG4gICAqXG4gICAqIEB1c2FnZU5vdGVzXG4gICAqICMjIyBCb290c3RyYXAgcHJvY2Vzc1xuICAgKlxuICAgKiBXaGVuIGJvb3RzdHJhcHBpbmcgYSBjb21wb25lbnQsIEFuZ3VsYXIgbW91bnRzIGl0IG9udG8gYSB0YXJnZXQgRE9NIGVsZW1lbnRcbiAgICogYW5kIGtpY2tzIG9mZiBhdXRvbWF0aWMgY2hhbmdlIGRldGVjdGlvbi4gVGhlIHRhcmdldCBET00gZWxlbWVudCBjYW4gYmVcbiAgICogcHJvdmlkZWQgdXNpbmcgdGhlIGByb290U2VsZWN0b3JPck5vZGVgIGFyZ3VtZW50LlxuICAgKlxuICAgKiBJZiB0aGUgdGFyZ2V0IERPTSBlbGVtZW50IGlzIG5vdCBwcm92aWRlZCwgQW5ndWxhciB0cmllcyB0byBmaW5kIG9uZSBvbiBhIHBhZ2VcbiAgICogdXNpbmcgdGhlIGBzZWxlY3RvcmAgb2YgdGhlIGNvbXBvbmVudCB0aGF0IGlzIGJlaW5nIGJvb3RzdHJhcHBlZFxuICAgKiAoZmlyc3QgbWF0Y2hlZCBlbGVtZW50IGlzIHVzZWQpLlxuICAgKlxuICAgKiAjIyMgRXhhbXBsZVxuICAgKlxuICAgKiBHZW5lcmFsbHksIHdlIGRlZmluZSB0aGUgY29tcG9uZW50IHRvIGJvb3RzdHJhcCBpbiB0aGUgYGJvb3RzdHJhcGAgYXJyYXkgb2YgYE5nTW9kdWxlYCxcbiAgICogYnV0IGl0IHJlcXVpcmVzIHVzIHRvIGtub3cgdGhlIGNvbXBvbmVudCB3aGlsZSB3cml0aW5nIHRoZSBhcHBsaWNhdGlvbiBjb2RlLlxuICAgKlxuICAgKiBJbWFnaW5lIGEgc2l0dWF0aW9uIHdoZXJlIHdlIGhhdmUgdG8gd2FpdCBmb3IgYW4gQVBJIGNhbGwgdG8gZGVjaWRlIGFib3V0IHRoZSBjb21wb25lbnQgdG9cbiAgICogYm9vdHN0cmFwLiBXZSBjYW4gdXNlIHRoZSBgbmdEb0Jvb3RzdHJhcGAgaG9vayBvZiB0aGUgYE5nTW9kdWxlYCBhbmQgY2FsbCB0aGlzIG1ldGhvZCB0b1xuICAgKiBkeW5hbWljYWxseSBib290c3RyYXAgYSBjb21wb25lbnQuXG4gICAqXG4gICAqIHtAZXhhbXBsZSBjb3JlL3RzL3BsYXRmb3JtL3BsYXRmb3JtLnRzIHJlZ2lvbj0nY29tcG9uZW50U2VsZWN0b3InfVxuICAgKlxuICAgKiBPcHRpb25hbGx5LCBhIGNvbXBvbmVudCBjYW4gYmUgbW91bnRlZCBvbnRvIGEgRE9NIGVsZW1lbnQgdGhhdCBkb2VzIG5vdCBtYXRjaCB0aGVcbiAgICogc2VsZWN0b3Igb2YgdGhlIGJvb3RzdHJhcHBlZCBjb21wb25lbnQuXG4gICAqXG4gICAqIEluIHRoZSBmb2xsb3dpbmcgZXhhbXBsZSwgd2UgYXJlIHByb3ZpZGluZyBhIENTUyBzZWxlY3RvciB0byBtYXRjaCB0aGUgdGFyZ2V0IGVsZW1lbnQuXG4gICAqXG4gICAqIHtAZXhhbXBsZSBjb3JlL3RzL3BsYXRmb3JtL3BsYXRmb3JtLnRzIHJlZ2lvbj0nY3NzU2VsZWN0b3InfVxuICAgKlxuICAgKiBXaGlsZSBpbiB0aGlzIGV4YW1wbGUsIHdlIGFyZSBwcm92aWRpbmcgcmVmZXJlbmNlIHRvIGEgRE9NIG5vZGUuXG4gICAqXG4gICAqIHtAZXhhbXBsZSBjb3JlL3RzL3BsYXRmb3JtL3BsYXRmb3JtLnRzIHJlZ2lvbj0nZG9tTm9kZSd9XG4gICAqXG4gICAqIEBkZXByZWNhdGVkIFBhc3NpbmcgQ29tcG9uZW50IGZhY3RvcmllcyBhcyB0aGUgYEFwcGxpY2F0aW9uLmJvb3RzdHJhcGAgZnVuY3Rpb24gYXJndW1lbnQgaXNcbiAgICogICAgIGRlcHJlY2F0ZWQuIFBhc3MgQ29tcG9uZW50IFR5cGVzIGluc3RlYWQuXG4gICAqL1xuICBib290c3RyYXA8Qz4oY29tcG9uZW50RmFjdG9yeTogQ29tcG9uZW50RmFjdG9yeTxDPiwgcm9vdFNlbGVjdG9yT3JOb2RlPzogc3RyaW5nfGFueSk6XG4gICAgICBDb21wb25lbnRSZWY8Qz47XG5cbiAgLyoqXG4gICAqIEJvb3RzdHJhcCBhIGNvbXBvbmVudCBvbnRvIHRoZSBlbGVtZW50IGlkZW50aWZpZWQgYnkgaXRzIHNlbGVjdG9yIG9yLCBvcHRpb25hbGx5LCB0byBhXG4gICAqIHNwZWNpZmllZCBlbGVtZW50LlxuICAgKlxuICAgKiBAdXNhZ2VOb3Rlc1xuICAgKiAjIyMgQm9vdHN0cmFwIHByb2Nlc3NcbiAgICpcbiAgICogV2hlbiBib290c3RyYXBwaW5nIGEgY29tcG9uZW50LCBBbmd1bGFyIG1vdW50cyBpdCBvbnRvIGEgdGFyZ2V0IERPTSBlbGVtZW50XG4gICAqIGFuZCBraWNrcyBvZmYgYXV0b21hdGljIGNoYW5nZSBkZXRlY3Rpb24uIFRoZSB0YXJnZXQgRE9NIGVsZW1lbnQgY2FuIGJlXG4gICAqIHByb3ZpZGVkIHVzaW5nIHRoZSBgcm9vdFNlbGVjdG9yT3JOb2RlYCBhcmd1bWVudC5cbiAgICpcbiAgICogSWYgdGhlIHRhcmdldCBET00gZWxlbWVudCBpcyBub3QgcHJvdmlkZWQsIEFuZ3VsYXIgdHJpZXMgdG8gZmluZCBvbmUgb24gYSBwYWdlXG4gICAqIHVzaW5nIHRoZSBgc2VsZWN0b3JgIG9mIHRoZSBjb21wb25lbnQgdGhhdCBpcyBiZWluZyBib290c3RyYXBwZWRcbiAgICogKGZpcnN0IG1hdGNoZWQgZWxlbWVudCBpcyB1c2VkKS5cbiAgICpcbiAgICogIyMjIEV4YW1wbGVcbiAgICpcbiAgICogR2VuZXJhbGx5LCB3ZSBkZWZpbmUgdGhlIGNvbXBvbmVudCB0byBib290c3RyYXAgaW4gdGhlIGBib290c3RyYXBgIGFycmF5IG9mIGBOZ01vZHVsZWAsXG4gICAqIGJ1dCBpdCByZXF1aXJlcyB1cyB0byBrbm93IHRoZSBjb21wb25lbnQgd2hpbGUgd3JpdGluZyB0aGUgYXBwbGljYXRpb24gY29kZS5cbiAgICpcbiAgICogSW1hZ2luZSBhIHNpdHVhdGlvbiB3aGVyZSB3ZSBoYXZlIHRvIHdhaXQgZm9yIGFuIEFQSSBjYWxsIHRvIGRlY2lkZSBhYm91dCB0aGUgY29tcG9uZW50IHRvXG4gICAqIGJvb3RzdHJhcC4gV2UgY2FuIHVzZSB0aGUgYG5nRG9Cb290c3RyYXBgIGhvb2sgb2YgdGhlIGBOZ01vZHVsZWAgYW5kIGNhbGwgdGhpcyBtZXRob2QgdG9cbiAgICogZHluYW1pY2FsbHkgYm9vdHN0cmFwIGEgY29tcG9uZW50LlxuICAgKlxuICAgKiB7QGV4YW1wbGUgY29yZS90cy9wbGF0Zm9ybS9wbGF0Zm9ybS50cyByZWdpb249J2NvbXBvbmVudFNlbGVjdG9yJ31cbiAgICpcbiAgICogT3B0aW9uYWxseSwgYSBjb21wb25lbnQgY2FuIGJlIG1vdW50ZWQgb250byBhIERPTSBlbGVtZW50IHRoYXQgZG9lcyBub3QgbWF0Y2ggdGhlXG4gICAqIHNlbGVjdG9yIG9mIHRoZSBib290c3RyYXBwZWQgY29tcG9uZW50LlxuICAgKlxuICAgKiBJbiB0aGUgZm9sbG93aW5nIGV4YW1wbGUsIHdlIGFyZSBwcm92aWRpbmcgYSBDU1Mgc2VsZWN0b3IgdG8gbWF0Y2ggdGhlIHRhcmdldCBlbGVtZW50LlxuICAgKlxuICAgKiB7QGV4YW1wbGUgY29yZS90cy9wbGF0Zm9ybS9wbGF0Zm9ybS50cyByZWdpb249J2Nzc1NlbGVjdG9yJ31cbiAgICpcbiAgICogV2hpbGUgaW4gdGhpcyBleGFtcGxlLCB3ZSBhcmUgcHJvdmlkaW5nIHJlZmVyZW5jZSB0byBhIERPTSBub2RlLlxuICAgKlxuICAgKiB7QGV4YW1wbGUgY29yZS90cy9wbGF0Zm9ybS9wbGF0Zm9ybS50cyByZWdpb249J2RvbU5vZGUnfVxuICAgKi9cbiAgYm9vdHN0cmFwPEM+KGNvbXBvbmVudE9yRmFjdG9yeTogQ29tcG9uZW50RmFjdG9yeTxDPnxUeXBlPEM+LCByb290U2VsZWN0b3JPck5vZGU/OiBzdHJpbmd8YW55KTpcbiAgICAgIENvbXBvbmVudFJlZjxDPiB7XG4gICAgKHR5cGVvZiBuZ0Rldk1vZGUgPT09ICd1bmRlZmluZWQnIHx8IG5nRGV2TW9kZSkgJiYgdGhpcy53YXJuSWZEZXN0cm95ZWQoKTtcbiAgICBjb25zdCBpc0NvbXBvbmVudEZhY3RvcnkgPSBjb21wb25lbnRPckZhY3RvcnkgaW5zdGFuY2VvZiBDb21wb25lbnRGYWN0b3J5O1xuICAgIGNvbnN0IGluaXRTdGF0dXMgPSB0aGlzLl9pbmplY3Rvci5nZXQoQXBwbGljYXRpb25Jbml0U3RhdHVzKTtcblxuICAgIGlmICghaW5pdFN0YXR1cy5kb25lKSB7XG4gICAgICBjb25zdCBzdGFuZGFsb25lID0gIWlzQ29tcG9uZW50RmFjdG9yeSAmJiBpc1N0YW5kYWxvbmUoY29tcG9uZW50T3JGYWN0b3J5KTtcbiAgICAgIGNvbnN0IGVycm9yTWVzc2FnZSA9ICh0eXBlb2YgbmdEZXZNb2RlID09PSAndW5kZWZpbmVkJyB8fCBuZ0Rldk1vZGUpICYmXG4gICAgICAgICAgJ0Nhbm5vdCBib290c3RyYXAgYXMgdGhlcmUgYXJlIHN0aWxsIGFzeW5jaHJvbm91cyBpbml0aWFsaXplcnMgcnVubmluZy4nICtcbiAgICAgICAgICAgICAgKHN0YW5kYWxvbmUgP1xuICAgICAgICAgICAgICAgICAgICcnIDpcbiAgICAgICAgICAgICAgICAgICAnIEJvb3RzdHJhcCBjb21wb25lbnRzIGluIHRoZSBgbmdEb0Jvb3RzdHJhcGAgbWV0aG9kIG9mIHRoZSByb290IG1vZHVsZS4nKTtcbiAgICAgIHRocm93IG5ldyBSdW50aW1lRXJyb3IoUnVudGltZUVycm9yQ29kZS5BU1lOQ19JTklUSUFMSVpFUlNfU1RJTExfUlVOTklORywgZXJyb3JNZXNzYWdlKTtcbiAgICB9XG5cbiAgICBsZXQgY29tcG9uZW50RmFjdG9yeTogQ29tcG9uZW50RmFjdG9yeTxDPjtcbiAgICBpZiAoaXNDb21wb25lbnRGYWN0b3J5KSB7XG4gICAgICBjb21wb25lbnRGYWN0b3J5ID0gY29tcG9uZW50T3JGYWN0b3J5O1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCByZXNvbHZlciA9IHRoaXMuX2luamVjdG9yLmdldChDb21wb25lbnRGYWN0b3J5UmVzb2x2ZXIpO1xuICAgICAgY29tcG9uZW50RmFjdG9yeSA9IHJlc29sdmVyLnJlc29sdmVDb21wb25lbnRGYWN0b3J5KGNvbXBvbmVudE9yRmFjdG9yeSkhO1xuICAgIH1cbiAgICB0aGlzLmNvbXBvbmVudFR5cGVzLnB1c2goY29tcG9uZW50RmFjdG9yeS5jb21wb25lbnRUeXBlKTtcblxuICAgIC8vIENyZWF0ZSBhIGZhY3RvcnkgYXNzb2NpYXRlZCB3aXRoIHRoZSBjdXJyZW50IG1vZHVsZSBpZiBpdCdzIG5vdCBib3VuZCB0byBzb21lIG90aGVyXG4gICAgY29uc3QgbmdNb2R1bGUgPVxuICAgICAgICBpc0JvdW5kVG9Nb2R1bGUoY29tcG9uZW50RmFjdG9yeSkgPyB1bmRlZmluZWQgOiB0aGlzLl9pbmplY3Rvci5nZXQoTmdNb2R1bGVSZWYpO1xuICAgIGNvbnN0IHNlbGVjdG9yT3JOb2RlID0gcm9vdFNlbGVjdG9yT3JOb2RlIHx8IGNvbXBvbmVudEZhY3Rvcnkuc2VsZWN0b3I7XG4gICAgY29uc3QgY29tcFJlZiA9IGNvbXBvbmVudEZhY3RvcnkuY3JlYXRlKEluamVjdG9yLk5VTEwsIFtdLCBzZWxlY3Rvck9yTm9kZSwgbmdNb2R1bGUpO1xuICAgIGNvbnN0IG5hdGl2ZUVsZW1lbnQgPSBjb21wUmVmLmxvY2F0aW9uLm5hdGl2ZUVsZW1lbnQ7XG4gICAgY29uc3QgdGVzdGFiaWxpdHkgPSBjb21wUmVmLmluamVjdG9yLmdldChURVNUQUJJTElUWSwgbnVsbCk7XG4gICAgdGVzdGFiaWxpdHk/LnJlZ2lzdGVyQXBwbGljYXRpb24obmF0aXZlRWxlbWVudCk7XG5cbiAgICBjb21wUmVmLm9uRGVzdHJveSgoKSA9PiB7XG4gICAgICB0aGlzLmRldGFjaFZpZXcoY29tcFJlZi5ob3N0Vmlldyk7XG4gICAgICByZW1vdmUodGhpcy5jb21wb25lbnRzLCBjb21wUmVmKTtcbiAgICAgIHRlc3RhYmlsaXR5Py51bnJlZ2lzdGVyQXBwbGljYXRpb24obmF0aXZlRWxlbWVudCk7XG4gICAgfSk7XG5cbiAgICB0aGlzLl9sb2FkQ29tcG9uZW50KGNvbXBSZWYpO1xuICAgIGlmICh0eXBlb2YgbmdEZXZNb2RlID09PSAndW5kZWZpbmVkJyB8fCBuZ0Rldk1vZGUpIHtcbiAgICAgIGNvbnN0IF9jb25zb2xlID0gdGhpcy5faW5qZWN0b3IuZ2V0KENvbnNvbGUpO1xuICAgICAgX2NvbnNvbGUubG9nKGBBbmd1bGFyIGlzIHJ1bm5pbmcgaW4gZGV2ZWxvcG1lbnQgbW9kZS5gKTtcbiAgICB9XG4gICAgcmV0dXJuIGNvbXBSZWY7XG4gIH1cblxuICAvKipcbiAgICogSW52b2tlIHRoaXMgbWV0aG9kIHRvIGV4cGxpY2l0bHkgcHJvY2VzcyBjaGFuZ2UgZGV0ZWN0aW9uIGFuZCBpdHMgc2lkZS1lZmZlY3RzLlxuICAgKlxuICAgKiBJbiBkZXZlbG9wbWVudCBtb2RlLCBgdGljaygpYCBhbHNvIHBlcmZvcm1zIGEgc2Vjb25kIGNoYW5nZSBkZXRlY3Rpb24gY3ljbGUgdG8gZW5zdXJlIHRoYXQgbm9cbiAgICogZnVydGhlciBjaGFuZ2VzIGFyZSBkZXRlY3RlZC4gSWYgYWRkaXRpb25hbCBjaGFuZ2VzIGFyZSBwaWNrZWQgdXAgZHVyaW5nIHRoaXMgc2Vjb25kIGN5Y2xlLFxuICAgKiBiaW5kaW5ncyBpbiB0aGUgYXBwIGhhdmUgc2lkZS1lZmZlY3RzIHRoYXQgY2Fubm90IGJlIHJlc29sdmVkIGluIGEgc2luZ2xlIGNoYW5nZSBkZXRlY3Rpb25cbiAgICogcGFzcy5cbiAgICogSW4gdGhpcyBjYXNlLCBBbmd1bGFyIHRocm93cyBhbiBlcnJvciwgc2luY2UgYW4gQW5ndWxhciBhcHBsaWNhdGlvbiBjYW4gb25seSBoYXZlIG9uZSBjaGFuZ2VcbiAgICogZGV0ZWN0aW9uIHBhc3MgZHVyaW5nIHdoaWNoIGFsbCBjaGFuZ2UgZGV0ZWN0aW9uIG11c3QgY29tcGxldGUuXG4gICAqL1xuICB0aWNrKCk6IHZvaWQge1xuICAgICh0eXBlb2YgbmdEZXZNb2RlID09PSAndW5kZWZpbmVkJyB8fCBuZ0Rldk1vZGUpICYmIHRoaXMud2FybklmRGVzdHJveWVkKCk7XG4gICAgaWYgKHRoaXMuX3J1bm5pbmdUaWNrKSB7XG4gICAgICB0aHJvdyBuZXcgUnVudGltZUVycm9yKFxuICAgICAgICAgIFJ1bnRpbWVFcnJvckNvZGUuUkVDVVJTSVZFX0FQUExJQ0FUSU9OX1JFRl9USUNLLFxuICAgICAgICAgIG5nRGV2TW9kZSAmJiAnQXBwbGljYXRpb25SZWYudGljayBpcyBjYWxsZWQgcmVjdXJzaXZlbHknKTtcbiAgICB9XG5cbiAgICBjb25zdCBwcmV2Q29uc3VtZXIgPSBzZXRBY3RpdmVDb25zdW1lcihudWxsKTtcbiAgICB0cnkge1xuICAgICAgdGhpcy5fcnVubmluZ1RpY2sgPSB0cnVlO1xuXG4gICAgICB0aGlzLmRldGVjdENoYW5nZXNJbkF0dGFjaGVkVmlld3MoKTtcblxuICAgICAgaWYgKCh0eXBlb2YgbmdEZXZNb2RlID09PSAndW5kZWZpbmVkJyB8fCBuZ0Rldk1vZGUpKSB7XG4gICAgICAgIGZvciAobGV0IHZpZXcgb2YgdGhpcy5fdmlld3MpIHtcbiAgICAgICAgICB2aWV3LmNoZWNrTm9DaGFuZ2VzKCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAvLyBBdHRlbnRpb246IERvbid0IHJldGhyb3cgYXMgaXQgY291bGQgY2FuY2VsIHN1YnNjcmlwdGlvbnMgdG8gT2JzZXJ2YWJsZXMhXG4gICAgICB0aGlzLmludGVybmFsRXJyb3JIYW5kbGVyKGUpO1xuICAgIH0gZmluYWxseSB7XG4gICAgICB0aGlzLl9ydW5uaW5nVGljayA9IGZhbHNlO1xuICAgICAgc2V0QWN0aXZlQ29uc3VtZXIocHJldkNvbnN1bWVyKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGRldGVjdENoYW5nZXNJbkF0dGFjaGVkVmlld3MoKSB7XG4gICAgbGV0IHJ1bnMgPSAwO1xuICAgIGNvbnN0IGFmdGVyUmVuZGVyRWZmZWN0TWFuYWdlciA9IHRoaXMuYWZ0ZXJSZW5kZXJFZmZlY3RNYW5hZ2VyO1xuICAgIHdoaWxlICh0cnVlKSB7XG4gICAgICBpZiAocnVucyA9PT0gTUFYSU1VTV9SRUZSRVNIX1JFUlVOUykge1xuICAgICAgICB0aHJvdyBuZXcgUnVudGltZUVycm9yKFxuICAgICAgICAgICAgUnVudGltZUVycm9yQ29kZS5JTkZJTklURV9DSEFOR0VfREVURUNUSU9OLFxuICAgICAgICAgICAgbmdEZXZNb2RlICYmXG4gICAgICAgICAgICAgICAgJ0luZmluaXRlIGNoYW5nZSBkZXRlY3Rpb24gd2hpbGUgcmVmcmVzaGluZyBhcHBsaWNhdGlvbiB2aWV3cy4gJyArXG4gICAgICAgICAgICAgICAgICAgICdFbnN1cmUgYWZ0ZXJSZW5kZXIgb3IgcXVldWVTdGF0ZVVwZGF0ZSBob29rcyBhcmUgbm90IGNvbnRpbnVvdXNseSBjYXVzaW5nIHVwZGF0ZXMuJyk7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGlzRmlyc3RQYXNzID0gcnVucyA9PT0gMDtcbiAgICAgIGZvciAobGV0IHtfbFZpZXcsIG5vdGlmeUVycm9ySGFuZGxlcn0gb2YgdGhpcy5fdmlld3MpIHtcbiAgICAgICAgLy8gV2hlbiByZS1jaGVja2luZywgb25seSBjaGVjayB2aWV3cyB3aGljaCBhY3R1YWxseSBuZWVkIGl0LlxuICAgICAgICBpZiAoIWlzRmlyc3RQYXNzICYmICFzaG91bGRSZWNoZWNrVmlldyhfbFZpZXcpKSB7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5kZXRlY3RDaGFuZ2VzSW5WaWV3KF9sVmlldywgbm90aWZ5RXJyb3JIYW5kbGVyLCBpc0ZpcnN0UGFzcyk7XG4gICAgICB9XG4gICAgICBydW5zKys7XG5cbiAgICAgIGFmdGVyUmVuZGVyRWZmZWN0TWFuYWdlci5leGVjdXRlSW50ZXJuYWxDYWxsYmFja3MoKTtcbiAgICAgIC8vIElmIHdlIGhhdmUgYSBuZXdseSBkaXJ0eSB2aWV3IGFmdGVyIHJ1bm5pbmcgaW50ZXJuYWwgY2FsbGJhY2tzLCByZWNoZWNrIHRoZSB2aWV3cyBhZ2FpblxuICAgICAgLy8gYmVmb3JlIHJ1bm5pbmcgdXNlci1wcm92aWRlZCBjYWxsYmFja3NcbiAgICAgIGlmICh0aGlzLl92aWV3cy5zb21lKCh7X2xWaWV3fSkgPT4gc2hvdWxkUmVjaGVja1ZpZXcoX2xWaWV3KSkpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIGFmdGVyUmVuZGVyRWZmZWN0TWFuYWdlci5leGVjdXRlKCk7XG4gICAgICAvLyBJZiBhZnRlciBydW5uaW5nIGFsbCBhZnRlclJlbmRlciBjYWxsYmFja3Mgd2UgaGF2ZSBubyBtb3JlIHZpZXdzIHRoYXQgbmVlZCB0byBiZSByZWZyZXNoZWQsXG4gICAgICAvLyB3ZSBjYW4gYnJlYWsgb3V0IG9mIHRoZSBsb29wXG4gICAgICBpZiAoIXRoaXMuX3ZpZXdzLnNvbWUoKHtfbFZpZXd9KSA9PiBzaG91bGRSZWNoZWNrVmlldyhfbFZpZXcpKSkge1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGRldGVjdENoYW5nZXNJblZpZXcobFZpZXc6IExWaWV3LCBub3RpZnlFcnJvckhhbmRsZXI6IGJvb2xlYW4sIGlzRmlyc3RQYXNzOiBib29sZWFuKSB7XG4gICAgbGV0IG1vZGU6IENoYW5nZURldGVjdGlvbk1vZGU7XG4gICAgaWYgKGlzRmlyc3RQYXNzKSB7XG4gICAgICAvLyBUaGUgZmlyc3QgcGFzcyBpcyBhbHdheXMgaW4gR2xvYmFsIG1vZGUsIHdoaWNoIGluY2x1ZGVzIGBDaGVja0Fsd2F5c2Agdmlld3MuXG4gICAgICBtb2RlID0gQ2hhbmdlRGV0ZWN0aW9uTW9kZS5HbG9iYWw7XG4gICAgICAvLyBBZGQgYFJlZnJlc2hWaWV3YCBmbGFnIHRvIGVuc3VyZSB0aGlzIHZpZXcgaXMgcmVmcmVzaGVkIGlmIG5vdCBhbHJlYWR5IGRpcnR5LlxuICAgICAgLy8gYFJlZnJlc2hWaWV3YCBmbGFnIGlzIHVzZWQgaW50ZW50aW9uYWxseSBvdmVyIGBEaXJ0eWAgYmVjYXVzZSBpdCBnZXRzIGNsZWFyZWQgYmVmb3JlXG4gICAgICAvLyBleGVjdXRpbmcgYW55IG9mIHRoZSBhY3R1YWwgcmVmcmVzaCBjb2RlIHdoaWxlIHRoZSBgRGlydHlgIGZsYWcgZG9lc24ndCBnZXQgY2xlYXJlZFxuICAgICAgLy8gdW50aWwgdGhlIGVuZCBvZiB0aGUgcmVmcmVzaC4gVXNpbmcgYFJlZnJlc2hWaWV3YCBwcmV2ZW50cyBjcmVhdGluZyBhIHBvdGVudGlhbFxuICAgICAgLy8gZGlmZmVyZW5jZSBpbiB0aGUgc3RhdGUgb2YgdGhlIExWaWV3RmxhZ3MgZHVyaW5nIHRlbXBsYXRlIGV4ZWN1dGlvbi5cbiAgICAgIGxWaWV3W0ZMQUdTXSB8PSBMVmlld0ZsYWdzLlJlZnJlc2hWaWV3O1xuICAgIH0gZWxzZSBpZiAobFZpZXdbRkxBR1NdICYgTFZpZXdGbGFncy5EaXJ0eSkge1xuICAgICAgLy8gVGhlIHJvb3QgdmlldyBoYXMgYmVlbiBleHBsaWNpdGx5IG1hcmtlZCBmb3IgY2hlY2ssIHNvIGNoZWNrIGl0IGluIEdsb2JhbCBtb2RlLlxuICAgICAgbW9kZSA9IENoYW5nZURldGVjdGlvbk1vZGUuR2xvYmFsO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBUaGUgdmlldyBoYXMgbm90IGJlZW4gbWFya2VkIGZvciBjaGVjaywgYnV0IGNvbnRhaW5zIGEgdmlldyBtYXJrZWQgZm9yIHJlZnJlc2hcbiAgICAgIC8vIChsaWtlbHkgdmlhIGEgc2lnbmFsKS4gU3RhcnQgdGhpcyBjaGFuZ2UgZGV0ZWN0aW9uIGluIFRhcmdldGVkIG1vZGUgdG8gc2tpcCB0aGUgcm9vdFxuICAgICAgLy8gdmlldyBhbmQgY2hlY2sganVzdCB0aGUgdmlldyhzKSB0aGF0IG5lZWQgcmVmcmVzaGVkLlxuICAgICAgbW9kZSA9IENoYW5nZURldGVjdGlvbk1vZGUuVGFyZ2V0ZWQ7XG4gICAgfVxuICAgIGRldGVjdENoYW5nZXNJbnRlcm5hbChsVmlldywgbm90aWZ5RXJyb3JIYW5kbGVyLCBtb2RlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBdHRhY2hlcyBhIHZpZXcgc28gdGhhdCBpdCB3aWxsIGJlIGRpcnR5IGNoZWNrZWQuXG4gICAqIFRoZSB2aWV3IHdpbGwgYmUgYXV0b21hdGljYWxseSBkZXRhY2hlZCB3aGVuIGl0IGlzIGRlc3Ryb3llZC5cbiAgICogVGhpcyB3aWxsIHRocm93IGlmIHRoZSB2aWV3IGlzIGFscmVhZHkgYXR0YWNoZWQgdG8gYSBWaWV3Q29udGFpbmVyLlxuICAgKi9cbiAgYXR0YWNoVmlldyh2aWV3UmVmOiBWaWV3UmVmKTogdm9pZCB7XG4gICAgKHR5cGVvZiBuZ0Rldk1vZGUgPT09ICd1bmRlZmluZWQnIHx8IG5nRGV2TW9kZSkgJiYgdGhpcy53YXJuSWZEZXN0cm95ZWQoKTtcbiAgICBjb25zdCB2aWV3ID0gKHZpZXdSZWYgYXMgSW50ZXJuYWxWaWV3UmVmPHVua25vd24+KTtcbiAgICB0aGlzLl92aWV3cy5wdXNoKHZpZXcpO1xuICAgIHZpZXcuYXR0YWNoVG9BcHBSZWYodGhpcyk7XG4gIH1cblxuICAvKipcbiAgICogRGV0YWNoZXMgYSB2aWV3IGZyb20gZGlydHkgY2hlY2tpbmcgYWdhaW4uXG4gICAqL1xuICBkZXRhY2hWaWV3KHZpZXdSZWY6IFZpZXdSZWYpOiB2b2lkIHtcbiAgICAodHlwZW9mIG5nRGV2TW9kZSA9PT0gJ3VuZGVmaW5lZCcgfHwgbmdEZXZNb2RlKSAmJiB0aGlzLndhcm5JZkRlc3Ryb3llZCgpO1xuICAgIGNvbnN0IHZpZXcgPSAodmlld1JlZiBhcyBJbnRlcm5hbFZpZXdSZWY8dW5rbm93bj4pO1xuICAgIHJlbW92ZSh0aGlzLl92aWV3cywgdmlldyk7XG4gICAgdmlldy5kZXRhY2hGcm9tQXBwUmVmKCk7XG4gIH1cblxuICBwcml2YXRlIF9sb2FkQ29tcG9uZW50KGNvbXBvbmVudFJlZjogQ29tcG9uZW50UmVmPGFueT4pOiB2b2lkIHtcbiAgICB0aGlzLmF0dGFjaFZpZXcoY29tcG9uZW50UmVmLmhvc3RWaWV3KTtcbiAgICB0aGlzLnRpY2soKTtcbiAgICB0aGlzLmNvbXBvbmVudHMucHVzaChjb21wb25lbnRSZWYpO1xuICAgIC8vIEdldCB0aGUgbGlzdGVuZXJzIGxhemlseSB0byBwcmV2ZW50IERJIGN5Y2xlcy5cbiAgICBjb25zdCBsaXN0ZW5lcnMgPSB0aGlzLl9pbmplY3Rvci5nZXQoQVBQX0JPT1RTVFJBUF9MSVNURU5FUiwgW10pO1xuICAgIGlmIChuZ0Rldk1vZGUgJiYgIUFycmF5LmlzQXJyYXkobGlzdGVuZXJzKSkge1xuICAgICAgdGhyb3cgbmV3IFJ1bnRpbWVFcnJvcihcbiAgICAgICAgICBSdW50aW1lRXJyb3JDb2RlLklOVkFMSURfTVVMVElfUFJPVklERVIsXG4gICAgICAgICAgJ1VuZXhwZWN0ZWQgdHlwZSBvZiB0aGUgYEFQUF9CT09UU1RSQVBfTElTVEVORVJgIHRva2VuIHZhbHVlICcgK1xuICAgICAgICAgICAgICBgKGV4cGVjdGVkIGFuIGFycmF5LCBidXQgZ290ICR7dHlwZW9mIGxpc3RlbmVyc30pLiBgICtcbiAgICAgICAgICAgICAgJ1BsZWFzZSBjaGVjayB0aGF0IHRoZSBgQVBQX0JPT1RTVFJBUF9MSVNURU5FUmAgdG9rZW4gaXMgY29uZmlndXJlZCBhcyBhICcgK1xuICAgICAgICAgICAgICAnYG11bHRpOiB0cnVlYCBwcm92aWRlci4nKTtcbiAgICB9XG4gICAgWy4uLnRoaXMuX2Jvb3RzdHJhcExpc3RlbmVycywgLi4ubGlzdGVuZXJzXS5mb3JFYWNoKChsaXN0ZW5lcikgPT4gbGlzdGVuZXIoY29tcG9uZW50UmVmKSk7XG4gIH1cblxuICAvKiogQGludGVybmFsICovXG4gIG5nT25EZXN0cm95KCkge1xuICAgIGlmICh0aGlzLl9kZXN0cm95ZWQpIHJldHVybjtcblxuICAgIHRyeSB7XG4gICAgICAvLyBDYWxsIGFsbCB0aGUgbGlmZWN5Y2xlIGhvb2tzLlxuICAgICAgdGhpcy5fZGVzdHJveUxpc3RlbmVycy5mb3JFYWNoKGxpc3RlbmVyID0+IGxpc3RlbmVyKCkpO1xuXG4gICAgICAvLyBEZXN0cm95IGFsbCByZWdpc3RlcmVkIHZpZXdzLlxuICAgICAgdGhpcy5fdmlld3Muc2xpY2UoKS5mb3JFYWNoKCh2aWV3KSA9PiB2aWV3LmRlc3Ryb3koKSk7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIC8vIEluZGljYXRlIHRoYXQgdGhpcyBpbnN0YW5jZSBpcyBkZXN0cm95ZWQuXG4gICAgICB0aGlzLl9kZXN0cm95ZWQgPSB0cnVlO1xuXG4gICAgICAvLyBSZWxlYXNlIGFsbCByZWZlcmVuY2VzLlxuICAgICAgdGhpcy5fdmlld3MgPSBbXTtcbiAgICAgIHRoaXMuX2Jvb3RzdHJhcExpc3RlbmVycyA9IFtdO1xuICAgICAgdGhpcy5fZGVzdHJveUxpc3RlbmVycyA9IFtdO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBSZWdpc3RlcnMgYSBsaXN0ZW5lciB0byBiZSBjYWxsZWQgd2hlbiBhbiBpbnN0YW5jZSBpcyBkZXN0cm95ZWQuXG4gICAqXG4gICAqIEBwYXJhbSBjYWxsYmFjayBBIGNhbGxiYWNrIGZ1bmN0aW9uIHRvIGFkZCBhcyBhIGxpc3RlbmVyLlxuICAgKiBAcmV0dXJucyBBIGZ1bmN0aW9uIHdoaWNoIHVucmVnaXN0ZXJzIGEgbGlzdGVuZXIuXG4gICAqL1xuICBvbkRlc3Ryb3koY2FsbGJhY2s6ICgpID0+IHZvaWQpOiBWb2lkRnVuY3Rpb24ge1xuICAgICh0eXBlb2YgbmdEZXZNb2RlID09PSAndW5kZWZpbmVkJyB8fCBuZ0Rldk1vZGUpICYmIHRoaXMud2FybklmRGVzdHJveWVkKCk7XG4gICAgdGhpcy5fZGVzdHJveUxpc3RlbmVycy5wdXNoKGNhbGxiYWNrKTtcbiAgICByZXR1cm4gKCkgPT4gcmVtb3ZlKHRoaXMuX2Rlc3Ryb3lMaXN0ZW5lcnMsIGNhbGxiYWNrKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZXN0cm95cyBhbiBBbmd1bGFyIGFwcGxpY2F0aW9uIHJlcHJlc2VudGVkIGJ5IHRoaXMgYEFwcGxpY2F0aW9uUmVmYC4gQ2FsbGluZyB0aGlzIGZ1bmN0aW9uXG4gICAqIHdpbGwgZGVzdHJveSB0aGUgYXNzb2NpYXRlZCBlbnZpcm9ubWVudCBpbmplY3RvcnMgYXMgd2VsbCBhcyBhbGwgdGhlIGJvb3RzdHJhcHBlZCBjb21wb25lbnRzXG4gICAqIHdpdGggdGhlaXIgdmlld3MuXG4gICAqL1xuICBkZXN0cm95KCk6IHZvaWQge1xuICAgIGlmICh0aGlzLl9kZXN0cm95ZWQpIHtcbiAgICAgIHRocm93IG5ldyBSdW50aW1lRXJyb3IoXG4gICAgICAgICAgUnVudGltZUVycm9yQ29kZS5BUFBMSUNBVElPTl9SRUZfQUxSRUFEWV9ERVNUUk9ZRUQsXG4gICAgICAgICAgbmdEZXZNb2RlICYmICdUaGlzIGluc3RhbmNlIG9mIHRoZSBgQXBwbGljYXRpb25SZWZgIGhhcyBhbHJlYWR5IGJlZW4gZGVzdHJveWVkLicpO1xuICAgIH1cblxuICAgIC8vIFRoaXMgaXMgYSB0ZW1wb3JhcnkgdHlwZSB0byByZXByZXNlbnQgYW4gaW5zdGFuY2Ugb2YgYW4gUjNJbmplY3Rvciwgd2hpY2ggY2FuIGJlIGRlc3Ryb3llZC5cbiAgICAvLyBUaGUgdHlwZSB3aWxsIGJlIHJlcGxhY2VkIHdpdGggYSBkaWZmZXJlbnQgb25lIG9uY2UgZGVzdHJveWFibGUgaW5qZWN0b3IgdHlwZSBpcyBhdmFpbGFibGUuXG4gICAgdHlwZSBEZXN0cm95YWJsZUluamVjdG9yID0gSW5qZWN0b3Ime2Rlc3Ryb3k/OiBGdW5jdGlvbiwgZGVzdHJveWVkPzogYm9vbGVhbn07XG5cbiAgICBjb25zdCBpbmplY3RvciA9IHRoaXMuX2luamVjdG9yIGFzIERlc3Ryb3lhYmxlSW5qZWN0b3I7XG5cbiAgICAvLyBDaGVjayB0aGF0IHRoaXMgaW5qZWN0b3IgaW5zdGFuY2Ugc3VwcG9ydHMgZGVzdHJveSBvcGVyYXRpb24uXG4gICAgaWYgKGluamVjdG9yLmRlc3Ryb3kgJiYgIWluamVjdG9yLmRlc3Ryb3llZCkge1xuICAgICAgLy8gRGVzdHJveWluZyBhbiB1bmRlcmx5aW5nIGluamVjdG9yIHdpbGwgdHJpZ2dlciB0aGUgYG5nT25EZXN0cm95YCBsaWZlY3ljbGVcbiAgICAgIC8vIGhvb2ssIHdoaWNoIGludm9rZXMgdGhlIHJlbWFpbmluZyBjbGVhbnVwIGFjdGlvbnMuXG4gICAgICBpbmplY3Rvci5kZXN0cm95KCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIG51bWJlciBvZiBhdHRhY2hlZCB2aWV3cy5cbiAgICovXG4gIGdldCB2aWV3Q291bnQoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3ZpZXdzLmxlbmd0aDtcbiAgfVxuXG4gIHByaXZhdGUgd2FybklmRGVzdHJveWVkKCkge1xuICAgIGlmICgodHlwZW9mIG5nRGV2TW9kZSA9PT0gJ3VuZGVmaW5lZCcgfHwgbmdEZXZNb2RlKSAmJiB0aGlzLl9kZXN0cm95ZWQpIHtcbiAgICAgIGNvbnNvbGUud2Fybihmb3JtYXRSdW50aW1lRXJyb3IoXG4gICAgICAgICAgUnVudGltZUVycm9yQ29kZS5BUFBMSUNBVElPTl9SRUZfQUxSRUFEWV9ERVNUUk9ZRUQsXG4gICAgICAgICAgJ1RoaXMgaW5zdGFuY2Ugb2YgdGhlIGBBcHBsaWNhdGlvblJlZmAgaGFzIGFscmVhZHkgYmVlbiBkZXN0cm95ZWQuJykpO1xuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gcmVtb3ZlPFQ+KGxpc3Q6IFRbXSwgZWw6IFQpOiB2b2lkIHtcbiAgY29uc3QgaW5kZXggPSBsaXN0LmluZGV4T2YoZWwpO1xuICBpZiAoaW5kZXggPiAtMSkge1xuICAgIGxpc3Quc3BsaWNlKGluZGV4LCAxKTtcbiAgfVxufVxuXG5sZXQgd2hlblN0YWJsZVN0b3JlOiBXZWFrTWFwPEFwcGxpY2F0aW9uUmVmLCBQcm9taXNlPHZvaWQ+Pnx1bmRlZmluZWQ7XG4vKipcbiAqIFJldHVybnMgYSBQcm9taXNlIHRoYXQgcmVzb2x2ZXMgd2hlbiB0aGUgYXBwbGljYXRpb24gYmVjb21lcyBzdGFibGUgYWZ0ZXIgdGhpcyBtZXRob2QgaXMgY2FsbGVkXG4gKiB0aGUgZmlyc3QgdGltZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHdoZW5TdGFibGUoYXBwbGljYXRpb25SZWY6IEFwcGxpY2F0aW9uUmVmKTogUHJvbWlzZTx2b2lkPiB7XG4gIHdoZW5TdGFibGVTdG9yZSA/Pz0gbmV3IFdlYWtNYXAoKTtcbiAgY29uc3QgY2FjaGVkV2hlblN0YWJsZSA9IHdoZW5TdGFibGVTdG9yZS5nZXQoYXBwbGljYXRpb25SZWYpO1xuICBpZiAoY2FjaGVkV2hlblN0YWJsZSkge1xuICAgIHJldHVybiBjYWNoZWRXaGVuU3RhYmxlO1xuICB9XG5cbiAgY29uc3Qgd2hlblN0YWJsZVByb21pc2UgPVxuICAgICAgYXBwbGljYXRpb25SZWYuaXNTdGFibGUucGlwZShmaXJzdCgoaXNTdGFibGUpID0+IGlzU3RhYmxlKSkudG9Qcm9taXNlKCkudGhlbigoKSA9PiB2b2lkIDApO1xuICB3aGVuU3RhYmxlU3RvcmUuc2V0KGFwcGxpY2F0aW9uUmVmLCB3aGVuU3RhYmxlUHJvbWlzZSk7XG5cbiAgLy8gQmUgYSBnb29kIGNpdGl6ZW4gYW5kIGNsZWFuIHRoZSBzdG9yZSBgb25EZXN0cm95YCBldmVuIHRob3VnaCB3ZSBhcmUgdXNpbmcgYFdlYWtNYXBgLlxuICBhcHBsaWNhdGlvblJlZi5vbkRlc3Ryb3koKCkgPT4gd2hlblN0YWJsZVN0b3JlPy5kZWxldGUoYXBwbGljYXRpb25SZWYpKTtcblxuICByZXR1cm4gd2hlblN0YWJsZVByb21pc2U7XG59XG5cblxuZnVuY3Rpb24gc2hvdWxkUmVjaGVja1ZpZXcodmlldzogTFZpZXcpOiBib29sZWFuIHtcbiAgcmV0dXJuIHJlcXVpcmVzUmVmcmVzaE9yVHJhdmVyc2FsKHZpZXcpIHx8XG4gICAgICAvLyBUT0RPKGF0c2NvdHQpOiBSZW1vdmUgaXNHMyBjaGVjayBhbmQgbWFrZSB0aGlzIGEgYnJlYWtpbmcgY2hhbmdlIGZvciB2MThcbiAgICAgIChpc0czICYmICEhKHZpZXdbRkxBR1NdICYgTFZpZXdGbGFncy5EaXJ0eSkpO1xufVxuIl19