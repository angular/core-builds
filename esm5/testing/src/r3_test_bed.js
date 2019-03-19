/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as tslib_1 from "tslib";
// The formatter and CI disagree on how this import statement should be formatted. Both try to keep
// it on one line, too, which has gotten very hard to read & manage. So disable the formatter for
// this statement only.
// clang-format off
import { ApplicationInitStatus, Compiler, ErrorHandler, Injector, ModuleWithComponentFactories, NgModule, NgZone, resolveForwardRef, ɵNG_COMPONENT_DEF as NG_COMPONENT_DEF, ɵNG_DIRECTIVE_DEF as NG_DIRECTIVE_DEF, ɵNG_INJECTOR_DEF as NG_INJECTOR_DEF, ɵNG_MODULE_DEF as NG_MODULE_DEF, ɵNG_PIPE_DEF as NG_PIPE_DEF, ɵNgModuleFactory as R3NgModuleFactory, ɵRender3ComponentFactory as ComponentFactory, ɵRender3NgModuleRef as NgModuleRef, ɵcompileComponent as compileComponent, ɵcompileDirective as compileDirective, ɵcompileNgModuleDefs as compileNgModuleDefs, ɵcompilePipe as compilePipe, ɵgetInjectableDef as getInjectableDef, ɵflushModuleScopingQueueAsMuchAsPossible as flushModuleScopingQueueAsMuchAsPossible, ɵpatchComponentDefWithScope as patchComponentDefWithScope, ɵresetCompiledComponents as resetCompiledComponents, ɵstringify as stringify, ɵtransitiveScopesFor as transitiveScopesFor, COMPILER_OPTIONS, } from '@angular/core';
// clang-format on
import { ResourceLoader } from '@angular/compiler';
import { clearResolutionOfComponentResourcesQueue, componentNeedsResolution, resolveComponentResources, isComponentDefPendingResolution, restoreComponentResolutionQueue } from '../../src/metadata/resource_loading';
import { ComponentFixture } from './component_fixture';
import { ComponentResolver, DirectiveResolver, NgModuleResolver, PipeResolver } from './resolvers';
import { ComponentFixtureAutoDetect, ComponentFixtureNoNgZone, TestComponentRenderer } from './test_bed_common';
var _nextRootElementId = 0;
var EMPTY_ARRAY = [];
var UNDEFINED = Symbol('UNDEFINED');
/**
 * @description
 * Configures and initializes environment for unit testing and provides methods for
 * creating components and services in unit tests.
 *
 * TestBed is the primary api for writing unit tests for Angular applications and libraries.
 *
 * Note: Use `TestBed` in tests. It will be set to either `TestBedViewEngine` or `TestBedRender3`
 * according to the compiler used.
 */
var TestBedRender3 = /** @class */ (function () {
    function TestBedRender3() {
        // Properties
        this.platform = null;
        this.ngModule = null;
        // metadata overrides
        this._moduleOverrides = [];
        this._componentOverrides = [];
        this._directiveOverrides = [];
        this._pipeOverrides = [];
        this._providerOverrides = [];
        this._compilerProviders = [];
        this._rootProviderOverrides = [];
        this._providerOverridesByToken = new Map();
        this._templateOverrides = new Map();
        this._resolvers = null;
        // test module configuration
        this._providers = [];
        this._compilerOptions = [];
        this._declarations = [];
        this._imports = [];
        this._schemas = [];
        this._activeFixtures = [];
        this._compilerInjector = null;
        this._moduleRef = null;
        this._testModuleType = null;
        this._instantiated = false;
        this._globalCompilationChecked = false;
        this._originalComponentResolutionQueue = null;
        // Map that keeps initial version of component/directive/pipe defs in case
        // we compile a Type again, thus overriding respective static fields. This is
        // required to make sure we restore defs to their initial states between test runs
        this._initialNgDefs = new Map();
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
     * @publicApi
     */
    TestBedRender3.initTestEnvironment = function (ngModule, platform, aotSummaries) {
        var testBed = _getTestBedRender3();
        testBed.initTestEnvironment(ngModule, platform, aotSummaries);
        return testBed;
    };
    /**
     * Reset the providers for the test injector.
     *
     * @publicApi
     */
    TestBedRender3.resetTestEnvironment = function () { _getTestBedRender3().resetTestEnvironment(); };
    TestBedRender3.configureCompiler = function (config) {
        _getTestBedRender3().configureCompiler(config);
        return TestBedRender3;
    };
    /**
     * Allows overriding default providers, directives, pipes, modules of the test injector,
     * which are defined in test_injector.js
     */
    TestBedRender3.configureTestingModule = function (moduleDef) {
        _getTestBedRender3().configureTestingModule(moduleDef);
        return TestBedRender3;
    };
    /**
     * Compile components with a `templateUrl` for the test's NgModule.
     * It is necessary to call this function
     * as fetching urls is asynchronous.
     */
    TestBedRender3.compileComponents = function () { return _getTestBedRender3().compileComponents(); };
    TestBedRender3.overrideModule = function (ngModule, override) {
        _getTestBedRender3().overrideModule(ngModule, override);
        return TestBedRender3;
    };
    TestBedRender3.overrideComponent = function (component, override) {
        _getTestBedRender3().overrideComponent(component, override);
        return TestBedRender3;
    };
    TestBedRender3.overrideDirective = function (directive, override) {
        _getTestBedRender3().overrideDirective(directive, override);
        return TestBedRender3;
    };
    TestBedRender3.overridePipe = function (pipe, override) {
        _getTestBedRender3().overridePipe(pipe, override);
        return TestBedRender3;
    };
    TestBedRender3.overrideTemplate = function (component, template) {
        _getTestBedRender3().overrideComponent(component, { set: { template: template, templateUrl: null } });
        return TestBedRender3;
    };
    /**
     * Overrides the template of the given component, compiling the template
     * in the context of the TestingModule.
     *
     * Note: This works for JIT and AOTed components as well.
     */
    TestBedRender3.overrideTemplateUsingTestingModule = function (component, template) {
        _getTestBedRender3().overrideTemplateUsingTestingModule(component, template);
        return TestBedRender3;
    };
    TestBedRender3.prototype.overrideTemplateUsingTestingModule = function (component, template) {
        if (this._instantiated) {
            throw new Error('Cannot override template when the test module has already been instantiated');
        }
        this._templateOverrides.set(component, template);
    };
    TestBedRender3.overrideProvider = function (token, provider) {
        _getTestBedRender3().overrideProvider(token, provider);
        return TestBedRender3;
    };
    TestBedRender3.deprecatedOverrideProvider = function (token, provider) {
        _getTestBedRender3().deprecatedOverrideProvider(token, provider);
        return TestBedRender3;
    };
    TestBedRender3.get = function (token, notFoundValue) {
        if (notFoundValue === void 0) { notFoundValue = Injector.THROW_IF_NOT_FOUND; }
        return _getTestBedRender3().get(token, notFoundValue);
    };
    TestBedRender3.createComponent = function (component) {
        return _getTestBedRender3().createComponent(component);
    };
    TestBedRender3.resetTestingModule = function () {
        _getTestBedRender3().resetTestingModule();
        return TestBedRender3;
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
     * @publicApi
     */
    TestBedRender3.prototype.initTestEnvironment = function (ngModule, platform, aotSummaries) {
        if (this.platform || this.ngModule) {
            throw new Error('Cannot set base providers because it has already been called');
        }
        this.platform = platform;
        this.ngModule = ngModule;
    };
    /**
     * Reset the providers for the test injector.
     *
     * @publicApi
     */
    TestBedRender3.prototype.resetTestEnvironment = function () {
        this.resetTestingModule();
        this.platform = null;
        this.ngModule = null;
    };
    TestBedRender3.prototype.resetTestingModule = function () {
        this._checkGlobalCompilationFinished();
        resetCompiledComponents();
        // reset metadata overrides
        this._moduleOverrides = [];
        this._componentOverrides = [];
        this._directiveOverrides = [];
        this._pipeOverrides = [];
        this._providerOverrides = [];
        this._rootProviderOverrides = [];
        this._providerOverridesByToken.clear();
        this._templateOverrides.clear();
        this._resolvers = null;
        // reset test module config
        this._providers = [];
        this._compilerOptions = [];
        this._compilerProviders = [];
        this._declarations = [];
        this._imports = [];
        this._schemas = [];
        this._moduleRef = null;
        this._testModuleType = null;
        this._compilerInjector = null;
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
        // restore initial component/directive/pipe defs
        this._initialNgDefs.forEach(function (value, type) {
            var _a = tslib_1.__read(value, 2), prop = _a[0], descriptor = _a[1];
            if (!descriptor) {
                // Delete operations are generally undesirable since they have performance implications on
                // objects they were applied to. In this particular case, situations where this code is
                // invoked should be quite rare to cause any noticable impact, since it's applied only to
                // some test cases (for example when class with no annotations extends some @Component) when
                // we need to clear 'ngComponentDef' field on a given class to restore its original state
                // (before applying overrides and running tests).
                delete type[prop];
            }
            else {
                Object.defineProperty(type, prop, descriptor);
            }
        });
        this._initialNgDefs.clear();
        this._restoreComponentResolutionQueue();
    };
    TestBedRender3.prototype.configureCompiler = function (config) {
        var _a, _b;
        if (config.useJit != null) {
            throw new Error('the Render3 compiler JiT mode is not configurable !');
        }
        if (config.providers) {
            (_a = this._providerOverrides).push.apply(_a, tslib_1.__spread(config.providers));
            (_b = this._compilerProviders).push.apply(_b, tslib_1.__spread(config.providers));
        }
    };
    TestBedRender3.prototype.configureTestingModule = function (moduleDef) {
        var _a, _b, _c, _d;
        this._assertNotInstantiated('R3TestBed.configureTestingModule', 'configure the test module');
        if (moduleDef.providers) {
            (_a = this._providers).push.apply(_a, tslib_1.__spread(moduleDef.providers));
        }
        if (moduleDef.declarations) {
            (_b = this._declarations).push.apply(_b, tslib_1.__spread(moduleDef.declarations));
        }
        if (moduleDef.imports) {
            (_c = this._imports).push.apply(_c, tslib_1.__spread(moduleDef.imports));
        }
        if (moduleDef.schemas) {
            (_d = this._schemas).push.apply(_d, tslib_1.__spread(moduleDef.schemas));
        }
    };
    TestBedRender3.prototype.compileComponents = function () {
        var _this = this;
        this._clearComponentResolutionQueue();
        var resolvers = this._getResolvers();
        var declarations = flatten(this._declarations || EMPTY_ARRAY, resolveForwardRef);
        var componentOverrides = [];
        var providerOverrides = [];
        var hasAsyncResources = false;
        // Compile the components declared by this module
        // TODO(FW-1178): `compileComponents` should not duplicate `_compileNgModule` logic
        declarations.forEach(function (declaration) {
            var component = resolvers.component.resolve(declaration);
            if (component) {
                if (!declaration.hasOwnProperty(NG_COMPONENT_DEF) ||
                    isComponentDefPendingResolution(declaration) || //
                    // Compiler provider overrides (like ResourceLoader) might affect the outcome of
                    // compilation, so we trigger `compileComponent` in case we have compilers overrides.
                    _this._compilerProviders.length > 0 ||
                    _this._hasTypeOverrides(declaration, _this._componentOverrides) ||
                    _this._hasTemplateOverrides(declaration)) {
                    _this._storeNgDef(NG_COMPONENT_DEF, declaration);
                    // We make a copy of the metadata to ensure that we don't mutate the original metadata
                    var metadata = tslib_1.__assign({}, component);
                    compileComponent(declaration, metadata);
                    componentOverrides.push([declaration, metadata]);
                    hasAsyncResources = hasAsyncResources || componentNeedsResolution(component);
                }
                else if (_this._hasProviderOverrides(component.providers)) {
                    // Queue provider override operations, since fetching ngComponentDef (to patch it) might
                    // trigger re-compilation, which will fail because component resources are not yet fully
                    // resolved at this moment. The queue is drained once all resources are resolved.
                    providerOverrides.push(function () { return _this._patchDefWithProviderOverrides(declaration, NG_COMPONENT_DEF); });
                }
            }
        });
        var overrideComponents = function () {
            componentOverrides.forEach(function (override) {
                // Override the existing metadata, ensuring that the resolved resources
                // are only available until the next TestBed reset (when `resetTestingModule` is called)
                _this.overrideComponent(override[0], { set: override[1] });
            });
            providerOverrides.forEach(function (overrideFn) { return overrideFn(); });
        };
        // If the component has no async resources (templateUrl, styleUrls), we can finish
        // synchronously. This is important so that users who mistakenly treat `compileComponents`
        // as synchronous don't encounter an error, as ViewEngine was tolerant of this.
        if (!hasAsyncResources) {
            overrideComponents();
            return Promise.resolve();
        }
        else {
            var resourceLoader_1;
            return resolveComponentResources(function (url) {
                if (!resourceLoader_1) {
                    resourceLoader_1 = _this.compilerInjector.get(ResourceLoader);
                }
                return Promise.resolve(resourceLoader_1.get(url));
            })
                .then(overrideComponents);
        }
    };
    TestBedRender3.prototype.get = function (token, notFoundValue) {
        if (notFoundValue === void 0) { notFoundValue = Injector.THROW_IF_NOT_FOUND; }
        this._initIfNeeded();
        if (token === TestBedRender3) {
            return this;
        }
        var result = this._moduleRef.injector.get(token, UNDEFINED);
        return result === UNDEFINED ? this.compilerInjector.get(token, notFoundValue) : result;
    };
    TestBedRender3.prototype.execute = function (tokens, fn, context) {
        var _this = this;
        this._initIfNeeded();
        var params = tokens.map(function (t) { return _this.get(t); });
        return fn.apply(context, params);
    };
    TestBedRender3.prototype.overrideModule = function (ngModule, override) {
        this._assertNotInstantiated('overrideModule', 'override module metadata');
        this._moduleOverrides.push([ngModule, override]);
    };
    TestBedRender3.prototype.overrideComponent = function (component, override) {
        this._assertNotInstantiated('overrideComponent', 'override component metadata');
        this._componentOverrides.push([component, override]);
    };
    TestBedRender3.prototype.overrideDirective = function (directive, override) {
        this._assertNotInstantiated('overrideDirective', 'override directive metadata');
        this._directiveOverrides.push([directive, override]);
    };
    TestBedRender3.prototype.overridePipe = function (pipe, override) {
        this._assertNotInstantiated('overridePipe', 'override pipe metadata');
        this._pipeOverrides.push([pipe, override]);
    };
    /**
     * Overwrites all providers for the given token with the given provider definition.
     */
    TestBedRender3.prototype.overrideProvider = function (token, provider) {
        var providerDef = provider.useFactory ?
            { provide: token, useFactory: provider.useFactory, deps: provider.deps || [] } :
            { provide: token, useValue: provider.useValue };
        var injectableDef;
        var isRoot = (typeof token !== 'string' && (injectableDef = getInjectableDef(token)) &&
            injectableDef.providedIn === 'root');
        var overridesBucket = isRoot ? this._rootProviderOverrides : this._providerOverrides;
        overridesBucket.push(providerDef);
        // keep all overrides grouped by token as well for fast lookups using token
        var overridesForToken = this._providerOverridesByToken.get(token) || [];
        overridesForToken.push(providerDef);
        this._providerOverridesByToken.set(token, overridesForToken);
    };
    TestBedRender3.prototype.deprecatedOverrideProvider = function (token, provider) {
        // HACK: This is NOT the correct implementation for deprecatedOverrideProvider.
        // To implement it in a backward compatible way, we would need to record some state
        // so we know to prevent eager instantiation of NgModules. However, we don't plan
        // to implement this at all since the API is deprecated and scheduled for removal
        // in V8. This hack is here temporarily for Ivy testing until we transition apps
        // inside Google to the overrideProvider API. At that point, we will be able to
        // remove this method entirely. In the meantime, we can use overrideProvider to
        // test apps with Ivy that don't care about eager instantiation. This fixes 85%
        // of cases in our blueprint.
        this.overrideProvider(token, provider);
    };
    TestBedRender3.prototype.createComponent = function (type) {
        var _this = this;
        this._initIfNeeded();
        var testComponentRenderer = this.get(TestComponentRenderer);
        var rootElId = "root" + _nextRootElementId++;
        testComponentRenderer.insertRootElement(rootElId);
        var componentDef = type.ngComponentDef;
        if (!componentDef) {
            throw new Error("It looks like '" + stringify(type) + "' has not been IVY compiled - it has no 'ngComponentDef' field");
        }
        var noNgZone = this.get(ComponentFixtureNoNgZone, false);
        var autoDetect = this.get(ComponentFixtureAutoDetect, false);
        var ngZone = noNgZone ? null : this.get(NgZone, null);
        var componentFactory = new ComponentFactory(componentDef);
        var initComponent = function () {
            var componentRef = componentFactory.create(Injector.NULL, [], "#" + rootElId, _this._moduleRef);
            return new ComponentFixture(componentRef, ngZone, autoDetect);
        };
        var fixture = ngZone ? ngZone.run(initComponent) : initComponent();
        this._activeFixtures.push(fixture);
        return fixture;
    };
    // internal methods
    TestBedRender3.prototype._initIfNeeded = function () {
        this._checkGlobalCompilationFinished();
        if (this._instantiated) {
            return;
        }
        this._resolvers = this._getResolvers();
        this._testModuleType = this._createTestModule();
        this._compileNgModule(this._testModuleType);
        var parentInjector = this.platform.injector;
        this._moduleRef = new NgModuleRef(this._testModuleType, parentInjector);
        // ApplicationInitStatus.runInitializers() is marked @internal
        // to core. Cast it to any before accessing it.
        this._moduleRef.injector.get(ApplicationInitStatus).runInitializers();
        this._instantiated = true;
    };
    TestBedRender3.prototype._storeNgDef = function (prop, type) {
        if (!this._initialNgDefs.has(type)) {
            var currentDef = Object.getOwnPropertyDescriptor(type, prop);
            this._initialNgDefs.set(type, [prop, currentDef]);
        }
    };
    // get overrides for a specific provider (if any)
    TestBedRender3.prototype._getProviderOverrides = function (provider) {
        var token = provider && typeof provider === 'object' && provider.hasOwnProperty('provide') ?
            provider.provide :
            provider;
        return this._providerOverridesByToken.get(token) || [];
    };
    // creates resolvers taking overrides into account
    TestBedRender3.prototype._getResolvers = function () {
        var module = new NgModuleResolver();
        module.setOverrides(this._moduleOverrides);
        var component = new ComponentResolver();
        component.setOverrides(this._componentOverrides);
        var directive = new DirectiveResolver();
        directive.setOverrides(this._directiveOverrides);
        var pipe = new PipeResolver();
        pipe.setOverrides(this._pipeOverrides);
        return { module: module, component: component, directive: directive, pipe: pipe };
    };
    TestBedRender3.prototype._assertNotInstantiated = function (methodName, methodDescription) {
        if (this._instantiated) {
            throw new Error("Cannot " + methodDescription + " when the test module has already been instantiated. " +
                ("Make sure you are not using `inject` before `" + methodName + "`."));
        }
    };
    TestBedRender3.prototype._createTestModule = function () {
        var _this = this;
        var rootProviderOverrides = this._rootProviderOverrides;
        var RootScopeModule = /** @class */ (function () {
            function RootScopeModule() {
            }
            RootScopeModule = tslib_1.__decorate([
                NgModule({
                    providers: tslib_1.__spread(rootProviderOverrides),
                    jit: true,
                })
            ], RootScopeModule);
            return RootScopeModule;
        }());
        var ngZone = new NgZone({ enableLongStackTrace: true });
        var providers = tslib_1.__spread([
            { provide: NgZone, useValue: ngZone },
            { provide: Compiler, useFactory: function () { return new R3TestCompiler(_this); } },
            { provide: ErrorHandler, useClass: R3TestErrorHandler }
        ], this._providers, this._providerOverrides);
        var declarations = this._declarations;
        var imports = [RootScopeModule, this.ngModule, this._imports];
        var schemas = this._schemas;
        var DynamicTestModule = /** @class */ (function () {
            function DynamicTestModule() {
            }
            DynamicTestModule = tslib_1.__decorate([
                NgModule({ providers: providers, declarations: declarations, imports: imports, schemas: schemas, jit: true })
            ], DynamicTestModule);
            return DynamicTestModule;
        }());
        return DynamicTestModule;
    };
    Object.defineProperty(TestBedRender3.prototype, "compilerInjector", {
        get: function () {
            if (this._compilerInjector !== null) {
                return this._compilerInjector;
            }
            var providers = [];
            var compilerOptions = this.platform.injector.get(COMPILER_OPTIONS);
            compilerOptions.forEach(function (opts) {
                if (opts.providers) {
                    providers.push(opts.providers);
                }
            });
            providers.push.apply(providers, tslib_1.__spread(this._compilerProviders));
            // TODO(ocombe): make this work with an Injector directly instead of creating a module for it
            var CompilerModule = /** @class */ (function () {
                function CompilerModule() {
                }
                CompilerModule = tslib_1.__decorate([
                    NgModule({ providers: providers })
                ], CompilerModule);
                return CompilerModule;
            }());
            var CompilerModuleFactory = new R3NgModuleFactory(CompilerModule);
            this._compilerInjector = CompilerModuleFactory.create(this.platform.injector).injector;
            return this._compilerInjector;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Clears current components resolution queue, but stores the state of the queue, so we can
     * restore it later. Clearing the queue is required before we try to compile components (via
     * `TestBed.compileComponents`), so that component defs are in sync with the resolution queue.
     */
    TestBedRender3.prototype._clearComponentResolutionQueue = function () {
        var _this = this;
        if (this._originalComponentResolutionQueue === null) {
            this._originalComponentResolutionQueue = new Map();
        }
        clearResolutionOfComponentResourcesQueue().forEach(function (value, key) { return _this._originalComponentResolutionQueue.set(key, value); });
    };
    /**
     * Restores component resolution queue to the previously saved state. This operation is performed
     * as a part of restoring the state after completion of the current set of tests (that might
     * potentially mutate the state).
     */
    TestBedRender3.prototype._restoreComponentResolutionQueue = function () {
        if (this._originalComponentResolutionQueue !== null) {
            restoreComponentResolutionQueue(this._originalComponentResolutionQueue);
            this._originalComponentResolutionQueue = null;
        }
    };
    // TODO(FW-1179): define better types for all Provider-related operations, avoid using `any`.
    TestBedRender3.prototype._getProvidersOverrides = function (providers) {
        var _this = this;
        if (!providers || !providers.length)
            return [];
        // There are two flattening operations here. The inner flatten() operates on the metadata's
        // providers and applies a mapping function which retrieves overrides for each incoming
        // provider. The outer flatten() then flattens the produced overrides array. If this is not
        // done, the array can contain other empty arrays (e.g. `[[], []]`) which leak into the
        // providers array and contaminate any error messages that might be generated.
        return flatten(flatten(providers, function (provider) { return _this._getProviderOverrides(provider); }));
    };
    TestBedRender3.prototype._hasProviderOverrides = function (providers) {
        return this._getProvidersOverrides(providers).length > 0;
    };
    TestBedRender3.prototype._hasTypeOverrides = function (type, overrides) {
        return overrides.some(function (override) { return override[0] === type; });
    };
    TestBedRender3.prototype._hasTemplateOverrides = function (type) { return this._templateOverrides.has(type); };
    TestBedRender3.prototype._getMetaWithOverrides = function (meta, type) {
        var overrides = {};
        if (meta.providers && meta.providers.length) {
            var providerOverrides = this._getProvidersOverrides(meta.providers);
            if (providerOverrides.length) {
                overrides.providers = tslib_1.__spread(meta.providers, providerOverrides);
            }
        }
        var hasTemplateOverride = !!type && this._templateOverrides.has(type);
        if (hasTemplateOverride) {
            overrides.template = this._templateOverrides.get(type);
        }
        return Object.keys(overrides).length ? tslib_1.__assign({}, meta, overrides) : meta;
    };
    TestBedRender3.prototype._patchDefWithProviderOverrides = function (declaration, field) {
        var _this = this;
        var def = declaration[field];
        if (def && def.providersResolver) {
            this._storeNgDef(field, declaration);
            var resolver_1 = def.providersResolver;
            var processProvidersFn_1 = function (providers) {
                var overrides = _this._getProvidersOverrides(providers);
                return tslib_1.__spread(providers, overrides);
            };
            def.providersResolver = function (ngDef) { return resolver_1(ngDef, processProvidersFn_1); };
        }
    };
    /**
     * @internal
     */
    TestBedRender3.prototype._getModuleResolver = function () { return this._resolvers.module; };
    /**
     * @internal
     */
    TestBedRender3.prototype._compileNgModule = function (moduleType) {
        var _this = this;
        var ngModule = this._resolvers.module.resolve(moduleType);
        if (ngModule === null) {
            throw new Error(stringify(moduleType) + " has no @NgModule annotation");
        }
        this._storeNgDef(NG_MODULE_DEF, moduleType);
        this._storeNgDef(NG_INJECTOR_DEF, moduleType);
        var metadata = this._getMetaWithOverrides(ngModule);
        compileNgModuleDefs(moduleType, metadata);
        var declarations = flatten(ngModule.declarations || EMPTY_ARRAY, resolveForwardRef);
        var declaredComponents = [];
        // Compile the components, directives and pipes declared by this module
        declarations.forEach(function (declaration) {
            var component = _this._resolvers.component.resolve(declaration);
            if (component) {
                if (!declaration.hasOwnProperty(NG_COMPONENT_DEF) ||
                    _this._hasTypeOverrides(declaration, _this._componentOverrides) ||
                    _this._hasTemplateOverrides(declaration)) {
                    _this._storeNgDef(NG_COMPONENT_DEF, declaration);
                    var metadata_1 = _this._getMetaWithOverrides(component, declaration);
                    compileComponent(declaration, metadata_1);
                }
                else if (_this._hasProviderOverrides(component.providers)) {
                    _this._patchDefWithProviderOverrides(declaration, NG_COMPONENT_DEF);
                }
                declaredComponents.push(declaration);
                return;
            }
            var directive = _this._resolvers.directive.resolve(declaration);
            if (directive) {
                if (!declaration.hasOwnProperty(NG_DIRECTIVE_DEF) ||
                    _this._hasTypeOverrides(declaration, _this._directiveOverrides)) {
                    _this._storeNgDef(NG_DIRECTIVE_DEF, declaration);
                    var metadata_2 = _this._getMetaWithOverrides(directive);
                    compileDirective(declaration, metadata_2);
                }
                else if (_this._hasProviderOverrides(directive.providers)) {
                    _this._patchDefWithProviderOverrides(declaration, NG_DIRECTIVE_DEF);
                }
                return;
            }
            var pipe = _this._resolvers.pipe.resolve(declaration);
            if (pipe) {
                if (!declaration.hasOwnProperty(NG_PIPE_DEF) ||
                    _this._hasTypeOverrides(declaration, _this._pipeOverrides)) {
                    _this._storeNgDef(NG_PIPE_DEF, declaration);
                    compilePipe(declaration, pipe);
                }
                return;
            }
        });
        // Compile transitive modules, components, directives and pipes
        var calcTransitiveScopesFor = function (moduleType) { return transitiveScopesFor(moduleType, function (ngModule) { return _this._compileNgModule(ngModule); }); };
        var transitiveScope = calcTransitiveScopesFor(moduleType);
        declaredComponents.forEach(function (cmp) {
            var scope = _this._templateOverrides.has(cmp) ?
                // if we have template override via `TestBed.overrideTemplateUsingTestingModule` -
                // define Component scope as TestingModule scope, instead of the scope of NgModule
                // where this Component was declared
                // TODO: This is only a partial fix. Should be fixed completely with FW-1178 refactor.
                transitiveScopesFor(_this._testModuleType) :
                transitiveScope;
            patchComponentDefWithScope(cmp.ngComponentDef, scope);
        });
    };
    /**
     * @internal
     */
    TestBedRender3.prototype._getComponentFactories = function (moduleType) {
        var _this = this;
        return maybeUnwrapFn(moduleType.ngModuleDef.declarations).reduce(function (factories, declaration) {
            var componentDef = declaration.ngComponentDef;
            componentDef && factories.push(new ComponentFactory(componentDef, _this._moduleRef));
            return factories;
        }, []);
    };
    /**
     * Check whether the module scoping queue should be flushed, and flush it if needed.
     *
     * When the TestBed is reset, it clears the JIT module compilation queue, cancelling any
     * in-progress module compilation. This creates a potential hazard - the very first time the
     * TestBed is initialized (or if it's reset without being initialized), there may be pending
     * compilations of modules declared in global scope. These compilations should be finished.
     *
     * To ensure that globally declared modules have their components scoped properly, this function
     * is called whenever TestBed is initialized or reset. The _first_ time that this happens, prior
     * to any other operations, the scoping queue is flushed.
     */
    TestBedRender3.prototype._checkGlobalCompilationFinished = function () {
        // !this._instantiated should not be necessary, but is left in as an additional guard that
        // compilations queued in tests (after instantiation) are never flushed accidentally.
        if (!this._globalCompilationChecked && !this._instantiated) {
            flushModuleScopingQueueAsMuchAsPossible();
        }
        this._globalCompilationChecked = true;
    };
    return TestBedRender3;
}());
export { TestBedRender3 };
var testBed;
export function _getTestBedRender3() {
    return testBed = testBed || new TestBedRender3();
}
function flatten(values, mapFn) {
    var out = [];
    values.forEach(function (value) {
        if (Array.isArray(value)) {
            out.push.apply(out, tslib_1.__spread(flatten(value, mapFn)));
        }
        else {
            out.push(mapFn ? mapFn(value) : value);
        }
    });
    return out;
}
function isNgModule(value) {
    return value.ngModuleDef !== undefined;
}
var R3TestCompiler = /** @class */ (function () {
    function R3TestCompiler(testBed) {
        this.testBed = testBed;
    }
    R3TestCompiler.prototype.compileModuleSync = function (moduleType) {
        this.testBed._compileNgModule(moduleType);
        return new R3NgModuleFactory(moduleType);
    };
    R3TestCompiler.prototype.compileModuleAsync = function (moduleType) {
        return Promise.resolve(this.compileModuleSync(moduleType));
    };
    R3TestCompiler.prototype.compileModuleAndAllComponentsSync = function (moduleType) {
        var ngModuleFactory = this.compileModuleSync(moduleType);
        var componentFactories = this.testBed._getComponentFactories(moduleType);
        return new ModuleWithComponentFactories(ngModuleFactory, componentFactories);
    };
    R3TestCompiler.prototype.compileModuleAndAllComponentsAsync = function (moduleType) {
        return Promise.resolve(this.compileModuleAndAllComponentsSync(moduleType));
    };
    R3TestCompiler.prototype.clearCache = function () { };
    R3TestCompiler.prototype.clearCacheFor = function (type) { };
    R3TestCompiler.prototype.getModuleId = function (moduleType) {
        var meta = this.testBed._getModuleResolver().resolve(moduleType);
        return meta && meta.id || undefined;
    };
    return R3TestCompiler;
}());
/** Error handler used for tests. Rethrows errors rather than logging them out. */
var R3TestErrorHandler = /** @class */ (function (_super) {
    tslib_1.__extends(R3TestErrorHandler, _super);
    function R3TestErrorHandler() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    R3TestErrorHandler.prototype.handleError = function (error) { throw error; };
    return R3TestErrorHandler;
}(ErrorHandler));
/**
 * Unwrap a value which might be behind a closure (for forward declaration reasons).
 */
function maybeUnwrapFn(value) {
    if (value instanceof Function) {
        return value();
    }
    else {
        return value;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicjNfdGVzdF9iZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3Rlc3Rpbmcvc3JjL3IzX3Rlc3RfYmVkLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7QUFFSCxtR0FBbUc7QUFDbkcsaUdBQWlHO0FBQ2pHLHVCQUF1QjtBQUN2QixtQkFBbUI7QUFDbkIsT0FBTyxFQUNMLHFCQUFxQixFQUNyQixRQUFRLEVBR1IsWUFBWSxFQUNaLFFBQVEsRUFDUiw0QkFBNEIsRUFDNUIsUUFBUSxFQUVSLE1BQU0sRUFNTixpQkFBaUIsRUFFakIsaUJBQWlCLElBQUksZ0JBQWdCLEVBQ3JDLGlCQUFpQixJQUFJLGdCQUFnQixFQUNyQyxnQkFBZ0IsSUFBSSxlQUFlLEVBQ25DLGNBQWMsSUFBSSxhQUFhLEVBQy9CLFlBQVksSUFBSSxXQUFXLEVBRTNCLGdCQUFnQixJQUFJLGlCQUFpQixFQUVyQyx3QkFBd0IsSUFBSSxnQkFBZ0IsRUFDNUMsbUJBQW1CLElBQUksV0FBVyxFQUNsQyxpQkFBaUIsSUFBSSxnQkFBZ0IsRUFDckMsaUJBQWlCLElBQUksZ0JBQWdCLEVBQ3JDLG9CQUFvQixJQUFJLG1CQUFtQixFQUMzQyxZQUFZLElBQUksV0FBVyxFQUMzQixpQkFBaUIsSUFBSSxnQkFBZ0IsRUFDckMsd0NBQXdDLElBQUksdUNBQXVDLEVBQ25GLDJCQUEyQixJQUFJLDBCQUEwQixFQUN6RCx3QkFBd0IsSUFBSSx1QkFBdUIsRUFDbkQsVUFBVSxJQUFJLFNBQVMsRUFDdkIsb0JBQW9CLElBQUksbUJBQW1CLEVBRzNDLGdCQUFnQixHQUVqQixNQUFNLGVBQWUsQ0FBQztBQUN2QixrQkFBa0I7QUFDbEIsT0FBTyxFQUFDLGNBQWMsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBRWpELE9BQU8sRUFBQyx3Q0FBd0MsRUFBRSx3QkFBd0IsRUFBRSx5QkFBeUIsRUFB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QUFJLDRCQUE0QixDQUFDLGVBQWUsRUFBRSxrQkFBa0IsQ0FBQyxDQUFDO0lBQy9FLENBQUM7SUFFRCwyREFBa0MsR0FBbEMsVUFBc0MsVUFBbUI7UUFFdkQsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxpQ0FBaUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO0lBQzdFLENBQUM7SUFFRCxtQ0FBVSxHQUFWLGNBQW9CLENBQUM7SUFFckIsc0NBQWEsR0FBYixVQUFjLElBQWUsSUFBUyxDQUFDO0lBRXZDLG9DQUFXLEdBQVgsVUFBWSxVQUFxQjtRQUMvQixJQUFNLElBQUksR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLGtCQUFrQixFQUFFLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQ25FLE9BQU8sSUFBSSxJQUFJLElBQUksQ0FBQyxFQUFFLElBQUksU0FBUyxDQUFDO0lBQ3RDLENBQUM7SUFDSCxxQkFBQztBQUFELENBQUMsQUEvQkQsSUErQkM7QUFFRCxrRkFBa0Y7QUFDbEY7SUFBaUMsOENBQVk7SUFBN0M7O0lBRUEsQ0FBQztJQURDLHdDQUFXLEdBQVgsVUFBWSxLQUFVLElBQUksTUFBTSxLQUFLLENBQUMsQ0FBQyxDQUFDO0lBQzFDLHlCQUFDO0FBQUQsQ0FBQyxBQUZELENBQWlDLFlBQVksR0FFNUM7QUFFRDs7R0FFRztBQUNILFNBQVMsYUFBYSxDQUFJLEtBQW9CO0lBQzVDLElBQUksS0FBSyxZQUFZLFFBQVEsRUFBRTtRQUM3QixPQUFPLEtBQUssRUFBRSxDQUFDO0tBQ2hCO1NBQU07UUFDTCxPQUFPLEtBQUssQ0FBQztLQUNkO0FBQ0gsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuLy8gVGhlIGZvcm1hdHRlciBhbmQgQ0kgZGlzYWdyZWUgb24gaG93IHRoaXMgaW1wb3J0IHN0YXRlbWVudCBzaG91bGQgYmUgZm9ybWF0dGVkLiBCb3RoIHRyeSB0byBrZWVwXG4vLyBpdCBvbiBvbmUgbGluZSwgdG9vLCB3aGljaCBoYXMgZ290dGVuIHZlcnkgaGFyZCB0byByZWFkICYgbWFuYWdlLiBTbyBkaXNhYmxlIHRoZSBmb3JtYXR0ZXIgZm9yXG4vLyB0aGlzIHN0YXRlbWVudCBvbmx5LlxuLy8gY2xhbmctZm9ybWF0IG9mZlxuaW1wb3J0IHtcbiAgQXBwbGljYXRpb25Jbml0U3RhdHVzLFxuICBDb21waWxlcixcbiAgQ29tcG9uZW50LFxuICBEaXJlY3RpdmUsXG4gIEVycm9ySGFuZGxlcixcbiAgSW5qZWN0b3IsXG4gIE1vZHVsZVdpdGhDb21wb25lbnRGYWN0b3JpZXMsXG4gIE5nTW9kdWxlLFxuICBOZ01vZHVsZUZhY3RvcnksXG4gIE5nWm9uZSxcbiAgUGlwZSxcbiAgUGxhdGZvcm1SZWYsXG4gIFByb3ZpZGVyLFxuICBTY2hlbWFNZXRhZGF0YSxcbiAgVHlwZSxcbiAgcmVzb2x2ZUZvcndhcmRSZWYsXG4gIMm1SW5qZWN0YWJsZURlZiBhcyBJbmplY3RhYmxlRGVmLFxuICDJtU5HX0NPTVBPTkVOVF9ERUYgYXMgTkdfQ09NUE9ORU5UX0RFRixcbiAgybVOR19ESVJFQ1RJVkVfREVGIGFzIE5HX0RJUkVDVElWRV9ERUYsXG4gIMm1TkdfSU5KRUNUT1JfREVGIGFzIE5HX0lOSkVDVE9SX0RFRixcbiAgybVOR19NT0RVTEVfREVGIGFzIE5HX01PRFVMRV9ERUYsXG4gIMm1TkdfUElQRV9ERUYgYXMgTkdfUElQRV9ERUYsXG4gIMm1TmdNb2R1bGVEZWYgYXMgTmdNb2R1bGVEZWYsXG4gIMm1TmdNb2R1bGVGYWN0b3J5IGFzIFIzTmdNb2R1bGVGYWN0b3J5LFxuICDJtU5nTW9kdWxlVHlwZSBhcyBOZ01vZHVsZVR5cGUsXG4gIMm1UmVuZGVyM0NvbXBvbmVudEZhY3RvcnkgYXMgQ29tcG9uZW50RmFjdG9yeSxcbiAgybVSZW5kZXIzTmdNb2R1bGVSZWYgYXMgTmdNb2R1bGVSZWYsXG4gIMm1Y29tcGlsZUNvbXBvbmVudCBhcyBjb21waWxlQ29tcG9uZW50LFxuICDJtWNvbXBpbGVEaXJlY3RpdmUgYXMgY29tcGlsZURpcmVjdGl2ZSxcbiAgybVjb21waWxlTmdNb2R1bGVEZWZzIGFzIGNvbXBpbGVOZ01vZHVsZURlZnMsXG4gIMm1Y29tcGlsZVBpcGUgYXMgY29tcGlsZVBpcGUsXG4gIMm1Z2V0SW5qZWN0YWJsZURlZiBhcyBnZXRJbmplY3RhYmxlRGVmLFxuICDJtWZsdXNoTW9kdWxlU2NvcGluZ1F1ZXVlQXNNdWNoQXNQb3NzaWJsZSBhcyBmbHVzaE1vZHVsZVNjb3BpbmdRdWV1ZUFzTXVjaEFzUG9zc2libGUsXG4gIMm1cGF0Y2hDb21wb25lbnREZWZXaXRoU2NvcGUgYXMgcGF0Y2hDb21wb25lbnREZWZXaXRoU2NvcGUsXG4gIMm1cmVzZXRDb21waWxlZENvbXBvbmVudHMgYXMgcmVzZXRDb21waWxlZENvbXBvbmVudHMsXG4gIMm1c3RyaW5naWZ5IGFzIHN0cmluZ2lmeSxcbiAgybV0cmFuc2l0aXZlU2NvcGVzRm9yIGFzIHRyYW5zaXRpdmVTY29wZXNGb3IsXG4gIENvbXBpbGVyT3B0aW9ucyxcbiAgU3RhdGljUHJvdmlkZXIsXG4gIENPTVBJTEVSX09QVElPTlMsXG4gIMm1RGlyZWN0aXZlRGVmIGFzIERpcmVjdGl2ZURlZixcbn0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG4vLyBjbGFuZy1mb3JtYXQgb25cbmltcG9ydCB7UmVzb3VyY2VMb2FkZXJ9IGZyb20gJ0Bhbmd1bGFyL2NvbXBpbGVyJztcblxuaW1wb3J0IHtjbGVhclJlc29sdXRpb25PZkNvbXBvbmVudFJlc291cmNlc1F1ZXVlLCBjb21wb25lbnROZWVkc1Jlc29sdXRpb24sIHJlc29sdmVDb21wb25lbnRSZXNvdXJjZXMsIG1heWJlUXVldWVSZXNvbHV0aW9uT2ZDb21wb25lbnRSZXNvdXJjZXMsIGlzQ29tcG9uZW50RGVmUGVuZGluZ1Jlc29sdXRpb24sIHJlc3RvcmVDb21wb25lbnRSZXNvbHV0aW9uUXVldWV9IGZyb20gJy4uLy4uL3NyYy9tZXRhZGF0YS9yZXNvdXJjZV9sb2FkaW5nJztcbmltcG9ydCB7Q29tcG9uZW50Rml4dHVyZX0gZnJvbSAnLi9jb21wb25lbnRfZml4dHVyZSc7XG5pbXBvcnQge01ldGFkYXRhT3ZlcnJpZGV9IGZyb20gJy4vbWV0YWRhdGFfb3ZlcnJpZGUnO1xuaW1wb3J0IHtDb21wb25lbnRSZXNvbHZlciwgRGlyZWN0aXZlUmVzb2x2ZXIsIE5nTW9kdWxlUmVzb2x2ZXIsIFBpcGVSZXNvbHZlciwgUmVzb2x2ZXJ9IGZyb20gJy4vcmVzb2x2ZXJzJztcbmltcG9ydCB7VGVzdEJlZH0gZnJvbSAnLi90ZXN0X2JlZCc7XG5pbXBvcnQge0NvbXBvbmVudEZpeHR1cmVBdXRvRGV0ZWN0LCBDb21wb25lbnRGaXh0dXJlTm9OZ1pvbmUsIFRlc3RCZWRTdGF0aWMsIFRlc3RDb21wb25lbnRSZW5kZXJlciwgVGVzdE1vZHVsZU1ldGFkYXRhfSBmcm9tICcuL3Rlc3RfYmVkX2NvbW1vbic7XG5cbmxldCBfbmV4dFJvb3RFbGVtZW50SWQgPSAwO1xuXG5jb25zdCBFTVBUWV9BUlJBWTogVHlwZTxhbnk+W10gPSBbXTtcblxuY29uc3QgVU5ERUZJTkVEOiBTeW1ib2wgPSBTeW1ib2woJ1VOREVGSU5FRCcpO1xuXG4vLyBSZXNvbHZlcnMgZm9yIEFuZ3VsYXIgZGVjb3JhdG9yc1xudHlwZSBSZXNvbHZlcnMgPSB7XG4gIG1vZHVsZTogUmVzb2x2ZXI8TmdNb2R1bGU+LFxuICBjb21wb25lbnQ6IFJlc29sdmVyPERpcmVjdGl2ZT4sXG4gIGRpcmVjdGl2ZTogUmVzb2x2ZXI8Q29tcG9uZW50PixcbiAgcGlwZTogUmVzb2x2ZXI8UGlwZT4sXG59O1xuXG4vKipcbiAqIEBkZXNjcmlwdGlvblxuICogQ29uZmlndXJlcyBhbmQgaW5pdGlhbGl6ZXMgZW52aXJvbm1lbnQgZm9yIHVuaXQgdGVzdGluZyBhbmQgcHJvdmlkZXMgbWV0aG9kcyBmb3JcbiAqIGNyZWF0aW5nIGNvbXBvbmVudHMgYW5kIHNlcnZpY2VzIGluIHVuaXQgdGVzdHMuXG4gKlxuICogVGVzdEJlZCBpcyB0aGUgcHJpbWFyeSBhcGkgZm9yIHdyaXRpbmcgdW5pdCB0ZXN0cyBmb3IgQW5ndWxhciBhcHBsaWNhdGlvbnMgYW5kIGxpYnJhcmllcy5cbiAqXG4gKiBOb3RlOiBVc2UgYFRlc3RCZWRgIGluIHRlc3RzLiBJdCB3aWxsIGJlIHNldCB0byBlaXRoZXIgYFRlc3RCZWRWaWV3RW5naW5lYCBvciBgVGVzdEJlZFJlbmRlcjNgXG4gKiBhY2NvcmRpbmcgdG8gdGhlIGNvbXBpbGVyIHVzZWQuXG4gKi9cbmV4cG9ydCBjbGFzcyBUZXN0QmVkUmVuZGVyMyBpbXBsZW1lbnRzIEluamVjdG9yLCBUZXN0QmVkIHtcbiAgLyoqXG4gICAqIEluaXRpYWxpemUgdGhlIGVudmlyb25tZW50IGZvciB0ZXN0aW5nIHdpdGggYSBjb21waWxlciBmYWN0b3J5LCBhIFBsYXRmb3JtUmVmLCBhbmQgYW5cbiAgICogYW5ndWxhciBtb2R1bGUuIFRoZXNlIGFyZSBjb21tb24gdG8gZXZlcnkgdGVzdCBpbiB0aGUgc3VpdGUuXG4gICAqXG4gICAqIFRoaXMgbWF5IG9ubHkgYmUgY2FsbGVkIG9uY2UsIHRvIHNldCB1cCB0aGUgY29tbW9uIHByb3ZpZGVycyBmb3IgdGhlIGN1cnJlbnQgdGVzdFxuICAgKiBzdWl0ZSBvbiB0aGUgY3VycmVudCBwbGF0Zm9ybS4gSWYgeW91IGFic29sdXRlbHkgbmVlZCB0byBjaGFuZ2UgdGhlIHByb3ZpZGVycyxcbiAgICogZmlyc3QgdXNlIGByZXNldFRlc3RFbnZpcm9ubWVudGAuXG4gICAqXG4gICAqIFRlc3QgbW9kdWxlcyBhbmQgcGxhdGZvcm1zIGZvciBpbmRpdmlkdWFsIHBsYXRmb3JtcyBhcmUgYXZhaWxhYmxlIGZyb21cbiAgICogJ0Bhbmd1bGFyLzxwbGF0Zm9ybV9uYW1lPi90ZXN0aW5nJy5cbiAgICpcbiAgICogQHB1YmxpY0FwaVxuICAgKi9cbiAgc3RhdGljIGluaXRUZXN0RW52aXJvbm1lbnQoXG4gICAgICBuZ01vZHVsZTogVHlwZTxhbnk+fFR5cGU8YW55PltdLCBwbGF0Zm9ybTogUGxhdGZvcm1SZWYsIGFvdFN1bW1hcmllcz86ICgpID0+IGFueVtdKTogVGVzdEJlZCB7XG4gICAgY29uc3QgdGVzdEJlZCA9IF9nZXRUZXN0QmVkUmVuZGVyMygpO1xuICAgIHRlc3RCZWQuaW5pdFRlc3RFbnZpcm9ubWVudChuZ01vZHVsZSwgcGxhdGZvcm0sIGFvdFN1bW1hcmllcyk7XG4gICAgcmV0dXJuIHRlc3RCZWQ7XG4gIH1cblxuICAvKipcbiAgICogUmVzZXQgdGhlIHByb3ZpZGVycyBmb3IgdGhlIHRlc3QgaW5qZWN0b3IuXG4gICAqXG4gICAqIEBwdWJsaWNBcGlcbiAgICovXG4gIHN0YXRpYyByZXNldFRlc3RFbnZpcm9ubWVudCgpOiB2b2lkIHsgX2dldFRlc3RCZWRSZW5kZXIzKCkucmVzZXRUZXN0RW52aXJvbm1lbnQoKTsgfVxuXG4gIHN0YXRpYyBjb25maWd1cmVDb21waWxlcihjb25maWc6IHtwcm92aWRlcnM/OiBhbnlbXTsgdXNlSml0PzogYm9vbGVhbjt9KTogVGVzdEJlZFN0YXRpYyB7XG4gICAgX2dldFRlc3RCZWRSZW5kZXIzKCkuY29uZmlndXJlQ29tcGlsZXIoY29uZmlnKTtcbiAgICByZXR1cm4gVGVzdEJlZFJlbmRlcjMgYXMgYW55IGFzIFRlc3RCZWRTdGF0aWM7XG4gIH1cblxuICAvKipcbiAgICogQWxsb3dzIG92ZXJyaWRpbmcgZGVmYXVsdCBwcm92aWRlcnMsIGRpcmVjdGl2ZXMsIHBpcGVzLCBtb2R1bGVzIG9mIHRoZSB0ZXN0IGluamVjdG9yLFxuICAgKiB3aGljaCBhcmUgZGVmaW5lZCBpbiB0ZXN0X2luamVjdG9yLmpzXG4gICAqL1xuICBzdGF0aWMgY29uZmlndXJlVGVzdGluZ01vZHVsZShtb2R1bGVEZWY6IFRlc3RNb2R1bGVNZXRhZGF0YSk6IFRlc3RCZWRTdGF0aWMge1xuICAgIF9nZXRUZXN0QmVkUmVuZGVyMygpLmNvbmZpZ3VyZVRlc3RpbmdNb2R1bGUobW9kdWxlRGVmKTtcbiAgICByZXR1cm4gVGVzdEJlZFJlbmRlcjMgYXMgYW55IGFzIFRlc3RCZWRTdGF0aWM7XG4gIH1cblxuICAvKipcbiAgICogQ29tcGlsZSBjb21wb25lbnRzIHdpdGggYSBgdGVtcGxhdGVVcmxgIGZvciB0aGUgdGVzdCdzIE5nTW9kdWxlLlxuICAgKiBJdCBpcyBuZWNlc3NhcnkgdG8gY2FsbCB0aGlzIGZ1bmN0aW9uXG4gICAqIGFzIGZldGNoaW5nIHVybHMgaXMgYXN5bmNocm9ub3VzLlxuICAgKi9cbiAgc3RhdGljIGNvbXBpbGVDb21wb25lbnRzKCk6IFByb21pc2U8YW55PiB7IHJldHVybiBfZ2V0VGVzdEJlZFJlbmRlcjMoKS5jb21waWxlQ29tcG9uZW50cygpOyB9XG5cbiAgc3RhdGljIG92ZXJyaWRlTW9kdWxlKG5nTW9kdWxlOiBUeXBlPGFueT4sIG92ZXJyaWRlOiBNZXRhZGF0YU92ZXJyaWRlPE5nTW9kdWxlPik6IFRlc3RCZWRTdGF0aWMge1xuICAgIF9nZXRUZXN0QmVkUmVuZGVyMygpLm92ZXJyaWRlTW9kdWxlKG5nTW9kdWxlLCBvdmVycmlkZSk7XG4gICAgcmV0dXJuIFRlc3RCZWRSZW5kZXIzIGFzIGFueSBhcyBUZXN0QmVkU3RhdGljO1xuICB9XG5cbiAgc3RhdGljIG92ZXJyaWRlQ29tcG9uZW50KGNvbXBvbmVudDogVHlwZTxhbnk+LCBvdmVycmlkZTogTWV0YWRhdGFPdmVycmlkZTxDb21wb25lbnQ+KTpcbiAgICAgIFRlc3RCZWRTdGF0aWMge1xuICAgIF9nZXRUZXN0QmVkUmVuZGVyMygpLm92ZXJyaWRlQ29tcG9uZW50KGNvbXBvbmVudCwgb3ZlcnJpZGUpO1xuICAgIHJldHVybiBUZXN0QmVkUmVuZGVyMyBhcyBhbnkgYXMgVGVzdEJlZFN0YXRpYztcbiAgfVxuXG4gIHN0YXRpYyBvdmVycmlkZURpcmVjdGl2ZShkaXJlY3RpdmU6IFR5cGU8YW55Piwgb3ZlcnJpZGU6IE1ldGFkYXRhT3ZlcnJpZGU8RGlyZWN0aXZlPik6XG4gICAgICBUZXN0QmVkU3RhdGljIHtcbiAgICBfZ2V0VGVzdEJlZFJlbmRlcjMoKS5vdmVycmlkZURpcmVjdGl2ZShkaXJlY3RpdmUsIG92ZXJyaWRlKTtcbiAgICByZXR1cm4gVGVzdEJlZFJlbmRlcjMgYXMgYW55IGFzIFRlc3RCZWRTdGF0aWM7XG4gIH1cblxuICBzdGF0aWMgb3ZlcnJpZGVQaXBlKHBpcGU6IFR5cGU8YW55Piwgb3ZlcnJpZGU6IE1ldGFkYXRhT3ZlcnJpZGU8UGlwZT4pOiBUZXN0QmVkU3RhdGljIHtcbiAgICBfZ2V0VGVzdEJlZFJlbmRlcjMoKS5vdmVycmlkZVBpcGUocGlwZSwgb3ZlcnJpZGUpO1xuICAgIHJldHVybiBUZXN0QmVkUmVuZGVyMyBhcyBhbnkgYXMgVGVzdEJlZFN0YXRpYztcbiAgfVxuXG4gIHN0YXRpYyBvdmVycmlkZVRlbXBsYXRlKGNvbXBvbmVudDogVHlwZTxhbnk+LCB0ZW1wbGF0ZTogc3RyaW5nKTogVGVzdEJlZFN0YXRpYyB7XG4gICAgX2dldFRlc3RCZWRSZW5kZXIzKCkub3ZlcnJpZGVDb21wb25lbnQoY29tcG9uZW50LCB7c2V0OiB7dGVtcGxhdGUsIHRlbXBsYXRlVXJsOiBudWxsICF9fSk7XG4gICAgcmV0dXJuIFRlc3RCZWRSZW5kZXIzIGFzIGFueSBhcyBUZXN0QmVkU3RhdGljO1xuICB9XG5cbiAgLyoqXG4gICAqIE92ZXJyaWRlcyB0aGUgdGVtcGxhdGUgb2YgdGhlIGdpdmVuIGNvbXBvbmVudCwgY29tcGlsaW5nIHRoZSB0ZW1wbGF0ZVxuICAgKiBpbiB0aGUgY29udGV4dCBvZiB0aGUgVGVzdGluZ01vZHVsZS5cbiAgICpcbiAgICogTm90ZTogVGhpcyB3b3JrcyBmb3IgSklUIGFuZCBBT1RlZCBjb21wb25lbnRzIGFzIHdlbGwuXG4gICAqL1xuICBzdGF0aWMgb3ZlcnJpZGVUZW1wbGF0ZVVzaW5nVGVzdGluZ01vZHVsZShjb21wb25lbnQ6IFR5cGU8YW55PiwgdGVtcGxhdGU6IHN0cmluZyk6IFRlc3RCZWRTdGF0aWMge1xuICAgIF9nZXRUZXN0QmVkUmVuZGVyMygpLm92ZXJyaWRlVGVtcGxhdGVVc2luZ1Rlc3RpbmdNb2R1bGUoY29tcG9uZW50LCB0ZW1wbGF0ZSk7XG4gICAgcmV0dXJuIFRlc3RCZWRSZW5kZXIzIGFzIGFueSBhcyBUZXN0QmVkU3RhdGljO1xuICB9XG5cbiAgb3ZlcnJpZGVUZW1wbGF0ZVVzaW5nVGVzdGluZ01vZHVsZShjb21wb25lbnQ6IFR5cGU8YW55PiwgdGVtcGxhdGU6IHN0cmluZyk6IHZvaWQge1xuICAgIGlmICh0aGlzLl9pbnN0YW50aWF0ZWQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICAnQ2Fubm90IG92ZXJyaWRlIHRlbXBsYXRlIHdoZW4gdGhlIHRlc3QgbW9kdWxlIGhhcyBhbHJlYWR5IGJlZW4gaW5zdGFudGlhdGVkJyk7XG4gICAgfVxuICAgIHRoaXMuX3RlbXBsYXRlT3ZlcnJpZGVzLnNldChjb21wb25lbnQsIHRlbXBsYXRlKTtcbiAgfVxuXG4gIHN0YXRpYyBvdmVycmlkZVByb3ZpZGVyKHRva2VuOiBhbnksIHByb3ZpZGVyOiB7XG4gICAgdXNlRmFjdG9yeTogRnVuY3Rpb24sXG4gICAgZGVwczogYW55W10sXG4gIH0pOiBUZXN0QmVkU3RhdGljO1xuICBzdGF0aWMgb3ZlcnJpZGVQcm92aWRlcih0b2tlbjogYW55LCBwcm92aWRlcjoge3VzZVZhbHVlOiBhbnk7fSk6IFRlc3RCZWRTdGF0aWM7XG4gIHN0YXRpYyBvdmVycmlkZVByb3ZpZGVyKHRva2VuOiBhbnksIHByb3ZpZGVyOiB7XG4gICAgdXNlRmFjdG9yeT86IEZ1bmN0aW9uLFxuICAgIHVzZVZhbHVlPzogYW55LFxuICAgIGRlcHM/OiBhbnlbXSxcbiAgfSk6IFRlc3RCZWRTdGF0aWMge1xuICAgIF9nZXRUZXN0QmVkUmVuZGVyMygpLm92ZXJyaWRlUHJvdmlkZXIodG9rZW4sIHByb3ZpZGVyKTtcbiAgICByZXR1cm4gVGVzdEJlZFJlbmRlcjMgYXMgYW55IGFzIFRlc3RCZWRTdGF0aWM7XG4gIH1cblxuICAvKipcbiAgICogT3ZlcndyaXRlcyBhbGwgcHJvdmlkZXJzIGZvciB0aGUgZ2l2ZW4gdG9rZW4gd2l0aCB0aGUgZ2l2ZW4gcHJvdmlkZXIgZGVmaW5pdGlvbi5cbiAgICpcbiAgICogQGRlcHJlY2F0ZWQgYXMgaXQgbWFrZXMgYWxsIE5nTW9kdWxlcyBsYXp5LiBJbnRyb2R1Y2VkIG9ubHkgZm9yIG1pZ3JhdGluZyBvZmYgb2YgaXQuXG4gICAqL1xuICBzdGF0aWMgZGVwcmVjYXRlZE92ZXJyaWRlUHJvdmlkZXIodG9rZW46IGFueSwgcHJvdmlkZXI6IHtcbiAgICB1c2VGYWN0b3J5OiBGdW5jdGlvbixcbiAgICBkZXBzOiBhbnlbXSxcbiAgfSk6IHZvaWQ7XG4gIHN0YXRpYyBkZXByZWNhdGVkT3ZlcnJpZGVQcm92aWRlcih0b2tlbjogYW55LCBwcm92aWRlcjoge3VzZVZhbHVlOiBhbnk7fSk6IHZvaWQ7XG4gIHN0YXRpYyBkZXByZWNhdGVkT3ZlcnJpZGVQcm92aWRlcih0b2tlbjogYW55LCBwcm92aWRlcjoge1xuICAgIHVzZUZhY3Rvcnk/OiBGdW5jdGlvbixcbiAgICB1c2VWYWx1ZT86IGFueSxcbiAgICBkZXBzPzogYW55W10sXG4gIH0pOiBUZXN0QmVkU3RhdGljIHtcbiAgICBfZ2V0VGVzdEJlZFJlbmRlcjMoKS5kZXByZWNhdGVkT3ZlcnJpZGVQcm92aWRlcih0b2tlbiwgcHJvdmlkZXIgYXMgYW55KTtcbiAgICByZXR1cm4gVGVzdEJlZFJlbmRlcjMgYXMgYW55IGFzIFRlc3RCZWRTdGF0aWM7XG4gIH1cblxuICBzdGF0aWMgZ2V0KHRva2VuOiBhbnksIG5vdEZvdW5kVmFsdWU6IGFueSA9IEluamVjdG9yLlRIUk9XX0lGX05PVF9GT1VORCk6IGFueSB7XG4gICAgcmV0dXJuIF9nZXRUZXN0QmVkUmVuZGVyMygpLmdldCh0b2tlbiwgbm90Rm91bmRWYWx1ZSk7XG4gIH1cblxuICBzdGF0aWMgY3JlYXRlQ29tcG9uZW50PFQ+KGNvbXBvbmVudDogVHlwZTxUPik6IENvbXBvbmVudEZpeHR1cmU8VD4ge1xuICAgIHJldHVybiBfZ2V0VGVzdEJlZFJlbmRlcjMoKS5jcmVhdGVDb21wb25lbnQoY29tcG9uZW50KTtcbiAgfVxuXG4gIHN0YXRpYyByZXNldFRlc3RpbmdNb2R1bGUoKTogVGVzdEJlZFN0YXRpYyB7XG4gICAgX2dldFRlc3RCZWRSZW5kZXIzKCkucmVzZXRUZXN0aW5nTW9kdWxlKCk7XG4gICAgcmV0dXJuIFRlc3RCZWRSZW5kZXIzIGFzIGFueSBhcyBUZXN0QmVkU3RhdGljO1xuICB9XG5cbiAgLy8gUHJvcGVydGllc1xuXG4gIHBsYXRmb3JtOiBQbGF0Zm9ybVJlZiA9IG51bGwgITtcbiAgbmdNb2R1bGU6IFR5cGU8YW55PnxUeXBlPGFueT5bXSA9IG51bGwgITtcblxuICAvLyBtZXRhZGF0YSBvdmVycmlkZXNcbiAgcHJpdmF0ZSBfbW9kdWxlT3ZlcnJpZGVzOiBbVHlwZTxhbnk+LCBNZXRhZGF0YU92ZXJyaWRlPE5nTW9kdWxlPl1bXSA9IFtdO1xuICBwcml2YXRlIF9jb21wb25lbnRPdmVycmlkZXM6IFtUeXBlPGFueT4sIE1ldGFkYXRhT3ZlcnJpZGU8Q29tcG9uZW50Pl1bXSA9IFtdO1xuICBwcml2YXRlIF9kaXJlY3RpdmVPdmVycmlkZXM6IFtUeXBlPGFueT4sIE1ldGFkYXRhT3ZlcnJpZGU8RGlyZWN0aXZlPl1bXSA9IFtdO1xuICBwcml2YXRlIF9waXBlT3ZlcnJpZGVzOiBbVHlwZTxhbnk+LCBNZXRhZGF0YU92ZXJyaWRlPFBpcGU+XVtdID0gW107XG4gIHByaXZhdGUgX3Byb3ZpZGVyT3ZlcnJpZGVzOiBQcm92aWRlcltdID0gW107XG4gIHByaXZhdGUgX2NvbXBpbGVyUHJvdmlkZXJzOiBTdGF0aWNQcm92aWRlcltdID0gW107XG4gIHByaXZhdGUgX3Jvb3RQcm92aWRlck92ZXJyaWRlczogUHJvdmlkZXJbXSA9IFtdO1xuICBwcml2YXRlIF9wcm92aWRlck92ZXJyaWRlc0J5VG9rZW46IE1hcDxhbnksIFByb3ZpZGVyW10+ID0gbmV3IE1hcCgpO1xuICBwcml2YXRlIF90ZW1wbGF0ZU92ZXJyaWRlczogTWFwPFR5cGU8YW55Piwgc3RyaW5nPiA9IG5ldyBNYXAoKTtcbiAgcHJpdmF0ZSBfcmVzb2x2ZXJzOiBSZXNvbHZlcnMgPSBudWxsICE7XG5cbiAgLy8gdGVzdCBtb2R1bGUgY29uZmlndXJhdGlvblxuICBwcml2YXRlIF9wcm92aWRlcnM6IFByb3ZpZGVyW10gPSBbXTtcbiAgcHJpdmF0ZSBfY29tcGlsZXJPcHRpb25zOiBDb21waWxlck9wdGlvbnNbXSA9IFtdO1xuICBwcml2YXRlIF9kZWNsYXJhdGlvbnM6IEFycmF5PFR5cGU8YW55PnxhbnlbXXxhbnk+ID0gW107XG4gIHByaXZhdGUgX2ltcG9ydHM6IEFycmF5PFR5cGU8YW55PnxhbnlbXXxhbnk+ID0gW107XG4gIHByaXZhdGUgX3NjaGVtYXM6IEFycmF5PFNjaGVtYU1ldGFkYXRhfGFueVtdPiA9IFtdO1xuXG4gIHByaXZhdGUgX2FjdGl2ZUZpeHR1cmVzOiBDb21wb25lbnRGaXh0dXJlPGFueT5bXSA9IFtdO1xuXG4gIHByaXZhdGUgX2NvbXBpbGVySW5qZWN0b3I6IEluamVjdG9yID0gbnVsbCAhO1xuICBwcml2YXRlIF9tb2R1bGVSZWY6IE5nTW9kdWxlUmVmPGFueT4gPSBudWxsICE7XG4gIHByaXZhdGUgX3Rlc3RNb2R1bGVUeXBlOiBOZ01vZHVsZVR5cGU8YW55PiA9IG51bGwgITtcblxuICBwcml2YXRlIF9pbnN0YW50aWF0ZWQ6IGJvb2xlYW4gPSBmYWxzZTtcbiAgcHJpdmF0ZSBfZ2xvYmFsQ29tcGlsYXRpb25DaGVja2VkID0gZmFsc2U7XG5cbiAgcHJpdmF0ZSBfb3JpZ2luYWxDb21wb25lbnRSZXNvbHV0aW9uUXVldWU6IE1hcDxUeXBlPGFueT4sIENvbXBvbmVudD58bnVsbCA9IG51bGw7XG5cbiAgLy8gTWFwIHRoYXQga2VlcHMgaW5pdGlhbCB2ZXJzaW9uIG9mIGNvbXBvbmVudC9kaXJlY3RpdmUvcGlwZSBkZWZzIGluIGNhc2VcbiAgLy8gd2UgY29tcGlsZSBhIFR5cGUgYWdhaW4sIHRodXMgb3ZlcnJpZGluZyByZXNwZWN0aXZlIHN0YXRpYyBmaWVsZHMuIFRoaXMgaXNcbiAgLy8gcmVxdWlyZWQgdG8gbWFrZSBzdXJlIHdlIHJlc3RvcmUgZGVmcyB0byB0aGVpciBpbml0aWFsIHN0YXRlcyBiZXR3ZWVuIHRlc3QgcnVuc1xuICBwcml2YXRlIF9pbml0aWFsTmdEZWZzOiBNYXA8VHlwZTxhbnk+LCBbc3RyaW5nLCBQcm9wZXJ0eURlc2NyaXB0b3J8dW5kZWZpbmVkXT4gPSBuZXcgTWFwKCk7XG5cbiAgLyoqXG4gICAqIEluaXRpYWxpemUgdGhlIGVudmlyb25tZW50IGZvciB0ZXN0aW5nIHdpdGggYSBjb21waWxlciBmYWN0b3J5LCBhIFBsYXRmb3JtUmVmLCBhbmQgYW5cbiAgICogYW5ndWxhciBtb2R1bGUuIFRoZXNlIGFyZSBjb21tb24gdG8gZXZlcnkgdGVzdCBpbiB0aGUgc3VpdGUuXG4gICAqXG4gICAqIFRoaXMgbWF5IG9ubHkgYmUgY2FsbGVkIG9uY2UsIHRvIHNldCB1cCB0aGUgY29tbW9uIHByb3ZpZGVycyBmb3IgdGhlIGN1cnJlbnQgdGVzdFxuICAgKiBzdWl0ZSBvbiB0aGUgY3VycmVudCBwbGF0Zm9ybS4gSWYgeW91IGFic29sdXRlbHkgbmVlZCB0byBjaGFuZ2UgdGhlIHByb3ZpZGVycyxcbiAgICogZmlyc3QgdXNlIGByZXNldFRlc3RFbnZpcm9ubWVudGAuXG4gICAqXG4gICAqIFRlc3QgbW9kdWxlcyBhbmQgcGxhdGZvcm1zIGZvciBpbmRpdmlkdWFsIHBsYXRmb3JtcyBhcmUgYXZhaWxhYmxlIGZyb21cbiAgICogJ0Bhbmd1bGFyLzxwbGF0Zm9ybV9uYW1lPi90ZXN0aW5nJy5cbiAgICpcbiAgICogQHB1YmxpY0FwaVxuICAgKi9cbiAgaW5pdFRlc3RFbnZpcm9ubWVudChcbiAgICAgIG5nTW9kdWxlOiBUeXBlPGFueT58VHlwZTxhbnk+W10sIHBsYXRmb3JtOiBQbGF0Zm9ybVJlZiwgYW90U3VtbWFyaWVzPzogKCkgPT4gYW55W10pOiB2b2lkIHtcbiAgICBpZiAodGhpcy5wbGF0Zm9ybSB8fCB0aGlzLm5nTW9kdWxlKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0Nhbm5vdCBzZXQgYmFzZSBwcm92aWRlcnMgYmVjYXVzZSBpdCBoYXMgYWxyZWFkeSBiZWVuIGNhbGxlZCcpO1xuICAgIH1cbiAgICB0aGlzLnBsYXRmb3JtID0gcGxhdGZvcm07XG4gICAgdGhpcy5uZ01vZHVsZSA9IG5nTW9kdWxlO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlc2V0IHRoZSBwcm92aWRlcnMgZm9yIHRoZSB0ZXN0IGluamVjdG9yLlxuICAgKlxuICAgKiBAcHVibGljQXBpXG4gICAqL1xuICByZXNldFRlc3RFbnZpcm9ubWVudCgpOiB2b2lkIHtcbiAgICB0aGlzLnJlc2V0VGVzdGluZ01vZHVsZSgpO1xuICAgIHRoaXMucGxhdGZvcm0gPSBudWxsICE7XG4gICAgdGhpcy5uZ01vZHVsZSA9IG51bGwgITtcbiAgfVxuXG4gIHJlc2V0VGVzdGluZ01vZHVsZSgpOiB2b2lkIHtcbiAgICB0aGlzLl9jaGVja0dsb2JhbENvbXBpbGF0aW9uRmluaXNoZWQoKTtcbiAgICByZXNldENvbXBpbGVkQ29tcG9uZW50cygpO1xuICAgIC8vIHJlc2V0IG1ldGFkYXRhIG92ZXJyaWRlc1xuICAgIHRoaXMuX21vZHVsZU92ZXJyaWRlcyA9IFtdO1xuICAgIHRoaXMuX2NvbXBvbmVudE92ZXJyaWRlcyA9IFtdO1xuICAgIHRoaXMuX2RpcmVjdGl2ZU92ZXJyaWRlcyA9IFtdO1xuICAgIHRoaXMuX3BpcGVPdmVycmlkZXMgPSBbXTtcbiAgICB0aGlzLl9wcm92aWRlck92ZXJyaWRlcyA9IFtdO1xuICAgIHRoaXMuX3Jvb3RQcm92aWRlck92ZXJyaWRlcyA9IFtdO1xuICAgIHRoaXMuX3Byb3ZpZGVyT3ZlcnJpZGVzQnlUb2tlbi5jbGVhcigpO1xuICAgIHRoaXMuX3RlbXBsYXRlT3ZlcnJpZGVzLmNsZWFyKCk7XG4gICAgdGhpcy5fcmVzb2x2ZXJzID0gbnVsbCAhO1xuXG4gICAgLy8gcmVzZXQgdGVzdCBtb2R1bGUgY29uZmlnXG4gICAgdGhpcy5fcHJvdmlkZXJzID0gW107XG4gICAgdGhpcy5fY29tcGlsZXJPcHRpb25zID0gW107XG4gICAgdGhpcy5fY29tcGlsZXJQcm92aWRlcnMgPSBbXTtcbiAgICB0aGlzLl9kZWNsYXJhdGlvbnMgPSBbXTtcbiAgICB0aGlzLl9pbXBvcnRzID0gW107XG4gICAgdGhpcy5fc2NoZW1hcyA9IFtdO1xuICAgIHRoaXMuX21vZHVsZVJlZiA9IG51bGwgITtcbiAgICB0aGlzLl90ZXN0TW9kdWxlVHlwZSA9IG51bGwgITtcblxuICAgIHRoaXMuX2NvbXBpbGVySW5qZWN0b3IgPSBudWxsICE7XG4gICAgdGhpcy5faW5zdGFudGlhdGVkID0gZmFsc2U7XG4gICAgdGhpcy5fYWN0aXZlRml4dHVyZXMuZm9yRWFjaCgoZml4dHVyZSkgPT4ge1xuICAgICAgdHJ5IHtcbiAgICAgICAgZml4dHVyZS5kZXN0cm95KCk7XG4gICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIGR1cmluZyBjbGVhbnVwIG9mIGNvbXBvbmVudCcsIHtcbiAgICAgICAgICBjb21wb25lbnQ6IGZpeHR1cmUuY29tcG9uZW50SW5zdGFuY2UsXG4gICAgICAgICAgc3RhY2t0cmFjZTogZSxcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgdGhpcy5fYWN0aXZlRml4dHVyZXMgPSBbXTtcblxuICAgIC8vIHJlc3RvcmUgaW5pdGlhbCBjb21wb25lbnQvZGlyZWN0aXZlL3BpcGUgZGVmc1xuICAgIHRoaXMuX2luaXRpYWxOZ0RlZnMuZm9yRWFjaCgodmFsdWU6IFtzdHJpbmcsIFByb3BlcnR5RGVzY3JpcHRvcl0sIHR5cGU6IFR5cGU8YW55PikgPT4ge1xuICAgICAgY29uc3QgW3Byb3AsIGRlc2NyaXB0b3JdID0gdmFsdWU7XG4gICAgICBpZiAoIWRlc2NyaXB0b3IpIHtcbiAgICAgICAgLy8gRGVsZXRlIG9wZXJhdGlvbnMgYXJlIGdlbmVyYWxseSB1bmRlc2lyYWJsZSBzaW5jZSB0aGV5IGhhdmUgcGVyZm9ybWFuY2UgaW1wbGljYXRpb25zIG9uXG4gICAgICAgIC8vIG9iamVjdHMgdGhleSB3ZXJlIGFwcGxpZWQgdG8uIEluIHRoaXMgcGFydGljdWxhciBjYXNlLCBzaXR1YXRpb25zIHdoZXJlIHRoaXMgY29kZSBpc1xuICAgICAgICAvLyBpbnZva2VkIHNob3VsZCBiZSBxdWl0ZSByYXJlIHRvIGNhdXNlIGFueSBub3RpY2FibGUgaW1wYWN0LCBzaW5jZSBpdCdzIGFwcGxpZWQgb25seSB0b1xuICAgICAgICAvLyBzb21lIHRlc3QgY2FzZXMgKGZvciBleGFtcGxlIHdoZW4gY2xhc3Mgd2l0aCBubyBhbm5vdGF0aW9ucyBleHRlbmRzIHNvbWUgQENvbXBvbmVudCkgd2hlblxuICAgICAgICAvLyB3ZSBuZWVkIHRvIGNsZWFyICduZ0NvbXBvbmVudERlZicgZmllbGQgb24gYSBnaXZlbiBjbGFzcyB0byByZXN0b3JlIGl0cyBvcmlnaW5hbCBzdGF0ZVxuICAgICAgICAvLyAoYmVmb3JlIGFwcGx5aW5nIG92ZXJyaWRlcyBhbmQgcnVubmluZyB0ZXN0cykuXG4gICAgICAgIGRlbGV0ZSAodHlwZSBhcyBhbnkpW3Byb3BdO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHR5cGUsIHByb3AsIGRlc2NyaXB0b3IpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHRoaXMuX2luaXRpYWxOZ0RlZnMuY2xlYXIoKTtcbiAgICB0aGlzLl9yZXN0b3JlQ29tcG9uZW50UmVzb2x1dGlvblF1ZXVlKCk7XG4gIH1cblxuICBjb25maWd1cmVDb21waWxlcihjb25maWc6IHtwcm92aWRlcnM/OiBhbnlbXTsgdXNlSml0PzogYm9vbGVhbjt9KTogdm9pZCB7XG4gICAgaWYgKGNvbmZpZy51c2VKaXQgIT0gbnVsbCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCd0aGUgUmVuZGVyMyBjb21waWxlciBKaVQgbW9kZSBpcyBub3QgY29uZmlndXJhYmxlICEnKTtcbiAgICB9XG5cbiAgICBpZiAoY29uZmlnLnByb3ZpZGVycykge1xuICAgICAgdGhpcy5fcHJvdmlkZXJPdmVycmlkZXMucHVzaCguLi5jb25maWcucHJvdmlkZXJzKTtcbiAgICAgIHRoaXMuX2NvbXBpbGVyUHJvdmlkZXJzLnB1c2goLi4uY29uZmlnLnByb3ZpZGVycyk7XG4gICAgfVxuICB9XG5cbiAgY29uZmlndXJlVGVzdGluZ01vZHVsZShtb2R1bGVEZWY6IFRlc3RNb2R1bGVNZXRhZGF0YSk6IHZvaWQge1xuICAgIHRoaXMuX2Fzc2VydE5vdEluc3RhbnRpYXRlZCgnUjNUZXN0QmVkLmNvbmZpZ3VyZVRlc3RpbmdNb2R1bGUnLCAnY29uZmlndXJlIHRoZSB0ZXN0IG1vZHVsZScpO1xuICAgIGlmIChtb2R1bGVEZWYucHJvdmlkZXJzKSB7XG4gICAgICB0aGlzLl9wcm92aWRlcnMucHVzaCguLi5tb2R1bGVEZWYucHJvdmlkZXJzKTtcbiAgICB9XG4gICAgaWYgKG1vZHVsZURlZi5kZWNsYXJhdGlvbnMpIHtcbiAgICAgIHRoaXMuX2RlY2xhcmF0aW9ucy5wdXNoKC4uLm1vZHVsZURlZi5kZWNsYXJhdGlvbnMpO1xuICAgIH1cbiAgICBpZiAobW9kdWxlRGVmLmltcG9ydHMpIHtcbiAgICAgIHRoaXMuX2ltcG9ydHMucHVzaCguLi5tb2R1bGVEZWYuaW1wb3J0cyk7XG4gICAgfVxuICAgIGlmIChtb2R1bGVEZWYuc2NoZW1hcykge1xuICAgICAgdGhpcy5fc2NoZW1hcy5wdXNoKC4uLm1vZHVsZURlZi5zY2hlbWFzKTtcbiAgICB9XG4gIH1cblxuICBjb21waWxlQ29tcG9uZW50cygpOiBQcm9taXNlPGFueT4ge1xuICAgIHRoaXMuX2NsZWFyQ29tcG9uZW50UmVzb2x1dGlvblF1ZXVlKCk7XG5cbiAgICBjb25zdCByZXNvbHZlcnMgPSB0aGlzLl9nZXRSZXNvbHZlcnMoKTtcbiAgICBjb25zdCBkZWNsYXJhdGlvbnM6IFR5cGU8YW55PltdID0gZmxhdHRlbih0aGlzLl9kZWNsYXJhdGlvbnMgfHwgRU1QVFlfQVJSQVksIHJlc29sdmVGb3J3YXJkUmVmKTtcblxuICAgIGNvbnN0IGNvbXBvbmVudE92ZXJyaWRlczogW1R5cGU8YW55PiwgQ29tcG9uZW50XVtdID0gW107XG4gICAgY29uc3QgcHJvdmlkZXJPdmVycmlkZXM6ICgoKSA9PiB2b2lkKVtdID0gW107XG4gICAgbGV0IGhhc0FzeW5jUmVzb3VyY2VzID0gZmFsc2U7XG5cbiAgICAvLyBDb21waWxlIHRoZSBjb21wb25lbnRzIGRlY2xhcmVkIGJ5IHRoaXMgbW9kdWxlXG4gICAgLy8gVE9ETyhGVy0xMTc4KTogYGNvbXBpbGVDb21wb25lbnRzYCBzaG91bGQgbm90IGR1cGxpY2F0ZSBgX2NvbXBpbGVOZ01vZHVsZWAgbG9naWNcbiAgICBkZWNsYXJhdGlvbnMuZm9yRWFjaChkZWNsYXJhdGlvbiA9PiB7XG4gICAgICBjb25zdCBjb21wb25lbnQgPSByZXNvbHZlcnMuY29tcG9uZW50LnJlc29sdmUoZGVjbGFyYXRpb24pO1xuICAgICAgaWYgKGNvbXBvbmVudCkge1xuICAgICAgICBpZiAoIWRlY2xhcmF0aW9uLmhhc093blByb3BlcnR5KE5HX0NPTVBPTkVOVF9ERUYpIHx8XG4gICAgICAgICAgICBpc0NvbXBvbmVudERlZlBlbmRpbmdSZXNvbHV0aW9uKGRlY2xhcmF0aW9uKSB8fCAgLy9cbiAgICAgICAgICAgIC8vIENvbXBpbGVyIHByb3ZpZGVyIG92ZXJyaWRlcyAobGlrZSBSZXNvdXJjZUxvYWRlcikgbWlnaHQgYWZmZWN0IHRoZSBvdXRjb21lIG9mXG4gICAgICAgICAgICAvLyBjb21waWxhdGlvbiwgc28gd2UgdHJpZ2dlciBgY29tcGlsZUNvbXBvbmVudGAgaW4gY2FzZSB3ZSBoYXZlIGNvbXBpbGVycyBvdmVycmlkZXMuXG4gICAgICAgICAgICB0aGlzLl9jb21waWxlclByb3ZpZGVycy5sZW5ndGggPiAwIHx8XG4gICAgICAgICAgICB0aGlzLl9oYXNUeXBlT3ZlcnJpZGVzKGRlY2xhcmF0aW9uLCB0aGlzLl9jb21wb25lbnRPdmVycmlkZXMpIHx8XG4gICAgICAgICAgICB0aGlzLl9oYXNUZW1wbGF0ZU92ZXJyaWRlcyhkZWNsYXJhdGlvbikpIHtcbiAgICAgICAgICB0aGlzLl9zdG9yZU5nRGVmKE5HX0NPTVBPTkVOVF9ERUYsIGRlY2xhcmF0aW9uKTtcbiAgICAgICAgICAvLyBXZSBtYWtlIGEgY29weSBvZiB0aGUgbWV0YWRhdGEgdG8gZW5zdXJlIHRoYXQgd2UgZG9uJ3QgbXV0YXRlIHRoZSBvcmlnaW5hbCBtZXRhZGF0YVxuICAgICAgICAgIGNvbnN0IG1ldGFkYXRhID0gey4uLmNvbXBvbmVudH07XG4gICAgICAgICAgY29tcGlsZUNvbXBvbmVudChkZWNsYXJhdGlvbiwgbWV0YWRhdGEpO1xuICAgICAgICAgIGNvbXBvbmVudE92ZXJyaWRlcy5wdXNoKFtkZWNsYXJhdGlvbiwgbWV0YWRhdGFdKTtcbiAgICAgICAgICBoYXNBc3luY1Jlc291cmNlcyA9IGhhc0FzeW5jUmVzb3VyY2VzIHx8IGNvbXBvbmVudE5lZWRzUmVzb2x1dGlvbihjb21wb25lbnQpO1xuICAgICAgICB9IGVsc2UgaWYgKHRoaXMuX2hhc1Byb3ZpZGVyT3ZlcnJpZGVzKGNvbXBvbmVudC5wcm92aWRlcnMpKSB7XG4gICAgICAgICAgLy8gUXVldWUgcHJvdmlkZXIgb3ZlcnJpZGUgb3BlcmF0aW9ucywgc2luY2UgZmV0Y2hpbmcgbmdDb21wb25lbnREZWYgKHRvIHBhdGNoIGl0KSBtaWdodFxuICAgICAgICAgIC8vIHRyaWdnZXIgcmUtY29tcGlsYXRpb24sIHdoaWNoIHdpbGwgZmFpbCBiZWNhdXNlIGNvbXBvbmVudCByZXNvdXJjZXMgYXJlIG5vdCB5ZXQgZnVsbHlcbiAgICAgICAgICAvLyByZXNvbHZlZCBhdCB0aGlzIG1vbWVudC4gVGhlIHF1ZXVlIGlzIGRyYWluZWQgb25jZSBhbGwgcmVzb3VyY2VzIGFyZSByZXNvbHZlZC5cbiAgICAgICAgICBwcm92aWRlck92ZXJyaWRlcy5wdXNoKFxuICAgICAgICAgICAgICAoKSA9PiB0aGlzLl9wYXRjaERlZldpdGhQcm92aWRlck92ZXJyaWRlcyhkZWNsYXJhdGlvbiwgTkdfQ09NUE9ORU5UX0RFRikpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBjb25zdCBvdmVycmlkZUNvbXBvbmVudHMgPSAoKSA9PiB7XG4gICAgICBjb21wb25lbnRPdmVycmlkZXMuZm9yRWFjaCgob3ZlcnJpZGU6IFtUeXBlPGFueT4sIENvbXBvbmVudF0pID0+IHtcbiAgICAgICAgLy8gT3ZlcnJpZGUgdGhlIGV4aXN0aW5nIG1ldGFkYXRhLCBlbnN1cmluZyB0aGF0IHRoZSByZXNvbHZlZCByZXNvdXJjZXNcbiAgICAgICAgLy8gYXJlIG9ubHkgYXZhaWxhYmxlIHVudGlsIHRoZSBuZXh0IFRlc3RCZWQgcmVzZXQgKHdoZW4gYHJlc2V0VGVzdGluZ01vZHVsZWAgaXMgY2FsbGVkKVxuICAgICAgICB0aGlzLm92ZXJyaWRlQ29tcG9uZW50KG92ZXJyaWRlWzBdLCB7c2V0OiBvdmVycmlkZVsxXX0pO1xuICAgICAgfSk7XG4gICAgICBwcm92aWRlck92ZXJyaWRlcy5mb3JFYWNoKChvdmVycmlkZUZuOiAoKSA9PiB2b2lkKSA9PiBvdmVycmlkZUZuKCkpO1xuICAgIH07XG5cbiAgICAvLyBJZiB0aGUgY29tcG9uZW50IGhhcyBubyBhc3luYyByZXNvdXJjZXMgKHRlbXBsYXRlVXJsLCBzdHlsZVVybHMpLCB3ZSBjYW4gZmluaXNoXG4gICAgLy8gc3luY2hyb25vdXNseS4gVGhpcyBpcyBpbXBvcnRhbnQgc28gdGhhdCB1c2VycyB3aG8gbWlzdGFrZW5seSB0cmVhdCBgY29tcGlsZUNvbXBvbmVudHNgXG4gICAgLy8gYXMgc3luY2hyb25vdXMgZG9uJ3QgZW5jb3VudGVyIGFuIGVycm9yLCBhcyBWaWV3RW5naW5lIHdhcyB0b2xlcmFudCBvZiB0aGlzLlxuICAgIGlmICghaGFzQXN5bmNSZXNvdXJjZXMpIHtcbiAgICAgIG92ZXJyaWRlQ29tcG9uZW50cygpO1xuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICAgIH0gZWxzZSB7XG4gICAgICBsZXQgcmVzb3VyY2VMb2FkZXI6IFJlc291cmNlTG9hZGVyO1xuICAgICAgcmV0dXJuIHJlc29sdmVDb21wb25lbnRSZXNvdXJjZXModXJsID0+IHtcbiAgICAgICAgICAgICAgIGlmICghcmVzb3VyY2VMb2FkZXIpIHtcbiAgICAgICAgICAgICAgICAgcmVzb3VyY2VMb2FkZXIgPSB0aGlzLmNvbXBpbGVySW5qZWN0b3IuZ2V0KFJlc291cmNlTG9hZGVyKTtcbiAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUocmVzb3VyY2VMb2FkZXIuZ2V0KHVybCkpO1xuICAgICAgICAgICAgIH0pXG4gICAgICAgICAgLnRoZW4ob3ZlcnJpZGVDb21wb25lbnRzKTtcbiAgICB9XG4gIH1cblxuICBnZXQodG9rZW46IGFueSwgbm90Rm91bmRWYWx1ZTogYW55ID0gSW5qZWN0b3IuVEhST1dfSUZfTk9UX0ZPVU5EKTogYW55IHtcbiAgICB0aGlzLl9pbml0SWZOZWVkZWQoKTtcbiAgICBpZiAodG9rZW4gPT09IFRlc3RCZWRSZW5kZXIzKSB7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgY29uc3QgcmVzdWx0ID0gdGhpcy5fbW9kdWxlUmVmLmluamVjdG9yLmdldCh0b2tlbiwgVU5ERUZJTkVEKTtcbiAgICByZXR1cm4gcmVzdWx0ID09PSBVTkRFRklORUQgPyB0aGlzLmNvbXBpbGVySW5qZWN0b3IuZ2V0KHRva2VuLCBub3RGb3VuZFZhbHVlKSA6IHJlc3VsdDtcbiAgfVxuXG4gIGV4ZWN1dGUodG9rZW5zOiBhbnlbXSwgZm46IEZ1bmN0aW9uLCBjb250ZXh0PzogYW55KTogYW55IHtcbiAgICB0aGlzLl9pbml0SWZOZWVkZWQoKTtcbiAgICBjb25zdCBwYXJhbXMgPSB0b2tlbnMubWFwKHQgPT4gdGhpcy5nZXQodCkpO1xuICAgIHJldHVybiBmbi5hcHBseShjb250ZXh0LCBwYXJhbXMpO1xuICB9XG5cbiAgb3ZlcnJpZGVNb2R1bGUobmdNb2R1bGU6IFR5cGU8YW55Piwgb3ZlcnJpZGU6IE1ldGFkYXRhT3ZlcnJpZGU8TmdNb2R1bGU+KTogdm9pZCB7XG4gICAgdGhpcy5fYXNzZXJ0Tm90SW5zdGFudGlhdGVkKCdvdmVycmlkZU1vZHVsZScsICdvdmVycmlkZSBtb2R1bGUgbWV0YWRhdGEnKTtcbiAgICB0aGlzLl9tb2R1bGVPdmVycmlkZXMucHVzaChbbmdNb2R1bGUsIG92ZXJyaWRlXSk7XG4gIH1cblxuICBvdmVycmlkZUNvbXBvbmVudChjb21wb25lbnQ6IFR5cGU8YW55Piwgb3ZlcnJpZGU6IE1ldGFkYXRhT3ZlcnJpZGU8Q29tcG9uZW50Pik6IHZvaWQge1xuICAgIHRoaXMuX2Fzc2VydE5vdEluc3RhbnRpYXRlZCgnb3ZlcnJpZGVDb21wb25lbnQnLCAnb3ZlcnJpZGUgY29tcG9uZW50IG1ldGFkYXRhJyk7XG4gICAgdGhpcy5fY29tcG9uZW50T3ZlcnJpZGVzLnB1c2goW2NvbXBvbmVudCwgb3ZlcnJpZGVdKTtcbiAgfVxuXG4gIG92ZXJyaWRlRGlyZWN0aXZlKGRpcmVjdGl2ZTogVHlwZTxhbnk+LCBvdmVycmlkZTogTWV0YWRhdGFPdmVycmlkZTxEaXJlY3RpdmU+KTogdm9pZCB7XG4gICAgdGhpcy5fYXNzZXJ0Tm90SW5zdGFudGlhdGVkKCdvdmVycmlkZURpcmVjdGl2ZScsICdvdmVycmlkZSBkaXJlY3RpdmUgbWV0YWRhdGEnKTtcbiAgICB0aGlzLl9kaXJlY3RpdmVPdmVycmlkZXMucHVzaChbZGlyZWN0aXZlLCBvdmVycmlkZV0pO1xuICB9XG5cbiAgb3ZlcnJpZGVQaXBlKHBpcGU6IFR5cGU8YW55Piwgb3ZlcnJpZGU6IE1ldGFkYXRhT3ZlcnJpZGU8UGlwZT4pOiB2b2lkIHtcbiAgICB0aGlzLl9hc3NlcnROb3RJbnN0YW50aWF0ZWQoJ292ZXJyaWRlUGlwZScsICdvdmVycmlkZSBwaXBlIG1ldGFkYXRhJyk7XG4gICAgdGhpcy5fcGlwZU92ZXJyaWRlcy5wdXNoKFtwaXBlLCBvdmVycmlkZV0pO1xuICB9XG5cbiAgLyoqXG4gICAqIE92ZXJ3cml0ZXMgYWxsIHByb3ZpZGVycyBmb3IgdGhlIGdpdmVuIHRva2VuIHdpdGggdGhlIGdpdmVuIHByb3ZpZGVyIGRlZmluaXRpb24uXG4gICAqL1xuICBvdmVycmlkZVByb3ZpZGVyKHRva2VuOiBhbnksIHByb3ZpZGVyOiB7dXNlRmFjdG9yeT86IEZ1bmN0aW9uLCB1c2VWYWx1ZT86IGFueSwgZGVwcz86IGFueVtdfSk6XG4gICAgICB2b2lkIHtcbiAgICBjb25zdCBwcm92aWRlckRlZiA9IHByb3ZpZGVyLnVzZUZhY3RvcnkgP1xuICAgICAgICB7cHJvdmlkZTogdG9rZW4sIHVzZUZhY3Rvcnk6IHByb3ZpZGVyLnVzZUZhY3RvcnksIGRlcHM6IHByb3ZpZGVyLmRlcHMgfHwgW119IDpcbiAgICAgICAge3Byb3ZpZGU6IHRva2VuLCB1c2VWYWx1ZTogcHJvdmlkZXIudXNlVmFsdWV9O1xuXG4gICAgbGV0IGluamVjdGFibGVEZWY6IEluamVjdGFibGVEZWY8YW55PnxudWxsO1xuICAgIGNvbnN0IGlzUm9vdCA9XG4gICAgICAgICh0eXBlb2YgdG9rZW4gIT09ICdzdHJpbmcnICYmIChpbmplY3RhYmxlRGVmID0gZ2V0SW5qZWN0YWJsZURlZih0b2tlbikpICYmXG4gICAgICAgICBpbmplY3RhYmxlRGVmLnByb3ZpZGVkSW4gPT09ICdyb290Jyk7XG4gICAgY29uc3Qgb3ZlcnJpZGVzQnVja2V0ID0gaXNSb290ID8gdGhpcy5fcm9vdFByb3ZpZGVyT3ZlcnJpZGVzIDogdGhpcy5fcHJvdmlkZXJPdmVycmlkZXM7XG4gICAgb3ZlcnJpZGVzQnVja2V0LnB1c2gocHJvdmlkZXJEZWYpO1xuXG4gICAgLy8ga2VlcCBhbGwgb3ZlcnJpZGVzIGdyb3VwZWQgYnkgdG9rZW4gYXMgd2VsbCBmb3IgZmFzdCBsb29rdXBzIHVzaW5nIHRva2VuXG4gICAgY29uc3Qgb3ZlcnJpZGVzRm9yVG9rZW4gPSB0aGlzLl9wcm92aWRlck92ZXJyaWRlc0J5VG9rZW4uZ2V0KHRva2VuKSB8fCBbXTtcbiAgICBvdmVycmlkZXNGb3JUb2tlbi5wdXNoKHByb3ZpZGVyRGVmKTtcbiAgICB0aGlzLl9wcm92aWRlck92ZXJyaWRlc0J5VG9rZW4uc2V0KHRva2VuLCBvdmVycmlkZXNGb3JUb2tlbik7XG4gIH1cblxuICAvKipcbiAgICogT3ZlcndyaXRlcyBhbGwgcHJvdmlkZXJzIGZvciB0aGUgZ2l2ZW4gdG9rZW4gd2l0aCB0aGUgZ2l2ZW4gcHJvdmlkZXIgZGVmaW5pdGlvbi5cbiAgICpcbiAgICogQGRlcHJlY2F0ZWQgYXMgaXQgbWFrZXMgYWxsIE5nTW9kdWxlcyBsYXp5LiBJbnRyb2R1Y2VkIG9ubHkgZm9yIG1pZ3JhdGluZyBvZmYgb2YgaXQuXG4gICAqL1xuICBkZXByZWNhdGVkT3ZlcnJpZGVQcm92aWRlcih0b2tlbjogYW55LCBwcm92aWRlcjoge1xuICAgIHVzZUZhY3Rvcnk6IEZ1bmN0aW9uLFxuICAgIGRlcHM6IGFueVtdLFxuICB9KTogdm9pZDtcbiAgZGVwcmVjYXRlZE92ZXJyaWRlUHJvdmlkZXIodG9rZW46IGFueSwgcHJvdmlkZXI6IHt1c2VWYWx1ZTogYW55O30pOiB2b2lkO1xuICBkZXByZWNhdGVkT3ZlcnJpZGVQcm92aWRlcihcbiAgICAgIHRva2VuOiBhbnksIHByb3ZpZGVyOiB7dXNlRmFjdG9yeT86IEZ1bmN0aW9uLCB1c2VWYWx1ZT86IGFueSwgZGVwcz86IGFueVtdfSk6IHZvaWQge1xuICAgIC8vIEhBQ0s6IFRoaXMgaXMgTk9UIHRoZSBjb3JyZWN0IGltcGxlbWVudGF0aW9uIGZvciBkZXByZWNhdGVkT3ZlcnJpZGVQcm92aWRlci5cbiAgICAvLyBUbyBpbXBsZW1lbnQgaXQgaW4gYSBiYWNrd2FyZCBjb21wYXRpYmxlIHdheSwgd2Ugd291bGQgbmVlZCB0byByZWNvcmQgc29tZSBzdGF0ZVxuICAgIC8vIHNvIHdlIGtub3cgdG8gcHJldmVudCBlYWdlciBpbnN0YW50aWF0aW9uIG9mIE5nTW9kdWxlcy4gSG93ZXZlciwgd2UgZG9uJ3QgcGxhblxuICAgIC8vIHRvIGltcGxlbWVudCB0aGlzIGF0IGFsbCBzaW5jZSB0aGUgQVBJIGlzIGRlcHJlY2F0ZWQgYW5kIHNjaGVkdWxlZCBmb3IgcmVtb3ZhbFxuICAgIC8vIGluIFY4LiBUaGlzIGhhY2sgaXMgaGVyZSB0ZW1wb3JhcmlseSBmb3IgSXZ5IHRlc3RpbmcgdW50aWwgd2UgdHJhbnNpdGlvbiBhcHBzXG4gICAgLy8gaW5zaWRlIEdvb2dsZSB0byB0aGUgb3ZlcnJpZGVQcm92aWRlciBBUEkuIEF0IHRoYXQgcG9pbnQsIHdlIHdpbGwgYmUgYWJsZSB0b1xuICAgIC8vIHJlbW92ZSB0aGlzIG1ldGhvZCBlbnRpcmVseS4gSW4gdGhlIG1lYW50aW1lLCB3ZSBjYW4gdXNlIG92ZXJyaWRlUHJvdmlkZXIgdG9cbiAgICAvLyB0ZXN0IGFwcHMgd2l0aCBJdnkgdGhhdCBkb24ndCBjYXJlIGFib3V0IGVhZ2VyIGluc3RhbnRpYXRpb24uIFRoaXMgZml4ZXMgODUlXG4gICAgLy8gb2YgY2FzZXMgaW4gb3VyIGJsdWVwcmludC5cbiAgICB0aGlzLm92ZXJyaWRlUHJvdmlkZXIodG9rZW4sIHByb3ZpZGVyIGFzIGFueSk7XG4gIH1cblxuICBjcmVhdGVDb21wb25lbnQ8VD4odHlwZTogVHlwZTxUPik6IENvbXBvbmVudEZpeHR1cmU8VD4ge1xuICAgIHRoaXMuX2luaXRJZk5lZWRlZCgpO1xuXG4gICAgY29uc3QgdGVzdENvbXBvbmVudFJlbmRlcmVyOiBUZXN0Q29tcG9uZW50UmVuZGVyZXIgPSB0aGlzLmdldChUZXN0Q29tcG9uZW50UmVuZGVyZXIpO1xuICAgIGNvbnN0IHJvb3RFbElkID0gYHJvb3Qke19uZXh0Um9vdEVsZW1lbnRJZCsrfWA7XG4gICAgdGVzdENvbXBvbmVudFJlbmRlcmVyLmluc2VydFJvb3RFbGVtZW50KHJvb3RFbElkKTtcblxuICAgIGNvbnN0IGNvbXBvbmVudERlZiA9ICh0eXBlIGFzIGFueSkubmdDb21wb25lbnREZWY7XG5cbiAgICBpZiAoIWNvbXBvbmVudERlZikge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgIGBJdCBsb29rcyBsaWtlICcke3N0cmluZ2lmeSh0eXBlKX0nIGhhcyBub3QgYmVlbiBJVlkgY29tcGlsZWQgLSBpdCBoYXMgbm8gJ25nQ29tcG9uZW50RGVmJyBmaWVsZGApO1xuICAgIH1cblxuICAgIGNvbnN0IG5vTmdab25lOiBib29sZWFuID0gdGhpcy5nZXQoQ29tcG9uZW50Rml4dHVyZU5vTmdab25lLCBmYWxzZSk7XG4gICAgY29uc3QgYXV0b0RldGVjdDogYm9vbGVhbiA9IHRoaXMuZ2V0KENvbXBvbmVudEZpeHR1cmVBdXRvRGV0ZWN0LCBmYWxzZSk7XG4gICAgY29uc3Qgbmdab25lOiBOZ1pvbmUgPSBub05nWm9uZSA/IG51bGwgOiB0aGlzLmdldChOZ1pvbmUsIG51bGwpO1xuICAgIGNvbnN0IGNvbXBvbmVudEZhY3RvcnkgPSBuZXcgQ29tcG9uZW50RmFjdG9yeShjb21wb25lbnREZWYpO1xuICAgIGNvbnN0IGluaXRDb21wb25lbnQgPSAoKSA9PiB7XG4gICAgICBjb25zdCBjb21wb25lbnRSZWYgPVxuICAgICAgICAgIGNvbXBvbmVudEZhY3RvcnkuY3JlYXRlKEluamVjdG9yLk5VTEwsIFtdLCBgIyR7cm9vdEVsSWR9YCwgdGhpcy5fbW9kdWxlUmVmKTtcbiAgICAgIHJldHVybiBuZXcgQ29tcG9uZW50Rml4dHVyZTxhbnk+KGNvbXBvbmVudFJlZiwgbmdab25lLCBhdXRvRGV0ZWN0KTtcbiAgICB9O1xuICAgIGNvbnN0IGZpeHR1cmUgPSBuZ1pvbmUgPyBuZ1pvbmUucnVuKGluaXRDb21wb25lbnQpIDogaW5pdENvbXBvbmVudCgpO1xuICAgIHRoaXMuX2FjdGl2ZUZpeHR1cmVzLnB1c2goZml4dHVyZSk7XG4gICAgcmV0dXJuIGZpeHR1cmU7XG4gIH1cblxuICAvLyBpbnRlcm5hbCBtZXRob2RzXG5cbiAgcHJpdmF0ZSBfaW5pdElmTmVlZGVkKCk6IHZvaWQge1xuICAgIHRoaXMuX2NoZWNrR2xvYmFsQ29tcGlsYXRpb25GaW5pc2hlZCgpO1xuICAgIGlmICh0aGlzLl9pbnN0YW50aWF0ZWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLl9yZXNvbHZlcnMgPSB0aGlzLl9nZXRSZXNvbHZlcnMoKTtcbiAgICB0aGlzLl90ZXN0TW9kdWxlVHlwZSA9IHRoaXMuX2NyZWF0ZVRlc3RNb2R1bGUoKTtcbiAgICB0aGlzLl9jb21waWxlTmdNb2R1bGUodGhpcy5fdGVzdE1vZHVsZVR5cGUpO1xuXG4gICAgY29uc3QgcGFyZW50SW5qZWN0b3IgPSB0aGlzLnBsYXRmb3JtLmluamVjdG9yO1xuICAgIHRoaXMuX21vZHVsZVJlZiA9IG5ldyBOZ01vZHVsZVJlZih0aGlzLl90ZXN0TW9kdWxlVHlwZSwgcGFyZW50SW5qZWN0b3IpO1xuXG4gICAgLy8gQXBwbGljYXRpb25Jbml0U3RhdHVzLnJ1bkluaXRpYWxpemVycygpIGlzIG1hcmtlZCBAaW50ZXJuYWxcbiAgICAvLyB0byBjb3JlLiBDYXN0IGl0IHRvIGFueSBiZWZvcmUgYWNjZXNzaW5nIGl0LlxuICAgICh0aGlzLl9tb2R1bGVSZWYuaW5qZWN0b3IuZ2V0KEFwcGxpY2F0aW9uSW5pdFN0YXR1cykgYXMgYW55KS5ydW5Jbml0aWFsaXplcnMoKTtcbiAgICB0aGlzLl9pbnN0YW50aWF0ZWQgPSB0cnVlO1xuICB9XG5cbiAgcHJpdmF0ZSBfc3RvcmVOZ0RlZihwcm9wOiBzdHJpbmcsIHR5cGU6IFR5cGU8YW55Pikge1xuICAgIGlmICghdGhpcy5faW5pdGlhbE5nRGVmcy5oYXModHlwZSkpIHtcbiAgICAgIGNvbnN0IGN1cnJlbnREZWYgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHR5cGUsIHByb3ApO1xuICAgICAgdGhpcy5faW5pdGlhbE5nRGVmcy5zZXQodHlwZSwgW3Byb3AsIGN1cnJlbnREZWZdKTtcbiAgICB9XG4gIH1cblxuICAvLyBnZXQgb3ZlcnJpZGVzIGZvciBhIHNwZWNpZmljIHByb3ZpZGVyIChpZiBhbnkpXG4gIHByaXZhdGUgX2dldFByb3ZpZGVyT3ZlcnJpZGVzKHByb3ZpZGVyOiBhbnkpIHtcbiAgICBjb25zdCB0b2tlbiA9IHByb3ZpZGVyICYmIHR5cGVvZiBwcm92aWRlciA9PT0gJ29iamVjdCcgJiYgcHJvdmlkZXIuaGFzT3duUHJvcGVydHkoJ3Byb3ZpZGUnKSA/XG4gICAgICAgIHByb3ZpZGVyLnByb3ZpZGUgOlxuICAgICAgICBwcm92aWRlcjtcbiAgICByZXR1cm4gdGhpcy5fcHJvdmlkZXJPdmVycmlkZXNCeVRva2VuLmdldCh0b2tlbikgfHwgW107XG4gIH1cblxuICAvLyBjcmVhdGVzIHJlc29sdmVycyB0YWtpbmcgb3ZlcnJpZGVzIGludG8gYWNjb3VudFxuICBwcml2YXRlIF9nZXRSZXNvbHZlcnMoKSB7XG4gICAgY29uc3QgbW9kdWxlID0gbmV3IE5nTW9kdWxlUmVzb2x2ZXIoKTtcbiAgICBtb2R1bGUuc2V0T3ZlcnJpZGVzKHRoaXMuX21vZHVsZU92ZXJyaWRlcyk7XG5cbiAgICBjb25zdCBjb21wb25lbnQgPSBuZXcgQ29tcG9uZW50UmVzb2x2ZXIoKTtcbiAgICBjb21wb25lbnQuc2V0T3ZlcnJpZGVzKHRoaXMuX2NvbXBvbmVudE92ZXJyaWRlcyk7XG5cbiAgICBjb25zdCBkaXJlY3RpdmUgPSBuZXcgRGlyZWN0aXZlUmVzb2x2ZXIoKTtcbiAgICBkaXJlY3RpdmUuc2V0T3ZlcnJpZGVzKHRoaXMuX2RpcmVjdGl2ZU92ZXJyaWRlcyk7XG5cbiAgICBjb25zdCBwaXBlID0gbmV3IFBpcGVSZXNvbHZlcigpO1xuICAgIHBpcGUuc2V0T3ZlcnJpZGVzKHRoaXMuX3BpcGVPdmVycmlkZXMpO1xuXG4gICAgcmV0dXJuIHttb2R1bGUsIGNvbXBvbmVudCwgZGlyZWN0aXZlLCBwaXBlfTtcbiAgfVxuXG4gIHByaXZhdGUgX2Fzc2VydE5vdEluc3RhbnRpYXRlZChtZXRob2ROYW1lOiBzdHJpbmcsIG1ldGhvZERlc2NyaXB0aW9uOiBzdHJpbmcpIHtcbiAgICBpZiAodGhpcy5faW5zdGFudGlhdGVkKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgYENhbm5vdCAke21ldGhvZERlc2NyaXB0aW9ufSB3aGVuIHRoZSB0ZXN0IG1vZHVsZSBoYXMgYWxyZWFkeSBiZWVuIGluc3RhbnRpYXRlZC4gYCArXG4gICAgICAgICAgYE1ha2Ugc3VyZSB5b3UgYXJlIG5vdCB1c2luZyBcXGBpbmplY3RcXGAgYmVmb3JlIFxcYCR7bWV0aG9kTmFtZX1cXGAuYCk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBfY3JlYXRlVGVzdE1vZHVsZSgpOiBOZ01vZHVsZVR5cGUge1xuICAgIGNvbnN0IHJvb3RQcm92aWRlck92ZXJyaWRlcyA9IHRoaXMuX3Jvb3RQcm92aWRlck92ZXJyaWRlcztcblxuICAgIEBOZ01vZHVsZSh7XG4gICAgICBwcm92aWRlcnM6IFsuLi5yb290UHJvdmlkZXJPdmVycmlkZXNdLFxuICAgICAgaml0OiB0cnVlLFxuICAgIH0pXG4gICAgY2xhc3MgUm9vdFNjb3BlTW9kdWxlIHtcbiAgICB9XG5cbiAgICBjb25zdCBuZ1pvbmUgPSBuZXcgTmdab25lKHtlbmFibGVMb25nU3RhY2tUcmFjZTogdHJ1ZX0pO1xuICAgIGNvbnN0IHByb3ZpZGVycyA9IFtcbiAgICAgIHtwcm92aWRlOiBOZ1pvbmUsIHVzZVZhbHVlOiBuZ1pvbmV9LFxuICAgICAge3Byb3ZpZGU6IENvbXBpbGVyLCB1c2VGYWN0b3J5OiAoKSA9PiBuZXcgUjNUZXN0Q29tcGlsZXIodGhpcyl9LFxuICAgICAge3Byb3ZpZGU6IEVycm9ySGFuZGxlciwgdXNlQ2xhc3M6IFIzVGVzdEVycm9ySGFuZGxlcn0sXG4gICAgICAuLi50aGlzLl9wcm92aWRlcnMsXG4gICAgICAuLi50aGlzLl9wcm92aWRlck92ZXJyaWRlcyxcbiAgICBdO1xuXG4gICAgY29uc3QgZGVjbGFyYXRpb25zID0gdGhpcy5fZGVjbGFyYXRpb25zO1xuICAgIGNvbnN0IGltcG9ydHMgPSBbUm9vdFNjb3BlTW9kdWxlLCB0aGlzLm5nTW9kdWxlLCB0aGlzLl9pbXBvcnRzXTtcbiAgICBjb25zdCBzY2hlbWFzID0gdGhpcy5fc2NoZW1hcztcblxuICAgIEBOZ01vZHVsZSh7cHJvdmlkZXJzLCBkZWNsYXJhdGlvbnMsIGltcG9ydHMsIHNjaGVtYXMsIGppdDogdHJ1ZX0pXG4gICAgY2xhc3MgRHluYW1pY1Rlc3RNb2R1bGUge1xuICAgIH1cblxuICAgIHJldHVybiBEeW5hbWljVGVzdE1vZHVsZSBhcyBOZ01vZHVsZVR5cGU7XG4gIH1cblxuICBnZXQgY29tcGlsZXJJbmplY3RvcigpOiBJbmplY3RvciB7XG4gICAgaWYgKHRoaXMuX2NvbXBpbGVySW5qZWN0b3IgIT09IG51bGwpIHtcbiAgICAgIHJldHVybiB0aGlzLl9jb21waWxlckluamVjdG9yO1xuICAgIH1cblxuICAgIGNvbnN0IHByb3ZpZGVyczogU3RhdGljUHJvdmlkZXJbXSA9IFtdO1xuICAgIGNvbnN0IGNvbXBpbGVyT3B0aW9ucyA9IHRoaXMucGxhdGZvcm0uaW5qZWN0b3IuZ2V0KENPTVBJTEVSX09QVElPTlMpO1xuICAgIGNvbXBpbGVyT3B0aW9ucy5mb3JFYWNoKG9wdHMgPT4ge1xuICAgICAgaWYgKG9wdHMucHJvdmlkZXJzKSB7XG4gICAgICAgIHByb3ZpZGVycy5wdXNoKG9wdHMucHJvdmlkZXJzKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICBwcm92aWRlcnMucHVzaCguLi50aGlzLl9jb21waWxlclByb3ZpZGVycyk7XG5cbiAgICAvLyBUT0RPKG9jb21iZSk6IG1ha2UgdGhpcyB3b3JrIHdpdGggYW4gSW5qZWN0b3IgZGlyZWN0bHkgaW5zdGVhZCBvZiBjcmVhdGluZyBhIG1vZHVsZSBmb3IgaXRcbiAgICBATmdNb2R1bGUoe3Byb3ZpZGVyc30pXG4gICAgY2xhc3MgQ29tcGlsZXJNb2R1bGUge1xuICAgIH1cblxuICAgIGNvbnN0IENvbXBpbGVyTW9kdWxlRmFjdG9yeSA9IG5ldyBSM05nTW9kdWxlRmFjdG9yeShDb21waWxlck1vZHVsZSk7XG4gICAgdGhpcy5fY29tcGlsZXJJbmplY3RvciA9IENvbXBpbGVyTW9kdWxlRmFjdG9yeS5jcmVhdGUodGhpcy5wbGF0Zm9ybS5pbmplY3RvcikuaW5qZWN0b3I7XG4gICAgcmV0dXJuIHRoaXMuX2NvbXBpbGVySW5qZWN0b3I7XG4gIH1cblxuICAvKipcbiAgICogQ2xlYXJzIGN1cnJlbnQgY29tcG9uZW50cyByZXNvbHV0aW9uIHF1ZXVlLCBidXQgc3RvcmVzIHRoZSBzdGF0ZSBvZiB0aGUgcXVldWUsIHNvIHdlIGNhblxuICAgKiByZXN0b3JlIGl0IGxhdGVyLiBDbGVhcmluZyB0aGUgcXVldWUgaXMgcmVxdWlyZWQgYmVmb3JlIHdlIHRyeSB0byBjb21waWxlIGNvbXBvbmVudHMgKHZpYVxuICAgKiBgVGVzdEJlZC5jb21waWxlQ29tcG9uZW50c2ApLCBzbyB0aGF0IGNvbXBvbmVudCBkZWZzIGFyZSBpbiBzeW5jIHdpdGggdGhlIHJlc29sdXRpb24gcXVldWUuXG4gICAqL1xuICBwcml2YXRlIF9jbGVhckNvbXBvbmVudFJlc29sdXRpb25RdWV1ZSgpIHtcbiAgICBpZiAodGhpcy5fb3JpZ2luYWxDb21wb25lbnRSZXNvbHV0aW9uUXVldWUgPT09IG51bGwpIHtcbiAgICAgIHRoaXMuX29yaWdpbmFsQ29tcG9uZW50UmVzb2x1dGlvblF1ZXVlID0gbmV3IE1hcCgpO1xuICAgIH1cbiAgICBjbGVhclJlc29sdXRpb25PZkNvbXBvbmVudFJlc291cmNlc1F1ZXVlKCkuZm9yRWFjaChcbiAgICAgICAgKHZhbHVlLCBrZXkpID0+IHRoaXMuX29yaWdpbmFsQ29tcG9uZW50UmVzb2x1dGlvblF1ZXVlICEuc2V0KGtleSwgdmFsdWUpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXN0b3JlcyBjb21wb25lbnQgcmVzb2x1dGlvbiBxdWV1ZSB0byB0aGUgcHJldmlvdXNseSBzYXZlZCBzdGF0ZS4gVGhpcyBvcGVyYXRpb24gaXMgcGVyZm9ybWVkXG4gICAqIGFzIGEgcGFydCBvZiByZXN0b3JpbmcgdGhlIHN0YXRlIGFmdGVyIGNvbXBsZXRpb24gb2YgdGhlIGN1cnJlbnQgc2V0IG9mIHRlc3RzICh0aGF0IG1pZ2h0XG4gICAqIHBvdGVudGlhbGx5IG11dGF0ZSB0aGUgc3RhdGUpLlxuICAgKi9cbiAgcHJpdmF0ZSBfcmVzdG9yZUNvbXBvbmVudFJlc29sdXRpb25RdWV1ZSgpIHtcbiAgICBpZiAodGhpcy5fb3JpZ2luYWxDb21wb25lbnRSZXNvbHV0aW9uUXVldWUgIT09IG51bGwpIHtcbiAgICAgIHJlc3RvcmVDb21wb25lbnRSZXNvbHV0aW9uUXVldWUodGhpcy5fb3JpZ2luYWxDb21wb25lbnRSZXNvbHV0aW9uUXVldWUpO1xuICAgICAgdGhpcy5fb3JpZ2luYWxDb21wb25lbnRSZXNvbHV0aW9uUXVldWUgPSBudWxsO1xuICAgIH1cbiAgfVxuXG4gIC8vIFRPRE8oRlctMTE3OSk6IGRlZmluZSBiZXR0ZXIgdHlwZXMgZm9yIGFsbCBQcm92aWRlci1yZWxhdGVkIG9wZXJhdGlvbnMsIGF2b2lkIHVzaW5nIGBhbnlgLlxuICBwcml2YXRlIF9nZXRQcm92aWRlcnNPdmVycmlkZXMocHJvdmlkZXJzOiBhbnkpOiBhbnlbXSB7XG4gICAgaWYgKCFwcm92aWRlcnMgfHwgIXByb3ZpZGVycy5sZW5ndGgpIHJldHVybiBbXTtcbiAgICAvLyBUaGVyZSBhcmUgdHdvIGZsYXR0ZW5pbmcgb3BlcmF0aW9ucyBoZXJlLiBUaGUgaW5uZXIgZmxhdHRlbigpIG9wZXJhdGVzIG9uIHRoZSBtZXRhZGF0YSdzXG4gICAgLy8gcHJvdmlkZXJzIGFuZCBhcHBsaWVzIGEgbWFwcGluZyBmdW5jdGlvbiB3aGljaCByZXRyaWV2ZXMgb3ZlcnJpZGVzIGZvciBlYWNoIGluY29taW5nXG4gICAgLy8gcHJvdmlkZXIuIFRoZSBvdXRlciBmbGF0dGVuKCkgdGhlbiBmbGF0dGVucyB0aGUgcHJvZHVjZWQgb3ZlcnJpZGVzIGFycmF5LiBJZiB0aGlzIGlzIG5vdFxuICAgIC8vIGRvbmUsIHRoZSBhcnJheSBjYW4gY29udGFpbiBvdGhlciBlbXB0eSBhcnJheXMgKGUuZy4gYFtbXSwgW11dYCkgd2hpY2ggbGVhayBpbnRvIHRoZVxuICAgIC8vIHByb3ZpZGVycyBhcnJheSBhbmQgY29udGFtaW5hdGUgYW55IGVycm9yIG1lc3NhZ2VzIHRoYXQgbWlnaHQgYmUgZ2VuZXJhdGVkLlxuICAgIHJldHVybiBmbGF0dGVuKGZsYXR0ZW4ocHJvdmlkZXJzLCAocHJvdmlkZXI6IGFueSkgPT4gdGhpcy5fZ2V0UHJvdmlkZXJPdmVycmlkZXMocHJvdmlkZXIpKSk7XG4gIH1cblxuICBwcml2YXRlIF9oYXNQcm92aWRlck92ZXJyaWRlcyhwcm92aWRlcnM6IGFueSkge1xuICAgIHJldHVybiB0aGlzLl9nZXRQcm92aWRlcnNPdmVycmlkZXMocHJvdmlkZXJzKS5sZW5ndGggPiAwO1xuICB9XG5cbiAgcHJpdmF0ZSBfaGFzVHlwZU92ZXJyaWRlcyh0eXBlOiBUeXBlPGFueT4sIG92ZXJyaWRlczogW1R5cGU8YW55PiwgTWV0YWRhdGFPdmVycmlkZTxhbnk+XVtdKSB7XG4gICAgcmV0dXJuIG92ZXJyaWRlcy5zb21lKChvdmVycmlkZTogW1R5cGU8YW55PiwgTWV0YWRhdGFPdmVycmlkZTxhbnk+XSkgPT4gb3ZlcnJpZGVbMF0gPT09IHR5cGUpO1xuICB9XG5cbiAgcHJpdmF0ZSBfaGFzVGVtcGxhdGVPdmVycmlkZXModHlwZTogVHlwZTxhbnk+KSB7IHJldHVybiB0aGlzLl90ZW1wbGF0ZU92ZXJyaWRlcy5oYXModHlwZSk7IH1cblxuICBwcml2YXRlIF9nZXRNZXRhV2l0aE92ZXJyaWRlcyhtZXRhOiBDb21wb25lbnR8RGlyZWN0aXZlfE5nTW9kdWxlLCB0eXBlPzogVHlwZTxhbnk+KSB7XG4gICAgY29uc3Qgb3ZlcnJpZGVzOiB7cHJvdmlkZXJzPzogYW55W10sIHRlbXBsYXRlPzogc3RyaW5nfSA9IHt9O1xuICAgIGlmIChtZXRhLnByb3ZpZGVycyAmJiBtZXRhLnByb3ZpZGVycy5sZW5ndGgpIHtcbiAgICAgIGNvbnN0IHByb3ZpZGVyT3ZlcnJpZGVzID0gdGhpcy5fZ2V0UHJvdmlkZXJzT3ZlcnJpZGVzKG1ldGEucHJvdmlkZXJzKTtcbiAgICAgIGlmIChwcm92aWRlck92ZXJyaWRlcy5sZW5ndGgpIHtcbiAgICAgICAgb3ZlcnJpZGVzLnByb3ZpZGVycyA9IFsuLi5tZXRhLnByb3ZpZGVycywgLi4ucHJvdmlkZXJPdmVycmlkZXNdO1xuICAgICAgfVxuICAgIH1cbiAgICBjb25zdCBoYXNUZW1wbGF0ZU92ZXJyaWRlID0gISF0eXBlICYmIHRoaXMuX3RlbXBsYXRlT3ZlcnJpZGVzLmhhcyh0eXBlKTtcbiAgICBpZiAoaGFzVGVtcGxhdGVPdmVycmlkZSkge1xuICAgICAgb3ZlcnJpZGVzLnRlbXBsYXRlID0gdGhpcy5fdGVtcGxhdGVPdmVycmlkZXMuZ2V0KHR5cGUgISk7XG4gICAgfVxuICAgIHJldHVybiBPYmplY3Qua2V5cyhvdmVycmlkZXMpLmxlbmd0aCA/IHsuLi5tZXRhLCAuLi5vdmVycmlkZXN9IDogbWV0YTtcbiAgfVxuXG4gIHByaXZhdGUgX3BhdGNoRGVmV2l0aFByb3ZpZGVyT3ZlcnJpZGVzKGRlY2xhcmF0aW9uOiBUeXBlPGFueT4sIGZpZWxkOiBzdHJpbmcpIHtcbiAgICBjb25zdCBkZWYgPSAoZGVjbGFyYXRpb24gYXMgYW55KVtmaWVsZF07XG4gICAgaWYgKGRlZiAmJiBkZWYucHJvdmlkZXJzUmVzb2x2ZXIpIHtcbiAgICAgIHRoaXMuX3N0b3JlTmdEZWYoZmllbGQsIGRlY2xhcmF0aW9uKTtcbiAgICAgIGNvbnN0IHJlc29sdmVyID0gZGVmLnByb3ZpZGVyc1Jlc29sdmVyO1xuICAgICAgY29uc3QgcHJvY2Vzc1Byb3ZpZGVyc0ZuID0gKHByb3ZpZGVyczogYW55W10pID0+IHtcbiAgICAgICAgY29uc3Qgb3ZlcnJpZGVzID0gdGhpcy5fZ2V0UHJvdmlkZXJzT3ZlcnJpZGVzKHByb3ZpZGVycyk7XG4gICAgICAgIHJldHVybiBbLi4ucHJvdmlkZXJzLCAuLi5vdmVycmlkZXNdO1xuICAgICAgfTtcbiAgICAgIGRlZi5wcm92aWRlcnNSZXNvbHZlciA9IChuZ0RlZjogRGlyZWN0aXZlRGVmPGFueT4pID0+IHJlc29sdmVyKG5nRGVmLCBwcm9jZXNzUHJvdmlkZXJzRm4pO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIF9nZXRNb2R1bGVSZXNvbHZlcigpIHsgcmV0dXJuIHRoaXMuX3Jlc29sdmVycy5tb2R1bGU7IH1cblxuICAvKipcbiAgICogQGludGVybmFsXG4gICAqL1xuICBfY29tcGlsZU5nTW9kdWxlKG1vZHVsZVR5cGU6IE5nTW9kdWxlVHlwZSk6IHZvaWQge1xuICAgIGNvbnN0IG5nTW9kdWxlID0gdGhpcy5fcmVzb2x2ZXJzLm1vZHVsZS5yZXNvbHZlKG1vZHVsZVR5cGUpO1xuXG4gICAgaWYgKG5nTW9kdWxlID09PSBudWxsKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYCR7c3RyaW5naWZ5KG1vZHVsZVR5cGUpfSBoYXMgbm8gQE5nTW9kdWxlIGFubm90YXRpb25gKTtcbiAgICB9XG5cbiAgICB0aGlzLl9zdG9yZU5nRGVmKE5HX01PRFVMRV9ERUYsIG1vZHVsZVR5cGUpO1xuICAgIHRoaXMuX3N0b3JlTmdEZWYoTkdfSU5KRUNUT1JfREVGLCBtb2R1bGVUeXBlKTtcbiAgICBjb25zdCBtZXRhZGF0YSA9IHRoaXMuX2dldE1ldGFXaXRoT3ZlcnJpZGVzKG5nTW9kdWxlKTtcbiAgICBjb21waWxlTmdNb2R1bGVEZWZzKG1vZHVsZVR5cGUsIG1ldGFkYXRhKTtcblxuICAgIGNvbnN0IGRlY2xhcmF0aW9uczogVHlwZTxhbnk+W10gPVxuICAgICAgICBmbGF0dGVuKG5nTW9kdWxlLmRlY2xhcmF0aW9ucyB8fCBFTVBUWV9BUlJBWSwgcmVzb2x2ZUZvcndhcmRSZWYpO1xuICAgIGNvbnN0IGRlY2xhcmVkQ29tcG9uZW50czogVHlwZTxhbnk+W10gPSBbXTtcblxuICAgIC8vIENvbXBpbGUgdGhlIGNvbXBvbmVudHMsIGRpcmVjdGl2ZXMgYW5kIHBpcGVzIGRlY2xhcmVkIGJ5IHRoaXMgbW9kdWxlXG4gICAgZGVjbGFyYXRpb25zLmZvckVhY2goZGVjbGFyYXRpb24gPT4ge1xuICAgICAgY29uc3QgY29tcG9uZW50ID0gdGhpcy5fcmVzb2x2ZXJzLmNvbXBvbmVudC5yZXNvbHZlKGRlY2xhcmF0aW9uKTtcbiAgICAgIGlmIChjb21wb25lbnQpIHtcbiAgICAgICAgaWYgKCFkZWNsYXJhdGlvbi5oYXNPd25Qcm9wZXJ0eShOR19DT01QT05FTlRfREVGKSB8fFxuICAgICAgICAgICAgdGhpcy5faGFzVHlwZU92ZXJyaWRlcyhkZWNsYXJhdGlvbiwgdGhpcy5fY29tcG9uZW50T3ZlcnJpZGVzKSB8fFxuICAgICAgICAgICAgdGhpcy5faGFzVGVtcGxhdGVPdmVycmlkZXMoZGVjbGFyYXRpb24pKSB7XG4gICAgICAgICAgdGhpcy5fc3RvcmVOZ0RlZihOR19DT01QT05FTlRfREVGLCBkZWNsYXJhdGlvbik7XG4gICAgICAgICAgY29uc3QgbWV0YWRhdGEgPSB0aGlzLl9nZXRNZXRhV2l0aE92ZXJyaWRlcyhjb21wb25lbnQsIGRlY2xhcmF0aW9uKTtcbiAgICAgICAgICBjb21waWxlQ29tcG9uZW50KGRlY2xhcmF0aW9uLCBtZXRhZGF0YSk7XG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5faGFzUHJvdmlkZXJPdmVycmlkZXMoY29tcG9uZW50LnByb3ZpZGVycykpIHtcbiAgICAgICAgICB0aGlzLl9wYXRjaERlZldpdGhQcm92aWRlck92ZXJyaWRlcyhkZWNsYXJhdGlvbiwgTkdfQ09NUE9ORU5UX0RFRik7XG4gICAgICAgIH1cbiAgICAgICAgZGVjbGFyZWRDb21wb25lbnRzLnB1c2goZGVjbGFyYXRpb24pO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGRpcmVjdGl2ZSA9IHRoaXMuX3Jlc29sdmVycy5kaXJlY3RpdmUucmVzb2x2ZShkZWNsYXJhdGlvbik7XG4gICAgICBpZiAoZGlyZWN0aXZlKSB7XG4gICAgICAgIGlmICghZGVjbGFyYXRpb24uaGFzT3duUHJvcGVydHkoTkdfRElSRUNUSVZFX0RFRikgfHxcbiAgICAgICAgICAgIHRoaXMuX2hhc1R5cGVPdmVycmlkZXMoZGVjbGFyYXRpb24sIHRoaXMuX2RpcmVjdGl2ZU92ZXJyaWRlcykpIHtcbiAgICAgICAgICB0aGlzLl9zdG9yZU5nRGVmKE5HX0RJUkVDVElWRV9ERUYsIGRlY2xhcmF0aW9uKTtcbiAgICAgICAgICBjb25zdCBtZXRhZGF0YSA9IHRoaXMuX2dldE1ldGFXaXRoT3ZlcnJpZGVzKGRpcmVjdGl2ZSk7XG4gICAgICAgICAgY29tcGlsZURpcmVjdGl2ZShkZWNsYXJhdGlvbiwgbWV0YWRhdGEpO1xuICAgICAgICB9IGVsc2UgaWYgKHRoaXMuX2hhc1Byb3ZpZGVyT3ZlcnJpZGVzKGRpcmVjdGl2ZS5wcm92aWRlcnMpKSB7XG4gICAgICAgICAgdGhpcy5fcGF0Y2hEZWZXaXRoUHJvdmlkZXJPdmVycmlkZXMoZGVjbGFyYXRpb24sIE5HX0RJUkVDVElWRV9ERUYpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgY29uc3QgcGlwZSA9IHRoaXMuX3Jlc29sdmVycy5waXBlLnJlc29sdmUoZGVjbGFyYXRpb24pO1xuICAgICAgaWYgKHBpcGUpIHtcbiAgICAgICAgaWYgKCFkZWNsYXJhdGlvbi5oYXNPd25Qcm9wZXJ0eShOR19QSVBFX0RFRikgfHxcbiAgICAgICAgICAgIHRoaXMuX2hhc1R5cGVPdmVycmlkZXMoZGVjbGFyYXRpb24sIHRoaXMuX3BpcGVPdmVycmlkZXMpKSB7XG4gICAgICAgICAgdGhpcy5fc3RvcmVOZ0RlZihOR19QSVBFX0RFRiwgZGVjbGFyYXRpb24pO1xuICAgICAgICAgIGNvbXBpbGVQaXBlKGRlY2xhcmF0aW9uLCBwaXBlKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICAvLyBDb21waWxlIHRyYW5zaXRpdmUgbW9kdWxlcywgY29tcG9uZW50cywgZGlyZWN0aXZlcyBhbmQgcGlwZXNcbiAgICBjb25zdCBjYWxjVHJhbnNpdGl2ZVNjb3Blc0ZvciA9IChtb2R1bGVUeXBlOiBOZ01vZHVsZVR5cGUpID0+IHRyYW5zaXRpdmVTY29wZXNGb3IoXG4gICAgICAgIG1vZHVsZVR5cGUsIChuZ01vZHVsZTogTmdNb2R1bGVUeXBlKSA9PiB0aGlzLl9jb21waWxlTmdNb2R1bGUobmdNb2R1bGUpKTtcbiAgICBjb25zdCB0cmFuc2l0aXZlU2NvcGUgPSBjYWxjVHJhbnNpdGl2ZVNjb3Blc0Zvcihtb2R1bGVUeXBlKTtcbiAgICBkZWNsYXJlZENvbXBvbmVudHMuZm9yRWFjaChjbXAgPT4ge1xuICAgICAgY29uc3Qgc2NvcGUgPSB0aGlzLl90ZW1wbGF0ZU92ZXJyaWRlcy5oYXMoY21wKSA/XG4gICAgICAgICAgLy8gaWYgd2UgaGF2ZSB0ZW1wbGF0ZSBvdmVycmlkZSB2aWEgYFRlc3RCZWQub3ZlcnJpZGVUZW1wbGF0ZVVzaW5nVGVzdGluZ01vZHVsZWAgLVxuICAgICAgICAgIC8vIGRlZmluZSBDb21wb25lbnQgc2NvcGUgYXMgVGVzdGluZ01vZHVsZSBzY29wZSwgaW5zdGVhZCBvZiB0aGUgc2NvcGUgb2YgTmdNb2R1bGVcbiAgICAgICAgICAvLyB3aGVyZSB0aGlzIENvbXBvbmVudCB3YXMgZGVjbGFyZWRcbiAgICAgICAgICAvLyBUT0RPOiBUaGlzIGlzIG9ubHkgYSBwYXJ0aWFsIGZpeC4gU2hvdWxkIGJlIGZpeGVkIGNvbXBsZXRlbHkgd2l0aCBGVy0xMTc4IHJlZmFjdG9yLlxuICAgICAgICAgIHRyYW5zaXRpdmVTY29wZXNGb3IodGhpcy5fdGVzdE1vZHVsZVR5cGUpIDpcbiAgICAgICAgICB0cmFuc2l0aXZlU2NvcGU7XG4gICAgICBwYXRjaENvbXBvbmVudERlZldpdGhTY29wZSgoY21wIGFzIGFueSkubmdDb21wb25lbnREZWYsIHNjb3BlKTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIF9nZXRDb21wb25lbnRGYWN0b3JpZXMobW9kdWxlVHlwZTogTmdNb2R1bGVUeXBlKTogQ29tcG9uZW50RmFjdG9yeTxhbnk+W10ge1xuICAgIHJldHVybiBtYXliZVVud3JhcEZuKG1vZHVsZVR5cGUubmdNb2R1bGVEZWYuZGVjbGFyYXRpb25zKS5yZWR1Y2UoKGZhY3RvcmllcywgZGVjbGFyYXRpb24pID0+IHtcbiAgICAgIGNvbnN0IGNvbXBvbmVudERlZiA9IChkZWNsYXJhdGlvbiBhcyBhbnkpLm5nQ29tcG9uZW50RGVmO1xuICAgICAgY29tcG9uZW50RGVmICYmIGZhY3Rvcmllcy5wdXNoKG5ldyBDb21wb25lbnRGYWN0b3J5KGNvbXBvbmVudERlZiwgdGhpcy5fbW9kdWxlUmVmKSk7XG4gICAgICByZXR1cm4gZmFjdG9yaWVzO1xuICAgIH0sIFtdIGFzIENvbXBvbmVudEZhY3Rvcnk8YW55PltdKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVjayB3aGV0aGVyIHRoZSBtb2R1bGUgc2NvcGluZyBxdWV1ZSBzaG91bGQgYmUgZmx1c2hlZCwgYW5kIGZsdXNoIGl0IGlmIG5lZWRlZC5cbiAgICpcbiAgICogV2hlbiB0aGUgVGVzdEJlZCBpcyByZXNldCwgaXQgY2xlYXJzIHRoZSBKSVQgbW9kdWxlIGNvbXBpbGF0aW9uIHF1ZXVlLCBjYW5jZWxsaW5nIGFueVxuICAgKiBpbi1wcm9ncmVzcyBtb2R1bGUgY29tcGlsYXRpb24uIFRoaXMgY3JlYXRlcyBhIHBvdGVudGlhbCBoYXphcmQgLSB0aGUgdmVyeSBmaXJzdCB0aW1lIHRoZVxuICAgKiBUZXN0QmVkIGlzIGluaXRpYWxpemVkIChvciBpZiBpdCdzIHJlc2V0IHdpdGhvdXQgYmVpbmcgaW5pdGlhbGl6ZWQpLCB0aGVyZSBtYXkgYmUgcGVuZGluZ1xuICAgKiBjb21waWxhdGlvbnMgb2YgbW9kdWxlcyBkZWNsYXJlZCBpbiBnbG9iYWwgc2NvcGUuIFRoZXNlIGNvbXBpbGF0aW9ucyBzaG91bGQgYmUgZmluaXNoZWQuXG4gICAqXG4gICAqIFRvIGVuc3VyZSB0aGF0IGdsb2JhbGx5IGRlY2xhcmVkIG1vZHVsZXMgaGF2ZSB0aGVpciBjb21wb25lbnRzIHNjb3BlZCBwcm9wZXJseSwgdGhpcyBmdW5jdGlvblxuICAgKiBpcyBjYWxsZWQgd2hlbmV2ZXIgVGVzdEJlZCBpcyBpbml0aWFsaXplZCBvciByZXNldC4gVGhlIF9maXJzdF8gdGltZSB0aGF0IHRoaXMgaGFwcGVucywgcHJpb3JcbiAgICogdG8gYW55IG90aGVyIG9wZXJhdGlvbnMsIHRoZSBzY29waW5nIHF1ZXVlIGlzIGZsdXNoZWQuXG4gICAqL1xuICBwcml2YXRlIF9jaGVja0dsb2JhbENvbXBpbGF0aW9uRmluaXNoZWQoKTogdm9pZCB7XG4gICAgLy8gIXRoaXMuX2luc3RhbnRpYXRlZCBzaG91bGQgbm90IGJlIG5lY2Vzc2FyeSwgYnV0IGlzIGxlZnQgaW4gYXMgYW4gYWRkaXRpb25hbCBndWFyZCB0aGF0XG4gICAgLy8gY29tcGlsYXRpb25zIHF1ZXVlZCBpbiB0ZXN0cyAoYWZ0ZXIgaW5zdGFudGlhdGlvbikgYXJlIG5ldmVyIGZsdXNoZWQgYWNjaWRlbnRhbGx5LlxuICAgIGlmICghdGhpcy5fZ2xvYmFsQ29tcGlsYXRpb25DaGVja2VkICYmICF0aGlzLl9pbnN0YW50aWF0ZWQpIHtcbiAgICAgIGZsdXNoTW9kdWxlU2NvcGluZ1F1ZXVlQXNNdWNoQXNQb3NzaWJsZSgpO1xuICAgIH1cbiAgICB0aGlzLl9nbG9iYWxDb21waWxhdGlvbkNoZWNrZWQgPSB0cnVlO1xuICB9XG59XG5cbmxldCB0ZXN0QmVkOiBUZXN0QmVkUmVuZGVyMztcblxuZXhwb3J0IGZ1bmN0aW9uIF9nZXRUZXN0QmVkUmVuZGVyMygpOiBUZXN0QmVkUmVuZGVyMyB7XG4gIHJldHVybiB0ZXN0QmVkID0gdGVzdEJlZCB8fCBuZXcgVGVzdEJlZFJlbmRlcjMoKTtcbn1cblxuZnVuY3Rpb24gZmxhdHRlbjxUPih2YWx1ZXM6IGFueVtdLCBtYXBGbj86ICh2YWx1ZTogVCkgPT4gYW55KTogVFtdIHtcbiAgY29uc3Qgb3V0OiBUW10gPSBbXTtcbiAgdmFsdWVzLmZvckVhY2godmFsdWUgPT4ge1xuICAgIGlmIChBcnJheS5pc0FycmF5KHZhbHVlKSkge1xuICAgICAgb3V0LnB1c2goLi4uZmxhdHRlbjxUPih2YWx1ZSwgbWFwRm4pKTtcbiAgICB9IGVsc2Uge1xuICAgICAgb3V0LnB1c2gobWFwRm4gPyBtYXBGbih2YWx1ZSkgOiB2YWx1ZSk7XG4gICAgfVxuICB9KTtcbiAgcmV0dXJuIG91dDtcbn1cblxuZnVuY3Rpb24gaXNOZ01vZHVsZTxUPih2YWx1ZTogVHlwZTxUPik6IHZhbHVlIGlzIFR5cGU8VD4me25nTW9kdWxlRGVmOiBOZ01vZHVsZURlZjxUPn0ge1xuICByZXR1cm4gKHZhbHVlIGFze25nTW9kdWxlRGVmPzogTmdNb2R1bGVEZWY8VD59KS5uZ01vZHVsZURlZiAhPT0gdW5kZWZpbmVkO1xufVxuXG5jbGFzcyBSM1Rlc3RDb21waWxlciBpbXBsZW1lbnRzIENvbXBpbGVyIHtcbiAgY29uc3RydWN0b3IocHJpdmF0ZSB0ZXN0QmVkOiBUZXN0QmVkUmVuZGVyMykge31cblxuICBjb21waWxlTW9kdWxlU3luYzxUPihtb2R1bGVUeXBlOiBUeXBlPFQ+KTogTmdNb2R1bGVGYWN0b3J5PFQ+IHtcbiAgICB0aGlzLnRlc3RCZWQuX2NvbXBpbGVOZ01vZHVsZShtb2R1bGVUeXBlIGFzIE5nTW9kdWxlVHlwZTxUPik7XG4gICAgcmV0dXJuIG5ldyBSM05nTW9kdWxlRmFjdG9yeShtb2R1bGVUeXBlKTtcbiAgfVxuXG4gIGNvbXBpbGVNb2R1bGVBc3luYzxUPihtb2R1bGVUeXBlOiBUeXBlPFQ+KTogUHJvbWlzZTxOZ01vZHVsZUZhY3Rvcnk8VD4+IHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHRoaXMuY29tcGlsZU1vZHVsZVN5bmMobW9kdWxlVHlwZSkpO1xuICB9XG5cbiAgY29tcGlsZU1vZHVsZUFuZEFsbENvbXBvbmVudHNTeW5jPFQ+KG1vZHVsZVR5cGU6IFR5cGU8VD4pOiBNb2R1bGVXaXRoQ29tcG9uZW50RmFjdG9yaWVzPFQ+IHtcbiAgICBjb25zdCBuZ01vZHVsZUZhY3RvcnkgPSB0aGlzLmNvbXBpbGVNb2R1bGVTeW5jKG1vZHVsZVR5cGUpO1xuICAgIGNvbnN0IGNvbXBvbmVudEZhY3RvcmllcyA9IHRoaXMudGVzdEJlZC5fZ2V0Q29tcG9uZW50RmFjdG9yaWVzKG1vZHVsZVR5cGUgYXMgTmdNb2R1bGVUeXBlPFQ+KTtcbiAgICByZXR1cm4gbmV3IE1vZHVsZVdpdGhDb21wb25lbnRGYWN0b3JpZXMobmdNb2R1bGVGYWN0b3J5LCBjb21wb25lbnRGYWN0b3JpZXMpO1xuICB9XG5cbiAgY29tcGlsZU1vZHVsZUFuZEFsbENvbXBvbmVudHNBc3luYzxUPihtb2R1bGVUeXBlOiBUeXBlPFQ+KTpcbiAgICAgIFByb21pc2U8TW9kdWxlV2l0aENvbXBvbmVudEZhY3RvcmllczxUPj4ge1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodGhpcy5jb21waWxlTW9kdWxlQW5kQWxsQ29tcG9uZW50c1N5bmMobW9kdWxlVHlwZSkpO1xuICB9XG5cbiAgY2xlYXJDYWNoZSgpOiB2b2lkIHt9XG5cbiAgY2xlYXJDYWNoZUZvcih0eXBlOiBUeXBlPGFueT4pOiB2b2lkIHt9XG5cbiAgZ2V0TW9kdWxlSWQobW9kdWxlVHlwZTogVHlwZTxhbnk+KTogc3RyaW5nfHVuZGVmaW5lZCB7XG4gICAgY29uc3QgbWV0YSA9IHRoaXMudGVzdEJlZC5fZ2V0TW9kdWxlUmVzb2x2ZXIoKS5yZXNvbHZlKG1vZHVsZVR5cGUpO1xuICAgIHJldHVybiBtZXRhICYmIG1ldGEuaWQgfHwgdW5kZWZpbmVkO1xuICB9XG59XG5cbi8qKiBFcnJvciBoYW5kbGVyIHVzZWQgZm9yIHRlc3RzLiBSZXRocm93cyBlcnJvcnMgcmF0aGVyIHRoYW4gbG9nZ2luZyB0aGVtIG91dC4gKi9cbmNsYXNzIFIzVGVzdEVycm9ySGFuZGxlciBleHRlbmRzIEVycm9ySGFuZGxlciB7XG4gIGhhbmRsZUVycm9yKGVycm9yOiBhbnkpIHsgdGhyb3cgZXJyb3I7IH1cbn1cblxuLyoqXG4gKiBVbndyYXAgYSB2YWx1ZSB3aGljaCBtaWdodCBiZSBiZWhpbmQgYSBjbG9zdXJlIChmb3IgZm9yd2FyZCBkZWNsYXJhdGlvbiByZWFzb25zKS5cbiAqL1xuZnVuY3Rpb24gbWF5YmVVbndyYXBGbjxUPih2YWx1ZTogVCB8ICgoKSA9PiBUKSk6IFQge1xuICBpZiAodmFsdWUgaW5zdGFuY2VvZiBGdW5jdGlvbikge1xuICAgIHJldHVybiB2YWx1ZSgpO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiB2YWx1ZTtcbiAgfVxufVxuIl19