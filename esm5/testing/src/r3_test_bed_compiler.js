/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as tslib_1 from "tslib";
import { ResourceLoader } from '@angular/compiler';
import { ApplicationInitStatus, COMPILER_OPTIONS, Compiler, LOCALE_ID, ModuleWithComponentFactories, NgZone, ɵDEFAULT_LOCALE_ID as DEFAULT_LOCALE_ID, ɵNG_COMP_DEF as NG_COMP_DEF, ɵNG_DIRECTIVE_DEF as NG_DIRECTIVE_DEF, ɵNG_INJECTOR_DEF as NG_INJECTOR_DEF, ɵNG_MODULE_DEF as NG_MODULE_DEF, ɵNG_PIPE_DEF as NG_PIPE_DEF, ɵNgModuleFactory as R3NgModuleFactory, ɵRender3ComponentFactory as ComponentFactory, ɵRender3NgModuleRef as NgModuleRef, ɵcompileComponent as compileComponent, ɵcompileDirective as compileDirective, ɵcompileNgModuleDefs as compileNgModuleDefs, ɵcompilePipe as compilePipe, ɵgetInjectableDef as getInjectableDef, ɵpatchComponentDefWithScope as patchComponentDefWithScope, ɵsetLocaleId as setLocaleId, ɵtransitiveScopesFor as transitiveScopesFor } from '@angular/core';
import { getRegisteredModulesState, restoreRegisteredModulesState } from '../../src/linker/ng_module_factory_registration';
import { clearResolutionOfComponentResourcesQueue, isComponentDefPendingResolution, resolveComponentResources, restoreComponentResolutionQueue } from '../../src/metadata/resource_loading';
import { ComponentResolver, DirectiveResolver, NgModuleResolver, PipeResolver } from './resolvers';
var TestingModuleOverride;
(function (TestingModuleOverride) {
    TestingModuleOverride[TestingModuleOverride["DECLARATION"] = 0] = "DECLARATION";
    TestingModuleOverride[TestingModuleOverride["OVERRIDE_TEMPLATE"] = 1] = "OVERRIDE_TEMPLATE";
})(TestingModuleOverride || (TestingModuleOverride = {}));
function isTestingModuleOverride(value) {
    return value === TestingModuleOverride.DECLARATION ||
        value === TestingModuleOverride.OVERRIDE_TEMPLATE;
}
var R3TestBedCompiler = /** @class */ (function () {
    function R3TestBedCompiler(platform, additionalModuleTypes) {
        this.platform = platform;
        this.additionalModuleTypes = additionalModuleTypes;
        this.originalComponentResolutionQueue = null;
        this.originalRegisteredModules = null;
        // Testing module configuration
        this.declarations = [];
        this.imports = [];
        this.providers = [];
        this.schemas = [];
        // Queues of components/directives/pipes that should be recompiled.
        this.pendingComponents = new Set();
        this.pendingDirectives = new Set();
        this.pendingPipes = new Set();
        // Keep track of all components and directives, so we can patch Providers onto defs later.
        this.seenComponents = new Set();
        this.seenDirectives = new Set();
        // Store resolved styles for Components that have template overrides present and `styleUrls`
        // defined at the same time.
        this.existingComponentStyles = new Map();
        this.resolvers = initResolvers();
        this.componentToModuleScope = new Map();
        // Map that keeps initial version of component/directive/pipe defs in case
        // we compile a Type again, thus overriding respective static fields. This is
        // required to make sure we restore defs to their initial states between test runs
        // TODO: we should support the case with multiple defs on a type
        this.initialNgDefs = new Map();
        // Array that keeps cleanup operations for initial versions of component/directive/pipe/module
        // defs in case TestBed makes changes to the originals.
        this.defCleanupOps = [];
        this._injector = null;
        this.compilerProviders = null;
        this.providerOverrides = [];
        this.rootProviderOverrides = [];
        this.providerOverridesByToken = new Map();
        this.moduleProvidersOverridden = new Set();
        this.testModuleRef = null;
        var DynamicTestModule = /** @class */ (function () {
            function DynamicTestModule() {
            }
            return DynamicTestModule;
        }());
        this.testModuleType = DynamicTestModule;
    }
    R3TestBedCompiler.prototype.setCompilerProviders = function (providers) {
        this.compilerProviders = providers;
        this._injector = null;
    };
    R3TestBedCompiler.prototype.configureTestingModule = function (moduleDef) {
        var _a, _b, _c, _d;
        // Enqueue any compilation tasks for the directly declared component.
        if (moduleDef.declarations !== undefined) {
            this.queueTypeArray(moduleDef.declarations, TestingModuleOverride.DECLARATION);
            (_a = this.declarations).push.apply(_a, tslib_1.__spread(moduleDef.declarations));
        }
        // Enqueue any compilation tasks for imported modules.
        if (moduleDef.imports !== undefined) {
            this.queueTypesFromModulesArray(moduleDef.imports);
            (_b = this.imports).push.apply(_b, tslib_1.__spread(moduleDef.imports));
        }
        if (moduleDef.providers !== undefined) {
            (_c = this.providers).push.apply(_c, tslib_1.__spread(moduleDef.providers));
        }
        if (moduleDef.schemas !== undefined) {
            (_d = this.schemas).push.apply(_d, tslib_1.__spread(moduleDef.schemas));
        }
    };
    R3TestBedCompiler.prototype.overrideModule = function (ngModule, override) {
        // Compile the module right away.
        this.resolvers.module.addOverride(ngModule, override);
        var metadata = this.resolvers.module.resolve(ngModule);
        if (metadata === null) {
            throw new Error(ngModule.name + " is not an @NgModule or is missing metadata");
        }
        this.recompileNgModule(ngModule);
        // At this point, the module has a valid .ngModuleDef, but the override may have introduced
        // new declarations or imported modules. Ingest any possible new types and add them to the
        // current queue.
        this.queueTypesFromModulesArray([ngModule]);
    };
    R3TestBedCompiler.prototype.overrideComponent = function (component, override) {
        this.resolvers.component.addOverride(component, override);
        this.pendingComponents.add(component);
    };
    R3TestBedCompiler.prototype.overrideDirective = function (directive, override) {
        this.resolvers.directive.addOverride(directive, override);
        this.pendingDirectives.add(directive);
    };
    R3TestBedCompiler.prototype.overridePipe = function (pipe, override) {
        this.resolvers.pipe.addOverride(pipe, override);
        this.pendingPipes.add(pipe);
    };
    R3TestBedCompiler.prototype.overrideProvider = function (token, provider) {
        var providerDef = provider.useFactory ?
            {
                provide: token,
                useFactory: provider.useFactory,
                deps: provider.deps || [],
                multi: provider.multi,
            } :
            { provide: token, useValue: provider.useValue, multi: provider.multi };
        var injectableDef;
        var isRoot = (typeof token !== 'string' && (injectableDef = getInjectableDef(token)) &&
            injectableDef.providedIn === 'root');
        var overridesBucket = isRoot ? this.rootProviderOverrides : this.providerOverrides;
        overridesBucket.push(providerDef);
        // Keep overrides grouped by token as well for fast lookups using token
        this.providerOverridesByToken.set(token, providerDef);
    };
    R3TestBedCompiler.prototype.overrideTemplateUsingTestingModule = function (type, template) {
        var _this = this;
        var def = type[NG_COMP_DEF];
        var hasStyleUrls = function () {
            var metadata = _this.resolvers.component.resolve(type);
            return !!metadata.styleUrls && metadata.styleUrls.length > 0;
        };
        var overrideStyleUrls = !!def && !isComponentDefPendingResolution(type) && hasStyleUrls();
        // In Ivy, compiling a component does not require knowing the module providing the
        // component's scope, so overrideTemplateUsingTestingModule can be implemented purely via
        // overrideComponent. Important: overriding template requires full Component re-compilation,
        // which may fail in case styleUrls are also present (thus Component is considered as required
        // resolution). In order to avoid this, we preemptively set styleUrls to an empty array,
        // preserve current styles available on Component def and restore styles back once compilation
        // is complete.
        var override = overrideStyleUrls ? { template: template, styles: [], styleUrls: [] } : { template: template };
        this.overrideComponent(type, { set: override });
        if (overrideStyleUrls && def.styles && def.styles.length > 0) {
            this.existingComponentStyles.set(type, def.styles);
        }
        // Set the component's scope to be the testing module.
        this.componentToModuleScope.set(type, TestingModuleOverride.OVERRIDE_TEMPLATE);
    };
    R3TestBedCompiler.prototype.compileComponents = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var needsAsyncResources, resourceLoader_1, resolver;
            var _this = this;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.clearComponentResolutionQueue();
                        needsAsyncResources = this.compileTypesSync();
                        if (!needsAsyncResources) return [3 /*break*/, 2];
                        resolver = function (url) {
                            if (!resourceLoader_1) {
                                resourceLoader_1 = _this.injector.get(ResourceLoader);
                            }
                            return Promise.resolve(resourceLoader_1.get(url));
                        };
                        return [4 /*yield*/, resolveComponentResources(resolver)];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2: return [2 /*return*/];
                }
            });
        });
    };
    R3TestBedCompiler.prototype.finalize = function () {
        // One last compile
        this.compileTypesSync();
        // Create the testing module itself.
        this.compileTestModule();
        this.applyTransitiveScopes();
        this.applyProviderOverrides();
        // Patch previously stored `styles` Component values (taken from ɵcmp), in case these
        // Components have `styleUrls` fields defined and template override was requested.
        this.patchComponentsWithExistingStyles();
        // Clear the componentToModuleScope map, so that future compilations don't reset the scope of
        // every component.
        this.componentToModuleScope.clear();
        var parentInjector = this.platform.injector;
        this.testModuleRef = new NgModuleRef(this.testModuleType, parentInjector);
        // Set the locale ID, it can be overridden for the tests
        var localeId = this.testModuleRef.injector.get(LOCALE_ID, DEFAULT_LOCALE_ID);
        setLocaleId(localeId);
        // ApplicationInitStatus.runInitializers() is marked @internal to core.
        // Cast it to any before accessing it.
        this.testModuleRef.injector.get(ApplicationInitStatus).runInitializers();
        return this.testModuleRef;
    };
    /**
     * @internal
     */
    R3TestBedCompiler.prototype._compileNgModuleSync = function (moduleType) {
        this.queueTypesFromModulesArray([moduleType]);
        this.compileTypesSync();
        this.applyProviderOverrides();
        this.applyProviderOverridesToModule(moduleType);
        this.applyTransitiveScopes();
    };
    /**
     * @internal
     */
    R3TestBedCompiler.prototype._compileNgModuleAsync = function (moduleType) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.originalRegisteredModules === null) {
                            this.originalRegisteredModules = getRegisteredModulesState();
                        }
                        this.queueTypesFromModulesArray([moduleType]);
                        return [4 /*yield*/, this.compileComponents()];
                    case 1:
                        _a.sent();
                        this.applyProviderOverrides();
                        this.applyProviderOverridesToModule(moduleType);
                        this.applyTransitiveScopes();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * @internal
     */
    R3TestBedCompiler.prototype._getModuleResolver = function () { return this.resolvers.module; };
    /**
     * @internal
     */
    R3TestBedCompiler.prototype._getComponentFactories = function (moduleType) {
        var _this = this;
        return maybeUnwrapFn(moduleType.ngModuleDef.declarations).reduce(function (factories, declaration) {
            var componentDef = declaration.ɵcmp;
            componentDef && factories.push(new ComponentFactory(componentDef, _this.testModuleRef));
            return factories;
        }, []);
    };
    R3TestBedCompiler.prototype.compileTypesSync = function () {
        var _this = this;
        // Compile all queued components, directives, pipes.
        var needsAsyncResources = false;
        this.pendingComponents.forEach(function (declaration) {
            needsAsyncResources = needsAsyncResources || isComponentDefPendingResolution(declaration);
            var metadata = _this.resolvers.component.resolve(declaration);
            _this.maybeStoreNgDef(NG_COMP_DEF, declaration);
            compileComponent(declaration, metadata);
        });
        this.pendingComponents.clear();
        this.pendingDirectives.forEach(function (declaration) {
            var metadata = _this.resolvers.directive.resolve(declaration);
            _this.maybeStoreNgDef(NG_DIRECTIVE_DEF, declaration);
            compileDirective(declaration, metadata);
        });
        this.pendingDirectives.clear();
        this.pendingPipes.forEach(function (declaration) {
            var metadata = _this.resolvers.pipe.resolve(declaration);
            _this.maybeStoreNgDef(NG_PIPE_DEF, declaration);
            compilePipe(declaration, metadata);
        });
        this.pendingPipes.clear();
        return needsAsyncResources;
    };
    R3TestBedCompiler.prototype.applyTransitiveScopes = function () {
        var _this = this;
        var moduleToScope = new Map();
        var getScopeOfModule = function (moduleType) {
            if (!moduleToScope.has(moduleType)) {
                var realType = isTestingModuleOverride(moduleType) ? _this.testModuleType : moduleType;
                moduleToScope.set(moduleType, transitiveScopesFor(realType));
            }
            return moduleToScope.get(moduleType);
        };
        this.componentToModuleScope.forEach(function (moduleType, componentType) {
            var moduleScope = getScopeOfModule(moduleType);
            _this.storeFieldOfDefOnType(componentType, NG_COMP_DEF, 'directiveDefs');
            _this.storeFieldOfDefOnType(componentType, NG_COMP_DEF, 'pipeDefs');
            patchComponentDefWithScope(componentType.ɵcmp, moduleScope);
        });
        this.componentToModuleScope.clear();
    };
    R3TestBedCompiler.prototype.applyProviderOverrides = function () {
        var _this = this;
        var maybeApplyOverrides = function (field) { return function (type) {
            var resolver = field === NG_COMP_DEF ? _this.resolvers.component : _this.resolvers.directive;
            var metadata = resolver.resolve(type);
            if (_this.hasProviderOverrides(metadata.providers)) {
                _this.patchDefWithProviderOverrides(type, field);
            }
        }; };
        this.seenComponents.forEach(maybeApplyOverrides(NG_COMP_DEF));
        this.seenDirectives.forEach(maybeApplyOverrides(NG_DIRECTIVE_DEF));
        this.seenComponents.clear();
        this.seenDirectives.clear();
    };
    R3TestBedCompiler.prototype.applyProviderOverridesToModule = function (moduleType) {
        var e_1, _a;
        if (this.moduleProvidersOverridden.has(moduleType)) {
            return;
        }
        this.moduleProvidersOverridden.add(moduleType);
        var injectorDef = moduleType[NG_INJECTOR_DEF];
        if (this.providerOverridesByToken.size > 0) {
            // Extract the list of providers from ModuleWithProviders, so we can define the final list of
            // providers that might have overrides.
            // Note: second `flatten` operation is needed to convert an array of providers
            // (e.g. `[[], []]`) into one flat list, also eliminating empty arrays.
            var providersFromModules = flatten(flatten(injectorDef.imports, function (imported) {
                return isModuleWithProviders(imported) ? imported.providers : [];
            }));
            var providers = tslib_1.__spread(providersFromModules, injectorDef.providers);
            if (this.hasProviderOverrides(providers)) {
                this.maybeStoreNgDef(NG_INJECTOR_DEF, moduleType);
                this.storeFieldOfDefOnType(moduleType, NG_INJECTOR_DEF, 'providers');
                injectorDef.providers = this.getOverriddenProviders(providers);
            }
            // Apply provider overrides to imported modules recursively
            var moduleDef = moduleType[NG_MODULE_DEF];
            try {
                for (var _b = tslib_1.__values(moduleDef.imports), _c = _b.next(); !_c.done; _c = _b.next()) {
                    var importType = _c.value;
                    this.applyProviderOverridesToModule(importType);
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                }
                finally { if (e_1) throw e_1.error; }
            }
        }
    };
    R3TestBedCompiler.prototype.patchComponentsWithExistingStyles = function () {
        this.existingComponentStyles.forEach(function (styles, type) { return type[NG_COMP_DEF].styles = styles; });
        this.existingComponentStyles.clear();
    };
    R3TestBedCompiler.prototype.queueTypeArray = function (arr, moduleType) {
        var e_2, _a;
        try {
            for (var arr_1 = tslib_1.__values(arr), arr_1_1 = arr_1.next(); !arr_1_1.done; arr_1_1 = arr_1.next()) {
                var value = arr_1_1.value;
                if (Array.isArray(value)) {
                    this.queueTypeArray(value, moduleType);
                }
                else {
                    this.queueType(value, moduleType);
                }
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (arr_1_1 && !arr_1_1.done && (_a = arr_1.return)) _a.call(arr_1);
            }
            finally { if (e_2) throw e_2.error; }
        }
    };
    R3TestBedCompiler.prototype.recompileNgModule = function (ngModule) {
        var metadata = this.resolvers.module.resolve(ngModule);
        if (metadata === null) {
            throw new Error("Unable to resolve metadata for NgModule: " + ngModule.name);
        }
        // Cache the initial ngModuleDef as it will be overwritten.
        this.maybeStoreNgDef(NG_MODULE_DEF, ngModule);
        this.maybeStoreNgDef(NG_INJECTOR_DEF, ngModule);
        compileNgModuleDefs(ngModule, metadata);
    };
    R3TestBedCompiler.prototype.queueType = function (type, moduleType) {
        var component = this.resolvers.component.resolve(type);
        if (component) {
            // Check whether a give Type has respective NG def (ɵcmp) and compile if def is
            // missing. That might happen in case a class without any Angular decorators extends another
            // class where Component/Directive/Pipe decorator is defined.
            if (isComponentDefPendingResolution(type) || !type.hasOwnProperty(NG_COMP_DEF)) {
                this.pendingComponents.add(type);
            }
            this.seenComponents.add(type);
            // Keep track of the module which declares this component, so later the component's scope
            // can be set correctly. If the component has already been recorded here, then one of several
            // cases is true:
            // * the module containing the component was imported multiple times (common).
            // * the component is declared in multiple modules (which is an error).
            // * the component was in 'declarations' of the testing module, and also in an imported module
            //   in which case the module scope will be TestingModuleOverride.DECLARATION.
            // * overrideTemplateUsingTestingModule was called for the component in which case the module
            //   scope will be TestingModuleOverride.OVERRIDE_TEMPLATE.
            //
            // If the component was previously in the testing module's 'declarations' (meaning the
            // current value is TestingModuleOverride.DECLARATION), then `moduleType` is the component's
            // real module, which was imported. This pattern is understood to mean that the component
            // should use its original scope, but that the testing module should also contain the
            // component in its scope.
            if (!this.componentToModuleScope.has(type) ||
                this.componentToModuleScope.get(type) === TestingModuleOverride.DECLARATION) {
                this.componentToModuleScope.set(type, moduleType);
            }
            return;
        }
        var directive = this.resolvers.directive.resolve(type);
        if (directive) {
            if (!type.hasOwnProperty(NG_DIRECTIVE_DEF)) {
                this.pendingDirectives.add(type);
            }
            this.seenDirectives.add(type);
            return;
        }
        var pipe = this.resolvers.pipe.resolve(type);
        if (pipe && !type.hasOwnProperty(NG_PIPE_DEF)) {
            this.pendingPipes.add(type);
            return;
        }
    };
    R3TestBedCompiler.prototype.queueTypesFromModulesArray = function (arr) {
        var e_3, _a;
        try {
            for (var arr_2 = tslib_1.__values(arr), arr_2_1 = arr_2.next(); !arr_2_1.done; arr_2_1 = arr_2.next()) {
                var value = arr_2_1.value;
                if (Array.isArray(value)) {
                    this.queueTypesFromModulesArray(value);
                }
                else if (hasNgModuleDef(value)) {
                    var def = value.ngModuleDef;
                    // Look through declarations, imports, and exports, and queue everything found there.
                    this.queueTypeArray(maybeUnwrapFn(def.declarations), value);
                    this.queueTypesFromModulesArray(maybeUnwrapFn(def.imports));
                    this.queueTypesFromModulesArray(maybeUnwrapFn(def.exports));
                }
            }
        }
        catch (e_3_1) { e_3 = { error: e_3_1 }; }
        finally {
            try {
                if (arr_2_1 && !arr_2_1.done && (_a = arr_2.return)) _a.call(arr_2);
            }
            finally { if (e_3) throw e_3.error; }
        }
    };
    R3TestBedCompiler.prototype.maybeStoreNgDef = function (prop, type) {
        if (!this.initialNgDefs.has(type)) {
            var currentDef = Object.getOwnPropertyDescriptor(type, prop);
            this.initialNgDefs.set(type, [prop, currentDef]);
        }
    };
    R3TestBedCompiler.prototype.storeFieldOfDefOnType = function (type, defField, field) {
        var def = type[defField];
        var original = def[field];
        this.defCleanupOps.push({ field: field, def: def, original: original });
    };
    /**
     * Clears current components resolution queue, but stores the state of the queue, so we can
     * restore it later. Clearing the queue is required before we try to compile components (via
     * `TestBed.compileComponents`), so that component defs are in sync with the resolution queue.
     */
    R3TestBedCompiler.prototype.clearComponentResolutionQueue = function () {
        var _this = this;
        if (this.originalComponentResolutionQueue === null) {
            this.originalComponentResolutionQueue = new Map();
        }
        clearResolutionOfComponentResourcesQueue().forEach(function (value, key) { return _this.originalComponentResolutionQueue.set(key, value); });
    };
    /*
     * Restores component resolution queue to the previously saved state. This operation is performed
     * as a part of restoring the state after completion of the current set of tests (that might
     * potentially mutate the state).
     */
    R3TestBedCompiler.prototype.restoreComponentResolutionQueue = function () {
        if (this.originalComponentResolutionQueue !== null) {
            restoreComponentResolutionQueue(this.originalComponentResolutionQueue);
            this.originalComponentResolutionQueue = null;
        }
    };
    R3TestBedCompiler.prototype.restoreOriginalState = function () {
        // Process cleanup ops in reverse order so the field's original value is restored correctly (in
        // case there were multiple overrides for the same field).
        forEachRight(this.defCleanupOps, function (op) { op.def[op.field] = op.original; });
        // Restore initial component/directive/pipe defs
        this.initialNgDefs.forEach(function (value, type) {
            var _a = tslib_1.__read(value, 2), prop = _a[0], descriptor = _a[1];
            if (!descriptor) {
                // Delete operations are generally undesirable since they have performance implications
                // on objects they were applied to. In this particular case, situations where this code
                // is invoked should be quite rare to cause any noticeable impact, since it's applied
                // only to some test cases (for example when class with no annotations extends some
                // @Component) when we need to clear 'ɵcmp' field on a given class to restore
                // its original state (before applying overrides and running tests).
                delete type[prop];
            }
            else {
                Object.defineProperty(type, prop, descriptor);
            }
        });
        this.initialNgDefs.clear();
        this.moduleProvidersOverridden.clear();
        this.restoreComponentResolutionQueue();
        if (this.originalRegisteredModules) {
            restoreRegisteredModulesState(this.originalRegisteredModules);
            this.originalRegisteredModules = null;
        }
        // Restore the locale ID to the default value, this shouldn't be necessary but we never know
        setLocaleId(DEFAULT_LOCALE_ID);
    };
    R3TestBedCompiler.prototype.compileTestModule = function () {
        var _this = this;
        var RootScopeModule = /** @class */ (function () {
            function RootScopeModule() {
            }
            return RootScopeModule;
        }());
        compileNgModuleDefs(RootScopeModule, {
            providers: tslib_1.__spread(this.rootProviderOverrides),
        });
        var ngZone = new NgZone({ enableLongStackTrace: true });
        var providers = tslib_1.__spread([
            { provide: NgZone, useValue: ngZone },
            { provide: Compiler, useFactory: function () { return new R3TestCompiler(_this); } }
        ], this.providers, this.providerOverrides);
        var imports = [RootScopeModule, this.additionalModuleTypes, this.imports || []];
        // clang-format off
        compileNgModuleDefs(this.testModuleType, {
            declarations: this.declarations,
            imports: imports,
            schemas: this.schemas,
            providers: providers,
        }, /* allowDuplicateDeclarationsInRoot */ true);
        // clang-format on
        this.applyProviderOverridesToModule(this.testModuleType);
    };
    Object.defineProperty(R3TestBedCompiler.prototype, "injector", {
        get: function () {
            if (this._injector !== null) {
                return this._injector;
            }
            var providers = [];
            var compilerOptions = this.platform.injector.get(COMPILER_OPTIONS);
            compilerOptions.forEach(function (opts) {
                if (opts.providers) {
                    providers.push(opts.providers);
                }
            });
            if (this.compilerProviders !== null) {
                providers.push.apply(providers, tslib_1.__spread(this.compilerProviders));
            }
            // TODO(ocombe): make this work with an Injector directly instead of creating a module for it
            var CompilerModule = /** @class */ (function () {
                function CompilerModule() {
                }
                return CompilerModule;
            }());
            compileNgModuleDefs(CompilerModule, { providers: providers });
            var CompilerModuleFactory = new R3NgModuleFactory(CompilerModule);
            this._injector = CompilerModuleFactory.create(this.platform.injector).injector;
            return this._injector;
        },
        enumerable: true,
        configurable: true
    });
    // get overrides for a specific provider (if any)
    R3TestBedCompiler.prototype.getSingleProviderOverrides = function (provider) {
        var token = getProviderToken(provider);
        return this.providerOverridesByToken.get(token) || null;
    };
    R3TestBedCompiler.prototype.getProviderOverrides = function (providers) {
        var _this = this;
        if (!providers || !providers.length || this.providerOverridesByToken.size === 0)
            return [];
        // There are two flattening operations here. The inner flatten() operates on the metadata's
        // providers and applies a mapping function which retrieves overrides for each incoming
        // provider. The outer flatten() then flattens the produced overrides array. If this is not
        // done, the array can contain other empty arrays (e.g. `[[], []]`) which leak into the
        // providers array and contaminate any error messages that might be generated.
        return flatten(flatten(providers, function (provider) { return _this.getSingleProviderOverrides(provider) || []; }));
    };
    R3TestBedCompiler.prototype.getOverriddenProviders = function (providers) {
        var _this = this;
        if (!providers || !providers.length || this.providerOverridesByToken.size === 0)
            return [];
        var overrides = this.getProviderOverrides(providers);
        var hasMultiProviderOverrides = overrides.some(isMultiProvider);
        var overriddenProviders = tslib_1.__spread(providers, overrides);
        // No additional processing is required in case we have no multi providers to override
        if (!hasMultiProviderOverrides) {
            return overriddenProviders;
        }
        var final = [];
        var seenMultiProviders = new Set();
        // We iterate through the list of providers in reverse order to make sure multi provider
        // overrides take precedence over the values defined in provider list. We also fiter out all
        // multi providers that have overrides, keeping overridden values only.
        forEachRight(overriddenProviders, function (provider) {
            var token = getProviderToken(provider);
            if (isMultiProvider(provider) && _this.providerOverridesByToken.has(token)) {
                if (!seenMultiProviders.has(token)) {
                    seenMultiProviders.add(token);
                    if (provider && provider.useValue && Array.isArray(provider.useValue)) {
                        forEachRight(provider.useValue, function (value) {
                            // Unwrap provider override array into individual providers in final set.
                            final.unshift({ provide: token, useValue: value, multi: true });
                        });
                    }
                    else {
                        final.unshift(provider);
                    }
                }
            }
            else {
                final.unshift(provider);
            }
        });
        return final;
    };
    R3TestBedCompiler.prototype.hasProviderOverrides = function (providers) {
        return this.getProviderOverrides(providers).length > 0;
    };
    R3TestBedCompiler.prototype.patchDefWithProviderOverrides = function (declaration, field) {
        var _this = this;
        var def = declaration[field];
        if (def && def.providersResolver) {
            this.maybeStoreNgDef(field, declaration);
            var resolver_1 = def.providersResolver;
            var processProvidersFn_1 = function (providers) { return _this.getOverriddenProviders(providers); };
            this.storeFieldOfDefOnType(declaration, field, 'providersResolver');
            def.providersResolver = function (ngDef) { return resolver_1(ngDef, processProvidersFn_1); };
        }
    };
    return R3TestBedCompiler;
}());
export { R3TestBedCompiler };
function initResolvers() {
    return {
        module: new NgModuleResolver(),
        component: new ComponentResolver(),
        directive: new DirectiveResolver(),
        pipe: new PipeResolver()
    };
}
function hasNgModuleDef(value) {
    return value.hasOwnProperty('ngModuleDef');
}
function maybeUnwrapFn(maybeFn) {
    return maybeFn instanceof Function ? maybeFn() : maybeFn;
}
function flatten(values, mapFn) {
    var out = [];
    values.forEach(function (value) {
        if (Array.isArray(value)) {
            out.push.apply(out, tslib_1.__spread(flatten(value, mapFn)));
        }
        else {
            out.push(mapFn ? mapFn(value) : value);
        }
    });
    return out;
}
function getProviderField(provider, field) {
    return provider && typeof provider === 'object' && provider[field];
}
function getProviderToken(provider) {
    return getProviderField(provider, 'provide') || provider;
}
function isMultiProvider(provider) {
    return !!getProviderField(provider, 'multi');
}
function isModuleWithProviders(value) {
    return value.hasOwnProperty('ngModule');
}
function forEachRight(values, fn) {
    for (var idx = values.length - 1; idx >= 0; idx--) {
        fn(values[idx], idx);
    }
}
var R3TestCompiler = /** @class */ (function () {
    function R3TestCompiler(testBed) {
        this.testBed = testBed;
    }
    R3TestCompiler.prototype.compileModuleSync = function (moduleType) {
        this.testBed._compileNgModuleSync(moduleType);
        return new R3NgModuleFactory(moduleType);
    };
    R3TestCompiler.prototype.compileModuleAsync = function (moduleType) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.testBed._compileNgModuleAsync(moduleType)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, new R3NgModuleFactory(moduleType)];
                }
            });
        });
    };
    R3TestCompiler.prototype.compileModuleAndAllComponentsSync = function (moduleType) {
        var ngModuleFactory = this.compileModuleSync(moduleType);
        var componentFactories = this.testBed._getComponentFactories(moduleType);
        return new ModuleWithComponentFactories(ngModuleFactory, componentFactories);
    };
    R3TestCompiler.prototype.compileModuleAndAllComponentsAsync = function (moduleType) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var ngModuleFactory, componentFactories;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.compileModuleAsync(moduleType)];
                    case 1:
                        ngModuleFactory = _a.sent();
                        componentFactories = this.testBed._getComponentFactories(moduleType);
                        return [2 /*return*/, new ModuleWithComponentFactories(ngModuleFactory, componentFactories)];
                }
            });
        });
    };
    R3TestCompiler.prototype.clearCache = function () { };
    R3TestCompiler.prototype.clearCacheFor = function (type) { };
    R3TestCompiler.prototype.getModuleId = function (moduleType) {
        var meta = this.testBed._getModuleResolver().resolve(moduleType);
        return meta && meta.id || undefined;
    };
    return R3TestCompiler;
}());
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicjNfdGVzdF9iZWRfY29tcGlsZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3Rlc3Rpbmcvc3JjL3IzX3Rlc3RfYmVkX2NvbXBpbGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7QUFFSCxPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDakQsT0FBTyxFQUFDLHFCQUFxQixFQUFFLGdCQUFnQixFQUFFLFFBQVEsRUFBa0MsU0FBUyxFQUFFLDRCQUE0QixFQUFrRCxNQUFNLEVBQXFDLGtCQUFrQixJQUFJLGlCQUFpQixFQUFpQyxZQUFZLElBQUksV0FBVyxFQUFFLGlCQUFpQixJQUFJLGdCQUFnQixFQUFFLGdCQUFnQixJQUFJLGVBQWUsRUFBRSxjQUFjLElBQUksYUFBYSxFQUFFLFlBQVksSUFBSSxXQUFXLEVBQUUsZ0JBQWdCLElBQUksaUJBQWlCLEVBQXdGLHdCQUF3QixJQUFJLGdCQUFnQixFQUFFLG1CQUFtQixJQUFJLFdBQVcsRUFBRSxpQkFBaUIsSUFBSSxnQkFBZ0IsRUFBRSxpQkFBaUIsSUFBSSxnQkFBZ0IsRUFBRSxvQkFBb0IsSUFBSSxtQkFBbUIsRUFBRSxZQUFZLElBQUksV0FBVyxFQUFFLGlCQUFpQixJQUFJLGdCQUFnQixFQUFFLDJCQUEyQixJQUFJLDBCQUEwQixFQUFFLFlBQVksSUFBSSxXQUFXLEVBQUUsb0JBQW9CLElBQUksbUJBQW1CLEVBQW1DLE1BQU0sZUFBZSxDQUFDO0FBQ3hoQyxPQUFPLEVBQXdCLHlCQUF5QixFQUFFLDZCQUE2QixFQUFDLE1BQU0saURBQWlELENBQUM7QUFFaEosT0FBTyxFQUFDLHdDQUF3QyxFQUFFLCtCQUErQixFQUFFLHlCQUF5QixFQUFFLCtCQUErQixFQUFDLE1BQU0scUNBQXFDLENBQUM7QUFHMUwsT0FBTyxFQUFDLGlCQUFpQixFQUFFLGlCQUFp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QztJQUMvRSxDQUFDO0lBRUssMkRBQWtDLEdBQXhDLFVBQTRDLFVBQW1COzs7Ozs0QkFFckMscUJBQU0sSUFBSSxDQUFDLGtCQUFrQixDQUFDLFVBQVUsQ0FBQyxFQUFBOzt3QkFBM0QsZUFBZSxHQUFHLFNBQXlDO3dCQUMzRCxrQkFBa0IsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLHNCQUFzQixDQUFDLFVBQTZCLENBQUMsQ0FBQzt3QkFDOUYsc0JBQU8sSUFBSSw0QkFBNEIsQ0FBQyxlQUFlLEVBQUUsa0JBQWtCLENBQUMsRUFBQzs7OztLQUM5RTtJQUVELG1DQUFVLEdBQVYsY0FBb0IsQ0FBQztJQUVyQixzQ0FBYSxHQUFiLFVBQWMsSUFBZSxJQUFTLENBQUM7SUFFdkMsb0NBQVcsR0FBWCxVQUFZLFVBQXFCO1FBQy9CLElBQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsa0JBQWtCLEVBQUUsQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDbkUsT0FBTyxJQUFJLElBQUksSUFBSSxDQUFDLEVBQUUsSUFBSSxTQUFTLENBQUM7SUFDdEMsQ0FBQztJQUNILHFCQUFDO0FBQUQsQ0FBQyxBQWxDRCxJQWtDQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtSZXNvdXJjZUxvYWRlcn0gZnJvbSAnQGFuZ3VsYXIvY29tcGlsZXInO1xuaW1wb3J0IHtBcHBsaWNhdGlvbkluaXRTdGF0dXMsIENPTVBJTEVSX09QVElPTlMsIENvbXBpbGVyLCBDb21wb25lbnQsIERpcmVjdGl2ZSwgSW5qZWN0b3IsIExPQ0FMRV9JRCwgTW9kdWxlV2l0aENvbXBvbmVudEZhY3RvcmllcywgTW9kdWxlV2l0aFByb3ZpZGVycywgTmdNb2R1bGUsIE5nTW9kdWxlRmFjdG9yeSwgTmdab25lLCBQaXBlLCBQbGF0Zm9ybVJlZiwgUHJvdmlkZXIsIFR5cGUsIMm1REVGQVVMVF9MT0NBTEVfSUQgYXMgREVGQVVMVF9MT0NBTEVfSUQsIMm1RGlyZWN0aXZlRGVmIGFzIERpcmVjdGl2ZURlZiwgybVOR19DT01QX0RFRiBhcyBOR19DT01QX0RFRiwgybVOR19ESVJFQ1RJVkVfREVGIGFzIE5HX0RJUkVDVElWRV9ERUYsIMm1TkdfSU5KRUNUT1JfREVGIGFzIE5HX0lOSkVDVE9SX0RFRiwgybVOR19NT0RVTEVfREVGIGFzIE5HX01PRFVMRV9ERUYsIMm1TkdfUElQRV9ERUYgYXMgTkdfUElQRV9ERUYsIMm1TmdNb2R1bGVGYWN0b3J5IGFzIFIzTmdNb2R1bGVGYWN0b3J5LCDJtU5nTW9kdWxlVHJhbnNpdGl2ZVNjb3BlcyBhcyBOZ01vZHVsZVRyYW5zaXRpdmVTY29wZXMsIMm1TmdNb2R1bGVUeXBlIGFzIE5nTW9kdWxlVHlwZSwgybVSZW5kZXIzQ29tcG9uZW50RmFjdG9yeSBhcyBDb21wb25lbnRGYWN0b3J5LCDJtVJlbmRlcjNOZ01vZHVsZVJlZiBhcyBOZ01vZHVsZVJlZiwgybVjb21waWxlQ29tcG9uZW50IGFzIGNvbXBpbGVDb21wb25lbnQsIMm1Y29tcGlsZURpcmVjdGl2ZSBhcyBjb21waWxlRGlyZWN0aXZlLCDJtWNvbXBpbGVOZ01vZHVsZURlZnMgYXMgY29tcGlsZU5nTW9kdWxlRGVmcywgybVjb21waWxlUGlwZSBhcyBjb21waWxlUGlwZSwgybVnZXRJbmplY3RhYmxlRGVmIGFzIGdldEluamVjdGFibGVEZWYsIMm1cGF0Y2hDb21wb25lbnREZWZXaXRoU2NvcGUgYXMgcGF0Y2hDb21wb25lbnREZWZXaXRoU2NvcGUsIMm1c2V0TG9jYWxlSWQgYXMgc2V0TG9jYWxlSWQsIMm1dHJhbnNpdGl2ZVNjb3Blc0ZvciBhcyB0cmFuc2l0aXZlU2NvcGVzRm9yLCDJtcm1SW5qZWN0YWJsZURlZiBhcyBJbmplY3RhYmxlRGVmfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7TW9kdWxlUmVnaXN0cmF0aW9uTWFwLCBnZXRSZWdpc3RlcmVkTW9kdWxlc1N0YXRlLCByZXN0b3JlUmVnaXN0ZXJlZE1vZHVsZXNTdGF0ZX0gZnJvbSAnLi4vLi4vc3JjL2xpbmtlci9uZ19tb2R1bGVfZmFjdG9yeV9yZWdpc3RyYXRpb24nO1xuXG5pbXBvcnQge2NsZWFyUmVzb2x1dGlvbk9mQ29tcG9uZW50UmVzb3VyY2VzUXVldWUsIGlzQ29tcG9uZW50RGVmUGVuZGluZ1Jlc29sdXRpb24sIHJlc29sdmVDb21wb25lbnRSZXNvdXJjZXMsIHJlc3RvcmVDb21wb25lbnRSZXNvbHV0aW9uUXVldWV9IGZyb20gJy4uLy4uL3NyYy9tZXRhZGF0YS9yZXNvdXJjZV9sb2FkaW5nJztcblxuaW1wb3J0IHtNZXRhZGF0YU92ZXJyaWRlfSBmcm9tICcuL21ldGFkYXRhX292ZXJyaWRlJztcbmltcG9ydCB7Q29tcG9uZW50UmVzb2x2ZXIsIERpcmVjdGl2ZVJlc29sdmVyLCBOZ01vZHVsZVJlc29sdmVyLCBQaXBlUmVzb2x2ZXIsIFJlc29sdmVyfSBmcm9tICcuL3Jlc29sdmVycyc7XG5pbXBvcnQge1Rlc3RNb2R1bGVNZXRhZGF0YX0gZnJvbSAnLi90ZXN0X2JlZF9jb21tb24nO1xuXG5lbnVtIFRlc3RpbmdNb2R1bGVPdmVycmlkZSB7XG4gIERFQ0xBUkFUSU9OLFxuICBPVkVSUklERV9URU1QTEFURSxcbn1cblxuZnVuY3Rpb24gaXNUZXN0aW5nTW9kdWxlT3ZlcnJpZGUodmFsdWU6IHVua25vd24pOiB2YWx1ZSBpcyBUZXN0aW5nTW9kdWxlT3ZlcnJpZGUge1xuICByZXR1cm4gdmFsdWUgPT09IFRlc3RpbmdNb2R1bGVPdmVycmlkZS5ERUNMQVJBVElPTiB8fFxuICAgICAgdmFsdWUgPT09IFRlc3RpbmdNb2R1bGVPdmVycmlkZS5PVkVSUklERV9URU1QTEFURTtcbn1cblxuLy8gUmVzb2x2ZXJzIGZvciBBbmd1bGFyIGRlY29yYXRvcnNcbnR5cGUgUmVzb2x2ZXJzID0ge1xuICBtb2R1bGU6IFJlc29sdmVyPE5nTW9kdWxlPixcbiAgY29tcG9uZW50OiBSZXNvbHZlcjxEaXJlY3RpdmU+LFxuICBkaXJlY3RpdmU6IFJlc29sdmVyPENvbXBvbmVudD4sXG4gIHBpcGU6IFJlc29sdmVyPFBpcGU+LFxufTtcblxuaW50ZXJmYWNlIENsZWFudXBPcGVyYXRpb24ge1xuICBmaWVsZDogc3RyaW5nO1xuICBkZWY6IGFueTtcbiAgb3JpZ2luYWw6IHVua25vd247XG59XG5cbmV4cG9ydCBjbGFzcyBSM1Rlc3RCZWRDb21waWxlciB7XG4gIHByaXZhdGUgb3JpZ2luYWxDb21wb25lbnRSZXNvbHV0aW9uUXVldWU6IE1hcDxUeXBlPGFueT4sIENvbXBvbmVudD58bnVsbCA9IG51bGw7XG4gIHByaXZhdGUgb3JpZ2luYWxSZWdpc3RlcmVkTW9kdWxlczogbnVsbHxNb2R1bGVSZWdpc3RyYXRpb25NYXAgPSBudWxsO1xuXG4gIC8vIFRlc3RpbmcgbW9kdWxlIGNvbmZpZ3VyYXRpb25cbiAgcHJpdmF0ZSBkZWNsYXJhdGlvbnM6IFR5cGU8YW55PltdID0gW107XG4gIHByaXZhdGUgaW1wb3J0czogVHlwZTxhbnk+W10gPSBbXTtcbiAgcHJpdmF0ZSBwcm92aWRlcnM6IFByb3ZpZGVyW10gPSBbXTtcbiAgcHJpdmF0ZSBzY2hlbWFzOiBhbnlbXSA9IFtdO1xuXG4gIC8vIFF1ZXVlcyBvZiBjb21wb25lbnRzL2RpcmVjdGl2ZXMvcGlwZXMgdGhhdCBzaG91bGQgYmUgcmVjb21waWxlZC5cbiAgcHJpdmF0ZSBwZW5kaW5nQ29tcG9uZW50cyA9IG5ldyBTZXQ8VHlwZTxhbnk+PigpO1xuICBwcml2YXRlIHBlbmRpbmdEaXJlY3RpdmVzID0gbmV3IFNldDxUeXBlPGFueT4+KCk7XG4gIHByaXZhdGUgcGVuZGluZ1BpcGVzID0gbmV3IFNldDxUeXBlPGFueT4+KCk7XG5cbiAgLy8gS2VlcCB0cmFjayBvZiBhbGwgY29tcG9uZW50cyBhbmQgZGlyZWN0aXZlcywgc28gd2UgY2FuIHBhdGNoIFByb3ZpZGVycyBvbnRvIGRlZnMgbGF0ZXIuXG4gIHByaXZhdGUgc2VlbkNvbXBvbmVudHMgPSBuZXcgU2V0PFR5cGU8YW55Pj4oKTtcbiAgcHJpdmF0ZSBzZWVuRGlyZWN0aXZlcyA9IG5ldyBTZXQ8VHlwZTxhbnk+PigpO1xuXG4gIC8vIFN0b3JlIHJlc29sdmVkIHN0eWxlcyBmb3IgQ29tcG9uZW50cyB0aGF0IGhhdmUgdGVtcGxhdGUgb3ZlcnJpZGVzIHByZXNlbnQgYW5kIGBzdHlsZVVybHNgXG4gIC8vIGRlZmluZWQgYXQgdGhlIHNhbWUgdGltZS5cbiAgcHJpdmF0ZSBleGlzdGluZ0NvbXBvbmVudFN0eWxlcyA9IG5ldyBNYXA8VHlwZTxhbnk+LCBzdHJpbmdbXT4oKTtcblxuICBwcml2YXRlIHJlc29sdmVyczogUmVzb2x2ZXJzID0gaW5pdFJlc29sdmVycygpO1xuXG4gIHByaXZhdGUgY29tcG9uZW50VG9Nb2R1bGVTY29wZSA9IG5ldyBNYXA8VHlwZTxhbnk+LCBUeXBlPGFueT58VGVzdGluZ01vZHVsZU92ZXJyaWRlPigpO1xuXG4gIC8vIE1hcCB0aGF0IGtlZXBzIGluaXRpYWwgdmVyc2lvbiBvZiBjb21wb25lbnQvZGlyZWN0aXZlL3BpcGUgZGVmcyBpbiBjYXNlXG4gIC8vIHdlIGNvbXBpbGUgYSBUeXBlIGFnYWluLCB0aHVzIG92ZXJyaWRpbmcgcmVzcGVjdGl2ZSBzdGF0aWMgZmllbGRzLiBUaGlzIGlzXG4gIC8vIHJlcXVpcmVkIHRvIG1ha2Ugc3VyZSB3ZSByZXN0b3JlIGRlZnMgdG8gdGhlaXIgaW5pdGlhbCBzdGF0ZXMgYmV0d2VlbiB0ZXN0IHJ1bnNcbiAgLy8gVE9ETzogd2Ugc2hvdWxkIHN1cHBvcnQgdGhlIGNhc2Ugd2l0aCBtdWx0aXBsZSBkZWZzIG9uIGEgdHlwZVxuICBwcml2YXRlIGluaXRpYWxOZ0RlZnMgPSBuZXcgTWFwPFR5cGU8YW55PiwgW3N0cmluZywgUHJvcGVydHlEZXNjcmlwdG9yfHVuZGVmaW5lZF0+KCk7XG5cbiAgLy8gQXJyYXkgdGhhdCBrZWVwcyBjbGVhbnVwIG9wZXJhdGlvbnMgZm9yIGluaXRpYWwgdmVyc2lvbnMgb2YgY29tcG9uZW50L2RpcmVjdGl2ZS9waXBlL21vZHVsZVxuICAvLyBkZWZzIGluIGNhc2UgVGVzdEJlZCBtYWtlcyBjaGFuZ2VzIHRvIHRoZSBvcmlnaW5hbHMuXG4gIHByaXZhdGUgZGVmQ2xlYW51cE9wczogQ2xlYW51cE9wZXJhdGlvbltdID0gW107XG5cbiAgcHJpdmF0ZSBfaW5qZWN0b3I6IEluamVjdG9yfG51bGwgPSBudWxsO1xuICBwcml2YXRlIGNvbXBpbGVyUHJvdmlkZXJzOiBQcm92aWRlcltdfG51bGwgPSBudWxsO1xuXG4gIHByaXZhdGUgcHJvdmlkZXJPdmVycmlkZXM6IFByb3ZpZGVyW10gPSBbXTtcbiAgcHJpdmF0ZSByb290UHJvdmlkZXJPdmVycmlkZXM6IFByb3ZpZGVyW10gPSBbXTtcbiAgcHJpdmF0ZSBwcm92aWRlck92ZXJyaWRlc0J5VG9rZW4gPSBuZXcgTWFwPGFueSwgUHJvdmlkZXI+KCk7XG4gIHByaXZhdGUgbW9kdWxlUHJvdmlkZXJzT3ZlcnJpZGRlbiA9IG5ldyBTZXQ8VHlwZTxhbnk+PigpO1xuXG4gIHByaXZhdGUgdGVzdE1vZHVsZVR5cGU6IE5nTW9kdWxlVHlwZTxhbnk+O1xuICBwcml2YXRlIHRlc3RNb2R1bGVSZWY6IE5nTW9kdWxlUmVmPGFueT58bnVsbCA9IG51bGw7XG5cbiAgY29uc3RydWN0b3IocHJpdmF0ZSBwbGF0Zm9ybTogUGxhdGZvcm1SZWYsIHByaXZhdGUgYWRkaXRpb25hbE1vZHVsZVR5cGVzOiBUeXBlPGFueT58VHlwZTxhbnk+W10pIHtcbiAgICBjbGFzcyBEeW5hbWljVGVzdE1vZHVsZSB7fVxuICAgIHRoaXMudGVzdE1vZHVsZVR5cGUgPSBEeW5hbWljVGVzdE1vZHVsZSBhcyBhbnk7XG4gIH1cblxuICBzZXRDb21waWxlclByb3ZpZGVycyhwcm92aWRlcnM6IFByb3ZpZGVyW118bnVsbCk6IHZvaWQge1xuICAgIHRoaXMuY29tcGlsZXJQcm92aWRlcnMgPSBwcm92aWRlcnM7XG4gICAgdGhpcy5faW5qZWN0b3IgPSBudWxsO1xuICB9XG5cbiAgY29uZmlndXJlVGVzdGluZ01vZHVsZShtb2R1bGVEZWY6IFRlc3RNb2R1bGVNZXRhZGF0YSk6IHZvaWQge1xuICAgIC8vIEVucXVldWUgYW55IGNvbXBpbGF0aW9uIHRhc2tzIGZvciB0aGUgZGlyZWN0bHkgZGVjbGFyZWQgY29tcG9uZW50LlxuICAgIGlmIChtb2R1bGVEZWYuZGVjbGFyYXRpb25zICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHRoaXMucXVldWVUeXBlQXJyYXkobW9kdWxlRGVmLmRlY2xhcmF0aW9ucywgVGVzdGluZ01vZHVsZU92ZXJyaWRlLkRFQ0xBUkFUSU9OKTtcbiAgICAgIHRoaXMuZGVjbGFyYXRpb25zLnB1c2goLi4ubW9kdWxlRGVmLmRlY2xhcmF0aW9ucyk7XG4gICAgfVxuXG4gICAgLy8gRW5xdWV1ZSBhbnkgY29tcGlsYXRpb24gdGFza3MgZm9yIGltcG9ydGVkIG1vZHVsZXMuXG4gICAgaWYgKG1vZHVsZURlZi5pbXBvcnRzICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHRoaXMucXVldWVUeXBlc0Zyb21Nb2R1bGVzQXJyYXkobW9kdWxlRGVmLmltcG9ydHMpO1xuICAgICAgdGhpcy5pbXBvcnRzLnB1c2goLi4ubW9kdWxlRGVmLmltcG9ydHMpO1xuICAgIH1cblxuICAgIGlmIChtb2R1bGVEZWYucHJvdmlkZXJzICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHRoaXMucHJvdmlkZXJzLnB1c2goLi4ubW9kdWxlRGVmLnByb3ZpZGVycyk7XG4gICAgfVxuXG4gICAgaWYgKG1vZHVsZURlZi5zY2hlbWFzICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHRoaXMuc2NoZW1hcy5wdXNoKC4uLm1vZHVsZURlZi5zY2hlbWFzKTtcbiAgICB9XG4gIH1cblxuICBvdmVycmlkZU1vZHVsZShuZ01vZHVsZTogVHlwZTxhbnk+LCBvdmVycmlkZTogTWV0YWRhdGFPdmVycmlkZTxOZ01vZHVsZT4pOiB2b2lkIHtcbiAgICAvLyBDb21waWxlIHRoZSBtb2R1bGUgcmlnaHQgYXdheS5cbiAgICB0aGlzLnJlc29sdmVycy5tb2R1bGUuYWRkT3ZlcnJpZGUobmdNb2R1bGUsIG92ZXJyaWRlKTtcbiAgICBjb25zdCBtZXRhZGF0YSA9IHRoaXMucmVzb2x2ZXJzLm1vZHVsZS5yZXNvbHZlKG5nTW9kdWxlKTtcbiAgICBpZiAobWV0YWRhdGEgPT09IG51bGwpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgJHtuZ01vZHVsZS5uYW1lfSBpcyBub3QgYW4gQE5nTW9kdWxlIG9yIGlzIG1pc3NpbmcgbWV0YWRhdGFgKTtcbiAgICB9XG5cbiAgICB0aGlzLnJlY29tcGlsZU5nTW9kdWxlKG5nTW9kdWxlKTtcblxuICAgIC8vIEF0IHRoaXMgcG9pbnQsIHRoZSBtb2R1bGUgaGFzIGEgdmFsaWQgLm5nTW9kdWxlRGVmLCBidXQgdGhlIG92ZXJyaWRlIG1heSBoYXZlIGludHJvZHVjZWRcbiAgICAvLyBuZXcgZGVjbGFyYXRpb25zIG9yIGltcG9ydGVkIG1vZHVsZXMuIEluZ2VzdCBhbnkgcG9zc2libGUgbmV3IHR5cGVzIGFuZCBhZGQgdGhlbSB0byB0aGVcbiAgICAvLyBjdXJyZW50IHF1ZXVlLlxuICAgIHRoaXMucXVldWVUeXBlc0Zyb21Nb2R1bGVzQXJyYXkoW25nTW9kdWxlXSk7XG4gIH1cblxuICBvdmVycmlkZUNvbXBvbmVudChjb21wb25lbnQ6IFR5cGU8YW55Piwgb3ZlcnJpZGU6IE1ldGFkYXRhT3ZlcnJpZGU8Q29tcG9uZW50Pik6IHZvaWQge1xuICAgIHRoaXMucmVzb2x2ZXJzLmNvbXBvbmVudC5hZGRPdmVycmlkZShjb21wb25lbnQsIG92ZXJyaWRlKTtcbiAgICB0aGlzLnBlbmRpbmdDb21wb25lbnRzLmFkZChjb21wb25lbnQpO1xuICB9XG5cbiAgb3ZlcnJpZGVEaXJlY3RpdmUoZGlyZWN0aXZlOiBUeXBlPGFueT4sIG92ZXJyaWRlOiBNZXRhZGF0YU92ZXJyaWRlPERpcmVjdGl2ZT4pOiB2b2lkIHtcbiAgICB0aGlzLnJlc29sdmVycy5kaXJlY3RpdmUuYWRkT3ZlcnJpZGUoZGlyZWN0aXZlLCBvdmVycmlkZSk7XG4gICAgdGhpcy5wZW5kaW5nRGlyZWN0aXZlcy5hZGQoZGlyZWN0aXZlKTtcbiAgfVxuXG4gIG92ZXJyaWRlUGlwZShwaXBlOiBUeXBlPGFueT4sIG92ZXJyaWRlOiBNZXRhZGF0YU92ZXJyaWRlPFBpcGU+KTogdm9pZCB7XG4gICAgdGhpcy5yZXNvbHZlcnMucGlwZS5hZGRPdmVycmlkZShwaXBlLCBvdmVycmlkZSk7XG4gICAgdGhpcy5wZW5kaW5nUGlwZXMuYWRkKHBpcGUpO1xuICB9XG5cbiAgb3ZlcnJpZGVQcm92aWRlcihcbiAgICAgIHRva2VuOiBhbnksXG4gICAgICBwcm92aWRlcjoge3VzZUZhY3Rvcnk/OiBGdW5jdGlvbiwgdXNlVmFsdWU/OiBhbnksIGRlcHM/OiBhbnlbXSwgbXVsdGk/OiBib29sZWFufSk6IHZvaWQge1xuICAgIGNvbnN0IHByb3ZpZGVyRGVmID0gcHJvdmlkZXIudXNlRmFjdG9yeSA/XG4gICAgICAgIHtcbiAgICAgICAgICBwcm92aWRlOiB0b2tlbixcbiAgICAgICAgICB1c2VGYWN0b3J5OiBwcm92aWRlci51c2VGYWN0b3J5LFxuICAgICAgICAgIGRlcHM6IHByb3ZpZGVyLmRlcHMgfHwgW10sXG4gICAgICAgICAgbXVsdGk6IHByb3ZpZGVyLm11bHRpLFxuICAgICAgICB9IDpcbiAgICAgICAge3Byb3ZpZGU6IHRva2VuLCB1c2VWYWx1ZTogcHJvdmlkZXIudXNlVmFsdWUsIG11bHRpOiBwcm92aWRlci5tdWx0aX07XG5cbiAgICBsZXQgaW5qZWN0YWJsZURlZjogSW5qZWN0YWJsZURlZjxhbnk+fG51bGw7XG4gICAgY29uc3QgaXNSb290ID1cbiAgICAgICAgKHR5cGVvZiB0b2tlbiAhPT0gJ3N0cmluZycgJiYgKGluamVjdGFibGVEZWYgPSBnZXRJbmplY3RhYmxlRGVmKHRva2VuKSkgJiZcbiAgICAgICAgIGluamVjdGFibGVEZWYucHJvdmlkZWRJbiA9PT0gJ3Jvb3QnKTtcbiAgICBjb25zdCBvdmVycmlkZXNCdWNrZXQgPSBpc1Jvb3QgPyB0aGlzLnJvb3RQcm92aWRlck92ZXJyaWRlcyA6IHRoaXMucHJvdmlkZXJPdmVycmlkZXM7XG4gICAgb3ZlcnJpZGVzQnVja2V0LnB1c2gocHJvdmlkZXJEZWYpO1xuXG4gICAgLy8gS2VlcCBvdmVycmlkZXMgZ3JvdXBlZCBieSB0b2tlbiBhcyB3ZWxsIGZvciBmYXN0IGxvb2t1cHMgdXNpbmcgdG9rZW5cbiAgICB0aGlzLnByb3ZpZGVyT3ZlcnJpZGVzQnlUb2tlbi5zZXQodG9rZW4sIHByb3ZpZGVyRGVmKTtcbiAgfVxuXG4gIG92ZXJyaWRlVGVtcGxhdGVVc2luZ1Rlc3RpbmdNb2R1bGUodHlwZTogVHlwZTxhbnk+LCB0ZW1wbGF0ZTogc3RyaW5nKTogdm9pZCB7XG4gICAgY29uc3QgZGVmID0gKHR5cGUgYXMgYW55KVtOR19DT01QX0RFRl07XG4gICAgY29uc3QgaGFzU3R5bGVVcmxzID0gKCk6IGJvb2xlYW4gPT4ge1xuICAgICAgY29uc3QgbWV0YWRhdGEgPSB0aGlzLnJlc29sdmVycy5jb21wb25lbnQucmVzb2x2ZSh0eXBlKSAhYXMgQ29tcG9uZW50O1xuICAgICAgcmV0dXJuICEhbWV0YWRhdGEuc3R5bGVVcmxzICYmIG1ldGFkYXRhLnN0eWxlVXJscy5sZW5ndGggPiAwO1xuICAgIH07XG4gICAgY29uc3Qgb3ZlcnJpZGVTdHlsZVVybHMgPSAhIWRlZiAmJiAhaXNDb21wb25lbnREZWZQZW5kaW5nUmVzb2x1dGlvbih0eXBlKSAmJiBoYXNTdHlsZVVybHMoKTtcblxuICAgIC8vIEluIEl2eSwgY29tcGlsaW5nIGEgY29tcG9uZW50IGRvZXMgbm90IHJlcXVpcmUga25vd2luZyB0aGUgbW9kdWxlIHByb3ZpZGluZyB0aGVcbiAgICAvLyBjb21wb25lbnQncyBzY29wZSwgc28gb3ZlcnJpZGVUZW1wbGF0ZVVzaW5nVGVzdGluZ01vZHVsZSBjYW4gYmUgaW1wbGVtZW50ZWQgcHVyZWx5IHZpYVxuICAgIC8vIG92ZXJyaWRlQ29tcG9uZW50LiBJbXBvcnRhbnQ6IG92ZXJyaWRpbmcgdGVtcGxhdGUgcmVxdWlyZXMgZnVsbCBDb21wb25lbnQgcmUtY29tcGlsYXRpb24sXG4gICAgLy8gd2hpY2ggbWF5IGZhaWwgaW4gY2FzZSBzdHlsZVVybHMgYXJlIGFsc28gcHJlc2VudCAodGh1cyBDb21wb25lbnQgaXMgY29uc2lkZXJlZCBhcyByZXF1aXJlZFxuICAgIC8vIHJlc29sdXRpb24pLiBJbiBvcmRlciB0byBhdm9pZCB0aGlzLCB3ZSBwcmVlbXB0aXZlbHkgc2V0IHN0eWxlVXJscyB0byBhbiBlbXB0eSBhcnJheSxcbiAgICAvLyBwcmVzZXJ2ZSBjdXJyZW50IHN0eWxlcyBhdmFpbGFibGUgb24gQ29tcG9uZW50IGRlZiBhbmQgcmVzdG9yZSBzdHlsZXMgYmFjayBvbmNlIGNvbXBpbGF0aW9uXG4gICAgLy8gaXMgY29tcGxldGUuXG4gICAgY29uc3Qgb3ZlcnJpZGUgPSBvdmVycmlkZVN0eWxlVXJscyA/IHt0ZW1wbGF0ZSwgc3R5bGVzOiBbXSwgc3R5bGVVcmxzOiBbXX0gOiB7dGVtcGxhdGV9O1xuICAgIHRoaXMub3ZlcnJpZGVDb21wb25lbnQodHlwZSwge3NldDogb3ZlcnJpZGV9KTtcblxuICAgIGlmIChvdmVycmlkZVN0eWxlVXJscyAmJiBkZWYuc3R5bGVzICYmIGRlZi5zdHlsZXMubGVuZ3RoID4gMCkge1xuICAgICAgdGhpcy5leGlzdGluZ0NvbXBvbmVudFN0eWxlcy5zZXQodHlwZSwgZGVmLnN0eWxlcyk7XG4gICAgfVxuXG4gICAgLy8gU2V0IHRoZSBjb21wb25lbnQncyBzY29wZSB0byBiZSB0aGUgdGVzdGluZyBtb2R1bGUuXG4gICAgdGhpcy5jb21wb25lbnRUb01vZHVsZVNjb3BlLnNldCh0eXBlLCBUZXN0aW5nTW9kdWxlT3ZlcnJpZGUuT1ZFUlJJREVfVEVNUExBVEUpO1xuICB9XG5cbiAgYXN5bmMgY29tcGlsZUNvbXBvbmVudHMoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdGhpcy5jbGVhckNvbXBvbmVudFJlc29sdXRpb25RdWV1ZSgpO1xuICAgIC8vIFJ1biBjb21waWxlcnMgZm9yIGFsbCBxdWV1ZWQgdHlwZXMuXG4gICAgbGV0IG5lZWRzQXN5bmNSZXNvdXJjZXMgPSB0aGlzLmNvbXBpbGVUeXBlc1N5bmMoKTtcblxuICAgIC8vIGNvbXBpbGVDb21wb25lbnRzKCkgc2hvdWxkIG5vdCBiZSBhc3luYyB1bmxlc3MgaXQgbmVlZHMgdG8gYmUuXG4gICAgaWYgKG5lZWRzQXN5bmNSZXNvdXJjZXMpIHtcbiAgICAgIGxldCByZXNvdXJjZUxvYWRlcjogUmVzb3VyY2VMb2FkZXI7XG4gICAgICBsZXQgcmVzb2x2ZXIgPSAodXJsOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4gPT4ge1xuICAgICAgICBpZiAoIXJlc291cmNlTG9hZGVyKSB7XG4gICAgICAgICAgcmVzb3VyY2VMb2FkZXIgPSB0aGlzLmluamVjdG9yLmdldChSZXNvdXJjZUxvYWRlcik7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShyZXNvdXJjZUxvYWRlci5nZXQodXJsKSk7XG4gICAgICB9O1xuICAgICAgYXdhaXQgcmVzb2x2ZUNvbXBvbmVudFJlc291cmNlcyhyZXNvbHZlcik7XG4gICAgfVxuICB9XG5cbiAgZmluYWxpemUoKTogTmdNb2R1bGVSZWY8YW55PiB7XG4gICAgLy8gT25lIGxhc3QgY29tcGlsZVxuICAgIHRoaXMuY29tcGlsZVR5cGVzU3luYygpO1xuXG4gICAgLy8gQ3JlYXRlIHRoZSB0ZXN0aW5nIG1vZHVsZSBpdHNlbGYuXG4gICAgdGhpcy5jb21waWxlVGVzdE1vZHVsZSgpO1xuXG4gICAgdGhpcy5hcHBseVRyYW5zaXRpdmVTY29wZXMoKTtcblxuICAgIHRoaXMuYXBwbHlQcm92aWRlck92ZXJyaWRlcygpO1xuXG4gICAgLy8gUGF0Y2ggcHJldmlvdXNseSBzdG9yZWQgYHN0eWxlc2AgQ29tcG9uZW50IHZhbHVlcyAodGFrZW4gZnJvbSDJtWNtcCksIGluIGNhc2UgdGhlc2VcbiAgICAvLyBDb21wb25lbnRzIGhhdmUgYHN0eWxlVXJsc2AgZmllbGRzIGRlZmluZWQgYW5kIHRlbXBsYXRlIG92ZXJyaWRlIHdhcyByZXF1ZXN0ZWQuXG4gICAgdGhpcy5wYXRjaENvbXBvbmVudHNXaXRoRXhpc3RpbmdTdHlsZXMoKTtcblxuICAgIC8vIENsZWFyIHRoZSBjb21wb25lbnRUb01vZHVsZVNjb3BlIG1hcCwgc28gdGhhdCBmdXR1cmUgY29tcGlsYXRpb25zIGRvbid0IHJlc2V0IHRoZSBzY29wZSBvZlxuICAgIC8vIGV2ZXJ5IGNvbXBvbmVudC5cbiAgICB0aGlzLmNvbXBvbmVudFRvTW9kdWxlU2NvcGUuY2xlYXIoKTtcblxuICAgIGNvbnN0IHBhcmVudEluamVjdG9yID0gdGhpcy5wbGF0Zm9ybS5pbmplY3RvcjtcbiAgICB0aGlzLnRlc3RNb2R1bGVSZWYgPSBuZXcgTmdNb2R1bGVSZWYodGhpcy50ZXN0TW9kdWxlVHlwZSwgcGFyZW50SW5qZWN0b3IpO1xuXG4gICAgLy8gU2V0IHRoZSBsb2NhbGUgSUQsIGl0IGNhbiBiZSBvdmVycmlkZGVuIGZvciB0aGUgdGVzdHNcbiAgICBjb25zdCBsb2NhbGVJZCA9IHRoaXMudGVzdE1vZHVsZVJlZi5pbmplY3Rvci5nZXQoTE9DQUxFX0lELCBERUZBVUxUX0xPQ0FMRV9JRCk7XG4gICAgc2V0TG9jYWxlSWQobG9jYWxlSWQpO1xuXG4gICAgLy8gQXBwbGljYXRpb25Jbml0U3RhdHVzLnJ1bkluaXRpYWxpemVycygpIGlzIG1hcmtlZCBAaW50ZXJuYWwgdG8gY29yZS5cbiAgICAvLyBDYXN0IGl0IHRvIGFueSBiZWZvcmUgYWNjZXNzaW5nIGl0LlxuICAgICh0aGlzLnRlc3RNb2R1bGVSZWYuaW5qZWN0b3IuZ2V0KEFwcGxpY2F0aW9uSW5pdFN0YXR1cykgYXMgYW55KS5ydW5Jbml0aWFsaXplcnMoKTtcblxuICAgIHJldHVybiB0aGlzLnRlc3RNb2R1bGVSZWY7XG4gIH1cblxuICAvKipcbiAgICogQGludGVybmFsXG4gICAqL1xuICBfY29tcGlsZU5nTW9kdWxlU3luYyhtb2R1bGVUeXBlOiBUeXBlPGFueT4pOiB2b2lkIHtcbiAgICB0aGlzLnF1ZXVlVHlwZXNGcm9tTW9kdWxlc0FycmF5KFttb2R1bGVUeXBlXSk7XG4gICAgdGhpcy5jb21waWxlVHlwZXNTeW5jKCk7XG4gICAgdGhpcy5hcHBseVByb3ZpZGVyT3ZlcnJpZGVzKCk7XG4gICAgdGhpcy5hcHBseVByb3ZpZGVyT3ZlcnJpZGVzVG9Nb2R1bGUobW9kdWxlVHlwZSk7XG4gICAgdGhpcy5hcHBseVRyYW5zaXRpdmVTY29wZXMoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIGFzeW5jIF9jb21waWxlTmdNb2R1bGVBc3luYyhtb2R1bGVUeXBlOiBUeXBlPGFueT4pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5vcmlnaW5hbFJlZ2lzdGVyZWRNb2R1bGVzID09PSBudWxsKSB7XG4gICAgICB0aGlzLm9yaWdpbmFsUmVnaXN0ZXJlZE1vZHVsZXMgPSBnZXRSZWdpc3RlcmVkTW9kdWxlc1N0YXRlKCk7XG4gICAgfVxuICAgIHRoaXMucXVldWVUeXBlc0Zyb21Nb2R1bGVzQXJyYXkoW21vZHVsZVR5cGVdKTtcbiAgICBhd2FpdCB0aGlzLmNvbXBpbGVDb21wb25lbnRzKCk7XG4gICAgdGhpcy5hcHBseVByb3ZpZGVyT3ZlcnJpZGVzKCk7XG4gICAgdGhpcy5hcHBseVByb3ZpZGVyT3ZlcnJpZGVzVG9Nb2R1bGUobW9kdWxlVHlwZSk7XG4gICAgdGhpcy5hcHBseVRyYW5zaXRpdmVTY29wZXMoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIF9nZXRNb2R1bGVSZXNvbHZlcigpOiBSZXNvbHZlcjxOZ01vZHVsZT4geyByZXR1cm4gdGhpcy5yZXNvbHZlcnMubW9kdWxlOyB9XG5cbiAgLyoqXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgX2dldENvbXBvbmVudEZhY3Rvcmllcyhtb2R1bGVUeXBlOiBOZ01vZHVsZVR5cGUpOiBDb21wb25lbnRGYWN0b3J5PGFueT5bXSB7XG4gICAgcmV0dXJuIG1heWJlVW53cmFwRm4obW9kdWxlVHlwZS5uZ01vZHVsZURlZi5kZWNsYXJhdGlvbnMpLnJlZHVjZSgoZmFjdG9yaWVzLCBkZWNsYXJhdGlvbikgPT4ge1xuICAgICAgY29uc3QgY29tcG9uZW50RGVmID0gKGRlY2xhcmF0aW9uIGFzIGFueSkuybVjbXA7XG4gICAgICBjb21wb25lbnREZWYgJiYgZmFjdG9yaWVzLnB1c2gobmV3IENvbXBvbmVudEZhY3RvcnkoY29tcG9uZW50RGVmLCB0aGlzLnRlc3RNb2R1bGVSZWYgISkpO1xuICAgICAgcmV0dXJuIGZhY3RvcmllcztcbiAgICB9LCBbXSBhcyBDb21wb25lbnRGYWN0b3J5PGFueT5bXSk7XG4gIH1cblxuICBwcml2YXRlIGNvbXBpbGVUeXBlc1N5bmMoKTogYm9vbGVhbiB7XG4gICAgLy8gQ29tcGlsZSBhbGwgcXVldWVkIGNvbXBvbmVudHMsIGRpcmVjdGl2ZXMsIHBpcGVzLlxuICAgIGxldCBuZWVkc0FzeW5jUmVzb3VyY2VzID0gZmFsc2U7XG4gICAgdGhpcy5wZW5kaW5nQ29tcG9uZW50cy5mb3JFYWNoKGRlY2xhcmF0aW9uID0+IHtcbiAgICAgIG5lZWRzQXN5bmNSZXNvdXJjZXMgPSBuZWVkc0FzeW5jUmVzb3VyY2VzIHx8IGlzQ29tcG9uZW50RGVmUGVuZGluZ1Jlc29sdXRpb24oZGVjbGFyYXRpb24pO1xuICAgICAgY29uc3QgbWV0YWRhdGEgPSB0aGlzLnJlc29sdmVycy5jb21wb25lbnQucmVzb2x2ZShkZWNsYXJhdGlvbikgITtcbiAgICAgIHRoaXMubWF5YmVTdG9yZU5nRGVmKE5HX0NPTVBfREVGLCBkZWNsYXJhdGlvbik7XG4gICAgICBjb21waWxlQ29tcG9uZW50KGRlY2xhcmF0aW9uLCBtZXRhZGF0YSk7XG4gICAgfSk7XG4gICAgdGhpcy5wZW5kaW5nQ29tcG9uZW50cy5jbGVhcigpO1xuXG4gICAgdGhpcy5wZW5kaW5nRGlyZWN0aXZlcy5mb3JFYWNoKGRlY2xhcmF0aW9uID0+IHtcbiAgICAgIGNvbnN0IG1ldGFkYXRhID0gdGhpcy5yZXNvbHZlcnMuZGlyZWN0aXZlLnJlc29sdmUoZGVjbGFyYXRpb24pO1xuICAgICAgdGhpcy5tYXliZVN0b3JlTmdEZWYoTkdfRElSRUNUSVZFX0RFRiwgZGVjbGFyYXRpb24pO1xuICAgICAgY29tcGlsZURpcmVjdGl2ZShkZWNsYXJhdGlvbiwgbWV0YWRhdGEpO1xuICAgIH0pO1xuICAgIHRoaXMucGVuZGluZ0RpcmVjdGl2ZXMuY2xlYXIoKTtcblxuICAgIHRoaXMucGVuZGluZ1BpcGVzLmZvckVhY2goZGVjbGFyYXRpb24gPT4ge1xuICAgICAgY29uc3QgbWV0YWRhdGEgPSB0aGlzLnJlc29sdmVycy5waXBlLnJlc29sdmUoZGVjbGFyYXRpb24pICE7XG4gICAgICB0aGlzLm1heWJlU3RvcmVOZ0RlZihOR19QSVBFX0RFRiwgZGVjbGFyYXRpb24pO1xuICAgICAgY29tcGlsZVBpcGUoZGVjbGFyYXRpb24sIG1ldGFkYXRhKTtcbiAgICB9KTtcbiAgICB0aGlzLnBlbmRpbmdQaXBlcy5jbGVhcigpO1xuXG4gICAgcmV0dXJuIG5lZWRzQXN5bmNSZXNvdXJjZXM7XG4gIH1cblxuICBwcml2YXRlIGFwcGx5VHJhbnNpdGl2ZVNjb3BlcygpOiB2b2lkIHtcbiAgICBjb25zdCBtb2R1bGVUb1Njb3BlID0gbmV3IE1hcDxUeXBlPGFueT58VGVzdGluZ01vZHVsZU92ZXJyaWRlLCBOZ01vZHVsZVRyYW5zaXRpdmVTY29wZXM+KCk7XG4gICAgY29uc3QgZ2V0U2NvcGVPZk1vZHVsZSA9XG4gICAgICAgIChtb2R1bGVUeXBlOiBUeXBlPGFueT58IFRlc3RpbmdNb2R1bGVPdmVycmlkZSk6IE5nTW9kdWxlVHJhbnNpdGl2ZVNjb3BlcyA9PiB7XG4gICAgICAgICAgaWYgKCFtb2R1bGVUb1Njb3BlLmhhcyhtb2R1bGVUeXBlKSkge1xuICAgICAgICAgICAgY29uc3QgcmVhbFR5cGUgPSBpc1Rlc3RpbmdNb2R1bGVPdmVycmlkZShtb2R1bGVUeXBlKSA/IHRoaXMudGVzdE1vZHVsZVR5cGUgOiBtb2R1bGVUeXBlO1xuICAgICAgICAgICAgbW9kdWxlVG9TY29wZS5zZXQobW9kdWxlVHlwZSwgdHJhbnNpdGl2ZVNjb3Blc0ZvcihyZWFsVHlwZSkpO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gbW9kdWxlVG9TY29wZS5nZXQobW9kdWxlVHlwZSkgITtcbiAgICAgICAgfTtcblxuICAgIHRoaXMuY29tcG9uZW50VG9Nb2R1bGVTY29wZS5mb3JFYWNoKChtb2R1bGVUeXBlLCBjb21wb25lbnRUeXBlKSA9PiB7XG4gICAgICBjb25zdCBtb2R1bGVTY29wZSA9IGdldFNjb3BlT2ZNb2R1bGUobW9kdWxlVHlwZSk7XG4gICAgICB0aGlzLnN0b3JlRmllbGRPZkRlZk9uVHlwZShjb21wb25lbnRUeXBlLCBOR19DT01QX0RFRiwgJ2RpcmVjdGl2ZURlZnMnKTtcbiAgICAgIHRoaXMuc3RvcmVGaWVsZE9mRGVmT25UeXBlKGNvbXBvbmVudFR5cGUsIE5HX0NPTVBfREVGLCAncGlwZURlZnMnKTtcbiAgICAgIHBhdGNoQ29tcG9uZW50RGVmV2l0aFNjb3BlKChjb21wb25lbnRUeXBlIGFzIGFueSkuybVjbXAsIG1vZHVsZVNjb3BlKTtcbiAgICB9KTtcblxuICAgIHRoaXMuY29tcG9uZW50VG9Nb2R1bGVTY29wZS5jbGVhcigpO1xuICB9XG5cbiAgcHJpdmF0ZSBhcHBseVByb3ZpZGVyT3ZlcnJpZGVzKCk6IHZvaWQge1xuICAgIGNvbnN0IG1heWJlQXBwbHlPdmVycmlkZXMgPSAoZmllbGQ6IHN0cmluZykgPT4gKHR5cGU6IFR5cGU8YW55PikgPT4ge1xuICAgICAgY29uc3QgcmVzb2x2ZXIgPSBmaWVsZCA9PT0gTkdfQ09NUF9ERUYgPyB0aGlzLnJlc29sdmVycy5jb21wb25lbnQgOiB0aGlzLnJlc29sdmVycy5kaXJlY3RpdmU7XG4gICAgICBjb25zdCBtZXRhZGF0YSA9IHJlc29sdmVyLnJlc29sdmUodHlwZSkgITtcbiAgICAgIGlmICh0aGlzLmhhc1Byb3ZpZGVyT3ZlcnJpZGVzKG1ldGFkYXRhLnByb3ZpZGVycykpIHtcbiAgICAgICAgdGhpcy5wYXRjaERlZldpdGhQcm92aWRlck92ZXJyaWRlcyh0eXBlLCBmaWVsZCk7XG4gICAgICB9XG4gICAgfTtcbiAgICB0aGlzLnNlZW5Db21wb25lbnRzLmZvckVhY2gobWF5YmVBcHBseU92ZXJyaWRlcyhOR19DT01QX0RFRikpO1xuICAgIHRoaXMuc2VlbkRpcmVjdGl2ZXMuZm9yRWFjaChtYXliZUFwcGx5T3ZlcnJpZGVzKE5HX0RJUkVDVElWRV9ERUYpKTtcblxuICAgIHRoaXMuc2VlbkNvbXBvbmVudHMuY2xlYXIoKTtcbiAgICB0aGlzLnNlZW5EaXJlY3RpdmVzLmNsZWFyKCk7XG4gIH1cblxuICBwcml2YXRlIGFwcGx5UHJvdmlkZXJPdmVycmlkZXNUb01vZHVsZShtb2R1bGVUeXBlOiBUeXBlPGFueT4pOiB2b2lkIHtcbiAgICBpZiAodGhpcy5tb2R1bGVQcm92aWRlcnNPdmVycmlkZGVuLmhhcyhtb2R1bGVUeXBlKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLm1vZHVsZVByb3ZpZGVyc092ZXJyaWRkZW4uYWRkKG1vZHVsZVR5cGUpO1xuXG4gICAgY29uc3QgaW5qZWN0b3JEZWY6IGFueSA9IChtb2R1bGVUeXBlIGFzIGFueSlbTkdfSU5KRUNUT1JfREVGXTtcbiAgICBpZiAodGhpcy5wcm92aWRlck92ZXJyaWRlc0J5VG9rZW4uc2l6ZSA+IDApIHtcbiAgICAgIC8vIEV4dHJhY3QgdGhlIGxpc3Qgb2YgcHJvdmlkZXJzIGZyb20gTW9kdWxlV2l0aFByb3ZpZGVycywgc28gd2UgY2FuIGRlZmluZSB0aGUgZmluYWwgbGlzdCBvZlxuICAgICAgLy8gcHJvdmlkZXJzIHRoYXQgbWlnaHQgaGF2ZSBvdmVycmlkZXMuXG4gICAgICAvLyBOb3RlOiBzZWNvbmQgYGZsYXR0ZW5gIG9wZXJhdGlvbiBpcyBuZWVkZWQgdG8gY29udmVydCBhbiBhcnJheSBvZiBwcm92aWRlcnNcbiAgICAgIC8vIChlLmcuIGBbW10sIFtdXWApIGludG8gb25lIGZsYXQgbGlzdCwgYWxzbyBlbGltaW5hdGluZyBlbXB0eSBhcnJheXMuXG4gICAgICBjb25zdCBwcm92aWRlcnNGcm9tTW9kdWxlcyA9IGZsYXR0ZW4oZmxhdHRlbihcbiAgICAgICAgICBpbmplY3RvckRlZi5pbXBvcnRzLCAoaW1wb3J0ZWQ6IE5nTW9kdWxlVHlwZTxhbnk+fCBNb2R1bGVXaXRoUHJvdmlkZXJzPGFueT4pID0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlzTW9kdWxlV2l0aFByb3ZpZGVycyhpbXBvcnRlZCkgPyBpbXBvcnRlZC5wcm92aWRlcnMgOiBbXSkpO1xuICAgICAgY29uc3QgcHJvdmlkZXJzID0gWy4uLnByb3ZpZGVyc0Zyb21Nb2R1bGVzLCAuLi5pbmplY3RvckRlZi5wcm92aWRlcnNdO1xuICAgICAgaWYgKHRoaXMuaGFzUHJvdmlkZXJPdmVycmlkZXMocHJvdmlkZXJzKSkge1xuICAgICAgICB0aGlzLm1heWJlU3RvcmVOZ0RlZihOR19JTkpFQ1RPUl9ERUYsIG1vZHVsZVR5cGUpO1xuXG4gICAgICAgIHRoaXMuc3RvcmVGaWVsZE9mRGVmT25UeXBlKG1vZHVsZVR5cGUsIE5HX0lOSkVDVE9SX0RFRiwgJ3Byb3ZpZGVycycpO1xuICAgICAgICBpbmplY3RvckRlZi5wcm92aWRlcnMgPSB0aGlzLmdldE92ZXJyaWRkZW5Qcm92aWRlcnMocHJvdmlkZXJzKTtcbiAgICAgIH1cblxuICAgICAgLy8gQXBwbHkgcHJvdmlkZXIgb3ZlcnJpZGVzIHRvIGltcG9ydGVkIG1vZHVsZXMgcmVjdXJzaXZlbHlcbiAgICAgIGNvbnN0IG1vZHVsZURlZjogYW55ID0gKG1vZHVsZVR5cGUgYXMgYW55KVtOR19NT0RVTEVfREVGXTtcbiAgICAgIGZvciAoY29uc3QgaW1wb3J0VHlwZSBvZiBtb2R1bGVEZWYuaW1wb3J0cykge1xuICAgICAgICB0aGlzLmFwcGx5UHJvdmlkZXJPdmVycmlkZXNUb01vZHVsZShpbXBvcnRUeXBlKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBwcml2YXRlIHBhdGNoQ29tcG9uZW50c1dpdGhFeGlzdGluZ1N0eWxlcygpOiB2b2lkIHtcbiAgICB0aGlzLmV4aXN0aW5nQ29tcG9uZW50U3R5bGVzLmZvckVhY2goXG4gICAgICAgIChzdHlsZXMsIHR5cGUpID0+ICh0eXBlIGFzIGFueSlbTkdfQ09NUF9ERUZdLnN0eWxlcyA9IHN0eWxlcyk7XG4gICAgdGhpcy5leGlzdGluZ0NvbXBvbmVudFN0eWxlcy5jbGVhcigpO1xuICB9XG5cbiAgcHJpdmF0ZSBxdWV1ZVR5cGVBcnJheShhcnI6IGFueVtdLCBtb2R1bGVUeXBlOiBUeXBlPGFueT58VGVzdGluZ01vZHVsZU92ZXJyaWRlKTogdm9pZCB7XG4gICAgZm9yIChjb25zdCB2YWx1ZSBvZiBhcnIpIHtcbiAgICAgIGlmIChBcnJheS5pc0FycmF5KHZhbHVlKSkge1xuICAgICAgICB0aGlzLnF1ZXVlVHlwZUFycmF5KHZhbHVlLCBtb2R1bGVUeXBlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMucXVldWVUeXBlKHZhbHVlLCBtb2R1bGVUeXBlKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBwcml2YXRlIHJlY29tcGlsZU5nTW9kdWxlKG5nTW9kdWxlOiBUeXBlPGFueT4pOiB2b2lkIHtcbiAgICBjb25zdCBtZXRhZGF0YSA9IHRoaXMucmVzb2x2ZXJzLm1vZHVsZS5yZXNvbHZlKG5nTW9kdWxlKTtcbiAgICBpZiAobWV0YWRhdGEgPT09IG51bGwpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgVW5hYmxlIHRvIHJlc29sdmUgbWV0YWRhdGEgZm9yIE5nTW9kdWxlOiAke25nTW9kdWxlLm5hbWV9YCk7XG4gICAgfVxuICAgIC8vIENhY2hlIHRoZSBpbml0aWFsIG5nTW9kdWxlRGVmIGFzIGl0IHdpbGwgYmUgb3ZlcndyaXR0ZW4uXG4gICAgdGhpcy5tYXliZVN0b3JlTmdEZWYoTkdfTU9EVUxFX0RFRiwgbmdNb2R1bGUpO1xuICAgIHRoaXMubWF5YmVTdG9yZU5nRGVmKE5HX0lOSkVDVE9SX0RFRiwgbmdNb2R1bGUpO1xuXG4gICAgY29tcGlsZU5nTW9kdWxlRGVmcyhuZ01vZHVsZSBhcyBOZ01vZHVsZVR5cGU8YW55PiwgbWV0YWRhdGEpO1xuICB9XG5cbiAgcHJpdmF0ZSBxdWV1ZVR5cGUodHlwZTogVHlwZTxhbnk+LCBtb2R1bGVUeXBlOiBUeXBlPGFueT58VGVzdGluZ01vZHVsZU92ZXJyaWRlKTogdm9pZCB7XG4gICAgY29uc3QgY29tcG9uZW50ID0gdGhpcy5yZXNvbHZlcnMuY29tcG9uZW50LnJlc29sdmUodHlwZSk7XG4gICAgaWYgKGNvbXBvbmVudCkge1xuICAgICAgLy8gQ2hlY2sgd2hldGhlciBhIGdpdmUgVHlwZSBoYXMgcmVzcGVjdGl2ZSBORyBkZWYgKMm1Y21wKSBhbmQgY29tcGlsZSBpZiBkZWYgaXNcbiAgICAgIC8vIG1pc3NpbmcuIFRoYXQgbWlnaHQgaGFwcGVuIGluIGNhc2UgYSBjbGFzcyB3aXRob3V0IGFueSBBbmd1bGFyIGRlY29yYXRvcnMgZXh0ZW5kcyBhbm90aGVyXG4gICAgICAvLyBjbGFzcyB3aGVyZSBDb21wb25lbnQvRGlyZWN0aXZlL1BpcGUgZGVjb3JhdG9yIGlzIGRlZmluZWQuXG4gICAgICBpZiAoaXNDb21wb25lbnREZWZQZW5kaW5nUmVzb2x1dGlvbih0eXBlKSB8fCAhdHlwZS5oYXNPd25Qcm9wZXJ0eShOR19DT01QX0RFRikpIHtcbiAgICAgICAgdGhpcy5wZW5kaW5nQ29tcG9uZW50cy5hZGQodHlwZSk7XG4gICAgICB9XG4gICAgICB0aGlzLnNlZW5Db21wb25lbnRzLmFkZCh0eXBlKTtcblxuICAgICAgLy8gS2VlcCB0cmFjayBvZiB0aGUgbW9kdWxlIHdoaWNoIGRlY2xhcmVzIHRoaXMgY29tcG9uZW50LCBzbyBsYXRlciB0aGUgY29tcG9uZW50J3Mgc2NvcGVcbiAgICAgIC8vIGNhbiBiZSBzZXQgY29ycmVjdGx5LiBJZiB0aGUgY29tcG9uZW50IGhhcyBhbHJlYWR5IGJlZW4gcmVjb3JkZWQgaGVyZSwgdGhlbiBvbmUgb2Ygc2V2ZXJhbFxuICAgICAgLy8gY2FzZXMgaXMgdHJ1ZTpcbiAgICAgIC8vICogdGhlIG1vZHVsZSBjb250YWluaW5nIHRoZSBjb21wb25lbnQgd2FzIGltcG9ydGVkIG11bHRpcGxlIHRpbWVzIChjb21tb24pLlxuICAgICAgLy8gKiB0aGUgY29tcG9uZW50IGlzIGRlY2xhcmVkIGluIG11bHRpcGxlIG1vZHVsZXMgKHdoaWNoIGlzIGFuIGVycm9yKS5cbiAgICAgIC8vICogdGhlIGNvbXBvbmVudCB3YXMgaW4gJ2RlY2xhcmF0aW9ucycgb2YgdGhlIHRlc3RpbmcgbW9kdWxlLCBhbmQgYWxzbyBpbiBhbiBpbXBvcnRlZCBtb2R1bGVcbiAgICAgIC8vICAgaW4gd2hpY2ggY2FzZSB0aGUgbW9kdWxlIHNjb3BlIHdpbGwgYmUgVGVzdGluZ01vZHVsZU92ZXJyaWRlLkRFQ0xBUkFUSU9OLlxuICAgICAgLy8gKiBvdmVycmlkZVRlbXBsYXRlVXNpbmdUZXN0aW5nTW9kdWxlIHdhcyBjYWxsZWQgZm9yIHRoZSBjb21wb25lbnQgaW4gd2hpY2ggY2FzZSB0aGUgbW9kdWxlXG4gICAgICAvLyAgIHNjb3BlIHdpbGwgYmUgVGVzdGluZ01vZHVsZU92ZXJyaWRlLk9WRVJSSURFX1RFTVBMQVRFLlxuICAgICAgLy9cbiAgICAgIC8vIElmIHRoZSBjb21wb25lbnQgd2FzIHByZXZpb3VzbHkgaW4gdGhlIHRlc3RpbmcgbW9kdWxlJ3MgJ2RlY2xhcmF0aW9ucycgKG1lYW5pbmcgdGhlXG4gICAgICAvLyBjdXJyZW50IHZhbHVlIGlzIFRlc3RpbmdNb2R1bGVPdmVycmlkZS5ERUNMQVJBVElPTiksIHRoZW4gYG1vZHVsZVR5cGVgIGlzIHRoZSBjb21wb25lbnQnc1xuICAgICAgLy8gcmVhbCBtb2R1bGUsIHdoaWNoIHdhcyBpbXBvcnRlZC4gVGhpcyBwYXR0ZXJuIGlzIHVuZGVyc3Rvb2QgdG8gbWVhbiB0aGF0IHRoZSBjb21wb25lbnRcbiAgICAgIC8vIHNob3VsZCB1c2UgaXRzIG9yaWdpbmFsIHNjb3BlLCBidXQgdGhhdCB0aGUgdGVzdGluZyBtb2R1bGUgc2hvdWxkIGFsc28gY29udGFpbiB0aGVcbiAgICAgIC8vIGNvbXBvbmVudCBpbiBpdHMgc2NvcGUuXG4gICAgICBpZiAoIXRoaXMuY29tcG9uZW50VG9Nb2R1bGVTY29wZS5oYXModHlwZSkgfHxcbiAgICAgICAgICB0aGlzLmNvbXBvbmVudFRvTW9kdWxlU2NvcGUuZ2V0KHR5cGUpID09PSBUZXN0aW5nTW9kdWxlT3ZlcnJpZGUuREVDTEFSQVRJT04pIHtcbiAgICAgICAgdGhpcy5jb21wb25lbnRUb01vZHVsZVNjb3BlLnNldCh0eXBlLCBtb2R1bGVUeXBlKTtcbiAgICAgIH1cbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBkaXJlY3RpdmUgPSB0aGlzLnJlc29sdmVycy5kaXJlY3RpdmUucmVzb2x2ZSh0eXBlKTtcbiAgICBpZiAoZGlyZWN0aXZlKSB7XG4gICAgICBpZiAoIXR5cGUuaGFzT3duUHJvcGVydHkoTkdfRElSRUNUSVZFX0RFRikpIHtcbiAgICAgICAgdGhpcy5wZW5kaW5nRGlyZWN0aXZlcy5hZGQodHlwZSk7XG4gICAgICB9XG4gICAgICB0aGlzLnNlZW5EaXJlY3RpdmVzLmFkZCh0eXBlKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBwaXBlID0gdGhpcy5yZXNvbHZlcnMucGlwZS5yZXNvbHZlKHR5cGUpO1xuICAgIGlmIChwaXBlICYmICF0eXBlLmhhc093blByb3BlcnR5KE5HX1BJUEVfREVGKSkge1xuICAgICAgdGhpcy5wZW5kaW5nUGlwZXMuYWRkKHR5cGUpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgcXVldWVUeXBlc0Zyb21Nb2R1bGVzQXJyYXkoYXJyOiBhbnlbXSk6IHZvaWQge1xuICAgIGZvciAoY29uc3QgdmFsdWUgb2YgYXJyKSB7XG4gICAgICBpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHtcbiAgICAgICAgdGhpcy5xdWV1ZVR5cGVzRnJvbU1vZHVsZXNBcnJheSh2YWx1ZSk7XG4gICAgICB9IGVsc2UgaWYgKGhhc05nTW9kdWxlRGVmKHZhbHVlKSkge1xuICAgICAgICBjb25zdCBkZWYgPSB2YWx1ZS5uZ01vZHVsZURlZjtcbiAgICAgICAgLy8gTG9vayB0aHJvdWdoIGRlY2xhcmF0aW9ucywgaW1wb3J0cywgYW5kIGV4cG9ydHMsIGFuZCBxdWV1ZSBldmVyeXRoaW5nIGZvdW5kIHRoZXJlLlxuICAgICAgICB0aGlzLnF1ZXVlVHlwZUFycmF5KG1heWJlVW53cmFwRm4oZGVmLmRlY2xhcmF0aW9ucyksIHZhbHVlKTtcbiAgICAgICAgdGhpcy5xdWV1ZVR5cGVzRnJvbU1vZHVsZXNBcnJheShtYXliZVVud3JhcEZuKGRlZi5pbXBvcnRzKSk7XG4gICAgICAgIHRoaXMucXVldWVUeXBlc0Zyb21Nb2R1bGVzQXJyYXkobWF5YmVVbndyYXBGbihkZWYuZXhwb3J0cykpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgbWF5YmVTdG9yZU5nRGVmKHByb3A6IHN0cmluZywgdHlwZTogVHlwZTxhbnk+KSB7XG4gICAgaWYgKCF0aGlzLmluaXRpYWxOZ0RlZnMuaGFzKHR5cGUpKSB7XG4gICAgICBjb25zdCBjdXJyZW50RGVmID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcih0eXBlLCBwcm9wKTtcbiAgICAgIHRoaXMuaW5pdGlhbE5nRGVmcy5zZXQodHlwZSwgW3Byb3AsIGN1cnJlbnREZWZdKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIHN0b3JlRmllbGRPZkRlZk9uVHlwZSh0eXBlOiBUeXBlPGFueT4sIGRlZkZpZWxkOiBzdHJpbmcsIGZpZWxkOiBzdHJpbmcpOiB2b2lkIHtcbiAgICBjb25zdCBkZWY6IGFueSA9ICh0eXBlIGFzIGFueSlbZGVmRmllbGRdO1xuICAgIGNvbnN0IG9yaWdpbmFsOiBhbnkgPSBkZWZbZmllbGRdO1xuICAgIHRoaXMuZGVmQ2xlYW51cE9wcy5wdXNoKHtmaWVsZCwgZGVmLCBvcmlnaW5hbH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIENsZWFycyBjdXJyZW50IGNvbXBvbmVudHMgcmVzb2x1dGlvbiBxdWV1ZSwgYnV0IHN0b3JlcyB0aGUgc3RhdGUgb2YgdGhlIHF1ZXVlLCBzbyB3ZSBjYW5cbiAgICogcmVzdG9yZSBpdCBsYXRlci4gQ2xlYXJpbmcgdGhlIHF1ZXVlIGlzIHJlcXVpcmVkIGJlZm9yZSB3ZSB0cnkgdG8gY29tcGlsZSBjb21wb25lbnRzICh2aWFcbiAgICogYFRlc3RCZWQuY29tcGlsZUNvbXBvbmVudHNgKSwgc28gdGhhdCBjb21wb25lbnQgZGVmcyBhcmUgaW4gc3luYyB3aXRoIHRoZSByZXNvbHV0aW9uIHF1ZXVlLlxuICAgKi9cbiAgcHJpdmF0ZSBjbGVhckNvbXBvbmVudFJlc29sdXRpb25RdWV1ZSgpIHtcbiAgICBpZiAodGhpcy5vcmlnaW5hbENvbXBvbmVudFJlc29sdXRpb25RdWV1ZSA9PT0gbnVsbCkge1xuICAgICAgdGhpcy5vcmlnaW5hbENvbXBvbmVudFJlc29sdXRpb25RdWV1ZSA9IG5ldyBNYXAoKTtcbiAgICB9XG4gICAgY2xlYXJSZXNvbHV0aW9uT2ZDb21wb25lbnRSZXNvdXJjZXNRdWV1ZSgpLmZvckVhY2goXG4gICAgICAgICh2YWx1ZSwga2V5KSA9PiB0aGlzLm9yaWdpbmFsQ29tcG9uZW50UmVzb2x1dGlvblF1ZXVlICEuc2V0KGtleSwgdmFsdWUpKTtcbiAgfVxuXG4gIC8qXG4gICAqIFJlc3RvcmVzIGNvbXBvbmVudCByZXNvbHV0aW9uIHF1ZXVlIHRvIHRoZSBwcmV2aW91c2x5IHNhdmVkIHN0YXRlLiBUaGlzIG9wZXJhdGlvbiBpcyBwZXJmb3JtZWRcbiAgICogYXMgYSBwYXJ0IG9mIHJlc3RvcmluZyB0aGUgc3RhdGUgYWZ0ZXIgY29tcGxldGlvbiBvZiB0aGUgY3VycmVudCBzZXQgb2YgdGVzdHMgKHRoYXQgbWlnaHRcbiAgICogcG90ZW50aWFsbHkgbXV0YXRlIHRoZSBzdGF0ZSkuXG4gICAqL1xuICBwcml2YXRlIHJlc3RvcmVDb21wb25lbnRSZXNvbHV0aW9uUXVldWUoKSB7XG4gICAgaWYgKHRoaXMub3JpZ2luYWxDb21wb25lbnRSZXNvbHV0aW9uUXVldWUgIT09IG51bGwpIHtcbiAgICAgIHJlc3RvcmVDb21wb25lbnRSZXNvbHV0aW9uUXVldWUodGhpcy5vcmlnaW5hbENvbXBvbmVudFJlc29sdXRpb25RdWV1ZSk7XG4gICAgICB0aGlzLm9yaWdpbmFsQ29tcG9uZW50UmVzb2x1dGlvblF1ZXVlID0gbnVsbDtcbiAgICB9XG4gIH1cblxuICByZXN0b3JlT3JpZ2luYWxTdGF0ZSgpOiB2b2lkIHtcbiAgICAvLyBQcm9jZXNzIGNsZWFudXAgb3BzIGluIHJldmVyc2Ugb3JkZXIgc28gdGhlIGZpZWxkJ3Mgb3JpZ2luYWwgdmFsdWUgaXMgcmVzdG9yZWQgY29ycmVjdGx5IChpblxuICAgIC8vIGNhc2UgdGhlcmUgd2VyZSBtdWx0aXBsZSBvdmVycmlkZXMgZm9yIHRoZSBzYW1lIGZpZWxkKS5cbiAgICBmb3JFYWNoUmlnaHQodGhpcy5kZWZDbGVhbnVwT3BzLCAob3A6IENsZWFudXBPcGVyYXRpb24pID0+IHsgb3AuZGVmW29wLmZpZWxkXSA9IG9wLm9yaWdpbmFsOyB9KTtcbiAgICAvLyBSZXN0b3JlIGluaXRpYWwgY29tcG9uZW50L2RpcmVjdGl2ZS9waXBlIGRlZnNcbiAgICB0aGlzLmluaXRpYWxOZ0RlZnMuZm9yRWFjaChcbiAgICAgICAgKHZhbHVlOiBbc3RyaW5nLCBQcm9wZXJ0eURlc2NyaXB0b3IgfCB1bmRlZmluZWRdLCB0eXBlOiBUeXBlPGFueT4pID0+IHtcbiAgICAgICAgICBjb25zdCBbcHJvcCwgZGVzY3JpcHRvcl0gPSB2YWx1ZTtcbiAgICAgICAgICBpZiAoIWRlc2NyaXB0b3IpIHtcbiAgICAgICAgICAgIC8vIERlbGV0ZSBvcGVyYXRpb25zIGFyZSBnZW5lcmFsbHkgdW5kZXNpcmFibGUgc2luY2UgdGhleSBoYXZlIHBlcmZvcm1hbmNlIGltcGxpY2F0aW9uc1xuICAgICAgICAgICAgLy8gb24gb2JqZWN0cyB0aGV5IHdlcmUgYXBwbGllZCB0by4gSW4gdGhpcyBwYXJ0aWN1bGFyIGNhc2UsIHNpdHVhdGlvbnMgd2hlcmUgdGhpcyBjb2RlXG4gICAgICAgICAgICAvLyBpcyBpbnZva2VkIHNob3VsZCBiZSBxdWl0ZSByYXJlIHRvIGNhdXNlIGFueSBub3RpY2VhYmxlIGltcGFjdCwgc2luY2UgaXQncyBhcHBsaWVkXG4gICAgICAgICAgICAvLyBvbmx5IHRvIHNvbWUgdGVzdCBjYXNlcyAoZm9yIGV4YW1wbGUgd2hlbiBjbGFzcyB3aXRoIG5vIGFubm90YXRpb25zIGV4dGVuZHMgc29tZVxuICAgICAgICAgICAgLy8gQENvbXBvbmVudCkgd2hlbiB3ZSBuZWVkIHRvIGNsZWFyICfJtWNtcCcgZmllbGQgb24gYSBnaXZlbiBjbGFzcyB0byByZXN0b3JlXG4gICAgICAgICAgICAvLyBpdHMgb3JpZ2luYWwgc3RhdGUgKGJlZm9yZSBhcHBseWluZyBvdmVycmlkZXMgYW5kIHJ1bm5pbmcgdGVzdHMpLlxuICAgICAgICAgICAgZGVsZXRlICh0eXBlIGFzIGFueSlbcHJvcF07XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0eXBlLCBwcm9wLCBkZXNjcmlwdG9yKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIHRoaXMuaW5pdGlhbE5nRGVmcy5jbGVhcigpO1xuICAgIHRoaXMubW9kdWxlUHJvdmlkZXJzT3ZlcnJpZGRlbi5jbGVhcigpO1xuICAgIHRoaXMucmVzdG9yZUNvbXBvbmVudFJlc29sdXRpb25RdWV1ZSgpO1xuICAgIGlmICh0aGlzLm9yaWdpbmFsUmVnaXN0ZXJlZE1vZHVsZXMpIHtcbiAgICAgIHJlc3RvcmVSZWdpc3RlcmVkTW9kdWxlc1N0YXRlKHRoaXMub3JpZ2luYWxSZWdpc3RlcmVkTW9kdWxlcyk7XG4gICAgICB0aGlzLm9yaWdpbmFsUmVnaXN0ZXJlZE1vZHVsZXMgPSBudWxsO1xuICAgIH1cbiAgICAvLyBSZXN0b3JlIHRoZSBsb2NhbGUgSUQgdG8gdGhlIGRlZmF1bHQgdmFsdWUsIHRoaXMgc2hvdWxkbid0IGJlIG5lY2Vzc2FyeSBidXQgd2UgbmV2ZXIga25vd1xuICAgIHNldExvY2FsZUlkKERFRkFVTFRfTE9DQUxFX0lEKTtcbiAgfVxuXG4gIHByaXZhdGUgY29tcGlsZVRlc3RNb2R1bGUoKTogdm9pZCB7XG4gICAgY2xhc3MgUm9vdFNjb3BlTW9kdWxlIHt9XG4gICAgY29tcGlsZU5nTW9kdWxlRGVmcyhSb290U2NvcGVNb2R1bGUgYXMgTmdNb2R1bGVUeXBlPGFueT4sIHtcbiAgICAgIHByb3ZpZGVyczogWy4uLnRoaXMucm9vdFByb3ZpZGVyT3ZlcnJpZGVzXSxcbiAgICB9KTtcblxuICAgIGNvbnN0IG5nWm9uZSA9IG5ldyBOZ1pvbmUoe2VuYWJsZUxvbmdTdGFja1RyYWNlOiB0cnVlfSk7XG4gICAgY29uc3QgcHJvdmlkZXJzOiBQcm92aWRlcltdID0gW1xuICAgICAge3Byb3ZpZGU6IE5nWm9uZSwgdXNlVmFsdWU6IG5nWm9uZX0sXG4gICAgICB7cHJvdmlkZTogQ29tcGlsZXIsIHVzZUZhY3Rvcnk6ICgpID0+IG5ldyBSM1Rlc3RDb21waWxlcih0aGlzKX0sXG4gICAgICAuLi50aGlzLnByb3ZpZGVycyxcbiAgICAgIC4uLnRoaXMucHJvdmlkZXJPdmVycmlkZXMsXG4gICAgXTtcbiAgICBjb25zdCBpbXBvcnRzID0gW1Jvb3RTY29wZU1vZHVsZSwgdGhpcy5hZGRpdGlvbmFsTW9kdWxlVHlwZXMsIHRoaXMuaW1wb3J0cyB8fCBbXV07XG5cbiAgICAvLyBjbGFuZy1mb3JtYXQgb2ZmXG4gICAgY29tcGlsZU5nTW9kdWxlRGVmcyh0aGlzLnRlc3RNb2R1bGVUeXBlLCB7XG4gICAgICBkZWNsYXJhdGlvbnM6IHRoaXMuZGVjbGFyYXRpb25zLFxuICAgICAgaW1wb3J0cyxcbiAgICAgIHNjaGVtYXM6IHRoaXMuc2NoZW1hcyxcbiAgICAgIHByb3ZpZGVycyxcbiAgICB9LCAvKiBhbGxvd0R1cGxpY2F0ZURlY2xhcmF0aW9uc0luUm9vdCAqLyB0cnVlKTtcbiAgICAvLyBjbGFuZy1mb3JtYXQgb25cblxuICAgIHRoaXMuYXBwbHlQcm92aWRlck92ZXJyaWRlc1RvTW9kdWxlKHRoaXMudGVzdE1vZHVsZVR5cGUpO1xuICB9XG5cbiAgZ2V0IGluamVjdG9yKCk6IEluamVjdG9yIHtcbiAgICBpZiAodGhpcy5faW5qZWN0b3IgIT09IG51bGwpIHtcbiAgICAgIHJldHVybiB0aGlzLl9pbmplY3RvcjtcbiAgICB9XG5cbiAgICBjb25zdCBwcm92aWRlcnM6IFByb3ZpZGVyW10gPSBbXTtcbiAgICBjb25zdCBjb21waWxlck9wdGlvbnMgPSB0aGlzLnBsYXRmb3JtLmluamVjdG9yLmdldChDT01QSUxFUl9PUFRJT05TKTtcbiAgICBjb21waWxlck9wdGlvbnMuZm9yRWFjaChvcHRzID0+IHtcbiAgICAgIGlmIChvcHRzLnByb3ZpZGVycykge1xuICAgICAgICBwcm92aWRlcnMucHVzaChvcHRzLnByb3ZpZGVycyk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgaWYgKHRoaXMuY29tcGlsZXJQcm92aWRlcnMgIT09IG51bGwpIHtcbiAgICAgIHByb3ZpZGVycy5wdXNoKC4uLnRoaXMuY29tcGlsZXJQcm92aWRlcnMpO1xuICAgIH1cblxuICAgIC8vIFRPRE8ob2NvbWJlKTogbWFrZSB0aGlzIHdvcmsgd2l0aCBhbiBJbmplY3RvciBkaXJlY3RseSBpbnN0ZWFkIG9mIGNyZWF0aW5nIGEgbW9kdWxlIGZvciBpdFxuICAgIGNsYXNzIENvbXBpbGVyTW9kdWxlIHt9XG4gICAgY29tcGlsZU5nTW9kdWxlRGVmcyhDb21waWxlck1vZHVsZSBhcyBOZ01vZHVsZVR5cGU8YW55Piwge3Byb3ZpZGVyc30pO1xuXG4gICAgY29uc3QgQ29tcGlsZXJNb2R1bGVGYWN0b3J5ID0gbmV3IFIzTmdNb2R1bGVGYWN0b3J5KENvbXBpbGVyTW9kdWxlKTtcbiAgICB0aGlzLl9pbmplY3RvciA9IENvbXBpbGVyTW9kdWxlRmFjdG9yeS5jcmVhdGUodGhpcy5wbGF0Zm9ybS5pbmplY3RvcikuaW5qZWN0b3I7XG4gICAgcmV0dXJuIHRoaXMuX2luamVjdG9yO1xuICB9XG5cbiAgLy8gZ2V0IG92ZXJyaWRlcyBmb3IgYSBzcGVjaWZpYyBwcm92aWRlciAoaWYgYW55KVxuICBwcml2YXRlIGdldFNpbmdsZVByb3ZpZGVyT3ZlcnJpZGVzKHByb3ZpZGVyOiBQcm92aWRlcik6IFByb3ZpZGVyfG51bGwge1xuICAgIGNvbnN0IHRva2VuID0gZ2V0UHJvdmlkZXJUb2tlbihwcm92aWRlcik7XG4gICAgcmV0dXJuIHRoaXMucHJvdmlkZXJPdmVycmlkZXNCeVRva2VuLmdldCh0b2tlbikgfHwgbnVsbDtcbiAgfVxuXG4gIHByaXZhdGUgZ2V0UHJvdmlkZXJPdmVycmlkZXMocHJvdmlkZXJzPzogUHJvdmlkZXJbXSk6IFByb3ZpZGVyW10ge1xuICAgIGlmICghcHJvdmlkZXJzIHx8ICFwcm92aWRlcnMubGVuZ3RoIHx8IHRoaXMucHJvdmlkZXJPdmVycmlkZXNCeVRva2VuLnNpemUgPT09IDApIHJldHVybiBbXTtcbiAgICAvLyBUaGVyZSBhcmUgdHdvIGZsYXR0ZW5pbmcgb3BlcmF0aW9ucyBoZXJlLiBUaGUgaW5uZXIgZmxhdHRlbigpIG9wZXJhdGVzIG9uIHRoZSBtZXRhZGF0YSdzXG4gICAgLy8gcHJvdmlkZXJzIGFuZCBhcHBsaWVzIGEgbWFwcGluZyBmdW5jdGlvbiB3aGljaCByZXRyaWV2ZXMgb3ZlcnJpZGVzIGZvciBlYWNoIGluY29taW5nXG4gICAgLy8gcHJvdmlkZXIuIFRoZSBvdXRlciBmbGF0dGVuKCkgdGhlbiBmbGF0dGVucyB0aGUgcHJvZHVjZWQgb3ZlcnJpZGVzIGFycmF5LiBJZiB0aGlzIGlzIG5vdFxuICAgIC8vIGRvbmUsIHRoZSBhcnJheSBjYW4gY29udGFpbiBvdGhlciBlbXB0eSBhcnJheXMgKGUuZy4gYFtbXSwgW11dYCkgd2hpY2ggbGVhayBpbnRvIHRoZVxuICAgIC8vIHByb3ZpZGVycyBhcnJheSBhbmQgY29udGFtaW5hdGUgYW55IGVycm9yIG1lc3NhZ2VzIHRoYXQgbWlnaHQgYmUgZ2VuZXJhdGVkLlxuICAgIHJldHVybiBmbGF0dGVuKGZsYXR0ZW4oXG4gICAgICAgIHByb3ZpZGVycywgKHByb3ZpZGVyOiBQcm92aWRlcikgPT4gdGhpcy5nZXRTaW5nbGVQcm92aWRlck92ZXJyaWRlcyhwcm92aWRlcikgfHwgW10pKTtcbiAgfVxuXG4gIHByaXZhdGUgZ2V0T3ZlcnJpZGRlblByb3ZpZGVycyhwcm92aWRlcnM/OiBQcm92aWRlcltdKTogUHJvdmlkZXJbXSB7XG4gICAgaWYgKCFwcm92aWRlcnMgfHwgIXByb3ZpZGVycy5sZW5ndGggfHwgdGhpcy5wcm92aWRlck92ZXJyaWRlc0J5VG9rZW4uc2l6ZSA9PT0gMCkgcmV0dXJuIFtdO1xuXG4gICAgY29uc3Qgb3ZlcnJpZGVzID0gdGhpcy5nZXRQcm92aWRlck92ZXJyaWRlcyhwcm92aWRlcnMpO1xuICAgIGNvbnN0IGhhc011bHRpUHJvdmlkZXJPdmVycmlkZXMgPSBvdmVycmlkZXMuc29tZShpc011bHRpUHJvdmlkZXIpO1xuICAgIGNvbnN0IG92ZXJyaWRkZW5Qcm92aWRlcnMgPSBbLi4ucHJvdmlkZXJzLCAuLi5vdmVycmlkZXNdO1xuXG4gICAgLy8gTm8gYWRkaXRpb25hbCBwcm9jZXNzaW5nIGlzIHJlcXVpcmVkIGluIGNhc2Ugd2UgaGF2ZSBubyBtdWx0aSBwcm92aWRlcnMgdG8gb3ZlcnJpZGVcbiAgICBpZiAoIWhhc011bHRpUHJvdmlkZXJPdmVycmlkZXMpIHtcbiAgICAgIHJldHVybiBvdmVycmlkZGVuUHJvdmlkZXJzO1xuICAgIH1cblxuICAgIGNvbnN0IGZpbmFsOiBQcm92aWRlcltdID0gW107XG4gICAgY29uc3Qgc2Vlbk11bHRpUHJvdmlkZXJzID0gbmV3IFNldDxQcm92aWRlcj4oKTtcblxuICAgIC8vIFdlIGl0ZXJhdGUgdGhyb3VnaCB0aGUgbGlzdCBvZiBwcm92aWRlcnMgaW4gcmV2ZXJzZSBvcmRlciB0byBtYWtlIHN1cmUgbXVsdGkgcHJvdmlkZXJcbiAgICAvLyBvdmVycmlkZXMgdGFrZSBwcmVjZWRlbmNlIG92ZXIgdGhlIHZhbHVlcyBkZWZpbmVkIGluIHByb3ZpZGVyIGxpc3QuIFdlIGFsc28gZml0ZXIgb3V0IGFsbFxuICAgIC8vIG11bHRpIHByb3ZpZGVycyB0aGF0IGhhdmUgb3ZlcnJpZGVzLCBrZWVwaW5nIG92ZXJyaWRkZW4gdmFsdWVzIG9ubHkuXG4gICAgZm9yRWFjaFJpZ2h0KG92ZXJyaWRkZW5Qcm92aWRlcnMsIChwcm92aWRlcjogYW55KSA9PiB7XG4gICAgICBjb25zdCB0b2tlbjogYW55ID0gZ2V0UHJvdmlkZXJUb2tlbihwcm92aWRlcik7XG4gICAgICBpZiAoaXNNdWx0aVByb3ZpZGVyKHByb3ZpZGVyKSAmJiB0aGlzLnByb3ZpZGVyT3ZlcnJpZGVzQnlUb2tlbi5oYXModG9rZW4pKSB7XG4gICAgICAgIGlmICghc2Vlbk11bHRpUHJvdmlkZXJzLmhhcyh0b2tlbikpIHtcbiAgICAgICAgICBzZWVuTXVsdGlQcm92aWRlcnMuYWRkKHRva2VuKTtcbiAgICAgICAgICBpZiAocHJvdmlkZXIgJiYgcHJvdmlkZXIudXNlVmFsdWUgJiYgQXJyYXkuaXNBcnJheShwcm92aWRlci51c2VWYWx1ZSkpIHtcbiAgICAgICAgICAgIGZvckVhY2hSaWdodChwcm92aWRlci51c2VWYWx1ZSwgKHZhbHVlOiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgLy8gVW53cmFwIHByb3ZpZGVyIG92ZXJyaWRlIGFycmF5IGludG8gaW5kaXZpZHVhbCBwcm92aWRlcnMgaW4gZmluYWwgc2V0LlxuICAgICAgICAgICAgICBmaW5hbC51bnNoaWZ0KHtwcm92aWRlOiB0b2tlbiwgdXNlVmFsdWU6IHZhbHVlLCBtdWx0aTogdHJ1ZX0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGZpbmFsLnVuc2hpZnQocHJvdmlkZXIpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZmluYWwudW5zaGlmdChwcm92aWRlcik7XG4gICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIGZpbmFsO1xuICB9XG5cbiAgcHJpdmF0ZSBoYXNQcm92aWRlck92ZXJyaWRlcyhwcm92aWRlcnM/OiBQcm92aWRlcltdKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0UHJvdmlkZXJPdmVycmlkZXMocHJvdmlkZXJzKS5sZW5ndGggPiAwO1xuICB9XG5cbiAgcHJpdmF0ZSBwYXRjaERlZldpdGhQcm92aWRlck92ZXJyaWRlcyhkZWNsYXJhdGlvbjogVHlwZTxhbnk+LCBmaWVsZDogc3RyaW5nKTogdm9pZCB7XG4gICAgY29uc3QgZGVmID0gKGRlY2xhcmF0aW9uIGFzIGFueSlbZmllbGRdO1xuICAgIGlmIChkZWYgJiYgZGVmLnByb3ZpZGVyc1Jlc29sdmVyKSB7XG4gICAgICB0aGlzLm1heWJlU3RvcmVOZ0RlZihmaWVsZCwgZGVjbGFyYXRpb24pO1xuXG4gICAgICBjb25zdCByZXNvbHZlciA9IGRlZi5wcm92aWRlcnNSZXNvbHZlcjtcbiAgICAgIGNvbnN0IHByb2Nlc3NQcm92aWRlcnNGbiA9IChwcm92aWRlcnM6IFByb3ZpZGVyW10pID0+IHRoaXMuZ2V0T3ZlcnJpZGRlblByb3ZpZGVycyhwcm92aWRlcnMpO1xuICAgICAgdGhpcy5zdG9yZUZpZWxkT2ZEZWZPblR5cGUoZGVjbGFyYXRpb24sIGZpZWxkLCAncHJvdmlkZXJzUmVzb2x2ZXInKTtcbiAgICAgIGRlZi5wcm92aWRlcnNSZXNvbHZlciA9IChuZ0RlZjogRGlyZWN0aXZlRGVmPGFueT4pID0+IHJlc29sdmVyKG5nRGVmLCBwcm9jZXNzUHJvdmlkZXJzRm4pO1xuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBpbml0UmVzb2x2ZXJzKCk6IFJlc29sdmVycyB7XG4gIHJldHVybiB7XG4gICAgbW9kdWxlOiBuZXcgTmdNb2R1bGVSZXNvbHZlcigpLFxuICAgIGNvbXBvbmVudDogbmV3IENvbXBvbmVudFJlc29sdmVyKCksXG4gICAgZGlyZWN0aXZlOiBuZXcgRGlyZWN0aXZlUmVzb2x2ZXIoKSxcbiAgICBwaXBlOiBuZXcgUGlwZVJlc29sdmVyKClcbiAgfTtcbn1cblxuZnVuY3Rpb24gaGFzTmdNb2R1bGVEZWY8VD4odmFsdWU6IFR5cGU8VD4pOiB2YWx1ZSBpcyBOZ01vZHVsZVR5cGU8VD4ge1xuICByZXR1cm4gdmFsdWUuaGFzT3duUHJvcGVydHkoJ25nTW9kdWxlRGVmJyk7XG59XG5cbmZ1bmN0aW9uIG1heWJlVW53cmFwRm48VD4obWF5YmVGbjogKCgpID0+IFQpIHwgVCk6IFQge1xuICByZXR1cm4gbWF5YmVGbiBpbnN0YW5jZW9mIEZ1bmN0aW9uID8gbWF5YmVGbigpIDogbWF5YmVGbjtcbn1cblxuZnVuY3Rpb24gZmxhdHRlbjxUPih2YWx1ZXM6IGFueVtdLCBtYXBGbj86ICh2YWx1ZTogVCkgPT4gYW55KTogVFtdIHtcbiAgY29uc3Qgb3V0OiBUW10gPSBbXTtcbiAgdmFsdWVzLmZvckVhY2godmFsdWUgPT4ge1xuICAgIGlmIChBcnJheS5pc0FycmF5KHZhbHVlKSkge1xuICAgICAgb3V0LnB1c2goLi4uZmxhdHRlbjxUPih2YWx1ZSwgbWFwRm4pKTtcbiAgICB9IGVsc2Uge1xuICAgICAgb3V0LnB1c2gobWFwRm4gPyBtYXBGbih2YWx1ZSkgOiB2YWx1ZSk7XG4gICAgfVxuICB9KTtcbiAgcmV0dXJuIG91dDtcbn1cblxuZnVuY3Rpb24gZ2V0UHJvdmlkZXJGaWVsZChwcm92aWRlcjogUHJvdmlkZXIsIGZpZWxkOiBzdHJpbmcpIHtcbiAgcmV0dXJuIHByb3ZpZGVyICYmIHR5cGVvZiBwcm92aWRlciA9PT0gJ29iamVjdCcgJiYgKHByb3ZpZGVyIGFzIGFueSlbZmllbGRdO1xufVxuXG5mdW5jdGlvbiBnZXRQcm92aWRlclRva2VuKHByb3ZpZGVyOiBQcm92aWRlcikge1xuICByZXR1cm4gZ2V0UHJvdmlkZXJGaWVsZChwcm92aWRlciwgJ3Byb3ZpZGUnKSB8fCBwcm92aWRlcjtcbn1cblxuZnVuY3Rpb24gaXNNdWx0aVByb3ZpZGVyKHByb3ZpZGVyOiBQcm92aWRlcikge1xuICByZXR1cm4gISFnZXRQcm92aWRlckZpZWxkKHByb3ZpZGVyLCAnbXVsdGknKTtcbn1cblxuZnVuY3Rpb24gaXNNb2R1bGVXaXRoUHJvdmlkZXJzKHZhbHVlOiBhbnkpOiB2YWx1ZSBpcyBNb2R1bGVXaXRoUHJvdmlkZXJzPGFueT4ge1xuICByZXR1cm4gdmFsdWUuaGFzT3duUHJvcGVydHkoJ25nTW9kdWxlJyk7XG59XG5cbmZ1bmN0aW9uIGZvckVhY2hSaWdodDxUPih2YWx1ZXM6IFRbXSwgZm46ICh2YWx1ZTogVCwgaWR4OiBudW1iZXIpID0+IHZvaWQpOiB2b2lkIHtcbiAgZm9yIChsZXQgaWR4ID0gdmFsdWVzLmxlbmd0aCAtIDE7IGlkeCA+PSAwOyBpZHgtLSkge1xuICAgIGZuKHZhbHVlc1tpZHhdLCBpZHgpO1xuICB9XG59XG5cbmNsYXNzIFIzVGVzdENvbXBpbGVyIGltcGxlbWVudHMgQ29tcGlsZXIge1xuICBjb25zdHJ1Y3Rvcihwcml2YXRlIHRlc3RCZWQ6IFIzVGVzdEJlZENvbXBpbGVyKSB7fVxuXG4gIGNvbXBpbGVNb2R1bGVTeW5jPFQ+KG1vZHVsZVR5cGU6IFR5cGU8VD4pOiBOZ01vZHVsZUZhY3Rvcnk8VD4ge1xuICAgIHRoaXMudGVzdEJlZC5fY29tcGlsZU5nTW9kdWxlU3luYyhtb2R1bGVUeXBlKTtcbiAgICByZXR1cm4gbmV3IFIzTmdNb2R1bGVGYWN0b3J5KG1vZHVsZVR5cGUpO1xuICB9XG5cbiAgYXN5bmMgY29tcGlsZU1vZHVsZUFzeW5jPFQ+KG1vZHVsZVR5cGU6IFR5cGU8VD4pOiBQcm9taXNlPE5nTW9kdWxlRmFjdG9yeTxUPj4ge1xuICAgIGF3YWl0IHRoaXMudGVzdEJlZC5fY29tcGlsZU5nTW9kdWxlQXN5bmMobW9kdWxlVHlwZSk7XG4gICAgcmV0dXJuIG5ldyBSM05nTW9kdWxlRmFjdG9yeShtb2R1bGVUeXBlKTtcbiAgfVxuXG4gIGNvbXBpbGVNb2R1bGVBbmRBbGxDb21wb25lbnRzU3luYzxUPihtb2R1bGVUeXBlOiBUeXBlPFQ+KTogTW9kdWxlV2l0aENvbXBvbmVudEZhY3RvcmllczxUPiB7XG4gICAgY29uc3QgbmdNb2R1bGVGYWN0b3J5ID0gdGhpcy5jb21waWxlTW9kdWxlU3luYyhtb2R1bGVUeXBlKTtcbiAgICBjb25zdCBjb21wb25lbnRGYWN0b3JpZXMgPSB0aGlzLnRlc3RCZWQuX2dldENvbXBvbmVudEZhY3Rvcmllcyhtb2R1bGVUeXBlIGFzIE5nTW9kdWxlVHlwZTxUPik7XG4gICAgcmV0dXJuIG5ldyBNb2R1bGVXaXRoQ29tcG9uZW50RmFjdG9yaWVzKG5nTW9kdWxlRmFjdG9yeSwgY29tcG9uZW50RmFjdG9yaWVzKTtcbiAgfVxuXG4gIGFzeW5jIGNvbXBpbGVNb2R1bGVBbmRBbGxDb21wb25lbnRzQXN5bmM8VD4obW9kdWxlVHlwZTogVHlwZTxUPik6XG4gICAgICBQcm9taXNlPE1vZHVsZVdpdGhDb21wb25lbnRGYWN0b3JpZXM8VD4+IHtcbiAgICBjb25zdCBuZ01vZHVsZUZhY3RvcnkgPSBhd2FpdCB0aGlzLmNvbXBpbGVNb2R1bGVBc3luYyhtb2R1bGVUeXBlKTtcbiAgICBjb25zdCBjb21wb25lbnRGYWN0b3JpZXMgPSB0aGlzLnRlc3RCZWQuX2dldENvbXBvbmVudEZhY3Rvcmllcyhtb2R1bGVUeXBlIGFzIE5nTW9kdWxlVHlwZTxUPik7XG4gICAgcmV0dXJuIG5ldyBNb2R1bGVXaXRoQ29tcG9uZW50RmFjdG9yaWVzKG5nTW9kdWxlRmFjdG9yeSwgY29tcG9uZW50RmFjdG9yaWVzKTtcbiAgfVxuXG4gIGNsZWFyQ2FjaGUoKTogdm9pZCB7fVxuXG4gIGNsZWFyQ2FjaGVGb3IodHlwZTogVHlwZTxhbnk+KTogdm9pZCB7fVxuXG4gIGdldE1vZHVsZUlkKG1vZHVsZVR5cGU6IFR5cGU8YW55Pik6IHN0cmluZ3x1bmRlZmluZWQge1xuICAgIGNvbnN0IG1ldGEgPSB0aGlzLnRlc3RCZWQuX2dldE1vZHVsZVJlc29sdmVyKCkucmVzb2x2ZShtb2R1bGVUeXBlKTtcbiAgICByZXR1cm4gbWV0YSAmJiBtZXRhLmlkIHx8IHVuZGVmaW5lZDtcbiAgfVxufVxuIl19