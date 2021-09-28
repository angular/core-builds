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
import { DEFAULT_LOCALE_ID } from './i18n/localization';
import { LOCALE_ID } from './i18n/tokens';
import { ivyEnabled } from './ivy_switch';
import { COMPILER_OPTIONS, CompilerFactory } from './linker/compiler';
import { ComponentFactory } from './linker/component_factory';
import { ComponentFactoryBoundToModule, ComponentFactoryResolver } from './linker/component_factory_resolver';
import { NgModuleRef } from './linker/ng_module_factory';
import { isComponentResourceResolutionQueueEmpty, resolveComponentResources } from './metadata/resource_loading';
import { assertNgModuleType } from './render3/assert';
import { setLocaleId } from './render3/i18n/i18n_locale_id';
import { setJitOptions } from './render3/jit/jit_options';
import { NgModuleFactory as R3NgModuleFactory } from './render3/ng_module_ref';
import { publishDefaultGlobalUtils as _publishDefaultGlobalUtils } from './render3/util/global_utils';
import { Testability, TestabilityRegistry } from './testability/testability';
import { isDevMode } from './util/is_dev_mode';
import { isPromise } from './util/lang';
import { scheduleMicroTask } from './util/microtask';
import { stringify } from './util/stringify';
import { NgZone, NoopNgZone } from './zone/ng_zone';
let _platform;
let compileNgModuleFactory = compileNgModuleFactory__PRE_R3__;
function compileNgModuleFactory__PRE_R3__(injector, options, moduleType) {
    const compilerFactory = injector.get(CompilerFactory);
    const compiler = compilerFactory.createCompiler([options]);
    return compiler.compileModuleAsync(moduleType);
}
export function compileNgModuleFactory__POST_R3__(injector, options, moduleType) {
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
        usage: 0 /* Decorator */,
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
// the `window.ng` global utilities are only available in non-VE versions of
// Angular. The function switch below will make sure that the code is not
// included into Angular when PRE mode is active.
export function publishDefaultGlobalUtils__PRE_R3__() { }
export function publishDefaultGlobalUtils__POST_R3__() {
    ngDevMode && _publishDefaultGlobalUtils();
}
let publishDefaultGlobalUtils = publishDefaultGlobalUtils__PRE_R3__;
let isBoundToModule = isBoundToModule__PRE_R3__;
export function isBoundToModule__PRE_R3__(cf) {
    return cf instanceof ComponentFactoryBoundToModule;
}
export function isBoundToModule__POST_R3__(cf) {
    return cf.isBoundToModule;
}
export const ALLOW_MULTIPLE_PLATFORMS = new InjectionToken('AllowMultipleToken');
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
    if (_platform && !_platform.destroyed &&
        !_platform.injector.get(ALLOW_MULTIPLE_PLATFORMS, false)) {
        throw new Error('There can be only one platform. Destroy the previous one to create a new one.');
    }
    publishDefaultGlobalUtils();
    _platform = injector.get(PlatformRef);
    const inits = injector.get(PLATFORM_INITIALIZER, null);
    if (inits)
        inits.forEach((init) => init());
    return _platform;
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
            if (parentPlatformFactory) {
                parentPlatformFactory(providers.concat(extraProviders).concat({ provide: marker, useValue: true }));
            }
            else {
                const injectedProviders = providers.concat(extraProviders).concat({ provide: marker, useValue: true }, {
                    provide: INJECTOR_SCOPE,
                    useValue: 'platform'
                });
                createPlatform(Injector.create({ providers: injectedProviders, name: desc }));
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
        throw new Error('No platform exists!');
    }
    if (!platform.injector.get(requiredToken, null)) {
        throw new Error('A platform with a different configuration has been created. Please destroy it first.');
    }
    return platform;
}
/**
 * Destroys the current Angular platform and all Angular applications on the page.
 * Destroys all modules and listeners registered with the platform.
 *
 * @publicApi
 */
export function destroyPlatform() {
    if (_platform && !_platform.destroyed) {
        _platform.destroy();
    }
}
/**
 * Returns the current platform.
 *
 * @publicApi
 */
export function getPlatform() {
    return _platform && !_platform.destroyed ? _platform : null;
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
     * Creates an instance of an `@NgModule` for the given platform for offline compilation.
     *
     * @usageNotes
     *
     * The following example creates the NgModule for a browser platform.
     *
     * ```typescript
     * my_module.ts:
     *
     * @NgModule({
     *   imports: [BrowserModule]
     * })
     * class MyModule {}
     *
     * main.ts:
     * import {MyModuleNgFactory} from './my_module.ngfactory';
     * import {platformBrowser} from '@angular/platform-browser';
     *
     * let moduleRef = platformBrowser().bootstrapModuleFactory(MyModuleNgFactory);
     * ```
     *
     * @deprecated Passing NgModule factories as the `PlatformRef.bootstrapModuleFactory` function
     *     argument is deprecated. Use the `PlatformRef.bootstrapModule` API instead.
     */
    bootstrapModuleFactory(moduleFactory, options) {
        // Note: We need to create the NgZone _before_ we instantiate the module,
        // as instantiating the module creates some providers eagerly.
        // So we create a mini parent injector that just contains the new NgZone and
        // pass that as parent to the NgModuleFactory.
        const ngZoneOption = options ? options.ngZone : undefined;
        const ngZoneEventCoalescing = (options && options.ngZoneEventCoalescing) || false;
        const ngZoneRunCoalescing = (options && options.ngZoneRunCoalescing) || false;
        const ngZone = getNgZone(ngZoneOption, { ngZoneEventCoalescing, ngZoneRunCoalescing });
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
                throw new Error('No ErrorHandler. Is platform module (BrowserModule) included?');
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
                    if (ivyEnabled) {
                        // If the `LOCALE_ID` provider is defined at bootstrap then we set the value for ivy
                        const localeId = moduleRef.injector.get(LOCALE_ID, DEFAULT_LOCALE_ID);
                        setLocaleId(localeId || DEFAULT_LOCALE_ID);
                    }
                    this._moduleDoBootstrap(moduleRef);
                    return moduleRef;
                });
            });
        });
    }
    /**
     * Creates an instance of an `@NgModule` for a given platform using the given runtime compiler.
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
            throw new Error(`The module ${stringify(moduleRef.instance
                .constructor)} was bootstrapped, but it does not declare "@NgModule.bootstrap" components nor a "ngDoBootstrap" method. ` +
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
            throw new Error('The platform has already been destroyed!');
        }
        this._modules.slice().forEach(module => module.destroy());
        this._destroyListeners.forEach(listener => listener());
        this._destroyed = true;
    }
    get destroyed() {
        return this._destroyed;
    }
}
PlatformRef.decorators = [
    { type: Injectable }
];
PlatformRef.ctorParameters = () => [
    { type: Injector }
];
function getNgZone(ngZoneOption, extra) {
    let ngZone;
    if (ngZoneOption === 'noop') {
        ngZone = new NoopNgZone();
    }
    else {
        ngZone = (ngZoneOption === 'zone.js' ? undefined : ngZoneOption) || new NgZone({
            enableLongStackTrace: isDevMode(),
            shouldCoalesceEventChangeDetection: !!(extra === null || extra === void 0 ? void 0 : extra.ngZoneEventCoalescing),
            shouldCoalesceRunChangeDetection: !!(extra === null || extra === void 0 ? void 0 : extra.ngZoneRunCoalescing)
        });
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
        dst = Object.assign(Object.assign({}, dst), objs);
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
    constructor(_zone, _injector, _exceptionHandler, _componentFactoryResolver, _initStatus) {
        this._zone = _zone;
        this._injector = _injector;
        this._exceptionHandler = _exceptionHandler;
        this._componentFactoryResolver = _componentFactoryResolver;
        this._initStatus = _initStatus;
        /** @internal */
        this._bootstrapListeners = [];
        this._views = [];
        this._runningTick = false;
        this._stable = true;
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
        if (!this._initStatus.done) {
            throw new Error('Cannot bootstrap as there are still asynchronous initializers running. Bootstrap components in the `ngDoBootstrap` method of the root module.');
        }
        let componentFactory;
        if (componentOrFactory instanceof ComponentFactory) {
            componentFactory = componentOrFactory;
        }
        else {
            componentFactory =
                this._componentFactoryResolver.resolveComponentFactory(componentOrFactory);
        }
        this.componentTypes.push(componentFactory.componentType);
        // Create a factory associated with the current module if it's not bound to some other
        const ngModule = isBoundToModule(componentFactory) ? undefined : this._injector.get(NgModuleRef);
        const selectorOrNode = rootSelectorOrNode || componentFactory.selector;
        const compRef = componentFactory.create(Injector.NULL, [], selectorOrNode, ngModule);
        const nativeElement = compRef.location.nativeElement;
        const testability = compRef.injector.get(Testability, null);
        const testabilityRegistry = testability && compRef.injector.get(TestabilityRegistry);
        if (testability && testabilityRegistry) {
            testabilityRegistry.registerApplication(nativeElement, testability);
        }
        compRef.onDestroy(() => {
            this.detachView(compRef.hostView);
            remove(this.components, compRef);
            if (testabilityRegistry) {
                testabilityRegistry.unregisterApplication(nativeElement);
            }
        });
        this._loadComponent(compRef);
        // Note that we have still left the `isDevMode()` condition in order to avoid
        // creating a breaking change for projects that still use the View Engine.
        if ((typeof ngDevMode === 'undefined' || ngDevMode) && isDevMode()) {
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
        if (this._runningTick) {
            throw new Error('ApplicationRef.tick is called recursively');
        }
        try {
            this._runningTick = true;
            for (let view of this._views) {
                view.detectChanges();
            }
            // Note that we have still left the `isDevMode()` condition in order to avoid
            // creating a breaking change for projects that still use the View Engine.
            if ((typeof ngDevMode === 'undefined' || ngDevMode) && isDevMode()) {
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
        const view = viewRef;
        this._views.push(view);
        view.attachToAppRef(this);
    }
    /**
     * Detaches a view from dirty checking again.
     */
    detachView(viewRef) {
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
        this._views.slice().forEach((view) => view.destroy());
        this._onMicrotaskEmptySubscription.unsubscribe();
    }
    /**
     * Returns the number of attached views.
     */
    get viewCount() {
        return this._views.length;
    }
}
ApplicationRef.decorators = [
    { type: Injectable }
];
ApplicationRef.ctorParameters = () => [
    { type: NgZone },
    { type: Injector },
    { type: ErrorHandler },
    { type: ComponentFactoryResolver },
    { type: ApplicationInitStatus }
];
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwbGljYXRpb25fcmVmLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvYXBwbGljYXRpb25fcmVmLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sb0JBQW9CLENBQUM7QUFFNUIsT0FBTyxFQUFDLEtBQUssRUFBRSxVQUFVLEVBQXlCLE1BQU0sTUFBTSxDQUFDO0FBQy9ELE9BQU8sRUFBQyxLQUFLLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUVyQyxPQUFPLEVBQUMscUJBQXFCLEVBQUMsTUFBTSxvQkFBb0IsQ0FBQztBQUN6RCxPQUFPLEVBQUMsc0JBQXNCLEVBQUUsb0JBQW9CLEVBQUMsTUFBTSxzQkFBc0IsQ0FBQztBQUNsRixPQUFPLEVBQUMsaUJBQWlCLEVBQW1CLE1BQU0sNEJBQTRCLENBQUM7QUFDL0UsT0FBTyxFQUFDLE9BQU8sRUFBQyxNQUFNLFdBQVcsQ0FBQztBQUNsQyxPQUFPLEVBQUMsVUFBVSxFQUFDLE1BQU0saUJBQWlCLENBQUM7QUFDM0MsT0FBTyxFQUFDLGNBQWMsRUFBQyxNQUFNLHNCQUFzQixDQUFDO0FBQ3BELE9BQU8sRUFBQyxRQUFRLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFFdkMsT0FBTyxFQUFDLGNBQWMsRUFBQyxNQUFNLFlBQVksQ0FBQztBQUMxQyxPQUFPLEVBQUMsWUFBWSxFQUFDLE1BQU0saUJBQWlCLENBQUM7QUFDN0MsT0FBTyxFQUFDLGlCQUFpQixFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFDdEQsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUV4QyxPQUFPLEVBQUMsVUFBVSxFQUFDLE1BQU0sY0FBYyxDQUFDO0FBQ3hDLE9BQU8sRUFBQyxnQkFBZ0IsRUFBRSxlQUFlLEVBQWtCLE1BQU0sbUJBQW1CLENBQUM7QUFDckYsT0FBTyxFQUFDLGdCQUFnQixFQUFlLE1BQU0sNEJB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QUFLLENBQUMsT0FBTyxDQUFDLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQyxJQUFJLElBQUksTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUM7SUFDdEQsT0FBTyxNQUFNLENBQUM7QUFDaEIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgJy4vdXRpbC9uZ19qaXRfbW9kZSc7XG5cbmltcG9ydCB7bWVyZ2UsIE9ic2VydmFibGUsIE9ic2VydmVyLCBTdWJzY3JpcHRpb259IGZyb20gJ3J4anMnO1xuaW1wb3J0IHtzaGFyZX0gZnJvbSAncnhqcy9vcGVyYXRvcnMnO1xuXG5pbXBvcnQge0FwcGxpY2F0aW9uSW5pdFN0YXR1c30gZnJvbSAnLi9hcHBsaWNhdGlvbl9pbml0JztcbmltcG9ydCB7QVBQX0JPT1RTVFJBUF9MSVNURU5FUiwgUExBVEZPUk1fSU5JVElBTElaRVJ9IGZyb20gJy4vYXBwbGljYXRpb25fdG9rZW5zJztcbmltcG9ydCB7Z2V0Q29tcGlsZXJGYWNhZGUsIEppdENvbXBpbGVyVXNhZ2V9IGZyb20gJy4vY29tcGlsZXIvY29tcGlsZXJfZmFjYWRlJztcbmltcG9ydCB7Q29uc29sZX0gZnJvbSAnLi9jb25zb2xlJztcbmltcG9ydCB7SW5qZWN0YWJsZX0gZnJvbSAnLi9kaS9pbmplY3RhYmxlJztcbmltcG9ydCB7SW5qZWN0aW9uVG9rZW59IGZyb20gJy4vZGkvaW5qZWN0aW9uX3Rva2VuJztcbmltcG9ydCB7SW5qZWN0b3J9IGZyb20gJy4vZGkvaW5qZWN0b3InO1xuaW1wb3J0IHtTdGF0aWNQcm92aWRlcn0gZnJvbSAnLi9kaS9pbnRlcmZhY2UvcHJvdmlkZXInO1xuaW1wb3J0IHtJTkpFQ1RPUl9TQ09QRX0gZnJvbSAnLi9kaS9zY29wZSc7XG5pbXBvcnQge0Vycm9ySGFuZGxlcn0gZnJvbSAnLi9lcnJvcl9oYW5kbGVyJztcbmltcG9ydCB7REVGQVVMVF9MT0NBTEVfSUR9IGZyb20gJy4vaTE4bi9sb2NhbGl6YXRpb24nO1xuaW1wb3J0IHtMT0NBTEVfSUR9IGZyb20gJy4vaTE4bi90b2tlbnMnO1xuaW1wb3J0IHtUeXBlfSBmcm9tICcuL2ludGVyZmFjZS90eXBlJztcbmltcG9ydCB7aXZ5RW5hYmxlZH0gZnJvbSAnLi9pdnlfc3dpdGNoJztcbmltcG9ydCB7Q09NUElMRVJfT1BUSU9OUywgQ29tcGlsZXJGYWN0b3J5LCBDb21waWxlck9wdGlvbnN9IGZyb20gJy4vbGlua2VyL2NvbXBpbGVyJztcbmltcG9ydCB7Q29tcG9uZW50RmFjdG9yeSwgQ29tcG9uZW50UmVmfSBmcm9tICcuL2xpbmtlci9jb21wb25lbnRfZmFjdG9yeSc7XG5pbXBvcnQge0NvbXBvbmVudEZhY3RvcnlCb3VuZFRvTW9kdWxlLCBDb21wb25lbnRGYWN0b3J5UmVzb2x2ZXJ9IGZyb20gJy4vbGlua2VyL2NvbXBvbmVudF9mYWN0b3J5X3Jlc29sdmVyJztcbmltcG9ydCB7SW50ZXJuYWxOZ01vZHVsZVJlZiwgTmdNb2R1bGVGYWN0b3J5LCBOZ01vZHVsZVJlZn0gZnJvbSAnLi9saW5rZXIvbmdfbW9kdWxlX2ZhY3RvcnknO1xuaW1wb3J0IHtJbnRlcm5hbFZpZXdSZWYsIFZpZXdSZWZ9IGZyb20gJy4vbGlua2VyL3ZpZXdfcmVmJztcbmltcG9ydCB7aXNDb21wb25lbnRSZXNvdXJjZVJlc29sdXRpb25RdWV1ZUVtcHR5LCByZXNvbHZlQ29tcG9uZW50UmVzb3VyY2VzfSBmcm9tICcuL21ldGFkYXRhL3Jlc291cmNlX2xvYWRpbmcnO1xuaW1wb3J0IHthc3NlcnROZ01vZHVsZVR5cGV9IGZyb20gJy4vcmVuZGVyMy9hc3NlcnQnO1xuaW1wb3J0IHtDb21wb25lbnRGYWN0b3J5IGFzIFIzQ29tcG9uZW50RmFjdG9yeX0gZnJvbSAnLi9yZW5kZXIzL2NvbXBvbmVudF9yZWYnO1xuaW1wb3J0IHtzZXRMb2NhbGVJZH0gZnJvbSAnLi9yZW5kZXIzL2kxOG4vaTE4bl9sb2NhbGVfaWQnO1xuaW1wb3J0IHtzZXRKaXRPcHRpb25zfSBmcm9tICcuL3JlbmRlcjMvaml0L2ppdF9vcHRpb25zJztcbmltcG9ydCB7TmdNb2R1bGVGYWN0b3J5IGFzIFIzTmdNb2R1bGVGYWN0b3J5fSBmcm9tICcuL3JlbmRlcjMvbmdfbW9kdWxlX3JlZic7XG5pbXBvcnQge3B1Ymxpc2hEZWZhdWx0R2xvYmFsVXRpbHMgYXMgX3B1Ymxpc2hEZWZhdWx0R2xvYmFsVXRpbHN9IGZyb20gJy4vcmVuZGVyMy91dGlsL2dsb2JhbF91dGlscyc7XG5pbXBvcnQge1Rlc3RhYmlsaXR5LCBUZXN0YWJpbGl0eVJlZ2lzdHJ5fSBmcm9tICcuL3Rlc3RhYmlsaXR5L3Rlc3RhYmlsaXR5JztcbmltcG9ydCB7aXNEZXZNb2RlfSBmcm9tICcuL3V0aWwvaXNfZGV2X21vZGUnO1xuaW1wb3J0IHtpc1Byb21pc2V9IGZyb20gJy4vdXRpbC9sYW5nJztcbmltcG9ydCB7c2NoZWR1bGVNaWNyb1Rhc2t9IGZyb20gJy4vdXRpbC9taWNyb3Rhc2snO1xuaW1wb3J0IHtzdHJpbmdpZnl9IGZyb20gJy4vdXRpbC9zdHJpbmdpZnknO1xuaW1wb3J0IHtOZ1pvbmUsIE5vb3BOZ1pvbmV9IGZyb20gJy4vem9uZS9uZ196b25lJztcblxubGV0IF9wbGF0Zm9ybTogUGxhdGZvcm1SZWY7XG5cbmxldCBjb21waWxlTmdNb2R1bGVGYWN0b3J5OlxuICAgIDxNPihpbmplY3RvcjogSW5qZWN0b3IsIG9wdGlvbnM6IENvbXBpbGVyT3B0aW9ucywgbW9kdWxlVHlwZTogVHlwZTxNPikgPT5cbiAgICAgICAgUHJvbWlzZTxOZ01vZHVsZUZhY3Rvcnk8TT4+ID0gY29tcGlsZU5nTW9kdWxlRmFjdG9yeV9fUFJFX1IzX187XG5cbmZ1bmN0aW9uIGNvbXBpbGVOZ01vZHVsZUZhY3RvcnlfX1BSRV9SM19fPE0+KFxuICAgIGluamVjdG9yOiBJbmplY3Rvciwgb3B0aW9uczogQ29tcGlsZXJPcHRpb25zLFxuICAgIG1vZHVsZVR5cGU6IFR5cGU8TT4pOiBQcm9taXNlPE5nTW9kdWxlRmFjdG9yeTxNPj4ge1xuICBjb25zdCBjb21waWxlckZhY3Rvcnk6IENvbXBpbGVyRmFjdG9yeSA9IGluamVjdG9yLmdldChDb21waWxlckZhY3RvcnkpO1xuICBjb25zdCBjb21waWxlciA9IGNvbXBpbGVyRmFjdG9yeS5jcmVhdGVDb21waWxlcihbb3B0aW9uc10pO1xuICByZXR1cm4gY29tcGlsZXIuY29tcGlsZU1vZHVsZUFzeW5jKG1vZHVsZVR5cGUpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY29tcGlsZU5nTW9kdWxlRmFjdG9yeV9fUE9TVF9SM19fPE0+KFxuICAgIGluamVjdG9yOiBJbmplY3Rvciwgb3B0aW9uczogQ29tcGlsZXJPcHRpb25zLFxuICAgIG1vZHVsZVR5cGU6IFR5cGU8TT4pOiBQcm9taXNlPE5nTW9kdWxlRmFjdG9yeTxNPj4ge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0TmdNb2R1bGVUeXBlKG1vZHVsZVR5cGUpO1xuXG4gIGNvbnN0IG1vZHVsZUZhY3RvcnkgPSBuZXcgUjNOZ01vZHVsZUZhY3RvcnkobW9kdWxlVHlwZSk7XG5cbiAgLy8gQWxsIG9mIHRoZSBsb2dpYyBiZWxvdyBpcyBpcnJlbGV2YW50IGZvciBBT1QtY29tcGlsZWQgY29kZS5cbiAgaWYgKHR5cGVvZiBuZ0ppdE1vZGUgIT09ICd1bmRlZmluZWQnICYmICFuZ0ppdE1vZGUpIHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKG1vZHVsZUZhY3RvcnkpO1xuICB9XG5cbiAgY29uc3QgY29tcGlsZXJPcHRpb25zID0gaW5qZWN0b3IuZ2V0KENPTVBJTEVSX09QVElPTlMsIFtdKS5jb25jYXQob3B0aW9ucyk7XG5cbiAgLy8gQ29uZmlndXJlIHRoZSBjb21waWxlciB0byB1c2UgdGhlIHByb3ZpZGVkIG9wdGlvbnMuIFRoaXMgY2FsbCBtYXkgZmFpbCB3aGVuIG11bHRpcGxlIG1vZHVsZXNcbiAgLy8gYXJlIGJvb3RzdHJhcHBlZCB3aXRoIGluY29tcGF0aWJsZSBvcHRpb25zLCBhcyBhIGNvbXBvbmVudCBjYW4gb25seSBiZSBjb21waWxlZCBhY2NvcmRpbmcgdG9cbiAgLy8gYSBzaW5nbGUgc2V0IG9mIG9wdGlvbnMuXG4gIHNldEppdE9wdGlvbnMoe1xuICAgIGRlZmF1bHRFbmNhcHN1bGF0aW9uOiBfbGFzdERlZmluZWQoY29tcGlsZXJPcHRpb25zLm1hcChvcHRzID0+IG9wdHMuZGVmYXVsdEVuY2Fwc3VsYXRpb24pKSxcbiAgICBwcmVzZXJ2ZVdoaXRlc3BhY2VzOiBfbGFzdERlZmluZWQoY29tcGlsZXJPcHRpb25zLm1hcChvcHRzID0+IG9wdHMucHJlc2VydmVXaGl0ZXNwYWNlcykpLFxuICB9KTtcblxuICBpZiAoaXNDb21wb25lbnRSZXNvdXJjZVJlc29sdXRpb25RdWV1ZUVtcHR5KCkpIHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKG1vZHVsZUZhY3RvcnkpO1xuICB9XG5cbiAgY29uc3QgY29tcGlsZXJQcm92aWRlcnMgPSBfbWVyZ2VBcnJheXMoY29tcGlsZXJPcHRpb25zLm1hcChvID0+IG8ucHJvdmlkZXJzISkpO1xuXG4gIC8vIEluIGNhc2UgdGhlcmUgYXJlIG5vIGNvbXBpbGVyIHByb3ZpZGVycywgd2UganVzdCByZXR1cm4gdGhlIG1vZHVsZSBmYWN0b3J5IGFzXG4gIC8vIHRoZXJlIHdvbid0IGJlIGFueSByZXNvdXJjZSBsb2FkZXIuIFRoaXMgY2FuIGhhcHBlbiB3aXRoIEl2eSwgYmVjYXVzZSBBT1QgY29tcGlsZWRcbiAgLy8gbW9kdWxlcyBjYW4gYmUgc3RpbGwgcGFzc2VkIHRocm91Z2ggXCJib290c3RyYXBNb2R1bGVcIi4gSW4gdGhhdCBjYXNlIHdlIHNob3VsZG4ndFxuICAvLyB1bm5lY2Vzc2FyaWx5IHJlcXVpcmUgdGhlIEpJVCBjb21waWxlci5cbiAgaWYgKGNvbXBpbGVyUHJvdmlkZXJzLmxlbmd0aCA9PT0gMCkge1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUobW9kdWxlRmFjdG9yeSk7XG4gIH1cblxuICBjb25zdCBjb21waWxlciA9IGdldENvbXBpbGVyRmFjYWRlKHtcbiAgICB1c2FnZTogSml0Q29tcGlsZXJVc2FnZS5EZWNvcmF0b3IsXG4gICAga2luZDogJ05nTW9kdWxlJyxcbiAgICB0eXBlOiBtb2R1bGVUeXBlLFxuICB9KTtcbiAgY29uc3QgY29tcGlsZXJJbmplY3RvciA9IEluamVjdG9yLmNyZWF0ZSh7cHJvdmlkZXJzOiBjb21waWxlclByb3ZpZGVyc30pO1xuICBjb25zdCByZXNvdXJjZUxvYWRlciA9IGNvbXBpbGVySW5qZWN0b3IuZ2V0KGNvbXBpbGVyLlJlc291cmNlTG9hZGVyKTtcbiAgLy8gVGhlIHJlc291cmNlIGxvYWRlciBjYW4gYWxzbyByZXR1cm4gYSBzdHJpbmcgd2hpbGUgdGhlIFwicmVzb2x2ZUNvbXBvbmVudFJlc291cmNlc1wiXG4gIC8vIGFsd2F5cyBleHBlY3RzIGEgcHJvbWlzZS4gVGhlcmVmb3JlIHdlIG5lZWQgdG8gd3JhcCB0aGUgcmV0dXJuZWQgdmFsdWUgaW4gYSBwcm9taXNlLlxuICByZXR1cm4gcmVzb2x2ZUNvbXBvbmVudFJlc291cmNlcyh1cmwgPT4gUHJvbWlzZS5yZXNvbHZlKHJlc291cmNlTG9hZGVyLmdldCh1cmwpKSlcbiAgICAgIC50aGVuKCgpID0+IG1vZHVsZUZhY3RvcnkpO1xufVxuXG4vLyB0aGUgYHdpbmRvdy5uZ2AgZ2xvYmFsIHV0aWxpdGllcyBhcmUgb25seSBhdmFpbGFibGUgaW4gbm9uLVZFIHZlcnNpb25zIG9mXG4vLyBBbmd1bGFyLiBUaGUgZnVuY3Rpb24gc3dpdGNoIGJlbG93IHdpbGwgbWFrZSBzdXJlIHRoYXQgdGhlIGNvZGUgaXMgbm90XG4vLyBpbmNsdWRlZCBpbnRvIEFuZ3VsYXIgd2hlbiBQUkUgbW9kZSBpcyBhY3RpdmUuXG5leHBvcnQgZnVuY3Rpb24gcHVibGlzaERlZmF1bHRHbG9iYWxVdGlsc19fUFJFX1IzX18oKSB7fVxuZXhwb3J0IGZ1bmN0aW9uIHB1Ymxpc2hEZWZhdWx0R2xvYmFsVXRpbHNfX1BPU1RfUjNfXygpIHtcbiAgbmdEZXZNb2RlICYmIF9wdWJsaXNoRGVmYXVsdEdsb2JhbFV0aWxzKCk7XG59XG5cbmxldCBwdWJsaXNoRGVmYXVsdEdsb2JhbFV0aWxzOiAoKSA9PiBhbnkgPSBwdWJsaXNoRGVmYXVsdEdsb2JhbFV0aWxzX19QUkVfUjNfXztcblxubGV0IGlzQm91bmRUb01vZHVsZTogPEM+KGNmOiBDb21wb25lbnRGYWN0b3J5PEM+KSA9PiBib29sZWFuID0gaXNCb3VuZFRvTW9kdWxlX19QUkVfUjNfXztcblxuZXhwb3J0IGZ1bmN0aW9uIGlzQm91bmRUb01vZHVsZV9fUFJFX1IzX188Qz4oY2Y6IENvbXBvbmVudEZhY3Rvcnk8Qz4pOiBib29sZWFuIHtcbiAgcmV0dXJuIGNmIGluc3RhbmNlb2YgQ29tcG9uZW50RmFjdG9yeUJvdW5kVG9Nb2R1bGU7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0JvdW5kVG9Nb2R1bGVfX1BPU1RfUjNfXzxDPihjZjogQ29tcG9uZW50RmFjdG9yeTxDPik6IGJvb2xlYW4ge1xuICByZXR1cm4gKGNmIGFzIFIzQ29tcG9uZW50RmFjdG9yeTxDPikuaXNCb3VuZFRvTW9kdWxlO1xufVxuXG5leHBvcnQgY29uc3QgQUxMT1dfTVVMVElQTEVfUExBVEZPUk1TID0gbmV3IEluamVjdGlvblRva2VuPGJvb2xlYW4+KCdBbGxvd011bHRpcGxlVG9rZW4nKTtcblxuXG5cbi8qKlxuICogQSB0b2tlbiBmb3IgdGhpcmQtcGFydHkgY29tcG9uZW50cyB0aGF0IGNhbiByZWdpc3RlciB0aGVtc2VsdmVzIHdpdGggTmdQcm9iZS5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBjbGFzcyBOZ1Byb2JlVG9rZW4ge1xuICBjb25zdHJ1Y3RvcihwdWJsaWMgbmFtZTogc3RyaW5nLCBwdWJsaWMgdG9rZW46IGFueSkge31cbn1cblxuLyoqXG4gKiBDcmVhdGVzIGEgcGxhdGZvcm0uXG4gKiBQbGF0Zm9ybXMgbXVzdCBiZSBjcmVhdGVkIG9uIGxhdW5jaCB1c2luZyB0aGlzIGZ1bmN0aW9uLlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVBsYXRmb3JtKGluamVjdG9yOiBJbmplY3Rvcik6IFBsYXRmb3JtUmVmIHtcbiAgaWYgKF9wbGF0Zm9ybSAmJiAhX3BsYXRmb3JtLmRlc3Ryb3llZCAmJlxuICAgICAgIV9wbGF0Zm9ybS5pbmplY3Rvci5nZXQoQUxMT1dfTVVMVElQTEVfUExBVEZPUk1TLCBmYWxzZSkpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICdUaGVyZSBjYW4gYmUgb25seSBvbmUgcGxhdGZvcm0uIERlc3Ryb3kgdGhlIHByZXZpb3VzIG9uZSB0byBjcmVhdGUgYSBuZXcgb25lLicpO1xuICB9XG4gIHB1Ymxpc2hEZWZhdWx0R2xvYmFsVXRpbHMoKTtcbiAgX3BsYXRmb3JtID0gaW5qZWN0b3IuZ2V0KFBsYXRmb3JtUmVmKTtcbiAgY29uc3QgaW5pdHMgPSBpbmplY3Rvci5nZXQoUExBVEZPUk1fSU5JVElBTElaRVIsIG51bGwpO1xuICBpZiAoaW5pdHMpIGluaXRzLmZvckVhY2goKGluaXQ6IGFueSkgPT4gaW5pdCgpKTtcbiAgcmV0dXJuIF9wbGF0Zm9ybTtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGEgZmFjdG9yeSBmb3IgYSBwbGF0Zm9ybS4gQ2FuIGJlIHVzZWQgdG8gcHJvdmlkZSBvciBvdmVycmlkZSBgUHJvdmlkZXJzYCBzcGVjaWZpYyB0b1xuICogeW91ciBhcHBsaWNhdGlvbidzIHJ1bnRpbWUgbmVlZHMsIHN1Y2ggYXMgYFBMQVRGT1JNX0lOSVRJQUxJWkVSYCBhbmQgYFBMQVRGT1JNX0lEYC5cbiAqIEBwYXJhbSBwYXJlbnRQbGF0Zm9ybUZhY3RvcnkgQW5vdGhlciBwbGF0Zm9ybSBmYWN0b3J5IHRvIG1vZGlmeS4gQWxsb3dzIHlvdSB0byBjb21wb3NlIGZhY3Rvcmllc1xuICogdG8gYnVpbGQgdXAgY29uZmlndXJhdGlvbnMgdGhhdCBtaWdodCBiZSByZXF1aXJlZCBieSBkaWZmZXJlbnQgbGlicmFyaWVzIG9yIHBhcnRzIG9mIHRoZVxuICogYXBwbGljYXRpb24uXG4gKiBAcGFyYW0gbmFtZSBJZGVudGlmaWVzIHRoZSBuZXcgcGxhdGZvcm0gZmFjdG9yeS5cbiAqIEBwYXJhbSBwcm92aWRlcnMgQSBzZXQgb2YgZGVwZW5kZW5jeSBwcm92aWRlcnMgZm9yIHBsYXRmb3JtcyBjcmVhdGVkIHdpdGggdGhlIG5ldyBmYWN0b3J5LlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVBsYXRmb3JtRmFjdG9yeShcbiAgICBwYXJlbnRQbGF0Zm9ybUZhY3Rvcnk6ICgoZXh0cmFQcm92aWRlcnM/OiBTdGF0aWNQcm92aWRlcltdKSA9PiBQbGF0Zm9ybVJlZil8bnVsbCwgbmFtZTogc3RyaW5nLFxuICAgIHByb3ZpZGVyczogU3RhdGljUHJvdmlkZXJbXSA9IFtdKTogKGV4dHJhUHJvdmlkZXJzPzogU3RhdGljUHJvdmlkZXJbXSkgPT4gUGxhdGZvcm1SZWYge1xuICBjb25zdCBkZXNjID0gYFBsYXRmb3JtOiAke25hbWV9YDtcbiAgY29uc3QgbWFya2VyID0gbmV3IEluamVjdGlvblRva2VuKGRlc2MpO1xuICByZXR1cm4gKGV4dHJhUHJvdmlkZXJzOiBTdGF0aWNQcm92aWRlcltdID0gW10pID0+IHtcbiAgICBsZXQgcGxhdGZvcm0gPSBnZXRQbGF0Zm9ybSgpO1xuICAgIGlmICghcGxhdGZvcm0gfHwgcGxhdGZvcm0uaW5qZWN0b3IuZ2V0KEFMTE9XX01VTFRJUExFX1BMQVRGT1JNUywgZmFsc2UpKSB7XG4gICAgICBpZiAocGFyZW50UGxhdGZvcm1GYWN0b3J5KSB7XG4gICAgICAgIHBhcmVudFBsYXRmb3JtRmFjdG9yeShcbiAgICAgICAgICAgIHByb3ZpZGVycy5jb25jYXQoZXh0cmFQcm92aWRlcnMpLmNvbmNhdCh7cHJvdmlkZTogbWFya2VyLCB1c2VWYWx1ZTogdHJ1ZX0pKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IGluamVjdGVkUHJvdmlkZXJzOiBTdGF0aWNQcm92aWRlcltdID1cbiAgICAgICAgICAgIHByb3ZpZGVycy5jb25jYXQoZXh0cmFQcm92aWRlcnMpLmNvbmNhdCh7cHJvdmlkZTogbWFya2VyLCB1c2VWYWx1ZTogdHJ1ZX0sIHtcbiAgICAgICAgICAgICAgcHJvdmlkZTogSU5KRUNUT1JfU0NPUEUsXG4gICAgICAgICAgICAgIHVzZVZhbHVlOiAncGxhdGZvcm0nXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgY3JlYXRlUGxhdGZvcm0oSW5qZWN0b3IuY3JlYXRlKHtwcm92aWRlcnM6IGluamVjdGVkUHJvdmlkZXJzLCBuYW1lOiBkZXNjfSkpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gYXNzZXJ0UGxhdGZvcm0obWFya2VyKTtcbiAgfTtcbn1cblxuLyoqXG4gKiBDaGVja3MgdGhhdCB0aGVyZSBpcyBjdXJyZW50bHkgYSBwbGF0Zm9ybSB0aGF0IGNvbnRhaW5zIHRoZSBnaXZlbiB0b2tlbiBhcyBhIHByb3ZpZGVyLlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFzc2VydFBsYXRmb3JtKHJlcXVpcmVkVG9rZW46IGFueSk6IFBsYXRmb3JtUmVmIHtcbiAgY29uc3QgcGxhdGZvcm0gPSBnZXRQbGF0Zm9ybSgpO1xuXG4gIGlmICghcGxhdGZvcm0pIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ05vIHBsYXRmb3JtIGV4aXN0cyEnKTtcbiAgfVxuXG4gIGlmICghcGxhdGZvcm0uaW5qZWN0b3IuZ2V0KHJlcXVpcmVkVG9rZW4sIG51bGwpKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAnQSBwbGF0Zm9ybSB3aXRoIGEgZGlmZmVyZW50IGNvbmZpZ3VyYXRpb24gaGFzIGJlZW4gY3JlYXRlZC4gUGxlYXNlIGRlc3Ryb3kgaXQgZmlyc3QuJyk7XG4gIH1cblxuICByZXR1cm4gcGxhdGZvcm07XG59XG5cbi8qKlxuICogRGVzdHJveXMgdGhlIGN1cnJlbnQgQW5ndWxhciBwbGF0Zm9ybSBhbmQgYWxsIEFuZ3VsYXIgYXBwbGljYXRpb25zIG9uIHRoZSBwYWdlLlxuICogRGVzdHJveXMgYWxsIG1vZHVsZXMgYW5kIGxpc3RlbmVycyByZWdpc3RlcmVkIHdpdGggdGhlIHBsYXRmb3JtLlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRlc3Ryb3lQbGF0Zm9ybSgpOiB2b2lkIHtcbiAgaWYgKF9wbGF0Zm9ybSAmJiAhX3BsYXRmb3JtLmRlc3Ryb3llZCkge1xuICAgIF9wbGF0Zm9ybS5kZXN0cm95KCk7XG4gIH1cbn1cblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBjdXJyZW50IHBsYXRmb3JtLlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldFBsYXRmb3JtKCk6IFBsYXRmb3JtUmVmfG51bGwge1xuICByZXR1cm4gX3BsYXRmb3JtICYmICFfcGxhdGZvcm0uZGVzdHJveWVkID8gX3BsYXRmb3JtIDogbnVsbDtcbn1cblxuLyoqXG4gKiBQcm92aWRlcyBhZGRpdGlvbmFsIG9wdGlvbnMgdG8gdGhlIGJvb3RzdHJhcGluZyBwcm9jZXNzLlxuICpcbiAqXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgQm9vdHN0cmFwT3B0aW9ucyB7XG4gIC8qKlxuICAgKiBPcHRpb25hbGx5IHNwZWNpZnkgd2hpY2ggYE5nWm9uZWAgc2hvdWxkIGJlIHVzZWQuXG4gICAqXG4gICAqIC0gUHJvdmlkZSB5b3VyIG93biBgTmdab25lYCBpbnN0YW5jZS5cbiAgICogLSBgem9uZS5qc2AgLSBVc2UgZGVmYXVsdCBgTmdab25lYCB3aGljaCByZXF1aXJlcyBgWm9uZS5qc2AuXG4gICAqIC0gYG5vb3BgIC0gVXNlIGBOb29wTmdab25lYCB3aGljaCBkb2VzIG5vdGhpbmcuXG4gICAqL1xuICBuZ1pvbmU/OiBOZ1pvbmV8J3pvbmUuanMnfCdub29wJztcblxuICAvKipcbiAgICogT3B0aW9uYWxseSBzcGVjaWZ5IGNvYWxlc2NpbmcgZXZlbnQgY2hhbmdlIGRldGVjdGlvbnMgb3Igbm90LlxuICAgKiBDb25zaWRlciB0aGUgZm9sbG93aW5nIGNhc2UuXG4gICAqXG4gICAqIDxkaXYgKGNsaWNrKT1cImRvU29tZXRoaW5nKClcIj5cbiAgICogICA8YnV0dG9uIChjbGljayk9XCJkb1NvbWV0aGluZ0Vsc2UoKVwiPjwvYnV0dG9uPlxuICAgKiA8L2Rpdj5cbiAgICpcbiAgICogV2hlbiBidXR0b24gaXMgY2xpY2tlZCwgYmVjYXVzZSBvZiB0aGUgZXZlbnQgYnViYmxpbmcsIGJvdGhcbiAgICogZXZlbnQgaGFuZGxlcnMgd2lsbCBiZSBjYWxsZWQgYW5kIDIgY2hhbmdlIGRldGVjdGlvbnMgd2lsbCBiZVxuICAgKiB0cmlnZ2VyZWQuIFdlIGNhbiBjb2xlc2NlIHN1Y2gga2luZCBvZiBldmVudHMgdG8gb25seSB0cmlnZ2VyXG4gICAqIGNoYW5nZSBkZXRlY3Rpb24gb25seSBvbmNlLlxuICAgKlxuICAgKiBCeSBkZWZhdWx0LCB0aGlzIG9wdGlvbiB3aWxsIGJlIGZhbHNlLiBTbyB0aGUgZXZlbnRzIHdpbGwgbm90IGJlXG4gICAqIGNvYWxlc2NlZCBhbmQgdGhlIGNoYW5nZSBkZXRlY3Rpb24gd2lsbCBiZSB0cmlnZ2VyZWQgbXVsdGlwbGUgdGltZXMuXG4gICAqIEFuZCBpZiB0aGlzIG9wdGlvbiBiZSBzZXQgdG8gdHJ1ZSwgdGhlIGNoYW5nZSBkZXRlY3Rpb24gd2lsbCBiZVxuICAgKiB0cmlnZ2VyZWQgYXN5bmMgYnkgc2NoZWR1bGluZyBhIGFuaW1hdGlvbiBmcmFtZS4gU28gaW4gdGhlIGNhc2UgYWJvdmUsXG4gICAqIHRoZSBjaGFuZ2UgZGV0ZWN0aW9uIHdpbGwgb25seSBiZSB0cmlnZ2VyZWQgb25jZS5cbiAgICovXG4gIG5nWm9uZUV2ZW50Q29hbGVzY2luZz86IGJvb2xlYW47XG5cbiAgLyoqXG4gICAqIE9wdGlvbmFsbHkgc3BlY2lmeSBpZiBgTmdab25lI3J1bigpYCBtZXRob2QgaW52b2NhdGlvbnMgc2hvdWxkIGJlIGNvYWxlc2NlZFxuICAgKiBpbnRvIGEgc2luZ2xlIGNoYW5nZSBkZXRlY3Rpb24uXG4gICAqXG4gICAqIENvbnNpZGVyIHRoZSBmb2xsb3dpbmcgY2FzZS5cbiAgICpcbiAgICogZm9yIChsZXQgaSA9IDA7IGkgPCAxMDsgaSArKykge1xuICAgKiAgIG5nWm9uZS5ydW4oKCkgPT4ge1xuICAgKiAgICAgLy8gZG8gc29tZXRoaW5nXG4gICAqICAgfSk7XG4gICAqIH1cbiAgICpcbiAgICogVGhpcyBjYXNlIHRyaWdnZXJzIHRoZSBjaGFuZ2UgZGV0ZWN0aW9uIG11bHRpcGxlIHRpbWVzLlxuICAgKiBXaXRoIG5nWm9uZVJ1bkNvYWxlc2Npbmcgb3B0aW9ucywgYWxsIGNoYW5nZSBkZXRlY3Rpb25zIGluIGFuIGV2ZW50IGxvb3AgdHJpZ2dlciBvbmx5IG9uY2UuXG4gICAqIEluIGFkZGl0aW9uLCB0aGUgY2hhbmdlIGRldGVjdGlvbiBleGVjdXRlcyBpbiByZXF1ZXN0QW5pbWF0aW9uLlxuICAgKlxuICAgKi9cbiAgbmdab25lUnVuQ29hbGVzY2luZz86IGJvb2xlYW47XG59XG5cbi8qKlxuICogVGhlIEFuZ3VsYXIgcGxhdGZvcm0gaXMgdGhlIGVudHJ5IHBvaW50IGZvciBBbmd1bGFyIG9uIGEgd2ViIHBhZ2UuXG4gKiBFYWNoIHBhZ2UgaGFzIGV4YWN0bHkgb25lIHBsYXRmb3JtLiBTZXJ2aWNlcyAoc3VjaCBhcyByZWZsZWN0aW9uKSB3aGljaCBhcmUgY29tbW9uXG4gKiB0byBldmVyeSBBbmd1bGFyIGFwcGxpY2F0aW9uIHJ1bm5pbmcgb24gdGhlIHBhZ2UgYXJlIGJvdW5kIGluIGl0cyBzY29wZS5cbiAqIEEgcGFnZSdzIHBsYXRmb3JtIGlzIGluaXRpYWxpemVkIGltcGxpY2l0bHkgd2hlbiBhIHBsYXRmb3JtIGlzIGNyZWF0ZWQgdXNpbmcgYSBwbGF0Zm9ybVxuICogZmFjdG9yeSBzdWNoIGFzIGBQbGF0Zm9ybUJyb3dzZXJgLCBvciBleHBsaWNpdGx5IGJ5IGNhbGxpbmcgdGhlIGBjcmVhdGVQbGF0Zm9ybSgpYCBmdW5jdGlvbi5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbkBJbmplY3RhYmxlKClcbmV4cG9ydCBjbGFzcyBQbGF0Zm9ybVJlZiB7XG4gIHByaXZhdGUgX21vZHVsZXM6IE5nTW9kdWxlUmVmPGFueT5bXSA9IFtdO1xuICBwcml2YXRlIF9kZXN0cm95TGlzdGVuZXJzOiBGdW5jdGlvbltdID0gW107XG4gIHByaXZhdGUgX2Rlc3Ryb3llZDogYm9vbGVhbiA9IGZhbHNlO1xuXG4gIC8qKiBAaW50ZXJuYWwgKi9cbiAgY29uc3RydWN0b3IocHJpdmF0ZSBfaW5qZWN0b3I6IEluamVjdG9yKSB7fVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGFuIGluc3RhbmNlIG9mIGFuIGBATmdNb2R1bGVgIGZvciB0aGUgZ2l2ZW4gcGxhdGZvcm0gZm9yIG9mZmxpbmUgY29tcGlsYXRpb24uXG4gICAqXG4gICAqIEB1c2FnZU5vdGVzXG4gICAqXG4gICAqIFRoZSBmb2xsb3dpbmcgZXhhbXBsZSBjcmVhdGVzIHRoZSBOZ01vZHVsZSBmb3IgYSBicm93c2VyIHBsYXRmb3JtLlxuICAgKlxuICAgKiBgYGB0eXBlc2NyaXB0XG4gICAqIG15X21vZHVsZS50czpcbiAgICpcbiAgICogQE5nTW9kdWxlKHtcbiAgICogICBpbXBvcnRzOiBbQnJvd3Nlck1vZHVsZV1cbiAgICogfSlcbiAgICogY2xhc3MgTXlNb2R1bGUge31cbiAgICpcbiAgICogbWFpbi50czpcbiAgICogaW1wb3J0IHtNeU1vZHVsZU5nRmFjdG9yeX0gZnJvbSAnLi9teV9tb2R1bGUubmdmYWN0b3J5JztcbiAgICogaW1wb3J0IHtwbGF0Zm9ybUJyb3dzZXJ9IGZyb20gJ0Bhbmd1bGFyL3BsYXRmb3JtLWJyb3dzZXInO1xuICAgKlxuICAgKiBsZXQgbW9kdWxlUmVmID0gcGxhdGZvcm1Ccm93c2VyKCkuYm9vdHN0cmFwTW9kdWxlRmFjdG9yeShNeU1vZHVsZU5nRmFjdG9yeSk7XG4gICAqIGBgYFxuICAgKlxuICAgKiBAZGVwcmVjYXRlZCBQYXNzaW5nIE5nTW9kdWxlIGZhY3RvcmllcyBhcyB0aGUgYFBsYXRmb3JtUmVmLmJvb3RzdHJhcE1vZHVsZUZhY3RvcnlgIGZ1bmN0aW9uXG4gICAqICAgICBhcmd1bWVudCBpcyBkZXByZWNhdGVkLiBVc2UgdGhlIGBQbGF0Zm9ybVJlZi5ib290c3RyYXBNb2R1bGVgIEFQSSBpbnN0ZWFkLlxuICAgKi9cbiAgYm9vdHN0cmFwTW9kdWxlRmFjdG9yeTxNPihtb2R1bGVGYWN0b3J5OiBOZ01vZHVsZUZhY3Rvcnk8TT4sIG9wdGlvbnM/OiBCb290c3RyYXBPcHRpb25zKTpcbiAgICAgIFByb21pc2U8TmdNb2R1bGVSZWY8TT4+IHtcbiAgICAvLyBOb3RlOiBXZSBuZWVkIHRvIGNyZWF0ZSB0aGUgTmdab25lIF9iZWZvcmVfIHdlIGluc3RhbnRpYXRlIHRoZSBtb2R1bGUsXG4gICAgLy8gYXMgaW5zdGFudGlhdGluZyB0aGUgbW9kdWxlIGNyZWF0ZXMgc29tZSBwcm92aWRlcnMgZWFnZXJseS5cbiAgICAvLyBTbyB3ZSBjcmVhdGUgYSBtaW5pIHBhcmVudCBpbmplY3RvciB0aGF0IGp1c3QgY29udGFpbnMgdGhlIG5ldyBOZ1pvbmUgYW5kXG4gICAgLy8gcGFzcyB0aGF0IGFzIHBhcmVudCB0byB0aGUgTmdNb2R1bGVGYWN0b3J5LlxuICAgIGNvbnN0IG5nWm9uZU9wdGlvbiA9IG9wdGlvbnMgPyBvcHRpb25zLm5nWm9uZSA6IHVuZGVmaW5lZDtcbiAgICBjb25zdCBuZ1pvbmVFdmVudENvYWxlc2NpbmcgPSAob3B0aW9ucyAmJiBvcHRpb25zLm5nWm9uZUV2ZW50Q29hbGVzY2luZykgfHwgZmFsc2U7XG4gICAgY29uc3Qgbmdab25lUnVuQ29hbGVzY2luZyA9IChvcHRpb25zICYmIG9wdGlvbnMubmdab25lUnVuQ29hbGVzY2luZykgfHwgZmFsc2U7XG4gICAgY29uc3Qgbmdab25lID0gZ2V0Tmdab25lKG5nWm9uZU9wdGlvbiwge25nWm9uZUV2ZW50Q29hbGVzY2luZywgbmdab25lUnVuQ29hbGVzY2luZ30pO1xuICAgIGNvbnN0IHByb3ZpZGVyczogU3RhdGljUHJvdmlkZXJbXSA9IFt7cHJvdmlkZTogTmdab25lLCB1c2VWYWx1ZTogbmdab25lfV07XG4gICAgLy8gTm90ZTogQ3JlYXRlIG5nWm9uZUluamVjdG9yIHdpdGhpbiBuZ1pvbmUucnVuIHNvIHRoYXQgYWxsIG9mIHRoZSBpbnN0YW50aWF0ZWQgc2VydmljZXMgYXJlXG4gICAgLy8gY3JlYXRlZCB3aXRoaW4gdGhlIEFuZ3VsYXIgem9uZVxuICAgIC8vIERvIG5vdCB0cnkgdG8gcmVwbGFjZSBuZ1pvbmUucnVuIHdpdGggQXBwbGljYXRpb25SZWYjcnVuIGJlY2F1c2UgQXBwbGljYXRpb25SZWYgd291bGQgdGhlbiBiZVxuICAgIC8vIGNyZWF0ZWQgb3V0c2lkZSBvZiB0aGUgQW5ndWxhciB6b25lLlxuICAgIHJldHVybiBuZ1pvbmUucnVuKCgpID0+IHtcbiAgICAgIGNvbnN0IG5nWm9uZUluamVjdG9yID0gSW5qZWN0b3IuY3JlYXRlKFxuICAgICAgICAgIHtwcm92aWRlcnM6IHByb3ZpZGVycywgcGFyZW50OiB0aGlzLmluamVjdG9yLCBuYW1lOiBtb2R1bGVGYWN0b3J5Lm1vZHVsZVR5cGUubmFtZX0pO1xuICAgICAgY29uc3QgbW9kdWxlUmVmID0gPEludGVybmFsTmdNb2R1bGVSZWY8TT4+bW9kdWxlRmFjdG9yeS5jcmVhdGUobmdab25lSW5qZWN0b3IpO1xuICAgICAgY29uc3QgZXhjZXB0aW9uSGFuZGxlcjogRXJyb3JIYW5kbGVyfG51bGwgPSBtb2R1bGVSZWYuaW5qZWN0b3IuZ2V0KEVycm9ySGFuZGxlciwgbnVsbCk7XG4gICAgICBpZiAoIWV4Y2VwdGlvbkhhbmRsZXIpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdObyBFcnJvckhhbmRsZXIuIElzIHBsYXRmb3JtIG1vZHVsZSAoQnJvd3Nlck1vZHVsZSkgaW5jbHVkZWQ/Jyk7XG4gICAgICB9XG4gICAgICBuZ1pvbmUhLnJ1bk91dHNpZGVBbmd1bGFyKCgpID0+IHtcbiAgICAgICAgY29uc3Qgc3Vic2NyaXB0aW9uID0gbmdab25lIS5vbkVycm9yLnN1YnNjcmliZSh7XG4gICAgICAgICAgbmV4dDogKGVycm9yOiBhbnkpID0+IHtcbiAgICAgICAgICAgIGV4Y2VwdGlvbkhhbmRsZXIuaGFuZGxlRXJyb3IoZXJyb3IpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIG1vZHVsZVJlZi5vbkRlc3Ryb3koKCkgPT4ge1xuICAgICAgICAgIHJlbW92ZSh0aGlzLl9tb2R1bGVzLCBtb2R1bGVSZWYpO1xuICAgICAgICAgIHN1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIF9jYWxsQW5kUmVwb3J0VG9FcnJvckhhbmRsZXIoZXhjZXB0aW9uSGFuZGxlciwgbmdab25lISwgKCkgPT4ge1xuICAgICAgICBjb25zdCBpbml0U3RhdHVzOiBBcHBsaWNhdGlvbkluaXRTdGF0dXMgPSBtb2R1bGVSZWYuaW5qZWN0b3IuZ2V0KEFwcGxpY2F0aW9uSW5pdFN0YXR1cyk7XG4gICAgICAgIGluaXRTdGF0dXMucnVuSW5pdGlhbGl6ZXJzKCk7XG4gICAgICAgIHJldHVybiBpbml0U3RhdHVzLmRvbmVQcm9taXNlLnRoZW4oKCkgPT4ge1xuICAgICAgICAgIGlmIChpdnlFbmFibGVkKSB7XG4gICAgICAgICAgICAvLyBJZiB0aGUgYExPQ0FMRV9JRGAgcHJvdmlkZXIgaXMgZGVmaW5lZCBhdCBib290c3RyYXAgdGhlbiB3ZSBzZXQgdGhlIHZhbHVlIGZvciBpdnlcbiAgICAgICAgICAgIGNvbnN0IGxvY2FsZUlkID0gbW9kdWxlUmVmLmluamVjdG9yLmdldChMT0NBTEVfSUQsIERFRkFVTFRfTE9DQUxFX0lEKTtcbiAgICAgICAgICAgIHNldExvY2FsZUlkKGxvY2FsZUlkIHx8IERFRkFVTFRfTE9DQUxFX0lEKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhpcy5fbW9kdWxlRG9Cb290c3RyYXAobW9kdWxlUmVmKTtcbiAgICAgICAgICByZXR1cm4gbW9kdWxlUmVmO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYW4gaW5zdGFuY2Ugb2YgYW4gYEBOZ01vZHVsZWAgZm9yIGEgZ2l2ZW4gcGxhdGZvcm0gdXNpbmcgdGhlIGdpdmVuIHJ1bnRpbWUgY29tcGlsZXIuXG4gICAqXG4gICAqIEB1c2FnZU5vdGVzXG4gICAqICMjIyBTaW1wbGUgRXhhbXBsZVxuICAgKlxuICAgKiBgYGB0eXBlc2NyaXB0XG4gICAqIEBOZ01vZHVsZSh7XG4gICAqICAgaW1wb3J0czogW0Jyb3dzZXJNb2R1bGVdXG4gICAqIH0pXG4gICAqIGNsYXNzIE15TW9kdWxlIHt9XG4gICAqXG4gICAqIGxldCBtb2R1bGVSZWYgPSBwbGF0Zm9ybUJyb3dzZXIoKS5ib290c3RyYXBNb2R1bGUoTXlNb2R1bGUpO1xuICAgKiBgYGBcbiAgICpcbiAgICovXG4gIGJvb3RzdHJhcE1vZHVsZTxNPihcbiAgICAgIG1vZHVsZVR5cGU6IFR5cGU8TT4sXG4gICAgICBjb21waWxlck9wdGlvbnM6IChDb21waWxlck9wdGlvbnMmQm9vdHN0cmFwT3B0aW9ucyl8XG4gICAgICBBcnJheTxDb21waWxlck9wdGlvbnMmQm9vdHN0cmFwT3B0aW9ucz4gPSBbXSk6IFByb21pc2U8TmdNb2R1bGVSZWY8TT4+IHtcbiAgICBjb25zdCBvcHRpb25zID0gb3B0aW9uc1JlZHVjZXIoe30sIGNvbXBpbGVyT3B0aW9ucyk7XG4gICAgcmV0dXJuIGNvbXBpbGVOZ01vZHVsZUZhY3RvcnkodGhpcy5pbmplY3Rvciwgb3B0aW9ucywgbW9kdWxlVHlwZSlcbiAgICAgICAgLnRoZW4obW9kdWxlRmFjdG9yeSA9PiB0aGlzLmJvb3RzdHJhcE1vZHVsZUZhY3RvcnkobW9kdWxlRmFjdG9yeSwgb3B0aW9ucykpO1xuICB9XG5cbiAgcHJpdmF0ZSBfbW9kdWxlRG9Cb290c3RyYXAobW9kdWxlUmVmOiBJbnRlcm5hbE5nTW9kdWxlUmVmPGFueT4pOiB2b2lkIHtcbiAgICBjb25zdCBhcHBSZWYgPSBtb2R1bGVSZWYuaW5qZWN0b3IuZ2V0KEFwcGxpY2F0aW9uUmVmKSBhcyBBcHBsaWNhdGlvblJlZjtcbiAgICBpZiAobW9kdWxlUmVmLl9ib290c3RyYXBDb21wb25lbnRzLmxlbmd0aCA+IDApIHtcbiAgICAgIG1vZHVsZVJlZi5fYm9vdHN0cmFwQ29tcG9uZW50cy5mb3JFYWNoKGYgPT4gYXBwUmVmLmJvb3RzdHJhcChmKSk7XG4gICAgfSBlbHNlIGlmIChtb2R1bGVSZWYuaW5zdGFuY2UubmdEb0Jvb3RzdHJhcCkge1xuICAgICAgbW9kdWxlUmVmLmluc3RhbmNlLm5nRG9Cb290c3RyYXAoYXBwUmVmKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgIGBUaGUgbW9kdWxlICR7XG4gICAgICAgICAgICAgIHN0cmluZ2lmeShcbiAgICAgICAgICAgICAgICAgIG1vZHVsZVJlZi5pbnN0YW5jZVxuICAgICAgICAgICAgICAgICAgICAgIC5jb25zdHJ1Y3Rvcil9IHdhcyBib290c3RyYXBwZWQsIGJ1dCBpdCBkb2VzIG5vdCBkZWNsYXJlIFwiQE5nTW9kdWxlLmJvb3RzdHJhcFwiIGNvbXBvbmVudHMgbm9yIGEgXCJuZ0RvQm9vdHN0cmFwXCIgbWV0aG9kLiBgICtcbiAgICAgICAgICBgUGxlYXNlIGRlZmluZSBvbmUgb2YgdGhlc2UuYCk7XG4gICAgfVxuICAgIHRoaXMuX21vZHVsZXMucHVzaChtb2R1bGVSZWYpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlZ2lzdGVycyBhIGxpc3RlbmVyIHRvIGJlIGNhbGxlZCB3aGVuIHRoZSBwbGF0Zm9ybSBpcyBkZXN0cm95ZWQuXG4gICAqL1xuICBvbkRlc3Ryb3koY2FsbGJhY2s6ICgpID0+IHZvaWQpOiB2b2lkIHtcbiAgICB0aGlzLl9kZXN0cm95TGlzdGVuZXJzLnB1c2goY2FsbGJhY2spO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHJpZXZlcyB0aGUgcGxhdGZvcm0ge0BsaW5rIEluamVjdG9yfSwgd2hpY2ggaXMgdGhlIHBhcmVudCBpbmplY3RvciBmb3JcbiAgICogZXZlcnkgQW5ndWxhciBhcHBsaWNhdGlvbiBvbiB0aGUgcGFnZSBhbmQgcHJvdmlkZXMgc2luZ2xldG9uIHByb3ZpZGVycy5cbiAgICovXG4gIGdldCBpbmplY3RvcigpOiBJbmplY3RvciB7XG4gICAgcmV0dXJuIHRoaXMuX2luamVjdG9yO1xuICB9XG5cbiAgLyoqXG4gICAqIERlc3Ryb3lzIHRoZSBjdXJyZW50IEFuZ3VsYXIgcGxhdGZvcm0gYW5kIGFsbCBBbmd1bGFyIGFwcGxpY2F0aW9ucyBvbiB0aGUgcGFnZS5cbiAgICogRGVzdHJveXMgYWxsIG1vZHVsZXMgYW5kIGxpc3RlbmVycyByZWdpc3RlcmVkIHdpdGggdGhlIHBsYXRmb3JtLlxuICAgKi9cbiAgZGVzdHJveSgpIHtcbiAgICBpZiAodGhpcy5fZGVzdHJveWVkKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1RoZSBwbGF0Zm9ybSBoYXMgYWxyZWFkeSBiZWVuIGRlc3Ryb3llZCEnKTtcbiAgICB9XG4gICAgdGhpcy5fbW9kdWxlcy5zbGljZSgpLmZvckVhY2gobW9kdWxlID0+IG1vZHVsZS5kZXN0cm95KCkpO1xuICAgIHRoaXMuX2Rlc3Ryb3lMaXN0ZW5lcnMuZm9yRWFjaChsaXN0ZW5lciA9PiBsaXN0ZW5lcigpKTtcbiAgICB0aGlzLl9kZXN0cm95ZWQgPSB0cnVlO1xuICB9XG5cbiAgZ2V0IGRlc3Ryb3llZCgpIHtcbiAgICByZXR1cm4gdGhpcy5fZGVzdHJveWVkO1xuICB9XG59XG5cbmZ1bmN0aW9uIGdldE5nWm9uZShcbiAgICBuZ1pvbmVPcHRpb246IE5nWm9uZXwnem9uZS5qcyd8J25vb3AnfHVuZGVmaW5lZCxcbiAgICBleHRyYT86IHtuZ1pvbmVFdmVudENvYWxlc2Npbmc6IGJvb2xlYW4sIG5nWm9uZVJ1bkNvYWxlc2Npbmc6IGJvb2xlYW59KTogTmdab25lIHtcbiAgbGV0IG5nWm9uZTogTmdab25lO1xuXG4gIGlmIChuZ1pvbmVPcHRpb24gPT09ICdub29wJykge1xuICAgIG5nWm9uZSA9IG5ldyBOb29wTmdab25lKCk7XG4gIH0gZWxzZSB7XG4gICAgbmdab25lID0gKG5nWm9uZU9wdGlvbiA9PT0gJ3pvbmUuanMnID8gdW5kZWZpbmVkIDogbmdab25lT3B0aW9uKSB8fCBuZXcgTmdab25lKHtcbiAgICAgICAgICAgICAgIGVuYWJsZUxvbmdTdGFja1RyYWNlOiBpc0Rldk1vZGUoKSxcbiAgICAgICAgICAgICAgIHNob3VsZENvYWxlc2NlRXZlbnRDaGFuZ2VEZXRlY3Rpb246ICEhZXh0cmE/Lm5nWm9uZUV2ZW50Q29hbGVzY2luZyxcbiAgICAgICAgICAgICAgIHNob3VsZENvYWxlc2NlUnVuQ2hhbmdlRGV0ZWN0aW9uOiAhIWV4dHJhPy5uZ1pvbmVSdW5Db2FsZXNjaW5nXG4gICAgICAgICAgICAgfSk7XG4gIH1cbiAgcmV0dXJuIG5nWm9uZTtcbn1cblxuZnVuY3Rpb24gX2NhbGxBbmRSZXBvcnRUb0Vycm9ySGFuZGxlcihcbiAgICBlcnJvckhhbmRsZXI6IEVycm9ySGFuZGxlciwgbmdab25lOiBOZ1pvbmUsIGNhbGxiYWNrOiAoKSA9PiBhbnkpOiBhbnkge1xuICB0cnkge1xuICAgIGNvbnN0IHJlc3VsdCA9IGNhbGxiYWNrKCk7XG4gICAgaWYgKGlzUHJvbWlzZShyZXN1bHQpKSB7XG4gICAgICByZXR1cm4gcmVzdWx0LmNhdGNoKChlOiBhbnkpID0+IHtcbiAgICAgICAgbmdab25lLnJ1bk91dHNpZGVBbmd1bGFyKCgpID0+IGVycm9ySGFuZGxlci5oYW5kbGVFcnJvcihlKSk7XG4gICAgICAgIC8vIHJldGhyb3cgYXMgdGhlIGV4Y2VwdGlvbiBoYW5kbGVyIG1pZ2h0IG5vdCBkbyBpdFxuICAgICAgICB0aHJvdyBlO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfSBjYXRjaCAoZSkge1xuICAgIG5nWm9uZS5ydW5PdXRzaWRlQW5ndWxhcigoKSA9PiBlcnJvckhhbmRsZXIuaGFuZGxlRXJyb3IoZSkpO1xuICAgIC8vIHJldGhyb3cgYXMgdGhlIGV4Y2VwdGlvbiBoYW5kbGVyIG1pZ2h0IG5vdCBkbyBpdFxuICAgIHRocm93IGU7XG4gIH1cbn1cblxuZnVuY3Rpb24gb3B0aW9uc1JlZHVjZXI8VCBleHRlbmRzIE9iamVjdD4oZHN0OiBhbnksIG9ianM6IFR8VFtdKTogVCB7XG4gIGlmIChBcnJheS5pc0FycmF5KG9ianMpKSB7XG4gICAgZHN0ID0gb2Jqcy5yZWR1Y2Uob3B0aW9uc1JlZHVjZXIsIGRzdCk7XG4gIH0gZWxzZSB7XG4gICAgZHN0ID0gey4uLmRzdCwgLi4uKG9ianMgYXMgYW55KX07XG4gIH1cbiAgcmV0dXJuIGRzdDtcbn1cblxuLyoqXG4gKiBBIHJlZmVyZW5jZSB0byBhbiBBbmd1bGFyIGFwcGxpY2F0aW9uIHJ1bm5pbmcgb24gYSBwYWdlLlxuICpcbiAqIEB1c2FnZU5vdGVzXG4gKlxuICoge0BhIGlzLXN0YWJsZS1leGFtcGxlc31cbiAqICMjIyBpc1N0YWJsZSBleGFtcGxlcyBhbmQgY2F2ZWF0c1xuICpcbiAqIE5vdGUgdHdvIGltcG9ydGFudCBwb2ludHMgYWJvdXQgYGlzU3RhYmxlYCwgZGVtb25zdHJhdGVkIGluIHRoZSBleGFtcGxlcyBiZWxvdzpcbiAqIC0gdGhlIGFwcGxpY2F0aW9uIHdpbGwgbmV2ZXIgYmUgc3RhYmxlIGlmIHlvdSBzdGFydCBhbnkga2luZFxuICogb2YgcmVjdXJyZW50IGFzeW5jaHJvbm91cyB0YXNrIHdoZW4gdGhlIGFwcGxpY2F0aW9uIHN0YXJ0c1xuICogKGZvciBleGFtcGxlIGZvciBhIHBvbGxpbmcgcHJvY2Vzcywgc3RhcnRlZCB3aXRoIGEgYHNldEludGVydmFsYCwgYSBgc2V0VGltZW91dGBcbiAqIG9yIHVzaW5nIFJ4SlMgb3BlcmF0b3JzIGxpa2UgYGludGVydmFsYCk7XG4gKiAtIHRoZSBgaXNTdGFibGVgIE9ic2VydmFibGUgcnVucyBvdXRzaWRlIG9mIHRoZSBBbmd1bGFyIHpvbmUuXG4gKlxuICogTGV0J3MgaW1hZ2luZSB0aGF0IHlvdSBzdGFydCBhIHJlY3VycmVudCB0YXNrXG4gKiAoaGVyZSBpbmNyZW1lbnRpbmcgYSBjb3VudGVyLCB1c2luZyBSeEpTIGBpbnRlcnZhbGApLFxuICogYW5kIGF0IHRoZSBzYW1lIHRpbWUgc3Vic2NyaWJlIHRvIGBpc1N0YWJsZWAuXG4gKlxuICogYGBgXG4gKiBjb25zdHJ1Y3RvcihhcHBSZWY6IEFwcGxpY2F0aW9uUmVmKSB7XG4gKiAgIGFwcFJlZi5pc1N0YWJsZS5waXBlKFxuICogICAgICBmaWx0ZXIoc3RhYmxlID0+IHN0YWJsZSlcbiAqICAgKS5zdWJzY3JpYmUoKCkgPT4gY29uc29sZS5sb2coJ0FwcCBpcyBzdGFibGUgbm93Jyk7XG4gKiAgIGludGVydmFsKDEwMDApLnN1YnNjcmliZShjb3VudGVyID0+IGNvbnNvbGUubG9nKGNvdW50ZXIpKTtcbiAqIH1cbiAqIGBgYFxuICogSW4gdGhpcyBleGFtcGxlLCBgaXNTdGFibGVgIHdpbGwgbmV2ZXIgZW1pdCBgdHJ1ZWAsXG4gKiBhbmQgdGhlIHRyYWNlIFwiQXBwIGlzIHN0YWJsZSBub3dcIiB3aWxsIG5ldmVyIGdldCBsb2dnZWQuXG4gKlxuICogSWYgeW91IHdhbnQgdG8gZXhlY3V0ZSBzb21ldGhpbmcgd2hlbiB0aGUgYXBwIGlzIHN0YWJsZSxcbiAqIHlvdSBoYXZlIHRvIHdhaXQgZm9yIHRoZSBhcHBsaWNhdGlvbiB0byBiZSBzdGFibGVcbiAqIGJlZm9yZSBzdGFydGluZyB5b3VyIHBvbGxpbmcgcHJvY2Vzcy5cbiAqXG4gKiBgYGBcbiAqIGNvbnN0cnVjdG9yKGFwcFJlZjogQXBwbGljYXRpb25SZWYpIHtcbiAqICAgYXBwUmVmLmlzU3RhYmxlLnBpcGUoXG4gKiAgICAgZmlyc3Qoc3RhYmxlID0+IHN0YWJsZSksXG4gKiAgICAgdGFwKHN0YWJsZSA9PiBjb25zb2xlLmxvZygnQXBwIGlzIHN0YWJsZSBub3cnKSksXG4gKiAgICAgc3dpdGNoTWFwKCgpID0+IGludGVydmFsKDEwMDApKVxuICogICApLnN1YnNjcmliZShjb3VudGVyID0+IGNvbnNvbGUubG9nKGNvdW50ZXIpKTtcbiAqIH1cbiAqIGBgYFxuICogSW4gdGhpcyBleGFtcGxlLCB0aGUgdHJhY2UgXCJBcHAgaXMgc3RhYmxlIG5vd1wiIHdpbGwgYmUgbG9nZ2VkXG4gKiBhbmQgdGhlbiB0aGUgY291bnRlciBzdGFydHMgaW5jcmVtZW50aW5nIGV2ZXJ5IHNlY29uZC5cbiAqXG4gKiBOb3RlIGFsc28gdGhhdCB0aGlzIE9ic2VydmFibGUgcnVucyBvdXRzaWRlIG9mIHRoZSBBbmd1bGFyIHpvbmUsXG4gKiB3aGljaCBtZWFucyB0aGF0IHRoZSBjb2RlIGluIHRoZSBzdWJzY3JpcHRpb25cbiAqIHRvIHRoaXMgT2JzZXJ2YWJsZSB3aWxsIG5vdCB0cmlnZ2VyIHRoZSBjaGFuZ2UgZGV0ZWN0aW9uLlxuICpcbiAqIExldCdzIGltYWdpbmUgdGhhdCBpbnN0ZWFkIG9mIGxvZ2dpbmcgdGhlIGNvdW50ZXIgdmFsdWUsXG4gKiB5b3UgdXBkYXRlIGEgZmllbGQgb2YgeW91ciBjb21wb25lbnRcbiAqIGFuZCBkaXNwbGF5IGl0IGluIGl0cyB0ZW1wbGF0ZS5cbiAqXG4gKiBgYGBcbiAqIGNvbnN0cnVjdG9yKGFwcFJlZjogQXBwbGljYXRpb25SZWYpIHtcbiAqICAgYXBwUmVmLmlzU3RhYmxlLnBpcGUoXG4gKiAgICAgZmlyc3Qoc3RhYmxlID0+IHN0YWJsZSksXG4gKiAgICAgc3dpdGNoTWFwKCgpID0+IGludGVydmFsKDEwMDApKVxuICogICApLnN1YnNjcmliZShjb3VudGVyID0+IHRoaXMudmFsdWUgPSBjb3VudGVyKTtcbiAqIH1cbiAqIGBgYFxuICogQXMgdGhlIGBpc1N0YWJsZWAgT2JzZXJ2YWJsZSBydW5zIG91dHNpZGUgdGhlIHpvbmUsXG4gKiB0aGUgYHZhbHVlYCBmaWVsZCB3aWxsIGJlIHVwZGF0ZWQgcHJvcGVybHksXG4gKiBidXQgdGhlIHRlbXBsYXRlIHdpbGwgbm90IGJlIHJlZnJlc2hlZCFcbiAqXG4gKiBZb3UnbGwgaGF2ZSB0byBtYW51YWxseSB0cmlnZ2VyIHRoZSBjaGFuZ2UgZGV0ZWN0aW9uIHRvIHVwZGF0ZSB0aGUgdGVtcGxhdGUuXG4gKlxuICogYGBgXG4gKiBjb25zdHJ1Y3RvcihhcHBSZWY6IEFwcGxpY2F0aW9uUmVmLCBjZDogQ2hhbmdlRGV0ZWN0b3JSZWYpIHtcbiAqICAgYXBwUmVmLmlzU3RhYmxlLnBpcGUoXG4gKiAgICAgZmlyc3Qoc3RhYmxlID0+IHN0YWJsZSksXG4gKiAgICAgc3dpdGNoTWFwKCgpID0+IGludGVydmFsKDEwMDApKVxuICogICApLnN1YnNjcmliZShjb3VudGVyID0+IHtcbiAqICAgICB0aGlzLnZhbHVlID0gY291bnRlcjtcbiAqICAgICBjZC5kZXRlY3RDaGFuZ2VzKCk7XG4gKiAgIH0pO1xuICogfVxuICogYGBgXG4gKlxuICogT3IgbWFrZSB0aGUgc3Vic2NyaXB0aW9uIGNhbGxiYWNrIHJ1biBpbnNpZGUgdGhlIHpvbmUuXG4gKlxuICogYGBgXG4gKiBjb25zdHJ1Y3RvcihhcHBSZWY6IEFwcGxpY2F0aW9uUmVmLCB6b25lOiBOZ1pvbmUpIHtcbiAqICAgYXBwUmVmLmlzU3RhYmxlLnBpcGUoXG4gKiAgICAgZmlyc3Qoc3RhYmxlID0+IHN0YWJsZSksXG4gKiAgICAgc3dpdGNoTWFwKCgpID0+IGludGVydmFsKDEwMDApKVxuICogICApLnN1YnNjcmliZShjb3VudGVyID0+IHpvbmUucnVuKCgpID0+IHRoaXMudmFsdWUgPSBjb3VudGVyKSk7XG4gKiB9XG4gKiBgYGBcbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbkBJbmplY3RhYmxlKClcbmV4cG9ydCBjbGFzcyBBcHBsaWNhdGlvblJlZiB7XG4gIC8qKiBAaW50ZXJuYWwgKi9cbiAgcHJpdmF0ZSBfYm9vdHN0cmFwTGlzdGVuZXJzOiAoKGNvbXBSZWY6IENvbXBvbmVudFJlZjxhbnk+KSA9PiB2b2lkKVtdID0gW107XG4gIHByaXZhdGUgX3ZpZXdzOiBJbnRlcm5hbFZpZXdSZWZbXSA9IFtdO1xuICBwcml2YXRlIF9ydW5uaW5nVGljazogYm9vbGVhbiA9IGZhbHNlO1xuICBwcml2YXRlIF9zdGFibGUgPSB0cnVlO1xuICBwcml2YXRlIF9vbk1pY3JvdGFza0VtcHR5U3Vic2NyaXB0aW9uOiBTdWJzY3JpcHRpb247XG5cbiAgLyoqXG4gICAqIEdldCBhIGxpc3Qgb2YgY29tcG9uZW50IHR5cGVzIHJlZ2lzdGVyZWQgdG8gdGhpcyBhcHBsaWNhdGlvbi5cbiAgICogVGhpcyBsaXN0IGlzIHBvcHVsYXRlZCBldmVuIGJlZm9yZSB0aGUgY29tcG9uZW50IGlzIGNyZWF0ZWQuXG4gICAqL1xuICBwdWJsaWMgcmVhZG9ubHkgY29tcG9uZW50VHlwZXM6IFR5cGU8YW55PltdID0gW107XG5cbiAgLyoqXG4gICAqIEdldCBhIGxpc3Qgb2YgY29tcG9uZW50cyByZWdpc3RlcmVkIHRvIHRoaXMgYXBwbGljYXRpb24uXG4gICAqL1xuICBwdWJsaWMgcmVhZG9ubHkgY29tcG9uZW50czogQ29tcG9uZW50UmVmPGFueT5bXSA9IFtdO1xuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGFuIE9ic2VydmFibGUgdGhhdCBpbmRpY2F0ZXMgd2hlbiB0aGUgYXBwbGljYXRpb24gaXMgc3RhYmxlIG9yIHVuc3RhYmxlLlxuICAgKlxuICAgKiBAc2VlICBbVXNhZ2Ugbm90ZXNdKCNpcy1zdGFibGUtZXhhbXBsZXMpIGZvciBleGFtcGxlcyBhbmQgY2F2ZWF0cyB3aGVuIHVzaW5nIHRoaXMgQVBJLlxuICAgKi9cbiAgLy8gVE9ETyhpc3N1ZS8yNDU3MSk6IHJlbW92ZSAnIScuXG4gIHB1YmxpYyByZWFkb25seSBpc1N0YWJsZSE6IE9ic2VydmFibGU8Ym9vbGVhbj47XG5cbiAgLyoqIEBpbnRlcm5hbCAqL1xuICBjb25zdHJ1Y3RvcihcbiAgICAgIHByaXZhdGUgX3pvbmU6IE5nWm9uZSwgcHJpdmF0ZSBfaW5qZWN0b3I6IEluamVjdG9yLCBwcml2YXRlIF9leGNlcHRpb25IYW5kbGVyOiBFcnJvckhhbmRsZXIsXG4gICAgICBwcml2YXRlIF9jb21wb25lbnRGYWN0b3J5UmVzb2x2ZXI6IENvbXBvbmVudEZhY3RvcnlSZXNvbHZlcixcbiAgICAgIHByaXZhdGUgX2luaXRTdGF0dXM6IEFwcGxpY2F0aW9uSW5pdFN0YXR1cykge1xuICAgIHRoaXMuX29uTWljcm90YXNrRW1wdHlTdWJzY3JpcHRpb24gPSB0aGlzLl96b25lLm9uTWljcm90YXNrRW1wdHkuc3Vic2NyaWJlKHtcbiAgICAgIG5leHQ6ICgpID0+IHtcbiAgICAgICAgdGhpcy5fem9uZS5ydW4oKCkgPT4ge1xuICAgICAgICAgIHRoaXMudGljaygpO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIGNvbnN0IGlzQ3VycmVudGx5U3RhYmxlID0gbmV3IE9ic2VydmFibGU8Ym9vbGVhbj4oKG9ic2VydmVyOiBPYnNlcnZlcjxib29sZWFuPikgPT4ge1xuICAgICAgdGhpcy5fc3RhYmxlID0gdGhpcy5fem9uZS5pc1N0YWJsZSAmJiAhdGhpcy5fem9uZS5oYXNQZW5kaW5nTWFjcm90YXNrcyAmJlxuICAgICAgICAgICF0aGlzLl96b25lLmhhc1BlbmRpbmdNaWNyb3Rhc2tzO1xuICAgICAgdGhpcy5fem9uZS5ydW5PdXRzaWRlQW5ndWxhcigoKSA9PiB7XG4gICAgICAgIG9ic2VydmVyLm5leHQodGhpcy5fc3RhYmxlKTtcbiAgICAgICAgb2JzZXJ2ZXIuY29tcGxldGUoKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgY29uc3QgaXNTdGFibGUgPSBuZXcgT2JzZXJ2YWJsZTxib29sZWFuPigob2JzZXJ2ZXI6IE9ic2VydmVyPGJvb2xlYW4+KSA9PiB7XG4gICAgICAvLyBDcmVhdGUgdGhlIHN1YnNjcmlwdGlvbiB0byBvblN0YWJsZSBvdXRzaWRlIHRoZSBBbmd1bGFyIFpvbmUgc28gdGhhdFxuICAgICAgLy8gdGhlIGNhbGxiYWNrIGlzIHJ1biBvdXRzaWRlIHRoZSBBbmd1bGFyIFpvbmUuXG4gICAgICBsZXQgc3RhYmxlU3ViOiBTdWJzY3JpcHRpb247XG4gICAgICB0aGlzLl96b25lLnJ1bk91dHNpZGVBbmd1bGFyKCgpID0+IHtcbiAgICAgICAgc3RhYmxlU3ViID0gdGhpcy5fem9uZS5vblN0YWJsZS5zdWJzY3JpYmUoKCkgPT4ge1xuICAgICAgICAgIE5nWm9uZS5hc3NlcnROb3RJbkFuZ3VsYXJab25lKCk7XG5cbiAgICAgICAgICAvLyBDaGVjayB3aGV0aGVyIHRoZXJlIGFyZSBubyBwZW5kaW5nIG1hY3JvL21pY3JvIHRhc2tzIGluIHRoZSBuZXh0IHRpY2tcbiAgICAgICAgICAvLyB0byBhbGxvdyBmb3IgTmdab25lIHRvIHVwZGF0ZSB0aGUgc3RhdGUuXG4gICAgICAgICAgc2NoZWR1bGVNaWNyb1Rhc2soKCkgPT4ge1xuICAgICAgICAgICAgaWYgKCF0aGlzLl9zdGFibGUgJiYgIXRoaXMuX3pvbmUuaGFzUGVuZGluZ01hY3JvdGFza3MgJiZcbiAgICAgICAgICAgICAgICAhdGhpcy5fem9uZS5oYXNQZW5kaW5nTWljcm90YXNrcykge1xuICAgICAgICAgICAgICB0aGlzLl9zdGFibGUgPSB0cnVlO1xuICAgICAgICAgICAgICBvYnNlcnZlci5uZXh0KHRydWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuXG4gICAgICBjb25zdCB1bnN0YWJsZVN1YjogU3Vic2NyaXB0aW9uID0gdGhpcy5fem9uZS5vblVuc3RhYmxlLnN1YnNjcmliZSgoKSA9PiB7XG4gICAgICAgIE5nWm9uZS5hc3NlcnRJbkFuZ3VsYXJab25lKCk7XG4gICAgICAgIGlmICh0aGlzLl9zdGFibGUpIHtcbiAgICAgICAgICB0aGlzLl9zdGFibGUgPSBmYWxzZTtcbiAgICAgICAgICB0aGlzLl96b25lLnJ1bk91dHNpZGVBbmd1bGFyKCgpID0+IHtcbiAgICAgICAgICAgIG9ic2VydmVyLm5leHQoZmFsc2UpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgcmV0dXJuICgpID0+IHtcbiAgICAgICAgc3RhYmxlU3ViLnVuc3Vic2NyaWJlKCk7XG4gICAgICAgIHVuc3RhYmxlU3ViLnVuc3Vic2NyaWJlKCk7XG4gICAgICB9O1xuICAgIH0pO1xuXG4gICAgKHRoaXMgYXMge2lzU3RhYmxlOiBPYnNlcnZhYmxlPGJvb2xlYW4+fSkuaXNTdGFibGUgPVxuICAgICAgICBtZXJnZShpc0N1cnJlbnRseVN0YWJsZSwgaXNTdGFibGUucGlwZShzaGFyZSgpKSk7XG4gIH1cblxuICAvKipcbiAgICogQm9vdHN0cmFwIGEgY29tcG9uZW50IG9udG8gdGhlIGVsZW1lbnQgaWRlbnRpZmllZCBieSBpdHMgc2VsZWN0b3Igb3IsIG9wdGlvbmFsbHksIHRvIGFcbiAgICogc3BlY2lmaWVkIGVsZW1lbnQuXG4gICAqXG4gICAqIEB1c2FnZU5vdGVzXG4gICAqICMjIyBCb290c3RyYXAgcHJvY2Vzc1xuICAgKlxuICAgKiBXaGVuIGJvb3RzdHJhcHBpbmcgYSBjb21wb25lbnQsIEFuZ3VsYXIgbW91bnRzIGl0IG9udG8gYSB0YXJnZXQgRE9NIGVsZW1lbnRcbiAgICogYW5kIGtpY2tzIG9mZiBhdXRvbWF0aWMgY2hhbmdlIGRldGVjdGlvbi4gVGhlIHRhcmdldCBET00gZWxlbWVudCBjYW4gYmVcbiAgICogcHJvdmlkZWQgdXNpbmcgdGhlIGByb290U2VsZWN0b3JPck5vZGVgIGFyZ3VtZW50LlxuICAgKlxuICAgKiBJZiB0aGUgdGFyZ2V0IERPTSBlbGVtZW50IGlzIG5vdCBwcm92aWRlZCwgQW5ndWxhciB0cmllcyB0byBmaW5kIG9uZSBvbiBhIHBhZ2VcbiAgICogdXNpbmcgdGhlIGBzZWxlY3RvcmAgb2YgdGhlIGNvbXBvbmVudCB0aGF0IGlzIGJlaW5nIGJvb3RzdHJhcHBlZFxuICAgKiAoZmlyc3QgbWF0Y2hlZCBlbGVtZW50IGlzIHVzZWQpLlxuICAgKlxuICAgKiAjIyMgRXhhbXBsZVxuICAgKlxuICAgKiBHZW5lcmFsbHksIHdlIGRlZmluZSB0aGUgY29tcG9uZW50IHRvIGJvb3RzdHJhcCBpbiB0aGUgYGJvb3RzdHJhcGAgYXJyYXkgb2YgYE5nTW9kdWxlYCxcbiAgICogYnV0IGl0IHJlcXVpcmVzIHVzIHRvIGtub3cgdGhlIGNvbXBvbmVudCB3aGlsZSB3cml0aW5nIHRoZSBhcHBsaWNhdGlvbiBjb2RlLlxuICAgKlxuICAgKiBJbWFnaW5lIGEgc2l0dWF0aW9uIHdoZXJlIHdlIGhhdmUgdG8gd2FpdCBmb3IgYW4gQVBJIGNhbGwgdG8gZGVjaWRlIGFib3V0IHRoZSBjb21wb25lbnQgdG9cbiAgICogYm9vdHN0cmFwLiBXZSBjYW4gdXNlIHRoZSBgbmdEb0Jvb3RzdHJhcGAgaG9vayBvZiB0aGUgYE5nTW9kdWxlYCBhbmQgY2FsbCB0aGlzIG1ldGhvZCB0b1xuICAgKiBkeW5hbWljYWxseSBib290c3RyYXAgYSBjb21wb25lbnQuXG4gICAqXG4gICAqIHtAZXhhbXBsZSBjb3JlL3RzL3BsYXRmb3JtL3BsYXRmb3JtLnRzIHJlZ2lvbj0nY29tcG9uZW50U2VsZWN0b3InfVxuICAgKlxuICAgKiBPcHRpb25hbGx5LCBhIGNvbXBvbmVudCBjYW4gYmUgbW91bnRlZCBvbnRvIGEgRE9NIGVsZW1lbnQgdGhhdCBkb2VzIG5vdCBtYXRjaCB0aGVcbiAgICogc2VsZWN0b3Igb2YgdGhlIGJvb3RzdHJhcHBlZCBjb21wb25lbnQuXG4gICAqXG4gICAqIEluIHRoZSBmb2xsb3dpbmcgZXhhbXBsZSwgd2UgYXJlIHByb3ZpZGluZyBhIENTUyBzZWxlY3RvciB0byBtYXRjaCB0aGUgdGFyZ2V0IGVsZW1lbnQuXG4gICAqXG4gICAqIHtAZXhhbXBsZSBjb3JlL3RzL3BsYXRmb3JtL3BsYXRmb3JtLnRzIHJlZ2lvbj0nY3NzU2VsZWN0b3InfVxuICAgKlxuICAgKiBXaGlsZSBpbiB0aGlzIGV4YW1wbGUsIHdlIGFyZSBwcm92aWRpbmcgcmVmZXJlbmNlIHRvIGEgRE9NIG5vZGUuXG4gICAqXG4gICAqIHtAZXhhbXBsZSBjb3JlL3RzL3BsYXRmb3JtL3BsYXRmb3JtLnRzIHJlZ2lvbj0nZG9tTm9kZSd9XG4gICAqL1xuICBib290c3RyYXA8Qz4oY29tcG9uZW50OiBUeXBlPEM+LCByb290U2VsZWN0b3JPck5vZGU/OiBzdHJpbmd8YW55KTogQ29tcG9uZW50UmVmPEM+O1xuXG4gIC8qKlxuICAgKiBCb290c3RyYXAgYSBjb21wb25lbnQgb250byB0aGUgZWxlbWVudCBpZGVudGlmaWVkIGJ5IGl0cyBzZWxlY3RvciBvciwgb3B0aW9uYWxseSwgdG8gYVxuICAgKiBzcGVjaWZpZWQgZWxlbWVudC5cbiAgICpcbiAgICogQHVzYWdlTm90ZXNcbiAgICogIyMjIEJvb3RzdHJhcCBwcm9jZXNzXG4gICAqXG4gICAqIFdoZW4gYm9vdHN0cmFwcGluZyBhIGNvbXBvbmVudCwgQW5ndWxhciBtb3VudHMgaXQgb250byBhIHRhcmdldCBET00gZWxlbWVudFxuICAgKiBhbmQga2lja3Mgb2ZmIGF1dG9tYXRpYyBjaGFuZ2UgZGV0ZWN0aW9uLiBUaGUgdGFyZ2V0IERPTSBlbGVtZW50IGNhbiBiZVxuICAgKiBwcm92aWRlZCB1c2luZyB0aGUgYHJvb3RTZWxlY3Rvck9yTm9kZWAgYXJndW1lbnQuXG4gICAqXG4gICAqIElmIHRoZSB0YXJnZXQgRE9NIGVsZW1lbnQgaXMgbm90IHByb3ZpZGVkLCBBbmd1bGFyIHRyaWVzIHRvIGZpbmQgb25lIG9uIGEgcGFnZVxuICAgKiB1c2luZyB0aGUgYHNlbGVjdG9yYCBvZiB0aGUgY29tcG9uZW50IHRoYXQgaXMgYmVpbmcgYm9vdHN0cmFwcGVkXG4gICAqIChmaXJzdCBtYXRjaGVkIGVsZW1lbnQgaXMgdXNlZCkuXG4gICAqXG4gICAqICMjIyBFeGFtcGxlXG4gICAqXG4gICAqIEdlbmVyYWxseSwgd2UgZGVmaW5lIHRoZSBjb21wb25lbnQgdG8gYm9vdHN0cmFwIGluIHRoZSBgYm9vdHN0cmFwYCBhcnJheSBvZiBgTmdNb2R1bGVgLFxuICAgKiBidXQgaXQgcmVxdWlyZXMgdXMgdG8ga25vdyB0aGUgY29tcG9uZW50IHdoaWxlIHdyaXRpbmcgdGhlIGFwcGxpY2F0aW9uIGNvZGUuXG4gICAqXG4gICAqIEltYWdpbmUgYSBzaXR1YXRpb24gd2hlcmUgd2UgaGF2ZSB0byB3YWl0IGZvciBhbiBBUEkgY2FsbCB0byBkZWNpZGUgYWJvdXQgdGhlIGNvbXBvbmVudCB0b1xuICAgKiBib290c3RyYXAuIFdlIGNhbiB1c2UgdGhlIGBuZ0RvQm9vdHN0cmFwYCBob29rIG9mIHRoZSBgTmdNb2R1bGVgIGFuZCBjYWxsIHRoaXMgbWV0aG9kIHRvXG4gICAqIGR5bmFtaWNhbGx5IGJvb3RzdHJhcCBhIGNvbXBvbmVudC5cbiAgICpcbiAgICoge0BleGFtcGxlIGNvcmUvdHMvcGxhdGZvcm0vcGxhdGZvcm0udHMgcmVnaW9uPSdjb21wb25lbnRTZWxlY3Rvcid9XG4gICAqXG4gICAqIE9wdGlvbmFsbHksIGEgY29tcG9uZW50IGNhbiBiZSBtb3VudGVkIG9udG8gYSBET00gZWxlbWVudCB0aGF0IGRvZXMgbm90IG1hdGNoIHRoZVxuICAgKiBzZWxlY3RvciBvZiB0aGUgYm9vdHN0cmFwcGVkIGNvbXBvbmVudC5cbiAgICpcbiAgICogSW4gdGhlIGZvbGxvd2luZyBleGFtcGxlLCB3ZSBhcmUgcHJvdmlkaW5nIGEgQ1NTIHNlbGVjdG9yIHRvIG1hdGNoIHRoZSB0YXJnZXQgZWxlbWVudC5cbiAgICpcbiAgICoge0BleGFtcGxlIGNvcmUvdHMvcGxhdGZvcm0vcGxhdGZvcm0udHMgcmVnaW9uPSdjc3NTZWxlY3Rvcid9XG4gICAqXG4gICAqIFdoaWxlIGluIHRoaXMgZXhhbXBsZSwgd2UgYXJlIHByb3ZpZGluZyByZWZlcmVuY2UgdG8gYSBET00gbm9kZS5cbiAgICpcbiAgICoge0BleGFtcGxlIGNvcmUvdHMvcGxhdGZvcm0vcGxhdGZvcm0udHMgcmVnaW9uPSdkb21Ob2RlJ31cbiAgICpcbiAgICogQGRlcHJlY2F0ZWQgUGFzc2luZyBDb21wb25lbnQgZmFjdG9yaWVzIGFzIHRoZSBgQXBwbGljYXRpb24uYm9vdHN0cmFwYCBmdW5jdGlvbiBhcmd1bWVudCBpc1xuICAgKiAgICAgZGVwcmVjYXRlZC4gUGFzcyBDb21wb25lbnQgVHlwZXMgaW5zdGVhZC5cbiAgICovXG4gIGJvb3RzdHJhcDxDPihjb21wb25lbnRGYWN0b3J5OiBDb21wb25lbnRGYWN0b3J5PEM+LCByb290U2VsZWN0b3JPck5vZGU/OiBzdHJpbmd8YW55KTpcbiAgICAgIENvbXBvbmVudFJlZjxDPjtcblxuICAvKipcbiAgICogQm9vdHN0cmFwIGEgY29tcG9uZW50IG9udG8gdGhlIGVsZW1lbnQgaWRlbnRpZmllZCBieSBpdHMgc2VsZWN0b3Igb3IsIG9wdGlvbmFsbHksIHRvIGFcbiAgICogc3BlY2lmaWVkIGVsZW1lbnQuXG4gICAqXG4gICAqIEB1c2FnZU5vdGVzXG4gICAqICMjIyBCb290c3RyYXAgcHJvY2Vzc1xuICAgKlxuICAgKiBXaGVuIGJvb3RzdHJhcHBpbmcgYSBjb21wb25lbnQsIEFuZ3VsYXIgbW91bnRzIGl0IG9udG8gYSB0YXJnZXQgRE9NIGVsZW1lbnRcbiAgICogYW5kIGtpY2tzIG9mZiBhdXRvbWF0aWMgY2hhbmdlIGRldGVjdGlvbi4gVGhlIHRhcmdldCBET00gZWxlbWVudCBjYW4gYmVcbiAgICogcHJvdmlkZWQgdXNpbmcgdGhlIGByb290U2VsZWN0b3JPck5vZGVgIGFyZ3VtZW50LlxuICAgKlxuICAgKiBJZiB0aGUgdGFyZ2V0IERPTSBlbGVtZW50IGlzIG5vdCBwcm92aWRlZCwgQW5ndWxhciB0cmllcyB0byBmaW5kIG9uZSBvbiBhIHBhZ2VcbiAgICogdXNpbmcgdGhlIGBzZWxlY3RvcmAgb2YgdGhlIGNvbXBvbmVudCB0aGF0IGlzIGJlaW5nIGJvb3RzdHJhcHBlZFxuICAgKiAoZmlyc3QgbWF0Y2hlZCBlbGVtZW50IGlzIHVzZWQpLlxuICAgKlxuICAgKiAjIyMgRXhhbXBsZVxuICAgKlxuICAgKiBHZW5lcmFsbHksIHdlIGRlZmluZSB0aGUgY29tcG9uZW50IHRvIGJvb3RzdHJhcCBpbiB0aGUgYGJvb3RzdHJhcGAgYXJyYXkgb2YgYE5nTW9kdWxlYCxcbiAgICogYnV0IGl0IHJlcXVpcmVzIHVzIHRvIGtub3cgdGhlIGNvbXBvbmVudCB3aGlsZSB3cml0aW5nIHRoZSBhcHBsaWNhdGlvbiBjb2RlLlxuICAgKlxuICAgKiBJbWFnaW5lIGEgc2l0dWF0aW9uIHdoZXJlIHdlIGhhdmUgdG8gd2FpdCBmb3IgYW4gQVBJIGNhbGwgdG8gZGVjaWRlIGFib3V0IHRoZSBjb21wb25lbnQgdG9cbiAgICogYm9vdHN0cmFwLiBXZSBjYW4gdXNlIHRoZSBgbmdEb0Jvb3RzdHJhcGAgaG9vayBvZiB0aGUgYE5nTW9kdWxlYCBhbmQgY2FsbCB0aGlzIG1ldGhvZCB0b1xuICAgKiBkeW5hbWljYWxseSBib290c3RyYXAgYSBjb21wb25lbnQuXG4gICAqXG4gICAqIHtAZXhhbXBsZSBjb3JlL3RzL3BsYXRmb3JtL3BsYXRmb3JtLnRzIHJlZ2lvbj0nY29tcG9uZW50U2VsZWN0b3InfVxuICAgKlxuICAgKiBPcHRpb25hbGx5LCBhIGNvbXBvbmVudCBjYW4gYmUgbW91bnRlZCBvbnRvIGEgRE9NIGVsZW1lbnQgdGhhdCBkb2VzIG5vdCBtYXRjaCB0aGVcbiAgICogc2VsZWN0b3Igb2YgdGhlIGJvb3RzdHJhcHBlZCBjb21wb25lbnQuXG4gICAqXG4gICAqIEluIHRoZSBmb2xsb3dpbmcgZXhhbXBsZSwgd2UgYXJlIHByb3ZpZGluZyBhIENTUyBzZWxlY3RvciB0byBtYXRjaCB0aGUgdGFyZ2V0IGVsZW1lbnQuXG4gICAqXG4gICAqIHtAZXhhbXBsZSBjb3JlL3RzL3BsYXRmb3JtL3BsYXRmb3JtLnRzIHJlZ2lvbj0nY3NzU2VsZWN0b3InfVxuICAgKlxuICAgKiBXaGlsZSBpbiB0aGlzIGV4YW1wbGUsIHdlIGFyZSBwcm92aWRpbmcgcmVmZXJlbmNlIHRvIGEgRE9NIG5vZGUuXG4gICAqXG4gICAqIHtAZXhhbXBsZSBjb3JlL3RzL3BsYXRmb3JtL3BsYXRmb3JtLnRzIHJlZ2lvbj0nZG9tTm9kZSd9XG4gICAqL1xuICBib290c3RyYXA8Qz4oY29tcG9uZW50T3JGYWN0b3J5OiBDb21wb25lbnRGYWN0b3J5PEM+fFR5cGU8Qz4sIHJvb3RTZWxlY3Rvck9yTm9kZT86IHN0cmluZ3xhbnkpOlxuICAgICAgQ29tcG9uZW50UmVmPEM+IHtcbiAgICBpZiAoIXRoaXMuX2luaXRTdGF0dXMuZG9uZSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgICdDYW5ub3QgYm9vdHN0cmFwIGFzIHRoZXJlIGFyZSBzdGlsbCBhc3luY2hyb25vdXMgaW5pdGlhbGl6ZXJzIHJ1bm5pbmcuIEJvb3RzdHJhcCBjb21wb25lbnRzIGluIHRoZSBgbmdEb0Jvb3RzdHJhcGAgbWV0aG9kIG9mIHRoZSByb290IG1vZHVsZS4nKTtcbiAgICB9XG4gICAgbGV0IGNvbXBvbmVudEZhY3Rvcnk6IENvbXBvbmVudEZhY3Rvcnk8Qz47XG4gICAgaWYgKGNvbXBvbmVudE9yRmFjdG9yeSBpbnN0YW5jZW9mIENvbXBvbmVudEZhY3RvcnkpIHtcbiAgICAgIGNvbXBvbmVudEZhY3RvcnkgPSBjb21wb25lbnRPckZhY3Rvcnk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbXBvbmVudEZhY3RvcnkgPVxuICAgICAgICAgIHRoaXMuX2NvbXBvbmVudEZhY3RvcnlSZXNvbHZlci5yZXNvbHZlQ29tcG9uZW50RmFjdG9yeShjb21wb25lbnRPckZhY3RvcnkpITtcbiAgICB9XG4gICAgdGhpcy5jb21wb25lbnRUeXBlcy5wdXNoKGNvbXBvbmVudEZhY3RvcnkuY29tcG9uZW50VHlwZSk7XG5cbiAgICAvLyBDcmVhdGUgYSBmYWN0b3J5IGFzc29jaWF0ZWQgd2l0aCB0aGUgY3VycmVudCBtb2R1bGUgaWYgaXQncyBub3QgYm91bmQgdG8gc29tZSBvdGhlclxuICAgIGNvbnN0IG5nTW9kdWxlID1cbiAgICAgICAgaXNCb3VuZFRvTW9kdWxlKGNvbXBvbmVudEZhY3RvcnkpID8gdW5kZWZpbmVkIDogdGhpcy5faW5qZWN0b3IuZ2V0KE5nTW9kdWxlUmVmKTtcbiAgICBjb25zdCBzZWxlY3Rvck9yTm9kZSA9IHJvb3RTZWxlY3Rvck9yTm9kZSB8fCBjb21wb25lbnRGYWN0b3J5LnNlbGVjdG9yO1xuICAgIGNvbnN0IGNvbXBSZWYgPSBjb21wb25lbnRGYWN0b3J5LmNyZWF0ZShJbmplY3Rvci5OVUxMLCBbXSwgc2VsZWN0b3JPck5vZGUsIG5nTW9kdWxlKTtcbiAgICBjb25zdCBuYXRpdmVFbGVtZW50ID0gY29tcFJlZi5sb2NhdGlvbi5uYXRpdmVFbGVtZW50O1xuICAgIGNvbnN0IHRlc3RhYmlsaXR5ID0gY29tcFJlZi5pbmplY3Rvci5nZXQoVGVzdGFiaWxpdHksIG51bGwpO1xuICAgIGNvbnN0IHRlc3RhYmlsaXR5UmVnaXN0cnkgPSB0ZXN0YWJpbGl0eSAmJiBjb21wUmVmLmluamVjdG9yLmdldChUZXN0YWJpbGl0eVJlZ2lzdHJ5KTtcbiAgICBpZiAodGVzdGFiaWxpdHkgJiYgdGVzdGFiaWxpdHlSZWdpc3RyeSkge1xuICAgICAgdGVzdGFiaWxpdHlSZWdpc3RyeS5yZWdpc3RlckFwcGxpY2F0aW9uKG5hdGl2ZUVsZW1lbnQsIHRlc3RhYmlsaXR5KTtcbiAgICB9XG5cbiAgICBjb21wUmVmLm9uRGVzdHJveSgoKSA9PiB7XG4gICAgICB0aGlzLmRldGFjaFZpZXcoY29tcFJlZi5ob3N0Vmlldyk7XG4gICAgICByZW1vdmUodGhpcy5jb21wb25lbnRzLCBjb21wUmVmKTtcbiAgICAgIGlmICh0ZXN0YWJpbGl0eVJlZ2lzdHJ5KSB7XG4gICAgICAgIHRlc3RhYmlsaXR5UmVnaXN0cnkudW5yZWdpc3RlckFwcGxpY2F0aW9uKG5hdGl2ZUVsZW1lbnQpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgdGhpcy5fbG9hZENvbXBvbmVudChjb21wUmVmKTtcbiAgICAvLyBOb3RlIHRoYXQgd2UgaGF2ZSBzdGlsbCBsZWZ0IHRoZSBgaXNEZXZNb2RlKClgIGNvbmRpdGlvbiBpbiBvcmRlciB0byBhdm9pZFxuICAgIC8vIGNyZWF0aW5nIGEgYnJlYWtpbmcgY2hhbmdlIGZvciBwcm9qZWN0cyB0aGF0IHN0aWxsIHVzZSB0aGUgVmlldyBFbmdpbmUuXG4gICAgaWYgKCh0eXBlb2YgbmdEZXZNb2RlID09PSAndW5kZWZpbmVkJyB8fCBuZ0Rldk1vZGUpICYmIGlzRGV2TW9kZSgpKSB7XG4gICAgICBjb25zdCBfY29uc29sZSA9IHRoaXMuX2luamVjdG9yLmdldChDb25zb2xlKTtcbiAgICAgIF9jb25zb2xlLmxvZyhcbiAgICAgICAgICBgQW5ndWxhciBpcyBydW5uaW5nIGluIGRldmVsb3BtZW50IG1vZGUuIENhbGwgZW5hYmxlUHJvZE1vZGUoKSB0byBlbmFibGUgcHJvZHVjdGlvbiBtb2RlLmApO1xuICAgIH1cbiAgICByZXR1cm4gY29tcFJlZjtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbnZva2UgdGhpcyBtZXRob2QgdG8gZXhwbGljaXRseSBwcm9jZXNzIGNoYW5nZSBkZXRlY3Rpb24gYW5kIGl0cyBzaWRlLWVmZmVjdHMuXG4gICAqXG4gICAqIEluIGRldmVsb3BtZW50IG1vZGUsIGB0aWNrKClgIGFsc28gcGVyZm9ybXMgYSBzZWNvbmQgY2hhbmdlIGRldGVjdGlvbiBjeWNsZSB0byBlbnN1cmUgdGhhdCBub1xuICAgKiBmdXJ0aGVyIGNoYW5nZXMgYXJlIGRldGVjdGVkLiBJZiBhZGRpdGlvbmFsIGNoYW5nZXMgYXJlIHBpY2tlZCB1cCBkdXJpbmcgdGhpcyBzZWNvbmQgY3ljbGUsXG4gICAqIGJpbmRpbmdzIGluIHRoZSBhcHAgaGF2ZSBzaWRlLWVmZmVjdHMgdGhhdCBjYW5ub3QgYmUgcmVzb2x2ZWQgaW4gYSBzaW5nbGUgY2hhbmdlIGRldGVjdGlvblxuICAgKiBwYXNzLlxuICAgKiBJbiB0aGlzIGNhc2UsIEFuZ3VsYXIgdGhyb3dzIGFuIGVycm9yLCBzaW5jZSBhbiBBbmd1bGFyIGFwcGxpY2F0aW9uIGNhbiBvbmx5IGhhdmUgb25lIGNoYW5nZVxuICAgKiBkZXRlY3Rpb24gcGFzcyBkdXJpbmcgd2hpY2ggYWxsIGNoYW5nZSBkZXRlY3Rpb24gbXVzdCBjb21wbGV0ZS5cbiAgICovXG4gIHRpY2soKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuX3J1bm5pbmdUaWNrKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0FwcGxpY2F0aW9uUmVmLnRpY2sgaXMgY2FsbGVkIHJlY3Vyc2l2ZWx5Jyk7XG4gICAgfVxuXG4gICAgdHJ5IHtcbiAgICAgIHRoaXMuX3J1bm5pbmdUaWNrID0gdHJ1ZTtcbiAgICAgIGZvciAobGV0IHZpZXcgb2YgdGhpcy5fdmlld3MpIHtcbiAgICAgICAgdmlldy5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICB9XG4gICAgICAvLyBOb3RlIHRoYXQgd2UgaGF2ZSBzdGlsbCBsZWZ0IHRoZSBgaXNEZXZNb2RlKClgIGNvbmRpdGlvbiBpbiBvcmRlciB0byBhdm9pZFxuICAgICAgLy8gY3JlYXRpbmcgYSBicmVha2luZyBjaGFuZ2UgZm9yIHByb2plY3RzIHRoYXQgc3RpbGwgdXNlIHRoZSBWaWV3IEVuZ2luZS5cbiAgICAgIGlmICgodHlwZW9mIG5nRGV2TW9kZSA9PT0gJ3VuZGVmaW5lZCcgfHwgbmdEZXZNb2RlKSAmJiBpc0Rldk1vZGUoKSkge1xuICAgICAgICBmb3IgKGxldCB2aWV3IG9mIHRoaXMuX3ZpZXdzKSB7XG4gICAgICAgICAgdmlldy5jaGVja05vQ2hhbmdlcygpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgLy8gQXR0ZW50aW9uOiBEb24ndCByZXRocm93IGFzIGl0IGNvdWxkIGNhbmNlbCBzdWJzY3JpcHRpb25zIHRvIE9ic2VydmFibGVzIVxuICAgICAgdGhpcy5fem9uZS5ydW5PdXRzaWRlQW5ndWxhcigoKSA9PiB0aGlzLl9leGNlcHRpb25IYW5kbGVyLmhhbmRsZUVycm9yKGUpKTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgdGhpcy5fcnVubmluZ1RpY2sgPSBmYWxzZTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQXR0YWNoZXMgYSB2aWV3IHNvIHRoYXQgaXQgd2lsbCBiZSBkaXJ0eSBjaGVja2VkLlxuICAgKiBUaGUgdmlldyB3aWxsIGJlIGF1dG9tYXRpY2FsbHkgZGV0YWNoZWQgd2hlbiBpdCBpcyBkZXN0cm95ZWQuXG4gICAqIFRoaXMgd2lsbCB0aHJvdyBpZiB0aGUgdmlldyBpcyBhbHJlYWR5IGF0dGFjaGVkIHRvIGEgVmlld0NvbnRhaW5lci5cbiAgICovXG4gIGF0dGFjaFZpZXcodmlld1JlZjogVmlld1JlZik6IHZvaWQge1xuICAgIGNvbnN0IHZpZXcgPSAodmlld1JlZiBhcyBJbnRlcm5hbFZpZXdSZWYpO1xuICAgIHRoaXMuX3ZpZXdzLnB1c2godmlldyk7XG4gICAgdmlldy5hdHRhY2hUb0FwcFJlZih0aGlzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZXRhY2hlcyBhIHZpZXcgZnJvbSBkaXJ0eSBjaGVja2luZyBhZ2Fpbi5cbiAgICovXG4gIGRldGFjaFZpZXcodmlld1JlZjogVmlld1JlZik6IHZvaWQge1xuICAgIGNvbnN0IHZpZXcgPSAodmlld1JlZiBhcyBJbnRlcm5hbFZpZXdSZWYpO1xuICAgIHJlbW92ZSh0aGlzLl92aWV3cywgdmlldyk7XG4gICAgdmlldy5kZXRhY2hGcm9tQXBwUmVmKCk7XG4gIH1cblxuICBwcml2YXRlIF9sb2FkQ29tcG9uZW50KGNvbXBvbmVudFJlZjogQ29tcG9uZW50UmVmPGFueT4pOiB2b2lkIHtcbiAgICB0aGlzLmF0dGFjaFZpZXcoY29tcG9uZW50UmVmLmhvc3RWaWV3KTtcbiAgICB0aGlzLnRpY2soKTtcbiAgICB0aGlzLmNvbXBvbmVudHMucHVzaChjb21wb25lbnRSZWYpO1xuICAgIC8vIEdldCB0aGUgbGlzdGVuZXJzIGxhemlseSB0byBwcmV2ZW50IERJIGN5Y2xlcy5cbiAgICBjb25zdCBsaXN0ZW5lcnMgPVxuICAgICAgICB0aGlzLl9pbmplY3Rvci5nZXQoQVBQX0JPT1RTVFJBUF9MSVNURU5FUiwgW10pLmNvbmNhdCh0aGlzLl9ib290c3RyYXBMaXN0ZW5lcnMpO1xuICAgIGxpc3RlbmVycy5mb3JFYWNoKChsaXN0ZW5lcikgPT4gbGlzdGVuZXIoY29tcG9uZW50UmVmKSk7XG4gIH1cblxuICAvKiogQGludGVybmFsICovXG4gIG5nT25EZXN0cm95KCkge1xuICAgIHRoaXMuX3ZpZXdzLnNsaWNlKCkuZm9yRWFjaCgodmlldykgPT4gdmlldy5kZXN0cm95KCkpO1xuICAgIHRoaXMuX29uTWljcm90YXNrRW1wdHlTdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBudW1iZXIgb2YgYXR0YWNoZWQgdmlld3MuXG4gICAqL1xuICBnZXQgdmlld0NvdW50KCkge1xuICAgIHJldHVybiB0aGlzLl92aWV3cy5sZW5ndGg7XG4gIH1cbn1cblxuZnVuY3Rpb24gcmVtb3ZlPFQ+KGxpc3Q6IFRbXSwgZWw6IFQpOiB2b2lkIHtcbiAgY29uc3QgaW5kZXggPSBsaXN0LmluZGV4T2YoZWwpO1xuICBpZiAoaW5kZXggPiAtMSkge1xuICAgIGxpc3Quc3BsaWNlKGluZGV4LCAxKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBfbGFzdERlZmluZWQ8VD4oYXJnczogVFtdKTogVHx1bmRlZmluZWQge1xuICBmb3IgKGxldCBpID0gYXJncy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgIGlmIChhcmdzW2ldICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiBhcmdzW2ldO1xuICAgIH1cbiAgfVxuICByZXR1cm4gdW5kZWZpbmVkO1xufVxuXG5mdW5jdGlvbiBfbWVyZ2VBcnJheXMocGFydHM6IGFueVtdW10pOiBhbnlbXSB7XG4gIGNvbnN0IHJlc3VsdDogYW55W10gPSBbXTtcbiAgcGFydHMuZm9yRWFjaCgocGFydCkgPT4gcGFydCAmJiByZXN1bHQucHVzaCguLi5wYXJ0KSk7XG4gIHJldHVybiByZXN1bHQ7XG59XG4iXX0=