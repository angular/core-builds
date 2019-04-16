/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Observable, merge } from 'rxjs';
import { share } from 'rxjs/operators';
import { ApplicationInitStatus } from './application_init';
import { APP_BOOTSTRAP_LISTENER, PLATFORM_INITIALIZER } from './application_tokens';
import { getCompilerFacade } from './compiler/compiler_facade';
import { Console } from './console';
import { Injectable, InjectionToken, Injector } from './di';
import { ErrorHandler } from './error_handler';
import { LOCALE_ID } from './i18n/tokens';
import { COMPILER_OPTIONS, CompilerFactory } from './linker/compiler';
import { ComponentFactory } from './linker/component_factory';
import { ComponentFactoryBoundToModule, ComponentFactoryResolver } from './linker/component_factory_resolver';
import { NgModuleRef } from './linker/ng_module_factory';
import { isComponentResourceResolutionQueueEmpty, resolveComponentResources } from './metadata/resource_loading';
import { wtfCreateScope, wtfLeave } from './profile/profile';
import { assertNgModuleType } from './render3/assert';
import { DEFAULT_LOCALE_ID, setLocaleId } from './render3/i18n';
import { NgModuleFactory as R3NgModuleFactory } from './render3/ng_module_ref';
import { Testability, TestabilityRegistry } from './testability/testability';
import { isDevMode } from './util/is_dev_mode';
import { isPromise } from './util/lang';
import { scheduleMicroTask } from './util/microtask';
import { stringify } from './util/stringify';
import { NgZone, NoopNgZone } from './zone/ng_zone';
/** @type {?} */
let _platform;
/** @type {?} */
let compileNgModuleFactory = compileNgModuleFactory__PRE_R3__;
/**
 * @template M
 * @param {?} injector
 * @param {?} options
 * @param {?} moduleType
 * @return {?}
 */
function compileNgModuleFactory__PRE_R3__(injector, options, moduleType) {
    /** @type {?} */
    const compilerFactory = injector.get(CompilerFactory);
    /** @type {?} */
    const compiler = compilerFactory.createCompiler([options]);
    return compiler.compileModuleAsync(moduleType);
}
/**
 * @template M
 * @param {?} injector
 * @param {?} options
 * @param {?} moduleType
 * @return {?}
 */
export function compileNgModuleFactory__POST_R3__(injector, options, moduleType) {
    ngDevMode && assertNgModuleType(moduleType);
    /** @type {?} */
    const moduleFactory = new R3NgModuleFactory(moduleType);
    if (isComponentResourceResolutionQueueEmpty()) {
        return Promise.resolve(moduleFactory);
    }
    /** @type {?} */
    const compilerOptions = injector.get(COMPILER_OPTIONS, []).concat(options);
    /** @type {?} */
    const compilerProviders = _mergeArrays(compilerOptions.map((/**
     * @param {?} o
     * @return {?}
     */
    o => (/** @type {?} */ (o.providers)))));
    // In case there are no compiler providers, we just return the module factory as
    // there won't be any resource loader. This can happen with Ivy, because AOT compiled
    // modules can be still passed through "bootstrapModule". In that case we shouldn't
    // unnecessarily require the JIT compiler.
    if (compilerProviders.length === 0) {
        return Promise.resolve(moduleFactory);
    }
    /** @type {?} */
    const compiler = getCompilerFacade();
    /** @type {?} */
    const compilerInjector = Injector.create({ providers: compilerProviders });
    /** @type {?} */
    const resourceLoader = compilerInjector.get(compiler.ResourceLoader);
    // The resource loader can also return a string while the "resolveComponentResources"
    // always expects a promise. Therefore we need to wrap the returned value in a promise.
    return resolveComponentResources((/**
     * @param {?} url
     * @return {?}
     */
    url => Promise.resolve(resourceLoader.get(url))))
        .then((/**
     * @return {?}
     */
    () => moduleFactory));
}
/** @type {?} */
let isBoundToModule = isBoundToModule__PRE_R3__;
/**
 * @template C
 * @param {?} cf
 * @return {?}
 */
export function isBoundToModule__PRE_R3__(cf) {
    return cf instanceof ComponentFactoryBoundToModule;
}
/**
 * @template C
 * @param {?} cf
 * @return {?}
 */
export function isBoundToModule__POST_R3__(cf) {
    return ((/** @type {?} */ (cf))).isBoundToModule;
}
/** @type {?} */
export const ALLOW_MULTIPLE_PLATFORMS = new InjectionToken('AllowMultipleToken');
/**
 * A token for third-party components that can register themselves with NgProbe.
 *
 * \@publicApi
 */
export class NgProbeToken {
    /**
     * @param {?} name
     * @param {?} token
     */
    constructor(name, token) {
        this.name = name;
        this.token = token;
    }
}
if (false) {
    /** @type {?} */
    NgProbeToken.prototype.name;
    /** @type {?} */
    NgProbeToken.prototype.token;
}
/**
 * Creates a platform.
 * Platforms have to be eagerly created via this function.
 *
 * \@publicApi
 * @param {?} injector
 * @return {?}
 */
export function createPlatform(injector) {
    if (_platform && !_platform.destroyed &&
        !_platform.injector.get(ALLOW_MULTIPLE_PLATFORMS, false)) {
        throw new Error('There can be only one platform. Destroy the previous one to create a new one.');
    }
    _platform = injector.get(PlatformRef);
    /** @type {?} */
    const inits = injector.get(PLATFORM_INITIALIZER, null);
    if (inits)
        inits.forEach((/**
         * @param {?} init
         * @return {?}
         */
        (init) => init()));
    return _platform;
}
/**
 * Creates a factory for a platform
 *
 * \@publicApi
 * @param {?} parentPlatformFactory
 * @param {?} name
 * @param {?=} providers
 * @return {?}
 */
export function createPlatformFactory(parentPlatformFactory, name, providers = []) {
    /** @type {?} */
    const desc = `Platform: ${name}`;
    /** @type {?} */
    const marker = new InjectionToken(desc);
    return (/**
     * @param {?=} extraProviders
     * @return {?}
     */
    (extraProviders = []) => {
        /** @type {?} */
        let platform = getPlatform();
        if (!platform || platform.injector.get(ALLOW_MULTIPLE_PLATFORMS, false)) {
            if (parentPlatformFactory) {
                parentPlatformFactory(providers.concat(extraProviders).concat({ provide: marker, useValue: true }));
            }
            else {
                /** @type {?} */
                const injectedProviders = providers.concat(extraProviders).concat({ provide: marker, useValue: true });
                createPlatform(Injector.create({ providers: injectedProviders, name: desc }));
            }
        }
        return assertPlatform(marker);
    });
}
/**
 * Checks that there currently is a platform which contains the given token as a provider.
 *
 * \@publicApi
 * @param {?} requiredToken
 * @return {?}
 */
export function assertPlatform(requiredToken) {
    /** @type {?} */
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
 * Destroy the existing platform.
 *
 * \@publicApi
 * @return {?}
 */
export function destroyPlatform() {
    if (_platform && !_platform.destroyed) {
        _platform.destroy();
    }
}
/**
 * Returns the current platform.
 *
 * \@publicApi
 * @return {?}
 */
export function getPlatform() {
    return _platform && !_platform.destroyed ? _platform : null;
}
/**
 * Provides additional options to the bootstraping process.
 *
 *
 * @record
 */
export function BootstrapOptions() { }
if (false) {
    /**
     * Optionally specify which `NgZone` should be used.
     *
     * - Provide your own `NgZone` instance.
     * - `zone.js` - Use default `NgZone` which requires `Zone.js`.
     * - `noop` - Use `NoopNgZone` which does nothing.
     * @type {?|undefined}
     */
    BootstrapOptions.prototype.ngZone;
}
/**
 * The Angular platform is the entry point for Angular on a web page. Each page
 * has exactly one platform, and services (such as reflection) which are common
 * to every Angular application running on the page are bound in its scope.
 *
 * A page's platform is initialized implicitly when a platform is created via a platform factory
 * (e.g. {\@link platformBrowser}), or explicitly by calling the {\@link createPlatform} function.
 *
 * \@publicApi
 */
export class PlatformRef {
    /**
     * \@internal
     * @param {?} _injector
     */
    constructor(_injector) {
        this._injector = _injector;
        this._modules = [];
        this._destroyListeners = [];
        this._destroyed = false;
    }
    /**
     * Creates an instance of an `\@NgModule` for the given platform
     * for offline compilation.
     *
     * \@usageNotes
     * ### Simple Example
     *
     * ```typescript
     * my_module.ts:
     *
     * \@NgModule({
     *   imports: [BrowserModule]
     * })
     * class MyModule {}
     *
     * main.ts:
     * import {MyModuleNgFactory} from './my_module.ngfactory';
     * import {platformBrowser} from '\@angular/platform-browser';
     *
     * let moduleRef = platformBrowser().bootstrapModuleFactory(MyModuleNgFactory);
     * ```
     * @template M
     * @param {?} moduleFactory
     * @param {?=} options
     * @return {?}
     */
    bootstrapModuleFactory(moduleFactory, options) {
        // Note: We need to create the NgZone _before_ we instantiate the module,
        // as instantiating the module creates some providers eagerly.
        // So we create a mini parent injector that just contains the new NgZone and
        // pass that as parent to the NgModuleFactory.
        /** @type {?} */
        const ngZoneOption = options ? options.ngZone : undefined;
        /** @type {?} */
        const ngZone = getNgZone(ngZoneOption);
        /** @type {?} */
        const providers = [{ provide: NgZone, useValue: ngZone }];
        // Attention: Don't use ApplicationRef.run here,
        // as we want to be sure that all possible constructor calls are inside `ngZone.run`!
        return ngZone.run((/**
         * @return {?}
         */
        () => {
            /** @type {?} */
            const ngZoneInjector = Injector.create({ providers: providers, parent: this.injector, name: moduleFactory.moduleType.name });
            /** @type {?} */
            const moduleRef = (/** @type {?} */ (moduleFactory.create(ngZoneInjector)));
            /** @type {?} */
            const exceptionHandler = moduleRef.injector.get(ErrorHandler, null);
            if (!exceptionHandler) {
                throw new Error('No ErrorHandler. Is platform module (BrowserModule) included?');
            }
            // If the `LOCALE_ID` provider is defined at bootstrap we set the value for runtime i18n (ivy)
            /** @type {?} */
            const localeId = moduleRef.injector.get(LOCALE_ID, DEFAULT_LOCALE_ID);
            setLocaleId(localeId);
            moduleRef.onDestroy((/**
             * @return {?}
             */
            () => remove(this._modules, moduleRef)));
            (/** @type {?} */ (ngZone)).runOutsideAngular((/**
             * @return {?}
             */
            () => (/** @type {?} */ (ngZone)).onError.subscribe({ next: (/**
                 * @param {?} error
                 * @return {?}
                 */
                (error) => { exceptionHandler.handleError(error); }) })));
            return _callAndReportToErrorHandler(exceptionHandler, (/** @type {?} */ (ngZone)), (/**
             * @return {?}
             */
            () => {
                /** @type {?} */
                const initStatus = moduleRef.injector.get(ApplicationInitStatus);
                initStatus.runInitializers();
                return initStatus.donePromise.then((/**
                 * @return {?}
                 */
                () => {
                    this._moduleDoBootstrap(moduleRef);
                    return moduleRef;
                }));
            }));
        }));
    }
    /**
     * Creates an instance of an `\@NgModule` for a given platform using the given runtime compiler.
     *
     * \@usageNotes
     * ### Simple Example
     *
     * ```typescript
     * \@NgModule({
     *   imports: [BrowserModule]
     * })
     * class MyModule {}
     *
     * let moduleRef = platformBrowser().bootstrapModule(MyModule);
     * ```
     *
     * @template M
     * @param {?} moduleType
     * @param {?=} compilerOptions
     * @return {?}
     */
    bootstrapModule(moduleType, compilerOptions = []) {
        /** @type {?} */
        const options = optionsReducer({}, compilerOptions);
        return compileNgModuleFactory(this.injector, options, moduleType)
            .then((/**
         * @param {?} moduleFactory
         * @return {?}
         */
        moduleFactory => this.bootstrapModuleFactory(moduleFactory, options)));
    }
    /**
     * @private
     * @param {?} moduleRef
     * @return {?}
     */
    _moduleDoBootstrap(moduleRef) {
        /** @type {?} */
        const appRef = (/** @type {?} */ (moduleRef.injector.get(ApplicationRef)));
        if (moduleRef._bootstrapComponents.length > 0) {
            moduleRef._bootstrapComponents.forEach((/**
             * @param {?} f
             * @return {?}
             */
            f => appRef.bootstrap(f)));
        }
        else if (moduleRef.instance.ngDoBootstrap) {
            moduleRef.instance.ngDoBootstrap(appRef);
        }
        else {
            throw new Error(`The module ${stringify(moduleRef.instance.constructor)} was bootstrapped, but it does not declare "@NgModule.bootstrap" components nor a "ngDoBootstrap" method. ` +
                `Please define one of these.`);
        }
        this._modules.push(moduleRef);
    }
    /**
     * Register a listener to be called when the platform is disposed.
     * @param {?} callback
     * @return {?}
     */
    onDestroy(callback) { this._destroyListeners.push(callback); }
    /**
     * Retrieve the platform {\@link Injector}, which is the parent injector for
     * every Angular application on the page and provides singleton providers.
     * @return {?}
     */
    get injector() { return this._injector; }
    /**
     * Destroy the Angular platform and all Angular applications on the page.
     * @return {?}
     */
    destroy() {
        if (this._destroyed) {
            throw new Error('The platform has already been destroyed!');
        }
        this._modules.slice().forEach((/**
         * @param {?} module
         * @return {?}
         */
        module => module.destroy()));
        this._destroyListeners.forEach((/**
         * @param {?} listener
         * @return {?}
         */
        listener => listener()));
        this._destroyed = true;
    }
    /**
     * @return {?}
     */
    get destroyed() { return this._destroyed; }
}
PlatformRef.decorators = [
    { type: Injectable }
];
/** @nocollapse */
PlatformRef.ctorParameters = () => [
    { type: Injector }
];
if (false) {
    /**
     * @type {?}
     * @private
     */
    PlatformRef.prototype._modules;
    /**
     * @type {?}
     * @private
     */
    PlatformRef.prototype._destroyListeners;
    /**
     * @type {?}
     * @private
     */
    PlatformRef.prototype._destroyed;
    /**
     * @type {?}
     * @private
     */
    PlatformRef.prototype._injector;
}
/**
 * @param {?=} ngZoneOption
 * @return {?}
 */
function getNgZone(ngZoneOption) {
    /** @type {?} */
    let ngZone;
    if (ngZoneOption === 'noop') {
        ngZone = new NoopNgZone();
    }
    else {
        ngZone = (ngZoneOption === 'zone.js' ? undefined : ngZoneOption) ||
            new NgZone({ enableLongStackTrace: isDevMode() });
    }
    return ngZone;
}
/**
 * @param {?} errorHandler
 * @param {?} ngZone
 * @param {?} callback
 * @return {?}
 */
function _callAndReportToErrorHandler(errorHandler, ngZone, callback) {
    try {
        /** @type {?} */
        const result = callback();
        if (isPromise(result)) {
            return result.catch((/**
             * @param {?} e
             * @return {?}
             */
            (e) => {
                ngZone.runOutsideAngular((/**
                 * @return {?}
                 */
                () => errorHandler.handleError(e)));
                // rethrow as the exception handler might not do it
                throw e;
            }));
        }
        return result;
    }
    catch (e) {
        ngZone.runOutsideAngular((/**
         * @return {?}
         */
        () => errorHandler.handleError(e)));
        // rethrow as the exception handler might not do it
        throw e;
    }
}
/**
 * @template T
 * @param {?} dst
 * @param {?} objs
 * @return {?}
 */
function optionsReducer(dst, objs) {
    if (Array.isArray(objs)) {
        dst = objs.reduce(optionsReducer, dst);
    }
    else {
        dst = Object.assign({}, dst, ((/** @type {?} */ (objs))));
    }
    return dst;
}
/**
 * A reference to an Angular application running on a page.
 *
 * \@usageNotes
 *
 * {\@a is-stable-examples}
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
 * \@publicApi
 */
export class ApplicationRef {
    /**
     * \@internal
     * @param {?} _zone
     * @param {?} _console
     * @param {?} _injector
     * @param {?} _exceptionHandler
     * @param {?} _componentFactoryResolver
     * @param {?} _initStatus
     */
    constructor(_zone, _console, _injector, _exceptionHandler, _componentFactoryResolver, _initStatus) {
        this._zone = _zone;
        this._console = _console;
        this._injector = _injector;
        this._exceptionHandler = _exceptionHandler;
        this._componentFactoryResolver = _componentFactoryResolver;
        this._initStatus = _initStatus;
        this._bootstrapListeners = [];
        this._views = [];
        this._runningTick = false;
        this._enforceNoNewChanges = false;
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
        this._enforceNoNewChanges = isDevMode();
        this._zone.onMicrotaskEmpty.subscribe({ next: (/**
             * @return {?}
             */
            () => { this._zone.run((/**
             * @return {?}
             */
            () => { this.tick(); })); }) });
        /** @type {?} */
        const isCurrentlyStable = new Observable((/**
         * @param {?} observer
         * @return {?}
         */
        (observer) => {
            this._stable = this._zone.isStable && !this._zone.hasPendingMacrotasks &&
                !this._zone.hasPendingMicrotasks;
            this._zone.runOutsideAngular((/**
             * @return {?}
             */
            () => {
                observer.next(this._stable);
                observer.complete();
            }));
        }));
        /** @type {?} */
        const isStable = new Observable((/**
         * @param {?} observer
         * @return {?}
         */
        (observer) => {
            // Create the subscription to onStable outside the Angular Zone so that
            // the callback is run outside the Angular Zone.
            /** @type {?} */
            let stableSub;
            this._zone.runOutsideAngular((/**
             * @return {?}
             */
            () => {
                stableSub = this._zone.onStable.subscribe((/**
                 * @return {?}
                 */
                () => {
                    NgZone.assertNotInAngularZone();
                    // Check whether there are no pending macro/micro tasks in the next tick
                    // to allow for NgZone to update the state.
                    scheduleMicroTask((/**
                     * @return {?}
                     */
                    () => {
                        if (!this._stable && !this._zone.hasPendingMacrotasks &&
                            !this._zone.hasPendingMicrotasks) {
                            this._stable = true;
                            observer.next(true);
                        }
                    }));
                }));
            }));
            /** @type {?} */
            const unstableSub = this._zone.onUnstable.subscribe((/**
             * @return {?}
             */
            () => {
                NgZone.assertInAngularZone();
                if (this._stable) {
                    this._stable = false;
                    this._zone.runOutsideAngular((/**
                     * @return {?}
                     */
                    () => { observer.next(false); }));
                }
            }));
            return (/**
             * @return {?}
             */
            () => {
                stableSub.unsubscribe();
                unstableSub.unsubscribe();
            });
        }));
        ((/** @type {?} */ (this))).isStable =
            merge(isCurrentlyStable, isStable.pipe(share()));
    }
    /**
     * Bootstrap a new component at the root level of the application.
     *
     * \@usageNotes
     * ### Bootstrap process
     *
     * When bootstrapping a new root component into an application, Angular mounts the
     * specified application component onto DOM elements identified by the componentType's
     * selector and kicks off automatic change detection to finish initializing the component.
     *
     * Optionally, a component can be mounted onto a DOM element that does not match the
     * componentType's selector.
     *
     * ### Example
     * {\@example core/ts/platform/platform.ts region='longform'}
     * @template C
     * @param {?} componentOrFactory
     * @param {?=} rootSelectorOrNode
     * @return {?}
     */
    bootstrap(componentOrFactory, rootSelectorOrNode) {
        if (!this._initStatus.done) {
            throw new Error('Cannot bootstrap as there are still asynchronous initializers running. Bootstrap components in the `ngDoBootstrap` method of the root module.');
        }
        /** @type {?} */
        let componentFactory;
        if (componentOrFactory instanceof ComponentFactory) {
            componentFactory = componentOrFactory;
        }
        else {
            componentFactory =
                (/** @type {?} */ (this._componentFactoryResolver.resolveComponentFactory(componentOrFactory)));
        }
        this.componentTypes.push(componentFactory.componentType);
        // Create a factory associated with the current module if it's not bound to some other
        /** @type {?} */
        const ngModule = isBoundToModule(componentFactory) ? null : this._injector.get(NgModuleRef);
        /** @type {?} */
        const selectorOrNode = rootSelectorOrNode || componentFactory.selector;
        /** @type {?} */
        const compRef = componentFactory.create(Injector.NULL, [], selectorOrNode, ngModule);
        compRef.onDestroy((/**
         * @return {?}
         */
        () => { this._unloadComponent(compRef); }));
        /** @type {?} */
        const testability = compRef.injector.get(Testability, null);
        if (testability) {
            compRef.injector.get(TestabilityRegistry)
                .registerApplication(compRef.location.nativeElement, testability);
        }
        this._loadComponent(compRef);
        if (isDevMode()) {
            this._console.log(`Angular is running in the development mode. Call enableProdMode() to enable the production mode.`);
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
     * @return {?}
     */
    tick() {
        if (this._runningTick) {
            throw new Error('ApplicationRef.tick is called recursively');
        }
        /** @type {?} */
        const scope = ApplicationRef._tickScope();
        try {
            this._runningTick = true;
            for (let view of this._views) {
                view.detectChanges();
            }
            if (this._enforceNoNewChanges) {
                for (let view of this._views) {
                    view.checkNoChanges();
                }
            }
        }
        catch (e) {
            // Attention: Don't rethrow as it could cancel subscriptions to Observables!
            this._zone.runOutsideAngular((/**
             * @return {?}
             */
            () => this._exceptionHandler.handleError(e)));
        }
        finally {
            this._runningTick = false;
            wtfLeave(scope);
        }
    }
    /**
     * Attaches a view so that it will be dirty checked.
     * The view will be automatically detached when it is destroyed.
     * This will throw if the view is already attached to a ViewContainer.
     * @param {?} viewRef
     * @return {?}
     */
    attachView(viewRef) {
        /** @type {?} */
        const view = ((/** @type {?} */ (viewRef)));
        this._views.push(view);
        view.attachToAppRef(this);
    }
    /**
     * Detaches a view from dirty checking again.
     * @param {?} viewRef
     * @return {?}
     */
    detachView(viewRef) {
        /** @type {?} */
        const view = ((/** @type {?} */ (viewRef)));
        remove(this._views, view);
        view.detachFromAppRef();
    }
    /**
     * @private
     * @param {?} componentRef
     * @return {?}
     */
    _loadComponent(componentRef) {
        this.attachView(componentRef.hostView);
        this.tick();
        this.components.push(componentRef);
        // Get the listeners lazily to prevent DI cycles.
        /** @type {?} */
        const listeners = this._injector.get(APP_BOOTSTRAP_LISTENER, []).concat(this._bootstrapListeners);
        listeners.forEach((/**
         * @param {?} listener
         * @return {?}
         */
        (listener) => listener(componentRef)));
    }
    /**
     * @private
     * @param {?} componentRef
     * @return {?}
     */
    _unloadComponent(componentRef) {
        this.detachView(componentRef.hostView);
        remove(this.components, componentRef);
    }
    /**
     * \@internal
     * @return {?}
     */
    ngOnDestroy() {
        // TODO(alxhub): Dispose of the NgZone.
        this._views.slice().forEach((/**
         * @param {?} view
         * @return {?}
         */
        (view) => view.destroy()));
    }
    /**
     * Returns the number of attached views.
     * @return {?}
     */
    get viewCount() { return this._views.length; }
}
/**
 * \@internal
 */
ApplicationRef._tickScope = wtfCreateScope('ApplicationRef#tick()');
ApplicationRef.decorators = [
    { type: Injectable }
];
/** @nocollapse */
ApplicationRef.ctorParameters = () => [
    { type: NgZone },
    { type: Console },
    { type: Injector },
    { type: ErrorHandler },
    { type: ComponentFactoryResolver },
    { type: ApplicationInitStatus }
];
if (false) {
    /**
     * \@internal
     * @type {?}
     */
    ApplicationRef._tickScope;
    /**
     * @type {?}
     * @private
     */
    ApplicationRef.prototype._bootstrapListeners;
    /**
     * @type {?}
     * @private
     */
    ApplicationRef.prototype._views;
    /**
     * @type {?}
     * @private
     */
    ApplicationRef.prototype._runningTick;
    /**
     * @type {?}
     * @private
     */
    ApplicationRef.prototype._enforceNoNewChanges;
    /**
     * @type {?}
     * @private
     */
    ApplicationRef.prototype._stable;
    /**
     * Get a list of component types registered to this application.
     * This list is populated even before the component is created.
     * @type {?}
     */
    ApplicationRef.prototype.componentTypes;
    /**
     * Get a list of components registered to this application.
     * @type {?}
     */
    ApplicationRef.prototype.components;
    /**
     * Returns an Observable that indicates when the application is stable or unstable.
     *
     * @see [Usage notes](#is-stable-examples) for examples and caveats when using this API.
     * @type {?}
     */
    ApplicationRef.prototype.isStable;
    /**
     * @type {?}
     * @private
     */
    ApplicationRef.prototype._zone;
    /**
     * @type {?}
     * @private
     */
    ApplicationRef.prototype._console;
    /**
     * @type {?}
     * @private
     */
    ApplicationRef.prototype._injector;
    /**
     * @type {?}
     * @private
     */
    ApplicationRef.prototype._exceptionHandler;
    /**
     * @type {?}
     * @private
     */
    ApplicationRef.prototype._componentFactoryResolver;
    /**
     * @type {?}
     * @private
     */
    ApplicationRef.prototype._initStatus;
}
/**
 * @template T
 * @param {?} list
 * @param {?} el
 * @return {?}
 */
function remove(list, el) {
    /** @type {?} */
    const index = list.indexOf(el);
    if (index > -1) {
        list.splice(index, 1);
    }
}
/**
 * @param {?} parts
 * @return {?}
 */
function _mergeArrays(parts) {
    /** @type {?} */
    const result = [];
    parts.forEach((/**
     * @param {?} part
     * @return {?}
     */
    (part) => part && result.push(...part)));
    return result;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwbGljYXRpb25fcmVmLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvYXBwbGljYXRpb25fcmVmLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBUUEsT0FBTyxFQUFDLFVBQVUsRUFBMEIsS0FBSyxFQUFDLE1BQU0sTUFBTSxDQUFDO0FBQy9ELE9BQU8sRUFBQyxLQUFLLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUVyQyxPQUFPLEVBQUMscUJBQXFCLEVBQUMsTUFBTSxvQkFBb0IsQ0FBQztBQUN6RCxPQUFPLEVBQUMsc0JBQXNCLEVBQUUsb0JBQW9CLEVBQUMsTUFBTSxzQkFBc0IsQ0FBQztBQUNsRixPQUFPLEVBQUMsaUJBQWlCLEVBQUMsTUFBTSw0QkFBNEIsQ0FBQztBQUM3RCxPQUFPLEVBQUMsT0FBTyxFQUFDLE1BQU0sV0FBVyxDQUFDO0FBQ2xDLE9BQU8sRUFBQyxVQUFVLEVBQUUsY0FBYyxFQUFFLFFBQVEsRUFBaUIsTUFBTSxNQUFNLENBQUM7QUFDMUUsT0FBTyxFQUFDLFlBQVksRUFBQyxNQUFNLGlCQUFpQixDQUFDO0FBQzdDLE9BQU8sRUFBQyxTQUFTLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFFeEMsT0FBTyxFQUFDLGdCQUFnQixFQUFFLGVBQWUsRUFBa0IsTUFBTSxtQkFBbUIsQ0FBQztBQUNyRixPQUFPLEVBQUMsZ0JBQWdCLEVBQWUsTUFBTSw0QkFBNEIsQ0FBQztBQUMxRSxPQUFPLEVBQUMsNkJBQTZCLEVBQUUsd0JBQXdCLEVBQUMsTUFBTSxxQ0FBcUMsQ0FBQztBQUM1RyxPQUFPLEVBQXVDLFdBQVcsRUFBQyxNQUFNLDRCQUE0QixDQUFDO0FBRTdGLE9BQU8sRUFBQyx1Q0FBdUMsRUFBRSx5QkFBeUIsRUFBQyxNQUFNLDZCQUE2QixDQUFDO0FBQy9HLE9BQU8sRUFBYSxjQUFjLEVBQUUsUUFBUSxFQUFDLE1BQU0sbUJBQW1CLENBQUM7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Qzs7Ozs7QUFFRCxTQUFTLFlBQVksQ0FBQyxLQUFjOztVQUM1QixNQUFNLEdBQVUsRUFBRTtJQUN4QixLQUFLLENBQUMsT0FBTzs7OztJQUFDLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQyxJQUFJLElBQUksTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxFQUFDLENBQUM7SUFDdEQsT0FBTyxNQUFNLENBQUM7QUFDaEIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtPYnNlcnZhYmxlLCBPYnNlcnZlciwgU3Vic2NyaXB0aW9uLCBtZXJnZX0gZnJvbSAncnhqcyc7XG5pbXBvcnQge3NoYXJlfSBmcm9tICdyeGpzL29wZXJhdG9ycyc7XG5cbmltcG9ydCB7QXBwbGljYXRpb25Jbml0U3RhdHVzfSBmcm9tICcuL2FwcGxpY2F0aW9uX2luaXQnO1xuaW1wb3J0IHtBUFBfQk9PVFNUUkFQX0xJU1RFTkVSLCBQTEFURk9STV9JTklUSUFMSVpFUn0gZnJvbSAnLi9hcHBsaWNhdGlvbl90b2tlbnMnO1xuaW1wb3J0IHtnZXRDb21waWxlckZhY2FkZX0gZnJvbSAnLi9jb21waWxlci9jb21waWxlcl9mYWNhZGUnO1xuaW1wb3J0IHtDb25zb2xlfSBmcm9tICcuL2NvbnNvbGUnO1xuaW1wb3J0IHtJbmplY3RhYmxlLCBJbmplY3Rpb25Ub2tlbiwgSW5qZWN0b3IsIFN0YXRpY1Byb3ZpZGVyfSBmcm9tICcuL2RpJztcbmltcG9ydCB7RXJyb3JIYW5kbGVyfSBmcm9tICcuL2Vycm9yX2hhbmRsZXInO1xuaW1wb3J0IHtMT0NBTEVfSUR9IGZyb20gJy4vaTE4bi90b2tlbnMnO1xuaW1wb3J0IHtUeXBlfSBmcm9tICcuL2ludGVyZmFjZS90eXBlJztcbmltcG9ydCB7Q09NUElMRVJfT1BUSU9OUywgQ29tcGlsZXJGYWN0b3J5LCBDb21waWxlck9wdGlvbnN9IGZyb20gJy4vbGlua2VyL2NvbXBpbGVyJztcbmltcG9ydCB7Q29tcG9uZW50RmFjdG9yeSwgQ29tcG9uZW50UmVmfSBmcm9tICcuL2xpbmtlci9jb21wb25lbnRfZmFjdG9yeSc7XG5pbXBvcnQge0NvbXBvbmVudEZhY3RvcnlCb3VuZFRvTW9kdWxlLCBDb21wb25lbnRGYWN0b3J5UmVzb2x2ZXJ9IGZyb20gJy4vbGlua2VyL2NvbXBvbmVudF9mYWN0b3J5X3Jlc29sdmVyJztcbmltcG9ydCB7SW50ZXJuYWxOZ01vZHVsZVJlZiwgTmdNb2R1bGVGYWN0b3J5LCBOZ01vZHVsZVJlZn0gZnJvbSAnLi9saW5rZXIvbmdfbW9kdWxlX2ZhY3RvcnknO1xuaW1wb3J0IHtJbnRlcm5hbFZpZXdSZWYsIFZpZXdSZWZ9IGZyb20gJy4vbGlua2VyL3ZpZXdfcmVmJztcbmltcG9ydCB7aXNDb21wb25lbnRSZXNvdXJjZVJlc29sdXRpb25RdWV1ZUVtcHR5LCByZXNvbHZlQ29tcG9uZW50UmVzb3VyY2VzfSBmcm9tICcuL21ldGFkYXRhL3Jlc291cmNlX2xvYWRpbmcnO1xuaW1wb3J0IHtXdGZTY29wZUZuLCB3dGZDcmVhdGVTY29wZSwgd3RmTGVhdmV9IGZyb20gJy4vcHJvZmlsZS9wcm9maWxlJztcbmltcG9ydCB7YXNzZXJ0TmdNb2R1bGVUeXBlfSBmcm9tICcuL3JlbmRlcjMvYXNzZXJ0JztcbmltcG9ydCB7Q29tcG9uZW50RmFjdG9yeSBhcyBSM0NvbXBvbmVudEZhY3Rvcnl9IGZyb20gJy4vcmVuZGVyMy9jb21wb25lbnRfcmVmJztcbmltcG9ydCB7REVGQVVMVF9MT0NBTEVfSUQsIHNldExvY2FsZUlkfSBmcm9tICcuL3JlbmRlcjMvaTE4bic7XG5pbXBvcnQge05nTW9kdWxlRmFjdG9yeSBhcyBSM05nTW9kdWxlRmFjdG9yeX0gZnJvbSAnLi9yZW5kZXIzL25nX21vZHVsZV9yZWYnO1xuaW1wb3J0IHtUZXN0YWJpbGl0eSwgVGVzdGFiaWxpdHlSZWdpc3RyeX0gZnJvbSAnLi90ZXN0YWJpbGl0eS90ZXN0YWJpbGl0eSc7XG5pbXBvcnQge2lzRGV2TW9kZX0gZnJvbSAnLi91dGlsL2lzX2Rldl9tb2RlJztcbmltcG9ydCB7aXNQcm9taXNlfSBmcm9tICcuL3V0aWwvbGFuZyc7XG5pbXBvcnQge3NjaGVkdWxlTWljcm9UYXNrfSBmcm9tICcuL3V0aWwvbWljcm90YXNrJztcbmltcG9ydCB7c3RyaW5naWZ5fSBmcm9tICcuL3V0aWwvc3RyaW5naWZ5JztcbmltcG9ydCB7Tmdab25lLCBOb29wTmdab25lfSBmcm9tICcuL3pvbmUvbmdfem9uZSc7XG5cbmxldCBfcGxhdGZvcm06IFBsYXRmb3JtUmVmO1xuXG5sZXQgY29tcGlsZU5nTW9kdWxlRmFjdG9yeTpcbiAgICA8TT4oaW5qZWN0b3I6IEluamVjdG9yLCBvcHRpb25zOiBDb21waWxlck9wdGlvbnMsIG1vZHVsZVR5cGU6IFR5cGU8TT4pID0+XG4gICAgICAgIFByb21pc2U8TmdNb2R1bGVGYWN0b3J5PE0+PiA9IGNvbXBpbGVOZ01vZHVsZUZhY3RvcnlfX1BSRV9SM19fO1xuXG5mdW5jdGlvbiBjb21waWxlTmdNb2R1bGVGYWN0b3J5X19QUkVfUjNfXzxNPihcbiAgICBpbmplY3RvcjogSW5qZWN0b3IsIG9wdGlvbnM6IENvbXBpbGVyT3B0aW9ucyxcbiAgICBtb2R1bGVUeXBlOiBUeXBlPE0+KTogUHJvbWlzZTxOZ01vZHVsZUZhY3Rvcnk8TT4+IHtcbiAgY29uc3QgY29tcGlsZXJGYWN0b3J5OiBDb21waWxlckZhY3RvcnkgPSBpbmplY3Rvci5nZXQoQ29tcGlsZXJGYWN0b3J5KTtcbiAgY29uc3QgY29tcGlsZXIgPSBjb21waWxlckZhY3RvcnkuY3JlYXRlQ29tcGlsZXIoW29wdGlvbnNdKTtcbiAgcmV0dXJuIGNvbXBpbGVyLmNvbXBpbGVNb2R1bGVBc3luYyhtb2R1bGVUeXBlKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNvbXBpbGVOZ01vZHVsZUZhY3RvcnlfX1BPU1RfUjNfXzxNPihcbiAgICBpbmplY3RvcjogSW5qZWN0b3IsIG9wdGlvbnM6IENvbXBpbGVyT3B0aW9ucyxcbiAgICBtb2R1bGVUeXBlOiBUeXBlPE0+KTogUHJvbWlzZTxOZ01vZHVsZUZhY3Rvcnk8TT4+IHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydE5nTW9kdWxlVHlwZShtb2R1bGVUeXBlKTtcbiAgY29uc3QgbW9kdWxlRmFjdG9yeSA9IG5ldyBSM05nTW9kdWxlRmFjdG9yeShtb2R1bGVUeXBlKTtcblxuICBpZiAoaXNDb21wb25lbnRSZXNvdXJjZVJlc29sdXRpb25RdWV1ZUVtcHR5KCkpIHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKG1vZHVsZUZhY3RvcnkpO1xuICB9XG5cbiAgY29uc3QgY29tcGlsZXJPcHRpb25zID0gaW5qZWN0b3IuZ2V0KENPTVBJTEVSX09QVElPTlMsIFtdKS5jb25jYXQob3B0aW9ucyk7XG4gIGNvbnN0IGNvbXBpbGVyUHJvdmlkZXJzID0gX21lcmdlQXJyYXlzKGNvbXBpbGVyT3B0aW9ucy5tYXAobyA9PiBvLnByb3ZpZGVycyAhKSk7XG5cbiAgLy8gSW4gY2FzZSB0aGVyZSBhcmUgbm8gY29tcGlsZXIgcHJvdmlkZXJzLCB3ZSBqdXN0IHJldHVybiB0aGUgbW9kdWxlIGZhY3RvcnkgYXNcbiAgLy8gdGhlcmUgd29uJ3QgYmUgYW55IHJlc291cmNlIGxvYWRlci4gVGhpcyBjYW4gaGFwcGVuIHdpdGggSXZ5LCBiZWNhdXNlIEFPVCBjb21waWxlZFxuICAvLyBtb2R1bGVzIGNhbiBiZSBzdGlsbCBwYXNzZWQgdGhyb3VnaCBcImJvb3RzdHJhcE1vZHVsZVwiLiBJbiB0aGF0IGNhc2Ugd2Ugc2hvdWxkbid0XG4gIC8vIHVubmVjZXNzYXJpbHkgcmVxdWlyZSB0aGUgSklUIGNvbXBpbGVyLlxuICBpZiAoY29tcGlsZXJQcm92aWRlcnMubGVuZ3RoID09PSAwKSB7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShtb2R1bGVGYWN0b3J5KTtcbiAgfVxuXG4gIGNvbnN0IGNvbXBpbGVyID0gZ2V0Q29tcGlsZXJGYWNhZGUoKTtcbiAgY29uc3QgY29tcGlsZXJJbmplY3RvciA9IEluamVjdG9yLmNyZWF0ZSh7cHJvdmlkZXJzOiBjb21waWxlclByb3ZpZGVyc30pO1xuICBjb25zdCByZXNvdXJjZUxvYWRlciA9IGNvbXBpbGVySW5qZWN0b3IuZ2V0KGNvbXBpbGVyLlJlc291cmNlTG9hZGVyKTtcbiAgLy8gVGhlIHJlc291cmNlIGxvYWRlciBjYW4gYWxzbyByZXR1cm4gYSBzdHJpbmcgd2hpbGUgdGhlIFwicmVzb2x2ZUNvbXBvbmVudFJlc291cmNlc1wiXG4gIC8vIGFsd2F5cyBleHBlY3RzIGEgcHJvbWlzZS4gVGhlcmVmb3JlIHdlIG5lZWQgdG8gd3JhcCB0aGUgcmV0dXJuZWQgdmFsdWUgaW4gYSBwcm9taXNlLlxuICByZXR1cm4gcmVzb2x2ZUNvbXBvbmVudFJlc291cmNlcyh1cmwgPT4gUHJvbWlzZS5yZXNvbHZlKHJlc291cmNlTG9hZGVyLmdldCh1cmwpKSlcbiAgICAgIC50aGVuKCgpID0+IG1vZHVsZUZhY3RvcnkpO1xufVxuXG5sZXQgaXNCb3VuZFRvTW9kdWxlOiA8Qz4oY2Y6IENvbXBvbmVudEZhY3Rvcnk8Qz4pID0+IGJvb2xlYW4gPSBpc0JvdW5kVG9Nb2R1bGVfX1BSRV9SM19fO1xuXG5leHBvcnQgZnVuY3Rpb24gaXNCb3VuZFRvTW9kdWxlX19QUkVfUjNfXzxDPihjZjogQ29tcG9uZW50RmFjdG9yeTxDPik6IGJvb2xlYW4ge1xuICByZXR1cm4gY2YgaW5zdGFuY2VvZiBDb21wb25lbnRGYWN0b3J5Qm91bmRUb01vZHVsZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzQm91bmRUb01vZHVsZV9fUE9TVF9SM19fPEM+KGNmOiBDb21wb25lbnRGYWN0b3J5PEM+KTogYm9vbGVhbiB7XG4gIHJldHVybiAoY2YgYXMgUjNDb21wb25lbnRGYWN0b3J5PEM+KS5pc0JvdW5kVG9Nb2R1bGU7XG59XG5cbmV4cG9ydCBjb25zdCBBTExPV19NVUxUSVBMRV9QTEFURk9STVMgPSBuZXcgSW5qZWN0aW9uVG9rZW48Ym9vbGVhbj4oJ0FsbG93TXVsdGlwbGVUb2tlbicpO1xuXG5cblxuLyoqXG4gKiBBIHRva2VuIGZvciB0aGlyZC1wYXJ0eSBjb21wb25lbnRzIHRoYXQgY2FuIHJlZ2lzdGVyIHRoZW1zZWx2ZXMgd2l0aCBOZ1Byb2JlLlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGNsYXNzIE5nUHJvYmVUb2tlbiB7XG4gIGNvbnN0cnVjdG9yKHB1YmxpYyBuYW1lOiBzdHJpbmcsIHB1YmxpYyB0b2tlbjogYW55KSB7fVxufVxuXG4vKipcbiAqIENyZWF0ZXMgYSBwbGF0Zm9ybS5cbiAqIFBsYXRmb3JtcyBoYXZlIHRvIGJlIGVhZ2VybHkgY3JlYXRlZCB2aWEgdGhpcyBmdW5jdGlvbi5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVQbGF0Zm9ybShpbmplY3RvcjogSW5qZWN0b3IpOiBQbGF0Zm9ybVJlZiB7XG4gIGlmIChfcGxhdGZvcm0gJiYgIV9wbGF0Zm9ybS5kZXN0cm95ZWQgJiZcbiAgICAgICFfcGxhdGZvcm0uaW5qZWN0b3IuZ2V0KEFMTE9XX01VTFRJUExFX1BMQVRGT1JNUywgZmFsc2UpKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAnVGhlcmUgY2FuIGJlIG9ubHkgb25lIHBsYXRmb3JtLiBEZXN0cm95IHRoZSBwcmV2aW91cyBvbmUgdG8gY3JlYXRlIGEgbmV3IG9uZS4nKTtcbiAgfVxuICBfcGxhdGZvcm0gPSBpbmplY3Rvci5nZXQoUGxhdGZvcm1SZWYpO1xuICBjb25zdCBpbml0cyA9IGluamVjdG9yLmdldChQTEFURk9STV9JTklUSUFMSVpFUiwgbnVsbCk7XG4gIGlmIChpbml0cykgaW5pdHMuZm9yRWFjaCgoaW5pdDogYW55KSA9PiBpbml0KCkpO1xuICByZXR1cm4gX3BsYXRmb3JtO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYSBmYWN0b3J5IGZvciBhIHBsYXRmb3JtXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlUGxhdGZvcm1GYWN0b3J5KFxuICAgIHBhcmVudFBsYXRmb3JtRmFjdG9yeTogKChleHRyYVByb3ZpZGVycz86IFN0YXRpY1Byb3ZpZGVyW10pID0+IFBsYXRmb3JtUmVmKSB8IG51bGwsXG4gICAgbmFtZTogc3RyaW5nLCBwcm92aWRlcnM6IFN0YXRpY1Byb3ZpZGVyW10gPSBbXSk6IChleHRyYVByb3ZpZGVycz86IFN0YXRpY1Byb3ZpZGVyW10pID0+XG4gICAgUGxhdGZvcm1SZWYge1xuICBjb25zdCBkZXNjID0gYFBsYXRmb3JtOiAke25hbWV9YDtcbiAgY29uc3QgbWFya2VyID0gbmV3IEluamVjdGlvblRva2VuKGRlc2MpO1xuICByZXR1cm4gKGV4dHJhUHJvdmlkZXJzOiBTdGF0aWNQcm92aWRlcltdID0gW10pID0+IHtcbiAgICBsZXQgcGxhdGZvcm0gPSBnZXRQbGF0Zm9ybSgpO1xuICAgIGlmICghcGxhdGZvcm0gfHwgcGxhdGZvcm0uaW5qZWN0b3IuZ2V0KEFMTE9XX01VTFRJUExFX1BMQVRGT1JNUywgZmFsc2UpKSB7XG4gICAgICBpZiAocGFyZW50UGxhdGZvcm1GYWN0b3J5KSB7XG4gICAgICAgIHBhcmVudFBsYXRmb3JtRmFjdG9yeShcbiAgICAgICAgICAgIHByb3ZpZGVycy5jb25jYXQoZXh0cmFQcm92aWRlcnMpLmNvbmNhdCh7cHJvdmlkZTogbWFya2VyLCB1c2VWYWx1ZTogdHJ1ZX0pKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IGluamVjdGVkUHJvdmlkZXJzOiBTdGF0aWNQcm92aWRlcltdID1cbiAgICAgICAgICAgIHByb3ZpZGVycy5jb25jYXQoZXh0cmFQcm92aWRlcnMpLmNvbmNhdCh7cHJvdmlkZTogbWFya2VyLCB1c2VWYWx1ZTogdHJ1ZX0pO1xuICAgICAgICBjcmVhdGVQbGF0Zm9ybShJbmplY3Rvci5jcmVhdGUoe3Byb3ZpZGVyczogaW5qZWN0ZWRQcm92aWRlcnMsIG5hbWU6IGRlc2N9KSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBhc3NlcnRQbGF0Zm9ybShtYXJrZXIpO1xuICB9O1xufVxuXG4vKipcbiAqIENoZWNrcyB0aGF0IHRoZXJlIGN1cnJlbnRseSBpcyBhIHBsYXRmb3JtIHdoaWNoIGNvbnRhaW5zIHRoZSBnaXZlbiB0b2tlbiBhcyBhIHByb3ZpZGVyLlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFzc2VydFBsYXRmb3JtKHJlcXVpcmVkVG9rZW46IGFueSk6IFBsYXRmb3JtUmVmIHtcbiAgY29uc3QgcGxhdGZvcm0gPSBnZXRQbGF0Zm9ybSgpO1xuXG4gIGlmICghcGxhdGZvcm0pIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ05vIHBsYXRmb3JtIGV4aXN0cyEnKTtcbiAgfVxuXG4gIGlmICghcGxhdGZvcm0uaW5qZWN0b3IuZ2V0KHJlcXVpcmVkVG9rZW4sIG51bGwpKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAnQSBwbGF0Zm9ybSB3aXRoIGEgZGlmZmVyZW50IGNvbmZpZ3VyYXRpb24gaGFzIGJlZW4gY3JlYXRlZC4gUGxlYXNlIGRlc3Ryb3kgaXQgZmlyc3QuJyk7XG4gIH1cblxuICByZXR1cm4gcGxhdGZvcm07XG59XG5cbi8qKlxuICogRGVzdHJveSB0aGUgZXhpc3RpbmcgcGxhdGZvcm0uXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gZGVzdHJveVBsYXRmb3JtKCk6IHZvaWQge1xuICBpZiAoX3BsYXRmb3JtICYmICFfcGxhdGZvcm0uZGVzdHJveWVkKSB7XG4gICAgX3BsYXRmb3JtLmRlc3Ryb3koKTtcbiAgfVxufVxuXG4vKipcbiAqIFJldHVybnMgdGhlIGN1cnJlbnQgcGxhdGZvcm0uXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0UGxhdGZvcm0oKTogUGxhdGZvcm1SZWZ8bnVsbCB7XG4gIHJldHVybiBfcGxhdGZvcm0gJiYgIV9wbGF0Zm9ybS5kZXN0cm95ZWQgPyBfcGxhdGZvcm0gOiBudWxsO1xufVxuXG4vKipcbiAqIFByb3ZpZGVzIGFkZGl0aW9uYWwgb3B0aW9ucyB0byB0aGUgYm9vdHN0cmFwaW5nIHByb2Nlc3MuXG4gKlxuICpcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBCb290c3RyYXBPcHRpb25zIHtcbiAgLyoqXG4gICAqIE9wdGlvbmFsbHkgc3BlY2lmeSB3aGljaCBgTmdab25lYCBzaG91bGQgYmUgdXNlZC5cbiAgICpcbiAgICogLSBQcm92aWRlIHlvdXIgb3duIGBOZ1pvbmVgIGluc3RhbmNlLlxuICAgKiAtIGB6b25lLmpzYCAtIFVzZSBkZWZhdWx0IGBOZ1pvbmVgIHdoaWNoIHJlcXVpcmVzIGBab25lLmpzYC5cbiAgICogLSBgbm9vcGAgLSBVc2UgYE5vb3BOZ1pvbmVgIHdoaWNoIGRvZXMgbm90aGluZy5cbiAgICovXG4gIG5nWm9uZT86IE5nWm9uZXwnem9uZS5qcyd8J25vb3AnO1xufVxuXG4vKipcbiAqIFRoZSBBbmd1bGFyIHBsYXRmb3JtIGlzIHRoZSBlbnRyeSBwb2ludCBmb3IgQW5ndWxhciBvbiBhIHdlYiBwYWdlLiBFYWNoIHBhZ2VcbiAqIGhhcyBleGFjdGx5IG9uZSBwbGF0Zm9ybSwgYW5kIHNlcnZpY2VzIChzdWNoIGFzIHJlZmxlY3Rpb24pIHdoaWNoIGFyZSBjb21tb25cbiAqIHRvIGV2ZXJ5IEFuZ3VsYXIgYXBwbGljYXRpb24gcnVubmluZyBvbiB0aGUgcGFnZSBhcmUgYm91bmQgaW4gaXRzIHNjb3BlLlxuICpcbiAqIEEgcGFnZSdzIHBsYXRmb3JtIGlzIGluaXRpYWxpemVkIGltcGxpY2l0bHkgd2hlbiBhIHBsYXRmb3JtIGlzIGNyZWF0ZWQgdmlhIGEgcGxhdGZvcm0gZmFjdG9yeVxuICogKGUuZy4ge0BsaW5rIHBsYXRmb3JtQnJvd3Nlcn0pLCBvciBleHBsaWNpdGx5IGJ5IGNhbGxpbmcgdGhlIHtAbGluayBjcmVhdGVQbGF0Zm9ybX0gZnVuY3Rpb24uXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5ASW5qZWN0YWJsZSgpXG5leHBvcnQgY2xhc3MgUGxhdGZvcm1SZWYge1xuICBwcml2YXRlIF9tb2R1bGVzOiBOZ01vZHVsZVJlZjxhbnk+W10gPSBbXTtcbiAgcHJpdmF0ZSBfZGVzdHJveUxpc3RlbmVyczogRnVuY3Rpb25bXSA9IFtdO1xuICBwcml2YXRlIF9kZXN0cm95ZWQ6IGJvb2xlYW4gPSBmYWxzZTtcblxuICAvKiogQGludGVybmFsICovXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgX2luamVjdG9yOiBJbmplY3Rvcikge31cblxuICAvKipcbiAgICogQ3JlYXRlcyBhbiBpbnN0YW5jZSBvZiBhbiBgQE5nTW9kdWxlYCBmb3IgdGhlIGdpdmVuIHBsYXRmb3JtXG4gICAqIGZvciBvZmZsaW5lIGNvbXBpbGF0aW9uLlxuICAgKlxuICAgKiBAdXNhZ2VOb3Rlc1xuICAgKiAjIyMgU2ltcGxlIEV4YW1wbGVcbiAgICpcbiAgICogYGBgdHlwZXNjcmlwdFxuICAgKiBteV9tb2R1bGUudHM6XG4gICAqXG4gICAqIEBOZ01vZHVsZSh7XG4gICAqICAgaW1wb3J0czogW0Jyb3dzZXJNb2R1bGVdXG4gICAqIH0pXG4gICAqIGNsYXNzIE15TW9kdWxlIHt9XG4gICAqXG4gICAqIG1haW4udHM6XG4gICAqIGltcG9ydCB7TXlNb2R1bGVOZ0ZhY3Rvcnl9IGZyb20gJy4vbXlfbW9kdWxlLm5nZmFjdG9yeSc7XG4gICAqIGltcG9ydCB7cGxhdGZvcm1Ccm93c2VyfSBmcm9tICdAYW5ndWxhci9wbGF0Zm9ybS1icm93c2VyJztcbiAgICpcbiAgICogbGV0IG1vZHVsZVJlZiA9IHBsYXRmb3JtQnJvd3NlcigpLmJvb3RzdHJhcE1vZHVsZUZhY3RvcnkoTXlNb2R1bGVOZ0ZhY3RvcnkpO1xuICAgKiBgYGBcbiAgICovXG4gIGJvb3RzdHJhcE1vZHVsZUZhY3Rvcnk8TT4obW9kdWxlRmFjdG9yeTogTmdNb2R1bGVGYWN0b3J5PE0+LCBvcHRpb25zPzogQm9vdHN0cmFwT3B0aW9ucyk6XG4gICAgICBQcm9taXNlPE5nTW9kdWxlUmVmPE0+PiB7XG4gICAgLy8gTm90ZTogV2UgbmVlZCB0byBjcmVhdGUgdGhlIE5nWm9uZSBfYmVmb3JlXyB3ZSBpbnN0YW50aWF0ZSB0aGUgbW9kdWxlLFxuICAgIC8vIGFzIGluc3RhbnRpYXRpbmcgdGhlIG1vZHVsZSBjcmVhdGVzIHNvbWUgcHJvdmlkZXJzIGVhZ2VybHkuXG4gICAgLy8gU28gd2UgY3JlYXRlIGEgbWluaSBwYXJlbnQgaW5qZWN0b3IgdGhhdCBqdXN0IGNvbnRhaW5zIHRoZSBuZXcgTmdab25lIGFuZFxuICAgIC8vIHBhc3MgdGhhdCBhcyBwYXJlbnQgdG8gdGhlIE5nTW9kdWxlRmFjdG9yeS5cbiAgICBjb25zdCBuZ1pvbmVPcHRpb24gPSBvcHRpb25zID8gb3B0aW9ucy5uZ1pvbmUgOiB1bmRlZmluZWQ7XG4gICAgY29uc3Qgbmdab25lID0gZ2V0Tmdab25lKG5nWm9uZU9wdGlvbik7XG4gICAgY29uc3QgcHJvdmlkZXJzOiBTdGF0aWNQcm92aWRlcltdID0gW3twcm92aWRlOiBOZ1pvbmUsIHVzZVZhbHVlOiBuZ1pvbmV9XTtcbiAgICAvLyBBdHRlbnRpb246IERvbid0IHVzZSBBcHBsaWNhdGlvblJlZi5ydW4gaGVyZSxcbiAgICAvLyBhcyB3ZSB3YW50IHRvIGJlIHN1cmUgdGhhdCBhbGwgcG9zc2libGUgY29uc3RydWN0b3IgY2FsbHMgYXJlIGluc2lkZSBgbmdab25lLnJ1bmAhXG4gICAgcmV0dXJuIG5nWm9uZS5ydW4oKCkgPT4ge1xuICAgICAgY29uc3Qgbmdab25lSW5qZWN0b3IgPSBJbmplY3Rvci5jcmVhdGUoXG4gICAgICAgICAge3Byb3ZpZGVyczogcHJvdmlkZXJzLCBwYXJlbnQ6IHRoaXMuaW5qZWN0b3IsIG5hbWU6IG1vZHVsZUZhY3RvcnkubW9kdWxlVHlwZS5uYW1lfSk7XG4gICAgICBjb25zdCBtb2R1bGVSZWYgPSA8SW50ZXJuYWxOZ01vZHVsZVJlZjxNPj5tb2R1bGVGYWN0b3J5LmNyZWF0ZShuZ1pvbmVJbmplY3Rvcik7XG4gICAgICBjb25zdCBleGNlcHRpb25IYW5kbGVyOiBFcnJvckhhbmRsZXIgPSBtb2R1bGVSZWYuaW5qZWN0b3IuZ2V0KEVycm9ySGFuZGxlciwgbnVsbCk7XG4gICAgICBpZiAoIWV4Y2VwdGlvbkhhbmRsZXIpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdObyBFcnJvckhhbmRsZXIuIElzIHBsYXRmb3JtIG1vZHVsZSAoQnJvd3Nlck1vZHVsZSkgaW5jbHVkZWQ/Jyk7XG4gICAgICB9XG4gICAgICAvLyBJZiB0aGUgYExPQ0FMRV9JRGAgcHJvdmlkZXIgaXMgZGVmaW5lZCBhdCBib290c3RyYXAgd2Ugc2V0IHRoZSB2YWx1ZSBmb3IgcnVudGltZSBpMThuIChpdnkpXG4gICAgICBjb25zdCBsb2NhbGVJZCA9IG1vZHVsZVJlZi5pbmplY3Rvci5nZXQoTE9DQUxFX0lELCBERUZBVUxUX0xPQ0FMRV9JRCk7XG4gICAgICBzZXRMb2NhbGVJZChsb2NhbGVJZCk7XG4gICAgICBtb2R1bGVSZWYub25EZXN0cm95KCgpID0+IHJlbW92ZSh0aGlzLl9tb2R1bGVzLCBtb2R1bGVSZWYpKTtcbiAgICAgIG5nWm9uZSAhLnJ1bk91dHNpZGVBbmd1bGFyKFxuICAgICAgICAgICgpID0+IG5nWm9uZSAhLm9uRXJyb3Iuc3Vic2NyaWJlKFxuICAgICAgICAgICAgICB7bmV4dDogKGVycm9yOiBhbnkpID0+IHsgZXhjZXB0aW9uSGFuZGxlci5oYW5kbGVFcnJvcihlcnJvcik7IH19KSk7XG4gICAgICByZXR1cm4gX2NhbGxBbmRSZXBvcnRUb0Vycm9ySGFuZGxlcihleGNlcHRpb25IYW5kbGVyLCBuZ1pvbmUgISwgKCkgPT4ge1xuICAgICAgICBjb25zdCBpbml0U3RhdHVzOiBBcHBsaWNhdGlvbkluaXRTdGF0dXMgPSBtb2R1bGVSZWYuaW5qZWN0b3IuZ2V0KEFwcGxpY2F0aW9uSW5pdFN0YXR1cyk7XG4gICAgICAgIGluaXRTdGF0dXMucnVuSW5pdGlhbGl6ZXJzKCk7XG4gICAgICAgIHJldHVybiBpbml0U3RhdHVzLmRvbmVQcm9taXNlLnRoZW4oKCkgPT4ge1xuICAgICAgICAgIHRoaXMuX21vZHVsZURvQm9vdHN0cmFwKG1vZHVsZVJlZik7XG4gICAgICAgICAgcmV0dXJuIG1vZHVsZVJlZjtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGFuIGluc3RhbmNlIG9mIGFuIGBATmdNb2R1bGVgIGZvciBhIGdpdmVuIHBsYXRmb3JtIHVzaW5nIHRoZSBnaXZlbiBydW50aW1lIGNvbXBpbGVyLlxuICAgKlxuICAgKiBAdXNhZ2VOb3Rlc1xuICAgKiAjIyMgU2ltcGxlIEV4YW1wbGVcbiAgICpcbiAgICogYGBgdHlwZXNjcmlwdFxuICAgKiBATmdNb2R1bGUoe1xuICAgKiAgIGltcG9ydHM6IFtCcm93c2VyTW9kdWxlXVxuICAgKiB9KVxuICAgKiBjbGFzcyBNeU1vZHVsZSB7fVxuICAgKlxuICAgKiBsZXQgbW9kdWxlUmVmID0gcGxhdGZvcm1Ccm93c2VyKCkuYm9vdHN0cmFwTW9kdWxlKE15TW9kdWxlKTtcbiAgICogYGBgXG4gICAqXG4gICAqL1xuICBib290c3RyYXBNb2R1bGU8TT4oXG4gICAgICBtb2R1bGVUeXBlOiBUeXBlPE0+LCBjb21waWxlck9wdGlvbnM6IChDb21waWxlck9wdGlvbnMmQm9vdHN0cmFwT3B0aW9ucyl8XG4gICAgICBBcnJheTxDb21waWxlck9wdGlvbnMmQm9vdHN0cmFwT3B0aW9ucz4gPSBbXSk6IFByb21pc2U8TmdNb2R1bGVSZWY8TT4+IHtcbiAgICBjb25zdCBvcHRpb25zID0gb3B0aW9uc1JlZHVjZXIoe30sIGNvbXBpbGVyT3B0aW9ucyk7XG4gICAgcmV0dXJuIGNvbXBpbGVOZ01vZHVsZUZhY3RvcnkodGhpcy5pbmplY3Rvciwgb3B0aW9ucywgbW9kdWxlVHlwZSlcbiAgICAgICAgLnRoZW4obW9kdWxlRmFjdG9yeSA9PiB0aGlzLmJvb3RzdHJhcE1vZHVsZUZhY3RvcnkobW9kdWxlRmFjdG9yeSwgb3B0aW9ucykpO1xuICB9XG5cbiAgcHJpdmF0ZSBfbW9kdWxlRG9Cb290c3RyYXAobW9kdWxlUmVmOiBJbnRlcm5hbE5nTW9kdWxlUmVmPGFueT4pOiB2b2lkIHtcbiAgICBjb25zdCBhcHBSZWYgPSBtb2R1bGVSZWYuaW5qZWN0b3IuZ2V0KEFwcGxpY2F0aW9uUmVmKSBhcyBBcHBsaWNhdGlvblJlZjtcbiAgICBpZiAobW9kdWxlUmVmLl9ib290c3RyYXBDb21wb25lbnRzLmxlbmd0aCA+IDApIHtcbiAgICAgIG1vZHVsZVJlZi5fYm9vdHN0cmFwQ29tcG9uZW50cy5mb3JFYWNoKGYgPT4gYXBwUmVmLmJvb3RzdHJhcChmKSk7XG4gICAgfSBlbHNlIGlmIChtb2R1bGVSZWYuaW5zdGFuY2UubmdEb0Jvb3RzdHJhcCkge1xuICAgICAgbW9kdWxlUmVmLmluc3RhbmNlLm5nRG9Cb290c3RyYXAoYXBwUmVmKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgIGBUaGUgbW9kdWxlICR7c3RyaW5naWZ5KG1vZHVsZVJlZi5pbnN0YW5jZS5jb25zdHJ1Y3Rvcil9IHdhcyBib290c3RyYXBwZWQsIGJ1dCBpdCBkb2VzIG5vdCBkZWNsYXJlIFwiQE5nTW9kdWxlLmJvb3RzdHJhcFwiIGNvbXBvbmVudHMgbm9yIGEgXCJuZ0RvQm9vdHN0cmFwXCIgbWV0aG9kLiBgICtcbiAgICAgICAgICBgUGxlYXNlIGRlZmluZSBvbmUgb2YgdGhlc2UuYCk7XG4gICAgfVxuICAgIHRoaXMuX21vZHVsZXMucHVzaChtb2R1bGVSZWYpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlZ2lzdGVyIGEgbGlzdGVuZXIgdG8gYmUgY2FsbGVkIHdoZW4gdGhlIHBsYXRmb3JtIGlzIGRpc3Bvc2VkLlxuICAgKi9cbiAgb25EZXN0cm95KGNhbGxiYWNrOiAoKSA9PiB2b2lkKTogdm9pZCB7IHRoaXMuX2Rlc3Ryb3lMaXN0ZW5lcnMucHVzaChjYWxsYmFjayk7IH1cblxuICAvKipcbiAgICogUmV0cmlldmUgdGhlIHBsYXRmb3JtIHtAbGluayBJbmplY3Rvcn0sIHdoaWNoIGlzIHRoZSBwYXJlbnQgaW5qZWN0b3IgZm9yXG4gICAqIGV2ZXJ5IEFuZ3VsYXIgYXBwbGljYXRpb24gb24gdGhlIHBhZ2UgYW5kIHByb3ZpZGVzIHNpbmdsZXRvbiBwcm92aWRlcnMuXG4gICAqL1xuICBnZXQgaW5qZWN0b3IoKTogSW5qZWN0b3IgeyByZXR1cm4gdGhpcy5faW5qZWN0b3I7IH1cblxuICAvKipcbiAgICogRGVzdHJveSB0aGUgQW5ndWxhciBwbGF0Zm9ybSBhbmQgYWxsIEFuZ3VsYXIgYXBwbGljYXRpb25zIG9uIHRoZSBwYWdlLlxuICAgKi9cbiAgZGVzdHJveSgpIHtcbiAgICBpZiAodGhpcy5fZGVzdHJveWVkKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1RoZSBwbGF0Zm9ybSBoYXMgYWxyZWFkeSBiZWVuIGRlc3Ryb3llZCEnKTtcbiAgICB9XG4gICAgdGhpcy5fbW9kdWxlcy5zbGljZSgpLmZvckVhY2gobW9kdWxlID0+IG1vZHVsZS5kZXN0cm95KCkpO1xuICAgIHRoaXMuX2Rlc3Ryb3lMaXN0ZW5lcnMuZm9yRWFjaChsaXN0ZW5lciA9PiBsaXN0ZW5lcigpKTtcbiAgICB0aGlzLl9kZXN0cm95ZWQgPSB0cnVlO1xuICB9XG5cbiAgZ2V0IGRlc3Ryb3llZCgpIHsgcmV0dXJuIHRoaXMuX2Rlc3Ryb3llZDsgfVxufVxuXG5mdW5jdGlvbiBnZXROZ1pvbmUobmdab25lT3B0aW9uPzogTmdab25lIHwgJ3pvbmUuanMnIHwgJ25vb3AnKTogTmdab25lIHtcbiAgbGV0IG5nWm9uZTogTmdab25lO1xuXG4gIGlmIChuZ1pvbmVPcHRpb24gPT09ICdub29wJykge1xuICAgIG5nWm9uZSA9IG5ldyBOb29wTmdab25lKCk7XG4gIH0gZWxzZSB7XG4gICAgbmdab25lID0gKG5nWm9uZU9wdGlvbiA9PT0gJ3pvbmUuanMnID8gdW5kZWZpbmVkIDogbmdab25lT3B0aW9uKSB8fFxuICAgICAgICBuZXcgTmdab25lKHtlbmFibGVMb25nU3RhY2tUcmFjZTogaXNEZXZNb2RlKCl9KTtcbiAgfVxuICByZXR1cm4gbmdab25lO1xufVxuXG5mdW5jdGlvbiBfY2FsbEFuZFJlcG9ydFRvRXJyb3JIYW5kbGVyKFxuICAgIGVycm9ySGFuZGxlcjogRXJyb3JIYW5kbGVyLCBuZ1pvbmU6IE5nWm9uZSwgY2FsbGJhY2s6ICgpID0+IGFueSk6IGFueSB7XG4gIHRyeSB7XG4gICAgY29uc3QgcmVzdWx0ID0gY2FsbGJhY2soKTtcbiAgICBpZiAoaXNQcm9taXNlKHJlc3VsdCkpIHtcbiAgICAgIHJldHVybiByZXN1bHQuY2F0Y2goKGU6IGFueSkgPT4ge1xuICAgICAgICBuZ1pvbmUucnVuT3V0c2lkZUFuZ3VsYXIoKCkgPT4gZXJyb3JIYW5kbGVyLmhhbmRsZUVycm9yKGUpKTtcbiAgICAgICAgLy8gcmV0aHJvdyBhcyB0aGUgZXhjZXB0aW9uIGhhbmRsZXIgbWlnaHQgbm90IGRvIGl0XG4gICAgICAgIHRocm93IGU7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9IGNhdGNoIChlKSB7XG4gICAgbmdab25lLnJ1bk91dHNpZGVBbmd1bGFyKCgpID0+IGVycm9ySGFuZGxlci5oYW5kbGVFcnJvcihlKSk7XG4gICAgLy8gcmV0aHJvdyBhcyB0aGUgZXhjZXB0aW9uIGhhbmRsZXIgbWlnaHQgbm90IGRvIGl0XG4gICAgdGhyb3cgZTtcbiAgfVxufVxuXG5mdW5jdGlvbiBvcHRpb25zUmVkdWNlcjxUIGV4dGVuZHMgT2JqZWN0Pihkc3Q6IGFueSwgb2JqczogVCB8IFRbXSk6IFQge1xuICBpZiAoQXJyYXkuaXNBcnJheShvYmpzKSkge1xuICAgIGRzdCA9IG9ianMucmVkdWNlKG9wdGlvbnNSZWR1Y2VyLCBkc3QpO1xuICB9IGVsc2Uge1xuICAgIGRzdCA9IHsuLi5kc3QsIC4uLihvYmpzIGFzIGFueSl9O1xuICB9XG4gIHJldHVybiBkc3Q7XG59XG5cbi8qKlxuICogQSByZWZlcmVuY2UgdG8gYW4gQW5ndWxhciBhcHBsaWNhdGlvbiBydW5uaW5nIG9uIGEgcGFnZS5cbiAqXG4gKiBAdXNhZ2VOb3Rlc1xuICpcbiAqIHtAYSBpcy1zdGFibGUtZXhhbXBsZXN9XG4gKiAjIyMgaXNTdGFibGUgZXhhbXBsZXMgYW5kIGNhdmVhdHNcbiAqXG4gKiBOb3RlIHR3byBpbXBvcnRhbnQgcG9pbnRzIGFib3V0IGBpc1N0YWJsZWAsIGRlbW9uc3RyYXRlZCBpbiB0aGUgZXhhbXBsZXMgYmVsb3c6XG4gKiAtIHRoZSBhcHBsaWNhdGlvbiB3aWxsIG5ldmVyIGJlIHN0YWJsZSBpZiB5b3Ugc3RhcnQgYW55IGtpbmRcbiAqIG9mIHJlY3VycmVudCBhc3luY2hyb25vdXMgdGFzayB3aGVuIHRoZSBhcHBsaWNhdGlvbiBzdGFydHNcbiAqIChmb3IgZXhhbXBsZSBmb3IgYSBwb2xsaW5nIHByb2Nlc3MsIHN0YXJ0ZWQgd2l0aCBhIGBzZXRJbnRlcnZhbGAsIGEgYHNldFRpbWVvdXRgXG4gKiBvciB1c2luZyBSeEpTIG9wZXJhdG9ycyBsaWtlIGBpbnRlcnZhbGApO1xuICogLSB0aGUgYGlzU3RhYmxlYCBPYnNlcnZhYmxlIHJ1bnMgb3V0c2lkZSBvZiB0aGUgQW5ndWxhciB6b25lLlxuICpcbiAqIExldCdzIGltYWdpbmUgdGhhdCB5b3Ugc3RhcnQgYSByZWN1cnJlbnQgdGFza1xuICogKGhlcmUgaW5jcmVtZW50aW5nIGEgY291bnRlciwgdXNpbmcgUnhKUyBgaW50ZXJ2YWxgKSxcbiAqIGFuZCBhdCB0aGUgc2FtZSB0aW1lIHN1YnNjcmliZSB0byBgaXNTdGFibGVgLlxuICpcbiAqIGBgYFxuICogY29uc3RydWN0b3IoYXBwUmVmOiBBcHBsaWNhdGlvblJlZikge1xuICogICBhcHBSZWYuaXNTdGFibGUucGlwZShcbiAqICAgICAgZmlsdGVyKHN0YWJsZSA9PiBzdGFibGUpXG4gKiAgICkuc3Vic2NyaWJlKCgpID0+IGNvbnNvbGUubG9nKCdBcHAgaXMgc3RhYmxlIG5vdycpO1xuICogICBpbnRlcnZhbCgxMDAwKS5zdWJzY3JpYmUoY291bnRlciA9PiBjb25zb2xlLmxvZyhjb3VudGVyKSk7XG4gKiB9XG4gKiBgYGBcbiAqIEluIHRoaXMgZXhhbXBsZSwgYGlzU3RhYmxlYCB3aWxsIG5ldmVyIGVtaXQgYHRydWVgLFxuICogYW5kIHRoZSB0cmFjZSBcIkFwcCBpcyBzdGFibGUgbm93XCIgd2lsbCBuZXZlciBnZXQgbG9nZ2VkLlxuICpcbiAqIElmIHlvdSB3YW50IHRvIGV4ZWN1dGUgc29tZXRoaW5nIHdoZW4gdGhlIGFwcCBpcyBzdGFibGUsXG4gKiB5b3UgaGF2ZSB0byB3YWl0IGZvciB0aGUgYXBwbGljYXRpb24gdG8gYmUgc3RhYmxlXG4gKiBiZWZvcmUgc3RhcnRpbmcgeW91ciBwb2xsaW5nIHByb2Nlc3MuXG4gKlxuICogYGBgXG4gKiBjb25zdHJ1Y3RvcihhcHBSZWY6IEFwcGxpY2F0aW9uUmVmKSB7XG4gKiAgIGFwcFJlZi5pc1N0YWJsZS5waXBlKFxuICogICAgIGZpcnN0KHN0YWJsZSA9PiBzdGFibGUpLFxuICogICAgIHRhcChzdGFibGUgPT4gY29uc29sZS5sb2coJ0FwcCBpcyBzdGFibGUgbm93JykpLFxuICogICAgIHN3aXRjaE1hcCgoKSA9PiBpbnRlcnZhbCgxMDAwKSlcbiAqICAgKS5zdWJzY3JpYmUoY291bnRlciA9PiBjb25zb2xlLmxvZyhjb3VudGVyKSk7XG4gKiB9XG4gKiBgYGBcbiAqIEluIHRoaXMgZXhhbXBsZSwgdGhlIHRyYWNlIFwiQXBwIGlzIHN0YWJsZSBub3dcIiB3aWxsIGJlIGxvZ2dlZFxuICogYW5kIHRoZW4gdGhlIGNvdW50ZXIgc3RhcnRzIGluY3JlbWVudGluZyBldmVyeSBzZWNvbmQuXG4gKlxuICogTm90ZSBhbHNvIHRoYXQgdGhpcyBPYnNlcnZhYmxlIHJ1bnMgb3V0c2lkZSBvZiB0aGUgQW5ndWxhciB6b25lLFxuICogd2hpY2ggbWVhbnMgdGhhdCB0aGUgY29kZSBpbiB0aGUgc3Vic2NyaXB0aW9uXG4gKiB0byB0aGlzIE9ic2VydmFibGUgd2lsbCBub3QgdHJpZ2dlciB0aGUgY2hhbmdlIGRldGVjdGlvbi5cbiAqXG4gKiBMZXQncyBpbWFnaW5lIHRoYXQgaW5zdGVhZCBvZiBsb2dnaW5nIHRoZSBjb3VudGVyIHZhbHVlLFxuICogeW91IHVwZGF0ZSBhIGZpZWxkIG9mIHlvdXIgY29tcG9uZW50XG4gKiBhbmQgZGlzcGxheSBpdCBpbiBpdHMgdGVtcGxhdGUuXG4gKlxuICogYGBgXG4gKiBjb25zdHJ1Y3RvcihhcHBSZWY6IEFwcGxpY2F0aW9uUmVmKSB7XG4gKiAgIGFwcFJlZi5pc1N0YWJsZS5waXBlKFxuICogICAgIGZpcnN0KHN0YWJsZSA9PiBzdGFibGUpLFxuICogICAgIHN3aXRjaE1hcCgoKSA9PiBpbnRlcnZhbCgxMDAwKSlcbiAqICAgKS5zdWJzY3JpYmUoY291bnRlciA9PiB0aGlzLnZhbHVlID0gY291bnRlcik7XG4gKiB9XG4gKiBgYGBcbiAqIEFzIHRoZSBgaXNTdGFibGVgIE9ic2VydmFibGUgcnVucyBvdXRzaWRlIHRoZSB6b25lLFxuICogdGhlIGB2YWx1ZWAgZmllbGQgd2lsbCBiZSB1cGRhdGVkIHByb3Blcmx5LFxuICogYnV0IHRoZSB0ZW1wbGF0ZSB3aWxsIG5vdCBiZSByZWZyZXNoZWQhXG4gKlxuICogWW91J2xsIGhhdmUgdG8gbWFudWFsbHkgdHJpZ2dlciB0aGUgY2hhbmdlIGRldGVjdGlvbiB0byB1cGRhdGUgdGhlIHRlbXBsYXRlLlxuICpcbiAqIGBgYFxuICogY29uc3RydWN0b3IoYXBwUmVmOiBBcHBsaWNhdGlvblJlZiwgY2Q6IENoYW5nZURldGVjdG9yUmVmKSB7XG4gKiAgIGFwcFJlZi5pc1N0YWJsZS5waXBlKFxuICogICAgIGZpcnN0KHN0YWJsZSA9PiBzdGFibGUpLFxuICogICAgIHN3aXRjaE1hcCgoKSA9PiBpbnRlcnZhbCgxMDAwKSlcbiAqICAgKS5zdWJzY3JpYmUoY291bnRlciA9PiB7XG4gKiAgICAgdGhpcy52YWx1ZSA9IGNvdW50ZXI7XG4gKiAgICAgY2QuZGV0ZWN0Q2hhbmdlcygpO1xuICogICB9KTtcbiAqIH1cbiAqIGBgYFxuICpcbiAqIE9yIG1ha2UgdGhlIHN1YnNjcmlwdGlvbiBjYWxsYmFjayBydW4gaW5zaWRlIHRoZSB6b25lLlxuICpcbiAqIGBgYFxuICogY29uc3RydWN0b3IoYXBwUmVmOiBBcHBsaWNhdGlvblJlZiwgem9uZTogTmdab25lKSB7XG4gKiAgIGFwcFJlZi5pc1N0YWJsZS5waXBlKFxuICogICAgIGZpcnN0KHN0YWJsZSA9PiBzdGFibGUpLFxuICogICAgIHN3aXRjaE1hcCgoKSA9PiBpbnRlcnZhbCgxMDAwKSlcbiAqICAgKS5zdWJzY3JpYmUoY291bnRlciA9PiB6b25lLnJ1bigoKSA9PiB0aGlzLnZhbHVlID0gY291bnRlcikpO1xuICogfVxuICogYGBgXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5ASW5qZWN0YWJsZSgpXG5leHBvcnQgY2xhc3MgQXBwbGljYXRpb25SZWYge1xuICAvKiogQGludGVybmFsICovXG4gIHN0YXRpYyBfdGlja1Njb3BlOiBXdGZTY29wZUZuID0gd3RmQ3JlYXRlU2NvcGUoJ0FwcGxpY2F0aW9uUmVmI3RpY2soKScpO1xuICBwcml2YXRlIF9ib290c3RyYXBMaXN0ZW5lcnM6ICgoY29tcFJlZjogQ29tcG9uZW50UmVmPGFueT4pID0+IHZvaWQpW10gPSBbXTtcbiAgcHJpdmF0ZSBfdmlld3M6IEludGVybmFsVmlld1JlZltdID0gW107XG4gIHByaXZhdGUgX3J1bm5pbmdUaWNrOiBib29sZWFuID0gZmFsc2U7XG4gIHByaXZhdGUgX2VuZm9yY2VOb05ld0NoYW5nZXM6IGJvb2xlYW4gPSBmYWxzZTtcbiAgcHJpdmF0ZSBfc3RhYmxlID0gdHJ1ZTtcblxuICAvKipcbiAgICogR2V0IGEgbGlzdCBvZiBjb21wb25lbnQgdHlwZXMgcmVnaXN0ZXJlZCB0byB0aGlzIGFwcGxpY2F0aW9uLlxuICAgKiBUaGlzIGxpc3QgaXMgcG9wdWxhdGVkIGV2ZW4gYmVmb3JlIHRoZSBjb21wb25lbnQgaXMgY3JlYXRlZC5cbiAgICovXG4gIHB1YmxpYyByZWFkb25seSBjb21wb25lbnRUeXBlczogVHlwZTxhbnk+W10gPSBbXTtcblxuICAvKipcbiAgICogR2V0IGEgbGlzdCBvZiBjb21wb25lbnRzIHJlZ2lzdGVyZWQgdG8gdGhpcyBhcHBsaWNhdGlvbi5cbiAgICovXG4gIHB1YmxpYyByZWFkb25seSBjb21wb25lbnRzOiBDb21wb25lbnRSZWY8YW55PltdID0gW107XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYW4gT2JzZXJ2YWJsZSB0aGF0IGluZGljYXRlcyB3aGVuIHRoZSBhcHBsaWNhdGlvbiBpcyBzdGFibGUgb3IgdW5zdGFibGUuXG4gICAqXG4gICAqIEBzZWUgIFtVc2FnZSBub3Rlc10oI2lzLXN0YWJsZS1leGFtcGxlcykgZm9yIGV4YW1wbGVzIGFuZCBjYXZlYXRzIHdoZW4gdXNpbmcgdGhpcyBBUEkuXG4gICAqL1xuICAvLyBUT0RPKGlzc3VlLzI0NTcxKTogcmVtb3ZlICchJy5cbiAgcHVibGljIHJlYWRvbmx5IGlzU3RhYmxlICE6IE9ic2VydmFibGU8Ym9vbGVhbj47XG5cbiAgLyoqIEBpbnRlcm5hbCAqL1xuICBjb25zdHJ1Y3RvcihcbiAgICAgIHByaXZhdGUgX3pvbmU6IE5nWm9uZSwgcHJpdmF0ZSBfY29uc29sZTogQ29uc29sZSwgcHJpdmF0ZSBfaW5qZWN0b3I6IEluamVjdG9yLFxuICAgICAgcHJpdmF0ZSBfZXhjZXB0aW9uSGFuZGxlcjogRXJyb3JIYW5kbGVyLFxuICAgICAgcHJpdmF0ZSBfY29tcG9uZW50RmFjdG9yeVJlc29sdmVyOiBDb21wb25lbnRGYWN0b3J5UmVzb2x2ZXIsXG4gICAgICBwcml2YXRlIF9pbml0U3RhdHVzOiBBcHBsaWNhdGlvbkluaXRTdGF0dXMpIHtcbiAgICB0aGlzLl9lbmZvcmNlTm9OZXdDaGFuZ2VzID0gaXNEZXZNb2RlKCk7XG5cbiAgICB0aGlzLl96b25lLm9uTWljcm90YXNrRW1wdHkuc3Vic2NyaWJlKFxuICAgICAgICB7bmV4dDogKCkgPT4geyB0aGlzLl96b25lLnJ1bigoKSA9PiB7IHRoaXMudGljaygpOyB9KTsgfX0pO1xuXG4gICAgY29uc3QgaXNDdXJyZW50bHlTdGFibGUgPSBuZXcgT2JzZXJ2YWJsZTxib29sZWFuPigob2JzZXJ2ZXI6IE9ic2VydmVyPGJvb2xlYW4+KSA9PiB7XG4gICAgICB0aGlzLl9zdGFibGUgPSB0aGlzLl96b25lLmlzU3RhYmxlICYmICF0aGlzLl96b25lLmhhc1BlbmRpbmdNYWNyb3Rhc2tzICYmXG4gICAgICAgICAgIXRoaXMuX3pvbmUuaGFzUGVuZGluZ01pY3JvdGFza3M7XG4gICAgICB0aGlzLl96b25lLnJ1bk91dHNpZGVBbmd1bGFyKCgpID0+IHtcbiAgICAgICAgb2JzZXJ2ZXIubmV4dCh0aGlzLl9zdGFibGUpO1xuICAgICAgICBvYnNlcnZlci5jb21wbGV0ZSgpO1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBjb25zdCBpc1N0YWJsZSA9IG5ldyBPYnNlcnZhYmxlPGJvb2xlYW4+KChvYnNlcnZlcjogT2JzZXJ2ZXI8Ym9vbGVhbj4pID0+IHtcbiAgICAgIC8vIENyZWF0ZSB0aGUgc3Vic2NyaXB0aW9uIHRvIG9uU3RhYmxlIG91dHNpZGUgdGhlIEFuZ3VsYXIgWm9uZSBzbyB0aGF0XG4gICAgICAvLyB0aGUgY2FsbGJhY2sgaXMgcnVuIG91dHNpZGUgdGhlIEFuZ3VsYXIgWm9uZS5cbiAgICAgIGxldCBzdGFibGVTdWI6IFN1YnNjcmlwdGlvbjtcbiAgICAgIHRoaXMuX3pvbmUucnVuT3V0c2lkZUFuZ3VsYXIoKCkgPT4ge1xuICAgICAgICBzdGFibGVTdWIgPSB0aGlzLl96b25lLm9uU3RhYmxlLnN1YnNjcmliZSgoKSA9PiB7XG4gICAgICAgICAgTmdab25lLmFzc2VydE5vdEluQW5ndWxhclpvbmUoKTtcblxuICAgICAgICAgIC8vIENoZWNrIHdoZXRoZXIgdGhlcmUgYXJlIG5vIHBlbmRpbmcgbWFjcm8vbWljcm8gdGFza3MgaW4gdGhlIG5leHQgdGlja1xuICAgICAgICAgIC8vIHRvIGFsbG93IGZvciBOZ1pvbmUgdG8gdXBkYXRlIHRoZSBzdGF0ZS5cbiAgICAgICAgICBzY2hlZHVsZU1pY3JvVGFzaygoKSA9PiB7XG4gICAgICAgICAgICBpZiAoIXRoaXMuX3N0YWJsZSAmJiAhdGhpcy5fem9uZS5oYXNQZW5kaW5nTWFjcm90YXNrcyAmJlxuICAgICAgICAgICAgICAgICF0aGlzLl96b25lLmhhc1BlbmRpbmdNaWNyb3Rhc2tzKSB7XG4gICAgICAgICAgICAgIHRoaXMuX3N0YWJsZSA9IHRydWU7XG4gICAgICAgICAgICAgIG9ic2VydmVyLm5leHQodHJ1ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG5cbiAgICAgIGNvbnN0IHVuc3RhYmxlU3ViOiBTdWJzY3JpcHRpb24gPSB0aGlzLl96b25lLm9uVW5zdGFibGUuc3Vic2NyaWJlKCgpID0+IHtcbiAgICAgICAgTmdab25lLmFzc2VydEluQW5ndWxhclpvbmUoKTtcbiAgICAgICAgaWYgKHRoaXMuX3N0YWJsZSkge1xuICAgICAgICAgIHRoaXMuX3N0YWJsZSA9IGZhbHNlO1xuICAgICAgICAgIHRoaXMuX3pvbmUucnVuT3V0c2lkZUFuZ3VsYXIoKCkgPT4geyBvYnNlcnZlci5uZXh0KGZhbHNlKTsgfSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgICBzdGFibGVTdWIudW5zdWJzY3JpYmUoKTtcbiAgICAgICAgdW5zdGFibGVTdWIudW5zdWJzY3JpYmUoKTtcbiAgICAgIH07XG4gICAgfSk7XG5cbiAgICAodGhpcyBhc3tpc1N0YWJsZTogT2JzZXJ2YWJsZTxib29sZWFuPn0pLmlzU3RhYmxlID1cbiAgICAgICAgbWVyZ2UoaXNDdXJyZW50bHlTdGFibGUsIGlzU3RhYmxlLnBpcGUoc2hhcmUoKSkpO1xuICB9XG5cbiAgLyoqXG4gICAqIEJvb3RzdHJhcCBhIG5ldyBjb21wb25lbnQgYXQgdGhlIHJvb3QgbGV2ZWwgb2YgdGhlIGFwcGxpY2F0aW9uLlxuICAgKlxuICAgKiBAdXNhZ2VOb3Rlc1xuICAgKiAjIyMgQm9vdHN0cmFwIHByb2Nlc3NcbiAgICpcbiAgICogV2hlbiBib290c3RyYXBwaW5nIGEgbmV3IHJvb3QgY29tcG9uZW50IGludG8gYW4gYXBwbGljYXRpb24sIEFuZ3VsYXIgbW91bnRzIHRoZVxuICAgKiBzcGVjaWZpZWQgYXBwbGljYXRpb24gY29tcG9uZW50IG9udG8gRE9NIGVsZW1lbnRzIGlkZW50aWZpZWQgYnkgdGhlIGNvbXBvbmVudFR5cGUnc1xuICAgKiBzZWxlY3RvciBhbmQga2lja3Mgb2ZmIGF1dG9tYXRpYyBjaGFuZ2UgZGV0ZWN0aW9uIHRvIGZpbmlzaCBpbml0aWFsaXppbmcgdGhlIGNvbXBvbmVudC5cbiAgICpcbiAgICogT3B0aW9uYWxseSwgYSBjb21wb25lbnQgY2FuIGJlIG1vdW50ZWQgb250byBhIERPTSBlbGVtZW50IHRoYXQgZG9lcyBub3QgbWF0Y2ggdGhlXG4gICAqIGNvbXBvbmVudFR5cGUncyBzZWxlY3Rvci5cbiAgICpcbiAgICogIyMjIEV4YW1wbGVcbiAgICoge0BleGFtcGxlIGNvcmUvdHMvcGxhdGZvcm0vcGxhdGZvcm0udHMgcmVnaW9uPSdsb25nZm9ybSd9XG4gICAqL1xuICBib290c3RyYXA8Qz4oY29tcG9uZW50T3JGYWN0b3J5OiBDb21wb25lbnRGYWN0b3J5PEM+fFR5cGU8Qz4sIHJvb3RTZWxlY3Rvck9yTm9kZT86IHN0cmluZ3xhbnkpOlxuICAgICAgQ29tcG9uZW50UmVmPEM+IHtcbiAgICBpZiAoIXRoaXMuX2luaXRTdGF0dXMuZG9uZSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgICdDYW5ub3QgYm9vdHN0cmFwIGFzIHRoZXJlIGFyZSBzdGlsbCBhc3luY2hyb25vdXMgaW5pdGlhbGl6ZXJzIHJ1bm5pbmcuIEJvb3RzdHJhcCBjb21wb25lbnRzIGluIHRoZSBgbmdEb0Jvb3RzdHJhcGAgbWV0aG9kIG9mIHRoZSByb290IG1vZHVsZS4nKTtcbiAgICB9XG4gICAgbGV0IGNvbXBvbmVudEZhY3Rvcnk6IENvbXBvbmVudEZhY3Rvcnk8Qz47XG4gICAgaWYgKGNvbXBvbmVudE9yRmFjdG9yeSBpbnN0YW5jZW9mIENvbXBvbmVudEZhY3RvcnkpIHtcbiAgICAgIGNvbXBvbmVudEZhY3RvcnkgPSBjb21wb25lbnRPckZhY3Rvcnk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbXBvbmVudEZhY3RvcnkgPVxuICAgICAgICAgIHRoaXMuX2NvbXBvbmVudEZhY3RvcnlSZXNvbHZlci5yZXNvbHZlQ29tcG9uZW50RmFjdG9yeShjb21wb25lbnRPckZhY3RvcnkpICE7XG4gICAgfVxuICAgIHRoaXMuY29tcG9uZW50VHlwZXMucHVzaChjb21wb25lbnRGYWN0b3J5LmNvbXBvbmVudFR5cGUpO1xuXG4gICAgLy8gQ3JlYXRlIGEgZmFjdG9yeSBhc3NvY2lhdGVkIHdpdGggdGhlIGN1cnJlbnQgbW9kdWxlIGlmIGl0J3Mgbm90IGJvdW5kIHRvIHNvbWUgb3RoZXJcbiAgICBjb25zdCBuZ01vZHVsZSA9IGlzQm91bmRUb01vZHVsZShjb21wb25lbnRGYWN0b3J5KSA/IG51bGwgOiB0aGlzLl9pbmplY3Rvci5nZXQoTmdNb2R1bGVSZWYpO1xuICAgIGNvbnN0IHNlbGVjdG9yT3JOb2RlID0gcm9vdFNlbGVjdG9yT3JOb2RlIHx8IGNvbXBvbmVudEZhY3Rvcnkuc2VsZWN0b3I7XG4gICAgY29uc3QgY29tcFJlZiA9IGNvbXBvbmVudEZhY3RvcnkuY3JlYXRlKEluamVjdG9yLk5VTEwsIFtdLCBzZWxlY3Rvck9yTm9kZSwgbmdNb2R1bGUpO1xuXG4gICAgY29tcFJlZi5vbkRlc3Ryb3koKCkgPT4geyB0aGlzLl91bmxvYWRDb21wb25lbnQoY29tcFJlZik7IH0pO1xuICAgIGNvbnN0IHRlc3RhYmlsaXR5ID0gY29tcFJlZi5pbmplY3Rvci5nZXQoVGVzdGFiaWxpdHksIG51bGwpO1xuICAgIGlmICh0ZXN0YWJpbGl0eSkge1xuICAgICAgY29tcFJlZi5pbmplY3Rvci5nZXQoVGVzdGFiaWxpdHlSZWdpc3RyeSlcbiAgICAgICAgICAucmVnaXN0ZXJBcHBsaWNhdGlvbihjb21wUmVmLmxvY2F0aW9uLm5hdGl2ZUVsZW1lbnQsIHRlc3RhYmlsaXR5KTtcbiAgICB9XG5cbiAgICB0aGlzLl9sb2FkQ29tcG9uZW50KGNvbXBSZWYpO1xuICAgIGlmIChpc0Rldk1vZGUoKSkge1xuICAgICAgdGhpcy5fY29uc29sZS5sb2coXG4gICAgICAgICAgYEFuZ3VsYXIgaXMgcnVubmluZyBpbiB0aGUgZGV2ZWxvcG1lbnQgbW9kZS4gQ2FsbCBlbmFibGVQcm9kTW9kZSgpIHRvIGVuYWJsZSB0aGUgcHJvZHVjdGlvbiBtb2RlLmApO1xuICAgIH1cbiAgICByZXR1cm4gY29tcFJlZjtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbnZva2UgdGhpcyBtZXRob2QgdG8gZXhwbGljaXRseSBwcm9jZXNzIGNoYW5nZSBkZXRlY3Rpb24gYW5kIGl0cyBzaWRlLWVmZmVjdHMuXG4gICAqXG4gICAqIEluIGRldmVsb3BtZW50IG1vZGUsIGB0aWNrKClgIGFsc28gcGVyZm9ybXMgYSBzZWNvbmQgY2hhbmdlIGRldGVjdGlvbiBjeWNsZSB0byBlbnN1cmUgdGhhdCBub1xuICAgKiBmdXJ0aGVyIGNoYW5nZXMgYXJlIGRldGVjdGVkLiBJZiBhZGRpdGlvbmFsIGNoYW5nZXMgYXJlIHBpY2tlZCB1cCBkdXJpbmcgdGhpcyBzZWNvbmQgY3ljbGUsXG4gICAqIGJpbmRpbmdzIGluIHRoZSBhcHAgaGF2ZSBzaWRlLWVmZmVjdHMgdGhhdCBjYW5ub3QgYmUgcmVzb2x2ZWQgaW4gYSBzaW5nbGUgY2hhbmdlIGRldGVjdGlvblxuICAgKiBwYXNzLlxuICAgKiBJbiB0aGlzIGNhc2UsIEFuZ3VsYXIgdGhyb3dzIGFuIGVycm9yLCBzaW5jZSBhbiBBbmd1bGFyIGFwcGxpY2F0aW9uIGNhbiBvbmx5IGhhdmUgb25lIGNoYW5nZVxuICAgKiBkZXRlY3Rpb24gcGFzcyBkdXJpbmcgd2hpY2ggYWxsIGNoYW5nZSBkZXRlY3Rpb24gbXVzdCBjb21wbGV0ZS5cbiAgICovXG4gIHRpY2soKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuX3J1bm5pbmdUaWNrKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0FwcGxpY2F0aW9uUmVmLnRpY2sgaXMgY2FsbGVkIHJlY3Vyc2l2ZWx5Jyk7XG4gICAgfVxuXG4gICAgY29uc3Qgc2NvcGUgPSBBcHBsaWNhdGlvblJlZi5fdGlja1Njb3BlKCk7XG4gICAgdHJ5IHtcbiAgICAgIHRoaXMuX3J1bm5pbmdUaWNrID0gdHJ1ZTtcbiAgICAgIGZvciAobGV0IHZpZXcgb2YgdGhpcy5fdmlld3MpIHtcbiAgICAgICAgdmlldy5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICB9XG4gICAgICBpZiAodGhpcy5fZW5mb3JjZU5vTmV3Q2hhbmdlcykge1xuICAgICAgICBmb3IgKGxldCB2aWV3IG9mIHRoaXMuX3ZpZXdzKSB7XG4gICAgICAgICAgdmlldy5jaGVja05vQ2hhbmdlcygpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgLy8gQXR0ZW50aW9uOiBEb24ndCByZXRocm93IGFzIGl0IGNvdWxkIGNhbmNlbCBzdWJzY3JpcHRpb25zIHRvIE9ic2VydmFibGVzIVxuICAgICAgdGhpcy5fem9uZS5ydW5PdXRzaWRlQW5ndWxhcigoKSA9PiB0aGlzLl9leGNlcHRpb25IYW5kbGVyLmhhbmRsZUVycm9yKGUpKTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgdGhpcy5fcnVubmluZ1RpY2sgPSBmYWxzZTtcbiAgICAgIHd0ZkxlYXZlKHNjb3BlKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQXR0YWNoZXMgYSB2aWV3IHNvIHRoYXQgaXQgd2lsbCBiZSBkaXJ0eSBjaGVja2VkLlxuICAgKiBUaGUgdmlldyB3aWxsIGJlIGF1dG9tYXRpY2FsbHkgZGV0YWNoZWQgd2hlbiBpdCBpcyBkZXN0cm95ZWQuXG4gICAqIFRoaXMgd2lsbCB0aHJvdyBpZiB0aGUgdmlldyBpcyBhbHJlYWR5IGF0dGFjaGVkIHRvIGEgVmlld0NvbnRhaW5lci5cbiAgICovXG4gIGF0dGFjaFZpZXcodmlld1JlZjogVmlld1JlZik6IHZvaWQge1xuICAgIGNvbnN0IHZpZXcgPSAodmlld1JlZiBhcyBJbnRlcm5hbFZpZXdSZWYpO1xuICAgIHRoaXMuX3ZpZXdzLnB1c2godmlldyk7XG4gICAgdmlldy5hdHRhY2hUb0FwcFJlZih0aGlzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZXRhY2hlcyBhIHZpZXcgZnJvbSBkaXJ0eSBjaGVja2luZyBhZ2Fpbi5cbiAgICovXG4gIGRldGFjaFZpZXcodmlld1JlZjogVmlld1JlZik6IHZvaWQge1xuICAgIGNvbnN0IHZpZXcgPSAodmlld1JlZiBhcyBJbnRlcm5hbFZpZXdSZWYpO1xuICAgIHJlbW92ZSh0aGlzLl92aWV3cywgdmlldyk7XG4gICAgdmlldy5kZXRhY2hGcm9tQXBwUmVmKCk7XG4gIH1cblxuICBwcml2YXRlIF9sb2FkQ29tcG9uZW50KGNvbXBvbmVudFJlZjogQ29tcG9uZW50UmVmPGFueT4pOiB2b2lkIHtcbiAgICB0aGlzLmF0dGFjaFZpZXcoY29tcG9uZW50UmVmLmhvc3RWaWV3KTtcbiAgICB0aGlzLnRpY2soKTtcbiAgICB0aGlzLmNvbXBvbmVudHMucHVzaChjb21wb25lbnRSZWYpO1xuICAgIC8vIEdldCB0aGUgbGlzdGVuZXJzIGxhemlseSB0byBwcmV2ZW50IERJIGN5Y2xlcy5cbiAgICBjb25zdCBsaXN0ZW5lcnMgPVxuICAgICAgICB0aGlzLl9pbmplY3Rvci5nZXQoQVBQX0JPT1RTVFJBUF9MSVNURU5FUiwgW10pLmNvbmNhdCh0aGlzLl9ib290c3RyYXBMaXN0ZW5lcnMpO1xuICAgIGxpc3RlbmVycy5mb3JFYWNoKChsaXN0ZW5lcikgPT4gbGlzdGVuZXIoY29tcG9uZW50UmVmKSk7XG4gIH1cblxuICBwcml2YXRlIF91bmxvYWRDb21wb25lbnQoY29tcG9uZW50UmVmOiBDb21wb25lbnRSZWY8YW55Pik6IHZvaWQge1xuICAgIHRoaXMuZGV0YWNoVmlldyhjb21wb25lbnRSZWYuaG9zdFZpZXcpO1xuICAgIHJlbW92ZSh0aGlzLmNvbXBvbmVudHMsIGNvbXBvbmVudFJlZik7XG4gIH1cblxuICAvKiogQGludGVybmFsICovXG4gIG5nT25EZXN0cm95KCkge1xuICAgIC8vIFRPRE8oYWx4aHViKTogRGlzcG9zZSBvZiB0aGUgTmdab25lLlxuICAgIHRoaXMuX3ZpZXdzLnNsaWNlKCkuZm9yRWFjaCgodmlldykgPT4gdmlldy5kZXN0cm95KCkpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIG51bWJlciBvZiBhdHRhY2hlZCB2aWV3cy5cbiAgICovXG4gIGdldCB2aWV3Q291bnQoKSB7IHJldHVybiB0aGlzLl92aWV3cy5sZW5ndGg7IH1cbn1cblxuZnVuY3Rpb24gcmVtb3ZlPFQ+KGxpc3Q6IFRbXSwgZWw6IFQpOiB2b2lkIHtcbiAgY29uc3QgaW5kZXggPSBsaXN0LmluZGV4T2YoZWwpO1xuICBpZiAoaW5kZXggPiAtMSkge1xuICAgIGxpc3Quc3BsaWNlKGluZGV4LCAxKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBfbWVyZ2VBcnJheXMocGFydHM6IGFueVtdW10pOiBhbnlbXSB7XG4gIGNvbnN0IHJlc3VsdDogYW55W10gPSBbXTtcbiAgcGFydHMuZm9yRWFjaCgocGFydCkgPT4gcGFydCAmJiByZXN1bHQucHVzaCguLi5wYXJ0KSk7XG4gIHJldHVybiByZXN1bHQ7XG59XG4iXX0=