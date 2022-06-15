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
import * as i4 from "./application_init";
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
const PLATFORM_ON_DESTROY = new InjectionToken('PlatformOnDestroy');
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
                appRef.onDestroy(() => onErrorSubscription.unsubscribe());
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
            { provide: PLATFORM_ON_DESTROY, useValue: () => _platformInjector = null },
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
        const destroyListener = this._injector.get(PLATFORM_ON_DESTROY, null);
        destroyListener?.();
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
    constructor(_zone, _injector, _exceptionHandler, _initStatus) {
        this._zone = _zone;
        this._injector = _injector;
        this._exceptionHandler = _exceptionHandler;
        this._initStatus = _initStatus;
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
        if (!this._initStatus.done) {
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
     * will destroy the associated environnement injectors as well as all the bootstrapped components
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
ApplicationRef.ɵfac = function ApplicationRef_Factory(t) { return new (t || ApplicationRef)(i0.ɵɵinject(i2.NgZone), i0.ɵɵinject(i1.Injector), i0.ɵɵinject(i3.ErrorHandler), i0.ɵɵinject(i4.ApplicationInitStatus)); };
ApplicationRef.ɵprov = /*@__PURE__*/ i0.ɵɵdefineInjectable({ token: ApplicationRef, factory: ApplicationRef.ɵfac, providedIn: 'root' });
(function () { (typeof ngDevMode === "undefined" || ngDevMode) && i0.setClassMetadata(ApplicationRef, [{
        type: Injectable,
        args: [{ providedIn: 'root' }]
    }], function () { return [{ type: i2.NgZone }, { type: i1.Injector }, { type: i3.ErrorHandler }, { type: i4.ApplicationInitStatus }]; }, null); })();
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwbGljYXRpb25fcmVmLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvYXBwbGljYXRpb25fcmVmLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sb0JBQW9CLENBQUM7QUFFNUIsT0FBTyxFQUFDLEtBQUssRUFBRSxVQUFVLEVBQXlCLE1BQU0sTUFBTSxDQUFDO0FBQy9ELE9BQU8sRUFBQyxLQUFLLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUVyQyxPQUFPLEVBQUMscUJBQXFCLEVBQUMsTUFBTSxvQkFBb0IsQ0FBQztBQUN6RCxPQUFPLEVBQUMsc0JBQXNCLEVBQUUsb0JBQW9CLEVBQUMsTUFBTSxzQkFBc0IsQ0FBQztBQUNsRixPQUFPLEVBQUMsaUJBQWlCLEVBQW1CLE1BQU0sNEJBQTRCLENBQUM7QUFDL0UsT0FBTyxFQUFDLE9BQU8sRUFBQyxNQUFNLFdBQVcsQ0FBQztBQUNsQyxPQUFPLEVBQUMsVUFBVSxFQUFDLE1BQU0saUJBQWlCLENBQUM7QUFDM0MsT0FBTyxFQUFDLGNBQWMsRUFBQyxNQUFNLHNCQUFzQixDQUFDO0FBQ3BELE9BQU8sRUFBQyxRQUFRLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFHdkMsT0FBTyxFQUFDLGNBQWMsRUFBQyxNQUFNLFlBQVksQ0FBQztBQUMxQyxPQUFPLEVBQUMsWUFBWSxFQUFDLE1BQU0saUJBQWlCLENBQUM7QUFDN0MsT0FBTyxFQUFDLGtCQUFrQixFQUFFLFlBQVksRUFBbUIsTUFBTSxVQUFVLENBQUM7QUFDNUUsT0FBTyxFQUFDLGlCQUFpQixFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFDdEQsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUV4QyxPQUFPLEVBQUMsZ0JBQWdCLEVBQWtCLE1BQU0sbUJBQW1CLENBQUM7QUFDcEUsT0FBTyxFQUFDLGdCQUFnQixFQUFlLE1BQU0s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LEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQztJQUMvQixJQUFJLEtBQUssR0FBRyxDQUFDLENBQUMsRUFBRTtRQUNkLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDO0tBQ3ZCO0FBQ0gsQ0FBQztBQUVELFNBQVMsWUFBWSxDQUFJLElBQVM7SUFDaEMsS0FBSyxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFO1FBQ3pDLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQyxLQUFLLFNBQVMsRUFBRTtZQUN6QixPQUFPLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztTQUNoQjtLQUNGO0lBQ0QsT0FBTyxTQUFTLENBQUM7QUFDbkIsQ0FBQztBQUVELFNBQVMsWUFBWSxDQUFDLEtBQWM7SUFDbEMsTUFBTSxNQUFNLEdBQVUsRUFBRSxDQUFDO0lBQ3pCLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDLElBQUksSUFBSSxNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQztJQUN0RCxPQUFPLE1BQU0sQ0FBQztBQUNoQixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCAnLi91dGlsL25nX2ppdF9tb2RlJztcblxuaW1wb3J0IHttZXJnZSwgT2JzZXJ2YWJsZSwgT2JzZXJ2ZXIsIFN1YnNjcmlwdGlvbn0gZnJvbSAncnhqcyc7XG5pbXBvcnQge3NoYXJlfSBmcm9tICdyeGpzL29wZXJhdG9ycyc7XG5cbmltcG9ydCB7QXBwbGljYXRpb25Jbml0U3RhdHVzfSBmcm9tICcuL2FwcGxpY2F0aW9uX2luaXQnO1xuaW1wb3J0IHtBUFBfQk9PVFNUUkFQX0xJU1RFTkVSLCBQTEFURk9STV9JTklUSUFMSVpFUn0gZnJvbSAnLi9hcHBsaWNhdGlvbl90b2tlbnMnO1xuaW1wb3J0IHtnZXRDb21waWxlckZhY2FkZSwgSml0Q29tcGlsZXJVc2FnZX0gZnJvbSAnLi9jb21waWxlci9jb21waWxlcl9mYWNhZGUnO1xuaW1wb3J0IHtDb25zb2xlfSBmcm9tICcuL2NvbnNvbGUnO1xuaW1wb3J0IHtJbmplY3RhYmxlfSBmcm9tICcuL2RpL2luamVjdGFibGUnO1xuaW1wb3J0IHtJbmplY3Rpb25Ub2tlbn0gZnJvbSAnLi9kaS9pbmplY3Rpb25fdG9rZW4nO1xuaW1wb3J0IHtJbmplY3Rvcn0gZnJvbSAnLi9kaS9pbmplY3Rvcic7XG5pbXBvcnQge0ltcG9ydGVkTmdNb2R1bGVQcm92aWRlcnMsIFByb3ZpZGVyLCBTdGF0aWNQcm92aWRlcn0gZnJvbSAnLi9kaS9pbnRlcmZhY2UvcHJvdmlkZXInO1xuaW1wb3J0IHtFbnZpcm9ubWVudEluamVjdG9yfSBmcm9tICcuL2RpL3IzX2luamVjdG9yJztcbmltcG9ydCB7SU5KRUNUT1JfU0NPUEV9IGZyb20gJy4vZGkvc2NvcGUnO1xuaW1wb3J0IHtFcnJvckhhbmRsZXJ9IGZyb20gJy4vZXJyb3JfaGFuZGxlcic7XG5pbXBvcnQge2Zvcm1hdFJ1bnRpbWVFcnJvciwgUnVudGltZUVycm9yLCBSdW50aW1lRXJyb3JDb2RlfSBmcm9tICcuL2Vycm9ycyc7XG5pbXBvcnQge0RFRkFVTFRfTE9DQUxFX0lEfSBmcm9tICcuL2kxOG4vbG9jYWxpemF0aW9uJztcbmltcG9ydCB7TE9DQUxFX0lEfSBmcm9tICcuL2kxOG4vdG9rZW5zJztcbmltcG9ydCB7VHlwZX0gZnJvbSAnLi9pbnRlcmZhY2UvdHlwZSc7XG5pbXBvcnQge0NPTVBJTEVSX09QVElPTlMsIENvbXBpbGVyT3B0aW9uc30gZnJvbSAnLi9saW5rZXIvY29tcGlsZXInO1xuaW1wb3J0IHtDb21wb25lbnRGYWN0b3J5LCBDb21wb25lbnRSZWZ9IGZyb20gJy4vbGlua2VyL2NvbXBvbmVudF9mYWN0b3J5JztcbmltcG9ydCB7Q29tcG9uZW50RmFjdG9yeVJlc29sdmVyfSBmcm9tICcuL2xpbmtlci9jb21wb25lbnRfZmFjdG9yeV9yZXNvbHZlcic7XG5pbXBvcnQge0ludGVybmFsTmdNb2R1bGVSZWYsIE5nTW9kdWxlRmFjdG9yeSwgTmdNb2R1bGVSZWZ9IGZyb20gJy4vbGlua2VyL25nX21vZHVsZV9mYWN0b3J5JztcbmltcG9ydCB7SW50ZXJuYWxWaWV3UmVmLCBWaWV3UmVmfSBmcm9tICcuL2xpbmtlci92aWV3X3JlZic7XG5pbXBvcnQge2lzQ29tcG9uZW50UmVzb3VyY2VSZXNvbHV0aW9uUXVldWVFbXB0eSwgcmVzb2x2ZUNvbXBvbmVudFJlc291cmNlc30gZnJvbSAnLi9tZXRhZGF0YS9yZXNvdXJjZV9sb2FkaW5nJztcbmltcG9ydCB7YXNzZXJ0TmdNb2R1bGVUeXBlfSBmcm9tICcuL3JlbmRlcjMvYXNzZXJ0JztcbmltcG9ydCB7Q29tcG9uZW50RmFjdG9yeSBhcyBSM0NvbXBvbmVudEZhY3Rvcnl9IGZyb20gJy4vcmVuZGVyMy9jb21wb25lbnRfcmVmJztcbmltcG9ydCB7YXNzZXJ0U3RhbmRhbG9uZUNvbXBvbmVudFR5cGV9IGZyb20gJy4vcmVuZGVyMy9lcnJvcnMnO1xuaW1wb3J0IHtzZXRMb2NhbGVJZH0gZnJvbSAnLi9yZW5kZXIzL2kxOG4vaTE4bl9sb2NhbGVfaWQnO1xuaW1wb3J0IHtzZXRKaXRPcHRpb25zfSBmcm9tICcuL3JlbmRlcjMvaml0L2ppdF9vcHRpb25zJztcbmltcG9ydCB7aXNTdGFuZGFsb25lfSBmcm9tICcuL3JlbmRlcjMvaml0L21vZHVsZSc7XG5pbXBvcnQge2NyZWF0ZUVudmlyb25tZW50SW5qZWN0b3IsIE5nTW9kdWxlRmFjdG9yeSBhcyBSM05nTW9kdWxlRmFjdG9yeX0gZnJvbSAnLi9yZW5kZXIzL25nX21vZHVsZV9yZWYnO1xuaW1wb3J0IHtwdWJsaXNoRGVmYXVsdEdsb2JhbFV0aWxzIGFzIF9wdWJsaXNoRGVmYXVsdEdsb2JhbFV0aWxzfSBmcm9tICcuL3JlbmRlcjMvdXRpbC9nbG9iYWxfdXRpbHMnO1xuaW1wb3J0IHtURVNUQUJJTElUWX0gZnJvbSAnLi90ZXN0YWJpbGl0eS90ZXN0YWJpbGl0eSc7XG5pbXBvcnQge2lzUHJvbWlzZX0gZnJvbSAnLi91dGlsL2xhbmcnO1xuaW1wb3J0IHtzY2hlZHVsZU1pY3JvVGFza30gZnJvbSAnLi91dGlsL21pY3JvdGFzayc7XG5pbXBvcnQge3N0cmluZ2lmeX0gZnJvbSAnLi91dGlsL3N0cmluZ2lmeSc7XG5pbXBvcnQge05nWm9uZSwgTm9vcE5nWm9uZX0gZnJvbSAnLi96b25lL25nX3pvbmUnO1xuXG5sZXQgX3BsYXRmb3JtSW5qZWN0b3I6IEluamVjdG9yfG51bGwgPSBudWxsO1xuXG4vKipcbiAqIEludGVybmFsIHRva2VuIHRvIGluZGljYXRlIHdoZXRoZXIgaGF2aW5nIG11bHRpcGxlIGJvb3RzdHJhcHBlZCBwbGF0Zm9ybSBzaG91bGQgYmUgYWxsb3dlZCAob25seVxuICogb25lIGJvb3RzdHJhcHBlZCBwbGF0Zm9ybSBpcyBhbGxvd2VkIGJ5IGRlZmF1bHQpLiBUaGlzIHRva2VuIGhlbHBzIHRvIHN1cHBvcnQgU1NSIHNjZW5hcmlvcy5cbiAqL1xuZXhwb3J0IGNvbnN0IEFMTE9XX01VTFRJUExFX1BMQVRGT1JNUyA9IG5ldyBJbmplY3Rpb25Ub2tlbjxib29sZWFuPignQWxsb3dNdWx0aXBsZVRva2VuJyk7XG5cbi8qKlxuICogSW50ZXJuYWwgdG9rZW4gdGhhdCBhbGxvd3MgdG8gcmVnaXN0ZXIgZXh0cmEgY2FsbGJhY2tzIHRoYXQgc2hvdWxkIGJlIGludm9rZWQgZHVyaW5nIHRoZVxuICogYFBsYXRmb3JtUmVmLmRlc3Ryb3lgIG9wZXJhdGlvbi4gVGhpcyB0b2tlbiBpcyBuZWVkZWQgdG8gYXZvaWQgYSBkaXJlY3QgcmVmZXJlbmNlIHRvIHRoZVxuICogYFBsYXRmb3JtUmVmYCBjbGFzcyAoaS5lLiByZWdpc3RlciB0aGUgY2FsbGJhY2sgdmlhIGBQbGF0Zm9ybVJlZi5vbkRlc3Ryb3lgKSwgdGh1cyBtYWtpbmcgdGhlXG4gKiBlbnRpcmUgY2xhc3MgdHJlZS1zaGFrZWFibGUuXG4gKi9cbmNvbnN0IFBMQVRGT1JNX09OX0RFU1RST1kgPSBuZXcgSW5qZWN0aW9uVG9rZW48KCkgPT4gdm9pZD4oJ1BsYXRmb3JtT25EZXN0cm95Jyk7XG5cbmNvbnN0IE5HX0RFVl9NT0RFID0gdHlwZW9mIG5nRGV2TW9kZSA9PT0gJ3VuZGVmaW5lZCcgfHwgbmdEZXZNb2RlO1xuXG5leHBvcnQgZnVuY3Rpb24gY29tcGlsZU5nTW9kdWxlRmFjdG9yeTxNPihcbiAgICBpbmplY3RvcjogSW5qZWN0b3IsIG9wdGlvbnM6IENvbXBpbGVyT3B0aW9ucyxcbiAgICBtb2R1bGVUeXBlOiBUeXBlPE0+KTogUHJvbWlzZTxOZ01vZHVsZUZhY3Rvcnk8TT4+IHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydE5nTW9kdWxlVHlwZShtb2R1bGVUeXBlKTtcblxuICBjb25zdCBtb2R1bGVGYWN0b3J5ID0gbmV3IFIzTmdNb2R1bGVGYWN0b3J5KG1vZHVsZVR5cGUpO1xuXG4gIC8vIEFsbCBvZiB0aGUgbG9naWMgYmVsb3cgaXMgaXJyZWxldmFudCBmb3IgQU9ULWNvbXBpbGVkIGNvZGUuXG4gIGlmICh0eXBlb2YgbmdKaXRNb2RlICE9PSAndW5kZWZpbmVkJyAmJiAhbmdKaXRNb2RlKSB7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShtb2R1bGVGYWN0b3J5KTtcbiAgfVxuXG4gIGNvbnN0IGNvbXBpbGVyT3B0aW9ucyA9IGluamVjdG9yLmdldChDT01QSUxFUl9PUFRJT05TLCBbXSkuY29uY2F0KG9wdGlvbnMpO1xuXG4gIC8vIENvbmZpZ3VyZSB0aGUgY29tcGlsZXIgdG8gdXNlIHRoZSBwcm92aWRlZCBvcHRpb25zLiBUaGlzIGNhbGwgbWF5IGZhaWwgd2hlbiBtdWx0aXBsZSBtb2R1bGVzXG4gIC8vIGFyZSBib290c3RyYXBwZWQgd2l0aCBpbmNvbXBhdGlibGUgb3B0aW9ucywgYXMgYSBjb21wb25lbnQgY2FuIG9ubHkgYmUgY29tcGlsZWQgYWNjb3JkaW5nIHRvXG4gIC8vIGEgc2luZ2xlIHNldCBvZiBvcHRpb25zLlxuICBzZXRKaXRPcHRpb25zKHtcbiAgICBkZWZhdWx0RW5jYXBzdWxhdGlvbjogX2xhc3REZWZpbmVkKGNvbXBpbGVyT3B0aW9ucy5tYXAob3B0cyA9PiBvcHRzLmRlZmF1bHRFbmNhcHN1bGF0aW9uKSksXG4gICAgcHJlc2VydmVXaGl0ZXNwYWNlczogX2xhc3REZWZpbmVkKGNvbXBpbGVyT3B0aW9ucy5tYXAob3B0cyA9PiBvcHRzLnByZXNlcnZlV2hpdGVzcGFjZXMpKSxcbiAgfSk7XG5cbiAgaWYgKGlzQ29tcG9uZW50UmVzb3VyY2VSZXNvbHV0aW9uUXVldWVFbXB0eSgpKSB7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShtb2R1bGVGYWN0b3J5KTtcbiAgfVxuXG4gIGNvbnN0IGNvbXBpbGVyUHJvdmlkZXJzID0gX21lcmdlQXJyYXlzKGNvbXBpbGVyT3B0aW9ucy5tYXAobyA9PiBvLnByb3ZpZGVycyEpKTtcblxuICAvLyBJbiBjYXNlIHRoZXJlIGFyZSBubyBjb21waWxlciBwcm92aWRlcnMsIHdlIGp1c3QgcmV0dXJuIHRoZSBtb2R1bGUgZmFjdG9yeSBhc1xuICAvLyB0aGVyZSB3b24ndCBiZSBhbnkgcmVzb3VyY2UgbG9hZGVyLiBUaGlzIGNhbiBoYXBwZW4gd2l0aCBJdnksIGJlY2F1c2UgQU9UIGNvbXBpbGVkXG4gIC8vIG1vZHVsZXMgY2FuIGJlIHN0aWxsIHBhc3NlZCB0aHJvdWdoIFwiYm9vdHN0cmFwTW9kdWxlXCIuIEluIHRoYXQgY2FzZSB3ZSBzaG91bGRuJ3RcbiAgLy8gdW5uZWNlc3NhcmlseSByZXF1aXJlIHRoZSBKSVQgY29tcGlsZXIuXG4gIGlmIChjb21waWxlclByb3ZpZGVycy5sZW5ndGggPT09IDApIHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKG1vZHVsZUZhY3RvcnkpO1xuICB9XG5cbiAgY29uc3QgY29tcGlsZXIgPSBnZXRDb21waWxlckZhY2FkZSh7XG4gICAgdXNhZ2U6IEppdENvbXBpbGVyVXNhZ2UuRGVjb3JhdG9yLFxuICAgIGtpbmQ6ICdOZ01vZHVsZScsXG4gICAgdHlwZTogbW9kdWxlVHlwZSxcbiAgfSk7XG4gIGNvbnN0IGNvbXBpbGVySW5qZWN0b3IgPSBJbmplY3Rvci5jcmVhdGUoe3Byb3ZpZGVyczogY29tcGlsZXJQcm92aWRlcnN9KTtcbiAgY29uc3QgcmVzb3VyY2VMb2FkZXIgPSBjb21waWxlckluamVjdG9yLmdldChjb21waWxlci5SZXNvdXJjZUxvYWRlcik7XG4gIC8vIFRoZSByZXNvdXJjZSBsb2FkZXIgY2FuIGFsc28gcmV0dXJuIGEgc3RyaW5nIHdoaWxlIHRoZSBcInJlc29sdmVDb21wb25lbnRSZXNvdXJjZXNcIlxuICAvLyBhbHdheXMgZXhwZWN0cyBhIHByb21pc2UuIFRoZXJlZm9yZSB3ZSBuZWVkIHRvIHdyYXAgdGhlIHJldHVybmVkIHZhbHVlIGluIGEgcHJvbWlzZS5cbiAgcmV0dXJuIHJlc29sdmVDb21wb25lbnRSZXNvdXJjZXModXJsID0+IFByb21pc2UucmVzb2x2ZShyZXNvdXJjZUxvYWRlci5nZXQodXJsKSkpXG4gICAgICAudGhlbigoKSA9PiBtb2R1bGVGYWN0b3J5KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHB1Ymxpc2hEZWZhdWx0R2xvYmFsVXRpbHMoKSB7XG4gIG5nRGV2TW9kZSAmJiBfcHVibGlzaERlZmF1bHRHbG9iYWxVdGlscygpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNCb3VuZFRvTW9kdWxlPEM+KGNmOiBDb21wb25lbnRGYWN0b3J5PEM+KTogYm9vbGVhbiB7XG4gIHJldHVybiAoY2YgYXMgUjNDb21wb25lbnRGYWN0b3J5PEM+KS5pc0JvdW5kVG9Nb2R1bGU7XG59XG5cbi8qKlxuICogQSB0b2tlbiBmb3IgdGhpcmQtcGFydHkgY29tcG9uZW50cyB0aGF0IGNhbiByZWdpc3RlciB0aGVtc2VsdmVzIHdpdGggTmdQcm9iZS5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBjbGFzcyBOZ1Byb2JlVG9rZW4ge1xuICBjb25zdHJ1Y3RvcihwdWJsaWMgbmFtZTogc3RyaW5nLCBwdWJsaWMgdG9rZW46IGFueSkge31cbn1cblxuLyoqXG4gKiBDcmVhdGVzIGEgcGxhdGZvcm0uXG4gKiBQbGF0Zm9ybXMgbXVzdCBiZSBjcmVhdGVkIG9uIGxhdW5jaCB1c2luZyB0aGlzIGZ1bmN0aW9uLlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVBsYXRmb3JtKGluamVjdG9yOiBJbmplY3Rvcik6IFBsYXRmb3JtUmVmIHtcbiAgaWYgKF9wbGF0Zm9ybUluamVjdG9yICYmICFfcGxhdGZvcm1JbmplY3Rvci5nZXQoQUxMT1dfTVVMVElQTEVfUExBVEZPUk1TLCBmYWxzZSkpIHtcbiAgICB0aHJvdyBuZXcgUnVudGltZUVycm9yKFxuICAgICAgICBSdW50aW1lRXJyb3JDb2RlLk1VTFRJUExFX1BMQVRGT1JNUyxcbiAgICAgICAgbmdEZXZNb2RlICYmXG4gICAgICAgICAgICAnVGhlcmUgY2FuIGJlIG9ubHkgb25lIHBsYXRmb3JtLiBEZXN0cm95IHRoZSBwcmV2aW91cyBvbmUgdG8gY3JlYXRlIGEgbmV3IG9uZS4nKTtcbiAgfVxuICBwdWJsaXNoRGVmYXVsdEdsb2JhbFV0aWxzKCk7XG4gIF9wbGF0Zm9ybUluamVjdG9yID0gaW5qZWN0b3I7XG4gIGNvbnN0IHBsYXRmb3JtID0gaW5qZWN0b3IuZ2V0KFBsYXRmb3JtUmVmKTtcbiAgcnVuUGxhdGZvcm1Jbml0aWFsaXplcnMoaW5qZWN0b3IpO1xuICByZXR1cm4gcGxhdGZvcm07XG59XG5cbi8qKlxuICogVGhlIGdvYWwgb2YgdGhpcyBmdW5jdGlvbiBpcyB0byBib290c3RyYXAgYSBwbGF0Zm9ybSBpbmplY3RvcixcbiAqIGJ1dCBhdm9pZCByZWZlcmVuY2luZyBgUGxhdGZvcm1SZWZgIGNsYXNzLlxuICogVGhpcyBmdW5jdGlvbiBpcyBuZWVkZWQgZm9yIGJvb3RzdHJhcHBpbmcgYSBTdGFuZGFsb25lIENvbXBvbmVudC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZU9yUmV1c2VQbGF0Zm9ybUluamVjdG9yKHByb3ZpZGVyczogU3RhdGljUHJvdmlkZXJbXSA9IFtdKTogSW5qZWN0b3Ige1xuICAvLyBJZiBhIHBsYXRmb3JtIGluamVjdG9yIGFscmVhZHkgZXhpc3RzLCBpdCBtZWFucyB0aGF0IHRoZSBwbGF0Zm9ybVxuICAvLyBpcyBhbHJlYWR5IGJvb3RzdHJhcHBlZCBhbmQgbm8gYWRkaXRpb25hbCBhY3Rpb25zIGFyZSByZXF1aXJlZC5cbiAgaWYgKF9wbGF0Zm9ybUluamVjdG9yKSByZXR1cm4gX3BsYXRmb3JtSW5qZWN0b3I7XG5cbiAgLy8gT3RoZXJ3aXNlLCBzZXR1cCBhIG5ldyBwbGF0Zm9ybSBpbmplY3RvciBhbmQgcnVuIHBsYXRmb3JtIGluaXRpYWxpemVycy5cbiAgY29uc3QgaW5qZWN0b3IgPSBjcmVhdGVQbGF0Zm9ybUluamVjdG9yKHByb3ZpZGVycyk7XG4gIF9wbGF0Zm9ybUluamVjdG9yID0gaW5qZWN0b3I7XG4gIHB1Ymxpc2hEZWZhdWx0R2xvYmFsVXRpbHMoKTtcbiAgcnVuUGxhdGZvcm1Jbml0aWFsaXplcnMoaW5qZWN0b3IpO1xuICByZXR1cm4gaW5qZWN0b3I7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBydW5QbGF0Zm9ybUluaXRpYWxpemVycyhpbmplY3RvcjogSW5qZWN0b3IpOiB2b2lkIHtcbiAgY29uc3QgaW5pdHMgPSBpbmplY3Rvci5nZXQoUExBVEZPUk1fSU5JVElBTElaRVIsIG51bGwpO1xuICBpZiAoaW5pdHMpIHtcbiAgICBpbml0cy5mb3JFYWNoKChpbml0OiBhbnkpID0+IGluaXQoKSk7XG4gIH1cbn1cblxuLyoqXG4gKiBJbnRlcm5hbCBib290c3RyYXAgYXBwbGljYXRpb24gQVBJIHRoYXQgaW1wbGVtZW50cyB0aGUgY29yZSBib290c3RyYXAgbG9naWMuXG4gKlxuICogUGxhdGZvcm1zIChzdWNoIGFzIGBwbGF0Zm9ybS1icm93c2VyYCkgbWF5IHJlcXVpcmUgZGlmZmVyZW50IHNldCBvZiBhcHBsaWNhdGlvbiBhbmQgcGxhdGZvcm1cbiAqIHByb3ZpZGVycyBmb3IgYW4gYXBwbGljYXRpb24gdG8gZnVuY3Rpb24gY29ycmVjdGx5LiBBcyBhIHJlc3VsdCwgcGxhdGZvcm1zIG1heSB1c2UgdGhpcyBmdW5jdGlvblxuICogaW50ZXJuYWxseSBhbmQgc3VwcGx5IHRoZSBuZWNlc3NhcnkgcHJvdmlkZXJzIGR1cmluZyB0aGUgYm9vdHN0cmFwLCB3aGlsZSBleHBvc2luZ1xuICogcGxhdGZvcm0tc3BlY2lmaWMgQVBJcyBhcyBhIHBhcnQgb2YgdGhlaXIgcHVibGljIEFQSS5cbiAqXG4gKiBAcmV0dXJucyBBIHByb21pc2UgdGhhdCByZXR1cm5zIGFuIGBBcHBsaWNhdGlvblJlZmAgaW5zdGFuY2Ugb25jZSByZXNvbHZlZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGludGVybmFsQm9vdHN0cmFwQXBwbGljYXRpb24oY29uZmlnOiB7XG4gIHJvb3RDb21wb25lbnQ6IFR5cGU8dW5rbm93bj4sXG4gIGFwcFByb3ZpZGVycz86IEFycmF5PFByb3ZpZGVyfEltcG9ydGVkTmdNb2R1bGVQcm92aWRlcnM+LFxuICBwbGF0Zm9ybVByb3ZpZGVycz86IFByb3ZpZGVyW10sXG59KTogUHJvbWlzZTxBcHBsaWNhdGlvblJlZj4ge1xuICBjb25zdCB7cm9vdENvbXBvbmVudCwgYXBwUHJvdmlkZXJzLCBwbGF0Zm9ybVByb3ZpZGVyc30gPSBjb25maWc7XG4gIE5HX0RFVl9NT0RFICYmIGFzc2VydFN0YW5kYWxvbmVDb21wb25lbnRUeXBlKHJvb3RDb21wb25lbnQpO1xuXG4gIGNvbnN0IHBsYXRmb3JtSW5qZWN0b3IgPSBjcmVhdGVPclJldXNlUGxhdGZvcm1JbmplY3RvcihwbGF0Zm9ybVByb3ZpZGVycyBhcyBTdGF0aWNQcm92aWRlcltdKTtcblxuICBjb25zdCBuZ1pvbmUgPSBuZXcgTmdab25lKGdldE5nWm9uZU9wdGlvbnMoKSk7XG5cbiAgcmV0dXJuIG5nWm9uZS5ydW4oKCkgPT4ge1xuICAgIC8vIENyZWF0ZSByb290IGFwcGxpY2F0aW9uIGluamVjdG9yIGJhc2VkIG9uIGEgc2V0IG9mIHByb3ZpZGVycyBjb25maWd1cmVkIGF0IHRoZSBwbGF0Zm9ybVxuICAgIC8vIGJvb3RzdHJhcCBsZXZlbCBhcyB3ZWxsIGFzIHByb3ZpZGVycyBwYXNzZWQgdG8gdGhlIGJvb3RzdHJhcCBjYWxsIGJ5IGEgdXNlci5cbiAgICBjb25zdCBhbGxBcHBQcm92aWRlcnMgPSBbXG4gICAgICB7cHJvdmlkZTogTmdab25lLCB1c2VWYWx1ZTogbmdab25lfSwgIC8vXG4gICAgICAuLi4oYXBwUHJvdmlkZXJzIHx8IFtdKSwgICAgICAgICAgICAgIC8vXG4gICAgXTtcbiAgICBjb25zdCBhcHBJbmplY3RvciA9IGNyZWF0ZUVudmlyb25tZW50SW5qZWN0b3IoXG4gICAgICAgIGFsbEFwcFByb3ZpZGVycywgcGxhdGZvcm1JbmplY3RvciBhcyBFbnZpcm9ubWVudEluamVjdG9yLCAnRW52aXJvbm1lbnQgSW5qZWN0b3InKTtcblxuICAgIGNvbnN0IGV4Y2VwdGlvbkhhbmRsZXI6IEVycm9ySGFuZGxlcnxudWxsID0gYXBwSW5qZWN0b3IuZ2V0KEVycm9ySGFuZGxlciwgbnVsbCk7XG4gICAgaWYgKE5HX0RFVl9NT0RFICYmICFleGNlcHRpb25IYW5kbGVyKSB7XG4gICAgICB0aHJvdyBuZXcgUnVudGltZUVycm9yKFxuICAgICAgICAgIFJ1bnRpbWVFcnJvckNvZGUuRVJST1JfSEFORExFUl9OT1RfRk9VTkQsXG4gICAgICAgICAgJ05vIGBFcnJvckhhbmRsZXJgIGZvdW5kIGluIHRoZSBEZXBlbmRlbmN5IEluamVjdGlvbiB0cmVlLicpO1xuICAgIH1cblxuICAgIGxldCBvbkVycm9yU3Vic2NyaXB0aW9uOiBTdWJzY3JpcHRpb247XG4gICAgbmdab25lLnJ1bk91dHNpZGVBbmd1bGFyKCgpID0+IHtcbiAgICAgIG9uRXJyb3JTdWJzY3JpcHRpb24gPSBuZ1pvbmUub25FcnJvci5zdWJzY3JpYmUoe1xuICAgICAgICBuZXh0OiAoZXJyb3I6IGFueSkgPT4ge1xuICAgICAgICAgIGV4Y2VwdGlvbkhhbmRsZXIhLmhhbmRsZUVycm9yKGVycm9yKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSk7XG4gICAgcmV0dXJuIF9jYWxsQW5kUmVwb3J0VG9FcnJvckhhbmRsZXIoZXhjZXB0aW9uSGFuZGxlciEsIG5nWm9uZSwgKCkgPT4ge1xuICAgICAgY29uc3QgaW5pdFN0YXR1cyA9IGFwcEluamVjdG9yLmdldChBcHBsaWNhdGlvbkluaXRTdGF0dXMpO1xuICAgICAgaW5pdFN0YXR1cy5ydW5Jbml0aWFsaXplcnMoKTtcbiAgICAgIHJldHVybiBpbml0U3RhdHVzLmRvbmVQcm9taXNlLnRoZW4oKCkgPT4ge1xuICAgICAgICBjb25zdCBsb2NhbGVJZCA9IGFwcEluamVjdG9yLmdldChMT0NBTEVfSUQsIERFRkFVTFRfTE9DQUxFX0lEKTtcbiAgICAgICAgc2V0TG9jYWxlSWQobG9jYWxlSWQgfHwgREVGQVVMVF9MT0NBTEVfSUQpO1xuXG4gICAgICAgIGNvbnN0IGFwcFJlZiA9IGFwcEluamVjdG9yLmdldChBcHBsaWNhdGlvblJlZik7XG4gICAgICAgIGFwcFJlZi5vbkRlc3Ryb3koKCkgPT4gb25FcnJvclN1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpKTtcbiAgICAgICAgYXBwUmVmLmJvb3RzdHJhcChyb290Q29tcG9uZW50KTtcbiAgICAgICAgcmV0dXJuIGFwcFJlZjtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9KTtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGEgZmFjdG9yeSBmb3IgYSBwbGF0Zm9ybS4gQ2FuIGJlIHVzZWQgdG8gcHJvdmlkZSBvciBvdmVycmlkZSBgUHJvdmlkZXJzYCBzcGVjaWZpYyB0b1xuICogeW91ciBhcHBsaWNhdGlvbidzIHJ1bnRpbWUgbmVlZHMsIHN1Y2ggYXMgYFBMQVRGT1JNX0lOSVRJQUxJWkVSYCBhbmQgYFBMQVRGT1JNX0lEYC5cbiAqIEBwYXJhbSBwYXJlbnRQbGF0Zm9ybUZhY3RvcnkgQW5vdGhlciBwbGF0Zm9ybSBmYWN0b3J5IHRvIG1vZGlmeS4gQWxsb3dzIHlvdSB0byBjb21wb3NlIGZhY3Rvcmllc1xuICogdG8gYnVpbGQgdXAgY29uZmlndXJhdGlvbnMgdGhhdCBtaWdodCBiZSByZXF1aXJlZCBieSBkaWZmZXJlbnQgbGlicmFyaWVzIG9yIHBhcnRzIG9mIHRoZVxuICogYXBwbGljYXRpb24uXG4gKiBAcGFyYW0gbmFtZSBJZGVudGlmaWVzIHRoZSBuZXcgcGxhdGZvcm0gZmFjdG9yeS5cbiAqIEBwYXJhbSBwcm92aWRlcnMgQSBzZXQgb2YgZGVwZW5kZW5jeSBwcm92aWRlcnMgZm9yIHBsYXRmb3JtcyBjcmVhdGVkIHdpdGggdGhlIG5ldyBmYWN0b3J5LlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVBsYXRmb3JtRmFjdG9yeShcbiAgICBwYXJlbnRQbGF0Zm9ybUZhY3Rvcnk6ICgoZXh0cmFQcm92aWRlcnM/OiBTdGF0aWNQcm92aWRlcltdKSA9PiBQbGF0Zm9ybVJlZil8bnVsbCwgbmFtZTogc3RyaW5nLFxuICAgIHByb3ZpZGVyczogU3RhdGljUHJvdmlkZXJbXSA9IFtdKTogKGV4dHJhUHJvdmlkZXJzPzogU3RhdGljUHJvdmlkZXJbXSkgPT4gUGxhdGZvcm1SZWYge1xuICBjb25zdCBkZXNjID0gYFBsYXRmb3JtOiAke25hbWV9YDtcbiAgY29uc3QgbWFya2VyID0gbmV3IEluamVjdGlvblRva2VuKGRlc2MpO1xuICByZXR1cm4gKGV4dHJhUHJvdmlkZXJzOiBTdGF0aWNQcm92aWRlcltdID0gW10pID0+IHtcbiAgICBsZXQgcGxhdGZvcm0gPSBnZXRQbGF0Zm9ybSgpO1xuICAgIGlmICghcGxhdGZvcm0gfHwgcGxhdGZvcm0uaW5qZWN0b3IuZ2V0KEFMTE9XX01VTFRJUExFX1BMQVRGT1JNUywgZmFsc2UpKSB7XG4gICAgICBjb25zdCBwbGF0Zm9ybVByb3ZpZGVyczogU3RhdGljUHJvdmlkZXJbXSA9IFtcbiAgICAgICAgLi4ucHJvdmlkZXJzLCAgICAgICAvL1xuICAgICAgICAuLi5leHRyYVByb3ZpZGVycywgIC8vXG4gICAgICAgIHtwcm92aWRlOiBtYXJrZXIsIHVzZVZhbHVlOiB0cnVlfVxuICAgICAgXTtcbiAgICAgIGlmIChwYXJlbnRQbGF0Zm9ybUZhY3RvcnkpIHtcbiAgICAgICAgcGFyZW50UGxhdGZvcm1GYWN0b3J5KHBsYXRmb3JtUHJvdmlkZXJzKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNyZWF0ZVBsYXRmb3JtKGNyZWF0ZVBsYXRmb3JtSW5qZWN0b3IocGxhdGZvcm1Qcm92aWRlcnMsIGRlc2MpKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGFzc2VydFBsYXRmb3JtKG1hcmtlcik7XG4gIH07XG59XG5cbi8qKlxuICogQ2hlY2tzIHRoYXQgdGhlcmUgaXMgY3VycmVudGx5IGEgcGxhdGZvcm0gdGhhdCBjb250YWlucyB0aGUgZ2l2ZW4gdG9rZW4gYXMgYSBwcm92aWRlci5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhc3NlcnRQbGF0Zm9ybShyZXF1aXJlZFRva2VuOiBhbnkpOiBQbGF0Zm9ybVJlZiB7XG4gIGNvbnN0IHBsYXRmb3JtID0gZ2V0UGxhdGZvcm0oKTtcblxuICBpZiAoIXBsYXRmb3JtKSB7XG4gICAgdGhyb3cgbmV3IFJ1bnRpbWVFcnJvcihSdW50aW1lRXJyb3JDb2RlLlBMQVRGT1JNX05PVF9GT1VORCwgbmdEZXZNb2RlICYmICdObyBwbGF0Zm9ybSBleGlzdHMhJyk7XG4gIH1cblxuICBpZiAoKHR5cGVvZiBuZ0Rldk1vZGUgPT09ICd1bmRlZmluZWQnIHx8IG5nRGV2TW9kZSkgJiZcbiAgICAgICFwbGF0Zm9ybS5pbmplY3Rvci5nZXQocmVxdWlyZWRUb2tlbiwgbnVsbCkpIHtcbiAgICB0aHJvdyBuZXcgUnVudGltZUVycm9yKFxuICAgICAgICBSdW50aW1lRXJyb3JDb2RlLk1VTFRJUExFX1BMQVRGT1JNUyxcbiAgICAgICAgJ0EgcGxhdGZvcm0gd2l0aCBhIGRpZmZlcmVudCBjb25maWd1cmF0aW9uIGhhcyBiZWVuIGNyZWF0ZWQuIFBsZWFzZSBkZXN0cm95IGl0IGZpcnN0LicpO1xuICB9XG5cbiAgcmV0dXJuIHBsYXRmb3JtO1xufVxuXG4vKipcbiAqIEhlbHBlciBmdW5jdGlvbiB0byBjcmVhdGUgYW4gaW5zdGFuY2Ugb2YgYSBwbGF0Zm9ybSBpbmplY3RvciAodGhhdCBtYWludGFpbnMgdGhlICdwbGF0Zm9ybSdcbiAqIHNjb3BlKS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVBsYXRmb3JtSW5qZWN0b3IocHJvdmlkZXJzOiBTdGF0aWNQcm92aWRlcltdID0gW10sIG5hbWU/OiBzdHJpbmcpOiBJbmplY3RvciB7XG4gIHJldHVybiBJbmplY3Rvci5jcmVhdGUoe1xuICAgIG5hbWUsXG4gICAgcHJvdmlkZXJzOiBbXG4gICAgICB7cHJvdmlkZTogSU5KRUNUT1JfU0NPUEUsIHVzZVZhbHVlOiAncGxhdGZvcm0nfSxcbiAgICAgIHtwcm92aWRlOiBQTEFURk9STV9PTl9ERVNUUk9ZLCB1c2VWYWx1ZTogKCkgPT4gX3BsYXRmb3JtSW5qZWN0b3IgPSBudWxsfSwgIC8vXG4gICAgICAuLi5wcm92aWRlcnNcbiAgICBdLFxuICB9KTtcbn1cblxuLyoqXG4gKiBEZXN0cm95cyB0aGUgY3VycmVudCBBbmd1bGFyIHBsYXRmb3JtIGFuZCBhbGwgQW5ndWxhciBhcHBsaWNhdGlvbnMgb24gdGhlIHBhZ2UuXG4gKiBEZXN0cm95cyBhbGwgbW9kdWxlcyBhbmQgbGlzdGVuZXJzIHJlZ2lzdGVyZWQgd2l0aCB0aGUgcGxhdGZvcm0uXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gZGVzdHJveVBsYXRmb3JtKCk6IHZvaWQge1xuICBnZXRQbGF0Zm9ybSgpPy5kZXN0cm95KCk7XG59XG5cbi8qKlxuICogUmV0dXJucyB0aGUgY3VycmVudCBwbGF0Zm9ybS5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRQbGF0Zm9ybSgpOiBQbGF0Zm9ybVJlZnxudWxsIHtcbiAgcmV0dXJuIF9wbGF0Zm9ybUluamVjdG9yPy5nZXQoUGxhdGZvcm1SZWYpID8/IG51bGw7XG59XG5cbi8qKlxuICogUHJvdmlkZXMgYWRkaXRpb25hbCBvcHRpb25zIHRvIHRoZSBib290c3RyYXBpbmcgcHJvY2Vzcy5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBCb290c3RyYXBPcHRpb25zIHtcbiAgLyoqXG4gICAqIE9wdGlvbmFsbHkgc3BlY2lmeSB3aGljaCBgTmdab25lYCBzaG91bGQgYmUgdXNlZC5cbiAgICpcbiAgICogLSBQcm92aWRlIHlvdXIgb3duIGBOZ1pvbmVgIGluc3RhbmNlLlxuICAgKiAtIGB6b25lLmpzYCAtIFVzZSBkZWZhdWx0IGBOZ1pvbmVgIHdoaWNoIHJlcXVpcmVzIGBab25lLmpzYC5cbiAgICogLSBgbm9vcGAgLSBVc2UgYE5vb3BOZ1pvbmVgIHdoaWNoIGRvZXMgbm90aGluZy5cbiAgICovXG4gIG5nWm9uZT86IE5nWm9uZXwnem9uZS5qcyd8J25vb3AnO1xuXG4gIC8qKlxuICAgKiBPcHRpb25hbGx5IHNwZWNpZnkgY29hbGVzY2luZyBldmVudCBjaGFuZ2UgZGV0ZWN0aW9ucyBvciBub3QuXG4gICAqIENvbnNpZGVyIHRoZSBmb2xsb3dpbmcgY2FzZS5cbiAgICpcbiAgICogPGRpdiAoY2xpY2spPVwiZG9Tb21ldGhpbmcoKVwiPlxuICAgKiAgIDxidXR0b24gKGNsaWNrKT1cImRvU29tZXRoaW5nRWxzZSgpXCI+PC9idXR0b24+XG4gICAqIDwvZGl2PlxuICAgKlxuICAgKiBXaGVuIGJ1dHRvbiBpcyBjbGlja2VkLCBiZWNhdXNlIG9mIHRoZSBldmVudCBidWJibGluZywgYm90aFxuICAgKiBldmVudCBoYW5kbGVycyB3aWxsIGJlIGNhbGxlZCBhbmQgMiBjaGFuZ2UgZGV0ZWN0aW9ucyB3aWxsIGJlXG4gICAqIHRyaWdnZXJlZC4gV2UgY2FuIGNvbGVzY2Ugc3VjaCBraW5kIG9mIGV2ZW50cyB0byBvbmx5IHRyaWdnZXJcbiAgICogY2hhbmdlIGRldGVjdGlvbiBvbmx5IG9uY2UuXG4gICAqXG4gICAqIEJ5IGRlZmF1bHQsIHRoaXMgb3B0aW9uIHdpbGwgYmUgZmFsc2UuIFNvIHRoZSBldmVudHMgd2lsbCBub3QgYmVcbiAgICogY29hbGVzY2VkIGFuZCB0aGUgY2hhbmdlIGRldGVjdGlvbiB3aWxsIGJlIHRyaWdnZXJlZCBtdWx0aXBsZSB0aW1lcy5cbiAgICogQW5kIGlmIHRoaXMgb3B0aW9uIGJlIHNldCB0byB0cnVlLCB0aGUgY2hhbmdlIGRldGVjdGlvbiB3aWxsIGJlXG4gICAqIHRyaWdnZXJlZCBhc3luYyBieSBzY2hlZHVsaW5nIGEgYW5pbWF0aW9uIGZyYW1lLiBTbyBpbiB0aGUgY2FzZSBhYm92ZSxcbiAgICogdGhlIGNoYW5nZSBkZXRlY3Rpb24gd2lsbCBvbmx5IGJlIHRyaWdnZXJlZCBvbmNlLlxuICAgKi9cbiAgbmdab25lRXZlbnRDb2FsZXNjaW5nPzogYm9vbGVhbjtcblxuICAvKipcbiAgICogT3B0aW9uYWxseSBzcGVjaWZ5IGlmIGBOZ1pvbmUjcnVuKClgIG1ldGhvZCBpbnZvY2F0aW9ucyBzaG91bGQgYmUgY29hbGVzY2VkXG4gICAqIGludG8gYSBzaW5nbGUgY2hhbmdlIGRldGVjdGlvbi5cbiAgICpcbiAgICogQ29uc2lkZXIgdGhlIGZvbGxvd2luZyBjYXNlLlxuICAgKlxuICAgKiBmb3IgKGxldCBpID0gMDsgaSA8IDEwOyBpICsrKSB7XG4gICAqICAgbmdab25lLnJ1bigoKSA9PiB7XG4gICAqICAgICAvLyBkbyBzb21ldGhpbmdcbiAgICogICB9KTtcbiAgICogfVxuICAgKlxuICAgKiBUaGlzIGNhc2UgdHJpZ2dlcnMgdGhlIGNoYW5nZSBkZXRlY3Rpb24gbXVsdGlwbGUgdGltZXMuXG4gICAqIFdpdGggbmdab25lUnVuQ29hbGVzY2luZyBvcHRpb25zLCBhbGwgY2hhbmdlIGRldGVjdGlvbnMgaW4gYW4gZXZlbnQgbG9vcCB0cmlnZ2VyIG9ubHkgb25jZS5cbiAgICogSW4gYWRkaXRpb24sIHRoZSBjaGFuZ2UgZGV0ZWN0aW9uIGV4ZWN1dGVzIGluIHJlcXVlc3RBbmltYXRpb24uXG4gICAqXG4gICAqL1xuICBuZ1pvbmVSdW5Db2FsZXNjaW5nPzogYm9vbGVhbjtcbn1cblxuLyoqXG4gKiBUaGUgQW5ndWxhciBwbGF0Zm9ybSBpcyB0aGUgZW50cnkgcG9pbnQgZm9yIEFuZ3VsYXIgb24gYSB3ZWIgcGFnZS5cbiAqIEVhY2ggcGFnZSBoYXMgZXhhY3RseSBvbmUgcGxhdGZvcm0uIFNlcnZpY2VzIChzdWNoIGFzIHJlZmxlY3Rpb24pIHdoaWNoIGFyZSBjb21tb25cbiAqIHRvIGV2ZXJ5IEFuZ3VsYXIgYXBwbGljYXRpb24gcnVubmluZyBvbiB0aGUgcGFnZSBhcmUgYm91bmQgaW4gaXRzIHNjb3BlLlxuICogQSBwYWdlJ3MgcGxhdGZvcm0gaXMgaW5pdGlhbGl6ZWQgaW1wbGljaXRseSB3aGVuIGEgcGxhdGZvcm0gaXMgY3JlYXRlZCB1c2luZyBhIHBsYXRmb3JtXG4gKiBmYWN0b3J5IHN1Y2ggYXMgYFBsYXRmb3JtQnJvd3NlcmAsIG9yIGV4cGxpY2l0bHkgYnkgY2FsbGluZyB0aGUgYGNyZWF0ZVBsYXRmb3JtKClgIGZ1bmN0aW9uLlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuQEluamVjdGFibGUoe3Byb3ZpZGVkSW46ICdwbGF0Zm9ybSd9KVxuZXhwb3J0IGNsYXNzIFBsYXRmb3JtUmVmIHtcbiAgcHJpdmF0ZSBfbW9kdWxlczogTmdNb2R1bGVSZWY8YW55PltdID0gW107XG4gIHByaXZhdGUgX2Rlc3Ryb3lMaXN0ZW5lcnM6IEFycmF5PCgpID0+IHZvaWQ+ID0gW107XG4gIHByaXZhdGUgX2Rlc3Ryb3llZDogYm9vbGVhbiA9IGZhbHNlO1xuXG4gIC8qKiBAaW50ZXJuYWwgKi9cbiAgY29uc3RydWN0b3IocHJpdmF0ZSBfaW5qZWN0b3I6IEluamVjdG9yKSB7fVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGFuIGluc3RhbmNlIG9mIGFuIGBATmdNb2R1bGVgIGZvciB0aGUgZ2l2ZW4gcGxhdGZvcm0uXG4gICAqXG4gICAqIEBkZXByZWNhdGVkIFBhc3NpbmcgTmdNb2R1bGUgZmFjdG9yaWVzIGFzIHRoZSBgUGxhdGZvcm1SZWYuYm9vdHN0cmFwTW9kdWxlRmFjdG9yeWAgZnVuY3Rpb25cbiAgICogICAgIGFyZ3VtZW50IGlzIGRlcHJlY2F0ZWQuIFVzZSB0aGUgYFBsYXRmb3JtUmVmLmJvb3RzdHJhcE1vZHVsZWAgQVBJIGluc3RlYWQuXG4gICAqL1xuICBib290c3RyYXBNb2R1bGVGYWN0b3J5PE0+KG1vZHVsZUZhY3Rvcnk6IE5nTW9kdWxlRmFjdG9yeTxNPiwgb3B0aW9ucz86IEJvb3RzdHJhcE9wdGlvbnMpOlxuICAgICAgUHJvbWlzZTxOZ01vZHVsZVJlZjxNPj4ge1xuICAgIC8vIE5vdGU6IFdlIG5lZWQgdG8gY3JlYXRlIHRoZSBOZ1pvbmUgX2JlZm9yZV8gd2UgaW5zdGFudGlhdGUgdGhlIG1vZHVsZSxcbiAgICAvLyBhcyBpbnN0YW50aWF0aW5nIHRoZSBtb2R1bGUgY3JlYXRlcyBzb21lIHByb3ZpZGVycyBlYWdlcmx5LlxuICAgIC8vIFNvIHdlIGNyZWF0ZSBhIG1pbmkgcGFyZW50IGluamVjdG9yIHRoYXQganVzdCBjb250YWlucyB0aGUgbmV3IE5nWm9uZSBhbmRcbiAgICAvLyBwYXNzIHRoYXQgYXMgcGFyZW50IHRvIHRoZSBOZ01vZHVsZUZhY3RvcnkuXG4gICAgY29uc3Qgbmdab25lID0gZ2V0Tmdab25lKG9wdGlvbnM/Lm5nWm9uZSwgZ2V0Tmdab25lT3B0aW9ucyhvcHRpb25zKSk7XG4gICAgY29uc3QgcHJvdmlkZXJzOiBTdGF0aWNQcm92aWRlcltdID0gW3twcm92aWRlOiBOZ1pvbmUsIHVzZVZhbHVlOiBuZ1pvbmV9XTtcbiAgICAvLyBOb3RlOiBDcmVhdGUgbmdab25lSW5qZWN0b3Igd2l0aGluIG5nWm9uZS5ydW4gc28gdGhhdCBhbGwgb2YgdGhlIGluc3RhbnRpYXRlZCBzZXJ2aWNlcyBhcmVcbiAgICAvLyBjcmVhdGVkIHdpdGhpbiB0aGUgQW5ndWxhciB6b25lXG4gICAgLy8gRG8gbm90IHRyeSB0byByZXBsYWNlIG5nWm9uZS5ydW4gd2l0aCBBcHBsaWNhdGlvblJlZiNydW4gYmVjYXVzZSBBcHBsaWNhdGlvblJlZiB3b3VsZCB0aGVuIGJlXG4gICAgLy8gY3JlYXRlZCBvdXRzaWRlIG9mIHRoZSBBbmd1bGFyIHpvbmUuXG4gICAgcmV0dXJuIG5nWm9uZS5ydW4oKCkgPT4ge1xuICAgICAgY29uc3Qgbmdab25lSW5qZWN0b3IgPSBJbmplY3Rvci5jcmVhdGUoXG4gICAgICAgICAge3Byb3ZpZGVyczogcHJvdmlkZXJzLCBwYXJlbnQ6IHRoaXMuaW5qZWN0b3IsIG5hbWU6IG1vZHVsZUZhY3RvcnkubW9kdWxlVHlwZS5uYW1lfSk7XG4gICAgICBjb25zdCBtb2R1bGVSZWYgPSA8SW50ZXJuYWxOZ01vZHVsZVJlZjxNPj5tb2R1bGVGYWN0b3J5LmNyZWF0ZShuZ1pvbmVJbmplY3Rvcik7XG4gICAgICBjb25zdCBleGNlcHRpb25IYW5kbGVyOiBFcnJvckhhbmRsZXJ8bnVsbCA9IG1vZHVsZVJlZi5pbmplY3Rvci5nZXQoRXJyb3JIYW5kbGVyLCBudWxsKTtcbiAgICAgIGlmICghZXhjZXB0aW9uSGFuZGxlcikge1xuICAgICAgICB0aHJvdyBuZXcgUnVudGltZUVycm9yKFxuICAgICAgICAgICAgUnVudGltZUVycm9yQ29kZS5FUlJPUl9IQU5ETEVSX05PVF9GT1VORCxcbiAgICAgICAgICAgIG5nRGV2TW9kZSAmJiAnTm8gRXJyb3JIYW5kbGVyLiBJcyBwbGF0Zm9ybSBtb2R1bGUgKEJyb3dzZXJNb2R1bGUpIGluY2x1ZGVkPycpO1xuICAgICAgfVxuICAgICAgbmdab25lIS5ydW5PdXRzaWRlQW5ndWxhcigoKSA9PiB7XG4gICAgICAgIGNvbnN0IHN1YnNjcmlwdGlvbiA9IG5nWm9uZSEub25FcnJvci5zdWJzY3JpYmUoe1xuICAgICAgICAgIG5leHQ6IChlcnJvcjogYW55KSA9PiB7XG4gICAgICAgICAgICBleGNlcHRpb25IYW5kbGVyLmhhbmRsZUVycm9yKGVycm9yKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBtb2R1bGVSZWYub25EZXN0cm95KCgpID0+IHtcbiAgICAgICAgICByZW1vdmUodGhpcy5fbW9kdWxlcywgbW9kdWxlUmVmKTtcbiAgICAgICAgICBzdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICAgIHJldHVybiBfY2FsbEFuZFJlcG9ydFRvRXJyb3JIYW5kbGVyKGV4Y2VwdGlvbkhhbmRsZXIsIG5nWm9uZSEsICgpID0+IHtcbiAgICAgICAgY29uc3QgaW5pdFN0YXR1czogQXBwbGljYXRpb25Jbml0U3RhdHVzID0gbW9kdWxlUmVmLmluamVjdG9yLmdldChBcHBsaWNhdGlvbkluaXRTdGF0dXMpO1xuICAgICAgICBpbml0U3RhdHVzLnJ1bkluaXRpYWxpemVycygpO1xuICAgICAgICByZXR1cm4gaW5pdFN0YXR1cy5kb25lUHJvbWlzZS50aGVuKCgpID0+IHtcbiAgICAgICAgICAvLyBJZiB0aGUgYExPQ0FMRV9JRGAgcHJvdmlkZXIgaXMgZGVmaW5lZCBhdCBib290c3RyYXAgdGhlbiB3ZSBzZXQgdGhlIHZhbHVlIGZvciBpdnlcbiAgICAgICAgICBjb25zdCBsb2NhbGVJZCA9IG1vZHVsZVJlZi5pbmplY3Rvci5nZXQoTE9DQUxFX0lELCBERUZBVUxUX0xPQ0FMRV9JRCk7XG4gICAgICAgICAgc2V0TG9jYWxlSWQobG9jYWxlSWQgfHwgREVGQVVMVF9MT0NBTEVfSUQpO1xuICAgICAgICAgIHRoaXMuX21vZHVsZURvQm9vdHN0cmFwKG1vZHVsZVJlZik7XG4gICAgICAgICAgcmV0dXJuIG1vZHVsZVJlZjtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGFuIGluc3RhbmNlIG9mIGFuIGBATmdNb2R1bGVgIGZvciBhIGdpdmVuIHBsYXRmb3JtLlxuICAgKlxuICAgKiBAdXNhZ2VOb3Rlc1xuICAgKiAjIyMgU2ltcGxlIEV4YW1wbGVcbiAgICpcbiAgICogYGBgdHlwZXNjcmlwdFxuICAgKiBATmdNb2R1bGUoe1xuICAgKiAgIGltcG9ydHM6IFtCcm93c2VyTW9kdWxlXVxuICAgKiB9KVxuICAgKiBjbGFzcyBNeU1vZHVsZSB7fVxuICAgKlxuICAgKiBsZXQgbW9kdWxlUmVmID0gcGxhdGZvcm1Ccm93c2VyKCkuYm9vdHN0cmFwTW9kdWxlKE15TW9kdWxlKTtcbiAgICogYGBgXG4gICAqXG4gICAqL1xuICBib290c3RyYXBNb2R1bGU8TT4oXG4gICAgICBtb2R1bGVUeXBlOiBUeXBlPE0+LFxuICAgICAgY29tcGlsZXJPcHRpb25zOiAoQ29tcGlsZXJPcHRpb25zJkJvb3RzdHJhcE9wdGlvbnMpfFxuICAgICAgQXJyYXk8Q29tcGlsZXJPcHRpb25zJkJvb3RzdHJhcE9wdGlvbnM+ID0gW10pOiBQcm9taXNlPE5nTW9kdWxlUmVmPE0+PiB7XG4gICAgY29uc3Qgb3B0aW9ucyA9IG9wdGlvbnNSZWR1Y2VyKHt9LCBjb21waWxlck9wdGlvbnMpO1xuICAgIHJldHVybiBjb21waWxlTmdNb2R1bGVGYWN0b3J5KHRoaXMuaW5qZWN0b3IsIG9wdGlvbnMsIG1vZHVsZVR5cGUpXG4gICAgICAgIC50aGVuKG1vZHVsZUZhY3RvcnkgPT4gdGhpcy5ib290c3RyYXBNb2R1bGVGYWN0b3J5KG1vZHVsZUZhY3RvcnksIG9wdGlvbnMpKTtcbiAgfVxuXG4gIHByaXZhdGUgX21vZHVsZURvQm9vdHN0cmFwKG1vZHVsZVJlZjogSW50ZXJuYWxOZ01vZHVsZVJlZjxhbnk+KTogdm9pZCB7XG4gICAgY29uc3QgYXBwUmVmID0gbW9kdWxlUmVmLmluamVjdG9yLmdldChBcHBsaWNhdGlvblJlZikgYXMgQXBwbGljYXRpb25SZWY7XG4gICAgaWYgKG1vZHVsZVJlZi5fYm9vdHN0cmFwQ29tcG9uZW50cy5sZW5ndGggPiAwKSB7XG4gICAgICBtb2R1bGVSZWYuX2Jvb3RzdHJhcENvbXBvbmVudHMuZm9yRWFjaChmID0+IGFwcFJlZi5ib290c3RyYXAoZikpO1xuICAgIH0gZWxzZSBpZiAobW9kdWxlUmVmLmluc3RhbmNlLm5nRG9Cb290c3RyYXApIHtcbiAgICAgIG1vZHVsZVJlZi5pbnN0YW5jZS5uZ0RvQm9vdHN0cmFwKGFwcFJlZik7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IG5ldyBSdW50aW1lRXJyb3IoXG4gICAgICAgICAgUnVudGltZUVycm9yQ29kZS5CT09UU1RSQVBfQ09NUE9ORU5UU19OT1RfRk9VTkQsXG4gICAgICAgICAgbmdEZXZNb2RlICYmXG4gICAgICAgICAgICAgIGBUaGUgbW9kdWxlICR7c3RyaW5naWZ5KG1vZHVsZVJlZi5pbnN0YW5jZS5jb25zdHJ1Y3Rvcil9IHdhcyBib290c3RyYXBwZWQsIGAgK1xuICAgICAgICAgICAgICAgICAgYGJ1dCBpdCBkb2VzIG5vdCBkZWNsYXJlIFwiQE5nTW9kdWxlLmJvb3RzdHJhcFwiIGNvbXBvbmVudHMgbm9yIGEgXCJuZ0RvQm9vdHN0cmFwXCIgbWV0aG9kLiBgICtcbiAgICAgICAgICAgICAgICAgIGBQbGVhc2UgZGVmaW5lIG9uZSBvZiB0aGVzZS5gKTtcbiAgICB9XG4gICAgdGhpcy5fbW9kdWxlcy5wdXNoKG1vZHVsZVJlZik7XG4gIH1cblxuICAvKipcbiAgICogUmVnaXN0ZXJzIGEgbGlzdGVuZXIgdG8gYmUgY2FsbGVkIHdoZW4gdGhlIHBsYXRmb3JtIGlzIGRlc3Ryb3llZC5cbiAgICovXG4gIG9uRGVzdHJveShjYWxsYmFjazogKCkgPT4gdm9pZCk6IHZvaWQge1xuICAgIHRoaXMuX2Rlc3Ryb3lMaXN0ZW5lcnMucHVzaChjYWxsYmFjayk7XG4gIH1cblxuICAvKipcbiAgICogUmV0cmlldmVzIHRoZSBwbGF0Zm9ybSB7QGxpbmsgSW5qZWN0b3J9LCB3aGljaCBpcyB0aGUgcGFyZW50IGluamVjdG9yIGZvclxuICAgKiBldmVyeSBBbmd1bGFyIGFwcGxpY2F0aW9uIG9uIHRoZSBwYWdlIGFuZCBwcm92aWRlcyBzaW5nbGV0b24gcHJvdmlkZXJzLlxuICAgKi9cbiAgZ2V0IGluamVjdG9yKCk6IEluamVjdG9yIHtcbiAgICByZXR1cm4gdGhpcy5faW5qZWN0b3I7XG4gIH1cblxuICAvKipcbiAgICogRGVzdHJveXMgdGhlIGN1cnJlbnQgQW5ndWxhciBwbGF0Zm9ybSBhbmQgYWxsIEFuZ3VsYXIgYXBwbGljYXRpb25zIG9uIHRoZSBwYWdlLlxuICAgKiBEZXN0cm95cyBhbGwgbW9kdWxlcyBhbmQgbGlzdGVuZXJzIHJlZ2lzdGVyZWQgd2l0aCB0aGUgcGxhdGZvcm0uXG4gICAqL1xuICBkZXN0cm95KCkge1xuICAgIGlmICh0aGlzLl9kZXN0cm95ZWQpIHtcbiAgICAgIHRocm93IG5ldyBSdW50aW1lRXJyb3IoXG4gICAgICAgICAgUnVudGltZUVycm9yQ29kZS5QTEFURk9STV9BTFJFQURZX0RFU1RST1lFRCxcbiAgICAgICAgICBuZ0Rldk1vZGUgJiYgJ1RoZSBwbGF0Zm9ybSBoYXMgYWxyZWFkeSBiZWVuIGRlc3Ryb3llZCEnKTtcbiAgICB9XG4gICAgdGhpcy5fbW9kdWxlcy5zbGljZSgpLmZvckVhY2gobW9kdWxlID0+IG1vZHVsZS5kZXN0cm95KCkpO1xuICAgIHRoaXMuX2Rlc3Ryb3lMaXN0ZW5lcnMuZm9yRWFjaChsaXN0ZW5lciA9PiBsaXN0ZW5lcigpKTtcblxuICAgIGNvbnN0IGRlc3Ryb3lMaXN0ZW5lciA9IHRoaXMuX2luamVjdG9yLmdldChQTEFURk9STV9PTl9ERVNUUk9ZLCBudWxsKTtcbiAgICBkZXN0cm95TGlzdGVuZXI/LigpO1xuXG4gICAgdGhpcy5fZGVzdHJveWVkID0gdHJ1ZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbmRpY2F0ZXMgd2hldGhlciB0aGlzIGluc3RhbmNlIHdhcyBkZXN0cm95ZWQuXG4gICAqL1xuICBnZXQgZGVzdHJveWVkKCkge1xuICAgIHJldHVybiB0aGlzLl9kZXN0cm95ZWQ7XG4gIH1cbn1cblxuLy8gU2V0IG9mIG9wdGlvbnMgcmVjb2duaXplZCBieSB0aGUgTmdab25lLlxuaW50ZXJmYWNlIE5nWm9uZU9wdGlvbnMge1xuICBlbmFibGVMb25nU3RhY2tUcmFjZTogYm9vbGVhbjtcbiAgc2hvdWxkQ29hbGVzY2VFdmVudENoYW5nZURldGVjdGlvbjogYm9vbGVhbjtcbiAgc2hvdWxkQ29hbGVzY2VSdW5DaGFuZ2VEZXRlY3Rpb246IGJvb2xlYW47XG59XG5cbi8vIFRyYW5zZm9ybXMgYSBzZXQgb2YgYEJvb3RzdHJhcE9wdGlvbnNgIChzdXBwb3J0ZWQgYnkgdGhlIE5nTW9kdWxlLWJhc2VkIGJvb3RzdHJhcCBBUElzKSAtPlxuLy8gYE5nWm9uZU9wdGlvbnNgIHRoYXQgYXJlIHJlY29nbml6ZWQgYnkgdGhlIE5nWm9uZSBjb25zdHJ1Y3Rvci4gUGFzc2luZyBubyBvcHRpb25zIHdpbGwgcmVzdWx0IGluXG4vLyBhIHNldCBvZiBkZWZhdWx0IG9wdGlvbnMgcmV0dXJuZWQuXG5mdW5jdGlvbiBnZXROZ1pvbmVPcHRpb25zKG9wdGlvbnM/OiBCb290c3RyYXBPcHRpb25zKTogTmdab25lT3B0aW9ucyB7XG4gIHJldHVybiB7XG4gICAgZW5hYmxlTG9uZ1N0YWNrVHJhY2U6IHR5cGVvZiBuZ0Rldk1vZGUgPT09ICd1bmRlZmluZWQnID8gZmFsc2UgOiAhIW5nRGV2TW9kZSxcbiAgICBzaG91bGRDb2FsZXNjZUV2ZW50Q2hhbmdlRGV0ZWN0aW9uOiAhIShvcHRpb25zICYmIG9wdGlvbnMubmdab25lRXZlbnRDb2FsZXNjaW5nKSB8fCBmYWxzZSxcbiAgICBzaG91bGRDb2FsZXNjZVJ1bkNoYW5nZURldGVjdGlvbjogISEob3B0aW9ucyAmJiBvcHRpb25zLm5nWm9uZVJ1bkNvYWxlc2NpbmcpIHx8IGZhbHNlLFxuICB9O1xufVxuXG5mdW5jdGlvbiBnZXROZ1pvbmUobmdab25lVG9Vc2U6IE5nWm9uZXwnem9uZS5qcyd8J25vb3AnfHVuZGVmaW5lZCwgb3B0aW9uczogTmdab25lT3B0aW9ucyk6IE5nWm9uZSB7XG4gIGxldCBuZ1pvbmU6IE5nWm9uZTtcblxuICBpZiAobmdab25lVG9Vc2UgPT09ICdub29wJykge1xuICAgIG5nWm9uZSA9IG5ldyBOb29wTmdab25lKCk7XG4gIH0gZWxzZSB7XG4gICAgbmdab25lID0gKG5nWm9uZVRvVXNlID09PSAnem9uZS5qcycgPyB1bmRlZmluZWQgOiBuZ1pvbmVUb1VzZSkgfHwgbmV3IE5nWm9uZShvcHRpb25zKTtcbiAgfVxuICByZXR1cm4gbmdab25lO1xufVxuXG5mdW5jdGlvbiBfY2FsbEFuZFJlcG9ydFRvRXJyb3JIYW5kbGVyKFxuICAgIGVycm9ySGFuZGxlcjogRXJyb3JIYW5kbGVyLCBuZ1pvbmU6IE5nWm9uZSwgY2FsbGJhY2s6ICgpID0+IGFueSk6IGFueSB7XG4gIHRyeSB7XG4gICAgY29uc3QgcmVzdWx0ID0gY2FsbGJhY2soKTtcbiAgICBpZiAoaXNQcm9taXNlKHJlc3VsdCkpIHtcbiAgICAgIHJldHVybiByZXN1bHQuY2F0Y2goKGU6IGFueSkgPT4ge1xuICAgICAgICBuZ1pvbmUucnVuT3V0c2lkZUFuZ3VsYXIoKCkgPT4gZXJyb3JIYW5kbGVyLmhhbmRsZUVycm9yKGUpKTtcbiAgICAgICAgLy8gcmV0aHJvdyBhcyB0aGUgZXhjZXB0aW9uIGhhbmRsZXIgbWlnaHQgbm90IGRvIGl0XG4gICAgICAgIHRocm93IGU7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9IGNhdGNoIChlKSB7XG4gICAgbmdab25lLnJ1bk91dHNpZGVBbmd1bGFyKCgpID0+IGVycm9ySGFuZGxlci5oYW5kbGVFcnJvcihlKSk7XG4gICAgLy8gcmV0aHJvdyBhcyB0aGUgZXhjZXB0aW9uIGhhbmRsZXIgbWlnaHQgbm90IGRvIGl0XG4gICAgdGhyb3cgZTtcbiAgfVxufVxuXG5mdW5jdGlvbiBvcHRpb25zUmVkdWNlcjxUIGV4dGVuZHMgT2JqZWN0Pihkc3Q6IGFueSwgb2JqczogVHxUW10pOiBUIHtcbiAgaWYgKEFycmF5LmlzQXJyYXkob2JqcykpIHtcbiAgICBkc3QgPSBvYmpzLnJlZHVjZShvcHRpb25zUmVkdWNlciwgZHN0KTtcbiAgfSBlbHNlIHtcbiAgICBkc3QgPSB7Li4uZHN0LCAuLi4ob2JqcyBhcyBhbnkpfTtcbiAgfVxuICByZXR1cm4gZHN0O1xufVxuXG4vKipcbiAqIEEgcmVmZXJlbmNlIHRvIGFuIEFuZ3VsYXIgYXBwbGljYXRpb24gcnVubmluZyBvbiBhIHBhZ2UuXG4gKlxuICogQHVzYWdlTm90ZXNcbiAqXG4gKiB7QGEgaXMtc3RhYmxlLWV4YW1wbGVzfVxuICogIyMjIGlzU3RhYmxlIGV4YW1wbGVzIGFuZCBjYXZlYXRzXG4gKlxuICogTm90ZSB0d28gaW1wb3J0YW50IHBvaW50cyBhYm91dCBgaXNTdGFibGVgLCBkZW1vbnN0cmF0ZWQgaW4gdGhlIGV4YW1wbGVzIGJlbG93OlxuICogLSB0aGUgYXBwbGljYXRpb24gd2lsbCBuZXZlciBiZSBzdGFibGUgaWYgeW91IHN0YXJ0IGFueSBraW5kXG4gKiBvZiByZWN1cnJlbnQgYXN5bmNocm9ub3VzIHRhc2sgd2hlbiB0aGUgYXBwbGljYXRpb24gc3RhcnRzXG4gKiAoZm9yIGV4YW1wbGUgZm9yIGEgcG9sbGluZyBwcm9jZXNzLCBzdGFydGVkIHdpdGggYSBgc2V0SW50ZXJ2YWxgLCBhIGBzZXRUaW1lb3V0YFxuICogb3IgdXNpbmcgUnhKUyBvcGVyYXRvcnMgbGlrZSBgaW50ZXJ2YWxgKTtcbiAqIC0gdGhlIGBpc1N0YWJsZWAgT2JzZXJ2YWJsZSBydW5zIG91dHNpZGUgb2YgdGhlIEFuZ3VsYXIgem9uZS5cbiAqXG4gKiBMZXQncyBpbWFnaW5lIHRoYXQgeW91IHN0YXJ0IGEgcmVjdXJyZW50IHRhc2tcbiAqIChoZXJlIGluY3JlbWVudGluZyBhIGNvdW50ZXIsIHVzaW5nIFJ4SlMgYGludGVydmFsYCksXG4gKiBhbmQgYXQgdGhlIHNhbWUgdGltZSBzdWJzY3JpYmUgdG8gYGlzU3RhYmxlYC5cbiAqXG4gKiBgYGBcbiAqIGNvbnN0cnVjdG9yKGFwcFJlZjogQXBwbGljYXRpb25SZWYpIHtcbiAqICAgYXBwUmVmLmlzU3RhYmxlLnBpcGUoXG4gKiAgICAgIGZpbHRlcihzdGFibGUgPT4gc3RhYmxlKVxuICogICApLnN1YnNjcmliZSgoKSA9PiBjb25zb2xlLmxvZygnQXBwIGlzIHN0YWJsZSBub3cnKTtcbiAqICAgaW50ZXJ2YWwoMTAwMCkuc3Vic2NyaWJlKGNvdW50ZXIgPT4gY29uc29sZS5sb2coY291bnRlcikpO1xuICogfVxuICogYGBgXG4gKiBJbiB0aGlzIGV4YW1wbGUsIGBpc1N0YWJsZWAgd2lsbCBuZXZlciBlbWl0IGB0cnVlYCxcbiAqIGFuZCB0aGUgdHJhY2UgXCJBcHAgaXMgc3RhYmxlIG5vd1wiIHdpbGwgbmV2ZXIgZ2V0IGxvZ2dlZC5cbiAqXG4gKiBJZiB5b3Ugd2FudCB0byBleGVjdXRlIHNvbWV0aGluZyB3aGVuIHRoZSBhcHAgaXMgc3RhYmxlLFxuICogeW91IGhhdmUgdG8gd2FpdCBmb3IgdGhlIGFwcGxpY2F0aW9uIHRvIGJlIHN0YWJsZVxuICogYmVmb3JlIHN0YXJ0aW5nIHlvdXIgcG9sbGluZyBwcm9jZXNzLlxuICpcbiAqIGBgYFxuICogY29uc3RydWN0b3IoYXBwUmVmOiBBcHBsaWNhdGlvblJlZikge1xuICogICBhcHBSZWYuaXNTdGFibGUucGlwZShcbiAqICAgICBmaXJzdChzdGFibGUgPT4gc3RhYmxlKSxcbiAqICAgICB0YXAoc3RhYmxlID0+IGNvbnNvbGUubG9nKCdBcHAgaXMgc3RhYmxlIG5vdycpKSxcbiAqICAgICBzd2l0Y2hNYXAoKCkgPT4gaW50ZXJ2YWwoMTAwMCkpXG4gKiAgICkuc3Vic2NyaWJlKGNvdW50ZXIgPT4gY29uc29sZS5sb2coY291bnRlcikpO1xuICogfVxuICogYGBgXG4gKiBJbiB0aGlzIGV4YW1wbGUsIHRoZSB0cmFjZSBcIkFwcCBpcyBzdGFibGUgbm93XCIgd2lsbCBiZSBsb2dnZWRcbiAqIGFuZCB0aGVuIHRoZSBjb3VudGVyIHN0YXJ0cyBpbmNyZW1lbnRpbmcgZXZlcnkgc2Vjb25kLlxuICpcbiAqIE5vdGUgYWxzbyB0aGF0IHRoaXMgT2JzZXJ2YWJsZSBydW5zIG91dHNpZGUgb2YgdGhlIEFuZ3VsYXIgem9uZSxcbiAqIHdoaWNoIG1lYW5zIHRoYXQgdGhlIGNvZGUgaW4gdGhlIHN1YnNjcmlwdGlvblxuICogdG8gdGhpcyBPYnNlcnZhYmxlIHdpbGwgbm90IHRyaWdnZXIgdGhlIGNoYW5nZSBkZXRlY3Rpb24uXG4gKlxuICogTGV0J3MgaW1hZ2luZSB0aGF0IGluc3RlYWQgb2YgbG9nZ2luZyB0aGUgY291bnRlciB2YWx1ZSxcbiAqIHlvdSB1cGRhdGUgYSBmaWVsZCBvZiB5b3VyIGNvbXBvbmVudFxuICogYW5kIGRpc3BsYXkgaXQgaW4gaXRzIHRlbXBsYXRlLlxuICpcbiAqIGBgYFxuICogY29uc3RydWN0b3IoYXBwUmVmOiBBcHBsaWNhdGlvblJlZikge1xuICogICBhcHBSZWYuaXNTdGFibGUucGlwZShcbiAqICAgICBmaXJzdChzdGFibGUgPT4gc3RhYmxlKSxcbiAqICAgICBzd2l0Y2hNYXAoKCkgPT4gaW50ZXJ2YWwoMTAwMCkpXG4gKiAgICkuc3Vic2NyaWJlKGNvdW50ZXIgPT4gdGhpcy52YWx1ZSA9IGNvdW50ZXIpO1xuICogfVxuICogYGBgXG4gKiBBcyB0aGUgYGlzU3RhYmxlYCBPYnNlcnZhYmxlIHJ1bnMgb3V0c2lkZSB0aGUgem9uZSxcbiAqIHRoZSBgdmFsdWVgIGZpZWxkIHdpbGwgYmUgdXBkYXRlZCBwcm9wZXJseSxcbiAqIGJ1dCB0aGUgdGVtcGxhdGUgd2lsbCBub3QgYmUgcmVmcmVzaGVkIVxuICpcbiAqIFlvdSdsbCBoYXZlIHRvIG1hbnVhbGx5IHRyaWdnZXIgdGhlIGNoYW5nZSBkZXRlY3Rpb24gdG8gdXBkYXRlIHRoZSB0ZW1wbGF0ZS5cbiAqXG4gKiBgYGBcbiAqIGNvbnN0cnVjdG9yKGFwcFJlZjogQXBwbGljYXRpb25SZWYsIGNkOiBDaGFuZ2VEZXRlY3RvclJlZikge1xuICogICBhcHBSZWYuaXNTdGFibGUucGlwZShcbiAqICAgICBmaXJzdChzdGFibGUgPT4gc3RhYmxlKSxcbiAqICAgICBzd2l0Y2hNYXAoKCkgPT4gaW50ZXJ2YWwoMTAwMCkpXG4gKiAgICkuc3Vic2NyaWJlKGNvdW50ZXIgPT4ge1xuICogICAgIHRoaXMudmFsdWUgPSBjb3VudGVyO1xuICogICAgIGNkLmRldGVjdENoYW5nZXMoKTtcbiAqICAgfSk7XG4gKiB9XG4gKiBgYGBcbiAqXG4gKiBPciBtYWtlIHRoZSBzdWJzY3JpcHRpb24gY2FsbGJhY2sgcnVuIGluc2lkZSB0aGUgem9uZS5cbiAqXG4gKiBgYGBcbiAqIGNvbnN0cnVjdG9yKGFwcFJlZjogQXBwbGljYXRpb25SZWYsIHpvbmU6IE5nWm9uZSkge1xuICogICBhcHBSZWYuaXNTdGFibGUucGlwZShcbiAqICAgICBmaXJzdChzdGFibGUgPT4gc3RhYmxlKSxcbiAqICAgICBzd2l0Y2hNYXAoKCkgPT4gaW50ZXJ2YWwoMTAwMCkpXG4gKiAgICkuc3Vic2NyaWJlKGNvdW50ZXIgPT4gem9uZS5ydW4oKCkgPT4gdGhpcy52YWx1ZSA9IGNvdW50ZXIpKTtcbiAqIH1cbiAqIGBgYFxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuQEluamVjdGFibGUoe3Byb3ZpZGVkSW46ICdyb290J30pXG5leHBvcnQgY2xhc3MgQXBwbGljYXRpb25SZWYge1xuICAvKiogQGludGVybmFsICovXG4gIHByaXZhdGUgX2Jvb3RzdHJhcExpc3RlbmVyczogKChjb21wUmVmOiBDb21wb25lbnRSZWY8YW55PikgPT4gdm9pZClbXSA9IFtdO1xuICBwcml2YXRlIF92aWV3czogSW50ZXJuYWxWaWV3UmVmW10gPSBbXTtcbiAgcHJpdmF0ZSBfcnVubmluZ1RpY2s6IGJvb2xlYW4gPSBmYWxzZTtcbiAgcHJpdmF0ZSBfc3RhYmxlID0gdHJ1ZTtcbiAgcHJpdmF0ZSBfb25NaWNyb3Rhc2tFbXB0eVN1YnNjcmlwdGlvbjogU3Vic2NyaXB0aW9uO1xuICBwcml2YXRlIF9kZXN0cm95ZWQgPSBmYWxzZTtcbiAgcHJpdmF0ZSBfZGVzdHJveUxpc3RlbmVyczogQXJyYXk8KCkgPT4gdm9pZD4gPSBbXTtcblxuICAvKipcbiAgICogSW5kaWNhdGVzIHdoZXRoZXIgdGhpcyBpbnN0YW5jZSB3YXMgZGVzdHJveWVkLlxuICAgKi9cbiAgZ2V0IGRlc3Ryb3llZCgpIHtcbiAgICByZXR1cm4gdGhpcy5fZGVzdHJveWVkO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBhIGxpc3Qgb2YgY29tcG9uZW50IHR5cGVzIHJlZ2lzdGVyZWQgdG8gdGhpcyBhcHBsaWNhdGlvbi5cbiAgICogVGhpcyBsaXN0IGlzIHBvcHVsYXRlZCBldmVuIGJlZm9yZSB0aGUgY29tcG9uZW50IGlzIGNyZWF0ZWQuXG4gICAqL1xuICBwdWJsaWMgcmVhZG9ubHkgY29tcG9uZW50VHlwZXM6IFR5cGU8YW55PltdID0gW107XG5cbiAgLyoqXG4gICAqIEdldCBhIGxpc3Qgb2YgY29tcG9uZW50cyByZWdpc3RlcmVkIHRvIHRoaXMgYXBwbGljYXRpb24uXG4gICAqL1xuICBwdWJsaWMgcmVhZG9ubHkgY29tcG9uZW50czogQ29tcG9uZW50UmVmPGFueT5bXSA9IFtdO1xuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGFuIE9ic2VydmFibGUgdGhhdCBpbmRpY2F0ZXMgd2hlbiB0aGUgYXBwbGljYXRpb24gaXMgc3RhYmxlIG9yIHVuc3RhYmxlLlxuICAgKlxuICAgKiBAc2VlICBbVXNhZ2Ugbm90ZXNdKCNpcy1zdGFibGUtZXhhbXBsZXMpIGZvciBleGFtcGxlcyBhbmQgY2F2ZWF0cyB3aGVuIHVzaW5nIHRoaXMgQVBJLlxuICAgKi9cbiAgLy8gVE9ETyhpc3N1ZS8yNDU3MSk6IHJlbW92ZSAnIScuXG4gIHB1YmxpYyByZWFkb25seSBpc1N0YWJsZSE6IE9ic2VydmFibGU8Ym9vbGVhbj47XG5cbiAgLyoqIEBpbnRlcm5hbCAqL1xuICBnZXQgaW5qZWN0b3IoKTogSW5qZWN0b3Ige1xuICAgIHJldHVybiB0aGlzLl9pbmplY3RvcjtcbiAgfVxuXG4gIC8qKiBAaW50ZXJuYWwgKi9cbiAgY29uc3RydWN0b3IoXG4gICAgICBwcml2YXRlIF96b25lOiBOZ1pvbmUsIHByaXZhdGUgX2luamVjdG9yOiBJbmplY3RvciwgcHJpdmF0ZSBfZXhjZXB0aW9uSGFuZGxlcjogRXJyb3JIYW5kbGVyLFxuICAgICAgcHJpdmF0ZSBfaW5pdFN0YXR1czogQXBwbGljYXRpb25Jbml0U3RhdHVzKSB7XG4gICAgdGhpcy5fb25NaWNyb3Rhc2tFbXB0eVN1YnNjcmlwdGlvbiA9IHRoaXMuX3pvbmUub25NaWNyb3Rhc2tFbXB0eS5zdWJzY3JpYmUoe1xuICAgICAgbmV4dDogKCkgPT4ge1xuICAgICAgICB0aGlzLl96b25lLnJ1bigoKSA9PiB7XG4gICAgICAgICAgdGhpcy50aWNrKCk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgY29uc3QgaXNDdXJyZW50bHlTdGFibGUgPSBuZXcgT2JzZXJ2YWJsZTxib29sZWFuPigob2JzZXJ2ZXI6IE9ic2VydmVyPGJvb2xlYW4+KSA9PiB7XG4gICAgICB0aGlzLl9zdGFibGUgPSB0aGlzLl96b25lLmlzU3RhYmxlICYmICF0aGlzLl96b25lLmhhc1BlbmRpbmdNYWNyb3Rhc2tzICYmXG4gICAgICAgICAgIXRoaXMuX3pvbmUuaGFzUGVuZGluZ01pY3JvdGFza3M7XG4gICAgICB0aGlzLl96b25lLnJ1bk91dHNpZGVBbmd1bGFyKCgpID0+IHtcbiAgICAgICAgb2JzZXJ2ZXIubmV4dCh0aGlzLl9zdGFibGUpO1xuICAgICAgICBvYnNlcnZlci5jb21wbGV0ZSgpO1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBjb25zdCBpc1N0YWJsZSA9IG5ldyBPYnNlcnZhYmxlPGJvb2xlYW4+KChvYnNlcnZlcjogT2JzZXJ2ZXI8Ym9vbGVhbj4pID0+IHtcbiAgICAgIC8vIENyZWF0ZSB0aGUgc3Vic2NyaXB0aW9uIHRvIG9uU3RhYmxlIG91dHNpZGUgdGhlIEFuZ3VsYXIgWm9uZSBzbyB0aGF0XG4gICAgICAvLyB0aGUgY2FsbGJhY2sgaXMgcnVuIG91dHNpZGUgdGhlIEFuZ3VsYXIgWm9uZS5cbiAgICAgIGxldCBzdGFibGVTdWI6IFN1YnNjcmlwdGlvbjtcbiAgICAgIHRoaXMuX3pvbmUucnVuT3V0c2lkZUFuZ3VsYXIoKCkgPT4ge1xuICAgICAgICBzdGFibGVTdWIgPSB0aGlzLl96b25lLm9uU3RhYmxlLnN1YnNjcmliZSgoKSA9PiB7XG4gICAgICAgICAgTmdab25lLmFzc2VydE5vdEluQW5ndWxhclpvbmUoKTtcblxuICAgICAgICAgIC8vIENoZWNrIHdoZXRoZXIgdGhlcmUgYXJlIG5vIHBlbmRpbmcgbWFjcm8vbWljcm8gdGFza3MgaW4gdGhlIG5leHQgdGlja1xuICAgICAgICAgIC8vIHRvIGFsbG93IGZvciBOZ1pvbmUgdG8gdXBkYXRlIHRoZSBzdGF0ZS5cbiAgICAgICAgICBzY2hlZHVsZU1pY3JvVGFzaygoKSA9PiB7XG4gICAgICAgICAgICBpZiAoIXRoaXMuX3N0YWJsZSAmJiAhdGhpcy5fem9uZS5oYXNQZW5kaW5nTWFjcm90YXNrcyAmJlxuICAgICAgICAgICAgICAgICF0aGlzLl96b25lLmhhc1BlbmRpbmdNaWNyb3Rhc2tzKSB7XG4gICAgICAgICAgICAgIHRoaXMuX3N0YWJsZSA9IHRydWU7XG4gICAgICAgICAgICAgIG9ic2VydmVyLm5leHQodHJ1ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG5cbiAgICAgIGNvbnN0IHVuc3RhYmxlU3ViOiBTdWJzY3JpcHRpb24gPSB0aGlzLl96b25lLm9uVW5zdGFibGUuc3Vic2NyaWJlKCgpID0+IHtcbiAgICAgICAgTmdab25lLmFzc2VydEluQW5ndWxhclpvbmUoKTtcbiAgICAgICAgaWYgKHRoaXMuX3N0YWJsZSkge1xuICAgICAgICAgIHRoaXMuX3N0YWJsZSA9IGZhbHNlO1xuICAgICAgICAgIHRoaXMuX3pvbmUucnVuT3V0c2lkZUFuZ3VsYXIoKCkgPT4ge1xuICAgICAgICAgICAgb2JzZXJ2ZXIubmV4dChmYWxzZSk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgICBzdGFibGVTdWIudW5zdWJzY3JpYmUoKTtcbiAgICAgICAgdW5zdGFibGVTdWIudW5zdWJzY3JpYmUoKTtcbiAgICAgIH07XG4gICAgfSk7XG5cbiAgICAodGhpcyBhcyB7aXNTdGFibGU6IE9ic2VydmFibGU8Ym9vbGVhbj59KS5pc1N0YWJsZSA9XG4gICAgICAgIG1lcmdlKGlzQ3VycmVudGx5U3RhYmxlLCBpc1N0YWJsZS5waXBlKHNoYXJlKCkpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBCb290c3RyYXAgYSBjb21wb25lbnQgb250byB0aGUgZWxlbWVudCBpZGVudGlmaWVkIGJ5IGl0cyBzZWxlY3RvciBvciwgb3B0aW9uYWxseSwgdG8gYVxuICAgKiBzcGVjaWZpZWQgZWxlbWVudC5cbiAgICpcbiAgICogQHVzYWdlTm90ZXNcbiAgICogIyMjIEJvb3RzdHJhcCBwcm9jZXNzXG4gICAqXG4gICAqIFdoZW4gYm9vdHN0cmFwcGluZyBhIGNvbXBvbmVudCwgQW5ndWxhciBtb3VudHMgaXQgb250byBhIHRhcmdldCBET00gZWxlbWVudFxuICAgKiBhbmQga2lja3Mgb2ZmIGF1dG9tYXRpYyBjaGFuZ2UgZGV0ZWN0aW9uLiBUaGUgdGFyZ2V0IERPTSBlbGVtZW50IGNhbiBiZVxuICAgKiBwcm92aWRlZCB1c2luZyB0aGUgYHJvb3RTZWxlY3Rvck9yTm9kZWAgYXJndW1lbnQuXG4gICAqXG4gICAqIElmIHRoZSB0YXJnZXQgRE9NIGVsZW1lbnQgaXMgbm90IHByb3ZpZGVkLCBBbmd1bGFyIHRyaWVzIHRvIGZpbmQgb25lIG9uIGEgcGFnZVxuICAgKiB1c2luZyB0aGUgYHNlbGVjdG9yYCBvZiB0aGUgY29tcG9uZW50IHRoYXQgaXMgYmVpbmcgYm9vdHN0cmFwcGVkXG4gICAqIChmaXJzdCBtYXRjaGVkIGVsZW1lbnQgaXMgdXNlZCkuXG4gICAqXG4gICAqICMjIyBFeGFtcGxlXG4gICAqXG4gICAqIEdlbmVyYWxseSwgd2UgZGVmaW5lIHRoZSBjb21wb25lbnQgdG8gYm9vdHN0cmFwIGluIHRoZSBgYm9vdHN0cmFwYCBhcnJheSBvZiBgTmdNb2R1bGVgLFxuICAgKiBidXQgaXQgcmVxdWlyZXMgdXMgdG8ga25vdyB0aGUgY29tcG9uZW50IHdoaWxlIHdyaXRpbmcgdGhlIGFwcGxpY2F0aW9uIGNvZGUuXG4gICAqXG4gICAqIEltYWdpbmUgYSBzaXR1YXRpb24gd2hlcmUgd2UgaGF2ZSB0byB3YWl0IGZvciBhbiBBUEkgY2FsbCB0byBkZWNpZGUgYWJvdXQgdGhlIGNvbXBvbmVudCB0b1xuICAgKiBib290c3RyYXAuIFdlIGNhbiB1c2UgdGhlIGBuZ0RvQm9vdHN0cmFwYCBob29rIG9mIHRoZSBgTmdNb2R1bGVgIGFuZCBjYWxsIHRoaXMgbWV0aG9kIHRvXG4gICAqIGR5bmFtaWNhbGx5IGJvb3RzdHJhcCBhIGNvbXBvbmVudC5cbiAgICpcbiAgICoge0BleGFtcGxlIGNvcmUvdHMvcGxhdGZvcm0vcGxhdGZvcm0udHMgcmVnaW9uPSdjb21wb25lbnRTZWxlY3Rvcid9XG4gICAqXG4gICAqIE9wdGlvbmFsbHksIGEgY29tcG9uZW50IGNhbiBiZSBtb3VudGVkIG9udG8gYSBET00gZWxlbWVudCB0aGF0IGRvZXMgbm90IG1hdGNoIHRoZVxuICAgKiBzZWxlY3RvciBvZiB0aGUgYm9vdHN0cmFwcGVkIGNvbXBvbmVudC5cbiAgICpcbiAgICogSW4gdGhlIGZvbGxvd2luZyBleGFtcGxlLCB3ZSBhcmUgcHJvdmlkaW5nIGEgQ1NTIHNlbGVjdG9yIHRvIG1hdGNoIHRoZSB0YXJnZXQgZWxlbWVudC5cbiAgICpcbiAgICoge0BleGFtcGxlIGNvcmUvdHMvcGxhdGZvcm0vcGxhdGZvcm0udHMgcmVnaW9uPSdjc3NTZWxlY3Rvcid9XG4gICAqXG4gICAqIFdoaWxlIGluIHRoaXMgZXhhbXBsZSwgd2UgYXJlIHByb3ZpZGluZyByZWZlcmVuY2UgdG8gYSBET00gbm9kZS5cbiAgICpcbiAgICoge0BleGFtcGxlIGNvcmUvdHMvcGxhdGZvcm0vcGxhdGZvcm0udHMgcmVnaW9uPSdkb21Ob2RlJ31cbiAgICovXG4gIGJvb3RzdHJhcDxDPihjb21wb25lbnQ6IFR5cGU8Qz4sIHJvb3RTZWxlY3Rvck9yTm9kZT86IHN0cmluZ3xhbnkpOiBDb21wb25lbnRSZWY8Qz47XG5cbiAgLyoqXG4gICAqIEJvb3RzdHJhcCBhIGNvbXBvbmVudCBvbnRvIHRoZSBlbGVtZW50IGlkZW50aWZpZWQgYnkgaXRzIHNlbGVjdG9yIG9yLCBvcHRpb25hbGx5LCB0byBhXG4gICAqIHNwZWNpZmllZCBlbGVtZW50LlxuICAgKlxuICAgKiBAdXNhZ2VOb3Rlc1xuICAgKiAjIyMgQm9vdHN0cmFwIHByb2Nlc3NcbiAgICpcbiAgICogV2hlbiBib290c3RyYXBwaW5nIGEgY29tcG9uZW50LCBBbmd1bGFyIG1vdW50cyBpdCBvbnRvIGEgdGFyZ2V0IERPTSBlbGVtZW50XG4gICAqIGFuZCBraWNrcyBvZmYgYXV0b21hdGljIGNoYW5nZSBkZXRlY3Rpb24uIFRoZSB0YXJnZXQgRE9NIGVsZW1lbnQgY2FuIGJlXG4gICAqIHByb3ZpZGVkIHVzaW5nIHRoZSBgcm9vdFNlbGVjdG9yT3JOb2RlYCBhcmd1bWVudC5cbiAgICpcbiAgICogSWYgdGhlIHRhcmdldCBET00gZWxlbWVudCBpcyBub3QgcHJvdmlkZWQsIEFuZ3VsYXIgdHJpZXMgdG8gZmluZCBvbmUgb24gYSBwYWdlXG4gICAqIHVzaW5nIHRoZSBgc2VsZWN0b3JgIG9mIHRoZSBjb21wb25lbnQgdGhhdCBpcyBiZWluZyBib290c3RyYXBwZWRcbiAgICogKGZpcnN0IG1hdGNoZWQgZWxlbWVudCBpcyB1c2VkKS5cbiAgICpcbiAgICogIyMjIEV4YW1wbGVcbiAgICpcbiAgICogR2VuZXJhbGx5LCB3ZSBkZWZpbmUgdGhlIGNvbXBvbmVudCB0byBib290c3RyYXAgaW4gdGhlIGBib290c3RyYXBgIGFycmF5IG9mIGBOZ01vZHVsZWAsXG4gICAqIGJ1dCBpdCByZXF1aXJlcyB1cyB0byBrbm93IHRoZSBjb21wb25lbnQgd2hpbGUgd3JpdGluZyB0aGUgYXBwbGljYXRpb24gY29kZS5cbiAgICpcbiAgICogSW1hZ2luZSBhIHNpdHVhdGlvbiB3aGVyZSB3ZSBoYXZlIHRvIHdhaXQgZm9yIGFuIEFQSSBjYWxsIHRvIGRlY2lkZSBhYm91dCB0aGUgY29tcG9uZW50IHRvXG4gICAqIGJvb3RzdHJhcC4gV2UgY2FuIHVzZSB0aGUgYG5nRG9Cb290c3RyYXBgIGhvb2sgb2YgdGhlIGBOZ01vZHVsZWAgYW5kIGNhbGwgdGhpcyBtZXRob2QgdG9cbiAgICogZHluYW1pY2FsbHkgYm9vdHN0cmFwIGEgY29tcG9uZW50LlxuICAgKlxuICAgKiB7QGV4YW1wbGUgY29yZS90cy9wbGF0Zm9ybS9wbGF0Zm9ybS50cyByZWdpb249J2NvbXBvbmVudFNlbGVjdG9yJ31cbiAgICpcbiAgICogT3B0aW9uYWxseSwgYSBjb21wb25lbnQgY2FuIGJlIG1vdW50ZWQgb250byBhIERPTSBlbGVtZW50IHRoYXQgZG9lcyBub3QgbWF0Y2ggdGhlXG4gICAqIHNlbGVjdG9yIG9mIHRoZSBib290c3RyYXBwZWQgY29tcG9uZW50LlxuICAgKlxuICAgKiBJbiB0aGUgZm9sbG93aW5nIGV4YW1wbGUsIHdlIGFyZSBwcm92aWRpbmcgYSBDU1Mgc2VsZWN0b3IgdG8gbWF0Y2ggdGhlIHRhcmdldCBlbGVtZW50LlxuICAgKlxuICAgKiB7QGV4YW1wbGUgY29yZS90cy9wbGF0Zm9ybS9wbGF0Zm9ybS50cyByZWdpb249J2Nzc1NlbGVjdG9yJ31cbiAgICpcbiAgICogV2hpbGUgaW4gdGhpcyBleGFtcGxlLCB3ZSBhcmUgcHJvdmlkaW5nIHJlZmVyZW5jZSB0byBhIERPTSBub2RlLlxuICAgKlxuICAgKiB7QGV4YW1wbGUgY29yZS90cy9wbGF0Zm9ybS9wbGF0Zm9ybS50cyByZWdpb249J2RvbU5vZGUnfVxuICAgKlxuICAgKiBAZGVwcmVjYXRlZCBQYXNzaW5nIENvbXBvbmVudCBmYWN0b3JpZXMgYXMgdGhlIGBBcHBsaWNhdGlvbi5ib290c3RyYXBgIGZ1bmN0aW9uIGFyZ3VtZW50IGlzXG4gICAqICAgICBkZXByZWNhdGVkLiBQYXNzIENvbXBvbmVudCBUeXBlcyBpbnN0ZWFkLlxuICAgKi9cbiAgYm9vdHN0cmFwPEM+KGNvbXBvbmVudEZhY3Rvcnk6IENvbXBvbmVudEZhY3Rvcnk8Qz4sIHJvb3RTZWxlY3Rvck9yTm9kZT86IHN0cmluZ3xhbnkpOlxuICAgICAgQ29tcG9uZW50UmVmPEM+O1xuXG4gIC8qKlxuICAgKiBCb290c3RyYXAgYSBjb21wb25lbnQgb250byB0aGUgZWxlbWVudCBpZGVudGlmaWVkIGJ5IGl0cyBzZWxlY3RvciBvciwgb3B0aW9uYWxseSwgdG8gYVxuICAgKiBzcGVjaWZpZWQgZWxlbWVudC5cbiAgICpcbiAgICogQHVzYWdlTm90ZXNcbiAgICogIyMjIEJvb3RzdHJhcCBwcm9jZXNzXG4gICAqXG4gICAqIFdoZW4gYm9vdHN0cmFwcGluZyBhIGNvbXBvbmVudCwgQW5ndWxhciBtb3VudHMgaXQgb250byBhIHRhcmdldCBET00gZWxlbWVudFxuICAgKiBhbmQga2lja3Mgb2ZmIGF1dG9tYXRpYyBjaGFuZ2UgZGV0ZWN0aW9uLiBUaGUgdGFyZ2V0IERPTSBlbGVtZW50IGNhbiBiZVxuICAgKiBwcm92aWRlZCB1c2luZyB0aGUgYHJvb3RTZWxlY3Rvck9yTm9kZWAgYXJndW1lbnQuXG4gICAqXG4gICAqIElmIHRoZSB0YXJnZXQgRE9NIGVsZW1lbnQgaXMgbm90IHByb3ZpZGVkLCBBbmd1bGFyIHRyaWVzIHRvIGZpbmQgb25lIG9uIGEgcGFnZVxuICAgKiB1c2luZyB0aGUgYHNlbGVjdG9yYCBvZiB0aGUgY29tcG9uZW50IHRoYXQgaXMgYmVpbmcgYm9vdHN0cmFwcGVkXG4gICAqIChmaXJzdCBtYXRjaGVkIGVsZW1lbnQgaXMgdXNlZCkuXG4gICAqXG4gICAqICMjIyBFeGFtcGxlXG4gICAqXG4gICAqIEdlbmVyYWxseSwgd2UgZGVmaW5lIHRoZSBjb21wb25lbnQgdG8gYm9vdHN0cmFwIGluIHRoZSBgYm9vdHN0cmFwYCBhcnJheSBvZiBgTmdNb2R1bGVgLFxuICAgKiBidXQgaXQgcmVxdWlyZXMgdXMgdG8ga25vdyB0aGUgY29tcG9uZW50IHdoaWxlIHdyaXRpbmcgdGhlIGFwcGxpY2F0aW9uIGNvZGUuXG4gICAqXG4gICAqIEltYWdpbmUgYSBzaXR1YXRpb24gd2hlcmUgd2UgaGF2ZSB0byB3YWl0IGZvciBhbiBBUEkgY2FsbCB0byBkZWNpZGUgYWJvdXQgdGhlIGNvbXBvbmVudCB0b1xuICAgKiBib290c3RyYXAuIFdlIGNhbiB1c2UgdGhlIGBuZ0RvQm9vdHN0cmFwYCBob29rIG9mIHRoZSBgTmdNb2R1bGVgIGFuZCBjYWxsIHRoaXMgbWV0aG9kIHRvXG4gICAqIGR5bmFtaWNhbGx5IGJvb3RzdHJhcCBhIGNvbXBvbmVudC5cbiAgICpcbiAgICoge0BleGFtcGxlIGNvcmUvdHMvcGxhdGZvcm0vcGxhdGZvcm0udHMgcmVnaW9uPSdjb21wb25lbnRTZWxlY3Rvcid9XG4gICAqXG4gICAqIE9wdGlvbmFsbHksIGEgY29tcG9uZW50IGNhbiBiZSBtb3VudGVkIG9udG8gYSBET00gZWxlbWVudCB0aGF0IGRvZXMgbm90IG1hdGNoIHRoZVxuICAgKiBzZWxlY3RvciBvZiB0aGUgYm9vdHN0cmFwcGVkIGNvbXBvbmVudC5cbiAgICpcbiAgICogSW4gdGhlIGZvbGxvd2luZyBleGFtcGxlLCB3ZSBhcmUgcHJvdmlkaW5nIGEgQ1NTIHNlbGVjdG9yIHRvIG1hdGNoIHRoZSB0YXJnZXQgZWxlbWVudC5cbiAgICpcbiAgICoge0BleGFtcGxlIGNvcmUvdHMvcGxhdGZvcm0vcGxhdGZvcm0udHMgcmVnaW9uPSdjc3NTZWxlY3Rvcid9XG4gICAqXG4gICAqIFdoaWxlIGluIHRoaXMgZXhhbXBsZSwgd2UgYXJlIHByb3ZpZGluZyByZWZlcmVuY2UgdG8gYSBET00gbm9kZS5cbiAgICpcbiAgICoge0BleGFtcGxlIGNvcmUvdHMvcGxhdGZvcm0vcGxhdGZvcm0udHMgcmVnaW9uPSdkb21Ob2RlJ31cbiAgICovXG4gIGJvb3RzdHJhcDxDPihjb21wb25lbnRPckZhY3Rvcnk6IENvbXBvbmVudEZhY3Rvcnk8Qz58VHlwZTxDPiwgcm9vdFNlbGVjdG9yT3JOb2RlPzogc3RyaW5nfGFueSk6XG4gICAgICBDb21wb25lbnRSZWY8Qz4ge1xuICAgIE5HX0RFVl9NT0RFICYmIHRoaXMud2FybklmRGVzdHJveWVkKCk7XG4gICAgY29uc3QgaXNDb21wb25lbnRGYWN0b3J5ID0gY29tcG9uZW50T3JGYWN0b3J5IGluc3RhbmNlb2YgQ29tcG9uZW50RmFjdG9yeTtcblxuICAgIGlmICghdGhpcy5faW5pdFN0YXR1cy5kb25lKSB7XG4gICAgICBjb25zdCBzdGFuZGFsb25lID0gIWlzQ29tcG9uZW50RmFjdG9yeSAmJiBpc1N0YW5kYWxvbmUoY29tcG9uZW50T3JGYWN0b3J5KTtcbiAgICAgIGNvbnN0IGVycm9yTWVzc2FnZSA9XG4gICAgICAgICAgJ0Nhbm5vdCBib290c3RyYXAgYXMgdGhlcmUgYXJlIHN0aWxsIGFzeW5jaHJvbm91cyBpbml0aWFsaXplcnMgcnVubmluZy4nICtcbiAgICAgICAgICAoc3RhbmRhbG9uZSA/ICcnIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICcgQm9vdHN0cmFwIGNvbXBvbmVudHMgaW4gdGhlIGBuZ0RvQm9vdHN0cmFwYCBtZXRob2Qgb2YgdGhlIHJvb3QgbW9kdWxlLicpO1xuICAgICAgdGhyb3cgbmV3IFJ1bnRpbWVFcnJvcihcbiAgICAgICAgICBSdW50aW1lRXJyb3JDb2RlLkFTWU5DX0lOSVRJQUxJWkVSU19TVElMTF9SVU5OSU5HLCBOR19ERVZfTU9ERSAmJiBlcnJvck1lc3NhZ2UpO1xuICAgIH1cblxuICAgIGxldCBjb21wb25lbnRGYWN0b3J5OiBDb21wb25lbnRGYWN0b3J5PEM+O1xuICAgIGlmIChpc0NvbXBvbmVudEZhY3RvcnkpIHtcbiAgICAgIGNvbXBvbmVudEZhY3RvcnkgPSBjb21wb25lbnRPckZhY3Rvcnk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IHJlc29sdmVyID0gdGhpcy5faW5qZWN0b3IuZ2V0KENvbXBvbmVudEZhY3RvcnlSZXNvbHZlcik7XG4gICAgICBjb21wb25lbnRGYWN0b3J5ID0gcmVzb2x2ZXIucmVzb2x2ZUNvbXBvbmVudEZhY3RvcnkoY29tcG9uZW50T3JGYWN0b3J5KSE7XG4gICAgfVxuICAgIHRoaXMuY29tcG9uZW50VHlwZXMucHVzaChjb21wb25lbnRGYWN0b3J5LmNvbXBvbmVudFR5cGUpO1xuXG4gICAgLy8gQ3JlYXRlIGEgZmFjdG9yeSBhc3NvY2lhdGVkIHdpdGggdGhlIGN1cnJlbnQgbW9kdWxlIGlmIGl0J3Mgbm90IGJvdW5kIHRvIHNvbWUgb3RoZXJcbiAgICBjb25zdCBuZ01vZHVsZSA9XG4gICAgICAgIGlzQm91bmRUb01vZHVsZShjb21wb25lbnRGYWN0b3J5KSA/IHVuZGVmaW5lZCA6IHRoaXMuX2luamVjdG9yLmdldChOZ01vZHVsZVJlZik7XG4gICAgY29uc3Qgc2VsZWN0b3JPck5vZGUgPSByb290U2VsZWN0b3JPck5vZGUgfHwgY29tcG9uZW50RmFjdG9yeS5zZWxlY3RvcjtcbiAgICBjb25zdCBjb21wUmVmID0gY29tcG9uZW50RmFjdG9yeS5jcmVhdGUoSW5qZWN0b3IuTlVMTCwgW10sIHNlbGVjdG9yT3JOb2RlLCBuZ01vZHVsZSk7XG4gICAgY29uc3QgbmF0aXZlRWxlbWVudCA9IGNvbXBSZWYubG9jYXRpb24ubmF0aXZlRWxlbWVudDtcbiAgICBjb25zdCB0ZXN0YWJpbGl0eSA9IGNvbXBSZWYuaW5qZWN0b3IuZ2V0KFRFU1RBQklMSVRZLCBudWxsKTtcbiAgICB0ZXN0YWJpbGl0eT8ucmVnaXN0ZXJBcHBsaWNhdGlvbihuYXRpdmVFbGVtZW50KTtcblxuICAgIGNvbXBSZWYub25EZXN0cm95KCgpID0+IHtcbiAgICAgIHRoaXMuZGV0YWNoVmlldyhjb21wUmVmLmhvc3RWaWV3KTtcbiAgICAgIHJlbW92ZSh0aGlzLmNvbXBvbmVudHMsIGNvbXBSZWYpO1xuICAgICAgdGVzdGFiaWxpdHk/LnVucmVnaXN0ZXJBcHBsaWNhdGlvbihuYXRpdmVFbGVtZW50KTtcbiAgICB9KTtcblxuICAgIHRoaXMuX2xvYWRDb21wb25lbnQoY29tcFJlZik7XG4gICAgaWYgKHR5cGVvZiBuZ0Rldk1vZGUgPT09ICd1bmRlZmluZWQnIHx8IG5nRGV2TW9kZSkge1xuICAgICAgY29uc3QgX2NvbnNvbGUgPSB0aGlzLl9pbmplY3Rvci5nZXQoQ29uc29sZSk7XG4gICAgICBfY29uc29sZS5sb2coXG4gICAgICAgICAgYEFuZ3VsYXIgaXMgcnVubmluZyBpbiBkZXZlbG9wbWVudCBtb2RlLiBDYWxsIGVuYWJsZVByb2RNb2RlKCkgdG8gZW5hYmxlIHByb2R1Y3Rpb24gbW9kZS5gKTtcbiAgICB9XG4gICAgcmV0dXJuIGNvbXBSZWY7XG4gIH1cblxuICAvKipcbiAgICogSW52b2tlIHRoaXMgbWV0aG9kIHRvIGV4cGxpY2l0bHkgcHJvY2VzcyBjaGFuZ2UgZGV0ZWN0aW9uIGFuZCBpdHMgc2lkZS1lZmZlY3RzLlxuICAgKlxuICAgKiBJbiBkZXZlbG9wbWVudCBtb2RlLCBgdGljaygpYCBhbHNvIHBlcmZvcm1zIGEgc2Vjb25kIGNoYW5nZSBkZXRlY3Rpb24gY3ljbGUgdG8gZW5zdXJlIHRoYXQgbm9cbiAgICogZnVydGhlciBjaGFuZ2VzIGFyZSBkZXRlY3RlZC4gSWYgYWRkaXRpb25hbCBjaGFuZ2VzIGFyZSBwaWNrZWQgdXAgZHVyaW5nIHRoaXMgc2Vjb25kIGN5Y2xlLFxuICAgKiBiaW5kaW5ncyBpbiB0aGUgYXBwIGhhdmUgc2lkZS1lZmZlY3RzIHRoYXQgY2Fubm90IGJlIHJlc29sdmVkIGluIGEgc2luZ2xlIGNoYW5nZSBkZXRlY3Rpb25cbiAgICogcGFzcy5cbiAgICogSW4gdGhpcyBjYXNlLCBBbmd1bGFyIHRocm93cyBhbiBlcnJvciwgc2luY2UgYW4gQW5ndWxhciBhcHBsaWNhdGlvbiBjYW4gb25seSBoYXZlIG9uZSBjaGFuZ2VcbiAgICogZGV0ZWN0aW9uIHBhc3MgZHVyaW5nIHdoaWNoIGFsbCBjaGFuZ2UgZGV0ZWN0aW9uIG11c3QgY29tcGxldGUuXG4gICAqL1xuICB0aWNrKCk6IHZvaWQge1xuICAgIE5HX0RFVl9NT0RFICYmIHRoaXMud2FybklmRGVzdHJveWVkKCk7XG4gICAgaWYgKHRoaXMuX3J1bm5pbmdUaWNrKSB7XG4gICAgICB0aHJvdyBuZXcgUnVudGltZUVycm9yKFxuICAgICAgICAgIFJ1bnRpbWVFcnJvckNvZGUuUkVDVVJTSVZFX0FQUExJQ0FUSU9OX1JFRl9USUNLLFxuICAgICAgICAgIG5nRGV2TW9kZSAmJiAnQXBwbGljYXRpb25SZWYudGljayBpcyBjYWxsZWQgcmVjdXJzaXZlbHknKTtcbiAgICB9XG5cbiAgICB0cnkge1xuICAgICAgdGhpcy5fcnVubmluZ1RpY2sgPSB0cnVlO1xuICAgICAgZm9yIChsZXQgdmlldyBvZiB0aGlzLl92aWV3cykge1xuICAgICAgICB2aWV3LmRldGVjdENoYW5nZXMoKTtcbiAgICAgIH1cbiAgICAgIGlmICh0eXBlb2YgbmdEZXZNb2RlID09PSAndW5kZWZpbmVkJyB8fCBuZ0Rldk1vZGUpIHtcbiAgICAgICAgZm9yIChsZXQgdmlldyBvZiB0aGlzLl92aWV3cykge1xuICAgICAgICAgIHZpZXcuY2hlY2tOb0NoYW5nZXMoKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIC8vIEF0dGVudGlvbjogRG9uJ3QgcmV0aHJvdyBhcyBpdCBjb3VsZCBjYW5jZWwgc3Vic2NyaXB0aW9ucyB0byBPYnNlcnZhYmxlcyFcbiAgICAgIHRoaXMuX3pvbmUucnVuT3V0c2lkZUFuZ3VsYXIoKCkgPT4gdGhpcy5fZXhjZXB0aW9uSGFuZGxlci5oYW5kbGVFcnJvcihlKSk7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIHRoaXMuX3J1bm5pbmdUaWNrID0gZmFsc2U7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEF0dGFjaGVzIGEgdmlldyBzbyB0aGF0IGl0IHdpbGwgYmUgZGlydHkgY2hlY2tlZC5cbiAgICogVGhlIHZpZXcgd2lsbCBiZSBhdXRvbWF0aWNhbGx5IGRldGFjaGVkIHdoZW4gaXQgaXMgZGVzdHJveWVkLlxuICAgKiBUaGlzIHdpbGwgdGhyb3cgaWYgdGhlIHZpZXcgaXMgYWxyZWFkeSBhdHRhY2hlZCB0byBhIFZpZXdDb250YWluZXIuXG4gICAqL1xuICBhdHRhY2hWaWV3KHZpZXdSZWY6IFZpZXdSZWYpOiB2b2lkIHtcbiAgICBOR19ERVZfTU9ERSAmJiB0aGlzLndhcm5JZkRlc3Ryb3llZCgpO1xuICAgIGNvbnN0IHZpZXcgPSAodmlld1JlZiBhcyBJbnRlcm5hbFZpZXdSZWYpO1xuICAgIHRoaXMuX3ZpZXdzLnB1c2godmlldyk7XG4gICAgdmlldy5hdHRhY2hUb0FwcFJlZih0aGlzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZXRhY2hlcyBhIHZpZXcgZnJvbSBkaXJ0eSBjaGVja2luZyBhZ2Fpbi5cbiAgICovXG4gIGRldGFjaFZpZXcodmlld1JlZjogVmlld1JlZik6IHZvaWQge1xuICAgIE5HX0RFVl9NT0RFICYmIHRoaXMud2FybklmRGVzdHJveWVkKCk7XG4gICAgY29uc3QgdmlldyA9ICh2aWV3UmVmIGFzIEludGVybmFsVmlld1JlZik7XG4gICAgcmVtb3ZlKHRoaXMuX3ZpZXdzLCB2aWV3KTtcbiAgICB2aWV3LmRldGFjaEZyb21BcHBSZWYoKTtcbiAgfVxuXG4gIHByaXZhdGUgX2xvYWRDb21wb25lbnQoY29tcG9uZW50UmVmOiBDb21wb25lbnRSZWY8YW55Pik6IHZvaWQge1xuICAgIHRoaXMuYXR0YWNoVmlldyhjb21wb25lbnRSZWYuaG9zdFZpZXcpO1xuICAgIHRoaXMudGljaygpO1xuICAgIHRoaXMuY29tcG9uZW50cy5wdXNoKGNvbXBvbmVudFJlZik7XG4gICAgLy8gR2V0IHRoZSBsaXN0ZW5lcnMgbGF6aWx5IHRvIHByZXZlbnQgREkgY3ljbGVzLlxuICAgIGNvbnN0IGxpc3RlbmVycyA9XG4gICAgICAgIHRoaXMuX2luamVjdG9yLmdldChBUFBfQk9PVFNUUkFQX0xJU1RFTkVSLCBbXSkuY29uY2F0KHRoaXMuX2Jvb3RzdHJhcExpc3RlbmVycyk7XG4gICAgbGlzdGVuZXJzLmZvckVhY2goKGxpc3RlbmVyKSA9PiBsaXN0ZW5lcihjb21wb25lbnRSZWYpKTtcbiAgfVxuXG4gIC8qKiBAaW50ZXJuYWwgKi9cbiAgbmdPbkRlc3Ryb3koKSB7XG4gICAgaWYgKHRoaXMuX2Rlc3Ryb3llZCkgcmV0dXJuO1xuXG4gICAgdHJ5IHtcbiAgICAgIC8vIENhbGwgYWxsIHRoZSBsaWZlY3ljbGUgaG9va3MuXG4gICAgICB0aGlzLl9kZXN0cm95TGlzdGVuZXJzLmZvckVhY2gobGlzdGVuZXIgPT4gbGlzdGVuZXIoKSk7XG5cbiAgICAgIC8vIERlc3Ryb3kgYWxsIHJlZ2lzdGVyZWQgdmlld3MuXG4gICAgICB0aGlzLl92aWV3cy5zbGljZSgpLmZvckVhY2goKHZpZXcpID0+IHZpZXcuZGVzdHJveSgpKTtcbiAgICAgIHRoaXMuX29uTWljcm90YXNrRW1wdHlTdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgLy8gSW5kaWNhdGUgdGhhdCB0aGlzIGluc3RhbmNlIGlzIGRlc3Ryb3llZC5cbiAgICAgIHRoaXMuX2Rlc3Ryb3llZCA9IHRydWU7XG5cbiAgICAgIC8vIFJlbGVhc2UgYWxsIHJlZmVyZW5jZXMuXG4gICAgICB0aGlzLl92aWV3cyA9IFtdO1xuICAgICAgdGhpcy5fYm9vdHN0cmFwTGlzdGVuZXJzID0gW107XG4gICAgICB0aGlzLl9kZXN0cm95TGlzdGVuZXJzID0gW107XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFJlZ2lzdGVycyBhIGxpc3RlbmVyIHRvIGJlIGNhbGxlZCB3aGVuIGFuIGluc3RhbmNlIGlzIGRlc3Ryb3llZC5cbiAgICpcbiAgICogQHBhcmFtIGNhbGxiYWNrIEEgY2FsbGJhY2sgZnVuY3Rpb24gdG8gYWRkIGFzIGEgbGlzdGVuZXIuXG4gICAqIEByZXR1cm5zIEEgZnVuY3Rpb24gd2hpY2ggdW5yZWdpc3RlcnMgYSBsaXN0ZW5lci5cbiAgICpcbiAgICogQGludGVybmFsXG4gICAqL1xuICBvbkRlc3Ryb3koY2FsbGJhY2s6ICgpID0+IHZvaWQpOiBWb2lkRnVuY3Rpb24ge1xuICAgIE5HX0RFVl9NT0RFICYmIHRoaXMud2FybklmRGVzdHJveWVkKCk7XG4gICAgdGhpcy5fZGVzdHJveUxpc3RlbmVycy5wdXNoKGNhbGxiYWNrKTtcbiAgICByZXR1cm4gKCkgPT4gcmVtb3ZlKHRoaXMuX2Rlc3Ryb3lMaXN0ZW5lcnMsIGNhbGxiYWNrKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZXN0cm95cyBhbiBBbmd1bGFyIGFwcGxpY2F0aW9uIHJlcHJlc2VudGVkIGJ5IHRoaXMgYEFwcGxpY2F0aW9uUmVmYC4gQ2FsbGluZyB0aGlzIGZ1bmN0aW9uXG4gICAqIHdpbGwgZGVzdHJveSB0aGUgYXNzb2NpYXRlZCBlbnZpcm9ubmVtZW50IGluamVjdG9ycyBhcyB3ZWxsIGFzIGFsbCB0aGUgYm9vdHN0cmFwcGVkIGNvbXBvbmVudHNcbiAgICogd2l0aCB0aGVpciB2aWV3cy5cbiAgICovXG4gIGRlc3Ryb3koKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuX2Rlc3Ryb3llZCkge1xuICAgICAgdGhyb3cgbmV3IFJ1bnRpbWVFcnJvcihcbiAgICAgICAgICBSdW50aW1lRXJyb3JDb2RlLkFQUExJQ0FUSU9OX1JFRl9BTFJFQURZX0RFU1RST1lFRCxcbiAgICAgICAgICBuZ0Rldk1vZGUgJiYgJ1RoaXMgaW5zdGFuY2Ugb2YgdGhlIGBBcHBsaWNhdGlvblJlZmAgaGFzIGFscmVhZHkgYmVlbiBkZXN0cm95ZWQuJyk7XG4gICAgfVxuXG4gICAgLy8gVGhpcyBpcyBhIHRlbXBvcmFyeSB0eXBlIHRvIHJlcHJlc2VudCBhbiBpbnN0YW5jZSBvZiBhbiBSM0luamVjdG9yLCB3aGljaCBjYW4gYmUgZGVzdHJveWVkLlxuICAgIC8vIFRoZSB0eXBlIHdpbGwgYmUgcmVwbGFjZWQgd2l0aCBhIGRpZmZlcmVudCBvbmUgb25jZSBkZXN0cm95YWJsZSBpbmplY3RvciB0eXBlIGlzIGF2YWlsYWJsZS5cbiAgICB0eXBlIERlc3Ryb3lhYmxlSW5qZWN0b3IgPSBJbmplY3RvciZ7ZGVzdHJveT86IEZ1bmN0aW9uLCBkZXN0cm95ZWQ/OiBib29sZWFufTtcblxuICAgIGNvbnN0IGluamVjdG9yID0gdGhpcy5faW5qZWN0b3IgYXMgRGVzdHJveWFibGVJbmplY3RvcjtcblxuICAgIC8vIENoZWNrIHRoYXQgdGhpcyBpbmplY3RvciBpbnN0YW5jZSBzdXBwb3J0cyBkZXN0cm95IG9wZXJhdGlvbi5cbiAgICBpZiAoaW5qZWN0b3IuZGVzdHJveSAmJiAhaW5qZWN0b3IuZGVzdHJveWVkKSB7XG4gICAgICAvLyBEZXN0cm95aW5nIGFuIHVuZGVybHlpbmcgaW5qZWN0b3Igd2lsbCB0cmlnZ2VyIHRoZSBgbmdPbkRlc3Ryb3lgIGxpZmVjeWNsZVxuICAgICAgLy8gaG9vaywgd2hpY2ggaW52b2tlcyB0aGUgcmVtYWluaW5nIGNsZWFudXAgYWN0aW9ucy5cbiAgICAgIGluamVjdG9yLmRlc3Ryb3koKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgbnVtYmVyIG9mIGF0dGFjaGVkIHZpZXdzLlxuICAgKi9cbiAgZ2V0IHZpZXdDb3VudCgpIHtcbiAgICByZXR1cm4gdGhpcy5fdmlld3MubGVuZ3RoO1xuICB9XG5cbiAgcHJpdmF0ZSB3YXJuSWZEZXN0cm95ZWQoKSB7XG4gICAgaWYgKE5HX0RFVl9NT0RFICYmIHRoaXMuX2Rlc3Ryb3llZCkge1xuICAgICAgY29uc29sZS53YXJuKGZvcm1hdFJ1bnRpbWVFcnJvcihcbiAgICAgICAgICBSdW50aW1lRXJyb3JDb2RlLkFQUExJQ0FUSU9OX1JFRl9BTFJFQURZX0RFU1RST1lFRCxcbiAgICAgICAgICAnVGhpcyBpbnN0YW5jZSBvZiB0aGUgYEFwcGxpY2F0aW9uUmVmYCBoYXMgYWxyZWFkeSBiZWVuIGRlc3Ryb3llZC4nKSk7XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIHJlbW92ZTxUPihsaXN0OiBUW10sIGVsOiBUKTogdm9pZCB7XG4gIGNvbnN0IGluZGV4ID0gbGlzdC5pbmRleE9mKGVsKTtcbiAgaWYgKGluZGV4ID4gLTEpIHtcbiAgICBsaXN0LnNwbGljZShpbmRleCwgMSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gX2xhc3REZWZpbmVkPFQ+KGFyZ3M6IFRbXSk6IFR8dW5kZWZpbmVkIHtcbiAgZm9yIChsZXQgaSA9IGFyZ3MubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICBpZiAoYXJnc1tpXSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm4gYXJnc1tpXTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHVuZGVmaW5lZDtcbn1cblxuZnVuY3Rpb24gX21lcmdlQXJyYXlzKHBhcnRzOiBhbnlbXVtdKTogYW55W10ge1xuICBjb25zdCByZXN1bHQ6IGFueVtdID0gW107XG4gIHBhcnRzLmZvckVhY2goKHBhcnQpID0+IHBhcnQgJiYgcmVzdWx0LnB1c2goLi4ucGFydCkpO1xuICByZXR1cm4gcmVzdWx0O1xufVxuIl19