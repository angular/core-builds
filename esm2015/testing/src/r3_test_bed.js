/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
// The formatter and CI disagree on how this import statement should be formatted. Both try to keep
// it on one line, too, which has gotten very hard to read & manage. So disable the formatter for
// this statement only.
// clang-format off
import { InjectFlags, Injector, NgZone, ɵRender3ComponentFactory as ComponentFactory, ɵflushModuleScopingQueueAsMuchAsPossible as flushModuleScopingQueueAsMuchAsPossible, ɵresetCompiledComponents as resetCompiledComponents, ɵstringify as stringify, } from '@angular/core';
// clang-format on
import { ComponentFixture } from './component_fixture';
import { ComponentFixtureAutoDetect, ComponentFixtureNoNgZone, TestComponentRenderer } from './test_bed_common';
import { R3TestBedCompiler } from './r3_test_bed_compiler';
/** @type {?} */
let _nextRootElementId = 0;
/** @type {?} */
const UNDEFINED = Symbol('UNDEFINED');
/**
 * \@description
 * Configures and initializes environment for unit testing and provides methods for
 * creating components and services in unit tests.
 *
 * TestBed is the primary api for writing unit tests for Angular applications and libraries.
 *
 * Note: Use `TestBed` in tests. It will be set to either `TestBedViewEngine` or `TestBedRender3`
 * according to the compiler used.
 */
export class TestBedRender3 {
    constructor() {
        // Properties
        this.platform = (/** @type {?} */ (null));
        this.ngModule = (/** @type {?} */ (null));
        this._compiler = null;
        this._testModuleRef = null;
        this._activeFixtures = [];
        this._globalCompilationChecked = false;
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
     * \@publicApi
     * @param {?} ngModule
     * @param {?} platform
     * @param {?=} aotSummaries
     * @return {?}
     */
    static initTestEnvironment(ngModule, platform, aotSummaries) {
        /** @type {?} */
        const testBed = _getTestBedRender3();
        testBed.initTestEnvironment(ngModule, platform, aotSummaries);
        return testBed;
    }
    /**
     * Reset the providers for the test injector.
     *
     * \@publicApi
     * @return {?}
     */
    static resetTestEnvironment() { _getTestBedRender3().resetTestEnvironment(); }
    /**
     * @param {?} config
     * @return {?}
     */
    static configureCompiler(config) {
        _getTestBedRender3().configureCompiler(config);
        return (/** @type {?} */ ((/** @type {?} */ (TestBedRender3))));
    }
    /**
     * Allows overriding default providers, directives, pipes, modules of the test injector,
     * which are defined in test_injector.js
     * @param {?} moduleDef
     * @return {?}
     */
    static configureTestingModule(moduleDef) {
        _getTestBedRender3().configureTestingModule(moduleDef);
        return (/** @type {?} */ ((/** @type {?} */ (TestBedRender3))));
    }
    /**
     * Compile components with a `templateUrl` for the test's NgModule.
     * It is necessary to call this function
     * as fetching urls is asynchronous.
     * @return {?}
     */
    static compileComponents() { return _getTestBedRender3().compileComponents(); }
    /**
     * @param {?} ngModule
     * @param {?} override
     * @return {?}
     */
    static overrideModule(ngModule, override) {
        _getTestBedRender3().overrideModule(ngModule, override);
        return (/** @type {?} */ ((/** @type {?} */ (TestBedRender3))));
    }
    /**
     * @param {?} component
     * @param {?} override
     * @return {?}
     */
    static overrideComponent(component, override) {
        _getTestBedRender3().overrideComponent(component, override);
        return (/** @type {?} */ ((/** @type {?} */ (TestBedRender3))));
    }
    /**
     * @param {?} directive
     * @param {?} override
     * @return {?}
     */
    static overrideDirective(directive, override) {
        _getTestBedRender3().overrideDirective(directive, override);
        return (/** @type {?} */ ((/** @type {?} */ (TestBedRender3))));
    }
    /**
     * @param {?} pipe
     * @param {?} override
     * @return {?}
     */
    static overridePipe(pipe, override) {
        _getTestBedRender3().overridePipe(pipe, override);
        return (/** @type {?} */ ((/** @type {?} */ (TestBedRender3))));
    }
    /**
     * @param {?} component
     * @param {?} template
     * @return {?}
     */
    static overrideTemplate(component, template) {
        _getTestBedRender3().overrideComponent(component, { set: { template, templateUrl: (/** @type {?} */ (null)) } });
        return (/** @type {?} */ ((/** @type {?} */ (TestBedRender3))));
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
        _getTestBedRender3().overrideTemplateUsingTestingModule(component, template);
        return (/** @type {?} */ ((/** @type {?} */ (TestBedRender3))));
    }
    /**
     * @param {?} token
     * @param {?} provider
     * @return {?}
     */
    static overrideProvider(token, provider) {
        _getTestBedRender3().overrideProvider(token, provider);
        return (/** @type {?} */ ((/** @type {?} */ (TestBedRender3))));
    }
    /**
     * @template T
     * @param {?} token
     * @param {?=} notFoundValue
     * @param {?=} flags
     * @return {?}
     */
    static inject(token, notFoundValue, flags) {
        return _getTestBedRender3().inject(token, notFoundValue, flags);
    }
    /**
     * @deprecated from v9.0.0 use TestBed.inject
     * @param {?} token
     * @param {?=} notFoundValue
     * @param {?=} flags
     * @return {?}
     */
    static get(token, notFoundValue = Injector.THROW_IF_NOT_FOUND, flags = InjectFlags.Default) {
        return _getTestBedRender3().inject(token, notFoundValue, flags);
    }
    /**
     * @template T
     * @param {?} component
     * @return {?}
     */
    static createComponent(component) {
        return _getTestBedRender3().createComponent(component);
    }
    /**
     * @return {?}
     */
    static resetTestingModule() {
        _getTestBedRender3().resetTestingModule();
        return (/** @type {?} */ ((/** @type {?} */ (TestBedRender3))));
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
     * \@publicApi
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
        this._compiler = new R3TestBedCompiler(this.platform, this.ngModule);
    }
    /**
     * Reset the providers for the test injector.
     *
     * \@publicApi
     * @return {?}
     */
    resetTestEnvironment() {
        this.resetTestingModule();
        this._compiler = null;
        this.platform = (/** @type {?} */ (null));
        this.ngModule = (/** @type {?} */ (null));
    }
    /**
     * @return {?}
     */
    resetTestingModule() {
        this.checkGlobalCompilationFinished();
        resetCompiledComponents();
        if (this._compiler !== null) {
            this.compiler.restoreOriginalState();
        }
        this._compiler = new R3TestBedCompiler(this.platform, this.ngModule);
        this._testModuleRef = null;
        this.destroyActiveFixtures();
    }
    /**
     * @param {?} config
     * @return {?}
     */
    configureCompiler(config) {
        if (config.useJit != null) {
            throw new Error('the Render3 compiler JiT mode is not configurable !');
        }
        if (config.providers !== undefined) {
            this.compiler.setCompilerProviders(config.providers);
        }
    }
    /**
     * @param {?} moduleDef
     * @return {?}
     */
    configureTestingModule(moduleDef) {
        this.assertNotInstantiated('R3TestBed.configureTestingModule', 'configure the test module');
        this.compiler.configureTestingModule(moduleDef);
    }
    /**
     * @return {?}
     */
    compileComponents() { return this.compiler.compileComponents(); }
    /**
     * @template T
     * @param {?} token
     * @param {?=} notFoundValue
     * @param {?=} flags
     * @return {?}
     */
    inject(token, notFoundValue, flags) {
        if ((/** @type {?} */ (token)) === TestBedRender3) {
            return (/** @type {?} */ (this));
        }
        /** @type {?} */
        const result = this.testModuleRef.injector.get(token, (/** @type {?} */ (UNDEFINED)), flags);
        return result === UNDEFINED ? (/** @type {?} */ (this.compiler.injector.get(token, notFoundValue, flags))) :
            result;
    }
    /**
     * @deprecated from v9.0.0 use TestBed.inject
     * @param {?} token
     * @param {?=} notFoundValue
     * @param {?=} flags
     * @return {?}
     */
    get(token, notFoundValue = Injector.THROW_IF_NOT_FOUND, flags = InjectFlags.Default) {
        return this.inject(token, notFoundValue, flags);
    }
    /**
     * @param {?} tokens
     * @param {?} fn
     * @param {?=} context
     * @return {?}
     */
    execute(tokens, fn, context) {
        /** @type {?} */
        const params = tokens.map((/**
         * @param {?} t
         * @return {?}
         */
        t => this.inject(t)));
        return fn.apply(context, params);
    }
    /**
     * @param {?} ngModule
     * @param {?} override
     * @return {?}
     */
    overrideModule(ngModule, override) {
        this.assertNotInstantiated('overrideModule', 'override module metadata');
        this.compiler.overrideModule(ngModule, override);
    }
    /**
     * @param {?} component
     * @param {?} override
     * @return {?}
     */
    overrideComponent(component, override) {
        this.assertNotInstantiated('overrideComponent', 'override component metadata');
        this.compiler.overrideComponent(component, override);
    }
    /**
     * @param {?} component
     * @param {?} template
     * @return {?}
     */
    overrideTemplateUsingTestingModule(component, template) {
        this.assertNotInstantiated('R3TestBed.overrideTemplateUsingTestingModule', 'Cannot override template when the test module has already been instantiated');
        this.compiler.overrideTemplateUsingTestingModule(component, template);
    }
    /**
     * @param {?} directive
     * @param {?} override
     * @return {?}
     */
    overrideDirective(directive, override) {
        this.assertNotInstantiated('overrideDirective', 'override directive metadata');
        this.compiler.overrideDirective(directive, override);
    }
    /**
     * @param {?} pipe
     * @param {?} override
     * @return {?}
     */
    overridePipe(pipe, override) {
        this.assertNotInstantiated('overridePipe', 'override pipe metadata');
        this.compiler.overridePipe(pipe, override);
    }
    /**
     * Overwrites all providers for the given token with the given provider definition.
     * @param {?} token
     * @param {?} provider
     * @return {?}
     */
    overrideProvider(token, provider) {
        this.compiler.overrideProvider(token, provider);
    }
    /**
     * @template T
     * @param {?} type
     * @return {?}
     */
    createComponent(type) {
        /** @type {?} */
        const testComponentRenderer = this.inject(TestComponentRenderer);
        /** @type {?} */
        const rootElId = `root-ng-internal-isolated-${_nextRootElementId++}`;
        testComponentRenderer.insertRootElement(rootElId);
        /** @nocollapse @type {?} */
        const componentDef = ((/** @type {?} */ (type))).ngComponentDef;
        if (!componentDef) {
            throw new Error(`It looks like '${stringify(type)}' has not been IVY compiled - it has no 'ngComponentDef' field`);
        }
        // TODO: Don't cast as `InjectionToken<boolean>`, proper type is boolean[]
        /** @type {?} */
        const noNgZone = this.inject((/** @type {?} */ (ComponentFixtureNoNgZone)), false);
        // TODO: Don't cast as `InjectionToken<boolean>`, proper type is boolean[]
        /** @type {?} */
        const autoDetect = this.inject((/** @type {?} */ (ComponentFixtureAutoDetect)), false);
        /** @type {?} */
        const ngZone = noNgZone ? null : this.inject(NgZone, null);
        /** @type {?} */
        const componentFactory = new ComponentFactory(componentDef);
        /** @type {?} */
        const initComponent = (/**
         * @return {?}
         */
        () => {
            /** @type {?} */
            const componentRef = componentFactory.create(Injector.NULL, [], `#${rootElId}`, this.testModuleRef);
            return new ComponentFixture(componentRef, ngZone, autoDetect);
        });
        /** @type {?} */
        const fixture = ngZone ? ngZone.run(initComponent) : initComponent();
        this._activeFixtures.push(fixture);
        return fixture;
    }
    /**
     * @private
     * @return {?}
     */
    get compiler() {
        if (this._compiler === null) {
            throw new Error(`Need to call TestBed.initTestEnvironment() first`);
        }
        return this._compiler;
    }
    /**
     * @private
     * @return {?}
     */
    get testModuleRef() {
        if (this._testModuleRef === null) {
            this._testModuleRef = this.compiler.finalize();
        }
        return this._testModuleRef;
    }
    /**
     * @private
     * @param {?} methodName
     * @param {?} methodDescription
     * @return {?}
     */
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
     * @private
     * @return {?}
     */
    checkGlobalCompilationFinished() {
        // Checking _testNgModuleRef is null should not be necessary, but is left in as an additional
        // guard that compilations queued in tests (after instantiation) are never flushed accidentally.
        if (!this._globalCompilationChecked && this._testModuleRef === null) {
            flushModuleScopingQueueAsMuchAsPossible();
        }
        this._globalCompilationChecked = true;
    }
    /**
     * @private
     * @return {?}
     */
    destroyActiveFixtures() {
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
}
if (false) {
    /** @type {?} */
    TestBedRender3.prototype.platform;
    /** @type {?} */
    TestBedRender3.prototype.ngModule;
    /**
     * @type {?}
     * @private
     */
    TestBedRender3.prototype._compiler;
    /**
     * @type {?}
     * @private
     */
    TestBedRender3.prototype._testModuleRef;
    /**
     * @type {?}
     * @private
     */
    TestBedRender3.prototype._activeFixtures;
    /**
     * @type {?}
     * @private
     */
    TestBedRender3.prototype._globalCompilationChecked;
}
/** @type {?} */
let testBed;
/**
 * @return {?}
 */
export function _getTestBedRender3() {
    return testBed = testBed || new TestBedRender3();
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicjNfdGVzdF9iZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3Rlc3Rpbmcvc3JjL3IzX3Rlc3RfYmVkLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7OztBQVlBLE9BQU8sRUFJTCxXQUFXLEVBRVgsUUFBUSxFQUVSLE1BQU0sRUFJTix3QkFBd0IsSUFBSSxnQkFBZ0IsRUFFNUMsd0NBQXdDLElBQUksdUNBQXVDLEVBQ25GLHdCQUF3QixJQUFJLHVCQUF1QixFQUNuRCxVQUFVLElBQUksU0FBUyxHQUN4QixNQUFNLGVBQWUsQ0FBQzs7QUFHdkIsT0FBTyxFQUFDLGdCQUFnQixFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFHckQsT0FBTyxFQUFDLDBCQUEwQixFQUFFLHdCQUF3QixFQUFpQixxQkFBcUIsRUFBcUIsTUFBTSxtQkFBbUIsQ0FBQztBQUNqSixPQUFPLEVBQUMsaUJBQWlCLEVBQUMsTUFBTSx3QkFBd0IsQ0FBQzs7SUFHckQsa0JBQWtCLEdBQUcsQ0FBQzs7TUFFcEIsU0FBUyxHQUFXLE1BQU0sQ0FBQyxXQUFXLENBQUM7Ozs7Ozs7Ozs7O0FBWTdDLE1BQU0sT0FBTyxjQUFjO0lBQTNCOztRQXNJRSxhQUFRLEdBQWdCLG1CQUFBLElBQUksRUFBRSxDQUFDO1FBQy9CLGFBQVEsR0FBMEIsbUJBQUEsSUFBSSxFQUFFLENBQUM7UUFFakMsY0FBUyxHQUEyQixJQUFJLENBQUM7UUFDekMsbUJBQWMsR0FBMEIsSUFBSSxDQUFDO1FBRTdDLG9CQUFlLEdBQTRCLEVBQUUsQ0FBQztRQUM5Qyw4QkFBeUIsR0FBRyxLQUFLLENBQUM7SUF3TjVDLENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQXZWQyxNQUFNLENBQUMsbUJBQW1CLENBQ3RCLFFBQStCLEVBQUUsUUFBcUIsRUFBRSxZQUEwQjs7Y0FDOUUsT0FBTyxHQUFHLGtCQUFrQixFQUFFO1FBQ3BDLE9BQU8sQ0FB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cEMsVUFBVSxFQUFFLENBQUM7aUJBQ2QsQ0FBQyxDQUFDO2FBQ0o7UUFDSCxDQUFDLEVBQUMsQ0FBQztRQUNILElBQUksQ0FBQyxlQUFlLEdBQUcsRUFBRSxDQUFDO0lBQzVCLENBQUM7Q0FDRjs7O0lBL05DLGtDQUErQjs7SUFDL0Isa0NBQXlDOzs7OztJQUV6QyxtQ0FBaUQ7Ozs7O0lBQ2pELHdDQUFxRDs7Ozs7SUFFckQseUNBQXNEOzs7OztJQUN0RCxtREFBMEM7OztJQTBOeEMsT0FBdUI7Ozs7QUFFM0IsTUFBTSxVQUFVLGtCQUFrQjtJQUNoQyxPQUFPLE9BQU8sR0FBRyxPQUFPLElBQUksSUFBSSxjQUFjLEVBQUUsQ0FBQztBQUNuRCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG4vLyBUaGUgZm9ybWF0dGVyIGFuZCBDSSBkaXNhZ3JlZSBvbiBob3cgdGhpcyBpbXBvcnQgc3RhdGVtZW50IHNob3VsZCBiZSBmb3JtYXR0ZWQuIEJvdGggdHJ5IHRvIGtlZXBcbi8vIGl0IG9uIG9uZSBsaW5lLCB0b28sIHdoaWNoIGhhcyBnb3R0ZW4gdmVyeSBoYXJkIHRvIHJlYWQgJiBtYW5hZ2UuIFNvIGRpc2FibGUgdGhlIGZvcm1hdHRlciBmb3Jcbi8vIHRoaXMgc3RhdGVtZW50IG9ubHkuXG4vLyBjbGFuZy1mb3JtYXQgb2ZmXG5pbXBvcnQge1xuICBBYnN0cmFjdFR5cGUsXG4gIENvbXBvbmVudCxcbiAgRGlyZWN0aXZlLFxuICBJbmplY3RGbGFncyxcbiAgSW5qZWN0aW9uVG9rZW4sXG4gIEluamVjdG9yLFxuICBOZ01vZHVsZSxcbiAgTmdab25lLFxuICBQaXBlLFxuICBQbGF0Zm9ybVJlZixcbiAgVHlwZSxcbiAgybVSZW5kZXIzQ29tcG9uZW50RmFjdG9yeSBhcyBDb21wb25lbnRGYWN0b3J5LFxuICDJtVJlbmRlcjNOZ01vZHVsZVJlZiBhcyBOZ01vZHVsZVJlZixcbiAgybVmbHVzaE1vZHVsZVNjb3BpbmdRdWV1ZUFzTXVjaEFzUG9zc2libGUgYXMgZmx1c2hNb2R1bGVTY29waW5nUXVldWVBc011Y2hBc1Bvc3NpYmxlLFxuICDJtXJlc2V0Q29tcGlsZWRDb21wb25lbnRzIGFzIHJlc2V0Q29tcGlsZWRDb21wb25lbnRzLFxuICDJtXN0cmluZ2lmeSBhcyBzdHJpbmdpZnksXG59IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuLy8gY2xhbmctZm9ybWF0IG9uXG5cbmltcG9ydCB7Q29tcG9uZW50Rml4dHVyZX0gZnJvbSAnLi9jb21wb25lbnRfZml4dHVyZSc7XG5pbXBvcnQge01ldGFkYXRhT3ZlcnJpZGV9IGZyb20gJy4vbWV0YWRhdGFfb3ZlcnJpZGUnO1xuaW1wb3J0IHtUZXN0QmVkfSBmcm9tICcuL3Rlc3RfYmVkJztcbmltcG9ydCB7Q29tcG9uZW50Rml4dHVyZUF1dG9EZXRlY3QsIENvbXBvbmVudEZpeHR1cmVOb05nWm9uZSwgVGVzdEJlZFN0YXRpYywgVGVzdENvbXBvbmVudFJlbmRlcmVyLCBUZXN0TW9kdWxlTWV0YWRhdGF9IGZyb20gJy4vdGVzdF9iZWRfY29tbW9uJztcbmltcG9ydCB7UjNUZXN0QmVkQ29tcGlsZXJ9IGZyb20gJy4vcjNfdGVzdF9iZWRfY29tcGlsZXInO1xuaW1wb3J0IHtjbGVhclJlZ2lzdGVyZWRNb2R1bGVTdGF0ZX0gZnJvbSAnLi4vLi4vc3JjL2xpbmtlci9uZ19tb2R1bGVfZmFjdG9yeV9yZWdpc3RyYXRpb24nO1xuXG5sZXQgX25leHRSb290RWxlbWVudElkID0gMDtcblxuY29uc3QgVU5ERUZJTkVEOiBTeW1ib2wgPSBTeW1ib2woJ1VOREVGSU5FRCcpO1xuXG4vKipcbiAqIEBkZXNjcmlwdGlvblxuICogQ29uZmlndXJlcyBhbmQgaW5pdGlhbGl6ZXMgZW52aXJvbm1lbnQgZm9yIHVuaXQgdGVzdGluZyBhbmQgcHJvdmlkZXMgbWV0aG9kcyBmb3JcbiAqIGNyZWF0aW5nIGNvbXBvbmVudHMgYW5kIHNlcnZpY2VzIGluIHVuaXQgdGVzdHMuXG4gKlxuICogVGVzdEJlZCBpcyB0aGUgcHJpbWFyeSBhcGkgZm9yIHdyaXRpbmcgdW5pdCB0ZXN0cyBmb3IgQW5ndWxhciBhcHBsaWNhdGlvbnMgYW5kIGxpYnJhcmllcy5cbiAqXG4gKiBOb3RlOiBVc2UgYFRlc3RCZWRgIGluIHRlc3RzLiBJdCB3aWxsIGJlIHNldCB0byBlaXRoZXIgYFRlc3RCZWRWaWV3RW5naW5lYCBvciBgVGVzdEJlZFJlbmRlcjNgXG4gKiBhY2NvcmRpbmcgdG8gdGhlIGNvbXBpbGVyIHVzZWQuXG4gKi9cbmV4cG9ydCBjbGFzcyBUZXN0QmVkUmVuZGVyMyBpbXBsZW1lbnRzIFRlc3RCZWQge1xuICAvKipcbiAgICogSW5pdGlhbGl6ZSB0aGUgZW52aXJvbm1lbnQgZm9yIHRlc3Rpbmcgd2l0aCBhIGNvbXBpbGVyIGZhY3RvcnksIGEgUGxhdGZvcm1SZWYsIGFuZCBhblxuICAgKiBhbmd1bGFyIG1vZHVsZS4gVGhlc2UgYXJlIGNvbW1vbiB0byBldmVyeSB0ZXN0IGluIHRoZSBzdWl0ZS5cbiAgICpcbiAgICogVGhpcyBtYXkgb25seSBiZSBjYWxsZWQgb25jZSwgdG8gc2V0IHVwIHRoZSBjb21tb24gcHJvdmlkZXJzIGZvciB0aGUgY3VycmVudCB0ZXN0XG4gICAqIHN1aXRlIG9uIHRoZSBjdXJyZW50IHBsYXRmb3JtLiBJZiB5b3UgYWJzb2x1dGVseSBuZWVkIHRvIGNoYW5nZSB0aGUgcHJvdmlkZXJzLFxuICAgKiBmaXJzdCB1c2UgYHJlc2V0VGVzdEVudmlyb25tZW50YC5cbiAgICpcbiAgICogVGVzdCBtb2R1bGVzIGFuZCBwbGF0Zm9ybXMgZm9yIGluZGl2aWR1YWwgcGxhdGZvcm1zIGFyZSBhdmFpbGFibGUgZnJvbVxuICAgKiAnQGFuZ3VsYXIvPHBsYXRmb3JtX25hbWU+L3Rlc3RpbmcnLlxuICAgKlxuICAgKiBAcHVibGljQXBpXG4gICAqL1xuICBzdGF0aWMgaW5pdFRlc3RFbnZpcm9ubWVudChcbiAgICAgIG5nTW9kdWxlOiBUeXBlPGFueT58VHlwZTxhbnk+W10sIHBsYXRmb3JtOiBQbGF0Zm9ybVJlZiwgYW90U3VtbWFyaWVzPzogKCkgPT4gYW55W10pOiBUZXN0QmVkIHtcbiAgICBjb25zdCB0ZXN0QmVkID0gX2dldFRlc3RCZWRSZW5kZXIzKCk7XG4gICAgdGVzdEJlZC5pbml0VGVzdEVudmlyb25tZW50KG5nTW9kdWxlLCBwbGF0Zm9ybSwgYW90U3VtbWFyaWVzKTtcbiAgICByZXR1cm4gdGVzdEJlZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXNldCB0aGUgcHJvdmlkZXJzIGZvciB0aGUgdGVzdCBpbmplY3Rvci5cbiAgICpcbiAgICogQHB1YmxpY0FwaVxuICAgKi9cbiAgc3RhdGljIHJlc2V0VGVzdEVudmlyb25tZW50KCk6IHZvaWQgeyBfZ2V0VGVzdEJlZFJlbmRlcjMoKS5yZXNldFRlc3RFbnZpcm9ubWVudCgpOyB9XG5cbiAgc3RhdGljIGNvbmZpZ3VyZUNvbXBpbGVyKGNvbmZpZzoge3Byb3ZpZGVycz86IGFueVtdOyB1c2VKaXQ/OiBib29sZWFuO30pOiBUZXN0QmVkU3RhdGljIHtcbiAgICBfZ2V0VGVzdEJlZFJlbmRlcjMoKS5jb25maWd1cmVDb21waWxlcihjb25maWcpO1xuICAgIHJldHVybiBUZXN0QmVkUmVuZGVyMyBhcyBhbnkgYXMgVGVzdEJlZFN0YXRpYztcbiAgfVxuXG4gIC8qKlxuICAgKiBBbGxvd3Mgb3ZlcnJpZGluZyBkZWZhdWx0IHByb3ZpZGVycywgZGlyZWN0aXZlcywgcGlwZXMsIG1vZHVsZXMgb2YgdGhlIHRlc3QgaW5qZWN0b3IsXG4gICAqIHdoaWNoIGFyZSBkZWZpbmVkIGluIHRlc3RfaW5qZWN0b3IuanNcbiAgICovXG4gIHN0YXRpYyBjb25maWd1cmVUZXN0aW5nTW9kdWxlKG1vZHVsZURlZjogVGVzdE1vZHVsZU1ldGFkYXRhKTogVGVzdEJlZFN0YXRpYyB7XG4gICAgX2dldFRlc3RCZWRSZW5kZXIzKCkuY29uZmlndXJlVGVzdGluZ01vZHVsZShtb2R1bGVEZWYpO1xuICAgIHJldHVybiBUZXN0QmVkUmVuZGVyMyBhcyBhbnkgYXMgVGVzdEJlZFN0YXRpYztcbiAgfVxuXG4gIC8qKlxuICAgKiBDb21waWxlIGNvbXBvbmVudHMgd2l0aCBhIGB0ZW1wbGF0ZVVybGAgZm9yIHRoZSB0ZXN0J3MgTmdNb2R1bGUuXG4gICAqIEl0IGlzIG5lY2Vzc2FyeSB0byBjYWxsIHRoaXMgZnVuY3Rpb25cbiAgICogYXMgZmV0Y2hpbmcgdXJscyBpcyBhc3luY2hyb25vdXMuXG4gICAqL1xuICBzdGF0aWMgY29tcGlsZUNvbXBvbmVudHMoKTogUHJvbWlzZTxhbnk+IHsgcmV0dXJuIF9nZXRUZXN0QmVkUmVuZGVyMygpLmNvbXBpbGVDb21wb25lbnRzKCk7IH1cblxuICBzdGF0aWMgb3ZlcnJpZGVNb2R1bGUobmdNb2R1bGU6IFR5cGU8YW55Piwgb3ZlcnJpZGU6IE1ldGFkYXRhT3ZlcnJpZGU8TmdNb2R1bGU+KTogVGVzdEJlZFN0YXRpYyB7XG4gICAgX2dldFRlc3RCZWRSZW5kZXIzKCkub3ZlcnJpZGVNb2R1bGUobmdNb2R1bGUsIG92ZXJyaWRlKTtcbiAgICByZXR1cm4gVGVzdEJlZFJlbmRlcjMgYXMgYW55IGFzIFRlc3RCZWRTdGF0aWM7XG4gIH1cblxuICBzdGF0aWMgb3ZlcnJpZGVDb21wb25lbnQoY29tcG9uZW50OiBUeXBlPGFueT4sIG92ZXJyaWRlOiBNZXRhZGF0YU92ZXJyaWRlPENvbXBvbmVudD4pOlxuICAgICAgVGVzdEJlZFN0YXRpYyB7XG4gICAgX2dldFRlc3RCZWRSZW5kZXIzKCkub3ZlcnJpZGVDb21wb25lbnQoY29tcG9uZW50LCBvdmVycmlkZSk7XG4gICAgcmV0dXJuIFRlc3RCZWRSZW5kZXIzIGFzIGFueSBhcyBUZXN0QmVkU3RhdGljO1xuICB9XG5cbiAgc3RhdGljIG92ZXJyaWRlRGlyZWN0aXZlKGRpcmVjdGl2ZTogVHlwZTxhbnk+LCBvdmVycmlkZTogTWV0YWRhdGFPdmVycmlkZTxEaXJlY3RpdmU+KTpcbiAgICAgIFRlc3RCZWRTdGF0aWMge1xuICAgIF9nZXRUZXN0QmVkUmVuZGVyMygpLm92ZXJyaWRlRGlyZWN0aXZlKGRpcmVjdGl2ZSwgb3ZlcnJpZGUpO1xuICAgIHJldHVybiBUZXN0QmVkUmVuZGVyMyBhcyBhbnkgYXMgVGVzdEJlZFN0YXRpYztcbiAgfVxuXG4gIHN0YXRpYyBvdmVycmlkZVBpcGUocGlwZTogVHlwZTxhbnk+LCBvdmVycmlkZTogTWV0YWRhdGFPdmVycmlkZTxQaXBlPik6IFRlc3RCZWRTdGF0aWMge1xuICAgIF9nZXRUZXN0QmVkUmVuZGVyMygpLm92ZXJyaWRlUGlwZShwaXBlLCBvdmVycmlkZSk7XG4gICAgcmV0dXJuIFRlc3RCZWRSZW5kZXIzIGFzIGFueSBhcyBUZXN0QmVkU3RhdGljO1xuICB9XG5cbiAgc3RhdGljIG92ZXJyaWRlVGVtcGxhdGUoY29tcG9uZW50OiBUeXBlPGFueT4sIHRlbXBsYXRlOiBzdHJpbmcpOiBUZXN0QmVkU3RhdGljIHtcbiAgICBfZ2V0VGVzdEJlZFJlbmRlcjMoKS5vdmVycmlkZUNvbXBvbmVudChjb21wb25lbnQsIHtzZXQ6IHt0ZW1wbGF0ZSwgdGVtcGxhdGVVcmw6IG51bGwgIX19KTtcbiAgICByZXR1cm4gVGVzdEJlZFJlbmRlcjMgYXMgYW55IGFzIFRlc3RCZWRTdGF0aWM7XG4gIH1cblxuICAvKipcbiAgICogT3ZlcnJpZGVzIHRoZSB0ZW1wbGF0ZSBvZiB0aGUgZ2l2ZW4gY29tcG9uZW50LCBjb21waWxpbmcgdGhlIHRlbXBsYXRlXG4gICAqIGluIHRoZSBjb250ZXh0IG9mIHRoZSBUZXN0aW5nTW9kdWxlLlxuICAgKlxuICAgKiBOb3RlOiBUaGlzIHdvcmtzIGZvciBKSVQgYW5kIEFPVGVkIGNvbXBvbmVudHMgYXMgd2VsbC5cbiAgICovXG4gIHN0YXRpYyBvdmVycmlkZVRlbXBsYXRlVXNpbmdUZXN0aW5nTW9kdWxlKGNvbXBvbmVudDogVHlwZTxhbnk+LCB0ZW1wbGF0ZTogc3RyaW5nKTogVGVzdEJlZFN0YXRpYyB7XG4gICAgX2dldFRlc3RCZWRSZW5kZXIzKCkub3ZlcnJpZGVUZW1wbGF0ZVVzaW5nVGVzdGluZ01vZHVsZShjb21wb25lbnQsIHRlbXBsYXRlKTtcbiAgICByZXR1cm4gVGVzdEJlZFJlbmRlcjMgYXMgYW55IGFzIFRlc3RCZWRTdGF0aWM7XG4gIH1cblxuICBzdGF0aWMgb3ZlcnJpZGVQcm92aWRlcih0b2tlbjogYW55LCBwcm92aWRlcjoge1xuICAgIHVzZUZhY3Rvcnk6IEZ1bmN0aW9uLFxuICAgIGRlcHM6IGFueVtdLFxuICB9KTogVGVzdEJlZFN0YXRpYztcbiAgc3RhdGljIG92ZXJyaWRlUHJvdmlkZXIodG9rZW46IGFueSwgcHJvdmlkZXI6IHt1c2VWYWx1ZTogYW55O30pOiBUZXN0QmVkU3RhdGljO1xuICBzdGF0aWMgb3ZlcnJpZGVQcm92aWRlcih0b2tlbjogYW55LCBwcm92aWRlcjoge1xuICAgIHVzZUZhY3Rvcnk/OiBGdW5jdGlvbixcbiAgICB1c2VWYWx1ZT86IGFueSxcbiAgICBkZXBzPzogYW55W10sXG4gIH0pOiBUZXN0QmVkU3RhdGljIHtcbiAgICBfZ2V0VGVzdEJlZFJlbmRlcjMoKS5vdmVycmlkZVByb3ZpZGVyKHRva2VuLCBwcm92aWRlcik7XG4gICAgcmV0dXJuIFRlc3RCZWRSZW5kZXIzIGFzIGFueSBhcyBUZXN0QmVkU3RhdGljO1xuICB9XG5cbiAgc3RhdGljIGluamVjdDxUPihcbiAgICAgIHRva2VuOiBUeXBlPFQ+fEluamVjdGlvblRva2VuPFQ+fEFic3RyYWN0VHlwZTxUPiwgbm90Rm91bmRWYWx1ZT86IFQsIGZsYWdzPzogSW5qZWN0RmxhZ3MpOiBUO1xuICBzdGF0aWMgaW5qZWN0PFQ+KFxuICAgICAgdG9rZW46IFR5cGU8VD58SW5qZWN0aW9uVG9rZW48VD58QWJzdHJhY3RUeXBlPFQ+LCBub3RGb3VuZFZhbHVlOiBudWxsLCBmbGFncz86IEluamVjdEZsYWdzKTogVFxuICAgICAgfG51bGw7XG4gIHN0YXRpYyBpbmplY3Q8VD4oXG4gICAgICB0b2tlbjogVHlwZTxUPnxJbmplY3Rpb25Ub2tlbjxUPnxBYnN0cmFjdFR5cGU8VD4sIG5vdEZvdW5kVmFsdWU/OiBUfG51bGwsXG4gICAgICBmbGFncz86IEluamVjdEZsYWdzKTogVHxudWxsIHtcbiAgICByZXR1cm4gX2dldFRlc3RCZWRSZW5kZXIzKCkuaW5qZWN0KHRva2VuLCBub3RGb3VuZFZhbHVlLCBmbGFncyk7XG4gIH1cblxuICAvKiogQGRlcHJlY2F0ZWQgZnJvbSB2OS4wLjAgdXNlIFRlc3RCZWQuaW5qZWN0ICovXG4gIHN0YXRpYyBnZXQ8VD4odG9rZW46IFR5cGU8VD58SW5qZWN0aW9uVG9rZW48VD4sIG5vdEZvdW5kVmFsdWU/OiBULCBmbGFncz86IEluamVjdEZsYWdzKTogYW55O1xuICAvKiogQGRlcHJlY2F0ZWQgZnJvbSB2OS4wLjAgdXNlIFRlc3RCZWQuaW5qZWN0ICovXG4gIHN0YXRpYyBnZXQodG9rZW46IGFueSwgbm90Rm91bmRWYWx1ZT86IGFueSk6IGFueTtcbiAgLyoqIEBkZXByZWNhdGVkIGZyb20gdjkuMC4wIHVzZSBUZXN0QmVkLmluamVjdCAqL1xuICBzdGF0aWMgZ2V0KFxuICAgICAgdG9rZW46IGFueSwgbm90Rm91bmRWYWx1ZTogYW55ID0gSW5qZWN0b3IuVEhST1dfSUZfTk9UX0ZPVU5ELFxuICAgICAgZmxhZ3M6IEluamVjdEZsYWdzID0gSW5qZWN0RmxhZ3MuRGVmYXVsdCk6IGFueSB7XG4gICAgcmV0dXJuIF9nZXRUZXN0QmVkUmVuZGVyMygpLmluamVjdCh0b2tlbiwgbm90Rm91bmRWYWx1ZSwgZmxhZ3MpO1xuICB9XG5cbiAgc3RhdGljIGNyZWF0ZUNvbXBvbmVudDxUPihjb21wb25lbnQ6IFR5cGU8VD4pOiBDb21wb25lbnRGaXh0dXJlPFQ+IHtcbiAgICByZXR1cm4gX2dldFRlc3RCZWRSZW5kZXIzKCkuY3JlYXRlQ29tcG9uZW50KGNvbXBvbmVudCk7XG4gIH1cblxuICBzdGF0aWMgcmVzZXRUZXN0aW5nTW9kdWxlKCk6IFRlc3RCZWRTdGF0aWMge1xuICAgIF9nZXRUZXN0QmVkUmVuZGVyMygpLnJlc2V0VGVzdGluZ01vZHVsZSgpO1xuICAgIHJldHVybiBUZXN0QmVkUmVuZGVyMyBhcyBhbnkgYXMgVGVzdEJlZFN0YXRpYztcbiAgfVxuXG4gIC8vIFByb3BlcnRpZXNcblxuICBwbGF0Zm9ybTogUGxhdGZvcm1SZWYgPSBudWxsICE7XG4gIG5nTW9kdWxlOiBUeXBlPGFueT58VHlwZTxhbnk+W10gPSBudWxsICE7XG5cbiAgcHJpdmF0ZSBfY29tcGlsZXI6IFIzVGVzdEJlZENvbXBpbGVyfG51bGwgPSBudWxsO1xuICBwcml2YXRlIF90ZXN0TW9kdWxlUmVmOiBOZ01vZHVsZVJlZjxhbnk+fG51bGwgPSBudWxsO1xuXG4gIHByaXZhdGUgX2FjdGl2ZUZpeHR1cmVzOiBDb21wb25lbnRGaXh0dXJlPGFueT5bXSA9IFtdO1xuICBwcml2YXRlIF9nbG9iYWxDb21waWxhdGlvbkNoZWNrZWQgPSBmYWxzZTtcblxuICAvKipcbiAgICogSW5pdGlhbGl6ZSB0aGUgZW52aXJvbm1lbnQgZm9yIHRlc3Rpbmcgd2l0aCBhIGNvbXBpbGVyIGZhY3RvcnksIGEgUGxhdGZvcm1SZWYsIGFuZCBhblxuICAgKiBhbmd1bGFyIG1vZHVsZS4gVGhlc2UgYXJlIGNvbW1vbiB0byBldmVyeSB0ZXN0IGluIHRoZSBzdWl0ZS5cbiAgICpcbiAgICogVGhpcyBtYXkgb25seSBiZSBjYWxsZWQgb25jZSwgdG8gc2V0IHVwIHRoZSBjb21tb24gcHJvdmlkZXJzIGZvciB0aGUgY3VycmVudCB0ZXN0XG4gICAqIHN1aXRlIG9uIHRoZSBjdXJyZW50IHBsYXRmb3JtLiBJZiB5b3UgYWJzb2x1dGVseSBuZWVkIHRvIGNoYW5nZSB0aGUgcHJvdmlkZXJzLFxuICAgKiBmaXJzdCB1c2UgYHJlc2V0VGVzdEVudmlyb25tZW50YC5cbiAgICpcbiAgICogVGVzdCBtb2R1bGVzIGFuZCBwbGF0Zm9ybXMgZm9yIGluZGl2aWR1YWwgcGxhdGZvcm1zIGFyZSBhdmFpbGFibGUgZnJvbVxuICAgKiAnQGFuZ3VsYXIvPHBsYXRmb3JtX25hbWU+L3Rlc3RpbmcnLlxuICAgKlxuICAgKiBAcHVibGljQXBpXG4gICAqL1xuICBpbml0VGVzdEVudmlyb25tZW50KFxuICAgICAgbmdNb2R1bGU6IFR5cGU8YW55PnxUeXBlPGFueT5bXSwgcGxhdGZvcm06IFBsYXRmb3JtUmVmLCBhb3RTdW1tYXJpZXM/OiAoKSA9PiBhbnlbXSk6IHZvaWQge1xuICAgIGlmICh0aGlzLnBsYXRmb3JtIHx8IHRoaXMubmdNb2R1bGUpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignQ2Fubm90IHNldCBiYXNlIHByb3ZpZGVycyBiZWNhdXNlIGl0IGhhcyBhbHJlYWR5IGJlZW4gY2FsbGVkJyk7XG4gICAgfVxuICAgIHRoaXMucGxhdGZvcm0gPSBwbGF0Zm9ybTtcbiAgICB0aGlzLm5nTW9kdWxlID0gbmdNb2R1bGU7XG4gICAgdGhpcy5fY29tcGlsZXIgPSBuZXcgUjNUZXN0QmVkQ29tcGlsZXIodGhpcy5wbGF0Zm9ybSwgdGhpcy5uZ01vZHVsZSk7XG4gIH1cblxuICAvKipcbiAgICogUmVzZXQgdGhlIHByb3ZpZGVycyBmb3IgdGhlIHRlc3QgaW5qZWN0b3IuXG4gICAqXG4gICAqIEBwdWJsaWNBcGlcbiAgICovXG4gIHJlc2V0VGVzdEVudmlyb25tZW50KCk6IHZvaWQge1xuICAgIHRoaXMucmVzZXRUZXN0aW5nTW9kdWxlKCk7XG4gICAgdGhpcy5fY29tcGlsZXIgPSBudWxsO1xuICAgIHRoaXMucGxhdGZvcm0gPSBudWxsICE7XG4gICAgdGhpcy5uZ01vZHVsZSA9IG51bGwgITtcbiAgfVxuXG4gIHJlc2V0VGVzdGluZ01vZHVsZSgpOiB2b2lkIHtcbiAgICB0aGlzLmNoZWNrR2xvYmFsQ29tcGlsYXRpb25GaW5pc2hlZCgpO1xuICAgIHJlc2V0Q29tcGlsZWRDb21wb25lbnRzKCk7XG4gICAgaWYgKHRoaXMuX2NvbXBpbGVyICE9PSBudWxsKSB7XG4gICAgICB0aGlzLmNvbXBpbGVyLnJlc3RvcmVPcmlnaW5hbFN0YXRlKCk7XG4gICAgfVxuICAgIHRoaXMuX2NvbXBpbGVyID0gbmV3IFIzVGVzdEJlZENvbXBpbGVyKHRoaXMucGxhdGZvcm0sIHRoaXMubmdNb2R1bGUpO1xuICAgIHRoaXMuX3Rlc3RNb2R1bGVSZWYgPSBudWxsO1xuICAgIHRoaXMuZGVzdHJveUFjdGl2ZUZpeHR1cmVzKCk7XG4gIH1cblxuICBjb25maWd1cmVDb21waWxlcihjb25maWc6IHtwcm92aWRlcnM/OiBhbnlbXTsgdXNlSml0PzogYm9vbGVhbjt9KTogdm9pZCB7XG4gICAgaWYgKGNvbmZpZy51c2VKaXQgIT0gbnVsbCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCd0aGUgUmVuZGVyMyBjb21waWxlciBKaVQgbW9kZSBpcyBub3QgY29uZmlndXJhYmxlICEnKTtcbiAgICB9XG5cbiAgICBpZiAoY29uZmlnLnByb3ZpZGVycyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzLmNvbXBpbGVyLnNldENvbXBpbGVyUHJvdmlkZXJzKGNvbmZpZy5wcm92aWRlcnMpO1xuICAgIH1cbiAgfVxuXG4gIGNvbmZpZ3VyZVRlc3RpbmdNb2R1bGUobW9kdWxlRGVmOiBUZXN0TW9kdWxlTWV0YWRhdGEpOiB2b2lkIHtcbiAgICB0aGlzLmFzc2VydE5vdEluc3RhbnRpYXRlZCgnUjNUZXN0QmVkLmNvbmZpZ3VyZVRlc3RpbmdNb2R1bGUnLCAnY29uZmlndXJlIHRoZSB0ZXN0IG1vZHVsZScpO1xuICAgIHRoaXMuY29tcGlsZXIuY29uZmlndXJlVGVzdGluZ01vZHVsZShtb2R1bGVEZWYpO1xuICB9XG5cbiAgY29tcGlsZUNvbXBvbmVudHMoKTogUHJvbWlzZTxhbnk+IHsgcmV0dXJuIHRoaXMuY29tcGlsZXIuY29tcGlsZUNvbXBvbmVudHMoKTsgfVxuXG4gIGluamVjdDxUPihcbiAgICAgIHRva2VuOiBUeXBlPFQ+fEluamVjdGlvblRva2VuPFQ+fEFic3RyYWN0VHlwZTxUPiwgbm90Rm91bmRWYWx1ZT86IFQsIGZsYWdzPzogSW5qZWN0RmxhZ3MpOiBUO1xuICBpbmplY3Q8VD4oXG4gICAgICB0b2tlbjogVHlwZTxUPnxJbmplY3Rpb25Ub2tlbjxUPnxBYnN0cmFjdFR5cGU8VD4sIG5vdEZvdW5kVmFsdWU6IG51bGwsIGZsYWdzPzogSW5qZWN0RmxhZ3MpOiBUXG4gICAgICB8bnVsbDtcbiAgaW5qZWN0PFQ+KFxuICAgICAgdG9rZW46IFR5cGU8VD58SW5qZWN0aW9uVG9rZW48VD58QWJzdHJhY3RUeXBlPFQ+LCBub3RGb3VuZFZhbHVlPzogVHxudWxsLFxuICAgICAgZmxhZ3M/OiBJbmplY3RGbGFncyk6IFR8bnVsbCB7XG4gICAgaWYgKHRva2VuIGFzIHVua25vd24gPT09IFRlc3RCZWRSZW5kZXIzKSB7XG4gICAgICByZXR1cm4gdGhpcyBhcyBhbnk7XG4gICAgfVxuICAgIGNvbnN0IHJlc3VsdCA9IHRoaXMudGVzdE1vZHVsZVJlZi5pbmplY3Rvci5nZXQodG9rZW4sIFVOREVGSU5FRCBhc3t9LCBmbGFncyk7XG4gICAgcmV0dXJuIHJlc3VsdCA9PT0gVU5ERUZJTkVEID8gdGhpcy5jb21waWxlci5pbmplY3Rvci5nZXQodG9rZW4sIG5vdEZvdW5kVmFsdWUsIGZsYWdzKSBhcyBhbnkgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdDtcbiAgfVxuXG4gIC8qKiBAZGVwcmVjYXRlZCBmcm9tIHY5LjAuMCB1c2UgVGVzdEJlZC5pbmplY3QgKi9cbiAgZ2V0PFQ+KHRva2VuOiBUeXBlPFQ+fEluamVjdGlvblRva2VuPFQ+LCBub3RGb3VuZFZhbHVlPzogVCwgZmxhZ3M/OiBJbmplY3RGbGFncyk6IGFueTtcbiAgLyoqIEBkZXByZWNhdGVkIGZyb20gdjkuMC4wIHVzZSBUZXN0QmVkLmluamVjdCAqL1xuICBnZXQodG9rZW46IGFueSwgbm90Rm91bmRWYWx1ZT86IGFueSk6IGFueTtcbiAgLyoqIEBkZXByZWNhdGVkIGZyb20gdjkuMC4wIHVzZSBUZXN0QmVkLmluamVjdCAqL1xuICBnZXQodG9rZW46IGFueSwgbm90Rm91bmRWYWx1ZTogYW55ID0gSW5qZWN0b3IuVEhST1dfSUZfTk9UX0ZPVU5ELFxuICAgICAgZmxhZ3M6IEluamVjdEZsYWdzID0gSW5qZWN0RmxhZ3MuRGVmYXVsdCk6IGFueSB7XG4gICAgcmV0dXJuIHRoaXMuaW5qZWN0KHRva2VuLCBub3RGb3VuZFZhbHVlLCBmbGFncyk7XG4gIH1cblxuICBleGVjdXRlKHRva2VuczogYW55W10sIGZuOiBGdW5jdGlvbiwgY29udGV4dD86IGFueSk6IGFueSB7XG4gICAgY29uc3QgcGFyYW1zID0gdG9rZW5zLm1hcCh0ID0+IHRoaXMuaW5qZWN0KHQpKTtcbiAgICByZXR1cm4gZm4uYXBwbHkoY29udGV4dCwgcGFyYW1zKTtcbiAgfVxuXG4gIG92ZXJyaWRlTW9kdWxlKG5nTW9kdWxlOiBUeXBlPGFueT4sIG92ZXJyaWRlOiBNZXRhZGF0YU92ZXJyaWRlPE5nTW9kdWxlPik6IHZvaWQge1xuICAgIHRoaXMuYXNzZXJ0Tm90SW5zdGFudGlhdGVkKCdvdmVycmlkZU1vZHVsZScsICdvdmVycmlkZSBtb2R1bGUgbWV0YWRhdGEnKTtcbiAgICB0aGlzLmNvbXBpbGVyLm92ZXJyaWRlTW9kdWxlKG5nTW9kdWxlLCBvdmVycmlkZSk7XG4gIH1cblxuICBvdmVycmlkZUNvbXBvbmVudChjb21wb25lbnQ6IFR5cGU8YW55Piwgb3ZlcnJpZGU6IE1ldGFkYXRhT3ZlcnJpZGU8Q29tcG9uZW50Pik6IHZvaWQge1xuICAgIHRoaXMuYXNzZXJ0Tm90SW5zdGFudGlhdGVkKCdvdmVycmlkZUNvbXBvbmVudCcsICdvdmVycmlkZSBjb21wb25lbnQgbWV0YWRhdGEnKTtcbiAgICB0aGlzLmNvbXBpbGVyLm92ZXJyaWRlQ29tcG9uZW50KGNvbXBvbmVudCwgb3ZlcnJpZGUpO1xuICB9XG5cbiAgb3ZlcnJpZGVUZW1wbGF0ZVVzaW5nVGVzdGluZ01vZHVsZShjb21wb25lbnQ6IFR5cGU8YW55PiwgdGVtcGxhdGU6IHN0cmluZyk6IHZvaWQge1xuICAgIHRoaXMuYXNzZXJ0Tm90SW5zdGFudGlhdGVkKFxuICAgICAgICAnUjNUZXN0QmVkLm92ZXJyaWRlVGVtcGxhdGVVc2luZ1Rlc3RpbmdNb2R1bGUnLFxuICAgICAgICAnQ2Fubm90IG92ZXJyaWRlIHRlbXBsYXRlIHdoZW4gdGhlIHRlc3QgbW9kdWxlIGhhcyBhbHJlYWR5IGJlZW4gaW5zdGFudGlhdGVkJyk7XG4gICAgdGhpcy5jb21waWxlci5vdmVycmlkZVRlbXBsYXRlVXNpbmdUZXN0aW5nTW9kdWxlKGNvbXBvbmVudCwgdGVtcGxhdGUpO1xuICB9XG5cbiAgb3ZlcnJpZGVEaXJlY3RpdmUoZGlyZWN0aXZlOiBUeXBlPGFueT4sIG92ZXJyaWRlOiBNZXRhZGF0YU92ZXJyaWRlPERpcmVjdGl2ZT4pOiB2b2lkIHtcbiAgICB0aGlzLmFzc2VydE5vdEluc3RhbnRpYXRlZCgnb3ZlcnJpZGVEaXJlY3RpdmUnLCAnb3ZlcnJpZGUgZGlyZWN0aXZlIG1ldGFkYXRhJyk7XG4gICAgdGhpcy5jb21waWxlci5vdmVycmlkZURpcmVjdGl2ZShkaXJlY3RpdmUsIG92ZXJyaWRlKTtcbiAgfVxuXG4gIG92ZXJyaWRlUGlwZShwaXBlOiBUeXBlPGFueT4sIG92ZXJyaWRlOiBNZXRhZGF0YU92ZXJyaWRlPFBpcGU+KTogdm9pZCB7XG4gICAgdGhpcy5hc3NlcnROb3RJbnN0YW50aWF0ZWQoJ292ZXJyaWRlUGlwZScsICdvdmVycmlkZSBwaXBlIG1ldGFkYXRhJyk7XG4gICAgdGhpcy5jb21waWxlci5vdmVycmlkZVBpcGUocGlwZSwgb3ZlcnJpZGUpO1xuICB9XG5cbiAgLyoqXG4gICAqIE92ZXJ3cml0ZXMgYWxsIHByb3ZpZGVycyBmb3IgdGhlIGdpdmVuIHRva2VuIHdpdGggdGhlIGdpdmVuIHByb3ZpZGVyIGRlZmluaXRpb24uXG4gICAqL1xuICBvdmVycmlkZVByb3ZpZGVyKHRva2VuOiBhbnksIHByb3ZpZGVyOiB7dXNlRmFjdG9yeT86IEZ1bmN0aW9uLCB1c2VWYWx1ZT86IGFueSwgZGVwcz86IGFueVtdfSk6XG4gICAgICB2b2lkIHtcbiAgICB0aGlzLmNvbXBpbGVyLm92ZXJyaWRlUHJvdmlkZXIodG9rZW4sIHByb3ZpZGVyKTtcbiAgfVxuXG4gIGNyZWF0ZUNvbXBvbmVudDxUPih0eXBlOiBUeXBlPFQ+KTogQ29tcG9uZW50Rml4dHVyZTxUPiB7XG4gICAgY29uc3QgdGVzdENvbXBvbmVudFJlbmRlcmVyID0gdGhpcy5pbmplY3QoVGVzdENvbXBvbmVudFJlbmRlcmVyKTtcbiAgICBjb25zdCByb290RWxJZCA9IGByb290LW5nLWludGVybmFsLWlzb2xhdGVkLSR7X25leHRSb290RWxlbWVudElkKyt9YDtcbiAgICB0ZXN0Q29tcG9uZW50UmVuZGVyZXIuaW5zZXJ0Um9vdEVsZW1lbnQocm9vdEVsSWQpO1xuXG4gICAgY29uc3QgY29tcG9uZW50RGVmID0gKHR5cGUgYXMgYW55KS5uZ0NvbXBvbmVudERlZjtcblxuICAgIGlmICghY29tcG9uZW50RGVmKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgYEl0IGxvb2tzIGxpa2UgJyR7c3RyaW5naWZ5KHR5cGUpfScgaGFzIG5vdCBiZWVuIElWWSBjb21waWxlZCAtIGl0IGhhcyBubyAnbmdDb21wb25lbnREZWYnIGZpZWxkYCk7XG4gICAgfVxuXG4gICAgLy8gVE9ETzogRG9uJ3QgY2FzdCBhcyBgSW5qZWN0aW9uVG9rZW48Ym9vbGVhbj5gLCBwcm9wZXIgdHlwZSBpcyBib29sZWFuW11cbiAgICBjb25zdCBub05nWm9uZSA9IHRoaXMuaW5qZWN0KENvbXBvbmVudEZpeHR1cmVOb05nWm9uZSBhcyBJbmplY3Rpb25Ub2tlbjxib29sZWFuPiwgZmFsc2UpO1xuICAgIC8vIFRPRE86IERvbid0IGNhc3QgYXMgYEluamVjdGlvblRva2VuPGJvb2xlYW4+YCwgcHJvcGVyIHR5cGUgaXMgYm9vbGVhbltdXG4gICAgY29uc3QgYXV0b0RldGVjdDogYm9vbGVhbiA9XG4gICAgICAgIHRoaXMuaW5qZWN0KENvbXBvbmVudEZpeHR1cmVBdXRvRGV0ZWN0IGFzIEluamVjdGlvblRva2VuPGJvb2xlYW4+LCBmYWxzZSk7XG4gICAgY29uc3Qgbmdab25lOiBOZ1pvbmV8bnVsbCA9IG5vTmdab25lID8gbnVsbCA6IHRoaXMuaW5qZWN0KE5nWm9uZSwgbnVsbCk7XG4gICAgY29uc3QgY29tcG9uZW50RmFjdG9yeSA9IG5ldyBDb21wb25lbnRGYWN0b3J5KGNvbXBvbmVudERlZik7XG4gICAgY29uc3QgaW5pdENvbXBvbmVudCA9ICgpID0+IHtcbiAgICAgIGNvbnN0IGNvbXBvbmVudFJlZiA9XG4gICAgICAgICAgY29tcG9uZW50RmFjdG9yeS5jcmVhdGUoSW5qZWN0b3IuTlVMTCwgW10sIGAjJHtyb290RWxJZH1gLCB0aGlzLnRlc3RNb2R1bGVSZWYpO1xuICAgICAgcmV0dXJuIG5ldyBDb21wb25lbnRGaXh0dXJlPGFueT4oY29tcG9uZW50UmVmLCBuZ1pvbmUsIGF1dG9EZXRlY3QpO1xuICAgIH07XG4gICAgY29uc3QgZml4dHVyZSA9IG5nWm9uZSA/IG5nWm9uZS5ydW4oaW5pdENvbXBvbmVudCkgOiBpbml0Q29tcG9uZW50KCk7XG4gICAgdGhpcy5fYWN0aXZlRml4dHVyZXMucHVzaChmaXh0dXJlKTtcbiAgICByZXR1cm4gZml4dHVyZTtcbiAgfVxuXG4gIHByaXZhdGUgZ2V0IGNvbXBpbGVyKCk6IFIzVGVzdEJlZENvbXBpbGVyIHtcbiAgICBpZiAodGhpcy5fY29tcGlsZXIgPT09IG51bGwpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgTmVlZCB0byBjYWxsIFRlc3RCZWQuaW5pdFRlc3RFbnZpcm9ubWVudCgpIGZpcnN0YCk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLl9jb21waWxlcjtcbiAgfVxuXG4gIHByaXZhdGUgZ2V0IHRlc3RNb2R1bGVSZWYoKTogTmdNb2R1bGVSZWY8YW55PiB7XG4gICAgaWYgKHRoaXMuX3Rlc3RNb2R1bGVSZWYgPT09IG51bGwpIHtcbiAgICAgIHRoaXMuX3Rlc3RNb2R1bGVSZWYgPSB0aGlzLmNvbXBpbGVyLmZpbmFsaXplKCk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLl90ZXN0TW9kdWxlUmVmO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3NlcnROb3RJbnN0YW50aWF0ZWQobWV0aG9kTmFtZTogc3RyaW5nLCBtZXRob2REZXNjcmlwdGlvbjogc3RyaW5nKSB7XG4gICAgaWYgKHRoaXMuX3Rlc3RNb2R1bGVSZWYgIT09IG51bGwpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICBgQ2Fubm90ICR7bWV0aG9kRGVzY3JpcHRpb259IHdoZW4gdGhlIHRlc3QgbW9kdWxlIGhhcyBhbHJlYWR5IGJlZW4gaW5zdGFudGlhdGVkLiBgICtcbiAgICAgICAgICBgTWFrZSBzdXJlIHlvdSBhcmUgbm90IHVzaW5nIFxcYGluamVjdFxcYCBiZWZvcmUgXFxgJHttZXRob2ROYW1lfVxcYC5gKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2sgd2hldGhlciB0aGUgbW9kdWxlIHNjb3BpbmcgcXVldWUgc2hvdWxkIGJlIGZsdXNoZWQsIGFuZCBmbHVzaCBpdCBpZiBuZWVkZWQuXG4gICAqXG4gICAqIFdoZW4gdGhlIFRlc3RCZWQgaXMgcmVzZXQsIGl0IGNsZWFycyB0aGUgSklUIG1vZHVsZSBjb21waWxhdGlvbiBxdWV1ZSwgY2FuY2VsbGluZyBhbnlcbiAgICogaW4tcHJvZ3Jlc3MgbW9kdWxlIGNvbXBpbGF0aW9uLiBUaGlzIGNyZWF0ZXMgYSBwb3RlbnRpYWwgaGF6YXJkIC0gdGhlIHZlcnkgZmlyc3QgdGltZSB0aGVcbiAgICogVGVzdEJlZCBpcyBpbml0aWFsaXplZCAob3IgaWYgaXQncyByZXNldCB3aXRob3V0IGJlaW5nIGluaXRpYWxpemVkKSwgdGhlcmUgbWF5IGJlIHBlbmRpbmdcbiAgICogY29tcGlsYXRpb25zIG9mIG1vZHVsZXMgZGVjbGFyZWQgaW4gZ2xvYmFsIHNjb3BlLiBUaGVzZSBjb21waWxhdGlvbnMgc2hvdWxkIGJlIGZpbmlzaGVkLlxuICAgKlxuICAgKiBUbyBlbnN1cmUgdGhhdCBnbG9iYWxseSBkZWNsYXJlZCBtb2R1bGVzIGhhdmUgdGhlaXIgY29tcG9uZW50cyBzY29wZWQgcHJvcGVybHksIHRoaXMgZnVuY3Rpb25cbiAgICogaXMgY2FsbGVkIHdoZW5ldmVyIFRlc3RCZWQgaXMgaW5pdGlhbGl6ZWQgb3IgcmVzZXQuIFRoZSBfZmlyc3RfIHRpbWUgdGhhdCB0aGlzIGhhcHBlbnMsIHByaW9yXG4gICAqIHRvIGFueSBvdGhlciBvcGVyYXRpb25zLCB0aGUgc2NvcGluZyBxdWV1ZSBpcyBmbHVzaGVkLlxuICAgKi9cbiAgcHJpdmF0ZSBjaGVja0dsb2JhbENvbXBpbGF0aW9uRmluaXNoZWQoKTogdm9pZCB7XG4gICAgLy8gQ2hlY2tpbmcgX3Rlc3ROZ01vZHVsZVJlZiBpcyBudWxsIHNob3VsZCBub3QgYmUgbmVjZXNzYXJ5LCBidXQgaXMgbGVmdCBpbiBhcyBhbiBhZGRpdGlvbmFsXG4gICAgLy8gZ3VhcmQgdGhhdCBjb21waWxhdGlvbnMgcXVldWVkIGluIHRlc3RzIChhZnRlciBpbnN0YW50aWF0aW9uKSBhcmUgbmV2ZXIgZmx1c2hlZCBhY2NpZGVudGFsbHkuXG4gICAgaWYgKCF0aGlzLl9nbG9iYWxDb21waWxhdGlvbkNoZWNrZWQgJiYgdGhpcy5fdGVzdE1vZHVsZVJlZiA9PT0gbnVsbCkge1xuICAgICAgZmx1c2hNb2R1bGVTY29waW5nUXVldWVBc011Y2hBc1Bvc3NpYmxlKCk7XG4gICAgfVxuICAgIHRoaXMuX2dsb2JhbENvbXBpbGF0aW9uQ2hlY2tlZCA9IHRydWU7XG4gIH1cblxuICBwcml2YXRlIGRlc3Ryb3lBY3RpdmVGaXh0dXJlcygpOiB2b2lkIHtcbiAgICB0aGlzLl9hY3RpdmVGaXh0dXJlcy5mb3JFYWNoKChmaXh0dXJlKSA9PiB7XG4gICAgICB0cnkge1xuICAgICAgICBmaXh0dXJlLmRlc3Ryb3koKTtcbiAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcignRXJyb3IgZHVyaW5nIGNsZWFudXAgb2YgY29tcG9uZW50Jywge1xuICAgICAgICAgIGNvbXBvbmVudDogZml4dHVyZS5jb21wb25lbnRJbnN0YW5jZSxcbiAgICAgICAgICBzdGFja3RyYWNlOiBlLFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICB0aGlzLl9hY3RpdmVGaXh0dXJlcyA9IFtdO1xuICB9XG59XG5cbmxldCB0ZXN0QmVkOiBUZXN0QmVkUmVuZGVyMztcblxuZXhwb3J0IGZ1bmN0aW9uIF9nZXRUZXN0QmVkUmVuZGVyMygpOiBUZXN0QmVkUmVuZGVyMyB7XG4gIHJldHVybiB0ZXN0QmVkID0gdGVzdEJlZCB8fCBuZXcgVGVzdEJlZFJlbmRlcjMoKTtcbn1cbiJdfQ==