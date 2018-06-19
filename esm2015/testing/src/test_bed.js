/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as tslib_1 from "tslib";
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
        getTestBed().overrideComponent(component, { set: { template, templateUrl: null } });
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
let _testBed = null;
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdF9iZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3Rlc3Rpbmcvc3JjL3Rlc3RfYmVkLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7QUFFSCxPQUFPLEVBQUMscUJBQXFCLEVBQW1CLFNBQVMsRUFBYSxjQUFjLEVBQUUsUUFBUSxFQUFnQyxRQUFRLEVBQWdDLE1BQU0sRUFBRSxRQUFRLEVBQStDLFFBQVEsRUFBd0IsU0FBUyxJQUFJLFFBQVEsRUFBa0QsZUFBZSxJQUFJLGNBQWMsRUFBMkUsc0JBQXNCLElBQUkscUJBQXFCLEVBQUUsaUJBQWlCLElBQUksZ0JBQWdCLEVBQUUsVUFBVSxJQUFJLFNBQVMsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUU5akIsT0FBTyxFQUFDLGtCQUFrQixFQUFDLE1BQU0sd0JBQXdCLENBQUM7QUFDMUQsT0FBTyxFQUFDLGdCQUFnQixFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFFckQsT0FBTyxFQUFrQixzQkFBc0IsRUFBQyxNQUFNLGlCQUFpQixDQUFDO0FBRXhFLE1BQU0sU0FBUyxHQUFHLElBQUksTUFBTSxFQUFFLENBQUM7QUFFL0I7Ozs7R0FJRztBQUNILE1BQU07SUFDSixpQkFBaUIsQ0FBQyxhQUFxQixJQUFHLENBQUM7Q0FDNUM7QUFFRCxJQUFJLGtCQUFrQixHQUFHLENBQUMsQ0FBQztBQUUzQjs7R0FFRztBQUNILE1BQU0sQ0FBQyxNQUFNLDBCQUEwQixHQUNuQyxJQUFJLGNBQWMsQ0FBWSw0QkFBNEIsQ0FBQyxDQUFDO0FBRWhFOztHQUVHO0FBQ0gsTUFBTSxDQUFDLE1BQU0sd0JBQXdCLEdBQUcsSUFBSSxjQUFjLENBQVksMEJBQTBCLENBQUMsQ0FBQztBQWFsRzs7Ozs7Ozs7R0FRRztBQUNILE1BQU07SUFBTjtRQWdKVSxrQkFBYSxHQUFZLEtBQUssQ0FBQztRQUUvQixjQUFTLEdBQW9CLElBQU0sQ0FB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QyxTQUFTLENBQUMsQ0FBQztTQUNoRDtJQUNILENBQUM7SUFFRCxNQUFNLENBQUMsTUFBYSxFQUFFLEVBQVk7UUFDaEMsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDO1FBQ2xCLHdFQUF3RTtRQUN4RSxPQUFPO1lBQ0wsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO1lBQ2xCLE9BQU8sTUFBTSxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDdkMsQ0FBQyxDQUFDO0lBQ0osQ0FBQztDQUNGO0FBT0QsTUFBTSxxQkFBcUIsU0FBNkIsRUFBRSxFQUFvQjtJQUU1RSxJQUFJLEVBQUUsRUFBRTtRQUNOLHdFQUF3RTtRQUN4RSxPQUFPO1lBQ0wsTUFBTSxPQUFPLEdBQUcsVUFBVSxFQUFFLENBQUM7WUFDN0IsSUFBSSxTQUFTLEVBQUU7Z0JBQ2IsT0FBTyxDQUFDLHNCQUFzQixDQUFDLFNBQVMsQ0FBQyxDQUFDO2FBQzNDO1lBQ0QsT0FBTyxFQUFFLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3hCLENBQUMsQ0FBQztLQUNIO0lBQ0QsT0FBTyxJQUFJLGtCQUFrQixDQUFDLEdBQUcsRUFBRSxDQUFDLFNBQVMsQ0FBQyxDQUFDO0FBQ2pELENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7QXBwbGljYXRpb25Jbml0U3RhdHVzLCBDb21waWxlck9wdGlvbnMsIENvbXBvbmVudCwgRGlyZWN0aXZlLCBJbmplY3Rpb25Ub2tlbiwgSW5qZWN0b3IsIE1vZHVsZVdpdGhDb21wb25lbnRGYWN0b3JpZXMsIE5nTW9kdWxlLCBOZ01vZHVsZUZhY3RvcnksIE5nTW9kdWxlUmVmLCBOZ1pvbmUsIE9wdGlvbmFsLCBQaXBlLCBQbGF0Zm9ybVJlZiwgUHJvdmlkZXIsIFNjaGVtYU1ldGFkYXRhLCBTa2lwU2VsZiwgU3RhdGljUHJvdmlkZXIsIFR5cGUsIMm1QVBQX1JPT1QgYXMgQVBQX1JPT1QsIMm1RGVwRmxhZ3MgYXMgRGVwRmxhZ3MsIMm1Tm9kZUZsYWdzIGFzIE5vZGVGbGFncywgybVjbGVhck92ZXJyaWRlcyBhcyBjbGVhck92ZXJyaWRlcywgybVnZXRDb21wb25lbnRWaWV3RGVmaW5pdGlvbkZhY3RvcnkgYXMgZ2V0Q29tcG9uZW50Vmlld0RlZmluaXRpb25GYWN0b3J5LCDJtW92ZXJyaWRlQ29tcG9uZW50VmlldyBhcyBvdmVycmlkZUNvbXBvbmVudFZpZXcsIMm1b3ZlcnJpZGVQcm92aWRlciBhcyBvdmVycmlkZVByb3ZpZGVyLCDJtXN0cmluZ2lmeSBhcyBzdHJpbmdpZnl9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuXG5pbXBvcnQge0FzeW5jVGVzdENvbXBsZXRlcn0gZnJvbSAnLi9hc3luY190ZXN0X2NvbXBsZXRlcic7XG5pbXBvcnQge0NvbXBvbmVudEZpeHR1cmV9IGZyb20gJy4vY29tcG9uZW50X2ZpeHR1cmUnO1xuaW1wb3J0IHtNZXRhZGF0YU92ZXJyaWRlfSBmcm9tICcuL21ldGFkYXRhX292ZXJyaWRlJztcbmltcG9ydCB7VGVzdGluZ0NvbXBpbGVyLCBUZXN0aW5nQ29tcGlsZXJGYWN0b3J5fSBmcm9tICcuL3Rlc3RfY29tcGlsZXInO1xuXG5jb25zdCBVTkRFRklORUQgPSBuZXcgT2JqZWN0KCk7XG5cbi8qKlxuICogQW4gYWJzdHJhY3QgY2xhc3MgZm9yIGluc2VydGluZyB0aGUgcm9vdCB0ZXN0IGNvbXBvbmVudCBlbGVtZW50IGluIGEgcGxhdGZvcm0gaW5kZXBlbmRlbnQgd2F5LlxuICpcbiAqIEBleHBlcmltZW50YWxcbiAqL1xuZXhwb3J0IGNsYXNzIFRlc3RDb21wb25lbnRSZW5kZXJlciB7XG4gIGluc2VydFJvb3RFbGVtZW50KHJvb3RFbGVtZW50SWQ6IHN0cmluZykge31cbn1cblxubGV0IF9uZXh0Um9vdEVsZW1lbnRJZCA9IDA7XG5cbi8qKlxuICogQGV4cGVyaW1lbnRhbFxuICovXG5leHBvcnQgY29uc3QgQ29tcG9uZW50Rml4dHVyZUF1dG9EZXRlY3QgPVxuICAgIG5ldyBJbmplY3Rpb25Ub2tlbjxib29sZWFuW10+KCdDb21wb25lbnRGaXh0dXJlQXV0b0RldGVjdCcpO1xuXG4vKipcbiAqIEBleHBlcmltZW50YWxcbiAqL1xuZXhwb3J0IGNvbnN0IENvbXBvbmVudEZpeHR1cmVOb05nWm9uZSA9IG5ldyBJbmplY3Rpb25Ub2tlbjxib29sZWFuW10+KCdDb21wb25lbnRGaXh0dXJlTm9OZ1pvbmUnKTtcblxuLyoqXG4gKiBAZXhwZXJpbWVudGFsXG4gKi9cbmV4cG9ydCB0eXBlIFRlc3RNb2R1bGVNZXRhZGF0YSA9IHtcbiAgcHJvdmlkZXJzPzogYW55W10sXG4gIGRlY2xhcmF0aW9ucz86IGFueVtdLFxuICBpbXBvcnRzPzogYW55W10sXG4gIHNjaGVtYXM/OiBBcnJheTxTY2hlbWFNZXRhZGF0YXxhbnlbXT4sXG4gIGFvdFN1bW1hcmllcz86ICgpID0+IGFueVtdLFxufTtcblxuLyoqXG4gKiBAZGVzY3JpcHRpb25cbiAqIENvbmZpZ3VyZXMgYW5kIGluaXRpYWxpemVzIGVudmlyb25tZW50IGZvciB1bml0IHRlc3RpbmcgYW5kIHByb3ZpZGVzIG1ldGhvZHMgZm9yXG4gKiBjcmVhdGluZyBjb21wb25lbnRzIGFuZCBzZXJ2aWNlcyBpbiB1bml0IHRlc3RzLlxuICpcbiAqIFRlc3RCZWQgaXMgdGhlIHByaW1hcnkgYXBpIGZvciB3cml0aW5nIHVuaXQgdGVzdHMgZm9yIEFuZ3VsYXIgYXBwbGljYXRpb25zIGFuZCBsaWJyYXJpZXMuXG4gKlxuICpcbiAqL1xuZXhwb3J0IGNsYXNzIFRlc3RCZWQgaW1wbGVtZW50cyBJbmplY3RvciB7XG4gIC8qKlxuICAgKiBJbml0aWFsaXplIHRoZSBlbnZpcm9ubWVudCBmb3IgdGVzdGluZyB3aXRoIGEgY29tcGlsZXIgZmFjdG9yeSwgYSBQbGF0Zm9ybVJlZiwgYW5kIGFuXG4gICAqIGFuZ3VsYXIgbW9kdWxlLiBUaGVzZSBhcmUgY29tbW9uIHRvIGV2ZXJ5IHRlc3QgaW4gdGhlIHN1aXRlLlxuICAgKlxuICAgKiBUaGlzIG1heSBvbmx5IGJlIGNhbGxlZCBvbmNlLCB0byBzZXQgdXAgdGhlIGNvbW1vbiBwcm92aWRlcnMgZm9yIHRoZSBjdXJyZW50IHRlc3RcbiAgICogc3VpdGUgb24gdGhlIGN1cnJlbnQgcGxhdGZvcm0uIElmIHlvdSBhYnNvbHV0ZWx5IG5lZWQgdG8gY2hhbmdlIHRoZSBwcm92aWRlcnMsXG4gICAqIGZpcnN0IHVzZSBgcmVzZXRUZXN0RW52aXJvbm1lbnRgLlxuICAgKlxuICAgKiBUZXN0IG1vZHVsZXMgYW5kIHBsYXRmb3JtcyBmb3IgaW5kaXZpZHVhbCBwbGF0Zm9ybXMgYXJlIGF2YWlsYWJsZSBmcm9tXG4gICAqICdAYW5ndWxhci88cGxhdGZvcm1fbmFtZT4vdGVzdGluZycuXG4gICAqXG4gICAqIEBleHBlcmltZW50YWxcbiAgICovXG4gIHN0YXRpYyBpbml0VGVzdEVudmlyb25tZW50KFxuICAgICAgbmdNb2R1bGU6IFR5cGU8YW55PnxUeXBlPGFueT5bXSwgcGxhdGZvcm06IFBsYXRmb3JtUmVmLCBhb3RTdW1tYXJpZXM/OiAoKSA9PiBhbnlbXSk6IFRlc3RCZWQge1xuICAgIGNvbnN0IHRlc3RCZWQgPSBnZXRUZXN0QmVkKCk7XG4gICAgdGVzdEJlZC5pbml0VGVzdEVudmlyb25tZW50KG5nTW9kdWxlLCBwbGF0Zm9ybSwgYW90U3VtbWFyaWVzKTtcbiAgICByZXR1cm4gdGVzdEJlZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXNldCB0aGUgcHJvdmlkZXJzIGZvciB0aGUgdGVzdCBpbmplY3Rvci5cbiAgICpcbiAgICogQGV4cGVyaW1lbnRhbFxuICAgKi9cbiAgc3RhdGljIHJlc2V0VGVzdEVudmlyb25tZW50KCkgeyBnZXRUZXN0QmVkKCkucmVzZXRUZXN0RW52aXJvbm1lbnQoKTsgfVxuXG4gIHN0YXRpYyByZXNldFRlc3RpbmdNb2R1bGUoKTogdHlwZW9mIFRlc3RCZWQge1xuICAgIGdldFRlc3RCZWQoKS5yZXNldFRlc3RpbmdNb2R1bGUoKTtcbiAgICByZXR1cm4gVGVzdEJlZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBBbGxvd3Mgb3ZlcnJpZGluZyBkZWZhdWx0IGNvbXBpbGVyIHByb3ZpZGVycyBhbmQgc2V0dGluZ3NcbiAgICogd2hpY2ggYXJlIGRlZmluZWQgaW4gdGVzdF9pbmplY3Rvci5qc1xuICAgKi9cbiAgc3RhdGljIGNvbmZpZ3VyZUNvbXBpbGVyKGNvbmZpZzoge3Byb3ZpZGVycz86IGFueVtdOyB1c2VKaXQ/OiBib29sZWFuO30pOiB0eXBlb2YgVGVzdEJlZCB7XG4gICAgZ2V0VGVzdEJlZCgpLmNvbmZpZ3VyZUNvbXBpbGVyKGNvbmZpZyk7XG4gICAgcmV0dXJuIFRlc3RCZWQ7XG4gIH1cblxuICAvKipcbiAgICogQWxsb3dzIG92ZXJyaWRpbmcgZGVmYXVsdCBwcm92aWRlcnMsIGRpcmVjdGl2ZXMsIHBpcGVzLCBtb2R1bGVzIG9mIHRoZSB0ZXN0IGluamVjdG9yLFxuICAgKiB3aGljaCBhcmUgZGVmaW5lZCBpbiB0ZXN0X2luamVjdG9yLmpzXG4gICAqL1xuICBzdGF0aWMgY29uZmlndXJlVGVzdGluZ01vZHVsZShtb2R1bGVEZWY6IFRlc3RNb2R1bGVNZXRhZGF0YSk6IHR5cGVvZiBUZXN0QmVkIHtcbiAgICBnZXRUZXN0QmVkKCkuY29uZmlndXJlVGVzdGluZ01vZHVsZShtb2R1bGVEZWYpO1xuICAgIHJldHVybiBUZXN0QmVkO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbXBpbGUgY29tcG9uZW50cyB3aXRoIGEgYHRlbXBsYXRlVXJsYCBmb3IgdGhlIHRlc3QncyBOZ01vZHVsZS5cbiAgICogSXQgaXMgbmVjZXNzYXJ5IHRvIGNhbGwgdGhpcyBmdW5jdGlvblxuICAgKiBhcyBmZXRjaGluZyB1cmxzIGlzIGFzeW5jaHJvbm91cy5cbiAgICovXG4gIHN0YXRpYyBjb21waWxlQ29tcG9uZW50cygpOiBQcm9taXNlPGFueT4geyByZXR1cm4gZ2V0VGVzdEJlZCgpLmNvbXBpbGVDb21wb25lbnRzKCk7IH1cblxuICBzdGF0aWMgb3ZlcnJpZGVNb2R1bGUobmdNb2R1bGU6IFR5cGU8YW55Piwgb3ZlcnJpZGU6IE1ldGFkYXRhT3ZlcnJpZGU8TmdNb2R1bGU+KTogdHlwZW9mIFRlc3RCZWQge1xuICAgIGdldFRlc3RCZWQoKS5vdmVycmlkZU1vZHVsZShuZ01vZHVsZSwgb3ZlcnJpZGUpO1xuICAgIHJldHVybiBUZXN0QmVkO1xuICB9XG5cbiAgc3RhdGljIG92ZXJyaWRlQ29tcG9uZW50KGNvbXBvbmVudDogVHlwZTxhbnk+LCBvdmVycmlkZTogTWV0YWRhdGFPdmVycmlkZTxDb21wb25lbnQ+KTpcbiAgICAgIHR5cGVvZiBUZXN0QmVkIHtcbiAgICBnZXRUZXN0QmVkKCkub3ZlcnJpZGVDb21wb25lbnQoY29tcG9uZW50LCBvdmVycmlkZSk7XG4gICAgcmV0dXJuIFRlc3RCZWQ7XG4gIH1cblxuICBzdGF0aWMgb3ZlcnJpZGVEaXJlY3RpdmUoZGlyZWN0aXZlOiBUeXBlPGFueT4sIG92ZXJyaWRlOiBNZXRhZGF0YU92ZXJyaWRlPERpcmVjdGl2ZT4pOlxuICAgICAgdHlwZW9mIFRlc3RCZWQge1xuICAgIGdldFRlc3RCZWQoKS5vdmVycmlkZURpcmVjdGl2ZShkaXJlY3RpdmUsIG92ZXJyaWRlKTtcbiAgICByZXR1cm4gVGVzdEJlZDtcbiAgfVxuXG4gIHN0YXRpYyBvdmVycmlkZVBpcGUocGlwZTogVHlwZTxhbnk+LCBvdmVycmlkZTogTWV0YWRhdGFPdmVycmlkZTxQaXBlPik6IHR5cGVvZiBUZXN0QmVkIHtcbiAgICBnZXRUZXN0QmVkKCkub3ZlcnJpZGVQaXBlKHBpcGUsIG92ZXJyaWRlKTtcbiAgICByZXR1cm4gVGVzdEJlZDtcbiAgfVxuXG4gIHN0YXRpYyBvdmVycmlkZVRlbXBsYXRlKGNvbXBvbmVudDogVHlwZTxhbnk+LCB0ZW1wbGF0ZTogc3RyaW5nKTogdHlwZW9mIFRlc3RCZWQge1xuICAgIGdldFRlc3RCZWQoKS5vdmVycmlkZUNvbXBvbmVudChjb21wb25lbnQsIHtzZXQ6IHt0ZW1wbGF0ZSwgdGVtcGxhdGVVcmw6IG51bGwgIX19KTtcbiAgICByZXR1cm4gVGVzdEJlZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBPdmVycmlkZXMgdGhlIHRlbXBsYXRlIG9mIHRoZSBnaXZlbiBjb21wb25lbnQsIGNvbXBpbGluZyB0aGUgdGVtcGxhdGVcbiAgICogaW4gdGhlIGNvbnRleHQgb2YgdGhlIFRlc3RpbmdNb2R1bGUuXG4gICAqXG4gICAqIE5vdGU6IFRoaXMgd29ya3MgZm9yIEpJVCBhbmQgQU9UZWQgY29tcG9uZW50cyBhcyB3ZWxsLlxuICAgKi9cbiAgc3RhdGljIG92ZXJyaWRlVGVtcGxhdGVVc2luZ1Rlc3RpbmdNb2R1bGUoY29tcG9uZW50OiBUeXBlPGFueT4sIHRlbXBsYXRlOiBzdHJpbmcpOlxuICAgICAgdHlwZW9mIFRlc3RCZWQge1xuICAgIGdldFRlc3RCZWQoKS5vdmVycmlkZVRlbXBsYXRlVXNpbmdUZXN0aW5nTW9kdWxlKGNvbXBvbmVudCwgdGVtcGxhdGUpO1xuICAgIHJldHVybiBUZXN0QmVkO1xuICB9XG5cblxuICAvKipcbiAgICogT3ZlcndyaXRlcyBhbGwgcHJvdmlkZXJzIGZvciB0aGUgZ2l2ZW4gdG9rZW4gd2l0aCB0aGUgZ2l2ZW4gcHJvdmlkZXIgZGVmaW5pdGlvbi5cbiAgICpcbiAgICogTm90ZTogVGhpcyB3b3JrcyBmb3IgSklUIGFuZCBBT1RlZCBjb21wb25lbnRzIGFzIHdlbGwuXG4gICAqL1xuICBzdGF0aWMgb3ZlcnJpZGVQcm92aWRlcih0b2tlbjogYW55LCBwcm92aWRlcjoge1xuICAgIHVzZUZhY3Rvcnk6IEZ1bmN0aW9uLFxuICAgIGRlcHM6IGFueVtdLFxuICB9KTogdHlwZW9mIFRlc3RCZWQ7XG4gIHN0YXRpYyBvdmVycmlkZVByb3ZpZGVyKHRva2VuOiBhbnksIHByb3ZpZGVyOiB7dXNlVmFsdWU6IGFueTt9KTogdHlwZW9mIFRlc3RCZWQ7XG4gIHN0YXRpYyBvdmVycmlkZVByb3ZpZGVyKHRva2VuOiBhbnksIHByb3ZpZGVyOiB7XG4gICAgdXNlRmFjdG9yeT86IEZ1bmN0aW9uLFxuICAgIHVzZVZhbHVlPzogYW55LFxuICAgIGRlcHM/OiBhbnlbXSxcbiAgfSk6IHR5cGVvZiBUZXN0QmVkIHtcbiAgICBnZXRUZXN0QmVkKCkub3ZlcnJpZGVQcm92aWRlcih0b2tlbiwgcHJvdmlkZXIgYXMgYW55KTtcbiAgICByZXR1cm4gVGVzdEJlZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBPdmVyd3JpdGVzIGFsbCBwcm92aWRlcnMgZm9yIHRoZSBnaXZlbiB0b2tlbiB3aXRoIHRoZSBnaXZlbiBwcm92aWRlciBkZWZpbml0aW9uLlxuICAgKlxuICAgKiBAZGVwcmVjYXRlZCBhcyBpdCBtYWtlcyBhbGwgTmdNb2R1bGVzIGxhenkuIEludHJvZHVjZWQgb25seSBmb3IgbWlncmF0aW5nIG9mZiBvZiBpdC5cbiAgICovXG4gIHN0YXRpYyBkZXByZWNhdGVkT3ZlcnJpZGVQcm92aWRlcih0b2tlbjogYW55LCBwcm92aWRlcjoge1xuICAgIHVzZUZhY3Rvcnk6IEZ1bmN0aW9uLFxuICAgIGRlcHM6IGFueVtdLFxuICB9KTogdm9pZDtcbiAgc3RhdGljIGRlcHJlY2F0ZWRPdmVycmlkZVByb3ZpZGVyKHRva2VuOiBhbnksIHByb3ZpZGVyOiB7dXNlVmFsdWU6IGFueTt9KTogdm9pZDtcbiAgc3RhdGljIGRlcHJlY2F0ZWRPdmVycmlkZVByb3ZpZGVyKHRva2VuOiBhbnksIHByb3ZpZGVyOiB7XG4gICAgdXNlRmFjdG9yeT86IEZ1bmN0aW9uLFxuICAgIHVzZVZhbHVlPzogYW55LFxuICAgIGRlcHM/OiBhbnlbXSxcbiAgfSk6IHR5cGVvZiBUZXN0QmVkIHtcbiAgICBnZXRUZXN0QmVkKCkuZGVwcmVjYXRlZE92ZXJyaWRlUHJvdmlkZXIodG9rZW4sIHByb3ZpZGVyIGFzIGFueSk7XG4gICAgcmV0dXJuIFRlc3RCZWQ7XG4gIH1cblxuICBzdGF0aWMgZ2V0KHRva2VuOiBhbnksIG5vdEZvdW5kVmFsdWU6IGFueSA9IEluamVjdG9yLlRIUk9XX0lGX05PVF9GT1VORCkge1xuICAgIHJldHVybiBnZXRUZXN0QmVkKCkuZ2V0KHRva2VuLCBub3RGb3VuZFZhbHVlKTtcbiAgfVxuXG4gIHN0YXRpYyBjcmVhdGVDb21wb25lbnQ8VD4oY29tcG9uZW50OiBUeXBlPFQ+KTogQ29tcG9uZW50Rml4dHVyZTxUPiB7XG4gICAgcmV0dXJuIGdldFRlc3RCZWQoKS5jcmVhdGVDb21wb25lbnQoY29tcG9uZW50KTtcbiAgfVxuXG4gIHByaXZhdGUgX2luc3RhbnRpYXRlZDogYm9vbGVhbiA9IGZhbHNlO1xuXG4gIHByaXZhdGUgX2NvbXBpbGVyOiBUZXN0aW5nQ29tcGlsZXIgPSBudWxsICE7XG4gIHByaXZhdGUgX21vZHVsZVJlZjogTmdNb2R1bGVSZWY8YW55PiA9IG51bGwgITtcbiAgcHJpdmF0ZSBfbW9kdWxlRmFjdG9yeTogTmdNb2R1bGVGYWN0b3J5PGFueT4gPSBudWxsICE7XG5cbiAgcHJpdmF0ZSBfY29tcGlsZXJPcHRpb25zOiBDb21waWxlck9wdGlvbnNbXSA9IFtdO1xuXG4gIHByaXZhdGUgX21vZHVsZU92ZXJyaWRlczogW1R5cGU8YW55PiwgTWV0YWRhdGFPdmVycmlkZTxOZ01vZHVsZT5dW10gPSBbXTtcbiAgcHJpdmF0ZSBfY29tcG9uZW50T3ZlcnJpZGVzOiBbVHlwZTxhbnk+LCBNZXRhZGF0YU92ZXJyaWRlPENvbXBvbmVudD5dW10gPSBbXTtcbiAgcHJpdmF0ZSBfZGlyZWN0aXZlT3ZlcnJpZGVzOiBbVHlwZTxhbnk+LCBNZXRhZGF0YU92ZXJyaWRlPERpcmVjdGl2ZT5dW10gPSBbXTtcbiAgcHJpdmF0ZSBfcGlwZU92ZXJyaWRlczogW1R5cGU8YW55PiwgTWV0YWRhdGFPdmVycmlkZTxQaXBlPl1bXSA9IFtdO1xuXG4gIHByaXZhdGUgX3Byb3ZpZGVyczogUHJvdmlkZXJbXSA9IFtdO1xuICBwcml2YXRlIF9kZWNsYXJhdGlvbnM6IEFycmF5PFR5cGU8YW55PnxhbnlbXXxhbnk+ID0gW107XG4gIHByaXZhdGUgX2ltcG9ydHM6IEFycmF5PFR5cGU8YW55PnxhbnlbXXxhbnk+ID0gW107XG4gIHByaXZhdGUgX3NjaGVtYXM6IEFycmF5PFNjaGVtYU1ldGFkYXRhfGFueVtdPiA9IFtdO1xuICBwcml2YXRlIF9hY3RpdmVGaXh0dXJlczogQ29tcG9uZW50Rml4dHVyZTxhbnk+W10gPSBbXTtcblxuICBwcml2YXRlIF90ZXN0RW52QW90U3VtbWFyaWVzOiAoKSA9PiBhbnlbXSA9ICgpID0+IFtdO1xuICBwcml2YXRlIF9hb3RTdW1tYXJpZXM6IEFycmF5PCgpID0+IGFueVtdPiA9IFtdO1xuICBwcml2YXRlIF90ZW1wbGF0ZU92ZXJyaWRlczogQXJyYXk8e2NvbXBvbmVudDogVHlwZTxhbnk+LCB0ZW1wbGF0ZU9mOiBUeXBlPGFueT59PiA9IFtdO1xuXG4gIHByaXZhdGUgX2lzUm9vdDogYm9vbGVhbiA9IHRydWU7XG4gIHByaXZhdGUgX3Jvb3RQcm92aWRlck92ZXJyaWRlczogUHJvdmlkZXJbXSA9IFtdO1xuXG4gIHBsYXRmb3JtOiBQbGF0Zm9ybVJlZiA9IG51bGwgITtcblxuICBuZ01vZHVsZTogVHlwZTxhbnk+fFR5cGU8YW55PltdID0gbnVsbCAhO1xuXG4gIC8qKlxuICAgKiBJbml0aWFsaXplIHRoZSBlbnZpcm9ubWVudCBmb3IgdGVzdGluZyB3aXRoIGEgY29tcGlsZXIgZmFjdG9yeSwgYSBQbGF0Zm9ybVJlZiwgYW5kIGFuXG4gICAqIGFuZ3VsYXIgbW9kdWxlLiBUaGVzZSBhcmUgY29tbW9uIHRvIGV2ZXJ5IHRlc3QgaW4gdGhlIHN1aXRlLlxuICAgKlxuICAgKiBUaGlzIG1heSBvbmx5IGJlIGNhbGxlZCBvbmNlLCB0byBzZXQgdXAgdGhlIGNvbW1vbiBwcm92aWRlcnMgZm9yIHRoZSBjdXJyZW50IHRlc3RcbiAgICogc3VpdGUgb24gdGhlIGN1cnJlbnQgcGxhdGZvcm0uIElmIHlvdSBhYnNvbHV0ZWx5IG5lZWQgdG8gY2hhbmdlIHRoZSBwcm92aWRlcnMsXG4gICAqIGZpcnN0IHVzZSBgcmVzZXRUZXN0RW52aXJvbm1lbnRgLlxuICAgKlxuICAgKiBUZXN0IG1vZHVsZXMgYW5kIHBsYXRmb3JtcyBmb3IgaW5kaXZpZHVhbCBwbGF0Zm9ybXMgYXJlIGF2YWlsYWJsZSBmcm9tXG4gICAqICdAYW5ndWxhci88cGxhdGZvcm1fbmFtZT4vdGVzdGluZycuXG4gICAqXG4gICAqIEBleHBlcmltZW50YWxcbiAgICovXG4gIGluaXRUZXN0RW52aXJvbm1lbnQoXG4gICAgICBuZ01vZHVsZTogVHlwZTxhbnk+fFR5cGU8YW55PltdLCBwbGF0Zm9ybTogUGxhdGZvcm1SZWYsIGFvdFN1bW1hcmllcz86ICgpID0+IGFueVtdKSB7XG4gICAgaWYgKHRoaXMucGxhdGZvcm0gfHwgdGhpcy5uZ01vZHVsZSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3Qgc2V0IGJhc2UgcHJvdmlkZXJzIGJlY2F1c2UgaXQgaGFzIGFscmVhZHkgYmVlbiBjYWxsZWQnKTtcbiAgICB9XG4gICAgdGhpcy5wbGF0Zm9ybSA9IHBsYXRmb3JtO1xuICAgIHRoaXMubmdNb2R1bGUgPSBuZ01vZHVsZTtcbiAgICBpZiAoYW90U3VtbWFyaWVzKSB7XG4gICAgICB0aGlzLl90ZXN0RW52QW90U3VtbWFyaWVzID0gYW90U3VtbWFyaWVzO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBSZXNldCB0aGUgcHJvdmlkZXJzIGZvciB0aGUgdGVzdCBpbmplY3Rvci5cbiAgICpcbiAgICogQGV4cGVyaW1lbnRhbFxuICAgKi9cbiAgcmVzZXRUZXN0RW52aXJvbm1lbnQoKSB7XG4gICAgdGhpcy5yZXNldFRlc3RpbmdNb2R1bGUoKTtcbiAgICB0aGlzLnBsYXRmb3JtID0gbnVsbCAhO1xuICAgIHRoaXMubmdNb2R1bGUgPSBudWxsICE7XG4gICAgdGhpcy5fdGVzdEVudkFvdFN1bW1hcmllcyA9ICgpID0+IFtdO1xuICB9XG5cbiAgcmVzZXRUZXN0aW5nTW9kdWxlKCkge1xuICAgIGNsZWFyT3ZlcnJpZGVzKCk7XG4gICAgdGhpcy5fYW90U3VtbWFyaWVzID0gW107XG4gICAgdGhpcy5fdGVtcGxhdGVPdmVycmlkZXMgPSBbXTtcbiAgICB0aGlzLl9jb21waWxlciA9IG51bGwgITtcbiAgICB0aGlzLl9tb2R1bGVPdmVycmlkZXMgPSBbXTtcbiAgICB0aGlzLl9jb21wb25lbnRPdmVycmlkZXMgPSBbXTtcbiAgICB0aGlzLl9kaXJlY3RpdmVPdmVycmlkZXMgPSBbXTtcbiAgICB0aGlzLl9waXBlT3ZlcnJpZGVzID0gW107XG5cbiAgICB0aGlzLl9pc1Jvb3QgPSB0cnVlO1xuICAgIHRoaXMuX3Jvb3RQcm92aWRlck92ZXJyaWRlcyA9IFtdO1xuXG4gICAgdGhpcy5fbW9kdWxlUmVmID0gbnVsbCAhO1xuICAgIHRoaXMuX21vZHVsZUZhY3RvcnkgPSBudWxsICE7XG4gICAgdGhpcy5fY29tcGlsZXJPcHRpb25zID0gW107XG4gICAgdGhpcy5fcHJvdmlkZXJzID0gW107XG4gICAgdGhpcy5fZGVjbGFyYXRpb25zID0gW107XG4gICAgdGhpcy5faW1wb3J0cyA9IFtdO1xuICAgIHRoaXMuX3NjaGVtYXMgPSBbXTtcbiAgICB0aGlzLl9pbnN0YW50aWF0ZWQgPSBmYWxzZTtcbiAgICB0aGlzLl9hY3RpdmVGaXh0dXJlcy5mb3JFYWNoKChmaXh0dXJlKSA9PiB7XG4gICAgICB0cnkge1xuICAgICAgICBmaXh0dXJlLmRlc3Ryb3koKTtcbiAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcignRXJyb3IgZHVyaW5nIGNsZWFudXAgb2YgY29tcG9uZW50Jywge1xuICAgICAgICAgIGNvbXBvbmVudDogZml4dHVyZS5jb21wb25lbnRJbnN0YW5jZSxcbiAgICAgICAgICBzdGFja3RyYWNlOiBlLFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICB0aGlzLl9hY3RpdmVGaXh0dXJlcyA9IFtdO1xuICB9XG5cbiAgY29uZmlndXJlQ29tcGlsZXIoY29uZmlnOiB7cHJvdmlkZXJzPzogYW55W10sIHVzZUppdD86IGJvb2xlYW59KSB7XG4gICAgdGhpcy5fYXNzZXJ0Tm90SW5zdGFudGlhdGVkKCdUZXN0QmVkLmNvbmZpZ3VyZUNvbXBpbGVyJywgJ2NvbmZpZ3VyZSB0aGUgY29tcGlsZXInKTtcbiAgICB0aGlzLl9jb21waWxlck9wdGlvbnMucHVzaChjb25maWcpO1xuICB9XG5cbiAgY29uZmlndXJlVGVzdGluZ01vZHVsZShtb2R1bGVEZWY6IFRlc3RNb2R1bGVNZXRhZGF0YSkge1xuICAgIHRoaXMuX2Fzc2VydE5vdEluc3RhbnRpYXRlZCgnVGVzdEJlZC5jb25maWd1cmVUZXN0aW5nTW9kdWxlJywgJ2NvbmZpZ3VyZSB0aGUgdGVzdCBtb2R1bGUnKTtcbiAgICBpZiAobW9kdWxlRGVmLnByb3ZpZGVycykge1xuICAgICAgdGhpcy5fcHJvdmlkZXJzLnB1c2goLi4ubW9kdWxlRGVmLnByb3ZpZGVycyk7XG4gICAgfVxuICAgIGlmIChtb2R1bGVEZWYuZGVjbGFyYXRpb25zKSB7XG4gICAgICB0aGlzLl9kZWNsYXJhdGlvbnMucHVzaCguLi5tb2R1bGVEZWYuZGVjbGFyYXRpb25zKTtcbiAgICB9XG4gICAgaWYgKG1vZHVsZURlZi5pbXBvcnRzKSB7XG4gICAgICB0aGlzLl9pbXBvcnRzLnB1c2goLi4ubW9kdWxlRGVmLmltcG9ydHMpO1xuICAgIH1cbiAgICBpZiAobW9kdWxlRGVmLnNjaGVtYXMpIHtcbiAgICAgIHRoaXMuX3NjaGVtYXMucHVzaCguLi5tb2R1bGVEZWYuc2NoZW1hcyk7XG4gICAgfVxuICAgIGlmIChtb2R1bGVEZWYuYW90U3VtbWFyaWVzKSB7XG4gICAgICB0aGlzLl9hb3RTdW1tYXJpZXMucHVzaChtb2R1bGVEZWYuYW90U3VtbWFyaWVzKTtcbiAgICB9XG4gIH1cblxuICBjb21waWxlQ29tcG9uZW50cygpOiBQcm9taXNlPGFueT4ge1xuICAgIGlmICh0aGlzLl9tb2R1bGVGYWN0b3J5IHx8IHRoaXMuX2luc3RhbnRpYXRlZCkge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShudWxsKTtcbiAgICB9XG5cbiAgICBjb25zdCBtb2R1bGVUeXBlID0gdGhpcy5fY3JlYXRlQ29tcGlsZXJBbmRNb2R1bGUoKTtcbiAgICByZXR1cm4gdGhpcy5fY29tcGlsZXIuY29tcGlsZU1vZHVsZUFuZEFsbENvbXBvbmVudHNBc3luYyhtb2R1bGVUeXBlKVxuICAgICAgICAudGhlbigobW9kdWxlQW5kQ29tcG9uZW50RmFjdG9yaWVzKSA9PiB7XG4gICAgICAgICAgdGhpcy5fbW9kdWxlRmFjdG9yeSA9IG1vZHVsZUFuZENvbXBvbmVudEZhY3Rvcmllcy5uZ01vZHVsZUZhY3Rvcnk7XG4gICAgICAgIH0pO1xuICB9XG5cbiAgcHJpdmF0ZSBfaW5pdElmTmVlZGVkKCkge1xuICAgIGlmICh0aGlzLl9pbnN0YW50aWF0ZWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKCF0aGlzLl9tb2R1bGVGYWN0b3J5KSB7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCBtb2R1bGVUeXBlID0gdGhpcy5fY3JlYXRlQ29tcGlsZXJBbmRNb2R1bGUoKTtcbiAgICAgICAgdGhpcy5fbW9kdWxlRmFjdG9yeSA9XG4gICAgICAgICAgICB0aGlzLl9jb21waWxlci5jb21waWxlTW9kdWxlQW5kQWxsQ29tcG9uZW50c1N5bmMobW9kdWxlVHlwZSkubmdNb2R1bGVGYWN0b3J5O1xuICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBjb25zdCBlcnJvckNvbXBUeXBlID0gdGhpcy5fY29tcGlsZXIuZ2V0Q29tcG9uZW50RnJvbUVycm9yKGUpO1xuICAgICAgICBpZiAoZXJyb3JDb21wVHlwZSkge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICAgICAgYFRoaXMgdGVzdCBtb2R1bGUgdXNlcyB0aGUgY29tcG9uZW50ICR7c3RyaW5naWZ5KGVycm9yQ29tcFR5cGUpfSB3aGljaCBpcyB1c2luZyBhIFwidGVtcGxhdGVVcmxcIiBvciBcInN0eWxlVXJsc1wiLCBidXQgdGhleSB3ZXJlIG5ldmVyIGNvbXBpbGVkLiBgICtcbiAgICAgICAgICAgICAgYFBsZWFzZSBjYWxsIFwiVGVzdEJlZC5jb21waWxlQ29tcG9uZW50c1wiIGJlZm9yZSB5b3VyIHRlc3QuYCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhyb3cgZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBmb3IgKGNvbnN0IHtjb21wb25lbnQsIHRlbXBsYXRlT2Z9IG9mIHRoaXMuX3RlbXBsYXRlT3ZlcnJpZGVzKSB7XG4gICAgICBjb25zdCBjb21wRmFjdG9yeSA9IHRoaXMuX2NvbXBpbGVyLmdldENvbXBvbmVudEZhY3RvcnkodGVtcGxhdGVPZik7XG4gICAgICBvdmVycmlkZUNvbXBvbmVudFZpZXcoY29tcG9uZW50LCBjb21wRmFjdG9yeSk7XG4gICAgfVxuXG4gICAgY29uc3Qgbmdab25lID0gbmV3IE5nWm9uZSh7ZW5hYmxlTG9uZ1N0YWNrVHJhY2U6IHRydWV9KTtcbiAgICBjb25zdCBwcm92aWRlcnM6IFN0YXRpY1Byb3ZpZGVyW10gPSBbe3Byb3ZpZGU6IE5nWm9uZSwgdXNlVmFsdWU6IG5nWm9uZX1dO1xuICAgIGNvbnN0IG5nWm9uZUluamVjdG9yID0gSW5qZWN0b3IuY3JlYXRlKHtcbiAgICAgIHByb3ZpZGVyczogcHJvdmlkZXJzLFxuICAgICAgcGFyZW50OiB0aGlzLnBsYXRmb3JtLmluamVjdG9yLFxuICAgICAgbmFtZTogdGhpcy5fbW9kdWxlRmFjdG9yeS5tb2R1bGVUeXBlLm5hbWVcbiAgICB9KTtcbiAgICB0aGlzLl9tb2R1bGVSZWYgPSB0aGlzLl9tb2R1bGVGYWN0b3J5LmNyZWF0ZShuZ1pvbmVJbmplY3Rvcik7XG4gICAgLy8gQXBwbGljYXRpb25Jbml0U3RhdHVzLnJ1bkluaXRpYWxpemVycygpIGlzIG1hcmtlZCBAaW50ZXJuYWwgdG8gY29yZS4gU28gY2FzdGluZyB0byBhbnlcbiAgICAvLyBiZWZvcmUgYWNjZXNzaW5nIGl0LlxuICAgICh0aGlzLl9tb2R1bGVSZWYuaW5qZWN0b3IuZ2V0KEFwcGxpY2F0aW9uSW5pdFN0YXR1cykgYXMgYW55KS5ydW5Jbml0aWFsaXplcnMoKTtcbiAgICB0aGlzLl9pbnN0YW50aWF0ZWQgPSB0cnVlO1xuICB9XG5cbiAgcHJpdmF0ZSBfY3JlYXRlQ29tcGlsZXJBbmRNb2R1bGUoKTogVHlwZTxhbnk+IHtcbiAgICBjb25zdCBwcm92aWRlcnMgPSB0aGlzLl9wcm92aWRlcnMuY29uY2F0KFt7cHJvdmlkZTogVGVzdEJlZCwgdXNlVmFsdWU6IHRoaXN9XSk7XG4gICAgY29uc3QgZGVjbGFyYXRpb25zID1cbiAgICAgICAgWy4uLnRoaXMuX2RlY2xhcmF0aW9ucywgLi4udGhpcy5fdGVtcGxhdGVPdmVycmlkZXMubWFwKGVudHJ5ID0+IGVudHJ5LnRlbXBsYXRlT2YpXTtcblxuICAgIGNvbnN0IHJvb3RTY29wZUltcG9ydHMgPSBbXTtcbiAgICBjb25zdCByb290UHJvdmlkZXJPdmVycmlkZXMgPSB0aGlzLl9yb290UHJvdmlkZXJPdmVycmlkZXM7XG4gICAgaWYgKHRoaXMuX2lzUm9vdCkge1xuICAgICAgQE5nTW9kdWxlKHtcbiAgICAgICAgcHJvdmlkZXJzOiBbXG4gICAgICAgICAgLi4ucm9vdFByb3ZpZGVyT3ZlcnJpZGVzLFxuICAgICAgICBdLFxuICAgICAgICBqaXQ6IHRydWUsXG4gICAgICB9KVxuICAgICAgY2xhc3MgUm9vdFNjb3BlTW9kdWxlIHtcbiAgICAgIH1cbiAgICAgIHJvb3RTY29wZUltcG9ydHMucHVzaChSb290U2NvcGVNb2R1bGUpO1xuICAgIH1cbiAgICBwcm92aWRlcnMucHVzaCh7cHJvdmlkZTogQVBQX1JPT1QsIHVzZVZhbHVlOiB0aGlzLl9pc1Jvb3R9KTtcblxuICAgIGNvbnN0IGltcG9ydHMgPSBbcm9vdFNjb3BlSW1wb3J0cywgdGhpcy5uZ01vZHVsZSwgdGhpcy5faW1wb3J0c107XG4gICAgY29uc3Qgc2NoZW1hcyA9IHRoaXMuX3NjaGVtYXM7XG5cbiAgICBATmdNb2R1bGUoe3Byb3ZpZGVycywgZGVjbGFyYXRpb25zLCBpbXBvcnRzLCBzY2hlbWFzLCBqaXQ6IHRydWV9KVxuICAgIGNsYXNzIER5bmFtaWNUZXN0TW9kdWxlIHtcbiAgICB9XG5cbiAgICBjb25zdCBjb21waWxlckZhY3Rvcnk6IFRlc3RpbmdDb21waWxlckZhY3RvcnkgPVxuICAgICAgICB0aGlzLnBsYXRmb3JtLmluamVjdG9yLmdldChUZXN0aW5nQ29tcGlsZXJGYWN0b3J5KTtcbiAgICB0aGlzLl9jb21waWxlciA9IGNvbXBpbGVyRmFjdG9yeS5jcmVhdGVUZXN0aW5nQ29tcGlsZXIodGhpcy5fY29tcGlsZXJPcHRpb25zKTtcbiAgICBmb3IgKGNvbnN0IHN1bW1hcnkgb2YgW3RoaXMuX3Rlc3RFbnZBb3RTdW1tYXJpZXMsIC4uLnRoaXMuX2FvdFN1bW1hcmllc10pIHtcbiAgICAgIHRoaXMuX2NvbXBpbGVyLmxvYWRBb3RTdW1tYXJpZXMoc3VtbWFyeSk7XG4gICAgfVxuICAgIHRoaXMuX21vZHVsZU92ZXJyaWRlcy5mb3JFYWNoKChlbnRyeSkgPT4gdGhpcy5fY29tcGlsZXIub3ZlcnJpZGVNb2R1bGUoZW50cnlbMF0sIGVudHJ5WzFdKSk7XG4gICAgdGhpcy5fY29tcG9uZW50T3ZlcnJpZGVzLmZvckVhY2goXG4gICAgICAgIChlbnRyeSkgPT4gdGhpcy5fY29tcGlsZXIub3ZlcnJpZGVDb21wb25lbnQoZW50cnlbMF0sIGVudHJ5WzFdKSk7XG4gICAgdGhpcy5fZGlyZWN0aXZlT3ZlcnJpZGVzLmZvckVhY2goXG4gICAgICAgIChlbnRyeSkgPT4gdGhpcy5fY29tcGlsZXIub3ZlcnJpZGVEaXJlY3RpdmUoZW50cnlbMF0sIGVudHJ5WzFdKSk7XG4gICAgdGhpcy5fcGlwZU92ZXJyaWRlcy5mb3JFYWNoKChlbnRyeSkgPT4gdGhpcy5fY29tcGlsZXIub3ZlcnJpZGVQaXBlKGVudHJ5WzBdLCBlbnRyeVsxXSkpO1xuICAgIHJldHVybiBEeW5hbWljVGVzdE1vZHVsZTtcbiAgfVxuXG4gIHByaXZhdGUgX2Fzc2VydE5vdEluc3RhbnRpYXRlZChtZXRob2ROYW1lOiBzdHJpbmcsIG1ldGhvZERlc2NyaXB0aW9uOiBzdHJpbmcpIHtcbiAgICBpZiAodGhpcy5faW5zdGFudGlhdGVkKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgYENhbm5vdCAke21ldGhvZERlc2NyaXB0aW9ufSB3aGVuIHRoZSB0ZXN0IG1vZHVsZSBoYXMgYWxyZWFkeSBiZWVuIGluc3RhbnRpYXRlZC4gYCArXG4gICAgICAgICAgYE1ha2Ugc3VyZSB5b3UgYXJlIG5vdCB1c2luZyBcXGBpbmplY3RcXGAgYmVmb3JlIFxcYCR7bWV0aG9kTmFtZX1cXGAuYCk7XG4gICAgfVxuICB9XG5cbiAgZ2V0KHRva2VuOiBhbnksIG5vdEZvdW5kVmFsdWU6IGFueSA9IEluamVjdG9yLlRIUk9XX0lGX05PVF9GT1VORCkge1xuICAgIHRoaXMuX2luaXRJZk5lZWRlZCgpO1xuICAgIGlmICh0b2tlbiA9PT0gVGVzdEJlZCkge1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIC8vIFRlc3RzIGNhbiBpbmplY3QgdGhpbmdzIGZyb20gdGhlIG5nIG1vZHVsZSBhbmQgZnJvbSB0aGUgY29tcGlsZXIsXG4gICAgLy8gYnV0IHRoZSBuZyBtb2R1bGUgY2FuJ3QgaW5qZWN0IHRoaW5ncyBmcm9tIHRoZSBjb21waWxlciBhbmQgdmljZSB2ZXJzYS5cbiAgICBjb25zdCByZXN1bHQgPSB0aGlzLl9tb2R1bGVSZWYuaW5qZWN0b3IuZ2V0KHRva2VuLCBVTkRFRklORUQpO1xuICAgIHJldHVybiByZXN1bHQgPT09IFVOREVGSU5FRCA/IHRoaXMuX2NvbXBpbGVyLmluamVjdG9yLmdldCh0b2tlbiwgbm90Rm91bmRWYWx1ZSkgOiByZXN1bHQ7XG4gIH1cblxuICBleGVjdXRlKHRva2VuczogYW55W10sIGZuOiBGdW5jdGlvbiwgY29udGV4dD86IGFueSk6IGFueSB7XG4gICAgdGhpcy5faW5pdElmTmVlZGVkKCk7XG4gICAgY29uc3QgcGFyYW1zID0gdG9rZW5zLm1hcCh0ID0+IHRoaXMuZ2V0KHQpKTtcbiAgICByZXR1cm4gZm4uYXBwbHkoY29udGV4dCwgcGFyYW1zKTtcbiAgfVxuXG4gIG92ZXJyaWRlTW9kdWxlKG5nTW9kdWxlOiBUeXBlPGFueT4sIG92ZXJyaWRlOiBNZXRhZGF0YU92ZXJyaWRlPE5nTW9kdWxlPik6IHZvaWQge1xuICAgIHRoaXMuX2Fzc2VydE5vdEluc3RhbnRpYXRlZCgnb3ZlcnJpZGVNb2R1bGUnLCAnb3ZlcnJpZGUgbW9kdWxlIG1ldGFkYXRhJyk7XG4gICAgdGhpcy5fbW9kdWxlT3ZlcnJpZGVzLnB1c2goW25nTW9kdWxlLCBvdmVycmlkZV0pO1xuICB9XG5cbiAgb3ZlcnJpZGVDb21wb25lbnQoY29tcG9uZW50OiBUeXBlPGFueT4sIG92ZXJyaWRlOiBNZXRhZGF0YU92ZXJyaWRlPENvbXBvbmVudD4pOiB2b2lkIHtcbiAgICB0aGlzLl9hc3NlcnROb3RJbnN0YW50aWF0ZWQoJ292ZXJyaWRlQ29tcG9uZW50JywgJ292ZXJyaWRlIGNvbXBvbmVudCBtZXRhZGF0YScpO1xuICAgIHRoaXMuX2NvbXBvbmVudE92ZXJyaWRlcy5wdXNoKFtjb21wb25lbnQsIG92ZXJyaWRlXSk7XG4gIH1cblxuICBvdmVycmlkZURpcmVjdGl2ZShkaXJlY3RpdmU6IFR5cGU8YW55Piwgb3ZlcnJpZGU6IE1ldGFkYXRhT3ZlcnJpZGU8RGlyZWN0aXZlPik6IHZvaWQge1xuICAgIHRoaXMuX2Fzc2VydE5vdEluc3RhbnRpYXRlZCgnb3ZlcnJpZGVEaXJlY3RpdmUnLCAnb3ZlcnJpZGUgZGlyZWN0aXZlIG1ldGFkYXRhJyk7XG4gICAgdGhpcy5fZGlyZWN0aXZlT3ZlcnJpZGVzLnB1c2goW2RpcmVjdGl2ZSwgb3ZlcnJpZGVdKTtcbiAgfVxuXG4gIG92ZXJyaWRlUGlwZShwaXBlOiBUeXBlPGFueT4sIG92ZXJyaWRlOiBNZXRhZGF0YU92ZXJyaWRlPFBpcGU+KTogdm9pZCB7XG4gICAgdGhpcy5fYXNzZXJ0Tm90SW5zdGFudGlhdGVkKCdvdmVycmlkZVBpcGUnLCAnb3ZlcnJpZGUgcGlwZSBtZXRhZGF0YScpO1xuICAgIHRoaXMuX3BpcGVPdmVycmlkZXMucHVzaChbcGlwZSwgb3ZlcnJpZGVdKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBPdmVyd3JpdGVzIGFsbCBwcm92aWRlcnMgZm9yIHRoZSBnaXZlbiB0b2tlbiB3aXRoIHRoZSBnaXZlbiBwcm92aWRlciBkZWZpbml0aW9uLlxuICAgKi9cbiAgb3ZlcnJpZGVQcm92aWRlcih0b2tlbjogYW55LCBwcm92aWRlcjoge1xuICAgIHVzZUZhY3Rvcnk6IEZ1bmN0aW9uLFxuICAgIGRlcHM6IGFueVtdLFxuICB9KTogdm9pZDtcbiAgb3ZlcnJpZGVQcm92aWRlcih0b2tlbjogYW55LCBwcm92aWRlcjoge3VzZVZhbHVlOiBhbnk7fSk6IHZvaWQ7XG4gIG92ZXJyaWRlUHJvdmlkZXIodG9rZW46IGFueSwgcHJvdmlkZXI6IHt1c2VGYWN0b3J5PzogRnVuY3Rpb24sIHVzZVZhbHVlPzogYW55LCBkZXBzPzogYW55W119KTpcbiAgICAgIHZvaWQge1xuICAgIHRoaXMub3ZlcnJpZGVQcm92aWRlckltcGwodG9rZW4sIHByb3ZpZGVyKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBPdmVyd3JpdGVzIGFsbCBwcm92aWRlcnMgZm9yIHRoZSBnaXZlbiB0b2tlbiB3aXRoIHRoZSBnaXZlbiBwcm92aWRlciBkZWZpbml0aW9uLlxuICAgKlxuICAgKiBAZGVwcmVjYXRlZCBhcyBpdCBtYWtlcyBhbGwgTmdNb2R1bGVzIGxhenkuIEludHJvZHVjZWQgb25seSBmb3IgbWlncmF0aW5nIG9mZiBvZiBpdC5cbiAgICovXG4gIGRlcHJlY2F0ZWRPdmVycmlkZVByb3ZpZGVyKHRva2VuOiBhbnksIHByb3ZpZGVyOiB7XG4gICAgdXNlRmFjdG9yeTogRnVuY3Rpb24sXG4gICAgZGVwczogYW55W10sXG4gIH0pOiB2b2lkO1xuICBkZXByZWNhdGVkT3ZlcnJpZGVQcm92aWRlcih0b2tlbjogYW55LCBwcm92aWRlcjoge3VzZVZhbHVlOiBhbnk7fSk6IHZvaWQ7XG4gIGRlcHJlY2F0ZWRPdmVycmlkZVByb3ZpZGVyKFxuICAgICAgdG9rZW46IGFueSwgcHJvdmlkZXI6IHt1c2VGYWN0b3J5PzogRnVuY3Rpb24sIHVzZVZhbHVlPzogYW55LCBkZXBzPzogYW55W119KTogdm9pZCB7XG4gICAgdGhpcy5vdmVycmlkZVByb3ZpZGVySW1wbCh0b2tlbiwgcHJvdmlkZXIsIC8qIGRlcHJlY2F0ZWQgKi8gdHJ1ZSk7XG4gIH1cblxuICBwcml2YXRlIG92ZXJyaWRlUHJvdmlkZXJJbXBsKFxuICAgICAgdG9rZW46IGFueSwgcHJvdmlkZXI6IHtcbiAgICAgICAgdXNlRmFjdG9yeT86IEZ1bmN0aW9uLFxuICAgICAgICB1c2VWYWx1ZT86IGFueSxcbiAgICAgICAgZGVwcz86IGFueVtdLFxuICAgICAgfSxcbiAgICAgIGRlcHJlY2F0ZWQgPSBmYWxzZSk6IHZvaWQge1xuICAgIGlmICh0eXBlb2YgdG9rZW4gIT09ICdzdHJpbmcnICYmIHRva2VuLm5nSW5qZWN0YWJsZURlZiAmJlxuICAgICAgICB0b2tlbi5uZ0luamVjdGFibGVEZWYucHJvdmlkZWRJbiA9PT0gJ3Jvb3QnKSB7XG4gICAgICBpZiAocHJvdmlkZXIudXNlRmFjdG9yeSkge1xuICAgICAgICB0aGlzLl9yb290UHJvdmlkZXJPdmVycmlkZXMucHVzaChcbiAgICAgICAgICAgIHtwcm92aWRlOiB0b2tlbiwgdXNlRmFjdG9yeTogcHJvdmlkZXIudXNlRmFjdG9yeSwgZGVwczogcHJvdmlkZXIuZGVwcyB8fCBbXX0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5fcm9vdFByb3ZpZGVyT3ZlcnJpZGVzLnB1c2goe3Byb3ZpZGU6IHRva2VuLCB1c2VWYWx1ZTogcHJvdmlkZXIudXNlVmFsdWV9KTtcbiAgICAgIH1cbiAgICB9XG4gICAgbGV0IGZsYWdzOiBOb2RlRmxhZ3MgPSAwO1xuICAgIGxldCB2YWx1ZTogYW55O1xuICAgIGlmIChwcm92aWRlci51c2VGYWN0b3J5KSB7XG4gICAgICBmbGFncyB8PSBOb2RlRmxhZ3MuVHlwZUZhY3RvcnlQcm92aWRlcjtcbiAgICAgIHZhbHVlID0gcHJvdmlkZXIudXNlRmFjdG9yeTtcbiAgICB9IGVsc2Uge1xuICAgICAgZmxhZ3MgfD0gTm9kZUZsYWdzLlR5cGVWYWx1ZVByb3ZpZGVyO1xuICAgICAgdmFsdWUgPSBwcm92aWRlci51c2VWYWx1ZTtcbiAgICB9XG4gICAgY29uc3QgZGVwcyA9IChwcm92aWRlci5kZXBzIHx8IFtdKS5tYXAoKGRlcCkgPT4ge1xuICAgICAgbGV0IGRlcEZsYWdzOiBEZXBGbGFncyA9IERlcEZsYWdzLk5vbmU7XG4gICAgICBsZXQgZGVwVG9rZW46IGFueTtcbiAgICAgIGlmIChBcnJheS5pc0FycmF5KGRlcCkpIHtcbiAgICAgICAgZGVwLmZvckVhY2goKGVudHJ5OiBhbnkpID0+IHtcbiAgICAgICAgICBpZiAoZW50cnkgaW5zdGFuY2VvZiBPcHRpb25hbCkge1xuICAgICAgICAgICAgZGVwRmxhZ3MgfD0gRGVwRmxhZ3MuT3B0aW9uYWw7XG4gICAgICAgICAgfSBlbHNlIGlmIChlbnRyeSBpbnN0YW5jZW9mIFNraXBTZWxmKSB7XG4gICAgICAgICAgICBkZXBGbGFncyB8PSBEZXBGbGFncy5Ta2lwU2VsZjtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZGVwVG9rZW4gPSBlbnRyeTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZGVwVG9rZW4gPSBkZXA7XG4gICAgICB9XG4gICAgICByZXR1cm4gW2RlcEZsYWdzLCBkZXBUb2tlbl07XG4gICAgfSk7XG4gICAgb3ZlcnJpZGVQcm92aWRlcih7dG9rZW4sIGZsYWdzLCBkZXBzLCB2YWx1ZSwgZGVwcmVjYXRlZEJlaGF2aW9yOiBkZXByZWNhdGVkfSk7XG4gIH1cblxuICBvdmVycmlkZVRlbXBsYXRlVXNpbmdUZXN0aW5nTW9kdWxlKGNvbXBvbmVudDogVHlwZTxhbnk+LCB0ZW1wbGF0ZTogc3RyaW5nKSB7XG4gICAgdGhpcy5fYXNzZXJ0Tm90SW5zdGFudGlhdGVkKCdvdmVycmlkZVRlbXBsYXRlVXNpbmdUZXN0aW5nTW9kdWxlJywgJ292ZXJyaWRlIHRlbXBsYXRlJyk7XG5cbiAgICBAQ29tcG9uZW50KHtzZWxlY3RvcjogJ2VtcHR5JywgdGVtcGxhdGUsIGppdDogdHJ1ZX0pXG4gICAgY2xhc3MgT3ZlcnJpZGVDb21wb25lbnQge1xuICAgIH1cblxuICAgIHRoaXMuX3RlbXBsYXRlT3ZlcnJpZGVzLnB1c2goe2NvbXBvbmVudCwgdGVtcGxhdGVPZjogT3ZlcnJpZGVDb21wb25lbnR9KTtcbiAgfVxuXG4gIGNyZWF0ZUNvbXBvbmVudDxUPihjb21wb25lbnQ6IFR5cGU8VD4pOiBDb21wb25lbnRGaXh0dXJlPFQ+IHtcbiAgICB0aGlzLl9pbml0SWZOZWVkZWQoKTtcbiAgICBjb25zdCBjb21wb25lbnRGYWN0b3J5ID0gdGhpcy5fY29tcGlsZXIuZ2V0Q29tcG9uZW50RmFjdG9yeShjb21wb25lbnQpO1xuXG4gICAgaWYgKCFjb21wb25lbnRGYWN0b3J5KSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgYENhbm5vdCBjcmVhdGUgdGhlIGNvbXBvbmVudCAke3N0cmluZ2lmeShjb21wb25lbnQpfSBhcyBpdCB3YXMgbm90IGltcG9ydGVkIGludG8gdGhlIHRlc3RpbmcgbW9kdWxlIWApO1xuICAgIH1cblxuICAgIGNvbnN0IG5vTmdab25lID0gdGhpcy5nZXQoQ29tcG9uZW50Rml4dHVyZU5vTmdab25lLCBmYWxzZSk7XG4gICAgY29uc3QgYXV0b0RldGVjdDogYm9vbGVhbiA9IHRoaXMuZ2V0KENvbXBvbmVudEZpeHR1cmVBdXRvRGV0ZWN0LCBmYWxzZSk7XG4gICAgY29uc3Qgbmdab25lOiBOZ1pvbmUgPSBub05nWm9uZSA/IG51bGwgOiB0aGlzLmdldChOZ1pvbmUsIG51bGwpO1xuICAgIGNvbnN0IHRlc3RDb21wb25lbnRSZW5kZXJlcjogVGVzdENvbXBvbmVudFJlbmRlcmVyID0gdGhpcy5nZXQoVGVzdENvbXBvbmVudFJlbmRlcmVyKTtcbiAgICBjb25zdCByb290RWxJZCA9IGByb290JHtfbmV4dFJvb3RFbGVtZW50SWQrK31gO1xuICAgIHRlc3RDb21wb25lbnRSZW5kZXJlci5pbnNlcnRSb290RWxlbWVudChyb290RWxJZCk7XG5cbiAgICBjb25zdCBpbml0Q29tcG9uZW50ID0gKCkgPT4ge1xuICAgICAgY29uc3QgY29tcG9uZW50UmVmID1cbiAgICAgICAgICBjb21wb25lbnRGYWN0b3J5LmNyZWF0ZShJbmplY3Rvci5OVUxMLCBbXSwgYCMke3Jvb3RFbElkfWAsIHRoaXMuX21vZHVsZVJlZik7XG4gICAgICByZXR1cm4gbmV3IENvbXBvbmVudEZpeHR1cmU8VD4oY29tcG9uZW50UmVmLCBuZ1pvbmUsIGF1dG9EZXRlY3QpO1xuICAgIH07XG5cbiAgICBjb25zdCBmaXh0dXJlID0gIW5nWm9uZSA/IGluaXRDb21wb25lbnQoKSA6IG5nWm9uZS5ydW4oaW5pdENvbXBvbmVudCk7XG4gICAgdGhpcy5fYWN0aXZlRml4dHVyZXMucHVzaChmaXh0dXJlKTtcbiAgICByZXR1cm4gZml4dHVyZTtcbiAgfVxufVxuXG5sZXQgX3Rlc3RCZWQ6IFRlc3RCZWQgPSBudWxsICE7XG5cbi8qKlxuICogQGV4cGVyaW1lbnRhbFxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0VGVzdEJlZCgpIHtcbiAgcmV0dXJuIF90ZXN0QmVkID0gX3Rlc3RCZWQgfHwgbmV3IFRlc3RCZWQoKTtcbn1cblxuLyoqXG4gKiBBbGxvd3MgaW5qZWN0aW5nIGRlcGVuZGVuY2llcyBpbiBgYmVmb3JlRWFjaCgpYCBhbmQgYGl0KClgLlxuICpcbiAqIEV4YW1wbGU6XG4gKlxuICogYGBgXG4gKiBiZWZvcmVFYWNoKGluamVjdChbRGVwZW5kZW5jeSwgQUNsYXNzXSwgKGRlcCwgb2JqZWN0KSA9PiB7XG4gKiAgIC8vIHNvbWUgY29kZSB0aGF0IHVzZXMgYGRlcGAgYW5kIGBvYmplY3RgXG4gKiAgIC8vIC4uLlxuICogfSkpO1xuICpcbiAqIGl0KCcuLi4nLCBpbmplY3QoW0FDbGFzc10sIChvYmplY3QpID0+IHtcbiAqICAgb2JqZWN0LmRvU29tZXRoaW5nKCk7XG4gKiAgIGV4cGVjdCguLi4pO1xuICogfSlcbiAqIGBgYFxuICpcbiAqIE5vdGVzOlxuICogLSBpbmplY3QgaXMgY3VycmVudGx5IGEgZnVuY3Rpb24gYmVjYXVzZSBvZiBzb21lIFRyYWNldXIgbGltaXRhdGlvbiB0aGUgc3ludGF4IHNob3VsZFxuICogZXZlbnR1YWxseVxuICogICBiZWNvbWVzIGBpdCgnLi4uJywgQEluamVjdCAob2JqZWN0OiBBQ2xhc3MsIGFzeW5jOiBBc3luY1Rlc3RDb21wbGV0ZXIpID0+IHsgLi4uIH0pO2BcbiAqXG4gKlxuICovXG5leHBvcnQgZnVuY3Rpb24gaW5qZWN0KHRva2VuczogYW55W10sIGZuOiBGdW5jdGlvbik6ICgpID0+IGFueSB7XG4gIGNvbnN0IHRlc3RCZWQgPSBnZXRUZXN0QmVkKCk7XG4gIGlmICh0b2tlbnMuaW5kZXhPZihBc3luY1Rlc3RDb21wbGV0ZXIpID49IDApIHtcbiAgICAvLyBOb3QgdXNpbmcgYW4gYXJyb3cgZnVuY3Rpb24gdG8gcHJlc2VydmUgY29udGV4dCBwYXNzZWQgZnJvbSBjYWxsIHNpdGVcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAvLyBSZXR1cm4gYW4gYXN5bmMgdGVzdCBtZXRob2QgdGhhdCByZXR1cm5zIGEgUHJvbWlzZSBpZiBBc3luY1Rlc3RDb21wbGV0ZXIgaXMgb25lIG9mXG4gICAgICAvLyB0aGUgaW5qZWN0ZWQgdG9rZW5zLlxuICAgICAgcmV0dXJuIHRlc3RCZWQuY29tcGlsZUNvbXBvbmVudHMoKS50aGVuKCgpID0+IHtcbiAgICAgICAgY29uc3QgY29tcGxldGVyOiBBc3luY1Rlc3RDb21wbGV0ZXIgPSB0ZXN0QmVkLmdldChBc3luY1Rlc3RDb21wbGV0ZXIpO1xuICAgICAgICB0ZXN0QmVkLmV4ZWN1dGUodG9rZW5zLCBmbiwgdGhpcyk7XG4gICAgICAgIHJldHVybiBjb21wbGV0ZXIucHJvbWlzZTtcbiAgICAgIH0pO1xuICAgIH07XG4gIH0gZWxzZSB7XG4gICAgLy8gTm90IHVzaW5nIGFuIGFycm93IGZ1bmN0aW9uIHRvIHByZXNlcnZlIGNvbnRleHQgcGFzc2VkIGZyb20gY2FsbCBzaXRlXG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkgeyByZXR1cm4gdGVzdEJlZC5leGVjdXRlKHRva2VucywgZm4sIHRoaXMpOyB9O1xuICB9XG59XG5cbi8qKlxuICogQGV4cGVyaW1lbnRhbFxuICovXG5leHBvcnQgY2xhc3MgSW5qZWN0U2V0dXBXcmFwcGVyIHtcbiAgY29uc3RydWN0b3IocHJpdmF0ZSBfbW9kdWxlRGVmOiAoKSA9PiBUZXN0TW9kdWxlTWV0YWRhdGEpIHt9XG5cbiAgcHJpdmF0ZSBfYWRkTW9kdWxlKCkge1xuICAgIGNvbnN0IG1vZHVsZURlZiA9IHRoaXMuX21vZHVsZURlZigpO1xuICAgIGlmIChtb2R1bGVEZWYpIHtcbiAgICAgIGdldFRlc3RCZWQoKS5jb25maWd1cmVUZXN0aW5nTW9kdWxlKG1vZHVsZURlZik7XG4gICAgfVxuICB9XG5cbiAgaW5qZWN0KHRva2VuczogYW55W10sIGZuOiBGdW5jdGlvbik6ICgpID0+IGFueSB7XG4gICAgY29uc3Qgc2VsZiA9IHRoaXM7XG4gICAgLy8gTm90IHVzaW5nIGFuIGFycm93IGZ1bmN0aW9uIHRvIHByZXNlcnZlIGNvbnRleHQgcGFzc2VkIGZyb20gY2FsbCBzaXRlXG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgc2VsZi5fYWRkTW9kdWxlKCk7XG4gICAgICByZXR1cm4gaW5qZWN0KHRva2VucywgZm4pLmNhbGwodGhpcyk7XG4gICAgfTtcbiAgfVxufVxuXG4vKipcbiAqIEBleHBlcmltZW50YWxcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHdpdGhNb2R1bGUobW9kdWxlRGVmOiBUZXN0TW9kdWxlTWV0YWRhdGEpOiBJbmplY3RTZXR1cFdyYXBwZXI7XG5leHBvcnQgZnVuY3Rpb24gd2l0aE1vZHVsZShtb2R1bGVEZWY6IFRlc3RNb2R1bGVNZXRhZGF0YSwgZm46IEZ1bmN0aW9uKTogKCkgPT4gYW55O1xuZXhwb3J0IGZ1bmN0aW9uIHdpdGhNb2R1bGUobW9kdWxlRGVmOiBUZXN0TW9kdWxlTWV0YWRhdGEsIGZuPzogRnVuY3Rpb24gfCBudWxsKTogKCgpID0+IGFueSl8XG4gICAgSW5qZWN0U2V0dXBXcmFwcGVyIHtcbiAgaWYgKGZuKSB7XG4gICAgLy8gTm90IHVzaW5nIGFuIGFycm93IGZ1bmN0aW9uIHRvIHByZXNlcnZlIGNvbnRleHQgcGFzc2VkIGZyb20gY2FsbCBzaXRlXG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgY29uc3QgdGVzdEJlZCA9IGdldFRlc3RCZWQoKTtcbiAgICAgIGlmIChtb2R1bGVEZWYpIHtcbiAgICAgICAgdGVzdEJlZC5jb25maWd1cmVUZXN0aW5nTW9kdWxlKG1vZHVsZURlZik7XG4gICAgICB9XG4gICAgICByZXR1cm4gZm4uYXBwbHkodGhpcyk7XG4gICAgfTtcbiAgfVxuICByZXR1cm4gbmV3IEluamVjdFNldHVwV3JhcHBlcigoKSA9PiBtb2R1bGVEZWYpO1xufSJdfQ==