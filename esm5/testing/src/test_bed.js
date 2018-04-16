/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ApplicationInitStatus, Component, InjectionToken, Injector, NgModule, NgZone, Optional, SkipSelf, ɵAPP_ROOT as APP_ROOT, ɵclearOverrides as clearOverrides, ɵoverrideComponentView as overrideComponentView, ɵoverrideProvider as overrideProvider, ɵstringify as stringify } from '@angular/core';
import { AsyncTestCompleter } from './async_test_completer';
import { ComponentFixture } from './component_fixture';
import { TestingCompilerFactory } from './test_compiler';
var UNDEFINED = new Object();
/**
 * An abstract class for inserting the root test component element in a platform independent way.
 *
 * @experimental
 */
var /**
 * An abstract class for inserting the root test component element in a platform independent way.
 *
 * @experimental
 */
TestComponentRenderer = /** @class */ (function () {
    function TestComponentRenderer() {
    }
    TestComponentRenderer.prototype.insertRootElement = function (rootElementId) { };
    return TestComponentRenderer;
}());
/**
 * An abstract class for inserting the root test component element in a platform independent way.
 *
 * @experimental
 */
export { TestComponentRenderer };
var _nextRootElementId = 0;
/**
 * @experimental
 */
export var ComponentFixtureAutoDetect = new InjectionToken('ComponentFixtureAutoDetect');
/**
 * @experimental
 */
export var ComponentFixtureNoNgZone = new InjectionToken('ComponentFixtureNoNgZone');
/**
 * @description
 * Configures and initializes environment for unit testing and provides methods for
 * creating components and services in unit tests.
 *
 * TestBed is the primary api for writing unit tests for Angular applications and libraries.
 *
 *
 */
var /**
 * @description
 * Configures and initializes environment for unit testing and provides methods for
 * creating components and services in unit tests.
 *
 * TestBed is the primary api for writing unit tests for Angular applications and libraries.
 *
 *
 */
TestBed = /** @class */ (function () {
    function TestBed() {
        this._instantiated = false;
        this._compiler = null;
        this._moduleRef = null;
        this._moduleFactory = null;
        this._compilerOptions = [];
        this._moduleOverrides = [];
        this._componentOverrides = [];
        this._directiveOverrides = [];
        this._pipeOverrides = [];
        this._providers = [];
        this._declarations = [];
        this._imports = [];
        this._schemas = [];
        this._activeFixtures = [];
        this._testEnvAotSummaries = function () { return []; };
        this._aotSummaries = [];
        this._templateOverrides = [];
        this._isRoot = true;
        this._rootProviderOverrides = [];
        this.platform = null;
        this.ngModule = null;
    }
    /**
     * Initialize the environment for testing with a compiler factory, a PlatformRef, and an
     * angular module. These are common to every test in the suite.
     *
     * This may only be called once, to set up the common providers for the current test
     * suite on the current platform. If you absolutely need to change the providers,
     * first use `resetTestEnvironment`.
     *
     * Test modules and platforms for individual platforms are available from
     * '@angular/<platform_name>/testing'.
     *
     * @experimental
     */
    /**
       * Initialize the environment for testing with a compiler factory, a PlatformRef, and an
       * angular module. These are common to every test in the suite.
       *
       * This may only be called once, to set up the common providers for the current test
       * suite on the current platform. If you absolutely need to change the providers,
       * first use `resetTestEnvironment`.
       *
       * Test modules and platforms for individual platforms are available from
       * '@angular/<platform_name>/testing'.
       *
       * @experimental
       */
    TestBed.initTestEnvironment = /**
       * Initialize the environment for testing with a compiler factory, a PlatformRef, and an
       * angular module. These are common to every test in the suite.
       *
       * This may only be called once, to set up the common providers for the current test
       * suite on the current platform. If you absolutely need to change the providers,
       * first use `resetTestEnvironment`.
       *
       * Test modules and platforms for individual platforms are available from
       * '@angular/<platform_name>/testing'.
       *
       * @experimental
       */
    function (ngModule, platform, aotSummaries) {
        var testBed = getTestBed();
        testBed.initTestEnvironment(ngModule, platform, aotSummaries);
        return testBed;
    };
    /**
     * Reset the providers for the test injector.
     *
     * @experimental
     */
    /**
       * Reset the providers for the test injector.
       *
       * @experimental
       */
    TestBed.resetTestEnvironment = /**
       * Reset the providers for the test injector.
       *
       * @experimental
       */
    function () { getTestBed().resetTestEnvironment(); };
    TestBed.resetTestingModule = function () {
        getTestBed().resetTestingModule();
        return TestBed;
    };
    /**
     * Allows overriding default compiler providers and settings
     * which are defined in test_injector.js
     */
    /**
       * Allows overriding default compiler providers and settings
       * which are defined in test_injector.js
       */
    TestBed.configureCompiler = /**
       * Allows overriding default compiler providers and settings
       * which are defined in test_injector.js
       */
    function (config) {
        getTestBed().configureCompiler(config);
        return TestBed;
    };
    /**
     * Allows overriding default providers, directives, pipes, modules of the test injector,
     * which are defined in test_injector.js
     */
    /**
       * Allows overriding default providers, directives, pipes, modules of the test injector,
       * which are defined in test_injector.js
       */
    TestBed.configureTestingModule = /**
       * Allows overriding default providers, directives, pipes, modules of the test injector,
       * which are defined in test_injector.js
       */
    function (moduleDef) {
        getTestBed().configureTestingModule(moduleDef);
        return TestBed;
    };
    /**
     * Compile components with a `templateUrl` for the test's NgModule.
     * It is necessary to call this function
     * as fetching urls is asynchronous.
     */
    /**
       * Compile components with a `templateUrl` for the test's NgModule.
       * It is necessary to call this function
       * as fetching urls is asynchronous.
       */
    TestBed.compileComponents = /**
       * Compile components with a `templateUrl` for the test's NgModule.
       * It is necessary to call this function
       * as fetching urls is asynchronous.
       */
    function () { return getTestBed().compileComponents(); };
    TestBed.overrideModule = function (ngModule, override) {
        getTestBed().overrideModule(ngModule, override);
        return TestBed;
    };
    TestBed.overrideComponent = function (component, override) {
        getTestBed().overrideComponent(component, override);
        return TestBed;
    };
    TestBed.overrideDirective = function (directive, override) {
        getTestBed().overrideDirective(directive, override);
        return TestBed;
    };
    TestBed.overridePipe = function (pipe, override) {
        getTestBed().overridePipe(pipe, override);
        return TestBed;
    };
    TestBed.overrideTemplate = function (component, template) {
        getTestBed().overrideComponent(component, { set: { template: template, templateUrl: (null) } });
        return TestBed;
    };
    /**
     * Overrides the template of the given component, compiling the template
     * in the context of the TestingModule.
     *
     * Note: This works for JIT and AOTed components as well.
     */
    /**
       * Overrides the template of the given component, compiling the template
       * in the context of the TestingModule.
       *
       * Note: This works for JIT and AOTed components as well.
       */
    TestBed.overrideTemplateUsingTestingModule = /**
       * Overrides the template of the given component, compiling the template
       * in the context of the TestingModule.
       *
       * Note: This works for JIT and AOTed components as well.
       */
    function (component, template) {
        getTestBed().overrideTemplateUsingTestingModule(component, template);
        return TestBed;
    };
    TestBed.overrideProvider = function (token, provider) {
        getTestBed().overrideProvider(token, provider);
        return TestBed;
    };
    TestBed.deprecatedOverrideProvider = function (token, provider) {
        getTestBed().deprecatedOverrideProvider(token, provider);
        return TestBed;
    };
    TestBed.get = function (token, notFoundValue) {
        if (notFoundValue === void 0) { notFoundValue = Injector.THROW_IF_NOT_FOUND; }
        return getTestBed().get(token, notFoundValue);
    };
    TestBed.createComponent = function (component) {
        return getTestBed().createComponent(component);
    };
    /**
     * Initialize the environment for testing with a compiler factory, a PlatformRef, and an
     * angular module. These are common to every test in the suite.
     *
     * This may only be called once, to set up the common providers for the current test
     * suite on the current platform. If you absolutely need to change the providers,
     * first use `resetTestEnvironment`.
     *
     * Test modules and platforms for individual platforms are available from
     * '@angular/<platform_name>/testing'.
     *
     * @experimental
     */
    /**
       * Initialize the environment for testing with a compiler factory, a PlatformRef, and an
       * angular module. These are common to every test in the suite.
       *
       * This may only be called once, to set up the common providers for the current test
       * suite on the current platform. If you absolutely need to change the providers,
       * first use `resetTestEnvironment`.
       *
       * Test modules and platforms for individual platforms are available from
       * '@angular/<platform_name>/testing'.
       *
       * @experimental
       */
    TestBed.prototype.initTestEnvironment = /**
       * Initialize the environment for testing with a compiler factory, a PlatformRef, and an
       * angular module. These are common to every test in the suite.
       *
       * This may only be called once, to set up the common providers for the current test
       * suite on the current platform. If you absolutely need to change the providers,
       * first use `resetTestEnvironment`.
       *
       * Test modules and platforms for individual platforms are available from
       * '@angular/<platform_name>/testing'.
       *
       * @experimental
       */
    function (ngModule, platform, aotSummaries) {
        if (this.platform || this.ngModule) {
            throw new Error('Cannot set base providers because it has already been called');
        }
        this.platform = platform;
        this.ngModule = ngModule;
        if (aotSummaries) {
            this._testEnvAotSummaries = aotSummaries;
        }
    };
    /**
     * Reset the providers for the test injector.
     *
     * @experimental
     */
    /**
       * Reset the providers for the test injector.
       *
       * @experimental
       */
    TestBed.prototype.resetTestEnvironment = /**
       * Reset the providers for the test injector.
       *
       * @experimental
       */
    function () {
        this.resetTestingModule();
        this.platform = (null);
        this.ngModule = (null);
        this._testEnvAotSummaries = function () { return []; };
    };
    TestBed.prototype.resetTestingModule = function () {
        clearOverrides();
        this._aotSummaries = [];
        this._templateOverrides = [];
        this._compiler = (null);
        this._moduleOverrides = [];
        this._componentOverrides = [];
        this._directiveOverrides = [];
        this._pipeOverrides = [];
        this._isRoot = true;
        this._rootProviderOverrides = [];
        this._moduleRef = (null);
        this._moduleFactory = (null);
        this._compilerOptions = [];
        this._providers = [];
        this._declarations = [];
        this._imports = [];
        this._schemas = [];
        this._instantiated = false;
        this._activeFixtures.forEach(function (fixture) {
            try {
                fixture.destroy();
            }
            catch (e) {
                console.error('Error during cleanup of component', {
                    component: fixture.componentInstance,
                    stacktrace: e,
                });
            }
        });
        this._activeFixtures = [];
    };
    TestBed.prototype.configureCompiler = function (config) {
        this._assertNotInstantiated('TestBed.configureCompiler', 'configure the compiler');
        this._compilerOptions.push(config);
    };
    TestBed.prototype.configureTestingModule = function (moduleDef) {
        this._assertNotInstantiated('TestBed.configureTestingModule', 'configure the test module');
        if (moduleDef.providers) {
            (_a = this._providers).push.apply(_a, moduleDef.providers);
        }
        if (moduleDef.declarations) {
            (_b = this._declarations).push.apply(_b, moduleDef.declarations);
        }
        if (moduleDef.imports) {
            (_c = this._imports).push.apply(_c, moduleDef.imports);
        }
        if (moduleDef.schemas) {
            (_d = this._schemas).push.apply(_d, moduleDef.schemas);
        }
        if (moduleDef.aotSummaries) {
            this._aotSummaries.push(moduleDef.aotSummaries);
        }
        var _a, _b, _c, _d;
    };
    TestBed.prototype.compileComponents = function () {
        var _this = this;
        if (this._moduleFactory || this._instantiated) {
            return Promise.resolve(null);
        }
        var moduleType = this._createCompilerAndModule();
        return this._compiler.compileModuleAndAllComponentsAsync(moduleType)
            .then(function (moduleAndComponentFactories) {
            _this._moduleFactory = moduleAndComponentFactories.ngModuleFactory;
        });
    };
    TestBed.prototype._initIfNeeded = function () {
        if (this._instantiated) {
            return;
        }
        if (!this._moduleFactory) {
            try {
                var moduleType = this._createCompilerAndModule();
                this._moduleFactory =
                    this._compiler.compileModuleAndAllComponentsSync(moduleType).ngModuleFactory;
            }
            catch (e) {
                var errorCompType = this._compiler.getComponentFromError(e);
                if (errorCompType) {
                    throw new Error("This test module uses the component " + stringify(errorCompType) + " which is using a \"templateUrl\" or \"styleUrls\", but they were never compiled. " +
                        "Please call \"TestBed.compileComponents\" before your test.");
                }
                else {
                    throw e;
                }
            }
        }
        for (var _i = 0, _a = this._templateOverrides; _i < _a.length; _i++) {
            var _b = _a[_i], component = _b.component, templateOf = _b.templateOf;
            var compFactory = this._compiler.getComponentFactory(templateOf);
            overrideComponentView(component, compFactory);
        }
        var ngZone = new NgZone({ enableLongStackTrace: true });
        var providers = [{ provide: NgZone, useValue: ngZone }];
        var ngZoneInjector = Injector.create({
            providers: providers,
            parent: this.platform.injector,
            name: this._moduleFactory.moduleType.name
        });
        this._moduleRef = this._moduleFactory.create(ngZoneInjector);
        // ApplicationInitStatus.runInitializers() is marked @internal to core. So casting to any
        // before accessing it.
        // ApplicationInitStatus.runInitializers() is marked @internal to core. So casting to any
        // before accessing it.
        this._moduleRef.injector.get(ApplicationInitStatus).runInitializers();
        this._instantiated = true;
    };
    TestBed.prototype._createCompilerAndModule = function () {
        var _this = this;
        var providers = this._providers.concat([{ provide: TestBed, useValue: this }]);
        var declarations = this._declarations.concat(this._templateOverrides.map(function (entry) { return entry.templateOf; }));
        var rootScopeImports = [];
        var rootProviderOverrides = this._rootProviderOverrides;
        if (this._isRoot) {
            var RootScopeModule = /** @class */ (function () {
                function RootScopeModule() {
                }
                RootScopeModule.decorators = [
                    { type: NgModule, args: [{
                                providers: rootProviderOverrides.slice(),
                            },] },
                ];
                /** @nocollapse */
                RootScopeModule.ctorParameters = function () { return []; };
                return RootScopeModule;
            }());
            rootScopeImports.push(RootScopeModule);
        }
        providers.push({ provide: APP_ROOT, useValue: this._isRoot });
        var imports = [rootScopeImports, this.ngModule, this._imports];
        var schemas = this._schemas;
        var DynamicTestModule = /** @class */ (function () {
            function DynamicTestModule() {
            }
            DynamicTestModule.decorators = [
                { type: NgModule, args: [{ providers: providers, declarations: declarations, imports: imports, schemas: schemas },] },
            ];
            /** @nocollapse */
            DynamicTestModule.ctorParameters = function () { return []; };
            return DynamicTestModule;
        }());
        var compilerFactory = this.platform.injector.get(TestingCompilerFactory);
        this._compiler = compilerFactory.createTestingCompiler(this._compilerOptions);
        for (var _i = 0, _a = [this._testEnvAotSummaries].concat(this._aotSummaries); _i < _a.length; _i++) {
            var summary = _a[_i];
            this._compiler.loadAotSummaries(summary);
        }
        this._moduleOverrides.forEach(function (entry) { return _this._compiler.overrideModule(entry[0], entry[1]); });
        this._componentOverrides.forEach(function (entry) { return _this._compiler.overrideComponent(entry[0], entry[1]); });
        this._directiveOverrides.forEach(function (entry) { return _this._compiler.overrideDirective(entry[0], entry[1]); });
        this._pipeOverrides.forEach(function (entry) { return _this._compiler.overridePipe(entry[0], entry[1]); });
        return DynamicTestModule;
    };
    TestBed.prototype._assertNotInstantiated = function (methodName, methodDescription) {
        if (this._instantiated) {
            throw new Error("Cannot " + methodDescription + " when the test module has already been instantiated. " +
                ("Make sure you are not using `inject` before `" + methodName + "`."));
        }
    };
    TestBed.prototype.get = function (token, notFoundValue) {
        if (notFoundValue === void 0) { notFoundValue = Injector.THROW_IF_NOT_FOUND; }
        this._initIfNeeded();
        if (token === TestBed) {
            return this;
        }
        // Tests can inject things from the ng module and from the compiler,
        // but the ng module can't inject things from the compiler and vice versa.
        var result = this._moduleRef.injector.get(token, UNDEFINED);
        return result === UNDEFINED ? this._compiler.injector.get(token, notFoundValue) : result;
    };
    TestBed.prototype.execute = function (tokens, fn, context) {
        var _this = this;
        this._initIfNeeded();
        var params = tokens.map(function (t) { return _this.get(t); });
        return fn.apply(context, params);
    };
    TestBed.prototype.overrideModule = function (ngModule, override) {
        this._assertNotInstantiated('overrideModule', 'override module metadata');
        this._moduleOverrides.push([ngModule, override]);
    };
    TestBed.prototype.overrideComponent = function (component, override) {
        this._assertNotInstantiated('overrideComponent', 'override component metadata');
        this._componentOverrides.push([component, override]);
    };
    TestBed.prototype.overrideDirective = function (directive, override) {
        this._assertNotInstantiated('overrideDirective', 'override directive metadata');
        this._directiveOverrides.push([directive, override]);
    };
    TestBed.prototype.overridePipe = function (pipe, override) {
        this._assertNotInstantiated('overridePipe', 'override pipe metadata');
        this._pipeOverrides.push([pipe, override]);
    };
    TestBed.prototype.overrideProvider = function (token, provider) {
        this.overrideProviderImpl(token, provider);
    };
    TestBed.prototype.deprecatedOverrideProvider = function (token, provider) {
        this.overrideProviderImpl(token, provider, /* deprecated */ /* deprecated */ true);
    };
    TestBed.prototype.overrideProviderImpl = function (token, provider, deprecated) {
        if (deprecated === void 0) { deprecated = false; }
        if (typeof token !== 'string' && token.ngInjectableDef &&
            token.ngInjectableDef.providedIn === 'root') {
            if (provider.useFactory) {
                this._rootProviderOverrides.push({ provide: token, useFactory: provider.useFactory, deps: provider.deps || [] });
            }
            else {
                this._rootProviderOverrides.push({ provide: token, useValue: provider.useValue });
            }
        }
        var flags = 0;
        var value;
        if (provider.useFactory) {
            flags |= 1024 /* TypeFactoryProvider */;
            value = provider.useFactory;
        }
        else {
            flags |= 256 /* TypeValueProvider */;
            value = provider.useValue;
        }
        var deps = (provider.deps || []).map(function (dep) {
            var depFlags = 0 /* None */;
            var depToken;
            if (Array.isArray(dep)) {
                dep.forEach(function (entry) {
                    if (entry instanceof Optional) {
                        depFlags |= 2 /* Optional */;
                    }
                    else if (entry instanceof SkipSelf) {
                        depFlags |= 1 /* SkipSelf */;
                    }
                    else {
                        depToken = entry;
                    }
                });
            }
            else {
                depToken = dep;
            }
            return [depFlags, depToken];
        });
        overrideProvider({ token: token, flags: flags, deps: deps, value: value, deprecatedBehavior: deprecated });
    };
    TestBed.prototype.overrideTemplateUsingTestingModule = function (component, template) {
        this._assertNotInstantiated('overrideTemplateUsingTestingModule', 'override template');
        var OverrideComponent = /** @class */ (function () {
            function OverrideComponent() {
            }
            OverrideComponent.decorators = [
                { type: Component, args: [{ selector: 'empty', template: template },] },
            ];
            /** @nocollapse */
            OverrideComponent.ctorParameters = function () { return []; };
            return OverrideComponent;
        }());
        this._templateOverrides.push({ component: component, templateOf: OverrideComponent });
    };
    TestBed.prototype.createComponent = function (component) {
        var _this = this;
        this._initIfNeeded();
        var componentFactory = this._compiler.getComponentFactory(component);
        if (!componentFactory) {
            throw new Error("Cannot create the component " + stringify(component) + " as it was not imported into the testing module!");
        }
        var noNgZone = this.get(ComponentFixtureNoNgZone, false);
        var autoDetect = this.get(ComponentFixtureAutoDetect, false);
        var ngZone = noNgZone ? null : this.get(NgZone, null);
        var testComponentRenderer = this.get(TestComponentRenderer);
        var rootElId = "root" + _nextRootElementId++;
        testComponentRenderer.insertRootElement(rootElId);
        var initComponent = function () {
            var componentRef = componentFactory.create(Injector.NULL, [], "#" + rootElId, _this._moduleRef);
            return new ComponentFixture(componentRef, ngZone, autoDetect);
        };
        var fixture = !ngZone ? initComponent() : ngZone.run(initComponent);
        this._activeFixtures.push(fixture);
        return fixture;
    };
    return TestBed;
}());
/**
 * @description
 * Configures and initializes environment for unit testing and provides methods for
 * creating components and services in unit tests.
 *
 * TestBed is the primary api for writing unit tests for Angular applications and libraries.
 *
 *
 */
export { TestBed };
var _testBed = (null);
/**
 * @experimental
 */
export function getTestBed() {
    return _testBed = _testBed || new TestBed();
}
/**
 * Allows injecting dependencies in `beforeEach()` and `it()`.
 *
 * Example:
 *
 * ```
 * beforeEach(inject([Dependency, AClass], (dep, object) => {
 *   // some code that uses `dep` and `object`
 *   // ...
 * }));
 *
 * it('...', inject([AClass], (object) => {
 *   object.doSomething();
 *   expect(...);
 * })
 * ```
 *
 * Notes:
 * - inject is currently a function because of some Traceur limitation the syntax should
 * eventually
 *   becomes `it('...', @Inject (object: AClass, async: AsyncTestCompleter) => { ... });`
 *
 *
 */
export function inject(tokens, fn) {
    var testBed = getTestBed();
    if (tokens.indexOf(AsyncTestCompleter) >= 0) {
        // Not using an arrow function to preserve context passed from call site
        return function () {
            var _this = this;
            // Return an async test method that returns a Promise if AsyncTestCompleter is one of
            // the injected tokens.
            return testBed.compileComponents().then(function () {
                var completer = testBed.get(AsyncTestCompleter);
                testBed.execute(tokens, fn, _this);
                return completer.promise;
            });
        };
    }
    else {
        // Not using an arrow function to preserve context passed from call site
        return function () { return testBed.execute(tokens, fn, this); };
    }
}
/**
 * @experimental
 */
var /**
 * @experimental
 */
InjectSetupWrapper = /** @class */ (function () {
    function InjectSetupWrapper(_moduleDef) {
        this._moduleDef = _moduleDef;
    }
    InjectSetupWrapper.prototype._addModule = function () {
        var moduleDef = this._moduleDef();
        if (moduleDef) {
            getTestBed().configureTestingModule(moduleDef);
        }
    };
    InjectSetupWrapper.prototype.inject = function (tokens, fn) {
        var self = this;
        // Not using an arrow function to preserve context passed from call site
        return function () {
            self._addModule();
            return inject(tokens, fn).call(this);
        };
    };
    return InjectSetupWrapper;
}());
/**
 * @experimental
 */
export { InjectSetupWrapper };
export function withModule(moduleDef, fn) {
    if (fn) {
        // Not using an arrow function to preserve context passed from call site
        return function () {
            var testBed = getTestBed();
            if (moduleDef) {
                testBed.configureTestingModule(moduleDef);
            }
            return fn.apply(this);
        };
    }
    return new InjectSetupWrapper(function () { return moduleDef; });
}
//# sourceMappingURL=test_bed.js.map