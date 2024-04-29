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
import { EnvironmentInjector, InjectFlags, Injector, NgZone, runInInjectionContext, ɵconvertToBitFlags as convertToBitFlags, ɵEffectScheduler as EffectScheduler, ɵflushModuleScopingQueueAsMuchAsPossible as flushModuleScopingQueueAsMuchAsPossible, ɵgetAsyncClassMetadataFn as getAsyncClassMetadataFn, ɵgetUnknownElementStrictMode as getUnknownElementStrictMode, ɵgetUnknownPropertyStrictMode as getUnknownPropertyStrictMode, ɵRender3ComponentFactory as ComponentFactory, ɵresetCompiledComponents as resetCompiledComponents, ɵsetAllowDuplicateNgModuleIdsForTest as setAllowDuplicateNgModuleIdsForTest, ɵsetUnknownElementStrictMode as setUnknownElementStrictMode, ɵsetUnknownPropertyStrictMode as setUnknownPropertyStrictMode, ɵstringify as stringify, ɵZONELESS_ENABLED as ZONELESS_ENABLED, } from '@angular/core';
/* clang-format on */
import { PseudoApplicationComponentFixture, ScheduledComponentFixture, } from './component_fixture';
import { ComponentFixtureNoNgZone, DEFER_BLOCK_DEFAULT_BEHAVIOR, TEARDOWN_TESTING_MODULE_ON_DESTROY_DEFAULT, TestComponentRenderer, THROW_ON_UNKNOWN_ELEMENTS_DEFAULT, THROW_ON_UNKNOWN_PROPERTIES_DEFAULT, } from './test_bed_common';
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
        this._instanceDeferBlockBehavior = DEFER_BLOCK_DEFAULT_BEHAVIOR;
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
        return (TestBedImpl._INSTANCE = TestBedImpl._INSTANCE || new TestBedImpl());
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
                this._instanceDeferBlockBehavior = DEFER_BLOCK_DEFAULT_BEHAVIOR;
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
        this._instanceDeferBlockBehavior = moduleDef.deferBlockBehavior ?? DEFER_BLOCK_DEFAULT_BEHAVIOR;
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
        return result === UNDEFINED
            ? this.compiler.injector.get(token, notFoundValue, flags)
            : result;
    }
    /** @deprecated from v9.0.0 use TestBed.inject */
    get(token, notFoundValue = Injector.THROW_IF_NOT_FOUND, flags = InjectFlags.Default) {
        return this.inject(token, notFoundValue, flags);
    }
    runInInjectionContext(fn) {
        return runInInjectionContext(this.inject(EnvironmentInjector), fn);
    }
    execute(tokens, fn, context) {
        const params = tokens.map((t) => this.inject(t));
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
            return this.runInInjectionContext(() => {
                const isZoneless = this.inject(ZONELESS_ENABLED);
                const fixture = isZoneless
                    ? new ScheduledComponentFixture(componentRef)
                    : new PseudoApplicationComponentFixture(componentRef);
                fixture.initialize();
                return fixture;
            });
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
            throw Error(`${errorCount} ${errorCount === 1 ? 'component' : 'components'} ` +
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
        return (instanceOptions?.rethrowErrors ??
            environmentOptions?.rethrowErrors ??
            this.shouldTearDownTestingModule());
    }
    shouldThrowErrorOnUnknownElements() {
        // Check if a configuration has been provided to throw when an unknown element is found
        return (this._instanceErrorOnUnknownElementsOption ??
            TestBedImpl._environmentErrorOnUnknownElementsOption ??
            THROW_ON_UNKNOWN_ELEMENTS_DEFAULT);
    }
    shouldThrowErrorOnUnknownProperties() {
        // Check if a configuration has been provided to throw when an unknown property is found
        return (this._instanceErrorOnUnknownPropertiesOption ??
            TestBedImpl._environmentErrorOnUnknownPropertiesOption ??
            THROW_ON_UNKNOWN_PROPERTIES_DEFAULT);
    }
    shouldTearDownTestingModule() {
        return (this._instanceTeardownOptions?.destroyAfterEach ??
            TestBedImpl._environmentTeardownOptions?.destroyAfterEach ??
            TEARDOWN_TESTING_MODULE_ON_DESTROY_DEFAULT);
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
        this.inject(EffectScheduler).flush();
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdF9iZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3Rlc3Rpbmcvc3JjL3Rlc3RfYmVkLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILG1HQUFtRztBQUNuRyxpR0FBaUc7QUFDakcsdUJBQXVCO0FBRXZCLHNCQUFzQjtBQUN0QixPQUFPLEVBSUwsbUJBQW1CLEVBQ25CLFdBQVcsRUFFWCxRQUFRLEVBRVIsTUFBTSxFQUlOLHFCQUFxQixFQUVyQixrQkFBa0IsSUFBSSxpQkFBaUIsRUFFdkMsZ0JBQWdCLElBQUksZUFBZSxFQUNuQyx3Q0FBd0MsSUFBSSx1Q0FBdUMsRUFDbkYsd0JBQXdCLElBQUksdUJBQXVCLEVBQ25ELDRCQUE0QixJQUFJLDJCQUEyQixFQUMzRCw2QkFBNkIsSUFBSSw0QkFBNEIsRUFDN0Qsd0JBQXdCLElBQUksZ0JBQWdCLEVBRTVDLHdCQUF3QixJQUFJLHVCQUF1QixFQUNuRCxvQ0FBb0MsSUFBSSxtQ0FBbUMsRUFDM0UsNEJBQTRCLElBQUksMkJBQTJCLEVBQzNELDZCQUE2QixJQUFJLDRCQUE0QixFQUM3RCxVQUFVLElBQUksU0FBUyxFQUN2QixpQkFBaUIsSUFBSSxnQkFBZ0IsR0FDdEMsTUFBTSxlQUFlLENBQUM7QUFFdkIscUJBQXFCO0FBRXJCLE9BQU8sRUFFTCxpQ0FBaUMsRUFDakMseUJBQXlCLEdBQzFCLE1BQU0scUJBQXFCLENBQUM7QUFFN0IsT0FBTyxFQUNMLHdCQUF3QixFQUN4Qiw0QkFBNEIsRUFFNUIsMENBQTBDLEVBQzFDLHFCQUFxQixFQUdyQixpQ0FBaUMsRUFDakMsbUNBQW1DLEdBQ3BDLE1BQU0sbUJBQW1CLENBQUM7QUFDM0IsT0FBTyxFQUFDLGVBQWUsRUFBQyxNQUFNLHFCQUFxQixDQUFDO0FBb0hwRCxJQUFJLGtCQUFrQixHQUFHLENBQUMsQ0FBQztBQUUzQjs7OztHQUlHO0FBQ0gsTUFB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QUN2QyxDQUFDLENBQUM7SUFDSixDQUFDO0NBQ0Y7QUFPRCxNQUFNLFVBQVUsVUFBVSxDQUN4QixTQUE2QixFQUM3QixFQUFvQjtJQUVwQixJQUFJLEVBQUUsRUFBRSxDQUFDO1FBQ1Asd0VBQXdFO1FBQ3hFLE9BQU87WUFDTCxNQUFNLE9BQU8sR0FBRyxXQUFXLENBQUMsUUFBUSxDQUFDO1lBQ3JDLElBQUksU0FBUyxFQUFFLENBQUM7Z0JBQ2QsT0FBTyxDQUFDLHNCQUFzQixDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQzVDLENBQUM7WUFDRCxPQUFPLEVBQUUsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDeEIsQ0FBQyxDQUFDO0lBQ0osQ0FBQztJQUNELE9BQU8sSUFBSSxrQkFBa0IsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxTQUFTLENBQUMsQ0FBQztBQUNqRCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbi8vIFRoZSBmb3JtYXR0ZXIgYW5kIENJIGRpc2FncmVlIG9uIGhvdyB0aGlzIGltcG9ydCBzdGF0ZW1lbnQgc2hvdWxkIGJlIGZvcm1hdHRlZC4gQm90aCB0cnkgdG8ga2VlcFxuLy8gaXQgb24gb25lIGxpbmUsIHRvbywgd2hpY2ggaGFzIGdvdHRlbiB2ZXJ5IGhhcmQgdG8gcmVhZCAmIG1hbmFnZS4gU28gZGlzYWJsZSB0aGUgZm9ybWF0dGVyIGZvclxuLy8gdGhpcyBzdGF0ZW1lbnQgb25seS5cblxuLyogY2xhbmctZm9ybWF0IG9mZiAqL1xuaW1wb3J0IHtcbiAgQ29tcG9uZW50LFxuICBDb21wb25lbnRSZWYsXG4gIERpcmVjdGl2ZSxcbiAgRW52aXJvbm1lbnRJbmplY3RvcixcbiAgSW5qZWN0RmxhZ3MsXG4gIEluamVjdE9wdGlvbnMsXG4gIEluamVjdG9yLFxuICBOZ01vZHVsZSxcbiAgTmdab25lLFxuICBQaXBlLFxuICBQbGF0Zm9ybVJlZixcbiAgUHJvdmlkZXJUb2tlbixcbiAgcnVuSW5JbmplY3Rpb25Db250ZXh0LFxuICBUeXBlLFxuICDJtWNvbnZlcnRUb0JpdEZsYWdzIGFzIGNvbnZlcnRUb0JpdEZsYWdzLFxuICDJtURlZmVyQmxvY2tCZWhhdmlvciBhcyBEZWZlckJsb2NrQmVoYXZpb3IsXG4gIMm1RWZmZWN0U2NoZWR1bGVyIGFzIEVmZmVjdFNjaGVkdWxlcixcbiAgybVmbHVzaE1vZHVsZVNjb3BpbmdRdWV1ZUFzTXVjaEFzUG9zc2libGUgYXMgZmx1c2hNb2R1bGVTY29waW5nUXVldWVBc011Y2hBc1Bvc3NpYmxlLFxuICDJtWdldEFzeW5jQ2xhc3NNZXRhZGF0YUZuIGFzIGdldEFzeW5jQ2xhc3NNZXRhZGF0YUZuLFxuICDJtWdldFVua25vd25FbGVtZW50U3RyaWN0TW9kZSBhcyBnZXRVbmtub3duRWxlbWVudFN0cmljdE1vZGUsXG4gIMm1Z2V0VW5rbm93blByb3BlcnR5U3RyaWN0TW9kZSBhcyBnZXRVbmtub3duUHJvcGVydHlTdHJpY3RNb2RlLFxuICDJtVJlbmRlcjNDb21wb25lbnRGYWN0b3J5IGFzIENvbXBvbmVudEZhY3RvcnksXG4gIMm1UmVuZGVyM05nTW9kdWxlUmVmIGFzIE5nTW9kdWxlUmVmLFxuICDJtXJlc2V0Q29tcGlsZWRDb21wb25lbnRzIGFzIHJlc2V0Q29tcGlsZWRDb21wb25lbnRzLFxuICDJtXNldEFsbG93RHVwbGljYXRlTmdNb2R1bGVJZHNGb3JUZXN0IGFzIHNldEFsbG93RHVwbGljYXRlTmdNb2R1bGVJZHNGb3JUZXN0LFxuICDJtXNldFVua25vd25FbGVtZW50U3RyaWN0TW9kZSBhcyBzZXRVbmtub3duRWxlbWVudFN0cmljdE1vZGUsXG4gIMm1c2V0VW5rbm93blByb3BlcnR5U3RyaWN0TW9kZSBhcyBzZXRVbmtub3duUHJvcGVydHlTdHJpY3RNb2RlLFxuICDJtXN0cmluZ2lmeSBhcyBzdHJpbmdpZnksXG4gIMm1Wk9ORUxFU1NfRU5BQkxFRCBhcyBaT05FTEVTU19FTkFCTEVELFxufSBmcm9tICdAYW5ndWxhci9jb3JlJztcblxuLyogY2xhbmctZm9ybWF0IG9uICovXG5cbmltcG9ydCB7XG4gIENvbXBvbmVudEZpeHR1cmUsXG4gIFBzZXVkb0FwcGxpY2F0aW9uQ29tcG9uZW50Rml4dHVyZSxcbiAgU2NoZWR1bGVkQ29tcG9uZW50Rml4dHVyZSxcbn0gZnJvbSAnLi9jb21wb25lbnRfZml4dHVyZSc7XG5pbXBvcnQge01ldGFkYXRhT3ZlcnJpZGV9IGZyb20gJy4vbWV0YWRhdGFfb3ZlcnJpZGUnO1xuaW1wb3J0IHtcbiAgQ29tcG9uZW50Rml4dHVyZU5vTmdab25lLFxuICBERUZFUl9CTE9DS19ERUZBVUxUX0JFSEFWSU9SLFxuICBNb2R1bGVUZWFyZG93bk9wdGlvbnMsXG4gIFRFQVJET1dOX1RFU1RJTkdfTU9EVUxFX09OX0RFU1RST1lfREVGQVVMVCxcbiAgVGVzdENvbXBvbmVudFJlbmRlcmVyLFxuICBUZXN0RW52aXJvbm1lbnRPcHRpb25zLFxuICBUZXN0TW9kdWxlTWV0YWRhdGEsXG4gIFRIUk9XX09OX1VOS05PV05fRUxFTUVOVFNfREVGQVVMVCxcbiAgVEhST1dfT05fVU5LTk9XTl9QUk9QRVJUSUVTX0RFRkFVTFQsXG59IGZyb20gJy4vdGVzdF9iZWRfY29tbW9uJztcbmltcG9ydCB7VGVzdEJlZENvbXBpbGVyfSBmcm9tICcuL3Rlc3RfYmVkX2NvbXBpbGVyJztcblxuLyoqXG4gKiBTdGF0aWMgbWV0aG9kcyBpbXBsZW1lbnRlZCBieSB0aGUgYFRlc3RCZWRgLlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBUZXN0QmVkU3RhdGljIGV4dGVuZHMgVGVzdEJlZCB7XG4gIG5ldyAoLi4uYXJnczogYW55W10pOiBUZXN0QmVkO1xufVxuXG4vKipcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBUZXN0QmVkIHtcbiAgZ2V0IHBsYXRmb3JtKCk6IFBsYXRmb3JtUmVmO1xuXG4gIGdldCBuZ01vZHVsZSgpOiBUeXBlPGFueT4gfCBUeXBlPGFueT5bXTtcblxuICAvKipcbiAgICogSW5pdGlhbGl6ZSB0aGUgZW52aXJvbm1lbnQgZm9yIHRlc3Rpbmcgd2l0aCBhIGNvbXBpbGVyIGZhY3RvcnksIGEgUGxhdGZvcm1SZWYsIGFuZCBhblxuICAgKiBhbmd1bGFyIG1vZHVsZS4gVGhlc2UgYXJlIGNvbW1vbiB0byBldmVyeSB0ZXN0IGluIHRoZSBzdWl0ZS5cbiAgICpcbiAgICogVGhpcyBtYXkgb25seSBiZSBjYWxsZWQgb25jZSwgdG8gc2V0IHVwIHRoZSBjb21tb24gcHJvdmlkZXJzIGZvciB0aGUgY3VycmVudCB0ZXN0XG4gICAqIHN1aXRlIG9uIHRoZSBjdXJyZW50IHBsYXRmb3JtLiBJZiB5b3UgYWJzb2x1dGVseSBuZWVkIHRvIGNoYW5nZSB0aGUgcHJvdmlkZXJzLFxuICAgKiBmaXJzdCB1c2UgYHJlc2V0VGVzdEVudmlyb25tZW50YC5cbiAgICpcbiAgICogVGVzdCBtb2R1bGVzIGFuZCBwbGF0Zm9ybXMgZm9yIGluZGl2aWR1YWwgcGxhdGZvcm1zIGFyZSBhdmFpbGFibGUgZnJvbVxuICAgKiAnQGFuZ3VsYXIvPHBsYXRmb3JtX25hbWU+L3Rlc3RpbmcnLlxuICAgKi9cbiAgaW5pdFRlc3RFbnZpcm9ubWVudChcbiAgICBuZ01vZHVsZTogVHlwZTxhbnk+IHwgVHlwZTxhbnk+W10sXG4gICAgcGxhdGZvcm06IFBsYXRmb3JtUmVmLFxuICAgIG9wdGlvbnM/OiBUZXN0RW52aXJvbm1lbnRPcHRpb25zLFxuICApOiB2b2lkO1xuXG4gIC8qKlxuICAgKiBSZXNldCB0aGUgcHJvdmlkZXJzIGZvciB0aGUgdGVzdCBpbmplY3Rvci5cbiAgICovXG4gIHJlc2V0VGVzdEVudmlyb25tZW50KCk6IHZvaWQ7XG5cbiAgcmVzZXRUZXN0aW5nTW9kdWxlKCk6IFRlc3RCZWQ7XG5cbiAgY29uZmlndXJlQ29tcGlsZXIoY29uZmlnOiB7cHJvdmlkZXJzPzogYW55W107IHVzZUppdD86IGJvb2xlYW59KTogdm9pZDtcblxuICBjb25maWd1cmVUZXN0aW5nTW9kdWxlKG1vZHVsZURlZjogVGVzdE1vZHVsZU1ldGFkYXRhKTogVGVzdEJlZDtcblxuICBjb21waWxlQ29tcG9uZW50cygpOiBQcm9taXNlPGFueT47XG5cbiAgaW5qZWN0PFQ+KFxuICAgIHRva2VuOiBQcm92aWRlclRva2VuPFQ+LFxuICAgIG5vdEZvdW5kVmFsdWU6IHVuZGVmaW5lZCxcbiAgICBvcHRpb25zOiBJbmplY3RPcHRpb25zICYge1xuICAgICAgb3B0aW9uYWw/OiBmYWxzZTtcbiAgICB9LFxuICApOiBUO1xuICBpbmplY3Q8VD4oXG4gICAgdG9rZW46IFByb3ZpZGVyVG9rZW48VD4sXG4gICAgbm90Rm91bmRWYWx1ZTogbnVsbCB8IHVuZGVmaW5lZCxcbiAgICBvcHRpb25zOiBJbmplY3RPcHRpb25zLFxuICApOiBUIHwgbnVsbDtcbiAgaW5qZWN0PFQ+KHRva2VuOiBQcm92aWRlclRva2VuPFQ+LCBub3RGb3VuZFZhbHVlPzogVCwgb3B0aW9ucz86IEluamVjdE9wdGlvbnMpOiBUO1xuICAvKiogQGRlcHJlY2F0ZWQgdXNlIG9iamVjdC1iYXNlZCBmbGFncyAoYEluamVjdE9wdGlvbnNgKSBpbnN0ZWFkLiAqL1xuICBpbmplY3Q8VD4odG9rZW46IFByb3ZpZGVyVG9rZW48VD4sIG5vdEZvdW5kVmFsdWU/OiBULCBmbGFncz86IEluamVjdEZsYWdzKTogVDtcbiAgLyoqIEBkZXByZWNhdGVkIHVzZSBvYmplY3QtYmFzZWQgZmxhZ3MgKGBJbmplY3RPcHRpb25zYCkgaW5zdGVhZC4gKi9cbiAgaW5qZWN0PFQ+KHRva2VuOiBQcm92aWRlclRva2VuPFQ+LCBub3RGb3VuZFZhbHVlOiBudWxsLCBmbGFncz86IEluamVjdEZsYWdzKTogVCB8IG51bGw7XG5cbiAgLyoqIEBkZXByZWNhdGVkIGZyb20gdjkuMC4wIHVzZSBUZXN0QmVkLmluamVjdCAqL1xuICBnZXQ8VD4odG9rZW46IFByb3ZpZGVyVG9rZW48VD4sIG5vdEZvdW5kVmFsdWU/OiBULCBmbGFncz86IEluamVjdEZsYWdzKTogYW55O1xuICAvKiogQGRlcHJlY2F0ZWQgZnJvbSB2OS4wLjAgdXNlIFRlc3RCZWQuaW5qZWN0ICovXG4gIGdldCh0b2tlbjogYW55LCBub3RGb3VuZFZhbHVlPzogYW55KTogYW55O1xuXG4gIC8qKlxuICAgKiBSdW5zIHRoZSBnaXZlbiBmdW5jdGlvbiBpbiB0aGUgYEVudmlyb25tZW50SW5qZWN0b3JgIGNvbnRleHQgb2YgYFRlc3RCZWRgLlxuICAgKlxuICAgKiBAc2VlIHtAbGluayBFbnZpcm9ubWVudEluamVjdG9yI3J1bkluQ29udGV4dH1cbiAgICovXG4gIHJ1bkluSW5qZWN0aW9uQ29udGV4dDxUPihmbjogKCkgPT4gVCk6IFQ7XG5cbiAgZXhlY3V0ZSh0b2tlbnM6IGFueVtdLCBmbjogRnVuY3Rpb24sIGNvbnRleHQ/OiBhbnkpOiBhbnk7XG5cbiAgb3ZlcnJpZGVNb2R1bGUobmdNb2R1bGU6IFR5cGU8YW55Piwgb3ZlcnJpZGU6IE1ldGFkYXRhT3ZlcnJpZGU8TmdNb2R1bGU+KTogVGVzdEJlZDtcblxuICBvdmVycmlkZUNvbXBvbmVudChjb21wb25lbnQ6IFR5cGU8YW55Piwgb3ZlcnJpZGU6IE1ldGFkYXRhT3ZlcnJpZGU8Q29tcG9uZW50Pik6IFRlc3RCZWQ7XG5cbiAgb3ZlcnJpZGVEaXJlY3RpdmUoZGlyZWN0aXZlOiBUeXBlPGFueT4sIG92ZXJyaWRlOiBNZXRhZGF0YU92ZXJyaWRlPERpcmVjdGl2ZT4pOiBUZXN0QmVkO1xuXG4gIG92ZXJyaWRlUGlwZShwaXBlOiBUeXBlPGFueT4sIG92ZXJyaWRlOiBNZXRhZGF0YU92ZXJyaWRlPFBpcGU+KTogVGVzdEJlZDtcblxuICBvdmVycmlkZVRlbXBsYXRlKGNvbXBvbmVudDogVHlwZTxhbnk+LCB0ZW1wbGF0ZTogc3RyaW5nKTogVGVzdEJlZDtcblxuICAvKipcbiAgICogT3ZlcndyaXRlcyBhbGwgcHJvdmlkZXJzIGZvciB0aGUgZ2l2ZW4gdG9rZW4gd2l0aCB0aGUgZ2l2ZW4gcHJvdmlkZXIgZGVmaW5pdGlvbi5cbiAgICovXG4gIG92ZXJyaWRlUHJvdmlkZXIoXG4gICAgdG9rZW46IGFueSxcbiAgICBwcm92aWRlcjoge3VzZUZhY3Rvcnk6IEZ1bmN0aW9uOyBkZXBzOiBhbnlbXTsgbXVsdGk/OiBib29sZWFufSxcbiAgKTogVGVzdEJlZDtcbiAgb3ZlcnJpZGVQcm92aWRlcih0b2tlbjogYW55LCBwcm92aWRlcjoge3VzZVZhbHVlOiBhbnk7IG11bHRpPzogYm9vbGVhbn0pOiBUZXN0QmVkO1xuICBvdmVycmlkZVByb3ZpZGVyKFxuICAgIHRva2VuOiBhbnksXG4gICAgcHJvdmlkZXI6IHt1c2VGYWN0b3J5PzogRnVuY3Rpb247IHVzZVZhbHVlPzogYW55OyBkZXBzPzogYW55W107IG11bHRpPzogYm9vbGVhbn0sXG4gICk6IFRlc3RCZWQ7XG5cbiAgb3ZlcnJpZGVUZW1wbGF0ZVVzaW5nVGVzdGluZ01vZHVsZShjb21wb25lbnQ6IFR5cGU8YW55PiwgdGVtcGxhdGU6IHN0cmluZyk6IFRlc3RCZWQ7XG5cbiAgY3JlYXRlQ29tcG9uZW50PFQ+KGNvbXBvbmVudDogVHlwZTxUPik6IENvbXBvbmVudEZpeHR1cmU8VD47XG5cbiAgLyoqXG4gICAqIEV4ZWN1dGUgYW55IHBlbmRpbmcgZWZmZWN0cy5cbiAgICpcbiAgICogQGRldmVsb3BlclByZXZpZXdcbiAgICovXG4gIGZsdXNoRWZmZWN0cygpOiB2b2lkO1xufVxuXG5sZXQgX25leHRSb290RWxlbWVudElkID0gMDtcblxuLyoqXG4gKiBSZXR1cm5zIGEgc2luZ2xldG9uIG9mIHRoZSBgVGVzdEJlZGAgY2xhc3MuXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0VGVzdEJlZCgpOiBUZXN0QmVkIHtcbiAgcmV0dXJuIFRlc3RCZWRJbXBsLklOU1RBTkNFO1xufVxuXG4vKipcbiAqIEBkZXNjcmlwdGlvblxuICogQ29uZmlndXJlcyBhbmQgaW5pdGlhbGl6ZXMgZW52aXJvbm1lbnQgZm9yIHVuaXQgdGVzdGluZyBhbmQgcHJvdmlkZXMgbWV0aG9kcyBmb3JcbiAqIGNyZWF0aW5nIGNvbXBvbmVudHMgYW5kIHNlcnZpY2VzIGluIHVuaXQgdGVzdHMuXG4gKlxuICogVGVzdEJlZCBpcyB0aGUgcHJpbWFyeSBhcGkgZm9yIHdyaXRpbmcgdW5pdCB0ZXN0cyBmb3IgQW5ndWxhciBhcHBsaWNhdGlvbnMgYW5kIGxpYnJhcmllcy5cbiAqL1xuZXhwb3J0IGNsYXNzIFRlc3RCZWRJbXBsIGltcGxlbWVudHMgVGVzdEJlZCB7XG4gIHByaXZhdGUgc3RhdGljIF9JTlNUQU5DRTogVGVzdEJlZEltcGwgfCBudWxsID0gbnVsbDtcblxuICBzdGF0aWMgZ2V0IElOU1RBTkNFKCk6IFRlc3RCZWRJbXBsIHtcbiAgICByZXR1cm4gKFRlc3RCZWRJbXBsLl9JTlNUQU5DRSA9IFRlc3RCZWRJbXBsLl9JTlNUQU5DRSB8fCBuZXcgVGVzdEJlZEltcGwoKSk7XG4gIH1cblxuICAvKipcbiAgICogVGVhcmRvd24gb3B0aW9ucyB0aGF0IGhhdmUgYmVlbiBjb25maWd1cmVkIGF0IHRoZSBlbnZpcm9ubWVudCBsZXZlbC5cbiAgICogVXNlZCBhcyBhIGZhbGxiYWNrIGlmIG5vIGluc3RhbmNlLWxldmVsIG9wdGlvbnMgaGF2ZSBiZWVuIHByb3ZpZGVkLlxuICAgKi9cbiAgcHJpdmF0ZSBzdGF0aWMgX2Vudmlyb25tZW50VGVhcmRvd25PcHRpb25zOiBNb2R1bGVUZWFyZG93bk9wdGlvbnMgfCB1bmRlZmluZWQ7XG5cbiAgLyoqXG4gICAqIFwiRXJyb3Igb24gdW5rbm93biBlbGVtZW50c1wiIG9wdGlvbiB0aGF0IGhhcyBiZWVuIGNvbmZpZ3VyZWQgYXQgdGhlIGVudmlyb25tZW50IGxldmVsLlxuICAgKiBVc2VkIGFzIGEgZmFsbGJhY2sgaWYgbm8gaW5zdGFuY2UtbGV2ZWwgb3B0aW9uIGhhcyBiZWVuIHByb3ZpZGVkLlxuICAgKi9cbiAgcHJpdmF0ZSBzdGF0aWMgX2Vudmlyb25tZW50RXJyb3JPblVua25vd25FbGVtZW50c09wdGlvbjogYm9vbGVhbiB8IHVuZGVmaW5lZDtcblxuICAvKipcbiAgICogXCJFcnJvciBvbiB1bmtub3duIHByb3BlcnRpZXNcIiBvcHRpb24gdGhhdCBoYXMgYmVlbiBjb25maWd1cmVkIGF0IHRoZSBlbnZpcm9ubWVudCBsZXZlbC5cbiAgICogVXNlZCBhcyBhIGZhbGxiYWNrIGlmIG5vIGluc3RhbmNlLWxldmVsIG9wdGlvbiBoYXMgYmVlbiBwcm92aWRlZC5cbiAgICovXG4gIHByaXZhdGUgc3RhdGljIF9lbnZpcm9ubWVudEVycm9yT25Vbmtub3duUHJvcGVydGllc09wdGlvbjogYm9vbGVhbiB8IHVuZGVmaW5lZDtcblxuICAvKipcbiAgICogVGVhcmRvd24gb3B0aW9ucyB0aGF0IGhhdmUgYmVlbiBjb25maWd1cmVkIGF0IHRoZSBgVGVzdEJlZGAgaW5zdGFuY2UgbGV2ZWwuXG4gICAqIFRoZXNlIG9wdGlvbnMgdGFrZSBwcmVjZWRlbmNlIG92ZXIgdGhlIGVudmlyb25tZW50LWxldmVsIG9uZXMuXG4gICAqL1xuICBwcml2YXRlIF9pbnN0YW5jZVRlYXJkb3duT3B0aW9uczogTW9kdWxlVGVhcmRvd25PcHRpb25zIHwgdW5kZWZpbmVkO1xuXG4gIC8qKlxuICAgKiBEZWZlciBibG9jayBiZWhhdmlvciBvcHRpb24gdGhhdCBzcGVjaWZpZXMgd2hldGhlciBkZWZlciBibG9ja3Mgd2lsbCBiZSB0cmlnZ2VyZWQgbWFudWFsbHlcbiAgICogb3Igc2V0IHRvIHBsYXkgdGhyb3VnaC5cbiAgICovXG4gIHByaXZhdGUgX2luc3RhbmNlRGVmZXJCbG9ja0JlaGF2aW9yID0gREVGRVJfQkxPQ0tfREVGQVVMVF9CRUhBVklPUjtcblxuICAvKipcbiAgICogXCJFcnJvciBvbiB1bmtub3duIGVsZW1lbnRzXCIgb3B0aW9uIHRoYXQgaGFzIGJlZW4gY29uZmlndXJlZCBhdCB0aGUgYFRlc3RCZWRgIGluc3RhbmNlIGxldmVsLlxuICAgKiBUaGlzIG9wdGlvbiB0YWtlcyBwcmVjZWRlbmNlIG92ZXIgdGhlIGVudmlyb25tZW50LWxldmVsIG9uZS5cbiAgICovXG4gIHByaXZhdGUgX2luc3RhbmNlRXJyb3JPblVua25vd25FbGVtZW50c09wdGlvbjogYm9vbGVhbiB8IHVuZGVmaW5lZDtcblxuICAvKipcbiAgICogXCJFcnJvciBvbiB1bmtub3duIHByb3BlcnRpZXNcIiBvcHRpb24gdGhhdCBoYXMgYmVlbiBjb25maWd1cmVkIGF0IHRoZSBgVGVzdEJlZGAgaW5zdGFuY2UgbGV2ZWwuXG4gICAqIFRoaXMgb3B0aW9uIHRha2VzIHByZWNlZGVuY2Ugb3ZlciB0aGUgZW52aXJvbm1lbnQtbGV2ZWwgb25lLlxuICAgKi9cbiAgcHJpdmF0ZSBfaW5zdGFuY2VFcnJvck9uVW5rbm93blByb3BlcnRpZXNPcHRpb246IGJvb2xlYW4gfCB1bmRlZmluZWQ7XG5cbiAgLyoqXG4gICAqIFN0b3JlcyB0aGUgcHJldmlvdXMgXCJFcnJvciBvbiB1bmtub3duIGVsZW1lbnRzXCIgb3B0aW9uIHZhbHVlLFxuICAgKiBhbGxvd2luZyB0byByZXN0b3JlIGl0IGluIHRoZSByZXNldCB0ZXN0aW5nIG1vZHVsZSBsb2dpYy5cbiAgICovXG4gIHByaXZhdGUgX3ByZXZpb3VzRXJyb3JPblVua25vd25FbGVtZW50c09wdGlvbjogYm9vbGVhbiB8IHVuZGVmaW5lZDtcblxuICAvKipcbiAgICogU3RvcmVzIHRoZSBwcmV2aW91cyBcIkVycm9yIG9uIHVua25vd24gcHJvcGVydGllc1wiIG9wdGlvbiB2YWx1ZSxcbiAgICogYWxsb3dpbmcgdG8gcmVzdG9yZSBpdCBpbiB0aGUgcmVzZXQgdGVzdGluZyBtb2R1bGUgbG9naWMuXG4gICAqL1xuICBwcml2YXRlIF9wcmV2aW91c0Vycm9yT25Vbmtub3duUHJvcGVydGllc09wdGlvbjogYm9vbGVhbiB8IHVuZGVmaW5lZDtcblxuICAvKipcbiAgICogSW5pdGlhbGl6ZSB0aGUgZW52aXJvbm1lbnQgZm9yIHRlc3Rpbmcgd2l0aCBhIGNvbXBpbGVyIGZhY3RvcnksIGEgUGxhdGZvcm1SZWYsIGFuZCBhblxuICAgKiBhbmd1bGFyIG1vZHVsZS4gVGhlc2UgYXJlIGNvbW1vbiB0byBldmVyeSB0ZXN0IGluIHRoZSBzdWl0ZS5cbiAgICpcbiAgICogVGhpcyBtYXkgb25seSBiZSBjYWxsZWQgb25jZSwgdG8gc2V0IHVwIHRoZSBjb21tb24gcHJvdmlkZXJzIGZvciB0aGUgY3VycmVudCB0ZXN0XG4gICAqIHN1aXRlIG9uIHRoZSBjdXJyZW50IHBsYXRmb3JtLiBJZiB5b3UgYWJzb2x1dGVseSBuZWVkIHRvIGNoYW5nZSB0aGUgcHJvdmlkZXJzLFxuICAgKiBmaXJzdCB1c2UgYHJlc2V0VGVzdEVudmlyb25tZW50YC5cbiAgICpcbiAgICogVGVzdCBtb2R1bGVzIGFuZCBwbGF0Zm9ybXMgZm9yIGluZGl2aWR1YWwgcGxhdGZvcm1zIGFyZSBhdmFpbGFibGUgZnJvbVxuICAgKiAnQGFuZ3VsYXIvPHBsYXRmb3JtX25hbWU+L3Rlc3RpbmcnLlxuICAgKlxuICAgKiBAcHVibGljQXBpXG4gICAqL1xuICBzdGF0aWMgaW5pdFRlc3RFbnZpcm9ubWVudChcbiAgICBuZ01vZHVsZTogVHlwZTxhbnk+IHwgVHlwZTxhbnk+W10sXG4gICAgcGxhdGZvcm06IFBsYXRmb3JtUmVmLFxuICAgIG9wdGlvbnM/OiBUZXN0RW52aXJvbm1lbnRPcHRpb25zLFxuICApOiBUZXN0QmVkIHtcbiAgICBjb25zdCB0ZXN0QmVkID0gVGVzdEJlZEltcGwuSU5TVEFOQ0U7XG4gICAgdGVzdEJlZC5pbml0VGVzdEVudmlyb25tZW50KG5nTW9kdWxlLCBwbGF0Zm9ybSwgb3B0aW9ucyk7XG4gICAgcmV0dXJuIHRlc3RCZWQ7XG4gIH1cblxuICAvKipcbiAgICogUmVzZXQgdGhlIHByb3ZpZGVycyBmb3IgdGhlIHRlc3QgaW5qZWN0b3IuXG4gICAqXG4gICAqIEBwdWJsaWNBcGlcbiAgICovXG4gIHN0YXRpYyByZXNldFRlc3RFbnZpcm9ubWVudCgpOiB2b2lkIHtcbiAgICBUZXN0QmVkSW1wbC5JTlNUQU5DRS5yZXNldFRlc3RFbnZpcm9ubWVudCgpO1xuICB9XG5cbiAgc3RhdGljIGNvbmZpZ3VyZUNvbXBpbGVyKGNvbmZpZzoge3Byb3ZpZGVycz86IGFueVtdOyB1c2VKaXQ/OiBib29sZWFufSk6IFRlc3RCZWQge1xuICAgIHJldHVybiBUZXN0QmVkSW1wbC5JTlNUQU5DRS5jb25maWd1cmVDb21waWxlcihjb25maWcpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFsbG93cyBvdmVycmlkaW5nIGRlZmF1bHQgcHJvdmlkZXJzLCBkaXJlY3RpdmVzLCBwaXBlcywgbW9kdWxlcyBvZiB0aGUgdGVzdCBpbmplY3RvcixcbiAgICogd2hpY2ggYXJlIGRlZmluZWQgaW4gdGVzdF9pbmplY3Rvci5qc1xuICAgKi9cbiAgc3RhdGljIGNvbmZpZ3VyZVRlc3RpbmdNb2R1bGUobW9kdWxlRGVmOiBUZXN0TW9kdWxlTWV0YWRhdGEpOiBUZXN0QmVkIHtcbiAgICByZXR1cm4gVGVzdEJlZEltcGwuSU5TVEFOQ0UuY29uZmlndXJlVGVzdGluZ01vZHVsZShtb2R1bGVEZWYpO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbXBpbGUgY29tcG9uZW50cyB3aXRoIGEgYHRlbXBsYXRlVXJsYCBmb3IgdGhlIHRlc3QncyBOZ01vZHVsZS5cbiAgICogSXQgaXMgbmVjZXNzYXJ5IHRvIGNhbGwgdGhpcyBmdW5jdGlvblxuICAgKiBhcyBmZXRjaGluZyB1cmxzIGlzIGFzeW5jaHJvbm91cy5cbiAgICovXG4gIHN0YXRpYyBjb21waWxlQ29tcG9uZW50cygpOiBQcm9taXNlPGFueT4ge1xuICAgIHJldHVybiBUZXN0QmVkSW1wbC5JTlNUQU5DRS5jb21waWxlQ29tcG9uZW50cygpO1xuICB9XG5cbiAgc3RhdGljIG92ZXJyaWRlTW9kdWxlKG5nTW9kdWxlOiBUeXBlPGFueT4sIG92ZXJyaWRlOiBNZXRhZGF0YU92ZXJyaWRlPE5nTW9kdWxlPik6IFRlc3RCZWQge1xuICAgIHJldHVybiBUZXN0QmVkSW1wbC5JTlNUQU5DRS5vdmVycmlkZU1vZHVsZShuZ01vZHVsZSwgb3ZlcnJpZGUpO1xuICB9XG5cbiAgc3RhdGljIG92ZXJyaWRlQ29tcG9uZW50KGNvbXBvbmVudDogVHlwZTxhbnk+LCBvdmVycmlkZTogTWV0YWRhdGFPdmVycmlkZTxDb21wb25lbnQ+KTogVGVzdEJlZCB7XG4gICAgcmV0dXJuIFRlc3RCZWRJbXBsLklOU1RBTkNFLm92ZXJyaWRlQ29tcG9uZW50KGNvbXBvbmVudCwgb3ZlcnJpZGUpO1xuICB9XG5cbiAgc3RhdGljIG92ZXJyaWRlRGlyZWN0aXZlKGRpcmVjdGl2ZTogVHlwZTxhbnk+LCBvdmVycmlkZTogTWV0YWRhdGFPdmVycmlkZTxEaXJlY3RpdmU+KTogVGVzdEJlZCB7XG4gICAgcmV0dXJuIFRlc3RCZWRJbXBsLklOU1RBTkNFLm92ZXJyaWRlRGlyZWN0aXZlKGRpcmVjdGl2ZSwgb3ZlcnJpZGUpO1xuICB9XG5cbiAgc3RhdGljIG92ZXJyaWRlUGlwZShwaXBlOiBUeXBlPGFueT4sIG92ZXJyaWRlOiBNZXRhZGF0YU92ZXJyaWRlPFBpcGU+KTogVGVzdEJlZCB7XG4gICAgcmV0dXJuIFRlc3RCZWRJbXBsLklOU1RBTkNFLm92ZXJyaWRlUGlwZShwaXBlLCBvdmVycmlkZSk7XG4gIH1cblxuICBzdGF0aWMgb3ZlcnJpZGVUZW1wbGF0ZShjb21wb25lbnQ6IFR5cGU8YW55PiwgdGVtcGxhdGU6IHN0cmluZyk6IFRlc3RCZWQge1xuICAgIHJldHVybiBUZXN0QmVkSW1wbC5JTlNUQU5DRS5vdmVycmlkZVRlbXBsYXRlKGNvbXBvbmVudCwgdGVtcGxhdGUpO1xuICB9XG5cbiAgLyoqXG4gICAqIE92ZXJyaWRlcyB0aGUgdGVtcGxhdGUgb2YgdGhlIGdpdmVuIGNvbXBvbmVudCwgY29tcGlsaW5nIHRoZSB0ZW1wbGF0ZVxuICAgKiBpbiB0aGUgY29udGV4dCBvZiB0aGUgVGVzdGluZ01vZHVsZS5cbiAgICpcbiAgICogTm90ZTogVGhpcyB3b3JrcyBmb3IgSklUIGFuZCBBT1RlZCBjb21wb25lbnRzIGFzIHdlbGwuXG4gICAqL1xuICBzdGF0aWMgb3ZlcnJpZGVUZW1wbGF0ZVVzaW5nVGVzdGluZ01vZHVsZShjb21wb25lbnQ6IFR5cGU8YW55PiwgdGVtcGxhdGU6IHN0cmluZyk6IFRlc3RCZWQge1xuICAgIHJldHVybiBUZXN0QmVkSW1wbC5JTlNUQU5DRS5vdmVycmlkZVRlbXBsYXRlVXNpbmdUZXN0aW5nTW9kdWxlKGNvbXBvbmVudCwgdGVtcGxhdGUpO1xuICB9XG5cbiAgc3RhdGljIG92ZXJyaWRlUHJvdmlkZXIoXG4gICAgdG9rZW46IGFueSxcbiAgICBwcm92aWRlcjoge1xuICAgICAgdXNlRmFjdG9yeTogRnVuY3Rpb247XG4gICAgICBkZXBzOiBhbnlbXTtcbiAgICB9LFxuICApOiBUZXN0QmVkO1xuICBzdGF0aWMgb3ZlcnJpZGVQcm92aWRlcih0b2tlbjogYW55LCBwcm92aWRlcjoge3VzZVZhbHVlOiBhbnl9KTogVGVzdEJlZDtcbiAgc3RhdGljIG92ZXJyaWRlUHJvdmlkZXIoXG4gICAgdG9rZW46IGFueSxcbiAgICBwcm92aWRlcjoge1xuICAgICAgdXNlRmFjdG9yeT86IEZ1bmN0aW9uO1xuICAgICAgdXNlVmFsdWU/OiBhbnk7XG4gICAgICBkZXBzPzogYW55W107XG4gICAgfSxcbiAgKTogVGVzdEJlZCB7XG4gICAgcmV0dXJuIFRlc3RCZWRJbXBsLklOU1RBTkNFLm92ZXJyaWRlUHJvdmlkZXIodG9rZW4sIHByb3ZpZGVyKTtcbiAgfVxuXG4gIHN0YXRpYyBpbmplY3Q8VD4oXG4gICAgdG9rZW46IFByb3ZpZGVyVG9rZW48VD4sXG4gICAgbm90Rm91bmRWYWx1ZTogdW5kZWZpbmVkLFxuICAgIG9wdGlvbnM6IEluamVjdE9wdGlvbnMgJiB7XG4gICAgICBvcHRpb25hbD86IGZhbHNlO1xuICAgIH0sXG4gICk6IFQ7XG4gIHN0YXRpYyBpbmplY3Q8VD4oXG4gICAgdG9rZW46IFByb3ZpZGVyVG9rZW48VD4sXG4gICAgbm90Rm91bmRWYWx1ZTogbnVsbCB8IHVuZGVmaW5lZCxcbiAgICBvcHRpb25zOiBJbmplY3RPcHRpb25zLFxuICApOiBUIHwgbnVsbDtcbiAgc3RhdGljIGluamVjdDxUPih0b2tlbjogUHJvdmlkZXJUb2tlbjxUPiwgbm90Rm91bmRWYWx1ZT86IFQsIG9wdGlvbnM/OiBJbmplY3RPcHRpb25zKTogVDtcbiAgLyoqIEBkZXByZWNhdGVkIHVzZSBvYmplY3QtYmFzZWQgZmxhZ3MgKGBJbmplY3RPcHRpb25zYCkgaW5zdGVhZC4gKi9cbiAgc3RhdGljIGluamVjdDxUPih0b2tlbjogUHJvdmlkZXJUb2tlbjxUPiwgbm90Rm91bmRWYWx1ZT86IFQsIGZsYWdzPzogSW5qZWN0RmxhZ3MpOiBUO1xuICAvKiogQGRlcHJlY2F0ZWQgdXNlIG9iamVjdC1iYXNlZCBmbGFncyAoYEluamVjdE9wdGlvbnNgKSBpbnN0ZWFkLiAqL1xuICBzdGF0aWMgaW5qZWN0PFQ+KHRva2VuOiBQcm92aWRlclRva2VuPFQ+LCBub3RGb3VuZFZhbHVlOiBudWxsLCBmbGFncz86IEluamVjdEZsYWdzKTogVCB8IG51bGw7XG4gIHN0YXRpYyBpbmplY3Q8VD4oXG4gICAgdG9rZW46IFByb3ZpZGVyVG9rZW48VD4sXG4gICAgbm90Rm91bmRWYWx1ZT86IFQgfCBudWxsLFxuICAgIGZsYWdzPzogSW5qZWN0RmxhZ3MgfCBJbmplY3RPcHRpb25zLFxuICApOiBUIHwgbnVsbCB7XG4gICAgcmV0dXJuIFRlc3RCZWRJbXBsLklOU1RBTkNFLmluamVjdCh0b2tlbiwgbm90Rm91bmRWYWx1ZSwgY29udmVydFRvQml0RmxhZ3MoZmxhZ3MpKTtcbiAgfVxuXG4gIC8qKiBAZGVwcmVjYXRlZCBmcm9tIHY5LjAuMCB1c2UgVGVzdEJlZC5pbmplY3QgKi9cbiAgc3RhdGljIGdldDxUPih0b2tlbjogUHJvdmlkZXJUb2tlbjxUPiwgbm90Rm91bmRWYWx1ZT86IFQsIGZsYWdzPzogSW5qZWN0RmxhZ3MpOiBhbnk7XG4gIC8qKiBAZGVwcmVjYXRlZCBmcm9tIHY5LjAuMCB1c2UgVGVzdEJlZC5pbmplY3QgKi9cbiAgc3RhdGljIGdldCh0b2tlbjogYW55LCBub3RGb3VuZFZhbHVlPzogYW55KTogYW55O1xuICAvKiogQGRlcHJlY2F0ZWQgZnJvbSB2OS4wLjAgdXNlIFRlc3RCZWQuaW5qZWN0ICovXG4gIHN0YXRpYyBnZXQoXG4gICAgdG9rZW46IGFueSxcbiAgICBub3RGb3VuZFZhbHVlOiBhbnkgPSBJbmplY3Rvci5USFJPV19JRl9OT1RfRk9VTkQsXG4gICAgZmxhZ3M6IEluamVjdEZsYWdzID0gSW5qZWN0RmxhZ3MuRGVmYXVsdCxcbiAgKTogYW55IHtcbiAgICByZXR1cm4gVGVzdEJlZEltcGwuSU5TVEFOQ0UuaW5qZWN0KHRva2VuLCBub3RGb3VuZFZhbHVlLCBmbGFncyk7XG4gIH1cblxuICAvKipcbiAgICogUnVucyB0aGUgZ2l2ZW4gZnVuY3Rpb24gaW4gdGhlIGBFbnZpcm9ubWVudEluamVjdG9yYCBjb250ZXh0IG9mIGBUZXN0QmVkYC5cbiAgICpcbiAgICogQHNlZSB7QGxpbmsgRW52aXJvbm1lbnRJbmplY3RvciNydW5JbkNvbnRleHR9XG4gICAqL1xuICBzdGF0aWMgcnVuSW5JbmplY3Rpb25Db250ZXh0PFQ+KGZuOiAoKSA9PiBUKTogVCB7XG4gICAgcmV0dXJuIFRlc3RCZWRJbXBsLklOU1RBTkNFLnJ1bkluSW5qZWN0aW9uQ29udGV4dChmbik7XG4gIH1cblxuICBzdGF0aWMgY3JlYXRlQ29tcG9uZW50PFQ+KGNvbXBvbmVudDogVHlwZTxUPik6IENvbXBvbmVudEZpeHR1cmU8VD4ge1xuICAgIHJldHVybiBUZXN0QmVkSW1wbC5JTlNUQU5DRS5jcmVhdGVDb21wb25lbnQoY29tcG9uZW50KTtcbiAgfVxuXG4gIHN0YXRpYyByZXNldFRlc3RpbmdNb2R1bGUoKTogVGVzdEJlZCB7XG4gICAgcmV0dXJuIFRlc3RCZWRJbXBsLklOU1RBTkNFLnJlc2V0VGVzdGluZ01vZHVsZSgpO1xuICB9XG5cbiAgc3RhdGljIGV4ZWN1dGUodG9rZW5zOiBhbnlbXSwgZm46IEZ1bmN0aW9uLCBjb250ZXh0PzogYW55KTogYW55IHtcbiAgICByZXR1cm4gVGVzdEJlZEltcGwuSU5TVEFOQ0UuZXhlY3V0ZSh0b2tlbnMsIGZuLCBjb250ZXh0KTtcbiAgfVxuXG4gIHN0YXRpYyBnZXQgcGxhdGZvcm0oKTogUGxhdGZvcm1SZWYge1xuICAgIHJldHVybiBUZXN0QmVkSW1wbC5JTlNUQU5DRS5wbGF0Zm9ybTtcbiAgfVxuXG4gIHN0YXRpYyBnZXQgbmdNb2R1bGUoKTogVHlwZTxhbnk+IHwgVHlwZTxhbnk+W10ge1xuICAgIHJldHVybiBUZXN0QmVkSW1wbC5JTlNUQU5DRS5uZ01vZHVsZTtcbiAgfVxuXG4gIHN0YXRpYyBmbHVzaEVmZmVjdHMoKTogdm9pZCB7XG4gICAgcmV0dXJuIFRlc3RCZWRJbXBsLklOU1RBTkNFLmZsdXNoRWZmZWN0cygpO1xuICB9XG5cbiAgLy8gUHJvcGVydGllc1xuXG4gIHBsYXRmb3JtOiBQbGF0Zm9ybVJlZiA9IG51bGwhO1xuICBuZ01vZHVsZTogVHlwZTxhbnk+IHwgVHlwZTxhbnk+W10gPSBudWxsITtcblxuICBwcml2YXRlIF9jb21waWxlcjogVGVzdEJlZENvbXBpbGVyIHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgX3Rlc3RNb2R1bGVSZWY6IE5nTW9kdWxlUmVmPGFueT4gfCBudWxsID0gbnVsbDtcblxuICBwcml2YXRlIF9hY3RpdmVGaXh0dXJlczogQ29tcG9uZW50Rml4dHVyZTxhbnk+W10gPSBbXTtcblxuICAvKipcbiAgICogSW50ZXJuYWwtb25seSBmbGFnIHRvIGluZGljYXRlIHdoZXRoZXIgYSBtb2R1bGVcbiAgICogc2NvcGluZyBxdWV1ZSBoYXMgYmVlbiBjaGVja2VkIGFuZCBmbHVzaGVkIGFscmVhZHkuXG4gICAqIEBub2RvY1xuICAgKi9cbiAgZ2xvYmFsQ29tcGlsYXRpb25DaGVja2VkID0gZmFsc2U7XG5cbiAgLyoqXG4gICAqIEluaXRpYWxpemUgdGhlIGVudmlyb25tZW50IGZvciB0ZXN0aW5nIHdpdGggYSBjb21waWxlciBmYWN0b3J5LCBhIFBsYXRmb3JtUmVmLCBhbmQgYW5cbiAgICogYW5ndWxhciBtb2R1bGUuIFRoZXNlIGFyZSBjb21tb24gdG8gZXZlcnkgdGVzdCBpbiB0aGUgc3VpdGUuXG4gICAqXG4gICAqIFRoaXMgbWF5IG9ubHkgYmUgY2FsbGVkIG9uY2UsIHRvIHNldCB1cCB0aGUgY29tbW9uIHByb3ZpZGVycyBmb3IgdGhlIGN1cnJlbnQgdGVzdFxuICAgKiBzdWl0ZSBvbiB0aGUgY3VycmVudCBwbGF0Zm9ybS4gSWYgeW91IGFic29sdXRlbHkgbmVlZCB0byBjaGFuZ2UgdGhlIHByb3ZpZGVycyxcbiAgICogZmlyc3QgdXNlIGByZXNldFRlc3RFbnZpcm9ubWVudGAuXG4gICAqXG4gICAqIFRlc3QgbW9kdWxlcyBhbmQgcGxhdGZvcm1zIGZvciBpbmRpdmlkdWFsIHBsYXRmb3JtcyBhcmUgYXZhaWxhYmxlIGZyb21cbiAgICogJ0Bhbmd1bGFyLzxwbGF0Zm9ybV9uYW1lPi90ZXN0aW5nJy5cbiAgICpcbiAgICogQHB1YmxpY0FwaVxuICAgKi9cbiAgaW5pdFRlc3RFbnZpcm9ubWVudChcbiAgICBuZ01vZHVsZTogVHlwZTxhbnk+IHwgVHlwZTxhbnk+W10sXG4gICAgcGxhdGZvcm06IFBsYXRmb3JtUmVmLFxuICAgIG9wdGlvbnM/OiBUZXN0RW52aXJvbm1lbnRPcHRpb25zLFxuICApOiB2b2lkIHtcbiAgICBpZiAodGhpcy5wbGF0Zm9ybSB8fCB0aGlzLm5nTW9kdWxlKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0Nhbm5vdCBzZXQgYmFzZSBwcm92aWRlcnMgYmVjYXVzZSBpdCBoYXMgYWxyZWFkeSBiZWVuIGNhbGxlZCcpO1xuICAgIH1cblxuICAgIFRlc3RCZWRJbXBsLl9lbnZpcm9ubWVudFRlYXJkb3duT3B0aW9ucyA9IG9wdGlvbnM/LnRlYXJkb3duO1xuXG4gICAgVGVzdEJlZEltcGwuX2Vudmlyb25tZW50RXJyb3JPblVua25vd25FbGVtZW50c09wdGlvbiA9IG9wdGlvbnM/LmVycm9yT25Vbmtub3duRWxlbWVudHM7XG5cbiAgICBUZXN0QmVkSW1wbC5fZW52aXJvbm1lbnRFcnJvck9uVW5rbm93blByb3BlcnRpZXNPcHRpb24gPSBvcHRpb25zPy5lcnJvck9uVW5rbm93blByb3BlcnRpZXM7XG5cbiAgICB0aGlzLnBsYXRmb3JtID0gcGxhdGZvcm07XG4gICAgdGhpcy5uZ01vZHVsZSA9IG5nTW9kdWxlO1xuICAgIHRoaXMuX2NvbXBpbGVyID0gbmV3IFRlc3RCZWRDb21waWxlcih0aGlzLnBsYXRmb3JtLCB0aGlzLm5nTW9kdWxlKTtcblxuICAgIC8vIFRlc3RCZWQgZG9lcyBub3QgaGF2ZSBhbiBBUEkgd2hpY2ggY2FuIHJlbGlhYmx5IGRldGVjdCB0aGUgc3RhcnQgb2YgYSB0ZXN0LCBhbmQgdGh1cyBjb3VsZCBiZVxuICAgIC8vIHVzZWQgdG8gdHJhY2sgdGhlIHN0YXRlIG9mIHRoZSBOZ01vZHVsZSByZWdpc3RyeSBhbmQgcmVzZXQgaXQgY29ycmVjdGx5LiBJbnN0ZWFkLCB3aGVuIHdlXG4gICAgLy8ga25vdyB3ZSdyZSBpbiBhIHRlc3Rpbmcgc2NlbmFyaW8sIHdlIGRpc2FibGUgdGhlIGNoZWNrIGZvciBkdXBsaWNhdGUgTmdNb2R1bGUgcmVnaXN0cmF0aW9uXG4gICAgLy8gY29tcGxldGVseS5cbiAgICBzZXRBbGxvd0R1cGxpY2F0ZU5nTW9kdWxlSWRzRm9yVGVzdCh0cnVlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXNldCB0aGUgcHJvdmlkZXJzIGZvciB0aGUgdGVzdCBpbmplY3Rvci5cbiAgICpcbiAgICogQHB1YmxpY0FwaVxuICAgKi9cbiAgcmVzZXRUZXN0RW52aXJvbm1lbnQoKTogdm9pZCB7XG4gICAgdGhpcy5yZXNldFRlc3RpbmdNb2R1bGUoKTtcbiAgICB0aGlzLl9jb21waWxlciA9IG51bGw7XG4gICAgdGhpcy5wbGF0Zm9ybSA9IG51bGwhO1xuICAgIHRoaXMubmdNb2R1bGUgPSBudWxsITtcbiAgICBUZXN0QmVkSW1wbC5fZW52aXJvbm1lbnRUZWFyZG93bk9wdGlvbnMgPSB1bmRlZmluZWQ7XG4gICAgc2V0QWxsb3dEdXBsaWNhdGVOZ01vZHVsZUlkc0ZvclRlc3QoZmFsc2UpO1xuICB9XG5cbiAgcmVzZXRUZXN0aW5nTW9kdWxlKCk6IHRoaXMge1xuICAgIHRoaXMuY2hlY2tHbG9iYWxDb21waWxhdGlvbkZpbmlzaGVkKCk7XG4gICAgcmVzZXRDb21waWxlZENvbXBvbmVudHMoKTtcbiAgICBpZiAodGhpcy5fY29tcGlsZXIgIT09IG51bGwpIHtcbiAgICAgIHRoaXMuY29tcGlsZXIucmVzdG9yZU9yaWdpbmFsU3RhdGUoKTtcbiAgICB9XG4gICAgdGhpcy5fY29tcGlsZXIgPSBuZXcgVGVzdEJlZENvbXBpbGVyKHRoaXMucGxhdGZvcm0sIHRoaXMubmdNb2R1bGUpO1xuICAgIC8vIFJlc3RvcmUgdGhlIHByZXZpb3VzIHZhbHVlIG9mIHRoZSBcImVycm9yIG9uIHVua25vd24gZWxlbWVudHNcIiBvcHRpb25cbiAgICBzZXRVbmtub3duRWxlbWVudFN0cmljdE1vZGUoXG4gICAgICB0aGlzLl9wcmV2aW91c0Vycm9yT25Vbmtub3duRWxlbWVudHNPcHRpb24gPz8gVEhST1dfT05fVU5LTk9XTl9FTEVNRU5UU19ERUZBVUxULFxuICAgICk7XG4gICAgLy8gUmVzdG9yZSB0aGUgcHJldmlvdXMgdmFsdWUgb2YgdGhlIFwiZXJyb3Igb24gdW5rbm93biBwcm9wZXJ0aWVzXCIgb3B0aW9uXG4gICAgc2V0VW5rbm93blByb3BlcnR5U3RyaWN0TW9kZShcbiAgICAgIHRoaXMuX3ByZXZpb3VzRXJyb3JPblVua25vd25Qcm9wZXJ0aWVzT3B0aW9uID8/IFRIUk9XX09OX1VOS05PV05fUFJPUEVSVElFU19ERUZBVUxULFxuICAgICk7XG5cbiAgICAvLyBXZSBoYXZlIHRvIGNoYWluIGEgY291cGxlIG9mIHRyeS9maW5hbGx5IGJsb2NrcywgYmVjYXVzZSBlYWNoIHN0ZXAgY2FuXG4gICAgLy8gdGhyb3cgZXJyb3JzIGFuZCB3ZSBkb24ndCB3YW50IGl0IHRvIGludGVycnVwdCB0aGUgbmV4dCBzdGVwIGFuZCB3ZSBhbHNvXG4gICAgLy8gd2FudCBhbiBlcnJvciB0byBiZSB0aHJvd24gYXQgdGhlIGVuZC5cbiAgICB0cnkge1xuICAgICAgdGhpcy5kZXN0cm95QWN0aXZlRml4dHVyZXMoKTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgdHJ5IHtcbiAgICAgICAgaWYgKHRoaXMuc2hvdWxkVGVhckRvd25UZXN0aW5nTW9kdWxlKCkpIHtcbiAgICAgICAgICB0aGlzLnRlYXJEb3duVGVzdGluZ01vZHVsZSgpO1xuICAgICAgICB9XG4gICAgICB9IGZpbmFsbHkge1xuICAgICAgICB0aGlzLl90ZXN0TW9kdWxlUmVmID0gbnVsbDtcbiAgICAgICAgdGhpcy5faW5zdGFuY2VUZWFyZG93bk9wdGlvbnMgPSB1bmRlZmluZWQ7XG4gICAgICAgIHRoaXMuX2luc3RhbmNlRXJyb3JPblVua25vd25FbGVtZW50c09wdGlvbiA9IHVuZGVmaW5lZDtcbiAgICAgICAgdGhpcy5faW5zdGFuY2VFcnJvck9uVW5rbm93blByb3BlcnRpZXNPcHRpb24gPSB1bmRlZmluZWQ7XG4gICAgICAgIHRoaXMuX2luc3RhbmNlRGVmZXJCbG9ja0JlaGF2aW9yID0gREVGRVJfQkxPQ0tfREVGQVVMVF9CRUhBVklPUjtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBjb25maWd1cmVDb21waWxlcihjb25maWc6IHtwcm92aWRlcnM/OiBhbnlbXTsgdXNlSml0PzogYm9vbGVhbn0pOiB0aGlzIHtcbiAgICBpZiAoY29uZmlnLnVzZUppdCAhPSBudWxsKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0pJVCBjb21waWxlciBpcyBub3QgY29uZmlndXJhYmxlIHZpYSBUZXN0QmVkIEFQSXMuJyk7XG4gICAgfVxuXG4gICAgaWYgKGNvbmZpZy5wcm92aWRlcnMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhpcy5jb21waWxlci5zZXRDb21waWxlclByb3ZpZGVycyhjb25maWcucHJvdmlkZXJzKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBjb25maWd1cmVUZXN0aW5nTW9kdWxlKG1vZHVsZURlZjogVGVzdE1vZHVsZU1ldGFkYXRhKTogdGhpcyB7XG4gICAgdGhpcy5hc3NlcnROb3RJbnN0YW50aWF0ZWQoJ1Rlc3RCZWQuY29uZmlndXJlVGVzdGluZ01vZHVsZScsICdjb25maWd1cmUgdGhlIHRlc3QgbW9kdWxlJyk7XG5cbiAgICAvLyBUcmlnZ2VyIG1vZHVsZSBzY29waW5nIHF1ZXVlIGZsdXNoIGJlZm9yZSBleGVjdXRpbmcgb3RoZXIgVGVzdEJlZCBvcGVyYXRpb25zIGluIGEgdGVzdC5cbiAgICAvLyBUaGlzIGlzIG5lZWRlZCBmb3IgdGhlIGZpcnN0IHRlc3QgaW52b2NhdGlvbiB0byBlbnN1cmUgdGhhdCBnbG9iYWxseSBkZWNsYXJlZCBtb2R1bGVzIGhhdmVcbiAgICAvLyB0aGVpciBjb21wb25lbnRzIHNjb3BlZCBwcm9wZXJseS4gU2VlIHRoZSBgY2hlY2tHbG9iYWxDb21waWxhdGlvbkZpbmlzaGVkYCBmdW5jdGlvblxuICAgIC8vIGRlc2NyaXB0aW9uIGZvciBhZGRpdGlvbmFsIGluZm8uXG4gICAgdGhpcy5jaGVja0dsb2JhbENvbXBpbGF0aW9uRmluaXNoZWQoKTtcblxuICAgIC8vIEFsd2F5cyByZS1hc3NpZ24gdGhlIG9wdGlvbnMsIGV2ZW4gaWYgdGhleSdyZSB1bmRlZmluZWQuXG4gICAgLy8gVGhpcyBlbnN1cmVzIHRoYXQgd2UgZG9uJ3QgY2FycnkgdGhlbSBiZXR3ZWVuIHRlc3RzLlxuICAgIHRoaXMuX2luc3RhbmNlVGVhcmRvd25PcHRpb25zID0gbW9kdWxlRGVmLnRlYXJkb3duO1xuICAgIHRoaXMuX2luc3RhbmNlRXJyb3JPblVua25vd25FbGVtZW50c09wdGlvbiA9IG1vZHVsZURlZi5lcnJvck9uVW5rbm93bkVsZW1lbnRzO1xuICAgIHRoaXMuX2luc3RhbmNlRXJyb3JPblVua25vd25Qcm9wZXJ0aWVzT3B0aW9uID0gbW9kdWxlRGVmLmVycm9yT25Vbmtub3duUHJvcGVydGllcztcbiAgICB0aGlzLl9pbnN0YW5jZURlZmVyQmxvY2tCZWhhdmlvciA9IG1vZHVsZURlZi5kZWZlckJsb2NrQmVoYXZpb3IgPz8gREVGRVJfQkxPQ0tfREVGQVVMVF9CRUhBVklPUjtcbiAgICAvLyBTdG9yZSB0aGUgY3VycmVudCB2YWx1ZSBvZiB0aGUgc3RyaWN0IG1vZGUgb3B0aW9uLFxuICAgIC8vIHNvIHdlIGNhbiByZXN0b3JlIGl0IGxhdGVyXG4gICAgdGhpcy5fcHJldmlvdXNFcnJvck9uVW5rbm93bkVsZW1lbnRzT3B0aW9uID0gZ2V0VW5rbm93bkVsZW1lbnRTdHJpY3RNb2RlKCk7XG4gICAgc2V0VW5rbm93bkVsZW1lbnRTdHJpY3RNb2RlKHRoaXMuc2hvdWxkVGhyb3dFcnJvck9uVW5rbm93bkVsZW1lbnRzKCkpO1xuICAgIHRoaXMuX3ByZXZpb3VzRXJyb3JPblVua25vd25Qcm9wZXJ0aWVzT3B0aW9uID0gZ2V0VW5rbm93blByb3BlcnR5U3RyaWN0TW9kZSgpO1xuICAgIHNldFVua25vd25Qcm9wZXJ0eVN0cmljdE1vZGUodGhpcy5zaG91bGRUaHJvd0Vycm9yT25Vbmtub3duUHJvcGVydGllcygpKTtcbiAgICB0aGlzLmNvbXBpbGVyLmNvbmZpZ3VyZVRlc3RpbmdNb2R1bGUobW9kdWxlRGVmKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIGNvbXBpbGVDb21wb25lbnRzKCk6IFByb21pc2U8YW55PiB7XG4gICAgcmV0dXJuIHRoaXMuY29tcGlsZXIuY29tcGlsZUNvbXBvbmVudHMoKTtcbiAgfVxuXG4gIGluamVjdDxUPihcbiAgICB0b2tlbjogUHJvdmlkZXJUb2tlbjxUPixcbiAgICBub3RGb3VuZFZhbHVlOiB1bmRlZmluZWQsXG4gICAgb3B0aW9uczogSW5qZWN0T3B0aW9ucyAmIHtcbiAgICAgIG9wdGlvbmFsOiB0cnVlO1xuICAgIH0sXG4gICk6IFQgfCBudWxsO1xuICBpbmplY3Q8VD4odG9rZW46IFByb3ZpZGVyVG9rZW48VD4sIG5vdEZvdW5kVmFsdWU/OiBULCBvcHRpb25zPzogSW5qZWN0T3B0aW9ucyk6IFQ7XG4gIGluamVjdDxUPih0b2tlbjogUHJvdmlkZXJUb2tlbjxUPiwgbm90Rm91bmRWYWx1ZTogbnVsbCwgb3B0aW9ucz86IEluamVjdE9wdGlvbnMpOiBUIHwgbnVsbDtcbiAgLyoqIEBkZXByZWNhdGVkIHVzZSBvYmplY3QtYmFzZWQgZmxhZ3MgKGBJbmplY3RPcHRpb25zYCkgaW5zdGVhZC4gKi9cbiAgaW5qZWN0PFQ+KHRva2VuOiBQcm92aWRlclRva2VuPFQ+LCBub3RGb3VuZFZhbHVlPzogVCwgZmxhZ3M/OiBJbmplY3RGbGFncyk6IFQ7XG4gIC8qKiBAZGVwcmVjYXRlZCB1c2Ugb2JqZWN0LWJhc2VkIGZsYWdzIChgSW5qZWN0T3B0aW9uc2ApIGluc3RlYWQuICovXG4gIGluamVjdDxUPih0b2tlbjogUHJvdmlkZXJUb2tlbjxUPiwgbm90Rm91bmRWYWx1ZTogbnVsbCwgZmxhZ3M/OiBJbmplY3RGbGFncyk6IFQgfCBudWxsO1xuICBpbmplY3Q8VD4oXG4gICAgdG9rZW46IFByb3ZpZGVyVG9rZW48VD4sXG4gICAgbm90Rm91bmRWYWx1ZT86IFQgfCBudWxsLFxuICAgIGZsYWdzPzogSW5qZWN0RmxhZ3MgfCBJbmplY3RPcHRpb25zLFxuICApOiBUIHwgbnVsbCB7XG4gICAgaWYgKCh0b2tlbiBhcyB1bmtub3duKSA9PT0gVGVzdEJlZCkge1xuICAgICAgcmV0dXJuIHRoaXMgYXMgYW55O1xuICAgIH1cbiAgICBjb25zdCBVTkRFRklORUQgPSB7fSBhcyB1bmtub3duIGFzIFQ7XG4gICAgY29uc3QgcmVzdWx0ID0gdGhpcy50ZXN0TW9kdWxlUmVmLmluamVjdG9yLmdldCh0b2tlbiwgVU5ERUZJTkVELCBjb252ZXJ0VG9CaXRGbGFncyhmbGFncykpO1xuICAgIHJldHVybiByZXN1bHQgPT09IFVOREVGSU5FRFxuICAgICAgPyAodGhpcy5jb21waWxlci5pbmplY3Rvci5nZXQodG9rZW4sIG5vdEZvdW5kVmFsdWUsIGZsYWdzKSBhcyBhbnkpXG4gICAgICA6IHJlc3VsdDtcbiAgfVxuXG4gIC8qKiBAZGVwcmVjYXRlZCBmcm9tIHY5LjAuMCB1c2UgVGVzdEJlZC5pbmplY3QgKi9cbiAgZ2V0PFQ+KHRva2VuOiBQcm92aWRlclRva2VuPFQ+LCBub3RGb3VuZFZhbHVlPzogVCwgZmxhZ3M/OiBJbmplY3RGbGFncyk6IGFueTtcbiAgLyoqIEBkZXByZWNhdGVkIGZyb20gdjkuMC4wIHVzZSBUZXN0QmVkLmluamVjdCAqL1xuICBnZXQodG9rZW46IGFueSwgbm90Rm91bmRWYWx1ZT86IGFueSk6IGFueTtcbiAgLyoqIEBkZXByZWNhdGVkIGZyb20gdjkuMC4wIHVzZSBUZXN0QmVkLmluamVjdCAqL1xuICBnZXQoXG4gICAgdG9rZW46IGFueSxcbiAgICBub3RGb3VuZFZhbHVlOiBhbnkgPSBJbmplY3Rvci5USFJPV19JRl9OT1RfRk9VTkQsXG4gICAgZmxhZ3M6IEluamVjdEZsYWdzID0gSW5qZWN0RmxhZ3MuRGVmYXVsdCxcbiAgKTogYW55IHtcbiAgICByZXR1cm4gdGhpcy5pbmplY3QodG9rZW4sIG5vdEZvdW5kVmFsdWUsIGZsYWdzKTtcbiAgfVxuXG4gIHJ1bkluSW5qZWN0aW9uQ29udGV4dDxUPihmbjogKCkgPT4gVCk6IFQge1xuICAgIHJldHVybiBydW5JbkluamVjdGlvbkNvbnRleHQodGhpcy5pbmplY3QoRW52aXJvbm1lbnRJbmplY3RvciksIGZuKTtcbiAgfVxuXG4gIGV4ZWN1dGUodG9rZW5zOiBhbnlbXSwgZm46IEZ1bmN0aW9uLCBjb250ZXh0PzogYW55KTogYW55IHtcbiAgICBjb25zdCBwYXJhbXMgPSB0b2tlbnMubWFwKCh0KSA9PiB0aGlzLmluamVjdCh0KSk7XG4gICAgcmV0dXJuIGZuLmFwcGx5KGNvbnRleHQsIHBhcmFtcyk7XG4gIH1cblxuICBvdmVycmlkZU1vZHVsZShuZ01vZHVsZTogVHlwZTxhbnk+LCBvdmVycmlkZTogTWV0YWRhdGFPdmVycmlkZTxOZ01vZHVsZT4pOiB0aGlzIHtcbiAgICB0aGlzLmFzc2VydE5vdEluc3RhbnRpYXRlZCgnb3ZlcnJpZGVNb2R1bGUnLCAnb3ZlcnJpZGUgbW9kdWxlIG1ldGFkYXRhJyk7XG4gICAgdGhpcy5jb21waWxlci5vdmVycmlkZU1vZHVsZShuZ01vZHVsZSwgb3ZlcnJpZGUpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgb3ZlcnJpZGVDb21wb25lbnQoY29tcG9uZW50OiBUeXBlPGFueT4sIG92ZXJyaWRlOiBNZXRhZGF0YU92ZXJyaWRlPENvbXBvbmVudD4pOiB0aGlzIHtcbiAgICB0aGlzLmFzc2VydE5vdEluc3RhbnRpYXRlZCgnb3ZlcnJpZGVDb21wb25lbnQnLCAnb3ZlcnJpZGUgY29tcG9uZW50IG1ldGFkYXRhJyk7XG4gICAgdGhpcy5jb21waWxlci5vdmVycmlkZUNvbXBvbmVudChjb21wb25lbnQsIG92ZXJyaWRlKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIG92ZXJyaWRlVGVtcGxhdGVVc2luZ1Rlc3RpbmdNb2R1bGUoY29tcG9uZW50OiBUeXBlPGFueT4sIHRlbXBsYXRlOiBzdHJpbmcpOiB0aGlzIHtcbiAgICB0aGlzLmFzc2VydE5vdEluc3RhbnRpYXRlZChcbiAgICAgICdUZXN0QmVkLm92ZXJyaWRlVGVtcGxhdGVVc2luZ1Rlc3RpbmdNb2R1bGUnLFxuICAgICAgJ0Nhbm5vdCBvdmVycmlkZSB0ZW1wbGF0ZSB3aGVuIHRoZSB0ZXN0IG1vZHVsZSBoYXMgYWxyZWFkeSBiZWVuIGluc3RhbnRpYXRlZCcsXG4gICAgKTtcbiAgICB0aGlzLmNvbXBpbGVyLm92ZXJyaWRlVGVtcGxhdGVVc2luZ1Rlc3RpbmdNb2R1bGUoY29tcG9uZW50LCB0ZW1wbGF0ZSk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBvdmVycmlkZURpcmVjdGl2ZShkaXJlY3RpdmU6IFR5cGU8YW55Piwgb3ZlcnJpZGU6IE1ldGFkYXRhT3ZlcnJpZGU8RGlyZWN0aXZlPik6IHRoaXMge1xuICAgIHRoaXMuYXNzZXJ0Tm90SW5zdGFudGlhdGVkKCdvdmVycmlkZURpcmVjdGl2ZScsICdvdmVycmlkZSBkaXJlY3RpdmUgbWV0YWRhdGEnKTtcbiAgICB0aGlzLmNvbXBpbGVyLm92ZXJyaWRlRGlyZWN0aXZlKGRpcmVjdGl2ZSwgb3ZlcnJpZGUpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgb3ZlcnJpZGVQaXBlKHBpcGU6IFR5cGU8YW55Piwgb3ZlcnJpZGU6IE1ldGFkYXRhT3ZlcnJpZGU8UGlwZT4pOiB0aGlzIHtcbiAgICB0aGlzLmFzc2VydE5vdEluc3RhbnRpYXRlZCgnb3ZlcnJpZGVQaXBlJywgJ292ZXJyaWRlIHBpcGUgbWV0YWRhdGEnKTtcbiAgICB0aGlzLmNvbXBpbGVyLm92ZXJyaWRlUGlwZShwaXBlLCBvdmVycmlkZSk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogT3ZlcndyaXRlcyBhbGwgcHJvdmlkZXJzIGZvciB0aGUgZ2l2ZW4gdG9rZW4gd2l0aCB0aGUgZ2l2ZW4gcHJvdmlkZXIgZGVmaW5pdGlvbi5cbiAgICovXG4gIG92ZXJyaWRlUHJvdmlkZXIoXG4gICAgdG9rZW46IGFueSxcbiAgICBwcm92aWRlcjoge3VzZUZhY3Rvcnk/OiBGdW5jdGlvbjsgdXNlVmFsdWU/OiBhbnk7IGRlcHM/OiBhbnlbXX0sXG4gICk6IHRoaXMge1xuICAgIHRoaXMuYXNzZXJ0Tm90SW5zdGFudGlhdGVkKCdvdmVycmlkZVByb3ZpZGVyJywgJ292ZXJyaWRlIHByb3ZpZGVyJyk7XG4gICAgdGhpcy5jb21waWxlci5vdmVycmlkZVByb3ZpZGVyKHRva2VuLCBwcm92aWRlcik7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBvdmVycmlkZVRlbXBsYXRlKGNvbXBvbmVudDogVHlwZTxhbnk+LCB0ZW1wbGF0ZTogc3RyaW5nKTogVGVzdEJlZCB7XG4gICAgcmV0dXJuIHRoaXMub3ZlcnJpZGVDb21wb25lbnQoY29tcG9uZW50LCB7c2V0OiB7dGVtcGxhdGUsIHRlbXBsYXRlVXJsOiBudWxsIX19KTtcbiAgfVxuXG4gIGNyZWF0ZUNvbXBvbmVudDxUPih0eXBlOiBUeXBlPFQ+KTogQ29tcG9uZW50Rml4dHVyZTxUPiB7XG4gICAgY29uc3QgdGVzdENvbXBvbmVudFJlbmRlcmVyID0gdGhpcy5pbmplY3QoVGVzdENvbXBvbmVudFJlbmRlcmVyKTtcbiAgICBjb25zdCByb290RWxJZCA9IGByb290JHtfbmV4dFJvb3RFbGVtZW50SWQrK31gO1xuICAgIHRlc3RDb21wb25lbnRSZW5kZXJlci5pbnNlcnRSb290RWxlbWVudChyb290RWxJZCk7XG5cbiAgICBpZiAoZ2V0QXN5bmNDbGFzc01ldGFkYXRhRm4odHlwZSkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgYENvbXBvbmVudCAnJHt0eXBlLm5hbWV9JyBoYXMgdW5yZXNvbHZlZCBtZXRhZGF0YS4gYCArXG4gICAgICAgICAgYFBsZWFzZSBjYWxsIFxcYGF3YWl0IFRlc3RCZWQuY29tcGlsZUNvbXBvbmVudHMoKVxcYCBiZWZvcmUgcnVubmluZyB0aGlzIHRlc3QuYCxcbiAgICAgICk7XG4gICAgfVxuXG4gICAgY29uc3QgY29tcG9uZW50RGVmID0gKHR5cGUgYXMgYW55KS7JtWNtcDtcblxuICAgIGlmICghY29tcG9uZW50RGVmKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYEl0IGxvb2tzIGxpa2UgJyR7c3RyaW5naWZ5KHR5cGUpfScgaGFzIG5vdCBiZWVuIGNvbXBpbGVkLmApO1xuICAgIH1cblxuICAgIGNvbnN0IGNvbXBvbmVudEZhY3RvcnkgPSBuZXcgQ29tcG9uZW50RmFjdG9yeShjb21wb25lbnREZWYpO1xuICAgIGNvbnN0IGluaXRDb21wb25lbnQgPSAoKSA9PiB7XG4gICAgICBjb25zdCBjb21wb25lbnRSZWYgPSBjb21wb25lbnRGYWN0b3J5LmNyZWF0ZShcbiAgICAgICAgSW5qZWN0b3IuTlVMTCxcbiAgICAgICAgW10sXG4gICAgICAgIGAjJHtyb290RWxJZH1gLFxuICAgICAgICB0aGlzLnRlc3RNb2R1bGVSZWYsXG4gICAgICApIGFzIENvbXBvbmVudFJlZjxUPjtcbiAgICAgIHJldHVybiB0aGlzLnJ1bkluSW5qZWN0aW9uQ29udGV4dCgoKSA9PiB7XG4gICAgICAgIGNvbnN0IGlzWm9uZWxlc3MgPSB0aGlzLmluamVjdChaT05FTEVTU19FTkFCTEVEKTtcbiAgICAgICAgY29uc3QgZml4dHVyZSA9IGlzWm9uZWxlc3NcbiAgICAgICAgICA/IG5ldyBTY2hlZHVsZWRDb21wb25lbnRGaXh0dXJlKGNvbXBvbmVudFJlZilcbiAgICAgICAgICA6IG5ldyBQc2V1ZG9BcHBsaWNhdGlvbkNvbXBvbmVudEZpeHR1cmUoY29tcG9uZW50UmVmKTtcbiAgICAgICAgZml4dHVyZS5pbml0aWFsaXplKCk7XG4gICAgICAgIHJldHVybiBmaXh0dXJlO1xuICAgICAgfSk7XG4gICAgfTtcbiAgICBjb25zdCBub05nWm9uZSA9IHRoaXMuaW5qZWN0KENvbXBvbmVudEZpeHR1cmVOb05nWm9uZSwgZmFsc2UpO1xuICAgIGNvbnN0IG5nWm9uZSA9IG5vTmdab25lID8gbnVsbCA6IHRoaXMuaW5qZWN0KE5nWm9uZSwgbnVsbCk7XG4gICAgY29uc3QgZml4dHVyZSA9IG5nWm9uZSA/IG5nWm9uZS5ydW4oaW5pdENvbXBvbmVudCkgOiBpbml0Q29tcG9uZW50KCk7XG4gICAgdGhpcy5fYWN0aXZlRml4dHVyZXMucHVzaChmaXh0dXJlKTtcbiAgICByZXR1cm4gZml4dHVyZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAaW50ZXJuYWwgc3RyaXAgdGhpcyBmcm9tIHB1Ymxpc2hlZCBkLnRzIGZpbGVzIGR1ZSB0b1xuICAgKiBodHRwczovL2dpdGh1Yi5jb20vbWljcm9zb2Z0L1R5cGVTY3JpcHQvaXNzdWVzLzM2MjE2XG4gICAqL1xuICBwcml2YXRlIGdldCBjb21waWxlcigpOiBUZXN0QmVkQ29tcGlsZXIge1xuICAgIGlmICh0aGlzLl9jb21waWxlciA9PT0gbnVsbCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBOZWVkIHRvIGNhbGwgVGVzdEJlZC5pbml0VGVzdEVudmlyb25tZW50KCkgZmlyc3RgKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuX2NvbXBpbGVyO1xuICB9XG5cbiAgLyoqXG4gICAqIEBpbnRlcm5hbCBzdHJpcCB0aGlzIGZyb20gcHVibGlzaGVkIGQudHMgZmlsZXMgZHVlIHRvXG4gICAqIGh0dHBzOi8vZ2l0aHViLmNvbS9taWNyb3NvZnQvVHlwZVNjcmlwdC9pc3N1ZXMvMzYyMTZcbiAgICovXG4gIHByaXZhdGUgZ2V0IHRlc3RNb2R1bGVSZWYoKTogTmdNb2R1bGVSZWY8YW55PiB7XG4gICAgaWYgKHRoaXMuX3Rlc3RNb2R1bGVSZWYgPT09IG51bGwpIHtcbiAgICAgIHRoaXMuX3Rlc3RNb2R1bGVSZWYgPSB0aGlzLmNvbXBpbGVyLmZpbmFsaXplKCk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLl90ZXN0TW9kdWxlUmVmO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3NlcnROb3RJbnN0YW50aWF0ZWQobWV0aG9kTmFtZTogc3RyaW5nLCBtZXRob2REZXNjcmlwdGlvbjogc3RyaW5nKSB7XG4gICAgaWYgKHRoaXMuX3Rlc3RNb2R1bGVSZWYgIT09IG51bGwpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgYENhbm5vdCAke21ldGhvZERlc2NyaXB0aW9ufSB3aGVuIHRoZSB0ZXN0IG1vZHVsZSBoYXMgYWxyZWFkeSBiZWVuIGluc3RhbnRpYXRlZC4gYCArXG4gICAgICAgICAgYE1ha2Ugc3VyZSB5b3UgYXJlIG5vdCB1c2luZyBcXGBpbmplY3RcXGAgYmVmb3JlIFxcYCR7bWV0aG9kTmFtZX1cXGAuYCxcbiAgICAgICk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrIHdoZXRoZXIgdGhlIG1vZHVsZSBzY29waW5nIHF1ZXVlIHNob3VsZCBiZSBmbHVzaGVkLCBhbmQgZmx1c2ggaXQgaWYgbmVlZGVkLlxuICAgKlxuICAgKiBXaGVuIHRoZSBUZXN0QmVkIGlzIHJlc2V0LCBpdCBjbGVhcnMgdGhlIEpJVCBtb2R1bGUgY29tcGlsYXRpb24gcXVldWUsIGNhbmNlbGxpbmcgYW55XG4gICAqIGluLXByb2dyZXNzIG1vZHVsZSBjb21waWxhdGlvbi4gVGhpcyBjcmVhdGVzIGEgcG90ZW50aWFsIGhhemFyZCAtIHRoZSB2ZXJ5IGZpcnN0IHRpbWUgdGhlXG4gICAqIFRlc3RCZWQgaXMgaW5pdGlhbGl6ZWQgKG9yIGlmIGl0J3MgcmVzZXQgd2l0aG91dCBiZWluZyBpbml0aWFsaXplZCksIHRoZXJlIG1heSBiZSBwZW5kaW5nXG4gICAqIGNvbXBpbGF0aW9ucyBvZiBtb2R1bGVzIGRlY2xhcmVkIGluIGdsb2JhbCBzY29wZS4gVGhlc2UgY29tcGlsYXRpb25zIHNob3VsZCBiZSBmaW5pc2hlZC5cbiAgICpcbiAgICogVG8gZW5zdXJlIHRoYXQgZ2xvYmFsbHkgZGVjbGFyZWQgbW9kdWxlcyBoYXZlIHRoZWlyIGNvbXBvbmVudHMgc2NvcGVkIHByb3Blcmx5LCB0aGlzIGZ1bmN0aW9uXG4gICAqIGlzIGNhbGxlZCB3aGVuZXZlciBUZXN0QmVkIGlzIGluaXRpYWxpemVkIG9yIHJlc2V0LiBUaGUgX2ZpcnN0XyB0aW1lIHRoYXQgdGhpcyBoYXBwZW5zLCBwcmlvclxuICAgKiB0byBhbnkgb3RoZXIgb3BlcmF0aW9ucywgdGhlIHNjb3BpbmcgcXVldWUgaXMgZmx1c2hlZC5cbiAgICovXG4gIHByaXZhdGUgY2hlY2tHbG9iYWxDb21waWxhdGlvbkZpbmlzaGVkKCk6IHZvaWQge1xuICAgIC8vIENoZWNraW5nIF90ZXN0TmdNb2R1bGVSZWYgaXMgbnVsbCBzaG91bGQgbm90IGJlIG5lY2Vzc2FyeSwgYnV0IGlzIGxlZnQgaW4gYXMgYW4gYWRkaXRpb25hbFxuICAgIC8vIGd1YXJkIHRoYXQgY29tcGlsYXRpb25zIHF1ZXVlZCBpbiB0ZXN0cyAoYWZ0ZXIgaW5zdGFudGlhdGlvbikgYXJlIG5ldmVyIGZsdXNoZWQgYWNjaWRlbnRhbGx5LlxuICAgIGlmICghdGhpcy5nbG9iYWxDb21waWxhdGlvbkNoZWNrZWQgJiYgdGhpcy5fdGVzdE1vZHVsZVJlZiA9PT0gbnVsbCkge1xuICAgICAgZmx1c2hNb2R1bGVTY29waW5nUXVldWVBc011Y2hBc1Bvc3NpYmxlKCk7XG4gICAgfVxuICAgIHRoaXMuZ2xvYmFsQ29tcGlsYXRpb25DaGVja2VkID0gdHJ1ZTtcbiAgfVxuXG4gIHByaXZhdGUgZGVzdHJveUFjdGl2ZUZpeHR1cmVzKCk6IHZvaWQge1xuICAgIGxldCBlcnJvckNvdW50ID0gMDtcbiAgICB0aGlzLl9hY3RpdmVGaXh0dXJlcy5mb3JFYWNoKChmaXh0dXJlKSA9PiB7XG4gICAgICB0cnkge1xuICAgICAgICBmaXh0dXJlLmRlc3Ryb3koKTtcbiAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgZXJyb3JDb3VudCsrO1xuICAgICAgICBjb25zb2xlLmVycm9yKCdFcnJvciBkdXJpbmcgY2xlYW51cCBvZiBjb21wb25lbnQnLCB7XG4gICAgICAgICAgY29tcG9uZW50OiBmaXh0dXJlLmNvbXBvbmVudEluc3RhbmNlLFxuICAgICAgICAgIHN0YWNrdHJhY2U6IGUsXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHRoaXMuX2FjdGl2ZUZpeHR1cmVzID0gW107XG5cbiAgICBpZiAoZXJyb3JDb3VudCA+IDAgJiYgdGhpcy5zaG91bGRSZXRocm93VGVhcmRvd25FcnJvcnMoKSkge1xuICAgICAgdGhyb3cgRXJyb3IoXG4gICAgICAgIGAke2Vycm9yQ291bnR9ICR7ZXJyb3JDb3VudCA9PT0gMSA/ICdjb21wb25lbnQnIDogJ2NvbXBvbmVudHMnfSBgICtcbiAgICAgICAgICBgdGhyZXcgZXJyb3JzIGR1cmluZyBjbGVhbnVwYCxcbiAgICAgICk7XG4gICAgfVxuICB9XG5cbiAgc2hvdWxkUmV0aHJvd1RlYXJkb3duRXJyb3JzKCk6IGJvb2xlYW4ge1xuICAgIGNvbnN0IGluc3RhbmNlT3B0aW9ucyA9IHRoaXMuX2luc3RhbmNlVGVhcmRvd25PcHRpb25zO1xuICAgIGNvbnN0IGVudmlyb25tZW50T3B0aW9ucyA9IFRlc3RCZWRJbXBsLl9lbnZpcm9ubWVudFRlYXJkb3duT3B0aW9ucztcblxuICAgIC8vIElmIHRoZSBuZXcgdGVhcmRvd24gYmVoYXZpb3IgaGFzbid0IGJlZW4gY29uZmlndXJlZCwgcHJlc2VydmUgdGhlIG9sZCBiZWhhdmlvci5cbiAgICBpZiAoIWluc3RhbmNlT3B0aW9ucyAmJiAhZW52aXJvbm1lbnRPcHRpb25zKSB7XG4gICAgICByZXR1cm4gVEVBUkRPV05fVEVTVElOR19NT0RVTEVfT05fREVTVFJPWV9ERUZBVUxUO1xuICAgIH1cblxuICAgIC8vIE90aGVyd2lzZSB1c2UgdGhlIGNvbmZpZ3VyZWQgYmVoYXZpb3Igb3IgZGVmYXVsdCB0byByZXRocm93aW5nLlxuICAgIHJldHVybiAoXG4gICAgICBpbnN0YW5jZU9wdGlvbnM/LnJldGhyb3dFcnJvcnMgPz9cbiAgICAgIGVudmlyb25tZW50T3B0aW9ucz8ucmV0aHJvd0Vycm9ycyA/P1xuICAgICAgdGhpcy5zaG91bGRUZWFyRG93blRlc3RpbmdNb2R1bGUoKVxuICAgICk7XG4gIH1cblxuICBzaG91bGRUaHJvd0Vycm9yT25Vbmtub3duRWxlbWVudHMoKTogYm9vbGVhbiB7XG4gICAgLy8gQ2hlY2sgaWYgYSBjb25maWd1cmF0aW9uIGhhcyBiZWVuIHByb3ZpZGVkIHRvIHRocm93IHdoZW4gYW4gdW5rbm93biBlbGVtZW50IGlzIGZvdW5kXG4gICAgcmV0dXJuIChcbiAgICAgIHRoaXMuX2luc3RhbmNlRXJyb3JPblVua25vd25FbGVtZW50c09wdGlvbiA/P1xuICAgICAgVGVzdEJlZEltcGwuX2Vudmlyb25tZW50RXJyb3JPblVua25vd25FbGVtZW50c09wdGlvbiA/P1xuICAgICAgVEhST1dfT05fVU5LTk9XTl9FTEVNRU5UU19ERUZBVUxUXG4gICAgKTtcbiAgfVxuXG4gIHNob3VsZFRocm93RXJyb3JPblVua25vd25Qcm9wZXJ0aWVzKCk6IGJvb2xlYW4ge1xuICAgIC8vIENoZWNrIGlmIGEgY29uZmlndXJhdGlvbiBoYXMgYmVlbiBwcm92aWRlZCB0byB0aHJvdyB3aGVuIGFuIHVua25vd24gcHJvcGVydHkgaXMgZm91bmRcbiAgICByZXR1cm4gKFxuICAgICAgdGhpcy5faW5zdGFuY2VFcnJvck9uVW5rbm93blByb3BlcnRpZXNPcHRpb24gPz9cbiAgICAgIFRlc3RCZWRJbXBsLl9lbnZpcm9ubWVudEVycm9yT25Vbmtub3duUHJvcGVydGllc09wdGlvbiA/P1xuICAgICAgVEhST1dfT05fVU5LTk9XTl9QUk9QRVJUSUVTX0RFRkFVTFRcbiAgICApO1xuICB9XG5cbiAgc2hvdWxkVGVhckRvd25UZXN0aW5nTW9kdWxlKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiAoXG4gICAgICB0aGlzLl9pbnN0YW5jZVRlYXJkb3duT3B0aW9ucz8uZGVzdHJveUFmdGVyRWFjaCA/P1xuICAgICAgVGVzdEJlZEltcGwuX2Vudmlyb25tZW50VGVhcmRvd25PcHRpb25zPy5kZXN0cm95QWZ0ZXJFYWNoID8/XG4gICAgICBURUFSRE9XTl9URVNUSU5HX01PRFVMRV9PTl9ERVNUUk9ZX0RFRkFVTFRcbiAgICApO1xuICB9XG5cbiAgZ2V0RGVmZXJCbG9ja0JlaGF2aW9yKCk6IERlZmVyQmxvY2tCZWhhdmlvciB7XG4gICAgcmV0dXJuIHRoaXMuX2luc3RhbmNlRGVmZXJCbG9ja0JlaGF2aW9yO1xuICB9XG5cbiAgdGVhckRvd25UZXN0aW5nTW9kdWxlKCkge1xuICAgIC8vIElmIHRoZSBtb2R1bGUgcmVmIGhhcyBhbHJlYWR5IGJlZW4gZGVzdHJveWVkLCB3ZSB3b24ndCBiZSBhYmxlIHRvIGdldCBhIHRlc3QgcmVuZGVyZXIuXG4gICAgaWYgKHRoaXMuX3Rlc3RNb2R1bGVSZWYgPT09IG51bGwpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgLy8gUmVzb2x2ZSB0aGUgcmVuZGVyZXIgYWhlYWQgb2YgdGltZSwgYmVjYXVzZSB3ZSB3YW50IHRvIHJlbW92ZSB0aGUgcm9vdCBlbGVtZW50cyBhcyB0aGUgdmVyeVxuICAgIC8vIGxhc3Qgc3RlcCwgYnV0IHRoZSBpbmplY3RvciB3aWxsIGJlIGRlc3Ryb3llZCBhcyBhIHBhcnQgb2YgdGhlIG1vZHVsZSByZWYgZGVzdHJ1Y3Rpb24uXG4gICAgY29uc3QgdGVzdFJlbmRlcmVyID0gdGhpcy5pbmplY3QoVGVzdENvbXBvbmVudFJlbmRlcmVyKTtcbiAgICB0cnkge1xuICAgICAgdGhpcy5fdGVzdE1vZHVsZVJlZi5kZXN0cm95KCk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgaWYgKHRoaXMuc2hvdWxkUmV0aHJvd1RlYXJkb3duRXJyb3JzKCkpIHtcbiAgICAgICAgdGhyb3cgZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIGR1cmluZyBjbGVhbnVwIG9mIGEgdGVzdGluZyBtb2R1bGUnLCB7XG4gICAgICAgICAgY29tcG9uZW50OiB0aGlzLl90ZXN0TW9kdWxlUmVmLmluc3RhbmNlLFxuICAgICAgICAgIHN0YWNrdHJhY2U6IGUsXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0gZmluYWxseSB7XG4gICAgICB0ZXN0UmVuZGVyZXIucmVtb3ZlQWxsUm9vdEVsZW1lbnRzPy4oKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogRXhlY3V0ZSBhbnkgcGVuZGluZyBlZmZlY3RzLlxuICAgKlxuICAgKiBAZGV2ZWxvcGVyUHJldmlld1xuICAgKi9cbiAgZmx1c2hFZmZlY3RzKCk6IHZvaWQge1xuICAgIHRoaXMuaW5qZWN0KEVmZmVjdFNjaGVkdWxlcikuZmx1c2goKTtcbiAgfVxufVxuXG4vKipcbiAqIEBkZXNjcmlwdGlvblxuICogQ29uZmlndXJlcyBhbmQgaW5pdGlhbGl6ZXMgZW52aXJvbm1lbnQgZm9yIHVuaXQgdGVzdGluZyBhbmQgcHJvdmlkZXMgbWV0aG9kcyBmb3JcbiAqIGNyZWF0aW5nIGNvbXBvbmVudHMgYW5kIHNlcnZpY2VzIGluIHVuaXQgdGVzdHMuXG4gKlxuICogYFRlc3RCZWRgIGlzIHRoZSBwcmltYXJ5IGFwaSBmb3Igd3JpdGluZyB1bml0IHRlc3RzIGZvciBBbmd1bGFyIGFwcGxpY2F0aW9ucyBhbmQgbGlicmFyaWVzLlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGNvbnN0IFRlc3RCZWQ6IFRlc3RCZWRTdGF0aWMgPSBUZXN0QmVkSW1wbDtcblxuLyoqXG4gKiBBbGxvd3MgaW5qZWN0aW5nIGRlcGVuZGVuY2llcyBpbiBgYmVmb3JlRWFjaCgpYCBhbmQgYGl0KClgLiBOb3RlOiB0aGlzIGZ1bmN0aW9uXG4gKiAoaW1wb3J0ZWQgZnJvbSB0aGUgYEBhbmd1bGFyL2NvcmUvdGVzdGluZ2AgcGFja2FnZSkgY2FuICoqb25seSoqIGJlIHVzZWQgdG8gaW5qZWN0IGRlcGVuZGVuY2llc1xuICogaW4gdGVzdHMuIFRvIGluamVjdCBkZXBlbmRlbmNpZXMgaW4geW91ciBhcHBsaWNhdGlvbiBjb2RlLCB1c2UgdGhlIFtgaW5qZWN0YF0oYXBpL2NvcmUvaW5qZWN0KVxuICogZnVuY3Rpb24gZnJvbSB0aGUgYEBhbmd1bGFyL2NvcmVgIHBhY2thZ2UgaW5zdGVhZC5cbiAqXG4gKiBFeGFtcGxlOlxuICpcbiAqIGBgYFxuICogYmVmb3JlRWFjaChpbmplY3QoW0RlcGVuZGVuY3ksIEFDbGFzc10sIChkZXAsIG9iamVjdCkgPT4ge1xuICogICAvLyBzb21lIGNvZGUgdGhhdCB1c2VzIGBkZXBgIGFuZCBgb2JqZWN0YFxuICogICAvLyAuLi5cbiAqIH0pKTtcbiAqXG4gKiBpdCgnLi4uJywgaW5qZWN0KFtBQ2xhc3NdLCAob2JqZWN0KSA9PiB7XG4gKiAgIG9iamVjdC5kb1NvbWV0aGluZygpO1xuICogICBleHBlY3QoLi4uKTtcbiAqIH0pXG4gKiBgYGBcbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbmplY3QodG9rZW5zOiBhbnlbXSwgZm46IEZ1bmN0aW9uKTogKCkgPT4gYW55IHtcbiAgY29uc3QgdGVzdEJlZCA9IFRlc3RCZWRJbXBsLklOU1RBTkNFO1xuICAvLyBOb3QgdXNpbmcgYW4gYXJyb3cgZnVuY3Rpb24gdG8gcHJlc2VydmUgY29udGV4dCBwYXNzZWQgZnJvbSBjYWxsIHNpdGVcbiAgcmV0dXJuIGZ1bmN0aW9uICh0aGlzOiB1bmtub3duKSB7XG4gICAgcmV0dXJuIHRlc3RCZWQuZXhlY3V0ZSh0b2tlbnMsIGZuLCB0aGlzKTtcbiAgfTtcbn1cblxuLyoqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBjbGFzcyBJbmplY3RTZXR1cFdyYXBwZXIge1xuICBjb25zdHJ1Y3Rvcihwcml2YXRlIF9tb2R1bGVEZWY6ICgpID0+IFRlc3RNb2R1bGVNZXRhZGF0YSkge31cblxuICBwcml2YXRlIF9hZGRNb2R1bGUoKSB7XG4gICAgY29uc3QgbW9kdWxlRGVmID0gdGhpcy5fbW9kdWxlRGVmKCk7XG4gICAgaWYgKG1vZHVsZURlZikge1xuICAgICAgVGVzdEJlZEltcGwuY29uZmlndXJlVGVzdGluZ01vZHVsZShtb2R1bGVEZWYpO1xuICAgIH1cbiAgfVxuXG4gIGluamVjdCh0b2tlbnM6IGFueVtdLCBmbjogRnVuY3Rpb24pOiAoKSA9PiBhbnkge1xuICAgIGNvbnN0IHNlbGYgPSB0aGlzO1xuICAgIC8vIE5vdCB1c2luZyBhbiBhcnJvdyBmdW5jdGlvbiB0byBwcmVzZXJ2ZSBjb250ZXh0IHBhc3NlZCBmcm9tIGNhbGwgc2l0ZVxuICAgIHJldHVybiBmdW5jdGlvbiAodGhpczogdW5rbm93bikge1xuICAgICAgc2VsZi5fYWRkTW9kdWxlKCk7XG4gICAgICByZXR1cm4gaW5qZWN0KHRva2VucywgZm4pLmNhbGwodGhpcyk7XG4gICAgfTtcbiAgfVxufVxuXG4vKipcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHdpdGhNb2R1bGUobW9kdWxlRGVmOiBUZXN0TW9kdWxlTWV0YWRhdGEpOiBJbmplY3RTZXR1cFdyYXBwZXI7XG5leHBvcnQgZnVuY3Rpb24gd2l0aE1vZHVsZShtb2R1bGVEZWY6IFRlc3RNb2R1bGVNZXRhZGF0YSwgZm46IEZ1bmN0aW9uKTogKCkgPT4gYW55O1xuZXhwb3J0IGZ1bmN0aW9uIHdpdGhNb2R1bGUoXG4gIG1vZHVsZURlZjogVGVzdE1vZHVsZU1ldGFkYXRhLFxuICBmbj86IEZ1bmN0aW9uIHwgbnVsbCxcbik6ICgoKSA9PiBhbnkpIHwgSW5qZWN0U2V0dXBXcmFwcGVyIHtcbiAgaWYgKGZuKSB7XG4gICAgLy8gTm90IHVzaW5nIGFuIGFycm93IGZ1bmN0aW9uIHRvIHByZXNlcnZlIGNvbnRleHQgcGFzc2VkIGZyb20gY2FsbCBzaXRlXG4gICAgcmV0dXJuIGZ1bmN0aW9uICh0aGlzOiB1bmtub3duKSB7XG4gICAgICBjb25zdCB0ZXN0QmVkID0gVGVzdEJlZEltcGwuSU5TVEFOQ0U7XG4gICAgICBpZiAobW9kdWxlRGVmKSB7XG4gICAgICAgIHRlc3RCZWQuY29uZmlndXJlVGVzdGluZ01vZHVsZShtb2R1bGVEZWYpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGZuLmFwcGx5KHRoaXMpO1xuICAgIH07XG4gIH1cbiAgcmV0dXJuIG5ldyBJbmplY3RTZXR1cFdyYXBwZXIoKCkgPT4gbW9kdWxlRGVmKTtcbn1cbiJdfQ==