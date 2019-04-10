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
import { ApplicationInitStatus, Component, InjectFlags, Injector, NgModule, NgZone, Optional, SkipSelf, ɵAPP_ROOT as APP_ROOT, ɵclearOverrides as clearOverrides, ɵgetInjectableDef as getInjectableDef, ɵivyEnabled as ivyEnabled, ɵoverrideComponentView as overrideComponentView, ɵoverrideProvider as overrideProvider, ɵstringify as stringify } from '@angular/core';
import { AsyncTestCompleter } from './async_test_completer';
import { ComponentFixture } from './component_fixture';
import { TestBedRender3, _getTestBedRender3 } from './r3_test_bed';
import { ComponentFixtureAutoDetect, ComponentFixtureNoNgZone, TestComponentRenderer } from './test_bed_common';
import { TestingCompilerFactory } from './test_compiler';
/** @type {?} */
const UNDEFINED = new Object();
/** @type {?} */
let _nextRootElementId = 0;
// WARNING: interface has both a type and a value, skipping emit
/**
 * \@description
 * Configures and initializes environment for unit testing and provides methods for
 * creating components and services in unit tests.
 *
 * `TestBed` is the primary api for writing unit tests for Angular applications and libraries.
 *
 * Note: Use `TestBed` in tests. It will be set to either `TestBedViewEngine` or `TestBedRender3`
 * according to the compiler used.
 */
export class TestBedViewEngine {
    constructor() {
        this._instantiated = false;
        this._compiler = (/** @type {?} */ (null));
        this._moduleRef = (/** @type {?} */ (null));
        this._moduleFactory = (/** @type {?} */ (null));
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
        this._testEnvAotSummaries = (/**
         * @return {?}
         */
        () => []);
        this._aotSummaries = [];
        this._templateOverrides = [];
        this._isRoot = true;
        this._rootProviderOverrides = [];
        this.platform = (/** @type {?} */ (null));
        this.ngModule = (/** @type {?} */ (null));
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
     * @param {?} ngModule
     * @param {?} platform
     * @param {?=} aotSummaries
     * @return {?}
     */
    static initTestEnvironment(ngModule, platform, aotSummaries) {
        /** @type {?} */
        const testBed = _getTestBedViewEngine();
        testBed.initTestEnvironment(ngModule, platform, aotSummaries);
        return testBed;
    }
    /**
     * Reset the providers for the test injector.
     * @return {?}
     */
    static resetTestEnvironment() { _getTestBedViewEngine().resetTestEnvironment(); }
    /**
     * @return {?}
     */
    static resetTestingModule() {
        _getTestBedViewEngine().resetTestingModule();
        return (/** @type {?} */ ((/** @type {?} */ (TestBedViewEngine))));
    }
    /**
     * Allows overriding default compiler providers and settings
     * which are defined in test_injector.js
     * @param {?} config
     * @return {?}
     */
    static configureCompiler(config) {
        _getTestBedViewEngine().configureCompiler(config);
        return (/** @type {?} */ ((/** @type {?} */ (TestBedViewEngine))));
    }
    /**
     * Allows overriding default providers, directives, pipes, modules of the test injector,
     * which are defined in test_injector.js
     * @param {?} moduleDef
     * @return {?}
     */
    static configureTestingModule(moduleDef) {
        _getTestBedViewEngine().configureTestingModule(moduleDef);
        return (/** @type {?} */ ((/** @type {?} */ (TestBedViewEngine))));
    }
    /**
     * Compile components with a `templateUrl` for the test's NgModule.
     * It is necessary to call this function
     * as fetching urls is asynchronous.
     * @return {?}
     */
    static compileComponents() { return getTestBed().compileComponents(); }
    /**
     * @param {?} ngModule
     * @param {?} override
     * @return {?}
     */
    static overrideModule(ngModule, override) {
        _getTestBedViewEngine().overrideModule(ngModule, override);
        return (/** @type {?} */ ((/** @type {?} */ (TestBedViewEngine))));
    }
    /**
     * @param {?} component
     * @param {?} override
     * @return {?}
     */
    static overrideComponent(component, override) {
        _getTestBedViewEngine().overrideComponent(component, override);
        return (/** @type {?} */ ((/** @type {?} */ (TestBedViewEngine))));
    }
    /**
     * @param {?} directive
     * @param {?} override
     * @return {?}
     */
    static overrideDirective(directive, override) {
        _getTestBedViewEngine().overrideDirective(directive, override);
        return (/** @type {?} */ ((/** @type {?} */ (TestBedViewEngine))));
    }
    /**
     * @param {?} pipe
     * @param {?} override
     * @return {?}
     */
    static overridePipe(pipe, override) {
        _getTestBedViewEngine().overridePipe(pipe, override);
        return (/** @type {?} */ ((/** @type {?} */ (TestBedViewEngine))));
    }
    /**
     * @param {?} component
     * @param {?} template
     * @return {?}
     */
    static overrideTemplate(component, template) {
        _getTestBedViewEngine().overrideComponent(component, { set: { template, templateUrl: (/** @type {?} */ (null)) } });
        return (/** @type {?} */ ((/** @type {?} */ (TestBedViewEngine))));
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
        _getTestBedViewEngine().overrideTemplateUsingTestingModule(component, template);
        return (/** @type {?} */ ((/** @type {?} */ (TestBedViewEngine))));
    }
    /**
     * @param {?} token
     * @param {?} provider
     * @return {?}
     */
    static overrideProvider(token, provider) {
        _getTestBedViewEngine().overrideProvider(token, (/** @type {?} */ (provider)));
        return (/** @type {?} */ ((/** @type {?} */ (TestBedViewEngine))));
    }
    /**
     * @param {?} token
     * @param {?} provider
     * @return {?}
     */
    static deprecatedOverrideProvider(token, provider) {
        _getTestBedViewEngine().deprecatedOverrideProvider(token, (/** @type {?} */ (provider)));
        return (/** @type {?} */ ((/** @type {?} */ (TestBedViewEngine))));
    }
    /**
     * @param {?} token
     * @param {?=} notFoundValue
     * @param {?=} flags
     * @return {?}
     */
    static get(token, notFoundValue = Injector.THROW_IF_NOT_FOUND, flags = InjectFlags.Default) {
        return _getTestBedViewEngine().get(token, notFoundValue, flags);
    }
    /**
     * @template T
     * @param {?} component
     * @return {?}
     */
    static createComponent(component) {
        return _getTestBedViewEngine().createComponent(component);
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
        if (aotSummaries) {
            this._testEnvAotSummaries = aotSummaries;
        }
    }
    /**
     * Reset the providers for the test injector.
     * @return {?}
     */
    resetTestEnvironment() {
        this.resetTestingModule();
        this.platform = (/** @type {?} */ (null));
        this.ngModule = (/** @type {?} */ (null));
        this._testEnvAotSummaries = (/**
         * @return {?}
         */
        () => []);
    }
    /**
     * @return {?}
     */
    resetTestingModule() {
        clearOverrides();
        this._aotSummaries = [];
        this._templateOverrides = [];
        this._compiler = (/** @type {?} */ (null));
        this._moduleOverrides = [];
        this._componentOverrides = [];
        this._directiveOverrides = [];
        this._pipeOverrides = [];
        this._isRoot = true;
        this._rootProviderOverrides = [];
        this._moduleRef = (/** @type {?} */ (null));
        this._moduleFactory = (/** @type {?} */ (null));
        this._compilerOptions = [];
        this._providers = [];
        this._declarations = [];
        this._imports = [];
        this._schemas = [];
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
    }
    /**
     * @param {?} config
     * @return {?}
     */
    configureCompiler(config) {
        this._assertNotInstantiated('TestBed.configureCompiler', 'configure the compiler');
        this._compilerOptions.push(config);
    }
    /**
     * @param {?} moduleDef
     * @return {?}
     */
    configureTestingModule(moduleDef) {
        this._assertNotInstantiated('TestBed.configureTestingModule', 'configure the test module');
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
        if (moduleDef.aotSummaries) {
            this._aotSummaries.push(moduleDef.aotSummaries);
        }
    }
    /**
     * @return {?}
     */
    compileComponents() {
        if (this._moduleFactory || this._instantiated) {
            return Promise.resolve(null);
        }
        /** @type {?} */
        const moduleType = this._createCompilerAndModule();
        return this._compiler.compileModuleAndAllComponentsAsync(moduleType)
            .then((/**
         * @param {?} moduleAndComponentFactories
         * @return {?}
         */
        (moduleAndComponentFactories) => {
            this._moduleFactory = moduleAndComponentFactories.ngModuleFactory;
        }));
    }
    /**
     * @private
     * @return {?}
     */
    _initIfNeeded() {
        if (this._instantiated) {
            return;
        }
        if (!this._moduleFactory) {
            try {
                /** @type {?} */
                const moduleType = this._createCompilerAndModule();
                this._moduleFactory =
                    this._compiler.compileModuleAndAllComponentsSync(moduleType).ngModuleFactory;
            }
            catch (e) {
                /** @type {?} */
                const errorCompType = this._compiler.getComponentFromError(e);
                if (errorCompType) {
                    throw new Error(`This test module uses the component ${stringify(errorCompType)} which is using a "templateUrl" or "styleUrls", but they were never compiled. ` +
                        `Please call "TestBed.compileComponents" before your test.`);
                }
                else {
                    throw e;
                }
            }
        }
        for (const { component, templateOf } of this._templateOverrides) {
            /** @type {?} */
            const compFactory = this._compiler.getComponentFactory(templateOf);
            overrideComponentView(component, compFactory);
        }
        /** @type {?} */
        const ngZone = new NgZone({ enableLongStackTrace: true });
        /** @type {?} */
        const providers = [{ provide: NgZone, useValue: ngZone }];
        /** @type {?} */
        const ngZoneInjector = Injector.create({
            providers: providers,
            parent: this.platform.injector,
            name: this._moduleFactory.moduleType.name
        });
        this._moduleRef = this._moduleFactory.create(ngZoneInjector);
        // ApplicationInitStatus.runInitializers() is marked @internal to core. So casting to any
        // before accessing it.
        ((/** @type {?} */ (this._moduleRef.injector.get(ApplicationInitStatus)))).runInitializers();
        this._instantiated = true;
    }
    /**
     * @private
     * @return {?}
     */
    _createCompilerAndModule() {
        /** @type {?} */
        const providers = this._providers.concat([{ provide: TestBed, useValue: this }]);
        /** @type {?} */
        const declarations = [...this._declarations, ...this._templateOverrides.map((/**
             * @param {?} entry
             * @return {?}
             */
            entry => entry.templateOf))];
        /** @type {?} */
        const rootScopeImports = [];
        /** @type {?} */
        const rootProviderOverrides = this._rootProviderOverrides;
        if (this._isRoot) {
            class RootScopeModule {
            }
            RootScopeModule.decorators = [
                { type: NgModule, args: [{
                            providers: [
                                ...rootProviderOverrides,
                            ],
                            jit: true,
                        },] },
            ];
            rootScopeImports.push(RootScopeModule);
        }
        providers.push({ provide: APP_ROOT, useValue: this._isRoot });
        /** @type {?} */
        const imports = [rootScopeImports, this.ngModule, this._imports];
        /** @type {?} */
        const schemas = this._schemas;
        class DynamicTestModule {
        }
        DynamicTestModule.decorators = [
            { type: NgModule, args: [{ providers, declarations, imports, schemas, jit: true },] },
        ];
        /** @type {?} */
        const compilerFactory = this.platform.injector.get(TestingCompilerFactory);
        this._compiler = compilerFactory.createTestingCompiler(this._compilerOptions);
        for (const summary of [this._testEnvAotSummaries, ...this._aotSummaries]) {
            this._compiler.loadAotSummaries(summary);
        }
        this._moduleOverrides.forEach((/**
         * @param {?} entry
         * @return {?}
         */
        (entry) => this._compiler.overrideModule(entry[0], entry[1])));
        this._componentOverrides.forEach((/**
         * @param {?} entry
         * @return {?}
         */
        (entry) => this._compiler.overrideComponent(entry[0], entry[1])));
        this._directiveOverrides.forEach((/**
         * @param {?} entry
         * @return {?}
         */
        (entry) => this._compiler.overrideDirective(entry[0], entry[1])));
        this._pipeOverrides.forEach((/**
         * @param {?} entry
         * @return {?}
         */
        (entry) => this._compiler.overridePipe(entry[0], entry[1])));
        return DynamicTestModule;
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
     * @param {?} token
     * @param {?=} notFoundValue
     * @param {?=} flags
     * @return {?}
     */
    get(token, notFoundValue = Injector.THROW_IF_NOT_FOUND, flags = InjectFlags.Default) {
        this._initIfNeeded();
        if (token === TestBed) {
            return this;
        }
        // Tests can inject things from the ng module and from the compiler,
        // but the ng module can't inject things from the compiler and vice versa.
        /** @type {?} */
        const result = this._moduleRef.injector.get(token, UNDEFINED, flags);
        return result === UNDEFINED ? this._compiler.injector.get(token, notFoundValue, flags) : result;
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
     * @param {?} token
     * @param {?} provider
     * @return {?}
     */
    overrideProvider(token, provider) {
        this.overrideProviderImpl(token, provider);
    }
    /**
     * @param {?} token
     * @param {?} provider
     * @return {?}
     */
    deprecatedOverrideProvider(token, provider) {
        this.overrideProviderImpl(token, provider, /* deprecated */ true);
    }
    /**
     * @private
     * @param {?} token
     * @param {?} provider
     * @param {?=} deprecated
     * @return {?}
     */
    overrideProviderImpl(token, provider, deprecated = false) {
        /** @type {?} */
        let def = null;
        if (typeof token !== 'string' && (def = getInjectableDef(token)) && def.providedIn === 'root') {
            if (provider.useFactory) {
                this._rootProviderOverrides.push({ provide: token, useFactory: provider.useFactory, deps: provider.deps || [] });
            }
            else {
                this._rootProviderOverrides.push({ provide: token, useValue: provider.useValue });
            }
        }
        /** @type {?} */
        let flags = 0;
        /** @type {?} */
        let value;
        if (provider.useFactory) {
            flags |= 1024 /* TypeFactoryProvider */;
            value = provider.useFactory;
        }
        else {
            flags |= 256 /* TypeValueProvider */;
            value = provider.useValue;
        }
        /** @type {?} */
        const deps = (provider.deps || []).map((/**
         * @param {?} dep
         * @return {?}
         */
        (dep) => {
            /** @type {?} */
            let depFlags = 0 /* None */;
            /** @type {?} */
            let depToken;
            if (Array.isArray(dep)) {
                dep.forEach((/**
                 * @param {?} entry
                 * @return {?}
                 */
                (entry) => {
                    if (entry instanceof Optional) {
                        depFlags |= 2 /* Optional */;
                    }
                    else if (entry instanceof SkipSelf) {
                        depFlags |= 1 /* SkipSelf */;
                    }
                    else {
                        depToken = entry;
                    }
                }));
            }
            else {
                depToken = dep;
            }
            return [depFlags, depToken];
        }));
        overrideProvider({ token, flags, deps, value, deprecatedBehavior: deprecated });
    }
    /**
     * @param {?} component
     * @param {?} template
     * @return {?}
     */
    overrideTemplateUsingTestingModule(component, template) {
        this._assertNotInstantiated('overrideTemplateUsingTestingModule', 'override template');
        class OverrideComponent {
        }
        OverrideComponent.decorators = [
            { type: Component, args: [{ selector: 'empty', template, jit: true },] },
        ];
        this._templateOverrides.push({ component, templateOf: OverrideComponent });
    }
    /**
     * @template T
     * @param {?} component
     * @return {?}
     */
    createComponent(component) {
        this._initIfNeeded();
        /** @type {?} */
        const componentFactory = this._compiler.getComponentFactory(component);
        if (!componentFactory) {
            throw new Error(`Cannot create the component ${stringify(component)} as it was not imported into the testing module!`);
        }
        // TODO: Don't cast as `any`, proper type is boolean[]
        /** @type {?} */
        const noNgZone = this.get((/** @type {?} */ (ComponentFixtureNoNgZone)), false);
        // TODO: Don't cast as `any`, proper type is boolean[]
        /** @type {?} */
        const autoDetect = this.get((/** @type {?} */ (ComponentFixtureAutoDetect)), false);
        /** @type {?} */
        const ngZone = noNgZone ? null : this.get((/** @type {?} */ (NgZone)), null);
        /** @type {?} */
        const testComponentRenderer = this.get(TestComponentRenderer);
        /** @type {?} */
        const rootElId = `root${_nextRootElementId++}`;
        testComponentRenderer.insertRootElement(rootElId);
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
        const fixture = !ngZone ? initComponent() : ngZone.run(initComponent);
        this._activeFixtures.push(fixture);
        return fixture;
    }
}
if (false) {
    /**
     * @type {?}
     * @private
     */
    TestBedViewEngine.prototype._instantiated;
    /**
     * @type {?}
     * @private
     */
    TestBedViewEngine.prototype._compiler;
    /**
     * @type {?}
     * @private
     */
    TestBedViewEngine.prototype._moduleRef;
    /**
     * @type {?}
     * @private
     */
    TestBedViewEngine.prototype._moduleFactory;
    /**
     * @type {?}
     * @private
     */
    TestBedViewEngine.prototype._compilerOptions;
    /**
     * @type {?}
     * @private
     */
    TestBedViewEngine.prototype._moduleOverrides;
    /**
     * @type {?}
     * @private
     */
    TestBedViewEngine.prototype._componentOverrides;
    /**
     * @type {?}
     * @private
     */
    TestBedViewEngine.prototype._directiveOverrides;
    /**
     * @type {?}
     * @private
     */
    TestBedViewEngine.prototype._pipeOverrides;
    /**
     * @type {?}
     * @private
     */
    TestBedViewEngine.prototype._providers;
    /**
     * @type {?}
     * @private
     */
    TestBedViewEngine.prototype._declarations;
    /**
     * @type {?}
     * @private
     */
    TestBedViewEngine.prototype._imports;
    /**
     * @type {?}
     * @private
     */
    TestBedViewEngine.prototype._schemas;
    /**
     * @type {?}
     * @private
     */
    TestBedViewEngine.prototype._activeFixtures;
    /**
     * @type {?}
     * @private
     */
    TestBedViewEngine.prototype._testEnvAotSummaries;
    /**
     * @type {?}
     * @private
     */
    TestBedViewEngine.prototype._aotSummaries;
    /**
     * @type {?}
     * @private
     */
    TestBedViewEngine.prototype._templateOverrides;
    /**
     * @type {?}
     * @private
     */
    TestBedViewEngine.prototype._isRoot;
    /**
     * @type {?}
     * @private
     */
    TestBedViewEngine.prototype._rootProviderOverrides;
    /** @type {?} */
    TestBedViewEngine.prototype.platform;
    /** @type {?} */
    TestBedViewEngine.prototype.ngModule;
}
/**
 * \@description
 * Configures and initializes environment for unit testing and provides methods for
 * creating components and services in unit tests.
 *
 * `TestBed` is the primary api for writing unit tests for Angular applications and libraries.
 *
 * Note: Use `TestBed` in tests. It will be set to either `TestBedViewEngine` or `TestBedRender3`
 * according to the compiler used.
 *
 * \@publicApi
 * @type {?}
 */
export const TestBed = ivyEnabled ? (/** @type {?} */ ((/** @type {?} */ (TestBedRender3)))) : (/** @type {?} */ ((/** @type {?} */ (TestBedViewEngine))));
/**
 * Returns a singleton of the applicable `TestBed`.
 *
 * It will be either an instance of `TestBedViewEngine` or `TestBedRender3`.
 *
 * \@publicApi
 * @type {?}
 */
export const getTestBed = ivyEnabled ? _getTestBedRender3 : _getTestBedViewEngine;
/** @type {?} */
let testBed;
/**
 * @return {?}
 */
function _getTestBedViewEngine() {
    return testBed = testBed || new TestBedViewEngine();
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
 *   becomes `it('...', \@Inject (object: AClass, async: AsyncTestCompleter) => { ... });`
 *
 * \@publicApi
 * @param {?} tokens
 * @param {?} fn
 * @return {?}
 */
export function inject(tokens, fn) {
    /** @type {?} */
    const testBed = getTestBed();
    if (tokens.indexOf(AsyncTestCompleter) >= 0) {
        // Not using an arrow function to preserve context passed from call site
        return (/**
         * @return {?}
         */
        function () {
            // Return an async test method that returns a Promise if AsyncTestCompleter is one of
            // the injected tokens.
            return testBed.compileComponents().then((/**
             * @return {?}
             */
            () => {
                /** @type {?} */
                const completer = testBed.get(AsyncTestCompleter);
                testBed.execute(tokens, fn, this);
                return completer.promise;
            }));
        });
    }
    else {
        // Not using an arrow function to preserve context passed from call site
        return (/**
         * @return {?}
         */
        function () { return testBed.execute(tokens, fn, this); });
    }
}
/**
 * \@publicApi
 */
export class InjectSetupWrapper {
    /**
     * @param {?} _moduleDef
     */
    constructor(_moduleDef) {
        this._moduleDef = _moduleDef;
    }
    /**
     * @private
     * @return {?}
     */
    _addModule() {
        /** @type {?} */
        const moduleDef = this._moduleDef();
        if (moduleDef) {
            getTestBed().configureTestingModule(moduleDef);
        }
    }
    /**
     * @param {?} tokens
     * @param {?} fn
     * @return {?}
     */
    inject(tokens, fn) {
        /** @type {?} */
        const self = this;
        // Not using an arrow function to preserve context passed from call site
        return (/**
         * @return {?}
         */
        function () {
            self._addModule();
            return inject(tokens, fn).call(this);
        });
    }
}
if (false) {
    /**
     * @type {?}
     * @private
     */
    InjectSetupWrapper.prototype._moduleDef;
}
/**
 * @param {?} moduleDef
 * @param {?=} fn
 * @return {?}
 */
export function withModule(moduleDef, fn) {
    if (fn) {
        // Not using an arrow function to preserve context passed from call site
        return (/**
         * @return {?}
         */
        function () {
            /** @type {?} */
            const testBed = getTestBed();
            if (moduleDef) {
                testBed.configureTestingModule(moduleDef);
            }
            return fn.apply(this);
        });
    }
    return new InjectSetupWrapper((/**
     * @return {?}
     */
    () => moduleDef));
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdF9iZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3Rlc3Rpbmcvc3JjL3Rlc3RfYmVkLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBUUEsT0FBTyxFQUFDLHFCQUFxQixFQUFtQixTQUFTLEVBQWEsV0FBVyxFQUFrQixRQUFRLEVBQUUsUUFBUSxFQUFnQyxNQUFNLEVBQUUsUUFBUSxFQUErQyxRQUFRLEVBQXdCLFNBQVMsSUFBSSxRQUFRLEVBQWtELGVBQWUsSUFBSSxjQUFjLEVBQUUsaUJBQWlCLElBQUksZ0JBQWdCLEVBQUUsV0FBVyxJQUFJLFVBQVUsRUFBRSxzQkFBc0IsSUFBSSxxQkFBcUIsRUFBRSxpQkFBaUIsSUFBSSxnQkFBZ0IsRUFBRSxVQUFVLElBQUksU0FBUyxFQUFpQixNQUFNLGVBQWUsQ0FBQztBQUV0akIsT0FBTyxFQUFDLGtCQUFrQixFQUFDLE1BQU0sd0JBQXdCLENBQUM7QUFDMUQsT0FBTyxFQUFDLGdCQUFnQixFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFFckQsT0FBTyxFQUFDLGNBQWMsRUFBRSxrQkFBa0IsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUNqRSxPQUFPLEVBQUMsMEJBQTBCLEVBQUUsd0JBQXdCLEVBQWlCLHFCQUFxQixFQUFxQixNQUFNLG1CQUFtQixDQUFDO0FBQ2pKLE9BQU8sRUFBa0Isc0JBQXNCLEVBQUMsTUFBTSxpQkFBaUIsQ0FBQzs7TUFHbEUsU0FBUyxHQUFHLElBQUksTUFBTSxFQUFFOztJQUcxQixrQkFBa0IsR0FBRyxDQUFDOzs7Ozs7Ozs7Ozs7QUE2RjFCLE1BQU0sT0FBTyxpQkFBaUI7SUFBOUI7UUFtSlUsa0JBQWEsR0FBWSxLQUFLLENBQUM7UUFFL0IsY0FBUyxHQUFvQixtQkFBQSxJQUFJLEVBQUUsQ0FBQztRQUNwQyxlQUFVLEdBQXFCLG1CQUFBLElBQUksRUFBRSxDQUFDO1FBQ3RDLG1CQUFj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akIsd0VBQXdFO1FBQ3hFOzs7UUFBTztZQUNMLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQztZQUNsQixPQUFPLE1BQU0sQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3ZDLENBQUMsRUFBQztJQUNKLENBQUM7Q0FDRjs7Ozs7O0lBakJhLHdDQUE0Qzs7Ozs7OztBQXdCMUQsTUFBTSxVQUFVLFVBQVUsQ0FBQyxTQUE2QixFQUFFLEVBQW9CO0lBRTVFLElBQUksRUFBRSxFQUFFO1FBQ04sd0VBQXdFO1FBQ3hFOzs7UUFBTzs7a0JBQ0MsT0FBTyxHQUFHLFVBQVUsRUFBRTtZQUM1QixJQUFJLFNBQVMsRUFBRTtnQkFDYixPQUFPLENBQUMsc0JBQXNCLENBQUMsU0FBUyxDQUFDLENBQUM7YUFDM0M7WUFDRCxPQUFPLEVBQUUsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDeEIsQ0FBQyxFQUFDO0tBQ0g7SUFDRCxPQUFPLElBQUksa0JBQWtCOzs7SUFBQyxHQUFHLEVBQUUsQ0FBQyxTQUFTLEVBQUMsQ0FBQztBQUNqRCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0FwcGxpY2F0aW9uSW5pdFN0YXR1cywgQ29tcGlsZXJPcHRpb25zLCBDb21wb25lbnQsIERpcmVjdGl2ZSwgSW5qZWN0RmxhZ3MsIEluamVjdGlvblRva2VuLCBJbmplY3RvciwgTmdNb2R1bGUsIE5nTW9kdWxlRmFjdG9yeSwgTmdNb2R1bGVSZWYsIE5nWm9uZSwgT3B0aW9uYWwsIFBpcGUsIFBsYXRmb3JtUmVmLCBQcm92aWRlciwgU2NoZW1hTWV0YWRhdGEsIFNraXBTZWxmLCBTdGF0aWNQcm92aWRlciwgVHlwZSwgybVBUFBfUk9PVCBhcyBBUFBfUk9PVCwgybVEZXBGbGFncyBhcyBEZXBGbGFncywgybVOb2RlRmxhZ3MgYXMgTm9kZUZsYWdzLCDJtWNsZWFyT3ZlcnJpZGVzIGFzIGNsZWFyT3ZlcnJpZGVzLCDJtWdldEluamVjdGFibGVEZWYgYXMgZ2V0SW5qZWN0YWJsZURlZiwgybVpdnlFbmFibGVkIGFzIGl2eUVuYWJsZWQsIMm1b3ZlcnJpZGVDb21wb25lbnRWaWV3IGFzIG92ZXJyaWRlQ29tcG9uZW50VmlldywgybVvdmVycmlkZVByb3ZpZGVyIGFzIG92ZXJyaWRlUHJvdmlkZXIsIMm1c3RyaW5naWZ5IGFzIHN0cmluZ2lmeSwgzpRJbmplY3RhYmxlRGVmfSBmcm9tICdAYW5ndWxhci9jb3JlJztcblxuaW1wb3J0IHtBc3luY1Rlc3RDb21wbGV0ZXJ9IGZyb20gJy4vYXN5bmNfdGVzdF9jb21wbGV0ZXInO1xuaW1wb3J0IHtDb21wb25lbnRGaXh0dXJlfSBmcm9tICcuL2NvbXBvbmVudF9maXh0dXJlJztcbmltcG9ydCB7TWV0YWRhdGFPdmVycmlkZX0gZnJvbSAnLi9tZXRhZGF0YV9vdmVycmlkZSc7XG5pbXBvcnQge1Rlc3RCZWRSZW5kZXIzLCBfZ2V0VGVzdEJlZFJlbmRlcjN9IGZyb20gJy4vcjNfdGVzdF9iZWQnO1xuaW1wb3J0IHtDb21wb25lbnRGaXh0dXJlQXV0b0RldGVjdCwgQ29tcG9uZW50Rml4dHVyZU5vTmdab25lLCBUZXN0QmVkU3RhdGljLCBUZXN0Q29tcG9uZW50UmVuZGVyZXIsIFRlc3RNb2R1bGVNZXRhZGF0YX0gZnJvbSAnLi90ZXN0X2JlZF9jb21tb24nO1xuaW1wb3J0IHtUZXN0aW5nQ29tcGlsZXIsIFRlc3RpbmdDb21waWxlckZhY3Rvcnl9IGZyb20gJy4vdGVzdF9jb21waWxlcic7XG5cblxuY29uc3QgVU5ERUZJTkVEID0gbmV3IE9iamVjdCgpO1xuXG5cbmxldCBfbmV4dFJvb3RFbGVtZW50SWQgPSAwO1xuXG4vKipcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBUZXN0QmVkIHtcbiAgcGxhdGZvcm06IFBsYXRmb3JtUmVmO1xuXG4gIG5nTW9kdWxlOiBUeXBlPGFueT58VHlwZTxhbnk+W107XG5cbiAgLyoqXG4gICAqIEluaXRpYWxpemUgdGhlIGVudmlyb25tZW50IGZvciB0ZXN0aW5nIHdpdGggYSBjb21waWxlciBmYWN0b3J5LCBhIFBsYXRmb3JtUmVmLCBhbmQgYW5cbiAgICogYW5ndWxhciBtb2R1bGUuIFRoZXNlIGFyZSBjb21tb24gdG8gZXZlcnkgdGVzdCBpbiB0aGUgc3VpdGUuXG4gICAqXG4gICAqIFRoaXMgbWF5IG9ubHkgYmUgY2FsbGVkIG9uY2UsIHRvIHNldCB1cCB0aGUgY29tbW9uIHByb3ZpZGVycyBmb3IgdGhlIGN1cnJlbnQgdGVzdFxuICAgKiBzdWl0ZSBvbiB0aGUgY3VycmVudCBwbGF0Zm9ybS4gSWYgeW91IGFic29sdXRlbHkgbmVlZCB0byBjaGFuZ2UgdGhlIHByb3ZpZGVycyxcbiAgICogZmlyc3QgdXNlIGByZXNldFRlc3RFbnZpcm9ubWVudGAuXG4gICAqXG4gICAqIFRlc3QgbW9kdWxlcyBhbmQgcGxhdGZvcm1zIGZvciBpbmRpdmlkdWFsIHBsYXRmb3JtcyBhcmUgYXZhaWxhYmxlIGZyb21cbiAgICogJ0Bhbmd1bGFyLzxwbGF0Zm9ybV9uYW1lPi90ZXN0aW5nJy5cbiAgICovXG4gIGluaXRUZXN0RW52aXJvbm1lbnQoXG4gICAgICBuZ01vZHVsZTogVHlwZTxhbnk+fFR5cGU8YW55PltdLCBwbGF0Zm9ybTogUGxhdGZvcm1SZWYsIGFvdFN1bW1hcmllcz86ICgpID0+IGFueVtdKTogdm9pZDtcblxuICAvKipcbiAgICogUmVzZXQgdGhlIHByb3ZpZGVycyBmb3IgdGhlIHRlc3QgaW5qZWN0b3IuXG4gICAqL1xuICByZXNldFRlc3RFbnZpcm9ubWVudCgpOiB2b2lkO1xuXG4gIHJlc2V0VGVzdGluZ01vZHVsZSgpOiB2b2lkO1xuXG4gIGNvbmZpZ3VyZUNvbXBpbGVyKGNvbmZpZzoge3Byb3ZpZGVycz86IGFueVtdLCB1c2VKaXQ/OiBib29sZWFufSk6IHZvaWQ7XG5cbiAgY29uZmlndXJlVGVzdGluZ01vZHVsZShtb2R1bGVEZWY6IFRlc3RNb2R1bGVNZXRhZGF0YSk6IHZvaWQ7XG5cbiAgY29tcGlsZUNvbXBvbmVudHMoKTogUHJvbWlzZTxhbnk+O1xuXG4gIGdldDxUPih0b2tlbjogVHlwZTxUPnxJbmplY3Rpb25Ub2tlbjxUPiwgbm90Rm91bmRWYWx1ZT86IFQsIGZsYWdzPzogSW5qZWN0RmxhZ3MpOiBhbnk7XG4gIC8qKlxuICAgKiBAZGVwcmVjYXRlZCBmcm9tIHY4LjAuMCB1c2UgVHlwZTxUPiBvciBJbmplY3Rpb25Ub2tlbjxUPlxuICAgKi9cbiAgZ2V0KHRva2VuOiBhbnksIG5vdEZvdW5kVmFsdWU/OiBhbnkpOiBhbnk7XG5cbiAgZXhlY3V0ZSh0b2tlbnM6IGFueVtdLCBmbjogRnVuY3Rpb24sIGNvbnRleHQ/OiBhbnkpOiBhbnk7XG5cbiAgb3ZlcnJpZGVNb2R1bGUobmdNb2R1bGU6IFR5cGU8YW55Piwgb3ZlcnJpZGU6IE1ldGFkYXRhT3ZlcnJpZGU8TmdNb2R1bGU+KTogdm9pZDtcblxuICBvdmVycmlkZUNvbXBvbmVudChjb21wb25lbnQ6IFR5cGU8YW55Piwgb3ZlcnJpZGU6IE1ldGFkYXRhT3ZlcnJpZGU8Q29tcG9uZW50Pik6IHZvaWQ7XG5cbiAgb3ZlcnJpZGVEaXJlY3RpdmUoZGlyZWN0aXZlOiBUeXBlPGFueT4sIG92ZXJyaWRlOiBNZXRhZGF0YU92ZXJyaWRlPERpcmVjdGl2ZT4pOiB2b2lkO1xuXG4gIG92ZXJyaWRlUGlwZShwaXBlOiBUeXBlPGFueT4sIG92ZXJyaWRlOiBNZXRhZGF0YU92ZXJyaWRlPFBpcGU+KTogdm9pZDtcblxuICAvKipcbiAgICogT3ZlcndyaXRlcyBhbGwgcHJvdmlkZXJzIGZvciB0aGUgZ2l2ZW4gdG9rZW4gd2l0aCB0aGUgZ2l2ZW4gcHJvdmlkZXIgZGVmaW5pdGlvbi5cbiAgICovXG4gIG92ZXJyaWRlUHJvdmlkZXIodG9rZW46IGFueSwgcHJvdmlkZXI6IHtcbiAgICB1c2VGYWN0b3J5OiBGdW5jdGlvbixcbiAgICBkZXBzOiBhbnlbXSxcbiAgfSk6IHZvaWQ7XG4gIG92ZXJyaWRlUHJvdmlkZXIodG9rZW46IGFueSwgcHJvdmlkZXI6IHt1c2VWYWx1ZTogYW55O30pOiB2b2lkO1xuICBvdmVycmlkZVByb3ZpZGVyKHRva2VuOiBhbnksIHByb3ZpZGVyOiB7dXNlRmFjdG9yeT86IEZ1bmN0aW9uLCB1c2VWYWx1ZT86IGFueSwgZGVwcz86IGFueVtdfSk6XG4gICAgICB2b2lkO1xuXG4gIC8qKlxuICAgKiBPdmVyd3JpdGVzIGFsbCBwcm92aWRlcnMgZm9yIHRoZSBnaXZlbiB0b2tlbiB3aXRoIHRoZSBnaXZlbiBwcm92aWRlciBkZWZpbml0aW9uLlxuICAgKlxuICAgKiBAZGVwcmVjYXRlZCBhcyBpdCBtYWtlcyBhbGwgTmdNb2R1bGVzIGxhenkuIEludHJvZHVjZWQgb25seSBmb3IgbWlncmF0aW5nIG9mZiBvZiBpdC5cbiAgICovXG4gIGRlcHJlY2F0ZWRPdmVycmlkZVByb3ZpZGVyKHRva2VuOiBhbnksIHByb3ZpZGVyOiB7XG4gICAgdXNlRmFjdG9yeTogRnVuY3Rpb24sXG4gICAgZGVwczogYW55W10sXG4gIH0pOiB2b2lkO1xuICBkZXByZWNhdGVkT3ZlcnJpZGVQcm92aWRlcih0b2tlbjogYW55LCBwcm92aWRlcjoge3VzZVZhbHVlOiBhbnk7fSk6IHZvaWQ7XG4gIGRlcHJlY2F0ZWRPdmVycmlkZVByb3ZpZGVyKFxuICAgICAgdG9rZW46IGFueSwgcHJvdmlkZXI6IHt1c2VGYWN0b3J5PzogRnVuY3Rpb24sIHVzZVZhbHVlPzogYW55LCBkZXBzPzogYW55W119KTogdm9pZDtcblxuXG4gIG92ZXJyaWRlVGVtcGxhdGVVc2luZ1Rlc3RpbmdNb2R1bGUoY29tcG9uZW50OiBUeXBlPGFueT4sIHRlbXBsYXRlOiBzdHJpbmcpOiB2b2lkO1xuXG4gIGNyZWF0ZUNvbXBvbmVudDxUPihjb21wb25lbnQ6IFR5cGU8VD4pOiBDb21wb25lbnRGaXh0dXJlPFQ+O1xufVxuXG4vKipcbiAqIEBkZXNjcmlwdGlvblxuICogQ29uZmlndXJlcyBhbmQgaW5pdGlhbGl6ZXMgZW52aXJvbm1lbnQgZm9yIHVuaXQgdGVzdGluZyBhbmQgcHJvdmlkZXMgbWV0aG9kcyBmb3JcbiAqIGNyZWF0aW5nIGNvbXBvbmVudHMgYW5kIHNlcnZpY2VzIGluIHVuaXQgdGVzdHMuXG4gKlxuICogYFRlc3RCZWRgIGlzIHRoZSBwcmltYXJ5IGFwaSBmb3Igd3JpdGluZyB1bml0IHRlc3RzIGZvciBBbmd1bGFyIGFwcGxpY2F0aW9ucyBhbmQgbGlicmFyaWVzLlxuICpcbiAqIE5vdGU6IFVzZSBgVGVzdEJlZGAgaW4gdGVzdHMuIEl0IHdpbGwgYmUgc2V0IHRvIGVpdGhlciBgVGVzdEJlZFZpZXdFbmdpbmVgIG9yIGBUZXN0QmVkUmVuZGVyM2BcbiAqIGFjY29yZGluZyB0byB0aGUgY29tcGlsZXIgdXNlZC5cbiAqL1xuZXhwb3J0IGNsYXNzIFRlc3RCZWRWaWV3RW5naW5lIGltcGxlbWVudHMgSW5qZWN0b3IsIFRlc3RCZWQge1xuICAvKipcbiAgICogSW5pdGlhbGl6ZSB0aGUgZW52aXJvbm1lbnQgZm9yIHRlc3Rpbmcgd2l0aCBhIGNvbXBpbGVyIGZhY3RvcnksIGEgUGxhdGZvcm1SZWYsIGFuZCBhblxuICAgKiBhbmd1bGFyIG1vZHVsZS4gVGhlc2UgYXJlIGNvbW1vbiB0byBldmVyeSB0ZXN0IGluIHRoZSBzdWl0ZS5cbiAgICpcbiAgICogVGhpcyBtYXkgb25seSBiZSBjYWxsZWQgb25jZSwgdG8gc2V0IHVwIHRoZSBjb21tb24gcHJvdmlkZXJzIGZvciB0aGUgY3VycmVudCB0ZXN0XG4gICAqIHN1aXRlIG9uIHRoZSBjdXJyZW50IHBsYXRmb3JtLiBJZiB5b3UgYWJzb2x1dGVseSBuZWVkIHRvIGNoYW5nZSB0aGUgcHJvdmlkZXJzLFxuICAgKiBmaXJzdCB1c2UgYHJlc2V0VGVzdEVudmlyb25tZW50YC5cbiAgICpcbiAgICogVGVzdCBtb2R1bGVzIGFuZCBwbGF0Zm9ybXMgZm9yIGluZGl2aWR1YWwgcGxhdGZvcm1zIGFyZSBhdmFpbGFibGUgZnJvbVxuICAgKiAnQGFuZ3VsYXIvPHBsYXRmb3JtX25hbWU+L3Rlc3RpbmcnLlxuICAgKi9cbiAgc3RhdGljIGluaXRUZXN0RW52aXJvbm1lbnQoXG4gICAgICBuZ01vZHVsZTogVHlwZTxhbnk+fFR5cGU8YW55PltdLCBwbGF0Zm9ybTogUGxhdGZvcm1SZWYsXG4gICAgICBhb3RTdW1tYXJpZXM/OiAoKSA9PiBhbnlbXSk6IFRlc3RCZWRWaWV3RW5naW5lIHtcbiAgICBjb25zdCB0ZXN0QmVkID0gX2dldFRlc3RCZWRWaWV3RW5naW5lKCk7XG4gICAgdGVzdEJlZC5pbml0VGVzdEVudmlyb25tZW50KG5nTW9kdWxlLCBwbGF0Zm9ybSwgYW90U3VtbWFyaWVzKTtcbiAgICByZXR1cm4gdGVzdEJlZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXNldCB0aGUgcHJvdmlkZXJzIGZvciB0aGUgdGVzdCBpbmplY3Rvci5cbiAgICovXG4gIHN0YXRpYyByZXNldFRlc3RFbnZpcm9ubWVudCgpOiB2b2lkIHsgX2dldFRlc3RCZWRWaWV3RW5naW5lKCkucmVzZXRUZXN0RW52aXJvbm1lbnQoKTsgfVxuXG4gIHN0YXRpYyByZXNldFRlc3RpbmdNb2R1bGUoKTogVGVzdEJlZFN0YXRpYyB7XG4gICAgX2dldFRlc3RCZWRWaWV3RW5naW5lKCkucmVzZXRUZXN0aW5nTW9kdWxlKCk7XG4gICAgcmV0dXJuIFRlc3RCZWRWaWV3RW5naW5lIGFzIGFueSBhcyBUZXN0QmVkU3RhdGljO1xuICB9XG5cbiAgLyoqXG4gICAqIEFsbG93cyBvdmVycmlkaW5nIGRlZmF1bHQgY29tcGlsZXIgcHJvdmlkZXJzIGFuZCBzZXR0aW5nc1xuICAgKiB3aGljaCBhcmUgZGVmaW5lZCBpbiB0ZXN0X2luamVjdG9yLmpzXG4gICAqL1xuICBzdGF0aWMgY29uZmlndXJlQ29tcGlsZXIoY29uZmlnOiB7cHJvdmlkZXJzPzogYW55W107IHVzZUppdD86IGJvb2xlYW47fSk6IFRlc3RCZWRTdGF0aWMge1xuICAgIF9nZXRUZXN0QmVkVmlld0VuZ2luZSgpLmNvbmZpZ3VyZUNvbXBpbGVyKGNvbmZpZyk7XG4gICAgcmV0dXJuIFRlc3RCZWRWaWV3RW5naW5lIGFzIGFueSBhcyBUZXN0QmVkU3RhdGljO1xuICB9XG5cbiAgLyoqXG4gICAqIEFsbG93cyBvdmVycmlkaW5nIGRlZmF1bHQgcHJvdmlkZXJzLCBkaXJlY3RpdmVzLCBwaXBlcywgbW9kdWxlcyBvZiB0aGUgdGVzdCBpbmplY3RvcixcbiAgICogd2hpY2ggYXJlIGRlZmluZWQgaW4gdGVzdF9pbmplY3Rvci5qc1xuICAgKi9cbiAgc3RhdGljIGNvbmZpZ3VyZVRlc3RpbmdNb2R1bGUobW9kdWxlRGVmOiBUZXN0TW9kdWxlTWV0YWRhdGEpOiBUZXN0QmVkU3RhdGljIHtcbiAgICBfZ2V0VGVzdEJlZFZpZXdFbmdpbmUoKS5jb25maWd1cmVUZXN0aW5nTW9kdWxlKG1vZHVsZURlZik7XG4gICAgcmV0dXJuIFRlc3RCZWRWaWV3RW5naW5lIGFzIGFueSBhcyBUZXN0QmVkU3RhdGljO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbXBpbGUgY29tcG9uZW50cyB3aXRoIGEgYHRlbXBsYXRlVXJsYCBmb3IgdGhlIHRlc3QncyBOZ01vZHVsZS5cbiAgICogSXQgaXMgbmVjZXNzYXJ5IHRvIGNhbGwgdGhpcyBmdW5jdGlvblxuICAgKiBhcyBmZXRjaGluZyB1cmxzIGlzIGFzeW5jaHJvbm91cy5cbiAgICovXG4gIHN0YXRpYyBjb21waWxlQ29tcG9uZW50cygpOiBQcm9taXNlPGFueT4geyByZXR1cm4gZ2V0VGVzdEJlZCgpLmNvbXBpbGVDb21wb25lbnRzKCk7IH1cblxuICBzdGF0aWMgb3ZlcnJpZGVNb2R1bGUobmdNb2R1bGU6IFR5cGU8YW55Piwgb3ZlcnJpZGU6IE1ldGFkYXRhT3ZlcnJpZGU8TmdNb2R1bGU+KTogVGVzdEJlZFN0YXRpYyB7XG4gICAgX2dldFRlc3RCZWRWaWV3RW5naW5lKCkub3ZlcnJpZGVNb2R1bGUobmdNb2R1bGUsIG92ZXJyaWRlKTtcbiAgICByZXR1cm4gVGVzdEJlZFZpZXdFbmdpbmUgYXMgYW55IGFzIFRlc3RCZWRTdGF0aWM7XG4gIH1cblxuICBzdGF0aWMgb3ZlcnJpZGVDb21wb25lbnQoY29tcG9uZW50OiBUeXBlPGFueT4sIG92ZXJyaWRlOiBNZXRhZGF0YU92ZXJyaWRlPENvbXBvbmVudD4pOlxuICAgICAgVGVzdEJlZFN0YXRpYyB7XG4gICAgX2dldFRlc3RCZWRWaWV3RW5naW5lKCkub3ZlcnJpZGVDb21wb25lbnQoY29tcG9uZW50LCBvdmVycmlkZSk7XG4gICAgcmV0dXJuIFRlc3RCZWRWaWV3RW5naW5lIGFzIGFueSBhcyBUZXN0QmVkU3RhdGljO1xuICB9XG5cbiAgc3RhdGljIG92ZXJyaWRlRGlyZWN0aXZlKGRpcmVjdGl2ZTogVHlwZTxhbnk+LCBvdmVycmlkZTogTWV0YWRhdGFPdmVycmlkZTxEaXJlY3RpdmU+KTpcbiAgICAgIFRlc3RCZWRTdGF0aWMge1xuICAgIF9nZXRUZXN0QmVkVmlld0VuZ2luZSgpLm92ZXJyaWRlRGlyZWN0aXZlKGRpcmVjdGl2ZSwgb3ZlcnJpZGUpO1xuICAgIHJldHVybiBUZXN0QmVkVmlld0VuZ2luZSBhcyBhbnkgYXMgVGVzdEJlZFN0YXRpYztcbiAgfVxuXG4gIHN0YXRpYyBvdmVycmlkZVBpcGUocGlwZTogVHlwZTxhbnk+LCBvdmVycmlkZTogTWV0YWRhdGFPdmVycmlkZTxQaXBlPik6IFRlc3RCZWRTdGF0aWMge1xuICAgIF9nZXRUZXN0QmVkVmlld0VuZ2luZSgpLm92ZXJyaWRlUGlwZShwaXBlLCBvdmVycmlkZSk7XG4gICAgcmV0dXJuIFRlc3RCZWRWaWV3RW5naW5lIGFzIGFueSBhcyBUZXN0QmVkU3RhdGljO1xuICB9XG5cbiAgc3RhdGljIG92ZXJyaWRlVGVtcGxhdGUoY29tcG9uZW50OiBUeXBlPGFueT4sIHRlbXBsYXRlOiBzdHJpbmcpOiBUZXN0QmVkU3RhdGljIHtcbiAgICBfZ2V0VGVzdEJlZFZpZXdFbmdpbmUoKS5vdmVycmlkZUNvbXBvbmVudChjb21wb25lbnQsIHtzZXQ6IHt0ZW1wbGF0ZSwgdGVtcGxhdGVVcmw6IG51bGwgIX19KTtcbiAgICByZXR1cm4gVGVzdEJlZFZpZXdFbmdpbmUgYXMgYW55IGFzIFRlc3RCZWRTdGF0aWM7XG4gIH1cblxuICAvKipcbiAgICogT3ZlcnJpZGVzIHRoZSB0ZW1wbGF0ZSBvZiB0aGUgZ2l2ZW4gY29tcG9uZW50LCBjb21waWxpbmcgdGhlIHRlbXBsYXRlXG4gICAqIGluIHRoZSBjb250ZXh0IG9mIHRoZSBUZXN0aW5nTW9kdWxlLlxuICAgKlxuICAgKiBOb3RlOiBUaGlzIHdvcmtzIGZvciBKSVQgYW5kIEFPVGVkIGNvbXBvbmVudHMgYXMgd2VsbC5cbiAgICovXG4gIHN0YXRpYyBvdmVycmlkZVRlbXBsYXRlVXNpbmdUZXN0aW5nTW9kdWxlKGNvbXBvbmVudDogVHlwZTxhbnk+LCB0ZW1wbGF0ZTogc3RyaW5nKTogVGVzdEJlZFN0YXRpYyB7XG4gICAgX2dldFRlc3RCZWRWaWV3RW5naW5lKCkub3ZlcnJpZGVUZW1wbGF0ZVVzaW5nVGVzdGluZ01vZHVsZShjb21wb25lbnQsIHRlbXBsYXRlKTtcbiAgICByZXR1cm4gVGVzdEJlZFZpZXdFbmdpbmUgYXMgYW55IGFzIFRlc3RCZWRTdGF0aWM7XG4gIH1cblxuICAvKipcbiAgICogT3ZlcndyaXRlcyBhbGwgcHJvdmlkZXJzIGZvciB0aGUgZ2l2ZW4gdG9rZW4gd2l0aCB0aGUgZ2l2ZW4gcHJvdmlkZXIgZGVmaW5pdGlvbi5cbiAgICpcbiAgICogTm90ZTogVGhpcyB3b3JrcyBmb3IgSklUIGFuZCBBT1RlZCBjb21wb25lbnRzIGFzIHdlbGwuXG4gICAqL1xuICBzdGF0aWMgb3ZlcnJpZGVQcm92aWRlcih0b2tlbjogYW55LCBwcm92aWRlcjoge1xuICAgIHVzZUZhY3Rvcnk6IEZ1bmN0aW9uLFxuICAgIGRlcHM6IGFueVtdLFxuICB9KTogVGVzdEJlZFN0YXRpYztcbiAgc3RhdGljIG92ZXJyaWRlUHJvdmlkZXIodG9rZW46IGFueSwgcHJvdmlkZXI6IHt1c2VWYWx1ZTogYW55O30pOiBUZXN0QmVkU3RhdGljO1xuICBzdGF0aWMgb3ZlcnJpZGVQcm92aWRlcih0b2tlbjogYW55LCBwcm92aWRlcjoge1xuICAgIHVzZUZhY3Rvcnk/OiBGdW5jdGlvbixcbiAgICB1c2VWYWx1ZT86IGFueSxcbiAgICBkZXBzPzogYW55W10sXG4gIH0pOiBUZXN0QmVkU3RhdGljIHtcbiAgICBfZ2V0VGVzdEJlZFZpZXdFbmdpbmUoKS5vdmVycmlkZVByb3ZpZGVyKHRva2VuLCBwcm92aWRlciBhcyBhbnkpO1xuICAgIHJldHVybiBUZXN0QmVkVmlld0VuZ2luZSBhcyBhbnkgYXMgVGVzdEJlZFN0YXRpYztcbiAgfVxuXG4gIC8qKlxuICAgKiBPdmVyd3JpdGVzIGFsbCBwcm92aWRlcnMgZm9yIHRoZSBnaXZlbiB0b2tlbiB3aXRoIHRoZSBnaXZlbiBwcm92aWRlciBkZWZpbml0aW9uLlxuICAgKlxuICAgKiBAZGVwcmVjYXRlZCBhcyBpdCBtYWtlcyBhbGwgTmdNb2R1bGVzIGxhenkuIEludHJvZHVjZWQgb25seSBmb3IgbWlncmF0aW5nIG9mZiBvZiBpdC5cbiAgICovXG4gIHN0YXRpYyBkZXByZWNhdGVkT3ZlcnJpZGVQcm92aWRlcih0b2tlbjogYW55LCBwcm92aWRlcjoge1xuICAgIHVzZUZhY3Rvcnk6IEZ1bmN0aW9uLFxuICAgIGRlcHM6IGFueVtdLFxuICB9KTogdm9pZDtcbiAgc3RhdGljIGRlcHJlY2F0ZWRPdmVycmlkZVByb3ZpZGVyKHRva2VuOiBhbnksIHByb3ZpZGVyOiB7dXNlVmFsdWU6IGFueTt9KTogdm9pZDtcbiAgc3RhdGljIGRlcHJlY2F0ZWRPdmVycmlkZVByb3ZpZGVyKHRva2VuOiBhbnksIHByb3ZpZGVyOiB7XG4gICAgdXNlRmFjdG9yeT86IEZ1bmN0aW9uLFxuICAgIHVzZVZhbHVlPzogYW55LFxuICAgIGRlcHM/OiBhbnlbXSxcbiAgfSk6IFRlc3RCZWRTdGF0aWMge1xuICAgIF9nZXRUZXN0QmVkVmlld0VuZ2luZSgpLmRlcHJlY2F0ZWRPdmVycmlkZVByb3ZpZGVyKHRva2VuLCBwcm92aWRlciBhcyBhbnkpO1xuICAgIHJldHVybiBUZXN0QmVkVmlld0VuZ2luZSBhcyBhbnkgYXMgVGVzdEJlZFN0YXRpYztcbiAgfVxuXG4gIHN0YXRpYyBnZXQ8VD4odG9rZW46IFR5cGU8VD58SW5qZWN0aW9uVG9rZW48VD4sIG5vdEZvdW5kVmFsdWU/OiBULCBmbGFncz86IEluamVjdEZsYWdzKTogYW55O1xuICAvKipcbiAgICogQGRlcHJlY2F0ZWQgZnJvbSB2OC4wLjAgdXNlIFR5cGU8VD4gb3IgSW5qZWN0aW9uVG9rZW48VD5cbiAgICogQHN1cHByZXNzIHtkdXBsaWNhdGV9XG4gICAqL1xuICBzdGF0aWMgZ2V0KHRva2VuOiBhbnksIG5vdEZvdW5kVmFsdWU/OiBhbnkpOiBhbnk7XG4gIHN0YXRpYyBnZXQoXG4gICAgICB0b2tlbjogYW55LCBub3RGb3VuZFZhbHVlOiBhbnkgPSBJbmplY3Rvci5USFJPV19JRl9OT1RfRk9VTkQsXG4gICAgICBmbGFnczogSW5qZWN0RmxhZ3MgPSBJbmplY3RGbGFncy5EZWZhdWx0KTogYW55IHtcbiAgICByZXR1cm4gX2dldFRlc3RCZWRWaWV3RW5naW5lKCkuZ2V0KHRva2VuLCBub3RGb3VuZFZhbHVlLCBmbGFncyk7XG4gIH1cblxuICBzdGF0aWMgY3JlYXRlQ29tcG9uZW50PFQ+KGNvbXBvbmVudDogVHlwZTxUPik6IENvbXBvbmVudEZpeHR1cmU8VD4ge1xuICAgIHJldHVybiBfZ2V0VGVzdEJlZFZpZXdFbmdpbmUoKS5jcmVhdGVDb21wb25lbnQoY29tcG9uZW50KTtcbiAgfVxuXG4gIHByaXZhdGUgX2luc3RhbnRpYXRlZDogYm9vbGVhbiA9IGZhbHNlO1xuXG4gIHByaXZhdGUgX2NvbXBpbGVyOiBUZXN0aW5nQ29tcGlsZXIgPSBudWxsICE7XG4gIHByaXZhdGUgX21vZHVsZVJlZjogTmdNb2R1bGVSZWY8YW55PiA9IG51bGwgITtcbiAgcHJpdmF0ZSBfbW9kdWxlRmFjdG9yeTogTmdNb2R1bGVGYWN0b3J5PGFueT4gPSBudWxsICE7XG5cbiAgcHJpdmF0ZSBfY29tcGlsZXJPcHRpb25zOiBDb21waWxlck9wdGlvbnNbXSA9IFtdO1xuXG4gIHByaXZhdGUgX21vZHVsZU92ZXJyaWRlczogW1R5cGU8YW55PiwgTWV0YWRhdGFPdmVycmlkZTxOZ01vZHVsZT5dW10gPSBbXTtcbiAgcHJpdmF0ZSBfY29tcG9uZW50T3ZlcnJpZGVzOiBbVHlwZTxhbnk+LCBNZXRhZGF0YU92ZXJyaWRlPENvbXBvbmVudD5dW10gPSBbXTtcbiAgcHJpdmF0ZSBfZGlyZWN0aXZlT3ZlcnJpZGVzOiBbVHlwZTxhbnk+LCBNZXRhZGF0YU92ZXJyaWRlPERpcmVjdGl2ZT5dW10gPSBbXTtcbiAgcHJpdmF0ZSBfcGlwZU92ZXJyaWRlczogW1R5cGU8YW55PiwgTWV0YWRhdGFPdmVycmlkZTxQaXBlPl1bXSA9IFtdO1xuXG4gIHByaXZhdGUgX3Byb3ZpZGVyczogUHJvdmlkZXJbXSA9IFtdO1xuICBwcml2YXRlIF9kZWNsYXJhdGlvbnM6IEFycmF5PFR5cGU8YW55PnxhbnlbXXxhbnk+ID0gW107XG4gIHByaXZhdGUgX2ltcG9ydHM6IEFycmF5PFR5cGU8YW55PnxhbnlbXXxhbnk+ID0gW107XG4gIHByaXZhdGUgX3NjaGVtYXM6IEFycmF5PFNjaGVtYU1ldGFkYXRhfGFueVtdPiA9IFtdO1xuICBwcml2YXRlIF9hY3RpdmVGaXh0dXJlczogQ29tcG9uZW50Rml4dHVyZTxhbnk+W10gPSBbXTtcblxuICBwcml2YXRlIF90ZXN0RW52QW90U3VtbWFyaWVzOiAoKSA9PiBhbnlbXSA9ICgpID0+IFtdO1xuICBwcml2YXRlIF9hb3RTdW1tYXJpZXM6IEFycmF5PCgpID0+IGFueVtdPiA9IFtdO1xuICBwcml2YXRlIF90ZW1wbGF0ZU92ZXJyaWRlczogQXJyYXk8e2NvbXBvbmVudDogVHlwZTxhbnk+LCB0ZW1wbGF0ZU9mOiBUeXBlPGFueT59PiA9IFtdO1xuXG4gIHByaXZhdGUgX2lzUm9vdDogYm9vbGVhbiA9IHRydWU7XG4gIHByaXZhdGUgX3Jvb3RQcm92aWRlck92ZXJyaWRlczogUHJvdmlkZXJbXSA9IFtdO1xuXG4gIHBsYXRmb3JtOiBQbGF0Zm9ybVJlZiA9IG51bGwgITtcblxuICBuZ01vZHVsZTogVHlwZTxhbnk+fFR5cGU8YW55PltdID0gbnVsbCAhO1xuXG4gIC8qKlxuICAgKiBJbml0aWFsaXplIHRoZSBlbnZpcm9ubWVudCBmb3IgdGVzdGluZyB3aXRoIGEgY29tcGlsZXIgZmFjdG9yeSwgYSBQbGF0Zm9ybVJlZiwgYW5kIGFuXG4gICAqIGFuZ3VsYXIgbW9kdWxlLiBUaGVzZSBhcmUgY29tbW9uIHRvIGV2ZXJ5IHRlc3QgaW4gdGhlIHN1aXRlLlxuICAgKlxuICAgKiBUaGlzIG1heSBvbmx5IGJlIGNhbGxlZCBvbmNlLCB0byBzZXQgdXAgdGhlIGNvbW1vbiBwcm92aWRlcnMgZm9yIHRoZSBjdXJyZW50IHRlc3RcbiAgICogc3VpdGUgb24gdGhlIGN1cnJlbnQgcGxhdGZvcm0uIElmIHlvdSBhYnNvbHV0ZWx5IG5lZWQgdG8gY2hhbmdlIHRoZSBwcm92aWRlcnMsXG4gICAqIGZpcnN0IHVzZSBgcmVzZXRUZXN0RW52aXJvbm1lbnRgLlxuICAgKlxuICAgKiBUZXN0IG1vZHVsZXMgYW5kIHBsYXRmb3JtcyBmb3IgaW5kaXZpZHVhbCBwbGF0Zm9ybXMgYXJlIGF2YWlsYWJsZSBmcm9tXG4gICAqICdAYW5ndWxhci88cGxhdGZvcm1fbmFtZT4vdGVzdGluZycuXG4gICAqL1xuICBpbml0VGVzdEVudmlyb25tZW50KFxuICAgICAgbmdNb2R1bGU6IFR5cGU8YW55PnxUeXBlPGFueT5bXSwgcGxhdGZvcm06IFBsYXRmb3JtUmVmLCBhb3RTdW1tYXJpZXM/OiAoKSA9PiBhbnlbXSk6IHZvaWQge1xuICAgIGlmICh0aGlzLnBsYXRmb3JtIHx8IHRoaXMubmdNb2R1bGUpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignQ2Fubm90IHNldCBiYXNlIHByb3ZpZGVycyBiZWNhdXNlIGl0IGhhcyBhbHJlYWR5IGJlZW4gY2FsbGVkJyk7XG4gICAgfVxuICAgIHRoaXMucGxhdGZvcm0gPSBwbGF0Zm9ybTtcbiAgICB0aGlzLm5nTW9kdWxlID0gbmdNb2R1bGU7XG4gICAgaWYgKGFvdFN1bW1hcmllcykge1xuICAgICAgdGhpcy5fdGVzdEVudkFvdFN1bW1hcmllcyA9IGFvdFN1bW1hcmllcztcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogUmVzZXQgdGhlIHByb3ZpZGVycyBmb3IgdGhlIHRlc3QgaW5qZWN0b3IuXG4gICAqL1xuICByZXNldFRlc3RFbnZpcm9ubWVudCgpOiB2b2lkIHtcbiAgICB0aGlzLnJlc2V0VGVzdGluZ01vZHVsZSgpO1xuICAgIHRoaXMucGxhdGZvcm0gPSBudWxsICE7XG4gICAgdGhpcy5uZ01vZHVsZSA9IG51bGwgITtcbiAgICB0aGlzLl90ZXN0RW52QW90U3VtbWFyaWVzID0gKCkgPT4gW107XG4gIH1cblxuICByZXNldFRlc3RpbmdNb2R1bGUoKTogdm9pZCB7XG4gICAgY2xlYXJPdmVycmlkZXMoKTtcbiAgICB0aGlzLl9hb3RTdW1tYXJpZXMgPSBbXTtcbiAgICB0aGlzLl90ZW1wbGF0ZU92ZXJyaWRlcyA9IFtdO1xuICAgIHRoaXMuX2NvbXBpbGVyID0gbnVsbCAhO1xuICAgIHRoaXMuX21vZHVsZU92ZXJyaWRlcyA9IFtdO1xuICAgIHRoaXMuX2NvbXBvbmVudE92ZXJyaWRlcyA9IFtdO1xuICAgIHRoaXMuX2RpcmVjdGl2ZU92ZXJyaWRlcyA9IFtdO1xuICAgIHRoaXMuX3BpcGVPdmVycmlkZXMgPSBbXTtcblxuICAgIHRoaXMuX2lzUm9vdCA9IHRydWU7XG4gICAgdGhpcy5fcm9vdFByb3ZpZGVyT3ZlcnJpZGVzID0gW107XG5cbiAgICB0aGlzLl9tb2R1bGVSZWYgPSBudWxsICE7XG4gICAgdGhpcy5fbW9kdWxlRmFjdG9yeSA9IG51bGwgITtcbiAgICB0aGlzLl9jb21waWxlck9wdGlvbnMgPSBbXTtcbiAgICB0aGlzLl9wcm92aWRlcnMgPSBbXTtcbiAgICB0aGlzLl9kZWNsYXJhdGlvbnMgPSBbXTtcbiAgICB0aGlzLl9pbXBvcnRzID0gW107XG4gICAgdGhpcy5fc2NoZW1hcyA9IFtdO1xuICAgIHRoaXMuX2luc3RhbnRpYXRlZCA9IGZhbHNlO1xuICAgIHRoaXMuX2FjdGl2ZUZpeHR1cmVzLmZvckVhY2goKGZpeHR1cmUpID0+IHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGZpeHR1cmUuZGVzdHJveSgpO1xuICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBjb25zb2xlLmVycm9yKCdFcnJvciBkdXJpbmcgY2xlYW51cCBvZiBjb21wb25lbnQnLCB7XG4gICAgICAgICAgY29tcG9uZW50OiBmaXh0dXJlLmNvbXBvbmVudEluc3RhbmNlLFxuICAgICAgICAgIHN0YWNrdHJhY2U6IGUsXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHRoaXMuX2FjdGl2ZUZpeHR1cmVzID0gW107XG4gIH1cblxuICBjb25maWd1cmVDb21waWxlcihjb25maWc6IHtwcm92aWRlcnM/OiBhbnlbXSwgdXNlSml0PzogYm9vbGVhbn0pOiB2b2lkIHtcbiAgICB0aGlzLl9hc3NlcnROb3RJbnN0YW50aWF0ZWQoJ1Rlc3RCZWQuY29uZmlndXJlQ29tcGlsZXInLCAnY29uZmlndXJlIHRoZSBjb21waWxlcicpO1xuICAgIHRoaXMuX2NvbXBpbGVyT3B0aW9ucy5wdXNoKGNvbmZpZyk7XG4gIH1cblxuICBjb25maWd1cmVUZXN0aW5nTW9kdWxlKG1vZHVsZURlZjogVGVzdE1vZHVsZU1ldGFkYXRhKTogdm9pZCB7XG4gICAgdGhpcy5fYXNzZXJ0Tm90SW5zdGFudGlhdGVkKCdUZXN0QmVkLmNvbmZpZ3VyZVRlc3RpbmdNb2R1bGUnLCAnY29uZmlndXJlIHRoZSB0ZXN0IG1vZHVsZScpO1xuICAgIGlmIChtb2R1bGVEZWYucHJvdmlkZXJzKSB7XG4gICAgICB0aGlzLl9wcm92aWRlcnMucHVzaCguLi5tb2R1bGVEZWYucHJvdmlkZXJzKTtcbiAgICB9XG4gICAgaWYgKG1vZHVsZURlZi5kZWNsYXJhdGlvbnMpIHtcbiAgICAgIHRoaXMuX2RlY2xhcmF0aW9ucy5wdXNoKC4uLm1vZHVsZURlZi5kZWNsYXJhdGlvbnMpO1xuICAgIH1cbiAgICBpZiAobW9kdWxlRGVmLmltcG9ydHMpIHtcbiAgICAgIHRoaXMuX2ltcG9ydHMucHVzaCguLi5tb2R1bGVEZWYuaW1wb3J0cyk7XG4gICAgfVxuICAgIGlmIChtb2R1bGVEZWYuc2NoZW1hcykge1xuICAgICAgdGhpcy5fc2NoZW1hcy5wdXNoKC4uLm1vZHVsZURlZi5zY2hlbWFzKTtcbiAgICB9XG4gICAgaWYgKG1vZHVsZURlZi5hb3RTdW1tYXJpZXMpIHtcbiAgICAgIHRoaXMuX2FvdFN1bW1hcmllcy5wdXNoKG1vZHVsZURlZi5hb3RTdW1tYXJpZXMpO1xuICAgIH1cbiAgfVxuXG4gIGNvbXBpbGVDb21wb25lbnRzKCk6IFByb21pc2U8YW55PiB7XG4gICAgaWYgKHRoaXMuX21vZHVsZUZhY3RvcnkgfHwgdGhpcy5faW5zdGFudGlhdGVkKSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKG51bGwpO1xuICAgIH1cblxuICAgIGNvbnN0IG1vZHVsZVR5cGUgPSB0aGlzLl9jcmVhdGVDb21waWxlckFuZE1vZHVsZSgpO1xuICAgIHJldHVybiB0aGlzLl9jb21waWxlci5jb21waWxlTW9kdWxlQW5kQWxsQ29tcG9uZW50c0FzeW5jKG1vZHVsZVR5cGUpXG4gICAgICAgIC50aGVuKChtb2R1bGVBbmRDb21wb25lbnRGYWN0b3JpZXMpID0+IHtcbiAgICAgICAgICB0aGlzLl9tb2R1bGVGYWN0b3J5ID0gbW9kdWxlQW5kQ29tcG9uZW50RmFjdG9yaWVzLm5nTW9kdWxlRmFjdG9yeTtcbiAgICAgICAgfSk7XG4gIH1cblxuICBwcml2YXRlIF9pbml0SWZOZWVkZWQoKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuX2luc3RhbnRpYXRlZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAoIXRoaXMuX21vZHVsZUZhY3RvcnkpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IG1vZHVsZVR5cGUgPSB0aGlzLl9jcmVhdGVDb21waWxlckFuZE1vZHVsZSgpO1xuICAgICAgICB0aGlzLl9tb2R1bGVGYWN0b3J5ID1cbiAgICAgICAgICAgIHRoaXMuX2NvbXBpbGVyLmNvbXBpbGVNb2R1bGVBbmRBbGxDb21wb25lbnRzU3luYyhtb2R1bGVUeXBlKS5uZ01vZHVsZUZhY3Rvcnk7XG4gICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGNvbnN0IGVycm9yQ29tcFR5cGUgPSB0aGlzLl9jb21waWxlci5nZXRDb21wb25lbnRGcm9tRXJyb3IoZSk7XG4gICAgICAgIGlmIChlcnJvckNvbXBUeXBlKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgICAgICBgVGhpcyB0ZXN0IG1vZHVsZSB1c2VzIHRoZSBjb21wb25lbnQgJHtzdHJpbmdpZnkoZXJyb3JDb21wVHlwZSl9IHdoaWNoIGlzIHVzaW5nIGEgXCJ0ZW1wbGF0ZVVybFwiIG9yIFwic3R5bGVVcmxzXCIsIGJ1dCB0aGV5IHdlcmUgbmV2ZXIgY29tcGlsZWQuIGAgK1xuICAgICAgICAgICAgICBgUGxlYXNlIGNhbGwgXCJUZXN0QmVkLmNvbXBpbGVDb21wb25lbnRzXCIgYmVmb3JlIHlvdXIgdGVzdC5gKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aHJvdyBlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIGZvciAoY29uc3Qge2NvbXBvbmVudCwgdGVtcGxhdGVPZn0gb2YgdGhpcy5fdGVtcGxhdGVPdmVycmlkZXMpIHtcbiAgICAgIGNvbnN0IGNvbXBGYWN0b3J5ID0gdGhpcy5fY29tcGlsZXIuZ2V0Q29tcG9uZW50RmFjdG9yeSh0ZW1wbGF0ZU9mKTtcbiAgICAgIG92ZXJyaWRlQ29tcG9uZW50Vmlldyhjb21wb25lbnQsIGNvbXBGYWN0b3J5KTtcbiAgICB9XG5cbiAgICBjb25zdCBuZ1pvbmUgPSBuZXcgTmdab25lKHtlbmFibGVMb25nU3RhY2tUcmFjZTogdHJ1ZX0pO1xuICAgIGNvbnN0IHByb3ZpZGVyczogU3RhdGljUHJvdmlkZXJbXSA9IFt7cHJvdmlkZTogTmdab25lLCB1c2VWYWx1ZTogbmdab25lfV07XG4gICAgY29uc3Qgbmdab25lSW5qZWN0b3IgPSBJbmplY3Rvci5jcmVhdGUoe1xuICAgICAgcHJvdmlkZXJzOiBwcm92aWRlcnMsXG4gICAgICBwYXJlbnQ6IHRoaXMucGxhdGZvcm0uaW5qZWN0b3IsXG4gICAgICBuYW1lOiB0aGlzLl9tb2R1bGVGYWN0b3J5Lm1vZHVsZVR5cGUubmFtZVxuICAgIH0pO1xuICAgIHRoaXMuX21vZHVsZVJlZiA9IHRoaXMuX21vZHVsZUZhY3RvcnkuY3JlYXRlKG5nWm9uZUluamVjdG9yKTtcbiAgICAvLyBBcHBsaWNhdGlvbkluaXRTdGF0dXMucnVuSW5pdGlhbGl6ZXJzKCkgaXMgbWFya2VkIEBpbnRlcm5hbCB0byBjb3JlLiBTbyBjYXN0aW5nIHRvIGFueVxuICAgIC8vIGJlZm9yZSBhY2Nlc3NpbmcgaXQuXG4gICAgKHRoaXMuX21vZHVsZVJlZi5pbmplY3Rvci5nZXQoQXBwbGljYXRpb25Jbml0U3RhdHVzKSBhcyBhbnkpLnJ1bkluaXRpYWxpemVycygpO1xuICAgIHRoaXMuX2luc3RhbnRpYXRlZCA9IHRydWU7XG4gIH1cblxuICBwcml2YXRlIF9jcmVhdGVDb21waWxlckFuZE1vZHVsZSgpOiBUeXBlPGFueT4ge1xuICAgIGNvbnN0IHByb3ZpZGVycyA9IHRoaXMuX3Byb3ZpZGVycy5jb25jYXQoW3twcm92aWRlOiBUZXN0QmVkLCB1c2VWYWx1ZTogdGhpc31dKTtcbiAgICBjb25zdCBkZWNsYXJhdGlvbnMgPVxuICAgICAgICBbLi4udGhpcy5fZGVjbGFyYXRpb25zLCAuLi50aGlzLl90ZW1wbGF0ZU92ZXJyaWRlcy5tYXAoZW50cnkgPT4gZW50cnkudGVtcGxhdGVPZildO1xuXG4gICAgY29uc3Qgcm9vdFNjb3BlSW1wb3J0cyA9IFtdO1xuICAgIGNvbnN0IHJvb3RQcm92aWRlck92ZXJyaWRlcyA9IHRoaXMuX3Jvb3RQcm92aWRlck92ZXJyaWRlcztcbiAgICBpZiAodGhpcy5faXNSb290KSB7XG4gICAgICBATmdNb2R1bGUoe1xuICAgICAgICBwcm92aWRlcnM6IFtcbiAgICAgICAgICAuLi5yb290UHJvdmlkZXJPdmVycmlkZXMsXG4gICAgICAgIF0sXG4gICAgICAgIGppdDogdHJ1ZSxcbiAgICAgIH0pXG4gICAgICBjbGFzcyBSb290U2NvcGVNb2R1bGUge1xuICAgICAgfVxuICAgICAgcm9vdFNjb3BlSW1wb3J0cy5wdXNoKFJvb3RTY29wZU1vZHVsZSk7XG4gICAgfVxuICAgIHByb3ZpZGVycy5wdXNoKHtwcm92aWRlOiBBUFBfUk9PVCwgdXNlVmFsdWU6IHRoaXMuX2lzUm9vdH0pO1xuXG4gICAgY29uc3QgaW1wb3J0cyA9IFtyb290U2NvcGVJbXBvcnRzLCB0aGlzLm5nTW9kdWxlLCB0aGlzLl9pbXBvcnRzXTtcbiAgICBjb25zdCBzY2hlbWFzID0gdGhpcy5fc2NoZW1hcztcblxuICAgIEBOZ01vZHVsZSh7cHJvdmlkZXJzLCBkZWNsYXJhdGlvbnMsIGltcG9ydHMsIHNjaGVtYXMsIGppdDogdHJ1ZX0pXG4gICAgY2xhc3MgRHluYW1pY1Rlc3RNb2R1bGUge1xuICAgIH1cblxuICAgIGNvbnN0IGNvbXBpbGVyRmFjdG9yeTogVGVzdGluZ0NvbXBpbGVyRmFjdG9yeSA9XG4gICAgICAgIHRoaXMucGxhdGZvcm0uaW5qZWN0b3IuZ2V0KFRlc3RpbmdDb21waWxlckZhY3RvcnkpO1xuICAgIHRoaXMuX2NvbXBpbGVyID0gY29tcGlsZXJGYWN0b3J5LmNyZWF0ZVRlc3RpbmdDb21waWxlcih0aGlzLl9jb21waWxlck9wdGlvbnMpO1xuICAgIGZvciAoY29uc3Qgc3VtbWFyeSBvZiBbdGhpcy5fdGVzdEVudkFvdFN1bW1hcmllcywgLi4udGhpcy5fYW90U3VtbWFyaWVzXSkge1xuICAgICAgdGhpcy5fY29tcGlsZXIubG9hZEFvdFN1bW1hcmllcyhzdW1tYXJ5KTtcbiAgICB9XG4gICAgdGhpcy5fbW9kdWxlT3ZlcnJpZGVzLmZvckVhY2goKGVudHJ5KSA9PiB0aGlzLl9jb21waWxlci5vdmVycmlkZU1vZHVsZShlbnRyeVswXSwgZW50cnlbMV0pKTtcbiAgICB0aGlzLl9jb21wb25lbnRPdmVycmlkZXMuZm9yRWFjaChcbiAgICAgICAgKGVudHJ5KSA9PiB0aGlzLl9jb21waWxlci5vdmVycmlkZUNvbXBvbmVudChlbnRyeVswXSwgZW50cnlbMV0pKTtcbiAgICB0aGlzLl9kaXJlY3RpdmVPdmVycmlkZXMuZm9yRWFjaChcbiAgICAgICAgKGVudHJ5KSA9PiB0aGlzLl9jb21waWxlci5vdmVycmlkZURpcmVjdGl2ZShlbnRyeVswXSwgZW50cnlbMV0pKTtcbiAgICB0aGlzLl9waXBlT3ZlcnJpZGVzLmZvckVhY2goKGVudHJ5KSA9PiB0aGlzLl9jb21waWxlci5vdmVycmlkZVBpcGUoZW50cnlbMF0sIGVudHJ5WzFdKSk7XG4gICAgcmV0dXJuIER5bmFtaWNUZXN0TW9kdWxlO1xuICB9XG5cbiAgcHJpdmF0ZSBfYXNzZXJ0Tm90SW5zdGFudGlhdGVkKG1ldGhvZE5hbWU6IHN0cmluZywgbWV0aG9kRGVzY3JpcHRpb246IHN0cmluZykge1xuICAgIGlmICh0aGlzLl9pbnN0YW50aWF0ZWQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICBgQ2Fubm90ICR7bWV0aG9kRGVzY3JpcHRpb259IHdoZW4gdGhlIHRlc3QgbW9kdWxlIGhhcyBhbHJlYWR5IGJlZW4gaW5zdGFudGlhdGVkLiBgICtcbiAgICAgICAgICBgTWFrZSBzdXJlIHlvdSBhcmUgbm90IHVzaW5nIFxcYGluamVjdFxcYCBiZWZvcmUgXFxgJHttZXRob2ROYW1lfVxcYC5gKTtcbiAgICB9XG4gIH1cblxuICBnZXQ8VD4odG9rZW46IFR5cGU8VD58SW5qZWN0aW9uVG9rZW48VD4sIG5vdEZvdW5kVmFsdWU/OiBULCBmbGFncz86IEluamVjdEZsYWdzKTogYW55O1xuICAvKipcbiAgICogQGRlcHJlY2F0ZWQgZnJvbSB2OC4wLjAgdXNlIFR5cGU8VD4gb3IgSW5qZWN0aW9uVG9rZW48VD5cbiAgICovXG4gIGdldCh0b2tlbjogYW55LCBub3RGb3VuZFZhbHVlPzogYW55KTogYW55O1xuICBnZXQodG9rZW46IGFueSwgbm90Rm91bmRWYWx1ZTogYW55ID0gSW5qZWN0b3IuVEhST1dfSUZfTk9UX0ZPVU5ELFxuICAgICAgZmxhZ3M6IEluamVjdEZsYWdzID0gSW5qZWN0RmxhZ3MuRGVmYXVsdCk6IGFueSB7XG4gICAgdGhpcy5faW5pdElmTmVlZGVkKCk7XG4gICAgaWYgKHRva2VuID09PSBUZXN0QmVkKSB7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgLy8gVGVzdHMgY2FuIGluamVjdCB0aGluZ3MgZnJvbSB0aGUgbmcgbW9kdWxlIGFuZCBmcm9tIHRoZSBjb21waWxlcixcbiAgICAvLyBidXQgdGhlIG5nIG1vZHVsZSBjYW4ndCBpbmplY3QgdGhpbmdzIGZyb20gdGhlIGNvbXBpbGVyIGFuZCB2aWNlIHZlcnNhLlxuICAgIGNvbnN0IHJlc3VsdCA9IHRoaXMuX21vZHVsZVJlZi5pbmplY3Rvci5nZXQodG9rZW4sIFVOREVGSU5FRCwgZmxhZ3MpO1xuICAgIHJldHVybiByZXN1bHQgPT09IFVOREVGSU5FRCA/IHRoaXMuX2NvbXBpbGVyLmluamVjdG9yLmdldCh0b2tlbiwgbm90Rm91bmRWYWx1ZSwgZmxhZ3MpIDogcmVzdWx0O1xuICB9XG5cbiAgZXhlY3V0ZSh0b2tlbnM6IGFueVtdLCBmbjogRnVuY3Rpb24sIGNvbnRleHQ/OiBhbnkpOiBhbnkge1xuICAgIHRoaXMuX2luaXRJZk5lZWRlZCgpO1xuICAgIGNvbnN0IHBhcmFtcyA9IHRva2Vucy5tYXAodCA9PiB0aGlzLmdldCh0KSk7XG4gICAgcmV0dXJuIGZuLmFwcGx5KGNvbnRleHQsIHBhcmFtcyk7XG4gIH1cblxuICBvdmVycmlkZU1vZHVsZShuZ01vZHVsZTogVHlwZTxhbnk+LCBvdmVycmlkZTogTWV0YWRhdGFPdmVycmlkZTxOZ01vZHVsZT4pOiB2b2lkIHtcbiAgICB0aGlzLl9hc3NlcnROb3RJbnN0YW50aWF0ZWQoJ292ZXJyaWRlTW9kdWxlJywgJ292ZXJyaWRlIG1vZHVsZSBtZXRhZGF0YScpO1xuICAgIHRoaXMuX21vZHVsZU92ZXJyaWRlcy5wdXNoKFtuZ01vZHVsZSwgb3ZlcnJpZGVdKTtcbiAgfVxuXG4gIG92ZXJyaWRlQ29tcG9uZW50KGNvbXBvbmVudDogVHlwZTxhbnk+LCBvdmVycmlkZTogTWV0YWRhdGFPdmVycmlkZTxDb21wb25lbnQ+KTogdm9pZCB7XG4gICAgdGhpcy5fYXNzZXJ0Tm90SW5zdGFudGlhdGVkKCdvdmVycmlkZUNvbXBvbmVudCcsICdvdmVycmlkZSBjb21wb25lbnQgbWV0YWRhdGEnKTtcbiAgICB0aGlzLl9jb21wb25lbnRPdmVycmlkZXMucHVzaChbY29tcG9uZW50LCBvdmVycmlkZV0pO1xuICB9XG5cbiAgb3ZlcnJpZGVEaXJlY3RpdmUoZGlyZWN0aXZlOiBUeXBlPGFueT4sIG92ZXJyaWRlOiBNZXRhZGF0YU92ZXJyaWRlPERpcmVjdGl2ZT4pOiB2b2lkIHtcbiAgICB0aGlzLl9hc3NlcnROb3RJbnN0YW50aWF0ZWQoJ292ZXJyaWRlRGlyZWN0aXZlJywgJ292ZXJyaWRlIGRpcmVjdGl2ZSBtZXRhZGF0YScpO1xuICAgIHRoaXMuX2RpcmVjdGl2ZU92ZXJyaWRlcy5wdXNoKFtkaXJlY3RpdmUsIG92ZXJyaWRlXSk7XG4gIH1cblxuICBvdmVycmlkZVBpcGUocGlwZTogVHlwZTxhbnk+LCBvdmVycmlkZTogTWV0YWRhdGFPdmVycmlkZTxQaXBlPik6IHZvaWQge1xuICAgIHRoaXMuX2Fzc2VydE5vdEluc3RhbnRpYXRlZCgnb3ZlcnJpZGVQaXBlJywgJ292ZXJyaWRlIHBpcGUgbWV0YWRhdGEnKTtcbiAgICB0aGlzLl9waXBlT3ZlcnJpZGVzLnB1c2goW3BpcGUsIG92ZXJyaWRlXSk7XG4gIH1cblxuICAvKipcbiAgICogT3ZlcndyaXRlcyBhbGwgcHJvdmlkZXJzIGZvciB0aGUgZ2l2ZW4gdG9rZW4gd2l0aCB0aGUgZ2l2ZW4gcHJvdmlkZXIgZGVmaW5pdGlvbi5cbiAgICovXG4gIG92ZXJyaWRlUHJvdmlkZXIodG9rZW46IGFueSwgcHJvdmlkZXI6IHtcbiAgICB1c2VGYWN0b3J5OiBGdW5jdGlvbixcbiAgICBkZXBzOiBhbnlbXSxcbiAgfSk6IHZvaWQ7XG4gIG92ZXJyaWRlUHJvdmlkZXIodG9rZW46IGFueSwgcHJvdmlkZXI6IHt1c2VWYWx1ZTogYW55O30pOiB2b2lkO1xuICBvdmVycmlkZVByb3ZpZGVyKHRva2VuOiBhbnksIHByb3ZpZGVyOiB7dXNlRmFjdG9yeT86IEZ1bmN0aW9uLCB1c2VWYWx1ZT86IGFueSwgZGVwcz86IGFueVtdfSk6XG4gICAgICB2b2lkIHtcbiAgICB0aGlzLm92ZXJyaWRlUHJvdmlkZXJJbXBsKHRva2VuLCBwcm92aWRlcik7XG4gIH1cblxuICAvKipcbiAgICogT3ZlcndyaXRlcyBhbGwgcHJvdmlkZXJzIGZvciB0aGUgZ2l2ZW4gdG9rZW4gd2l0aCB0aGUgZ2l2ZW4gcHJvdmlkZXIgZGVmaW5pdGlvbi5cbiAgICpcbiAgICogQGRlcHJlY2F0ZWQgYXMgaXQgbWFrZXMgYWxsIE5nTW9kdWxlcyBsYXp5LiBJbnRyb2R1Y2VkIG9ubHkgZm9yIG1pZ3JhdGluZyBvZmYgb2YgaXQuXG4gICAqL1xuICBkZXByZWNhdGVkT3ZlcnJpZGVQcm92aWRlcih0b2tlbjogYW55LCBwcm92aWRlcjoge1xuICAgIHVzZUZhY3Rvcnk6IEZ1bmN0aW9uLFxuICAgIGRlcHM6IGFueVtdLFxuICB9KTogdm9pZDtcbiAgZGVwcmVjYXRlZE92ZXJyaWRlUHJvdmlkZXIodG9rZW46IGFueSwgcHJvdmlkZXI6IHt1c2VWYWx1ZTogYW55O30pOiB2b2lkO1xuICBkZXByZWNhdGVkT3ZlcnJpZGVQcm92aWRlcihcbiAgICAgIHRva2VuOiBhbnksIHByb3ZpZGVyOiB7dXNlRmFjdG9yeT86IEZ1bmN0aW9uLCB1c2VWYWx1ZT86IGFueSwgZGVwcz86IGFueVtdfSk6IHZvaWQge1xuICAgIHRoaXMub3ZlcnJpZGVQcm92aWRlckltcGwodG9rZW4sIHByb3ZpZGVyLCAvKiBkZXByZWNhdGVkICovIHRydWUpO1xuICB9XG5cbiAgcHJpdmF0ZSBvdmVycmlkZVByb3ZpZGVySW1wbChcbiAgICAgIHRva2VuOiBhbnksIHByb3ZpZGVyOiB7XG4gICAgICAgIHVzZUZhY3Rvcnk/OiBGdW5jdGlvbixcbiAgICAgICAgdXNlVmFsdWU/OiBhbnksXG4gICAgICAgIGRlcHM/OiBhbnlbXSxcbiAgICAgIH0sXG4gICAgICBkZXByZWNhdGVkID0gZmFsc2UpOiB2b2lkIHtcbiAgICBsZXQgZGVmOiDOlEluamVjdGFibGVEZWY8YW55PnxudWxsID0gbnVsbDtcbiAgICBpZiAodHlwZW9mIHRva2VuICE9PSAnc3RyaW5nJyAmJiAoZGVmID0gZ2V0SW5qZWN0YWJsZURlZih0b2tlbikpICYmIGRlZi5wcm92aWRlZEluID09PSAncm9vdCcpIHtcbiAgICAgIGlmIChwcm92aWRlci51c2VGYWN0b3J5KSB7XG4gICAgICAgIHRoaXMuX3Jvb3RQcm92aWRlck92ZXJyaWRlcy5wdXNoKFxuICAgICAgICAgICAge3Byb3ZpZGU6IHRva2VuLCB1c2VGYWN0b3J5OiBwcm92aWRlci51c2VGYWN0b3J5LCBkZXBzOiBwcm92aWRlci5kZXBzIHx8IFtdfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLl9yb290UHJvdmlkZXJPdmVycmlkZXMucHVzaCh7cHJvdmlkZTogdG9rZW4sIHVzZVZhbHVlOiBwcm92aWRlci51c2VWYWx1ZX0pO1xuICAgICAgfVxuICAgIH1cbiAgICBsZXQgZmxhZ3M6IE5vZGVGbGFncyA9IDA7XG4gICAgbGV0IHZhbHVlOiBhbnk7XG4gICAgaWYgKHByb3ZpZGVyLnVzZUZhY3RvcnkpIHtcbiAgICAgIGZsYWdzIHw9IE5vZGVGbGFncy5UeXBlRmFjdG9yeVByb3ZpZGVyO1xuICAgICAgdmFsdWUgPSBwcm92aWRlci51c2VGYWN0b3J5O1xuICAgIH0gZWxzZSB7XG4gICAgICBmbGFncyB8PSBOb2RlRmxhZ3MuVHlwZVZhbHVlUHJvdmlkZXI7XG4gICAgICB2YWx1ZSA9IHByb3ZpZGVyLnVzZVZhbHVlO1xuICAgIH1cbiAgICBjb25zdCBkZXBzID0gKHByb3ZpZGVyLmRlcHMgfHwgW10pLm1hcCgoZGVwKSA9PiB7XG4gICAgICBsZXQgZGVwRmxhZ3M6IERlcEZsYWdzID0gRGVwRmxhZ3MuTm9uZTtcbiAgICAgIGxldCBkZXBUb2tlbjogYW55O1xuICAgICAgaWYgKEFycmF5LmlzQXJyYXkoZGVwKSkge1xuICAgICAgICBkZXAuZm9yRWFjaCgoZW50cnk6IGFueSkgPT4ge1xuICAgICAgICAgIGlmIChlbnRyeSBpbnN0YW5jZW9mIE9wdGlvbmFsKSB7XG4gICAgICAgICAgICBkZXBGbGFncyB8PSBEZXBGbGFncy5PcHRpb25hbDtcbiAgICAgICAgICB9IGVsc2UgaWYgKGVudHJ5IGluc3RhbmNlb2YgU2tpcFNlbGYpIHtcbiAgICAgICAgICAgIGRlcEZsYWdzIHw9IERlcEZsYWdzLlNraXBTZWxmO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBkZXBUb2tlbiA9IGVudHJ5O1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBkZXBUb2tlbiA9IGRlcDtcbiAgICAgIH1cbiAgICAgIHJldHVybiBbZGVwRmxhZ3MsIGRlcFRva2VuXTtcbiAgICB9KTtcbiAgICBvdmVycmlkZVByb3ZpZGVyKHt0b2tlbiwgZmxhZ3MsIGRlcHMsIHZhbHVlLCBkZXByZWNhdGVkQmVoYXZpb3I6IGRlcHJlY2F0ZWR9KTtcbiAgfVxuXG4gIG92ZXJyaWRlVGVtcGxhdGVVc2luZ1Rlc3RpbmdNb2R1bGUoY29tcG9uZW50OiBUeXBlPGFueT4sIHRlbXBsYXRlOiBzdHJpbmcpIHtcbiAgICB0aGlzLl9hc3NlcnROb3RJbnN0YW50aWF0ZWQoJ292ZXJyaWRlVGVtcGxhdGVVc2luZ1Rlc3RpbmdNb2R1bGUnLCAnb3ZlcnJpZGUgdGVtcGxhdGUnKTtcblxuICAgIEBDb21wb25lbnQoe3NlbGVjdG9yOiAnZW1wdHknLCB0ZW1wbGF0ZSwgaml0OiB0cnVlfSlcbiAgICBjbGFzcyBPdmVycmlkZUNvbXBvbmVudCB7XG4gICAgfVxuXG4gICAgdGhpcy5fdGVtcGxhdGVPdmVycmlkZXMucHVzaCh7Y29tcG9uZW50LCB0ZW1wbGF0ZU9mOiBPdmVycmlkZUNvbXBvbmVudH0pO1xuICB9XG5cbiAgY3JlYXRlQ29tcG9uZW50PFQ+KGNvbXBvbmVudDogVHlwZTxUPik6IENvbXBvbmVudEZpeHR1cmU8VD4ge1xuICAgIHRoaXMuX2luaXRJZk5lZWRlZCgpO1xuICAgIGNvbnN0IGNvbXBvbmVudEZhY3RvcnkgPSB0aGlzLl9jb21waWxlci5nZXRDb21wb25lbnRGYWN0b3J5KGNvbXBvbmVudCk7XG5cbiAgICBpZiAoIWNvbXBvbmVudEZhY3RvcnkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICBgQ2Fubm90IGNyZWF0ZSB0aGUgY29tcG9uZW50ICR7c3RyaW5naWZ5KGNvbXBvbmVudCl9IGFzIGl0IHdhcyBub3QgaW1wb3J0ZWQgaW50byB0aGUgdGVzdGluZyBtb2R1bGUhYCk7XG4gICAgfVxuXG4gICAgLy8gVE9ETzogRG9uJ3QgY2FzdCBhcyBgYW55YCwgcHJvcGVyIHR5cGUgaXMgYm9vbGVhbltdXG4gICAgY29uc3Qgbm9OZ1pvbmUgPSB0aGlzLmdldChDb21wb25lbnRGaXh0dXJlTm9OZ1pvbmUgYXMgYW55LCBmYWxzZSk7XG4gICAgLy8gVE9ETzogRG9uJ3QgY2FzdCBhcyBgYW55YCwgcHJvcGVyIHR5cGUgaXMgYm9vbGVhbltdXG4gICAgY29uc3QgYXV0b0RldGVjdDogYm9vbGVhbiA9IHRoaXMuZ2V0KENvbXBvbmVudEZpeHR1cmVBdXRvRGV0ZWN0IGFzIGFueSwgZmFsc2UpO1xuICAgIGNvbnN0IG5nWm9uZTogTmdab25lfG51bGwgPSBub05nWm9uZSA/IG51bGwgOiB0aGlzLmdldChOZ1pvbmUgYXMgVHlwZTxOZ1pvbmV8bnVsbD4sIG51bGwpO1xuICAgIGNvbnN0IHRlc3RDb21wb25lbnRSZW5kZXJlcjogVGVzdENvbXBvbmVudFJlbmRlcmVyID0gdGhpcy5nZXQoVGVzdENvbXBvbmVudFJlbmRlcmVyKTtcbiAgICBjb25zdCByb290RWxJZCA9IGByb290JHtfbmV4dFJvb3RFbGVtZW50SWQrK31gO1xuICAgIHRlc3RDb21wb25lbnRSZW5kZXJlci5pbnNlcnRSb290RWxlbWVudChyb290RWxJZCk7XG5cbiAgICBjb25zdCBpbml0Q29tcG9uZW50ID0gKCkgPT4ge1xuICAgICAgY29uc3QgY29tcG9uZW50UmVmID1cbiAgICAgICAgICBjb21wb25lbnRGYWN0b3J5LmNyZWF0ZShJbmplY3Rvci5OVUxMLCBbXSwgYCMke3Jvb3RFbElkfWAsIHRoaXMuX21vZHVsZVJlZik7XG4gICAgICByZXR1cm4gbmV3IENvbXBvbmVudEZpeHR1cmU8VD4oY29tcG9uZW50UmVmLCBuZ1pvbmUsIGF1dG9EZXRlY3QpO1xuICAgIH07XG5cbiAgICBjb25zdCBmaXh0dXJlID0gIW5nWm9uZSA/IGluaXRDb21wb25lbnQoKSA6IG5nWm9uZS5ydW4oaW5pdENvbXBvbmVudCk7XG4gICAgdGhpcy5fYWN0aXZlRml4dHVyZXMucHVzaChmaXh0dXJlKTtcbiAgICByZXR1cm4gZml4dHVyZTtcbiAgfVxufVxuXG4vKipcbiAqIEBkZXNjcmlwdGlvblxuICogQ29uZmlndXJlcyBhbmQgaW5pdGlhbGl6ZXMgZW52aXJvbm1lbnQgZm9yIHVuaXQgdGVzdGluZyBhbmQgcHJvdmlkZXMgbWV0aG9kcyBmb3JcbiAqIGNyZWF0aW5nIGNvbXBvbmVudHMgYW5kIHNlcnZpY2VzIGluIHVuaXQgdGVzdHMuXG4gKlxuICogYFRlc3RCZWRgIGlzIHRoZSBwcmltYXJ5IGFwaSBmb3Igd3JpdGluZyB1bml0IHRlc3RzIGZvciBBbmd1bGFyIGFwcGxpY2F0aW9ucyBhbmQgbGlicmFyaWVzLlxuICpcbiAqIE5vdGU6IFVzZSBgVGVzdEJlZGAgaW4gdGVzdHMuIEl0IHdpbGwgYmUgc2V0IHRvIGVpdGhlciBgVGVzdEJlZFZpZXdFbmdpbmVgIG9yIGBUZXN0QmVkUmVuZGVyM2BcbiAqIGFjY29yZGluZyB0byB0aGUgY29tcGlsZXIgdXNlZC5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBjb25zdCBUZXN0QmVkOiBUZXN0QmVkU3RhdGljID1cbiAgICBpdnlFbmFibGVkID8gVGVzdEJlZFJlbmRlcjMgYXMgYW55IGFzIFRlc3RCZWRTdGF0aWMgOiBUZXN0QmVkVmlld0VuZ2luZSBhcyBhbnkgYXMgVGVzdEJlZFN0YXRpYztcblxuLyoqXG4gKiBSZXR1cm5zIGEgc2luZ2xldG9uIG9mIHRoZSBhcHBsaWNhYmxlIGBUZXN0QmVkYC5cbiAqXG4gKiBJdCB3aWxsIGJlIGVpdGhlciBhbiBpbnN0YW5jZSBvZiBgVGVzdEJlZFZpZXdFbmdpbmVgIG9yIGBUZXN0QmVkUmVuZGVyM2AuXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgY29uc3QgZ2V0VGVzdEJlZDogKCkgPT4gVGVzdEJlZCA9IGl2eUVuYWJsZWQgPyBfZ2V0VGVzdEJlZFJlbmRlcjMgOiBfZ2V0VGVzdEJlZFZpZXdFbmdpbmU7XG5cbmxldCB0ZXN0QmVkOiBUZXN0QmVkVmlld0VuZ2luZTtcblxuZnVuY3Rpb24gX2dldFRlc3RCZWRWaWV3RW5naW5lKCk6IFRlc3RCZWRWaWV3RW5naW5lIHtcbiAgcmV0dXJuIHRlc3RCZWQgPSB0ZXN0QmVkIHx8IG5ldyBUZXN0QmVkVmlld0VuZ2luZSgpO1xufVxuXG4vKipcbiAqIEFsbG93cyBpbmplY3RpbmcgZGVwZW5kZW5jaWVzIGluIGBiZWZvcmVFYWNoKClgIGFuZCBgaXQoKWAuXG4gKlxuICogRXhhbXBsZTpcbiAqXG4gKiBgYGBcbiAqIGJlZm9yZUVhY2goaW5qZWN0KFtEZXBlbmRlbmN5LCBBQ2xhc3NdLCAoZGVwLCBvYmplY3QpID0+IHtcbiAqICAgLy8gc29tZSBjb2RlIHRoYXQgdXNlcyBgZGVwYCBhbmQgYG9iamVjdGBcbiAqICAgLy8gLi4uXG4gKiB9KSk7XG4gKlxuICogaXQoJy4uLicsIGluamVjdChbQUNsYXNzXSwgKG9iamVjdCkgPT4ge1xuICogICBvYmplY3QuZG9Tb21ldGhpbmcoKTtcbiAqICAgZXhwZWN0KC4uLik7XG4gKiB9KVxuICogYGBgXG4gKlxuICogTm90ZXM6XG4gKiAtIGluamVjdCBpcyBjdXJyZW50bHkgYSBmdW5jdGlvbiBiZWNhdXNlIG9mIHNvbWUgVHJhY2V1ciBsaW1pdGF0aW9uIHRoZSBzeW50YXggc2hvdWxkXG4gKiBldmVudHVhbGx5XG4gKiAgIGJlY29tZXMgYGl0KCcuLi4nLCBASW5qZWN0IChvYmplY3Q6IEFDbGFzcywgYXN5bmM6IEFzeW5jVGVzdENvbXBsZXRlcikgPT4geyAuLi4gfSk7YFxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGluamVjdCh0b2tlbnM6IGFueVtdLCBmbjogRnVuY3Rpb24pOiAoKSA9PiBhbnkge1xuICBjb25zdCB0ZXN0QmVkID0gZ2V0VGVzdEJlZCgpO1xuICBpZiAodG9rZW5zLmluZGV4T2YoQXN5bmNUZXN0Q29tcGxldGVyKSA+PSAwKSB7XG4gICAgLy8gTm90IHVzaW5nIGFuIGFycm93IGZ1bmN0aW9uIHRvIHByZXNlcnZlIGNvbnRleHQgcGFzc2VkIGZyb20gY2FsbCBzaXRlXG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgLy8gUmV0dXJuIGFuIGFzeW5jIHRlc3QgbWV0aG9kIHRoYXQgcmV0dXJucyBhIFByb21pc2UgaWYgQXN5bmNUZXN0Q29tcGxldGVyIGlzIG9uZSBvZlxuICAgICAgLy8gdGhlIGluamVjdGVkIHRva2Vucy5cbiAgICAgIHJldHVybiB0ZXN0QmVkLmNvbXBpbGVDb21wb25lbnRzKCkudGhlbigoKSA9PiB7XG4gICAgICAgIGNvbnN0IGNvbXBsZXRlcjogQXN5bmNUZXN0Q29tcGxldGVyID0gdGVzdEJlZC5nZXQoQXN5bmNUZXN0Q29tcGxldGVyKTtcbiAgICAgICAgdGVzdEJlZC5leGVjdXRlKHRva2VucywgZm4sIHRoaXMpO1xuICAgICAgICByZXR1cm4gY29tcGxldGVyLnByb21pc2U7XG4gICAgICB9KTtcbiAgICB9O1xuICB9IGVsc2Uge1xuICAgIC8vIE5vdCB1c2luZyBhbiBhcnJvdyBmdW5jdGlvbiB0byBwcmVzZXJ2ZSBjb250ZXh0IHBhc3NlZCBmcm9tIGNhbGwgc2l0ZVxuICAgIHJldHVybiBmdW5jdGlvbigpIHsgcmV0dXJuIHRlc3RCZWQuZXhlY3V0ZSh0b2tlbnMsIGZuLCB0aGlzKTsgfTtcbiAgfVxufVxuXG4vKipcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGNsYXNzIEluamVjdFNldHVwV3JhcHBlciB7XG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgX21vZHVsZURlZjogKCkgPT4gVGVzdE1vZHVsZU1ldGFkYXRhKSB7fVxuXG4gIHByaXZhdGUgX2FkZE1vZHVsZSgpIHtcbiAgICBjb25zdCBtb2R1bGVEZWYgPSB0aGlzLl9tb2R1bGVEZWYoKTtcbiAgICBpZiAobW9kdWxlRGVmKSB7XG4gICAgICBnZXRUZXN0QmVkKCkuY29uZmlndXJlVGVzdGluZ01vZHVsZShtb2R1bGVEZWYpO1xuICAgIH1cbiAgfVxuXG4gIGluamVjdCh0b2tlbnM6IGFueVtdLCBmbjogRnVuY3Rpb24pOiAoKSA9PiBhbnkge1xuICAgIGNvbnN0IHNlbGYgPSB0aGlzO1xuICAgIC8vIE5vdCB1c2luZyBhbiBhcnJvdyBmdW5jdGlvbiB0byBwcmVzZXJ2ZSBjb250ZXh0IHBhc3NlZCBmcm9tIGNhbGwgc2l0ZVxuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgIHNlbGYuX2FkZE1vZHVsZSgpO1xuICAgICAgcmV0dXJuIGluamVjdCh0b2tlbnMsIGZuKS5jYWxsKHRoaXMpO1xuICAgIH07XG4gIH1cbn1cblxuLyoqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB3aXRoTW9kdWxlKG1vZHVsZURlZjogVGVzdE1vZHVsZU1ldGFkYXRhKTogSW5qZWN0U2V0dXBXcmFwcGVyO1xuZXhwb3J0IGZ1bmN0aW9uIHdpdGhNb2R1bGUobW9kdWxlRGVmOiBUZXN0TW9kdWxlTWV0YWRhdGEsIGZuOiBGdW5jdGlvbik6ICgpID0+IGFueTtcbmV4cG9ydCBmdW5jdGlvbiB3aXRoTW9kdWxlKG1vZHVsZURlZjogVGVzdE1vZHVsZU1ldGFkYXRhLCBmbj86IEZ1bmN0aW9uIHwgbnVsbCk6ICgoKSA9PiBhbnkpfFxuICAgIEluamVjdFNldHVwV3JhcHBlciB7XG4gIGlmIChmbikge1xuICAgIC8vIE5vdCB1c2luZyBhbiBhcnJvdyBmdW5jdGlvbiB0byBwcmVzZXJ2ZSBjb250ZXh0IHBhc3NlZCBmcm9tIGNhbGwgc2l0ZVxuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgIGNvbnN0IHRlc3RCZWQgPSBnZXRUZXN0QmVkKCk7XG4gICAgICBpZiAobW9kdWxlRGVmKSB7XG4gICAgICAgIHRlc3RCZWQuY29uZmlndXJlVGVzdGluZ01vZHVsZShtb2R1bGVEZWYpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGZuLmFwcGx5KHRoaXMpO1xuICAgIH07XG4gIH1cbiAgcmV0dXJuIG5ldyBJbmplY3RTZXR1cFdyYXBwZXIoKCkgPT4gbW9kdWxlRGVmKTtcbn1cbiJdfQ==