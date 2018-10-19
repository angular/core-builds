/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as tslib_1 from "tslib";
import { ApplicationInitStatus, Component, Injector, NgModule, NgZone, Optional, SkipSelf, ɵAPP_ROOT as APP_ROOT, ɵclearOverrides as clearOverrides, ɵgetInjectableDef as getInjectableDef, ɵivyEnabled as ivyEnabled, ɵoverrideComponentView as overrideComponentView, ɵoverrideProvider as overrideProvider, ɵstringify as stringify } from '@angular/core';
import { AsyncTestCompleter } from './async_test_completer';
import { ComponentFixture } from './component_fixture';
import { TestBedRender3, _getTestBedRender3 } from './r3_test_bed';
import { ComponentFixtureAutoDetect, ComponentFixtureNoNgZone, TestComponentRenderer } from './test_bed_common';
import { TestingCompilerFactory } from './test_compiler';
const UNDEFINED = new Object();
let _nextRootElementId = 0;
/**
 * @description
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
     * @publicApi
     */
    static initTestEnvironment(ngModule, platform, aotSummaries) {
        const testBed = _getTestBedViewEngine();
        testBed.initTestEnvironment(ngModule, platform, aotSummaries);
        return testBed;
    }
    /**
     * Reset the providers for the test injector.
     *
     * @publicApi
     */
    static resetTestEnvironment() { _getTestBedViewEngine().resetTestEnvironment(); }
    static resetTestingModule() {
        _getTestBedViewEngine().resetTestingModule();
        return TestBedViewEngine;
    }
    /**
     * Allows overriding default compiler providers and settings
     * which are defined in test_injector.js
     */
    static configureCompiler(config) {
        _getTestBedViewEngine().configureCompiler(config);
        return TestBedViewEngine;
    }
    /**
     * Allows overriding default providers, directives, pipes, modules of the test injector,
     * which are defined in test_injector.js
     */
    static configureTestingModule(moduleDef) {
        _getTestBedViewEngine().configureTestingModule(moduleDef);
        return TestBedViewEngine;
    }
    /**
     * Compile components with a `templateUrl` for the test's NgModule.
     * It is necessary to call this function
     * as fetching urls is asynchronous.
     */
    static compileComponents() { return getTestBed().compileComponents(); }
    static overrideModule(ngModule, override) {
        _getTestBedViewEngine().overrideModule(ngModule, override);
        return TestBedViewEngine;
    }
    static overrideComponent(component, override) {
        _getTestBedViewEngine().overrideComponent(component, override);
        return TestBedViewEngine;
    }
    static overrideDirective(directive, override) {
        _getTestBedViewEngine().overrideDirective(directive, override);
        return TestBedViewEngine;
    }
    static overridePipe(pipe, override) {
        _getTestBedViewEngine().overridePipe(pipe, override);
        return TestBedViewEngine;
    }
    static overrideTemplate(component, template) {
        _getTestBedViewEngine().overrideComponent(component, { set: { template, templateUrl: null } });
        return TestBedViewEngine;
    }
    /**
     * Overrides the template of the given component, compiling the template
     * in the context of the TestingModule.
     *
     * Note: This works for JIT and AOTed components as well.
     */
    static overrideTemplateUsingTestingModule(component, template) {
        _getTestBedViewEngine().overrideTemplateUsingTestingModule(component, template);
        return TestBedViewEngine;
    }
    static overrideProvider(token, provider) {
        _getTestBedViewEngine().overrideProvider(token, provider);
        return TestBedViewEngine;
    }
    static deprecatedOverrideProvider(token, provider) {
        _getTestBedViewEngine().deprecatedOverrideProvider(token, provider);
        return TestBedViewEngine;
    }
    static get(token, notFoundValue = Injector.THROW_IF_NOT_FOUND) {
        return _getTestBedViewEngine().get(token, notFoundValue);
    }
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
     * '@angular/<platform_name>/testing'.
     *
     * @publicApi
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
     * @publicApi
     */
    resetTestEnvironment() {
        this.resetTestingModule();
        this.platform = null;
        this.ngModule = null;
        this._testEnvAotSummaries = () => [];
    }
    resetTestingModule() {
        clearOverrides();
        this._aotSummaries = [];
        this._templateOverrides = [];
        this._compiler = null;
        this._moduleOverrides = [];
        this._componentOverrides = [];
        this._directiveOverrides = [];
        this._pipeOverrides = [];
        this._isRoot = true;
        this._rootProviderOverrides = [];
        this._moduleRef = null;
        this._moduleFactory = null;
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
        this._moduleRef.injector.get(ApplicationInitStatus).runInitializers();
        this._instantiated = true;
    }
    _createCompilerAndModule() {
        const providers = this._providers.concat([{ provide: TestBed, useValue: this }]);
        const declarations = [...this._declarations, ...this._templateOverrides.map(entry => entry.templateOf)];
        const rootScopeImports = [];
        const rootProviderOverrides = this._rootProviderOverrides;
        if (this._isRoot) {
            let RootScopeModule = class RootScopeModule {
            };
            RootScopeModule = tslib_1.__decorate([
                NgModule({
                    providers: [
                        ...rootProviderOverrides,
                    ],
                    jit: true,
                })
            ], RootScopeModule);
            rootScopeImports.push(RootScopeModule);
        }
        providers.push({ provide: APP_ROOT, useValue: this._isRoot });
        const imports = [rootScopeImports, this.ngModule, this._imports];
        const schemas = this._schemas;
        let DynamicTestModule = class DynamicTestModule {
        };
        DynamicTestModule = tslib_1.__decorate([
            NgModule({ providers, declarations, imports, schemas, jit: true })
        ], DynamicTestModule);
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
        this.overrideProviderImpl(token, provider, /* deprecated */ true);
    }
    overrideProviderImpl(token, provider, deprecated = false) {
        let def = null;
        if (typeof token !== 'string' && (def = getInjectableDef(token)) && def.providedIn === 'root') {
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
        let OverrideComponent = class OverrideComponent {
        };
        OverrideComponent = tslib_1.__decorate([
            Component({ selector: 'empty', template, jit: true })
        ], OverrideComponent);
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
/**
 * @description
 * Configures and initializes environment for unit testing and provides methods for
 * creating components and services in unit tests.
 *
 * `TestBed` is the primary api for writing unit tests for Angular applications and libraries.
 *
 * Note: Use `TestBed` in tests. It will be set to either `TestBedViewEngine` or `TestBedRender3`
 * according to the compiler used.
 *
 * @publicApi
 */
export const TestBed = ivyEnabled ? TestBedRender3 : TestBedViewEngine;
/**
 * Returns a singleton of the applicable `TestBed`.
 *
 * It will be either an instance of `TestBedViewEngine` or `TestBedRender3`.
 *
 * @publicApi
 */
export const getTestBed = ivyEnabled ? _getTestBedRender3 : _getTestBedViewEngine;
let testBed;
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
 *   becomes `it('...', @Inject (object: AClass, async: AsyncTestCompleter) => { ... });`
 *
 * @publicApi
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
 * @publicApi
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdF9iZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3Rlc3Rpbmcvc3JjL3Rlc3RfYmVkLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7QUFFSCxPQUFPLEVBQUMscUJBQXFCLEVBQW1CLFNBQVMsRUFBYSxRQUFRLEVBQUUsUUFBUSxFQUFnQyxNQUFNLEVBQUUsUUFBUSxFQUErQyxRQUFRLEVBQXdCLFNBQVMsSUFBSSxRQUFRLEVBQW1GLGVBQWUsSUFBSSxjQUFjLEVBQTJFLGlCQUFpQixJQUFJLGdCQUFnQixFQUFFLFdBQVcsSUFBSSxVQUFVLEVBQUUsc0JBQXNCLElBQUkscUJBQXFCLEVBQUUsaUJBQWlCLElBQUksZ0JBQWdCLEVBQUUsVUFBVSxJQUFJLFNBQVMsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUVubkIsT0FBTyxFQUFDLGtCQUFrQixFQUFDLE1BQU0sd0JBQXdCLENBQUM7QUFDMUQsT0FBTyxFQUFDLGdCQUFnQixFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFFckQsT0FBTyxFQUFDLGNBQWMsRUFBRSxrQkFBa0IsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUNqRSxPQUFPLEVBQUMsMEJBQTBCLEVBQUUsd0JBQXdCLEVBQWlCLHFCQUFxQixFQUFxQixNQUFNLG1CQUFtQixDQUFDO0FBQ2pKLE9BQU8sRUFBa0Isc0JBQXNCLEVBQUMsTUFBTSxpQkFBaUIsQ0FBQztBQUV4RSxNQUFNLFNBQVMsR0FBRyxJQUFJLE1BQU0sRUFBRSxDQUFDO0FBRy9CLElBQUksa0JBQWtCLEdBQUcsQ0FBQyxDQUFDO0FBZ0YzQjs7Ozs7Ozs7O0dBU0c7QUFDSCxNQUFNLE9BQU8saUJBQWlCO0lBQTlCO1FBK0lVLGtCQUFhLEdBQVksS0FBSyxDQUFDO1FBRS9CLGNBQVMsR0FBb0IsSUFBTSxDQUFDO1FBQ3BDLGVBQVUsR0FBcUIsSUFBTSxDQUFDO1FBQ3RDLG1CQUFjLEdBQXlCLElBQU0sQ0FBQztRQUU5QyxxQkFBZ0IsR0FBc0IsRUFBRSxDQUFDO1FBRXpDLHFCQUFnQixHQUE4QyxFQUFFLENBQUM7UUFDakUsd0JBQW1CLEdBQStDLEVBQUUsQ0FBQztRQUNyRSx3QkFBbUIsR0FBK0MsRUFBRSxDQUFDO1FBQ3JFLG1CQUFjLEdBQTBDLEVBQUUsQ0FBQztRQUUzRCxlQUFVLEdBQWUsRUFBRSxDQUFDO1FBQzVCLGtCQUFhLEdBQStCLEVBQUUsQ0FBQztRQUMvQyxhQUFRLEdBQStCLEVBQUUsQ0FBQztRQUMxQyxhQUFRLEdBQWdDLEVBQUUsQ0FBQztRQUMzQyxvQkFBZSxHQUE0QixFQUFFLENBQUM7UUFFOUMseUJBQW9CLEdBQWdCLEdBQUcsRUFBRSxDQUFDLEVBQUUsQ0FBQztRQUM3QyxrQkFBYSxHQUF1QixFQUFFLENBQUM7UUFDdkMsdUJBQWtCLEdBQXlELEVBQUUsQ0FBQztRQUU5RSxZQUFPLEdBQVksSUFBSSxDQUFDO1FBQ3hCLDJCQUFzQixHQUFlLEVBQUUsQ0FBQztRQUVoRCxhQUFRLEdBQWdCLElBQU0sQ0FBQztRQUUvQixhQUFRLEdBQTBCLElBQU0sQ0FBQztJQXlWM0MsQ0FBQztJQW5nQkM7Ozs7Ozs7Ozs7OztPQVlHO0lBQ0gsTUFBTSxDQUFDLG1CQUFtQixDQUN0QixRQUErQixFQUFFLFFBQXFCLEVBQ3RELFlBQTBCO1FBQzVCLE1BQU0sT0FBTyxHQUFHLHFCQUFxQixFQUFFLENBQUM7UUFDeEMsT0FBTyxDQUFDLG1CQUFtQixDQUFDLFFBQVEsRUFBRSxRQUFRLEVBQUUsWUFBWSxDQUFDLENBQUM7UUFDOUQsT0FBTyxPQUFPLENBQUM7SUFDakIsQ0FBQztJQUVEOzs7O09BSUc7SUFDSCxNQUFNLENBQUMsb0JBQW9CLEtBQVcscUJBQXFCLEVBQUUsQ0FBQyxvQkFBb0IsRUFBRSxDQUFDLENBQUMsQ0FBQztJQUV2RixNQUFNLENBQUMsa0JBQWtCO1FBQ3ZCLHFCQUFxQixFQUFFLENBQUMsa0JBQWtCLEVBQUUsQ0FBQztRQUM3QyxPQUFPLGlCQUF5QyxDQUFDO0lBQ25ELENBQUM7SUFFRDs7O09BR0c7SUFDSCxNQUFNLENBQUMsaUJBQWlCLENBQUMsTUFBOEM7UUFDckUscUJBQXFCLEVBQUUsQ0FBQyxpQkFBaUIsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUNsRCxPQUFPLGlCQUF5QyxDQUFDO0lBQ25ELENBQUM7SUFFRDs7O09BR0c7SUFDSCxNQUFNLENBQUMsc0JBQXNCLENBQUMsU0FBNkI7UUFDekQscUJBQXFCLEVBQUUsQ0FBQyxzQkFBc0IsQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUMxRCxPQUFPLGlCQUF5QyxDQUFDO0lBQ25ELENBQUM7SUFFRDs7OztPQUlHO0lBQ0gsTUFBTSxDQUFDLGlCQUFpQixLQUFtQixPQUFPLFVBQVUsRUFBRSxDQUFDLGlCQUFpQixFQUFFLENBQUMsQ0FBQyxDQUFDO0lBRXJGLE1BQU0sQ0FBQyxjQUFjLENBQUMsUUFBbUIsRUFBRSxRQUFvQztRQUM3RSxxQkFBcUIsRUFBRSxDQUFDLGNBQWMsQ0FBQyxRQUFRLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFDM0QsT0FBTyxpQkFBeUMsQ0FBQztJQUNuRCxDQUFDO0lBRUQsTUFBTSxDQUFDLGlCQUFpQixDQUFDLFNBQW9CLEVBQUUsUUFBcUM7UUFFbEYscUJBQXFCLEVBQUUsQ0FBQyxpQkFBaUIsQ0FBQyxTQUFTLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFDL0QsT0FBTyxpQkFBeUMsQ0FBQztJQUNuRCxDQUFDO0lBRUQsTUFBTSxDQUFDLGlCQUFpQixDQUFDLFNBQW9CLEVBQUUsUUFBcUM7UUFFbEYscUJBQXFCLEVBQUUsQ0FBQyxpQkFBaUIsQ0FBQyxTQUFTLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFDL0QsT0FBTyxpQkFBeUMsQ0FBQztJQUNuRCxDQUFDO0lBRUQsTUFBTSxDQUFDLFlBQVksQ0FBQyxJQUFlLEVBQUUsUUFBZ0M7UUFDbkUscUJBQXFCLEVBQUUsQ0FBQyxZQUFZLENBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBQ3JELE9BQU8saUJBQXlDLENBQUM7SUFDbkQsQ0FBQztJQUVELE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxTQUFvQixFQUFFLFFBQWdCO1FBQzVELHFCQUFxQixFQUFFLENBQUMsaUJBQWlCLENBQUMsU0FBUyxFQUFFLEVBQUMsR0FBRyxFQUFFLEVBQUMsUUFBUSxFQUFFLFdBQVcsRUFBRSxJQUFNLEVBQUMsRUFBQyxDQUFDLENBQUM7UUFDN0YsT0FBTyxpQkFBeUMsQ0FBQztJQUNuRCxDQUFDO0lBRUQ7Ozs7O09BS0c7SUFDSCxNQUFNLENBQUMsa0NBQWtDLENBQUMsU0FBb0IsRUFBRSxRQUFnQjtRQUM5RSxxQkFBcUIsRUFBRSxDQUFDLGtDQUFrQyxDQUFDLFNBQVMsRUFBRSxRQUFRLENBQUMsQ0FBQztRQUNoRixPQUFPLGlCQUF5QyxDQUFDO0lBQ25ELENBQUM7SUFZRCxNQUFNLENBQUMsZ0JBQWdCLENBQUMsS0FBVSxFQUFFLFFBSW5DO1FBQ0MscUJBQXFCLEVBQUUsQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFLLEVBQUUsUUFBZSxDQUFDLENBQUM7UUFDakUsT0FBTyxpQkFBeUMsQ0FBQztJQUNuRCxDQUFDO0lBWUQsTUFBTSxDQUFDLDBCQUEwQixDQUFDLEtBQVUsRUFBRSxRQUk3QztRQUNDLHFCQUFxQixFQUFFLENBQUMsMEJBQTBCLENBQUMsS0FBSyxFQUFFLFFBQWUsQ0FBQyxDQUFDO1FBQzNFLE9BQU8saUJBQXlDLENBQUM7SUFDbkQsQ0FBQztJQUVELE1BQU0sQ0FBQyxHQUFHLENBQUMsS0FBVSxFQUFFLGdCQUFxQixRQUFRLENBQUMsa0JBQWtCO1FBQ3JFLE9BQU8scUJBQXFCLEVBQUUsQ0FBQyxHQUFHLENBQUMsS0FBSyxFQUFFLGFBQWEsQ0FBQyxDQUFDO0lBQzNELENBQUM7SUFFRCxNQUFNLENBQUMsZUFBZSxDQUFJLFNBQWtCO1FBQzFDLE9BQU8scUJBQXFCLEVBQUUsQ0FBQyxlQUFlLENBQUMsU0FBUyxDQUFDLENBQUM7SUFDNUQsQ0FBQztJQWdDRDs7Ozs7Ozs7Ozs7O09BWUc7SUFDSCxtQkFBbUIsQ0FDZixRQUErQixFQUFFLFFBQXFCLEVBQUUsWUFBMEI7UUFDcEYsSUFBSSxJQUFJLENBQUMsUUFBUSxJQUFJLElBQUksQ0FBQyxRQUFRLEVBQUU7WUFDbEMsTUFBTSxJQUFJLEtBQUssQ0FBQyw4REFBOEQsQ0FBQyxDQUFDO1NBQ2pGO1FBQ0QsSUFBSSxDQUFDLFFBQVEsR0FBRyxRQUFRLENBQUM7UUFDekIsSUFBSSxDQUFDLFFBQVEsR0FBRyxRQUFRLENBQUM7UUFDekIsSUFBSSxZQUFZLEVBQUU7WUFDaEIsSUFBSSxDQUFDLG9CQUFvQixHQUFHLFlBQVksQ0FBQztTQUMxQztJQUNILENBQUM7SUFFRDs7OztPQUlHO0lBQ0gsb0JBQW9CO1FBQ2xCLElBQUksQ0FBQyxrQkFBa0IsRUFBRSxDQUFDO1FBQzFCLElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBTSxDQUFDO1FBQ3ZCLElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBTSxDQUFDO1FBQ3ZCLElBQUksQ0FBQyxvQkFBb0IsR0FBRyxHQUFHLEVBQUUsQ0FBQyxFQUFFLENBQUM7SUFDdkMsQ0FBQztJQUVELGtCQUFrQjtRQUNoQixjQUFjLEVBQUUsQ0FBQztRQUNqQixJQUFJLENBQUMsYUFBYSxHQUFHLEVBQUUsQ0FBQztRQUN4QixJQUFJLENBQUMsa0JBQWtCLEdBQUcsRUFBRSxDQUFDO1FBQzdCLElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBTSxDQUFDO1FBQ3hCLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxFQUFFLENBQUM7UUFDM0IsSUFBSSxDQUFDLG1CQUFtQixHQUFHLEVBQUUsQ0FBQztRQUM5QixJQUFJLENBQUMsbUJBQW1CLEdBQUcsRUFBRSxDQUFDO1FBQzlCLElBQUksQ0FBQyxjQUFjLEdBQUcsRUFBRSxDQUFDO1FBRXpCLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDO1FBQ3BCLElBQUksQ0FBQyxzQkFBc0IsR0FBRyxFQUFFLENBQUM7UUFFakMsSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFNLENBQUM7UUFDekIsSUFBSSxDQUFDLGNBQWMsR0FBRyxJQUFNLENBQUM7UUFDN0IsSUFBSSxDQUFDLGdCQUFnQixHQUFHLEVBQUUsQ0FBQztRQUMzQixJQUFJLENBQUMsVUFBVSxHQUFHLEVBQUUsQ0FBQztRQUNyQixJQUFJLENBQUMsYUFBYSxHQUFHLEVBQUUsQ0FBQztRQUN4QixJQUFJLENBQUMsUUFBUSxHQUFHLEVBQUUsQ0FBQztRQUNuQixJQUFJLENBQUMsUUFBUSxHQUFHLEVBQUUsQ0FBQztRQUNuQixJQUFJLENBQUMsYUFBYSxHQUFHLEtBQUssQ0FBQztRQUMzQixJQUFJLENBQUMsZUFBZSxDQUFDLE9BQU8sQ0FBQyxDQUFDLE9BQU8sRUFBRSxFQUFFO1lBQ3ZDLElBQUk7Z0JBQ0YsT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDO2FBQ25CO1lBQUMsT0FBTyxDQUFDLEVBQUU7Z0JBQ1YsT0FBTyxDQUFDLEtBQUssQ0FBQyxtQ0FBbUMsRUFBRTtvQkFDakQsU0FBUyxFQUFFLE9BQU8sQ0FBQyxpQkFBaUI7b0JBQ3BDLFVBQVUsRUFBRSxDQUFDO2lCQUNkLENBQUMsQ0FBQzthQUNKO1FBQ0gsQ0FBQyxDQUFDLENBQUM7UUFDSCxJQUFJLENBQUMsZUFBZSxHQUFHLEVBQUUsQ0FBQztJQUM1QixDQUFDO0lBRUQsaUJBQWlCLENBQUMsTUFBNkM7UUFDN0QsSUFBSSxDQUFDLHNCQUFzQixDQUFDLDJCQUEyQixFQUFFLHdCQUF3QixDQUFDLENBQUM7UUFDbkYsSUFBSSxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUNyQyxDQUFDO0lBRUQsc0JBQXNCLENBQUMsU0FBNkI7UUFDbEQsSUFBSSxDQUFDLHNCQUFzQixDQUFDLGdDQUFnQyxFQUFFLDJCQUEyQixDQUFDLENBQUM7UUFDM0YsSUFBSSxTQUFTLENBQUMsU0FBUyxFQUFFO1lBQ3ZCLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLEdBQUcsU0FBUyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1NBQzlDO1FBQ0QsSUFBSSxTQUFTLENBQUMsWUFBWSxFQUFFO1lBQzFCLElBQUksQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLEdBQUcsU0FBUyxDQUFDLFlBQVksQ0FBQyxDQUFDO1NBQ3BEO1FBQ0QsSUFBSSxTQUFTLENBQUMsT0FBTyxFQUFFO1lBQ3JCLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEdBQUcsU0FBUyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1NBQzFDO1FBQ0QsSUFBSSxTQUFTLENBQUMsT0FBTyxFQUFFO1lBQ3JCLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEdBQUcsU0FBUyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1NBQzFDO1FBQ0QsSUFBSSxTQUFTLENBQUMsWUFBWSxFQUFFO1lBQzFCLElBQUksQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxZQUFZLENBQUMsQ0FBQztTQUNqRDtJQUNILENBQUM7SUFFRCxpQkFBaUI7UUFDZixJQUFJLElBQUksQ0FBQyxjQUFjLElBQUksSUFBSSxDQUFDLGFBQWEsRUFBRTtZQUM3QyxPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7U0FDOUI7UUFFRCxNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsd0JBQXdCLEVBQUUsQ0FBQztRQUNuRCxPQUFPLElBQUksQ0FBQyxTQUFTLENBQUMsa0NBQWtDLENBQUMsVUFBVSxDQUFDO2FBQy9ELElBQUksQ0FBQyxDQUFDLDJCQUEyQixFQUFFLEVBQUU7WUFDcEMsSUFBSSxDQUFDLGNBQWMsR0FBRywyQkFBMkIsQ0FBQyxlQUFlLENBQUM7UUFDcEUsQ0FBQyxDQUFDLENBQUM7SUFDVCxDQUFDO0lBRU8sYUFBYTtRQUNuQixJQUFJLElBQUksQ0FBQyxhQUFhLEVBQUU7WUFDdEIsT0FBTztTQUNSO1FBQ0QsSUFBSSxDQUFDLElBQUksQ0FBQyxjQUFjLEVBQUU7WUFDeEIsSUFBSTtnQkFDRixNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsd0JBQXdCLEVBQUUsQ0FBQztnQkFDbkQsSUFBSSxDQUFDLGNBQWM7b0JBQ2YsSUFBSSxDQUFDLFNBQVMsQ0FBQyxpQ0FBaUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxlQUFlLENBQUM7YUFDbEY7WUFBQyxPQUFPLENBQUMsRUFBRTtnQkFDVixNQUFNLGFBQWEsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLHFCQUFxQixDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUM5RCxJQUFJLGFBQWEsRUFBRTtvQkFDakIsTUFBTSxJQUFJLEtBQUssQ0FDWCx1Q0FBdUMsU0FBUyxDQUFDLGFBQWEsQ0FBQyxnRkFBZ0Y7d0JBQy9JLDJEQUEyRCxDQUFDLENBQUM7aUJBQ2xFO3FCQUFNO29CQUNMLE1BQU0sQ0FBQyxDQUFDO2lCQUNUO2FBQ0Y7U0FDRjtRQUNELEtBQUssTUFBTSxFQUFDLFNBQVMsRUFBRSxVQUFVLEVBQUMsSUFBSSxJQUFJLENBQUMsa0JBQWtCLEVBQUU7WUFDN0QsTUFBTSxXQUFXLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxtQkFBbUIsQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUNuRSxxQkFBcUIsQ0FBQyxTQUFTLEVBQUUsV0FBVyxDQUFDLENBQUM7U0FDL0M7UUFFRCxNQUFNLE1BQU0sR0FBRyxJQUFJLE1BQU0sQ0FBQyxFQUFDLG9CQUFvQixFQUFFLElBQUksRUFBQyxDQUFDLENBQUM7UUFDeEQsTUFBTSxTQUFTLEdBQXFCLENBQUMsRUFBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLFFBQVEsRUFBRSxNQUFNLEVBQUMsQ0FBQyxDQUFDO1FBQzFFLE1BQU0sY0FBYyxHQUFHLFFBQVEsQ0FBQyxNQUFNLENBQUM7WUFDckMsU0FBUyxFQUFFLFNBQVM7WUFDcEIsTUFBTSxFQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsUUFBUTtZQUM5QixJQUFJLEVBQUUsSUFBSSxDQUFDLGNBQWMsQ0FBQyxVQUFVLENBQUMsSUFBSTtTQUMxQyxDQUFDLENBQUM7UUFDSCxJQUFJLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMsTUFBTSxDQUFDLGNBQWMsQ0FBQyxDQUFDO1FBQzdELHlGQUF5RjtRQUN6Rix1QkFBdUI7UUFDdEIsSUFBSSxDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLHFCQUFxQixDQUFTLENBQUMsZUFBZSxFQUFFLENBQUM7UUFDL0UsSUFBSSxDQUFDLGFBQWEsR0FBRyxJQUFJLENBQUM7SUFDNUIsQ0FBQztJQUVPLHdCQUF3QjtRQUM5QixNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUMsT0FBTyxFQUFFLE9BQU8sRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFDLENBQUMsQ0FBQyxDQUFDO1FBQy9FLE1BQU0sWUFBWSxHQUNkLENBQUMsR0FBRyxJQUFJLENBQUMsYUFBYSxFQUFFLEdBQUcsSUFBSSxDQUFDLGtCQUFrQixDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO1FBRXZGLE1BQU0sZ0JBQWdCLEdBQUcsRUFBRSxDQUFDO1FBQzVCLE1BQU0scUJBQXFCLEdBQUcsSUFBSSxDQUFDLHNCQUFzQixDQUFDO1FBQzFELElBQUksSUFBSSxDQUFDLE9BQU8sRUFBRTtZQU9oQixJQUFNLGVBQWUsR0FBckIsTUFBTSxlQUFlO2FBQ3BCLENBQUE7WUFESyxlQUFlO2dCQU5wQixRQUFRLENBQUM7b0JBQ1IsU0FBUyxFQUFFO3dCQUNULEdBQUcscUJBQXFCO3FCQUN6QjtvQkFDRCxHQUFHLEVBQUUsSUFBSTtpQkFDVixDQUFDO2VBQ0ksZUFBZSxDQUNwQjtZQUNELGdCQUFnQixDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsQ0FBQztTQUN4QztRQUNELFNBQVMsQ0FBQyxJQUFJLENBQUMsRUFBQyxPQUFPLEVBQUUsUUFBUSxFQUFFLFFBQVEsRUFBRSxJQUFJLENBQUMsT0FBTyxFQUFDLENBQUMsQ0FBQztRQUU1RCxNQUFNLE9BQU8sR0FBRyxDQUFDLGdCQUFnQixFQUFFLElBQUksQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ2pFLE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUM7UUFHOUIsSUFBTSxpQkFBaUIsR0FBdkIsTUFBTSxpQkFBaUI7U0FDdEIsQ0FBQTtRQURLLGlCQUFpQjtZQUR0QixRQUFRLENBQUMsRUFBQyxTQUFTLEVBQUUsWUFBWSxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBQyxDQUFDO1dBQzNELGlCQUFpQixDQUN0QjtRQUVELE1BQU0sZUFBZSxHQUNqQixJQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsc0JBQXNCLENBQUMsQ0FBQztRQUN2RCxJQUFJLENBQUMsU0FBUyxHQUFHLGVBQWUsQ0FBQyxxQkFBcUIsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztRQUM5RSxLQUFLLE1BQU0sT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLG9CQUFvQixFQUFFLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxFQUFFO1lBQ3hFLElBQUksQ0FBQyxTQUFTLENBQUMsZ0JBQWdCLENBQUMsT0FBTyxDQUFDLENBQUM7U0FDMUM7UUFDRCxJQUFJLENBQUMsZ0JBQWdCLENBQUMsT0FBTyxDQUFDLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLGNBQWMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUM1RixJQUFJLENBQUMsbUJBQW1CLENBQUMsT0FBTyxDQUM1QixDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxpQkFBaUIsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNyRSxJQUFJLENBQUMsbUJBQW1CLENBQUMsT0FBTyxDQUM1QixDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxpQkFBaUIsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNyRSxJQUFJLENBQUMsY0FBYyxDQUFDLE9BQU8sQ0FBQyxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDeEYsT0FBTyxpQkFBaUIsQ0FBQztJQUMzQixDQUFDO0lBRU8sc0JBQXNCLENBQUMsVUFBa0IsRUFBRSxpQkFBeUI7UUFDMUUsSUFBSSxJQUFJLENBQUMsYUFBYSxFQUFFO1lBQ3RCLE1BQU0sSUFBSSxLQUFLLENBQ1gsVUFBVSxpQkFBaUIsdURBQXVEO2dCQUNsRixtREFBbUQsVUFBVSxLQUFLLENBQUMsQ0FBQztTQUN6RTtJQUNILENBQUM7SUFFRCxHQUFHLENBQUMsS0FBVSxFQUFFLGdCQUFxQixRQUFRLENBQUMsa0JBQWtCO1FBQzlELElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQztRQUNyQixJQUFJLEtBQUssS0FBSyxPQUFPLEVBQUU7WUFDckIsT0FBTyxJQUFJLENBQUM7U0FDYjtRQUNELG9FQUFvRTtRQUNwRSwwRUFBMEU7UUFDMUUsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLEtBQUssRUFBRSxTQUFTLENBQUMsQ0FBQztRQUM5RCxPQUFPLE1BQU0sS0FBSyxTQUFTLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUUsYUFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQztJQUMzRixDQUFDO0lBRUQsT0FBTyxDQUFDLE1BQWEsRUFBRSxFQUFZLEVBQUUsT0FBYTtRQUNoRCxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUM7UUFDckIsTUFBTSxNQUFNLEdBQUcsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUM1QyxPQUFPLEVBQUUsQ0FBQyxLQUFLLENBQUMsT0FBTyxFQUFFLE1BQU0sQ0FBQyxDQUFDO0lBQ25DLENBQUM7SUFFRCxjQUFjLENBQUMsUUFBbUIsRUFBRSxRQUFvQztRQUN0RSxJQUFJLENBQUMsc0JBQXNCLENBQUMsZ0JBQWdCLEVBQUUsMEJBQTBCLENBQUMsQ0FBQztRQUMxRSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLENBQUMsUUFBUSxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUM7SUFDbkQsQ0FBQztJQUVELGlCQUFpQixDQUFDLFNBQW9CLEVBQUUsUUFBcUM7UUFDM0UsSUFBSSxDQUFDLHNCQUFzQixDQUFDLG1CQUFtQixFQUFFLDZCQUE2QixDQUFDLENBQUM7UUFDaEYsSUFBSSxDQUFDLG1CQUFtQixDQUFDLElBQUksQ0FBQyxDQUFDLFNBQVMsRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFDO0lBQ3ZELENBQUM7SUFFRCxpQkFBaUIsQ0FBQyxTQUFvQixFQUFFLFFBQXFDO1FBQzNFLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxtQkFBbUIsRUFBRSw2QkFBNkIsQ0FBQyxDQUFDO1FBQ2hGLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxJQUFJLENBQUMsQ0FBQyxTQUFTLEVBQUUsUUFBUSxDQUFDLENBQUMsQ0FBQztJQUN2RCxDQUFDO0lBRUQsWUFBWSxDQUFDLElBQWUsRUFBRSxRQUFnQztRQUM1RCxJQUFJLENBQUMsc0JBQXNCLENBQUMsY0FBYyxFQUFFLHdCQUF3QixDQUFDLENBQUM7UUFDdEUsSUFBSSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxJQUFJLEVBQUUsUUFBUSxDQUFDLENBQUMsQ0FBQztJQUM3QyxDQUFDO0lBVUQsZ0JBQWdCLENBQUMsS0FBVSxFQUFFLFFBQStEO1FBRTFGLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxLQUFLLEVBQUUsUUFBUSxDQUFDLENBQUM7SUFDN0MsQ0FBQztJQVlELDBCQUEwQixDQUN0QixLQUFVLEVBQUUsUUFBK0Q7UUFDN0UsSUFBSSxDQUFDLG9CQUFvQixDQUFDLEtBQUssRUFBRSxRQUFRLEVBQUUsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDcEUsQ0FBQztJQUVPLG9CQUFvQixDQUN4QixLQUFVLEVBQUUsUUFJWCxFQUNELFVBQVUsR0FBRyxLQUFLO1FBQ3BCLElBQUksR0FBRyxHQUE0QixJQUFJLENBQUM7UUFDeEMsSUFBSSxPQUFPLEtBQUssS0FBSyxRQUFRLElBQUksQ0FBQyxHQUFHLEdBQUcsZ0JBQWdCLENBQUMsS0FBSyxDQUFDLENBQUMsSUFBSSxHQUFHLENBQUMsVUFBVSxLQUFLLE1BQU0sRUFBRTtZQUM3RixJQUFJLFFBQVEsQ0FBQyxVQUFVLEVBQUU7Z0JBQ3ZCLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxJQUFJLENBQzVCLEVBQUMsT0FBTyxFQUFFLEtBQUssRUFBRSxVQUFVLEVBQUUsUUFBUSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsUUFBUSxDQUFDLElBQUksSUFBSSxFQUFFLEVBQUMsQ0FBQyxDQUFDO2FBQ25GO2lCQUFNO2dCQUNMLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxJQUFJLENBQUMsRUFBQyxPQUFPLEVBQUUsS0FBSyxFQUFFLFFBQVEsRUFBRSxRQUFRLENBQUMsUUFBUSxFQUFDLENBQUMsQ0FBQzthQUNqRjtTQUNGO1FBQ0QsSUFBSSxLQUFLLEdBQWMsQ0FBQyxDQUFDO1FBQ3pCLElBQUksS0FBVSxDQUFDO1FBQ2YsSUFBSSxRQUFRLENBQUMsVUFBVSxFQUFFO1lBQ3ZCLEtBQUssa0NBQWlDLENBQUM7WUFDdkMsS0FBSyxHQUFHLFFBQVEsQ0FBQyxVQUFVLENBQUM7U0FDN0I7YUFBTTtZQUNMLEtBQUssK0JBQStCLENBQUM7WUFDckMsS0FBSyxHQUFHLFFBQVEsQ0FBQyxRQUFRLENBQUM7U0FDM0I7UUFDRCxNQUFNLElBQUksR0FBRyxDQUFDLFFBQVEsQ0FBQyxJQUFJLElBQUksRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxFQUFFLEVBQUU7WUFDN0MsSUFBSSxRQUFRLGVBQTBCLENBQUM7WUFDdkMsSUFBSSxRQUFhLENBQUM7WUFDbEIsSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFO2dCQUN0QixHQUFHLENBQUMsT0FBTyxDQUFDLENBQUMsS0FBVSxFQUFFLEVBQUU7b0JBQ3pCLElBQUksS0FBSyxZQUFZLFFBQVEsRUFBRTt3QkFDN0IsUUFBUSxvQkFBcUIsQ0FBQztxQkFDL0I7eUJBQU0sSUFBSSxLQUFLLFlBQVksUUFBUSxFQUFFO3dCQUNwQyxRQUFRLG9CQUFxQixDQUFDO3FCQUMvQjt5QkFBTTt3QkFDTCxRQUFRLEdBQUcsS0FBSyxDQUFDO3FCQUNsQjtnQkFDSCxDQUFDLENBQUMsQ0FBQzthQUNKO2lCQUFNO2dCQUNMLFFBQVEsR0FBRyxHQUFHLENBQUM7YUFDaEI7WUFDRCxPQUFPLENBQUMsUUFBUSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBQzlCLENBQUMsQ0FBQyxDQUFDO1FBQ0gsZ0JBQWdCLENBQUMsRUFBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsa0JBQWtCLEVBQUUsVUFBVSxFQUFDLENBQUMsQ0FBQztJQUNoRixDQUFDO0lBRUQsa0NBQWtDLENBQUMsU0FBb0IsRUFBRSxRQUFnQjtRQUN2RSxJQUFJLENBQUMsc0JBQXNCLENBQUMsb0NBQW9DLEVBQUUsbUJBQW1CLENBQUMsQ0FBQztRQUd2RixJQUFNLGlCQUFpQixHQUF2QixNQUFNLGlCQUFpQjtTQUN0QixDQUFBO1FBREssaUJBQWlCO1lBRHRCLFNBQVMsQ0FBQyxFQUFDLFFBQVEsRUFBRSxPQUFPLEVBQUUsUUFBUSxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUMsQ0FBQztXQUM5QyxpQkFBaUIsQ0FDdEI7UUFFRCxJQUFJLENBQUMsa0JBQWtCLENBQUMsSUFBSSxDQUFDLEVBQUMsU0FBUyxFQUFFLFVBQVUsRUFBRSxpQkFBaUIsRUFBQyxDQUFDLENBQUM7SUFDM0UsQ0FBQztJQUVELGVBQWUsQ0FBSSxTQUFrQjtRQUNuQyxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUM7UUFDckIsTUFBTSxnQkFBZ0IsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLG1CQUFtQixDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBRXZFLElBQUksQ0FBQyxnQkFBZ0IsRUFBRTtZQUNyQixNQUFNLElBQUksS0FBSyxDQUNYLCtCQUErQixTQUFTLENBQUMsU0FBUyxDQUFDLGtEQUFrRCxDQUFDLENBQUM7U0FDNUc7UUFFRCxNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLHdCQUF3QixFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQzNELE1BQU0sVUFBVSxHQUFZLElBQUksQ0FBQyxHQUFHLENBQUMsMEJBQTBCLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDeEUsTUFBTSxNQUFNLEdBQVcsUUFBUSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQ2hFLE1BQU0scUJBQXFCLEdBQTBCLElBQUksQ0FBQyxHQUFHLENBQUMscUJBQXFCLENBQUMsQ0FBQztRQUNyRixNQUFNLFFBQVEsR0FBRyxPQUFPLGtCQUFrQixFQUFFLEVBQUUsQ0FBQztRQUMvQyxxQkFBcUIsQ0FBQyxpQkFBaUIsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUVsRCxNQUFNLGFBQWEsR0FBRyxHQUFHLEVBQUU7WUFDekIsTUFBTSxZQUFZLEdBQ2QsZ0JBQWdCLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsRUFBRSxFQUFFLElBQUksUUFBUSxFQUFFLEVBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQ2hGLE9BQU8sSUFBSSxnQkFBZ0IsQ0FBSSxZQUFZLEVBQUUsTUFBTSxFQUFFLFVBQVUsQ0FBQyxDQUFDO1FBQ25FLENBQUMsQ0FBQztRQUVGLE1BQU0sT0FBTyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxhQUFhLEVBQUUsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxhQUFhLENBQUMsQ0FBQztRQUN0RSxJQUFJLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUNuQyxPQUFPLE9BQU8sQ0FBQztJQUNqQixDQUFDO0NBQ0Y7QUFFRDs7Ozs7Ozs7Ozs7R0FXRztBQUNILE1BQU0sQ0FBQyxNQUFNLE9BQU8sR0FDaEIsVUFBVSxDQUFDLENBQUMsQ0FBQyxjQUFzQyxDQUFDLENBQUMsQ0FBQyxpQkFBeUMsQ0FBQztBQUVwRzs7Ozs7O0dBTUc7QUFDSCxNQUFNLENBQUMsTUFBTSxVQUFVLEdBQWtCLFVBQVUsQ0FBQyxDQUFDLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxDQUFDLHFCQUFxQixDQUFDO0FBRWpHLElBQUksT0FBMEIsQ0FBQztBQUUvQixTQUFTLHFCQUFxQjtJQUM1QixPQUFPLE9BQU8sR0FBRyxPQUFPLElBQUksSUFBSSxpQkFBaUIsRUFBRSxDQUFDO0FBQ3RELENBQUM7QUFFRDs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7R0F1Qkc7QUFDSCxNQUFNLFVBQVUsTUFBTSxDQUFDLE1BQWEsRUFBRSxFQUFZO0lBQ2hELE1BQU0sT0FBTyxHQUFHLFVBQVUsRUFBRSxDQUFDO0lBQzdCLElBQUksTUFBTSxDQUFDLE9BQU8sQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsRUFBRTtRQUMzQyx3RUFBd0U7UUFDeEUsT0FBTztZQUNMLHFGQUFxRjtZQUNyRix1QkFBdUI7WUFDdkIsT0FBTyxPQUFPLENBQUMsaUJBQWlCLEVBQUUsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFO2dCQUMzQyxNQUFNLFNBQVMsR0FBdUIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO2dCQUN0RSxPQUFPLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxFQUFFLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBQ2xDLE9BQU8sU0FBUyxDQUFDLE9BQU8sQ0FBQztZQUMzQixDQUFDLENBQUMsQ0FBQztRQUNMLENBQUMsQ0FBQztLQUNIO1NBQU07UUFDTCx3RUFBd0U7UUFDeEUsT0FBTyxjQUFhLE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsRUFBRSxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0tBQ2pFO0FBQ0gsQ0FBQztBQUVEOztHQUVHO0FBQ0gsTUFBTSxPQUFPLGtCQUFrQjtJQUM3QixZQUFvQixVQUFvQztRQUFwQyxlQUFVLEdBQVYsVUFBVSxDQUEwQjtJQUFHLENBQUM7SUFFcEQsVUFBVTtRQUNoQixNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7UUFDcEMsSUFBSSxTQUFTLEVBQUU7WUFDYixVQUFVLEVBQUUsQ0FBQyxzQkFBc0IsQ0FBQyxTQUFTLENBQUMsQ0FBQztTQUNoRDtJQUNILENBQUM7SUFFRCxNQUFNLENBQUMsTUFBYSxFQUFFLEVBQVk7UUFDaEMsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDO1FBQ2xCLHdFQUF3RTtRQUN4RSxPQUFPO1lBQ0wsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO1lBQ2xCLE9BQU8sTUFBTSxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDdkMsQ0FBQyxDQUFDO0lBQ0osQ0FBQztDQUNGO0FBT0QsTUFBTSxVQUFVLFVBQVUsQ0FBQyxTQUE2QixFQUFFLEVBQW9CO0lBRTVFLElBQUksRUFBRSxFQUFFO1FBQ04sd0VBQXdFO1FBQ3hFLE9BQU87WUFDTCxNQUFNLE9BQU8sR0FBRyxVQUFVLEVBQUUsQ0FBQztZQUM3QixJQUFJLFNBQVMsRUFBRTtnQkFDYixPQUFPLENBQUMsc0JBQXNCLENBQUMsU0FBUyxDQUFDLENBQUM7YUFDM0M7WUFDRCxPQUFPLEVBQUUsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDeEIsQ0FBQyxDQUFDO0tBQ0g7SUFDRCxPQUFPLElBQUksa0JBQWtCLENBQUMsR0FBRyxFQUFFLENBQUMsU0FBUyxDQUFDLENBQUM7QUFDakQsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtBcHBsaWNhdGlvbkluaXRTdGF0dXMsIENvbXBpbGVyT3B0aW9ucywgQ29tcG9uZW50LCBEaXJlY3RpdmUsIEluamVjdG9yLCBOZ01vZHVsZSwgTmdNb2R1bGVGYWN0b3J5LCBOZ01vZHVsZVJlZiwgTmdab25lLCBPcHRpb25hbCwgUGlwZSwgUGxhdGZvcm1SZWYsIFByb3ZpZGVyLCBTY2hlbWFNZXRhZGF0YSwgU2tpcFNlbGYsIFN0YXRpY1Byb3ZpZGVyLCBUeXBlLCDJtUFQUF9ST09UIGFzIEFQUF9ST09ULCDJtURlcEZsYWdzIGFzIERlcEZsYWdzLCDJtUluamVjdGFibGVEZWYgYXMgSW5qZWN0YWJsZURlZiwgybVOb2RlRmxhZ3MgYXMgTm9kZUZsYWdzLCDJtWNsZWFyT3ZlcnJpZGVzIGFzIGNsZWFyT3ZlcnJpZGVzLCDJtWdldENvbXBvbmVudFZpZXdEZWZpbml0aW9uRmFjdG9yeSBhcyBnZXRDb21wb25lbnRWaWV3RGVmaW5pdGlvbkZhY3RvcnksIMm1Z2V0SW5qZWN0YWJsZURlZiBhcyBnZXRJbmplY3RhYmxlRGVmLCDJtWl2eUVuYWJsZWQgYXMgaXZ5RW5hYmxlZCwgybVvdmVycmlkZUNvbXBvbmVudFZpZXcgYXMgb3ZlcnJpZGVDb21wb25lbnRWaWV3LCDJtW92ZXJyaWRlUHJvdmlkZXIgYXMgb3ZlcnJpZGVQcm92aWRlciwgybVzdHJpbmdpZnkgYXMgc3RyaW5naWZ5fSBmcm9tICdAYW5ndWxhci9jb3JlJztcblxuaW1wb3J0IHtBc3luY1Rlc3RDb21wbGV0ZXJ9IGZyb20gJy4vYXN5bmNfdGVzdF9jb21wbGV0ZXInO1xuaW1wb3J0IHtDb21wb25lbnRGaXh0dXJlfSBmcm9tICcuL2NvbXBvbmVudF9maXh0dXJlJztcbmltcG9ydCB7TWV0YWRhdGFPdmVycmlkZX0gZnJvbSAnLi9tZXRhZGF0YV9vdmVycmlkZSc7XG5pbXBvcnQge1Rlc3RCZWRSZW5kZXIzLCBfZ2V0VGVzdEJlZFJlbmRlcjN9IGZyb20gJy4vcjNfdGVzdF9iZWQnO1xuaW1wb3J0IHtDb21wb25lbnRGaXh0dXJlQXV0b0RldGVjdCwgQ29tcG9uZW50Rml4dHVyZU5vTmdab25lLCBUZXN0QmVkU3RhdGljLCBUZXN0Q29tcG9uZW50UmVuZGVyZXIsIFRlc3RNb2R1bGVNZXRhZGF0YX0gZnJvbSAnLi90ZXN0X2JlZF9jb21tb24nO1xuaW1wb3J0IHtUZXN0aW5nQ29tcGlsZXIsIFRlc3RpbmdDb21waWxlckZhY3Rvcnl9IGZyb20gJy4vdGVzdF9jb21waWxlcic7XG5cbmNvbnN0IFVOREVGSU5FRCA9IG5ldyBPYmplY3QoKTtcblxuXG5sZXQgX25leHRSb290RWxlbWVudElkID0gMDtcblxuZXhwb3J0IGludGVyZmFjZSBUZXN0QmVkIHtcbiAgcGxhdGZvcm06IFBsYXRmb3JtUmVmO1xuXG4gIG5nTW9kdWxlOiBUeXBlPGFueT58VHlwZTxhbnk+W107XG5cbiAgLyoqXG4gICAqIEluaXRpYWxpemUgdGhlIGVudmlyb25tZW50IGZvciB0ZXN0aW5nIHdpdGggYSBjb21waWxlciBmYWN0b3J5LCBhIFBsYXRmb3JtUmVmLCBhbmQgYW5cbiAgICogYW5ndWxhciBtb2R1bGUuIFRoZXNlIGFyZSBjb21tb24gdG8gZXZlcnkgdGVzdCBpbiB0aGUgc3VpdGUuXG4gICAqXG4gICAqIFRoaXMgbWF5IG9ubHkgYmUgY2FsbGVkIG9uY2UsIHRvIHNldCB1cCB0aGUgY29tbW9uIHByb3ZpZGVycyBmb3IgdGhlIGN1cnJlbnQgdGVzdFxuICAgKiBzdWl0ZSBvbiB0aGUgY3VycmVudCBwbGF0Zm9ybS4gSWYgeW91IGFic29sdXRlbHkgbmVlZCB0byBjaGFuZ2UgdGhlIHByb3ZpZGVycyxcbiAgICogZmlyc3QgdXNlIGByZXNldFRlc3RFbnZpcm9ubWVudGAuXG4gICAqXG4gICAqIFRlc3QgbW9kdWxlcyBhbmQgcGxhdGZvcm1zIGZvciBpbmRpdmlkdWFsIHBsYXRmb3JtcyBhcmUgYXZhaWxhYmxlIGZyb21cbiAgICogJ0Bhbmd1bGFyLzxwbGF0Zm9ybV9uYW1lPi90ZXN0aW5nJy5cbiAgICpcbiAgICogQHB1YmxpY0FwaVxuICAgKi9cbiAgaW5pdFRlc3RFbnZpcm9ubWVudChcbiAgICAgIG5nTW9kdWxlOiBUeXBlPGFueT58VHlwZTxhbnk+W10sIHBsYXRmb3JtOiBQbGF0Zm9ybVJlZiwgYW90U3VtbWFyaWVzPzogKCkgPT4gYW55W10pOiB2b2lkO1xuXG4gIC8qKlxuICAgKiBSZXNldCB0aGUgcHJvdmlkZXJzIGZvciB0aGUgdGVzdCBpbmplY3Rvci5cbiAgICpcbiAgICogQHB1YmxpY0FwaVxuICAgKi9cbiAgcmVzZXRUZXN0RW52aXJvbm1lbnQoKTogdm9pZDtcblxuICByZXNldFRlc3RpbmdNb2R1bGUoKTogdm9pZDtcblxuICBjb25maWd1cmVDb21waWxlcihjb25maWc6IHtwcm92aWRlcnM/OiBhbnlbXSwgdXNlSml0PzogYm9vbGVhbn0pOiB2b2lkO1xuXG4gIGNvbmZpZ3VyZVRlc3RpbmdNb2R1bGUobW9kdWxlRGVmOiBUZXN0TW9kdWxlTWV0YWRhdGEpOiB2b2lkO1xuXG4gIGNvbXBpbGVDb21wb25lbnRzKCk6IFByb21pc2U8YW55PjtcblxuICBnZXQodG9rZW46IGFueSwgbm90Rm91bmRWYWx1ZT86IGFueSk6IGFueTtcblxuICBleGVjdXRlKHRva2VuczogYW55W10sIGZuOiBGdW5jdGlvbiwgY29udGV4dD86IGFueSk6IGFueTtcblxuICBvdmVycmlkZU1vZHVsZShuZ01vZHVsZTogVHlwZTxhbnk+LCBvdmVycmlkZTogTWV0YWRhdGFPdmVycmlkZTxOZ01vZHVsZT4pOiB2b2lkO1xuXG4gIG92ZXJyaWRlQ29tcG9uZW50KGNvbXBvbmVudDogVHlwZTxhbnk+LCBvdmVycmlkZTogTWV0YWRhdGFPdmVycmlkZTxDb21wb25lbnQ+KTogdm9pZDtcblxuICBvdmVycmlkZURpcmVjdGl2ZShkaXJlY3RpdmU6IFR5cGU8YW55Piwgb3ZlcnJpZGU6IE1ldGFkYXRhT3ZlcnJpZGU8RGlyZWN0aXZlPik6IHZvaWQ7XG5cbiAgb3ZlcnJpZGVQaXBlKHBpcGU6IFR5cGU8YW55Piwgb3ZlcnJpZGU6IE1ldGFkYXRhT3ZlcnJpZGU8UGlwZT4pOiB2b2lkO1xuXG4gIC8qKlxuICAgKiBPdmVyd3JpdGVzIGFsbCBwcm92aWRlcnMgZm9yIHRoZSBnaXZlbiB0b2tlbiB3aXRoIHRoZSBnaXZlbiBwcm92aWRlciBkZWZpbml0aW9uLlxuICAgKi9cbiAgb3ZlcnJpZGVQcm92aWRlcih0b2tlbjogYW55LCBwcm92aWRlcjoge1xuICAgIHVzZUZhY3Rvcnk6IEZ1bmN0aW9uLFxuICAgIGRlcHM6IGFueVtdLFxuICB9KTogdm9pZDtcbiAgb3ZlcnJpZGVQcm92aWRlcih0b2tlbjogYW55LCBwcm92aWRlcjoge3VzZVZhbHVlOiBhbnk7fSk6IHZvaWQ7XG4gIG92ZXJyaWRlUHJvdmlkZXIodG9rZW46IGFueSwgcHJvdmlkZXI6IHt1c2VGYWN0b3J5PzogRnVuY3Rpb24sIHVzZVZhbHVlPzogYW55LCBkZXBzPzogYW55W119KTpcbiAgICAgIHZvaWQ7XG5cbiAgLyoqXG4gICAqIE92ZXJ3cml0ZXMgYWxsIHByb3ZpZGVycyBmb3IgdGhlIGdpdmVuIHRva2VuIHdpdGggdGhlIGdpdmVuIHByb3ZpZGVyIGRlZmluaXRpb24uXG4gICAqXG4gICAqIEBkZXByZWNhdGVkIGFzIGl0IG1ha2VzIGFsbCBOZ01vZHVsZXMgbGF6eS4gSW50cm9kdWNlZCBvbmx5IGZvciBtaWdyYXRpbmcgb2ZmIG9mIGl0LlxuICAgKi9cbiAgZGVwcmVjYXRlZE92ZXJyaWRlUHJvdmlkZXIodG9rZW46IGFueSwgcHJvdmlkZXI6IHtcbiAgICB1c2VGYWN0b3J5OiBGdW5jdGlvbixcbiAgICBkZXBzOiBhbnlbXSxcbiAgfSk6IHZvaWQ7XG4gIGRlcHJlY2F0ZWRPdmVycmlkZVByb3ZpZGVyKHRva2VuOiBhbnksIHByb3ZpZGVyOiB7dXNlVmFsdWU6IGFueTt9KTogdm9pZDtcbiAgZGVwcmVjYXRlZE92ZXJyaWRlUHJvdmlkZXIoXG4gICAgICB0b2tlbjogYW55LCBwcm92aWRlcjoge3VzZUZhY3Rvcnk/OiBGdW5jdGlvbiwgdXNlVmFsdWU/OiBhbnksIGRlcHM/OiBhbnlbXX0pOiB2b2lkO1xuXG5cbiAgb3ZlcnJpZGVUZW1wbGF0ZVVzaW5nVGVzdGluZ01vZHVsZShjb21wb25lbnQ6IFR5cGU8YW55PiwgdGVtcGxhdGU6IHN0cmluZyk6IHZvaWQ7XG5cbiAgY3JlYXRlQ29tcG9uZW50PFQ+KGNvbXBvbmVudDogVHlwZTxUPik6IENvbXBvbmVudEZpeHR1cmU8VD47XG59XG5cbi8qKlxuICogQGRlc2NyaXB0aW9uXG4gKiBDb25maWd1cmVzIGFuZCBpbml0aWFsaXplcyBlbnZpcm9ubWVudCBmb3IgdW5pdCB0ZXN0aW5nIGFuZCBwcm92aWRlcyBtZXRob2RzIGZvclxuICogY3JlYXRpbmcgY29tcG9uZW50cyBhbmQgc2VydmljZXMgaW4gdW5pdCB0ZXN0cy5cbiAqXG4gKiBgVGVzdEJlZGAgaXMgdGhlIHByaW1hcnkgYXBpIGZvciB3cml0aW5nIHVuaXQgdGVzdHMgZm9yIEFuZ3VsYXIgYXBwbGljYXRpb25zIGFuZCBsaWJyYXJpZXMuXG4gKlxuICogTm90ZTogVXNlIGBUZXN0QmVkYCBpbiB0ZXN0cy4gSXQgd2lsbCBiZSBzZXQgdG8gZWl0aGVyIGBUZXN0QmVkVmlld0VuZ2luZWAgb3IgYFRlc3RCZWRSZW5kZXIzYFxuICogYWNjb3JkaW5nIHRvIHRoZSBjb21waWxlciB1c2VkLlxuICovXG5leHBvcnQgY2xhc3MgVGVzdEJlZFZpZXdFbmdpbmUgaW1wbGVtZW50cyBJbmplY3RvciwgVGVzdEJlZCB7XG4gIC8qKlxuICAgKiBJbml0aWFsaXplIHRoZSBlbnZpcm9ubWVudCBmb3IgdGVzdGluZyB3aXRoIGEgY29tcGlsZXIgZmFjdG9yeSwgYSBQbGF0Zm9ybVJlZiwgYW5kIGFuXG4gICAqIGFuZ3VsYXIgbW9kdWxlLiBUaGVzZSBhcmUgY29tbW9uIHRvIGV2ZXJ5IHRlc3QgaW4gdGhlIHN1aXRlLlxuICAgKlxuICAgKiBUaGlzIG1heSBvbmx5IGJlIGNhbGxlZCBvbmNlLCB0byBzZXQgdXAgdGhlIGNvbW1vbiBwcm92aWRlcnMgZm9yIHRoZSBjdXJyZW50IHRlc3RcbiAgICogc3VpdGUgb24gdGhlIGN1cnJlbnQgcGxhdGZvcm0uIElmIHlvdSBhYnNvbHV0ZWx5IG5lZWQgdG8gY2hhbmdlIHRoZSBwcm92aWRlcnMsXG4gICAqIGZpcnN0IHVzZSBgcmVzZXRUZXN0RW52aXJvbm1lbnRgLlxuICAgKlxuICAgKiBUZXN0IG1vZHVsZXMgYW5kIHBsYXRmb3JtcyBmb3IgaW5kaXZpZHVhbCBwbGF0Zm9ybXMgYXJlIGF2YWlsYWJsZSBmcm9tXG4gICAqICdAYW5ndWxhci88cGxhdGZvcm1fbmFtZT4vdGVzdGluZycuXG4gICAqXG4gICAqIEBwdWJsaWNBcGlcbiAgICovXG4gIHN0YXRpYyBpbml0VGVzdEVudmlyb25tZW50KFxuICAgICAgbmdNb2R1bGU6IFR5cGU8YW55PnxUeXBlPGFueT5bXSwgcGxhdGZvcm06IFBsYXRmb3JtUmVmLFxuICAgICAgYW90U3VtbWFyaWVzPzogKCkgPT4gYW55W10pOiBUZXN0QmVkVmlld0VuZ2luZSB7XG4gICAgY29uc3QgdGVzdEJlZCA9IF9nZXRUZXN0QmVkVmlld0VuZ2luZSgpO1xuICAgIHRlc3RCZWQuaW5pdFRlc3RFbnZpcm9ubWVudChuZ01vZHVsZSwgcGxhdGZvcm0sIGFvdFN1bW1hcmllcyk7XG4gICAgcmV0dXJuIHRlc3RCZWQ7XG4gIH1cblxuICAvKipcbiAgICogUmVzZXQgdGhlIHByb3ZpZGVycyBmb3IgdGhlIHRlc3QgaW5qZWN0b3IuXG4gICAqXG4gICAqIEBwdWJsaWNBcGlcbiAgICovXG4gIHN0YXRpYyByZXNldFRlc3RFbnZpcm9ubWVudCgpOiB2b2lkIHsgX2dldFRlc3RCZWRWaWV3RW5naW5lKCkucmVzZXRUZXN0RW52aXJvbm1lbnQoKTsgfVxuXG4gIHN0YXRpYyByZXNldFRlc3RpbmdNb2R1bGUoKTogVGVzdEJlZFN0YXRpYyB7XG4gICAgX2dldFRlc3RCZWRWaWV3RW5naW5lKCkucmVzZXRUZXN0aW5nTW9kdWxlKCk7XG4gICAgcmV0dXJuIFRlc3RCZWRWaWV3RW5naW5lIGFzIGFueSBhcyBUZXN0QmVkU3RhdGljO1xuICB9XG5cbiAgLyoqXG4gICAqIEFsbG93cyBvdmVycmlkaW5nIGRlZmF1bHQgY29tcGlsZXIgcHJvdmlkZXJzIGFuZCBzZXR0aW5nc1xuICAgKiB3aGljaCBhcmUgZGVmaW5lZCBpbiB0ZXN0X2luamVjdG9yLmpzXG4gICAqL1xuICBzdGF0aWMgY29uZmlndXJlQ29tcGlsZXIoY29uZmlnOiB7cHJvdmlkZXJzPzogYW55W107IHVzZUppdD86IGJvb2xlYW47fSk6IFRlc3RCZWRTdGF0aWMge1xuICAgIF9nZXRUZXN0QmVkVmlld0VuZ2luZSgpLmNvbmZpZ3VyZUNvbXBpbGVyKGNvbmZpZyk7XG4gICAgcmV0dXJuIFRlc3RCZWRWaWV3RW5naW5lIGFzIGFueSBhcyBUZXN0QmVkU3RhdGljO1xuICB9XG5cbiAgLyoqXG4gICAqIEFsbG93cyBvdmVycmlkaW5nIGRlZmF1bHQgcHJvdmlkZXJzLCBkaXJlY3RpdmVzLCBwaXBlcywgbW9kdWxlcyBvZiB0aGUgdGVzdCBpbmplY3RvcixcbiAgICogd2hpY2ggYXJlIGRlZmluZWQgaW4gdGVzdF9pbmplY3Rvci5qc1xuICAgKi9cbiAgc3RhdGljIGNvbmZpZ3VyZVRlc3RpbmdNb2R1bGUobW9kdWxlRGVmOiBUZXN0TW9kdWxlTWV0YWRhdGEpOiBUZXN0QmVkU3RhdGljIHtcbiAgICBfZ2V0VGVzdEJlZFZpZXdFbmdpbmUoKS5jb25maWd1cmVUZXN0aW5nTW9kdWxlKG1vZHVsZURlZik7XG4gICAgcmV0dXJuIFRlc3RCZWRWaWV3RW5naW5lIGFzIGFueSBhcyBUZXN0QmVkU3RhdGljO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbXBpbGUgY29tcG9uZW50cyB3aXRoIGEgYHRlbXBsYXRlVXJsYCBmb3IgdGhlIHRlc3QncyBOZ01vZHVsZS5cbiAgICogSXQgaXMgbmVjZXNzYXJ5IHRvIGNhbGwgdGhpcyBmdW5jdGlvblxuICAgKiBhcyBmZXRjaGluZyB1cmxzIGlzIGFzeW5jaHJvbm91cy5cbiAgICovXG4gIHN0YXRpYyBjb21waWxlQ29tcG9uZW50cygpOiBQcm9taXNlPGFueT4geyByZXR1cm4gZ2V0VGVzdEJlZCgpLmNvbXBpbGVDb21wb25lbnRzKCk7IH1cblxuICBzdGF0aWMgb3ZlcnJpZGVNb2R1bGUobmdNb2R1bGU6IFR5cGU8YW55Piwgb3ZlcnJpZGU6IE1ldGFkYXRhT3ZlcnJpZGU8TmdNb2R1bGU+KTogVGVzdEJlZFN0YXRpYyB7XG4gICAgX2dldFRlc3RCZWRWaWV3RW5naW5lKCkub3ZlcnJpZGVNb2R1bGUobmdNb2R1bGUsIG92ZXJyaWRlKTtcbiAgICByZXR1cm4gVGVzdEJlZFZpZXdFbmdpbmUgYXMgYW55IGFzIFRlc3RCZWRTdGF0aWM7XG4gIH1cblxuICBzdGF0aWMgb3ZlcnJpZGVDb21wb25lbnQoY29tcG9uZW50OiBUeXBlPGFueT4sIG92ZXJyaWRlOiBNZXRhZGF0YU92ZXJyaWRlPENvbXBvbmVudD4pOlxuICAgICAgVGVzdEJlZFN0YXRpYyB7XG4gICAgX2dldFRlc3RCZWRWaWV3RW5naW5lKCkub3ZlcnJpZGVDb21wb25lbnQoY29tcG9uZW50LCBvdmVycmlkZSk7XG4gICAgcmV0dXJuIFRlc3RCZWRWaWV3RW5naW5lIGFzIGFueSBhcyBUZXN0QmVkU3RhdGljO1xuICB9XG5cbiAgc3RhdGljIG92ZXJyaWRlRGlyZWN0aXZlKGRpcmVjdGl2ZTogVHlwZTxhbnk+LCBvdmVycmlkZTogTWV0YWRhdGFPdmVycmlkZTxEaXJlY3RpdmU+KTpcbiAgICAgIFRlc3RCZWRTdGF0aWMge1xuICAgIF9nZXRUZXN0QmVkVmlld0VuZ2luZSgpLm92ZXJyaWRlRGlyZWN0aXZlKGRpcmVjdGl2ZSwgb3ZlcnJpZGUpO1xuICAgIHJldHVybiBUZXN0QmVkVmlld0VuZ2luZSBhcyBhbnkgYXMgVGVzdEJlZFN0YXRpYztcbiAgfVxuXG4gIHN0YXRpYyBvdmVycmlkZVBpcGUocGlwZTogVHlwZTxhbnk+LCBvdmVycmlkZTogTWV0YWRhdGFPdmVycmlkZTxQaXBlPik6IFRlc3RCZWRTdGF0aWMge1xuICAgIF9nZXRUZXN0QmVkVmlld0VuZ2luZSgpLm92ZXJyaWRlUGlwZShwaXBlLCBvdmVycmlkZSk7XG4gICAgcmV0dXJuIFRlc3RCZWRWaWV3RW5naW5lIGFzIGFueSBhcyBUZXN0QmVkU3RhdGljO1xuICB9XG5cbiAgc3RhdGljIG92ZXJyaWRlVGVtcGxhdGUoY29tcG9uZW50OiBUeXBlPGFueT4sIHRlbXBsYXRlOiBzdHJpbmcpOiBUZXN0QmVkU3RhdGljIHtcbiAgICBfZ2V0VGVzdEJlZFZpZXdFbmdpbmUoKS5vdmVycmlkZUNvbXBvbmVudChjb21wb25lbnQsIHtzZXQ6IHt0ZW1wbGF0ZSwgdGVtcGxhdGVVcmw6IG51bGwgIX19KTtcbiAgICByZXR1cm4gVGVzdEJlZFZpZXdFbmdpbmUgYXMgYW55IGFzIFRlc3RCZWRTdGF0aWM7XG4gIH1cblxuICAvKipcbiAgICogT3ZlcnJpZGVzIHRoZSB0ZW1wbGF0ZSBvZiB0aGUgZ2l2ZW4gY29tcG9uZW50LCBjb21waWxpbmcgdGhlIHRlbXBsYXRlXG4gICAqIGluIHRoZSBjb250ZXh0IG9mIHRoZSBUZXN0aW5nTW9kdWxlLlxuICAgKlxuICAgKiBOb3RlOiBUaGlzIHdvcmtzIGZvciBKSVQgYW5kIEFPVGVkIGNvbXBvbmVudHMgYXMgd2VsbC5cbiAgICovXG4gIHN0YXRpYyBvdmVycmlkZVRlbXBsYXRlVXNpbmdUZXN0aW5nTW9kdWxlKGNvbXBvbmVudDogVHlwZTxhbnk+LCB0ZW1wbGF0ZTogc3RyaW5nKTogVGVzdEJlZFN0YXRpYyB7XG4gICAgX2dldFRlc3RCZWRWaWV3RW5naW5lKCkub3ZlcnJpZGVUZW1wbGF0ZVVzaW5nVGVzdGluZ01vZHVsZShjb21wb25lbnQsIHRlbXBsYXRlKTtcbiAgICByZXR1cm4gVGVzdEJlZFZpZXdFbmdpbmUgYXMgYW55IGFzIFRlc3RCZWRTdGF0aWM7XG4gIH1cblxuICAvKipcbiAgICogT3ZlcndyaXRlcyBhbGwgcHJvdmlkZXJzIGZvciB0aGUgZ2l2ZW4gdG9rZW4gd2l0aCB0aGUgZ2l2ZW4gcHJvdmlkZXIgZGVmaW5pdGlvbi5cbiAgICpcbiAgICogTm90ZTogVGhpcyB3b3JrcyBmb3IgSklUIGFuZCBBT1RlZCBjb21wb25lbnRzIGFzIHdlbGwuXG4gICAqL1xuICBzdGF0aWMgb3ZlcnJpZGVQcm92aWRlcih0b2tlbjogYW55LCBwcm92aWRlcjoge1xuICAgIHVzZUZhY3Rvcnk6IEZ1bmN0aW9uLFxuICAgIGRlcHM6IGFueVtdLFxuICB9KTogVGVzdEJlZFN0YXRpYztcbiAgc3RhdGljIG92ZXJyaWRlUHJvdmlkZXIodG9rZW46IGFueSwgcHJvdmlkZXI6IHt1c2VWYWx1ZTogYW55O30pOiBUZXN0QmVkU3RhdGljO1xuICBzdGF0aWMgb3ZlcnJpZGVQcm92aWRlcih0b2tlbjogYW55LCBwcm92aWRlcjoge1xuICAgIHVzZUZhY3Rvcnk/OiBGdW5jdGlvbixcbiAgICB1c2VWYWx1ZT86IGFueSxcbiAgICBkZXBzPzogYW55W10sXG4gIH0pOiBUZXN0QmVkU3RhdGljIHtcbiAgICBfZ2V0VGVzdEJlZFZpZXdFbmdpbmUoKS5vdmVycmlkZVByb3ZpZGVyKHRva2VuLCBwcm92aWRlciBhcyBhbnkpO1xuICAgIHJldHVybiBUZXN0QmVkVmlld0VuZ2luZSBhcyBhbnkgYXMgVGVzdEJlZFN0YXRpYztcbiAgfVxuXG4gIC8qKlxuICAgKiBPdmVyd3JpdGVzIGFsbCBwcm92aWRlcnMgZm9yIHRoZSBnaXZlbiB0b2tlbiB3aXRoIHRoZSBnaXZlbiBwcm92aWRlciBkZWZpbml0aW9uLlxuICAgKlxuICAgKiBAZGVwcmVjYXRlZCBhcyBpdCBtYWtlcyBhbGwgTmdNb2R1bGVzIGxhenkuIEludHJvZHVjZWQgb25seSBmb3IgbWlncmF0aW5nIG9mZiBvZiBpdC5cbiAgICovXG4gIHN0YXRpYyBkZXByZWNhdGVkT3ZlcnJpZGVQcm92aWRlcih0b2tlbjogYW55LCBwcm92aWRlcjoge1xuICAgIHVzZUZhY3Rvcnk6IEZ1bmN0aW9uLFxuICAgIGRlcHM6IGFueVtdLFxuICB9KTogdm9pZDtcbiAgc3RhdGljIGRlcHJlY2F0ZWRPdmVycmlkZVByb3ZpZGVyKHRva2VuOiBhbnksIHByb3ZpZGVyOiB7dXNlVmFsdWU6IGFueTt9KTogdm9pZDtcbiAgc3RhdGljIGRlcHJlY2F0ZWRPdmVycmlkZVByb3ZpZGVyKHRva2VuOiBhbnksIHByb3ZpZGVyOiB7XG4gICAgdXNlRmFjdG9yeT86IEZ1bmN0aW9uLFxuICAgIHVzZVZhbHVlPzogYW55LFxuICAgIGRlcHM/OiBhbnlbXSxcbiAgfSk6IFRlc3RCZWRTdGF0aWMge1xuICAgIF9nZXRUZXN0QmVkVmlld0VuZ2luZSgpLmRlcHJlY2F0ZWRPdmVycmlkZVByb3ZpZGVyKHRva2VuLCBwcm92aWRlciBhcyBhbnkpO1xuICAgIHJldHVybiBUZXN0QmVkVmlld0VuZ2luZSBhcyBhbnkgYXMgVGVzdEJlZFN0YXRpYztcbiAgfVxuXG4gIHN0YXRpYyBnZXQodG9rZW46IGFueSwgbm90Rm91bmRWYWx1ZTogYW55ID0gSW5qZWN0b3IuVEhST1dfSUZfTk9UX0ZPVU5EKSB7XG4gICAgcmV0dXJuIF9nZXRUZXN0QmVkVmlld0VuZ2luZSgpLmdldCh0b2tlbiwgbm90Rm91bmRWYWx1ZSk7XG4gIH1cblxuICBzdGF0aWMgY3JlYXRlQ29tcG9uZW50PFQ+KGNvbXBvbmVudDogVHlwZTxUPik6IENvbXBvbmVudEZpeHR1cmU8VD4ge1xuICAgIHJldHVybiBfZ2V0VGVzdEJlZFZpZXdFbmdpbmUoKS5jcmVhdGVDb21wb25lbnQoY29tcG9uZW50KTtcbiAgfVxuXG4gIHByaXZhdGUgX2luc3RhbnRpYXRlZDogYm9vbGVhbiA9IGZhbHNlO1xuXG4gIHByaXZhdGUgX2NvbXBpbGVyOiBUZXN0aW5nQ29tcGlsZXIgPSBudWxsICE7XG4gIHByaXZhdGUgX21vZHVsZVJlZjogTmdNb2R1bGVSZWY8YW55PiA9IG51bGwgITtcbiAgcHJpdmF0ZSBfbW9kdWxlRmFjdG9yeTogTmdNb2R1bGVGYWN0b3J5PGFueT4gPSBudWxsICE7XG5cbiAgcHJpdmF0ZSBfY29tcGlsZXJPcHRpb25zOiBDb21waWxlck9wdGlvbnNbXSA9IFtdO1xuXG4gIHByaXZhdGUgX21vZHVsZU92ZXJyaWRlczogW1R5cGU8YW55PiwgTWV0YWRhdGFPdmVycmlkZTxOZ01vZHVsZT5dW10gPSBbXTtcbiAgcHJpdmF0ZSBfY29tcG9uZW50T3ZlcnJpZGVzOiBbVHlwZTxhbnk+LCBNZXRhZGF0YU92ZXJyaWRlPENvbXBvbmVudD5dW10gPSBbXTtcbiAgcHJpdmF0ZSBfZGlyZWN0aXZlT3ZlcnJpZGVzOiBbVHlwZTxhbnk+LCBNZXRhZGF0YU92ZXJyaWRlPERpcmVjdGl2ZT5dW10gPSBbXTtcbiAgcHJpdmF0ZSBfcGlwZU92ZXJyaWRlczogW1R5cGU8YW55PiwgTWV0YWRhdGFPdmVycmlkZTxQaXBlPl1bXSA9IFtdO1xuXG4gIHByaXZhdGUgX3Byb3ZpZGVyczogUHJvdmlkZXJbXSA9IFtdO1xuICBwcml2YXRlIF9kZWNsYXJhdGlvbnM6IEFycmF5PFR5cGU8YW55PnxhbnlbXXxhbnk+ID0gW107XG4gIHByaXZhdGUgX2ltcG9ydHM6IEFycmF5PFR5cGU8YW55PnxhbnlbXXxhbnk+ID0gW107XG4gIHByaXZhdGUgX3NjaGVtYXM6IEFycmF5PFNjaGVtYU1ldGFkYXRhfGFueVtdPiA9IFtdO1xuICBwcml2YXRlIF9hY3RpdmVGaXh0dXJlczogQ29tcG9uZW50Rml4dHVyZTxhbnk+W10gPSBbXTtcblxuICBwcml2YXRlIF90ZXN0RW52QW90U3VtbWFyaWVzOiAoKSA9PiBhbnlbXSA9ICgpID0+IFtdO1xuICBwcml2YXRlIF9hb3RTdW1tYXJpZXM6IEFycmF5PCgpID0+IGFueVtdPiA9IFtdO1xuICBwcml2YXRlIF90ZW1wbGF0ZU92ZXJyaWRlczogQXJyYXk8e2NvbXBvbmVudDogVHlwZTxhbnk+LCB0ZW1wbGF0ZU9mOiBUeXBlPGFueT59PiA9IFtdO1xuXG4gIHByaXZhdGUgX2lzUm9vdDogYm9vbGVhbiA9IHRydWU7XG4gIHByaXZhdGUgX3Jvb3RQcm92aWRlck92ZXJyaWRlczogUHJvdmlkZXJbXSA9IFtdO1xuXG4gIHBsYXRmb3JtOiBQbGF0Zm9ybVJlZiA9IG51bGwgITtcblxuICBuZ01vZHVsZTogVHlwZTxhbnk+fFR5cGU8YW55PltdID0gbnVsbCAhO1xuXG4gIC8qKlxuICAgKiBJbml0aWFsaXplIHRoZSBlbnZpcm9ubWVudCBmb3IgdGVzdGluZyB3aXRoIGEgY29tcGlsZXIgZmFjdG9yeSwgYSBQbGF0Zm9ybVJlZiwgYW5kIGFuXG4gICAqIGFuZ3VsYXIgbW9kdWxlLiBUaGVzZSBhcmUgY29tbW9uIHRvIGV2ZXJ5IHRlc3QgaW4gdGhlIHN1aXRlLlxuICAgKlxuICAgKiBUaGlzIG1heSBvbmx5IGJlIGNhbGxlZCBvbmNlLCB0byBzZXQgdXAgdGhlIGNvbW1vbiBwcm92aWRlcnMgZm9yIHRoZSBjdXJyZW50IHRlc3RcbiAgICogc3VpdGUgb24gdGhlIGN1cnJlbnQgcGxhdGZvcm0uIElmIHlvdSBhYnNvbHV0ZWx5IG5lZWQgdG8gY2hhbmdlIHRoZSBwcm92aWRlcnMsXG4gICAqIGZpcnN0IHVzZSBgcmVzZXRUZXN0RW52aXJvbm1lbnRgLlxuICAgKlxuICAgKiBUZXN0IG1vZHVsZXMgYW5kIHBsYXRmb3JtcyBmb3IgaW5kaXZpZHVhbCBwbGF0Zm9ybXMgYXJlIGF2YWlsYWJsZSBmcm9tXG4gICAqICdAYW5ndWxhci88cGxhdGZvcm1fbmFtZT4vdGVzdGluZycuXG4gICAqXG4gICAqIEBwdWJsaWNBcGlcbiAgICovXG4gIGluaXRUZXN0RW52aXJvbm1lbnQoXG4gICAgICBuZ01vZHVsZTogVHlwZTxhbnk+fFR5cGU8YW55PltdLCBwbGF0Zm9ybTogUGxhdGZvcm1SZWYsIGFvdFN1bW1hcmllcz86ICgpID0+IGFueVtdKTogdm9pZCB7XG4gICAgaWYgKHRoaXMucGxhdGZvcm0gfHwgdGhpcy5uZ01vZHVsZSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3Qgc2V0IGJhc2UgcHJvdmlkZXJzIGJlY2F1c2UgaXQgaGFzIGFscmVhZHkgYmVlbiBjYWxsZWQnKTtcbiAgICB9XG4gICAgdGhpcy5wbGF0Zm9ybSA9IHBsYXRmb3JtO1xuICAgIHRoaXMubmdNb2R1bGUgPSBuZ01vZHVsZTtcbiAgICBpZiAoYW90U3VtbWFyaWVzKSB7XG4gICAgICB0aGlzLl90ZXN0RW52QW90U3VtbWFyaWVzID0gYW90U3VtbWFyaWVzO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBSZXNldCB0aGUgcHJvdmlkZXJzIGZvciB0aGUgdGVzdCBpbmplY3Rvci5cbiAgICpcbiAgICogQHB1YmxpY0FwaVxuICAgKi9cbiAgcmVzZXRUZXN0RW52aXJvbm1lbnQoKTogdm9pZCB7XG4gICAgdGhpcy5yZXNldFRlc3RpbmdNb2R1bGUoKTtcbiAgICB0aGlzLnBsYXRmb3JtID0gbnVsbCAhO1xuICAgIHRoaXMubmdNb2R1bGUgPSBudWxsICE7XG4gICAgdGhpcy5fdGVzdEVudkFvdFN1bW1hcmllcyA9ICgpID0+IFtdO1xuICB9XG5cbiAgcmVzZXRUZXN0aW5nTW9kdWxlKCk6IHZvaWQge1xuICAgIGNsZWFyT3ZlcnJpZGVzKCk7XG4gICAgdGhpcy5fYW90U3VtbWFyaWVzID0gW107XG4gICAgdGhpcy5fdGVtcGxhdGVPdmVycmlkZXMgPSBbXTtcbiAgICB0aGlzLl9jb21waWxlciA9IG51bGwgITtcbiAgICB0aGlzLl9tb2R1bGVPdmVycmlkZXMgPSBbXTtcbiAgICB0aGlzLl9jb21wb25lbnRPdmVycmlkZXMgPSBbXTtcbiAgICB0aGlzLl9kaXJlY3RpdmVPdmVycmlkZXMgPSBbXTtcbiAgICB0aGlzLl9waXBlT3ZlcnJpZGVzID0gW107XG5cbiAgICB0aGlzLl9pc1Jvb3QgPSB0cnVlO1xuICAgIHRoaXMuX3Jvb3RQcm92aWRlck92ZXJyaWRlcyA9IFtdO1xuXG4gICAgdGhpcy5fbW9kdWxlUmVmID0gbnVsbCAhO1xuICAgIHRoaXMuX21vZHVsZUZhY3RvcnkgPSBudWxsICE7XG4gICAgdGhpcy5fY29tcGlsZXJPcHRpb25zID0gW107XG4gICAgdGhpcy5fcHJvdmlkZXJzID0gW107XG4gICAgdGhpcy5fZGVjbGFyYXRpb25zID0gW107XG4gICAgdGhpcy5faW1wb3J0cyA9IFtdO1xuICAgIHRoaXMuX3NjaGVtYXMgPSBbXTtcbiAgICB0aGlzLl9pbnN0YW50aWF0ZWQgPSBmYWxzZTtcbiAgICB0aGlzLl9hY3RpdmVGaXh0dXJlcy5mb3JFYWNoKChmaXh0dXJlKSA9PiB7XG4gICAgICB0cnkge1xuICAgICAgICBmaXh0dXJlLmRlc3Ryb3koKTtcbiAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcignRXJyb3IgZHVyaW5nIGNsZWFudXAgb2YgY29tcG9uZW50Jywge1xuICAgICAgICAgIGNvbXBvbmVudDogZml4dHVyZS5jb21wb25lbnRJbnN0YW5jZSxcbiAgICAgICAgICBzdGFja3RyYWNlOiBlLFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICB0aGlzLl9hY3RpdmVGaXh0dXJlcyA9IFtdO1xuICB9XG5cbiAgY29uZmlndXJlQ29tcGlsZXIoY29uZmlnOiB7cHJvdmlkZXJzPzogYW55W10sIHVzZUppdD86IGJvb2xlYW59KTogdm9pZCB7XG4gICAgdGhpcy5fYXNzZXJ0Tm90SW5zdGFudGlhdGVkKCdUZXN0QmVkLmNvbmZpZ3VyZUNvbXBpbGVyJywgJ2NvbmZpZ3VyZSB0aGUgY29tcGlsZXInKTtcbiAgICB0aGlzLl9jb21waWxlck9wdGlvbnMucHVzaChjb25maWcpO1xuICB9XG5cbiAgY29uZmlndXJlVGVzdGluZ01vZHVsZShtb2R1bGVEZWY6IFRlc3RNb2R1bGVNZXRhZGF0YSk6IHZvaWQge1xuICAgIHRoaXMuX2Fzc2VydE5vdEluc3RhbnRpYXRlZCgnVGVzdEJlZC5jb25maWd1cmVUZXN0aW5nTW9kdWxlJywgJ2NvbmZpZ3VyZSB0aGUgdGVzdCBtb2R1bGUnKTtcbiAgICBpZiAobW9kdWxlRGVmLnByb3ZpZGVycykge1xuICAgICAgdGhpcy5fcHJvdmlkZXJzLnB1c2goLi4ubW9kdWxlRGVmLnByb3ZpZGVycyk7XG4gICAgfVxuICAgIGlmIChtb2R1bGVEZWYuZGVjbGFyYXRpb25zKSB7XG4gICAgICB0aGlzLl9kZWNsYXJhdGlvbnMucHVzaCguLi5tb2R1bGVEZWYuZGVjbGFyYXRpb25zKTtcbiAgICB9XG4gICAgaWYgKG1vZHVsZURlZi5pbXBvcnRzKSB7XG4gICAgICB0aGlzLl9pbXBvcnRzLnB1c2goLi4ubW9kdWxlRGVmLmltcG9ydHMpO1xuICAgIH1cbiAgICBpZiAobW9kdWxlRGVmLnNjaGVtYXMpIHtcbiAgICAgIHRoaXMuX3NjaGVtYXMucHVzaCguLi5tb2R1bGVEZWYuc2NoZW1hcyk7XG4gICAgfVxuICAgIGlmIChtb2R1bGVEZWYuYW90U3VtbWFyaWVzKSB7XG4gICAgICB0aGlzLl9hb3RTdW1tYXJpZXMucHVzaChtb2R1bGVEZWYuYW90U3VtbWFyaWVzKTtcbiAgICB9XG4gIH1cblxuICBjb21waWxlQ29tcG9uZW50cygpOiBQcm9taXNlPGFueT4ge1xuICAgIGlmICh0aGlzLl9tb2R1bGVGYWN0b3J5IHx8IHRoaXMuX2luc3RhbnRpYXRlZCkge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShudWxsKTtcbiAgICB9XG5cbiAgICBjb25zdCBtb2R1bGVUeXBlID0gdGhpcy5fY3JlYXRlQ29tcGlsZXJBbmRNb2R1bGUoKTtcbiAgICByZXR1cm4gdGhpcy5fY29tcGlsZXIuY29tcGlsZU1vZHVsZUFuZEFsbENvbXBvbmVudHNBc3luYyhtb2R1bGVUeXBlKVxuICAgICAgICAudGhlbigobW9kdWxlQW5kQ29tcG9uZW50RmFjdG9yaWVzKSA9PiB7XG4gICAgICAgICAgdGhpcy5fbW9kdWxlRmFjdG9yeSA9IG1vZHVsZUFuZENvbXBvbmVudEZhY3Rvcmllcy5uZ01vZHVsZUZhY3Rvcnk7XG4gICAgICAgIH0pO1xuICB9XG5cbiAgcHJpdmF0ZSBfaW5pdElmTmVlZGVkKCk6IHZvaWQge1xuICAgIGlmICh0aGlzLl9pbnN0YW50aWF0ZWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKCF0aGlzLl9tb2R1bGVGYWN0b3J5KSB7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCBtb2R1bGVUeXBlID0gdGhpcy5fY3JlYXRlQ29tcGlsZXJBbmRNb2R1bGUoKTtcbiAgICAgICAgdGhpcy5fbW9kdWxlRmFjdG9yeSA9XG4gICAgICAgICAgICB0aGlzLl9jb21waWxlci5jb21waWxlTW9kdWxlQW5kQWxsQ29tcG9uZW50c1N5bmMobW9kdWxlVHlwZSkubmdNb2R1bGVGYWN0b3J5O1xuICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBjb25zdCBlcnJvckNvbXBUeXBlID0gdGhpcy5fY29tcGlsZXIuZ2V0Q29tcG9uZW50RnJvbUVycm9yKGUpO1xuICAgICAgICBpZiAoZXJyb3JDb21wVHlwZSkge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICAgICAgYFRoaXMgdGVzdCBtb2R1bGUgdXNlcyB0aGUgY29tcG9uZW50ICR7c3RyaW5naWZ5KGVycm9yQ29tcFR5cGUpfSB3aGljaCBpcyB1c2luZyBhIFwidGVtcGxhdGVVcmxcIiBvciBcInN0eWxlVXJsc1wiLCBidXQgdGhleSB3ZXJlIG5ldmVyIGNvbXBpbGVkLiBgICtcbiAgICAgICAgICAgICAgYFBsZWFzZSBjYWxsIFwiVGVzdEJlZC5jb21waWxlQ29tcG9uZW50c1wiIGJlZm9yZSB5b3VyIHRlc3QuYCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhyb3cgZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBmb3IgKGNvbnN0IHtjb21wb25lbnQsIHRlbXBsYXRlT2Z9IG9mIHRoaXMuX3RlbXBsYXRlT3ZlcnJpZGVzKSB7XG4gICAgICBjb25zdCBjb21wRmFjdG9yeSA9IHRoaXMuX2NvbXBpbGVyLmdldENvbXBvbmVudEZhY3RvcnkodGVtcGxhdGVPZik7XG4gICAgICBvdmVycmlkZUNvbXBvbmVudFZpZXcoY29tcG9uZW50LCBjb21wRmFjdG9yeSk7XG4gICAgfVxuXG4gICAgY29uc3Qgbmdab25lID0gbmV3IE5nWm9uZSh7ZW5hYmxlTG9uZ1N0YWNrVHJhY2U6IHRydWV9KTtcbiAgICBjb25zdCBwcm92aWRlcnM6IFN0YXRpY1Byb3ZpZGVyW10gPSBbe3Byb3ZpZGU6IE5nWm9uZSwgdXNlVmFsdWU6IG5nWm9uZX1dO1xuICAgIGNvbnN0IG5nWm9uZUluamVjdG9yID0gSW5qZWN0b3IuY3JlYXRlKHtcbiAgICAgIHByb3ZpZGVyczogcHJvdmlkZXJzLFxuICAgICAgcGFyZW50OiB0aGlzLnBsYXRmb3JtLmluamVjdG9yLFxuICAgICAgbmFtZTogdGhpcy5fbW9kdWxlRmFjdG9yeS5tb2R1bGVUeXBlLm5hbWVcbiAgICB9KTtcbiAgICB0aGlzLl9tb2R1bGVSZWYgPSB0aGlzLl9tb2R1bGVGYWN0b3J5LmNyZWF0ZShuZ1pvbmVJbmplY3Rvcik7XG4gICAgLy8gQXBwbGljYXRpb25Jbml0U3RhdHVzLnJ1bkluaXRpYWxpemVycygpIGlzIG1hcmtlZCBAaW50ZXJuYWwgdG8gY29yZS4gU28gY2FzdGluZyB0byBhbnlcbiAgICAvLyBiZWZvcmUgYWNjZXNzaW5nIGl0LlxuICAgICh0aGlzLl9tb2R1bGVSZWYuaW5qZWN0b3IuZ2V0KEFwcGxpY2F0aW9uSW5pdFN0YXR1cykgYXMgYW55KS5ydW5Jbml0aWFsaXplcnMoKTtcbiAgICB0aGlzLl9pbnN0YW50aWF0ZWQgPSB0cnVlO1xuICB9XG5cbiAgcHJpdmF0ZSBfY3JlYXRlQ29tcGlsZXJBbmRNb2R1bGUoKTogVHlwZTxhbnk+IHtcbiAgICBjb25zdCBwcm92aWRlcnMgPSB0aGlzLl9wcm92aWRlcnMuY29uY2F0KFt7cHJvdmlkZTogVGVzdEJlZCwgdXNlVmFsdWU6IHRoaXN9XSk7XG4gICAgY29uc3QgZGVjbGFyYXRpb25zID1cbiAgICAgICAgWy4uLnRoaXMuX2RlY2xhcmF0aW9ucywgLi4udGhpcy5fdGVtcGxhdGVPdmVycmlkZXMubWFwKGVudHJ5ID0+IGVudHJ5LnRlbXBsYXRlT2YpXTtcblxuICAgIGNvbnN0IHJvb3RTY29wZUltcG9ydHMgPSBbXTtcbiAgICBjb25zdCByb290UHJvdmlkZXJPdmVycmlkZXMgPSB0aGlzLl9yb290UHJvdmlkZXJPdmVycmlkZXM7XG4gICAgaWYgKHRoaXMuX2lzUm9vdCkge1xuICAgICAgQE5nTW9kdWxlKHtcbiAgICAgICAgcHJvdmlkZXJzOiBbXG4gICAgICAgICAgLi4ucm9vdFByb3ZpZGVyT3ZlcnJpZGVzLFxuICAgICAgICBdLFxuICAgICAgICBqaXQ6IHRydWUsXG4gICAgICB9KVxuICAgICAgY2xhc3MgUm9vdFNjb3BlTW9kdWxlIHtcbiAgICAgIH1cbiAgICAgIHJvb3RTY29wZUltcG9ydHMucHVzaChSb290U2NvcGVNb2R1bGUpO1xuICAgIH1cbiAgICBwcm92aWRlcnMucHVzaCh7cHJvdmlkZTogQVBQX1JPT1QsIHVzZVZhbHVlOiB0aGlzLl9pc1Jvb3R9KTtcblxuICAgIGNvbnN0IGltcG9ydHMgPSBbcm9vdFNjb3BlSW1wb3J0cywgdGhpcy5uZ01vZHVsZSwgdGhpcy5faW1wb3J0c107XG4gICAgY29uc3Qgc2NoZW1hcyA9IHRoaXMuX3NjaGVtYXM7XG5cbiAgICBATmdNb2R1bGUoe3Byb3ZpZGVycywgZGVjbGFyYXRpb25zLCBpbXBvcnRzLCBzY2hlbWFzLCBqaXQ6IHRydWV9KVxuICAgIGNsYXNzIER5bmFtaWNUZXN0TW9kdWxlIHtcbiAgICB9XG5cbiAgICBjb25zdCBjb21waWxlckZhY3Rvcnk6IFRlc3RpbmdDb21waWxlckZhY3RvcnkgPVxuICAgICAgICB0aGlzLnBsYXRmb3JtLmluamVjdG9yLmdldChUZXN0aW5nQ29tcGlsZXJGYWN0b3J5KTtcbiAgICB0aGlzLl9jb21waWxlciA9IGNvbXBpbGVyRmFjdG9yeS5jcmVhdGVUZXN0aW5nQ29tcGlsZXIodGhpcy5fY29tcGlsZXJPcHRpb25zKTtcbiAgICBmb3IgKGNvbnN0IHN1bW1hcnkgb2YgW3RoaXMuX3Rlc3RFbnZBb3RTdW1tYXJpZXMsIC4uLnRoaXMuX2FvdFN1bW1hcmllc10pIHtcbiAgICAgIHRoaXMuX2NvbXBpbGVyLmxvYWRBb3RTdW1tYXJpZXMoc3VtbWFyeSk7XG4gICAgfVxuICAgIHRoaXMuX21vZHVsZU92ZXJyaWRlcy5mb3JFYWNoKChlbnRyeSkgPT4gdGhpcy5fY29tcGlsZXIub3ZlcnJpZGVNb2R1bGUoZW50cnlbMF0sIGVudHJ5WzFdKSk7XG4gICAgdGhpcy5fY29tcG9uZW50T3ZlcnJpZGVzLmZvckVhY2goXG4gICAgICAgIChlbnRyeSkgPT4gdGhpcy5fY29tcGlsZXIub3ZlcnJpZGVDb21wb25lbnQoZW50cnlbMF0sIGVudHJ5WzFdKSk7XG4gICAgdGhpcy5fZGlyZWN0aXZlT3ZlcnJpZGVzLmZvckVhY2goXG4gICAgICAgIChlbnRyeSkgPT4gdGhpcy5fY29tcGlsZXIub3ZlcnJpZGVEaXJlY3RpdmUoZW50cnlbMF0sIGVudHJ5WzFdKSk7XG4gICAgdGhpcy5fcGlwZU92ZXJyaWRlcy5mb3JFYWNoKChlbnRyeSkgPT4gdGhpcy5fY29tcGlsZXIub3ZlcnJpZGVQaXBlKGVudHJ5WzBdLCBlbnRyeVsxXSkpO1xuICAgIHJldHVybiBEeW5hbWljVGVzdE1vZHVsZTtcbiAgfVxuXG4gIHByaXZhdGUgX2Fzc2VydE5vdEluc3RhbnRpYXRlZChtZXRob2ROYW1lOiBzdHJpbmcsIG1ldGhvZERlc2NyaXB0aW9uOiBzdHJpbmcpIHtcbiAgICBpZiAodGhpcy5faW5zdGFudGlhdGVkKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgYENhbm5vdCAke21ldGhvZERlc2NyaXB0aW9ufSB3aGVuIHRoZSB0ZXN0IG1vZHVsZSBoYXMgYWxyZWFkeSBiZWVuIGluc3RhbnRpYXRlZC4gYCArXG4gICAgICAgICAgYE1ha2Ugc3VyZSB5b3UgYXJlIG5vdCB1c2luZyBcXGBpbmplY3RcXGAgYmVmb3JlIFxcYCR7bWV0aG9kTmFtZX1cXGAuYCk7XG4gICAgfVxuICB9XG5cbiAgZ2V0KHRva2VuOiBhbnksIG5vdEZvdW5kVmFsdWU6IGFueSA9IEluamVjdG9yLlRIUk9XX0lGX05PVF9GT1VORCk6IGFueSB7XG4gICAgdGhpcy5faW5pdElmTmVlZGVkKCk7XG4gICAgaWYgKHRva2VuID09PSBUZXN0QmVkKSB7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgLy8gVGVzdHMgY2FuIGluamVjdCB0aGluZ3MgZnJvbSB0aGUgbmcgbW9kdWxlIGFuZCBmcm9tIHRoZSBjb21waWxlcixcbiAgICAvLyBidXQgdGhlIG5nIG1vZHVsZSBjYW4ndCBpbmplY3QgdGhpbmdzIGZyb20gdGhlIGNvbXBpbGVyIGFuZCB2aWNlIHZlcnNhLlxuICAgIGNvbnN0IHJlc3VsdCA9IHRoaXMuX21vZHVsZVJlZi5pbmplY3Rvci5nZXQodG9rZW4sIFVOREVGSU5FRCk7XG4gICAgcmV0dXJuIHJlc3VsdCA9PT0gVU5ERUZJTkVEID8gdGhpcy5fY29tcGlsZXIuaW5qZWN0b3IuZ2V0KHRva2VuLCBub3RGb3VuZFZhbHVlKSA6IHJlc3VsdDtcbiAgfVxuXG4gIGV4ZWN1dGUodG9rZW5zOiBhbnlbXSwgZm46IEZ1bmN0aW9uLCBjb250ZXh0PzogYW55KTogYW55IHtcbiAgICB0aGlzLl9pbml0SWZOZWVkZWQoKTtcbiAgICBjb25zdCBwYXJhbXMgPSB0b2tlbnMubWFwKHQgPT4gdGhpcy5nZXQodCkpO1xuICAgIHJldHVybiBmbi5hcHBseShjb250ZXh0LCBwYXJhbXMpO1xuICB9XG5cbiAgb3ZlcnJpZGVNb2R1bGUobmdNb2R1bGU6IFR5cGU8YW55Piwgb3ZlcnJpZGU6IE1ldGFkYXRhT3ZlcnJpZGU8TmdNb2R1bGU+KTogdm9pZCB7XG4gICAgdGhpcy5fYXNzZXJ0Tm90SW5zdGFudGlhdGVkKCdvdmVycmlkZU1vZHVsZScsICdvdmVycmlkZSBtb2R1bGUgbWV0YWRhdGEnKTtcbiAgICB0aGlzLl9tb2R1bGVPdmVycmlkZXMucHVzaChbbmdNb2R1bGUsIG92ZXJyaWRlXSk7XG4gIH1cblxuICBvdmVycmlkZUNvbXBvbmVudChjb21wb25lbnQ6IFR5cGU8YW55Piwgb3ZlcnJpZGU6IE1ldGFkYXRhT3ZlcnJpZGU8Q29tcG9uZW50Pik6IHZvaWQge1xuICAgIHRoaXMuX2Fzc2VydE5vdEluc3RhbnRpYXRlZCgnb3ZlcnJpZGVDb21wb25lbnQnLCAnb3ZlcnJpZGUgY29tcG9uZW50IG1ldGFkYXRhJyk7XG4gICAgdGhpcy5fY29tcG9uZW50T3ZlcnJpZGVzLnB1c2goW2NvbXBvbmVudCwgb3ZlcnJpZGVdKTtcbiAgfVxuXG4gIG92ZXJyaWRlRGlyZWN0aXZlKGRpcmVjdGl2ZTogVHlwZTxhbnk+LCBvdmVycmlkZTogTWV0YWRhdGFPdmVycmlkZTxEaXJlY3RpdmU+KTogdm9pZCB7XG4gICAgdGhpcy5fYXNzZXJ0Tm90SW5zdGFudGlhdGVkKCdvdmVycmlkZURpcmVjdGl2ZScsICdvdmVycmlkZSBkaXJlY3RpdmUgbWV0YWRhdGEnKTtcbiAgICB0aGlzLl9kaXJlY3RpdmVPdmVycmlkZXMucHVzaChbZGlyZWN0aXZlLCBvdmVycmlkZV0pO1xuICB9XG5cbiAgb3ZlcnJpZGVQaXBlKHBpcGU6IFR5cGU8YW55Piwgb3ZlcnJpZGU6IE1ldGFkYXRhT3ZlcnJpZGU8UGlwZT4pOiB2b2lkIHtcbiAgICB0aGlzLl9hc3NlcnROb3RJbnN0YW50aWF0ZWQoJ292ZXJyaWRlUGlwZScsICdvdmVycmlkZSBwaXBlIG1ldGFkYXRhJyk7XG4gICAgdGhpcy5fcGlwZU92ZXJyaWRlcy5wdXNoKFtwaXBlLCBvdmVycmlkZV0pO1xuICB9XG5cbiAgLyoqXG4gICAqIE92ZXJ3cml0ZXMgYWxsIHByb3ZpZGVycyBmb3IgdGhlIGdpdmVuIHRva2VuIHdpdGggdGhlIGdpdmVuIHByb3ZpZGVyIGRlZmluaXRpb24uXG4gICAqL1xuICBvdmVycmlkZVByb3ZpZGVyKHRva2VuOiBhbnksIHByb3ZpZGVyOiB7XG4gICAgdXNlRmFjdG9yeTogRnVuY3Rpb24sXG4gICAgZGVwczogYW55W10sXG4gIH0pOiB2b2lkO1xuICBvdmVycmlkZVByb3ZpZGVyKHRva2VuOiBhbnksIHByb3ZpZGVyOiB7dXNlVmFsdWU6IGFueTt9KTogdm9pZDtcbiAgb3ZlcnJpZGVQcm92aWRlcih0b2tlbjogYW55LCBwcm92aWRlcjoge3VzZUZhY3Rvcnk/OiBGdW5jdGlvbiwgdXNlVmFsdWU/OiBhbnksIGRlcHM/OiBhbnlbXX0pOlxuICAgICAgdm9pZCB7XG4gICAgdGhpcy5vdmVycmlkZVByb3ZpZGVySW1wbCh0b2tlbiwgcHJvdmlkZXIpO1xuICB9XG5cbiAgLyoqXG4gICAqIE92ZXJ3cml0ZXMgYWxsIHByb3ZpZGVycyBmb3IgdGhlIGdpdmVuIHRva2VuIHdpdGggdGhlIGdpdmVuIHByb3ZpZGVyIGRlZmluaXRpb24uXG4gICAqXG4gICAqIEBkZXByZWNhdGVkIGFzIGl0IG1ha2VzIGFsbCBOZ01vZHVsZXMgbGF6eS4gSW50cm9kdWNlZCBvbmx5IGZvciBtaWdyYXRpbmcgb2ZmIG9mIGl0LlxuICAgKi9cbiAgZGVwcmVjYXRlZE92ZXJyaWRlUHJvdmlkZXIodG9rZW46IGFueSwgcHJvdmlkZXI6IHtcbiAgICB1c2VGYWN0b3J5OiBGdW5jdGlvbixcbiAgICBkZXBzOiBhbnlbXSxcbiAgfSk6IHZvaWQ7XG4gIGRlcHJlY2F0ZWRPdmVycmlkZVByb3ZpZGVyKHRva2VuOiBhbnksIHByb3ZpZGVyOiB7dXNlVmFsdWU6IGFueTt9KTogdm9pZDtcbiAgZGVwcmVjYXRlZE92ZXJyaWRlUHJvdmlkZXIoXG4gICAgICB0b2tlbjogYW55LCBwcm92aWRlcjoge3VzZUZhY3Rvcnk/OiBGdW5jdGlvbiwgdXNlVmFsdWU/OiBhbnksIGRlcHM/OiBhbnlbXX0pOiB2b2lkIHtcbiAgICB0aGlzLm92ZXJyaWRlUHJvdmlkZXJJbXBsKHRva2VuLCBwcm92aWRlciwgLyogZGVwcmVjYXRlZCAqLyB0cnVlKTtcbiAgfVxuXG4gIHByaXZhdGUgb3ZlcnJpZGVQcm92aWRlckltcGwoXG4gICAgICB0b2tlbjogYW55LCBwcm92aWRlcjoge1xuICAgICAgICB1c2VGYWN0b3J5PzogRnVuY3Rpb24sXG4gICAgICAgIHVzZVZhbHVlPzogYW55LFxuICAgICAgICBkZXBzPzogYW55W10sXG4gICAgICB9LFxuICAgICAgZGVwcmVjYXRlZCA9IGZhbHNlKTogdm9pZCB7XG4gICAgbGV0IGRlZjogSW5qZWN0YWJsZURlZjxhbnk+fG51bGwgPSBudWxsO1xuICAgIGlmICh0eXBlb2YgdG9rZW4gIT09ICdzdHJpbmcnICYmIChkZWYgPSBnZXRJbmplY3RhYmxlRGVmKHRva2VuKSkgJiYgZGVmLnByb3ZpZGVkSW4gPT09ICdyb290Jykge1xuICAgICAgaWYgKHByb3ZpZGVyLnVzZUZhY3RvcnkpIHtcbiAgICAgICAgdGhpcy5fcm9vdFByb3ZpZGVyT3ZlcnJpZGVzLnB1c2goXG4gICAgICAgICAgICB7cHJvdmlkZTogdG9rZW4sIHVzZUZhY3Rvcnk6IHByb3ZpZGVyLnVzZUZhY3RvcnksIGRlcHM6IHByb3ZpZGVyLmRlcHMgfHwgW119KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuX3Jvb3RQcm92aWRlck92ZXJyaWRlcy5wdXNoKHtwcm92aWRlOiB0b2tlbiwgdXNlVmFsdWU6IHByb3ZpZGVyLnVzZVZhbHVlfSk7XG4gICAgICB9XG4gICAgfVxuICAgIGxldCBmbGFnczogTm9kZUZsYWdzID0gMDtcbiAgICBsZXQgdmFsdWU6IGFueTtcbiAgICBpZiAocHJvdmlkZXIudXNlRmFjdG9yeSkge1xuICAgICAgZmxhZ3MgfD0gTm9kZUZsYWdzLlR5cGVGYWN0b3J5UHJvdmlkZXI7XG4gICAgICB2YWx1ZSA9IHByb3ZpZGVyLnVzZUZhY3Rvcnk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGZsYWdzIHw9IE5vZGVGbGFncy5UeXBlVmFsdWVQcm92aWRlcjtcbiAgICAgIHZhbHVlID0gcHJvdmlkZXIudXNlVmFsdWU7XG4gICAgfVxuICAgIGNvbnN0IGRlcHMgPSAocHJvdmlkZXIuZGVwcyB8fCBbXSkubWFwKChkZXApID0+IHtcbiAgICAgIGxldCBkZXBGbGFnczogRGVwRmxhZ3MgPSBEZXBGbGFncy5Ob25lO1xuICAgICAgbGV0IGRlcFRva2VuOiBhbnk7XG4gICAgICBpZiAoQXJyYXkuaXNBcnJheShkZXApKSB7XG4gICAgICAgIGRlcC5mb3JFYWNoKChlbnRyeTogYW55KSA9PiB7XG4gICAgICAgICAgaWYgKGVudHJ5IGluc3RhbmNlb2YgT3B0aW9uYWwpIHtcbiAgICAgICAgICAgIGRlcEZsYWdzIHw9IERlcEZsYWdzLk9wdGlvbmFsO1xuICAgICAgICAgIH0gZWxzZSBpZiAoZW50cnkgaW5zdGFuY2VvZiBTa2lwU2VsZikge1xuICAgICAgICAgICAgZGVwRmxhZ3MgfD0gRGVwRmxhZ3MuU2tpcFNlbGY7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGRlcFRva2VuID0gZW50cnk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGRlcFRva2VuID0gZGVwO1xuICAgICAgfVxuICAgICAgcmV0dXJuIFtkZXBGbGFncywgZGVwVG9rZW5dO1xuICAgIH0pO1xuICAgIG92ZXJyaWRlUHJvdmlkZXIoe3Rva2VuLCBmbGFncywgZGVwcywgdmFsdWUsIGRlcHJlY2F0ZWRCZWhhdmlvcjogZGVwcmVjYXRlZH0pO1xuICB9XG5cbiAgb3ZlcnJpZGVUZW1wbGF0ZVVzaW5nVGVzdGluZ01vZHVsZShjb21wb25lbnQ6IFR5cGU8YW55PiwgdGVtcGxhdGU6IHN0cmluZykge1xuICAgIHRoaXMuX2Fzc2VydE5vdEluc3RhbnRpYXRlZCgnb3ZlcnJpZGVUZW1wbGF0ZVVzaW5nVGVzdGluZ01vZHVsZScsICdvdmVycmlkZSB0ZW1wbGF0ZScpO1xuXG4gICAgQENvbXBvbmVudCh7c2VsZWN0b3I6ICdlbXB0eScsIHRlbXBsYXRlLCBqaXQ6IHRydWV9KVxuICAgIGNsYXNzIE92ZXJyaWRlQ29tcG9uZW50IHtcbiAgICB9XG5cbiAgICB0aGlzLl90ZW1wbGF0ZU92ZXJyaWRlcy5wdXNoKHtjb21wb25lbnQsIHRlbXBsYXRlT2Y6IE92ZXJyaWRlQ29tcG9uZW50fSk7XG4gIH1cblxuICBjcmVhdGVDb21wb25lbnQ8VD4oY29tcG9uZW50OiBUeXBlPFQ+KTogQ29tcG9uZW50Rml4dHVyZTxUPiB7XG4gICAgdGhpcy5faW5pdElmTmVlZGVkKCk7XG4gICAgY29uc3QgY29tcG9uZW50RmFjdG9yeSA9IHRoaXMuX2NvbXBpbGVyLmdldENvbXBvbmVudEZhY3RvcnkoY29tcG9uZW50KTtcblxuICAgIGlmICghY29tcG9uZW50RmFjdG9yeSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgIGBDYW5ub3QgY3JlYXRlIHRoZSBjb21wb25lbnQgJHtzdHJpbmdpZnkoY29tcG9uZW50KX0gYXMgaXQgd2FzIG5vdCBpbXBvcnRlZCBpbnRvIHRoZSB0ZXN0aW5nIG1vZHVsZSFgKTtcbiAgICB9XG5cbiAgICBjb25zdCBub05nWm9uZSA9IHRoaXMuZ2V0KENvbXBvbmVudEZpeHR1cmVOb05nWm9uZSwgZmFsc2UpO1xuICAgIGNvbnN0IGF1dG9EZXRlY3Q6IGJvb2xlYW4gPSB0aGlzLmdldChDb21wb25lbnRGaXh0dXJlQXV0b0RldGVjdCwgZmFsc2UpO1xuICAgIGNvbnN0IG5nWm9uZTogTmdab25lID0gbm9OZ1pvbmUgPyBudWxsIDogdGhpcy5nZXQoTmdab25lLCBudWxsKTtcbiAgICBjb25zdCB0ZXN0Q29tcG9uZW50UmVuZGVyZXI6IFRlc3RDb21wb25lbnRSZW5kZXJlciA9IHRoaXMuZ2V0KFRlc3RDb21wb25lbnRSZW5kZXJlcik7XG4gICAgY29uc3Qgcm9vdEVsSWQgPSBgcm9vdCR7X25leHRSb290RWxlbWVudElkKyt9YDtcbiAgICB0ZXN0Q29tcG9uZW50UmVuZGVyZXIuaW5zZXJ0Um9vdEVsZW1lbnQocm9vdEVsSWQpO1xuXG4gICAgY29uc3QgaW5pdENvbXBvbmVudCA9ICgpID0+IHtcbiAgICAgIGNvbnN0IGNvbXBvbmVudFJlZiA9XG4gICAgICAgICAgY29tcG9uZW50RmFjdG9yeS5jcmVhdGUoSW5qZWN0b3IuTlVMTCwgW10sIGAjJHtyb290RWxJZH1gLCB0aGlzLl9tb2R1bGVSZWYpO1xuICAgICAgcmV0dXJuIG5ldyBDb21wb25lbnRGaXh0dXJlPFQ+KGNvbXBvbmVudFJlZiwgbmdab25lLCBhdXRvRGV0ZWN0KTtcbiAgICB9O1xuXG4gICAgY29uc3QgZml4dHVyZSA9ICFuZ1pvbmUgPyBpbml0Q29tcG9uZW50KCkgOiBuZ1pvbmUucnVuKGluaXRDb21wb25lbnQpO1xuICAgIHRoaXMuX2FjdGl2ZUZpeHR1cmVzLnB1c2goZml4dHVyZSk7XG4gICAgcmV0dXJuIGZpeHR1cmU7XG4gIH1cbn1cblxuLyoqXG4gKiBAZGVzY3JpcHRpb25cbiAqIENvbmZpZ3VyZXMgYW5kIGluaXRpYWxpemVzIGVudmlyb25tZW50IGZvciB1bml0IHRlc3RpbmcgYW5kIHByb3ZpZGVzIG1ldGhvZHMgZm9yXG4gKiBjcmVhdGluZyBjb21wb25lbnRzIGFuZCBzZXJ2aWNlcyBpbiB1bml0IHRlc3RzLlxuICpcbiAqIGBUZXN0QmVkYCBpcyB0aGUgcHJpbWFyeSBhcGkgZm9yIHdyaXRpbmcgdW5pdCB0ZXN0cyBmb3IgQW5ndWxhciBhcHBsaWNhdGlvbnMgYW5kIGxpYnJhcmllcy5cbiAqXG4gKiBOb3RlOiBVc2UgYFRlc3RCZWRgIGluIHRlc3RzLiBJdCB3aWxsIGJlIHNldCB0byBlaXRoZXIgYFRlc3RCZWRWaWV3RW5naW5lYCBvciBgVGVzdEJlZFJlbmRlcjNgXG4gKiBhY2NvcmRpbmcgdG8gdGhlIGNvbXBpbGVyIHVzZWQuXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgY29uc3QgVGVzdEJlZDogVGVzdEJlZFN0YXRpYyA9XG4gICAgaXZ5RW5hYmxlZCA/IFRlc3RCZWRSZW5kZXIzIGFzIGFueSBhcyBUZXN0QmVkU3RhdGljIDogVGVzdEJlZFZpZXdFbmdpbmUgYXMgYW55IGFzIFRlc3RCZWRTdGF0aWM7XG5cbi8qKlxuICogUmV0dXJucyBhIHNpbmdsZXRvbiBvZiB0aGUgYXBwbGljYWJsZSBgVGVzdEJlZGAuXG4gKlxuICogSXQgd2lsbCBiZSBlaXRoZXIgYW4gaW5zdGFuY2Ugb2YgYFRlc3RCZWRWaWV3RW5naW5lYCBvciBgVGVzdEJlZFJlbmRlcjNgLlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGNvbnN0IGdldFRlc3RCZWQ6ICgpID0+IFRlc3RCZWQgPSBpdnlFbmFibGVkID8gX2dldFRlc3RCZWRSZW5kZXIzIDogX2dldFRlc3RCZWRWaWV3RW5naW5lO1xuXG5sZXQgdGVzdEJlZDogVGVzdEJlZFZpZXdFbmdpbmU7XG5cbmZ1bmN0aW9uIF9nZXRUZXN0QmVkVmlld0VuZ2luZSgpOiBUZXN0QmVkVmlld0VuZ2luZSB7XG4gIHJldHVybiB0ZXN0QmVkID0gdGVzdEJlZCB8fCBuZXcgVGVzdEJlZFZpZXdFbmdpbmUoKTtcbn1cblxuLyoqXG4gKiBBbGxvd3MgaW5qZWN0aW5nIGRlcGVuZGVuY2llcyBpbiBgYmVmb3JlRWFjaCgpYCBhbmQgYGl0KClgLlxuICpcbiAqIEV4YW1wbGU6XG4gKlxuICogYGBgXG4gKiBiZWZvcmVFYWNoKGluamVjdChbRGVwZW5kZW5jeSwgQUNsYXNzXSwgKGRlcCwgb2JqZWN0KSA9PiB7XG4gKiAgIC8vIHNvbWUgY29kZSB0aGF0IHVzZXMgYGRlcGAgYW5kIGBvYmplY3RgXG4gKiAgIC8vIC4uLlxuICogfSkpO1xuICpcbiAqIGl0KCcuLi4nLCBpbmplY3QoW0FDbGFzc10sIChvYmplY3QpID0+IHtcbiAqICAgb2JqZWN0LmRvU29tZXRoaW5nKCk7XG4gKiAgIGV4cGVjdCguLi4pO1xuICogfSlcbiAqIGBgYFxuICpcbiAqIE5vdGVzOlxuICogLSBpbmplY3QgaXMgY3VycmVudGx5IGEgZnVuY3Rpb24gYmVjYXVzZSBvZiBzb21lIFRyYWNldXIgbGltaXRhdGlvbiB0aGUgc3ludGF4IHNob3VsZFxuICogZXZlbnR1YWxseVxuICogICBiZWNvbWVzIGBpdCgnLi4uJywgQEluamVjdCAob2JqZWN0OiBBQ2xhc3MsIGFzeW5jOiBBc3luY1Rlc3RDb21wbGV0ZXIpID0+IHsgLi4uIH0pO2BcbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbmplY3QodG9rZW5zOiBhbnlbXSwgZm46IEZ1bmN0aW9uKTogKCkgPT4gYW55IHtcbiAgY29uc3QgdGVzdEJlZCA9IGdldFRlc3RCZWQoKTtcbiAgaWYgKHRva2Vucy5pbmRleE9mKEFzeW5jVGVzdENvbXBsZXRlcikgPj0gMCkge1xuICAgIC8vIE5vdCB1c2luZyBhbiBhcnJvdyBmdW5jdGlvbiB0byBwcmVzZXJ2ZSBjb250ZXh0IHBhc3NlZCBmcm9tIGNhbGwgc2l0ZVxuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgIC8vIFJldHVybiBhbiBhc3luYyB0ZXN0IG1ldGhvZCB0aGF0IHJldHVybnMgYSBQcm9taXNlIGlmIEFzeW5jVGVzdENvbXBsZXRlciBpcyBvbmUgb2ZcbiAgICAgIC8vIHRoZSBpbmplY3RlZCB0b2tlbnMuXG4gICAgICByZXR1cm4gdGVzdEJlZC5jb21waWxlQ29tcG9uZW50cygpLnRoZW4oKCkgPT4ge1xuICAgICAgICBjb25zdCBjb21wbGV0ZXI6IEFzeW5jVGVzdENvbXBsZXRlciA9IHRlc3RCZWQuZ2V0KEFzeW5jVGVzdENvbXBsZXRlcik7XG4gICAgICAgIHRlc3RCZWQuZXhlY3V0ZSh0b2tlbnMsIGZuLCB0aGlzKTtcbiAgICAgICAgcmV0dXJuIGNvbXBsZXRlci5wcm9taXNlO1xuICAgICAgfSk7XG4gICAgfTtcbiAgfSBlbHNlIHtcbiAgICAvLyBOb3QgdXNpbmcgYW4gYXJyb3cgZnVuY3Rpb24gdG8gcHJlc2VydmUgY29udGV4dCBwYXNzZWQgZnJvbSBjYWxsIHNpdGVcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7IHJldHVybiB0ZXN0QmVkLmV4ZWN1dGUodG9rZW5zLCBmbiwgdGhpcyk7IH07XG4gIH1cbn1cblxuLyoqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBjbGFzcyBJbmplY3RTZXR1cFdyYXBwZXIge1xuICBjb25zdHJ1Y3Rvcihwcml2YXRlIF9tb2R1bGVEZWY6ICgpID0+IFRlc3RNb2R1bGVNZXRhZGF0YSkge31cblxuICBwcml2YXRlIF9hZGRNb2R1bGUoKSB7XG4gICAgY29uc3QgbW9kdWxlRGVmID0gdGhpcy5fbW9kdWxlRGVmKCk7XG4gICAgaWYgKG1vZHVsZURlZikge1xuICAgICAgZ2V0VGVzdEJlZCgpLmNvbmZpZ3VyZVRlc3RpbmdNb2R1bGUobW9kdWxlRGVmKTtcbiAgICB9XG4gIH1cblxuICBpbmplY3QodG9rZW5zOiBhbnlbXSwgZm46IEZ1bmN0aW9uKTogKCkgPT4gYW55IHtcbiAgICBjb25zdCBzZWxmID0gdGhpcztcbiAgICAvLyBOb3QgdXNpbmcgYW4gYXJyb3cgZnVuY3Rpb24gdG8gcHJlc2VydmUgY29udGV4dCBwYXNzZWQgZnJvbSBjYWxsIHNpdGVcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICBzZWxmLl9hZGRNb2R1bGUoKTtcbiAgICAgIHJldHVybiBpbmplY3QodG9rZW5zLCBmbikuY2FsbCh0aGlzKTtcbiAgICB9O1xuICB9XG59XG5cbi8qKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gd2l0aE1vZHVsZShtb2R1bGVEZWY6IFRlc3RNb2R1bGVNZXRhZGF0YSk6IEluamVjdFNldHVwV3JhcHBlcjtcbmV4cG9ydCBmdW5jdGlvbiB3aXRoTW9kdWxlKG1vZHVsZURlZjogVGVzdE1vZHVsZU1ldGFkYXRhLCBmbjogRnVuY3Rpb24pOiAoKSA9PiBhbnk7XG5leHBvcnQgZnVuY3Rpb24gd2l0aE1vZHVsZShtb2R1bGVEZWY6IFRlc3RNb2R1bGVNZXRhZGF0YSwgZm4/OiBGdW5jdGlvbiB8IG51bGwpOiAoKCkgPT4gYW55KXxcbiAgICBJbmplY3RTZXR1cFdyYXBwZXIge1xuICBpZiAoZm4pIHtcbiAgICAvLyBOb3QgdXNpbmcgYW4gYXJyb3cgZnVuY3Rpb24gdG8gcHJlc2VydmUgY29udGV4dCBwYXNzZWQgZnJvbSBjYWxsIHNpdGVcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICBjb25zdCB0ZXN0QmVkID0gZ2V0VGVzdEJlZCgpO1xuICAgICAgaWYgKG1vZHVsZURlZikge1xuICAgICAgICB0ZXN0QmVkLmNvbmZpZ3VyZVRlc3RpbmdNb2R1bGUobW9kdWxlRGVmKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBmbi5hcHBseSh0aGlzKTtcbiAgICB9O1xuICB9XG4gIHJldHVybiBuZXcgSW5qZWN0U2V0dXBXcmFwcGVyKCgpID0+IG1vZHVsZURlZik7XG59Il19