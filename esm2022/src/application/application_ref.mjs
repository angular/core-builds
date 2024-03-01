/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import '../util/ng_jit_mode';
import { setActiveConsumer, setThrowInvalidWriteToSignalError } from '@angular/core/primitives/signals';
import { Subject } from 'rxjs';
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
        // Needed for ComponentFixture temporarily during migration of autoDetect behavior
        // Eventually the hostView of the fixture should just attach to ApplicationRef.
        this.externalTestViews = new Set();
        this.beforeRender = new Subject();
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
            this.afterTick.next();
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
            this.beforeRender.next(isFirstPass);
            for (let { _lView, notifyErrorHandler } of this._views) {
                detectChangesInViewIfRequired(_lView, isFirstPass, notifyErrorHandler);
            }
            runs++;
            afterRenderEffectManager.executeInternalCallbacks();
            // If we have a newly dirty view after running internal callbacks, recheck the views again
            // before running user-provided callbacks
            if ([...this.externalTestViews.keys(), ...this._views].some(({ _lView }) => shouldRecheckView(_lView))) {
                continue;
            }
            afterRenderEffectManager.execute();
            // If after running all afterRender callbacks we have no more views that need to be refreshed,
            // we can break out of the loop
            if (![...this.externalTestViews.keys(), ...this._views].some(({ _lView }) => shouldRecheckView(_lView))) {
                break;
            }
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
export function detectChangesInViewIfRequired(lView, isFirstPass, notifyErrorHandler) {
    // When re-checking, only check views which actually need it.
    if (!isFirstPass && !shouldRecheckView(lView)) {
        return;
    }
    detectChangesInView(lView, notifyErrorHandler, isFirstPass);
}
function shouldRecheckView(view) {
    return requiresRefreshOrTraversal(view) ||
        // TODO(atscott): Remove isG3 check and make this a breaking change for v18
        (isG3 && !!(view[FLAGS] & 64 /* LViewFlags.Dirty */));
}
function detectChangesInView(lView, notifyErrorHandler, isFirstPass) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwbGljYXRpb25fcmVmLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvYXBwbGljYXRpb24vYXBwbGljYXRpb25fcmVmLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8scUJBQXFCLENBQUM7QUFFN0IsT0FBTyxFQUFDLGlCQUFpQixFQUFFLGlDQUFpQyxFQUFDLE1BQU0sa0NBQWtDLENBQUM7QUFDdEcsT0FBTyxFQUFhLE9BQU8sRUFBQyxNQUFNLE1BQU0sQ0FBQztBQUN6QyxPQUFPLEVBQUMsS0FBSyxFQUFFLEdBQUcsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBRTFDLE9BQU8sRUFBQyxPQUFPLEVBQUMsTUFBTSxZQUFZLENBQUM7QUFDbkMsT0FBTyxFQUFDLE1BQU0sRUFBQyxNQUFNLE9BQU8sQ0FBQztBQUM3QixPQUFPLEVBQUMsVUFBVSxFQUFDLE1BQU0sa0JBQWtCLENBQUM7QUFDNUMsT0FBTyxFQUFDLGNBQWMsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQ3JELE9BQU8sRUFBQyxRQUFRLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUN4QyxPQUFPLEVBQUMsbUJBQW1CLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUN0RCxPQUFPLEVBQWUsa0NBQWtDLEVBQUMsTUFBTSxrQkFBa0IsQ0FBQztBQUNsRixPQUFPLEVBQUMsa0JBQWtCLEVBQUUsWUFBWSxFQUFtQixNQUFNLFdBQVcsQ0FBQztBQUU3RSxPQUFPLEVBQUMsSUFBSSxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFDcEMsT0FBTyxFQUFDLGdCQUFnQixFQUFlLE1BQU0sNkJBQTZCLENBQUM7QUFDM0UsT0FBTyxFQUFDLHdCQUF3QixFQUFDLE1BQU0sc0NBQXNDLENBQUM7QUFDOUUsT0FBTyxFQUFDLFdBQVcsRUFBQyxNQUFNLDZCQUE2QixDQUFDO0FBRXhELE9BQU8sRUFBQyxZ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LFdBQVcsRUFBRSxDQUFDO1FBQ2hCLCtFQUErRTtRQUMvRSxJQUFJLHFDQUE2QixDQUFDO1FBQ2xDLGdGQUFnRjtRQUNoRix1RkFBdUY7UUFDdkYsc0ZBQXNGO1FBQ3RGLGtGQUFrRjtRQUNsRix1RUFBdUU7UUFDdkUsS0FBSyxDQUFDLEtBQUssQ0FBQyxxQ0FBMEIsQ0FBQztJQUN6QyxDQUFDO1NBQU0sSUFBSSxLQUFLLENBQUMsS0FBSyxDQUFDLDRCQUFtQixFQUFFLENBQUM7UUFDM0Msa0ZBQWtGO1FBQ2xGLElBQUkscUNBQTZCLENBQUM7SUFDcEMsQ0FBQztTQUFNLENBQUM7UUFDTixpRkFBaUY7UUFDakYsdUZBQXVGO1FBQ3ZGLHVEQUF1RDtRQUN2RCxJQUFJLHVDQUErQixDQUFDO0lBQ3RDLENBQUM7SUFDRCxxQkFBcUIsQ0FBQyxLQUFLLEVBQUUsa0JBQWtCLEVBQUUsSUFBSSxDQUFDLENBQUM7QUFDekQsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgJy4uL3V0aWwvbmdfaml0X21vZGUnO1xuXG5pbXBvcnQge3NldEFjdGl2ZUNvbnN1bWVyLCBzZXRUaHJvd0ludmFsaWRXcml0ZVRvU2lnbmFsRXJyb3J9IGZyb20gJ0Bhbmd1bGFyL2NvcmUvcHJpbWl0aXZlcy9zaWduYWxzJztcbmltcG9ydCB7T2JzZXJ2YWJsZSwgU3ViamVjdH0gZnJvbSAncnhqcyc7XG5pbXBvcnQge2ZpcnN0LCBtYXB9IGZyb20gJ3J4anMvb3BlcmF0b3JzJztcblxuaW1wb3J0IHtDb25zb2xlfSBmcm9tICcuLi9jb25zb2xlJztcbmltcG9ydCB7aW5qZWN0fSBmcm9tICcuLi9kaSc7XG5pbXBvcnQge0luamVjdGFibGV9IGZyb20gJy4uL2RpL2luamVjdGFibGUnO1xuaW1wb3J0IHtJbmplY3Rpb25Ub2tlbn0gZnJvbSAnLi4vZGkvaW5qZWN0aW9uX3Rva2VuJztcbmltcG9ydCB7SW5qZWN0b3J9IGZyb20gJy4uL2RpL2luamVjdG9yJztcbmltcG9ydCB7RW52aXJvbm1lbnRJbmplY3Rvcn0gZnJvbSAnLi4vZGkvcjNfaW5qZWN0b3InO1xuaW1wb3J0IHtFcnJvckhhbmRsZXIsIElOVEVSTkFMX0FQUExJQ0FUSU9OX0VSUk9SX0hBTkRMRVJ9IGZyb20gJy4uL2Vycm9yX2hhbmRsZXInO1xuaW1wb3J0IHtmb3JtYXRSdW50aW1lRXJyb3IsIFJ1bnRpbWVFcnJvciwgUnVudGltZUVycm9yQ29kZX0gZnJvbSAnLi4vZXJyb3JzJztcbmltcG9ydCB7VHlwZX0gZnJvbSAnLi4vaW50ZXJmYWNlL3R5cGUnO1xuaW1wb3J0IHtpc0czfSBmcm9tICcuLi9pc19pbnRlcm5hbCc7XG5pbXBvcnQge0NvbXBvbmVudEZhY3RvcnksIENvbXBvbmVudFJlZn0gZnJvbSAnLi4vbGlua2VyL2NvbXBvbmVudF9mYWN0b3J5JztcbmltcG9ydCB7Q29tcG9uZW50RmFjdG9yeVJlc29sdmVyfSBmcm9tICcuLi9saW5rZXIvY29tcG9uZW50X2ZhY3RvcnlfcmVzb2x2ZXInO1xuaW1wb3J0IHtOZ01vZHVsZVJlZn0gZnJvbSAnLi4vbGlua2VyL25nX21vZHVsZV9mYWN0b3J5JztcbmltcG9ydCB7Vmlld1JlZn0gZnJvbSAnLi4vbGlua2VyL3ZpZXdfcmVmJztcbmltcG9ydCB7UGVuZGluZ1Rhc2tzfSBmcm9tICcuLi9wZW5kaW5nX3Rhc2tzJztcbmltcG9ydCB7QWZ0ZXJSZW5kZXJFdmVudE1hbmFnZXJ9IGZyb20gJy4uL3JlbmRlcjMvYWZ0ZXJfcmVuZGVyX2hvb2tzJztcbmltcG9ydCB7Q29tcG9uZW50RmFjdG9yeSBhcyBSM0NvbXBvbmVudEZhY3Rvcnl9IGZyb20gJy4uL3JlbmRlcjMvY29tcG9uZW50X3JlZic7XG5pbXBvcnQge2lzU3RhbmRhbG9uZX0gZnJvbSAnLi4vcmVuZGVyMy9kZWZpbml0aW9uJztcbmltcG9ydCB7Q2hhbmdlRGV0ZWN0aW9uTW9kZSwgZGV0ZWN0Q2hhbmdlc0ludGVybmFsLCBNQVhJTVVNX1JFRlJFU0hfUkVSVU5TfSBmcm9tICcuLi9yZW5kZXIzL2luc3RydWN0aW9ucy9jaGFuZ2VfZGV0ZWN0aW9uJztcbmltcG9ydCB7RkxBR1MsIExWaWV3LCBMVmlld0ZsYWdzfSBmcm9tICcuLi9yZW5kZXIzL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge3B1Ymxpc2hEZWZhdWx0R2xvYmFsVXRpbHMgYXMgX3B1Ymxpc2hEZWZhdWx0R2xvYmFsVXRpbHN9IGZyb20gJy4uL3JlbmRlcjMvdXRpbC9nbG9iYWxfdXRpbHMnO1xuaW1wb3J0IHtyZXF1aXJlc1JlZnJlc2hPclRyYXZlcnNhbH0gZnJvbSAnLi4vcmVuZGVyMy91dGlsL3ZpZXdfdXRpbHMnO1xuaW1wb3J0IHtWaWV3UmVmIGFzIEludGVybmFsVmlld1JlZn0gZnJvbSAnLi4vcmVuZGVyMy92aWV3X3JlZic7XG5pbXBvcnQge1RFU1RBQklMSVRZfSBmcm9tICcuLi90ZXN0YWJpbGl0eS90ZXN0YWJpbGl0eSc7XG5pbXBvcnQge2lzUHJvbWlzZX0gZnJvbSAnLi4vdXRpbC9sYW5nJztcbmltcG9ydCB7Tmdab25lfSBmcm9tICcuLi96b25lL25nX3pvbmUnO1xuXG5pbXBvcnQge0FwcGxpY2F0aW9uSW5pdFN0YXR1c30gZnJvbSAnLi9hcHBsaWNhdGlvbl9pbml0JztcblxuLyoqXG4gKiBBIFtESSB0b2tlbl0oZ3VpZGUvZ2xvc3NhcnkjZGktdG9rZW4gXCJESSB0b2tlbiBkZWZpbml0aW9uXCIpIHRoYXQgcHJvdmlkZXMgYSBzZXQgb2YgY2FsbGJhY2tzIHRvXG4gKiBiZSBjYWxsZWQgZm9yIGV2ZXJ5IGNvbXBvbmVudCB0aGF0IGlzIGJvb3RzdHJhcHBlZC5cbiAqXG4gKiBFYWNoIGNhbGxiYWNrIG11c3QgdGFrZSBhIGBDb21wb25lbnRSZWZgIGluc3RhbmNlIGFuZCByZXR1cm4gbm90aGluZy5cbiAqXG4gKiBgKGNvbXBvbmVudFJlZjogQ29tcG9uZW50UmVmKSA9PiB2b2lkYFxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGNvbnN0IEFQUF9CT09UU1RSQVBfTElTVEVORVIgPVxuICAgIG5ldyBJbmplY3Rpb25Ub2tlbjxSZWFkb25seUFycmF5PChjb21wUmVmOiBDb21wb25lbnRSZWY8YW55PikgPT4gdm9pZD4+KFxuICAgICAgICBuZ0Rldk1vZGUgPyAnYXBwQm9vdHN0cmFwTGlzdGVuZXInIDogJycpO1xuXG5leHBvcnQgZnVuY3Rpb24gcHVibGlzaERlZmF1bHRHbG9iYWxVdGlscygpIHtcbiAgbmdEZXZNb2RlICYmIF9wdWJsaXNoRGVmYXVsdEdsb2JhbFV0aWxzKCk7XG59XG5cbi8qKlxuICogU2V0cyB0aGUgZXJyb3IgZm9yIGFuIGludmFsaWQgd3JpdGUgdG8gYSBzaWduYWwgdG8gYmUgYW4gQW5ndWxhciBgUnVudGltZUVycm9yYC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHB1Ymxpc2hTaWduYWxDb25maWd1cmF0aW9uKCk6IHZvaWQge1xuICBzZXRUaHJvd0ludmFsaWRXcml0ZVRvU2lnbmFsRXJyb3IoKCkgPT4ge1xuICAgIHRocm93IG5ldyBSdW50aW1lRXJyb3IoXG4gICAgICAgIFJ1bnRpbWVFcnJvckNvZGUuU0lHTkFMX1dSSVRFX0ZST01fSUxMRUdBTF9DT05URVhULFxuICAgICAgICBuZ0Rldk1vZGUgJiZcbiAgICAgICAgICAgICdXcml0aW5nIHRvIHNpZ25hbHMgaXMgbm90IGFsbG93ZWQgaW4gYSBgY29tcHV0ZWRgIG9yIGFuIGBlZmZlY3RgIGJ5IGRlZmF1bHQuICcgK1xuICAgICAgICAgICAgICAgICdVc2UgYGFsbG93U2lnbmFsV3JpdGVzYCBpbiB0aGUgYENyZWF0ZUVmZmVjdE9wdGlvbnNgIHRvIGVuYWJsZSB0aGlzIGluc2lkZSBlZmZlY3RzLicpO1xuICB9KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzQm91bmRUb01vZHVsZTxDPihjZjogQ29tcG9uZW50RmFjdG9yeTxDPik6IGJvb2xlYW4ge1xuICByZXR1cm4gKGNmIGFzIFIzQ29tcG9uZW50RmFjdG9yeTxDPikuaXNCb3VuZFRvTW9kdWxlO1xufVxuXG4vKipcbiAqIEEgdG9rZW4gZm9yIHRoaXJkLXBhcnR5IGNvbXBvbmVudHMgdGhhdCBjYW4gcmVnaXN0ZXIgdGhlbXNlbHZlcyB3aXRoIE5nUHJvYmUuXG4gKlxuICogQGRlcHJlY2F0ZWRcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGNsYXNzIE5nUHJvYmVUb2tlbiB7XG4gIGNvbnN0cnVjdG9yKHB1YmxpYyBuYW1lOiBzdHJpbmcsIHB1YmxpYyB0b2tlbjogYW55KSB7fVxufVxuXG4vKipcbiAqIFByb3ZpZGVzIGFkZGl0aW9uYWwgb3B0aW9ucyB0byB0aGUgYm9vdHN0cmFwcGluZyBwcm9jZXNzLlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBCb290c3RyYXBPcHRpb25zIHtcbiAgLyoqXG4gICAqIE9wdGlvbmFsbHkgc3BlY2lmeSB3aGljaCBgTmdab25lYCBzaG91bGQgYmUgdXNlZC5cbiAgICpcbiAgICogLSBQcm92aWRlIHlvdXIgb3duIGBOZ1pvbmVgIGluc3RhbmNlLlxuICAgKiAtIGB6b25lLmpzYCAtIFVzZSBkZWZhdWx0IGBOZ1pvbmVgIHdoaWNoIHJlcXVpcmVzIGBab25lLmpzYC5cbiAgICogLSBgbm9vcGAgLSBVc2UgYE5vb3BOZ1pvbmVgIHdoaWNoIGRvZXMgbm90aGluZy5cbiAgICovXG4gIG5nWm9uZT86IE5nWm9uZXwnem9uZS5qcyd8J25vb3AnO1xuXG4gIC8qKlxuICAgKiBPcHRpb25hbGx5IHNwZWNpZnkgY29hbGVzY2luZyBldmVudCBjaGFuZ2UgZGV0ZWN0aW9ucyBvciBub3QuXG4gICAqIENvbnNpZGVyIHRoZSBmb2xsb3dpbmcgY2FzZS5cbiAgICpcbiAgICogYGBgXG4gICAqIDxkaXYgKGNsaWNrKT1cImRvU29tZXRoaW5nKClcIj5cbiAgICogICA8YnV0dG9uIChjbGljayk9XCJkb1NvbWV0aGluZ0Vsc2UoKVwiPjwvYnV0dG9uPlxuICAgKiA8L2Rpdj5cbiAgICogYGBgXG4gICAqXG4gICAqIFdoZW4gYnV0dG9uIGlzIGNsaWNrZWQsIGJlY2F1c2Ugb2YgdGhlIGV2ZW50IGJ1YmJsaW5nLCBib3RoXG4gICAqIGV2ZW50IGhhbmRsZXJzIHdpbGwgYmUgY2FsbGVkIGFuZCAyIGNoYW5nZSBkZXRlY3Rpb25zIHdpbGwgYmVcbiAgICogdHJpZ2dlcmVkLiBXZSBjYW4gY29hbGVzY2Ugc3VjaCBraW5kIG9mIGV2ZW50cyB0byBvbmx5IHRyaWdnZXJcbiAgICogY2hhbmdlIGRldGVjdGlvbiBvbmx5IG9uY2UuXG4gICAqXG4gICAqIEJ5IGRlZmF1bHQsIHRoaXMgb3B0aW9uIHdpbGwgYmUgZmFsc2UuIFNvIHRoZSBldmVudHMgd2lsbCBub3QgYmVcbiAgICogY29hbGVzY2VkIGFuZCB0aGUgY2hhbmdlIGRldGVjdGlvbiB3aWxsIGJlIHRyaWdnZXJlZCBtdWx0aXBsZSB0aW1lcy5cbiAgICogQW5kIGlmIHRoaXMgb3B0aW9uIGJlIHNldCB0byB0cnVlLCB0aGUgY2hhbmdlIGRldGVjdGlvbiB3aWxsIGJlXG4gICAqIHRyaWdnZXJlZCBhc3luYyBieSBzY2hlZHVsaW5nIGEgYW5pbWF0aW9uIGZyYW1lLiBTbyBpbiB0aGUgY2FzZSBhYm92ZSxcbiAgICogdGhlIGNoYW5nZSBkZXRlY3Rpb24gd2lsbCBvbmx5IGJlIHRyaWdnZXJlZCBvbmNlLlxuICAgKi9cbiAgbmdab25lRXZlbnRDb2FsZXNjaW5nPzogYm9vbGVhbjtcblxuICAvKipcbiAgICogT3B0aW9uYWxseSBzcGVjaWZ5IGlmIGBOZ1pvbmUjcnVuKClgIG1ldGhvZCBpbnZvY2F0aW9ucyBzaG91bGQgYmUgY29hbGVzY2VkXG4gICAqIGludG8gYSBzaW5nbGUgY2hhbmdlIGRldGVjdGlvbi5cbiAgICpcbiAgICogQ29uc2lkZXIgdGhlIGZvbGxvd2luZyBjYXNlLlxuICAgKiBgYGBcbiAgICogZm9yIChsZXQgaSA9IDA7IGkgPCAxMDsgaSArKykge1xuICAgKiAgIG5nWm9uZS5ydW4oKCkgPT4ge1xuICAgKiAgICAgLy8gZG8gc29tZXRoaW5nXG4gICAqICAgfSk7XG4gICAqIH1cbiAgICogYGBgXG4gICAqXG4gICAqIFRoaXMgY2FzZSB0cmlnZ2VycyB0aGUgY2hhbmdlIGRldGVjdGlvbiBtdWx0aXBsZSB0aW1lcy5cbiAgICogV2l0aCBuZ1pvbmVSdW5Db2FsZXNjaW5nIG9wdGlvbnMsIGFsbCBjaGFuZ2UgZGV0ZWN0aW9ucyBpbiBhbiBldmVudCBsb29wIHRyaWdnZXIgb25seSBvbmNlLlxuICAgKiBJbiBhZGRpdGlvbiwgdGhlIGNoYW5nZSBkZXRlY3Rpb24gZXhlY3V0ZXMgaW4gcmVxdWVzdEFuaW1hdGlvbi5cbiAgICpcbiAgICovXG4gIG5nWm9uZVJ1bkNvYWxlc2Npbmc/OiBib29sZWFuO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gX2NhbGxBbmRSZXBvcnRUb0Vycm9ySGFuZGxlcihcbiAgICBlcnJvckhhbmRsZXI6IEVycm9ySGFuZGxlciwgbmdab25lOiBOZ1pvbmUsIGNhbGxiYWNrOiAoKSA9PiBhbnkpOiBhbnkge1xuICB0cnkge1xuICAgIGNvbnN0IHJlc3VsdCA9IGNhbGxiYWNrKCk7XG4gICAgaWYgKGlzUHJvbWlzZShyZXN1bHQpKSB7XG4gICAgICByZXR1cm4gcmVzdWx0LmNhdGNoKChlOiBhbnkpID0+IHtcbiAgICAgICAgbmdab25lLnJ1bk91dHNpZGVBbmd1bGFyKCgpID0+IGVycm9ySGFuZGxlci5oYW5kbGVFcnJvcihlKSk7XG4gICAgICAgIC8vIHJldGhyb3cgYXMgdGhlIGV4Y2VwdGlvbiBoYW5kbGVyIG1pZ2h0IG5vdCBkbyBpdFxuICAgICAgICB0aHJvdyBlO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfSBjYXRjaCAoZSkge1xuICAgIG5nWm9uZS5ydW5PdXRzaWRlQW5ndWxhcigoKSA9PiBlcnJvckhhbmRsZXIuaGFuZGxlRXJyb3IoZSkpO1xuICAgIC8vIHJldGhyb3cgYXMgdGhlIGV4Y2VwdGlvbiBoYW5kbGVyIG1pZ2h0IG5vdCBkbyBpdFxuICAgIHRocm93IGU7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG9wdGlvbnNSZWR1Y2VyPFQgZXh0ZW5kcyBPYmplY3Q+KGRzdDogVCwgb2JqczogVHxUW10pOiBUIHtcbiAgaWYgKEFycmF5LmlzQXJyYXkob2JqcykpIHtcbiAgICByZXR1cm4gb2Jqcy5yZWR1Y2Uob3B0aW9uc1JlZHVjZXIsIGRzdCk7XG4gIH1cbiAgcmV0dXJuIHsuLi5kc3QsIC4uLm9ianN9O1xufVxuXG4vKipcbiAqIEEgcmVmZXJlbmNlIHRvIGFuIEFuZ3VsYXIgYXBwbGljYXRpb24gcnVubmluZyBvbiBhIHBhZ2UuXG4gKlxuICogQHVzYWdlTm90ZXNcbiAqIHtAYSBpcy1zdGFibGUtZXhhbXBsZXN9XG4gKiAjIyMgaXNTdGFibGUgZXhhbXBsZXMgYW5kIGNhdmVhdHNcbiAqXG4gKiBOb3RlIHR3byBpbXBvcnRhbnQgcG9pbnRzIGFib3V0IGBpc1N0YWJsZWAsIGRlbW9uc3RyYXRlZCBpbiB0aGUgZXhhbXBsZXMgYmVsb3c6XG4gKiAtIHRoZSBhcHBsaWNhdGlvbiB3aWxsIG5ldmVyIGJlIHN0YWJsZSBpZiB5b3Ugc3RhcnQgYW55IGtpbmRcbiAqIG9mIHJlY3VycmVudCBhc3luY2hyb25vdXMgdGFzayB3aGVuIHRoZSBhcHBsaWNhdGlvbiBzdGFydHNcbiAqIChmb3IgZXhhbXBsZSBmb3IgYSBwb2xsaW5nIHByb2Nlc3MsIHN0YXJ0ZWQgd2l0aCBhIGBzZXRJbnRlcnZhbGAsIGEgYHNldFRpbWVvdXRgXG4gKiBvciB1c2luZyBSeEpTIG9wZXJhdG9ycyBsaWtlIGBpbnRlcnZhbGApO1xuICogLSB0aGUgYGlzU3RhYmxlYCBPYnNlcnZhYmxlIHJ1bnMgb3V0c2lkZSBvZiB0aGUgQW5ndWxhciB6b25lLlxuICpcbiAqIExldCdzIGltYWdpbmUgdGhhdCB5b3Ugc3RhcnQgYSByZWN1cnJlbnQgdGFza1xuICogKGhlcmUgaW5jcmVtZW50aW5nIGEgY291bnRlciwgdXNpbmcgUnhKUyBgaW50ZXJ2YWxgKSxcbiAqIGFuZCBhdCB0aGUgc2FtZSB0aW1lIHN1YnNjcmliZSB0byBgaXNTdGFibGVgLlxuICpcbiAqIGBgYFxuICogY29uc3RydWN0b3IoYXBwUmVmOiBBcHBsaWNhdGlvblJlZikge1xuICogICBhcHBSZWYuaXNTdGFibGUucGlwZShcbiAqICAgICAgZmlsdGVyKHN0YWJsZSA9PiBzdGFibGUpXG4gKiAgICkuc3Vic2NyaWJlKCgpID0+IGNvbnNvbGUubG9nKCdBcHAgaXMgc3RhYmxlIG5vdycpO1xuICogICBpbnRlcnZhbCgxMDAwKS5zdWJzY3JpYmUoY291bnRlciA9PiBjb25zb2xlLmxvZyhjb3VudGVyKSk7XG4gKiB9XG4gKiBgYGBcbiAqIEluIHRoaXMgZXhhbXBsZSwgYGlzU3RhYmxlYCB3aWxsIG5ldmVyIGVtaXQgYHRydWVgLFxuICogYW5kIHRoZSB0cmFjZSBcIkFwcCBpcyBzdGFibGUgbm93XCIgd2lsbCBuZXZlciBnZXQgbG9nZ2VkLlxuICpcbiAqIElmIHlvdSB3YW50IHRvIGV4ZWN1dGUgc29tZXRoaW5nIHdoZW4gdGhlIGFwcCBpcyBzdGFibGUsXG4gKiB5b3UgaGF2ZSB0byB3YWl0IGZvciB0aGUgYXBwbGljYXRpb24gdG8gYmUgc3RhYmxlXG4gKiBiZWZvcmUgc3RhcnRpbmcgeW91ciBwb2xsaW5nIHByb2Nlc3MuXG4gKlxuICogYGBgXG4gKiBjb25zdHJ1Y3RvcihhcHBSZWY6IEFwcGxpY2F0aW9uUmVmKSB7XG4gKiAgIGFwcFJlZi5pc1N0YWJsZS5waXBlKFxuICogICAgIGZpcnN0KHN0YWJsZSA9PiBzdGFibGUpLFxuICogICAgIHRhcChzdGFibGUgPT4gY29uc29sZS5sb2coJ0FwcCBpcyBzdGFibGUgbm93JykpLFxuICogICAgIHN3aXRjaE1hcCgoKSA9PiBpbnRlcnZhbCgxMDAwKSlcbiAqICAgKS5zdWJzY3JpYmUoY291bnRlciA9PiBjb25zb2xlLmxvZyhjb3VudGVyKSk7XG4gKiB9XG4gKiBgYGBcbiAqIEluIHRoaXMgZXhhbXBsZSwgdGhlIHRyYWNlIFwiQXBwIGlzIHN0YWJsZSBub3dcIiB3aWxsIGJlIGxvZ2dlZFxuICogYW5kIHRoZW4gdGhlIGNvdW50ZXIgc3RhcnRzIGluY3JlbWVudGluZyBldmVyeSBzZWNvbmQuXG4gKlxuICogTm90ZSBhbHNvIHRoYXQgdGhpcyBPYnNlcnZhYmxlIHJ1bnMgb3V0c2lkZSBvZiB0aGUgQW5ndWxhciB6b25lLFxuICogd2hpY2ggbWVhbnMgdGhhdCB0aGUgY29kZSBpbiB0aGUgc3Vic2NyaXB0aW9uXG4gKiB0byB0aGlzIE9ic2VydmFibGUgd2lsbCBub3QgdHJpZ2dlciB0aGUgY2hhbmdlIGRldGVjdGlvbi5cbiAqXG4gKiBMZXQncyBpbWFnaW5lIHRoYXQgaW5zdGVhZCBvZiBsb2dnaW5nIHRoZSBjb3VudGVyIHZhbHVlLFxuICogeW91IHVwZGF0ZSBhIGZpZWxkIG9mIHlvdXIgY29tcG9uZW50XG4gKiBhbmQgZGlzcGxheSBpdCBpbiBpdHMgdGVtcGxhdGUuXG4gKlxuICogYGBgXG4gKiBjb25zdHJ1Y3RvcihhcHBSZWY6IEFwcGxpY2F0aW9uUmVmKSB7XG4gKiAgIGFwcFJlZi5pc1N0YWJsZS5waXBlKFxuICogICAgIGZpcnN0KHN0YWJsZSA9PiBzdGFibGUpLFxuICogICAgIHN3aXRjaE1hcCgoKSA9PiBpbnRlcnZhbCgxMDAwKSlcbiAqICAgKS5zdWJzY3JpYmUoY291bnRlciA9PiB0aGlzLnZhbHVlID0gY291bnRlcik7XG4gKiB9XG4gKiBgYGBcbiAqIEFzIHRoZSBgaXNTdGFibGVgIE9ic2VydmFibGUgcnVucyBvdXRzaWRlIHRoZSB6b25lLFxuICogdGhlIGB2YWx1ZWAgZmllbGQgd2lsbCBiZSB1cGRhdGVkIHByb3Blcmx5LFxuICogYnV0IHRoZSB0ZW1wbGF0ZSB3aWxsIG5vdCBiZSByZWZyZXNoZWQhXG4gKlxuICogWW91J2xsIGhhdmUgdG8gbWFudWFsbHkgdHJpZ2dlciB0aGUgY2hhbmdlIGRldGVjdGlvbiB0byB1cGRhdGUgdGhlIHRlbXBsYXRlLlxuICpcbiAqIGBgYFxuICogY29uc3RydWN0b3IoYXBwUmVmOiBBcHBsaWNhdGlvblJlZiwgY2Q6IENoYW5nZURldGVjdG9yUmVmKSB7XG4gKiAgIGFwcFJlZi5pc1N0YWJsZS5waXBlKFxuICogICAgIGZpcnN0KHN0YWJsZSA9PiBzdGFibGUpLFxuICogICAgIHN3aXRjaE1hcCgoKSA9PiBpbnRlcnZhbCgxMDAwKSlcbiAqICAgKS5zdWJzY3JpYmUoY291bnRlciA9PiB7XG4gKiAgICAgdGhpcy52YWx1ZSA9IGNvdW50ZXI7XG4gKiAgICAgY2QuZGV0ZWN0Q2hhbmdlcygpO1xuICogICB9KTtcbiAqIH1cbiAqIGBgYFxuICpcbiAqIE9yIG1ha2UgdGhlIHN1YnNjcmlwdGlvbiBjYWxsYmFjayBydW4gaW5zaWRlIHRoZSB6b25lLlxuICpcbiAqIGBgYFxuICogY29uc3RydWN0b3IoYXBwUmVmOiBBcHBsaWNhdGlvblJlZiwgem9uZTogTmdab25lKSB7XG4gKiAgIGFwcFJlZi5pc1N0YWJsZS5waXBlKFxuICogICAgIGZpcnN0KHN0YWJsZSA9PiBzdGFibGUpLFxuICogICAgIHN3aXRjaE1hcCgoKSA9PiBpbnRlcnZhbCgxMDAwKSlcbiAqICAgKS5zdWJzY3JpYmUoY291bnRlciA9PiB6b25lLnJ1bigoKSA9PiB0aGlzLnZhbHVlID0gY291bnRlcikpO1xuICogfVxuICogYGBgXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5ASW5qZWN0YWJsZSh7cHJvdmlkZWRJbjogJ3Jvb3QnfSlcbmV4cG9ydCBjbGFzcyBBcHBsaWNhdGlvblJlZiB7XG4gIC8qKiBAaW50ZXJuYWwgKi9cbiAgcHJpdmF0ZSBfYm9vdHN0cmFwTGlzdGVuZXJzOiAoKGNvbXBSZWY6IENvbXBvbmVudFJlZjxhbnk+KSA9PiB2b2lkKVtdID0gW107XG4gIHByaXZhdGUgX3J1bm5pbmdUaWNrOiBib29sZWFuID0gZmFsc2U7XG4gIHByaXZhdGUgX2Rlc3Ryb3llZCA9IGZhbHNlO1xuICBwcml2YXRlIF9kZXN0cm95TGlzdGVuZXJzOiBBcnJheTwoKSA9PiB2b2lkPiA9IFtdO1xuICAvKiogQGludGVybmFsICovXG4gIF92aWV3czogSW50ZXJuYWxWaWV3UmVmPHVua25vd24+W10gPSBbXTtcbiAgcHJpdmF0ZSByZWFkb25seSBpbnRlcm5hbEVycm9ySGFuZGxlciA9IGluamVjdChJTlRFUk5BTF9BUFBMSUNBVElPTl9FUlJPUl9IQU5ETEVSKTtcbiAgcHJpdmF0ZSByZWFkb25seSBhZnRlclJlbmRlckVmZmVjdE1hbmFnZXIgPSBpbmplY3QoQWZ0ZXJSZW5kZXJFdmVudE1hbmFnZXIpO1xuXG4gIC8vIE5lZWRlZCBmb3IgQ29tcG9uZW50Rml4dHVyZSB0ZW1wb3JhcmlseSBkdXJpbmcgbWlncmF0aW9uIG9mIGF1dG9EZXRlY3QgYmVoYXZpb3JcbiAgLy8gRXZlbnR1YWxseSB0aGUgaG9zdFZpZXcgb2YgdGhlIGZpeHR1cmUgc2hvdWxkIGp1c3QgYXR0YWNoIHRvIEFwcGxpY2F0aW9uUmVmLlxuICBwcml2YXRlIGV4dGVybmFsVGVzdFZpZXdzOiBTZXQ8SW50ZXJuYWxWaWV3UmVmPHVua25vd24+PiA9IG5ldyBTZXQoKTtcbiAgcHJpdmF0ZSBiZWZvcmVSZW5kZXIgPSBuZXcgU3ViamVjdDxib29sZWFuPigpO1xuICBwcml2YXRlIGFmdGVyVGljayA9IG5ldyBTdWJqZWN0PHZvaWQ+KCk7XG5cbiAgLyoqXG4gICAqIEluZGljYXRlcyB3aGV0aGVyIHRoaXMgaW5zdGFuY2Ugd2FzIGRlc3Ryb3llZC5cbiAgICovXG4gIGdldCBkZXN0cm95ZWQoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2Rlc3Ryb3llZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgYSBsaXN0IG9mIGNvbXBvbmVudCB0eXBlcyByZWdpc3RlcmVkIHRvIHRoaXMgYXBwbGljYXRpb24uXG4gICAqIFRoaXMgbGlzdCBpcyBwb3B1bGF0ZWQgZXZlbiBiZWZvcmUgdGhlIGNvbXBvbmVudCBpcyBjcmVhdGVkLlxuICAgKi9cbiAgcHVibGljIHJlYWRvbmx5IGNvbXBvbmVudFR5cGVzOiBUeXBlPGFueT5bXSA9IFtdO1xuXG4gIC8qKlxuICAgKiBHZXQgYSBsaXN0IG9mIGNvbXBvbmVudHMgcmVnaXN0ZXJlZCB0byB0aGlzIGFwcGxpY2F0aW9uLlxuICAgKi9cbiAgcHVibGljIHJlYWRvbmx5IGNvbXBvbmVudHM6IENvbXBvbmVudFJlZjxhbnk+W10gPSBbXTtcblxuICAvKipcbiAgICogUmV0dXJucyBhbiBPYnNlcnZhYmxlIHRoYXQgaW5kaWNhdGVzIHdoZW4gdGhlIGFwcGxpY2F0aW9uIGlzIHN0YWJsZSBvciB1bnN0YWJsZS5cbiAgICovXG4gIHB1YmxpYyByZWFkb25seSBpc1N0YWJsZTogT2JzZXJ2YWJsZTxib29sZWFuPiA9XG4gICAgICBpbmplY3QoUGVuZGluZ1Rhc2tzKS5oYXNQZW5kaW5nVGFza3MucGlwZShtYXAocGVuZGluZyA9PiAhcGVuZGluZykpO1xuXG4gIHByaXZhdGUgcmVhZG9ubHkgX2luamVjdG9yID0gaW5qZWN0KEVudmlyb25tZW50SW5qZWN0b3IpO1xuICAvKipcbiAgICogVGhlIGBFbnZpcm9ubWVudEluamVjdG9yYCB1c2VkIHRvIGNyZWF0ZSB0aGlzIGFwcGxpY2F0aW9uLlxuICAgKi9cbiAgZ2V0IGluamVjdG9yKCk6IEVudmlyb25tZW50SW5qZWN0b3Ige1xuICAgIHJldHVybiB0aGlzLl9pbmplY3RvcjtcbiAgfVxuXG4gIC8qKlxuICAgKiBCb290c3RyYXAgYSBjb21wb25lbnQgb250byB0aGUgZWxlbWVudCBpZGVudGlmaWVkIGJ5IGl0cyBzZWxlY3RvciBvciwgb3B0aW9uYWxseSwgdG8gYVxuICAgKiBzcGVjaWZpZWQgZWxlbWVudC5cbiAgICpcbiAgICogQHVzYWdlTm90ZXNcbiAgICogIyMjIEJvb3RzdHJhcCBwcm9jZXNzXG4gICAqXG4gICAqIFdoZW4gYm9vdHN0cmFwcGluZyBhIGNvbXBvbmVudCwgQW5ndWxhciBtb3VudHMgaXQgb250byBhIHRhcmdldCBET00gZWxlbWVudFxuICAgKiBhbmQga2lja3Mgb2ZmIGF1dG9tYXRpYyBjaGFuZ2UgZGV0ZWN0aW9uLiBUaGUgdGFyZ2V0IERPTSBlbGVtZW50IGNhbiBiZVxuICAgKiBwcm92aWRlZCB1c2luZyB0aGUgYHJvb3RTZWxlY3Rvck9yTm9kZWAgYXJndW1lbnQuXG4gICAqXG4gICAqIElmIHRoZSB0YXJnZXQgRE9NIGVsZW1lbnQgaXMgbm90IHByb3ZpZGVkLCBBbmd1bGFyIHRyaWVzIHRvIGZpbmQgb25lIG9uIGEgcGFnZVxuICAgKiB1c2luZyB0aGUgYHNlbGVjdG9yYCBvZiB0aGUgY29tcG9uZW50IHRoYXQgaXMgYmVpbmcgYm9vdHN0cmFwcGVkXG4gICAqIChmaXJzdCBtYXRjaGVkIGVsZW1lbnQgaXMgdXNlZCkuXG4gICAqXG4gICAqICMjIyBFeGFtcGxlXG4gICAqXG4gICAqIEdlbmVyYWxseSwgd2UgZGVmaW5lIHRoZSBjb21wb25lbnQgdG8gYm9vdHN0cmFwIGluIHRoZSBgYm9vdHN0cmFwYCBhcnJheSBvZiBgTmdNb2R1bGVgLFxuICAgKiBidXQgaXQgcmVxdWlyZXMgdXMgdG8ga25vdyB0aGUgY29tcG9uZW50IHdoaWxlIHdyaXRpbmcgdGhlIGFwcGxpY2F0aW9uIGNvZGUuXG4gICAqXG4gICAqIEltYWdpbmUgYSBzaXR1YXRpb24gd2hlcmUgd2UgaGF2ZSB0byB3YWl0IGZvciBhbiBBUEkgY2FsbCB0byBkZWNpZGUgYWJvdXQgdGhlIGNvbXBvbmVudCB0b1xuICAgKiBib290c3RyYXAuIFdlIGNhbiB1c2UgdGhlIGBuZ0RvQm9vdHN0cmFwYCBob29rIG9mIHRoZSBgTmdNb2R1bGVgIGFuZCBjYWxsIHRoaXMgbWV0aG9kIHRvXG4gICAqIGR5bmFtaWNhbGx5IGJvb3RzdHJhcCBhIGNvbXBvbmVudC5cbiAgICpcbiAgICoge0BleGFtcGxlIGNvcmUvdHMvcGxhdGZvcm0vcGxhdGZvcm0udHMgcmVnaW9uPSdjb21wb25lbnRTZWxlY3Rvcid9XG4gICAqXG4gICAqIE9wdGlvbmFsbHksIGEgY29tcG9uZW50IGNhbiBiZSBtb3VudGVkIG9udG8gYSBET00gZWxlbWVudCB0aGF0IGRvZXMgbm90IG1hdGNoIHRoZVxuICAgKiBzZWxlY3RvciBvZiB0aGUgYm9vdHN0cmFwcGVkIGNvbXBvbmVudC5cbiAgICpcbiAgICogSW4gdGhlIGZvbGxvd2luZyBleGFtcGxlLCB3ZSBhcmUgcHJvdmlkaW5nIGEgQ1NTIHNlbGVjdG9yIHRvIG1hdGNoIHRoZSB0YXJnZXQgZWxlbWVudC5cbiAgICpcbiAgICoge0BleGFtcGxlIGNvcmUvdHMvcGxhdGZvcm0vcGxhdGZvcm0udHMgcmVnaW9uPSdjc3NTZWxlY3Rvcid9XG4gICAqXG4gICAqIFdoaWxlIGluIHRoaXMgZXhhbXBsZSwgd2UgYXJlIHByb3ZpZGluZyByZWZlcmVuY2UgdG8gYSBET00gbm9kZS5cbiAgICpcbiAgICoge0BleGFtcGxlIGNvcmUvdHMvcGxhdGZvcm0vcGxhdGZvcm0udHMgcmVnaW9uPSdkb21Ob2RlJ31cbiAgICovXG4gIGJvb3RzdHJhcDxDPihjb21wb25lbnQ6IFR5cGU8Qz4sIHJvb3RTZWxlY3Rvck9yTm9kZT86IHN0cmluZ3xhbnkpOiBDb21wb25lbnRSZWY8Qz47XG5cbiAgLyoqXG4gICAqIEJvb3RzdHJhcCBhIGNvbXBvbmVudCBvbnRvIHRoZSBlbGVtZW50IGlkZW50aWZpZWQgYnkgaXRzIHNlbGVjdG9yIG9yLCBvcHRpb25hbGx5LCB0byBhXG4gICAqIHNwZWNpZmllZCBlbGVtZW50LlxuICAgKlxuICAgKiBAdXNhZ2VOb3Rlc1xuICAgKiAjIyMgQm9vdHN0cmFwIHByb2Nlc3NcbiAgICpcbiAgICogV2hlbiBib290c3RyYXBwaW5nIGEgY29tcG9uZW50LCBBbmd1bGFyIG1vdW50cyBpdCBvbnRvIGEgdGFyZ2V0IERPTSBlbGVtZW50XG4gICAqIGFuZCBraWNrcyBvZmYgYXV0b21hdGljIGNoYW5nZSBkZXRlY3Rpb24uIFRoZSB0YXJnZXQgRE9NIGVsZW1lbnQgY2FuIGJlXG4gICAqIHByb3ZpZGVkIHVzaW5nIHRoZSBgcm9vdFNlbGVjdG9yT3JOb2RlYCBhcmd1bWVudC5cbiAgICpcbiAgICogSWYgdGhlIHRhcmdldCBET00gZWxlbWVudCBpcyBub3QgcHJvdmlkZWQsIEFuZ3VsYXIgdHJpZXMgdG8gZmluZCBvbmUgb24gYSBwYWdlXG4gICAqIHVzaW5nIHRoZSBgc2VsZWN0b3JgIG9mIHRoZSBjb21wb25lbnQgdGhhdCBpcyBiZWluZyBib290c3RyYXBwZWRcbiAgICogKGZpcnN0IG1hdGNoZWQgZWxlbWVudCBpcyB1c2VkKS5cbiAgICpcbiAgICogIyMjIEV4YW1wbGVcbiAgICpcbiAgICogR2VuZXJhbGx5LCB3ZSBkZWZpbmUgdGhlIGNvbXBvbmVudCB0byBib290c3RyYXAgaW4gdGhlIGBib290c3RyYXBgIGFycmF5IG9mIGBOZ01vZHVsZWAsXG4gICAqIGJ1dCBpdCByZXF1aXJlcyB1cyB0byBrbm93IHRoZSBjb21wb25lbnQgd2hpbGUgd3JpdGluZyB0aGUgYXBwbGljYXRpb24gY29kZS5cbiAgICpcbiAgICogSW1hZ2luZSBhIHNpdHVhdGlvbiB3aGVyZSB3ZSBoYXZlIHRvIHdhaXQgZm9yIGFuIEFQSSBjYWxsIHRvIGRlY2lkZSBhYm91dCB0aGUgY29tcG9uZW50IHRvXG4gICAqIGJvb3RzdHJhcC4gV2UgY2FuIHVzZSB0aGUgYG5nRG9Cb290c3RyYXBgIGhvb2sgb2YgdGhlIGBOZ01vZHVsZWAgYW5kIGNhbGwgdGhpcyBtZXRob2QgdG9cbiAgICogZHluYW1pY2FsbHkgYm9vdHN0cmFwIGEgY29tcG9uZW50LlxuICAgKlxuICAgKiB7QGV4YW1wbGUgY29yZS90cy9wbGF0Zm9ybS9wbGF0Zm9ybS50cyByZWdpb249J2NvbXBvbmVudFNlbGVjdG9yJ31cbiAgICpcbiAgICogT3B0aW9uYWxseSwgYSBjb21wb25lbnQgY2FuIGJlIG1vdW50ZWQgb250byBhIERPTSBlbGVtZW50IHRoYXQgZG9lcyBub3QgbWF0Y2ggdGhlXG4gICAqIHNlbGVjdG9yIG9mIHRoZSBib290c3RyYXBwZWQgY29tcG9uZW50LlxuICAgKlxuICAgKiBJbiB0aGUgZm9sbG93aW5nIGV4YW1wbGUsIHdlIGFyZSBwcm92aWRpbmcgYSBDU1Mgc2VsZWN0b3IgdG8gbWF0Y2ggdGhlIHRhcmdldCBlbGVtZW50LlxuICAgKlxuICAgKiB7QGV4YW1wbGUgY29yZS90cy9wbGF0Zm9ybS9wbGF0Zm9ybS50cyByZWdpb249J2Nzc1NlbGVjdG9yJ31cbiAgICpcbiAgICogV2hpbGUgaW4gdGhpcyBleGFtcGxlLCB3ZSBhcmUgcHJvdmlkaW5nIHJlZmVyZW5jZSB0byBhIERPTSBub2RlLlxuICAgKlxuICAgKiB7QGV4YW1wbGUgY29yZS90cy9wbGF0Zm9ybS9wbGF0Zm9ybS50cyByZWdpb249J2RvbU5vZGUnfVxuICAgKlxuICAgKiBAZGVwcmVjYXRlZCBQYXNzaW5nIENvbXBvbmVudCBmYWN0b3JpZXMgYXMgdGhlIGBBcHBsaWNhdGlvbi5ib290c3RyYXBgIGZ1bmN0aW9uIGFyZ3VtZW50IGlzXG4gICAqICAgICBkZXByZWNhdGVkLiBQYXNzIENvbXBvbmVudCBUeXBlcyBpbnN0ZWFkLlxuICAgKi9cbiAgYm9vdHN0cmFwPEM+KGNvbXBvbmVudEZhY3Rvcnk6IENvbXBvbmVudEZhY3Rvcnk8Qz4sIHJvb3RTZWxlY3Rvck9yTm9kZT86IHN0cmluZ3xhbnkpOlxuICAgICAgQ29tcG9uZW50UmVmPEM+O1xuXG4gIC8qKlxuICAgKiBCb290c3RyYXAgYSBjb21wb25lbnQgb250byB0aGUgZWxlbWVudCBpZGVudGlmaWVkIGJ5IGl0cyBzZWxlY3RvciBvciwgb3B0aW9uYWxseSwgdG8gYVxuICAgKiBzcGVjaWZpZWQgZWxlbWVudC5cbiAgICpcbiAgICogQHVzYWdlTm90ZXNcbiAgICogIyMjIEJvb3RzdHJhcCBwcm9jZXNzXG4gICAqXG4gICAqIFdoZW4gYm9vdHN0cmFwcGluZyBhIGNvbXBvbmVudCwgQW5ndWxhciBtb3VudHMgaXQgb250byBhIHRhcmdldCBET00gZWxlbWVudFxuICAgKiBhbmQga2lja3Mgb2ZmIGF1dG9tYXRpYyBjaGFuZ2UgZGV0ZWN0aW9uLiBUaGUgdGFyZ2V0IERPTSBlbGVtZW50IGNhbiBiZVxuICAgKiBwcm92aWRlZCB1c2luZyB0aGUgYHJvb3RTZWxlY3Rvck9yTm9kZWAgYXJndW1lbnQuXG4gICAqXG4gICAqIElmIHRoZSB0YXJnZXQgRE9NIGVsZW1lbnQgaXMgbm90IHByb3ZpZGVkLCBBbmd1bGFyIHRyaWVzIHRvIGZpbmQgb25lIG9uIGEgcGFnZVxuICAgKiB1c2luZyB0aGUgYHNlbGVjdG9yYCBvZiB0aGUgY29tcG9uZW50IHRoYXQgaXMgYmVpbmcgYm9vdHN0cmFwcGVkXG4gICAqIChmaXJzdCBtYXRjaGVkIGVsZW1lbnQgaXMgdXNlZCkuXG4gICAqXG4gICAqICMjIyBFeGFtcGxlXG4gICAqXG4gICAqIEdlbmVyYWxseSwgd2UgZGVmaW5lIHRoZSBjb21wb25lbnQgdG8gYm9vdHN0cmFwIGluIHRoZSBgYm9vdHN0cmFwYCBhcnJheSBvZiBgTmdNb2R1bGVgLFxuICAgKiBidXQgaXQgcmVxdWlyZXMgdXMgdG8ga25vdyB0aGUgY29tcG9uZW50IHdoaWxlIHdyaXRpbmcgdGhlIGFwcGxpY2F0aW9uIGNvZGUuXG4gICAqXG4gICAqIEltYWdpbmUgYSBzaXR1YXRpb24gd2hlcmUgd2UgaGF2ZSB0byB3YWl0IGZvciBhbiBBUEkgY2FsbCB0byBkZWNpZGUgYWJvdXQgdGhlIGNvbXBvbmVudCB0b1xuICAgKiBib290c3RyYXAuIFdlIGNhbiB1c2UgdGhlIGBuZ0RvQm9vdHN0cmFwYCBob29rIG9mIHRoZSBgTmdNb2R1bGVgIGFuZCBjYWxsIHRoaXMgbWV0aG9kIHRvXG4gICAqIGR5bmFtaWNhbGx5IGJvb3RzdHJhcCBhIGNvbXBvbmVudC5cbiAgICpcbiAgICoge0BleGFtcGxlIGNvcmUvdHMvcGxhdGZvcm0vcGxhdGZvcm0udHMgcmVnaW9uPSdjb21wb25lbnRTZWxlY3Rvcid9XG4gICAqXG4gICAqIE9wdGlvbmFsbHksIGEgY29tcG9uZW50IGNhbiBiZSBtb3VudGVkIG9udG8gYSBET00gZWxlbWVudCB0aGF0IGRvZXMgbm90IG1hdGNoIHRoZVxuICAgKiBzZWxlY3RvciBvZiB0aGUgYm9vdHN0cmFwcGVkIGNvbXBvbmVudC5cbiAgICpcbiAgICogSW4gdGhlIGZvbGxvd2luZyBleGFtcGxlLCB3ZSBhcmUgcHJvdmlkaW5nIGEgQ1NTIHNlbGVjdG9yIHRvIG1hdGNoIHRoZSB0YXJnZXQgZWxlbWVudC5cbiAgICpcbiAgICoge0BleGFtcGxlIGNvcmUvdHMvcGxhdGZvcm0vcGxhdGZvcm0udHMgcmVnaW9uPSdjc3NTZWxlY3Rvcid9XG4gICAqXG4gICAqIFdoaWxlIGluIHRoaXMgZXhhbXBsZSwgd2UgYXJlIHByb3ZpZGluZyByZWZlcmVuY2UgdG8gYSBET00gbm9kZS5cbiAgICpcbiAgICoge0BleGFtcGxlIGNvcmUvdHMvcGxhdGZvcm0vcGxhdGZvcm0udHMgcmVnaW9uPSdkb21Ob2RlJ31cbiAgICovXG4gIGJvb3RzdHJhcDxDPihjb21wb25lbnRPckZhY3Rvcnk6IENvbXBvbmVudEZhY3Rvcnk8Qz58VHlwZTxDPiwgcm9vdFNlbGVjdG9yT3JOb2RlPzogc3RyaW5nfGFueSk6XG4gICAgICBDb21wb25lbnRSZWY8Qz4ge1xuICAgICh0eXBlb2YgbmdEZXZNb2RlID09PSAndW5kZWZpbmVkJyB8fCBuZ0Rldk1vZGUpICYmIHRoaXMud2FybklmRGVzdHJveWVkKCk7XG4gICAgY29uc3QgaXNDb21wb25lbnRGYWN0b3J5ID0gY29tcG9uZW50T3JGYWN0b3J5IGluc3RhbmNlb2YgQ29tcG9uZW50RmFjdG9yeTtcbiAgICBjb25zdCBpbml0U3RhdHVzID0gdGhpcy5faW5qZWN0b3IuZ2V0KEFwcGxpY2F0aW9uSW5pdFN0YXR1cyk7XG5cbiAgICBpZiAoIWluaXRTdGF0dXMuZG9uZSkge1xuICAgICAgY29uc3Qgc3RhbmRhbG9uZSA9ICFpc0NvbXBvbmVudEZhY3RvcnkgJiYgaXNTdGFuZGFsb25lKGNvbXBvbmVudE9yRmFjdG9yeSk7XG4gICAgICBjb25zdCBlcnJvck1lc3NhZ2UgPSAodHlwZW9mIG5nRGV2TW9kZSA9PT0gJ3VuZGVmaW5lZCcgfHwgbmdEZXZNb2RlKSAmJlxuICAgICAgICAgICdDYW5ub3QgYm9vdHN0cmFwIGFzIHRoZXJlIGFyZSBzdGlsbCBhc3luY2hyb25vdXMgaW5pdGlhbGl6ZXJzIHJ1bm5pbmcuJyArXG4gICAgICAgICAgICAgIChzdGFuZGFsb25lID9cbiAgICAgICAgICAgICAgICAgICAnJyA6XG4gICAgICAgICAgICAgICAgICAgJyBCb290c3RyYXAgY29tcG9uZW50cyBpbiB0aGUgYG5nRG9Cb290c3RyYXBgIG1ldGhvZCBvZiB0aGUgcm9vdCBtb2R1bGUuJyk7XG4gICAgICB0aHJvdyBuZXcgUnVudGltZUVycm9yKFJ1bnRpbWVFcnJvckNvZGUuQVNZTkNfSU5JVElBTElaRVJTX1NUSUxMX1JVTk5JTkcsIGVycm9yTWVzc2FnZSk7XG4gICAgfVxuXG4gICAgbGV0IGNvbXBvbmVudEZhY3Rvcnk6IENvbXBvbmVudEZhY3Rvcnk8Qz47XG4gICAgaWYgKGlzQ29tcG9uZW50RmFjdG9yeSkge1xuICAgICAgY29tcG9uZW50RmFjdG9yeSA9IGNvbXBvbmVudE9yRmFjdG9yeTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgcmVzb2x2ZXIgPSB0aGlzLl9pbmplY3Rvci5nZXQoQ29tcG9uZW50RmFjdG9yeVJlc29sdmVyKTtcbiAgICAgIGNvbXBvbmVudEZhY3RvcnkgPSByZXNvbHZlci5yZXNvbHZlQ29tcG9uZW50RmFjdG9yeShjb21wb25lbnRPckZhY3RvcnkpITtcbiAgICB9XG4gICAgdGhpcy5jb21wb25lbnRUeXBlcy5wdXNoKGNvbXBvbmVudEZhY3RvcnkuY29tcG9uZW50VHlwZSk7XG5cbiAgICAvLyBDcmVhdGUgYSBmYWN0b3J5IGFzc29jaWF0ZWQgd2l0aCB0aGUgY3VycmVudCBtb2R1bGUgaWYgaXQncyBub3QgYm91bmQgdG8gc29tZSBvdGhlclxuICAgIGNvbnN0IG5nTW9kdWxlID1cbiAgICAgICAgaXNCb3VuZFRvTW9kdWxlKGNvbXBvbmVudEZhY3RvcnkpID8gdW5kZWZpbmVkIDogdGhpcy5faW5qZWN0b3IuZ2V0KE5nTW9kdWxlUmVmKTtcbiAgICBjb25zdCBzZWxlY3Rvck9yTm9kZSA9IHJvb3RTZWxlY3Rvck9yTm9kZSB8fCBjb21wb25lbnRGYWN0b3J5LnNlbGVjdG9yO1xuICAgIGNvbnN0IGNvbXBSZWYgPSBjb21wb25lbnRGYWN0b3J5LmNyZWF0ZShJbmplY3Rvci5OVUxMLCBbXSwgc2VsZWN0b3JPck5vZGUsIG5nTW9kdWxlKTtcbiAgICBjb25zdCBuYXRpdmVFbGVtZW50ID0gY29tcFJlZi5sb2NhdGlvbi5uYXRpdmVFbGVtZW50O1xuICAgIGNvbnN0IHRlc3RhYmlsaXR5ID0gY29tcFJlZi5pbmplY3Rvci5nZXQoVEVTVEFCSUxJVFksIG51bGwpO1xuICAgIHRlc3RhYmlsaXR5Py5yZWdpc3RlckFwcGxpY2F0aW9uKG5hdGl2ZUVsZW1lbnQpO1xuXG4gICAgY29tcFJlZi5vbkRlc3Ryb3koKCkgPT4ge1xuICAgICAgdGhpcy5kZXRhY2hWaWV3KGNvbXBSZWYuaG9zdFZpZXcpO1xuICAgICAgcmVtb3ZlKHRoaXMuY29tcG9uZW50cywgY29tcFJlZik7XG4gICAgICB0ZXN0YWJpbGl0eT8udW5yZWdpc3RlckFwcGxpY2F0aW9uKG5hdGl2ZUVsZW1lbnQpO1xuICAgIH0pO1xuXG4gICAgdGhpcy5fbG9hZENvbXBvbmVudChjb21wUmVmKTtcbiAgICBpZiAodHlwZW9mIG5nRGV2TW9kZSA9PT0gJ3VuZGVmaW5lZCcgfHwgbmdEZXZNb2RlKSB7XG4gICAgICBjb25zdCBfY29uc29sZSA9IHRoaXMuX2luamVjdG9yLmdldChDb25zb2xlKTtcbiAgICAgIF9jb25zb2xlLmxvZyhgQW5ndWxhciBpcyBydW5uaW5nIGluIGRldmVsb3BtZW50IG1vZGUuYCk7XG4gICAgfVxuICAgIHJldHVybiBjb21wUmVmO1xuICB9XG5cbiAgLyoqXG4gICAqIEludm9rZSB0aGlzIG1ldGhvZCB0byBleHBsaWNpdGx5IHByb2Nlc3MgY2hhbmdlIGRldGVjdGlvbiBhbmQgaXRzIHNpZGUtZWZmZWN0cy5cbiAgICpcbiAgICogSW4gZGV2ZWxvcG1lbnQgbW9kZSwgYHRpY2soKWAgYWxzbyBwZXJmb3JtcyBhIHNlY29uZCBjaGFuZ2UgZGV0ZWN0aW9uIGN5Y2xlIHRvIGVuc3VyZSB0aGF0IG5vXG4gICAqIGZ1cnRoZXIgY2hhbmdlcyBhcmUgZGV0ZWN0ZWQuIElmIGFkZGl0aW9uYWwgY2hhbmdlcyBhcmUgcGlja2VkIHVwIGR1cmluZyB0aGlzIHNlY29uZCBjeWNsZSxcbiAgICogYmluZGluZ3MgaW4gdGhlIGFwcCBoYXZlIHNpZGUtZWZmZWN0cyB0aGF0IGNhbm5vdCBiZSByZXNvbHZlZCBpbiBhIHNpbmdsZSBjaGFuZ2UgZGV0ZWN0aW9uXG4gICAqIHBhc3MuXG4gICAqIEluIHRoaXMgY2FzZSwgQW5ndWxhciB0aHJvd3MgYW4gZXJyb3IsIHNpbmNlIGFuIEFuZ3VsYXIgYXBwbGljYXRpb24gY2FuIG9ubHkgaGF2ZSBvbmUgY2hhbmdlXG4gICAqIGRldGVjdGlvbiBwYXNzIGR1cmluZyB3aGljaCBhbGwgY2hhbmdlIGRldGVjdGlvbiBtdXN0IGNvbXBsZXRlLlxuICAgKi9cbiAgdGljaygpOiB2b2lkIHtcbiAgICAodHlwZW9mIG5nRGV2TW9kZSA9PT0gJ3VuZGVmaW5lZCcgfHwgbmdEZXZNb2RlKSAmJiB0aGlzLndhcm5JZkRlc3Ryb3llZCgpO1xuICAgIGlmICh0aGlzLl9ydW5uaW5nVGljaykge1xuICAgICAgdGhyb3cgbmV3IFJ1bnRpbWVFcnJvcihcbiAgICAgICAgICBSdW50aW1lRXJyb3JDb2RlLlJFQ1VSU0lWRV9BUFBMSUNBVElPTl9SRUZfVElDSyxcbiAgICAgICAgICBuZ0Rldk1vZGUgJiYgJ0FwcGxpY2F0aW9uUmVmLnRpY2sgaXMgY2FsbGVkIHJlY3Vyc2l2ZWx5Jyk7XG4gICAgfVxuXG4gICAgY29uc3QgcHJldkNvbnN1bWVyID0gc2V0QWN0aXZlQ29uc3VtZXIobnVsbCk7XG4gICAgdHJ5IHtcbiAgICAgIHRoaXMuX3J1bm5pbmdUaWNrID0gdHJ1ZTtcblxuICAgICAgdGhpcy5kZXRlY3RDaGFuZ2VzSW5BdHRhY2hlZFZpZXdzKCk7XG5cbiAgICAgIGlmICgodHlwZW9mIG5nRGV2TW9kZSA9PT0gJ3VuZGVmaW5lZCcgfHwgbmdEZXZNb2RlKSkge1xuICAgICAgICBmb3IgKGxldCB2aWV3IG9mIHRoaXMuX3ZpZXdzKSB7XG4gICAgICAgICAgdmlldy5jaGVja05vQ2hhbmdlcygpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgLy8gQXR0ZW50aW9uOiBEb24ndCByZXRocm93IGFzIGl0IGNvdWxkIGNhbmNlbCBzdWJzY3JpcHRpb25zIHRvIE9ic2VydmFibGVzIVxuICAgICAgdGhpcy5pbnRlcm5hbEVycm9ySGFuZGxlcihlKTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgdGhpcy5hZnRlclRpY2submV4dCgpO1xuICAgICAgdGhpcy5fcnVubmluZ1RpY2sgPSBmYWxzZTtcbiAgICAgIHNldEFjdGl2ZUNvbnN1bWVyKHByZXZDb25zdW1lcik7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBkZXRlY3RDaGFuZ2VzSW5BdHRhY2hlZFZpZXdzKCkge1xuICAgIGxldCBydW5zID0gMDtcbiAgICBjb25zdCBhZnRlclJlbmRlckVmZmVjdE1hbmFnZXIgPSB0aGlzLmFmdGVyUmVuZGVyRWZmZWN0TWFuYWdlcjtcbiAgICB3aGlsZSAodHJ1ZSkge1xuICAgICAgaWYgKHJ1bnMgPT09IE1BWElNVU1fUkVGUkVTSF9SRVJVTlMpIHtcbiAgICAgICAgdGhyb3cgbmV3IFJ1bnRpbWVFcnJvcihcbiAgICAgICAgICAgIFJ1bnRpbWVFcnJvckNvZGUuSU5GSU5JVEVfQ0hBTkdFX0RFVEVDVElPTixcbiAgICAgICAgICAgIG5nRGV2TW9kZSAmJlxuICAgICAgICAgICAgICAgICdJbmZpbml0ZSBjaGFuZ2UgZGV0ZWN0aW9uIHdoaWxlIHJlZnJlc2hpbmcgYXBwbGljYXRpb24gdmlld3MuICcgK1xuICAgICAgICAgICAgICAgICAgICAnRW5zdXJlIGFmdGVyUmVuZGVyIG9yIHF1ZXVlU3RhdGVVcGRhdGUgaG9va3MgYXJlIG5vdCBjb250aW51b3VzbHkgY2F1c2luZyB1cGRhdGVzLicpO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBpc0ZpcnN0UGFzcyA9IHJ1bnMgPT09IDA7XG4gICAgICB0aGlzLmJlZm9yZVJlbmRlci5uZXh0KGlzRmlyc3RQYXNzKTtcbiAgICAgIGZvciAobGV0IHtfbFZpZXcsIG5vdGlmeUVycm9ySGFuZGxlcn0gb2YgdGhpcy5fdmlld3MpIHtcbiAgICAgICAgZGV0ZWN0Q2hhbmdlc0luVmlld0lmUmVxdWlyZWQoX2xWaWV3LCBpc0ZpcnN0UGFzcywgbm90aWZ5RXJyb3JIYW5kbGVyKTtcbiAgICAgIH1cbiAgICAgIHJ1bnMrKztcblxuICAgICAgYWZ0ZXJSZW5kZXJFZmZlY3RNYW5hZ2VyLmV4ZWN1dGVJbnRlcm5hbENhbGxiYWNrcygpO1xuICAgICAgLy8gSWYgd2UgaGF2ZSBhIG5ld2x5IGRpcnR5IHZpZXcgYWZ0ZXIgcnVubmluZyBpbnRlcm5hbCBjYWxsYmFja3MsIHJlY2hlY2sgdGhlIHZpZXdzIGFnYWluXG4gICAgICAvLyBiZWZvcmUgcnVubmluZyB1c2VyLXByb3ZpZGVkIGNhbGxiYWNrc1xuICAgICAgaWYgKFsuLi50aGlzLmV4dGVybmFsVGVzdFZpZXdzLmtleXMoKSwgLi4udGhpcy5fdmlld3NdLnNvbWUoXG4gICAgICAgICAgICAgICh7X2xWaWV3fSkgPT4gc2hvdWxkUmVjaGVja1ZpZXcoX2xWaWV3KSkpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIGFmdGVyUmVuZGVyRWZmZWN0TWFuYWdlci5leGVjdXRlKCk7XG4gICAgICAvLyBJZiBhZnRlciBydW5uaW5nIGFsbCBhZnRlclJlbmRlciBjYWxsYmFja3Mgd2UgaGF2ZSBubyBtb3JlIHZpZXdzIHRoYXQgbmVlZCB0byBiZSByZWZyZXNoZWQsXG4gICAgICAvLyB3ZSBjYW4gYnJlYWsgb3V0IG9mIHRoZSBsb29wXG4gICAgICBpZiAoIVsuLi50aGlzLmV4dGVybmFsVGVzdFZpZXdzLmtleXMoKSwgLi4udGhpcy5fdmlld3NdLnNvbWUoXG4gICAgICAgICAgICAgICh7X2xWaWV3fSkgPT4gc2hvdWxkUmVjaGVja1ZpZXcoX2xWaWV3KSkpIHtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICB9XG5cblxuICAvKipcbiAgICogQXR0YWNoZXMgYSB2aWV3IHNvIHRoYXQgaXQgd2lsbCBiZSBkaXJ0eSBjaGVja2VkLlxuICAgKiBUaGUgdmlldyB3aWxsIGJlIGF1dG9tYXRpY2FsbHkgZGV0YWNoZWQgd2hlbiBpdCBpcyBkZXN0cm95ZWQuXG4gICAqIFRoaXMgd2lsbCB0aHJvdyBpZiB0aGUgdmlldyBpcyBhbHJlYWR5IGF0dGFjaGVkIHRvIGEgVmlld0NvbnRhaW5lci5cbiAgICovXG4gIGF0dGFjaFZpZXcodmlld1JlZjogVmlld1JlZik6IHZvaWQge1xuICAgICh0eXBlb2YgbmdEZXZNb2RlID09PSAndW5kZWZpbmVkJyB8fCBuZ0Rldk1vZGUpICYmIHRoaXMud2FybklmRGVzdHJveWVkKCk7XG4gICAgY29uc3QgdmlldyA9ICh2aWV3UmVmIGFzIEludGVybmFsVmlld1JlZjx1bmtub3duPik7XG4gICAgdGhpcy5fdmlld3MucHVzaCh2aWV3KTtcbiAgICB2aWV3LmF0dGFjaFRvQXBwUmVmKHRoaXMpO1xuICB9XG5cbiAgLyoqXG4gICAqIERldGFjaGVzIGEgdmlldyBmcm9tIGRpcnR5IGNoZWNraW5nIGFnYWluLlxuICAgKi9cbiAgZGV0YWNoVmlldyh2aWV3UmVmOiBWaWV3UmVmKTogdm9pZCB7XG4gICAgKHR5cGVvZiBuZ0Rldk1vZGUgPT09ICd1bmRlZmluZWQnIHx8IG5nRGV2TW9kZSkgJiYgdGhpcy53YXJuSWZEZXN0cm95ZWQoKTtcbiAgICBjb25zdCB2aWV3ID0gKHZpZXdSZWYgYXMgSW50ZXJuYWxWaWV3UmVmPHVua25vd24+KTtcbiAgICByZW1vdmUodGhpcy5fdmlld3MsIHZpZXcpO1xuICAgIHZpZXcuZGV0YWNoRnJvbUFwcFJlZigpO1xuICB9XG5cbiAgcHJpdmF0ZSBfbG9hZENvbXBvbmVudChjb21wb25lbnRSZWY6IENvbXBvbmVudFJlZjxhbnk+KTogdm9pZCB7XG4gICAgdGhpcy5hdHRhY2hWaWV3KGNvbXBvbmVudFJlZi5ob3N0Vmlldyk7XG4gICAgdGhpcy50aWNrKCk7XG4gICAgdGhpcy5jb21wb25lbnRzLnB1c2goY29tcG9uZW50UmVmKTtcbiAgICAvLyBHZXQgdGhlIGxpc3RlbmVycyBsYXppbHkgdG8gcHJldmVudCBESSBjeWNsZXMuXG4gICAgY29uc3QgbGlzdGVuZXJzID0gdGhpcy5faW5qZWN0b3IuZ2V0KEFQUF9CT09UU1RSQVBfTElTVEVORVIsIFtdKTtcbiAgICBpZiAobmdEZXZNb2RlICYmICFBcnJheS5pc0FycmF5KGxpc3RlbmVycykpIHtcbiAgICAgIHRocm93IG5ldyBSdW50aW1lRXJyb3IoXG4gICAgICAgICAgUnVudGltZUVycm9yQ29kZS5JTlZBTElEX01VTFRJX1BST1ZJREVSLFxuICAgICAgICAgICdVbmV4cGVjdGVkIHR5cGUgb2YgdGhlIGBBUFBfQk9PVFNUUkFQX0xJU1RFTkVSYCB0b2tlbiB2YWx1ZSAnICtcbiAgICAgICAgICAgICAgYChleHBlY3RlZCBhbiBhcnJheSwgYnV0IGdvdCAke3R5cGVvZiBsaXN0ZW5lcnN9KS4gYCArXG4gICAgICAgICAgICAgICdQbGVhc2UgY2hlY2sgdGhhdCB0aGUgYEFQUF9CT09UU1RSQVBfTElTVEVORVJgIHRva2VuIGlzIGNvbmZpZ3VyZWQgYXMgYSAnICtcbiAgICAgICAgICAgICAgJ2BtdWx0aTogdHJ1ZWAgcHJvdmlkZXIuJyk7XG4gICAgfVxuICAgIFsuLi50aGlzLl9ib290c3RyYXBMaXN0ZW5lcnMsIC4uLmxpc3RlbmVyc10uZm9yRWFjaCgobGlzdGVuZXIpID0+IGxpc3RlbmVyKGNvbXBvbmVudFJlZikpO1xuICB9XG5cbiAgLyoqIEBpbnRlcm5hbCAqL1xuICBuZ09uRGVzdHJveSgpIHtcbiAgICBpZiAodGhpcy5fZGVzdHJveWVkKSByZXR1cm47XG5cbiAgICB0cnkge1xuICAgICAgLy8gQ2FsbCBhbGwgdGhlIGxpZmVjeWNsZSBob29rcy5cbiAgICAgIHRoaXMuX2Rlc3Ryb3lMaXN0ZW5lcnMuZm9yRWFjaChsaXN0ZW5lciA9PiBsaXN0ZW5lcigpKTtcblxuICAgICAgLy8gRGVzdHJveSBhbGwgcmVnaXN0ZXJlZCB2aWV3cy5cbiAgICAgIHRoaXMuX3ZpZXdzLnNsaWNlKCkuZm9yRWFjaCgodmlldykgPT4gdmlldy5kZXN0cm95KCkpO1xuICAgIH0gZmluYWxseSB7XG4gICAgICAvLyBJbmRpY2F0ZSB0aGF0IHRoaXMgaW5zdGFuY2UgaXMgZGVzdHJveWVkLlxuICAgICAgdGhpcy5fZGVzdHJveWVkID0gdHJ1ZTtcblxuICAgICAgLy8gUmVsZWFzZSBhbGwgcmVmZXJlbmNlcy5cbiAgICAgIHRoaXMuX3ZpZXdzID0gW107XG4gICAgICB0aGlzLl9ib290c3RyYXBMaXN0ZW5lcnMgPSBbXTtcbiAgICAgIHRoaXMuX2Rlc3Ryb3lMaXN0ZW5lcnMgPSBbXTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogUmVnaXN0ZXJzIGEgbGlzdGVuZXIgdG8gYmUgY2FsbGVkIHdoZW4gYW4gaW5zdGFuY2UgaXMgZGVzdHJveWVkLlxuICAgKlxuICAgKiBAcGFyYW0gY2FsbGJhY2sgQSBjYWxsYmFjayBmdW5jdGlvbiB0byBhZGQgYXMgYSBsaXN0ZW5lci5cbiAgICogQHJldHVybnMgQSBmdW5jdGlvbiB3aGljaCB1bnJlZ2lzdGVycyBhIGxpc3RlbmVyLlxuICAgKi9cbiAgb25EZXN0cm95KGNhbGxiYWNrOiAoKSA9PiB2b2lkKTogVm9pZEZ1bmN0aW9uIHtcbiAgICAodHlwZW9mIG5nRGV2TW9kZSA9PT0gJ3VuZGVmaW5lZCcgfHwgbmdEZXZNb2RlKSAmJiB0aGlzLndhcm5JZkRlc3Ryb3llZCgpO1xuICAgIHRoaXMuX2Rlc3Ryb3lMaXN0ZW5lcnMucHVzaChjYWxsYmFjayk7XG4gICAgcmV0dXJuICgpID0+IHJlbW92ZSh0aGlzLl9kZXN0cm95TGlzdGVuZXJzLCBjYWxsYmFjayk7XG4gIH1cblxuICAvKipcbiAgICogRGVzdHJveXMgYW4gQW5ndWxhciBhcHBsaWNhdGlvbiByZXByZXNlbnRlZCBieSB0aGlzIGBBcHBsaWNhdGlvblJlZmAuIENhbGxpbmcgdGhpcyBmdW5jdGlvblxuICAgKiB3aWxsIGRlc3Ryb3kgdGhlIGFzc29jaWF0ZWQgZW52aXJvbm1lbnQgaW5qZWN0b3JzIGFzIHdlbGwgYXMgYWxsIHRoZSBib290c3RyYXBwZWQgY29tcG9uZW50c1xuICAgKiB3aXRoIHRoZWlyIHZpZXdzLlxuICAgKi9cbiAgZGVzdHJveSgpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5fZGVzdHJveWVkKSB7XG4gICAgICB0aHJvdyBuZXcgUnVudGltZUVycm9yKFxuICAgICAgICAgIFJ1bnRpbWVFcnJvckNvZGUuQVBQTElDQVRJT05fUkVGX0FMUkVBRFlfREVTVFJPWUVELFxuICAgICAgICAgIG5nRGV2TW9kZSAmJiAnVGhpcyBpbnN0YW5jZSBvZiB0aGUgYEFwcGxpY2F0aW9uUmVmYCBoYXMgYWxyZWFkeSBiZWVuIGRlc3Ryb3llZC4nKTtcbiAgICB9XG5cbiAgICAvLyBUaGlzIGlzIGEgdGVtcG9yYXJ5IHR5cGUgdG8gcmVwcmVzZW50IGFuIGluc3RhbmNlIG9mIGFuIFIzSW5qZWN0b3IsIHdoaWNoIGNhbiBiZSBkZXN0cm95ZWQuXG4gICAgLy8gVGhlIHR5cGUgd2lsbCBiZSByZXBsYWNlZCB3aXRoIGEgZGlmZmVyZW50IG9uZSBvbmNlIGRlc3Ryb3lhYmxlIGluamVjdG9yIHR5cGUgaXMgYXZhaWxhYmxlLlxuICAgIHR5cGUgRGVzdHJveWFibGVJbmplY3RvciA9IEluamVjdG9yJntkZXN0cm95PzogRnVuY3Rpb24sIGRlc3Ryb3llZD86IGJvb2xlYW59O1xuXG4gICAgY29uc3QgaW5qZWN0b3IgPSB0aGlzLl9pbmplY3RvciBhcyBEZXN0cm95YWJsZUluamVjdG9yO1xuXG4gICAgLy8gQ2hlY2sgdGhhdCB0aGlzIGluamVjdG9yIGluc3RhbmNlIHN1cHBvcnRzIGRlc3Ryb3kgb3BlcmF0aW9uLlxuICAgIGlmIChpbmplY3Rvci5kZXN0cm95ICYmICFpbmplY3Rvci5kZXN0cm95ZWQpIHtcbiAgICAgIC8vIERlc3Ryb3lpbmcgYW4gdW5kZXJseWluZyBpbmplY3RvciB3aWxsIHRyaWdnZXIgdGhlIGBuZ09uRGVzdHJveWAgbGlmZWN5Y2xlXG4gICAgICAvLyBob29rLCB3aGljaCBpbnZva2VzIHRoZSByZW1haW5pbmcgY2xlYW51cCBhY3Rpb25zLlxuICAgICAgaW5qZWN0b3IuZGVzdHJveSgpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBudW1iZXIgb2YgYXR0YWNoZWQgdmlld3MuXG4gICAqL1xuICBnZXQgdmlld0NvdW50KCkge1xuICAgIHJldHVybiB0aGlzLl92aWV3cy5sZW5ndGg7XG4gIH1cblxuICBwcml2YXRlIHdhcm5JZkRlc3Ryb3llZCgpIHtcbiAgICBpZiAoKHR5cGVvZiBuZ0Rldk1vZGUgPT09ICd1bmRlZmluZWQnIHx8IG5nRGV2TW9kZSkgJiYgdGhpcy5fZGVzdHJveWVkKSB7XG4gICAgICBjb25zb2xlLndhcm4oZm9ybWF0UnVudGltZUVycm9yKFxuICAgICAgICAgIFJ1bnRpbWVFcnJvckNvZGUuQVBQTElDQVRJT05fUkVGX0FMUkVBRFlfREVTVFJPWUVELFxuICAgICAgICAgICdUaGlzIGluc3RhbmNlIG9mIHRoZSBgQXBwbGljYXRpb25SZWZgIGhhcyBhbHJlYWR5IGJlZW4gZGVzdHJveWVkLicpKTtcbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlbW92ZTxUPihsaXN0OiBUW10sIGVsOiBUKTogdm9pZCB7XG4gIGNvbnN0IGluZGV4ID0gbGlzdC5pbmRleE9mKGVsKTtcbiAgaWYgKGluZGV4ID4gLTEpIHtcbiAgICBsaXN0LnNwbGljZShpbmRleCwgMSk7XG4gIH1cbn1cblxubGV0IHdoZW5TdGFibGVTdG9yZTogV2Vha01hcDxBcHBsaWNhdGlvblJlZiwgUHJvbWlzZTx2b2lkPj58dW5kZWZpbmVkO1xuLyoqXG4gKiBSZXR1cm5zIGEgUHJvbWlzZSB0aGF0IHJlc29sdmVzIHdoZW4gdGhlIGFwcGxpY2F0aW9uIGJlY29tZXMgc3RhYmxlIGFmdGVyIHRoaXMgbWV0aG9kIGlzIGNhbGxlZFxuICogdGhlIGZpcnN0IHRpbWUuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB3aGVuU3RhYmxlKGFwcGxpY2F0aW9uUmVmOiBBcHBsaWNhdGlvblJlZik6IFByb21pc2U8dm9pZD4ge1xuICB3aGVuU3RhYmxlU3RvcmUgPz89IG5ldyBXZWFrTWFwKCk7XG4gIGNvbnN0IGNhY2hlZFdoZW5TdGFibGUgPSB3aGVuU3RhYmxlU3RvcmUuZ2V0KGFwcGxpY2F0aW9uUmVmKTtcbiAgaWYgKGNhY2hlZFdoZW5TdGFibGUpIHtcbiAgICByZXR1cm4gY2FjaGVkV2hlblN0YWJsZTtcbiAgfVxuXG4gIGNvbnN0IHdoZW5TdGFibGVQcm9taXNlID1cbiAgICAgIGFwcGxpY2F0aW9uUmVmLmlzU3RhYmxlLnBpcGUoZmlyc3QoKGlzU3RhYmxlKSA9PiBpc1N0YWJsZSkpLnRvUHJvbWlzZSgpLnRoZW4oKCkgPT4gdm9pZCAwKTtcbiAgd2hlblN0YWJsZVN0b3JlLnNldChhcHBsaWNhdGlvblJlZiwgd2hlblN0YWJsZVByb21pc2UpO1xuXG4gIC8vIEJlIGEgZ29vZCBjaXRpemVuIGFuZCBjbGVhbiB0aGUgc3RvcmUgYG9uRGVzdHJveWAgZXZlbiB0aG91Z2ggd2UgYXJlIHVzaW5nIGBXZWFrTWFwYC5cbiAgYXBwbGljYXRpb25SZWYub25EZXN0cm95KCgpID0+IHdoZW5TdGFibGVTdG9yZT8uZGVsZXRlKGFwcGxpY2F0aW9uUmVmKSk7XG5cbiAgcmV0dXJuIHdoZW5TdGFibGVQcm9taXNlO1xufVxuXG5cbmV4cG9ydCBmdW5jdGlvbiBkZXRlY3RDaGFuZ2VzSW5WaWV3SWZSZXF1aXJlZChcbiAgICBsVmlldzogTFZpZXcsIGlzRmlyc3RQYXNzOiBib29sZWFuLCBub3RpZnlFcnJvckhhbmRsZXI6IGJvb2xlYW4pIHtcbiAgLy8gV2hlbiByZS1jaGVja2luZywgb25seSBjaGVjayB2aWV3cyB3aGljaCBhY3R1YWxseSBuZWVkIGl0LlxuICBpZiAoIWlzRmlyc3RQYXNzICYmICFzaG91bGRSZWNoZWNrVmlldyhsVmlldykpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgZGV0ZWN0Q2hhbmdlc0luVmlldyhsVmlldywgbm90aWZ5RXJyb3JIYW5kbGVyLCBpc0ZpcnN0UGFzcyk7XG59XG5cbmZ1bmN0aW9uIHNob3VsZFJlY2hlY2tWaWV3KHZpZXc6IExWaWV3KTogYm9vbGVhbiB7XG4gIHJldHVybiByZXF1aXJlc1JlZnJlc2hPclRyYXZlcnNhbCh2aWV3KSB8fFxuICAgICAgLy8gVE9ETyhhdHNjb3R0KTogUmVtb3ZlIGlzRzMgY2hlY2sgYW5kIG1ha2UgdGhpcyBhIGJyZWFraW5nIGNoYW5nZSBmb3IgdjE4XG4gICAgICAoaXNHMyAmJiAhISh2aWV3W0ZMQUdTXSAmIExWaWV3RmxhZ3MuRGlydHkpKTtcbn1cblxuZnVuY3Rpb24gZGV0ZWN0Q2hhbmdlc0luVmlldyhsVmlldzogTFZpZXcsIG5vdGlmeUVycm9ySGFuZGxlcjogYm9vbGVhbiwgaXNGaXJzdFBhc3M6IGJvb2xlYW4pIHtcbiAgbGV0IG1vZGU6IENoYW5nZURldGVjdGlvbk1vZGU7XG4gIGlmIChpc0ZpcnN0UGFzcykge1xuICAgIC8vIFRoZSBmaXJzdCBwYXNzIGlzIGFsd2F5cyBpbiBHbG9iYWwgbW9kZSwgd2hpY2ggaW5jbHVkZXMgYENoZWNrQWx3YXlzYCB2aWV3cy5cbiAgICBtb2RlID0gQ2hhbmdlRGV0ZWN0aW9uTW9kZS5HbG9iYWw7XG4gICAgLy8gQWRkIGBSZWZyZXNoVmlld2AgZmxhZyB0byBlbnN1cmUgdGhpcyB2aWV3IGlzIHJlZnJlc2hlZCBpZiBub3QgYWxyZWFkeSBkaXJ0eS5cbiAgICAvLyBgUmVmcmVzaFZpZXdgIGZsYWcgaXMgdXNlZCBpbnRlbnRpb25hbGx5IG92ZXIgYERpcnR5YCBiZWNhdXNlIGl0IGdldHMgY2xlYXJlZCBiZWZvcmVcbiAgICAvLyBleGVjdXRpbmcgYW55IG9mIHRoZSBhY3R1YWwgcmVmcmVzaCBjb2RlIHdoaWxlIHRoZSBgRGlydHlgIGZsYWcgZG9lc24ndCBnZXQgY2xlYXJlZFxuICAgIC8vIHVudGlsIHRoZSBlbmQgb2YgdGhlIHJlZnJlc2guIFVzaW5nIGBSZWZyZXNoVmlld2AgcHJldmVudHMgY3JlYXRpbmcgYSBwb3RlbnRpYWxcbiAgICAvLyBkaWZmZXJlbmNlIGluIHRoZSBzdGF0ZSBvZiB0aGUgTFZpZXdGbGFncyBkdXJpbmcgdGVtcGxhdGUgZXhlY3V0aW9uLlxuICAgIGxWaWV3W0ZMQUdTXSB8PSBMVmlld0ZsYWdzLlJlZnJlc2hWaWV3O1xuICB9IGVsc2UgaWYgKGxWaWV3W0ZMQUdTXSAmIExWaWV3RmxhZ3MuRGlydHkpIHtcbiAgICAvLyBUaGUgcm9vdCB2aWV3IGhhcyBiZWVuIGV4cGxpY2l0bHkgbWFya2VkIGZvciBjaGVjaywgc28gY2hlY2sgaXQgaW4gR2xvYmFsIG1vZGUuXG4gICAgbW9kZSA9IENoYW5nZURldGVjdGlvbk1vZGUuR2xvYmFsO1xuICB9IGVsc2Uge1xuICAgIC8vIFRoZSB2aWV3IGhhcyBub3QgYmVlbiBtYXJrZWQgZm9yIGNoZWNrLCBidXQgY29udGFpbnMgYSB2aWV3IG1hcmtlZCBmb3IgcmVmcmVzaFxuICAgIC8vIChsaWtlbHkgdmlhIGEgc2lnbmFsKS4gU3RhcnQgdGhpcyBjaGFuZ2UgZGV0ZWN0aW9uIGluIFRhcmdldGVkIG1vZGUgdG8gc2tpcCB0aGUgcm9vdFxuICAgIC8vIHZpZXcgYW5kIGNoZWNrIGp1c3QgdGhlIHZpZXcocykgdGhhdCBuZWVkIHJlZnJlc2hlZC5cbiAgICBtb2RlID0gQ2hhbmdlRGV0ZWN0aW9uTW9kZS5UYXJnZXRlZDtcbiAgfVxuICBkZXRlY3RDaGFuZ2VzSW50ZXJuYWwobFZpZXcsIG5vdGlmeUVycm9ySGFuZGxlciwgbW9kZSk7XG59XG4iXX0=