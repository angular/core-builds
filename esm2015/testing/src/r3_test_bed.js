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
/** @type {?} */
let _nextRootElementId = 0;
/** @type {?} */
const EMPTY_ARRAY = [];
/** @type {?} */
const UNDEFINED = Symbol('UNDEFINED');
/**
 * \@description
 * Configures and initializes environment for unit testing and provides methods for
 * creating components and services in unit tests.
 *
 * TestBed is the primary api for writing unit tests for Angular applications and libraries.
 *
 * Note: Use `TestBed` in tests. It will be set to either `TestBedViewEngine` or `TestBedRender3`
 * according to the compiler used.
 */
export class TestBedRender3 {
    constructor() {
        // Properties
        this.platform = (/** @type {?} */ (null));
        this.ngModule = (/** @type {?} */ (null));
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
        this._resolvers = (/** @type {?} */ (null));
        // test module configuration
        this._providers = [];
        this._compilerOptions = [];
        this._declarations = [];
        this._imports = [];
        this._schemas = [];
        this._activeFixtures = [];
        this._compilerInjector = (/** @type {?} */ (null));
        this._moduleRef = (/** @type {?} */ (null));
        this._testModuleType = (/** @type {?} */ (null));
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
     * '\@angular/<platform_name>/testing'.
     *
     * \@publicApi
     * @param {?} ngModule
     * @param {?} platform
     * @param {?=} aotSummaries
     * @return {?}
     */
    static initTestEnvironment(ngModule, platform, aotSummaries) {
        /** @type {?} */
        const testBed = _getTestBedRender3();
        testBed.initTestEnvironment(ngModule, platform, aotSummaries);
        return testBed;
    }
    /**
     * Reset the providers for the test injector.
     *
     * \@publicApi
     * @return {?}
     */
    static resetTestEnvironment() { _getTestBedRender3().resetTestEnvironment(); }
    /**
     * @param {?} config
     * @return {?}
     */
    static configureCompiler(config) {
        _getTestBedRender3().configureCompiler(config);
        return (/** @type {?} */ ((/** @type {?} */ (TestBedRender3))));
    }
    /**
     * Allows overriding default providers, directives, pipes, modules of the test injector,
     * which are defined in test_injector.js
     * @param {?} moduleDef
     * @return {?}
     */
    static configureTestingModule(moduleDef) {
        _getTestBedRender3().configureTestingModule(moduleDef);
        return (/** @type {?} */ ((/** @type {?} */ (TestBedRender3))));
    }
    /**
     * Compile components with a `templateUrl` for the test's NgModule.
     * It is necessary to call this function
     * as fetching urls is asynchronous.
     * @return {?}
     */
    static compileComponents() { return _getTestBedRender3().compileComponents(); }
    /**
     * @param {?} ngModule
     * @param {?} override
     * @return {?}
     */
    static overrideModule(ngModule, override) {
        _getTestBedRender3().overrideModule(ngModule, override);
        return (/** @type {?} */ ((/** @type {?} */ (TestBedRender3))));
    }
    /**
     * @param {?} component
     * @param {?} override
     * @return {?}
     */
    static overrideComponent(component, override) {
        _getTestBedRender3().overrideComponent(component, override);
        return (/** @type {?} */ ((/** @type {?} */ (TestBedRender3))));
    }
    /**
     * @param {?} directive
     * @param {?} override
     * @return {?}
     */
    static overrideDirective(directive, override) {
        _getTestBedRender3().overrideDirective(directive, override);
        return (/** @type {?} */ ((/** @type {?} */ (TestBedRender3))));
    }
    /**
     * @param {?} pipe
     * @param {?} override
     * @return {?}
     */
    static overridePipe(pipe, override) {
        _getTestBedRender3().overridePipe(pipe, override);
        return (/** @type {?} */ ((/** @type {?} */ (TestBedRender3))));
    }
    /**
     * @param {?} component
     * @param {?} template
     * @return {?}
     */
    static overrideTemplate(component, template) {
        _getTestBedRender3().overrideComponent(component, { set: { template, templateUrl: (/** @type {?} */ (null)) } });
        return (/** @type {?} */ ((/** @type {?} */ (TestBedRender3))));
    }
    /**
     * Overrides the template of the given component, compiling the template
     * in the context of the TestingModule.
     *
     * Note: This works for JIT and AOTed components as well.
     * @param {?} component
     * @param {?} template
     * @return {?}
     */
    static overrideTemplateUsingTestingModule(component, template) {
        _getTestBedRender3().overrideTemplateUsingTestingModule(component, template);
        return (/** @type {?} */ ((/** @type {?} */ (TestBedRender3))));
    }
    /**
     * @param {?} component
     * @param {?} template
     * @return {?}
     */
    overrideTemplateUsingTestingModule(component, template) {
        if (this._instantiated) {
            throw new Error('Cannot override template when the test module has already been instantiated');
        }
        this._templateOverrides.set(component, template);
    }
    /**
     * @param {?} token
     * @param {?} provider
     * @return {?}
     */
    static overrideProvider(token, provider) {
        _getTestBedRender3().overrideProvider(token, provider);
        return (/** @type {?} */ ((/** @type {?} */ (TestBedRender3))));
    }
    /**
     * @param {?} token
     * @param {?} provider
     * @return {?}
     */
    static deprecatedOverrideProvider(token, provider) {
        _getTestBedRender3().deprecatedOverrideProvider(token, (/** @type {?} */ (provider)));
        return (/** @type {?} */ ((/** @type {?} */ (TestBedRender3))));
    }
    /**
     * @param {?} token
     * @param {?=} notFoundValue
     * @return {?}
     */
    static get(token, notFoundValue = Injector.THROW_IF_NOT_FOUND) {
        return _getTestBedRender3().get(token, notFoundValue);
    }
    /**
     * @template T
     * @param {?} component
     * @return {?}
     */
    static createComponent(component) {
        return _getTestBedRender3().createComponent(component);
    }
    /**
     * @return {?}
     */
    static resetTestingModule() {
        _getTestBedRender3().resetTestingModule();
        return (/** @type {?} */ ((/** @type {?} */ (TestBedRender3))));
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
     * '\@angular/<platform_name>/testing'.
     *
     * \@publicApi
     * @param {?} ngModule
     * @param {?} platform
     * @param {?=} aotSummaries
     * @return {?}
     */
    initTestEnvironment(ngModule, platform, aotSummaries) {
        if (this.platform || this.ngModule) {
            throw new Error('Cannot set base providers because it has already been called');
        }
        this.platform = platform;
        this.ngModule = ngModule;
    }
    /**
     * Reset the providers for the test injector.
     *
     * \@publicApi
     * @return {?}
     */
    resetTestEnvironment() {
        this.resetTestingModule();
        this.platform = (/** @type {?} */ (null));
        this.ngModule = (/** @type {?} */ (null));
    }
    /**
     * @return {?}
     */
    resetTestingModule() {
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
        this._resolvers = (/** @type {?} */ (null));
        // reset test module config
        this._providers = [];
        this._compilerOptions = [];
        this._compilerProviders = [];
        this._declarations = [];
        this._imports = [];
        this._schemas = [];
        this._moduleRef = (/** @type {?} */ (null));
        this._testModuleType = (/** @type {?} */ (null));
        this._compilerInjector = (/** @type {?} */ (null));
        this._instantiated = false;
        this._activeFixtures.forEach((/**
         * @param {?} fixture
         * @return {?}
         */
        (fixture) => {
            try {
                fixture.destroy();
            }
            catch (e) {
                console.error('Error during cleanup of component', {
                    component: fixture.componentInstance,
                    stacktrace: e,
                });
            }
        }));
        this._activeFixtures = [];
        // restore initial component/directive/pipe defs
        this._initialNgDefs.forEach((/**
         * @param {?} value
         * @param {?} type
         * @return {?}
         */
        (value, type) => {
            const [prop, descriptor] = value;
            if (!descriptor) {
                // Delete operations are generally undesirable since they have performance implications on
                // objects they were applied to. In this particular case, situations where this code is
                // invoked should be quite rare to cause any noticable impact, since it's applied only to
                // some test cases (for example when class with no annotations extends some @Component) when
                // we need to clear 'ngComponentDef' field on a given class to restore its original state
                // (before applying overrides and running tests).
                delete ((/** @type {?} */ (type)))[prop];
            }
            else {
                Object.defineProperty(type, prop, descriptor);
            }
        }));
        this._initialNgDefs.clear();
        this._restoreComponentResolutionQueue();
    }
    /**
     * @param {?} config
     * @return {?}
     */
    configureCompiler(config) {
        if (config.useJit != null) {
            throw new Error('the Render3 compiler JiT mode is not configurable !');
        }
        if (config.providers) {
            this._providerOverrides.push(...config.providers);
            this._compilerProviders.push(...config.providers);
        }
    }
    /**
     * @param {?} moduleDef
     * @return {?}
     */
    configureTestingModule(moduleDef) {
        this._assertNotInstantiated('R3TestBed.configureTestingModule', 'configure the test module');
        if (moduleDef.providers) {
            this._providers.push(...moduleDef.providers);
        }
        if (moduleDef.declarations) {
            this._declarations.push(...moduleDef.declarations);
        }
        if (moduleDef.imports) {
            this._imports.push(...moduleDef.imports);
        }
        if (moduleDef.schemas) {
            this._schemas.push(...moduleDef.schemas);
        }
    }
    /**
     * @return {?}
     */
    compileComponents() {
        this._clearComponentResolutionQueue();
        /** @type {?} */
        const resolvers = this._getResolvers();
        /** @type {?} */
        const declarations = flatten(this._declarations || EMPTY_ARRAY, resolveForwardRef);
        /** @type {?} */
        const componentOverrides = [];
        /** @type {?} */
        const providerOverrides = [];
        /** @type {?} */
        let hasAsyncResources = false;
        // Compile the components declared by this module
        // TODO(FW-1178): `compileComponents` should not duplicate `_compileNgModule` logic
        declarations.forEach((/**
         * @param {?} declaration
         * @return {?}
         */
        declaration => {
            /** @type {?} */
            const component = resolvers.component.resolve(declaration);
            if (component) {
                if (!declaration.hasOwnProperty(NG_COMPONENT_DEF) ||
                    isComponentDefPendingResolution(declaration) || //
                    // Compiler provider overrides (like ResourceLoader) might affect the outcome of
                    // compilation, so we trigger `compileComponent` in case we have compilers overrides.
                    this._compilerProviders.length > 0 ||
                    this._hasTypeOverrides(declaration, this._componentOverrides) ||
                    this._hasTemplateOverrides(declaration)) {
                    this._storeNgDef(NG_COMPONENT_DEF, declaration);
                    // We make a copy of the metadata to ensure that we don't mutate the original metadata
                    /** @type {?} */
                    const metadata = Object.assign({}, component);
                    compileComponent(declaration, metadata);
                    componentOverrides.push([declaration, metadata]);
                    hasAsyncResources = hasAsyncResources || componentNeedsResolution(component);
                }
                else if (this._hasProviderOverrides(component.providers)) {
                    // Queue provider override operations, since fetching ngComponentDef (to patch it) might
                    // trigger re-compilation, which will fail because component resources are not yet fully
                    // resolved at this moment. The queue is drained once all resources are resolved.
                    providerOverrides.push((/**
                     * @return {?}
                     */
                    () => this._patchDefWithProviderOverrides(declaration, NG_COMPONENT_DEF)));
                }
            }
        }));
        /** @type {?} */
        const overrideComponents = (/**
         * @return {?}
         */
        () => {
            componentOverrides.forEach((/**
             * @param {?} override
             * @return {?}
             */
            (override) => {
                // Override the existing metadata, ensuring that the resolved resources
                // are only available until the next TestBed reset (when `resetTestingModule` is called)
                this.overrideComponent(override[0], { set: override[1] });
            }));
            providerOverrides.forEach((/**
             * @param {?} overrideFn
             * @return {?}
             */
            (overrideFn) => overrideFn()));
        });
        // If the component has no async resources (templateUrl, styleUrls), we can finish
        // synchronously. This is important so that users who mistakenly treat `compileComponents`
        // as synchronous don't encounter an error, as ViewEngine was tolerant of this.
        if (!hasAsyncResources) {
            overrideComponents();
            return Promise.resolve();
        }
        else {
            /** @type {?} */
            let resourceLoader;
            return resolveComponentResources((/**
             * @param {?} url
             * @return {?}
             */
            url => {
                if (!resourceLoader) {
                    resourceLoader = this.compilerInjector.get(ResourceLoader);
                }
                return Promise.resolve(resourceLoader.get(url));
            }))
                .then(overrideComponents);
        }
    }
    /**
     * @param {?} token
     * @param {?=} notFoundValue
     * @return {?}
     */
    get(token, notFoundValue = Injector.THROW_IF_NOT_FOUND) {
        this._initIfNeeded();
        if (token === TestBedRender3) {
            return this;
        }
        /** @type {?} */
        const result = this._moduleRef.injector.get(token, UNDEFINED);
        return result === UNDEFINED ? this.compilerInjector.get(token, notFoundValue) : result;
    }
    /**
     * @param {?} tokens
     * @param {?} fn
     * @param {?=} context
     * @return {?}
     */
    execute(tokens, fn, context) {
        this._initIfNeeded();
        /** @type {?} */
        const params = tokens.map((/**
         * @param {?} t
         * @return {?}
         */
        t => this.get(t)));
        return fn.apply(context, params);
    }
    /**
     * @param {?} ngModule
     * @param {?} override
     * @return {?}
     */
    overrideModule(ngModule, override) {
        this._assertNotInstantiated('overrideModule', 'override module metadata');
        this._moduleOverrides.push([ngModule, override]);
    }
    /**
     * @param {?} component
     * @param {?} override
     * @return {?}
     */
    overrideComponent(component, override) {
        this._assertNotInstantiated('overrideComponent', 'override component metadata');
        this._componentOverrides.push([component, override]);
    }
    /**
     * @param {?} directive
     * @param {?} override
     * @return {?}
     */
    overrideDirective(directive, override) {
        this._assertNotInstantiated('overrideDirective', 'override directive metadata');
        this._directiveOverrides.push([directive, override]);
    }
    /**
     * @param {?} pipe
     * @param {?} override
     * @return {?}
     */
    overridePipe(pipe, override) {
        this._assertNotInstantiated('overridePipe', 'override pipe metadata');
        this._pipeOverrides.push([pipe, override]);
    }
    /**
     * Overwrites all providers for the given token with the given provider definition.
     * @param {?} token
     * @param {?} provider
     * @return {?}
     */
    overrideProvider(token, provider) {
        /** @type {?} */
        const providerDef = provider.useFactory ?
            { provide: token, useFactory: provider.useFactory, deps: provider.deps || [] } :
            { provide: token, useValue: provider.useValue };
        /** @type {?} */
        let injectableDef;
        /** @type {?} */
        const isRoot = (typeof token !== 'string' && (injectableDef = getInjectableDef(token)) &&
            injectableDef.providedIn === 'root');
        /** @type {?} */
        const overridesBucket = isRoot ? this._rootProviderOverrides : this._providerOverrides;
        overridesBucket.push(providerDef);
        // keep all overrides grouped by token as well for fast lookups using token
        /** @type {?} */
        const overridesForToken = this._providerOverridesByToken.get(token) || [];
        overridesForToken.push(providerDef);
        this._providerOverridesByToken.set(token, overridesForToken);
    }
    /**
     * @param {?} token
     * @param {?} provider
     * @return {?}
     */
    deprecatedOverrideProvider(token, provider) {
        // HACK: This is NOT the correct implementation for deprecatedOverrideProvider.
        // To implement it in a backward compatible way, we would need to record some state
        // so we know to prevent eager instantiation of NgModules. However, we don't plan
        // to implement this at all since the API is deprecated and scheduled for removal
        // in V8. This hack is here temporarily for Ivy testing until we transition apps
        // inside Google to the overrideProvider API. At that point, we will be able to
        // remove this method entirely. In the meantime, we can use overrideProvider to
        // test apps with Ivy that don't care about eager instantiation. This fixes 85%
        // of cases in our blueprint.
        this.overrideProvider(token, (/** @type {?} */ (provider)));
    }
    /**
     * @template T
     * @param {?} type
     * @return {?}
     */
    createComponent(type) {
        this._initIfNeeded();
        /** @type {?} */
        const testComponentRenderer = this.get(TestComponentRenderer);
        /** @type {?} */
        const rootElId = `root${_nextRootElementId++}`;
        testComponentRenderer.insertRootElement(rootElId);
        /** @nocollapse @type {?} */
        const componentDef = ((/** @type {?} */ (type))).ngComponentDef;
        if (!componentDef) {
            throw new Error(`It looks like '${stringify(type)}' has not been IVY compiled - it has no 'ngComponentDef' field`);
        }
        /** @type {?} */
        const noNgZone = this.get(ComponentFixtureNoNgZone, false);
        /** @type {?} */
        const autoDetect = this.get(ComponentFixtureAutoDetect, false);
        /** @type {?} */
        const ngZone = noNgZone ? null : this.get(NgZone, null);
        /** @type {?} */
        const componentFactory = new ComponentFactory(componentDef);
        /** @type {?} */
        const initComponent = (/**
         * @return {?}
         */
        () => {
            /** @type {?} */
            const componentRef = componentFactory.create(Injector.NULL, [], `#${rootElId}`, this._moduleRef);
            return new ComponentFixture(componentRef, ngZone, autoDetect);
        });
        /** @type {?} */
        const fixture = ngZone ? ngZone.run(initComponent) : initComponent();
        this._activeFixtures.push(fixture);
        return fixture;
    }
    // internal methods
    /**
     * @private
     * @return {?}
     */
    _initIfNeeded() {
        this._checkGlobalCompilationFinished();
        if (this._instantiated) {
            return;
        }
        this._resolvers = this._getResolvers();
        this._testModuleType = this._createTestModule();
        this._compileNgModule(this._testModuleType);
        /** @type {?} */
        const parentInjector = this.platform.injector;
        this._moduleRef = new NgModuleRef(this._testModuleType, parentInjector);
        // ApplicationInitStatus.runInitializers() is marked @internal
        // to core. Cast it to any before accessing it.
        ((/** @type {?} */ (this._moduleRef.injector.get(ApplicationInitStatus)))).runInitializers();
        this._instantiated = true;
    }
    /**
     * @private
     * @param {?} prop
     * @param {?} type
     * @return {?}
     */
    _storeNgDef(prop, type) {
        if (!this._initialNgDefs.has(type)) {
            /** @type {?} */
            const currentDef = Object.getOwnPropertyDescriptor(type, prop);
            this._initialNgDefs.set(type, [prop, currentDef]);
        }
    }
    // get overrides for a specific provider (if any)
    /**
     * @private
     * @param {?} provider
     * @return {?}
     */
    _getProviderOverrides(provider) {
        /** @type {?} */
        const token = provider && typeof provider === 'object' && provider.hasOwnProperty('provide') ?
            provider.provide :
            provider;
        return this._providerOverridesByToken.get(token) || [];
    }
    // creates resolvers taking overrides into account
    /**
     * @private
     * @return {?}
     */
    _getResolvers() {
        /** @type {?} */
        const module = new NgModuleResolver();
        module.setOverrides(this._moduleOverrides);
        /** @type {?} */
        const component = new ComponentResolver();
        component.setOverrides(this._componentOverrides);
        /** @type {?} */
        const directive = new DirectiveResolver();
        directive.setOverrides(this._directiveOverrides);
        /** @type {?} */
        const pipe = new PipeResolver();
        pipe.setOverrides(this._pipeOverrides);
        return { module, component, directive, pipe };
    }
    /**
     * @private
     * @param {?} methodName
     * @param {?} methodDescription
     * @return {?}
     */
    _assertNotInstantiated(methodName, methodDescription) {
        if (this._instantiated) {
            throw new Error(`Cannot ${methodDescription} when the test module has already been instantiated. ` +
                `Make sure you are not using \`inject\` before \`${methodName}\`.`);
        }
    }
    /**
     * @private
     * @return {?}
     */
    _createTestModule() {
        /** @type {?} */
        const rootProviderOverrides = this._rootProviderOverrides;
        class RootScopeModule {
        }
        RootScopeModule.decorators = [
            { type: NgModule, args: [{
                        providers: [...rootProviderOverrides],
                        jit: true,
                    },] },
        ];
        /** @type {?} */
        const ngZone = new NgZone({ enableLongStackTrace: true });
        /** @type {?} */
        const providers = [
            { provide: NgZone, useValue: ngZone },
            { provide: Compiler, useFactory: (/**
                 * @return {?}
                 */
                () => new R3TestCompiler(this)) },
            { provide: ErrorHandler, useClass: R3TestErrorHandler },
            ...this._providers,
            ...this._providerOverrides,
        ];
        /** @type {?} */
        const declarations = this._declarations;
        /** @type {?} */
        const imports = [RootScopeModule, this.ngModule, this._imports];
        /** @type {?} */
        const schemas = this._schemas;
        class DynamicTestModule {
        }
        DynamicTestModule.decorators = [
            { type: NgModule, args: [{ providers, declarations, imports, schemas, jit: true },] },
        ];
        return (/** @type {?} */ (DynamicTestModule));
    }
    /**
     * @return {?}
     */
    get compilerInjector() {
        if (this._compilerInjector !== null) {
            return this._compilerInjector;
        }
        /** @type {?} */
        const providers = [];
        /** @type {?} */
        const compilerOptions = this.platform.injector.get(COMPILER_OPTIONS);
        compilerOptions.forEach((/**
         * @param {?} opts
         * @return {?}
         */
        opts => {
            if (opts.providers) {
                providers.push(opts.providers);
            }
        }));
        providers.push(...this._compilerProviders);
        // TODO(ocombe): make this work with an Injector directly instead of creating a module for it
        class CompilerModule {
        }
        CompilerModule.decorators = [
            { type: NgModule, args: [{ providers },] },
        ];
        /** @type {?} */
        const CompilerModuleFactory = new R3NgModuleFactory(CompilerModule);
        this._compilerInjector = CompilerModuleFactory.create(this.platform.injector).injector;
        return this._compilerInjector;
    }
    /**
     * Clears current components resolution queue, but stores the state of the queue, so we can
     * restore it later. Clearing the queue is required before we try to compile components (via
     * `TestBed.compileComponents`), so that component defs are in sync with the resolution queue.
     * @private
     * @return {?}
     */
    _clearComponentResolutionQueue() {
        if (this._originalComponentResolutionQueue === null) {
            this._originalComponentResolutionQueue = new Map();
        }
        clearResolutionOfComponentResourcesQueue().forEach((/**
         * @param {?} value
         * @param {?} key
         * @return {?}
         */
        (value, key) => (/** @type {?} */ (this._originalComponentResolutionQueue)).set(key, value)));
    }
    /**
     * Restores component resolution queue to the previously saved state. This operation is performed
     * as a part of restoring the state after completion of the current set of tests (that might
     * potentially mutate the state).
     * @private
     * @return {?}
     */
    _restoreComponentResolutionQueue() {
        if (this._originalComponentResolutionQueue !== null) {
            restoreComponentResolutionQueue(this._originalComponentResolutionQueue);
            this._originalComponentResolutionQueue = null;
        }
    }
    // TODO(FW-1179): define better types for all Provider-related operations, avoid using `any`.
    /**
     * @private
     * @param {?} providers
     * @return {?}
     */
    _getProvidersOverrides(providers) {
        if (!providers || !providers.length)
            return [];
        // There are two flattening operations here. The inner flatten() operates on the metadata's
        // providers and applies a mapping function which retrieves overrides for each incoming
        // provider. The outer flatten() then flattens the produced overrides array. If this is not
        // done, the array can contain other empty arrays (e.g. `[[], []]`) which leak into the
        // providers array and contaminate any error messages that might be generated.
        return flatten(flatten(providers, (/**
         * @param {?} provider
         * @return {?}
         */
        (provider) => this._getProviderOverrides(provider))));
    }
    /**
     * @private
     * @param {?} providers
     * @return {?}
     */
    _hasProviderOverrides(providers) {
        return this._getProvidersOverrides(providers).length > 0;
    }
    /**
     * @private
     * @param {?} type
     * @param {?} overrides
     * @return {?}
     */
    _hasTypeOverrides(type, overrides) {
        return overrides.some((/**
         * @param {?} override
         * @return {?}
         */
        (override) => override[0] === type));
    }
    /**
     * @private
     * @param {?} type
     * @return {?}
     */
    _hasTemplateOverrides(type) { return this._templateOverrides.has(type); }
    /**
     * @private
     * @param {?} meta
     * @param {?=} type
     * @return {?}
     */
    _getMetaWithOverrides(meta, type) {
        /** @type {?} */
        const overrides = {};
        if (meta.providers && meta.providers.length) {
            /** @type {?} */
            const providerOverrides = this._getProvidersOverrides(meta.providers);
            if (providerOverrides.length) {
                overrides.providers = [...meta.providers, ...providerOverrides];
            }
        }
        /** @type {?} */
        const hasTemplateOverride = !!type && this._templateOverrides.has(type);
        if (hasTemplateOverride) {
            overrides.template = this._templateOverrides.get((/** @type {?} */ (type)));
        }
        return Object.keys(overrides).length ? Object.assign({}, meta, overrides) : meta;
    }
    /**
     * @private
     * @param {?} declaration
     * @param {?} field
     * @return {?}
     */
    _patchDefWithProviderOverrides(declaration, field) {
        /** @type {?} */
        const def = ((/** @type {?} */ (declaration)))[field];
        if (def && def.providersResolver) {
            this._storeNgDef(field, declaration);
            /** @type {?} */
            const resolver = def.providersResolver;
            /** @type {?} */
            const processProvidersFn = (/**
             * @param {?} providers
             * @return {?}
             */
            (providers) => {
                /** @type {?} */
                const overrides = this._getProvidersOverrides(providers);
                return [...providers, ...overrides];
            });
            def.providersResolver = (/**
             * @param {?} ngDef
             * @return {?}
             */
            (ngDef) => resolver(ngDef, processProvidersFn));
        }
    }
    /**
     * \@internal
     * @return {?}
     */
    _getModuleResolver() { return this._resolvers.module; }
    /**
     * \@internal
     * @param {?} moduleType
     * @return {?}
     */
    _compileNgModule(moduleType) {
        /** @type {?} */
        const ngModule = this._resolvers.module.resolve(moduleType);
        if (ngModule === null) {
            throw new Error(`${stringify(moduleType)} has no @NgModule annotation`);
        }
        this._storeNgDef(NG_MODULE_DEF, moduleType);
        this._storeNgDef(NG_INJECTOR_DEF, moduleType);
        /** @type {?} */
        const metadata = this._getMetaWithOverrides(ngModule);
        compileNgModuleDefs(moduleType, metadata);
        /** @type {?} */
        const declarations = flatten(ngModule.declarations || EMPTY_ARRAY, resolveForwardRef);
        /** @type {?} */
        const declaredComponents = [];
        // Compile the components, directives and pipes declared by this module
        declarations.forEach((/**
         * @param {?} declaration
         * @return {?}
         */
        declaration => {
            /** @type {?} */
            const component = this._resolvers.component.resolve(declaration);
            if (component) {
                if (!declaration.hasOwnProperty(NG_COMPONENT_DEF) ||
                    this._hasTypeOverrides(declaration, this._componentOverrides) ||
                    this._hasTemplateOverrides(declaration)) {
                    this._storeNgDef(NG_COMPONENT_DEF, declaration);
                    /** @type {?} */
                    const metadata = this._getMetaWithOverrides(component, declaration);
                    compileComponent(declaration, metadata);
                }
                else if (this._hasProviderOverrides(component.providers)) {
                    this._patchDefWithProviderOverrides(declaration, NG_COMPONENT_DEF);
                }
                declaredComponents.push(declaration);
                return;
            }
            /** @type {?} */
            const directive = this._resolvers.directive.resolve(declaration);
            if (directive) {
                if (!declaration.hasOwnProperty(NG_DIRECTIVE_DEF) ||
                    this._hasTypeOverrides(declaration, this._directiveOverrides)) {
                    this._storeNgDef(NG_DIRECTIVE_DEF, declaration);
                    /** @type {?} */
                    const metadata = this._getMetaWithOverrides(directive);
                    compileDirective(declaration, metadata);
                }
                else if (this._hasProviderOverrides(directive.providers)) {
                    this._patchDefWithProviderOverrides(declaration, NG_DIRECTIVE_DEF);
                }
                return;
            }
            /** @type {?} */
            const pipe = this._resolvers.pipe.resolve(declaration);
            if (pipe) {
                if (!declaration.hasOwnProperty(NG_PIPE_DEF) ||
                    this._hasTypeOverrides(declaration, this._pipeOverrides)) {
                    this._storeNgDef(NG_PIPE_DEF, declaration);
                    compilePipe(declaration, pipe);
                }
                return;
            }
        }));
        // Compile transitive modules, components, directives and pipes
        /** @type {?} */
        const calcTransitiveScopesFor = (/**
         * @param {?} moduleType
         * @return {?}
         */
        (moduleType) => transitiveScopesFor(moduleType, (/**
         * @param {?} ngModule
         * @return {?}
         */
        (ngModule) => this._compileNgModule(ngModule))));
        /** @type {?} */
        const transitiveScope = calcTransitiveScopesFor(moduleType);
        declaredComponents.forEach((/**
         * @param {?} cmp
         * @return {?}
         */
        cmp => {
            /** @type {?} */
            const scope = this._templateOverrides.has(cmp) ?
                // if we have template override via `TestBed.overrideTemplateUsingTestingModule` -
                // define Component scope as TestingModule scope, instead of the scope of NgModule
                // where this Component was declared
                // TODO: This is only a partial fix. Should be fixed completely with FW-1178 refactor.
                transitiveScopesFor(this._testModuleType) :
                transitiveScope;
            patchComponentDefWithScope(((/** @type {?} */ (cmp))).ngComponentDef, scope);
        }));
    }
    /**
     * \@internal
     * @param {?} moduleType
     * @return {?}
     */
    _getComponentFactories(moduleType) {
        return maybeUnwrapFn(moduleType.ngModuleDef.declarations).reduce((/**
         * @param {?} factories
         * @param {?} declaration
         * @return {?}
         */
        (factories, declaration) => {
            /** @nocollapse @type {?} */
            const componentDef = ((/** @type {?} */ (declaration))).ngComponentDef;
            componentDef && factories.push(new ComponentFactory(componentDef, this._moduleRef));
            return factories;
        }), (/** @type {?} */ ([])));
    }
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
     * @private
     * @return {?}
     */
    _checkGlobalCompilationFinished() {
        // !this._instantiated should not be necessary, but is left in as an additional guard that
        // compilations queued in tests (after instantiation) are never flushed accidentally.
        if (!this._globalCompilationChecked && !this._instantiated) {
            flushModuleScopingQueueAsMuchAsPossible();
        }
        this._globalCompilationChecked = true;
    }
}
if (false) {
    /** @type {?} */
    TestBedRender3.prototype.platform;
    /** @type {?} */
    TestBedRender3.prototype.ngModule;
    /**
     * @type {?}
     * @private
     */
    TestBedRender3.prototype._moduleOverrides;
    /**
     * @type {?}
     * @private
     */
    TestBedRender3.prototype._componentOverrides;
    /**
     * @type {?}
     * @private
     */
    TestBedRender3.prototype._directiveOverrides;
    /**
     * @type {?}
     * @private
     */
    TestBedRender3.prototype._pipeOverrides;
    /**
     * @type {?}
     * @private
     */
    TestBedRender3.prototype._providerOverrides;
    /**
     * @type {?}
     * @private
     */
    TestBedRender3.prototype._compilerProviders;
    /**
     * @type {?}
     * @private
     */
    TestBedRender3.prototype._rootProviderOverrides;
    /**
     * @type {?}
     * @private
     */
    TestBedRender3.prototype._providerOverridesByToken;
    /**
     * @type {?}
     * @private
     */
    TestBedRender3.prototype._templateOverrides;
    /**
     * @type {?}
     * @private
     */
    TestBedRender3.prototype._resolvers;
    /**
     * @type {?}
     * @private
     */
    TestBedRender3.prototype._providers;
    /**
     * @type {?}
     * @private
     */
    TestBedRender3.prototype._compilerOptions;
    /**
     * @type {?}
     * @private
     */
    TestBedRender3.prototype._declarations;
    /**
     * @type {?}
     * @private
     */
    TestBedRender3.prototype._imports;
    /**
     * @type {?}
     * @private
     */
    TestBedRender3.prototype._schemas;
    /**
     * @type {?}
     * @private
     */
    TestBedRender3.prototype._activeFixtures;
    /**
     * @type {?}
     * @private
     */
    TestBedRender3.prototype._compilerInjector;
    /**
     * @type {?}
     * @private
     */
    TestBedRender3.prototype._moduleRef;
    /**
     * @type {?}
     * @private
     */
    TestBedRender3.prototype._testModuleType;
    /**
     * @type {?}
     * @private
     */
    TestBedRender3.prototype._instantiated;
    /**
     * @type {?}
     * @private
     */
    TestBedRender3.prototype._globalCompilationChecked;
    /**
     * @type {?}
     * @private
     */
    TestBedRender3.prototype._originalComponentResolutionQueue;
    /**
     * @type {?}
     * @private
     */
    TestBedRender3.prototype._initialNgDefs;
}
/** @type {?} */
let testBed;
/**
 * @return {?}
 */
export function _getTestBedRender3() {
    return testBed = testBed || new TestBedRender3();
}
/**
 * @template T
 * @param {?} values
 * @param {?=} mapFn
 * @return {?}
 */
function flatten(values, mapFn) {
    /** @type {?} */
    const out = [];
    values.forEach((/**
     * @param {?} value
     * @return {?}
     */
    value => {
        if (Array.isArray(value)) {
            out.push(...flatten(value, mapFn));
        }
        else {
            out.push(mapFn ? mapFn(value) : value);
        }
    }));
    return out;
}
/**
 * @template T
 * @param {?} value
 * @return {?}
 */
function isNgModule(value) {
    return ((/** @type {?} */ (value))).ngModuleDef !== undefined;
}
class R3TestCompiler {
    /**
     * @param {?} testBed
     */
    constructor(testBed) {
        this.testBed = testBed;
    }
    /**
     * @template T
     * @param {?} moduleType
     * @return {?}
     */
    compileModuleSync(moduleType) {
        this.testBed._compileNgModule((/** @type {?} */ (moduleType)));
        return new R3NgModuleFactory(moduleType);
    }
    /**
     * @template T
     * @param {?} moduleType
     * @return {?}
     */
    compileModuleAsync(moduleType) {
        return Promise.resolve(this.compileModuleSync(moduleType));
    }
    /**
     * @template T
     * @param {?} moduleType
     * @return {?}
     */
    compileModuleAndAllComponentsSync(moduleType) {
        /** @type {?} */
        const ngModuleFactory = this.compileModuleSync(moduleType);
        /** @type {?} */
        const componentFactories = this.testBed._getComponentFactories((/** @type {?} */ (moduleType)));
        return new ModuleWithComponentFactories(ngModuleFactory, componentFactories);
    }
    /**
     * @template T
     * @param {?} moduleType
     * @return {?}
     */
    compileModuleAndAllComponentsAsync(moduleType) {
        return Promise.resolve(this.compileModuleAndAllComponentsSync(moduleType));
    }
    /**
     * @return {?}
     */
    clearCache() { }
    /**
     * @param {?} type
     * @return {?}
     */
    clearCacheFor(type) { }
    /**
     * @param {?} moduleType
     * @return {?}
     */
    getModuleId(moduleType) {
        /** @type {?} */
        const meta = this.testBed._getModuleResolver().resolve(moduleType);
        return meta && meta.id || undefined;
    }
}
if (false) {
    /**
     * @type {?}
     * @private
     */
    R3TestCompiler.prototype.testBed;
}
/**
 * Error handler used for tests. Rethrows errors rather than logging them out.
 */
class R3TestErrorHandler extends ErrorHandler {
    /**
     * @param {?} error
     * @return {?}
     */
    handleError(error) { throw error; }
}
/**
 * Unwrap a value which might be behind a closure (for forward declaration reasons).
 * @template T
 * @param {?} value
 * @return {?}
 */
function maybeUnwrapFn(value) {
    if (value instanceof Function) {
        return value();
    }
    else {
        return value;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicjNfdGVzdF9iZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3Rlc3Rpbmcvc3JjL3IzX3Rlc3RfYmVkLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7OztBQVlBLE9BQU8sRUFDTCxxQkFBcUIsRUFDckIsUUFBUSxFQUdSLFlBQVksRUFDWixRQUFRLEVBQ1IsNEJBQTRCLEVBQzVCLFFBQVEsRUFFUixNQUFNLEVBTU4saUJBQWlCLEVBRWpCLGlCQUFpQixJQUFJLGdCQUFnQixFQUNyQyxpQkFBaUIsSUFBSSxnQkFBZ0IsRUFDckMsZ0JBQWdCLElBQUksZUFBZSxFQUNuQyxjQUFjLElBQUksYUFBYSxFQUMvQixZQUFZLElBQUksV0FBVyxFQUUzQixnQkFBZ0IsSUFBSSxpQkFBaUIsRUFFckMsd0JBQXdCLElBQUksZ0JBQWdCLEVBQzVDLG1CQUFtQixJQUFJLFdBQVcsRUFDbEMsaUJBQWlCLElBQUksZ0JBQWdCLEVBQ3JDLGlCQUFpQixJQUFJLGdCQUFnQixFQUNyQyxvQkFBb0IsSUFBSSxtQkFBbUIsRUFDM0MsWUFBWSxJQUFJLFdBQVcsRUFDM0IsaUJBQWlCLElBQUksZ0JBQWdCLEVBQ3JDLHdDQUF3QyxJQUFJLHVDQUF1QyxFQUNuRiwyQkFBMkIsSUFBSSwwQkFBMEIsRUFDekQsd0JBQXdCLElBQUksdUJBQXVCLEVBQ25ELFVBQVUsSUFBSSxTQUFTLEVBQ3ZCLG9CQUFvQixJQUFJLG1CQUFtQixFQUczQyxnQkFBZ0IsR0FFakIsTUFBTSxlQUFlLENBQUM7O0FBRXZCLE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUVqRCxPQUFPLEVBQUMsd0NBQXdDLEVBQUUsd0JBQXdCLEVBQUUseUJBQXlCLEVBQTRDLCtCQUErQixFQUFFLCtCQUErQixFQUFDLE1BQU0scUNBQXFDLENBQUM7QUFDOVAsT0FBTyxFQUFDLGdCQUFnQixFQUFDLE1BQU0s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QUMsQ0FBQyxDQUFDO0lBQzdFLENBQUM7Ozs7SUFFRCxVQUFVLEtBQVUsQ0FBQzs7Ozs7SUFFckIsYUFBYSxDQUFDLElBQWUsSUFBUyxDQUFDOzs7OztJQUV2QyxXQUFXLENBQUMsVUFBcUI7O2NBQ3pCLElBQUksR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLGtCQUFrQixFQUFFLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQztRQUNsRSxPQUFPLElBQUksSUFBSSxJQUFJLENBQUMsRUFBRSxJQUFJLFNBQVMsQ0FBQztJQUN0QyxDQUFDO0NBQ0Y7Ozs7OztJQTlCYSxpQ0FBK0I7Ozs7O0FBaUM3QyxNQUFNLGtCQUFtQixTQUFRLFlBQVk7Ozs7O0lBQzNDLFdBQVcsQ0FBQyxLQUFVLElBQUksTUFBTSxLQUFLLENBQUMsQ0FBQyxDQUFDO0NBQ3pDOzs7Ozs7O0FBS0QsU0FBUyxhQUFhLENBQUksS0FBb0I7SUFDNUMsSUFBSSxLQUFLLFlBQVksUUFBUSxFQUFFO1FBQzdCLE9BQU8sS0FBSyxFQUFFLENBQUM7S0FDaEI7U0FBTTtRQUNMLE9BQU8sS0FBSyxDQUFDO0tBQ2Q7QUFDSCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG4vLyBUaGUgZm9ybWF0dGVyIGFuZCBDSSBkaXNhZ3JlZSBvbiBob3cgdGhpcyBpbXBvcnQgc3RhdGVtZW50IHNob3VsZCBiZSBmb3JtYXR0ZWQuIEJvdGggdHJ5IHRvIGtlZXBcbi8vIGl0IG9uIG9uZSBsaW5lLCB0b28sIHdoaWNoIGhhcyBnb3R0ZW4gdmVyeSBoYXJkIHRvIHJlYWQgJiBtYW5hZ2UuIFNvIGRpc2FibGUgdGhlIGZvcm1hdHRlciBmb3Jcbi8vIHRoaXMgc3RhdGVtZW50IG9ubHkuXG4vLyBjbGFuZy1mb3JtYXQgb2ZmXG5pbXBvcnQge1xuICBBcHBsaWNhdGlvbkluaXRTdGF0dXMsXG4gIENvbXBpbGVyLFxuICBDb21wb25lbnQsXG4gIERpcmVjdGl2ZSxcbiAgRXJyb3JIYW5kbGVyLFxuICBJbmplY3RvcixcbiAgTW9kdWxlV2l0aENvbXBvbmVudEZhY3RvcmllcyxcbiAgTmdNb2R1bGUsXG4gIE5nTW9kdWxlRmFjdG9yeSxcbiAgTmdab25lLFxuICBQaXBlLFxuICBQbGF0Zm9ybVJlZixcbiAgUHJvdmlkZXIsXG4gIFNjaGVtYU1ldGFkYXRhLFxuICBUeXBlLFxuICByZXNvbHZlRm9yd2FyZFJlZixcbiAgybVJbmplY3RhYmxlRGVmIGFzIEluamVjdGFibGVEZWYsXG4gIMm1TkdfQ09NUE9ORU5UX0RFRiBhcyBOR19DT01QT05FTlRfREVGLFxuICDJtU5HX0RJUkVDVElWRV9ERUYgYXMgTkdfRElSRUNUSVZFX0RFRixcbiAgybVOR19JTkpFQ1RPUl9ERUYgYXMgTkdfSU5KRUNUT1JfREVGLFxuICDJtU5HX01PRFVMRV9ERUYgYXMgTkdfTU9EVUxFX0RFRixcbiAgybVOR19QSVBFX0RFRiBhcyBOR19QSVBFX0RFRixcbiAgybVOZ01vZHVsZURlZiBhcyBOZ01vZHVsZURlZixcbiAgybVOZ01vZHVsZUZhY3RvcnkgYXMgUjNOZ01vZHVsZUZhY3RvcnksXG4gIMm1TmdNb2R1bGVUeXBlIGFzIE5nTW9kdWxlVHlwZSxcbiAgybVSZW5kZXIzQ29tcG9uZW50RmFjdG9yeSBhcyBDb21wb25lbnRGYWN0b3J5LFxuICDJtVJlbmRlcjNOZ01vZHVsZVJlZiBhcyBOZ01vZHVsZVJlZixcbiAgybVjb21waWxlQ29tcG9uZW50IGFzIGNvbXBpbGVDb21wb25lbnQsXG4gIMm1Y29tcGlsZURpcmVjdGl2ZSBhcyBjb21waWxlRGlyZWN0aXZlLFxuICDJtWNvbXBpbGVOZ01vZHVsZURlZnMgYXMgY29tcGlsZU5nTW9kdWxlRGVmcyxcbiAgybVjb21waWxlUGlwZSBhcyBjb21waWxlUGlwZSxcbiAgybVnZXRJbmplY3RhYmxlRGVmIGFzIGdldEluamVjdGFibGVEZWYsXG4gIMm1Zmx1c2hNb2R1bGVTY29waW5nUXVldWVBc011Y2hBc1Bvc3NpYmxlIGFzIGZsdXNoTW9kdWxlU2NvcGluZ1F1ZXVlQXNNdWNoQXNQb3NzaWJsZSxcbiAgybVwYXRjaENvbXBvbmVudERlZldpdGhTY29wZSBhcyBwYXRjaENvbXBvbmVudERlZldpdGhTY29wZSxcbiAgybVyZXNldENvbXBpbGVkQ29tcG9uZW50cyBhcyByZXNldENvbXBpbGVkQ29tcG9uZW50cyxcbiAgybVzdHJpbmdpZnkgYXMgc3RyaW5naWZ5LFxuICDJtXRyYW5zaXRpdmVTY29wZXNGb3IgYXMgdHJhbnNpdGl2ZVNjb3Blc0ZvcixcbiAgQ29tcGlsZXJPcHRpb25zLFxuICBTdGF0aWNQcm92aWRlcixcbiAgQ09NUElMRVJfT1BUSU9OUyxcbiAgybVEaXJlY3RpdmVEZWYgYXMgRGlyZWN0aXZlRGVmLFxufSBmcm9tICdAYW5ndWxhci9jb3JlJztcbi8vIGNsYW5nLWZvcm1hdCBvblxuaW1wb3J0IHtSZXNvdXJjZUxvYWRlcn0gZnJvbSAnQGFuZ3VsYXIvY29tcGlsZXInO1xuXG5pbXBvcnQge2NsZWFyUmVzb2x1dGlvbk9mQ29tcG9uZW50UmVzb3VyY2VzUXVldWUsIGNvbXBvbmVudE5lZWRzUmVzb2x1dGlvbiwgcmVzb2x2ZUNvbXBvbmVudFJlc291cmNlcywgbWF5YmVRdWV1ZVJlc29sdXRpb25PZkNvbXBvbmVudFJlc291cmNlcywgaXNDb21wb25lbnREZWZQZW5kaW5nUmVzb2x1dGlvbiwgcmVzdG9yZUNvbXBvbmVudFJlc29sdXRpb25RdWV1ZX0gZnJvbSAnLi4vLi4vc3JjL21ldGFkYXRhL3Jlc291cmNlX2xvYWRpbmcnO1xuaW1wb3J0IHtDb21wb25lbnRGaXh0dXJlfSBmcm9tICcuL2NvbXBvbmVudF9maXh0dXJlJztcbmltcG9ydCB7TWV0YWRhdGFPdmVycmlkZX0gZnJvbSAnLi9tZXRhZGF0YV9vdmVycmlkZSc7XG5pbXBvcnQge0NvbXBvbmVudFJlc29sdmVyLCBEaXJlY3RpdmVSZXNvbHZlciwgTmdNb2R1bGVSZXNvbHZlciwgUGlwZVJlc29sdmVyLCBSZXNvbHZlcn0gZnJvbSAnLi9yZXNvbHZlcnMnO1xuaW1wb3J0IHtUZXN0QmVkfSBmcm9tICcuL3Rlc3RfYmVkJztcbmltcG9ydCB7Q29tcG9uZW50Rml4dHVyZUF1dG9EZXRlY3QsIENvbXBvbmVudEZpeHR1cmVOb05nWm9uZSwgVGVzdEJlZFN0YXRpYywgVGVzdENvbXBvbmVudFJlbmRlcmVyLCBUZXN0TW9kdWxlTWV0YWRhdGF9IGZyb20gJy4vdGVzdF9iZWRfY29tbW9uJztcblxubGV0IF9uZXh0Um9vdEVsZW1lbnRJZCA9IDA7XG5cbmNvbnN0IEVNUFRZX0FSUkFZOiBUeXBlPGFueT5bXSA9IFtdO1xuXG5jb25zdCBVTkRFRklORUQ6IFN5bWJvbCA9IFN5bWJvbCgnVU5ERUZJTkVEJyk7XG5cbi8vIFJlc29sdmVycyBmb3IgQW5ndWxhciBkZWNvcmF0b3JzXG50eXBlIFJlc29sdmVycyA9IHtcbiAgbW9kdWxlOiBSZXNvbHZlcjxOZ01vZHVsZT4sXG4gIGNvbXBvbmVudDogUmVzb2x2ZXI8RGlyZWN0aXZlPixcbiAgZGlyZWN0aXZlOiBSZXNvbHZlcjxDb21wb25lbnQ+LFxuICBwaXBlOiBSZXNvbHZlcjxQaXBlPixcbn07XG5cbi8qKlxuICogQGRlc2NyaXB0aW9uXG4gKiBDb25maWd1cmVzIGFuZCBpbml0aWFsaXplcyBlbnZpcm9ubWVudCBmb3IgdW5pdCB0ZXN0aW5nIGFuZCBwcm92aWRlcyBtZXRob2RzIGZvclxuICogY3JlYXRpbmcgY29tcG9uZW50cyBhbmQgc2VydmljZXMgaW4gdW5pdCB0ZXN0cy5cbiAqXG4gKiBUZXN0QmVkIGlzIHRoZSBwcmltYXJ5IGFwaSBmb3Igd3JpdGluZyB1bml0IHRlc3RzIGZvciBBbmd1bGFyIGFwcGxpY2F0aW9ucyBhbmQgbGlicmFyaWVzLlxuICpcbiAqIE5vdGU6IFVzZSBgVGVzdEJlZGAgaW4gdGVzdHMuIEl0IHdpbGwgYmUgc2V0IHRvIGVpdGhlciBgVGVzdEJlZFZpZXdFbmdpbmVgIG9yIGBUZXN0QmVkUmVuZGVyM2BcbiAqIGFjY29yZGluZyB0byB0aGUgY29tcGlsZXIgdXNlZC5cbiAqL1xuZXhwb3J0IGNsYXNzIFRlc3RCZWRSZW5kZXIzIGltcGxlbWVudHMgSW5qZWN0b3IsIFRlc3RCZWQge1xuICAvKipcbiAgICogSW5pdGlhbGl6ZSB0aGUgZW52aXJvbm1lbnQgZm9yIHRlc3Rpbmcgd2l0aCBhIGNvbXBpbGVyIGZhY3RvcnksIGEgUGxhdGZvcm1SZWYsIGFuZCBhblxuICAgKiBhbmd1bGFyIG1vZHVsZS4gVGhlc2UgYXJlIGNvbW1vbiB0byBldmVyeSB0ZXN0IGluIHRoZSBzdWl0ZS5cbiAgICpcbiAgICogVGhpcyBtYXkgb25seSBiZSBjYWxsZWQgb25jZSwgdG8gc2V0IHVwIHRoZSBjb21tb24gcHJvdmlkZXJzIGZvciB0aGUgY3VycmVudCB0ZXN0XG4gICAqIHN1aXRlIG9uIHRoZSBjdXJyZW50IHBsYXRmb3JtLiBJZiB5b3UgYWJzb2x1dGVseSBuZWVkIHRvIGNoYW5nZSB0aGUgcHJvdmlkZXJzLFxuICAgKiBmaXJzdCB1c2UgYHJlc2V0VGVzdEVudmlyb25tZW50YC5cbiAgICpcbiAgICogVGVzdCBtb2R1bGVzIGFuZCBwbGF0Zm9ybXMgZm9yIGluZGl2aWR1YWwgcGxhdGZvcm1zIGFyZSBhdmFpbGFibGUgZnJvbVxuICAgKiAnQGFuZ3VsYXIvPHBsYXRmb3JtX25hbWU+L3Rlc3RpbmcnLlxuICAgKlxuICAgKiBAcHVibGljQXBpXG4gICAqL1xuICBzdGF0aWMgaW5pdFRlc3RFbnZpcm9ubWVudChcbiAgICAgIG5nTW9kdWxlOiBUeXBlPGFueT58VHlwZTxhbnk+W10sIHBsYXRmb3JtOiBQbGF0Zm9ybVJlZiwgYW90U3VtbWFyaWVzPzogKCkgPT4gYW55W10pOiBUZXN0QmVkIHtcbiAgICBjb25zdCB0ZXN0QmVkID0gX2dldFRlc3RCZWRSZW5kZXIzKCk7XG4gICAgdGVzdEJlZC5pbml0VGVzdEVudmlyb25tZW50KG5nTW9kdWxlLCBwbGF0Zm9ybSwgYW90U3VtbWFyaWVzKTtcbiAgICByZXR1cm4gdGVzdEJlZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXNldCB0aGUgcHJvdmlkZXJzIGZvciB0aGUgdGVzdCBpbmplY3Rvci5cbiAgICpcbiAgICogQHB1YmxpY0FwaVxuICAgKi9cbiAgc3RhdGljIHJlc2V0VGVzdEVudmlyb25tZW50KCk6IHZvaWQgeyBfZ2V0VGVzdEJlZFJlbmRlcjMoKS5yZXNldFRlc3RFbnZpcm9ubWVudCgpOyB9XG5cbiAgc3RhdGljIGNvbmZpZ3VyZUNvbXBpbGVyKGNvbmZpZzoge3Byb3ZpZGVycz86IGFueVtdOyB1c2VKaXQ/OiBib29sZWFuO30pOiBUZXN0QmVkU3RhdGljIHtcbiAgICBfZ2V0VGVzdEJlZFJlbmRlcjMoKS5jb25maWd1cmVDb21waWxlcihjb25maWcpO1xuICAgIHJldHVybiBUZXN0QmVkUmVuZGVyMyBhcyBhbnkgYXMgVGVzdEJlZFN0YXRpYztcbiAgfVxuXG4gIC8qKlxuICAgKiBBbGxvd3Mgb3ZlcnJpZGluZyBkZWZhdWx0IHByb3ZpZGVycywgZGlyZWN0aXZlcywgcGlwZXMsIG1vZHVsZXMgb2YgdGhlIHRlc3QgaW5qZWN0b3IsXG4gICAqIHdoaWNoIGFyZSBkZWZpbmVkIGluIHRlc3RfaW5qZWN0b3IuanNcbiAgICovXG4gIHN0YXRpYyBjb25maWd1cmVUZXN0aW5nTW9kdWxlKG1vZHVsZURlZjogVGVzdE1vZHVsZU1ldGFkYXRhKTogVGVzdEJlZFN0YXRpYyB7XG4gICAgX2dldFRlc3RCZWRSZW5kZXIzKCkuY29uZmlndXJlVGVzdGluZ01vZHVsZShtb2R1bGVEZWYpO1xuICAgIHJldHVybiBUZXN0QmVkUmVuZGVyMyBhcyBhbnkgYXMgVGVzdEJlZFN0YXRpYztcbiAgfVxuXG4gIC8qKlxuICAgKiBDb21waWxlIGNvbXBvbmVudHMgd2l0aCBhIGB0ZW1wbGF0ZVVybGAgZm9yIHRoZSB0ZXN0J3MgTmdNb2R1bGUuXG4gICAqIEl0IGlzIG5lY2Vzc2FyeSB0byBjYWxsIHRoaXMgZnVuY3Rpb25cbiAgICogYXMgZmV0Y2hpbmcgdXJscyBpcyBhc3luY2hyb25vdXMuXG4gICAqL1xuICBzdGF0aWMgY29tcGlsZUNvbXBvbmVudHMoKTogUHJvbWlzZTxhbnk+IHsgcmV0dXJuIF9nZXRUZXN0QmVkUmVuZGVyMygpLmNvbXBpbGVDb21wb25lbnRzKCk7IH1cblxuICBzdGF0aWMgb3ZlcnJpZGVNb2R1bGUobmdNb2R1bGU6IFR5cGU8YW55Piwgb3ZlcnJpZGU6IE1ldGFkYXRhT3ZlcnJpZGU8TmdNb2R1bGU+KTogVGVzdEJlZFN0YXRpYyB7XG4gICAgX2dldFRlc3RCZWRSZW5kZXIzKCkub3ZlcnJpZGVNb2R1bGUobmdNb2R1bGUsIG92ZXJyaWRlKTtcbiAgICByZXR1cm4gVGVzdEJlZFJlbmRlcjMgYXMgYW55IGFzIFRlc3RCZWRTdGF0aWM7XG4gIH1cblxuICBzdGF0aWMgb3ZlcnJpZGVDb21wb25lbnQoY29tcG9uZW50OiBUeXBlPGFueT4sIG92ZXJyaWRlOiBNZXRhZGF0YU92ZXJyaWRlPENvbXBvbmVudD4pOlxuICAgICAgVGVzdEJlZFN0YXRpYyB7XG4gICAgX2dldFRlc3RCZWRSZW5kZXIzKCkub3ZlcnJpZGVDb21wb25lbnQoY29tcG9uZW50LCBvdmVycmlkZSk7XG4gICAgcmV0dXJuIFRlc3RCZWRSZW5kZXIzIGFzIGFueSBhcyBUZXN0QmVkU3RhdGljO1xuICB9XG5cbiAgc3RhdGljIG92ZXJyaWRlRGlyZWN0aXZlKGRpcmVjdGl2ZTogVHlwZTxhbnk+LCBvdmVycmlkZTogTWV0YWRhdGFPdmVycmlkZTxEaXJlY3RpdmU+KTpcbiAgICAgIFRlc3RCZWRTdGF0aWMge1xuICAgIF9nZXRUZXN0QmVkUmVuZGVyMygpLm92ZXJyaWRlRGlyZWN0aXZlKGRpcmVjdGl2ZSwgb3ZlcnJpZGUpO1xuICAgIHJldHVybiBUZXN0QmVkUmVuZGVyMyBhcyBhbnkgYXMgVGVzdEJlZFN0YXRpYztcbiAgfVxuXG4gIHN0YXRpYyBvdmVycmlkZVBpcGUocGlwZTogVHlwZTxhbnk+LCBvdmVycmlkZTogTWV0YWRhdGFPdmVycmlkZTxQaXBlPik6IFRlc3RCZWRTdGF0aWMge1xuICAgIF9nZXRUZXN0QmVkUmVuZGVyMygpLm92ZXJyaWRlUGlwZShwaXBlLCBvdmVycmlkZSk7XG4gICAgcmV0dXJuIFRlc3RCZWRSZW5kZXIzIGFzIGFueSBhcyBUZXN0QmVkU3RhdGljO1xuICB9XG5cbiAgc3RhdGljIG92ZXJyaWRlVGVtcGxhdGUoY29tcG9uZW50OiBUeXBlPGFueT4sIHRlbXBsYXRlOiBzdHJpbmcpOiBUZXN0QmVkU3RhdGljIHtcbiAgICBfZ2V0VGVzdEJlZFJlbmRlcjMoKS5vdmVycmlkZUNvbXBvbmVudChjb21wb25lbnQsIHtzZXQ6IHt0ZW1wbGF0ZSwgdGVtcGxhdGVVcmw6IG51bGwgIX19KTtcbiAgICByZXR1cm4gVGVzdEJlZFJlbmRlcjMgYXMgYW55IGFzIFRlc3RCZWRTdGF0aWM7XG4gIH1cblxuICAvKipcbiAgICogT3ZlcnJpZGVzIHRoZSB0ZW1wbGF0ZSBvZiB0aGUgZ2l2ZW4gY29tcG9uZW50LCBjb21waWxpbmcgdGhlIHRlbXBsYXRlXG4gICAqIGluIHRoZSBjb250ZXh0IG9mIHRoZSBUZXN0aW5nTW9kdWxlLlxuICAgKlxuICAgKiBOb3RlOiBUaGlzIHdvcmtzIGZvciBKSVQgYW5kIEFPVGVkIGNvbXBvbmVudHMgYXMgd2VsbC5cbiAgICovXG4gIHN0YXRpYyBvdmVycmlkZVRlbXBsYXRlVXNpbmdUZXN0aW5nTW9kdWxlKGNvbXBvbmVudDogVHlwZTxhbnk+LCB0ZW1wbGF0ZTogc3RyaW5nKTogVGVzdEJlZFN0YXRpYyB7XG4gICAgX2dldFRlc3RCZWRSZW5kZXIzKCkub3ZlcnJpZGVUZW1wbGF0ZVVzaW5nVGVzdGluZ01vZHVsZShjb21wb25lbnQsIHRlbXBsYXRlKTtcbiAgICByZXR1cm4gVGVzdEJlZFJlbmRlcjMgYXMgYW55IGFzIFRlc3RCZWRTdGF0aWM7XG4gIH1cblxuICBvdmVycmlkZVRlbXBsYXRlVXNpbmdUZXN0aW5nTW9kdWxlKGNvbXBvbmVudDogVHlwZTxhbnk+LCB0ZW1wbGF0ZTogc3RyaW5nKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuX2luc3RhbnRpYXRlZCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgICdDYW5ub3Qgb3ZlcnJpZGUgdGVtcGxhdGUgd2hlbiB0aGUgdGVzdCBtb2R1bGUgaGFzIGFscmVhZHkgYmVlbiBpbnN0YW50aWF0ZWQnKTtcbiAgICB9XG4gICAgdGhpcy5fdGVtcGxhdGVPdmVycmlkZXMuc2V0KGNvbXBvbmVudCwgdGVtcGxhdGUpO1xuICB9XG5cbiAgc3RhdGljIG92ZXJyaWRlUHJvdmlkZXIodG9rZW46IGFueSwgcHJvdmlkZXI6IHtcbiAgICB1c2VGYWN0b3J5OiBGdW5jdGlvbixcbiAgICBkZXBzOiBhbnlbXSxcbiAgfSk6IFRlc3RCZWRTdGF0aWM7XG4gIHN0YXRpYyBvdmVycmlkZVByb3ZpZGVyKHRva2VuOiBhbnksIHByb3ZpZGVyOiB7dXNlVmFsdWU6IGFueTt9KTogVGVzdEJlZFN0YXRpYztcbiAgc3RhdGljIG92ZXJyaWRlUHJvdmlkZXIodG9rZW46IGFueSwgcHJvdmlkZXI6IHtcbiAgICB1c2VGYWN0b3J5PzogRnVuY3Rpb24sXG4gICAgdXNlVmFsdWU/OiBhbnksXG4gICAgZGVwcz86IGFueVtdLFxuICB9KTogVGVzdEJlZFN0YXRpYyB7XG4gICAgX2dldFRlc3RCZWRSZW5kZXIzKCkub3ZlcnJpZGVQcm92aWRlcih0b2tlbiwgcHJvdmlkZXIpO1xuICAgIHJldHVybiBUZXN0QmVkUmVuZGVyMyBhcyBhbnkgYXMgVGVzdEJlZFN0YXRpYztcbiAgfVxuXG4gIC8qKlxuICAgKiBPdmVyd3JpdGVzIGFsbCBwcm92aWRlcnMgZm9yIHRoZSBnaXZlbiB0b2tlbiB3aXRoIHRoZSBnaXZlbiBwcm92aWRlciBkZWZpbml0aW9uLlxuICAgKlxuICAgKiBAZGVwcmVjYXRlZCBhcyBpdCBtYWtlcyBhbGwgTmdNb2R1bGVzIGxhenkuIEludHJvZHVjZWQgb25seSBmb3IgbWlncmF0aW5nIG9mZiBvZiBpdC5cbiAgICovXG4gIHN0YXRpYyBkZXByZWNhdGVkT3ZlcnJpZGVQcm92aWRlcih0b2tlbjogYW55LCBwcm92aWRlcjoge1xuICAgIHVzZUZhY3Rvcnk6IEZ1bmN0aW9uLFxuICAgIGRlcHM6IGFueVtdLFxuICB9KTogdm9pZDtcbiAgc3RhdGljIGRlcHJlY2F0ZWRPdmVycmlkZVByb3ZpZGVyKHRva2VuOiBhbnksIHByb3ZpZGVyOiB7dXNlVmFsdWU6IGFueTt9KTogdm9pZDtcbiAgc3RhdGljIGRlcHJlY2F0ZWRPdmVycmlkZVByb3ZpZGVyKHRva2VuOiBhbnksIHByb3ZpZGVyOiB7XG4gICAgdXNlRmFjdG9yeT86IEZ1bmN0aW9uLFxuICAgIHVzZVZhbHVlPzogYW55LFxuICAgIGRlcHM/OiBhbnlbXSxcbiAgfSk6IFRlc3RCZWRTdGF0aWMge1xuICAgIF9nZXRUZXN0QmVkUmVuZGVyMygpLmRlcHJlY2F0ZWRPdmVycmlkZVByb3ZpZGVyKHRva2VuLCBwcm92aWRlciBhcyBhbnkpO1xuICAgIHJldHVybiBUZXN0QmVkUmVuZGVyMyBhcyBhbnkgYXMgVGVzdEJlZFN0YXRpYztcbiAgfVxuXG4gIHN0YXRpYyBnZXQodG9rZW46IGFueSwgbm90Rm91bmRWYWx1ZTogYW55ID0gSW5qZWN0b3IuVEhST1dfSUZfTk9UX0ZPVU5EKTogYW55IHtcbiAgICByZXR1cm4gX2dldFRlc3RCZWRSZW5kZXIzKCkuZ2V0KHRva2VuLCBub3RGb3VuZFZhbHVlKTtcbiAgfVxuXG4gIHN0YXRpYyBjcmVhdGVDb21wb25lbnQ8VD4oY29tcG9uZW50OiBUeXBlPFQ+KTogQ29tcG9uZW50Rml4dHVyZTxUPiB7XG4gICAgcmV0dXJuIF9nZXRUZXN0QmVkUmVuZGVyMygpLmNyZWF0ZUNvbXBvbmVudChjb21wb25lbnQpO1xuICB9XG5cbiAgc3RhdGljIHJlc2V0VGVzdGluZ01vZHVsZSgpOiBUZXN0QmVkU3RhdGljIHtcbiAgICBfZ2V0VGVzdEJlZFJlbmRlcjMoKS5yZXNldFRlc3RpbmdNb2R1bGUoKTtcbiAgICByZXR1cm4gVGVzdEJlZFJlbmRlcjMgYXMgYW55IGFzIFRlc3RCZWRTdGF0aWM7XG4gIH1cblxuICAvLyBQcm9wZXJ0aWVzXG5cbiAgcGxhdGZvcm06IFBsYXRmb3JtUmVmID0gbnVsbCAhO1xuICBuZ01vZHVsZTogVHlwZTxhbnk+fFR5cGU8YW55PltdID0gbnVsbCAhO1xuXG4gIC8vIG1ldGFkYXRhIG92ZXJyaWRlc1xuICBwcml2YXRlIF9tb2R1bGVPdmVycmlkZXM6IFtUeXBlPGFueT4sIE1ldGFkYXRhT3ZlcnJpZGU8TmdNb2R1bGU+XVtdID0gW107XG4gIHByaXZhdGUgX2NvbXBvbmVudE92ZXJyaWRlczogW1R5cGU8YW55PiwgTWV0YWRhdGFPdmVycmlkZTxDb21wb25lbnQ+XVtdID0gW107XG4gIHByaXZhdGUgX2RpcmVjdGl2ZU92ZXJyaWRlczogW1R5cGU8YW55PiwgTWV0YWRhdGFPdmVycmlkZTxEaXJlY3RpdmU+XVtdID0gW107XG4gIHByaXZhdGUgX3BpcGVPdmVycmlkZXM6IFtUeXBlPGFueT4sIE1ldGFkYXRhT3ZlcnJpZGU8UGlwZT5dW10gPSBbXTtcbiAgcHJpdmF0ZSBfcHJvdmlkZXJPdmVycmlkZXM6IFByb3ZpZGVyW10gPSBbXTtcbiAgcHJpdmF0ZSBfY29tcGlsZXJQcm92aWRlcnM6IFN0YXRpY1Byb3ZpZGVyW10gPSBbXTtcbiAgcHJpdmF0ZSBfcm9vdFByb3ZpZGVyT3ZlcnJpZGVzOiBQcm92aWRlcltdID0gW107XG4gIHByaXZhdGUgX3Byb3ZpZGVyT3ZlcnJpZGVzQnlUb2tlbjogTWFwPGFueSwgUHJvdmlkZXJbXT4gPSBuZXcgTWFwKCk7XG4gIHByaXZhdGUgX3RlbXBsYXRlT3ZlcnJpZGVzOiBNYXA8VHlwZTxhbnk+LCBzdHJpbmc+ID0gbmV3IE1hcCgpO1xuICBwcml2YXRlIF9yZXNvbHZlcnM6IFJlc29sdmVycyA9IG51bGwgITtcblxuICAvLyB0ZXN0IG1vZHVsZSBjb25maWd1cmF0aW9uXG4gIHByaXZhdGUgX3Byb3ZpZGVyczogUHJvdmlkZXJbXSA9IFtdO1xuICBwcml2YXRlIF9jb21waWxlck9wdGlvbnM6IENvbXBpbGVyT3B0aW9uc1tdID0gW107XG4gIHByaXZhdGUgX2RlY2xhcmF0aW9uczogQXJyYXk8VHlwZTxhbnk+fGFueVtdfGFueT4gPSBbXTtcbiAgcHJpdmF0ZSBfaW1wb3J0czogQXJyYXk8VHlwZTxhbnk+fGFueVtdfGFueT4gPSBbXTtcbiAgcHJpdmF0ZSBfc2NoZW1hczogQXJyYXk8U2NoZW1hTWV0YWRhdGF8YW55W10+ID0gW107XG5cbiAgcHJpdmF0ZSBfYWN0aXZlRml4dHVyZXM6IENvbXBvbmVudEZpeHR1cmU8YW55PltdID0gW107XG5cbiAgcHJpdmF0ZSBfY29tcGlsZXJJbmplY3RvcjogSW5qZWN0b3IgPSBudWxsICE7XG4gIHByaXZhdGUgX21vZHVsZVJlZjogTmdNb2R1bGVSZWY8YW55PiA9IG51bGwgITtcbiAgcHJpdmF0ZSBfdGVzdE1vZHVsZVR5cGU6IE5nTW9kdWxlVHlwZTxhbnk+ID0gbnVsbCAhO1xuXG4gIHByaXZhdGUgX2luc3RhbnRpYXRlZDogYm9vbGVhbiA9IGZhbHNlO1xuICBwcml2YXRlIF9nbG9iYWxDb21waWxhdGlvbkNoZWNrZWQgPSBmYWxzZTtcblxuICBwcml2YXRlIF9vcmlnaW5hbENvbXBvbmVudFJlc29sdXRpb25RdWV1ZTogTWFwPFR5cGU8YW55PiwgQ29tcG9uZW50PnxudWxsID0gbnVsbDtcblxuICAvLyBNYXAgdGhhdCBrZWVwcyBpbml0aWFsIHZlcnNpb24gb2YgY29tcG9uZW50L2RpcmVjdGl2ZS9waXBlIGRlZnMgaW4gY2FzZVxuICAvLyB3ZSBjb21waWxlIGEgVHlwZSBhZ2FpbiwgdGh1cyBvdmVycmlkaW5nIHJlc3BlY3RpdmUgc3RhdGljIGZpZWxkcy4gVGhpcyBpc1xuICAvLyByZXF1aXJlZCB0byBtYWtlIHN1cmUgd2UgcmVzdG9yZSBkZWZzIHRvIHRoZWlyIGluaXRpYWwgc3RhdGVzIGJldHdlZW4gdGVzdCBydW5zXG4gIHByaXZhdGUgX2luaXRpYWxOZ0RlZnM6IE1hcDxUeXBlPGFueT4sIFtzdHJpbmcsIFByb3BlcnR5RGVzY3JpcHRvcnx1bmRlZmluZWRdPiA9IG5ldyBNYXAoKTtcblxuICAvKipcbiAgICogSW5pdGlhbGl6ZSB0aGUgZW52aXJvbm1lbnQgZm9yIHRlc3Rpbmcgd2l0aCBhIGNvbXBpbGVyIGZhY3RvcnksIGEgUGxhdGZvcm1SZWYsIGFuZCBhblxuICAgKiBhbmd1bGFyIG1vZHVsZS4gVGhlc2UgYXJlIGNvbW1vbiB0byBldmVyeSB0ZXN0IGluIHRoZSBzdWl0ZS5cbiAgICpcbiAgICogVGhpcyBtYXkgb25seSBiZSBjYWxsZWQgb25jZSwgdG8gc2V0IHVwIHRoZSBjb21tb24gcHJvdmlkZXJzIGZvciB0aGUgY3VycmVudCB0ZXN0XG4gICAqIHN1aXRlIG9uIHRoZSBjdXJyZW50IHBsYXRmb3JtLiBJZiB5b3UgYWJzb2x1dGVseSBuZWVkIHRvIGNoYW5nZSB0aGUgcHJvdmlkZXJzLFxuICAgKiBmaXJzdCB1c2UgYHJlc2V0VGVzdEVudmlyb25tZW50YC5cbiAgICpcbiAgICogVGVzdCBtb2R1bGVzIGFuZCBwbGF0Zm9ybXMgZm9yIGluZGl2aWR1YWwgcGxhdGZvcm1zIGFyZSBhdmFpbGFibGUgZnJvbVxuICAgKiAnQGFuZ3VsYXIvPHBsYXRmb3JtX25hbWU+L3Rlc3RpbmcnLlxuICAgKlxuICAgKiBAcHVibGljQXBpXG4gICAqL1xuICBpbml0VGVzdEVudmlyb25tZW50KFxuICAgICAgbmdNb2R1bGU6IFR5cGU8YW55PnxUeXBlPGFueT5bXSwgcGxhdGZvcm06IFBsYXRmb3JtUmVmLCBhb3RTdW1tYXJpZXM/OiAoKSA9PiBhbnlbXSk6IHZvaWQge1xuICAgIGlmICh0aGlzLnBsYXRmb3JtIHx8IHRoaXMubmdNb2R1bGUpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignQ2Fubm90IHNldCBiYXNlIHByb3ZpZGVycyBiZWNhdXNlIGl0IGhhcyBhbHJlYWR5IGJlZW4gY2FsbGVkJyk7XG4gICAgfVxuICAgIHRoaXMucGxhdGZvcm0gPSBwbGF0Zm9ybTtcbiAgICB0aGlzLm5nTW9kdWxlID0gbmdNb2R1bGU7XG4gIH1cblxuICAvKipcbiAgICogUmVzZXQgdGhlIHByb3ZpZGVycyBmb3IgdGhlIHRlc3QgaW5qZWN0b3IuXG4gICAqXG4gICAqIEBwdWJsaWNBcGlcbiAgICovXG4gIHJlc2V0VGVzdEVudmlyb25tZW50KCk6IHZvaWQge1xuICAgIHRoaXMucmVzZXRUZXN0aW5nTW9kdWxlKCk7XG4gICAgdGhpcy5wbGF0Zm9ybSA9IG51bGwgITtcbiAgICB0aGlzLm5nTW9kdWxlID0gbnVsbCAhO1xuICB9XG5cbiAgcmVzZXRUZXN0aW5nTW9kdWxlKCk6IHZvaWQge1xuICAgIHRoaXMuX2NoZWNrR2xvYmFsQ29tcGlsYXRpb25GaW5pc2hlZCgpO1xuICAgIHJlc2V0Q29tcGlsZWRDb21wb25lbnRzKCk7XG4gICAgLy8gcmVzZXQgbWV0YWRhdGEgb3ZlcnJpZGVzXG4gICAgdGhpcy5fbW9kdWxlT3ZlcnJpZGVzID0gW107XG4gICAgdGhpcy5fY29tcG9uZW50T3ZlcnJpZGVzID0gW107XG4gICAgdGhpcy5fZGlyZWN0aXZlT3ZlcnJpZGVzID0gW107XG4gICAgdGhpcy5fcGlwZU92ZXJyaWRlcyA9IFtdO1xuICAgIHRoaXMuX3Byb3ZpZGVyT3ZlcnJpZGVzID0gW107XG4gICAgdGhpcy5fcm9vdFByb3ZpZGVyT3ZlcnJpZGVzID0gW107XG4gICAgdGhpcy5fcHJvdmlkZXJPdmVycmlkZXNCeVRva2VuLmNsZWFyKCk7XG4gICAgdGhpcy5fdGVtcGxhdGVPdmVycmlkZXMuY2xlYXIoKTtcbiAgICB0aGlzLl9yZXNvbHZlcnMgPSBudWxsICE7XG5cbiAgICAvLyByZXNldCB0ZXN0IG1vZHVsZSBjb25maWdcbiAgICB0aGlzLl9wcm92aWRlcnMgPSBbXTtcbiAgICB0aGlzLl9jb21waWxlck9wdGlvbnMgPSBbXTtcbiAgICB0aGlzLl9jb21waWxlclByb3ZpZGVycyA9IFtdO1xuICAgIHRoaXMuX2RlY2xhcmF0aW9ucyA9IFtdO1xuICAgIHRoaXMuX2ltcG9ydHMgPSBbXTtcbiAgICB0aGlzLl9zY2hlbWFzID0gW107XG4gICAgdGhpcy5fbW9kdWxlUmVmID0gbnVsbCAhO1xuICAgIHRoaXMuX3Rlc3RNb2R1bGVUeXBlID0gbnVsbCAhO1xuXG4gICAgdGhpcy5fY29tcGlsZXJJbmplY3RvciA9IG51bGwgITtcbiAgICB0aGlzLl9pbnN0YW50aWF0ZWQgPSBmYWxzZTtcbiAgICB0aGlzLl9hY3RpdmVGaXh0dXJlcy5mb3JFYWNoKChmaXh0dXJlKSA9PiB7XG4gICAgICB0cnkge1xuICAgICAgICBmaXh0dXJlLmRlc3Ryb3koKTtcbiAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcignRXJyb3IgZHVyaW5nIGNsZWFudXAgb2YgY29tcG9uZW50Jywge1xuICAgICAgICAgIGNvbXBvbmVudDogZml4dHVyZS5jb21wb25lbnRJbnN0YW5jZSxcbiAgICAgICAgICBzdGFja3RyYWNlOiBlLFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICB0aGlzLl9hY3RpdmVGaXh0dXJlcyA9IFtdO1xuXG4gICAgLy8gcmVzdG9yZSBpbml0aWFsIGNvbXBvbmVudC9kaXJlY3RpdmUvcGlwZSBkZWZzXG4gICAgdGhpcy5faW5pdGlhbE5nRGVmcy5mb3JFYWNoKCh2YWx1ZTogW3N0cmluZywgUHJvcGVydHlEZXNjcmlwdG9yXSwgdHlwZTogVHlwZTxhbnk+KSA9PiB7XG4gICAgICBjb25zdCBbcHJvcCwgZGVzY3JpcHRvcl0gPSB2YWx1ZTtcbiAgICAgIGlmICghZGVzY3JpcHRvcikge1xuICAgICAgICAvLyBEZWxldGUgb3BlcmF0aW9ucyBhcmUgZ2VuZXJhbGx5IHVuZGVzaXJhYmxlIHNpbmNlIHRoZXkgaGF2ZSBwZXJmb3JtYW5jZSBpbXBsaWNhdGlvbnMgb25cbiAgICAgICAgLy8gb2JqZWN0cyB0aGV5IHdlcmUgYXBwbGllZCB0by4gSW4gdGhpcyBwYXJ0aWN1bGFyIGNhc2UsIHNpdHVhdGlvbnMgd2hlcmUgdGhpcyBjb2RlIGlzXG4gICAgICAgIC8vIGludm9rZWQgc2hvdWxkIGJlIHF1aXRlIHJhcmUgdG8gY2F1c2UgYW55IG5vdGljYWJsZSBpbXBhY3QsIHNpbmNlIGl0J3MgYXBwbGllZCBvbmx5IHRvXG4gICAgICAgIC8vIHNvbWUgdGVzdCBjYXNlcyAoZm9yIGV4YW1wbGUgd2hlbiBjbGFzcyB3aXRoIG5vIGFubm90YXRpb25zIGV4dGVuZHMgc29tZSBAQ29tcG9uZW50KSB3aGVuXG4gICAgICAgIC8vIHdlIG5lZWQgdG8gY2xlYXIgJ25nQ29tcG9uZW50RGVmJyBmaWVsZCBvbiBhIGdpdmVuIGNsYXNzIHRvIHJlc3RvcmUgaXRzIG9yaWdpbmFsIHN0YXRlXG4gICAgICAgIC8vIChiZWZvcmUgYXBwbHlpbmcgb3ZlcnJpZGVzIGFuZCBydW5uaW5nIHRlc3RzKS5cbiAgICAgICAgZGVsZXRlICh0eXBlIGFzIGFueSlbcHJvcF07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodHlwZSwgcHJvcCwgZGVzY3JpcHRvcik7XG4gICAgICB9XG4gICAgfSk7XG4gICAgdGhpcy5faW5pdGlhbE5nRGVmcy5jbGVhcigpO1xuICAgIHRoaXMuX3Jlc3RvcmVDb21wb25lbnRSZXNvbHV0aW9uUXVldWUoKTtcbiAgfVxuXG4gIGNvbmZpZ3VyZUNvbXBpbGVyKGNvbmZpZzoge3Byb3ZpZGVycz86IGFueVtdOyB1c2VKaXQ/OiBib29sZWFuO30pOiB2b2lkIHtcbiAgICBpZiAoY29uZmlnLnVzZUppdCAhPSBudWxsKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ3RoZSBSZW5kZXIzIGNvbXBpbGVyIEppVCBtb2RlIGlzIG5vdCBjb25maWd1cmFibGUgIScpO1xuICAgIH1cblxuICAgIGlmIChjb25maWcucHJvdmlkZXJzKSB7XG4gICAgICB0aGlzLl9wcm92aWRlck92ZXJyaWRlcy5wdXNoKC4uLmNvbmZpZy5wcm92aWRlcnMpO1xuICAgICAgdGhpcy5fY29tcGlsZXJQcm92aWRlcnMucHVzaCguLi5jb25maWcucHJvdmlkZXJzKTtcbiAgICB9XG4gIH1cblxuICBjb25maWd1cmVUZXN0aW5nTW9kdWxlKG1vZHVsZURlZjogVGVzdE1vZHVsZU1ldGFkYXRhKTogdm9pZCB7XG4gICAgdGhpcy5fYXNzZXJ0Tm90SW5zdGFudGlhdGVkKCdSM1Rlc3RCZWQuY29uZmlndXJlVGVzdGluZ01vZHVsZScsICdjb25maWd1cmUgdGhlIHRlc3QgbW9kdWxlJyk7XG4gICAgaWYgKG1vZHVsZURlZi5wcm92aWRlcnMpIHtcbiAgICAgIHRoaXMuX3Byb3ZpZGVycy5wdXNoKC4uLm1vZHVsZURlZi5wcm92aWRlcnMpO1xuICAgIH1cbiAgICBpZiAobW9kdWxlRGVmLmRlY2xhcmF0aW9ucykge1xuICAgICAgdGhpcy5fZGVjbGFyYXRpb25zLnB1c2goLi4ubW9kdWxlRGVmLmRlY2xhcmF0aW9ucyk7XG4gICAgfVxuICAgIGlmIChtb2R1bGVEZWYuaW1wb3J0cykge1xuICAgICAgdGhpcy5faW1wb3J0cy5wdXNoKC4uLm1vZHVsZURlZi5pbXBvcnRzKTtcbiAgICB9XG4gICAgaWYgKG1vZHVsZURlZi5zY2hlbWFzKSB7XG4gICAgICB0aGlzLl9zY2hlbWFzLnB1c2goLi4ubW9kdWxlRGVmLnNjaGVtYXMpO1xuICAgIH1cbiAgfVxuXG4gIGNvbXBpbGVDb21wb25lbnRzKCk6IFByb21pc2U8YW55PiB7XG4gICAgdGhpcy5fY2xlYXJDb21wb25lbnRSZXNvbHV0aW9uUXVldWUoKTtcblxuICAgIGNvbnN0IHJlc29sdmVycyA9IHRoaXMuX2dldFJlc29sdmVycygpO1xuICAgIGNvbnN0IGRlY2xhcmF0aW9uczogVHlwZTxhbnk+W10gPSBmbGF0dGVuKHRoaXMuX2RlY2xhcmF0aW9ucyB8fCBFTVBUWV9BUlJBWSwgcmVzb2x2ZUZvcndhcmRSZWYpO1xuXG4gICAgY29uc3QgY29tcG9uZW50T3ZlcnJpZGVzOiBbVHlwZTxhbnk+LCBDb21wb25lbnRdW10gPSBbXTtcbiAgICBjb25zdCBwcm92aWRlck92ZXJyaWRlczogKCgpID0+IHZvaWQpW10gPSBbXTtcbiAgICBsZXQgaGFzQXN5bmNSZXNvdXJjZXMgPSBmYWxzZTtcblxuICAgIC8vIENvbXBpbGUgdGhlIGNvbXBvbmVudHMgZGVjbGFyZWQgYnkgdGhpcyBtb2R1bGVcbiAgICAvLyBUT0RPKEZXLTExNzgpOiBgY29tcGlsZUNvbXBvbmVudHNgIHNob3VsZCBub3QgZHVwbGljYXRlIGBfY29tcGlsZU5nTW9kdWxlYCBsb2dpY1xuICAgIGRlY2xhcmF0aW9ucy5mb3JFYWNoKGRlY2xhcmF0aW9uID0+IHtcbiAgICAgIGNvbnN0IGNvbXBvbmVudCA9IHJlc29sdmVycy5jb21wb25lbnQucmVzb2x2ZShkZWNsYXJhdGlvbik7XG4gICAgICBpZiAoY29tcG9uZW50KSB7XG4gICAgICAgIGlmICghZGVjbGFyYXRpb24uaGFzT3duUHJvcGVydHkoTkdfQ09NUE9ORU5UX0RFRikgfHxcbiAgICAgICAgICAgIGlzQ29tcG9uZW50RGVmUGVuZGluZ1Jlc29sdXRpb24oZGVjbGFyYXRpb24pIHx8ICAvL1xuICAgICAgICAgICAgLy8gQ29tcGlsZXIgcHJvdmlkZXIgb3ZlcnJpZGVzIChsaWtlIFJlc291cmNlTG9hZGVyKSBtaWdodCBhZmZlY3QgdGhlIG91dGNvbWUgb2ZcbiAgICAgICAgICAgIC8vIGNvbXBpbGF0aW9uLCBzbyB3ZSB0cmlnZ2VyIGBjb21waWxlQ29tcG9uZW50YCBpbiBjYXNlIHdlIGhhdmUgY29tcGlsZXJzIG92ZXJyaWRlcy5cbiAgICAgICAgICAgIHRoaXMuX2NvbXBpbGVyUHJvdmlkZXJzLmxlbmd0aCA+IDAgfHxcbiAgICAgICAgICAgIHRoaXMuX2hhc1R5cGVPdmVycmlkZXMoZGVjbGFyYXRpb24sIHRoaXMuX2NvbXBvbmVudE92ZXJyaWRlcykgfHxcbiAgICAgICAgICAgIHRoaXMuX2hhc1RlbXBsYXRlT3ZlcnJpZGVzKGRlY2xhcmF0aW9uKSkge1xuICAgICAgICAgIHRoaXMuX3N0b3JlTmdEZWYoTkdfQ09NUE9ORU5UX0RFRiwgZGVjbGFyYXRpb24pO1xuICAgICAgICAgIC8vIFdlIG1ha2UgYSBjb3B5IG9mIHRoZSBtZXRhZGF0YSB0byBlbnN1cmUgdGhhdCB3ZSBkb24ndCBtdXRhdGUgdGhlIG9yaWdpbmFsIG1ldGFkYXRhXG4gICAgICAgICAgY29uc3QgbWV0YWRhdGEgPSB7Li4uY29tcG9uZW50fTtcbiAgICAgICAgICBjb21waWxlQ29tcG9uZW50KGRlY2xhcmF0aW9uLCBtZXRhZGF0YSk7XG4gICAgICAgICAgY29tcG9uZW50T3ZlcnJpZGVzLnB1c2goW2RlY2xhcmF0aW9uLCBtZXRhZGF0YV0pO1xuICAgICAgICAgIGhhc0FzeW5jUmVzb3VyY2VzID0gaGFzQXN5bmNSZXNvdXJjZXMgfHwgY29tcG9uZW50TmVlZHNSZXNvbHV0aW9uKGNvbXBvbmVudCk7XG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5faGFzUHJvdmlkZXJPdmVycmlkZXMoY29tcG9uZW50LnByb3ZpZGVycykpIHtcbiAgICAgICAgICAvLyBRdWV1ZSBwcm92aWRlciBvdmVycmlkZSBvcGVyYXRpb25zLCBzaW5jZSBmZXRjaGluZyBuZ0NvbXBvbmVudERlZiAodG8gcGF0Y2ggaXQpIG1pZ2h0XG4gICAgICAgICAgLy8gdHJpZ2dlciByZS1jb21waWxhdGlvbiwgd2hpY2ggd2lsbCBmYWlsIGJlY2F1c2UgY29tcG9uZW50IHJlc291cmNlcyBhcmUgbm90IHlldCBmdWxseVxuICAgICAgICAgIC8vIHJlc29sdmVkIGF0IHRoaXMgbW9tZW50LiBUaGUgcXVldWUgaXMgZHJhaW5lZCBvbmNlIGFsbCByZXNvdXJjZXMgYXJlIHJlc29sdmVkLlxuICAgICAgICAgIHByb3ZpZGVyT3ZlcnJpZGVzLnB1c2goXG4gICAgICAgICAgICAgICgpID0+IHRoaXMuX3BhdGNoRGVmV2l0aFByb3ZpZGVyT3ZlcnJpZGVzKGRlY2xhcmF0aW9uLCBOR19DT01QT05FTlRfREVGKSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcblxuICAgIGNvbnN0IG92ZXJyaWRlQ29tcG9uZW50cyA9ICgpID0+IHtcbiAgICAgIGNvbXBvbmVudE92ZXJyaWRlcy5mb3JFYWNoKChvdmVycmlkZTogW1R5cGU8YW55PiwgQ29tcG9uZW50XSkgPT4ge1xuICAgICAgICAvLyBPdmVycmlkZSB0aGUgZXhpc3RpbmcgbWV0YWRhdGEsIGVuc3VyaW5nIHRoYXQgdGhlIHJlc29sdmVkIHJlc291cmNlc1xuICAgICAgICAvLyBhcmUgb25seSBhdmFpbGFibGUgdW50aWwgdGhlIG5leHQgVGVzdEJlZCByZXNldCAod2hlbiBgcmVzZXRUZXN0aW5nTW9kdWxlYCBpcyBjYWxsZWQpXG4gICAgICAgIHRoaXMub3ZlcnJpZGVDb21wb25lbnQob3ZlcnJpZGVbMF0sIHtzZXQ6IG92ZXJyaWRlWzFdfSk7XG4gICAgICB9KTtcbiAgICAgIHByb3ZpZGVyT3ZlcnJpZGVzLmZvckVhY2goKG92ZXJyaWRlRm46ICgpID0+IHZvaWQpID0+IG92ZXJyaWRlRm4oKSk7XG4gICAgfTtcblxuICAgIC8vIElmIHRoZSBjb21wb25lbnQgaGFzIG5vIGFzeW5jIHJlc291cmNlcyAodGVtcGxhdGVVcmwsIHN0eWxlVXJscyksIHdlIGNhbiBmaW5pc2hcbiAgICAvLyBzeW5jaHJvbm91c2x5LiBUaGlzIGlzIGltcG9ydGFudCBzbyB0aGF0IHVzZXJzIHdobyBtaXN0YWtlbmx5IHRyZWF0IGBjb21waWxlQ29tcG9uZW50c2BcbiAgICAvLyBhcyBzeW5jaHJvbm91cyBkb24ndCBlbmNvdW50ZXIgYW4gZXJyb3IsIGFzIFZpZXdFbmdpbmUgd2FzIHRvbGVyYW50IG9mIHRoaXMuXG4gICAgaWYgKCFoYXNBc3luY1Jlc291cmNlcykge1xuICAgICAgb3ZlcnJpZGVDb21wb25lbnRzKCk7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGxldCByZXNvdXJjZUxvYWRlcjogUmVzb3VyY2VMb2FkZXI7XG4gICAgICByZXR1cm4gcmVzb2x2ZUNvbXBvbmVudFJlc291cmNlcyh1cmwgPT4ge1xuICAgICAgICAgICAgICAgaWYgKCFyZXNvdXJjZUxvYWRlcikge1xuICAgICAgICAgICAgICAgICByZXNvdXJjZUxvYWRlciA9IHRoaXMuY29tcGlsZXJJbmplY3Rvci5nZXQoUmVzb3VyY2VMb2FkZXIpO1xuICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShyZXNvdXJjZUxvYWRlci5nZXQodXJsKSk7XG4gICAgICAgICAgICAgfSlcbiAgICAgICAgICAudGhlbihvdmVycmlkZUNvbXBvbmVudHMpO1xuICAgIH1cbiAgfVxuXG4gIGdldCh0b2tlbjogYW55LCBub3RGb3VuZFZhbHVlOiBhbnkgPSBJbmplY3Rvci5USFJPV19JRl9OT1RfRk9VTkQpOiBhbnkge1xuICAgIHRoaXMuX2luaXRJZk5lZWRlZCgpO1xuICAgIGlmICh0b2tlbiA9PT0gVGVzdEJlZFJlbmRlcjMpIHtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICBjb25zdCByZXN1bHQgPSB0aGlzLl9tb2R1bGVSZWYuaW5qZWN0b3IuZ2V0KHRva2VuLCBVTkRFRklORUQpO1xuICAgIHJldHVybiByZXN1bHQgPT09IFVOREVGSU5FRCA/IHRoaXMuY29tcGlsZXJJbmplY3Rvci5nZXQodG9rZW4sIG5vdEZvdW5kVmFsdWUpIDogcmVzdWx0O1xuICB9XG5cbiAgZXhlY3V0ZSh0b2tlbnM6IGFueVtdLCBmbjogRnVuY3Rpb24sIGNvbnRleHQ/OiBhbnkpOiBhbnkge1xuICAgIHRoaXMuX2luaXRJZk5lZWRlZCgpO1xuICAgIGNvbnN0IHBhcmFtcyA9IHRva2Vucy5tYXAodCA9PiB0aGlzLmdldCh0KSk7XG4gICAgcmV0dXJuIGZuLmFwcGx5KGNvbnRleHQsIHBhcmFtcyk7XG4gIH1cblxuICBvdmVycmlkZU1vZHVsZShuZ01vZHVsZTogVHlwZTxhbnk+LCBvdmVycmlkZTogTWV0YWRhdGFPdmVycmlkZTxOZ01vZHVsZT4pOiB2b2lkIHtcbiAgICB0aGlzLl9hc3NlcnROb3RJbnN0YW50aWF0ZWQoJ292ZXJyaWRlTW9kdWxlJywgJ292ZXJyaWRlIG1vZHVsZSBtZXRhZGF0YScpO1xuICAgIHRoaXMuX21vZHVsZU92ZXJyaWRlcy5wdXNoKFtuZ01vZHVsZSwgb3ZlcnJpZGVdKTtcbiAgfVxuXG4gIG92ZXJyaWRlQ29tcG9uZW50KGNvbXBvbmVudDogVHlwZTxhbnk+LCBvdmVycmlkZTogTWV0YWRhdGFPdmVycmlkZTxDb21wb25lbnQ+KTogdm9pZCB7XG4gICAgdGhpcy5fYXNzZXJ0Tm90SW5zdGFudGlhdGVkKCdvdmVycmlkZUNvbXBvbmVudCcsICdvdmVycmlkZSBjb21wb25lbnQgbWV0YWRhdGEnKTtcbiAgICB0aGlzLl9jb21wb25lbnRPdmVycmlkZXMucHVzaChbY29tcG9uZW50LCBvdmVycmlkZV0pO1xuICB9XG5cbiAgb3ZlcnJpZGVEaXJlY3RpdmUoZGlyZWN0aXZlOiBUeXBlPGFueT4sIG92ZXJyaWRlOiBNZXRhZGF0YU92ZXJyaWRlPERpcmVjdGl2ZT4pOiB2b2lkIHtcbiAgICB0aGlzLl9hc3NlcnROb3RJbnN0YW50aWF0ZWQoJ292ZXJyaWRlRGlyZWN0aXZlJywgJ292ZXJyaWRlIGRpcmVjdGl2ZSBtZXRhZGF0YScpO1xuICAgIHRoaXMuX2RpcmVjdGl2ZU92ZXJyaWRlcy5wdXNoKFtkaXJlY3RpdmUsIG92ZXJyaWRlXSk7XG4gIH1cblxuICBvdmVycmlkZVBpcGUocGlwZTogVHlwZTxhbnk+LCBvdmVycmlkZTogTWV0YWRhdGFPdmVycmlkZTxQaXBlPik6IHZvaWQge1xuICAgIHRoaXMuX2Fzc2VydE5vdEluc3RhbnRpYXRlZCgnb3ZlcnJpZGVQaXBlJywgJ292ZXJyaWRlIHBpcGUgbWV0YWRhdGEnKTtcbiAgICB0aGlzLl9waXBlT3ZlcnJpZGVzLnB1c2goW3BpcGUsIG92ZXJyaWRlXSk7XG4gIH1cblxuICAvKipcbiAgICogT3ZlcndyaXRlcyBhbGwgcHJvdmlkZXJzIGZvciB0aGUgZ2l2ZW4gdG9rZW4gd2l0aCB0aGUgZ2l2ZW4gcHJvdmlkZXIgZGVmaW5pdGlvbi5cbiAgICovXG4gIG92ZXJyaWRlUHJvdmlkZXIodG9rZW46IGFueSwgcHJvdmlkZXI6IHt1c2VGYWN0b3J5PzogRnVuY3Rpb24sIHVzZVZhbHVlPzogYW55LCBkZXBzPzogYW55W119KTpcbiAgICAgIHZvaWQge1xuICAgIGNvbnN0IHByb3ZpZGVyRGVmID0gcHJvdmlkZXIudXNlRmFjdG9yeSA/XG4gICAgICAgIHtwcm92aWRlOiB0b2tlbiwgdXNlRmFjdG9yeTogcHJvdmlkZXIudXNlRmFjdG9yeSwgZGVwczogcHJvdmlkZXIuZGVwcyB8fCBbXX0gOlxuICAgICAgICB7cHJvdmlkZTogdG9rZW4sIHVzZVZhbHVlOiBwcm92aWRlci51c2VWYWx1ZX07XG5cbiAgICBsZXQgaW5qZWN0YWJsZURlZjogSW5qZWN0YWJsZURlZjxhbnk+fG51bGw7XG4gICAgY29uc3QgaXNSb290ID1cbiAgICAgICAgKHR5cGVvZiB0b2tlbiAhPT0gJ3N0cmluZycgJiYgKGluamVjdGFibGVEZWYgPSBnZXRJbmplY3RhYmxlRGVmKHRva2VuKSkgJiZcbiAgICAgICAgIGluamVjdGFibGVEZWYucHJvdmlkZWRJbiA9PT0gJ3Jvb3QnKTtcbiAgICBjb25zdCBvdmVycmlkZXNCdWNrZXQgPSBpc1Jvb3QgPyB0aGlzLl9yb290UHJvdmlkZXJPdmVycmlkZXMgOiB0aGlzLl9wcm92aWRlck92ZXJyaWRlcztcbiAgICBvdmVycmlkZXNCdWNrZXQucHVzaChwcm92aWRlckRlZik7XG5cbiAgICAvLyBrZWVwIGFsbCBvdmVycmlkZXMgZ3JvdXBlZCBieSB0b2tlbiBhcyB3ZWxsIGZvciBmYXN0IGxvb2t1cHMgdXNpbmcgdG9rZW5cbiAgICBjb25zdCBvdmVycmlkZXNGb3JUb2tlbiA9IHRoaXMuX3Byb3ZpZGVyT3ZlcnJpZGVzQnlUb2tlbi5nZXQodG9rZW4pIHx8IFtdO1xuICAgIG92ZXJyaWRlc0ZvclRva2VuLnB1c2gocHJvdmlkZXJEZWYpO1xuICAgIHRoaXMuX3Byb3ZpZGVyT3ZlcnJpZGVzQnlUb2tlbi5zZXQodG9rZW4sIG92ZXJyaWRlc0ZvclRva2VuKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBPdmVyd3JpdGVzIGFsbCBwcm92aWRlcnMgZm9yIHRoZSBnaXZlbiB0b2tlbiB3aXRoIHRoZSBnaXZlbiBwcm92aWRlciBkZWZpbml0aW9uLlxuICAgKlxuICAgKiBAZGVwcmVjYXRlZCBhcyBpdCBtYWtlcyBhbGwgTmdNb2R1bGVzIGxhenkuIEludHJvZHVjZWQgb25seSBmb3IgbWlncmF0aW5nIG9mZiBvZiBpdC5cbiAgICovXG4gIGRlcHJlY2F0ZWRPdmVycmlkZVByb3ZpZGVyKHRva2VuOiBhbnksIHByb3ZpZGVyOiB7XG4gICAgdXNlRmFjdG9yeTogRnVuY3Rpb24sXG4gICAgZGVwczogYW55W10sXG4gIH0pOiB2b2lkO1xuICBkZXByZWNhdGVkT3ZlcnJpZGVQcm92aWRlcih0b2tlbjogYW55LCBwcm92aWRlcjoge3VzZVZhbHVlOiBhbnk7fSk6IHZvaWQ7XG4gIGRlcHJlY2F0ZWRPdmVycmlkZVByb3ZpZGVyKFxuICAgICAgdG9rZW46IGFueSwgcHJvdmlkZXI6IHt1c2VGYWN0b3J5PzogRnVuY3Rpb24sIHVzZVZhbHVlPzogYW55LCBkZXBzPzogYW55W119KTogdm9pZCB7XG4gICAgLy8gSEFDSzogVGhpcyBpcyBOT1QgdGhlIGNvcnJlY3QgaW1wbGVtZW50YXRpb24gZm9yIGRlcHJlY2F0ZWRPdmVycmlkZVByb3ZpZGVyLlxuICAgIC8vIFRvIGltcGxlbWVudCBpdCBpbiBhIGJhY2t3YXJkIGNvbXBhdGlibGUgd2F5LCB3ZSB3b3VsZCBuZWVkIHRvIHJlY29yZCBzb21lIHN0YXRlXG4gICAgLy8gc28gd2Uga25vdyB0byBwcmV2ZW50IGVhZ2VyIGluc3RhbnRpYXRpb24gb2YgTmdNb2R1bGVzLiBIb3dldmVyLCB3ZSBkb24ndCBwbGFuXG4gICAgLy8gdG8gaW1wbGVtZW50IHRoaXMgYXQgYWxsIHNpbmNlIHRoZSBBUEkgaXMgZGVwcmVjYXRlZCBhbmQgc2NoZWR1bGVkIGZvciByZW1vdmFsXG4gICAgLy8gaW4gVjguIFRoaXMgaGFjayBpcyBoZXJlIHRlbXBvcmFyaWx5IGZvciBJdnkgdGVzdGluZyB1bnRpbCB3ZSB0cmFuc2l0aW9uIGFwcHNcbiAgICAvLyBpbnNpZGUgR29vZ2xlIHRvIHRoZSBvdmVycmlkZVByb3ZpZGVyIEFQSS4gQXQgdGhhdCBwb2ludCwgd2Ugd2lsbCBiZSBhYmxlIHRvXG4gICAgLy8gcmVtb3ZlIHRoaXMgbWV0aG9kIGVudGlyZWx5LiBJbiB0aGUgbWVhbnRpbWUsIHdlIGNhbiB1c2Ugb3ZlcnJpZGVQcm92aWRlciB0b1xuICAgIC8vIHRlc3QgYXBwcyB3aXRoIEl2eSB0aGF0IGRvbid0IGNhcmUgYWJvdXQgZWFnZXIgaW5zdGFudGlhdGlvbi4gVGhpcyBmaXhlcyA4NSVcbiAgICAvLyBvZiBjYXNlcyBpbiBvdXIgYmx1ZXByaW50LlxuICAgIHRoaXMub3ZlcnJpZGVQcm92aWRlcih0b2tlbiwgcHJvdmlkZXIgYXMgYW55KTtcbiAgfVxuXG4gIGNyZWF0ZUNvbXBvbmVudDxUPih0eXBlOiBUeXBlPFQ+KTogQ29tcG9uZW50Rml4dHVyZTxUPiB7XG4gICAgdGhpcy5faW5pdElmTmVlZGVkKCk7XG5cbiAgICBjb25zdCB0ZXN0Q29tcG9uZW50UmVuZGVyZXI6IFRlc3RDb21wb25lbnRSZW5kZXJlciA9IHRoaXMuZ2V0KFRlc3RDb21wb25lbnRSZW5kZXJlcik7XG4gICAgY29uc3Qgcm9vdEVsSWQgPSBgcm9vdCR7X25leHRSb290RWxlbWVudElkKyt9YDtcbiAgICB0ZXN0Q29tcG9uZW50UmVuZGVyZXIuaW5zZXJ0Um9vdEVsZW1lbnQocm9vdEVsSWQpO1xuXG4gICAgY29uc3QgY29tcG9uZW50RGVmID0gKHR5cGUgYXMgYW55KS5uZ0NvbXBvbmVudERlZjtcblxuICAgIGlmICghY29tcG9uZW50RGVmKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgYEl0IGxvb2tzIGxpa2UgJyR7c3RyaW5naWZ5KHR5cGUpfScgaGFzIG5vdCBiZWVuIElWWSBjb21waWxlZCAtIGl0IGhhcyBubyAnbmdDb21wb25lbnREZWYnIGZpZWxkYCk7XG4gICAgfVxuXG4gICAgY29uc3Qgbm9OZ1pvbmU6IGJvb2xlYW4gPSB0aGlzLmdldChDb21wb25lbnRGaXh0dXJlTm9OZ1pvbmUsIGZhbHNlKTtcbiAgICBjb25zdCBhdXRvRGV0ZWN0OiBib29sZWFuID0gdGhpcy5nZXQoQ29tcG9uZW50Rml4dHVyZUF1dG9EZXRlY3QsIGZhbHNlKTtcbiAgICBjb25zdCBuZ1pvbmU6IE5nWm9uZSA9IG5vTmdab25lID8gbnVsbCA6IHRoaXMuZ2V0KE5nWm9uZSwgbnVsbCk7XG4gICAgY29uc3QgY29tcG9uZW50RmFjdG9yeSA9IG5ldyBDb21wb25lbnRGYWN0b3J5KGNvbXBvbmVudERlZik7XG4gICAgY29uc3QgaW5pdENvbXBvbmVudCA9ICgpID0+IHtcbiAgICAgIGNvbnN0IGNvbXBvbmVudFJlZiA9XG4gICAgICAgICAgY29tcG9uZW50RmFjdG9yeS5jcmVhdGUoSW5qZWN0b3IuTlVMTCwgW10sIGAjJHtyb290RWxJZH1gLCB0aGlzLl9tb2R1bGVSZWYpO1xuICAgICAgcmV0dXJuIG5ldyBDb21wb25lbnRGaXh0dXJlPGFueT4oY29tcG9uZW50UmVmLCBuZ1pvbmUsIGF1dG9EZXRlY3QpO1xuICAgIH07XG4gICAgY29uc3QgZml4dHVyZSA9IG5nWm9uZSA/IG5nWm9uZS5ydW4oaW5pdENvbXBvbmVudCkgOiBpbml0Q29tcG9uZW50KCk7XG4gICAgdGhpcy5fYWN0aXZlRml4dHVyZXMucHVzaChmaXh0dXJlKTtcbiAgICByZXR1cm4gZml4dHVyZTtcbiAgfVxuXG4gIC8vIGludGVybmFsIG1ldGhvZHNcblxuICBwcml2YXRlIF9pbml0SWZOZWVkZWQoKTogdm9pZCB7XG4gICAgdGhpcy5fY2hlY2tHbG9iYWxDb21waWxhdGlvbkZpbmlzaGVkKCk7XG4gICAgaWYgKHRoaXMuX2luc3RhbnRpYXRlZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuX3Jlc29sdmVycyA9IHRoaXMuX2dldFJlc29sdmVycygpO1xuICAgIHRoaXMuX3Rlc3RNb2R1bGVUeXBlID0gdGhpcy5fY3JlYXRlVGVzdE1vZHVsZSgpO1xuICAgIHRoaXMuX2NvbXBpbGVOZ01vZHVsZSh0aGlzLl90ZXN0TW9kdWxlVHlwZSk7XG5cbiAgICBjb25zdCBwYXJlbnRJbmplY3RvciA9IHRoaXMucGxhdGZvcm0uaW5qZWN0b3I7XG4gICAgdGhpcy5fbW9kdWxlUmVmID0gbmV3IE5nTW9kdWxlUmVmKHRoaXMuX3Rlc3RNb2R1bGVUeXBlLCBwYXJlbnRJbmplY3Rvcik7XG5cbiAgICAvLyBBcHBsaWNhdGlvbkluaXRTdGF0dXMucnVuSW5pdGlhbGl6ZXJzKCkgaXMgbWFya2VkIEBpbnRlcm5hbFxuICAgIC8vIHRvIGNvcmUuIENhc3QgaXQgdG8gYW55IGJlZm9yZSBhY2Nlc3NpbmcgaXQuXG4gICAgKHRoaXMuX21vZHVsZVJlZi5pbmplY3Rvci5nZXQoQXBwbGljYXRpb25Jbml0U3RhdHVzKSBhcyBhbnkpLnJ1bkluaXRpYWxpemVycygpO1xuICAgIHRoaXMuX2luc3RhbnRpYXRlZCA9IHRydWU7XG4gIH1cblxuICBwcml2YXRlIF9zdG9yZU5nRGVmKHByb3A6IHN0cmluZywgdHlwZTogVHlwZTxhbnk+KSB7XG4gICAgaWYgKCF0aGlzLl9pbml0aWFsTmdEZWZzLmhhcyh0eXBlKSkge1xuICAgICAgY29uc3QgY3VycmVudERlZiA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IodHlwZSwgcHJvcCk7XG4gICAgICB0aGlzLl9pbml0aWFsTmdEZWZzLnNldCh0eXBlLCBbcHJvcCwgY3VycmVudERlZl0pO1xuICAgIH1cbiAgfVxuXG4gIC8vIGdldCBvdmVycmlkZXMgZm9yIGEgc3BlY2lmaWMgcHJvdmlkZXIgKGlmIGFueSlcbiAgcHJpdmF0ZSBfZ2V0UHJvdmlkZXJPdmVycmlkZXMocHJvdmlkZXI6IGFueSkge1xuICAgIGNvbnN0IHRva2VuID0gcHJvdmlkZXIgJiYgdHlwZW9mIHByb3ZpZGVyID09PSAnb2JqZWN0JyAmJiBwcm92aWRlci5oYXNPd25Qcm9wZXJ0eSgncHJvdmlkZScpID9cbiAgICAgICAgcHJvdmlkZXIucHJvdmlkZSA6XG4gICAgICAgIHByb3ZpZGVyO1xuICAgIHJldHVybiB0aGlzLl9wcm92aWRlck92ZXJyaWRlc0J5VG9rZW4uZ2V0KHRva2VuKSB8fCBbXTtcbiAgfVxuXG4gIC8vIGNyZWF0ZXMgcmVzb2x2ZXJzIHRha2luZyBvdmVycmlkZXMgaW50byBhY2NvdW50XG4gIHByaXZhdGUgX2dldFJlc29sdmVycygpIHtcbiAgICBjb25zdCBtb2R1bGUgPSBuZXcgTmdNb2R1bGVSZXNvbHZlcigpO1xuICAgIG1vZHVsZS5zZXRPdmVycmlkZXModGhpcy5fbW9kdWxlT3ZlcnJpZGVzKTtcblxuICAgIGNvbnN0IGNvbXBvbmVudCA9IG5ldyBDb21wb25lbnRSZXNvbHZlcigpO1xuICAgIGNvbXBvbmVudC5zZXRPdmVycmlkZXModGhpcy5fY29tcG9uZW50T3ZlcnJpZGVzKTtcblxuICAgIGNvbnN0IGRpcmVjdGl2ZSA9IG5ldyBEaXJlY3RpdmVSZXNvbHZlcigpO1xuICAgIGRpcmVjdGl2ZS5zZXRPdmVycmlkZXModGhpcy5fZGlyZWN0aXZlT3ZlcnJpZGVzKTtcblxuICAgIGNvbnN0IHBpcGUgPSBuZXcgUGlwZVJlc29sdmVyKCk7XG4gICAgcGlwZS5zZXRPdmVycmlkZXModGhpcy5fcGlwZU92ZXJyaWRlcyk7XG5cbiAgICByZXR1cm4ge21vZHVsZSwgY29tcG9uZW50LCBkaXJlY3RpdmUsIHBpcGV9O1xuICB9XG5cbiAgcHJpdmF0ZSBfYXNzZXJ0Tm90SW5zdGFudGlhdGVkKG1ldGhvZE5hbWU6IHN0cmluZywgbWV0aG9kRGVzY3JpcHRpb246IHN0cmluZykge1xuICAgIGlmICh0aGlzLl9pbnN0YW50aWF0ZWQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICBgQ2Fubm90ICR7bWV0aG9kRGVzY3JpcHRpb259IHdoZW4gdGhlIHRlc3QgbW9kdWxlIGhhcyBhbHJlYWR5IGJlZW4gaW5zdGFudGlhdGVkLiBgICtcbiAgICAgICAgICBgTWFrZSBzdXJlIHlvdSBhcmUgbm90IHVzaW5nIFxcYGluamVjdFxcYCBiZWZvcmUgXFxgJHttZXRob2ROYW1lfVxcYC5gKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIF9jcmVhdGVUZXN0TW9kdWxlKCk6IE5nTW9kdWxlVHlwZSB7XG4gICAgY29uc3Qgcm9vdFByb3ZpZGVyT3ZlcnJpZGVzID0gdGhpcy5fcm9vdFByb3ZpZGVyT3ZlcnJpZGVzO1xuXG4gICAgQE5nTW9kdWxlKHtcbiAgICAgIHByb3ZpZGVyczogWy4uLnJvb3RQcm92aWRlck92ZXJyaWRlc10sXG4gICAgICBqaXQ6IHRydWUsXG4gICAgfSlcbiAgICBjbGFzcyBSb290U2NvcGVNb2R1bGUge1xuICAgIH1cblxuICAgIGNvbnN0IG5nWm9uZSA9IG5ldyBOZ1pvbmUoe2VuYWJsZUxvbmdTdGFja1RyYWNlOiB0cnVlfSk7XG4gICAgY29uc3QgcHJvdmlkZXJzID0gW1xuICAgICAge3Byb3ZpZGU6IE5nWm9uZSwgdXNlVmFsdWU6IG5nWm9uZX0sXG4gICAgICB7cHJvdmlkZTogQ29tcGlsZXIsIHVzZUZhY3Rvcnk6ICgpID0+IG5ldyBSM1Rlc3RDb21waWxlcih0aGlzKX0sXG4gICAgICB7cHJvdmlkZTogRXJyb3JIYW5kbGVyLCB1c2VDbGFzczogUjNUZXN0RXJyb3JIYW5kbGVyfSxcbiAgICAgIC4uLnRoaXMuX3Byb3ZpZGVycyxcbiAgICAgIC4uLnRoaXMuX3Byb3ZpZGVyT3ZlcnJpZGVzLFxuICAgIF07XG5cbiAgICBjb25zdCBkZWNsYXJhdGlvbnMgPSB0aGlzLl9kZWNsYXJhdGlvbnM7XG4gICAgY29uc3QgaW1wb3J0cyA9IFtSb290U2NvcGVNb2R1bGUsIHRoaXMubmdNb2R1bGUsIHRoaXMuX2ltcG9ydHNdO1xuICAgIGNvbnN0IHNjaGVtYXMgPSB0aGlzLl9zY2hlbWFzO1xuXG4gICAgQE5nTW9kdWxlKHtwcm92aWRlcnMsIGRlY2xhcmF0aW9ucywgaW1wb3J0cywgc2NoZW1hcywgaml0OiB0cnVlfSlcbiAgICBjbGFzcyBEeW5hbWljVGVzdE1vZHVsZSB7XG4gICAgfVxuXG4gICAgcmV0dXJuIER5bmFtaWNUZXN0TW9kdWxlIGFzIE5nTW9kdWxlVHlwZTtcbiAgfVxuXG4gIGdldCBjb21waWxlckluamVjdG9yKCk6IEluamVjdG9yIHtcbiAgICBpZiAodGhpcy5fY29tcGlsZXJJbmplY3RvciAhPT0gbnVsbCkge1xuICAgICAgcmV0dXJuIHRoaXMuX2NvbXBpbGVySW5qZWN0b3I7XG4gICAgfVxuXG4gICAgY29uc3QgcHJvdmlkZXJzOiBTdGF0aWNQcm92aWRlcltdID0gW107XG4gICAgY29uc3QgY29tcGlsZXJPcHRpb25zID0gdGhpcy5wbGF0Zm9ybS5pbmplY3Rvci5nZXQoQ09NUElMRVJfT1BUSU9OUyk7XG4gICAgY29tcGlsZXJPcHRpb25zLmZvckVhY2gob3B0cyA9PiB7XG4gICAgICBpZiAob3B0cy5wcm92aWRlcnMpIHtcbiAgICAgICAgcHJvdmlkZXJzLnB1c2gob3B0cy5wcm92aWRlcnMpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHByb3ZpZGVycy5wdXNoKC4uLnRoaXMuX2NvbXBpbGVyUHJvdmlkZXJzKTtcblxuICAgIC8vIFRPRE8ob2NvbWJlKTogbWFrZSB0aGlzIHdvcmsgd2l0aCBhbiBJbmplY3RvciBkaXJlY3RseSBpbnN0ZWFkIG9mIGNyZWF0aW5nIGEgbW9kdWxlIGZvciBpdFxuICAgIEBOZ01vZHVsZSh7cHJvdmlkZXJzfSlcbiAgICBjbGFzcyBDb21waWxlck1vZHVsZSB7XG4gICAgfVxuXG4gICAgY29uc3QgQ29tcGlsZXJNb2R1bGVGYWN0b3J5ID0gbmV3IFIzTmdNb2R1bGVGYWN0b3J5KENvbXBpbGVyTW9kdWxlKTtcbiAgICB0aGlzLl9jb21waWxlckluamVjdG9yID0gQ29tcGlsZXJNb2R1bGVGYWN0b3J5LmNyZWF0ZSh0aGlzLnBsYXRmb3JtLmluamVjdG9yKS5pbmplY3RvcjtcbiAgICByZXR1cm4gdGhpcy5fY29tcGlsZXJJbmplY3RvcjtcbiAgfVxuXG4gIC8qKlxuICAgKiBDbGVhcnMgY3VycmVudCBjb21wb25lbnRzIHJlc29sdXRpb24gcXVldWUsIGJ1dCBzdG9yZXMgdGhlIHN0YXRlIG9mIHRoZSBxdWV1ZSwgc28gd2UgY2FuXG4gICAqIHJlc3RvcmUgaXQgbGF0ZXIuIENsZWFyaW5nIHRoZSBxdWV1ZSBpcyByZXF1aXJlZCBiZWZvcmUgd2UgdHJ5IHRvIGNvbXBpbGUgY29tcG9uZW50cyAodmlhXG4gICAqIGBUZXN0QmVkLmNvbXBpbGVDb21wb25lbnRzYCksIHNvIHRoYXQgY29tcG9uZW50IGRlZnMgYXJlIGluIHN5bmMgd2l0aCB0aGUgcmVzb2x1dGlvbiBxdWV1ZS5cbiAgICovXG4gIHByaXZhdGUgX2NsZWFyQ29tcG9uZW50UmVzb2x1dGlvblF1ZXVlKCkge1xuICAgIGlmICh0aGlzLl9vcmlnaW5hbENvbXBvbmVudFJlc29sdXRpb25RdWV1ZSA9PT0gbnVsbCkge1xuICAgICAgdGhpcy5fb3JpZ2luYWxDb21wb25lbnRSZXNvbHV0aW9uUXVldWUgPSBuZXcgTWFwKCk7XG4gICAgfVxuICAgIGNsZWFyUmVzb2x1dGlvbk9mQ29tcG9uZW50UmVzb3VyY2VzUXVldWUoKS5mb3JFYWNoKFxuICAgICAgICAodmFsdWUsIGtleSkgPT4gdGhpcy5fb3JpZ2luYWxDb21wb25lbnRSZXNvbHV0aW9uUXVldWUgIS5zZXQoa2V5LCB2YWx1ZSkpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlc3RvcmVzIGNvbXBvbmVudCByZXNvbHV0aW9uIHF1ZXVlIHRvIHRoZSBwcmV2aW91c2x5IHNhdmVkIHN0YXRlLiBUaGlzIG9wZXJhdGlvbiBpcyBwZXJmb3JtZWRcbiAgICogYXMgYSBwYXJ0IG9mIHJlc3RvcmluZyB0aGUgc3RhdGUgYWZ0ZXIgY29tcGxldGlvbiBvZiB0aGUgY3VycmVudCBzZXQgb2YgdGVzdHMgKHRoYXQgbWlnaHRcbiAgICogcG90ZW50aWFsbHkgbXV0YXRlIHRoZSBzdGF0ZSkuXG4gICAqL1xuICBwcml2YXRlIF9yZXN0b3JlQ29tcG9uZW50UmVzb2x1dGlvblF1ZXVlKCkge1xuICAgIGlmICh0aGlzLl9vcmlnaW5hbENvbXBvbmVudFJlc29sdXRpb25RdWV1ZSAhPT0gbnVsbCkge1xuICAgICAgcmVzdG9yZUNvbXBvbmVudFJlc29sdXRpb25RdWV1ZSh0aGlzLl9vcmlnaW5hbENvbXBvbmVudFJlc29sdXRpb25RdWV1ZSk7XG4gICAgICB0aGlzLl9vcmlnaW5hbENvbXBvbmVudFJlc29sdXRpb25RdWV1ZSA9IG51bGw7XG4gICAgfVxuICB9XG5cbiAgLy8gVE9ETyhGVy0xMTc5KTogZGVmaW5lIGJldHRlciB0eXBlcyBmb3IgYWxsIFByb3ZpZGVyLXJlbGF0ZWQgb3BlcmF0aW9ucywgYXZvaWQgdXNpbmcgYGFueWAuXG4gIHByaXZhdGUgX2dldFByb3ZpZGVyc092ZXJyaWRlcyhwcm92aWRlcnM6IGFueSk6IGFueVtdIHtcbiAgICBpZiAoIXByb3ZpZGVycyB8fCAhcHJvdmlkZXJzLmxlbmd0aCkgcmV0dXJuIFtdO1xuICAgIC8vIFRoZXJlIGFyZSB0d28gZmxhdHRlbmluZyBvcGVyYXRpb25zIGhlcmUuIFRoZSBpbm5lciBmbGF0dGVuKCkgb3BlcmF0ZXMgb24gdGhlIG1ldGFkYXRhJ3NcbiAgICAvLyBwcm92aWRlcnMgYW5kIGFwcGxpZXMgYSBtYXBwaW5nIGZ1bmN0aW9uIHdoaWNoIHJldHJpZXZlcyBvdmVycmlkZXMgZm9yIGVhY2ggaW5jb21pbmdcbiAgICAvLyBwcm92aWRlci4gVGhlIG91dGVyIGZsYXR0ZW4oKSB0aGVuIGZsYXR0ZW5zIHRoZSBwcm9kdWNlZCBvdmVycmlkZXMgYXJyYXkuIElmIHRoaXMgaXMgbm90XG4gICAgLy8gZG9uZSwgdGhlIGFycmF5IGNhbiBjb250YWluIG90aGVyIGVtcHR5IGFycmF5cyAoZS5nLiBgW1tdLCBbXV1gKSB3aGljaCBsZWFrIGludG8gdGhlXG4gICAgLy8gcHJvdmlkZXJzIGFycmF5IGFuZCBjb250YW1pbmF0ZSBhbnkgZXJyb3IgbWVzc2FnZXMgdGhhdCBtaWdodCBiZSBnZW5lcmF0ZWQuXG4gICAgcmV0dXJuIGZsYXR0ZW4oZmxhdHRlbihwcm92aWRlcnMsIChwcm92aWRlcjogYW55KSA9PiB0aGlzLl9nZXRQcm92aWRlck92ZXJyaWRlcyhwcm92aWRlcikpKTtcbiAgfVxuXG4gIHByaXZhdGUgX2hhc1Byb3ZpZGVyT3ZlcnJpZGVzKHByb3ZpZGVyczogYW55KSB7XG4gICAgcmV0dXJuIHRoaXMuX2dldFByb3ZpZGVyc092ZXJyaWRlcyhwcm92aWRlcnMpLmxlbmd0aCA+IDA7XG4gIH1cblxuICBwcml2YXRlIF9oYXNUeXBlT3ZlcnJpZGVzKHR5cGU6IFR5cGU8YW55Piwgb3ZlcnJpZGVzOiBbVHlwZTxhbnk+LCBNZXRhZGF0YU92ZXJyaWRlPGFueT5dW10pIHtcbiAgICByZXR1cm4gb3ZlcnJpZGVzLnNvbWUoKG92ZXJyaWRlOiBbVHlwZTxhbnk+LCBNZXRhZGF0YU92ZXJyaWRlPGFueT5dKSA9PiBvdmVycmlkZVswXSA9PT0gdHlwZSk7XG4gIH1cblxuICBwcml2YXRlIF9oYXNUZW1wbGF0ZU92ZXJyaWRlcyh0eXBlOiBUeXBlPGFueT4pIHsgcmV0dXJuIHRoaXMuX3RlbXBsYXRlT3ZlcnJpZGVzLmhhcyh0eXBlKTsgfVxuXG4gIHByaXZhdGUgX2dldE1ldGFXaXRoT3ZlcnJpZGVzKG1ldGE6IENvbXBvbmVudHxEaXJlY3RpdmV8TmdNb2R1bGUsIHR5cGU/OiBUeXBlPGFueT4pIHtcbiAgICBjb25zdCBvdmVycmlkZXM6IHtwcm92aWRlcnM/OiBhbnlbXSwgdGVtcGxhdGU/OiBzdHJpbmd9ID0ge307XG4gICAgaWYgKG1ldGEucHJvdmlkZXJzICYmIG1ldGEucHJvdmlkZXJzLmxlbmd0aCkge1xuICAgICAgY29uc3QgcHJvdmlkZXJPdmVycmlkZXMgPSB0aGlzLl9nZXRQcm92aWRlcnNPdmVycmlkZXMobWV0YS5wcm92aWRlcnMpO1xuICAgICAgaWYgKHByb3ZpZGVyT3ZlcnJpZGVzLmxlbmd0aCkge1xuICAgICAgICBvdmVycmlkZXMucHJvdmlkZXJzID0gWy4uLm1ldGEucHJvdmlkZXJzLCAuLi5wcm92aWRlck92ZXJyaWRlc107XG4gICAgICB9XG4gICAgfVxuICAgIGNvbnN0IGhhc1RlbXBsYXRlT3ZlcnJpZGUgPSAhIXR5cGUgJiYgdGhpcy5fdGVtcGxhdGVPdmVycmlkZXMuaGFzKHR5cGUpO1xuICAgIGlmIChoYXNUZW1wbGF0ZU92ZXJyaWRlKSB7XG4gICAgICBvdmVycmlkZXMudGVtcGxhdGUgPSB0aGlzLl90ZW1wbGF0ZU92ZXJyaWRlcy5nZXQodHlwZSAhKTtcbiAgICB9XG4gICAgcmV0dXJuIE9iamVjdC5rZXlzKG92ZXJyaWRlcykubGVuZ3RoID8gey4uLm1ldGEsIC4uLm92ZXJyaWRlc30gOiBtZXRhO1xuICB9XG5cbiAgcHJpdmF0ZSBfcGF0Y2hEZWZXaXRoUHJvdmlkZXJPdmVycmlkZXMoZGVjbGFyYXRpb246IFR5cGU8YW55PiwgZmllbGQ6IHN0cmluZykge1xuICAgIGNvbnN0IGRlZiA9IChkZWNsYXJhdGlvbiBhcyBhbnkpW2ZpZWxkXTtcbiAgICBpZiAoZGVmICYmIGRlZi5wcm92aWRlcnNSZXNvbHZlcikge1xuICAgICAgdGhpcy5fc3RvcmVOZ0RlZihmaWVsZCwgZGVjbGFyYXRpb24pO1xuICAgICAgY29uc3QgcmVzb2x2ZXIgPSBkZWYucHJvdmlkZXJzUmVzb2x2ZXI7XG4gICAgICBjb25zdCBwcm9jZXNzUHJvdmlkZXJzRm4gPSAocHJvdmlkZXJzOiBhbnlbXSkgPT4ge1xuICAgICAgICBjb25zdCBvdmVycmlkZXMgPSB0aGlzLl9nZXRQcm92aWRlcnNPdmVycmlkZXMocHJvdmlkZXJzKTtcbiAgICAgICAgcmV0dXJuIFsuLi5wcm92aWRlcnMsIC4uLm92ZXJyaWRlc107XG4gICAgICB9O1xuICAgICAgZGVmLnByb3ZpZGVyc1Jlc29sdmVyID0gKG5nRGVmOiBEaXJlY3RpdmVEZWY8YW55PikgPT4gcmVzb2x2ZXIobmdEZWYsIHByb2Nlc3NQcm92aWRlcnNGbik7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgX2dldE1vZHVsZVJlc29sdmVyKCkgeyByZXR1cm4gdGhpcy5fcmVzb2x2ZXJzLm1vZHVsZTsgfVxuXG4gIC8qKlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIF9jb21waWxlTmdNb2R1bGUobW9kdWxlVHlwZTogTmdNb2R1bGVUeXBlKTogdm9pZCB7XG4gICAgY29uc3QgbmdNb2R1bGUgPSB0aGlzLl9yZXNvbHZlcnMubW9kdWxlLnJlc29sdmUobW9kdWxlVHlwZSk7XG5cbiAgICBpZiAobmdNb2R1bGUgPT09IG51bGwpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgJHtzdHJpbmdpZnkobW9kdWxlVHlwZSl9IGhhcyBubyBATmdNb2R1bGUgYW5ub3RhdGlvbmApO1xuICAgIH1cblxuICAgIHRoaXMuX3N0b3JlTmdEZWYoTkdfTU9EVUxFX0RFRiwgbW9kdWxlVHlwZSk7XG4gICAgdGhpcy5fc3RvcmVOZ0RlZihOR19JTkpFQ1RPUl9ERUYsIG1vZHVsZVR5cGUpO1xuICAgIGNvbnN0IG1ldGFkYXRhID0gdGhpcy5fZ2V0TWV0YVdpdGhPdmVycmlkZXMobmdNb2R1bGUpO1xuICAgIGNvbXBpbGVOZ01vZHVsZURlZnMobW9kdWxlVHlwZSwgbWV0YWRhdGEpO1xuXG4gICAgY29uc3QgZGVjbGFyYXRpb25zOiBUeXBlPGFueT5bXSA9XG4gICAgICAgIGZsYXR0ZW4obmdNb2R1bGUuZGVjbGFyYXRpb25zIHx8IEVNUFRZX0FSUkFZLCByZXNvbHZlRm9yd2FyZFJlZik7XG4gICAgY29uc3QgZGVjbGFyZWRDb21wb25lbnRzOiBUeXBlPGFueT5bXSA9IFtdO1xuXG4gICAgLy8gQ29tcGlsZSB0aGUgY29tcG9uZW50cywgZGlyZWN0aXZlcyBhbmQgcGlwZXMgZGVjbGFyZWQgYnkgdGhpcyBtb2R1bGVcbiAgICBkZWNsYXJhdGlvbnMuZm9yRWFjaChkZWNsYXJhdGlvbiA9PiB7XG4gICAgICBjb25zdCBjb21wb25lbnQgPSB0aGlzLl9yZXNvbHZlcnMuY29tcG9uZW50LnJlc29sdmUoZGVjbGFyYXRpb24pO1xuICAgICAgaWYgKGNvbXBvbmVudCkge1xuICAgICAgICBpZiAoIWRlY2xhcmF0aW9uLmhhc093blByb3BlcnR5KE5HX0NPTVBPTkVOVF9ERUYpIHx8XG4gICAgICAgICAgICB0aGlzLl9oYXNUeXBlT3ZlcnJpZGVzKGRlY2xhcmF0aW9uLCB0aGlzLl9jb21wb25lbnRPdmVycmlkZXMpIHx8XG4gICAgICAgICAgICB0aGlzLl9oYXNUZW1wbGF0ZU92ZXJyaWRlcyhkZWNsYXJhdGlvbikpIHtcbiAgICAgICAgICB0aGlzLl9zdG9yZU5nRGVmKE5HX0NPTVBPTkVOVF9ERUYsIGRlY2xhcmF0aW9uKTtcbiAgICAgICAgICBjb25zdCBtZXRhZGF0YSA9IHRoaXMuX2dldE1ldGFXaXRoT3ZlcnJpZGVzKGNvbXBvbmVudCwgZGVjbGFyYXRpb24pO1xuICAgICAgICAgIGNvbXBpbGVDb21wb25lbnQoZGVjbGFyYXRpb24sIG1ldGFkYXRhKTtcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLl9oYXNQcm92aWRlck92ZXJyaWRlcyhjb21wb25lbnQucHJvdmlkZXJzKSkge1xuICAgICAgICAgIHRoaXMuX3BhdGNoRGVmV2l0aFByb3ZpZGVyT3ZlcnJpZGVzKGRlY2xhcmF0aW9uLCBOR19DT01QT05FTlRfREVGKTtcbiAgICAgICAgfVxuICAgICAgICBkZWNsYXJlZENvbXBvbmVudHMucHVzaChkZWNsYXJhdGlvbik7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgY29uc3QgZGlyZWN0aXZlID0gdGhpcy5fcmVzb2x2ZXJzLmRpcmVjdGl2ZS5yZXNvbHZlKGRlY2xhcmF0aW9uKTtcbiAgICAgIGlmIChkaXJlY3RpdmUpIHtcbiAgICAgICAgaWYgKCFkZWNsYXJhdGlvbi5oYXNPd25Qcm9wZXJ0eShOR19ESVJFQ1RJVkVfREVGKSB8fFxuICAgICAgICAgICAgdGhpcy5faGFzVHlwZU92ZXJyaWRlcyhkZWNsYXJhdGlvbiwgdGhpcy5fZGlyZWN0aXZlT3ZlcnJpZGVzKSkge1xuICAgICAgICAgIHRoaXMuX3N0b3JlTmdEZWYoTkdfRElSRUNUSVZFX0RFRiwgZGVjbGFyYXRpb24pO1xuICAgICAgICAgIGNvbnN0IG1ldGFkYXRhID0gdGhpcy5fZ2V0TWV0YVdpdGhPdmVycmlkZXMoZGlyZWN0aXZlKTtcbiAgICAgICAgICBjb21waWxlRGlyZWN0aXZlKGRlY2xhcmF0aW9uLCBtZXRhZGF0YSk7XG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5faGFzUHJvdmlkZXJPdmVycmlkZXMoZGlyZWN0aXZlLnByb3ZpZGVycykpIHtcbiAgICAgICAgICB0aGlzLl9wYXRjaERlZldpdGhQcm92aWRlck92ZXJyaWRlcyhkZWNsYXJhdGlvbiwgTkdfRElSRUNUSVZFX0RFRik7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBwaXBlID0gdGhpcy5fcmVzb2x2ZXJzLnBpcGUucmVzb2x2ZShkZWNsYXJhdGlvbik7XG4gICAgICBpZiAocGlwZSkge1xuICAgICAgICBpZiAoIWRlY2xhcmF0aW9uLmhhc093blByb3BlcnR5KE5HX1BJUEVfREVGKSB8fFxuICAgICAgICAgICAgdGhpcy5faGFzVHlwZU92ZXJyaWRlcyhkZWNsYXJhdGlvbiwgdGhpcy5fcGlwZU92ZXJyaWRlcykpIHtcbiAgICAgICAgICB0aGlzLl9zdG9yZU5nRGVmKE5HX1BJUEVfREVGLCBkZWNsYXJhdGlvbik7XG4gICAgICAgICAgY29tcGlsZVBpcGUoZGVjbGFyYXRpb24sIHBpcGUpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIC8vIENvbXBpbGUgdHJhbnNpdGl2ZSBtb2R1bGVzLCBjb21wb25lbnRzLCBkaXJlY3RpdmVzIGFuZCBwaXBlc1xuICAgIGNvbnN0IGNhbGNUcmFuc2l0aXZlU2NvcGVzRm9yID0gKG1vZHVsZVR5cGU6IE5nTW9kdWxlVHlwZSkgPT4gdHJhbnNpdGl2ZVNjb3Blc0ZvcihcbiAgICAgICAgbW9kdWxlVHlwZSwgKG5nTW9kdWxlOiBOZ01vZHVsZVR5cGUpID0+IHRoaXMuX2NvbXBpbGVOZ01vZHVsZShuZ01vZHVsZSkpO1xuICAgIGNvbnN0IHRyYW5zaXRpdmVTY29wZSA9IGNhbGNUcmFuc2l0aXZlU2NvcGVzRm9yKG1vZHVsZVR5cGUpO1xuICAgIGRlY2xhcmVkQ29tcG9uZW50cy5mb3JFYWNoKGNtcCA9PiB7XG4gICAgICBjb25zdCBzY29wZSA9IHRoaXMuX3RlbXBsYXRlT3ZlcnJpZGVzLmhhcyhjbXApID9cbiAgICAgICAgICAvLyBpZiB3ZSBoYXZlIHRlbXBsYXRlIG92ZXJyaWRlIHZpYSBgVGVzdEJlZC5vdmVycmlkZVRlbXBsYXRlVXNpbmdUZXN0aW5nTW9kdWxlYCAtXG4gICAgICAgICAgLy8gZGVmaW5lIENvbXBvbmVudCBzY29wZSBhcyBUZXN0aW5nTW9kdWxlIHNjb3BlLCBpbnN0ZWFkIG9mIHRoZSBzY29wZSBvZiBOZ01vZHVsZVxuICAgICAgICAgIC8vIHdoZXJlIHRoaXMgQ29tcG9uZW50IHdhcyBkZWNsYXJlZFxuICAgICAgICAgIC8vIFRPRE86IFRoaXMgaXMgb25seSBhIHBhcnRpYWwgZml4LiBTaG91bGQgYmUgZml4ZWQgY29tcGxldGVseSB3aXRoIEZXLTExNzggcmVmYWN0b3IuXG4gICAgICAgICAgdHJhbnNpdGl2ZVNjb3Blc0Zvcih0aGlzLl90ZXN0TW9kdWxlVHlwZSkgOlxuICAgICAgICAgIHRyYW5zaXRpdmVTY29wZTtcbiAgICAgIHBhdGNoQ29tcG9uZW50RGVmV2l0aFNjb3BlKChjbXAgYXMgYW55KS5uZ0NvbXBvbmVudERlZiwgc2NvcGUpO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgX2dldENvbXBvbmVudEZhY3Rvcmllcyhtb2R1bGVUeXBlOiBOZ01vZHVsZVR5cGUpOiBDb21wb25lbnRGYWN0b3J5PGFueT5bXSB7XG4gICAgcmV0dXJuIG1heWJlVW53cmFwRm4obW9kdWxlVHlwZS5uZ01vZHVsZURlZi5kZWNsYXJhdGlvbnMpLnJlZHVjZSgoZmFjdG9yaWVzLCBkZWNsYXJhdGlvbikgPT4ge1xuICAgICAgY29uc3QgY29tcG9uZW50RGVmID0gKGRlY2xhcmF0aW9uIGFzIGFueSkubmdDb21wb25lbnREZWY7XG4gICAgICBjb21wb25lbnREZWYgJiYgZmFjdG9yaWVzLnB1c2gobmV3IENvbXBvbmVudEZhY3RvcnkoY29tcG9uZW50RGVmLCB0aGlzLl9tb2R1bGVSZWYpKTtcbiAgICAgIHJldHVybiBmYWN0b3JpZXM7XG4gICAgfSwgW10gYXMgQ29tcG9uZW50RmFjdG9yeTxhbnk+W10pO1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrIHdoZXRoZXIgdGhlIG1vZHVsZSBzY29waW5nIHF1ZXVlIHNob3VsZCBiZSBmbHVzaGVkLCBhbmQgZmx1c2ggaXQgaWYgbmVlZGVkLlxuICAgKlxuICAgKiBXaGVuIHRoZSBUZXN0QmVkIGlzIHJlc2V0LCBpdCBjbGVhcnMgdGhlIEpJVCBtb2R1bGUgY29tcGlsYXRpb24gcXVldWUsIGNhbmNlbGxpbmcgYW55XG4gICAqIGluLXByb2dyZXNzIG1vZHVsZSBjb21waWxhdGlvbi4gVGhpcyBjcmVhdGVzIGEgcG90ZW50aWFsIGhhemFyZCAtIHRoZSB2ZXJ5IGZpcnN0IHRpbWUgdGhlXG4gICAqIFRlc3RCZWQgaXMgaW5pdGlhbGl6ZWQgKG9yIGlmIGl0J3MgcmVzZXQgd2l0aG91dCBiZWluZyBpbml0aWFsaXplZCksIHRoZXJlIG1heSBiZSBwZW5kaW5nXG4gICAqIGNvbXBpbGF0aW9ucyBvZiBtb2R1bGVzIGRlY2xhcmVkIGluIGdsb2JhbCBzY29wZS4gVGhlc2UgY29tcGlsYXRpb25zIHNob3VsZCBiZSBmaW5pc2hlZC5cbiAgICpcbiAgICogVG8gZW5zdXJlIHRoYXQgZ2xvYmFsbHkgZGVjbGFyZWQgbW9kdWxlcyBoYXZlIHRoZWlyIGNvbXBvbmVudHMgc2NvcGVkIHByb3Blcmx5LCB0aGlzIGZ1bmN0aW9uXG4gICAqIGlzIGNhbGxlZCB3aGVuZXZlciBUZXN0QmVkIGlzIGluaXRpYWxpemVkIG9yIHJlc2V0LiBUaGUgX2ZpcnN0XyB0aW1lIHRoYXQgdGhpcyBoYXBwZW5zLCBwcmlvclxuICAgKiB0byBhbnkgb3RoZXIgb3BlcmF0aW9ucywgdGhlIHNjb3BpbmcgcXVldWUgaXMgZmx1c2hlZC5cbiAgICovXG4gIHByaXZhdGUgX2NoZWNrR2xvYmFsQ29tcGlsYXRpb25GaW5pc2hlZCgpOiB2b2lkIHtcbiAgICAvLyAhdGhpcy5faW5zdGFudGlhdGVkIHNob3VsZCBub3QgYmUgbmVjZXNzYXJ5LCBidXQgaXMgbGVmdCBpbiBhcyBhbiBhZGRpdGlvbmFsIGd1YXJkIHRoYXRcbiAgICAvLyBjb21waWxhdGlvbnMgcXVldWVkIGluIHRlc3RzIChhZnRlciBpbnN0YW50aWF0aW9uKSBhcmUgbmV2ZXIgZmx1c2hlZCBhY2NpZGVudGFsbHkuXG4gICAgaWYgKCF0aGlzLl9nbG9iYWxDb21waWxhdGlvbkNoZWNrZWQgJiYgIXRoaXMuX2luc3RhbnRpYXRlZCkge1xuICAgICAgZmx1c2hNb2R1bGVTY29waW5nUXVldWVBc011Y2hBc1Bvc3NpYmxlKCk7XG4gICAgfVxuICAgIHRoaXMuX2dsb2JhbENvbXBpbGF0aW9uQ2hlY2tlZCA9IHRydWU7XG4gIH1cbn1cblxubGV0IHRlc3RCZWQ6IFRlc3RCZWRSZW5kZXIzO1xuXG5leHBvcnQgZnVuY3Rpb24gX2dldFRlc3RCZWRSZW5kZXIzKCk6IFRlc3RCZWRSZW5kZXIzIHtcbiAgcmV0dXJuIHRlc3RCZWQgPSB0ZXN0QmVkIHx8IG5ldyBUZXN0QmVkUmVuZGVyMygpO1xufVxuXG5mdW5jdGlvbiBmbGF0dGVuPFQ+KHZhbHVlczogYW55W10sIG1hcEZuPzogKHZhbHVlOiBUKSA9PiBhbnkpOiBUW10ge1xuICBjb25zdCBvdXQ6IFRbXSA9IFtdO1xuICB2YWx1ZXMuZm9yRWFjaCh2YWx1ZSA9PiB7XG4gICAgaWYgKEFycmF5LmlzQXJyYXkodmFsdWUpKSB7XG4gICAgICBvdXQucHVzaCguLi5mbGF0dGVuPFQ+KHZhbHVlLCBtYXBGbikpO1xuICAgIH0gZWxzZSB7XG4gICAgICBvdXQucHVzaChtYXBGbiA/IG1hcEZuKHZhbHVlKSA6IHZhbHVlKTtcbiAgICB9XG4gIH0pO1xuICByZXR1cm4gb3V0O1xufVxuXG5mdW5jdGlvbiBpc05nTW9kdWxlPFQ+KHZhbHVlOiBUeXBlPFQ+KTogdmFsdWUgaXMgVHlwZTxUPiZ7bmdNb2R1bGVEZWY6IE5nTW9kdWxlRGVmPFQ+fSB7XG4gIHJldHVybiAodmFsdWUgYXN7bmdNb2R1bGVEZWY/OiBOZ01vZHVsZURlZjxUPn0pLm5nTW9kdWxlRGVmICE9PSB1bmRlZmluZWQ7XG59XG5cbmNsYXNzIFIzVGVzdENvbXBpbGVyIGltcGxlbWVudHMgQ29tcGlsZXIge1xuICBjb25zdHJ1Y3Rvcihwcml2YXRlIHRlc3RCZWQ6IFRlc3RCZWRSZW5kZXIzKSB7fVxuXG4gIGNvbXBpbGVNb2R1bGVTeW5jPFQ+KG1vZHVsZVR5cGU6IFR5cGU8VD4pOiBOZ01vZHVsZUZhY3Rvcnk8VD4ge1xuICAgIHRoaXMudGVzdEJlZC5fY29tcGlsZU5nTW9kdWxlKG1vZHVsZVR5cGUgYXMgTmdNb2R1bGVUeXBlPFQ+KTtcbiAgICByZXR1cm4gbmV3IFIzTmdNb2R1bGVGYWN0b3J5KG1vZHVsZVR5cGUpO1xuICB9XG5cbiAgY29tcGlsZU1vZHVsZUFzeW5jPFQ+KG1vZHVsZVR5cGU6IFR5cGU8VD4pOiBQcm9taXNlPE5nTW9kdWxlRmFjdG9yeTxUPj4ge1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodGhpcy5jb21waWxlTW9kdWxlU3luYyhtb2R1bGVUeXBlKSk7XG4gIH1cblxuICBjb21waWxlTW9kdWxlQW5kQWxsQ29tcG9uZW50c1N5bmM8VD4obW9kdWxlVHlwZTogVHlwZTxUPik6IE1vZHVsZVdpdGhDb21wb25lbnRGYWN0b3JpZXM8VD4ge1xuICAgIGNvbnN0IG5nTW9kdWxlRmFjdG9yeSA9IHRoaXMuY29tcGlsZU1vZHVsZVN5bmMobW9kdWxlVHlwZSk7XG4gICAgY29uc3QgY29tcG9uZW50RmFjdG9yaWVzID0gdGhpcy50ZXN0QmVkLl9nZXRDb21wb25lbnRGYWN0b3JpZXMobW9kdWxlVHlwZSBhcyBOZ01vZHVsZVR5cGU8VD4pO1xuICAgIHJldHVybiBuZXcgTW9kdWxlV2l0aENvbXBvbmVudEZhY3RvcmllcyhuZ01vZHVsZUZhY3RvcnksIGNvbXBvbmVudEZhY3Rvcmllcyk7XG4gIH1cblxuICBjb21waWxlTW9kdWxlQW5kQWxsQ29tcG9uZW50c0FzeW5jPFQ+KG1vZHVsZVR5cGU6IFR5cGU8VD4pOlxuICAgICAgUHJvbWlzZTxNb2R1bGVXaXRoQ29tcG9uZW50RmFjdG9yaWVzPFQ+PiB7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh0aGlzLmNvbXBpbGVNb2R1bGVBbmRBbGxDb21wb25lbnRzU3luYyhtb2R1bGVUeXBlKSk7XG4gIH1cblxuICBjbGVhckNhY2hlKCk6IHZvaWQge31cblxuICBjbGVhckNhY2hlRm9yKHR5cGU6IFR5cGU8YW55Pik6IHZvaWQge31cblxuICBnZXRNb2R1bGVJZChtb2R1bGVUeXBlOiBUeXBlPGFueT4pOiBzdHJpbmd8dW5kZWZpbmVkIHtcbiAgICBjb25zdCBtZXRhID0gdGhpcy50ZXN0QmVkLl9nZXRNb2R1bGVSZXNvbHZlcigpLnJlc29sdmUobW9kdWxlVHlwZSk7XG4gICAgcmV0dXJuIG1ldGEgJiYgbWV0YS5pZCB8fCB1bmRlZmluZWQ7XG4gIH1cbn1cblxuLyoqIEVycm9yIGhhbmRsZXIgdXNlZCBmb3IgdGVzdHMuIFJldGhyb3dzIGVycm9ycyByYXRoZXIgdGhhbiBsb2dnaW5nIHRoZW0gb3V0LiAqL1xuY2xhc3MgUjNUZXN0RXJyb3JIYW5kbGVyIGV4dGVuZHMgRXJyb3JIYW5kbGVyIHtcbiAgaGFuZGxlRXJyb3IoZXJyb3I6IGFueSkgeyB0aHJvdyBlcnJvcjsgfVxufVxuXG4vKipcbiAqIFVud3JhcCBhIHZhbHVlIHdoaWNoIG1pZ2h0IGJlIGJlaGluZCBhIGNsb3N1cmUgKGZvciBmb3J3YXJkIGRlY2xhcmF0aW9uIHJlYXNvbnMpLlxuICovXG5mdW5jdGlvbiBtYXliZVVud3JhcEZuPFQ+KHZhbHVlOiBUIHwgKCgpID0+IFQpKTogVCB7XG4gIGlmICh2YWx1ZSBpbnN0YW5jZW9mIEZ1bmN0aW9uKSB7XG4gICAgcmV0dXJuIHZhbHVlKCk7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIHZhbHVlO1xuICB9XG59XG4iXX0=