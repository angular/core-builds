/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ApplicationInitStatus, Component, Injector, NgModule, NgZone, Optional, SkipSelf, ɵAPP_ROOT as APP_ROOT, ɵclearOverrides as clearOverrides, ɵivyEnabled as ivyEnabled, ɵoverrideComponentView as overrideComponentView, ɵoverrideProvider as overrideProvider, ɵstringify as stringify } from '@angular/core';
import { AsyncTestCompleter } from './async_test_completer';
import { ComponentFixture } from './component_fixture';
import { TestBedRender3, _getTestBedRender3 } from './r3_test_bed';
import { ComponentFixtureAutoDetect, ComponentFixtureNoNgZone, TestComponentRenderer } from './test_bed_common';
import { TestingCompilerFactory } from './test_compiler';
/** @type {?} */
const UNDEFINED = new Object();
/** @type {?} */
let _nextRootElementId = 0;
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
        this._compiler = /** @type {?} */ ((null));
        this._moduleRef = /** @type {?} */ ((null));
        this._moduleFactory = /** @type {?} */ ((null));
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
        this._testEnvAotSummaries = () => [];
        this._aotSummaries = [];
        this._templateOverrides = [];
        this._isRoot = true;
        this._rootProviderOverrides = [];
        this.platform = /** @type {?} */ ((null));
        this.ngModule = /** @type {?} */ ((null));
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
     * \@experimental
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
     *
     * \@experimental
     * @return {?}
     */
    static resetTestEnvironment() { _getTestBedViewEngine().resetTestEnvironment(); }
    /**
     * @return {?}
     */
    static resetTestingModule() {
        _getTestBedViewEngine().resetTestingModule();
        return TestBed;
    }
    /**
     * Allows overriding default compiler providers and settings
     * which are defined in test_injector.js
     * @param {?} config
     * @return {?}
     */
    static configureCompiler(config) {
        _getTestBedViewEngine().configureCompiler(config);
        return TestBed;
    }
    /**
     * Allows overriding default providers, directives, pipes, modules of the test injector,
     * which are defined in test_injector.js
     * @param {?} moduleDef
     * @return {?}
     */
    static configureTestingModule(moduleDef) {
        _getTestBedViewEngine().configureTestingModule(moduleDef);
        return TestBed;
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
        return TestBed;
    }
    /**
     * @param {?} component
     * @param {?} override
     * @return {?}
     */
    static overrideComponent(component, override) {
        _getTestBedViewEngine().overrideComponent(component, override);
        return TestBed;
    }
    /**
     * @param {?} directive
     * @param {?} override
     * @return {?}
     */
    static overrideDirective(directive, override) {
        _getTestBedViewEngine().overrideDirective(directive, override);
        return TestBed;
    }
    /**
     * @param {?} pipe
     * @param {?} override
     * @return {?}
     */
    static overridePipe(pipe, override) {
        _getTestBedViewEngine().overridePipe(pipe, override);
        return TestBed;
    }
    /**
     * @param {?} component
     * @param {?} template
     * @return {?}
     */
    static overrideTemplate(component, template) {
        _getTestBedViewEngine().overrideComponent(component, { set: { template, templateUrl: /** @type {?} */ ((null)) } });
        return TestBed;
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
        return TestBed;
    }
    /**
     * @param {?} token
     * @param {?} provider
     * @return {?}
     */
    static overrideProvider(token, provider) {
        _getTestBedViewEngine().overrideProvider(token, /** @type {?} */ (provider));
        return TestBed;
    }
    /**
     * @param {?} token
     * @param {?} provider
     * @return {?}
     */
    static deprecatedOverrideProvider(token, provider) {
        _getTestBedViewEngine().deprecatedOverrideProvider(token, /** @type {?} */ (provider));
        return TestBed;
    }
    /**
     * @param {?} token
     * @param {?=} notFoundValue
     * @return {?}
     */
    static get(token, notFoundValue = Injector.THROW_IF_NOT_FOUND) {
        return _getTestBedViewEngine().get(token, notFoundValue);
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
     *
     * \@experimental
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
     *
     * \@experimental
     * @return {?}
     */
    resetTestEnvironment() {
        this.resetTestingModule();
        this.platform = /** @type {?} */ ((null));
        this.ngModule = /** @type {?} */ ((null));
        this._testEnvAotSummaries = () => [];
    }
    /**
     * @return {?}
     */
    resetTestingModule() {
        clearOverrides();
        this._aotSummaries = [];
        this._templateOverrides = [];
        this._compiler = /** @type {?} */ ((null));
        this._moduleOverrides = [];
        this._componentOverrides = [];
        this._directiveOverrides = [];
        this._pipeOverrides = [];
        this._isRoot = true;
        this._rootProviderOverrides = [];
        this._moduleRef = /** @type {?} */ ((null));
        this._moduleFactory = /** @type {?} */ ((null));
        this._compilerOptions = [];
        this._providers = [];
        this._declarations = [];
        this._imports = [];
        this._schemas = [];
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
            .then((moduleAndComponentFactories) => {
            this._moduleFactory = moduleAndComponentFactories.ngModuleFactory;
        });
    }
    /**
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
        (/** @type {?} */ (this._moduleRef.injector.get(ApplicationInitStatus))).runInitializers();
        this._instantiated = true;
    }
    /**
     * @return {?}
     */
    _createCompilerAndModule() {
        /** @type {?} */
        const providers = this._providers.concat([{ provide: TestBed, useValue: this }]);
        /** @type {?} */
        const declarations = [...this._declarations, ...this._templateOverrides.map(entry => entry.templateOf)];
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
        this._moduleOverrides.forEach((entry) => this._compiler.overrideModule(entry[0], entry[1]));
        this._componentOverrides.forEach((entry) => this._compiler.overrideComponent(entry[0], entry[1]));
        this._directiveOverrides.forEach((entry) => this._compiler.overrideDirective(entry[0], entry[1]));
        this._pipeOverrides.forEach((entry) => this._compiler.overridePipe(entry[0], entry[1]));
        return DynamicTestModule;
    }
    /**
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
     * @return {?}
     */
    get(token, notFoundValue = Injector.THROW_IF_NOT_FOUND) {
        this._initIfNeeded();
        if (token === TestBed) {
            return this;
        }
        /** @type {?} */
        const result = this._moduleRef.injector.get(token, UNDEFINED);
        return result === UNDEFINED ? this._compiler.injector.get(token, notFoundValue) : result;
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
        this.overrideProviderImpl(token, provider, /* deprecated */ /* deprecated */ true);
    }
    /**
     * @param {?} token
     * @param {?} provider
     * @param {?=} deprecated
     * @return {?}
     */
    overrideProviderImpl(token, provider, deprecated = false) {
        if (typeof token !== 'string' && token.ngInjectableDef &&
            token.ngInjectableDef.providedIn === 'root') {
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
        const deps = (provider.deps || []).map((dep) => {
            /** @type {?} */
            let depFlags = 0 /* None */;
            /** @type {?} */
            let depToken;
            if (Array.isArray(dep)) {
                dep.forEach((entry) => {
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
        /** @type {?} */
        const noNgZone = this.get(ComponentFixtureNoNgZone, false);
        /** @type {?} */
        const autoDetect = this.get(ComponentFixtureAutoDetect, false);
        /** @type {?} */
        const ngZone = noNgZone ? null : this.get(NgZone, null);
        /** @type {?} */
        const testComponentRenderer = this.get(TestComponentRenderer);
        /** @type {?} */
        const rootElId = `root${_nextRootElementId++}`;
        testComponentRenderer.insertRootElement(rootElId);
        /** @type {?} */
        const initComponent = () => {
            /** @type {?} */
            const componentRef = componentFactory.create(Injector.NULL, [], `#${rootElId}`, this._moduleRef);
            return new ComponentFixture(componentRef, ngZone, autoDetect);
        };
        /** @type {?} */
        const fixture = !ngZone ? initComponent() : ngZone.run(initComponent);
        this._activeFixtures.push(fixture);
        return fixture;
    }
}
if (false) {
    /** @type {?} */
    TestBedViewEngine.prototype._instantiated;
    /** @type {?} */
    TestBedViewEngine.prototype._compiler;
    /** @type {?} */
    TestBedViewEngine.prototype._moduleRef;
    /** @type {?} */
    TestBedViewEngine.prototype._moduleFactory;
    /** @type {?} */
    TestBedViewEngine.prototype._compilerOptions;
    /** @type {?} */
    TestBedViewEngine.prototype._moduleOverrides;
    /** @type {?} */
    TestBedViewEngine.prototype._componentOverrides;
    /** @type {?} */
    TestBedViewEngine.prototype._directiveOverrides;
    /** @type {?} */
    TestBedViewEngine.prototype._pipeOverrides;
    /** @type {?} */
    TestBedViewEngine.prototype._providers;
    /** @type {?} */
    TestBedViewEngine.prototype._declarations;
    /** @type {?} */
    TestBedViewEngine.prototype._imports;
    /** @type {?} */
    TestBedViewEngine.prototype._schemas;
    /** @type {?} */
    TestBedViewEngine.prototype._activeFixtures;
    /** @type {?} */
    TestBedViewEngine.prototype._testEnvAotSummaries;
    /** @type {?} */
    TestBedViewEngine.prototype._aotSummaries;
    /** @type {?} */
    TestBedViewEngine.prototype._templateOverrides;
    /** @type {?} */
    TestBedViewEngine.prototype._isRoot;
    /** @type {?} */
    TestBedViewEngine.prototype._rootProviderOverrides;
    /** @type {?} */
    TestBedViewEngine.prototype.platform;
    /** @type {?} */
    TestBedViewEngine.prototype.ngModule;
}
/** *
 * \@description
 * Configures and initializes environment for unit testing and provides methods for
 * creating components and services in unit tests.
 *
 * `TestBed` is the primary api for writing unit tests for Angular applications and libraries.
 *
 * Note: Use `TestBed` in tests. It will be set to either `TestBedViewEngine` or `TestBedRender3`
 * according to the compiler used.
  @type {?} */
export const TestBed = ivyEnabled ? TestBedRender3 : TestBedViewEngine;
/** *
 * Returns a singleton of the applicable `TestBed`.
 *
 * It will be either an instance of `TestBedViewEngine` or `TestBedRender3`.
 *
 * \@experimental
  @type {?} */
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
 *
 * @param {?} tokens
 * @param {?} fn
 * @return {?}
 */
export function inject(tokens, fn) {
    /** @type {?} */
    const testBed = getTestBed();
    if (tokens.indexOf(AsyncTestCompleter) >= 0) {
        // Not using an arrow function to preserve context passed from call site
        return function () {
            // Return an async test method that returns a Promise if AsyncTestCompleter is one of
            // the injected tokens.
            return testBed.compileComponents().then(() => {
                /** @type {?} */
                const completer = testBed.get(AsyncTestCompleter);
                testBed.execute(tokens, fn, this);
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
 * \@experimental
 */
export class InjectSetupWrapper {
    /**
     * @param {?} _moduleDef
     */
    constructor(_moduleDef) {
        this._moduleDef = _moduleDef;
    }
    /**
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
        return function () {
            self._addModule();
            return inject(tokens, fn).call(this);
        };
    }
}
if (false) {
    /** @type {?} */
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
        return function () {
            /** @type {?} */
            const testBed = getTestBed();
            if (moduleDef) {
                testBed.configureTestingModule(moduleDef);
            }
            return fn.apply(this);
        };
    }
    return new InjectSetupWrapper(() => moduleDef);
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdF9iZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3Rlc3Rpbmcvc3JjL3Rlc3RfYmVkLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBUUEsT0FBTyxFQUFDLHFCQUFxQixFQUFtQixTQUFTLEVBQWEsUUFBUSxFQUFFLFFBQVEsRUFBZ0MsTUFBTSxFQUFFLFFBQVEsRUFBK0MsUUFBUSxFQUF3QixTQUFTLElBQUksUUFBUSxFQUFrRCxlQUFlLElBQUksY0FBYyxFQUEyRSxXQUFXLElBQUksVUFBVSxFQUFFLHNCQUFzQixJQUFJLHFCQUFxQixFQUFFLGlCQUFpQixJQUFJLGdCQUFnQixFQUFFLFVBQVUsSUFBSSxTQUFTLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFFM2lCLE9BQU8sRUFBQyxrQkFBa0IsRUFBQyxNQUFNLHdCQUF3QixDQUFDO0FBQzFELE9BQU8sRUFBQyxnQkFBZ0IsRUFBQyxNQUFNLHFCQUFxQixDQUFDO0FBRXJELE9BQU8sRUFBQyxjQUFjLEVBQUUsa0JBQWtCLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFDakUsT0FBTyxFQUFDLDBCQUEwQixFQUFFLHdCQUF3QixFQUFFLHFCQUFxQixFQUFxQixNQUFNLG1CQUFtQixDQUFDO0FBQ2xJLE9BQU8sRUFBa0Isc0JBQXNCLEVBQUMsTUFBTSxpQkFBaUIsQ0FBQzs7QUFFeEUsTUFBTSxTQUFTLEdBQUcsSUFBSSxNQUFNLEVBQUUsQ0FBQzs7QUFHL0IsSUFBSSxrQkFBa0IsR0FBRyxDQUFDLENBQUM7Ozs7Ozs7Ozs7O0FBWTNCLE1BQU07OzZCQWdKNkIsS0FBSzs0Q0FFRCxJQUFJOzZDQUNGLElBQUk7aURBQ0ksSUFBSTtnQ0FFTCxFQUFFO2dDQUVzQixFQUFFO21DQUNFLEVBQUU7bUNBQ0YsRUFBRTs4QkFDWixFQUFFOzBCQUVqQyxFQUFFOzZCQUNpQixFQUFFO3dCQUNQLEVBQUU7d0JBQ0QsRUFBRTsr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QUFDLENBQUM7U0FDSixDQUFDO0tBQ0g7U0FBTTs7UUFFTCxPQUFPLGNBQWEsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxFQUFFLEVBQUUsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDO0tBQ2pFO0NBQ0Y7Ozs7QUFLRCxNQUFNOzs7O0lBQ0osWUFBb0IsVUFBb0M7UUFBcEMsZUFBVSxHQUFWLFVBQVUsQ0FBMEI7S0FBSTs7OztJQUVwRCxVQUFVOztRQUNoQixNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7UUFDcEMsSUFBSSxTQUFTLEVBQUU7WUFDYixVQUFVLEVBQUUsQ0FBQyxzQkFBc0IsQ0FBQyxTQUFTLENBQUMsQ0FBQztTQUNoRDs7Ozs7OztJQUdILE1BQU0sQ0FBQyxNQUFhLEVBQUUsRUFBWTs7UUFDaEMsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDOztRQUVsQixPQUFPO1lBQ0wsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO1lBQ2xCLE9BQU8sTUFBTSxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7U0FDdEMsQ0FBQztLQUNIO0NBQ0Y7Ozs7Ozs7Ozs7QUFPRCxNQUFNLHFCQUFxQixTQUE2QixFQUFFLEVBQW9CO0lBRTVFLElBQUksRUFBRSxFQUFFOztRQUVOLE9BQU87O1lBQ0wsTUFBTSxPQUFPLEdBQUcsVUFBVSxFQUFFLENBQUM7WUFDN0IsSUFBSSxTQUFTLEVBQUU7Z0JBQ2IsT0FBTyxDQUFDLHNCQUFzQixDQUFDLFNBQVMsQ0FBQyxDQUFDO2FBQzNDO1lBQ0QsT0FBTyxFQUFFLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO1NBQ3ZCLENBQUM7S0FDSDtJQUNELE9BQU8sSUFBSSxrQkFBa0IsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxTQUFTLENBQUMsQ0FBQztDQUNoRCIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtBcHBsaWNhdGlvbkluaXRTdGF0dXMsIENvbXBpbGVyT3B0aW9ucywgQ29tcG9uZW50LCBEaXJlY3RpdmUsIEluamVjdG9yLCBOZ01vZHVsZSwgTmdNb2R1bGVGYWN0b3J5LCBOZ01vZHVsZVJlZiwgTmdab25lLCBPcHRpb25hbCwgUGlwZSwgUGxhdGZvcm1SZWYsIFByb3ZpZGVyLCBTY2hlbWFNZXRhZGF0YSwgU2tpcFNlbGYsIFN0YXRpY1Byb3ZpZGVyLCBUeXBlLCDJtUFQUF9ST09UIGFzIEFQUF9ST09ULCDJtURlcEZsYWdzIGFzIERlcEZsYWdzLCDJtU5vZGVGbGFncyBhcyBOb2RlRmxhZ3MsIMm1Y2xlYXJPdmVycmlkZXMgYXMgY2xlYXJPdmVycmlkZXMsIMm1Z2V0Q29tcG9uZW50Vmlld0RlZmluaXRpb25GYWN0b3J5IGFzIGdldENvbXBvbmVudFZpZXdEZWZpbml0aW9uRmFjdG9yeSwgybVpdnlFbmFibGVkIGFzIGl2eUVuYWJsZWQsIMm1b3ZlcnJpZGVDb21wb25lbnRWaWV3IGFzIG92ZXJyaWRlQ29tcG9uZW50VmlldywgybVvdmVycmlkZVByb3ZpZGVyIGFzIG92ZXJyaWRlUHJvdmlkZXIsIMm1c3RyaW5naWZ5IGFzIHN0cmluZ2lmeX0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5cbmltcG9ydCB7QXN5bmNUZXN0Q29tcGxldGVyfSBmcm9tICcuL2FzeW5jX3Rlc3RfY29tcGxldGVyJztcbmltcG9ydCB7Q29tcG9uZW50Rml4dHVyZX0gZnJvbSAnLi9jb21wb25lbnRfZml4dHVyZSc7XG5pbXBvcnQge01ldGFkYXRhT3ZlcnJpZGV9IGZyb20gJy4vbWV0YWRhdGFfb3ZlcnJpZGUnO1xuaW1wb3J0IHtUZXN0QmVkUmVuZGVyMywgX2dldFRlc3RCZWRSZW5kZXIzfSBmcm9tICcuL3IzX3Rlc3RfYmVkJztcbmltcG9ydCB7Q29tcG9uZW50Rml4dHVyZUF1dG9EZXRlY3QsIENvbXBvbmVudEZpeHR1cmVOb05nWm9uZSwgVGVzdENvbXBvbmVudFJlbmRlcmVyLCBUZXN0TW9kdWxlTWV0YWRhdGF9IGZyb20gJy4vdGVzdF9iZWRfY29tbW9uJztcbmltcG9ydCB7VGVzdGluZ0NvbXBpbGVyLCBUZXN0aW5nQ29tcGlsZXJGYWN0b3J5fSBmcm9tICcuL3Rlc3RfY29tcGlsZXInO1xuXG5jb25zdCBVTkRFRklORUQgPSBuZXcgT2JqZWN0KCk7XG5cblxubGV0IF9uZXh0Um9vdEVsZW1lbnRJZCA9IDA7XG5cbi8qKlxuICogQGRlc2NyaXB0aW9uXG4gKiBDb25maWd1cmVzIGFuZCBpbml0aWFsaXplcyBlbnZpcm9ubWVudCBmb3IgdW5pdCB0ZXN0aW5nIGFuZCBwcm92aWRlcyBtZXRob2RzIGZvclxuICogY3JlYXRpbmcgY29tcG9uZW50cyBhbmQgc2VydmljZXMgaW4gdW5pdCB0ZXN0cy5cbiAqXG4gKiBgVGVzdEJlZGAgaXMgdGhlIHByaW1hcnkgYXBpIGZvciB3cml0aW5nIHVuaXQgdGVzdHMgZm9yIEFuZ3VsYXIgYXBwbGljYXRpb25zIGFuZCBsaWJyYXJpZXMuXG4gKlxuICogTm90ZTogVXNlIGBUZXN0QmVkYCBpbiB0ZXN0cy4gSXQgd2lsbCBiZSBzZXQgdG8gZWl0aGVyIGBUZXN0QmVkVmlld0VuZ2luZWAgb3IgYFRlc3RCZWRSZW5kZXIzYFxuICogYWNjb3JkaW5nIHRvIHRoZSBjb21waWxlciB1c2VkLlxuICovXG5leHBvcnQgY2xhc3MgVGVzdEJlZFZpZXdFbmdpbmUgaW1wbGVtZW50cyBJbmplY3RvciB7XG4gIC8qKlxuICAgKiBJbml0aWFsaXplIHRoZSBlbnZpcm9ubWVudCBmb3IgdGVzdGluZyB3aXRoIGEgY29tcGlsZXIgZmFjdG9yeSwgYSBQbGF0Zm9ybVJlZiwgYW5kIGFuXG4gICAqIGFuZ3VsYXIgbW9kdWxlLiBUaGVzZSBhcmUgY29tbW9uIHRvIGV2ZXJ5IHRlc3QgaW4gdGhlIHN1aXRlLlxuICAgKlxuICAgKiBUaGlzIG1heSBvbmx5IGJlIGNhbGxlZCBvbmNlLCB0byBzZXQgdXAgdGhlIGNvbW1vbiBwcm92aWRlcnMgZm9yIHRoZSBjdXJyZW50IHRlc3RcbiAgICogc3VpdGUgb24gdGhlIGN1cnJlbnQgcGxhdGZvcm0uIElmIHlvdSBhYnNvbHV0ZWx5IG5lZWQgdG8gY2hhbmdlIHRoZSBwcm92aWRlcnMsXG4gICAqIGZpcnN0IHVzZSBgcmVzZXRUZXN0RW52aXJvbm1lbnRgLlxuICAgKlxuICAgKiBUZXN0IG1vZHVsZXMgYW5kIHBsYXRmb3JtcyBmb3IgaW5kaXZpZHVhbCBwbGF0Zm9ybXMgYXJlIGF2YWlsYWJsZSBmcm9tXG4gICAqICdAYW5ndWxhci88cGxhdGZvcm1fbmFtZT4vdGVzdGluZycuXG4gICAqXG4gICAqIEBleHBlcmltZW50YWxcbiAgICovXG4gIHN0YXRpYyBpbml0VGVzdEVudmlyb25tZW50KFxuICAgICAgbmdNb2R1bGU6IFR5cGU8YW55PnxUeXBlPGFueT5bXSwgcGxhdGZvcm06IFBsYXRmb3JtUmVmLFxuICAgICAgYW90U3VtbWFyaWVzPzogKCkgPT4gYW55W10pOiBUZXN0QmVkVmlld0VuZ2luZSB7XG4gICAgY29uc3QgdGVzdEJlZCA9IF9nZXRUZXN0QmVkVmlld0VuZ2luZSgpO1xuICAgIHRlc3RCZWQuaW5pdFRlc3RFbnZpcm9ubWVudChuZ01vZHVsZSwgcGxhdGZvcm0sIGFvdFN1bW1hcmllcyk7XG4gICAgcmV0dXJuIHRlc3RCZWQ7XG4gIH1cblxuICAvKipcbiAgICogUmVzZXQgdGhlIHByb3ZpZGVycyBmb3IgdGhlIHRlc3QgaW5qZWN0b3IuXG4gICAqXG4gICAqIEBleHBlcmltZW50YWxcbiAgICovXG4gIHN0YXRpYyByZXNldFRlc3RFbnZpcm9ubWVudCgpOiB2b2lkIHsgX2dldFRlc3RCZWRWaWV3RW5naW5lKCkucmVzZXRUZXN0RW52aXJvbm1lbnQoKTsgfVxuXG4gIHN0YXRpYyByZXNldFRlc3RpbmdNb2R1bGUoKTogdHlwZW9mIFRlc3RCZWQge1xuICAgIF9nZXRUZXN0QmVkVmlld0VuZ2luZSgpLnJlc2V0VGVzdGluZ01vZHVsZSgpO1xuICAgIHJldHVybiBUZXN0QmVkO1xuICB9XG5cbiAgLyoqXG4gICAqIEFsbG93cyBvdmVycmlkaW5nIGRlZmF1bHQgY29tcGlsZXIgcHJvdmlkZXJzIGFuZCBzZXR0aW5nc1xuICAgKiB3aGljaCBhcmUgZGVmaW5lZCBpbiB0ZXN0X2luamVjdG9yLmpzXG4gICAqL1xuICBzdGF0aWMgY29uZmlndXJlQ29tcGlsZXIoY29uZmlnOiB7cHJvdmlkZXJzPzogYW55W107IHVzZUppdD86IGJvb2xlYW47fSk6IHR5cGVvZiBUZXN0QmVkIHtcbiAgICBfZ2V0VGVzdEJlZFZpZXdFbmdpbmUoKS5jb25maWd1cmVDb21waWxlcihjb25maWcpO1xuICAgIHJldHVybiBUZXN0QmVkO1xuICB9XG5cbiAgLyoqXG4gICAqIEFsbG93cyBvdmVycmlkaW5nIGRlZmF1bHQgcHJvdmlkZXJzLCBkaXJlY3RpdmVzLCBwaXBlcywgbW9kdWxlcyBvZiB0aGUgdGVzdCBpbmplY3RvcixcbiAgICogd2hpY2ggYXJlIGRlZmluZWQgaW4gdGVzdF9pbmplY3Rvci5qc1xuICAgKi9cbiAgc3RhdGljIGNvbmZpZ3VyZVRlc3RpbmdNb2R1bGUobW9kdWxlRGVmOiBUZXN0TW9kdWxlTWV0YWRhdGEpOiB0eXBlb2YgVGVzdEJlZCB7XG4gICAgX2dldFRlc3RCZWRWaWV3RW5naW5lKCkuY29uZmlndXJlVGVzdGluZ01vZHVsZShtb2R1bGVEZWYpO1xuICAgIHJldHVybiBUZXN0QmVkO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbXBpbGUgY29tcG9uZW50cyB3aXRoIGEgYHRlbXBsYXRlVXJsYCBmb3IgdGhlIHRlc3QncyBOZ01vZHVsZS5cbiAgICogSXQgaXMgbmVjZXNzYXJ5IHRvIGNhbGwgdGhpcyBmdW5jdGlvblxuICAgKiBhcyBmZXRjaGluZyB1cmxzIGlzIGFzeW5jaHJvbm91cy5cbiAgICovXG4gIHN0YXRpYyBjb21waWxlQ29tcG9uZW50cygpOiBQcm9taXNlPGFueT4geyByZXR1cm4gZ2V0VGVzdEJlZCgpLmNvbXBpbGVDb21wb25lbnRzKCk7IH1cblxuICBzdGF0aWMgb3ZlcnJpZGVNb2R1bGUobmdNb2R1bGU6IFR5cGU8YW55Piwgb3ZlcnJpZGU6IE1ldGFkYXRhT3ZlcnJpZGU8TmdNb2R1bGU+KTogdHlwZW9mIFRlc3RCZWQge1xuICAgIF9nZXRUZXN0QmVkVmlld0VuZ2luZSgpLm92ZXJyaWRlTW9kdWxlKG5nTW9kdWxlLCBvdmVycmlkZSk7XG4gICAgcmV0dXJuIFRlc3RCZWQ7XG4gIH1cblxuICBzdGF0aWMgb3ZlcnJpZGVDb21wb25lbnQoY29tcG9uZW50OiBUeXBlPGFueT4sIG92ZXJyaWRlOiBNZXRhZGF0YU92ZXJyaWRlPENvbXBvbmVudD4pOlxuICAgICAgdHlwZW9mIFRlc3RCZWQge1xuICAgIF9nZXRUZXN0QmVkVmlld0VuZ2luZSgpLm92ZXJyaWRlQ29tcG9uZW50KGNvbXBvbmVudCwgb3ZlcnJpZGUpO1xuICAgIHJldHVybiBUZXN0QmVkO1xuICB9XG5cbiAgc3RhdGljIG92ZXJyaWRlRGlyZWN0aXZlKGRpcmVjdGl2ZTogVHlwZTxhbnk+LCBvdmVycmlkZTogTWV0YWRhdGFPdmVycmlkZTxEaXJlY3RpdmU+KTpcbiAgICAgIHR5cGVvZiBUZXN0QmVkIHtcbiAgICBfZ2V0VGVzdEJlZFZpZXdFbmdpbmUoKS5vdmVycmlkZURpcmVjdGl2ZShkaXJlY3RpdmUsIG92ZXJyaWRlKTtcbiAgICByZXR1cm4gVGVzdEJlZDtcbiAgfVxuXG4gIHN0YXRpYyBvdmVycmlkZVBpcGUocGlwZTogVHlwZTxhbnk+LCBvdmVycmlkZTogTWV0YWRhdGFPdmVycmlkZTxQaXBlPik6IHR5cGVvZiBUZXN0QmVkIHtcbiAgICBfZ2V0VGVzdEJlZFZpZXdFbmdpbmUoKS5vdmVycmlkZVBpcGUocGlwZSwgb3ZlcnJpZGUpO1xuICAgIHJldHVybiBUZXN0QmVkO1xuICB9XG5cbiAgc3RhdGljIG92ZXJyaWRlVGVtcGxhdGUoY29tcG9uZW50OiBUeXBlPGFueT4sIHRlbXBsYXRlOiBzdHJpbmcpOiB0eXBlb2YgVGVzdEJlZCB7XG4gICAgX2dldFRlc3RCZWRWaWV3RW5naW5lKCkub3ZlcnJpZGVDb21wb25lbnQoY29tcG9uZW50LCB7c2V0OiB7dGVtcGxhdGUsIHRlbXBsYXRlVXJsOiBudWxsICF9fSk7XG4gICAgcmV0dXJuIFRlc3RCZWQ7XG4gIH1cblxuICAvKipcbiAgICogT3ZlcnJpZGVzIHRoZSB0ZW1wbGF0ZSBvZiB0aGUgZ2l2ZW4gY29tcG9uZW50LCBjb21waWxpbmcgdGhlIHRlbXBsYXRlXG4gICAqIGluIHRoZSBjb250ZXh0IG9mIHRoZSBUZXN0aW5nTW9kdWxlLlxuICAgKlxuICAgKiBOb3RlOiBUaGlzIHdvcmtzIGZvciBKSVQgYW5kIEFPVGVkIGNvbXBvbmVudHMgYXMgd2VsbC5cbiAgICovXG4gIHN0YXRpYyBvdmVycmlkZVRlbXBsYXRlVXNpbmdUZXN0aW5nTW9kdWxlKGNvbXBvbmVudDogVHlwZTxhbnk+LCB0ZW1wbGF0ZTogc3RyaW5nKTpcbiAgICAgIHR5cGVvZiBUZXN0QmVkIHtcbiAgICBfZ2V0VGVzdEJlZFZpZXdFbmdpbmUoKS5vdmVycmlkZVRlbXBsYXRlVXNpbmdUZXN0aW5nTW9kdWxlKGNvbXBvbmVudCwgdGVtcGxhdGUpO1xuICAgIHJldHVybiBUZXN0QmVkO1xuICB9XG5cbiAgLyoqXG4gICAqIE92ZXJ3cml0ZXMgYWxsIHByb3ZpZGVycyBmb3IgdGhlIGdpdmVuIHRva2VuIHdpdGggdGhlIGdpdmVuIHByb3ZpZGVyIGRlZmluaXRpb24uXG4gICAqXG4gICAqIE5vdGU6IFRoaXMgd29ya3MgZm9yIEpJVCBhbmQgQU9UZWQgY29tcG9uZW50cyBhcyB3ZWxsLlxuICAgKi9cbiAgc3RhdGljIG92ZXJyaWRlUHJvdmlkZXIodG9rZW46IGFueSwgcHJvdmlkZXI6IHtcbiAgICB1c2VGYWN0b3J5OiBGdW5jdGlvbixcbiAgICBkZXBzOiBhbnlbXSxcbiAgfSk6IHR5cGVvZiBUZXN0QmVkO1xuICBzdGF0aWMgb3ZlcnJpZGVQcm92aWRlcih0b2tlbjogYW55LCBwcm92aWRlcjoge3VzZVZhbHVlOiBhbnk7fSk6IHR5cGVvZiBUZXN0QmVkO1xuICBzdGF0aWMgb3ZlcnJpZGVQcm92aWRlcih0b2tlbjogYW55LCBwcm92aWRlcjoge1xuICAgIHVzZUZhY3Rvcnk/OiBGdW5jdGlvbixcbiAgICB1c2VWYWx1ZT86IGFueSxcbiAgICBkZXBzPzogYW55W10sXG4gIH0pOiB0eXBlb2YgVGVzdEJlZCB7XG4gICAgX2dldFRlc3RCZWRWaWV3RW5naW5lKCkub3ZlcnJpZGVQcm92aWRlcih0b2tlbiwgcHJvdmlkZXIgYXMgYW55KTtcbiAgICByZXR1cm4gVGVzdEJlZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBPdmVyd3JpdGVzIGFsbCBwcm92aWRlcnMgZm9yIHRoZSBnaXZlbiB0b2tlbiB3aXRoIHRoZSBnaXZlbiBwcm92aWRlciBkZWZpbml0aW9uLlxuICAgKlxuICAgKiBAZGVwcmVjYXRlZCBhcyBpdCBtYWtlcyBhbGwgTmdNb2R1bGVzIGxhenkuIEludHJvZHVjZWQgb25seSBmb3IgbWlncmF0aW5nIG9mZiBvZiBpdC5cbiAgICovXG4gIHN0YXRpYyBkZXByZWNhdGVkT3ZlcnJpZGVQcm92aWRlcih0b2tlbjogYW55LCBwcm92aWRlcjoge1xuICAgIHVzZUZhY3Rvcnk6IEZ1bmN0aW9uLFxuICAgIGRlcHM6IGFueVtdLFxuICB9KTogdm9pZDtcbiAgc3RhdGljIGRlcHJlY2F0ZWRPdmVycmlkZVByb3ZpZGVyKHRva2VuOiBhbnksIHByb3ZpZGVyOiB7dXNlVmFsdWU6IGFueTt9KTogdm9pZDtcbiAgc3RhdGljIGRlcHJlY2F0ZWRPdmVycmlkZVByb3ZpZGVyKHRva2VuOiBhbnksIHByb3ZpZGVyOiB7XG4gICAgdXNlRmFjdG9yeT86IEZ1bmN0aW9uLFxuICAgIHVzZVZhbHVlPzogYW55LFxuICAgIGRlcHM/OiBhbnlbXSxcbiAgfSk6IHR5cGVvZiBUZXN0QmVkIHtcbiAgICBfZ2V0VGVzdEJlZFZpZXdFbmdpbmUoKS5kZXByZWNhdGVkT3ZlcnJpZGVQcm92aWRlcih0b2tlbiwgcHJvdmlkZXIgYXMgYW55KTtcbiAgICByZXR1cm4gVGVzdEJlZDtcbiAgfVxuXG4gIHN0YXRpYyBnZXQodG9rZW46IGFueSwgbm90Rm91bmRWYWx1ZTogYW55ID0gSW5qZWN0b3IuVEhST1dfSUZfTk9UX0ZPVU5EKSB7XG4gICAgcmV0dXJuIF9nZXRUZXN0QmVkVmlld0VuZ2luZSgpLmdldCh0b2tlbiwgbm90Rm91bmRWYWx1ZSk7XG4gIH1cblxuICBzdGF0aWMgY3JlYXRlQ29tcG9uZW50PFQ+KGNvbXBvbmVudDogVHlwZTxUPik6IENvbXBvbmVudEZpeHR1cmU8VD4ge1xuICAgIHJldHVybiBfZ2V0VGVzdEJlZFZpZXdFbmdpbmUoKS5jcmVhdGVDb21wb25lbnQoY29tcG9uZW50KTtcbiAgfVxuXG4gIHByaXZhdGUgX2luc3RhbnRpYXRlZDogYm9vbGVhbiA9IGZhbHNlO1xuXG4gIHByaXZhdGUgX2NvbXBpbGVyOiBUZXN0aW5nQ29tcGlsZXIgPSBudWxsICE7XG4gIHByaXZhdGUgX21vZHVsZVJlZjogTmdNb2R1bGVSZWY8YW55PiA9IG51bGwgITtcbiAgcHJpdmF0ZSBfbW9kdWxlRmFjdG9yeTogTmdNb2R1bGVGYWN0b3J5PGFueT4gPSBudWxsICE7XG5cbiAgcHJpdmF0ZSBfY29tcGlsZXJPcHRpb25zOiBDb21waWxlck9wdGlvbnNbXSA9IFtdO1xuXG4gIHByaXZhdGUgX21vZHVsZU92ZXJyaWRlczogW1R5cGU8YW55PiwgTWV0YWRhdGFPdmVycmlkZTxOZ01vZHVsZT5dW10gPSBbXTtcbiAgcHJpdmF0ZSBfY29tcG9uZW50T3ZlcnJpZGVzOiBbVHlwZTxhbnk+LCBNZXRhZGF0YU92ZXJyaWRlPENvbXBvbmVudD5dW10gPSBbXTtcbiAgcHJpdmF0ZSBfZGlyZWN0aXZlT3ZlcnJpZGVzOiBbVHlwZTxhbnk+LCBNZXRhZGF0YU92ZXJyaWRlPERpcmVjdGl2ZT5dW10gPSBbXTtcbiAgcHJpdmF0ZSBfcGlwZU92ZXJyaWRlczogW1R5cGU8YW55PiwgTWV0YWRhdGFPdmVycmlkZTxQaXBlPl1bXSA9IFtdO1xuXG4gIHByaXZhdGUgX3Byb3ZpZGVyczogUHJvdmlkZXJbXSA9IFtdO1xuICBwcml2YXRlIF9kZWNsYXJhdGlvbnM6IEFycmF5PFR5cGU8YW55PnxhbnlbXXxhbnk+ID0gW107XG4gIHByaXZhdGUgX2ltcG9ydHM6IEFycmF5PFR5cGU8YW55PnxhbnlbXXxhbnk+ID0gW107XG4gIHByaXZhdGUgX3NjaGVtYXM6IEFycmF5PFNjaGVtYU1ldGFkYXRhfGFueVtdPiA9IFtdO1xuICBwcml2YXRlIF9hY3RpdmVGaXh0dXJlczogQ29tcG9uZW50Rml4dHVyZTxhbnk+W10gPSBbXTtcblxuICBwcml2YXRlIF90ZXN0RW52QW90U3VtbWFyaWVzOiAoKSA9PiBhbnlbXSA9ICgpID0+IFtdO1xuICBwcml2YXRlIF9hb3RTdW1tYXJpZXM6IEFycmF5PCgpID0+IGFueVtdPiA9IFtdO1xuICBwcml2YXRlIF90ZW1wbGF0ZU92ZXJyaWRlczogQXJyYXk8e2NvbXBvbmVudDogVHlwZTxhbnk+LCB0ZW1wbGF0ZU9mOiBUeXBlPGFueT59PiA9IFtdO1xuXG4gIHByaXZhdGUgX2lzUm9vdDogYm9vbGVhbiA9IHRydWU7XG4gIHByaXZhdGUgX3Jvb3RQcm92aWRlck92ZXJyaWRlczogUHJvdmlkZXJbXSA9IFtdO1xuXG4gIHBsYXRmb3JtOiBQbGF0Zm9ybVJlZiA9IG51bGwgITtcblxuICBuZ01vZHVsZTogVHlwZTxhbnk+fFR5cGU8YW55PltdID0gbnVsbCAhO1xuXG4gIC8qKlxuICAgKiBJbml0aWFsaXplIHRoZSBlbnZpcm9ubWVudCBmb3IgdGVzdGluZyB3aXRoIGEgY29tcGlsZXIgZmFjdG9yeSwgYSBQbGF0Zm9ybVJlZiwgYW5kIGFuXG4gICAqIGFuZ3VsYXIgbW9kdWxlLiBUaGVzZSBhcmUgY29tbW9uIHRvIGV2ZXJ5IHRlc3QgaW4gdGhlIHN1aXRlLlxuICAgKlxuICAgKiBUaGlzIG1heSBvbmx5IGJlIGNhbGxlZCBvbmNlLCB0byBzZXQgdXAgdGhlIGNvbW1vbiBwcm92aWRlcnMgZm9yIHRoZSBjdXJyZW50IHRlc3RcbiAgICogc3VpdGUgb24gdGhlIGN1cnJlbnQgcGxhdGZvcm0uIElmIHlvdSBhYnNvbHV0ZWx5IG5lZWQgdG8gY2hhbmdlIHRoZSBwcm92aWRlcnMsXG4gICAqIGZpcnN0IHVzZSBgcmVzZXRUZXN0RW52aXJvbm1lbnRgLlxuICAgKlxuICAgKiBUZXN0IG1vZHVsZXMgYW5kIHBsYXRmb3JtcyBmb3IgaW5kaXZpZHVhbCBwbGF0Zm9ybXMgYXJlIGF2YWlsYWJsZSBmcm9tXG4gICAqICdAYW5ndWxhci88cGxhdGZvcm1fbmFtZT4vdGVzdGluZycuXG4gICAqXG4gICAqIEBleHBlcmltZW50YWxcbiAgICovXG4gIGluaXRUZXN0RW52aXJvbm1lbnQoXG4gICAgICBuZ01vZHVsZTogVHlwZTxhbnk+fFR5cGU8YW55PltdLCBwbGF0Zm9ybTogUGxhdGZvcm1SZWYsIGFvdFN1bW1hcmllcz86ICgpID0+IGFueVtdKTogdm9pZCB7XG4gICAgaWYgKHRoaXMucGxhdGZvcm0gfHwgdGhpcy5uZ01vZHVsZSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3Qgc2V0IGJhc2UgcHJvdmlkZXJzIGJlY2F1c2UgaXQgaGFzIGFscmVhZHkgYmVlbiBjYWxsZWQnKTtcbiAgICB9XG4gICAgdGhpcy5wbGF0Zm9ybSA9IHBsYXRmb3JtO1xuICAgIHRoaXMubmdNb2R1bGUgPSBuZ01vZHVsZTtcbiAgICBpZiAoYW90U3VtbWFyaWVzKSB7XG4gICAgICB0aGlzLl90ZXN0RW52QW90U3VtbWFyaWVzID0gYW90U3VtbWFyaWVzO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBSZXNldCB0aGUgcHJvdmlkZXJzIGZvciB0aGUgdGVzdCBpbmplY3Rvci5cbiAgICpcbiAgICogQGV4cGVyaW1lbnRhbFxuICAgKi9cbiAgcmVzZXRUZXN0RW52aXJvbm1lbnQoKTogdm9pZCB7XG4gICAgdGhpcy5yZXNldFRlc3RpbmdNb2R1bGUoKTtcbiAgICB0aGlzLnBsYXRmb3JtID0gbnVsbCAhO1xuICAgIHRoaXMubmdNb2R1bGUgPSBudWxsICE7XG4gICAgdGhpcy5fdGVzdEVudkFvdFN1bW1hcmllcyA9ICgpID0+IFtdO1xuICB9XG5cbiAgcmVzZXRUZXN0aW5nTW9kdWxlKCk6IHZvaWQge1xuICAgIGNsZWFyT3ZlcnJpZGVzKCk7XG4gICAgdGhpcy5fYW90U3VtbWFyaWVzID0gW107XG4gICAgdGhpcy5fdGVtcGxhdGVPdmVycmlkZXMgPSBbXTtcbiAgICB0aGlzLl9jb21waWxlciA9IG51bGwgITtcbiAgICB0aGlzLl9tb2R1bGVPdmVycmlkZXMgPSBbXTtcbiAgICB0aGlzLl9jb21wb25lbnRPdmVycmlkZXMgPSBbXTtcbiAgICB0aGlzLl9kaXJlY3RpdmVPdmVycmlkZXMgPSBbXTtcbiAgICB0aGlzLl9waXBlT3ZlcnJpZGVzID0gW107XG5cbiAgICB0aGlzLl9pc1Jvb3QgPSB0cnVlO1xuICAgIHRoaXMuX3Jvb3RQcm92aWRlck92ZXJyaWRlcyA9IFtdO1xuXG4gICAgdGhpcy5fbW9kdWxlUmVmID0gbnVsbCAhO1xuICAgIHRoaXMuX21vZHVsZUZhY3RvcnkgPSBudWxsICE7XG4gICAgdGhpcy5fY29tcGlsZXJPcHRpb25zID0gW107XG4gICAgdGhpcy5fcHJvdmlkZXJzID0gW107XG4gICAgdGhpcy5fZGVjbGFyYXRpb25zID0gW107XG4gICAgdGhpcy5faW1wb3J0cyA9IFtdO1xuICAgIHRoaXMuX3NjaGVtYXMgPSBbXTtcbiAgICB0aGlzLl9pbnN0YW50aWF0ZWQgPSBmYWxzZTtcbiAgICB0aGlzLl9hY3RpdmVGaXh0dXJlcy5mb3JFYWNoKChmaXh0dXJlKSA9PiB7XG4gICAgICB0cnkge1xuICAgICAgICBmaXh0dXJlLmRlc3Ryb3koKTtcbiAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcignRXJyb3IgZHVyaW5nIGNsZWFudXAgb2YgY29tcG9uZW50Jywge1xuICAgICAgICAgIGNvbXBvbmVudDogZml4dHVyZS5jb21wb25lbnRJbnN0YW5jZSxcbiAgICAgICAgICBzdGFja3RyYWNlOiBlLFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICB0aGlzLl9hY3RpdmVGaXh0dXJlcyA9IFtdO1xuICB9XG5cbiAgY29uZmlndXJlQ29tcGlsZXIoY29uZmlnOiB7cHJvdmlkZXJzPzogYW55W10sIHVzZUppdD86IGJvb2xlYW59KTogdm9pZCB7XG4gICAgdGhpcy5fYXNzZXJ0Tm90SW5zdGFudGlhdGVkKCdUZXN0QmVkLmNvbmZpZ3VyZUNvbXBpbGVyJywgJ2NvbmZpZ3VyZSB0aGUgY29tcGlsZXInKTtcbiAgICB0aGlzLl9jb21waWxlck9wdGlvbnMucHVzaChjb25maWcpO1xuICB9XG5cbiAgY29uZmlndXJlVGVzdGluZ01vZHVsZShtb2R1bGVEZWY6IFRlc3RNb2R1bGVNZXRhZGF0YSk6IHZvaWQge1xuICAgIHRoaXMuX2Fzc2VydE5vdEluc3RhbnRpYXRlZCgnVGVzdEJlZC5jb25maWd1cmVUZXN0aW5nTW9kdWxlJywgJ2NvbmZpZ3VyZSB0aGUgdGVzdCBtb2R1bGUnKTtcbiAgICBpZiAobW9kdWxlRGVmLnByb3ZpZGVycykge1xuICAgICAgdGhpcy5fcHJvdmlkZXJzLnB1c2goLi4ubW9kdWxlRGVmLnByb3ZpZGVycyk7XG4gICAgfVxuICAgIGlmIChtb2R1bGVEZWYuZGVjbGFyYXRpb25zKSB7XG4gICAgICB0aGlzLl9kZWNsYXJhdGlvbnMucHVzaCguLi5tb2R1bGVEZWYuZGVjbGFyYXRpb25zKTtcbiAgICB9XG4gICAgaWYgKG1vZHVsZURlZi5pbXBvcnRzKSB7XG4gICAgICB0aGlzLl9pbXBvcnRzLnB1c2goLi4ubW9kdWxlRGVmLmltcG9ydHMpO1xuICAgIH1cbiAgICBpZiAobW9kdWxlRGVmLnNjaGVtYXMpIHtcbiAgICAgIHRoaXMuX3NjaGVtYXMucHVzaCguLi5tb2R1bGVEZWYuc2NoZW1hcyk7XG4gICAgfVxuICAgIGlmIChtb2R1bGVEZWYuYW90U3VtbWFyaWVzKSB7XG4gICAgICB0aGlzLl9hb3RTdW1tYXJpZXMucHVzaChtb2R1bGVEZWYuYW90U3VtbWFyaWVzKTtcbiAgICB9XG4gIH1cblxuICBjb21waWxlQ29tcG9uZW50cygpOiBQcm9taXNlPGFueT4ge1xuICAgIGlmICh0aGlzLl9tb2R1bGVGYWN0b3J5IHx8IHRoaXMuX2luc3RhbnRpYXRlZCkge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShudWxsKTtcbiAgICB9XG5cbiAgICBjb25zdCBtb2R1bGVUeXBlID0gdGhpcy5fY3JlYXRlQ29tcGlsZXJBbmRNb2R1bGUoKTtcbiAgICByZXR1cm4gdGhpcy5fY29tcGlsZXIuY29tcGlsZU1vZHVsZUFuZEFsbENvbXBvbmVudHNBc3luYyhtb2R1bGVUeXBlKVxuICAgICAgICAudGhlbigobW9kdWxlQW5kQ29tcG9uZW50RmFjdG9yaWVzKSA9PiB7XG4gICAgICAgICAgdGhpcy5fbW9kdWxlRmFjdG9yeSA9IG1vZHVsZUFuZENvbXBvbmVudEZhY3Rvcmllcy5uZ01vZHVsZUZhY3Rvcnk7XG4gICAgICAgIH0pO1xuICB9XG5cbiAgcHJpdmF0ZSBfaW5pdElmTmVlZGVkKCk6IHZvaWQge1xuICAgIGlmICh0aGlzLl9pbnN0YW50aWF0ZWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKCF0aGlzLl9tb2R1bGVGYWN0b3J5KSB7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCBtb2R1bGVUeXBlID0gdGhpcy5fY3JlYXRlQ29tcGlsZXJBbmRNb2R1bGUoKTtcbiAgICAgICAgdGhpcy5fbW9kdWxlRmFjdG9yeSA9XG4gICAgICAgICAgICB0aGlzLl9jb21waWxlci5jb21waWxlTW9kdWxlQW5kQWxsQ29tcG9uZW50c1N5bmMobW9kdWxlVHlwZSkubmdNb2R1bGVGYWN0b3J5O1xuICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBjb25zdCBlcnJvckNvbXBUeXBlID0gdGhpcy5fY29tcGlsZXIuZ2V0Q29tcG9uZW50RnJvbUVycm9yKGUpO1xuICAgICAgICBpZiAoZXJyb3JDb21wVHlwZSkge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICAgICAgYFRoaXMgdGVzdCBtb2R1bGUgdXNlcyB0aGUgY29tcG9uZW50ICR7c3RyaW5naWZ5KGVycm9yQ29tcFR5cGUpfSB3aGljaCBpcyB1c2luZyBhIFwidGVtcGxhdGVVcmxcIiBvciBcInN0eWxlVXJsc1wiLCBidXQgdGhleSB3ZXJlIG5ldmVyIGNvbXBpbGVkLiBgICtcbiAgICAgICAgICAgICAgYFBsZWFzZSBjYWxsIFwiVGVzdEJlZC5jb21waWxlQ29tcG9uZW50c1wiIGJlZm9yZSB5b3VyIHRlc3QuYCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhyb3cgZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBmb3IgKGNvbnN0IHtjb21wb25lbnQsIHRlbXBsYXRlT2Z9IG9mIHRoaXMuX3RlbXBsYXRlT3ZlcnJpZGVzKSB7XG4gICAgICBjb25zdCBjb21wRmFjdG9yeSA9IHRoaXMuX2NvbXBpbGVyLmdldENvbXBvbmVudEZhY3RvcnkodGVtcGxhdGVPZik7XG4gICAgICBvdmVycmlkZUNvbXBvbmVudFZpZXcoY29tcG9uZW50LCBjb21wRmFjdG9yeSk7XG4gICAgfVxuXG4gICAgY29uc3Qgbmdab25lID0gbmV3IE5nWm9uZSh7ZW5hYmxlTG9uZ1N0YWNrVHJhY2U6IHRydWV9KTtcbiAgICBjb25zdCBwcm92aWRlcnM6IFN0YXRpY1Byb3ZpZGVyW10gPSBbe3Byb3ZpZGU6IE5nWm9uZSwgdXNlVmFsdWU6IG5nWm9uZX1dO1xuICAgIGNvbnN0IG5nWm9uZUluamVjdG9yID0gSW5qZWN0b3IuY3JlYXRlKHtcbiAgICAgIHByb3ZpZGVyczogcHJvdmlkZXJzLFxuICAgICAgcGFyZW50OiB0aGlzLnBsYXRmb3JtLmluamVjdG9yLFxuICAgICAgbmFtZTogdGhpcy5fbW9kdWxlRmFjdG9yeS5tb2R1bGVUeXBlLm5hbWVcbiAgICB9KTtcbiAgICB0aGlzLl9tb2R1bGVSZWYgPSB0aGlzLl9tb2R1bGVGYWN0b3J5LmNyZWF0ZShuZ1pvbmVJbmplY3Rvcik7XG4gICAgLy8gQXBwbGljYXRpb25Jbml0U3RhdHVzLnJ1bkluaXRpYWxpemVycygpIGlzIG1hcmtlZCBAaW50ZXJuYWwgdG8gY29yZS4gU28gY2FzdGluZyB0byBhbnlcbiAgICAvLyBiZWZvcmUgYWNjZXNzaW5nIGl0LlxuICAgICh0aGlzLl9tb2R1bGVSZWYuaW5qZWN0b3IuZ2V0KEFwcGxpY2F0aW9uSW5pdFN0YXR1cykgYXMgYW55KS5ydW5Jbml0aWFsaXplcnMoKTtcbiAgICB0aGlzLl9pbnN0YW50aWF0ZWQgPSB0cnVlO1xuICB9XG5cbiAgcHJpdmF0ZSBfY3JlYXRlQ29tcGlsZXJBbmRNb2R1bGUoKTogVHlwZTxhbnk+IHtcbiAgICBjb25zdCBwcm92aWRlcnMgPSB0aGlzLl9wcm92aWRlcnMuY29uY2F0KFt7cHJvdmlkZTogVGVzdEJlZCwgdXNlVmFsdWU6IHRoaXN9XSk7XG4gICAgY29uc3QgZGVjbGFyYXRpb25zID1cbiAgICAgICAgWy4uLnRoaXMuX2RlY2xhcmF0aW9ucywgLi4udGhpcy5fdGVtcGxhdGVPdmVycmlkZXMubWFwKGVudHJ5ID0+IGVudHJ5LnRlbXBsYXRlT2YpXTtcblxuICAgIGNvbnN0IHJvb3RTY29wZUltcG9ydHMgPSBbXTtcbiAgICBjb25zdCByb290UHJvdmlkZXJPdmVycmlkZXMgPSB0aGlzLl9yb290UHJvdmlkZXJPdmVycmlkZXM7XG4gICAgaWYgKHRoaXMuX2lzUm9vdCkge1xuICAgICAgQE5nTW9kdWxlKHtcbiAgICAgICAgcHJvdmlkZXJzOiBbXG4gICAgICAgICAgLi4ucm9vdFByb3ZpZGVyT3ZlcnJpZGVzLFxuICAgICAgICBdLFxuICAgICAgICBqaXQ6IHRydWUsXG4gICAgICB9KVxuICAgICAgY2xhc3MgUm9vdFNjb3BlTW9kdWxlIHtcbiAgICAgIH1cbiAgICAgIHJvb3RTY29wZUltcG9ydHMucHVzaChSb290U2NvcGVNb2R1bGUpO1xuICAgIH1cbiAgICBwcm92aWRlcnMucHVzaCh7cHJvdmlkZTogQVBQX1JPT1QsIHVzZVZhbHVlOiB0aGlzLl9pc1Jvb3R9KTtcblxuICAgIGNvbnN0IGltcG9ydHMgPSBbcm9vdFNjb3BlSW1wb3J0cywgdGhpcy5uZ01vZHVsZSwgdGhpcy5faW1wb3J0c107XG4gICAgY29uc3Qgc2NoZW1hcyA9IHRoaXMuX3NjaGVtYXM7XG5cbiAgICBATmdNb2R1bGUoe3Byb3ZpZGVycywgZGVjbGFyYXRpb25zLCBpbXBvcnRzLCBzY2hlbWFzLCBqaXQ6IHRydWV9KVxuICAgIGNsYXNzIER5bmFtaWNUZXN0TW9kdWxlIHtcbiAgICB9XG5cbiAgICBjb25zdCBjb21waWxlckZhY3Rvcnk6IFRlc3RpbmdDb21waWxlckZhY3RvcnkgPVxuICAgICAgICB0aGlzLnBsYXRmb3JtLmluamVjdG9yLmdldChUZXN0aW5nQ29tcGlsZXJGYWN0b3J5KTtcbiAgICB0aGlzLl9jb21waWxlciA9IGNvbXBpbGVyRmFjdG9yeS5jcmVhdGVUZXN0aW5nQ29tcGlsZXIodGhpcy5fY29tcGlsZXJPcHRpb25zKTtcbiAgICBmb3IgKGNvbnN0IHN1bW1hcnkgb2YgW3RoaXMuX3Rlc3RFbnZBb3RTdW1tYXJpZXMsIC4uLnRoaXMuX2FvdFN1bW1hcmllc10pIHtcbiAgICAgIHRoaXMuX2NvbXBpbGVyLmxvYWRBb3RTdW1tYXJpZXMoc3VtbWFyeSk7XG4gICAgfVxuICAgIHRoaXMuX21vZHVsZU92ZXJyaWRlcy5mb3JFYWNoKChlbnRyeSkgPT4gdGhpcy5fY29tcGlsZXIub3ZlcnJpZGVNb2R1bGUoZW50cnlbMF0sIGVudHJ5WzFdKSk7XG4gICAgdGhpcy5fY29tcG9uZW50T3ZlcnJpZGVzLmZvckVhY2goXG4gICAgICAgIChlbnRyeSkgPT4gdGhpcy5fY29tcGlsZXIub3ZlcnJpZGVDb21wb25lbnQoZW50cnlbMF0sIGVudHJ5WzFdKSk7XG4gICAgdGhpcy5fZGlyZWN0aXZlT3ZlcnJpZGVzLmZvckVhY2goXG4gICAgICAgIChlbnRyeSkgPT4gdGhpcy5fY29tcGlsZXIub3ZlcnJpZGVEaXJlY3RpdmUoZW50cnlbMF0sIGVudHJ5WzFdKSk7XG4gICAgdGhpcy5fcGlwZU92ZXJyaWRlcy5mb3JFYWNoKChlbnRyeSkgPT4gdGhpcy5fY29tcGlsZXIub3ZlcnJpZGVQaXBlKGVudHJ5WzBdLCBlbnRyeVsxXSkpO1xuICAgIHJldHVybiBEeW5hbWljVGVzdE1vZHVsZTtcbiAgfVxuXG4gIHByaXZhdGUgX2Fzc2VydE5vdEluc3RhbnRpYXRlZChtZXRob2ROYW1lOiBzdHJpbmcsIG1ldGhvZERlc2NyaXB0aW9uOiBzdHJpbmcpIHtcbiAgICBpZiAodGhpcy5faW5zdGFudGlhdGVkKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgYENhbm5vdCAke21ldGhvZERlc2NyaXB0aW9ufSB3aGVuIHRoZSB0ZXN0IG1vZHVsZSBoYXMgYWxyZWFkeSBiZWVuIGluc3RhbnRpYXRlZC4gYCArXG4gICAgICAgICAgYE1ha2Ugc3VyZSB5b3UgYXJlIG5vdCB1c2luZyBcXGBpbmplY3RcXGAgYmVmb3JlIFxcYCR7bWV0aG9kTmFtZX1cXGAuYCk7XG4gICAgfVxuICB9XG5cbiAgZ2V0KHRva2VuOiBhbnksIG5vdEZvdW5kVmFsdWU6IGFueSA9IEluamVjdG9yLlRIUk9XX0lGX05PVF9GT1VORCk6IGFueSB7XG4gICAgdGhpcy5faW5pdElmTmVlZGVkKCk7XG4gICAgaWYgKHRva2VuID09PSBUZXN0QmVkKSB7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgLy8gVGVzdHMgY2FuIGluamVjdCB0aGluZ3MgZnJvbSB0aGUgbmcgbW9kdWxlIGFuZCBmcm9tIHRoZSBjb21waWxlcixcbiAgICAvLyBidXQgdGhlIG5nIG1vZHVsZSBjYW4ndCBpbmplY3QgdGhpbmdzIGZyb20gdGhlIGNvbXBpbGVyIGFuZCB2aWNlIHZlcnNhLlxuICAgIGNvbnN0IHJlc3VsdCA9IHRoaXMuX21vZHVsZVJlZi5pbmplY3Rvci5nZXQodG9rZW4sIFVOREVGSU5FRCk7XG4gICAgcmV0dXJuIHJlc3VsdCA9PT0gVU5ERUZJTkVEID8gdGhpcy5fY29tcGlsZXIuaW5qZWN0b3IuZ2V0KHRva2VuLCBub3RGb3VuZFZhbHVlKSA6IHJlc3VsdDtcbiAgfVxuXG4gIGV4ZWN1dGUodG9rZW5zOiBhbnlbXSwgZm46IEZ1bmN0aW9uLCBjb250ZXh0PzogYW55KTogYW55IHtcbiAgICB0aGlzLl9pbml0SWZOZWVkZWQoKTtcbiAgICBjb25zdCBwYXJhbXMgPSB0b2tlbnMubWFwKHQgPT4gdGhpcy5nZXQodCkpO1xuICAgIHJldHVybiBmbi5hcHBseShjb250ZXh0LCBwYXJhbXMpO1xuICB9XG5cbiAgb3ZlcnJpZGVNb2R1bGUobmdNb2R1bGU6IFR5cGU8YW55Piwgb3ZlcnJpZGU6IE1ldGFkYXRhT3ZlcnJpZGU8TmdNb2R1bGU+KTogdm9pZCB7XG4gICAgdGhpcy5fYXNzZXJ0Tm90SW5zdGFudGlhdGVkKCdvdmVycmlkZU1vZHVsZScsICdvdmVycmlkZSBtb2R1bGUgbWV0YWRhdGEnKTtcbiAgICB0aGlzLl9tb2R1bGVPdmVycmlkZXMucHVzaChbbmdNb2R1bGUsIG92ZXJyaWRlXSk7XG4gIH1cblxuICBvdmVycmlkZUNvbXBvbmVudChjb21wb25lbnQ6IFR5cGU8YW55Piwgb3ZlcnJpZGU6IE1ldGFkYXRhT3ZlcnJpZGU8Q29tcG9uZW50Pik6IHZvaWQge1xuICAgIHRoaXMuX2Fzc2VydE5vdEluc3RhbnRpYXRlZCgnb3ZlcnJpZGVDb21wb25lbnQnLCAnb3ZlcnJpZGUgY29tcG9uZW50IG1ldGFkYXRhJyk7XG4gICAgdGhpcy5fY29tcG9uZW50T3ZlcnJpZGVzLnB1c2goW2NvbXBvbmVudCwgb3ZlcnJpZGVdKTtcbiAgfVxuXG4gIG92ZXJyaWRlRGlyZWN0aXZlKGRpcmVjdGl2ZTogVHlwZTxhbnk+LCBvdmVycmlkZTogTWV0YWRhdGFPdmVycmlkZTxEaXJlY3RpdmU+KTogdm9pZCB7XG4gICAgdGhpcy5fYXNzZXJ0Tm90SW5zdGFudGlhdGVkKCdvdmVycmlkZURpcmVjdGl2ZScsICdvdmVycmlkZSBkaXJlY3RpdmUgbWV0YWRhdGEnKTtcbiAgICB0aGlzLl9kaXJlY3RpdmVPdmVycmlkZXMucHVzaChbZGlyZWN0aXZlLCBvdmVycmlkZV0pO1xuICB9XG5cbiAgb3ZlcnJpZGVQaXBlKHBpcGU6IFR5cGU8YW55Piwgb3ZlcnJpZGU6IE1ldGFkYXRhT3ZlcnJpZGU8UGlwZT4pOiB2b2lkIHtcbiAgICB0aGlzLl9hc3NlcnROb3RJbnN0YW50aWF0ZWQoJ292ZXJyaWRlUGlwZScsICdvdmVycmlkZSBwaXBlIG1ldGFkYXRhJyk7XG4gICAgdGhpcy5fcGlwZU92ZXJyaWRlcy5wdXNoKFtwaXBlLCBvdmVycmlkZV0pO1xuICB9XG5cbiAgLyoqXG4gICAqIE92ZXJ3cml0ZXMgYWxsIHByb3ZpZGVycyBmb3IgdGhlIGdpdmVuIHRva2VuIHdpdGggdGhlIGdpdmVuIHByb3ZpZGVyIGRlZmluaXRpb24uXG4gICAqL1xuICBvdmVycmlkZVByb3ZpZGVyKHRva2VuOiBhbnksIHByb3ZpZGVyOiB7XG4gICAgdXNlRmFjdG9yeTogRnVuY3Rpb24sXG4gICAgZGVwczogYW55W10sXG4gIH0pOiB2b2lkO1xuICBvdmVycmlkZVByb3ZpZGVyKHRva2VuOiBhbnksIHByb3ZpZGVyOiB7dXNlVmFsdWU6IGFueTt9KTogdm9pZDtcbiAgb3ZlcnJpZGVQcm92aWRlcih0b2tlbjogYW55LCBwcm92aWRlcjoge3VzZUZhY3Rvcnk/OiBGdW5jdGlvbiwgdXNlVmFsdWU/OiBhbnksIGRlcHM/OiBhbnlbXX0pOlxuICAgICAgdm9pZCB7XG4gICAgdGhpcy5vdmVycmlkZVByb3ZpZGVySW1wbCh0b2tlbiwgcHJvdmlkZXIpO1xuICB9XG5cbiAgLyoqXG4gICAqIE92ZXJ3cml0ZXMgYWxsIHByb3ZpZGVycyBmb3IgdGhlIGdpdmVuIHRva2VuIHdpdGggdGhlIGdpdmVuIHByb3ZpZGVyIGRlZmluaXRpb24uXG4gICAqXG4gICAqIEBkZXByZWNhdGVkIGFzIGl0IG1ha2VzIGFsbCBOZ01vZHVsZXMgbGF6eS4gSW50cm9kdWNlZCBvbmx5IGZvciBtaWdyYXRpbmcgb2ZmIG9mIGl0LlxuICAgKi9cbiAgZGVwcmVjYXRlZE92ZXJyaWRlUHJvdmlkZXIodG9rZW46IGFueSwgcHJvdmlkZXI6IHtcbiAgICB1c2VGYWN0b3J5OiBGdW5jdGlvbixcbiAgICBkZXBzOiBhbnlbXSxcbiAgfSk6IHZvaWQ7XG4gIGRlcHJlY2F0ZWRPdmVycmlkZVByb3ZpZGVyKHRva2VuOiBhbnksIHByb3ZpZGVyOiB7dXNlVmFsdWU6IGFueTt9KTogdm9pZDtcbiAgZGVwcmVjYXRlZE92ZXJyaWRlUHJvdmlkZXIoXG4gICAgICB0b2tlbjogYW55LCBwcm92aWRlcjoge3VzZUZhY3Rvcnk/OiBGdW5jdGlvbiwgdXNlVmFsdWU/OiBhbnksIGRlcHM/OiBhbnlbXX0pOiB2b2lkIHtcbiAgICB0aGlzLm92ZXJyaWRlUHJvdmlkZXJJbXBsKHRva2VuLCBwcm92aWRlciwgLyogZGVwcmVjYXRlZCAqLyB0cnVlKTtcbiAgfVxuXG4gIHByaXZhdGUgb3ZlcnJpZGVQcm92aWRlckltcGwoXG4gICAgICB0b2tlbjogYW55LCBwcm92aWRlcjoge1xuICAgICAgICB1c2VGYWN0b3J5PzogRnVuY3Rpb24sXG4gICAgICAgIHVzZVZhbHVlPzogYW55LFxuICAgICAgICBkZXBzPzogYW55W10sXG4gICAgICB9LFxuICAgICAgZGVwcmVjYXRlZCA9IGZhbHNlKTogdm9pZCB7XG4gICAgaWYgKHR5cGVvZiB0b2tlbiAhPT0gJ3N0cmluZycgJiYgdG9rZW4ubmdJbmplY3RhYmxlRGVmICYmXG4gICAgICAgIHRva2VuLm5nSW5qZWN0YWJsZURlZi5wcm92aWRlZEluID09PSAncm9vdCcpIHtcbiAgICAgIGlmIChwcm92aWRlci51c2VGYWN0b3J5KSB7XG4gICAgICAgIHRoaXMuX3Jvb3RQcm92aWRlck92ZXJyaWRlcy5wdXNoKFxuICAgICAgICAgICAge3Byb3ZpZGU6IHRva2VuLCB1c2VGYWN0b3J5OiBwcm92aWRlci51c2VGYWN0b3J5LCBkZXBzOiBwcm92aWRlci5kZXBzIHx8IFtdfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLl9yb290UHJvdmlkZXJPdmVycmlkZXMucHVzaCh7cHJvdmlkZTogdG9rZW4sIHVzZVZhbHVlOiBwcm92aWRlci51c2VWYWx1ZX0pO1xuICAgICAgfVxuICAgIH1cbiAgICBsZXQgZmxhZ3M6IE5vZGVGbGFncyA9IDA7XG4gICAgbGV0IHZhbHVlOiBhbnk7XG4gICAgaWYgKHByb3ZpZGVyLnVzZUZhY3RvcnkpIHtcbiAgICAgIGZsYWdzIHw9IE5vZGVGbGFncy5UeXBlRmFjdG9yeVByb3ZpZGVyO1xuICAgICAgdmFsdWUgPSBwcm92aWRlci51c2VGYWN0b3J5O1xuICAgIH0gZWxzZSB7XG4gICAgICBmbGFncyB8PSBOb2RlRmxhZ3MuVHlwZVZhbHVlUHJvdmlkZXI7XG4gICAgICB2YWx1ZSA9IHByb3ZpZGVyLnVzZVZhbHVlO1xuICAgIH1cbiAgICBjb25zdCBkZXBzID0gKHByb3ZpZGVyLmRlcHMgfHwgW10pLm1hcCgoZGVwKSA9PiB7XG4gICAgICBsZXQgZGVwRmxhZ3M6IERlcEZsYWdzID0gRGVwRmxhZ3MuTm9uZTtcbiAgICAgIGxldCBkZXBUb2tlbjogYW55O1xuICAgICAgaWYgKEFycmF5LmlzQXJyYXkoZGVwKSkge1xuICAgICAgICBkZXAuZm9yRWFjaCgoZW50cnk6IGFueSkgPT4ge1xuICAgICAgICAgIGlmIChlbnRyeSBpbnN0YW5jZW9mIE9wdGlvbmFsKSB7XG4gICAgICAgICAgICBkZXBGbGFncyB8PSBEZXBGbGFncy5PcHRpb25hbDtcbiAgICAgICAgICB9IGVsc2UgaWYgKGVudHJ5IGluc3RhbmNlb2YgU2tpcFNlbGYpIHtcbiAgICAgICAgICAgIGRlcEZsYWdzIHw9IERlcEZsYWdzLlNraXBTZWxmO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBkZXBUb2tlbiA9IGVudHJ5O1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBkZXBUb2tlbiA9IGRlcDtcbiAgICAgIH1cbiAgICAgIHJldHVybiBbZGVwRmxhZ3MsIGRlcFRva2VuXTtcbiAgICB9KTtcbiAgICBvdmVycmlkZVByb3ZpZGVyKHt0b2tlbiwgZmxhZ3MsIGRlcHMsIHZhbHVlLCBkZXByZWNhdGVkQmVoYXZpb3I6IGRlcHJlY2F0ZWR9KTtcbiAgfVxuXG4gIG92ZXJyaWRlVGVtcGxhdGVVc2luZ1Rlc3RpbmdNb2R1bGUoY29tcG9uZW50OiBUeXBlPGFueT4sIHRlbXBsYXRlOiBzdHJpbmcpIHtcbiAgICB0aGlzLl9hc3NlcnROb3RJbnN0YW50aWF0ZWQoJ292ZXJyaWRlVGVtcGxhdGVVc2luZ1Rlc3RpbmdNb2R1bGUnLCAnb3ZlcnJpZGUgdGVtcGxhdGUnKTtcblxuICAgIEBDb21wb25lbnQoe3NlbGVjdG9yOiAnZW1wdHknLCB0ZW1wbGF0ZSwgaml0OiB0cnVlfSlcbiAgICBjbGFzcyBPdmVycmlkZUNvbXBvbmVudCB7XG4gICAgfVxuXG4gICAgdGhpcy5fdGVtcGxhdGVPdmVycmlkZXMucHVzaCh7Y29tcG9uZW50LCB0ZW1wbGF0ZU9mOiBPdmVycmlkZUNvbXBvbmVudH0pO1xuICB9XG5cbiAgY3JlYXRlQ29tcG9uZW50PFQ+KGNvbXBvbmVudDogVHlwZTxUPik6IENvbXBvbmVudEZpeHR1cmU8VD4ge1xuICAgIHRoaXMuX2luaXRJZk5lZWRlZCgpO1xuICAgIGNvbnN0IGNvbXBvbmVudEZhY3RvcnkgPSB0aGlzLl9jb21waWxlci5nZXRDb21wb25lbnRGYWN0b3J5KGNvbXBvbmVudCk7XG5cbiAgICBpZiAoIWNvbXBvbmVudEZhY3RvcnkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICBgQ2Fubm90IGNyZWF0ZSB0aGUgY29tcG9uZW50ICR7c3RyaW5naWZ5KGNvbXBvbmVudCl9IGFzIGl0IHdhcyBub3QgaW1wb3J0ZWQgaW50byB0aGUgdGVzdGluZyBtb2R1bGUhYCk7XG4gICAgfVxuXG4gICAgY29uc3Qgbm9OZ1pvbmUgPSB0aGlzLmdldChDb21wb25lbnRGaXh0dXJlTm9OZ1pvbmUsIGZhbHNlKTtcbiAgICBjb25zdCBhdXRvRGV0ZWN0OiBib29sZWFuID0gdGhpcy5nZXQoQ29tcG9uZW50Rml4dHVyZUF1dG9EZXRlY3QsIGZhbHNlKTtcbiAgICBjb25zdCBuZ1pvbmU6IE5nWm9uZSA9IG5vTmdab25lID8gbnVsbCA6IHRoaXMuZ2V0KE5nWm9uZSwgbnVsbCk7XG4gICAgY29uc3QgdGVzdENvbXBvbmVudFJlbmRlcmVyOiBUZXN0Q29tcG9uZW50UmVuZGVyZXIgPSB0aGlzLmdldChUZXN0Q29tcG9uZW50UmVuZGVyZXIpO1xuICAgIGNvbnN0IHJvb3RFbElkID0gYHJvb3Qke19uZXh0Um9vdEVsZW1lbnRJZCsrfWA7XG4gICAgdGVzdENvbXBvbmVudFJlbmRlcmVyLmluc2VydFJvb3RFbGVtZW50KHJvb3RFbElkKTtcblxuICAgIGNvbnN0IGluaXRDb21wb25lbnQgPSAoKSA9PiB7XG4gICAgICBjb25zdCBjb21wb25lbnRSZWYgPVxuICAgICAgICAgIGNvbXBvbmVudEZhY3RvcnkuY3JlYXRlKEluamVjdG9yLk5VTEwsIFtdLCBgIyR7cm9vdEVsSWR9YCwgdGhpcy5fbW9kdWxlUmVmKTtcbiAgICAgIHJldHVybiBuZXcgQ29tcG9uZW50Rml4dHVyZTxUPihjb21wb25lbnRSZWYsIG5nWm9uZSwgYXV0b0RldGVjdCk7XG4gICAgfTtcblxuICAgIGNvbnN0IGZpeHR1cmUgPSAhbmdab25lID8gaW5pdENvbXBvbmVudCgpIDogbmdab25lLnJ1bihpbml0Q29tcG9uZW50KTtcbiAgICB0aGlzLl9hY3RpdmVGaXh0dXJlcy5wdXNoKGZpeHR1cmUpO1xuICAgIHJldHVybiBmaXh0dXJlO1xuICB9XG59XG5cbi8qKlxuICogQGRlc2NyaXB0aW9uXG4gKiBDb25maWd1cmVzIGFuZCBpbml0aWFsaXplcyBlbnZpcm9ubWVudCBmb3IgdW5pdCB0ZXN0aW5nIGFuZCBwcm92aWRlcyBtZXRob2RzIGZvclxuICogY3JlYXRpbmcgY29tcG9uZW50cyBhbmQgc2VydmljZXMgaW4gdW5pdCB0ZXN0cy5cbiAqXG4gKiBgVGVzdEJlZGAgaXMgdGhlIHByaW1hcnkgYXBpIGZvciB3cml0aW5nIHVuaXQgdGVzdHMgZm9yIEFuZ3VsYXIgYXBwbGljYXRpb25zIGFuZCBsaWJyYXJpZXMuXG4gKlxuICogTm90ZTogVXNlIGBUZXN0QmVkYCBpbiB0ZXN0cy4gSXQgd2lsbCBiZSBzZXQgdG8gZWl0aGVyIGBUZXN0QmVkVmlld0VuZ2luZWAgb3IgYFRlc3RCZWRSZW5kZXIzYFxuICogYWNjb3JkaW5nIHRvIHRoZSBjb21waWxlciB1c2VkLlxuICovXG5leHBvcnQgY29uc3QgVGVzdEJlZCA9IGl2eUVuYWJsZWQgPyBUZXN0QmVkUmVuZGVyMyA6IFRlc3RCZWRWaWV3RW5naW5lO1xuXG4vKipcbiAqIFJldHVybnMgYSBzaW5nbGV0b24gb2YgdGhlIGFwcGxpY2FibGUgYFRlc3RCZWRgLlxuICpcbiAqIEl0IHdpbGwgYmUgZWl0aGVyIGFuIGluc3RhbmNlIG9mIGBUZXN0QmVkVmlld0VuZ2luZWAgb3IgYFRlc3RCZWRSZW5kZXIzYC5cbiAqXG4gKiBAZXhwZXJpbWVudGFsXG4gKi9cbmV4cG9ydCBjb25zdCBnZXRUZXN0QmVkOiAoKSA9PiBUZXN0QmVkUmVuZGVyMyB8IFRlc3RCZWRWaWV3RW5naW5lID1cbiAgICBpdnlFbmFibGVkID8gX2dldFRlc3RCZWRSZW5kZXIzIDogX2dldFRlc3RCZWRWaWV3RW5naW5lO1xuXG5sZXQgdGVzdEJlZDogVGVzdEJlZFZpZXdFbmdpbmU7XG5cbmZ1bmN0aW9uIF9nZXRUZXN0QmVkVmlld0VuZ2luZSgpOiBUZXN0QmVkVmlld0VuZ2luZSB7XG4gIHJldHVybiB0ZXN0QmVkID0gdGVzdEJlZCB8fCBuZXcgVGVzdEJlZFZpZXdFbmdpbmUoKTtcbn1cblxuLyoqXG4gKiBBbGxvd3MgaW5qZWN0aW5nIGRlcGVuZGVuY2llcyBpbiBgYmVmb3JlRWFjaCgpYCBhbmQgYGl0KClgLlxuICpcbiAqIEV4YW1wbGU6XG4gKlxuICogYGBgXG4gKiBiZWZvcmVFYWNoKGluamVjdChbRGVwZW5kZW5jeSwgQUNsYXNzXSwgKGRlcCwgb2JqZWN0KSA9PiB7XG4gKiAgIC8vIHNvbWUgY29kZSB0aGF0IHVzZXMgYGRlcGAgYW5kIGBvYmplY3RgXG4gKiAgIC8vIC4uLlxuICogfSkpO1xuICpcbiAqIGl0KCcuLi4nLCBpbmplY3QoW0FDbGFzc10sIChvYmplY3QpID0+IHtcbiAqICAgb2JqZWN0LmRvU29tZXRoaW5nKCk7XG4gKiAgIGV4cGVjdCguLi4pO1xuICogfSlcbiAqIGBgYFxuICpcbiAqIE5vdGVzOlxuICogLSBpbmplY3QgaXMgY3VycmVudGx5IGEgZnVuY3Rpb24gYmVjYXVzZSBvZiBzb21lIFRyYWNldXIgbGltaXRhdGlvbiB0aGUgc3ludGF4IHNob3VsZFxuICogZXZlbnR1YWxseVxuICogICBiZWNvbWVzIGBpdCgnLi4uJywgQEluamVjdCAob2JqZWN0OiBBQ2xhc3MsIGFzeW5jOiBBc3luY1Rlc3RDb21wbGV0ZXIpID0+IHsgLi4uIH0pO2BcbiAqXG4gKlxuICovXG5leHBvcnQgZnVuY3Rpb24gaW5qZWN0KHRva2VuczogYW55W10sIGZuOiBGdW5jdGlvbik6ICgpID0+IGFueSB7XG4gIGNvbnN0IHRlc3RCZWQgPSBnZXRUZXN0QmVkKCk7XG4gIGlmICh0b2tlbnMuaW5kZXhPZihBc3luY1Rlc3RDb21wbGV0ZXIpID49IDApIHtcbiAgICAvLyBOb3QgdXNpbmcgYW4gYXJyb3cgZnVuY3Rpb24gdG8gcHJlc2VydmUgY29udGV4dCBwYXNzZWQgZnJvbSBjYWxsIHNpdGVcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAvLyBSZXR1cm4gYW4gYXN5bmMgdGVzdCBtZXRob2QgdGhhdCByZXR1cm5zIGEgUHJvbWlzZSBpZiBBc3luY1Rlc3RDb21wbGV0ZXIgaXMgb25lIG9mXG4gICAgICAvLyB0aGUgaW5qZWN0ZWQgdG9rZW5zLlxuICAgICAgcmV0dXJuIHRlc3RCZWQuY29tcGlsZUNvbXBvbmVudHMoKS50aGVuKCgpID0+IHtcbiAgICAgICAgY29uc3QgY29tcGxldGVyOiBBc3luY1Rlc3RDb21wbGV0ZXIgPSB0ZXN0QmVkLmdldChBc3luY1Rlc3RDb21wbGV0ZXIpO1xuICAgICAgICB0ZXN0QmVkLmV4ZWN1dGUodG9rZW5zLCBmbiwgdGhpcyk7XG4gICAgICAgIHJldHVybiBjb21wbGV0ZXIucHJvbWlzZTtcbiAgICAgIH0pO1xuICAgIH07XG4gIH0gZWxzZSB7XG4gICAgLy8gTm90IHVzaW5nIGFuIGFycm93IGZ1bmN0aW9uIHRvIHByZXNlcnZlIGNvbnRleHQgcGFzc2VkIGZyb20gY2FsbCBzaXRlXG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkgeyByZXR1cm4gdGVzdEJlZC5leGVjdXRlKHRva2VucywgZm4sIHRoaXMpOyB9O1xuICB9XG59XG5cbi8qKlxuICogQGV4cGVyaW1lbnRhbFxuICovXG5leHBvcnQgY2xhc3MgSW5qZWN0U2V0dXBXcmFwcGVyIHtcbiAgY29uc3RydWN0b3IocHJpdmF0ZSBfbW9kdWxlRGVmOiAoKSA9PiBUZXN0TW9kdWxlTWV0YWRhdGEpIHt9XG5cbiAgcHJpdmF0ZSBfYWRkTW9kdWxlKCkge1xuICAgIGNvbnN0IG1vZHVsZURlZiA9IHRoaXMuX21vZHVsZURlZigpO1xuICAgIGlmIChtb2R1bGVEZWYpIHtcbiAgICAgIGdldFRlc3RCZWQoKS5jb25maWd1cmVUZXN0aW5nTW9kdWxlKG1vZHVsZURlZik7XG4gICAgfVxuICB9XG5cbiAgaW5qZWN0KHRva2VuczogYW55W10sIGZuOiBGdW5jdGlvbik6ICgpID0+IGFueSB7XG4gICAgY29uc3Qgc2VsZiA9IHRoaXM7XG4gICAgLy8gTm90IHVzaW5nIGFuIGFycm93IGZ1bmN0aW9uIHRvIHByZXNlcnZlIGNvbnRleHQgcGFzc2VkIGZyb20gY2FsbCBzaXRlXG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgc2VsZi5fYWRkTW9kdWxlKCk7XG4gICAgICByZXR1cm4gaW5qZWN0KHRva2VucywgZm4pLmNhbGwodGhpcyk7XG4gICAgfTtcbiAgfVxufVxuXG4vKipcbiAqIEBleHBlcmltZW50YWxcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHdpdGhNb2R1bGUobW9kdWxlRGVmOiBUZXN0TW9kdWxlTWV0YWRhdGEpOiBJbmplY3RTZXR1cFdyYXBwZXI7XG5leHBvcnQgZnVuY3Rpb24gd2l0aE1vZHVsZShtb2R1bGVEZWY6IFRlc3RNb2R1bGVNZXRhZGF0YSwgZm46IEZ1bmN0aW9uKTogKCkgPT4gYW55O1xuZXhwb3J0IGZ1bmN0aW9uIHdpdGhNb2R1bGUobW9kdWxlRGVmOiBUZXN0TW9kdWxlTWV0YWRhdGEsIGZuPzogRnVuY3Rpb24gfCBudWxsKTogKCgpID0+IGFueSl8XG4gICAgSW5qZWN0U2V0dXBXcmFwcGVyIHtcbiAgaWYgKGZuKSB7XG4gICAgLy8gTm90IHVzaW5nIGFuIGFycm93IGZ1bmN0aW9uIHRvIHByZXNlcnZlIGNvbnRleHQgcGFzc2VkIGZyb20gY2FsbCBzaXRlXG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgY29uc3QgdGVzdEJlZCA9IGdldFRlc3RCZWQoKTtcbiAgICAgIGlmIChtb2R1bGVEZWYpIHtcbiAgICAgICAgdGVzdEJlZC5jb25maWd1cmVUZXN0aW5nTW9kdWxlKG1vZHVsZURlZik7XG4gICAgICB9XG4gICAgICByZXR1cm4gZm4uYXBwbHkodGhpcyk7XG4gICAgfTtcbiAgfVxuICByZXR1cm4gbmV3IEluamVjdFNldHVwV3JhcHBlcigoKSA9PiBtb2R1bGVEZWYpO1xufSJdfQ==