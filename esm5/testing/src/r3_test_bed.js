/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as tslib_1 from "tslib";
import { Injector, NgModule, ɵRender3ComponentFactory as ComponentFactory, ɵRender3DebugRendererFactory2 as Render3DebugRendererFactory2, ɵRender3NgModuleRef as NgModuleRef, ɵWRAP_RENDERER_FACTORY2 as WRAP_RENDERER_FACTORY2, ɵcompileComponent as compileComponent, ɵcompileDirective as compileDirective, ɵcompileNgModuleDefs as compileNgModuleDefs, ɵcompilePipe as compilePipe, ɵpatchComponentDefWithScope as patchComponentDefWithScope, ɵstringify as stringify } from '@angular/core';
import { ComponentFixture } from './component_fixture';
import { ComponentResolver, DirectiveResolver, NgModuleResolver, PipeResolver } from './resolvers';
import { ComponentFixtureAutoDetect, TestComponentRenderer } from './test_bed_common';
var _nextRootElementId = 0;
/**
 * @description
 * Configures and initializes environment for unit testing and provides methods for
 * creating components and services in unit tests.
 *
 * TestBed is the primary api for writing unit tests for Angular applications and libraries.
 *
 * Note: Use `TestBed` in tests. It will be set to either `TestBedViewEngine` or `TestBedRender3`
 * according to the compiler used.
 */
var TestBedRender3 = /** @class */ (function () {
    function TestBedRender3() {
        // Properties
        this.platform = null;
        this.ngModule = null;
        // metadata overrides
        this._moduleOverrides = [];
        this._componentOverrides = [];
        this._directiveOverrides = [];
        this._pipeOverrides = [];
        this._providerOverrides = [];
        this._rootProviderOverrides = [];
        // test module configuration
        this._providers = [];
        this._declarations = [];
        this._imports = [];
        this._schemas = [];
        this._activeFixtures = [];
        this._moduleRef = null;
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
     * '@angular/<platform_name>/testing'.
     *
     * @experimental
     */
    TestBedRender3.initTestEnvironment = function (ngModule, platform, aotSummaries) {
        var testBed = _getTestBedRender3();
        testBed.initTestEnvironment(ngModule, platform, aotSummaries);
        return testBed;
    };
    /**
     * Reset the providers for the test injector.
     *
     * @experimental
     */
    TestBedRender3.resetTestEnvironment = function () { _getTestBedRender3().resetTestEnvironment(); };
    TestBedRender3.configureCompiler = function (config) {
        _getTestBedRender3().configureCompiler(config);
        return TestBedRender3;
    };
    /**
     * Allows overriding default providers, directives, pipes, modules of the test injector,
     * which are defined in test_injector.js
     */
    TestBedRender3.configureTestingModule = function (moduleDef) {
        _getTestBedRender3().configureTestingModule(moduleDef);
        return TestBedRender3;
    };
    /**
     * Compile components with a `templateUrl` for the test's NgModule.
     * It is necessary to call this function
     * as fetching urls is asynchronous.
     */
    TestBedRender3.compileComponents = function () { return _getTestBedRender3().compileComponents(); };
    TestBedRender3.overrideModule = function (ngModule, override) {
        _getTestBedRender3().overrideModule(ngModule, override);
        return TestBedRender3;
    };
    TestBedRender3.overrideComponent = function (component, override) {
        _getTestBedRender3().overrideComponent(component, override);
        return TestBedRender3;
    };
    TestBedRender3.overrideDirective = function (directive, override) {
        _getTestBedRender3().overrideDirective(directive, override);
        return TestBedRender3;
    };
    TestBedRender3.overridePipe = function (pipe, override) {
        _getTestBedRender3().overridePipe(pipe, override);
        return TestBedRender3;
    };
    TestBedRender3.overrideTemplate = function (component, template) {
        _getTestBedRender3().overrideComponent(component, { set: { template: template, templateUrl: null } });
        return TestBedRender3;
    };
    /**
     * Overrides the template of the given component, compiling the template
     * in the context of the TestingModule.
     *
     * Note: This works for JIT and AOTed components as well.
     */
    TestBedRender3.overrideTemplateUsingTestingModule = function (component, template) {
        _getTestBedRender3().overrideTemplateUsingTestingModule(component, template);
        return TestBedRender3;
    };
    TestBedRender3.prototype.overrideTemplateUsingTestingModule = function (component, template) {
        throw new Error('Render3TestBed.overrideTemplateUsingTestingModule is not implemented yet');
    };
    TestBedRender3.overrideProvider = function (token, provider) {
        _getTestBedRender3().overrideProvider(token, provider);
        return TestBedRender3;
    };
    TestBedRender3.deprecatedOverrideProvider = function (token, provider) {
        throw new Error('Render3TestBed.deprecatedOverrideProvider is not implemented');
    };
    TestBedRender3.get = function (token, notFoundValue) {
        if (notFoundValue === void 0) { notFoundValue = Injector.THROW_IF_NOT_FOUND; }
        return _getTestBedRender3().get(token, notFoundValue);
    };
    TestBedRender3.createComponent = function (component) {
        return _getTestBedRender3().createComponent(component);
    };
    TestBedRender3.resetTestingModule = function () {
        _getTestBedRender3().resetTestingModule();
        return TestBedRender3;
    };
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
    TestBedRender3.prototype.initTestEnvironment = function (ngModule, platform, aotSummaries) {
        if (this.platform || this.ngModule) {
            throw new Error('Cannot set base providers because it has already been called');
        }
        this.platform = platform;
        this.ngModule = ngModule;
    };
    /**
     * Reset the providers for the test injector.
     *
     * @experimental
     */
    TestBedRender3.prototype.resetTestEnvironment = function () {
        this.resetTestingModule();
        this.platform = null;
        this.ngModule = null;
    };
    TestBedRender3.prototype.resetTestingModule = function () {
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
        this._moduleRef = null;
        this._instantiated = false;
        this._activeFixtures.forEach(function (fixture) {
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
    };
    TestBedRender3.prototype.configureCompiler = function (config) {
        throw new Error('the Render3 compiler is not configurable !');
    };
    TestBedRender3.prototype.configureTestingModule = function (moduleDef) {
        var _a, _b, _c, _d;
        this._assertNotInstantiated('R3TestBed.configureTestingModule', 'configure the test module');
        if (moduleDef.providers) {
            (_a = this._providers).push.apply(_a, tslib_1.__spread(moduleDef.providers));
        }
        if (moduleDef.declarations) {
            (_b = this._declarations).push.apply(_b, tslib_1.__spread(moduleDef.declarations));
        }
        if (moduleDef.imports) {
            (_c = this._imports).push.apply(_c, tslib_1.__spread(moduleDef.imports));
        }
        if (moduleDef.schemas) {
            (_d = this._schemas).push.apply(_d, tslib_1.__spread(moduleDef.schemas));
        }
    };
    // TODO(vicb): implement
    TestBedRender3.prototype.compileComponents = function () {
        throw new Error('Render3TestBed.compileComponents is not implemented yet');
    };
    TestBedRender3.prototype.get = function (token, notFoundValue) {
        if (notFoundValue === void 0) { notFoundValue = Injector.THROW_IF_NOT_FOUND; }
        this._initIfNeeded();
        if (token === TestBedRender3) {
            return this;
        }
        return this._moduleRef.injector.get(token, notFoundValue);
    };
    TestBedRender3.prototype.execute = function (tokens, fn, context) {
        var _this = this;
        this._initIfNeeded();
        var params = tokens.map(function (t) { return _this.get(t); });
        return fn.apply(context, params);
    };
    TestBedRender3.prototype.overrideModule = function (ngModule, override) {
        this._assertNotInstantiated('overrideModule', 'override module metadata');
        this._moduleOverrides.push([ngModule, override]);
    };
    TestBedRender3.prototype.overrideComponent = function (component, override) {
        this._assertNotInstantiated('overrideComponent', 'override component metadata');
        this._componentOverrides.push([component, override]);
    };
    TestBedRender3.prototype.overrideDirective = function (directive, override) {
        this._assertNotInstantiated('overrideDirective', 'override directive metadata');
        this._directiveOverrides.push([directive, override]);
    };
    TestBedRender3.prototype.overridePipe = function (pipe, override) {
        this._assertNotInstantiated('overridePipe', 'override pipe metadata');
        this._pipeOverrides.push([pipe, override]);
    };
    /**
     * Overwrites all providers for the given token with the given provider definition.
     */
    TestBedRender3.prototype.overrideProvider = function (token, provider) {
        var isRoot = (typeof token !== 'string' && token.ngInjectableDef &&
            token.ngInjectableDef.providedIn === 'root');
        var overrides = isRoot ? this._rootProviderOverrides : this._providerOverrides;
        if (provider.useFactory) {
            overrides.push({ provide: token, useFactory: provider.useFactory, deps: provider.deps || [] });
        }
        else {
            overrides.push({ provide: token, useValue: provider.useValue });
        }
    };
    TestBedRender3.prototype.deprecatedOverrideProvider = function (token, provider) {
        throw new Error('No implemented in IVY');
    };
    TestBedRender3.prototype.createComponent = function (type) {
        this._initIfNeeded();
        var testComponentRenderer = this.get(TestComponentRenderer);
        var rootElId = "root" + _nextRootElementId++;
        testComponentRenderer.insertRootElement(rootElId);
        var componentDef = type.ngComponentDef;
        if (!componentDef) {
            throw new Error("It looks like '" + stringify(type) + "' has not been IVY compiled - it has no 'ngComponentDef' field");
        }
        var componentFactory = new ComponentFactory(componentDef);
        var componentRef = componentFactory.create(Injector.NULL, [], "#" + rootElId, this._moduleRef);
        var autoDetect = this.get(ComponentFixtureAutoDetect, false);
        var fixture = new ComponentFixture(componentRef, null, autoDetect);
        this._activeFixtures.push(fixture);
        return fixture;
    };
    // internal methods
    TestBedRender3.prototype._initIfNeeded = function () {
        if (this._instantiated) {
            return;
        }
        var resolvers = this._getResolvers();
        var testModuleType = this._createTestModule();
        compileNgModule(testModuleType, resolvers);
        var parentInjector = this.platform.injector;
        this._moduleRef = new NgModuleRef(testModuleType, parentInjector);
        this._instantiated = true;
    };
    // creates resolvers taking overrides into account
    TestBedRender3.prototype._getResolvers = function () {
        var module = new NgModuleResolver();
        module.setOverrides(this._moduleOverrides);
        var component = new ComponentResolver();
        component.setOverrides(this._componentOverrides);
        var directive = new DirectiveResolver();
        directive.setOverrides(this._directiveOverrides);
        var pipe = new PipeResolver();
        pipe.setOverrides(this._pipeOverrides);
        return { module: module, component: component, directive: directive, pipe: pipe };
    };
    TestBedRender3.prototype._assertNotInstantiated = function (methodName, methodDescription) {
        if (this._instantiated) {
            throw new Error("Cannot " + methodDescription + " when the test module has already been instantiated. " +
                ("Make sure you are not using `inject` before `" + methodName + "`."));
        }
    };
    TestBedRender3.prototype._createTestModule = function () {
        var rootProviderOverrides = this._rootProviderOverrides;
        var rendererFactoryWrapper = {
            provide: WRAP_RENDERER_FACTORY2,
            useFactory: function () { return function (rf) { return new Render3DebugRendererFactory2(rf); }; },
        };
        var RootScopeModule = /** @class */ (function () {
            function RootScopeModule() {
            }
            RootScopeModule = tslib_1.__decorate([
                NgModule({
                    providers: tslib_1.__spread(rootProviderOverrides, [rendererFactoryWrapper]),
                    jit: true,
                })
            ], RootScopeModule);
            return RootScopeModule;
        }());
        var providers = tslib_1.__spread(this._providers, this._providerOverrides);
        var declarations = this._declarations;
        var imports = [RootScopeModule, this.ngModule, this._imports];
        var schemas = this._schemas;
        var DynamicTestModule = /** @class */ (function () {
            function DynamicTestModule() {
            }
            DynamicTestModule = tslib_1.__decorate([
                NgModule({ providers: providers, declarations: declarations, imports: imports, schemas: schemas, jit: true })
            ], DynamicTestModule);
            return DynamicTestModule;
        }());
        return DynamicTestModule;
    };
    return TestBedRender3;
}());
export { TestBedRender3 };
var testBed;
export function _getTestBedRender3() {
    return testBed = testBed || new TestBedRender3();
}
// Module compiler
var EMPTY_ARRAY = [];
function compileNgModule(moduleType, resolvers) {
    var ngModule = resolvers.module.resolve(moduleType);
    if (ngModule === null) {
        throw new Error(stringify(moduleType) + " has not @NgModule annotation");
    }
    compileNgModuleDefs(moduleType, ngModule);
    var declarations = flatten(ngModule.declarations || EMPTY_ARRAY);
    var compiledComponents = [];
    // Compile the components, directives and pipes declared by this module
    declarations.forEach(function (declaration) {
        var component = resolvers.component.resolve(declaration);
        if (component) {
            compileComponent(declaration, component);
            compiledComponents.push(declaration);
            return;
        }
        var directive = resolvers.directive.resolve(declaration);
        if (directive) {
            compileDirective(declaration, directive);
            return;
        }
        var pipe = resolvers.pipe.resolve(declaration);
        if (pipe) {
            compilePipe(declaration, pipe);
            return;
        }
    });
    // Compile transitive modules, components, directives and pipes
    var transitiveScope = transitiveScopesFor(moduleType, resolvers);
    compiledComponents.forEach(function (cmp) { return patchComponentDefWithScope(cmp.ngComponentDef, transitiveScope); });
}
/**
 * Compute the pair of transitive scopes (compilation scope and exported scope) for a given module.
 *
 * This operation is memoized and the result is cached on the module's definition. It can be called
 * on modules with components that have not fully compiled yet, but the result should not be used
 * until they have.
 */
function transitiveScopesFor(moduleType, resolvers) {
    if (!isNgModule(moduleType)) {
        throw new Error(moduleType.name + " does not have an ngModuleDef");
    }
    var def = moduleType.ngModuleDef;
    if (def.transitiveCompileScopes !== null) {
        return def.transitiveCompileScopes;
    }
    var scopes = {
        compilation: {
            directives: new Set(),
            pipes: new Set(),
        },
        exported: {
            directives: new Set(),
            pipes: new Set(),
        },
    };
    def.declarations.forEach(function (declared) {
        var declaredWithDefs = declared;
        if (declaredWithDefs.ngPipeDef !== undefined) {
            scopes.compilation.pipes.add(declared);
        }
        else {
            scopes.compilation.directives.add(declared);
        }
    });
    def.imports.forEach(function (imported) {
        var ngModule = resolvers.module.resolve(imported);
        if (ngModule === null) {
            throw new Error("Importing " + imported.name + " which does not have an @ngModule");
        }
        else {
            compileNgModule(imported, resolvers);
        }
        // When this module imports another, the imported module's exported directives and pipes are
        // added to the compilation scope of this module.
        var importedScope = transitiveScopesFor(imported, resolvers);
        importedScope.exported.directives.forEach(function (entry) { return scopes.compilation.directives.add(entry); });
        importedScope.exported.pipes.forEach(function (entry) { return scopes.compilation.pipes.add(entry); });
    });
    def.exports.forEach(function (exported) {
        var exportedTyped = exported;
        // Either the type is a module, a pipe, or a component/directive (which may not have an
        // ngComponentDef as it might be compiled asynchronously).
        if (isNgModule(exportedTyped)) {
            // When this module exports another, the exported module's exported directives and pipes are
            // added to both the compilation and exported scopes of this module.
            var exportedScope = transitiveScopesFor(exportedTyped, resolvers);
            exportedScope.exported.directives.forEach(function (entry) {
                scopes.compilation.directives.add(entry);
                scopes.exported.directives.add(entry);
            });
            exportedScope.exported.pipes.forEach(function (entry) {
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
function flatten(values) {
    var out = [];
    values.forEach(function (value) {
        if (Array.isArray(value)) {
            out.push.apply(out, tslib_1.__spread(flatten(value)));
        }
        else {
            out.push(value);
        }
    });
    return out;
}
function isNgModule(value) {
    return value.ngModuleDef !== undefined;
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicjNfdGVzdF9iZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3Rlc3Rpbmcvc3JjL3IzX3Rlc3RfYmVkLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7QUFFSCxPQUFPLEVBQXVCLFFBQVEsRUFBRSxRQUFRLEVBQTJLLHdCQUF3QixJQUFJLGdCQUFnQixFQUFFLDZCQUE2QixJQUFJLDRCQUE0QixFQUFFLG1CQUFtQixJQUFJLFdBQVcsRUFBRSx1QkFBdUIsSUFBSSxzQkFBc0IsRUFBRSxpQkFBaUIsSUFBSSxnQkFBZ0IsRUFBRSxpQkFBaUIsSUFBSSxnQkFBZ0IsRUFBRSxvQkFBb0IsSUFBSSxtQkFBbUIsRUFBRSxZQUFZLElBQUksV0FBVyxFQUFFLDJCQUEyQixJQUFJLDBCQUEwQixFQUFFLFVBQVUsSUFBSSxTQUFTLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFFaHFCLE9BQU8sRUFBQyxnQkFBZ0IsRUFBQyxNQUFNLHFCQUFxQixDQUFDO0FBRXJELE9BQU8sRUFBQyxpQkFBaUIsRUFBRSxpQkFBaUIsRUFBRSxnQkFBZ0IsRUFBRSxZQUFZLEVBQVcsTUFBTSxhQUFhLENBQUM7QUFFM0csT0FBTyxFQUFDLDBCQUEwQixFQUFpQixxQkFBcUIsRUFBcUIsTUFBTSxtQkFBbUIsQ0FBQztBQUV2SCxJQUFJLGtCQUFrQixHQUFHLENBQUMsQ0FBQztBQUUzQjs7Ozs7Ozs7O0dBU0c7QUFDSDtJQUFBO1FBd0lFLGFBQWE7UUFFYixhQUFRLEdBQWdCLElBQU0sQ0FBQztRQUMvQixhQUFRLEdBQTBCLElBQU0sQ0FBQztRQUV6QyxxQkFBcUI7UUFDYixxQkFBZ0IsR0FBOEMsRUFBRSxDQUFDO1FBQ2pFLHdCQUFtQixHQUErQyxFQUFFLENBQUM7UUFDckUsd0JBQW1CLEdBQStDLEVBQUUsQ0FBQztRQUNyRSxtQkFBYyxHQUEwQyxFQUFFLENBQUM7UUFD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LENBQUMsQ0FBQztJQUNILE9BQU8sR0FBRyxDQUFDO0FBQ2IsQ0FBQztBQUVELFNBQVMsVUFBVSxDQUFJLEtBQWM7SUFDbkMsT0FBUSxLQUErQyxDQUFDLFdBQVcsS0FBSyxTQUFTLENBQUM7QUFDcEYsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtDb21wb25lbnQsIERpcmVjdGl2ZSwgSW5qZWN0b3IsIE5nTW9kdWxlLCBQaXBlLCBQbGF0Zm9ybVJlZiwgUHJvdmlkZXIsIFJlbmRlcmVyRmFjdG9yeTIsIFNjaGVtYU1ldGFkYXRhLCBUeXBlLCDJtU5nTW9kdWxlRGVmSW50ZXJuYWwgYXMgTmdNb2R1bGVEZWZJbnRlcm5hbCwgybVOZ01vZHVsZVRyYW5zaXRpdmVTY29wZXMgYXMgTmdNb2R1bGVUcmFuc2l0aXZlU2NvcGVzLCDJtVJlbmRlcjNDb21wb25lbnRGYWN0b3J5IGFzIENvbXBvbmVudEZhY3RvcnksIMm1UmVuZGVyM0RlYnVnUmVuZGVyZXJGYWN0b3J5MiBhcyBSZW5kZXIzRGVidWdSZW5kZXJlckZhY3RvcnkyLCDJtVJlbmRlcjNOZ01vZHVsZVJlZiBhcyBOZ01vZHVsZVJlZiwgybVXUkFQX1JFTkRFUkVSX0ZBQ1RPUlkyIGFzIFdSQVBfUkVOREVSRVJfRkFDVE9SWTIsIMm1Y29tcGlsZUNvbXBvbmVudCBhcyBjb21waWxlQ29tcG9uZW50LCDJtWNvbXBpbGVEaXJlY3RpdmUgYXMgY29tcGlsZURpcmVjdGl2ZSwgybVjb21waWxlTmdNb2R1bGVEZWZzIGFzIGNvbXBpbGVOZ01vZHVsZURlZnMsIMm1Y29tcGlsZVBpcGUgYXMgY29tcGlsZVBpcGUsIMm1cGF0Y2hDb21wb25lbnREZWZXaXRoU2NvcGUgYXMgcGF0Y2hDb21wb25lbnREZWZXaXRoU2NvcGUsIMm1c3RyaW5naWZ5IGFzIHN0cmluZ2lmeX0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5cbmltcG9ydCB7Q29tcG9uZW50Rml4dHVyZX0gZnJvbSAnLi9jb21wb25lbnRfZml4dHVyZSc7XG5pbXBvcnQge01ldGFkYXRhT3ZlcnJpZGV9IGZyb20gJy4vbWV0YWRhdGFfb3ZlcnJpZGUnO1xuaW1wb3J0IHtDb21wb25lbnRSZXNvbHZlciwgRGlyZWN0aXZlUmVzb2x2ZXIsIE5nTW9kdWxlUmVzb2x2ZXIsIFBpcGVSZXNvbHZlciwgUmVzb2x2ZXJ9IGZyb20gJy4vcmVzb2x2ZXJzJztcbmltcG9ydCB7VGVzdEJlZH0gZnJvbSAnLi90ZXN0X2JlZCc7XG5pbXBvcnQge0NvbXBvbmVudEZpeHR1cmVBdXRvRGV0ZWN0LCBUZXN0QmVkU3RhdGljLCBUZXN0Q29tcG9uZW50UmVuZGVyZXIsIFRlc3RNb2R1bGVNZXRhZGF0YX0gZnJvbSAnLi90ZXN0X2JlZF9jb21tb24nO1xuXG5sZXQgX25leHRSb290RWxlbWVudElkID0gMDtcblxuLyoqXG4gKiBAZGVzY3JpcHRpb25cbiAqIENvbmZpZ3VyZXMgYW5kIGluaXRpYWxpemVzIGVudmlyb25tZW50IGZvciB1bml0IHRlc3RpbmcgYW5kIHByb3ZpZGVzIG1ldGhvZHMgZm9yXG4gKiBjcmVhdGluZyBjb21wb25lbnRzIGFuZCBzZXJ2aWNlcyBpbiB1bml0IHRlc3RzLlxuICpcbiAqIFRlc3RCZWQgaXMgdGhlIHByaW1hcnkgYXBpIGZvciB3cml0aW5nIHVuaXQgdGVzdHMgZm9yIEFuZ3VsYXIgYXBwbGljYXRpb25zIGFuZCBsaWJyYXJpZXMuXG4gKlxuICogTm90ZTogVXNlIGBUZXN0QmVkYCBpbiB0ZXN0cy4gSXQgd2lsbCBiZSBzZXQgdG8gZWl0aGVyIGBUZXN0QmVkVmlld0VuZ2luZWAgb3IgYFRlc3RCZWRSZW5kZXIzYFxuICogYWNjb3JkaW5nIHRvIHRoZSBjb21waWxlciB1c2VkLlxuICovXG5leHBvcnQgY2xhc3MgVGVzdEJlZFJlbmRlcjMgaW1wbGVtZW50cyBJbmplY3RvciwgVGVzdEJlZCB7XG4gIC8qKlxuICAgKiBJbml0aWFsaXplIHRoZSBlbnZpcm9ubWVudCBmb3IgdGVzdGluZyB3aXRoIGEgY29tcGlsZXIgZmFjdG9yeSwgYSBQbGF0Zm9ybVJlZiwgYW5kIGFuXG4gICAqIGFuZ3VsYXIgbW9kdWxlLiBUaGVzZSBhcmUgY29tbW9uIHRvIGV2ZXJ5IHRlc3QgaW4gdGhlIHN1aXRlLlxuICAgKlxuICAgKiBUaGlzIG1heSBvbmx5IGJlIGNhbGxlZCBvbmNlLCB0byBzZXQgdXAgdGhlIGNvbW1vbiBwcm92aWRlcnMgZm9yIHRoZSBjdXJyZW50IHRlc3RcbiAgICogc3VpdGUgb24gdGhlIGN1cnJlbnQgcGxhdGZvcm0uIElmIHlvdSBhYnNvbHV0ZWx5IG5lZWQgdG8gY2hhbmdlIHRoZSBwcm92aWRlcnMsXG4gICAqIGZpcnN0IHVzZSBgcmVzZXRUZXN0RW52aXJvbm1lbnRgLlxuICAgKlxuICAgKiBUZXN0IG1vZHVsZXMgYW5kIHBsYXRmb3JtcyBmb3IgaW5kaXZpZHVhbCBwbGF0Zm9ybXMgYXJlIGF2YWlsYWJsZSBmcm9tXG4gICAqICdAYW5ndWxhci88cGxhdGZvcm1fbmFtZT4vdGVzdGluZycuXG4gICAqXG4gICAqIEBleHBlcmltZW50YWxcbiAgICovXG4gIHN0YXRpYyBpbml0VGVzdEVudmlyb25tZW50KFxuICAgICAgbmdNb2R1bGU6IFR5cGU8YW55PnxUeXBlPGFueT5bXSwgcGxhdGZvcm06IFBsYXRmb3JtUmVmLCBhb3RTdW1tYXJpZXM/OiAoKSA9PiBhbnlbXSk6IFRlc3RCZWQge1xuICAgIGNvbnN0IHRlc3RCZWQgPSBfZ2V0VGVzdEJlZFJlbmRlcjMoKTtcbiAgICB0ZXN0QmVkLmluaXRUZXN0RW52aXJvbm1lbnQobmdNb2R1bGUsIHBsYXRmb3JtLCBhb3RTdW1tYXJpZXMpO1xuICAgIHJldHVybiB0ZXN0QmVkO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlc2V0IHRoZSBwcm92aWRlcnMgZm9yIHRoZSB0ZXN0IGluamVjdG9yLlxuICAgKlxuICAgKiBAZXhwZXJpbWVudGFsXG4gICAqL1xuICBzdGF0aWMgcmVzZXRUZXN0RW52aXJvbm1lbnQoKTogdm9pZCB7IF9nZXRUZXN0QmVkUmVuZGVyMygpLnJlc2V0VGVzdEVudmlyb25tZW50KCk7IH1cblxuICBzdGF0aWMgY29uZmlndXJlQ29tcGlsZXIoY29uZmlnOiB7cHJvdmlkZXJzPzogYW55W107IHVzZUppdD86IGJvb2xlYW47fSk6IFRlc3RCZWRTdGF0aWMge1xuICAgIF9nZXRUZXN0QmVkUmVuZGVyMygpLmNvbmZpZ3VyZUNvbXBpbGVyKGNvbmZpZyk7XG4gICAgcmV0dXJuIFRlc3RCZWRSZW5kZXIzIGFzIGFueSBhcyBUZXN0QmVkU3RhdGljO1xuICB9XG5cbiAgLyoqXG4gICAqIEFsbG93cyBvdmVycmlkaW5nIGRlZmF1bHQgcHJvdmlkZXJzLCBkaXJlY3RpdmVzLCBwaXBlcywgbW9kdWxlcyBvZiB0aGUgdGVzdCBpbmplY3RvcixcbiAgICogd2hpY2ggYXJlIGRlZmluZWQgaW4gdGVzdF9pbmplY3Rvci5qc1xuICAgKi9cbiAgc3RhdGljIGNvbmZpZ3VyZVRlc3RpbmdNb2R1bGUobW9kdWxlRGVmOiBUZXN0TW9kdWxlTWV0YWRhdGEpOiBUZXN0QmVkU3RhdGljIHtcbiAgICBfZ2V0VGVzdEJlZFJlbmRlcjMoKS5jb25maWd1cmVUZXN0aW5nTW9kdWxlKG1vZHVsZURlZik7XG4gICAgcmV0dXJuIFRlc3RCZWRSZW5kZXIzIGFzIGFueSBhcyBUZXN0QmVkU3RhdGljO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbXBpbGUgY29tcG9uZW50cyB3aXRoIGEgYHRlbXBsYXRlVXJsYCBmb3IgdGhlIHRlc3QncyBOZ01vZHVsZS5cbiAgICogSXQgaXMgbmVjZXNzYXJ5IHRvIGNhbGwgdGhpcyBmdW5jdGlvblxuICAgKiBhcyBmZXRjaGluZyB1cmxzIGlzIGFzeW5jaHJvbm91cy5cbiAgICovXG4gIHN0YXRpYyBjb21waWxlQ29tcG9uZW50cygpOiBQcm9taXNlPGFueT4geyByZXR1cm4gX2dldFRlc3RCZWRSZW5kZXIzKCkuY29tcGlsZUNvbXBvbmVudHMoKTsgfVxuXG4gIHN0YXRpYyBvdmVycmlkZU1vZHVsZShuZ01vZHVsZTogVHlwZTxhbnk+LCBvdmVycmlkZTogTWV0YWRhdGFPdmVycmlkZTxOZ01vZHVsZT4pOiBUZXN0QmVkU3RhdGljIHtcbiAgICBfZ2V0VGVzdEJlZFJlbmRlcjMoKS5vdmVycmlkZU1vZHVsZShuZ01vZHVsZSwgb3ZlcnJpZGUpO1xuICAgIHJldHVybiBUZXN0QmVkUmVuZGVyMyBhcyBhbnkgYXMgVGVzdEJlZFN0YXRpYztcbiAgfVxuXG4gIHN0YXRpYyBvdmVycmlkZUNvbXBvbmVudChjb21wb25lbnQ6IFR5cGU8YW55Piwgb3ZlcnJpZGU6IE1ldGFkYXRhT3ZlcnJpZGU8Q29tcG9uZW50Pik6XG4gICAgICBUZXN0QmVkU3RhdGljIHtcbiAgICBfZ2V0VGVzdEJlZFJlbmRlcjMoKS5vdmVycmlkZUNvbXBvbmVudChjb21wb25lbnQsIG92ZXJyaWRlKTtcbiAgICByZXR1cm4gVGVzdEJlZFJlbmRlcjMgYXMgYW55IGFzIFRlc3RCZWRTdGF0aWM7XG4gIH1cblxuICBzdGF0aWMgb3ZlcnJpZGVEaXJlY3RpdmUoZGlyZWN0aXZlOiBUeXBlPGFueT4sIG92ZXJyaWRlOiBNZXRhZGF0YU92ZXJyaWRlPERpcmVjdGl2ZT4pOlxuICAgICAgVGVzdEJlZFN0YXRpYyB7XG4gICAgX2dldFRlc3RCZWRSZW5kZXIzKCkub3ZlcnJpZGVEaXJlY3RpdmUoZGlyZWN0aXZlLCBvdmVycmlkZSk7XG4gICAgcmV0dXJuIFRlc3RCZWRSZW5kZXIzIGFzIGFueSBhcyBUZXN0QmVkU3RhdGljO1xuICB9XG5cbiAgc3RhdGljIG92ZXJyaWRlUGlwZShwaXBlOiBUeXBlPGFueT4sIG92ZXJyaWRlOiBNZXRhZGF0YU92ZXJyaWRlPFBpcGU+KTogVGVzdEJlZFN0YXRpYyB7XG4gICAgX2dldFRlc3RCZWRSZW5kZXIzKCkub3ZlcnJpZGVQaXBlKHBpcGUsIG92ZXJyaWRlKTtcbiAgICByZXR1cm4gVGVzdEJlZFJlbmRlcjMgYXMgYW55IGFzIFRlc3RCZWRTdGF0aWM7XG4gIH1cblxuICBzdGF0aWMgb3ZlcnJpZGVUZW1wbGF0ZShjb21wb25lbnQ6IFR5cGU8YW55PiwgdGVtcGxhdGU6IHN0cmluZyk6IFRlc3RCZWRTdGF0aWMge1xuICAgIF9nZXRUZXN0QmVkUmVuZGVyMygpLm92ZXJyaWRlQ29tcG9uZW50KGNvbXBvbmVudCwge3NldDoge3RlbXBsYXRlLCB0ZW1wbGF0ZVVybDogbnVsbCAhfX0pO1xuICAgIHJldHVybiBUZXN0QmVkUmVuZGVyMyBhcyBhbnkgYXMgVGVzdEJlZFN0YXRpYztcbiAgfVxuXG4gIC8qKlxuICAgKiBPdmVycmlkZXMgdGhlIHRlbXBsYXRlIG9mIHRoZSBnaXZlbiBjb21wb25lbnQsIGNvbXBpbGluZyB0aGUgdGVtcGxhdGVcbiAgICogaW4gdGhlIGNvbnRleHQgb2YgdGhlIFRlc3RpbmdNb2R1bGUuXG4gICAqXG4gICAqIE5vdGU6IFRoaXMgd29ya3MgZm9yIEpJVCBhbmQgQU9UZWQgY29tcG9uZW50cyBhcyB3ZWxsLlxuICAgKi9cbiAgc3RhdGljIG92ZXJyaWRlVGVtcGxhdGVVc2luZ1Rlc3RpbmdNb2R1bGUoY29tcG9uZW50OiBUeXBlPGFueT4sIHRlbXBsYXRlOiBzdHJpbmcpOiBUZXN0QmVkU3RhdGljIHtcbiAgICBfZ2V0VGVzdEJlZFJlbmRlcjMoKS5vdmVycmlkZVRlbXBsYXRlVXNpbmdUZXN0aW5nTW9kdWxlKGNvbXBvbmVudCwgdGVtcGxhdGUpO1xuICAgIHJldHVybiBUZXN0QmVkUmVuZGVyMyBhcyBhbnkgYXMgVGVzdEJlZFN0YXRpYztcbiAgfVxuXG4gIG92ZXJyaWRlVGVtcGxhdGVVc2luZ1Rlc3RpbmdNb2R1bGUoY29tcG9uZW50OiBUeXBlPGFueT4sIHRlbXBsYXRlOiBzdHJpbmcpOiB2b2lkIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ1JlbmRlcjNUZXN0QmVkLm92ZXJyaWRlVGVtcGxhdGVVc2luZ1Rlc3RpbmdNb2R1bGUgaXMgbm90IGltcGxlbWVudGVkIHlldCcpO1xuICB9XG5cbiAgc3RhdGljIG92ZXJyaWRlUHJvdmlkZXIodG9rZW46IGFueSwgcHJvdmlkZXI6IHtcbiAgICB1c2VGYWN0b3J5OiBGdW5jdGlvbixcbiAgICBkZXBzOiBhbnlbXSxcbiAgfSk6IFRlc3RCZWRTdGF0aWM7XG4gIHN0YXRpYyBvdmVycmlkZVByb3ZpZGVyKHRva2VuOiBhbnksIHByb3ZpZGVyOiB7dXNlVmFsdWU6IGFueTt9KTogVGVzdEJlZFN0YXRpYztcbiAgc3RhdGljIG92ZXJyaWRlUHJvdmlkZXIodG9rZW46IGFueSwgcHJvdmlkZXI6IHtcbiAgICB1c2VGYWN0b3J5PzogRnVuY3Rpb24sXG4gICAgdXNlVmFsdWU/OiBhbnksXG4gICAgZGVwcz86IGFueVtdLFxuICB9KTogVGVzdEJlZFN0YXRpYyB7XG4gICAgX2dldFRlc3RCZWRSZW5kZXIzKCkub3ZlcnJpZGVQcm92aWRlcih0b2tlbiwgcHJvdmlkZXIpO1xuICAgIHJldHVybiBUZXN0QmVkUmVuZGVyMyBhcyBhbnkgYXMgVGVzdEJlZFN0YXRpYztcbiAgfVxuXG4gIC8qKlxuICAgKiBPdmVyd3JpdGVzIGFsbCBwcm92aWRlcnMgZm9yIHRoZSBnaXZlbiB0b2tlbiB3aXRoIHRoZSBnaXZlbiBwcm92aWRlciBkZWZpbml0aW9uLlxuICAgKlxuICAgKiBAZGVwcmVjYXRlZCBhcyBpdCBtYWtlcyBhbGwgTmdNb2R1bGVzIGxhenkuIEludHJvZHVjZWQgb25seSBmb3IgbWlncmF0aW5nIG9mZiBvZiBpdC5cbiAgICovXG4gIHN0YXRpYyBkZXByZWNhdGVkT3ZlcnJpZGVQcm92aWRlcih0b2tlbjogYW55LCBwcm92aWRlcjoge1xuICAgIHVzZUZhY3Rvcnk6IEZ1bmN0aW9uLFxuICAgIGRlcHM6IGFueVtdLFxuICB9KTogdm9pZDtcbiAgc3RhdGljIGRlcHJlY2F0ZWRPdmVycmlkZVByb3ZpZGVyKHRva2VuOiBhbnksIHByb3ZpZGVyOiB7dXNlVmFsdWU6IGFueTt9KTogdm9pZDtcbiAgc3RhdGljIGRlcHJlY2F0ZWRPdmVycmlkZVByb3ZpZGVyKHRva2VuOiBhbnksIHByb3ZpZGVyOiB7XG4gICAgdXNlRmFjdG9yeT86IEZ1bmN0aW9uLFxuICAgIHVzZVZhbHVlPzogYW55LFxuICAgIGRlcHM/OiBhbnlbXSxcbiAgfSk6IFRlc3RCZWRTdGF0aWMge1xuICAgIHRocm93IG5ldyBFcnJvcignUmVuZGVyM1Rlc3RCZWQuZGVwcmVjYXRlZE92ZXJyaWRlUHJvdmlkZXIgaXMgbm90IGltcGxlbWVudGVkJyk7XG4gIH1cblxuICBzdGF0aWMgZ2V0KHRva2VuOiBhbnksIG5vdEZvdW5kVmFsdWU6IGFueSA9IEluamVjdG9yLlRIUk9XX0lGX05PVF9GT1VORCk6IGFueSB7XG4gICAgcmV0dXJuIF9nZXRUZXN0QmVkUmVuZGVyMygpLmdldCh0b2tlbiwgbm90Rm91bmRWYWx1ZSk7XG4gIH1cblxuICBzdGF0aWMgY3JlYXRlQ29tcG9uZW50PFQ+KGNvbXBvbmVudDogVHlwZTxUPik6IENvbXBvbmVudEZpeHR1cmU8VD4ge1xuICAgIHJldHVybiBfZ2V0VGVzdEJlZFJlbmRlcjMoKS5jcmVhdGVDb21wb25lbnQoY29tcG9uZW50KTtcbiAgfVxuXG4gIHN0YXRpYyByZXNldFRlc3RpbmdNb2R1bGUoKTogVGVzdEJlZFN0YXRpYyB7XG4gICAgX2dldFRlc3RCZWRSZW5kZXIzKCkucmVzZXRUZXN0aW5nTW9kdWxlKCk7XG4gICAgcmV0dXJuIFRlc3RCZWRSZW5kZXIzIGFzIGFueSBhcyBUZXN0QmVkU3RhdGljO1xuICB9XG5cbiAgLy8gUHJvcGVydGllc1xuXG4gIHBsYXRmb3JtOiBQbGF0Zm9ybVJlZiA9IG51bGwgITtcbiAgbmdNb2R1bGU6IFR5cGU8YW55PnxUeXBlPGFueT5bXSA9IG51bGwgITtcblxuICAvLyBtZXRhZGF0YSBvdmVycmlkZXNcbiAgcHJpdmF0ZSBfbW9kdWxlT3ZlcnJpZGVzOiBbVHlwZTxhbnk+LCBNZXRhZGF0YU92ZXJyaWRlPE5nTW9kdWxlPl1bXSA9IFtdO1xuICBwcml2YXRlIF9jb21wb25lbnRPdmVycmlkZXM6IFtUeXBlPGFueT4sIE1ldGFkYXRhT3ZlcnJpZGU8Q29tcG9uZW50Pl1bXSA9IFtdO1xuICBwcml2YXRlIF9kaXJlY3RpdmVPdmVycmlkZXM6IFtUeXBlPGFueT4sIE1ldGFkYXRhT3ZlcnJpZGU8RGlyZWN0aXZlPl1bXSA9IFtdO1xuICBwcml2YXRlIF9waXBlT3ZlcnJpZGVzOiBbVHlwZTxhbnk+LCBNZXRhZGF0YU92ZXJyaWRlPFBpcGU+XVtdID0gW107XG4gIHByaXZhdGUgX3Byb3ZpZGVyT3ZlcnJpZGVzOiBQcm92aWRlcltdID0gW107XG4gIHByaXZhdGUgX3Jvb3RQcm92aWRlck92ZXJyaWRlczogUHJvdmlkZXJbXSA9IFtdO1xuXG4gIC8vIHRlc3QgbW9kdWxlIGNvbmZpZ3VyYXRpb25cbiAgcHJpdmF0ZSBfcHJvdmlkZXJzOiBQcm92aWRlcltdID0gW107XG4gIHByaXZhdGUgX2RlY2xhcmF0aW9uczogQXJyYXk8VHlwZTxhbnk+fGFueVtdfGFueT4gPSBbXTtcbiAgcHJpdmF0ZSBfaW1wb3J0czogQXJyYXk8VHlwZTxhbnk+fGFueVtdfGFueT4gPSBbXTtcbiAgcHJpdmF0ZSBfc2NoZW1hczogQXJyYXk8U2NoZW1hTWV0YWRhdGF8YW55W10+ID0gW107XG5cbiAgcHJpdmF0ZSBfYWN0aXZlRml4dHVyZXM6IENvbXBvbmVudEZpeHR1cmU8YW55PltdID0gW107XG5cbiAgcHJpdmF0ZSBfbW9kdWxlUmVmOiBOZ01vZHVsZVJlZjxhbnk+ID0gbnVsbCAhO1xuXG4gIHByaXZhdGUgX2luc3RhbnRpYXRlZDogYm9vbGVhbiA9IGZhbHNlO1xuXG4gIC8qKlxuICAgKiBJbml0aWFsaXplIHRoZSBlbnZpcm9ubWVudCBmb3IgdGVzdGluZyB3aXRoIGEgY29tcGlsZXIgZmFjdG9yeSwgYSBQbGF0Zm9ybVJlZiwgYW5kIGFuXG4gICAqIGFuZ3VsYXIgbW9kdWxlLiBUaGVzZSBhcmUgY29tbW9uIHRvIGV2ZXJ5IHRlc3QgaW4gdGhlIHN1aXRlLlxuICAgKlxuICAgKiBUaGlzIG1heSBvbmx5IGJlIGNhbGxlZCBvbmNlLCB0byBzZXQgdXAgdGhlIGNvbW1vbiBwcm92aWRlcnMgZm9yIHRoZSBjdXJyZW50IHRlc3RcbiAgICogc3VpdGUgb24gdGhlIGN1cnJlbnQgcGxhdGZvcm0uIElmIHlvdSBhYnNvbHV0ZWx5IG5lZWQgdG8gY2hhbmdlIHRoZSBwcm92aWRlcnMsXG4gICAqIGZpcnN0IHVzZSBgcmVzZXRUZXN0RW52aXJvbm1lbnRgLlxuICAgKlxuICAgKiBUZXN0IG1vZHVsZXMgYW5kIHBsYXRmb3JtcyBmb3IgaW5kaXZpZHVhbCBwbGF0Zm9ybXMgYXJlIGF2YWlsYWJsZSBmcm9tXG4gICAqICdAYW5ndWxhci88cGxhdGZvcm1fbmFtZT4vdGVzdGluZycuXG4gICAqXG4gICAqIEBleHBlcmltZW50YWxcbiAgICovXG4gIGluaXRUZXN0RW52aXJvbm1lbnQoXG4gICAgICBuZ01vZHVsZTogVHlwZTxhbnk+fFR5cGU8YW55PltdLCBwbGF0Zm9ybTogUGxhdGZvcm1SZWYsIGFvdFN1bW1hcmllcz86ICgpID0+IGFueVtdKTogdm9pZCB7XG4gICAgaWYgKHRoaXMucGxhdGZvcm0gfHwgdGhpcy5uZ01vZHVsZSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3Qgc2V0IGJhc2UgcHJvdmlkZXJzIGJlY2F1c2UgaXQgaGFzIGFscmVhZHkgYmVlbiBjYWxsZWQnKTtcbiAgICB9XG4gICAgdGhpcy5wbGF0Zm9ybSA9IHBsYXRmb3JtO1xuICAgIHRoaXMubmdNb2R1bGUgPSBuZ01vZHVsZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXNldCB0aGUgcHJvdmlkZXJzIGZvciB0aGUgdGVzdCBpbmplY3Rvci5cbiAgICpcbiAgICogQGV4cGVyaW1lbnRhbFxuICAgKi9cbiAgcmVzZXRUZXN0RW52aXJvbm1lbnQoKTogdm9pZCB7XG4gICAgdGhpcy5yZXNldFRlc3RpbmdNb2R1bGUoKTtcbiAgICB0aGlzLnBsYXRmb3JtID0gbnVsbCAhO1xuICAgIHRoaXMubmdNb2R1bGUgPSBudWxsICE7XG4gIH1cblxuICByZXNldFRlc3RpbmdNb2R1bGUoKTogdm9pZCB7XG4gICAgLy8gcmVzZXQgbWV0YWRhdGEgb3ZlcnJpZGVzXG4gICAgdGhpcy5fbW9kdWxlT3ZlcnJpZGVzID0gW107XG4gICAgdGhpcy5fY29tcG9uZW50T3ZlcnJpZGVzID0gW107XG4gICAgdGhpcy5fZGlyZWN0aXZlT3ZlcnJpZGVzID0gW107XG4gICAgdGhpcy5fcGlwZU92ZXJyaWRlcyA9IFtdO1xuICAgIHRoaXMuX3Byb3ZpZGVyT3ZlcnJpZGVzID0gW107XG4gICAgdGhpcy5fcm9vdFByb3ZpZGVyT3ZlcnJpZGVzID0gW107XG5cbiAgICAvLyByZXNldCB0ZXN0IG1vZHVsZSBjb25maWdcbiAgICB0aGlzLl9wcm92aWRlcnMgPSBbXTtcbiAgICB0aGlzLl9kZWNsYXJhdGlvbnMgPSBbXTtcbiAgICB0aGlzLl9pbXBvcnRzID0gW107XG4gICAgdGhpcy5fc2NoZW1hcyA9IFtdO1xuICAgIHRoaXMuX21vZHVsZVJlZiA9IG51bGwgITtcblxuICAgIHRoaXMuX2luc3RhbnRpYXRlZCA9IGZhbHNlO1xuICAgIHRoaXMuX2FjdGl2ZUZpeHR1cmVzLmZvckVhY2goKGZpeHR1cmUpID0+IHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGZpeHR1cmUuZGVzdHJveSgpO1xuICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBjb25zb2xlLmVycm9yKCdFcnJvciBkdXJpbmcgY2xlYW51cCBvZiBjb21wb25lbnQnLCB7XG4gICAgICAgICAgY29tcG9uZW50OiBmaXh0dXJlLmNvbXBvbmVudEluc3RhbmNlLFxuICAgICAgICAgIHN0YWNrdHJhY2U6IGUsXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHRoaXMuX2FjdGl2ZUZpeHR1cmVzID0gW107XG4gIH1cblxuICBjb25maWd1cmVDb21waWxlcihjb25maWc6IHtwcm92aWRlcnM/OiBhbnlbXTsgdXNlSml0PzogYm9vbGVhbjt9KTogdm9pZCB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCd0aGUgUmVuZGVyMyBjb21waWxlciBpcyBub3QgY29uZmlndXJhYmxlICEnKTtcbiAgfVxuXG4gIGNvbmZpZ3VyZVRlc3RpbmdNb2R1bGUobW9kdWxlRGVmOiBUZXN0TW9kdWxlTWV0YWRhdGEpOiB2b2lkIHtcbiAgICB0aGlzLl9hc3NlcnROb3RJbnN0YW50aWF0ZWQoJ1IzVGVzdEJlZC5jb25maWd1cmVUZXN0aW5nTW9kdWxlJywgJ2NvbmZpZ3VyZSB0aGUgdGVzdCBtb2R1bGUnKTtcbiAgICBpZiAobW9kdWxlRGVmLnByb3ZpZGVycykge1xuICAgICAgdGhpcy5fcHJvdmlkZXJzLnB1c2goLi4ubW9kdWxlRGVmLnByb3ZpZGVycyk7XG4gICAgfVxuICAgIGlmIChtb2R1bGVEZWYuZGVjbGFyYXRpb25zKSB7XG4gICAgICB0aGlzLl9kZWNsYXJhdGlvbnMucHVzaCguLi5tb2R1bGVEZWYuZGVjbGFyYXRpb25zKTtcbiAgICB9XG4gICAgaWYgKG1vZHVsZURlZi5pbXBvcnRzKSB7XG4gICAgICB0aGlzLl9pbXBvcnRzLnB1c2goLi4ubW9kdWxlRGVmLmltcG9ydHMpO1xuICAgIH1cbiAgICBpZiAobW9kdWxlRGVmLnNjaGVtYXMpIHtcbiAgICAgIHRoaXMuX3NjaGVtYXMucHVzaCguLi5tb2R1bGVEZWYuc2NoZW1hcyk7XG4gICAgfVxuICB9XG5cbiAgLy8gVE9ETyh2aWNiKTogaW1wbGVtZW50XG4gIGNvbXBpbGVDb21wb25lbnRzKCk6IFByb21pc2U8YW55PiB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdSZW5kZXIzVGVzdEJlZC5jb21waWxlQ29tcG9uZW50cyBpcyBub3QgaW1wbGVtZW50ZWQgeWV0Jyk7XG4gIH1cblxuICBnZXQodG9rZW46IGFueSwgbm90Rm91bmRWYWx1ZTogYW55ID0gSW5qZWN0b3IuVEhST1dfSUZfTk9UX0ZPVU5EKTogYW55IHtcbiAgICB0aGlzLl9pbml0SWZOZWVkZWQoKTtcbiAgICBpZiAodG9rZW4gPT09IFRlc3RCZWRSZW5kZXIzKSB7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuX21vZHVsZVJlZi5pbmplY3Rvci5nZXQodG9rZW4sIG5vdEZvdW5kVmFsdWUpO1xuICB9XG5cbiAgZXhlY3V0ZSh0b2tlbnM6IGFueVtdLCBmbjogRnVuY3Rpb24sIGNvbnRleHQ/OiBhbnkpOiBhbnkge1xuICAgIHRoaXMuX2luaXRJZk5lZWRlZCgpO1xuICAgIGNvbnN0IHBhcmFtcyA9IHRva2Vucy5tYXAodCA9PiB0aGlzLmdldCh0KSk7XG4gICAgcmV0dXJuIGZuLmFwcGx5KGNvbnRleHQsIHBhcmFtcyk7XG4gIH1cblxuICBvdmVycmlkZU1vZHVsZShuZ01vZHVsZTogVHlwZTxhbnk+LCBvdmVycmlkZTogTWV0YWRhdGFPdmVycmlkZTxOZ01vZHVsZT4pOiB2b2lkIHtcbiAgICB0aGlzLl9hc3NlcnROb3RJbnN0YW50aWF0ZWQoJ292ZXJyaWRlTW9kdWxlJywgJ292ZXJyaWRlIG1vZHVsZSBtZXRhZGF0YScpO1xuICAgIHRoaXMuX21vZHVsZU92ZXJyaWRlcy5wdXNoKFtuZ01vZHVsZSwgb3ZlcnJpZGVdKTtcbiAgfVxuXG4gIG92ZXJyaWRlQ29tcG9uZW50KGNvbXBvbmVudDogVHlwZTxhbnk+LCBvdmVycmlkZTogTWV0YWRhdGFPdmVycmlkZTxDb21wb25lbnQ+KTogdm9pZCB7XG4gICAgdGhpcy5fYXNzZXJ0Tm90SW5zdGFudGlhdGVkKCdvdmVycmlkZUNvbXBvbmVudCcsICdvdmVycmlkZSBjb21wb25lbnQgbWV0YWRhdGEnKTtcbiAgICB0aGlzLl9jb21wb25lbnRPdmVycmlkZXMucHVzaChbY29tcG9uZW50LCBvdmVycmlkZV0pO1xuICB9XG5cbiAgb3ZlcnJpZGVEaXJlY3RpdmUoZGlyZWN0aXZlOiBUeXBlPGFueT4sIG92ZXJyaWRlOiBNZXRhZGF0YU92ZXJyaWRlPERpcmVjdGl2ZT4pOiB2b2lkIHtcbiAgICB0aGlzLl9hc3NlcnROb3RJbnN0YW50aWF0ZWQoJ292ZXJyaWRlRGlyZWN0aXZlJywgJ292ZXJyaWRlIGRpcmVjdGl2ZSBtZXRhZGF0YScpO1xuICAgIHRoaXMuX2RpcmVjdGl2ZU92ZXJyaWRlcy5wdXNoKFtkaXJlY3RpdmUsIG92ZXJyaWRlXSk7XG4gIH1cblxuICBvdmVycmlkZVBpcGUocGlwZTogVHlwZTxhbnk+LCBvdmVycmlkZTogTWV0YWRhdGFPdmVycmlkZTxQaXBlPik6IHZvaWQge1xuICAgIHRoaXMuX2Fzc2VydE5vdEluc3RhbnRpYXRlZCgnb3ZlcnJpZGVQaXBlJywgJ292ZXJyaWRlIHBpcGUgbWV0YWRhdGEnKTtcbiAgICB0aGlzLl9waXBlT3ZlcnJpZGVzLnB1c2goW3BpcGUsIG92ZXJyaWRlXSk7XG4gIH1cblxuICAvKipcbiAgICogT3ZlcndyaXRlcyBhbGwgcHJvdmlkZXJzIGZvciB0aGUgZ2l2ZW4gdG9rZW4gd2l0aCB0aGUgZ2l2ZW4gcHJvdmlkZXIgZGVmaW5pdGlvbi5cbiAgICovXG4gIG92ZXJyaWRlUHJvdmlkZXIodG9rZW46IGFueSwgcHJvdmlkZXI6IHt1c2VGYWN0b3J5PzogRnVuY3Rpb24sIHVzZVZhbHVlPzogYW55LCBkZXBzPzogYW55W119KTpcbiAgICAgIHZvaWQge1xuICAgIGNvbnN0IGlzUm9vdCA9XG4gICAgICAgICh0eXBlb2YgdG9rZW4gIT09ICdzdHJpbmcnICYmIHRva2VuLm5nSW5qZWN0YWJsZURlZiAmJlxuICAgICAgICAgdG9rZW4ubmdJbmplY3RhYmxlRGVmLnByb3ZpZGVkSW4gPT09ICdyb290Jyk7XG4gICAgY29uc3Qgb3ZlcnJpZGVzID0gaXNSb290ID8gdGhpcy5fcm9vdFByb3ZpZGVyT3ZlcnJpZGVzIDogdGhpcy5fcHJvdmlkZXJPdmVycmlkZXM7XG5cbiAgICBpZiAocHJvdmlkZXIudXNlRmFjdG9yeSkge1xuICAgICAgb3ZlcnJpZGVzLnB1c2goe3Byb3ZpZGU6IHRva2VuLCB1c2VGYWN0b3J5OiBwcm92aWRlci51c2VGYWN0b3J5LCBkZXBzOiBwcm92aWRlci5kZXBzIHx8IFtdfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG92ZXJyaWRlcy5wdXNoKHtwcm92aWRlOiB0b2tlbiwgdXNlVmFsdWU6IHByb3ZpZGVyLnVzZVZhbHVlfSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIE92ZXJ3cml0ZXMgYWxsIHByb3ZpZGVycyBmb3IgdGhlIGdpdmVuIHRva2VuIHdpdGggdGhlIGdpdmVuIHByb3ZpZGVyIGRlZmluaXRpb24uXG4gICAqXG4gICAqIEBkZXByZWNhdGVkIGFzIGl0IG1ha2VzIGFsbCBOZ01vZHVsZXMgbGF6eS4gSW50cm9kdWNlZCBvbmx5IGZvciBtaWdyYXRpbmcgb2ZmIG9mIGl0LlxuICAgKi9cbiAgZGVwcmVjYXRlZE92ZXJyaWRlUHJvdmlkZXIodG9rZW46IGFueSwgcHJvdmlkZXI6IHtcbiAgICB1c2VGYWN0b3J5OiBGdW5jdGlvbixcbiAgICBkZXBzOiBhbnlbXSxcbiAgfSk6IHZvaWQ7XG4gIGRlcHJlY2F0ZWRPdmVycmlkZVByb3ZpZGVyKHRva2VuOiBhbnksIHByb3ZpZGVyOiB7dXNlVmFsdWU6IGFueTt9KTogdm9pZDtcbiAgZGVwcmVjYXRlZE92ZXJyaWRlUHJvdmlkZXIoXG4gICAgICB0b2tlbjogYW55LCBwcm92aWRlcjoge3VzZUZhY3Rvcnk/OiBGdW5jdGlvbiwgdXNlVmFsdWU/OiBhbnksIGRlcHM/OiBhbnlbXX0pOiB2b2lkIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ05vIGltcGxlbWVudGVkIGluIElWWScpO1xuICB9XG5cbiAgY3JlYXRlQ29tcG9uZW50PFQ+KHR5cGU6IFR5cGU8VD4pOiBDb21wb25lbnRGaXh0dXJlPFQ+IHtcbiAgICB0aGlzLl9pbml0SWZOZWVkZWQoKTtcblxuICAgIGNvbnN0IHRlc3RDb21wb25lbnRSZW5kZXJlcjogVGVzdENvbXBvbmVudFJlbmRlcmVyID0gdGhpcy5nZXQoVGVzdENvbXBvbmVudFJlbmRlcmVyKTtcbiAgICBjb25zdCByb290RWxJZCA9IGByb290JHtfbmV4dFJvb3RFbGVtZW50SWQrK31gO1xuICAgIHRlc3RDb21wb25lbnRSZW5kZXJlci5pbnNlcnRSb290RWxlbWVudChyb290RWxJZCk7XG5cbiAgICBjb25zdCBjb21wb25lbnREZWYgPSAodHlwZSBhcyBhbnkpLm5nQ29tcG9uZW50RGVmO1xuXG4gICAgaWYgKCFjb21wb25lbnREZWYpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICBgSXQgbG9va3MgbGlrZSAnJHtzdHJpbmdpZnkodHlwZSl9JyBoYXMgbm90IGJlZW4gSVZZIGNvbXBpbGVkIC0gaXQgaGFzIG5vICduZ0NvbXBvbmVudERlZicgZmllbGRgKTtcbiAgICB9XG5cbiAgICBjb25zdCBjb21wb25lbnRGYWN0b3J5ID0gbmV3IENvbXBvbmVudEZhY3RvcnkoY29tcG9uZW50RGVmKTtcbiAgICBjb25zdCBjb21wb25lbnRSZWYgPVxuICAgICAgICBjb21wb25lbnRGYWN0b3J5LmNyZWF0ZShJbmplY3Rvci5OVUxMLCBbXSwgYCMke3Jvb3RFbElkfWAsIHRoaXMuX21vZHVsZVJlZik7XG4gICAgY29uc3QgYXV0b0RldGVjdDogYm9vbGVhbiA9IHRoaXMuZ2V0KENvbXBvbmVudEZpeHR1cmVBdXRvRGV0ZWN0LCBmYWxzZSk7XG4gICAgY29uc3QgZml4dHVyZSA9IG5ldyBDb21wb25lbnRGaXh0dXJlPGFueT4oY29tcG9uZW50UmVmLCBudWxsLCBhdXRvRGV0ZWN0KTtcbiAgICB0aGlzLl9hY3RpdmVGaXh0dXJlcy5wdXNoKGZpeHR1cmUpO1xuICAgIHJldHVybiBmaXh0dXJlO1xuICB9XG5cbiAgLy8gaW50ZXJuYWwgbWV0aG9kc1xuXG4gIHByaXZhdGUgX2luaXRJZk5lZWRlZCgpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5faW5zdGFudGlhdGVkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgcmVzb2x2ZXJzID0gdGhpcy5fZ2V0UmVzb2x2ZXJzKCk7XG4gICAgY29uc3QgdGVzdE1vZHVsZVR5cGUgPSB0aGlzLl9jcmVhdGVUZXN0TW9kdWxlKCk7XG5cbiAgICBjb21waWxlTmdNb2R1bGUodGVzdE1vZHVsZVR5cGUsIHJlc29sdmVycyk7XG5cbiAgICBjb25zdCBwYXJlbnRJbmplY3RvciA9IHRoaXMucGxhdGZvcm0uaW5qZWN0b3I7XG4gICAgdGhpcy5fbW9kdWxlUmVmID0gbmV3IE5nTW9kdWxlUmVmKHRlc3RNb2R1bGVUeXBlLCBwYXJlbnRJbmplY3Rvcik7XG5cbiAgICB0aGlzLl9pbnN0YW50aWF0ZWQgPSB0cnVlO1xuICB9XG5cbiAgLy8gY3JlYXRlcyByZXNvbHZlcnMgdGFraW5nIG92ZXJyaWRlcyBpbnRvIGFjY291bnRcbiAgcHJpdmF0ZSBfZ2V0UmVzb2x2ZXJzKCkge1xuICAgIGNvbnN0IG1vZHVsZSA9IG5ldyBOZ01vZHVsZVJlc29sdmVyKCk7XG4gICAgbW9kdWxlLnNldE92ZXJyaWRlcyh0aGlzLl9tb2R1bGVPdmVycmlkZXMpO1xuXG4gICAgY29uc3QgY29tcG9uZW50ID0gbmV3IENvbXBvbmVudFJlc29sdmVyKCk7XG4gICAgY29tcG9uZW50LnNldE92ZXJyaWRlcyh0aGlzLl9jb21wb25lbnRPdmVycmlkZXMpO1xuXG4gICAgY29uc3QgZGlyZWN0aXZlID0gbmV3IERpcmVjdGl2ZVJlc29sdmVyKCk7XG4gICAgZGlyZWN0aXZlLnNldE92ZXJyaWRlcyh0aGlzLl9kaXJlY3RpdmVPdmVycmlkZXMpO1xuXG4gICAgY29uc3QgcGlwZSA9IG5ldyBQaXBlUmVzb2x2ZXIoKTtcbiAgICBwaXBlLnNldE92ZXJyaWRlcyh0aGlzLl9waXBlT3ZlcnJpZGVzKTtcblxuICAgIHJldHVybiB7bW9kdWxlLCBjb21wb25lbnQsIGRpcmVjdGl2ZSwgcGlwZX07XG4gIH1cblxuICBwcml2YXRlIF9hc3NlcnROb3RJbnN0YW50aWF0ZWQobWV0aG9kTmFtZTogc3RyaW5nLCBtZXRob2REZXNjcmlwdGlvbjogc3RyaW5nKSB7XG4gICAgaWYgKHRoaXMuX2luc3RhbnRpYXRlZCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgIGBDYW5ub3QgJHttZXRob2REZXNjcmlwdGlvbn0gd2hlbiB0aGUgdGVzdCBtb2R1bGUgaGFzIGFscmVhZHkgYmVlbiBpbnN0YW50aWF0ZWQuIGAgK1xuICAgICAgICAgIGBNYWtlIHN1cmUgeW91IGFyZSBub3QgdXNpbmcgXFxgaW5qZWN0XFxgIGJlZm9yZSBcXGAke21ldGhvZE5hbWV9XFxgLmApO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgX2NyZWF0ZVRlc3RNb2R1bGUoKTogVHlwZTxhbnk+IHtcbiAgICBjb25zdCByb290UHJvdmlkZXJPdmVycmlkZXMgPSB0aGlzLl9yb290UHJvdmlkZXJPdmVycmlkZXM7XG5cbiAgICBjb25zdCByZW5kZXJlckZhY3RvcnlXcmFwcGVyID0ge1xuICAgICAgcHJvdmlkZTogV1JBUF9SRU5ERVJFUl9GQUNUT1JZMixcbiAgICAgIHVzZUZhY3Rvcnk6ICgpID0+IChyZjogUmVuZGVyZXJGYWN0b3J5MikgPT4gbmV3IFJlbmRlcjNEZWJ1Z1JlbmRlcmVyRmFjdG9yeTIocmYpLFxuICAgIH07XG5cbiAgICBATmdNb2R1bGUoe1xuICAgICAgcHJvdmlkZXJzOiBbLi4ucm9vdFByb3ZpZGVyT3ZlcnJpZGVzLCByZW5kZXJlckZhY3RvcnlXcmFwcGVyXSxcbiAgICAgIGppdDogdHJ1ZSxcbiAgICB9KVxuICAgIGNsYXNzIFJvb3RTY29wZU1vZHVsZSB7XG4gICAgfVxuXG4gICAgY29uc3QgcHJvdmlkZXJzID0gWy4uLnRoaXMuX3Byb3ZpZGVycywgLi4udGhpcy5fcHJvdmlkZXJPdmVycmlkZXNdO1xuXG4gICAgY29uc3QgZGVjbGFyYXRpb25zID0gdGhpcy5fZGVjbGFyYXRpb25zO1xuICAgIGNvbnN0IGltcG9ydHMgPSBbUm9vdFNjb3BlTW9kdWxlLCB0aGlzLm5nTW9kdWxlLCB0aGlzLl9pbXBvcnRzXTtcbiAgICBjb25zdCBzY2hlbWFzID0gdGhpcy5fc2NoZW1hcztcblxuICAgIEBOZ01vZHVsZSh7cHJvdmlkZXJzLCBkZWNsYXJhdGlvbnMsIGltcG9ydHMsIHNjaGVtYXMsIGppdDogdHJ1ZX0pXG4gICAgY2xhc3MgRHluYW1pY1Rlc3RNb2R1bGUge1xuICAgIH1cblxuICAgIHJldHVybiBEeW5hbWljVGVzdE1vZHVsZTtcbiAgfVxufVxuXG5sZXQgdGVzdEJlZDogVGVzdEJlZFJlbmRlcjM7XG5cbmV4cG9ydCBmdW5jdGlvbiBfZ2V0VGVzdEJlZFJlbmRlcjMoKTogVGVzdEJlZFJlbmRlcjMge1xuICByZXR1cm4gdGVzdEJlZCA9IHRlc3RCZWQgfHwgbmV3IFRlc3RCZWRSZW5kZXIzKCk7XG59XG5cblxuLy8gTW9kdWxlIGNvbXBpbGVyXG5cbmNvbnN0IEVNUFRZX0FSUkFZOiBUeXBlPGFueT5bXSA9IFtdO1xuXG4vLyBSZXNvbHZlcnMgZm9yIEFuZ3VsYXIgZGVjb3JhdG9yc1xudHlwZSBSZXNvbHZlcnMgPSB7XG4gIG1vZHVsZTogUmVzb2x2ZXI8TmdNb2R1bGU+LFxuICBjb21wb25lbnQ6IFJlc29sdmVyPERpcmVjdGl2ZT4sXG4gIGRpcmVjdGl2ZTogUmVzb2x2ZXI8Q29tcG9uZW50PixcbiAgcGlwZTogUmVzb2x2ZXI8UGlwZT4sXG59O1xuXG5mdW5jdGlvbiBjb21waWxlTmdNb2R1bGUobW9kdWxlVHlwZTogVHlwZTxhbnk+LCByZXNvbHZlcnM6IFJlc29sdmVycyk6IHZvaWQge1xuICBjb25zdCBuZ01vZHVsZSA9IHJlc29sdmVycy5tb2R1bGUucmVzb2x2ZShtb2R1bGVUeXBlKTtcblxuICBpZiAobmdNb2R1bGUgPT09IG51bGwpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYCR7c3RyaW5naWZ5KG1vZHVsZVR5cGUpfSBoYXMgbm90IEBOZ01vZHVsZSBhbm5vdGF0aW9uYCk7XG4gIH1cblxuICBjb21waWxlTmdNb2R1bGVEZWZzKG1vZHVsZVR5cGUsIG5nTW9kdWxlKTtcblxuICBjb25zdCBkZWNsYXJhdGlvbnM6IFR5cGU8YW55PltdID0gZmxhdHRlbihuZ01vZHVsZS5kZWNsYXJhdGlvbnMgfHwgRU1QVFlfQVJSQVkpO1xuXG4gIGNvbnN0IGNvbXBpbGVkQ29tcG9uZW50czogVHlwZTxhbnk+W10gPSBbXTtcblxuICAvLyBDb21waWxlIHRoZSBjb21wb25lbnRzLCBkaXJlY3RpdmVzIGFuZCBwaXBlcyBkZWNsYXJlZCBieSB0aGlzIG1vZHVsZVxuICBkZWNsYXJhdGlvbnMuZm9yRWFjaChkZWNsYXJhdGlvbiA9PiB7XG4gICAgY29uc3QgY29tcG9uZW50ID0gcmVzb2x2ZXJzLmNvbXBvbmVudC5yZXNvbHZlKGRlY2xhcmF0aW9uKTtcbiAgICBpZiAoY29tcG9uZW50KSB7XG4gICAgICBjb21waWxlQ29tcG9uZW50KGRlY2xhcmF0aW9uLCBjb21wb25lbnQpO1xuICAgICAgY29tcGlsZWRDb21wb25lbnRzLnB1c2goZGVjbGFyYXRpb24pO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGRpcmVjdGl2ZSA9IHJlc29sdmVycy5kaXJlY3RpdmUucmVzb2x2ZShkZWNsYXJhdGlvbik7XG4gICAgaWYgKGRpcmVjdGl2ZSkge1xuICAgICAgY29tcGlsZURpcmVjdGl2ZShkZWNsYXJhdGlvbiwgZGlyZWN0aXZlKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBwaXBlID0gcmVzb2x2ZXJzLnBpcGUucmVzb2x2ZShkZWNsYXJhdGlvbik7XG4gICAgaWYgKHBpcGUpIHtcbiAgICAgIGNvbXBpbGVQaXBlKGRlY2xhcmF0aW9uLCBwaXBlKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gIH0pO1xuXG4gIC8vIENvbXBpbGUgdHJhbnNpdGl2ZSBtb2R1bGVzLCBjb21wb25lbnRzLCBkaXJlY3RpdmVzIGFuZCBwaXBlc1xuICBjb25zdCB0cmFuc2l0aXZlU2NvcGUgPSB0cmFuc2l0aXZlU2NvcGVzRm9yKG1vZHVsZVR5cGUsIHJlc29sdmVycyk7XG4gIGNvbXBpbGVkQ29tcG9uZW50cy5mb3JFYWNoKFxuICAgICAgY21wID0+IHBhdGNoQ29tcG9uZW50RGVmV2l0aFNjb3BlKChjbXAgYXMgYW55KS5uZ0NvbXBvbmVudERlZiwgdHJhbnNpdGl2ZVNjb3BlKSk7XG59XG5cbi8qKlxuICogQ29tcHV0ZSB0aGUgcGFpciBvZiB0cmFuc2l0aXZlIHNjb3BlcyAoY29tcGlsYXRpb24gc2NvcGUgYW5kIGV4cG9ydGVkIHNjb3BlKSBmb3IgYSBnaXZlbiBtb2R1bGUuXG4gKlxuICogVGhpcyBvcGVyYXRpb24gaXMgbWVtb2l6ZWQgYW5kIHRoZSByZXN1bHQgaXMgY2FjaGVkIG9uIHRoZSBtb2R1bGUncyBkZWZpbml0aW9uLiBJdCBjYW4gYmUgY2FsbGVkXG4gKiBvbiBtb2R1bGVzIHdpdGggY29tcG9uZW50cyB0aGF0IGhhdmUgbm90IGZ1bGx5IGNvbXBpbGVkIHlldCwgYnV0IHRoZSByZXN1bHQgc2hvdWxkIG5vdCBiZSB1c2VkXG4gKiB1bnRpbCB0aGV5IGhhdmUuXG4gKi9cbmZ1bmN0aW9uIHRyYW5zaXRpdmVTY29wZXNGb3I8VD4oXG4gICAgbW9kdWxlVHlwZTogVHlwZTxUPiwgcmVzb2x2ZXJzOiBSZXNvbHZlcnMpOiBOZ01vZHVsZVRyYW5zaXRpdmVTY29wZXMge1xuICBpZiAoIWlzTmdNb2R1bGUobW9kdWxlVHlwZSkpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYCR7bW9kdWxlVHlwZS5uYW1lfSBkb2VzIG5vdCBoYXZlIGFuIG5nTW9kdWxlRGVmYCk7XG4gIH1cbiAgY29uc3QgZGVmID0gbW9kdWxlVHlwZS5uZ01vZHVsZURlZjtcblxuICBpZiAoZGVmLnRyYW5zaXRpdmVDb21waWxlU2NvcGVzICE9PSBudWxsKSB7XG4gICAgcmV0dXJuIGRlZi50cmFuc2l0aXZlQ29tcGlsZVNjb3BlcztcbiAgfVxuXG4gIGNvbnN0IHNjb3BlczogTmdNb2R1bGVUcmFuc2l0aXZlU2NvcGVzID0ge1xuICAgIGNvbXBpbGF0aW9uOiB7XG4gICAgICBkaXJlY3RpdmVzOiBuZXcgU2V0PGFueT4oKSxcbiAgICAgIHBpcGVzOiBuZXcgU2V0PGFueT4oKSxcbiAgICB9LFxuICAgIGV4cG9ydGVkOiB7XG4gICAgICBkaXJlY3RpdmVzOiBuZXcgU2V0PGFueT4oKSxcbiAgICAgIHBpcGVzOiBuZXcgU2V0PGFueT4oKSxcbiAgICB9LFxuICB9O1xuXG4gIGRlZi5kZWNsYXJhdGlvbnMuZm9yRWFjaChkZWNsYXJlZCA9PiB7XG4gICAgY29uc3QgZGVjbGFyZWRXaXRoRGVmcyA9IGRlY2xhcmVkIGFzIFR5cGU8YW55PiYgeyBuZ1BpcGVEZWY/OiBhbnk7IH07XG5cbiAgICBpZiAoZGVjbGFyZWRXaXRoRGVmcy5uZ1BpcGVEZWYgIT09IHVuZGVmaW5lZCkge1xuICAgICAgc2NvcGVzLmNvbXBpbGF0aW9uLnBpcGVzLmFkZChkZWNsYXJlZCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHNjb3Blcy5jb21waWxhdGlvbi5kaXJlY3RpdmVzLmFkZChkZWNsYXJlZCk7XG4gICAgfVxuICB9KTtcblxuICBkZWYuaW1wb3J0cy5mb3JFYWNoKDxJPihpbXBvcnRlZDogVHlwZTxJPikgPT4ge1xuICAgIGNvbnN0IG5nTW9kdWxlID0gcmVzb2x2ZXJzLm1vZHVsZS5yZXNvbHZlKGltcG9ydGVkKTtcblxuICAgIGlmIChuZ01vZHVsZSA9PT0gbnVsbCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBJbXBvcnRpbmcgJHtpbXBvcnRlZC5uYW1lfSB3aGljaCBkb2VzIG5vdCBoYXZlIGFuIEBuZ01vZHVsZWApO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb21waWxlTmdNb2R1bGUoaW1wb3J0ZWQsIHJlc29sdmVycyk7XG4gICAgfVxuXG4gICAgLy8gV2hlbiB0aGlzIG1vZHVsZSBpbXBvcnRzIGFub3RoZXIsIHRoZSBpbXBvcnRlZCBtb2R1bGUncyBleHBvcnRlZCBkaXJlY3RpdmVzIGFuZCBwaXBlcyBhcmVcbiAgICAvLyBhZGRlZCB0byB0aGUgY29tcGlsYXRpb24gc2NvcGUgb2YgdGhpcyBtb2R1bGUuXG4gICAgY29uc3QgaW1wb3J0ZWRTY29wZSA9IHRyYW5zaXRpdmVTY29wZXNGb3IoaW1wb3J0ZWQsIHJlc29sdmVycyk7XG4gICAgaW1wb3J0ZWRTY29wZS5leHBvcnRlZC5kaXJlY3RpdmVzLmZvckVhY2goZW50cnkgPT4gc2NvcGVzLmNvbXBpbGF0aW9uLmRpcmVjdGl2ZXMuYWRkKGVudHJ5KSk7XG4gICAgaW1wb3J0ZWRTY29wZS5leHBvcnRlZC5waXBlcy5mb3JFYWNoKGVudHJ5ID0+IHNjb3Blcy5jb21waWxhdGlvbi5waXBlcy5hZGQoZW50cnkpKTtcbiAgfSk7XG5cbiAgZGVmLmV4cG9ydHMuZm9yRWFjaCg8RT4oZXhwb3J0ZWQ6IFR5cGU8RT4pID0+IHtcbiAgICBjb25zdCBleHBvcnRlZFR5cGVkID0gZXhwb3J0ZWQgYXMgVHlwZTxFPiYge1xuICAgICAgLy8gQ29tcG9uZW50cywgRGlyZWN0aXZlcywgTmdNb2R1bGVzLCBhbmQgUGlwZXMgY2FuIGFsbCBiZSBleHBvcnRlZC5cbiAgICAgIG5nQ29tcG9uZW50RGVmPzogYW55O1xuICAgICAgbmdEaXJlY3RpdmVEZWY/OiBhbnk7XG4gICAgICBuZ01vZHVsZURlZj86IE5nTW9kdWxlRGVmSW50ZXJuYWw8RT47XG4gICAgICBuZ1BpcGVEZWY/OiBhbnk7XG4gICAgfTtcblxuICAgIC8vIEVpdGhlciB0aGUgdHlwZSBpcyBhIG1vZHVsZSwgYSBwaXBlLCBvciBhIGNvbXBvbmVudC9kaXJlY3RpdmUgKHdoaWNoIG1heSBub3QgaGF2ZSBhblxuICAgIC8vIG5nQ29tcG9uZW50RGVmIGFzIGl0IG1pZ2h0IGJlIGNvbXBpbGVkIGFzeW5jaHJvbm91c2x5KS5cbiAgICBpZiAoaXNOZ01vZHVsZShleHBvcnRlZFR5cGVkKSkge1xuICAgICAgLy8gV2hlbiB0aGlzIG1vZHVsZSBleHBvcnRzIGFub3RoZXIsIHRoZSBleHBvcnRlZCBtb2R1bGUncyBleHBvcnRlZCBkaXJlY3RpdmVzIGFuZCBwaXBlcyBhcmVcbiAgICAgIC8vIGFkZGVkIHRvIGJvdGggdGhlIGNvbXBpbGF0aW9uIGFuZCBleHBvcnRlZCBzY29wZXMgb2YgdGhpcyBtb2R1bGUuXG4gICAgICBjb25zdCBleHBvcnRlZFNjb3BlID0gdHJhbnNpdGl2ZVNjb3Blc0ZvcihleHBvcnRlZFR5cGVkLCByZXNvbHZlcnMpO1xuICAgICAgZXhwb3J0ZWRTY29wZS5leHBvcnRlZC5kaXJlY3RpdmVzLmZvckVhY2goZW50cnkgPT4ge1xuICAgICAgICBzY29wZXMuY29tcGlsYXRpb24uZGlyZWN0aXZlcy5hZGQoZW50cnkpO1xuICAgICAgICBzY29wZXMuZXhwb3J0ZWQuZGlyZWN0aXZlcy5hZGQoZW50cnkpO1xuICAgICAgfSk7XG4gICAgICBleHBvcnRlZFNjb3BlLmV4cG9ydGVkLnBpcGVzLmZvckVhY2goZW50cnkgPT4ge1xuICAgICAgICBzY29wZXMuY29tcGlsYXRpb24ucGlwZXMuYWRkKGVudHJ5KTtcbiAgICAgICAgc2NvcGVzLmV4cG9ydGVkLnBpcGVzLmFkZChlbnRyeSk7XG4gICAgICB9KTtcbiAgICB9IGVsc2UgaWYgKGV4cG9ydGVkVHlwZWQubmdQaXBlRGVmICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHNjb3Blcy5leHBvcnRlZC5waXBlcy5hZGQoZXhwb3J0ZWRUeXBlZCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHNjb3Blcy5leHBvcnRlZC5kaXJlY3RpdmVzLmFkZChleHBvcnRlZFR5cGVkKTtcbiAgICB9XG4gIH0pO1xuXG4gIGRlZi50cmFuc2l0aXZlQ29tcGlsZVNjb3BlcyA9IHNjb3BlcztcbiAgcmV0dXJuIHNjb3Blcztcbn1cblxuZnVuY3Rpb24gZmxhdHRlbjxUPih2YWx1ZXM6IGFueVtdKTogVFtdIHtcbiAgY29uc3Qgb3V0OiBUW10gPSBbXTtcbiAgdmFsdWVzLmZvckVhY2godmFsdWUgPT4ge1xuICAgIGlmIChBcnJheS5pc0FycmF5KHZhbHVlKSkge1xuICAgICAgb3V0LnB1c2goLi4uZmxhdHRlbjxUPih2YWx1ZSkpO1xuICAgIH0gZWxzZSB7XG4gICAgICBvdXQucHVzaCh2YWx1ZSk7XG4gICAgfVxuICB9KTtcbiAgcmV0dXJuIG91dDtcbn1cblxuZnVuY3Rpb24gaXNOZ01vZHVsZTxUPih2YWx1ZTogVHlwZTxUPik6IHZhbHVlIGlzIFR5cGU8VD4me25nTW9kdWxlRGVmOiBOZ01vZHVsZURlZkludGVybmFsPFQ+fSB7XG4gIHJldHVybiAodmFsdWUgYXN7bmdNb2R1bGVEZWY/OiBOZ01vZHVsZURlZkludGVybmFsPFQ+fSkubmdNb2R1bGVEZWYgIT09IHVuZGVmaW5lZDtcbn1cbiJdfQ==