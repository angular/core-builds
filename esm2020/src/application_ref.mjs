/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import './util/ng_jit_mode';
import { merge, Observable } from 'rxjs';
import { share } from 'rxjs/operators';
import { ApplicationInitStatus } from './application_init';
import { APP_BOOTSTRAP_LISTENER, PLATFORM_INITIALIZER } from './application_tokens';
import { getCompilerFacade } from './compiler/compiler_facade';
import { Console } from './console';
import { Injectable } from './di/injectable';
import { InjectionToken } from './di/injection_token';
import { Injector } from './di/injector';
import { INJECTOR_SCOPE } from './di/scope';
import { ErrorHandler } from './error_handler';
import { formatRuntimeError, RuntimeError } from './errors';
import { DEFAULT_LOCALE_ID } from './i18n/localization';
import { LOCALE_ID } from './i18n/tokens';
import { COMPILER_OPTIONS } from './linker/compiler';
import { ComponentFactory } from './linker/component_factory';
import { ComponentFactoryResolver } from './linker/component_factory_resolver';
import { NgModuleRef } from './linker/ng_module_factory';
import { isComponentResourceResolutionQueueEmpty, resolveComponentResources } from './metadata/resource_loading';
import { assertNgModuleType } from './render3/assert';
import { assertStandaloneComponentType } from './render3/errors';
import { setLocaleId } from './render3/i18n/i18n_locale_id';
import { setJitOptions } from './render3/jit/jit_options';
import { isStandalone } from './render3/jit/module';
import { createEnvironmentInjector, NgModuleFactory as R3NgModuleFactory } from './render3/ng_module_ref';
import { publishDefaultGlobalUtils as _publishDefaultGlobalUtils } from './render3/util/global_utils';
import { TESTABILITY } from './testability/testability';
import { isPromise } from './util/lang';
import { scheduleMicroTask } from './util/microtask';
import { stringify } from './util/stringify';
import { NgZone, NoopNgZone } from './zone/ng_zone';
import * as i0 from "./r3_symbols";
import * as i1 from "./di/injector";
import * as i2 from "./zone/ng_zone";
import * as i3 from "./error_handler";
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
const NG_DEV_MODE = typeof ngDevMode === 'undefined' || ngDevMode;
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
    const compilerProviders = _mergeArrays(compilerOptions.map(o => o.providers));
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
export function createOrReusePlatformInjector(providers = []) {
    // If a platform injector already exists, it means that the platform
    // is already bootstrapped and no additional actions are required.
    if (_platformInjector)
        return _platformInjector;
    // Otherwise, setup a new platform injector and run platform initializers.
    const injector = createPlatformInjector(providers);
    _platformInjector = injector;
    publishDefaultGlobalUtils();
    runPlatformInitializers(injector);
    return injector;
}
export function runPlatformInitializers(injector) {
    const inits = injector.get(PLATFORM_INITIALIZER, null);
    if (inits) {
        inits.forEach((init) => init());
    }
}
/**
 * Internal bootstrap application API that implements the core bootstrap logic.
 *
 * Platforms (such as `platform-browser`) may require different set of application and platform
 * providers for an application to function correctly. As a result, platforms may use this function
 * internally and supply the necessary providers during the bootstrap, while exposing
 * platform-specific APIs as a part of their public API.
 *
 * @returns A promise that returns an `ApplicationRef` instance once resolved.
 */
export function internalBootstrapApplication(config) {
    const { rootComponent, appProviders, platformProviders } = config;
    NG_DEV_MODE && assertStandaloneComponentType(rootComponent);
    const platformInjector = createOrReusePlatformInjector(platformProviders);
    const ngZone = new NgZone(getNgZoneOptions());
    return ngZone.run(() => {
        // Create root application injector based on a set of providers configured at the platform
        // bootstrap level as well as providers passed to the bootstrap call by a user.
        const allAppProviders = [
            { provide: NgZone, useValue: ngZone },
            ...(appProviders || []), //
        ];
        const appInjector = createEnvironmentInjector(allAppProviders, platformInjector, 'Environment Injector');
        const exceptionHandler = appInjector.get(ErrorHandler, null);
        if (NG_DEV_MODE && !exceptionHandler) {
            throw new RuntimeError(402 /* RuntimeErrorCode.ERROR_HANDLER_NOT_FOUND */, 'No `ErrorHandler` found in the Dependency Injection tree.');
        }
        let onErrorSubscription;
        ngZone.runOutsideAngular(() => {
            onErrorSubscription = ngZone.onError.subscribe({
                next: (error) => {
                    exceptionHandler.handleError(error);
                }
            });
        });
        return _callAndReportToErrorHandler(exceptionHandler, ngZone, () => {
            const initStatus = appInjector.get(ApplicationInitStatus);
            initStatus.runInitializers();
            return initStatus.donePromise.then(() => {
                const localeId = appInjector.get(LOCALE_ID, DEFAULT_LOCALE_ID);
                setLocaleId(localeId || DEFAULT_LOCALE_ID);
                const appRef = appInjector.get(ApplicationRef);
                // If the whole platform is destroyed, invoke the `destroy` method
                // for all bootstrapped applications as well.
                const destroyListener = () => appRef.destroy();
                const onPlatformDestroyListeners = platformInjector.get(PLATFORM_DESTROY_LISTENERS, null);
                onPlatformDestroyListeners?.add(destroyListener);
                appRef.onDestroy(() => {
                    onPlatformDestroyListeners?.delete(destroyListener);
                    onErrorSubscription.unsubscribe();
                });
                appRef.bootstrap(rootComponent);
                return appRef;
            });
        });
    });
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
export class PlatformRef {
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
        const ngZone = getNgZone(options?.ngZone, getNgZoneOptions(options));
        const providers = [{ provide: NgZone, useValue: ngZone }];
        // Note: Create ngZoneInjector within ngZone.run so that all of the instantiated services are
        // created within the Angular zone
        // Do not try to replace ngZone.run with ApplicationRef#run because ApplicationRef would then be
        // created outside of the Angular zone.
        return ngZone.run(() => {
            const ngZoneInjector = Injector.create({ providers: providers, parent: this.injector, name: moduleFactory.moduleType.name });
            const moduleRef = moduleFactory.create(ngZoneInjector);
            const exceptionHandler = moduleRef.injector.get(ErrorHandler, null);
            if (!exceptionHandler) {
                throw new RuntimeError(402 /* RuntimeErrorCode.ERROR_HANDLER_NOT_FOUND */, ngDevMode && 'No ErrorHandler. Is platform module (BrowserModule) included?');
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
            throw new RuntimeError(403 /* RuntimeErrorCode.BOOTSTRAP_COMPONENTS_NOT_FOUND */, ngDevMode &&
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
}
PlatformRef.ɵfac = function PlatformRef_Factory(t) { return new (t || PlatformRef)(i0.ɵɵinject(i1.Injector)); };
PlatformRef.ɵprov = /*@__PURE__*/ i0.ɵɵdefineInjectable({ token: PlatformRef, factory: PlatformRef.ɵfac, providedIn: 'platform' });
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
        shouldCoalesceEventChangeDetection: !!(options && options.ngZoneEventCoalescing) || false,
        shouldCoalesceRunChangeDetection: !!(options && options.ngZoneRunCoalescing) || false,
    };
}
function getNgZone(ngZoneToUse, options) {
    let ngZone;
    if (ngZoneToUse === 'noop') {
        ngZone = new NoopNgZone();
    }
    else {
        ngZone = (ngZoneToUse === 'zone.js' ? undefined : ngZoneToUse) || new NgZone(options);
    }
    return ngZone;
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
        dst = objs.reduce(optionsReducer, dst);
    }
    else {
        dst = { ...dst, ...objs };
    }
    return dst;
}
/**
 * A reference to an Angular application running on a page.
 *
 * @usageNotes
 *
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
    /** @internal */
    constructor(_zone, _injector, _exceptionHandler) {
        this._zone = _zone;
        this._injector = _injector;
        this._exceptionHandler = _exceptionHandler;
        /** @internal */
        this._bootstrapListeners = [];
        this._views = [];
        this._runningTick = false;
        this._stable = true;
        this._destroyed = false;
        this._destroyListeners = [];
        /**
         * Get a list of component types registered to this application.
         * This list is populated even before the component is created.
         */
        this.componentTypes = [];
        /**
         * Get a list of components registered to this application.
         */
        this.components = [];
        this._onMicrotaskEmptySubscription = this._zone.onMicrotaskEmpty.subscribe({
            next: () => {
                this._zone.run(() => {
                    this.tick();
                });
            }
        });
        const isCurrentlyStable = new Observable((observer) => {
            this._stable = this._zone.isStable && !this._zone.hasPendingMacrotasks &&
                !this._zone.hasPendingMicrotasks;
            this._zone.runOutsideAngular(() => {
                observer.next(this._stable);
                observer.complete();
            });
        });
        const isStable = new Observable((observer) => {
            // Create the subscription to onStable outside the Angular Zone so that
            // the callback is run outside the Angular Zone.
            let stableSub;
            this._zone.runOutsideAngular(() => {
                stableSub = this._zone.onStable.subscribe(() => {
                    NgZone.assertNotInAngularZone();
                    // Check whether there are no pending macro/micro tasks in the next tick
                    // to allow for NgZone to update the state.
                    scheduleMicroTask(() => {
                        if (!this._stable && !this._zone.hasPendingMacrotasks &&
                            !this._zone.hasPendingMicrotasks) {
                            this._stable = true;
                            observer.next(true);
                        }
                    });
                });
            });
            const unstableSub = this._zone.onUnstable.subscribe(() => {
                NgZone.assertInAngularZone();
                if (this._stable) {
                    this._stable = false;
                    this._zone.runOutsideAngular(() => {
                        observer.next(false);
                    });
                }
            });
            return () => {
                stableSub.unsubscribe();
                unstableSub.unsubscribe();
            };
        });
        this.isStable =
            merge(isCurrentlyStable, isStable.pipe(share()));
    }
    /**
     * Indicates whether this instance was destroyed.
     */
    get destroyed() {
        return this._destroyed;
    }
    /** @internal */
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
        NG_DEV_MODE && this.warnIfDestroyed();
        const isComponentFactory = componentOrFactory instanceof ComponentFactory;
        const initStatus = this._injector.get(ApplicationInitStatus);
        if (!initStatus.done) {
            const standalone = !isComponentFactory && isStandalone(componentOrFactory);
            const errorMessage = 'Cannot bootstrap as there are still asynchronous initializers running.' +
                (standalone ? '' :
                    ' Bootstrap components in the `ngDoBootstrap` method of the root module.');
            throw new RuntimeError(405 /* RuntimeErrorCode.ASYNC_INITIALIZERS_STILL_RUNNING */, NG_DEV_MODE && errorMessage);
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
            _console.log(`Angular is running in development mode. Call enableProdMode() to enable production mode.`);
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
        NG_DEV_MODE && this.warnIfDestroyed();
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
            this._zone.runOutsideAngular(() => this._exceptionHandler.handleError(e));
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
        NG_DEV_MODE && this.warnIfDestroyed();
        const view = viewRef;
        this._views.push(view);
        view.attachToAppRef(this);
    }
    /**
     * Detaches a view from dirty checking again.
     */
    detachView(viewRef) {
        NG_DEV_MODE && this.warnIfDestroyed();
        const view = viewRef;
        remove(this._views, view);
        view.detachFromAppRef();
    }
    _loadComponent(componentRef) {
        this.attachView(componentRef.hostView);
        this.tick();
        this.components.push(componentRef);
        // Get the listeners lazily to prevent DI cycles.
        const listeners = this._injector.get(APP_BOOTSTRAP_LISTENER, []).concat(this._bootstrapListeners);
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
            this._onMicrotaskEmptySubscription.unsubscribe();
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
     *
     * @internal
     */
    onDestroy(callback) {
        NG_DEV_MODE && this.warnIfDestroyed();
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
        if (NG_DEV_MODE && this._destroyed) {
            console.warn(formatRuntimeError(406 /* RuntimeErrorCode.APPLICATION_REF_ALREADY_DESTROYED */, 'This instance of the `ApplicationRef` has already been destroyed.'));
        }
    }
}
ApplicationRef.ɵfac = function ApplicationRef_Factory(t) { return new (t || ApplicationRef)(i0.ɵɵinject(i2.NgZone), i0.ɵɵinject(i1.Injector), i0.ɵɵinject(i3.ErrorHandler)); };
ApplicationRef.ɵprov = /*@__PURE__*/ i0.ɵɵdefineInjectable({ token: ApplicationRef, factory: ApplicationRef.ɵfac, providedIn: 'root' });
(function () { (typeof ngDevMode === "undefined" || ngDevMode) && i0.setClassMetadata(ApplicationRef, [{
        type: Injectable,
        args: [{ providedIn: 'root' }]
    }], function () { return [{ type: i2.NgZone }, { type: i1.Injector }, { type: i3.ErrorHandler }]; }, null); })();
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
function _mergeArrays(parts) {
    const result = [];
    parts.forEach((part) => part && result.push(...part));
    return result;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwbGljYXRpb25fcmVmLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvYXBwbGljYXRpb25fcmVmLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sb0JBQW9CLENBQUM7QUFFNUIsT0FBTyxFQUFDLEtBQUssRUFBRSxVQUFVLEVBQXlCLE1BQU0sTUFBTSxDQUFDO0FBQy9ELE9BQU8sRUFBQyxLQUFLLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUVyQyxPQUFPLEVBQUMscUJBQXFCLEVBQUMsTUFBTSxvQkFBb0IsQ0FBQztBQUN6RCxPQUFPLEVBQUMsc0JBQXNCLEVBQUUsb0JBQW9CLEVBQUMsTUFBTSxzQkFBc0IsQ0FBQztBQUNsRixPQUFPLEVBQUMsaUJBQWlCLEVBQW1CLE1BQU0sNEJBQTRCLENBQUM7QUFDL0UsT0FBTyxFQUFDLE9BQU8sRUFBQyxNQUFNLFdBQVcsQ0FBQztBQUNsQyxPQUFPLEVBQUMsVUFBVSxFQUFDLE1BQU0saUJBQWlCLENBQUM7QUFDM0MsT0FBTyxFQUFDLGNBQWMsRUFBQyxNQUFNLHNCQUFzQixDQUFDO0FBQ3BELE9BQU8sRUFBQyxRQUFRLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFHdkMsT0FBTyxFQUFDLGNBQWMsRUFBQyxNQUFNLFlBQVksQ0FBQztBQUMxQyxPQUFPLEVBQUMsWUFBWSxFQUFDLE1BQU0saUJBQWlCLENBQUM7QUFDN0MsT0FBTyxFQUFDLGtCQUFrQixFQUFFLFlBQVksRUFBbUIsTUFBTSxVQUFVLENBQUM7QUFDNUUsT0FBTyxFQUFDLGlCQUFpQixFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFDdEQsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUV4QyxPQUFPLEVBQUMsZ0JBQWdCLEVBQWtCLE1BQU0sbUJBQW1CLENBQUM7QUFDcEUsT0FBTyxFQUFDLGdCQUFnQixFQUFlLE1BQU0s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RUFBRSxFQUFFLENBQUMsSUFBSSxJQUFJLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDO0lBQ3RELE9BQU8sTUFBTSxDQUFDO0FBQ2hCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0ICcuL3V0aWwvbmdfaml0X21vZGUnO1xuXG5pbXBvcnQge21lcmdlLCBPYnNlcnZhYmxlLCBPYnNlcnZlciwgU3Vic2NyaXB0aW9ufSBmcm9tICdyeGpzJztcbmltcG9ydCB7c2hhcmV9IGZyb20gJ3J4anMvb3BlcmF0b3JzJztcblxuaW1wb3J0IHtBcHBsaWNhdGlvbkluaXRTdGF0dXN9IGZyb20gJy4vYXBwbGljYXRpb25faW5pdCc7XG5pbXBvcnQge0FQUF9CT09UU1RSQVBfTElTVEVORVIsIFBMQVRGT1JNX0lOSVRJQUxJWkVSfSBmcm9tICcuL2FwcGxpY2F0aW9uX3Rva2Vucyc7XG5pbXBvcnQge2dldENvbXBpbGVyRmFjYWRlLCBKaXRDb21waWxlclVzYWdlfSBmcm9tICcuL2NvbXBpbGVyL2NvbXBpbGVyX2ZhY2FkZSc7XG5pbXBvcnQge0NvbnNvbGV9IGZyb20gJy4vY29uc29sZSc7XG5pbXBvcnQge0luamVjdGFibGV9IGZyb20gJy4vZGkvaW5qZWN0YWJsZSc7XG5pbXBvcnQge0luamVjdGlvblRva2VufSBmcm9tICcuL2RpL2luamVjdGlvbl90b2tlbic7XG5pbXBvcnQge0luamVjdG9yfSBmcm9tICcuL2RpL2luamVjdG9yJztcbmltcG9ydCB7SW1wb3J0ZWROZ01vZHVsZVByb3ZpZGVycywgUHJvdmlkZXIsIFN0YXRpY1Byb3ZpZGVyfSBmcm9tICcuL2RpL2ludGVyZmFjZS9wcm92aWRlcic7XG5pbXBvcnQge0Vudmlyb25tZW50SW5qZWN0b3J9IGZyb20gJy4vZGkvcjNfaW5qZWN0b3InO1xuaW1wb3J0IHtJTkpFQ1RPUl9TQ09QRX0gZnJvbSAnLi9kaS9zY29wZSc7XG5pbXBvcnQge0Vycm9ySGFuZGxlcn0gZnJvbSAnLi9lcnJvcl9oYW5kbGVyJztcbmltcG9ydCB7Zm9ybWF0UnVudGltZUVycm9yLCBSdW50aW1lRXJyb3IsIFJ1bnRpbWVFcnJvckNvZGV9IGZyb20gJy4vZXJyb3JzJztcbmltcG9ydCB7REVGQVVMVF9MT0NBTEVfSUR9IGZyb20gJy4vaTE4bi9sb2NhbGl6YXRpb24nO1xuaW1wb3J0IHtMT0NBTEVfSUR9IGZyb20gJy4vaTE4bi90b2tlbnMnO1xuaW1wb3J0IHtUeXBlfSBmcm9tICcuL2ludGVyZmFjZS90eXBlJztcbmltcG9ydCB7Q09NUElMRVJfT1BUSU9OUywgQ29tcGlsZXJPcHRpb25zfSBmcm9tICcuL2xpbmtlci9jb21waWxlcic7XG5pbXBvcnQge0NvbXBvbmVudEZhY3RvcnksIENvbXBvbmVudFJlZn0gZnJvbSAnLi9saW5rZXIvY29tcG9uZW50X2ZhY3RvcnknO1xuaW1wb3J0IHtDb21wb25lbnRGYWN0b3J5UmVzb2x2ZXJ9IGZyb20gJy4vbGlua2VyL2NvbXBvbmVudF9mYWN0b3J5X3Jlc29sdmVyJztcbmltcG9ydCB7SW50ZXJuYWxOZ01vZHVsZVJlZiwgTmdNb2R1bGVGYWN0b3J5LCBOZ01vZHVsZVJlZn0gZnJvbSAnLi9saW5rZXIvbmdfbW9kdWxlX2ZhY3RvcnknO1xuaW1wb3J0IHtJbnRlcm5hbFZpZXdSZWYsIFZpZXdSZWZ9IGZyb20gJy4vbGlua2VyL3ZpZXdfcmVmJztcbmltcG9ydCB7aXNDb21wb25lbnRSZXNvdXJjZVJlc29sdXRpb25RdWV1ZUVtcHR5LCByZXNvbHZlQ29tcG9uZW50UmVzb3VyY2VzfSBmcm9tICcuL21ldGFkYXRhL3Jlc291cmNlX2xvYWRpbmcnO1xuaW1wb3J0IHthc3NlcnROZ01vZHVsZVR5cGV9IGZyb20gJy4vcmVuZGVyMy9hc3NlcnQnO1xuaW1wb3J0IHtDb21wb25lbnRGYWN0b3J5IGFzIFIzQ29tcG9uZW50RmFjdG9yeX0gZnJvbSAnLi9yZW5kZXIzL2NvbXBvbmVudF9yZWYnO1xuaW1wb3J0IHthc3NlcnRTdGFuZGFsb25lQ29tcG9uZW50VHlwZX0gZnJvbSAnLi9yZW5kZXIzL2Vycm9ycyc7XG5pbXBvcnQge3NldExvY2FsZUlkfSBmcm9tICcuL3JlbmRlcjMvaTE4bi9pMThuX2xvY2FsZV9pZCc7XG5pbXBvcnQge3NldEppdE9wdGlvbnN9IGZyb20gJy4vcmVuZGVyMy9qaXQvaml0X29wdGlvbnMnO1xuaW1wb3J0IHtpc1N0YW5kYWxvbmV9IGZyb20gJy4vcmVuZGVyMy9qaXQvbW9kdWxlJztcbmltcG9ydCB7Y3JlYXRlRW52aXJvbm1lbnRJbmplY3RvciwgTmdNb2R1bGVGYWN0b3J5IGFzIFIzTmdNb2R1bGVGYWN0b3J5fSBmcm9tICcuL3JlbmRlcjMvbmdfbW9kdWxlX3JlZic7XG5pbXBvcnQge3B1Ymxpc2hEZWZhdWx0R2xvYmFsVXRpbHMgYXMgX3B1Ymxpc2hEZWZhdWx0R2xvYmFsVXRpbHN9IGZyb20gJy4vcmVuZGVyMy91dGlsL2dsb2JhbF91dGlscyc7XG5pbXBvcnQge1RFU1RBQklMSVRZfSBmcm9tICcuL3Rlc3RhYmlsaXR5L3Rlc3RhYmlsaXR5JztcbmltcG9ydCB7aXNQcm9taXNlfSBmcm9tICcuL3V0aWwvbGFuZyc7XG5pbXBvcnQge3NjaGVkdWxlTWljcm9UYXNrfSBmcm9tICcuL3V0aWwvbWljcm90YXNrJztcbmltcG9ydCB7c3RyaW5naWZ5fSBmcm9tICcuL3V0aWwvc3RyaW5naWZ5JztcbmltcG9ydCB7Tmdab25lLCBOb29wTmdab25lfSBmcm9tICcuL3pvbmUvbmdfem9uZSc7XG5cbmxldCBfcGxhdGZvcm1JbmplY3RvcjogSW5qZWN0b3J8bnVsbCA9IG51bGw7XG5cbi8qKlxuICogSW50ZXJuYWwgdG9rZW4gdG8gaW5kaWNhdGUgd2hldGhlciBoYXZpbmcgbXVsdGlwbGUgYm9vdHN0cmFwcGVkIHBsYXRmb3JtIHNob3VsZCBiZSBhbGxvd2VkIChvbmx5XG4gKiBvbmUgYm9vdHN0cmFwcGVkIHBsYXRmb3JtIGlzIGFsbG93ZWQgYnkgZGVmYXVsdCkuIFRoaXMgdG9rZW4gaGVscHMgdG8gc3VwcG9ydCBTU1Igc2NlbmFyaW9zLlxuICovXG5leHBvcnQgY29uc3QgQUxMT1dfTVVMVElQTEVfUExBVEZPUk1TID0gbmV3IEluamVjdGlvblRva2VuPGJvb2xlYW4+KCdBbGxvd011bHRpcGxlVG9rZW4nKTtcblxuLyoqXG4gKiBJbnRlcm5hbCB0b2tlbiB0aGF0IGFsbG93cyB0byByZWdpc3RlciBleHRyYSBjYWxsYmFja3MgdGhhdCBzaG91bGQgYmUgaW52b2tlZCBkdXJpbmcgdGhlXG4gKiBgUGxhdGZvcm1SZWYuZGVzdHJveWAgb3BlcmF0aW9uLiBUaGlzIHRva2VuIGlzIG5lZWRlZCB0byBhdm9pZCBhIGRpcmVjdCByZWZlcmVuY2UgdG8gdGhlXG4gKiBgUGxhdGZvcm1SZWZgIGNsYXNzIChpLmUuIHJlZ2lzdGVyIHRoZSBjYWxsYmFjayB2aWEgYFBsYXRmb3JtUmVmLm9uRGVzdHJveWApLCB0aHVzIG1ha2luZyB0aGVcbiAqIGVudGlyZSBjbGFzcyB0cmVlLXNoYWtlYWJsZS5cbiAqL1xuY29uc3QgUExBVEZPUk1fREVTVFJPWV9MSVNURU5FUlMgPVxuICAgIG5ldyBJbmplY3Rpb25Ub2tlbjxTZXQ8Vm9pZEZ1bmN0aW9uPj4oJ1BsYXRmb3JtRGVzdHJveUxpc3RlbmVycycpO1xuXG5jb25zdCBOR19ERVZfTU9ERSA9IHR5cGVvZiBuZ0Rldk1vZGUgPT09ICd1bmRlZmluZWQnIHx8IG5nRGV2TW9kZTtcblxuZXhwb3J0IGZ1bmN0aW9uIGNvbXBpbGVOZ01vZHVsZUZhY3Rvcnk8TT4oXG4gICAgaW5qZWN0b3I6IEluamVjdG9yLCBvcHRpb25zOiBDb21waWxlck9wdGlvbnMsXG4gICAgbW9kdWxlVHlwZTogVHlwZTxNPik6IFByb21pc2U8TmdNb2R1bGVGYWN0b3J5PE0+PiB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnROZ01vZHVsZVR5cGUobW9kdWxlVHlwZSk7XG5cbiAgY29uc3QgbW9kdWxlRmFjdG9yeSA9IG5ldyBSM05nTW9kdWxlRmFjdG9yeShtb2R1bGVUeXBlKTtcblxuICAvLyBBbGwgb2YgdGhlIGxvZ2ljIGJlbG93IGlzIGlycmVsZXZhbnQgZm9yIEFPVC1jb21waWxlZCBjb2RlLlxuICBpZiAodHlwZW9mIG5nSml0TW9kZSAhPT0gJ3VuZGVmaW5lZCcgJiYgIW5nSml0TW9kZSkge1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUobW9kdWxlRmFjdG9yeSk7XG4gIH1cblxuICBjb25zdCBjb21waWxlck9wdGlvbnMgPSBpbmplY3Rvci5nZXQoQ09NUElMRVJfT1BUSU9OUywgW10pLmNvbmNhdChvcHRpb25zKTtcblxuICAvLyBDb25maWd1cmUgdGhlIGNvbXBpbGVyIHRvIHVzZSB0aGUgcHJvdmlkZWQgb3B0aW9ucy4gVGhpcyBjYWxsIG1heSBmYWlsIHdoZW4gbXVsdGlwbGUgbW9kdWxlc1xuICAvLyBhcmUgYm9vdHN0cmFwcGVkIHdpdGggaW5jb21wYXRpYmxlIG9wdGlvbnMsIGFzIGEgY29tcG9uZW50IGNhbiBvbmx5IGJlIGNvbXBpbGVkIGFjY29yZGluZyB0b1xuICAvLyBhIHNpbmdsZSBzZXQgb2Ygb3B0aW9ucy5cbiAgc2V0Sml0T3B0aW9ucyh7XG4gICAgZGVmYXVsdEVuY2Fwc3VsYXRpb246IF9sYXN0RGVmaW5lZChjb21waWxlck9wdGlvbnMubWFwKG9wdHMgPT4gb3B0cy5kZWZhdWx0RW5jYXBzdWxhdGlvbikpLFxuICAgIHByZXNlcnZlV2hpdGVzcGFjZXM6IF9sYXN0RGVmaW5lZChjb21waWxlck9wdGlvbnMubWFwKG9wdHMgPT4gb3B0cy5wcmVzZXJ2ZVdoaXRlc3BhY2VzKSksXG4gIH0pO1xuXG4gIGlmIChpc0NvbXBvbmVudFJlc291cmNlUmVzb2x1dGlvblF1ZXVlRW1wdHkoKSkge1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUobW9kdWxlRmFjdG9yeSk7XG4gIH1cblxuICBjb25zdCBjb21waWxlclByb3ZpZGVycyA9IF9tZXJnZUFycmF5cyhjb21waWxlck9wdGlvbnMubWFwKG8gPT4gby5wcm92aWRlcnMhKSk7XG5cbiAgLy8gSW4gY2FzZSB0aGVyZSBhcmUgbm8gY29tcGlsZXIgcHJvdmlkZXJzLCB3ZSBqdXN0IHJldHVybiB0aGUgbW9kdWxlIGZhY3RvcnkgYXNcbiAgLy8gdGhlcmUgd29uJ3QgYmUgYW55IHJlc291cmNlIGxvYWRlci4gVGhpcyBjYW4gaGFwcGVuIHdpdGggSXZ5LCBiZWNhdXNlIEFPVCBjb21waWxlZFxuICAvLyBtb2R1bGVzIGNhbiBiZSBzdGlsbCBwYXNzZWQgdGhyb3VnaCBcImJvb3RzdHJhcE1vZHVsZVwiLiBJbiB0aGF0IGNhc2Ugd2Ugc2hvdWxkbid0XG4gIC8vIHVubmVjZXNzYXJpbHkgcmVxdWlyZSB0aGUgSklUIGNvbXBpbGVyLlxuICBpZiAoY29tcGlsZXJQcm92aWRlcnMubGVuZ3RoID09PSAwKSB7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShtb2R1bGVGYWN0b3J5KTtcbiAgfVxuXG4gIGNvbnN0IGNvbXBpbGVyID0gZ2V0Q29tcGlsZXJGYWNhZGUoe1xuICAgIHVzYWdlOiBKaXRDb21waWxlclVzYWdlLkRlY29yYXRvcixcbiAgICBraW5kOiAnTmdNb2R1bGUnLFxuICAgIHR5cGU6IG1vZHVsZVR5cGUsXG4gIH0pO1xuICBjb25zdCBjb21waWxlckluamVjdG9yID0gSW5qZWN0b3IuY3JlYXRlKHtwcm92aWRlcnM6IGNvbXBpbGVyUHJvdmlkZXJzfSk7XG4gIGNvbnN0IHJlc291cmNlTG9hZGVyID0gY29tcGlsZXJJbmplY3Rvci5nZXQoY29tcGlsZXIuUmVzb3VyY2VMb2FkZXIpO1xuICAvLyBUaGUgcmVzb3VyY2UgbG9hZGVyIGNhbiBhbHNvIHJldHVybiBhIHN0cmluZyB3aGlsZSB0aGUgXCJyZXNvbHZlQ29tcG9uZW50UmVzb3VyY2VzXCJcbiAgLy8gYWx3YXlzIGV4cGVjdHMgYSBwcm9taXNlLiBUaGVyZWZvcmUgd2UgbmVlZCB0byB3cmFwIHRoZSByZXR1cm5lZCB2YWx1ZSBpbiBhIHByb21pc2UuXG4gIHJldHVybiByZXNvbHZlQ29tcG9uZW50UmVzb3VyY2VzKHVybCA9PiBQcm9taXNlLnJlc29sdmUocmVzb3VyY2VMb2FkZXIuZ2V0KHVybCkpKVxuICAgICAgLnRoZW4oKCkgPT4gbW9kdWxlRmFjdG9yeSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwdWJsaXNoRGVmYXVsdEdsb2JhbFV0aWxzKCkge1xuICBuZ0Rldk1vZGUgJiYgX3B1Ymxpc2hEZWZhdWx0R2xvYmFsVXRpbHMoKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzQm91bmRUb01vZHVsZTxDPihjZjogQ29tcG9uZW50RmFjdG9yeTxDPik6IGJvb2xlYW4ge1xuICByZXR1cm4gKGNmIGFzIFIzQ29tcG9uZW50RmFjdG9yeTxDPikuaXNCb3VuZFRvTW9kdWxlO1xufVxuXG4vKipcbiAqIEEgdG9rZW4gZm9yIHRoaXJkLXBhcnR5IGNvbXBvbmVudHMgdGhhdCBjYW4gcmVnaXN0ZXIgdGhlbXNlbHZlcyB3aXRoIE5nUHJvYmUuXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgY2xhc3MgTmdQcm9iZVRva2VuIHtcbiAgY29uc3RydWN0b3IocHVibGljIG5hbWU6IHN0cmluZywgcHVibGljIHRva2VuOiBhbnkpIHt9XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIHBsYXRmb3JtLlxuICogUGxhdGZvcm1zIG11c3QgYmUgY3JlYXRlZCBvbiBsYXVuY2ggdXNpbmcgdGhpcyBmdW5jdGlvbi5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVQbGF0Zm9ybShpbmplY3RvcjogSW5qZWN0b3IpOiBQbGF0Zm9ybVJlZiB7XG4gIGlmIChfcGxhdGZvcm1JbmplY3RvciAmJiAhX3BsYXRmb3JtSW5qZWN0b3IuZ2V0KEFMTE9XX01VTFRJUExFX1BMQVRGT1JNUywgZmFsc2UpKSB7XG4gICAgdGhyb3cgbmV3IFJ1bnRpbWVFcnJvcihcbiAgICAgICAgUnVudGltZUVycm9yQ29kZS5NVUxUSVBMRV9QTEFURk9STVMsXG4gICAgICAgIG5nRGV2TW9kZSAmJlxuICAgICAgICAgICAgJ1RoZXJlIGNhbiBiZSBvbmx5IG9uZSBwbGF0Zm9ybS4gRGVzdHJveSB0aGUgcHJldmlvdXMgb25lIHRvIGNyZWF0ZSBhIG5ldyBvbmUuJyk7XG4gIH1cbiAgcHVibGlzaERlZmF1bHRHbG9iYWxVdGlscygpO1xuICBfcGxhdGZvcm1JbmplY3RvciA9IGluamVjdG9yO1xuICBjb25zdCBwbGF0Zm9ybSA9IGluamVjdG9yLmdldChQbGF0Zm9ybVJlZik7XG4gIHJ1blBsYXRmb3JtSW5pdGlhbGl6ZXJzKGluamVjdG9yKTtcbiAgcmV0dXJuIHBsYXRmb3JtO1xufVxuXG4vKipcbiAqIFRoZSBnb2FsIG9mIHRoaXMgZnVuY3Rpb24gaXMgdG8gYm9vdHN0cmFwIGEgcGxhdGZvcm0gaW5qZWN0b3IsXG4gKiBidXQgYXZvaWQgcmVmZXJlbmNpbmcgYFBsYXRmb3JtUmVmYCBjbGFzcy5cbiAqIFRoaXMgZnVuY3Rpb24gaXMgbmVlZGVkIGZvciBib290c3RyYXBwaW5nIGEgU3RhbmRhbG9uZSBDb21wb25lbnQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVPclJldXNlUGxhdGZvcm1JbmplY3Rvcihwcm92aWRlcnM6IFN0YXRpY1Byb3ZpZGVyW10gPSBbXSk6IEluamVjdG9yIHtcbiAgLy8gSWYgYSBwbGF0Zm9ybSBpbmplY3RvciBhbHJlYWR5IGV4aXN0cywgaXQgbWVhbnMgdGhhdCB0aGUgcGxhdGZvcm1cbiAgLy8gaXMgYWxyZWFkeSBib290c3RyYXBwZWQgYW5kIG5vIGFkZGl0aW9uYWwgYWN0aW9ucyBhcmUgcmVxdWlyZWQuXG4gIGlmIChfcGxhdGZvcm1JbmplY3RvcikgcmV0dXJuIF9wbGF0Zm9ybUluamVjdG9yO1xuXG4gIC8vIE90aGVyd2lzZSwgc2V0dXAgYSBuZXcgcGxhdGZvcm0gaW5qZWN0b3IgYW5kIHJ1biBwbGF0Zm9ybSBpbml0aWFsaXplcnMuXG4gIGNvbnN0IGluamVjdG9yID0gY3JlYXRlUGxhdGZvcm1JbmplY3Rvcihwcm92aWRlcnMpO1xuICBfcGxhdGZvcm1JbmplY3RvciA9IGluamVjdG9yO1xuICBwdWJsaXNoRGVmYXVsdEdsb2JhbFV0aWxzKCk7XG4gIHJ1blBsYXRmb3JtSW5pdGlhbGl6ZXJzKGluamVjdG9yKTtcbiAgcmV0dXJuIGluamVjdG9yO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcnVuUGxhdGZvcm1Jbml0aWFsaXplcnMoaW5qZWN0b3I6IEluamVjdG9yKTogdm9pZCB7XG4gIGNvbnN0IGluaXRzID0gaW5qZWN0b3IuZ2V0KFBMQVRGT1JNX0lOSVRJQUxJWkVSLCBudWxsKTtcbiAgaWYgKGluaXRzKSB7XG4gICAgaW5pdHMuZm9yRWFjaCgoaW5pdDogYW55KSA9PiBpbml0KCkpO1xuICB9XG59XG5cbi8qKlxuICogSW50ZXJuYWwgYm9vdHN0cmFwIGFwcGxpY2F0aW9uIEFQSSB0aGF0IGltcGxlbWVudHMgdGhlIGNvcmUgYm9vdHN0cmFwIGxvZ2ljLlxuICpcbiAqIFBsYXRmb3JtcyAoc3VjaCBhcyBgcGxhdGZvcm0tYnJvd3NlcmApIG1heSByZXF1aXJlIGRpZmZlcmVudCBzZXQgb2YgYXBwbGljYXRpb24gYW5kIHBsYXRmb3JtXG4gKiBwcm92aWRlcnMgZm9yIGFuIGFwcGxpY2F0aW9uIHRvIGZ1bmN0aW9uIGNvcnJlY3RseS4gQXMgYSByZXN1bHQsIHBsYXRmb3JtcyBtYXkgdXNlIHRoaXMgZnVuY3Rpb25cbiAqIGludGVybmFsbHkgYW5kIHN1cHBseSB0aGUgbmVjZXNzYXJ5IHByb3ZpZGVycyBkdXJpbmcgdGhlIGJvb3RzdHJhcCwgd2hpbGUgZXhwb3NpbmdcbiAqIHBsYXRmb3JtLXNwZWNpZmljIEFQSXMgYXMgYSBwYXJ0IG9mIHRoZWlyIHB1YmxpYyBBUEkuXG4gKlxuICogQHJldHVybnMgQSBwcm9taXNlIHRoYXQgcmV0dXJucyBhbiBgQXBwbGljYXRpb25SZWZgIGluc3RhbmNlIG9uY2UgcmVzb2x2ZWQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbnRlcm5hbEJvb3RzdHJhcEFwcGxpY2F0aW9uKGNvbmZpZzoge1xuICByb290Q29tcG9uZW50OiBUeXBlPHVua25vd24+LFxuICBhcHBQcm92aWRlcnM/OiBBcnJheTxQcm92aWRlcnxJbXBvcnRlZE5nTW9kdWxlUHJvdmlkZXJzPixcbiAgcGxhdGZvcm1Qcm92aWRlcnM/OiBQcm92aWRlcltdLFxufSk6IFByb21pc2U8QXBwbGljYXRpb25SZWY+IHtcbiAgY29uc3Qge3Jvb3RDb21wb25lbnQsIGFwcFByb3ZpZGVycywgcGxhdGZvcm1Qcm92aWRlcnN9ID0gY29uZmlnO1xuICBOR19ERVZfTU9ERSAmJiBhc3NlcnRTdGFuZGFsb25lQ29tcG9uZW50VHlwZShyb290Q29tcG9uZW50KTtcblxuICBjb25zdCBwbGF0Zm9ybUluamVjdG9yID0gY3JlYXRlT3JSZXVzZVBsYXRmb3JtSW5qZWN0b3IocGxhdGZvcm1Qcm92aWRlcnMgYXMgU3RhdGljUHJvdmlkZXJbXSk7XG5cbiAgY29uc3Qgbmdab25lID0gbmV3IE5nWm9uZShnZXROZ1pvbmVPcHRpb25zKCkpO1xuXG4gIHJldHVybiBuZ1pvbmUucnVuKCgpID0+IHtcbiAgICAvLyBDcmVhdGUgcm9vdCBhcHBsaWNhdGlvbiBpbmplY3RvciBiYXNlZCBvbiBhIHNldCBvZiBwcm92aWRlcnMgY29uZmlndXJlZCBhdCB0aGUgcGxhdGZvcm1cbiAgICAvLyBib290c3RyYXAgbGV2ZWwgYXMgd2VsbCBhcyBwcm92aWRlcnMgcGFzc2VkIHRvIHRoZSBib290c3RyYXAgY2FsbCBieSBhIHVzZXIuXG4gICAgY29uc3QgYWxsQXBwUHJvdmlkZXJzID0gW1xuICAgICAge3Byb3ZpZGU6IE5nWm9uZSwgdXNlVmFsdWU6IG5nWm9uZX0sICAvL1xuICAgICAgLi4uKGFwcFByb3ZpZGVycyB8fCBbXSksICAgICAgICAgICAgICAvL1xuICAgIF07XG4gICAgY29uc3QgYXBwSW5qZWN0b3IgPSBjcmVhdGVFbnZpcm9ubWVudEluamVjdG9yKFxuICAgICAgICBhbGxBcHBQcm92aWRlcnMsIHBsYXRmb3JtSW5qZWN0b3IgYXMgRW52aXJvbm1lbnRJbmplY3RvciwgJ0Vudmlyb25tZW50IEluamVjdG9yJyk7XG5cbiAgICBjb25zdCBleGNlcHRpb25IYW5kbGVyOiBFcnJvckhhbmRsZXJ8bnVsbCA9IGFwcEluamVjdG9yLmdldChFcnJvckhhbmRsZXIsIG51bGwpO1xuICAgIGlmIChOR19ERVZfTU9ERSAmJiAhZXhjZXB0aW9uSGFuZGxlcikge1xuICAgICAgdGhyb3cgbmV3IFJ1bnRpbWVFcnJvcihcbiAgICAgICAgICBSdW50aW1lRXJyb3JDb2RlLkVSUk9SX0hBTkRMRVJfTk9UX0ZPVU5ELFxuICAgICAgICAgICdObyBgRXJyb3JIYW5kbGVyYCBmb3VuZCBpbiB0aGUgRGVwZW5kZW5jeSBJbmplY3Rpb24gdHJlZS4nKTtcbiAgICB9XG5cbiAgICBsZXQgb25FcnJvclN1YnNjcmlwdGlvbjogU3Vic2NyaXB0aW9uO1xuICAgIG5nWm9uZS5ydW5PdXRzaWRlQW5ndWxhcigoKSA9PiB7XG4gICAgICBvbkVycm9yU3Vic2NyaXB0aW9uID0gbmdab25lLm9uRXJyb3Iuc3Vic2NyaWJlKHtcbiAgICAgICAgbmV4dDogKGVycm9yOiBhbnkpID0+IHtcbiAgICAgICAgICBleGNlcHRpb25IYW5kbGVyIS5oYW5kbGVFcnJvcihlcnJvcik7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0pO1xuICAgIHJldHVybiBfY2FsbEFuZFJlcG9ydFRvRXJyb3JIYW5kbGVyKGV4Y2VwdGlvbkhhbmRsZXIhLCBuZ1pvbmUsICgpID0+IHtcbiAgICAgIGNvbnN0IGluaXRTdGF0dXMgPSBhcHBJbmplY3Rvci5nZXQoQXBwbGljYXRpb25Jbml0U3RhdHVzKTtcbiAgICAgIGluaXRTdGF0dXMucnVuSW5pdGlhbGl6ZXJzKCk7XG4gICAgICByZXR1cm4gaW5pdFN0YXR1cy5kb25lUHJvbWlzZS50aGVuKCgpID0+IHtcbiAgICAgICAgY29uc3QgbG9jYWxlSWQgPSBhcHBJbmplY3Rvci5nZXQoTE9DQUxFX0lELCBERUZBVUxUX0xPQ0FMRV9JRCk7XG4gICAgICAgIHNldExvY2FsZUlkKGxvY2FsZUlkIHx8IERFRkFVTFRfTE9DQUxFX0lEKTtcblxuICAgICAgICBjb25zdCBhcHBSZWYgPSBhcHBJbmplY3Rvci5nZXQoQXBwbGljYXRpb25SZWYpO1xuXG4gICAgICAgIC8vIElmIHRoZSB3aG9sZSBwbGF0Zm9ybSBpcyBkZXN0cm95ZWQsIGludm9rZSB0aGUgYGRlc3Ryb3lgIG1ldGhvZFxuICAgICAgICAvLyBmb3IgYWxsIGJvb3RzdHJhcHBlZCBhcHBsaWNhdGlvbnMgYXMgd2VsbC5cbiAgICAgICAgY29uc3QgZGVzdHJveUxpc3RlbmVyID0gKCkgPT4gYXBwUmVmLmRlc3Ryb3koKTtcbiAgICAgICAgY29uc3Qgb25QbGF0Zm9ybURlc3Ryb3lMaXN0ZW5lcnMgPSBwbGF0Zm9ybUluamVjdG9yLmdldChQTEFURk9STV9ERVNUUk9ZX0xJU1RFTkVSUywgbnVsbCk7XG4gICAgICAgIG9uUGxhdGZvcm1EZXN0cm95TGlzdGVuZXJzPy5hZGQoZGVzdHJveUxpc3RlbmVyKTtcblxuICAgICAgICBhcHBSZWYub25EZXN0cm95KCgpID0+IHtcbiAgICAgICAgICBvblBsYXRmb3JtRGVzdHJveUxpc3RlbmVycz8uZGVsZXRlKGRlc3Ryb3lMaXN0ZW5lcik7XG4gICAgICAgICAgb25FcnJvclN1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xuICAgICAgICB9KTtcblxuICAgICAgICBhcHBSZWYuYm9vdHN0cmFwKHJvb3RDb21wb25lbnQpO1xuICAgICAgICByZXR1cm4gYXBwUmVmO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH0pO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYSBmYWN0b3J5IGZvciBhIHBsYXRmb3JtLiBDYW4gYmUgdXNlZCB0byBwcm92aWRlIG9yIG92ZXJyaWRlIGBQcm92aWRlcnNgIHNwZWNpZmljIHRvXG4gKiB5b3VyIGFwcGxpY2F0aW9uJ3MgcnVudGltZSBuZWVkcywgc3VjaCBhcyBgUExBVEZPUk1fSU5JVElBTElaRVJgIGFuZCBgUExBVEZPUk1fSURgLlxuICogQHBhcmFtIHBhcmVudFBsYXRmb3JtRmFjdG9yeSBBbm90aGVyIHBsYXRmb3JtIGZhY3RvcnkgdG8gbW9kaWZ5LiBBbGxvd3MgeW91IHRvIGNvbXBvc2UgZmFjdG9yaWVzXG4gKiB0byBidWlsZCB1cCBjb25maWd1cmF0aW9ucyB0aGF0IG1pZ2h0IGJlIHJlcXVpcmVkIGJ5IGRpZmZlcmVudCBsaWJyYXJpZXMgb3IgcGFydHMgb2YgdGhlXG4gKiBhcHBsaWNhdGlvbi5cbiAqIEBwYXJhbSBuYW1lIElkZW50aWZpZXMgdGhlIG5ldyBwbGF0Zm9ybSBmYWN0b3J5LlxuICogQHBhcmFtIHByb3ZpZGVycyBBIHNldCBvZiBkZXBlbmRlbmN5IHByb3ZpZGVycyBmb3IgcGxhdGZvcm1zIGNyZWF0ZWQgd2l0aCB0aGUgbmV3IGZhY3RvcnkuXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlUGxhdGZvcm1GYWN0b3J5KFxuICAgIHBhcmVudFBsYXRmb3JtRmFjdG9yeTogKChleHRyYVByb3ZpZGVycz86IFN0YXRpY1Byb3ZpZGVyW10pID0+IFBsYXRmb3JtUmVmKXxudWxsLCBuYW1lOiBzdHJpbmcsXG4gICAgcHJvdmlkZXJzOiBTdGF0aWNQcm92aWRlcltdID0gW10pOiAoZXh0cmFQcm92aWRlcnM/OiBTdGF0aWNQcm92aWRlcltdKSA9PiBQbGF0Zm9ybVJlZiB7XG4gIGNvbnN0IGRlc2MgPSBgUGxhdGZvcm06ICR7bmFtZX1gO1xuICBjb25zdCBtYXJrZXIgPSBuZXcgSW5qZWN0aW9uVG9rZW4oZGVzYyk7XG4gIHJldHVybiAoZXh0cmFQcm92aWRlcnM6IFN0YXRpY1Byb3ZpZGVyW10gPSBbXSkgPT4ge1xuICAgIGxldCBwbGF0Zm9ybSA9IGdldFBsYXRmb3JtKCk7XG4gICAgaWYgKCFwbGF0Zm9ybSB8fCBwbGF0Zm9ybS5pbmplY3Rvci5nZXQoQUxMT1dfTVVMVElQTEVfUExBVEZPUk1TLCBmYWxzZSkpIHtcbiAgICAgIGNvbnN0IHBsYXRmb3JtUHJvdmlkZXJzOiBTdGF0aWNQcm92aWRlcltdID0gW1xuICAgICAgICAuLi5wcm92aWRlcnMsICAgICAgIC8vXG4gICAgICAgIC4uLmV4dHJhUHJvdmlkZXJzLCAgLy9cbiAgICAgICAge3Byb3ZpZGU6IG1hcmtlciwgdXNlVmFsdWU6IHRydWV9XG4gICAgICBdO1xuICAgICAgaWYgKHBhcmVudFBsYXRmb3JtRmFjdG9yeSkge1xuICAgICAgICBwYXJlbnRQbGF0Zm9ybUZhY3RvcnkocGxhdGZvcm1Qcm92aWRlcnMpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY3JlYXRlUGxhdGZvcm0oY3JlYXRlUGxhdGZvcm1JbmplY3RvcihwbGF0Zm9ybVByb3ZpZGVycywgZGVzYykpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gYXNzZXJ0UGxhdGZvcm0obWFya2VyKTtcbiAgfTtcbn1cblxuLyoqXG4gKiBDaGVja3MgdGhhdCB0aGVyZSBpcyBjdXJyZW50bHkgYSBwbGF0Zm9ybSB0aGF0IGNvbnRhaW5zIHRoZSBnaXZlbiB0b2tlbiBhcyBhIHByb3ZpZGVyLlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFzc2VydFBsYXRmb3JtKHJlcXVpcmVkVG9rZW46IGFueSk6IFBsYXRmb3JtUmVmIHtcbiAgY29uc3QgcGxhdGZvcm0gPSBnZXRQbGF0Zm9ybSgpO1xuXG4gIGlmICghcGxhdGZvcm0pIHtcbiAgICB0aHJvdyBuZXcgUnVudGltZUVycm9yKFJ1bnRpbWVFcnJvckNvZGUuUExBVEZPUk1fTk9UX0ZPVU5ELCBuZ0Rldk1vZGUgJiYgJ05vIHBsYXRmb3JtIGV4aXN0cyEnKTtcbiAgfVxuXG4gIGlmICgodHlwZW9mIG5nRGV2TW9kZSA9PT0gJ3VuZGVmaW5lZCcgfHwgbmdEZXZNb2RlKSAmJlxuICAgICAgIXBsYXRmb3JtLmluamVjdG9yLmdldChyZXF1aXJlZFRva2VuLCBudWxsKSkge1xuICAgIHRocm93IG5ldyBSdW50aW1lRXJyb3IoXG4gICAgICAgIFJ1bnRpbWVFcnJvckNvZGUuTVVMVElQTEVfUExBVEZPUk1TLFxuICAgICAgICAnQSBwbGF0Zm9ybSB3aXRoIGEgZGlmZmVyZW50IGNvbmZpZ3VyYXRpb24gaGFzIGJlZW4gY3JlYXRlZC4gUGxlYXNlIGRlc3Ryb3kgaXQgZmlyc3QuJyk7XG4gIH1cblxuICByZXR1cm4gcGxhdGZvcm07XG59XG5cbi8qKlxuICogSGVscGVyIGZ1bmN0aW9uIHRvIGNyZWF0ZSBhbiBpbnN0YW5jZSBvZiBhIHBsYXRmb3JtIGluamVjdG9yICh0aGF0IG1haW50YWlucyB0aGUgJ3BsYXRmb3JtJ1xuICogc2NvcGUpLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlUGxhdGZvcm1JbmplY3Rvcihwcm92aWRlcnM6IFN0YXRpY1Byb3ZpZGVyW10gPSBbXSwgbmFtZT86IHN0cmluZyk6IEluamVjdG9yIHtcbiAgcmV0dXJuIEluamVjdG9yLmNyZWF0ZSh7XG4gICAgbmFtZSxcbiAgICBwcm92aWRlcnM6IFtcbiAgICAgIHtwcm92aWRlOiBJTkpFQ1RPUl9TQ09QRSwgdXNlVmFsdWU6ICdwbGF0Zm9ybSd9LFxuICAgICAge3Byb3ZpZGU6IFBMQVRGT1JNX0RFU1RST1lfTElTVEVORVJTLCB1c2VWYWx1ZTogbmV3IFNldChbKCkgPT4gX3BsYXRmb3JtSW5qZWN0b3IgPSBudWxsXSl9LFxuICAgICAgLi4ucHJvdmlkZXJzXG4gICAgXSxcbiAgfSk7XG59XG5cbi8qKlxuICogRGVzdHJveXMgdGhlIGN1cnJlbnQgQW5ndWxhciBwbGF0Zm9ybSBhbmQgYWxsIEFuZ3VsYXIgYXBwbGljYXRpb25zIG9uIHRoZSBwYWdlLlxuICogRGVzdHJveXMgYWxsIG1vZHVsZXMgYW5kIGxpc3RlbmVycyByZWdpc3RlcmVkIHdpdGggdGhlIHBsYXRmb3JtLlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRlc3Ryb3lQbGF0Zm9ybSgpOiB2b2lkIHtcbiAgZ2V0UGxhdGZvcm0oKT8uZGVzdHJveSgpO1xufVxuXG4vKipcbiAqIFJldHVybnMgdGhlIGN1cnJlbnQgcGxhdGZvcm0uXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0UGxhdGZvcm0oKTogUGxhdGZvcm1SZWZ8bnVsbCB7XG4gIHJldHVybiBfcGxhdGZvcm1JbmplY3Rvcj8uZ2V0KFBsYXRmb3JtUmVmKSA/PyBudWxsO1xufVxuXG4vKipcbiAqIFByb3ZpZGVzIGFkZGl0aW9uYWwgb3B0aW9ucyB0byB0aGUgYm9vdHN0cmFwaW5nIHByb2Nlc3MuXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgaW50ZXJmYWNlIEJvb3RzdHJhcE9wdGlvbnMge1xuICAvKipcbiAgICogT3B0aW9uYWxseSBzcGVjaWZ5IHdoaWNoIGBOZ1pvbmVgIHNob3VsZCBiZSB1c2VkLlxuICAgKlxuICAgKiAtIFByb3ZpZGUgeW91ciBvd24gYE5nWm9uZWAgaW5zdGFuY2UuXG4gICAqIC0gYHpvbmUuanNgIC0gVXNlIGRlZmF1bHQgYE5nWm9uZWAgd2hpY2ggcmVxdWlyZXMgYFpvbmUuanNgLlxuICAgKiAtIGBub29wYCAtIFVzZSBgTm9vcE5nWm9uZWAgd2hpY2ggZG9lcyBub3RoaW5nLlxuICAgKi9cbiAgbmdab25lPzogTmdab25lfCd6b25lLmpzJ3wnbm9vcCc7XG5cbiAgLyoqXG4gICAqIE9wdGlvbmFsbHkgc3BlY2lmeSBjb2FsZXNjaW5nIGV2ZW50IGNoYW5nZSBkZXRlY3Rpb25zIG9yIG5vdC5cbiAgICogQ29uc2lkZXIgdGhlIGZvbGxvd2luZyBjYXNlLlxuICAgKlxuICAgKiA8ZGl2IChjbGljayk9XCJkb1NvbWV0aGluZygpXCI+XG4gICAqICAgPGJ1dHRvbiAoY2xpY2spPVwiZG9Tb21ldGhpbmdFbHNlKClcIj48L2J1dHRvbj5cbiAgICogPC9kaXY+XG4gICAqXG4gICAqIFdoZW4gYnV0dG9uIGlzIGNsaWNrZWQsIGJlY2F1c2Ugb2YgdGhlIGV2ZW50IGJ1YmJsaW5nLCBib3RoXG4gICAqIGV2ZW50IGhhbmRsZXJzIHdpbGwgYmUgY2FsbGVkIGFuZCAyIGNoYW5nZSBkZXRlY3Rpb25zIHdpbGwgYmVcbiAgICogdHJpZ2dlcmVkLiBXZSBjYW4gY29sZXNjZSBzdWNoIGtpbmQgb2YgZXZlbnRzIHRvIG9ubHkgdHJpZ2dlclxuICAgKiBjaGFuZ2UgZGV0ZWN0aW9uIG9ubHkgb25jZS5cbiAgICpcbiAgICogQnkgZGVmYXVsdCwgdGhpcyBvcHRpb24gd2lsbCBiZSBmYWxzZS4gU28gdGhlIGV2ZW50cyB3aWxsIG5vdCBiZVxuICAgKiBjb2FsZXNjZWQgYW5kIHRoZSBjaGFuZ2UgZGV0ZWN0aW9uIHdpbGwgYmUgdHJpZ2dlcmVkIG11bHRpcGxlIHRpbWVzLlxuICAgKiBBbmQgaWYgdGhpcyBvcHRpb24gYmUgc2V0IHRvIHRydWUsIHRoZSBjaGFuZ2UgZGV0ZWN0aW9uIHdpbGwgYmVcbiAgICogdHJpZ2dlcmVkIGFzeW5jIGJ5IHNjaGVkdWxpbmcgYSBhbmltYXRpb24gZnJhbWUuIFNvIGluIHRoZSBjYXNlIGFib3ZlLFxuICAgKiB0aGUgY2hhbmdlIGRldGVjdGlvbiB3aWxsIG9ubHkgYmUgdHJpZ2dlcmVkIG9uY2UuXG4gICAqL1xuICBuZ1pvbmVFdmVudENvYWxlc2Npbmc/OiBib29sZWFuO1xuXG4gIC8qKlxuICAgKiBPcHRpb25hbGx5IHNwZWNpZnkgaWYgYE5nWm9uZSNydW4oKWAgbWV0aG9kIGludm9jYXRpb25zIHNob3VsZCBiZSBjb2FsZXNjZWRcbiAgICogaW50byBhIHNpbmdsZSBjaGFuZ2UgZGV0ZWN0aW9uLlxuICAgKlxuICAgKiBDb25zaWRlciB0aGUgZm9sbG93aW5nIGNhc2UuXG4gICAqXG4gICAqIGZvciAobGV0IGkgPSAwOyBpIDwgMTA7IGkgKyspIHtcbiAgICogICBuZ1pvbmUucnVuKCgpID0+IHtcbiAgICogICAgIC8vIGRvIHNvbWV0aGluZ1xuICAgKiAgIH0pO1xuICAgKiB9XG4gICAqXG4gICAqIFRoaXMgY2FzZSB0cmlnZ2VycyB0aGUgY2hhbmdlIGRldGVjdGlvbiBtdWx0aXBsZSB0aW1lcy5cbiAgICogV2l0aCBuZ1pvbmVSdW5Db2FsZXNjaW5nIG9wdGlvbnMsIGFsbCBjaGFuZ2UgZGV0ZWN0aW9ucyBpbiBhbiBldmVudCBsb29wIHRyaWdnZXIgb25seSBvbmNlLlxuICAgKiBJbiBhZGRpdGlvbiwgdGhlIGNoYW5nZSBkZXRlY3Rpb24gZXhlY3V0ZXMgaW4gcmVxdWVzdEFuaW1hdGlvbi5cbiAgICpcbiAgICovXG4gIG5nWm9uZVJ1bkNvYWxlc2Npbmc/OiBib29sZWFuO1xufVxuXG4vKipcbiAqIFRoZSBBbmd1bGFyIHBsYXRmb3JtIGlzIHRoZSBlbnRyeSBwb2ludCBmb3IgQW5ndWxhciBvbiBhIHdlYiBwYWdlLlxuICogRWFjaCBwYWdlIGhhcyBleGFjdGx5IG9uZSBwbGF0Zm9ybS4gU2VydmljZXMgKHN1Y2ggYXMgcmVmbGVjdGlvbikgd2hpY2ggYXJlIGNvbW1vblxuICogdG8gZXZlcnkgQW5ndWxhciBhcHBsaWNhdGlvbiBydW5uaW5nIG9uIHRoZSBwYWdlIGFyZSBib3VuZCBpbiBpdHMgc2NvcGUuXG4gKiBBIHBhZ2UncyBwbGF0Zm9ybSBpcyBpbml0aWFsaXplZCBpbXBsaWNpdGx5IHdoZW4gYSBwbGF0Zm9ybSBpcyBjcmVhdGVkIHVzaW5nIGEgcGxhdGZvcm1cbiAqIGZhY3Rvcnkgc3VjaCBhcyBgUGxhdGZvcm1Ccm93c2VyYCwgb3IgZXhwbGljaXRseSBieSBjYWxsaW5nIHRoZSBgY3JlYXRlUGxhdGZvcm0oKWAgZnVuY3Rpb24uXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5ASW5qZWN0YWJsZSh7cHJvdmlkZWRJbjogJ3BsYXRmb3JtJ30pXG5leHBvcnQgY2xhc3MgUGxhdGZvcm1SZWYge1xuICBwcml2YXRlIF9tb2R1bGVzOiBOZ01vZHVsZVJlZjxhbnk+W10gPSBbXTtcbiAgcHJpdmF0ZSBfZGVzdHJveUxpc3RlbmVyczogQXJyYXk8KCkgPT4gdm9pZD4gPSBbXTtcbiAgcHJpdmF0ZSBfZGVzdHJveWVkOiBib29sZWFuID0gZmFsc2U7XG5cbiAgLyoqIEBpbnRlcm5hbCAqL1xuICBjb25zdHJ1Y3Rvcihwcml2YXRlIF9pbmplY3RvcjogSW5qZWN0b3IpIHt9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYW4gaW5zdGFuY2Ugb2YgYW4gYEBOZ01vZHVsZWAgZm9yIHRoZSBnaXZlbiBwbGF0Zm9ybS5cbiAgICpcbiAgICogQGRlcHJlY2F0ZWQgUGFzc2luZyBOZ01vZHVsZSBmYWN0b3JpZXMgYXMgdGhlIGBQbGF0Zm9ybVJlZi5ib290c3RyYXBNb2R1bGVGYWN0b3J5YCBmdW5jdGlvblxuICAgKiAgICAgYXJndW1lbnQgaXMgZGVwcmVjYXRlZC4gVXNlIHRoZSBgUGxhdGZvcm1SZWYuYm9vdHN0cmFwTW9kdWxlYCBBUEkgaW5zdGVhZC5cbiAgICovXG4gIGJvb3RzdHJhcE1vZHVsZUZhY3Rvcnk8TT4obW9kdWxlRmFjdG9yeTogTmdNb2R1bGVGYWN0b3J5PE0+LCBvcHRpb25zPzogQm9vdHN0cmFwT3B0aW9ucyk6XG4gICAgICBQcm9taXNlPE5nTW9kdWxlUmVmPE0+PiB7XG4gICAgLy8gTm90ZTogV2UgbmVlZCB0byBjcmVhdGUgdGhlIE5nWm9uZSBfYmVmb3JlXyB3ZSBpbnN0YW50aWF0ZSB0aGUgbW9kdWxlLFxuICAgIC8vIGFzIGluc3RhbnRpYXRpbmcgdGhlIG1vZHVsZSBjcmVhdGVzIHNvbWUgcHJvdmlkZXJzIGVhZ2VybHkuXG4gICAgLy8gU28gd2UgY3JlYXRlIGEgbWluaSBwYXJlbnQgaW5qZWN0b3IgdGhhdCBqdXN0IGNvbnRhaW5zIHRoZSBuZXcgTmdab25lIGFuZFxuICAgIC8vIHBhc3MgdGhhdCBhcyBwYXJlbnQgdG8gdGhlIE5nTW9kdWxlRmFjdG9yeS5cbiAgICBjb25zdCBuZ1pvbmUgPSBnZXROZ1pvbmUob3B0aW9ucz8ubmdab25lLCBnZXROZ1pvbmVPcHRpb25zKG9wdGlvbnMpKTtcbiAgICBjb25zdCBwcm92aWRlcnM6IFN0YXRpY1Byb3ZpZGVyW10gPSBbe3Byb3ZpZGU6IE5nWm9uZSwgdXNlVmFsdWU6IG5nWm9uZX1dO1xuICAgIC8vIE5vdGU6IENyZWF0ZSBuZ1pvbmVJbmplY3RvciB3aXRoaW4gbmdab25lLnJ1biBzbyB0aGF0IGFsbCBvZiB0aGUgaW5zdGFudGlhdGVkIHNlcnZpY2VzIGFyZVxuICAgIC8vIGNyZWF0ZWQgd2l0aGluIHRoZSBBbmd1bGFyIHpvbmVcbiAgICAvLyBEbyBub3QgdHJ5IHRvIHJlcGxhY2Ugbmdab25lLnJ1biB3aXRoIEFwcGxpY2F0aW9uUmVmI3J1biBiZWNhdXNlIEFwcGxpY2F0aW9uUmVmIHdvdWxkIHRoZW4gYmVcbiAgICAvLyBjcmVhdGVkIG91dHNpZGUgb2YgdGhlIEFuZ3VsYXIgem9uZS5cbiAgICByZXR1cm4gbmdab25lLnJ1bigoKSA9PiB7XG4gICAgICBjb25zdCBuZ1pvbmVJbmplY3RvciA9IEluamVjdG9yLmNyZWF0ZShcbiAgICAgICAgICB7cHJvdmlkZXJzOiBwcm92aWRlcnMsIHBhcmVudDogdGhpcy5pbmplY3RvciwgbmFtZTogbW9kdWxlRmFjdG9yeS5tb2R1bGVUeXBlLm5hbWV9KTtcbiAgICAgIGNvbnN0IG1vZHVsZVJlZiA9IDxJbnRlcm5hbE5nTW9kdWxlUmVmPE0+Pm1vZHVsZUZhY3RvcnkuY3JlYXRlKG5nWm9uZUluamVjdG9yKTtcbiAgICAgIGNvbnN0IGV4Y2VwdGlvbkhhbmRsZXI6IEVycm9ySGFuZGxlcnxudWxsID0gbW9kdWxlUmVmLmluamVjdG9yLmdldChFcnJvckhhbmRsZXIsIG51bGwpO1xuICAgICAgaWYgKCFleGNlcHRpb25IYW5kbGVyKSB7XG4gICAgICAgIHRocm93IG5ldyBSdW50aW1lRXJyb3IoXG4gICAgICAgICAgICBSdW50aW1lRXJyb3JDb2RlLkVSUk9SX0hBTkRMRVJfTk9UX0ZPVU5ELFxuICAgICAgICAgICAgbmdEZXZNb2RlICYmICdObyBFcnJvckhhbmRsZXIuIElzIHBsYXRmb3JtIG1vZHVsZSAoQnJvd3Nlck1vZHVsZSkgaW5jbHVkZWQ/Jyk7XG4gICAgICB9XG4gICAgICBuZ1pvbmUhLnJ1bk91dHNpZGVBbmd1bGFyKCgpID0+IHtcbiAgICAgICAgY29uc3Qgc3Vic2NyaXB0aW9uID0gbmdab25lIS5vbkVycm9yLnN1YnNjcmliZSh7XG4gICAgICAgICAgbmV4dDogKGVycm9yOiBhbnkpID0+IHtcbiAgICAgICAgICAgIGV4Y2VwdGlvbkhhbmRsZXIuaGFuZGxlRXJyb3IoZXJyb3IpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIG1vZHVsZVJlZi5vbkRlc3Ryb3koKCkgPT4ge1xuICAgICAgICAgIHJlbW92ZSh0aGlzLl9tb2R1bGVzLCBtb2R1bGVSZWYpO1xuICAgICAgICAgIHN1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIF9jYWxsQW5kUmVwb3J0VG9FcnJvckhhbmRsZXIoZXhjZXB0aW9uSGFuZGxlciwgbmdab25lISwgKCkgPT4ge1xuICAgICAgICBjb25zdCBpbml0U3RhdHVzOiBBcHBsaWNhdGlvbkluaXRTdGF0dXMgPSBtb2R1bGVSZWYuaW5qZWN0b3IuZ2V0KEFwcGxpY2F0aW9uSW5pdFN0YXR1cyk7XG4gICAgICAgIGluaXRTdGF0dXMucnVuSW5pdGlhbGl6ZXJzKCk7XG4gICAgICAgIHJldHVybiBpbml0U3RhdHVzLmRvbmVQcm9taXNlLnRoZW4oKCkgPT4ge1xuICAgICAgICAgIC8vIElmIHRoZSBgTE9DQUxFX0lEYCBwcm92aWRlciBpcyBkZWZpbmVkIGF0IGJvb3RzdHJhcCB0aGVuIHdlIHNldCB0aGUgdmFsdWUgZm9yIGl2eVxuICAgICAgICAgIGNvbnN0IGxvY2FsZUlkID0gbW9kdWxlUmVmLmluamVjdG9yLmdldChMT0NBTEVfSUQsIERFRkFVTFRfTE9DQUxFX0lEKTtcbiAgICAgICAgICBzZXRMb2NhbGVJZChsb2NhbGVJZCB8fCBERUZBVUxUX0xPQ0FMRV9JRCk7XG4gICAgICAgICAgdGhpcy5fbW9kdWxlRG9Cb290c3RyYXAobW9kdWxlUmVmKTtcbiAgICAgICAgICByZXR1cm4gbW9kdWxlUmVmO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYW4gaW5zdGFuY2Ugb2YgYW4gYEBOZ01vZHVsZWAgZm9yIGEgZ2l2ZW4gcGxhdGZvcm0uXG4gICAqXG4gICAqIEB1c2FnZU5vdGVzXG4gICAqICMjIyBTaW1wbGUgRXhhbXBsZVxuICAgKlxuICAgKiBgYGB0eXBlc2NyaXB0XG4gICAqIEBOZ01vZHVsZSh7XG4gICAqICAgaW1wb3J0czogW0Jyb3dzZXJNb2R1bGVdXG4gICAqIH0pXG4gICAqIGNsYXNzIE15TW9kdWxlIHt9XG4gICAqXG4gICAqIGxldCBtb2R1bGVSZWYgPSBwbGF0Zm9ybUJyb3dzZXIoKS5ib290c3RyYXBNb2R1bGUoTXlNb2R1bGUpO1xuICAgKiBgYGBcbiAgICpcbiAgICovXG4gIGJvb3RzdHJhcE1vZHVsZTxNPihcbiAgICAgIG1vZHVsZVR5cGU6IFR5cGU8TT4sXG4gICAgICBjb21waWxlck9wdGlvbnM6IChDb21waWxlck9wdGlvbnMmQm9vdHN0cmFwT3B0aW9ucyl8XG4gICAgICBBcnJheTxDb21waWxlck9wdGlvbnMmQm9vdHN0cmFwT3B0aW9ucz4gPSBbXSk6IFByb21pc2U8TmdNb2R1bGVSZWY8TT4+IHtcbiAgICBjb25zdCBvcHRpb25zID0gb3B0aW9uc1JlZHVjZXIoe30sIGNvbXBpbGVyT3B0aW9ucyk7XG4gICAgcmV0dXJuIGNvbXBpbGVOZ01vZHVsZUZhY3RvcnkodGhpcy5pbmplY3Rvciwgb3B0aW9ucywgbW9kdWxlVHlwZSlcbiAgICAgICAgLnRoZW4obW9kdWxlRmFjdG9yeSA9PiB0aGlzLmJvb3RzdHJhcE1vZHVsZUZhY3RvcnkobW9kdWxlRmFjdG9yeSwgb3B0aW9ucykpO1xuICB9XG5cbiAgcHJpdmF0ZSBfbW9kdWxlRG9Cb290c3RyYXAobW9kdWxlUmVmOiBJbnRlcm5hbE5nTW9kdWxlUmVmPGFueT4pOiB2b2lkIHtcbiAgICBjb25zdCBhcHBSZWYgPSBtb2R1bGVSZWYuaW5qZWN0b3IuZ2V0KEFwcGxpY2F0aW9uUmVmKSBhcyBBcHBsaWNhdGlvblJlZjtcbiAgICBpZiAobW9kdWxlUmVmLl9ib290c3RyYXBDb21wb25lbnRzLmxlbmd0aCA+IDApIHtcbiAgICAgIG1vZHVsZVJlZi5fYm9vdHN0cmFwQ29tcG9uZW50cy5mb3JFYWNoKGYgPT4gYXBwUmVmLmJvb3RzdHJhcChmKSk7XG4gICAgfSBlbHNlIGlmIChtb2R1bGVSZWYuaW5zdGFuY2UubmdEb0Jvb3RzdHJhcCkge1xuICAgICAgbW9kdWxlUmVmLmluc3RhbmNlLm5nRG9Cb290c3RyYXAoYXBwUmVmKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgbmV3IFJ1bnRpbWVFcnJvcihcbiAgICAgICAgICBSdW50aW1lRXJyb3JDb2RlLkJPT1RTVFJBUF9DT01QT05FTlRTX05PVF9GT1VORCxcbiAgICAgICAgICBuZ0Rldk1vZGUgJiZcbiAgICAgICAgICAgICAgYFRoZSBtb2R1bGUgJHtzdHJpbmdpZnkobW9kdWxlUmVmLmluc3RhbmNlLmNvbnN0cnVjdG9yKX0gd2FzIGJvb3RzdHJhcHBlZCwgYCArXG4gICAgICAgICAgICAgICAgICBgYnV0IGl0IGRvZXMgbm90IGRlY2xhcmUgXCJATmdNb2R1bGUuYm9vdHN0cmFwXCIgY29tcG9uZW50cyBub3IgYSBcIm5nRG9Cb290c3RyYXBcIiBtZXRob2QuIGAgK1xuICAgICAgICAgICAgICAgICAgYFBsZWFzZSBkZWZpbmUgb25lIG9mIHRoZXNlLmApO1xuICAgIH1cbiAgICB0aGlzLl9tb2R1bGVzLnB1c2gobW9kdWxlUmVmKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZWdpc3RlcnMgYSBsaXN0ZW5lciB0byBiZSBjYWxsZWQgd2hlbiB0aGUgcGxhdGZvcm0gaXMgZGVzdHJveWVkLlxuICAgKi9cbiAgb25EZXN0cm95KGNhbGxiYWNrOiAoKSA9PiB2b2lkKTogdm9pZCB7XG4gICAgdGhpcy5fZGVzdHJveUxpc3RlbmVycy5wdXNoKGNhbGxiYWNrKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXRyaWV2ZXMgdGhlIHBsYXRmb3JtIHtAbGluayBJbmplY3Rvcn0sIHdoaWNoIGlzIHRoZSBwYXJlbnQgaW5qZWN0b3IgZm9yXG4gICAqIGV2ZXJ5IEFuZ3VsYXIgYXBwbGljYXRpb24gb24gdGhlIHBhZ2UgYW5kIHByb3ZpZGVzIHNpbmdsZXRvbiBwcm92aWRlcnMuXG4gICAqL1xuICBnZXQgaW5qZWN0b3IoKTogSW5qZWN0b3Ige1xuICAgIHJldHVybiB0aGlzLl9pbmplY3RvcjtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZXN0cm95cyB0aGUgY3VycmVudCBBbmd1bGFyIHBsYXRmb3JtIGFuZCBhbGwgQW5ndWxhciBhcHBsaWNhdGlvbnMgb24gdGhlIHBhZ2UuXG4gICAqIERlc3Ryb3lzIGFsbCBtb2R1bGVzIGFuZCBsaXN0ZW5lcnMgcmVnaXN0ZXJlZCB3aXRoIHRoZSBwbGF0Zm9ybS5cbiAgICovXG4gIGRlc3Ryb3koKSB7XG4gICAgaWYgKHRoaXMuX2Rlc3Ryb3llZCkge1xuICAgICAgdGhyb3cgbmV3IFJ1bnRpbWVFcnJvcihcbiAgICAgICAgICBSdW50aW1lRXJyb3JDb2RlLlBMQVRGT1JNX0FMUkVBRFlfREVTVFJPWUVELFxuICAgICAgICAgIG5nRGV2TW9kZSAmJiAnVGhlIHBsYXRmb3JtIGhhcyBhbHJlYWR5IGJlZW4gZGVzdHJveWVkIScpO1xuICAgIH1cbiAgICB0aGlzLl9tb2R1bGVzLnNsaWNlKCkuZm9yRWFjaChtb2R1bGUgPT4gbW9kdWxlLmRlc3Ryb3koKSk7XG4gICAgdGhpcy5fZGVzdHJveUxpc3RlbmVycy5mb3JFYWNoKGxpc3RlbmVyID0+IGxpc3RlbmVyKCkpO1xuXG4gICAgY29uc3QgZGVzdHJveUxpc3RlbmVycyA9IHRoaXMuX2luamVjdG9yLmdldChQTEFURk9STV9ERVNUUk9ZX0xJU1RFTkVSUywgbnVsbCk7XG4gICAgaWYgKGRlc3Ryb3lMaXN0ZW5lcnMpIHtcbiAgICAgIGRlc3Ryb3lMaXN0ZW5lcnMuZm9yRWFjaChsaXN0ZW5lciA9PiBsaXN0ZW5lcigpKTtcbiAgICAgIGRlc3Ryb3lMaXN0ZW5lcnMuY2xlYXIoKTtcbiAgICB9XG5cbiAgICB0aGlzLl9kZXN0cm95ZWQgPSB0cnVlO1xuICB9XG5cbiAgLyoqXG4gICAqIEluZGljYXRlcyB3aGV0aGVyIHRoaXMgaW5zdGFuY2Ugd2FzIGRlc3Ryb3llZC5cbiAgICovXG4gIGdldCBkZXN0cm95ZWQoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2Rlc3Ryb3llZDtcbiAgfVxufVxuXG4vLyBTZXQgb2Ygb3B0aW9ucyByZWNvZ25pemVkIGJ5IHRoZSBOZ1pvbmUuXG5pbnRlcmZhY2UgTmdab25lT3B0aW9ucyB7XG4gIGVuYWJsZUxvbmdTdGFja1RyYWNlOiBib29sZWFuO1xuICBzaG91bGRDb2FsZXNjZUV2ZW50Q2hhbmdlRGV0ZWN0aW9uOiBib29sZWFuO1xuICBzaG91bGRDb2FsZXNjZVJ1bkNoYW5nZURldGVjdGlvbjogYm9vbGVhbjtcbn1cblxuLy8gVHJhbnNmb3JtcyBhIHNldCBvZiBgQm9vdHN0cmFwT3B0aW9uc2AgKHN1cHBvcnRlZCBieSB0aGUgTmdNb2R1bGUtYmFzZWQgYm9vdHN0cmFwIEFQSXMpIC0+XG4vLyBgTmdab25lT3B0aW9uc2AgdGhhdCBhcmUgcmVjb2duaXplZCBieSB0aGUgTmdab25lIGNvbnN0cnVjdG9yLiBQYXNzaW5nIG5vIG9wdGlvbnMgd2lsbCByZXN1bHQgaW5cbi8vIGEgc2V0IG9mIGRlZmF1bHQgb3B0aW9ucyByZXR1cm5lZC5cbmZ1bmN0aW9uIGdldE5nWm9uZU9wdGlvbnMob3B0aW9ucz86IEJvb3RzdHJhcE9wdGlvbnMpOiBOZ1pvbmVPcHRpb25zIHtcbiAgcmV0dXJuIHtcbiAgICBlbmFibGVMb25nU3RhY2tUcmFjZTogdHlwZW9mIG5nRGV2TW9kZSA9PT0gJ3VuZGVmaW5lZCcgPyBmYWxzZSA6ICEhbmdEZXZNb2RlLFxuICAgIHNob3VsZENvYWxlc2NlRXZlbnRDaGFuZ2VEZXRlY3Rpb246ICEhKG9wdGlvbnMgJiYgb3B0aW9ucy5uZ1pvbmVFdmVudENvYWxlc2NpbmcpIHx8IGZhbHNlLFxuICAgIHNob3VsZENvYWxlc2NlUnVuQ2hhbmdlRGV0ZWN0aW9uOiAhIShvcHRpb25zICYmIG9wdGlvbnMubmdab25lUnVuQ29hbGVzY2luZykgfHwgZmFsc2UsXG4gIH07XG59XG5cbmZ1bmN0aW9uIGdldE5nWm9uZShuZ1pvbmVUb1VzZTogTmdab25lfCd6b25lLmpzJ3wnbm9vcCd8dW5kZWZpbmVkLCBvcHRpb25zOiBOZ1pvbmVPcHRpb25zKTogTmdab25lIHtcbiAgbGV0IG5nWm9uZTogTmdab25lO1xuXG4gIGlmIChuZ1pvbmVUb1VzZSA9PT0gJ25vb3AnKSB7XG4gICAgbmdab25lID0gbmV3IE5vb3BOZ1pvbmUoKTtcbiAgfSBlbHNlIHtcbiAgICBuZ1pvbmUgPSAobmdab25lVG9Vc2UgPT09ICd6b25lLmpzJyA/IHVuZGVmaW5lZCA6IG5nWm9uZVRvVXNlKSB8fCBuZXcgTmdab25lKG9wdGlvbnMpO1xuICB9XG4gIHJldHVybiBuZ1pvbmU7XG59XG5cbmZ1bmN0aW9uIF9jYWxsQW5kUmVwb3J0VG9FcnJvckhhbmRsZXIoXG4gICAgZXJyb3JIYW5kbGVyOiBFcnJvckhhbmRsZXIsIG5nWm9uZTogTmdab25lLCBjYWxsYmFjazogKCkgPT4gYW55KTogYW55IHtcbiAgdHJ5IHtcbiAgICBjb25zdCByZXN1bHQgPSBjYWxsYmFjaygpO1xuICAgIGlmIChpc1Byb21pc2UocmVzdWx0KSkge1xuICAgICAgcmV0dXJuIHJlc3VsdC5jYXRjaCgoZTogYW55KSA9PiB7XG4gICAgICAgIG5nWm9uZS5ydW5PdXRzaWRlQW5ndWxhcigoKSA9PiBlcnJvckhhbmRsZXIuaGFuZGxlRXJyb3IoZSkpO1xuICAgICAgICAvLyByZXRocm93IGFzIHRoZSBleGNlcHRpb24gaGFuZGxlciBtaWdodCBub3QgZG8gaXRcbiAgICAgICAgdGhyb3cgZTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHJldHVybiByZXN1bHQ7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICBuZ1pvbmUucnVuT3V0c2lkZUFuZ3VsYXIoKCkgPT4gZXJyb3JIYW5kbGVyLmhhbmRsZUVycm9yKGUpKTtcbiAgICAvLyByZXRocm93IGFzIHRoZSBleGNlcHRpb24gaGFuZGxlciBtaWdodCBub3QgZG8gaXRcbiAgICB0aHJvdyBlO1xuICB9XG59XG5cbmZ1bmN0aW9uIG9wdGlvbnNSZWR1Y2VyPFQgZXh0ZW5kcyBPYmplY3Q+KGRzdDogYW55LCBvYmpzOiBUfFRbXSk6IFQge1xuICBpZiAoQXJyYXkuaXNBcnJheShvYmpzKSkge1xuICAgIGRzdCA9IG9ianMucmVkdWNlKG9wdGlvbnNSZWR1Y2VyLCBkc3QpO1xuICB9IGVsc2Uge1xuICAgIGRzdCA9IHsuLi5kc3QsIC4uLihvYmpzIGFzIGFueSl9O1xuICB9XG4gIHJldHVybiBkc3Q7XG59XG5cbi8qKlxuICogQSByZWZlcmVuY2UgdG8gYW4gQW5ndWxhciBhcHBsaWNhdGlvbiBydW5uaW5nIG9uIGEgcGFnZS5cbiAqXG4gKiBAdXNhZ2VOb3Rlc1xuICpcbiAqIHtAYSBpcy1zdGFibGUtZXhhbXBsZXN9XG4gKiAjIyMgaXNTdGFibGUgZXhhbXBsZXMgYW5kIGNhdmVhdHNcbiAqXG4gKiBOb3RlIHR3byBpbXBvcnRhbnQgcG9pbnRzIGFib3V0IGBpc1N0YWJsZWAsIGRlbW9uc3RyYXRlZCBpbiB0aGUgZXhhbXBsZXMgYmVsb3c6XG4gKiAtIHRoZSBhcHBsaWNhdGlvbiB3aWxsIG5ldmVyIGJlIHN0YWJsZSBpZiB5b3Ugc3RhcnQgYW55IGtpbmRcbiAqIG9mIHJlY3VycmVudCBhc3luY2hyb25vdXMgdGFzayB3aGVuIHRoZSBhcHBsaWNhdGlvbiBzdGFydHNcbiAqIChmb3IgZXhhbXBsZSBmb3IgYSBwb2xsaW5nIHByb2Nlc3MsIHN0YXJ0ZWQgd2l0aCBhIGBzZXRJbnRlcnZhbGAsIGEgYHNldFRpbWVvdXRgXG4gKiBvciB1c2luZyBSeEpTIG9wZXJhdG9ycyBsaWtlIGBpbnRlcnZhbGApO1xuICogLSB0aGUgYGlzU3RhYmxlYCBPYnNlcnZhYmxlIHJ1bnMgb3V0c2lkZSBvZiB0aGUgQW5ndWxhciB6b25lLlxuICpcbiAqIExldCdzIGltYWdpbmUgdGhhdCB5b3Ugc3RhcnQgYSByZWN1cnJlbnQgdGFza1xuICogKGhlcmUgaW5jcmVtZW50aW5nIGEgY291bnRlciwgdXNpbmcgUnhKUyBgaW50ZXJ2YWxgKSxcbiAqIGFuZCBhdCB0aGUgc2FtZSB0aW1lIHN1YnNjcmliZSB0byBgaXNTdGFibGVgLlxuICpcbiAqIGBgYFxuICogY29uc3RydWN0b3IoYXBwUmVmOiBBcHBsaWNhdGlvblJlZikge1xuICogICBhcHBSZWYuaXNTdGFibGUucGlwZShcbiAqICAgICAgZmlsdGVyKHN0YWJsZSA9PiBzdGFibGUpXG4gKiAgICkuc3Vic2NyaWJlKCgpID0+IGNvbnNvbGUubG9nKCdBcHAgaXMgc3RhYmxlIG5vdycpO1xuICogICBpbnRlcnZhbCgxMDAwKS5zdWJzY3JpYmUoY291bnRlciA9PiBjb25zb2xlLmxvZyhjb3VudGVyKSk7XG4gKiB9XG4gKiBgYGBcbiAqIEluIHRoaXMgZXhhbXBsZSwgYGlzU3RhYmxlYCB3aWxsIG5ldmVyIGVtaXQgYHRydWVgLFxuICogYW5kIHRoZSB0cmFjZSBcIkFwcCBpcyBzdGFibGUgbm93XCIgd2lsbCBuZXZlciBnZXQgbG9nZ2VkLlxuICpcbiAqIElmIHlvdSB3YW50IHRvIGV4ZWN1dGUgc29tZXRoaW5nIHdoZW4gdGhlIGFwcCBpcyBzdGFibGUsXG4gKiB5b3UgaGF2ZSB0byB3YWl0IGZvciB0aGUgYXBwbGljYXRpb24gdG8gYmUgc3RhYmxlXG4gKiBiZWZvcmUgc3RhcnRpbmcgeW91ciBwb2xsaW5nIHByb2Nlc3MuXG4gKlxuICogYGBgXG4gKiBjb25zdHJ1Y3RvcihhcHBSZWY6IEFwcGxpY2F0aW9uUmVmKSB7XG4gKiAgIGFwcFJlZi5pc1N0YWJsZS5waXBlKFxuICogICAgIGZpcnN0KHN0YWJsZSA9PiBzdGFibGUpLFxuICogICAgIHRhcChzdGFibGUgPT4gY29uc29sZS5sb2coJ0FwcCBpcyBzdGFibGUgbm93JykpLFxuICogICAgIHN3aXRjaE1hcCgoKSA9PiBpbnRlcnZhbCgxMDAwKSlcbiAqICAgKS5zdWJzY3JpYmUoY291bnRlciA9PiBjb25zb2xlLmxvZyhjb3VudGVyKSk7XG4gKiB9XG4gKiBgYGBcbiAqIEluIHRoaXMgZXhhbXBsZSwgdGhlIHRyYWNlIFwiQXBwIGlzIHN0YWJsZSBub3dcIiB3aWxsIGJlIGxvZ2dlZFxuICogYW5kIHRoZW4gdGhlIGNvdW50ZXIgc3RhcnRzIGluY3JlbWVudGluZyBldmVyeSBzZWNvbmQuXG4gKlxuICogTm90ZSBhbHNvIHRoYXQgdGhpcyBPYnNlcnZhYmxlIHJ1bnMgb3V0c2lkZSBvZiB0aGUgQW5ndWxhciB6b25lLFxuICogd2hpY2ggbWVhbnMgdGhhdCB0aGUgY29kZSBpbiB0aGUgc3Vic2NyaXB0aW9uXG4gKiB0byB0aGlzIE9ic2VydmFibGUgd2lsbCBub3QgdHJpZ2dlciB0aGUgY2hhbmdlIGRldGVjdGlvbi5cbiAqXG4gKiBMZXQncyBpbWFnaW5lIHRoYXQgaW5zdGVhZCBvZiBsb2dnaW5nIHRoZSBjb3VudGVyIHZhbHVlLFxuICogeW91IHVwZGF0ZSBhIGZpZWxkIG9mIHlvdXIgY29tcG9uZW50XG4gKiBhbmQgZGlzcGxheSBpdCBpbiBpdHMgdGVtcGxhdGUuXG4gKlxuICogYGBgXG4gKiBjb25zdHJ1Y3RvcihhcHBSZWY6IEFwcGxpY2F0aW9uUmVmKSB7XG4gKiAgIGFwcFJlZi5pc1N0YWJsZS5waXBlKFxuICogICAgIGZpcnN0KHN0YWJsZSA9PiBzdGFibGUpLFxuICogICAgIHN3aXRjaE1hcCgoKSA9PiBpbnRlcnZhbCgxMDAwKSlcbiAqICAgKS5zdWJzY3JpYmUoY291bnRlciA9PiB0aGlzLnZhbHVlID0gY291bnRlcik7XG4gKiB9XG4gKiBgYGBcbiAqIEFzIHRoZSBgaXNTdGFibGVgIE9ic2VydmFibGUgcnVucyBvdXRzaWRlIHRoZSB6b25lLFxuICogdGhlIGB2YWx1ZWAgZmllbGQgd2lsbCBiZSB1cGRhdGVkIHByb3Blcmx5LFxuICogYnV0IHRoZSB0ZW1wbGF0ZSB3aWxsIG5vdCBiZSByZWZyZXNoZWQhXG4gKlxuICogWW91J2xsIGhhdmUgdG8gbWFudWFsbHkgdHJpZ2dlciB0aGUgY2hhbmdlIGRldGVjdGlvbiB0byB1cGRhdGUgdGhlIHRlbXBsYXRlLlxuICpcbiAqIGBgYFxuICogY29uc3RydWN0b3IoYXBwUmVmOiBBcHBsaWNhdGlvblJlZiwgY2Q6IENoYW5nZURldGVjdG9yUmVmKSB7XG4gKiAgIGFwcFJlZi5pc1N0YWJsZS5waXBlKFxuICogICAgIGZpcnN0KHN0YWJsZSA9PiBzdGFibGUpLFxuICogICAgIHN3aXRjaE1hcCgoKSA9PiBpbnRlcnZhbCgxMDAwKSlcbiAqICAgKS5zdWJzY3JpYmUoY291bnRlciA9PiB7XG4gKiAgICAgdGhpcy52YWx1ZSA9IGNvdW50ZXI7XG4gKiAgICAgY2QuZGV0ZWN0Q2hhbmdlcygpO1xuICogICB9KTtcbiAqIH1cbiAqIGBgYFxuICpcbiAqIE9yIG1ha2UgdGhlIHN1YnNjcmlwdGlvbiBjYWxsYmFjayBydW4gaW5zaWRlIHRoZSB6b25lLlxuICpcbiAqIGBgYFxuICogY29uc3RydWN0b3IoYXBwUmVmOiBBcHBsaWNhdGlvblJlZiwgem9uZTogTmdab25lKSB7XG4gKiAgIGFwcFJlZi5pc1N0YWJsZS5waXBlKFxuICogICAgIGZpcnN0KHN0YWJsZSA9PiBzdGFibGUpLFxuICogICAgIHN3aXRjaE1hcCgoKSA9PiBpbnRlcnZhbCgxMDAwKSlcbiAqICAgKS5zdWJzY3JpYmUoY291bnRlciA9PiB6b25lLnJ1bigoKSA9PiB0aGlzLnZhbHVlID0gY291bnRlcikpO1xuICogfVxuICogYGBgXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5ASW5qZWN0YWJsZSh7cHJvdmlkZWRJbjogJ3Jvb3QnfSlcbmV4cG9ydCBjbGFzcyBBcHBsaWNhdGlvblJlZiB7XG4gIC8qKiBAaW50ZXJuYWwgKi9cbiAgcHJpdmF0ZSBfYm9vdHN0cmFwTGlzdGVuZXJzOiAoKGNvbXBSZWY6IENvbXBvbmVudFJlZjxhbnk+KSA9PiB2b2lkKVtdID0gW107XG4gIHByaXZhdGUgX3ZpZXdzOiBJbnRlcm5hbFZpZXdSZWZbXSA9IFtdO1xuICBwcml2YXRlIF9ydW5uaW5nVGljazogYm9vbGVhbiA9IGZhbHNlO1xuICBwcml2YXRlIF9zdGFibGUgPSB0cnVlO1xuICBwcml2YXRlIF9vbk1pY3JvdGFza0VtcHR5U3Vic2NyaXB0aW9uOiBTdWJzY3JpcHRpb247XG4gIHByaXZhdGUgX2Rlc3Ryb3llZCA9IGZhbHNlO1xuICBwcml2YXRlIF9kZXN0cm95TGlzdGVuZXJzOiBBcnJheTwoKSA9PiB2b2lkPiA9IFtdO1xuXG4gIC8qKlxuICAgKiBJbmRpY2F0ZXMgd2hldGhlciB0aGlzIGluc3RhbmNlIHdhcyBkZXN0cm95ZWQuXG4gICAqL1xuICBnZXQgZGVzdHJveWVkKCkge1xuICAgIHJldHVybiB0aGlzLl9kZXN0cm95ZWQ7XG4gIH1cblxuICAvKipcbiAgICogR2V0IGEgbGlzdCBvZiBjb21wb25lbnQgdHlwZXMgcmVnaXN0ZXJlZCB0byB0aGlzIGFwcGxpY2F0aW9uLlxuICAgKiBUaGlzIGxpc3QgaXMgcG9wdWxhdGVkIGV2ZW4gYmVmb3JlIHRoZSBjb21wb25lbnQgaXMgY3JlYXRlZC5cbiAgICovXG4gIHB1YmxpYyByZWFkb25seSBjb21wb25lbnRUeXBlczogVHlwZTxhbnk+W10gPSBbXTtcblxuICAvKipcbiAgICogR2V0IGEgbGlzdCBvZiBjb21wb25lbnRzIHJlZ2lzdGVyZWQgdG8gdGhpcyBhcHBsaWNhdGlvbi5cbiAgICovXG4gIHB1YmxpYyByZWFkb25seSBjb21wb25lbnRzOiBDb21wb25lbnRSZWY8YW55PltdID0gW107XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYW4gT2JzZXJ2YWJsZSB0aGF0IGluZGljYXRlcyB3aGVuIHRoZSBhcHBsaWNhdGlvbiBpcyBzdGFibGUgb3IgdW5zdGFibGUuXG4gICAqXG4gICAqIEBzZWUgIFtVc2FnZSBub3Rlc10oI2lzLXN0YWJsZS1leGFtcGxlcykgZm9yIGV4YW1wbGVzIGFuZCBjYXZlYXRzIHdoZW4gdXNpbmcgdGhpcyBBUEkuXG4gICAqL1xuICAvLyBUT0RPKGlzc3VlLzI0NTcxKTogcmVtb3ZlICchJy5cbiAgcHVibGljIHJlYWRvbmx5IGlzU3RhYmxlITogT2JzZXJ2YWJsZTxib29sZWFuPjtcblxuICAvKiogQGludGVybmFsICovXG4gIGdldCBpbmplY3RvcigpOiBJbmplY3RvciB7XG4gICAgcmV0dXJuIHRoaXMuX2luamVjdG9yO1xuICB9XG5cbiAgLyoqIEBpbnRlcm5hbCAqL1xuICBjb25zdHJ1Y3RvcihcbiAgICAgIHByaXZhdGUgX3pvbmU6IE5nWm9uZSxcbiAgICAgIHByaXZhdGUgX2luamVjdG9yOiBJbmplY3RvcixcbiAgICAgIHByaXZhdGUgX2V4Y2VwdGlvbkhhbmRsZXI6IEVycm9ySGFuZGxlcixcbiAgKSB7XG4gICAgdGhpcy5fb25NaWNyb3Rhc2tFbXB0eVN1YnNjcmlwdGlvbiA9IHRoaXMuX3pvbmUub25NaWNyb3Rhc2tFbXB0eS5zdWJzY3JpYmUoe1xuICAgICAgbmV4dDogKCkgPT4ge1xuICAgICAgICB0aGlzLl96b25lLnJ1bigoKSA9PiB7XG4gICAgICAgICAgdGhpcy50aWNrKCk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgY29uc3QgaXNDdXJyZW50bHlTdGFibGUgPSBuZXcgT2JzZXJ2YWJsZTxib29sZWFuPigob2JzZXJ2ZXI6IE9ic2VydmVyPGJvb2xlYW4+KSA9PiB7XG4gICAgICB0aGlzLl9zdGFibGUgPSB0aGlzLl96b25lLmlzU3RhYmxlICYmICF0aGlzLl96b25lLmhhc1BlbmRpbmdNYWNyb3Rhc2tzICYmXG4gICAgICAgICAgIXRoaXMuX3pvbmUuaGFzUGVuZGluZ01pY3JvdGFza3M7XG4gICAgICB0aGlzLl96b25lLnJ1bk91dHNpZGVBbmd1bGFyKCgpID0+IHtcbiAgICAgICAgb2JzZXJ2ZXIubmV4dCh0aGlzLl9zdGFibGUpO1xuICAgICAgICBvYnNlcnZlci5jb21wbGV0ZSgpO1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBjb25zdCBpc1N0YWJsZSA9IG5ldyBPYnNlcnZhYmxlPGJvb2xlYW4+KChvYnNlcnZlcjogT2JzZXJ2ZXI8Ym9vbGVhbj4pID0+IHtcbiAgICAgIC8vIENyZWF0ZSB0aGUgc3Vic2NyaXB0aW9uIHRvIG9uU3RhYmxlIG91dHNpZGUgdGhlIEFuZ3VsYXIgWm9uZSBzbyB0aGF0XG4gICAgICAvLyB0aGUgY2FsbGJhY2sgaXMgcnVuIG91dHNpZGUgdGhlIEFuZ3VsYXIgWm9uZS5cbiAgICAgIGxldCBzdGFibGVTdWI6IFN1YnNjcmlwdGlvbjtcbiAgICAgIHRoaXMuX3pvbmUucnVuT3V0c2lkZUFuZ3VsYXIoKCkgPT4ge1xuICAgICAgICBzdGFibGVTdWIgPSB0aGlzLl96b25lLm9uU3RhYmxlLnN1YnNjcmliZSgoKSA9PiB7XG4gICAgICAgICAgTmdab25lLmFzc2VydE5vdEluQW5ndWxhclpvbmUoKTtcblxuICAgICAgICAgIC8vIENoZWNrIHdoZXRoZXIgdGhlcmUgYXJlIG5vIHBlbmRpbmcgbWFjcm8vbWljcm8gdGFza3MgaW4gdGhlIG5leHQgdGlja1xuICAgICAgICAgIC8vIHRvIGFsbG93IGZvciBOZ1pvbmUgdG8gdXBkYXRlIHRoZSBzdGF0ZS5cbiAgICAgICAgICBzY2hlZHVsZU1pY3JvVGFzaygoKSA9PiB7XG4gICAgICAgICAgICBpZiAoIXRoaXMuX3N0YWJsZSAmJiAhdGhpcy5fem9uZS5oYXNQZW5kaW5nTWFjcm90YXNrcyAmJlxuICAgICAgICAgICAgICAgICF0aGlzLl96b25lLmhhc1BlbmRpbmdNaWNyb3Rhc2tzKSB7XG4gICAgICAgICAgICAgIHRoaXMuX3N0YWJsZSA9IHRydWU7XG4gICAgICAgICAgICAgIG9ic2VydmVyLm5leHQodHJ1ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG5cbiAgICAgIGNvbnN0IHVuc3RhYmxlU3ViOiBTdWJzY3JpcHRpb24gPSB0aGlzLl96b25lLm9uVW5zdGFibGUuc3Vic2NyaWJlKCgpID0+IHtcbiAgICAgICAgTmdab25lLmFzc2VydEluQW5ndWxhclpvbmUoKTtcbiAgICAgICAgaWYgKHRoaXMuX3N0YWJsZSkge1xuICAgICAgICAgIHRoaXMuX3N0YWJsZSA9IGZhbHNlO1xuICAgICAgICAgIHRoaXMuX3pvbmUucnVuT3V0c2lkZUFuZ3VsYXIoKCkgPT4ge1xuICAgICAgICAgICAgb2JzZXJ2ZXIubmV4dChmYWxzZSk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgICBzdGFibGVTdWIudW5zdWJzY3JpYmUoKTtcbiAgICAgICAgdW5zdGFibGVTdWIudW5zdWJzY3JpYmUoKTtcbiAgICAgIH07XG4gICAgfSk7XG5cbiAgICAodGhpcyBhcyB7aXNTdGFibGU6IE9ic2VydmFibGU8Ym9vbGVhbj59KS5pc1N0YWJsZSA9XG4gICAgICAgIG1lcmdlKGlzQ3VycmVudGx5U3RhYmxlLCBpc1N0YWJsZS5waXBlKHNoYXJlKCkpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBCb290c3RyYXAgYSBjb21wb25lbnQgb250byB0aGUgZWxlbWVudCBpZGVudGlmaWVkIGJ5IGl0cyBzZWxlY3RvciBvciwgb3B0aW9uYWxseSwgdG8gYVxuICAgKiBzcGVjaWZpZWQgZWxlbWVudC5cbiAgICpcbiAgICogQHVzYWdlTm90ZXNcbiAgICogIyMjIEJvb3RzdHJhcCBwcm9jZXNzXG4gICAqXG4gICAqIFdoZW4gYm9vdHN0cmFwcGluZyBhIGNvbXBvbmVudCwgQW5ndWxhciBtb3VudHMgaXQgb250byBhIHRhcmdldCBET00gZWxlbWVudFxuICAgKiBhbmQga2lja3Mgb2ZmIGF1dG9tYXRpYyBjaGFuZ2UgZGV0ZWN0aW9uLiBUaGUgdGFyZ2V0IERPTSBlbGVtZW50IGNhbiBiZVxuICAgKiBwcm92aWRlZCB1c2luZyB0aGUgYHJvb3RTZWxlY3Rvck9yTm9kZWAgYXJndW1lbnQuXG4gICAqXG4gICAqIElmIHRoZSB0YXJnZXQgRE9NIGVsZW1lbnQgaXMgbm90IHByb3ZpZGVkLCBBbmd1bGFyIHRyaWVzIHRvIGZpbmQgb25lIG9uIGEgcGFnZVxuICAgKiB1c2luZyB0aGUgYHNlbGVjdG9yYCBvZiB0aGUgY29tcG9uZW50IHRoYXQgaXMgYmVpbmcgYm9vdHN0cmFwcGVkXG4gICAqIChmaXJzdCBtYXRjaGVkIGVsZW1lbnQgaXMgdXNlZCkuXG4gICAqXG4gICAqICMjIyBFeGFtcGxlXG4gICAqXG4gICAqIEdlbmVyYWxseSwgd2UgZGVmaW5lIHRoZSBjb21wb25lbnQgdG8gYm9vdHN0cmFwIGluIHRoZSBgYm9vdHN0cmFwYCBhcnJheSBvZiBgTmdNb2R1bGVgLFxuICAgKiBidXQgaXQgcmVxdWlyZXMgdXMgdG8ga25vdyB0aGUgY29tcG9uZW50IHdoaWxlIHdyaXRpbmcgdGhlIGFwcGxpY2F0aW9uIGNvZGUuXG4gICAqXG4gICAqIEltYWdpbmUgYSBzaXR1YXRpb24gd2hlcmUgd2UgaGF2ZSB0byB3YWl0IGZvciBhbiBBUEkgY2FsbCB0byBkZWNpZGUgYWJvdXQgdGhlIGNvbXBvbmVudCB0b1xuICAgKiBib290c3RyYXAuIFdlIGNhbiB1c2UgdGhlIGBuZ0RvQm9vdHN0cmFwYCBob29rIG9mIHRoZSBgTmdNb2R1bGVgIGFuZCBjYWxsIHRoaXMgbWV0aG9kIHRvXG4gICAqIGR5bmFtaWNhbGx5IGJvb3RzdHJhcCBhIGNvbXBvbmVudC5cbiAgICpcbiAgICoge0BleGFtcGxlIGNvcmUvdHMvcGxhdGZvcm0vcGxhdGZvcm0udHMgcmVnaW9uPSdjb21wb25lbnRTZWxlY3Rvcid9XG4gICAqXG4gICAqIE9wdGlvbmFsbHksIGEgY29tcG9uZW50IGNhbiBiZSBtb3VudGVkIG9udG8gYSBET00gZWxlbWVudCB0aGF0IGRvZXMgbm90IG1hdGNoIHRoZVxuICAgKiBzZWxlY3RvciBvZiB0aGUgYm9vdHN0cmFwcGVkIGNvbXBvbmVudC5cbiAgICpcbiAgICogSW4gdGhlIGZvbGxvd2luZyBleGFtcGxlLCB3ZSBhcmUgcHJvdmlkaW5nIGEgQ1NTIHNlbGVjdG9yIHRvIG1hdGNoIHRoZSB0YXJnZXQgZWxlbWVudC5cbiAgICpcbiAgICoge0BleGFtcGxlIGNvcmUvdHMvcGxhdGZvcm0vcGxhdGZvcm0udHMgcmVnaW9uPSdjc3NTZWxlY3Rvcid9XG4gICAqXG4gICAqIFdoaWxlIGluIHRoaXMgZXhhbXBsZSwgd2UgYXJlIHByb3ZpZGluZyByZWZlcmVuY2UgdG8gYSBET00gbm9kZS5cbiAgICpcbiAgICoge0BleGFtcGxlIGNvcmUvdHMvcGxhdGZvcm0vcGxhdGZvcm0udHMgcmVnaW9uPSdkb21Ob2RlJ31cbiAgICovXG4gIGJvb3RzdHJhcDxDPihjb21wb25lbnQ6IFR5cGU8Qz4sIHJvb3RTZWxlY3Rvck9yTm9kZT86IHN0cmluZ3xhbnkpOiBDb21wb25lbnRSZWY8Qz47XG5cbiAgLyoqXG4gICAqIEJvb3RzdHJhcCBhIGNvbXBvbmVudCBvbnRvIHRoZSBlbGVtZW50IGlkZW50aWZpZWQgYnkgaXRzIHNlbGVjdG9yIG9yLCBvcHRpb25hbGx5LCB0byBhXG4gICAqIHNwZWNpZmllZCBlbGVtZW50LlxuICAgKlxuICAgKiBAdXNhZ2VOb3Rlc1xuICAgKiAjIyMgQm9vdHN0cmFwIHByb2Nlc3NcbiAgICpcbiAgICogV2hlbiBib290c3RyYXBwaW5nIGEgY29tcG9uZW50LCBBbmd1bGFyIG1vdW50cyBpdCBvbnRvIGEgdGFyZ2V0IERPTSBlbGVtZW50XG4gICAqIGFuZCBraWNrcyBvZmYgYXV0b21hdGljIGNoYW5nZSBkZXRlY3Rpb24uIFRoZSB0YXJnZXQgRE9NIGVsZW1lbnQgY2FuIGJlXG4gICAqIHByb3ZpZGVkIHVzaW5nIHRoZSBgcm9vdFNlbGVjdG9yT3JOb2RlYCBhcmd1bWVudC5cbiAgICpcbiAgICogSWYgdGhlIHRhcmdldCBET00gZWxlbWVudCBpcyBub3QgcHJvdmlkZWQsIEFuZ3VsYXIgdHJpZXMgdG8gZmluZCBvbmUgb24gYSBwYWdlXG4gICAqIHVzaW5nIHRoZSBgc2VsZWN0b3JgIG9mIHRoZSBjb21wb25lbnQgdGhhdCBpcyBiZWluZyBib290c3RyYXBwZWRcbiAgICogKGZpcnN0IG1hdGNoZWQgZWxlbWVudCBpcyB1c2VkKS5cbiAgICpcbiAgICogIyMjIEV4YW1wbGVcbiAgICpcbiAgICogR2VuZXJhbGx5LCB3ZSBkZWZpbmUgdGhlIGNvbXBvbmVudCB0byBib290c3RyYXAgaW4gdGhlIGBib290c3RyYXBgIGFycmF5IG9mIGBOZ01vZHVsZWAsXG4gICAqIGJ1dCBpdCByZXF1aXJlcyB1cyB0byBrbm93IHRoZSBjb21wb25lbnQgd2hpbGUgd3JpdGluZyB0aGUgYXBwbGljYXRpb24gY29kZS5cbiAgICpcbiAgICogSW1hZ2luZSBhIHNpdHVhdGlvbiB3aGVyZSB3ZSBoYXZlIHRvIHdhaXQgZm9yIGFuIEFQSSBjYWxsIHRvIGRlY2lkZSBhYm91dCB0aGUgY29tcG9uZW50IHRvXG4gICAqIGJvb3RzdHJhcC4gV2UgY2FuIHVzZSB0aGUgYG5nRG9Cb290c3RyYXBgIGhvb2sgb2YgdGhlIGBOZ01vZHVsZWAgYW5kIGNhbGwgdGhpcyBtZXRob2QgdG9cbiAgICogZHluYW1pY2FsbHkgYm9vdHN0cmFwIGEgY29tcG9uZW50LlxuICAgKlxuICAgKiB7QGV4YW1wbGUgY29yZS90cy9wbGF0Zm9ybS9wbGF0Zm9ybS50cyByZWdpb249J2NvbXBvbmVudFNlbGVjdG9yJ31cbiAgICpcbiAgICogT3B0aW9uYWxseSwgYSBjb21wb25lbnQgY2FuIGJlIG1vdW50ZWQgb250byBhIERPTSBlbGVtZW50IHRoYXQgZG9lcyBub3QgbWF0Y2ggdGhlXG4gICAqIHNlbGVjdG9yIG9mIHRoZSBib290c3RyYXBwZWQgY29tcG9uZW50LlxuICAgKlxuICAgKiBJbiB0aGUgZm9sbG93aW5nIGV4YW1wbGUsIHdlIGFyZSBwcm92aWRpbmcgYSBDU1Mgc2VsZWN0b3IgdG8gbWF0Y2ggdGhlIHRhcmdldCBlbGVtZW50LlxuICAgKlxuICAgKiB7QGV4YW1wbGUgY29yZS90cy9wbGF0Zm9ybS9wbGF0Zm9ybS50cyByZWdpb249J2Nzc1NlbGVjdG9yJ31cbiAgICpcbiAgICogV2hpbGUgaW4gdGhpcyBleGFtcGxlLCB3ZSBhcmUgcHJvdmlkaW5nIHJlZmVyZW5jZSB0byBhIERPTSBub2RlLlxuICAgKlxuICAgKiB7QGV4YW1wbGUgY29yZS90cy9wbGF0Zm9ybS9wbGF0Zm9ybS50cyByZWdpb249J2RvbU5vZGUnfVxuICAgKlxuICAgKiBAZGVwcmVjYXRlZCBQYXNzaW5nIENvbXBvbmVudCBmYWN0b3JpZXMgYXMgdGhlIGBBcHBsaWNhdGlvbi5ib290c3RyYXBgIGZ1bmN0aW9uIGFyZ3VtZW50IGlzXG4gICAqICAgICBkZXByZWNhdGVkLiBQYXNzIENvbXBvbmVudCBUeXBlcyBpbnN0ZWFkLlxuICAgKi9cbiAgYm9vdHN0cmFwPEM+KGNvbXBvbmVudEZhY3Rvcnk6IENvbXBvbmVudEZhY3Rvcnk8Qz4sIHJvb3RTZWxlY3Rvck9yTm9kZT86IHN0cmluZ3xhbnkpOlxuICAgICAgQ29tcG9uZW50UmVmPEM+O1xuXG4gIC8qKlxuICAgKiBCb290c3RyYXAgYSBjb21wb25lbnQgb250byB0aGUgZWxlbWVudCBpZGVudGlmaWVkIGJ5IGl0cyBzZWxlY3RvciBvciwgb3B0aW9uYWxseSwgdG8gYVxuICAgKiBzcGVjaWZpZWQgZWxlbWVudC5cbiAgICpcbiAgICogQHVzYWdlTm90ZXNcbiAgICogIyMjIEJvb3RzdHJhcCBwcm9jZXNzXG4gICAqXG4gICAqIFdoZW4gYm9vdHN0cmFwcGluZyBhIGNvbXBvbmVudCwgQW5ndWxhciBtb3VudHMgaXQgb250byBhIHRhcmdldCBET00gZWxlbWVudFxuICAgKiBhbmQga2lja3Mgb2ZmIGF1dG9tYXRpYyBjaGFuZ2UgZGV0ZWN0aW9uLiBUaGUgdGFyZ2V0IERPTSBlbGVtZW50IGNhbiBiZVxuICAgKiBwcm92aWRlZCB1c2luZyB0aGUgYHJvb3RTZWxlY3Rvck9yTm9kZWAgYXJndW1lbnQuXG4gICAqXG4gICAqIElmIHRoZSB0YXJnZXQgRE9NIGVsZW1lbnQgaXMgbm90IHByb3ZpZGVkLCBBbmd1bGFyIHRyaWVzIHRvIGZpbmQgb25lIG9uIGEgcGFnZVxuICAgKiB1c2luZyB0aGUgYHNlbGVjdG9yYCBvZiB0aGUgY29tcG9uZW50IHRoYXQgaXMgYmVpbmcgYm9vdHN0cmFwcGVkXG4gICAqIChmaXJzdCBtYXRjaGVkIGVsZW1lbnQgaXMgdXNlZCkuXG4gICAqXG4gICAqICMjIyBFeGFtcGxlXG4gICAqXG4gICAqIEdlbmVyYWxseSwgd2UgZGVmaW5lIHRoZSBjb21wb25lbnQgdG8gYm9vdHN0cmFwIGluIHRoZSBgYm9vdHN0cmFwYCBhcnJheSBvZiBgTmdNb2R1bGVgLFxuICAgKiBidXQgaXQgcmVxdWlyZXMgdXMgdG8ga25vdyB0aGUgY29tcG9uZW50IHdoaWxlIHdyaXRpbmcgdGhlIGFwcGxpY2F0aW9uIGNvZGUuXG4gICAqXG4gICAqIEltYWdpbmUgYSBzaXR1YXRpb24gd2hlcmUgd2UgaGF2ZSB0byB3YWl0IGZvciBhbiBBUEkgY2FsbCB0byBkZWNpZGUgYWJvdXQgdGhlIGNvbXBvbmVudCB0b1xuICAgKiBib290c3RyYXAuIFdlIGNhbiB1c2UgdGhlIGBuZ0RvQm9vdHN0cmFwYCBob29rIG9mIHRoZSBgTmdNb2R1bGVgIGFuZCBjYWxsIHRoaXMgbWV0aG9kIHRvXG4gICAqIGR5bmFtaWNhbGx5IGJvb3RzdHJhcCBhIGNvbXBvbmVudC5cbiAgICpcbiAgICoge0BleGFtcGxlIGNvcmUvdHMvcGxhdGZvcm0vcGxhdGZvcm0udHMgcmVnaW9uPSdjb21wb25lbnRTZWxlY3Rvcid9XG4gICAqXG4gICAqIE9wdGlvbmFsbHksIGEgY29tcG9uZW50IGNhbiBiZSBtb3VudGVkIG9udG8gYSBET00gZWxlbWVudCB0aGF0IGRvZXMgbm90IG1hdGNoIHRoZVxuICAgKiBzZWxlY3RvciBvZiB0aGUgYm9vdHN0cmFwcGVkIGNvbXBvbmVudC5cbiAgICpcbiAgICogSW4gdGhlIGZvbGxvd2luZyBleGFtcGxlLCB3ZSBhcmUgcHJvdmlkaW5nIGEgQ1NTIHNlbGVjdG9yIHRvIG1hdGNoIHRoZSB0YXJnZXQgZWxlbWVudC5cbiAgICpcbiAgICoge0BleGFtcGxlIGNvcmUvdHMvcGxhdGZvcm0vcGxhdGZvcm0udHMgcmVnaW9uPSdjc3NTZWxlY3Rvcid9XG4gICAqXG4gICAqIFdoaWxlIGluIHRoaXMgZXhhbXBsZSwgd2UgYXJlIHByb3ZpZGluZyByZWZlcmVuY2UgdG8gYSBET00gbm9kZS5cbiAgICpcbiAgICoge0BleGFtcGxlIGNvcmUvdHMvcGxhdGZvcm0vcGxhdGZvcm0udHMgcmVnaW9uPSdkb21Ob2RlJ31cbiAgICovXG4gIGJvb3RzdHJhcDxDPihjb21wb25lbnRPckZhY3Rvcnk6IENvbXBvbmVudEZhY3Rvcnk8Qz58VHlwZTxDPiwgcm9vdFNlbGVjdG9yT3JOb2RlPzogc3RyaW5nfGFueSk6XG4gICAgICBDb21wb25lbnRSZWY8Qz4ge1xuICAgIE5HX0RFVl9NT0RFICYmIHRoaXMud2FybklmRGVzdHJveWVkKCk7XG4gICAgY29uc3QgaXNDb21wb25lbnRGYWN0b3J5ID0gY29tcG9uZW50T3JGYWN0b3J5IGluc3RhbmNlb2YgQ29tcG9uZW50RmFjdG9yeTtcbiAgICBjb25zdCBpbml0U3RhdHVzID0gdGhpcy5faW5qZWN0b3IuZ2V0KEFwcGxpY2F0aW9uSW5pdFN0YXR1cyk7XG5cbiAgICBpZiAoIWluaXRTdGF0dXMuZG9uZSkge1xuICAgICAgY29uc3Qgc3RhbmRhbG9uZSA9ICFpc0NvbXBvbmVudEZhY3RvcnkgJiYgaXNTdGFuZGFsb25lKGNvbXBvbmVudE9yRmFjdG9yeSk7XG4gICAgICBjb25zdCBlcnJvck1lc3NhZ2UgPVxuICAgICAgICAgICdDYW5ub3QgYm9vdHN0cmFwIGFzIHRoZXJlIGFyZSBzdGlsbCBhc3luY2hyb25vdXMgaW5pdGlhbGl6ZXJzIHJ1bm5pbmcuJyArXG4gICAgICAgICAgKHN0YW5kYWxvbmUgPyAnJyA6XG4gICAgICAgICAgICAgICAgICAgICAgICAnIEJvb3RzdHJhcCBjb21wb25lbnRzIGluIHRoZSBgbmdEb0Jvb3RzdHJhcGAgbWV0aG9kIG9mIHRoZSByb290IG1vZHVsZS4nKTtcbiAgICAgIHRocm93IG5ldyBSdW50aW1lRXJyb3IoXG4gICAgICAgICAgUnVudGltZUVycm9yQ29kZS5BU1lOQ19JTklUSUFMSVpFUlNfU1RJTExfUlVOTklORywgTkdfREVWX01PREUgJiYgZXJyb3JNZXNzYWdlKTtcbiAgICB9XG5cbiAgICBsZXQgY29tcG9uZW50RmFjdG9yeTogQ29tcG9uZW50RmFjdG9yeTxDPjtcbiAgICBpZiAoaXNDb21wb25lbnRGYWN0b3J5KSB7XG4gICAgICBjb21wb25lbnRGYWN0b3J5ID0gY29tcG9uZW50T3JGYWN0b3J5O1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCByZXNvbHZlciA9IHRoaXMuX2luamVjdG9yLmdldChDb21wb25lbnRGYWN0b3J5UmVzb2x2ZXIpO1xuICAgICAgY29tcG9uZW50RmFjdG9yeSA9IHJlc29sdmVyLnJlc29sdmVDb21wb25lbnRGYWN0b3J5KGNvbXBvbmVudE9yRmFjdG9yeSkhO1xuICAgIH1cbiAgICB0aGlzLmNvbXBvbmVudFR5cGVzLnB1c2goY29tcG9uZW50RmFjdG9yeS5jb21wb25lbnRUeXBlKTtcblxuICAgIC8vIENyZWF0ZSBhIGZhY3RvcnkgYXNzb2NpYXRlZCB3aXRoIHRoZSBjdXJyZW50IG1vZHVsZSBpZiBpdCdzIG5vdCBib3VuZCB0byBzb21lIG90aGVyXG4gICAgY29uc3QgbmdNb2R1bGUgPVxuICAgICAgICBpc0JvdW5kVG9Nb2R1bGUoY29tcG9uZW50RmFjdG9yeSkgPyB1bmRlZmluZWQgOiB0aGlzLl9pbmplY3Rvci5nZXQoTmdNb2R1bGVSZWYpO1xuICAgIGNvbnN0IHNlbGVjdG9yT3JOb2RlID0gcm9vdFNlbGVjdG9yT3JOb2RlIHx8IGNvbXBvbmVudEZhY3Rvcnkuc2VsZWN0b3I7XG4gICAgY29uc3QgY29tcFJlZiA9IGNvbXBvbmVudEZhY3RvcnkuY3JlYXRlKEluamVjdG9yLk5VTEwsIFtdLCBzZWxlY3Rvck9yTm9kZSwgbmdNb2R1bGUpO1xuICAgIGNvbnN0IG5hdGl2ZUVsZW1lbnQgPSBjb21wUmVmLmxvY2F0aW9uLm5hdGl2ZUVsZW1lbnQ7XG4gICAgY29uc3QgdGVzdGFiaWxpdHkgPSBjb21wUmVmLmluamVjdG9yLmdldChURVNUQUJJTElUWSwgbnVsbCk7XG4gICAgdGVzdGFiaWxpdHk/LnJlZ2lzdGVyQXBwbGljYXRpb24obmF0aXZlRWxlbWVudCk7XG5cbiAgICBjb21wUmVmLm9uRGVzdHJveSgoKSA9PiB7XG4gICAgICB0aGlzLmRldGFjaFZpZXcoY29tcFJlZi5ob3N0Vmlldyk7XG4gICAgICByZW1vdmUodGhpcy5jb21wb25lbnRzLCBjb21wUmVmKTtcbiAgICAgIHRlc3RhYmlsaXR5Py51bnJlZ2lzdGVyQXBwbGljYXRpb24obmF0aXZlRWxlbWVudCk7XG4gICAgfSk7XG5cbiAgICB0aGlzLl9sb2FkQ29tcG9uZW50KGNvbXBSZWYpO1xuICAgIGlmICh0eXBlb2YgbmdEZXZNb2RlID09PSAndW5kZWZpbmVkJyB8fCBuZ0Rldk1vZGUpIHtcbiAgICAgIGNvbnN0IF9jb25zb2xlID0gdGhpcy5faW5qZWN0b3IuZ2V0KENvbnNvbGUpO1xuICAgICAgX2NvbnNvbGUubG9nKFxuICAgICAgICAgIGBBbmd1bGFyIGlzIHJ1bm5pbmcgaW4gZGV2ZWxvcG1lbnQgbW9kZS4gQ2FsbCBlbmFibGVQcm9kTW9kZSgpIHRvIGVuYWJsZSBwcm9kdWN0aW9uIG1vZGUuYCk7XG4gICAgfVxuICAgIHJldHVybiBjb21wUmVmO1xuICB9XG5cbiAgLyoqXG4gICAqIEludm9rZSB0aGlzIG1ldGhvZCB0byBleHBsaWNpdGx5IHByb2Nlc3MgY2hhbmdlIGRldGVjdGlvbiBhbmQgaXRzIHNpZGUtZWZmZWN0cy5cbiAgICpcbiAgICogSW4gZGV2ZWxvcG1lbnQgbW9kZSwgYHRpY2soKWAgYWxzbyBwZXJmb3JtcyBhIHNlY29uZCBjaGFuZ2UgZGV0ZWN0aW9uIGN5Y2xlIHRvIGVuc3VyZSB0aGF0IG5vXG4gICAqIGZ1cnRoZXIgY2hhbmdlcyBhcmUgZGV0ZWN0ZWQuIElmIGFkZGl0aW9uYWwgY2hhbmdlcyBhcmUgcGlja2VkIHVwIGR1cmluZyB0aGlzIHNlY29uZCBjeWNsZSxcbiAgICogYmluZGluZ3MgaW4gdGhlIGFwcCBoYXZlIHNpZGUtZWZmZWN0cyB0aGF0IGNhbm5vdCBiZSByZXNvbHZlZCBpbiBhIHNpbmdsZSBjaGFuZ2UgZGV0ZWN0aW9uXG4gICAqIHBhc3MuXG4gICAqIEluIHRoaXMgY2FzZSwgQW5ndWxhciB0aHJvd3MgYW4gZXJyb3IsIHNpbmNlIGFuIEFuZ3VsYXIgYXBwbGljYXRpb24gY2FuIG9ubHkgaGF2ZSBvbmUgY2hhbmdlXG4gICAqIGRldGVjdGlvbiBwYXNzIGR1cmluZyB3aGljaCBhbGwgY2hhbmdlIGRldGVjdGlvbiBtdXN0IGNvbXBsZXRlLlxuICAgKi9cbiAgdGljaygpOiB2b2lkIHtcbiAgICBOR19ERVZfTU9ERSAmJiB0aGlzLndhcm5JZkRlc3Ryb3llZCgpO1xuICAgIGlmICh0aGlzLl9ydW5uaW5nVGljaykge1xuICAgICAgdGhyb3cgbmV3IFJ1bnRpbWVFcnJvcihcbiAgICAgICAgICBSdW50aW1lRXJyb3JDb2RlLlJFQ1VSU0lWRV9BUFBMSUNBVElPTl9SRUZfVElDSyxcbiAgICAgICAgICBuZ0Rldk1vZGUgJiYgJ0FwcGxpY2F0aW9uUmVmLnRpY2sgaXMgY2FsbGVkIHJlY3Vyc2l2ZWx5Jyk7XG4gICAgfVxuXG4gICAgdHJ5IHtcbiAgICAgIHRoaXMuX3J1bm5pbmdUaWNrID0gdHJ1ZTtcbiAgICAgIGZvciAobGV0IHZpZXcgb2YgdGhpcy5fdmlld3MpIHtcbiAgICAgICAgdmlldy5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICB9XG4gICAgICBpZiAodHlwZW9mIG5nRGV2TW9kZSA9PT0gJ3VuZGVmaW5lZCcgfHwgbmdEZXZNb2RlKSB7XG4gICAgICAgIGZvciAobGV0IHZpZXcgb2YgdGhpcy5fdmlld3MpIHtcbiAgICAgICAgICB2aWV3LmNoZWNrTm9DaGFuZ2VzKCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAvLyBBdHRlbnRpb246IERvbid0IHJldGhyb3cgYXMgaXQgY291bGQgY2FuY2VsIHN1YnNjcmlwdGlvbnMgdG8gT2JzZXJ2YWJsZXMhXG4gICAgICB0aGlzLl96b25lLnJ1bk91dHNpZGVBbmd1bGFyKCgpID0+IHRoaXMuX2V4Y2VwdGlvbkhhbmRsZXIuaGFuZGxlRXJyb3IoZSkpO1xuICAgIH0gZmluYWxseSB7XG4gICAgICB0aGlzLl9ydW5uaW5nVGljayA9IGZhbHNlO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBBdHRhY2hlcyBhIHZpZXcgc28gdGhhdCBpdCB3aWxsIGJlIGRpcnR5IGNoZWNrZWQuXG4gICAqIFRoZSB2aWV3IHdpbGwgYmUgYXV0b21hdGljYWxseSBkZXRhY2hlZCB3aGVuIGl0IGlzIGRlc3Ryb3llZC5cbiAgICogVGhpcyB3aWxsIHRocm93IGlmIHRoZSB2aWV3IGlzIGFscmVhZHkgYXR0YWNoZWQgdG8gYSBWaWV3Q29udGFpbmVyLlxuICAgKi9cbiAgYXR0YWNoVmlldyh2aWV3UmVmOiBWaWV3UmVmKTogdm9pZCB7XG4gICAgTkdfREVWX01PREUgJiYgdGhpcy53YXJuSWZEZXN0cm95ZWQoKTtcbiAgICBjb25zdCB2aWV3ID0gKHZpZXdSZWYgYXMgSW50ZXJuYWxWaWV3UmVmKTtcbiAgICB0aGlzLl92aWV3cy5wdXNoKHZpZXcpO1xuICAgIHZpZXcuYXR0YWNoVG9BcHBSZWYodGhpcyk7XG4gIH1cblxuICAvKipcbiAgICogRGV0YWNoZXMgYSB2aWV3IGZyb20gZGlydHkgY2hlY2tpbmcgYWdhaW4uXG4gICAqL1xuICBkZXRhY2hWaWV3KHZpZXdSZWY6IFZpZXdSZWYpOiB2b2lkIHtcbiAgICBOR19ERVZfTU9ERSAmJiB0aGlzLndhcm5JZkRlc3Ryb3llZCgpO1xuICAgIGNvbnN0IHZpZXcgPSAodmlld1JlZiBhcyBJbnRlcm5hbFZpZXdSZWYpO1xuICAgIHJlbW92ZSh0aGlzLl92aWV3cywgdmlldyk7XG4gICAgdmlldy5kZXRhY2hGcm9tQXBwUmVmKCk7XG4gIH1cblxuICBwcml2YXRlIF9sb2FkQ29tcG9uZW50KGNvbXBvbmVudFJlZjogQ29tcG9uZW50UmVmPGFueT4pOiB2b2lkIHtcbiAgICB0aGlzLmF0dGFjaFZpZXcoY29tcG9uZW50UmVmLmhvc3RWaWV3KTtcbiAgICB0aGlzLnRpY2soKTtcbiAgICB0aGlzLmNvbXBvbmVudHMucHVzaChjb21wb25lbnRSZWYpO1xuICAgIC8vIEdldCB0aGUgbGlzdGVuZXJzIGxhemlseSB0byBwcmV2ZW50IERJIGN5Y2xlcy5cbiAgICBjb25zdCBsaXN0ZW5lcnMgPVxuICAgICAgICB0aGlzLl9pbmplY3Rvci5nZXQoQVBQX0JPT1RTVFJBUF9MSVNURU5FUiwgW10pLmNvbmNhdCh0aGlzLl9ib290c3RyYXBMaXN0ZW5lcnMpO1xuICAgIGxpc3RlbmVycy5mb3JFYWNoKChsaXN0ZW5lcikgPT4gbGlzdGVuZXIoY29tcG9uZW50UmVmKSk7XG4gIH1cblxuICAvKiogQGludGVybmFsICovXG4gIG5nT25EZXN0cm95KCkge1xuICAgIGlmICh0aGlzLl9kZXN0cm95ZWQpIHJldHVybjtcblxuICAgIHRyeSB7XG4gICAgICAvLyBDYWxsIGFsbCB0aGUgbGlmZWN5Y2xlIGhvb2tzLlxuICAgICAgdGhpcy5fZGVzdHJveUxpc3RlbmVycy5mb3JFYWNoKGxpc3RlbmVyID0+IGxpc3RlbmVyKCkpO1xuXG4gICAgICAvLyBEZXN0cm95IGFsbCByZWdpc3RlcmVkIHZpZXdzLlxuICAgICAgdGhpcy5fdmlld3Muc2xpY2UoKS5mb3JFYWNoKCh2aWV3KSA9PiB2aWV3LmRlc3Ryb3koKSk7XG4gICAgICB0aGlzLl9vbk1pY3JvdGFza0VtcHR5U3Vic2NyaXB0aW9uLnVuc3Vic2NyaWJlKCk7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIC8vIEluZGljYXRlIHRoYXQgdGhpcyBpbnN0YW5jZSBpcyBkZXN0cm95ZWQuXG4gICAgICB0aGlzLl9kZXN0cm95ZWQgPSB0cnVlO1xuXG4gICAgICAvLyBSZWxlYXNlIGFsbCByZWZlcmVuY2VzLlxuICAgICAgdGhpcy5fdmlld3MgPSBbXTtcbiAgICAgIHRoaXMuX2Jvb3RzdHJhcExpc3RlbmVycyA9IFtdO1xuICAgICAgdGhpcy5fZGVzdHJveUxpc3RlbmVycyA9IFtdO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBSZWdpc3RlcnMgYSBsaXN0ZW5lciB0byBiZSBjYWxsZWQgd2hlbiBhbiBpbnN0YW5jZSBpcyBkZXN0cm95ZWQuXG4gICAqXG4gICAqIEBwYXJhbSBjYWxsYmFjayBBIGNhbGxiYWNrIGZ1bmN0aW9uIHRvIGFkZCBhcyBhIGxpc3RlbmVyLlxuICAgKiBAcmV0dXJucyBBIGZ1bmN0aW9uIHdoaWNoIHVucmVnaXN0ZXJzIGEgbGlzdGVuZXIuXG4gICAqXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgb25EZXN0cm95KGNhbGxiYWNrOiAoKSA9PiB2b2lkKTogVm9pZEZ1bmN0aW9uIHtcbiAgICBOR19ERVZfTU9ERSAmJiB0aGlzLndhcm5JZkRlc3Ryb3llZCgpO1xuICAgIHRoaXMuX2Rlc3Ryb3lMaXN0ZW5lcnMucHVzaChjYWxsYmFjayk7XG4gICAgcmV0dXJuICgpID0+IHJlbW92ZSh0aGlzLl9kZXN0cm95TGlzdGVuZXJzLCBjYWxsYmFjayk7XG4gIH1cblxuICAvKipcbiAgICogRGVzdHJveXMgYW4gQW5ndWxhciBhcHBsaWNhdGlvbiByZXByZXNlbnRlZCBieSB0aGlzIGBBcHBsaWNhdGlvblJlZmAuIENhbGxpbmcgdGhpcyBmdW5jdGlvblxuICAgKiB3aWxsIGRlc3Ryb3kgdGhlIGFzc29jaWF0ZWQgZW52aXJvbm1lbnQgaW5qZWN0b3JzIGFzIHdlbGwgYXMgYWxsIHRoZSBib290c3RyYXBwZWQgY29tcG9uZW50c1xuICAgKiB3aXRoIHRoZWlyIHZpZXdzLlxuICAgKi9cbiAgZGVzdHJveSgpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5fZGVzdHJveWVkKSB7XG4gICAgICB0aHJvdyBuZXcgUnVudGltZUVycm9yKFxuICAgICAgICAgIFJ1bnRpbWVFcnJvckNvZGUuQVBQTElDQVRJT05fUkVGX0FMUkVBRFlfREVTVFJPWUVELFxuICAgICAgICAgIG5nRGV2TW9kZSAmJiAnVGhpcyBpbnN0YW5jZSBvZiB0aGUgYEFwcGxpY2F0aW9uUmVmYCBoYXMgYWxyZWFkeSBiZWVuIGRlc3Ryb3llZC4nKTtcbiAgICB9XG5cbiAgICAvLyBUaGlzIGlzIGEgdGVtcG9yYXJ5IHR5cGUgdG8gcmVwcmVzZW50IGFuIGluc3RhbmNlIG9mIGFuIFIzSW5qZWN0b3IsIHdoaWNoIGNhbiBiZSBkZXN0cm95ZWQuXG4gICAgLy8gVGhlIHR5cGUgd2lsbCBiZSByZXBsYWNlZCB3aXRoIGEgZGlmZmVyZW50IG9uZSBvbmNlIGRlc3Ryb3lhYmxlIGluamVjdG9yIHR5cGUgaXMgYXZhaWxhYmxlLlxuICAgIHR5cGUgRGVzdHJveWFibGVJbmplY3RvciA9IEluamVjdG9yJntkZXN0cm95PzogRnVuY3Rpb24sIGRlc3Ryb3llZD86IGJvb2xlYW59O1xuXG4gICAgY29uc3QgaW5qZWN0b3IgPSB0aGlzLl9pbmplY3RvciBhcyBEZXN0cm95YWJsZUluamVjdG9yO1xuXG4gICAgLy8gQ2hlY2sgdGhhdCB0aGlzIGluamVjdG9yIGluc3RhbmNlIHN1cHBvcnRzIGRlc3Ryb3kgb3BlcmF0aW9uLlxuICAgIGlmIChpbmplY3Rvci5kZXN0cm95ICYmICFpbmplY3Rvci5kZXN0cm95ZWQpIHtcbiAgICAgIC8vIERlc3Ryb3lpbmcgYW4gdW5kZXJseWluZyBpbmplY3RvciB3aWxsIHRyaWdnZXIgdGhlIGBuZ09uRGVzdHJveWAgbGlmZWN5Y2xlXG4gICAgICAvLyBob29rLCB3aGljaCBpbnZva2VzIHRoZSByZW1haW5pbmcgY2xlYW51cCBhY3Rpb25zLlxuICAgICAgaW5qZWN0b3IuZGVzdHJveSgpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBudW1iZXIgb2YgYXR0YWNoZWQgdmlld3MuXG4gICAqL1xuICBnZXQgdmlld0NvdW50KCkge1xuICAgIHJldHVybiB0aGlzLl92aWV3cy5sZW5ndGg7XG4gIH1cblxuICBwcml2YXRlIHdhcm5JZkRlc3Ryb3llZCgpIHtcbiAgICBpZiAoTkdfREVWX01PREUgJiYgdGhpcy5fZGVzdHJveWVkKSB7XG4gICAgICBjb25zb2xlLndhcm4oZm9ybWF0UnVudGltZUVycm9yKFxuICAgICAgICAgIFJ1bnRpbWVFcnJvckNvZGUuQVBQTElDQVRJT05fUkVGX0FMUkVBRFlfREVTVFJPWUVELFxuICAgICAgICAgICdUaGlzIGluc3RhbmNlIG9mIHRoZSBgQXBwbGljYXRpb25SZWZgIGhhcyBhbHJlYWR5IGJlZW4gZGVzdHJveWVkLicpKTtcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gcmVtb3ZlPFQ+KGxpc3Q6IFRbXSwgZWw6IFQpOiB2b2lkIHtcbiAgY29uc3QgaW5kZXggPSBsaXN0LmluZGV4T2YoZWwpO1xuICBpZiAoaW5kZXggPiAtMSkge1xuICAgIGxpc3Quc3BsaWNlKGluZGV4LCAxKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBfbGFzdERlZmluZWQ8VD4oYXJnczogVFtdKTogVHx1bmRlZmluZWQge1xuICBmb3IgKGxldCBpID0gYXJncy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgIGlmIChhcmdzW2ldICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiBhcmdzW2ldO1xuICAgIH1cbiAgfVxuICByZXR1cm4gdW5kZWZpbmVkO1xufVxuXG5mdW5jdGlvbiBfbWVyZ2VBcnJheXMocGFydHM6IGFueVtdW10pOiBhbnlbXSB7XG4gIGNvbnN0IHJlc3VsdDogYW55W10gPSBbXTtcbiAgcGFydHMuZm9yRWFjaCgocGFydCkgPT4gcGFydCAmJiByZXN1bHQucHVzaCguLi5wYXJ0KSk7XG4gIHJldHVybiByZXN1bHQ7XG59XG4iXX0=