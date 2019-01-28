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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicjNfdGVzdF9iZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3Rlc3Rpbmcvc3JjL3IzX3Rlc3RfYmVkLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7OztBQVlBLE9BQU8sRUFDTCxxQkFBcUIsRUFDckIsUUFBUSxFQUdSLFFBQVEsRUFDUiw0QkFBNEIsRUFDNUIsUUFBUSxFQUVSLE1BQU0sRUFNTixpQkFBaUIsRUFFakIsaUJBQWlCLElBQUksZ0JBQWdCLEVBQ3JDLGlCQUFpQixJQUFJLGdCQUFnQixFQUNyQyxnQkFBZ0IsSUFBSSxlQUFlLEVBQ25DLGNBQWMsSUFBSSxhQUFhLEVBQy9CLFlBQVksSUFBSSxXQUFXLEVBRTNCLGdCQUFnQixJQUFJLGlCQUFpQixFQUVyQyx3QkFBd0IsSUFBSSxnQkFBZ0IsRUFDNUMsbUJBQW1CLElBQUksV0FBVyxFQUNsQyxpQkFBaUIsSUFBSSxnQkFBZ0IsRUFDckMsaUJBQWlCLElBQUksZ0JBQWdCLEVBQ3JDLG9CQUFvQixJQUFJLG1CQUFtQixFQUMzQyxZQUFZLElBQUksV0FBVyxFQUMzQixpQkFBaUIsSUFBSSxnQkFBZ0IsRUFDckMsd0NBQXdDLElBQUksdUNBQXVDLEVBQ25GLDJCQUEyQixJQUFJLDBCQUEwQixFQUN6RCx3QkFBd0IsSUFBSSx1QkFBdUIsRUFDbkQsVUFBVSxJQUFJLFNBQVMsRUFDdkIsb0JBQW9CLElBQUksbUJBQW1CLEVBRzNDLGdCQUFnQixHQUNqQixNQUFNLGVBQWUsQ0FBQzs7QUFFdkIsT0FBTyxFQUFDLGNBQWMsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBRWpELE9BQU8sRUFBQyx3Q0FBd0MsRUFBRSx3QkFBd0IsRUFBRSx5QkFBeUIsRUFBQyxNQUFNLHFDQUFxQyxDQUFDO0FBQ2xKLE9BQU8sRUFBQyxnQkFBZ0IsRUFBQyxNQUFNLHFCQUFxQixDQUFDO0FBRXJELE9BQU8sRUFBQyxpQkFBaUIs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QyxlQUFlLEVBQUUsa0JBQWtCLENBQUMsQ0FBQztJQUMvRSxDQUFDOzs7Ozs7SUFFRCxrQ0FBa0MsQ0FBSSxVQUFtQjtRQUV2RCxPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLGlDQUFpQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7SUFDN0UsQ0FBQzs7OztJQUVELFVBQVUsS0FBVSxDQUFDOzs7OztJQUVyQixhQUFhLENBQUMsSUFBZSxJQUFTLENBQUM7Ozs7O0lBRXZDLFdBQVcsQ0FBQyxVQUFxQjs7Y0FDekIsSUFBSSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsa0JBQWtCLEVBQUUsQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDO1FBQ2xFLE9BQU8sSUFBSSxJQUFJLElBQUksQ0FBQyxFQUFFLElBQUksU0FBUyxDQUFDO0lBQ3RDLENBQUM7Q0FDRjs7Ozs7O0lBOUJhLGlDQUErQiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuLy8gVGhlIGZvcm1hdHRlciBhbmQgQ0kgZGlzYWdyZWUgb24gaG93IHRoaXMgaW1wb3J0IHN0YXRlbWVudCBzaG91bGQgYmUgZm9ybWF0dGVkLiBCb3RoIHRyeSB0byBrZWVwXG4vLyBpdCBvbiBvbmUgbGluZSwgdG9vLCB3aGljaCBoYXMgZ290dGVuIHZlcnkgaGFyZCB0byByZWFkICYgbWFuYWdlLiBTbyBkaXNhYmxlIHRoZSBmb3JtYXR0ZXIgZm9yXG4vLyB0aGlzIHN0YXRlbWVudCBvbmx5LlxuLy8gY2xhbmctZm9ybWF0IG9mZlxuaW1wb3J0IHtcbiAgQXBwbGljYXRpb25Jbml0U3RhdHVzLFxuICBDb21waWxlcixcbiAgQ29tcG9uZW50LFxuICBEaXJlY3RpdmUsXG4gIEluamVjdG9yLFxuICBNb2R1bGVXaXRoQ29tcG9uZW50RmFjdG9yaWVzLFxuICBOZ01vZHVsZSxcbiAgTmdNb2R1bGVGYWN0b3J5LFxuICBOZ1pvbmUsXG4gIFBpcGUsXG4gIFBsYXRmb3JtUmVmLFxuICBQcm92aWRlcixcbiAgU2NoZW1hTWV0YWRhdGEsXG4gIFR5cGUsXG4gIHJlc29sdmVGb3J3YXJkUmVmLFxuICDJtUluamVjdGFibGVEZWYgYXMgSW5qZWN0YWJsZURlZixcbiAgybVOR19DT01QT05FTlRfREVGIGFzIE5HX0NPTVBPTkVOVF9ERUYsXG4gIMm1TkdfRElSRUNUSVZFX0RFRiBhcyBOR19ESVJFQ1RJVkVfREVGLFxuICDJtU5HX0lOSkVDVE9SX0RFRiBhcyBOR19JTkpFQ1RPUl9ERUYsXG4gIMm1TkdfTU9EVUxFX0RFRiBhcyBOR19NT0RVTEVfREVGLFxuICDJtU5HX1BJUEVfREVGIGFzIE5HX1BJUEVfREVGLFxuICDJtU5nTW9kdWxlRGVmIGFzIE5nTW9kdWxlRGVmLFxuICDJtU5nTW9kdWxlRmFjdG9yeSBhcyBSM05nTW9kdWxlRmFjdG9yeSxcbiAgybVOZ01vZHVsZVR5cGUgYXMgTmdNb2R1bGVUeXBlLFxuICDJtVJlbmRlcjNDb21wb25lbnRGYWN0b3J5IGFzIENvbXBvbmVudEZhY3RvcnksXG4gIMm1UmVuZGVyM05nTW9kdWxlUmVmIGFzIE5nTW9kdWxlUmVmLFxuICDJtWNvbXBpbGVDb21wb25lbnQgYXMgY29tcGlsZUNvbXBvbmVudCxcbiAgybVjb21waWxlRGlyZWN0aXZlIGFzIGNvbXBpbGVEaXJlY3RpdmUsXG4gIMm1Y29tcGlsZU5nTW9kdWxlRGVmcyBhcyBjb21waWxlTmdNb2R1bGVEZWZzLFxuICDJtWNvbXBpbGVQaXBlIGFzIGNvbXBpbGVQaXBlLFxuICDJtWdldEluamVjdGFibGVEZWYgYXMgZ2V0SW5qZWN0YWJsZURlZixcbiAgybVmbHVzaE1vZHVsZVNjb3BpbmdRdWV1ZUFzTXVjaEFzUG9zc2libGUgYXMgZmx1c2hNb2R1bGVTY29waW5nUXVldWVBc011Y2hBc1Bvc3NpYmxlLFxuICDJtXBhdGNoQ29tcG9uZW50RGVmV2l0aFNjb3BlIGFzIHBhdGNoQ29tcG9uZW50RGVmV2l0aFNjb3BlLFxuICDJtXJlc2V0Q29tcGlsZWRDb21wb25lbnRzIGFzIHJlc2V0Q29tcGlsZWRDb21wb25lbnRzLFxuICDJtXN0cmluZ2lmeSBhcyBzdHJpbmdpZnksXG4gIMm1dHJhbnNpdGl2ZVNjb3Blc0ZvciBhcyB0cmFuc2l0aXZlU2NvcGVzRm9yLFxuICBDb21waWxlck9wdGlvbnMsXG4gIFN0YXRpY1Byb3ZpZGVyLFxuICBDT01QSUxFUl9PUFRJT05TLFxufSBmcm9tICdAYW5ndWxhci9jb3JlJztcbi8vIGNsYW5nLWZvcm1hdCBvblxuaW1wb3J0IHtSZXNvdXJjZUxvYWRlcn0gZnJvbSAnQGFuZ3VsYXIvY29tcGlsZXInO1xuXG5pbXBvcnQge2NsZWFyUmVzb2x1dGlvbk9mQ29tcG9uZW50UmVzb3VyY2VzUXVldWUsIGNvbXBvbmVudE5lZWRzUmVzb2x1dGlvbiwgcmVzb2x2ZUNvbXBvbmVudFJlc291cmNlc30gZnJvbSAnLi4vLi4vc3JjL21ldGFkYXRhL3Jlc291cmNlX2xvYWRpbmcnO1xuaW1wb3J0IHtDb21wb25lbnRGaXh0dXJlfSBmcm9tICcuL2NvbXBvbmVudF9maXh0dXJlJztcbmltcG9ydCB7TWV0YWRhdGFPdmVycmlkZX0gZnJvbSAnLi9tZXRhZGF0YV9vdmVycmlkZSc7XG5pbXBvcnQge0NvbXBvbmVudFJlc29sdmVyLCBEaXJlY3RpdmVSZXNvbHZlciwgTmdNb2R1bGVSZXNvbHZlciwgUGlwZVJlc29sdmVyLCBSZXNvbHZlcn0gZnJvbSAnLi9yZXNvbHZlcnMnO1xuaW1wb3J0IHtUZXN0QmVkfSBmcm9tICcuL3Rlc3RfYmVkJztcbmltcG9ydCB7Q29tcG9uZW50Rml4dHVyZUF1dG9EZXRlY3QsIENvbXBvbmVudEZpeHR1cmVOb05nWm9uZSwgVGVzdEJlZFN0YXRpYywgVGVzdENvbXBvbmVudFJlbmRlcmVyLCBUZXN0TW9kdWxlTWV0YWRhdGF9IGZyb20gJy4vdGVzdF9iZWRfY29tbW9uJztcblxubGV0IF9uZXh0Um9vdEVsZW1lbnRJZCA9IDA7XG5cbmNvbnN0IEVNUFRZX0FSUkFZOiBUeXBlPGFueT5bXSA9IFtdO1xuXG5jb25zdCBVTkRFRklORUQ6IFN5bWJvbCA9IFN5bWJvbCgnVU5ERUZJTkVEJyk7XG5cbi8vIFJlc29sdmVycyBmb3IgQW5ndWxhciBkZWNvcmF0b3JzXG50eXBlIFJlc29sdmVycyA9IHtcbiAgbW9kdWxlOiBSZXNvbHZlcjxOZ01vZHVsZT4sXG4gIGNvbXBvbmVudDogUmVzb2x2ZXI8RGlyZWN0aXZlPixcbiAgZGlyZWN0aXZlOiBSZXNvbHZlcjxDb21wb25lbnQ+LFxuICBwaXBlOiBSZXNvbHZlcjxQaXBlPixcbn07XG5cbi8qKlxuICogQGRlc2NyaXB0aW9uXG4gKiBDb25maWd1cmVzIGFuZCBpbml0aWFsaXplcyBlbnZpcm9ubWVudCBmb3IgdW5pdCB0ZXN0aW5nIGFuZCBwcm92aWRlcyBtZXRob2RzIGZvclxuICogY3JlYXRpbmcgY29tcG9uZW50cyBhbmQgc2VydmljZXMgaW4gdW5pdCB0ZXN0cy5cbiAqXG4gKiBUZXN0QmVkIGlzIHRoZSBwcmltYXJ5IGFwaSBmb3Igd3JpdGluZyB1bml0IHRlc3RzIGZvciBBbmd1bGFyIGFwcGxpY2F0aW9ucyBhbmQgbGlicmFyaWVzLlxuICpcbiAqIE5vdGU6IFVzZSBgVGVzdEJlZGAgaW4gdGVzdHMuIEl0IHdpbGwgYmUgc2V0IHRvIGVpdGhlciBgVGVzdEJlZFZpZXdFbmdpbmVgIG9yIGBUZXN0QmVkUmVuZGVyM2BcbiAqIGFjY29yZGluZyB0byB0aGUgY29tcGlsZXIgdXNlZC5cbiAqL1xuZXhwb3J0IGNsYXNzIFRlc3RCZWRSZW5kZXIzIGltcGxlbWVudHMgSW5qZWN0b3IsIFRlc3RCZWQge1xuICAvKipcbiAgICogSW5pdGlhbGl6ZSB0aGUgZW52aXJvbm1lbnQgZm9yIHRlc3Rpbmcgd2l0aCBhIGNvbXBpbGVyIGZhY3RvcnksIGEgUGxhdGZvcm1SZWYsIGFuZCBhblxuICAgKiBhbmd1bGFyIG1vZHVsZS4gVGhlc2UgYXJlIGNvbW1vbiB0byBldmVyeSB0ZXN0IGluIHRoZSBzdWl0ZS5cbiAgICpcbiAgICogVGhpcyBtYXkgb25seSBiZSBjYWxsZWQgb25jZSwgdG8gc2V0IHVwIHRoZSBjb21tb24gcHJvdmlkZXJzIGZvciB0aGUgY3VycmVudCB0ZXN0XG4gICAqIHN1aXRlIG9uIHRoZSBjdXJyZW50IHBsYXRmb3JtLiBJZiB5b3UgYWJzb2x1dGVseSBuZWVkIHRvIGNoYW5nZSB0aGUgcHJvdmlkZXJzLFxuICAgKiBmaXJzdCB1c2UgYHJlc2V0VGVzdEVudmlyb25tZW50YC5cbiAgICpcbiAgICogVGVzdCBtb2R1bGVzIGFuZCBwbGF0Zm9ybXMgZm9yIGluZGl2aWR1YWwgcGxhdGZvcm1zIGFyZSBhdmFpbGFibGUgZnJvbVxuICAgKiAnQGFuZ3VsYXIvPHBsYXRmb3JtX25hbWU+L3Rlc3RpbmcnLlxuICAgKlxuICAgKiBAcHVibGljQXBpXG4gICAqL1xuICBzdGF0aWMgaW5pdFRlc3RFbnZpcm9ubWVudChcbiAgICAgIG5nTW9kdWxlOiBUeXBlPGFueT58VHlwZTxhbnk+W10sIHBsYXRmb3JtOiBQbGF0Zm9ybVJlZiwgYW90U3VtbWFyaWVzPzogKCkgPT4gYW55W10pOiBUZXN0QmVkIHtcbiAgICBjb25zdCB0ZXN0QmVkID0gX2dldFRlc3RCZWRSZW5kZXIzKCk7XG4gICAgdGVzdEJlZC5pbml0VGVzdEVudmlyb25tZW50KG5nTW9kdWxlLCBwbGF0Zm9ybSwgYW90U3VtbWFyaWVzKTtcbiAgICByZXR1cm4gdGVzdEJlZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXNldCB0aGUgcHJvdmlkZXJzIGZvciB0aGUgdGVzdCBpbmplY3Rvci5cbiAgICpcbiAgICogQHB1YmxpY0FwaVxuICAgKi9cbiAgc3RhdGljIHJlc2V0VGVzdEVudmlyb25tZW50KCk6IHZvaWQgeyBfZ2V0VGVzdEJlZFJlbmRlcjMoKS5yZXNldFRlc3RFbnZpcm9ubWVudCgpOyB9XG5cbiAgc3RhdGljIGNvbmZpZ3VyZUNvbXBpbGVyKGNvbmZpZzoge3Byb3ZpZGVycz86IGFueVtdOyB1c2VKaXQ/OiBib29sZWFuO30pOiBUZXN0QmVkU3RhdGljIHtcbiAgICBfZ2V0VGVzdEJlZFJlbmRlcjMoKS5jb25maWd1cmVDb21waWxlcihjb25maWcpO1xuICAgIHJldHVybiBUZXN0QmVkUmVuZGVyMyBhcyBhbnkgYXMgVGVzdEJlZFN0YXRpYztcbiAgfVxuXG4gIC8qKlxuICAgKiBBbGxvd3Mgb3ZlcnJpZGluZyBkZWZhdWx0IHByb3ZpZGVycywgZGlyZWN0aXZlcywgcGlwZXMsIG1vZHVsZXMgb2YgdGhlIHRlc3QgaW5qZWN0b3IsXG4gICAqIHdoaWNoIGFyZSBkZWZpbmVkIGluIHRlc3RfaW5qZWN0b3IuanNcbiAgICovXG4gIHN0YXRpYyBjb25maWd1cmVUZXN0aW5nTW9kdWxlKG1vZHVsZURlZjogVGVzdE1vZHVsZU1ldGFkYXRhKTogVGVzdEJlZFN0YXRpYyB7XG4gICAgX2dldFRlc3RCZWRSZW5kZXIzKCkuY29uZmlndXJlVGVzdGluZ01vZHVsZShtb2R1bGVEZWYpO1xuICAgIHJldHVybiBUZXN0QmVkUmVuZGVyMyBhcyBhbnkgYXMgVGVzdEJlZFN0YXRpYztcbiAgfVxuXG4gIC8qKlxuICAgKiBDb21waWxlIGNvbXBvbmVudHMgd2l0aCBhIGB0ZW1wbGF0ZVVybGAgZm9yIHRoZSB0ZXN0J3MgTmdNb2R1bGUuXG4gICAqIEl0IGlzIG5lY2Vzc2FyeSB0byBjYWxsIHRoaXMgZnVuY3Rpb25cbiAgICogYXMgZmV0Y2hpbmcgdXJscyBpcyBhc3luY2hyb25vdXMuXG4gICAqL1xuICBzdGF0aWMgY29tcGlsZUNvbXBvbmVudHMoKTogUHJvbWlzZTxhbnk+IHsgcmV0dXJuIF9nZXRUZXN0QmVkUmVuZGVyMygpLmNvbXBpbGVDb21wb25lbnRzKCk7IH1cblxuICBzdGF0aWMgb3ZlcnJpZGVNb2R1bGUobmdNb2R1bGU6IFR5cGU8YW55Piwgb3ZlcnJpZGU6IE1ldGFkYXRhT3ZlcnJpZGU8TmdNb2R1bGU+KTogVGVzdEJlZFN0YXRpYyB7XG4gICAgX2dldFRlc3RCZWRSZW5kZXIzKCkub3ZlcnJpZGVNb2R1bGUobmdNb2R1bGUsIG92ZXJyaWRlKTtcbiAgICByZXR1cm4gVGVzdEJlZFJlbmRlcjMgYXMgYW55IGFzIFRlc3RCZWRTdGF0aWM7XG4gIH1cblxuICBzdGF0aWMgb3ZlcnJpZGVDb21wb25lbnQoY29tcG9uZW50OiBUeXBlPGFueT4sIG92ZXJyaWRlOiBNZXRhZGF0YU92ZXJyaWRlPENvbXBvbmVudD4pOlxuICAgICAgVGVzdEJlZFN0YXRpYyB7XG4gICAgX2dldFRlc3RCZWRSZW5kZXIzKCkub3ZlcnJpZGVDb21wb25lbnQoY29tcG9uZW50LCBvdmVycmlkZSk7XG4gICAgcmV0dXJuIFRlc3RCZWRSZW5kZXIzIGFzIGFueSBhcyBUZXN0QmVkU3RhdGljO1xuICB9XG5cbiAgc3RhdGljIG92ZXJyaWRlRGlyZWN0aXZlKGRpcmVjdGl2ZTogVHlwZTxhbnk+LCBvdmVycmlkZTogTWV0YWRhdGFPdmVycmlkZTxEaXJlY3RpdmU+KTpcbiAgICAgIFRlc3RCZWRTdGF0aWMge1xuICAgIF9nZXRUZXN0QmVkUmVuZGVyMygpLm92ZXJyaWRlRGlyZWN0aXZlKGRpcmVjdGl2ZSwgb3ZlcnJpZGUpO1xuICAgIHJldHVybiBUZXN0QmVkUmVuZGVyMyBhcyBhbnkgYXMgVGVzdEJlZFN0YXRpYztcbiAgfVxuXG4gIHN0YXRpYyBvdmVycmlkZVBpcGUocGlwZTogVHlwZTxhbnk+LCBvdmVycmlkZTogTWV0YWRhdGFPdmVycmlkZTxQaXBlPik6IFRlc3RCZWRTdGF0aWMge1xuICAgIF9nZXRUZXN0QmVkUmVuZGVyMygpLm92ZXJyaWRlUGlwZShwaXBlLCBvdmVycmlkZSk7XG4gICAgcmV0dXJuIFRlc3RCZWRSZW5kZXIzIGFzIGFueSBhcyBUZXN0QmVkU3RhdGljO1xuICB9XG5cbiAgc3RhdGljIG92ZXJyaWRlVGVtcGxhdGUoY29tcG9uZW50OiBUeXBlPGFueT4sIHRlbXBsYXRlOiBzdHJpbmcpOiBUZXN0QmVkU3RhdGljIHtcbiAgICBfZ2V0VGVzdEJlZFJlbmRlcjMoKS5vdmVycmlkZUNvbXBvbmVudChjb21wb25lbnQsIHtzZXQ6IHt0ZW1wbGF0ZSwgdGVtcGxhdGVVcmw6IG51bGwgIX19KTtcbiAgICByZXR1cm4gVGVzdEJlZFJlbmRlcjMgYXMgYW55IGFzIFRlc3RCZWRTdGF0aWM7XG4gIH1cblxuICAvKipcbiAgICogT3ZlcnJpZGVzIHRoZSB0ZW1wbGF0ZSBvZiB0aGUgZ2l2ZW4gY29tcG9uZW50LCBjb21waWxpbmcgdGhlIHRlbXBsYXRlXG4gICAqIGluIHRoZSBjb250ZXh0IG9mIHRoZSBUZXN0aW5nTW9kdWxlLlxuICAgKlxuICAgKiBOb3RlOiBUaGlzIHdvcmtzIGZvciBKSVQgYW5kIEFPVGVkIGNvbXBvbmVudHMgYXMgd2VsbC5cbiAgICovXG4gIHN0YXRpYyBvdmVycmlkZVRlbXBsYXRlVXNpbmdUZXN0aW5nTW9kdWxlKGNvbXBvbmVudDogVHlwZTxhbnk+LCB0ZW1wbGF0ZTogc3RyaW5nKTogVGVzdEJlZFN0YXRpYyB7XG4gICAgX2dldFRlc3RCZWRSZW5kZXIzKCkub3ZlcnJpZGVUZW1wbGF0ZVVzaW5nVGVzdGluZ01vZHVsZShjb21wb25lbnQsIHRlbXBsYXRlKTtcbiAgICByZXR1cm4gVGVzdEJlZFJlbmRlcjMgYXMgYW55IGFzIFRlc3RCZWRTdGF0aWM7XG4gIH1cblxuICBvdmVycmlkZVRlbXBsYXRlVXNpbmdUZXN0aW5nTW9kdWxlKGNvbXBvbmVudDogVHlwZTxhbnk+LCB0ZW1wbGF0ZTogc3RyaW5nKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuX2luc3RhbnRpYXRlZCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgICdDYW5ub3Qgb3ZlcnJpZGUgdGVtcGxhdGUgd2hlbiB0aGUgdGVzdCBtb2R1bGUgaGFzIGFscmVhZHkgYmVlbiBpbnN0YW50aWF0ZWQnKTtcbiAgICB9XG4gICAgdGhpcy5fdGVtcGxhdGVPdmVycmlkZXMuc2V0KGNvbXBvbmVudCwgdGVtcGxhdGUpO1xuICB9XG5cbiAgc3RhdGljIG92ZXJyaWRlUHJvdmlkZXIodG9rZW46IGFueSwgcHJvdmlkZXI6IHtcbiAgICB1c2VGYWN0b3J5OiBGdW5jdGlvbixcbiAgICBkZXBzOiBhbnlbXSxcbiAgfSk6IFRlc3RCZWRTdGF0aWM7XG4gIHN0YXRpYyBvdmVycmlkZVByb3ZpZGVyKHRva2VuOiBhbnksIHByb3ZpZGVyOiB7dXNlVmFsdWU6IGFueTt9KTogVGVzdEJlZFN0YXRpYztcbiAgc3RhdGljIG92ZXJyaWRlUHJvdmlkZXIodG9rZW46IGFueSwgcHJvdmlkZXI6IHtcbiAgICB1c2VGYWN0b3J5PzogRnVuY3Rpb24sXG4gICAgdXNlVmFsdWU/OiBhbnksXG4gICAgZGVwcz86IGFueVtdLFxuICB9KTogVGVzdEJlZFN0YXRpYyB7XG4gICAgX2dldFRlc3RCZWRSZW5kZXIzKCkub3ZlcnJpZGVQcm92aWRlcih0b2tlbiwgcHJvdmlkZXIpO1xuICAgIHJldHVybiBUZXN0QmVkUmVuZGVyMyBhcyBhbnkgYXMgVGVzdEJlZFN0YXRpYztcbiAgfVxuXG4gIC8qKlxuICAgKiBPdmVyd3JpdGVzIGFsbCBwcm92aWRlcnMgZm9yIHRoZSBnaXZlbiB0b2tlbiB3aXRoIHRoZSBnaXZlbiBwcm92aWRlciBkZWZpbml0aW9uLlxuICAgKlxuICAgKiBAZGVwcmVjYXRlZCBhcyBpdCBtYWtlcyBhbGwgTmdNb2R1bGVzIGxhenkuIEludHJvZHVjZWQgb25seSBmb3IgbWlncmF0aW5nIG9mZiBvZiBpdC5cbiAgICovXG4gIHN0YXRpYyBkZXByZWNhdGVkT3ZlcnJpZGVQcm92aWRlcih0b2tlbjogYW55LCBwcm92aWRlcjoge1xuICAgIHVzZUZhY3Rvcnk6IEZ1bmN0aW9uLFxuICAgIGRlcHM6IGFueVtdLFxuICB9KTogdm9pZDtcbiAgc3RhdGljIGRlcHJlY2F0ZWRPdmVycmlkZVByb3ZpZGVyKHRva2VuOiBhbnksIHByb3ZpZGVyOiB7dXNlVmFsdWU6IGFueTt9KTogdm9pZDtcbiAgc3RhdGljIGRlcHJlY2F0ZWRPdmVycmlkZVByb3ZpZGVyKHRva2VuOiBhbnksIHByb3ZpZGVyOiB7XG4gICAgdXNlRmFjdG9yeT86IEZ1bmN0aW9uLFxuICAgIHVzZVZhbHVlPzogYW55LFxuICAgIGRlcHM/OiBhbnlbXSxcbiAgfSk6IFRlc3RCZWRTdGF0aWMge1xuICAgIHRocm93IG5ldyBFcnJvcignUmVuZGVyM1Rlc3RCZWQuZGVwcmVjYXRlZE92ZXJyaWRlUHJvdmlkZXIgaXMgbm90IGltcGxlbWVudGVkJyk7XG4gIH1cblxuICBzdGF0aWMgZ2V0KHRva2VuOiBhbnksIG5vdEZvdW5kVmFsdWU6IGFueSA9IEluamVjdG9yLlRIUk9XX0lGX05PVF9GT1VORCk6IGFueSB7XG4gICAgcmV0dXJuIF9nZXRUZXN0QmVkUmVuZGVyMygpLmdldCh0b2tlbiwgbm90Rm91bmRWYWx1ZSk7XG4gIH1cblxuICBzdGF0aWMgY3JlYXRlQ29tcG9uZW50PFQ+KGNvbXBvbmVudDogVHlwZTxUPik6IENvbXBvbmVudEZpeHR1cmU8VD4ge1xuICAgIHJldHVybiBfZ2V0VGVzdEJlZFJlbmRlcjMoKS5jcmVhdGVDb21wb25lbnQoY29tcG9uZW50KTtcbiAgfVxuXG4gIHN0YXRpYyByZXNldFRlc3RpbmdNb2R1bGUoKTogVGVzdEJlZFN0YXRpYyB7XG4gICAgX2dldFRlc3RCZWRSZW5kZXIzKCkucmVzZXRUZXN0aW5nTW9kdWxlKCk7XG4gICAgcmV0dXJuIFRlc3RCZWRSZW5kZXIzIGFzIGFueSBhcyBUZXN0QmVkU3RhdGljO1xuICB9XG5cbiAgLy8gUHJvcGVydGllc1xuXG4gIHBsYXRmb3JtOiBQbGF0Zm9ybVJlZiA9IG51bGwgITtcbiAgbmdNb2R1bGU6IFR5cGU8YW55PnxUeXBlPGFueT5bXSA9IG51bGwgITtcblxuICAvLyBtZXRhZGF0YSBvdmVycmlkZXNcbiAgcHJpdmF0ZSBfbW9kdWxlT3ZlcnJpZGVzOiBbVHlwZTxhbnk+LCBNZXRhZGF0YU92ZXJyaWRlPE5nTW9kdWxlPl1bXSA9IFtdO1xuICBwcml2YXRlIF9jb21wb25lbnRPdmVycmlkZXM6IFtUeXBlPGFueT4sIE1ldGFkYXRhT3ZlcnJpZGU8Q29tcG9uZW50Pl1bXSA9IFtdO1xuICBwcml2YXRlIF9kaXJlY3RpdmVPdmVycmlkZXM6IFtUeXBlPGFueT4sIE1ldGFkYXRhT3ZlcnJpZGU8RGlyZWN0aXZlPl1bXSA9IFtdO1xuICBwcml2YXRlIF9waXBlT3ZlcnJpZGVzOiBbVHlwZTxhbnk+LCBNZXRhZGF0YU92ZXJyaWRlPFBpcGU+XVtdID0gW107XG4gIHByaXZhdGUgX3Byb3ZpZGVyT3ZlcnJpZGVzOiBQcm92aWRlcltdID0gW107XG4gIHByaXZhdGUgX2NvbXBpbGVyUHJvdmlkZXJzOiBTdGF0aWNQcm92aWRlcltdID0gW107XG4gIHByaXZhdGUgX3Jvb3RQcm92aWRlck92ZXJyaWRlczogUHJvdmlkZXJbXSA9IFtdO1xuICBwcml2YXRlIF9wcm92aWRlck92ZXJyaWRlc0J5VG9rZW46IE1hcDxhbnksIFByb3ZpZGVyW10+ID0gbmV3IE1hcCgpO1xuICBwcml2YXRlIF90ZW1wbGF0ZU92ZXJyaWRlczogTWFwPFR5cGU8YW55Piwgc3RyaW5nPiA9IG5ldyBNYXAoKTtcbiAgcHJpdmF0ZSBfcmVzb2x2ZXJzOiBSZXNvbHZlcnMgPSBudWxsICE7XG5cbiAgLy8gdGVzdCBtb2R1bGUgY29uZmlndXJhdGlvblxuICBwcml2YXRlIF9wcm92aWRlcnM6IFByb3ZpZGVyW10gPSBbXTtcbiAgcHJpdmF0ZSBfY29tcGlsZXJPcHRpb25zOiBDb21waWxlck9wdGlvbnNbXSA9IFtdO1xuICBwcml2YXRlIF9kZWNsYXJhdGlvbnM6IEFycmF5PFR5cGU8YW55PnxhbnlbXXxhbnk+ID0gW107XG4gIHByaXZhdGUgX2ltcG9ydHM6IEFycmF5PFR5cGU8YW55PnxhbnlbXXxhbnk+ID0gW107XG4gIHByaXZhdGUgX3NjaGVtYXM6IEFycmF5PFNjaGVtYU1ldGFkYXRhfGFueVtdPiA9IFtdO1xuXG4gIHByaXZhdGUgX2FjdGl2ZUZpeHR1cmVzOiBDb21wb25lbnRGaXh0dXJlPGFueT5bXSA9IFtdO1xuXG4gIHByaXZhdGUgX2NvbXBpbGVySW5qZWN0b3I6IEluamVjdG9yID0gbnVsbCAhO1xuICBwcml2YXRlIF9tb2R1bGVSZWY6IE5nTW9kdWxlUmVmPGFueT4gPSBudWxsICE7XG4gIHByaXZhdGUgX3Rlc3RNb2R1bGVUeXBlOiBOZ01vZHVsZVR5cGU8YW55PiA9IG51bGwgITtcblxuICBwcml2YXRlIF9pbnN0YW50aWF0ZWQ6IGJvb2xlYW4gPSBmYWxzZTtcbiAgcHJpdmF0ZSBfZ2xvYmFsQ29tcGlsYXRpb25DaGVja2VkID0gZmFsc2U7XG5cbiAgLy8gTWFwIHRoYXQga2VlcHMgaW5pdGlhbCB2ZXJzaW9uIG9mIGNvbXBvbmVudC9kaXJlY3RpdmUvcGlwZSBkZWZzIGluIGNhc2VcbiAgLy8gd2UgY29tcGlsZSBhIFR5cGUgYWdhaW4sIHRodXMgb3ZlcnJpZGluZyByZXNwZWN0aXZlIHN0YXRpYyBmaWVsZHMuIFRoaXMgaXNcbiAgLy8gcmVxdWlyZWQgdG8gbWFrZSBzdXJlIHdlIHJlc3RvcmUgZGVmcyB0byB0aGVpciBpbml0aWFsIHN0YXRlcyBiZXR3ZWVuIHRlc3QgcnVuc1xuICBwcml2YXRlIF9pbml0aWFOZ0RlZnM6IE1hcDxUeXBlPGFueT4sIFtzdHJpbmcsIFByb3BlcnR5RGVzY3JpcHRvcnx1bmRlZmluZWRdPiA9IG5ldyBNYXAoKTtcblxuICAvKipcbiAgICogSW5pdGlhbGl6ZSB0aGUgZW52aXJvbm1lbnQgZm9yIHRlc3Rpbmcgd2l0aCBhIGNvbXBpbGVyIGZhY3RvcnksIGEgUGxhdGZvcm1SZWYsIGFuZCBhblxuICAgKiBhbmd1bGFyIG1vZHVsZS4gVGhlc2UgYXJlIGNvbW1vbiB0byBldmVyeSB0ZXN0IGluIHRoZSBzdWl0ZS5cbiAgICpcbiAgICogVGhpcyBtYXkgb25seSBiZSBjYWxsZWQgb25jZSwgdG8gc2V0IHVwIHRoZSBjb21tb24gcHJvdmlkZXJzIGZvciB0aGUgY3VycmVudCB0ZXN0XG4gICAqIHN1aXRlIG9uIHRoZSBjdXJyZW50IHBsYXRmb3JtLiBJZiB5b3UgYWJzb2x1dGVseSBuZWVkIHRvIGNoYW5nZSB0aGUgcHJvdmlkZXJzLFxuICAgKiBmaXJzdCB1c2UgYHJlc2V0VGVzdEVudmlyb25tZW50YC5cbiAgICpcbiAgICogVGVzdCBtb2R1bGVzIGFuZCBwbGF0Zm9ybXMgZm9yIGluZGl2aWR1YWwgcGxhdGZvcm1zIGFyZSBhdmFpbGFibGUgZnJvbVxuICAgKiAnQGFuZ3VsYXIvPHBsYXRmb3JtX25hbWU+L3Rlc3RpbmcnLlxuICAgKlxuICAgKiBAcHVibGljQXBpXG4gICAqL1xuICBpbml0VGVzdEVudmlyb25tZW50KFxuICAgICAgbmdNb2R1bGU6IFR5cGU8YW55PnxUeXBlPGFueT5bXSwgcGxhdGZvcm06IFBsYXRmb3JtUmVmLCBhb3RTdW1tYXJpZXM/OiAoKSA9PiBhbnlbXSk6IHZvaWQge1xuICAgIGlmICh0aGlzLnBsYXRmb3JtIHx8IHRoaXMubmdNb2R1bGUpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignQ2Fubm90IHNldCBiYXNlIHByb3ZpZGVycyBiZWNhdXNlIGl0IGhhcyBhbHJlYWR5IGJlZW4gY2FsbGVkJyk7XG4gICAgfVxuICAgIHRoaXMucGxhdGZvcm0gPSBwbGF0Zm9ybTtcbiAgICB0aGlzLm5nTW9kdWxlID0gbmdNb2R1bGU7XG4gIH1cblxuICAvKipcbiAgICogUmVzZXQgdGhlIHByb3ZpZGVycyBmb3IgdGhlIHRlc3QgaW5qZWN0b3IuXG4gICAqXG4gICAqIEBwdWJsaWNBcGlcbiAgICovXG4gIHJlc2V0VGVzdEVudmlyb25tZW50KCk6IHZvaWQge1xuICAgIHRoaXMucmVzZXRUZXN0aW5nTW9kdWxlKCk7XG4gICAgdGhpcy5wbGF0Zm9ybSA9IG51bGwgITtcbiAgICB0aGlzLm5nTW9kdWxlID0gbnVsbCAhO1xuICB9XG5cbiAgcmVzZXRUZXN0aW5nTW9kdWxlKCk6IHZvaWQge1xuICAgIHRoaXMuX2NoZWNrR2xvYmFsQ29tcGlsYXRpb25GaW5pc2hlZCgpO1xuICAgIHJlc2V0Q29tcGlsZWRDb21wb25lbnRzKCk7XG4gICAgLy8gcmVzZXQgbWV0YWRhdGEgb3ZlcnJpZGVzXG4gICAgdGhpcy5fbW9kdWxlT3ZlcnJpZGVzID0gW107XG4gICAgdGhpcy5fY29tcG9uZW50T3ZlcnJpZGVzID0gW107XG4gICAgdGhpcy5fZGlyZWN0aXZlT3ZlcnJpZGVzID0gW107XG4gICAgdGhpcy5fcGlwZU92ZXJyaWRlcyA9IFtdO1xuICAgIHRoaXMuX3Byb3ZpZGVyT3ZlcnJpZGVzID0gW107XG4gICAgdGhpcy5fcm9vdFByb3ZpZGVyT3ZlcnJpZGVzID0gW107XG4gICAgdGhpcy5fcHJvdmlkZXJPdmVycmlkZXNCeVRva2VuLmNsZWFyKCk7XG4gICAgdGhpcy5fdGVtcGxhdGVPdmVycmlkZXMuY2xlYXIoKTtcbiAgICB0aGlzLl9yZXNvbHZlcnMgPSBudWxsICE7XG5cbiAgICAvLyByZXNldCB0ZXN0IG1vZHVsZSBjb25maWdcbiAgICB0aGlzLl9wcm92aWRlcnMgPSBbXTtcbiAgICB0aGlzLl9jb21waWxlck9wdGlvbnMgPSBbXTtcbiAgICB0aGlzLl9jb21waWxlclByb3ZpZGVycyA9IFtdO1xuICAgIHRoaXMuX2RlY2xhcmF0aW9ucyA9IFtdO1xuICAgIHRoaXMuX2ltcG9ydHMgPSBbXTtcbiAgICB0aGlzLl9zY2hlbWFzID0gW107XG4gICAgdGhpcy5fbW9kdWxlUmVmID0gbnVsbCAhO1xuICAgIHRoaXMuX3Rlc3RNb2R1bGVUeXBlID0gbnVsbCAhO1xuXG4gICAgdGhpcy5fY29tcGlsZXJJbmplY3RvciA9IG51bGwgITtcbiAgICB0aGlzLl9pbnN0YW50aWF0ZWQgPSBmYWxzZTtcbiAgICB0aGlzLl9hY3RpdmVGaXh0dXJlcy5mb3JFYWNoKChmaXh0dXJlKSA9PiB7XG4gICAgICB0cnkge1xuICAgICAgICBmaXh0dXJlLmRlc3Ryb3koKTtcbiAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcignRXJyb3IgZHVyaW5nIGNsZWFudXAgb2YgY29tcG9uZW50Jywge1xuICAgICAgICAgIGNvbXBvbmVudDogZml4dHVyZS5jb21wb25lbnRJbnN0YW5jZSxcbiAgICAgICAgICBzdGFja3RyYWNlOiBlLFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICB0aGlzLl9hY3RpdmVGaXh0dXJlcyA9IFtdO1xuXG4gICAgLy8gcmVzdG9yZSBpbml0aWFsIGNvbXBvbmVudC9kaXJlY3RpdmUvcGlwZSBkZWZzXG4gICAgdGhpcy5faW5pdGlhTmdEZWZzLmZvckVhY2goKHZhbHVlOiBbc3RyaW5nLCBQcm9wZXJ0eURlc2NyaXB0b3JdLCB0eXBlOiBUeXBlPGFueT4pID0+IHtcbiAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0eXBlLCB2YWx1ZVswXSwgdmFsdWVbMV0pO1xuICAgIH0pO1xuICAgIHRoaXMuX2luaXRpYU5nRGVmcy5jbGVhcigpO1xuICAgIGNsZWFyUmVzb2x1dGlvbk9mQ29tcG9uZW50UmVzb3VyY2VzUXVldWUoKTtcbiAgfVxuXG4gIGNvbmZpZ3VyZUNvbXBpbGVyKGNvbmZpZzoge3Byb3ZpZGVycz86IGFueVtdOyB1c2VKaXQ/OiBib29sZWFuO30pOiB2b2lkIHtcbiAgICBpZiAoY29uZmlnLnVzZUppdCAhPSBudWxsKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ3RoZSBSZW5kZXIzIGNvbXBpbGVyIEppVCBtb2RlIGlzIG5vdCBjb25maWd1cmFibGUgIScpO1xuICAgIH1cblxuICAgIGlmIChjb25maWcucHJvdmlkZXJzKSB7XG4gICAgICB0aGlzLl9wcm92aWRlck92ZXJyaWRlcy5wdXNoKC4uLmNvbmZpZy5wcm92aWRlcnMpO1xuICAgICAgdGhpcy5fY29tcGlsZXJQcm92aWRlcnMucHVzaCguLi5jb25maWcucHJvdmlkZXJzKTtcbiAgICB9XG4gIH1cblxuICBjb25maWd1cmVUZXN0aW5nTW9kdWxlKG1vZHVsZURlZjogVGVzdE1vZHVsZU1ldGFkYXRhKTogdm9pZCB7XG4gICAgdGhpcy5fYXNzZXJ0Tm90SW5zdGFudGlhdGVkKCdSM1Rlc3RCZWQuY29uZmlndXJlVGVzdGluZ01vZHVsZScsICdjb25maWd1cmUgdGhlIHRlc3QgbW9kdWxlJyk7XG4gICAgaWYgKG1vZHVsZURlZi5wcm92aWRlcnMpIHtcbiAgICAgIHRoaXMuX3Byb3ZpZGVycy5wdXNoKC4uLm1vZHVsZURlZi5wcm92aWRlcnMpO1xuICAgIH1cbiAgICBpZiAobW9kdWxlRGVmLmRlY2xhcmF0aW9ucykge1xuICAgICAgdGhpcy5fZGVjbGFyYXRpb25zLnB1c2goLi4ubW9kdWxlRGVmLmRlY2xhcmF0aW9ucyk7XG4gICAgfVxuICAgIGlmIChtb2R1bGVEZWYuaW1wb3J0cykge1xuICAgICAgdGhpcy5faW1wb3J0cy5wdXNoKC4uLm1vZHVsZURlZi5pbXBvcnRzKTtcbiAgICB9XG4gICAgaWYgKG1vZHVsZURlZi5zY2hlbWFzKSB7XG4gICAgICB0aGlzLl9zY2hlbWFzLnB1c2goLi4ubW9kdWxlRGVmLnNjaGVtYXMpO1xuICAgIH1cbiAgfVxuXG4gIGNvbXBpbGVDb21wb25lbnRzKCk6IFByb21pc2U8YW55PiB7XG4gICAgY29uc3QgcmVzb2x2ZXJzID0gdGhpcy5fZ2V0UmVzb2x2ZXJzKCk7XG4gICAgY29uc3QgZGVjbGFyYXRpb25zOiBUeXBlPGFueT5bXSA9IGZsYXR0ZW4odGhpcy5fZGVjbGFyYXRpb25zIHx8IEVNUFRZX0FSUkFZLCByZXNvbHZlRm9yd2FyZFJlZik7XG5cbiAgICBjb25zdCBjb21wb25lbnRPdmVycmlkZXM6IFtUeXBlPGFueT4sIENvbXBvbmVudF1bXSA9IFtdO1xuICAgIGxldCBoYXNBc3luY1Jlc291cmNlcyA9IGZhbHNlO1xuXG4gICAgLy8gQ29tcGlsZSB0aGUgY29tcG9uZW50cyBkZWNsYXJlZCBieSB0aGlzIG1vZHVsZVxuICAgIGRlY2xhcmF0aW9ucy5mb3JFYWNoKGRlY2xhcmF0aW9uID0+IHtcbiAgICAgIGNvbnN0IGNvbXBvbmVudCA9IHJlc29sdmVycy5jb21wb25lbnQucmVzb2x2ZShkZWNsYXJhdGlvbik7XG4gICAgICBpZiAoY29tcG9uZW50KSB7XG4gICAgICAgIC8vIFdlIG1ha2UgYSBjb3B5IG9mIHRoZSBtZXRhZGF0YSB0byBlbnN1cmUgdGhhdCB3ZSBkb24ndCBtdXRhdGUgdGhlIG9yaWdpbmFsIG1ldGFkYXRhXG4gICAgICAgIGNvbnN0IG1ldGFkYXRhID0gey4uLmNvbXBvbmVudH07XG4gICAgICAgIGNvbXBpbGVDb21wb25lbnQoZGVjbGFyYXRpb24sIG1ldGFkYXRhKTtcbiAgICAgICAgY29tcG9uZW50T3ZlcnJpZGVzLnB1c2goW2RlY2xhcmF0aW9uLCBtZXRhZGF0YV0pO1xuICAgICAgICBoYXNBc3luY1Jlc291cmNlcyA9IGhhc0FzeW5jUmVzb3VyY2VzIHx8IGNvbXBvbmVudE5lZWRzUmVzb2x1dGlvbihjb21wb25lbnQpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgY29uc3Qgb3ZlcnJpZGVDb21wb25lbnRzID0gKCkgPT4ge1xuICAgICAgY29tcG9uZW50T3ZlcnJpZGVzLmZvckVhY2goKG92ZXJyaWRlOiBbVHlwZTxhbnk+LCBDb21wb25lbnRdKSA9PiB7XG4gICAgICAgIC8vIE92ZXJyaWRlIHRoZSBleGlzdGluZyBtZXRhZGF0YSwgZW5zdXJpbmcgdGhhdCB0aGUgcmVzb2x2ZWQgcmVzb3VyY2VzXG4gICAgICAgIC8vIGFyZSBvbmx5IGF2YWlsYWJsZSB1bnRpbCB0aGUgbmV4dCBUZXN0QmVkIHJlc2V0ICh3aGVuIGByZXNldFRlc3RpbmdNb2R1bGVgIGlzIGNhbGxlZClcbiAgICAgICAgdGhpcy5vdmVycmlkZUNvbXBvbmVudChvdmVycmlkZVswXSwge3NldDogb3ZlcnJpZGVbMV19KTtcbiAgICAgIH0pO1xuICAgIH07XG5cbiAgICAvLyBJZiB0aGUgY29tcG9uZW50IGhhcyBubyBhc3luYyByZXNvdXJjZXMgKHRlbXBsYXRlVXJsLCBzdHlsZVVybHMpLCB3ZSBjYW4gZmluaXNoXG4gICAgLy8gc3luY2hyb25vdXNseS4gVGhpcyBpcyBpbXBvcnRhbnQgc28gdGhhdCB1c2VycyB3aG8gbWlzdGFrZW5seSB0cmVhdCBgY29tcGlsZUNvbXBvbmVudHNgXG4gICAgLy8gYXMgc3luY2hyb25vdXMgZG9uJ3QgZW5jb3VudGVyIGFuIGVycm9yLCBhcyBWaWV3RW5naW5lIHdhcyB0b2xlcmFudCBvZiB0aGlzLlxuICAgIGlmICghaGFzQXN5bmNSZXNvdXJjZXMpIHtcbiAgICAgIG92ZXJyaWRlQ29tcG9uZW50cygpO1xuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICAgIH0gZWxzZSB7XG4gICAgICBsZXQgcmVzb3VyY2VMb2FkZXI6IFJlc291cmNlTG9hZGVyO1xuICAgICAgcmV0dXJuIHJlc29sdmVDb21wb25lbnRSZXNvdXJjZXModXJsID0+IHtcbiAgICAgICAgICAgICAgIGlmICghcmVzb3VyY2VMb2FkZXIpIHtcbiAgICAgICAgICAgICAgICAgcmVzb3VyY2VMb2FkZXIgPSB0aGlzLmNvbXBpbGVySW5qZWN0b3IuZ2V0KFJlc291cmNlTG9hZGVyKTtcbiAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUocmVzb3VyY2VMb2FkZXIuZ2V0KHVybCkpO1xuICAgICAgICAgICAgIH0pXG4gICAgICAgICAgLnRoZW4ob3ZlcnJpZGVDb21wb25lbnRzKTtcbiAgICB9XG4gIH1cblxuICBnZXQodG9rZW46IGFueSwgbm90Rm91bmRWYWx1ZTogYW55ID0gSW5qZWN0b3IuVEhST1dfSUZfTk9UX0ZPVU5EKTogYW55IHtcbiAgICB0aGlzLl9pbml0SWZOZWVkZWQoKTtcbiAgICBpZiAodG9rZW4gPT09IFRlc3RCZWRSZW5kZXIzKSB7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgY29uc3QgcmVzdWx0ID0gdGhpcy5fbW9kdWxlUmVmLmluamVjdG9yLmdldCh0b2tlbiwgVU5ERUZJTkVEKTtcbiAgICByZXR1cm4gcmVzdWx0ID09PSBVTkRFRklORUQgPyB0aGlzLmNvbXBpbGVySW5qZWN0b3IuZ2V0KHRva2VuLCBub3RGb3VuZFZhbHVlKSA6IHJlc3VsdDtcbiAgfVxuXG4gIGV4ZWN1dGUodG9rZW5zOiBhbnlbXSwgZm46IEZ1bmN0aW9uLCBjb250ZXh0PzogYW55KTogYW55IHtcbiAgICB0aGlzLl9pbml0SWZOZWVkZWQoKTtcbiAgICBjb25zdCBwYXJhbXMgPSB0b2tlbnMubWFwKHQgPT4gdGhpcy5nZXQodCkpO1xuICAgIHJldHVybiBmbi5hcHBseShjb250ZXh0LCBwYXJhbXMpO1xuICB9XG5cbiAgb3ZlcnJpZGVNb2R1bGUobmdNb2R1bGU6IFR5cGU8YW55Piwgb3ZlcnJpZGU6IE1ldGFkYXRhT3ZlcnJpZGU8TmdNb2R1bGU+KTogdm9pZCB7XG4gICAgdGhpcy5fYXNzZXJ0Tm90SW5zdGFudGlhdGVkKCdvdmVycmlkZU1vZHVsZScsICdvdmVycmlkZSBtb2R1bGUgbWV0YWRhdGEnKTtcbiAgICB0aGlzLl9tb2R1bGVPdmVycmlkZXMucHVzaChbbmdNb2R1bGUsIG92ZXJyaWRlXSk7XG4gIH1cblxuICBvdmVycmlkZUNvbXBvbmVudChjb21wb25lbnQ6IFR5cGU8YW55Piwgb3ZlcnJpZGU6IE1ldGFkYXRhT3ZlcnJpZGU8Q29tcG9uZW50Pik6IHZvaWQge1xuICAgIHRoaXMuX2Fzc2VydE5vdEluc3RhbnRpYXRlZCgnb3ZlcnJpZGVDb21wb25lbnQnLCAnb3ZlcnJpZGUgY29tcG9uZW50IG1ldGFkYXRhJyk7XG4gICAgdGhpcy5fY29tcG9uZW50T3ZlcnJpZGVzLnB1c2goW2NvbXBvbmVudCwgb3ZlcnJpZGVdKTtcbiAgfVxuXG4gIG92ZXJyaWRlRGlyZWN0aXZlKGRpcmVjdGl2ZTogVHlwZTxhbnk+LCBvdmVycmlkZTogTWV0YWRhdGFPdmVycmlkZTxEaXJlY3RpdmU+KTogdm9pZCB7XG4gICAgdGhpcy5fYXNzZXJ0Tm90SW5zdGFudGlhdGVkKCdvdmVycmlkZURpcmVjdGl2ZScsICdvdmVycmlkZSBkaXJlY3RpdmUgbWV0YWRhdGEnKTtcbiAgICB0aGlzLl9kaXJlY3RpdmVPdmVycmlkZXMucHVzaChbZGlyZWN0aXZlLCBvdmVycmlkZV0pO1xuICB9XG5cbiAgb3ZlcnJpZGVQaXBlKHBpcGU6IFR5cGU8YW55Piwgb3ZlcnJpZGU6IE1ldGFkYXRhT3ZlcnJpZGU8UGlwZT4pOiB2b2lkIHtcbiAgICB0aGlzLl9hc3NlcnROb3RJbnN0YW50aWF0ZWQoJ292ZXJyaWRlUGlwZScsICdvdmVycmlkZSBwaXBlIG1ldGFkYXRhJyk7XG4gICAgdGhpcy5fcGlwZU92ZXJyaWRlcy5wdXNoKFtwaXBlLCBvdmVycmlkZV0pO1xuICB9XG5cbiAgLyoqXG4gICAqIE92ZXJ3cml0ZXMgYWxsIHByb3ZpZGVycyBmb3IgdGhlIGdpdmVuIHRva2VuIHdpdGggdGhlIGdpdmVuIHByb3ZpZGVyIGRlZmluaXRpb24uXG4gICAqL1xuICBvdmVycmlkZVByb3ZpZGVyKHRva2VuOiBhbnksIHByb3ZpZGVyOiB7dXNlRmFjdG9yeT86IEZ1bmN0aW9uLCB1c2VWYWx1ZT86IGFueSwgZGVwcz86IGFueVtdfSk6XG4gICAgICB2b2lkIHtcbiAgICBjb25zdCBwcm92aWRlckRlZiA9IHByb3ZpZGVyLnVzZUZhY3RvcnkgP1xuICAgICAgICB7cHJvdmlkZTogdG9rZW4sIHVzZUZhY3Rvcnk6IHByb3ZpZGVyLnVzZUZhY3RvcnksIGRlcHM6IHByb3ZpZGVyLmRlcHMgfHwgW119IDpcbiAgICAgICAge3Byb3ZpZGU6IHRva2VuLCB1c2VWYWx1ZTogcHJvdmlkZXIudXNlVmFsdWV9O1xuXG4gICAgbGV0IGluamVjdGFibGVEZWY6IEluamVjdGFibGVEZWY8YW55PnxudWxsO1xuICAgIGNvbnN0IGlzUm9vdCA9XG4gICAgICAgICh0eXBlb2YgdG9rZW4gIT09ICdzdHJpbmcnICYmIChpbmplY3RhYmxlRGVmID0gZ2V0SW5qZWN0YWJsZURlZih0b2tlbikpICYmXG4gICAgICAgICBpbmplY3RhYmxlRGVmLnByb3ZpZGVkSW4gPT09ICdyb290Jyk7XG4gICAgY29uc3Qgb3ZlcnJpZGVzQnVja2V0ID0gaXNSb290ID8gdGhpcy5fcm9vdFByb3ZpZGVyT3ZlcnJpZGVzIDogdGhpcy5fcHJvdmlkZXJPdmVycmlkZXM7XG4gICAgb3ZlcnJpZGVzQnVja2V0LnB1c2gocHJvdmlkZXJEZWYpO1xuXG4gICAgLy8ga2VlcCBhbGwgb3ZlcnJpZGVzIGdyb3VwZWQgYnkgdG9rZW4gYXMgd2VsbCBmb3IgZmFzdCBsb29rdXBzIHVzaW5nIHRva2VuXG4gICAgY29uc3Qgb3ZlcnJpZGVzRm9yVG9rZW4gPSB0aGlzLl9wcm92aWRlck92ZXJyaWRlc0J5VG9rZW4uZ2V0KHRva2VuKSB8fCBbXTtcbiAgICBvdmVycmlkZXNGb3JUb2tlbi5wdXNoKHByb3ZpZGVyRGVmKTtcbiAgICB0aGlzLl9wcm92aWRlck92ZXJyaWRlc0J5VG9rZW4uc2V0KHRva2VuLCBvdmVycmlkZXNGb3JUb2tlbik7XG4gIH1cblxuICAvKipcbiAgICogT3ZlcndyaXRlcyBhbGwgcHJvdmlkZXJzIGZvciB0aGUgZ2l2ZW4gdG9rZW4gd2l0aCB0aGUgZ2l2ZW4gcHJvdmlkZXIgZGVmaW5pdGlvbi5cbiAgICpcbiAgICogQGRlcHJlY2F0ZWQgYXMgaXQgbWFrZXMgYWxsIE5nTW9kdWxlcyBsYXp5LiBJbnRyb2R1Y2VkIG9ubHkgZm9yIG1pZ3JhdGluZyBvZmYgb2YgaXQuXG4gICAqL1xuICBkZXByZWNhdGVkT3ZlcnJpZGVQcm92aWRlcih0b2tlbjogYW55LCBwcm92aWRlcjoge1xuICAgIHVzZUZhY3Rvcnk6IEZ1bmN0aW9uLFxuICAgIGRlcHM6IGFueVtdLFxuICB9KTogdm9pZDtcbiAgZGVwcmVjYXRlZE92ZXJyaWRlUHJvdmlkZXIodG9rZW46IGFueSwgcHJvdmlkZXI6IHt1c2VWYWx1ZTogYW55O30pOiB2b2lkO1xuICBkZXByZWNhdGVkT3ZlcnJpZGVQcm92aWRlcihcbiAgICAgIHRva2VuOiBhbnksIHByb3ZpZGVyOiB7dXNlRmFjdG9yeT86IEZ1bmN0aW9uLCB1c2VWYWx1ZT86IGFueSwgZGVwcz86IGFueVtdfSk6IHZvaWQge1xuICAgIHRocm93IG5ldyBFcnJvcignTm8gaW1wbGVtZW50ZWQgaW4gSVZZJyk7XG4gIH1cblxuICBjcmVhdGVDb21wb25lbnQ8VD4odHlwZTogVHlwZTxUPik6IENvbXBvbmVudEZpeHR1cmU8VD4ge1xuICAgIHRoaXMuX2luaXRJZk5lZWRlZCgpO1xuXG4gICAgY29uc3QgdGVzdENvbXBvbmVudFJlbmRlcmVyOiBUZXN0Q29tcG9uZW50UmVuZGVyZXIgPSB0aGlzLmdldChUZXN0Q29tcG9uZW50UmVuZGVyZXIpO1xuICAgIGNvbnN0IHJvb3RFbElkID0gYHJvb3Qke19uZXh0Um9vdEVsZW1lbnRJZCsrfWA7XG4gICAgdGVzdENvbXBvbmVudFJlbmRlcmVyLmluc2VydFJvb3RFbGVtZW50KHJvb3RFbElkKTtcblxuICAgIGNvbnN0IGNvbXBvbmVudERlZiA9ICh0eXBlIGFzIGFueSkubmdDb21wb25lbnREZWY7XG5cbiAgICBpZiAoIWNvbXBvbmVudERlZikge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgIGBJdCBsb29rcyBsaWtlICcke3N0cmluZ2lmeSh0eXBlKX0nIGhhcyBub3QgYmVlbiBJVlkgY29tcGlsZWQgLSBpdCBoYXMgbm8gJ25nQ29tcG9uZW50RGVmJyBmaWVsZGApO1xuICAgIH1cblxuICAgIGNvbnN0IG5vTmdab25lOiBib29sZWFuID0gdGhpcy5nZXQoQ29tcG9uZW50Rml4dHVyZU5vTmdab25lLCBmYWxzZSk7XG4gICAgY29uc3QgYXV0b0RldGVjdDogYm9vbGVhbiA9IHRoaXMuZ2V0KENvbXBvbmVudEZpeHR1cmVBdXRvRGV0ZWN0LCBmYWxzZSk7XG4gICAgY29uc3Qgbmdab25lOiBOZ1pvbmUgPSBub05nWm9uZSA/IG51bGwgOiB0aGlzLmdldChOZ1pvbmUsIG51bGwpO1xuICAgIGNvbnN0IGNvbXBvbmVudEZhY3RvcnkgPSBuZXcgQ29tcG9uZW50RmFjdG9yeShjb21wb25lbnREZWYpO1xuICAgIGNvbnN0IGluaXRDb21wb25lbnQgPSAoKSA9PiB7XG4gICAgICBjb25zdCBjb21wb25lbnRSZWYgPVxuICAgICAgICAgIGNvbXBvbmVudEZhY3RvcnkuY3JlYXRlKEluamVjdG9yLk5VTEwsIFtdLCBgIyR7cm9vdEVsSWR9YCwgdGhpcy5fbW9kdWxlUmVmKTtcbiAgICAgIHJldHVybiBuZXcgQ29tcG9uZW50Rml4dHVyZTxhbnk+KGNvbXBvbmVudFJlZiwgbmdab25lLCBhdXRvRGV0ZWN0KTtcbiAgICB9O1xuICAgIGNvbnN0IGZpeHR1cmUgPSBuZ1pvbmUgPyBuZ1pvbmUucnVuKGluaXRDb21wb25lbnQpIDogaW5pdENvbXBvbmVudCgpO1xuICAgIHRoaXMuX2FjdGl2ZUZpeHR1cmVzLnB1c2goZml4dHVyZSk7XG4gICAgcmV0dXJuIGZpeHR1cmU7XG4gIH1cblxuICAvLyBpbnRlcm5hbCBtZXRob2RzXG5cbiAgcHJpdmF0ZSBfaW5pdElmTmVlZGVkKCk6IHZvaWQge1xuICAgIHRoaXMuX2NoZWNrR2xvYmFsQ29tcGlsYXRpb25GaW5pc2hlZCgpO1xuICAgIGlmICh0aGlzLl9pbnN0YW50aWF0ZWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLl9yZXNvbHZlcnMgPSB0aGlzLl9nZXRSZXNvbHZlcnMoKTtcbiAgICB0aGlzLl90ZXN0TW9kdWxlVHlwZSA9IHRoaXMuX2NyZWF0ZVRlc3RNb2R1bGUoKTtcbiAgICB0aGlzLl9jb21waWxlTmdNb2R1bGUodGhpcy5fdGVzdE1vZHVsZVR5cGUpO1xuXG4gICAgY29uc3QgcGFyZW50SW5qZWN0b3IgPSB0aGlzLnBsYXRmb3JtLmluamVjdG9yO1xuICAgIHRoaXMuX21vZHVsZVJlZiA9IG5ldyBOZ01vZHVsZVJlZih0aGlzLl90ZXN0TW9kdWxlVHlwZSwgcGFyZW50SW5qZWN0b3IpO1xuXG4gICAgLy8gQXBwbGljYXRpb25Jbml0U3RhdHVzLnJ1bkluaXRpYWxpemVycygpIGlzIG1hcmtlZCBAaW50ZXJuYWxcbiAgICAvLyB0byBjb3JlLiBDYXN0IGl0IHRvIGFueSBiZWZvcmUgYWNjZXNzaW5nIGl0LlxuICAgICh0aGlzLl9tb2R1bGVSZWYuaW5qZWN0b3IuZ2V0KEFwcGxpY2F0aW9uSW5pdFN0YXR1cykgYXMgYW55KS5ydW5Jbml0aWFsaXplcnMoKTtcbiAgICB0aGlzLl9pbnN0YW50aWF0ZWQgPSB0cnVlO1xuICB9XG5cbiAgcHJpdmF0ZSBfc3RvcmVOZ0RlZihwcm9wOiBzdHJpbmcsIHR5cGU6IFR5cGU8YW55Pikge1xuICAgIGlmICghdGhpcy5faW5pdGlhTmdEZWZzLmhhcyh0eXBlKSkge1xuICAgICAgY29uc3QgY3VycmVudERlZiA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IodHlwZSwgcHJvcCk7XG4gICAgICB0aGlzLl9pbml0aWFOZ0RlZnMuc2V0KHR5cGUsIFtwcm9wLCBjdXJyZW50RGVmXSk7XG4gICAgfVxuICB9XG5cbiAgLy8gZ2V0IG92ZXJyaWRlcyBmb3IgYSBzcGVjaWZpYyBwcm92aWRlciAoaWYgYW55KVxuICBwcml2YXRlIF9nZXRQcm92aWRlck92ZXJyaWRlcyhwcm92aWRlcjogYW55KSB7XG4gICAgY29uc3QgdG9rZW4gPSBwcm92aWRlciAmJiB0eXBlb2YgcHJvdmlkZXIgPT09ICdvYmplY3QnICYmIHByb3ZpZGVyLmhhc093blByb3BlcnR5KCdwcm92aWRlJykgP1xuICAgICAgICBwcm92aWRlci5wcm92aWRlIDpcbiAgICAgICAgcHJvdmlkZXI7XG4gICAgcmV0dXJuIHRoaXMuX3Byb3ZpZGVyT3ZlcnJpZGVzQnlUb2tlbi5nZXQodG9rZW4pIHx8IFtdO1xuICB9XG5cbiAgLy8gY3JlYXRlcyByZXNvbHZlcnMgdGFraW5nIG92ZXJyaWRlcyBpbnRvIGFjY291bnRcbiAgcHJpdmF0ZSBfZ2V0UmVzb2x2ZXJzKCkge1xuICAgIGNvbnN0IG1vZHVsZSA9IG5ldyBOZ01vZHVsZVJlc29sdmVyKCk7XG4gICAgbW9kdWxlLnNldE92ZXJyaWRlcyh0aGlzLl9tb2R1bGVPdmVycmlkZXMpO1xuXG4gICAgY29uc3QgY29tcG9uZW50ID0gbmV3IENvbXBvbmVudFJlc29sdmVyKCk7XG4gICAgY29tcG9uZW50LnNldE92ZXJyaWRlcyh0aGlzLl9jb21wb25lbnRPdmVycmlkZXMpO1xuXG4gICAgY29uc3QgZGlyZWN0aXZlID0gbmV3IERpcmVjdGl2ZVJlc29sdmVyKCk7XG4gICAgZGlyZWN0aXZlLnNldE92ZXJyaWRlcyh0aGlzLl9kaXJlY3RpdmVPdmVycmlkZXMpO1xuXG4gICAgY29uc3QgcGlwZSA9IG5ldyBQaXBlUmVzb2x2ZXIoKTtcbiAgICBwaXBlLnNldE92ZXJyaWRlcyh0aGlzLl9waXBlT3ZlcnJpZGVzKTtcblxuICAgIHJldHVybiB7bW9kdWxlLCBjb21wb25lbnQsIGRpcmVjdGl2ZSwgcGlwZX07XG4gIH1cblxuICBwcml2YXRlIF9hc3NlcnROb3RJbnN0YW50aWF0ZWQobWV0aG9kTmFtZTogc3RyaW5nLCBtZXRob2REZXNjcmlwdGlvbjogc3RyaW5nKSB7XG4gICAgaWYgKHRoaXMuX2luc3RhbnRpYXRlZCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgIGBDYW5ub3QgJHttZXRob2REZXNjcmlwdGlvbn0gd2hlbiB0aGUgdGVzdCBtb2R1bGUgaGFzIGFscmVhZHkgYmVlbiBpbnN0YW50aWF0ZWQuIGAgK1xuICAgICAgICAgIGBNYWtlIHN1cmUgeW91IGFyZSBub3QgdXNpbmcgXFxgaW5qZWN0XFxgIGJlZm9yZSBcXGAke21ldGhvZE5hbWV9XFxgLmApO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgX2NyZWF0ZVRlc3RNb2R1bGUoKTogTmdNb2R1bGVUeXBlIHtcbiAgICBjb25zdCByb290UHJvdmlkZXJPdmVycmlkZXMgPSB0aGlzLl9yb290UHJvdmlkZXJPdmVycmlkZXM7XG5cbiAgICBATmdNb2R1bGUoe1xuICAgICAgcHJvdmlkZXJzOiBbLi4ucm9vdFByb3ZpZGVyT3ZlcnJpZGVzXSxcbiAgICAgIGppdDogdHJ1ZSxcbiAgICB9KVxuICAgIGNsYXNzIFJvb3RTY29wZU1vZHVsZSB7XG4gICAgfVxuXG4gICAgY29uc3Qgbmdab25lID0gbmV3IE5nWm9uZSh7ZW5hYmxlTG9uZ1N0YWNrVHJhY2U6IHRydWV9KTtcbiAgICBjb25zdCBwcm92aWRlcnMgPSBbXG4gICAgICB7cHJvdmlkZTogTmdab25lLCB1c2VWYWx1ZTogbmdab25lfSxcbiAgICAgIHtwcm92aWRlOiBDb21waWxlciwgdXNlRmFjdG9yeTogKCkgPT4gbmV3IFIzVGVzdENvbXBpbGVyKHRoaXMpfSxcbiAgICAgIC4uLnRoaXMuX3Byb3ZpZGVycyxcbiAgICAgIC4uLnRoaXMuX3Byb3ZpZGVyT3ZlcnJpZGVzLFxuICAgIF07XG5cbiAgICBjb25zdCBkZWNsYXJhdGlvbnMgPSB0aGlzLl9kZWNsYXJhdGlvbnM7XG4gICAgY29uc3QgaW1wb3J0cyA9IFtSb290U2NvcGVNb2R1bGUsIHRoaXMubmdNb2R1bGUsIHRoaXMuX2ltcG9ydHNdO1xuICAgIGNvbnN0IHNjaGVtYXMgPSB0aGlzLl9zY2hlbWFzO1xuXG4gICAgQE5nTW9kdWxlKHtwcm92aWRlcnMsIGRlY2xhcmF0aW9ucywgaW1wb3J0cywgc2NoZW1hcywgaml0OiB0cnVlfSlcbiAgICBjbGFzcyBEeW5hbWljVGVzdE1vZHVsZSB7XG4gICAgfVxuXG4gICAgcmV0dXJuIER5bmFtaWNUZXN0TW9kdWxlIGFzIE5nTW9kdWxlVHlwZTtcbiAgfVxuXG4gIGdldCBjb21waWxlckluamVjdG9yKCk6IEluamVjdG9yIHtcbiAgICBpZiAodGhpcy5fY29tcGlsZXJJbmplY3RvciAhPT0gbnVsbCkge1xuICAgICAgcmV0dXJuIHRoaXMuX2NvbXBpbGVySW5qZWN0b3I7XG4gICAgfVxuXG4gICAgY29uc3QgcHJvdmlkZXJzOiBTdGF0aWNQcm92aWRlcltdID0gW107XG4gICAgY29uc3QgY29tcGlsZXJPcHRpb25zID0gdGhpcy5wbGF0Zm9ybS5pbmplY3Rvci5nZXQoQ09NUElMRVJfT1BUSU9OUyk7XG4gICAgY29tcGlsZXJPcHRpb25zLmZvckVhY2gob3B0cyA9PiB7XG4gICAgICBpZiAob3B0cy5wcm92aWRlcnMpIHtcbiAgICAgICAgcHJvdmlkZXJzLnB1c2gob3B0cy5wcm92aWRlcnMpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHByb3ZpZGVycy5wdXNoKC4uLnRoaXMuX2NvbXBpbGVyUHJvdmlkZXJzKTtcblxuICAgIC8vIFRPRE8ob2NvbWJlKTogbWFrZSB0aGlzIHdvcmsgd2l0aCBhbiBJbmplY3RvciBkaXJlY3RseSBpbnN0ZWFkIG9mIGNyZWF0aW5nIGEgbW9kdWxlIGZvciBpdFxuICAgIEBOZ01vZHVsZSh7cHJvdmlkZXJzfSlcbiAgICBjbGFzcyBDb21waWxlck1vZHVsZSB7XG4gICAgfVxuXG4gICAgY29uc3QgQ29tcGlsZXJNb2R1bGVGYWN0b3J5ID0gbmV3IFIzTmdNb2R1bGVGYWN0b3J5KENvbXBpbGVyTW9kdWxlKTtcbiAgICB0aGlzLl9jb21waWxlckluamVjdG9yID0gQ29tcGlsZXJNb2R1bGVGYWN0b3J5LmNyZWF0ZSh0aGlzLnBsYXRmb3JtLmluamVjdG9yKS5pbmplY3RvcjtcbiAgICByZXR1cm4gdGhpcy5fY29tcGlsZXJJbmplY3RvcjtcbiAgfVxuXG4gIHByaXZhdGUgX2dldE1ldGFXaXRoT3ZlcnJpZGVzKG1ldGE6IENvbXBvbmVudHxEaXJlY3RpdmV8TmdNb2R1bGUsIHR5cGU/OiBUeXBlPGFueT4pIHtcbiAgICBjb25zdCBvdmVycmlkZXM6IHtwcm92aWRlcnM/OiBhbnlbXSwgdGVtcGxhdGU/OiBzdHJpbmd9ID0ge307XG4gICAgaWYgKG1ldGEucHJvdmlkZXJzICYmIG1ldGEucHJvdmlkZXJzLmxlbmd0aCkge1xuICAgICAgLy8gVGhlcmUgYXJlIHR3byBmbGF0dGVuaW5nIG9wZXJhdGlvbnMgaGVyZS4gVGhlIGlubmVyIGZsYXR0ZW4oKSBvcGVyYXRlcyBvbiB0aGUgbWV0YWRhdGEnc1xuICAgICAgLy8gcHJvdmlkZXJzIGFuZCBhcHBsaWVzIGEgbWFwcGluZyBmdW5jdGlvbiB3aGljaCByZXRyaWV2ZXMgb3ZlcnJpZGVzIGZvciBlYWNoIGluY29taW5nXG4gICAgICAvLyBwcm92aWRlci4gVGhlIG91dGVyIGZsYXR0ZW4oKSB0aGVuIGZsYXR0ZW5zIHRoZSBwcm9kdWNlZCBvdmVycmlkZXMgYXJyYXkuIElmIHRoaXMgaXMgbm90XG4gICAgICAvLyBkb25lLCB0aGUgYXJyYXkgY2FuIGNvbnRhaW4gb3RoZXIgZW1wdHkgYXJyYXlzIChlLmcuIGBbW10sIFtdXWApIHdoaWNoIGxlYWsgaW50byB0aGVcbiAgICAgIC8vIHByb3ZpZGVycyBhcnJheSBhbmQgY29udGFtaW5hdGUgYW55IGVycm9yIG1lc3NhZ2VzIHRoYXQgbWlnaHQgYmUgZ2VuZXJhdGVkLlxuICAgICAgY29uc3QgcHJvdmlkZXJPdmVycmlkZXMgPVxuICAgICAgICAgIGZsYXR0ZW4oZmxhdHRlbihtZXRhLnByb3ZpZGVycywgKHByb3ZpZGVyOiBhbnkpID0+IHRoaXMuX2dldFByb3ZpZGVyT3ZlcnJpZGVzKHByb3ZpZGVyKSkpO1xuICAgICAgaWYgKHByb3ZpZGVyT3ZlcnJpZGVzLmxlbmd0aCkge1xuICAgICAgICBvdmVycmlkZXMucHJvdmlkZXJzID0gWy4uLm1ldGEucHJvdmlkZXJzLCAuLi5wcm92aWRlck92ZXJyaWRlc107XG4gICAgICB9XG4gICAgfVxuICAgIGNvbnN0IGhhc1RlbXBsYXRlT3ZlcnJpZGUgPSAhIXR5cGUgJiYgdGhpcy5fdGVtcGxhdGVPdmVycmlkZXMuaGFzKHR5cGUpO1xuICAgIGlmIChoYXNUZW1wbGF0ZU92ZXJyaWRlKSB7XG4gICAgICBvdmVycmlkZXMudGVtcGxhdGUgPSB0aGlzLl90ZW1wbGF0ZU92ZXJyaWRlcy5nZXQodHlwZSAhKTtcbiAgICB9XG4gICAgcmV0dXJuIE9iamVjdC5rZXlzKG92ZXJyaWRlcykubGVuZ3RoID8gey4uLm1ldGEsIC4uLm92ZXJyaWRlc30gOiBtZXRhO1xuICB9XG5cbiAgLyoqXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgX2dldE1vZHVsZVJlc29sdmVyKCkgeyByZXR1cm4gdGhpcy5fcmVzb2x2ZXJzLm1vZHVsZTsgfVxuXG4gIC8qKlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIF9jb21waWxlTmdNb2R1bGUobW9kdWxlVHlwZTogTmdNb2R1bGVUeXBlKTogdm9pZCB7XG4gICAgY29uc3QgbmdNb2R1bGUgPSB0aGlzLl9yZXNvbHZlcnMubW9kdWxlLnJlc29sdmUobW9kdWxlVHlwZSk7XG5cbiAgICBpZiAobmdNb2R1bGUgPT09IG51bGwpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgJHtzdHJpbmdpZnkobW9kdWxlVHlwZSl9IGhhcyBubyBATmdNb2R1bGUgYW5ub3RhdGlvbmApO1xuICAgIH1cblxuICAgIHRoaXMuX3N0b3JlTmdEZWYoTkdfTU9EVUxFX0RFRiwgbW9kdWxlVHlwZSk7XG4gICAgdGhpcy5fc3RvcmVOZ0RlZihOR19JTkpFQ1RPUl9ERUYsIG1vZHVsZVR5cGUpO1xuICAgIGNvbnN0IG1ldGFkYXRhID0gdGhpcy5fZ2V0TWV0YVdpdGhPdmVycmlkZXMobmdNb2R1bGUpO1xuICAgIGNvbXBpbGVOZ01vZHVsZURlZnMobW9kdWxlVHlwZSwgbWV0YWRhdGEpO1xuXG4gICAgY29uc3QgZGVjbGFyYXRpb25zOiBUeXBlPGFueT5bXSA9XG4gICAgICAgIGZsYXR0ZW4obmdNb2R1bGUuZGVjbGFyYXRpb25zIHx8IEVNUFRZX0FSUkFZLCByZXNvbHZlRm9yd2FyZFJlZik7XG4gICAgY29uc3QgY29tcGlsZWRDb21wb25lbnRzOiBUeXBlPGFueT5bXSA9IFtdO1xuXG4gICAgLy8gQ29tcGlsZSB0aGUgY29tcG9uZW50cywgZGlyZWN0aXZlcyBhbmQgcGlwZXMgZGVjbGFyZWQgYnkgdGhpcyBtb2R1bGVcbiAgICBkZWNsYXJhdGlvbnMuZm9yRWFjaChkZWNsYXJhdGlvbiA9PiB7XG4gICAgICBjb25zdCBjb21wb25lbnQgPSB0aGlzLl9yZXNvbHZlcnMuY29tcG9uZW50LnJlc29sdmUoZGVjbGFyYXRpb24pO1xuICAgICAgaWYgKGNvbXBvbmVudCkge1xuICAgICAgICB0aGlzLl9zdG9yZU5nRGVmKE5HX0NPTVBPTkVOVF9ERUYsIGRlY2xhcmF0aW9uKTtcbiAgICAgICAgY29uc3QgbWV0YWRhdGEgPSB0aGlzLl9nZXRNZXRhV2l0aE92ZXJyaWRlcyhjb21wb25lbnQsIGRlY2xhcmF0aW9uKTtcbiAgICAgICAgY29tcGlsZUNvbXBvbmVudChkZWNsYXJhdGlvbiwgbWV0YWRhdGEpO1xuICAgICAgICBjb21waWxlZENvbXBvbmVudHMucHVzaChkZWNsYXJhdGlvbik7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgY29uc3QgZGlyZWN0aXZlID0gdGhpcy5fcmVzb2x2ZXJzLmRpcmVjdGl2ZS5yZXNvbHZlKGRlY2xhcmF0aW9uKTtcbiAgICAgIGlmIChkaXJlY3RpdmUpIHtcbiAgICAgICAgdGhpcy5fc3RvcmVOZ0RlZihOR19ESVJFQ1RJVkVfREVGLCBkZWNsYXJhdGlvbik7XG4gICAgICAgIGNvbnN0IG1ldGFkYXRhID0gdGhpcy5fZ2V0TWV0YVdpdGhPdmVycmlkZXMoZGlyZWN0aXZlKTtcbiAgICAgICAgY29tcGlsZURpcmVjdGl2ZShkZWNsYXJhdGlvbiwgbWV0YWRhdGEpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHBpcGUgPSB0aGlzLl9yZXNvbHZlcnMucGlwZS5yZXNvbHZlKGRlY2xhcmF0aW9uKTtcbiAgICAgIGlmIChwaXBlKSB7XG4gICAgICAgIHRoaXMuX3N0b3JlTmdEZWYoTkdfUElQRV9ERUYsIGRlY2xhcmF0aW9uKTtcbiAgICAgICAgY29tcGlsZVBpcGUoZGVjbGFyYXRpb24sIHBpcGUpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICAvLyBDb21waWxlIHRyYW5zaXRpdmUgbW9kdWxlcywgY29tcG9uZW50cywgZGlyZWN0aXZlcyBhbmQgcGlwZXNcbiAgICBjb25zdCBjYWxjVHJhbnNpdGl2ZVNjb3Blc0ZvciA9IChtb2R1bGVUeXBlOiBOZ01vZHVsZVR5cGUpID0+IHRyYW5zaXRpdmVTY29wZXNGb3IoXG4gICAgICAgIG1vZHVsZVR5cGUsIChuZ01vZHVsZTogTmdNb2R1bGVUeXBlKSA9PiB0aGlzLl9jb21waWxlTmdNb2R1bGUobmdNb2R1bGUpKTtcbiAgICBjb25zdCB0cmFuc2l0aXZlU2NvcGUgPSBjYWxjVHJhbnNpdGl2ZVNjb3Blc0Zvcihtb2R1bGVUeXBlKTtcbiAgICBjb21waWxlZENvbXBvbmVudHMuZm9yRWFjaChjbXAgPT4ge1xuICAgICAgY29uc3Qgc2NvcGUgPSB0aGlzLl90ZW1wbGF0ZU92ZXJyaWRlcy5oYXMoY21wKSA/XG4gICAgICAgICAgLy8gaWYgd2UgaGF2ZSB0ZW1wbGF0ZSBvdmVycmlkZSB2aWEgYFRlc3RCZWQub3ZlcnJpZGVUZW1wbGF0ZVVzaW5nVGVzdGluZ01vZHVsZWAgLVxuICAgICAgICAgIC8vIGRlZmluZSBDb21wb25lbnQgc2NvcGUgYXMgVGVzdGluZ01vZHVsZSBzY29wZSwgaW5zdGVhZCBvZiB0aGUgc2NvcGUgb2YgTmdNb2R1bGVcbiAgICAgICAgICAvLyB3aGVyZSB0aGlzIENvbXBvbmVudCB3YXMgZGVjbGFyZWRcbiAgICAgICAgICBjYWxjVHJhbnNpdGl2ZVNjb3Blc0Zvcih0aGlzLl90ZXN0TW9kdWxlVHlwZSkgOlxuICAgICAgICAgIHRyYW5zaXRpdmVTY29wZTtcbiAgICAgIHBhdGNoQ29tcG9uZW50RGVmV2l0aFNjb3BlKChjbXAgYXMgYW55KS5uZ0NvbXBvbmVudERlZiwgc2NvcGUpO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgX2dldENvbXBvbmVudEZhY3Rvcmllcyhtb2R1bGVUeXBlOiBOZ01vZHVsZVR5cGUpOiBDb21wb25lbnRGYWN0b3J5PGFueT5bXSB7XG4gICAgcmV0dXJuIG1vZHVsZVR5cGUubmdNb2R1bGVEZWYuZGVjbGFyYXRpb25zLnJlZHVjZSgoZmFjdG9yaWVzLCBkZWNsYXJhdGlvbikgPT4ge1xuICAgICAgY29uc3QgY29tcG9uZW50RGVmID0gKGRlY2xhcmF0aW9uIGFzIGFueSkubmdDb21wb25lbnREZWY7XG4gICAgICBjb21wb25lbnREZWYgJiYgZmFjdG9yaWVzLnB1c2gobmV3IENvbXBvbmVudEZhY3RvcnkoY29tcG9uZW50RGVmLCB0aGlzLl9tb2R1bGVSZWYpKTtcbiAgICAgIHJldHVybiBmYWN0b3JpZXM7XG4gICAgfSwgW10gYXMgQ29tcG9uZW50RmFjdG9yeTxhbnk+W10pO1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrIHdoZXRoZXIgdGhlIG1vZHVsZSBzY29waW5nIHF1ZXVlIHNob3VsZCBiZSBmbHVzaGVkLCBhbmQgZmx1c2ggaXQgaWYgbmVlZGVkLlxuICAgKlxuICAgKiBXaGVuIHRoZSBUZXN0QmVkIGlzIHJlc2V0LCBpdCBjbGVhcnMgdGhlIEpJVCBtb2R1bGUgY29tcGlsYXRpb24gcXVldWUsIGNhbmNlbGxpbmcgYW55XG4gICAqIGluLXByb2dyZXNzIG1vZHVsZSBjb21waWxhdGlvbi4gVGhpcyBjcmVhdGVzIGEgcG90ZW50aWFsIGhhemFyZCAtIHRoZSB2ZXJ5IGZpcnN0IHRpbWUgdGhlXG4gICAqIFRlc3RCZWQgaXMgaW5pdGlhbGl6ZWQgKG9yIGlmIGl0J3MgcmVzZXQgd2l0aG91dCBiZWluZyBpbml0aWFsaXplZCksIHRoZXJlIG1heSBiZSBwZW5kaW5nXG4gICAqIGNvbXBpbGF0aW9ucyBvZiBtb2R1bGVzIGRlY2xhcmVkIGluIGdsb2JhbCBzY29wZS4gVGhlc2UgY29tcGlsYXRpb25zIHNob3VsZCBiZSBmaW5pc2hlZC5cbiAgICpcbiAgICogVG8gZW5zdXJlIHRoYXQgZ2xvYmFsbHkgZGVjbGFyZWQgbW9kdWxlcyBoYXZlIHRoZWlyIGNvbXBvbmVudHMgc2NvcGVkIHByb3Blcmx5LCB0aGlzIGZ1bmN0aW9uXG4gICAqIGlzIGNhbGxlZCB3aGVuZXZlciBUZXN0QmVkIGlzIGluaXRpYWxpemVkIG9yIHJlc2V0LiBUaGUgX2ZpcnN0XyB0aW1lIHRoYXQgdGhpcyBoYXBwZW5zLCBwcmlvclxuICAgKiB0byBhbnkgb3RoZXIgb3BlcmF0aW9ucywgdGhlIHNjb3BpbmcgcXVldWUgaXMgZmx1c2hlZC5cbiAgICovXG4gIHByaXZhdGUgX2NoZWNrR2xvYmFsQ29tcGlsYXRpb25GaW5pc2hlZCgpOiB2b2lkIHtcbiAgICAvLyAhdGhpcy5faW5zdGFudGlhdGVkIHNob3VsZCBub3QgYmUgbmVjZXNzYXJ5LCBidXQgaXMgbGVmdCBpbiBhcyBhbiBhZGRpdGlvbmFsIGd1YXJkIHRoYXRcbiAgICAvLyBjb21waWxhdGlvbnMgcXVldWVkIGluIHRlc3RzIChhZnRlciBpbnN0YW50aWF0aW9uKSBhcmUgbmV2ZXIgZmx1c2hlZCBhY2NpZGVudGFsbHkuXG4gICAgaWYgKCF0aGlzLl9nbG9iYWxDb21waWxhdGlvbkNoZWNrZWQgJiYgIXRoaXMuX2luc3RhbnRpYXRlZCkge1xuICAgICAgZmx1c2hNb2R1bGVTY29waW5nUXVldWVBc011Y2hBc1Bvc3NpYmxlKCk7XG4gICAgfVxuICAgIHRoaXMuX2dsb2JhbENvbXBpbGF0aW9uQ2hlY2tlZCA9IHRydWU7XG4gIH1cbn1cblxubGV0IHRlc3RCZWQ6IFRlc3RCZWRSZW5kZXIzO1xuXG5leHBvcnQgZnVuY3Rpb24gX2dldFRlc3RCZWRSZW5kZXIzKCk6IFRlc3RCZWRSZW5kZXIzIHtcbiAgcmV0dXJuIHRlc3RCZWQgPSB0ZXN0QmVkIHx8IG5ldyBUZXN0QmVkUmVuZGVyMygpO1xufVxuXG5mdW5jdGlvbiBmbGF0dGVuPFQ+KHZhbHVlczogYW55W10sIG1hcEZuPzogKHZhbHVlOiBUKSA9PiBhbnkpOiBUW10ge1xuICBjb25zdCBvdXQ6IFRbXSA9IFtdO1xuICB2YWx1ZXMuZm9yRWFjaCh2YWx1ZSA9PiB7XG4gICAgaWYgKEFycmF5LmlzQXJyYXkodmFsdWUpKSB7XG4gICAgICBvdXQucHVzaCguLi5mbGF0dGVuPFQ+KHZhbHVlLCBtYXBGbikpO1xuICAgIH0gZWxzZSB7XG4gICAgICBvdXQucHVzaChtYXBGbiA/IG1hcEZuKHZhbHVlKSA6IHZhbHVlKTtcbiAgICB9XG4gIH0pO1xuICByZXR1cm4gb3V0O1xufVxuXG5mdW5jdGlvbiBpc05nTW9kdWxlPFQ+KHZhbHVlOiBUeXBlPFQ+KTogdmFsdWUgaXMgVHlwZTxUPiZ7bmdNb2R1bGVEZWY6IE5nTW9kdWxlRGVmPFQ+fSB7XG4gIHJldHVybiAodmFsdWUgYXN7bmdNb2R1bGVEZWY/OiBOZ01vZHVsZURlZjxUPn0pLm5nTW9kdWxlRGVmICE9PSB1bmRlZmluZWQ7XG59XG5cbmNsYXNzIFIzVGVzdENvbXBpbGVyIGltcGxlbWVudHMgQ29tcGlsZXIge1xuICBjb25zdHJ1Y3Rvcihwcml2YXRlIHRlc3RCZWQ6IFRlc3RCZWRSZW5kZXIzKSB7fVxuXG4gIGNvbXBpbGVNb2R1bGVTeW5jPFQ+KG1vZHVsZVR5cGU6IFR5cGU8VD4pOiBOZ01vZHVsZUZhY3Rvcnk8VD4ge1xuICAgIHRoaXMudGVzdEJlZC5fY29tcGlsZU5nTW9kdWxlKG1vZHVsZVR5cGUgYXMgTmdNb2R1bGVUeXBlPFQ+KTtcbiAgICByZXR1cm4gbmV3IFIzTmdNb2R1bGVGYWN0b3J5KG1vZHVsZVR5cGUpO1xuICB9XG5cbiAgY29tcGlsZU1vZHVsZUFzeW5jPFQ+KG1vZHVsZVR5cGU6IFR5cGU8VD4pOiBQcm9taXNlPE5nTW9kdWxlRmFjdG9yeTxUPj4ge1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodGhpcy5jb21waWxlTW9kdWxlU3luYyhtb2R1bGVUeXBlKSk7XG4gIH1cblxuICBjb21waWxlTW9kdWxlQW5kQWxsQ29tcG9uZW50c1N5bmM8VD4obW9kdWxlVHlwZTogVHlwZTxUPik6IE1vZHVsZVdpdGhDb21wb25lbnRGYWN0b3JpZXM8VD4ge1xuICAgIGNvbnN0IG5nTW9kdWxlRmFjdG9yeSA9IHRoaXMuY29tcGlsZU1vZHVsZVN5bmMobW9kdWxlVHlwZSk7XG4gICAgY29uc3QgY29tcG9uZW50RmFjdG9yaWVzID0gdGhpcy50ZXN0QmVkLl9nZXRDb21wb25lbnRGYWN0b3JpZXMobW9kdWxlVHlwZSBhcyBOZ01vZHVsZVR5cGU8VD4pO1xuICAgIHJldHVybiBuZXcgTW9kdWxlV2l0aENvbXBvbmVudEZhY3RvcmllcyhuZ01vZHVsZUZhY3RvcnksIGNvbXBvbmVudEZhY3Rvcmllcyk7XG4gIH1cblxuICBjb21waWxlTW9kdWxlQW5kQWxsQ29tcG9uZW50c0FzeW5jPFQ+KG1vZHVsZVR5cGU6IFR5cGU8VD4pOlxuICAgICAgUHJvbWlzZTxNb2R1bGVXaXRoQ29tcG9uZW50RmFjdG9yaWVzPFQ+PiB7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh0aGlzLmNvbXBpbGVNb2R1bGVBbmRBbGxDb21wb25lbnRzU3luYyhtb2R1bGVUeXBlKSk7XG4gIH1cblxuICBjbGVhckNhY2hlKCk6IHZvaWQge31cblxuICBjbGVhckNhY2hlRm9yKHR5cGU6IFR5cGU8YW55Pik6IHZvaWQge31cblxuICBnZXRNb2R1bGVJZChtb2R1bGVUeXBlOiBUeXBlPGFueT4pOiBzdHJpbmd8dW5kZWZpbmVkIHtcbiAgICBjb25zdCBtZXRhID0gdGhpcy50ZXN0QmVkLl9nZXRNb2R1bGVSZXNvbHZlcigpLnJlc29sdmUobW9kdWxlVHlwZSk7XG4gICAgcmV0dXJuIG1ldGEgJiYgbWV0YS5pZCB8fCB1bmRlZmluZWQ7XG4gIH1cbn1cbiJdfQ==