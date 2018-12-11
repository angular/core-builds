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
import { Injector, NgModule, NgZone, ɵRender3ComponentFactory as ComponentFactory, ɵRender3DebugRendererFactory2 as Render3DebugRendererFactory2, ɵRender3NgModuleRef as NgModuleRef, ɵWRAP_RENDERER_FACTORY2 as WRAP_RENDERER_FACTORY2, ɵcompileComponent as compileComponent, ɵcompileDirective as compileDirective, ɵcompileNgModuleDefs as compileNgModuleDefs, ɵcompilePipe as compilePipe, ɵgetInjectableDef as getInjectableDef, ɵpatchComponentDefWithScope as patchComponentDefWithScope, ɵstringify as stringify } from '@angular/core';
import { ComponentFixture } from './component_fixture';
import { ComponentResolver, DirectiveResolver, NgModuleResolver, PipeResolver } from './resolvers';
import { ComponentFixtureAutoDetect, ComponentFixtureNoNgZone, TestComponentRenderer } from './test_bed_common';
/** @type {?} */
let _nextRootElementId = 0;
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
        this.platform = /** @type {?} */ ((null));
        this.ngModule = /** @type {?} */ ((null));
        this._moduleOverrides = [];
        this._componentOverrides = [];
        this._directiveOverrides = [];
        this._pipeOverrides = [];
        this._providerOverrides = [];
        this._rootProviderOverrides = [];
        this._providers = [];
        this._declarations = [];
        this._imports = [];
        this._schemas = [];
        this._activeFixtures = [];
        this._moduleRef = /** @type {?} */ ((null));
        this._instantiated = false;
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
        return /** @type {?} */ ((TestBedRender3));
    }
    /**
     * Allows overriding default providers, directives, pipes, modules of the test injector,
     * which are defined in test_injector.js
     * @param {?} moduleDef
     * @return {?}
     */
    static configureTestingModule(moduleDef) {
        _getTestBedRender3().configureTestingModule(moduleDef);
        return /** @type {?} */ ((TestBedRender3));
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
        return /** @type {?} */ ((TestBedRender3));
    }
    /**
     * @param {?} component
     * @param {?} override
     * @return {?}
     */
    static overrideComponent(component, override) {
        _getTestBedRender3().overrideComponent(component, override);
        return /** @type {?} */ ((TestBedRender3));
    }
    /**
     * @param {?} directive
     * @param {?} override
     * @return {?}
     */
    static overrideDirective(directive, override) {
        _getTestBedRender3().overrideDirective(directive, override);
        return /** @type {?} */ ((TestBedRender3));
    }
    /**
     * @param {?} pipe
     * @param {?} override
     * @return {?}
     */
    static overridePipe(pipe, override) {
        _getTestBedRender3().overridePipe(pipe, override);
        return /** @type {?} */ ((TestBedRender3));
    }
    /**
     * @param {?} component
     * @param {?} template
     * @return {?}
     */
    static overrideTemplate(component, template) {
        _getTestBedRender3().overrideComponent(component, { set: { template, templateUrl: /** @type {?} */ ((null)) } });
        return /** @type {?} */ ((TestBedRender3));
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
        return /** @type {?} */ ((TestBedRender3));
    }
    /**
     * @param {?} component
     * @param {?} template
     * @return {?}
     */
    overrideTemplateUsingTestingModule(component, template) {
        throw new Error('Render3TestBed.overrideTemplateUsingTestingModule is not implemented yet');
    }
    /**
     * @param {?} token
     * @param {?} provider
     * @return {?}
     */
    static overrideProvider(token, provider) {
        _getTestBedRender3().overrideProvider(token, provider);
        return /** @type {?} */ ((TestBedRender3));
    }
    /**
     * @param {?} token
     * @param {?} provider
     * @return {?}
     */
    static deprecatedOverrideProvider(token, provider) {
        throw new Error('Render3TestBed.deprecatedOverrideProvider is not implemented');
    }
    /**
     * @param {?} token
     * @param {?=} notFoundValue
     * @return {?}
     */
    static get(token, notFoundValue = Injector.THROW_IF_NOT_FOUND) {
        return _getTestBedRender3().get(token, notFoundValue);
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
        return /** @type {?} */ ((TestBedRender3));
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
    }
    /**
     * Reset the providers for the test injector.
     *
     * \@publicApi
     * @return {?}
     */
    resetTestEnvironment() {
        this.resetTestingModule();
        this.platform = /** @type {?} */ ((null));
        this.ngModule = /** @type {?} */ ((null));
    }
    /**
     * @return {?}
     */
    resetTestingModule() {
        // reset metadata overrides
        this._moduleOverrides = [];
        this._componentOverrides = [];
        this._directiveOverrides = [];
        this._pipeOverrides = [];
        this._providerOverrides = [];
        this._rootProviderOverrides = [];
        // reset test module config
        this._providers = [];
        this._declarations = [];
        this._imports = [];
        this._schemas = [];
        this._moduleRef = /** @type {?} */ ((null));
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
        if (config.useJit != null) {
            throw new Error('the Render3 compiler JiT mode is not configurable !');
        }
        if (config.providers) {
            this._providerOverrides.push(...config.providers);
        }
    }
    /**
     * @param {?} moduleDef
     * @return {?}
     */
    configureTestingModule(moduleDef) {
        this._assertNotInstantiated('R3TestBed.configureTestingModule', 'configure the test module');
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
    }
    /**
     * @return {?}
     */
    compileComponents() {
        // assume for now that components don't use templateUrl / stylesUrl to unblock further testing
        // TODO(pk): plug into the ivy's resource fetching pipeline
        return Promise.resolve();
    }
    /**
     * @param {?} token
     * @param {?=} notFoundValue
     * @return {?}
     */
    get(token, notFoundValue = Injector.THROW_IF_NOT_FOUND) {
        this._initIfNeeded();
        if (token === TestBedRender3) {
            return this;
        }
        return this._moduleRef.injector.get(token, notFoundValue);
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
     * Overwrites all providers for the given token with the given provider definition.
     * @param {?} token
     * @param {?} provider
     * @return {?}
     */
    overrideProvider(token, provider) {
        /** @type {?} */
        let injectableDef;
        /** @type {?} */
        const isRoot = (typeof token !== 'string' && (injectableDef = getInjectableDef(token)) &&
            injectableDef.providedIn === 'root');
        /** @type {?} */
        const overrides = isRoot ? this._rootProviderOverrides : this._providerOverrides;
        if (provider.useFactory) {
            overrides.push({ provide: token, useFactory: provider.useFactory, deps: provider.deps || [] });
        }
        else {
            overrides.push({ provide: token, useValue: provider.useValue });
        }
    }
    /**
     * @param {?} token
     * @param {?} provider
     * @return {?}
     */
    deprecatedOverrideProvider(token, provider) {
        throw new Error('No implemented in IVY');
    }
    /**
     * @template T
     * @param {?} type
     * @return {?}
     */
    createComponent(type) {
        this._initIfNeeded();
        /** @type {?} */
        const testComponentRenderer = this.get(TestComponentRenderer);
        /** @type {?} */
        const rootElId = `root${_nextRootElementId++}`;
        testComponentRenderer.insertRootElement(rootElId);
        /** @nocollapse @type {?} */
        const componentDef = (/** @type {?} */ (type)).ngComponentDef;
        if (!componentDef) {
            throw new Error(`It looks like '${stringify(type)}' has not been IVY compiled - it has no 'ngComponentDef' field`);
        }
        /** @type {?} */
        const noNgZone = this.get(ComponentFixtureNoNgZone, false);
        /** @type {?} */
        const autoDetect = this.get(ComponentFixtureAutoDetect, false);
        /** @type {?} */
        const ngZone = noNgZone ? null : this.get(NgZone, null);
        /** @type {?} */
        const componentFactory = new ComponentFactory(componentDef);
        /** @type {?} */
        const initComponent = () => {
            /** @type {?} */
            const componentRef = componentFactory.create(Injector.NULL, [], `#${rootElId}`, this._moduleRef);
            return new ComponentFixture(componentRef, ngZone, autoDetect);
        };
        /** @type {?} */
        const fixture = ngZone ? ngZone.run(initComponent) : initComponent();
        this._activeFixtures.push(fixture);
        return fixture;
    }
    /**
     * @return {?}
     */
    _initIfNeeded() {
        if (this._instantiated) {
            return;
        }
        /** @type {?} */
        const resolvers = this._getResolvers();
        /** @type {?} */
        const testModuleType = this._createTestModule();
        compileNgModule(testModuleType, resolvers);
        /** @type {?} */
        const parentInjector = this.platform.injector;
        this._moduleRef = new NgModuleRef(testModuleType, parentInjector);
        this._instantiated = true;
    }
    /**
     * @return {?}
     */
    _getResolvers() {
        /** @type {?} */
        const module = new NgModuleResolver();
        module.setOverrides(this._moduleOverrides);
        /** @type {?} */
        const component = new ComponentResolver();
        component.setOverrides(this._componentOverrides);
        /** @type {?} */
        const directive = new DirectiveResolver();
        directive.setOverrides(this._directiveOverrides);
        /** @type {?} */
        const pipe = new PipeResolver();
        pipe.setOverrides(this._pipeOverrides);
        return { module, component, directive, pipe };
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
     * @return {?}
     */
    _createTestModule() {
        /** @type {?} */
        const rootProviderOverrides = this._rootProviderOverrides;
        /** @type {?} */
        const rendererFactoryWrapper = {
            provide: WRAP_RENDERER_FACTORY2,
            useFactory: () => (rf) => new Render3DebugRendererFactory2(rf),
        };
        class RootScopeModule {
        }
        RootScopeModule.decorators = [
            { type: NgModule, args: [{
                        providers: [...rootProviderOverrides, rendererFactoryWrapper],
                        jit: true,
                    },] },
        ];
        /** @type {?} */
        const ngZone = new NgZone({ enableLongStackTrace: true });
        /** @type {?} */
        const providers = [{ provide: NgZone, useValue: ngZone }, ...this._providers, ...this._providerOverrides];
        /** @type {?} */
        const declarations = this._declarations;
        /** @type {?} */
        const imports = [RootScopeModule, this.ngModule, this._imports];
        /** @type {?} */
        const schemas = this._schemas;
        class DynamicTestModule {
        }
        DynamicTestModule.decorators = [
            { type: NgModule, args: [{ providers, declarations, imports, schemas, jit: true },] },
        ];
        return DynamicTestModule;
    }
}
if (false) {
    /** @type {?} */
    TestBedRender3.prototype.platform;
    /** @type {?} */
    TestBedRender3.prototype.ngModule;
    /** @type {?} */
    TestBedRender3.prototype._moduleOverrides;
    /** @type {?} */
    TestBedRender3.prototype._componentOverrides;
    /** @type {?} */
    TestBedRender3.prototype._directiveOverrides;
    /** @type {?} */
    TestBedRender3.prototype._pipeOverrides;
    /** @type {?} */
    TestBedRender3.prototype._providerOverrides;
    /** @type {?} */
    TestBedRender3.prototype._rootProviderOverrides;
    /** @type {?} */
    TestBedRender3.prototype._providers;
    /** @type {?} */
    TestBedRender3.prototype._declarations;
    /** @type {?} */
    TestBedRender3.prototype._imports;
    /** @type {?} */
    TestBedRender3.prototype._schemas;
    /** @type {?} */
    TestBedRender3.prototype._activeFixtures;
    /** @type {?} */
    TestBedRender3.prototype._moduleRef;
    /** @type {?} */
    TestBedRender3.prototype._instantiated;
}
/** @type {?} */
let testBed;
/**
 * @return {?}
 */
export function _getTestBedRender3() {
    return testBed = testBed || new TestBedRender3();
}
/** @type {?} */
const EMPTY_ARRAY = [];
/** @typedef {?} */
var Resolvers;
/**
 * @param {?} moduleType
 * @param {?} resolvers
 * @return {?}
 */
function compileNgModule(moduleType, resolvers) {
    /** @type {?} */
    const ngModule = resolvers.module.resolve(moduleType);
    if (ngModule === null) {
        throw new Error(`${stringify(moduleType)} has not @NgModule annotation`);
    }
    compileNgModuleDefs(moduleType, ngModule);
    /** @type {?} */
    const declarations = flatten(ngModule.declarations || EMPTY_ARRAY);
    /** @type {?} */
    const compiledComponents = [];
    // Compile the components, directives and pipes declared by this module
    declarations.forEach(declaration => {
        /** @type {?} */
        const component = resolvers.component.resolve(declaration);
        if (component) {
            compileComponent(declaration, component);
            compiledComponents.push(declaration);
            return;
        }
        /** @type {?} */
        const directive = resolvers.directive.resolve(declaration);
        if (directive) {
            compileDirective(declaration, directive);
            return;
        }
        /** @type {?} */
        const pipe = resolvers.pipe.resolve(declaration);
        if (pipe) {
            compilePipe(declaration, pipe);
            return;
        }
    });
    /** @type {?} */
    const transitiveScope = transitiveScopesFor(moduleType, resolvers);
    compiledComponents.forEach(cmp => patchComponentDefWithScope((/** @type {?} */ (cmp)).ngComponentDef, transitiveScope));
}
/**
 * Compute the pair of transitive scopes (compilation scope and exported scope) for a given module.
 *
 * This operation is memoized and the result is cached on the module's definition. It can be called
 * on modules with components that have not fully compiled yet, but the result should not be used
 * until they have.
 * @template T
 * @param {?} moduleType
 * @param {?} resolvers
 * @return {?}
 */
function transitiveScopesFor(moduleType, resolvers) {
    if (!isNgModule(moduleType)) {
        throw new Error(`${moduleType.name} does not have an ngModuleDef`);
    }
    /** @nocollapse @type {?} */
    const def = moduleType.ngModuleDef;
    if (def.transitiveCompileScopes !== null) {
        return def.transitiveCompileScopes;
    }
    /** @type {?} */
    const scopes = {
        compilation: {
            directives: new Set(),
            pipes: new Set(),
        },
        exported: {
            directives: new Set(),
            pipes: new Set(),
        },
    };
    def.declarations.forEach(declared => {
        /** @type {?} */
        const declaredWithDefs = /** @type {?} */ (declared);
        if (declaredWithDefs.ngPipeDef !== undefined) {
            scopes.compilation.pipes.add(declared);
        }
        else {
            scopes.compilation.directives.add(declared);
        }
    });
    def.imports.forEach((imported) => {
        /** @type {?} */
        const ngModule = resolvers.module.resolve(imported);
        if (ngModule === null) {
            throw new Error(`Importing ${imported.name} which does not have an @ngModule`);
        }
        else {
            compileNgModule(imported, resolvers);
        }
        /** @type {?} */
        const importedScope = transitiveScopesFor(imported, resolvers);
        importedScope.exported.directives.forEach(entry => scopes.compilation.directives.add(entry));
        importedScope.exported.pipes.forEach(entry => scopes.compilation.pipes.add(entry));
    });
    def.exports.forEach((exported) => {
        /** @type {?} */
        const exportedTyped = /** @type {?} */ (exported);
        // Either the type is a module, a pipe, or a component/directive (which may not have an
        // ngComponentDef as it might be compiled asynchronously).
        if (isNgModule(exportedTyped)) {
            /** @type {?} */
            const exportedScope = transitiveScopesFor(exportedTyped, resolvers);
            exportedScope.exported.directives.forEach(entry => {
                scopes.compilation.directives.add(entry);
                scopes.exported.directives.add(entry);
            });
            exportedScope.exported.pipes.forEach(entry => {
                scopes.compilation.pipes.add(entry);
                scopes.exported.pipes.add(entry);
            });
        }
        else if (exportedTyped.ngPipeDef !== undefined) {
            scopes.exported.pipes.add(exportedTyped);
        }
        else {
            scopes.exported.directives.add(exportedTyped);
        }
    });
    def.transitiveCompileScopes = scopes;
    return scopes;
}
/**
 * @template T
 * @param {?} values
 * @return {?}
 */
function flatten(values) {
    /** @type {?} */
    const out = [];
    values.forEach(value => {
        if (Array.isArray(value)) {
            out.push(...flatten(value));
        }
        else {
            out.push(value);
        }
    });
    return out;
}
/**
 * @template T
 * @param {?} value
 * @return {?}
 */
function isNgModule(value) {
    return (/** @type {?} */ (value)).ngModuleDef !== undefined;
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicjNfdGVzdF9iZWQuanMiLCJzb3VyY2VSb290IjoiLi4vLi4vLi4vIiwic291cmNlcyI6WyJwYWNrYWdlcy9jb3JlL3Rlc3Rpbmcvc3JjL3IzX3Rlc3RfYmVkLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBUUEsT0FBTyxFQUF1QixRQUFRLEVBQUUsUUFBUSxFQUFFLE1BQU0sRUFBNEwsd0JBQXdCLElBQUksZ0JBQWdCLEVBQUUsNkJBQTZCLElBQUksNEJBQTRCLEVBQUUsbUJBQW1CLElBQUksV0FBVyxFQUFFLHVCQUF1QixJQUFJLHNCQUFzQixFQUFFLGlCQUFpQixJQUFJLGdCQUFnQixFQUFFLGlCQUFpQixJQUFJLGdCQUFnQixFQUFFLG9CQUFvQixJQUFJLG1CQUFtQixFQUFFLFlBQVksSUFBSSxXQUFXLEVBQUUsaUJBQWlCLElBQUksZ0JBQWdCLEVBQUUsMkJBQTJCLElBQUksMEJBQTBCLEVBQUUsVUFBVSxJQUFJLFNBQVMsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUVodUIsT0FBTyxFQUFDLGdCQUFnQixFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFFckQsT0FBTyxFQUFDLGlCQUFpQixFQUFFLGlCQUFpQixFQUFFLGdCQUFnQixFQUFFLFlBQVksRUFBVyxNQUFNLGFBQWEsQ0FBQztBQUUzRyxPQUFPLEVBQUMsMEJBQTBCLEVBQUUsd0JBQXdCLEVBQWlCLHFCQUFxQixFQUFxQixNQUFNLG1CQUFtQixDQUFDOztBQUVqSixJQUFJLGtCQUFrQixHQUFHLENBQUMsQ0FBQzs7Ozs7Ozs7Ozs7QUFZM0IsTUFBTSxPQUFPLGNBQWM7OztRQTBJekIsbUNBQXdCLElBQUksR0FBRztRQUMvQixtQ0FBa0MsSUFBSSxHQUFHO2dDQUc2QixFQUFFO21DQUNFLEVBQUU7bUNBQ0YsRUFBRTs4QkFDWixFQUFFO2tDQUN6QixFQUFFO3NDQUNFLEVBQUU7MEJBR2QsRUFBRTs2QkFDaUIsRUFBRTt3QkFDUCxFQUFFO3dCQUNELEVBQUU7K0JBRUMsRUFBRTs2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bnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0NvbXBvbmVudCwgRGlyZWN0aXZlLCBJbmplY3RvciwgTmdNb2R1bGUsIE5nWm9uZSwgUGlwZSwgUGxhdGZvcm1SZWYsIFByb3ZpZGVyLCBSZW5kZXJlckZhY3RvcnkyLCBTY2hlbWFNZXRhZGF0YSwgVHlwZSwgybVJbmplY3RhYmxlRGVmIGFzIEluamVjdGFibGVEZWYsIMm1TmdNb2R1bGVEZWYgYXMgTmdNb2R1bGVEZWYsIMm1TmdNb2R1bGVUcmFuc2l0aXZlU2NvcGVzIGFzIE5nTW9kdWxlVHJhbnNpdGl2ZVNjb3BlcywgybVSZW5kZXIzQ29tcG9uZW50RmFjdG9yeSBhcyBDb21wb25lbnRGYWN0b3J5LCDJtVJlbmRlcjNEZWJ1Z1JlbmRlcmVyRmFjdG9yeTIgYXMgUmVuZGVyM0RlYnVnUmVuZGVyZXJGYWN0b3J5MiwgybVSZW5kZXIzTmdNb2R1bGVSZWYgYXMgTmdNb2R1bGVSZWYsIMm1V1JBUF9SRU5ERVJFUl9GQUNUT1JZMiBhcyBXUkFQX1JFTkRFUkVSX0ZBQ1RPUlkyLCDJtWNvbXBpbGVDb21wb25lbnQgYXMgY29tcGlsZUNvbXBvbmVudCwgybVjb21waWxlRGlyZWN0aXZlIGFzIGNvbXBpbGVEaXJlY3RpdmUsIMm1Y29tcGlsZU5nTW9kdWxlRGVmcyBhcyBjb21waWxlTmdNb2R1bGVEZWZzLCDJtWNvbXBpbGVQaXBlIGFzIGNvbXBpbGVQaXBlLCDJtWdldEluamVjdGFibGVEZWYgYXMgZ2V0SW5qZWN0YWJsZURlZiwgybVwYXRjaENvbXBvbmVudERlZldpdGhTY29wZSBhcyBwYXRjaENvbXBvbmVudERlZldpdGhTY29wZSwgybVzdHJpbmdpZnkgYXMgc3RyaW5naWZ5fSBmcm9tICdAYW5ndWxhci9jb3JlJztcblxuaW1wb3J0IHtDb21wb25lbnRGaXh0dXJlfSBmcm9tICcuL2NvbXBvbmVudF9maXh0dXJlJztcbmltcG9ydCB7TWV0YWRhdGFPdmVycmlkZX0gZnJvbSAnLi9tZXRhZGF0YV9vdmVycmlkZSc7XG5pbXBvcnQge0NvbXBvbmVudFJlc29sdmVyLCBEaXJlY3RpdmVSZXNvbHZlciwgTmdNb2R1bGVSZXNvbHZlciwgUGlwZVJlc29sdmVyLCBSZXNvbHZlcn0gZnJvbSAnLi9yZXNvbHZlcnMnO1xuaW1wb3J0IHtUZXN0QmVkfSBmcm9tICcuL3Rlc3RfYmVkJztcbmltcG9ydCB7Q29tcG9uZW50Rml4dHVyZUF1dG9EZXRlY3QsIENvbXBvbmVudEZpeHR1cmVOb05nWm9uZSwgVGVzdEJlZFN0YXRpYywgVGVzdENvbXBvbmVudFJlbmRlcmVyLCBUZXN0TW9kdWxlTWV0YWRhdGF9IGZyb20gJy4vdGVzdF9iZWRfY29tbW9uJztcblxubGV0IF9uZXh0Um9vdEVsZW1lbnRJZCA9IDA7XG5cbi8qKlxuICogQGRlc2NyaXB0aW9uXG4gKiBDb25maWd1cmVzIGFuZCBpbml0aWFsaXplcyBlbnZpcm9ubWVudCBmb3IgdW5pdCB0ZXN0aW5nIGFuZCBwcm92aWRlcyBtZXRob2RzIGZvclxuICogY3JlYXRpbmcgY29tcG9uZW50cyBhbmQgc2VydmljZXMgaW4gdW5pdCB0ZXN0cy5cbiAqXG4gKiBUZXN0QmVkIGlzIHRoZSBwcmltYXJ5IGFwaSBmb3Igd3JpdGluZyB1bml0IHRlc3RzIGZvciBBbmd1bGFyIGFwcGxpY2F0aW9ucyBhbmQgbGlicmFyaWVzLlxuICpcbiAqIE5vdGU6IFVzZSBgVGVzdEJlZGAgaW4gdGVzdHMuIEl0IHdpbGwgYmUgc2V0IHRvIGVpdGhlciBgVGVzdEJlZFZpZXdFbmdpbmVgIG9yIGBUZXN0QmVkUmVuZGVyM2BcbiAqIGFjY29yZGluZyB0byB0aGUgY29tcGlsZXIgdXNlZC5cbiAqL1xuZXhwb3J0IGNsYXNzIFRlc3RCZWRSZW5kZXIzIGltcGxlbWVudHMgSW5qZWN0b3IsIFRlc3RCZWQge1xuICAvKipcbiAgICogSW5pdGlhbGl6ZSB0aGUgZW52aXJvbm1lbnQgZm9yIHRlc3Rpbmcgd2l0aCBhIGNvbXBpbGVyIGZhY3RvcnksIGEgUGxhdGZvcm1SZWYsIGFuZCBhblxuICAgKiBhbmd1bGFyIG1vZHVsZS4gVGhlc2UgYXJlIGNvbW1vbiB0byBldmVyeSB0ZXN0IGluIHRoZSBzdWl0ZS5cbiAgICpcbiAgICogVGhpcyBtYXkgb25seSBiZSBjYWxsZWQgb25jZSwgdG8gc2V0IHVwIHRoZSBjb21tb24gcHJvdmlkZXJzIGZvciB0aGUgY3VycmVudCB0ZXN0XG4gICAqIHN1aXRlIG9uIHRoZSBjdXJyZW50IHBsYXRmb3JtLiBJZiB5b3UgYWJzb2x1dGVseSBuZWVkIHRvIGNoYW5nZSB0aGUgcHJvdmlkZXJzLFxuICAgKiBmaXJzdCB1c2UgYHJlc2V0VGVzdEVudmlyb25tZW50YC5cbiAgICpcbiAgICogVGVzdCBtb2R1bGVzIGFuZCBwbGF0Zm9ybXMgZm9yIGluZGl2aWR1YWwgcGxhdGZvcm1zIGFyZSBhdmFpbGFibGUgZnJvbVxuICAgKiAnQGFuZ3VsYXIvPHBsYXRmb3JtX25hbWU+L3Rlc3RpbmcnLlxuICAgKlxuICAgKiBAcHVibGljQXBpXG4gICAqL1xuICBzdGF0aWMgaW5pdFRlc3RFbnZpcm9ubWVudChcbiAgICAgIG5nTW9kdWxlOiBUeXBlPGFueT58VHlwZTxhbnk+W10sIHBsYXRmb3JtOiBQbGF0Zm9ybVJlZiwgYW90U3VtbWFyaWVzPzogKCkgPT4gYW55W10pOiBUZXN0QmVkIHtcbiAgICBjb25zdCB0ZXN0QmVkID0gX2dldFRlc3RCZWRSZW5kZXIzKCk7XG4gICAgdGVzdEJlZC5pbml0VGVzdEVudmlyb25tZW50KG5nTW9kdWxlLCBwbGF0Zm9ybSwgYW90U3VtbWFyaWVzKTtcbiAgICByZXR1cm4gdGVzdEJlZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXNldCB0aGUgcHJvdmlkZXJzIGZvciB0aGUgdGVzdCBpbmplY3Rvci5cbiAgICpcbiAgICogQHB1YmxpY0FwaVxuICAgKi9cbiAgc3RhdGljIHJlc2V0VGVzdEVudmlyb25tZW50KCk6IHZvaWQgeyBfZ2V0VGVzdEJlZFJlbmRlcjMoKS5yZXNldFRlc3RFbnZpcm9ubWVudCgpOyB9XG5cbiAgc3RhdGljIGNvbmZpZ3VyZUNvbXBpbGVyKGNvbmZpZzoge3Byb3ZpZGVycz86IGFueVtdOyB1c2VKaXQ/OiBib29sZWFuO30pOiBUZXN0QmVkU3RhdGljIHtcbiAgICBfZ2V0VGVzdEJlZFJlbmRlcjMoKS5jb25maWd1cmVDb21waWxlcihjb25maWcpO1xuICAgIHJldHVybiBUZXN0QmVkUmVuZGVyMyBhcyBhbnkgYXMgVGVzdEJlZFN0YXRpYztcbiAgfVxuXG4gIC8qKlxuICAgKiBBbGxvd3Mgb3ZlcnJpZGluZyBkZWZhdWx0IHByb3ZpZGVycywgZGlyZWN0aXZlcywgcGlwZXMsIG1vZHVsZXMgb2YgdGhlIHRlc3QgaW5qZWN0b3IsXG4gICAqIHdoaWNoIGFyZSBkZWZpbmVkIGluIHRlc3RfaW5qZWN0b3IuanNcbiAgICovXG4gIHN0YXRpYyBjb25maWd1cmVUZXN0aW5nTW9kdWxlKG1vZHVsZURlZjogVGVzdE1vZHVsZU1ldGFkYXRhKTogVGVzdEJlZFN0YXRpYyB7XG4gICAgX2dldFRlc3RCZWRSZW5kZXIzKCkuY29uZmlndXJlVGVzdGluZ01vZHVsZShtb2R1bGVEZWYpO1xuICAgIHJldHVybiBUZXN0QmVkUmVuZGVyMyBhcyBhbnkgYXMgVGVzdEJlZFN0YXRpYztcbiAgfVxuXG4gIC8qKlxuICAgKiBDb21waWxlIGNvbXBvbmVudHMgd2l0aCBhIGB0ZW1wbGF0ZVVybGAgZm9yIHRoZSB0ZXN0J3MgTmdNb2R1bGUuXG4gICAqIEl0IGlzIG5lY2Vzc2FyeSB0byBjYWxsIHRoaXMgZnVuY3Rpb25cbiAgICogYXMgZmV0Y2hpbmcgdXJscyBpcyBhc3luY2hyb25vdXMuXG4gICAqL1xuICBzdGF0aWMgY29tcGlsZUNvbXBvbmVudHMoKTogUHJvbWlzZTxhbnk+IHsgcmV0dXJuIF9nZXRUZXN0QmVkUmVuZGVyMygpLmNvbXBpbGVDb21wb25lbnRzKCk7IH1cblxuICBzdGF0aWMgb3ZlcnJpZGVNb2R1bGUobmdNb2R1bGU6IFR5cGU8YW55Piwgb3ZlcnJpZGU6IE1ldGFkYXRhT3ZlcnJpZGU8TmdNb2R1bGU+KTogVGVzdEJlZFN0YXRpYyB7XG4gICAgX2dldFRlc3RCZWRSZW5kZXIzKCkub3ZlcnJpZGVNb2R1bGUobmdNb2R1bGUsIG92ZXJyaWRlKTtcbiAgICByZXR1cm4gVGVzdEJlZFJlbmRlcjMgYXMgYW55IGFzIFRlc3RCZWRTdGF0aWM7XG4gIH1cblxuICBzdGF0aWMgb3ZlcnJpZGVDb21wb25lbnQoY29tcG9uZW50OiBUeXBlPGFueT4sIG92ZXJyaWRlOiBNZXRhZGF0YU92ZXJyaWRlPENvbXBvbmVudD4pOlxuICAgICAgVGVzdEJlZFN0YXRpYyB7XG4gICAgX2dldFRlc3RCZWRSZW5kZXIzKCkub3ZlcnJpZGVDb21wb25lbnQoY29tcG9uZW50LCBvdmVycmlkZSk7XG4gICAgcmV0dXJuIFRlc3RCZWRSZW5kZXIzIGFzIGFueSBhcyBUZXN0QmVkU3RhdGljO1xuICB9XG5cbiAgc3RhdGljIG92ZXJyaWRlRGlyZWN0aXZlKGRpcmVjdGl2ZTogVHlwZTxhbnk+LCBvdmVycmlkZTogTWV0YWRhdGFPdmVycmlkZTxEaXJlY3RpdmU+KTpcbiAgICAgIFRlc3RCZWRTdGF0aWMge1xuICAgIF9nZXRUZXN0QmVkUmVuZGVyMygpLm92ZXJyaWRlRGlyZWN0aXZlKGRpcmVjdGl2ZSwgb3ZlcnJpZGUpO1xuICAgIHJldHVybiBUZXN0QmVkUmVuZGVyMyBhcyBhbnkgYXMgVGVzdEJlZFN0YXRpYztcbiAgfVxuXG4gIHN0YXRpYyBvdmVycmlkZVBpcGUocGlwZTogVHlwZTxhbnk+LCBvdmVycmlkZTogTWV0YWRhdGFPdmVycmlkZTxQaXBlPik6IFRlc3RCZWRTdGF0aWMge1xuICAgIF9nZXRUZXN0QmVkUmVuZGVyMygpLm92ZXJyaWRlUGlwZShwaXBlLCBvdmVycmlkZSk7XG4gICAgcmV0dXJuIFRlc3RCZWRSZW5kZXIzIGFzIGFueSBhcyBUZXN0QmVkU3RhdGljO1xuICB9XG5cbiAgc3RhdGljIG92ZXJyaWRlVGVtcGxhdGUoY29tcG9uZW50OiBUeXBlPGFueT4sIHRlbXBsYXRlOiBzdHJpbmcpOiBUZXN0QmVkU3RhdGljIHtcbiAgICBfZ2V0VGVzdEJlZFJlbmRlcjMoKS5vdmVycmlkZUNvbXBvbmVudChjb21wb25lbnQsIHtzZXQ6IHt0ZW1wbGF0ZSwgdGVtcGxhdGVVcmw6IG51bGwgIX19KTtcbiAgICByZXR1cm4gVGVzdEJlZFJlbmRlcjMgYXMgYW55IGFzIFRlc3RCZWRTdGF0aWM7XG4gIH1cblxuICAvKipcbiAgICogT3ZlcnJpZGVzIHRoZSB0ZW1wbGF0ZSBvZiB0aGUgZ2l2ZW4gY29tcG9uZW50LCBjb21waWxpbmcgdGhlIHRlbXBsYXRlXG4gICAqIGluIHRoZSBjb250ZXh0IG9mIHRoZSBUZXN0aW5nTW9kdWxlLlxuICAgKlxuICAgKiBOb3RlOiBUaGlzIHdvcmtzIGZvciBKSVQgYW5kIEFPVGVkIGNvbXBvbmVudHMgYXMgd2VsbC5cbiAgICovXG4gIHN0YXRpYyBvdmVycmlkZVRlbXBsYXRlVXNpbmdUZXN0aW5nTW9kdWxlKGNvbXBvbmVudDogVHlwZTxhbnk+LCB0ZW1wbGF0ZTogc3RyaW5nKTogVGVzdEJlZFN0YXRpYyB7XG4gICAgX2dldFRlc3RCZWRSZW5kZXIzKCkub3ZlcnJpZGVUZW1wbGF0ZVVzaW5nVGVzdGluZ01vZHVsZShjb21wb25lbnQsIHRlbXBsYXRlKTtcbiAgICByZXR1cm4gVGVzdEJlZFJlbmRlcjMgYXMgYW55IGFzIFRlc3RCZWRTdGF0aWM7XG4gIH1cblxuICBvdmVycmlkZVRlbXBsYXRlVXNpbmdUZXN0aW5nTW9kdWxlKGNvbXBvbmVudDogVHlwZTxhbnk+LCB0ZW1wbGF0ZTogc3RyaW5nKTogdm9pZCB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdSZW5kZXIzVGVzdEJlZC5vdmVycmlkZVRlbXBsYXRlVXNpbmdUZXN0aW5nTW9kdWxlIGlzIG5vdCBpbXBsZW1lbnRlZCB5ZXQnKTtcbiAgfVxuXG4gIHN0YXRpYyBvdmVycmlkZVByb3ZpZGVyKHRva2VuOiBhbnksIHByb3ZpZGVyOiB7XG4gICAgdXNlRmFjdG9yeTogRnVuY3Rpb24sXG4gICAgZGVwczogYW55W10sXG4gIH0pOiBUZXN0QmVkU3RhdGljO1xuICBzdGF0aWMgb3ZlcnJpZGVQcm92aWRlcih0b2tlbjogYW55LCBwcm92aWRlcjoge3VzZVZhbHVlOiBhbnk7fSk6IFRlc3RCZWRTdGF0aWM7XG4gIHN0YXRpYyBvdmVycmlkZVByb3ZpZGVyKHRva2VuOiBhbnksIHByb3ZpZGVyOiB7XG4gICAgdXNlRmFjdG9yeT86IEZ1bmN0aW9uLFxuICAgIHVzZVZhbHVlPzogYW55LFxuICAgIGRlcHM/OiBhbnlbXSxcbiAgfSk6IFRlc3RCZWRTdGF0aWMge1xuICAgIF9nZXRUZXN0QmVkUmVuZGVyMygpLm92ZXJyaWRlUHJvdmlkZXIodG9rZW4sIHByb3ZpZGVyKTtcbiAgICByZXR1cm4gVGVzdEJlZFJlbmRlcjMgYXMgYW55IGFzIFRlc3RCZWRTdGF0aWM7XG4gIH1cblxuICAvKipcbiAgICogT3ZlcndyaXRlcyBhbGwgcHJvdmlkZXJzIGZvciB0aGUgZ2l2ZW4gdG9rZW4gd2l0aCB0aGUgZ2l2ZW4gcHJvdmlkZXIgZGVmaW5pdGlvbi5cbiAgICpcbiAgICogQGRlcHJlY2F0ZWQgYXMgaXQgbWFrZXMgYWxsIE5nTW9kdWxlcyBsYXp5LiBJbnRyb2R1Y2VkIG9ubHkgZm9yIG1pZ3JhdGluZyBvZmYgb2YgaXQuXG4gICAqL1xuICBzdGF0aWMgZGVwcmVjYXRlZE92ZXJyaWRlUHJvdmlkZXIodG9rZW46IGFueSwgcHJvdmlkZXI6IHtcbiAgICB1c2VGYWN0b3J5OiBGdW5jdGlvbixcbiAgICBkZXBzOiBhbnlbXSxcbiAgfSk6IHZvaWQ7XG4gIHN0YXRpYyBkZXByZWNhdGVkT3ZlcnJpZGVQcm92aWRlcih0b2tlbjogYW55LCBwcm92aWRlcjoge3VzZVZhbHVlOiBhbnk7fSk6IHZvaWQ7XG4gIHN0YXRpYyBkZXByZWNhdGVkT3ZlcnJpZGVQcm92aWRlcih0b2tlbjogYW55LCBwcm92aWRlcjoge1xuICAgIHVzZUZhY3Rvcnk/OiBGdW5jdGlvbixcbiAgICB1c2VWYWx1ZT86IGFueSxcbiAgICBkZXBzPzogYW55W10sXG4gIH0pOiBUZXN0QmVkU3RhdGljIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ1JlbmRlcjNUZXN0QmVkLmRlcHJlY2F0ZWRPdmVycmlkZVByb3ZpZGVyIGlzIG5vdCBpbXBsZW1lbnRlZCcpO1xuICB9XG5cbiAgc3RhdGljIGdldCh0b2tlbjogYW55LCBub3RGb3VuZFZhbHVlOiBhbnkgPSBJbmplY3Rvci5USFJPV19JRl9OT1RfRk9VTkQpOiBhbnkge1xuICAgIHJldHVybiBfZ2V0VGVzdEJlZFJlbmRlcjMoKS5nZXQodG9rZW4sIG5vdEZvdW5kVmFsdWUpO1xuICB9XG5cbiAgc3RhdGljIGNyZWF0ZUNvbXBvbmVudDxUPihjb21wb25lbnQ6IFR5cGU8VD4pOiBDb21wb25lbnRGaXh0dXJlPFQ+IHtcbiAgICByZXR1cm4gX2dldFRlc3RCZWRSZW5kZXIzKCkuY3JlYXRlQ29tcG9uZW50KGNvbXBvbmVudCk7XG4gIH1cblxuICBzdGF0aWMgcmVzZXRUZXN0aW5nTW9kdWxlKCk6IFRlc3RCZWRTdGF0aWMge1xuICAgIF9nZXRUZXN0QmVkUmVuZGVyMygpLnJlc2V0VGVzdGluZ01vZHVsZSgpO1xuICAgIHJldHVybiBUZXN0QmVkUmVuZGVyMyBhcyBhbnkgYXMgVGVzdEJlZFN0YXRpYztcbiAgfVxuXG4gIC8vIFByb3BlcnRpZXNcblxuICBwbGF0Zm9ybTogUGxhdGZvcm1SZWYgPSBudWxsICE7XG4gIG5nTW9kdWxlOiBUeXBlPGFueT58VHlwZTxhbnk+W10gPSBudWxsICE7XG5cbiAgLy8gbWV0YWRhdGEgb3ZlcnJpZGVzXG4gIHByaXZhdGUgX21vZHVsZU92ZXJyaWRlczogW1R5cGU8YW55PiwgTWV0YWRhdGFPdmVycmlkZTxOZ01vZHVsZT5dW10gPSBbXTtcbiAgcHJpdmF0ZSBfY29tcG9uZW50T3ZlcnJpZGVzOiBbVHlwZTxhbnk+LCBNZXRhZGF0YU92ZXJyaWRlPENvbXBvbmVudD5dW10gPSBbXTtcbiAgcHJpdmF0ZSBfZGlyZWN0aXZlT3ZlcnJpZGVzOiBbVHlwZTxhbnk+LCBNZXRhZGF0YU92ZXJyaWRlPERpcmVjdGl2ZT5dW10gPSBbXTtcbiAgcHJpdmF0ZSBfcGlwZU92ZXJyaWRlczogW1R5cGU8YW55PiwgTWV0YWRhdGFPdmVycmlkZTxQaXBlPl1bXSA9IFtdO1xuICBwcml2YXRlIF9wcm92aWRlck92ZXJyaWRlczogUHJvdmlkZXJbXSA9IFtdO1xuICBwcml2YXRlIF9yb290UHJvdmlkZXJPdmVycmlkZXM6IFByb3ZpZGVyW10gPSBbXTtcblxuICAvLyB0ZXN0IG1vZHVsZSBjb25maWd1cmF0aW9uXG4gIHByaXZhdGUgX3Byb3ZpZGVyczogUHJvdmlkZXJbXSA9IFtdO1xuICBwcml2YXRlIF9kZWNsYXJhdGlvbnM6IEFycmF5PFR5cGU8YW55PnxhbnlbXXxhbnk+ID0gW107XG4gIHByaXZhdGUgX2ltcG9ydHM6IEFycmF5PFR5cGU8YW55PnxhbnlbXXxhbnk+ID0gW107XG4gIHByaXZhdGUgX3NjaGVtYXM6IEFycmF5PFNjaGVtYU1ldGFkYXRhfGFueVtdPiA9IFtdO1xuXG4gIHByaXZhdGUgX2FjdGl2ZUZpeHR1cmVzOiBDb21wb25lbnRGaXh0dXJlPGFueT5bXSA9IFtdO1xuXG4gIHByaXZhdGUgX21vZHVsZVJlZjogTmdNb2R1bGVSZWY8YW55PiA9IG51bGwgITtcblxuICBwcml2YXRlIF9pbnN0YW50aWF0ZWQ6IGJvb2xlYW4gPSBmYWxzZTtcblxuICAvKipcbiAgICogSW5pdGlhbGl6ZSB0aGUgZW52aXJvbm1lbnQgZm9yIHRlc3Rpbmcgd2l0aCBhIGNvbXBpbGVyIGZhY3RvcnksIGEgUGxhdGZvcm1SZWYsIGFuZCBhblxuICAgKiBhbmd1bGFyIG1vZHVsZS4gVGhlc2UgYXJlIGNvbW1vbiB0byBldmVyeSB0ZXN0IGluIHRoZSBzdWl0ZS5cbiAgICpcbiAgICogVGhpcyBtYXkgb25seSBiZSBjYWxsZWQgb25jZSwgdG8gc2V0IHVwIHRoZSBjb21tb24gcHJvdmlkZXJzIGZvciB0aGUgY3VycmVudCB0ZXN0XG4gICAqIHN1aXRlIG9uIHRoZSBjdXJyZW50IHBsYXRmb3JtLiBJZiB5b3UgYWJzb2x1dGVseSBuZWVkIHRvIGNoYW5nZSB0aGUgcHJvdmlkZXJzLFxuICAgKiBmaXJzdCB1c2UgYHJlc2V0VGVzdEVudmlyb25tZW50YC5cbiAgICpcbiAgICogVGVzdCBtb2R1bGVzIGFuZCBwbGF0Zm9ybXMgZm9yIGluZGl2aWR1YWwgcGxhdGZvcm1zIGFyZSBhdmFpbGFibGUgZnJvbVxuICAgKiAnQGFuZ3VsYXIvPHBsYXRmb3JtX25hbWU+L3Rlc3RpbmcnLlxuICAgKlxuICAgKiBAcHVibGljQXBpXG4gICAqL1xuICBpbml0VGVzdEVudmlyb25tZW50KFxuICAgICAgbmdNb2R1bGU6IFR5cGU8YW55PnxUeXBlPGFueT5bXSwgcGxhdGZvcm06IFBsYXRmb3JtUmVmLCBhb3RTdW1tYXJpZXM/OiAoKSA9PiBhbnlbXSk6IHZvaWQge1xuICAgIGlmICh0aGlzLnBsYXRmb3JtIHx8IHRoaXMubmdNb2R1bGUpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignQ2Fubm90IHNldCBiYXNlIHByb3ZpZGVycyBiZWNhdXNlIGl0IGhhcyBhbHJlYWR5IGJlZW4gY2FsbGVkJyk7XG4gICAgfVxuICAgIHRoaXMucGxhdGZvcm0gPSBwbGF0Zm9ybTtcbiAgICB0aGlzLm5nTW9kdWxlID0gbmdNb2R1bGU7XG4gIH1cblxuICAvKipcbiAgICogUmVzZXQgdGhlIHByb3ZpZGVycyBmb3IgdGhlIHRlc3QgaW5qZWN0b3IuXG4gICAqXG4gICAqIEBwdWJsaWNBcGlcbiAgICovXG4gIHJlc2V0VGVzdEVudmlyb25tZW50KCk6IHZvaWQge1xuICAgIHRoaXMucmVzZXRUZXN0aW5nTW9kdWxlKCk7XG4gICAgdGhpcy5wbGF0Zm9ybSA9IG51bGwgITtcbiAgICB0aGlzLm5nTW9kdWxlID0gbnVsbCAhO1xuICB9XG5cbiAgcmVzZXRUZXN0aW5nTW9kdWxlKCk6IHZvaWQge1xuICAgIC8vIHJlc2V0IG1ldGFkYXRhIG92ZXJyaWRlc1xuICAgIHRoaXMuX21vZHVsZU92ZXJyaWRlcyA9IFtdO1xuICAgIHRoaXMuX2NvbXBvbmVudE92ZXJyaWRlcyA9IFtdO1xuICAgIHRoaXMuX2RpcmVjdGl2ZU92ZXJyaWRlcyA9IFtdO1xuICAgIHRoaXMuX3BpcGVPdmVycmlkZXMgPSBbXTtcbiAgICB0aGlzLl9wcm92aWRlck92ZXJyaWRlcyA9IFtdO1xuICAgIHRoaXMuX3Jvb3RQcm92aWRlck92ZXJyaWRlcyA9IFtdO1xuXG4gICAgLy8gcmVzZXQgdGVzdCBtb2R1bGUgY29uZmlnXG4gICAgdGhpcy5fcHJvdmlkZXJzID0gW107XG4gICAgdGhpcy5fZGVjbGFyYXRpb25zID0gW107XG4gICAgdGhpcy5faW1wb3J0cyA9IFtdO1xuICAgIHRoaXMuX3NjaGVtYXMgPSBbXTtcbiAgICB0aGlzLl9tb2R1bGVSZWYgPSBudWxsICE7XG5cbiAgICB0aGlzLl9pbnN0YW50aWF0ZWQgPSBmYWxzZTtcbiAgICB0aGlzLl9hY3RpdmVGaXh0dXJlcy5mb3JFYWNoKChmaXh0dXJlKSA9PiB7XG4gICAgICB0cnkge1xuICAgICAgICBmaXh0dXJlLmRlc3Ryb3koKTtcbiAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcignRXJyb3IgZHVyaW5nIGNsZWFudXAgb2YgY29tcG9uZW50Jywge1xuICAgICAgICAgIGNvbXBvbmVudDogZml4dHVyZS5jb21wb25lbnRJbnN0YW5jZSxcbiAgICAgICAgICBzdGFja3RyYWNlOiBlLFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICB0aGlzLl9hY3RpdmVGaXh0dXJlcyA9IFtdO1xuICB9XG5cbiAgY29uZmlndXJlQ29tcGlsZXIoY29uZmlnOiB7cHJvdmlkZXJzPzogYW55W107IHVzZUppdD86IGJvb2xlYW47fSk6IHZvaWQge1xuICAgIGlmIChjb25maWcudXNlSml0ICE9IG51bGwpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcigndGhlIFJlbmRlcjMgY29tcGlsZXIgSmlUIG1vZGUgaXMgbm90IGNvbmZpZ3VyYWJsZSAhJyk7XG4gICAgfVxuXG4gICAgaWYgKGNvbmZpZy5wcm92aWRlcnMpIHtcbiAgICAgIHRoaXMuX3Byb3ZpZGVyT3ZlcnJpZGVzLnB1c2goLi4uY29uZmlnLnByb3ZpZGVycyk7XG4gICAgfVxuICB9XG5cbiAgY29uZmlndXJlVGVzdGluZ01vZHVsZShtb2R1bGVEZWY6IFRlc3RNb2R1bGVNZXRhZGF0YSk6IHZvaWQge1xuICAgIHRoaXMuX2Fzc2VydE5vdEluc3RhbnRpYXRlZCgnUjNUZXN0QmVkLmNvbmZpZ3VyZVRlc3RpbmdNb2R1bGUnLCAnY29uZmlndXJlIHRoZSB0ZXN0IG1vZHVsZScpO1xuICAgIGlmIChtb2R1bGVEZWYucHJvdmlkZXJzKSB7XG4gICAgICB0aGlzLl9wcm92aWRlcnMucHVzaCguLi5tb2R1bGVEZWYucHJvdmlkZXJzKTtcbiAgICB9XG4gICAgaWYgKG1vZHVsZURlZi5kZWNsYXJhdGlvbnMpIHtcbiAgICAgIHRoaXMuX2RlY2xhcmF0aW9ucy5wdXNoKC4uLm1vZHVsZURlZi5kZWNsYXJhdGlvbnMpO1xuICAgIH1cbiAgICBpZiAobW9kdWxlRGVmLmltcG9ydHMpIHtcbiAgICAgIHRoaXMuX2ltcG9ydHMucHVzaCguLi5tb2R1bGVEZWYuaW1wb3J0cyk7XG4gICAgfVxuICAgIGlmIChtb2R1bGVEZWYuc2NoZW1hcykge1xuICAgICAgdGhpcy5fc2NoZW1hcy5wdXNoKC4uLm1vZHVsZURlZi5zY2hlbWFzKTtcbiAgICB9XG4gIH1cblxuICBjb21waWxlQ29tcG9uZW50cygpOiBQcm9taXNlPGFueT4ge1xuICAgIC8vIGFzc3VtZSBmb3Igbm93IHRoYXQgY29tcG9uZW50cyBkb24ndCB1c2UgdGVtcGxhdGVVcmwgLyBzdHlsZXNVcmwgdG8gdW5ibG9jayBmdXJ0aGVyIHRlc3RpbmdcbiAgICAvLyBUT0RPKHBrKTogcGx1ZyBpbnRvIHRoZSBpdnkncyByZXNvdXJjZSBmZXRjaGluZyBwaXBlbGluZVxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgfVxuXG4gIGdldCh0b2tlbjogYW55LCBub3RGb3VuZFZhbHVlOiBhbnkgPSBJbmplY3Rvci5USFJPV19JRl9OT1RfRk9VTkQpOiBhbnkge1xuICAgIHRoaXMuX2luaXRJZk5lZWRlZCgpO1xuICAgIGlmICh0b2tlbiA9PT0gVGVzdEJlZFJlbmRlcjMpIHtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5fbW9kdWxlUmVmLmluamVjdG9yLmdldCh0b2tlbiwgbm90Rm91bmRWYWx1ZSk7XG4gIH1cblxuICBleGVjdXRlKHRva2VuczogYW55W10sIGZuOiBGdW5jdGlvbiwgY29udGV4dD86IGFueSk6IGFueSB7XG4gICAgdGhpcy5faW5pdElmTmVlZGVkKCk7XG4gICAgY29uc3QgcGFyYW1zID0gdG9rZW5zLm1hcCh0ID0+IHRoaXMuZ2V0KHQpKTtcbiAgICByZXR1cm4gZm4uYXBwbHkoY29udGV4dCwgcGFyYW1zKTtcbiAgfVxuXG4gIG92ZXJyaWRlTW9kdWxlKG5nTW9kdWxlOiBUeXBlPGFueT4sIG92ZXJyaWRlOiBNZXRhZGF0YU92ZXJyaWRlPE5nTW9kdWxlPik6IHZvaWQge1xuICAgIHRoaXMuX2Fzc2VydE5vdEluc3RhbnRpYXRlZCgnb3ZlcnJpZGVNb2R1bGUnLCAnb3ZlcnJpZGUgbW9kdWxlIG1ldGFkYXRhJyk7XG4gICAgdGhpcy5fbW9kdWxlT3ZlcnJpZGVzLnB1c2goW25nTW9kdWxlLCBvdmVycmlkZV0pO1xuICB9XG5cbiAgb3ZlcnJpZGVDb21wb25lbnQoY29tcG9uZW50OiBUeXBlPGFueT4sIG92ZXJyaWRlOiBNZXRhZGF0YU92ZXJyaWRlPENvbXBvbmVudD4pOiB2b2lkIHtcbiAgICB0aGlzLl9hc3NlcnROb3RJbnN0YW50aWF0ZWQoJ292ZXJyaWRlQ29tcG9uZW50JywgJ292ZXJyaWRlIGNvbXBvbmVudCBtZXRhZGF0YScpO1xuICAgIHRoaXMuX2NvbXBvbmVudE92ZXJyaWRlcy5wdXNoKFtjb21wb25lbnQsIG92ZXJyaWRlXSk7XG4gIH1cblxuICBvdmVycmlkZURpcmVjdGl2ZShkaXJlY3RpdmU6IFR5cGU8YW55Piwgb3ZlcnJpZGU6IE1ldGFkYXRhT3ZlcnJpZGU8RGlyZWN0aXZlPik6IHZvaWQge1xuICAgIHRoaXMuX2Fzc2VydE5vdEluc3RhbnRpYXRlZCgnb3ZlcnJpZGVEaXJlY3RpdmUnLCAnb3ZlcnJpZGUgZGlyZWN0aXZlIG1ldGFkYXRhJyk7XG4gICAgdGhpcy5fZGlyZWN0aXZlT3ZlcnJpZGVzLnB1c2goW2RpcmVjdGl2ZSwgb3ZlcnJpZGVdKTtcbiAgfVxuXG4gIG92ZXJyaWRlUGlwZShwaXBlOiBUeXBlPGFueT4sIG92ZXJyaWRlOiBNZXRhZGF0YU92ZXJyaWRlPFBpcGU+KTogdm9pZCB7XG4gICAgdGhpcy5fYXNzZXJ0Tm90SW5zdGFudGlhdGVkKCdvdmVycmlkZVBpcGUnLCAnb3ZlcnJpZGUgcGlwZSBtZXRhZGF0YScpO1xuICAgIHRoaXMuX3BpcGVPdmVycmlkZXMucHVzaChbcGlwZSwgb3ZlcnJpZGVdKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBPdmVyd3JpdGVzIGFsbCBwcm92aWRlcnMgZm9yIHRoZSBnaXZlbiB0b2tlbiB3aXRoIHRoZSBnaXZlbiBwcm92aWRlciBkZWZpbml0aW9uLlxuICAgKi9cbiAgb3ZlcnJpZGVQcm92aWRlcih0b2tlbjogYW55LCBwcm92aWRlcjoge3VzZUZhY3Rvcnk/OiBGdW5jdGlvbiwgdXNlVmFsdWU/OiBhbnksIGRlcHM/OiBhbnlbXX0pOlxuICAgICAgdm9pZCB7XG4gICAgbGV0IGluamVjdGFibGVEZWY6IEluamVjdGFibGVEZWY8YW55PnxudWxsO1xuICAgIGNvbnN0IGlzUm9vdCA9XG4gICAgICAgICh0eXBlb2YgdG9rZW4gIT09ICdzdHJpbmcnICYmIChpbmplY3RhYmxlRGVmID0gZ2V0SW5qZWN0YWJsZURlZih0b2tlbikpICYmXG4gICAgICAgICBpbmplY3RhYmxlRGVmLnByb3ZpZGVkSW4gPT09ICdyb290Jyk7XG4gICAgY29uc3Qgb3ZlcnJpZGVzID0gaXNSb290ID8gdGhpcy5fcm9vdFByb3ZpZGVyT3ZlcnJpZGVzIDogdGhpcy5fcHJvdmlkZXJPdmVycmlkZXM7XG5cbiAgICBpZiAocHJvdmlkZXIudXNlRmFjdG9yeSkge1xuICAgICAgb3ZlcnJpZGVzLnB1c2goe3Byb3ZpZGU6IHRva2VuLCB1c2VGYWN0b3J5OiBwcm92aWRlci51c2VGYWN0b3J5LCBkZXBzOiBwcm92aWRlci5kZXBzIHx8IFtdfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG92ZXJyaWRlcy5wdXNoKHtwcm92aWRlOiB0b2tlbiwgdXNlVmFsdWU6IHByb3ZpZGVyLnVzZVZhbHVlfSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIE92ZXJ3cml0ZXMgYWxsIHByb3ZpZGVycyBmb3IgdGhlIGdpdmVuIHRva2VuIHdpdGggdGhlIGdpdmVuIHByb3ZpZGVyIGRlZmluaXRpb24uXG4gICAqXG4gICAqIEBkZXByZWNhdGVkIGFzIGl0IG1ha2VzIGFsbCBOZ01vZHVsZXMgbGF6eS4gSW50cm9kdWNlZCBvbmx5IGZvciBtaWdyYXRpbmcgb2ZmIG9mIGl0LlxuICAgKi9cbiAgZGVwcmVjYXRlZE92ZXJyaWRlUHJvdmlkZXIodG9rZW46IGFueSwgcHJvdmlkZXI6IHtcbiAgICB1c2VGYWN0b3J5OiBGdW5jdGlvbixcbiAgICBkZXBzOiBhbnlbXSxcbiAgfSk6IHZvaWQ7XG4gIGRlcHJlY2F0ZWRPdmVycmlkZVByb3ZpZGVyKHRva2VuOiBhbnksIHByb3ZpZGVyOiB7dXNlVmFsdWU6IGFueTt9KTogdm9pZDtcbiAgZGVwcmVjYXRlZE92ZXJyaWRlUHJvdmlkZXIoXG4gICAgICB0b2tlbjogYW55LCBwcm92aWRlcjoge3VzZUZhY3Rvcnk/OiBGdW5jdGlvbiwgdXNlVmFsdWU/OiBhbnksIGRlcHM/OiBhbnlbXX0pOiB2b2lkIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ05vIGltcGxlbWVudGVkIGluIElWWScpO1xuICB9XG5cbiAgY3JlYXRlQ29tcG9uZW50PFQ+KHR5cGU6IFR5cGU8VD4pOiBDb21wb25lbnRGaXh0dXJlPFQ+IHtcbiAgICB0aGlzLl9pbml0SWZOZWVkZWQoKTtcblxuICAgIGNvbnN0IHRlc3RDb21wb25lbnRSZW5kZXJlcjogVGVzdENvbXBvbmVudFJlbmRlcmVyID0gdGhpcy5nZXQoVGVzdENvbXBvbmVudFJlbmRlcmVyKTtcbiAgICBjb25zdCByb290RWxJZCA9IGByb290JHtfbmV4dFJvb3RFbGVtZW50SWQrK31gO1xuICAgIHRlc3RDb21wb25lbnRSZW5kZXJlci5pbnNlcnRSb290RWxlbWVudChyb290RWxJZCk7XG5cbiAgICBjb25zdCBjb21wb25lbnREZWYgPSAodHlwZSBhcyBhbnkpLm5nQ29tcG9uZW50RGVmO1xuXG4gICAgaWYgKCFjb21wb25lbnREZWYpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICBgSXQgbG9va3MgbGlrZSAnJHtzdHJpbmdpZnkodHlwZSl9JyBoYXMgbm90IGJlZW4gSVZZIGNvbXBpbGVkIC0gaXQgaGFzIG5vICduZ0NvbXBvbmVudERlZicgZmllbGRgKTtcbiAgICB9XG5cbiAgICBjb25zdCBub05nWm9uZTogYm9vbGVhbiA9IHRoaXMuZ2V0KENvbXBvbmVudEZpeHR1cmVOb05nWm9uZSwgZmFsc2UpO1xuICAgIGNvbnN0IGF1dG9EZXRlY3Q6IGJvb2xlYW4gPSB0aGlzLmdldChDb21wb25lbnRGaXh0dXJlQXV0b0RldGVjdCwgZmFsc2UpO1xuICAgIGNvbnN0IG5nWm9uZTogTmdab25lID0gbm9OZ1pvbmUgPyBudWxsIDogdGhpcy5nZXQoTmdab25lLCBudWxsKTtcbiAgICBjb25zdCBjb21wb25lbnRGYWN0b3J5ID0gbmV3IENvbXBvbmVudEZhY3RvcnkoY29tcG9uZW50RGVmKTtcbiAgICBjb25zdCBpbml0Q29tcG9uZW50ID0gKCkgPT4ge1xuICAgICAgY29uc3QgY29tcG9uZW50UmVmID1cbiAgICAgICAgICBjb21wb25lbnRGYWN0b3J5LmNyZWF0ZShJbmplY3Rvci5OVUxMLCBbXSwgYCMke3Jvb3RFbElkfWAsIHRoaXMuX21vZHVsZVJlZik7XG4gICAgICByZXR1cm4gbmV3IENvbXBvbmVudEZpeHR1cmU8YW55Pihjb21wb25lbnRSZWYsIG5nWm9uZSwgYXV0b0RldGVjdCk7XG4gICAgfTtcbiAgICBjb25zdCBmaXh0dXJlID0gbmdab25lID8gbmdab25lLnJ1bihpbml0Q29tcG9uZW50KSA6IGluaXRDb21wb25lbnQoKTtcbiAgICB0aGlzLl9hY3RpdmVGaXh0dXJlcy5wdXNoKGZpeHR1cmUpO1xuICAgIHJldHVybiBmaXh0dXJlO1xuICB9XG5cbiAgLy8gaW50ZXJuYWwgbWV0aG9kc1xuXG4gIHByaXZhdGUgX2luaXRJZk5lZWRlZCgpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5faW5zdGFudGlhdGVkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgcmVzb2x2ZXJzID0gdGhpcy5fZ2V0UmVzb2x2ZXJzKCk7XG4gICAgY29uc3QgdGVzdE1vZHVsZVR5cGUgPSB0aGlzLl9jcmVhdGVUZXN0TW9kdWxlKCk7XG5cbiAgICBjb21waWxlTmdNb2R1bGUodGVzdE1vZHVsZVR5cGUsIHJlc29sdmVycyk7XG5cbiAgICBjb25zdCBwYXJlbnRJbmplY3RvciA9IHRoaXMucGxhdGZvcm0uaW5qZWN0b3I7XG4gICAgdGhpcy5fbW9kdWxlUmVmID0gbmV3IE5nTW9kdWxlUmVmKHRlc3RNb2R1bGVUeXBlLCBwYXJlbnRJbmplY3Rvcik7XG5cbiAgICB0aGlzLl9pbnN0YW50aWF0ZWQgPSB0cnVlO1xuICB9XG5cbiAgLy8gY3JlYXRlcyByZXNvbHZlcnMgdGFraW5nIG92ZXJyaWRlcyBpbnRvIGFjY291bnRcbiAgcHJpdmF0ZSBfZ2V0UmVzb2x2ZXJzKCkge1xuICAgIGNvbnN0IG1vZHVsZSA9IG5ldyBOZ01vZHVsZVJlc29sdmVyKCk7XG4gICAgbW9kdWxlLnNldE92ZXJyaWRlcyh0aGlzLl9tb2R1bGVPdmVycmlkZXMpO1xuXG4gICAgY29uc3QgY29tcG9uZW50ID0gbmV3IENvbXBvbmVudFJlc29sdmVyKCk7XG4gICAgY29tcG9uZW50LnNldE92ZXJyaWRlcyh0aGlzLl9jb21wb25lbnRPdmVycmlkZXMpO1xuXG4gICAgY29uc3QgZGlyZWN0aXZlID0gbmV3IERpcmVjdGl2ZVJlc29sdmVyKCk7XG4gICAgZGlyZWN0aXZlLnNldE92ZXJyaWRlcyh0aGlzLl9kaXJlY3RpdmVPdmVycmlkZXMpO1xuXG4gICAgY29uc3QgcGlwZSA9IG5ldyBQaXBlUmVzb2x2ZXIoKTtcbiAgICBwaXBlLnNldE92ZXJyaWRlcyh0aGlzLl9waXBlT3ZlcnJpZGVzKTtcblxuICAgIHJldHVybiB7bW9kdWxlLCBjb21wb25lbnQsIGRpcmVjdGl2ZSwgcGlwZX07XG4gIH1cblxuICBwcml2YXRlIF9hc3NlcnROb3RJbnN0YW50aWF0ZWQobWV0aG9kTmFtZTogc3RyaW5nLCBtZXRob2REZXNjcmlwdGlvbjogc3RyaW5nKSB7XG4gICAgaWYgKHRoaXMuX2luc3RhbnRpYXRlZCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgIGBDYW5ub3QgJHttZXRob2REZXNjcmlwdGlvbn0gd2hlbiB0aGUgdGVzdCBtb2R1bGUgaGFzIGFscmVhZHkgYmVlbiBpbnN0YW50aWF0ZWQuIGAgK1xuICAgICAgICAgIGBNYWtlIHN1cmUgeW91IGFyZSBub3QgdXNpbmcgXFxgaW5qZWN0XFxgIGJlZm9yZSBcXGAke21ldGhvZE5hbWV9XFxgLmApO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgX2NyZWF0ZVRlc3RNb2R1bGUoKTogVHlwZTxhbnk+IHtcbiAgICBjb25zdCByb290UHJvdmlkZXJPdmVycmlkZXMgPSB0aGlzLl9yb290UHJvdmlkZXJPdmVycmlkZXM7XG5cbiAgICBjb25zdCByZW5kZXJlckZhY3RvcnlXcmFwcGVyID0ge1xuICAgICAgcHJvdmlkZTogV1JBUF9SRU5ERVJFUl9GQUNUT1JZMixcbiAgICAgIHVzZUZhY3Rvcnk6ICgpID0+IChyZjogUmVuZGVyZXJGYWN0b3J5MikgPT4gbmV3IFJlbmRlcjNEZWJ1Z1JlbmRlcmVyRmFjdG9yeTIocmYpLFxuICAgIH07XG5cbiAgICBATmdNb2R1bGUoe1xuICAgICAgcHJvdmlkZXJzOiBbLi4ucm9vdFByb3ZpZGVyT3ZlcnJpZGVzLCByZW5kZXJlckZhY3RvcnlXcmFwcGVyXSxcbiAgICAgIGppdDogdHJ1ZSxcbiAgICB9KVxuICAgIGNsYXNzIFJvb3RTY29wZU1vZHVsZSB7XG4gICAgfVxuXG4gICAgY29uc3Qgbmdab25lID0gbmV3IE5nWm9uZSh7ZW5hYmxlTG9uZ1N0YWNrVHJhY2U6IHRydWV9KTtcbiAgICBjb25zdCBwcm92aWRlcnMgPVxuICAgICAgICBbe3Byb3ZpZGU6IE5nWm9uZSwgdXNlVmFsdWU6IG5nWm9uZX0sIC4uLnRoaXMuX3Byb3ZpZGVycywgLi4udGhpcy5fcHJvdmlkZXJPdmVycmlkZXNdO1xuXG4gICAgY29uc3QgZGVjbGFyYXRpb25zID0gdGhpcy5fZGVjbGFyYXRpb25zO1xuICAgIGNvbnN0IGltcG9ydHMgPSBbUm9vdFNjb3BlTW9kdWxlLCB0aGlzLm5nTW9kdWxlLCB0aGlzLl9pbXBvcnRzXTtcbiAgICBjb25zdCBzY2hlbWFzID0gdGhpcy5fc2NoZW1hcztcblxuICAgIEBOZ01vZHVsZSh7cHJvdmlkZXJzLCBkZWNsYXJhdGlvbnMsIGltcG9ydHMsIHNjaGVtYXMsIGppdDogdHJ1ZX0pXG4gICAgY2xhc3MgRHluYW1pY1Rlc3RNb2R1bGUge1xuICAgIH1cblxuICAgIHJldHVybiBEeW5hbWljVGVzdE1vZHVsZTtcbiAgfVxufVxuXG5sZXQgdGVzdEJlZDogVGVzdEJlZFJlbmRlcjM7XG5cbmV4cG9ydCBmdW5jdGlvbiBfZ2V0VGVzdEJlZFJlbmRlcjMoKTogVGVzdEJlZFJlbmRlcjMge1xuICByZXR1cm4gdGVzdEJlZCA9IHRlc3RCZWQgfHwgbmV3IFRlc3RCZWRSZW5kZXIzKCk7XG59XG5cblxuLy8gTW9kdWxlIGNvbXBpbGVyXG5cbmNvbnN0IEVNUFRZX0FSUkFZOiBUeXBlPGFueT5bXSA9IFtdO1xuXG4vLyBSZXNvbHZlcnMgZm9yIEFuZ3VsYXIgZGVjb3JhdG9yc1xudHlwZSBSZXNvbHZlcnMgPSB7XG4gIG1vZHVsZTogUmVzb2x2ZXI8TmdNb2R1bGU+LFxuICBjb21wb25lbnQ6IFJlc29sdmVyPERpcmVjdGl2ZT4sXG4gIGRpcmVjdGl2ZTogUmVzb2x2ZXI8Q29tcG9uZW50PixcbiAgcGlwZTogUmVzb2x2ZXI8UGlwZT4sXG59O1xuXG5mdW5jdGlvbiBjb21waWxlTmdNb2R1bGUobW9kdWxlVHlwZTogVHlwZTxhbnk+LCByZXNvbHZlcnM6IFJlc29sdmVycyk6IHZvaWQge1xuICBjb25zdCBuZ01vZHVsZSA9IHJlc29sdmVycy5tb2R1bGUucmVzb2x2ZShtb2R1bGVUeXBlKTtcblxuICBpZiAobmdNb2R1bGUgPT09IG51bGwpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYCR7c3RyaW5naWZ5KG1vZHVsZVR5cGUpfSBoYXMgbm90IEBOZ01vZHVsZSBhbm5vdGF0aW9uYCk7XG4gIH1cblxuICBjb21waWxlTmdNb2R1bGVEZWZzKG1vZHVsZVR5cGUsIG5nTW9kdWxlKTtcblxuICBjb25zdCBkZWNsYXJhdGlvbnM6IFR5cGU8YW55PltdID0gZmxhdHRlbihuZ01vZHVsZS5kZWNsYXJhdGlvbnMgfHwgRU1QVFlfQVJSQVkpO1xuXG4gIGNvbnN0IGNvbXBpbGVkQ29tcG9uZW50czogVHlwZTxhbnk+W10gPSBbXTtcblxuICAvLyBDb21waWxlIHRoZSBjb21wb25lbnRzLCBkaXJlY3RpdmVzIGFuZCBwaXBlcyBkZWNsYXJlZCBieSB0aGlzIG1vZHVsZVxuICBkZWNsYXJhdGlvbnMuZm9yRWFjaChkZWNsYXJhdGlvbiA9PiB7XG4gICAgY29uc3QgY29tcG9uZW50ID0gcmVzb2x2ZXJzLmNvbXBvbmVudC5yZXNvbHZlKGRlY2xhcmF0aW9uKTtcbiAgICBpZiAoY29tcG9uZW50KSB7XG4gICAgICBjb21waWxlQ29tcG9uZW50KGRlY2xhcmF0aW9uLCBjb21wb25lbnQpO1xuICAgICAgY29tcGlsZWRDb21wb25lbnRzLnB1c2goZGVjbGFyYXRpb24pO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGRpcmVjdGl2ZSA9IHJlc29sdmVycy5kaXJlY3RpdmUucmVzb2x2ZShkZWNsYXJhdGlvbik7XG4gICAgaWYgKGRpcmVjdGl2ZSkge1xuICAgICAgY29tcGlsZURpcmVjdGl2ZShkZWNsYXJhdGlvbiwgZGlyZWN0aXZlKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBwaXBlID0gcmVzb2x2ZXJzLnBpcGUucmVzb2x2ZShkZWNsYXJhdGlvbik7XG4gICAgaWYgKHBpcGUpIHtcbiAgICAgIGNvbXBpbGVQaXBlKGRlY2xhcmF0aW9uLCBwaXBlKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gIH0pO1xuXG4gIC8vIENvbXBpbGUgdHJhbnNpdGl2ZSBtb2R1bGVzLCBjb21wb25lbnRzLCBkaXJlY3RpdmVzIGFuZCBwaXBlc1xuICBjb25zdCB0cmFuc2l0aXZlU2NvcGUgPSB0cmFuc2l0aXZlU2NvcGVzRm9yKG1vZHVsZVR5cGUsIHJlc29sdmVycyk7XG4gIGNvbXBpbGVkQ29tcG9uZW50cy5mb3JFYWNoKFxuICAgICAgY21wID0+IHBhdGNoQ29tcG9uZW50RGVmV2l0aFNjb3BlKChjbXAgYXMgYW55KS5uZ0NvbXBvbmVudERlZiwgdHJhbnNpdGl2ZVNjb3BlKSk7XG59XG5cbi8qKlxuICogQ29tcHV0ZSB0aGUgcGFpciBvZiB0cmFuc2l0aXZlIHNjb3BlcyAoY29tcGlsYXRpb24gc2NvcGUgYW5kIGV4cG9ydGVkIHNjb3BlKSBmb3IgYSBnaXZlbiBtb2R1bGUuXG4gKlxuICogVGhpcyBvcGVyYXRpb24gaXMgbWVtb2l6ZWQgYW5kIHRoZSByZXN1bHQgaXMgY2FjaGVkIG9uIHRoZSBtb2R1bGUncyBkZWZpbml0aW9uLiBJdCBjYW4gYmUgY2FsbGVkXG4gKiBvbiBtb2R1bGVzIHdpdGggY29tcG9uZW50cyB0aGF0IGhhdmUgbm90IGZ1bGx5IGNvbXBpbGVkIHlldCwgYnV0IHRoZSByZXN1bHQgc2hvdWxkIG5vdCBiZSB1c2VkXG4gKiB1bnRpbCB0aGV5IGhhdmUuXG4gKi9cbmZ1bmN0aW9uIHRyYW5zaXRpdmVTY29wZXNGb3I8VD4oXG4gICAgbW9kdWxlVHlwZTogVHlwZTxUPiwgcmVzb2x2ZXJzOiBSZXNvbHZlcnMpOiBOZ01vZHVsZVRyYW5zaXRpdmVTY29wZXMge1xuICBpZiAoIWlzTmdNb2R1bGUobW9kdWxlVHlwZSkpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYCR7bW9kdWxlVHlwZS5uYW1lfSBkb2VzIG5vdCBoYXZlIGFuIG5nTW9kdWxlRGVmYCk7XG4gIH1cbiAgY29uc3QgZGVmID0gbW9kdWxlVHlwZS5uZ01vZHVsZURlZjtcblxuICBpZiAoZGVmLnRyYW5zaXRpdmVDb21waWxlU2NvcGVzICE9PSBudWxsKSB7XG4gICAgcmV0dXJuIGRlZi50cmFuc2l0aXZlQ29tcGlsZVNjb3BlcztcbiAgfVxuXG4gIGNvbnN0IHNjb3BlczogTmdNb2R1bGVUcmFuc2l0aXZlU2NvcGVzID0ge1xuICAgIGNvbXBpbGF0aW9uOiB7XG4gICAgICBkaXJlY3RpdmVzOiBuZXcgU2V0PGFueT4oKSxcbiAgICAgIHBpcGVzOiBuZXcgU2V0PGFueT4oKSxcbiAgICB9LFxuICAgIGV4cG9ydGVkOiB7XG4gICAgICBkaXJlY3RpdmVzOiBuZXcgU2V0PGFueT4oKSxcbiAgICAgIHBpcGVzOiBuZXcgU2V0PGFueT4oKSxcbiAgICB9LFxuICB9O1xuXG4gIGRlZi5kZWNsYXJhdGlvbnMuZm9yRWFjaChkZWNsYXJlZCA9PiB7XG4gICAgY29uc3QgZGVjbGFyZWRXaXRoRGVmcyA9IGRlY2xhcmVkIGFzIFR5cGU8YW55PiYgeyBuZ1BpcGVEZWY/OiBhbnk7IH07XG5cbiAgICBpZiAoZGVjbGFyZWRXaXRoRGVmcy5uZ1BpcGVEZWYgIT09IHVuZGVmaW5lZCkge1xuICAgICAgc2NvcGVzLmNvbXBpbGF0aW9uLnBpcGVzLmFkZChkZWNsYXJlZCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHNjb3Blcy5jb21waWxhdGlvbi5kaXJlY3RpdmVzLmFkZChkZWNsYXJlZCk7XG4gICAgfVxuICB9KTtcblxuICBkZWYuaW1wb3J0cy5mb3JFYWNoKDxJPihpbXBvcnRlZDogVHlwZTxJPikgPT4ge1xuICAgIGNvbnN0IG5nTW9kdWxlID0gcmVzb2x2ZXJzLm1vZHVsZS5yZXNvbHZlKGltcG9ydGVkKTtcblxuICAgIGlmIChuZ01vZHVsZSA9PT0gbnVsbCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBJbXBvcnRpbmcgJHtpbXBvcnRlZC5uYW1lfSB3aGljaCBkb2VzIG5vdCBoYXZlIGFuIEBuZ01vZHVsZWApO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb21waWxlTmdNb2R1bGUoaW1wb3J0ZWQsIHJlc29sdmVycyk7XG4gICAgfVxuXG4gICAgLy8gV2hlbiB0aGlzIG1vZHVsZSBpbXBvcnRzIGFub3RoZXIsIHRoZSBpbXBvcnRlZCBtb2R1bGUncyBleHBvcnRlZCBkaXJlY3RpdmVzIGFuZCBwaXBlcyBhcmVcbiAgICAvLyBhZGRlZCB0byB0aGUgY29tcGlsYXRpb24gc2NvcGUgb2YgdGhpcyBtb2R1bGUuXG4gICAgY29uc3QgaW1wb3J0ZWRTY29wZSA9IHRyYW5zaXRpdmVTY29wZXNGb3IoaW1wb3J0ZWQsIHJlc29sdmVycyk7XG4gICAgaW1wb3J0ZWRTY29wZS5leHBvcnRlZC5kaXJlY3RpdmVzLmZvckVhY2goZW50cnkgPT4gc2NvcGVzLmNvbXBpbGF0aW9uLmRpcmVjdGl2ZXMuYWRkKGVudHJ5KSk7XG4gICAgaW1wb3J0ZWRTY29wZS5leHBvcnRlZC5waXBlcy5mb3JFYWNoKGVudHJ5ID0+IHNjb3Blcy5jb21waWxhdGlvbi5waXBlcy5hZGQoZW50cnkpKTtcbiAgfSk7XG5cbiAgZGVmLmV4cG9ydHMuZm9yRWFjaCg8RT4oZXhwb3J0ZWQ6IFR5cGU8RT4pID0+IHtcbiAgICBjb25zdCBleHBvcnRlZFR5cGVkID0gZXhwb3J0ZWQgYXMgVHlwZTxFPiYge1xuICAgICAgLy8gQ29tcG9uZW50cywgRGlyZWN0aXZlcywgTmdNb2R1bGVzLCBhbmQgUGlwZXMgY2FuIGFsbCBiZSBleHBvcnRlZC5cbiAgICAgIG5nQ29tcG9uZW50RGVmPzogYW55O1xuICAgICAgbmdEaXJlY3RpdmVEZWY/OiBhbnk7XG4gICAgICBuZ01vZHVsZURlZj86IE5nTW9kdWxlRGVmPEU+O1xuICAgICAgbmdQaXBlRGVmPzogYW55O1xuICAgIH07XG5cbiAgICAvLyBFaXRoZXIgdGhlIHR5cGUgaXMgYSBtb2R1bGUsIGEgcGlwZSwgb3IgYSBjb21wb25lbnQvZGlyZWN0aXZlICh3aGljaCBtYXkgbm90IGhhdmUgYW5cbiAgICAvLyBuZ0NvbXBvbmVudERlZiBhcyBpdCBtaWdodCBiZSBjb21waWxlZCBhc3luY2hyb25vdXNseSkuXG4gICAgaWYgKGlzTmdNb2R1bGUoZXhwb3J0ZWRUeXBlZCkpIHtcbiAgICAgIC8vIFdoZW4gdGhpcyBtb2R1bGUgZXhwb3J0cyBhbm90aGVyLCB0aGUgZXhwb3J0ZWQgbW9kdWxlJ3MgZXhwb3J0ZWQgZGlyZWN0aXZlcyBhbmQgcGlwZXMgYXJlXG4gICAgICAvLyBhZGRlZCB0byBib3RoIHRoZSBjb21waWxhdGlvbiBhbmQgZXhwb3J0ZWQgc2NvcGVzIG9mIHRoaXMgbW9kdWxlLlxuICAgICAgY29uc3QgZXhwb3J0ZWRTY29wZSA9IHRyYW5zaXRpdmVTY29wZXNGb3IoZXhwb3J0ZWRUeXBlZCwgcmVzb2x2ZXJzKTtcbiAgICAgIGV4cG9ydGVkU2NvcGUuZXhwb3J0ZWQuZGlyZWN0aXZlcy5mb3JFYWNoKGVudHJ5ID0+IHtcbiAgICAgICAgc2NvcGVzLmNvbXBpbGF0aW9uLmRpcmVjdGl2ZXMuYWRkKGVudHJ5KTtcbiAgICAgICAgc2NvcGVzLmV4cG9ydGVkLmRpcmVjdGl2ZXMuYWRkKGVudHJ5KTtcbiAgICAgIH0pO1xuICAgICAgZXhwb3J0ZWRTY29wZS5leHBvcnRlZC5waXBlcy5mb3JFYWNoKGVudHJ5ID0+IHtcbiAgICAgICAgc2NvcGVzLmNvbXBpbGF0aW9uLnBpcGVzLmFkZChlbnRyeSk7XG4gICAgICAgIHNjb3Blcy5leHBvcnRlZC5waXBlcy5hZGQoZW50cnkpO1xuICAgICAgfSk7XG4gICAgfSBlbHNlIGlmIChleHBvcnRlZFR5cGVkLm5nUGlwZURlZiAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBzY29wZXMuZXhwb3J0ZWQucGlwZXMuYWRkKGV4cG9ydGVkVHlwZWQpO1xuICAgIH0gZWxzZSB7XG4gICAgICBzY29wZXMuZXhwb3J0ZWQuZGlyZWN0aXZlcy5hZGQoZXhwb3J0ZWRUeXBlZCk7XG4gICAgfVxuICB9KTtcblxuICBkZWYudHJhbnNpdGl2ZUNvbXBpbGVTY29wZXMgPSBzY29wZXM7XG4gIHJldHVybiBzY29wZXM7XG59XG5cbmZ1bmN0aW9uIGZsYXR0ZW48VD4odmFsdWVzOiBhbnlbXSk6IFRbXSB7XG4gIGNvbnN0IG91dDogVFtdID0gW107XG4gIHZhbHVlcy5mb3JFYWNoKHZhbHVlID0+IHtcbiAgICBpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHtcbiAgICAgIG91dC5wdXNoKC4uLmZsYXR0ZW48VD4odmFsdWUpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgb3V0LnB1c2godmFsdWUpO1xuICAgIH1cbiAgfSk7XG4gIHJldHVybiBvdXQ7XG59XG5cbmZ1bmN0aW9uIGlzTmdNb2R1bGU8VD4odmFsdWU6IFR5cGU8VD4pOiB2YWx1ZSBpcyBUeXBlPFQ+JntuZ01vZHVsZURlZjogTmdNb2R1bGVEZWY8VD59IHtcbiAgcmV0dXJuICh2YWx1ZSBhc3tuZ01vZHVsZURlZj86IE5nTW9kdWxlRGVmPFQ+fSkubmdNb2R1bGVEZWYgIT09IHVuZGVmaW5lZDtcbn1cbiJdfQ==