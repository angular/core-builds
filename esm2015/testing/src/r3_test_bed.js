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
import { clearResolutionOfComponentResourcesQueue, resolveComponentResources } from '../../src/metadata/resource_loading';
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
            }
        });
        /** @type {?} */
        let resourceLoader;
        return resolveComponentResources(url => {
            if (!resourceLoader) {
                resourceLoader = this.compilerInjector.get(ResourceLoader);
            }
            return Promise.resolve(resourceLoader.get(url));
        })
            .then(() => {
            componentOverrides.forEach((override) => {
                // Once resolved, we override the existing metadata, ensuring that the resolved
                // resources
                // are only available until the next TestBed reset (when `resetTestingModule` is called)
                this.overrideComponent(override[0], { set: override[1] });
            });
        });
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicjNfdGVzdF9iZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3Rlc3Rpbmcvc3JjL3IzX3Rlc3RfYmVkLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7OztBQVlBLE9BQU8sRUFDTCxxQkFBcUIsRUFDckIsUUFBUSxFQUdSLFFBQVEsRUFDUiw0QkFBNEIsRUFDNUIsUUFBUSxFQUVSLE1BQU0sRUFNTixpQkFBaUIsRUFFakIsaUJBQWlCLElBQUksZ0JBQWdCLEVBQ3JDLGlCQUFpQixJQUFJLGdCQUFnQixFQUNyQyxnQkFBZ0IsSUFBSSxlQUFlLEVBQ25DLGNBQWMsSUFBSSxhQUFhLEVBQy9CLFlBQVksSUFBSSxXQUFXLEVBRTNCLGdCQUFnQixJQUFJLGlCQUFpQixFQUVyQyx3QkFBd0IsSUFBSSxnQkFBZ0IsRUFDNUMsbUJBQW1CLElBQUksV0FBVyxFQUNsQyxpQkFBaUIsSUFBSSxnQkFBZ0IsRUFDckMsaUJBQWlCLElBQUksZ0JBQWdCLEVBQ3JDLG9CQUFvQixJQUFJLG1CQUFtQixFQUMzQyxZQUFZLElBQUksV0FBVyxFQUMzQixpQkFBaUIsSUFBSSxnQkFBZ0IsRUFDckMsd0NBQXdDLElBQUksdUNBQXVDLEVBQ25GLDJCQUEyQixJQUFJLDBCQUEwQixFQUN6RCx3QkFBd0IsSUFBSSx1QkFBdUIsRUFDbkQsVUFBVSxJQUFJLFNBQVMsRUFDdkIsb0JBQW9CLElBQUksbUJBQW1CLEVBRzNDLGdCQUFnQixHQUNqQixNQUFNLGVBQWUsQ0FBQzs7QUFFdkIsT0FBTyxFQUFDLGNBQWMsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBRWpELE9BQU8sRUFBQyx3Q0FBd0MsRUFBRSx5QkFBeUIsRUFBQyxNQUFNLHFDQUFxQyxDQUFDO0FBQ3hILE9BQU8sRUFBQyxnQkFBZ0IsRUFBQyxNQUFNLHFCQUFxQixDQUFDO0FBRXJELE9BQU8sRUFBQyxpQkFBaUIsRUFBRSxpQkFBaUIs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LENBQUMsT0FBTyxDQUFDLGtCQUFrQixFQUFFLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQztRQUNsRSxPQUFPLElBQUksSUFBSSxJQUFJLENBQUMsRUFBRSxJQUFJLFNBQVMsQ0FBQztJQUN0QyxDQUFDO0NBQ0Y7Ozs7OztJQTlCYSxpQ0FBK0IiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbi8vIFRoZSBmb3JtYXR0ZXIgYW5kIENJIGRpc2FncmVlIG9uIGhvdyB0aGlzIGltcG9ydCBzdGF0ZW1lbnQgc2hvdWxkIGJlIGZvcm1hdHRlZC4gQm90aCB0cnkgdG8ga2VlcFxuLy8gaXQgb24gb25lIGxpbmUsIHRvbywgd2hpY2ggaGFzIGdvdHRlbiB2ZXJ5IGhhcmQgdG8gcmVhZCAmIG1hbmFnZS4gU28gZGlzYWJsZSB0aGUgZm9ybWF0dGVyIGZvclxuLy8gdGhpcyBzdGF0ZW1lbnQgb25seS5cbi8vIGNsYW5nLWZvcm1hdCBvZmZcbmltcG9ydCB7XG4gIEFwcGxpY2F0aW9uSW5pdFN0YXR1cyxcbiAgQ29tcGlsZXIsXG4gIENvbXBvbmVudCxcbiAgRGlyZWN0aXZlLFxuICBJbmplY3RvcixcbiAgTW9kdWxlV2l0aENvbXBvbmVudEZhY3RvcmllcyxcbiAgTmdNb2R1bGUsXG4gIE5nTW9kdWxlRmFjdG9yeSxcbiAgTmdab25lLFxuICBQaXBlLFxuICBQbGF0Zm9ybVJlZixcbiAgUHJvdmlkZXIsXG4gIFNjaGVtYU1ldGFkYXRhLFxuICBUeXBlLFxuICByZXNvbHZlRm9yd2FyZFJlZixcbiAgybVJbmplY3RhYmxlRGVmIGFzIEluamVjdGFibGVEZWYsXG4gIMm1TkdfQ09NUE9ORU5UX0RFRiBhcyBOR19DT01QT05FTlRfREVGLFxuICDJtU5HX0RJUkVDVElWRV9ERUYgYXMgTkdfRElSRUNUSVZFX0RFRixcbiAgybVOR19JTkpFQ1RPUl9ERUYgYXMgTkdfSU5KRUNUT1JfREVGLFxuICDJtU5HX01PRFVMRV9ERUYgYXMgTkdfTU9EVUxFX0RFRixcbiAgybVOR19QSVBFX0RFRiBhcyBOR19QSVBFX0RFRixcbiAgybVOZ01vZHVsZURlZiBhcyBOZ01vZHVsZURlZixcbiAgybVOZ01vZHVsZUZhY3RvcnkgYXMgUjNOZ01vZHVsZUZhY3RvcnksXG4gIMm1TmdNb2R1bGVUeXBlIGFzIE5nTW9kdWxlVHlwZSxcbiAgybVSZW5kZXIzQ29tcG9uZW50RmFjdG9yeSBhcyBDb21wb25lbnRGYWN0b3J5LFxuICDJtVJlbmRlcjNOZ01vZHVsZVJlZiBhcyBOZ01vZHVsZVJlZixcbiAgybVjb21waWxlQ29tcG9uZW50IGFzIGNvbXBpbGVDb21wb25lbnQsXG4gIMm1Y29tcGlsZURpcmVjdGl2ZSBhcyBjb21waWxlRGlyZWN0aXZlLFxuICDJtWNvbXBpbGVOZ01vZHVsZURlZnMgYXMgY29tcGlsZU5nTW9kdWxlRGVmcyxcbiAgybVjb21waWxlUGlwZSBhcyBjb21waWxlUGlwZSxcbiAgybVnZXRJbmplY3RhYmxlRGVmIGFzIGdldEluamVjdGFibGVEZWYsXG4gIMm1Zmx1c2hNb2R1bGVTY29waW5nUXVldWVBc011Y2hBc1Bvc3NpYmxlIGFzIGZsdXNoTW9kdWxlU2NvcGluZ1F1ZXVlQXNNdWNoQXNQb3NzaWJsZSxcbiAgybVwYXRjaENvbXBvbmVudERlZldpdGhTY29wZSBhcyBwYXRjaENvbXBvbmVudERlZldpdGhTY29wZSxcbiAgybVyZXNldENvbXBpbGVkQ29tcG9uZW50cyBhcyByZXNldENvbXBpbGVkQ29tcG9uZW50cyxcbiAgybVzdHJpbmdpZnkgYXMgc3RyaW5naWZ5LFxuICDJtXRyYW5zaXRpdmVTY29wZXNGb3IgYXMgdHJhbnNpdGl2ZVNjb3Blc0ZvcixcbiAgQ29tcGlsZXJPcHRpb25zLFxuICBTdGF0aWNQcm92aWRlcixcbiAgQ09NUElMRVJfT1BUSU9OUyxcbn0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG4vLyBjbGFuZy1mb3JtYXQgb25cbmltcG9ydCB7UmVzb3VyY2VMb2FkZXJ9IGZyb20gJ0Bhbmd1bGFyL2NvbXBpbGVyJztcblxuaW1wb3J0IHtjbGVhclJlc29sdXRpb25PZkNvbXBvbmVudFJlc291cmNlc1F1ZXVlLCByZXNvbHZlQ29tcG9uZW50UmVzb3VyY2VzfSBmcm9tICcuLi8uLi9zcmMvbWV0YWRhdGEvcmVzb3VyY2VfbG9hZGluZyc7XG5pbXBvcnQge0NvbXBvbmVudEZpeHR1cmV9IGZyb20gJy4vY29tcG9uZW50X2ZpeHR1cmUnO1xuaW1wb3J0IHtNZXRhZGF0YU92ZXJyaWRlfSBmcm9tICcuL21ldGFkYXRhX292ZXJyaWRlJztcbmltcG9ydCB7Q29tcG9uZW50UmVzb2x2ZXIsIERpcmVjdGl2ZVJlc29sdmVyLCBOZ01vZHVsZVJlc29sdmVyLCBQaXBlUmVzb2x2ZXIsIFJlc29sdmVyfSBmcm9tICcuL3Jlc29sdmVycyc7XG5pbXBvcnQge1Rlc3RCZWR9IGZyb20gJy4vdGVzdF9iZWQnO1xuaW1wb3J0IHtDb21wb25lbnRGaXh0dXJlQXV0b0RldGVjdCwgQ29tcG9uZW50Rml4dHVyZU5vTmdab25lLCBUZXN0QmVkU3RhdGljLCBUZXN0Q29tcG9uZW50UmVuZGVyZXIsIFRlc3RNb2R1bGVNZXRhZGF0YX0gZnJvbSAnLi90ZXN0X2JlZF9jb21tb24nO1xuXG5sZXQgX25leHRSb290RWxlbWVudElkID0gMDtcblxuY29uc3QgRU1QVFlfQVJSQVk6IFR5cGU8YW55PltdID0gW107XG5cbmNvbnN0IFVOREVGSU5FRDogU3ltYm9sID0gU3ltYm9sKCdVTkRFRklORUQnKTtcblxuLy8gUmVzb2x2ZXJzIGZvciBBbmd1bGFyIGRlY29yYXRvcnNcbnR5cGUgUmVzb2x2ZXJzID0ge1xuICBtb2R1bGU6IFJlc29sdmVyPE5nTW9kdWxlPixcbiAgY29tcG9uZW50OiBSZXNvbHZlcjxEaXJlY3RpdmU+LFxuICBkaXJlY3RpdmU6IFJlc29sdmVyPENvbXBvbmVudD4sXG4gIHBpcGU6IFJlc29sdmVyPFBpcGU+LFxufTtcblxuLyoqXG4gKiBAZGVzY3JpcHRpb25cbiAqIENvbmZpZ3VyZXMgYW5kIGluaXRpYWxpemVzIGVudmlyb25tZW50IGZvciB1bml0IHRlc3RpbmcgYW5kIHByb3ZpZGVzIG1ldGhvZHMgZm9yXG4gKiBjcmVhdGluZyBjb21wb25lbnRzIGFuZCBzZXJ2aWNlcyBpbiB1bml0IHRlc3RzLlxuICpcbiAqIFRlc3RCZWQgaXMgdGhlIHByaW1hcnkgYXBpIGZvciB3cml0aW5nIHVuaXQgdGVzdHMgZm9yIEFuZ3VsYXIgYXBwbGljYXRpb25zIGFuZCBsaWJyYXJpZXMuXG4gKlxuICogTm90ZTogVXNlIGBUZXN0QmVkYCBpbiB0ZXN0cy4gSXQgd2lsbCBiZSBzZXQgdG8gZWl0aGVyIGBUZXN0QmVkVmlld0VuZ2luZWAgb3IgYFRlc3RCZWRSZW5kZXIzYFxuICogYWNjb3JkaW5nIHRvIHRoZSBjb21waWxlciB1c2VkLlxuICovXG5leHBvcnQgY2xhc3MgVGVzdEJlZFJlbmRlcjMgaW1wbGVtZW50cyBJbmplY3RvciwgVGVzdEJlZCB7XG4gIC8qKlxuICAgKiBJbml0aWFsaXplIHRoZSBlbnZpcm9ubWVudCBmb3IgdGVzdGluZyB3aXRoIGEgY29tcGlsZXIgZmFjdG9yeSwgYSBQbGF0Zm9ybVJlZiwgYW5kIGFuXG4gICAqIGFuZ3VsYXIgbW9kdWxlLiBUaGVzZSBhcmUgY29tbW9uIHRvIGV2ZXJ5IHRlc3QgaW4gdGhlIHN1aXRlLlxuICAgKlxuICAgKiBUaGlzIG1heSBvbmx5IGJlIGNhbGxlZCBvbmNlLCB0byBzZXQgdXAgdGhlIGNvbW1vbiBwcm92aWRlcnMgZm9yIHRoZSBjdXJyZW50IHRlc3RcbiAgICogc3VpdGUgb24gdGhlIGN1cnJlbnQgcGxhdGZvcm0uIElmIHlvdSBhYnNvbHV0ZWx5IG5lZWQgdG8gY2hhbmdlIHRoZSBwcm92aWRlcnMsXG4gICAqIGZpcnN0IHVzZSBgcmVzZXRUZXN0RW52aXJvbm1lbnRgLlxuICAgKlxuICAgKiBUZXN0IG1vZHVsZXMgYW5kIHBsYXRmb3JtcyBmb3IgaW5kaXZpZHVhbCBwbGF0Zm9ybXMgYXJlIGF2YWlsYWJsZSBmcm9tXG4gICAqICdAYW5ndWxhci88cGxhdGZvcm1fbmFtZT4vdGVzdGluZycuXG4gICAqXG4gICAqIEBwdWJsaWNBcGlcbiAgICovXG4gIHN0YXRpYyBpbml0VGVzdEVudmlyb25tZW50KFxuICAgICAgbmdNb2R1bGU6IFR5cGU8YW55PnxUeXBlPGFueT5bXSwgcGxhdGZvcm06IFBsYXRmb3JtUmVmLCBhb3RTdW1tYXJpZXM/OiAoKSA9PiBhbnlbXSk6IFRlc3RCZWQge1xuICAgIGNvbnN0IHRlc3RCZWQgPSBfZ2V0VGVzdEJlZFJlbmRlcjMoKTtcbiAgICB0ZXN0QmVkLmluaXRUZXN0RW52aXJvbm1lbnQobmdNb2R1bGUsIHBsYXRmb3JtLCBhb3RTdW1tYXJpZXMpO1xuICAgIHJldHVybiB0ZXN0QmVkO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlc2V0IHRoZSBwcm92aWRlcnMgZm9yIHRoZSB0ZXN0IGluamVjdG9yLlxuICAgKlxuICAgKiBAcHVibGljQXBpXG4gICAqL1xuICBzdGF0aWMgcmVzZXRUZXN0RW52aXJvbm1lbnQoKTogdm9pZCB7IF9nZXRUZXN0QmVkUmVuZGVyMygpLnJlc2V0VGVzdEVudmlyb25tZW50KCk7IH1cblxuICBzdGF0aWMgY29uZmlndXJlQ29tcGlsZXIoY29uZmlnOiB7cHJvdmlkZXJzPzogYW55W107IHVzZUppdD86IGJvb2xlYW47fSk6IFRlc3RCZWRTdGF0aWMge1xuICAgIF9nZXRUZXN0QmVkUmVuZGVyMygpLmNvbmZpZ3VyZUNvbXBpbGVyKGNvbmZpZyk7XG4gICAgcmV0dXJuIFRlc3RCZWRSZW5kZXIzIGFzIGFueSBhcyBUZXN0QmVkU3RhdGljO1xuICB9XG5cbiAgLyoqXG4gICAqIEFsbG93cyBvdmVycmlkaW5nIGRlZmF1bHQgcHJvdmlkZXJzLCBkaXJlY3RpdmVzLCBwaXBlcywgbW9kdWxlcyBvZiB0aGUgdGVzdCBpbmplY3RvcixcbiAgICogd2hpY2ggYXJlIGRlZmluZWQgaW4gdGVzdF9pbmplY3Rvci5qc1xuICAgKi9cbiAgc3RhdGljIGNvbmZpZ3VyZVRlc3RpbmdNb2R1bGUobW9kdWxlRGVmOiBUZXN0TW9kdWxlTWV0YWRhdGEpOiBUZXN0QmVkU3RhdGljIHtcbiAgICBfZ2V0VGVzdEJlZFJlbmRlcjMoKS5jb25maWd1cmVUZXN0aW5nTW9kdWxlKG1vZHVsZURlZik7XG4gICAgcmV0dXJuIFRlc3RCZWRSZW5kZXIzIGFzIGFueSBhcyBUZXN0QmVkU3RhdGljO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbXBpbGUgY29tcG9uZW50cyB3aXRoIGEgYHRlbXBsYXRlVXJsYCBmb3IgdGhlIHRlc3QncyBOZ01vZHVsZS5cbiAgICogSXQgaXMgbmVjZXNzYXJ5IHRvIGNhbGwgdGhpcyBmdW5jdGlvblxuICAgKiBhcyBmZXRjaGluZyB1cmxzIGlzIGFzeW5jaHJvbm91cy5cbiAgICovXG4gIHN0YXRpYyBjb21waWxlQ29tcG9uZW50cygpOiBQcm9taXNlPGFueT4geyByZXR1cm4gX2dldFRlc3RCZWRSZW5kZXIzKCkuY29tcGlsZUNvbXBvbmVudHMoKTsgfVxuXG4gIHN0YXRpYyBvdmVycmlkZU1vZHVsZShuZ01vZHVsZTogVHlwZTxhbnk+LCBvdmVycmlkZTogTWV0YWRhdGFPdmVycmlkZTxOZ01vZHVsZT4pOiBUZXN0QmVkU3RhdGljIHtcbiAgICBfZ2V0VGVzdEJlZFJlbmRlcjMoKS5vdmVycmlkZU1vZHVsZShuZ01vZHVsZSwgb3ZlcnJpZGUpO1xuICAgIHJldHVybiBUZXN0QmVkUmVuZGVyMyBhcyBhbnkgYXMgVGVzdEJlZFN0YXRpYztcbiAgfVxuXG4gIHN0YXRpYyBvdmVycmlkZUNvbXBvbmVudChjb21wb25lbnQ6IFR5cGU8YW55Piwgb3ZlcnJpZGU6IE1ldGFkYXRhT3ZlcnJpZGU8Q29tcG9uZW50Pik6XG4gICAgICBUZXN0QmVkU3RhdGljIHtcbiAgICBfZ2V0VGVzdEJlZFJlbmRlcjMoKS5vdmVycmlkZUNvbXBvbmVudChjb21wb25lbnQsIG92ZXJyaWRlKTtcbiAgICByZXR1cm4gVGVzdEJlZFJlbmRlcjMgYXMgYW55IGFzIFRlc3RCZWRTdGF0aWM7XG4gIH1cblxuICBzdGF0aWMgb3ZlcnJpZGVEaXJlY3RpdmUoZGlyZWN0aXZlOiBUeXBlPGFueT4sIG92ZXJyaWRlOiBNZXRhZGF0YU92ZXJyaWRlPERpcmVjdGl2ZT4pOlxuICAgICAgVGVzdEJlZFN0YXRpYyB7XG4gICAgX2dldFRlc3RCZWRSZW5kZXIzKCkub3ZlcnJpZGVEaXJlY3RpdmUoZGlyZWN0aXZlLCBvdmVycmlkZSk7XG4gICAgcmV0dXJuIFRlc3RCZWRSZW5kZXIzIGFzIGFueSBhcyBUZXN0QmVkU3RhdGljO1xuICB9XG5cbiAgc3RhdGljIG92ZXJyaWRlUGlwZShwaXBlOiBUeXBlPGFueT4sIG92ZXJyaWRlOiBNZXRhZGF0YU92ZXJyaWRlPFBpcGU+KTogVGVzdEJlZFN0YXRpYyB7XG4gICAgX2dldFRlc3RCZWRSZW5kZXIzKCkub3ZlcnJpZGVQaXBlKHBpcGUsIG92ZXJyaWRlKTtcbiAgICByZXR1cm4gVGVzdEJlZFJlbmRlcjMgYXMgYW55IGFzIFRlc3RCZWRTdGF0aWM7XG4gIH1cblxuICBzdGF0aWMgb3ZlcnJpZGVUZW1wbGF0ZShjb21wb25lbnQ6IFR5cGU8YW55PiwgdGVtcGxhdGU6IHN0cmluZyk6IFRlc3RCZWRTdGF0aWMge1xuICAgIF9nZXRUZXN0QmVkUmVuZGVyMygpLm92ZXJyaWRlQ29tcG9uZW50KGNvbXBvbmVudCwge3NldDoge3RlbXBsYXRlLCB0ZW1wbGF0ZVVybDogbnVsbCAhfX0pO1xuICAgIHJldHVybiBUZXN0QmVkUmVuZGVyMyBhcyBhbnkgYXMgVGVzdEJlZFN0YXRpYztcbiAgfVxuXG4gIC8qKlxuICAgKiBPdmVycmlkZXMgdGhlIHRlbXBsYXRlIG9mIHRoZSBnaXZlbiBjb21wb25lbnQsIGNvbXBpbGluZyB0aGUgdGVtcGxhdGVcbiAgICogaW4gdGhlIGNvbnRleHQgb2YgdGhlIFRlc3RpbmdNb2R1bGUuXG4gICAqXG4gICAqIE5vdGU6IFRoaXMgd29ya3MgZm9yIEpJVCBhbmQgQU9UZWQgY29tcG9uZW50cyBhcyB3ZWxsLlxuICAgKi9cbiAgc3RhdGljIG92ZXJyaWRlVGVtcGxhdGVVc2luZ1Rlc3RpbmdNb2R1bGUoY29tcG9uZW50OiBUeXBlPGFueT4sIHRlbXBsYXRlOiBzdHJpbmcpOiBUZXN0QmVkU3RhdGljIHtcbiAgICBfZ2V0VGVzdEJlZFJlbmRlcjMoKS5vdmVycmlkZVRlbXBsYXRlVXNpbmdUZXN0aW5nTW9kdWxlKGNvbXBvbmVudCwgdGVtcGxhdGUpO1xuICAgIHJldHVybiBUZXN0QmVkUmVuZGVyMyBhcyBhbnkgYXMgVGVzdEJlZFN0YXRpYztcbiAgfVxuXG4gIG92ZXJyaWRlVGVtcGxhdGVVc2luZ1Rlc3RpbmdNb2R1bGUoY29tcG9uZW50OiBUeXBlPGFueT4sIHRlbXBsYXRlOiBzdHJpbmcpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5faW5zdGFudGlhdGVkKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgJ0Nhbm5vdCBvdmVycmlkZSB0ZW1wbGF0ZSB3aGVuIHRoZSB0ZXN0IG1vZHVsZSBoYXMgYWxyZWFkeSBiZWVuIGluc3RhbnRpYXRlZCcpO1xuICAgIH1cbiAgICB0aGlzLl90ZW1wbGF0ZU92ZXJyaWRlcy5zZXQoY29tcG9uZW50LCB0ZW1wbGF0ZSk7XG4gIH1cblxuICBzdGF0aWMgb3ZlcnJpZGVQcm92aWRlcih0b2tlbjogYW55LCBwcm92aWRlcjoge1xuICAgIHVzZUZhY3Rvcnk6IEZ1bmN0aW9uLFxuICAgIGRlcHM6IGFueVtdLFxuICB9KTogVGVzdEJlZFN0YXRpYztcbiAgc3RhdGljIG92ZXJyaWRlUHJvdmlkZXIodG9rZW46IGFueSwgcHJvdmlkZXI6IHt1c2VWYWx1ZTogYW55O30pOiBUZXN0QmVkU3RhdGljO1xuICBzdGF0aWMgb3ZlcnJpZGVQcm92aWRlcih0b2tlbjogYW55LCBwcm92aWRlcjoge1xuICAgIHVzZUZhY3Rvcnk/OiBGdW5jdGlvbixcbiAgICB1c2VWYWx1ZT86IGFueSxcbiAgICBkZXBzPzogYW55W10sXG4gIH0pOiBUZXN0QmVkU3RhdGljIHtcbiAgICBfZ2V0VGVzdEJlZFJlbmRlcjMoKS5vdmVycmlkZVByb3ZpZGVyKHRva2VuLCBwcm92aWRlcik7XG4gICAgcmV0dXJuIFRlc3RCZWRSZW5kZXIzIGFzIGFueSBhcyBUZXN0QmVkU3RhdGljO1xuICB9XG5cbiAgLyoqXG4gICAqIE92ZXJ3cml0ZXMgYWxsIHByb3ZpZGVycyBmb3IgdGhlIGdpdmVuIHRva2VuIHdpdGggdGhlIGdpdmVuIHByb3ZpZGVyIGRlZmluaXRpb24uXG4gICAqXG4gICAqIEBkZXByZWNhdGVkIGFzIGl0IG1ha2VzIGFsbCBOZ01vZHVsZXMgbGF6eS4gSW50cm9kdWNlZCBvbmx5IGZvciBtaWdyYXRpbmcgb2ZmIG9mIGl0LlxuICAgKi9cbiAgc3RhdGljIGRlcHJlY2F0ZWRPdmVycmlkZVByb3ZpZGVyKHRva2VuOiBhbnksIHByb3ZpZGVyOiB7XG4gICAgdXNlRmFjdG9yeTogRnVuY3Rpb24sXG4gICAgZGVwczogYW55W10sXG4gIH0pOiB2b2lkO1xuICBzdGF0aWMgZGVwcmVjYXRlZE92ZXJyaWRlUHJvdmlkZXIodG9rZW46IGFueSwgcHJvdmlkZXI6IHt1c2VWYWx1ZTogYW55O30pOiB2b2lkO1xuICBzdGF0aWMgZGVwcmVjYXRlZE92ZXJyaWRlUHJvdmlkZXIodG9rZW46IGFueSwgcHJvdmlkZXI6IHtcbiAgICB1c2VGYWN0b3J5PzogRnVuY3Rpb24sXG4gICAgdXNlVmFsdWU/OiBhbnksXG4gICAgZGVwcz86IGFueVtdLFxuICB9KTogVGVzdEJlZFN0YXRpYyB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdSZW5kZXIzVGVzdEJlZC5kZXByZWNhdGVkT3ZlcnJpZGVQcm92aWRlciBpcyBub3QgaW1wbGVtZW50ZWQnKTtcbiAgfVxuXG4gIHN0YXRpYyBnZXQodG9rZW46IGFueSwgbm90Rm91bmRWYWx1ZTogYW55ID0gSW5qZWN0b3IuVEhST1dfSUZfTk9UX0ZPVU5EKTogYW55IHtcbiAgICByZXR1cm4gX2dldFRlc3RCZWRSZW5kZXIzKCkuZ2V0KHRva2VuLCBub3RGb3VuZFZhbHVlKTtcbiAgfVxuXG4gIHN0YXRpYyBjcmVhdGVDb21wb25lbnQ8VD4oY29tcG9uZW50OiBUeXBlPFQ+KTogQ29tcG9uZW50Rml4dHVyZTxUPiB7XG4gICAgcmV0dXJuIF9nZXRUZXN0QmVkUmVuZGVyMygpLmNyZWF0ZUNvbXBvbmVudChjb21wb25lbnQpO1xuICB9XG5cbiAgc3RhdGljIHJlc2V0VGVzdGluZ01vZHVsZSgpOiBUZXN0QmVkU3RhdGljIHtcbiAgICBfZ2V0VGVzdEJlZFJlbmRlcjMoKS5yZXNldFRlc3RpbmdNb2R1bGUoKTtcbiAgICByZXR1cm4gVGVzdEJlZFJlbmRlcjMgYXMgYW55IGFzIFRlc3RCZWRTdGF0aWM7XG4gIH1cblxuICAvLyBQcm9wZXJ0aWVzXG5cbiAgcGxhdGZvcm06IFBsYXRmb3JtUmVmID0gbnVsbCAhO1xuICBuZ01vZHVsZTogVHlwZTxhbnk+fFR5cGU8YW55PltdID0gbnVsbCAhO1xuXG4gIC8vIG1ldGFkYXRhIG92ZXJyaWRlc1xuICBwcml2YXRlIF9tb2R1bGVPdmVycmlkZXM6IFtUeXBlPGFueT4sIE1ldGFkYXRhT3ZlcnJpZGU8TmdNb2R1bGU+XVtdID0gW107XG4gIHByaXZhdGUgX2NvbXBvbmVudE92ZXJyaWRlczogW1R5cGU8YW55PiwgTWV0YWRhdGFPdmVycmlkZTxDb21wb25lbnQ+XVtdID0gW107XG4gIHByaXZhdGUgX2RpcmVjdGl2ZU92ZXJyaWRlczogW1R5cGU8YW55PiwgTWV0YWRhdGFPdmVycmlkZTxEaXJlY3RpdmU+XVtdID0gW107XG4gIHByaXZhdGUgX3BpcGVPdmVycmlkZXM6IFtUeXBlPGFueT4sIE1ldGFkYXRhT3ZlcnJpZGU8UGlwZT5dW10gPSBbXTtcbiAgcHJpdmF0ZSBfcHJvdmlkZXJPdmVycmlkZXM6IFByb3ZpZGVyW10gPSBbXTtcbiAgcHJpdmF0ZSBfY29tcGlsZXJQcm92aWRlcnM6IFN0YXRpY1Byb3ZpZGVyW10gPSBbXTtcbiAgcHJpdmF0ZSBfcm9vdFByb3ZpZGVyT3ZlcnJpZGVzOiBQcm92aWRlcltdID0gW107XG4gIHByaXZhdGUgX3Byb3ZpZGVyT3ZlcnJpZGVzQnlUb2tlbjogTWFwPGFueSwgUHJvdmlkZXJbXT4gPSBuZXcgTWFwKCk7XG4gIHByaXZhdGUgX3RlbXBsYXRlT3ZlcnJpZGVzOiBNYXA8VHlwZTxhbnk+LCBzdHJpbmc+ID0gbmV3IE1hcCgpO1xuICBwcml2YXRlIF9yZXNvbHZlcnM6IFJlc29sdmVycyA9IG51bGwgITtcblxuICAvLyB0ZXN0IG1vZHVsZSBjb25maWd1cmF0aW9uXG4gIHByaXZhdGUgX3Byb3ZpZGVyczogUHJvdmlkZXJbXSA9IFtdO1xuICBwcml2YXRlIF9jb21waWxlck9wdGlvbnM6IENvbXBpbGVyT3B0aW9uc1tdID0gW107XG4gIHByaXZhdGUgX2RlY2xhcmF0aW9uczogQXJyYXk8VHlwZTxhbnk+fGFueVtdfGFueT4gPSBbXTtcbiAgcHJpdmF0ZSBfaW1wb3J0czogQXJyYXk8VHlwZTxhbnk+fGFueVtdfGFueT4gPSBbXTtcbiAgcHJpdmF0ZSBfc2NoZW1hczogQXJyYXk8U2NoZW1hTWV0YWRhdGF8YW55W10+ID0gW107XG5cbiAgcHJpdmF0ZSBfYWN0aXZlRml4dHVyZXM6IENvbXBvbmVudEZpeHR1cmU8YW55PltdID0gW107XG5cbiAgcHJpdmF0ZSBfY29tcGlsZXJJbmplY3RvcjogSW5qZWN0b3IgPSBudWxsICE7XG4gIHByaXZhdGUgX21vZHVsZVJlZjogTmdNb2R1bGVSZWY8YW55PiA9IG51bGwgITtcbiAgcHJpdmF0ZSBfdGVzdE1vZHVsZVR5cGU6IE5nTW9kdWxlVHlwZTxhbnk+ID0gbnVsbCAhO1xuXG4gIHByaXZhdGUgX2luc3RhbnRpYXRlZDogYm9vbGVhbiA9IGZhbHNlO1xuICBwcml2YXRlIF9nbG9iYWxDb21waWxhdGlvbkNoZWNrZWQgPSBmYWxzZTtcblxuICAvLyBNYXAgdGhhdCBrZWVwcyBpbml0aWFsIHZlcnNpb24gb2YgY29tcG9uZW50L2RpcmVjdGl2ZS9waXBlIGRlZnMgaW4gY2FzZVxuICAvLyB3ZSBjb21waWxlIGEgVHlwZSBhZ2FpbiwgdGh1cyBvdmVycmlkaW5nIHJlc3BlY3RpdmUgc3RhdGljIGZpZWxkcy4gVGhpcyBpc1xuICAvLyByZXF1aXJlZCB0byBtYWtlIHN1cmUgd2UgcmVzdG9yZSBkZWZzIHRvIHRoZWlyIGluaXRpYWwgc3RhdGVzIGJldHdlZW4gdGVzdCBydW5zXG4gIHByaXZhdGUgX2luaXRpYU5nRGVmczogTWFwPFR5cGU8YW55PiwgW3N0cmluZywgUHJvcGVydHlEZXNjcmlwdG9yfHVuZGVmaW5lZF0+ID0gbmV3IE1hcCgpO1xuXG4gIC8qKlxuICAgKiBJbml0aWFsaXplIHRoZSBlbnZpcm9ubWVudCBmb3IgdGVzdGluZyB3aXRoIGEgY29tcGlsZXIgZmFjdG9yeSwgYSBQbGF0Zm9ybVJlZiwgYW5kIGFuXG4gICAqIGFuZ3VsYXIgbW9kdWxlLiBUaGVzZSBhcmUgY29tbW9uIHRvIGV2ZXJ5IHRlc3QgaW4gdGhlIHN1aXRlLlxuICAgKlxuICAgKiBUaGlzIG1heSBvbmx5IGJlIGNhbGxlZCBvbmNlLCB0byBzZXQgdXAgdGhlIGNvbW1vbiBwcm92aWRlcnMgZm9yIHRoZSBjdXJyZW50IHRlc3RcbiAgICogc3VpdGUgb24gdGhlIGN1cnJlbnQgcGxhdGZvcm0uIElmIHlvdSBhYnNvbHV0ZWx5IG5lZWQgdG8gY2hhbmdlIHRoZSBwcm92aWRlcnMsXG4gICAqIGZpcnN0IHVzZSBgcmVzZXRUZXN0RW52aXJvbm1lbnRgLlxuICAgKlxuICAgKiBUZXN0IG1vZHVsZXMgYW5kIHBsYXRmb3JtcyBmb3IgaW5kaXZpZHVhbCBwbGF0Zm9ybXMgYXJlIGF2YWlsYWJsZSBmcm9tXG4gICAqICdAYW5ndWxhci88cGxhdGZvcm1fbmFtZT4vdGVzdGluZycuXG4gICAqXG4gICAqIEBwdWJsaWNBcGlcbiAgICovXG4gIGluaXRUZXN0RW52aXJvbm1lbnQoXG4gICAgICBuZ01vZHVsZTogVHlwZTxhbnk+fFR5cGU8YW55PltdLCBwbGF0Zm9ybTogUGxhdGZvcm1SZWYsIGFvdFN1bW1hcmllcz86ICgpID0+IGFueVtdKTogdm9pZCB7XG4gICAgaWYgKHRoaXMucGxhdGZvcm0gfHwgdGhpcy5uZ01vZHVsZSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3Qgc2V0IGJhc2UgcHJvdmlkZXJzIGJlY2F1c2UgaXQgaGFzIGFscmVhZHkgYmVlbiBjYWxsZWQnKTtcbiAgICB9XG4gICAgdGhpcy5wbGF0Zm9ybSA9IHBsYXRmb3JtO1xuICAgIHRoaXMubmdNb2R1bGUgPSBuZ01vZHVsZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXNldCB0aGUgcHJvdmlkZXJzIGZvciB0aGUgdGVzdCBpbmplY3Rvci5cbiAgICpcbiAgICogQHB1YmxpY0FwaVxuICAgKi9cbiAgcmVzZXRUZXN0RW52aXJvbm1lbnQoKTogdm9pZCB7XG4gICAgdGhpcy5yZXNldFRlc3RpbmdNb2R1bGUoKTtcbiAgICB0aGlzLnBsYXRmb3JtID0gbnVsbCAhO1xuICAgIHRoaXMubmdNb2R1bGUgPSBudWxsICE7XG4gIH1cblxuICByZXNldFRlc3RpbmdNb2R1bGUoKTogdm9pZCB7XG4gICAgdGhpcy5fY2hlY2tHbG9iYWxDb21waWxhdGlvbkZpbmlzaGVkKCk7XG4gICAgcmVzZXRDb21waWxlZENvbXBvbmVudHMoKTtcbiAgICAvLyByZXNldCBtZXRhZGF0YSBvdmVycmlkZXNcbiAgICB0aGlzLl9tb2R1bGVPdmVycmlkZXMgPSBbXTtcbiAgICB0aGlzLl9jb21wb25lbnRPdmVycmlkZXMgPSBbXTtcbiAgICB0aGlzLl9kaXJlY3RpdmVPdmVycmlkZXMgPSBbXTtcbiAgICB0aGlzLl9waXBlT3ZlcnJpZGVzID0gW107XG4gICAgdGhpcy5fcHJvdmlkZXJPdmVycmlkZXMgPSBbXTtcbiAgICB0aGlzLl9yb290UHJvdmlkZXJPdmVycmlkZXMgPSBbXTtcbiAgICB0aGlzLl9wcm92aWRlck92ZXJyaWRlc0J5VG9rZW4uY2xlYXIoKTtcbiAgICB0aGlzLl90ZW1wbGF0ZU92ZXJyaWRlcy5jbGVhcigpO1xuICAgIHRoaXMuX3Jlc29sdmVycyA9IG51bGwgITtcblxuICAgIC8vIHJlc2V0IHRlc3QgbW9kdWxlIGNvbmZpZ1xuICAgIHRoaXMuX3Byb3ZpZGVycyA9IFtdO1xuICAgIHRoaXMuX2NvbXBpbGVyT3B0aW9ucyA9IFtdO1xuICAgIHRoaXMuX2NvbXBpbGVyUHJvdmlkZXJzID0gW107XG4gICAgdGhpcy5fZGVjbGFyYXRpb25zID0gW107XG4gICAgdGhpcy5faW1wb3J0cyA9IFtdO1xuICAgIHRoaXMuX3NjaGVtYXMgPSBbXTtcbiAgICB0aGlzLl9tb2R1bGVSZWYgPSBudWxsICE7XG4gICAgdGhpcy5fdGVzdE1vZHVsZVR5cGUgPSBudWxsICE7XG5cbiAgICB0aGlzLl9jb21waWxlckluamVjdG9yID0gbnVsbCAhO1xuICAgIHRoaXMuX2luc3RhbnRpYXRlZCA9IGZhbHNlO1xuICAgIHRoaXMuX2FjdGl2ZUZpeHR1cmVzLmZvckVhY2goKGZpeHR1cmUpID0+IHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGZpeHR1cmUuZGVzdHJveSgpO1xuICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBjb25zb2xlLmVycm9yKCdFcnJvciBkdXJpbmcgY2xlYW51cCBvZiBjb21wb25lbnQnLCB7XG4gICAgICAgICAgY29tcG9uZW50OiBmaXh0dXJlLmNvbXBvbmVudEluc3RhbmNlLFxuICAgICAgICAgIHN0YWNrdHJhY2U6IGUsXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHRoaXMuX2FjdGl2ZUZpeHR1cmVzID0gW107XG5cbiAgICAvLyByZXN0b3JlIGluaXRpYWwgY29tcG9uZW50L2RpcmVjdGl2ZS9waXBlIGRlZnNcbiAgICB0aGlzLl9pbml0aWFOZ0RlZnMuZm9yRWFjaCgodmFsdWU6IFtzdHJpbmcsIFByb3BlcnR5RGVzY3JpcHRvcl0sIHR5cGU6IFR5cGU8YW55PikgPT4ge1xuICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHR5cGUsIHZhbHVlWzBdLCB2YWx1ZVsxXSk7XG4gICAgfSk7XG4gICAgdGhpcy5faW5pdGlhTmdEZWZzLmNsZWFyKCk7XG4gICAgY2xlYXJSZXNvbHV0aW9uT2ZDb21wb25lbnRSZXNvdXJjZXNRdWV1ZSgpO1xuICB9XG5cbiAgY29uZmlndXJlQ29tcGlsZXIoY29uZmlnOiB7cHJvdmlkZXJzPzogYW55W107IHVzZUppdD86IGJvb2xlYW47fSk6IHZvaWQge1xuICAgIGlmIChjb25maWcudXNlSml0ICE9IG51bGwpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcigndGhlIFJlbmRlcjMgY29tcGlsZXIgSmlUIG1vZGUgaXMgbm90IGNvbmZpZ3VyYWJsZSAhJyk7XG4gICAgfVxuXG4gICAgaWYgKGNvbmZpZy5wcm92aWRlcnMpIHtcbiAgICAgIHRoaXMuX3Byb3ZpZGVyT3ZlcnJpZGVzLnB1c2goLi4uY29uZmlnLnByb3ZpZGVycyk7XG4gICAgICB0aGlzLl9jb21waWxlclByb3ZpZGVycy5wdXNoKC4uLmNvbmZpZy5wcm92aWRlcnMpO1xuICAgIH1cbiAgfVxuXG4gIGNvbmZpZ3VyZVRlc3RpbmdNb2R1bGUobW9kdWxlRGVmOiBUZXN0TW9kdWxlTWV0YWRhdGEpOiB2b2lkIHtcbiAgICB0aGlzLl9hc3NlcnROb3RJbnN0YW50aWF0ZWQoJ1IzVGVzdEJlZC5jb25maWd1cmVUZXN0aW5nTW9kdWxlJywgJ2NvbmZpZ3VyZSB0aGUgdGVzdCBtb2R1bGUnKTtcbiAgICBpZiAobW9kdWxlRGVmLnByb3ZpZGVycykge1xuICAgICAgdGhpcy5fcHJvdmlkZXJzLnB1c2goLi4ubW9kdWxlRGVmLnByb3ZpZGVycyk7XG4gICAgfVxuICAgIGlmIChtb2R1bGVEZWYuZGVjbGFyYXRpb25zKSB7XG4gICAgICB0aGlzLl9kZWNsYXJhdGlvbnMucHVzaCguLi5tb2R1bGVEZWYuZGVjbGFyYXRpb25zKTtcbiAgICB9XG4gICAgaWYgKG1vZHVsZURlZi5pbXBvcnRzKSB7XG4gICAgICB0aGlzLl9pbXBvcnRzLnB1c2goLi4ubW9kdWxlRGVmLmltcG9ydHMpO1xuICAgIH1cbiAgICBpZiAobW9kdWxlRGVmLnNjaGVtYXMpIHtcbiAgICAgIHRoaXMuX3NjaGVtYXMucHVzaCguLi5tb2R1bGVEZWYuc2NoZW1hcyk7XG4gICAgfVxuICB9XG5cbiAgY29tcGlsZUNvbXBvbmVudHMoKTogUHJvbWlzZTxhbnk+IHtcbiAgICBjb25zdCByZXNvbHZlcnMgPSB0aGlzLl9nZXRSZXNvbHZlcnMoKTtcbiAgICBjb25zdCBkZWNsYXJhdGlvbnM6IFR5cGU8YW55PltdID0gZmxhdHRlbih0aGlzLl9kZWNsYXJhdGlvbnMgfHwgRU1QVFlfQVJSQVksIHJlc29sdmVGb3J3YXJkUmVmKTtcblxuICAgIGNvbnN0IGNvbXBvbmVudE92ZXJyaWRlczogW1R5cGU8YW55PiwgQ29tcG9uZW50XVtdID0gW107XG4gICAgLy8gQ29tcGlsZSB0aGUgY29tcG9uZW50cyBkZWNsYXJlZCBieSB0aGlzIG1vZHVsZVxuICAgIGRlY2xhcmF0aW9ucy5mb3JFYWNoKGRlY2xhcmF0aW9uID0+IHtcbiAgICAgIGNvbnN0IGNvbXBvbmVudCA9IHJlc29sdmVycy5jb21wb25lbnQucmVzb2x2ZShkZWNsYXJhdGlvbik7XG4gICAgICBpZiAoY29tcG9uZW50KSB7XG4gICAgICAgIC8vIFdlIG1ha2UgYSBjb3B5IG9mIHRoZSBtZXRhZGF0YSB0byBlbnN1cmUgdGhhdCB3ZSBkb24ndCBtdXRhdGUgdGhlIG9yaWdpbmFsIG1ldGFkYXRhXG4gICAgICAgIGNvbnN0IG1ldGFkYXRhID0gey4uLmNvbXBvbmVudH07XG4gICAgICAgIGNvbXBpbGVDb21wb25lbnQoZGVjbGFyYXRpb24sIG1ldGFkYXRhKTtcbiAgICAgICAgY29tcG9uZW50T3ZlcnJpZGVzLnB1c2goW2RlY2xhcmF0aW9uLCBtZXRhZGF0YV0pO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgbGV0IHJlc291cmNlTG9hZGVyOiBSZXNvdXJjZUxvYWRlcjtcblxuICAgIHJldHVybiByZXNvbHZlQ29tcG9uZW50UmVzb3VyY2VzKHVybCA9PiB7XG4gICAgICAgICAgICAgaWYgKCFyZXNvdXJjZUxvYWRlcikge1xuICAgICAgICAgICAgICAgcmVzb3VyY2VMb2FkZXIgPSB0aGlzLmNvbXBpbGVySW5qZWN0b3IuZ2V0KFJlc291cmNlTG9hZGVyKTtcbiAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShyZXNvdXJjZUxvYWRlci5nZXQodXJsKSk7XG4gICAgICAgICAgIH0pXG4gICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICBjb21wb25lbnRPdmVycmlkZXMuZm9yRWFjaCgob3ZlcnJpZGU6IFtUeXBlPGFueT4sIENvbXBvbmVudF0pID0+IHtcbiAgICAgICAgICAgIC8vIE9uY2UgcmVzb2x2ZWQsIHdlIG92ZXJyaWRlIHRoZSBleGlzdGluZyBtZXRhZGF0YSwgZW5zdXJpbmcgdGhhdCB0aGUgcmVzb2x2ZWRcbiAgICAgICAgICAgIC8vIHJlc291cmNlc1xuICAgICAgICAgICAgLy8gYXJlIG9ubHkgYXZhaWxhYmxlIHVudGlsIHRoZSBuZXh0IFRlc3RCZWQgcmVzZXQgKHdoZW4gYHJlc2V0VGVzdGluZ01vZHVsZWAgaXMgY2FsbGVkKVxuICAgICAgICAgICAgdGhpcy5vdmVycmlkZUNvbXBvbmVudChvdmVycmlkZVswXSwge3NldDogb3ZlcnJpZGVbMV19KTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gIH1cblxuICBnZXQodG9rZW46IGFueSwgbm90Rm91bmRWYWx1ZTogYW55ID0gSW5qZWN0b3IuVEhST1dfSUZfTk9UX0ZPVU5EKTogYW55IHtcbiAgICB0aGlzLl9pbml0SWZOZWVkZWQoKTtcbiAgICBpZiAodG9rZW4gPT09IFRlc3RCZWRSZW5kZXIzKSB7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgY29uc3QgcmVzdWx0ID0gdGhpcy5fbW9kdWxlUmVmLmluamVjdG9yLmdldCh0b2tlbiwgVU5ERUZJTkVEKTtcbiAgICByZXR1cm4gcmVzdWx0ID09PSBVTkRFRklORUQgPyB0aGlzLmNvbXBpbGVySW5qZWN0b3IuZ2V0KHRva2VuLCBub3RGb3VuZFZhbHVlKSA6IHJlc3VsdDtcbiAgfVxuXG4gIGV4ZWN1dGUodG9rZW5zOiBhbnlbXSwgZm46IEZ1bmN0aW9uLCBjb250ZXh0PzogYW55KTogYW55IHtcbiAgICB0aGlzLl9pbml0SWZOZWVkZWQoKTtcbiAgICBjb25zdCBwYXJhbXMgPSB0b2tlbnMubWFwKHQgPT4gdGhpcy5nZXQodCkpO1xuICAgIHJldHVybiBmbi5hcHBseShjb250ZXh0LCBwYXJhbXMpO1xuICB9XG5cbiAgb3ZlcnJpZGVNb2R1bGUobmdNb2R1bGU6IFR5cGU8YW55Piwgb3ZlcnJpZGU6IE1ldGFkYXRhT3ZlcnJpZGU8TmdNb2R1bGU+KTogdm9pZCB7XG4gICAgdGhpcy5fYXNzZXJ0Tm90SW5zdGFudGlhdGVkKCdvdmVycmlkZU1vZHVsZScsICdvdmVycmlkZSBtb2R1bGUgbWV0YWRhdGEnKTtcbiAgICB0aGlzLl9tb2R1bGVPdmVycmlkZXMucHVzaChbbmdNb2R1bGUsIG92ZXJyaWRlXSk7XG4gIH1cblxuICBvdmVycmlkZUNvbXBvbmVudChjb21wb25lbnQ6IFR5cGU8YW55Piwgb3ZlcnJpZGU6IE1ldGFkYXRhT3ZlcnJpZGU8Q29tcG9uZW50Pik6IHZvaWQge1xuICAgIHRoaXMuX2Fzc2VydE5vdEluc3RhbnRpYXRlZCgnb3ZlcnJpZGVDb21wb25lbnQnLCAnb3ZlcnJpZGUgY29tcG9uZW50IG1ldGFkYXRhJyk7XG4gICAgdGhpcy5fY29tcG9uZW50T3ZlcnJpZGVzLnB1c2goW2NvbXBvbmVudCwgb3ZlcnJpZGVdKTtcbiAgfVxuXG4gIG92ZXJyaWRlRGlyZWN0aXZlKGRpcmVjdGl2ZTogVHlwZTxhbnk+LCBvdmVycmlkZTogTWV0YWRhdGFPdmVycmlkZTxEaXJlY3RpdmU+KTogdm9pZCB7XG4gICAgdGhpcy5fYXNzZXJ0Tm90SW5zdGFudGlhdGVkKCdvdmVycmlkZURpcmVjdGl2ZScsICdvdmVycmlkZSBkaXJlY3RpdmUgbWV0YWRhdGEnKTtcbiAgICB0aGlzLl9kaXJlY3RpdmVPdmVycmlkZXMucHVzaChbZGlyZWN0aXZlLCBvdmVycmlkZV0pO1xuICB9XG5cbiAgb3ZlcnJpZGVQaXBlKHBpcGU6IFR5cGU8YW55Piwgb3ZlcnJpZGU6IE1ldGFkYXRhT3ZlcnJpZGU8UGlwZT4pOiB2b2lkIHtcbiAgICB0aGlzLl9hc3NlcnROb3RJbnN0YW50aWF0ZWQoJ292ZXJyaWRlUGlwZScsICdvdmVycmlkZSBwaXBlIG1ldGFkYXRhJyk7XG4gICAgdGhpcy5fcGlwZU92ZXJyaWRlcy5wdXNoKFtwaXBlLCBvdmVycmlkZV0pO1xuICB9XG5cbiAgLyoqXG4gICAqIE92ZXJ3cml0ZXMgYWxsIHByb3ZpZGVycyBmb3IgdGhlIGdpdmVuIHRva2VuIHdpdGggdGhlIGdpdmVuIHByb3ZpZGVyIGRlZmluaXRpb24uXG4gICAqL1xuICBvdmVycmlkZVByb3ZpZGVyKHRva2VuOiBhbnksIHByb3ZpZGVyOiB7dXNlRmFjdG9yeT86IEZ1bmN0aW9uLCB1c2VWYWx1ZT86IGFueSwgZGVwcz86IGFueVtdfSk6XG4gICAgICB2b2lkIHtcbiAgICBjb25zdCBwcm92aWRlckRlZiA9IHByb3ZpZGVyLnVzZUZhY3RvcnkgP1xuICAgICAgICB7cHJvdmlkZTogdG9rZW4sIHVzZUZhY3Rvcnk6IHByb3ZpZGVyLnVzZUZhY3RvcnksIGRlcHM6IHByb3ZpZGVyLmRlcHMgfHwgW119IDpcbiAgICAgICAge3Byb3ZpZGU6IHRva2VuLCB1c2VWYWx1ZTogcHJvdmlkZXIudXNlVmFsdWV9O1xuXG4gICAgbGV0IGluamVjdGFibGVEZWY6IEluamVjdGFibGVEZWY8YW55PnxudWxsO1xuICAgIGNvbnN0IGlzUm9vdCA9XG4gICAgICAgICh0eXBlb2YgdG9rZW4gIT09ICdzdHJpbmcnICYmIChpbmplY3RhYmxlRGVmID0gZ2V0SW5qZWN0YWJsZURlZih0b2tlbikpICYmXG4gICAgICAgICBpbmplY3RhYmxlRGVmLnByb3ZpZGVkSW4gPT09ICdyb290Jyk7XG4gICAgY29uc3Qgb3ZlcnJpZGVzQnVja2V0ID0gaXNSb290ID8gdGhpcy5fcm9vdFByb3ZpZGVyT3ZlcnJpZGVzIDogdGhpcy5fcHJvdmlkZXJPdmVycmlkZXM7XG4gICAgb3ZlcnJpZGVzQnVja2V0LnB1c2gocHJvdmlkZXJEZWYpO1xuXG4gICAgLy8ga2VlcCBhbGwgb3ZlcnJpZGVzIGdyb3VwZWQgYnkgdG9rZW4gYXMgd2VsbCBmb3IgZmFzdCBsb29rdXBzIHVzaW5nIHRva2VuXG4gICAgY29uc3Qgb3ZlcnJpZGVzRm9yVG9rZW4gPSB0aGlzLl9wcm92aWRlck92ZXJyaWRlc0J5VG9rZW4uZ2V0KHRva2VuKSB8fCBbXTtcbiAgICBvdmVycmlkZXNGb3JUb2tlbi5wdXNoKHByb3ZpZGVyRGVmKTtcbiAgICB0aGlzLl9wcm92aWRlck92ZXJyaWRlc0J5VG9rZW4uc2V0KHRva2VuLCBvdmVycmlkZXNGb3JUb2tlbik7XG4gIH1cblxuICAvKipcbiAgICogT3ZlcndyaXRlcyBhbGwgcHJvdmlkZXJzIGZvciB0aGUgZ2l2ZW4gdG9rZW4gd2l0aCB0aGUgZ2l2ZW4gcHJvdmlkZXIgZGVmaW5pdGlvbi5cbiAgICpcbiAgICogQGRlcHJlY2F0ZWQgYXMgaXQgbWFrZXMgYWxsIE5nTW9kdWxlcyBsYXp5LiBJbnRyb2R1Y2VkIG9ubHkgZm9yIG1pZ3JhdGluZyBvZmYgb2YgaXQuXG4gICAqL1xuICBkZXByZWNhdGVkT3ZlcnJpZGVQcm92aWRlcih0b2tlbjogYW55LCBwcm92aWRlcjoge1xuICAgIHVzZUZhY3Rvcnk6IEZ1bmN0aW9uLFxuICAgIGRlcHM6IGFueVtdLFxuICB9KTogdm9pZDtcbiAgZGVwcmVjYXRlZE92ZXJyaWRlUHJvdmlkZXIodG9rZW46IGFueSwgcHJvdmlkZXI6IHt1c2VWYWx1ZTogYW55O30pOiB2b2lkO1xuICBkZXByZWNhdGVkT3ZlcnJpZGVQcm92aWRlcihcbiAgICAgIHRva2VuOiBhbnksIHByb3ZpZGVyOiB7dXNlRmFjdG9yeT86IEZ1bmN0aW9uLCB1c2VWYWx1ZT86IGFueSwgZGVwcz86IGFueVtdfSk6IHZvaWQge1xuICAgIHRocm93IG5ldyBFcnJvcignTm8gaW1wbGVtZW50ZWQgaW4gSVZZJyk7XG4gIH1cblxuICBjcmVhdGVDb21wb25lbnQ8VD4odHlwZTogVHlwZTxUPik6IENvbXBvbmVudEZpeHR1cmU8VD4ge1xuICAgIHRoaXMuX2luaXRJZk5lZWRlZCgpO1xuXG4gICAgY29uc3QgdGVzdENvbXBvbmVudFJlbmRlcmVyOiBUZXN0Q29tcG9uZW50UmVuZGVyZXIgPSB0aGlzLmdldChUZXN0Q29tcG9uZW50UmVuZGVyZXIpO1xuICAgIGNvbnN0IHJvb3RFbElkID0gYHJvb3Qke19uZXh0Um9vdEVsZW1lbnRJZCsrfWA7XG4gICAgdGVzdENvbXBvbmVudFJlbmRlcmVyLmluc2VydFJvb3RFbGVtZW50KHJvb3RFbElkKTtcblxuICAgIGNvbnN0IGNvbXBvbmVudERlZiA9ICh0eXBlIGFzIGFueSkubmdDb21wb25lbnREZWY7XG5cbiAgICBpZiAoIWNvbXBvbmVudERlZikge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgIGBJdCBsb29rcyBsaWtlICcke3N0cmluZ2lmeSh0eXBlKX0nIGhhcyBub3QgYmVlbiBJVlkgY29tcGlsZWQgLSBpdCBoYXMgbm8gJ25nQ29tcG9uZW50RGVmJyBmaWVsZGApO1xuICAgIH1cblxuICAgIGNvbnN0IG5vTmdab25lOiBib29sZWFuID0gdGhpcy5nZXQoQ29tcG9uZW50Rml4dHVyZU5vTmdab25lLCBmYWxzZSk7XG4gICAgY29uc3QgYXV0b0RldGVjdDogYm9vbGVhbiA9IHRoaXMuZ2V0KENvbXBvbmVudEZpeHR1cmVBdXRvRGV0ZWN0LCBmYWxzZSk7XG4gICAgY29uc3Qgbmdab25lOiBOZ1pvbmUgPSBub05nWm9uZSA/IG51bGwgOiB0aGlzLmdldChOZ1pvbmUsIG51bGwpO1xuICAgIGNvbnN0IGNvbXBvbmVudEZhY3RvcnkgPSBuZXcgQ29tcG9uZW50RmFjdG9yeShjb21wb25lbnREZWYpO1xuICAgIGNvbnN0IGluaXRDb21wb25lbnQgPSAoKSA9PiB7XG4gICAgICBjb25zdCBjb21wb25lbnRSZWYgPVxuICAgICAgICAgIGNvbXBvbmVudEZhY3RvcnkuY3JlYXRlKEluamVjdG9yLk5VTEwsIFtdLCBgIyR7cm9vdEVsSWR9YCwgdGhpcy5fbW9kdWxlUmVmKTtcbiAgICAgIHJldHVybiBuZXcgQ29tcG9uZW50Rml4dHVyZTxhbnk+KGNvbXBvbmVudFJlZiwgbmdab25lLCBhdXRvRGV0ZWN0KTtcbiAgICB9O1xuICAgIGNvbnN0IGZpeHR1cmUgPSBuZ1pvbmUgPyBuZ1pvbmUucnVuKGluaXRDb21wb25lbnQpIDogaW5pdENvbXBvbmVudCgpO1xuICAgIHRoaXMuX2FjdGl2ZUZpeHR1cmVzLnB1c2goZml4dHVyZSk7XG4gICAgcmV0dXJuIGZpeHR1cmU7XG4gIH1cblxuICAvLyBpbnRlcm5hbCBtZXRob2RzXG5cbiAgcHJpdmF0ZSBfaW5pdElmTmVlZGVkKCk6IHZvaWQge1xuICAgIHRoaXMuX2NoZWNrR2xvYmFsQ29tcGlsYXRpb25GaW5pc2hlZCgpO1xuICAgIGlmICh0aGlzLl9pbnN0YW50aWF0ZWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLl9yZXNvbHZlcnMgPSB0aGlzLl9nZXRSZXNvbHZlcnMoKTtcbiAgICB0aGlzLl90ZXN0TW9kdWxlVHlwZSA9IHRoaXMuX2NyZWF0ZVRlc3RNb2R1bGUoKTtcbiAgICB0aGlzLl9jb21waWxlTmdNb2R1bGUodGhpcy5fdGVzdE1vZHVsZVR5cGUpO1xuXG4gICAgY29uc3QgcGFyZW50SW5qZWN0b3IgPSB0aGlzLnBsYXRmb3JtLmluamVjdG9yO1xuICAgIHRoaXMuX21vZHVsZVJlZiA9IG5ldyBOZ01vZHVsZVJlZih0aGlzLl90ZXN0TW9kdWxlVHlwZSwgcGFyZW50SW5qZWN0b3IpO1xuXG4gICAgLy8gQXBwbGljYXRpb25Jbml0U3RhdHVzLnJ1bkluaXRpYWxpemVycygpIGlzIG1hcmtlZCBAaW50ZXJuYWxcbiAgICAvLyB0byBjb3JlLiBDYXN0IGl0IHRvIGFueSBiZWZvcmUgYWNjZXNzaW5nIGl0LlxuICAgICh0aGlzLl9tb2R1bGVSZWYuaW5qZWN0b3IuZ2V0KEFwcGxpY2F0aW9uSW5pdFN0YXR1cykgYXMgYW55KS5ydW5Jbml0aWFsaXplcnMoKTtcbiAgICB0aGlzLl9pbnN0YW50aWF0ZWQgPSB0cnVlO1xuICB9XG5cbiAgcHJpdmF0ZSBfc3RvcmVOZ0RlZihwcm9wOiBzdHJpbmcsIHR5cGU6IFR5cGU8YW55Pikge1xuICAgIGlmICghdGhpcy5faW5pdGlhTmdEZWZzLmhhcyh0eXBlKSkge1xuICAgICAgY29uc3QgY3VycmVudERlZiA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IodHlwZSwgcHJvcCk7XG4gICAgICB0aGlzLl9pbml0aWFOZ0RlZnMuc2V0KHR5cGUsIFtwcm9wLCBjdXJyZW50RGVmXSk7XG4gICAgfVxuICB9XG5cbiAgLy8gZ2V0IG92ZXJyaWRlcyBmb3IgYSBzcGVjaWZpYyBwcm92aWRlciAoaWYgYW55KVxuICBwcml2YXRlIF9nZXRQcm92aWRlck92ZXJyaWRlcyhwcm92aWRlcjogYW55KSB7XG4gICAgY29uc3QgdG9rZW4gPSBwcm92aWRlciAmJiB0eXBlb2YgcHJvdmlkZXIgPT09ICdvYmplY3QnICYmIHByb3ZpZGVyLmhhc093blByb3BlcnR5KCdwcm92aWRlJykgP1xuICAgICAgICBwcm92aWRlci5wcm92aWRlIDpcbiAgICAgICAgcHJvdmlkZXI7XG4gICAgcmV0dXJuIHRoaXMuX3Byb3ZpZGVyT3ZlcnJpZGVzQnlUb2tlbi5nZXQodG9rZW4pIHx8IFtdO1xuICB9XG5cbiAgLy8gY3JlYXRlcyByZXNvbHZlcnMgdGFraW5nIG92ZXJyaWRlcyBpbnRvIGFjY291bnRcbiAgcHJpdmF0ZSBfZ2V0UmVzb2x2ZXJzKCkge1xuICAgIGNvbnN0IG1vZHVsZSA9IG5ldyBOZ01vZHVsZVJlc29sdmVyKCk7XG4gICAgbW9kdWxlLnNldE92ZXJyaWRlcyh0aGlzLl9tb2R1bGVPdmVycmlkZXMpO1xuXG4gICAgY29uc3QgY29tcG9uZW50ID0gbmV3IENvbXBvbmVudFJlc29sdmVyKCk7XG4gICAgY29tcG9uZW50LnNldE92ZXJyaWRlcyh0aGlzLl9jb21wb25lbnRPdmVycmlkZXMpO1xuXG4gICAgY29uc3QgZGlyZWN0aXZlID0gbmV3IERpcmVjdGl2ZVJlc29sdmVyKCk7XG4gICAgZGlyZWN0aXZlLnNldE92ZXJyaWRlcyh0aGlzLl9kaXJlY3RpdmVPdmVycmlkZXMpO1xuXG4gICAgY29uc3QgcGlwZSA9IG5ldyBQaXBlUmVzb2x2ZXIoKTtcbiAgICBwaXBlLnNldE92ZXJyaWRlcyh0aGlzLl9waXBlT3ZlcnJpZGVzKTtcblxuICAgIHJldHVybiB7bW9kdWxlLCBjb21wb25lbnQsIGRpcmVjdGl2ZSwgcGlwZX07XG4gIH1cblxuICBwcml2YXRlIF9hc3NlcnROb3RJbnN0YW50aWF0ZWQobWV0aG9kTmFtZTogc3RyaW5nLCBtZXRob2REZXNjcmlwdGlvbjogc3RyaW5nKSB7XG4gICAgaWYgKHRoaXMuX2luc3RhbnRpYXRlZCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgIGBDYW5ub3QgJHttZXRob2REZXNjcmlwdGlvbn0gd2hlbiB0aGUgdGVzdCBtb2R1bGUgaGFzIGFscmVhZHkgYmVlbiBpbnN0YW50aWF0ZWQuIGAgK1xuICAgICAgICAgIGBNYWtlIHN1cmUgeW91IGFyZSBub3QgdXNpbmcgXFxgaW5qZWN0XFxgIGJlZm9yZSBcXGAke21ldGhvZE5hbWV9XFxgLmApO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgX2NyZWF0ZVRlc3RNb2R1bGUoKTogTmdNb2R1bGVUeXBlIHtcbiAgICBjb25zdCByb290UHJvdmlkZXJPdmVycmlkZXMgPSB0aGlzLl9yb290UHJvdmlkZXJPdmVycmlkZXM7XG5cbiAgICBATmdNb2R1bGUoe1xuICAgICAgcHJvdmlkZXJzOiBbLi4ucm9vdFByb3ZpZGVyT3ZlcnJpZGVzXSxcbiAgICAgIGppdDogdHJ1ZSxcbiAgICB9KVxuICAgIGNsYXNzIFJvb3RTY29wZU1vZHVsZSB7XG4gICAgfVxuXG4gICAgY29uc3Qgbmdab25lID0gbmV3IE5nWm9uZSh7ZW5hYmxlTG9uZ1N0YWNrVHJhY2U6IHRydWV9KTtcbiAgICBjb25zdCBwcm92aWRlcnMgPSBbXG4gICAgICB7cHJvdmlkZTogTmdab25lLCB1c2VWYWx1ZTogbmdab25lfSxcbiAgICAgIHtwcm92aWRlOiBDb21waWxlciwgdXNlRmFjdG9yeTogKCkgPT4gbmV3IFIzVGVzdENvbXBpbGVyKHRoaXMpfSxcbiAgICAgIC4uLnRoaXMuX3Byb3ZpZGVycyxcbiAgICAgIC4uLnRoaXMuX3Byb3ZpZGVyT3ZlcnJpZGVzLFxuICAgIF07XG5cbiAgICBjb25zdCBkZWNsYXJhdGlvbnMgPSB0aGlzLl9kZWNsYXJhdGlvbnM7XG4gICAgY29uc3QgaW1wb3J0cyA9IFtSb290U2NvcGVNb2R1bGUsIHRoaXMubmdNb2R1bGUsIHRoaXMuX2ltcG9ydHNdO1xuICAgIGNvbnN0IHNjaGVtYXMgPSB0aGlzLl9zY2hlbWFzO1xuXG4gICAgQE5nTW9kdWxlKHtwcm92aWRlcnMsIGRlY2xhcmF0aW9ucywgaW1wb3J0cywgc2NoZW1hcywgaml0OiB0cnVlfSlcbiAgICBjbGFzcyBEeW5hbWljVGVzdE1vZHVsZSB7XG4gICAgfVxuXG4gICAgcmV0dXJuIER5bmFtaWNUZXN0TW9kdWxlIGFzIE5nTW9kdWxlVHlwZTtcbiAgfVxuXG4gIGdldCBjb21waWxlckluamVjdG9yKCk6IEluamVjdG9yIHtcbiAgICBpZiAodGhpcy5fY29tcGlsZXJJbmplY3RvciAhPT0gbnVsbCkge1xuICAgICAgcmV0dXJuIHRoaXMuX2NvbXBpbGVySW5qZWN0b3I7XG4gICAgfVxuXG4gICAgY29uc3QgcHJvdmlkZXJzOiBTdGF0aWNQcm92aWRlcltdID0gW107XG4gICAgY29uc3QgY29tcGlsZXJPcHRpb25zID0gdGhpcy5wbGF0Zm9ybS5pbmplY3Rvci5nZXQoQ09NUElMRVJfT1BUSU9OUyk7XG4gICAgY29tcGlsZXJPcHRpb25zLmZvckVhY2gob3B0cyA9PiB7XG4gICAgICBpZiAob3B0cy5wcm92aWRlcnMpIHtcbiAgICAgICAgcHJvdmlkZXJzLnB1c2gob3B0cy5wcm92aWRlcnMpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHByb3ZpZGVycy5wdXNoKC4uLnRoaXMuX2NvbXBpbGVyUHJvdmlkZXJzKTtcblxuICAgIC8vIFRPRE8ob2NvbWJlKTogbWFrZSB0aGlzIHdvcmsgd2l0aCBhbiBJbmplY3RvciBkaXJlY3RseSBpbnN0ZWFkIG9mIGNyZWF0aW5nIGEgbW9kdWxlIGZvciBpdFxuICAgIEBOZ01vZHVsZSh7cHJvdmlkZXJzfSlcbiAgICBjbGFzcyBDb21waWxlck1vZHVsZSB7XG4gICAgfVxuXG4gICAgY29uc3QgQ29tcGlsZXJNb2R1bGVGYWN0b3J5ID0gbmV3IFIzTmdNb2R1bGVGYWN0b3J5KENvbXBpbGVyTW9kdWxlKTtcbiAgICB0aGlzLl9jb21waWxlckluamVjdG9yID0gQ29tcGlsZXJNb2R1bGVGYWN0b3J5LmNyZWF0ZSh0aGlzLnBsYXRmb3JtLmluamVjdG9yKS5pbmplY3RvcjtcbiAgICByZXR1cm4gdGhpcy5fY29tcGlsZXJJbmplY3RvcjtcbiAgfVxuXG4gIHByaXZhdGUgX2dldE1ldGFXaXRoT3ZlcnJpZGVzKG1ldGE6IENvbXBvbmVudHxEaXJlY3RpdmV8TmdNb2R1bGUsIHR5cGU/OiBUeXBlPGFueT4pIHtcbiAgICBjb25zdCBvdmVycmlkZXM6IHtwcm92aWRlcnM/OiBhbnlbXSwgdGVtcGxhdGU/OiBzdHJpbmd9ID0ge307XG4gICAgaWYgKG1ldGEucHJvdmlkZXJzICYmIG1ldGEucHJvdmlkZXJzLmxlbmd0aCkge1xuICAgICAgLy8gVGhlcmUgYXJlIHR3byBmbGF0dGVuaW5nIG9wZXJhdGlvbnMgaGVyZS4gVGhlIGlubmVyIGZsYXR0ZW4oKSBvcGVyYXRlcyBvbiB0aGUgbWV0YWRhdGEnc1xuICAgICAgLy8gcHJvdmlkZXJzIGFuZCBhcHBsaWVzIGEgbWFwcGluZyBmdW5jdGlvbiB3aGljaCByZXRyaWV2ZXMgb3ZlcnJpZGVzIGZvciBlYWNoIGluY29taW5nXG4gICAgICAvLyBwcm92aWRlci4gVGhlIG91dGVyIGZsYXR0ZW4oKSB0aGVuIGZsYXR0ZW5zIHRoZSBwcm9kdWNlZCBvdmVycmlkZXMgYXJyYXkuIElmIHRoaXMgaXMgbm90XG4gICAgICAvLyBkb25lLCB0aGUgYXJyYXkgY2FuIGNvbnRhaW4gb3RoZXIgZW1wdHkgYXJyYXlzIChlLmcuIGBbW10sIFtdXWApIHdoaWNoIGxlYWsgaW50byB0aGVcbiAgICAgIC8vIHByb3ZpZGVycyBhcnJheSBhbmQgY29udGFtaW5hdGUgYW55IGVycm9yIG1lc3NhZ2VzIHRoYXQgbWlnaHQgYmUgZ2VuZXJhdGVkLlxuICAgICAgY29uc3QgcHJvdmlkZXJPdmVycmlkZXMgPVxuICAgICAgICAgIGZsYXR0ZW4oZmxhdHRlbihtZXRhLnByb3ZpZGVycywgKHByb3ZpZGVyOiBhbnkpID0+IHRoaXMuX2dldFByb3ZpZGVyT3ZlcnJpZGVzKHByb3ZpZGVyKSkpO1xuICAgICAgaWYgKHByb3ZpZGVyT3ZlcnJpZGVzLmxlbmd0aCkge1xuICAgICAgICBvdmVycmlkZXMucHJvdmlkZXJzID0gWy4uLm1ldGEucHJvdmlkZXJzLCAuLi5wcm92aWRlck92ZXJyaWRlc107XG4gICAgICB9XG4gICAgfVxuICAgIGNvbnN0IGhhc1RlbXBsYXRlT3ZlcnJpZGUgPSAhIXR5cGUgJiYgdGhpcy5fdGVtcGxhdGVPdmVycmlkZXMuaGFzKHR5cGUpO1xuICAgIGlmIChoYXNUZW1wbGF0ZU92ZXJyaWRlKSB7XG4gICAgICBvdmVycmlkZXMudGVtcGxhdGUgPSB0aGlzLl90ZW1wbGF0ZU92ZXJyaWRlcy5nZXQodHlwZSAhKTtcbiAgICB9XG4gICAgcmV0dXJuIE9iamVjdC5rZXlzKG92ZXJyaWRlcykubGVuZ3RoID8gey4uLm1ldGEsIC4uLm92ZXJyaWRlc30gOiBtZXRhO1xuICB9XG5cbiAgLyoqXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgX2dldE1vZHVsZVJlc29sdmVyKCkgeyByZXR1cm4gdGhpcy5fcmVzb2x2ZXJzLm1vZHVsZTsgfVxuXG4gIC8qKlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIF9jb21waWxlTmdNb2R1bGUobW9kdWxlVHlwZTogTmdNb2R1bGVUeXBlKTogdm9pZCB7XG4gICAgY29uc3QgbmdNb2R1bGUgPSB0aGlzLl9yZXNvbHZlcnMubW9kdWxlLnJlc29sdmUobW9kdWxlVHlwZSk7XG5cbiAgICBpZiAobmdNb2R1bGUgPT09IG51bGwpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgJHtzdHJpbmdpZnkobW9kdWxlVHlwZSl9IGhhcyBubyBATmdNb2R1bGUgYW5ub3RhdGlvbmApO1xuICAgIH1cblxuICAgIHRoaXMuX3N0b3JlTmdEZWYoTkdfTU9EVUxFX0RFRiwgbW9kdWxlVHlwZSk7XG4gICAgdGhpcy5fc3RvcmVOZ0RlZihOR19JTkpFQ1RPUl9ERUYsIG1vZHVsZVR5cGUpO1xuICAgIGNvbnN0IG1ldGFkYXRhID0gdGhpcy5fZ2V0TWV0YVdpdGhPdmVycmlkZXMobmdNb2R1bGUpO1xuICAgIGNvbXBpbGVOZ01vZHVsZURlZnMobW9kdWxlVHlwZSwgbWV0YWRhdGEpO1xuXG4gICAgY29uc3QgZGVjbGFyYXRpb25zOiBUeXBlPGFueT5bXSA9XG4gICAgICAgIGZsYXR0ZW4obmdNb2R1bGUuZGVjbGFyYXRpb25zIHx8IEVNUFRZX0FSUkFZLCByZXNvbHZlRm9yd2FyZFJlZik7XG4gICAgY29uc3QgY29tcGlsZWRDb21wb25lbnRzOiBUeXBlPGFueT5bXSA9IFtdO1xuXG4gICAgLy8gQ29tcGlsZSB0aGUgY29tcG9uZW50cywgZGlyZWN0aXZlcyBhbmQgcGlwZXMgZGVjbGFyZWQgYnkgdGhpcyBtb2R1bGVcbiAgICBkZWNsYXJhdGlvbnMuZm9yRWFjaChkZWNsYXJhdGlvbiA9PiB7XG4gICAgICBjb25zdCBjb21wb25lbnQgPSB0aGlzLl9yZXNvbHZlcnMuY29tcG9uZW50LnJlc29sdmUoZGVjbGFyYXRpb24pO1xuICAgICAgaWYgKGNvbXBvbmVudCkge1xuICAgICAgICB0aGlzLl9zdG9yZU5nRGVmKE5HX0NPTVBPTkVOVF9ERUYsIGRlY2xhcmF0aW9uKTtcbiAgICAgICAgY29uc3QgbWV0YWRhdGEgPSB0aGlzLl9nZXRNZXRhV2l0aE92ZXJyaWRlcyhjb21wb25lbnQsIGRlY2xhcmF0aW9uKTtcbiAgICAgICAgY29tcGlsZUNvbXBvbmVudChkZWNsYXJhdGlvbiwgbWV0YWRhdGEpO1xuICAgICAgICBjb21waWxlZENvbXBvbmVudHMucHVzaChkZWNsYXJhdGlvbik7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgY29uc3QgZGlyZWN0aXZlID0gdGhpcy5fcmVzb2x2ZXJzLmRpcmVjdGl2ZS5yZXNvbHZlKGRlY2xhcmF0aW9uKTtcbiAgICAgIGlmIChkaXJlY3RpdmUpIHtcbiAgICAgICAgdGhpcy5fc3RvcmVOZ0RlZihOR19ESVJFQ1RJVkVfREVGLCBkZWNsYXJhdGlvbik7XG4gICAgICAgIGNvbnN0IG1ldGFkYXRhID0gdGhpcy5fZ2V0TWV0YVdpdGhPdmVycmlkZXMoZGlyZWN0aXZlKTtcbiAgICAgICAgY29tcGlsZURpcmVjdGl2ZShkZWNsYXJhdGlvbiwgbWV0YWRhdGEpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHBpcGUgPSB0aGlzLl9yZXNvbHZlcnMucGlwZS5yZXNvbHZlKGRlY2xhcmF0aW9uKTtcbiAgICAgIGlmIChwaXBlKSB7XG4gICAgICAgIHRoaXMuX3N0b3JlTmdEZWYoTkdfUElQRV9ERUYsIGRlY2xhcmF0aW9uKTtcbiAgICAgICAgY29tcGlsZVBpcGUoZGVjbGFyYXRpb24sIHBpcGUpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICAvLyBDb21waWxlIHRyYW5zaXRpdmUgbW9kdWxlcywgY29tcG9uZW50cywgZGlyZWN0aXZlcyBhbmQgcGlwZXNcbiAgICBjb25zdCBjYWxjVHJhbnNpdGl2ZVNjb3Blc0ZvciA9IChtb2R1bGVUeXBlOiBOZ01vZHVsZVR5cGUpID0+IHRyYW5zaXRpdmVTY29wZXNGb3IoXG4gICAgICAgIG1vZHVsZVR5cGUsIChuZ01vZHVsZTogTmdNb2R1bGVUeXBlKSA9PiB0aGlzLl9jb21waWxlTmdNb2R1bGUobmdNb2R1bGUpKTtcbiAgICBjb25zdCB0cmFuc2l0aXZlU2NvcGUgPSBjYWxjVHJhbnNpdGl2ZVNjb3Blc0Zvcihtb2R1bGVUeXBlKTtcbiAgICBjb21waWxlZENvbXBvbmVudHMuZm9yRWFjaChjbXAgPT4ge1xuICAgICAgY29uc3Qgc2NvcGUgPSB0aGlzLl90ZW1wbGF0ZU92ZXJyaWRlcy5oYXMoY21wKSA/XG4gICAgICAgICAgLy8gaWYgd2UgaGF2ZSB0ZW1wbGF0ZSBvdmVycmlkZSB2aWEgYFRlc3RCZWQub3ZlcnJpZGVUZW1wbGF0ZVVzaW5nVGVzdGluZ01vZHVsZWAgLVxuICAgICAgICAgIC8vIGRlZmluZSBDb21wb25lbnQgc2NvcGUgYXMgVGVzdGluZ01vZHVsZSBzY29wZSwgaW5zdGVhZCBvZiB0aGUgc2NvcGUgb2YgTmdNb2R1bGVcbiAgICAgICAgICAvLyB3aGVyZSB0aGlzIENvbXBvbmVudCB3YXMgZGVjbGFyZWRcbiAgICAgICAgICBjYWxjVHJhbnNpdGl2ZVNjb3Blc0Zvcih0aGlzLl90ZXN0TW9kdWxlVHlwZSkgOlxuICAgICAgICAgIHRyYW5zaXRpdmVTY29wZTtcbiAgICAgIHBhdGNoQ29tcG9uZW50RGVmV2l0aFNjb3BlKChjbXAgYXMgYW55KS5uZ0NvbXBvbmVudERlZiwgc2NvcGUpO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgX2dldENvbXBvbmVudEZhY3Rvcmllcyhtb2R1bGVUeXBlOiBOZ01vZHVsZVR5cGUpOiBDb21wb25lbnRGYWN0b3J5PGFueT5bXSB7XG4gICAgcmV0dXJuIG1vZHVsZVR5cGUubmdNb2R1bGVEZWYuZGVjbGFyYXRpb25zLnJlZHVjZSgoZmFjdG9yaWVzLCBkZWNsYXJhdGlvbikgPT4ge1xuICAgICAgY29uc3QgY29tcG9uZW50RGVmID0gKGRlY2xhcmF0aW9uIGFzIGFueSkubmdDb21wb25lbnREZWY7XG4gICAgICBjb21wb25lbnREZWYgJiYgZmFjdG9yaWVzLnB1c2gobmV3IENvbXBvbmVudEZhY3RvcnkoY29tcG9uZW50RGVmLCB0aGlzLl9tb2R1bGVSZWYpKTtcbiAgICAgIHJldHVybiBmYWN0b3JpZXM7XG4gICAgfSwgW10gYXMgQ29tcG9uZW50RmFjdG9yeTxhbnk+W10pO1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrIHdoZXRoZXIgdGhlIG1vZHVsZSBzY29waW5nIHF1ZXVlIHNob3VsZCBiZSBmbHVzaGVkLCBhbmQgZmx1c2ggaXQgaWYgbmVlZGVkLlxuICAgKlxuICAgKiBXaGVuIHRoZSBUZXN0QmVkIGlzIHJlc2V0LCBpdCBjbGVhcnMgdGhlIEpJVCBtb2R1bGUgY29tcGlsYXRpb24gcXVldWUsIGNhbmNlbGxpbmcgYW55XG4gICAqIGluLXByb2dyZXNzIG1vZHVsZSBjb21waWxhdGlvbi4gVGhpcyBjcmVhdGVzIGEgcG90ZW50aWFsIGhhemFyZCAtIHRoZSB2ZXJ5IGZpcnN0IHRpbWUgdGhlXG4gICAqIFRlc3RCZWQgaXMgaW5pdGlhbGl6ZWQgKG9yIGlmIGl0J3MgcmVzZXQgd2l0aG91dCBiZWluZyBpbml0aWFsaXplZCksIHRoZXJlIG1heSBiZSBwZW5kaW5nXG4gICAqIGNvbXBpbGF0aW9ucyBvZiBtb2R1bGVzIGRlY2xhcmVkIGluIGdsb2JhbCBzY29wZS4gVGhlc2UgY29tcGlsYXRpb25zIHNob3VsZCBiZSBmaW5pc2hlZC5cbiAgICpcbiAgICogVG8gZW5zdXJlIHRoYXQgZ2xvYmFsbHkgZGVjbGFyZWQgbW9kdWxlcyBoYXZlIHRoZWlyIGNvbXBvbmVudHMgc2NvcGVkIHByb3Blcmx5LCB0aGlzIGZ1bmN0aW9uXG4gICAqIGlzIGNhbGxlZCB3aGVuZXZlciBUZXN0QmVkIGlzIGluaXRpYWxpemVkIG9yIHJlc2V0LiBUaGUgX2ZpcnN0XyB0aW1lIHRoYXQgdGhpcyBoYXBwZW5zLCBwcmlvclxuICAgKiB0byBhbnkgb3RoZXIgb3BlcmF0aW9ucywgdGhlIHNjb3BpbmcgcXVldWUgaXMgZmx1c2hlZC5cbiAgICovXG4gIHByaXZhdGUgX2NoZWNrR2xvYmFsQ29tcGlsYXRpb25GaW5pc2hlZCgpOiB2b2lkIHtcbiAgICAvLyAhdGhpcy5faW5zdGFudGlhdGVkIHNob3VsZCBub3QgYmUgbmVjZXNzYXJ5LCBidXQgaXMgbGVmdCBpbiBhcyBhbiBhZGRpdGlvbmFsIGd1YXJkIHRoYXRcbiAgICAvLyBjb21waWxhdGlvbnMgcXVldWVkIGluIHRlc3RzIChhZnRlciBpbnN0YW50aWF0aW9uKSBhcmUgbmV2ZXIgZmx1c2hlZCBhY2NpZGVudGFsbHkuXG4gICAgaWYgKCF0aGlzLl9nbG9iYWxDb21waWxhdGlvbkNoZWNrZWQgJiYgIXRoaXMuX2luc3RhbnRpYXRlZCkge1xuICAgICAgZmx1c2hNb2R1bGVTY29waW5nUXVldWVBc011Y2hBc1Bvc3NpYmxlKCk7XG4gICAgfVxuICAgIHRoaXMuX2dsb2JhbENvbXBpbGF0aW9uQ2hlY2tlZCA9IHRydWU7XG4gIH1cbn1cblxubGV0IHRlc3RCZWQ6IFRlc3RCZWRSZW5kZXIzO1xuXG5leHBvcnQgZnVuY3Rpb24gX2dldFRlc3RCZWRSZW5kZXIzKCk6IFRlc3RCZWRSZW5kZXIzIHtcbiAgcmV0dXJuIHRlc3RCZWQgPSB0ZXN0QmVkIHx8IG5ldyBUZXN0QmVkUmVuZGVyMygpO1xufVxuXG5mdW5jdGlvbiBmbGF0dGVuPFQ+KHZhbHVlczogYW55W10sIG1hcEZuPzogKHZhbHVlOiBUKSA9PiBhbnkpOiBUW10ge1xuICBjb25zdCBvdXQ6IFRbXSA9IFtdO1xuICB2YWx1ZXMuZm9yRWFjaCh2YWx1ZSA9PiB7XG4gICAgaWYgKEFycmF5LmlzQXJyYXkodmFsdWUpKSB7XG4gICAgICBvdXQucHVzaCguLi5mbGF0dGVuPFQ+KHZhbHVlLCBtYXBGbikpO1xuICAgIH0gZWxzZSB7XG4gICAgICBvdXQucHVzaChtYXBGbiA/IG1hcEZuKHZhbHVlKSA6IHZhbHVlKTtcbiAgICB9XG4gIH0pO1xuICByZXR1cm4gb3V0O1xufVxuXG5mdW5jdGlvbiBpc05nTW9kdWxlPFQ+KHZhbHVlOiBUeXBlPFQ+KTogdmFsdWUgaXMgVHlwZTxUPiZ7bmdNb2R1bGVEZWY6IE5nTW9kdWxlRGVmPFQ+fSB7XG4gIHJldHVybiAodmFsdWUgYXN7bmdNb2R1bGVEZWY/OiBOZ01vZHVsZURlZjxUPn0pLm5nTW9kdWxlRGVmICE9PSB1bmRlZmluZWQ7XG59XG5cbmNsYXNzIFIzVGVzdENvbXBpbGVyIGltcGxlbWVudHMgQ29tcGlsZXIge1xuICBjb25zdHJ1Y3Rvcihwcml2YXRlIHRlc3RCZWQ6IFRlc3RCZWRSZW5kZXIzKSB7fVxuXG4gIGNvbXBpbGVNb2R1bGVTeW5jPFQ+KG1vZHVsZVR5cGU6IFR5cGU8VD4pOiBOZ01vZHVsZUZhY3Rvcnk8VD4ge1xuICAgIHRoaXMudGVzdEJlZC5fY29tcGlsZU5nTW9kdWxlKG1vZHVsZVR5cGUgYXMgTmdNb2R1bGVUeXBlPFQ+KTtcbiAgICByZXR1cm4gbmV3IFIzTmdNb2R1bGVGYWN0b3J5KG1vZHVsZVR5cGUpO1xuICB9XG5cbiAgY29tcGlsZU1vZHVsZUFzeW5jPFQ+KG1vZHVsZVR5cGU6IFR5cGU8VD4pOiBQcm9taXNlPE5nTW9kdWxlRmFjdG9yeTxUPj4ge1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodGhpcy5jb21waWxlTW9kdWxlU3luYyhtb2R1bGVUeXBlKSk7XG4gIH1cblxuICBjb21waWxlTW9kdWxlQW5kQWxsQ29tcG9uZW50c1N5bmM8VD4obW9kdWxlVHlwZTogVHlwZTxUPik6IE1vZHVsZVdpdGhDb21wb25lbnRGYWN0b3JpZXM8VD4ge1xuICAgIGNvbnN0IG5nTW9kdWxlRmFjdG9yeSA9IHRoaXMuY29tcGlsZU1vZHVsZVN5bmMobW9kdWxlVHlwZSk7XG4gICAgY29uc3QgY29tcG9uZW50RmFjdG9yaWVzID0gdGhpcy50ZXN0QmVkLl9nZXRDb21wb25lbnRGYWN0b3JpZXMobW9kdWxlVHlwZSBhcyBOZ01vZHVsZVR5cGU8VD4pO1xuICAgIHJldHVybiBuZXcgTW9kdWxlV2l0aENvbXBvbmVudEZhY3RvcmllcyhuZ01vZHVsZUZhY3RvcnksIGNvbXBvbmVudEZhY3Rvcmllcyk7XG4gIH1cblxuICBjb21waWxlTW9kdWxlQW5kQWxsQ29tcG9uZW50c0FzeW5jPFQ+KG1vZHVsZVR5cGU6IFR5cGU8VD4pOlxuICAgICAgUHJvbWlzZTxNb2R1bGVXaXRoQ29tcG9uZW50RmFjdG9yaWVzPFQ+PiB7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh0aGlzLmNvbXBpbGVNb2R1bGVBbmRBbGxDb21wb25lbnRzU3luYyhtb2R1bGVUeXBlKSk7XG4gIH1cblxuICBjbGVhckNhY2hlKCk6IHZvaWQge31cblxuICBjbGVhckNhY2hlRm9yKHR5cGU6IFR5cGU8YW55Pik6IHZvaWQge31cblxuICBnZXRNb2R1bGVJZChtb2R1bGVUeXBlOiBUeXBlPGFueT4pOiBzdHJpbmd8dW5kZWZpbmVkIHtcbiAgICBjb25zdCBtZXRhID0gdGhpcy50ZXN0QmVkLl9nZXRNb2R1bGVSZXNvbHZlcigpLnJlc29sdmUobW9kdWxlVHlwZSk7XG4gICAgcmV0dXJuIG1ldGEgJiYgbWV0YS5pZCB8fCB1bmRlZmluZWQ7XG4gIH1cbn1cbiJdfQ==