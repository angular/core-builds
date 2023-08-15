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
import { getAsyncClassMetadata } from '../../src/render3/metadata';
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
        if (getAsyncClassMetadata(type)) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdF9iZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3Rlc3Rpbmcvc3JjL3Rlc3RfYmVkLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILG1HQUFtRztBQUNuRyxpR0FBaUc7QUFDakcsdUJBQXVCO0FBRXZCLHNCQUFzQjtBQUN0QixPQUFPLEVBR0wsbUJBQW1CLEVBQ25CLFdBQVcsRUFHWCxRQUFRLEVBRVIsTUFBTSxFQUtOLGtCQUFrQixJQUFJLGlCQUFpQixFQUN2Qyx3Q0FBd0MsSUFBSSx1Q0FBdUMsRUFDbkYsNEJBQTRCLElBQUksMkJBQTJCLEVBQzNELDZCQUE2QixJQUFJLDRCQUE0QixFQUM3RCx3QkFBd0IsSUFBSSxnQkFBZ0IsRUFFNUMsd0JBQXdCLElBQUksdUJBQXVCLEVBQ25ELG9DQUFvQyxJQUFJLG1DQUFtQyxFQUMzRSw0QkFBNEIsSUFBSSwyQkFBMkIsRUFDM0QsNkJBQTZCLElBQUksNEJBQTRCLEVBQzdELFVBQVUsSUFBSSxTQUFTLEVBQ3hCLE1BQU0sZUFBZSxDQUFDO0FBRXZCLE9BQU8sRUFBRSxxQkFBcUIsRUFBRSxNQUFNLDRCQUE0QixDQUFDO0FBRW5FLHFCQUFxQjtBQUVyQixPQUFPLEVBQUMsZ0JBQWdCLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUVyRCxPQUFPLEVBQUMsMEJBQTBCLEVBQUUsd0JBQXdCLEVBQXlCLDBDQUEwQyxFQUFFLHFCQUFxQixFQUE4QyxpQ0FBaUMsRUFBRSxtQ0FBbUMsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQ3JTLE9BQU8sRUFBQyxlQUFlLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQWdHcEQsSUFBSSxrQkFBa0IsR0FBRyxDQUFDLENBQUM7QUFFM0I7Ozs7R0FJRztBQUNILE1BQU0sVUFBVSxVQUFVO0lBQ3hCLE9BQU8sV0FBVyxDQUFDLFFBQVEsQ0FBQztBQUM5QixDQUFDO0FBRUQ7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LENBQUM7Q0FDRjtBQU9ELE1BQU0sVUFBVSxVQUFVLENBQUMsU0FBNkIsRUFBRSxFQUFrQjtJQUUxRSxJQUFJLEVBQUUsRUFBRTtRQUNOLHdFQUF3RTtRQUN4RSxPQUFPO1lBQ0wsTUFBTSxPQUFPLEdBQUcsV0FBVyxDQUFDLFFBQVEsQ0FBQztZQUNyQyxJQUFJLFNBQVMsRUFBRTtnQkFDYixPQUFPLENBQUMsc0JBQXNCLENBQUMsU0FBUyxDQUFDLENBQUM7YUFDM0M7WUFDRCxPQUFPLEVBQUUsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDeEIsQ0FBQyxDQUFDO0tBQ0g7SUFDRCxPQUFPLElBQUksa0JBQWtCLENBQUMsR0FBRyxFQUFFLENBQUMsU0FBUyxDQUFDLENBQUM7QUFDakQsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG4vLyBUaGUgZm9ybWF0dGVyIGFuZCBDSSBkaXNhZ3JlZSBvbiBob3cgdGhpcyBpbXBvcnQgc3RhdGVtZW50IHNob3VsZCBiZSBmb3JtYXR0ZWQuIEJvdGggdHJ5IHRvIGtlZXBcbi8vIGl0IG9uIG9uZSBsaW5lLCB0b28sIHdoaWNoIGhhcyBnb3R0ZW4gdmVyeSBoYXJkIHRvIHJlYWQgJiBtYW5hZ2UuIFNvIGRpc2FibGUgdGhlIGZvcm1hdHRlciBmb3Jcbi8vIHRoaXMgc3RhdGVtZW50IG9ubHkuXG5cbi8qIGNsYW5nLWZvcm1hdCBvZmYgKi9cbmltcG9ydCB7XG4gIENvbXBvbmVudCxcbiAgRGlyZWN0aXZlLFxuICBFbnZpcm9ubWVudEluamVjdG9yLFxuICBJbmplY3RGbGFncyxcbiAgSW5qZWN0aW9uVG9rZW4sXG4gIEluamVjdE9wdGlvbnMsXG4gIEluamVjdG9yLFxuICBOZ01vZHVsZSxcbiAgTmdab25lLFxuICBQaXBlLFxuICBQbGF0Zm9ybVJlZixcbiAgUHJvdmlkZXJUb2tlbixcbiAgVHlwZSxcbiAgybVjb252ZXJ0VG9CaXRGbGFncyBhcyBjb252ZXJ0VG9CaXRGbGFncyxcbiAgybVmbHVzaE1vZHVsZVNjb3BpbmdRdWV1ZUFzTXVjaEFzUG9zc2libGUgYXMgZmx1c2hNb2R1bGVTY29waW5nUXVldWVBc011Y2hBc1Bvc3NpYmxlLFxuICDJtWdldFVua25vd25FbGVtZW50U3RyaWN0TW9kZSBhcyBnZXRVbmtub3duRWxlbWVudFN0cmljdE1vZGUsXG4gIMm1Z2V0VW5rbm93blByb3BlcnR5U3RyaWN0TW9kZSBhcyBnZXRVbmtub3duUHJvcGVydHlTdHJpY3RNb2RlLFxuICDJtVJlbmRlcjNDb21wb25lbnRGYWN0b3J5IGFzIENvbXBvbmVudEZhY3RvcnksXG4gIMm1UmVuZGVyM05nTW9kdWxlUmVmIGFzIE5nTW9kdWxlUmVmLFxuICDJtXJlc2V0Q29tcGlsZWRDb21wb25lbnRzIGFzIHJlc2V0Q29tcGlsZWRDb21wb25lbnRzLFxuICDJtXNldEFsbG93RHVwbGljYXRlTmdNb2R1bGVJZHNGb3JUZXN0IGFzIHNldEFsbG93RHVwbGljYXRlTmdNb2R1bGVJZHNGb3JUZXN0LFxuICDJtXNldFVua25vd25FbGVtZW50U3RyaWN0TW9kZSBhcyBzZXRVbmtub3duRWxlbWVudFN0cmljdE1vZGUsXG4gIMm1c2V0VW5rbm93blByb3BlcnR5U3RyaWN0TW9kZSBhcyBzZXRVbmtub3duUHJvcGVydHlTdHJpY3RNb2RlLFxuICDJtXN0cmluZ2lmeSBhcyBzdHJpbmdpZnlcbn0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5cbmltcG9ydCB7IGdldEFzeW5jQ2xhc3NNZXRhZGF0YSB9IGZyb20gJy4uLy4uL3NyYy9yZW5kZXIzL21ldGFkYXRhJztcblxuLyogY2xhbmctZm9ybWF0IG9uICovXG5cbmltcG9ydCB7Q29tcG9uZW50Rml4dHVyZX0gZnJvbSAnLi9jb21wb25lbnRfZml4dHVyZSc7XG5pbXBvcnQge01ldGFkYXRhT3ZlcnJpZGV9IGZyb20gJy4vbWV0YWRhdGFfb3ZlcnJpZGUnO1xuaW1wb3J0IHtDb21wb25lbnRGaXh0dXJlQXV0b0RldGVjdCwgQ29tcG9uZW50Rml4dHVyZU5vTmdab25lLCBNb2R1bGVUZWFyZG93bk9wdGlvbnMsIFRFQVJET1dOX1RFU1RJTkdfTU9EVUxFX09OX0RFU1RST1lfREVGQVVMVCwgVGVzdENvbXBvbmVudFJlbmRlcmVyLCBUZXN0RW52aXJvbm1lbnRPcHRpb25zLCBUZXN0TW9kdWxlTWV0YWRhdGEsIFRIUk9XX09OX1VOS05PV05fRUxFTUVOVFNfREVGQVVMVCwgVEhST1dfT05fVU5LTk9XTl9QUk9QRVJUSUVTX0RFRkFVTFR9IGZyb20gJy4vdGVzdF9iZWRfY29tbW9uJztcbmltcG9ydCB7VGVzdEJlZENvbXBpbGVyfSBmcm9tICcuL3Rlc3RfYmVkX2NvbXBpbGVyJztcblxuLyoqXG4gKiBTdGF0aWMgbWV0aG9kcyBpbXBsZW1lbnRlZCBieSB0aGUgYFRlc3RCZWRgLlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBUZXN0QmVkU3RhdGljIGV4dGVuZHMgVGVzdEJlZCB7XG4gIG5ldyguLi5hcmdzOiBhbnlbXSk6IFRlc3RCZWQ7XG59XG5cbi8qKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgaW50ZXJmYWNlIFRlc3RCZWQge1xuICBnZXQgcGxhdGZvcm0oKTogUGxhdGZvcm1SZWY7XG5cbiAgZ2V0IG5nTW9kdWxlKCk6IFR5cGU8YW55PnxUeXBlPGFueT5bXTtcblxuICAvKipcbiAgICogSW5pdGlhbGl6ZSB0aGUgZW52aXJvbm1lbnQgZm9yIHRlc3Rpbmcgd2l0aCBhIGNvbXBpbGVyIGZhY3RvcnksIGEgUGxhdGZvcm1SZWYsIGFuZCBhblxuICAgKiBhbmd1bGFyIG1vZHVsZS4gVGhlc2UgYXJlIGNvbW1vbiB0byBldmVyeSB0ZXN0IGluIHRoZSBzdWl0ZS5cbiAgICpcbiAgICogVGhpcyBtYXkgb25seSBiZSBjYWxsZWQgb25jZSwgdG8gc2V0IHVwIHRoZSBjb21tb24gcHJvdmlkZXJzIGZvciB0aGUgY3VycmVudCB0ZXN0XG4gICAqIHN1aXRlIG9uIHRoZSBjdXJyZW50IHBsYXRmb3JtLiBJZiB5b3UgYWJzb2x1dGVseSBuZWVkIHRvIGNoYW5nZSB0aGUgcHJvdmlkZXJzLFxuICAgKiBmaXJzdCB1c2UgYHJlc2V0VGVzdEVudmlyb25tZW50YC5cbiAgICpcbiAgICogVGVzdCBtb2R1bGVzIGFuZCBwbGF0Zm9ybXMgZm9yIGluZGl2aWR1YWwgcGxhdGZvcm1zIGFyZSBhdmFpbGFibGUgZnJvbVxuICAgKiAnQGFuZ3VsYXIvPHBsYXRmb3JtX25hbWU+L3Rlc3RpbmcnLlxuICAgKi9cbiAgaW5pdFRlc3RFbnZpcm9ubWVudChcbiAgICAgIG5nTW9kdWxlOiBUeXBlPGFueT58VHlwZTxhbnk+W10sIHBsYXRmb3JtOiBQbGF0Zm9ybVJlZixcbiAgICAgIG9wdGlvbnM/OiBUZXN0RW52aXJvbm1lbnRPcHRpb25zKTogdm9pZDtcblxuICAvKipcbiAgICogUmVzZXQgdGhlIHByb3ZpZGVycyBmb3IgdGhlIHRlc3QgaW5qZWN0b3IuXG4gICAqL1xuICByZXNldFRlc3RFbnZpcm9ubWVudCgpOiB2b2lkO1xuXG4gIHJlc2V0VGVzdGluZ01vZHVsZSgpOiBUZXN0QmVkO1xuXG4gIGNvbmZpZ3VyZUNvbXBpbGVyKGNvbmZpZzoge3Byb3ZpZGVycz86IGFueVtdLCB1c2VKaXQ/OiBib29sZWFufSk6IHZvaWQ7XG5cbiAgY29uZmlndXJlVGVzdGluZ01vZHVsZShtb2R1bGVEZWY6IFRlc3RNb2R1bGVNZXRhZGF0YSk6IFRlc3RCZWQ7XG5cbiAgY29tcGlsZUNvbXBvbmVudHMoKTogUHJvbWlzZTxhbnk+O1xuXG4gIGluamVjdDxUPih0b2tlbjogUHJvdmlkZXJUb2tlbjxUPiwgbm90Rm91bmRWYWx1ZTogdW5kZWZpbmVkLCBvcHRpb25zOiBJbmplY3RPcHRpb25zJntcbiAgICBvcHRpb25hbD86IGZhbHNlXG4gIH0pOiBUO1xuICBpbmplY3Q8VD4odG9rZW46IFByb3ZpZGVyVG9rZW48VD4sIG5vdEZvdW5kVmFsdWU6IG51bGx8dW5kZWZpbmVkLCBvcHRpb25zOiBJbmplY3RPcHRpb25zKTogVHxudWxsO1xuICBpbmplY3Q8VD4odG9rZW46IFByb3ZpZGVyVG9rZW48VD4sIG5vdEZvdW5kVmFsdWU/OiBULCBvcHRpb25zPzogSW5qZWN0T3B0aW9ucyk6IFQ7XG4gIC8qKiBAZGVwcmVjYXRlZCB1c2Ugb2JqZWN0LWJhc2VkIGZsYWdzIChgSW5qZWN0T3B0aW9uc2ApIGluc3RlYWQuICovXG4gIGluamVjdDxUPih0b2tlbjogUHJvdmlkZXJUb2tlbjxUPiwgbm90Rm91bmRWYWx1ZT86IFQsIGZsYWdzPzogSW5qZWN0RmxhZ3MpOiBUO1xuICAvKiogQGRlcHJlY2F0ZWQgdXNlIG9iamVjdC1iYXNlZCBmbGFncyAoYEluamVjdE9wdGlvbnNgKSBpbnN0ZWFkLiAqL1xuICBpbmplY3Q8VD4odG9rZW46IFByb3ZpZGVyVG9rZW48VD4sIG5vdEZvdW5kVmFsdWU6IG51bGwsIGZsYWdzPzogSW5qZWN0RmxhZ3MpOiBUfG51bGw7XG5cbiAgLyoqIEBkZXByZWNhdGVkIGZyb20gdjkuMC4wIHVzZSBUZXN0QmVkLmluamVjdCAqL1xuICBnZXQ8VD4odG9rZW46IFByb3ZpZGVyVG9rZW48VD4sIG5vdEZvdW5kVmFsdWU/OiBULCBmbGFncz86IEluamVjdEZsYWdzKTogYW55O1xuICAvKiogQGRlcHJlY2F0ZWQgZnJvbSB2OS4wLjAgdXNlIFRlc3RCZWQuaW5qZWN0ICovXG4gIGdldCh0b2tlbjogYW55LCBub3RGb3VuZFZhbHVlPzogYW55KTogYW55O1xuXG4gIC8qKlxuICAgKiBSdW5zIHRoZSBnaXZlbiBmdW5jdGlvbiBpbiB0aGUgYEVudmlyb25tZW50SW5qZWN0b3JgIGNvbnRleHQgb2YgYFRlc3RCZWRgLlxuICAgKlxuICAgKiBAc2VlIEVudmlyb25tZW50SW5qZWN0b3IjcnVuSW5Db250ZXh0XG4gICAqL1xuICBydW5JbkluamVjdGlvbkNvbnRleHQ8VD4oZm46ICgpID0+IFQpOiBUO1xuXG4gIGV4ZWN1dGUodG9rZW5zOiBhbnlbXSwgZm46IEZ1bmN0aW9uLCBjb250ZXh0PzogYW55KTogYW55O1xuXG4gIG92ZXJyaWRlTW9kdWxlKG5nTW9kdWxlOiBUeXBlPGFueT4sIG92ZXJyaWRlOiBNZXRhZGF0YU92ZXJyaWRlPE5nTW9kdWxlPik6IFRlc3RCZWQ7XG5cbiAgb3ZlcnJpZGVDb21wb25lbnQoY29tcG9uZW50OiBUeXBlPGFueT4sIG92ZXJyaWRlOiBNZXRhZGF0YU92ZXJyaWRlPENvbXBvbmVudD4pOiBUZXN0QmVkO1xuXG4gIG92ZXJyaWRlRGlyZWN0aXZlKGRpcmVjdGl2ZTogVHlwZTxhbnk+LCBvdmVycmlkZTogTWV0YWRhdGFPdmVycmlkZTxEaXJlY3RpdmU+KTogVGVzdEJlZDtcblxuICBvdmVycmlkZVBpcGUocGlwZTogVHlwZTxhbnk+LCBvdmVycmlkZTogTWV0YWRhdGFPdmVycmlkZTxQaXBlPik6IFRlc3RCZWQ7XG5cbiAgb3ZlcnJpZGVUZW1wbGF0ZShjb21wb25lbnQ6IFR5cGU8YW55PiwgdGVtcGxhdGU6IHN0cmluZyk6IFRlc3RCZWQ7XG5cbiAgLyoqXG4gICAqIE92ZXJ3cml0ZXMgYWxsIHByb3ZpZGVycyBmb3IgdGhlIGdpdmVuIHRva2VuIHdpdGggdGhlIGdpdmVuIHByb3ZpZGVyIGRlZmluaXRpb24uXG4gICAqL1xuICBvdmVycmlkZVByb3ZpZGVyKHRva2VuOiBhbnksIHByb3ZpZGVyOiB7dXNlRmFjdG9yeTogRnVuY3Rpb24sIGRlcHM6IGFueVtdLCBtdWx0aT86IGJvb2xlYW59KTpcbiAgICAgIFRlc3RCZWQ7XG4gIG92ZXJyaWRlUHJvdmlkZXIodG9rZW46IGFueSwgcHJvdmlkZXI6IHt1c2VWYWx1ZTogYW55LCBtdWx0aT86IGJvb2xlYW59KTogVGVzdEJlZDtcbiAgb3ZlcnJpZGVQcm92aWRlcihcbiAgICAgIHRva2VuOiBhbnksXG4gICAgICBwcm92aWRlcjoge3VzZUZhY3Rvcnk/OiBGdW5jdGlvbiwgdXNlVmFsdWU/OiBhbnksIGRlcHM/OiBhbnlbXSwgbXVsdGk/OiBib29sZWFufSk6IFRlc3RCZWQ7XG5cbiAgb3ZlcnJpZGVUZW1wbGF0ZVVzaW5nVGVzdGluZ01vZHVsZShjb21wb25lbnQ6IFR5cGU8YW55PiwgdGVtcGxhdGU6IHN0cmluZyk6IFRlc3RCZWQ7XG5cbiAgY3JlYXRlQ29tcG9uZW50PFQ+KGNvbXBvbmVudDogVHlwZTxUPik6IENvbXBvbmVudEZpeHR1cmU8VD47XG59XG5cbmxldCBfbmV4dFJvb3RFbGVtZW50SWQgPSAwO1xuXG4vKipcbiAqIFJldHVybnMgYSBzaW5nbGV0b24gb2YgdGhlIGBUZXN0QmVkYCBjbGFzcy5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRUZXN0QmVkKCk6IFRlc3RCZWQge1xuICByZXR1cm4gVGVzdEJlZEltcGwuSU5TVEFOQ0U7XG59XG5cbi8qKlxuICogQGRlc2NyaXB0aW9uXG4gKiBDb25maWd1cmVzIGFuZCBpbml0aWFsaXplcyBlbnZpcm9ubWVudCBmb3IgdW5pdCB0ZXN0aW5nIGFuZCBwcm92aWRlcyBtZXRob2RzIGZvclxuICogY3JlYXRpbmcgY29tcG9uZW50cyBhbmQgc2VydmljZXMgaW4gdW5pdCB0ZXN0cy5cbiAqXG4gKiBUZXN0QmVkIGlzIHRoZSBwcmltYXJ5IGFwaSBmb3Igd3JpdGluZyB1bml0IHRlc3RzIGZvciBBbmd1bGFyIGFwcGxpY2F0aW9ucyBhbmQgbGlicmFyaWVzLlxuICovXG5leHBvcnQgY2xhc3MgVGVzdEJlZEltcGwgaW1wbGVtZW50cyBUZXN0QmVkIHtcbiAgcHJpdmF0ZSBzdGF0aWMgX0lOU1RBTkNFOiBUZXN0QmVkSW1wbHxudWxsID0gbnVsbDtcblxuICBzdGF0aWMgZ2V0IElOU1RBTkNFKCk6IFRlc3RCZWRJbXBsIHtcbiAgICByZXR1cm4gVGVzdEJlZEltcGwuX0lOU1RBTkNFID0gVGVzdEJlZEltcGwuX0lOU1RBTkNFIHx8IG5ldyBUZXN0QmVkSW1wbCgpO1xuICB9XG5cbiAgLyoqXG4gICAqIFRlYXJkb3duIG9wdGlvbnMgdGhhdCBoYXZlIGJlZW4gY29uZmlndXJlZCBhdCB0aGUgZW52aXJvbm1lbnQgbGV2ZWwuXG4gICAqIFVzZWQgYXMgYSBmYWxsYmFjayBpZiBubyBpbnN0YW5jZS1sZXZlbCBvcHRpb25zIGhhdmUgYmVlbiBwcm92aWRlZC5cbiAgICovXG4gIHByaXZhdGUgc3RhdGljIF9lbnZpcm9ubWVudFRlYXJkb3duT3B0aW9uczogTW9kdWxlVGVhcmRvd25PcHRpb25zfHVuZGVmaW5lZDtcblxuICAvKipcbiAgICogXCJFcnJvciBvbiB1bmtub3duIGVsZW1lbnRzXCIgb3B0aW9uIHRoYXQgaGFzIGJlZW4gY29uZmlndXJlZCBhdCB0aGUgZW52aXJvbm1lbnQgbGV2ZWwuXG4gICAqIFVzZWQgYXMgYSBmYWxsYmFjayBpZiBubyBpbnN0YW5jZS1sZXZlbCBvcHRpb24gaGFzIGJlZW4gcHJvdmlkZWQuXG4gICAqL1xuICBwcml2YXRlIHN0YXRpYyBfZW52aXJvbm1lbnRFcnJvck9uVW5rbm93bkVsZW1lbnRzT3B0aW9uOiBib29sZWFufHVuZGVmaW5lZDtcblxuICAvKipcbiAgICogXCJFcnJvciBvbiB1bmtub3duIHByb3BlcnRpZXNcIiBvcHRpb24gdGhhdCBoYXMgYmVlbiBjb25maWd1cmVkIGF0IHRoZSBlbnZpcm9ubWVudCBsZXZlbC5cbiAgICogVXNlZCBhcyBhIGZhbGxiYWNrIGlmIG5vIGluc3RhbmNlLWxldmVsIG9wdGlvbiBoYXMgYmVlbiBwcm92aWRlZC5cbiAgICovXG4gIHByaXZhdGUgc3RhdGljIF9lbnZpcm9ubWVudEVycm9yT25Vbmtub3duUHJvcGVydGllc09wdGlvbjogYm9vbGVhbnx1bmRlZmluZWQ7XG5cbiAgLyoqXG4gICAqIFRlYXJkb3duIG9wdGlvbnMgdGhhdCBoYXZlIGJlZW4gY29uZmlndXJlZCBhdCB0aGUgYFRlc3RCZWRgIGluc3RhbmNlIGxldmVsLlxuICAgKiBUaGVzZSBvcHRpb25zIHRha2UgcHJlY2VkZW5jZSBvdmVyIHRoZSBlbnZpcm9ubWVudC1sZXZlbCBvbmVzLlxuICAgKi9cbiAgcHJpdmF0ZSBfaW5zdGFuY2VUZWFyZG93bk9wdGlvbnM6IE1vZHVsZVRlYXJkb3duT3B0aW9uc3x1bmRlZmluZWQ7XG5cbiAgLyoqXG4gICAqIFwiRXJyb3Igb24gdW5rbm93biBlbGVtZW50c1wiIG9wdGlvbiB0aGF0IGhhcyBiZWVuIGNvbmZpZ3VyZWQgYXQgdGhlIGBUZXN0QmVkYCBpbnN0YW5jZSBsZXZlbC5cbiAgICogVGhpcyBvcHRpb24gdGFrZXMgcHJlY2VkZW5jZSBvdmVyIHRoZSBlbnZpcm9ubWVudC1sZXZlbCBvbmUuXG4gICAqL1xuICBwcml2YXRlIF9pbnN0YW5jZUVycm9yT25Vbmtub3duRWxlbWVudHNPcHRpb246IGJvb2xlYW58dW5kZWZpbmVkO1xuXG4gIC8qKlxuICAgKiBcIkVycm9yIG9uIHVua25vd24gcHJvcGVydGllc1wiIG9wdGlvbiB0aGF0IGhhcyBiZWVuIGNvbmZpZ3VyZWQgYXQgdGhlIGBUZXN0QmVkYCBpbnN0YW5jZSBsZXZlbC5cbiAgICogVGhpcyBvcHRpb24gdGFrZXMgcHJlY2VkZW5jZSBvdmVyIHRoZSBlbnZpcm9ubWVudC1sZXZlbCBvbmUuXG4gICAqL1xuICBwcml2YXRlIF9pbnN0YW5jZUVycm9yT25Vbmtub3duUHJvcGVydGllc09wdGlvbjogYm9vbGVhbnx1bmRlZmluZWQ7XG5cbiAgLyoqXG4gICAqIFN0b3JlcyB0aGUgcHJldmlvdXMgXCJFcnJvciBvbiB1bmtub3duIGVsZW1lbnRzXCIgb3B0aW9uIHZhbHVlLFxuICAgKiBhbGxvd2luZyB0byByZXN0b3JlIGl0IGluIHRoZSByZXNldCB0ZXN0aW5nIG1vZHVsZSBsb2dpYy5cbiAgICovXG4gIHByaXZhdGUgX3ByZXZpb3VzRXJyb3JPblVua25vd25FbGVtZW50c09wdGlvbjogYm9vbGVhbnx1bmRlZmluZWQ7XG5cbiAgLyoqXG4gICAqIFN0b3JlcyB0aGUgcHJldmlvdXMgXCJFcnJvciBvbiB1bmtub3duIHByb3BlcnRpZXNcIiBvcHRpb24gdmFsdWUsXG4gICAqIGFsbG93aW5nIHRvIHJlc3RvcmUgaXQgaW4gdGhlIHJlc2V0IHRlc3RpbmcgbW9kdWxlIGxvZ2ljLlxuICAgKi9cbiAgcHJpdmF0ZSBfcHJldmlvdXNFcnJvck9uVW5rbm93blByb3BlcnRpZXNPcHRpb246IGJvb2xlYW58dW5kZWZpbmVkO1xuXG4gIC8qKlxuICAgKiBJbml0aWFsaXplIHRoZSBlbnZpcm9ubWVudCBmb3IgdGVzdGluZyB3aXRoIGEgY29tcGlsZXIgZmFjdG9yeSwgYSBQbGF0Zm9ybVJlZiwgYW5kIGFuXG4gICAqIGFuZ3VsYXIgbW9kdWxlLiBUaGVzZSBhcmUgY29tbW9uIHRvIGV2ZXJ5IHRlc3QgaW4gdGhlIHN1aXRlLlxuICAgKlxuICAgKiBUaGlzIG1heSBvbmx5IGJlIGNhbGxlZCBvbmNlLCB0byBzZXQgdXAgdGhlIGNvbW1vbiBwcm92aWRlcnMgZm9yIHRoZSBjdXJyZW50IHRlc3RcbiAgICogc3VpdGUgb24gdGhlIGN1cnJlbnQgcGxhdGZvcm0uIElmIHlvdSBhYnNvbHV0ZWx5IG5lZWQgdG8gY2hhbmdlIHRoZSBwcm92aWRlcnMsXG4gICAqIGZpcnN0IHVzZSBgcmVzZXRUZXN0RW52aXJvbm1lbnRgLlxuICAgKlxuICAgKiBUZXN0IG1vZHVsZXMgYW5kIHBsYXRmb3JtcyBmb3IgaW5kaXZpZHVhbCBwbGF0Zm9ybXMgYXJlIGF2YWlsYWJsZSBmcm9tXG4gICAqICdAYW5ndWxhci88cGxhdGZvcm1fbmFtZT4vdGVzdGluZycuXG4gICAqXG4gICAqIEBwdWJsaWNBcGlcbiAgICovXG4gIHN0YXRpYyBpbml0VGVzdEVudmlyb25tZW50KFxuICAgICAgbmdNb2R1bGU6IFR5cGU8YW55PnxUeXBlPGFueT5bXSwgcGxhdGZvcm06IFBsYXRmb3JtUmVmLFxuICAgICAgb3B0aW9ucz86IFRlc3RFbnZpcm9ubWVudE9wdGlvbnMpOiBUZXN0QmVkIHtcbiAgICBjb25zdCB0ZXN0QmVkID0gVGVzdEJlZEltcGwuSU5TVEFOQ0U7XG4gICAgdGVzdEJlZC5pbml0VGVzdEVudmlyb25tZW50KG5nTW9kdWxlLCBwbGF0Zm9ybSwgb3B0aW9ucyk7XG4gICAgcmV0dXJuIHRlc3RCZWQ7XG4gIH1cblxuICAvKipcbiAgICogUmVzZXQgdGhlIHByb3ZpZGVycyBmb3IgdGhlIHRlc3QgaW5qZWN0b3IuXG4gICAqXG4gICAqIEBwdWJsaWNBcGlcbiAgICovXG4gIHN0YXRpYyByZXNldFRlc3RFbnZpcm9ubWVudCgpOiB2b2lkIHtcbiAgICBUZXN0QmVkSW1wbC5JTlNUQU5DRS5yZXNldFRlc3RFbnZpcm9ubWVudCgpO1xuICB9XG5cbiAgc3RhdGljIGNvbmZpZ3VyZUNvbXBpbGVyKGNvbmZpZzoge3Byb3ZpZGVycz86IGFueVtdOyB1c2VKaXQ/OiBib29sZWFuO30pOiBUZXN0QmVkIHtcbiAgICByZXR1cm4gVGVzdEJlZEltcGwuSU5TVEFOQ0UuY29uZmlndXJlQ29tcGlsZXIoY29uZmlnKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBbGxvd3Mgb3ZlcnJpZGluZyBkZWZhdWx0IHByb3ZpZGVycywgZGlyZWN0aXZlcywgcGlwZXMsIG1vZHVsZXMgb2YgdGhlIHRlc3QgaW5qZWN0b3IsXG4gICAqIHdoaWNoIGFyZSBkZWZpbmVkIGluIHRlc3RfaW5qZWN0b3IuanNcbiAgICovXG4gIHN0YXRpYyBjb25maWd1cmVUZXN0aW5nTW9kdWxlKG1vZHVsZURlZjogVGVzdE1vZHVsZU1ldGFkYXRhKTogVGVzdEJlZCB7XG4gICAgcmV0dXJuIFRlc3RCZWRJbXBsLklOU1RBTkNFLmNvbmZpZ3VyZVRlc3RpbmdNb2R1bGUobW9kdWxlRGVmKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb21waWxlIGNvbXBvbmVudHMgd2l0aCBhIGB0ZW1wbGF0ZVVybGAgZm9yIHRoZSB0ZXN0J3MgTmdNb2R1bGUuXG4gICAqIEl0IGlzIG5lY2Vzc2FyeSB0byBjYWxsIHRoaXMgZnVuY3Rpb25cbiAgICogYXMgZmV0Y2hpbmcgdXJscyBpcyBhc3luY2hyb25vdXMuXG4gICAqL1xuICBzdGF0aWMgY29tcGlsZUNvbXBvbmVudHMoKTogUHJvbWlzZTxhbnk+IHtcbiAgICByZXR1cm4gVGVzdEJlZEltcGwuSU5TVEFOQ0UuY29tcGlsZUNvbXBvbmVudHMoKTtcbiAgfVxuXG4gIHN0YXRpYyBvdmVycmlkZU1vZHVsZShuZ01vZHVsZTogVHlwZTxhbnk+LCBvdmVycmlkZTogTWV0YWRhdGFPdmVycmlkZTxOZ01vZHVsZT4pOiBUZXN0QmVkIHtcbiAgICByZXR1cm4gVGVzdEJlZEltcGwuSU5TVEFOQ0Uub3ZlcnJpZGVNb2R1bGUobmdNb2R1bGUsIG92ZXJyaWRlKTtcbiAgfVxuXG4gIHN0YXRpYyBvdmVycmlkZUNvbXBvbmVudChjb21wb25lbnQ6IFR5cGU8YW55Piwgb3ZlcnJpZGU6IE1ldGFkYXRhT3ZlcnJpZGU8Q29tcG9uZW50Pik6IFRlc3RCZWQge1xuICAgIHJldHVybiBUZXN0QmVkSW1wbC5JTlNUQU5DRS5vdmVycmlkZUNvbXBvbmVudChjb21wb25lbnQsIG92ZXJyaWRlKTtcbiAgfVxuXG4gIHN0YXRpYyBvdmVycmlkZURpcmVjdGl2ZShkaXJlY3RpdmU6IFR5cGU8YW55Piwgb3ZlcnJpZGU6IE1ldGFkYXRhT3ZlcnJpZGU8RGlyZWN0aXZlPik6IFRlc3RCZWQge1xuICAgIHJldHVybiBUZXN0QmVkSW1wbC5JTlNUQU5DRS5vdmVycmlkZURpcmVjdGl2ZShkaXJlY3RpdmUsIG92ZXJyaWRlKTtcbiAgfVxuXG4gIHN0YXRpYyBvdmVycmlkZVBpcGUocGlwZTogVHlwZTxhbnk+LCBvdmVycmlkZTogTWV0YWRhdGFPdmVycmlkZTxQaXBlPik6IFRlc3RCZWQge1xuICAgIHJldHVybiBUZXN0QmVkSW1wbC5JTlNUQU5DRS5vdmVycmlkZVBpcGUocGlwZSwgb3ZlcnJpZGUpO1xuICB9XG5cbiAgc3RhdGljIG92ZXJyaWRlVGVtcGxhdGUoY29tcG9uZW50OiBUeXBlPGFueT4sIHRlbXBsYXRlOiBzdHJpbmcpOiBUZXN0QmVkIHtcbiAgICByZXR1cm4gVGVzdEJlZEltcGwuSU5TVEFOQ0Uub3ZlcnJpZGVUZW1wbGF0ZShjb21wb25lbnQsIHRlbXBsYXRlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBPdmVycmlkZXMgdGhlIHRlbXBsYXRlIG9mIHRoZSBnaXZlbiBjb21wb25lbnQsIGNvbXBpbGluZyB0aGUgdGVtcGxhdGVcbiAgICogaW4gdGhlIGNvbnRleHQgb2YgdGhlIFRlc3RpbmdNb2R1bGUuXG4gICAqXG4gICAqIE5vdGU6IFRoaXMgd29ya3MgZm9yIEpJVCBhbmQgQU9UZWQgY29tcG9uZW50cyBhcyB3ZWxsLlxuICAgKi9cbiAgc3RhdGljIG92ZXJyaWRlVGVtcGxhdGVVc2luZ1Rlc3RpbmdNb2R1bGUoY29tcG9uZW50OiBUeXBlPGFueT4sIHRlbXBsYXRlOiBzdHJpbmcpOiBUZXN0QmVkIHtcbiAgICByZXR1cm4gVGVzdEJlZEltcGwuSU5TVEFOQ0Uub3ZlcnJpZGVUZW1wbGF0ZVVzaW5nVGVzdGluZ01vZHVsZShjb21wb25lbnQsIHRlbXBsYXRlKTtcbiAgfVxuXG4gIHN0YXRpYyBvdmVycmlkZVByb3ZpZGVyKHRva2VuOiBhbnksIHByb3ZpZGVyOiB7XG4gICAgdXNlRmFjdG9yeTogRnVuY3Rpb24sXG4gICAgZGVwczogYW55W10sXG4gIH0pOiBUZXN0QmVkO1xuICBzdGF0aWMgb3ZlcnJpZGVQcm92aWRlcih0b2tlbjogYW55LCBwcm92aWRlcjoge3VzZVZhbHVlOiBhbnk7fSk6IFRlc3RCZWQ7XG4gIHN0YXRpYyBvdmVycmlkZVByb3ZpZGVyKHRva2VuOiBhbnksIHByb3ZpZGVyOiB7XG4gICAgdXNlRmFjdG9yeT86IEZ1bmN0aW9uLFxuICAgIHVzZVZhbHVlPzogYW55LFxuICAgIGRlcHM/OiBhbnlbXSxcbiAgfSk6IFRlc3RCZWQge1xuICAgIHJldHVybiBUZXN0QmVkSW1wbC5JTlNUQU5DRS5vdmVycmlkZVByb3ZpZGVyKHRva2VuLCBwcm92aWRlcik7XG4gIH1cblxuICBzdGF0aWMgaW5qZWN0PFQ+KHRva2VuOiBQcm92aWRlclRva2VuPFQ+LCBub3RGb3VuZFZhbHVlOiB1bmRlZmluZWQsIG9wdGlvbnM6IEluamVjdE9wdGlvbnMme1xuICAgIG9wdGlvbmFsPzogZmFsc2VcbiAgfSk6IFQ7XG4gIHN0YXRpYyBpbmplY3Q8VD4odG9rZW46IFByb3ZpZGVyVG9rZW48VD4sIG5vdEZvdW5kVmFsdWU6IG51bGx8dW5kZWZpbmVkLCBvcHRpb25zOiBJbmplY3RPcHRpb25zKTpcbiAgICAgIFR8bnVsbDtcbiAgc3RhdGljIGluamVjdDxUPih0b2tlbjogUHJvdmlkZXJUb2tlbjxUPiwgbm90Rm91bmRWYWx1ZT86IFQsIG9wdGlvbnM/OiBJbmplY3RPcHRpb25zKTogVDtcbiAgLyoqIEBkZXByZWNhdGVkIHVzZSBvYmplY3QtYmFzZWQgZmxhZ3MgKGBJbmplY3RPcHRpb25zYCkgaW5zdGVhZC4gKi9cbiAgc3RhdGljIGluamVjdDxUPih0b2tlbjogUHJvdmlkZXJUb2tlbjxUPiwgbm90Rm91bmRWYWx1ZT86IFQsIGZsYWdzPzogSW5qZWN0RmxhZ3MpOiBUO1xuICAvKiogQGRlcHJlY2F0ZWQgdXNlIG9iamVjdC1iYXNlZCBmbGFncyAoYEluamVjdE9wdGlvbnNgKSBpbnN0ZWFkLiAqL1xuICBzdGF0aWMgaW5qZWN0PFQ+KHRva2VuOiBQcm92aWRlclRva2VuPFQ+LCBub3RGb3VuZFZhbHVlOiBudWxsLCBmbGFncz86IEluamVjdEZsYWdzKTogVHxudWxsO1xuICBzdGF0aWMgaW5qZWN0PFQ+KFxuICAgICAgdG9rZW46IFByb3ZpZGVyVG9rZW48VD4sIG5vdEZvdW5kVmFsdWU/OiBUfG51bGwsIGZsYWdzPzogSW5qZWN0RmxhZ3N8SW5qZWN0T3B0aW9ucyk6IFR8bnVsbCB7XG4gICAgcmV0dXJuIFRlc3RCZWRJbXBsLklOU1RBTkNFLmluamVjdCh0b2tlbiwgbm90Rm91bmRWYWx1ZSwgY29udmVydFRvQml0RmxhZ3MoZmxhZ3MpKTtcbiAgfVxuXG4gIC8qKiBAZGVwcmVjYXRlZCBmcm9tIHY5LjAuMCB1c2UgVGVzdEJlZC5pbmplY3QgKi9cbiAgc3RhdGljIGdldDxUPih0b2tlbjogUHJvdmlkZXJUb2tlbjxUPiwgbm90Rm91bmRWYWx1ZT86IFQsIGZsYWdzPzogSW5qZWN0RmxhZ3MpOiBhbnk7XG4gIC8qKiBAZGVwcmVjYXRlZCBmcm9tIHY5LjAuMCB1c2UgVGVzdEJlZC5pbmplY3QgKi9cbiAgc3RhdGljIGdldCh0b2tlbjogYW55LCBub3RGb3VuZFZhbHVlPzogYW55KTogYW55O1xuICAvKiogQGRlcHJlY2F0ZWQgZnJvbSB2OS4wLjAgdXNlIFRlc3RCZWQuaW5qZWN0ICovXG4gIHN0YXRpYyBnZXQoXG4gICAgICB0b2tlbjogYW55LCBub3RGb3VuZFZhbHVlOiBhbnkgPSBJbmplY3Rvci5USFJPV19JRl9OT1RfRk9VTkQsXG4gICAgICBmbGFnczogSW5qZWN0RmxhZ3MgPSBJbmplY3RGbGFncy5EZWZhdWx0KTogYW55IHtcbiAgICByZXR1cm4gVGVzdEJlZEltcGwuSU5TVEFOQ0UuaW5qZWN0KHRva2VuLCBub3RGb3VuZFZhbHVlLCBmbGFncyk7XG4gIH1cblxuICAvKipcbiAgICogUnVucyB0aGUgZ2l2ZW4gZnVuY3Rpb24gaW4gdGhlIGBFbnZpcm9ubWVudEluamVjdG9yYCBjb250ZXh0IG9mIGBUZXN0QmVkYC5cbiAgICpcbiAgICogQHNlZSBFbnZpcm9ubWVudEluamVjdG9yI3J1bkluQ29udGV4dFxuICAgKi9cbiAgc3RhdGljIHJ1bkluSW5qZWN0aW9uQ29udGV4dDxUPihmbjogKCkgPT4gVCk6IFQge1xuICAgIHJldHVybiBUZXN0QmVkSW1wbC5JTlNUQU5DRS5ydW5JbkluamVjdGlvbkNvbnRleHQoZm4pO1xuICB9XG5cbiAgc3RhdGljIGNyZWF0ZUNvbXBvbmVudDxUPihjb21wb25lbnQ6IFR5cGU8VD4pOiBDb21wb25lbnRGaXh0dXJlPFQ+IHtcbiAgICByZXR1cm4gVGVzdEJlZEltcGwuSU5TVEFOQ0UuY3JlYXRlQ29tcG9uZW50KGNvbXBvbmVudCk7XG4gIH1cblxuICBzdGF0aWMgcmVzZXRUZXN0aW5nTW9kdWxlKCk6IFRlc3RCZWQge1xuICAgIHJldHVybiBUZXN0QmVkSW1wbC5JTlNUQU5DRS5yZXNldFRlc3RpbmdNb2R1bGUoKTtcbiAgfVxuXG4gIHN0YXRpYyBleGVjdXRlKHRva2VuczogYW55W10sIGZuOiBGdW5jdGlvbiwgY29udGV4dD86IGFueSk6IGFueSB7XG4gICAgcmV0dXJuIFRlc3RCZWRJbXBsLklOU1RBTkNFLmV4ZWN1dGUodG9rZW5zLCBmbiwgY29udGV4dCk7XG4gIH1cblxuICBzdGF0aWMgZ2V0IHBsYXRmb3JtKCk6IFBsYXRmb3JtUmVmIHtcbiAgICByZXR1cm4gVGVzdEJlZEltcGwuSU5TVEFOQ0UucGxhdGZvcm07XG4gIH1cblxuICBzdGF0aWMgZ2V0IG5nTW9kdWxlKCk6IFR5cGU8YW55PnxUeXBlPGFueT5bXSB7XG4gICAgcmV0dXJuIFRlc3RCZWRJbXBsLklOU1RBTkNFLm5nTW9kdWxlO1xuICB9XG5cbiAgLy8gUHJvcGVydGllc1xuXG4gIHBsYXRmb3JtOiBQbGF0Zm9ybVJlZiA9IG51bGwhO1xuICBuZ01vZHVsZTogVHlwZTxhbnk+fFR5cGU8YW55PltdID0gbnVsbCE7XG5cbiAgcHJpdmF0ZSBfY29tcGlsZXI6IFRlc3RCZWRDb21waWxlcnxudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBfdGVzdE1vZHVsZVJlZjogTmdNb2R1bGVSZWY8YW55PnxudWxsID0gbnVsbDtcblxuICBwcml2YXRlIF9hY3RpdmVGaXh0dXJlczogQ29tcG9uZW50Rml4dHVyZTxhbnk+W10gPSBbXTtcblxuICAvKipcbiAgICogSW50ZXJuYWwtb25seSBmbGFnIHRvIGluZGljYXRlIHdoZXRoZXIgYSBtb2R1bGVcbiAgICogc2NvcGluZyBxdWV1ZSBoYXMgYmVlbiBjaGVja2VkIGFuZCBmbHVzaGVkIGFscmVhZHkuXG4gICAqIEBub2RvY1xuICAgKi9cbiAgZ2xvYmFsQ29tcGlsYXRpb25DaGVja2VkID0gZmFsc2U7XG5cbiAgLyoqXG4gICAqIEluaXRpYWxpemUgdGhlIGVudmlyb25tZW50IGZvciB0ZXN0aW5nIHdpdGggYSBjb21waWxlciBmYWN0b3J5LCBhIFBsYXRmb3JtUmVmLCBhbmQgYW5cbiAgICogYW5ndWxhciBtb2R1bGUuIFRoZXNlIGFyZSBjb21tb24gdG8gZXZlcnkgdGVzdCBpbiB0aGUgc3VpdGUuXG4gICAqXG4gICAqIFRoaXMgbWF5IG9ubHkgYmUgY2FsbGVkIG9uY2UsIHRvIHNldCB1cCB0aGUgY29tbW9uIHByb3ZpZGVycyBmb3IgdGhlIGN1cnJlbnQgdGVzdFxuICAgKiBzdWl0ZSBvbiB0aGUgY3VycmVudCBwbGF0Zm9ybS4gSWYgeW91IGFic29sdXRlbHkgbmVlZCB0byBjaGFuZ2UgdGhlIHByb3ZpZGVycyxcbiAgICogZmlyc3QgdXNlIGByZXNldFRlc3RFbnZpcm9ubWVudGAuXG4gICAqXG4gICAqIFRlc3QgbW9kdWxlcyBhbmQgcGxhdGZvcm1zIGZvciBpbmRpdmlkdWFsIHBsYXRmb3JtcyBhcmUgYXZhaWxhYmxlIGZyb21cbiAgICogJ0Bhbmd1bGFyLzxwbGF0Zm9ybV9uYW1lPi90ZXN0aW5nJy5cbiAgICpcbiAgICogQHB1YmxpY0FwaVxuICAgKi9cbiAgaW5pdFRlc3RFbnZpcm9ubWVudChcbiAgICAgIG5nTW9kdWxlOiBUeXBlPGFueT58VHlwZTxhbnk+W10sIHBsYXRmb3JtOiBQbGF0Zm9ybVJlZixcbiAgICAgIG9wdGlvbnM/OiBUZXN0RW52aXJvbm1lbnRPcHRpb25zKTogdm9pZCB7XG4gICAgaWYgKHRoaXMucGxhdGZvcm0gfHwgdGhpcy5uZ01vZHVsZSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3Qgc2V0IGJhc2UgcHJvdmlkZXJzIGJlY2F1c2UgaXQgaGFzIGFscmVhZHkgYmVlbiBjYWxsZWQnKTtcbiAgICB9XG5cbiAgICBUZXN0QmVkSW1wbC5fZW52aXJvbm1lbnRUZWFyZG93bk9wdGlvbnMgPSBvcHRpb25zPy50ZWFyZG93bjtcblxuICAgIFRlc3RCZWRJbXBsLl9lbnZpcm9ubWVudEVycm9yT25Vbmtub3duRWxlbWVudHNPcHRpb24gPSBvcHRpb25zPy5lcnJvck9uVW5rbm93bkVsZW1lbnRzO1xuXG4gICAgVGVzdEJlZEltcGwuX2Vudmlyb25tZW50RXJyb3JPblVua25vd25Qcm9wZXJ0aWVzT3B0aW9uID0gb3B0aW9ucz8uZXJyb3JPblVua25vd25Qcm9wZXJ0aWVzO1xuXG4gICAgdGhpcy5wbGF0Zm9ybSA9IHBsYXRmb3JtO1xuICAgIHRoaXMubmdNb2R1bGUgPSBuZ01vZHVsZTtcbiAgICB0aGlzLl9jb21waWxlciA9IG5ldyBUZXN0QmVkQ29tcGlsZXIodGhpcy5wbGF0Zm9ybSwgdGhpcy5uZ01vZHVsZSk7XG5cbiAgICAvLyBUZXN0QmVkIGRvZXMgbm90IGhhdmUgYW4gQVBJIHdoaWNoIGNhbiByZWxpYWJseSBkZXRlY3QgdGhlIHN0YXJ0IG9mIGEgdGVzdCwgYW5kIHRodXMgY291bGQgYmVcbiAgICAvLyB1c2VkIHRvIHRyYWNrIHRoZSBzdGF0ZSBvZiB0aGUgTmdNb2R1bGUgcmVnaXN0cnkgYW5kIHJlc2V0IGl0IGNvcnJlY3RseS4gSW5zdGVhZCwgd2hlbiB3ZVxuICAgIC8vIGtub3cgd2UncmUgaW4gYSB0ZXN0aW5nIHNjZW5hcmlvLCB3ZSBkaXNhYmxlIHRoZSBjaGVjayBmb3IgZHVwbGljYXRlIE5nTW9kdWxlIHJlZ2lzdHJhdGlvblxuICAgIC8vIGNvbXBsZXRlbHkuXG4gICAgc2V0QWxsb3dEdXBsaWNhdGVOZ01vZHVsZUlkc0ZvclRlc3QodHJ1ZSk7XG4gIH1cblxuICAvKipcbiAgICogUmVzZXQgdGhlIHByb3ZpZGVycyBmb3IgdGhlIHRlc3QgaW5qZWN0b3IuXG4gICAqXG4gICAqIEBwdWJsaWNBcGlcbiAgICovXG4gIHJlc2V0VGVzdEVudmlyb25tZW50KCk6IHZvaWQge1xuICAgIHRoaXMucmVzZXRUZXN0aW5nTW9kdWxlKCk7XG4gICAgdGhpcy5fY29tcGlsZXIgPSBudWxsO1xuICAgIHRoaXMucGxhdGZvcm0gPSBudWxsITtcbiAgICB0aGlzLm5nTW9kdWxlID0gbnVsbCE7XG4gICAgVGVzdEJlZEltcGwuX2Vudmlyb25tZW50VGVhcmRvd25PcHRpb25zID0gdW5kZWZpbmVkO1xuICAgIHNldEFsbG93RHVwbGljYXRlTmdNb2R1bGVJZHNGb3JUZXN0KGZhbHNlKTtcbiAgfVxuXG4gIHJlc2V0VGVzdGluZ01vZHVsZSgpOiB0aGlzIHtcbiAgICB0aGlzLmNoZWNrR2xvYmFsQ29tcGlsYXRpb25GaW5pc2hlZCgpO1xuICAgIHJlc2V0Q29tcGlsZWRDb21wb25lbnRzKCk7XG4gICAgaWYgKHRoaXMuX2NvbXBpbGVyICE9PSBudWxsKSB7XG4gICAgICB0aGlzLmNvbXBpbGVyLnJlc3RvcmVPcmlnaW5hbFN0YXRlKCk7XG4gICAgfVxuICAgIHRoaXMuX2NvbXBpbGVyID0gbmV3IFRlc3RCZWRDb21waWxlcih0aGlzLnBsYXRmb3JtLCB0aGlzLm5nTW9kdWxlKTtcbiAgICAvLyBSZXN0b3JlIHRoZSBwcmV2aW91cyB2YWx1ZSBvZiB0aGUgXCJlcnJvciBvbiB1bmtub3duIGVsZW1lbnRzXCIgb3B0aW9uXG4gICAgc2V0VW5rbm93bkVsZW1lbnRTdHJpY3RNb2RlKFxuICAgICAgICB0aGlzLl9wcmV2aW91c0Vycm9yT25Vbmtub3duRWxlbWVudHNPcHRpb24gPz8gVEhST1dfT05fVU5LTk9XTl9FTEVNRU5UU19ERUZBVUxUKTtcbiAgICAvLyBSZXN0b3JlIHRoZSBwcmV2aW91cyB2YWx1ZSBvZiB0aGUgXCJlcnJvciBvbiB1bmtub3duIHByb3BlcnRpZXNcIiBvcHRpb25cbiAgICBzZXRVbmtub3duUHJvcGVydHlTdHJpY3RNb2RlKFxuICAgICAgICB0aGlzLl9wcmV2aW91c0Vycm9yT25Vbmtub3duUHJvcGVydGllc09wdGlvbiA/PyBUSFJPV19PTl9VTktOT1dOX1BST1BFUlRJRVNfREVGQVVMVCk7XG5cbiAgICAvLyBXZSBoYXZlIHRvIGNoYWluIGEgY291cGxlIG9mIHRyeS9maW5hbGx5IGJsb2NrcywgYmVjYXVzZSBlYWNoIHN0ZXAgY2FuXG4gICAgLy8gdGhyb3cgZXJyb3JzIGFuZCB3ZSBkb24ndCB3YW50IGl0IHRvIGludGVycnVwdCB0aGUgbmV4dCBzdGVwIGFuZCB3ZSBhbHNvXG4gICAgLy8gd2FudCBhbiBlcnJvciB0byBiZSB0aHJvd24gYXQgdGhlIGVuZC5cbiAgICB0cnkge1xuICAgICAgdGhpcy5kZXN0cm95QWN0aXZlRml4dHVyZXMoKTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgdHJ5IHtcbiAgICAgICAgaWYgKHRoaXMuc2hvdWxkVGVhckRvd25UZXN0aW5nTW9kdWxlKCkpIHtcbiAgICAgICAgICB0aGlzLnRlYXJEb3duVGVzdGluZ01vZHVsZSgpO1xuICAgICAgICB9XG4gICAgICB9IGZpbmFsbHkge1xuICAgICAgICB0aGlzLl90ZXN0TW9kdWxlUmVmID0gbnVsbDtcbiAgICAgICAgdGhpcy5faW5zdGFuY2VUZWFyZG93bk9wdGlvbnMgPSB1bmRlZmluZWQ7XG4gICAgICAgIHRoaXMuX2luc3RhbmNlRXJyb3JPblVua25vd25FbGVtZW50c09wdGlvbiA9IHVuZGVmaW5lZDtcbiAgICAgICAgdGhpcy5faW5zdGFuY2VFcnJvck9uVW5rbm93blByb3BlcnRpZXNPcHRpb24gPSB1bmRlZmluZWQ7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgY29uZmlndXJlQ29tcGlsZXIoY29uZmlnOiB7cHJvdmlkZXJzPzogYW55W107IHVzZUppdD86IGJvb2xlYW47fSk6IHRoaXMge1xuICAgIGlmIChjb25maWcudXNlSml0ICE9IG51bGwpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignSklUIGNvbXBpbGVyIGlzIG5vdCBjb25maWd1cmFibGUgdmlhIFRlc3RCZWQgQVBJcy4nKTtcbiAgICB9XG5cbiAgICBpZiAoY29uZmlnLnByb3ZpZGVycyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzLmNvbXBpbGVyLnNldENvbXBpbGVyUHJvdmlkZXJzKGNvbmZpZy5wcm92aWRlcnMpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIGNvbmZpZ3VyZVRlc3RpbmdNb2R1bGUobW9kdWxlRGVmOiBUZXN0TW9kdWxlTWV0YWRhdGEpOiB0aGlzIHtcbiAgICB0aGlzLmFzc2VydE5vdEluc3RhbnRpYXRlZCgnVGVzdEJlZC5jb25maWd1cmVUZXN0aW5nTW9kdWxlJywgJ2NvbmZpZ3VyZSB0aGUgdGVzdCBtb2R1bGUnKTtcblxuICAgIC8vIFRyaWdnZXIgbW9kdWxlIHNjb3BpbmcgcXVldWUgZmx1c2ggYmVmb3JlIGV4ZWN1dGluZyBvdGhlciBUZXN0QmVkIG9wZXJhdGlvbnMgaW4gYSB0ZXN0LlxuICAgIC8vIFRoaXMgaXMgbmVlZGVkIGZvciB0aGUgZmlyc3QgdGVzdCBpbnZvY2F0aW9uIHRvIGVuc3VyZSB0aGF0IGdsb2JhbGx5IGRlY2xhcmVkIG1vZHVsZXMgaGF2ZVxuICAgIC8vIHRoZWlyIGNvbXBvbmVudHMgc2NvcGVkIHByb3Blcmx5LiBTZWUgdGhlIGBjaGVja0dsb2JhbENvbXBpbGF0aW9uRmluaXNoZWRgIGZ1bmN0aW9uXG4gICAgLy8gZGVzY3JpcHRpb24gZm9yIGFkZGl0aW9uYWwgaW5mby5cbiAgICB0aGlzLmNoZWNrR2xvYmFsQ29tcGlsYXRpb25GaW5pc2hlZCgpO1xuXG4gICAgLy8gQWx3YXlzIHJlLWFzc2lnbiB0aGUgb3B0aW9ucywgZXZlbiBpZiB0aGV5J3JlIHVuZGVmaW5lZC5cbiAgICAvLyBUaGlzIGVuc3VyZXMgdGhhdCB3ZSBkb24ndCBjYXJyeSB0aGVtIGJldHdlZW4gdGVzdHMuXG4gICAgdGhpcy5faW5zdGFuY2VUZWFyZG93bk9wdGlvbnMgPSBtb2R1bGVEZWYudGVhcmRvd247XG4gICAgdGhpcy5faW5zdGFuY2VFcnJvck9uVW5rbm93bkVsZW1lbnRzT3B0aW9uID0gbW9kdWxlRGVmLmVycm9yT25Vbmtub3duRWxlbWVudHM7XG4gICAgdGhpcy5faW5zdGFuY2VFcnJvck9uVW5rbm93blByb3BlcnRpZXNPcHRpb24gPSBtb2R1bGVEZWYuZXJyb3JPblVua25vd25Qcm9wZXJ0aWVzO1xuICAgIC8vIFN0b3JlIHRoZSBjdXJyZW50IHZhbHVlIG9mIHRoZSBzdHJpY3QgbW9kZSBvcHRpb24sXG4gICAgLy8gc28gd2UgY2FuIHJlc3RvcmUgaXQgbGF0ZXJcbiAgICB0aGlzLl9wcmV2aW91c0Vycm9yT25Vbmtub3duRWxlbWVudHNPcHRpb24gPSBnZXRVbmtub3duRWxlbWVudFN0cmljdE1vZGUoKTtcbiAgICBzZXRVbmtub3duRWxlbWVudFN0cmljdE1vZGUodGhpcy5zaG91bGRUaHJvd0Vycm9yT25Vbmtub3duRWxlbWVudHMoKSk7XG4gICAgdGhpcy5fcHJldmlvdXNFcnJvck9uVW5rbm93blByb3BlcnRpZXNPcHRpb24gPSBnZXRVbmtub3duUHJvcGVydHlTdHJpY3RNb2RlKCk7XG4gICAgc2V0VW5rbm93blByb3BlcnR5U3RyaWN0TW9kZSh0aGlzLnNob3VsZFRocm93RXJyb3JPblVua25vd25Qcm9wZXJ0aWVzKCkpO1xuICAgIHRoaXMuY29tcGlsZXIuY29uZmlndXJlVGVzdGluZ01vZHVsZShtb2R1bGVEZWYpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgY29tcGlsZUNvbXBvbmVudHMoKTogUHJvbWlzZTxhbnk+IHtcbiAgICByZXR1cm4gdGhpcy5jb21waWxlci5jb21waWxlQ29tcG9uZW50cygpO1xuICB9XG5cbiAgaW5qZWN0PFQ+KHRva2VuOiBQcm92aWRlclRva2VuPFQ+LCBub3RGb3VuZFZhbHVlOiB1bmRlZmluZWQsIG9wdGlvbnM6IEluamVjdE9wdGlvbnMme1xuICAgIG9wdGlvbmFsOiB0cnVlXG4gIH0pOiBUfG51bGw7XG4gIGluamVjdDxUPih0b2tlbjogUHJvdmlkZXJUb2tlbjxUPiwgbm90Rm91bmRWYWx1ZT86IFQsIG9wdGlvbnM/OiBJbmplY3RPcHRpb25zKTogVDtcbiAgaW5qZWN0PFQ+KHRva2VuOiBQcm92aWRlclRva2VuPFQ+LCBub3RGb3VuZFZhbHVlOiBudWxsLCBvcHRpb25zPzogSW5qZWN0T3B0aW9ucyk6IFR8bnVsbDtcbiAgLyoqIEBkZXByZWNhdGVkIHVzZSBvYmplY3QtYmFzZWQgZmxhZ3MgKGBJbmplY3RPcHRpb25zYCkgaW5zdGVhZC4gKi9cbiAgaW5qZWN0PFQ+KHRva2VuOiBQcm92aWRlclRva2VuPFQ+LCBub3RGb3VuZFZhbHVlPzogVCwgZmxhZ3M/OiBJbmplY3RGbGFncyk6IFQ7XG4gIC8qKiBAZGVwcmVjYXRlZCB1c2Ugb2JqZWN0LWJhc2VkIGZsYWdzIChgSW5qZWN0T3B0aW9uc2ApIGluc3RlYWQuICovXG4gIGluamVjdDxUPih0b2tlbjogUHJvdmlkZXJUb2tlbjxUPiwgbm90Rm91bmRWYWx1ZTogbnVsbCwgZmxhZ3M/OiBJbmplY3RGbGFncyk6IFR8bnVsbDtcbiAgaW5qZWN0PFQ+KHRva2VuOiBQcm92aWRlclRva2VuPFQ+LCBub3RGb3VuZFZhbHVlPzogVHxudWxsLCBmbGFncz86IEluamVjdEZsYWdzfEluamVjdE9wdGlvbnMpOiBUXG4gICAgICB8bnVsbCB7XG4gICAgaWYgKHRva2VuIGFzIHVua25vd24gPT09IFRlc3RCZWQpIHtcbiAgICAgIHJldHVybiB0aGlzIGFzIGFueTtcbiAgICB9XG4gICAgY29uc3QgVU5ERUZJTkVEID0ge30gYXMgdW5rbm93biBhcyBUO1xuICAgIGNvbnN0IHJlc3VsdCA9IHRoaXMudGVzdE1vZHVsZVJlZi5pbmplY3Rvci5nZXQodG9rZW4sIFVOREVGSU5FRCwgY29udmVydFRvQml0RmxhZ3MoZmxhZ3MpKTtcbiAgICByZXR1cm4gcmVzdWx0ID09PSBVTkRFRklORUQgPyB0aGlzLmNvbXBpbGVyLmluamVjdG9yLmdldCh0b2tlbiwgbm90Rm91bmRWYWx1ZSwgZmxhZ3MpIGFzIGFueSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0O1xuICB9XG5cbiAgLyoqIEBkZXByZWNhdGVkIGZyb20gdjkuMC4wIHVzZSBUZXN0QmVkLmluamVjdCAqL1xuICBnZXQ8VD4odG9rZW46IFByb3ZpZGVyVG9rZW48VD4sIG5vdEZvdW5kVmFsdWU/OiBULCBmbGFncz86IEluamVjdEZsYWdzKTogYW55O1xuICAvKiogQGRlcHJlY2F0ZWQgZnJvbSB2OS4wLjAgdXNlIFRlc3RCZWQuaW5qZWN0ICovXG4gIGdldCh0b2tlbjogYW55LCBub3RGb3VuZFZhbHVlPzogYW55KTogYW55O1xuICAvKiogQGRlcHJlY2F0ZWQgZnJvbSB2OS4wLjAgdXNlIFRlc3RCZWQuaW5qZWN0ICovXG4gIGdldCh0b2tlbjogYW55LCBub3RGb3VuZFZhbHVlOiBhbnkgPSBJbmplY3Rvci5USFJPV19JRl9OT1RfRk9VTkQsXG4gICAgICBmbGFnczogSW5qZWN0RmxhZ3MgPSBJbmplY3RGbGFncy5EZWZhdWx0KTogYW55IHtcbiAgICByZXR1cm4gdGhpcy5pbmplY3QodG9rZW4sIG5vdEZvdW5kVmFsdWUsIGZsYWdzKTtcbiAgfVxuXG4gIHJ1bkluSW5qZWN0aW9uQ29udGV4dDxUPihmbjogKCkgPT4gVCk6IFQge1xuICAgIHJldHVybiB0aGlzLmluamVjdChFbnZpcm9ubWVudEluamVjdG9yKS5ydW5JbkNvbnRleHQoZm4pO1xuICB9XG5cbiAgZXhlY3V0ZSh0b2tlbnM6IGFueVtdLCBmbjogRnVuY3Rpb24sIGNvbnRleHQ/OiBhbnkpOiBhbnkge1xuICAgIGNvbnN0IHBhcmFtcyA9IHRva2Vucy5tYXAodCA9PiB0aGlzLmluamVjdCh0KSk7XG4gICAgcmV0dXJuIGZuLmFwcGx5KGNvbnRleHQsIHBhcmFtcyk7XG4gIH1cblxuICBvdmVycmlkZU1vZHVsZShuZ01vZHVsZTogVHlwZTxhbnk+LCBvdmVycmlkZTogTWV0YWRhdGFPdmVycmlkZTxOZ01vZHVsZT4pOiB0aGlzIHtcbiAgICB0aGlzLmFzc2VydE5vdEluc3RhbnRpYXRlZCgnb3ZlcnJpZGVNb2R1bGUnLCAnb3ZlcnJpZGUgbW9kdWxlIG1ldGFkYXRhJyk7XG4gICAgdGhpcy5jb21waWxlci5vdmVycmlkZU1vZHVsZShuZ01vZHVsZSwgb3ZlcnJpZGUpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgb3ZlcnJpZGVDb21wb25lbnQoY29tcG9uZW50OiBUeXBlPGFueT4sIG92ZXJyaWRlOiBNZXRhZGF0YU92ZXJyaWRlPENvbXBvbmVudD4pOiB0aGlzIHtcbiAgICB0aGlzLmFzc2VydE5vdEluc3RhbnRpYXRlZCgnb3ZlcnJpZGVDb21wb25lbnQnLCAnb3ZlcnJpZGUgY29tcG9uZW50IG1ldGFkYXRhJyk7XG4gICAgdGhpcy5jb21waWxlci5vdmVycmlkZUNvbXBvbmVudChjb21wb25lbnQsIG92ZXJyaWRlKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIG92ZXJyaWRlVGVtcGxhdGVVc2luZ1Rlc3RpbmdNb2R1bGUoY29tcG9uZW50OiBUeXBlPGFueT4sIHRlbXBsYXRlOiBzdHJpbmcpOiB0aGlzIHtcbiAgICB0aGlzLmFzc2VydE5vdEluc3RhbnRpYXRlZChcbiAgICAgICAgJ1Rlc3RCZWQub3ZlcnJpZGVUZW1wbGF0ZVVzaW5nVGVzdGluZ01vZHVsZScsXG4gICAgICAgICdDYW5ub3Qgb3ZlcnJpZGUgdGVtcGxhdGUgd2hlbiB0aGUgdGVzdCBtb2R1bGUgaGFzIGFscmVhZHkgYmVlbiBpbnN0YW50aWF0ZWQnKTtcbiAgICB0aGlzLmNvbXBpbGVyLm92ZXJyaWRlVGVtcGxhdGVVc2luZ1Rlc3RpbmdNb2R1bGUoY29tcG9uZW50LCB0ZW1wbGF0ZSk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBvdmVycmlkZURpcmVjdGl2ZShkaXJlY3RpdmU6IFR5cGU8YW55Piwgb3ZlcnJpZGU6IE1ldGFkYXRhT3ZlcnJpZGU8RGlyZWN0aXZlPik6IHRoaXMge1xuICAgIHRoaXMuYXNzZXJ0Tm90SW5zdGFudGlhdGVkKCdvdmVycmlkZURpcmVjdGl2ZScsICdvdmVycmlkZSBkaXJlY3RpdmUgbWV0YWRhdGEnKTtcbiAgICB0aGlzLmNvbXBpbGVyLm92ZXJyaWRlRGlyZWN0aXZlKGRpcmVjdGl2ZSwgb3ZlcnJpZGUpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgb3ZlcnJpZGVQaXBlKHBpcGU6IFR5cGU8YW55Piwgb3ZlcnJpZGU6IE1ldGFkYXRhT3ZlcnJpZGU8UGlwZT4pOiB0aGlzIHtcbiAgICB0aGlzLmFzc2VydE5vdEluc3RhbnRpYXRlZCgnb3ZlcnJpZGVQaXBlJywgJ292ZXJyaWRlIHBpcGUgbWV0YWRhdGEnKTtcbiAgICB0aGlzLmNvbXBpbGVyLm92ZXJyaWRlUGlwZShwaXBlLCBvdmVycmlkZSk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogT3ZlcndyaXRlcyBhbGwgcHJvdmlkZXJzIGZvciB0aGUgZ2l2ZW4gdG9rZW4gd2l0aCB0aGUgZ2l2ZW4gcHJvdmlkZXIgZGVmaW5pdGlvbi5cbiAgICovXG4gIG92ZXJyaWRlUHJvdmlkZXIodG9rZW46IGFueSwgcHJvdmlkZXI6IHt1c2VGYWN0b3J5PzogRnVuY3Rpb24sIHVzZVZhbHVlPzogYW55LCBkZXBzPzogYW55W119KTpcbiAgICAgIHRoaXMge1xuICAgIHRoaXMuYXNzZXJ0Tm90SW5zdGFudGlhdGVkKCdvdmVycmlkZVByb3ZpZGVyJywgJ292ZXJyaWRlIHByb3ZpZGVyJyk7XG4gICAgdGhpcy5jb21waWxlci5vdmVycmlkZVByb3ZpZGVyKHRva2VuLCBwcm92aWRlcik7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBvdmVycmlkZVRlbXBsYXRlKGNvbXBvbmVudDogVHlwZTxhbnk+LCB0ZW1wbGF0ZTogc3RyaW5nKTogVGVzdEJlZCB7XG4gICAgcmV0dXJuIHRoaXMub3ZlcnJpZGVDb21wb25lbnQoY29tcG9uZW50LCB7c2V0OiB7dGVtcGxhdGUsIHRlbXBsYXRlVXJsOiBudWxsIX19KTtcbiAgfVxuXG4gIGNyZWF0ZUNvbXBvbmVudDxUPih0eXBlOiBUeXBlPFQ+KTogQ29tcG9uZW50Rml4dHVyZTxUPiB7XG4gICAgY29uc3QgdGVzdENvbXBvbmVudFJlbmRlcmVyID0gdGhpcy5pbmplY3QoVGVzdENvbXBvbmVudFJlbmRlcmVyKTtcbiAgICBjb25zdCByb290RWxJZCA9IGByb290JHtfbmV4dFJvb3RFbGVtZW50SWQrK31gO1xuICAgIHRlc3RDb21wb25lbnRSZW5kZXJlci5pbnNlcnRSb290RWxlbWVudChyb290RWxJZCk7XG5cbiAgICBpZiAoZ2V0QXN5bmNDbGFzc01ldGFkYXRhKHR5cGUpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgYENvbXBvbmVudCAnJHt0eXBlLm5hbWV9JyBoYXMgdW5yZXNvbHZlZCBtZXRhZGF0YS4gYCArXG4gICAgICAgICAgYFBsZWFzZSBjYWxsIFxcYGF3YWl0IFRlc3RCZWQuY29tcGlsZUNvbXBvbmVudHMoKVxcYCBiZWZvcmUgcnVubmluZyB0aGlzIHRlc3QuYCk7XG4gICAgfVxuXG4gICAgY29uc3QgY29tcG9uZW50RGVmID0gKHR5cGUgYXMgYW55KS7JtWNtcDtcblxuICAgIGlmICghY29tcG9uZW50RGVmKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYEl0IGxvb2tzIGxpa2UgJyR7c3RyaW5naWZ5KHR5cGUpfScgaGFzIG5vdCBiZWVuIGNvbXBpbGVkLmApO1xuICAgIH1cblxuICAgIGNvbnN0IG5vTmdab25lID0gdGhpcy5pbmplY3QoQ29tcG9uZW50Rml4dHVyZU5vTmdab25lLCBmYWxzZSk7XG4gICAgY29uc3QgYXV0b0RldGVjdDogYm9vbGVhbiA9IHRoaXMuaW5qZWN0KENvbXBvbmVudEZpeHR1cmVBdXRvRGV0ZWN0LCBmYWxzZSk7XG4gICAgY29uc3Qgbmdab25lOiBOZ1pvbmV8bnVsbCA9IG5vTmdab25lID8gbnVsbCA6IHRoaXMuaW5qZWN0KE5nWm9uZSwgbnVsbCk7XG4gICAgY29uc3QgY29tcG9uZW50RmFjdG9yeSA9IG5ldyBDb21wb25lbnRGYWN0b3J5KGNvbXBvbmVudERlZik7XG4gICAgY29uc3QgaW5pdENvbXBvbmVudCA9ICgpID0+IHtcbiAgICAgIGNvbnN0IGNvbXBvbmVudFJlZiA9XG4gICAgICAgICAgY29tcG9uZW50RmFjdG9yeS5jcmVhdGUoSW5qZWN0b3IuTlVMTCwgW10sIGAjJHtyb290RWxJZH1gLCB0aGlzLnRlc3RNb2R1bGVSZWYpO1xuICAgICAgcmV0dXJuIG5ldyBDb21wb25lbnRGaXh0dXJlPGFueT4oY29tcG9uZW50UmVmLCBuZ1pvbmUsIGF1dG9EZXRlY3QpO1xuICAgIH07XG4gICAgY29uc3QgZml4dHVyZSA9IG5nWm9uZSA/IG5nWm9uZS5ydW4oaW5pdENvbXBvbmVudCkgOiBpbml0Q29tcG9uZW50KCk7XG4gICAgdGhpcy5fYWN0aXZlRml4dHVyZXMucHVzaChmaXh0dXJlKTtcbiAgICByZXR1cm4gZml4dHVyZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAaW50ZXJuYWwgc3RyaXAgdGhpcyBmcm9tIHB1Ymxpc2hlZCBkLnRzIGZpbGVzIGR1ZSB0b1xuICAgKiBodHRwczovL2dpdGh1Yi5jb20vbWljcm9zb2Z0L1R5cGVTY3JpcHQvaXNzdWVzLzM2MjE2XG4gICAqL1xuICBwcml2YXRlIGdldCBjb21waWxlcigpOiBUZXN0QmVkQ29tcGlsZXIge1xuICAgIGlmICh0aGlzLl9jb21waWxlciA9PT0gbnVsbCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBOZWVkIHRvIGNhbGwgVGVzdEJlZC5pbml0VGVzdEVudmlyb25tZW50KCkgZmlyc3RgKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuX2NvbXBpbGVyO1xuICB9XG5cbiAgLyoqXG4gICAqIEBpbnRlcm5hbCBzdHJpcCB0aGlzIGZyb20gcHVibGlzaGVkIGQudHMgZmlsZXMgZHVlIHRvXG4gICAqIGh0dHBzOi8vZ2l0aHViLmNvbS9taWNyb3NvZnQvVHlwZVNjcmlwdC9pc3N1ZXMvMzYyMTZcbiAgICovXG4gIHByaXZhdGUgZ2V0IHRlc3RNb2R1bGVSZWYoKTogTmdNb2R1bGVSZWY8YW55PiB7XG4gICAgaWYgKHRoaXMuX3Rlc3RNb2R1bGVSZWYgPT09IG51bGwpIHtcbiAgICAgIHRoaXMuX3Rlc3RNb2R1bGVSZWYgPSB0aGlzLmNvbXBpbGVyLmZpbmFsaXplKCk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLl90ZXN0TW9kdWxlUmVmO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3NlcnROb3RJbnN0YW50aWF0ZWQobWV0aG9kTmFtZTogc3RyaW5nLCBtZXRob2REZXNjcmlwdGlvbjogc3RyaW5nKSB7XG4gICAgaWYgKHRoaXMuX3Rlc3RNb2R1bGVSZWYgIT09IG51bGwpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICBgQ2Fubm90ICR7bWV0aG9kRGVzY3JpcHRpb259IHdoZW4gdGhlIHRlc3QgbW9kdWxlIGhhcyBhbHJlYWR5IGJlZW4gaW5zdGFudGlhdGVkLiBgICtcbiAgICAgICAgICBgTWFrZSBzdXJlIHlvdSBhcmUgbm90IHVzaW5nIFxcYGluamVjdFxcYCBiZWZvcmUgXFxgJHttZXRob2ROYW1lfVxcYC5gKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2sgd2hldGhlciB0aGUgbW9kdWxlIHNjb3BpbmcgcXVldWUgc2hvdWxkIGJlIGZsdXNoZWQsIGFuZCBmbHVzaCBpdCBpZiBuZWVkZWQuXG4gICAqXG4gICAqIFdoZW4gdGhlIFRlc3RCZWQgaXMgcmVzZXQsIGl0IGNsZWFycyB0aGUgSklUIG1vZHVsZSBjb21waWxhdGlvbiBxdWV1ZSwgY2FuY2VsbGluZyBhbnlcbiAgICogaW4tcHJvZ3Jlc3MgbW9kdWxlIGNvbXBpbGF0aW9uLiBUaGlzIGNyZWF0ZXMgYSBwb3RlbnRpYWwgaGF6YXJkIC0gdGhlIHZlcnkgZmlyc3QgdGltZSB0aGVcbiAgICogVGVzdEJlZCBpcyBpbml0aWFsaXplZCAob3IgaWYgaXQncyByZXNldCB3aXRob3V0IGJlaW5nIGluaXRpYWxpemVkKSwgdGhlcmUgbWF5IGJlIHBlbmRpbmdcbiAgICogY29tcGlsYXRpb25zIG9mIG1vZHVsZXMgZGVjbGFyZWQgaW4gZ2xvYmFsIHNjb3BlLiBUaGVzZSBjb21waWxhdGlvbnMgc2hvdWxkIGJlIGZpbmlzaGVkLlxuICAgKlxuICAgKiBUbyBlbnN1cmUgdGhhdCBnbG9iYWxseSBkZWNsYXJlZCBtb2R1bGVzIGhhdmUgdGhlaXIgY29tcG9uZW50cyBzY29wZWQgcHJvcGVybHksIHRoaXMgZnVuY3Rpb25cbiAgICogaXMgY2FsbGVkIHdoZW5ldmVyIFRlc3RCZWQgaXMgaW5pdGlhbGl6ZWQgb3IgcmVzZXQuIFRoZSBfZmlyc3RfIHRpbWUgdGhhdCB0aGlzIGhhcHBlbnMsIHByaW9yXG4gICAqIHRvIGFueSBvdGhlciBvcGVyYXRpb25zLCB0aGUgc2NvcGluZyBxdWV1ZSBpcyBmbHVzaGVkLlxuICAgKi9cbiAgcHJpdmF0ZSBjaGVja0dsb2JhbENvbXBpbGF0aW9uRmluaXNoZWQoKTogdm9pZCB7XG4gICAgLy8gQ2hlY2tpbmcgX3Rlc3ROZ01vZHVsZVJlZiBpcyBudWxsIHNob3VsZCBub3QgYmUgbmVjZXNzYXJ5LCBidXQgaXMgbGVmdCBpbiBhcyBhbiBhZGRpdGlvbmFsXG4gICAgLy8gZ3VhcmQgdGhhdCBjb21waWxhdGlvbnMgcXVldWVkIGluIHRlc3RzIChhZnRlciBpbnN0YW50aWF0aW9uKSBhcmUgbmV2ZXIgZmx1c2hlZCBhY2NpZGVudGFsbHkuXG4gICAgaWYgKCF0aGlzLmdsb2JhbENvbXBpbGF0aW9uQ2hlY2tlZCAmJiB0aGlzLl90ZXN0TW9kdWxlUmVmID09PSBudWxsKSB7XG4gICAgICBmbHVzaE1vZHVsZVNjb3BpbmdRdWV1ZUFzTXVjaEFzUG9zc2libGUoKTtcbiAgICB9XG4gICAgdGhpcy5nbG9iYWxDb21waWxhdGlvbkNoZWNrZWQgPSB0cnVlO1xuICB9XG5cbiAgcHJpdmF0ZSBkZXN0cm95QWN0aXZlRml4dHVyZXMoKTogdm9pZCB7XG4gICAgbGV0IGVycm9yQ291bnQgPSAwO1xuICAgIHRoaXMuX2FjdGl2ZUZpeHR1cmVzLmZvckVhY2goKGZpeHR1cmUpID0+IHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGZpeHR1cmUuZGVzdHJveSgpO1xuICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBlcnJvckNvdW50Kys7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIGR1cmluZyBjbGVhbnVwIG9mIGNvbXBvbmVudCcsIHtcbiAgICAgICAgICBjb21wb25lbnQ6IGZpeHR1cmUuY29tcG9uZW50SW5zdGFuY2UsXG4gICAgICAgICAgc3RhY2t0cmFjZTogZSxcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgdGhpcy5fYWN0aXZlRml4dHVyZXMgPSBbXTtcblxuICAgIGlmIChlcnJvckNvdW50ID4gMCAmJiB0aGlzLnNob3VsZFJldGhyb3dUZWFyZG93bkVycm9ycygpKSB7XG4gICAgICB0aHJvdyBFcnJvcihcbiAgICAgICAgICBgJHtlcnJvckNvdW50fSAkeyhlcnJvckNvdW50ID09PSAxID8gJ2NvbXBvbmVudCcgOiAnY29tcG9uZW50cycpfSBgICtcbiAgICAgICAgICBgdGhyZXcgZXJyb3JzIGR1cmluZyBjbGVhbnVwYCk7XG4gICAgfVxuICB9XG5cbiAgc2hvdWxkUmV0aHJvd1RlYXJkb3duRXJyb3JzKCk6IGJvb2xlYW4ge1xuICAgIGNvbnN0IGluc3RhbmNlT3B0aW9ucyA9IHRoaXMuX2luc3RhbmNlVGVhcmRvd25PcHRpb25zO1xuICAgIGNvbnN0IGVudmlyb25tZW50T3B0aW9ucyA9IFRlc3RCZWRJbXBsLl9lbnZpcm9ubWVudFRlYXJkb3duT3B0aW9ucztcblxuICAgIC8vIElmIHRoZSBuZXcgdGVhcmRvd24gYmVoYXZpb3IgaGFzbid0IGJlZW4gY29uZmlndXJlZCwgcHJlc2VydmUgdGhlIG9sZCBiZWhhdmlvci5cbiAgICBpZiAoIWluc3RhbmNlT3B0aW9ucyAmJiAhZW52aXJvbm1lbnRPcHRpb25zKSB7XG4gICAgICByZXR1cm4gVEVBUkRPV05fVEVTVElOR19NT0RVTEVfT05fREVTVFJPWV9ERUZBVUxUO1xuICAgIH1cblxuICAgIC8vIE90aGVyd2lzZSB1c2UgdGhlIGNvbmZpZ3VyZWQgYmVoYXZpb3Igb3IgZGVmYXVsdCB0byByZXRocm93aW5nLlxuICAgIHJldHVybiBpbnN0YW5jZU9wdGlvbnM/LnJldGhyb3dFcnJvcnMgPz8gZW52aXJvbm1lbnRPcHRpb25zPy5yZXRocm93RXJyb3JzID8/XG4gICAgICAgIHRoaXMuc2hvdWxkVGVhckRvd25UZXN0aW5nTW9kdWxlKCk7XG4gIH1cblxuICBzaG91bGRUaHJvd0Vycm9yT25Vbmtub3duRWxlbWVudHMoKTogYm9vbGVhbiB7XG4gICAgLy8gQ2hlY2sgaWYgYSBjb25maWd1cmF0aW9uIGhhcyBiZWVuIHByb3ZpZGVkIHRvIHRocm93IHdoZW4gYW4gdW5rbm93biBlbGVtZW50IGlzIGZvdW5kXG4gICAgcmV0dXJuIHRoaXMuX2luc3RhbmNlRXJyb3JPblVua25vd25FbGVtZW50c09wdGlvbiA/P1xuICAgICAgICBUZXN0QmVkSW1wbC5fZW52aXJvbm1lbnRFcnJvck9uVW5rbm93bkVsZW1lbnRzT3B0aW9uID8/IFRIUk9XX09OX1VOS05PV05fRUxFTUVOVFNfREVGQVVMVDtcbiAgfVxuXG4gIHNob3VsZFRocm93RXJyb3JPblVua25vd25Qcm9wZXJ0aWVzKCk6IGJvb2xlYW4ge1xuICAgIC8vIENoZWNrIGlmIGEgY29uZmlndXJhdGlvbiBoYXMgYmVlbiBwcm92aWRlZCB0byB0aHJvdyB3aGVuIGFuIHVua25vd24gcHJvcGVydHkgaXMgZm91bmRcbiAgICByZXR1cm4gdGhpcy5faW5zdGFuY2VFcnJvck9uVW5rbm93blByb3BlcnRpZXNPcHRpb24gPz9cbiAgICAgICAgVGVzdEJlZEltcGwuX2Vudmlyb25tZW50RXJyb3JPblVua25vd25Qcm9wZXJ0aWVzT3B0aW9uID8/XG4gICAgICAgIFRIUk9XX09OX1VOS05PV05fUFJPUEVSVElFU19ERUZBVUxUO1xuICB9XG5cbiAgc2hvdWxkVGVhckRvd25UZXN0aW5nTW9kdWxlKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLl9pbnN0YW5jZVRlYXJkb3duT3B0aW9ucz8uZGVzdHJveUFmdGVyRWFjaCA/P1xuICAgICAgICBUZXN0QmVkSW1wbC5fZW52aXJvbm1lbnRUZWFyZG93bk9wdGlvbnM/LmRlc3Ryb3lBZnRlckVhY2ggPz9cbiAgICAgICAgVEVBUkRPV05fVEVTVElOR19NT0RVTEVfT05fREVTVFJPWV9ERUZBVUxUO1xuICB9XG5cbiAgdGVhckRvd25UZXN0aW5nTW9kdWxlKCkge1xuICAgIC8vIElmIHRoZSBtb2R1bGUgcmVmIGhhcyBhbHJlYWR5IGJlZW4gZGVzdHJveWVkLCB3ZSB3b24ndCBiZSBhYmxlIHRvIGdldCBhIHRlc3QgcmVuZGVyZXIuXG4gICAgaWYgKHRoaXMuX3Rlc3RNb2R1bGVSZWYgPT09IG51bGwpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgLy8gUmVzb2x2ZSB0aGUgcmVuZGVyZXIgYWhlYWQgb2YgdGltZSwgYmVjYXVzZSB3ZSB3YW50IHRvIHJlbW92ZSB0aGUgcm9vdCBlbGVtZW50cyBhcyB0aGUgdmVyeVxuICAgIC8vIGxhc3Qgc3RlcCwgYnV0IHRoZSBpbmplY3RvciB3aWxsIGJlIGRlc3Ryb3llZCBhcyBhIHBhcnQgb2YgdGhlIG1vZHVsZSByZWYgZGVzdHJ1Y3Rpb24uXG4gICAgY29uc3QgdGVzdFJlbmRlcmVyID0gdGhpcy5pbmplY3QoVGVzdENvbXBvbmVudFJlbmRlcmVyKTtcbiAgICB0cnkge1xuICAgICAgdGhpcy5fdGVzdE1vZHVsZVJlZi5kZXN0cm95KCk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgaWYgKHRoaXMuc2hvdWxkUmV0aHJvd1RlYXJkb3duRXJyb3JzKCkpIHtcbiAgICAgICAgdGhyb3cgZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIGR1cmluZyBjbGVhbnVwIG9mIGEgdGVzdGluZyBtb2R1bGUnLCB7XG4gICAgICAgICAgY29tcG9uZW50OiB0aGlzLl90ZXN0TW9kdWxlUmVmLmluc3RhbmNlLFxuICAgICAgICAgIHN0YWNrdHJhY2U6IGUsXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0gZmluYWxseSB7XG4gICAgICB0ZXN0UmVuZGVyZXIucmVtb3ZlQWxsUm9vdEVsZW1lbnRzPy4oKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBAZGVzY3JpcHRpb25cbiAqIENvbmZpZ3VyZXMgYW5kIGluaXRpYWxpemVzIGVudmlyb25tZW50IGZvciB1bml0IHRlc3RpbmcgYW5kIHByb3ZpZGVzIG1ldGhvZHMgZm9yXG4gKiBjcmVhdGluZyBjb21wb25lbnRzIGFuZCBzZXJ2aWNlcyBpbiB1bml0IHRlc3RzLlxuICpcbiAqIGBUZXN0QmVkYCBpcyB0aGUgcHJpbWFyeSBhcGkgZm9yIHdyaXRpbmcgdW5pdCB0ZXN0cyBmb3IgQW5ndWxhciBhcHBsaWNhdGlvbnMgYW5kIGxpYnJhcmllcy5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBjb25zdCBUZXN0QmVkOiBUZXN0QmVkU3RhdGljID0gVGVzdEJlZEltcGw7XG5cbi8qKlxuICogQWxsb3dzIGluamVjdGluZyBkZXBlbmRlbmNpZXMgaW4gYGJlZm9yZUVhY2goKWAgYW5kIGBpdCgpYC4gTm90ZTogdGhpcyBmdW5jdGlvblxuICogKGltcG9ydGVkIGZyb20gdGhlIGBAYW5ndWxhci9jb3JlL3Rlc3RpbmdgIHBhY2thZ2UpIGNhbiAqKm9ubHkqKiBiZSB1c2VkIHRvIGluamVjdCBkZXBlbmRlbmNpZXNcbiAqIGluIHRlc3RzLiBUbyBpbmplY3QgZGVwZW5kZW5jaWVzIGluIHlvdXIgYXBwbGljYXRpb24gY29kZSwgdXNlIHRoZSBbYGluamVjdGBdKGFwaS9jb3JlL2luamVjdClcbiAqIGZ1bmN0aW9uIGZyb20gdGhlIGBAYW5ndWxhci9jb3JlYCBwYWNrYWdlIGluc3RlYWQuXG4gKlxuICogRXhhbXBsZTpcbiAqXG4gKiBgYGBcbiAqIGJlZm9yZUVhY2goaW5qZWN0KFtEZXBlbmRlbmN5LCBBQ2xhc3NdLCAoZGVwLCBvYmplY3QpID0+IHtcbiAqICAgLy8gc29tZSBjb2RlIHRoYXQgdXNlcyBgZGVwYCBhbmQgYG9iamVjdGBcbiAqICAgLy8gLi4uXG4gKiB9KSk7XG4gKlxuICogaXQoJy4uLicsIGluamVjdChbQUNsYXNzXSwgKG9iamVjdCkgPT4ge1xuICogICBvYmplY3QuZG9Tb21ldGhpbmcoKTtcbiAqICAgZXhwZWN0KC4uLik7XG4gKiB9KVxuICogYGBgXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gaW5qZWN0KHRva2VuczogYW55W10sIGZuOiBGdW5jdGlvbik6ICgpID0+IGFueSB7XG4gIGNvbnN0IHRlc3RCZWQgPSBUZXN0QmVkSW1wbC5JTlNUQU5DRTtcbiAgLy8gTm90IHVzaW5nIGFuIGFycm93IGZ1bmN0aW9uIHRvIHByZXNlcnZlIGNvbnRleHQgcGFzc2VkIGZyb20gY2FsbCBzaXRlXG4gIHJldHVybiBmdW5jdGlvbih0aGlzOiB1bmtub3duKSB7XG4gICAgcmV0dXJuIHRlc3RCZWQuZXhlY3V0ZSh0b2tlbnMsIGZuLCB0aGlzKTtcbiAgfTtcbn1cblxuLyoqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBjbGFzcyBJbmplY3RTZXR1cFdyYXBwZXIge1xuICBjb25zdHJ1Y3Rvcihwcml2YXRlIF9tb2R1bGVEZWY6ICgpID0+IFRlc3RNb2R1bGVNZXRhZGF0YSkge31cblxuICBwcml2YXRlIF9hZGRNb2R1bGUoKSB7XG4gICAgY29uc3QgbW9kdWxlRGVmID0gdGhpcy5fbW9kdWxlRGVmKCk7XG4gICAgaWYgKG1vZHVsZURlZikge1xuICAgICAgVGVzdEJlZEltcGwuY29uZmlndXJlVGVzdGluZ01vZHVsZShtb2R1bGVEZWYpO1xuICAgIH1cbiAgfVxuXG4gIGluamVjdCh0b2tlbnM6IGFueVtdLCBmbjogRnVuY3Rpb24pOiAoKSA9PiBhbnkge1xuICAgIGNvbnN0IHNlbGYgPSB0aGlzO1xuICAgIC8vIE5vdCB1c2luZyBhbiBhcnJvdyBmdW5jdGlvbiB0byBwcmVzZXJ2ZSBjb250ZXh0IHBhc3NlZCBmcm9tIGNhbGwgc2l0ZVxuICAgIHJldHVybiBmdW5jdGlvbih0aGlzOiB1bmtub3duKSB7XG4gICAgICBzZWxmLl9hZGRNb2R1bGUoKTtcbiAgICAgIHJldHVybiBpbmplY3QodG9rZW5zLCBmbikuY2FsbCh0aGlzKTtcbiAgICB9O1xuICB9XG59XG5cbi8qKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gd2l0aE1vZHVsZShtb2R1bGVEZWY6IFRlc3RNb2R1bGVNZXRhZGF0YSk6IEluamVjdFNldHVwV3JhcHBlcjtcbmV4cG9ydCBmdW5jdGlvbiB3aXRoTW9kdWxlKG1vZHVsZURlZjogVGVzdE1vZHVsZU1ldGFkYXRhLCBmbjogRnVuY3Rpb24pOiAoKSA9PiBhbnk7XG5leHBvcnQgZnVuY3Rpb24gd2l0aE1vZHVsZShtb2R1bGVEZWY6IFRlc3RNb2R1bGVNZXRhZGF0YSwgZm4/OiBGdW5jdGlvbnxudWxsKTogKCgpID0+IGFueSl8XG4gICAgSW5qZWN0U2V0dXBXcmFwcGVyIHtcbiAgaWYgKGZuKSB7XG4gICAgLy8gTm90IHVzaW5nIGFuIGFycm93IGZ1bmN0aW9uIHRvIHByZXNlcnZlIGNvbnRleHQgcGFzc2VkIGZyb20gY2FsbCBzaXRlXG4gICAgcmV0dXJuIGZ1bmN0aW9uKHRoaXM6IHVua25vd24pIHtcbiAgICAgIGNvbnN0IHRlc3RCZWQgPSBUZXN0QmVkSW1wbC5JTlNUQU5DRTtcbiAgICAgIGlmIChtb2R1bGVEZWYpIHtcbiAgICAgICAgdGVzdEJlZC5jb25maWd1cmVUZXN0aW5nTW9kdWxlKG1vZHVsZURlZik7XG4gICAgICB9XG4gICAgICByZXR1cm4gZm4uYXBwbHkodGhpcyk7XG4gICAgfTtcbiAgfVxuICByZXR1cm4gbmV3IEluamVjdFNldHVwV3JhcHBlcigoKSA9PiBtb2R1bGVEZWYpO1xufVxuIl19