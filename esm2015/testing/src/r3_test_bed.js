// The formatter and CI disagree on how this import statement should be formatted. Both try to keep
// it on one line, too, which has gotten very hard to read & manage. So disable the formatter for
// this statement only.
// clang-format off
import { ApplicationInitStatus, Compiler, Injector, ModuleWithComponentFactories, NgModule, NgZone, resolveForwardRef, ɵNG_COMPONENT_DEF as NG_COMPONENT_DEF, ɵNG_DIRECTIVE_DEF as NG_DIRECTIVE_DEF, ɵNG_INJECTOR_DEF as NG_INJECTOR_DEF, ɵNG_MODULE_DEF as NG_MODULE_DEF, ɵNG_PIPE_DEF as NG_PIPE_DEF, ɵNgModuleFactory as R3NgModuleFactory, ɵRender3ComponentFactory as ComponentFactory, ɵRender3NgModuleRef as NgModuleRef, ɵcompileComponent as compileComponent, ɵcompileDirective as compileDirective, ɵcompileNgModuleDefs as compileNgModuleDefs, ɵcompilePipe as compilePipe, ɵgetInjectableDef as getInjectableDef, ɵflushModuleScopingQueueAsMuchAsPossible as flushModuleScopingQueueAsMuchAsPossible, ɵpatchComponentDefWithScope as patchComponentDefWithScope, ɵresetCompiledComponents as resetCompiledComponents, ɵstringify as stringify, ɵtransitiveScopesFor as transitiveScopesFor, COMPILER_OPTIONS, } from '@angular/core';
// clang-format on
import { ResourceLoader } from '@angular/compiler';
import { clearResolutionOfComponentResourcesQueue, componentNeedsResolution, resolveComponentResources } from '../../src/metadata/resource_loading';
import { ComponentFixture } from './component_fixture';
import { ComponentResolver, DirectiveResolver, NgModuleResolver, PipeResolver } from './resolvers';
import { ComponentFixtureAutoDetect, ComponentFixtureNoNgZone, TestComponentRenderer } from './test_bed_common';
import * as i0 from "@angular/core";
/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
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
        // Map that keeps initial version of component/directive/pipe defs in case
        // we compile a Type again, thus overriding respective static fields. This is
        // required to make sure we restore defs to their initial states between test runs
        this._initiaNgDefs = new Map();
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
        throw new Error('Render3TestBed.deprecatedOverrideProvider is not implemented');
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
        this._activeFixtures.forEach((fixture) => {
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
        this._initiaNgDefs.forEach((value, type) => {
            Object.defineProperty(type, value[0], value[1]);
        });
        this._initiaNgDefs.clear();
        clearResolutionOfComponentResourcesQueue();
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
        /** @type {?} */
        const resolvers = this._getResolvers();
        /** @type {?} */
        const declarations = flatten(this._declarations || EMPTY_ARRAY, resolveForwardRef);
        /** @type {?} */
        const componentOverrides = [];
        /** @type {?} */
        let hasAsyncResources = false;
        // Compile the components declared by this module
        declarations.forEach(declaration => {
            /** @type {?} */
            const component = resolvers.component.resolve(declaration);
            if (component) {
                // We make a copy of the metadata to ensure that we don't mutate the original metadata
                /** @type {?} */
                const metadata = Object.assign({}, component);
                compileComponent(declaration, metadata);
                componentOverrides.push([declaration, metadata]);
                hasAsyncResources = hasAsyncResources || componentNeedsResolution(component);
            }
        });
        /** @type {?} */
        const overrideComponents = () => {
            componentOverrides.forEach((override) => {
                // Override the existing metadata, ensuring that the resolved resources
                // are only available until the next TestBed reset (when `resetTestingModule` is called)
                this.overrideComponent(override[0], { set: override[1] });
            });
        };
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
            return resolveComponentResources(url => {
                if (!resourceLoader) {
                    resourceLoader = this.compilerInjector.get(ResourceLoader);
                }
                return Promise.resolve(resourceLoader.get(url));
            })
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
        const params = tokens.map(t => this.get(t));
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
        throw new Error('No implemented in IVY');
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
        const initComponent = () => {
            /** @type {?} */
            const componentRef = componentFactory.create(Injector.NULL, [], `#${rootElId}`, this._moduleRef);
            return new ComponentFixture(componentRef, ngZone, autoDetect);
        };
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
        if (!this._initiaNgDefs.has(type)) {
            /** @type {?} */
            const currentDef = Object.getOwnPropertyDescriptor(type, prop);
            this._initiaNgDefs.set(type, [prop, currentDef]);
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
            { provide: Compiler, useFactory: () => new R3TestCompiler(this) },
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
        compilerOptions.forEach(opts => {
            if (opts.providers) {
                providers.push(opts.providers);
            }
        });
        providers.push(...this._compilerProviders);
        // TODO(ocombe): make this work with an Injector directly instead of creating a module for it
        class CompilerModule {
        }
        CompilerModule.decorators = [
            { type: NgModule, args: [{ providers },] },
        ];
        /** @nocollapse */ CompilerModule.ngModuleDef = i0.ɵdefineNgModule({ type: CompilerModule });
        /** @nocollapse */ CompilerModule.ngInjectorDef = i0.defineInjector({ factory: function CompilerModule_Factory(t) { return new (t || CompilerModule)(); }, providers: providers, imports: [] });
        /*@__PURE__*/ i0.ɵsetClassMetadata(CompilerModule, [{
                type: NgModule,
                args: [{ providers }]
            }], null, null);
        /** @type {?} */
        const CompilerModuleFactory = new R3NgModuleFactory(CompilerModule);
        this._compilerInjector = CompilerModuleFactory.create(this.platform.injector).injector;
        return this._compilerInjector;
    }
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
            // There are two flattening operations here. The inner flatten() operates on the metadata's
            // providers and applies a mapping function which retrieves overrides for each incoming
            // provider. The outer flatten() then flattens the produced overrides array. If this is not
            // done, the array can contain other empty arrays (e.g. `[[], []]`) which leak into the
            // providers array and contaminate any error messages that might be generated.
            /** @type {?} */
            const providerOverrides = flatten(flatten(meta.providers, (provider) => this._getProviderOverrides(provider)));
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
        const compiledComponents = [];
        // Compile the components, directives and pipes declared by this module
        declarations.forEach(declaration => {
            /** @type {?} */
            const component = this._resolvers.component.resolve(declaration);
            if (component) {
                this._storeNgDef(NG_COMPONENT_DEF, declaration);
                /** @type {?} */
                const metadata = this._getMetaWithOverrides(component, declaration);
                compileComponent(declaration, metadata);
                compiledComponents.push(declaration);
                return;
            }
            /** @type {?} */
            const directive = this._resolvers.directive.resolve(declaration);
            if (directive) {
                this._storeNgDef(NG_DIRECTIVE_DEF, declaration);
                /** @type {?} */
                const metadata = this._getMetaWithOverrides(directive);
                compileDirective(declaration, metadata);
                return;
            }
            /** @type {?} */
            const pipe = this._resolvers.pipe.resolve(declaration);
            if (pipe) {
                this._storeNgDef(NG_PIPE_DEF, declaration);
                compilePipe(declaration, pipe);
                return;
            }
        });
        // Compile transitive modules, components, directives and pipes
        /** @type {?} */
        const calcTransitiveScopesFor = (moduleType) => transitiveScopesFor(moduleType, (ngModule) => this._compileNgModule(ngModule));
        /** @type {?} */
        const transitiveScope = calcTransitiveScopesFor(moduleType);
        compiledComponents.forEach(cmp => {
            /** @type {?} */
            const scope = this._templateOverrides.has(cmp) ?
                // if we have template override via `TestBed.overrideTemplateUsingTestingModule` -
                // define Component scope as TestingModule scope, instead of the scope of NgModule
                // where this Component was declared
                calcTransitiveScopesFor(this._testModuleType) :
                transitiveScope;
            patchComponentDefWithScope(((/** @type {?} */ (cmp))).ngComponentDef, scope);
        });
    }
    /**
     * \@internal
     * @param {?} moduleType
     * @return {?}
     */
    _getComponentFactories(moduleType) {
        return moduleType.ngModuleDef.declarations.reduce((factories, declaration) => {
            /** @nocollapse @type {?} */
            const componentDef = ((/** @type {?} */ (declaration))).ngComponentDef;
            componentDef && factories.push(new ComponentFactory(componentDef, this._moduleRef));
            return factories;
        }, (/** @type {?} */ ([])));
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
    TestBedRender3.prototype._initiaNgDefs;
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
    values.forEach(value => {
        if (Array.isArray(value)) {
            out.push(...flatten(value, mapFn));
        }
        else {
            out.push(mapFn ? mapFn(value) : value);
        }
    });
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicjNfdGVzdF9iZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3Rlc3Rpbmcvc3JjL3IzX3Rlc3RfYmVkLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7QUFZQSxPQUFPLEVBQ0wscUJBQXFCLEVBQ3JCLFFBQVEsRUFHUixRQUFRLEVBQ1IsNEJBQTRCLEVBQzVCLFFBQVEsRUFFUixNQUFNLEVBTU4saUJBQWlCLEVBRWpCLGlCQUFpQixJQUFJLGdCQUFnQixFQUNyQyxpQkFBaUIsSUFBSSxnQkFBZ0IsRUFDckMsZ0JBQWdCLElBQUksZUFBZSxFQUNuQyxjQUFjLElBQUksYUFBYSxFQUMvQixZQUFZLElBQUksV0FBVyxFQUUzQixnQkFBZ0IsSUFBSSxpQkFBaUIsRUFFckMsd0JBQXdCLElBQUksZ0JBQWdCLEVBQzVDLG1CQUFtQixJQUFJLFdBQVcsRUFDbEMsaUJBQWlCLElBQUksZ0JBQWdCLEVBQ3JDLGlCQUFpQixJQUFJLGdCQUFnQixFQUNyQyxvQkFBb0IsSUFBSSxtQkFBbUIsRUFDM0MsWUFBWSxJQUFJLFdBQVcsRUFDM0IsaUJBQWlCLElBQUksZ0JBQWdCLEVBQ3JDLHdDQUF3QyxJQUFJLHVDQUF1QyxFQUNuRiwyQkFBMkIsSUFBSSwwQkFBMEIsRUFDekQsd0JBQXdCLElBQUksdUJBQXVCLEVBQ25ELFVBQVUsSUFBSSxTQUFTLEVBQ3ZCLG9CQUFvQixJQUFJLG1CQUFtQixFQUczQyxnQkFBZ0IsR0FDakIsTUFBTSxlQUFlLENBQUM7O0FBRXZCLE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUVqRCxPQUFPLEVBQUMsd0NBQXdDLEVBQUUsd0JBQXdCLEVBQUUseUJBQXlCLEVBQUMsTUFBTSxxQ0FBcUMsQ0FBQztBQUNsSixPQUFPLEVBQUMsZ0JBQWdCLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUVyRCxPQUFPLEVBQUMsaUJBQWlCLEVBQUUsaUJBQWlC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QUFDLE9BQU8sQ0FBQyxzQkFBc0IsQ0FBQyxtQkFBQSxVQUFVLEVBQW1CLENBQUM7UUFDN0YsT0FBTyxJQUFJLDRCQUE0QixDQUFDLGVBQWUsRUFBRSxrQkFBa0IsQ0FBQyxDQUFDO0lBQy9FLENBQUM7Ozs7OztJQUVELGtDQUFrQyxDQUFJLFVBQW1CO1FBRXZELE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsaUNBQWlDLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQztJQUM3RSxDQUFDOzs7O0lBRUQsVUFBVSxLQUFVLENBQUM7Ozs7O0lBRXJCLGFBQWEsQ0FBQyxJQUFlLElBQVMsQ0FBQzs7Ozs7SUFFdkMsV0FBVyxDQUFDLFVBQXFCOztjQUN6QixJQUFJLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxrQkFBa0IsRUFBRSxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUM7UUFDbEUsT0FBTyxJQUFJLElBQUksSUFBSSxDQUFDLEVBQUUsSUFBSSxTQUFTLENBQUM7SUFDdEMsQ0FBQztDQUNGOzs7Ozs7SUE5QmEsaUNBQStCIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG4vLyBUaGUgZm9ybWF0dGVyIGFuZCBDSSBkaXNhZ3JlZSBvbiBob3cgdGhpcyBpbXBvcnQgc3RhdGVtZW50IHNob3VsZCBiZSBmb3JtYXR0ZWQuIEJvdGggdHJ5IHRvIGtlZXBcbi8vIGl0IG9uIG9uZSBsaW5lLCB0b28sIHdoaWNoIGhhcyBnb3R0ZW4gdmVyeSBoYXJkIHRvIHJlYWQgJiBtYW5hZ2UuIFNvIGRpc2FibGUgdGhlIGZvcm1hdHRlciBmb3Jcbi8vIHRoaXMgc3RhdGVtZW50IG9ubHkuXG4vLyBjbGFuZy1mb3JtYXQgb2ZmXG5pbXBvcnQge1xuICBBcHBsaWNhdGlvbkluaXRTdGF0dXMsXG4gIENvbXBpbGVyLFxuICBDb21wb25lbnQsXG4gIERpcmVjdGl2ZSxcbiAgSW5qZWN0b3IsXG4gIE1vZHVsZVdpdGhDb21wb25lbnRGYWN0b3JpZXMsXG4gIE5nTW9kdWxlLFxuICBOZ01vZHVsZUZhY3RvcnksXG4gIE5nWm9uZSxcbiAgUGlwZSxcbiAgUGxhdGZvcm1SZWYsXG4gIFByb3ZpZGVyLFxuICBTY2hlbWFNZXRhZGF0YSxcbiAgVHlwZSxcbiAgcmVzb2x2ZUZvcndhcmRSZWYsXG4gIMm1SW5qZWN0YWJsZURlZiBhcyBJbmplY3RhYmxlRGVmLFxuICDJtU5HX0NPTVBPTkVOVF9ERUYgYXMgTkdfQ09NUE9ORU5UX0RFRixcbiAgybVOR19ESVJFQ1RJVkVfREVGIGFzIE5HX0RJUkVDVElWRV9ERUYsXG4gIMm1TkdfSU5KRUNUT1JfREVGIGFzIE5HX0lOSkVDVE9SX0RFRixcbiAgybVOR19NT0RVTEVfREVGIGFzIE5HX01PRFVMRV9ERUYsXG4gIMm1TkdfUElQRV9ERUYgYXMgTkdfUElQRV9ERUYsXG4gIMm1TmdNb2R1bGVEZWYgYXMgTmdNb2R1bGVEZWYsXG4gIMm1TmdNb2R1bGVGYWN0b3J5IGFzIFIzTmdNb2R1bGVGYWN0b3J5LFxuICDJtU5nTW9kdWxlVHlwZSBhcyBOZ01vZHVsZVR5cGUsXG4gIMm1UmVuZGVyM0NvbXBvbmVudEZhY3RvcnkgYXMgQ29tcG9uZW50RmFjdG9yeSxcbiAgybVSZW5kZXIzTmdNb2R1bGVSZWYgYXMgTmdNb2R1bGVSZWYsXG4gIMm1Y29tcGlsZUNvbXBvbmVudCBhcyBjb21waWxlQ29tcG9uZW50LFxuICDJtWNvbXBpbGVEaXJlY3RpdmUgYXMgY29tcGlsZURpcmVjdGl2ZSxcbiAgybVjb21waWxlTmdNb2R1bGVEZWZzIGFzIGNvbXBpbGVOZ01vZHVsZURlZnMsXG4gIMm1Y29tcGlsZVBpcGUgYXMgY29tcGlsZVBpcGUsXG4gIMm1Z2V0SW5qZWN0YWJsZURlZiBhcyBnZXRJbmplY3RhYmxlRGVmLFxuICDJtWZsdXNoTW9kdWxlU2NvcGluZ1F1ZXVlQXNNdWNoQXNQb3NzaWJsZSBhcyBmbHVzaE1vZHVsZVNjb3BpbmdRdWV1ZUFzTXVjaEFzUG9zc2libGUsXG4gIMm1cGF0Y2hDb21wb25lbnREZWZXaXRoU2NvcGUgYXMgcGF0Y2hDb21wb25lbnREZWZXaXRoU2NvcGUsXG4gIMm1cmVzZXRDb21waWxlZENvbXBvbmVudHMgYXMgcmVzZXRDb21waWxlZENvbXBvbmVudHMsXG4gIMm1c3RyaW5naWZ5IGFzIHN0cmluZ2lmeSxcbiAgybV0cmFuc2l0aXZlU2NvcGVzRm9yIGFzIHRyYW5zaXRpdmVTY29wZXNGb3IsXG4gIENvbXBpbGVyT3B0aW9ucyxcbiAgU3RhdGljUHJvdmlkZXIsXG4gIENPTVBJTEVSX09QVElPTlMsXG59IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuLy8gY2xhbmctZm9ybWF0IG9uXG5pbXBvcnQge1Jlc291cmNlTG9hZGVyfSBmcm9tICdAYW5ndWxhci9jb21waWxlcic7XG5cbmltcG9ydCB7Y2xlYXJSZXNvbHV0aW9uT2ZDb21wb25lbnRSZXNvdXJjZXNRdWV1ZSwgY29tcG9uZW50TmVlZHNSZXNvbHV0aW9uLCByZXNvbHZlQ29tcG9uZW50UmVzb3VyY2VzfSBmcm9tICcuLi8uLi9zcmMvbWV0YWRhdGEvcmVzb3VyY2VfbG9hZGluZyc7XG5pbXBvcnQge0NvbXBvbmVudEZpeHR1cmV9IGZyb20gJy4vY29tcG9uZW50X2ZpeHR1cmUnO1xuaW1wb3J0IHtNZXRhZGF0YU92ZXJyaWRlfSBmcm9tICcuL21ldGFkYXRhX292ZXJyaWRlJztcbmltcG9ydCB7Q29tcG9uZW50UmVzb2x2ZXIsIERpcmVjdGl2ZVJlc29sdmVyLCBOZ01vZHVsZVJlc29sdmVyLCBQaXBlUmVzb2x2ZXIsIFJlc29sdmVyfSBmcm9tICcuL3Jlc29sdmVycyc7XG5pbXBvcnQge1Rlc3RCZWR9IGZyb20gJy4vdGVzdF9iZWQnO1xuaW1wb3J0IHtDb21wb25lbnRGaXh0dXJlQXV0b0RldGVjdCwgQ29tcG9uZW50Rml4dHVyZU5vTmdab25lLCBUZXN0QmVkU3RhdGljLCBUZXN0Q29tcG9uZW50UmVuZGVyZXIsIFRlc3RNb2R1bGVNZXRhZGF0YX0gZnJvbSAnLi90ZXN0X2JlZF9jb21tb24nO1xuXG5sZXQgX25leHRSb290RWxlbWVudElkID0gMDtcblxuY29uc3QgRU1QVFlfQVJSQVk6IFR5cGU8YW55PltdID0gW107XG5cbmNvbnN0IFVOREVGSU5FRDogU3ltYm9sID0gU3ltYm9sKCdVTkRFRklORUQnKTtcblxuLy8gUmVzb2x2ZXJzIGZvciBBbmd1bGFyIGRlY29yYXRvcnNcbnR5cGUgUmVzb2x2ZXJzID0ge1xuICBtb2R1bGU6IFJlc29sdmVyPE5nTW9kdWxlPixcbiAgY29tcG9uZW50OiBSZXNvbHZlcjxEaXJlY3RpdmU+LFxuICBkaXJlY3RpdmU6IFJlc29sdmVyPENvbXBvbmVudD4sXG4gIHBpcGU6IFJlc29sdmVyPFBpcGU+LFxufTtcblxuLyoqXG4gKiBAZGVzY3JpcHRpb25cbiAqIENvbmZpZ3VyZXMgYW5kIGluaXRpYWxpemVzIGVudmlyb25tZW50IGZvciB1bml0IHRlc3RpbmcgYW5kIHByb3ZpZGVzIG1ldGhvZHMgZm9yXG4gKiBjcmVhdGluZyBjb21wb25lbnRzIGFuZCBzZXJ2aWNlcyBpbiB1bml0IHRlc3RzLlxuICpcbiAqIFRlc3RCZWQgaXMgdGhlIHByaW1hcnkgYXBpIGZvciB3cml0aW5nIHVuaXQgdGVzdHMgZm9yIEFuZ3VsYXIgYXBwbGljYXRpb25zIGFuZCBsaWJyYXJpZXMuXG4gKlxuICogTm90ZTogVXNlIGBUZXN0QmVkYCBpbiB0ZXN0cy4gSXQgd2lsbCBiZSBzZXQgdG8gZWl0aGVyIGBUZXN0QmVkVmlld0VuZ2luZWAgb3IgYFRlc3RCZWRSZW5kZXIzYFxuICogYWNjb3JkaW5nIHRvIHRoZSBjb21waWxlciB1c2VkLlxuICovXG5leHBvcnQgY2xhc3MgVGVzdEJlZFJlbmRlcjMgaW1wbGVtZW50cyBJbmplY3RvciwgVGVzdEJlZCB7XG4gIC8qKlxuICAgKiBJbml0aWFsaXplIHRoZSBlbnZpcm9ubWVudCBmb3IgdGVzdGluZyB3aXRoIGEgY29tcGlsZXIgZmFjdG9yeSwgYSBQbGF0Zm9ybVJlZiwgYW5kIGFuXG4gICAqIGFuZ3VsYXIgbW9kdWxlLiBUaGVzZSBhcmUgY29tbW9uIHRvIGV2ZXJ5IHRlc3QgaW4gdGhlIHN1aXRlLlxuICAgKlxuICAgKiBUaGlzIG1heSBvbmx5IGJlIGNhbGxlZCBvbmNlLCB0byBzZXQgdXAgdGhlIGNvbW1vbiBwcm92aWRlcnMgZm9yIHRoZSBjdXJyZW50IHRlc3RcbiAgICogc3VpdGUgb24gdGhlIGN1cnJlbnQgcGxhdGZvcm0uIElmIHlvdSBhYnNvbHV0ZWx5IG5lZWQgdG8gY2hhbmdlIHRoZSBwcm92aWRlcnMsXG4gICAqIGZpcnN0IHVzZSBgcmVzZXRUZXN0RW52aXJvbm1lbnRgLlxuICAgKlxuICAgKiBUZXN0IG1vZHVsZXMgYW5kIHBsYXRmb3JtcyBmb3IgaW5kaXZpZHVhbCBwbGF0Zm9ybXMgYXJlIGF2YWlsYWJsZSBmcm9tXG4gICAqICdAYW5ndWxhci88cGxhdGZvcm1fbmFtZT4vdGVzdGluZycuXG4gICAqXG4gICAqIEBwdWJsaWNBcGlcbiAgICovXG4gIHN0YXRpYyBpbml0VGVzdEVudmlyb25tZW50KFxuICAgICAgbmdNb2R1bGU6IFR5cGU8YW55PnxUeXBlPGFueT5bXSwgcGxhdGZvcm06IFBsYXRmb3JtUmVmLCBhb3RTdW1tYXJpZXM/OiAoKSA9PiBhbnlbXSk6IFRlc3RCZWQge1xuICAgIGNvbnN0IHRlc3RCZWQgPSBfZ2V0VGVzdEJlZFJlbmRlcjMoKTtcbiAgICB0ZXN0QmVkLmluaXRUZXN0RW52aXJvbm1lbnQobmdNb2R1bGUsIHBsYXRmb3JtLCBhb3RTdW1tYXJpZXMpO1xuICAgIHJldHVybiB0ZXN0QmVkO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlc2V0IHRoZSBwcm92aWRlcnMgZm9yIHRoZSB0ZXN0IGluamVjdG9yLlxuICAgKlxuICAgKiBAcHVibGljQXBpXG4gICAqL1xuICBzdGF0aWMgcmVzZXRUZXN0RW52aXJvbm1lbnQoKTogdm9pZCB7IF9nZXRUZXN0QmVkUmVuZGVyMygpLnJlc2V0VGVzdEVudmlyb25tZW50KCk7IH1cblxuICBzdGF0aWMgY29uZmlndXJlQ29tcGlsZXIoY29uZmlnOiB7cHJvdmlkZXJzPzogYW55W107IHVzZUppdD86IGJvb2xlYW47fSk6IFRlc3RCZWRTdGF0aWMge1xuICAgIF9nZXRUZXN0QmVkUmVuZGVyMygpLmNvbmZpZ3VyZUNvbXBpbGVyKGNvbmZpZyk7XG4gICAgcmV0dXJuIFRlc3RCZWRSZW5kZXIzIGFzIGFueSBhcyBUZXN0QmVkU3RhdGljO1xuICB9XG5cbiAgLyoqXG4gICAqIEFsbG93cyBvdmVycmlkaW5nIGRlZmF1bHQgcHJvdmlkZXJzLCBkaXJlY3RpdmVzLCBwaXBlcywgbW9kdWxlcyBvZiB0aGUgdGVzdCBpbmplY3RvcixcbiAgICogd2hpY2ggYXJlIGRlZmluZWQgaW4gdGVzdF9pbmplY3Rvci5qc1xuICAgKi9cbiAgc3RhdGljIGNvbmZpZ3VyZVRlc3RpbmdNb2R1bGUobW9kdWxlRGVmOiBUZXN0TW9kdWxlTWV0YWRhdGEpOiBUZXN0QmVkU3RhdGljIHtcbiAgICBfZ2V0VGVzdEJlZFJlbmRlcjMoKS5jb25maWd1cmVUZXN0aW5nTW9kdWxlKG1vZHVsZURlZik7XG4gICAgcmV0dXJuIFRlc3RCZWRSZW5kZXIzIGFzIGFueSBhcyBUZXN0QmVkU3RhdGljO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbXBpbGUgY29tcG9uZW50cyB3aXRoIGEgYHRlbXBsYXRlVXJsYCBmb3IgdGhlIHRlc3QncyBOZ01vZHVsZS5cbiAgICogSXQgaXMgbmVjZXNzYXJ5IHRvIGNhbGwgdGhpcyBmdW5jdGlvblxuICAgKiBhcyBmZXRjaGluZyB1cmxzIGlzIGFzeW5jaHJvbm91cy5cbiAgICovXG4gIHN0YXRpYyBjb21waWxlQ29tcG9uZW50cygpOiBQcm9taXNlPGFueT4geyByZXR1cm4gX2dldFRlc3RCZWRSZW5kZXIzKCkuY29tcGlsZUNvbXBvbmVudHMoKTsgfVxuXG4gIHN0YXRpYyBvdmVycmlkZU1vZHVsZShuZ01vZHVsZTogVHlwZTxhbnk+LCBvdmVycmlkZTogTWV0YWRhdGFPdmVycmlkZTxOZ01vZHVsZT4pOiBUZXN0QmVkU3RhdGljIHtcbiAgICBfZ2V0VGVzdEJlZFJlbmRlcjMoKS5vdmVycmlkZU1vZHVsZShuZ01vZHVsZSwgb3ZlcnJpZGUpO1xuICAgIHJldHVybiBUZXN0QmVkUmVuZGVyMyBhcyBhbnkgYXMgVGVzdEJlZFN0YXRpYztcbiAgfVxuXG4gIHN0YXRpYyBvdmVycmlkZUNvbXBvbmVudChjb21wb25lbnQ6IFR5cGU8YW55Piwgb3ZlcnJpZGU6IE1ldGFkYXRhT3ZlcnJpZGU8Q29tcG9uZW50Pik6XG4gICAgICBUZXN0QmVkU3RhdGljIHtcbiAgICBfZ2V0VGVzdEJlZFJlbmRlcjMoKS5vdmVycmlkZUNvbXBvbmVudChjb21wb25lbnQsIG92ZXJyaWRlKTtcbiAgICByZXR1cm4gVGVzdEJlZFJlbmRlcjMgYXMgYW55IGFzIFRlc3RCZWRTdGF0aWM7XG4gIH1cblxuICBzdGF0aWMgb3ZlcnJpZGVEaXJlY3RpdmUoZGlyZWN0aXZlOiBUeXBlPGFueT4sIG92ZXJyaWRlOiBNZXRhZGF0YU92ZXJyaWRlPERpcmVjdGl2ZT4pOlxuICAgICAgVGVzdEJlZFN0YXRpYyB7XG4gICAgX2dldFRlc3RCZWRSZW5kZXIzKCkub3ZlcnJpZGVEaXJlY3RpdmUoZGlyZWN0aXZlLCBvdmVycmlkZSk7XG4gICAgcmV0dXJuIFRlc3RCZWRSZW5kZXIzIGFzIGFueSBhcyBUZXN0QmVkU3RhdGljO1xuICB9XG5cbiAgc3RhdGljIG92ZXJyaWRlUGlwZShwaXBlOiBUeXBlPGFueT4sIG92ZXJyaWRlOiBNZXRhZGF0YU92ZXJyaWRlPFBpcGU+KTogVGVzdEJlZFN0YXRpYyB7XG4gICAgX2dldFRlc3RCZWRSZW5kZXIzKCkub3ZlcnJpZGVQaXBlKHBpcGUsIG92ZXJyaWRlKTtcbiAgICByZXR1cm4gVGVzdEJlZFJlbmRlcjMgYXMgYW55IGFzIFRlc3RCZWRTdGF0aWM7XG4gIH1cblxuICBzdGF0aWMgb3ZlcnJpZGVUZW1wbGF0ZShjb21wb25lbnQ6IFR5cGU8YW55PiwgdGVtcGxhdGU6IHN0cmluZyk6IFRlc3RCZWRTdGF0aWMge1xuICAgIF9nZXRUZXN0QmVkUmVuZGVyMygpLm92ZXJyaWRlQ29tcG9uZW50KGNvbXBvbmVudCwge3NldDoge3RlbXBsYXRlLCB0ZW1wbGF0ZVVybDogbnVsbCAhfX0pO1xuICAgIHJldHVybiBUZXN0QmVkUmVuZGVyMyBhcyBhbnkgYXMgVGVzdEJlZFN0YXRpYztcbiAgfVxuXG4gIC8qKlxuICAgKiBPdmVycmlkZXMgdGhlIHRlbXBsYXRlIG9mIHRoZSBnaXZlbiBjb21wb25lbnQsIGNvbXBpbGluZyB0aGUgdGVtcGxhdGVcbiAgICogaW4gdGhlIGNvbnRleHQgb2YgdGhlIFRlc3RpbmdNb2R1bGUuXG4gICAqXG4gICAqIE5vdGU6IFRoaXMgd29ya3MgZm9yIEpJVCBhbmQgQU9UZWQgY29tcG9uZW50cyBhcyB3ZWxsLlxuICAgKi9cbiAgc3RhdGljIG92ZXJyaWRlVGVtcGxhdGVVc2luZ1Rlc3RpbmdNb2R1bGUoY29tcG9uZW50OiBUeXBlPGFueT4sIHRlbXBsYXRlOiBzdHJpbmcpOiBUZXN0QmVkU3RhdGljIHtcbiAgICBfZ2V0VGVzdEJlZFJlbmRlcjMoKS5vdmVycmlkZVRlbXBsYXRlVXNpbmdUZXN0aW5nTW9kdWxlKGNvbXBvbmVudCwgdGVtcGxhdGUpO1xuICAgIHJldHVybiBUZXN0QmVkUmVuZGVyMyBhcyBhbnkgYXMgVGVzdEJlZFN0YXRpYztcbiAgfVxuXG4gIG92ZXJyaWRlVGVtcGxhdGVVc2luZ1Rlc3RpbmdNb2R1bGUoY29tcG9uZW50OiBUeXBlPGFueT4sIHRlbXBsYXRlOiBzdHJpbmcpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5faW5zdGFudGlhdGVkKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgJ0Nhbm5vdCBvdmVycmlkZSB0ZW1wbGF0ZSB3aGVuIHRoZSB0ZXN0IG1vZHVsZSBoYXMgYWxyZWFkeSBiZWVuIGluc3RhbnRpYXRlZCcpO1xuICAgIH1cbiAgICB0aGlzLl90ZW1wbGF0ZU92ZXJyaWRlcy5zZXQoY29tcG9uZW50LCB0ZW1wbGF0ZSk7XG4gIH1cblxuICBzdGF0aWMgb3ZlcnJpZGVQcm92aWRlcih0b2tlbjogYW55LCBwcm92aWRlcjoge1xuICAgIHVzZUZhY3Rvcnk6IEZ1bmN0aW9uLFxuICAgIGRlcHM6IGFueVtdLFxuICB9KTogVGVzdEJlZFN0YXRpYztcbiAgc3RhdGljIG92ZXJyaWRlUHJvdmlkZXIodG9rZW46IGFueSwgcHJvdmlkZXI6IHt1c2VWYWx1ZTogYW55O30pOiBUZXN0QmVkU3RhdGljO1xuICBzdGF0aWMgb3ZlcnJpZGVQcm92aWRlcih0b2tlbjogYW55LCBwcm92aWRlcjoge1xuICAgIHVzZUZhY3Rvcnk/OiBGdW5jdGlvbixcbiAgICB1c2VWYWx1ZT86IGFueSxcbiAgICBkZXBzPzogYW55W10sXG4gIH0pOiBUZXN0QmVkU3RhdGljIHtcbiAgICBfZ2V0VGVzdEJlZFJlbmRlcjMoKS5vdmVycmlkZVByb3ZpZGVyKHRva2VuLCBwcm92aWRlcik7XG4gICAgcmV0dXJuIFRlc3RCZWRSZW5kZXIzIGFzIGFueSBhcyBUZXN0QmVkU3RhdGljO1xuICB9XG5cbiAgLyoqXG4gICAqIE92ZXJ3cml0ZXMgYWxsIHByb3ZpZGVycyBmb3IgdGhlIGdpdmVuIHRva2VuIHdpdGggdGhlIGdpdmVuIHByb3ZpZGVyIGRlZmluaXRpb24uXG4gICAqXG4gICAqIEBkZXByZWNhdGVkIGFzIGl0IG1ha2VzIGFsbCBOZ01vZHVsZXMgbGF6eS4gSW50cm9kdWNlZCBvbmx5IGZvciBtaWdyYXRpbmcgb2ZmIG9mIGl0LlxuICAgKi9cbiAgc3RhdGljIGRlcHJlY2F0ZWRPdmVycmlkZVByb3ZpZGVyKHRva2VuOiBhbnksIHByb3ZpZGVyOiB7XG4gICAgdXNlRmFjdG9yeTogRnVuY3Rpb24sXG4gICAgZGVwczogYW55W10sXG4gIH0pOiB2b2lkO1xuICBzdGF0aWMgZGVwcmVjYXRlZE92ZXJyaWRlUHJvdmlkZXIodG9rZW46IGFueSwgcHJvdmlkZXI6IHt1c2VWYWx1ZTogYW55O30pOiB2b2lkO1xuICBzdGF0aWMgZGVwcmVjYXRlZE92ZXJyaWRlUHJvdmlkZXIodG9rZW46IGFueSwgcHJvdmlkZXI6IHtcbiAgICB1c2VGYWN0b3J5PzogRnVuY3Rpb24sXG4gICAgdXNlVmFsdWU/OiBhbnksXG4gICAgZGVwcz86IGFueVtdLFxuICB9KTogVGVzdEJlZFN0YXRpYyB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdSZW5kZXIzVGVzdEJlZC5kZXByZWNhdGVkT3ZlcnJpZGVQcm92aWRlciBpcyBub3QgaW1wbGVtZW50ZWQnKTtcbiAgfVxuXG4gIHN0YXRpYyBnZXQodG9rZW46IGFueSwgbm90Rm91bmRWYWx1ZTogYW55ID0gSW5qZWN0b3IuVEhST1dfSUZfTk9UX0ZPVU5EKTogYW55IHtcbiAgICByZXR1cm4gX2dldFRlc3RCZWRSZW5kZXIzKCkuZ2V0KHRva2VuLCBub3RGb3VuZFZhbHVlKTtcbiAgfVxuXG4gIHN0YXRpYyBjcmVhdGVDb21wb25lbnQ8VD4oY29tcG9uZW50OiBUeXBlPFQ+KTogQ29tcG9uZW50Rml4dHVyZTxUPiB7XG4gICAgcmV0dXJuIF9nZXRUZXN0QmVkUmVuZGVyMygpLmNyZWF0ZUNvbXBvbmVudChjb21wb25lbnQpO1xuICB9XG5cbiAgc3RhdGljIHJlc2V0VGVzdGluZ01vZHVsZSgpOiBUZXN0QmVkU3RhdGljIHtcbiAgICBfZ2V0VGVzdEJlZFJlbmRlcjMoKS5yZXNldFRlc3RpbmdNb2R1bGUoKTtcbiAgICByZXR1cm4gVGVzdEJlZFJlbmRlcjMgYXMgYW55IGFzIFRlc3RCZWRTdGF0aWM7XG4gIH1cblxuICAvLyBQcm9wZXJ0aWVzXG5cbiAgcGxhdGZvcm06IFBsYXRmb3JtUmVmID0gbnVsbCAhO1xuICBuZ01vZHVsZTogVHlwZTxhbnk+fFR5cGU8YW55PltdID0gbnVsbCAhO1xuXG4gIC8vIG1ldGFkYXRhIG92ZXJyaWRlc1xuICBwcml2YXRlIF9tb2R1bGVPdmVycmlkZXM6IFtUeXBlPGFueT4sIE1ldGFkYXRhT3ZlcnJpZGU8TmdNb2R1bGU+XVtdID0gW107XG4gIHByaXZhdGUgX2NvbXBvbmVudE92ZXJyaWRlczogW1R5cGU8YW55PiwgTWV0YWRhdGFPdmVycmlkZTxDb21wb25lbnQ+XVtdID0gW107XG4gIHByaXZhdGUgX2RpcmVjdGl2ZU92ZXJyaWRlczogW1R5cGU8YW55PiwgTWV0YWRhdGFPdmVycmlkZTxEaXJlY3RpdmU+XVtdID0gW107XG4gIHByaXZhdGUgX3BpcGVPdmVycmlkZXM6IFtUeXBlPGFueT4sIE1ldGFkYXRhT3ZlcnJpZGU8UGlwZT5dW10gPSBbXTtcbiAgcHJpdmF0ZSBfcHJvdmlkZXJPdmVycmlkZXM6IFByb3ZpZGVyW10gPSBbXTtcbiAgcHJpdmF0ZSBfY29tcGlsZXJQcm92aWRlcnM6IFN0YXRpY1Byb3ZpZGVyW10gPSBbXTtcbiAgcHJpdmF0ZSBfcm9vdFByb3ZpZGVyT3ZlcnJpZGVzOiBQcm92aWRlcltdID0gW107XG4gIHByaXZhdGUgX3Byb3ZpZGVyT3ZlcnJpZGVzQnlUb2tlbjogTWFwPGFueSwgUHJvdmlkZXJbXT4gPSBuZXcgTWFwKCk7XG4gIHByaXZhdGUgX3RlbXBsYXRlT3ZlcnJpZGVzOiBNYXA8VHlwZTxhbnk+LCBzdHJpbmc+ID0gbmV3IE1hcCgpO1xuICBwcml2YXRlIF9yZXNvbHZlcnM6IFJlc29sdmVycyA9IG51bGwgITtcblxuICAvLyB0ZXN0IG1vZHVsZSBjb25maWd1cmF0aW9uXG4gIHByaXZhdGUgX3Byb3ZpZGVyczogUHJvdmlkZXJbXSA9IFtdO1xuICBwcml2YXRlIF9jb21waWxlck9wdGlvbnM6IENvbXBpbGVyT3B0aW9uc1tdID0gW107XG4gIHByaXZhdGUgX2RlY2xhcmF0aW9uczogQXJyYXk8VHlwZTxhbnk+fGFueVtdfGFueT4gPSBbXTtcbiAgcHJpdmF0ZSBfaW1wb3J0czogQXJyYXk8VHlwZTxhbnk+fGFueVtdfGFueT4gPSBbXTtcbiAgcHJpdmF0ZSBfc2NoZW1hczogQXJyYXk8U2NoZW1hTWV0YWRhdGF8YW55W10+ID0gW107XG5cbiAgcHJpdmF0ZSBfYWN0aXZlRml4dHVyZXM6IENvbXBvbmVudEZpeHR1cmU8YW55PltdID0gW107XG5cbiAgcHJpdmF0ZSBfY29tcGlsZXJJbmplY3RvcjogSW5qZWN0b3IgPSBudWxsICE7XG4gIHByaXZhdGUgX21vZHVsZVJlZjogTmdNb2R1bGVSZWY8YW55PiA9IG51bGwgITtcbiAgcHJpdmF0ZSBfdGVzdE1vZHVsZVR5cGU6IE5nTW9kdWxlVHlwZTxhbnk+ID0gbnVsbCAhO1xuXG4gIHByaXZhdGUgX2luc3RhbnRpYXRlZDogYm9vbGVhbiA9IGZhbHNlO1xuICBwcml2YXRlIF9nbG9iYWxDb21waWxhdGlvbkNoZWNrZWQgPSBmYWxzZTtcblxuICAvLyBNYXAgdGhhdCBrZWVwcyBpbml0aWFsIHZlcnNpb24gb2YgY29tcG9uZW50L2RpcmVjdGl2ZS9waXBlIGRlZnMgaW4gY2FzZVxuICAvLyB3ZSBjb21waWxlIGEgVHlwZSBhZ2FpbiwgdGh1cyBvdmVycmlkaW5nIHJlc3BlY3RpdmUgc3RhdGljIGZpZWxkcy4gVGhpcyBpc1xuICAvLyByZXF1aXJlZCB0byBtYWtlIHN1cmUgd2UgcmVzdG9yZSBkZWZzIHRvIHRoZWlyIGluaXRpYWwgc3RhdGVzIGJldHdlZW4gdGVzdCBydW5zXG4gIHByaXZhdGUgX2luaXRpYU5nRGVmczogTWFwPFR5cGU8YW55PiwgW3N0cmluZywgUHJvcGVydHlEZXNjcmlwdG9yfHVuZGVmaW5lZF0+ID0gbmV3IE1hcCgpO1xuXG4gIC8qKlxuICAgKiBJbml0aWFsaXplIHRoZSBlbnZpcm9ubWVudCBmb3IgdGVzdGluZyB3aXRoIGEgY29tcGlsZXIgZmFjdG9yeSwgYSBQbGF0Zm9ybVJlZiwgYW5kIGFuXG4gICAqIGFuZ3VsYXIgbW9kdWxlLiBUaGVzZSBhcmUgY29tbW9uIHRvIGV2ZXJ5IHRlc3QgaW4gdGhlIHN1aXRlLlxuICAgKlxuICAgKiBUaGlzIG1heSBvbmx5IGJlIGNhbGxlZCBvbmNlLCB0byBzZXQgdXAgdGhlIGNvbW1vbiBwcm92aWRlcnMgZm9yIHRoZSBjdXJyZW50IHRlc3RcbiAgICogc3VpdGUgb24gdGhlIGN1cnJlbnQgcGxhdGZvcm0uIElmIHlvdSBhYnNvbHV0ZWx5IG5lZWQgdG8gY2hhbmdlIHRoZSBwcm92aWRlcnMsXG4gICAqIGZpcnN0IHVzZSBgcmVzZXRUZXN0RW52aXJvbm1lbnRgLlxuICAgKlxuICAgKiBUZXN0IG1vZHVsZXMgYW5kIHBsYXRmb3JtcyBmb3IgaW5kaXZpZHVhbCBwbGF0Zm9ybXMgYXJlIGF2YWlsYWJsZSBmcm9tXG4gICAqICdAYW5ndWxhci88cGxhdGZvcm1fbmFtZT4vdGVzdGluZycuXG4gICAqXG4gICAqIEBwdWJsaWNBcGlcbiAgICovXG4gIGluaXRUZXN0RW52aXJvbm1lbnQoXG4gICAgICBuZ01vZHVsZTogVHlwZTxhbnk+fFR5cGU8YW55PltdLCBwbGF0Zm9ybTogUGxhdGZvcm1SZWYsIGFvdFN1bW1hcmllcz86ICgpID0+IGFueVtdKTogdm9pZCB7XG4gICAgaWYgKHRoaXMucGxhdGZvcm0gfHwgdGhpcy5uZ01vZHVsZSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3Qgc2V0IGJhc2UgcHJvdmlkZXJzIGJlY2F1c2UgaXQgaGFzIGFscmVhZHkgYmVlbiBjYWxsZWQnKTtcbiAgICB9XG4gICAgdGhpcy5wbGF0Zm9ybSA9IHBsYXRmb3JtO1xuICAgIHRoaXMubmdNb2R1bGUgPSBuZ01vZHVsZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXNldCB0aGUgcHJvdmlkZXJzIGZvciB0aGUgdGVzdCBpbmplY3Rvci5cbiAgICpcbiAgICogQHB1YmxpY0FwaVxuICAgKi9cbiAgcmVzZXRUZXN0RW52aXJvbm1lbnQoKTogdm9pZCB7XG4gICAgdGhpcy5yZXNldFRlc3RpbmdNb2R1bGUoKTtcbiAgICB0aGlzLnBsYXRmb3JtID0gbnVsbCAhO1xuICAgIHRoaXMubmdNb2R1bGUgPSBudWxsICE7XG4gIH1cblxuICByZXNldFRlc3RpbmdNb2R1bGUoKTogdm9pZCB7XG4gICAgdGhpcy5fY2hlY2tHbG9iYWxDb21waWxhdGlvbkZpbmlzaGVkKCk7XG4gICAgcmVzZXRDb21waWxlZENvbXBvbmVudHMoKTtcbiAgICAvLyByZXNldCBtZXRhZGF0YSBvdmVycmlkZXNcbiAgICB0aGlzLl9tb2R1bGVPdmVycmlkZXMgPSBbXTtcbiAgICB0aGlzLl9jb21wb25lbnRPdmVycmlkZXMgPSBbXTtcbiAgICB0aGlzLl9kaXJlY3RpdmVPdmVycmlkZXMgPSBbXTtcbiAgICB0aGlzLl9waXBlT3ZlcnJpZGVzID0gW107XG4gICAgdGhpcy5fcHJvdmlkZXJPdmVycmlkZXMgPSBbXTtcbiAgICB0aGlzLl9yb290UHJvdmlkZXJPdmVycmlkZXMgPSBbXTtcbiAgICB0aGlzLl9wcm92aWRlck92ZXJyaWRlc0J5VG9rZW4uY2xlYXIoKTtcbiAgICB0aGlzLl90ZW1wbGF0ZU92ZXJyaWRlcy5jbGVhcigpO1xuICAgIHRoaXMuX3Jlc29sdmVycyA9IG51bGwgITtcblxuICAgIC8vIHJlc2V0IHRlc3QgbW9kdWxlIGNvbmZpZ1xuICAgIHRoaXMuX3Byb3ZpZGVycyA9IFtdO1xuICAgIHRoaXMuX2NvbXBpbGVyT3B0aW9ucyA9IFtdO1xuICAgIHRoaXMuX2NvbXBpbGVyUHJvdmlkZXJzID0gW107XG4gICAgdGhpcy5fZGVjbGFyYXRpb25zID0gW107XG4gICAgdGhpcy5faW1wb3J0cyA9IFtdO1xuICAgIHRoaXMuX3NjaGVtYXMgPSBbXTtcbiAgICB0aGlzLl9tb2R1bGVSZWYgPSBudWxsICE7XG4gICAgdGhpcy5fdGVzdE1vZHVsZVR5cGUgPSBudWxsICE7XG5cbiAgICB0aGlzLl9jb21waWxlckluamVjdG9yID0gbnVsbCAhO1xuICAgIHRoaXMuX2luc3RhbnRpYXRlZCA9IGZhbHNlO1xuICAgIHRoaXMuX2FjdGl2ZUZpeHR1cmVzLmZvckVhY2goKGZpeHR1cmUpID0+IHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGZpeHR1cmUuZGVzdHJveSgpO1xuICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBjb25zb2xlLmVycm9yKCdFcnJvciBkdXJpbmcgY2xlYW51cCBvZiBjb21wb25lbnQnLCB7XG4gICAgICAgICAgY29tcG9uZW50OiBmaXh0dXJlLmNvbXBvbmVudEluc3RhbmNlLFxuICAgICAgICAgIHN0YWNrdHJhY2U6IGUsXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHRoaXMuX2FjdGl2ZUZpeHR1cmVzID0gW107XG5cbiAgICAvLyByZXN0b3JlIGluaXRpYWwgY29tcG9uZW50L2RpcmVjdGl2ZS9waXBlIGRlZnNcbiAgICB0aGlzLl9pbml0aWFOZ0RlZnMuZm9yRWFjaCgodmFsdWU6IFtzdHJpbmcsIFByb3BlcnR5RGVzY3JpcHRvcl0sIHR5cGU6IFR5cGU8YW55PikgPT4ge1xuICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHR5cGUsIHZhbHVlWzBdLCB2YWx1ZVsxXSk7XG4gICAgfSk7XG4gICAgdGhpcy5faW5pdGlhTmdEZWZzLmNsZWFyKCk7XG4gICAgY2xlYXJSZXNvbHV0aW9uT2ZDb21wb25lbnRSZXNvdXJjZXNRdWV1ZSgpO1xuICB9XG5cbiAgY29uZmlndXJlQ29tcGlsZXIoY29uZmlnOiB7cHJvdmlkZXJzPzogYW55W107IHVzZUppdD86IGJvb2xlYW47fSk6IHZvaWQge1xuICAgIGlmIChjb25maWcudXNlSml0ICE9IG51bGwpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcigndGhlIFJlbmRlcjMgY29tcGlsZXIgSmlUIG1vZGUgaXMgbm90IGNvbmZpZ3VyYWJsZSAhJyk7XG4gICAgfVxuXG4gICAgaWYgKGNvbmZpZy5wcm92aWRlcnMpIHtcbiAgICAgIHRoaXMuX3Byb3ZpZGVyT3ZlcnJpZGVzLnB1c2goLi4uY29uZmlnLnByb3ZpZGVycyk7XG4gICAgICB0aGlzLl9jb21waWxlclByb3ZpZGVycy5wdXNoKC4uLmNvbmZpZy5wcm92aWRlcnMpO1xuICAgIH1cbiAgfVxuXG4gIGNvbmZpZ3VyZVRlc3RpbmdNb2R1bGUobW9kdWxlRGVmOiBUZXN0TW9kdWxlTWV0YWRhdGEpOiB2b2lkIHtcbiAgICB0aGlzLl9hc3NlcnROb3RJbnN0YW50aWF0ZWQoJ1IzVGVzdEJlZC5jb25maWd1cmVUZXN0aW5nTW9kdWxlJywgJ2NvbmZpZ3VyZSB0aGUgdGVzdCBtb2R1bGUnKTtcbiAgICBpZiAobW9kdWxlRGVmLnByb3ZpZGVycykge1xuICAgICAgdGhpcy5fcHJvdmlkZXJzLnB1c2goLi4ubW9kdWxlRGVmLnByb3ZpZGVycyk7XG4gICAgfVxuICAgIGlmIChtb2R1bGVEZWYuZGVjbGFyYXRpb25zKSB7XG4gICAgICB0aGlzLl9kZWNsYXJhdGlvbnMucHVzaCguLi5tb2R1bGVEZWYuZGVjbGFyYXRpb25zKTtcbiAgICB9XG4gICAgaWYgKG1vZHVsZURlZi5pbXBvcnRzKSB7XG4gICAgICB0aGlzLl9pbXBvcnRzLnB1c2goLi4ubW9kdWxlRGVmLmltcG9ydHMpO1xuICAgIH1cbiAgICBpZiAobW9kdWxlRGVmLnNjaGVtYXMpIHtcbiAgICAgIHRoaXMuX3NjaGVtYXMucHVzaCguLi5tb2R1bGVEZWYuc2NoZW1hcyk7XG4gICAgfVxuICB9XG5cbiAgY29tcGlsZUNvbXBvbmVudHMoKTogUHJvbWlzZTxhbnk+IHtcbiAgICBjb25zdCByZXNvbHZlcnMgPSB0aGlzLl9nZXRSZXNvbHZlcnMoKTtcbiAgICBjb25zdCBkZWNsYXJhdGlvbnM6IFR5cGU8YW55PltdID0gZmxhdHRlbih0aGlzLl9kZWNsYXJhdGlvbnMgfHwgRU1QVFlfQVJSQVksIHJlc29sdmVGb3J3YXJkUmVmKTtcblxuICAgIGNvbnN0IGNvbXBvbmVudE92ZXJyaWRlczogW1R5cGU8YW55PiwgQ29tcG9uZW50XVtdID0gW107XG4gICAgbGV0IGhhc0FzeW5jUmVzb3VyY2VzID0gZmFsc2U7XG5cbiAgICAvLyBDb21waWxlIHRoZSBjb21wb25lbnRzIGRlY2xhcmVkIGJ5IHRoaXMgbW9kdWxlXG4gICAgZGVjbGFyYXRpb25zLmZvckVhY2goZGVjbGFyYXRpb24gPT4ge1xuICAgICAgY29uc3QgY29tcG9uZW50ID0gcmVzb2x2ZXJzLmNvbXBvbmVudC5yZXNvbHZlKGRlY2xhcmF0aW9uKTtcbiAgICAgIGlmIChjb21wb25lbnQpIHtcbiAgICAgICAgLy8gV2UgbWFrZSBhIGNvcHkgb2YgdGhlIG1ldGFkYXRhIHRvIGVuc3VyZSB0aGF0IHdlIGRvbid0IG11dGF0ZSB0aGUgb3JpZ2luYWwgbWV0YWRhdGFcbiAgICAgICAgY29uc3QgbWV0YWRhdGEgPSB7Li4uY29tcG9uZW50fTtcbiAgICAgICAgY29tcGlsZUNvbXBvbmVudChkZWNsYXJhdGlvbiwgbWV0YWRhdGEpO1xuICAgICAgICBjb21wb25lbnRPdmVycmlkZXMucHVzaChbZGVjbGFyYXRpb24sIG1ldGFkYXRhXSk7XG4gICAgICAgIGhhc0FzeW5jUmVzb3VyY2VzID0gaGFzQXN5bmNSZXNvdXJjZXMgfHwgY29tcG9uZW50TmVlZHNSZXNvbHV0aW9uKGNvbXBvbmVudCk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBjb25zdCBvdmVycmlkZUNvbXBvbmVudHMgPSAoKSA9PiB7XG4gICAgICBjb21wb25lbnRPdmVycmlkZXMuZm9yRWFjaCgob3ZlcnJpZGU6IFtUeXBlPGFueT4sIENvbXBvbmVudF0pID0+IHtcbiAgICAgICAgLy8gT3ZlcnJpZGUgdGhlIGV4aXN0aW5nIG1ldGFkYXRhLCBlbnN1cmluZyB0aGF0IHRoZSByZXNvbHZlZCByZXNvdXJjZXNcbiAgICAgICAgLy8gYXJlIG9ubHkgYXZhaWxhYmxlIHVudGlsIHRoZSBuZXh0IFRlc3RCZWQgcmVzZXQgKHdoZW4gYHJlc2V0VGVzdGluZ01vZHVsZWAgaXMgY2FsbGVkKVxuICAgICAgICB0aGlzLm92ZXJyaWRlQ29tcG9uZW50KG92ZXJyaWRlWzBdLCB7c2V0OiBvdmVycmlkZVsxXX0pO1xuICAgICAgfSk7XG4gICAgfTtcblxuICAgIC8vIElmIHRoZSBjb21wb25lbnQgaGFzIG5vIGFzeW5jIHJlc291cmNlcyAodGVtcGxhdGVVcmwsIHN0eWxlVXJscyksIHdlIGNhbiBmaW5pc2hcbiAgICAvLyBzeW5jaHJvbm91c2x5LiBUaGlzIGlzIGltcG9ydGFudCBzbyB0aGF0IHVzZXJzIHdobyBtaXN0YWtlbmx5IHRyZWF0IGBjb21waWxlQ29tcG9uZW50c2BcbiAgICAvLyBhcyBzeW5jaHJvbm91cyBkb24ndCBlbmNvdW50ZXIgYW4gZXJyb3IsIGFzIFZpZXdFbmdpbmUgd2FzIHRvbGVyYW50IG9mIHRoaXMuXG4gICAgaWYgKCFoYXNBc3luY1Jlc291cmNlcykge1xuICAgICAgb3ZlcnJpZGVDb21wb25lbnRzKCk7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGxldCByZXNvdXJjZUxvYWRlcjogUmVzb3VyY2VMb2FkZXI7XG4gICAgICByZXR1cm4gcmVzb2x2ZUNvbXBvbmVudFJlc291cmNlcyh1cmwgPT4ge1xuICAgICAgICAgICAgICAgaWYgKCFyZXNvdXJjZUxvYWRlcikge1xuICAgICAgICAgICAgICAgICByZXNvdXJjZUxvYWRlciA9IHRoaXMuY29tcGlsZXJJbmplY3Rvci5nZXQoUmVzb3VyY2VMb2FkZXIpO1xuICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShyZXNvdXJjZUxvYWRlci5nZXQodXJsKSk7XG4gICAgICAgICAgICAgfSlcbiAgICAgICAgICAudGhlbihvdmVycmlkZUNvbXBvbmVudHMpO1xuICAgIH1cbiAgfVxuXG4gIGdldCh0b2tlbjogYW55LCBub3RGb3VuZFZhbHVlOiBhbnkgPSBJbmplY3Rvci5USFJPV19JRl9OT1RfRk9VTkQpOiBhbnkge1xuICAgIHRoaXMuX2luaXRJZk5lZWRlZCgpO1xuICAgIGlmICh0b2tlbiA9PT0gVGVzdEJlZFJlbmRlcjMpIHtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICBjb25zdCByZXN1bHQgPSB0aGlzLl9tb2R1bGVSZWYuaW5qZWN0b3IuZ2V0KHRva2VuLCBVTkRFRklORUQpO1xuICAgIHJldHVybiByZXN1bHQgPT09IFVOREVGSU5FRCA/IHRoaXMuY29tcGlsZXJJbmplY3Rvci5nZXQodG9rZW4sIG5vdEZvdW5kVmFsdWUpIDogcmVzdWx0O1xuICB9XG5cbiAgZXhlY3V0ZSh0b2tlbnM6IGFueVtdLCBmbjogRnVuY3Rpb24sIGNvbnRleHQ/OiBhbnkpOiBhbnkge1xuICAgIHRoaXMuX2luaXRJZk5lZWRlZCgpO1xuICAgIGNvbnN0IHBhcmFtcyA9IHRva2Vucy5tYXAodCA9PiB0aGlzLmdldCh0KSk7XG4gICAgcmV0dXJuIGZuLmFwcGx5KGNvbnRleHQsIHBhcmFtcyk7XG4gIH1cblxuICBvdmVycmlkZU1vZHVsZShuZ01vZHVsZTogVHlwZTxhbnk+LCBvdmVycmlkZTogTWV0YWRhdGFPdmVycmlkZTxOZ01vZHVsZT4pOiB2b2lkIHtcbiAgICB0aGlzLl9hc3NlcnROb3RJbnN0YW50aWF0ZWQoJ292ZXJyaWRlTW9kdWxlJywgJ292ZXJyaWRlIG1vZHVsZSBtZXRhZGF0YScpO1xuICAgIHRoaXMuX21vZHVsZU92ZXJyaWRlcy5wdXNoKFtuZ01vZHVsZSwgb3ZlcnJpZGVdKTtcbiAgfVxuXG4gIG92ZXJyaWRlQ29tcG9uZW50KGNvbXBvbmVudDogVHlwZTxhbnk+LCBvdmVycmlkZTogTWV0YWRhdGFPdmVycmlkZTxDb21wb25lbnQ+KTogdm9pZCB7XG4gICAgdGhpcy5fYXNzZXJ0Tm90SW5zdGFudGlhdGVkKCdvdmVycmlkZUNvbXBvbmVudCcsICdvdmVycmlkZSBjb21wb25lbnQgbWV0YWRhdGEnKTtcbiAgICB0aGlzLl9jb21wb25lbnRPdmVycmlkZXMucHVzaChbY29tcG9uZW50LCBvdmVycmlkZV0pO1xuICB9XG5cbiAgb3ZlcnJpZGVEaXJlY3RpdmUoZGlyZWN0aXZlOiBUeXBlPGFueT4sIG92ZXJyaWRlOiBNZXRhZGF0YU92ZXJyaWRlPERpcmVjdGl2ZT4pOiB2b2lkIHtcbiAgICB0aGlzLl9hc3NlcnROb3RJbnN0YW50aWF0ZWQoJ292ZXJyaWRlRGlyZWN0aXZlJywgJ292ZXJyaWRlIGRpcmVjdGl2ZSBtZXRhZGF0YScpO1xuICAgIHRoaXMuX2RpcmVjdGl2ZU92ZXJyaWRlcy5wdXNoKFtkaXJlY3RpdmUsIG92ZXJyaWRlXSk7XG4gIH1cblxuICBvdmVycmlkZVBpcGUocGlwZTogVHlwZTxhbnk+LCBvdmVycmlkZTogTWV0YWRhdGFPdmVycmlkZTxQaXBlPik6IHZvaWQge1xuICAgIHRoaXMuX2Fzc2VydE5vdEluc3RhbnRpYXRlZCgnb3ZlcnJpZGVQaXBlJywgJ292ZXJyaWRlIHBpcGUgbWV0YWRhdGEnKTtcbiAgICB0aGlzLl9waXBlT3ZlcnJpZGVzLnB1c2goW3BpcGUsIG92ZXJyaWRlXSk7XG4gIH1cblxuICAvKipcbiAgICogT3ZlcndyaXRlcyBhbGwgcHJvdmlkZXJzIGZvciB0aGUgZ2l2ZW4gdG9rZW4gd2l0aCB0aGUgZ2l2ZW4gcHJvdmlkZXIgZGVmaW5pdGlvbi5cbiAgICovXG4gIG92ZXJyaWRlUHJvdmlkZXIodG9rZW46IGFueSwgcHJvdmlkZXI6IHt1c2VGYWN0b3J5PzogRnVuY3Rpb24sIHVzZVZhbHVlPzogYW55LCBkZXBzPzogYW55W119KTpcbiAgICAgIHZvaWQge1xuICAgIGNvbnN0IHByb3ZpZGVyRGVmID0gcHJvdmlkZXIudXNlRmFjdG9yeSA/XG4gICAgICAgIHtwcm92aWRlOiB0b2tlbiwgdXNlRmFjdG9yeTogcHJvdmlkZXIudXNlRmFjdG9yeSwgZGVwczogcHJvdmlkZXIuZGVwcyB8fCBbXX0gOlxuICAgICAgICB7cHJvdmlkZTogdG9rZW4sIHVzZVZhbHVlOiBwcm92aWRlci51c2VWYWx1ZX07XG5cbiAgICBsZXQgaW5qZWN0YWJsZURlZjogSW5qZWN0YWJsZURlZjxhbnk+fG51bGw7XG4gICAgY29uc3QgaXNSb290ID1cbiAgICAgICAgKHR5cGVvZiB0b2tlbiAhPT0gJ3N0cmluZycgJiYgKGluamVjdGFibGVEZWYgPSBnZXRJbmplY3RhYmxlRGVmKHRva2VuKSkgJiZcbiAgICAgICAgIGluamVjdGFibGVEZWYucHJvdmlkZWRJbiA9PT0gJ3Jvb3QnKTtcbiAgICBjb25zdCBvdmVycmlkZXNCdWNrZXQgPSBpc1Jvb3QgPyB0aGlzLl9yb290UHJvdmlkZXJPdmVycmlkZXMgOiB0aGlzLl9wcm92aWRlck92ZXJyaWRlcztcbiAgICBvdmVycmlkZXNCdWNrZXQucHVzaChwcm92aWRlckRlZik7XG5cbiAgICAvLyBrZWVwIGFsbCBvdmVycmlkZXMgZ3JvdXBlZCBieSB0b2tlbiBhcyB3ZWxsIGZvciBmYXN0IGxvb2t1cHMgdXNpbmcgdG9rZW5cbiAgICBjb25zdCBvdmVycmlkZXNGb3JUb2tlbiA9IHRoaXMuX3Byb3ZpZGVyT3ZlcnJpZGVzQnlUb2tlbi5nZXQodG9rZW4pIHx8IFtdO1xuICAgIG92ZXJyaWRlc0ZvclRva2VuLnB1c2gocHJvdmlkZXJEZWYpO1xuICAgIHRoaXMuX3Byb3ZpZGVyT3ZlcnJpZGVzQnlUb2tlbi5zZXQodG9rZW4sIG92ZXJyaWRlc0ZvclRva2VuKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBPdmVyd3JpdGVzIGFsbCBwcm92aWRlcnMgZm9yIHRoZSBnaXZlbiB0b2tlbiB3aXRoIHRoZSBnaXZlbiBwcm92aWRlciBkZWZpbml0aW9uLlxuICAgKlxuICAgKiBAZGVwcmVjYXRlZCBhcyBpdCBtYWtlcyBhbGwgTmdNb2R1bGVzIGxhenkuIEludHJvZHVjZWQgb25seSBmb3IgbWlncmF0aW5nIG9mZiBvZiBpdC5cbiAgICovXG4gIGRlcHJlY2F0ZWRPdmVycmlkZVByb3ZpZGVyKHRva2VuOiBhbnksIHByb3ZpZGVyOiB7XG4gICAgdXNlRmFjdG9yeTogRnVuY3Rpb24sXG4gICAgZGVwczogYW55W10sXG4gIH0pOiB2b2lkO1xuICBkZXByZWNhdGVkT3ZlcnJpZGVQcm92aWRlcih0b2tlbjogYW55LCBwcm92aWRlcjoge3VzZVZhbHVlOiBhbnk7fSk6IHZvaWQ7XG4gIGRlcHJlY2F0ZWRPdmVycmlkZVByb3ZpZGVyKFxuICAgICAgdG9rZW46IGFueSwgcHJvdmlkZXI6IHt1c2VGYWN0b3J5PzogRnVuY3Rpb24sIHVzZVZhbHVlPzogYW55LCBkZXBzPzogYW55W119KTogdm9pZCB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdObyBpbXBsZW1lbnRlZCBpbiBJVlknKTtcbiAgfVxuXG4gIGNyZWF0ZUNvbXBvbmVudDxUPih0eXBlOiBUeXBlPFQ+KTogQ29tcG9uZW50Rml4dHVyZTxUPiB7XG4gICAgdGhpcy5faW5pdElmTmVlZGVkKCk7XG5cbiAgICBjb25zdCB0ZXN0Q29tcG9uZW50UmVuZGVyZXI6IFRlc3RDb21wb25lbnRSZW5kZXJlciA9IHRoaXMuZ2V0KFRlc3RDb21wb25lbnRSZW5kZXJlcik7XG4gICAgY29uc3Qgcm9vdEVsSWQgPSBgcm9vdCR7X25leHRSb290RWxlbWVudElkKyt9YDtcbiAgICB0ZXN0Q29tcG9uZW50UmVuZGVyZXIuaW5zZXJ0Um9vdEVsZW1lbnQocm9vdEVsSWQpO1xuXG4gICAgY29uc3QgY29tcG9uZW50RGVmID0gKHR5cGUgYXMgYW55KS5uZ0NvbXBvbmVudERlZjtcblxuICAgIGlmICghY29tcG9uZW50RGVmKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgYEl0IGxvb2tzIGxpa2UgJyR7c3RyaW5naWZ5KHR5cGUpfScgaGFzIG5vdCBiZWVuIElWWSBjb21waWxlZCAtIGl0IGhhcyBubyAnbmdDb21wb25lbnREZWYnIGZpZWxkYCk7XG4gICAgfVxuXG4gICAgY29uc3Qgbm9OZ1pvbmU6IGJvb2xlYW4gPSB0aGlzLmdldChDb21wb25lbnRGaXh0dXJlTm9OZ1pvbmUsIGZhbHNlKTtcbiAgICBjb25zdCBhdXRvRGV0ZWN0OiBib29sZWFuID0gdGhpcy5nZXQoQ29tcG9uZW50Rml4dHVyZUF1dG9EZXRlY3QsIGZhbHNlKTtcbiAgICBjb25zdCBuZ1pvbmU6IE5nWm9uZSA9IG5vTmdab25lID8gbnVsbCA6IHRoaXMuZ2V0KE5nWm9uZSwgbnVsbCk7XG4gICAgY29uc3QgY29tcG9uZW50RmFjdG9yeSA9IG5ldyBDb21wb25lbnRGYWN0b3J5KGNvbXBvbmVudERlZik7XG4gICAgY29uc3QgaW5pdENvbXBvbmVudCA9ICgpID0+IHtcbiAgICAgIGNvbnN0IGNvbXBvbmVudFJlZiA9XG4gICAgICAgICAgY29tcG9uZW50RmFjdG9yeS5jcmVhdGUoSW5qZWN0b3IuTlVMTCwgW10sIGAjJHtyb290RWxJZH1gLCB0aGlzLl9tb2R1bGVSZWYpO1xuICAgICAgcmV0dXJuIG5ldyBDb21wb25lbnRGaXh0dXJlPGFueT4oY29tcG9uZW50UmVmLCBuZ1pvbmUsIGF1dG9EZXRlY3QpO1xuICAgIH07XG4gICAgY29uc3QgZml4dHVyZSA9IG5nWm9uZSA/IG5nWm9uZS5ydW4oaW5pdENvbXBvbmVudCkgOiBpbml0Q29tcG9uZW50KCk7XG4gICAgdGhpcy5fYWN0aXZlRml4dHVyZXMucHVzaChmaXh0dXJlKTtcbiAgICByZXR1cm4gZml4dHVyZTtcbiAgfVxuXG4gIC8vIGludGVybmFsIG1ldGhvZHNcblxuICBwcml2YXRlIF9pbml0SWZOZWVkZWQoKTogdm9pZCB7XG4gICAgdGhpcy5fY2hlY2tHbG9iYWxDb21waWxhdGlvbkZpbmlzaGVkKCk7XG4gICAgaWYgKHRoaXMuX2luc3RhbnRpYXRlZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuX3Jlc29sdmVycyA9IHRoaXMuX2dldFJlc29sdmVycygpO1xuICAgIHRoaXMuX3Rlc3RNb2R1bGVUeXBlID0gdGhpcy5fY3JlYXRlVGVzdE1vZHVsZSgpO1xuICAgIHRoaXMuX2NvbXBpbGVOZ01vZHVsZSh0aGlzLl90ZXN0TW9kdWxlVHlwZSk7XG5cbiAgICBjb25zdCBwYXJlbnRJbmplY3RvciA9IHRoaXMucGxhdGZvcm0uaW5qZWN0b3I7XG4gICAgdGhpcy5fbW9kdWxlUmVmID0gbmV3IE5nTW9kdWxlUmVmKHRoaXMuX3Rlc3RNb2R1bGVUeXBlLCBwYXJlbnRJbmplY3Rvcik7XG5cbiAgICAvLyBBcHBsaWNhdGlvbkluaXRTdGF0dXMucnVuSW5pdGlhbGl6ZXJzKCkgaXMgbWFya2VkIEBpbnRlcm5hbFxuICAgIC8vIHRvIGNvcmUuIENhc3QgaXQgdG8gYW55IGJlZm9yZSBhY2Nlc3NpbmcgaXQuXG4gICAgKHRoaXMuX21vZHVsZVJlZi5pbmplY3Rvci5nZXQoQXBwbGljYXRpb25Jbml0U3RhdHVzKSBhcyBhbnkpLnJ1bkluaXRpYWxpemVycygpO1xuICAgIHRoaXMuX2luc3RhbnRpYXRlZCA9IHRydWU7XG4gIH1cblxuICBwcml2YXRlIF9zdG9yZU5nRGVmKHByb3A6IHN0cmluZywgdHlwZTogVHlwZTxhbnk+KSB7XG4gICAgaWYgKCF0aGlzLl9pbml0aWFOZ0RlZnMuaGFzKHR5cGUpKSB7XG4gICAgICBjb25zdCBjdXJyZW50RGVmID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcih0eXBlLCBwcm9wKTtcbiAgICAgIHRoaXMuX2luaXRpYU5nRGVmcy5zZXQodHlwZSwgW3Byb3AsIGN1cnJlbnREZWZdKTtcbiAgICB9XG4gIH1cblxuICAvLyBnZXQgb3ZlcnJpZGVzIGZvciBhIHNwZWNpZmljIHByb3ZpZGVyIChpZiBhbnkpXG4gIHByaXZhdGUgX2dldFByb3ZpZGVyT3ZlcnJpZGVzKHByb3ZpZGVyOiBhbnkpIHtcbiAgICBjb25zdCB0b2tlbiA9IHByb3ZpZGVyICYmIHR5cGVvZiBwcm92aWRlciA9PT0gJ29iamVjdCcgJiYgcHJvdmlkZXIuaGFzT3duUHJvcGVydHkoJ3Byb3ZpZGUnKSA/XG4gICAgICAgIHByb3ZpZGVyLnByb3ZpZGUgOlxuICAgICAgICBwcm92aWRlcjtcbiAgICByZXR1cm4gdGhpcy5fcHJvdmlkZXJPdmVycmlkZXNCeVRva2VuLmdldCh0b2tlbikgfHwgW107XG4gIH1cblxuICAvLyBjcmVhdGVzIHJlc29sdmVycyB0YWtpbmcgb3ZlcnJpZGVzIGludG8gYWNjb3VudFxuICBwcml2YXRlIF9nZXRSZXNvbHZlcnMoKSB7XG4gICAgY29uc3QgbW9kdWxlID0gbmV3IE5nTW9kdWxlUmVzb2x2ZXIoKTtcbiAgICBtb2R1bGUuc2V0T3ZlcnJpZGVzKHRoaXMuX21vZHVsZU92ZXJyaWRlcyk7XG5cbiAgICBjb25zdCBjb21wb25lbnQgPSBuZXcgQ29tcG9uZW50UmVzb2x2ZXIoKTtcbiAgICBjb21wb25lbnQuc2V0T3ZlcnJpZGVzKHRoaXMuX2NvbXBvbmVudE92ZXJyaWRlcyk7XG5cbiAgICBjb25zdCBkaXJlY3RpdmUgPSBuZXcgRGlyZWN0aXZlUmVzb2x2ZXIoKTtcbiAgICBkaXJlY3RpdmUuc2V0T3ZlcnJpZGVzKHRoaXMuX2RpcmVjdGl2ZU92ZXJyaWRlcyk7XG5cbiAgICBjb25zdCBwaXBlID0gbmV3IFBpcGVSZXNvbHZlcigpO1xuICAgIHBpcGUuc2V0T3ZlcnJpZGVzKHRoaXMuX3BpcGVPdmVycmlkZXMpO1xuXG4gICAgcmV0dXJuIHttb2R1bGUsIGNvbXBvbmVudCwgZGlyZWN0aXZlLCBwaXBlfTtcbiAgfVxuXG4gIHByaXZhdGUgX2Fzc2VydE5vdEluc3RhbnRpYXRlZChtZXRob2ROYW1lOiBzdHJpbmcsIG1ldGhvZERlc2NyaXB0aW9uOiBzdHJpbmcpIHtcbiAgICBpZiAodGhpcy5faW5zdGFudGlhdGVkKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgYENhbm5vdCAke21ldGhvZERlc2NyaXB0aW9ufSB3aGVuIHRoZSB0ZXN0IG1vZHVsZSBoYXMgYWxyZWFkeSBiZWVuIGluc3RhbnRpYXRlZC4gYCArXG4gICAgICAgICAgYE1ha2Ugc3VyZSB5b3UgYXJlIG5vdCB1c2luZyBcXGBpbmplY3RcXGAgYmVmb3JlIFxcYCR7bWV0aG9kTmFtZX1cXGAuYCk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBfY3JlYXRlVGVzdE1vZHVsZSgpOiBOZ01vZHVsZVR5cGUge1xuICAgIGNvbnN0IHJvb3RQcm92aWRlck92ZXJyaWRlcyA9IHRoaXMuX3Jvb3RQcm92aWRlck92ZXJyaWRlcztcblxuICAgIEBOZ01vZHVsZSh7XG4gICAgICBwcm92aWRlcnM6IFsuLi5yb290UHJvdmlkZXJPdmVycmlkZXNdLFxuICAgICAgaml0OiB0cnVlLFxuICAgIH0pXG4gICAgY2xhc3MgUm9vdFNjb3BlTW9kdWxlIHtcbiAgICB9XG5cbiAgICBjb25zdCBuZ1pvbmUgPSBuZXcgTmdab25lKHtlbmFibGVMb25nU3RhY2tUcmFjZTogdHJ1ZX0pO1xuICAgIGNvbnN0IHByb3ZpZGVycyA9IFtcbiAgICAgIHtwcm92aWRlOiBOZ1pvbmUsIHVzZVZhbHVlOiBuZ1pvbmV9LFxuICAgICAge3Byb3ZpZGU6IENvbXBpbGVyLCB1c2VGYWN0b3J5OiAoKSA9PiBuZXcgUjNUZXN0Q29tcGlsZXIodGhpcyl9LFxuICAgICAgLi4udGhpcy5fcHJvdmlkZXJzLFxuICAgICAgLi4udGhpcy5fcHJvdmlkZXJPdmVycmlkZXMsXG4gICAgXTtcblxuICAgIGNvbnN0IGRlY2xhcmF0aW9ucyA9IHRoaXMuX2RlY2xhcmF0aW9ucztcbiAgICBjb25zdCBpbXBvcnRzID0gW1Jvb3RTY29wZU1vZHVsZSwgdGhpcy5uZ01vZHVsZSwgdGhpcy5faW1wb3J0c107XG4gICAgY29uc3Qgc2NoZW1hcyA9IHRoaXMuX3NjaGVtYXM7XG5cbiAgICBATmdNb2R1bGUoe3Byb3ZpZGVycywgZGVjbGFyYXRpb25zLCBpbXBvcnRzLCBzY2hlbWFzLCBqaXQ6IHRydWV9KVxuICAgIGNsYXNzIER5bmFtaWNUZXN0TW9kdWxlIHtcbiAgICB9XG5cbiAgICByZXR1cm4gRHluYW1pY1Rlc3RNb2R1bGUgYXMgTmdNb2R1bGVUeXBlO1xuICB9XG5cbiAgZ2V0IGNvbXBpbGVySW5qZWN0b3IoKTogSW5qZWN0b3Ige1xuICAgIGlmICh0aGlzLl9jb21waWxlckluamVjdG9yICE9PSBudWxsKSB7XG4gICAgICByZXR1cm4gdGhpcy5fY29tcGlsZXJJbmplY3RvcjtcbiAgICB9XG5cbiAgICBjb25zdCBwcm92aWRlcnM6IFN0YXRpY1Byb3ZpZGVyW10gPSBbXTtcbiAgICBjb25zdCBjb21waWxlck9wdGlvbnMgPSB0aGlzLnBsYXRmb3JtLmluamVjdG9yLmdldChDT01QSUxFUl9PUFRJT05TKTtcbiAgICBjb21waWxlck9wdGlvbnMuZm9yRWFjaChvcHRzID0+IHtcbiAgICAgIGlmIChvcHRzLnByb3ZpZGVycykge1xuICAgICAgICBwcm92aWRlcnMucHVzaChvcHRzLnByb3ZpZGVycyk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgcHJvdmlkZXJzLnB1c2goLi4udGhpcy5fY29tcGlsZXJQcm92aWRlcnMpO1xuXG4gICAgLy8gVE9ETyhvY29tYmUpOiBtYWtlIHRoaXMgd29yayB3aXRoIGFuIEluamVjdG9yIGRpcmVjdGx5IGluc3RlYWQgb2YgY3JlYXRpbmcgYSBtb2R1bGUgZm9yIGl0XG4gICAgQE5nTW9kdWxlKHtwcm92aWRlcnN9KVxuICAgIGNsYXNzIENvbXBpbGVyTW9kdWxlIHtcbiAgICB9XG5cbiAgICBjb25zdCBDb21waWxlck1vZHVsZUZhY3RvcnkgPSBuZXcgUjNOZ01vZHVsZUZhY3RvcnkoQ29tcGlsZXJNb2R1bGUpO1xuICAgIHRoaXMuX2NvbXBpbGVySW5qZWN0b3IgPSBDb21waWxlck1vZHVsZUZhY3RvcnkuY3JlYXRlKHRoaXMucGxhdGZvcm0uaW5qZWN0b3IpLmluamVjdG9yO1xuICAgIHJldHVybiB0aGlzLl9jb21waWxlckluamVjdG9yO1xuICB9XG5cbiAgcHJpdmF0ZSBfZ2V0TWV0YVdpdGhPdmVycmlkZXMobWV0YTogQ29tcG9uZW50fERpcmVjdGl2ZXxOZ01vZHVsZSwgdHlwZT86IFR5cGU8YW55Pikge1xuICAgIGNvbnN0IG92ZXJyaWRlczoge3Byb3ZpZGVycz86IGFueVtdLCB0ZW1wbGF0ZT86IHN0cmluZ30gPSB7fTtcbiAgICBpZiAobWV0YS5wcm92aWRlcnMgJiYgbWV0YS5wcm92aWRlcnMubGVuZ3RoKSB7XG4gICAgICAvLyBUaGVyZSBhcmUgdHdvIGZsYXR0ZW5pbmcgb3BlcmF0aW9ucyBoZXJlLiBUaGUgaW5uZXIgZmxhdHRlbigpIG9wZXJhdGVzIG9uIHRoZSBtZXRhZGF0YSdzXG4gICAgICAvLyBwcm92aWRlcnMgYW5kIGFwcGxpZXMgYSBtYXBwaW5nIGZ1bmN0aW9uIHdoaWNoIHJldHJpZXZlcyBvdmVycmlkZXMgZm9yIGVhY2ggaW5jb21pbmdcbiAgICAgIC8vIHByb3ZpZGVyLiBUaGUgb3V0ZXIgZmxhdHRlbigpIHRoZW4gZmxhdHRlbnMgdGhlIHByb2R1Y2VkIG92ZXJyaWRlcyBhcnJheS4gSWYgdGhpcyBpcyBub3RcbiAgICAgIC8vIGRvbmUsIHRoZSBhcnJheSBjYW4gY29udGFpbiBvdGhlciBlbXB0eSBhcnJheXMgKGUuZy4gYFtbXSwgW11dYCkgd2hpY2ggbGVhayBpbnRvIHRoZVxuICAgICAgLy8gcHJvdmlkZXJzIGFycmF5IGFuZCBjb250YW1pbmF0ZSBhbnkgZXJyb3IgbWVzc2FnZXMgdGhhdCBtaWdodCBiZSBnZW5lcmF0ZWQuXG4gICAgICBjb25zdCBwcm92aWRlck92ZXJyaWRlcyA9XG4gICAgICAgICAgZmxhdHRlbihmbGF0dGVuKG1ldGEucHJvdmlkZXJzLCAocHJvdmlkZXI6IGFueSkgPT4gdGhpcy5fZ2V0UHJvdmlkZXJPdmVycmlkZXMocHJvdmlkZXIpKSk7XG4gICAgICBpZiAocHJvdmlkZXJPdmVycmlkZXMubGVuZ3RoKSB7XG4gICAgICAgIG92ZXJyaWRlcy5wcm92aWRlcnMgPSBbLi4ubWV0YS5wcm92aWRlcnMsIC4uLnByb3ZpZGVyT3ZlcnJpZGVzXTtcbiAgICAgIH1cbiAgICB9XG4gICAgY29uc3QgaGFzVGVtcGxhdGVPdmVycmlkZSA9ICEhdHlwZSAmJiB0aGlzLl90ZW1wbGF0ZU92ZXJyaWRlcy5oYXModHlwZSk7XG4gICAgaWYgKGhhc1RlbXBsYXRlT3ZlcnJpZGUpIHtcbiAgICAgIG92ZXJyaWRlcy50ZW1wbGF0ZSA9IHRoaXMuX3RlbXBsYXRlT3ZlcnJpZGVzLmdldCh0eXBlICEpO1xuICAgIH1cbiAgICByZXR1cm4gT2JqZWN0LmtleXMob3ZlcnJpZGVzKS5sZW5ndGggPyB7Li4ubWV0YSwgLi4ub3ZlcnJpZGVzfSA6IG1ldGE7XG4gIH1cblxuICAvKipcbiAgICogQGludGVybmFsXG4gICAqL1xuICBfZ2V0TW9kdWxlUmVzb2x2ZXIoKSB7IHJldHVybiB0aGlzLl9yZXNvbHZlcnMubW9kdWxlOyB9XG5cbiAgLyoqXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgX2NvbXBpbGVOZ01vZHVsZShtb2R1bGVUeXBlOiBOZ01vZHVsZVR5cGUpOiB2b2lkIHtcbiAgICBjb25zdCBuZ01vZHVsZSA9IHRoaXMuX3Jlc29sdmVycy5tb2R1bGUucmVzb2x2ZShtb2R1bGVUeXBlKTtcblxuICAgIGlmIChuZ01vZHVsZSA9PT0gbnVsbCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGAke3N0cmluZ2lmeShtb2R1bGVUeXBlKX0gaGFzIG5vIEBOZ01vZHVsZSBhbm5vdGF0aW9uYCk7XG4gICAgfVxuXG4gICAgdGhpcy5fc3RvcmVOZ0RlZihOR19NT0RVTEVfREVGLCBtb2R1bGVUeXBlKTtcbiAgICB0aGlzLl9zdG9yZU5nRGVmKE5HX0lOSkVDVE9SX0RFRiwgbW9kdWxlVHlwZSk7XG4gICAgY29uc3QgbWV0YWRhdGEgPSB0aGlzLl9nZXRNZXRhV2l0aE92ZXJyaWRlcyhuZ01vZHVsZSk7XG4gICAgY29tcGlsZU5nTW9kdWxlRGVmcyhtb2R1bGVUeXBlLCBtZXRhZGF0YSk7XG5cbiAgICBjb25zdCBkZWNsYXJhdGlvbnM6IFR5cGU8YW55PltdID1cbiAgICAgICAgZmxhdHRlbihuZ01vZHVsZS5kZWNsYXJhdGlvbnMgfHwgRU1QVFlfQVJSQVksIHJlc29sdmVGb3J3YXJkUmVmKTtcbiAgICBjb25zdCBjb21waWxlZENvbXBvbmVudHM6IFR5cGU8YW55PltdID0gW107XG5cbiAgICAvLyBDb21waWxlIHRoZSBjb21wb25lbnRzLCBkaXJlY3RpdmVzIGFuZCBwaXBlcyBkZWNsYXJlZCBieSB0aGlzIG1vZHVsZVxuICAgIGRlY2xhcmF0aW9ucy5mb3JFYWNoKGRlY2xhcmF0aW9uID0+IHtcbiAgICAgIGNvbnN0IGNvbXBvbmVudCA9IHRoaXMuX3Jlc29sdmVycy5jb21wb25lbnQucmVzb2x2ZShkZWNsYXJhdGlvbik7XG4gICAgICBpZiAoY29tcG9uZW50KSB7XG4gICAgICAgIHRoaXMuX3N0b3JlTmdEZWYoTkdfQ09NUE9ORU5UX0RFRiwgZGVjbGFyYXRpb24pO1xuICAgICAgICBjb25zdCBtZXRhZGF0YSA9IHRoaXMuX2dldE1ldGFXaXRoT3ZlcnJpZGVzKGNvbXBvbmVudCwgZGVjbGFyYXRpb24pO1xuICAgICAgICBjb21waWxlQ29tcG9uZW50KGRlY2xhcmF0aW9uLCBtZXRhZGF0YSk7XG4gICAgICAgIGNvbXBpbGVkQ29tcG9uZW50cy5wdXNoKGRlY2xhcmF0aW9uKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBkaXJlY3RpdmUgPSB0aGlzLl9yZXNvbHZlcnMuZGlyZWN0aXZlLnJlc29sdmUoZGVjbGFyYXRpb24pO1xuICAgICAgaWYgKGRpcmVjdGl2ZSkge1xuICAgICAgICB0aGlzLl9zdG9yZU5nRGVmKE5HX0RJUkVDVElWRV9ERUYsIGRlY2xhcmF0aW9uKTtcbiAgICAgICAgY29uc3QgbWV0YWRhdGEgPSB0aGlzLl9nZXRNZXRhV2l0aE92ZXJyaWRlcyhkaXJlY3RpdmUpO1xuICAgICAgICBjb21waWxlRGlyZWN0aXZlKGRlY2xhcmF0aW9uLCBtZXRhZGF0YSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgY29uc3QgcGlwZSA9IHRoaXMuX3Jlc29sdmVycy5waXBlLnJlc29sdmUoZGVjbGFyYXRpb24pO1xuICAgICAgaWYgKHBpcGUpIHtcbiAgICAgICAgdGhpcy5fc3RvcmVOZ0RlZihOR19QSVBFX0RFRiwgZGVjbGFyYXRpb24pO1xuICAgICAgICBjb21waWxlUGlwZShkZWNsYXJhdGlvbiwgcGlwZSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIC8vIENvbXBpbGUgdHJhbnNpdGl2ZSBtb2R1bGVzLCBjb21wb25lbnRzLCBkaXJlY3RpdmVzIGFuZCBwaXBlc1xuICAgIGNvbnN0IGNhbGNUcmFuc2l0aXZlU2NvcGVzRm9yID0gKG1vZHVsZVR5cGU6IE5nTW9kdWxlVHlwZSkgPT4gdHJhbnNpdGl2ZVNjb3Blc0ZvcihcbiAgICAgICAgbW9kdWxlVHlwZSwgKG5nTW9kdWxlOiBOZ01vZHVsZVR5cGUpID0+IHRoaXMuX2NvbXBpbGVOZ01vZHVsZShuZ01vZHVsZSkpO1xuICAgIGNvbnN0IHRyYW5zaXRpdmVTY29wZSA9IGNhbGNUcmFuc2l0aXZlU2NvcGVzRm9yKG1vZHVsZVR5cGUpO1xuICAgIGNvbXBpbGVkQ29tcG9uZW50cy5mb3JFYWNoKGNtcCA9PiB7XG4gICAgICBjb25zdCBzY29wZSA9IHRoaXMuX3RlbXBsYXRlT3ZlcnJpZGVzLmhhcyhjbXApID9cbiAgICAgICAgICAvLyBpZiB3ZSBoYXZlIHRlbXBsYXRlIG92ZXJyaWRlIHZpYSBgVGVzdEJlZC5vdmVycmlkZVRlbXBsYXRlVXNpbmdUZXN0aW5nTW9kdWxlYCAtXG4gICAgICAgICAgLy8gZGVmaW5lIENvbXBvbmVudCBzY29wZSBhcyBUZXN0aW5nTW9kdWxlIHNjb3BlLCBpbnN0ZWFkIG9mIHRoZSBzY29wZSBvZiBOZ01vZHVsZVxuICAgICAgICAgIC8vIHdoZXJlIHRoaXMgQ29tcG9uZW50IHdhcyBkZWNsYXJlZFxuICAgICAgICAgIGNhbGNUcmFuc2l0aXZlU2NvcGVzRm9yKHRoaXMuX3Rlc3RNb2R1bGVUeXBlKSA6XG4gICAgICAgICAgdHJhbnNpdGl2ZVNjb3BlO1xuICAgICAgcGF0Y2hDb21wb25lbnREZWZXaXRoU2NvcGUoKGNtcCBhcyBhbnkpLm5nQ29tcG9uZW50RGVmLCBzY29wZSk7XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogQGludGVybmFsXG4gICAqL1xuICBfZ2V0Q29tcG9uZW50RmFjdG9yaWVzKG1vZHVsZVR5cGU6IE5nTW9kdWxlVHlwZSk6IENvbXBvbmVudEZhY3Rvcnk8YW55PltdIHtcbiAgICByZXR1cm4gbW9kdWxlVHlwZS5uZ01vZHVsZURlZi5kZWNsYXJhdGlvbnMucmVkdWNlKChmYWN0b3JpZXMsIGRlY2xhcmF0aW9uKSA9PiB7XG4gICAgICBjb25zdCBjb21wb25lbnREZWYgPSAoZGVjbGFyYXRpb24gYXMgYW55KS5uZ0NvbXBvbmVudERlZjtcbiAgICAgIGNvbXBvbmVudERlZiAmJiBmYWN0b3JpZXMucHVzaChuZXcgQ29tcG9uZW50RmFjdG9yeShjb21wb25lbnREZWYsIHRoaXMuX21vZHVsZVJlZikpO1xuICAgICAgcmV0dXJuIGZhY3RvcmllcztcbiAgICB9LCBbXSBhcyBDb21wb25lbnRGYWN0b3J5PGFueT5bXSk7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2sgd2hldGhlciB0aGUgbW9kdWxlIHNjb3BpbmcgcXVldWUgc2hvdWxkIGJlIGZsdXNoZWQsIGFuZCBmbHVzaCBpdCBpZiBuZWVkZWQuXG4gICAqXG4gICAqIFdoZW4gdGhlIFRlc3RCZWQgaXMgcmVzZXQsIGl0IGNsZWFycyB0aGUgSklUIG1vZHVsZSBjb21waWxhdGlvbiBxdWV1ZSwgY2FuY2VsbGluZyBhbnlcbiAgICogaW4tcHJvZ3Jlc3MgbW9kdWxlIGNvbXBpbGF0aW9uLiBUaGlzIGNyZWF0ZXMgYSBwb3RlbnRpYWwgaGF6YXJkIC0gdGhlIHZlcnkgZmlyc3QgdGltZSB0aGVcbiAgICogVGVzdEJlZCBpcyBpbml0aWFsaXplZCAob3IgaWYgaXQncyByZXNldCB3aXRob3V0IGJlaW5nIGluaXRpYWxpemVkKSwgdGhlcmUgbWF5IGJlIHBlbmRpbmdcbiAgICogY29tcGlsYXRpb25zIG9mIG1vZHVsZXMgZGVjbGFyZWQgaW4gZ2xvYmFsIHNjb3BlLiBUaGVzZSBjb21waWxhdGlvbnMgc2hvdWxkIGJlIGZpbmlzaGVkLlxuICAgKlxuICAgKiBUbyBlbnN1cmUgdGhhdCBnbG9iYWxseSBkZWNsYXJlZCBtb2R1bGVzIGhhdmUgdGhlaXIgY29tcG9uZW50cyBzY29wZWQgcHJvcGVybHksIHRoaXMgZnVuY3Rpb25cbiAgICogaXMgY2FsbGVkIHdoZW5ldmVyIFRlc3RCZWQgaXMgaW5pdGlhbGl6ZWQgb3IgcmVzZXQuIFRoZSBfZmlyc3RfIHRpbWUgdGhhdCB0aGlzIGhhcHBlbnMsIHByaW9yXG4gICAqIHRvIGFueSBvdGhlciBvcGVyYXRpb25zLCB0aGUgc2NvcGluZyBxdWV1ZSBpcyBmbHVzaGVkLlxuICAgKi9cbiAgcHJpdmF0ZSBfY2hlY2tHbG9iYWxDb21waWxhdGlvbkZpbmlzaGVkKCk6IHZvaWQge1xuICAgIC8vICF0aGlzLl9pbnN0YW50aWF0ZWQgc2hvdWxkIG5vdCBiZSBuZWNlc3NhcnksIGJ1dCBpcyBsZWZ0IGluIGFzIGFuIGFkZGl0aW9uYWwgZ3VhcmQgdGhhdFxuICAgIC8vIGNvbXBpbGF0aW9ucyBxdWV1ZWQgaW4gdGVzdHMgKGFmdGVyIGluc3RhbnRpYXRpb24pIGFyZSBuZXZlciBmbHVzaGVkIGFjY2lkZW50YWxseS5cbiAgICBpZiAoIXRoaXMuX2dsb2JhbENvbXBpbGF0aW9uQ2hlY2tlZCAmJiAhdGhpcy5faW5zdGFudGlhdGVkKSB7XG4gICAgICBmbHVzaE1vZHVsZVNjb3BpbmdRdWV1ZUFzTXVjaEFzUG9zc2libGUoKTtcbiAgICB9XG4gICAgdGhpcy5fZ2xvYmFsQ29tcGlsYXRpb25DaGVja2VkID0gdHJ1ZTtcbiAgfVxufVxuXG5sZXQgdGVzdEJlZDogVGVzdEJlZFJlbmRlcjM7XG5cbmV4cG9ydCBmdW5jdGlvbiBfZ2V0VGVzdEJlZFJlbmRlcjMoKTogVGVzdEJlZFJlbmRlcjMge1xuICByZXR1cm4gdGVzdEJlZCA9IHRlc3RCZWQgfHwgbmV3IFRlc3RCZWRSZW5kZXIzKCk7XG59XG5cbmZ1bmN0aW9uIGZsYXR0ZW48VD4odmFsdWVzOiBhbnlbXSwgbWFwRm4/OiAodmFsdWU6IFQpID0+IGFueSk6IFRbXSB7XG4gIGNvbnN0IG91dDogVFtdID0gW107XG4gIHZhbHVlcy5mb3JFYWNoKHZhbHVlID0+IHtcbiAgICBpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHtcbiAgICAgIG91dC5wdXNoKC4uLmZsYXR0ZW48VD4odmFsdWUsIG1hcEZuKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG91dC5wdXNoKG1hcEZuID8gbWFwRm4odmFsdWUpIDogdmFsdWUpO1xuICAgIH1cbiAgfSk7XG4gIHJldHVybiBvdXQ7XG59XG5cbmZ1bmN0aW9uIGlzTmdNb2R1bGU8VD4odmFsdWU6IFR5cGU8VD4pOiB2YWx1ZSBpcyBUeXBlPFQ+JntuZ01vZHVsZURlZjogTmdNb2R1bGVEZWY8VD59IHtcbiAgcmV0dXJuICh2YWx1ZSBhc3tuZ01vZHVsZURlZj86IE5nTW9kdWxlRGVmPFQ+fSkubmdNb2R1bGVEZWYgIT09IHVuZGVmaW5lZDtcbn1cblxuY2xhc3MgUjNUZXN0Q29tcGlsZXIgaW1wbGVtZW50cyBDb21waWxlciB7XG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgdGVzdEJlZDogVGVzdEJlZFJlbmRlcjMpIHt9XG5cbiAgY29tcGlsZU1vZHVsZVN5bmM8VD4obW9kdWxlVHlwZTogVHlwZTxUPik6IE5nTW9kdWxlRmFjdG9yeTxUPiB7XG4gICAgdGhpcy50ZXN0QmVkLl9jb21waWxlTmdNb2R1bGUobW9kdWxlVHlwZSBhcyBOZ01vZHVsZVR5cGU8VD4pO1xuICAgIHJldHVybiBuZXcgUjNOZ01vZHVsZUZhY3RvcnkobW9kdWxlVHlwZSk7XG4gIH1cblxuICBjb21waWxlTW9kdWxlQXN5bmM8VD4obW9kdWxlVHlwZTogVHlwZTxUPik6IFByb21pc2U8TmdNb2R1bGVGYWN0b3J5PFQ+PiB7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh0aGlzLmNvbXBpbGVNb2R1bGVTeW5jKG1vZHVsZVR5cGUpKTtcbiAgfVxuXG4gIGNvbXBpbGVNb2R1bGVBbmRBbGxDb21wb25lbnRzU3luYzxUPihtb2R1bGVUeXBlOiBUeXBlPFQ+KTogTW9kdWxlV2l0aENvbXBvbmVudEZhY3RvcmllczxUPiB7XG4gICAgY29uc3QgbmdNb2R1bGVGYWN0b3J5ID0gdGhpcy5jb21waWxlTW9kdWxlU3luYyhtb2R1bGVUeXBlKTtcbiAgICBjb25zdCBjb21wb25lbnRGYWN0b3JpZXMgPSB0aGlzLnRlc3RCZWQuX2dldENvbXBvbmVudEZhY3Rvcmllcyhtb2R1bGVUeXBlIGFzIE5nTW9kdWxlVHlwZTxUPik7XG4gICAgcmV0dXJuIG5ldyBNb2R1bGVXaXRoQ29tcG9uZW50RmFjdG9yaWVzKG5nTW9kdWxlRmFjdG9yeSwgY29tcG9uZW50RmFjdG9yaWVzKTtcbiAgfVxuXG4gIGNvbXBpbGVNb2R1bGVBbmRBbGxDb21wb25lbnRzQXN5bmM8VD4obW9kdWxlVHlwZTogVHlwZTxUPik6XG4gICAgICBQcm9taXNlPE1vZHVsZVdpdGhDb21wb25lbnRGYWN0b3JpZXM8VD4+IHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHRoaXMuY29tcGlsZU1vZHVsZUFuZEFsbENvbXBvbmVudHNTeW5jKG1vZHVsZVR5cGUpKTtcbiAgfVxuXG4gIGNsZWFyQ2FjaGUoKTogdm9pZCB7fVxuXG4gIGNsZWFyQ2FjaGVGb3IodHlwZTogVHlwZTxhbnk+KTogdm9pZCB7fVxuXG4gIGdldE1vZHVsZUlkKG1vZHVsZVR5cGU6IFR5cGU8YW55Pik6IHN0cmluZ3x1bmRlZmluZWQge1xuICAgIGNvbnN0IG1ldGEgPSB0aGlzLnRlc3RCZWQuX2dldE1vZHVsZVJlc29sdmVyKCkucmVzb2x2ZShtb2R1bGVUeXBlKTtcbiAgICByZXR1cm4gbWV0YSAmJiBtZXRhLmlkIHx8IHVuZGVmaW5lZDtcbiAgfVxufVxuIl19