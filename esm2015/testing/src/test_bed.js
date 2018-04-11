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
const UNDEFINED = new Object();
/**
 * An abstract class for inserting the root test component element in a platform independent way.
 *
 * @experimental
 */
export class TestComponentRenderer {
    insertRootElement(rootElementId) { }
}
let _nextRootElementId = 0;
/**
 * @experimental
 */
export const ComponentFixtureAutoDetect = new InjectionToken('ComponentFixtureAutoDetect');
/**
 * @experimental
 */
export const ComponentFixtureNoNgZone = new InjectionToken('ComponentFixtureNoNgZone');
/**
 * @description
 * Configures and initializes environment for unit testing and provides methods for
 * creating components and services in unit tests.
 *
 * TestBed is the primary api for writing unit tests for Angular applications and libraries.
 *
 *
 */
export class TestBed {
    constructor() {
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
        this._testEnvAotSummaries = () => [];
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
    static initTestEnvironment(ngModule, platform, aotSummaries) {
        const testBed = getTestBed();
        testBed.initTestEnvironment(ngModule, platform, aotSummaries);
        return testBed;
    }
    /**
       * Reset the providers for the test injector.
       *
       * @experimental
       */
    static resetTestEnvironment() { getTestBed().resetTestEnvironment(); }
    static resetTestingModule() {
        getTestBed().resetTestingModule();
        return TestBed;
    }
    /**
       * Allows overriding default compiler providers and settings
       * which are defined in test_injector.js
       */
    static configureCompiler(config) {
        getTestBed().configureCompiler(config);
        return TestBed;
    }
    /**
       * Allows overriding default providers, directives, pipes, modules of the test injector,
       * which are defined in test_injector.js
       */
    static configureTestingModule(moduleDef) {
        getTestBed().configureTestingModule(moduleDef);
        return TestBed;
    }
    /**
       * Compile components with a `templateUrl` for the test's NgModule.
       * It is necessary to call this function
       * as fetching urls is asynchronous.
       */
    static compileComponents() { return getTestBed().compileComponents(); }
    static overrideModule(ngModule, override) {
        getTestBed().overrideModule(ngModule, override);
        return TestBed;
    }
    static overrideComponent(component, override) {
        getTestBed().overrideComponent(component, override);
        return TestBed;
    }
    static overrideDirective(directive, override) {
        getTestBed().overrideDirective(directive, override);
        return TestBed;
    }
    static overridePipe(pipe, override) {
        getTestBed().overridePipe(pipe, override);
        return TestBed;
    }
    static overrideTemplate(component, template) {
        getTestBed().overrideComponent(component, { set: { template, templateUrl: (null) } });
        return TestBed;
    }
    /**
       * Overrides the template of the given component, compiling the template
       * in the context of the TestingModule.
       *
       * Note: This works for JIT and AOTed components as well.
       */
    static overrideTemplateUsingTestingModule(component, template) {
        getTestBed().overrideTemplateUsingTestingModule(component, template);
        return TestBed;
    }
    static overrideProvider(token, provider) {
        getTestBed().overrideProvider(token, provider);
        return TestBed;
    }
    static deprecatedOverrideProvider(token, provider) {
        getTestBed().deprecatedOverrideProvider(token, provider);
        return TestBed;
    }
    static get(token, notFoundValue = Injector.THROW_IF_NOT_FOUND) {
        return getTestBed().get(token, notFoundValue);
    }
    static createComponent(component) {
        return getTestBed().createComponent(component);
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
       * @experimental
       */
    resetTestEnvironment() {
        this.resetTestingModule();
        this.platform = (null);
        this.ngModule = (null);
        this._testEnvAotSummaries = () => [];
    }
    resetTestingModule() {
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
    configureCompiler(config) {
        this._assertNotInstantiated('TestBed.configureCompiler', 'configure the compiler');
        this._compilerOptions.push(config);
    }
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
    compileComponents() {
        if (this._moduleFactory || this._instantiated) {
            return Promise.resolve(null);
        }
        const moduleType = this._createCompilerAndModule();
        return this._compiler.compileModuleAndAllComponentsAsync(moduleType)
            .then((moduleAndComponentFactories) => {
            this._moduleFactory = moduleAndComponentFactories.ngModuleFactory;
        });
    }
    _initIfNeeded() {
        if (this._instantiated) {
            return;
        }
        if (!this._moduleFactory) {
            try {
                const moduleType = this._createCompilerAndModule();
                this._moduleFactory =
                    this._compiler.compileModuleAndAllComponentsSync(moduleType).ngModuleFactory;
            }
            catch (e) {
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
            const compFactory = this._compiler.getComponentFactory(templateOf);
            overrideComponentView(component, compFactory);
        }
        const ngZone = new NgZone({ enableLongStackTrace: true });
        const providers = [{ provide: NgZone, useValue: ngZone }];
        const ngZoneInjector = Injector.create({
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
    }
    _createCompilerAndModule() {
        const providers = this._providers.concat([{ provide: TestBed, useValue: this }]);
        const declarations = [...this._declarations, ...this._templateOverrides.map(entry => entry.templateOf)];
        const rootScopeImports = [];
        const rootProviderOverrides = this._rootProviderOverrides;
        if (this._isRoot) {
            class RootScopeModule {
            }
            RootScopeModule.decorators = [
                { type: NgModule, args: [{
                            providers: [
                                ...rootProviderOverrides,
                            ],
                        },] },
            ];
            /** @nocollapse */
            RootScopeModule.ctorParameters = () => [];
            rootScopeImports.push(RootScopeModule);
        }
        providers.push({ provide: APP_ROOT, useValue: this._isRoot });
        const imports = [rootScopeImports, this.ngModule, this._imports];
        const schemas = this._schemas;
        class DynamicTestModule {
        }
        DynamicTestModule.decorators = [
            { type: NgModule, args: [{ providers, declarations, imports, schemas },] },
        ];
        /** @nocollapse */
        DynamicTestModule.ctorParameters = () => [];
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
    _assertNotInstantiated(methodName, methodDescription) {
        if (this._instantiated) {
            throw new Error(`Cannot ${methodDescription} when the test module has already been instantiated. ` +
                `Make sure you are not using \`inject\` before \`${methodName}\`.`);
        }
    }
    get(token, notFoundValue = Injector.THROW_IF_NOT_FOUND) {
        this._initIfNeeded();
        if (token === TestBed) {
            return this;
        }
        // Tests can inject things from the ng module and from the compiler,
        // but the ng module can't inject things from the compiler and vice versa.
        const result = this._moduleRef.injector.get(token, UNDEFINED);
        return result === UNDEFINED ? this._compiler.injector.get(token, notFoundValue) : result;
    }
    execute(tokens, fn, context) {
        this._initIfNeeded();
        const params = tokens.map(t => this.get(t));
        return fn.apply(context, params);
    }
    overrideModule(ngModule, override) {
        this._assertNotInstantiated('overrideModule', 'override module metadata');
        this._moduleOverrides.push([ngModule, override]);
    }
    overrideComponent(component, override) {
        this._assertNotInstantiated('overrideComponent', 'override component metadata');
        this._componentOverrides.push([component, override]);
    }
    overrideDirective(directive, override) {
        this._assertNotInstantiated('overrideDirective', 'override directive metadata');
        this._directiveOverrides.push([directive, override]);
    }
    overridePipe(pipe, override) {
        this._assertNotInstantiated('overridePipe', 'override pipe metadata');
        this._pipeOverrides.push([pipe, override]);
    }
    overrideProvider(token, provider) {
        this.overrideProviderImpl(token, provider);
    }
    deprecatedOverrideProvider(token, provider) {
        this.overrideProviderImpl(token, provider, /* deprecated */ /* deprecated */ true);
    }
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
        let flags = 0;
        let value;
        if (provider.useFactory) {
            flags |= 1024 /* TypeFactoryProvider */;
            value = provider.useFactory;
        }
        else {
            flags |= 256 /* TypeValueProvider */;
            value = provider.useValue;
        }
        const deps = (provider.deps || []).map((dep) => {
            let depFlags = 0 /* None */;
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
    overrideTemplateUsingTestingModule(component, template) {
        this._assertNotInstantiated('overrideTemplateUsingTestingModule', 'override template');
        class OverrideComponent {
        }
        OverrideComponent.decorators = [
            { type: Component, args: [{ selector: 'empty', template },] },
        ];
        /** @nocollapse */
        OverrideComponent.ctorParameters = () => [];
        this._templateOverrides.push({ component, templateOf: OverrideComponent });
    }
    createComponent(component) {
        this._initIfNeeded();
        const componentFactory = this._compiler.getComponentFactory(component);
        if (!componentFactory) {
            throw new Error(`Cannot create the component ${stringify(component)} as it was not imported into the testing module!`);
        }
        const noNgZone = this.get(ComponentFixtureNoNgZone, false);
        const autoDetect = this.get(ComponentFixtureAutoDetect, false);
        const ngZone = noNgZone ? null : this.get(NgZone, null);
        const testComponentRenderer = this.get(TestComponentRenderer);
        const rootElId = `root${_nextRootElementId++}`;
        testComponentRenderer.insertRootElement(rootElId);
        const initComponent = () => {
            const componentRef = componentFactory.create(Injector.NULL, [], `#${rootElId}`, this._moduleRef);
            return new ComponentFixture(componentRef, ngZone, autoDetect);
        };
        const fixture = !ngZone ? initComponent() : ngZone.run(initComponent);
        this._activeFixtures.push(fixture);
        return fixture;
    }
}
let _testBed = (null);
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
    const testBed = getTestBed();
    if (tokens.indexOf(AsyncTestCompleter) >= 0) {
        // Not using an arrow function to preserve context passed from call site
        return function () {
            // Return an async test method that returns a Promise if AsyncTestCompleter is one of
            // the injected tokens.
            return testBed.compileComponents().then(() => {
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
 * @experimental
 */
export class InjectSetupWrapper {
    constructor(_moduleDef) {
        this._moduleDef = _moduleDef;
    }
    _addModule() {
        const moduleDef = this._moduleDef();
        if (moduleDef) {
            getTestBed().configureTestingModule(moduleDef);
        }
    }
    inject(tokens, fn) {
        const self = this;
        // Not using an arrow function to preserve context passed from call site
        return function () {
            self._addModule();
            return inject(tokens, fn).call(this);
        };
    }
}
export function withModule(moduleDef, fn) {
    if (fn) {
        // Not using an arrow function to preserve context passed from call site
        return function () {
            const testBed = getTestBed();
            if (moduleDef) {
                testBed.configureTestingModule(moduleDef);
            }
            return fn.apply(this);
        };
    }
    return new InjectSetupWrapper(() => moduleDef);
}
//# sourceMappingURL=test_bed.js.map