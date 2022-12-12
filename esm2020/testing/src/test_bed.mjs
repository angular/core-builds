/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
// The formatter and CI disagree on how this import statement should be formatted. Both try to keep
// it on one line, too, which has gotten very hard to read & manage. So disable the formatter for
// this statement only.
/* clang-format off */
import { EnvironmentInjector, InjectFlags, Injector, NgZone, ɵconvertToBitFlags as convertToBitFlags, ɵflushModuleScopingQueueAsMuchAsPossible as flushModuleScopingQueueAsMuchAsPossible, ɵgetUnknownElementStrictMode as getUnknownElementStrictMode, ɵgetUnknownPropertyStrictMode as getUnknownPropertyStrictMode, ɵRender3ComponentFactory as ComponentFactory, ɵresetCompiledComponents as resetCompiledComponents, ɵsetAllowDuplicateNgModuleIdsForTest as setAllowDuplicateNgModuleIdsForTest, ɵsetUnknownElementStrictMode as setUnknownElementStrictMode, ɵsetUnknownPropertyStrictMode as setUnknownPropertyStrictMode, ɵstringify as stringify } from '@angular/core';
/* clang-format on */
import { ComponentFixture } from './component_fixture';
import { ComponentFixtureAutoDetect, ComponentFixtureNoNgZone, TEARDOWN_TESTING_MODULE_ON_DESTROY_DEFAULT, TestComponentRenderer, THROW_ON_UNKNOWN_ELEMENTS_DEFAULT, THROW_ON_UNKNOWN_PROPERTIES_DEFAULT } from './test_bed_common';
import { TestBedCompiler } from './test_bed_compiler';
let _nextRootElementId = 0;
/**
 * Returns a singleton of the `TestBed` class.
 *
 * @publicApi
 */
export function getTestBed() {
    return TestBedImpl.INSTANCE;
}
/**
 * @description
 * Configures and initializes environment for unit testing and provides methods for
 * creating components and services in unit tests.
 *
 * TestBed is the primary api for writing unit tests for Angular applications and libraries.
 */
export class TestBedImpl {
    constructor() {
        // Properties
        this.platform = null;
        this.ngModule = null;
        this._compiler = null;
        this._testModuleRef = null;
        this._activeFixtures = [];
        /**
         * Internal-only flag to indicate whether a module
         * scoping queue has been checked and flushed already.
         * @nodoc
         */
        this.globalCompilationChecked = false;
    }
    static get INSTANCE() {
        return TestBedImpl._INSTANCE = TestBedImpl._INSTANCE || new TestBedImpl();
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
    static initTestEnvironment(ngModule, platform, options) {
        const testBed = TestBedImpl.INSTANCE;
        testBed.initTestEnvironment(ngModule, platform, options);
        return testBed;
    }
    /**
     * Reset the providers for the test injector.
     *
     * @publicApi
     */
    static resetTestEnvironment() {
        TestBedImpl.INSTANCE.resetTestEnvironment();
    }
    static configureCompiler(config) {
        return TestBedImpl.INSTANCE.configureCompiler(config);
    }
    /**
     * Allows overriding default providers, directives, pipes, modules of the test injector,
     * which are defined in test_injector.js
     */
    static configureTestingModule(moduleDef) {
        return TestBedImpl.INSTANCE.configureTestingModule(moduleDef);
    }
    /**
     * Compile components with a `templateUrl` for the test's NgModule.
     * It is necessary to call this function
     * as fetching urls is asynchronous.
     */
    static compileComponents() {
        return TestBedImpl.INSTANCE.compileComponents();
    }
    static overrideModule(ngModule, override) {
        return TestBedImpl.INSTANCE.overrideModule(ngModule, override);
    }
    static overrideComponent(component, override) {
        return TestBedImpl.INSTANCE.overrideComponent(component, override);
    }
    static overrideDirective(directive, override) {
        return TestBedImpl.INSTANCE.overrideDirective(directive, override);
    }
    static overridePipe(pipe, override) {
        return TestBedImpl.INSTANCE.overridePipe(pipe, override);
    }
    static overrideTemplate(component, template) {
        return TestBedImpl.INSTANCE.overrideTemplate(component, template);
    }
    /**
     * Overrides the template of the given component, compiling the template
     * in the context of the TestingModule.
     *
     * Note: This works for JIT and AOTed components as well.
     */
    static overrideTemplateUsingTestingModule(component, template) {
        return TestBedImpl.INSTANCE.overrideTemplateUsingTestingModule(component, template);
    }
    static overrideProvider(token, provider) {
        return TestBedImpl.INSTANCE.overrideProvider(token, provider);
    }
    static inject(token, notFoundValue, flags) {
        return TestBedImpl.INSTANCE.inject(token, notFoundValue, convertToBitFlags(flags));
    }
    /** @deprecated from v9.0.0 use TestBed.inject */
    static get(token, notFoundValue = Injector.THROW_IF_NOT_FOUND, flags = InjectFlags.Default) {
        return TestBedImpl.INSTANCE.inject(token, notFoundValue, flags);
    }
    /**
     * Runs the given function in the `EnvironmentInjector` context of `TestBed`.
     *
     * @see EnvironmentInjector#runInContext
     */
    static runInInjectionContext(fn) {
        return TestBedImpl.INSTANCE.runInInjectionContext(fn);
    }
    static createComponent(component) {
        return TestBedImpl.INSTANCE.createComponent(component);
    }
    static resetTestingModule() {
        return TestBedImpl.INSTANCE.resetTestingModule();
    }
    static execute(tokens, fn, context) {
        return TestBedImpl.INSTANCE.execute(tokens, fn, context);
    }
    static get platform() {
        return TestBedImpl.INSTANCE.platform;
    }
    static get ngModule() {
        return TestBedImpl.INSTANCE.ngModule;
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
    initTestEnvironment(ngModule, platform, options) {
        if (this.platform || this.ngModule) {
            throw new Error('Cannot set base providers because it has already been called');
        }
        TestBedImpl._environmentTeardownOptions = options?.teardown;
        TestBedImpl._environmentErrorOnUnknownElementsOption = options?.errorOnUnknownElements;
        TestBedImpl._environmentErrorOnUnknownPropertiesOption = options?.errorOnUnknownProperties;
        this.platform = platform;
        this.ngModule = ngModule;
        this._compiler = new TestBedCompiler(this.platform, this.ngModule);
        // TestBed does not have an API which can reliably detect the start of a test, and thus could be
        // used to track the state of the NgModule registry and reset it correctly. Instead, when we
        // know we're in a testing scenario, we disable the check for duplicate NgModule registration
        // completely.
        setAllowDuplicateNgModuleIdsForTest(true);
    }
    /**
     * Reset the providers for the test injector.
     *
     * @publicApi
     */
    resetTestEnvironment() {
        this.resetTestingModule();
        this._compiler = null;
        this.platform = null;
        this.ngModule = null;
        TestBedImpl._environmentTeardownOptions = undefined;
        setAllowDuplicateNgModuleIdsForTest(false);
    }
    resetTestingModule() {
        this.checkGlobalCompilationFinished();
        resetCompiledComponents();
        if (this._compiler !== null) {
            this.compiler.restoreOriginalState();
        }
        this._compiler = new TestBedCompiler(this.platform, this.ngModule);
        // Restore the previous value of the "error on unknown elements" option
        setUnknownElementStrictMode(this._previousErrorOnUnknownElementsOption ?? THROW_ON_UNKNOWN_ELEMENTS_DEFAULT);
        // Restore the previous value of the "error on unknown properties" option
        setUnknownPropertyStrictMode(this._previousErrorOnUnknownPropertiesOption ?? THROW_ON_UNKNOWN_PROPERTIES_DEFAULT);
        // We have to chain a couple of try/finally blocks, because each step can
        // throw errors and we don't want it to interrupt the next step and we also
        // want an error to be thrown at the end.
        try {
            this.destroyActiveFixtures();
        }
        finally {
            try {
                if (this.shouldTearDownTestingModule()) {
                    this.tearDownTestingModule();
                }
            }
            finally {
                this._testModuleRef = null;
                this._instanceTeardownOptions = undefined;
                this._instanceErrorOnUnknownElementsOption = undefined;
                this._instanceErrorOnUnknownPropertiesOption = undefined;
            }
        }
        return this;
    }
    configureCompiler(config) {
        if (config.useJit != null) {
            throw new Error('the Render3 compiler JiT mode is not configurable !');
        }
        if (config.providers !== undefined) {
            this.compiler.setCompilerProviders(config.providers);
        }
        return this;
    }
    configureTestingModule(moduleDef) {
        this.assertNotInstantiated('R3TestBed.configureTestingModule', 'configure the test module');
        // Trigger module scoping queue flush before executing other TestBed operations in a test.
        // This is needed for the first test invocation to ensure that globally declared modules have
        // their components scoped properly. See the `checkGlobalCompilationFinished` function
        // description for additional info.
        this.checkGlobalCompilationFinished();
        // Always re-assign the options, even if they're undefined.
        // This ensures that we don't carry them between tests.
        this._instanceTeardownOptions = moduleDef.teardown;
        this._instanceErrorOnUnknownElementsOption = moduleDef.errorOnUnknownElements;
        this._instanceErrorOnUnknownPropertiesOption = moduleDef.errorOnUnknownProperties;
        // Store the current value of the strict mode option,
        // so we can restore it later
        this._previousErrorOnUnknownElementsOption = getUnknownElementStrictMode();
        setUnknownElementStrictMode(this.shouldThrowErrorOnUnknownElements());
        this._previousErrorOnUnknownPropertiesOption = getUnknownPropertyStrictMode();
        setUnknownPropertyStrictMode(this.shouldThrowErrorOnUnknownProperties());
        this.compiler.configureTestingModule(moduleDef);
        return this;
    }
    compileComponents() {
        return this.compiler.compileComponents();
    }
    inject(token, notFoundValue, flags) {
        if (token === TestBed) {
            return this;
        }
        const UNDEFINED = {};
        const result = this.testModuleRef.injector.get(token, UNDEFINED, convertToBitFlags(flags));
        return result === UNDEFINED ? this.compiler.injector.get(token, notFoundValue, flags) :
            result;
    }
    /** @deprecated from v9.0.0 use TestBed.inject */
    get(token, notFoundValue = Injector.THROW_IF_NOT_FOUND, flags = InjectFlags.Default) {
        return this.inject(token, notFoundValue, flags);
    }
    runInInjectionContext(fn) {
        return this.inject(EnvironmentInjector).runInContext(fn);
    }
    execute(tokens, fn, context) {
        const params = tokens.map(t => this.inject(t));
        return fn.apply(context, params);
    }
    overrideModule(ngModule, override) {
        this.assertNotInstantiated('overrideModule', 'override module metadata');
        this.compiler.overrideModule(ngModule, override);
        return this;
    }
    overrideComponent(component, override) {
        this.assertNotInstantiated('overrideComponent', 'override component metadata');
        this.compiler.overrideComponent(component, override);
        return this;
    }
    overrideTemplateUsingTestingModule(component, template) {
        this.assertNotInstantiated('R3TestBed.overrideTemplateUsingTestingModule', 'Cannot override template when the test module has already been instantiated');
        this.compiler.overrideTemplateUsingTestingModule(component, template);
        return this;
    }
    overrideDirective(directive, override) {
        this.assertNotInstantiated('overrideDirective', 'override directive metadata');
        this.compiler.overrideDirective(directive, override);
        return this;
    }
    overridePipe(pipe, override) {
        this.assertNotInstantiated('overridePipe', 'override pipe metadata');
        this.compiler.overridePipe(pipe, override);
        return this;
    }
    /**
     * Overwrites all providers for the given token with the given provider definition.
     */
    overrideProvider(token, provider) {
        this.assertNotInstantiated('overrideProvider', 'override provider');
        this.compiler.overrideProvider(token, provider);
        return this;
    }
    overrideTemplate(component, template) {
        return this.overrideComponent(component, { set: { template, templateUrl: null } });
    }
    createComponent(type) {
        const testComponentRenderer = this.inject(TestComponentRenderer);
        const rootElId = `root${_nextRootElementId++}`;
        testComponentRenderer.insertRootElement(rootElId);
        const componentDef = type.ɵcmp;
        if (!componentDef) {
            throw new Error(`It looks like '${stringify(type)}' has not been compiled.`);
        }
        // TODO: Don't cast as `InjectionToken<boolean>`, proper type is boolean[]
        const noNgZone = this.inject(ComponentFixtureNoNgZone, false);
        // TODO: Don't cast as `InjectionToken<boolean>`, proper type is boolean[]
        const autoDetect = this.inject(ComponentFixtureAutoDetect, false);
        const ngZone = noNgZone ? null : this.inject(NgZone, null);
        const componentFactory = new ComponentFactory(componentDef);
        const initComponent = () => {
            const componentRef = componentFactory.create(Injector.NULL, [], `#${rootElId}`, this.testModuleRef);
            return new ComponentFixture(componentRef, ngZone, autoDetect);
        };
        const fixture = ngZone ? ngZone.run(initComponent) : initComponent();
        this._activeFixtures.push(fixture);
        return fixture;
    }
    /**
     * @internal strip this from published d.ts files due to
     * https://github.com/microsoft/TypeScript/issues/36216
     */
    get compiler() {
        if (this._compiler === null) {
            throw new Error(`Need to call TestBed.initTestEnvironment() first`);
        }
        return this._compiler;
    }
    /**
     * @internal strip this from published d.ts files due to
     * https://github.com/microsoft/TypeScript/issues/36216
     */
    get testModuleRef() {
        if (this._testModuleRef === null) {
            this._testModuleRef = this.compiler.finalize();
        }
        return this._testModuleRef;
    }
    assertNotInstantiated(methodName, methodDescription) {
        if (this._testModuleRef !== null) {
            throw new Error(`Cannot ${methodDescription} when the test module has already been instantiated. ` +
                `Make sure you are not using \`inject\` before \`${methodName}\`.`);
        }
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
     */
    checkGlobalCompilationFinished() {
        // Checking _testNgModuleRef is null should not be necessary, but is left in as an additional
        // guard that compilations queued in tests (after instantiation) are never flushed accidentally.
        if (!this.globalCompilationChecked && this._testModuleRef === null) {
            flushModuleScopingQueueAsMuchAsPossible();
        }
        this.globalCompilationChecked = true;
    }
    destroyActiveFixtures() {
        let errorCount = 0;
        this._activeFixtures.forEach((fixture) => {
            try {
                fixture.destroy();
            }
            catch (e) {
                errorCount++;
                console.error('Error during cleanup of component', {
                    component: fixture.componentInstance,
                    stacktrace: e,
                });
            }
        });
        this._activeFixtures = [];
        if (errorCount > 0 && this.shouldRethrowTeardownErrors()) {
            throw Error(`${errorCount} ${(errorCount === 1 ? 'component' : 'components')} ` +
                `threw errors during cleanup`);
        }
    }
    shouldRethrowTeardownErrors() {
        const instanceOptions = this._instanceTeardownOptions;
        const environmentOptions = TestBedImpl._environmentTeardownOptions;
        // If the new teardown behavior hasn't been configured, preserve the old behavior.
        if (!instanceOptions && !environmentOptions) {
            return TEARDOWN_TESTING_MODULE_ON_DESTROY_DEFAULT;
        }
        // Otherwise use the configured behavior or default to rethrowing.
        return instanceOptions?.rethrowErrors ?? environmentOptions?.rethrowErrors ??
            this.shouldTearDownTestingModule();
    }
    shouldThrowErrorOnUnknownElements() {
        // Check if a configuration has been provided to throw when an unknown element is found
        return this._instanceErrorOnUnknownElementsOption ??
            TestBedImpl._environmentErrorOnUnknownElementsOption ?? THROW_ON_UNKNOWN_ELEMENTS_DEFAULT;
    }
    shouldThrowErrorOnUnknownProperties() {
        // Check if a configuration has been provided to throw when an unknown property is found
        return this._instanceErrorOnUnknownPropertiesOption ??
            TestBedImpl._environmentErrorOnUnknownPropertiesOption ??
            THROW_ON_UNKNOWN_PROPERTIES_DEFAULT;
    }
    shouldTearDownTestingModule() {
        return this._instanceTeardownOptions?.destroyAfterEach ??
            TestBedImpl._environmentTeardownOptions?.destroyAfterEach ??
            TEARDOWN_TESTING_MODULE_ON_DESTROY_DEFAULT;
    }
    tearDownTestingModule() {
        // If the module ref has already been destroyed, we won't be able to get a test renderer.
        if (this._testModuleRef === null) {
            return;
        }
        // Resolve the renderer ahead of time, because we want to remove the root elements as the very
        // last step, but the injector will be destroyed as a part of the module ref destruction.
        const testRenderer = this.inject(TestComponentRenderer);
        try {
            this._testModuleRef.destroy();
        }
        catch (e) {
            if (this.shouldRethrowTeardownErrors()) {
                throw e;
            }
            else {
                console.error('Error during cleanup of a testing module', {
                    component: this._testModuleRef.instance,
                    stacktrace: e,
                });
            }
        }
        finally {
            testRenderer.removeAllRootElements?.();
        }
    }
}
TestBedImpl._INSTANCE = null;
/**
 * @description
 * Configures and initializes environment for unit testing and provides methods for
 * creating components and services in unit tests.
 *
 * `TestBed` is the primary api for writing unit tests for Angular applications and libraries.
 *
 * @publicApi
 */
export const TestBed = TestBedImpl;
/**
 * Allows injecting dependencies in `beforeEach()` and `it()`. Note: this function
 * (imported from the `@angular/core/testing` package) can **only** be used to inject dependencies
 * in tests. To inject dependencies in your application code, use the [`inject`](api/core/inject)
 * function from the `@angular/core` package instead.
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
 * @publicApi
 */
export function inject(tokens, fn) {
    const testBed = TestBedImpl.INSTANCE;
    // Not using an arrow function to preserve context passed from call site
    return function () {
        return testBed.execute(tokens, fn, this);
    };
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
            TestBedImpl.configureTestingModule(moduleDef);
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
            const testBed = TestBedImpl.INSTANCE;
            if (moduleDef) {
                testBed.configureTestingModule(moduleDef);
            }
            return fn.apply(this);
        };
    }
    return new InjectSetupWrapper(() => moduleDef);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdF9iZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3Rlc3Rpbmcvc3JjL3Rlc3RfYmVkLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILG1HQUFtRztBQUNuRyxpR0FBaUc7QUFDakcsdUJBQXVCO0FBRXZCLHNCQUFzQjtBQUN0QixPQUFPLEVBR0wsbUJBQW1CLEVBQ25CLFdBQVcsRUFHWCxRQUFRLEVBRVIsTUFBTSxFQUtOLGtCQUFrQixJQUFJLGlCQUFpQixFQUN2Qyx3Q0FBd0MsSUFBSSx1Q0FBdUMsRUFDbkYsNEJBQTRCLElBQUksMkJBQTJCLEVBQzNELDZCQUE2QixJQUFJLDRCQUE0QixFQUM3RCx3QkFBd0IsSUFBSSxnQkFBZ0IsRUFFNUMsd0JBQXdCLElBQUksdUJBQXVCLEVBQ25ELG9DQUFvQyxJQUFJLG1DQUFtQyxFQUMzRSw0QkFBNEIsSUFBSSwyQkFBMkIsRUFDM0QsNkJBQTZCLElBQUksNEJBQTRCLEVBQzdELFVBQVUsSUFBSSxTQUFTLEVBQ3hCLE1BQU0sZUFBZSxDQUFDO0FBRXZCLHFCQUFxQjtBQUVyQixPQUFPLEVBQUMsZ0JBQWdCLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUVyRCxPQUFPLEVBQUMsMEJBQTBCLEVBQUUsd0JBQXdCLEVBQXlCLDBDQUEwQyxFQUFFLHFCQUFxQixFQUE4QyxpQ0FBaUMsRUFBRSxtQ0FBbUMsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQ3JTLE9BQU8sRUFBQyxlQUFlLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQWlHcEQsSUFBSSxrQkFBa0IsR0FBRyxDQUFDLENBQUM7QUFFM0I7Ozs7R0FJRztBQUNILE1BQU0sVUFBVSxVQUFVO0lBQ3hCLE9BQU8sV0FBVyxDQUFDLFFBQVEsQ0FBQztBQUM5QixDQUFDO0FBRUQ7Ozs7OztHQU1HO0FBQ0gsTUFBTSxPQUFPLFdBQVc7SUFBeEI7UUE0TUUsYUFB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LElBQUksU0FBUyxFQUFFO2dCQUNiLE9BQU8sQ0FBQyxzQkFBc0IsQ0FBQyxTQUFTLENBQUMsQ0FBQzthQUMzQztZQUNELE9BQU8sRUFBRSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUN4QixDQUFDLENBQUM7S0FDSDtJQUNELE9BQU8sSUFBSSxrQkFBa0IsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxTQUFTLENBQUMsQ0FBQztBQUNqRCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbi8vIFRoZSBmb3JtYXR0ZXIgYW5kIENJIGRpc2FncmVlIG9uIGhvdyB0aGlzIGltcG9ydCBzdGF0ZW1lbnQgc2hvdWxkIGJlIGZvcm1hdHRlZC4gQm90aCB0cnkgdG8ga2VlcFxuLy8gaXQgb24gb25lIGxpbmUsIHRvbywgd2hpY2ggaGFzIGdvdHRlbiB2ZXJ5IGhhcmQgdG8gcmVhZCAmIG1hbmFnZS4gU28gZGlzYWJsZSB0aGUgZm9ybWF0dGVyIGZvclxuLy8gdGhpcyBzdGF0ZW1lbnQgb25seS5cblxuLyogY2xhbmctZm9ybWF0IG9mZiAqL1xuaW1wb3J0IHtcbiAgQ29tcG9uZW50LFxuICBEaXJlY3RpdmUsXG4gIEVudmlyb25tZW50SW5qZWN0b3IsXG4gIEluamVjdEZsYWdzLFxuICBJbmplY3Rpb25Ub2tlbixcbiAgSW5qZWN0T3B0aW9ucyxcbiAgSW5qZWN0b3IsXG4gIE5nTW9kdWxlLFxuICBOZ1pvbmUsXG4gIFBpcGUsXG4gIFBsYXRmb3JtUmVmLFxuICBQcm92aWRlclRva2VuLFxuICBUeXBlLFxuICDJtWNvbnZlcnRUb0JpdEZsYWdzIGFzIGNvbnZlcnRUb0JpdEZsYWdzLFxuICDJtWZsdXNoTW9kdWxlU2NvcGluZ1F1ZXVlQXNNdWNoQXNQb3NzaWJsZSBhcyBmbHVzaE1vZHVsZVNjb3BpbmdRdWV1ZUFzTXVjaEFzUG9zc2libGUsXG4gIMm1Z2V0VW5rbm93bkVsZW1lbnRTdHJpY3RNb2RlIGFzIGdldFVua25vd25FbGVtZW50U3RyaWN0TW9kZSxcbiAgybVnZXRVbmtub3duUHJvcGVydHlTdHJpY3RNb2RlIGFzIGdldFVua25vd25Qcm9wZXJ0eVN0cmljdE1vZGUsXG4gIMm1UmVuZGVyM0NvbXBvbmVudEZhY3RvcnkgYXMgQ29tcG9uZW50RmFjdG9yeSxcbiAgybVSZW5kZXIzTmdNb2R1bGVSZWYgYXMgTmdNb2R1bGVSZWYsXG4gIMm1cmVzZXRDb21waWxlZENvbXBvbmVudHMgYXMgcmVzZXRDb21waWxlZENvbXBvbmVudHMsXG4gIMm1c2V0QWxsb3dEdXBsaWNhdGVOZ01vZHVsZUlkc0ZvclRlc3QgYXMgc2V0QWxsb3dEdXBsaWNhdGVOZ01vZHVsZUlkc0ZvclRlc3QsXG4gIMm1c2V0VW5rbm93bkVsZW1lbnRTdHJpY3RNb2RlIGFzIHNldFVua25vd25FbGVtZW50U3RyaWN0TW9kZSxcbiAgybVzZXRVbmtub3duUHJvcGVydHlTdHJpY3RNb2RlIGFzIHNldFVua25vd25Qcm9wZXJ0eVN0cmljdE1vZGUsXG4gIMm1c3RyaW5naWZ5IGFzIHN0cmluZ2lmeVxufSBmcm9tICdAYW5ndWxhci9jb3JlJztcblxuLyogY2xhbmctZm9ybWF0IG9uICovXG5cbmltcG9ydCB7Q29tcG9uZW50Rml4dHVyZX0gZnJvbSAnLi9jb21wb25lbnRfZml4dHVyZSc7XG5pbXBvcnQge01ldGFkYXRhT3ZlcnJpZGV9IGZyb20gJy4vbWV0YWRhdGFfb3ZlcnJpZGUnO1xuaW1wb3J0IHtDb21wb25lbnRGaXh0dXJlQXV0b0RldGVjdCwgQ29tcG9uZW50Rml4dHVyZU5vTmdab25lLCBNb2R1bGVUZWFyZG93bk9wdGlvbnMsIFRFQVJET1dOX1RFU1RJTkdfTU9EVUxFX09OX0RFU1RST1lfREVGQVVMVCwgVGVzdENvbXBvbmVudFJlbmRlcmVyLCBUZXN0RW52aXJvbm1lbnRPcHRpb25zLCBUZXN0TW9kdWxlTWV0YWRhdGEsIFRIUk9XX09OX1VOS05PV05fRUxFTUVOVFNfREVGQVVMVCwgVEhST1dfT05fVU5LTk9XTl9QUk9QRVJUSUVTX0RFRkFVTFR9IGZyb20gJy4vdGVzdF9iZWRfY29tbW9uJztcbmltcG9ydCB7VGVzdEJlZENvbXBpbGVyfSBmcm9tICcuL3Rlc3RfYmVkX2NvbXBpbGVyJztcblxuLyoqXG4gKiBTdGF0aWMgbWV0aG9kcyBpbXBsZW1lbnRlZCBieSB0aGUgYFRlc3RCZWRgLlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBUZXN0QmVkU3RhdGljIGV4dGVuZHMgVGVzdEJlZCB7XG4gIG5ldyguLi5hcmdzOiBhbnlbXSk6IFRlc3RCZWQ7XG59XG5cbi8qKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgaW50ZXJmYWNlIFRlc3RCZWQge1xuICBnZXQgcGxhdGZvcm0oKTogUGxhdGZvcm1SZWY7XG5cbiAgZ2V0IG5nTW9kdWxlKCk6IFR5cGU8YW55PnxUeXBlPGFueT5bXTtcblxuICAvKipcbiAgICogSW5pdGlhbGl6ZSB0aGUgZW52aXJvbm1lbnQgZm9yIHRlc3Rpbmcgd2l0aCBhIGNvbXBpbGVyIGZhY3RvcnksIGEgUGxhdGZvcm1SZWYsIGFuZCBhblxuICAgKiBhbmd1bGFyIG1vZHVsZS4gVGhlc2UgYXJlIGNvbW1vbiB0byBldmVyeSB0ZXN0IGluIHRoZSBzdWl0ZS5cbiAgICpcbiAgICogVGhpcyBtYXkgb25seSBiZSBjYWxsZWQgb25jZSwgdG8gc2V0IHVwIHRoZSBjb21tb24gcHJvdmlkZXJzIGZvciB0aGUgY3VycmVudCB0ZXN0XG4gICAqIHN1aXRlIG9uIHRoZSBjdXJyZW50IHBsYXRmb3JtLiBJZiB5b3UgYWJzb2x1dGVseSBuZWVkIHRvIGNoYW5nZSB0aGUgcHJvdmlkZXJzLFxuICAgKiBmaXJzdCB1c2UgYHJlc2V0VGVzdEVudmlyb25tZW50YC5cbiAgICpcbiAgICogVGVzdCBtb2R1bGVzIGFuZCBwbGF0Zm9ybXMgZm9yIGluZGl2aWR1YWwgcGxhdGZvcm1zIGFyZSBhdmFpbGFibGUgZnJvbVxuICAgKiAnQGFuZ3VsYXIvPHBsYXRmb3JtX25hbWU+L3Rlc3RpbmcnLlxuICAgKi9cbiAgaW5pdFRlc3RFbnZpcm9ubWVudChcbiAgICAgIG5nTW9kdWxlOiBUeXBlPGFueT58VHlwZTxhbnk+W10sIHBsYXRmb3JtOiBQbGF0Zm9ybVJlZixcbiAgICAgIG9wdGlvbnM/OiBUZXN0RW52aXJvbm1lbnRPcHRpb25zKTogdm9pZDtcblxuICAvKipcbiAgICogUmVzZXQgdGhlIHByb3ZpZGVycyBmb3IgdGhlIHRlc3QgaW5qZWN0b3IuXG4gICAqL1xuICByZXNldFRlc3RFbnZpcm9ubWVudCgpOiB2b2lkO1xuXG4gIHJlc2V0VGVzdGluZ01vZHVsZSgpOiBUZXN0QmVkO1xuXG4gIGNvbmZpZ3VyZUNvbXBpbGVyKGNvbmZpZzoge3Byb3ZpZGVycz86IGFueVtdLCB1c2VKaXQ/OiBib29sZWFufSk6IHZvaWQ7XG5cbiAgY29uZmlndXJlVGVzdGluZ01vZHVsZShtb2R1bGVEZWY6IFRlc3RNb2R1bGVNZXRhZGF0YSk6IFRlc3RCZWQ7XG5cbiAgY29tcGlsZUNvbXBvbmVudHMoKTogUHJvbWlzZTxhbnk+O1xuXG4gIGluamVjdDxUPih0b2tlbjogUHJvdmlkZXJUb2tlbjxUPiwgbm90Rm91bmRWYWx1ZTogdW5kZWZpbmVkLCBvcHRpb25zOiBJbmplY3RPcHRpb25zJntcbiAgICBvcHRpb25hbD86IGZhbHNlXG4gIH0pOiBUO1xuICBpbmplY3Q8VD4odG9rZW46IFByb3ZpZGVyVG9rZW48VD4sIG5vdEZvdW5kVmFsdWU6IG51bGx8dW5kZWZpbmVkLCBvcHRpb25zOiBJbmplY3RPcHRpb25zKTogVHxudWxsO1xuICBpbmplY3Q8VD4odG9rZW46IFByb3ZpZGVyVG9rZW48VD4sIG5vdEZvdW5kVmFsdWU/OiBULCBvcHRpb25zPzogSW5qZWN0T3B0aW9ucyk6IFQ7XG4gIC8qKiBAZGVwcmVjYXRlZCB1c2Ugb2JqZWN0LWJhc2VkIGZsYWdzIChgSW5qZWN0T3B0aW9uc2ApIGluc3RlYWQuICovXG4gIGluamVjdDxUPih0b2tlbjogUHJvdmlkZXJUb2tlbjxUPiwgbm90Rm91bmRWYWx1ZT86IFQsIGZsYWdzPzogSW5qZWN0RmxhZ3MpOiBUO1xuICAvKiogQGRlcHJlY2F0ZWQgdXNlIG9iamVjdC1iYXNlZCBmbGFncyAoYEluamVjdE9wdGlvbnNgKSBpbnN0ZWFkLiAqL1xuICBpbmplY3Q8VD4odG9rZW46IFByb3ZpZGVyVG9rZW48VD4sIG5vdEZvdW5kVmFsdWU6IG51bGwsIGZsYWdzPzogSW5qZWN0RmxhZ3MpOiBUfG51bGw7XG5cbiAgLyoqIEBkZXByZWNhdGVkIGZyb20gdjkuMC4wIHVzZSBUZXN0QmVkLmluamVjdCAqL1xuICBnZXQ8VD4odG9rZW46IFByb3ZpZGVyVG9rZW48VD4sIG5vdEZvdW5kVmFsdWU/OiBULCBmbGFncz86IEluamVjdEZsYWdzKTogYW55O1xuICAvKiogQGRlcHJlY2F0ZWQgZnJvbSB2OS4wLjAgdXNlIFRlc3RCZWQuaW5qZWN0ICovXG4gIGdldCh0b2tlbjogYW55LCBub3RGb3VuZFZhbHVlPzogYW55KTogYW55O1xuXG4gIC8qKlxuICAgKiBSdW5zIHRoZSBnaXZlbiBmdW5jdGlvbiBpbiB0aGUgYEVudmlyb25tZW50SW5qZWN0b3JgIGNvbnRleHQgb2YgYFRlc3RCZWRgLlxuICAgKlxuICAgKiBAc2VlIEVudmlyb25tZW50SW5qZWN0b3IjcnVuSW5Db250ZXh0XG4gICAqL1xuICBydW5JbkluamVjdGlvbkNvbnRleHQ8VD4oZm46ICgpID0+IFQpOiBUO1xuXG4gIGV4ZWN1dGUodG9rZW5zOiBhbnlbXSwgZm46IEZ1bmN0aW9uLCBjb250ZXh0PzogYW55KTogYW55O1xuXG4gIG92ZXJyaWRlTW9kdWxlKG5nTW9kdWxlOiBUeXBlPGFueT4sIG92ZXJyaWRlOiBNZXRhZGF0YU92ZXJyaWRlPE5nTW9kdWxlPik6IFRlc3RCZWQ7XG5cbiAgb3ZlcnJpZGVDb21wb25lbnQoY29tcG9uZW50OiBUeXBlPGFueT4sIG92ZXJyaWRlOiBNZXRhZGF0YU92ZXJyaWRlPENvbXBvbmVudD4pOiBUZXN0QmVkO1xuXG4gIG92ZXJyaWRlRGlyZWN0aXZlKGRpcmVjdGl2ZTogVHlwZTxhbnk+LCBvdmVycmlkZTogTWV0YWRhdGFPdmVycmlkZTxEaXJlY3RpdmU+KTogVGVzdEJlZDtcblxuICBvdmVycmlkZVBpcGUocGlwZTogVHlwZTxhbnk+LCBvdmVycmlkZTogTWV0YWRhdGFPdmVycmlkZTxQaXBlPik6IFRlc3RCZWQ7XG5cbiAgb3ZlcnJpZGVUZW1wbGF0ZShjb21wb25lbnQ6IFR5cGU8YW55PiwgdGVtcGxhdGU6IHN0cmluZyk6IFRlc3RCZWQ7XG5cbiAgLyoqXG4gICAqIE92ZXJ3cml0ZXMgYWxsIHByb3ZpZGVycyBmb3IgdGhlIGdpdmVuIHRva2VuIHdpdGggdGhlIGdpdmVuIHByb3ZpZGVyIGRlZmluaXRpb24uXG4gICAqL1xuICBvdmVycmlkZVByb3ZpZGVyKHRva2VuOiBhbnksIHByb3ZpZGVyOiB7XG4gICAgdXNlRmFjdG9yeTogRnVuY3Rpb24sXG4gICAgZGVwczogYW55W10sXG4gIH0pOiBUZXN0QmVkO1xuICBvdmVycmlkZVByb3ZpZGVyKHRva2VuOiBhbnksIHByb3ZpZGVyOiB7dXNlVmFsdWU6IGFueTt9KTogVGVzdEJlZDtcbiAgb3ZlcnJpZGVQcm92aWRlcih0b2tlbjogYW55LCBwcm92aWRlcjoge3VzZUZhY3Rvcnk/OiBGdW5jdGlvbiwgdXNlVmFsdWU/OiBhbnksIGRlcHM/OiBhbnlbXX0pOlxuICAgICAgVGVzdEJlZDtcblxuICBvdmVycmlkZVRlbXBsYXRlVXNpbmdUZXN0aW5nTW9kdWxlKGNvbXBvbmVudDogVHlwZTxhbnk+LCB0ZW1wbGF0ZTogc3RyaW5nKTogVGVzdEJlZDtcblxuICBjcmVhdGVDb21wb25lbnQ8VD4oY29tcG9uZW50OiBUeXBlPFQ+KTogQ29tcG9uZW50Rml4dHVyZTxUPjtcbn1cblxubGV0IF9uZXh0Um9vdEVsZW1lbnRJZCA9IDA7XG5cbi8qKlxuICogUmV0dXJucyBhIHNpbmdsZXRvbiBvZiB0aGUgYFRlc3RCZWRgIGNsYXNzLlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldFRlc3RCZWQoKTogVGVzdEJlZCB7XG4gIHJldHVybiBUZXN0QmVkSW1wbC5JTlNUQU5DRTtcbn1cblxuLyoqXG4gKiBAZGVzY3JpcHRpb25cbiAqIENvbmZpZ3VyZXMgYW5kIGluaXRpYWxpemVzIGVudmlyb25tZW50IGZvciB1bml0IHRlc3RpbmcgYW5kIHByb3ZpZGVzIG1ldGhvZHMgZm9yXG4gKiBjcmVhdGluZyBjb21wb25lbnRzIGFuZCBzZXJ2aWNlcyBpbiB1bml0IHRlc3RzLlxuICpcbiAqIFRlc3RCZWQgaXMgdGhlIHByaW1hcnkgYXBpIGZvciB3cml0aW5nIHVuaXQgdGVzdHMgZm9yIEFuZ3VsYXIgYXBwbGljYXRpb25zIGFuZCBsaWJyYXJpZXMuXG4gKi9cbmV4cG9ydCBjbGFzcyBUZXN0QmVkSW1wbCBpbXBsZW1lbnRzIFRlc3RCZWQge1xuICBwcml2YXRlIHN0YXRpYyBfSU5TVEFOQ0U6IFRlc3RCZWRJbXBsfG51bGwgPSBudWxsO1xuXG4gIHN0YXRpYyBnZXQgSU5TVEFOQ0UoKTogVGVzdEJlZEltcGwge1xuICAgIHJldHVybiBUZXN0QmVkSW1wbC5fSU5TVEFOQ0UgPSBUZXN0QmVkSW1wbC5fSU5TVEFOQ0UgfHwgbmV3IFRlc3RCZWRJbXBsKCk7XG4gIH1cblxuICAvKipcbiAgICogVGVhcmRvd24gb3B0aW9ucyB0aGF0IGhhdmUgYmVlbiBjb25maWd1cmVkIGF0IHRoZSBlbnZpcm9ubWVudCBsZXZlbC5cbiAgICogVXNlZCBhcyBhIGZhbGxiYWNrIGlmIG5vIGluc3RhbmNlLWxldmVsIG9wdGlvbnMgaGF2ZSBiZWVuIHByb3ZpZGVkLlxuICAgKi9cbiAgcHJpdmF0ZSBzdGF0aWMgX2Vudmlyb25tZW50VGVhcmRvd25PcHRpb25zOiBNb2R1bGVUZWFyZG93bk9wdGlvbnN8dW5kZWZpbmVkO1xuXG4gIC8qKlxuICAgKiBcIkVycm9yIG9uIHVua25vd24gZWxlbWVudHNcIiBvcHRpb24gdGhhdCBoYXMgYmVlbiBjb25maWd1cmVkIGF0IHRoZSBlbnZpcm9ubWVudCBsZXZlbC5cbiAgICogVXNlZCBhcyBhIGZhbGxiYWNrIGlmIG5vIGluc3RhbmNlLWxldmVsIG9wdGlvbiBoYXMgYmVlbiBwcm92aWRlZC5cbiAgICovXG4gIHByaXZhdGUgc3RhdGljIF9lbnZpcm9ubWVudEVycm9yT25Vbmtub3duRWxlbWVudHNPcHRpb246IGJvb2xlYW58dW5kZWZpbmVkO1xuXG4gIC8qKlxuICAgKiBcIkVycm9yIG9uIHVua25vd24gcHJvcGVydGllc1wiIG9wdGlvbiB0aGF0IGhhcyBiZWVuIGNvbmZpZ3VyZWQgYXQgdGhlIGVudmlyb25tZW50IGxldmVsLlxuICAgKiBVc2VkIGFzIGEgZmFsbGJhY2sgaWYgbm8gaW5zdGFuY2UtbGV2ZWwgb3B0aW9uIGhhcyBiZWVuIHByb3ZpZGVkLlxuICAgKi9cbiAgcHJpdmF0ZSBzdGF0aWMgX2Vudmlyb25tZW50RXJyb3JPblVua25vd25Qcm9wZXJ0aWVzT3B0aW9uOiBib29sZWFufHVuZGVmaW5lZDtcblxuICAvKipcbiAgICogVGVhcmRvd24gb3B0aW9ucyB0aGF0IGhhdmUgYmVlbiBjb25maWd1cmVkIGF0IHRoZSBgVGVzdEJlZGAgaW5zdGFuY2UgbGV2ZWwuXG4gICAqIFRoZXNlIG9wdGlvbnMgdGFrZSBwcmVjZWRlbmNlIG92ZXIgdGhlIGVudmlyb25tZW50LWxldmVsIG9uZXMuXG4gICAqL1xuICBwcml2YXRlIF9pbnN0YW5jZVRlYXJkb3duT3B0aW9uczogTW9kdWxlVGVhcmRvd25PcHRpb25zfHVuZGVmaW5lZDtcblxuICAvKipcbiAgICogXCJFcnJvciBvbiB1bmtub3duIGVsZW1lbnRzXCIgb3B0aW9uIHRoYXQgaGFzIGJlZW4gY29uZmlndXJlZCBhdCB0aGUgYFRlc3RCZWRgIGluc3RhbmNlIGxldmVsLlxuICAgKiBUaGlzIG9wdGlvbiB0YWtlcyBwcmVjZWRlbmNlIG92ZXIgdGhlIGVudmlyb25tZW50LWxldmVsIG9uZS5cbiAgICovXG4gIHByaXZhdGUgX2luc3RhbmNlRXJyb3JPblVua25vd25FbGVtZW50c09wdGlvbjogYm9vbGVhbnx1bmRlZmluZWQ7XG5cbiAgLyoqXG4gICAqIFwiRXJyb3Igb24gdW5rbm93biBwcm9wZXJ0aWVzXCIgb3B0aW9uIHRoYXQgaGFzIGJlZW4gY29uZmlndXJlZCBhdCB0aGUgYFRlc3RCZWRgIGluc3RhbmNlIGxldmVsLlxuICAgKiBUaGlzIG9wdGlvbiB0YWtlcyBwcmVjZWRlbmNlIG92ZXIgdGhlIGVudmlyb25tZW50LWxldmVsIG9uZS5cbiAgICovXG4gIHByaXZhdGUgX2luc3RhbmNlRXJyb3JPblVua25vd25Qcm9wZXJ0aWVzT3B0aW9uOiBib29sZWFufHVuZGVmaW5lZDtcblxuICAvKipcbiAgICogU3RvcmVzIHRoZSBwcmV2aW91cyBcIkVycm9yIG9uIHVua25vd24gZWxlbWVudHNcIiBvcHRpb24gdmFsdWUsXG4gICAqIGFsbG93aW5nIHRvIHJlc3RvcmUgaXQgaW4gdGhlIHJlc2V0IHRlc3RpbmcgbW9kdWxlIGxvZ2ljLlxuICAgKi9cbiAgcHJpdmF0ZSBfcHJldmlvdXNFcnJvck9uVW5rbm93bkVsZW1lbnRzT3B0aW9uOiBib29sZWFufHVuZGVmaW5lZDtcblxuICAvKipcbiAgICogU3RvcmVzIHRoZSBwcmV2aW91cyBcIkVycm9yIG9uIHVua25vd24gcHJvcGVydGllc1wiIG9wdGlvbiB2YWx1ZSxcbiAgICogYWxsb3dpbmcgdG8gcmVzdG9yZSBpdCBpbiB0aGUgcmVzZXQgdGVzdGluZyBtb2R1bGUgbG9naWMuXG4gICAqL1xuICBwcml2YXRlIF9wcmV2aW91c0Vycm9yT25Vbmtub3duUHJvcGVydGllc09wdGlvbjogYm9vbGVhbnx1bmRlZmluZWQ7XG5cbiAgLyoqXG4gICAqIEluaXRpYWxpemUgdGhlIGVudmlyb25tZW50IGZvciB0ZXN0aW5nIHdpdGggYSBjb21waWxlciBmYWN0b3J5LCBhIFBsYXRmb3JtUmVmLCBhbmQgYW5cbiAgICogYW5ndWxhciBtb2R1bGUuIFRoZXNlIGFyZSBjb21tb24gdG8gZXZlcnkgdGVzdCBpbiB0aGUgc3VpdGUuXG4gICAqXG4gICAqIFRoaXMgbWF5IG9ubHkgYmUgY2FsbGVkIG9uY2UsIHRvIHNldCB1cCB0aGUgY29tbW9uIHByb3ZpZGVycyBmb3IgdGhlIGN1cnJlbnQgdGVzdFxuICAgKiBzdWl0ZSBvbiB0aGUgY3VycmVudCBwbGF0Zm9ybS4gSWYgeW91IGFic29sdXRlbHkgbmVlZCB0byBjaGFuZ2UgdGhlIHByb3ZpZGVycyxcbiAgICogZmlyc3QgdXNlIGByZXNldFRlc3RFbnZpcm9ubWVudGAuXG4gICAqXG4gICAqIFRlc3QgbW9kdWxlcyBhbmQgcGxhdGZvcm1zIGZvciBpbmRpdmlkdWFsIHBsYXRmb3JtcyBhcmUgYXZhaWxhYmxlIGZyb21cbiAgICogJ0Bhbmd1bGFyLzxwbGF0Zm9ybV9uYW1lPi90ZXN0aW5nJy5cbiAgICpcbiAgICogQHB1YmxpY0FwaVxuICAgKi9cbiAgc3RhdGljIGluaXRUZXN0RW52aXJvbm1lbnQoXG4gICAgICBuZ01vZHVsZTogVHlwZTxhbnk+fFR5cGU8YW55PltdLCBwbGF0Zm9ybTogUGxhdGZvcm1SZWYsXG4gICAgICBvcHRpb25zPzogVGVzdEVudmlyb25tZW50T3B0aW9ucyk6IFRlc3RCZWQge1xuICAgIGNvbnN0IHRlc3RCZWQgPSBUZXN0QmVkSW1wbC5JTlNUQU5DRTtcbiAgICB0ZXN0QmVkLmluaXRUZXN0RW52aXJvbm1lbnQobmdNb2R1bGUsIHBsYXRmb3JtLCBvcHRpb25zKTtcbiAgICByZXR1cm4gdGVzdEJlZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXNldCB0aGUgcHJvdmlkZXJzIGZvciB0aGUgdGVzdCBpbmplY3Rvci5cbiAgICpcbiAgICogQHB1YmxpY0FwaVxuICAgKi9cbiAgc3RhdGljIHJlc2V0VGVzdEVudmlyb25tZW50KCk6IHZvaWQge1xuICAgIFRlc3RCZWRJbXBsLklOU1RBTkNFLnJlc2V0VGVzdEVudmlyb25tZW50KCk7XG4gIH1cblxuICBzdGF0aWMgY29uZmlndXJlQ29tcGlsZXIoY29uZmlnOiB7cHJvdmlkZXJzPzogYW55W107IHVzZUppdD86IGJvb2xlYW47fSk6IFRlc3RCZWQge1xuICAgIHJldHVybiBUZXN0QmVkSW1wbC5JTlNUQU5DRS5jb25maWd1cmVDb21waWxlcihjb25maWcpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFsbG93cyBvdmVycmlkaW5nIGRlZmF1bHQgcHJvdmlkZXJzLCBkaXJlY3RpdmVzLCBwaXBlcywgbW9kdWxlcyBvZiB0aGUgdGVzdCBpbmplY3RvcixcbiAgICogd2hpY2ggYXJlIGRlZmluZWQgaW4gdGVzdF9pbmplY3Rvci5qc1xuICAgKi9cbiAgc3RhdGljIGNvbmZpZ3VyZVRlc3RpbmdNb2R1bGUobW9kdWxlRGVmOiBUZXN0TW9kdWxlTWV0YWRhdGEpOiBUZXN0QmVkIHtcbiAgICByZXR1cm4gVGVzdEJlZEltcGwuSU5TVEFOQ0UuY29uZmlndXJlVGVzdGluZ01vZHVsZShtb2R1bGVEZWYpO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbXBpbGUgY29tcG9uZW50cyB3aXRoIGEgYHRlbXBsYXRlVXJsYCBmb3IgdGhlIHRlc3QncyBOZ01vZHVsZS5cbiAgICogSXQgaXMgbmVjZXNzYXJ5IHRvIGNhbGwgdGhpcyBmdW5jdGlvblxuICAgKiBhcyBmZXRjaGluZyB1cmxzIGlzIGFzeW5jaHJvbm91cy5cbiAgICovXG4gIHN0YXRpYyBjb21waWxlQ29tcG9uZW50cygpOiBQcm9taXNlPGFueT4ge1xuICAgIHJldHVybiBUZXN0QmVkSW1wbC5JTlNUQU5DRS5jb21waWxlQ29tcG9uZW50cygpO1xuICB9XG5cbiAgc3RhdGljIG92ZXJyaWRlTW9kdWxlKG5nTW9kdWxlOiBUeXBlPGFueT4sIG92ZXJyaWRlOiBNZXRhZGF0YU92ZXJyaWRlPE5nTW9kdWxlPik6IFRlc3RCZWQge1xuICAgIHJldHVybiBUZXN0QmVkSW1wbC5JTlNUQU5DRS5vdmVycmlkZU1vZHVsZShuZ01vZHVsZSwgb3ZlcnJpZGUpO1xuICB9XG5cbiAgc3RhdGljIG92ZXJyaWRlQ29tcG9uZW50KGNvbXBvbmVudDogVHlwZTxhbnk+LCBvdmVycmlkZTogTWV0YWRhdGFPdmVycmlkZTxDb21wb25lbnQ+KTogVGVzdEJlZCB7XG4gICAgcmV0dXJuIFRlc3RCZWRJbXBsLklOU1RBTkNFLm92ZXJyaWRlQ29tcG9uZW50KGNvbXBvbmVudCwgb3ZlcnJpZGUpO1xuICB9XG5cbiAgc3RhdGljIG92ZXJyaWRlRGlyZWN0aXZlKGRpcmVjdGl2ZTogVHlwZTxhbnk+LCBvdmVycmlkZTogTWV0YWRhdGFPdmVycmlkZTxEaXJlY3RpdmU+KTogVGVzdEJlZCB7XG4gICAgcmV0dXJuIFRlc3RCZWRJbXBsLklOU1RBTkNFLm92ZXJyaWRlRGlyZWN0aXZlKGRpcmVjdGl2ZSwgb3ZlcnJpZGUpO1xuICB9XG5cbiAgc3RhdGljIG92ZXJyaWRlUGlwZShwaXBlOiBUeXBlPGFueT4sIG92ZXJyaWRlOiBNZXRhZGF0YU92ZXJyaWRlPFBpcGU+KTogVGVzdEJlZCB7XG4gICAgcmV0dXJuIFRlc3RCZWRJbXBsLklOU1RBTkNFLm92ZXJyaWRlUGlwZShwaXBlLCBvdmVycmlkZSk7XG4gIH1cblxuICBzdGF0aWMgb3ZlcnJpZGVUZW1wbGF0ZShjb21wb25lbnQ6IFR5cGU8YW55PiwgdGVtcGxhdGU6IHN0cmluZyk6IFRlc3RCZWQge1xuICAgIHJldHVybiBUZXN0QmVkSW1wbC5JTlNUQU5DRS5vdmVycmlkZVRlbXBsYXRlKGNvbXBvbmVudCwgdGVtcGxhdGUpO1xuICB9XG5cbiAgLyoqXG4gICAqIE92ZXJyaWRlcyB0aGUgdGVtcGxhdGUgb2YgdGhlIGdpdmVuIGNvbXBvbmVudCwgY29tcGlsaW5nIHRoZSB0ZW1wbGF0ZVxuICAgKiBpbiB0aGUgY29udGV4dCBvZiB0aGUgVGVzdGluZ01vZHVsZS5cbiAgICpcbiAgICogTm90ZTogVGhpcyB3b3JrcyBmb3IgSklUIGFuZCBBT1RlZCBjb21wb25lbnRzIGFzIHdlbGwuXG4gICAqL1xuICBzdGF0aWMgb3ZlcnJpZGVUZW1wbGF0ZVVzaW5nVGVzdGluZ01vZHVsZShjb21wb25lbnQ6IFR5cGU8YW55PiwgdGVtcGxhdGU6IHN0cmluZyk6IFRlc3RCZWQge1xuICAgIHJldHVybiBUZXN0QmVkSW1wbC5JTlNUQU5DRS5vdmVycmlkZVRlbXBsYXRlVXNpbmdUZXN0aW5nTW9kdWxlKGNvbXBvbmVudCwgdGVtcGxhdGUpO1xuICB9XG5cbiAgc3RhdGljIG92ZXJyaWRlUHJvdmlkZXIodG9rZW46IGFueSwgcHJvdmlkZXI6IHtcbiAgICB1c2VGYWN0b3J5OiBGdW5jdGlvbixcbiAgICBkZXBzOiBhbnlbXSxcbiAgfSk6IFRlc3RCZWQ7XG4gIHN0YXRpYyBvdmVycmlkZVByb3ZpZGVyKHRva2VuOiBhbnksIHByb3ZpZGVyOiB7dXNlVmFsdWU6IGFueTt9KTogVGVzdEJlZDtcbiAgc3RhdGljIG92ZXJyaWRlUHJvdmlkZXIodG9rZW46IGFueSwgcHJvdmlkZXI6IHtcbiAgICB1c2VGYWN0b3J5PzogRnVuY3Rpb24sXG4gICAgdXNlVmFsdWU/OiBhbnksXG4gICAgZGVwcz86IGFueVtdLFxuICB9KTogVGVzdEJlZCB7XG4gICAgcmV0dXJuIFRlc3RCZWRJbXBsLklOU1RBTkNFLm92ZXJyaWRlUHJvdmlkZXIodG9rZW4sIHByb3ZpZGVyKTtcbiAgfVxuXG4gIHN0YXRpYyBpbmplY3Q8VD4odG9rZW46IFByb3ZpZGVyVG9rZW48VD4sIG5vdEZvdW5kVmFsdWU6IHVuZGVmaW5lZCwgb3B0aW9uczogSW5qZWN0T3B0aW9ucyZ7XG4gICAgb3B0aW9uYWw/OiBmYWxzZVxuICB9KTogVDtcbiAgc3RhdGljIGluamVjdDxUPih0b2tlbjogUHJvdmlkZXJUb2tlbjxUPiwgbm90Rm91bmRWYWx1ZTogbnVsbHx1bmRlZmluZWQsIG9wdGlvbnM6IEluamVjdE9wdGlvbnMpOlxuICAgICAgVHxudWxsO1xuICBzdGF0aWMgaW5qZWN0PFQ+KHRva2VuOiBQcm92aWRlclRva2VuPFQ+LCBub3RGb3VuZFZhbHVlPzogVCwgb3B0aW9ucz86IEluamVjdE9wdGlvbnMpOiBUO1xuICAvKiogQGRlcHJlY2F0ZWQgdXNlIG9iamVjdC1iYXNlZCBmbGFncyAoYEluamVjdE9wdGlvbnNgKSBpbnN0ZWFkLiAqL1xuICBzdGF0aWMgaW5qZWN0PFQ+KHRva2VuOiBQcm92aWRlclRva2VuPFQ+LCBub3RGb3VuZFZhbHVlPzogVCwgZmxhZ3M/OiBJbmplY3RGbGFncyk6IFQ7XG4gIC8qKiBAZGVwcmVjYXRlZCB1c2Ugb2JqZWN0LWJhc2VkIGZsYWdzIChgSW5qZWN0T3B0aW9uc2ApIGluc3RlYWQuICovXG4gIHN0YXRpYyBpbmplY3Q8VD4odG9rZW46IFByb3ZpZGVyVG9rZW48VD4sIG5vdEZvdW5kVmFsdWU6IG51bGwsIGZsYWdzPzogSW5qZWN0RmxhZ3MpOiBUfG51bGw7XG4gIHN0YXRpYyBpbmplY3Q8VD4oXG4gICAgICB0b2tlbjogUHJvdmlkZXJUb2tlbjxUPiwgbm90Rm91bmRWYWx1ZT86IFR8bnVsbCwgZmxhZ3M/OiBJbmplY3RGbGFnc3xJbmplY3RPcHRpb25zKTogVHxudWxsIHtcbiAgICByZXR1cm4gVGVzdEJlZEltcGwuSU5TVEFOQ0UuaW5qZWN0KHRva2VuLCBub3RGb3VuZFZhbHVlLCBjb252ZXJ0VG9CaXRGbGFncyhmbGFncykpO1xuICB9XG5cbiAgLyoqIEBkZXByZWNhdGVkIGZyb20gdjkuMC4wIHVzZSBUZXN0QmVkLmluamVjdCAqL1xuICBzdGF0aWMgZ2V0PFQ+KHRva2VuOiBQcm92aWRlclRva2VuPFQ+LCBub3RGb3VuZFZhbHVlPzogVCwgZmxhZ3M/OiBJbmplY3RGbGFncyk6IGFueTtcbiAgLyoqIEBkZXByZWNhdGVkIGZyb20gdjkuMC4wIHVzZSBUZXN0QmVkLmluamVjdCAqL1xuICBzdGF0aWMgZ2V0KHRva2VuOiBhbnksIG5vdEZvdW5kVmFsdWU/OiBhbnkpOiBhbnk7XG4gIC8qKiBAZGVwcmVjYXRlZCBmcm9tIHY5LjAuMCB1c2UgVGVzdEJlZC5pbmplY3QgKi9cbiAgc3RhdGljIGdldChcbiAgICAgIHRva2VuOiBhbnksIG5vdEZvdW5kVmFsdWU6IGFueSA9IEluamVjdG9yLlRIUk9XX0lGX05PVF9GT1VORCxcbiAgICAgIGZsYWdzOiBJbmplY3RGbGFncyA9IEluamVjdEZsYWdzLkRlZmF1bHQpOiBhbnkge1xuICAgIHJldHVybiBUZXN0QmVkSW1wbC5JTlNUQU5DRS5pbmplY3QodG9rZW4sIG5vdEZvdW5kVmFsdWUsIGZsYWdzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSdW5zIHRoZSBnaXZlbiBmdW5jdGlvbiBpbiB0aGUgYEVudmlyb25tZW50SW5qZWN0b3JgIGNvbnRleHQgb2YgYFRlc3RCZWRgLlxuICAgKlxuICAgKiBAc2VlIEVudmlyb25tZW50SW5qZWN0b3IjcnVuSW5Db250ZXh0XG4gICAqL1xuICBzdGF0aWMgcnVuSW5JbmplY3Rpb25Db250ZXh0PFQ+KGZuOiAoKSA9PiBUKTogVCB7XG4gICAgcmV0dXJuIFRlc3RCZWRJbXBsLklOU1RBTkNFLnJ1bkluSW5qZWN0aW9uQ29udGV4dChmbik7XG4gIH1cblxuICBzdGF0aWMgY3JlYXRlQ29tcG9uZW50PFQ+KGNvbXBvbmVudDogVHlwZTxUPik6IENvbXBvbmVudEZpeHR1cmU8VD4ge1xuICAgIHJldHVybiBUZXN0QmVkSW1wbC5JTlNUQU5DRS5jcmVhdGVDb21wb25lbnQoY29tcG9uZW50KTtcbiAgfVxuXG4gIHN0YXRpYyByZXNldFRlc3RpbmdNb2R1bGUoKTogVGVzdEJlZCB7XG4gICAgcmV0dXJuIFRlc3RCZWRJbXBsLklOU1RBTkNFLnJlc2V0VGVzdGluZ01vZHVsZSgpO1xuICB9XG5cbiAgc3RhdGljIGV4ZWN1dGUodG9rZW5zOiBhbnlbXSwgZm46IEZ1bmN0aW9uLCBjb250ZXh0PzogYW55KTogYW55IHtcbiAgICByZXR1cm4gVGVzdEJlZEltcGwuSU5TVEFOQ0UuZXhlY3V0ZSh0b2tlbnMsIGZuLCBjb250ZXh0KTtcbiAgfVxuXG4gIHN0YXRpYyBnZXQgcGxhdGZvcm0oKTogUGxhdGZvcm1SZWYge1xuICAgIHJldHVybiBUZXN0QmVkSW1wbC5JTlNUQU5DRS5wbGF0Zm9ybTtcbiAgfVxuXG4gIHN0YXRpYyBnZXQgbmdNb2R1bGUoKTogVHlwZTxhbnk+fFR5cGU8YW55PltdIHtcbiAgICByZXR1cm4gVGVzdEJlZEltcGwuSU5TVEFOQ0UubmdNb2R1bGU7XG4gIH1cblxuICAvLyBQcm9wZXJ0aWVzXG5cbiAgcGxhdGZvcm06IFBsYXRmb3JtUmVmID0gbnVsbCE7XG4gIG5nTW9kdWxlOiBUeXBlPGFueT58VHlwZTxhbnk+W10gPSBudWxsITtcblxuICBwcml2YXRlIF9jb21waWxlcjogVGVzdEJlZENvbXBpbGVyfG51bGwgPSBudWxsO1xuICBwcml2YXRlIF90ZXN0TW9kdWxlUmVmOiBOZ01vZHVsZVJlZjxhbnk+fG51bGwgPSBudWxsO1xuXG4gIHByaXZhdGUgX2FjdGl2ZUZpeHR1cmVzOiBDb21wb25lbnRGaXh0dXJlPGFueT5bXSA9IFtdO1xuXG4gIC8qKlxuICAgKiBJbnRlcm5hbC1vbmx5IGZsYWcgdG8gaW5kaWNhdGUgd2hldGhlciBhIG1vZHVsZVxuICAgKiBzY29waW5nIHF1ZXVlIGhhcyBiZWVuIGNoZWNrZWQgYW5kIGZsdXNoZWQgYWxyZWFkeS5cbiAgICogQG5vZG9jXG4gICAqL1xuICBnbG9iYWxDb21waWxhdGlvbkNoZWNrZWQgPSBmYWxzZTtcblxuICAvKipcbiAgICogSW5pdGlhbGl6ZSB0aGUgZW52aXJvbm1lbnQgZm9yIHRlc3Rpbmcgd2l0aCBhIGNvbXBpbGVyIGZhY3RvcnksIGEgUGxhdGZvcm1SZWYsIGFuZCBhblxuICAgKiBhbmd1bGFyIG1vZHVsZS4gVGhlc2UgYXJlIGNvbW1vbiB0byBldmVyeSB0ZXN0IGluIHRoZSBzdWl0ZS5cbiAgICpcbiAgICogVGhpcyBtYXkgb25seSBiZSBjYWxsZWQgb25jZSwgdG8gc2V0IHVwIHRoZSBjb21tb24gcHJvdmlkZXJzIGZvciB0aGUgY3VycmVudCB0ZXN0XG4gICAqIHN1aXRlIG9uIHRoZSBjdXJyZW50IHBsYXRmb3JtLiBJZiB5b3UgYWJzb2x1dGVseSBuZWVkIHRvIGNoYW5nZSB0aGUgcHJvdmlkZXJzLFxuICAgKiBmaXJzdCB1c2UgYHJlc2V0VGVzdEVudmlyb25tZW50YC5cbiAgICpcbiAgICogVGVzdCBtb2R1bGVzIGFuZCBwbGF0Zm9ybXMgZm9yIGluZGl2aWR1YWwgcGxhdGZvcm1zIGFyZSBhdmFpbGFibGUgZnJvbVxuICAgKiAnQGFuZ3VsYXIvPHBsYXRmb3JtX25hbWU+L3Rlc3RpbmcnLlxuICAgKlxuICAgKiBAcHVibGljQXBpXG4gICAqL1xuICBpbml0VGVzdEVudmlyb25tZW50KFxuICAgICAgbmdNb2R1bGU6IFR5cGU8YW55PnxUeXBlPGFueT5bXSwgcGxhdGZvcm06IFBsYXRmb3JtUmVmLFxuICAgICAgb3B0aW9ucz86IFRlc3RFbnZpcm9ubWVudE9wdGlvbnMpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5wbGF0Zm9ybSB8fCB0aGlzLm5nTW9kdWxlKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0Nhbm5vdCBzZXQgYmFzZSBwcm92aWRlcnMgYmVjYXVzZSBpdCBoYXMgYWxyZWFkeSBiZWVuIGNhbGxlZCcpO1xuICAgIH1cblxuICAgIFRlc3RCZWRJbXBsLl9lbnZpcm9ubWVudFRlYXJkb3duT3B0aW9ucyA9IG9wdGlvbnM/LnRlYXJkb3duO1xuXG4gICAgVGVzdEJlZEltcGwuX2Vudmlyb25tZW50RXJyb3JPblVua25vd25FbGVtZW50c09wdGlvbiA9IG9wdGlvbnM/LmVycm9yT25Vbmtub3duRWxlbWVudHM7XG5cbiAgICBUZXN0QmVkSW1wbC5fZW52aXJvbm1lbnRFcnJvck9uVW5rbm93blByb3BlcnRpZXNPcHRpb24gPSBvcHRpb25zPy5lcnJvck9uVW5rbm93blByb3BlcnRpZXM7XG5cbiAgICB0aGlzLnBsYXRmb3JtID0gcGxhdGZvcm07XG4gICAgdGhpcy5uZ01vZHVsZSA9IG5nTW9kdWxlO1xuICAgIHRoaXMuX2NvbXBpbGVyID0gbmV3IFRlc3RCZWRDb21waWxlcih0aGlzLnBsYXRmb3JtLCB0aGlzLm5nTW9kdWxlKTtcblxuICAgIC8vIFRlc3RCZWQgZG9lcyBub3QgaGF2ZSBhbiBBUEkgd2hpY2ggY2FuIHJlbGlhYmx5IGRldGVjdCB0aGUgc3RhcnQgb2YgYSB0ZXN0LCBhbmQgdGh1cyBjb3VsZCBiZVxuICAgIC8vIHVzZWQgdG8gdHJhY2sgdGhlIHN0YXRlIG9mIHRoZSBOZ01vZHVsZSByZWdpc3RyeSBhbmQgcmVzZXQgaXQgY29ycmVjdGx5LiBJbnN0ZWFkLCB3aGVuIHdlXG4gICAgLy8ga25vdyB3ZSdyZSBpbiBhIHRlc3Rpbmcgc2NlbmFyaW8sIHdlIGRpc2FibGUgdGhlIGNoZWNrIGZvciBkdXBsaWNhdGUgTmdNb2R1bGUgcmVnaXN0cmF0aW9uXG4gICAgLy8gY29tcGxldGVseS5cbiAgICBzZXRBbGxvd0R1cGxpY2F0ZU5nTW9kdWxlSWRzRm9yVGVzdCh0cnVlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXNldCB0aGUgcHJvdmlkZXJzIGZvciB0aGUgdGVzdCBpbmplY3Rvci5cbiAgICpcbiAgICogQHB1YmxpY0FwaVxuICAgKi9cbiAgcmVzZXRUZXN0RW52aXJvbm1lbnQoKTogdm9pZCB7XG4gICAgdGhpcy5yZXNldFRlc3RpbmdNb2R1bGUoKTtcbiAgICB0aGlzLl9jb21waWxlciA9IG51bGw7XG4gICAgdGhpcy5wbGF0Zm9ybSA9IG51bGwhO1xuICAgIHRoaXMubmdNb2R1bGUgPSBudWxsITtcbiAgICBUZXN0QmVkSW1wbC5fZW52aXJvbm1lbnRUZWFyZG93bk9wdGlvbnMgPSB1bmRlZmluZWQ7XG4gICAgc2V0QWxsb3dEdXBsaWNhdGVOZ01vZHVsZUlkc0ZvclRlc3QoZmFsc2UpO1xuICB9XG5cbiAgcmVzZXRUZXN0aW5nTW9kdWxlKCk6IHRoaXMge1xuICAgIHRoaXMuY2hlY2tHbG9iYWxDb21waWxhdGlvbkZpbmlzaGVkKCk7XG4gICAgcmVzZXRDb21waWxlZENvbXBvbmVudHMoKTtcbiAgICBpZiAodGhpcy5fY29tcGlsZXIgIT09IG51bGwpIHtcbiAgICAgIHRoaXMuY29tcGlsZXIucmVzdG9yZU9yaWdpbmFsU3RhdGUoKTtcbiAgICB9XG4gICAgdGhpcy5fY29tcGlsZXIgPSBuZXcgVGVzdEJlZENvbXBpbGVyKHRoaXMucGxhdGZvcm0sIHRoaXMubmdNb2R1bGUpO1xuICAgIC8vIFJlc3RvcmUgdGhlIHByZXZpb3VzIHZhbHVlIG9mIHRoZSBcImVycm9yIG9uIHVua25vd24gZWxlbWVudHNcIiBvcHRpb25cbiAgICBzZXRVbmtub3duRWxlbWVudFN0cmljdE1vZGUoXG4gICAgICAgIHRoaXMuX3ByZXZpb3VzRXJyb3JPblVua25vd25FbGVtZW50c09wdGlvbiA/PyBUSFJPV19PTl9VTktOT1dOX0VMRU1FTlRTX0RFRkFVTFQpO1xuICAgIC8vIFJlc3RvcmUgdGhlIHByZXZpb3VzIHZhbHVlIG9mIHRoZSBcImVycm9yIG9uIHVua25vd24gcHJvcGVydGllc1wiIG9wdGlvblxuICAgIHNldFVua25vd25Qcm9wZXJ0eVN0cmljdE1vZGUoXG4gICAgICAgIHRoaXMuX3ByZXZpb3VzRXJyb3JPblVua25vd25Qcm9wZXJ0aWVzT3B0aW9uID8/IFRIUk9XX09OX1VOS05PV05fUFJPUEVSVElFU19ERUZBVUxUKTtcblxuICAgIC8vIFdlIGhhdmUgdG8gY2hhaW4gYSBjb3VwbGUgb2YgdHJ5L2ZpbmFsbHkgYmxvY2tzLCBiZWNhdXNlIGVhY2ggc3RlcCBjYW5cbiAgICAvLyB0aHJvdyBlcnJvcnMgYW5kIHdlIGRvbid0IHdhbnQgaXQgdG8gaW50ZXJydXB0IHRoZSBuZXh0IHN0ZXAgYW5kIHdlIGFsc29cbiAgICAvLyB3YW50IGFuIGVycm9yIHRvIGJlIHRocm93biBhdCB0aGUgZW5kLlxuICAgIHRyeSB7XG4gICAgICB0aGlzLmRlc3Ryb3lBY3RpdmVGaXh0dXJlcygpO1xuICAgIH0gZmluYWxseSB7XG4gICAgICB0cnkge1xuICAgICAgICBpZiAodGhpcy5zaG91bGRUZWFyRG93blRlc3RpbmdNb2R1bGUoKSkge1xuICAgICAgICAgIHRoaXMudGVhckRvd25UZXN0aW5nTW9kdWxlKCk7XG4gICAgICAgIH1cbiAgICAgIH0gZmluYWxseSB7XG4gICAgICAgIHRoaXMuX3Rlc3RNb2R1bGVSZWYgPSBudWxsO1xuICAgICAgICB0aGlzLl9pbnN0YW5jZVRlYXJkb3duT3B0aW9ucyA9IHVuZGVmaW5lZDtcbiAgICAgICAgdGhpcy5faW5zdGFuY2VFcnJvck9uVW5rbm93bkVsZW1lbnRzT3B0aW9uID0gdW5kZWZpbmVkO1xuICAgICAgICB0aGlzLl9pbnN0YW5jZUVycm9yT25Vbmtub3duUHJvcGVydGllc09wdGlvbiA9IHVuZGVmaW5lZDtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBjb25maWd1cmVDb21waWxlcihjb25maWc6IHtwcm92aWRlcnM/OiBhbnlbXTsgdXNlSml0PzogYm9vbGVhbjt9KTogdGhpcyB7XG4gICAgaWYgKGNvbmZpZy51c2VKaXQgIT0gbnVsbCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCd0aGUgUmVuZGVyMyBjb21waWxlciBKaVQgbW9kZSBpcyBub3QgY29uZmlndXJhYmxlICEnKTtcbiAgICB9XG5cbiAgICBpZiAoY29uZmlnLnByb3ZpZGVycyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzLmNvbXBpbGVyLnNldENvbXBpbGVyUHJvdmlkZXJzKGNvbmZpZy5wcm92aWRlcnMpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIGNvbmZpZ3VyZVRlc3RpbmdNb2R1bGUobW9kdWxlRGVmOiBUZXN0TW9kdWxlTWV0YWRhdGEpOiB0aGlzIHtcbiAgICB0aGlzLmFzc2VydE5vdEluc3RhbnRpYXRlZCgnUjNUZXN0QmVkLmNvbmZpZ3VyZVRlc3RpbmdNb2R1bGUnLCAnY29uZmlndXJlIHRoZSB0ZXN0IG1vZHVsZScpO1xuXG4gICAgLy8gVHJpZ2dlciBtb2R1bGUgc2NvcGluZyBxdWV1ZSBmbHVzaCBiZWZvcmUgZXhlY3V0aW5nIG90aGVyIFRlc3RCZWQgb3BlcmF0aW9ucyBpbiBhIHRlc3QuXG4gICAgLy8gVGhpcyBpcyBuZWVkZWQgZm9yIHRoZSBmaXJzdCB0ZXN0IGludm9jYXRpb24gdG8gZW5zdXJlIHRoYXQgZ2xvYmFsbHkgZGVjbGFyZWQgbW9kdWxlcyBoYXZlXG4gICAgLy8gdGhlaXIgY29tcG9uZW50cyBzY29wZWQgcHJvcGVybHkuIFNlZSB0aGUgYGNoZWNrR2xvYmFsQ29tcGlsYXRpb25GaW5pc2hlZGAgZnVuY3Rpb25cbiAgICAvLyBkZXNjcmlwdGlvbiBmb3IgYWRkaXRpb25hbCBpbmZvLlxuICAgIHRoaXMuY2hlY2tHbG9iYWxDb21waWxhdGlvbkZpbmlzaGVkKCk7XG5cbiAgICAvLyBBbHdheXMgcmUtYXNzaWduIHRoZSBvcHRpb25zLCBldmVuIGlmIHRoZXkncmUgdW5kZWZpbmVkLlxuICAgIC8vIFRoaXMgZW5zdXJlcyB0aGF0IHdlIGRvbid0IGNhcnJ5IHRoZW0gYmV0d2VlbiB0ZXN0cy5cbiAgICB0aGlzLl9pbnN0YW5jZVRlYXJkb3duT3B0aW9ucyA9IG1vZHVsZURlZi50ZWFyZG93bjtcbiAgICB0aGlzLl9pbnN0YW5jZUVycm9yT25Vbmtub3duRWxlbWVudHNPcHRpb24gPSBtb2R1bGVEZWYuZXJyb3JPblVua25vd25FbGVtZW50cztcbiAgICB0aGlzLl9pbnN0YW5jZUVycm9yT25Vbmtub3duUHJvcGVydGllc09wdGlvbiA9IG1vZHVsZURlZi5lcnJvck9uVW5rbm93blByb3BlcnRpZXM7XG4gICAgLy8gU3RvcmUgdGhlIGN1cnJlbnQgdmFsdWUgb2YgdGhlIHN0cmljdCBtb2RlIG9wdGlvbixcbiAgICAvLyBzbyB3ZSBjYW4gcmVzdG9yZSBpdCBsYXRlclxuICAgIHRoaXMuX3ByZXZpb3VzRXJyb3JPblVua25vd25FbGVtZW50c09wdGlvbiA9IGdldFVua25vd25FbGVtZW50U3RyaWN0TW9kZSgpO1xuICAgIHNldFVua25vd25FbGVtZW50U3RyaWN0TW9kZSh0aGlzLnNob3VsZFRocm93RXJyb3JPblVua25vd25FbGVtZW50cygpKTtcbiAgICB0aGlzLl9wcmV2aW91c0Vycm9yT25Vbmtub3duUHJvcGVydGllc09wdGlvbiA9IGdldFVua25vd25Qcm9wZXJ0eVN0cmljdE1vZGUoKTtcbiAgICBzZXRVbmtub3duUHJvcGVydHlTdHJpY3RNb2RlKHRoaXMuc2hvdWxkVGhyb3dFcnJvck9uVW5rbm93blByb3BlcnRpZXMoKSk7XG4gICAgdGhpcy5jb21waWxlci5jb25maWd1cmVUZXN0aW5nTW9kdWxlKG1vZHVsZURlZik7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBjb21waWxlQ29tcG9uZW50cygpOiBQcm9taXNlPGFueT4ge1xuICAgIHJldHVybiB0aGlzLmNvbXBpbGVyLmNvbXBpbGVDb21wb25lbnRzKCk7XG4gIH1cblxuICBpbmplY3Q8VD4odG9rZW46IFByb3ZpZGVyVG9rZW48VD4sIG5vdEZvdW5kVmFsdWU6IHVuZGVmaW5lZCwgb3B0aW9uczogSW5qZWN0T3B0aW9ucyZ7XG4gICAgb3B0aW9uYWw6IHRydWVcbiAgfSk6IFR8bnVsbDtcbiAgaW5qZWN0PFQ+KHRva2VuOiBQcm92aWRlclRva2VuPFQ+LCBub3RGb3VuZFZhbHVlPzogVCwgb3B0aW9ucz86IEluamVjdE9wdGlvbnMpOiBUO1xuICBpbmplY3Q8VD4odG9rZW46IFByb3ZpZGVyVG9rZW48VD4sIG5vdEZvdW5kVmFsdWU6IG51bGwsIG9wdGlvbnM/OiBJbmplY3RPcHRpb25zKTogVHxudWxsO1xuICAvKiogQGRlcHJlY2F0ZWQgdXNlIG9iamVjdC1iYXNlZCBmbGFncyAoYEluamVjdE9wdGlvbnNgKSBpbnN0ZWFkLiAqL1xuICBpbmplY3Q8VD4odG9rZW46IFByb3ZpZGVyVG9rZW48VD4sIG5vdEZvdW5kVmFsdWU/OiBULCBmbGFncz86IEluamVjdEZsYWdzKTogVDtcbiAgLyoqIEBkZXByZWNhdGVkIHVzZSBvYmplY3QtYmFzZWQgZmxhZ3MgKGBJbmplY3RPcHRpb25zYCkgaW5zdGVhZC4gKi9cbiAgaW5qZWN0PFQ+KHRva2VuOiBQcm92aWRlclRva2VuPFQ+LCBub3RGb3VuZFZhbHVlOiBudWxsLCBmbGFncz86IEluamVjdEZsYWdzKTogVHxudWxsO1xuICBpbmplY3Q8VD4odG9rZW46IFByb3ZpZGVyVG9rZW48VD4sIG5vdEZvdW5kVmFsdWU/OiBUfG51bGwsIGZsYWdzPzogSW5qZWN0RmxhZ3N8SW5qZWN0T3B0aW9ucyk6IFRcbiAgICAgIHxudWxsIHtcbiAgICBpZiAodG9rZW4gYXMgdW5rbm93biA9PT0gVGVzdEJlZCkge1xuICAgICAgcmV0dXJuIHRoaXMgYXMgYW55O1xuICAgIH1cbiAgICBjb25zdCBVTkRFRklORUQgPSB7fSBhcyB1bmtub3duIGFzIFQ7XG4gICAgY29uc3QgcmVzdWx0ID0gdGhpcy50ZXN0TW9kdWxlUmVmLmluamVjdG9yLmdldCh0b2tlbiwgVU5ERUZJTkVELCBjb252ZXJ0VG9CaXRGbGFncyhmbGFncykpO1xuICAgIHJldHVybiByZXN1bHQgPT09IFVOREVGSU5FRCA/IHRoaXMuY29tcGlsZXIuaW5qZWN0b3IuZ2V0KHRva2VuLCBub3RGb3VuZFZhbHVlLCBmbGFncykgYXMgYW55IDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQ7XG4gIH1cblxuICAvKiogQGRlcHJlY2F0ZWQgZnJvbSB2OS4wLjAgdXNlIFRlc3RCZWQuaW5qZWN0ICovXG4gIGdldDxUPih0b2tlbjogUHJvdmlkZXJUb2tlbjxUPiwgbm90Rm91bmRWYWx1ZT86IFQsIGZsYWdzPzogSW5qZWN0RmxhZ3MpOiBhbnk7XG4gIC8qKiBAZGVwcmVjYXRlZCBmcm9tIHY5LjAuMCB1c2UgVGVzdEJlZC5pbmplY3QgKi9cbiAgZ2V0KHRva2VuOiBhbnksIG5vdEZvdW5kVmFsdWU/OiBhbnkpOiBhbnk7XG4gIC8qKiBAZGVwcmVjYXRlZCBmcm9tIHY5LjAuMCB1c2UgVGVzdEJlZC5pbmplY3QgKi9cbiAgZ2V0KHRva2VuOiBhbnksIG5vdEZvdW5kVmFsdWU6IGFueSA9IEluamVjdG9yLlRIUk9XX0lGX05PVF9GT1VORCxcbiAgICAgIGZsYWdzOiBJbmplY3RGbGFncyA9IEluamVjdEZsYWdzLkRlZmF1bHQpOiBhbnkge1xuICAgIHJldHVybiB0aGlzLmluamVjdCh0b2tlbiwgbm90Rm91bmRWYWx1ZSwgZmxhZ3MpO1xuICB9XG5cbiAgcnVuSW5JbmplY3Rpb25Db250ZXh0PFQ+KGZuOiAoKSA9PiBUKTogVCB7XG4gICAgcmV0dXJuIHRoaXMuaW5qZWN0KEVudmlyb25tZW50SW5qZWN0b3IpLnJ1bkluQ29udGV4dChmbik7XG4gIH1cblxuICBleGVjdXRlKHRva2VuczogYW55W10sIGZuOiBGdW5jdGlvbiwgY29udGV4dD86IGFueSk6IGFueSB7XG4gICAgY29uc3QgcGFyYW1zID0gdG9rZW5zLm1hcCh0ID0+IHRoaXMuaW5qZWN0KHQpKTtcbiAgICByZXR1cm4gZm4uYXBwbHkoY29udGV4dCwgcGFyYW1zKTtcbiAgfVxuXG4gIG92ZXJyaWRlTW9kdWxlKG5nTW9kdWxlOiBUeXBlPGFueT4sIG92ZXJyaWRlOiBNZXRhZGF0YU92ZXJyaWRlPE5nTW9kdWxlPik6IHRoaXMge1xuICAgIHRoaXMuYXNzZXJ0Tm90SW5zdGFudGlhdGVkKCdvdmVycmlkZU1vZHVsZScsICdvdmVycmlkZSBtb2R1bGUgbWV0YWRhdGEnKTtcbiAgICB0aGlzLmNvbXBpbGVyLm92ZXJyaWRlTW9kdWxlKG5nTW9kdWxlLCBvdmVycmlkZSk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBvdmVycmlkZUNvbXBvbmVudChjb21wb25lbnQ6IFR5cGU8YW55Piwgb3ZlcnJpZGU6IE1ldGFkYXRhT3ZlcnJpZGU8Q29tcG9uZW50Pik6IHRoaXMge1xuICAgIHRoaXMuYXNzZXJ0Tm90SW5zdGFudGlhdGVkKCdvdmVycmlkZUNvbXBvbmVudCcsICdvdmVycmlkZSBjb21wb25lbnQgbWV0YWRhdGEnKTtcbiAgICB0aGlzLmNvbXBpbGVyLm92ZXJyaWRlQ29tcG9uZW50KGNvbXBvbmVudCwgb3ZlcnJpZGUpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgb3ZlcnJpZGVUZW1wbGF0ZVVzaW5nVGVzdGluZ01vZHVsZShjb21wb25lbnQ6IFR5cGU8YW55PiwgdGVtcGxhdGU6IHN0cmluZyk6IHRoaXMge1xuICAgIHRoaXMuYXNzZXJ0Tm90SW5zdGFudGlhdGVkKFxuICAgICAgICAnUjNUZXN0QmVkLm92ZXJyaWRlVGVtcGxhdGVVc2luZ1Rlc3RpbmdNb2R1bGUnLFxuICAgICAgICAnQ2Fubm90IG92ZXJyaWRlIHRlbXBsYXRlIHdoZW4gdGhlIHRlc3QgbW9kdWxlIGhhcyBhbHJlYWR5IGJlZW4gaW5zdGFudGlhdGVkJyk7XG4gICAgdGhpcy5jb21waWxlci5vdmVycmlkZVRlbXBsYXRlVXNpbmdUZXN0aW5nTW9kdWxlKGNvbXBvbmVudCwgdGVtcGxhdGUpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgb3ZlcnJpZGVEaXJlY3RpdmUoZGlyZWN0aXZlOiBUeXBlPGFueT4sIG92ZXJyaWRlOiBNZXRhZGF0YU92ZXJyaWRlPERpcmVjdGl2ZT4pOiB0aGlzIHtcbiAgICB0aGlzLmFzc2VydE5vdEluc3RhbnRpYXRlZCgnb3ZlcnJpZGVEaXJlY3RpdmUnLCAnb3ZlcnJpZGUgZGlyZWN0aXZlIG1ldGFkYXRhJyk7XG4gICAgdGhpcy5jb21waWxlci5vdmVycmlkZURpcmVjdGl2ZShkaXJlY3RpdmUsIG92ZXJyaWRlKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIG92ZXJyaWRlUGlwZShwaXBlOiBUeXBlPGFueT4sIG92ZXJyaWRlOiBNZXRhZGF0YU92ZXJyaWRlPFBpcGU+KTogdGhpcyB7XG4gICAgdGhpcy5hc3NlcnROb3RJbnN0YW50aWF0ZWQoJ292ZXJyaWRlUGlwZScsICdvdmVycmlkZSBwaXBlIG1ldGFkYXRhJyk7XG4gICAgdGhpcy5jb21waWxlci5vdmVycmlkZVBpcGUocGlwZSwgb3ZlcnJpZGUpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIE92ZXJ3cml0ZXMgYWxsIHByb3ZpZGVycyBmb3IgdGhlIGdpdmVuIHRva2VuIHdpdGggdGhlIGdpdmVuIHByb3ZpZGVyIGRlZmluaXRpb24uXG4gICAqL1xuICBvdmVycmlkZVByb3ZpZGVyKHRva2VuOiBhbnksIHByb3ZpZGVyOiB7dXNlRmFjdG9yeT86IEZ1bmN0aW9uLCB1c2VWYWx1ZT86IGFueSwgZGVwcz86IGFueVtdfSk6XG4gICAgICB0aGlzIHtcbiAgICB0aGlzLmFzc2VydE5vdEluc3RhbnRpYXRlZCgnb3ZlcnJpZGVQcm92aWRlcicsICdvdmVycmlkZSBwcm92aWRlcicpO1xuICAgIHRoaXMuY29tcGlsZXIub3ZlcnJpZGVQcm92aWRlcih0b2tlbiwgcHJvdmlkZXIpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgb3ZlcnJpZGVUZW1wbGF0ZShjb21wb25lbnQ6IFR5cGU8YW55PiwgdGVtcGxhdGU6IHN0cmluZyk6IFRlc3RCZWQge1xuICAgIHJldHVybiB0aGlzLm92ZXJyaWRlQ29tcG9uZW50KGNvbXBvbmVudCwge3NldDoge3RlbXBsYXRlLCB0ZW1wbGF0ZVVybDogbnVsbCF9fSk7XG4gIH1cblxuICBjcmVhdGVDb21wb25lbnQ8VD4odHlwZTogVHlwZTxUPik6IENvbXBvbmVudEZpeHR1cmU8VD4ge1xuICAgIGNvbnN0IHRlc3RDb21wb25lbnRSZW5kZXJlciA9IHRoaXMuaW5qZWN0KFRlc3RDb21wb25lbnRSZW5kZXJlcik7XG4gICAgY29uc3Qgcm9vdEVsSWQgPSBgcm9vdCR7X25leHRSb290RWxlbWVudElkKyt9YDtcbiAgICB0ZXN0Q29tcG9uZW50UmVuZGVyZXIuaW5zZXJ0Um9vdEVsZW1lbnQocm9vdEVsSWQpO1xuXG4gICAgY29uc3QgY29tcG9uZW50RGVmID0gKHR5cGUgYXMgYW55KS7JtWNtcDtcblxuICAgIGlmICghY29tcG9uZW50RGVmKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYEl0IGxvb2tzIGxpa2UgJyR7c3RyaW5naWZ5KHR5cGUpfScgaGFzIG5vdCBiZWVuIGNvbXBpbGVkLmApO1xuICAgIH1cblxuICAgIC8vIFRPRE86IERvbid0IGNhc3QgYXMgYEluamVjdGlvblRva2VuPGJvb2xlYW4+YCwgcHJvcGVyIHR5cGUgaXMgYm9vbGVhbltdXG4gICAgY29uc3Qgbm9OZ1pvbmUgPSB0aGlzLmluamVjdChDb21wb25lbnRGaXh0dXJlTm9OZ1pvbmUgYXMgSW5qZWN0aW9uVG9rZW48Ym9vbGVhbj4sIGZhbHNlKTtcbiAgICAvLyBUT0RPOiBEb24ndCBjYXN0IGFzIGBJbmplY3Rpb25Ub2tlbjxib29sZWFuPmAsIHByb3BlciB0eXBlIGlzIGJvb2xlYW5bXVxuICAgIGNvbnN0IGF1dG9EZXRlY3Q6IGJvb2xlYW4gPVxuICAgICAgICB0aGlzLmluamVjdChDb21wb25lbnRGaXh0dXJlQXV0b0RldGVjdCBhcyBJbmplY3Rpb25Ub2tlbjxib29sZWFuPiwgZmFsc2UpO1xuICAgIGNvbnN0IG5nWm9uZTogTmdab25lfG51bGwgPSBub05nWm9uZSA/IG51bGwgOiB0aGlzLmluamVjdChOZ1pvbmUsIG51bGwpO1xuICAgIGNvbnN0IGNvbXBvbmVudEZhY3RvcnkgPSBuZXcgQ29tcG9uZW50RmFjdG9yeShjb21wb25lbnREZWYpO1xuICAgIGNvbnN0IGluaXRDb21wb25lbnQgPSAoKSA9PiB7XG4gICAgICBjb25zdCBjb21wb25lbnRSZWYgPVxuICAgICAgICAgIGNvbXBvbmVudEZhY3RvcnkuY3JlYXRlKEluamVjdG9yLk5VTEwsIFtdLCBgIyR7cm9vdEVsSWR9YCwgdGhpcy50ZXN0TW9kdWxlUmVmKTtcbiAgICAgIHJldHVybiBuZXcgQ29tcG9uZW50Rml4dHVyZTxhbnk+KGNvbXBvbmVudFJlZiwgbmdab25lLCBhdXRvRGV0ZWN0KTtcbiAgICB9O1xuICAgIGNvbnN0IGZpeHR1cmUgPSBuZ1pvbmUgPyBuZ1pvbmUucnVuKGluaXRDb21wb25lbnQpIDogaW5pdENvbXBvbmVudCgpO1xuICAgIHRoaXMuX2FjdGl2ZUZpeHR1cmVzLnB1c2goZml4dHVyZSk7XG4gICAgcmV0dXJuIGZpeHR1cmU7XG4gIH1cblxuICAvKipcbiAgICogQGludGVybmFsIHN0cmlwIHRoaXMgZnJvbSBwdWJsaXNoZWQgZC50cyBmaWxlcyBkdWUgdG9cbiAgICogaHR0cHM6Ly9naXRodWIuY29tL21pY3Jvc29mdC9UeXBlU2NyaXB0L2lzc3Vlcy8zNjIxNlxuICAgKi9cbiAgcHJpdmF0ZSBnZXQgY29tcGlsZXIoKTogVGVzdEJlZENvbXBpbGVyIHtcbiAgICBpZiAodGhpcy5fY29tcGlsZXIgPT09IG51bGwpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgTmVlZCB0byBjYWxsIFRlc3RCZWQuaW5pdFRlc3RFbnZpcm9ubWVudCgpIGZpcnN0YCk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLl9jb21waWxlcjtcbiAgfVxuXG4gIC8qKlxuICAgKiBAaW50ZXJuYWwgc3RyaXAgdGhpcyBmcm9tIHB1Ymxpc2hlZCBkLnRzIGZpbGVzIGR1ZSB0b1xuICAgKiBodHRwczovL2dpdGh1Yi5jb20vbWljcm9zb2Z0L1R5cGVTY3JpcHQvaXNzdWVzLzM2MjE2XG4gICAqL1xuICBwcml2YXRlIGdldCB0ZXN0TW9kdWxlUmVmKCk6IE5nTW9kdWxlUmVmPGFueT4ge1xuICAgIGlmICh0aGlzLl90ZXN0TW9kdWxlUmVmID09PSBudWxsKSB7XG4gICAgICB0aGlzLl90ZXN0TW9kdWxlUmVmID0gdGhpcy5jb21waWxlci5maW5hbGl6ZSgpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5fdGVzdE1vZHVsZVJlZjtcbiAgfVxuXG4gIHByaXZhdGUgYXNzZXJ0Tm90SW5zdGFudGlhdGVkKG1ldGhvZE5hbWU6IHN0cmluZywgbWV0aG9kRGVzY3JpcHRpb246IHN0cmluZykge1xuICAgIGlmICh0aGlzLl90ZXN0TW9kdWxlUmVmICE9PSBudWxsKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgYENhbm5vdCAke21ldGhvZERlc2NyaXB0aW9ufSB3aGVuIHRoZSB0ZXN0IG1vZHVsZSBoYXMgYWxyZWFkeSBiZWVuIGluc3RhbnRpYXRlZC4gYCArXG4gICAgICAgICAgYE1ha2Ugc3VyZSB5b3UgYXJlIG5vdCB1c2luZyBcXGBpbmplY3RcXGAgYmVmb3JlIFxcYCR7bWV0aG9kTmFtZX1cXGAuYCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrIHdoZXRoZXIgdGhlIG1vZHVsZSBzY29waW5nIHF1ZXVlIHNob3VsZCBiZSBmbHVzaGVkLCBhbmQgZmx1c2ggaXQgaWYgbmVlZGVkLlxuICAgKlxuICAgKiBXaGVuIHRoZSBUZXN0QmVkIGlzIHJlc2V0LCBpdCBjbGVhcnMgdGhlIEpJVCBtb2R1bGUgY29tcGlsYXRpb24gcXVldWUsIGNhbmNlbGxpbmcgYW55XG4gICAqIGluLXByb2dyZXNzIG1vZHVsZSBjb21waWxhdGlvbi4gVGhpcyBjcmVhdGVzIGEgcG90ZW50aWFsIGhhemFyZCAtIHRoZSB2ZXJ5IGZpcnN0IHRpbWUgdGhlXG4gICAqIFRlc3RCZWQgaXMgaW5pdGlhbGl6ZWQgKG9yIGlmIGl0J3MgcmVzZXQgd2l0aG91dCBiZWluZyBpbml0aWFsaXplZCksIHRoZXJlIG1heSBiZSBwZW5kaW5nXG4gICAqIGNvbXBpbGF0aW9ucyBvZiBtb2R1bGVzIGRlY2xhcmVkIGluIGdsb2JhbCBzY29wZS4gVGhlc2UgY29tcGlsYXRpb25zIHNob3VsZCBiZSBmaW5pc2hlZC5cbiAgICpcbiAgICogVG8gZW5zdXJlIHRoYXQgZ2xvYmFsbHkgZGVjbGFyZWQgbW9kdWxlcyBoYXZlIHRoZWlyIGNvbXBvbmVudHMgc2NvcGVkIHByb3Blcmx5LCB0aGlzIGZ1bmN0aW9uXG4gICAqIGlzIGNhbGxlZCB3aGVuZXZlciBUZXN0QmVkIGlzIGluaXRpYWxpemVkIG9yIHJlc2V0LiBUaGUgX2ZpcnN0XyB0aW1lIHRoYXQgdGhpcyBoYXBwZW5zLCBwcmlvclxuICAgKiB0byBhbnkgb3RoZXIgb3BlcmF0aW9ucywgdGhlIHNjb3BpbmcgcXVldWUgaXMgZmx1c2hlZC5cbiAgICovXG4gIHByaXZhdGUgY2hlY2tHbG9iYWxDb21waWxhdGlvbkZpbmlzaGVkKCk6IHZvaWQge1xuICAgIC8vIENoZWNraW5nIF90ZXN0TmdNb2R1bGVSZWYgaXMgbnVsbCBzaG91bGQgbm90IGJlIG5lY2Vzc2FyeSwgYnV0IGlzIGxlZnQgaW4gYXMgYW4gYWRkaXRpb25hbFxuICAgIC8vIGd1YXJkIHRoYXQgY29tcGlsYXRpb25zIHF1ZXVlZCBpbiB0ZXN0cyAoYWZ0ZXIgaW5zdGFudGlhdGlvbikgYXJlIG5ldmVyIGZsdXNoZWQgYWNjaWRlbnRhbGx5LlxuICAgIGlmICghdGhpcy5nbG9iYWxDb21waWxhdGlvbkNoZWNrZWQgJiYgdGhpcy5fdGVzdE1vZHVsZVJlZiA9PT0gbnVsbCkge1xuICAgICAgZmx1c2hNb2R1bGVTY29waW5nUXVldWVBc011Y2hBc1Bvc3NpYmxlKCk7XG4gICAgfVxuICAgIHRoaXMuZ2xvYmFsQ29tcGlsYXRpb25DaGVja2VkID0gdHJ1ZTtcbiAgfVxuXG4gIHByaXZhdGUgZGVzdHJveUFjdGl2ZUZpeHR1cmVzKCk6IHZvaWQge1xuICAgIGxldCBlcnJvckNvdW50ID0gMDtcbiAgICB0aGlzLl9hY3RpdmVGaXh0dXJlcy5mb3JFYWNoKChmaXh0dXJlKSA9PiB7XG4gICAgICB0cnkge1xuICAgICAgICBmaXh0dXJlLmRlc3Ryb3koKTtcbiAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgZXJyb3JDb3VudCsrO1xuICAgICAgICBjb25zb2xlLmVycm9yKCdFcnJvciBkdXJpbmcgY2xlYW51cCBvZiBjb21wb25lbnQnLCB7XG4gICAgICAgICAgY29tcG9uZW50OiBmaXh0dXJlLmNvbXBvbmVudEluc3RhbmNlLFxuICAgICAgICAgIHN0YWNrdHJhY2U6IGUsXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHRoaXMuX2FjdGl2ZUZpeHR1cmVzID0gW107XG5cbiAgICBpZiAoZXJyb3JDb3VudCA+IDAgJiYgdGhpcy5zaG91bGRSZXRocm93VGVhcmRvd25FcnJvcnMoKSkge1xuICAgICAgdGhyb3cgRXJyb3IoXG4gICAgICAgICAgYCR7ZXJyb3JDb3VudH0gJHsoZXJyb3JDb3VudCA9PT0gMSA/ICdjb21wb25lbnQnIDogJ2NvbXBvbmVudHMnKX0gYCArXG4gICAgICAgICAgYHRocmV3IGVycm9ycyBkdXJpbmcgY2xlYW51cGApO1xuICAgIH1cbiAgfVxuXG4gIHNob3VsZFJldGhyb3dUZWFyZG93bkVycm9ycygpOiBib29sZWFuIHtcbiAgICBjb25zdCBpbnN0YW5jZU9wdGlvbnMgPSB0aGlzLl9pbnN0YW5jZVRlYXJkb3duT3B0aW9ucztcbiAgICBjb25zdCBlbnZpcm9ubWVudE9wdGlvbnMgPSBUZXN0QmVkSW1wbC5fZW52aXJvbm1lbnRUZWFyZG93bk9wdGlvbnM7XG5cbiAgICAvLyBJZiB0aGUgbmV3IHRlYXJkb3duIGJlaGF2aW9yIGhhc24ndCBiZWVuIGNvbmZpZ3VyZWQsIHByZXNlcnZlIHRoZSBvbGQgYmVoYXZpb3IuXG4gICAgaWYgKCFpbnN0YW5jZU9wdGlvbnMgJiYgIWVudmlyb25tZW50T3B0aW9ucykge1xuICAgICAgcmV0dXJuIFRFQVJET1dOX1RFU1RJTkdfTU9EVUxFX09OX0RFU1RST1lfREVGQVVMVDtcbiAgICB9XG5cbiAgICAvLyBPdGhlcndpc2UgdXNlIHRoZSBjb25maWd1cmVkIGJlaGF2aW9yIG9yIGRlZmF1bHQgdG8gcmV0aHJvd2luZy5cbiAgICByZXR1cm4gaW5zdGFuY2VPcHRpb25zPy5yZXRocm93RXJyb3JzID8/IGVudmlyb25tZW50T3B0aW9ucz8ucmV0aHJvd0Vycm9ycyA/P1xuICAgICAgICB0aGlzLnNob3VsZFRlYXJEb3duVGVzdGluZ01vZHVsZSgpO1xuICB9XG5cbiAgc2hvdWxkVGhyb3dFcnJvck9uVW5rbm93bkVsZW1lbnRzKCk6IGJvb2xlYW4ge1xuICAgIC8vIENoZWNrIGlmIGEgY29uZmlndXJhdGlvbiBoYXMgYmVlbiBwcm92aWRlZCB0byB0aHJvdyB3aGVuIGFuIHVua25vd24gZWxlbWVudCBpcyBmb3VuZFxuICAgIHJldHVybiB0aGlzLl9pbnN0YW5jZUVycm9yT25Vbmtub3duRWxlbWVudHNPcHRpb24gPz9cbiAgICAgICAgVGVzdEJlZEltcGwuX2Vudmlyb25tZW50RXJyb3JPblVua25vd25FbGVtZW50c09wdGlvbiA/PyBUSFJPV19PTl9VTktOT1dOX0VMRU1FTlRTX0RFRkFVTFQ7XG4gIH1cblxuICBzaG91bGRUaHJvd0Vycm9yT25Vbmtub3duUHJvcGVydGllcygpOiBib29sZWFuIHtcbiAgICAvLyBDaGVjayBpZiBhIGNvbmZpZ3VyYXRpb24gaGFzIGJlZW4gcHJvdmlkZWQgdG8gdGhyb3cgd2hlbiBhbiB1bmtub3duIHByb3BlcnR5IGlzIGZvdW5kXG4gICAgcmV0dXJuIHRoaXMuX2luc3RhbmNlRXJyb3JPblVua25vd25Qcm9wZXJ0aWVzT3B0aW9uID8/XG4gICAgICAgIFRlc3RCZWRJbXBsLl9lbnZpcm9ubWVudEVycm9yT25Vbmtub3duUHJvcGVydGllc09wdGlvbiA/P1xuICAgICAgICBUSFJPV19PTl9VTktOT1dOX1BST1BFUlRJRVNfREVGQVVMVDtcbiAgfVxuXG4gIHNob3VsZFRlYXJEb3duVGVzdGluZ01vZHVsZSgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5faW5zdGFuY2VUZWFyZG93bk9wdGlvbnM/LmRlc3Ryb3lBZnRlckVhY2ggPz9cbiAgICAgICAgVGVzdEJlZEltcGwuX2Vudmlyb25tZW50VGVhcmRvd25PcHRpb25zPy5kZXN0cm95QWZ0ZXJFYWNoID8/XG4gICAgICAgIFRFQVJET1dOX1RFU1RJTkdfTU9EVUxFX09OX0RFU1RST1lfREVGQVVMVDtcbiAgfVxuXG4gIHRlYXJEb3duVGVzdGluZ01vZHVsZSgpIHtcbiAgICAvLyBJZiB0aGUgbW9kdWxlIHJlZiBoYXMgYWxyZWFkeSBiZWVuIGRlc3Ryb3llZCwgd2Ugd29uJ3QgYmUgYWJsZSB0byBnZXQgYSB0ZXN0IHJlbmRlcmVyLlxuICAgIGlmICh0aGlzLl90ZXN0TW9kdWxlUmVmID09PSBudWxsKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIC8vIFJlc29sdmUgdGhlIHJlbmRlcmVyIGFoZWFkIG9mIHRpbWUsIGJlY2F1c2Ugd2Ugd2FudCB0byByZW1vdmUgdGhlIHJvb3QgZWxlbWVudHMgYXMgdGhlIHZlcnlcbiAgICAvLyBsYXN0IHN0ZXAsIGJ1dCB0aGUgaW5qZWN0b3Igd2lsbCBiZSBkZXN0cm95ZWQgYXMgYSBwYXJ0IG9mIHRoZSBtb2R1bGUgcmVmIGRlc3RydWN0aW9uLlxuICAgIGNvbnN0IHRlc3RSZW5kZXJlciA9IHRoaXMuaW5qZWN0KFRlc3RDb21wb25lbnRSZW5kZXJlcik7XG4gICAgdHJ5IHtcbiAgICAgIHRoaXMuX3Rlc3RNb2R1bGVSZWYuZGVzdHJveSgpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGlmICh0aGlzLnNob3VsZFJldGhyb3dUZWFyZG93bkVycm9ycygpKSB7XG4gICAgICAgIHRocm93IGU7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zb2xlLmVycm9yKCdFcnJvciBkdXJpbmcgY2xlYW51cCBvZiBhIHRlc3RpbmcgbW9kdWxlJywge1xuICAgICAgICAgIGNvbXBvbmVudDogdGhpcy5fdGVzdE1vZHVsZVJlZi5pbnN0YW5jZSxcbiAgICAgICAgICBzdGFja3RyYWNlOiBlLFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9IGZpbmFsbHkge1xuICAgICAgdGVzdFJlbmRlcmVyLnJlbW92ZUFsbFJvb3RFbGVtZW50cz8uKCk7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogQGRlc2NyaXB0aW9uXG4gKiBDb25maWd1cmVzIGFuZCBpbml0aWFsaXplcyBlbnZpcm9ubWVudCBmb3IgdW5pdCB0ZXN0aW5nIGFuZCBwcm92aWRlcyBtZXRob2RzIGZvclxuICogY3JlYXRpbmcgY29tcG9uZW50cyBhbmQgc2VydmljZXMgaW4gdW5pdCB0ZXN0cy5cbiAqXG4gKiBgVGVzdEJlZGAgaXMgdGhlIHByaW1hcnkgYXBpIGZvciB3cml0aW5nIHVuaXQgdGVzdHMgZm9yIEFuZ3VsYXIgYXBwbGljYXRpb25zIGFuZCBsaWJyYXJpZXMuXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgY29uc3QgVGVzdEJlZDogVGVzdEJlZFN0YXRpYyA9IFRlc3RCZWRJbXBsO1xuXG4vKipcbiAqIEFsbG93cyBpbmplY3RpbmcgZGVwZW5kZW5jaWVzIGluIGBiZWZvcmVFYWNoKClgIGFuZCBgaXQoKWAuIE5vdGU6IHRoaXMgZnVuY3Rpb25cbiAqIChpbXBvcnRlZCBmcm9tIHRoZSBgQGFuZ3VsYXIvY29yZS90ZXN0aW5nYCBwYWNrYWdlKSBjYW4gKipvbmx5KiogYmUgdXNlZCB0byBpbmplY3QgZGVwZW5kZW5jaWVzXG4gKiBpbiB0ZXN0cy4gVG8gaW5qZWN0IGRlcGVuZGVuY2llcyBpbiB5b3VyIGFwcGxpY2F0aW9uIGNvZGUsIHVzZSB0aGUgW2BpbmplY3RgXShhcGkvY29yZS9pbmplY3QpXG4gKiBmdW5jdGlvbiBmcm9tIHRoZSBgQGFuZ3VsYXIvY29yZWAgcGFja2FnZSBpbnN0ZWFkLlxuICpcbiAqIEV4YW1wbGU6XG4gKlxuICogYGBgXG4gKiBiZWZvcmVFYWNoKGluamVjdChbRGVwZW5kZW5jeSwgQUNsYXNzXSwgKGRlcCwgb2JqZWN0KSA9PiB7XG4gKiAgIC8vIHNvbWUgY29kZSB0aGF0IHVzZXMgYGRlcGAgYW5kIGBvYmplY3RgXG4gKiAgIC8vIC4uLlxuICogfSkpO1xuICpcbiAqIGl0KCcuLi4nLCBpbmplY3QoW0FDbGFzc10sIChvYmplY3QpID0+IHtcbiAqICAgb2JqZWN0LmRvU29tZXRoaW5nKCk7XG4gKiAgIGV4cGVjdCguLi4pO1xuICogfSlcbiAqIGBgYFxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGluamVjdCh0b2tlbnM6IGFueVtdLCBmbjogRnVuY3Rpb24pOiAoKSA9PiBhbnkge1xuICBjb25zdCB0ZXN0QmVkID0gVGVzdEJlZEltcGwuSU5TVEFOQ0U7XG4gIC8vIE5vdCB1c2luZyBhbiBhcnJvdyBmdW5jdGlvbiB0byBwcmVzZXJ2ZSBjb250ZXh0IHBhc3NlZCBmcm9tIGNhbGwgc2l0ZVxuICByZXR1cm4gZnVuY3Rpb24odGhpczogdW5rbm93bikge1xuICAgIHJldHVybiB0ZXN0QmVkLmV4ZWN1dGUodG9rZW5zLCBmbiwgdGhpcyk7XG4gIH07XG59XG5cbi8qKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgY2xhc3MgSW5qZWN0U2V0dXBXcmFwcGVyIHtcbiAgY29uc3RydWN0b3IocHJpdmF0ZSBfbW9kdWxlRGVmOiAoKSA9PiBUZXN0TW9kdWxlTWV0YWRhdGEpIHt9XG5cbiAgcHJpdmF0ZSBfYWRkTW9kdWxlKCkge1xuICAgIGNvbnN0IG1vZHVsZURlZiA9IHRoaXMuX21vZHVsZURlZigpO1xuICAgIGlmIChtb2R1bGVEZWYpIHtcbiAgICAgIFRlc3RCZWRJbXBsLmNvbmZpZ3VyZVRlc3RpbmdNb2R1bGUobW9kdWxlRGVmKTtcbiAgICB9XG4gIH1cblxuICBpbmplY3QodG9rZW5zOiBhbnlbXSwgZm46IEZ1bmN0aW9uKTogKCkgPT4gYW55IHtcbiAgICBjb25zdCBzZWxmID0gdGhpcztcbiAgICAvLyBOb3QgdXNpbmcgYW4gYXJyb3cgZnVuY3Rpb24gdG8gcHJlc2VydmUgY29udGV4dCBwYXNzZWQgZnJvbSBjYWxsIHNpdGVcbiAgICByZXR1cm4gZnVuY3Rpb24odGhpczogdW5rbm93bikge1xuICAgICAgc2VsZi5fYWRkTW9kdWxlKCk7XG4gICAgICByZXR1cm4gaW5qZWN0KHRva2VucywgZm4pLmNhbGwodGhpcyk7XG4gICAgfTtcbiAgfVxufVxuXG4vKipcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHdpdGhNb2R1bGUobW9kdWxlRGVmOiBUZXN0TW9kdWxlTWV0YWRhdGEpOiBJbmplY3RTZXR1cFdyYXBwZXI7XG5leHBvcnQgZnVuY3Rpb24gd2l0aE1vZHVsZShtb2R1bGVEZWY6IFRlc3RNb2R1bGVNZXRhZGF0YSwgZm46IEZ1bmN0aW9uKTogKCkgPT4gYW55O1xuZXhwb3J0IGZ1bmN0aW9uIHdpdGhNb2R1bGUobW9kdWxlRGVmOiBUZXN0TW9kdWxlTWV0YWRhdGEsIGZuPzogRnVuY3Rpb258bnVsbCk6ICgoKSA9PiBhbnkpfFxuICAgIEluamVjdFNldHVwV3JhcHBlciB7XG4gIGlmIChmbikge1xuICAgIC8vIE5vdCB1c2luZyBhbiBhcnJvdyBmdW5jdGlvbiB0byBwcmVzZXJ2ZSBjb250ZXh0IHBhc3NlZCBmcm9tIGNhbGwgc2l0ZVxuICAgIHJldHVybiBmdW5jdGlvbih0aGlzOiB1bmtub3duKSB7XG4gICAgICBjb25zdCB0ZXN0QmVkID0gVGVzdEJlZEltcGwuSU5TVEFOQ0U7XG4gICAgICBpZiAobW9kdWxlRGVmKSB7XG4gICAgICAgIHRlc3RCZWQuY29uZmlndXJlVGVzdGluZ01vZHVsZShtb2R1bGVEZWYpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGZuLmFwcGx5KHRoaXMpO1xuICAgIH07XG4gIH1cbiAgcmV0dXJuIG5ldyBJbmplY3RTZXR1cFdyYXBwZXIoKCkgPT4gbW9kdWxlRGVmKTtcbn1cbiJdfQ==