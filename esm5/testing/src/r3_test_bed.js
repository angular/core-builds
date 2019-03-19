import * as tslib_1 from "tslib";
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
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
import * as i0 from "@angular/core";
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
                CompilerModule.ngModuleDef = i0.ɵdefineNgModule({ type: CompilerModule });
                CompilerModule.ngInjectorDef = i0.defineInjector({ factory: function CompilerModule_Factory(t) { return new (t || CompilerModule)(); }, providers: providers, imports: [] });
                return CompilerModule;
            }());
            /*@__PURE__*/ i0.ɵsetClassMetadata(CompilerModule, [{
                    type: NgModule,
                    args: [{ providers: providers }]
                }], null, null);
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
                calcTransitiveScopesFor(_this._testModuleType) :
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicjNfdGVzdF9iZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3Rlc3Rpbmcvc3JjL3IzX3Rlc3RfYmVkLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7QUFFSCxtR0FBbUc7QUFDbkcsaUdBQWlHO0FBQ2pHLHVCQUF1QjtBQUN2QixtQkFBbUI7QUFDbkIsT0FBTyxFQUNMLHFCQUFxQixFQUNyQixRQUFRLEVBR1IsWUFBWSxFQUNaLFFBQVEsRUFDUiw0QkFBNEIsRUFDNUIsUUFBUSxFQUVSLE1BQU0sRUFNTixpQkFBaUIsRUFFakIsaUJBQWlCLElBQUksZ0JBQWdCLEVBQ3JDLGlCQUFpQixJQUFJLGdCQUFnQixFQUNyQyxnQkFBZ0IsSUFBSSxlQUFlLEVBQ25DLGNBQWMsSUFBSSxhQUFhLEVBQy9CLFlBQVksSUFBSSxXQUFXLEVBRTNCLGdCQUFnQixJQUFJLGlCQUFpQixFQUVyQyx3QkFBd0IsSUFBSSxnQkFBZ0IsRUFDNUMsbUJBQW1CLElBQUksV0FBVyxFQUNsQyxpQkFBaUIsSUFBSSxnQkFBZ0IsRUFDckMsaUJBQWlCLElBQUksZ0JBQWdCLEVBQ3JDLG9CQUFvQixJQUFJLG1CQUFtQixFQUMzQyxZQUFZLElBQUksV0FBVyxFQUMzQixpQkFBaUIsSUFBSSxnQkFBZ0IsRUFDckMsd0NBQXdDLElBQUksdUNBQXVDLEVBQ25GLDJCQUEyQixJQUFJLDBCQUEwQixFQUN6RCx3QkFBd0IsSUFBSSx1QkFBdUIsRUFDbkQsVUFBVSxJQUFJLFNBQVMsRUFDdkIsb0JBQW9CLElBQUksbUJBQW1CLEVBRzNDLGdCQUFnQixHQUVqQixNQUFNLGVBQWUsQ0FBQztBQUN2QixrQkFBa0I7QUFDbEIsT0FBTyxFQUFDLGNBQWMsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBRWpELE9BQU8sRUFBQyx3Q0FBd0MsRUFBRSx3QkFBd0IsRUFBRSx5QkFBeUIsRUFB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Q0FBQyxlQUFlLEVBQUUsa0JBQWtCLENBQUMsQ0FBQztJQUMvRSxDQUFDO0lBRUQsMkRBQWtDLEdBQWxDLFVBQXNDLFVBQW1CO1FBRXZELE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsaUNBQWlDLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQztJQUM3RSxDQUFDO0lBRUQsbUNBQVUsR0FBVixjQUFvQixDQUFDO0lBRXJCLHNDQUFhLEdBQWIsVUFBYyxJQUFlLElBQVMsQ0FBQztJQUV2QyxvQ0FBVyxHQUFYLFVBQVksVUFBcUI7UUFDL0IsSUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxrQkFBa0IsRUFBRSxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUNuRSxPQUFPLElBQUksSUFBSSxJQUFJLENBQUMsRUFBRSxJQUFJLFNBQVMsQ0FBQztJQUN0QyxDQUFDO0lBQ0gscUJBQUM7QUFBRCxDQUFDLEFBL0JELElBK0JDO0FBRUQsa0ZBQWtGO0FBQ2xGO0lBQWlDLDhDQUFZO0lBQTdDOztJQUVBLENBQUM7SUFEQyx3Q0FBVyxHQUFYLFVBQVksS0FBVSxJQUFJLE1BQU0sS0FBSyxDQUFDLENBQUMsQ0FBQztJQUMxQyx5QkFBQztBQUFELENBQUMsQUFGRCxDQUFpQyxZQUFZLEdBRTVDO0FBRUQ7O0dBRUc7QUFDSCxTQUFTLGFBQWEsQ0FBSSxLQUFvQjtJQUM1QyxJQUFJLEtBQUssWUFBWSxRQUFRLEVBQUU7UUFDN0IsT0FBTyxLQUFLLEVBQUUsQ0FBQztLQUNoQjtTQUFNO1FBQ0wsT0FBTyxLQUFLLENBQUM7S0FDZDtBQUNILENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbi8vIFRoZSBmb3JtYXR0ZXIgYW5kIENJIGRpc2FncmVlIG9uIGhvdyB0aGlzIGltcG9ydCBzdGF0ZW1lbnQgc2hvdWxkIGJlIGZvcm1hdHRlZC4gQm90aCB0cnkgdG8ga2VlcFxuLy8gaXQgb24gb25lIGxpbmUsIHRvbywgd2hpY2ggaGFzIGdvdHRlbiB2ZXJ5IGhhcmQgdG8gcmVhZCAmIG1hbmFnZS4gU28gZGlzYWJsZSB0aGUgZm9ybWF0dGVyIGZvclxuLy8gdGhpcyBzdGF0ZW1lbnQgb25seS5cbi8vIGNsYW5nLWZvcm1hdCBvZmZcbmltcG9ydCB7XG4gIEFwcGxpY2F0aW9uSW5pdFN0YXR1cyxcbiAgQ29tcGlsZXIsXG4gIENvbXBvbmVudCxcbiAgRGlyZWN0aXZlLFxuICBFcnJvckhhbmRsZXIsXG4gIEluamVjdG9yLFxuICBNb2R1bGVXaXRoQ29tcG9uZW50RmFjdG9yaWVzLFxuICBOZ01vZHVsZSxcbiAgTmdNb2R1bGVGYWN0b3J5LFxuICBOZ1pvbmUsXG4gIFBpcGUsXG4gIFBsYXRmb3JtUmVmLFxuICBQcm92aWRlcixcbiAgU2NoZW1hTWV0YWRhdGEsXG4gIFR5cGUsXG4gIHJlc29sdmVGb3J3YXJkUmVmLFxuICDJtUluamVjdGFibGVEZWYgYXMgSW5qZWN0YWJsZURlZixcbiAgybVOR19DT01QT05FTlRfREVGIGFzIE5HX0NPTVBPTkVOVF9ERUYsXG4gIMm1TkdfRElSRUNUSVZFX0RFRiBhcyBOR19ESVJFQ1RJVkVfREVGLFxuICDJtU5HX0lOSkVDVE9SX0RFRiBhcyBOR19JTkpFQ1RPUl9ERUYsXG4gIMm1TkdfTU9EVUxFX0RFRiBhcyBOR19NT0RVTEVfREVGLFxuICDJtU5HX1BJUEVfREVGIGFzIE5HX1BJUEVfREVGLFxuICDJtU5nTW9kdWxlRGVmIGFzIE5nTW9kdWxlRGVmLFxuICDJtU5nTW9kdWxlRmFjdG9yeSBhcyBSM05nTW9kdWxlRmFjdG9yeSxcbiAgybVOZ01vZHVsZVR5cGUgYXMgTmdNb2R1bGVUeXBlLFxuICDJtVJlbmRlcjNDb21wb25lbnRGYWN0b3J5IGFzIENvbXBvbmVudEZhY3RvcnksXG4gIMm1UmVuZGVyM05nTW9kdWxlUmVmIGFzIE5nTW9kdWxlUmVmLFxuICDJtWNvbXBpbGVDb21wb25lbnQgYXMgY29tcGlsZUNvbXBvbmVudCxcbiAgybVjb21waWxlRGlyZWN0aXZlIGFzIGNvbXBpbGVEaXJlY3RpdmUsXG4gIMm1Y29tcGlsZU5nTW9kdWxlRGVmcyBhcyBjb21waWxlTmdNb2R1bGVEZWZzLFxuICDJtWNvbXBpbGVQaXBlIGFzIGNvbXBpbGVQaXBlLFxuICDJtWdldEluamVjdGFibGVEZWYgYXMgZ2V0SW5qZWN0YWJsZURlZixcbiAgybVmbHVzaE1vZHVsZVNjb3BpbmdRdWV1ZUFzTXVjaEFzUG9zc2libGUgYXMgZmx1c2hNb2R1bGVTY29waW5nUXVldWVBc011Y2hBc1Bvc3NpYmxlLFxuICDJtXBhdGNoQ29tcG9uZW50RGVmV2l0aFNjb3BlIGFzIHBhdGNoQ29tcG9uZW50RGVmV2l0aFNjb3BlLFxuICDJtXJlc2V0Q29tcGlsZWRDb21wb25lbnRzIGFzIHJlc2V0Q29tcGlsZWRDb21wb25lbnRzLFxuICDJtXN0cmluZ2lmeSBhcyBzdHJpbmdpZnksXG4gIMm1dHJhbnNpdGl2ZVNjb3Blc0ZvciBhcyB0cmFuc2l0aXZlU2NvcGVzRm9yLFxuICBDb21waWxlck9wdGlvbnMsXG4gIFN0YXRpY1Byb3ZpZGVyLFxuICBDT01QSUxFUl9PUFRJT05TLFxuICDJtURpcmVjdGl2ZURlZiBhcyBEaXJlY3RpdmVEZWYsXG59IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuLy8gY2xhbmctZm9ybWF0IG9uXG5pbXBvcnQge1Jlc291cmNlTG9hZGVyfSBmcm9tICdAYW5ndWxhci9jb21waWxlcic7XG5cbmltcG9ydCB7Y2xlYXJSZXNvbHV0aW9uT2ZDb21wb25lbnRSZXNvdXJjZXNRdWV1ZSwgY29tcG9uZW50TmVlZHNSZXNvbHV0aW9uLCByZXNvbHZlQ29tcG9uZW50UmVzb3VyY2VzLCBtYXliZVF1ZXVlUmVzb2x1dGlvbk9mQ29tcG9uZW50UmVzb3VyY2VzLCBpc0NvbXBvbmVudERlZlBlbmRpbmdSZXNvbHV0aW9uLCByZXN0b3JlQ29tcG9uZW50UmVzb2x1dGlvblF1ZXVlfSBmcm9tICcuLi8uLi9zcmMvbWV0YWRhdGEvcmVzb3VyY2VfbG9hZGluZyc7XG5pbXBvcnQge0NvbXBvbmVudEZpeHR1cmV9IGZyb20gJy4vY29tcG9uZW50X2ZpeHR1cmUnO1xuaW1wb3J0IHtNZXRhZGF0YU92ZXJyaWRlfSBmcm9tICcuL21ldGFkYXRhX292ZXJyaWRlJztcbmltcG9ydCB7Q29tcG9uZW50UmVzb2x2ZXIsIERpcmVjdGl2ZVJlc29sdmVyLCBOZ01vZHVsZVJlc29sdmVyLCBQaXBlUmVzb2x2ZXIsIFJlc29sdmVyfSBmcm9tICcuL3Jlc29sdmVycyc7XG5pbXBvcnQge1Rlc3RCZWR9IGZyb20gJy4vdGVzdF9iZWQnO1xuaW1wb3J0IHtDb21wb25lbnRGaXh0dXJlQXV0b0RldGVjdCwgQ29tcG9uZW50Rml4dHVyZU5vTmdab25lLCBUZXN0QmVkU3RhdGljLCBUZXN0Q29tcG9uZW50UmVuZGVyZXIsIFRlc3RNb2R1bGVNZXRhZGF0YX0gZnJvbSAnLi90ZXN0X2JlZF9jb21tb24nO1xuXG5sZXQgX25leHRSb290RWxlbWVudElkID0gMDtcblxuY29uc3QgRU1QVFlfQVJSQVk6IFR5cGU8YW55PltdID0gW107XG5cbmNvbnN0IFVOREVGSU5FRDogU3ltYm9sID0gU3ltYm9sKCdVTkRFRklORUQnKTtcblxuLy8gUmVzb2x2ZXJzIGZvciBBbmd1bGFyIGRlY29yYXRvcnNcbnR5cGUgUmVzb2x2ZXJzID0ge1xuICBtb2R1bGU6IFJlc29sdmVyPE5nTW9kdWxlPixcbiAgY29tcG9uZW50OiBSZXNvbHZlcjxEaXJlY3RpdmU+LFxuICBkaXJlY3RpdmU6IFJlc29sdmVyPENvbXBvbmVudD4sXG4gIHBpcGU6IFJlc29sdmVyPFBpcGU+LFxufTtcblxuLyoqXG4gKiBAZGVzY3JpcHRpb25cbiAqIENvbmZpZ3VyZXMgYW5kIGluaXRpYWxpemVzIGVudmlyb25tZW50IGZvciB1bml0IHRlc3RpbmcgYW5kIHByb3ZpZGVzIG1ldGhvZHMgZm9yXG4gKiBjcmVhdGluZyBjb21wb25lbnRzIGFuZCBzZXJ2aWNlcyBpbiB1bml0IHRlc3RzLlxuICpcbiAqIFRlc3RCZWQgaXMgdGhlIHByaW1hcnkgYXBpIGZvciB3cml0aW5nIHVuaXQgdGVzdHMgZm9yIEFuZ3VsYXIgYXBwbGljYXRpb25zIGFuZCBsaWJyYXJpZXMuXG4gKlxuICogTm90ZTogVXNlIGBUZXN0QmVkYCBpbiB0ZXN0cy4gSXQgd2lsbCBiZSBzZXQgdG8gZWl0aGVyIGBUZXN0QmVkVmlld0VuZ2luZWAgb3IgYFRlc3RCZWRSZW5kZXIzYFxuICogYWNjb3JkaW5nIHRvIHRoZSBjb21waWxlciB1c2VkLlxuICovXG5leHBvcnQgY2xhc3MgVGVzdEJlZFJlbmRlcjMgaW1wbGVtZW50cyBJbmplY3RvciwgVGVzdEJlZCB7XG4gIC8qKlxuICAgKiBJbml0aWFsaXplIHRoZSBlbnZpcm9ubWVudCBmb3IgdGVzdGluZyB3aXRoIGEgY29tcGlsZXIgZmFjdG9yeSwgYSBQbGF0Zm9ybVJlZiwgYW5kIGFuXG4gICAqIGFuZ3VsYXIgbW9kdWxlLiBUaGVzZSBhcmUgY29tbW9uIHRvIGV2ZXJ5IHRlc3QgaW4gdGhlIHN1aXRlLlxuICAgKlxuICAgKiBUaGlzIG1heSBvbmx5IGJlIGNhbGxlZCBvbmNlLCB0byBzZXQgdXAgdGhlIGNvbW1vbiBwcm92aWRlcnMgZm9yIHRoZSBjdXJyZW50IHRlc3RcbiAgICogc3VpdGUgb24gdGhlIGN1cnJlbnQgcGxhdGZvcm0uIElmIHlvdSBhYnNvbHV0ZWx5IG5lZWQgdG8gY2hhbmdlIHRoZSBwcm92aWRlcnMsXG4gICAqIGZpcnN0IHVzZSBgcmVzZXRUZXN0RW52aXJvbm1lbnRgLlxuICAgKlxuICAgKiBUZXN0IG1vZHVsZXMgYW5kIHBsYXRmb3JtcyBmb3IgaW5kaXZpZHVhbCBwbGF0Zm9ybXMgYXJlIGF2YWlsYWJsZSBmcm9tXG4gICAqICdAYW5ndWxhci88cGxhdGZvcm1fbmFtZT4vdGVzdGluZycuXG4gICAqXG4gICAqIEBwdWJsaWNBcGlcbiAgICovXG4gIHN0YXRpYyBpbml0VGVzdEVudmlyb25tZW50KFxuICAgICAgbmdNb2R1bGU6IFR5cGU8YW55PnxUeXBlPGFueT5bXSwgcGxhdGZvcm06IFBsYXRmb3JtUmVmLCBhb3RTdW1tYXJpZXM/OiAoKSA9PiBhbnlbXSk6IFRlc3RCZWQge1xuICAgIGNvbnN0IHRlc3RCZWQgPSBfZ2V0VGVzdEJlZFJlbmRlcjMoKTtcbiAgICB0ZXN0QmVkLmluaXRUZXN0RW52aXJvbm1lbnQobmdNb2R1bGUsIHBsYXRmb3JtLCBhb3RTdW1tYXJpZXMpO1xuICAgIHJldHVybiB0ZXN0QmVkO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlc2V0IHRoZSBwcm92aWRlcnMgZm9yIHRoZSB0ZXN0IGluamVjdG9yLlxuICAgKlxuICAgKiBAcHVibGljQXBpXG4gICAqL1xuICBzdGF0aWMgcmVzZXRUZXN0RW52aXJvbm1lbnQoKTogdm9pZCB7IF9nZXRUZXN0QmVkUmVuZGVyMygpLnJlc2V0VGVzdEVudmlyb25tZW50KCk7IH1cblxuICBzdGF0aWMgY29uZmlndXJlQ29tcGlsZXIoY29uZmlnOiB7cHJvdmlkZXJzPzogYW55W107IHVzZUppdD86IGJvb2xlYW47fSk6IFRlc3RCZWRTdGF0aWMge1xuICAgIF9nZXRUZXN0QmVkUmVuZGVyMygpLmNvbmZpZ3VyZUNvbXBpbGVyKGNvbmZpZyk7XG4gICAgcmV0dXJuIFRlc3RCZWRSZW5kZXIzIGFzIGFueSBhcyBUZXN0QmVkU3RhdGljO1xuICB9XG5cbiAgLyoqXG4gICAqIEFsbG93cyBvdmVycmlkaW5nIGRlZmF1bHQgcHJvdmlkZXJzLCBkaXJlY3RpdmVzLCBwaXBlcywgbW9kdWxlcyBvZiB0aGUgdGVzdCBpbmplY3RvcixcbiAgICogd2hpY2ggYXJlIGRlZmluZWQgaW4gdGVzdF9pbmplY3Rvci5qc1xuICAgKi9cbiAgc3RhdGljIGNvbmZpZ3VyZVRlc3RpbmdNb2R1bGUobW9kdWxlRGVmOiBUZXN0TW9kdWxlTWV0YWRhdGEpOiBUZXN0QmVkU3RhdGljIHtcbiAgICBfZ2V0VGVzdEJlZFJlbmRlcjMoKS5jb25maWd1cmVUZXN0aW5nTW9kdWxlKG1vZHVsZURlZik7XG4gICAgcmV0dXJuIFRlc3RCZWRSZW5kZXIzIGFzIGFueSBhcyBUZXN0QmVkU3RhdGljO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbXBpbGUgY29tcG9uZW50cyB3aXRoIGEgYHRlbXBsYXRlVXJsYCBmb3IgdGhlIHRlc3QncyBOZ01vZHVsZS5cbiAgICogSXQgaXMgbmVjZXNzYXJ5IHRvIGNhbGwgdGhpcyBmdW5jdGlvblxuICAgKiBhcyBmZXRjaGluZyB1cmxzIGlzIGFzeW5jaHJvbm91cy5cbiAgICovXG4gIHN0YXRpYyBjb21waWxlQ29tcG9uZW50cygpOiBQcm9taXNlPGFueT4geyByZXR1cm4gX2dldFRlc3RCZWRSZW5kZXIzKCkuY29tcGlsZUNvbXBvbmVudHMoKTsgfVxuXG4gIHN0YXRpYyBvdmVycmlkZU1vZHVsZShuZ01vZHVsZTogVHlwZTxhbnk+LCBvdmVycmlkZTogTWV0YWRhdGFPdmVycmlkZTxOZ01vZHVsZT4pOiBUZXN0QmVkU3RhdGljIHtcbiAgICBfZ2V0VGVzdEJlZFJlbmRlcjMoKS5vdmVycmlkZU1vZHVsZShuZ01vZHVsZSwgb3ZlcnJpZGUpO1xuICAgIHJldHVybiBUZXN0QmVkUmVuZGVyMyBhcyBhbnkgYXMgVGVzdEJlZFN0YXRpYztcbiAgfVxuXG4gIHN0YXRpYyBvdmVycmlkZUNvbXBvbmVudChjb21wb25lbnQ6IFR5cGU8YW55Piwgb3ZlcnJpZGU6IE1ldGFkYXRhT3ZlcnJpZGU8Q29tcG9uZW50Pik6XG4gICAgICBUZXN0QmVkU3RhdGljIHtcbiAgICBfZ2V0VGVzdEJlZFJlbmRlcjMoKS5vdmVycmlkZUNvbXBvbmVudChjb21wb25lbnQsIG92ZXJyaWRlKTtcbiAgICByZXR1cm4gVGVzdEJlZFJlbmRlcjMgYXMgYW55IGFzIFRlc3RCZWRTdGF0aWM7XG4gIH1cblxuICBzdGF0aWMgb3ZlcnJpZGVEaXJlY3RpdmUoZGlyZWN0aXZlOiBUeXBlPGFueT4sIG92ZXJyaWRlOiBNZXRhZGF0YU92ZXJyaWRlPERpcmVjdGl2ZT4pOlxuICAgICAgVGVzdEJlZFN0YXRpYyB7XG4gICAgX2dldFRlc3RCZWRSZW5kZXIzKCkub3ZlcnJpZGVEaXJlY3RpdmUoZGlyZWN0aXZlLCBvdmVycmlkZSk7XG4gICAgcmV0dXJuIFRlc3RCZWRSZW5kZXIzIGFzIGFueSBhcyBUZXN0QmVkU3RhdGljO1xuICB9XG5cbiAgc3RhdGljIG92ZXJyaWRlUGlwZShwaXBlOiBUeXBlPGFueT4sIG92ZXJyaWRlOiBNZXRhZGF0YU92ZXJyaWRlPFBpcGU+KTogVGVzdEJlZFN0YXRpYyB7XG4gICAgX2dldFRlc3RCZWRSZW5kZXIzKCkub3ZlcnJpZGVQaXBlKHBpcGUsIG92ZXJyaWRlKTtcbiAgICByZXR1cm4gVGVzdEJlZFJlbmRlcjMgYXMgYW55IGFzIFRlc3RCZWRTdGF0aWM7XG4gIH1cblxuICBzdGF0aWMgb3ZlcnJpZGVUZW1wbGF0ZShjb21wb25lbnQ6IFR5cGU8YW55PiwgdGVtcGxhdGU6IHN0cmluZyk6IFRlc3RCZWRTdGF0aWMge1xuICAgIF9nZXRUZXN0QmVkUmVuZGVyMygpLm92ZXJyaWRlQ29tcG9uZW50KGNvbXBvbmVudCwge3NldDoge3RlbXBsYXRlLCB0ZW1wbGF0ZVVybDogbnVsbCAhfX0pO1xuICAgIHJldHVybiBUZXN0QmVkUmVuZGVyMyBhcyBhbnkgYXMgVGVzdEJlZFN0YXRpYztcbiAgfVxuXG4gIC8qKlxuICAgKiBPdmVycmlkZXMgdGhlIHRlbXBsYXRlIG9mIHRoZSBnaXZlbiBjb21wb25lbnQsIGNvbXBpbGluZyB0aGUgdGVtcGxhdGVcbiAgICogaW4gdGhlIGNvbnRleHQgb2YgdGhlIFRlc3RpbmdNb2R1bGUuXG4gICAqXG4gICAqIE5vdGU6IFRoaXMgd29ya3MgZm9yIEpJVCBhbmQgQU9UZWQgY29tcG9uZW50cyBhcyB3ZWxsLlxuICAgKi9cbiAgc3RhdGljIG92ZXJyaWRlVGVtcGxhdGVVc2luZ1Rlc3RpbmdNb2R1bGUoY29tcG9uZW50OiBUeXBlPGFueT4sIHRlbXBsYXRlOiBzdHJpbmcpOiBUZXN0QmVkU3RhdGljIHtcbiAgICBfZ2V0VGVzdEJlZFJlbmRlcjMoKS5vdmVycmlkZVRlbXBsYXRlVXNpbmdUZXN0aW5nTW9kdWxlKGNvbXBvbmVudCwgdGVtcGxhdGUpO1xuICAgIHJldHVybiBUZXN0QmVkUmVuZGVyMyBhcyBhbnkgYXMgVGVzdEJlZFN0YXRpYztcbiAgfVxuXG4gIG92ZXJyaWRlVGVtcGxhdGVVc2luZ1Rlc3RpbmdNb2R1bGUoY29tcG9uZW50OiBUeXBlPGFueT4sIHRlbXBsYXRlOiBzdHJpbmcpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5faW5zdGFudGlhdGVkKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgJ0Nhbm5vdCBvdmVycmlkZSB0ZW1wbGF0ZSB3aGVuIHRoZSB0ZXN0IG1vZHVsZSBoYXMgYWxyZWFkeSBiZWVuIGluc3RhbnRpYXRlZCcpO1xuICAgIH1cbiAgICB0aGlzLl90ZW1wbGF0ZU92ZXJyaWRlcy5zZXQoY29tcG9uZW50LCB0ZW1wbGF0ZSk7XG4gIH1cblxuICBzdGF0aWMgb3ZlcnJpZGVQcm92aWRlcih0b2tlbjogYW55LCBwcm92aWRlcjoge1xuICAgIHVzZUZhY3Rvcnk6IEZ1bmN0aW9uLFxuICAgIGRlcHM6IGFueVtdLFxuICB9KTogVGVzdEJlZFN0YXRpYztcbiAgc3RhdGljIG92ZXJyaWRlUHJvdmlkZXIodG9rZW46IGFueSwgcHJvdmlkZXI6IHt1c2VWYWx1ZTogYW55O30pOiBUZXN0QmVkU3RhdGljO1xuICBzdGF0aWMgb3ZlcnJpZGVQcm92aWRlcih0b2tlbjogYW55LCBwcm92aWRlcjoge1xuICAgIHVzZUZhY3Rvcnk/OiBGdW5jdGlvbixcbiAgICB1c2VWYWx1ZT86IGFueSxcbiAgICBkZXBzPzogYW55W10sXG4gIH0pOiBUZXN0QmVkU3RhdGljIHtcbiAgICBfZ2V0VGVzdEJlZFJlbmRlcjMoKS5vdmVycmlkZVByb3ZpZGVyKHRva2VuLCBwcm92aWRlcik7XG4gICAgcmV0dXJuIFRlc3RCZWRSZW5kZXIzIGFzIGFueSBhcyBUZXN0QmVkU3RhdGljO1xuICB9XG5cbiAgLyoqXG4gICAqIE92ZXJ3cml0ZXMgYWxsIHByb3ZpZGVycyBmb3IgdGhlIGdpdmVuIHRva2VuIHdpdGggdGhlIGdpdmVuIHByb3ZpZGVyIGRlZmluaXRpb24uXG4gICAqXG4gICAqIEBkZXByZWNhdGVkIGFzIGl0IG1ha2VzIGFsbCBOZ01vZHVsZXMgbGF6eS4gSW50cm9kdWNlZCBvbmx5IGZvciBtaWdyYXRpbmcgb2ZmIG9mIGl0LlxuICAgKi9cbiAgc3RhdGljIGRlcHJlY2F0ZWRPdmVycmlkZVByb3ZpZGVyKHRva2VuOiBhbnksIHByb3ZpZGVyOiB7XG4gICAgdXNlRmFjdG9yeTogRnVuY3Rpb24sXG4gICAgZGVwczogYW55W10sXG4gIH0pOiB2b2lkO1xuICBzdGF0aWMgZGVwcmVjYXRlZE92ZXJyaWRlUHJvdmlkZXIodG9rZW46IGFueSwgcHJvdmlkZXI6IHt1c2VWYWx1ZTogYW55O30pOiB2b2lkO1xuICBzdGF0aWMgZGVwcmVjYXRlZE92ZXJyaWRlUHJvdmlkZXIodG9rZW46IGFueSwgcHJvdmlkZXI6IHtcbiAgICB1c2VGYWN0b3J5PzogRnVuY3Rpb24sXG4gICAgdXNlVmFsdWU/OiBhbnksXG4gICAgZGVwcz86IGFueVtdLFxuICB9KTogVGVzdEJlZFN0YXRpYyB7XG4gICAgX2dldFRlc3RCZWRSZW5kZXIzKCkuZGVwcmVjYXRlZE92ZXJyaWRlUHJvdmlkZXIodG9rZW4sIHByb3ZpZGVyIGFzIGFueSk7XG4gICAgcmV0dXJuIFRlc3RCZWRSZW5kZXIzIGFzIGFueSBhcyBUZXN0QmVkU3RhdGljO1xuICB9XG5cbiAgc3RhdGljIGdldCh0b2tlbjogYW55LCBub3RGb3VuZFZhbHVlOiBhbnkgPSBJbmplY3Rvci5USFJPV19JRl9OT1RfRk9VTkQpOiBhbnkge1xuICAgIHJldHVybiBfZ2V0VGVzdEJlZFJlbmRlcjMoKS5nZXQodG9rZW4sIG5vdEZvdW5kVmFsdWUpO1xuICB9XG5cbiAgc3RhdGljIGNyZWF0ZUNvbXBvbmVudDxUPihjb21wb25lbnQ6IFR5cGU8VD4pOiBDb21wb25lbnRGaXh0dXJlPFQ+IHtcbiAgICByZXR1cm4gX2dldFRlc3RCZWRSZW5kZXIzKCkuY3JlYXRlQ29tcG9uZW50KGNvbXBvbmVudCk7XG4gIH1cblxuICBzdGF0aWMgcmVzZXRUZXN0aW5nTW9kdWxlKCk6IFRlc3RCZWRTdGF0aWMge1xuICAgIF9nZXRUZXN0QmVkUmVuZGVyMygpLnJlc2V0VGVzdGluZ01vZHVsZSgpO1xuICAgIHJldHVybiBUZXN0QmVkUmVuZGVyMyBhcyBhbnkgYXMgVGVzdEJlZFN0YXRpYztcbiAgfVxuXG4gIC8vIFByb3BlcnRpZXNcblxuICBwbGF0Zm9ybTogUGxhdGZvcm1SZWYgPSBudWxsICE7XG4gIG5nTW9kdWxlOiBUeXBlPGFueT58VHlwZTxhbnk+W10gPSBudWxsICE7XG5cbiAgLy8gbWV0YWRhdGEgb3ZlcnJpZGVzXG4gIHByaXZhdGUgX21vZHVsZU92ZXJyaWRlczogW1R5cGU8YW55PiwgTWV0YWRhdGFPdmVycmlkZTxOZ01vZHVsZT5dW10gPSBbXTtcbiAgcHJpdmF0ZSBfY29tcG9uZW50T3ZlcnJpZGVzOiBbVHlwZTxhbnk+LCBNZXRhZGF0YU92ZXJyaWRlPENvbXBvbmVudD5dW10gPSBbXTtcbiAgcHJpdmF0ZSBfZGlyZWN0aXZlT3ZlcnJpZGVzOiBbVHlwZTxhbnk+LCBNZXRhZGF0YU92ZXJyaWRlPERpcmVjdGl2ZT5dW10gPSBbXTtcbiAgcHJpdmF0ZSBfcGlwZU92ZXJyaWRlczogW1R5cGU8YW55PiwgTWV0YWRhdGFPdmVycmlkZTxQaXBlPl1bXSA9IFtdO1xuICBwcml2YXRlIF9wcm92aWRlck92ZXJyaWRlczogUHJvdmlkZXJbXSA9IFtdO1xuICBwcml2YXRlIF9jb21waWxlclByb3ZpZGVyczogU3RhdGljUHJvdmlkZXJbXSA9IFtdO1xuICBwcml2YXRlIF9yb290UHJvdmlkZXJPdmVycmlkZXM6IFByb3ZpZGVyW10gPSBbXTtcbiAgcHJpdmF0ZSBfcHJvdmlkZXJPdmVycmlkZXNCeVRva2VuOiBNYXA8YW55LCBQcm92aWRlcltdPiA9IG5ldyBNYXAoKTtcbiAgcHJpdmF0ZSBfdGVtcGxhdGVPdmVycmlkZXM6IE1hcDxUeXBlPGFueT4sIHN0cmluZz4gPSBuZXcgTWFwKCk7XG4gIHByaXZhdGUgX3Jlc29sdmVyczogUmVzb2x2ZXJzID0gbnVsbCAhO1xuXG4gIC8vIHRlc3QgbW9kdWxlIGNvbmZpZ3VyYXRpb25cbiAgcHJpdmF0ZSBfcHJvdmlkZXJzOiBQcm92aWRlcltdID0gW107XG4gIHByaXZhdGUgX2NvbXBpbGVyT3B0aW9uczogQ29tcGlsZXJPcHRpb25zW10gPSBbXTtcbiAgcHJpdmF0ZSBfZGVjbGFyYXRpb25zOiBBcnJheTxUeXBlPGFueT58YW55W118YW55PiA9IFtdO1xuICBwcml2YXRlIF9pbXBvcnRzOiBBcnJheTxUeXBlPGFueT58YW55W118YW55PiA9IFtdO1xuICBwcml2YXRlIF9zY2hlbWFzOiBBcnJheTxTY2hlbWFNZXRhZGF0YXxhbnlbXT4gPSBbXTtcblxuICBwcml2YXRlIF9hY3RpdmVGaXh0dXJlczogQ29tcG9uZW50Rml4dHVyZTxhbnk+W10gPSBbXTtcblxuICBwcml2YXRlIF9jb21waWxlckluamVjdG9yOiBJbmplY3RvciA9IG51bGwgITtcbiAgcHJpdmF0ZSBfbW9kdWxlUmVmOiBOZ01vZHVsZVJlZjxhbnk+ID0gbnVsbCAhO1xuICBwcml2YXRlIF90ZXN0TW9kdWxlVHlwZTogTmdNb2R1bGVUeXBlPGFueT4gPSBudWxsICE7XG5cbiAgcHJpdmF0ZSBfaW5zdGFudGlhdGVkOiBib29sZWFuID0gZmFsc2U7XG4gIHByaXZhdGUgX2dsb2JhbENvbXBpbGF0aW9uQ2hlY2tlZCA9IGZhbHNlO1xuXG4gIHByaXZhdGUgX29yaWdpbmFsQ29tcG9uZW50UmVzb2x1dGlvblF1ZXVlOiBNYXA8VHlwZTxhbnk+LCBDb21wb25lbnQ+fG51bGwgPSBudWxsO1xuXG4gIC8vIE1hcCB0aGF0IGtlZXBzIGluaXRpYWwgdmVyc2lvbiBvZiBjb21wb25lbnQvZGlyZWN0aXZlL3BpcGUgZGVmcyBpbiBjYXNlXG4gIC8vIHdlIGNvbXBpbGUgYSBUeXBlIGFnYWluLCB0aHVzIG92ZXJyaWRpbmcgcmVzcGVjdGl2ZSBzdGF0aWMgZmllbGRzLiBUaGlzIGlzXG4gIC8vIHJlcXVpcmVkIHRvIG1ha2Ugc3VyZSB3ZSByZXN0b3JlIGRlZnMgdG8gdGhlaXIgaW5pdGlhbCBzdGF0ZXMgYmV0d2VlbiB0ZXN0IHJ1bnNcbiAgcHJpdmF0ZSBfaW5pdGlhbE5nRGVmczogTWFwPFR5cGU8YW55PiwgW3N0cmluZywgUHJvcGVydHlEZXNjcmlwdG9yfHVuZGVmaW5lZF0+ID0gbmV3IE1hcCgpO1xuXG4gIC8qKlxuICAgKiBJbml0aWFsaXplIHRoZSBlbnZpcm9ubWVudCBmb3IgdGVzdGluZyB3aXRoIGEgY29tcGlsZXIgZmFjdG9yeSwgYSBQbGF0Zm9ybVJlZiwgYW5kIGFuXG4gICAqIGFuZ3VsYXIgbW9kdWxlLiBUaGVzZSBhcmUgY29tbW9uIHRvIGV2ZXJ5IHRlc3QgaW4gdGhlIHN1aXRlLlxuICAgKlxuICAgKiBUaGlzIG1heSBvbmx5IGJlIGNhbGxlZCBvbmNlLCB0byBzZXQgdXAgdGhlIGNvbW1vbiBwcm92aWRlcnMgZm9yIHRoZSBjdXJyZW50IHRlc3RcbiAgICogc3VpdGUgb24gdGhlIGN1cnJlbnQgcGxhdGZvcm0uIElmIHlvdSBhYnNvbHV0ZWx5IG5lZWQgdG8gY2hhbmdlIHRoZSBwcm92aWRlcnMsXG4gICAqIGZpcnN0IHVzZSBgcmVzZXRUZXN0RW52aXJvbm1lbnRgLlxuICAgKlxuICAgKiBUZXN0IG1vZHVsZXMgYW5kIHBsYXRmb3JtcyBmb3IgaW5kaXZpZHVhbCBwbGF0Zm9ybXMgYXJlIGF2YWlsYWJsZSBmcm9tXG4gICAqICdAYW5ndWxhci88cGxhdGZvcm1fbmFtZT4vdGVzdGluZycuXG4gICAqXG4gICAqIEBwdWJsaWNBcGlcbiAgICovXG4gIGluaXRUZXN0RW52aXJvbm1lbnQoXG4gICAgICBuZ01vZHVsZTogVHlwZTxhbnk+fFR5cGU8YW55PltdLCBwbGF0Zm9ybTogUGxhdGZvcm1SZWYsIGFvdFN1bW1hcmllcz86ICgpID0+IGFueVtdKTogdm9pZCB7XG4gICAgaWYgKHRoaXMucGxhdGZvcm0gfHwgdGhpcy5uZ01vZHVsZSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3Qgc2V0IGJhc2UgcHJvdmlkZXJzIGJlY2F1c2UgaXQgaGFzIGFscmVhZHkgYmVlbiBjYWxsZWQnKTtcbiAgICB9XG4gICAgdGhpcy5wbGF0Zm9ybSA9IHBsYXRmb3JtO1xuICAgIHRoaXMubmdNb2R1bGUgPSBuZ01vZHVsZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXNldCB0aGUgcHJvdmlkZXJzIGZvciB0aGUgdGVzdCBpbmplY3Rvci5cbiAgICpcbiAgICogQHB1YmxpY0FwaVxuICAgKi9cbiAgcmVzZXRUZXN0RW52aXJvbm1lbnQoKTogdm9pZCB7XG4gICAgdGhpcy5yZXNldFRlc3RpbmdNb2R1bGUoKTtcbiAgICB0aGlzLnBsYXRmb3JtID0gbnVsbCAhO1xuICAgIHRoaXMubmdNb2R1bGUgPSBudWxsICE7XG4gIH1cblxuICByZXNldFRlc3RpbmdNb2R1bGUoKTogdm9pZCB7XG4gICAgdGhpcy5fY2hlY2tHbG9iYWxDb21waWxhdGlvbkZpbmlzaGVkKCk7XG4gICAgcmVzZXRDb21waWxlZENvbXBvbmVudHMoKTtcbiAgICAvLyByZXNldCBtZXRhZGF0YSBvdmVycmlkZXNcbiAgICB0aGlzLl9tb2R1bGVPdmVycmlkZXMgPSBbXTtcbiAgICB0aGlzLl9jb21wb25lbnRPdmVycmlkZXMgPSBbXTtcbiAgICB0aGlzLl9kaXJlY3RpdmVPdmVycmlkZXMgPSBbXTtcbiAgICB0aGlzLl9waXBlT3ZlcnJpZGVzID0gW107XG4gICAgdGhpcy5fcHJvdmlkZXJPdmVycmlkZXMgPSBbXTtcbiAgICB0aGlzLl9yb290UHJvdmlkZXJPdmVycmlkZXMgPSBbXTtcbiAgICB0aGlzLl9wcm92aWRlck92ZXJyaWRlc0J5VG9rZW4uY2xlYXIoKTtcbiAgICB0aGlzLl90ZW1wbGF0ZU92ZXJyaWRlcy5jbGVhcigpO1xuICAgIHRoaXMuX3Jlc29sdmVycyA9IG51bGwgITtcblxuICAgIC8vIHJlc2V0IHRlc3QgbW9kdWxlIGNvbmZpZ1xuICAgIHRoaXMuX3Byb3ZpZGVycyA9IFtdO1xuICAgIHRoaXMuX2NvbXBpbGVyT3B0aW9ucyA9IFtdO1xuICAgIHRoaXMuX2NvbXBpbGVyUHJvdmlkZXJzID0gW107XG4gICAgdGhpcy5fZGVjbGFyYXRpb25zID0gW107XG4gICAgdGhpcy5faW1wb3J0cyA9IFtdO1xuICAgIHRoaXMuX3NjaGVtYXMgPSBbXTtcbiAgICB0aGlzLl9tb2R1bGVSZWYgPSBudWxsICE7XG4gICAgdGhpcy5fdGVzdE1vZHVsZVR5cGUgPSBudWxsICE7XG5cbiAgICB0aGlzLl9jb21waWxlckluamVjdG9yID0gbnVsbCAhO1xuICAgIHRoaXMuX2luc3RhbnRpYXRlZCA9IGZhbHNlO1xuICAgIHRoaXMuX2FjdGl2ZUZpeHR1cmVzLmZvckVhY2goKGZpeHR1cmUpID0+IHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGZpeHR1cmUuZGVzdHJveSgpO1xuICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBjb25zb2xlLmVycm9yKCdFcnJvciBkdXJpbmcgY2xlYW51cCBvZiBjb21wb25lbnQnLCB7XG4gICAgICAgICAgY29tcG9uZW50OiBmaXh0dXJlLmNvbXBvbmVudEluc3RhbmNlLFxuICAgICAgICAgIHN0YWNrdHJhY2U6IGUsXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHRoaXMuX2FjdGl2ZUZpeHR1cmVzID0gW107XG5cbiAgICAvLyByZXN0b3JlIGluaXRpYWwgY29tcG9uZW50L2RpcmVjdGl2ZS9waXBlIGRlZnNcbiAgICB0aGlzLl9pbml0aWFsTmdEZWZzLmZvckVhY2goKHZhbHVlOiBbc3RyaW5nLCBQcm9wZXJ0eURlc2NyaXB0b3JdLCB0eXBlOiBUeXBlPGFueT4pID0+IHtcbiAgICAgIGNvbnN0IFtwcm9wLCBkZXNjcmlwdG9yXSA9IHZhbHVlO1xuICAgICAgaWYgKCFkZXNjcmlwdG9yKSB7XG4gICAgICAgIC8vIERlbGV0ZSBvcGVyYXRpb25zIGFyZSBnZW5lcmFsbHkgdW5kZXNpcmFibGUgc2luY2UgdGhleSBoYXZlIHBlcmZvcm1hbmNlIGltcGxpY2F0aW9ucyBvblxuICAgICAgICAvLyBvYmplY3RzIHRoZXkgd2VyZSBhcHBsaWVkIHRvLiBJbiB0aGlzIHBhcnRpY3VsYXIgY2FzZSwgc2l0dWF0aW9ucyB3aGVyZSB0aGlzIGNvZGUgaXNcbiAgICAgICAgLy8gaW52b2tlZCBzaG91bGQgYmUgcXVpdGUgcmFyZSB0byBjYXVzZSBhbnkgbm90aWNhYmxlIGltcGFjdCwgc2luY2UgaXQncyBhcHBsaWVkIG9ubHkgdG9cbiAgICAgICAgLy8gc29tZSB0ZXN0IGNhc2VzIChmb3IgZXhhbXBsZSB3aGVuIGNsYXNzIHdpdGggbm8gYW5ub3RhdGlvbnMgZXh0ZW5kcyBzb21lIEBDb21wb25lbnQpIHdoZW5cbiAgICAgICAgLy8gd2UgbmVlZCB0byBjbGVhciAnbmdDb21wb25lbnREZWYnIGZpZWxkIG9uIGEgZ2l2ZW4gY2xhc3MgdG8gcmVzdG9yZSBpdHMgb3JpZ2luYWwgc3RhdGVcbiAgICAgICAgLy8gKGJlZm9yZSBhcHBseWluZyBvdmVycmlkZXMgYW5kIHJ1bm5pbmcgdGVzdHMpLlxuICAgICAgICBkZWxldGUgKHR5cGUgYXMgYW55KVtwcm9wXTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0eXBlLCBwcm9wLCBkZXNjcmlwdG9yKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICB0aGlzLl9pbml0aWFsTmdEZWZzLmNsZWFyKCk7XG4gICAgdGhpcy5fcmVzdG9yZUNvbXBvbmVudFJlc29sdXRpb25RdWV1ZSgpO1xuICB9XG5cbiAgY29uZmlndXJlQ29tcGlsZXIoY29uZmlnOiB7cHJvdmlkZXJzPzogYW55W107IHVzZUppdD86IGJvb2xlYW47fSk6IHZvaWQge1xuICAgIGlmIChjb25maWcudXNlSml0ICE9IG51bGwpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcigndGhlIFJlbmRlcjMgY29tcGlsZXIgSmlUIG1vZGUgaXMgbm90IGNvbmZpZ3VyYWJsZSAhJyk7XG4gICAgfVxuXG4gICAgaWYgKGNvbmZpZy5wcm92aWRlcnMpIHtcbiAgICAgIHRoaXMuX3Byb3ZpZGVyT3ZlcnJpZGVzLnB1c2goLi4uY29uZmlnLnByb3ZpZGVycyk7XG4gICAgICB0aGlzLl9jb21waWxlclByb3ZpZGVycy5wdXNoKC4uLmNvbmZpZy5wcm92aWRlcnMpO1xuICAgIH1cbiAgfVxuXG4gIGNvbmZpZ3VyZVRlc3RpbmdNb2R1bGUobW9kdWxlRGVmOiBUZXN0TW9kdWxlTWV0YWRhdGEpOiB2b2lkIHtcbiAgICB0aGlzLl9hc3NlcnROb3RJbnN0YW50aWF0ZWQoJ1IzVGVzdEJlZC5jb25maWd1cmVUZXN0aW5nTW9kdWxlJywgJ2NvbmZpZ3VyZSB0aGUgdGVzdCBtb2R1bGUnKTtcbiAgICBpZiAobW9kdWxlRGVmLnByb3ZpZGVycykge1xuICAgICAgdGhpcy5fcHJvdmlkZXJzLnB1c2goLi4ubW9kdWxlRGVmLnByb3ZpZGVycyk7XG4gICAgfVxuICAgIGlmIChtb2R1bGVEZWYuZGVjbGFyYXRpb25zKSB7XG4gICAgICB0aGlzLl9kZWNsYXJhdGlvbnMucHVzaCguLi5tb2R1bGVEZWYuZGVjbGFyYXRpb25zKTtcbiAgICB9XG4gICAgaWYgKG1vZHVsZURlZi5pbXBvcnRzKSB7XG4gICAgICB0aGlzLl9pbXBvcnRzLnB1c2goLi4ubW9kdWxlRGVmLmltcG9ydHMpO1xuICAgIH1cbiAgICBpZiAobW9kdWxlRGVmLnNjaGVtYXMpIHtcbiAgICAgIHRoaXMuX3NjaGVtYXMucHVzaCguLi5tb2R1bGVEZWYuc2NoZW1hcyk7XG4gICAgfVxuICB9XG5cbiAgY29tcGlsZUNvbXBvbmVudHMoKTogUHJvbWlzZTxhbnk+IHtcbiAgICB0aGlzLl9jbGVhckNvbXBvbmVudFJlc29sdXRpb25RdWV1ZSgpO1xuXG4gICAgY29uc3QgcmVzb2x2ZXJzID0gdGhpcy5fZ2V0UmVzb2x2ZXJzKCk7XG4gICAgY29uc3QgZGVjbGFyYXRpb25zOiBUeXBlPGFueT5bXSA9IGZsYXR0ZW4odGhpcy5fZGVjbGFyYXRpb25zIHx8IEVNUFRZX0FSUkFZLCByZXNvbHZlRm9yd2FyZFJlZik7XG5cbiAgICBjb25zdCBjb21wb25lbnRPdmVycmlkZXM6IFtUeXBlPGFueT4sIENvbXBvbmVudF1bXSA9IFtdO1xuICAgIGNvbnN0IHByb3ZpZGVyT3ZlcnJpZGVzOiAoKCkgPT4gdm9pZClbXSA9IFtdO1xuICAgIGxldCBoYXNBc3luY1Jlc291cmNlcyA9IGZhbHNlO1xuXG4gICAgLy8gQ29tcGlsZSB0aGUgY29tcG9uZW50cyBkZWNsYXJlZCBieSB0aGlzIG1vZHVsZVxuICAgIC8vIFRPRE8oRlctMTE3OCk6IGBjb21waWxlQ29tcG9uZW50c2Agc2hvdWxkIG5vdCBkdXBsaWNhdGUgYF9jb21waWxlTmdNb2R1bGVgIGxvZ2ljXG4gICAgZGVjbGFyYXRpb25zLmZvckVhY2goZGVjbGFyYXRpb24gPT4ge1xuICAgICAgY29uc3QgY29tcG9uZW50ID0gcmVzb2x2ZXJzLmNvbXBvbmVudC5yZXNvbHZlKGRlY2xhcmF0aW9uKTtcbiAgICAgIGlmIChjb21wb25lbnQpIHtcbiAgICAgICAgaWYgKCFkZWNsYXJhdGlvbi5oYXNPd25Qcm9wZXJ0eShOR19DT01QT05FTlRfREVGKSB8fFxuICAgICAgICAgICAgaXNDb21wb25lbnREZWZQZW5kaW5nUmVzb2x1dGlvbihkZWNsYXJhdGlvbikgfHwgIC8vXG4gICAgICAgICAgICAvLyBDb21waWxlciBwcm92aWRlciBvdmVycmlkZXMgKGxpa2UgUmVzb3VyY2VMb2FkZXIpIG1pZ2h0IGFmZmVjdCB0aGUgb3V0Y29tZSBvZlxuICAgICAgICAgICAgLy8gY29tcGlsYXRpb24sIHNvIHdlIHRyaWdnZXIgYGNvbXBpbGVDb21wb25lbnRgIGluIGNhc2Ugd2UgaGF2ZSBjb21waWxlcnMgb3ZlcnJpZGVzLlxuICAgICAgICAgICAgdGhpcy5fY29tcGlsZXJQcm92aWRlcnMubGVuZ3RoID4gMCB8fFxuICAgICAgICAgICAgdGhpcy5faGFzVHlwZU92ZXJyaWRlcyhkZWNsYXJhdGlvbiwgdGhpcy5fY29tcG9uZW50T3ZlcnJpZGVzKSB8fFxuICAgICAgICAgICAgdGhpcy5faGFzVGVtcGxhdGVPdmVycmlkZXMoZGVjbGFyYXRpb24pKSB7XG4gICAgICAgICAgdGhpcy5fc3RvcmVOZ0RlZihOR19DT01QT05FTlRfREVGLCBkZWNsYXJhdGlvbik7XG4gICAgICAgICAgLy8gV2UgbWFrZSBhIGNvcHkgb2YgdGhlIG1ldGFkYXRhIHRvIGVuc3VyZSB0aGF0IHdlIGRvbid0IG11dGF0ZSB0aGUgb3JpZ2luYWwgbWV0YWRhdGFcbiAgICAgICAgICBjb25zdCBtZXRhZGF0YSA9IHsuLi5jb21wb25lbnR9O1xuICAgICAgICAgIGNvbXBpbGVDb21wb25lbnQoZGVjbGFyYXRpb24sIG1ldGFkYXRhKTtcbiAgICAgICAgICBjb21wb25lbnRPdmVycmlkZXMucHVzaChbZGVjbGFyYXRpb24sIG1ldGFkYXRhXSk7XG4gICAgICAgICAgaGFzQXN5bmNSZXNvdXJjZXMgPSBoYXNBc3luY1Jlc291cmNlcyB8fCBjb21wb25lbnROZWVkc1Jlc29sdXRpb24oY29tcG9uZW50KTtcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLl9oYXNQcm92aWRlck92ZXJyaWRlcyhjb21wb25lbnQucHJvdmlkZXJzKSkge1xuICAgICAgICAgIC8vIFF1ZXVlIHByb3ZpZGVyIG92ZXJyaWRlIG9wZXJhdGlvbnMsIHNpbmNlIGZldGNoaW5nIG5nQ29tcG9uZW50RGVmICh0byBwYXRjaCBpdCkgbWlnaHRcbiAgICAgICAgICAvLyB0cmlnZ2VyIHJlLWNvbXBpbGF0aW9uLCB3aGljaCB3aWxsIGZhaWwgYmVjYXVzZSBjb21wb25lbnQgcmVzb3VyY2VzIGFyZSBub3QgeWV0IGZ1bGx5XG4gICAgICAgICAgLy8gcmVzb2x2ZWQgYXQgdGhpcyBtb21lbnQuIFRoZSBxdWV1ZSBpcyBkcmFpbmVkIG9uY2UgYWxsIHJlc291cmNlcyBhcmUgcmVzb2x2ZWQuXG4gICAgICAgICAgcHJvdmlkZXJPdmVycmlkZXMucHVzaChcbiAgICAgICAgICAgICAgKCkgPT4gdGhpcy5fcGF0Y2hEZWZXaXRoUHJvdmlkZXJPdmVycmlkZXMoZGVjbGFyYXRpb24sIE5HX0NPTVBPTkVOVF9ERUYpKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuXG4gICAgY29uc3Qgb3ZlcnJpZGVDb21wb25lbnRzID0gKCkgPT4ge1xuICAgICAgY29tcG9uZW50T3ZlcnJpZGVzLmZvckVhY2goKG92ZXJyaWRlOiBbVHlwZTxhbnk+LCBDb21wb25lbnRdKSA9PiB7XG4gICAgICAgIC8vIE92ZXJyaWRlIHRoZSBleGlzdGluZyBtZXRhZGF0YSwgZW5zdXJpbmcgdGhhdCB0aGUgcmVzb2x2ZWQgcmVzb3VyY2VzXG4gICAgICAgIC8vIGFyZSBvbmx5IGF2YWlsYWJsZSB1bnRpbCB0aGUgbmV4dCBUZXN0QmVkIHJlc2V0ICh3aGVuIGByZXNldFRlc3RpbmdNb2R1bGVgIGlzIGNhbGxlZClcbiAgICAgICAgdGhpcy5vdmVycmlkZUNvbXBvbmVudChvdmVycmlkZVswXSwge3NldDogb3ZlcnJpZGVbMV19KTtcbiAgICAgIH0pO1xuICAgICAgcHJvdmlkZXJPdmVycmlkZXMuZm9yRWFjaCgob3ZlcnJpZGVGbjogKCkgPT4gdm9pZCkgPT4gb3ZlcnJpZGVGbigpKTtcbiAgICB9O1xuXG4gICAgLy8gSWYgdGhlIGNvbXBvbmVudCBoYXMgbm8gYXN5bmMgcmVzb3VyY2VzICh0ZW1wbGF0ZVVybCwgc3R5bGVVcmxzKSwgd2UgY2FuIGZpbmlzaFxuICAgIC8vIHN5bmNocm9ub3VzbHkuIFRoaXMgaXMgaW1wb3J0YW50IHNvIHRoYXQgdXNlcnMgd2hvIG1pc3Rha2VubHkgdHJlYXQgYGNvbXBpbGVDb21wb25lbnRzYFxuICAgIC8vIGFzIHN5bmNocm9ub3VzIGRvbid0IGVuY291bnRlciBhbiBlcnJvciwgYXMgVmlld0VuZ2luZSB3YXMgdG9sZXJhbnQgb2YgdGhpcy5cbiAgICBpZiAoIWhhc0FzeW5jUmVzb3VyY2VzKSB7XG4gICAgICBvdmVycmlkZUNvbXBvbmVudHMoKTtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbGV0IHJlc291cmNlTG9hZGVyOiBSZXNvdXJjZUxvYWRlcjtcbiAgICAgIHJldHVybiByZXNvbHZlQ29tcG9uZW50UmVzb3VyY2VzKHVybCA9PiB7XG4gICAgICAgICAgICAgICBpZiAoIXJlc291cmNlTG9hZGVyKSB7XG4gICAgICAgICAgICAgICAgIHJlc291cmNlTG9hZGVyID0gdGhpcy5jb21waWxlckluamVjdG9yLmdldChSZXNvdXJjZUxvYWRlcik7XG4gICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHJlc291cmNlTG9hZGVyLmdldCh1cmwpKTtcbiAgICAgICAgICAgICB9KVxuICAgICAgICAgIC50aGVuKG92ZXJyaWRlQ29tcG9uZW50cyk7XG4gICAgfVxuICB9XG5cbiAgZ2V0KHRva2VuOiBhbnksIG5vdEZvdW5kVmFsdWU6IGFueSA9IEluamVjdG9yLlRIUk9XX0lGX05PVF9GT1VORCk6IGFueSB7XG4gICAgdGhpcy5faW5pdElmTmVlZGVkKCk7XG4gICAgaWYgKHRva2VuID09PSBUZXN0QmVkUmVuZGVyMykge1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIGNvbnN0IHJlc3VsdCA9IHRoaXMuX21vZHVsZVJlZi5pbmplY3Rvci5nZXQodG9rZW4sIFVOREVGSU5FRCk7XG4gICAgcmV0dXJuIHJlc3VsdCA9PT0gVU5ERUZJTkVEID8gdGhpcy5jb21waWxlckluamVjdG9yLmdldCh0b2tlbiwgbm90Rm91bmRWYWx1ZSkgOiByZXN1bHQ7XG4gIH1cblxuICBleGVjdXRlKHRva2VuczogYW55W10sIGZuOiBGdW5jdGlvbiwgY29udGV4dD86IGFueSk6IGFueSB7XG4gICAgdGhpcy5faW5pdElmTmVlZGVkKCk7XG4gICAgY29uc3QgcGFyYW1zID0gdG9rZW5zLm1hcCh0ID0+IHRoaXMuZ2V0KHQpKTtcbiAgICByZXR1cm4gZm4uYXBwbHkoY29udGV4dCwgcGFyYW1zKTtcbiAgfVxuXG4gIG92ZXJyaWRlTW9kdWxlKG5nTW9kdWxlOiBUeXBlPGFueT4sIG92ZXJyaWRlOiBNZXRhZGF0YU92ZXJyaWRlPE5nTW9kdWxlPik6IHZvaWQge1xuICAgIHRoaXMuX2Fzc2VydE5vdEluc3RhbnRpYXRlZCgnb3ZlcnJpZGVNb2R1bGUnLCAnb3ZlcnJpZGUgbW9kdWxlIG1ldGFkYXRhJyk7XG4gICAgdGhpcy5fbW9kdWxlT3ZlcnJpZGVzLnB1c2goW25nTW9kdWxlLCBvdmVycmlkZV0pO1xuICB9XG5cbiAgb3ZlcnJpZGVDb21wb25lbnQoY29tcG9uZW50OiBUeXBlPGFueT4sIG92ZXJyaWRlOiBNZXRhZGF0YU92ZXJyaWRlPENvbXBvbmVudD4pOiB2b2lkIHtcbiAgICB0aGlzLl9hc3NlcnROb3RJbnN0YW50aWF0ZWQoJ292ZXJyaWRlQ29tcG9uZW50JywgJ292ZXJyaWRlIGNvbXBvbmVudCBtZXRhZGF0YScpO1xuICAgIHRoaXMuX2NvbXBvbmVudE92ZXJyaWRlcy5wdXNoKFtjb21wb25lbnQsIG92ZXJyaWRlXSk7XG4gIH1cblxuICBvdmVycmlkZURpcmVjdGl2ZShkaXJlY3RpdmU6IFR5cGU8YW55Piwgb3ZlcnJpZGU6IE1ldGFkYXRhT3ZlcnJpZGU8RGlyZWN0aXZlPik6IHZvaWQge1xuICAgIHRoaXMuX2Fzc2VydE5vdEluc3RhbnRpYXRlZCgnb3ZlcnJpZGVEaXJlY3RpdmUnLCAnb3ZlcnJpZGUgZGlyZWN0aXZlIG1ldGFkYXRhJyk7XG4gICAgdGhpcy5fZGlyZWN0aXZlT3ZlcnJpZGVzLnB1c2goW2RpcmVjdGl2ZSwgb3ZlcnJpZGVdKTtcbiAgfVxuXG4gIG92ZXJyaWRlUGlwZShwaXBlOiBUeXBlPGFueT4sIG92ZXJyaWRlOiBNZXRhZGF0YU92ZXJyaWRlPFBpcGU+KTogdm9pZCB7XG4gICAgdGhpcy5fYXNzZXJ0Tm90SW5zdGFudGlhdGVkKCdvdmVycmlkZVBpcGUnLCAnb3ZlcnJpZGUgcGlwZSBtZXRhZGF0YScpO1xuICAgIHRoaXMuX3BpcGVPdmVycmlkZXMucHVzaChbcGlwZSwgb3ZlcnJpZGVdKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBPdmVyd3JpdGVzIGFsbCBwcm92aWRlcnMgZm9yIHRoZSBnaXZlbiB0b2tlbiB3aXRoIHRoZSBnaXZlbiBwcm92aWRlciBkZWZpbml0aW9uLlxuICAgKi9cbiAgb3ZlcnJpZGVQcm92aWRlcih0b2tlbjogYW55LCBwcm92aWRlcjoge3VzZUZhY3Rvcnk/OiBGdW5jdGlvbiwgdXNlVmFsdWU/OiBhbnksIGRlcHM/OiBhbnlbXX0pOlxuICAgICAgdm9pZCB7XG4gICAgY29uc3QgcHJvdmlkZXJEZWYgPSBwcm92aWRlci51c2VGYWN0b3J5ID9cbiAgICAgICAge3Byb3ZpZGU6IHRva2VuLCB1c2VGYWN0b3J5OiBwcm92aWRlci51c2VGYWN0b3J5LCBkZXBzOiBwcm92aWRlci5kZXBzIHx8IFtdfSA6XG4gICAgICAgIHtwcm92aWRlOiB0b2tlbiwgdXNlVmFsdWU6IHByb3ZpZGVyLnVzZVZhbHVlfTtcblxuICAgIGxldCBpbmplY3RhYmxlRGVmOiBJbmplY3RhYmxlRGVmPGFueT58bnVsbDtcbiAgICBjb25zdCBpc1Jvb3QgPVxuICAgICAgICAodHlwZW9mIHRva2VuICE9PSAnc3RyaW5nJyAmJiAoaW5qZWN0YWJsZURlZiA9IGdldEluamVjdGFibGVEZWYodG9rZW4pKSAmJlxuICAgICAgICAgaW5qZWN0YWJsZURlZi5wcm92aWRlZEluID09PSAncm9vdCcpO1xuICAgIGNvbnN0IG92ZXJyaWRlc0J1Y2tldCA9IGlzUm9vdCA/IHRoaXMuX3Jvb3RQcm92aWRlck92ZXJyaWRlcyA6IHRoaXMuX3Byb3ZpZGVyT3ZlcnJpZGVzO1xuICAgIG92ZXJyaWRlc0J1Y2tldC5wdXNoKHByb3ZpZGVyRGVmKTtcblxuICAgIC8vIGtlZXAgYWxsIG92ZXJyaWRlcyBncm91cGVkIGJ5IHRva2VuIGFzIHdlbGwgZm9yIGZhc3QgbG9va3VwcyB1c2luZyB0b2tlblxuICAgIGNvbnN0IG92ZXJyaWRlc0ZvclRva2VuID0gdGhpcy5fcHJvdmlkZXJPdmVycmlkZXNCeVRva2VuLmdldCh0b2tlbikgfHwgW107XG4gICAgb3ZlcnJpZGVzRm9yVG9rZW4ucHVzaChwcm92aWRlckRlZik7XG4gICAgdGhpcy5fcHJvdmlkZXJPdmVycmlkZXNCeVRva2VuLnNldCh0b2tlbiwgb3ZlcnJpZGVzRm9yVG9rZW4pO1xuICB9XG5cbiAgLyoqXG4gICAqIE92ZXJ3cml0ZXMgYWxsIHByb3ZpZGVycyBmb3IgdGhlIGdpdmVuIHRva2VuIHdpdGggdGhlIGdpdmVuIHByb3ZpZGVyIGRlZmluaXRpb24uXG4gICAqXG4gICAqIEBkZXByZWNhdGVkIGFzIGl0IG1ha2VzIGFsbCBOZ01vZHVsZXMgbGF6eS4gSW50cm9kdWNlZCBvbmx5IGZvciBtaWdyYXRpbmcgb2ZmIG9mIGl0LlxuICAgKi9cbiAgZGVwcmVjYXRlZE92ZXJyaWRlUHJvdmlkZXIodG9rZW46IGFueSwgcHJvdmlkZXI6IHtcbiAgICB1c2VGYWN0b3J5OiBGdW5jdGlvbixcbiAgICBkZXBzOiBhbnlbXSxcbiAgfSk6IHZvaWQ7XG4gIGRlcHJlY2F0ZWRPdmVycmlkZVByb3ZpZGVyKHRva2VuOiBhbnksIHByb3ZpZGVyOiB7dXNlVmFsdWU6IGFueTt9KTogdm9pZDtcbiAgZGVwcmVjYXRlZE92ZXJyaWRlUHJvdmlkZXIoXG4gICAgICB0b2tlbjogYW55LCBwcm92aWRlcjoge3VzZUZhY3Rvcnk/OiBGdW5jdGlvbiwgdXNlVmFsdWU/OiBhbnksIGRlcHM/OiBhbnlbXX0pOiB2b2lkIHtcbiAgICAvLyBIQUNLOiBUaGlzIGlzIE5PVCB0aGUgY29ycmVjdCBpbXBsZW1lbnRhdGlvbiBmb3IgZGVwcmVjYXRlZE92ZXJyaWRlUHJvdmlkZXIuXG4gICAgLy8gVG8gaW1wbGVtZW50IGl0IGluIGEgYmFja3dhcmQgY29tcGF0aWJsZSB3YXksIHdlIHdvdWxkIG5lZWQgdG8gcmVjb3JkIHNvbWUgc3RhdGVcbiAgICAvLyBzbyB3ZSBrbm93IHRvIHByZXZlbnQgZWFnZXIgaW5zdGFudGlhdGlvbiBvZiBOZ01vZHVsZXMuIEhvd2V2ZXIsIHdlIGRvbid0IHBsYW5cbiAgICAvLyB0byBpbXBsZW1lbnQgdGhpcyBhdCBhbGwgc2luY2UgdGhlIEFQSSBpcyBkZXByZWNhdGVkIGFuZCBzY2hlZHVsZWQgZm9yIHJlbW92YWxcbiAgICAvLyBpbiBWOC4gVGhpcyBoYWNrIGlzIGhlcmUgdGVtcG9yYXJpbHkgZm9yIEl2eSB0ZXN0aW5nIHVudGlsIHdlIHRyYW5zaXRpb24gYXBwc1xuICAgIC8vIGluc2lkZSBHb29nbGUgdG8gdGhlIG92ZXJyaWRlUHJvdmlkZXIgQVBJLiBBdCB0aGF0IHBvaW50LCB3ZSB3aWxsIGJlIGFibGUgdG9cbiAgICAvLyByZW1vdmUgdGhpcyBtZXRob2QgZW50aXJlbHkuIEluIHRoZSBtZWFudGltZSwgd2UgY2FuIHVzZSBvdmVycmlkZVByb3ZpZGVyIHRvXG4gICAgLy8gdGVzdCBhcHBzIHdpdGggSXZ5IHRoYXQgZG9uJ3QgY2FyZSBhYm91dCBlYWdlciBpbnN0YW50aWF0aW9uLiBUaGlzIGZpeGVzIDg1JVxuICAgIC8vIG9mIGNhc2VzIGluIG91ciBibHVlcHJpbnQuXG4gICAgdGhpcy5vdmVycmlkZVByb3ZpZGVyKHRva2VuLCBwcm92aWRlciBhcyBhbnkpO1xuICB9XG5cbiAgY3JlYXRlQ29tcG9uZW50PFQ+KHR5cGU6IFR5cGU8VD4pOiBDb21wb25lbnRGaXh0dXJlPFQ+IHtcbiAgICB0aGlzLl9pbml0SWZOZWVkZWQoKTtcblxuICAgIGNvbnN0IHRlc3RDb21wb25lbnRSZW5kZXJlcjogVGVzdENvbXBvbmVudFJlbmRlcmVyID0gdGhpcy5nZXQoVGVzdENvbXBvbmVudFJlbmRlcmVyKTtcbiAgICBjb25zdCByb290RWxJZCA9IGByb290JHtfbmV4dFJvb3RFbGVtZW50SWQrK31gO1xuICAgIHRlc3RDb21wb25lbnRSZW5kZXJlci5pbnNlcnRSb290RWxlbWVudChyb290RWxJZCk7XG5cbiAgICBjb25zdCBjb21wb25lbnREZWYgPSAodHlwZSBhcyBhbnkpLm5nQ29tcG9uZW50RGVmO1xuXG4gICAgaWYgKCFjb21wb25lbnREZWYpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICBgSXQgbG9va3MgbGlrZSAnJHtzdHJpbmdpZnkodHlwZSl9JyBoYXMgbm90IGJlZW4gSVZZIGNvbXBpbGVkIC0gaXQgaGFzIG5vICduZ0NvbXBvbmVudERlZicgZmllbGRgKTtcbiAgICB9XG5cbiAgICBjb25zdCBub05nWm9uZTogYm9vbGVhbiA9IHRoaXMuZ2V0KENvbXBvbmVudEZpeHR1cmVOb05nWm9uZSwgZmFsc2UpO1xuICAgIGNvbnN0IGF1dG9EZXRlY3Q6IGJvb2xlYW4gPSB0aGlzLmdldChDb21wb25lbnRGaXh0dXJlQXV0b0RldGVjdCwgZmFsc2UpO1xuICAgIGNvbnN0IG5nWm9uZTogTmdab25lID0gbm9OZ1pvbmUgPyBudWxsIDogdGhpcy5nZXQoTmdab25lLCBudWxsKTtcbiAgICBjb25zdCBjb21wb25lbnRGYWN0b3J5ID0gbmV3IENvbXBvbmVudEZhY3RvcnkoY29tcG9uZW50RGVmKTtcbiAgICBjb25zdCBpbml0Q29tcG9uZW50ID0gKCkgPT4ge1xuICAgICAgY29uc3QgY29tcG9uZW50UmVmID1cbiAgICAgICAgICBjb21wb25lbnRGYWN0b3J5LmNyZWF0ZShJbmplY3Rvci5OVUxMLCBbXSwgYCMke3Jvb3RFbElkfWAsIHRoaXMuX21vZHVsZVJlZik7XG4gICAgICByZXR1cm4gbmV3IENvbXBvbmVudEZpeHR1cmU8YW55Pihjb21wb25lbnRSZWYsIG5nWm9uZSwgYXV0b0RldGVjdCk7XG4gICAgfTtcbiAgICBjb25zdCBmaXh0dXJlID0gbmdab25lID8gbmdab25lLnJ1bihpbml0Q29tcG9uZW50KSA6IGluaXRDb21wb25lbnQoKTtcbiAgICB0aGlzLl9hY3RpdmVGaXh0dXJlcy5wdXNoKGZpeHR1cmUpO1xuICAgIHJldHVybiBmaXh0dXJlO1xuICB9XG5cbiAgLy8gaW50ZXJuYWwgbWV0aG9kc1xuXG4gIHByaXZhdGUgX2luaXRJZk5lZWRlZCgpOiB2b2lkIHtcbiAgICB0aGlzLl9jaGVja0dsb2JhbENvbXBpbGF0aW9uRmluaXNoZWQoKTtcbiAgICBpZiAodGhpcy5faW5zdGFudGlhdGVkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5fcmVzb2x2ZXJzID0gdGhpcy5fZ2V0UmVzb2x2ZXJzKCk7XG4gICAgdGhpcy5fdGVzdE1vZHVsZVR5cGUgPSB0aGlzLl9jcmVhdGVUZXN0TW9kdWxlKCk7XG4gICAgdGhpcy5fY29tcGlsZU5nTW9kdWxlKHRoaXMuX3Rlc3RNb2R1bGVUeXBlKTtcblxuICAgIGNvbnN0IHBhcmVudEluamVjdG9yID0gdGhpcy5wbGF0Zm9ybS5pbmplY3RvcjtcbiAgICB0aGlzLl9tb2R1bGVSZWYgPSBuZXcgTmdNb2R1bGVSZWYodGhpcy5fdGVzdE1vZHVsZVR5cGUsIHBhcmVudEluamVjdG9yKTtcblxuICAgIC8vIEFwcGxpY2F0aW9uSW5pdFN0YXR1cy5ydW5Jbml0aWFsaXplcnMoKSBpcyBtYXJrZWQgQGludGVybmFsXG4gICAgLy8gdG8gY29yZS4gQ2FzdCBpdCB0byBhbnkgYmVmb3JlIGFjY2Vzc2luZyBpdC5cbiAgICAodGhpcy5fbW9kdWxlUmVmLmluamVjdG9yLmdldChBcHBsaWNhdGlvbkluaXRTdGF0dXMpIGFzIGFueSkucnVuSW5pdGlhbGl6ZXJzKCk7XG4gICAgdGhpcy5faW5zdGFudGlhdGVkID0gdHJ1ZTtcbiAgfVxuXG4gIHByaXZhdGUgX3N0b3JlTmdEZWYocHJvcDogc3RyaW5nLCB0eXBlOiBUeXBlPGFueT4pIHtcbiAgICBpZiAoIXRoaXMuX2luaXRpYWxOZ0RlZnMuaGFzKHR5cGUpKSB7XG4gICAgICBjb25zdCBjdXJyZW50RGVmID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcih0eXBlLCBwcm9wKTtcbiAgICAgIHRoaXMuX2luaXRpYWxOZ0RlZnMuc2V0KHR5cGUsIFtwcm9wLCBjdXJyZW50RGVmXSk7XG4gICAgfVxuICB9XG5cbiAgLy8gZ2V0IG92ZXJyaWRlcyBmb3IgYSBzcGVjaWZpYyBwcm92aWRlciAoaWYgYW55KVxuICBwcml2YXRlIF9nZXRQcm92aWRlck92ZXJyaWRlcyhwcm92aWRlcjogYW55KSB7XG4gICAgY29uc3QgdG9rZW4gPSBwcm92aWRlciAmJiB0eXBlb2YgcHJvdmlkZXIgPT09ICdvYmplY3QnICYmIHByb3ZpZGVyLmhhc093blByb3BlcnR5KCdwcm92aWRlJykgP1xuICAgICAgICBwcm92aWRlci5wcm92aWRlIDpcbiAgICAgICAgcHJvdmlkZXI7XG4gICAgcmV0dXJuIHRoaXMuX3Byb3ZpZGVyT3ZlcnJpZGVzQnlUb2tlbi5nZXQodG9rZW4pIHx8IFtdO1xuICB9XG5cbiAgLy8gY3JlYXRlcyByZXNvbHZlcnMgdGFraW5nIG92ZXJyaWRlcyBpbnRvIGFjY291bnRcbiAgcHJpdmF0ZSBfZ2V0UmVzb2x2ZXJzKCkge1xuICAgIGNvbnN0IG1vZHVsZSA9IG5ldyBOZ01vZHVsZVJlc29sdmVyKCk7XG4gICAgbW9kdWxlLnNldE92ZXJyaWRlcyh0aGlzLl9tb2R1bGVPdmVycmlkZXMpO1xuXG4gICAgY29uc3QgY29tcG9uZW50ID0gbmV3IENvbXBvbmVudFJlc29sdmVyKCk7XG4gICAgY29tcG9uZW50LnNldE92ZXJyaWRlcyh0aGlzLl9jb21wb25lbnRPdmVycmlkZXMpO1xuXG4gICAgY29uc3QgZGlyZWN0aXZlID0gbmV3IERpcmVjdGl2ZVJlc29sdmVyKCk7XG4gICAgZGlyZWN0aXZlLnNldE92ZXJyaWRlcyh0aGlzLl9kaXJlY3RpdmVPdmVycmlkZXMpO1xuXG4gICAgY29uc3QgcGlwZSA9IG5ldyBQaXBlUmVzb2x2ZXIoKTtcbiAgICBwaXBlLnNldE92ZXJyaWRlcyh0aGlzLl9waXBlT3ZlcnJpZGVzKTtcblxuICAgIHJldHVybiB7bW9kdWxlLCBjb21wb25lbnQsIGRpcmVjdGl2ZSwgcGlwZX07XG4gIH1cblxuICBwcml2YXRlIF9hc3NlcnROb3RJbnN0YW50aWF0ZWQobWV0aG9kTmFtZTogc3RyaW5nLCBtZXRob2REZXNjcmlwdGlvbjogc3RyaW5nKSB7XG4gICAgaWYgKHRoaXMuX2luc3RhbnRpYXRlZCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgIGBDYW5ub3QgJHttZXRob2REZXNjcmlwdGlvbn0gd2hlbiB0aGUgdGVzdCBtb2R1bGUgaGFzIGFscmVhZHkgYmVlbiBpbnN0YW50aWF0ZWQuIGAgK1xuICAgICAgICAgIGBNYWtlIHN1cmUgeW91IGFyZSBub3QgdXNpbmcgXFxgaW5qZWN0XFxgIGJlZm9yZSBcXGAke21ldGhvZE5hbWV9XFxgLmApO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgX2NyZWF0ZVRlc3RNb2R1bGUoKTogTmdNb2R1bGVUeXBlIHtcbiAgICBjb25zdCByb290UHJvdmlkZXJPdmVycmlkZXMgPSB0aGlzLl9yb290UHJvdmlkZXJPdmVycmlkZXM7XG5cbiAgICBATmdNb2R1bGUoe1xuICAgICAgcHJvdmlkZXJzOiBbLi4ucm9vdFByb3ZpZGVyT3ZlcnJpZGVzXSxcbiAgICAgIGppdDogdHJ1ZSxcbiAgICB9KVxuICAgIGNsYXNzIFJvb3RTY29wZU1vZHVsZSB7XG4gICAgfVxuXG4gICAgY29uc3Qgbmdab25lID0gbmV3IE5nWm9uZSh7ZW5hYmxlTG9uZ1N0YWNrVHJhY2U6IHRydWV9KTtcbiAgICBjb25zdCBwcm92aWRlcnMgPSBbXG4gICAgICB7cHJvdmlkZTogTmdab25lLCB1c2VWYWx1ZTogbmdab25lfSxcbiAgICAgIHtwcm92aWRlOiBDb21waWxlciwgdXNlRmFjdG9yeTogKCkgPT4gbmV3IFIzVGVzdENvbXBpbGVyKHRoaXMpfSxcbiAgICAgIHtwcm92aWRlOiBFcnJvckhhbmRsZXIsIHVzZUNsYXNzOiBSM1Rlc3RFcnJvckhhbmRsZXJ9LFxuICAgICAgLi4udGhpcy5fcHJvdmlkZXJzLFxuICAgICAgLi4udGhpcy5fcHJvdmlkZXJPdmVycmlkZXMsXG4gICAgXTtcblxuICAgIGNvbnN0IGRlY2xhcmF0aW9ucyA9IHRoaXMuX2RlY2xhcmF0aW9ucztcbiAgICBjb25zdCBpbXBvcnRzID0gW1Jvb3RTY29wZU1vZHVsZSwgdGhpcy5uZ01vZHVsZSwgdGhpcy5faW1wb3J0c107XG4gICAgY29uc3Qgc2NoZW1hcyA9IHRoaXMuX3NjaGVtYXM7XG5cbiAgICBATmdNb2R1bGUoe3Byb3ZpZGVycywgZGVjbGFyYXRpb25zLCBpbXBvcnRzLCBzY2hlbWFzLCBqaXQ6IHRydWV9KVxuICAgIGNsYXNzIER5bmFtaWNUZXN0TW9kdWxlIHtcbiAgICB9XG5cbiAgICByZXR1cm4gRHluYW1pY1Rlc3RNb2R1bGUgYXMgTmdNb2R1bGVUeXBlO1xuICB9XG5cbiAgZ2V0IGNvbXBpbGVySW5qZWN0b3IoKTogSW5qZWN0b3Ige1xuICAgIGlmICh0aGlzLl9jb21waWxlckluamVjdG9yICE9PSBudWxsKSB7XG4gICAgICByZXR1cm4gdGhpcy5fY29tcGlsZXJJbmplY3RvcjtcbiAgICB9XG5cbiAgICBjb25zdCBwcm92aWRlcnM6IFN0YXRpY1Byb3ZpZGVyW10gPSBbXTtcbiAgICBjb25zdCBjb21waWxlck9wdGlvbnMgPSB0aGlzLnBsYXRmb3JtLmluamVjdG9yLmdldChDT01QSUxFUl9PUFRJT05TKTtcbiAgICBjb21waWxlck9wdGlvbnMuZm9yRWFjaChvcHRzID0+IHtcbiAgICAgIGlmIChvcHRzLnByb3ZpZGVycykge1xuICAgICAgICBwcm92aWRlcnMucHVzaChvcHRzLnByb3ZpZGVycyk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgcHJvdmlkZXJzLnB1c2goLi4udGhpcy5fY29tcGlsZXJQcm92aWRlcnMpO1xuXG4gICAgLy8gVE9ETyhvY29tYmUpOiBtYWtlIHRoaXMgd29yayB3aXRoIGFuIEluamVjdG9yIGRpcmVjdGx5IGluc3RlYWQgb2YgY3JlYXRpbmcgYSBtb2R1bGUgZm9yIGl0XG4gICAgQE5nTW9kdWxlKHtwcm92aWRlcnN9KVxuICAgIGNsYXNzIENvbXBpbGVyTW9kdWxlIHtcbiAgICB9XG5cbiAgICBjb25zdCBDb21waWxlck1vZHVsZUZhY3RvcnkgPSBuZXcgUjNOZ01vZHVsZUZhY3RvcnkoQ29tcGlsZXJNb2R1bGUpO1xuICAgIHRoaXMuX2NvbXBpbGVySW5qZWN0b3IgPSBDb21waWxlck1vZHVsZUZhY3RvcnkuY3JlYXRlKHRoaXMucGxhdGZvcm0uaW5qZWN0b3IpLmluamVjdG9yO1xuICAgIHJldHVybiB0aGlzLl9jb21waWxlckluamVjdG9yO1xuICB9XG5cbiAgLyoqXG4gICAqIENsZWFycyBjdXJyZW50IGNvbXBvbmVudHMgcmVzb2x1dGlvbiBxdWV1ZSwgYnV0IHN0b3JlcyB0aGUgc3RhdGUgb2YgdGhlIHF1ZXVlLCBzbyB3ZSBjYW5cbiAgICogcmVzdG9yZSBpdCBsYXRlci4gQ2xlYXJpbmcgdGhlIHF1ZXVlIGlzIHJlcXVpcmVkIGJlZm9yZSB3ZSB0cnkgdG8gY29tcGlsZSBjb21wb25lbnRzICh2aWFcbiAgICogYFRlc3RCZWQuY29tcGlsZUNvbXBvbmVudHNgKSwgc28gdGhhdCBjb21wb25lbnQgZGVmcyBhcmUgaW4gc3luYyB3aXRoIHRoZSByZXNvbHV0aW9uIHF1ZXVlLlxuICAgKi9cbiAgcHJpdmF0ZSBfY2xlYXJDb21wb25lbnRSZXNvbHV0aW9uUXVldWUoKSB7XG4gICAgaWYgKHRoaXMuX29yaWdpbmFsQ29tcG9uZW50UmVzb2x1dGlvblF1ZXVlID09PSBudWxsKSB7XG4gICAgICB0aGlzLl9vcmlnaW5hbENvbXBvbmVudFJlc29sdXRpb25RdWV1ZSA9IG5ldyBNYXAoKTtcbiAgICB9XG4gICAgY2xlYXJSZXNvbHV0aW9uT2ZDb21wb25lbnRSZXNvdXJjZXNRdWV1ZSgpLmZvckVhY2goXG4gICAgICAgICh2YWx1ZSwga2V5KSA9PiB0aGlzLl9vcmlnaW5hbENvbXBvbmVudFJlc29sdXRpb25RdWV1ZSAhLnNldChrZXksIHZhbHVlKSk7XG4gIH1cblxuICAvKipcbiAgICogUmVzdG9yZXMgY29tcG9uZW50IHJlc29sdXRpb24gcXVldWUgdG8gdGhlIHByZXZpb3VzbHkgc2F2ZWQgc3RhdGUuIFRoaXMgb3BlcmF0aW9uIGlzIHBlcmZvcm1lZFxuICAgKiBhcyBhIHBhcnQgb2YgcmVzdG9yaW5nIHRoZSBzdGF0ZSBhZnRlciBjb21wbGV0aW9uIG9mIHRoZSBjdXJyZW50IHNldCBvZiB0ZXN0cyAodGhhdCBtaWdodFxuICAgKiBwb3RlbnRpYWxseSBtdXRhdGUgdGhlIHN0YXRlKS5cbiAgICovXG4gIHByaXZhdGUgX3Jlc3RvcmVDb21wb25lbnRSZXNvbHV0aW9uUXVldWUoKSB7XG4gICAgaWYgKHRoaXMuX29yaWdpbmFsQ29tcG9uZW50UmVzb2x1dGlvblF1ZXVlICE9PSBudWxsKSB7XG4gICAgICByZXN0b3JlQ29tcG9uZW50UmVzb2x1dGlvblF1ZXVlKHRoaXMuX29yaWdpbmFsQ29tcG9uZW50UmVzb2x1dGlvblF1ZXVlKTtcbiAgICAgIHRoaXMuX29yaWdpbmFsQ29tcG9uZW50UmVzb2x1dGlvblF1ZXVlID0gbnVsbDtcbiAgICB9XG4gIH1cblxuICAvLyBUT0RPKEZXLTExNzkpOiBkZWZpbmUgYmV0dGVyIHR5cGVzIGZvciBhbGwgUHJvdmlkZXItcmVsYXRlZCBvcGVyYXRpb25zLCBhdm9pZCB1c2luZyBgYW55YC5cbiAgcHJpdmF0ZSBfZ2V0UHJvdmlkZXJzT3ZlcnJpZGVzKHByb3ZpZGVyczogYW55KTogYW55W10ge1xuICAgIGlmICghcHJvdmlkZXJzIHx8ICFwcm92aWRlcnMubGVuZ3RoKSByZXR1cm4gW107XG4gICAgLy8gVGhlcmUgYXJlIHR3byBmbGF0dGVuaW5nIG9wZXJhdGlvbnMgaGVyZS4gVGhlIGlubmVyIGZsYXR0ZW4oKSBvcGVyYXRlcyBvbiB0aGUgbWV0YWRhdGEnc1xuICAgIC8vIHByb3ZpZGVycyBhbmQgYXBwbGllcyBhIG1hcHBpbmcgZnVuY3Rpb24gd2hpY2ggcmV0cmlldmVzIG92ZXJyaWRlcyBmb3IgZWFjaCBpbmNvbWluZ1xuICAgIC8vIHByb3ZpZGVyLiBUaGUgb3V0ZXIgZmxhdHRlbigpIHRoZW4gZmxhdHRlbnMgdGhlIHByb2R1Y2VkIG92ZXJyaWRlcyBhcnJheS4gSWYgdGhpcyBpcyBub3RcbiAgICAvLyBkb25lLCB0aGUgYXJyYXkgY2FuIGNvbnRhaW4gb3RoZXIgZW1wdHkgYXJyYXlzIChlLmcuIGBbW10sIFtdXWApIHdoaWNoIGxlYWsgaW50byB0aGVcbiAgICAvLyBwcm92aWRlcnMgYXJyYXkgYW5kIGNvbnRhbWluYXRlIGFueSBlcnJvciBtZXNzYWdlcyB0aGF0IG1pZ2h0IGJlIGdlbmVyYXRlZC5cbiAgICByZXR1cm4gZmxhdHRlbihmbGF0dGVuKHByb3ZpZGVycywgKHByb3ZpZGVyOiBhbnkpID0+IHRoaXMuX2dldFByb3ZpZGVyT3ZlcnJpZGVzKHByb3ZpZGVyKSkpO1xuICB9XG5cbiAgcHJpdmF0ZSBfaGFzUHJvdmlkZXJPdmVycmlkZXMocHJvdmlkZXJzOiBhbnkpIHtcbiAgICByZXR1cm4gdGhpcy5fZ2V0UHJvdmlkZXJzT3ZlcnJpZGVzKHByb3ZpZGVycykubGVuZ3RoID4gMDtcbiAgfVxuXG4gIHByaXZhdGUgX2hhc1R5cGVPdmVycmlkZXModHlwZTogVHlwZTxhbnk+LCBvdmVycmlkZXM6IFtUeXBlPGFueT4sIE1ldGFkYXRhT3ZlcnJpZGU8YW55Pl1bXSkge1xuICAgIHJldHVybiBvdmVycmlkZXMuc29tZSgob3ZlcnJpZGU6IFtUeXBlPGFueT4sIE1ldGFkYXRhT3ZlcnJpZGU8YW55Pl0pID0+IG92ZXJyaWRlWzBdID09PSB0eXBlKTtcbiAgfVxuXG4gIHByaXZhdGUgX2hhc1RlbXBsYXRlT3ZlcnJpZGVzKHR5cGU6IFR5cGU8YW55PikgeyByZXR1cm4gdGhpcy5fdGVtcGxhdGVPdmVycmlkZXMuaGFzKHR5cGUpOyB9XG5cbiAgcHJpdmF0ZSBfZ2V0TWV0YVdpdGhPdmVycmlkZXMobWV0YTogQ29tcG9uZW50fERpcmVjdGl2ZXxOZ01vZHVsZSwgdHlwZT86IFR5cGU8YW55Pikge1xuICAgIGNvbnN0IG92ZXJyaWRlczoge3Byb3ZpZGVycz86IGFueVtdLCB0ZW1wbGF0ZT86IHN0cmluZ30gPSB7fTtcbiAgICBpZiAobWV0YS5wcm92aWRlcnMgJiYgbWV0YS5wcm92aWRlcnMubGVuZ3RoKSB7XG4gICAgICBjb25zdCBwcm92aWRlck92ZXJyaWRlcyA9IHRoaXMuX2dldFByb3ZpZGVyc092ZXJyaWRlcyhtZXRhLnByb3ZpZGVycyk7XG4gICAgICBpZiAocHJvdmlkZXJPdmVycmlkZXMubGVuZ3RoKSB7XG4gICAgICAgIG92ZXJyaWRlcy5wcm92aWRlcnMgPSBbLi4ubWV0YS5wcm92aWRlcnMsIC4uLnByb3ZpZGVyT3ZlcnJpZGVzXTtcbiAgICAgIH1cbiAgICB9XG4gICAgY29uc3QgaGFzVGVtcGxhdGVPdmVycmlkZSA9ICEhdHlwZSAmJiB0aGlzLl90ZW1wbGF0ZU92ZXJyaWRlcy5oYXModHlwZSk7XG4gICAgaWYgKGhhc1RlbXBsYXRlT3ZlcnJpZGUpIHtcbiAgICAgIG92ZXJyaWRlcy50ZW1wbGF0ZSA9IHRoaXMuX3RlbXBsYXRlT3ZlcnJpZGVzLmdldCh0eXBlICEpO1xuICAgIH1cbiAgICByZXR1cm4gT2JqZWN0LmtleXMob3ZlcnJpZGVzKS5sZW5ndGggPyB7Li4ubWV0YSwgLi4ub3ZlcnJpZGVzfSA6IG1ldGE7XG4gIH1cblxuICBwcml2YXRlIF9wYXRjaERlZldpdGhQcm92aWRlck92ZXJyaWRlcyhkZWNsYXJhdGlvbjogVHlwZTxhbnk+LCBmaWVsZDogc3RyaW5nKSB7XG4gICAgY29uc3QgZGVmID0gKGRlY2xhcmF0aW9uIGFzIGFueSlbZmllbGRdO1xuICAgIGlmIChkZWYgJiYgZGVmLnByb3ZpZGVyc1Jlc29sdmVyKSB7XG4gICAgICB0aGlzLl9zdG9yZU5nRGVmKGZpZWxkLCBkZWNsYXJhdGlvbik7XG4gICAgICBjb25zdCByZXNvbHZlciA9IGRlZi5wcm92aWRlcnNSZXNvbHZlcjtcbiAgICAgIGNvbnN0IHByb2Nlc3NQcm92aWRlcnNGbiA9IChwcm92aWRlcnM6IGFueVtdKSA9PiB7XG4gICAgICAgIGNvbnN0IG92ZXJyaWRlcyA9IHRoaXMuX2dldFByb3ZpZGVyc092ZXJyaWRlcyhwcm92aWRlcnMpO1xuICAgICAgICByZXR1cm4gWy4uLnByb3ZpZGVycywgLi4ub3ZlcnJpZGVzXTtcbiAgICAgIH07XG4gICAgICBkZWYucHJvdmlkZXJzUmVzb2x2ZXIgPSAobmdEZWY6IERpcmVjdGl2ZURlZjxhbnk+KSA9PiByZXNvbHZlcihuZ0RlZiwgcHJvY2Vzc1Byb3ZpZGVyc0ZuKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQGludGVybmFsXG4gICAqL1xuICBfZ2V0TW9kdWxlUmVzb2x2ZXIoKSB7IHJldHVybiB0aGlzLl9yZXNvbHZlcnMubW9kdWxlOyB9XG5cbiAgLyoqXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgX2NvbXBpbGVOZ01vZHVsZShtb2R1bGVUeXBlOiBOZ01vZHVsZVR5cGUpOiB2b2lkIHtcbiAgICBjb25zdCBuZ01vZHVsZSA9IHRoaXMuX3Jlc29sdmVycy5tb2R1bGUucmVzb2x2ZShtb2R1bGVUeXBlKTtcblxuICAgIGlmIChuZ01vZHVsZSA9PT0gbnVsbCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGAke3N0cmluZ2lmeShtb2R1bGVUeXBlKX0gaGFzIG5vIEBOZ01vZHVsZSBhbm5vdGF0aW9uYCk7XG4gICAgfVxuXG4gICAgdGhpcy5fc3RvcmVOZ0RlZihOR19NT0RVTEVfREVGLCBtb2R1bGVUeXBlKTtcbiAgICB0aGlzLl9zdG9yZU5nRGVmKE5HX0lOSkVDVE9SX0RFRiwgbW9kdWxlVHlwZSk7XG4gICAgY29uc3QgbWV0YWRhdGEgPSB0aGlzLl9nZXRNZXRhV2l0aE92ZXJyaWRlcyhuZ01vZHVsZSk7XG4gICAgY29tcGlsZU5nTW9kdWxlRGVmcyhtb2R1bGVUeXBlLCBtZXRhZGF0YSk7XG5cbiAgICBjb25zdCBkZWNsYXJhdGlvbnM6IFR5cGU8YW55PltdID1cbiAgICAgICAgZmxhdHRlbihuZ01vZHVsZS5kZWNsYXJhdGlvbnMgfHwgRU1QVFlfQVJSQVksIHJlc29sdmVGb3J3YXJkUmVmKTtcbiAgICBjb25zdCBkZWNsYXJlZENvbXBvbmVudHM6IFR5cGU8YW55PltdID0gW107XG5cbiAgICAvLyBDb21waWxlIHRoZSBjb21wb25lbnRzLCBkaXJlY3RpdmVzIGFuZCBwaXBlcyBkZWNsYXJlZCBieSB0aGlzIG1vZHVsZVxuICAgIGRlY2xhcmF0aW9ucy5mb3JFYWNoKGRlY2xhcmF0aW9uID0+IHtcbiAgICAgIGNvbnN0IGNvbXBvbmVudCA9IHRoaXMuX3Jlc29sdmVycy5jb21wb25lbnQucmVzb2x2ZShkZWNsYXJhdGlvbik7XG4gICAgICBpZiAoY29tcG9uZW50KSB7XG4gICAgICAgIGlmICghZGVjbGFyYXRpb24uaGFzT3duUHJvcGVydHkoTkdfQ09NUE9ORU5UX0RFRikgfHxcbiAgICAgICAgICAgIHRoaXMuX2hhc1R5cGVPdmVycmlkZXMoZGVjbGFyYXRpb24sIHRoaXMuX2NvbXBvbmVudE92ZXJyaWRlcykgfHxcbiAgICAgICAgICAgIHRoaXMuX2hhc1RlbXBsYXRlT3ZlcnJpZGVzKGRlY2xhcmF0aW9uKSkge1xuICAgICAgICAgIHRoaXMuX3N0b3JlTmdEZWYoTkdfQ09NUE9ORU5UX0RFRiwgZGVjbGFyYXRpb24pO1xuICAgICAgICAgIGNvbnN0IG1ldGFkYXRhID0gdGhpcy5fZ2V0TWV0YVdpdGhPdmVycmlkZXMoY29tcG9uZW50LCBkZWNsYXJhdGlvbik7XG4gICAgICAgICAgY29tcGlsZUNvbXBvbmVudChkZWNsYXJhdGlvbiwgbWV0YWRhdGEpO1xuICAgICAgICB9IGVsc2UgaWYgKHRoaXMuX2hhc1Byb3ZpZGVyT3ZlcnJpZGVzKGNvbXBvbmVudC5wcm92aWRlcnMpKSB7XG4gICAgICAgICAgdGhpcy5fcGF0Y2hEZWZXaXRoUHJvdmlkZXJPdmVycmlkZXMoZGVjbGFyYXRpb24sIE5HX0NPTVBPTkVOVF9ERUYpO1xuICAgICAgICB9XG4gICAgICAgIGRlY2xhcmVkQ29tcG9uZW50cy5wdXNoKGRlY2xhcmF0aW9uKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBkaXJlY3RpdmUgPSB0aGlzLl9yZXNvbHZlcnMuZGlyZWN0aXZlLnJlc29sdmUoZGVjbGFyYXRpb24pO1xuICAgICAgaWYgKGRpcmVjdGl2ZSkge1xuICAgICAgICBpZiAoIWRlY2xhcmF0aW9uLmhhc093blByb3BlcnR5KE5HX0RJUkVDVElWRV9ERUYpIHx8XG4gICAgICAgICAgICB0aGlzLl9oYXNUeXBlT3ZlcnJpZGVzKGRlY2xhcmF0aW9uLCB0aGlzLl9kaXJlY3RpdmVPdmVycmlkZXMpKSB7XG4gICAgICAgICAgdGhpcy5fc3RvcmVOZ0RlZihOR19ESVJFQ1RJVkVfREVGLCBkZWNsYXJhdGlvbik7XG4gICAgICAgICAgY29uc3QgbWV0YWRhdGEgPSB0aGlzLl9nZXRNZXRhV2l0aE92ZXJyaWRlcyhkaXJlY3RpdmUpO1xuICAgICAgICAgIGNvbXBpbGVEaXJlY3RpdmUoZGVjbGFyYXRpb24sIG1ldGFkYXRhKTtcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLl9oYXNQcm92aWRlck92ZXJyaWRlcyhkaXJlY3RpdmUucHJvdmlkZXJzKSkge1xuICAgICAgICAgIHRoaXMuX3BhdGNoRGVmV2l0aFByb3ZpZGVyT3ZlcnJpZGVzKGRlY2xhcmF0aW9uLCBOR19ESVJFQ1RJVkVfREVGKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHBpcGUgPSB0aGlzLl9yZXNvbHZlcnMucGlwZS5yZXNvbHZlKGRlY2xhcmF0aW9uKTtcbiAgICAgIGlmIChwaXBlKSB7XG4gICAgICAgIGlmICghZGVjbGFyYXRpb24uaGFzT3duUHJvcGVydHkoTkdfUElQRV9ERUYpIHx8XG4gICAgICAgICAgICB0aGlzLl9oYXNUeXBlT3ZlcnJpZGVzKGRlY2xhcmF0aW9uLCB0aGlzLl9waXBlT3ZlcnJpZGVzKSkge1xuICAgICAgICAgIHRoaXMuX3N0b3JlTmdEZWYoTkdfUElQRV9ERUYsIGRlY2xhcmF0aW9uKTtcbiAgICAgICAgICBjb21waWxlUGlwZShkZWNsYXJhdGlvbiwgcGlwZSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgLy8gQ29tcGlsZSB0cmFuc2l0aXZlIG1vZHVsZXMsIGNvbXBvbmVudHMsIGRpcmVjdGl2ZXMgYW5kIHBpcGVzXG4gICAgY29uc3QgY2FsY1RyYW5zaXRpdmVTY29wZXNGb3IgPSAobW9kdWxlVHlwZTogTmdNb2R1bGVUeXBlKSA9PiB0cmFuc2l0aXZlU2NvcGVzRm9yKFxuICAgICAgICBtb2R1bGVUeXBlLCAobmdNb2R1bGU6IE5nTW9kdWxlVHlwZSkgPT4gdGhpcy5fY29tcGlsZU5nTW9kdWxlKG5nTW9kdWxlKSk7XG4gICAgY29uc3QgdHJhbnNpdGl2ZVNjb3BlID0gY2FsY1RyYW5zaXRpdmVTY29wZXNGb3IobW9kdWxlVHlwZSk7XG4gICAgZGVjbGFyZWRDb21wb25lbnRzLmZvckVhY2goY21wID0+IHtcbiAgICAgIGNvbnN0IHNjb3BlID0gdGhpcy5fdGVtcGxhdGVPdmVycmlkZXMuaGFzKGNtcCkgP1xuICAgICAgICAgIC8vIGlmIHdlIGhhdmUgdGVtcGxhdGUgb3ZlcnJpZGUgdmlhIGBUZXN0QmVkLm92ZXJyaWRlVGVtcGxhdGVVc2luZ1Rlc3RpbmdNb2R1bGVgIC1cbiAgICAgICAgICAvLyBkZWZpbmUgQ29tcG9uZW50IHNjb3BlIGFzIFRlc3RpbmdNb2R1bGUgc2NvcGUsIGluc3RlYWQgb2YgdGhlIHNjb3BlIG9mIE5nTW9kdWxlXG4gICAgICAgICAgLy8gd2hlcmUgdGhpcyBDb21wb25lbnQgd2FzIGRlY2xhcmVkXG4gICAgICAgICAgY2FsY1RyYW5zaXRpdmVTY29wZXNGb3IodGhpcy5fdGVzdE1vZHVsZVR5cGUpIDpcbiAgICAgICAgICB0cmFuc2l0aXZlU2NvcGU7XG4gICAgICBwYXRjaENvbXBvbmVudERlZldpdGhTY29wZSgoY21wIGFzIGFueSkubmdDb21wb25lbnREZWYsIHNjb3BlKTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIF9nZXRDb21wb25lbnRGYWN0b3JpZXMobW9kdWxlVHlwZTogTmdNb2R1bGVUeXBlKTogQ29tcG9uZW50RmFjdG9yeTxhbnk+W10ge1xuICAgIHJldHVybiBtYXliZVVud3JhcEZuKG1vZHVsZVR5cGUubmdNb2R1bGVEZWYuZGVjbGFyYXRpb25zKS5yZWR1Y2UoKGZhY3RvcmllcywgZGVjbGFyYXRpb24pID0+IHtcbiAgICAgIGNvbnN0IGNvbXBvbmVudERlZiA9IChkZWNsYXJhdGlvbiBhcyBhbnkpLm5nQ29tcG9uZW50RGVmO1xuICAgICAgY29tcG9uZW50RGVmICYmIGZhY3Rvcmllcy5wdXNoKG5ldyBDb21wb25lbnRGYWN0b3J5KGNvbXBvbmVudERlZiwgdGhpcy5fbW9kdWxlUmVmKSk7XG4gICAgICByZXR1cm4gZmFjdG9yaWVzO1xuICAgIH0sIFtdIGFzIENvbXBvbmVudEZhY3Rvcnk8YW55PltdKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVjayB3aGV0aGVyIHRoZSBtb2R1bGUgc2NvcGluZyBxdWV1ZSBzaG91bGQgYmUgZmx1c2hlZCwgYW5kIGZsdXNoIGl0IGlmIG5lZWRlZC5cbiAgICpcbiAgICogV2hlbiB0aGUgVGVzdEJlZCBpcyByZXNldCwgaXQgY2xlYXJzIHRoZSBKSVQgbW9kdWxlIGNvbXBpbGF0aW9uIHF1ZXVlLCBjYW5jZWxsaW5nIGFueVxuICAgKiBpbi1wcm9ncmVzcyBtb2R1bGUgY29tcGlsYXRpb24uIFRoaXMgY3JlYXRlcyBhIHBvdGVudGlhbCBoYXphcmQgLSB0aGUgdmVyeSBmaXJzdCB0aW1lIHRoZVxuICAgKiBUZXN0QmVkIGlzIGluaXRpYWxpemVkIChvciBpZiBpdCdzIHJlc2V0IHdpdGhvdXQgYmVpbmcgaW5pdGlhbGl6ZWQpLCB0aGVyZSBtYXkgYmUgcGVuZGluZ1xuICAgKiBjb21waWxhdGlvbnMgb2YgbW9kdWxlcyBkZWNsYXJlZCBpbiBnbG9iYWwgc2NvcGUuIFRoZXNlIGNvbXBpbGF0aW9ucyBzaG91bGQgYmUgZmluaXNoZWQuXG4gICAqXG4gICAqIFRvIGVuc3VyZSB0aGF0IGdsb2JhbGx5IGRlY2xhcmVkIG1vZHVsZXMgaGF2ZSB0aGVpciBjb21wb25lbnRzIHNjb3BlZCBwcm9wZXJseSwgdGhpcyBmdW5jdGlvblxuICAgKiBpcyBjYWxsZWQgd2hlbmV2ZXIgVGVzdEJlZCBpcyBpbml0aWFsaXplZCBvciByZXNldC4gVGhlIF9maXJzdF8gdGltZSB0aGF0IHRoaXMgaGFwcGVucywgcHJpb3JcbiAgICogdG8gYW55IG90aGVyIG9wZXJhdGlvbnMsIHRoZSBzY29waW5nIHF1ZXVlIGlzIGZsdXNoZWQuXG4gICAqL1xuICBwcml2YXRlIF9jaGVja0dsb2JhbENvbXBpbGF0aW9uRmluaXNoZWQoKTogdm9pZCB7XG4gICAgLy8gIXRoaXMuX2luc3RhbnRpYXRlZCBzaG91bGQgbm90IGJlIG5lY2Vzc2FyeSwgYnV0IGlzIGxlZnQgaW4gYXMgYW4gYWRkaXRpb25hbCBndWFyZCB0aGF0XG4gICAgLy8gY29tcGlsYXRpb25zIHF1ZXVlZCBpbiB0ZXN0cyAoYWZ0ZXIgaW5zdGFudGlhdGlvbikgYXJlIG5ldmVyIGZsdXNoZWQgYWNjaWRlbnRhbGx5LlxuICAgIGlmICghdGhpcy5fZ2xvYmFsQ29tcGlsYXRpb25DaGVja2VkICYmICF0aGlzLl9pbnN0YW50aWF0ZWQpIHtcbiAgICAgIGZsdXNoTW9kdWxlU2NvcGluZ1F1ZXVlQXNNdWNoQXNQb3NzaWJsZSgpO1xuICAgIH1cbiAgICB0aGlzLl9nbG9iYWxDb21waWxhdGlvbkNoZWNrZWQgPSB0cnVlO1xuICB9XG59XG5cbmxldCB0ZXN0QmVkOiBUZXN0QmVkUmVuZGVyMztcblxuZXhwb3J0IGZ1bmN0aW9uIF9nZXRUZXN0QmVkUmVuZGVyMygpOiBUZXN0QmVkUmVuZGVyMyB7XG4gIHJldHVybiB0ZXN0QmVkID0gdGVzdEJlZCB8fCBuZXcgVGVzdEJlZFJlbmRlcjMoKTtcbn1cblxuZnVuY3Rpb24gZmxhdHRlbjxUPih2YWx1ZXM6IGFueVtdLCBtYXBGbj86ICh2YWx1ZTogVCkgPT4gYW55KTogVFtdIHtcbiAgY29uc3Qgb3V0OiBUW10gPSBbXTtcbiAgdmFsdWVzLmZvckVhY2godmFsdWUgPT4ge1xuICAgIGlmIChBcnJheS5pc0FycmF5KHZhbHVlKSkge1xuICAgICAgb3V0LnB1c2goLi4uZmxhdHRlbjxUPih2YWx1ZSwgbWFwRm4pKTtcbiAgICB9IGVsc2Uge1xuICAgICAgb3V0LnB1c2gobWFwRm4gPyBtYXBGbih2YWx1ZSkgOiB2YWx1ZSk7XG4gICAgfVxuICB9KTtcbiAgcmV0dXJuIG91dDtcbn1cblxuZnVuY3Rpb24gaXNOZ01vZHVsZTxUPih2YWx1ZTogVHlwZTxUPik6IHZhbHVlIGlzIFR5cGU8VD4me25nTW9kdWxlRGVmOiBOZ01vZHVsZURlZjxUPn0ge1xuICByZXR1cm4gKHZhbHVlIGFze25nTW9kdWxlRGVmPzogTmdNb2R1bGVEZWY8VD59KS5uZ01vZHVsZURlZiAhPT0gdW5kZWZpbmVkO1xufVxuXG5jbGFzcyBSM1Rlc3RDb21waWxlciBpbXBsZW1lbnRzIENvbXBpbGVyIHtcbiAgY29uc3RydWN0b3IocHJpdmF0ZSB0ZXN0QmVkOiBUZXN0QmVkUmVuZGVyMykge31cblxuICBjb21waWxlTW9kdWxlU3luYzxUPihtb2R1bGVUeXBlOiBUeXBlPFQ+KTogTmdNb2R1bGVGYWN0b3J5PFQ+IHtcbiAgICB0aGlzLnRlc3RCZWQuX2NvbXBpbGVOZ01vZHVsZShtb2R1bGVUeXBlIGFzIE5nTW9kdWxlVHlwZTxUPik7XG4gICAgcmV0dXJuIG5ldyBSM05nTW9kdWxlRmFjdG9yeShtb2R1bGVUeXBlKTtcbiAgfVxuXG4gIGNvbXBpbGVNb2R1bGVBc3luYzxUPihtb2R1bGVUeXBlOiBUeXBlPFQ+KTogUHJvbWlzZTxOZ01vZHVsZUZhY3Rvcnk8VD4+IHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHRoaXMuY29tcGlsZU1vZHVsZVN5bmMobW9kdWxlVHlwZSkpO1xuICB9XG5cbiAgY29tcGlsZU1vZHVsZUFuZEFsbENvbXBvbmVudHNTeW5jPFQ+KG1vZHVsZVR5cGU6IFR5cGU8VD4pOiBNb2R1bGVXaXRoQ29tcG9uZW50RmFjdG9yaWVzPFQ+IHtcbiAgICBjb25zdCBuZ01vZHVsZUZhY3RvcnkgPSB0aGlzLmNvbXBpbGVNb2R1bGVTeW5jKG1vZHVsZVR5cGUpO1xuICAgIGNvbnN0IGNvbXBvbmVudEZhY3RvcmllcyA9IHRoaXMudGVzdEJlZC5fZ2V0Q29tcG9uZW50RmFjdG9yaWVzKG1vZHVsZVR5cGUgYXMgTmdNb2R1bGVUeXBlPFQ+KTtcbiAgICByZXR1cm4gbmV3IE1vZHVsZVdpdGhDb21wb25lbnRGYWN0b3JpZXMobmdNb2R1bGVGYWN0b3J5LCBjb21wb25lbnRGYWN0b3JpZXMpO1xuICB9XG5cbiAgY29tcGlsZU1vZHVsZUFuZEFsbENvbXBvbmVudHNBc3luYzxUPihtb2R1bGVUeXBlOiBUeXBlPFQ+KTpcbiAgICAgIFByb21pc2U8TW9kdWxlV2l0aENvbXBvbmVudEZhY3RvcmllczxUPj4ge1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodGhpcy5jb21waWxlTW9kdWxlQW5kQWxsQ29tcG9uZW50c1N5bmMobW9kdWxlVHlwZSkpO1xuICB9XG5cbiAgY2xlYXJDYWNoZSgpOiB2b2lkIHt9XG5cbiAgY2xlYXJDYWNoZUZvcih0eXBlOiBUeXBlPGFueT4pOiB2b2lkIHt9XG5cbiAgZ2V0TW9kdWxlSWQobW9kdWxlVHlwZTogVHlwZTxhbnk+KTogc3RyaW5nfHVuZGVmaW5lZCB7XG4gICAgY29uc3QgbWV0YSA9IHRoaXMudGVzdEJlZC5fZ2V0TW9kdWxlUmVzb2x2ZXIoKS5yZXNvbHZlKG1vZHVsZVR5cGUpO1xuICAgIHJldHVybiBtZXRhICYmIG1ldGEuaWQgfHwgdW5kZWZpbmVkO1xuICB9XG59XG5cbi8qKiBFcnJvciBoYW5kbGVyIHVzZWQgZm9yIHRlc3RzLiBSZXRocm93cyBlcnJvcnMgcmF0aGVyIHRoYW4gbG9nZ2luZyB0aGVtIG91dC4gKi9cbmNsYXNzIFIzVGVzdEVycm9ySGFuZGxlciBleHRlbmRzIEVycm9ySGFuZGxlciB7XG4gIGhhbmRsZUVycm9yKGVycm9yOiBhbnkpIHsgdGhyb3cgZXJyb3I7IH1cbn1cblxuLyoqXG4gKiBVbndyYXAgYSB2YWx1ZSB3aGljaCBtaWdodCBiZSBiZWhpbmQgYSBjbG9zdXJlIChmb3IgZm9yd2FyZCBkZWNsYXJhdGlvbiByZWFzb25zKS5cbiAqL1xuZnVuY3Rpb24gbWF5YmVVbndyYXBGbjxUPih2YWx1ZTogVCB8ICgoKSA9PiBUKSk6IFQge1xuICBpZiAodmFsdWUgaW5zdGFuY2VvZiBGdW5jdGlvbikge1xuICAgIHJldHVybiB2YWx1ZSgpO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiB2YWx1ZTtcbiAgfVxufVxuIl19