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
        const noNgZone = this.inject(ComponentFixtureNoNgZone, false);
        const autoDetect = this.inject(ComponentFixtureAutoDetect, false);
        const ngZone = noNgZone ? null : this.inject(NgZone, null);
        const componentFactory = new ComponentFactory(componentDef);
        const initComponent = () => {
            const componentRef = componentFactory.create(Injector.NULL, [], `#${rootElId}`, this.testModuleRef);
            return new ComponentFixture(componentRef, ngZone, this.inject(ZoneAwareQueueingScheduler, null), autoDetect);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdF9iZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3Rlc3Rpbmcvc3JjL3Rlc3RfYmVkLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILG1HQUFtRztBQUNuRyxpR0FBaUc7QUFDakcsdUJBQXVCO0FBRXZCLHNCQUFzQjtBQUN0QixPQUFPLEVBR0wsbUJBQW1CLEVBQ25CLFdBQVcsRUFFWCxRQUFRLEVBRVIsTUFBTSxFQUlOLHFCQUFxQixFQUVyQixrQkFBa0IsSUFBSSxpQkFBaUIsRUFDdkMsbUJBQW1CLElBQUksa0JBQWtCLEVBQ3pDLHdDQUF3QyxJQUFJLHVDQUF1QyxFQUNuRix3QkFBd0IsSUFBSSx1QkFBdUIsRUFDbkQsNEJBQTRCLElBQUksMkJBQTJCLEVBQzNELDZCQUE2QixJQUFJLDRCQUE0QixFQUM3RCx3QkFBd0IsSUFBSSxnQkFBZ0IsRUFFNUMsd0JBQXdCLElBQUksdUJBQXVCLEVBQ25ELG9DQUFvQyxJQUFJLG1DQUFtQyxFQUMzRSw0QkFBNEIsSUFBSSwyQkFBMkIsRUFDM0QsNkJBQTZCLElBQUksNEJBQTRCLEVBQzdELFVBQVUsSUFBSSxTQUFTLEVBQ3ZCLDJCQUEyQixJQUFJLDBCQUEwQixHQUMxRCxNQUFNLGVBQWUsQ0FBQztBQUV2QixxQkFBcUI7QUFJckIsT0FBTyxFQUFDLGdCQUFnQixFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFFckQsT0FBTyxFQUFDLDBCQUEwQixFQUFFLHdCQUF3QixFQUF5QiwwQ0FBMEMsRUFBRSxxQkFBcUIsRUFBOEMsaUNBQWlDLEVBQUUsbUNBQW1DLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUNyUyxPQUFPLEVBQUMsZUFBZSxFQUFDLE1BQU0scUJBQXFCLENBQUM7QUF3R3BELElBQUksa0JBQWtCLEdBQUcsQ0FBQyxDQUFDO0FBRTNCOzs7O0dBSUc7QUFDSCxNQUFNLFVBQVUsVUFBVTtJQUN4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Q0FBQztZQUNyQyxJQUFJLFNBQVMsRUFBRSxDQUFDO2dCQUNkLE9BQU8sQ0FBQyxzQkFBc0IsQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUM1QyxDQUFDO1lBQ0QsT0FBTyxFQUFFLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3hCLENBQUMsQ0FBQztJQUNKLENBQUM7SUFDRCxPQUFPLElBQUksa0JBQWtCLENBQUMsR0FBRyxFQUFFLENBQUMsU0FBUyxDQUFDLENBQUM7QUFDakQsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG4vLyBUaGUgZm9ybWF0dGVyIGFuZCBDSSBkaXNhZ3JlZSBvbiBob3cgdGhpcyBpbXBvcnQgc3RhdGVtZW50IHNob3VsZCBiZSBmb3JtYXR0ZWQuIEJvdGggdHJ5IHRvIGtlZXBcbi8vIGl0IG9uIG9uZSBsaW5lLCB0b28sIHdoaWNoIGhhcyBnb3R0ZW4gdmVyeSBoYXJkIHRvIHJlYWQgJiBtYW5hZ2UuIFNvIGRpc2FibGUgdGhlIGZvcm1hdHRlciBmb3Jcbi8vIHRoaXMgc3RhdGVtZW50IG9ubHkuXG5cbi8qIGNsYW5nLWZvcm1hdCBvZmYgKi9cbmltcG9ydCB7XG4gIENvbXBvbmVudCxcbiAgRGlyZWN0aXZlLFxuICBFbnZpcm9ubWVudEluamVjdG9yLFxuICBJbmplY3RGbGFncyxcbiAgSW5qZWN0T3B0aW9ucyxcbiAgSW5qZWN0b3IsXG4gIE5nTW9kdWxlLFxuICBOZ1pvbmUsXG4gIFBpcGUsXG4gIFBsYXRmb3JtUmVmLFxuICBQcm92aWRlclRva2VuLFxuICBydW5JbkluamVjdGlvbkNvbnRleHQsXG4gIFR5cGUsXG4gIMm1Y29udmVydFRvQml0RmxhZ3MgYXMgY29udmVydFRvQml0RmxhZ3MsXG4gIMm1RGVmZXJCbG9ja0JlaGF2aW9yIGFzIERlZmVyQmxvY2tCZWhhdmlvcixcbiAgybVmbHVzaE1vZHVsZVNjb3BpbmdRdWV1ZUFzTXVjaEFzUG9zc2libGUgYXMgZmx1c2hNb2R1bGVTY29waW5nUXVldWVBc011Y2hBc1Bvc3NpYmxlLFxuICDJtWdldEFzeW5jQ2xhc3NNZXRhZGF0YUZuIGFzIGdldEFzeW5jQ2xhc3NNZXRhZGF0YUZuLFxuICDJtWdldFVua25vd25FbGVtZW50U3RyaWN0TW9kZSBhcyBnZXRVbmtub3duRWxlbWVudFN0cmljdE1vZGUsXG4gIMm1Z2V0VW5rbm93blByb3BlcnR5U3RyaWN0TW9kZSBhcyBnZXRVbmtub3duUHJvcGVydHlTdHJpY3RNb2RlLFxuICDJtVJlbmRlcjNDb21wb25lbnRGYWN0b3J5IGFzIENvbXBvbmVudEZhY3RvcnksXG4gIMm1UmVuZGVyM05nTW9kdWxlUmVmIGFzIE5nTW9kdWxlUmVmLFxuICDJtXJlc2V0Q29tcGlsZWRDb21wb25lbnRzIGFzIHJlc2V0Q29tcGlsZWRDb21wb25lbnRzLFxuICDJtXNldEFsbG93RHVwbGljYXRlTmdNb2R1bGVJZHNGb3JUZXN0IGFzIHNldEFsbG93RHVwbGljYXRlTmdNb2R1bGVJZHNGb3JUZXN0LFxuICDJtXNldFVua25vd25FbGVtZW50U3RyaWN0TW9kZSBhcyBzZXRVbmtub3duRWxlbWVudFN0cmljdE1vZGUsXG4gIMm1c2V0VW5rbm93blByb3BlcnR5U3RyaWN0TW9kZSBhcyBzZXRVbmtub3duUHJvcGVydHlTdHJpY3RNb2RlLFxuICDJtXN0cmluZ2lmeSBhcyBzdHJpbmdpZnksXG4gIMm1Wm9uZUF3YXJlUXVldWVpbmdTY2hlZHVsZXIgYXMgWm9uZUF3YXJlUXVldWVpbmdTY2hlZHVsZXIsXG59IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuXG4vKiBjbGFuZy1mb3JtYXQgb24gKi9cblxuXG5cbmltcG9ydCB7Q29tcG9uZW50Rml4dHVyZX0gZnJvbSAnLi9jb21wb25lbnRfZml4dHVyZSc7XG5pbXBvcnQge01ldGFkYXRhT3ZlcnJpZGV9IGZyb20gJy4vbWV0YWRhdGFfb3ZlcnJpZGUnO1xuaW1wb3J0IHtDb21wb25lbnRGaXh0dXJlQXV0b0RldGVjdCwgQ29tcG9uZW50Rml4dHVyZU5vTmdab25lLCBNb2R1bGVUZWFyZG93bk9wdGlvbnMsIFRFQVJET1dOX1RFU1RJTkdfTU9EVUxFX09OX0RFU1RST1lfREVGQVVMVCwgVGVzdENvbXBvbmVudFJlbmRlcmVyLCBUZXN0RW52aXJvbm1lbnRPcHRpb25zLCBUZXN0TW9kdWxlTWV0YWRhdGEsIFRIUk9XX09OX1VOS05PV05fRUxFTUVOVFNfREVGQVVMVCwgVEhST1dfT05fVU5LTk9XTl9QUk9QRVJUSUVTX0RFRkFVTFR9IGZyb20gJy4vdGVzdF9iZWRfY29tbW9uJztcbmltcG9ydCB7VGVzdEJlZENvbXBpbGVyfSBmcm9tICcuL3Rlc3RfYmVkX2NvbXBpbGVyJztcblxuLyoqXG4gKiBTdGF0aWMgbWV0aG9kcyBpbXBsZW1lbnRlZCBieSB0aGUgYFRlc3RCZWRgLlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBUZXN0QmVkU3RhdGljIGV4dGVuZHMgVGVzdEJlZCB7XG4gIG5ldyguLi5hcmdzOiBhbnlbXSk6IFRlc3RCZWQ7XG59XG5cbi8qKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgaW50ZXJmYWNlIFRlc3RCZWQge1xuICBnZXQgcGxhdGZvcm0oKTogUGxhdGZvcm1SZWY7XG5cbiAgZ2V0IG5nTW9kdWxlKCk6IFR5cGU8YW55PnxUeXBlPGFueT5bXTtcblxuICAvKipcbiAgICogSW5pdGlhbGl6ZSB0aGUgZW52aXJvbm1lbnQgZm9yIHRlc3Rpbmcgd2l0aCBhIGNvbXBpbGVyIGZhY3RvcnksIGEgUGxhdGZvcm1SZWYsIGFuZCBhblxuICAgKiBhbmd1bGFyIG1vZHVsZS4gVGhlc2UgYXJlIGNvbW1vbiB0byBldmVyeSB0ZXN0IGluIHRoZSBzdWl0ZS5cbiAgICpcbiAgICogVGhpcyBtYXkgb25seSBiZSBjYWxsZWQgb25jZSwgdG8gc2V0IHVwIHRoZSBjb21tb24gcHJvdmlkZXJzIGZvciB0aGUgY3VycmVudCB0ZXN0XG4gICAqIHN1aXRlIG9uIHRoZSBjdXJyZW50IHBsYXRmb3JtLiBJZiB5b3UgYWJzb2x1dGVseSBuZWVkIHRvIGNoYW5nZSB0aGUgcHJvdmlkZXJzLFxuICAgKiBmaXJzdCB1c2UgYHJlc2V0VGVzdEVudmlyb25tZW50YC5cbiAgICpcbiAgICogVGVzdCBtb2R1bGVzIGFuZCBwbGF0Zm9ybXMgZm9yIGluZGl2aWR1YWwgcGxhdGZvcm1zIGFyZSBhdmFpbGFibGUgZnJvbVxuICAgKiAnQGFuZ3VsYXIvPHBsYXRmb3JtX25hbWU+L3Rlc3RpbmcnLlxuICAgKi9cbiAgaW5pdFRlc3RFbnZpcm9ubWVudChcbiAgICAgIG5nTW9kdWxlOiBUeXBlPGFueT58VHlwZTxhbnk+W10sIHBsYXRmb3JtOiBQbGF0Zm9ybVJlZixcbiAgICAgIG9wdGlvbnM/OiBUZXN0RW52aXJvbm1lbnRPcHRpb25zKTogdm9pZDtcblxuICAvKipcbiAgICogUmVzZXQgdGhlIHByb3ZpZGVycyBmb3IgdGhlIHRlc3QgaW5qZWN0b3IuXG4gICAqL1xuICByZXNldFRlc3RFbnZpcm9ubWVudCgpOiB2b2lkO1xuXG4gIHJlc2V0VGVzdGluZ01vZHVsZSgpOiBUZXN0QmVkO1xuXG4gIGNvbmZpZ3VyZUNvbXBpbGVyKGNvbmZpZzoge3Byb3ZpZGVycz86IGFueVtdLCB1c2VKaXQ/OiBib29sZWFufSk6IHZvaWQ7XG5cbiAgY29uZmlndXJlVGVzdGluZ01vZHVsZShtb2R1bGVEZWY6IFRlc3RNb2R1bGVNZXRhZGF0YSk6IFRlc3RCZWQ7XG5cbiAgY29tcGlsZUNvbXBvbmVudHMoKTogUHJvbWlzZTxhbnk+O1xuXG4gIGluamVjdDxUPih0b2tlbjogUHJvdmlkZXJUb2tlbjxUPiwgbm90Rm91bmRWYWx1ZTogdW5kZWZpbmVkLCBvcHRpb25zOiBJbmplY3RPcHRpb25zJntcbiAgICBvcHRpb25hbD86IGZhbHNlXG4gIH0pOiBUO1xuICBpbmplY3Q8VD4odG9rZW46IFByb3ZpZGVyVG9rZW48VD4sIG5vdEZvdW5kVmFsdWU6IG51bGx8dW5kZWZpbmVkLCBvcHRpb25zOiBJbmplY3RPcHRpb25zKTogVHxudWxsO1xuICBpbmplY3Q8VD4odG9rZW46IFByb3ZpZGVyVG9rZW48VD4sIG5vdEZvdW5kVmFsdWU/OiBULCBvcHRpb25zPzogSW5qZWN0T3B0aW9ucyk6IFQ7XG4gIC8qKiBAZGVwcmVjYXRlZCB1c2Ugb2JqZWN0LWJhc2VkIGZsYWdzIChgSW5qZWN0T3B0aW9uc2ApIGluc3RlYWQuICovXG4gIGluamVjdDxUPih0b2tlbjogUHJvdmlkZXJUb2tlbjxUPiwgbm90Rm91bmRWYWx1ZT86IFQsIGZsYWdzPzogSW5qZWN0RmxhZ3MpOiBUO1xuICAvKiogQGRlcHJlY2F0ZWQgdXNlIG9iamVjdC1iYXNlZCBmbGFncyAoYEluamVjdE9wdGlvbnNgKSBpbnN0ZWFkLiAqL1xuICBpbmplY3Q8VD4odG9rZW46IFByb3ZpZGVyVG9rZW48VD4sIG5vdEZvdW5kVmFsdWU6IG51bGwsIGZsYWdzPzogSW5qZWN0RmxhZ3MpOiBUfG51bGw7XG5cbiAgLyoqIEBkZXByZWNhdGVkIGZyb20gdjkuMC4wIHVzZSBUZXN0QmVkLmluamVjdCAqL1xuICBnZXQ8VD4odG9rZW46IFByb3ZpZGVyVG9rZW48VD4sIG5vdEZvdW5kVmFsdWU/OiBULCBmbGFncz86IEluamVjdEZsYWdzKTogYW55O1xuICAvKiogQGRlcHJlY2F0ZWQgZnJvbSB2OS4wLjAgdXNlIFRlc3RCZWQuaW5qZWN0ICovXG4gIGdldCh0b2tlbjogYW55LCBub3RGb3VuZFZhbHVlPzogYW55KTogYW55O1xuXG4gIC8qKlxuICAgKiBSdW5zIHRoZSBnaXZlbiBmdW5jdGlvbiBpbiB0aGUgYEVudmlyb25tZW50SW5qZWN0b3JgIGNvbnRleHQgb2YgYFRlc3RCZWRgLlxuICAgKlxuICAgKiBAc2VlIHtAbGluayBFbnZpcm9ubWVudEluamVjdG9yI3J1bkluQ29udGV4dH1cbiAgICovXG4gIHJ1bkluSW5qZWN0aW9uQ29udGV4dDxUPihmbjogKCkgPT4gVCk6IFQ7XG5cbiAgZXhlY3V0ZSh0b2tlbnM6IGFueVtdLCBmbjogRnVuY3Rpb24sIGNvbnRleHQ/OiBhbnkpOiBhbnk7XG5cbiAgb3ZlcnJpZGVNb2R1bGUobmdNb2R1bGU6IFR5cGU8YW55Piwgb3ZlcnJpZGU6IE1ldGFkYXRhT3ZlcnJpZGU8TmdNb2R1bGU+KTogVGVzdEJlZDtcblxuICBvdmVycmlkZUNvbXBvbmVudChjb21wb25lbnQ6IFR5cGU8YW55Piwgb3ZlcnJpZGU6IE1ldGFkYXRhT3ZlcnJpZGU8Q29tcG9uZW50Pik6IFRlc3RCZWQ7XG5cbiAgb3ZlcnJpZGVEaXJlY3RpdmUoZGlyZWN0aXZlOiBUeXBlPGFueT4sIG92ZXJyaWRlOiBNZXRhZGF0YU92ZXJyaWRlPERpcmVjdGl2ZT4pOiBUZXN0QmVkO1xuXG4gIG92ZXJyaWRlUGlwZShwaXBlOiBUeXBlPGFueT4sIG92ZXJyaWRlOiBNZXRhZGF0YU92ZXJyaWRlPFBpcGU+KTogVGVzdEJlZDtcblxuICBvdmVycmlkZVRlbXBsYXRlKGNvbXBvbmVudDogVHlwZTxhbnk+LCB0ZW1wbGF0ZTogc3RyaW5nKTogVGVzdEJlZDtcblxuICAvKipcbiAgICogT3ZlcndyaXRlcyBhbGwgcHJvdmlkZXJzIGZvciB0aGUgZ2l2ZW4gdG9rZW4gd2l0aCB0aGUgZ2l2ZW4gcHJvdmlkZXIgZGVmaW5pdGlvbi5cbiAgICovXG4gIG92ZXJyaWRlUHJvdmlkZXIodG9rZW46IGFueSwgcHJvdmlkZXI6IHt1c2VGYWN0b3J5OiBGdW5jdGlvbiwgZGVwczogYW55W10sIG11bHRpPzogYm9vbGVhbn0pOlxuICAgICAgVGVzdEJlZDtcbiAgb3ZlcnJpZGVQcm92aWRlcih0b2tlbjogYW55LCBwcm92aWRlcjoge3VzZVZhbHVlOiBhbnksIG11bHRpPzogYm9vbGVhbn0pOiBUZXN0QmVkO1xuICBvdmVycmlkZVByb3ZpZGVyKFxuICAgICAgdG9rZW46IGFueSxcbiAgICAgIHByb3ZpZGVyOiB7dXNlRmFjdG9yeT86IEZ1bmN0aW9uLCB1c2VWYWx1ZT86IGFueSwgZGVwcz86IGFueVtdLCBtdWx0aT86IGJvb2xlYW59KTogVGVzdEJlZDtcblxuICBvdmVycmlkZVRlbXBsYXRlVXNpbmdUZXN0aW5nTW9kdWxlKGNvbXBvbmVudDogVHlwZTxhbnk+LCB0ZW1wbGF0ZTogc3RyaW5nKTogVGVzdEJlZDtcblxuICBjcmVhdGVDb21wb25lbnQ8VD4oY29tcG9uZW50OiBUeXBlPFQ+KTogQ29tcG9uZW50Rml4dHVyZTxUPjtcblxuXG4gIC8qKlxuICAgKiBFeGVjdXRlIGFueSBwZW5kaW5nIGVmZmVjdHMuXG4gICAqXG4gICAqIEBkZXZlbG9wZXJQcmV2aWV3XG4gICAqL1xuICBmbHVzaEVmZmVjdHMoKTogdm9pZDtcbn1cblxubGV0IF9uZXh0Um9vdEVsZW1lbnRJZCA9IDA7XG5cbi8qKlxuICogUmV0dXJucyBhIHNpbmdsZXRvbiBvZiB0aGUgYFRlc3RCZWRgIGNsYXNzLlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldFRlc3RCZWQoKTogVGVzdEJlZCB7XG4gIHJldHVybiBUZXN0QmVkSW1wbC5JTlNUQU5DRTtcbn1cblxuLyoqXG4gKiBAZGVzY3JpcHRpb25cbiAqIENvbmZpZ3VyZXMgYW5kIGluaXRpYWxpemVzIGVudmlyb25tZW50IGZvciB1bml0IHRlc3RpbmcgYW5kIHByb3ZpZGVzIG1ldGhvZHMgZm9yXG4gKiBjcmVhdGluZyBjb21wb25lbnRzIGFuZCBzZXJ2aWNlcyBpbiB1bml0IHRlc3RzLlxuICpcbiAqIFRlc3RCZWQgaXMgdGhlIHByaW1hcnkgYXBpIGZvciB3cml0aW5nIHVuaXQgdGVzdHMgZm9yIEFuZ3VsYXIgYXBwbGljYXRpb25zIGFuZCBsaWJyYXJpZXMuXG4gKi9cbmV4cG9ydCBjbGFzcyBUZXN0QmVkSW1wbCBpbXBsZW1lbnRzIFRlc3RCZWQge1xuICBwcml2YXRlIHN0YXRpYyBfSU5TVEFOQ0U6IFRlc3RCZWRJbXBsfG51bGwgPSBudWxsO1xuXG4gIHN0YXRpYyBnZXQgSU5TVEFOQ0UoKTogVGVzdEJlZEltcGwge1xuICAgIHJldHVybiBUZXN0QmVkSW1wbC5fSU5TVEFOQ0UgPSBUZXN0QmVkSW1wbC5fSU5TVEFOQ0UgfHwgbmV3IFRlc3RCZWRJbXBsKCk7XG4gIH1cblxuICAvKipcbiAgICogVGVhcmRvd24gb3B0aW9ucyB0aGF0IGhhdmUgYmVlbiBjb25maWd1cmVkIGF0IHRoZSBlbnZpcm9ubWVudCBsZXZlbC5cbiAgICogVXNlZCBhcyBhIGZhbGxiYWNrIGlmIG5vIGluc3RhbmNlLWxldmVsIG9wdGlvbnMgaGF2ZSBiZWVuIHByb3ZpZGVkLlxuICAgKi9cbiAgcHJpdmF0ZSBzdGF0aWMgX2Vudmlyb25tZW50VGVhcmRvd25PcHRpb25zOiBNb2R1bGVUZWFyZG93bk9wdGlvbnN8dW5kZWZpbmVkO1xuXG4gIC8qKlxuICAgKiBcIkVycm9yIG9uIHVua25vd24gZWxlbWVudHNcIiBvcHRpb24gdGhhdCBoYXMgYmVlbiBjb25maWd1cmVkIGF0IHRoZSBlbnZpcm9ubWVudCBsZXZlbC5cbiAgICogVXNlZCBhcyBhIGZhbGxiYWNrIGlmIG5vIGluc3RhbmNlLWxldmVsIG9wdGlvbiBoYXMgYmVlbiBwcm92aWRlZC5cbiAgICovXG4gIHByaXZhdGUgc3RhdGljIF9lbnZpcm9ubWVudEVycm9yT25Vbmtub3duRWxlbWVudHNPcHRpb246IGJvb2xlYW58dW5kZWZpbmVkO1xuXG4gIC8qKlxuICAgKiBcIkVycm9yIG9uIHVua25vd24gcHJvcGVydGllc1wiIG9wdGlvbiB0aGF0IGhhcyBiZWVuIGNvbmZpZ3VyZWQgYXQgdGhlIGVudmlyb25tZW50IGxldmVsLlxuICAgKiBVc2VkIGFzIGEgZmFsbGJhY2sgaWYgbm8gaW5zdGFuY2UtbGV2ZWwgb3B0aW9uIGhhcyBiZWVuIHByb3ZpZGVkLlxuICAgKi9cbiAgcHJpdmF0ZSBzdGF0aWMgX2Vudmlyb25tZW50RXJyb3JPblVua25vd25Qcm9wZXJ0aWVzT3B0aW9uOiBib29sZWFufHVuZGVmaW5lZDtcblxuICAvKipcbiAgICogVGVhcmRvd24gb3B0aW9ucyB0aGF0IGhhdmUgYmVlbiBjb25maWd1cmVkIGF0IHRoZSBgVGVzdEJlZGAgaW5zdGFuY2UgbGV2ZWwuXG4gICAqIFRoZXNlIG9wdGlvbnMgdGFrZSBwcmVjZWRlbmNlIG92ZXIgdGhlIGVudmlyb25tZW50LWxldmVsIG9uZXMuXG4gICAqL1xuICBwcml2YXRlIF9pbnN0YW5jZVRlYXJkb3duT3B0aW9uczogTW9kdWxlVGVhcmRvd25PcHRpb25zfHVuZGVmaW5lZDtcblxuICAvKipcbiAgICogRGVmZXIgYmxvY2sgYmVoYXZpb3Igb3B0aW9uIHRoYXQgc3BlY2lmaWVzIHdoZXRoZXIgZGVmZXIgYmxvY2tzIHdpbGwgYmUgdHJpZ2dlcmVkIG1hbnVhbGx5XG4gICAqIG9yIHNldCB0byBwbGF5IHRocm91Z2guXG4gICAqL1xuICBwcml2YXRlIF9pbnN0YW5jZURlZmVyQmxvY2tCZWhhdmlvciA9IERlZmVyQmxvY2tCZWhhdmlvci5NYW51YWw7XG5cbiAgLyoqXG4gICAqIFwiRXJyb3Igb24gdW5rbm93biBlbGVtZW50c1wiIG9wdGlvbiB0aGF0IGhhcyBiZWVuIGNvbmZpZ3VyZWQgYXQgdGhlIGBUZXN0QmVkYCBpbnN0YW5jZSBsZXZlbC5cbiAgICogVGhpcyBvcHRpb24gdGFrZXMgcHJlY2VkZW5jZSBvdmVyIHRoZSBlbnZpcm9ubWVudC1sZXZlbCBvbmUuXG4gICAqL1xuICBwcml2YXRlIF9pbnN0YW5jZUVycm9yT25Vbmtub3duRWxlbWVudHNPcHRpb246IGJvb2xlYW58dW5kZWZpbmVkO1xuXG4gIC8qKlxuICAgKiBcIkVycm9yIG9uIHVua25vd24gcHJvcGVydGllc1wiIG9wdGlvbiB0aGF0IGhhcyBiZWVuIGNvbmZpZ3VyZWQgYXQgdGhlIGBUZXN0QmVkYCBpbnN0YW5jZSBsZXZlbC5cbiAgICogVGhpcyBvcHRpb24gdGFrZXMgcHJlY2VkZW5jZSBvdmVyIHRoZSBlbnZpcm9ubWVudC1sZXZlbCBvbmUuXG4gICAqL1xuICBwcml2YXRlIF9pbnN0YW5jZUVycm9yT25Vbmtub3duUHJvcGVydGllc09wdGlvbjogYm9vbGVhbnx1bmRlZmluZWQ7XG5cbiAgLyoqXG4gICAqIFN0b3JlcyB0aGUgcHJldmlvdXMgXCJFcnJvciBvbiB1bmtub3duIGVsZW1lbnRzXCIgb3B0aW9uIHZhbHVlLFxuICAgKiBhbGxvd2luZyB0byByZXN0b3JlIGl0IGluIHRoZSByZXNldCB0ZXN0aW5nIG1vZHVsZSBsb2dpYy5cbiAgICovXG4gIHByaXZhdGUgX3ByZXZpb3VzRXJyb3JPblVua25vd25FbGVtZW50c09wdGlvbjogYm9vbGVhbnx1bmRlZmluZWQ7XG5cbiAgLyoqXG4gICAqIFN0b3JlcyB0aGUgcHJldmlvdXMgXCJFcnJvciBvbiB1bmtub3duIHByb3BlcnRpZXNcIiBvcHRpb24gdmFsdWUsXG4gICAqIGFsbG93aW5nIHRvIHJlc3RvcmUgaXQgaW4gdGhlIHJlc2V0IHRlc3RpbmcgbW9kdWxlIGxvZ2ljLlxuICAgKi9cbiAgcHJpdmF0ZSBfcHJldmlvdXNFcnJvck9uVW5rbm93blByb3BlcnRpZXNPcHRpb246IGJvb2xlYW58dW5kZWZpbmVkO1xuXG4gIC8qKlxuICAgKiBJbml0aWFsaXplIHRoZSBlbnZpcm9ubWVudCBmb3IgdGVzdGluZyB3aXRoIGEgY29tcGlsZXIgZmFjdG9yeSwgYSBQbGF0Zm9ybVJlZiwgYW5kIGFuXG4gICAqIGFuZ3VsYXIgbW9kdWxlLiBUaGVzZSBhcmUgY29tbW9uIHRvIGV2ZXJ5IHRlc3QgaW4gdGhlIHN1aXRlLlxuICAgKlxuICAgKiBUaGlzIG1heSBvbmx5IGJlIGNhbGxlZCBvbmNlLCB0byBzZXQgdXAgdGhlIGNvbW1vbiBwcm92aWRlcnMgZm9yIHRoZSBjdXJyZW50IHRlc3RcbiAgICogc3VpdGUgb24gdGhlIGN1cnJlbnQgcGxhdGZvcm0uIElmIHlvdSBhYnNvbHV0ZWx5IG5lZWQgdG8gY2hhbmdlIHRoZSBwcm92aWRlcnMsXG4gICAqIGZpcnN0IHVzZSBgcmVzZXRUZXN0RW52aXJvbm1lbnRgLlxuICAgKlxuICAgKiBUZXN0IG1vZHVsZXMgYW5kIHBsYXRmb3JtcyBmb3IgaW5kaXZpZHVhbCBwbGF0Zm9ybXMgYXJlIGF2YWlsYWJsZSBmcm9tXG4gICAqICdAYW5ndWxhci88cGxhdGZvcm1fbmFtZT4vdGVzdGluZycuXG4gICAqXG4gICAqIEBwdWJsaWNBcGlcbiAgICovXG4gIHN0YXRpYyBpbml0VGVzdEVudmlyb25tZW50KFxuICAgICAgbmdNb2R1bGU6IFR5cGU8YW55PnxUeXBlPGFueT5bXSwgcGxhdGZvcm06IFBsYXRmb3JtUmVmLFxuICAgICAgb3B0aW9ucz86IFRlc3RFbnZpcm9ubWVudE9wdGlvbnMpOiBUZXN0QmVkIHtcbiAgICBjb25zdCB0ZXN0QmVkID0gVGVzdEJlZEltcGwuSU5TVEFOQ0U7XG4gICAgdGVzdEJlZC5pbml0VGVzdEVudmlyb25tZW50KG5nTW9kdWxlLCBwbGF0Zm9ybSwgb3B0aW9ucyk7XG4gICAgcmV0dXJuIHRlc3RCZWQ7XG4gIH1cblxuICAvKipcbiAgICogUmVzZXQgdGhlIHByb3ZpZGVycyBmb3IgdGhlIHRlc3QgaW5qZWN0b3IuXG4gICAqXG4gICAqIEBwdWJsaWNBcGlcbiAgICovXG4gIHN0YXRpYyByZXNldFRlc3RFbnZpcm9ubWVudCgpOiB2b2lkIHtcbiAgICBUZXN0QmVkSW1wbC5JTlNUQU5DRS5yZXNldFRlc3RFbnZpcm9ubWVudCgpO1xuICB9XG5cbiAgc3RhdGljIGNvbmZpZ3VyZUNvbXBpbGVyKGNvbmZpZzoge3Byb3ZpZGVycz86IGFueVtdOyB1c2VKaXQ/OiBib29sZWFuO30pOiBUZXN0QmVkIHtcbiAgICByZXR1cm4gVGVzdEJlZEltcGwuSU5TVEFOQ0UuY29uZmlndXJlQ29tcGlsZXIoY29uZmlnKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBbGxvd3Mgb3ZlcnJpZGluZyBkZWZhdWx0IHByb3ZpZGVycywgZGlyZWN0aXZlcywgcGlwZXMsIG1vZHVsZXMgb2YgdGhlIHRlc3QgaW5qZWN0b3IsXG4gICAqIHdoaWNoIGFyZSBkZWZpbmVkIGluIHRlc3RfaW5qZWN0b3IuanNcbiAgICovXG4gIHN0YXRpYyBjb25maWd1cmVUZXN0aW5nTW9kdWxlKG1vZHVsZURlZjogVGVzdE1vZHVsZU1ldGFkYXRhKTogVGVzdEJlZCB7XG4gICAgcmV0dXJuIFRlc3RCZWRJbXBsLklOU1RBTkNFLmNvbmZpZ3VyZVRlc3RpbmdNb2R1bGUobW9kdWxlRGVmKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb21waWxlIGNvbXBvbmVudHMgd2l0aCBhIGB0ZW1wbGF0ZVVybGAgZm9yIHRoZSB0ZXN0J3MgTmdNb2R1bGUuXG4gICAqIEl0IGlzIG5lY2Vzc2FyeSB0byBjYWxsIHRoaXMgZnVuY3Rpb25cbiAgICogYXMgZmV0Y2hpbmcgdXJscyBpcyBhc3luY2hyb25vdXMuXG4gICAqL1xuICBzdGF0aWMgY29tcGlsZUNvbXBvbmVudHMoKTogUHJvbWlzZTxhbnk+IHtcbiAgICByZXR1cm4gVGVzdEJlZEltcGwuSU5TVEFOQ0UuY29tcGlsZUNvbXBvbmVudHMoKTtcbiAgfVxuXG4gIHN0YXRpYyBvdmVycmlkZU1vZHVsZShuZ01vZHVsZTogVHlwZTxhbnk+LCBvdmVycmlkZTogTWV0YWRhdGFPdmVycmlkZTxOZ01vZHVsZT4pOiBUZXN0QmVkIHtcbiAgICByZXR1cm4gVGVzdEJlZEltcGwuSU5TVEFOQ0Uub3ZlcnJpZGVNb2R1bGUobmdNb2R1bGUsIG92ZXJyaWRlKTtcbiAgfVxuXG4gIHN0YXRpYyBvdmVycmlkZUNvbXBvbmVudChjb21wb25lbnQ6IFR5cGU8YW55Piwgb3ZlcnJpZGU6IE1ldGFkYXRhT3ZlcnJpZGU8Q29tcG9uZW50Pik6IFRlc3RCZWQge1xuICAgIHJldHVybiBUZXN0QmVkSW1wbC5JTlNUQU5DRS5vdmVycmlkZUNvbXBvbmVudChjb21wb25lbnQsIG92ZXJyaWRlKTtcbiAgfVxuXG4gIHN0YXRpYyBvdmVycmlkZURpcmVjdGl2ZShkaXJlY3RpdmU6IFR5cGU8YW55Piwgb3ZlcnJpZGU6IE1ldGFkYXRhT3ZlcnJpZGU8RGlyZWN0aXZlPik6IFRlc3RCZWQge1xuICAgIHJldHVybiBUZXN0QmVkSW1wbC5JTlNUQU5DRS5vdmVycmlkZURpcmVjdGl2ZShkaXJlY3RpdmUsIG92ZXJyaWRlKTtcbiAgfVxuXG4gIHN0YXRpYyBvdmVycmlkZVBpcGUocGlwZTogVHlwZTxhbnk+LCBvdmVycmlkZTogTWV0YWRhdGFPdmVycmlkZTxQaXBlPik6IFRlc3RCZWQge1xuICAgIHJldHVybiBUZXN0QmVkSW1wbC5JTlNUQU5DRS5vdmVycmlkZVBpcGUocGlwZSwgb3ZlcnJpZGUpO1xuICB9XG5cbiAgc3RhdGljIG92ZXJyaWRlVGVtcGxhdGUoY29tcG9uZW50OiBUeXBlPGFueT4sIHRlbXBsYXRlOiBzdHJpbmcpOiBUZXN0QmVkIHtcbiAgICByZXR1cm4gVGVzdEJlZEltcGwuSU5TVEFOQ0Uub3ZlcnJpZGVUZW1wbGF0ZShjb21wb25lbnQsIHRlbXBsYXRlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBPdmVycmlkZXMgdGhlIHRlbXBsYXRlIG9mIHRoZSBnaXZlbiBjb21wb25lbnQsIGNvbXBpbGluZyB0aGUgdGVtcGxhdGVcbiAgICogaW4gdGhlIGNvbnRleHQgb2YgdGhlIFRlc3RpbmdNb2R1bGUuXG4gICAqXG4gICAqIE5vdGU6IFRoaXMgd29ya3MgZm9yIEpJVCBhbmQgQU9UZWQgY29tcG9uZW50cyBhcyB3ZWxsLlxuICAgKi9cbiAgc3RhdGljIG92ZXJyaWRlVGVtcGxhdGVVc2luZ1Rlc3RpbmdNb2R1bGUoY29tcG9uZW50OiBUeXBlPGFueT4sIHRlbXBsYXRlOiBzdHJpbmcpOiBUZXN0QmVkIHtcbiAgICByZXR1cm4gVGVzdEJlZEltcGwuSU5TVEFOQ0Uub3ZlcnJpZGVUZW1wbGF0ZVVzaW5nVGVzdGluZ01vZHVsZShjb21wb25lbnQsIHRlbXBsYXRlKTtcbiAgfVxuXG4gIHN0YXRpYyBvdmVycmlkZVByb3ZpZGVyKHRva2VuOiBhbnksIHByb3ZpZGVyOiB7XG4gICAgdXNlRmFjdG9yeTogRnVuY3Rpb24sXG4gICAgZGVwczogYW55W10sXG4gIH0pOiBUZXN0QmVkO1xuICBzdGF0aWMgb3ZlcnJpZGVQcm92aWRlcih0b2tlbjogYW55LCBwcm92aWRlcjoge3VzZVZhbHVlOiBhbnk7fSk6IFRlc3RCZWQ7XG4gIHN0YXRpYyBvdmVycmlkZVByb3ZpZGVyKHRva2VuOiBhbnksIHByb3ZpZGVyOiB7XG4gICAgdXNlRmFjdG9yeT86IEZ1bmN0aW9uLFxuICAgIHVzZVZhbHVlPzogYW55LFxuICAgIGRlcHM/OiBhbnlbXSxcbiAgfSk6IFRlc3RCZWQge1xuICAgIHJldHVybiBUZXN0QmVkSW1wbC5JTlNUQU5DRS5vdmVycmlkZVByb3ZpZGVyKHRva2VuLCBwcm92aWRlcik7XG4gIH1cblxuICBzdGF0aWMgaW5qZWN0PFQ+KHRva2VuOiBQcm92aWRlclRva2VuPFQ+LCBub3RGb3VuZFZhbHVlOiB1bmRlZmluZWQsIG9wdGlvbnM6IEluamVjdE9wdGlvbnMme1xuICAgIG9wdGlvbmFsPzogZmFsc2VcbiAgfSk6IFQ7XG4gIHN0YXRpYyBpbmplY3Q8VD4odG9rZW46IFByb3ZpZGVyVG9rZW48VD4sIG5vdEZvdW5kVmFsdWU6IG51bGx8dW5kZWZpbmVkLCBvcHRpb25zOiBJbmplY3RPcHRpb25zKTpcbiAgICAgIFR8bnVsbDtcbiAgc3RhdGljIGluamVjdDxUPih0b2tlbjogUHJvdmlkZXJUb2tlbjxUPiwgbm90Rm91bmRWYWx1ZT86IFQsIG9wdGlvbnM/OiBJbmplY3RPcHRpb25zKTogVDtcbiAgLyoqIEBkZXByZWNhdGVkIHVzZSBvYmplY3QtYmFzZWQgZmxhZ3MgKGBJbmplY3RPcHRpb25zYCkgaW5zdGVhZC4gKi9cbiAgc3RhdGljIGluamVjdDxUPih0b2tlbjogUHJvdmlkZXJUb2tlbjxUPiwgbm90Rm91bmRWYWx1ZT86IFQsIGZsYWdzPzogSW5qZWN0RmxhZ3MpOiBUO1xuICAvKiogQGRlcHJlY2F0ZWQgdXNlIG9iamVjdC1iYXNlZCBmbGFncyAoYEluamVjdE9wdGlvbnNgKSBpbnN0ZWFkLiAqL1xuICBzdGF0aWMgaW5qZWN0PFQ+KHRva2VuOiBQcm92aWRlclRva2VuPFQ+LCBub3RGb3VuZFZhbHVlOiBudWxsLCBmbGFncz86IEluamVjdEZsYWdzKTogVHxudWxsO1xuICBzdGF0aWMgaW5qZWN0PFQ+KFxuICAgICAgdG9rZW46IFByb3ZpZGVyVG9rZW48VD4sIG5vdEZvdW5kVmFsdWU/OiBUfG51bGwsIGZsYWdzPzogSW5qZWN0RmxhZ3N8SW5qZWN0T3B0aW9ucyk6IFR8bnVsbCB7XG4gICAgcmV0dXJuIFRlc3RCZWRJbXBsLklOU1RBTkNFLmluamVjdCh0b2tlbiwgbm90Rm91bmRWYWx1ZSwgY29udmVydFRvQml0RmxhZ3MoZmxhZ3MpKTtcbiAgfVxuXG4gIC8qKiBAZGVwcmVjYXRlZCBmcm9tIHY5LjAuMCB1c2UgVGVzdEJlZC5pbmplY3QgKi9cbiAgc3RhdGljIGdldDxUPih0b2tlbjogUHJvdmlkZXJUb2tlbjxUPiwgbm90Rm91bmRWYWx1ZT86IFQsIGZsYWdzPzogSW5qZWN0RmxhZ3MpOiBhbnk7XG4gIC8qKiBAZGVwcmVjYXRlZCBmcm9tIHY5LjAuMCB1c2UgVGVzdEJlZC5pbmplY3QgKi9cbiAgc3RhdGljIGdldCh0b2tlbjogYW55LCBub3RGb3VuZFZhbHVlPzogYW55KTogYW55O1xuICAvKiogQGRlcHJlY2F0ZWQgZnJvbSB2OS4wLjAgdXNlIFRlc3RCZWQuaW5qZWN0ICovXG4gIHN0YXRpYyBnZXQoXG4gICAgICB0b2tlbjogYW55LCBub3RGb3VuZFZhbHVlOiBhbnkgPSBJbmplY3Rvci5USFJPV19JRl9OT1RfRk9VTkQsXG4gICAgICBmbGFnczogSW5qZWN0RmxhZ3MgPSBJbmplY3RGbGFncy5EZWZhdWx0KTogYW55IHtcbiAgICByZXR1cm4gVGVzdEJlZEltcGwuSU5TVEFOQ0UuaW5qZWN0KHRva2VuLCBub3RGb3VuZFZhbHVlLCBmbGFncyk7XG4gIH1cblxuICAvKipcbiAgICogUnVucyB0aGUgZ2l2ZW4gZnVuY3Rpb24gaW4gdGhlIGBFbnZpcm9ubWVudEluamVjdG9yYCBjb250ZXh0IG9mIGBUZXN0QmVkYC5cbiAgICpcbiAgICogQHNlZSB7QGxpbmsgRW52aXJvbm1lbnRJbmplY3RvciNydW5JbkNvbnRleHR9XG4gICAqL1xuICBzdGF0aWMgcnVuSW5JbmplY3Rpb25Db250ZXh0PFQ+KGZuOiAoKSA9PiBUKTogVCB7XG4gICAgcmV0dXJuIFRlc3RCZWRJbXBsLklOU1RBTkNFLnJ1bkluSW5qZWN0aW9uQ29udGV4dChmbik7XG4gIH1cblxuICBzdGF0aWMgY3JlYXRlQ29tcG9uZW50PFQ+KGNvbXBvbmVudDogVHlwZTxUPik6IENvbXBvbmVudEZpeHR1cmU8VD4ge1xuICAgIHJldHVybiBUZXN0QmVkSW1wbC5JTlNUQU5DRS5jcmVhdGVDb21wb25lbnQoY29tcG9uZW50KTtcbiAgfVxuXG4gIHN0YXRpYyByZXNldFRlc3RpbmdNb2R1bGUoKTogVGVzdEJlZCB7XG4gICAgcmV0dXJuIFRlc3RCZWRJbXBsLklOU1RBTkNFLnJlc2V0VGVzdGluZ01vZHVsZSgpO1xuICB9XG5cbiAgc3RhdGljIGV4ZWN1dGUodG9rZW5zOiBhbnlbXSwgZm46IEZ1bmN0aW9uLCBjb250ZXh0PzogYW55KTogYW55IHtcbiAgICByZXR1cm4gVGVzdEJlZEltcGwuSU5TVEFOQ0UuZXhlY3V0ZSh0b2tlbnMsIGZuLCBjb250ZXh0KTtcbiAgfVxuXG4gIHN0YXRpYyBnZXQgcGxhdGZvcm0oKTogUGxhdGZvcm1SZWYge1xuICAgIHJldHVybiBUZXN0QmVkSW1wbC5JTlNUQU5DRS5wbGF0Zm9ybTtcbiAgfVxuXG4gIHN0YXRpYyBnZXQgbmdNb2R1bGUoKTogVHlwZTxhbnk+fFR5cGU8YW55PltdIHtcbiAgICByZXR1cm4gVGVzdEJlZEltcGwuSU5TVEFOQ0UubmdNb2R1bGU7XG4gIH1cblxuICBzdGF0aWMgZmx1c2hFZmZlY3RzKCk6IHZvaWQge1xuICAgIHJldHVybiBUZXN0QmVkSW1wbC5JTlNUQU5DRS5mbHVzaEVmZmVjdHMoKTtcbiAgfVxuXG4gIC8vIFByb3BlcnRpZXNcblxuICBwbGF0Zm9ybTogUGxhdGZvcm1SZWYgPSBudWxsITtcbiAgbmdNb2R1bGU6IFR5cGU8YW55PnxUeXBlPGFueT5bXSA9IG51bGwhO1xuXG4gIHByaXZhdGUgX2NvbXBpbGVyOiBUZXN0QmVkQ29tcGlsZXJ8bnVsbCA9IG51bGw7XG4gIHByaXZhdGUgX3Rlc3RNb2R1bGVSZWY6IE5nTW9kdWxlUmVmPGFueT58bnVsbCA9IG51bGw7XG5cbiAgcHJpdmF0ZSBfYWN0aXZlRml4dHVyZXM6IENvbXBvbmVudEZpeHR1cmU8YW55PltdID0gW107XG5cbiAgLyoqXG4gICAqIEludGVybmFsLW9ubHkgZmxhZyB0byBpbmRpY2F0ZSB3aGV0aGVyIGEgbW9kdWxlXG4gICAqIHNjb3BpbmcgcXVldWUgaGFzIGJlZW4gY2hlY2tlZCBhbmQgZmx1c2hlZCBhbHJlYWR5LlxuICAgKiBAbm9kb2NcbiAgICovXG4gIGdsb2JhbENvbXBpbGF0aW9uQ2hlY2tlZCA9IGZhbHNlO1xuXG4gIC8qKlxuICAgKiBJbml0aWFsaXplIHRoZSBlbnZpcm9ubWVudCBmb3IgdGVzdGluZyB3aXRoIGEgY29tcGlsZXIgZmFjdG9yeSwgYSBQbGF0Zm9ybVJlZiwgYW5kIGFuXG4gICAqIGFuZ3VsYXIgbW9kdWxlLiBUaGVzZSBhcmUgY29tbW9uIHRvIGV2ZXJ5IHRlc3QgaW4gdGhlIHN1aXRlLlxuICAgKlxuICAgKiBUaGlzIG1heSBvbmx5IGJlIGNhbGxlZCBvbmNlLCB0byBzZXQgdXAgdGhlIGNvbW1vbiBwcm92aWRlcnMgZm9yIHRoZSBjdXJyZW50IHRlc3RcbiAgICogc3VpdGUgb24gdGhlIGN1cnJlbnQgcGxhdGZvcm0uIElmIHlvdSBhYnNvbHV0ZWx5IG5lZWQgdG8gY2hhbmdlIHRoZSBwcm92aWRlcnMsXG4gICAqIGZpcnN0IHVzZSBgcmVzZXRUZXN0RW52aXJvbm1lbnRgLlxuICAgKlxuICAgKiBUZXN0IG1vZHVsZXMgYW5kIHBsYXRmb3JtcyBmb3IgaW5kaXZpZHVhbCBwbGF0Zm9ybXMgYXJlIGF2YWlsYWJsZSBmcm9tXG4gICAqICdAYW5ndWxhci88cGxhdGZvcm1fbmFtZT4vdGVzdGluZycuXG4gICAqXG4gICAqIEBwdWJsaWNBcGlcbiAgICovXG4gIGluaXRUZXN0RW52aXJvbm1lbnQoXG4gICAgICBuZ01vZHVsZTogVHlwZTxhbnk+fFR5cGU8YW55PltdLCBwbGF0Zm9ybTogUGxhdGZvcm1SZWYsXG4gICAgICBvcHRpb25zPzogVGVzdEVudmlyb25tZW50T3B0aW9ucyk6IHZvaWQge1xuICAgIGlmICh0aGlzLnBsYXRmb3JtIHx8IHRoaXMubmdNb2R1bGUpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignQ2Fubm90IHNldCBiYXNlIHByb3ZpZGVycyBiZWNhdXNlIGl0IGhhcyBhbHJlYWR5IGJlZW4gY2FsbGVkJyk7XG4gICAgfVxuXG4gICAgVGVzdEJlZEltcGwuX2Vudmlyb25tZW50VGVhcmRvd25PcHRpb25zID0gb3B0aW9ucz8udGVhcmRvd247XG5cbiAgICBUZXN0QmVkSW1wbC5fZW52aXJvbm1lbnRFcnJvck9uVW5rbm93bkVsZW1lbnRzT3B0aW9uID0gb3B0aW9ucz8uZXJyb3JPblVua25vd25FbGVtZW50cztcblxuICAgIFRlc3RCZWRJbXBsLl9lbnZpcm9ubWVudEVycm9yT25Vbmtub3duUHJvcGVydGllc09wdGlvbiA9IG9wdGlvbnM/LmVycm9yT25Vbmtub3duUHJvcGVydGllcztcblxuICAgIHRoaXMucGxhdGZvcm0gPSBwbGF0Zm9ybTtcbiAgICB0aGlzLm5nTW9kdWxlID0gbmdNb2R1bGU7XG4gICAgdGhpcy5fY29tcGlsZXIgPSBuZXcgVGVzdEJlZENvbXBpbGVyKHRoaXMucGxhdGZvcm0sIHRoaXMubmdNb2R1bGUpO1xuXG4gICAgLy8gVGVzdEJlZCBkb2VzIG5vdCBoYXZlIGFuIEFQSSB3aGljaCBjYW4gcmVsaWFibHkgZGV0ZWN0IHRoZSBzdGFydCBvZiBhIHRlc3QsIGFuZCB0aHVzIGNvdWxkIGJlXG4gICAgLy8gdXNlZCB0byB0cmFjayB0aGUgc3RhdGUgb2YgdGhlIE5nTW9kdWxlIHJlZ2lzdHJ5IGFuZCByZXNldCBpdCBjb3JyZWN0bHkuIEluc3RlYWQsIHdoZW4gd2VcbiAgICAvLyBrbm93IHdlJ3JlIGluIGEgdGVzdGluZyBzY2VuYXJpbywgd2UgZGlzYWJsZSB0aGUgY2hlY2sgZm9yIGR1cGxpY2F0ZSBOZ01vZHVsZSByZWdpc3RyYXRpb25cbiAgICAvLyBjb21wbGV0ZWx5LlxuICAgIHNldEFsbG93RHVwbGljYXRlTmdNb2R1bGVJZHNGb3JUZXN0KHRydWUpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlc2V0IHRoZSBwcm92aWRlcnMgZm9yIHRoZSB0ZXN0IGluamVjdG9yLlxuICAgKlxuICAgKiBAcHVibGljQXBpXG4gICAqL1xuICByZXNldFRlc3RFbnZpcm9ubWVudCgpOiB2b2lkIHtcbiAgICB0aGlzLnJlc2V0VGVzdGluZ01vZHVsZSgpO1xuICAgIHRoaXMuX2NvbXBpbGVyID0gbnVsbDtcbiAgICB0aGlzLnBsYXRmb3JtID0gbnVsbCE7XG4gICAgdGhpcy5uZ01vZHVsZSA9IG51bGwhO1xuICAgIFRlc3RCZWRJbXBsLl9lbnZpcm9ubWVudFRlYXJkb3duT3B0aW9ucyA9IHVuZGVmaW5lZDtcbiAgICBzZXRBbGxvd0R1cGxpY2F0ZU5nTW9kdWxlSWRzRm9yVGVzdChmYWxzZSk7XG4gIH1cblxuICByZXNldFRlc3RpbmdNb2R1bGUoKTogdGhpcyB7XG4gICAgdGhpcy5jaGVja0dsb2JhbENvbXBpbGF0aW9uRmluaXNoZWQoKTtcbiAgICByZXNldENvbXBpbGVkQ29tcG9uZW50cygpO1xuICAgIGlmICh0aGlzLl9jb21waWxlciAhPT0gbnVsbCkge1xuICAgICAgdGhpcy5jb21waWxlci5yZXN0b3JlT3JpZ2luYWxTdGF0ZSgpO1xuICAgIH1cbiAgICB0aGlzLl9jb21waWxlciA9IG5ldyBUZXN0QmVkQ29tcGlsZXIodGhpcy5wbGF0Zm9ybSwgdGhpcy5uZ01vZHVsZSk7XG4gICAgLy8gUmVzdG9yZSB0aGUgcHJldmlvdXMgdmFsdWUgb2YgdGhlIFwiZXJyb3Igb24gdW5rbm93biBlbGVtZW50c1wiIG9wdGlvblxuICAgIHNldFVua25vd25FbGVtZW50U3RyaWN0TW9kZShcbiAgICAgICAgdGhpcy5fcHJldmlvdXNFcnJvck9uVW5rbm93bkVsZW1lbnRzT3B0aW9uID8/IFRIUk9XX09OX1VOS05PV05fRUxFTUVOVFNfREVGQVVMVCk7XG4gICAgLy8gUmVzdG9yZSB0aGUgcHJldmlvdXMgdmFsdWUgb2YgdGhlIFwiZXJyb3Igb24gdW5rbm93biBwcm9wZXJ0aWVzXCIgb3B0aW9uXG4gICAgc2V0VW5rbm93blByb3BlcnR5U3RyaWN0TW9kZShcbiAgICAgICAgdGhpcy5fcHJldmlvdXNFcnJvck9uVW5rbm93blByb3BlcnRpZXNPcHRpb24gPz8gVEhST1dfT05fVU5LTk9XTl9QUk9QRVJUSUVTX0RFRkFVTFQpO1xuXG4gICAgLy8gV2UgaGF2ZSB0byBjaGFpbiBhIGNvdXBsZSBvZiB0cnkvZmluYWxseSBibG9ja3MsIGJlY2F1c2UgZWFjaCBzdGVwIGNhblxuICAgIC8vIHRocm93IGVycm9ycyBhbmQgd2UgZG9uJ3Qgd2FudCBpdCB0byBpbnRlcnJ1cHQgdGhlIG5leHQgc3RlcCBhbmQgd2UgYWxzb1xuICAgIC8vIHdhbnQgYW4gZXJyb3IgdG8gYmUgdGhyb3duIGF0IHRoZSBlbmQuXG4gICAgdHJ5IHtcbiAgICAgIHRoaXMuZGVzdHJveUFjdGl2ZUZpeHR1cmVzKCk7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGlmICh0aGlzLnNob3VsZFRlYXJEb3duVGVzdGluZ01vZHVsZSgpKSB7XG4gICAgICAgICAgdGhpcy50ZWFyRG93blRlc3RpbmdNb2R1bGUoKTtcbiAgICAgICAgfVxuICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgdGhpcy5fdGVzdE1vZHVsZVJlZiA9IG51bGw7XG4gICAgICAgIHRoaXMuX2luc3RhbmNlVGVhcmRvd25PcHRpb25zID0gdW5kZWZpbmVkO1xuICAgICAgICB0aGlzLl9pbnN0YW5jZUVycm9yT25Vbmtub3duRWxlbWVudHNPcHRpb24gPSB1bmRlZmluZWQ7XG4gICAgICAgIHRoaXMuX2luc3RhbmNlRXJyb3JPblVua25vd25Qcm9wZXJ0aWVzT3B0aW9uID0gdW5kZWZpbmVkO1xuICAgICAgICB0aGlzLl9pbnN0YW5jZURlZmVyQmxvY2tCZWhhdmlvciA9IERlZmVyQmxvY2tCZWhhdmlvci5NYW51YWw7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgY29uZmlndXJlQ29tcGlsZXIoY29uZmlnOiB7cHJvdmlkZXJzPzogYW55W107IHVzZUppdD86IGJvb2xlYW47fSk6IHRoaXMge1xuICAgIGlmIChjb25maWcudXNlSml0ICE9IG51bGwpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignSklUIGNvbXBpbGVyIGlzIG5vdCBjb25maWd1cmFibGUgdmlhIFRlc3RCZWQgQVBJcy4nKTtcbiAgICB9XG5cbiAgICBpZiAoY29uZmlnLnByb3ZpZGVycyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzLmNvbXBpbGVyLnNldENvbXBpbGVyUHJvdmlkZXJzKGNvbmZpZy5wcm92aWRlcnMpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIGNvbmZpZ3VyZVRlc3RpbmdNb2R1bGUobW9kdWxlRGVmOiBUZXN0TW9kdWxlTWV0YWRhdGEpOiB0aGlzIHtcbiAgICB0aGlzLmFzc2VydE5vdEluc3RhbnRpYXRlZCgnVGVzdEJlZC5jb25maWd1cmVUZXN0aW5nTW9kdWxlJywgJ2NvbmZpZ3VyZSB0aGUgdGVzdCBtb2R1bGUnKTtcblxuICAgIC8vIFRyaWdnZXIgbW9kdWxlIHNjb3BpbmcgcXVldWUgZmx1c2ggYmVmb3JlIGV4ZWN1dGluZyBvdGhlciBUZXN0QmVkIG9wZXJhdGlvbnMgaW4gYSB0ZXN0LlxuICAgIC8vIFRoaXMgaXMgbmVlZGVkIGZvciB0aGUgZmlyc3QgdGVzdCBpbnZvY2F0aW9uIHRvIGVuc3VyZSB0aGF0IGdsb2JhbGx5IGRlY2xhcmVkIG1vZHVsZXMgaGF2ZVxuICAgIC8vIHRoZWlyIGNvbXBvbmVudHMgc2NvcGVkIHByb3Blcmx5LiBTZWUgdGhlIGBjaGVja0dsb2JhbENvbXBpbGF0aW9uRmluaXNoZWRgIGZ1bmN0aW9uXG4gICAgLy8gZGVzY3JpcHRpb24gZm9yIGFkZGl0aW9uYWwgaW5mby5cbiAgICB0aGlzLmNoZWNrR2xvYmFsQ29tcGlsYXRpb25GaW5pc2hlZCgpO1xuXG4gICAgLy8gQWx3YXlzIHJlLWFzc2lnbiB0aGUgb3B0aW9ucywgZXZlbiBpZiB0aGV5J3JlIHVuZGVmaW5lZC5cbiAgICAvLyBUaGlzIGVuc3VyZXMgdGhhdCB3ZSBkb24ndCBjYXJyeSB0aGVtIGJldHdlZW4gdGVzdHMuXG4gICAgdGhpcy5faW5zdGFuY2VUZWFyZG93bk9wdGlvbnMgPSBtb2R1bGVEZWYudGVhcmRvd247XG4gICAgdGhpcy5faW5zdGFuY2VFcnJvck9uVW5rbm93bkVsZW1lbnRzT3B0aW9uID0gbW9kdWxlRGVmLmVycm9yT25Vbmtub3duRWxlbWVudHM7XG4gICAgdGhpcy5faW5zdGFuY2VFcnJvck9uVW5rbm93blByb3BlcnRpZXNPcHRpb24gPSBtb2R1bGVEZWYuZXJyb3JPblVua25vd25Qcm9wZXJ0aWVzO1xuICAgIHRoaXMuX2luc3RhbmNlRGVmZXJCbG9ja0JlaGF2aW9yID0gbW9kdWxlRGVmLmRlZmVyQmxvY2tCZWhhdmlvciA/PyBEZWZlckJsb2NrQmVoYXZpb3IuTWFudWFsO1xuICAgIC8vIFN0b3JlIHRoZSBjdXJyZW50IHZhbHVlIG9mIHRoZSBzdHJpY3QgbW9kZSBvcHRpb24sXG4gICAgLy8gc28gd2UgY2FuIHJlc3RvcmUgaXQgbGF0ZXJcbiAgICB0aGlzLl9wcmV2aW91c0Vycm9yT25Vbmtub3duRWxlbWVudHNPcHRpb24gPSBnZXRVbmtub3duRWxlbWVudFN0cmljdE1vZGUoKTtcbiAgICBzZXRVbmtub3duRWxlbWVudFN0cmljdE1vZGUodGhpcy5zaG91bGRUaHJvd0Vycm9yT25Vbmtub3duRWxlbWVudHMoKSk7XG4gICAgdGhpcy5fcHJldmlvdXNFcnJvck9uVW5rbm93blByb3BlcnRpZXNPcHRpb24gPSBnZXRVbmtub3duUHJvcGVydHlTdHJpY3RNb2RlKCk7XG4gICAgc2V0VW5rbm93blByb3BlcnR5U3RyaWN0TW9kZSh0aGlzLnNob3VsZFRocm93RXJyb3JPblVua25vd25Qcm9wZXJ0aWVzKCkpO1xuICAgIHRoaXMuY29tcGlsZXIuY29uZmlndXJlVGVzdGluZ01vZHVsZShtb2R1bGVEZWYpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgY29tcGlsZUNvbXBvbmVudHMoKTogUHJvbWlzZTxhbnk+IHtcbiAgICByZXR1cm4gdGhpcy5jb21waWxlci5jb21waWxlQ29tcG9uZW50cygpO1xuICB9XG5cbiAgaW5qZWN0PFQ+KHRva2VuOiBQcm92aWRlclRva2VuPFQ+LCBub3RGb3VuZFZhbHVlOiB1bmRlZmluZWQsIG9wdGlvbnM6IEluamVjdE9wdGlvbnMme1xuICAgIG9wdGlvbmFsOiB0cnVlXG4gIH0pOiBUfG51bGw7XG4gIGluamVjdDxUPih0b2tlbjogUHJvdmlkZXJUb2tlbjxUPiwgbm90Rm91bmRWYWx1ZT86IFQsIG9wdGlvbnM/OiBJbmplY3RPcHRpb25zKTogVDtcbiAgaW5qZWN0PFQ+KHRva2VuOiBQcm92aWRlclRva2VuPFQ+LCBub3RGb3VuZFZhbHVlOiBudWxsLCBvcHRpb25zPzogSW5qZWN0T3B0aW9ucyk6IFR8bnVsbDtcbiAgLyoqIEBkZXByZWNhdGVkIHVzZSBvYmplY3QtYmFzZWQgZmxhZ3MgKGBJbmplY3RPcHRpb25zYCkgaW5zdGVhZC4gKi9cbiAgaW5qZWN0PFQ+KHRva2VuOiBQcm92aWRlclRva2VuPFQ+LCBub3RGb3VuZFZhbHVlPzogVCwgZmxhZ3M/OiBJbmplY3RGbGFncyk6IFQ7XG4gIC8qKiBAZGVwcmVjYXRlZCB1c2Ugb2JqZWN0LWJhc2VkIGZsYWdzIChgSW5qZWN0T3B0aW9uc2ApIGluc3RlYWQuICovXG4gIGluamVjdDxUPih0b2tlbjogUHJvdmlkZXJUb2tlbjxUPiwgbm90Rm91bmRWYWx1ZTogbnVsbCwgZmxhZ3M/OiBJbmplY3RGbGFncyk6IFR8bnVsbDtcbiAgaW5qZWN0PFQ+KHRva2VuOiBQcm92aWRlclRva2VuPFQ+LCBub3RGb3VuZFZhbHVlPzogVHxudWxsLCBmbGFncz86IEluamVjdEZsYWdzfEluamVjdE9wdGlvbnMpOiBUXG4gICAgICB8bnVsbCB7XG4gICAgaWYgKHRva2VuIGFzIHVua25vd24gPT09IFRlc3RCZWQpIHtcbiAgICAgIHJldHVybiB0aGlzIGFzIGFueTtcbiAgICB9XG4gICAgY29uc3QgVU5ERUZJTkVEID0ge30gYXMgdW5rbm93biBhcyBUO1xuICAgIGNvbnN0IHJlc3VsdCA9IHRoaXMudGVzdE1vZHVsZVJlZi5pbmplY3Rvci5nZXQodG9rZW4sIFVOREVGSU5FRCwgY29udmVydFRvQml0RmxhZ3MoZmxhZ3MpKTtcbiAgICByZXR1cm4gcmVzdWx0ID09PSBVTkRFRklORUQgPyB0aGlzLmNvbXBpbGVyLmluamVjdG9yLmdldCh0b2tlbiwgbm90Rm91bmRWYWx1ZSwgZmxhZ3MpIGFzIGFueSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0O1xuICB9XG5cbiAgLyoqIEBkZXByZWNhdGVkIGZyb20gdjkuMC4wIHVzZSBUZXN0QmVkLmluamVjdCAqL1xuICBnZXQ8VD4odG9rZW46IFByb3ZpZGVyVG9rZW48VD4sIG5vdEZvdW5kVmFsdWU/OiBULCBmbGFncz86IEluamVjdEZsYWdzKTogYW55O1xuICAvKiogQGRlcHJlY2F0ZWQgZnJvbSB2OS4wLjAgdXNlIFRlc3RCZWQuaW5qZWN0ICovXG4gIGdldCh0b2tlbjogYW55LCBub3RGb3VuZFZhbHVlPzogYW55KTogYW55O1xuICAvKiogQGRlcHJlY2F0ZWQgZnJvbSB2OS4wLjAgdXNlIFRlc3RCZWQuaW5qZWN0ICovXG4gIGdldCh0b2tlbjogYW55LCBub3RGb3VuZFZhbHVlOiBhbnkgPSBJbmplY3Rvci5USFJPV19JRl9OT1RfRk9VTkQsXG4gICAgICBmbGFnczogSW5qZWN0RmxhZ3MgPSBJbmplY3RGbGFncy5EZWZhdWx0KTogYW55IHtcbiAgICByZXR1cm4gdGhpcy5pbmplY3QodG9rZW4sIG5vdEZvdW5kVmFsdWUsIGZsYWdzKTtcbiAgfVxuXG4gIHJ1bkluSW5qZWN0aW9uQ29udGV4dDxUPihmbjogKCkgPT4gVCk6IFQge1xuICAgIHJldHVybiBydW5JbkluamVjdGlvbkNvbnRleHQodGhpcy5pbmplY3QoRW52aXJvbm1lbnRJbmplY3RvciksIGZuKTtcbiAgfVxuXG4gIGV4ZWN1dGUodG9rZW5zOiBhbnlbXSwgZm46IEZ1bmN0aW9uLCBjb250ZXh0PzogYW55KTogYW55IHtcbiAgICBjb25zdCBwYXJhbXMgPSB0b2tlbnMubWFwKHQgPT4gdGhpcy5pbmplY3QodCkpO1xuICAgIHJldHVybiBmbi5hcHBseShjb250ZXh0LCBwYXJhbXMpO1xuICB9XG5cbiAgb3ZlcnJpZGVNb2R1bGUobmdNb2R1bGU6IFR5cGU8YW55Piwgb3ZlcnJpZGU6IE1ldGFkYXRhT3ZlcnJpZGU8TmdNb2R1bGU+KTogdGhpcyB7XG4gICAgdGhpcy5hc3NlcnROb3RJbnN0YW50aWF0ZWQoJ292ZXJyaWRlTW9kdWxlJywgJ292ZXJyaWRlIG1vZHVsZSBtZXRhZGF0YScpO1xuICAgIHRoaXMuY29tcGlsZXIub3ZlcnJpZGVNb2R1bGUobmdNb2R1bGUsIG92ZXJyaWRlKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIG92ZXJyaWRlQ29tcG9uZW50KGNvbXBvbmVudDogVHlwZTxhbnk+LCBvdmVycmlkZTogTWV0YWRhdGFPdmVycmlkZTxDb21wb25lbnQ+KTogdGhpcyB7XG4gICAgdGhpcy5hc3NlcnROb3RJbnN0YW50aWF0ZWQoJ292ZXJyaWRlQ29tcG9uZW50JywgJ292ZXJyaWRlIGNvbXBvbmVudCBtZXRhZGF0YScpO1xuICAgIHRoaXMuY29tcGlsZXIub3ZlcnJpZGVDb21wb25lbnQoY29tcG9uZW50LCBvdmVycmlkZSk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBvdmVycmlkZVRlbXBsYXRlVXNpbmdUZXN0aW5nTW9kdWxlKGNvbXBvbmVudDogVHlwZTxhbnk+LCB0ZW1wbGF0ZTogc3RyaW5nKTogdGhpcyB7XG4gICAgdGhpcy5hc3NlcnROb3RJbnN0YW50aWF0ZWQoXG4gICAgICAgICdUZXN0QmVkLm92ZXJyaWRlVGVtcGxhdGVVc2luZ1Rlc3RpbmdNb2R1bGUnLFxuICAgICAgICAnQ2Fubm90IG92ZXJyaWRlIHRlbXBsYXRlIHdoZW4gdGhlIHRlc3QgbW9kdWxlIGhhcyBhbHJlYWR5IGJlZW4gaW5zdGFudGlhdGVkJyk7XG4gICAgdGhpcy5jb21waWxlci5vdmVycmlkZVRlbXBsYXRlVXNpbmdUZXN0aW5nTW9kdWxlKGNvbXBvbmVudCwgdGVtcGxhdGUpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgb3ZlcnJpZGVEaXJlY3RpdmUoZGlyZWN0aXZlOiBUeXBlPGFueT4sIG92ZXJyaWRlOiBNZXRhZGF0YU92ZXJyaWRlPERpcmVjdGl2ZT4pOiB0aGlzIHtcbiAgICB0aGlzLmFzc2VydE5vdEluc3RhbnRpYXRlZCgnb3ZlcnJpZGVEaXJlY3RpdmUnLCAnb3ZlcnJpZGUgZGlyZWN0aXZlIG1ldGFkYXRhJyk7XG4gICAgdGhpcy5jb21waWxlci5vdmVycmlkZURpcmVjdGl2ZShkaXJlY3RpdmUsIG92ZXJyaWRlKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIG92ZXJyaWRlUGlwZShwaXBlOiBUeXBlPGFueT4sIG92ZXJyaWRlOiBNZXRhZGF0YU92ZXJyaWRlPFBpcGU+KTogdGhpcyB7XG4gICAgdGhpcy5hc3NlcnROb3RJbnN0YW50aWF0ZWQoJ292ZXJyaWRlUGlwZScsICdvdmVycmlkZSBwaXBlIG1ldGFkYXRhJyk7XG4gICAgdGhpcy5jb21waWxlci5vdmVycmlkZVBpcGUocGlwZSwgb3ZlcnJpZGUpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIE92ZXJ3cml0ZXMgYWxsIHByb3ZpZGVycyBmb3IgdGhlIGdpdmVuIHRva2VuIHdpdGggdGhlIGdpdmVuIHByb3ZpZGVyIGRlZmluaXRpb24uXG4gICAqL1xuICBvdmVycmlkZVByb3ZpZGVyKHRva2VuOiBhbnksIHByb3ZpZGVyOiB7dXNlRmFjdG9yeT86IEZ1bmN0aW9uLCB1c2VWYWx1ZT86IGFueSwgZGVwcz86IGFueVtdfSk6XG4gICAgICB0aGlzIHtcbiAgICB0aGlzLmFzc2VydE5vdEluc3RhbnRpYXRlZCgnb3ZlcnJpZGVQcm92aWRlcicsICdvdmVycmlkZSBwcm92aWRlcicpO1xuICAgIHRoaXMuY29tcGlsZXIub3ZlcnJpZGVQcm92aWRlcih0b2tlbiwgcHJvdmlkZXIpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgb3ZlcnJpZGVUZW1wbGF0ZShjb21wb25lbnQ6IFR5cGU8YW55PiwgdGVtcGxhdGU6IHN0cmluZyk6IFRlc3RCZWQge1xuICAgIHJldHVybiB0aGlzLm92ZXJyaWRlQ29tcG9uZW50KGNvbXBvbmVudCwge3NldDoge3RlbXBsYXRlLCB0ZW1wbGF0ZVVybDogbnVsbCF9fSk7XG4gIH1cblxuICBjcmVhdGVDb21wb25lbnQ8VD4odHlwZTogVHlwZTxUPik6IENvbXBvbmVudEZpeHR1cmU8VD4ge1xuICAgIGNvbnN0IHRlc3RDb21wb25lbnRSZW5kZXJlciA9IHRoaXMuaW5qZWN0KFRlc3RDb21wb25lbnRSZW5kZXJlcik7XG4gICAgY29uc3Qgcm9vdEVsSWQgPSBgcm9vdCR7X25leHRSb290RWxlbWVudElkKyt9YDtcbiAgICB0ZXN0Q29tcG9uZW50UmVuZGVyZXIuaW5zZXJ0Um9vdEVsZW1lbnQocm9vdEVsSWQpO1xuXG4gICAgaWYgKGdldEFzeW5jQ2xhc3NNZXRhZGF0YUZuKHR5cGUpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgYENvbXBvbmVudCAnJHt0eXBlLm5hbWV9JyBoYXMgdW5yZXNvbHZlZCBtZXRhZGF0YS4gYCArXG4gICAgICAgICAgYFBsZWFzZSBjYWxsIFxcYGF3YWl0IFRlc3RCZWQuY29tcGlsZUNvbXBvbmVudHMoKVxcYCBiZWZvcmUgcnVubmluZyB0aGlzIHRlc3QuYCk7XG4gICAgfVxuXG4gICAgY29uc3QgY29tcG9uZW50RGVmID0gKHR5cGUgYXMgYW55KS7JtWNtcDtcblxuICAgIGlmICghY29tcG9uZW50RGVmKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYEl0IGxvb2tzIGxpa2UgJyR7c3RyaW5naWZ5KHR5cGUpfScgaGFzIG5vdCBiZWVuIGNvbXBpbGVkLmApO1xuICAgIH1cblxuICAgIGNvbnN0IG5vTmdab25lID0gdGhpcy5pbmplY3QoQ29tcG9uZW50Rml4dHVyZU5vTmdab25lLCBmYWxzZSk7XG4gICAgY29uc3QgYXV0b0RldGVjdDogYm9vbGVhbiA9IHRoaXMuaW5qZWN0KENvbXBvbmVudEZpeHR1cmVBdXRvRGV0ZWN0LCBmYWxzZSk7XG4gICAgY29uc3Qgbmdab25lOiBOZ1pvbmV8bnVsbCA9IG5vTmdab25lID8gbnVsbCA6IHRoaXMuaW5qZWN0KE5nWm9uZSwgbnVsbCk7XG4gICAgY29uc3QgY29tcG9uZW50RmFjdG9yeSA9IG5ldyBDb21wb25lbnRGYWN0b3J5KGNvbXBvbmVudERlZik7XG4gICAgY29uc3QgaW5pdENvbXBvbmVudCA9ICgpID0+IHtcbiAgICAgIGNvbnN0IGNvbXBvbmVudFJlZiA9XG4gICAgICAgICAgY29tcG9uZW50RmFjdG9yeS5jcmVhdGUoSW5qZWN0b3IuTlVMTCwgW10sIGAjJHtyb290RWxJZH1gLCB0aGlzLnRlc3RNb2R1bGVSZWYpO1xuICAgICAgcmV0dXJuIG5ldyBDb21wb25lbnRGaXh0dXJlPGFueT4oXG4gICAgICAgICAgY29tcG9uZW50UmVmLCBuZ1pvbmUsIHRoaXMuaW5qZWN0KFpvbmVBd2FyZVF1ZXVlaW5nU2NoZWR1bGVyLCBudWxsKSwgYXV0b0RldGVjdCk7XG4gICAgfTtcbiAgICBjb25zdCBmaXh0dXJlID0gbmdab25lID8gbmdab25lLnJ1bihpbml0Q29tcG9uZW50KSA6IGluaXRDb21wb25lbnQoKTtcbiAgICB0aGlzLl9hY3RpdmVGaXh0dXJlcy5wdXNoKGZpeHR1cmUpO1xuICAgIHJldHVybiBmaXh0dXJlO1xuICB9XG5cbiAgLyoqXG4gICAqIEBpbnRlcm5hbCBzdHJpcCB0aGlzIGZyb20gcHVibGlzaGVkIGQudHMgZmlsZXMgZHVlIHRvXG4gICAqIGh0dHBzOi8vZ2l0aHViLmNvbS9taWNyb3NvZnQvVHlwZVNjcmlwdC9pc3N1ZXMvMzYyMTZcbiAgICovXG4gIHByaXZhdGUgZ2V0IGNvbXBpbGVyKCk6IFRlc3RCZWRDb21waWxlciB7XG4gICAgaWYgKHRoaXMuX2NvbXBpbGVyID09PSBudWxsKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYE5lZWQgdG8gY2FsbCBUZXN0QmVkLmluaXRUZXN0RW52aXJvbm1lbnQoKSBmaXJzdGApO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5fY29tcGlsZXI7XG4gIH1cblxuICAvKipcbiAgICogQGludGVybmFsIHN0cmlwIHRoaXMgZnJvbSBwdWJsaXNoZWQgZC50cyBmaWxlcyBkdWUgdG9cbiAgICogaHR0cHM6Ly9naXRodWIuY29tL21pY3Jvc29mdC9UeXBlU2NyaXB0L2lzc3Vlcy8zNjIxNlxuICAgKi9cbiAgcHJpdmF0ZSBnZXQgdGVzdE1vZHVsZVJlZigpOiBOZ01vZHVsZVJlZjxhbnk+IHtcbiAgICBpZiAodGhpcy5fdGVzdE1vZHVsZVJlZiA9PT0gbnVsbCkge1xuICAgICAgdGhpcy5fdGVzdE1vZHVsZVJlZiA9IHRoaXMuY29tcGlsZXIuZmluYWxpemUoKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuX3Rlc3RNb2R1bGVSZWY7XG4gIH1cblxuICBwcml2YXRlIGFzc2VydE5vdEluc3RhbnRpYXRlZChtZXRob2ROYW1lOiBzdHJpbmcsIG1ldGhvZERlc2NyaXB0aW9uOiBzdHJpbmcpIHtcbiAgICBpZiAodGhpcy5fdGVzdE1vZHVsZVJlZiAhPT0gbnVsbCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgIGBDYW5ub3QgJHttZXRob2REZXNjcmlwdGlvbn0gd2hlbiB0aGUgdGVzdCBtb2R1bGUgaGFzIGFscmVhZHkgYmVlbiBpbnN0YW50aWF0ZWQuIGAgK1xuICAgICAgICAgIGBNYWtlIHN1cmUgeW91IGFyZSBub3QgdXNpbmcgXFxgaW5qZWN0XFxgIGJlZm9yZSBcXGAke21ldGhvZE5hbWV9XFxgLmApO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVjayB3aGV0aGVyIHRoZSBtb2R1bGUgc2NvcGluZyBxdWV1ZSBzaG91bGQgYmUgZmx1c2hlZCwgYW5kIGZsdXNoIGl0IGlmIG5lZWRlZC5cbiAgICpcbiAgICogV2hlbiB0aGUgVGVzdEJlZCBpcyByZXNldCwgaXQgY2xlYXJzIHRoZSBKSVQgbW9kdWxlIGNvbXBpbGF0aW9uIHF1ZXVlLCBjYW5jZWxsaW5nIGFueVxuICAgKiBpbi1wcm9ncmVzcyBtb2R1bGUgY29tcGlsYXRpb24uIFRoaXMgY3JlYXRlcyBhIHBvdGVudGlhbCBoYXphcmQgLSB0aGUgdmVyeSBmaXJzdCB0aW1lIHRoZVxuICAgKiBUZXN0QmVkIGlzIGluaXRpYWxpemVkIChvciBpZiBpdCdzIHJlc2V0IHdpdGhvdXQgYmVpbmcgaW5pdGlhbGl6ZWQpLCB0aGVyZSBtYXkgYmUgcGVuZGluZ1xuICAgKiBjb21waWxhdGlvbnMgb2YgbW9kdWxlcyBkZWNsYXJlZCBpbiBnbG9iYWwgc2NvcGUuIFRoZXNlIGNvbXBpbGF0aW9ucyBzaG91bGQgYmUgZmluaXNoZWQuXG4gICAqXG4gICAqIFRvIGVuc3VyZSB0aGF0IGdsb2JhbGx5IGRlY2xhcmVkIG1vZHVsZXMgaGF2ZSB0aGVpciBjb21wb25lbnRzIHNjb3BlZCBwcm9wZXJseSwgdGhpcyBmdW5jdGlvblxuICAgKiBpcyBjYWxsZWQgd2hlbmV2ZXIgVGVzdEJlZCBpcyBpbml0aWFsaXplZCBvciByZXNldC4gVGhlIF9maXJzdF8gdGltZSB0aGF0IHRoaXMgaGFwcGVucywgcHJpb3JcbiAgICogdG8gYW55IG90aGVyIG9wZXJhdGlvbnMsIHRoZSBzY29waW5nIHF1ZXVlIGlzIGZsdXNoZWQuXG4gICAqL1xuICBwcml2YXRlIGNoZWNrR2xvYmFsQ29tcGlsYXRpb25GaW5pc2hlZCgpOiB2b2lkIHtcbiAgICAvLyBDaGVja2luZyBfdGVzdE5nTW9kdWxlUmVmIGlzIG51bGwgc2hvdWxkIG5vdCBiZSBuZWNlc3NhcnksIGJ1dCBpcyBsZWZ0IGluIGFzIGFuIGFkZGl0aW9uYWxcbiAgICAvLyBndWFyZCB0aGF0IGNvbXBpbGF0aW9ucyBxdWV1ZWQgaW4gdGVzdHMgKGFmdGVyIGluc3RhbnRpYXRpb24pIGFyZSBuZXZlciBmbHVzaGVkIGFjY2lkZW50YWxseS5cbiAgICBpZiAoIXRoaXMuZ2xvYmFsQ29tcGlsYXRpb25DaGVja2VkICYmIHRoaXMuX3Rlc3RNb2R1bGVSZWYgPT09IG51bGwpIHtcbiAgICAgIGZsdXNoTW9kdWxlU2NvcGluZ1F1ZXVlQXNNdWNoQXNQb3NzaWJsZSgpO1xuICAgIH1cbiAgICB0aGlzLmdsb2JhbENvbXBpbGF0aW9uQ2hlY2tlZCA9IHRydWU7XG4gIH1cblxuICBwcml2YXRlIGRlc3Ryb3lBY3RpdmVGaXh0dXJlcygpOiB2b2lkIHtcbiAgICBsZXQgZXJyb3JDb3VudCA9IDA7XG4gICAgdGhpcy5fYWN0aXZlRml4dHVyZXMuZm9yRWFjaCgoZml4dHVyZSkgPT4ge1xuICAgICAgdHJ5IHtcbiAgICAgICAgZml4dHVyZS5kZXN0cm95KCk7XG4gICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGVycm9yQ291bnQrKztcbiAgICAgICAgY29uc29sZS5lcnJvcignRXJyb3IgZHVyaW5nIGNsZWFudXAgb2YgY29tcG9uZW50Jywge1xuICAgICAgICAgIGNvbXBvbmVudDogZml4dHVyZS5jb21wb25lbnRJbnN0YW5jZSxcbiAgICAgICAgICBzdGFja3RyYWNlOiBlLFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICB0aGlzLl9hY3RpdmVGaXh0dXJlcyA9IFtdO1xuXG4gICAgaWYgKGVycm9yQ291bnQgPiAwICYmIHRoaXMuc2hvdWxkUmV0aHJvd1RlYXJkb3duRXJyb3JzKCkpIHtcbiAgICAgIHRocm93IEVycm9yKFxuICAgICAgICAgIGAke2Vycm9yQ291bnR9ICR7KGVycm9yQ291bnQgPT09IDEgPyAnY29tcG9uZW50JyA6ICdjb21wb25lbnRzJyl9IGAgK1xuICAgICAgICAgIGB0aHJldyBlcnJvcnMgZHVyaW5nIGNsZWFudXBgKTtcbiAgICB9XG4gIH1cblxuICBzaG91bGRSZXRocm93VGVhcmRvd25FcnJvcnMoKTogYm9vbGVhbiB7XG4gICAgY29uc3QgaW5zdGFuY2VPcHRpb25zID0gdGhpcy5faW5zdGFuY2VUZWFyZG93bk9wdGlvbnM7XG4gICAgY29uc3QgZW52aXJvbm1lbnRPcHRpb25zID0gVGVzdEJlZEltcGwuX2Vudmlyb25tZW50VGVhcmRvd25PcHRpb25zO1xuXG4gICAgLy8gSWYgdGhlIG5ldyB0ZWFyZG93biBiZWhhdmlvciBoYXNuJ3QgYmVlbiBjb25maWd1cmVkLCBwcmVzZXJ2ZSB0aGUgb2xkIGJlaGF2aW9yLlxuICAgIGlmICghaW5zdGFuY2VPcHRpb25zICYmICFlbnZpcm9ubWVudE9wdGlvbnMpIHtcbiAgICAgIHJldHVybiBURUFSRE9XTl9URVNUSU5HX01PRFVMRV9PTl9ERVNUUk9ZX0RFRkFVTFQ7XG4gICAgfVxuXG4gICAgLy8gT3RoZXJ3aXNlIHVzZSB0aGUgY29uZmlndXJlZCBiZWhhdmlvciBvciBkZWZhdWx0IHRvIHJldGhyb3dpbmcuXG4gICAgcmV0dXJuIGluc3RhbmNlT3B0aW9ucz8ucmV0aHJvd0Vycm9ycyA/PyBlbnZpcm9ubWVudE9wdGlvbnM/LnJldGhyb3dFcnJvcnMgPz9cbiAgICAgICAgdGhpcy5zaG91bGRUZWFyRG93blRlc3RpbmdNb2R1bGUoKTtcbiAgfVxuXG4gIHNob3VsZFRocm93RXJyb3JPblVua25vd25FbGVtZW50cygpOiBib29sZWFuIHtcbiAgICAvLyBDaGVjayBpZiBhIGNvbmZpZ3VyYXRpb24gaGFzIGJlZW4gcHJvdmlkZWQgdG8gdGhyb3cgd2hlbiBhbiB1bmtub3duIGVsZW1lbnQgaXMgZm91bmRcbiAgICByZXR1cm4gdGhpcy5faW5zdGFuY2VFcnJvck9uVW5rbm93bkVsZW1lbnRzT3B0aW9uID8/XG4gICAgICAgIFRlc3RCZWRJbXBsLl9lbnZpcm9ubWVudEVycm9yT25Vbmtub3duRWxlbWVudHNPcHRpb24gPz8gVEhST1dfT05fVU5LTk9XTl9FTEVNRU5UU19ERUZBVUxUO1xuICB9XG5cbiAgc2hvdWxkVGhyb3dFcnJvck9uVW5rbm93blByb3BlcnRpZXMoKTogYm9vbGVhbiB7XG4gICAgLy8gQ2hlY2sgaWYgYSBjb25maWd1cmF0aW9uIGhhcyBiZWVuIHByb3ZpZGVkIHRvIHRocm93IHdoZW4gYW4gdW5rbm93biBwcm9wZXJ0eSBpcyBmb3VuZFxuICAgIHJldHVybiB0aGlzLl9pbnN0YW5jZUVycm9yT25Vbmtub3duUHJvcGVydGllc09wdGlvbiA/P1xuICAgICAgICBUZXN0QmVkSW1wbC5fZW52aXJvbm1lbnRFcnJvck9uVW5rbm93blByb3BlcnRpZXNPcHRpb24gPz9cbiAgICAgICAgVEhST1dfT05fVU5LTk9XTl9QUk9QRVJUSUVTX0RFRkFVTFQ7XG4gIH1cblxuICBzaG91bGRUZWFyRG93blRlc3RpbmdNb2R1bGUoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuX2luc3RhbmNlVGVhcmRvd25PcHRpb25zPy5kZXN0cm95QWZ0ZXJFYWNoID8/XG4gICAgICAgIFRlc3RCZWRJbXBsLl9lbnZpcm9ubWVudFRlYXJkb3duT3B0aW9ucz8uZGVzdHJveUFmdGVyRWFjaCA/P1xuICAgICAgICBURUFSRE9XTl9URVNUSU5HX01PRFVMRV9PTl9ERVNUUk9ZX0RFRkFVTFQ7XG4gIH1cblxuICBnZXREZWZlckJsb2NrQmVoYXZpb3IoKTogRGVmZXJCbG9ja0JlaGF2aW9yIHtcbiAgICByZXR1cm4gdGhpcy5faW5zdGFuY2VEZWZlckJsb2NrQmVoYXZpb3I7XG4gIH1cblxuICB0ZWFyRG93blRlc3RpbmdNb2R1bGUoKSB7XG4gICAgLy8gSWYgdGhlIG1vZHVsZSByZWYgaGFzIGFscmVhZHkgYmVlbiBkZXN0cm95ZWQsIHdlIHdvbid0IGJlIGFibGUgdG8gZ2V0IGEgdGVzdCByZW5kZXJlci5cbiAgICBpZiAodGhpcy5fdGVzdE1vZHVsZVJlZiA9PT0gbnVsbCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICAvLyBSZXNvbHZlIHRoZSByZW5kZXJlciBhaGVhZCBvZiB0aW1lLCBiZWNhdXNlIHdlIHdhbnQgdG8gcmVtb3ZlIHRoZSByb290IGVsZW1lbnRzIGFzIHRoZSB2ZXJ5XG4gICAgLy8gbGFzdCBzdGVwLCBidXQgdGhlIGluamVjdG9yIHdpbGwgYmUgZGVzdHJveWVkIGFzIGEgcGFydCBvZiB0aGUgbW9kdWxlIHJlZiBkZXN0cnVjdGlvbi5cbiAgICBjb25zdCB0ZXN0UmVuZGVyZXIgPSB0aGlzLmluamVjdChUZXN0Q29tcG9uZW50UmVuZGVyZXIpO1xuICAgIHRyeSB7XG4gICAgICB0aGlzLl90ZXN0TW9kdWxlUmVmLmRlc3Ryb3koKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBpZiAodGhpcy5zaG91bGRSZXRocm93VGVhcmRvd25FcnJvcnMoKSkge1xuICAgICAgICB0aHJvdyBlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc29sZS5lcnJvcignRXJyb3IgZHVyaW5nIGNsZWFudXAgb2YgYSB0ZXN0aW5nIG1vZHVsZScsIHtcbiAgICAgICAgICBjb21wb25lbnQ6IHRoaXMuX3Rlc3RNb2R1bGVSZWYuaW5zdGFuY2UsXG4gICAgICAgICAgc3RhY2t0cmFjZTogZSxcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIHRlc3RSZW5kZXJlci5yZW1vdmVBbGxSb290RWxlbWVudHM/LigpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBFeGVjdXRlIGFueSBwZW5kaW5nIGVmZmVjdHMuXG4gICAqXG4gICAqIEBkZXZlbG9wZXJQcmV2aWV3XG4gICAqL1xuICBmbHVzaEVmZmVjdHMoKTogdm9pZCB7XG4gICAgdGhpcy5pbmplY3QoWm9uZUF3YXJlUXVldWVpbmdTY2hlZHVsZXIpLmZsdXNoKCk7XG4gIH1cbn1cblxuLyoqXG4gKiBAZGVzY3JpcHRpb25cbiAqIENvbmZpZ3VyZXMgYW5kIGluaXRpYWxpemVzIGVudmlyb25tZW50IGZvciB1bml0IHRlc3RpbmcgYW5kIHByb3ZpZGVzIG1ldGhvZHMgZm9yXG4gKiBjcmVhdGluZyBjb21wb25lbnRzIGFuZCBzZXJ2aWNlcyBpbiB1bml0IHRlc3RzLlxuICpcbiAqIGBUZXN0QmVkYCBpcyB0aGUgcHJpbWFyeSBhcGkgZm9yIHdyaXRpbmcgdW5pdCB0ZXN0cyBmb3IgQW5ndWxhciBhcHBsaWNhdGlvbnMgYW5kIGxpYnJhcmllcy5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBjb25zdCBUZXN0QmVkOiBUZXN0QmVkU3RhdGljID0gVGVzdEJlZEltcGw7XG5cbi8qKlxuICogQWxsb3dzIGluamVjdGluZyBkZXBlbmRlbmNpZXMgaW4gYGJlZm9yZUVhY2goKWAgYW5kIGBpdCgpYC4gTm90ZTogdGhpcyBmdW5jdGlvblxuICogKGltcG9ydGVkIGZyb20gdGhlIGBAYW5ndWxhci9jb3JlL3Rlc3RpbmdgIHBhY2thZ2UpIGNhbiAqKm9ubHkqKiBiZSB1c2VkIHRvIGluamVjdCBkZXBlbmRlbmNpZXNcbiAqIGluIHRlc3RzLiBUbyBpbmplY3QgZGVwZW5kZW5jaWVzIGluIHlvdXIgYXBwbGljYXRpb24gY29kZSwgdXNlIHRoZSBbYGluamVjdGBdKGFwaS9jb3JlL2luamVjdClcbiAqIGZ1bmN0aW9uIGZyb20gdGhlIGBAYW5ndWxhci9jb3JlYCBwYWNrYWdlIGluc3RlYWQuXG4gKlxuICogRXhhbXBsZTpcbiAqXG4gKiBgYGBcbiAqIGJlZm9yZUVhY2goaW5qZWN0KFtEZXBlbmRlbmN5LCBBQ2xhc3NdLCAoZGVwLCBvYmplY3QpID0+IHtcbiAqICAgLy8gc29tZSBjb2RlIHRoYXQgdXNlcyBgZGVwYCBhbmQgYG9iamVjdGBcbiAqICAgLy8gLi4uXG4gKiB9KSk7XG4gKlxuICogaXQoJy4uLicsIGluamVjdChbQUNsYXNzXSwgKG9iamVjdCkgPT4ge1xuICogICBvYmplY3QuZG9Tb21ldGhpbmcoKTtcbiAqICAgZXhwZWN0KC4uLik7XG4gKiB9KVxuICogYGBgXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gaW5qZWN0KHRva2VuczogYW55W10sIGZuOiBGdW5jdGlvbik6ICgpID0+IGFueSB7XG4gIGNvbnN0IHRlc3RCZWQgPSBUZXN0QmVkSW1wbC5JTlNUQU5DRTtcbiAgLy8gTm90IHVzaW5nIGFuIGFycm93IGZ1bmN0aW9uIHRvIHByZXNlcnZlIGNvbnRleHQgcGFzc2VkIGZyb20gY2FsbCBzaXRlXG4gIHJldHVybiBmdW5jdGlvbih0aGlzOiB1bmtub3duKSB7XG4gICAgcmV0dXJuIHRlc3RCZWQuZXhlY3V0ZSh0b2tlbnMsIGZuLCB0aGlzKTtcbiAgfTtcbn1cblxuLyoqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBjbGFzcyBJbmplY3RTZXR1cFdyYXBwZXIge1xuICBjb25zdHJ1Y3Rvcihwcml2YXRlIF9tb2R1bGVEZWY6ICgpID0+IFRlc3RNb2R1bGVNZXRhZGF0YSkge31cblxuICBwcml2YXRlIF9hZGRNb2R1bGUoKSB7XG4gICAgY29uc3QgbW9kdWxlRGVmID0gdGhpcy5fbW9kdWxlRGVmKCk7XG4gICAgaWYgKG1vZHVsZURlZikge1xuICAgICAgVGVzdEJlZEltcGwuY29uZmlndXJlVGVzdGluZ01vZHVsZShtb2R1bGVEZWYpO1xuICAgIH1cbiAgfVxuXG4gIGluamVjdCh0b2tlbnM6IGFueVtdLCBmbjogRnVuY3Rpb24pOiAoKSA9PiBhbnkge1xuICAgIGNvbnN0IHNlbGYgPSB0aGlzO1xuICAgIC8vIE5vdCB1c2luZyBhbiBhcnJvdyBmdW5jdGlvbiB0byBwcmVzZXJ2ZSBjb250ZXh0IHBhc3NlZCBmcm9tIGNhbGwgc2l0ZVxuICAgIHJldHVybiBmdW5jdGlvbih0aGlzOiB1bmtub3duKSB7XG4gICAgICBzZWxmLl9hZGRNb2R1bGUoKTtcbiAgICAgIHJldHVybiBpbmplY3QodG9rZW5zLCBmbikuY2FsbCh0aGlzKTtcbiAgICB9O1xuICB9XG59XG5cbi8qKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gd2l0aE1vZHVsZShtb2R1bGVEZWY6IFRlc3RNb2R1bGVNZXRhZGF0YSk6IEluamVjdFNldHVwV3JhcHBlcjtcbmV4cG9ydCBmdW5jdGlvbiB3aXRoTW9kdWxlKG1vZHVsZURlZjogVGVzdE1vZHVsZU1ldGFkYXRhLCBmbjogRnVuY3Rpb24pOiAoKSA9PiBhbnk7XG5leHBvcnQgZnVuY3Rpb24gd2l0aE1vZHVsZShtb2R1bGVEZWY6IFRlc3RNb2R1bGVNZXRhZGF0YSwgZm4/OiBGdW5jdGlvbnxudWxsKTogKCgpID0+IGFueSl8XG4gICAgSW5qZWN0U2V0dXBXcmFwcGVyIHtcbiAgaWYgKGZuKSB7XG4gICAgLy8gTm90IHVzaW5nIGFuIGFycm93IGZ1bmN0aW9uIHRvIHByZXNlcnZlIGNvbnRleHQgcGFzc2VkIGZyb20gY2FsbCBzaXRlXG4gICAgcmV0dXJuIGZ1bmN0aW9uKHRoaXM6IHVua25vd24pIHtcbiAgICAgIGNvbnN0IHRlc3RCZWQgPSBUZXN0QmVkSW1wbC5JTlNUQU5DRTtcbiAgICAgIGlmIChtb2R1bGVEZWYpIHtcbiAgICAgICAgdGVzdEJlZC5jb25maWd1cmVUZXN0aW5nTW9kdWxlKG1vZHVsZURlZik7XG4gICAgICB9XG4gICAgICByZXR1cm4gZm4uYXBwbHkodGhpcyk7XG4gICAgfTtcbiAgfVxuICByZXR1cm4gbmV3IEluamVjdFNldHVwV3JhcHBlcigoKSA9PiBtb2R1bGVEZWYpO1xufVxuIl19