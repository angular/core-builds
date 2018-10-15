/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as tslib_1 from "tslib";
import { Observable, merge } from 'rxjs';
import { share } from 'rxjs/operators';
import { ApplicationInitStatus } from './application_init';
import { APP_BOOTSTRAP_LISTENER, PLATFORM_INITIALIZER } from './application_tokens';
import { Console } from './console';
import { Injectable, InjectionToken, Injector } from './di';
import { ErrorHandler } from './error_handler';
import { isDevMode } from './is_dev_mode';
import { CompilerFactory } from './linker/compiler';
import { ComponentFactory } from './linker/component_factory';
import { ComponentFactoryBoundToModule, ComponentFactoryResolver } from './linker/component_factory_resolver';
import { NgModuleRef } from './linker/ng_module_factory';
import { wtfCreateScope, wtfLeave } from './profile/profile';
import { assertNgModuleType } from './render3/assert';
import { NgModuleFactory as R3NgModuleFactory } from './render3/ng_module_ref';
import { Testability, TestabilityRegistry } from './testability/testability';
import { scheduleMicroTask, stringify } from './util';
import { isPromise } from './util/lang';
import { NgZone, NoopNgZone } from './zone/ng_zone';
var _platform;
var compileNgModuleFactory = compileNgModuleFactory__PRE_NGCC__;
function compileNgModuleFactory__PRE_NGCC__(injector, options, moduleType) {
    var compilerFactory = injector.get(CompilerFactory);
    var compiler = compilerFactory.createCompiler([options]);
    return compiler.compileModuleAsync(moduleType);
}
export function compileNgModuleFactory__POST_NGCC__(injector, options, moduleType) {
    ngDevMode && assertNgModuleType(moduleType);
    return Promise.resolve(new R3NgModuleFactory(moduleType));
}
export var ALLOW_MULTIPLE_PLATFORMS = new InjectionToken('AllowMultipleToken');
/**
 * A token for third-party components that can register themselves with NgProbe.
 *
 * @experimental
 */
var NgProbeToken = /** @class */ (function () {
    function NgProbeToken(name, token) {
        this.name = name;
        this.token = token;
    }
    return NgProbeToken;
}());
export { NgProbeToken };
/**
 * Creates a platform.
 * Platforms have to be eagerly created via this function.
 *
 * @experimental APIs related to application bootstrap are currently under review.
 */
export function createPlatform(injector) {
    if (_platform && !_platform.destroyed &&
        !_platform.injector.get(ALLOW_MULTIPLE_PLATFORMS, false)) {
        throw new Error('There can be only one platform. Destroy the previous one to create a new one.');
    }
    _platform = injector.get(PlatformRef);
    var inits = injector.get(PLATFORM_INITIALIZER, null);
    if (inits)
        inits.forEach(function (init) { return init(); });
    return _platform;
}
/**
 * Creates a factory for a platform
 *
 * @experimental APIs related to application bootstrap are currently under review.
 */
export function createPlatformFactory(parentPlatformFactory, name, providers) {
    if (providers === void 0) { providers = []; }
    var desc = "Platform: " + name;
    var marker = new InjectionToken(desc);
    return function (extraProviders) {
        if (extraProviders === void 0) { extraProviders = []; }
        var platform = getPlatform();
        if (!platform || platform.injector.get(ALLOW_MULTIPLE_PLATFORMS, false)) {
            if (parentPlatformFactory) {
                parentPlatformFactory(providers.concat(extraProviders).concat({ provide: marker, useValue: true }));
            }
            else {
                var injectedProviders = providers.concat(extraProviders).concat({ provide: marker, useValue: true });
                createPlatform(Injector.create({ providers: injectedProviders, name: desc }));
            }
        }
        return assertPlatform(marker);
    };
}
/**
 * Checks that there currently is a platform which contains the given token as a provider.
 *
 * @experimental APIs related to application bootstrap are currently under review.
 */
export function assertPlatform(requiredToken) {
    var platform = getPlatform();
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
 * @experimental APIs related to application bootstrap are currently under review.
 */
export function destroyPlatform() {
    if (_platform && !_platform.destroyed) {
        _platform.destroy();
    }
}
/**
 * Returns the current platform.
 *
 * @experimental APIs related to application bootstrap are currently under review.
 */
export function getPlatform() {
    return _platform && !_platform.destroyed ? _platform : null;
}
/**
 * The Angular platform is the entry point for Angular on a web page. Each page
 * has exactly one platform, and services (such as reflection) which are common
 * to every Angular application running on the page are bound in its scope.
 *
 * A page's platform is initialized implicitly when a platform is created via a platform factory
 * (e.g. {@link platformBrowser}), or explicitly by calling the {@link createPlatform} function.
 */
var PlatformRef = /** @class */ (function () {
    /** @internal */
    function PlatformRef(_injector) {
        this._injector = _injector;
        this._modules = [];
        this._destroyListeners = [];
        this._destroyed = false;
    }
    /**
     * Creates an instance of an `@NgModule` for the given platform
     * for offline compilation.
     *
     * @usageNotes
     * ### Simple Example
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
     * @experimental APIs related to application bootstrap are currently under review.
     */
    PlatformRef.prototype.bootstrapModuleFactory = function (moduleFactory, options) {
        var _this = this;
        // Note: We need to create the NgZone _before_ we instantiate the module,
        // as instantiating the module creates some providers eagerly.
        // So we create a mini parent injector that just contains the new NgZone and
        // pass that as parent to the NgModuleFactory.
        var ngZoneOption = options ? options.ngZone : undefined;
        var ngZone = getNgZone(ngZoneOption);
        var providers = [{ provide: NgZone, useValue: ngZone }];
        // Attention: Don't use ApplicationRef.run here,
        // as we want to be sure that all possible constructor calls are inside `ngZone.run`!
        return ngZone.run(function () {
            var ngZoneInjector = Injector.create({ providers: providers, parent: _this.injector, name: moduleFactory.moduleType.name });
            var moduleRef = moduleFactory.create(ngZoneInjector);
            var exceptionHandler = moduleRef.injector.get(ErrorHandler, null);
            if (!exceptionHandler) {
                throw new Error('No ErrorHandler. Is platform module (BrowserModule) included?');
            }
            moduleRef.onDestroy(function () { return remove(_this._modules, moduleRef); });
            ngZone.runOutsideAngular(function () { return ngZone.onError.subscribe({ next: function (error) { exceptionHandler.handleError(error); } }); });
            return _callAndReportToErrorHandler(exceptionHandler, ngZone, function () {
                var initStatus = moduleRef.injector.get(ApplicationInitStatus);
                initStatus.runInitializers();
                return initStatus.donePromise.then(function () {
                    _this._moduleDoBootstrap(moduleRef);
                    return moduleRef;
                });
            });
        });
    };
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
    PlatformRef.prototype.bootstrapModule = function (moduleType, compilerOptions) {
        var _this = this;
        if (compilerOptions === void 0) { compilerOptions = []; }
        var options = optionsReducer({}, compilerOptions);
        return compileNgModuleFactory(this.injector, options, moduleType)
            .then(function (moduleFactory) { return _this.bootstrapModuleFactory(moduleFactory, options); });
    };
    PlatformRef.prototype._moduleDoBootstrap = function (moduleRef) {
        var appRef = moduleRef.injector.get(ApplicationRef);
        if (moduleRef._bootstrapComponents.length > 0) {
            moduleRef._bootstrapComponents.forEach(function (f) { return appRef.bootstrap(f); });
        }
        else if (moduleRef.instance.ngDoBootstrap) {
            moduleRef.instance.ngDoBootstrap(appRef);
        }
        else {
            throw new Error("The module " + stringify(moduleRef.instance.constructor) + " was bootstrapped, but it does not declare \"@NgModule.bootstrap\" components nor a \"ngDoBootstrap\" method. " +
                "Please define one of these.");
        }
        this._modules.push(moduleRef);
    };
    /**
     * Register a listener to be called when the platform is disposed.
     */
    PlatformRef.prototype.onDestroy = function (callback) { this._destroyListeners.push(callback); };
    Object.defineProperty(PlatformRef.prototype, "injector", {
        /**
         * Retrieve the platform {@link Injector}, which is the parent injector for
         * every Angular application on the page and provides singleton providers.
         */
        get: function () { return this._injector; },
        enumerable: true,
        configurable: true
    });
    /**
     * Destroy the Angular platform and all Angular applications on the page.
     */
    PlatformRef.prototype.destroy = function () {
        if (this._destroyed) {
            throw new Error('The platform has already been destroyed!');
        }
        this._modules.slice().forEach(function (module) { return module.destroy(); });
        this._destroyListeners.forEach(function (listener) { return listener(); });
        this._destroyed = true;
    };
    Object.defineProperty(PlatformRef.prototype, "destroyed", {
        get: function () { return this._destroyed; },
        enumerable: true,
        configurable: true
    });
    PlatformRef = tslib_1.__decorate([
        Injectable(),
        tslib_1.__metadata("design:paramtypes", [Injector])
    ], PlatformRef);
    return PlatformRef;
}());
export { PlatformRef };
function getNgZone(ngZoneOption) {
    var ngZone;
    if (ngZoneOption === 'noop') {
        ngZone = new NoopNgZone();
    }
    else {
        ngZone = (ngZoneOption === 'zone.js' ? undefined : ngZoneOption) ||
            new NgZone({ enableLongStackTrace: isDevMode() });
    }
    return ngZone;
}
function _callAndReportToErrorHandler(errorHandler, ngZone, callback) {
    try {
        var result = callback();
        if (isPromise(result)) {
            return result.catch(function (e) {
                ngZone.runOutsideAngular(function () { return errorHandler.handleError(e); });
                // rethrow as the exception handler might not do it
                throw e;
            });
        }
        return result;
    }
    catch (e) {
        ngZone.runOutsideAngular(function () { return errorHandler.handleError(e); });
        // rethrow as the exception handler might not do it
        throw e;
    }
}
function optionsReducer(dst, objs) {
    if (Array.isArray(objs)) {
        dst = objs.reduce(optionsReducer, dst);
    }
    else {
        dst = tslib_1.__assign({}, dst, objs);
    }
    return dst;
}
/**
 * A reference to an Angular application running on a page.
 */
var ApplicationRef = /** @class */ (function () {
    /** @internal */
    function ApplicationRef(_zone, _console, _injector, _exceptionHandler, _componentFactoryResolver, _initStatus) {
        var _this = this;
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
        this._zone.onMicrotaskEmpty.subscribe({ next: function () { _this._zone.run(function () { _this.tick(); }); } });
        var isCurrentlyStable = new Observable(function (observer) {
            _this._stable = _this._zone.isStable && !_this._zone.hasPendingMacrotasks &&
                !_this._zone.hasPendingMicrotasks;
            _this._zone.runOutsideAngular(function () {
                observer.next(_this._stable);
                observer.complete();
            });
        });
        var isStable = new Observable(function (observer) {
            // Create the subscription to onStable outside the Angular Zone so that
            // the callback is run outside the Angular Zone.
            var stableSub;
            _this._zone.runOutsideAngular(function () {
                stableSub = _this._zone.onStable.subscribe(function () {
                    NgZone.assertNotInAngularZone();
                    // Check whether there are no pending macro/micro tasks in the next tick
                    // to allow for NgZone to update the state.
                    scheduleMicroTask(function () {
                        if (!_this._stable && !_this._zone.hasPendingMacrotasks &&
                            !_this._zone.hasPendingMicrotasks) {
                            _this._stable = true;
                            observer.next(true);
                        }
                    });
                });
            });
            var unstableSub = _this._zone.onUnstable.subscribe(function () {
                NgZone.assertInAngularZone();
                if (_this._stable) {
                    _this._stable = false;
                    _this._zone.runOutsideAngular(function () { observer.next(false); });
                }
            });
            return function () {
                stableSub.unsubscribe();
                unstableSub.unsubscribe();
            };
        });
        this.isStable =
            merge(isCurrentlyStable, isStable.pipe(share()));
    }
    ApplicationRef_1 = ApplicationRef;
    /**
     * Bootstrap a new component at the root level of the application.
     *
     * @usageNotes
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
     * {@example core/ts/platform/platform.ts region='longform'}
     */
    ApplicationRef.prototype.bootstrap = function (componentOrFactory, rootSelectorOrNode) {
        var _this = this;
        if (!this._initStatus.done) {
            throw new Error('Cannot bootstrap as there are still asynchronous initializers running. Bootstrap components in the `ngDoBootstrap` method of the root module.');
        }
        var componentFactory;
        if (componentOrFactory instanceof ComponentFactory) {
            componentFactory = componentOrFactory;
        }
        else {
            componentFactory =
                this._componentFactoryResolver.resolveComponentFactory(componentOrFactory);
        }
        this.componentTypes.push(componentFactory.componentType);
        // Create a factory associated with the current module if it's not bound to some other
        var ngModule = componentFactory instanceof ComponentFactoryBoundToModule ?
            null :
            this._injector.get(NgModuleRef);
        var selectorOrNode = rootSelectorOrNode || componentFactory.selector;
        var compRef = componentFactory.create(Injector.NULL, [], selectorOrNode, ngModule);
        compRef.onDestroy(function () { _this._unloadComponent(compRef); });
        var testability = compRef.injector.get(Testability, null);
        if (testability) {
            compRef.injector.get(TestabilityRegistry)
                .registerApplication(compRef.location.nativeElement, testability);
        }
        this._loadComponent(compRef);
        if (isDevMode()) {
            this._console.log("Angular is running in the development mode. Call enableProdMode() to enable the production mode.");
        }
        return compRef;
    };
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
    ApplicationRef.prototype.tick = function () {
        var _this = this;
        if (this._runningTick) {
            throw new Error('ApplicationRef.tick is called recursively');
        }
        var scope = ApplicationRef_1._tickScope();
        try {
            this._runningTick = true;
            this._views.forEach(function (view) { return view.detectChanges(); });
            if (this._enforceNoNewChanges) {
                this._views.forEach(function (view) { return view.checkNoChanges(); });
            }
        }
        catch (e) {
            // Attention: Don't rethrow as it could cancel subscriptions to Observables!
            this._zone.runOutsideAngular(function () { return _this._exceptionHandler.handleError(e); });
        }
        finally {
            this._runningTick = false;
            wtfLeave(scope);
        }
    };
    /**
     * Attaches a view so that it will be dirty checked.
     * The view will be automatically detached when it is destroyed.
     * This will throw if the view is already attached to a ViewContainer.
     */
    ApplicationRef.prototype.attachView = function (viewRef) {
        var view = viewRef;
        this._views.push(view);
        view.attachToAppRef(this);
    };
    /**
     * Detaches a view from dirty checking again.
     */
    ApplicationRef.prototype.detachView = function (viewRef) {
        var view = viewRef;
        remove(this._views, view);
        view.detachFromAppRef();
    };
    ApplicationRef.prototype._loadComponent = function (componentRef) {
        this.attachView(componentRef.hostView);
        this.tick();
        this.components.push(componentRef);
        // Get the listeners lazily to prevent DI cycles.
        var listeners = this._injector.get(APP_BOOTSTRAP_LISTENER, []).concat(this._bootstrapListeners);
        listeners.forEach(function (listener) { return listener(componentRef); });
    };
    ApplicationRef.prototype._unloadComponent = function (componentRef) {
        this.detachView(componentRef.hostView);
        remove(this.components, componentRef);
    };
    /** @internal */
    ApplicationRef.prototype.ngOnDestroy = function () {
        // TODO(alxhub): Dispose of the NgZone.
        this._views.slice().forEach(function (view) { return view.destroy(); });
    };
    Object.defineProperty(ApplicationRef.prototype, "viewCount", {
        /**
         * Returns the number of attached views.
         */
        get: function () { return this._views.length; },
        enumerable: true,
        configurable: true
    });
    var ApplicationRef_1;
    /** @internal */
    ApplicationRef._tickScope = wtfCreateScope('ApplicationRef#tick()');
    ApplicationRef = ApplicationRef_1 = tslib_1.__decorate([
        Injectable(),
        tslib_1.__metadata("design:paramtypes", [NgZone, Console, Injector,
            ErrorHandler,
            ComponentFactoryResolver,
            ApplicationInitStatus])
    ], ApplicationRef);
    return ApplicationRef;
}());
export { ApplicationRef };
function remove(list, el) {
    var index = list.indexOf(el);
    if (index > -1) {
        list.splice(index, 1);
    }
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwbGljYXRpb25fcmVmLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvYXBwbGljYXRpb25fcmVmLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7QUFFSCxPQUFPLEVBQUMsVUFBVSxFQUEwQixLQUFLLEVBQUMsTUFBTSxNQUFNLENBQUM7QUFDL0QsT0FBTyxFQUFDLEtBQUssRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBRXJDLE9BQU8sRUFBQyxxQkFBcUIsRUFBQyxNQUFNLG9CQUFvQixDQUFDO0FBQ3pELE9BQU8sRUFBQyxzQkFBc0IsRUFBRSxvQkFBb0IsRUFBQyxNQUFNLHNCQUFzQixDQUFDO0FBQ2xGLE9BQU8sRUFBQyxPQUFPLEVBQUMsTUFBTSxXQUFXLENBQUM7QUFDbEMsT0FBTyxFQUFDLFVBQVUsRUFBRSxjQUFjLEVBQUUsUUFBUSxFQUFpQixNQUFNLE1BQU0sQ0FBQztBQUMxRSxPQUFPLEVBQUMsWUFBWSxFQUFDLE1BQU0saUJBQWlCLENBQUM7QUFDN0MsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUN4QyxPQUFPLEVBQUMsZUFBZSxFQUFrQixNQUFNLG1CQUFtQixDQUFDO0FBQ25FLE9BQU8sRUFBQyxnQkFBZ0IsRUFBZSxNQUFNLDRCQUE0QixDQUFDO0FBQzFFLE9BQU8sRUFBQyw2QkFBNkIsRUFBRSx3QkFBd0IsRUFBQyxNQUFNLHFDQUFxQyxDQUFDO0FBQzVHLE9BQU8sRUFBdUMsV0FBVyxFQUFDLE1BQU0sNEJBQTRCLENBQUM7QUFFN0YsT0FBTyxFQUFhLGNBQWMsRUFBRSxRQUFRLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUN2RSxPQUFPLEVBQUMsa0JBQWtCLEVBQUMsTUFBTSxrQkFBa0IsQ0FBQztBQUNwRCxPQUFPLEVBQUMsZUFBZSxJQUFJLGlCQUFpQixFQUFDLE1BQU0seUJBQXlCLENBQUM7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LHVDQUF1QztRQUN2QyxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRSxDQUFDLE9BQU8sQ0FBQyxVQUFDLElBQUksSUFBSyxPQUFBLElBQUksQ0FBQyxPQUFPLEVBQUUsRUFBZCxDQUFjLENBQUMsQ0FBQztJQUN4RCxDQUFDO0lBS0Qsc0JBQUkscUNBQVM7UUFIYjs7V0FFRzthQUNILGNBQWtCLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDOzs7T0FBQTs7SUFuTjlDLGdCQUFnQjtJQUNULHlCQUFVLEdBQWUsY0FBYyxDQUFDLHVCQUF1QixDQUFDLENBQUM7SUFGN0QsY0FBYztRQUQxQixVQUFVLEVBQUU7aURBNkJRLE1BQU0sRUFBb0IsT0FBTyxFQUFxQixRQUFRO1lBQ2xELFlBQVk7WUFDSix3QkFBd0I7WUFDdEMscUJBQXFCO09BL0JuQyxjQUFjLENBcU4xQjtJQUFELHFCQUFDO0NBQUEsQUFyTkQsSUFxTkM7U0FyTlksY0FBYztBQXVOM0IsU0FBUyxNQUFNLENBQUksSUFBUyxFQUFFLEVBQUs7SUFDakMsSUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQztJQUMvQixJQUFJLEtBQUssR0FBRyxDQUFDLENBQUMsRUFBRTtRQUNkLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDO0tBQ3ZCO0FBQ0gsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtPYnNlcnZhYmxlLCBPYnNlcnZlciwgU3Vic2NyaXB0aW9uLCBtZXJnZX0gZnJvbSAncnhqcyc7XG5pbXBvcnQge3NoYXJlfSBmcm9tICdyeGpzL29wZXJhdG9ycyc7XG5cbmltcG9ydCB7QXBwbGljYXRpb25Jbml0U3RhdHVzfSBmcm9tICcuL2FwcGxpY2F0aW9uX2luaXQnO1xuaW1wb3J0IHtBUFBfQk9PVFNUUkFQX0xJU1RFTkVSLCBQTEFURk9STV9JTklUSUFMSVpFUn0gZnJvbSAnLi9hcHBsaWNhdGlvbl90b2tlbnMnO1xuaW1wb3J0IHtDb25zb2xlfSBmcm9tICcuL2NvbnNvbGUnO1xuaW1wb3J0IHtJbmplY3RhYmxlLCBJbmplY3Rpb25Ub2tlbiwgSW5qZWN0b3IsIFN0YXRpY1Byb3ZpZGVyfSBmcm9tICcuL2RpJztcbmltcG9ydCB7RXJyb3JIYW5kbGVyfSBmcm9tICcuL2Vycm9yX2hhbmRsZXInO1xuaW1wb3J0IHtpc0Rldk1vZGV9IGZyb20gJy4vaXNfZGV2X21vZGUnO1xuaW1wb3J0IHtDb21waWxlckZhY3RvcnksIENvbXBpbGVyT3B0aW9uc30gZnJvbSAnLi9saW5rZXIvY29tcGlsZXInO1xuaW1wb3J0IHtDb21wb25lbnRGYWN0b3J5LCBDb21wb25lbnRSZWZ9IGZyb20gJy4vbGlua2VyL2NvbXBvbmVudF9mYWN0b3J5JztcbmltcG9ydCB7Q29tcG9uZW50RmFjdG9yeUJvdW5kVG9Nb2R1bGUsIENvbXBvbmVudEZhY3RvcnlSZXNvbHZlcn0gZnJvbSAnLi9saW5rZXIvY29tcG9uZW50X2ZhY3RvcnlfcmVzb2x2ZXInO1xuaW1wb3J0IHtJbnRlcm5hbE5nTW9kdWxlUmVmLCBOZ01vZHVsZUZhY3RvcnksIE5nTW9kdWxlUmVmfSBmcm9tICcuL2xpbmtlci9uZ19tb2R1bGVfZmFjdG9yeSc7XG5pbXBvcnQge0ludGVybmFsVmlld1JlZiwgVmlld1JlZn0gZnJvbSAnLi9saW5rZXIvdmlld19yZWYnO1xuaW1wb3J0IHtXdGZTY29wZUZuLCB3dGZDcmVhdGVTY29wZSwgd3RmTGVhdmV9IGZyb20gJy4vcHJvZmlsZS9wcm9maWxlJztcbmltcG9ydCB7YXNzZXJ0TmdNb2R1bGVUeXBlfSBmcm9tICcuL3JlbmRlcjMvYXNzZXJ0JztcbmltcG9ydCB7TmdNb2R1bGVGYWN0b3J5IGFzIFIzTmdNb2R1bGVGYWN0b3J5fSBmcm9tICcuL3JlbmRlcjMvbmdfbW9kdWxlX3JlZic7XG5pbXBvcnQge1Rlc3RhYmlsaXR5LCBUZXN0YWJpbGl0eVJlZ2lzdHJ5fSBmcm9tICcuL3Rlc3RhYmlsaXR5L3Rlc3RhYmlsaXR5JztcbmltcG9ydCB7VHlwZX0gZnJvbSAnLi90eXBlJztcbmltcG9ydCB7c2NoZWR1bGVNaWNyb1Rhc2ssIHN0cmluZ2lmeX0gZnJvbSAnLi91dGlsJztcbmltcG9ydCB7aXNQcm9taXNlfSBmcm9tICcuL3V0aWwvbGFuZyc7XG5pbXBvcnQge05nWm9uZSwgTm9vcE5nWm9uZX0gZnJvbSAnLi96b25lL25nX3pvbmUnO1xuXG5sZXQgX3BsYXRmb3JtOiBQbGF0Zm9ybVJlZjtcblxubGV0IGNvbXBpbGVOZ01vZHVsZUZhY3Rvcnk6XG4gICAgPE0+KGluamVjdG9yOiBJbmplY3Rvciwgb3B0aW9uczogQ29tcGlsZXJPcHRpb25zLCBtb2R1bGVUeXBlOiBUeXBlPE0+KSA9PlxuICAgICAgICBQcm9taXNlPE5nTW9kdWxlRmFjdG9yeTxNPj4gPSBjb21waWxlTmdNb2R1bGVGYWN0b3J5X19QUkVfTkdDQ19fO1xuXG5mdW5jdGlvbiBjb21waWxlTmdNb2R1bGVGYWN0b3J5X19QUkVfTkdDQ19fPE0+KFxuICAgIGluamVjdG9yOiBJbmplY3Rvciwgb3B0aW9uczogQ29tcGlsZXJPcHRpb25zLFxuICAgIG1vZHVsZVR5cGU6IFR5cGU8TT4pOiBQcm9taXNlPE5nTW9kdWxlRmFjdG9yeTxNPj4ge1xuICBjb25zdCBjb21waWxlckZhY3Rvcnk6IENvbXBpbGVyRmFjdG9yeSA9IGluamVjdG9yLmdldChDb21waWxlckZhY3RvcnkpO1xuICBjb25zdCBjb21waWxlciA9IGNvbXBpbGVyRmFjdG9yeS5jcmVhdGVDb21waWxlcihbb3B0aW9uc10pO1xuICByZXR1cm4gY29tcGlsZXIuY29tcGlsZU1vZHVsZUFzeW5jKG1vZHVsZVR5cGUpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY29tcGlsZU5nTW9kdWxlRmFjdG9yeV9fUE9TVF9OR0NDX188TT4oXG4gICAgaW5qZWN0b3I6IEluamVjdG9yLCBvcHRpb25zOiBDb21waWxlck9wdGlvbnMsXG4gICAgbW9kdWxlVHlwZTogVHlwZTxNPik6IFByb21pc2U8TmdNb2R1bGVGYWN0b3J5PE0+PiB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnROZ01vZHVsZVR5cGUobW9kdWxlVHlwZSk7XG4gIHJldHVybiBQcm9taXNlLnJlc29sdmUobmV3IFIzTmdNb2R1bGVGYWN0b3J5KG1vZHVsZVR5cGUpKTtcbn1cblxuZXhwb3J0IGNvbnN0IEFMTE9XX01VTFRJUExFX1BMQVRGT1JNUyA9IG5ldyBJbmplY3Rpb25Ub2tlbjxib29sZWFuPignQWxsb3dNdWx0aXBsZVRva2VuJyk7XG5cblxuXG4vKipcbiAqIEEgdG9rZW4gZm9yIHRoaXJkLXBhcnR5IGNvbXBvbmVudHMgdGhhdCBjYW4gcmVnaXN0ZXIgdGhlbXNlbHZlcyB3aXRoIE5nUHJvYmUuXG4gKlxuICogQGV4cGVyaW1lbnRhbFxuICovXG5leHBvcnQgY2xhc3MgTmdQcm9iZVRva2VuIHtcbiAgY29uc3RydWN0b3IocHVibGljIG5hbWU6IHN0cmluZywgcHVibGljIHRva2VuOiBhbnkpIHt9XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIHBsYXRmb3JtLlxuICogUGxhdGZvcm1zIGhhdmUgdG8gYmUgZWFnZXJseSBjcmVhdGVkIHZpYSB0aGlzIGZ1bmN0aW9uLlxuICpcbiAqIEBleHBlcmltZW50YWwgQVBJcyByZWxhdGVkIHRvIGFwcGxpY2F0aW9uIGJvb3RzdHJhcCBhcmUgY3VycmVudGx5IHVuZGVyIHJldmlldy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVBsYXRmb3JtKGluamVjdG9yOiBJbmplY3Rvcik6IFBsYXRmb3JtUmVmIHtcbiAgaWYgKF9wbGF0Zm9ybSAmJiAhX3BsYXRmb3JtLmRlc3Ryb3llZCAmJlxuICAgICAgIV9wbGF0Zm9ybS5pbmplY3Rvci5nZXQoQUxMT1dfTVVMVElQTEVfUExBVEZPUk1TLCBmYWxzZSkpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICdUaGVyZSBjYW4gYmUgb25seSBvbmUgcGxhdGZvcm0uIERlc3Ryb3kgdGhlIHByZXZpb3VzIG9uZSB0byBjcmVhdGUgYSBuZXcgb25lLicpO1xuICB9XG4gIF9wbGF0Zm9ybSA9IGluamVjdG9yLmdldChQbGF0Zm9ybVJlZik7XG4gIGNvbnN0IGluaXRzID0gaW5qZWN0b3IuZ2V0KFBMQVRGT1JNX0lOSVRJQUxJWkVSLCBudWxsKTtcbiAgaWYgKGluaXRzKSBpbml0cy5mb3JFYWNoKChpbml0OiBhbnkpID0+IGluaXQoKSk7XG4gIHJldHVybiBfcGxhdGZvcm07XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIGZhY3RvcnkgZm9yIGEgcGxhdGZvcm1cbiAqXG4gKiBAZXhwZXJpbWVudGFsIEFQSXMgcmVsYXRlZCB0byBhcHBsaWNhdGlvbiBib290c3RyYXAgYXJlIGN1cnJlbnRseSB1bmRlciByZXZpZXcuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVQbGF0Zm9ybUZhY3RvcnkoXG4gICAgcGFyZW50UGxhdGZvcm1GYWN0b3J5OiAoKGV4dHJhUHJvdmlkZXJzPzogU3RhdGljUHJvdmlkZXJbXSkgPT4gUGxhdGZvcm1SZWYpIHwgbnVsbCxcbiAgICBuYW1lOiBzdHJpbmcsIHByb3ZpZGVyczogU3RhdGljUHJvdmlkZXJbXSA9IFtdKTogKGV4dHJhUHJvdmlkZXJzPzogU3RhdGljUHJvdmlkZXJbXSkgPT5cbiAgICBQbGF0Zm9ybVJlZiB7XG4gIGNvbnN0IGRlc2MgPSBgUGxhdGZvcm06ICR7bmFtZX1gO1xuICBjb25zdCBtYXJrZXIgPSBuZXcgSW5qZWN0aW9uVG9rZW4oZGVzYyk7XG4gIHJldHVybiAoZXh0cmFQcm92aWRlcnM6IFN0YXRpY1Byb3ZpZGVyW10gPSBbXSkgPT4ge1xuICAgIGxldCBwbGF0Zm9ybSA9IGdldFBsYXRmb3JtKCk7XG4gICAgaWYgKCFwbGF0Zm9ybSB8fCBwbGF0Zm9ybS5pbmplY3Rvci5nZXQoQUxMT1dfTVVMVElQTEVfUExBVEZPUk1TLCBmYWxzZSkpIHtcbiAgICAgIGlmIChwYXJlbnRQbGF0Zm9ybUZhY3RvcnkpIHtcbiAgICAgICAgcGFyZW50UGxhdGZvcm1GYWN0b3J5KFxuICAgICAgICAgICAgcHJvdmlkZXJzLmNvbmNhdChleHRyYVByb3ZpZGVycykuY29uY2F0KHtwcm92aWRlOiBtYXJrZXIsIHVzZVZhbHVlOiB0cnVlfSkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc3QgaW5qZWN0ZWRQcm92aWRlcnM6IFN0YXRpY1Byb3ZpZGVyW10gPVxuICAgICAgICAgICAgcHJvdmlkZXJzLmNvbmNhdChleHRyYVByb3ZpZGVycykuY29uY2F0KHtwcm92aWRlOiBtYXJrZXIsIHVzZVZhbHVlOiB0cnVlfSk7XG4gICAgICAgIGNyZWF0ZVBsYXRmb3JtKEluamVjdG9yLmNyZWF0ZSh7cHJvdmlkZXJzOiBpbmplY3RlZFByb3ZpZGVycywgbmFtZTogZGVzY30pKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGFzc2VydFBsYXRmb3JtKG1hcmtlcik7XG4gIH07XG59XG5cbi8qKlxuICogQ2hlY2tzIHRoYXQgdGhlcmUgY3VycmVudGx5IGlzIGEgcGxhdGZvcm0gd2hpY2ggY29udGFpbnMgdGhlIGdpdmVuIHRva2VuIGFzIGEgcHJvdmlkZXIuXG4gKlxuICogQGV4cGVyaW1lbnRhbCBBUElzIHJlbGF0ZWQgdG8gYXBwbGljYXRpb24gYm9vdHN0cmFwIGFyZSBjdXJyZW50bHkgdW5kZXIgcmV2aWV3LlxuICovXG5leHBvcnQgZnVuY3Rpb24gYXNzZXJ0UGxhdGZvcm0ocmVxdWlyZWRUb2tlbjogYW55KTogUGxhdGZvcm1SZWYge1xuICBjb25zdCBwbGF0Zm9ybSA9IGdldFBsYXRmb3JtKCk7XG5cbiAgaWYgKCFwbGF0Zm9ybSkge1xuICAgIHRocm93IG5ldyBFcnJvcignTm8gcGxhdGZvcm0gZXhpc3RzIScpO1xuICB9XG5cbiAgaWYgKCFwbGF0Zm9ybS5pbmplY3Rvci5nZXQocmVxdWlyZWRUb2tlbiwgbnVsbCkpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICdBIHBsYXRmb3JtIHdpdGggYSBkaWZmZXJlbnQgY29uZmlndXJhdGlvbiBoYXMgYmVlbiBjcmVhdGVkLiBQbGVhc2UgZGVzdHJveSBpdCBmaXJzdC4nKTtcbiAgfVxuXG4gIHJldHVybiBwbGF0Zm9ybTtcbn1cblxuLyoqXG4gKiBEZXN0cm95IHRoZSBleGlzdGluZyBwbGF0Zm9ybS5cbiAqXG4gKiBAZXhwZXJpbWVudGFsIEFQSXMgcmVsYXRlZCB0byBhcHBsaWNhdGlvbiBib290c3RyYXAgYXJlIGN1cnJlbnRseSB1bmRlciByZXZpZXcuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkZXN0cm95UGxhdGZvcm0oKTogdm9pZCB7XG4gIGlmIChfcGxhdGZvcm0gJiYgIV9wbGF0Zm9ybS5kZXN0cm95ZWQpIHtcbiAgICBfcGxhdGZvcm0uZGVzdHJveSgpO1xuICB9XG59XG5cbi8qKlxuICogUmV0dXJucyB0aGUgY3VycmVudCBwbGF0Zm9ybS5cbiAqXG4gKiBAZXhwZXJpbWVudGFsIEFQSXMgcmVsYXRlZCB0byBhcHBsaWNhdGlvbiBib290c3RyYXAgYXJlIGN1cnJlbnRseSB1bmRlciByZXZpZXcuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRQbGF0Zm9ybSgpOiBQbGF0Zm9ybVJlZnxudWxsIHtcbiAgcmV0dXJuIF9wbGF0Zm9ybSAmJiAhX3BsYXRmb3JtLmRlc3Ryb3llZCA/IF9wbGF0Zm9ybSA6IG51bGw7XG59XG5cbi8qKlxuICogUHJvdmlkZXMgYWRkaXRpb25hbCBvcHRpb25zIHRvIHRoZSBib290c3RyYXBpbmcgcHJvY2Vzcy5cbiAqXG4gKlxuICovXG5leHBvcnQgaW50ZXJmYWNlIEJvb3RzdHJhcE9wdGlvbnMge1xuICAvKipcbiAgICogT3B0aW9uYWxseSBzcGVjaWZ5IHdoaWNoIGBOZ1pvbmVgIHNob3VsZCBiZSB1c2VkLlxuICAgKlxuICAgKiAtIFByb3ZpZGUgeW91ciBvd24gYE5nWm9uZWAgaW5zdGFuY2UuXG4gICAqIC0gYHpvbmUuanNgIC0gVXNlIGRlZmF1bHQgYE5nWm9uZWAgd2hpY2ggcmVxdWlyZXMgYFpvbmUuanNgLlxuICAgKiAtIGBub29wYCAtIFVzZSBgTm9vcE5nWm9uZWAgd2hpY2ggZG9lcyBub3RoaW5nLlxuICAgKi9cbiAgbmdab25lPzogTmdab25lfCd6b25lLmpzJ3wnbm9vcCc7XG59XG5cbi8qKlxuICogVGhlIEFuZ3VsYXIgcGxhdGZvcm0gaXMgdGhlIGVudHJ5IHBvaW50IGZvciBBbmd1bGFyIG9uIGEgd2ViIHBhZ2UuIEVhY2ggcGFnZVxuICogaGFzIGV4YWN0bHkgb25lIHBsYXRmb3JtLCBhbmQgc2VydmljZXMgKHN1Y2ggYXMgcmVmbGVjdGlvbikgd2hpY2ggYXJlIGNvbW1vblxuICogdG8gZXZlcnkgQW5ndWxhciBhcHBsaWNhdGlvbiBydW5uaW5nIG9uIHRoZSBwYWdlIGFyZSBib3VuZCBpbiBpdHMgc2NvcGUuXG4gKlxuICogQSBwYWdlJ3MgcGxhdGZvcm0gaXMgaW5pdGlhbGl6ZWQgaW1wbGljaXRseSB3aGVuIGEgcGxhdGZvcm0gaXMgY3JlYXRlZCB2aWEgYSBwbGF0Zm9ybSBmYWN0b3J5XG4gKiAoZS5nLiB7QGxpbmsgcGxhdGZvcm1Ccm93c2VyfSksIG9yIGV4cGxpY2l0bHkgYnkgY2FsbGluZyB0aGUge0BsaW5rIGNyZWF0ZVBsYXRmb3JtfSBmdW5jdGlvbi5cbiAqL1xuQEluamVjdGFibGUoKVxuZXhwb3J0IGNsYXNzIFBsYXRmb3JtUmVmIHtcbiAgcHJpdmF0ZSBfbW9kdWxlczogTmdNb2R1bGVSZWY8YW55PltdID0gW107XG4gIHByaXZhdGUgX2Rlc3Ryb3lMaXN0ZW5lcnM6IEZ1bmN0aW9uW10gPSBbXTtcbiAgcHJpdmF0ZSBfZGVzdHJveWVkOiBib29sZWFuID0gZmFsc2U7XG5cbiAgLyoqIEBpbnRlcm5hbCAqL1xuICBjb25zdHJ1Y3Rvcihwcml2YXRlIF9pbmplY3RvcjogSW5qZWN0b3IpIHt9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYW4gaW5zdGFuY2Ugb2YgYW4gYEBOZ01vZHVsZWAgZm9yIHRoZSBnaXZlbiBwbGF0Zm9ybVxuICAgKiBmb3Igb2ZmbGluZSBjb21waWxhdGlvbi5cbiAgICpcbiAgICogQHVzYWdlTm90ZXNcbiAgICogIyMjIFNpbXBsZSBFeGFtcGxlXG4gICAqXG4gICAqIGBgYHR5cGVzY3JpcHRcbiAgICogbXlfbW9kdWxlLnRzOlxuICAgKlxuICAgKiBATmdNb2R1bGUoe1xuICAgKiAgIGltcG9ydHM6IFtCcm93c2VyTW9kdWxlXVxuICAgKiB9KVxuICAgKiBjbGFzcyBNeU1vZHVsZSB7fVxuICAgKlxuICAgKiBtYWluLnRzOlxuICAgKiBpbXBvcnQge015TW9kdWxlTmdGYWN0b3J5fSBmcm9tICcuL215X21vZHVsZS5uZ2ZhY3RvcnknO1xuICAgKiBpbXBvcnQge3BsYXRmb3JtQnJvd3Nlcn0gZnJvbSAnQGFuZ3VsYXIvcGxhdGZvcm0tYnJvd3Nlcic7XG4gICAqXG4gICAqIGxldCBtb2R1bGVSZWYgPSBwbGF0Zm9ybUJyb3dzZXIoKS5ib290c3RyYXBNb2R1bGVGYWN0b3J5KE15TW9kdWxlTmdGYWN0b3J5KTtcbiAgICogYGBgXG4gICAqXG4gICAqIEBleHBlcmltZW50YWwgQVBJcyByZWxhdGVkIHRvIGFwcGxpY2F0aW9uIGJvb3RzdHJhcCBhcmUgY3VycmVudGx5IHVuZGVyIHJldmlldy5cbiAgICovXG4gIGJvb3RzdHJhcE1vZHVsZUZhY3Rvcnk8TT4obW9kdWxlRmFjdG9yeTogTmdNb2R1bGVGYWN0b3J5PE0+LCBvcHRpb25zPzogQm9vdHN0cmFwT3B0aW9ucyk6XG4gICAgICBQcm9taXNlPE5nTW9kdWxlUmVmPE0+PiB7XG4gICAgLy8gTm90ZTogV2UgbmVlZCB0byBjcmVhdGUgdGhlIE5nWm9uZSBfYmVmb3JlXyB3ZSBpbnN0YW50aWF0ZSB0aGUgbW9kdWxlLFxuICAgIC8vIGFzIGluc3RhbnRpYXRpbmcgdGhlIG1vZHVsZSBjcmVhdGVzIHNvbWUgcHJvdmlkZXJzIGVhZ2VybHkuXG4gICAgLy8gU28gd2UgY3JlYXRlIGEgbWluaSBwYXJlbnQgaW5qZWN0b3IgdGhhdCBqdXN0IGNvbnRhaW5zIHRoZSBuZXcgTmdab25lIGFuZFxuICAgIC8vIHBhc3MgdGhhdCBhcyBwYXJlbnQgdG8gdGhlIE5nTW9kdWxlRmFjdG9yeS5cbiAgICBjb25zdCBuZ1pvbmVPcHRpb24gPSBvcHRpb25zID8gb3B0aW9ucy5uZ1pvbmUgOiB1bmRlZmluZWQ7XG4gICAgY29uc3Qgbmdab25lID0gZ2V0Tmdab25lKG5nWm9uZU9wdGlvbik7XG4gICAgY29uc3QgcHJvdmlkZXJzOiBTdGF0aWNQcm92aWRlcltdID0gW3twcm92aWRlOiBOZ1pvbmUsIHVzZVZhbHVlOiBuZ1pvbmV9XTtcbiAgICAvLyBBdHRlbnRpb246IERvbid0IHVzZSBBcHBsaWNhdGlvblJlZi5ydW4gaGVyZSxcbiAgICAvLyBhcyB3ZSB3YW50IHRvIGJlIHN1cmUgdGhhdCBhbGwgcG9zc2libGUgY29uc3RydWN0b3IgY2FsbHMgYXJlIGluc2lkZSBgbmdab25lLnJ1bmAhXG4gICAgcmV0dXJuIG5nWm9uZS5ydW4oKCkgPT4ge1xuICAgICAgY29uc3Qgbmdab25lSW5qZWN0b3IgPSBJbmplY3Rvci5jcmVhdGUoXG4gICAgICAgICAge3Byb3ZpZGVyczogcHJvdmlkZXJzLCBwYXJlbnQ6IHRoaXMuaW5qZWN0b3IsIG5hbWU6IG1vZHVsZUZhY3RvcnkubW9kdWxlVHlwZS5uYW1lfSk7XG4gICAgICBjb25zdCBtb2R1bGVSZWYgPSA8SW50ZXJuYWxOZ01vZHVsZVJlZjxNPj5tb2R1bGVGYWN0b3J5LmNyZWF0ZShuZ1pvbmVJbmplY3Rvcik7XG4gICAgICBjb25zdCBleGNlcHRpb25IYW5kbGVyOiBFcnJvckhhbmRsZXIgPSBtb2R1bGVSZWYuaW5qZWN0b3IuZ2V0KEVycm9ySGFuZGxlciwgbnVsbCk7XG4gICAgICBpZiAoIWV4Y2VwdGlvbkhhbmRsZXIpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdObyBFcnJvckhhbmRsZXIuIElzIHBsYXRmb3JtIG1vZHVsZSAoQnJvd3Nlck1vZHVsZSkgaW5jbHVkZWQ/Jyk7XG4gICAgICB9XG4gICAgICBtb2R1bGVSZWYub25EZXN0cm95KCgpID0+IHJlbW92ZSh0aGlzLl9tb2R1bGVzLCBtb2R1bGVSZWYpKTtcbiAgICAgIG5nWm9uZSAhLnJ1bk91dHNpZGVBbmd1bGFyKFxuICAgICAgICAgICgpID0+IG5nWm9uZSAhLm9uRXJyb3Iuc3Vic2NyaWJlKFxuICAgICAgICAgICAgICB7bmV4dDogKGVycm9yOiBhbnkpID0+IHsgZXhjZXB0aW9uSGFuZGxlci5oYW5kbGVFcnJvcihlcnJvcik7IH19KSk7XG4gICAgICByZXR1cm4gX2NhbGxBbmRSZXBvcnRUb0Vycm9ySGFuZGxlcihleGNlcHRpb25IYW5kbGVyLCBuZ1pvbmUgISwgKCkgPT4ge1xuICAgICAgICBjb25zdCBpbml0U3RhdHVzOiBBcHBsaWNhdGlvbkluaXRTdGF0dXMgPSBtb2R1bGVSZWYuaW5qZWN0b3IuZ2V0KEFwcGxpY2F0aW9uSW5pdFN0YXR1cyk7XG4gICAgICAgIGluaXRTdGF0dXMucnVuSW5pdGlhbGl6ZXJzKCk7XG4gICAgICAgIHJldHVybiBpbml0U3RhdHVzLmRvbmVQcm9taXNlLnRoZW4oKCkgPT4ge1xuICAgICAgICAgIHRoaXMuX21vZHVsZURvQm9vdHN0cmFwKG1vZHVsZVJlZik7XG4gICAgICAgICAgcmV0dXJuIG1vZHVsZVJlZjtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGFuIGluc3RhbmNlIG9mIGFuIGBATmdNb2R1bGVgIGZvciBhIGdpdmVuIHBsYXRmb3JtIHVzaW5nIHRoZSBnaXZlbiBydW50aW1lIGNvbXBpbGVyLlxuICAgKlxuICAgKiBAdXNhZ2VOb3Rlc1xuICAgKiAjIyMgU2ltcGxlIEV4YW1wbGVcbiAgICpcbiAgICogYGBgdHlwZXNjcmlwdFxuICAgKiBATmdNb2R1bGUoe1xuICAgKiAgIGltcG9ydHM6IFtCcm93c2VyTW9kdWxlXVxuICAgKiB9KVxuICAgKiBjbGFzcyBNeU1vZHVsZSB7fVxuICAgKlxuICAgKiBsZXQgbW9kdWxlUmVmID0gcGxhdGZvcm1Ccm93c2VyKCkuYm9vdHN0cmFwTW9kdWxlKE15TW9kdWxlKTtcbiAgICogYGBgXG4gICAqXG4gICAqL1xuICBib290c3RyYXBNb2R1bGU8TT4oXG4gICAgICBtb2R1bGVUeXBlOiBUeXBlPE0+LCBjb21waWxlck9wdGlvbnM6IChDb21waWxlck9wdGlvbnMmQm9vdHN0cmFwT3B0aW9ucyl8XG4gICAgICBBcnJheTxDb21waWxlck9wdGlvbnMmQm9vdHN0cmFwT3B0aW9ucz4gPSBbXSk6IFByb21pc2U8TmdNb2R1bGVSZWY8TT4+IHtcbiAgICBjb25zdCBvcHRpb25zID0gb3B0aW9uc1JlZHVjZXIoe30sIGNvbXBpbGVyT3B0aW9ucyk7XG4gICAgcmV0dXJuIGNvbXBpbGVOZ01vZHVsZUZhY3RvcnkodGhpcy5pbmplY3Rvciwgb3B0aW9ucywgbW9kdWxlVHlwZSlcbiAgICAgICAgLnRoZW4obW9kdWxlRmFjdG9yeSA9PiB0aGlzLmJvb3RzdHJhcE1vZHVsZUZhY3RvcnkobW9kdWxlRmFjdG9yeSwgb3B0aW9ucykpO1xuICB9XG5cbiAgcHJpdmF0ZSBfbW9kdWxlRG9Cb290c3RyYXAobW9kdWxlUmVmOiBJbnRlcm5hbE5nTW9kdWxlUmVmPGFueT4pOiB2b2lkIHtcbiAgICBjb25zdCBhcHBSZWYgPSBtb2R1bGVSZWYuaW5qZWN0b3IuZ2V0KEFwcGxpY2F0aW9uUmVmKSBhcyBBcHBsaWNhdGlvblJlZjtcbiAgICBpZiAobW9kdWxlUmVmLl9ib290c3RyYXBDb21wb25lbnRzLmxlbmd0aCA+IDApIHtcbiAgICAgIG1vZHVsZVJlZi5fYm9vdHN0cmFwQ29tcG9uZW50cy5mb3JFYWNoKGYgPT4gYXBwUmVmLmJvb3RzdHJhcChmKSk7XG4gICAgfSBlbHNlIGlmIChtb2R1bGVSZWYuaW5zdGFuY2UubmdEb0Jvb3RzdHJhcCkge1xuICAgICAgbW9kdWxlUmVmLmluc3RhbmNlLm5nRG9Cb290c3RyYXAoYXBwUmVmKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgIGBUaGUgbW9kdWxlICR7c3RyaW5naWZ5KG1vZHVsZVJlZi5pbnN0YW5jZS5jb25zdHJ1Y3Rvcil9IHdhcyBib290c3RyYXBwZWQsIGJ1dCBpdCBkb2VzIG5vdCBkZWNsYXJlIFwiQE5nTW9kdWxlLmJvb3RzdHJhcFwiIGNvbXBvbmVudHMgbm9yIGEgXCJuZ0RvQm9vdHN0cmFwXCIgbWV0aG9kLiBgICtcbiAgICAgICAgICBgUGxlYXNlIGRlZmluZSBvbmUgb2YgdGhlc2UuYCk7XG4gICAgfVxuICAgIHRoaXMuX21vZHVsZXMucHVzaChtb2R1bGVSZWYpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlZ2lzdGVyIGEgbGlzdGVuZXIgdG8gYmUgY2FsbGVkIHdoZW4gdGhlIHBsYXRmb3JtIGlzIGRpc3Bvc2VkLlxuICAgKi9cbiAgb25EZXN0cm95KGNhbGxiYWNrOiAoKSA9PiB2b2lkKTogdm9pZCB7IHRoaXMuX2Rlc3Ryb3lMaXN0ZW5lcnMucHVzaChjYWxsYmFjayk7IH1cblxuICAvKipcbiAgICogUmV0cmlldmUgdGhlIHBsYXRmb3JtIHtAbGluayBJbmplY3Rvcn0sIHdoaWNoIGlzIHRoZSBwYXJlbnQgaW5qZWN0b3IgZm9yXG4gICAqIGV2ZXJ5IEFuZ3VsYXIgYXBwbGljYXRpb24gb24gdGhlIHBhZ2UgYW5kIHByb3ZpZGVzIHNpbmdsZXRvbiBwcm92aWRlcnMuXG4gICAqL1xuICBnZXQgaW5qZWN0b3IoKTogSW5qZWN0b3IgeyByZXR1cm4gdGhpcy5faW5qZWN0b3I7IH1cblxuICAvKipcbiAgICogRGVzdHJveSB0aGUgQW5ndWxhciBwbGF0Zm9ybSBhbmQgYWxsIEFuZ3VsYXIgYXBwbGljYXRpb25zIG9uIHRoZSBwYWdlLlxuICAgKi9cbiAgZGVzdHJveSgpIHtcbiAgICBpZiAodGhpcy5fZGVzdHJveWVkKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1RoZSBwbGF0Zm9ybSBoYXMgYWxyZWFkeSBiZWVuIGRlc3Ryb3llZCEnKTtcbiAgICB9XG4gICAgdGhpcy5fbW9kdWxlcy5zbGljZSgpLmZvckVhY2gobW9kdWxlID0+IG1vZHVsZS5kZXN0cm95KCkpO1xuICAgIHRoaXMuX2Rlc3Ryb3lMaXN0ZW5lcnMuZm9yRWFjaChsaXN0ZW5lciA9PiBsaXN0ZW5lcigpKTtcbiAgICB0aGlzLl9kZXN0cm95ZWQgPSB0cnVlO1xuICB9XG5cbiAgZ2V0IGRlc3Ryb3llZCgpIHsgcmV0dXJuIHRoaXMuX2Rlc3Ryb3llZDsgfVxufVxuXG5mdW5jdGlvbiBnZXROZ1pvbmUobmdab25lT3B0aW9uPzogTmdab25lIHwgJ3pvbmUuanMnIHwgJ25vb3AnKTogTmdab25lIHtcbiAgbGV0IG5nWm9uZTogTmdab25lO1xuXG4gIGlmIChuZ1pvbmVPcHRpb24gPT09ICdub29wJykge1xuICAgIG5nWm9uZSA9IG5ldyBOb29wTmdab25lKCk7XG4gIH0gZWxzZSB7XG4gICAgbmdab25lID0gKG5nWm9uZU9wdGlvbiA9PT0gJ3pvbmUuanMnID8gdW5kZWZpbmVkIDogbmdab25lT3B0aW9uKSB8fFxuICAgICAgICBuZXcgTmdab25lKHtlbmFibGVMb25nU3RhY2tUcmFjZTogaXNEZXZNb2RlKCl9KTtcbiAgfVxuICByZXR1cm4gbmdab25lO1xufVxuXG5mdW5jdGlvbiBfY2FsbEFuZFJlcG9ydFRvRXJyb3JIYW5kbGVyKFxuICAgIGVycm9ySGFuZGxlcjogRXJyb3JIYW5kbGVyLCBuZ1pvbmU6IE5nWm9uZSwgY2FsbGJhY2s6ICgpID0+IGFueSk6IGFueSB7XG4gIHRyeSB7XG4gICAgY29uc3QgcmVzdWx0ID0gY2FsbGJhY2soKTtcbiAgICBpZiAoaXNQcm9taXNlKHJlc3VsdCkpIHtcbiAgICAgIHJldHVybiByZXN1bHQuY2F0Y2goKGU6IGFueSkgPT4ge1xuICAgICAgICBuZ1pvbmUucnVuT3V0c2lkZUFuZ3VsYXIoKCkgPT4gZXJyb3JIYW5kbGVyLmhhbmRsZUVycm9yKGUpKTtcbiAgICAgICAgLy8gcmV0aHJvdyBhcyB0aGUgZXhjZXB0aW9uIGhhbmRsZXIgbWlnaHQgbm90IGRvIGl0XG4gICAgICAgIHRocm93IGU7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9IGNhdGNoIChlKSB7XG4gICAgbmdab25lLnJ1bk91dHNpZGVBbmd1bGFyKCgpID0+IGVycm9ySGFuZGxlci5oYW5kbGVFcnJvcihlKSk7XG4gICAgLy8gcmV0aHJvdyBhcyB0aGUgZXhjZXB0aW9uIGhhbmRsZXIgbWlnaHQgbm90IGRvIGl0XG4gICAgdGhyb3cgZTtcbiAgfVxufVxuXG5mdW5jdGlvbiBvcHRpb25zUmVkdWNlcjxUIGV4dGVuZHMgT2JqZWN0Pihkc3Q6IGFueSwgb2JqczogVCB8IFRbXSk6IFQge1xuICBpZiAoQXJyYXkuaXNBcnJheShvYmpzKSkge1xuICAgIGRzdCA9IG9ianMucmVkdWNlKG9wdGlvbnNSZWR1Y2VyLCBkc3QpO1xuICB9IGVsc2Uge1xuICAgIGRzdCA9IHsuLi5kc3QsIC4uLihvYmpzIGFzIGFueSl9O1xuICB9XG4gIHJldHVybiBkc3Q7XG59XG5cbi8qKlxuICogQSByZWZlcmVuY2UgdG8gYW4gQW5ndWxhciBhcHBsaWNhdGlvbiBydW5uaW5nIG9uIGEgcGFnZS5cbiAqL1xuQEluamVjdGFibGUoKVxuZXhwb3J0IGNsYXNzIEFwcGxpY2F0aW9uUmVmIHtcbiAgLyoqIEBpbnRlcm5hbCAqL1xuICBzdGF0aWMgX3RpY2tTY29wZTogV3RmU2NvcGVGbiA9IHd0ZkNyZWF0ZVNjb3BlKCdBcHBsaWNhdGlvblJlZiN0aWNrKCknKTtcbiAgcHJpdmF0ZSBfYm9vdHN0cmFwTGlzdGVuZXJzOiAoKGNvbXBSZWY6IENvbXBvbmVudFJlZjxhbnk+KSA9PiB2b2lkKVtdID0gW107XG4gIHByaXZhdGUgX3ZpZXdzOiBJbnRlcm5hbFZpZXdSZWZbXSA9IFtdO1xuICBwcml2YXRlIF9ydW5uaW5nVGljazogYm9vbGVhbiA9IGZhbHNlO1xuICBwcml2YXRlIF9lbmZvcmNlTm9OZXdDaGFuZ2VzOiBib29sZWFuID0gZmFsc2U7XG4gIHByaXZhdGUgX3N0YWJsZSA9IHRydWU7XG5cbiAgLyoqXG4gICAqIEdldCBhIGxpc3Qgb2YgY29tcG9uZW50IHR5cGVzIHJlZ2lzdGVyZWQgdG8gdGhpcyBhcHBsaWNhdGlvbi5cbiAgICogVGhpcyBsaXN0IGlzIHBvcHVsYXRlZCBldmVuIGJlZm9yZSB0aGUgY29tcG9uZW50IGlzIGNyZWF0ZWQuXG4gICAqL1xuICBwdWJsaWMgcmVhZG9ubHkgY29tcG9uZW50VHlwZXM6IFR5cGU8YW55PltdID0gW107XG5cbiAgLyoqXG4gICAqIEdldCBhIGxpc3Qgb2YgY29tcG9uZW50cyByZWdpc3RlcmVkIHRvIHRoaXMgYXBwbGljYXRpb24uXG4gICAqL1xuICBwdWJsaWMgcmVhZG9ubHkgY29tcG9uZW50czogQ29tcG9uZW50UmVmPGFueT5bXSA9IFtdO1xuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGFuIE9ic2VydmFibGUgdGhhdCBpbmRpY2F0ZXMgd2hlbiB0aGUgYXBwbGljYXRpb24gaXMgc3RhYmxlIG9yIHVuc3RhYmxlLlxuICAgKi9cbiAgLy8gVE9ETyhpc3N1ZS8yNDU3MSk6IHJlbW92ZSAnIScuXG4gIHB1YmxpYyByZWFkb25seSBpc1N0YWJsZSAhOiBPYnNlcnZhYmxlPGJvb2xlYW4+O1xuXG4gIC8qKiBAaW50ZXJuYWwgKi9cbiAgY29uc3RydWN0b3IoXG4gICAgICBwcml2YXRlIF96b25lOiBOZ1pvbmUsIHByaXZhdGUgX2NvbnNvbGU6IENvbnNvbGUsIHByaXZhdGUgX2luamVjdG9yOiBJbmplY3RvcixcbiAgICAgIHByaXZhdGUgX2V4Y2VwdGlvbkhhbmRsZXI6IEVycm9ySGFuZGxlcixcbiAgICAgIHByaXZhdGUgX2NvbXBvbmVudEZhY3RvcnlSZXNvbHZlcjogQ29tcG9uZW50RmFjdG9yeVJlc29sdmVyLFxuICAgICAgcHJpdmF0ZSBfaW5pdFN0YXR1czogQXBwbGljYXRpb25Jbml0U3RhdHVzKSB7XG4gICAgdGhpcy5fZW5mb3JjZU5vTmV3Q2hhbmdlcyA9IGlzRGV2TW9kZSgpO1xuXG4gICAgdGhpcy5fem9uZS5vbk1pY3JvdGFza0VtcHR5LnN1YnNjcmliZShcbiAgICAgICAge25leHQ6ICgpID0+IHsgdGhpcy5fem9uZS5ydW4oKCkgPT4geyB0aGlzLnRpY2soKTsgfSk7IH19KTtcblxuICAgIGNvbnN0IGlzQ3VycmVudGx5U3RhYmxlID0gbmV3IE9ic2VydmFibGU8Ym9vbGVhbj4oKG9ic2VydmVyOiBPYnNlcnZlcjxib29sZWFuPikgPT4ge1xuICAgICAgdGhpcy5fc3RhYmxlID0gdGhpcy5fem9uZS5pc1N0YWJsZSAmJiAhdGhpcy5fem9uZS5oYXNQZW5kaW5nTWFjcm90YXNrcyAmJlxuICAgICAgICAgICF0aGlzLl96b25lLmhhc1BlbmRpbmdNaWNyb3Rhc2tzO1xuICAgICAgdGhpcy5fem9uZS5ydW5PdXRzaWRlQW5ndWxhcigoKSA9PiB7XG4gICAgICAgIG9ic2VydmVyLm5leHQodGhpcy5fc3RhYmxlKTtcbiAgICAgICAgb2JzZXJ2ZXIuY29tcGxldGUoKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgY29uc3QgaXNTdGFibGUgPSBuZXcgT2JzZXJ2YWJsZTxib29sZWFuPigob2JzZXJ2ZXI6IE9ic2VydmVyPGJvb2xlYW4+KSA9PiB7XG4gICAgICAvLyBDcmVhdGUgdGhlIHN1YnNjcmlwdGlvbiB0byBvblN0YWJsZSBvdXRzaWRlIHRoZSBBbmd1bGFyIFpvbmUgc28gdGhhdFxuICAgICAgLy8gdGhlIGNhbGxiYWNrIGlzIHJ1biBvdXRzaWRlIHRoZSBBbmd1bGFyIFpvbmUuXG4gICAgICBsZXQgc3RhYmxlU3ViOiBTdWJzY3JpcHRpb247XG4gICAgICB0aGlzLl96b25lLnJ1bk91dHNpZGVBbmd1bGFyKCgpID0+IHtcbiAgICAgICAgc3RhYmxlU3ViID0gdGhpcy5fem9uZS5vblN0YWJsZS5zdWJzY3JpYmUoKCkgPT4ge1xuICAgICAgICAgIE5nWm9uZS5hc3NlcnROb3RJbkFuZ3VsYXJab25lKCk7XG5cbiAgICAgICAgICAvLyBDaGVjayB3aGV0aGVyIHRoZXJlIGFyZSBubyBwZW5kaW5nIG1hY3JvL21pY3JvIHRhc2tzIGluIHRoZSBuZXh0IHRpY2tcbiAgICAgICAgICAvLyB0byBhbGxvdyBmb3IgTmdab25lIHRvIHVwZGF0ZSB0aGUgc3RhdGUuXG4gICAgICAgICAgc2NoZWR1bGVNaWNyb1Rhc2soKCkgPT4ge1xuICAgICAgICAgICAgaWYgKCF0aGlzLl9zdGFibGUgJiYgIXRoaXMuX3pvbmUuaGFzUGVuZGluZ01hY3JvdGFza3MgJiZcbiAgICAgICAgICAgICAgICAhdGhpcy5fem9uZS5oYXNQZW5kaW5nTWljcm90YXNrcykge1xuICAgICAgICAgICAgICB0aGlzLl9zdGFibGUgPSB0cnVlO1xuICAgICAgICAgICAgICBvYnNlcnZlci5uZXh0KHRydWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuXG4gICAgICBjb25zdCB1bnN0YWJsZVN1YjogU3Vic2NyaXB0aW9uID0gdGhpcy5fem9uZS5vblVuc3RhYmxlLnN1YnNjcmliZSgoKSA9PiB7XG4gICAgICAgIE5nWm9uZS5hc3NlcnRJbkFuZ3VsYXJab25lKCk7XG4gICAgICAgIGlmICh0aGlzLl9zdGFibGUpIHtcbiAgICAgICAgICB0aGlzLl9zdGFibGUgPSBmYWxzZTtcbiAgICAgICAgICB0aGlzLl96b25lLnJ1bk91dHNpZGVBbmd1bGFyKCgpID0+IHsgb2JzZXJ2ZXIubmV4dChmYWxzZSk7IH0pO1xuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgcmV0dXJuICgpID0+IHtcbiAgICAgICAgc3RhYmxlU3ViLnVuc3Vic2NyaWJlKCk7XG4gICAgICAgIHVuc3RhYmxlU3ViLnVuc3Vic2NyaWJlKCk7XG4gICAgICB9O1xuICAgIH0pO1xuXG4gICAgKHRoaXMgYXN7aXNTdGFibGU6IE9ic2VydmFibGU8Ym9vbGVhbj59KS5pc1N0YWJsZSA9XG4gICAgICAgIG1lcmdlKGlzQ3VycmVudGx5U3RhYmxlLCBpc1N0YWJsZS5waXBlKHNoYXJlKCkpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBCb290c3RyYXAgYSBuZXcgY29tcG9uZW50IGF0IHRoZSByb290IGxldmVsIG9mIHRoZSBhcHBsaWNhdGlvbi5cbiAgICpcbiAgICogQHVzYWdlTm90ZXNcbiAgICogIyMjIEJvb3RzdHJhcCBwcm9jZXNzXG4gICAqXG4gICAqIFdoZW4gYm9vdHN0cmFwcGluZyBhIG5ldyByb290IGNvbXBvbmVudCBpbnRvIGFuIGFwcGxpY2F0aW9uLCBBbmd1bGFyIG1vdW50cyB0aGVcbiAgICogc3BlY2lmaWVkIGFwcGxpY2F0aW9uIGNvbXBvbmVudCBvbnRvIERPTSBlbGVtZW50cyBpZGVudGlmaWVkIGJ5IHRoZSBjb21wb25lbnRUeXBlJ3NcbiAgICogc2VsZWN0b3IgYW5kIGtpY2tzIG9mZiBhdXRvbWF0aWMgY2hhbmdlIGRldGVjdGlvbiB0byBmaW5pc2ggaW5pdGlhbGl6aW5nIHRoZSBjb21wb25lbnQuXG4gICAqXG4gICAqIE9wdGlvbmFsbHksIGEgY29tcG9uZW50IGNhbiBiZSBtb3VudGVkIG9udG8gYSBET00gZWxlbWVudCB0aGF0IGRvZXMgbm90IG1hdGNoIHRoZVxuICAgKiBjb21wb25lbnRUeXBlJ3Mgc2VsZWN0b3IuXG4gICAqXG4gICAqICMjIyBFeGFtcGxlXG4gICAqIHtAZXhhbXBsZSBjb3JlL3RzL3BsYXRmb3JtL3BsYXRmb3JtLnRzIHJlZ2lvbj0nbG9uZ2Zvcm0nfVxuICAgKi9cbiAgYm9vdHN0cmFwPEM+KGNvbXBvbmVudE9yRmFjdG9yeTogQ29tcG9uZW50RmFjdG9yeTxDPnxUeXBlPEM+LCByb290U2VsZWN0b3JPck5vZGU/OiBzdHJpbmd8YW55KTpcbiAgICAgIENvbXBvbmVudFJlZjxDPiB7XG4gICAgaWYgKCF0aGlzLl9pbml0U3RhdHVzLmRvbmUpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICAnQ2Fubm90IGJvb3RzdHJhcCBhcyB0aGVyZSBhcmUgc3RpbGwgYXN5bmNocm9ub3VzIGluaXRpYWxpemVycyBydW5uaW5nLiBCb290c3RyYXAgY29tcG9uZW50cyBpbiB0aGUgYG5nRG9Cb290c3RyYXBgIG1ldGhvZCBvZiB0aGUgcm9vdCBtb2R1bGUuJyk7XG4gICAgfVxuICAgIGxldCBjb21wb25lbnRGYWN0b3J5OiBDb21wb25lbnRGYWN0b3J5PEM+O1xuICAgIGlmIChjb21wb25lbnRPckZhY3RvcnkgaW5zdGFuY2VvZiBDb21wb25lbnRGYWN0b3J5KSB7XG4gICAgICBjb21wb25lbnRGYWN0b3J5ID0gY29tcG9uZW50T3JGYWN0b3J5O1xuICAgIH0gZWxzZSB7XG4gICAgICBjb21wb25lbnRGYWN0b3J5ID1cbiAgICAgICAgICB0aGlzLl9jb21wb25lbnRGYWN0b3J5UmVzb2x2ZXIucmVzb2x2ZUNvbXBvbmVudEZhY3RvcnkoY29tcG9uZW50T3JGYWN0b3J5KSAhO1xuICAgIH1cbiAgICB0aGlzLmNvbXBvbmVudFR5cGVzLnB1c2goY29tcG9uZW50RmFjdG9yeS5jb21wb25lbnRUeXBlKTtcblxuICAgIC8vIENyZWF0ZSBhIGZhY3RvcnkgYXNzb2NpYXRlZCB3aXRoIHRoZSBjdXJyZW50IG1vZHVsZSBpZiBpdCdzIG5vdCBib3VuZCB0byBzb21lIG90aGVyXG4gICAgY29uc3QgbmdNb2R1bGUgPSBjb21wb25lbnRGYWN0b3J5IGluc3RhbmNlb2YgQ29tcG9uZW50RmFjdG9yeUJvdW5kVG9Nb2R1bGUgP1xuICAgICAgICBudWxsIDpcbiAgICAgICAgdGhpcy5faW5qZWN0b3IuZ2V0KE5nTW9kdWxlUmVmKTtcbiAgICBjb25zdCBzZWxlY3Rvck9yTm9kZSA9IHJvb3RTZWxlY3Rvck9yTm9kZSB8fCBjb21wb25lbnRGYWN0b3J5LnNlbGVjdG9yO1xuICAgIGNvbnN0IGNvbXBSZWYgPSBjb21wb25lbnRGYWN0b3J5LmNyZWF0ZShJbmplY3Rvci5OVUxMLCBbXSwgc2VsZWN0b3JPck5vZGUsIG5nTW9kdWxlKTtcblxuICAgIGNvbXBSZWYub25EZXN0cm95KCgpID0+IHsgdGhpcy5fdW5sb2FkQ29tcG9uZW50KGNvbXBSZWYpOyB9KTtcbiAgICBjb25zdCB0ZXN0YWJpbGl0eSA9IGNvbXBSZWYuaW5qZWN0b3IuZ2V0KFRlc3RhYmlsaXR5LCBudWxsKTtcbiAgICBpZiAodGVzdGFiaWxpdHkpIHtcbiAgICAgIGNvbXBSZWYuaW5qZWN0b3IuZ2V0KFRlc3RhYmlsaXR5UmVnaXN0cnkpXG4gICAgICAgICAgLnJlZ2lzdGVyQXBwbGljYXRpb24oY29tcFJlZi5sb2NhdGlvbi5uYXRpdmVFbGVtZW50LCB0ZXN0YWJpbGl0eSk7XG4gICAgfVxuXG4gICAgdGhpcy5fbG9hZENvbXBvbmVudChjb21wUmVmKTtcbiAgICBpZiAoaXNEZXZNb2RlKCkpIHtcbiAgICAgIHRoaXMuX2NvbnNvbGUubG9nKFxuICAgICAgICAgIGBBbmd1bGFyIGlzIHJ1bm5pbmcgaW4gdGhlIGRldmVsb3BtZW50IG1vZGUuIENhbGwgZW5hYmxlUHJvZE1vZGUoKSB0byBlbmFibGUgdGhlIHByb2R1Y3Rpb24gbW9kZS5gKTtcbiAgICB9XG4gICAgcmV0dXJuIGNvbXBSZWY7XG4gIH1cblxuICAvKipcbiAgICogSW52b2tlIHRoaXMgbWV0aG9kIHRvIGV4cGxpY2l0bHkgcHJvY2VzcyBjaGFuZ2UgZGV0ZWN0aW9uIGFuZCBpdHMgc2lkZS1lZmZlY3RzLlxuICAgKlxuICAgKiBJbiBkZXZlbG9wbWVudCBtb2RlLCBgdGljaygpYCBhbHNvIHBlcmZvcm1zIGEgc2Vjb25kIGNoYW5nZSBkZXRlY3Rpb24gY3ljbGUgdG8gZW5zdXJlIHRoYXQgbm9cbiAgICogZnVydGhlciBjaGFuZ2VzIGFyZSBkZXRlY3RlZC4gSWYgYWRkaXRpb25hbCBjaGFuZ2VzIGFyZSBwaWNrZWQgdXAgZHVyaW5nIHRoaXMgc2Vjb25kIGN5Y2xlLFxuICAgKiBiaW5kaW5ncyBpbiB0aGUgYXBwIGhhdmUgc2lkZS1lZmZlY3RzIHRoYXQgY2Fubm90IGJlIHJlc29sdmVkIGluIGEgc2luZ2xlIGNoYW5nZSBkZXRlY3Rpb25cbiAgICogcGFzcy5cbiAgICogSW4gdGhpcyBjYXNlLCBBbmd1bGFyIHRocm93cyBhbiBlcnJvciwgc2luY2UgYW4gQW5ndWxhciBhcHBsaWNhdGlvbiBjYW4gb25seSBoYXZlIG9uZSBjaGFuZ2VcbiAgICogZGV0ZWN0aW9uIHBhc3MgZHVyaW5nIHdoaWNoIGFsbCBjaGFuZ2UgZGV0ZWN0aW9uIG11c3QgY29tcGxldGUuXG4gICAqL1xuICB0aWNrKCk6IHZvaWQge1xuICAgIGlmICh0aGlzLl9ydW5uaW5nVGljaykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdBcHBsaWNhdGlvblJlZi50aWNrIGlzIGNhbGxlZCByZWN1cnNpdmVseScpO1xuICAgIH1cblxuICAgIGNvbnN0IHNjb3BlID0gQXBwbGljYXRpb25SZWYuX3RpY2tTY29wZSgpO1xuICAgIHRyeSB7XG4gICAgICB0aGlzLl9ydW5uaW5nVGljayA9IHRydWU7XG4gICAgICB0aGlzLl92aWV3cy5mb3JFYWNoKCh2aWV3KSA9PiB2aWV3LmRldGVjdENoYW5nZXMoKSk7XG4gICAgICBpZiAodGhpcy5fZW5mb3JjZU5vTmV3Q2hhbmdlcykge1xuICAgICAgICB0aGlzLl92aWV3cy5mb3JFYWNoKCh2aWV3KSA9PiB2aWV3LmNoZWNrTm9DaGFuZ2VzKCkpO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIC8vIEF0dGVudGlvbjogRG9uJ3QgcmV0aHJvdyBhcyBpdCBjb3VsZCBjYW5jZWwgc3Vic2NyaXB0aW9ucyB0byBPYnNlcnZhYmxlcyFcbiAgICAgIHRoaXMuX3pvbmUucnVuT3V0c2lkZUFuZ3VsYXIoKCkgPT4gdGhpcy5fZXhjZXB0aW9uSGFuZGxlci5oYW5kbGVFcnJvcihlKSk7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIHRoaXMuX3J1bm5pbmdUaWNrID0gZmFsc2U7XG4gICAgICB3dGZMZWF2ZShzY29wZSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEF0dGFjaGVzIGEgdmlldyBzbyB0aGF0IGl0IHdpbGwgYmUgZGlydHkgY2hlY2tlZC5cbiAgICogVGhlIHZpZXcgd2lsbCBiZSBhdXRvbWF0aWNhbGx5IGRldGFjaGVkIHdoZW4gaXQgaXMgZGVzdHJveWVkLlxuICAgKiBUaGlzIHdpbGwgdGhyb3cgaWYgdGhlIHZpZXcgaXMgYWxyZWFkeSBhdHRhY2hlZCB0byBhIFZpZXdDb250YWluZXIuXG4gICAqL1xuICBhdHRhY2hWaWV3KHZpZXdSZWY6IFZpZXdSZWYpOiB2b2lkIHtcbiAgICBjb25zdCB2aWV3ID0gKHZpZXdSZWYgYXMgSW50ZXJuYWxWaWV3UmVmKTtcbiAgICB0aGlzLl92aWV3cy5wdXNoKHZpZXcpO1xuICAgIHZpZXcuYXR0YWNoVG9BcHBSZWYodGhpcyk7XG4gIH1cblxuICAvKipcbiAgICogRGV0YWNoZXMgYSB2aWV3IGZyb20gZGlydHkgY2hlY2tpbmcgYWdhaW4uXG4gICAqL1xuICBkZXRhY2hWaWV3KHZpZXdSZWY6IFZpZXdSZWYpOiB2b2lkIHtcbiAgICBjb25zdCB2aWV3ID0gKHZpZXdSZWYgYXMgSW50ZXJuYWxWaWV3UmVmKTtcbiAgICByZW1vdmUodGhpcy5fdmlld3MsIHZpZXcpO1xuICAgIHZpZXcuZGV0YWNoRnJvbUFwcFJlZigpO1xuICB9XG5cbiAgcHJpdmF0ZSBfbG9hZENvbXBvbmVudChjb21wb25lbnRSZWY6IENvbXBvbmVudFJlZjxhbnk+KTogdm9pZCB7XG4gICAgdGhpcy5hdHRhY2hWaWV3KGNvbXBvbmVudFJlZi5ob3N0Vmlldyk7XG4gICAgdGhpcy50aWNrKCk7XG4gICAgdGhpcy5jb21wb25lbnRzLnB1c2goY29tcG9uZW50UmVmKTtcbiAgICAvLyBHZXQgdGhlIGxpc3RlbmVycyBsYXppbHkgdG8gcHJldmVudCBESSBjeWNsZXMuXG4gICAgY29uc3QgbGlzdGVuZXJzID1cbiAgICAgICAgdGhpcy5faW5qZWN0b3IuZ2V0KEFQUF9CT09UU1RSQVBfTElTVEVORVIsIFtdKS5jb25jYXQodGhpcy5fYm9vdHN0cmFwTGlzdGVuZXJzKTtcbiAgICBsaXN0ZW5lcnMuZm9yRWFjaCgobGlzdGVuZXIpID0+IGxpc3RlbmVyKGNvbXBvbmVudFJlZikpO1xuICB9XG5cbiAgcHJpdmF0ZSBfdW5sb2FkQ29tcG9uZW50KGNvbXBvbmVudFJlZjogQ29tcG9uZW50UmVmPGFueT4pOiB2b2lkIHtcbiAgICB0aGlzLmRldGFjaFZpZXcoY29tcG9uZW50UmVmLmhvc3RWaWV3KTtcbiAgICByZW1vdmUodGhpcy5jb21wb25lbnRzLCBjb21wb25lbnRSZWYpO1xuICB9XG5cbiAgLyoqIEBpbnRlcm5hbCAqL1xuICBuZ09uRGVzdHJveSgpIHtcbiAgICAvLyBUT0RPKGFseGh1Yik6IERpc3Bvc2Ugb2YgdGhlIE5nWm9uZS5cbiAgICB0aGlzLl92aWV3cy5zbGljZSgpLmZvckVhY2goKHZpZXcpID0+IHZpZXcuZGVzdHJveSgpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBudW1iZXIgb2YgYXR0YWNoZWQgdmlld3MuXG4gICAqL1xuICBnZXQgdmlld0NvdW50KCkgeyByZXR1cm4gdGhpcy5fdmlld3MubGVuZ3RoOyB9XG59XG5cbmZ1bmN0aW9uIHJlbW92ZTxUPihsaXN0OiBUW10sIGVsOiBUKTogdm9pZCB7XG4gIGNvbnN0IGluZGV4ID0gbGlzdC5pbmRleE9mKGVsKTtcbiAgaWYgKGluZGV4ID4gLTEpIHtcbiAgICBsaXN0LnNwbGljZShpbmRleCwgMSk7XG4gIH1cbn1cbiJdfQ==