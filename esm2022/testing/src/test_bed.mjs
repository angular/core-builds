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
import { EnvironmentInjector, InjectFlags, Injector, NgZone, runInInjectionContext, ɵconvertToBitFlags as convertToBitFlags, ɵDeferBlockBehavior as DeferBlockBehavior, ɵflushModuleScopingQueueAsMuchAsPossible as flushModuleScopingQueueAsMuchAsPossible, ɵgetAsyncClassMetadataFn as getAsyncClassMetadataFn, ɵgetUnknownElementStrictMode as getUnknownElementStrictMode, ɵgetUnknownPropertyStrictMode as getUnknownPropertyStrictMode, ɵRender3ComponentFactory as ComponentFactory, ɵresetCompiledComponents as resetCompiledComponents, ɵsetAllowDuplicateNgModuleIdsForTest as setAllowDuplicateNgModuleIdsForTest, ɵsetUnknownElementStrictMode as setUnknownElementStrictMode, ɵsetUnknownPropertyStrictMode as setUnknownPropertyStrictMode, ɵstringify as stringify, ɵZoneAwareQueueingScheduler as ZoneAwareQueueingScheduler, } from '@angular/core';
/* clang-format on */
import { ComponentFixture } from './component_fixture';
import { ComponentFixtureNoNgZone, TEARDOWN_TESTING_MODULE_ON_DESTROY_DEFAULT, TestComponentRenderer, THROW_ON_UNKNOWN_ELEMENTS_DEFAULT, THROW_ON_UNKNOWN_PROPERTIES_DEFAULT } from './test_bed_common';
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
        /**
         * Defer block behavior option that specifies whether defer blocks will be triggered manually
         * or set to play through.
         */
        this._instanceDeferBlockBehavior = DeferBlockBehavior.Manual;
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
    static { this._INSTANCE = null; }
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
     * @see {@link EnvironmentInjector#runInContext}
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
    static flushEffects() {
        return TestBedImpl.INSTANCE.flushEffects();
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
                this._instanceDeferBlockBehavior = DeferBlockBehavior.Manual;
            }
        }
        return this;
    }
    configureCompiler(config) {
        if (config.useJit != null) {
            throw new Error('JIT compiler is not configurable via TestBed APIs.');
        }
        if (config.providers !== undefined) {
            this.compiler.setCompilerProviders(config.providers);
        }
        return this;
    }
    configureTestingModule(moduleDef) {
        this.assertNotInstantiated('TestBed.configureTestingModule', 'configure the test module');
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
        this._instanceDeferBlockBehavior = moduleDef.deferBlockBehavior ?? DeferBlockBehavior.Manual;
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
        return runInInjectionContext(this.inject(EnvironmentInjector), fn);
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
        this.assertNotInstantiated('TestBed.overrideTemplateUsingTestingModule', 'Cannot override template when the test module has already been instantiated');
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
        if (getAsyncClassMetadataFn(type)) {
            throw new Error(`Component '${type.name}' has unresolved metadata. ` +
                `Please call \`await TestBed.compileComponents()\` before running this test.`);
        }
        const componentDef = type.ɵcmp;
        if (!componentDef) {
            throw new Error(`It looks like '${stringify(type)}' has not been compiled.`);
        }
        const componentFactory = new ComponentFactory(componentDef);
        const initComponent = () => {
            const componentRef = componentFactory.create(Injector.NULL, [], `#${rootElId}`, this.testModuleRef);
            return this.runInInjectionContext(() => new ComponentFixture(componentRef));
        };
        const noNgZone = this.inject(ComponentFixtureNoNgZone, false);
        const ngZone = noNgZone ? null : this.inject(NgZone, null);
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
    getDeferBlockBehavior() {
        return this._instanceDeferBlockBehavior;
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
    /**
     * Execute any pending effects.
     *
     * @developerPreview
     */
    flushEffects() {
        this.inject(ZoneAwareQueueingScheduler).flush();
    }
}
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdF9iZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3Rlc3Rpbmcvc3JjL3Rlc3RfYmVkLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILG1HQUFtRztBQUNuRyxpR0FBaUc7QUFDakcsdUJBQXVCO0FBRXZCLHNCQUFzQjtBQUN0QixPQUFPLEVBR0wsbUJBQW1CLEVBQ25CLFdBQVcsRUFFWCxRQUFRLEVBRVIsTUFBTSxFQUlOLHFCQUFxQixFQUVyQixrQkFBa0IsSUFBSSxpQkFBaUIsRUFDdkMsbUJBQW1CLElBQUksa0JBQWtCLEVBQ3pDLHdDQUF3QyxJQUFJLHVDQUF1QyxFQUNuRix3QkFBd0IsSUFBSSx1QkFBdUIsRUFDbkQsNEJBQTRCLElBQUksMkJBQTJCLEVBQzNELDZCQUE2QixJQUFJLDRCQUE0QixFQUM3RCx3QkFBd0IsSUFBSSxnQkFBZ0IsRUFFNUMsd0JBQXdCLElBQUksdUJBQXVCLEVBQ25ELG9DQUFvQyxJQUFJLG1DQUFtQyxFQUMzRSw0QkFBNEIsSUFBSSwyQkFBMkIsRUFDM0QsNkJBQTZCLElBQUksNEJBQTRCLEVBQzdELFVBQVUsSUFBSSxTQUFTLEVBQ3ZCLDJCQUEyQixJQUFJLDBCQUEwQixHQUMxRCxNQUFNLGVBQWUsQ0FBQztBQUV2QixxQkFBcUI7QUFJckIsT0FBTyxFQUFDLGdCQUFnQixFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFFckQsT0FBTyxFQUE2Qix3QkFBd0IsRUFBeUIsMENBQTBDLEVBQUUscUJBQXFCLEVBQThDLGlDQUFpQyxFQUFFLG1DQUFtQyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDclMsT0FBTyxFQUFDLGVBQWUsRUFBQyxNQUFNLHFCQUFxQixDQUFDO0FBd0dwRCxJQUFJLGtCQUFrQixHQUFHLENBQUMsQ0FBQztBQUUzQjs7OztHQUlHO0FBQ0gsTUFBTSxVQUFVLFVBQVU7SUFDeEIsT0FBTyxXQUFX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QUFLLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDeEIsQ0FBQyxDQUFDO0lBQ0osQ0FBQztJQUNELE9BQU8sSUFBSSxrQkFBa0IsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxTQUFTLENBQUMsQ0FBQztBQUNqRCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbi8vIFRoZSBmb3JtYXR0ZXIgYW5kIENJIGRpc2FncmVlIG9uIGhvdyB0aGlzIGltcG9ydCBzdGF0ZW1lbnQgc2hvdWxkIGJlIGZvcm1hdHRlZC4gQm90aCB0cnkgdG8ga2VlcFxuLy8gaXQgb24gb25lIGxpbmUsIHRvbywgd2hpY2ggaGFzIGdvdHRlbiB2ZXJ5IGhhcmQgdG8gcmVhZCAmIG1hbmFnZS4gU28gZGlzYWJsZSB0aGUgZm9ybWF0dGVyIGZvclxuLy8gdGhpcyBzdGF0ZW1lbnQgb25seS5cblxuLyogY2xhbmctZm9ybWF0IG9mZiAqL1xuaW1wb3J0IHtcbiAgQ29tcG9uZW50LFxuICBEaXJlY3RpdmUsXG4gIEVudmlyb25tZW50SW5qZWN0b3IsXG4gIEluamVjdEZsYWdzLFxuICBJbmplY3RPcHRpb25zLFxuICBJbmplY3RvcixcbiAgTmdNb2R1bGUsXG4gIE5nWm9uZSxcbiAgUGlwZSxcbiAgUGxhdGZvcm1SZWYsXG4gIFByb3ZpZGVyVG9rZW4sXG4gIHJ1bkluSW5qZWN0aW9uQ29udGV4dCxcbiAgVHlwZSxcbiAgybVjb252ZXJ0VG9CaXRGbGFncyBhcyBjb252ZXJ0VG9CaXRGbGFncyxcbiAgybVEZWZlckJsb2NrQmVoYXZpb3IgYXMgRGVmZXJCbG9ja0JlaGF2aW9yLFxuICDJtWZsdXNoTW9kdWxlU2NvcGluZ1F1ZXVlQXNNdWNoQXNQb3NzaWJsZSBhcyBmbHVzaE1vZHVsZVNjb3BpbmdRdWV1ZUFzTXVjaEFzUG9zc2libGUsXG4gIMm1Z2V0QXN5bmNDbGFzc01ldGFkYXRhRm4gYXMgZ2V0QXN5bmNDbGFzc01ldGFkYXRhRm4sXG4gIMm1Z2V0VW5rbm93bkVsZW1lbnRTdHJpY3RNb2RlIGFzIGdldFVua25vd25FbGVtZW50U3RyaWN0TW9kZSxcbiAgybVnZXRVbmtub3duUHJvcGVydHlTdHJpY3RNb2RlIGFzIGdldFVua25vd25Qcm9wZXJ0eVN0cmljdE1vZGUsXG4gIMm1UmVuZGVyM0NvbXBvbmVudEZhY3RvcnkgYXMgQ29tcG9uZW50RmFjdG9yeSxcbiAgybVSZW5kZXIzTmdNb2R1bGVSZWYgYXMgTmdNb2R1bGVSZWYsXG4gIMm1cmVzZXRDb21waWxlZENvbXBvbmVudHMgYXMgcmVzZXRDb21waWxlZENvbXBvbmVudHMsXG4gIMm1c2V0QWxsb3dEdXBsaWNhdGVOZ01vZHVsZUlkc0ZvclRlc3QgYXMgc2V0QWxsb3dEdXBsaWNhdGVOZ01vZHVsZUlkc0ZvclRlc3QsXG4gIMm1c2V0VW5rbm93bkVsZW1lbnRTdHJpY3RNb2RlIGFzIHNldFVua25vd25FbGVtZW50U3RyaWN0TW9kZSxcbiAgybVzZXRVbmtub3duUHJvcGVydHlTdHJpY3RNb2RlIGFzIHNldFVua25vd25Qcm9wZXJ0eVN0cmljdE1vZGUsXG4gIMm1c3RyaW5naWZ5IGFzIHN0cmluZ2lmeSxcbiAgybVab25lQXdhcmVRdWV1ZWluZ1NjaGVkdWxlciBhcyBab25lQXdhcmVRdWV1ZWluZ1NjaGVkdWxlcixcbn0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5cbi8qIGNsYW5nLWZvcm1hdCBvbiAqL1xuXG5cblxuaW1wb3J0IHtDb21wb25lbnRGaXh0dXJlfSBmcm9tICcuL2NvbXBvbmVudF9maXh0dXJlJztcbmltcG9ydCB7TWV0YWRhdGFPdmVycmlkZX0gZnJvbSAnLi9tZXRhZGF0YV9vdmVycmlkZSc7XG5pbXBvcnQge0NvbXBvbmVudEZpeHR1cmVBdXRvRGV0ZWN0LCBDb21wb25lbnRGaXh0dXJlTm9OZ1pvbmUsIE1vZHVsZVRlYXJkb3duT3B0aW9ucywgVEVBUkRPV05fVEVTVElOR19NT0RVTEVfT05fREVTVFJPWV9ERUZBVUxULCBUZXN0Q29tcG9uZW50UmVuZGVyZXIsIFRlc3RFbnZpcm9ubWVudE9wdGlvbnMsIFRlc3RNb2R1bGVNZXRhZGF0YSwgVEhST1dfT05fVU5LTk9XTl9FTEVNRU5UU19ERUZBVUxULCBUSFJPV19PTl9VTktOT1dOX1BST1BFUlRJRVNfREVGQVVMVH0gZnJvbSAnLi90ZXN0X2JlZF9jb21tb24nO1xuaW1wb3J0IHtUZXN0QmVkQ29tcGlsZXJ9IGZyb20gJy4vdGVzdF9iZWRfY29tcGlsZXInO1xuXG4vKipcbiAqIFN0YXRpYyBtZXRob2RzIGltcGxlbWVudGVkIGJ5IHRoZSBgVGVzdEJlZGAuXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgaW50ZXJmYWNlIFRlc3RCZWRTdGF0aWMgZXh0ZW5kcyBUZXN0QmVkIHtcbiAgbmV3KC4uLmFyZ3M6IGFueVtdKTogVGVzdEJlZDtcbn1cblxuLyoqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgVGVzdEJlZCB7XG4gIGdldCBwbGF0Zm9ybSgpOiBQbGF0Zm9ybVJlZjtcblxuICBnZXQgbmdNb2R1bGUoKTogVHlwZTxhbnk+fFR5cGU8YW55PltdO1xuXG4gIC8qKlxuICAgKiBJbml0aWFsaXplIHRoZSBlbnZpcm9ubWVudCBmb3IgdGVzdGluZyB3aXRoIGEgY29tcGlsZXIgZmFjdG9yeSwgYSBQbGF0Zm9ybVJlZiwgYW5kIGFuXG4gICAqIGFuZ3VsYXIgbW9kdWxlLiBUaGVzZSBhcmUgY29tbW9uIHRvIGV2ZXJ5IHRlc3QgaW4gdGhlIHN1aXRlLlxuICAgKlxuICAgKiBUaGlzIG1heSBvbmx5IGJlIGNhbGxlZCBvbmNlLCB0byBzZXQgdXAgdGhlIGNvbW1vbiBwcm92aWRlcnMgZm9yIHRoZSBjdXJyZW50IHRlc3RcbiAgICogc3VpdGUgb24gdGhlIGN1cnJlbnQgcGxhdGZvcm0uIElmIHlvdSBhYnNvbHV0ZWx5IG5lZWQgdG8gY2hhbmdlIHRoZSBwcm92aWRlcnMsXG4gICAqIGZpcnN0IHVzZSBgcmVzZXRUZXN0RW52aXJvbm1lbnRgLlxuICAgKlxuICAgKiBUZXN0IG1vZHVsZXMgYW5kIHBsYXRmb3JtcyBmb3IgaW5kaXZpZHVhbCBwbGF0Zm9ybXMgYXJlIGF2YWlsYWJsZSBmcm9tXG4gICAqICdAYW5ndWxhci88cGxhdGZvcm1fbmFtZT4vdGVzdGluZycuXG4gICAqL1xuICBpbml0VGVzdEVudmlyb25tZW50KFxuICAgICAgbmdNb2R1bGU6IFR5cGU8YW55PnxUeXBlPGFueT5bXSwgcGxhdGZvcm06IFBsYXRmb3JtUmVmLFxuICAgICAgb3B0aW9ucz86IFRlc3RFbnZpcm9ubWVudE9wdGlvbnMpOiB2b2lkO1xuXG4gIC8qKlxuICAgKiBSZXNldCB0aGUgcHJvdmlkZXJzIGZvciB0aGUgdGVzdCBpbmplY3Rvci5cbiAgICovXG4gIHJlc2V0VGVzdEVudmlyb25tZW50KCk6IHZvaWQ7XG5cbiAgcmVzZXRUZXN0aW5nTW9kdWxlKCk6IFRlc3RCZWQ7XG5cbiAgY29uZmlndXJlQ29tcGlsZXIoY29uZmlnOiB7cHJvdmlkZXJzPzogYW55W10sIHVzZUppdD86IGJvb2xlYW59KTogdm9pZDtcblxuICBjb25maWd1cmVUZXN0aW5nTW9kdWxlKG1vZHVsZURlZjogVGVzdE1vZHVsZU1ldGFkYXRhKTogVGVzdEJlZDtcblxuICBjb21waWxlQ29tcG9uZW50cygpOiBQcm9taXNlPGFueT47XG5cbiAgaW5qZWN0PFQ+KHRva2VuOiBQcm92aWRlclRva2VuPFQ+LCBub3RGb3VuZFZhbHVlOiB1bmRlZmluZWQsIG9wdGlvbnM6IEluamVjdE9wdGlvbnMme1xuICAgIG9wdGlvbmFsPzogZmFsc2VcbiAgfSk6IFQ7XG4gIGluamVjdDxUPih0b2tlbjogUHJvdmlkZXJUb2tlbjxUPiwgbm90Rm91bmRWYWx1ZTogbnVsbHx1bmRlZmluZWQsIG9wdGlvbnM6IEluamVjdE9wdGlvbnMpOiBUfG51bGw7XG4gIGluamVjdDxUPih0b2tlbjogUHJvdmlkZXJUb2tlbjxUPiwgbm90Rm91bmRWYWx1ZT86IFQsIG9wdGlvbnM/OiBJbmplY3RPcHRpb25zKTogVDtcbiAgLyoqIEBkZXByZWNhdGVkIHVzZSBvYmplY3QtYmFzZWQgZmxhZ3MgKGBJbmplY3RPcHRpb25zYCkgaW5zdGVhZC4gKi9cbiAgaW5qZWN0PFQ+KHRva2VuOiBQcm92aWRlclRva2VuPFQ+LCBub3RGb3VuZFZhbHVlPzogVCwgZmxhZ3M/OiBJbmplY3RGbGFncyk6IFQ7XG4gIC8qKiBAZGVwcmVjYXRlZCB1c2Ugb2JqZWN0LWJhc2VkIGZsYWdzIChgSW5qZWN0T3B0aW9uc2ApIGluc3RlYWQuICovXG4gIGluamVjdDxUPih0b2tlbjogUHJvdmlkZXJUb2tlbjxUPiwgbm90Rm91bmRWYWx1ZTogbnVsbCwgZmxhZ3M/OiBJbmplY3RGbGFncyk6IFR8bnVsbDtcblxuICAvKiogQGRlcHJlY2F0ZWQgZnJvbSB2OS4wLjAgdXNlIFRlc3RCZWQuaW5qZWN0ICovXG4gIGdldDxUPih0b2tlbjogUHJvdmlkZXJUb2tlbjxUPiwgbm90Rm91bmRWYWx1ZT86IFQsIGZsYWdzPzogSW5qZWN0RmxhZ3MpOiBhbnk7XG4gIC8qKiBAZGVwcmVjYXRlZCBmcm9tIHY5LjAuMCB1c2UgVGVzdEJlZC5pbmplY3QgKi9cbiAgZ2V0KHRva2VuOiBhbnksIG5vdEZvdW5kVmFsdWU/OiBhbnkpOiBhbnk7XG5cbiAgLyoqXG4gICAqIFJ1bnMgdGhlIGdpdmVuIGZ1bmN0aW9uIGluIHRoZSBgRW52aXJvbm1lbnRJbmplY3RvcmAgY29udGV4dCBvZiBgVGVzdEJlZGAuXG4gICAqXG4gICAqIEBzZWUge0BsaW5rIEVudmlyb25tZW50SW5qZWN0b3IjcnVuSW5Db250ZXh0fVxuICAgKi9cbiAgcnVuSW5JbmplY3Rpb25Db250ZXh0PFQ+KGZuOiAoKSA9PiBUKTogVDtcblxuICBleGVjdXRlKHRva2VuczogYW55W10sIGZuOiBGdW5jdGlvbiwgY29udGV4dD86IGFueSk6IGFueTtcblxuICBvdmVycmlkZU1vZHVsZShuZ01vZHVsZTogVHlwZTxhbnk+LCBvdmVycmlkZTogTWV0YWRhdGFPdmVycmlkZTxOZ01vZHVsZT4pOiBUZXN0QmVkO1xuXG4gIG92ZXJyaWRlQ29tcG9uZW50KGNvbXBvbmVudDogVHlwZTxhbnk+LCBvdmVycmlkZTogTWV0YWRhdGFPdmVycmlkZTxDb21wb25lbnQ+KTogVGVzdEJlZDtcblxuICBvdmVycmlkZURpcmVjdGl2ZShkaXJlY3RpdmU6IFR5cGU8YW55Piwgb3ZlcnJpZGU6IE1ldGFkYXRhT3ZlcnJpZGU8RGlyZWN0aXZlPik6IFRlc3RCZWQ7XG5cbiAgb3ZlcnJpZGVQaXBlKHBpcGU6IFR5cGU8YW55Piwgb3ZlcnJpZGU6IE1ldGFkYXRhT3ZlcnJpZGU8UGlwZT4pOiBUZXN0QmVkO1xuXG4gIG92ZXJyaWRlVGVtcGxhdGUoY29tcG9uZW50OiBUeXBlPGFueT4sIHRlbXBsYXRlOiBzdHJpbmcpOiBUZXN0QmVkO1xuXG4gIC8qKlxuICAgKiBPdmVyd3JpdGVzIGFsbCBwcm92aWRlcnMgZm9yIHRoZSBnaXZlbiB0b2tlbiB3aXRoIHRoZSBnaXZlbiBwcm92aWRlciBkZWZpbml0aW9uLlxuICAgKi9cbiAgb3ZlcnJpZGVQcm92aWRlcih0b2tlbjogYW55LCBwcm92aWRlcjoge3VzZUZhY3Rvcnk6IEZ1bmN0aW9uLCBkZXBzOiBhbnlbXSwgbXVsdGk/OiBib29sZWFufSk6XG4gICAgICBUZXN0QmVkO1xuICBvdmVycmlkZVByb3ZpZGVyKHRva2VuOiBhbnksIHByb3ZpZGVyOiB7dXNlVmFsdWU6IGFueSwgbXVsdGk/OiBib29sZWFufSk6IFRlc3RCZWQ7XG4gIG92ZXJyaWRlUHJvdmlkZXIoXG4gICAgICB0b2tlbjogYW55LFxuICAgICAgcHJvdmlkZXI6IHt1c2VGYWN0b3J5PzogRnVuY3Rpb24sIHVzZVZhbHVlPzogYW55LCBkZXBzPzogYW55W10sIG11bHRpPzogYm9vbGVhbn0pOiBUZXN0QmVkO1xuXG4gIG92ZXJyaWRlVGVtcGxhdGVVc2luZ1Rlc3RpbmdNb2R1bGUoY29tcG9uZW50OiBUeXBlPGFueT4sIHRlbXBsYXRlOiBzdHJpbmcpOiBUZXN0QmVkO1xuXG4gIGNyZWF0ZUNvbXBvbmVudDxUPihjb21wb25lbnQ6IFR5cGU8VD4pOiBDb21wb25lbnRGaXh0dXJlPFQ+O1xuXG5cbiAgLyoqXG4gICAqIEV4ZWN1dGUgYW55IHBlbmRpbmcgZWZmZWN0cy5cbiAgICpcbiAgICogQGRldmVsb3BlclByZXZpZXdcbiAgICovXG4gIGZsdXNoRWZmZWN0cygpOiB2b2lkO1xufVxuXG5sZXQgX25leHRSb290RWxlbWVudElkID0gMDtcblxuLyoqXG4gKiBSZXR1cm5zIGEgc2luZ2xldG9uIG9mIHRoZSBgVGVzdEJlZGAgY2xhc3MuXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0VGVzdEJlZCgpOiBUZXN0QmVkIHtcbiAgcmV0dXJuIFRlc3RCZWRJbXBsLklOU1RBTkNFO1xufVxuXG4vKipcbiAqIEBkZXNjcmlwdGlvblxuICogQ29uZmlndXJlcyBhbmQgaW5pdGlhbGl6ZXMgZW52aXJvbm1lbnQgZm9yIHVuaXQgdGVzdGluZyBhbmQgcHJvdmlkZXMgbWV0aG9kcyBmb3JcbiAqIGNyZWF0aW5nIGNvbXBvbmVudHMgYW5kIHNlcnZpY2VzIGluIHVuaXQgdGVzdHMuXG4gKlxuICogVGVzdEJlZCBpcyB0aGUgcHJpbWFyeSBhcGkgZm9yIHdyaXRpbmcgdW5pdCB0ZXN0cyBmb3IgQW5ndWxhciBhcHBsaWNhdGlvbnMgYW5kIGxpYnJhcmllcy5cbiAqL1xuZXhwb3J0IGNsYXNzIFRlc3RCZWRJbXBsIGltcGxlbWVudHMgVGVzdEJlZCB7XG4gIHByaXZhdGUgc3RhdGljIF9JTlNUQU5DRTogVGVzdEJlZEltcGx8bnVsbCA9IG51bGw7XG5cbiAgc3RhdGljIGdldCBJTlNUQU5DRSgpOiBUZXN0QmVkSW1wbCB7XG4gICAgcmV0dXJuIFRlc3RCZWRJbXBsLl9JTlNUQU5DRSA9IFRlc3RCZWRJbXBsLl9JTlNUQU5DRSB8fCBuZXcgVGVzdEJlZEltcGwoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBUZWFyZG93biBvcHRpb25zIHRoYXQgaGF2ZSBiZWVuIGNvbmZpZ3VyZWQgYXQgdGhlIGVudmlyb25tZW50IGxldmVsLlxuICAgKiBVc2VkIGFzIGEgZmFsbGJhY2sgaWYgbm8gaW5zdGFuY2UtbGV2ZWwgb3B0aW9ucyBoYXZlIGJlZW4gcHJvdmlkZWQuXG4gICAqL1xuICBwcml2YXRlIHN0YXRpYyBfZW52aXJvbm1lbnRUZWFyZG93bk9wdGlvbnM6IE1vZHVsZVRlYXJkb3duT3B0aW9uc3x1bmRlZmluZWQ7XG5cbiAgLyoqXG4gICAqIFwiRXJyb3Igb24gdW5rbm93biBlbGVtZW50c1wiIG9wdGlvbiB0aGF0IGhhcyBiZWVuIGNvbmZpZ3VyZWQgYXQgdGhlIGVudmlyb25tZW50IGxldmVsLlxuICAgKiBVc2VkIGFzIGEgZmFsbGJhY2sgaWYgbm8gaW5zdGFuY2UtbGV2ZWwgb3B0aW9uIGhhcyBiZWVuIHByb3ZpZGVkLlxuICAgKi9cbiAgcHJpdmF0ZSBzdGF0aWMgX2Vudmlyb25tZW50RXJyb3JPblVua25vd25FbGVtZW50c09wdGlvbjogYm9vbGVhbnx1bmRlZmluZWQ7XG5cbiAgLyoqXG4gICAqIFwiRXJyb3Igb24gdW5rbm93biBwcm9wZXJ0aWVzXCIgb3B0aW9uIHRoYXQgaGFzIGJlZW4gY29uZmlndXJlZCBhdCB0aGUgZW52aXJvbm1lbnQgbGV2ZWwuXG4gICAqIFVzZWQgYXMgYSBmYWxsYmFjayBpZiBubyBpbnN0YW5jZS1sZXZlbCBvcHRpb24gaGFzIGJlZW4gcHJvdmlkZWQuXG4gICAqL1xuICBwcml2YXRlIHN0YXRpYyBfZW52aXJvbm1lbnRFcnJvck9uVW5rbm93blByb3BlcnRpZXNPcHRpb246IGJvb2xlYW58dW5kZWZpbmVkO1xuXG4gIC8qKlxuICAgKiBUZWFyZG93biBvcHRpb25zIHRoYXQgaGF2ZSBiZWVuIGNvbmZpZ3VyZWQgYXQgdGhlIGBUZXN0QmVkYCBpbnN0YW5jZSBsZXZlbC5cbiAgICogVGhlc2Ugb3B0aW9ucyB0YWtlIHByZWNlZGVuY2Ugb3ZlciB0aGUgZW52aXJvbm1lbnQtbGV2ZWwgb25lcy5cbiAgICovXG4gIHByaXZhdGUgX2luc3RhbmNlVGVhcmRvd25PcHRpb25zOiBNb2R1bGVUZWFyZG93bk9wdGlvbnN8dW5kZWZpbmVkO1xuXG4gIC8qKlxuICAgKiBEZWZlciBibG9jayBiZWhhdmlvciBvcHRpb24gdGhhdCBzcGVjaWZpZXMgd2hldGhlciBkZWZlciBibG9ja3Mgd2lsbCBiZSB0cmlnZ2VyZWQgbWFudWFsbHlcbiAgICogb3Igc2V0IHRvIHBsYXkgdGhyb3VnaC5cbiAgICovXG4gIHByaXZhdGUgX2luc3RhbmNlRGVmZXJCbG9ja0JlaGF2aW9yID0gRGVmZXJCbG9ja0JlaGF2aW9yLk1hbnVhbDtcblxuICAvKipcbiAgICogXCJFcnJvciBvbiB1bmtub3duIGVsZW1lbnRzXCIgb3B0aW9uIHRoYXQgaGFzIGJlZW4gY29uZmlndXJlZCBhdCB0aGUgYFRlc3RCZWRgIGluc3RhbmNlIGxldmVsLlxuICAgKiBUaGlzIG9wdGlvbiB0YWtlcyBwcmVjZWRlbmNlIG92ZXIgdGhlIGVudmlyb25tZW50LWxldmVsIG9uZS5cbiAgICovXG4gIHByaXZhdGUgX2luc3RhbmNlRXJyb3JPblVua25vd25FbGVtZW50c09wdGlvbjogYm9vbGVhbnx1bmRlZmluZWQ7XG5cbiAgLyoqXG4gICAqIFwiRXJyb3Igb24gdW5rbm93biBwcm9wZXJ0aWVzXCIgb3B0aW9uIHRoYXQgaGFzIGJlZW4gY29uZmlndXJlZCBhdCB0aGUgYFRlc3RCZWRgIGluc3RhbmNlIGxldmVsLlxuICAgKiBUaGlzIG9wdGlvbiB0YWtlcyBwcmVjZWRlbmNlIG92ZXIgdGhlIGVudmlyb25tZW50LWxldmVsIG9uZS5cbiAgICovXG4gIHByaXZhdGUgX2luc3RhbmNlRXJyb3JPblVua25vd25Qcm9wZXJ0aWVzT3B0aW9uOiBib29sZWFufHVuZGVmaW5lZDtcblxuICAvKipcbiAgICogU3RvcmVzIHRoZSBwcmV2aW91cyBcIkVycm9yIG9uIHVua25vd24gZWxlbWVudHNcIiBvcHRpb24gdmFsdWUsXG4gICAqIGFsbG93aW5nIHRvIHJlc3RvcmUgaXQgaW4gdGhlIHJlc2V0IHRlc3RpbmcgbW9kdWxlIGxvZ2ljLlxuICAgKi9cbiAgcHJpdmF0ZSBfcHJldmlvdXNFcnJvck9uVW5rbm93bkVsZW1lbnRzT3B0aW9uOiBib29sZWFufHVuZGVmaW5lZDtcblxuICAvKipcbiAgICogU3RvcmVzIHRoZSBwcmV2aW91cyBcIkVycm9yIG9uIHVua25vd24gcHJvcGVydGllc1wiIG9wdGlvbiB2YWx1ZSxcbiAgICogYWxsb3dpbmcgdG8gcmVzdG9yZSBpdCBpbiB0aGUgcmVzZXQgdGVzdGluZyBtb2R1bGUgbG9naWMuXG4gICAqL1xuICBwcml2YXRlIF9wcmV2aW91c0Vycm9yT25Vbmtub3duUHJvcGVydGllc09wdGlvbjogYm9vbGVhbnx1bmRlZmluZWQ7XG5cbiAgLyoqXG4gICAqIEluaXRpYWxpemUgdGhlIGVudmlyb25tZW50IGZvciB0ZXN0aW5nIHdpdGggYSBjb21waWxlciBmYWN0b3J5LCBhIFBsYXRmb3JtUmVmLCBhbmQgYW5cbiAgICogYW5ndWxhciBtb2R1bGUuIFRoZXNlIGFyZSBjb21tb24gdG8gZXZlcnkgdGVzdCBpbiB0aGUgc3VpdGUuXG4gICAqXG4gICAqIFRoaXMgbWF5IG9ubHkgYmUgY2FsbGVkIG9uY2UsIHRvIHNldCB1cCB0aGUgY29tbW9uIHByb3ZpZGVycyBmb3IgdGhlIGN1cnJlbnQgdGVzdFxuICAgKiBzdWl0ZSBvbiB0aGUgY3VycmVudCBwbGF0Zm9ybS4gSWYgeW91IGFic29sdXRlbHkgbmVlZCB0byBjaGFuZ2UgdGhlIHByb3ZpZGVycyxcbiAgICogZmlyc3QgdXNlIGByZXNldFRlc3RFbnZpcm9ubWVudGAuXG4gICAqXG4gICAqIFRlc3QgbW9kdWxlcyBhbmQgcGxhdGZvcm1zIGZvciBpbmRpdmlkdWFsIHBsYXRmb3JtcyBhcmUgYXZhaWxhYmxlIGZyb21cbiAgICogJ0Bhbmd1bGFyLzxwbGF0Zm9ybV9uYW1lPi90ZXN0aW5nJy5cbiAgICpcbiAgICogQHB1YmxpY0FwaVxuICAgKi9cbiAgc3RhdGljIGluaXRUZXN0RW52aXJvbm1lbnQoXG4gICAgICBuZ01vZHVsZTogVHlwZTxhbnk+fFR5cGU8YW55PltdLCBwbGF0Zm9ybTogUGxhdGZvcm1SZWYsXG4gICAgICBvcHRpb25zPzogVGVzdEVudmlyb25tZW50T3B0aW9ucyk6IFRlc3RCZWQge1xuICAgIGNvbnN0IHRlc3RCZWQgPSBUZXN0QmVkSW1wbC5JTlNUQU5DRTtcbiAgICB0ZXN0QmVkLmluaXRUZXN0RW52aXJvbm1lbnQobmdNb2R1bGUsIHBsYXRmb3JtLCBvcHRpb25zKTtcbiAgICByZXR1cm4gdGVzdEJlZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXNldCB0aGUgcHJvdmlkZXJzIGZvciB0aGUgdGVzdCBpbmplY3Rvci5cbiAgICpcbiAgICogQHB1YmxpY0FwaVxuICAgKi9cbiAgc3RhdGljIHJlc2V0VGVzdEVudmlyb25tZW50KCk6IHZvaWQge1xuICAgIFRlc3RCZWRJbXBsLklOU1RBTkNFLnJlc2V0VGVzdEVudmlyb25tZW50KCk7XG4gIH1cblxuICBzdGF0aWMgY29uZmlndXJlQ29tcGlsZXIoY29uZmlnOiB7cHJvdmlkZXJzPzogYW55W107IHVzZUppdD86IGJvb2xlYW47fSk6IFRlc3RCZWQge1xuICAgIHJldHVybiBUZXN0QmVkSW1wbC5JTlNUQU5DRS5jb25maWd1cmVDb21waWxlcihjb25maWcpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFsbG93cyBvdmVycmlkaW5nIGRlZmF1bHQgcHJvdmlkZXJzLCBkaXJlY3RpdmVzLCBwaXBlcywgbW9kdWxlcyBvZiB0aGUgdGVzdCBpbmplY3RvcixcbiAgICogd2hpY2ggYXJlIGRlZmluZWQgaW4gdGVzdF9pbmplY3Rvci5qc1xuICAgKi9cbiAgc3RhdGljIGNvbmZpZ3VyZVRlc3RpbmdNb2R1bGUobW9kdWxlRGVmOiBUZXN0TW9kdWxlTWV0YWRhdGEpOiBUZXN0QmVkIHtcbiAgICByZXR1cm4gVGVzdEJlZEltcGwuSU5TVEFOQ0UuY29uZmlndXJlVGVzdGluZ01vZHVsZShtb2R1bGVEZWYpO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbXBpbGUgY29tcG9uZW50cyB3aXRoIGEgYHRlbXBsYXRlVXJsYCBmb3IgdGhlIHRlc3QncyBOZ01vZHVsZS5cbiAgICogSXQgaXMgbmVjZXNzYXJ5IHRvIGNhbGwgdGhpcyBmdW5jdGlvblxuICAgKiBhcyBmZXRjaGluZyB1cmxzIGlzIGFzeW5jaHJvbm91cy5cbiAgICovXG4gIHN0YXRpYyBjb21waWxlQ29tcG9uZW50cygpOiBQcm9taXNlPGFueT4ge1xuICAgIHJldHVybiBUZXN0QmVkSW1wbC5JTlNUQU5DRS5jb21waWxlQ29tcG9uZW50cygpO1xuICB9XG5cbiAgc3RhdGljIG92ZXJyaWRlTW9kdWxlKG5nTW9kdWxlOiBUeXBlPGFueT4sIG92ZXJyaWRlOiBNZXRhZGF0YU92ZXJyaWRlPE5nTW9kdWxlPik6IFRlc3RCZWQge1xuICAgIHJldHVybiBUZXN0QmVkSW1wbC5JTlNUQU5DRS5vdmVycmlkZU1vZHVsZShuZ01vZHVsZSwgb3ZlcnJpZGUpO1xuICB9XG5cbiAgc3RhdGljIG92ZXJyaWRlQ29tcG9uZW50KGNvbXBvbmVudDogVHlwZTxhbnk+LCBvdmVycmlkZTogTWV0YWRhdGFPdmVycmlkZTxDb21wb25lbnQ+KTogVGVzdEJlZCB7XG4gICAgcmV0dXJuIFRlc3RCZWRJbXBsLklOU1RBTkNFLm92ZXJyaWRlQ29tcG9uZW50KGNvbXBvbmVudCwgb3ZlcnJpZGUpO1xuICB9XG5cbiAgc3RhdGljIG92ZXJyaWRlRGlyZWN0aXZlKGRpcmVjdGl2ZTogVHlwZTxhbnk+LCBvdmVycmlkZTogTWV0YWRhdGFPdmVycmlkZTxEaXJlY3RpdmU+KTogVGVzdEJlZCB7XG4gICAgcmV0dXJuIFRlc3RCZWRJbXBsLklOU1RBTkNFLm92ZXJyaWRlRGlyZWN0aXZlKGRpcmVjdGl2ZSwgb3ZlcnJpZGUpO1xuICB9XG5cbiAgc3RhdGljIG92ZXJyaWRlUGlwZShwaXBlOiBUeXBlPGFueT4sIG92ZXJyaWRlOiBNZXRhZGF0YU92ZXJyaWRlPFBpcGU+KTogVGVzdEJlZCB7XG4gICAgcmV0dXJuIFRlc3RCZWRJbXBsLklOU1RBTkNFLm92ZXJyaWRlUGlwZShwaXBlLCBvdmVycmlkZSk7XG4gIH1cblxuICBzdGF0aWMgb3ZlcnJpZGVUZW1wbGF0ZShjb21wb25lbnQ6IFR5cGU8YW55PiwgdGVtcGxhdGU6IHN0cmluZyk6IFRlc3RCZWQge1xuICAgIHJldHVybiBUZXN0QmVkSW1wbC5JTlNUQU5DRS5vdmVycmlkZVRlbXBsYXRlKGNvbXBvbmVudCwgdGVtcGxhdGUpO1xuICB9XG5cbiAgLyoqXG4gICAqIE92ZXJyaWRlcyB0aGUgdGVtcGxhdGUgb2YgdGhlIGdpdmVuIGNvbXBvbmVudCwgY29tcGlsaW5nIHRoZSB0ZW1wbGF0ZVxuICAgKiBpbiB0aGUgY29udGV4dCBvZiB0aGUgVGVzdGluZ01vZHVsZS5cbiAgICpcbiAgICogTm90ZTogVGhpcyB3b3JrcyBmb3IgSklUIGFuZCBBT1RlZCBjb21wb25lbnRzIGFzIHdlbGwuXG4gICAqL1xuICBzdGF0aWMgb3ZlcnJpZGVUZW1wbGF0ZVVzaW5nVGVzdGluZ01vZHVsZShjb21wb25lbnQ6IFR5cGU8YW55PiwgdGVtcGxhdGU6IHN0cmluZyk6IFRlc3RCZWQge1xuICAgIHJldHVybiBUZXN0QmVkSW1wbC5JTlNUQU5DRS5vdmVycmlkZVRlbXBsYXRlVXNpbmdUZXN0aW5nTW9kdWxlKGNvbXBvbmVudCwgdGVtcGxhdGUpO1xuICB9XG5cbiAgc3RhdGljIG92ZXJyaWRlUHJvdmlkZXIodG9rZW46IGFueSwgcHJvdmlkZXI6IHtcbiAgICB1c2VGYWN0b3J5OiBGdW5jdGlvbixcbiAgICBkZXBzOiBhbnlbXSxcbiAgfSk6IFRlc3RCZWQ7XG4gIHN0YXRpYyBvdmVycmlkZVByb3ZpZGVyKHRva2VuOiBhbnksIHByb3ZpZGVyOiB7dXNlVmFsdWU6IGFueTt9KTogVGVzdEJlZDtcbiAgc3RhdGljIG92ZXJyaWRlUHJvdmlkZXIodG9rZW46IGFueSwgcHJvdmlkZXI6IHtcbiAgICB1c2VGYWN0b3J5PzogRnVuY3Rpb24sXG4gICAgdXNlVmFsdWU/OiBhbnksXG4gICAgZGVwcz86IGFueVtdLFxuICB9KTogVGVzdEJlZCB7XG4gICAgcmV0dXJuIFRlc3RCZWRJbXBsLklOU1RBTkNFLm92ZXJyaWRlUHJvdmlkZXIodG9rZW4sIHByb3ZpZGVyKTtcbiAgfVxuXG4gIHN0YXRpYyBpbmplY3Q8VD4odG9rZW46IFByb3ZpZGVyVG9rZW48VD4sIG5vdEZvdW5kVmFsdWU6IHVuZGVmaW5lZCwgb3B0aW9uczogSW5qZWN0T3B0aW9ucyZ7XG4gICAgb3B0aW9uYWw/OiBmYWxzZVxuICB9KTogVDtcbiAgc3RhdGljIGluamVjdDxUPih0b2tlbjogUHJvdmlkZXJUb2tlbjxUPiwgbm90Rm91bmRWYWx1ZTogbnVsbHx1bmRlZmluZWQsIG9wdGlvbnM6IEluamVjdE9wdGlvbnMpOlxuICAgICAgVHxudWxsO1xuICBzdGF0aWMgaW5qZWN0PFQ+KHRva2VuOiBQcm92aWRlclRva2VuPFQ+LCBub3RGb3VuZFZhbHVlPzogVCwgb3B0aW9ucz86IEluamVjdE9wdGlvbnMpOiBUO1xuICAvKiogQGRlcHJlY2F0ZWQgdXNlIG9iamVjdC1iYXNlZCBmbGFncyAoYEluamVjdE9wdGlvbnNgKSBpbnN0ZWFkLiAqL1xuICBzdGF0aWMgaW5qZWN0PFQ+KHRva2VuOiBQcm92aWRlclRva2VuPFQ+LCBub3RGb3VuZFZhbHVlPzogVCwgZmxhZ3M/OiBJbmplY3RGbGFncyk6IFQ7XG4gIC8qKiBAZGVwcmVjYXRlZCB1c2Ugb2JqZWN0LWJhc2VkIGZsYWdzIChgSW5qZWN0T3B0aW9uc2ApIGluc3RlYWQuICovXG4gIHN0YXRpYyBpbmplY3Q8VD4odG9rZW46IFByb3ZpZGVyVG9rZW48VD4sIG5vdEZvdW5kVmFsdWU6IG51bGwsIGZsYWdzPzogSW5qZWN0RmxhZ3MpOiBUfG51bGw7XG4gIHN0YXRpYyBpbmplY3Q8VD4oXG4gICAgICB0b2tlbjogUHJvdmlkZXJUb2tlbjxUPiwgbm90Rm91bmRWYWx1ZT86IFR8bnVsbCwgZmxhZ3M/OiBJbmplY3RGbGFnc3xJbmplY3RPcHRpb25zKTogVHxudWxsIHtcbiAgICByZXR1cm4gVGVzdEJlZEltcGwuSU5TVEFOQ0UuaW5qZWN0KHRva2VuLCBub3RGb3VuZFZhbHVlLCBjb252ZXJ0VG9CaXRGbGFncyhmbGFncykpO1xuICB9XG5cbiAgLyoqIEBkZXByZWNhdGVkIGZyb20gdjkuMC4wIHVzZSBUZXN0QmVkLmluamVjdCAqL1xuICBzdGF0aWMgZ2V0PFQ+KHRva2VuOiBQcm92aWRlclRva2VuPFQ+LCBub3RGb3VuZFZhbHVlPzogVCwgZmxhZ3M/OiBJbmplY3RGbGFncyk6IGFueTtcbiAgLyoqIEBkZXByZWNhdGVkIGZyb20gdjkuMC4wIHVzZSBUZXN0QmVkLmluamVjdCAqL1xuICBzdGF0aWMgZ2V0KHRva2VuOiBhbnksIG5vdEZvdW5kVmFsdWU/OiBhbnkpOiBhbnk7XG4gIC8qKiBAZGVwcmVjYXRlZCBmcm9tIHY5LjAuMCB1c2UgVGVzdEJlZC5pbmplY3QgKi9cbiAgc3RhdGljIGdldChcbiAgICAgIHRva2VuOiBhbnksIG5vdEZvdW5kVmFsdWU6IGFueSA9IEluamVjdG9yLlRIUk9XX0lGX05PVF9GT1VORCxcbiAgICAgIGZsYWdzOiBJbmplY3RGbGFncyA9IEluamVjdEZsYWdzLkRlZmF1bHQpOiBhbnkge1xuICAgIHJldHVybiBUZXN0QmVkSW1wbC5JTlNUQU5DRS5pbmplY3QodG9rZW4sIG5vdEZvdW5kVmFsdWUsIGZsYWdzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSdW5zIHRoZSBnaXZlbiBmdW5jdGlvbiBpbiB0aGUgYEVudmlyb25tZW50SW5qZWN0b3JgIGNvbnRleHQgb2YgYFRlc3RCZWRgLlxuICAgKlxuICAgKiBAc2VlIHtAbGluayBFbnZpcm9ubWVudEluamVjdG9yI3J1bkluQ29udGV4dH1cbiAgICovXG4gIHN0YXRpYyBydW5JbkluamVjdGlvbkNvbnRleHQ8VD4oZm46ICgpID0+IFQpOiBUIHtcbiAgICByZXR1cm4gVGVzdEJlZEltcGwuSU5TVEFOQ0UucnVuSW5JbmplY3Rpb25Db250ZXh0KGZuKTtcbiAgfVxuXG4gIHN0YXRpYyBjcmVhdGVDb21wb25lbnQ8VD4oY29tcG9uZW50OiBUeXBlPFQ+KTogQ29tcG9uZW50Rml4dHVyZTxUPiB7XG4gICAgcmV0dXJuIFRlc3RCZWRJbXBsLklOU1RBTkNFLmNyZWF0ZUNvbXBvbmVudChjb21wb25lbnQpO1xuICB9XG5cbiAgc3RhdGljIHJlc2V0VGVzdGluZ01vZHVsZSgpOiBUZXN0QmVkIHtcbiAgICByZXR1cm4gVGVzdEJlZEltcGwuSU5TVEFOQ0UucmVzZXRUZXN0aW5nTW9kdWxlKCk7XG4gIH1cblxuICBzdGF0aWMgZXhlY3V0ZSh0b2tlbnM6IGFueVtdLCBmbjogRnVuY3Rpb24sIGNvbnRleHQ/OiBhbnkpOiBhbnkge1xuICAgIHJldHVybiBUZXN0QmVkSW1wbC5JTlNUQU5DRS5leGVjdXRlKHRva2VucywgZm4sIGNvbnRleHQpO1xuICB9XG5cbiAgc3RhdGljIGdldCBwbGF0Zm9ybSgpOiBQbGF0Zm9ybVJlZiB7XG4gICAgcmV0dXJuIFRlc3RCZWRJbXBsLklOU1RBTkNFLnBsYXRmb3JtO1xuICB9XG5cbiAgc3RhdGljIGdldCBuZ01vZHVsZSgpOiBUeXBlPGFueT58VHlwZTxhbnk+W10ge1xuICAgIHJldHVybiBUZXN0QmVkSW1wbC5JTlNUQU5DRS5uZ01vZHVsZTtcbiAgfVxuXG4gIHN0YXRpYyBmbHVzaEVmZmVjdHMoKTogdm9pZCB7XG4gICAgcmV0dXJuIFRlc3RCZWRJbXBsLklOU1RBTkNFLmZsdXNoRWZmZWN0cygpO1xuICB9XG5cbiAgLy8gUHJvcGVydGllc1xuXG4gIHBsYXRmb3JtOiBQbGF0Zm9ybVJlZiA9IG51bGwhO1xuICBuZ01vZHVsZTogVHlwZTxhbnk+fFR5cGU8YW55PltdID0gbnVsbCE7XG5cbiAgcHJpdmF0ZSBfY29tcGlsZXI6IFRlc3RCZWRDb21waWxlcnxudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBfdGVzdE1vZHVsZVJlZjogTmdNb2R1bGVSZWY8YW55PnxudWxsID0gbnVsbDtcblxuICBwcml2YXRlIF9hY3RpdmVGaXh0dXJlczogQ29tcG9uZW50Rml4dHVyZTxhbnk+W10gPSBbXTtcblxuICAvKipcbiAgICogSW50ZXJuYWwtb25seSBmbGFnIHRvIGluZGljYXRlIHdoZXRoZXIgYSBtb2R1bGVcbiAgICogc2NvcGluZyBxdWV1ZSBoYXMgYmVlbiBjaGVja2VkIGFuZCBmbHVzaGVkIGFscmVhZHkuXG4gICAqIEBub2RvY1xuICAgKi9cbiAgZ2xvYmFsQ29tcGlsYXRpb25DaGVja2VkID0gZmFsc2U7XG5cbiAgLyoqXG4gICAqIEluaXRpYWxpemUgdGhlIGVudmlyb25tZW50IGZvciB0ZXN0aW5nIHdpdGggYSBjb21waWxlciBmYWN0b3J5LCBhIFBsYXRmb3JtUmVmLCBhbmQgYW5cbiAgICogYW5ndWxhciBtb2R1bGUuIFRoZXNlIGFyZSBjb21tb24gdG8gZXZlcnkgdGVzdCBpbiB0aGUgc3VpdGUuXG4gICAqXG4gICAqIFRoaXMgbWF5IG9ubHkgYmUgY2FsbGVkIG9uY2UsIHRvIHNldCB1cCB0aGUgY29tbW9uIHByb3ZpZGVycyBmb3IgdGhlIGN1cnJlbnQgdGVzdFxuICAgKiBzdWl0ZSBvbiB0aGUgY3VycmVudCBwbGF0Zm9ybS4gSWYgeW91IGFic29sdXRlbHkgbmVlZCB0byBjaGFuZ2UgdGhlIHByb3ZpZGVycyxcbiAgICogZmlyc3QgdXNlIGByZXNldFRlc3RFbnZpcm9ubWVudGAuXG4gICAqXG4gICAqIFRlc3QgbW9kdWxlcyBhbmQgcGxhdGZvcm1zIGZvciBpbmRpdmlkdWFsIHBsYXRmb3JtcyBhcmUgYXZhaWxhYmxlIGZyb21cbiAgICogJ0Bhbmd1bGFyLzxwbGF0Zm9ybV9uYW1lPi90ZXN0aW5nJy5cbiAgICpcbiAgICogQHB1YmxpY0FwaVxuICAgKi9cbiAgaW5pdFRlc3RFbnZpcm9ubWVudChcbiAgICAgIG5nTW9kdWxlOiBUeXBlPGFueT58VHlwZTxhbnk+W10sIHBsYXRmb3JtOiBQbGF0Zm9ybVJlZixcbiAgICAgIG9wdGlvbnM/OiBUZXN0RW52aXJvbm1lbnRPcHRpb25zKTogdm9pZCB7XG4gICAgaWYgKHRoaXMucGxhdGZvcm0gfHwgdGhpcy5uZ01vZHVsZSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3Qgc2V0IGJhc2UgcHJvdmlkZXJzIGJlY2F1c2UgaXQgaGFzIGFscmVhZHkgYmVlbiBjYWxsZWQnKTtcbiAgICB9XG5cbiAgICBUZXN0QmVkSW1wbC5fZW52aXJvbm1lbnRUZWFyZG93bk9wdGlvbnMgPSBvcHRpb25zPy50ZWFyZG93bjtcblxuICAgIFRlc3RCZWRJbXBsLl9lbnZpcm9ubWVudEVycm9yT25Vbmtub3duRWxlbWVudHNPcHRpb24gPSBvcHRpb25zPy5lcnJvck9uVW5rbm93bkVsZW1lbnRzO1xuXG4gICAgVGVzdEJlZEltcGwuX2Vudmlyb25tZW50RXJyb3JPblVua25vd25Qcm9wZXJ0aWVzT3B0aW9uID0gb3B0aW9ucz8uZXJyb3JPblVua25vd25Qcm9wZXJ0aWVzO1xuXG4gICAgdGhpcy5wbGF0Zm9ybSA9IHBsYXRmb3JtO1xuICAgIHRoaXMubmdNb2R1bGUgPSBuZ01vZHVsZTtcbiAgICB0aGlzLl9jb21waWxlciA9IG5ldyBUZXN0QmVkQ29tcGlsZXIodGhpcy5wbGF0Zm9ybSwgdGhpcy5uZ01vZHVsZSk7XG5cbiAgICAvLyBUZXN0QmVkIGRvZXMgbm90IGhhdmUgYW4gQVBJIHdoaWNoIGNhbiByZWxpYWJseSBkZXRlY3QgdGhlIHN0YXJ0IG9mIGEgdGVzdCwgYW5kIHRodXMgY291bGQgYmVcbiAgICAvLyB1c2VkIHRvIHRyYWNrIHRoZSBzdGF0ZSBvZiB0aGUgTmdNb2R1bGUgcmVnaXN0cnkgYW5kIHJlc2V0IGl0IGNvcnJlY3RseS4gSW5zdGVhZCwgd2hlbiB3ZVxuICAgIC8vIGtub3cgd2UncmUgaW4gYSB0ZXN0aW5nIHNjZW5hcmlvLCB3ZSBkaXNhYmxlIHRoZSBjaGVjayBmb3IgZHVwbGljYXRlIE5nTW9kdWxlIHJlZ2lzdHJhdGlvblxuICAgIC8vIGNvbXBsZXRlbHkuXG4gICAgc2V0QWxsb3dEdXBsaWNhdGVOZ01vZHVsZUlkc0ZvclRlc3QodHJ1ZSk7XG4gIH1cblxuICAvKipcbiAgICogUmVzZXQgdGhlIHByb3ZpZGVycyBmb3IgdGhlIHRlc3QgaW5qZWN0b3IuXG4gICAqXG4gICAqIEBwdWJsaWNBcGlcbiAgICovXG4gIHJlc2V0VGVzdEVudmlyb25tZW50KCk6IHZvaWQge1xuICAgIHRoaXMucmVzZXRUZXN0aW5nTW9kdWxlKCk7XG4gICAgdGhpcy5fY29tcGlsZXIgPSBudWxsO1xuICAgIHRoaXMucGxhdGZvcm0gPSBudWxsITtcbiAgICB0aGlzLm5nTW9kdWxlID0gbnVsbCE7XG4gICAgVGVzdEJlZEltcGwuX2Vudmlyb25tZW50VGVhcmRvd25PcHRpb25zID0gdW5kZWZpbmVkO1xuICAgIHNldEFsbG93RHVwbGljYXRlTmdNb2R1bGVJZHNGb3JUZXN0KGZhbHNlKTtcbiAgfVxuXG4gIHJlc2V0VGVzdGluZ01vZHVsZSgpOiB0aGlzIHtcbiAgICB0aGlzLmNoZWNrR2xvYmFsQ29tcGlsYXRpb25GaW5pc2hlZCgpO1xuICAgIHJlc2V0Q29tcGlsZWRDb21wb25lbnRzKCk7XG4gICAgaWYgKHRoaXMuX2NvbXBpbGVyICE9PSBudWxsKSB7XG4gICAgICB0aGlzLmNvbXBpbGVyLnJlc3RvcmVPcmlnaW5hbFN0YXRlKCk7XG4gICAgfVxuICAgIHRoaXMuX2NvbXBpbGVyID0gbmV3IFRlc3RCZWRDb21waWxlcih0aGlzLnBsYXRmb3JtLCB0aGlzLm5nTW9kdWxlKTtcbiAgICAvLyBSZXN0b3JlIHRoZSBwcmV2aW91cyB2YWx1ZSBvZiB0aGUgXCJlcnJvciBvbiB1bmtub3duIGVsZW1lbnRzXCIgb3B0aW9uXG4gICAgc2V0VW5rbm93bkVsZW1lbnRTdHJpY3RNb2RlKFxuICAgICAgICB0aGlzLl9wcmV2aW91c0Vycm9yT25Vbmtub3duRWxlbWVudHNPcHRpb24gPz8gVEhST1dfT05fVU5LTk9XTl9FTEVNRU5UU19ERUZBVUxUKTtcbiAgICAvLyBSZXN0b3JlIHRoZSBwcmV2aW91cyB2YWx1ZSBvZiB0aGUgXCJlcnJvciBvbiB1bmtub3duIHByb3BlcnRpZXNcIiBvcHRpb25cbiAgICBzZXRVbmtub3duUHJvcGVydHlTdHJpY3RNb2RlKFxuICAgICAgICB0aGlzLl9wcmV2aW91c0Vycm9yT25Vbmtub3duUHJvcGVydGllc09wdGlvbiA/PyBUSFJPV19PTl9VTktOT1dOX1BST1BFUlRJRVNfREVGQVVMVCk7XG5cbiAgICAvLyBXZSBoYXZlIHRvIGNoYWluIGEgY291cGxlIG9mIHRyeS9maW5hbGx5IGJsb2NrcywgYmVjYXVzZSBlYWNoIHN0ZXAgY2FuXG4gICAgLy8gdGhyb3cgZXJyb3JzIGFuZCB3ZSBkb24ndCB3YW50IGl0IHRvIGludGVycnVwdCB0aGUgbmV4dCBzdGVwIGFuZCB3ZSBhbHNvXG4gICAgLy8gd2FudCBhbiBlcnJvciB0byBiZSB0aHJvd24gYXQgdGhlIGVuZC5cbiAgICB0cnkge1xuICAgICAgdGhpcy5kZXN0cm95QWN0aXZlRml4dHVyZXMoKTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgdHJ5IHtcbiAgICAgICAgaWYgKHRoaXMuc2hvdWxkVGVhckRvd25UZXN0aW5nTW9kdWxlKCkpIHtcbiAgICAgICAgICB0aGlzLnRlYXJEb3duVGVzdGluZ01vZHVsZSgpO1xuICAgICAgICB9XG4gICAgICB9IGZpbmFsbHkge1xuICAgICAgICB0aGlzLl90ZXN0TW9kdWxlUmVmID0gbnVsbDtcbiAgICAgICAgdGhpcy5faW5zdGFuY2VUZWFyZG93bk9wdGlvbnMgPSB1bmRlZmluZWQ7XG4gICAgICAgIHRoaXMuX2luc3RhbmNlRXJyb3JPblVua25vd25FbGVtZW50c09wdGlvbiA9IHVuZGVmaW5lZDtcbiAgICAgICAgdGhpcy5faW5zdGFuY2VFcnJvck9uVW5rbm93blByb3BlcnRpZXNPcHRpb24gPSB1bmRlZmluZWQ7XG4gICAgICAgIHRoaXMuX2luc3RhbmNlRGVmZXJCbG9ja0JlaGF2aW9yID0gRGVmZXJCbG9ja0JlaGF2aW9yLk1hbnVhbDtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBjb25maWd1cmVDb21waWxlcihjb25maWc6IHtwcm92aWRlcnM/OiBhbnlbXTsgdXNlSml0PzogYm9vbGVhbjt9KTogdGhpcyB7XG4gICAgaWYgKGNvbmZpZy51c2VKaXQgIT0gbnVsbCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdKSVQgY29tcGlsZXIgaXMgbm90IGNvbmZpZ3VyYWJsZSB2aWEgVGVzdEJlZCBBUElzLicpO1xuICAgIH1cblxuICAgIGlmIChjb25maWcucHJvdmlkZXJzICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHRoaXMuY29tcGlsZXIuc2V0Q29tcGlsZXJQcm92aWRlcnMoY29uZmlnLnByb3ZpZGVycyk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgY29uZmlndXJlVGVzdGluZ01vZHVsZShtb2R1bGVEZWY6IFRlc3RNb2R1bGVNZXRhZGF0YSk6IHRoaXMge1xuICAgIHRoaXMuYXNzZXJ0Tm90SW5zdGFudGlhdGVkKCdUZXN0QmVkLmNvbmZpZ3VyZVRlc3RpbmdNb2R1bGUnLCAnY29uZmlndXJlIHRoZSB0ZXN0IG1vZHVsZScpO1xuXG4gICAgLy8gVHJpZ2dlciBtb2R1bGUgc2NvcGluZyBxdWV1ZSBmbHVzaCBiZWZvcmUgZXhlY3V0aW5nIG90aGVyIFRlc3RCZWQgb3BlcmF0aW9ucyBpbiBhIHRlc3QuXG4gICAgLy8gVGhpcyBpcyBuZWVkZWQgZm9yIHRoZSBmaXJzdCB0ZXN0IGludm9jYXRpb24gdG8gZW5zdXJlIHRoYXQgZ2xvYmFsbHkgZGVjbGFyZWQgbW9kdWxlcyBoYXZlXG4gICAgLy8gdGhlaXIgY29tcG9uZW50cyBzY29wZWQgcHJvcGVybHkuIFNlZSB0aGUgYGNoZWNrR2xvYmFsQ29tcGlsYXRpb25GaW5pc2hlZGAgZnVuY3Rpb25cbiAgICAvLyBkZXNjcmlwdGlvbiBmb3IgYWRkaXRpb25hbCBpbmZvLlxuICAgIHRoaXMuY2hlY2tHbG9iYWxDb21waWxhdGlvbkZpbmlzaGVkKCk7XG5cbiAgICAvLyBBbHdheXMgcmUtYXNzaWduIHRoZSBvcHRpb25zLCBldmVuIGlmIHRoZXkncmUgdW5kZWZpbmVkLlxuICAgIC8vIFRoaXMgZW5zdXJlcyB0aGF0IHdlIGRvbid0IGNhcnJ5IHRoZW0gYmV0d2VlbiB0ZXN0cy5cbiAgICB0aGlzLl9pbnN0YW5jZVRlYXJkb3duT3B0aW9ucyA9IG1vZHVsZURlZi50ZWFyZG93bjtcbiAgICB0aGlzLl9pbnN0YW5jZUVycm9yT25Vbmtub3duRWxlbWVudHNPcHRpb24gPSBtb2R1bGVEZWYuZXJyb3JPblVua25vd25FbGVtZW50cztcbiAgICB0aGlzLl9pbnN0YW5jZUVycm9yT25Vbmtub3duUHJvcGVydGllc09wdGlvbiA9IG1vZHVsZURlZi5lcnJvck9uVW5rbm93blByb3BlcnRpZXM7XG4gICAgdGhpcy5faW5zdGFuY2VEZWZlckJsb2NrQmVoYXZpb3IgPSBtb2R1bGVEZWYuZGVmZXJCbG9ja0JlaGF2aW9yID8/IERlZmVyQmxvY2tCZWhhdmlvci5NYW51YWw7XG4gICAgLy8gU3RvcmUgdGhlIGN1cnJlbnQgdmFsdWUgb2YgdGhlIHN0cmljdCBtb2RlIG9wdGlvbixcbiAgICAvLyBzbyB3ZSBjYW4gcmVzdG9yZSBpdCBsYXRlclxuICAgIHRoaXMuX3ByZXZpb3VzRXJyb3JPblVua25vd25FbGVtZW50c09wdGlvbiA9IGdldFVua25vd25FbGVtZW50U3RyaWN0TW9kZSgpO1xuICAgIHNldFVua25vd25FbGVtZW50U3RyaWN0TW9kZSh0aGlzLnNob3VsZFRocm93RXJyb3JPblVua25vd25FbGVtZW50cygpKTtcbiAgICB0aGlzLl9wcmV2aW91c0Vycm9yT25Vbmtub3duUHJvcGVydGllc09wdGlvbiA9IGdldFVua25vd25Qcm9wZXJ0eVN0cmljdE1vZGUoKTtcbiAgICBzZXRVbmtub3duUHJvcGVydHlTdHJpY3RNb2RlKHRoaXMuc2hvdWxkVGhyb3dFcnJvck9uVW5rbm93blByb3BlcnRpZXMoKSk7XG4gICAgdGhpcy5jb21waWxlci5jb25maWd1cmVUZXN0aW5nTW9kdWxlKG1vZHVsZURlZik7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBjb21waWxlQ29tcG9uZW50cygpOiBQcm9taXNlPGFueT4ge1xuICAgIHJldHVybiB0aGlzLmNvbXBpbGVyLmNvbXBpbGVDb21wb25lbnRzKCk7XG4gIH1cblxuICBpbmplY3Q8VD4odG9rZW46IFByb3ZpZGVyVG9rZW48VD4sIG5vdEZvdW5kVmFsdWU6IHVuZGVmaW5lZCwgb3B0aW9uczogSW5qZWN0T3B0aW9ucyZ7XG4gICAgb3B0aW9uYWw6IHRydWVcbiAgfSk6IFR8bnVsbDtcbiAgaW5qZWN0PFQ+KHRva2VuOiBQcm92aWRlclRva2VuPFQ+LCBub3RGb3VuZFZhbHVlPzogVCwgb3B0aW9ucz86IEluamVjdE9wdGlvbnMpOiBUO1xuICBpbmplY3Q8VD4odG9rZW46IFByb3ZpZGVyVG9rZW48VD4sIG5vdEZvdW5kVmFsdWU6IG51bGwsIG9wdGlvbnM/OiBJbmplY3RPcHRpb25zKTogVHxudWxsO1xuICAvKiogQGRlcHJlY2F0ZWQgdXNlIG9iamVjdC1iYXNlZCBmbGFncyAoYEluamVjdE9wdGlvbnNgKSBpbnN0ZWFkLiAqL1xuICBpbmplY3Q8VD4odG9rZW46IFByb3ZpZGVyVG9rZW48VD4sIG5vdEZvdW5kVmFsdWU/OiBULCBmbGFncz86IEluamVjdEZsYWdzKTogVDtcbiAgLyoqIEBkZXByZWNhdGVkIHVzZSBvYmplY3QtYmFzZWQgZmxhZ3MgKGBJbmplY3RPcHRpb25zYCkgaW5zdGVhZC4gKi9cbiAgaW5qZWN0PFQ+KHRva2VuOiBQcm92aWRlclRva2VuPFQ+LCBub3RGb3VuZFZhbHVlOiBudWxsLCBmbGFncz86IEluamVjdEZsYWdzKTogVHxudWxsO1xuICBpbmplY3Q8VD4odG9rZW46IFByb3ZpZGVyVG9rZW48VD4sIG5vdEZvdW5kVmFsdWU/OiBUfG51bGwsIGZsYWdzPzogSW5qZWN0RmxhZ3N8SW5qZWN0T3B0aW9ucyk6IFRcbiAgICAgIHxudWxsIHtcbiAgICBpZiAodG9rZW4gYXMgdW5rbm93biA9PT0gVGVzdEJlZCkge1xuICAgICAgcmV0dXJuIHRoaXMgYXMgYW55O1xuICAgIH1cbiAgICBjb25zdCBVTkRFRklORUQgPSB7fSBhcyB1bmtub3duIGFzIFQ7XG4gICAgY29uc3QgcmVzdWx0ID0gdGhpcy50ZXN0TW9kdWxlUmVmLmluamVjdG9yLmdldCh0b2tlbiwgVU5ERUZJTkVELCBjb252ZXJ0VG9CaXRGbGFncyhmbGFncykpO1xuICAgIHJldHVybiByZXN1bHQgPT09IFVOREVGSU5FRCA/IHRoaXMuY29tcGlsZXIuaW5qZWN0b3IuZ2V0KHRva2VuLCBub3RGb3VuZFZhbHVlLCBmbGFncykgYXMgYW55IDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQ7XG4gIH1cblxuICAvKiogQGRlcHJlY2F0ZWQgZnJvbSB2OS4wLjAgdXNlIFRlc3RCZWQuaW5qZWN0ICovXG4gIGdldDxUPih0b2tlbjogUHJvdmlkZXJUb2tlbjxUPiwgbm90Rm91bmRWYWx1ZT86IFQsIGZsYWdzPzogSW5qZWN0RmxhZ3MpOiBhbnk7XG4gIC8qKiBAZGVwcmVjYXRlZCBmcm9tIHY5LjAuMCB1c2UgVGVzdEJlZC5pbmplY3QgKi9cbiAgZ2V0KHRva2VuOiBhbnksIG5vdEZvdW5kVmFsdWU/OiBhbnkpOiBhbnk7XG4gIC8qKiBAZGVwcmVjYXRlZCBmcm9tIHY5LjAuMCB1c2UgVGVzdEJlZC5pbmplY3QgKi9cbiAgZ2V0KHRva2VuOiBhbnksIG5vdEZvdW5kVmFsdWU6IGFueSA9IEluamVjdG9yLlRIUk9XX0lGX05PVF9GT1VORCxcbiAgICAgIGZsYWdzOiBJbmplY3RGbGFncyA9IEluamVjdEZsYWdzLkRlZmF1bHQpOiBhbnkge1xuICAgIHJldHVybiB0aGlzLmluamVjdCh0b2tlbiwgbm90Rm91bmRWYWx1ZSwgZmxhZ3MpO1xuICB9XG5cbiAgcnVuSW5JbmplY3Rpb25Db250ZXh0PFQ+KGZuOiAoKSA9PiBUKTogVCB7XG4gICAgcmV0dXJuIHJ1bkluSW5qZWN0aW9uQ29udGV4dCh0aGlzLmluamVjdChFbnZpcm9ubWVudEluamVjdG9yKSwgZm4pO1xuICB9XG5cbiAgZXhlY3V0ZSh0b2tlbnM6IGFueVtdLCBmbjogRnVuY3Rpb24sIGNvbnRleHQ/OiBhbnkpOiBhbnkge1xuICAgIGNvbnN0IHBhcmFtcyA9IHRva2Vucy5tYXAodCA9PiB0aGlzLmluamVjdCh0KSk7XG4gICAgcmV0dXJuIGZuLmFwcGx5KGNvbnRleHQsIHBhcmFtcyk7XG4gIH1cblxuICBvdmVycmlkZU1vZHVsZShuZ01vZHVsZTogVHlwZTxhbnk+LCBvdmVycmlkZTogTWV0YWRhdGFPdmVycmlkZTxOZ01vZHVsZT4pOiB0aGlzIHtcbiAgICB0aGlzLmFzc2VydE5vdEluc3RhbnRpYXRlZCgnb3ZlcnJpZGVNb2R1bGUnLCAnb3ZlcnJpZGUgbW9kdWxlIG1ldGFkYXRhJyk7XG4gICAgdGhpcy5jb21waWxlci5vdmVycmlkZU1vZHVsZShuZ01vZHVsZSwgb3ZlcnJpZGUpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgb3ZlcnJpZGVDb21wb25lbnQoY29tcG9uZW50OiBUeXBlPGFueT4sIG92ZXJyaWRlOiBNZXRhZGF0YU92ZXJyaWRlPENvbXBvbmVudD4pOiB0aGlzIHtcbiAgICB0aGlzLmFzc2VydE5vdEluc3RhbnRpYXRlZCgnb3ZlcnJpZGVDb21wb25lbnQnLCAnb3ZlcnJpZGUgY29tcG9uZW50IG1ldGFkYXRhJyk7XG4gICAgdGhpcy5jb21waWxlci5vdmVycmlkZUNvbXBvbmVudChjb21wb25lbnQsIG92ZXJyaWRlKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIG92ZXJyaWRlVGVtcGxhdGVVc2luZ1Rlc3RpbmdNb2R1bGUoY29tcG9uZW50OiBUeXBlPGFueT4sIHRlbXBsYXRlOiBzdHJpbmcpOiB0aGlzIHtcbiAgICB0aGlzLmFzc2VydE5vdEluc3RhbnRpYXRlZChcbiAgICAgICAgJ1Rlc3RCZWQub3ZlcnJpZGVUZW1wbGF0ZVVzaW5nVGVzdGluZ01vZHVsZScsXG4gICAgICAgICdDYW5ub3Qgb3ZlcnJpZGUgdGVtcGxhdGUgd2hlbiB0aGUgdGVzdCBtb2R1bGUgaGFzIGFscmVhZHkgYmVlbiBpbnN0YW50aWF0ZWQnKTtcbiAgICB0aGlzLmNvbXBpbGVyLm92ZXJyaWRlVGVtcGxhdGVVc2luZ1Rlc3RpbmdNb2R1bGUoY29tcG9uZW50LCB0ZW1wbGF0ZSk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBvdmVycmlkZURpcmVjdGl2ZShkaXJlY3RpdmU6IFR5cGU8YW55Piwgb3ZlcnJpZGU6IE1ldGFkYXRhT3ZlcnJpZGU8RGlyZWN0aXZlPik6IHRoaXMge1xuICAgIHRoaXMuYXNzZXJ0Tm90SW5zdGFudGlhdGVkKCdvdmVycmlkZURpcmVjdGl2ZScsICdvdmVycmlkZSBkaXJlY3RpdmUgbWV0YWRhdGEnKTtcbiAgICB0aGlzLmNvbXBpbGVyLm92ZXJyaWRlRGlyZWN0aXZlKGRpcmVjdGl2ZSwgb3ZlcnJpZGUpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgb3ZlcnJpZGVQaXBlKHBpcGU6IFR5cGU8YW55Piwgb3ZlcnJpZGU6IE1ldGFkYXRhT3ZlcnJpZGU8UGlwZT4pOiB0aGlzIHtcbiAgICB0aGlzLmFzc2VydE5vdEluc3RhbnRpYXRlZCgnb3ZlcnJpZGVQaXBlJywgJ292ZXJyaWRlIHBpcGUgbWV0YWRhdGEnKTtcbiAgICB0aGlzLmNvbXBpbGVyLm92ZXJyaWRlUGlwZShwaXBlLCBvdmVycmlkZSk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogT3ZlcndyaXRlcyBhbGwgcHJvdmlkZXJzIGZvciB0aGUgZ2l2ZW4gdG9rZW4gd2l0aCB0aGUgZ2l2ZW4gcHJvdmlkZXIgZGVmaW5pdGlvbi5cbiAgICovXG4gIG92ZXJyaWRlUHJvdmlkZXIodG9rZW46IGFueSwgcHJvdmlkZXI6IHt1c2VGYWN0b3J5PzogRnVuY3Rpb24sIHVzZVZhbHVlPzogYW55LCBkZXBzPzogYW55W119KTpcbiAgICAgIHRoaXMge1xuICAgIHRoaXMuYXNzZXJ0Tm90SW5zdGFudGlhdGVkKCdvdmVycmlkZVByb3ZpZGVyJywgJ292ZXJyaWRlIHByb3ZpZGVyJyk7XG4gICAgdGhpcy5jb21waWxlci5vdmVycmlkZVByb3ZpZGVyKHRva2VuLCBwcm92aWRlcik7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBvdmVycmlkZVRlbXBsYXRlKGNvbXBvbmVudDogVHlwZTxhbnk+LCB0ZW1wbGF0ZTogc3RyaW5nKTogVGVzdEJlZCB7XG4gICAgcmV0dXJuIHRoaXMub3ZlcnJpZGVDb21wb25lbnQoY29tcG9uZW50LCB7c2V0OiB7dGVtcGxhdGUsIHRlbXBsYXRlVXJsOiBudWxsIX19KTtcbiAgfVxuXG4gIGNyZWF0ZUNvbXBvbmVudDxUPih0eXBlOiBUeXBlPFQ+KTogQ29tcG9uZW50Rml4dHVyZTxUPiB7XG4gICAgY29uc3QgdGVzdENvbXBvbmVudFJlbmRlcmVyID0gdGhpcy5pbmplY3QoVGVzdENvbXBvbmVudFJlbmRlcmVyKTtcbiAgICBjb25zdCByb290RWxJZCA9IGByb290JHtfbmV4dFJvb3RFbGVtZW50SWQrK31gO1xuICAgIHRlc3RDb21wb25lbnRSZW5kZXJlci5pbnNlcnRSb290RWxlbWVudChyb290RWxJZCk7XG5cbiAgICBpZiAoZ2V0QXN5bmNDbGFzc01ldGFkYXRhRm4odHlwZSkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICBgQ29tcG9uZW50ICcke3R5cGUubmFtZX0nIGhhcyB1bnJlc29sdmVkIG1ldGFkYXRhLiBgICtcbiAgICAgICAgICBgUGxlYXNlIGNhbGwgXFxgYXdhaXQgVGVzdEJlZC5jb21waWxlQ29tcG9uZW50cygpXFxgIGJlZm9yZSBydW5uaW5nIHRoaXMgdGVzdC5gKTtcbiAgICB9XG5cbiAgICBjb25zdCBjb21wb25lbnREZWYgPSAodHlwZSBhcyBhbnkpLsm1Y21wO1xuXG4gICAgaWYgKCFjb21wb25lbnREZWYpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgSXQgbG9va3MgbGlrZSAnJHtzdHJpbmdpZnkodHlwZSl9JyBoYXMgbm90IGJlZW4gY29tcGlsZWQuYCk7XG4gICAgfVxuXG4gICAgY29uc3QgY29tcG9uZW50RmFjdG9yeSA9IG5ldyBDb21wb25lbnRGYWN0b3J5KGNvbXBvbmVudERlZik7XG4gICAgY29uc3QgaW5pdENvbXBvbmVudCA9ICgpID0+IHtcbiAgICAgIGNvbnN0IGNvbXBvbmVudFJlZiA9XG4gICAgICAgICAgY29tcG9uZW50RmFjdG9yeS5jcmVhdGUoSW5qZWN0b3IuTlVMTCwgW10sIGAjJHtyb290RWxJZH1gLCB0aGlzLnRlc3RNb2R1bGVSZWYpO1xuICAgICAgcmV0dXJuIHRoaXMucnVuSW5JbmplY3Rpb25Db250ZXh0KCgpID0+IG5ldyBDb21wb25lbnRGaXh0dXJlPGFueT4oY29tcG9uZW50UmVmKSk7XG4gICAgfTtcbiAgICBjb25zdCBub05nWm9uZSA9IHRoaXMuaW5qZWN0KENvbXBvbmVudEZpeHR1cmVOb05nWm9uZSwgZmFsc2UpO1xuICAgIGNvbnN0IG5nWm9uZSA9IG5vTmdab25lID8gbnVsbCA6IHRoaXMuaW5qZWN0KE5nWm9uZSwgbnVsbCk7XG4gICAgY29uc3QgZml4dHVyZSA9IG5nWm9uZSA/IG5nWm9uZS5ydW4oaW5pdENvbXBvbmVudCkgOiBpbml0Q29tcG9uZW50KCk7XG4gICAgdGhpcy5fYWN0aXZlRml4dHVyZXMucHVzaChmaXh0dXJlKTtcbiAgICByZXR1cm4gZml4dHVyZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAaW50ZXJuYWwgc3RyaXAgdGhpcyBmcm9tIHB1Ymxpc2hlZCBkLnRzIGZpbGVzIGR1ZSB0b1xuICAgKiBodHRwczovL2dpdGh1Yi5jb20vbWljcm9zb2Z0L1R5cGVTY3JpcHQvaXNzdWVzLzM2MjE2XG4gICAqL1xuICBwcml2YXRlIGdldCBjb21waWxlcigpOiBUZXN0QmVkQ29tcGlsZXIge1xuICAgIGlmICh0aGlzLl9jb21waWxlciA9PT0gbnVsbCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBOZWVkIHRvIGNhbGwgVGVzdEJlZC5pbml0VGVzdEVudmlyb25tZW50KCkgZmlyc3RgKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuX2NvbXBpbGVyO1xuICB9XG5cbiAgLyoqXG4gICAqIEBpbnRlcm5hbCBzdHJpcCB0aGlzIGZyb20gcHVibGlzaGVkIGQudHMgZmlsZXMgZHVlIHRvXG4gICAqIGh0dHBzOi8vZ2l0aHViLmNvbS9taWNyb3NvZnQvVHlwZVNjcmlwdC9pc3N1ZXMvMzYyMTZcbiAgICovXG4gIHByaXZhdGUgZ2V0IHRlc3RNb2R1bGVSZWYoKTogTmdNb2R1bGVSZWY8YW55PiB7XG4gICAgaWYgKHRoaXMuX3Rlc3RNb2R1bGVSZWYgPT09IG51bGwpIHtcbiAgICAgIHRoaXMuX3Rlc3RNb2R1bGVSZWYgPSB0aGlzLmNvbXBpbGVyLmZpbmFsaXplKCk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLl90ZXN0TW9kdWxlUmVmO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3NlcnROb3RJbnN0YW50aWF0ZWQobWV0aG9kTmFtZTogc3RyaW5nLCBtZXRob2REZXNjcmlwdGlvbjogc3RyaW5nKSB7XG4gICAgaWYgKHRoaXMuX3Rlc3RNb2R1bGVSZWYgIT09IG51bGwpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICBgQ2Fubm90ICR7bWV0aG9kRGVzY3JpcHRpb259IHdoZW4gdGhlIHRlc3QgbW9kdWxlIGhhcyBhbHJlYWR5IGJlZW4gaW5zdGFudGlhdGVkLiBgICtcbiAgICAgICAgICBgTWFrZSBzdXJlIHlvdSBhcmUgbm90IHVzaW5nIFxcYGluamVjdFxcYCBiZWZvcmUgXFxgJHttZXRob2ROYW1lfVxcYC5gKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2sgd2hldGhlciB0aGUgbW9kdWxlIHNjb3BpbmcgcXVldWUgc2hvdWxkIGJlIGZsdXNoZWQsIGFuZCBmbHVzaCBpdCBpZiBuZWVkZWQuXG4gICAqXG4gICAqIFdoZW4gdGhlIFRlc3RCZWQgaXMgcmVzZXQsIGl0IGNsZWFycyB0aGUgSklUIG1vZHVsZSBjb21waWxhdGlvbiBxdWV1ZSwgY2FuY2VsbGluZyBhbnlcbiAgICogaW4tcHJvZ3Jlc3MgbW9kdWxlIGNvbXBpbGF0aW9uLiBUaGlzIGNyZWF0ZXMgYSBwb3RlbnRpYWwgaGF6YXJkIC0gdGhlIHZlcnkgZmlyc3QgdGltZSB0aGVcbiAgICogVGVzdEJlZCBpcyBpbml0aWFsaXplZCAob3IgaWYgaXQncyByZXNldCB3aXRob3V0IGJlaW5nIGluaXRpYWxpemVkKSwgdGhlcmUgbWF5IGJlIHBlbmRpbmdcbiAgICogY29tcGlsYXRpb25zIG9mIG1vZHVsZXMgZGVjbGFyZWQgaW4gZ2xvYmFsIHNjb3BlLiBUaGVzZSBjb21waWxhdGlvbnMgc2hvdWxkIGJlIGZpbmlzaGVkLlxuICAgKlxuICAgKiBUbyBlbnN1cmUgdGhhdCBnbG9iYWxseSBkZWNsYXJlZCBtb2R1bGVzIGhhdmUgdGhlaXIgY29tcG9uZW50cyBzY29wZWQgcHJvcGVybHksIHRoaXMgZnVuY3Rpb25cbiAgICogaXMgY2FsbGVkIHdoZW5ldmVyIFRlc3RCZWQgaXMgaW5pdGlhbGl6ZWQgb3IgcmVzZXQuIFRoZSBfZmlyc3RfIHRpbWUgdGhhdCB0aGlzIGhhcHBlbnMsIHByaW9yXG4gICAqIHRvIGFueSBvdGhlciBvcGVyYXRpb25zLCB0aGUgc2NvcGluZyBxdWV1ZSBpcyBmbHVzaGVkLlxuICAgKi9cbiAgcHJpdmF0ZSBjaGVja0dsb2JhbENvbXBpbGF0aW9uRmluaXNoZWQoKTogdm9pZCB7XG4gICAgLy8gQ2hlY2tpbmcgX3Rlc3ROZ01vZHVsZVJlZiBpcyBudWxsIHNob3VsZCBub3QgYmUgbmVjZXNzYXJ5LCBidXQgaXMgbGVmdCBpbiBhcyBhbiBhZGRpdGlvbmFsXG4gICAgLy8gZ3VhcmQgdGhhdCBjb21waWxhdGlvbnMgcXVldWVkIGluIHRlc3RzIChhZnRlciBpbnN0YW50aWF0aW9uKSBhcmUgbmV2ZXIgZmx1c2hlZCBhY2NpZGVudGFsbHkuXG4gICAgaWYgKCF0aGlzLmdsb2JhbENvbXBpbGF0aW9uQ2hlY2tlZCAmJiB0aGlzLl90ZXN0TW9kdWxlUmVmID09PSBudWxsKSB7XG4gICAgICBmbHVzaE1vZHVsZVNjb3BpbmdRdWV1ZUFzTXVjaEFzUG9zc2libGUoKTtcbiAgICB9XG4gICAgdGhpcy5nbG9iYWxDb21waWxhdGlvbkNoZWNrZWQgPSB0cnVlO1xuICB9XG5cbiAgcHJpdmF0ZSBkZXN0cm95QWN0aXZlRml4dHVyZXMoKTogdm9pZCB7XG4gICAgbGV0IGVycm9yQ291bnQgPSAwO1xuICAgIHRoaXMuX2FjdGl2ZUZpeHR1cmVzLmZvckVhY2goKGZpeHR1cmUpID0+IHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGZpeHR1cmUuZGVzdHJveSgpO1xuICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBlcnJvckNvdW50Kys7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIGR1cmluZyBjbGVhbnVwIG9mIGNvbXBvbmVudCcsIHtcbiAgICAgICAgICBjb21wb25lbnQ6IGZpeHR1cmUuY29tcG9uZW50SW5zdGFuY2UsXG4gICAgICAgICAgc3RhY2t0cmFjZTogZSxcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgdGhpcy5fYWN0aXZlRml4dHVyZXMgPSBbXTtcblxuICAgIGlmIChlcnJvckNvdW50ID4gMCAmJiB0aGlzLnNob3VsZFJldGhyb3dUZWFyZG93bkVycm9ycygpKSB7XG4gICAgICB0aHJvdyBFcnJvcihcbiAgICAgICAgICBgJHtlcnJvckNvdW50fSAkeyhlcnJvckNvdW50ID09PSAxID8gJ2NvbXBvbmVudCcgOiAnY29tcG9uZW50cycpfSBgICtcbiAgICAgICAgICBgdGhyZXcgZXJyb3JzIGR1cmluZyBjbGVhbnVwYCk7XG4gICAgfVxuICB9XG5cbiAgc2hvdWxkUmV0aHJvd1RlYXJkb3duRXJyb3JzKCk6IGJvb2xlYW4ge1xuICAgIGNvbnN0IGluc3RhbmNlT3B0aW9ucyA9IHRoaXMuX2luc3RhbmNlVGVhcmRvd25PcHRpb25zO1xuICAgIGNvbnN0IGVudmlyb25tZW50T3B0aW9ucyA9IFRlc3RCZWRJbXBsLl9lbnZpcm9ubWVudFRlYXJkb3duT3B0aW9ucztcblxuICAgIC8vIElmIHRoZSBuZXcgdGVhcmRvd24gYmVoYXZpb3IgaGFzbid0IGJlZW4gY29uZmlndXJlZCwgcHJlc2VydmUgdGhlIG9sZCBiZWhhdmlvci5cbiAgICBpZiAoIWluc3RhbmNlT3B0aW9ucyAmJiAhZW52aXJvbm1lbnRPcHRpb25zKSB7XG4gICAgICByZXR1cm4gVEVBUkRPV05fVEVTVElOR19NT0RVTEVfT05fREVTVFJPWV9ERUZBVUxUO1xuICAgIH1cblxuICAgIC8vIE90aGVyd2lzZSB1c2UgdGhlIGNvbmZpZ3VyZWQgYmVoYXZpb3Igb3IgZGVmYXVsdCB0byByZXRocm93aW5nLlxuICAgIHJldHVybiBpbnN0YW5jZU9wdGlvbnM/LnJldGhyb3dFcnJvcnMgPz8gZW52aXJvbm1lbnRPcHRpb25zPy5yZXRocm93RXJyb3JzID8/XG4gICAgICAgIHRoaXMuc2hvdWxkVGVhckRvd25UZXN0aW5nTW9kdWxlKCk7XG4gIH1cblxuICBzaG91bGRUaHJvd0Vycm9yT25Vbmtub3duRWxlbWVudHMoKTogYm9vbGVhbiB7XG4gICAgLy8gQ2hlY2sgaWYgYSBjb25maWd1cmF0aW9uIGhhcyBiZWVuIHByb3ZpZGVkIHRvIHRocm93IHdoZW4gYW4gdW5rbm93biBlbGVtZW50IGlzIGZvdW5kXG4gICAgcmV0dXJuIHRoaXMuX2luc3RhbmNlRXJyb3JPblVua25vd25FbGVtZW50c09wdGlvbiA/P1xuICAgICAgICBUZXN0QmVkSW1wbC5fZW52aXJvbm1lbnRFcnJvck9uVW5rbm93bkVsZW1lbnRzT3B0aW9uID8/IFRIUk9XX09OX1VOS05PV05fRUxFTUVOVFNfREVGQVVMVDtcbiAgfVxuXG4gIHNob3VsZFRocm93RXJyb3JPblVua25vd25Qcm9wZXJ0aWVzKCk6IGJvb2xlYW4ge1xuICAgIC8vIENoZWNrIGlmIGEgY29uZmlndXJhdGlvbiBoYXMgYmVlbiBwcm92aWRlZCB0byB0aHJvdyB3aGVuIGFuIHVua25vd24gcHJvcGVydHkgaXMgZm91bmRcbiAgICByZXR1cm4gdGhpcy5faW5zdGFuY2VFcnJvck9uVW5rbm93blByb3BlcnRpZXNPcHRpb24gPz9cbiAgICAgICAgVGVzdEJlZEltcGwuX2Vudmlyb25tZW50RXJyb3JPblVua25vd25Qcm9wZXJ0aWVzT3B0aW9uID8/XG4gICAgICAgIFRIUk9XX09OX1VOS05PV05fUFJPUEVSVElFU19ERUZBVUxUO1xuICB9XG5cbiAgc2hvdWxkVGVhckRvd25UZXN0aW5nTW9kdWxlKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLl9pbnN0YW5jZVRlYXJkb3duT3B0aW9ucz8uZGVzdHJveUFmdGVyRWFjaCA/P1xuICAgICAgICBUZXN0QmVkSW1wbC5fZW52aXJvbm1lbnRUZWFyZG93bk9wdGlvbnM/LmRlc3Ryb3lBZnRlckVhY2ggPz9cbiAgICAgICAgVEVBUkRPV05fVEVTVElOR19NT0RVTEVfT05fREVTVFJPWV9ERUZBVUxUO1xuICB9XG5cbiAgZ2V0RGVmZXJCbG9ja0JlaGF2aW9yKCk6IERlZmVyQmxvY2tCZWhhdmlvciB7XG4gICAgcmV0dXJuIHRoaXMuX2luc3RhbmNlRGVmZXJCbG9ja0JlaGF2aW9yO1xuICB9XG5cbiAgdGVhckRvd25UZXN0aW5nTW9kdWxlKCkge1xuICAgIC8vIElmIHRoZSBtb2R1bGUgcmVmIGhhcyBhbHJlYWR5IGJlZW4gZGVzdHJveWVkLCB3ZSB3b24ndCBiZSBhYmxlIHRvIGdldCBhIHRlc3QgcmVuZGVyZXIuXG4gICAgaWYgKHRoaXMuX3Rlc3RNb2R1bGVSZWYgPT09IG51bGwpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgLy8gUmVzb2x2ZSB0aGUgcmVuZGVyZXIgYWhlYWQgb2YgdGltZSwgYmVjYXVzZSB3ZSB3YW50IHRvIHJlbW92ZSB0aGUgcm9vdCBlbGVtZW50cyBhcyB0aGUgdmVyeVxuICAgIC8vIGxhc3Qgc3RlcCwgYnV0IHRoZSBpbmplY3RvciB3aWxsIGJlIGRlc3Ryb3llZCBhcyBhIHBhcnQgb2YgdGhlIG1vZHVsZSByZWYgZGVzdHJ1Y3Rpb24uXG4gICAgY29uc3QgdGVzdFJlbmRlcmVyID0gdGhpcy5pbmplY3QoVGVzdENvbXBvbmVudFJlbmRlcmVyKTtcbiAgICB0cnkge1xuICAgICAgdGhpcy5fdGVzdE1vZHVsZVJlZi5kZXN0cm95KCk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgaWYgKHRoaXMuc2hvdWxkUmV0aHJvd1RlYXJkb3duRXJyb3JzKCkpIHtcbiAgICAgICAgdGhyb3cgZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIGR1cmluZyBjbGVhbnVwIG9mIGEgdGVzdGluZyBtb2R1bGUnLCB7XG4gICAgICAgICAgY29tcG9uZW50OiB0aGlzLl90ZXN0TW9kdWxlUmVmLmluc3RhbmNlLFxuICAgICAgICAgIHN0YWNrdHJhY2U6IGUsXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0gZmluYWxseSB7XG4gICAgICB0ZXN0UmVuZGVyZXIucmVtb3ZlQWxsUm9vdEVsZW1lbnRzPy4oKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogRXhlY3V0ZSBhbnkgcGVuZGluZyBlZmZlY3RzLlxuICAgKlxuICAgKiBAZGV2ZWxvcGVyUHJldmlld1xuICAgKi9cbiAgZmx1c2hFZmZlY3RzKCk6IHZvaWQge1xuICAgIHRoaXMuaW5qZWN0KFpvbmVBd2FyZVF1ZXVlaW5nU2NoZWR1bGVyKS5mbHVzaCgpO1xuICB9XG59XG5cbi8qKlxuICogQGRlc2NyaXB0aW9uXG4gKiBDb25maWd1cmVzIGFuZCBpbml0aWFsaXplcyBlbnZpcm9ubWVudCBmb3IgdW5pdCB0ZXN0aW5nIGFuZCBwcm92aWRlcyBtZXRob2RzIGZvclxuICogY3JlYXRpbmcgY29tcG9uZW50cyBhbmQgc2VydmljZXMgaW4gdW5pdCB0ZXN0cy5cbiAqXG4gKiBgVGVzdEJlZGAgaXMgdGhlIHByaW1hcnkgYXBpIGZvciB3cml0aW5nIHVuaXQgdGVzdHMgZm9yIEFuZ3VsYXIgYXBwbGljYXRpb25zIGFuZCBsaWJyYXJpZXMuXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgY29uc3QgVGVzdEJlZDogVGVzdEJlZFN0YXRpYyA9IFRlc3RCZWRJbXBsO1xuXG4vKipcbiAqIEFsbG93cyBpbmplY3RpbmcgZGVwZW5kZW5jaWVzIGluIGBiZWZvcmVFYWNoKClgIGFuZCBgaXQoKWAuIE5vdGU6IHRoaXMgZnVuY3Rpb25cbiAqIChpbXBvcnRlZCBmcm9tIHRoZSBgQGFuZ3VsYXIvY29yZS90ZXN0aW5nYCBwYWNrYWdlKSBjYW4gKipvbmx5KiogYmUgdXNlZCB0byBpbmplY3QgZGVwZW5kZW5jaWVzXG4gKiBpbiB0ZXN0cy4gVG8gaW5qZWN0IGRlcGVuZGVuY2llcyBpbiB5b3VyIGFwcGxpY2F0aW9uIGNvZGUsIHVzZSB0aGUgW2BpbmplY3RgXShhcGkvY29yZS9pbmplY3QpXG4gKiBmdW5jdGlvbiBmcm9tIHRoZSBgQGFuZ3VsYXIvY29yZWAgcGFja2FnZSBpbnN0ZWFkLlxuICpcbiAqIEV4YW1wbGU6XG4gKlxuICogYGBgXG4gKiBiZWZvcmVFYWNoKGluamVjdChbRGVwZW5kZW5jeSwgQUNsYXNzXSwgKGRlcCwgb2JqZWN0KSA9PiB7XG4gKiAgIC8vIHNvbWUgY29kZSB0aGF0IHVzZXMgYGRlcGAgYW5kIGBvYmplY3RgXG4gKiAgIC8vIC4uLlxuICogfSkpO1xuICpcbiAqIGl0KCcuLi4nLCBpbmplY3QoW0FDbGFzc10sIChvYmplY3QpID0+IHtcbiAqICAgb2JqZWN0LmRvU29tZXRoaW5nKCk7XG4gKiAgIGV4cGVjdCguLi4pO1xuICogfSlcbiAqIGBgYFxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGluamVjdCh0b2tlbnM6IGFueVtdLCBmbjogRnVuY3Rpb24pOiAoKSA9PiBhbnkge1xuICBjb25zdCB0ZXN0QmVkID0gVGVzdEJlZEltcGwuSU5TVEFOQ0U7XG4gIC8vIE5vdCB1c2luZyBhbiBhcnJvdyBmdW5jdGlvbiB0byBwcmVzZXJ2ZSBjb250ZXh0IHBhc3NlZCBmcm9tIGNhbGwgc2l0ZVxuICByZXR1cm4gZnVuY3Rpb24odGhpczogdW5rbm93bikge1xuICAgIHJldHVybiB0ZXN0QmVkLmV4ZWN1dGUodG9rZW5zLCBmbiwgdGhpcyk7XG4gIH07XG59XG5cbi8qKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgY2xhc3MgSW5qZWN0U2V0dXBXcmFwcGVyIHtcbiAgY29uc3RydWN0b3IocHJpdmF0ZSBfbW9kdWxlRGVmOiAoKSA9PiBUZXN0TW9kdWxlTWV0YWRhdGEpIHt9XG5cbiAgcHJpdmF0ZSBfYWRkTW9kdWxlKCkge1xuICAgIGNvbnN0IG1vZHVsZURlZiA9IHRoaXMuX21vZHVsZURlZigpO1xuICAgIGlmIChtb2R1bGVEZWYpIHtcbiAgICAgIFRlc3RCZWRJbXBsLmNvbmZpZ3VyZVRlc3RpbmdNb2R1bGUobW9kdWxlRGVmKTtcbiAgICB9XG4gIH1cblxuICBpbmplY3QodG9rZW5zOiBhbnlbXSwgZm46IEZ1bmN0aW9uKTogKCkgPT4gYW55IHtcbiAgICBjb25zdCBzZWxmID0gdGhpcztcbiAgICAvLyBOb3QgdXNpbmcgYW4gYXJyb3cgZnVuY3Rpb24gdG8gcHJlc2VydmUgY29udGV4dCBwYXNzZWQgZnJvbSBjYWxsIHNpdGVcbiAgICByZXR1cm4gZnVuY3Rpb24odGhpczogdW5rbm93bikge1xuICAgICAgc2VsZi5fYWRkTW9kdWxlKCk7XG4gICAgICByZXR1cm4gaW5qZWN0KHRva2VucywgZm4pLmNhbGwodGhpcyk7XG4gICAgfTtcbiAgfVxufVxuXG4vKipcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHdpdGhNb2R1bGUobW9kdWxlRGVmOiBUZXN0TW9kdWxlTWV0YWRhdGEpOiBJbmplY3RTZXR1cFdyYXBwZXI7XG5leHBvcnQgZnVuY3Rpb24gd2l0aE1vZHVsZShtb2R1bGVEZWY6IFRlc3RNb2R1bGVNZXRhZGF0YSwgZm46IEZ1bmN0aW9uKTogKCkgPT4gYW55O1xuZXhwb3J0IGZ1bmN0aW9uIHdpdGhNb2R1bGUobW9kdWxlRGVmOiBUZXN0TW9kdWxlTWV0YWRhdGEsIGZuPzogRnVuY3Rpb258bnVsbCk6ICgoKSA9PiBhbnkpfFxuICAgIEluamVjdFNldHVwV3JhcHBlciB7XG4gIGlmIChmbikge1xuICAgIC8vIE5vdCB1c2luZyBhbiBhcnJvdyBmdW5jdGlvbiB0byBwcmVzZXJ2ZSBjb250ZXh0IHBhc3NlZCBmcm9tIGNhbGwgc2l0ZVxuICAgIHJldHVybiBmdW5jdGlvbih0aGlzOiB1bmtub3duKSB7XG4gICAgICBjb25zdCB0ZXN0QmVkID0gVGVzdEJlZEltcGwuSU5TVEFOQ0U7XG4gICAgICBpZiAobW9kdWxlRGVmKSB7XG4gICAgICAgIHRlc3RCZWQuY29uZmlndXJlVGVzdGluZ01vZHVsZShtb2R1bGVEZWYpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGZuLmFwcGx5KHRoaXMpO1xuICAgIH07XG4gIH1cbiAgcmV0dXJuIG5ldyBJbmplY3RTZXR1cFdyYXBwZXIoKCkgPT4gbW9kdWxlRGVmKTtcbn1cbiJdfQ==