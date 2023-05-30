/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import './util/ng_jit_mode';
import { of } from 'rxjs';
import { distinctUntilChanged, mergeMap, share } from 'rxjs/operators';
import { ApplicationInitStatus } from './application_init';
import { PLATFORM_INITIALIZER } from './application_tokens';
import { getCompilerFacade } from './compiler/compiler_facade';
import { Console } from './console';
import { ENVIRONMENT_INITIALIZER, inject, makeEnvironmentProviders } from './di';
import { Injectable } from './di/injectable';
import { InjectionToken } from './di/injection_token';
import { Injector } from './di/injector';
import { EnvironmentInjector } from './di/r3_injector';
import { INJECTOR_SCOPE } from './di/scope';
import { ErrorHandler } from './error_handler';
import { formatRuntimeError, RuntimeError } from './errors';
import { DEFAULT_LOCALE_ID } from './i18n/localization';
import { LOCALE_ID } from './i18n/tokens';
import { InitialRenderPendingTasks } from './initial_render_pending_tasks';
import { COMPILER_OPTIONS } from './linker/compiler';
import { ComponentFactory } from './linker/component_factory';
import { ComponentFactoryResolver } from './linker/component_factory_resolver';
import { NgModuleRef } from './linker/ng_module_factory';
import { isComponentResourceResolutionQueueEmpty, resolveComponentResources } from './metadata/resource_loading';
import { assertNgModuleType } from './render3/assert';
import { isStandalone } from './render3/definition';
import { assertStandaloneComponentType } from './render3/errors';
import { setLocaleId } from './render3/i18n/i18n_locale_id';
import { setJitOptions } from './render3/jit/jit_options';
import { createNgModuleRefWithProviders, EnvironmentNgModuleRefAdapter, NgModuleFactory as R3NgModuleFactory } from './render3/ng_module_ref';
import { publishDefaultGlobalUtils as _publishDefaultGlobalUtils } from './render3/util/global_utils';
import { setThrowInvalidWriteToSignalError } from './signals';
import { TESTABILITY } from './testability/testability';
import { isPromise } from './util/lang';
import { stringify } from './util/stringify';
import { isStableFactory, NgZone, NoopNgZone, ZONE_IS_STABLE_OBSERVABLE } from './zone/ng_zone';
import * as i0 from "./r3_symbols";
import * as i1 from "./di/injector";
let _platformInjector = null;
/**
 * Internal token to indicate whether having multiple bootstrapped platform should be allowed (only
 * one bootstrapped platform is allowed by default). This token helps to support SSR scenarios.
 */
export const ALLOW_MULTIPLE_PLATFORMS = new InjectionToken('AllowMultipleToken');
/**
 * Internal token that allows to register extra callbacks that should be invoked during the
 * `PlatformRef.destroy` operation. This token is needed to avoid a direct reference to the
 * `PlatformRef` class (i.e. register the callback via `PlatformRef.onDestroy`), thus making the
 * entire class tree-shakeable.
 */
const PLATFORM_DESTROY_LISTENERS = new InjectionToken('PlatformDestroyListeners');
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
export const APP_BOOTSTRAP_LISTENER = new InjectionToken('appBootstrapListener');
export function compileNgModuleFactory(injector, options, moduleType) {
    ngDevMode && assertNgModuleType(moduleType);
    const moduleFactory = new R3NgModuleFactory(moduleType);
    // All of the logic below is irrelevant for AOT-compiled code.
    if (typeof ngJitMode !== 'undefined' && !ngJitMode) {
        return Promise.resolve(moduleFactory);
    }
    const compilerOptions = injector.get(COMPILER_OPTIONS, []).concat(options);
    // Configure the compiler to use the provided options. This call may fail when multiple modules
    // are bootstrapped with incompatible options, as a component can only be compiled according to
    // a single set of options.
    setJitOptions({
        defaultEncapsulation: _lastDefined(compilerOptions.map(opts => opts.defaultEncapsulation)),
        preserveWhitespaces: _lastDefined(compilerOptions.map(opts => opts.preserveWhitespaces)),
    });
    if (isComponentResourceResolutionQueueEmpty()) {
        return Promise.resolve(moduleFactory);
    }
    const compilerProviders = compilerOptions.flatMap((option) => option.providers ?? []);
    // In case there are no compiler providers, we just return the module factory as
    // there won't be any resource loader. This can happen with Ivy, because AOT compiled
    // modules can be still passed through "bootstrapModule". In that case we shouldn't
    // unnecessarily require the JIT compiler.
    if (compilerProviders.length === 0) {
        return Promise.resolve(moduleFactory);
    }
    const compiler = getCompilerFacade({
        usage: 0 /* JitCompilerUsage.Decorator */,
        kind: 'NgModule',
        type: moduleType,
    });
    const compilerInjector = Injector.create({ providers: compilerProviders });
    const resourceLoader = compilerInjector.get(compiler.ResourceLoader);
    // The resource loader can also return a string while the "resolveComponentResources"
    // always expects a promise. Therefore we need to wrap the returned value in a promise.
    return resolveComponentResources(url => Promise.resolve(resourceLoader.get(url)))
        .then(() => moduleFactory);
}
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
 * @publicApi
 */
export class NgProbeToken {
    constructor(name, token) {
        this.name = name;
        this.token = token;
    }
}
/**
 * Creates a platform.
 * Platforms must be created on launch using this function.
 *
 * @publicApi
 */
export function createPlatform(injector) {
    if (_platformInjector && !_platformInjector.get(ALLOW_MULTIPLE_PLATFORMS, false)) {
        throw new RuntimeError(400 /* RuntimeErrorCode.MULTIPLE_PLATFORMS */, ngDevMode &&
            'There can be only one platform. Destroy the previous one to create a new one.');
    }
    publishDefaultGlobalUtils();
    publishSignalConfiguration();
    _platformInjector = injector;
    const platform = injector.get(PlatformRef);
    runPlatformInitializers(injector);
    return platform;
}
/**
 * The goal of this function is to bootstrap a platform injector,
 * but avoid referencing `PlatformRef` class.
 * This function is needed for bootstrapping a Standalone Component.
 */
function createOrReusePlatformInjector(providers = []) {
    // If a platform injector already exists, it means that the platform
    // is already bootstrapped and no additional actions are required.
    if (_platformInjector)
        return _platformInjector;
    // Otherwise, setup a new platform injector and run platform initializers.
    const injector = createPlatformInjector(providers);
    _platformInjector = injector;
    publishDefaultGlobalUtils();
    publishSignalConfiguration();
    runPlatformInitializers(injector);
    return injector;
}
function runPlatformInitializers(injector) {
    const inits = injector.get(PLATFORM_INITIALIZER, null);
    inits?.forEach((init) => init());
}
/**
 * Internal create application API that implements the core application creation logic and optional
 * bootstrap logic.
 *
 * Platforms (such as `platform-browser`) may require different set of application and platform
 * providers for an application to function correctly. As a result, platforms may use this function
 * internally and supply the necessary providers during the bootstrap, while exposing
 * platform-specific APIs as a part of their public API.
 *
 * @returns A promise that returns an `ApplicationRef` instance once resolved.
 */
export function internalCreateApplication(config) {
    try {
        const { rootComponent, appProviders, platformProviders } = config;
        if ((typeof ngDevMode === 'undefined' || ngDevMode) && rootComponent !== undefined) {
            assertStandaloneComponentType(rootComponent);
        }
        const platformInjector = createOrReusePlatformInjector(platformProviders);
        // Create root application injector based on a set of providers configured at the platform
        // bootstrap level as well as providers passed to the bootstrap call by a user.
        const allAppProviders = [
            provideZoneChangeDetection(),
            ...(appProviders || []),
        ];
        const adapter = new EnvironmentNgModuleRefAdapter({
            providers: allAppProviders,
            parent: platformInjector,
            debugName: (typeof ngDevMode === 'undefined' || ngDevMode) ? 'Environment Injector' : '',
            // We skip environment initializers because we need to run them inside the NgZone, which
            // happens after we get the NgZone instance from the Injector.
            runEnvironmentInitializers: false,
        });
        const envInjector = adapter.injector;
        const ngZone = envInjector.get(NgZone);
        return ngZone.run(() => {
            envInjector.resolveInjectorInitializers();
            const exceptionHandler = envInjector.get(ErrorHandler, null);
            if ((typeof ngDevMode === 'undefined' || ngDevMode) && !exceptionHandler) {
                throw new RuntimeError(402 /* RuntimeErrorCode.MISSING_REQUIRED_INJECTABLE_IN_BOOTSTRAP */, 'No `ErrorHandler` found in the Dependency Injection tree.');
            }
            let onErrorSubscription;
            ngZone.runOutsideAngular(() => {
                onErrorSubscription = ngZone.onError.subscribe({
                    next: (error) => {
                        exceptionHandler.handleError(error);
                    }
                });
            });
            // If the whole platform is destroyed, invoke the `destroy` method
            // for all bootstrapped applications as well.
            const destroyListener = () => envInjector.destroy();
            const onPlatformDestroyListeners = platformInjector.get(PLATFORM_DESTROY_LISTENERS);
            onPlatformDestroyListeners.add(destroyListener);
            envInjector.onDestroy(() => {
                onErrorSubscription.unsubscribe();
                onPlatformDestroyListeners.delete(destroyListener);
            });
            return _callAndReportToErrorHandler(exceptionHandler, ngZone, () => {
                const initStatus = envInjector.get(ApplicationInitStatus);
                initStatus.runInitializers();
                return initStatus.donePromise.then(() => {
                    const localeId = envInjector.get(LOCALE_ID, DEFAULT_LOCALE_ID);
                    setLocaleId(localeId || DEFAULT_LOCALE_ID);
                    const appRef = envInjector.get(ApplicationRef);
                    if (rootComponent !== undefined) {
                        appRef.bootstrap(rootComponent);
                    }
                    return appRef;
                });
            });
        });
    }
    catch (e) {
        return Promise.reject(e);
    }
}
/**
 * Creates a factory for a platform. Can be used to provide or override `Providers` specific to
 * your application's runtime needs, such as `PLATFORM_INITIALIZER` and `PLATFORM_ID`.
 * @param parentPlatformFactory Another platform factory to modify. Allows you to compose factories
 * to build up configurations that might be required by different libraries or parts of the
 * application.
 * @param name Identifies the new platform factory.
 * @param providers A set of dependency providers for platforms created with the new factory.
 *
 * @publicApi
 */
export function createPlatformFactory(parentPlatformFactory, name, providers = []) {
    const desc = `Platform: ${name}`;
    const marker = new InjectionToken(desc);
    return (extraProviders = []) => {
        let platform = getPlatform();
        if (!platform || platform.injector.get(ALLOW_MULTIPLE_PLATFORMS, false)) {
            const platformProviders = [
                ...providers,
                ...extraProviders,
                { provide: marker, useValue: true }
            ];
            if (parentPlatformFactory) {
                parentPlatformFactory(platformProviders);
            }
            else {
                createPlatform(createPlatformInjector(platformProviders, desc));
            }
        }
        return assertPlatform(marker);
    };
}
/**
 * Checks that there is currently a platform that contains the given token as a provider.
 *
 * @publicApi
 */
export function assertPlatform(requiredToken) {
    const platform = getPlatform();
    if (!platform) {
        throw new RuntimeError(401 /* RuntimeErrorCode.PLATFORM_NOT_FOUND */, ngDevMode && 'No platform exists!');
    }
    if ((typeof ngDevMode === 'undefined' || ngDevMode) &&
        !platform.injector.get(requiredToken, null)) {
        throw new RuntimeError(400 /* RuntimeErrorCode.MULTIPLE_PLATFORMS */, 'A platform with a different configuration has been created. Please destroy it first.');
    }
    return platform;
}
/**
 * Helper function to create an instance of a platform injector (that maintains the 'platform'
 * scope).
 */
export function createPlatformInjector(providers = [], name) {
    return Injector.create({
        name,
        providers: [
            { provide: INJECTOR_SCOPE, useValue: 'platform' },
            { provide: PLATFORM_DESTROY_LISTENERS, useValue: new Set([() => _platformInjector = null]) },
            ...providers
        ],
    });
}
/**
 * Destroys the current Angular platform and all Angular applications on the page.
 * Destroys all modules and listeners registered with the platform.
 *
 * @publicApi
 */
export function destroyPlatform() {
    getPlatform()?.destroy();
}
/**
 * Returns the current platform.
 *
 * @publicApi
 */
export function getPlatform() {
    return _platformInjector?.get(PlatformRef) ?? null;
}
/**
 * The Angular platform is the entry point for Angular on a web page.
 * Each page has exactly one platform. Services (such as reflection) which are common
 * to every Angular application running on the page are bound in its scope.
 * A page's platform is initialized implicitly when a platform is created using a platform
 * factory such as `PlatformBrowser`, or explicitly by calling the `createPlatform()` function.
 *
 * @publicApi
 */
class PlatformRef {
    /** @internal */
    constructor(_injector) {
        this._injector = _injector;
        this._modules = [];
        this._destroyListeners = [];
        this._destroyed = false;
    }
    /**
     * Creates an instance of an `@NgModule` for the given platform.
     *
     * @deprecated Passing NgModule factories as the `PlatformRef.bootstrapModuleFactory` function
     *     argument is deprecated. Use the `PlatformRef.bootstrapModule` API instead.
     */
    bootstrapModuleFactory(moduleFactory, options) {
        // Note: We need to create the NgZone _before_ we instantiate the module,
        // as instantiating the module creates some providers eagerly.
        // So we create a mini parent injector that just contains the new NgZone and
        // pass that as parent to the NgModuleFactory.
        const ngZone = getNgZone(options?.ngZone, getNgZoneOptions({
            eventCoalescing: options?.ngZoneEventCoalescing,
            runCoalescing: options?.ngZoneRunCoalescing
        }));
        // Note: Create ngZoneInjector within ngZone.run so that all of the instantiated services are
        // created within the Angular zone
        // Do not try to replace ngZone.run with ApplicationRef#run because ApplicationRef would then be
        // created outside of the Angular zone.
        return ngZone.run(() => {
            const moduleRef = createNgModuleRefWithProviders(moduleFactory.moduleType, this.injector, internalProvideZoneChangeDetection(() => ngZone));
            if ((typeof ngDevMode === 'undefined' || ngDevMode) &&
                moduleRef.injector.get(PROVIDED_NG_ZONE, null) !== null) {
                throw new RuntimeError(207 /* RuntimeErrorCode.PROVIDER_IN_WRONG_CONTEXT */, '`bootstrapModule` does not support `provideZoneChangeDetection`. Use `BootstrapOptions` instead.');
            }
            const exceptionHandler = moduleRef.injector.get(ErrorHandler, null);
            if ((typeof ngDevMode === 'undefined' || ngDevMode) && exceptionHandler === null) {
                throw new RuntimeError(402 /* RuntimeErrorCode.MISSING_REQUIRED_INJECTABLE_IN_BOOTSTRAP */, 'No ErrorHandler. Is platform module (BrowserModule) included?');
            }
            ngZone.runOutsideAngular(() => {
                const subscription = ngZone.onError.subscribe({
                    next: (error) => {
                        exceptionHandler.handleError(error);
                    }
                });
                moduleRef.onDestroy(() => {
                    remove(this._modules, moduleRef);
                    subscription.unsubscribe();
                });
            });
            return _callAndReportToErrorHandler(exceptionHandler, ngZone, () => {
                const initStatus = moduleRef.injector.get(ApplicationInitStatus);
                initStatus.runInitializers();
                return initStatus.donePromise.then(() => {
                    // If the `LOCALE_ID` provider is defined at bootstrap then we set the value for ivy
                    const localeId = moduleRef.injector.get(LOCALE_ID, DEFAULT_LOCALE_ID);
                    setLocaleId(localeId || DEFAULT_LOCALE_ID);
                    this._moduleDoBootstrap(moduleRef);
                    return moduleRef;
                });
            });
        });
    }
    /**
     * Creates an instance of an `@NgModule` for a given platform.
     *
     * @usageNotes
     * ### Simple Example
     *
     * ```typescript
     * @NgModule({
     *   imports: [BrowserModule]
     * })
     * class MyModule {}
     *
     * let moduleRef = platformBrowser().bootstrapModule(MyModule);
     * ```
     *
     */
    bootstrapModule(moduleType, compilerOptions = []) {
        const options = optionsReducer({}, compilerOptions);
        return compileNgModuleFactory(this.injector, options, moduleType)
            .then(moduleFactory => this.bootstrapModuleFactory(moduleFactory, options));
    }
    _moduleDoBootstrap(moduleRef) {
        const appRef = moduleRef.injector.get(ApplicationRef);
        if (moduleRef._bootstrapComponents.length > 0) {
            moduleRef._bootstrapComponents.forEach(f => appRef.bootstrap(f));
        }
        else if (moduleRef.instance.ngDoBootstrap) {
            moduleRef.instance.ngDoBootstrap(appRef);
        }
        else {
            throw new RuntimeError(-403 /* RuntimeErrorCode.BOOTSTRAP_COMPONENTS_NOT_FOUND */, ngDevMode &&
                `The module ${stringify(moduleRef.instance.constructor)} was bootstrapped, ` +
                    `but it does not declare "@NgModule.bootstrap" components nor a "ngDoBootstrap" method. ` +
                    `Please define one of these.`);
        }
        this._modules.push(moduleRef);
    }
    /**
     * Registers a listener to be called when the platform is destroyed.
     */
    onDestroy(callback) {
        this._destroyListeners.push(callback);
    }
    /**
     * Retrieves the platform {@link Injector}, which is the parent injector for
     * every Angular application on the page and provides singleton providers.
     */
    get injector() {
        return this._injector;
    }
    /**
     * Destroys the current Angular platform and all Angular applications on the page.
     * Destroys all modules and listeners registered with the platform.
     */
    destroy() {
        if (this._destroyed) {
            throw new RuntimeError(404 /* RuntimeErrorCode.PLATFORM_ALREADY_DESTROYED */, ngDevMode && 'The platform has already been destroyed!');
        }
        this._modules.slice().forEach(module => module.destroy());
        this._destroyListeners.forEach(listener => listener());
        const destroyListeners = this._injector.get(PLATFORM_DESTROY_LISTENERS, null);
        if (destroyListeners) {
            destroyListeners.forEach(listener => listener());
            destroyListeners.clear();
        }
        this._destroyed = true;
    }
    /**
     * Indicates whether this instance was destroyed.
     */
    get destroyed() {
        return this._destroyed;
    }
    static { this.ɵfac = function PlatformRef_Factory(t) { return new (t || PlatformRef)(i0.ɵɵinject(i1.Injector)); }; }
    static { this.ɵprov = /*@__PURE__*/ i0.ɵɵdefineInjectable({ token: PlatformRef, factory: PlatformRef.ɵfac, providedIn: 'platform' }); }
}
export { PlatformRef };
(function () { (typeof ngDevMode === "undefined" || ngDevMode) && i0.setClassMetadata(PlatformRef, [{
        type: Injectable,
        args: [{ providedIn: 'platform' }]
    }], function () { return [{ type: i1.Injector }]; }, null); })();
// Transforms a set of `BootstrapOptions` (supported by the NgModule-based bootstrap APIs) ->
// `NgZoneOptions` that are recognized by the NgZone constructor. Passing no options will result in
// a set of default options returned.
function getNgZoneOptions(options) {
    return {
        enableLongStackTrace: typeof ngDevMode === 'undefined' ? false : !!ngDevMode,
        shouldCoalesceEventChangeDetection: options?.eventCoalescing ?? false,
        shouldCoalesceRunChangeDetection: options?.runCoalescing ?? false,
    };
}
function getNgZone(ngZoneToUse = 'zone.js', options) {
    if (ngZoneToUse === 'noop') {
        return new NoopNgZone();
    }
    if (ngZoneToUse === 'zone.js') {
        return new NgZone(options);
    }
    return ngZoneToUse;
}
function _callAndReportToErrorHandler(errorHandler, ngZone, callback) {
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
function optionsReducer(dst, objs) {
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
class ApplicationRef {
    constructor() {
        /** @internal */
        this._bootstrapListeners = [];
        this._runningTick = false;
        this._destroyed = false;
        this._destroyListeners = [];
        /** @internal */
        this._views = [];
        this.internalErrorHandler = inject(INTERNAL_APPLICATION_ERROR_HANDLER);
        this.zoneIsStable = inject(ZONE_IS_STABLE_OBSERVABLE);
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
        this.isStable = inject(InitialRenderPendingTasks)
            .hasPendingTasks.pipe(mergeMap(hasPendingTasks => hasPendingTasks ? of(false) : this.zoneIsStable), distinctUntilChanged(), share());
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
            const errorMessage = 'Cannot bootstrap as there are still asynchronous initializers running.' +
                (standalone ? '' :
                    ' Bootstrap components in the `ngDoBootstrap` method of the root module.');
            throw new RuntimeError(405 /* RuntimeErrorCode.ASYNC_INITIALIZERS_STILL_RUNNING */, (typeof ngDevMode === 'undefined' || ngDevMode) && errorMessage);
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
            for (let view of this._views) {
                view.detectChanges();
            }
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
        listeners.push(...this._bootstrapListeners);
        listeners.forEach((listener) => listener(componentRef));
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
export { ApplicationRef };
(function () { (typeof ngDevMode === "undefined" || ngDevMode) && i0.setClassMetadata(ApplicationRef, [{
        type: Injectable,
        args: [{ providedIn: 'root' }]
    }], null, null); })();
function remove(list, el) {
    const index = list.indexOf(el);
    if (index > -1) {
        list.splice(index, 1);
    }
}
function _lastDefined(args) {
    for (let i = args.length - 1; i >= 0; i--) {
        if (args[i] !== undefined) {
            return args[i];
        }
    }
    return undefined;
}
/**
 * `InjectionToken` used to configure how to call the `ErrorHandler`.
 *
 * `NgZone` is provided by default today so the default (and only) implementation for this
 * is calling `ErrorHandler.handleError` outside of the Angular zone.
 */
const INTERNAL_APPLICATION_ERROR_HANDLER = new InjectionToken((typeof ngDevMode === 'undefined' || ngDevMode) ? 'internal error handler' : '', {
    providedIn: 'root',
    factory: () => {
        const userErrorHandler = inject(ErrorHandler);
        return userErrorHandler.handleError.bind(this);
    }
});
function ngZoneApplicationErrorHandlerFactory() {
    const zone = inject(NgZone);
    const userErrorHandler = inject(ErrorHandler);
    return (e) => zone.runOutsideAngular(() => userErrorHandler.handleError(e));
}
class NgZoneChangeDetectionScheduler {
    constructor() {
        this.zone = inject(NgZone);
        this.applicationRef = inject(ApplicationRef);
    }
    initialize() {
        if (this._onMicrotaskEmptySubscription) {
            return;
        }
        this._onMicrotaskEmptySubscription = this.zone.onMicrotaskEmpty.subscribe({
            next: () => {
                this.zone.run(() => {
                    this.applicationRef.tick();
                });
            }
        });
    }
    ngOnDestroy() {
        this._onMicrotaskEmptySubscription?.unsubscribe();
    }
    static { this.ɵfac = function NgZoneChangeDetectionScheduler_Factory(t) { return new (t || NgZoneChangeDetectionScheduler)(); }; }
    static { this.ɵprov = /*@__PURE__*/ i0.ɵɵdefineInjectable({ token: NgZoneChangeDetectionScheduler, factory: NgZoneChangeDetectionScheduler.ɵfac, providedIn: 'root' }); }
}
export { NgZoneChangeDetectionScheduler };
(function () { (typeof ngDevMode === "undefined" || ngDevMode) && i0.setClassMetadata(NgZoneChangeDetectionScheduler, [{
        type: Injectable,
        args: [{ providedIn: 'root' }]
    }], null, null); })();
/**
 * Internal token used to verify that `provideZoneChangeDetection` is not used
 * with the bootstrapModule API.
 */
const PROVIDED_NG_ZONE = new InjectionToken((typeof ngDevMode === 'undefined' || ngDevMode) ? 'provideZoneChangeDetection token' : '');
export function internalProvideZoneChangeDetection(ngZoneFactory) {
    return [
        { provide: NgZone, useFactory: ngZoneFactory },
        {
            provide: ENVIRONMENT_INITIALIZER,
            multi: true,
            useFactory: () => {
                const ngZoneChangeDetectionScheduler = inject(NgZoneChangeDetectionScheduler, { optional: true });
                if ((typeof ngDevMode === 'undefined' || ngDevMode) &&
                    ngZoneChangeDetectionScheduler === null) {
                    throw new RuntimeError(402 /* RuntimeErrorCode.MISSING_REQUIRED_INJECTABLE_IN_BOOTSTRAP */, `A required Injectable was not found in the dependency injection tree. ` +
                        'If you are bootstrapping an NgModule, make sure that the `BrowserModule` is imported.');
                }
                return () => ngZoneChangeDetectionScheduler.initialize();
            },
        },
        { provide: INTERNAL_APPLICATION_ERROR_HANDLER, useFactory: ngZoneApplicationErrorHandlerFactory },
        { provide: ZONE_IS_STABLE_OBSERVABLE, useFactory: isStableFactory },
    ];
}
/**
 * Provides `NgZone`-based change detection for the application bootstrapped using
 * `bootstrapApplication`.
 *
 * `NgZone` is already provided in applications by default. This provider allows you to configure
 * options like `eventCoalescing` in the `NgZone`.
 * This provider is not available for `platformBrowser().bootstrapModule`, which uses
 * `BootstrapOptions` instead.
 *
 * @usageNotes
 * ```typescript=
 * bootstrapApplication(MyApp, {providers: [
 *   provideZoneChangeDetection({eventCoalescing: true}),
 * ]});
 * ```
 *
 * @publicApi
 * @see bootstrapApplication
 * @see NgZoneOptions
 */
export function provideZoneChangeDetection(options) {
    const zoneProviders = internalProvideZoneChangeDetection(() => new NgZone(getNgZoneOptions(options)));
    return makeEnvironmentProviders([
        (typeof ngDevMode === 'undefined' || ngDevMode) ? { provide: PROVIDED_NG_ZONE, useValue: true } :
            [],
        zoneProviders,
    ]);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwbGljYXRpb25fcmVmLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvYXBwbGljYXRpb25fcmVmLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sb0JBQW9CLENBQUM7QUFFNUIsT0FBTyxFQUFhLEVBQUUsRUFBZSxNQUFNLE1BQU0sQ0FBQztBQUNsRCxPQUFPLEVBQUMsb0JBQW9CLEVBQUUsUUFBUSxFQUFFLEtBQUssRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBRXJFLE9BQU8sRUFBQyxxQkFBcUIsRUFBQyxNQUFNLG9CQUFvQixDQUFDO0FBQ3pELE9BQU8sRUFBQyxvQkFBb0IsRUFBQyxNQUFNLHNCQUFzQixDQUFDO0FBQzFELE9BQU8sRUFBQyxpQkFBaUIsRUFBbUIsTUFBTSw0QkFBNEIsQ0FBQztBQUMvRSxPQUFPLEVBQUMsT0FBTyxFQUFDLE1BQU0sV0FBVyxDQUFDO0FBQ2xDLE9BQU8sRUFBQyx1QkFBdUIsRUFBRSxNQUFNLEVBQUUsd0JBQXdCLEVBQUMsTUFBTSxNQUFNLENBQUM7QUFDL0UsT0FBTyxFQUFDLFVBQVUsRUFBQyxNQUFNLGlCQUFpQixDQUFDO0FBQzNDLE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSxzQkFBc0IsQ0FBQztBQUNwRCxPQUFPLEVBQUMsUUFBUSxFQUFDLE1BQU0sZUFBZSxDQUFDO0FBRXZDLE9BQU8sRUFBQyxtQkFBbUIsRUFBQyxNQUFNLGtCQUFrQixDQUFDO0FBQ3JELE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSxZQUFZLENBQUM7QUFDMUMsT0FBTyxFQUFDLFlBQVksRUFBQyxNQUFNLGlCQUFpQixDQUFDO0FBQzdDLE9BQU8sRUFBQyxrQkFBa0IsRUFBRSxZQUFZLEVBQW1CLE1BQU0sVUFBVSxDQUFDO0FBQzVFLE9BQU8sRUFBQyxpQkFBaUIsRUFBQyxNQUFNLHFCQUFxQixDQUFDO0FBQ3RELE9BQU8s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Q29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCAnLi91dGlsL25nX2ppdF9tb2RlJztcblxuaW1wb3J0IHtPYnNlcnZhYmxlLCBvZiwgU3Vic2NyaXB0aW9ufSBmcm9tICdyeGpzJztcbmltcG9ydCB7ZGlzdGluY3RVbnRpbENoYW5nZWQsIG1lcmdlTWFwLCBzaGFyZX0gZnJvbSAncnhqcy9vcGVyYXRvcnMnO1xuXG5pbXBvcnQge0FwcGxpY2F0aW9uSW5pdFN0YXR1c30gZnJvbSAnLi9hcHBsaWNhdGlvbl9pbml0JztcbmltcG9ydCB7UExBVEZPUk1fSU5JVElBTElaRVJ9IGZyb20gJy4vYXBwbGljYXRpb25fdG9rZW5zJztcbmltcG9ydCB7Z2V0Q29tcGlsZXJGYWNhZGUsIEppdENvbXBpbGVyVXNhZ2V9IGZyb20gJy4vY29tcGlsZXIvY29tcGlsZXJfZmFjYWRlJztcbmltcG9ydCB7Q29uc29sZX0gZnJvbSAnLi9jb25zb2xlJztcbmltcG9ydCB7RU5WSVJPTk1FTlRfSU5JVElBTElaRVIsIGluamVjdCwgbWFrZUVudmlyb25tZW50UHJvdmlkZXJzfSBmcm9tICcuL2RpJztcbmltcG9ydCB7SW5qZWN0YWJsZX0gZnJvbSAnLi9kaS9pbmplY3RhYmxlJztcbmltcG9ydCB7SW5qZWN0aW9uVG9rZW59IGZyb20gJy4vZGkvaW5qZWN0aW9uX3Rva2VuJztcbmltcG9ydCB7SW5qZWN0b3J9IGZyb20gJy4vZGkvaW5qZWN0b3InO1xuaW1wb3J0IHtFbnZpcm9ubWVudFByb3ZpZGVycywgUHJvdmlkZXIsIFN0YXRpY1Byb3ZpZGVyfSBmcm9tICcuL2RpL2ludGVyZmFjZS9wcm92aWRlcic7XG5pbXBvcnQge0Vudmlyb25tZW50SW5qZWN0b3J9IGZyb20gJy4vZGkvcjNfaW5qZWN0b3InO1xuaW1wb3J0IHtJTkpFQ1RPUl9TQ09QRX0gZnJvbSAnLi9kaS9zY29wZSc7XG5pbXBvcnQge0Vycm9ySGFuZGxlcn0gZnJvbSAnLi9lcnJvcl9oYW5kbGVyJztcbmltcG9ydCB7Zm9ybWF0UnVudGltZUVycm9yLCBSdW50aW1lRXJyb3IsIFJ1bnRpbWVFcnJvckNvZGV9IGZyb20gJy4vZXJyb3JzJztcbmltcG9ydCB7REVGQVVMVF9MT0NBTEVfSUR9IGZyb20gJy4vaTE4bi9sb2NhbGl6YXRpb24nO1xuaW1wb3J0IHtMT0NBTEVfSUR9IGZyb20gJy4vaTE4bi90b2tlbnMnO1xuaW1wb3J0IHtJbml0aWFsUmVuZGVyUGVuZGluZ1Rhc2tzfSBmcm9tICcuL2luaXRpYWxfcmVuZGVyX3BlbmRpbmdfdGFza3MnO1xuaW1wb3J0IHtUeXBlfSBmcm9tICcuL2ludGVyZmFjZS90eXBlJztcbmltcG9ydCB7Q09NUElMRVJfT1BUSU9OUywgQ29tcGlsZXJPcHRpb25zfSBmcm9tICcuL2xpbmtlci9jb21waWxlcic7XG5pbXBvcnQge0NvbXBvbmVudEZhY3RvcnksIENvbXBvbmVudFJlZn0gZnJvbSAnLi9saW5rZXIvY29tcG9uZW50X2ZhY3RvcnknO1xuaW1wb3J0IHtDb21wb25lbnRGYWN0b3J5UmVzb2x2ZXJ9IGZyb20gJy4vbGlua2VyL2NvbXBvbmVudF9mYWN0b3J5X3Jlc29sdmVyJztcbmltcG9ydCB7SW50ZXJuYWxOZ01vZHVsZVJlZiwgTmdNb2R1bGVGYWN0b3J5LCBOZ01vZHVsZVJlZn0gZnJvbSAnLi9saW5rZXIvbmdfbW9kdWxlX2ZhY3RvcnknO1xuaW1wb3J0IHtJbnRlcm5hbFZpZXdSZWYsIFZpZXdSZWZ9IGZyb20gJy4vbGlua2VyL3ZpZXdfcmVmJztcbmltcG9ydCB7aXNDb21wb25lbnRSZXNvdXJjZVJlc29sdXRpb25RdWV1ZUVtcHR5LCByZXNvbHZlQ29tcG9uZW50UmVzb3VyY2VzfSBmcm9tICcuL21ldGFkYXRhL3Jlc291cmNlX2xvYWRpbmcnO1xuaW1wb3J0IHthc3NlcnROZ01vZHVsZVR5cGV9IGZyb20gJy4vcmVuZGVyMy9hc3NlcnQnO1xuaW1wb3J0IHtDb21wb25lbnRGYWN0b3J5IGFzIFIzQ29tcG9uZW50RmFjdG9yeX0gZnJvbSAnLi9yZW5kZXIzL2NvbXBvbmVudF9yZWYnO1xuaW1wb3J0IHtpc1N0YW5kYWxvbmV9IGZyb20gJy4vcmVuZGVyMy9kZWZpbml0aW9uJztcbmltcG9ydCB7YXNzZXJ0U3RhbmRhbG9uZUNvbXBvbmVudFR5cGV9IGZyb20gJy4vcmVuZGVyMy9lcnJvcnMnO1xuaW1wb3J0IHtzZXRMb2NhbGVJZH0gZnJvbSAnLi9yZW5kZXIzL2kxOG4vaTE4bl9sb2NhbGVfaWQnO1xuaW1wb3J0IHtzZXRKaXRPcHRpb25zfSBmcm9tICcuL3JlbmRlcjMvaml0L2ppdF9vcHRpb25zJztcbmltcG9ydCB7Y3JlYXRlTmdNb2R1bGVSZWZXaXRoUHJvdmlkZXJzLCBFbnZpcm9ubWVudE5nTW9kdWxlUmVmQWRhcHRlciwgTmdNb2R1bGVGYWN0b3J5IGFzIFIzTmdNb2R1bGVGYWN0b3J5fSBmcm9tICcuL3JlbmRlcjMvbmdfbW9kdWxlX3JlZic7XG5pbXBvcnQge3B1Ymxpc2hEZWZhdWx0R2xvYmFsVXRpbHMgYXMgX3B1Ymxpc2hEZWZhdWx0R2xvYmFsVXRpbHN9IGZyb20gJy4vcmVuZGVyMy91dGlsL2dsb2JhbF91dGlscyc7XG5pbXBvcnQge3NldFRocm93SW52YWxpZFdyaXRlVG9TaWduYWxFcnJvcn0gZnJvbSAnLi9zaWduYWxzJztcbmltcG9ydCB7VEVTVEFCSUxJVFl9IGZyb20gJy4vdGVzdGFiaWxpdHkvdGVzdGFiaWxpdHknO1xuaW1wb3J0IHtpc1Byb21pc2V9IGZyb20gJy4vdXRpbC9sYW5nJztcbmltcG9ydCB7c3RyaW5naWZ5fSBmcm9tICcuL3V0aWwvc3RyaW5naWZ5JztcbmltcG9ydCB7aXNTdGFibGVGYWN0b3J5LCBOZ1pvbmUsIE5vb3BOZ1pvbmUsIFpPTkVfSVNfU1RBQkxFX09CU0VSVkFCTEV9IGZyb20gJy4vem9uZS9uZ196b25lJztcblxubGV0IF9wbGF0Zm9ybUluamVjdG9yOiBJbmplY3RvcnxudWxsID0gbnVsbDtcblxuLyoqXG4gKiBJbnRlcm5hbCB0b2tlbiB0byBpbmRpY2F0ZSB3aGV0aGVyIGhhdmluZyBtdWx0aXBsZSBib290c3RyYXBwZWQgcGxhdGZvcm0gc2hvdWxkIGJlIGFsbG93ZWQgKG9ubHlcbiAqIG9uZSBib290c3RyYXBwZWQgcGxhdGZvcm0gaXMgYWxsb3dlZCBieSBkZWZhdWx0KS4gVGhpcyB0b2tlbiBoZWxwcyB0byBzdXBwb3J0IFNTUiBzY2VuYXJpb3MuXG4gKi9cbmV4cG9ydCBjb25zdCBBTExPV19NVUxUSVBMRV9QTEFURk9STVMgPSBuZXcgSW5qZWN0aW9uVG9rZW48Ym9vbGVhbj4oJ0FsbG93TXVsdGlwbGVUb2tlbicpO1xuXG4vKipcbiAqIEludGVybmFsIHRva2VuIHRoYXQgYWxsb3dzIHRvIHJlZ2lzdGVyIGV4dHJhIGNhbGxiYWNrcyB0aGF0IHNob3VsZCBiZSBpbnZva2VkIGR1cmluZyB0aGVcbiAqIGBQbGF0Zm9ybVJlZi5kZXN0cm95YCBvcGVyYXRpb24uIFRoaXMgdG9rZW4gaXMgbmVlZGVkIHRvIGF2b2lkIGEgZGlyZWN0IHJlZmVyZW5jZSB0byB0aGVcbiAqIGBQbGF0Zm9ybVJlZmAgY2xhc3MgKGkuZS4gcmVnaXN0ZXIgdGhlIGNhbGxiYWNrIHZpYSBgUGxhdGZvcm1SZWYub25EZXN0cm95YCksIHRodXMgbWFraW5nIHRoZVxuICogZW50aXJlIGNsYXNzIHRyZWUtc2hha2VhYmxlLlxuICovXG5jb25zdCBQTEFURk9STV9ERVNUUk9ZX0xJU1RFTkVSUyA9XG4gICAgbmV3IEluamVjdGlvblRva2VuPFNldDxWb2lkRnVuY3Rpb24+PignUGxhdGZvcm1EZXN0cm95TGlzdGVuZXJzJyk7XG5cbi8qKlxuICogQSBbREkgdG9rZW5dKGd1aWRlL2dsb3NzYXJ5I2RpLXRva2VuIFwiREkgdG9rZW4gZGVmaW5pdGlvblwiKSB0aGF0IHByb3ZpZGVzIGEgc2V0IG9mIGNhbGxiYWNrcyB0b1xuICogYmUgY2FsbGVkIGZvciBldmVyeSBjb21wb25lbnQgdGhhdCBpcyBib290c3RyYXBwZWQuXG4gKlxuICogRWFjaCBjYWxsYmFjayBtdXN0IHRha2UgYSBgQ29tcG9uZW50UmVmYCBpbnN0YW5jZSBhbmQgcmV0dXJuIG5vdGhpbmcuXG4gKlxuICogYChjb21wb25lbnRSZWY6IENvbXBvbmVudFJlZikgPT4gdm9pZGBcbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBjb25zdCBBUFBfQk9PVFNUUkFQX0xJU1RFTkVSID1cbiAgICBuZXcgSW5qZWN0aW9uVG9rZW48QXJyYXk8KGNvbXBSZWY6IENvbXBvbmVudFJlZjxhbnk+KSA9PiB2b2lkPj4oJ2FwcEJvb3RzdHJhcExpc3RlbmVyJyk7XG5cbmV4cG9ydCBmdW5jdGlvbiBjb21waWxlTmdNb2R1bGVGYWN0b3J5PE0+KFxuICAgIGluamVjdG9yOiBJbmplY3Rvciwgb3B0aW9uczogQ29tcGlsZXJPcHRpb25zLFxuICAgIG1vZHVsZVR5cGU6IFR5cGU8TT4pOiBQcm9taXNlPE5nTW9kdWxlRmFjdG9yeTxNPj4ge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0TmdNb2R1bGVUeXBlKG1vZHVsZVR5cGUpO1xuXG4gIGNvbnN0IG1vZHVsZUZhY3RvcnkgPSBuZXcgUjNOZ01vZHVsZUZhY3RvcnkobW9kdWxlVHlwZSk7XG5cbiAgLy8gQWxsIG9mIHRoZSBsb2dpYyBiZWxvdyBpcyBpcnJlbGV2YW50IGZvciBBT1QtY29tcGlsZWQgY29kZS5cbiAgaWYgKHR5cGVvZiBuZ0ppdE1vZGUgIT09ICd1bmRlZmluZWQnICYmICFuZ0ppdE1vZGUpIHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKG1vZHVsZUZhY3RvcnkpO1xuICB9XG5cbiAgY29uc3QgY29tcGlsZXJPcHRpb25zID0gaW5qZWN0b3IuZ2V0KENPTVBJTEVSX09QVElPTlMsIFtdKS5jb25jYXQob3B0aW9ucyk7XG5cbiAgLy8gQ29uZmlndXJlIHRoZSBjb21waWxlciB0byB1c2UgdGhlIHByb3ZpZGVkIG9wdGlvbnMuIFRoaXMgY2FsbCBtYXkgZmFpbCB3aGVuIG11bHRpcGxlIG1vZHVsZXNcbiAgLy8gYXJlIGJvb3RzdHJhcHBlZCB3aXRoIGluY29tcGF0aWJsZSBvcHRpb25zLCBhcyBhIGNvbXBvbmVudCBjYW4gb25seSBiZSBjb21waWxlZCBhY2NvcmRpbmcgdG9cbiAgLy8gYSBzaW5nbGUgc2V0IG9mIG9wdGlvbnMuXG4gIHNldEppdE9wdGlvbnMoe1xuICAgIGRlZmF1bHRFbmNhcHN1bGF0aW9uOiBfbGFzdERlZmluZWQoY29tcGlsZXJPcHRpb25zLm1hcChvcHRzID0+IG9wdHMuZGVmYXVsdEVuY2Fwc3VsYXRpb24pKSxcbiAgICBwcmVzZXJ2ZVdoaXRlc3BhY2VzOiBfbGFzdERlZmluZWQoY29tcGlsZXJPcHRpb25zLm1hcChvcHRzID0+IG9wdHMucHJlc2VydmVXaGl0ZXNwYWNlcykpLFxuICB9KTtcblxuICBpZiAoaXNDb21wb25lbnRSZXNvdXJjZVJlc29sdXRpb25RdWV1ZUVtcHR5KCkpIHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKG1vZHVsZUZhY3RvcnkpO1xuICB9XG5cbiAgY29uc3QgY29tcGlsZXJQcm92aWRlcnMgPSBjb21waWxlck9wdGlvbnMuZmxhdE1hcCgob3B0aW9uKSA9PiBvcHRpb24ucHJvdmlkZXJzID8/IFtdKTtcblxuICAvLyBJbiBjYXNlIHRoZXJlIGFyZSBubyBjb21waWxlciBwcm92aWRlcnMsIHdlIGp1c3QgcmV0dXJuIHRoZSBtb2R1bGUgZmFjdG9yeSBhc1xuICAvLyB0aGVyZSB3b24ndCBiZSBhbnkgcmVzb3VyY2UgbG9hZGVyLiBUaGlzIGNhbiBoYXBwZW4gd2l0aCBJdnksIGJlY2F1c2UgQU9UIGNvbXBpbGVkXG4gIC8vIG1vZHVsZXMgY2FuIGJlIHN0aWxsIHBhc3NlZCB0aHJvdWdoIFwiYm9vdHN0cmFwTW9kdWxlXCIuIEluIHRoYXQgY2FzZSB3ZSBzaG91bGRuJ3RcbiAgLy8gdW5uZWNlc3NhcmlseSByZXF1aXJlIHRoZSBKSVQgY29tcGlsZXIuXG4gIGlmIChjb21waWxlclByb3ZpZGVycy5sZW5ndGggPT09IDApIHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKG1vZHVsZUZhY3RvcnkpO1xuICB9XG5cbiAgY29uc3QgY29tcGlsZXIgPSBnZXRDb21waWxlckZhY2FkZSh7XG4gICAgdXNhZ2U6IEppdENvbXBpbGVyVXNhZ2UuRGVjb3JhdG9yLFxuICAgIGtpbmQ6ICdOZ01vZHVsZScsXG4gICAgdHlwZTogbW9kdWxlVHlwZSxcbiAgfSk7XG4gIGNvbnN0IGNvbXBpbGVySW5qZWN0b3IgPSBJbmplY3Rvci5jcmVhdGUoe3Byb3ZpZGVyczogY29tcGlsZXJQcm92aWRlcnN9KTtcbiAgY29uc3QgcmVzb3VyY2VMb2FkZXIgPSBjb21waWxlckluamVjdG9yLmdldChjb21waWxlci5SZXNvdXJjZUxvYWRlcik7XG4gIC8vIFRoZSByZXNvdXJjZSBsb2FkZXIgY2FuIGFsc28gcmV0dXJuIGEgc3RyaW5nIHdoaWxlIHRoZSBcInJlc29sdmVDb21wb25lbnRSZXNvdXJjZXNcIlxuICAvLyBhbHdheXMgZXhwZWN0cyBhIHByb21pc2UuIFRoZXJlZm9yZSB3ZSBuZWVkIHRvIHdyYXAgdGhlIHJldHVybmVkIHZhbHVlIGluIGEgcHJvbWlzZS5cbiAgcmV0dXJuIHJlc29sdmVDb21wb25lbnRSZXNvdXJjZXModXJsID0+IFByb21pc2UucmVzb2x2ZShyZXNvdXJjZUxvYWRlci5nZXQodXJsKSkpXG4gICAgICAudGhlbigoKSA9PiBtb2R1bGVGYWN0b3J5KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHB1Ymxpc2hEZWZhdWx0R2xvYmFsVXRpbHMoKSB7XG4gIG5nRGV2TW9kZSAmJiBfcHVibGlzaERlZmF1bHRHbG9iYWxVdGlscygpO1xufVxuXG4vKipcbiAqIFNldHMgdGhlIGVycm9yIGZvciBhbiBpbnZhbGlkIHdyaXRlIHRvIGEgc2lnbmFsIHRvIGJlIGFuIEFuZ3VsYXIgYFJ1bnRpbWVFcnJvcmAuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwdWJsaXNoU2lnbmFsQ29uZmlndXJhdGlvbigpOiB2b2lkIHtcbiAgc2V0VGhyb3dJbnZhbGlkV3JpdGVUb1NpZ25hbEVycm9yKCgpID0+IHtcbiAgICB0aHJvdyBuZXcgUnVudGltZUVycm9yKFxuICAgICAgICBSdW50aW1lRXJyb3JDb2RlLlNJR05BTF9XUklURV9GUk9NX0lMTEVHQUxfQ09OVEVYVCxcbiAgICAgICAgbmdEZXZNb2RlICYmXG4gICAgICAgICAgICAnV3JpdGluZyB0byBzaWduYWxzIGlzIG5vdCBhbGxvd2VkIGluIGEgYGNvbXB1dGVkYCBvciBhbiBgZWZmZWN0YCBieSBkZWZhdWx0LiAnICtcbiAgICAgICAgICAgICAgICAnVXNlIGBhbGxvd1NpZ25hbFdyaXRlc2AgaW4gdGhlIGBDcmVhdGVFZmZlY3RPcHRpb25zYCB0byBlbmFibGUgdGhpcyBpbnNpZGUgZWZmZWN0cy4nKTtcbiAgfSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0JvdW5kVG9Nb2R1bGU8Qz4oY2Y6IENvbXBvbmVudEZhY3Rvcnk8Qz4pOiBib29sZWFuIHtcbiAgcmV0dXJuIChjZiBhcyBSM0NvbXBvbmVudEZhY3Rvcnk8Qz4pLmlzQm91bmRUb01vZHVsZTtcbn1cblxuLyoqXG4gKiBBIHRva2VuIGZvciB0aGlyZC1wYXJ0eSBjb21wb25lbnRzIHRoYXQgY2FuIHJlZ2lzdGVyIHRoZW1zZWx2ZXMgd2l0aCBOZ1Byb2JlLlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGNsYXNzIE5nUHJvYmVUb2tlbiB7XG4gIGNvbnN0cnVjdG9yKHB1YmxpYyBuYW1lOiBzdHJpbmcsIHB1YmxpYyB0b2tlbjogYW55KSB7fVxufVxuXG4vKipcbiAqIENyZWF0ZXMgYSBwbGF0Zm9ybS5cbiAqIFBsYXRmb3JtcyBtdXN0IGJlIGNyZWF0ZWQgb24gbGF1bmNoIHVzaW5nIHRoaXMgZnVuY3Rpb24uXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlUGxhdGZvcm0oaW5qZWN0b3I6IEluamVjdG9yKTogUGxhdGZvcm1SZWYge1xuICBpZiAoX3BsYXRmb3JtSW5qZWN0b3IgJiYgIV9wbGF0Zm9ybUluamVjdG9yLmdldChBTExPV19NVUxUSVBMRV9QTEFURk9STVMsIGZhbHNlKSkge1xuICAgIHRocm93IG5ldyBSdW50aW1lRXJyb3IoXG4gICAgICAgIFJ1bnRpbWVFcnJvckNvZGUuTVVMVElQTEVfUExBVEZPUk1TLFxuICAgICAgICBuZ0Rldk1vZGUgJiZcbiAgICAgICAgICAgICdUaGVyZSBjYW4gYmUgb25seSBvbmUgcGxhdGZvcm0uIERlc3Ryb3kgdGhlIHByZXZpb3VzIG9uZSB0byBjcmVhdGUgYSBuZXcgb25lLicpO1xuICB9XG4gIHB1Ymxpc2hEZWZhdWx0R2xvYmFsVXRpbHMoKTtcbiAgcHVibGlzaFNpZ25hbENvbmZpZ3VyYXRpb24oKTtcbiAgX3BsYXRmb3JtSW5qZWN0b3IgPSBpbmplY3RvcjtcbiAgY29uc3QgcGxhdGZvcm0gPSBpbmplY3Rvci5nZXQoUGxhdGZvcm1SZWYpO1xuICBydW5QbGF0Zm9ybUluaXRpYWxpemVycyhpbmplY3Rvcik7XG4gIHJldHVybiBwbGF0Zm9ybTtcbn1cblxuLyoqXG4gKiBUaGUgZ29hbCBvZiB0aGlzIGZ1bmN0aW9uIGlzIHRvIGJvb3RzdHJhcCBhIHBsYXRmb3JtIGluamVjdG9yLFxuICogYnV0IGF2b2lkIHJlZmVyZW5jaW5nIGBQbGF0Zm9ybVJlZmAgY2xhc3MuXG4gKiBUaGlzIGZ1bmN0aW9uIGlzIG5lZWRlZCBmb3IgYm9vdHN0cmFwcGluZyBhIFN0YW5kYWxvbmUgQ29tcG9uZW50LlxuICovXG5mdW5jdGlvbiBjcmVhdGVPclJldXNlUGxhdGZvcm1JbmplY3Rvcihwcm92aWRlcnM6IFN0YXRpY1Byb3ZpZGVyW10gPSBbXSk6IEluamVjdG9yIHtcbiAgLy8gSWYgYSBwbGF0Zm9ybSBpbmplY3RvciBhbHJlYWR5IGV4aXN0cywgaXQgbWVhbnMgdGhhdCB0aGUgcGxhdGZvcm1cbiAgLy8gaXMgYWxyZWFkeSBib290c3RyYXBwZWQgYW5kIG5vIGFkZGl0aW9uYWwgYWN0aW9ucyBhcmUgcmVxdWlyZWQuXG4gIGlmIChfcGxhdGZvcm1JbmplY3RvcikgcmV0dXJuIF9wbGF0Zm9ybUluamVjdG9yO1xuXG4gIC8vIE90aGVyd2lzZSwgc2V0dXAgYSBuZXcgcGxhdGZvcm0gaW5qZWN0b3IgYW5kIHJ1biBwbGF0Zm9ybSBpbml0aWFsaXplcnMuXG4gIGNvbnN0IGluamVjdG9yID0gY3JlYXRlUGxhdGZvcm1JbmplY3Rvcihwcm92aWRlcnMpO1xuICBfcGxhdGZvcm1JbmplY3RvciA9IGluamVjdG9yO1xuICBwdWJsaXNoRGVmYXVsdEdsb2JhbFV0aWxzKCk7XG4gIHB1Ymxpc2hTaWduYWxDb25maWd1cmF0aW9uKCk7XG4gIHJ1blBsYXRmb3JtSW5pdGlhbGl6ZXJzKGluamVjdG9yKTtcbiAgcmV0dXJuIGluamVjdG9yO1xufVxuXG5mdW5jdGlvbiBydW5QbGF0Zm9ybUluaXRpYWxpemVycyhpbmplY3RvcjogSW5qZWN0b3IpOiB2b2lkIHtcbiAgY29uc3QgaW5pdHMgPSBpbmplY3Rvci5nZXQoUExBVEZPUk1fSU5JVElBTElaRVIsIG51bGwpO1xuICBpbml0cz8uZm9yRWFjaCgoaW5pdCkgPT4gaW5pdCgpKTtcbn1cblxuLyoqXG4gKiBJbnRlcm5hbCBjcmVhdGUgYXBwbGljYXRpb24gQVBJIHRoYXQgaW1wbGVtZW50cyB0aGUgY29yZSBhcHBsaWNhdGlvbiBjcmVhdGlvbiBsb2dpYyBhbmQgb3B0aW9uYWxcbiAqIGJvb3RzdHJhcCBsb2dpYy5cbiAqXG4gKiBQbGF0Zm9ybXMgKHN1Y2ggYXMgYHBsYXRmb3JtLWJyb3dzZXJgKSBtYXkgcmVxdWlyZSBkaWZmZXJlbnQgc2V0IG9mIGFwcGxpY2F0aW9uIGFuZCBwbGF0Zm9ybVxuICogcHJvdmlkZXJzIGZvciBhbiBhcHBsaWNhdGlvbiB0byBmdW5jdGlvbiBjb3JyZWN0bHkuIEFzIGEgcmVzdWx0LCBwbGF0Zm9ybXMgbWF5IHVzZSB0aGlzIGZ1bmN0aW9uXG4gKiBpbnRlcm5hbGx5IGFuZCBzdXBwbHkgdGhlIG5lY2Vzc2FyeSBwcm92aWRlcnMgZHVyaW5nIHRoZSBib290c3RyYXAsIHdoaWxlIGV4cG9zaW5nXG4gKiBwbGF0Zm9ybS1zcGVjaWZpYyBBUElzIGFzIGEgcGFydCBvZiB0aGVpciBwdWJsaWMgQVBJLlxuICpcbiAqIEByZXR1cm5zIEEgcHJvbWlzZSB0aGF0IHJldHVybnMgYW4gYEFwcGxpY2F0aW9uUmVmYCBpbnN0YW5jZSBvbmNlIHJlc29sdmVkLlxuICovXG5leHBvcnQgZnVuY3Rpb24gaW50ZXJuYWxDcmVhdGVBcHBsaWNhdGlvbihjb25maWc6IHtcbiAgcm9vdENvbXBvbmVudD86IFR5cGU8dW5rbm93bj4sXG4gIGFwcFByb3ZpZGVycz86IEFycmF5PFByb3ZpZGVyfEVudmlyb25tZW50UHJvdmlkZXJzPixcbiAgcGxhdGZvcm1Qcm92aWRlcnM/OiBQcm92aWRlcltdLFxufSk6IFByb21pc2U8QXBwbGljYXRpb25SZWY+IHtcbiAgdHJ5IHtcbiAgICBjb25zdCB7cm9vdENvbXBvbmVudCwgYXBwUHJvdmlkZXJzLCBwbGF0Zm9ybVByb3ZpZGVyc30gPSBjb25maWc7XG5cbiAgICBpZiAoKHR5cGVvZiBuZ0Rldk1vZGUgPT09ICd1bmRlZmluZWQnIHx8IG5nRGV2TW9kZSkgJiYgcm9vdENvbXBvbmVudCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBhc3NlcnRTdGFuZGFsb25lQ29tcG9uZW50VHlwZShyb290Q29tcG9uZW50KTtcbiAgICB9XG5cbiAgICBjb25zdCBwbGF0Zm9ybUluamVjdG9yID0gY3JlYXRlT3JSZXVzZVBsYXRmb3JtSW5qZWN0b3IocGxhdGZvcm1Qcm92aWRlcnMgYXMgU3RhdGljUHJvdmlkZXJbXSk7XG5cbiAgICAvLyBDcmVhdGUgcm9vdCBhcHBsaWNhdGlvbiBpbmplY3RvciBiYXNlZCBvbiBhIHNldCBvZiBwcm92aWRlcnMgY29uZmlndXJlZCBhdCB0aGUgcGxhdGZvcm1cbiAgICAvLyBib290c3RyYXAgbGV2ZWwgYXMgd2VsbCBhcyBwcm92aWRlcnMgcGFzc2VkIHRvIHRoZSBib290c3RyYXAgY2FsbCBieSBhIHVzZXIuXG4gICAgY29uc3QgYWxsQXBwUHJvdmlkZXJzID0gW1xuICAgICAgcHJvdmlkZVpvbmVDaGFuZ2VEZXRlY3Rpb24oKSxcbiAgICAgIC4uLihhcHBQcm92aWRlcnMgfHwgW10pLFxuICAgIF07XG4gICAgY29uc3QgYWRhcHRlciA9IG5ldyBFbnZpcm9ubWVudE5nTW9kdWxlUmVmQWRhcHRlcih7XG4gICAgICBwcm92aWRlcnM6IGFsbEFwcFByb3ZpZGVycyxcbiAgICAgIHBhcmVudDogcGxhdGZvcm1JbmplY3RvciBhcyBFbnZpcm9ubWVudEluamVjdG9yLFxuICAgICAgZGVidWdOYW1lOiAodHlwZW9mIG5nRGV2TW9kZSA9PT0gJ3VuZGVmaW5lZCcgfHwgbmdEZXZNb2RlKSA/ICdFbnZpcm9ubWVudCBJbmplY3RvcicgOiAnJyxcbiAgICAgIC8vIFdlIHNraXAgZW52aXJvbm1lbnQgaW5pdGlhbGl6ZXJzIGJlY2F1c2Ugd2UgbmVlZCB0byBydW4gdGhlbSBpbnNpZGUgdGhlIE5nWm9uZSwgd2hpY2hcbiAgICAgIC8vIGhhcHBlbnMgYWZ0ZXIgd2UgZ2V0IHRoZSBOZ1pvbmUgaW5zdGFuY2UgZnJvbSB0aGUgSW5qZWN0b3IuXG4gICAgICBydW5FbnZpcm9ubWVudEluaXRpYWxpemVyczogZmFsc2UsXG4gICAgfSk7XG4gICAgY29uc3QgZW52SW5qZWN0b3IgPSBhZGFwdGVyLmluamVjdG9yO1xuICAgIGNvbnN0IG5nWm9uZSA9IGVudkluamVjdG9yLmdldChOZ1pvbmUpO1xuXG4gICAgcmV0dXJuIG5nWm9uZS5ydW4oKCkgPT4ge1xuICAgICAgZW52SW5qZWN0b3IucmVzb2x2ZUluamVjdG9ySW5pdGlhbGl6ZXJzKCk7XG4gICAgICBjb25zdCBleGNlcHRpb25IYW5kbGVyOiBFcnJvckhhbmRsZXJ8bnVsbCA9IGVudkluamVjdG9yLmdldChFcnJvckhhbmRsZXIsIG51bGwpO1xuICAgICAgaWYgKCh0eXBlb2YgbmdEZXZNb2RlID09PSAndW5kZWZpbmVkJyB8fCBuZ0Rldk1vZGUpICYmICFleGNlcHRpb25IYW5kbGVyKSB7XG4gICAgICAgIHRocm93IG5ldyBSdW50aW1lRXJyb3IoXG4gICAgICAgICAgICBSdW50aW1lRXJyb3JDb2RlLk1JU1NJTkdfUkVRVUlSRURfSU5KRUNUQUJMRV9JTl9CT09UU1RSQVAsXG4gICAgICAgICAgICAnTm8gYEVycm9ySGFuZGxlcmAgZm91bmQgaW4gdGhlIERlcGVuZGVuY3kgSW5qZWN0aW9uIHRyZWUuJyk7XG4gICAgICB9XG5cbiAgICAgIGxldCBvbkVycm9yU3Vic2NyaXB0aW9uOiBTdWJzY3JpcHRpb247XG4gICAgICBuZ1pvbmUucnVuT3V0c2lkZUFuZ3VsYXIoKCkgPT4ge1xuICAgICAgICBvbkVycm9yU3Vic2NyaXB0aW9uID0gbmdab25lLm9uRXJyb3Iuc3Vic2NyaWJlKHtcbiAgICAgICAgICBuZXh0OiAoZXJyb3I6IGFueSkgPT4ge1xuICAgICAgICAgICAgZXhjZXB0aW9uSGFuZGxlciEuaGFuZGxlRXJyb3IoZXJyb3IpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9KTtcblxuICAgICAgLy8gSWYgdGhlIHdob2xlIHBsYXRmb3JtIGlzIGRlc3Ryb3llZCwgaW52b2tlIHRoZSBgZGVzdHJveWAgbWV0aG9kXG4gICAgICAvLyBmb3IgYWxsIGJvb3RzdHJhcHBlZCBhcHBsaWNhdGlvbnMgYXMgd2VsbC5cbiAgICAgIGNvbnN0IGRlc3Ryb3lMaXN0ZW5lciA9ICgpID0+IGVudkluamVjdG9yLmRlc3Ryb3koKTtcbiAgICAgIGNvbnN0IG9uUGxhdGZvcm1EZXN0cm95TGlzdGVuZXJzID0gcGxhdGZvcm1JbmplY3Rvci5nZXQoUExBVEZPUk1fREVTVFJPWV9MSVNURU5FUlMpO1xuICAgICAgb25QbGF0Zm9ybURlc3Ryb3lMaXN0ZW5lcnMuYWRkKGRlc3Ryb3lMaXN0ZW5lcik7XG5cbiAgICAgIGVudkluamVjdG9yLm9uRGVzdHJveSgoKSA9PiB7XG4gICAgICAgIG9uRXJyb3JTdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcbiAgICAgICAgb25QbGF0Zm9ybURlc3Ryb3lMaXN0ZW5lcnMuZGVsZXRlKGRlc3Ryb3lMaXN0ZW5lcik7XG4gICAgICB9KTtcblxuICAgICAgcmV0dXJuIF9jYWxsQW5kUmVwb3J0VG9FcnJvckhhbmRsZXIoZXhjZXB0aW9uSGFuZGxlciEsIG5nWm9uZSwgKCkgPT4ge1xuICAgICAgICBjb25zdCBpbml0U3RhdHVzID0gZW52SW5qZWN0b3IuZ2V0KEFwcGxpY2F0aW9uSW5pdFN0YXR1cyk7XG4gICAgICAgIGluaXRTdGF0dXMucnVuSW5pdGlhbGl6ZXJzKCk7XG5cbiAgICAgICAgcmV0dXJuIGluaXRTdGF0dXMuZG9uZVByb21pc2UudGhlbigoKSA9PiB7XG4gICAgICAgICAgY29uc3QgbG9jYWxlSWQgPSBlbnZJbmplY3Rvci5nZXQoTE9DQUxFX0lELCBERUZBVUxUX0xPQ0FMRV9JRCk7XG4gICAgICAgICAgc2V0TG9jYWxlSWQobG9jYWxlSWQgfHwgREVGQVVMVF9MT0NBTEVfSUQpO1xuXG4gICAgICAgICAgY29uc3QgYXBwUmVmID0gZW52SW5qZWN0b3IuZ2V0KEFwcGxpY2F0aW9uUmVmKTtcbiAgICAgICAgICBpZiAocm9vdENvbXBvbmVudCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBhcHBSZWYuYm9vdHN0cmFwKHJvb3RDb21wb25lbnQpO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gYXBwUmVmO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9IGNhdGNoIChlKSB7XG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGUpO1xuICB9XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIGZhY3RvcnkgZm9yIGEgcGxhdGZvcm0uIENhbiBiZSB1c2VkIHRvIHByb3ZpZGUgb3Igb3ZlcnJpZGUgYFByb3ZpZGVyc2Agc3BlY2lmaWMgdG9cbiAqIHlvdXIgYXBwbGljYXRpb24ncyBydW50aW1lIG5lZWRzLCBzdWNoIGFzIGBQTEFURk9STV9JTklUSUFMSVpFUmAgYW5kIGBQTEFURk9STV9JRGAuXG4gKiBAcGFyYW0gcGFyZW50UGxhdGZvcm1GYWN0b3J5IEFub3RoZXIgcGxhdGZvcm0gZmFjdG9yeSB0byBtb2RpZnkuIEFsbG93cyB5b3UgdG8gY29tcG9zZSBmYWN0b3JpZXNcbiAqIHRvIGJ1aWxkIHVwIGNvbmZpZ3VyYXRpb25zIHRoYXQgbWlnaHQgYmUgcmVxdWlyZWQgYnkgZGlmZmVyZW50IGxpYnJhcmllcyBvciBwYXJ0cyBvZiB0aGVcbiAqIGFwcGxpY2F0aW9uLlxuICogQHBhcmFtIG5hbWUgSWRlbnRpZmllcyB0aGUgbmV3IHBsYXRmb3JtIGZhY3RvcnkuXG4gKiBAcGFyYW0gcHJvdmlkZXJzIEEgc2V0IG9mIGRlcGVuZGVuY3kgcHJvdmlkZXJzIGZvciBwbGF0Zm9ybXMgY3JlYXRlZCB3aXRoIHRoZSBuZXcgZmFjdG9yeS5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVQbGF0Zm9ybUZhY3RvcnkoXG4gICAgcGFyZW50UGxhdGZvcm1GYWN0b3J5OiAoKGV4dHJhUHJvdmlkZXJzPzogU3RhdGljUHJvdmlkZXJbXSkgPT4gUGxhdGZvcm1SZWYpfG51bGwsIG5hbWU6IHN0cmluZyxcbiAgICBwcm92aWRlcnM6IFN0YXRpY1Byb3ZpZGVyW10gPSBbXSk6IChleHRyYVByb3ZpZGVycz86IFN0YXRpY1Byb3ZpZGVyW10pID0+IFBsYXRmb3JtUmVmIHtcbiAgY29uc3QgZGVzYyA9IGBQbGF0Zm9ybTogJHtuYW1lfWA7XG4gIGNvbnN0IG1hcmtlciA9IG5ldyBJbmplY3Rpb25Ub2tlbihkZXNjKTtcbiAgcmV0dXJuIChleHRyYVByb3ZpZGVyczogU3RhdGljUHJvdmlkZXJbXSA9IFtdKSA9PiB7XG4gICAgbGV0IHBsYXRmb3JtID0gZ2V0UGxhdGZvcm0oKTtcbiAgICBpZiAoIXBsYXRmb3JtIHx8IHBsYXRmb3JtLmluamVjdG9yLmdldChBTExPV19NVUxUSVBMRV9QTEFURk9STVMsIGZhbHNlKSkge1xuICAgICAgY29uc3QgcGxhdGZvcm1Qcm92aWRlcnM6IFN0YXRpY1Byb3ZpZGVyW10gPSBbXG4gICAgICAgIC4uLnByb3ZpZGVycywgICAgICAgLy9cbiAgICAgICAgLi4uZXh0cmFQcm92aWRlcnMsICAvL1xuICAgICAgICB7cHJvdmlkZTogbWFya2VyLCB1c2VWYWx1ZTogdHJ1ZX1cbiAgICAgIF07XG4gICAgICBpZiAocGFyZW50UGxhdGZvcm1GYWN0b3J5KSB7XG4gICAgICAgIHBhcmVudFBsYXRmb3JtRmFjdG9yeShwbGF0Zm9ybVByb3ZpZGVycyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjcmVhdGVQbGF0Zm9ybShjcmVhdGVQbGF0Zm9ybUluamVjdG9yKHBsYXRmb3JtUHJvdmlkZXJzLCBkZXNjKSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBhc3NlcnRQbGF0Zm9ybShtYXJrZXIpO1xuICB9O1xufVxuXG4vKipcbiAqIENoZWNrcyB0aGF0IHRoZXJlIGlzIGN1cnJlbnRseSBhIHBsYXRmb3JtIHRoYXQgY29udGFpbnMgdGhlIGdpdmVuIHRva2VuIGFzIGEgcHJvdmlkZXIuXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gYXNzZXJ0UGxhdGZvcm0ocmVxdWlyZWRUb2tlbjogYW55KTogUGxhdGZvcm1SZWYge1xuICBjb25zdCBwbGF0Zm9ybSA9IGdldFBsYXRmb3JtKCk7XG5cbiAgaWYgKCFwbGF0Zm9ybSkge1xuICAgIHRocm93IG5ldyBSdW50aW1lRXJyb3IoUnVudGltZUVycm9yQ29kZS5QTEFURk9STV9OT1RfRk9VTkQsIG5nRGV2TW9kZSAmJiAnTm8gcGxhdGZvcm0gZXhpc3RzIScpO1xuICB9XG5cbiAgaWYgKCh0eXBlb2YgbmdEZXZNb2RlID09PSAndW5kZWZpbmVkJyB8fCBuZ0Rldk1vZGUpICYmXG4gICAgICAhcGxhdGZvcm0uaW5qZWN0b3IuZ2V0KHJlcXVpcmVkVG9rZW4sIG51bGwpKSB7XG4gICAgdGhyb3cgbmV3IFJ1bnRpbWVFcnJvcihcbiAgICAgICAgUnVudGltZUVycm9yQ29kZS5NVUxUSVBMRV9QTEFURk9STVMsXG4gICAgICAgICdBIHBsYXRmb3JtIHdpdGggYSBkaWZmZXJlbnQgY29uZmlndXJhdGlvbiBoYXMgYmVlbiBjcmVhdGVkLiBQbGVhc2UgZGVzdHJveSBpdCBmaXJzdC4nKTtcbiAgfVxuXG4gIHJldHVybiBwbGF0Zm9ybTtcbn1cblxuLyoqXG4gKiBIZWxwZXIgZnVuY3Rpb24gdG8gY3JlYXRlIGFuIGluc3RhbmNlIG9mIGEgcGxhdGZvcm0gaW5qZWN0b3IgKHRoYXQgbWFpbnRhaW5zIHRoZSAncGxhdGZvcm0nXG4gKiBzY29wZSkuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVQbGF0Zm9ybUluamVjdG9yKHByb3ZpZGVyczogU3RhdGljUHJvdmlkZXJbXSA9IFtdLCBuYW1lPzogc3RyaW5nKTogSW5qZWN0b3Ige1xuICByZXR1cm4gSW5qZWN0b3IuY3JlYXRlKHtcbiAgICBuYW1lLFxuICAgIHByb3ZpZGVyczogW1xuICAgICAge3Byb3ZpZGU6IElOSkVDVE9SX1NDT1BFLCB1c2VWYWx1ZTogJ3BsYXRmb3JtJ30sXG4gICAgICB7cHJvdmlkZTogUExBVEZPUk1fREVTVFJPWV9MSVNURU5FUlMsIHVzZVZhbHVlOiBuZXcgU2V0KFsoKSA9PiBfcGxhdGZvcm1JbmplY3RvciA9IG51bGxdKX0sXG4gICAgICAuLi5wcm92aWRlcnNcbiAgICBdLFxuICB9KTtcbn1cblxuLyoqXG4gKiBEZXN0cm95cyB0aGUgY3VycmVudCBBbmd1bGFyIHBsYXRmb3JtIGFuZCBhbGwgQW5ndWxhciBhcHBsaWNhdGlvbnMgb24gdGhlIHBhZ2UuXG4gKiBEZXN0cm95cyBhbGwgbW9kdWxlcyBhbmQgbGlzdGVuZXJzIHJlZ2lzdGVyZWQgd2l0aCB0aGUgcGxhdGZvcm0uXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gZGVzdHJveVBsYXRmb3JtKCk6IHZvaWQge1xuICBnZXRQbGF0Zm9ybSgpPy5kZXN0cm95KCk7XG59XG5cbi8qKlxuICogUmV0dXJucyB0aGUgY3VycmVudCBwbGF0Zm9ybS5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRQbGF0Zm9ybSgpOiBQbGF0Zm9ybVJlZnxudWxsIHtcbiAgcmV0dXJuIF9wbGF0Zm9ybUluamVjdG9yPy5nZXQoUGxhdGZvcm1SZWYpID8/IG51bGw7XG59XG5cbi8qKlxuICogVXNlZCB0byBjb25maWd1cmUgZXZlbnQgYW5kIHJ1biBjb2FsZXNjaW5nIHdpdGggYHByb3ZpZGVab25lQ2hhbmdlRGV0ZWN0aW9uYC5cbiAqXG4gKiBAcHVibGljQXBpXG4gKlxuICogQHNlZSBwcm92aWRlWm9uZUNoYW5nZURldGVjdGlvblxuICovXG5leHBvcnQgaW50ZXJmYWNlIE5nWm9uZU9wdGlvbnMge1xuICAvKipcbiAgICogT3B0aW9uYWxseSBzcGVjaWZ5IGNvYWxlc2NpbmcgZXZlbnQgY2hhbmdlIGRldGVjdGlvbnMgb3Igbm90LlxuICAgKiBDb25zaWRlciB0aGUgZm9sbG93aW5nIGNhc2UuXG4gICAqXG4gICAqIGBgYFxuICAgKiA8ZGl2IChjbGljayk9XCJkb1NvbWV0aGluZygpXCI+XG4gICAqICAgPGJ1dHRvbiAoY2xpY2spPVwiZG9Tb21ldGhpbmdFbHNlKClcIj48L2J1dHRvbj5cbiAgICogPC9kaXY+XG4gICAqIGBgYFxuICAgKlxuICAgKiBXaGVuIGJ1dHRvbiBpcyBjbGlja2VkLCBiZWNhdXNlIG9mIHRoZSBldmVudCBidWJibGluZywgYm90aFxuICAgKiBldmVudCBoYW5kbGVycyB3aWxsIGJlIGNhbGxlZCBhbmQgMiBjaGFuZ2UgZGV0ZWN0aW9ucyB3aWxsIGJlXG4gICAqIHRyaWdnZXJlZC4gV2UgY2FuIGNvYWxlc2NlIHN1Y2gga2luZCBvZiBldmVudHMgdG8gb25seSB0cmlnZ2VyXG4gICAqIGNoYW5nZSBkZXRlY3Rpb24gb25seSBvbmNlLlxuICAgKlxuICAgKiBCeSBkZWZhdWx0LCB0aGlzIG9wdGlvbiB3aWxsIGJlIGZhbHNlLiBTbyB0aGUgZXZlbnRzIHdpbGwgbm90IGJlXG4gICAqIGNvYWxlc2NlZCBhbmQgdGhlIGNoYW5nZSBkZXRlY3Rpb24gd2lsbCBiZSB0cmlnZ2VyZWQgbXVsdGlwbGUgdGltZXMuXG4gICAqIEFuZCBpZiB0aGlzIG9wdGlvbiBiZSBzZXQgdG8gdHJ1ZSwgdGhlIGNoYW5nZSBkZXRlY3Rpb24gd2lsbCBiZVxuICAgKiB0cmlnZ2VyZWQgYXN5bmMgYnkgc2NoZWR1bGluZyBhIGFuaW1hdGlvbiBmcmFtZS4gU28gaW4gdGhlIGNhc2UgYWJvdmUsXG4gICAqIHRoZSBjaGFuZ2UgZGV0ZWN0aW9uIHdpbGwgb25seSBiZSB0cmlnZ2VyZWQgb25jZS5cbiAgICovXG4gIGV2ZW50Q29hbGVzY2luZz86IGJvb2xlYW47XG5cbiAgLyoqXG4gICAqIE9wdGlvbmFsbHkgc3BlY2lmeSBpZiBgTmdab25lI3J1bigpYCBtZXRob2QgaW52b2NhdGlvbnMgc2hvdWxkIGJlIGNvYWxlc2NlZFxuICAgKiBpbnRvIGEgc2luZ2xlIGNoYW5nZSBkZXRlY3Rpb24uXG4gICAqXG4gICAqIENvbnNpZGVyIHRoZSBmb2xsb3dpbmcgY2FzZS5cbiAgICogYGBgXG4gICAqIGZvciAobGV0IGkgPSAwOyBpIDwgMTA7IGkgKyspIHtcbiAgICogICBuZ1pvbmUucnVuKCgpID0+IHtcbiAgICogICAgIC8vIGRvIHNvbWV0aGluZ1xuICAgKiAgIH0pO1xuICAgKiB9XG4gICAqIGBgYFxuICAgKlxuICAgKiBUaGlzIGNhc2UgdHJpZ2dlcnMgdGhlIGNoYW5nZSBkZXRlY3Rpb24gbXVsdGlwbGUgdGltZXMuXG4gICAqIFdpdGggbmdab25lUnVuQ29hbGVzY2luZyBvcHRpb25zLCBhbGwgY2hhbmdlIGRldGVjdGlvbnMgaW4gYW4gZXZlbnQgbG9vcCB0cmlnZ2VyIG9ubHkgb25jZS5cbiAgICogSW4gYWRkaXRpb24sIHRoZSBjaGFuZ2UgZGV0ZWN0aW9uIGV4ZWN1dGVzIGluIHJlcXVlc3RBbmltYXRpb24uXG4gICAqXG4gICAqL1xuICBydW5Db2FsZXNjaW5nPzogYm9vbGVhbjtcbn1cblxuLyoqXG4gKiBQcm92aWRlcyBhZGRpdGlvbmFsIG9wdGlvbnMgdG8gdGhlIGJvb3RzdHJhcHBpbmcgcHJvY2Vzcy5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgQm9vdHN0cmFwT3B0aW9ucyB7XG4gIC8qKlxuICAgKiBPcHRpb25hbGx5IHNwZWNpZnkgd2hpY2ggYE5nWm9uZWAgc2hvdWxkIGJlIHVzZWQuXG4gICAqXG4gICAqIC0gUHJvdmlkZSB5b3VyIG93biBgTmdab25lYCBpbnN0YW5jZS5cbiAgICogLSBgem9uZS5qc2AgLSBVc2UgZGVmYXVsdCBgTmdab25lYCB3aGljaCByZXF1aXJlcyBgWm9uZS5qc2AuXG4gICAqIC0gYG5vb3BgIC0gVXNlIGBOb29wTmdab25lYCB3aGljaCBkb2VzIG5vdGhpbmcuXG4gICAqL1xuICBuZ1pvbmU/OiBOZ1pvbmV8J3pvbmUuanMnfCdub29wJztcblxuICAvKipcbiAgICogT3B0aW9uYWxseSBzcGVjaWZ5IGNvYWxlc2NpbmcgZXZlbnQgY2hhbmdlIGRldGVjdGlvbnMgb3Igbm90LlxuICAgKiBDb25zaWRlciB0aGUgZm9sbG93aW5nIGNhc2UuXG4gICAqXG4gICAqIGBgYFxuICAgKiA8ZGl2IChjbGljayk9XCJkb1NvbWV0aGluZygpXCI+XG4gICAqICAgPGJ1dHRvbiAoY2xpY2spPVwiZG9Tb21ldGhpbmdFbHNlKClcIj48L2J1dHRvbj5cbiAgICogPC9kaXY+XG4gICAqIGBgYFxuICAgKlxuICAgKiBXaGVuIGJ1dHRvbiBpcyBjbGlja2VkLCBiZWNhdXNlIG9mIHRoZSBldmVudCBidWJibGluZywgYm90aFxuICAgKiBldmVudCBoYW5kbGVycyB3aWxsIGJlIGNhbGxlZCBhbmQgMiBjaGFuZ2UgZGV0ZWN0aW9ucyB3aWxsIGJlXG4gICAqIHRyaWdnZXJlZC4gV2UgY2FuIGNvYWxlc2NlIHN1Y2gga2luZCBvZiBldmVudHMgdG8gb25seSB0cmlnZ2VyXG4gICAqIGNoYW5nZSBkZXRlY3Rpb24gb25seSBvbmNlLlxuICAgKlxuICAgKiBCeSBkZWZhdWx0LCB0aGlzIG9wdGlvbiB3aWxsIGJlIGZhbHNlLiBTbyB0aGUgZXZlbnRzIHdpbGwgbm90IGJlXG4gICAqIGNvYWxlc2NlZCBhbmQgdGhlIGNoYW5nZSBkZXRlY3Rpb24gd2lsbCBiZSB0cmlnZ2VyZWQgbXVsdGlwbGUgdGltZXMuXG4gICAqIEFuZCBpZiB0aGlzIG9wdGlvbiBiZSBzZXQgdG8gdHJ1ZSwgdGhlIGNoYW5nZSBkZXRlY3Rpb24gd2lsbCBiZVxuICAgKiB0cmlnZ2VyZWQgYXN5bmMgYnkgc2NoZWR1bGluZyBhIGFuaW1hdGlvbiBmcmFtZS4gU28gaW4gdGhlIGNhc2UgYWJvdmUsXG4gICAqIHRoZSBjaGFuZ2UgZGV0ZWN0aW9uIHdpbGwgb25seSBiZSB0cmlnZ2VyZWQgb25jZS5cbiAgICovXG4gIG5nWm9uZUV2ZW50Q29hbGVzY2luZz86IGJvb2xlYW47XG5cbiAgLyoqXG4gICAqIE9wdGlvbmFsbHkgc3BlY2lmeSBpZiBgTmdab25lI3J1bigpYCBtZXRob2QgaW52b2NhdGlvbnMgc2hvdWxkIGJlIGNvYWxlc2NlZFxuICAgKiBpbnRvIGEgc2luZ2xlIGNoYW5nZSBkZXRlY3Rpb24uXG4gICAqXG4gICAqIENvbnNpZGVyIHRoZSBmb2xsb3dpbmcgY2FzZS5cbiAgICogYGBgXG4gICAqIGZvciAobGV0IGkgPSAwOyBpIDwgMTA7IGkgKyspIHtcbiAgICogICBuZ1pvbmUucnVuKCgpID0+IHtcbiAgICogICAgIC8vIGRvIHNvbWV0aGluZ1xuICAgKiAgIH0pO1xuICAgKiB9XG4gICAqIGBgYFxuICAgKlxuICAgKiBUaGlzIGNhc2UgdHJpZ2dlcnMgdGhlIGNoYW5nZSBkZXRlY3Rpb24gbXVsdGlwbGUgdGltZXMuXG4gICAqIFdpdGggbmdab25lUnVuQ29hbGVzY2luZyBvcHRpb25zLCBhbGwgY2hhbmdlIGRldGVjdGlvbnMgaW4gYW4gZXZlbnQgbG9vcCB0cmlnZ2VyIG9ubHkgb25jZS5cbiAgICogSW4gYWRkaXRpb24sIHRoZSBjaGFuZ2UgZGV0ZWN0aW9uIGV4ZWN1dGVzIGluIHJlcXVlc3RBbmltYXRpb24uXG4gICAqXG4gICAqL1xuICBuZ1pvbmVSdW5Db2FsZXNjaW5nPzogYm9vbGVhbjtcbn1cblxuLyoqXG4gKiBUaGUgQW5ndWxhciBwbGF0Zm9ybSBpcyB0aGUgZW50cnkgcG9pbnQgZm9yIEFuZ3VsYXIgb24gYSB3ZWIgcGFnZS5cbiAqIEVhY2ggcGFnZSBoYXMgZXhhY3RseSBvbmUgcGxhdGZvcm0uIFNlcnZpY2VzIChzdWNoIGFzIHJlZmxlY3Rpb24pIHdoaWNoIGFyZSBjb21tb25cbiAqIHRvIGV2ZXJ5IEFuZ3VsYXIgYXBwbGljYXRpb24gcnVubmluZyBvbiB0aGUgcGFnZSBhcmUgYm91bmQgaW4gaXRzIHNjb3BlLlxuICogQSBwYWdlJ3MgcGxhdGZvcm0gaXMgaW5pdGlhbGl6ZWQgaW1wbGljaXRseSB3aGVuIGEgcGxhdGZvcm0gaXMgY3JlYXRlZCB1c2luZyBhIHBsYXRmb3JtXG4gKiBmYWN0b3J5IHN1Y2ggYXMgYFBsYXRmb3JtQnJvd3NlcmAsIG9yIGV4cGxpY2l0bHkgYnkgY2FsbGluZyB0aGUgYGNyZWF0ZVBsYXRmb3JtKClgIGZ1bmN0aW9uLlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuQEluamVjdGFibGUoe3Byb3ZpZGVkSW46ICdwbGF0Zm9ybSd9KVxuZXhwb3J0IGNsYXNzIFBsYXRmb3JtUmVmIHtcbiAgcHJpdmF0ZSBfbW9kdWxlczogTmdNb2R1bGVSZWY8YW55PltdID0gW107XG4gIHByaXZhdGUgX2Rlc3Ryb3lMaXN0ZW5lcnM6IEFycmF5PCgpID0+IHZvaWQ+ID0gW107XG4gIHByaXZhdGUgX2Rlc3Ryb3llZDogYm9vbGVhbiA9IGZhbHNlO1xuXG4gIC8qKiBAaW50ZXJuYWwgKi9cbiAgY29uc3RydWN0b3IocHJpdmF0ZSBfaW5qZWN0b3I6IEluamVjdG9yKSB7fVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGFuIGluc3RhbmNlIG9mIGFuIGBATmdNb2R1bGVgIGZvciB0aGUgZ2l2ZW4gcGxhdGZvcm0uXG4gICAqXG4gICAqIEBkZXByZWNhdGVkIFBhc3NpbmcgTmdNb2R1bGUgZmFjdG9yaWVzIGFzIHRoZSBgUGxhdGZvcm1SZWYuYm9vdHN0cmFwTW9kdWxlRmFjdG9yeWAgZnVuY3Rpb25cbiAgICogICAgIGFyZ3VtZW50IGlzIGRlcHJlY2F0ZWQuIFVzZSB0aGUgYFBsYXRmb3JtUmVmLmJvb3RzdHJhcE1vZHVsZWAgQVBJIGluc3RlYWQuXG4gICAqL1xuICBib290c3RyYXBNb2R1bGVGYWN0b3J5PE0+KG1vZHVsZUZhY3Rvcnk6IE5nTW9kdWxlRmFjdG9yeTxNPiwgb3B0aW9ucz86IEJvb3RzdHJhcE9wdGlvbnMpOlxuICAgICAgUHJvbWlzZTxOZ01vZHVsZVJlZjxNPj4ge1xuICAgIC8vIE5vdGU6IFdlIG5lZWQgdG8gY3JlYXRlIHRoZSBOZ1pvbmUgX2JlZm9yZV8gd2UgaW5zdGFudGlhdGUgdGhlIG1vZHVsZSxcbiAgICAvLyBhcyBpbnN0YW50aWF0aW5nIHRoZSBtb2R1bGUgY3JlYXRlcyBzb21lIHByb3ZpZGVycyBlYWdlcmx5LlxuICAgIC8vIFNvIHdlIGNyZWF0ZSBhIG1pbmkgcGFyZW50IGluamVjdG9yIHRoYXQganVzdCBjb250YWlucyB0aGUgbmV3IE5nWm9uZSBhbmRcbiAgICAvLyBwYXNzIHRoYXQgYXMgcGFyZW50IHRvIHRoZSBOZ01vZHVsZUZhY3RvcnkuXG4gICAgY29uc3Qgbmdab25lID0gZ2V0Tmdab25lKG9wdGlvbnM/Lm5nWm9uZSwgZ2V0Tmdab25lT3B0aW9ucyh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXZlbnRDb2FsZXNjaW5nOiBvcHRpb25zPy5uZ1pvbmVFdmVudENvYWxlc2NpbmcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcnVuQ29hbGVzY2luZzogb3B0aW9ucz8ubmdab25lUnVuQ29hbGVzY2luZ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KSk7XG4gICAgLy8gTm90ZTogQ3JlYXRlIG5nWm9uZUluamVjdG9yIHdpdGhpbiBuZ1pvbmUucnVuIHNvIHRoYXQgYWxsIG9mIHRoZSBpbnN0YW50aWF0ZWQgc2VydmljZXMgYXJlXG4gICAgLy8gY3JlYXRlZCB3aXRoaW4gdGhlIEFuZ3VsYXIgem9uZVxuICAgIC8vIERvIG5vdCB0cnkgdG8gcmVwbGFjZSBuZ1pvbmUucnVuIHdpdGggQXBwbGljYXRpb25SZWYjcnVuIGJlY2F1c2UgQXBwbGljYXRpb25SZWYgd291bGQgdGhlbiBiZVxuICAgIC8vIGNyZWF0ZWQgb3V0c2lkZSBvZiB0aGUgQW5ndWxhciB6b25lLlxuICAgIHJldHVybiBuZ1pvbmUucnVuKCgpID0+IHtcbiAgICAgIGNvbnN0IG1vZHVsZVJlZiA9IGNyZWF0ZU5nTW9kdWxlUmVmV2l0aFByb3ZpZGVycyhcbiAgICAgICAgICBtb2R1bGVGYWN0b3J5Lm1vZHVsZVR5cGUsIHRoaXMuaW5qZWN0b3IsXG4gICAgICAgICAgaW50ZXJuYWxQcm92aWRlWm9uZUNoYW5nZURldGVjdGlvbigoKSA9PiBuZ1pvbmUpKTtcblxuICAgICAgaWYgKCh0eXBlb2YgbmdEZXZNb2RlID09PSAndW5kZWZpbmVkJyB8fCBuZ0Rldk1vZGUpICYmXG4gICAgICAgICAgbW9kdWxlUmVmLmluamVjdG9yLmdldChQUk9WSURFRF9OR19aT05FLCBudWxsKSAhPT0gbnVsbCkge1xuICAgICAgICB0aHJvdyBuZXcgUnVudGltZUVycm9yKFxuICAgICAgICAgICAgUnVudGltZUVycm9yQ29kZS5QUk9WSURFUl9JTl9XUk9OR19DT05URVhULFxuICAgICAgICAgICAgJ2Bib290c3RyYXBNb2R1bGVgIGRvZXMgbm90IHN1cHBvcnQgYHByb3ZpZGVab25lQ2hhbmdlRGV0ZWN0aW9uYC4gVXNlIGBCb290c3RyYXBPcHRpb25zYCBpbnN0ZWFkLicpO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBleGNlcHRpb25IYW5kbGVyID0gbW9kdWxlUmVmLmluamVjdG9yLmdldChFcnJvckhhbmRsZXIsIG51bGwpO1xuICAgICAgaWYgKCh0eXBlb2YgbmdEZXZNb2RlID09PSAndW5kZWZpbmVkJyB8fCBuZ0Rldk1vZGUpICYmIGV4Y2VwdGlvbkhhbmRsZXIgPT09IG51bGwpIHtcbiAgICAgICAgdGhyb3cgbmV3IFJ1bnRpbWVFcnJvcihcbiAgICAgICAgICAgIFJ1bnRpbWVFcnJvckNvZGUuTUlTU0lOR19SRVFVSVJFRF9JTkpFQ1RBQkxFX0lOX0JPT1RTVFJBUCxcbiAgICAgICAgICAgICdObyBFcnJvckhhbmRsZXIuIElzIHBsYXRmb3JtIG1vZHVsZSAoQnJvd3Nlck1vZHVsZSkgaW5jbHVkZWQ/Jyk7XG4gICAgICB9XG4gICAgICBuZ1pvbmUucnVuT3V0c2lkZUFuZ3VsYXIoKCkgPT4ge1xuICAgICAgICBjb25zdCBzdWJzY3JpcHRpb24gPSBuZ1pvbmUub25FcnJvci5zdWJzY3JpYmUoe1xuICAgICAgICAgIG5leHQ6IChlcnJvcjogYW55KSA9PiB7XG4gICAgICAgICAgICBleGNlcHRpb25IYW5kbGVyIS5oYW5kbGVFcnJvcihlcnJvcik7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgbW9kdWxlUmVmLm9uRGVzdHJveSgoKSA9PiB7XG4gICAgICAgICAgcmVtb3ZlKHRoaXMuX21vZHVsZXMsIG1vZHVsZVJlZik7XG4gICAgICAgICAgc3Vic2NyaXB0aW9uLnVuc3Vic2NyaWJlKCk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgICByZXR1cm4gX2NhbGxBbmRSZXBvcnRUb0Vycm9ySGFuZGxlcihleGNlcHRpb25IYW5kbGVyISwgbmdab25lLCAoKSA9PiB7XG4gICAgICAgIGNvbnN0IGluaXRTdGF0dXM6IEFwcGxpY2F0aW9uSW5pdFN0YXR1cyA9IG1vZHVsZVJlZi5pbmplY3Rvci5nZXQoQXBwbGljYXRpb25Jbml0U3RhdHVzKTtcbiAgICAgICAgaW5pdFN0YXR1cy5ydW5Jbml0aWFsaXplcnMoKTtcbiAgICAgICAgcmV0dXJuIGluaXRTdGF0dXMuZG9uZVByb21pc2UudGhlbigoKSA9PiB7XG4gICAgICAgICAgLy8gSWYgdGhlIGBMT0NBTEVfSURgIHByb3ZpZGVyIGlzIGRlZmluZWQgYXQgYm9vdHN0cmFwIHRoZW4gd2Ugc2V0IHRoZSB2YWx1ZSBmb3IgaXZ5XG4gICAgICAgICAgY29uc3QgbG9jYWxlSWQgPSBtb2R1bGVSZWYuaW5qZWN0b3IuZ2V0KExPQ0FMRV9JRCwgREVGQVVMVF9MT0NBTEVfSUQpO1xuICAgICAgICAgIHNldExvY2FsZUlkKGxvY2FsZUlkIHx8IERFRkFVTFRfTE9DQUxFX0lEKTtcbiAgICAgICAgICB0aGlzLl9tb2R1bGVEb0Jvb3RzdHJhcChtb2R1bGVSZWYpO1xuICAgICAgICAgIHJldHVybiBtb2R1bGVSZWY7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhbiBpbnN0YW5jZSBvZiBhbiBgQE5nTW9kdWxlYCBmb3IgYSBnaXZlbiBwbGF0Zm9ybS5cbiAgICpcbiAgICogQHVzYWdlTm90ZXNcbiAgICogIyMjIFNpbXBsZSBFeGFtcGxlXG4gICAqXG4gICAqIGBgYHR5cGVzY3JpcHRcbiAgICogQE5nTW9kdWxlKHtcbiAgICogICBpbXBvcnRzOiBbQnJvd3Nlck1vZHVsZV1cbiAgICogfSlcbiAgICogY2xhc3MgTXlNb2R1bGUge31cbiAgICpcbiAgICogbGV0IG1vZHVsZVJlZiA9IHBsYXRmb3JtQnJvd3NlcigpLmJvb3RzdHJhcE1vZHVsZShNeU1vZHVsZSk7XG4gICAqIGBgYFxuICAgKlxuICAgKi9cbiAgYm9vdHN0cmFwTW9kdWxlPE0+KFxuICAgICAgbW9kdWxlVHlwZTogVHlwZTxNPixcbiAgICAgIGNvbXBpbGVyT3B0aW9uczogKENvbXBpbGVyT3B0aW9ucyZCb290c3RyYXBPcHRpb25zKXxcbiAgICAgIEFycmF5PENvbXBpbGVyT3B0aW9ucyZCb290c3RyYXBPcHRpb25zPiA9IFtdKTogUHJvbWlzZTxOZ01vZHVsZVJlZjxNPj4ge1xuICAgIGNvbnN0IG9wdGlvbnMgPSBvcHRpb25zUmVkdWNlcih7fSwgY29tcGlsZXJPcHRpb25zKTtcbiAgICByZXR1cm4gY29tcGlsZU5nTW9kdWxlRmFjdG9yeSh0aGlzLmluamVjdG9yLCBvcHRpb25zLCBtb2R1bGVUeXBlKVxuICAgICAgICAudGhlbihtb2R1bGVGYWN0b3J5ID0+IHRoaXMuYm9vdHN0cmFwTW9kdWxlRmFjdG9yeShtb2R1bGVGYWN0b3J5LCBvcHRpb25zKSk7XG4gIH1cblxuICBwcml2YXRlIF9tb2R1bGVEb0Jvb3RzdHJhcChtb2R1bGVSZWY6IEludGVybmFsTmdNb2R1bGVSZWY8YW55Pik6IHZvaWQge1xuICAgIGNvbnN0IGFwcFJlZiA9IG1vZHVsZVJlZi5pbmplY3Rvci5nZXQoQXBwbGljYXRpb25SZWYpO1xuICAgIGlmIChtb2R1bGVSZWYuX2Jvb3RzdHJhcENvbXBvbmVudHMubGVuZ3RoID4gMCkge1xuICAgICAgbW9kdWxlUmVmLl9ib290c3RyYXBDb21wb25lbnRzLmZvckVhY2goZiA9PiBhcHBSZWYuYm9vdHN0cmFwKGYpKTtcbiAgICB9IGVsc2UgaWYgKG1vZHVsZVJlZi5pbnN0YW5jZS5uZ0RvQm9vdHN0cmFwKSB7XG4gICAgICBtb2R1bGVSZWYuaW5zdGFuY2UubmdEb0Jvb3RzdHJhcChhcHBSZWYpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBuZXcgUnVudGltZUVycm9yKFxuICAgICAgICAgIFJ1bnRpbWVFcnJvckNvZGUuQk9PVFNUUkFQX0NPTVBPTkVOVFNfTk9UX0ZPVU5ELFxuICAgICAgICAgIG5nRGV2TW9kZSAmJlxuICAgICAgICAgICAgICBgVGhlIG1vZHVsZSAke3N0cmluZ2lmeShtb2R1bGVSZWYuaW5zdGFuY2UuY29uc3RydWN0b3IpfSB3YXMgYm9vdHN0cmFwcGVkLCBgICtcbiAgICAgICAgICAgICAgICAgIGBidXQgaXQgZG9lcyBub3QgZGVjbGFyZSBcIkBOZ01vZHVsZS5ib290c3RyYXBcIiBjb21wb25lbnRzIG5vciBhIFwibmdEb0Jvb3RzdHJhcFwiIG1ldGhvZC4gYCArXG4gICAgICAgICAgICAgICAgICBgUGxlYXNlIGRlZmluZSBvbmUgb2YgdGhlc2UuYCk7XG4gICAgfVxuICAgIHRoaXMuX21vZHVsZXMucHVzaChtb2R1bGVSZWYpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlZ2lzdGVycyBhIGxpc3RlbmVyIHRvIGJlIGNhbGxlZCB3aGVuIHRoZSBwbGF0Zm9ybSBpcyBkZXN0cm95ZWQuXG4gICAqL1xuICBvbkRlc3Ryb3koY2FsbGJhY2s6ICgpID0+IHZvaWQpOiB2b2lkIHtcbiAgICB0aGlzLl9kZXN0cm95TGlzdGVuZXJzLnB1c2goY2FsbGJhY2spO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHJpZXZlcyB0aGUgcGxhdGZvcm0ge0BsaW5rIEluamVjdG9yfSwgd2hpY2ggaXMgdGhlIHBhcmVudCBpbmplY3RvciBmb3JcbiAgICogZXZlcnkgQW5ndWxhciBhcHBsaWNhdGlvbiBvbiB0aGUgcGFnZSBhbmQgcHJvdmlkZXMgc2luZ2xldG9uIHByb3ZpZGVycy5cbiAgICovXG4gIGdldCBpbmplY3RvcigpOiBJbmplY3RvciB7XG4gICAgcmV0dXJuIHRoaXMuX2luamVjdG9yO1xuICB9XG5cbiAgLyoqXG4gICAqIERlc3Ryb3lzIHRoZSBjdXJyZW50IEFuZ3VsYXIgcGxhdGZvcm0gYW5kIGFsbCBBbmd1bGFyIGFwcGxpY2F0aW9ucyBvbiB0aGUgcGFnZS5cbiAgICogRGVzdHJveXMgYWxsIG1vZHVsZXMgYW5kIGxpc3RlbmVycyByZWdpc3RlcmVkIHdpdGggdGhlIHBsYXRmb3JtLlxuICAgKi9cbiAgZGVzdHJveSgpIHtcbiAgICBpZiAodGhpcy5fZGVzdHJveWVkKSB7XG4gICAgICB0aHJvdyBuZXcgUnVudGltZUVycm9yKFxuICAgICAgICAgIFJ1bnRpbWVFcnJvckNvZGUuUExBVEZPUk1fQUxSRUFEWV9ERVNUUk9ZRUQsXG4gICAgICAgICAgbmdEZXZNb2RlICYmICdUaGUgcGxhdGZvcm0gaGFzIGFscmVhZHkgYmVlbiBkZXN0cm95ZWQhJyk7XG4gICAgfVxuICAgIHRoaXMuX21vZHVsZXMuc2xpY2UoKS5mb3JFYWNoKG1vZHVsZSA9PiBtb2R1bGUuZGVzdHJveSgpKTtcbiAgICB0aGlzLl9kZXN0cm95TGlzdGVuZXJzLmZvckVhY2gobGlzdGVuZXIgPT4gbGlzdGVuZXIoKSk7XG5cbiAgICBjb25zdCBkZXN0cm95TGlzdGVuZXJzID0gdGhpcy5faW5qZWN0b3IuZ2V0KFBMQVRGT1JNX0RFU1RST1lfTElTVEVORVJTLCBudWxsKTtcbiAgICBpZiAoZGVzdHJveUxpc3RlbmVycykge1xuICAgICAgZGVzdHJveUxpc3RlbmVycy5mb3JFYWNoKGxpc3RlbmVyID0+IGxpc3RlbmVyKCkpO1xuICAgICAgZGVzdHJveUxpc3RlbmVycy5jbGVhcigpO1xuICAgIH1cblxuICAgIHRoaXMuX2Rlc3Ryb3llZCA9IHRydWU7XG4gIH1cblxuICAvKipcbiAgICogSW5kaWNhdGVzIHdoZXRoZXIgdGhpcyBpbnN0YW5jZSB3YXMgZGVzdHJveWVkLlxuICAgKi9cbiAgZ2V0IGRlc3Ryb3llZCgpIHtcbiAgICByZXR1cm4gdGhpcy5fZGVzdHJveWVkO1xuICB9XG59XG5cbi8vIFNldCBvZiBvcHRpb25zIHJlY29nbml6ZWQgYnkgdGhlIE5nWm9uZS5cbmludGVyZmFjZSBJbnRlcm5hbE5nWm9uZU9wdGlvbnMge1xuICBlbmFibGVMb25nU3RhY2tUcmFjZTogYm9vbGVhbjtcbiAgc2hvdWxkQ29hbGVzY2VFdmVudENoYW5nZURldGVjdGlvbjogYm9vbGVhbjtcbiAgc2hvdWxkQ29hbGVzY2VSdW5DaGFuZ2VEZXRlY3Rpb246IGJvb2xlYW47XG59XG5cbi8vIFRyYW5zZm9ybXMgYSBzZXQgb2YgYEJvb3RzdHJhcE9wdGlvbnNgIChzdXBwb3J0ZWQgYnkgdGhlIE5nTW9kdWxlLWJhc2VkIGJvb3RzdHJhcCBBUElzKSAtPlxuLy8gYE5nWm9uZU9wdGlvbnNgIHRoYXQgYXJlIHJlY29nbml6ZWQgYnkgdGhlIE5nWm9uZSBjb25zdHJ1Y3Rvci4gUGFzc2luZyBubyBvcHRpb25zIHdpbGwgcmVzdWx0IGluXG4vLyBhIHNldCBvZiBkZWZhdWx0IG9wdGlvbnMgcmV0dXJuZWQuXG5mdW5jdGlvbiBnZXROZ1pvbmVPcHRpb25zKG9wdGlvbnM/OiBOZ1pvbmVPcHRpb25zKTogSW50ZXJuYWxOZ1pvbmVPcHRpb25zIHtcbiAgcmV0dXJuIHtcbiAgICBlbmFibGVMb25nU3RhY2tUcmFjZTogdHlwZW9mIG5nRGV2TW9kZSA9PT0gJ3VuZGVmaW5lZCcgPyBmYWxzZSA6ICEhbmdEZXZNb2RlLFxuICAgIHNob3VsZENvYWxlc2NlRXZlbnRDaGFuZ2VEZXRlY3Rpb246IG9wdGlvbnM/LmV2ZW50Q29hbGVzY2luZyA/PyBmYWxzZSxcbiAgICBzaG91bGRDb2FsZXNjZVJ1bkNoYW5nZURldGVjdGlvbjogb3B0aW9ucz8ucnVuQ29hbGVzY2luZyA/PyBmYWxzZSxcbiAgfTtcbn1cblxuZnVuY3Rpb24gZ2V0Tmdab25lKFxuICAgIG5nWm9uZVRvVXNlOiBOZ1pvbmV8J3pvbmUuanMnfCdub29wJyA9ICd6b25lLmpzJywgb3B0aW9uczogSW50ZXJuYWxOZ1pvbmVPcHRpb25zKTogTmdab25lIHtcbiAgaWYgKG5nWm9uZVRvVXNlID09PSAnbm9vcCcpIHtcbiAgICByZXR1cm4gbmV3IE5vb3BOZ1pvbmUoKTtcbiAgfVxuICBpZiAobmdab25lVG9Vc2UgPT09ICd6b25lLmpzJykge1xuICAgIHJldHVybiBuZXcgTmdab25lKG9wdGlvbnMpO1xuICB9XG4gIHJldHVybiBuZ1pvbmVUb1VzZTtcbn1cblxuZnVuY3Rpb24gX2NhbGxBbmRSZXBvcnRUb0Vycm9ySGFuZGxlcihcbiAgICBlcnJvckhhbmRsZXI6IEVycm9ySGFuZGxlciwgbmdab25lOiBOZ1pvbmUsIGNhbGxiYWNrOiAoKSA9PiBhbnkpOiBhbnkge1xuICB0cnkge1xuICAgIGNvbnN0IHJlc3VsdCA9IGNhbGxiYWNrKCk7XG4gICAgaWYgKGlzUHJvbWlzZShyZXN1bHQpKSB7XG4gICAgICByZXR1cm4gcmVzdWx0LmNhdGNoKChlOiBhbnkpID0+IHtcbiAgICAgICAgbmdab25lLnJ1bk91dHNpZGVBbmd1bGFyKCgpID0+IGVycm9ySGFuZGxlci5oYW5kbGVFcnJvcihlKSk7XG4gICAgICAgIC8vIHJldGhyb3cgYXMgdGhlIGV4Y2VwdGlvbiBoYW5kbGVyIG1pZ2h0IG5vdCBkbyBpdFxuICAgICAgICB0aHJvdyBlO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfSBjYXRjaCAoZSkge1xuICAgIG5nWm9uZS5ydW5PdXRzaWRlQW5ndWxhcigoKSA9PiBlcnJvckhhbmRsZXIuaGFuZGxlRXJyb3IoZSkpO1xuICAgIC8vIHJldGhyb3cgYXMgdGhlIGV4Y2VwdGlvbiBoYW5kbGVyIG1pZ2h0IG5vdCBkbyBpdFxuICAgIHRocm93IGU7XG4gIH1cbn1cblxuZnVuY3Rpb24gb3B0aW9uc1JlZHVjZXI8VCBleHRlbmRzIE9iamVjdD4oZHN0OiBULCBvYmpzOiBUfFRbXSk6IFQge1xuICBpZiAoQXJyYXkuaXNBcnJheShvYmpzKSkge1xuICAgIHJldHVybiBvYmpzLnJlZHVjZShvcHRpb25zUmVkdWNlciwgZHN0KTtcbiAgfVxuICByZXR1cm4gey4uLmRzdCwgLi4ub2Jqc307XG59XG5cbi8qKlxuICogQSByZWZlcmVuY2UgdG8gYW4gQW5ndWxhciBhcHBsaWNhdGlvbiBydW5uaW5nIG9uIGEgcGFnZS5cbiAqXG4gKiBAdXNhZ2VOb3Rlc1xuICoge0BhIGlzLXN0YWJsZS1leGFtcGxlc31cbiAqICMjIyBpc1N0YWJsZSBleGFtcGxlcyBhbmQgY2F2ZWF0c1xuICpcbiAqIE5vdGUgdHdvIGltcG9ydGFudCBwb2ludHMgYWJvdXQgYGlzU3RhYmxlYCwgZGVtb25zdHJhdGVkIGluIHRoZSBleGFtcGxlcyBiZWxvdzpcbiAqIC0gdGhlIGFwcGxpY2F0aW9uIHdpbGwgbmV2ZXIgYmUgc3RhYmxlIGlmIHlvdSBzdGFydCBhbnkga2luZFxuICogb2YgcmVjdXJyZW50IGFzeW5jaHJvbm91cyB0YXNrIHdoZW4gdGhlIGFwcGxpY2F0aW9uIHN0YXJ0c1xuICogKGZvciBleGFtcGxlIGZvciBhIHBvbGxpbmcgcHJvY2Vzcywgc3RhcnRlZCB3aXRoIGEgYHNldEludGVydmFsYCwgYSBgc2V0VGltZW91dGBcbiAqIG9yIHVzaW5nIFJ4SlMgb3BlcmF0b3JzIGxpa2UgYGludGVydmFsYCk7XG4gKiAtIHRoZSBgaXNTdGFibGVgIE9ic2VydmFibGUgcnVucyBvdXRzaWRlIG9mIHRoZSBBbmd1bGFyIHpvbmUuXG4gKlxuICogTGV0J3MgaW1hZ2luZSB0aGF0IHlvdSBzdGFydCBhIHJlY3VycmVudCB0YXNrXG4gKiAoaGVyZSBpbmNyZW1lbnRpbmcgYSBjb3VudGVyLCB1c2luZyBSeEpTIGBpbnRlcnZhbGApLFxuICogYW5kIGF0IHRoZSBzYW1lIHRpbWUgc3Vic2NyaWJlIHRvIGBpc1N0YWJsZWAuXG4gKlxuICogYGBgXG4gKiBjb25zdHJ1Y3RvcihhcHBSZWY6IEFwcGxpY2F0aW9uUmVmKSB7XG4gKiAgIGFwcFJlZi5pc1N0YWJsZS5waXBlKFxuICogICAgICBmaWx0ZXIoc3RhYmxlID0+IHN0YWJsZSlcbiAqICAgKS5zdWJzY3JpYmUoKCkgPT4gY29uc29sZS5sb2coJ0FwcCBpcyBzdGFibGUgbm93Jyk7XG4gKiAgIGludGVydmFsKDEwMDApLnN1YnNjcmliZShjb3VudGVyID0+IGNvbnNvbGUubG9nKGNvdW50ZXIpKTtcbiAqIH1cbiAqIGBgYFxuICogSW4gdGhpcyBleGFtcGxlLCBgaXNTdGFibGVgIHdpbGwgbmV2ZXIgZW1pdCBgdHJ1ZWAsXG4gKiBhbmQgdGhlIHRyYWNlIFwiQXBwIGlzIHN0YWJsZSBub3dcIiB3aWxsIG5ldmVyIGdldCBsb2dnZWQuXG4gKlxuICogSWYgeW91IHdhbnQgdG8gZXhlY3V0ZSBzb21ldGhpbmcgd2hlbiB0aGUgYXBwIGlzIHN0YWJsZSxcbiAqIHlvdSBoYXZlIHRvIHdhaXQgZm9yIHRoZSBhcHBsaWNhdGlvbiB0byBiZSBzdGFibGVcbiAqIGJlZm9yZSBzdGFydGluZyB5b3VyIHBvbGxpbmcgcHJvY2Vzcy5cbiAqXG4gKiBgYGBcbiAqIGNvbnN0cnVjdG9yKGFwcFJlZjogQXBwbGljYXRpb25SZWYpIHtcbiAqICAgYXBwUmVmLmlzU3RhYmxlLnBpcGUoXG4gKiAgICAgZmlyc3Qoc3RhYmxlID0+IHN0YWJsZSksXG4gKiAgICAgdGFwKHN0YWJsZSA9PiBjb25zb2xlLmxvZygnQXBwIGlzIHN0YWJsZSBub3cnKSksXG4gKiAgICAgc3dpdGNoTWFwKCgpID0+IGludGVydmFsKDEwMDApKVxuICogICApLnN1YnNjcmliZShjb3VudGVyID0+IGNvbnNvbGUubG9nKGNvdW50ZXIpKTtcbiAqIH1cbiAqIGBgYFxuICogSW4gdGhpcyBleGFtcGxlLCB0aGUgdHJhY2UgXCJBcHAgaXMgc3RhYmxlIG5vd1wiIHdpbGwgYmUgbG9nZ2VkXG4gKiBhbmQgdGhlbiB0aGUgY291bnRlciBzdGFydHMgaW5jcmVtZW50aW5nIGV2ZXJ5IHNlY29uZC5cbiAqXG4gKiBOb3RlIGFsc28gdGhhdCB0aGlzIE9ic2VydmFibGUgcnVucyBvdXRzaWRlIG9mIHRoZSBBbmd1bGFyIHpvbmUsXG4gKiB3aGljaCBtZWFucyB0aGF0IHRoZSBjb2RlIGluIHRoZSBzdWJzY3JpcHRpb25cbiAqIHRvIHRoaXMgT2JzZXJ2YWJsZSB3aWxsIG5vdCB0cmlnZ2VyIHRoZSBjaGFuZ2UgZGV0ZWN0aW9uLlxuICpcbiAqIExldCdzIGltYWdpbmUgdGhhdCBpbnN0ZWFkIG9mIGxvZ2dpbmcgdGhlIGNvdW50ZXIgdmFsdWUsXG4gKiB5b3UgdXBkYXRlIGEgZmllbGQgb2YgeW91ciBjb21wb25lbnRcbiAqIGFuZCBkaXNwbGF5IGl0IGluIGl0cyB0ZW1wbGF0ZS5cbiAqXG4gKiBgYGBcbiAqIGNvbnN0cnVjdG9yKGFwcFJlZjogQXBwbGljYXRpb25SZWYpIHtcbiAqICAgYXBwUmVmLmlzU3RhYmxlLnBpcGUoXG4gKiAgICAgZmlyc3Qoc3RhYmxlID0+IHN0YWJsZSksXG4gKiAgICAgc3dpdGNoTWFwKCgpID0+IGludGVydmFsKDEwMDApKVxuICogICApLnN1YnNjcmliZShjb3VudGVyID0+IHRoaXMudmFsdWUgPSBjb3VudGVyKTtcbiAqIH1cbiAqIGBgYFxuICogQXMgdGhlIGBpc1N0YWJsZWAgT2JzZXJ2YWJsZSBydW5zIG91dHNpZGUgdGhlIHpvbmUsXG4gKiB0aGUgYHZhbHVlYCBmaWVsZCB3aWxsIGJlIHVwZGF0ZWQgcHJvcGVybHksXG4gKiBidXQgdGhlIHRlbXBsYXRlIHdpbGwgbm90IGJlIHJlZnJlc2hlZCFcbiAqXG4gKiBZb3UnbGwgaGF2ZSB0byBtYW51YWxseSB0cmlnZ2VyIHRoZSBjaGFuZ2UgZGV0ZWN0aW9uIHRvIHVwZGF0ZSB0aGUgdGVtcGxhdGUuXG4gKlxuICogYGBgXG4gKiBjb25zdHJ1Y3RvcihhcHBSZWY6IEFwcGxpY2F0aW9uUmVmLCBjZDogQ2hhbmdlRGV0ZWN0b3JSZWYpIHtcbiAqICAgYXBwUmVmLmlzU3RhYmxlLnBpcGUoXG4gKiAgICAgZmlyc3Qoc3RhYmxlID0+IHN0YWJsZSksXG4gKiAgICAgc3dpdGNoTWFwKCgpID0+IGludGVydmFsKDEwMDApKVxuICogICApLnN1YnNjcmliZShjb3VudGVyID0+IHtcbiAqICAgICB0aGlzLnZhbHVlID0gY291bnRlcjtcbiAqICAgICBjZC5kZXRlY3RDaGFuZ2VzKCk7XG4gKiAgIH0pO1xuICogfVxuICogYGBgXG4gKlxuICogT3IgbWFrZSB0aGUgc3Vic2NyaXB0aW9uIGNhbGxiYWNrIHJ1biBpbnNpZGUgdGhlIHpvbmUuXG4gKlxuICogYGBgXG4gKiBjb25zdHJ1Y3RvcihhcHBSZWY6IEFwcGxpY2F0aW9uUmVmLCB6b25lOiBOZ1pvbmUpIHtcbiAqICAgYXBwUmVmLmlzU3RhYmxlLnBpcGUoXG4gKiAgICAgZmlyc3Qoc3RhYmxlID0+IHN0YWJsZSksXG4gKiAgICAgc3dpdGNoTWFwKCgpID0+IGludGVydmFsKDEwMDApKVxuICogICApLnN1YnNjcmliZShjb3VudGVyID0+IHpvbmUucnVuKCgpID0+IHRoaXMudmFsdWUgPSBjb3VudGVyKSk7XG4gKiB9XG4gKiBgYGBcbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbkBJbmplY3RhYmxlKHtwcm92aWRlZEluOiAncm9vdCd9KVxuZXhwb3J0IGNsYXNzIEFwcGxpY2F0aW9uUmVmIHtcbiAgLyoqIEBpbnRlcm5hbCAqL1xuICBwcml2YXRlIF9ib290c3RyYXBMaXN0ZW5lcnM6ICgoY29tcFJlZjogQ29tcG9uZW50UmVmPGFueT4pID0+IHZvaWQpW10gPSBbXTtcbiAgcHJpdmF0ZSBfcnVubmluZ1RpY2s6IGJvb2xlYW4gPSBmYWxzZTtcbiAgcHJpdmF0ZSBfZGVzdHJveWVkID0gZmFsc2U7XG4gIHByaXZhdGUgX2Rlc3Ryb3lMaXN0ZW5lcnM6IEFycmF5PCgpID0+IHZvaWQ+ID0gW107XG4gIC8qKiBAaW50ZXJuYWwgKi9cbiAgX3ZpZXdzOiBJbnRlcm5hbFZpZXdSZWZbXSA9IFtdO1xuICBwcml2YXRlIHJlYWRvbmx5IGludGVybmFsRXJyb3JIYW5kbGVyID0gaW5qZWN0KElOVEVSTkFMX0FQUExJQ0FUSU9OX0VSUk9SX0hBTkRMRVIpO1xuICBwcml2YXRlIHJlYWRvbmx5IHpvbmVJc1N0YWJsZSA9IGluamVjdChaT05FX0lTX1NUQUJMRV9PQlNFUlZBQkxFKTtcblxuICAvKipcbiAgICogSW5kaWNhdGVzIHdoZXRoZXIgdGhpcyBpbnN0YW5jZSB3YXMgZGVzdHJveWVkLlxuICAgKi9cbiAgZ2V0IGRlc3Ryb3llZCgpIHtcbiAgICByZXR1cm4gdGhpcy5fZGVzdHJveWVkO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBhIGxpc3Qgb2YgY29tcG9uZW50IHR5cGVzIHJlZ2lzdGVyZWQgdG8gdGhpcyBhcHBsaWNhdGlvbi5cbiAgICogVGhpcyBsaXN0IGlzIHBvcHVsYXRlZCBldmVuIGJlZm9yZSB0aGUgY29tcG9uZW50IGlzIGNyZWF0ZWQuXG4gICAqL1xuICBwdWJsaWMgcmVhZG9ubHkgY29tcG9uZW50VHlwZXM6IFR5cGU8YW55PltdID0gW107XG5cbiAgLyoqXG4gICAqIEdldCBhIGxpc3Qgb2YgY29tcG9uZW50cyByZWdpc3RlcmVkIHRvIHRoaXMgYXBwbGljYXRpb24uXG4gICAqL1xuICBwdWJsaWMgcmVhZG9ubHkgY29tcG9uZW50czogQ29tcG9uZW50UmVmPGFueT5bXSA9IFtdO1xuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGFuIE9ic2VydmFibGUgdGhhdCBpbmRpY2F0ZXMgd2hlbiB0aGUgYXBwbGljYXRpb24gaXMgc3RhYmxlIG9yIHVuc3RhYmxlLlxuICAgKi9cbiAgcHVibGljIHJlYWRvbmx5IGlzU3RhYmxlOiBPYnNlcnZhYmxlPGJvb2xlYW4+ID1cbiAgICAgIGluamVjdChJbml0aWFsUmVuZGVyUGVuZGluZ1Rhc2tzKVxuICAgICAgICAgIC5oYXNQZW5kaW5nVGFza3MucGlwZShcbiAgICAgICAgICAgICAgbWVyZ2VNYXAoaGFzUGVuZGluZ1Rhc2tzID0+IGhhc1BlbmRpbmdUYXNrcyA/IG9mKGZhbHNlKSA6IHRoaXMuem9uZUlzU3RhYmxlKSxcbiAgICAgICAgICAgICAgZGlzdGluY3RVbnRpbENoYW5nZWQoKSxcbiAgICAgICAgICAgICAgc2hhcmUoKSxcbiAgICAgICAgICApO1xuXG4gIHByaXZhdGUgcmVhZG9ubHkgX2luamVjdG9yID0gaW5qZWN0KEVudmlyb25tZW50SW5qZWN0b3IpO1xuICAvKipcbiAgICogVGhlIGBFbnZpcm9ubWVudEluamVjdG9yYCB1c2VkIHRvIGNyZWF0ZSB0aGlzIGFwcGxpY2F0aW9uLlxuICAgKi9cbiAgZ2V0IGluamVjdG9yKCk6IEVudmlyb25tZW50SW5qZWN0b3Ige1xuICAgIHJldHVybiB0aGlzLl9pbmplY3RvcjtcbiAgfVxuXG4gIC8qKlxuICAgKiBCb290c3RyYXAgYSBjb21wb25lbnQgb250byB0aGUgZWxlbWVudCBpZGVudGlmaWVkIGJ5IGl0cyBzZWxlY3RvciBvciwgb3B0aW9uYWxseSwgdG8gYVxuICAgKiBzcGVjaWZpZWQgZWxlbWVudC5cbiAgICpcbiAgICogQHVzYWdlTm90ZXNcbiAgICogIyMjIEJvb3RzdHJhcCBwcm9jZXNzXG4gICAqXG4gICAqIFdoZW4gYm9vdHN0cmFwcGluZyBhIGNvbXBvbmVudCwgQW5ndWxhciBtb3VudHMgaXQgb250byBhIHRhcmdldCBET00gZWxlbWVudFxuICAgKiBhbmQga2lja3Mgb2ZmIGF1dG9tYXRpYyBjaGFuZ2UgZGV0ZWN0aW9uLiBUaGUgdGFyZ2V0IERPTSBlbGVtZW50IGNhbiBiZVxuICAgKiBwcm92aWRlZCB1c2luZyB0aGUgYHJvb3RTZWxlY3Rvck9yTm9kZWAgYXJndW1lbnQuXG4gICAqXG4gICAqIElmIHRoZSB0YXJnZXQgRE9NIGVsZW1lbnQgaXMgbm90IHByb3ZpZGVkLCBBbmd1bGFyIHRyaWVzIHRvIGZpbmQgb25lIG9uIGEgcGFnZVxuICAgKiB1c2luZyB0aGUgYHNlbGVjdG9yYCBvZiB0aGUgY29tcG9uZW50IHRoYXQgaXMgYmVpbmcgYm9vdHN0cmFwcGVkXG4gICAqIChmaXJzdCBtYXRjaGVkIGVsZW1lbnQgaXMgdXNlZCkuXG4gICAqXG4gICAqICMjIyBFeGFtcGxlXG4gICAqXG4gICAqIEdlbmVyYWxseSwgd2UgZGVmaW5lIHRoZSBjb21wb25lbnQgdG8gYm9vdHN0cmFwIGluIHRoZSBgYm9vdHN0cmFwYCBhcnJheSBvZiBgTmdNb2R1bGVgLFxuICAgKiBidXQgaXQgcmVxdWlyZXMgdXMgdG8ga25vdyB0aGUgY29tcG9uZW50IHdoaWxlIHdyaXRpbmcgdGhlIGFwcGxpY2F0aW9uIGNvZGUuXG4gICAqXG4gICAqIEltYWdpbmUgYSBzaXR1YXRpb24gd2hlcmUgd2UgaGF2ZSB0byB3YWl0IGZvciBhbiBBUEkgY2FsbCB0byBkZWNpZGUgYWJvdXQgdGhlIGNvbXBvbmVudCB0b1xuICAgKiBib290c3RyYXAuIFdlIGNhbiB1c2UgdGhlIGBuZ0RvQm9vdHN0cmFwYCBob29rIG9mIHRoZSBgTmdNb2R1bGVgIGFuZCBjYWxsIHRoaXMgbWV0aG9kIHRvXG4gICAqIGR5bmFtaWNhbGx5IGJvb3RzdHJhcCBhIGNvbXBvbmVudC5cbiAgICpcbiAgICoge0BleGFtcGxlIGNvcmUvdHMvcGxhdGZvcm0vcGxhdGZvcm0udHMgcmVnaW9uPSdjb21wb25lbnRTZWxlY3Rvcid9XG4gICAqXG4gICAqIE9wdGlvbmFsbHksIGEgY29tcG9uZW50IGNhbiBiZSBtb3VudGVkIG9udG8gYSBET00gZWxlbWVudCB0aGF0IGRvZXMgbm90IG1hdGNoIHRoZVxuICAgKiBzZWxlY3RvciBvZiB0aGUgYm9vdHN0cmFwcGVkIGNvbXBvbmVudC5cbiAgICpcbiAgICogSW4gdGhlIGZvbGxvd2luZyBleGFtcGxlLCB3ZSBhcmUgcHJvdmlkaW5nIGEgQ1NTIHNlbGVjdG9yIHRvIG1hdGNoIHRoZSB0YXJnZXQgZWxlbWVudC5cbiAgICpcbiAgICoge0BleGFtcGxlIGNvcmUvdHMvcGxhdGZvcm0vcGxhdGZvcm0udHMgcmVnaW9uPSdjc3NTZWxlY3Rvcid9XG4gICAqXG4gICAqIFdoaWxlIGluIHRoaXMgZXhhbXBsZSwgd2UgYXJlIHByb3ZpZGluZyByZWZlcmVuY2UgdG8gYSBET00gbm9kZS5cbiAgICpcbiAgICoge0BleGFtcGxlIGNvcmUvdHMvcGxhdGZvcm0vcGxhdGZvcm0udHMgcmVnaW9uPSdkb21Ob2RlJ31cbiAgICovXG4gIGJvb3RzdHJhcDxDPihjb21wb25lbnQ6IFR5cGU8Qz4sIHJvb3RTZWxlY3Rvck9yTm9kZT86IHN0cmluZ3xhbnkpOiBDb21wb25lbnRSZWY8Qz47XG5cbiAgLyoqXG4gICAqIEJvb3RzdHJhcCBhIGNvbXBvbmVudCBvbnRvIHRoZSBlbGVtZW50IGlkZW50aWZpZWQgYnkgaXRzIHNlbGVjdG9yIG9yLCBvcHRpb25hbGx5LCB0byBhXG4gICAqIHNwZWNpZmllZCBlbGVtZW50LlxuICAgKlxuICAgKiBAdXNhZ2VOb3Rlc1xuICAgKiAjIyMgQm9vdHN0cmFwIHByb2Nlc3NcbiAgICpcbiAgICogV2hlbiBib290c3RyYXBwaW5nIGEgY29tcG9uZW50LCBBbmd1bGFyIG1vdW50cyBpdCBvbnRvIGEgdGFyZ2V0IERPTSBlbGVtZW50XG4gICAqIGFuZCBraWNrcyBvZmYgYXV0b21hdGljIGNoYW5nZSBkZXRlY3Rpb24uIFRoZSB0YXJnZXQgRE9NIGVsZW1lbnQgY2FuIGJlXG4gICAqIHByb3ZpZGVkIHVzaW5nIHRoZSBgcm9vdFNlbGVjdG9yT3JOb2RlYCBhcmd1bWVudC5cbiAgICpcbiAgICogSWYgdGhlIHRhcmdldCBET00gZWxlbWVudCBpcyBub3QgcHJvdmlkZWQsIEFuZ3VsYXIgdHJpZXMgdG8gZmluZCBvbmUgb24gYSBwYWdlXG4gICAqIHVzaW5nIHRoZSBgc2VsZWN0b3JgIG9mIHRoZSBjb21wb25lbnQgdGhhdCBpcyBiZWluZyBib290c3RyYXBwZWRcbiAgICogKGZpcnN0IG1hdGNoZWQgZWxlbWVudCBpcyB1c2VkKS5cbiAgICpcbiAgICogIyMjIEV4YW1wbGVcbiAgICpcbiAgICogR2VuZXJhbGx5LCB3ZSBkZWZpbmUgdGhlIGNvbXBvbmVudCB0byBib290c3RyYXAgaW4gdGhlIGBib290c3RyYXBgIGFycmF5IG9mIGBOZ01vZHVsZWAsXG4gICAqIGJ1dCBpdCByZXF1aXJlcyB1cyB0byBrbm93IHRoZSBjb21wb25lbnQgd2hpbGUgd3JpdGluZyB0aGUgYXBwbGljYXRpb24gY29kZS5cbiAgICpcbiAgICogSW1hZ2luZSBhIHNpdHVhdGlvbiB3aGVyZSB3ZSBoYXZlIHRvIHdhaXQgZm9yIGFuIEFQSSBjYWxsIHRvIGRlY2lkZSBhYm91dCB0aGUgY29tcG9uZW50IHRvXG4gICAqIGJvb3RzdHJhcC4gV2UgY2FuIHVzZSB0aGUgYG5nRG9Cb290c3RyYXBgIGhvb2sgb2YgdGhlIGBOZ01vZHVsZWAgYW5kIGNhbGwgdGhpcyBtZXRob2QgdG9cbiAgICogZHluYW1pY2FsbHkgYm9vdHN0cmFwIGEgY29tcG9uZW50LlxuICAgKlxuICAgKiB7QGV4YW1wbGUgY29yZS90cy9wbGF0Zm9ybS9wbGF0Zm9ybS50cyByZWdpb249J2NvbXBvbmVudFNlbGVjdG9yJ31cbiAgICpcbiAgICogT3B0aW9uYWxseSwgYSBjb21wb25lbnQgY2FuIGJlIG1vdW50ZWQgb250byBhIERPTSBlbGVtZW50IHRoYXQgZG9lcyBub3QgbWF0Y2ggdGhlXG4gICAqIHNlbGVjdG9yIG9mIHRoZSBib290c3RyYXBwZWQgY29tcG9uZW50LlxuICAgKlxuICAgKiBJbiB0aGUgZm9sbG93aW5nIGV4YW1wbGUsIHdlIGFyZSBwcm92aWRpbmcgYSBDU1Mgc2VsZWN0b3IgdG8gbWF0Y2ggdGhlIHRhcmdldCBlbGVtZW50LlxuICAgKlxuICAgKiB7QGV4YW1wbGUgY29yZS90cy9wbGF0Zm9ybS9wbGF0Zm9ybS50cyByZWdpb249J2Nzc1NlbGVjdG9yJ31cbiAgICpcbiAgICogV2hpbGUgaW4gdGhpcyBleGFtcGxlLCB3ZSBhcmUgcHJvdmlkaW5nIHJlZmVyZW5jZSB0byBhIERPTSBub2RlLlxuICAgKlxuICAgKiB7QGV4YW1wbGUgY29yZS90cy9wbGF0Zm9ybS9wbGF0Zm9ybS50cyByZWdpb249J2RvbU5vZGUnfVxuICAgKlxuICAgKiBAZGVwcmVjYXRlZCBQYXNzaW5nIENvbXBvbmVudCBmYWN0b3JpZXMgYXMgdGhlIGBBcHBsaWNhdGlvbi5ib290c3RyYXBgIGZ1bmN0aW9uIGFyZ3VtZW50IGlzXG4gICAqICAgICBkZXByZWNhdGVkLiBQYXNzIENvbXBvbmVudCBUeXBlcyBpbnN0ZWFkLlxuICAgKi9cbiAgYm9vdHN0cmFwPEM+KGNvbXBvbmVudEZhY3Rvcnk6IENvbXBvbmVudEZhY3Rvcnk8Qz4sIHJvb3RTZWxlY3Rvck9yTm9kZT86IHN0cmluZ3xhbnkpOlxuICAgICAgQ29tcG9uZW50UmVmPEM+O1xuXG4gIC8qKlxuICAgKiBCb290c3RyYXAgYSBjb21wb25lbnQgb250byB0aGUgZWxlbWVudCBpZGVudGlmaWVkIGJ5IGl0cyBzZWxlY3RvciBvciwgb3B0aW9uYWxseSwgdG8gYVxuICAgKiBzcGVjaWZpZWQgZWxlbWVudC5cbiAgICpcbiAgICogQHVzYWdlTm90ZXNcbiAgICogIyMjIEJvb3RzdHJhcCBwcm9jZXNzXG4gICAqXG4gICAqIFdoZW4gYm9vdHN0cmFwcGluZyBhIGNvbXBvbmVudCwgQW5ndWxhciBtb3VudHMgaXQgb250byBhIHRhcmdldCBET00gZWxlbWVudFxuICAgKiBhbmQga2lja3Mgb2ZmIGF1dG9tYXRpYyBjaGFuZ2UgZGV0ZWN0aW9uLiBUaGUgdGFyZ2V0IERPTSBlbGVtZW50IGNhbiBiZVxuICAgKiBwcm92aWRlZCB1c2luZyB0aGUgYHJvb3RTZWxlY3Rvck9yTm9kZWAgYXJndW1lbnQuXG4gICAqXG4gICAqIElmIHRoZSB0YXJnZXQgRE9NIGVsZW1lbnQgaXMgbm90IHByb3ZpZGVkLCBBbmd1bGFyIHRyaWVzIHRvIGZpbmQgb25lIG9uIGEgcGFnZVxuICAgKiB1c2luZyB0aGUgYHNlbGVjdG9yYCBvZiB0aGUgY29tcG9uZW50IHRoYXQgaXMgYmVpbmcgYm9vdHN0cmFwcGVkXG4gICAqIChmaXJzdCBtYXRjaGVkIGVsZW1lbnQgaXMgdXNlZCkuXG4gICAqXG4gICAqICMjIyBFeGFtcGxlXG4gICAqXG4gICAqIEdlbmVyYWxseSwgd2UgZGVmaW5lIHRoZSBjb21wb25lbnQgdG8gYm9vdHN0cmFwIGluIHRoZSBgYm9vdHN0cmFwYCBhcnJheSBvZiBgTmdNb2R1bGVgLFxuICAgKiBidXQgaXQgcmVxdWlyZXMgdXMgdG8ga25vdyB0aGUgY29tcG9uZW50IHdoaWxlIHdyaXRpbmcgdGhlIGFwcGxpY2F0aW9uIGNvZGUuXG4gICAqXG4gICAqIEltYWdpbmUgYSBzaXR1YXRpb24gd2hlcmUgd2UgaGF2ZSB0byB3YWl0IGZvciBhbiBBUEkgY2FsbCB0byBkZWNpZGUgYWJvdXQgdGhlIGNvbXBvbmVudCB0b1xuICAgKiBib290c3RyYXAuIFdlIGNhbiB1c2UgdGhlIGBuZ0RvQm9vdHN0cmFwYCBob29rIG9mIHRoZSBgTmdNb2R1bGVgIGFuZCBjYWxsIHRoaXMgbWV0aG9kIHRvXG4gICAqIGR5bmFtaWNhbGx5IGJvb3RzdHJhcCBhIGNvbXBvbmVudC5cbiAgICpcbiAgICoge0BleGFtcGxlIGNvcmUvdHMvcGxhdGZvcm0vcGxhdGZvcm0udHMgcmVnaW9uPSdjb21wb25lbnRTZWxlY3Rvcid9XG4gICAqXG4gICAqIE9wdGlvbmFsbHksIGEgY29tcG9uZW50IGNhbiBiZSBtb3VudGVkIG9udG8gYSBET00gZWxlbWVudCB0aGF0IGRvZXMgbm90IG1hdGNoIHRoZVxuICAgKiBzZWxlY3RvciBvZiB0aGUgYm9vdHN0cmFwcGVkIGNvbXBvbmVudC5cbiAgICpcbiAgICogSW4gdGhlIGZvbGxvd2luZyBleGFtcGxlLCB3ZSBhcmUgcHJvdmlkaW5nIGEgQ1NTIHNlbGVjdG9yIHRvIG1hdGNoIHRoZSB0YXJnZXQgZWxlbWVudC5cbiAgICpcbiAgICoge0BleGFtcGxlIGNvcmUvdHMvcGxhdGZvcm0vcGxhdGZvcm0udHMgcmVnaW9uPSdjc3NTZWxlY3Rvcid9XG4gICAqXG4gICAqIFdoaWxlIGluIHRoaXMgZXhhbXBsZSwgd2UgYXJlIHByb3ZpZGluZyByZWZlcmVuY2UgdG8gYSBET00gbm9kZS5cbiAgICpcbiAgICoge0BleGFtcGxlIGNvcmUvdHMvcGxhdGZvcm0vcGxhdGZvcm0udHMgcmVnaW9uPSdkb21Ob2RlJ31cbiAgICovXG4gIGJvb3RzdHJhcDxDPihjb21wb25lbnRPckZhY3Rvcnk6IENvbXBvbmVudEZhY3Rvcnk8Qz58VHlwZTxDPiwgcm9vdFNlbGVjdG9yT3JOb2RlPzogc3RyaW5nfGFueSk6XG4gICAgICBDb21wb25lbnRSZWY8Qz4ge1xuICAgICh0eXBlb2YgbmdEZXZNb2RlID09PSAndW5kZWZpbmVkJyB8fCBuZ0Rldk1vZGUpICYmIHRoaXMud2FybklmRGVzdHJveWVkKCk7XG4gICAgY29uc3QgaXNDb21wb25lbnRGYWN0b3J5ID0gY29tcG9uZW50T3JGYWN0b3J5IGluc3RhbmNlb2YgQ29tcG9uZW50RmFjdG9yeTtcbiAgICBjb25zdCBpbml0U3RhdHVzID0gdGhpcy5faW5qZWN0b3IuZ2V0KEFwcGxpY2F0aW9uSW5pdFN0YXR1cyk7XG5cbiAgICBpZiAoIWluaXRTdGF0dXMuZG9uZSkge1xuICAgICAgY29uc3Qgc3RhbmRhbG9uZSA9ICFpc0NvbXBvbmVudEZhY3RvcnkgJiYgaXNTdGFuZGFsb25lKGNvbXBvbmVudE9yRmFjdG9yeSk7XG4gICAgICBjb25zdCBlcnJvck1lc3NhZ2UgPVxuICAgICAgICAgICdDYW5ub3QgYm9vdHN0cmFwIGFzIHRoZXJlIGFyZSBzdGlsbCBhc3luY2hyb25vdXMgaW5pdGlhbGl6ZXJzIHJ1bm5pbmcuJyArXG4gICAgICAgICAgKHN0YW5kYWxvbmUgPyAnJyA6XG4gICAgICAgICAgICAgICAgICAgICAgICAnIEJvb3RzdHJhcCBjb21wb25lbnRzIGluIHRoZSBgbmdEb0Jvb3RzdHJhcGAgbWV0aG9kIG9mIHRoZSByb290IG1vZHVsZS4nKTtcbiAgICAgIHRocm93IG5ldyBSdW50aW1lRXJyb3IoXG4gICAgICAgICAgUnVudGltZUVycm9yQ29kZS5BU1lOQ19JTklUSUFMSVpFUlNfU1RJTExfUlVOTklORyxcbiAgICAgICAgICAodHlwZW9mIG5nRGV2TW9kZSA9PT0gJ3VuZGVmaW5lZCcgfHwgbmdEZXZNb2RlKSAmJiBlcnJvck1lc3NhZ2UpO1xuICAgIH1cblxuICAgIGxldCBjb21wb25lbnRGYWN0b3J5OiBDb21wb25lbnRGYWN0b3J5PEM+O1xuICAgIGlmIChpc0NvbXBvbmVudEZhY3RvcnkpIHtcbiAgICAgIGNvbXBvbmVudEZhY3RvcnkgPSBjb21wb25lbnRPckZhY3Rvcnk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IHJlc29sdmVyID0gdGhpcy5faW5qZWN0b3IuZ2V0KENvbXBvbmVudEZhY3RvcnlSZXNvbHZlcik7XG4gICAgICBjb21wb25lbnRGYWN0b3J5ID0gcmVzb2x2ZXIucmVzb2x2ZUNvbXBvbmVudEZhY3RvcnkoY29tcG9uZW50T3JGYWN0b3J5KSE7XG4gICAgfVxuICAgIHRoaXMuY29tcG9uZW50VHlwZXMucHVzaChjb21wb25lbnRGYWN0b3J5LmNvbXBvbmVudFR5cGUpO1xuXG4gICAgLy8gQ3JlYXRlIGEgZmFjdG9yeSBhc3NvY2lhdGVkIHdpdGggdGhlIGN1cnJlbnQgbW9kdWxlIGlmIGl0J3Mgbm90IGJvdW5kIHRvIHNvbWUgb3RoZXJcbiAgICBjb25zdCBuZ01vZHVsZSA9XG4gICAgICAgIGlzQm91bmRUb01vZHVsZShjb21wb25lbnRGYWN0b3J5KSA/IHVuZGVmaW5lZCA6IHRoaXMuX2luamVjdG9yLmdldChOZ01vZHVsZVJlZik7XG4gICAgY29uc3Qgc2VsZWN0b3JPck5vZGUgPSByb290U2VsZWN0b3JPck5vZGUgfHwgY29tcG9uZW50RmFjdG9yeS5zZWxlY3RvcjtcbiAgICBjb25zdCBjb21wUmVmID0gY29tcG9uZW50RmFjdG9yeS5jcmVhdGUoSW5qZWN0b3IuTlVMTCwgW10sIHNlbGVjdG9yT3JOb2RlLCBuZ01vZHVsZSk7XG4gICAgY29uc3QgbmF0aXZlRWxlbWVudCA9IGNvbXBSZWYubG9jYXRpb24ubmF0aXZlRWxlbWVudDtcbiAgICBjb25zdCB0ZXN0YWJpbGl0eSA9IGNvbXBSZWYuaW5qZWN0b3IuZ2V0KFRFU1RBQklMSVRZLCBudWxsKTtcbiAgICB0ZXN0YWJpbGl0eT8ucmVnaXN0ZXJBcHBsaWNhdGlvbihuYXRpdmVFbGVtZW50KTtcblxuICAgIGNvbXBSZWYub25EZXN0cm95KCgpID0+IHtcbiAgICAgIHRoaXMuZGV0YWNoVmlldyhjb21wUmVmLmhvc3RWaWV3KTtcbiAgICAgIHJlbW92ZSh0aGlzLmNvbXBvbmVudHMsIGNvbXBSZWYpO1xuICAgICAgdGVzdGFiaWxpdHk/LnVucmVnaXN0ZXJBcHBsaWNhdGlvbihuYXRpdmVFbGVtZW50KTtcbiAgICB9KTtcblxuICAgIHRoaXMuX2xvYWRDb21wb25lbnQoY29tcFJlZik7XG4gICAgaWYgKHR5cGVvZiBuZ0Rldk1vZGUgPT09ICd1bmRlZmluZWQnIHx8IG5nRGV2TW9kZSkge1xuICAgICAgY29uc3QgX2NvbnNvbGUgPSB0aGlzLl9pbmplY3Rvci5nZXQoQ29uc29sZSk7XG4gICAgICBfY29uc29sZS5sb2coYEFuZ3VsYXIgaXMgcnVubmluZyBpbiBkZXZlbG9wbWVudCBtb2RlLmApO1xuICAgIH1cbiAgICByZXR1cm4gY29tcFJlZjtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbnZva2UgdGhpcyBtZXRob2QgdG8gZXhwbGljaXRseSBwcm9jZXNzIGNoYW5nZSBkZXRlY3Rpb24gYW5kIGl0cyBzaWRlLWVmZmVjdHMuXG4gICAqXG4gICAqIEluIGRldmVsb3BtZW50IG1vZGUsIGB0aWNrKClgIGFsc28gcGVyZm9ybXMgYSBzZWNvbmQgY2hhbmdlIGRldGVjdGlvbiBjeWNsZSB0byBlbnN1cmUgdGhhdCBub1xuICAgKiBmdXJ0aGVyIGNoYW5nZXMgYXJlIGRldGVjdGVkLiBJZiBhZGRpdGlvbmFsIGNoYW5nZXMgYXJlIHBpY2tlZCB1cCBkdXJpbmcgdGhpcyBzZWNvbmQgY3ljbGUsXG4gICAqIGJpbmRpbmdzIGluIHRoZSBhcHAgaGF2ZSBzaWRlLWVmZmVjdHMgdGhhdCBjYW5ub3QgYmUgcmVzb2x2ZWQgaW4gYSBzaW5nbGUgY2hhbmdlIGRldGVjdGlvblxuICAgKiBwYXNzLlxuICAgKiBJbiB0aGlzIGNhc2UsIEFuZ3VsYXIgdGhyb3dzIGFuIGVycm9yLCBzaW5jZSBhbiBBbmd1bGFyIGFwcGxpY2F0aW9uIGNhbiBvbmx5IGhhdmUgb25lIGNoYW5nZVxuICAgKiBkZXRlY3Rpb24gcGFzcyBkdXJpbmcgd2hpY2ggYWxsIGNoYW5nZSBkZXRlY3Rpb24gbXVzdCBjb21wbGV0ZS5cbiAgICovXG4gIHRpY2soKTogdm9pZCB7XG4gICAgKHR5cGVvZiBuZ0Rldk1vZGUgPT09ICd1bmRlZmluZWQnIHx8IG5nRGV2TW9kZSkgJiYgdGhpcy53YXJuSWZEZXN0cm95ZWQoKTtcbiAgICBpZiAodGhpcy5fcnVubmluZ1RpY2spIHtcbiAgICAgIHRocm93IG5ldyBSdW50aW1lRXJyb3IoXG4gICAgICAgICAgUnVudGltZUVycm9yQ29kZS5SRUNVUlNJVkVfQVBQTElDQVRJT05fUkVGX1RJQ0ssXG4gICAgICAgICAgbmdEZXZNb2RlICYmICdBcHBsaWNhdGlvblJlZi50aWNrIGlzIGNhbGxlZCByZWN1cnNpdmVseScpO1xuICAgIH1cblxuICAgIHRyeSB7XG4gICAgICB0aGlzLl9ydW5uaW5nVGljayA9IHRydWU7XG4gICAgICBmb3IgKGxldCB2aWV3IG9mIHRoaXMuX3ZpZXdzKSB7XG4gICAgICAgIHZpZXcuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgfVxuICAgICAgaWYgKHR5cGVvZiBuZ0Rldk1vZGUgPT09ICd1bmRlZmluZWQnIHx8IG5nRGV2TW9kZSkge1xuICAgICAgICBmb3IgKGxldCB2aWV3IG9mIHRoaXMuX3ZpZXdzKSB7XG4gICAgICAgICAgdmlldy5jaGVja05vQ2hhbmdlcygpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgLy8gQXR0ZW50aW9uOiBEb24ndCByZXRocm93IGFzIGl0IGNvdWxkIGNhbmNlbCBzdWJzY3JpcHRpb25zIHRvIE9ic2VydmFibGVzIVxuICAgICAgdGhpcy5pbnRlcm5hbEVycm9ySGFuZGxlcihlKTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgdGhpcy5fcnVubmluZ1RpY2sgPSBmYWxzZTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQXR0YWNoZXMgYSB2aWV3IHNvIHRoYXQgaXQgd2lsbCBiZSBkaXJ0eSBjaGVja2VkLlxuICAgKiBUaGUgdmlldyB3aWxsIGJlIGF1dG9tYXRpY2FsbHkgZGV0YWNoZWQgd2hlbiBpdCBpcyBkZXN0cm95ZWQuXG4gICAqIFRoaXMgd2lsbCB0aHJvdyBpZiB0aGUgdmlldyBpcyBhbHJlYWR5IGF0dGFjaGVkIHRvIGEgVmlld0NvbnRhaW5lci5cbiAgICovXG4gIGF0dGFjaFZpZXcodmlld1JlZjogVmlld1JlZik6IHZvaWQge1xuICAgICh0eXBlb2YgbmdEZXZNb2RlID09PSAndW5kZWZpbmVkJyB8fCBuZ0Rldk1vZGUpICYmIHRoaXMud2FybklmRGVzdHJveWVkKCk7XG4gICAgY29uc3QgdmlldyA9ICh2aWV3UmVmIGFzIEludGVybmFsVmlld1JlZik7XG4gICAgdGhpcy5fdmlld3MucHVzaCh2aWV3KTtcbiAgICB2aWV3LmF0dGFjaFRvQXBwUmVmKHRoaXMpO1xuICB9XG5cbiAgLyoqXG4gICAqIERldGFjaGVzIGEgdmlldyBmcm9tIGRpcnR5IGNoZWNraW5nIGFnYWluLlxuICAgKi9cbiAgZGV0YWNoVmlldyh2aWV3UmVmOiBWaWV3UmVmKTogdm9pZCB7XG4gICAgKHR5cGVvZiBuZ0Rldk1vZGUgPT09ICd1bmRlZmluZWQnIHx8IG5nRGV2TW9kZSkgJiYgdGhpcy53YXJuSWZEZXN0cm95ZWQoKTtcbiAgICBjb25zdCB2aWV3ID0gKHZpZXdSZWYgYXMgSW50ZXJuYWxWaWV3UmVmKTtcbiAgICByZW1vdmUodGhpcy5fdmlld3MsIHZpZXcpO1xuICAgIHZpZXcuZGV0YWNoRnJvbUFwcFJlZigpO1xuICB9XG5cbiAgcHJpdmF0ZSBfbG9hZENvbXBvbmVudChjb21wb25lbnRSZWY6IENvbXBvbmVudFJlZjxhbnk+KTogdm9pZCB7XG4gICAgdGhpcy5hdHRhY2hWaWV3KGNvbXBvbmVudFJlZi5ob3N0Vmlldyk7XG4gICAgdGhpcy50aWNrKCk7XG4gICAgdGhpcy5jb21wb25lbnRzLnB1c2goY29tcG9uZW50UmVmKTtcbiAgICAvLyBHZXQgdGhlIGxpc3RlbmVycyBsYXppbHkgdG8gcHJldmVudCBESSBjeWNsZXMuXG4gICAgY29uc3QgbGlzdGVuZXJzID0gdGhpcy5faW5qZWN0b3IuZ2V0KEFQUF9CT09UU1RSQVBfTElTVEVORVIsIFtdKTtcbiAgICBpZiAobmdEZXZNb2RlICYmICFBcnJheS5pc0FycmF5KGxpc3RlbmVycykpIHtcbiAgICAgIHRocm93IG5ldyBSdW50aW1lRXJyb3IoXG4gICAgICAgICAgUnVudGltZUVycm9yQ29kZS5JTlZBTElEX01VTFRJX1BST1ZJREVSLFxuICAgICAgICAgICdVbmV4cGVjdGVkIHR5cGUgb2YgdGhlIGBBUFBfQk9PVFNUUkFQX0xJU1RFTkVSYCB0b2tlbiB2YWx1ZSAnICtcbiAgICAgICAgICAgICAgYChleHBlY3RlZCBhbiBhcnJheSwgYnV0IGdvdCAke3R5cGVvZiBsaXN0ZW5lcnN9KS4gYCArXG4gICAgICAgICAgICAgICdQbGVhc2UgY2hlY2sgdGhhdCB0aGUgYEFQUF9CT09UU1RSQVBfTElTVEVORVJgIHRva2VuIGlzIGNvbmZpZ3VyZWQgYXMgYSAnICtcbiAgICAgICAgICAgICAgJ2BtdWx0aTogdHJ1ZWAgcHJvdmlkZXIuJyk7XG4gICAgfVxuICAgIGxpc3RlbmVycy5wdXNoKC4uLnRoaXMuX2Jvb3RzdHJhcExpc3RlbmVycyk7XG4gICAgbGlzdGVuZXJzLmZvckVhY2goKGxpc3RlbmVyKSA9PiBsaXN0ZW5lcihjb21wb25lbnRSZWYpKTtcbiAgfVxuXG4gIC8qKiBAaW50ZXJuYWwgKi9cbiAgbmdPbkRlc3Ryb3koKSB7XG4gICAgaWYgKHRoaXMuX2Rlc3Ryb3llZCkgcmV0dXJuO1xuXG4gICAgdHJ5IHtcbiAgICAgIC8vIENhbGwgYWxsIHRoZSBsaWZlY3ljbGUgaG9va3MuXG4gICAgICB0aGlzLl9kZXN0cm95TGlzdGVuZXJzLmZvckVhY2gobGlzdGVuZXIgPT4gbGlzdGVuZXIoKSk7XG5cbiAgICAgIC8vIERlc3Ryb3kgYWxsIHJlZ2lzdGVyZWQgdmlld3MuXG4gICAgICB0aGlzLl92aWV3cy5zbGljZSgpLmZvckVhY2goKHZpZXcpID0+IHZpZXcuZGVzdHJveSgpKTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgLy8gSW5kaWNhdGUgdGhhdCB0aGlzIGluc3RhbmNlIGlzIGRlc3Ryb3llZC5cbiAgICAgIHRoaXMuX2Rlc3Ryb3llZCA9IHRydWU7XG5cbiAgICAgIC8vIFJlbGVhc2UgYWxsIHJlZmVyZW5jZXMuXG4gICAgICB0aGlzLl92aWV3cyA9IFtdO1xuICAgICAgdGhpcy5fYm9vdHN0cmFwTGlzdGVuZXJzID0gW107XG4gICAgICB0aGlzLl9kZXN0cm95TGlzdGVuZXJzID0gW107XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFJlZ2lzdGVycyBhIGxpc3RlbmVyIHRvIGJlIGNhbGxlZCB3aGVuIGFuIGluc3RhbmNlIGlzIGRlc3Ryb3llZC5cbiAgICpcbiAgICogQHBhcmFtIGNhbGxiYWNrIEEgY2FsbGJhY2sgZnVuY3Rpb24gdG8gYWRkIGFzIGEgbGlzdGVuZXIuXG4gICAqIEByZXR1cm5zIEEgZnVuY3Rpb24gd2hpY2ggdW5yZWdpc3RlcnMgYSBsaXN0ZW5lci5cbiAgICovXG4gIG9uRGVzdHJveShjYWxsYmFjazogKCkgPT4gdm9pZCk6IFZvaWRGdW5jdGlvbiB7XG4gICAgKHR5cGVvZiBuZ0Rldk1vZGUgPT09ICd1bmRlZmluZWQnIHx8IG5nRGV2TW9kZSkgJiYgdGhpcy53YXJuSWZEZXN0cm95ZWQoKTtcbiAgICB0aGlzLl9kZXN0cm95TGlzdGVuZXJzLnB1c2goY2FsbGJhY2spO1xuICAgIHJldHVybiAoKSA9PiByZW1vdmUodGhpcy5fZGVzdHJveUxpc3RlbmVycywgY2FsbGJhY2spO1xuICB9XG5cbiAgLyoqXG4gICAqIERlc3Ryb3lzIGFuIEFuZ3VsYXIgYXBwbGljYXRpb24gcmVwcmVzZW50ZWQgYnkgdGhpcyBgQXBwbGljYXRpb25SZWZgLiBDYWxsaW5nIHRoaXMgZnVuY3Rpb25cbiAgICogd2lsbCBkZXN0cm95IHRoZSBhc3NvY2lhdGVkIGVudmlyb25tZW50IGluamVjdG9ycyBhcyB3ZWxsIGFzIGFsbCB0aGUgYm9vdHN0cmFwcGVkIGNvbXBvbmVudHNcbiAgICogd2l0aCB0aGVpciB2aWV3cy5cbiAgICovXG4gIGRlc3Ryb3koKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuX2Rlc3Ryb3llZCkge1xuICAgICAgdGhyb3cgbmV3IFJ1bnRpbWVFcnJvcihcbiAgICAgICAgICBSdW50aW1lRXJyb3JDb2RlLkFQUExJQ0FUSU9OX1JFRl9BTFJFQURZX0RFU1RST1lFRCxcbiAgICAgICAgICBuZ0Rldk1vZGUgJiYgJ1RoaXMgaW5zdGFuY2Ugb2YgdGhlIGBBcHBsaWNhdGlvblJlZmAgaGFzIGFscmVhZHkgYmVlbiBkZXN0cm95ZWQuJyk7XG4gICAgfVxuXG4gICAgLy8gVGhpcyBpcyBhIHRlbXBvcmFyeSB0eXBlIHRvIHJlcHJlc2VudCBhbiBpbnN0YW5jZSBvZiBhbiBSM0luamVjdG9yLCB3aGljaCBjYW4gYmUgZGVzdHJveWVkLlxuICAgIC8vIFRoZSB0eXBlIHdpbGwgYmUgcmVwbGFjZWQgd2l0aCBhIGRpZmZlcmVudCBvbmUgb25jZSBkZXN0cm95YWJsZSBpbmplY3RvciB0eXBlIGlzIGF2YWlsYWJsZS5cbiAgICB0eXBlIERlc3Ryb3lhYmxlSW5qZWN0b3IgPSBJbmplY3RvciZ7ZGVzdHJveT86IEZ1bmN0aW9uLCBkZXN0cm95ZWQ/OiBib29sZWFufTtcblxuICAgIGNvbnN0IGluamVjdG9yID0gdGhpcy5faW5qZWN0b3IgYXMgRGVzdHJveWFibGVJbmplY3RvcjtcblxuICAgIC8vIENoZWNrIHRoYXQgdGhpcyBpbmplY3RvciBpbnN0YW5jZSBzdXBwb3J0cyBkZXN0cm95IG9wZXJhdGlvbi5cbiAgICBpZiAoaW5qZWN0b3IuZGVzdHJveSAmJiAhaW5qZWN0b3IuZGVzdHJveWVkKSB7XG4gICAgICAvLyBEZXN0cm95aW5nIGFuIHVuZGVybHlpbmcgaW5qZWN0b3Igd2lsbCB0cmlnZ2VyIHRoZSBgbmdPbkRlc3Ryb3lgIGxpZmVjeWNsZVxuICAgICAgLy8gaG9vaywgd2hpY2ggaW52b2tlcyB0aGUgcmVtYWluaW5nIGNsZWFudXAgYWN0aW9ucy5cbiAgICAgIGluamVjdG9yLmRlc3Ryb3koKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgbnVtYmVyIG9mIGF0dGFjaGVkIHZpZXdzLlxuICAgKi9cbiAgZ2V0IHZpZXdDb3VudCgpIHtcbiAgICByZXR1cm4gdGhpcy5fdmlld3MubGVuZ3RoO1xuICB9XG5cbiAgcHJpdmF0ZSB3YXJuSWZEZXN0cm95ZWQoKSB7XG4gICAgaWYgKCh0eXBlb2YgbmdEZXZNb2RlID09PSAndW5kZWZpbmVkJyB8fCBuZ0Rldk1vZGUpICYmIHRoaXMuX2Rlc3Ryb3llZCkge1xuICAgICAgY29uc29sZS53YXJuKGZvcm1hdFJ1bnRpbWVFcnJvcihcbiAgICAgICAgICBSdW50aW1lRXJyb3JDb2RlLkFQUExJQ0FUSU9OX1JFRl9BTFJFQURZX0RFU1RST1lFRCxcbiAgICAgICAgICAnVGhpcyBpbnN0YW5jZSBvZiB0aGUgYEFwcGxpY2F0aW9uUmVmYCBoYXMgYWxyZWFkeSBiZWVuIGRlc3Ryb3llZC4nKSk7XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIHJlbW92ZTxUPihsaXN0OiBUW10sIGVsOiBUKTogdm9pZCB7XG4gIGNvbnN0IGluZGV4ID0gbGlzdC5pbmRleE9mKGVsKTtcbiAgaWYgKGluZGV4ID4gLTEpIHtcbiAgICBsaXN0LnNwbGljZShpbmRleCwgMSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gX2xhc3REZWZpbmVkPFQ+KGFyZ3M6IFRbXSk6IFR8dW5kZWZpbmVkIHtcbiAgZm9yIChsZXQgaSA9IGFyZ3MubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICBpZiAoYXJnc1tpXSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm4gYXJnc1tpXTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHVuZGVmaW5lZDtcbn1cblxuLyoqXG4gKiBgSW5qZWN0aW9uVG9rZW5gIHVzZWQgdG8gY29uZmlndXJlIGhvdyB0byBjYWxsIHRoZSBgRXJyb3JIYW5kbGVyYC5cbiAqXG4gKiBgTmdab25lYCBpcyBwcm92aWRlZCBieSBkZWZhdWx0IHRvZGF5IHNvIHRoZSBkZWZhdWx0IChhbmQgb25seSkgaW1wbGVtZW50YXRpb24gZm9yIHRoaXNcbiAqIGlzIGNhbGxpbmcgYEVycm9ySGFuZGxlci5oYW5kbGVFcnJvcmAgb3V0c2lkZSBvZiB0aGUgQW5ndWxhciB6b25lLlxuICovXG5jb25zdCBJTlRFUk5BTF9BUFBMSUNBVElPTl9FUlJPUl9IQU5ETEVSID0gbmV3IEluamVjdGlvblRva2VuPChlOiBhbnkpID0+IHZvaWQ+KFxuICAgICh0eXBlb2YgbmdEZXZNb2RlID09PSAndW5kZWZpbmVkJyB8fCBuZ0Rldk1vZGUpID8gJ2ludGVybmFsIGVycm9yIGhhbmRsZXInIDogJycsIHtcbiAgICAgIHByb3ZpZGVkSW46ICdyb290JyxcbiAgICAgIGZhY3Rvcnk6ICgpID0+IHtcbiAgICAgICAgY29uc3QgdXNlckVycm9ySGFuZGxlciA9IGluamVjdChFcnJvckhhbmRsZXIpO1xuICAgICAgICByZXR1cm4gdXNlckVycm9ySGFuZGxlci5oYW5kbGVFcnJvci5iaW5kKHRoaXMpO1xuICAgICAgfVxuICAgIH0pO1xuXG5mdW5jdGlvbiBuZ1pvbmVBcHBsaWNhdGlvbkVycm9ySGFuZGxlckZhY3RvcnkoKSB7XG4gIGNvbnN0IHpvbmUgPSBpbmplY3QoTmdab25lKTtcbiAgY29uc3QgdXNlckVycm9ySGFuZGxlciA9IGluamVjdChFcnJvckhhbmRsZXIpO1xuICByZXR1cm4gKGU6IHVua25vd24pID0+IHpvbmUucnVuT3V0c2lkZUFuZ3VsYXIoKCkgPT4gdXNlckVycm9ySGFuZGxlci5oYW5kbGVFcnJvcihlKSk7XG59XG5cbkBJbmplY3RhYmxlKHtwcm92aWRlZEluOiAncm9vdCd9KVxuZXhwb3J0IGNsYXNzIE5nWm9uZUNoYW5nZURldGVjdGlvblNjaGVkdWxlciB7XG4gIHByaXZhdGUgcmVhZG9ubHkgem9uZSA9IGluamVjdChOZ1pvbmUpO1xuICBwcml2YXRlIHJlYWRvbmx5IGFwcGxpY2F0aW9uUmVmID0gaW5qZWN0KEFwcGxpY2F0aW9uUmVmKTtcblxuICBwcml2YXRlIF9vbk1pY3JvdGFza0VtcHR5U3Vic2NyaXB0aW9uPzogU3Vic2NyaXB0aW9uO1xuXG4gIGluaXRpYWxpemUoKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuX29uTWljcm90YXNrRW1wdHlTdWJzY3JpcHRpb24pIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLl9vbk1pY3JvdGFza0VtcHR5U3Vic2NyaXB0aW9uID0gdGhpcy56b25lLm9uTWljcm90YXNrRW1wdHkuc3Vic2NyaWJlKHtcbiAgICAgIG5leHQ6ICgpID0+IHtcbiAgICAgICAgdGhpcy56b25lLnJ1bigoKSA9PiB7XG4gICAgICAgICAgdGhpcy5hcHBsaWNhdGlvblJlZi50aWNrKCk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgbmdPbkRlc3Ryb3koKSB7XG4gICAgdGhpcy5fb25NaWNyb3Rhc2tFbXB0eVN1YnNjcmlwdGlvbj8udW5zdWJzY3JpYmUoKTtcbiAgfVxufVxuXG4vKipcbiAqIEludGVybmFsIHRva2VuIHVzZWQgdG8gdmVyaWZ5IHRoYXQgYHByb3ZpZGVab25lQ2hhbmdlRGV0ZWN0aW9uYCBpcyBub3QgdXNlZFxuICogd2l0aCB0aGUgYm9vdHN0cmFwTW9kdWxlIEFQSS5cbiAqL1xuY29uc3QgUFJPVklERURfTkdfWk9ORSA9IG5ldyBJbmplY3Rpb25Ub2tlbjxib29sZWFuPihcbiAgICAodHlwZW9mIG5nRGV2TW9kZSA9PT0gJ3VuZGVmaW5lZCcgfHwgbmdEZXZNb2RlKSA/ICdwcm92aWRlWm9uZUNoYW5nZURldGVjdGlvbiB0b2tlbicgOiAnJyk7XG5cbmV4cG9ydCBmdW5jdGlvbiBpbnRlcm5hbFByb3ZpZGVab25lQ2hhbmdlRGV0ZWN0aW9uKG5nWm9uZUZhY3Rvcnk6ICgpID0+IE5nWm9uZSk6IFN0YXRpY1Byb3ZpZGVyW10ge1xuICByZXR1cm4gW1xuICAgIHtwcm92aWRlOiBOZ1pvbmUsIHVzZUZhY3Rvcnk6IG5nWm9uZUZhY3Rvcnl9LFxuICAgIHtcbiAgICAgIHByb3ZpZGU6IEVOVklST05NRU5UX0lOSVRJQUxJWkVSLFxuICAgICAgbXVsdGk6IHRydWUsXG4gICAgICB1c2VGYWN0b3J5OiAoKSA9PiB7XG4gICAgICAgIGNvbnN0IG5nWm9uZUNoYW5nZURldGVjdGlvblNjaGVkdWxlciA9XG4gICAgICAgICAgICBpbmplY3QoTmdab25lQ2hhbmdlRGV0ZWN0aW9uU2NoZWR1bGVyLCB7b3B0aW9uYWw6IHRydWV9KTtcbiAgICAgICAgaWYgKCh0eXBlb2YgbmdEZXZNb2RlID09PSAndW5kZWZpbmVkJyB8fCBuZ0Rldk1vZGUpICYmXG4gICAgICAgICAgICBuZ1pvbmVDaGFuZ2VEZXRlY3Rpb25TY2hlZHVsZXIgPT09IG51bGwpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgUnVudGltZUVycm9yKFxuICAgICAgICAgICAgICBSdW50aW1lRXJyb3JDb2RlLk1JU1NJTkdfUkVRVUlSRURfSU5KRUNUQUJMRV9JTl9CT09UU1RSQVAsXG4gICAgICAgICAgICAgIGBBIHJlcXVpcmVkIEluamVjdGFibGUgd2FzIG5vdCBmb3VuZCBpbiB0aGUgZGVwZW5kZW5jeSBpbmplY3Rpb24gdHJlZS4gYCArXG4gICAgICAgICAgICAgICAgICAnSWYgeW91IGFyZSBib290c3RyYXBwaW5nIGFuIE5nTW9kdWxlLCBtYWtlIHN1cmUgdGhhdCB0aGUgYEJyb3dzZXJNb2R1bGVgIGlzIGltcG9ydGVkLicpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAoKSA9PiBuZ1pvbmVDaGFuZ2VEZXRlY3Rpb25TY2hlZHVsZXIhLmluaXRpYWxpemUoKTtcbiAgICAgIH0sXG4gICAgfSxcbiAgICB7cHJvdmlkZTogSU5URVJOQUxfQVBQTElDQVRJT05fRVJST1JfSEFORExFUiwgdXNlRmFjdG9yeTogbmdab25lQXBwbGljYXRpb25FcnJvckhhbmRsZXJGYWN0b3J5fSxcbiAgICB7cHJvdmlkZTogWk9ORV9JU19TVEFCTEVfT0JTRVJWQUJMRSwgdXNlRmFjdG9yeTogaXNTdGFibGVGYWN0b3J5fSxcbiAgXTtcbn1cblxuLyoqXG4gKiBQcm92aWRlcyBgTmdab25lYC1iYXNlZCBjaGFuZ2UgZGV0ZWN0aW9uIGZvciB0aGUgYXBwbGljYXRpb24gYm9vdHN0cmFwcGVkIHVzaW5nXG4gKiBgYm9vdHN0cmFwQXBwbGljYXRpb25gLlxuICpcbiAqIGBOZ1pvbmVgIGlzIGFscmVhZHkgcHJvdmlkZWQgaW4gYXBwbGljYXRpb25zIGJ5IGRlZmF1bHQuIFRoaXMgcHJvdmlkZXIgYWxsb3dzIHlvdSB0byBjb25maWd1cmVcbiAqIG9wdGlvbnMgbGlrZSBgZXZlbnRDb2FsZXNjaW5nYCBpbiB0aGUgYE5nWm9uZWAuXG4gKiBUaGlzIHByb3ZpZGVyIGlzIG5vdCBhdmFpbGFibGUgZm9yIGBwbGF0Zm9ybUJyb3dzZXIoKS5ib290c3RyYXBNb2R1bGVgLCB3aGljaCB1c2VzXG4gKiBgQm9vdHN0cmFwT3B0aW9uc2AgaW5zdGVhZC5cbiAqXG4gKiBAdXNhZ2VOb3Rlc1xuICogYGBgdHlwZXNjcmlwdD1cbiAqIGJvb3RzdHJhcEFwcGxpY2F0aW9uKE15QXBwLCB7cHJvdmlkZXJzOiBbXG4gKiAgIHByb3ZpZGVab25lQ2hhbmdlRGV0ZWN0aW9uKHtldmVudENvYWxlc2Npbmc6IHRydWV9KSxcbiAqIF19KTtcbiAqIGBgYFxuICpcbiAqIEBwdWJsaWNBcGlcbiAqIEBzZWUgYm9vdHN0cmFwQXBwbGljYXRpb25cbiAqIEBzZWUgTmdab25lT3B0aW9uc1xuICovXG5leHBvcnQgZnVuY3Rpb24gcHJvdmlkZVpvbmVDaGFuZ2VEZXRlY3Rpb24ob3B0aW9ucz86IE5nWm9uZU9wdGlvbnMpOiBFbnZpcm9ubWVudFByb3ZpZGVycyB7XG4gIGNvbnN0IHpvbmVQcm92aWRlcnMgPVxuICAgICAgaW50ZXJuYWxQcm92aWRlWm9uZUNoYW5nZURldGVjdGlvbigoKSA9PiBuZXcgTmdab25lKGdldE5nWm9uZU9wdGlvbnMob3B0aW9ucykpKTtcbiAgcmV0dXJuIG1ha2VFbnZpcm9ubWVudFByb3ZpZGVycyhbXG4gICAgKHR5cGVvZiBuZ0Rldk1vZGUgPT09ICd1bmRlZmluZWQnIHx8IG5nRGV2TW9kZSkgPyB7cHJvdmlkZTogUFJPVklERURfTkdfWk9ORSwgdXNlVmFsdWU6IHRydWV9IDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFtdLFxuICAgIHpvbmVQcm92aWRlcnMsXG4gIF0pO1xufVxuIl19