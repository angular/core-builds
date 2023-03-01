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
import { PLATFORM_INITIALIZER } from './application_tokens';
import { getCompilerFacade } from './compiler/compiler_facade';
import { Console } from './console';
import { Injectable } from './di/injectable';
import { InjectionToken } from './di/injection_token';
import { Injector } from './di/injector';
import { EnvironmentInjector } from './di/r3_injector';
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
import { isStandalone } from './render3/definition';
import { assertStandaloneComponentType } from './render3/errors';
import { setLocaleId } from './render3/i18n/i18n_locale_id';
import { setJitOptions } from './render3/jit/jit_options';
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
import * as i3 from "./di/r3_injector";
import * as i4 from "./error_handler";
const NG_DEV_MODE = typeof ngDevMode === 'undefined' || ngDevMode;
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
    const { rootComponent, appProviders, platformProviders } = config;
    if (NG_DEV_MODE && rootComponent !== undefined) {
        assertStandaloneComponentType(rootComponent);
    }
    const platformInjector = createOrReusePlatformInjector(platformProviders);
    const ngZone = getNgZone('zone.js', getNgZoneOptions());
    return ngZone.run(() => {
        // Create root application injector based on a set of providers configured at the platform
        // bootstrap level as well as providers passed to the bootstrap call by a user.
        const allAppProviders = [
            { provide: NgZone, useValue: ngZone },
            ...(appProviders || []), //
        ];
        const envInjector = createEnvironmentInjector(allAppProviders, platformInjector, 'Environment Injector');
        const exceptionHandler = envInjector.get(ErrorHandler, null);
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
ApplicationRef.ɵfac = function ApplicationRef_Factory(t) { return new (t || ApplicationRef)(i0.ɵɵinject(i2.NgZone), i0.ɵɵinject(i3.EnvironmentInjector), i0.ɵɵinject(i4.ErrorHandler)); };
ApplicationRef.ɵprov = /*@__PURE__*/ i0.ɵɵdefineInjectable({ token: ApplicationRef, factory: ApplicationRef.ɵfac, providedIn: 'root' });
(function () { (typeof ngDevMode === "undefined" || ngDevMode) && i0.setClassMetadata(ApplicationRef, [{
        type: Injectable,
        args: [{ providedIn: 'root' }]
    }], function () { return [{ type: i2.NgZone }, { type: i3.EnvironmentInjector }, { type: i4.ErrorHandler }]; }, null); })();
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwbGljYXRpb25fcmVmLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvYXBwbGljYXRpb25fcmVmLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sb0JBQW9CLENBQUM7QUFFNUIsT0FBTyxFQUFDLEtBQUssRUFBRSxVQUFVLEVBQXlCLE1BQU0sTUFBTSxDQUFDO0FBQy9ELE9BQU8sRUFBQyxLQUFLLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUVyQyxPQUFPLEVBQUMscUJBQXFCLEVBQUMsTUFBTSxvQkFBb0IsQ0FBQztBQUN6RCxPQUFPLEVBQUMsb0JBQW9CLEVBQUMsTUFBTSxzQkFBc0IsQ0FBQztBQUMxRCxPQUFPLEVBQUMsaUJBQWlCLEVBQW1CLE1BQU0sNEJBQTRCLENBQUM7QUFDL0UsT0FBTyxFQUFDLE9BQU8sRUFBQyxNQUFNLFdBQVcsQ0FBQztBQUNsQyxPQUFPLEVBQUMsVUFBVSxFQUFDLE1BQU0saUJBQWlCLENBQUM7QUFDM0MsT0FBTyxFQUFDLGNBQWMsRUFBQyxNQUFNLHNCQUFzQixDQUFDO0FBQ3BELE9BQU8sRUFBQyxRQUFRLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFFdkMsT0FBTyxFQUFDLG1CQUFtQixFQUFDLE1BQU0sa0JBQWtCLENBQUM7QUFDckQsT0FBTyxFQUFDLGNBQWMsRUFBQyxNQUFNLFlBQVksQ0FBQztBQUMxQyxPQUFPLEVBQUMsWUFBWSxFQUFDLE1BQU0saUJBQWlCLENBQUM7QUFDN0MsT0FBTyxFQUFDLGtCQUFrQixFQUFFLFlBQVksRUFBbUIsTUFBTSxVQUFVLENBQUM7QUFDNUUsT0FBTyxFQUFDLGlCQUFpQixFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFDdEQsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUV4QyxPQUFPLEVBQUMsZ0JBQWdCLEVBQWtCLE1BQU0sbUJBQW1CLENBQUM7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RSxDQUFDLENBQUMsQ0FBQztLQUN2QjtBQUNILENBQUM7QUFFRCxTQUFTLFlBQVksQ0FBSSxJQUFTO0lBQ2hDLEtBQUssSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRTtRQUN6QyxJQUFJLElBQUksQ0FBQyxDQUFDLENBQUMsS0FBSyxTQUFTLEVBQUU7WUFDekIsT0FBTyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7U0FDaEI7S0FDRjtJQUNELE9BQU8sU0FBUyxDQUFDO0FBQ25CLENBQUM7QUFFRCxTQUFTLFlBQVksQ0FBQyxLQUFjO0lBQ2xDLE1BQU0sTUFBTSxHQUFVLEVBQUUsQ0FBQztJQUN6QixLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQyxJQUFJLElBQUksTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUM7SUFDdEQsT0FBTyxNQUFNLENBQUM7QUFDaEIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgJy4vdXRpbC9uZ19qaXRfbW9kZSc7XG5cbmltcG9ydCB7bWVyZ2UsIE9ic2VydmFibGUsIE9ic2VydmVyLCBTdWJzY3JpcHRpb259IGZyb20gJ3J4anMnO1xuaW1wb3J0IHtzaGFyZX0gZnJvbSAncnhqcy9vcGVyYXRvcnMnO1xuXG5pbXBvcnQge0FwcGxpY2F0aW9uSW5pdFN0YXR1c30gZnJvbSAnLi9hcHBsaWNhdGlvbl9pbml0JztcbmltcG9ydCB7UExBVEZPUk1fSU5JVElBTElaRVJ9IGZyb20gJy4vYXBwbGljYXRpb25fdG9rZW5zJztcbmltcG9ydCB7Z2V0Q29tcGlsZXJGYWNhZGUsIEppdENvbXBpbGVyVXNhZ2V9IGZyb20gJy4vY29tcGlsZXIvY29tcGlsZXJfZmFjYWRlJztcbmltcG9ydCB7Q29uc29sZX0gZnJvbSAnLi9jb25zb2xlJztcbmltcG9ydCB7SW5qZWN0YWJsZX0gZnJvbSAnLi9kaS9pbmplY3RhYmxlJztcbmltcG9ydCB7SW5qZWN0aW9uVG9rZW59IGZyb20gJy4vZGkvaW5qZWN0aW9uX3Rva2VuJztcbmltcG9ydCB7SW5qZWN0b3J9IGZyb20gJy4vZGkvaW5qZWN0b3InO1xuaW1wb3J0IHtFbnZpcm9ubWVudFByb3ZpZGVycywgUHJvdmlkZXIsIFN0YXRpY1Byb3ZpZGVyfSBmcm9tICcuL2RpL2ludGVyZmFjZS9wcm92aWRlcic7XG5pbXBvcnQge0Vudmlyb25tZW50SW5qZWN0b3J9IGZyb20gJy4vZGkvcjNfaW5qZWN0b3InO1xuaW1wb3J0IHtJTkpFQ1RPUl9TQ09QRX0gZnJvbSAnLi9kaS9zY29wZSc7XG5pbXBvcnQge0Vycm9ySGFuZGxlcn0gZnJvbSAnLi9lcnJvcl9oYW5kbGVyJztcbmltcG9ydCB7Zm9ybWF0UnVudGltZUVycm9yLCBSdW50aW1lRXJyb3IsIFJ1bnRpbWVFcnJvckNvZGV9IGZyb20gJy4vZXJyb3JzJztcbmltcG9ydCB7REVGQVVMVF9MT0NBTEVfSUR9IGZyb20gJy4vaTE4bi9sb2NhbGl6YXRpb24nO1xuaW1wb3J0IHtMT0NBTEVfSUR9IGZyb20gJy4vaTE4bi90b2tlbnMnO1xuaW1wb3J0IHtUeXBlfSBmcm9tICcuL2ludGVyZmFjZS90eXBlJztcbmltcG9ydCB7Q09NUElMRVJfT1BUSU9OUywgQ29tcGlsZXJPcHRpb25zfSBmcm9tICcuL2xpbmtlci9jb21waWxlcic7XG5pbXBvcnQge0NvbXBvbmVudEZhY3RvcnksIENvbXBvbmVudFJlZn0gZnJvbSAnLi9saW5rZXIvY29tcG9uZW50X2ZhY3RvcnknO1xuaW1wb3J0IHtDb21wb25lbnRGYWN0b3J5UmVzb2x2ZXJ9IGZyb20gJy4vbGlua2VyL2NvbXBvbmVudF9mYWN0b3J5X3Jlc29sdmVyJztcbmltcG9ydCB7SW50ZXJuYWxOZ01vZHVsZVJlZiwgTmdNb2R1bGVGYWN0b3J5LCBOZ01vZHVsZVJlZn0gZnJvbSAnLi9saW5rZXIvbmdfbW9kdWxlX2ZhY3RvcnknO1xuaW1wb3J0IHtJbnRlcm5hbFZpZXdSZWYsIFZpZXdSZWZ9IGZyb20gJy4vbGlua2VyL3ZpZXdfcmVmJztcbmltcG9ydCB7aXNDb21wb25lbnRSZXNvdXJjZVJlc29sdXRpb25RdWV1ZUVtcHR5LCByZXNvbHZlQ29tcG9uZW50UmVzb3VyY2VzfSBmcm9tICcuL21ldGFkYXRhL3Jlc291cmNlX2xvYWRpbmcnO1xuaW1wb3J0IHthc3NlcnROZ01vZHVsZVR5cGV9IGZyb20gJy4vcmVuZGVyMy9hc3NlcnQnO1xuaW1wb3J0IHtDb21wb25lbnRGYWN0b3J5IGFzIFIzQ29tcG9uZW50RmFjdG9yeX0gZnJvbSAnLi9yZW5kZXIzL2NvbXBvbmVudF9yZWYnO1xuaW1wb3J0IHtpc1N0YW5kYWxvbmV9IGZyb20gJy4vcmVuZGVyMy9kZWZpbml0aW9uJztcbmltcG9ydCB7YXNzZXJ0U3RhbmRhbG9uZUNvbXBvbmVudFR5cGV9IGZyb20gJy4vcmVuZGVyMy9lcnJvcnMnO1xuaW1wb3J0IHtzZXRMb2NhbGVJZH0gZnJvbSAnLi9yZW5kZXIzL2kxOG4vaTE4bl9sb2NhbGVfaWQnO1xuaW1wb3J0IHtzZXRKaXRPcHRpb25zfSBmcm9tICcuL3JlbmRlcjMvaml0L2ppdF9vcHRpb25zJztcbmltcG9ydCB7Y3JlYXRlRW52aXJvbm1lbnRJbmplY3RvciwgTmdNb2R1bGVGYWN0b3J5IGFzIFIzTmdNb2R1bGVGYWN0b3J5fSBmcm9tICcuL3JlbmRlcjMvbmdfbW9kdWxlX3JlZic7XG5pbXBvcnQge3B1Ymxpc2hEZWZhdWx0R2xvYmFsVXRpbHMgYXMgX3B1Ymxpc2hEZWZhdWx0R2xvYmFsVXRpbHN9IGZyb20gJy4vcmVuZGVyMy91dGlsL2dsb2JhbF91dGlscyc7XG5pbXBvcnQge1RFU1RBQklMSVRZfSBmcm9tICcuL3Rlc3RhYmlsaXR5L3Rlc3RhYmlsaXR5JztcbmltcG9ydCB7aXNQcm9taXNlfSBmcm9tICcuL3V0aWwvbGFuZyc7XG5pbXBvcnQge3NjaGVkdWxlTWljcm9UYXNrfSBmcm9tICcuL3V0aWwvbWljcm90YXNrJztcbmltcG9ydCB7c3RyaW5naWZ5fSBmcm9tICcuL3V0aWwvc3RyaW5naWZ5JztcbmltcG9ydCB7Tmdab25lLCBOb29wTmdab25lfSBmcm9tICcuL3pvbmUvbmdfem9uZSc7XG5cbmNvbnN0IE5HX0RFVl9NT0RFID0gdHlwZW9mIG5nRGV2TW9kZSA9PT0gJ3VuZGVmaW5lZCcgfHwgbmdEZXZNb2RlO1xuXG5sZXQgX3BsYXRmb3JtSW5qZWN0b3I6IEluamVjdG9yfG51bGwgPSBudWxsO1xuXG4vKipcbiAqIEludGVybmFsIHRva2VuIHRvIGluZGljYXRlIHdoZXRoZXIgaGF2aW5nIG11bHRpcGxlIGJvb3RzdHJhcHBlZCBwbGF0Zm9ybSBzaG91bGQgYmUgYWxsb3dlZCAob25seVxuICogb25lIGJvb3RzdHJhcHBlZCBwbGF0Zm9ybSBpcyBhbGxvd2VkIGJ5IGRlZmF1bHQpLiBUaGlzIHRva2VuIGhlbHBzIHRvIHN1cHBvcnQgU1NSIHNjZW5hcmlvcy5cbiAqL1xuZXhwb3J0IGNvbnN0IEFMTE9XX01VTFRJUExFX1BMQVRGT1JNUyA9IG5ldyBJbmplY3Rpb25Ub2tlbjxib29sZWFuPignQWxsb3dNdWx0aXBsZVRva2VuJyk7XG5cbi8qKlxuICogSW50ZXJuYWwgdG9rZW4gdGhhdCBhbGxvd3MgdG8gcmVnaXN0ZXIgZXh0cmEgY2FsbGJhY2tzIHRoYXQgc2hvdWxkIGJlIGludm9rZWQgZHVyaW5nIHRoZVxuICogYFBsYXRmb3JtUmVmLmRlc3Ryb3lgIG9wZXJhdGlvbi4gVGhpcyB0b2tlbiBpcyBuZWVkZWQgdG8gYXZvaWQgYSBkaXJlY3QgcmVmZXJlbmNlIHRvIHRoZVxuICogYFBsYXRmb3JtUmVmYCBjbGFzcyAoaS5lLiByZWdpc3RlciB0aGUgY2FsbGJhY2sgdmlhIGBQbGF0Zm9ybVJlZi5vbkRlc3Ryb3lgKSwgdGh1cyBtYWtpbmcgdGhlXG4gKiBlbnRpcmUgY2xhc3MgdHJlZS1zaGFrZWFibGUuXG4gKi9cbmNvbnN0IFBMQVRGT1JNX0RFU1RST1lfTElTVEVORVJTID1cbiAgICBuZXcgSW5qZWN0aW9uVG9rZW48U2V0PFZvaWRGdW5jdGlvbj4+KCdQbGF0Zm9ybURlc3Ryb3lMaXN0ZW5lcnMnKTtcblxuLyoqXG4gKiBBIFtESSB0b2tlbl0oZ3VpZGUvZ2xvc3NhcnkjZGktdG9rZW4gXCJESSB0b2tlbiBkZWZpbml0aW9uXCIpIHRoYXQgcHJvdmlkZXMgYSBzZXQgb2YgY2FsbGJhY2tzIHRvXG4gKiBiZSBjYWxsZWQgZm9yIGV2ZXJ5IGNvbXBvbmVudCB0aGF0IGlzIGJvb3RzdHJhcHBlZC5cbiAqXG4gKiBFYWNoIGNhbGxiYWNrIG11c3QgdGFrZSBhIGBDb21wb25lbnRSZWZgIGluc3RhbmNlIGFuZCByZXR1cm4gbm90aGluZy5cbiAqXG4gKiBgKGNvbXBvbmVudFJlZjogQ29tcG9uZW50UmVmKSA9PiB2b2lkYFxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGNvbnN0IEFQUF9CT09UU1RSQVBfTElTVEVORVIgPVxuICAgIG5ldyBJbmplY3Rpb25Ub2tlbjxBcnJheTwoY29tcFJlZjogQ29tcG9uZW50UmVmPGFueT4pID0+IHZvaWQ+PignYXBwQm9vdHN0cmFwTGlzdGVuZXInKTtcblxuZXhwb3J0IGZ1bmN0aW9uIGNvbXBpbGVOZ01vZHVsZUZhY3Rvcnk8TT4oXG4gICAgaW5qZWN0b3I6IEluamVjdG9yLCBvcHRpb25zOiBDb21waWxlck9wdGlvbnMsXG4gICAgbW9kdWxlVHlwZTogVHlwZTxNPik6IFByb21pc2U8TmdNb2R1bGVGYWN0b3J5PE0+PiB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnROZ01vZHVsZVR5cGUobW9kdWxlVHlwZSk7XG5cbiAgY29uc3QgbW9kdWxlRmFjdG9yeSA9IG5ldyBSM05nTW9kdWxlRmFjdG9yeShtb2R1bGVUeXBlKTtcblxuICAvLyBBbGwgb2YgdGhlIGxvZ2ljIGJlbG93IGlzIGlycmVsZXZhbnQgZm9yIEFPVC1jb21waWxlZCBjb2RlLlxuICBpZiAodHlwZW9mIG5nSml0TW9kZSAhPT0gJ3VuZGVmaW5lZCcgJiYgIW5nSml0TW9kZSkge1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUobW9kdWxlRmFjdG9yeSk7XG4gIH1cblxuICBjb25zdCBjb21waWxlck9wdGlvbnMgPSBpbmplY3Rvci5nZXQoQ09NUElMRVJfT1BUSU9OUywgW10pLmNvbmNhdChvcHRpb25zKTtcblxuICAvLyBDb25maWd1cmUgdGhlIGNvbXBpbGVyIHRvIHVzZSB0aGUgcHJvdmlkZWQgb3B0aW9ucy4gVGhpcyBjYWxsIG1heSBmYWlsIHdoZW4gbXVsdGlwbGUgbW9kdWxlc1xuICAvLyBhcmUgYm9vdHN0cmFwcGVkIHdpdGggaW5jb21wYXRpYmxlIG9wdGlvbnMsIGFzIGEgY29tcG9uZW50IGNhbiBvbmx5IGJlIGNvbXBpbGVkIGFjY29yZGluZyB0b1xuICAvLyBhIHNpbmdsZSBzZXQgb2Ygb3B0aW9ucy5cbiAgc2V0Sml0T3B0aW9ucyh7XG4gICAgZGVmYXVsdEVuY2Fwc3VsYXRpb246IF9sYXN0RGVmaW5lZChjb21waWxlck9wdGlvbnMubWFwKG9wdHMgPT4gb3B0cy5kZWZhdWx0RW5jYXBzdWxhdGlvbikpLFxuICAgIHByZXNlcnZlV2hpdGVzcGFjZXM6IF9sYXN0RGVmaW5lZChjb21waWxlck9wdGlvbnMubWFwKG9wdHMgPT4gb3B0cy5wcmVzZXJ2ZVdoaXRlc3BhY2VzKSksXG4gIH0pO1xuXG4gIGlmIChpc0NvbXBvbmVudFJlc291cmNlUmVzb2x1dGlvblF1ZXVlRW1wdHkoKSkge1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUobW9kdWxlRmFjdG9yeSk7XG4gIH1cblxuICBjb25zdCBjb21waWxlclByb3ZpZGVycyA9IF9tZXJnZUFycmF5cyhjb21waWxlck9wdGlvbnMubWFwKG8gPT4gby5wcm92aWRlcnMhKSk7XG5cbiAgLy8gSW4gY2FzZSB0aGVyZSBhcmUgbm8gY29tcGlsZXIgcHJvdmlkZXJzLCB3ZSBqdXN0IHJldHVybiB0aGUgbW9kdWxlIGZhY3RvcnkgYXNcbiAgLy8gdGhlcmUgd29uJ3QgYmUgYW55IHJlc291cmNlIGxvYWRlci4gVGhpcyBjYW4gaGFwcGVuIHdpdGggSXZ5LCBiZWNhdXNlIEFPVCBjb21waWxlZFxuICAvLyBtb2R1bGVzIGNhbiBiZSBzdGlsbCBwYXNzZWQgdGhyb3VnaCBcImJvb3RzdHJhcE1vZHVsZVwiLiBJbiB0aGF0IGNhc2Ugd2Ugc2hvdWxkbid0XG4gIC8vIHVubmVjZXNzYXJpbHkgcmVxdWlyZSB0aGUgSklUIGNvbXBpbGVyLlxuICBpZiAoY29tcGlsZXJQcm92aWRlcnMubGVuZ3RoID09PSAwKSB7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShtb2R1bGVGYWN0b3J5KTtcbiAgfVxuXG4gIGNvbnN0IGNvbXBpbGVyID0gZ2V0Q29tcGlsZXJGYWNhZGUoe1xuICAgIHVzYWdlOiBKaXRDb21waWxlclVzYWdlLkRlY29yYXRvcixcbiAgICBraW5kOiAnTmdNb2R1bGUnLFxuICAgIHR5cGU6IG1vZHVsZVR5cGUsXG4gIH0pO1xuICBjb25zdCBjb21waWxlckluamVjdG9yID0gSW5qZWN0b3IuY3JlYXRlKHtwcm92aWRlcnM6IGNvbXBpbGVyUHJvdmlkZXJzfSk7XG4gIGNvbnN0IHJlc291cmNlTG9hZGVyID0gY29tcGlsZXJJbmplY3Rvci5nZXQoY29tcGlsZXIuUmVzb3VyY2VMb2FkZXIpO1xuICAvLyBUaGUgcmVzb3VyY2UgbG9hZGVyIGNhbiBhbHNvIHJldHVybiBhIHN0cmluZyB3aGlsZSB0aGUgXCJyZXNvbHZlQ29tcG9uZW50UmVzb3VyY2VzXCJcbiAgLy8gYWx3YXlzIGV4cGVjdHMgYSBwcm9taXNlLiBUaGVyZWZvcmUgd2UgbmVlZCB0byB3cmFwIHRoZSByZXR1cm5lZCB2YWx1ZSBpbiBhIHByb21pc2UuXG4gIHJldHVybiByZXNvbHZlQ29tcG9uZW50UmVzb3VyY2VzKHVybCA9PiBQcm9taXNlLnJlc29sdmUocmVzb3VyY2VMb2FkZXIuZ2V0KHVybCkpKVxuICAgICAgLnRoZW4oKCkgPT4gbW9kdWxlRmFjdG9yeSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwdWJsaXNoRGVmYXVsdEdsb2JhbFV0aWxzKCkge1xuICBuZ0Rldk1vZGUgJiYgX3B1Ymxpc2hEZWZhdWx0R2xvYmFsVXRpbHMoKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzQm91bmRUb01vZHVsZTxDPihjZjogQ29tcG9uZW50RmFjdG9yeTxDPik6IGJvb2xlYW4ge1xuICByZXR1cm4gKGNmIGFzIFIzQ29tcG9uZW50RmFjdG9yeTxDPikuaXNCb3VuZFRvTW9kdWxlO1xufVxuXG4vKipcbiAqIEEgdG9rZW4gZm9yIHRoaXJkLXBhcnR5IGNvbXBvbmVudHMgdGhhdCBjYW4gcmVnaXN0ZXIgdGhlbXNlbHZlcyB3aXRoIE5nUHJvYmUuXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgY2xhc3MgTmdQcm9iZVRva2VuIHtcbiAgY29uc3RydWN0b3IocHVibGljIG5hbWU6IHN0cmluZywgcHVibGljIHRva2VuOiBhbnkpIHt9XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIHBsYXRmb3JtLlxuICogUGxhdGZvcm1zIG11c3QgYmUgY3JlYXRlZCBvbiBsYXVuY2ggdXNpbmcgdGhpcyBmdW5jdGlvbi5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVQbGF0Zm9ybShpbmplY3RvcjogSW5qZWN0b3IpOiBQbGF0Zm9ybVJlZiB7XG4gIGlmIChfcGxhdGZvcm1JbmplY3RvciAmJiAhX3BsYXRmb3JtSW5qZWN0b3IuZ2V0KEFMTE9XX01VTFRJUExFX1BMQVRGT1JNUywgZmFsc2UpKSB7XG4gICAgdGhyb3cgbmV3IFJ1bnRpbWVFcnJvcihcbiAgICAgICAgUnVudGltZUVycm9yQ29kZS5NVUxUSVBMRV9QTEFURk9STVMsXG4gICAgICAgIG5nRGV2TW9kZSAmJlxuICAgICAgICAgICAgJ1RoZXJlIGNhbiBiZSBvbmx5IG9uZSBwbGF0Zm9ybS4gRGVzdHJveSB0aGUgcHJldmlvdXMgb25lIHRvIGNyZWF0ZSBhIG5ldyBvbmUuJyk7XG4gIH1cbiAgcHVibGlzaERlZmF1bHRHbG9iYWxVdGlscygpO1xuICBfcGxhdGZvcm1JbmplY3RvciA9IGluamVjdG9yO1xuICBjb25zdCBwbGF0Zm9ybSA9IGluamVjdG9yLmdldChQbGF0Zm9ybVJlZik7XG4gIHJ1blBsYXRmb3JtSW5pdGlhbGl6ZXJzKGluamVjdG9yKTtcbiAgcmV0dXJuIHBsYXRmb3JtO1xufVxuXG4vKipcbiAqIFRoZSBnb2FsIG9mIHRoaXMgZnVuY3Rpb24gaXMgdG8gYm9vdHN0cmFwIGEgcGxhdGZvcm0gaW5qZWN0b3IsXG4gKiBidXQgYXZvaWQgcmVmZXJlbmNpbmcgYFBsYXRmb3JtUmVmYCBjbGFzcy5cbiAqIFRoaXMgZnVuY3Rpb24gaXMgbmVlZGVkIGZvciBib290c3RyYXBwaW5nIGEgU3RhbmRhbG9uZSBDb21wb25lbnQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVPclJldXNlUGxhdGZvcm1JbmplY3Rvcihwcm92aWRlcnM6IFN0YXRpY1Byb3ZpZGVyW10gPSBbXSk6IEluamVjdG9yIHtcbiAgLy8gSWYgYSBwbGF0Zm9ybSBpbmplY3RvciBhbHJlYWR5IGV4aXN0cywgaXQgbWVhbnMgdGhhdCB0aGUgcGxhdGZvcm1cbiAgLy8gaXMgYWxyZWFkeSBib290c3RyYXBwZWQgYW5kIG5vIGFkZGl0aW9uYWwgYWN0aW9ucyBhcmUgcmVxdWlyZWQuXG4gIGlmIChfcGxhdGZvcm1JbmplY3RvcikgcmV0dXJuIF9wbGF0Zm9ybUluamVjdG9yO1xuXG4gIC8vIE90aGVyd2lzZSwgc2V0dXAgYSBuZXcgcGxhdGZvcm0gaW5qZWN0b3IgYW5kIHJ1biBwbGF0Zm9ybSBpbml0aWFsaXplcnMuXG4gIGNvbnN0IGluamVjdG9yID0gY3JlYXRlUGxhdGZvcm1JbmplY3Rvcihwcm92aWRlcnMpO1xuICBfcGxhdGZvcm1JbmplY3RvciA9IGluamVjdG9yO1xuICBwdWJsaXNoRGVmYXVsdEdsb2JhbFV0aWxzKCk7XG4gIHJ1blBsYXRmb3JtSW5pdGlhbGl6ZXJzKGluamVjdG9yKTtcbiAgcmV0dXJuIGluamVjdG9yO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcnVuUGxhdGZvcm1Jbml0aWFsaXplcnMoaW5qZWN0b3I6IEluamVjdG9yKTogdm9pZCB7XG4gIGNvbnN0IGluaXRzID0gaW5qZWN0b3IuZ2V0KFBMQVRGT1JNX0lOSVRJQUxJWkVSLCBudWxsKTtcbiAgaWYgKGluaXRzKSB7XG4gICAgaW5pdHMuZm9yRWFjaCgoaW5pdDogYW55KSA9PiBpbml0KCkpO1xuICB9XG59XG5cbi8qKlxuICogSW50ZXJuYWwgY3JlYXRlIGFwcGxpY2F0aW9uIEFQSSB0aGF0IGltcGxlbWVudHMgdGhlIGNvcmUgYXBwbGljYXRpb24gY3JlYXRpb24gbG9naWMgYW5kIG9wdGlvbmFsXG4gKiBib290c3RyYXAgbG9naWMuXG4gKlxuICogUGxhdGZvcm1zIChzdWNoIGFzIGBwbGF0Zm9ybS1icm93c2VyYCkgbWF5IHJlcXVpcmUgZGlmZmVyZW50IHNldCBvZiBhcHBsaWNhdGlvbiBhbmQgcGxhdGZvcm1cbiAqIHByb3ZpZGVycyBmb3IgYW4gYXBwbGljYXRpb24gdG8gZnVuY3Rpb24gY29ycmVjdGx5LiBBcyBhIHJlc3VsdCwgcGxhdGZvcm1zIG1heSB1c2UgdGhpcyBmdW5jdGlvblxuICogaW50ZXJuYWxseSBhbmQgc3VwcGx5IHRoZSBuZWNlc3NhcnkgcHJvdmlkZXJzIGR1cmluZyB0aGUgYm9vdHN0cmFwLCB3aGlsZSBleHBvc2luZ1xuICogcGxhdGZvcm0tc3BlY2lmaWMgQVBJcyBhcyBhIHBhcnQgb2YgdGhlaXIgcHVibGljIEFQSS5cbiAqXG4gKiBAcmV0dXJucyBBIHByb21pc2UgdGhhdCByZXR1cm5zIGFuIGBBcHBsaWNhdGlvblJlZmAgaW5zdGFuY2Ugb25jZSByZXNvbHZlZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGludGVybmFsQ3JlYXRlQXBwbGljYXRpb24oY29uZmlnOiB7XG4gIHJvb3RDb21wb25lbnQ/OiBUeXBlPHVua25vd24+LFxuICBhcHBQcm92aWRlcnM/OiBBcnJheTxQcm92aWRlcnxFbnZpcm9ubWVudFByb3ZpZGVycz4sXG4gIHBsYXRmb3JtUHJvdmlkZXJzPzogUHJvdmlkZXJbXSxcbn0pOiBQcm9taXNlPEFwcGxpY2F0aW9uUmVmPiB7XG4gIGNvbnN0IHtyb290Q29tcG9uZW50LCBhcHBQcm92aWRlcnMsIHBsYXRmb3JtUHJvdmlkZXJzfSA9IGNvbmZpZztcblxuICBpZiAoTkdfREVWX01PREUgJiYgcm9vdENvbXBvbmVudCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgYXNzZXJ0U3RhbmRhbG9uZUNvbXBvbmVudFR5cGUocm9vdENvbXBvbmVudCk7XG4gIH1cblxuICBjb25zdCBwbGF0Zm9ybUluamVjdG9yID0gY3JlYXRlT3JSZXVzZVBsYXRmb3JtSW5qZWN0b3IocGxhdGZvcm1Qcm92aWRlcnMgYXMgU3RhdGljUHJvdmlkZXJbXSk7XG5cbiAgY29uc3Qgbmdab25lID0gZ2V0Tmdab25lKCd6b25lLmpzJywgZ2V0Tmdab25lT3B0aW9ucygpKTtcblxuICByZXR1cm4gbmdab25lLnJ1bigoKSA9PiB7XG4gICAgLy8gQ3JlYXRlIHJvb3QgYXBwbGljYXRpb24gaW5qZWN0b3IgYmFzZWQgb24gYSBzZXQgb2YgcHJvdmlkZXJzIGNvbmZpZ3VyZWQgYXQgdGhlIHBsYXRmb3JtXG4gICAgLy8gYm9vdHN0cmFwIGxldmVsIGFzIHdlbGwgYXMgcHJvdmlkZXJzIHBhc3NlZCB0byB0aGUgYm9vdHN0cmFwIGNhbGwgYnkgYSB1c2VyLlxuICAgIGNvbnN0IGFsbEFwcFByb3ZpZGVycyA9IFtcbiAgICAgIHtwcm92aWRlOiBOZ1pvbmUsIHVzZVZhbHVlOiBuZ1pvbmV9LCAgLy9cbiAgICAgIC4uLihhcHBQcm92aWRlcnMgfHwgW10pLCAgICAgICAgICAgICAgLy9cbiAgICBdO1xuXG4gICAgY29uc3QgZW52SW5qZWN0b3IgPSBjcmVhdGVFbnZpcm9ubWVudEluamVjdG9yKFxuICAgICAgICBhbGxBcHBQcm92aWRlcnMsIHBsYXRmb3JtSW5qZWN0b3IgYXMgRW52aXJvbm1lbnRJbmplY3RvciwgJ0Vudmlyb25tZW50IEluamVjdG9yJyk7XG5cbiAgICBjb25zdCBleGNlcHRpb25IYW5kbGVyOiBFcnJvckhhbmRsZXJ8bnVsbCA9IGVudkluamVjdG9yLmdldChFcnJvckhhbmRsZXIsIG51bGwpO1xuICAgIGlmIChOR19ERVZfTU9ERSAmJiAhZXhjZXB0aW9uSGFuZGxlcikge1xuICAgICAgdGhyb3cgbmV3IFJ1bnRpbWVFcnJvcihcbiAgICAgICAgICBSdW50aW1lRXJyb3JDb2RlLkVSUk9SX0hBTkRMRVJfTk9UX0ZPVU5ELFxuICAgICAgICAgICdObyBgRXJyb3JIYW5kbGVyYCBmb3VuZCBpbiB0aGUgRGVwZW5kZW5jeSBJbmplY3Rpb24gdHJlZS4nKTtcbiAgICB9XG5cbiAgICBsZXQgb25FcnJvclN1YnNjcmlwdGlvbjogU3Vic2NyaXB0aW9uO1xuICAgIG5nWm9uZS5ydW5PdXRzaWRlQW5ndWxhcigoKSA9PiB7XG4gICAgICBvbkVycm9yU3Vic2NyaXB0aW9uID0gbmdab25lLm9uRXJyb3Iuc3Vic2NyaWJlKHtcbiAgICAgICAgbmV4dDogKGVycm9yOiBhbnkpID0+IHtcbiAgICAgICAgICBleGNlcHRpb25IYW5kbGVyIS5oYW5kbGVFcnJvcihlcnJvcik7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgLy8gSWYgdGhlIHdob2xlIHBsYXRmb3JtIGlzIGRlc3Ryb3llZCwgaW52b2tlIHRoZSBgZGVzdHJveWAgbWV0aG9kXG4gICAgLy8gZm9yIGFsbCBib290c3RyYXBwZWQgYXBwbGljYXRpb25zIGFzIHdlbGwuXG4gICAgY29uc3QgZGVzdHJveUxpc3RlbmVyID0gKCkgPT4gZW52SW5qZWN0b3IuZGVzdHJveSgpO1xuICAgIGNvbnN0IG9uUGxhdGZvcm1EZXN0cm95TGlzdGVuZXJzID0gcGxhdGZvcm1JbmplY3Rvci5nZXQoUExBVEZPUk1fREVTVFJPWV9MSVNURU5FUlMpO1xuICAgIG9uUGxhdGZvcm1EZXN0cm95TGlzdGVuZXJzLmFkZChkZXN0cm95TGlzdGVuZXIpO1xuXG4gICAgZW52SW5qZWN0b3Iub25EZXN0cm95KCgpID0+IHtcbiAgICAgIG9uRXJyb3JTdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcbiAgICAgIG9uUGxhdGZvcm1EZXN0cm95TGlzdGVuZXJzLmRlbGV0ZShkZXN0cm95TGlzdGVuZXIpO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIF9jYWxsQW5kUmVwb3J0VG9FcnJvckhhbmRsZXIoZXhjZXB0aW9uSGFuZGxlciEsIG5nWm9uZSwgKCkgPT4ge1xuICAgICAgY29uc3QgaW5pdFN0YXR1cyA9IGVudkluamVjdG9yLmdldChBcHBsaWNhdGlvbkluaXRTdGF0dXMpO1xuICAgICAgaW5pdFN0YXR1cy5ydW5Jbml0aWFsaXplcnMoKTtcblxuICAgICAgcmV0dXJuIGluaXRTdGF0dXMuZG9uZVByb21pc2UudGhlbigoKSA9PiB7XG4gICAgICAgIGNvbnN0IGxvY2FsZUlkID0gZW52SW5qZWN0b3IuZ2V0KExPQ0FMRV9JRCwgREVGQVVMVF9MT0NBTEVfSUQpO1xuICAgICAgICBzZXRMb2NhbGVJZChsb2NhbGVJZCB8fCBERUZBVUxUX0xPQ0FMRV9JRCk7XG5cbiAgICAgICAgY29uc3QgYXBwUmVmID0gZW52SW5qZWN0b3IuZ2V0KEFwcGxpY2F0aW9uUmVmKTtcbiAgICAgICAgaWYgKHJvb3RDb21wb25lbnQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIGFwcFJlZi5ib290c3RyYXAocm9vdENvbXBvbmVudCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGFwcFJlZjtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9KTtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGEgZmFjdG9yeSBmb3IgYSBwbGF0Zm9ybS4gQ2FuIGJlIHVzZWQgdG8gcHJvdmlkZSBvciBvdmVycmlkZSBgUHJvdmlkZXJzYCBzcGVjaWZpYyB0b1xuICogeW91ciBhcHBsaWNhdGlvbidzIHJ1bnRpbWUgbmVlZHMsIHN1Y2ggYXMgYFBMQVRGT1JNX0lOSVRJQUxJWkVSYCBhbmQgYFBMQVRGT1JNX0lEYC5cbiAqIEBwYXJhbSBwYXJlbnRQbGF0Zm9ybUZhY3RvcnkgQW5vdGhlciBwbGF0Zm9ybSBmYWN0b3J5IHRvIG1vZGlmeS4gQWxsb3dzIHlvdSB0byBjb21wb3NlIGZhY3Rvcmllc1xuICogdG8gYnVpbGQgdXAgY29uZmlndXJhdGlvbnMgdGhhdCBtaWdodCBiZSByZXF1aXJlZCBieSBkaWZmZXJlbnQgbGlicmFyaWVzIG9yIHBhcnRzIG9mIHRoZVxuICogYXBwbGljYXRpb24uXG4gKiBAcGFyYW0gbmFtZSBJZGVudGlmaWVzIHRoZSBuZXcgcGxhdGZvcm0gZmFjdG9yeS5cbiAqIEBwYXJhbSBwcm92aWRlcnMgQSBzZXQgb2YgZGVwZW5kZW5jeSBwcm92aWRlcnMgZm9yIHBsYXRmb3JtcyBjcmVhdGVkIHdpdGggdGhlIG5ldyBmYWN0b3J5LlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVBsYXRmb3JtRmFjdG9yeShcbiAgICBwYXJlbnRQbGF0Zm9ybUZhY3Rvcnk6ICgoZXh0cmFQcm92aWRlcnM/OiBTdGF0aWNQcm92aWRlcltdKSA9PiBQbGF0Zm9ybVJlZil8bnVsbCwgbmFtZTogc3RyaW5nLFxuICAgIHByb3ZpZGVyczogU3RhdGljUHJvdmlkZXJbXSA9IFtdKTogKGV4dHJhUHJvdmlkZXJzPzogU3RhdGljUHJvdmlkZXJbXSkgPT4gUGxhdGZvcm1SZWYge1xuICBjb25zdCBkZXNjID0gYFBsYXRmb3JtOiAke25hbWV9YDtcbiAgY29uc3QgbWFya2VyID0gbmV3IEluamVjdGlvblRva2VuKGRlc2MpO1xuICByZXR1cm4gKGV4dHJhUHJvdmlkZXJzOiBTdGF0aWNQcm92aWRlcltdID0gW10pID0+IHtcbiAgICBsZXQgcGxhdGZvcm0gPSBnZXRQbGF0Zm9ybSgpO1xuICAgIGlmICghcGxhdGZvcm0gfHwgcGxhdGZvcm0uaW5qZWN0b3IuZ2V0KEFMTE9XX01VTFRJUExFX1BMQVRGT1JNUywgZmFsc2UpKSB7XG4gICAgICBjb25zdCBwbGF0Zm9ybVByb3ZpZGVyczogU3RhdGljUHJvdmlkZXJbXSA9IFtcbiAgICAgICAgLi4ucHJvdmlkZXJzLCAgICAgICAvL1xuICAgICAgICAuLi5leHRyYVByb3ZpZGVycywgIC8vXG4gICAgICAgIHtwcm92aWRlOiBtYXJrZXIsIHVzZVZhbHVlOiB0cnVlfVxuICAgICAgXTtcbiAgICAgIGlmIChwYXJlbnRQbGF0Zm9ybUZhY3RvcnkpIHtcbiAgICAgICAgcGFyZW50UGxhdGZvcm1GYWN0b3J5KHBsYXRmb3JtUHJvdmlkZXJzKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNyZWF0ZVBsYXRmb3JtKGNyZWF0ZVBsYXRmb3JtSW5qZWN0b3IocGxhdGZvcm1Qcm92aWRlcnMsIGRlc2MpKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGFzc2VydFBsYXRmb3JtKG1hcmtlcik7XG4gIH07XG59XG5cbi8qKlxuICogQ2hlY2tzIHRoYXQgdGhlcmUgaXMgY3VycmVudGx5IGEgcGxhdGZvcm0gdGhhdCBjb250YWlucyB0aGUgZ2l2ZW4gdG9rZW4gYXMgYSBwcm92aWRlci5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhc3NlcnRQbGF0Zm9ybShyZXF1aXJlZFRva2VuOiBhbnkpOiBQbGF0Zm9ybVJlZiB7XG4gIGNvbnN0IHBsYXRmb3JtID0gZ2V0UGxhdGZvcm0oKTtcblxuICBpZiAoIXBsYXRmb3JtKSB7XG4gICAgdGhyb3cgbmV3IFJ1bnRpbWVFcnJvcihSdW50aW1lRXJyb3JDb2RlLlBMQVRGT1JNX05PVF9GT1VORCwgbmdEZXZNb2RlICYmICdObyBwbGF0Zm9ybSBleGlzdHMhJyk7XG4gIH1cblxuICBpZiAoKHR5cGVvZiBuZ0Rldk1vZGUgPT09ICd1bmRlZmluZWQnIHx8IG5nRGV2TW9kZSkgJiZcbiAgICAgICFwbGF0Zm9ybS5pbmplY3Rvci5nZXQocmVxdWlyZWRUb2tlbiwgbnVsbCkpIHtcbiAgICB0aHJvdyBuZXcgUnVudGltZUVycm9yKFxuICAgICAgICBSdW50aW1lRXJyb3JDb2RlLk1VTFRJUExFX1BMQVRGT1JNUyxcbiAgICAgICAgJ0EgcGxhdGZvcm0gd2l0aCBhIGRpZmZlcmVudCBjb25maWd1cmF0aW9uIGhhcyBiZWVuIGNyZWF0ZWQuIFBsZWFzZSBkZXN0cm95IGl0IGZpcnN0LicpO1xuICB9XG5cbiAgcmV0dXJuIHBsYXRmb3JtO1xufVxuXG4vKipcbiAqIEhlbHBlciBmdW5jdGlvbiB0byBjcmVhdGUgYW4gaW5zdGFuY2Ugb2YgYSBwbGF0Zm9ybSBpbmplY3RvciAodGhhdCBtYWludGFpbnMgdGhlICdwbGF0Zm9ybSdcbiAqIHNjb3BlKS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVBsYXRmb3JtSW5qZWN0b3IocHJvdmlkZXJzOiBTdGF0aWNQcm92aWRlcltdID0gW10sIG5hbWU/OiBzdHJpbmcpOiBJbmplY3RvciB7XG4gIHJldHVybiBJbmplY3Rvci5jcmVhdGUoe1xuICAgIG5hbWUsXG4gICAgcHJvdmlkZXJzOiBbXG4gICAgICB7cHJvdmlkZTogSU5KRUNUT1JfU0NPUEUsIHVzZVZhbHVlOiAncGxhdGZvcm0nfSxcbiAgICAgIHtwcm92aWRlOiBQTEFURk9STV9ERVNUUk9ZX0xJU1RFTkVSUywgdXNlVmFsdWU6IG5ldyBTZXQoWygpID0+IF9wbGF0Zm9ybUluamVjdG9yID0gbnVsbF0pfSxcbiAgICAgIC4uLnByb3ZpZGVyc1xuICAgIF0sXG4gIH0pO1xufVxuXG4vKipcbiAqIERlc3Ryb3lzIHRoZSBjdXJyZW50IEFuZ3VsYXIgcGxhdGZvcm0gYW5kIGFsbCBBbmd1bGFyIGFwcGxpY2F0aW9ucyBvbiB0aGUgcGFnZS5cbiAqIERlc3Ryb3lzIGFsbCBtb2R1bGVzIGFuZCBsaXN0ZW5lcnMgcmVnaXN0ZXJlZCB3aXRoIHRoZSBwbGF0Zm9ybS5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkZXN0cm95UGxhdGZvcm0oKTogdm9pZCB7XG4gIGdldFBsYXRmb3JtKCk/LmRlc3Ryb3koKTtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBjdXJyZW50IHBsYXRmb3JtLlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldFBsYXRmb3JtKCk6IFBsYXRmb3JtUmVmfG51bGwge1xuICByZXR1cm4gX3BsYXRmb3JtSW5qZWN0b3I/LmdldChQbGF0Zm9ybVJlZikgPz8gbnVsbDtcbn1cblxuLyoqXG4gKiBQcm92aWRlcyBhZGRpdGlvbmFsIG9wdGlvbnMgdG8gdGhlIGJvb3RzdHJhcHBpbmcgcHJvY2Vzcy5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgQm9vdHN0cmFwT3B0aW9ucyB7XG4gIC8qKlxuICAgKiBPcHRpb25hbGx5IHNwZWNpZnkgd2hpY2ggYE5nWm9uZWAgc2hvdWxkIGJlIHVzZWQuXG4gICAqXG4gICAqIC0gUHJvdmlkZSB5b3VyIG93biBgTmdab25lYCBpbnN0YW5jZS5cbiAgICogLSBgem9uZS5qc2AgLSBVc2UgZGVmYXVsdCBgTmdab25lYCB3aGljaCByZXF1aXJlcyBgWm9uZS5qc2AuXG4gICAqIC0gYG5vb3BgIC0gVXNlIGBOb29wTmdab25lYCB3aGljaCBkb2VzIG5vdGhpbmcuXG4gICAqL1xuICBuZ1pvbmU/OiBOZ1pvbmV8J3pvbmUuanMnfCdub29wJztcblxuICAvKipcbiAgICogT3B0aW9uYWxseSBzcGVjaWZ5IGNvYWxlc2NpbmcgZXZlbnQgY2hhbmdlIGRldGVjdGlvbnMgb3Igbm90LlxuICAgKiBDb25zaWRlciB0aGUgZm9sbG93aW5nIGNhc2UuXG4gICAqXG4gICAqIGBgYFxuICAgKiA8ZGl2IChjbGljayk9XCJkb1NvbWV0aGluZygpXCI+XG4gICAqICAgPGJ1dHRvbiAoY2xpY2spPVwiZG9Tb21ldGhpbmdFbHNlKClcIj48L2J1dHRvbj5cbiAgICogPC9kaXY+XG4gICAqIGBgYFxuICAgKlxuICAgKiBXaGVuIGJ1dHRvbiBpcyBjbGlja2VkLCBiZWNhdXNlIG9mIHRoZSBldmVudCBidWJibGluZywgYm90aFxuICAgKiBldmVudCBoYW5kbGVycyB3aWxsIGJlIGNhbGxlZCBhbmQgMiBjaGFuZ2UgZGV0ZWN0aW9ucyB3aWxsIGJlXG4gICAqIHRyaWdnZXJlZC4gV2UgY2FuIGNvYWxlc2NlIHN1Y2gga2luZCBvZiBldmVudHMgdG8gb25seSB0cmlnZ2VyXG4gICAqIGNoYW5nZSBkZXRlY3Rpb24gb25seSBvbmNlLlxuICAgKlxuICAgKiBCeSBkZWZhdWx0LCB0aGlzIG9wdGlvbiB3aWxsIGJlIGZhbHNlLiBTbyB0aGUgZXZlbnRzIHdpbGwgbm90IGJlXG4gICAqIGNvYWxlc2NlZCBhbmQgdGhlIGNoYW5nZSBkZXRlY3Rpb24gd2lsbCBiZSB0cmlnZ2VyZWQgbXVsdGlwbGUgdGltZXMuXG4gICAqIEFuZCBpZiB0aGlzIG9wdGlvbiBiZSBzZXQgdG8gdHJ1ZSwgdGhlIGNoYW5nZSBkZXRlY3Rpb24gd2lsbCBiZVxuICAgKiB0cmlnZ2VyZWQgYXN5bmMgYnkgc2NoZWR1bGluZyBhIGFuaW1hdGlvbiBmcmFtZS4gU28gaW4gdGhlIGNhc2UgYWJvdmUsXG4gICAqIHRoZSBjaGFuZ2UgZGV0ZWN0aW9uIHdpbGwgb25seSBiZSB0cmlnZ2VyZWQgb25jZS5cbiAgICovXG4gIG5nWm9uZUV2ZW50Q29hbGVzY2luZz86IGJvb2xlYW47XG5cbiAgLyoqXG4gICAqIE9wdGlvbmFsbHkgc3BlY2lmeSBpZiBgTmdab25lI3J1bigpYCBtZXRob2QgaW52b2NhdGlvbnMgc2hvdWxkIGJlIGNvYWxlc2NlZFxuICAgKiBpbnRvIGEgc2luZ2xlIGNoYW5nZSBkZXRlY3Rpb24uXG4gICAqXG4gICAqIENvbnNpZGVyIHRoZSBmb2xsb3dpbmcgY2FzZS5cbiAgICogYGBgXG4gICAqIGZvciAobGV0IGkgPSAwOyBpIDwgMTA7IGkgKyspIHtcbiAgICogICBuZ1pvbmUucnVuKCgpID0+IHtcbiAgICogICAgIC8vIGRvIHNvbWV0aGluZ1xuICAgKiAgIH0pO1xuICAgKiB9XG4gICAqIGBgYFxuICAgKlxuICAgKiBUaGlzIGNhc2UgdHJpZ2dlcnMgdGhlIGNoYW5nZSBkZXRlY3Rpb24gbXVsdGlwbGUgdGltZXMuXG4gICAqIFdpdGggbmdab25lUnVuQ29hbGVzY2luZyBvcHRpb25zLCBhbGwgY2hhbmdlIGRldGVjdGlvbnMgaW4gYW4gZXZlbnQgbG9vcCB0cmlnZ2VyIG9ubHkgb25jZS5cbiAgICogSW4gYWRkaXRpb24sIHRoZSBjaGFuZ2UgZGV0ZWN0aW9uIGV4ZWN1dGVzIGluIHJlcXVlc3RBbmltYXRpb24uXG4gICAqXG4gICAqL1xuICBuZ1pvbmVSdW5Db2FsZXNjaW5nPzogYm9vbGVhbjtcbn1cblxuLyoqXG4gKiBUaGUgQW5ndWxhciBwbGF0Zm9ybSBpcyB0aGUgZW50cnkgcG9pbnQgZm9yIEFuZ3VsYXIgb24gYSB3ZWIgcGFnZS5cbiAqIEVhY2ggcGFnZSBoYXMgZXhhY3RseSBvbmUgcGxhdGZvcm0uIFNlcnZpY2VzIChzdWNoIGFzIHJlZmxlY3Rpb24pIHdoaWNoIGFyZSBjb21tb25cbiAqIHRvIGV2ZXJ5IEFuZ3VsYXIgYXBwbGljYXRpb24gcnVubmluZyBvbiB0aGUgcGFnZSBhcmUgYm91bmQgaW4gaXRzIHNjb3BlLlxuICogQSBwYWdlJ3MgcGxhdGZvcm0gaXMgaW5pdGlhbGl6ZWQgaW1wbGljaXRseSB3aGVuIGEgcGxhdGZvcm0gaXMgY3JlYXRlZCB1c2luZyBhIHBsYXRmb3JtXG4gKiBmYWN0b3J5IHN1Y2ggYXMgYFBsYXRmb3JtQnJvd3NlcmAsIG9yIGV4cGxpY2l0bHkgYnkgY2FsbGluZyB0aGUgYGNyZWF0ZVBsYXRmb3JtKClgIGZ1bmN0aW9uLlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuQEluamVjdGFibGUoe3Byb3ZpZGVkSW46ICdwbGF0Zm9ybSd9KVxuZXhwb3J0IGNsYXNzIFBsYXRmb3JtUmVmIHtcbiAgcHJpdmF0ZSBfbW9kdWxlczogTmdNb2R1bGVSZWY8YW55PltdID0gW107XG4gIHByaXZhdGUgX2Rlc3Ryb3lMaXN0ZW5lcnM6IEFycmF5PCgpID0+IHZvaWQ+ID0gW107XG4gIHByaXZhdGUgX2Rlc3Ryb3llZDogYm9vbGVhbiA9IGZhbHNlO1xuXG4gIC8qKiBAaW50ZXJuYWwgKi9cbiAgY29uc3RydWN0b3IocHJpdmF0ZSBfaW5qZWN0b3I6IEluamVjdG9yKSB7fVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGFuIGluc3RhbmNlIG9mIGFuIGBATmdNb2R1bGVgIGZvciB0aGUgZ2l2ZW4gcGxhdGZvcm0uXG4gICAqXG4gICAqIEBkZXByZWNhdGVkIFBhc3NpbmcgTmdNb2R1bGUgZmFjdG9yaWVzIGFzIHRoZSBgUGxhdGZvcm1SZWYuYm9vdHN0cmFwTW9kdWxlRmFjdG9yeWAgZnVuY3Rpb25cbiAgICogICAgIGFyZ3VtZW50IGlzIGRlcHJlY2F0ZWQuIFVzZSB0aGUgYFBsYXRmb3JtUmVmLmJvb3RzdHJhcE1vZHVsZWAgQVBJIGluc3RlYWQuXG4gICAqL1xuICBib290c3RyYXBNb2R1bGVGYWN0b3J5PE0+KG1vZHVsZUZhY3Rvcnk6IE5nTW9kdWxlRmFjdG9yeTxNPiwgb3B0aW9ucz86IEJvb3RzdHJhcE9wdGlvbnMpOlxuICAgICAgUHJvbWlzZTxOZ01vZHVsZVJlZjxNPj4ge1xuICAgIC8vIE5vdGU6IFdlIG5lZWQgdG8gY3JlYXRlIHRoZSBOZ1pvbmUgX2JlZm9yZV8gd2UgaW5zdGFudGlhdGUgdGhlIG1vZHVsZSxcbiAgICAvLyBhcyBpbnN0YW50aWF0aW5nIHRoZSBtb2R1bGUgY3JlYXRlcyBzb21lIHByb3ZpZGVycyBlYWdlcmx5LlxuICAgIC8vIFNvIHdlIGNyZWF0ZSBhIG1pbmkgcGFyZW50IGluamVjdG9yIHRoYXQganVzdCBjb250YWlucyB0aGUgbmV3IE5nWm9uZSBhbmRcbiAgICAvLyBwYXNzIHRoYXQgYXMgcGFyZW50IHRvIHRoZSBOZ01vZHVsZUZhY3RvcnkuXG4gICAgY29uc3Qgbmdab25lID0gZ2V0Tmdab25lKG9wdGlvbnM/Lm5nWm9uZSwgZ2V0Tmdab25lT3B0aW9ucyhvcHRpb25zKSk7XG4gICAgY29uc3QgcHJvdmlkZXJzOiBTdGF0aWNQcm92aWRlcltdID0gW3twcm92aWRlOiBOZ1pvbmUsIHVzZVZhbHVlOiBuZ1pvbmV9XTtcbiAgICAvLyBOb3RlOiBDcmVhdGUgbmdab25lSW5qZWN0b3Igd2l0aGluIG5nWm9uZS5ydW4gc28gdGhhdCBhbGwgb2YgdGhlIGluc3RhbnRpYXRlZCBzZXJ2aWNlcyBhcmVcbiAgICAvLyBjcmVhdGVkIHdpdGhpbiB0aGUgQW5ndWxhciB6b25lXG4gICAgLy8gRG8gbm90IHRyeSB0byByZXBsYWNlIG5nWm9uZS5ydW4gd2l0aCBBcHBsaWNhdGlvblJlZiNydW4gYmVjYXVzZSBBcHBsaWNhdGlvblJlZiB3b3VsZCB0aGVuIGJlXG4gICAgLy8gY3JlYXRlZCBvdXRzaWRlIG9mIHRoZSBBbmd1bGFyIHpvbmUuXG4gICAgcmV0dXJuIG5nWm9uZS5ydW4oKCkgPT4ge1xuICAgICAgY29uc3Qgbmdab25lSW5qZWN0b3IgPSBJbmplY3Rvci5jcmVhdGUoXG4gICAgICAgICAge3Byb3ZpZGVyczogcHJvdmlkZXJzLCBwYXJlbnQ6IHRoaXMuaW5qZWN0b3IsIG5hbWU6IG1vZHVsZUZhY3RvcnkubW9kdWxlVHlwZS5uYW1lfSk7XG4gICAgICBjb25zdCBtb2R1bGVSZWYgPSA8SW50ZXJuYWxOZ01vZHVsZVJlZjxNPj5tb2R1bGVGYWN0b3J5LmNyZWF0ZShuZ1pvbmVJbmplY3Rvcik7XG4gICAgICBjb25zdCBleGNlcHRpb25IYW5kbGVyOiBFcnJvckhhbmRsZXJ8bnVsbCA9IG1vZHVsZVJlZi5pbmplY3Rvci5nZXQoRXJyb3JIYW5kbGVyLCBudWxsKTtcbiAgICAgIGlmICghZXhjZXB0aW9uSGFuZGxlcikge1xuICAgICAgICB0aHJvdyBuZXcgUnVudGltZUVycm9yKFxuICAgICAgICAgICAgUnVudGltZUVycm9yQ29kZS5FUlJPUl9IQU5ETEVSX05PVF9GT1VORCxcbiAgICAgICAgICAgIG5nRGV2TW9kZSAmJiAnTm8gRXJyb3JIYW5kbGVyLiBJcyBwbGF0Zm9ybSBtb2R1bGUgKEJyb3dzZXJNb2R1bGUpIGluY2x1ZGVkPycpO1xuICAgICAgfVxuICAgICAgbmdab25lIS5ydW5PdXRzaWRlQW5ndWxhcigoKSA9PiB7XG4gICAgICAgIGNvbnN0IHN1YnNjcmlwdGlvbiA9IG5nWm9uZSEub25FcnJvci5zdWJzY3JpYmUoe1xuICAgICAgICAgIG5leHQ6IChlcnJvcjogYW55KSA9PiB7XG4gICAgICAgICAgICBleGNlcHRpb25IYW5kbGVyLmhhbmRsZUVycm9yKGVycm9yKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBtb2R1bGVSZWYub25EZXN0cm95KCgpID0+IHtcbiAgICAgICAgICByZW1vdmUodGhpcy5fbW9kdWxlcywgbW9kdWxlUmVmKTtcbiAgICAgICAgICBzdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICAgIHJldHVybiBfY2FsbEFuZFJlcG9ydFRvRXJyb3JIYW5kbGVyKGV4Y2VwdGlvbkhhbmRsZXIsIG5nWm9uZSEsICgpID0+IHtcbiAgICAgICAgY29uc3QgaW5pdFN0YXR1czogQXBwbGljYXRpb25Jbml0U3RhdHVzID0gbW9kdWxlUmVmLmluamVjdG9yLmdldChBcHBsaWNhdGlvbkluaXRTdGF0dXMpO1xuICAgICAgICBpbml0U3RhdHVzLnJ1bkluaXRpYWxpemVycygpO1xuICAgICAgICByZXR1cm4gaW5pdFN0YXR1cy5kb25lUHJvbWlzZS50aGVuKCgpID0+IHtcbiAgICAgICAgICAvLyBJZiB0aGUgYExPQ0FMRV9JRGAgcHJvdmlkZXIgaXMgZGVmaW5lZCBhdCBib290c3RyYXAgdGhlbiB3ZSBzZXQgdGhlIHZhbHVlIGZvciBpdnlcbiAgICAgICAgICBjb25zdCBsb2NhbGVJZCA9IG1vZHVsZVJlZi5pbmplY3Rvci5nZXQoTE9DQUxFX0lELCBERUZBVUxUX0xPQ0FMRV9JRCk7XG4gICAgICAgICAgc2V0TG9jYWxlSWQobG9jYWxlSWQgfHwgREVGQVVMVF9MT0NBTEVfSUQpO1xuICAgICAgICAgIHRoaXMuX21vZHVsZURvQm9vdHN0cmFwKG1vZHVsZVJlZik7XG4gICAgICAgICAgcmV0dXJuIG1vZHVsZVJlZjtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGFuIGluc3RhbmNlIG9mIGFuIGBATmdNb2R1bGVgIGZvciBhIGdpdmVuIHBsYXRmb3JtLlxuICAgKlxuICAgKiBAdXNhZ2VOb3Rlc1xuICAgKiAjIyMgU2ltcGxlIEV4YW1wbGVcbiAgICpcbiAgICogYGBgdHlwZXNjcmlwdFxuICAgKiBATmdNb2R1bGUoe1xuICAgKiAgIGltcG9ydHM6IFtCcm93c2VyTW9kdWxlXVxuICAgKiB9KVxuICAgKiBjbGFzcyBNeU1vZHVsZSB7fVxuICAgKlxuICAgKiBsZXQgbW9kdWxlUmVmID0gcGxhdGZvcm1Ccm93c2VyKCkuYm9vdHN0cmFwTW9kdWxlKE15TW9kdWxlKTtcbiAgICogYGBgXG4gICAqXG4gICAqL1xuICBib290c3RyYXBNb2R1bGU8TT4oXG4gICAgICBtb2R1bGVUeXBlOiBUeXBlPE0+LFxuICAgICAgY29tcGlsZXJPcHRpb25zOiAoQ29tcGlsZXJPcHRpb25zJkJvb3RzdHJhcE9wdGlvbnMpfFxuICAgICAgQXJyYXk8Q29tcGlsZXJPcHRpb25zJkJvb3RzdHJhcE9wdGlvbnM+ID0gW10pOiBQcm9taXNlPE5nTW9kdWxlUmVmPE0+PiB7XG4gICAgY29uc3Qgb3B0aW9ucyA9IG9wdGlvbnNSZWR1Y2VyKHt9LCBjb21waWxlck9wdGlvbnMpO1xuICAgIHJldHVybiBjb21waWxlTmdNb2R1bGVGYWN0b3J5KHRoaXMuaW5qZWN0b3IsIG9wdGlvbnMsIG1vZHVsZVR5cGUpXG4gICAgICAgIC50aGVuKG1vZHVsZUZhY3RvcnkgPT4gdGhpcy5ib290c3RyYXBNb2R1bGVGYWN0b3J5KG1vZHVsZUZhY3RvcnksIG9wdGlvbnMpKTtcbiAgfVxuXG4gIHByaXZhdGUgX21vZHVsZURvQm9vdHN0cmFwKG1vZHVsZVJlZjogSW50ZXJuYWxOZ01vZHVsZVJlZjxhbnk+KTogdm9pZCB7XG4gICAgY29uc3QgYXBwUmVmID0gbW9kdWxlUmVmLmluamVjdG9yLmdldChBcHBsaWNhdGlvblJlZik7XG4gICAgaWYgKG1vZHVsZVJlZi5fYm9vdHN0cmFwQ29tcG9uZW50cy5sZW5ndGggPiAwKSB7XG4gICAgICBtb2R1bGVSZWYuX2Jvb3RzdHJhcENvbXBvbmVudHMuZm9yRWFjaChmID0+IGFwcFJlZi5ib290c3RyYXAoZikpO1xuICAgIH0gZWxzZSBpZiAobW9kdWxlUmVmLmluc3RhbmNlLm5nRG9Cb290c3RyYXApIHtcbiAgICAgIG1vZHVsZVJlZi5pbnN0YW5jZS5uZ0RvQm9vdHN0cmFwKGFwcFJlZik7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IG5ldyBSdW50aW1lRXJyb3IoXG4gICAgICAgICAgUnVudGltZUVycm9yQ29kZS5CT09UU1RSQVBfQ09NUE9ORU5UU19OT1RfRk9VTkQsXG4gICAgICAgICAgbmdEZXZNb2RlICYmXG4gICAgICAgICAgICAgIGBUaGUgbW9kdWxlICR7c3RyaW5naWZ5KG1vZHVsZVJlZi5pbnN0YW5jZS5jb25zdHJ1Y3Rvcil9IHdhcyBib290c3RyYXBwZWQsIGAgK1xuICAgICAgICAgICAgICAgICAgYGJ1dCBpdCBkb2VzIG5vdCBkZWNsYXJlIFwiQE5nTW9kdWxlLmJvb3RzdHJhcFwiIGNvbXBvbmVudHMgbm9yIGEgXCJuZ0RvQm9vdHN0cmFwXCIgbWV0aG9kLiBgICtcbiAgICAgICAgICAgICAgICAgIGBQbGVhc2UgZGVmaW5lIG9uZSBvZiB0aGVzZS5gKTtcbiAgICB9XG4gICAgdGhpcy5fbW9kdWxlcy5wdXNoKG1vZHVsZVJlZik7XG4gIH1cblxuICAvKipcbiAgICogUmVnaXN0ZXJzIGEgbGlzdGVuZXIgdG8gYmUgY2FsbGVkIHdoZW4gdGhlIHBsYXRmb3JtIGlzIGRlc3Ryb3llZC5cbiAgICovXG4gIG9uRGVzdHJveShjYWxsYmFjazogKCkgPT4gdm9pZCk6IHZvaWQge1xuICAgIHRoaXMuX2Rlc3Ryb3lMaXN0ZW5lcnMucHVzaChjYWxsYmFjayk7XG4gIH1cblxuICAvKipcbiAgICogUmV0cmlldmVzIHRoZSBwbGF0Zm9ybSB7QGxpbmsgSW5qZWN0b3J9LCB3aGljaCBpcyB0aGUgcGFyZW50IGluamVjdG9yIGZvclxuICAgKiBldmVyeSBBbmd1bGFyIGFwcGxpY2F0aW9uIG9uIHRoZSBwYWdlIGFuZCBwcm92aWRlcyBzaW5nbGV0b24gcHJvdmlkZXJzLlxuICAgKi9cbiAgZ2V0IGluamVjdG9yKCk6IEluamVjdG9yIHtcbiAgICByZXR1cm4gdGhpcy5faW5qZWN0b3I7XG4gIH1cblxuICAvKipcbiAgICogRGVzdHJveXMgdGhlIGN1cnJlbnQgQW5ndWxhciBwbGF0Zm9ybSBhbmQgYWxsIEFuZ3VsYXIgYXBwbGljYXRpb25zIG9uIHRoZSBwYWdlLlxuICAgKiBEZXN0cm95cyBhbGwgbW9kdWxlcyBhbmQgbGlzdGVuZXJzIHJlZ2lzdGVyZWQgd2l0aCB0aGUgcGxhdGZvcm0uXG4gICAqL1xuICBkZXN0cm95KCkge1xuICAgIGlmICh0aGlzLl9kZXN0cm95ZWQpIHtcbiAgICAgIHRocm93IG5ldyBSdW50aW1lRXJyb3IoXG4gICAgICAgICAgUnVudGltZUVycm9yQ29kZS5QTEFURk9STV9BTFJFQURZX0RFU1RST1lFRCxcbiAgICAgICAgICBuZ0Rldk1vZGUgJiYgJ1RoZSBwbGF0Zm9ybSBoYXMgYWxyZWFkeSBiZWVuIGRlc3Ryb3llZCEnKTtcbiAgICB9XG4gICAgdGhpcy5fbW9kdWxlcy5zbGljZSgpLmZvckVhY2gobW9kdWxlID0+IG1vZHVsZS5kZXN0cm95KCkpO1xuICAgIHRoaXMuX2Rlc3Ryb3lMaXN0ZW5lcnMuZm9yRWFjaChsaXN0ZW5lciA9PiBsaXN0ZW5lcigpKTtcblxuICAgIGNvbnN0IGRlc3Ryb3lMaXN0ZW5lcnMgPSB0aGlzLl9pbmplY3Rvci5nZXQoUExBVEZPUk1fREVTVFJPWV9MSVNURU5FUlMsIG51bGwpO1xuICAgIGlmIChkZXN0cm95TGlzdGVuZXJzKSB7XG4gICAgICBkZXN0cm95TGlzdGVuZXJzLmZvckVhY2gobGlzdGVuZXIgPT4gbGlzdGVuZXIoKSk7XG4gICAgICBkZXN0cm95TGlzdGVuZXJzLmNsZWFyKCk7XG4gICAgfVxuXG4gICAgdGhpcy5fZGVzdHJveWVkID0gdHJ1ZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbmRpY2F0ZXMgd2hldGhlciB0aGlzIGluc3RhbmNlIHdhcyBkZXN0cm95ZWQuXG4gICAqL1xuICBnZXQgZGVzdHJveWVkKCkge1xuICAgIHJldHVybiB0aGlzLl9kZXN0cm95ZWQ7XG4gIH1cbn1cblxuLy8gU2V0IG9mIG9wdGlvbnMgcmVjb2duaXplZCBieSB0aGUgTmdab25lLlxuaW50ZXJmYWNlIE5nWm9uZU9wdGlvbnMge1xuICBlbmFibGVMb25nU3RhY2tUcmFjZTogYm9vbGVhbjtcbiAgc2hvdWxkQ29hbGVzY2VFdmVudENoYW5nZURldGVjdGlvbjogYm9vbGVhbjtcbiAgc2hvdWxkQ29hbGVzY2VSdW5DaGFuZ2VEZXRlY3Rpb246IGJvb2xlYW47XG59XG5cbi8vIFRyYW5zZm9ybXMgYSBzZXQgb2YgYEJvb3RzdHJhcE9wdGlvbnNgIChzdXBwb3J0ZWQgYnkgdGhlIE5nTW9kdWxlLWJhc2VkIGJvb3RzdHJhcCBBUElzKSAtPlxuLy8gYE5nWm9uZU9wdGlvbnNgIHRoYXQgYXJlIHJlY29nbml6ZWQgYnkgdGhlIE5nWm9uZSBjb25zdHJ1Y3Rvci4gUGFzc2luZyBubyBvcHRpb25zIHdpbGwgcmVzdWx0IGluXG4vLyBhIHNldCBvZiBkZWZhdWx0IG9wdGlvbnMgcmV0dXJuZWQuXG5mdW5jdGlvbiBnZXROZ1pvbmVPcHRpb25zKG9wdGlvbnM/OiBCb290c3RyYXBPcHRpb25zKTogTmdab25lT3B0aW9ucyB7XG4gIHJldHVybiB7XG4gICAgZW5hYmxlTG9uZ1N0YWNrVHJhY2U6IHR5cGVvZiBuZ0Rldk1vZGUgPT09ICd1bmRlZmluZWQnID8gZmFsc2UgOiAhIW5nRGV2TW9kZSxcbiAgICBzaG91bGRDb2FsZXNjZUV2ZW50Q2hhbmdlRGV0ZWN0aW9uOiAhIShvcHRpb25zICYmIG9wdGlvbnMubmdab25lRXZlbnRDb2FsZXNjaW5nKSB8fCBmYWxzZSxcbiAgICBzaG91bGRDb2FsZXNjZVJ1bkNoYW5nZURldGVjdGlvbjogISEob3B0aW9ucyAmJiBvcHRpb25zLm5nWm9uZVJ1bkNvYWxlc2NpbmcpIHx8IGZhbHNlLFxuICB9O1xufVxuXG5mdW5jdGlvbiBnZXROZ1pvbmUobmdab25lVG9Vc2U6IE5nWm9uZXwnem9uZS5qcyd8J25vb3AnfHVuZGVmaW5lZCwgb3B0aW9uczogTmdab25lT3B0aW9ucyk6IE5nWm9uZSB7XG4gIGxldCBuZ1pvbmU6IE5nWm9uZTtcblxuICBpZiAobmdab25lVG9Vc2UgPT09ICdub29wJykge1xuICAgIG5nWm9uZSA9IG5ldyBOb29wTmdab25lKCk7XG4gIH0gZWxzZSB7XG4gICAgbmdab25lID0gKG5nWm9uZVRvVXNlID09PSAnem9uZS5qcycgPyB1bmRlZmluZWQgOiBuZ1pvbmVUb1VzZSkgfHwgbmV3IE5nWm9uZShvcHRpb25zKTtcbiAgfVxuICByZXR1cm4gbmdab25lO1xufVxuXG5mdW5jdGlvbiBfY2FsbEFuZFJlcG9ydFRvRXJyb3JIYW5kbGVyKFxuICAgIGVycm9ySGFuZGxlcjogRXJyb3JIYW5kbGVyLCBuZ1pvbmU6IE5nWm9uZSwgY2FsbGJhY2s6ICgpID0+IGFueSk6IGFueSB7XG4gIHRyeSB7XG4gICAgY29uc3QgcmVzdWx0ID0gY2FsbGJhY2soKTtcbiAgICBpZiAoaXNQcm9taXNlKHJlc3VsdCkpIHtcbiAgICAgIHJldHVybiByZXN1bHQuY2F0Y2goKGU6IGFueSkgPT4ge1xuICAgICAgICBuZ1pvbmUucnVuT3V0c2lkZUFuZ3VsYXIoKCkgPT4gZXJyb3JIYW5kbGVyLmhhbmRsZUVycm9yKGUpKTtcbiAgICAgICAgLy8gcmV0aHJvdyBhcyB0aGUgZXhjZXB0aW9uIGhhbmRsZXIgbWlnaHQgbm90IGRvIGl0XG4gICAgICAgIHRocm93IGU7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9IGNhdGNoIChlKSB7XG4gICAgbmdab25lLnJ1bk91dHNpZGVBbmd1bGFyKCgpID0+IGVycm9ySGFuZGxlci5oYW5kbGVFcnJvcihlKSk7XG4gICAgLy8gcmV0aHJvdyBhcyB0aGUgZXhjZXB0aW9uIGhhbmRsZXIgbWlnaHQgbm90IGRvIGl0XG4gICAgdGhyb3cgZTtcbiAgfVxufVxuXG5mdW5jdGlvbiBvcHRpb25zUmVkdWNlcjxUIGV4dGVuZHMgT2JqZWN0Pihkc3Q6IGFueSwgb2JqczogVHxUW10pOiBUIHtcbiAgaWYgKEFycmF5LmlzQXJyYXkob2JqcykpIHtcbiAgICBkc3QgPSBvYmpzLnJlZHVjZShvcHRpb25zUmVkdWNlciwgZHN0KTtcbiAgfSBlbHNlIHtcbiAgICBkc3QgPSB7Li4uZHN0LCAuLi4ob2JqcyBhcyBhbnkpfTtcbiAgfVxuICByZXR1cm4gZHN0O1xufVxuXG4vKipcbiAqIEEgcmVmZXJlbmNlIHRvIGFuIEFuZ3VsYXIgYXBwbGljYXRpb24gcnVubmluZyBvbiBhIHBhZ2UuXG4gKlxuICogQHVzYWdlTm90ZXNcbiAqXG4gKiB7QGEgaXMtc3RhYmxlLWV4YW1wbGVzfVxuICogIyMjIGlzU3RhYmxlIGV4YW1wbGVzIGFuZCBjYXZlYXRzXG4gKlxuICogTm90ZSB0d28gaW1wb3J0YW50IHBvaW50cyBhYm91dCBgaXNTdGFibGVgLCBkZW1vbnN0cmF0ZWQgaW4gdGhlIGV4YW1wbGVzIGJlbG93OlxuICogLSB0aGUgYXBwbGljYXRpb24gd2lsbCBuZXZlciBiZSBzdGFibGUgaWYgeW91IHN0YXJ0IGFueSBraW5kXG4gKiBvZiByZWN1cnJlbnQgYXN5bmNocm9ub3VzIHRhc2sgd2hlbiB0aGUgYXBwbGljYXRpb24gc3RhcnRzXG4gKiAoZm9yIGV4YW1wbGUgZm9yIGEgcG9sbGluZyBwcm9jZXNzLCBzdGFydGVkIHdpdGggYSBgc2V0SW50ZXJ2YWxgLCBhIGBzZXRUaW1lb3V0YFxuICogb3IgdXNpbmcgUnhKUyBvcGVyYXRvcnMgbGlrZSBgaW50ZXJ2YWxgKTtcbiAqIC0gdGhlIGBpc1N0YWJsZWAgT2JzZXJ2YWJsZSBydW5zIG91dHNpZGUgb2YgdGhlIEFuZ3VsYXIgem9uZS5cbiAqXG4gKiBMZXQncyBpbWFnaW5lIHRoYXQgeW91IHN0YXJ0IGEgcmVjdXJyZW50IHRhc2tcbiAqIChoZXJlIGluY3JlbWVudGluZyBhIGNvdW50ZXIsIHVzaW5nIFJ4SlMgYGludGVydmFsYCksXG4gKiBhbmQgYXQgdGhlIHNhbWUgdGltZSBzdWJzY3JpYmUgdG8gYGlzU3RhYmxlYC5cbiAqXG4gKiBgYGBcbiAqIGNvbnN0cnVjdG9yKGFwcFJlZjogQXBwbGljYXRpb25SZWYpIHtcbiAqICAgYXBwUmVmLmlzU3RhYmxlLnBpcGUoXG4gKiAgICAgIGZpbHRlcihzdGFibGUgPT4gc3RhYmxlKVxuICogICApLnN1YnNjcmliZSgoKSA9PiBjb25zb2xlLmxvZygnQXBwIGlzIHN0YWJsZSBub3cnKTtcbiAqICAgaW50ZXJ2YWwoMTAwMCkuc3Vic2NyaWJlKGNvdW50ZXIgPT4gY29uc29sZS5sb2coY291bnRlcikpO1xuICogfVxuICogYGBgXG4gKiBJbiB0aGlzIGV4YW1wbGUsIGBpc1N0YWJsZWAgd2lsbCBuZXZlciBlbWl0IGB0cnVlYCxcbiAqIGFuZCB0aGUgdHJhY2UgXCJBcHAgaXMgc3RhYmxlIG5vd1wiIHdpbGwgbmV2ZXIgZ2V0IGxvZ2dlZC5cbiAqXG4gKiBJZiB5b3Ugd2FudCB0byBleGVjdXRlIHNvbWV0aGluZyB3aGVuIHRoZSBhcHAgaXMgc3RhYmxlLFxuICogeW91IGhhdmUgdG8gd2FpdCBmb3IgdGhlIGFwcGxpY2F0aW9uIHRvIGJlIHN0YWJsZVxuICogYmVmb3JlIHN0YXJ0aW5nIHlvdXIgcG9sbGluZyBwcm9jZXNzLlxuICpcbiAqIGBgYFxuICogY29uc3RydWN0b3IoYXBwUmVmOiBBcHBsaWNhdGlvblJlZikge1xuICogICBhcHBSZWYuaXNTdGFibGUucGlwZShcbiAqICAgICBmaXJzdChzdGFibGUgPT4gc3RhYmxlKSxcbiAqICAgICB0YXAoc3RhYmxlID0+IGNvbnNvbGUubG9nKCdBcHAgaXMgc3RhYmxlIG5vdycpKSxcbiAqICAgICBzd2l0Y2hNYXAoKCkgPT4gaW50ZXJ2YWwoMTAwMCkpXG4gKiAgICkuc3Vic2NyaWJlKGNvdW50ZXIgPT4gY29uc29sZS5sb2coY291bnRlcikpO1xuICogfVxuICogYGBgXG4gKiBJbiB0aGlzIGV4YW1wbGUsIHRoZSB0cmFjZSBcIkFwcCBpcyBzdGFibGUgbm93XCIgd2lsbCBiZSBsb2dnZWRcbiAqIGFuZCB0aGVuIHRoZSBjb3VudGVyIHN0YXJ0cyBpbmNyZW1lbnRpbmcgZXZlcnkgc2Vjb25kLlxuICpcbiAqIE5vdGUgYWxzbyB0aGF0IHRoaXMgT2JzZXJ2YWJsZSBydW5zIG91dHNpZGUgb2YgdGhlIEFuZ3VsYXIgem9uZSxcbiAqIHdoaWNoIG1lYW5zIHRoYXQgdGhlIGNvZGUgaW4gdGhlIHN1YnNjcmlwdGlvblxuICogdG8gdGhpcyBPYnNlcnZhYmxlIHdpbGwgbm90IHRyaWdnZXIgdGhlIGNoYW5nZSBkZXRlY3Rpb24uXG4gKlxuICogTGV0J3MgaW1hZ2luZSB0aGF0IGluc3RlYWQgb2YgbG9nZ2luZyB0aGUgY291bnRlciB2YWx1ZSxcbiAqIHlvdSB1cGRhdGUgYSBmaWVsZCBvZiB5b3VyIGNvbXBvbmVudFxuICogYW5kIGRpc3BsYXkgaXQgaW4gaXRzIHRlbXBsYXRlLlxuICpcbiAqIGBgYFxuICogY29uc3RydWN0b3IoYXBwUmVmOiBBcHBsaWNhdGlvblJlZikge1xuICogICBhcHBSZWYuaXNTdGFibGUucGlwZShcbiAqICAgICBmaXJzdChzdGFibGUgPT4gc3RhYmxlKSxcbiAqICAgICBzd2l0Y2hNYXAoKCkgPT4gaW50ZXJ2YWwoMTAwMCkpXG4gKiAgICkuc3Vic2NyaWJlKGNvdW50ZXIgPT4gdGhpcy52YWx1ZSA9IGNvdW50ZXIpO1xuICogfVxuICogYGBgXG4gKiBBcyB0aGUgYGlzU3RhYmxlYCBPYnNlcnZhYmxlIHJ1bnMgb3V0c2lkZSB0aGUgem9uZSxcbiAqIHRoZSBgdmFsdWVgIGZpZWxkIHdpbGwgYmUgdXBkYXRlZCBwcm9wZXJseSxcbiAqIGJ1dCB0aGUgdGVtcGxhdGUgd2lsbCBub3QgYmUgcmVmcmVzaGVkIVxuICpcbiAqIFlvdSdsbCBoYXZlIHRvIG1hbnVhbGx5IHRyaWdnZXIgdGhlIGNoYW5nZSBkZXRlY3Rpb24gdG8gdXBkYXRlIHRoZSB0ZW1wbGF0ZS5cbiAqXG4gKiBgYGBcbiAqIGNvbnN0cnVjdG9yKGFwcFJlZjogQXBwbGljYXRpb25SZWYsIGNkOiBDaGFuZ2VEZXRlY3RvclJlZikge1xuICogICBhcHBSZWYuaXNTdGFibGUucGlwZShcbiAqICAgICBmaXJzdChzdGFibGUgPT4gc3RhYmxlKSxcbiAqICAgICBzd2l0Y2hNYXAoKCkgPT4gaW50ZXJ2YWwoMTAwMCkpXG4gKiAgICkuc3Vic2NyaWJlKGNvdW50ZXIgPT4ge1xuICogICAgIHRoaXMudmFsdWUgPSBjb3VudGVyO1xuICogICAgIGNkLmRldGVjdENoYW5nZXMoKTtcbiAqICAgfSk7XG4gKiB9XG4gKiBgYGBcbiAqXG4gKiBPciBtYWtlIHRoZSBzdWJzY3JpcHRpb24gY2FsbGJhY2sgcnVuIGluc2lkZSB0aGUgem9uZS5cbiAqXG4gKiBgYGBcbiAqIGNvbnN0cnVjdG9yKGFwcFJlZjogQXBwbGljYXRpb25SZWYsIHpvbmU6IE5nWm9uZSkge1xuICogICBhcHBSZWYuaXNTdGFibGUucGlwZShcbiAqICAgICBmaXJzdChzdGFibGUgPT4gc3RhYmxlKSxcbiAqICAgICBzd2l0Y2hNYXAoKCkgPT4gaW50ZXJ2YWwoMTAwMCkpXG4gKiAgICkuc3Vic2NyaWJlKGNvdW50ZXIgPT4gem9uZS5ydW4oKCkgPT4gdGhpcy52YWx1ZSA9IGNvdW50ZXIpKTtcbiAqIH1cbiAqIGBgYFxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuQEluamVjdGFibGUoe3Byb3ZpZGVkSW46ICdyb290J30pXG5leHBvcnQgY2xhc3MgQXBwbGljYXRpb25SZWYge1xuICAvKiogQGludGVybmFsICovXG4gIHByaXZhdGUgX2Jvb3RzdHJhcExpc3RlbmVyczogKChjb21wUmVmOiBDb21wb25lbnRSZWY8YW55PikgPT4gdm9pZClbXSA9IFtdO1xuICBwcml2YXRlIF92aWV3czogSW50ZXJuYWxWaWV3UmVmW10gPSBbXTtcbiAgcHJpdmF0ZSBfcnVubmluZ1RpY2s6IGJvb2xlYW4gPSBmYWxzZTtcbiAgcHJpdmF0ZSBfc3RhYmxlID0gdHJ1ZTtcbiAgcHJpdmF0ZSBfb25NaWNyb3Rhc2tFbXB0eVN1YnNjcmlwdGlvbjogU3Vic2NyaXB0aW9uO1xuICBwcml2YXRlIF9kZXN0cm95ZWQgPSBmYWxzZTtcbiAgcHJpdmF0ZSBfZGVzdHJveUxpc3RlbmVyczogQXJyYXk8KCkgPT4gdm9pZD4gPSBbXTtcblxuICAvKipcbiAgICogSW5kaWNhdGVzIHdoZXRoZXIgdGhpcyBpbnN0YW5jZSB3YXMgZGVzdHJveWVkLlxuICAgKi9cbiAgZ2V0IGRlc3Ryb3llZCgpIHtcbiAgICByZXR1cm4gdGhpcy5fZGVzdHJveWVkO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBhIGxpc3Qgb2YgY29tcG9uZW50IHR5cGVzIHJlZ2lzdGVyZWQgdG8gdGhpcyBhcHBsaWNhdGlvbi5cbiAgICogVGhpcyBsaXN0IGlzIHBvcHVsYXRlZCBldmVuIGJlZm9yZSB0aGUgY29tcG9uZW50IGlzIGNyZWF0ZWQuXG4gICAqL1xuICBwdWJsaWMgcmVhZG9ubHkgY29tcG9uZW50VHlwZXM6IFR5cGU8YW55PltdID0gW107XG5cbiAgLyoqXG4gICAqIEdldCBhIGxpc3Qgb2YgY29tcG9uZW50cyByZWdpc3RlcmVkIHRvIHRoaXMgYXBwbGljYXRpb24uXG4gICAqL1xuICBwdWJsaWMgcmVhZG9ubHkgY29tcG9uZW50czogQ29tcG9uZW50UmVmPGFueT5bXSA9IFtdO1xuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGFuIE9ic2VydmFibGUgdGhhdCBpbmRpY2F0ZXMgd2hlbiB0aGUgYXBwbGljYXRpb24gaXMgc3RhYmxlIG9yIHVuc3RhYmxlLlxuICAgKlxuICAgKiBAc2VlICBbVXNhZ2Ugbm90ZXNdKCNpcy1zdGFibGUtZXhhbXBsZXMpIGZvciBleGFtcGxlcyBhbmQgY2F2ZWF0cyB3aGVuIHVzaW5nIHRoaXMgQVBJLlxuICAgKi9cbiAgLy8gVE9ETyhpc3N1ZS8yNDU3MSk6IHJlbW92ZSAnIScuXG4gIHB1YmxpYyByZWFkb25seSBpc1N0YWJsZSE6IE9ic2VydmFibGU8Ym9vbGVhbj47XG5cbiAgLyoqXG4gICAqIFRoZSBgRW52aXJvbm1lbnRJbmplY3RvcmAgdXNlZCB0byBjcmVhdGUgdGhpcyBhcHBsaWNhdGlvbi5cbiAgICovXG4gIGdldCBpbmplY3RvcigpOiBFbnZpcm9ubWVudEluamVjdG9yIHtcbiAgICByZXR1cm4gdGhpcy5faW5qZWN0b3I7XG4gIH1cblxuICAvKiogQGludGVybmFsICovXG4gIGNvbnN0cnVjdG9yKFxuICAgICAgcHJpdmF0ZSBfem9uZTogTmdab25lLFxuICAgICAgcHJpdmF0ZSBfaW5qZWN0b3I6IEVudmlyb25tZW50SW5qZWN0b3IsXG4gICAgICBwcml2YXRlIF9leGNlcHRpb25IYW5kbGVyOiBFcnJvckhhbmRsZXIsXG4gICkge1xuICAgIHRoaXMuX29uTWljcm90YXNrRW1wdHlTdWJzY3JpcHRpb24gPSB0aGlzLl96b25lLm9uTWljcm90YXNrRW1wdHkuc3Vic2NyaWJlKHtcbiAgICAgIG5leHQ6ICgpID0+IHtcbiAgICAgICAgdGhpcy5fem9uZS5ydW4oKCkgPT4ge1xuICAgICAgICAgIHRoaXMudGljaygpO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIGNvbnN0IGlzQ3VycmVudGx5U3RhYmxlID0gbmV3IE9ic2VydmFibGU8Ym9vbGVhbj4oKG9ic2VydmVyOiBPYnNlcnZlcjxib29sZWFuPikgPT4ge1xuICAgICAgdGhpcy5fc3RhYmxlID0gdGhpcy5fem9uZS5pc1N0YWJsZSAmJiAhdGhpcy5fem9uZS5oYXNQZW5kaW5nTWFjcm90YXNrcyAmJlxuICAgICAgICAgICF0aGlzLl96b25lLmhhc1BlbmRpbmdNaWNyb3Rhc2tzO1xuICAgICAgdGhpcy5fem9uZS5ydW5PdXRzaWRlQW5ndWxhcigoKSA9PiB7XG4gICAgICAgIG9ic2VydmVyLm5leHQodGhpcy5fc3RhYmxlKTtcbiAgICAgICAgb2JzZXJ2ZXIuY29tcGxldGUoKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgY29uc3QgaXNTdGFibGUgPSBuZXcgT2JzZXJ2YWJsZTxib29sZWFuPigob2JzZXJ2ZXI6IE9ic2VydmVyPGJvb2xlYW4+KSA9PiB7XG4gICAgICAvLyBDcmVhdGUgdGhlIHN1YnNjcmlwdGlvbiB0byBvblN0YWJsZSBvdXRzaWRlIHRoZSBBbmd1bGFyIFpvbmUgc28gdGhhdFxuICAgICAgLy8gdGhlIGNhbGxiYWNrIGlzIHJ1biBvdXRzaWRlIHRoZSBBbmd1bGFyIFpvbmUuXG4gICAgICBsZXQgc3RhYmxlU3ViOiBTdWJzY3JpcHRpb247XG4gICAgICB0aGlzLl96b25lLnJ1bk91dHNpZGVBbmd1bGFyKCgpID0+IHtcbiAgICAgICAgc3RhYmxlU3ViID0gdGhpcy5fem9uZS5vblN0YWJsZS5zdWJzY3JpYmUoKCkgPT4ge1xuICAgICAgICAgIE5nWm9uZS5hc3NlcnROb3RJbkFuZ3VsYXJab25lKCk7XG5cbiAgICAgICAgICAvLyBDaGVjayB3aGV0aGVyIHRoZXJlIGFyZSBubyBwZW5kaW5nIG1hY3JvL21pY3JvIHRhc2tzIGluIHRoZSBuZXh0IHRpY2tcbiAgICAgICAgICAvLyB0byBhbGxvdyBmb3IgTmdab25lIHRvIHVwZGF0ZSB0aGUgc3RhdGUuXG4gICAgICAgICAgc2NoZWR1bGVNaWNyb1Rhc2soKCkgPT4ge1xuICAgICAgICAgICAgaWYgKCF0aGlzLl9zdGFibGUgJiYgIXRoaXMuX3pvbmUuaGFzUGVuZGluZ01hY3JvdGFza3MgJiZcbiAgICAgICAgICAgICAgICAhdGhpcy5fem9uZS5oYXNQZW5kaW5nTWljcm90YXNrcykge1xuICAgICAgICAgICAgICB0aGlzLl9zdGFibGUgPSB0cnVlO1xuICAgICAgICAgICAgICBvYnNlcnZlci5uZXh0KHRydWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuXG4gICAgICBjb25zdCB1bnN0YWJsZVN1YjogU3Vic2NyaXB0aW9uID0gdGhpcy5fem9uZS5vblVuc3RhYmxlLnN1YnNjcmliZSgoKSA9PiB7XG4gICAgICAgIE5nWm9uZS5hc3NlcnRJbkFuZ3VsYXJab25lKCk7XG4gICAgICAgIGlmICh0aGlzLl9zdGFibGUpIHtcbiAgICAgICAgICB0aGlzLl9zdGFibGUgPSBmYWxzZTtcbiAgICAgICAgICB0aGlzLl96b25lLnJ1bk91dHNpZGVBbmd1bGFyKCgpID0+IHtcbiAgICAgICAgICAgIG9ic2VydmVyLm5leHQoZmFsc2UpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgcmV0dXJuICgpID0+IHtcbiAgICAgICAgc3RhYmxlU3ViLnVuc3Vic2NyaWJlKCk7XG4gICAgICAgIHVuc3RhYmxlU3ViLnVuc3Vic2NyaWJlKCk7XG4gICAgICB9O1xuICAgIH0pO1xuXG4gICAgKHRoaXMgYXMge2lzU3RhYmxlOiBPYnNlcnZhYmxlPGJvb2xlYW4+fSkuaXNTdGFibGUgPVxuICAgICAgICBtZXJnZShpc0N1cnJlbnRseVN0YWJsZSwgaXNTdGFibGUucGlwZShzaGFyZSgpKSk7XG4gIH1cblxuICAvKipcbiAgICogQm9vdHN0cmFwIGEgY29tcG9uZW50IG9udG8gdGhlIGVsZW1lbnQgaWRlbnRpZmllZCBieSBpdHMgc2VsZWN0b3Igb3IsIG9wdGlvbmFsbHksIHRvIGFcbiAgICogc3BlY2lmaWVkIGVsZW1lbnQuXG4gICAqXG4gICAqIEB1c2FnZU5vdGVzXG4gICAqICMjIyBCb290c3RyYXAgcHJvY2Vzc1xuICAgKlxuICAgKiBXaGVuIGJvb3RzdHJhcHBpbmcgYSBjb21wb25lbnQsIEFuZ3VsYXIgbW91bnRzIGl0IG9udG8gYSB0YXJnZXQgRE9NIGVsZW1lbnRcbiAgICogYW5kIGtpY2tzIG9mZiBhdXRvbWF0aWMgY2hhbmdlIGRldGVjdGlvbi4gVGhlIHRhcmdldCBET00gZWxlbWVudCBjYW4gYmVcbiAgICogcHJvdmlkZWQgdXNpbmcgdGhlIGByb290U2VsZWN0b3JPck5vZGVgIGFyZ3VtZW50LlxuICAgKlxuICAgKiBJZiB0aGUgdGFyZ2V0IERPTSBlbGVtZW50IGlzIG5vdCBwcm92aWRlZCwgQW5ndWxhciB0cmllcyB0byBmaW5kIG9uZSBvbiBhIHBhZ2VcbiAgICogdXNpbmcgdGhlIGBzZWxlY3RvcmAgb2YgdGhlIGNvbXBvbmVudCB0aGF0IGlzIGJlaW5nIGJvb3RzdHJhcHBlZFxuICAgKiAoZmlyc3QgbWF0Y2hlZCBlbGVtZW50IGlzIHVzZWQpLlxuICAgKlxuICAgKiAjIyMgRXhhbXBsZVxuICAgKlxuICAgKiBHZW5lcmFsbHksIHdlIGRlZmluZSB0aGUgY29tcG9uZW50IHRvIGJvb3RzdHJhcCBpbiB0aGUgYGJvb3RzdHJhcGAgYXJyYXkgb2YgYE5nTW9kdWxlYCxcbiAgICogYnV0IGl0IHJlcXVpcmVzIHVzIHRvIGtub3cgdGhlIGNvbXBvbmVudCB3aGlsZSB3cml0aW5nIHRoZSBhcHBsaWNhdGlvbiBjb2RlLlxuICAgKlxuICAgKiBJbWFnaW5lIGEgc2l0dWF0aW9uIHdoZXJlIHdlIGhhdmUgdG8gd2FpdCBmb3IgYW4gQVBJIGNhbGwgdG8gZGVjaWRlIGFib3V0IHRoZSBjb21wb25lbnQgdG9cbiAgICogYm9vdHN0cmFwLiBXZSBjYW4gdXNlIHRoZSBgbmdEb0Jvb3RzdHJhcGAgaG9vayBvZiB0aGUgYE5nTW9kdWxlYCBhbmQgY2FsbCB0aGlzIG1ldGhvZCB0b1xuICAgKiBkeW5hbWljYWxseSBib290c3RyYXAgYSBjb21wb25lbnQuXG4gICAqXG4gICAqIHtAZXhhbXBsZSBjb3JlL3RzL3BsYXRmb3JtL3BsYXRmb3JtLnRzIHJlZ2lvbj0nY29tcG9uZW50U2VsZWN0b3InfVxuICAgKlxuICAgKiBPcHRpb25hbGx5LCBhIGNvbXBvbmVudCBjYW4gYmUgbW91bnRlZCBvbnRvIGEgRE9NIGVsZW1lbnQgdGhhdCBkb2VzIG5vdCBtYXRjaCB0aGVcbiAgICogc2VsZWN0b3Igb2YgdGhlIGJvb3RzdHJhcHBlZCBjb21wb25lbnQuXG4gICAqXG4gICAqIEluIHRoZSBmb2xsb3dpbmcgZXhhbXBsZSwgd2UgYXJlIHByb3ZpZGluZyBhIENTUyBzZWxlY3RvciB0byBtYXRjaCB0aGUgdGFyZ2V0IGVsZW1lbnQuXG4gICAqXG4gICAqIHtAZXhhbXBsZSBjb3JlL3RzL3BsYXRmb3JtL3BsYXRmb3JtLnRzIHJlZ2lvbj0nY3NzU2VsZWN0b3InfVxuICAgKlxuICAgKiBXaGlsZSBpbiB0aGlzIGV4YW1wbGUsIHdlIGFyZSBwcm92aWRpbmcgcmVmZXJlbmNlIHRvIGEgRE9NIG5vZGUuXG4gICAqXG4gICAqIHtAZXhhbXBsZSBjb3JlL3RzL3BsYXRmb3JtL3BsYXRmb3JtLnRzIHJlZ2lvbj0nZG9tTm9kZSd9XG4gICAqL1xuICBib290c3RyYXA8Qz4oY29tcG9uZW50OiBUeXBlPEM+LCByb290U2VsZWN0b3JPck5vZGU/OiBzdHJpbmd8YW55KTogQ29tcG9uZW50UmVmPEM+O1xuXG4gIC8qKlxuICAgKiBCb290c3RyYXAgYSBjb21wb25lbnQgb250byB0aGUgZWxlbWVudCBpZGVudGlmaWVkIGJ5IGl0cyBzZWxlY3RvciBvciwgb3B0aW9uYWxseSwgdG8gYVxuICAgKiBzcGVjaWZpZWQgZWxlbWVudC5cbiAgICpcbiAgICogQHVzYWdlTm90ZXNcbiAgICogIyMjIEJvb3RzdHJhcCBwcm9jZXNzXG4gICAqXG4gICAqIFdoZW4gYm9vdHN0cmFwcGluZyBhIGNvbXBvbmVudCwgQW5ndWxhciBtb3VudHMgaXQgb250byBhIHRhcmdldCBET00gZWxlbWVudFxuICAgKiBhbmQga2lja3Mgb2ZmIGF1dG9tYXRpYyBjaGFuZ2UgZGV0ZWN0aW9uLiBUaGUgdGFyZ2V0IERPTSBlbGVtZW50IGNhbiBiZVxuICAgKiBwcm92aWRlZCB1c2luZyB0aGUgYHJvb3RTZWxlY3Rvck9yTm9kZWAgYXJndW1lbnQuXG4gICAqXG4gICAqIElmIHRoZSB0YXJnZXQgRE9NIGVsZW1lbnQgaXMgbm90IHByb3ZpZGVkLCBBbmd1bGFyIHRyaWVzIHRvIGZpbmQgb25lIG9uIGEgcGFnZVxuICAgKiB1c2luZyB0aGUgYHNlbGVjdG9yYCBvZiB0aGUgY29tcG9uZW50IHRoYXQgaXMgYmVpbmcgYm9vdHN0cmFwcGVkXG4gICAqIChmaXJzdCBtYXRjaGVkIGVsZW1lbnQgaXMgdXNlZCkuXG4gICAqXG4gICAqICMjIyBFeGFtcGxlXG4gICAqXG4gICAqIEdlbmVyYWxseSwgd2UgZGVmaW5lIHRoZSBjb21wb25lbnQgdG8gYm9vdHN0cmFwIGluIHRoZSBgYm9vdHN0cmFwYCBhcnJheSBvZiBgTmdNb2R1bGVgLFxuICAgKiBidXQgaXQgcmVxdWlyZXMgdXMgdG8ga25vdyB0aGUgY29tcG9uZW50IHdoaWxlIHdyaXRpbmcgdGhlIGFwcGxpY2F0aW9uIGNvZGUuXG4gICAqXG4gICAqIEltYWdpbmUgYSBzaXR1YXRpb24gd2hlcmUgd2UgaGF2ZSB0byB3YWl0IGZvciBhbiBBUEkgY2FsbCB0byBkZWNpZGUgYWJvdXQgdGhlIGNvbXBvbmVudCB0b1xuICAgKiBib290c3RyYXAuIFdlIGNhbiB1c2UgdGhlIGBuZ0RvQm9vdHN0cmFwYCBob29rIG9mIHRoZSBgTmdNb2R1bGVgIGFuZCBjYWxsIHRoaXMgbWV0aG9kIHRvXG4gICAqIGR5bmFtaWNhbGx5IGJvb3RzdHJhcCBhIGNvbXBvbmVudC5cbiAgICpcbiAgICoge0BleGFtcGxlIGNvcmUvdHMvcGxhdGZvcm0vcGxhdGZvcm0udHMgcmVnaW9uPSdjb21wb25lbnRTZWxlY3Rvcid9XG4gICAqXG4gICAqIE9wdGlvbmFsbHksIGEgY29tcG9uZW50IGNhbiBiZSBtb3VudGVkIG9udG8gYSBET00gZWxlbWVudCB0aGF0IGRvZXMgbm90IG1hdGNoIHRoZVxuICAgKiBzZWxlY3RvciBvZiB0aGUgYm9vdHN0cmFwcGVkIGNvbXBvbmVudC5cbiAgICpcbiAgICogSW4gdGhlIGZvbGxvd2luZyBleGFtcGxlLCB3ZSBhcmUgcHJvdmlkaW5nIGEgQ1NTIHNlbGVjdG9yIHRvIG1hdGNoIHRoZSB0YXJnZXQgZWxlbWVudC5cbiAgICpcbiAgICoge0BleGFtcGxlIGNvcmUvdHMvcGxhdGZvcm0vcGxhdGZvcm0udHMgcmVnaW9uPSdjc3NTZWxlY3Rvcid9XG4gICAqXG4gICAqIFdoaWxlIGluIHRoaXMgZXhhbXBsZSwgd2UgYXJlIHByb3ZpZGluZyByZWZlcmVuY2UgdG8gYSBET00gbm9kZS5cbiAgICpcbiAgICoge0BleGFtcGxlIGNvcmUvdHMvcGxhdGZvcm0vcGxhdGZvcm0udHMgcmVnaW9uPSdkb21Ob2RlJ31cbiAgICpcbiAgICogQGRlcHJlY2F0ZWQgUGFzc2luZyBDb21wb25lbnQgZmFjdG9yaWVzIGFzIHRoZSBgQXBwbGljYXRpb24uYm9vdHN0cmFwYCBmdW5jdGlvbiBhcmd1bWVudCBpc1xuICAgKiAgICAgZGVwcmVjYXRlZC4gUGFzcyBDb21wb25lbnQgVHlwZXMgaW5zdGVhZC5cbiAgICovXG4gIGJvb3RzdHJhcDxDPihjb21wb25lbnRGYWN0b3J5OiBDb21wb25lbnRGYWN0b3J5PEM+LCByb290U2VsZWN0b3JPck5vZGU/OiBzdHJpbmd8YW55KTpcbiAgICAgIENvbXBvbmVudFJlZjxDPjtcblxuICAvKipcbiAgICogQm9vdHN0cmFwIGEgY29tcG9uZW50IG9udG8gdGhlIGVsZW1lbnQgaWRlbnRpZmllZCBieSBpdHMgc2VsZWN0b3Igb3IsIG9wdGlvbmFsbHksIHRvIGFcbiAgICogc3BlY2lmaWVkIGVsZW1lbnQuXG4gICAqXG4gICAqIEB1c2FnZU5vdGVzXG4gICAqICMjIyBCb290c3RyYXAgcHJvY2Vzc1xuICAgKlxuICAgKiBXaGVuIGJvb3RzdHJhcHBpbmcgYSBjb21wb25lbnQsIEFuZ3VsYXIgbW91bnRzIGl0IG9udG8gYSB0YXJnZXQgRE9NIGVsZW1lbnRcbiAgICogYW5kIGtpY2tzIG9mZiBhdXRvbWF0aWMgY2hhbmdlIGRldGVjdGlvbi4gVGhlIHRhcmdldCBET00gZWxlbWVudCBjYW4gYmVcbiAgICogcHJvdmlkZWQgdXNpbmcgdGhlIGByb290U2VsZWN0b3JPck5vZGVgIGFyZ3VtZW50LlxuICAgKlxuICAgKiBJZiB0aGUgdGFyZ2V0IERPTSBlbGVtZW50IGlzIG5vdCBwcm92aWRlZCwgQW5ndWxhciB0cmllcyB0byBmaW5kIG9uZSBvbiBhIHBhZ2VcbiAgICogdXNpbmcgdGhlIGBzZWxlY3RvcmAgb2YgdGhlIGNvbXBvbmVudCB0aGF0IGlzIGJlaW5nIGJvb3RzdHJhcHBlZFxuICAgKiAoZmlyc3QgbWF0Y2hlZCBlbGVtZW50IGlzIHVzZWQpLlxuICAgKlxuICAgKiAjIyMgRXhhbXBsZVxuICAgKlxuICAgKiBHZW5lcmFsbHksIHdlIGRlZmluZSB0aGUgY29tcG9uZW50IHRvIGJvb3RzdHJhcCBpbiB0aGUgYGJvb3RzdHJhcGAgYXJyYXkgb2YgYE5nTW9kdWxlYCxcbiAgICogYnV0IGl0IHJlcXVpcmVzIHVzIHRvIGtub3cgdGhlIGNvbXBvbmVudCB3aGlsZSB3cml0aW5nIHRoZSBhcHBsaWNhdGlvbiBjb2RlLlxuICAgKlxuICAgKiBJbWFnaW5lIGEgc2l0dWF0aW9uIHdoZXJlIHdlIGhhdmUgdG8gd2FpdCBmb3IgYW4gQVBJIGNhbGwgdG8gZGVjaWRlIGFib3V0IHRoZSBjb21wb25lbnQgdG9cbiAgICogYm9vdHN0cmFwLiBXZSBjYW4gdXNlIHRoZSBgbmdEb0Jvb3RzdHJhcGAgaG9vayBvZiB0aGUgYE5nTW9kdWxlYCBhbmQgY2FsbCB0aGlzIG1ldGhvZCB0b1xuICAgKiBkeW5hbWljYWxseSBib290c3RyYXAgYSBjb21wb25lbnQuXG4gICAqXG4gICAqIHtAZXhhbXBsZSBjb3JlL3RzL3BsYXRmb3JtL3BsYXRmb3JtLnRzIHJlZ2lvbj0nY29tcG9uZW50U2VsZWN0b3InfVxuICAgKlxuICAgKiBPcHRpb25hbGx5LCBhIGNvbXBvbmVudCBjYW4gYmUgbW91bnRlZCBvbnRvIGEgRE9NIGVsZW1lbnQgdGhhdCBkb2VzIG5vdCBtYXRjaCB0aGVcbiAgICogc2VsZWN0b3Igb2YgdGhlIGJvb3RzdHJhcHBlZCBjb21wb25lbnQuXG4gICAqXG4gICAqIEluIHRoZSBmb2xsb3dpbmcgZXhhbXBsZSwgd2UgYXJlIHByb3ZpZGluZyBhIENTUyBzZWxlY3RvciB0byBtYXRjaCB0aGUgdGFyZ2V0IGVsZW1lbnQuXG4gICAqXG4gICAqIHtAZXhhbXBsZSBjb3JlL3RzL3BsYXRmb3JtL3BsYXRmb3JtLnRzIHJlZ2lvbj0nY3NzU2VsZWN0b3InfVxuICAgKlxuICAgKiBXaGlsZSBpbiB0aGlzIGV4YW1wbGUsIHdlIGFyZSBwcm92aWRpbmcgcmVmZXJlbmNlIHRvIGEgRE9NIG5vZGUuXG4gICAqXG4gICAqIHtAZXhhbXBsZSBjb3JlL3RzL3BsYXRmb3JtL3BsYXRmb3JtLnRzIHJlZ2lvbj0nZG9tTm9kZSd9XG4gICAqL1xuICBib290c3RyYXA8Qz4oY29tcG9uZW50T3JGYWN0b3J5OiBDb21wb25lbnRGYWN0b3J5PEM+fFR5cGU8Qz4sIHJvb3RTZWxlY3Rvck9yTm9kZT86IHN0cmluZ3xhbnkpOlxuICAgICAgQ29tcG9uZW50UmVmPEM+IHtcbiAgICBOR19ERVZfTU9ERSAmJiB0aGlzLndhcm5JZkRlc3Ryb3llZCgpO1xuICAgIGNvbnN0IGlzQ29tcG9uZW50RmFjdG9yeSA9IGNvbXBvbmVudE9yRmFjdG9yeSBpbnN0YW5jZW9mIENvbXBvbmVudEZhY3Rvcnk7XG4gICAgY29uc3QgaW5pdFN0YXR1cyA9IHRoaXMuX2luamVjdG9yLmdldChBcHBsaWNhdGlvbkluaXRTdGF0dXMpO1xuXG4gICAgaWYgKCFpbml0U3RhdHVzLmRvbmUpIHtcbiAgICAgIGNvbnN0IHN0YW5kYWxvbmUgPSAhaXNDb21wb25lbnRGYWN0b3J5ICYmIGlzU3RhbmRhbG9uZShjb21wb25lbnRPckZhY3RvcnkpO1xuICAgICAgY29uc3QgZXJyb3JNZXNzYWdlID1cbiAgICAgICAgICAnQ2Fubm90IGJvb3RzdHJhcCBhcyB0aGVyZSBhcmUgc3RpbGwgYXN5bmNocm9ub3VzIGluaXRpYWxpemVycyBydW5uaW5nLicgK1xuICAgICAgICAgIChzdGFuZGFsb25lID8gJycgOlxuICAgICAgICAgICAgICAgICAgICAgICAgJyBCb290c3RyYXAgY29tcG9uZW50cyBpbiB0aGUgYG5nRG9Cb290c3RyYXBgIG1ldGhvZCBvZiB0aGUgcm9vdCBtb2R1bGUuJyk7XG4gICAgICB0aHJvdyBuZXcgUnVudGltZUVycm9yKFxuICAgICAgICAgIFJ1bnRpbWVFcnJvckNvZGUuQVNZTkNfSU5JVElBTElaRVJTX1NUSUxMX1JVTk5JTkcsIE5HX0RFVl9NT0RFICYmIGVycm9yTWVzc2FnZSk7XG4gICAgfVxuXG4gICAgbGV0IGNvbXBvbmVudEZhY3Rvcnk6IENvbXBvbmVudEZhY3Rvcnk8Qz47XG4gICAgaWYgKGlzQ29tcG9uZW50RmFjdG9yeSkge1xuICAgICAgY29tcG9uZW50RmFjdG9yeSA9IGNvbXBvbmVudE9yRmFjdG9yeTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgcmVzb2x2ZXIgPSB0aGlzLl9pbmplY3Rvci5nZXQoQ29tcG9uZW50RmFjdG9yeVJlc29sdmVyKTtcbiAgICAgIGNvbXBvbmVudEZhY3RvcnkgPSByZXNvbHZlci5yZXNvbHZlQ29tcG9uZW50RmFjdG9yeShjb21wb25lbnRPckZhY3RvcnkpITtcbiAgICB9XG4gICAgdGhpcy5jb21wb25lbnRUeXBlcy5wdXNoKGNvbXBvbmVudEZhY3RvcnkuY29tcG9uZW50VHlwZSk7XG5cbiAgICAvLyBDcmVhdGUgYSBmYWN0b3J5IGFzc29jaWF0ZWQgd2l0aCB0aGUgY3VycmVudCBtb2R1bGUgaWYgaXQncyBub3QgYm91bmQgdG8gc29tZSBvdGhlclxuICAgIGNvbnN0IG5nTW9kdWxlID1cbiAgICAgICAgaXNCb3VuZFRvTW9kdWxlKGNvbXBvbmVudEZhY3RvcnkpID8gdW5kZWZpbmVkIDogdGhpcy5faW5qZWN0b3IuZ2V0KE5nTW9kdWxlUmVmKTtcbiAgICBjb25zdCBzZWxlY3Rvck9yTm9kZSA9IHJvb3RTZWxlY3Rvck9yTm9kZSB8fCBjb21wb25lbnRGYWN0b3J5LnNlbGVjdG9yO1xuICAgIGNvbnN0IGNvbXBSZWYgPSBjb21wb25lbnRGYWN0b3J5LmNyZWF0ZShJbmplY3Rvci5OVUxMLCBbXSwgc2VsZWN0b3JPck5vZGUsIG5nTW9kdWxlKTtcbiAgICBjb25zdCBuYXRpdmVFbGVtZW50ID0gY29tcFJlZi5sb2NhdGlvbi5uYXRpdmVFbGVtZW50O1xuICAgIGNvbnN0IHRlc3RhYmlsaXR5ID0gY29tcFJlZi5pbmplY3Rvci5nZXQoVEVTVEFCSUxJVFksIG51bGwpO1xuICAgIHRlc3RhYmlsaXR5Py5yZWdpc3RlckFwcGxpY2F0aW9uKG5hdGl2ZUVsZW1lbnQpO1xuXG4gICAgY29tcFJlZi5vbkRlc3Ryb3koKCkgPT4ge1xuICAgICAgdGhpcy5kZXRhY2hWaWV3KGNvbXBSZWYuaG9zdFZpZXcpO1xuICAgICAgcmVtb3ZlKHRoaXMuY29tcG9uZW50cywgY29tcFJlZik7XG4gICAgICB0ZXN0YWJpbGl0eT8udW5yZWdpc3RlckFwcGxpY2F0aW9uKG5hdGl2ZUVsZW1lbnQpO1xuICAgIH0pO1xuXG4gICAgdGhpcy5fbG9hZENvbXBvbmVudChjb21wUmVmKTtcbiAgICBpZiAodHlwZW9mIG5nRGV2TW9kZSA9PT0gJ3VuZGVmaW5lZCcgfHwgbmdEZXZNb2RlKSB7XG4gICAgICBjb25zdCBfY29uc29sZSA9IHRoaXMuX2luamVjdG9yLmdldChDb25zb2xlKTtcbiAgICAgIF9jb25zb2xlLmxvZyhcbiAgICAgICAgICBgQW5ndWxhciBpcyBydW5uaW5nIGluIGRldmVsb3BtZW50IG1vZGUuIENhbGwgZW5hYmxlUHJvZE1vZGUoKSB0byBlbmFibGUgcHJvZHVjdGlvbiBtb2RlLmApO1xuICAgIH1cbiAgICByZXR1cm4gY29tcFJlZjtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbnZva2UgdGhpcyBtZXRob2QgdG8gZXhwbGljaXRseSBwcm9jZXNzIGNoYW5nZSBkZXRlY3Rpb24gYW5kIGl0cyBzaWRlLWVmZmVjdHMuXG4gICAqXG4gICAqIEluIGRldmVsb3BtZW50IG1vZGUsIGB0aWNrKClgIGFsc28gcGVyZm9ybXMgYSBzZWNvbmQgY2hhbmdlIGRldGVjdGlvbiBjeWNsZSB0byBlbnN1cmUgdGhhdCBub1xuICAgKiBmdXJ0aGVyIGNoYW5nZXMgYXJlIGRldGVjdGVkLiBJZiBhZGRpdGlvbmFsIGNoYW5nZXMgYXJlIHBpY2tlZCB1cCBkdXJpbmcgdGhpcyBzZWNvbmQgY3ljbGUsXG4gICAqIGJpbmRpbmdzIGluIHRoZSBhcHAgaGF2ZSBzaWRlLWVmZmVjdHMgdGhhdCBjYW5ub3QgYmUgcmVzb2x2ZWQgaW4gYSBzaW5nbGUgY2hhbmdlIGRldGVjdGlvblxuICAgKiBwYXNzLlxuICAgKiBJbiB0aGlzIGNhc2UsIEFuZ3VsYXIgdGhyb3dzIGFuIGVycm9yLCBzaW5jZSBhbiBBbmd1bGFyIGFwcGxpY2F0aW9uIGNhbiBvbmx5IGhhdmUgb25lIGNoYW5nZVxuICAgKiBkZXRlY3Rpb24gcGFzcyBkdXJpbmcgd2hpY2ggYWxsIGNoYW5nZSBkZXRlY3Rpb24gbXVzdCBjb21wbGV0ZS5cbiAgICovXG4gIHRpY2soKTogdm9pZCB7XG4gICAgTkdfREVWX01PREUgJiYgdGhpcy53YXJuSWZEZXN0cm95ZWQoKTtcbiAgICBpZiAodGhpcy5fcnVubmluZ1RpY2spIHtcbiAgICAgIHRocm93IG5ldyBSdW50aW1lRXJyb3IoXG4gICAgICAgICAgUnVudGltZUVycm9yQ29kZS5SRUNVUlNJVkVfQVBQTElDQVRJT05fUkVGX1RJQ0ssXG4gICAgICAgICAgbmdEZXZNb2RlICYmICdBcHBsaWNhdGlvblJlZi50aWNrIGlzIGNhbGxlZCByZWN1cnNpdmVseScpO1xuICAgIH1cblxuICAgIHRyeSB7XG4gICAgICB0aGlzLl9ydW5uaW5nVGljayA9IHRydWU7XG4gICAgICBmb3IgKGxldCB2aWV3IG9mIHRoaXMuX3ZpZXdzKSB7XG4gICAgICAgIHZpZXcuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgfVxuICAgICAgaWYgKHR5cGVvZiBuZ0Rldk1vZGUgPT09ICd1bmRlZmluZWQnIHx8IG5nRGV2TW9kZSkge1xuICAgICAgICBmb3IgKGxldCB2aWV3IG9mIHRoaXMuX3ZpZXdzKSB7XG4gICAgICAgICAgdmlldy5jaGVja05vQ2hhbmdlcygpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgLy8gQXR0ZW50aW9uOiBEb24ndCByZXRocm93IGFzIGl0IGNvdWxkIGNhbmNlbCBzdWJzY3JpcHRpb25zIHRvIE9ic2VydmFibGVzIVxuICAgICAgdGhpcy5fem9uZS5ydW5PdXRzaWRlQW5ndWxhcigoKSA9PiB0aGlzLl9leGNlcHRpb25IYW5kbGVyLmhhbmRsZUVycm9yKGUpKTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgdGhpcy5fcnVubmluZ1RpY2sgPSBmYWxzZTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQXR0YWNoZXMgYSB2aWV3IHNvIHRoYXQgaXQgd2lsbCBiZSBkaXJ0eSBjaGVja2VkLlxuICAgKiBUaGUgdmlldyB3aWxsIGJlIGF1dG9tYXRpY2FsbHkgZGV0YWNoZWQgd2hlbiBpdCBpcyBkZXN0cm95ZWQuXG4gICAqIFRoaXMgd2lsbCB0aHJvdyBpZiB0aGUgdmlldyBpcyBhbHJlYWR5IGF0dGFjaGVkIHRvIGEgVmlld0NvbnRhaW5lci5cbiAgICovXG4gIGF0dGFjaFZpZXcodmlld1JlZjogVmlld1JlZik6IHZvaWQge1xuICAgIE5HX0RFVl9NT0RFICYmIHRoaXMud2FybklmRGVzdHJveWVkKCk7XG4gICAgY29uc3QgdmlldyA9ICh2aWV3UmVmIGFzIEludGVybmFsVmlld1JlZik7XG4gICAgdGhpcy5fdmlld3MucHVzaCh2aWV3KTtcbiAgICB2aWV3LmF0dGFjaFRvQXBwUmVmKHRoaXMpO1xuICB9XG5cbiAgLyoqXG4gICAqIERldGFjaGVzIGEgdmlldyBmcm9tIGRpcnR5IGNoZWNraW5nIGFnYWluLlxuICAgKi9cbiAgZGV0YWNoVmlldyh2aWV3UmVmOiBWaWV3UmVmKTogdm9pZCB7XG4gICAgTkdfREVWX01PREUgJiYgdGhpcy53YXJuSWZEZXN0cm95ZWQoKTtcbiAgICBjb25zdCB2aWV3ID0gKHZpZXdSZWYgYXMgSW50ZXJuYWxWaWV3UmVmKTtcbiAgICByZW1vdmUodGhpcy5fdmlld3MsIHZpZXcpO1xuICAgIHZpZXcuZGV0YWNoRnJvbUFwcFJlZigpO1xuICB9XG5cbiAgcHJpdmF0ZSBfbG9hZENvbXBvbmVudChjb21wb25lbnRSZWY6IENvbXBvbmVudFJlZjxhbnk+KTogdm9pZCB7XG4gICAgdGhpcy5hdHRhY2hWaWV3KGNvbXBvbmVudFJlZi5ob3N0Vmlldyk7XG4gICAgdGhpcy50aWNrKCk7XG4gICAgdGhpcy5jb21wb25lbnRzLnB1c2goY29tcG9uZW50UmVmKTtcbiAgICAvLyBHZXQgdGhlIGxpc3RlbmVycyBsYXppbHkgdG8gcHJldmVudCBESSBjeWNsZXMuXG4gICAgY29uc3QgbGlzdGVuZXJzID0gdGhpcy5faW5qZWN0b3IuZ2V0KEFQUF9CT09UU1RSQVBfTElTVEVORVIsIFtdKTtcbiAgICBpZiAobmdEZXZNb2RlICYmICFBcnJheS5pc0FycmF5KGxpc3RlbmVycykpIHtcbiAgICAgIHRocm93IG5ldyBSdW50aW1lRXJyb3IoXG4gICAgICAgICAgUnVudGltZUVycm9yQ29kZS5JTlZBTElEX01VTFRJX1BST1ZJREVSLFxuICAgICAgICAgICdVbmV4cGVjdGVkIHR5cGUgb2YgdGhlIGBBUFBfQk9PVFNUUkFQX0xJU1RFTkVSYCB0b2tlbiB2YWx1ZSAnICtcbiAgICAgICAgICAgICAgYChleHBlY3RlZCBhbiBhcnJheSwgYnV0IGdvdCAke3R5cGVvZiBsaXN0ZW5lcnN9KS4gYCArXG4gICAgICAgICAgICAgICdQbGVhc2UgY2hlY2sgdGhhdCB0aGUgYEFQUF9CT09UU1RSQVBfTElTVEVORVJgIHRva2VuIGlzIGNvbmZpZ3VyZWQgYXMgYSAnICtcbiAgICAgICAgICAgICAgJ2BtdWx0aTogdHJ1ZWAgcHJvdmlkZXIuJyk7XG4gICAgfVxuICAgIGxpc3RlbmVycy5wdXNoKC4uLnRoaXMuX2Jvb3RzdHJhcExpc3RlbmVycyk7XG4gICAgbGlzdGVuZXJzLmZvckVhY2goKGxpc3RlbmVyKSA9PiBsaXN0ZW5lcihjb21wb25lbnRSZWYpKTtcbiAgfVxuXG4gIC8qKiBAaW50ZXJuYWwgKi9cbiAgbmdPbkRlc3Ryb3koKSB7XG4gICAgaWYgKHRoaXMuX2Rlc3Ryb3llZCkgcmV0dXJuO1xuXG4gICAgdHJ5IHtcbiAgICAgIC8vIENhbGwgYWxsIHRoZSBsaWZlY3ljbGUgaG9va3MuXG4gICAgICB0aGlzLl9kZXN0cm95TGlzdGVuZXJzLmZvckVhY2gobGlzdGVuZXIgPT4gbGlzdGVuZXIoKSk7XG5cbiAgICAgIC8vIERlc3Ryb3kgYWxsIHJlZ2lzdGVyZWQgdmlld3MuXG4gICAgICB0aGlzLl92aWV3cy5zbGljZSgpLmZvckVhY2goKHZpZXcpID0+IHZpZXcuZGVzdHJveSgpKTtcbiAgICAgIHRoaXMuX29uTWljcm90YXNrRW1wdHlTdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgLy8gSW5kaWNhdGUgdGhhdCB0aGlzIGluc3RhbmNlIGlzIGRlc3Ryb3llZC5cbiAgICAgIHRoaXMuX2Rlc3Ryb3llZCA9IHRydWU7XG5cbiAgICAgIC8vIFJlbGVhc2UgYWxsIHJlZmVyZW5jZXMuXG4gICAgICB0aGlzLl92aWV3cyA9IFtdO1xuICAgICAgdGhpcy5fYm9vdHN0cmFwTGlzdGVuZXJzID0gW107XG4gICAgICB0aGlzLl9kZXN0cm95TGlzdGVuZXJzID0gW107XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFJlZ2lzdGVycyBhIGxpc3RlbmVyIHRvIGJlIGNhbGxlZCB3aGVuIGFuIGluc3RhbmNlIGlzIGRlc3Ryb3llZC5cbiAgICpcbiAgICogQHBhcmFtIGNhbGxiYWNrIEEgY2FsbGJhY2sgZnVuY3Rpb24gdG8gYWRkIGFzIGEgbGlzdGVuZXIuXG4gICAqIEByZXR1cm5zIEEgZnVuY3Rpb24gd2hpY2ggdW5yZWdpc3RlcnMgYSBsaXN0ZW5lci5cbiAgICpcbiAgICogQGludGVybmFsXG4gICAqL1xuICBvbkRlc3Ryb3koY2FsbGJhY2s6ICgpID0+IHZvaWQpOiBWb2lkRnVuY3Rpb24ge1xuICAgIE5HX0RFVl9NT0RFICYmIHRoaXMud2FybklmRGVzdHJveWVkKCk7XG4gICAgdGhpcy5fZGVzdHJveUxpc3RlbmVycy5wdXNoKGNhbGxiYWNrKTtcbiAgICByZXR1cm4gKCkgPT4gcmVtb3ZlKHRoaXMuX2Rlc3Ryb3lMaXN0ZW5lcnMsIGNhbGxiYWNrKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZXN0cm95cyBhbiBBbmd1bGFyIGFwcGxpY2F0aW9uIHJlcHJlc2VudGVkIGJ5IHRoaXMgYEFwcGxpY2F0aW9uUmVmYC4gQ2FsbGluZyB0aGlzIGZ1bmN0aW9uXG4gICAqIHdpbGwgZGVzdHJveSB0aGUgYXNzb2NpYXRlZCBlbnZpcm9ubWVudCBpbmplY3RvcnMgYXMgd2VsbCBhcyBhbGwgdGhlIGJvb3RzdHJhcHBlZCBjb21wb25lbnRzXG4gICAqIHdpdGggdGhlaXIgdmlld3MuXG4gICAqL1xuICBkZXN0cm95KCk6IHZvaWQge1xuICAgIGlmICh0aGlzLl9kZXN0cm95ZWQpIHtcbiAgICAgIHRocm93IG5ldyBSdW50aW1lRXJyb3IoXG4gICAgICAgICAgUnVudGltZUVycm9yQ29kZS5BUFBMSUNBVElPTl9SRUZfQUxSRUFEWV9ERVNUUk9ZRUQsXG4gICAgICAgICAgbmdEZXZNb2RlICYmICdUaGlzIGluc3RhbmNlIG9mIHRoZSBgQXBwbGljYXRpb25SZWZgIGhhcyBhbHJlYWR5IGJlZW4gZGVzdHJveWVkLicpO1xuICAgIH1cblxuICAgIC8vIFRoaXMgaXMgYSB0ZW1wb3JhcnkgdHlwZSB0byByZXByZXNlbnQgYW4gaW5zdGFuY2Ugb2YgYW4gUjNJbmplY3Rvciwgd2hpY2ggY2FuIGJlIGRlc3Ryb3llZC5cbiAgICAvLyBUaGUgdHlwZSB3aWxsIGJlIHJlcGxhY2VkIHdpdGggYSBkaWZmZXJlbnQgb25lIG9uY2UgZGVzdHJveWFibGUgaW5qZWN0b3IgdHlwZSBpcyBhdmFpbGFibGUuXG4gICAgdHlwZSBEZXN0cm95YWJsZUluamVjdG9yID0gSW5qZWN0b3Ime2Rlc3Ryb3k/OiBGdW5jdGlvbiwgZGVzdHJveWVkPzogYm9vbGVhbn07XG5cbiAgICBjb25zdCBpbmplY3RvciA9IHRoaXMuX2luamVjdG9yIGFzIERlc3Ryb3lhYmxlSW5qZWN0b3I7XG5cbiAgICAvLyBDaGVjayB0aGF0IHRoaXMgaW5qZWN0b3IgaW5zdGFuY2Ugc3VwcG9ydHMgZGVzdHJveSBvcGVyYXRpb24uXG4gICAgaWYgKGluamVjdG9yLmRlc3Ryb3kgJiYgIWluamVjdG9yLmRlc3Ryb3llZCkge1xuICAgICAgLy8gRGVzdHJveWluZyBhbiB1bmRlcmx5aW5nIGluamVjdG9yIHdpbGwgdHJpZ2dlciB0aGUgYG5nT25EZXN0cm95YCBsaWZlY3ljbGVcbiAgICAgIC8vIGhvb2ssIHdoaWNoIGludm9rZXMgdGhlIHJlbWFpbmluZyBjbGVhbnVwIGFjdGlvbnMuXG4gICAgICBpbmplY3Rvci5kZXN0cm95KCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIG51bWJlciBvZiBhdHRhY2hlZCB2aWV3cy5cbiAgICovXG4gIGdldCB2aWV3Q291bnQoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3ZpZXdzLmxlbmd0aDtcbiAgfVxuXG4gIHByaXZhdGUgd2FybklmRGVzdHJveWVkKCkge1xuICAgIGlmIChOR19ERVZfTU9ERSAmJiB0aGlzLl9kZXN0cm95ZWQpIHtcbiAgICAgIGNvbnNvbGUud2Fybihmb3JtYXRSdW50aW1lRXJyb3IoXG4gICAgICAgICAgUnVudGltZUVycm9yQ29kZS5BUFBMSUNBVElPTl9SRUZfQUxSRUFEWV9ERVNUUk9ZRUQsXG4gICAgICAgICAgJ1RoaXMgaW5zdGFuY2Ugb2YgdGhlIGBBcHBsaWNhdGlvblJlZmAgaGFzIGFscmVhZHkgYmVlbiBkZXN0cm95ZWQuJykpO1xuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiByZW1vdmU8VD4obGlzdDogVFtdLCBlbDogVCk6IHZvaWQge1xuICBjb25zdCBpbmRleCA9IGxpc3QuaW5kZXhPZihlbCk7XG4gIGlmIChpbmRleCA+IC0xKSB7XG4gICAgbGlzdC5zcGxpY2UoaW5kZXgsIDEpO1xuICB9XG59XG5cbmZ1bmN0aW9uIF9sYXN0RGVmaW5lZDxUPihhcmdzOiBUW10pOiBUfHVuZGVmaW5lZCB7XG4gIGZvciAobGV0IGkgPSBhcmdzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgaWYgKGFyZ3NbaV0gIT09IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuIGFyZ3NbaV07XG4gICAgfVxuICB9XG4gIHJldHVybiB1bmRlZmluZWQ7XG59XG5cbmZ1bmN0aW9uIF9tZXJnZUFycmF5cyhwYXJ0czogYW55W11bXSk6IGFueVtdIHtcbiAgY29uc3QgcmVzdWx0OiBhbnlbXSA9IFtdO1xuICBwYXJ0cy5mb3JFYWNoKChwYXJ0KSA9PiBwYXJ0ICYmIHJlc3VsdC5wdXNoKC4uLnBhcnQpKTtcbiAgcmV0dXJuIHJlc3VsdDtcbn1cbiJdfQ==