/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { __assign, __awaiter, __generator, __read, __spread, __values } from "tslib";
import { ResourceLoader } from '@angular/compiler';
import { ApplicationInitStatus, COMPILER_OPTIONS, Compiler, LOCALE_ID, ModuleWithComponentFactories, NgZone, ɵDEFAULT_LOCALE_ID as DEFAULT_LOCALE_ID, ɵNG_COMP_DEF as NG_COMP_DEF, ɵNG_DIR_DEF as NG_DIR_DEF, ɵNG_INJ_DEF as NG_INJ_DEF, ɵNG_MOD_DEF as NG_MOD_DEF, ɵNG_PIPE_DEF as NG_PIPE_DEF, ɵNgModuleFactory as R3NgModuleFactory, ɵRender3ComponentFactory as ComponentFactory, ɵRender3NgModuleRef as NgModuleRef, ɵcompileComponent as compileComponent, ɵcompileDirective as compileDirective, ɵcompileNgModuleDefs as compileNgModuleDefs, ɵcompilePipe as compilePipe, ɵgetInjectableDef as getInjectableDef, ɵpatchComponentDefWithScope as patchComponentDefWithScope, ɵsetLocaleId as setLocaleId, ɵtransitiveScopesFor as transitiveScopesFor } from '@angular/core';
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
            (_a = this.declarations).push.apply(_a, __spread(moduleDef.declarations));
        }
        // Enqueue any compilation tasks for imported modules.
        if (moduleDef.imports !== undefined) {
            this.queueTypesFromModulesArray(moduleDef.imports);
            (_b = this.imports).push.apply(_b, __spread(moduleDef.imports));
        }
        if (moduleDef.providers !== undefined) {
            (_c = this.providers).push.apply(_c, __spread(moduleDef.providers));
        }
        if (moduleDef.schemas !== undefined) {
            (_d = this.schemas).push.apply(_d, __spread(moduleDef.schemas));
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
        // At this point, the module has a valid module def (ɵmod), but the override may have introduced
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
                multi: provider.multi
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
        return __awaiter(this, void 0, void 0, function () {
            var needsAsyncResources, resourceLoader_1, resolver;
            var _this = this;
            return __generator(this, function (_a) {
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
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
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
        return maybeUnwrapFn(moduleType.ɵmod.declarations).reduce(function (factories, declaration) {
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
            _this.maybeStoreNgDef(NG_DIR_DEF, declaration);
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
        this.seenDirectives.forEach(maybeApplyOverrides(NG_DIR_DEF));
        this.seenComponents.clear();
        this.seenDirectives.clear();
    };
    R3TestBedCompiler.prototype.applyProviderOverridesToModule = function (moduleType) {
        var e_1, _a, e_2, _b;
        if (this.moduleProvidersOverridden.has(moduleType)) {
            return;
        }
        this.moduleProvidersOverridden.add(moduleType);
        var injectorDef = moduleType[NG_INJ_DEF];
        if (this.providerOverridesByToken.size > 0) {
            // Extract the list of providers from ModuleWithProviders, so we can define the final list of
            // providers that might have overrides.
            // Note: second `flatten` operation is needed to convert an array of providers
            // (e.g. `[[], []]`) into one flat list, also eliminating empty arrays.
            var providersFromModules = flatten(flatten(injectorDef.imports, function (imported) {
                return isModuleWithProviders(imported) ? imported.providers : [];
            }));
            var providers = __spread(providersFromModules, injectorDef.providers);
            if (this.hasProviderOverrides(providers)) {
                this.maybeStoreNgDef(NG_INJ_DEF, moduleType);
                this.storeFieldOfDefOnType(moduleType, NG_INJ_DEF, 'providers');
                injectorDef.providers = this.getOverriddenProviders(providers);
            }
            // Apply provider overrides to imported modules recursively
            var moduleDef = moduleType[NG_MOD_DEF];
            try {
                for (var _c = __values(moduleDef.imports), _d = _c.next(); !_d.done; _d = _c.next()) {
                    var importedModule = _d.value;
                    this.applyProviderOverridesToModule(importedModule);
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (_d && !_d.done && (_a = _c.return)) _a.call(_c);
                }
                finally { if (e_1) throw e_1.error; }
            }
            try {
                // Also override the providers on any ModuleWithProviders imports since those don't appear in
                // the moduleDef.
                for (var _e = __values(flatten(injectorDef.imports)), _f = _e.next(); !_f.done; _f = _e.next()) {
                    var importedModule = _f.value;
                    if (isModuleWithProviders(importedModule)) {
                        this.defCleanupOps.push({
                            object: importedModule,
                            fieldName: 'providers',
                            originalValue: importedModule.providers
                        });
                        importedModule.providers = this.getOverriddenProviders(importedModule.providers);
                    }
                }
            }
            catch (e_2_1) { e_2 = { error: e_2_1 }; }
            finally {
                try {
                    if (_f && !_f.done && (_b = _e.return)) _b.call(_e);
                }
                finally { if (e_2) throw e_2.error; }
            }
        }
    };
    R3TestBedCompiler.prototype.patchComponentsWithExistingStyles = function () {
        this.existingComponentStyles.forEach(function (styles, type) { return type[NG_COMP_DEF].styles = styles; });
        this.existingComponentStyles.clear();
    };
    R3TestBedCompiler.prototype.queueTypeArray = function (arr, moduleType) {
        var e_3, _a;
        try {
            for (var arr_1 = __values(arr), arr_1_1 = arr_1.next(); !arr_1_1.done; arr_1_1 = arr_1.next()) {
                var value = arr_1_1.value;
                if (Array.isArray(value)) {
                    this.queueTypeArray(value, moduleType);
                }
                else {
                    this.queueType(value, moduleType);
                }
            }
        }
        catch (e_3_1) { e_3 = { error: e_3_1 }; }
        finally {
            try {
                if (arr_1_1 && !arr_1_1.done && (_a = arr_1.return)) _a.call(arr_1);
            }
            finally { if (e_3) throw e_3.error; }
        }
    };
    R3TestBedCompiler.prototype.recompileNgModule = function (ngModule) {
        var metadata = this.resolvers.module.resolve(ngModule);
        if (metadata === null) {
            throw new Error("Unable to resolve metadata for NgModule: " + ngModule.name);
        }
        // Cache the initial ngModuleDef as it will be overwritten.
        this.maybeStoreNgDef(NG_MOD_DEF, ngModule);
        this.maybeStoreNgDef(NG_INJ_DEF, ngModule);
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
            if (!type.hasOwnProperty(NG_DIR_DEF)) {
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
        var e_4, _a;
        try {
            for (var arr_2 = __values(arr), arr_2_1 = arr_2.next(); !arr_2_1.done; arr_2_1 = arr_2.next()) {
                var value = arr_2_1.value;
                if (Array.isArray(value)) {
                    this.queueTypesFromModulesArray(value);
                }
                else if (hasNgModuleDef(value)) {
                    var def = value.ɵmod;
                    // Look through declarations, imports, and exports, and queue everything found there.
                    this.queueTypeArray(maybeUnwrapFn(def.declarations), value);
                    this.queueTypesFromModulesArray(maybeUnwrapFn(def.imports));
                    this.queueTypesFromModulesArray(maybeUnwrapFn(def.exports));
                }
            }
        }
        catch (e_4_1) { e_4 = { error: e_4_1 }; }
        finally {
            try {
                if (arr_2_1 && !arr_2_1.done && (_a = arr_2.return)) _a.call(arr_2);
            }
            finally { if (e_4) throw e_4.error; }
        }
    };
    R3TestBedCompiler.prototype.maybeStoreNgDef = function (prop, type) {
        if (!this.initialNgDefs.has(type)) {
            var currentDef = Object.getOwnPropertyDescriptor(type, prop);
            this.initialNgDefs.set(type, [prop, currentDef]);
        }
    };
    R3TestBedCompiler.prototype.storeFieldOfDefOnType = function (type, defField, fieldName) {
        var def = type[defField];
        var originalValue = def[fieldName];
        this.defCleanupOps.push({ object: def, fieldName: fieldName, originalValue: originalValue });
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
        forEachRight(this.defCleanupOps, function (op) {
            op.object[op.fieldName] = op.originalValue;
        });
        // Restore initial component/directive/pipe defs
        this.initialNgDefs.forEach(function (value, type) {
            var _a = __read(value, 2), prop = _a[0], descriptor = _a[1];
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
            providers: __spread(this.rootProviderOverrides),
        });
        var ngZone = new NgZone({ enableLongStackTrace: true });
        var providers = __spread([
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
                providers.push.apply(providers, __spread(this.compilerProviders));
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
        var flattenedProviders = flatten(providers);
        var overrides = this.getProviderOverrides(flattenedProviders);
        var overriddenProviders = __spread(flattenedProviders, overrides);
        var final = [];
        var seenMultiProviders = new Set();
        // We iterate through the list of providers in reverse order to make sure multi provider
        // overrides take precedence over the values defined in provider list. We also filter out all
        // multi providers that have overrides, keeping overridden values only.
        forEachRight(overriddenProviders, function (provider) {
            var token = getProviderToken(provider);
            if (isMultiProvider(provider) && _this.providerOverridesByToken.has(token)) {
                // Don't add overridden multi-providers twice because when you override a multi-provider, we
                // treat it as `{multi: false}` to avoid providing the same value multiple times.
                if (!seenMultiProviders.has(token)) {
                    seenMultiProviders.add(token);
                    final.unshift(__assign(__assign({}, provider), { multi: false }));
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
    return value.hasOwnProperty('ɵmod');
}
function maybeUnwrapFn(maybeFn) {
    return maybeFn instanceof Function ? maybeFn() : maybeFn;
}
function flatten(values, mapFn) {
    var out = [];
    values.forEach(function (value) {
        if (Array.isArray(value)) {
            out.push.apply(out, __spread(flatten(value, mapFn)));
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
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
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
        return __awaiter(this, void 0, void 0, function () {
            var ngModuleFactory, componentFactories;
            return __generator(this, function (_a) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicjNfdGVzdF9iZWRfY29tcGlsZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3Rlc3Rpbmcvc3JjL3IzX3Rlc3RfYmVkX2NvbXBpbGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7QUFFSCxPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDakQsT0FBTyxFQUFDLHFCQUFxQixFQUFFLGdCQUFnQixFQUFFLFFBQVEsRUFBa0MsU0FBUyxFQUFFLDRCQUE0QixFQUFrRCxNQUFNLEVBQXFDLGtCQUFrQixJQUFJLGlCQUFpQixFQUFpQyxZQUFZLElBQUksV0FBVyxFQUFFLFdBQVcsSUFBSSxVQUFVLEVBQUUsV0FBVyxJQUFJLFVBQVUsRUFBRSxXQUFXLElBQUksVUFBVSxFQUFFLFlBQVksSUFBSSxXQUFXLEVBQUUsZ0JBQWdCLElBQUksaUJBQWlCLEVBQXdGLHdCQUF3QixJQUFJLGdCQUFnQixFQUFFLG1CQUFtQixJQUFJLFdBQVcsRUFBRSxpQkFBaUIsSUFBSSxnQkFBZ0IsRUFBRSxpQkFBaUIsSUFBSSxnQkFBZ0IsRUFBRSxvQkFBb0IsSUFBSSxtQkFBbUIsRUFBRSxZQUFZLElBQUksV0FBVyxFQUFFLGlCQUFpQixJQUFJLGdCQUFnQixFQUFFLDJCQUEyQixJQUFJLDBCQUEwQixFQUFFLFlBQVksSUFBSSxXQUFXLEVBQUUsb0JBQW9CLElBQUksbUJBQW1CLEVBQW1DLE1BQU0sZUFBZSxDQUFDO0FBQzUvQixPQUFPLEVBQXdCLHlCQUF5QixFQUFFLDZCQUE2QixFQUFDLE1BQU0saURBQWlELENBQUM7QUFFaEosT0FBTyxFQUFDLHdDQUF3QyxFQUFFLCtCQUErQixFQUFFLHlCQUF5QixFQUFFLCtCQUErQixFQUFDLE1BQU0scUNBQXFDLENBQUM7QUFHMUwsT0FBTyxFQUFDLGlCQUFpQixFQUFFLGlCQUFpQixFQUFF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QyxDQUFDO1FBQzlGLE9BQU8sSUFBSSw0QkFBNEIsQ0FBQyxlQUFlLEVBQUUsa0JBQWtCLENBQUMsQ0FBQztJQUMvRSxDQUFDO0lBRUssMkRBQWtDLEdBQXhDLFVBQTRDLFVBQW1COzs7Ozs0QkFFckMscUJBQU0sSUFBSSxDQUFDLGtCQUFrQixDQUFDLFVBQVUsQ0FBQyxFQUFBOzt3QkFBM0QsZUFBZSxHQUFHLFNBQXlDO3dCQUMzRCxrQkFBa0IsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLHNCQUFzQixDQUFDLFVBQTZCLENBQUMsQ0FBQzt3QkFDOUYsc0JBQU8sSUFBSSw0QkFBNEIsQ0FBQyxlQUFlLEVBQUUsa0JBQWtCLENBQUMsRUFBQzs7OztLQUM5RTtJQUVELG1DQUFVLEdBQVYsY0FBb0IsQ0FBQztJQUVyQixzQ0FBYSxHQUFiLFVBQWMsSUFBZSxJQUFTLENBQUM7SUFFdkMsb0NBQVcsR0FBWCxVQUFZLFVBQXFCO1FBQy9CLElBQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsa0JBQWtCLEVBQUUsQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDbkUsT0FBTyxJQUFJLElBQUksSUFBSSxDQUFDLEVBQUUsSUFBSSxTQUFTLENBQUM7SUFDdEMsQ0FBQztJQUNILHFCQUFDO0FBQUQsQ0FBQyxBQWxDRCxJQWtDQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtSZXNvdXJjZUxvYWRlcn0gZnJvbSAnQGFuZ3VsYXIvY29tcGlsZXInO1xuaW1wb3J0IHtBcHBsaWNhdGlvbkluaXRTdGF0dXMsIENPTVBJTEVSX09QVElPTlMsIENvbXBpbGVyLCBDb21wb25lbnQsIERpcmVjdGl2ZSwgSW5qZWN0b3IsIExPQ0FMRV9JRCwgTW9kdWxlV2l0aENvbXBvbmVudEZhY3RvcmllcywgTW9kdWxlV2l0aFByb3ZpZGVycywgTmdNb2R1bGUsIE5nTW9kdWxlRmFjdG9yeSwgTmdab25lLCBQaXBlLCBQbGF0Zm9ybVJlZiwgUHJvdmlkZXIsIFR5cGUsIMm1REVGQVVMVF9MT0NBTEVfSUQgYXMgREVGQVVMVF9MT0NBTEVfSUQsIMm1RGlyZWN0aXZlRGVmIGFzIERpcmVjdGl2ZURlZiwgybVOR19DT01QX0RFRiBhcyBOR19DT01QX0RFRiwgybVOR19ESVJfREVGIGFzIE5HX0RJUl9ERUYsIMm1TkdfSU5KX0RFRiBhcyBOR19JTkpfREVGLCDJtU5HX01PRF9ERUYgYXMgTkdfTU9EX0RFRiwgybVOR19QSVBFX0RFRiBhcyBOR19QSVBFX0RFRiwgybVOZ01vZHVsZUZhY3RvcnkgYXMgUjNOZ01vZHVsZUZhY3RvcnksIMm1TmdNb2R1bGVUcmFuc2l0aXZlU2NvcGVzIGFzIE5nTW9kdWxlVHJhbnNpdGl2ZVNjb3BlcywgybVOZ01vZHVsZVR5cGUgYXMgTmdNb2R1bGVUeXBlLCDJtVJlbmRlcjNDb21wb25lbnRGYWN0b3J5IGFzIENvbXBvbmVudEZhY3RvcnksIMm1UmVuZGVyM05nTW9kdWxlUmVmIGFzIE5nTW9kdWxlUmVmLCDJtWNvbXBpbGVDb21wb25lbnQgYXMgY29tcGlsZUNvbXBvbmVudCwgybVjb21waWxlRGlyZWN0aXZlIGFzIGNvbXBpbGVEaXJlY3RpdmUsIMm1Y29tcGlsZU5nTW9kdWxlRGVmcyBhcyBjb21waWxlTmdNb2R1bGVEZWZzLCDJtWNvbXBpbGVQaXBlIGFzIGNvbXBpbGVQaXBlLCDJtWdldEluamVjdGFibGVEZWYgYXMgZ2V0SW5qZWN0YWJsZURlZiwgybVwYXRjaENvbXBvbmVudERlZldpdGhTY29wZSBhcyBwYXRjaENvbXBvbmVudERlZldpdGhTY29wZSwgybVzZXRMb2NhbGVJZCBhcyBzZXRMb2NhbGVJZCwgybV0cmFuc2l0aXZlU2NvcGVzRm9yIGFzIHRyYW5zaXRpdmVTY29wZXNGb3IsIMm1ybVJbmplY3RhYmxlRGVmIGFzIEluamVjdGFibGVEZWZ9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHtNb2R1bGVSZWdpc3RyYXRpb25NYXAsIGdldFJlZ2lzdGVyZWRNb2R1bGVzU3RhdGUsIHJlc3RvcmVSZWdpc3RlcmVkTW9kdWxlc1N0YXRlfSBmcm9tICcuLi8uLi9zcmMvbGlua2VyL25nX21vZHVsZV9mYWN0b3J5X3JlZ2lzdHJhdGlvbic7XG5cbmltcG9ydCB7Y2xlYXJSZXNvbHV0aW9uT2ZDb21wb25lbnRSZXNvdXJjZXNRdWV1ZSwgaXNDb21wb25lbnREZWZQZW5kaW5nUmVzb2x1dGlvbiwgcmVzb2x2ZUNvbXBvbmVudFJlc291cmNlcywgcmVzdG9yZUNvbXBvbmVudFJlc29sdXRpb25RdWV1ZX0gZnJvbSAnLi4vLi4vc3JjL21ldGFkYXRhL3Jlc291cmNlX2xvYWRpbmcnO1xuXG5pbXBvcnQge01ldGFkYXRhT3ZlcnJpZGV9IGZyb20gJy4vbWV0YWRhdGFfb3ZlcnJpZGUnO1xuaW1wb3J0IHtDb21wb25lbnRSZXNvbHZlciwgRGlyZWN0aXZlUmVzb2x2ZXIsIE5nTW9kdWxlUmVzb2x2ZXIsIFBpcGVSZXNvbHZlciwgUmVzb2x2ZXJ9IGZyb20gJy4vcmVzb2x2ZXJzJztcbmltcG9ydCB7VGVzdE1vZHVsZU1ldGFkYXRhfSBmcm9tICcuL3Rlc3RfYmVkX2NvbW1vbic7XG5cbmVudW0gVGVzdGluZ01vZHVsZU92ZXJyaWRlIHtcbiAgREVDTEFSQVRJT04sXG4gIE9WRVJSSURFX1RFTVBMQVRFLFxufVxuXG5mdW5jdGlvbiBpc1Rlc3RpbmdNb2R1bGVPdmVycmlkZSh2YWx1ZTogdW5rbm93bik6IHZhbHVlIGlzIFRlc3RpbmdNb2R1bGVPdmVycmlkZSB7XG4gIHJldHVybiB2YWx1ZSA9PT0gVGVzdGluZ01vZHVsZU92ZXJyaWRlLkRFQ0xBUkFUSU9OIHx8XG4gICAgICB2YWx1ZSA9PT0gVGVzdGluZ01vZHVsZU92ZXJyaWRlLk9WRVJSSURFX1RFTVBMQVRFO1xufVxuXG4vLyBSZXNvbHZlcnMgZm9yIEFuZ3VsYXIgZGVjb3JhdG9yc1xudHlwZSBSZXNvbHZlcnMgPSB7XG4gIG1vZHVsZTogUmVzb2x2ZXI8TmdNb2R1bGU+LFxuICBjb21wb25lbnQ6IFJlc29sdmVyPERpcmVjdGl2ZT4sXG4gIGRpcmVjdGl2ZTogUmVzb2x2ZXI8Q29tcG9uZW50PixcbiAgcGlwZTogUmVzb2x2ZXI8UGlwZT4sXG59O1xuXG5pbnRlcmZhY2UgQ2xlYW51cE9wZXJhdGlvbiB7XG4gIGZpZWxkTmFtZTogc3RyaW5nO1xuICBvYmplY3Q6IGFueTtcbiAgb3JpZ2luYWxWYWx1ZTogdW5rbm93bjtcbn1cblxuZXhwb3J0IGNsYXNzIFIzVGVzdEJlZENvbXBpbGVyIHtcbiAgcHJpdmF0ZSBvcmlnaW5hbENvbXBvbmVudFJlc29sdXRpb25RdWV1ZTogTWFwPFR5cGU8YW55PiwgQ29tcG9uZW50PnxudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBvcmlnaW5hbFJlZ2lzdGVyZWRNb2R1bGVzOiBudWxsfE1vZHVsZVJlZ2lzdHJhdGlvbk1hcCA9IG51bGw7XG5cbiAgLy8gVGVzdGluZyBtb2R1bGUgY29uZmlndXJhdGlvblxuICBwcml2YXRlIGRlY2xhcmF0aW9uczogVHlwZTxhbnk+W10gPSBbXTtcbiAgcHJpdmF0ZSBpbXBvcnRzOiBUeXBlPGFueT5bXSA9IFtdO1xuICBwcml2YXRlIHByb3ZpZGVyczogUHJvdmlkZXJbXSA9IFtdO1xuICBwcml2YXRlIHNjaGVtYXM6IGFueVtdID0gW107XG5cbiAgLy8gUXVldWVzIG9mIGNvbXBvbmVudHMvZGlyZWN0aXZlcy9waXBlcyB0aGF0IHNob3VsZCBiZSByZWNvbXBpbGVkLlxuICBwcml2YXRlIHBlbmRpbmdDb21wb25lbnRzID0gbmV3IFNldDxUeXBlPGFueT4+KCk7XG4gIHByaXZhdGUgcGVuZGluZ0RpcmVjdGl2ZXMgPSBuZXcgU2V0PFR5cGU8YW55Pj4oKTtcbiAgcHJpdmF0ZSBwZW5kaW5nUGlwZXMgPSBuZXcgU2V0PFR5cGU8YW55Pj4oKTtcblxuICAvLyBLZWVwIHRyYWNrIG9mIGFsbCBjb21wb25lbnRzIGFuZCBkaXJlY3RpdmVzLCBzbyB3ZSBjYW4gcGF0Y2ggUHJvdmlkZXJzIG9udG8gZGVmcyBsYXRlci5cbiAgcHJpdmF0ZSBzZWVuQ29tcG9uZW50cyA9IG5ldyBTZXQ8VHlwZTxhbnk+PigpO1xuICBwcml2YXRlIHNlZW5EaXJlY3RpdmVzID0gbmV3IFNldDxUeXBlPGFueT4+KCk7XG5cbiAgLy8gU3RvcmUgcmVzb2x2ZWQgc3R5bGVzIGZvciBDb21wb25lbnRzIHRoYXQgaGF2ZSB0ZW1wbGF0ZSBvdmVycmlkZXMgcHJlc2VudCBhbmQgYHN0eWxlVXJsc2BcbiAgLy8gZGVmaW5lZCBhdCB0aGUgc2FtZSB0aW1lLlxuICBwcml2YXRlIGV4aXN0aW5nQ29tcG9uZW50U3R5bGVzID0gbmV3IE1hcDxUeXBlPGFueT4sIHN0cmluZ1tdPigpO1xuXG4gIHByaXZhdGUgcmVzb2x2ZXJzOiBSZXNvbHZlcnMgPSBpbml0UmVzb2x2ZXJzKCk7XG5cbiAgcHJpdmF0ZSBjb21wb25lbnRUb01vZHVsZVNjb3BlID0gbmV3IE1hcDxUeXBlPGFueT4sIFR5cGU8YW55PnxUZXN0aW5nTW9kdWxlT3ZlcnJpZGU+KCk7XG5cbiAgLy8gTWFwIHRoYXQga2VlcHMgaW5pdGlhbCB2ZXJzaW9uIG9mIGNvbXBvbmVudC9kaXJlY3RpdmUvcGlwZSBkZWZzIGluIGNhc2VcbiAgLy8gd2UgY29tcGlsZSBhIFR5cGUgYWdhaW4sIHRodXMgb3ZlcnJpZGluZyByZXNwZWN0aXZlIHN0YXRpYyBmaWVsZHMuIFRoaXMgaXNcbiAgLy8gcmVxdWlyZWQgdG8gbWFrZSBzdXJlIHdlIHJlc3RvcmUgZGVmcyB0byB0aGVpciBpbml0aWFsIHN0YXRlcyBiZXR3ZWVuIHRlc3QgcnVuc1xuICAvLyBUT0RPOiB3ZSBzaG91bGQgc3VwcG9ydCB0aGUgY2FzZSB3aXRoIG11bHRpcGxlIGRlZnMgb24gYSB0eXBlXG4gIHByaXZhdGUgaW5pdGlhbE5nRGVmcyA9IG5ldyBNYXA8VHlwZTxhbnk+LCBbc3RyaW5nLCBQcm9wZXJ0eURlc2NyaXB0b3J8dW5kZWZpbmVkXT4oKTtcblxuICAvLyBBcnJheSB0aGF0IGtlZXBzIGNsZWFudXAgb3BlcmF0aW9ucyBmb3IgaW5pdGlhbCB2ZXJzaW9ucyBvZiBjb21wb25lbnQvZGlyZWN0aXZlL3BpcGUvbW9kdWxlXG4gIC8vIGRlZnMgaW4gY2FzZSBUZXN0QmVkIG1ha2VzIGNoYW5nZXMgdG8gdGhlIG9yaWdpbmFscy5cbiAgcHJpdmF0ZSBkZWZDbGVhbnVwT3BzOiBDbGVhbnVwT3BlcmF0aW9uW10gPSBbXTtcblxuICBwcml2YXRlIF9pbmplY3RvcjogSW5qZWN0b3J8bnVsbCA9IG51bGw7XG4gIHByaXZhdGUgY29tcGlsZXJQcm92aWRlcnM6IFByb3ZpZGVyW118bnVsbCA9IG51bGw7XG5cbiAgcHJpdmF0ZSBwcm92aWRlck92ZXJyaWRlczogUHJvdmlkZXJbXSA9IFtdO1xuICBwcml2YXRlIHJvb3RQcm92aWRlck92ZXJyaWRlczogUHJvdmlkZXJbXSA9IFtdO1xuICBwcml2YXRlIHByb3ZpZGVyT3ZlcnJpZGVzQnlUb2tlbiA9IG5ldyBNYXA8YW55LCBQcm92aWRlcj4oKTtcbiAgcHJpdmF0ZSBtb2R1bGVQcm92aWRlcnNPdmVycmlkZGVuID0gbmV3IFNldDxUeXBlPGFueT4+KCk7XG5cbiAgcHJpdmF0ZSB0ZXN0TW9kdWxlVHlwZTogTmdNb2R1bGVUeXBlPGFueT47XG4gIHByaXZhdGUgdGVzdE1vZHVsZVJlZjogTmdNb2R1bGVSZWY8YW55PnxudWxsID0gbnVsbDtcblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIHBsYXRmb3JtOiBQbGF0Zm9ybVJlZiwgcHJpdmF0ZSBhZGRpdGlvbmFsTW9kdWxlVHlwZXM6IFR5cGU8YW55PnxUeXBlPGFueT5bXSkge1xuICAgIGNsYXNzIER5bmFtaWNUZXN0TW9kdWxlIHt9XG4gICAgdGhpcy50ZXN0TW9kdWxlVHlwZSA9IER5bmFtaWNUZXN0TW9kdWxlIGFzIGFueTtcbiAgfVxuXG4gIHNldENvbXBpbGVyUHJvdmlkZXJzKHByb3ZpZGVyczogUHJvdmlkZXJbXXxudWxsKTogdm9pZCB7XG4gICAgdGhpcy5jb21waWxlclByb3ZpZGVycyA9IHByb3ZpZGVycztcbiAgICB0aGlzLl9pbmplY3RvciA9IG51bGw7XG4gIH1cblxuICBjb25maWd1cmVUZXN0aW5nTW9kdWxlKG1vZHVsZURlZjogVGVzdE1vZHVsZU1ldGFkYXRhKTogdm9pZCB7XG4gICAgLy8gRW5xdWV1ZSBhbnkgY29tcGlsYXRpb24gdGFza3MgZm9yIHRoZSBkaXJlY3RseSBkZWNsYXJlZCBjb21wb25lbnQuXG4gICAgaWYgKG1vZHVsZURlZi5kZWNsYXJhdGlvbnMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhpcy5xdWV1ZVR5cGVBcnJheShtb2R1bGVEZWYuZGVjbGFyYXRpb25zLCBUZXN0aW5nTW9kdWxlT3ZlcnJpZGUuREVDTEFSQVRJT04pO1xuICAgICAgdGhpcy5kZWNsYXJhdGlvbnMucHVzaCguLi5tb2R1bGVEZWYuZGVjbGFyYXRpb25zKTtcbiAgICB9XG5cbiAgICAvLyBFbnF1ZXVlIGFueSBjb21waWxhdGlvbiB0YXNrcyBmb3IgaW1wb3J0ZWQgbW9kdWxlcy5cbiAgICBpZiAobW9kdWxlRGVmLmltcG9ydHMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhpcy5xdWV1ZVR5cGVzRnJvbU1vZHVsZXNBcnJheShtb2R1bGVEZWYuaW1wb3J0cyk7XG4gICAgICB0aGlzLmltcG9ydHMucHVzaCguLi5tb2R1bGVEZWYuaW1wb3J0cyk7XG4gICAgfVxuXG4gICAgaWYgKG1vZHVsZURlZi5wcm92aWRlcnMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhpcy5wcm92aWRlcnMucHVzaCguLi5tb2R1bGVEZWYucHJvdmlkZXJzKTtcbiAgICB9XG5cbiAgICBpZiAobW9kdWxlRGVmLnNjaGVtYXMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhpcy5zY2hlbWFzLnB1c2goLi4ubW9kdWxlRGVmLnNjaGVtYXMpO1xuICAgIH1cbiAgfVxuXG4gIG92ZXJyaWRlTW9kdWxlKG5nTW9kdWxlOiBUeXBlPGFueT4sIG92ZXJyaWRlOiBNZXRhZGF0YU92ZXJyaWRlPE5nTW9kdWxlPik6IHZvaWQge1xuICAgIC8vIENvbXBpbGUgdGhlIG1vZHVsZSByaWdodCBhd2F5LlxuICAgIHRoaXMucmVzb2x2ZXJzLm1vZHVsZS5hZGRPdmVycmlkZShuZ01vZHVsZSwgb3ZlcnJpZGUpO1xuICAgIGNvbnN0IG1ldGFkYXRhID0gdGhpcy5yZXNvbHZlcnMubW9kdWxlLnJlc29sdmUobmdNb2R1bGUpO1xuICAgIGlmIChtZXRhZGF0YSA9PT0gbnVsbCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGAke25nTW9kdWxlLm5hbWV9IGlzIG5vdCBhbiBATmdNb2R1bGUgb3IgaXMgbWlzc2luZyBtZXRhZGF0YWApO1xuICAgIH1cblxuICAgIHRoaXMucmVjb21waWxlTmdNb2R1bGUobmdNb2R1bGUpO1xuXG4gICAgLy8gQXQgdGhpcyBwb2ludCwgdGhlIG1vZHVsZSBoYXMgYSB2YWxpZCBtb2R1bGUgZGVmICjJtW1vZCksIGJ1dCB0aGUgb3ZlcnJpZGUgbWF5IGhhdmUgaW50cm9kdWNlZFxuICAgIC8vIG5ldyBkZWNsYXJhdGlvbnMgb3IgaW1wb3J0ZWQgbW9kdWxlcy4gSW5nZXN0IGFueSBwb3NzaWJsZSBuZXcgdHlwZXMgYW5kIGFkZCB0aGVtIHRvIHRoZVxuICAgIC8vIGN1cnJlbnQgcXVldWUuXG4gICAgdGhpcy5xdWV1ZVR5cGVzRnJvbU1vZHVsZXNBcnJheShbbmdNb2R1bGVdKTtcbiAgfVxuXG4gIG92ZXJyaWRlQ29tcG9uZW50KGNvbXBvbmVudDogVHlwZTxhbnk+LCBvdmVycmlkZTogTWV0YWRhdGFPdmVycmlkZTxDb21wb25lbnQ+KTogdm9pZCB7XG4gICAgdGhpcy5yZXNvbHZlcnMuY29tcG9uZW50LmFkZE92ZXJyaWRlKGNvbXBvbmVudCwgb3ZlcnJpZGUpO1xuICAgIHRoaXMucGVuZGluZ0NvbXBvbmVudHMuYWRkKGNvbXBvbmVudCk7XG4gIH1cblxuICBvdmVycmlkZURpcmVjdGl2ZShkaXJlY3RpdmU6IFR5cGU8YW55Piwgb3ZlcnJpZGU6IE1ldGFkYXRhT3ZlcnJpZGU8RGlyZWN0aXZlPik6IHZvaWQge1xuICAgIHRoaXMucmVzb2x2ZXJzLmRpcmVjdGl2ZS5hZGRPdmVycmlkZShkaXJlY3RpdmUsIG92ZXJyaWRlKTtcbiAgICB0aGlzLnBlbmRpbmdEaXJlY3RpdmVzLmFkZChkaXJlY3RpdmUpO1xuICB9XG5cbiAgb3ZlcnJpZGVQaXBlKHBpcGU6IFR5cGU8YW55Piwgb3ZlcnJpZGU6IE1ldGFkYXRhT3ZlcnJpZGU8UGlwZT4pOiB2b2lkIHtcbiAgICB0aGlzLnJlc29sdmVycy5waXBlLmFkZE92ZXJyaWRlKHBpcGUsIG92ZXJyaWRlKTtcbiAgICB0aGlzLnBlbmRpbmdQaXBlcy5hZGQocGlwZSk7XG4gIH1cblxuICBvdmVycmlkZVByb3ZpZGVyKFxuICAgICAgdG9rZW46IGFueSxcbiAgICAgIHByb3ZpZGVyOiB7dXNlRmFjdG9yeT86IEZ1bmN0aW9uLCB1c2VWYWx1ZT86IGFueSwgZGVwcz86IGFueVtdLCBtdWx0aT86IGJvb2xlYW59KTogdm9pZCB7XG4gICAgY29uc3QgcHJvdmlkZXJEZWYgPSBwcm92aWRlci51c2VGYWN0b3J5ID9cbiAgICAgICAge1xuICAgICAgICAgIHByb3ZpZGU6IHRva2VuLFxuICAgICAgICAgIHVzZUZhY3Rvcnk6IHByb3ZpZGVyLnVzZUZhY3RvcnksXG4gICAgICAgICAgZGVwczogcHJvdmlkZXIuZGVwcyB8fCBbXSxcbiAgICAgICAgICBtdWx0aTogcHJvdmlkZXIubXVsdGlcbiAgICAgICAgfSA6XG4gICAgICAgIHtwcm92aWRlOiB0b2tlbiwgdXNlVmFsdWU6IHByb3ZpZGVyLnVzZVZhbHVlLCBtdWx0aTogcHJvdmlkZXIubXVsdGl9O1xuXG4gICAgbGV0IGluamVjdGFibGVEZWY6IEluamVjdGFibGVEZWY8YW55PnxudWxsO1xuICAgIGNvbnN0IGlzUm9vdCA9XG4gICAgICAgICh0eXBlb2YgdG9rZW4gIT09ICdzdHJpbmcnICYmIChpbmplY3RhYmxlRGVmID0gZ2V0SW5qZWN0YWJsZURlZih0b2tlbikpICYmXG4gICAgICAgICBpbmplY3RhYmxlRGVmLnByb3ZpZGVkSW4gPT09ICdyb290Jyk7XG4gICAgY29uc3Qgb3ZlcnJpZGVzQnVja2V0ID0gaXNSb290ID8gdGhpcy5yb290UHJvdmlkZXJPdmVycmlkZXMgOiB0aGlzLnByb3ZpZGVyT3ZlcnJpZGVzO1xuICAgIG92ZXJyaWRlc0J1Y2tldC5wdXNoKHByb3ZpZGVyRGVmKTtcblxuICAgIC8vIEtlZXAgb3ZlcnJpZGVzIGdyb3VwZWQgYnkgdG9rZW4gYXMgd2VsbCBmb3IgZmFzdCBsb29rdXBzIHVzaW5nIHRva2VuXG4gICAgdGhpcy5wcm92aWRlck92ZXJyaWRlc0J5VG9rZW4uc2V0KHRva2VuLCBwcm92aWRlckRlZik7XG4gIH1cblxuICBvdmVycmlkZVRlbXBsYXRlVXNpbmdUZXN0aW5nTW9kdWxlKHR5cGU6IFR5cGU8YW55PiwgdGVtcGxhdGU6IHN0cmluZyk6IHZvaWQge1xuICAgIGNvbnN0IGRlZiA9ICh0eXBlIGFzIGFueSlbTkdfQ09NUF9ERUZdO1xuICAgIGNvbnN0IGhhc1N0eWxlVXJscyA9ICgpOiBib29sZWFuID0+IHtcbiAgICAgIGNvbnN0IG1ldGFkYXRhID0gdGhpcy5yZXNvbHZlcnMuY29tcG9uZW50LnJlc29sdmUodHlwZSkgIWFzIENvbXBvbmVudDtcbiAgICAgIHJldHVybiAhIW1ldGFkYXRhLnN0eWxlVXJscyAmJiBtZXRhZGF0YS5zdHlsZVVybHMubGVuZ3RoID4gMDtcbiAgICB9O1xuICAgIGNvbnN0IG92ZXJyaWRlU3R5bGVVcmxzID0gISFkZWYgJiYgIWlzQ29tcG9uZW50RGVmUGVuZGluZ1Jlc29sdXRpb24odHlwZSkgJiYgaGFzU3R5bGVVcmxzKCk7XG5cbiAgICAvLyBJbiBJdnksIGNvbXBpbGluZyBhIGNvbXBvbmVudCBkb2VzIG5vdCByZXF1aXJlIGtub3dpbmcgdGhlIG1vZHVsZSBwcm92aWRpbmcgdGhlXG4gICAgLy8gY29tcG9uZW50J3Mgc2NvcGUsIHNvIG92ZXJyaWRlVGVtcGxhdGVVc2luZ1Rlc3RpbmdNb2R1bGUgY2FuIGJlIGltcGxlbWVudGVkIHB1cmVseSB2aWFcbiAgICAvLyBvdmVycmlkZUNvbXBvbmVudC4gSW1wb3J0YW50OiBvdmVycmlkaW5nIHRlbXBsYXRlIHJlcXVpcmVzIGZ1bGwgQ29tcG9uZW50IHJlLWNvbXBpbGF0aW9uLFxuICAgIC8vIHdoaWNoIG1heSBmYWlsIGluIGNhc2Ugc3R5bGVVcmxzIGFyZSBhbHNvIHByZXNlbnQgKHRodXMgQ29tcG9uZW50IGlzIGNvbnNpZGVyZWQgYXMgcmVxdWlyZWRcbiAgICAvLyByZXNvbHV0aW9uKS4gSW4gb3JkZXIgdG8gYXZvaWQgdGhpcywgd2UgcHJlZW1wdGl2ZWx5IHNldCBzdHlsZVVybHMgdG8gYW4gZW1wdHkgYXJyYXksXG4gICAgLy8gcHJlc2VydmUgY3VycmVudCBzdHlsZXMgYXZhaWxhYmxlIG9uIENvbXBvbmVudCBkZWYgYW5kIHJlc3RvcmUgc3R5bGVzIGJhY2sgb25jZSBjb21waWxhdGlvblxuICAgIC8vIGlzIGNvbXBsZXRlLlxuICAgIGNvbnN0IG92ZXJyaWRlID0gb3ZlcnJpZGVTdHlsZVVybHMgPyB7dGVtcGxhdGUsIHN0eWxlczogW10sIHN0eWxlVXJsczogW119IDoge3RlbXBsYXRlfTtcbiAgICB0aGlzLm92ZXJyaWRlQ29tcG9uZW50KHR5cGUsIHtzZXQ6IG92ZXJyaWRlfSk7XG5cbiAgICBpZiAob3ZlcnJpZGVTdHlsZVVybHMgJiYgZGVmLnN0eWxlcyAmJiBkZWYuc3R5bGVzLmxlbmd0aCA+IDApIHtcbiAgICAgIHRoaXMuZXhpc3RpbmdDb21wb25lbnRTdHlsZXMuc2V0KHR5cGUsIGRlZi5zdHlsZXMpO1xuICAgIH1cblxuICAgIC8vIFNldCB0aGUgY29tcG9uZW50J3Mgc2NvcGUgdG8gYmUgdGhlIHRlc3RpbmcgbW9kdWxlLlxuICAgIHRoaXMuY29tcG9uZW50VG9Nb2R1bGVTY29wZS5zZXQodHlwZSwgVGVzdGluZ01vZHVsZU92ZXJyaWRlLk9WRVJSSURFX1RFTVBMQVRFKTtcbiAgfVxuXG4gIGFzeW5jIGNvbXBpbGVDb21wb25lbnRzKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRoaXMuY2xlYXJDb21wb25lbnRSZXNvbHV0aW9uUXVldWUoKTtcbiAgICAvLyBSdW4gY29tcGlsZXJzIGZvciBhbGwgcXVldWVkIHR5cGVzLlxuICAgIGxldCBuZWVkc0FzeW5jUmVzb3VyY2VzID0gdGhpcy5jb21waWxlVHlwZXNTeW5jKCk7XG5cbiAgICAvLyBjb21waWxlQ29tcG9uZW50cygpIHNob3VsZCBub3QgYmUgYXN5bmMgdW5sZXNzIGl0IG5lZWRzIHRvIGJlLlxuICAgIGlmIChuZWVkc0FzeW5jUmVzb3VyY2VzKSB7XG4gICAgICBsZXQgcmVzb3VyY2VMb2FkZXI6IFJlc291cmNlTG9hZGVyO1xuICAgICAgbGV0IHJlc29sdmVyID0gKHVybDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+ID0+IHtcbiAgICAgICAgaWYgKCFyZXNvdXJjZUxvYWRlcikge1xuICAgICAgICAgIHJlc291cmNlTG9hZGVyID0gdGhpcy5pbmplY3Rvci5nZXQoUmVzb3VyY2VMb2FkZXIpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUocmVzb3VyY2VMb2FkZXIuZ2V0KHVybCkpO1xuICAgICAgfTtcbiAgICAgIGF3YWl0IHJlc29sdmVDb21wb25lbnRSZXNvdXJjZXMocmVzb2x2ZXIpO1xuICAgIH1cbiAgfVxuXG4gIGZpbmFsaXplKCk6IE5nTW9kdWxlUmVmPGFueT4ge1xuICAgIC8vIE9uZSBsYXN0IGNvbXBpbGVcbiAgICB0aGlzLmNvbXBpbGVUeXBlc1N5bmMoKTtcblxuICAgIC8vIENyZWF0ZSB0aGUgdGVzdGluZyBtb2R1bGUgaXRzZWxmLlxuICAgIHRoaXMuY29tcGlsZVRlc3RNb2R1bGUoKTtcblxuICAgIHRoaXMuYXBwbHlUcmFuc2l0aXZlU2NvcGVzKCk7XG5cbiAgICB0aGlzLmFwcGx5UHJvdmlkZXJPdmVycmlkZXMoKTtcblxuICAgIC8vIFBhdGNoIHByZXZpb3VzbHkgc3RvcmVkIGBzdHlsZXNgIENvbXBvbmVudCB2YWx1ZXMgKHRha2VuIGZyb20gybVjbXApLCBpbiBjYXNlIHRoZXNlXG4gICAgLy8gQ29tcG9uZW50cyBoYXZlIGBzdHlsZVVybHNgIGZpZWxkcyBkZWZpbmVkIGFuZCB0ZW1wbGF0ZSBvdmVycmlkZSB3YXMgcmVxdWVzdGVkLlxuICAgIHRoaXMucGF0Y2hDb21wb25lbnRzV2l0aEV4aXN0aW5nU3R5bGVzKCk7XG5cbiAgICAvLyBDbGVhciB0aGUgY29tcG9uZW50VG9Nb2R1bGVTY29wZSBtYXAsIHNvIHRoYXQgZnV0dXJlIGNvbXBpbGF0aW9ucyBkb24ndCByZXNldCB0aGUgc2NvcGUgb2ZcbiAgICAvLyBldmVyeSBjb21wb25lbnQuXG4gICAgdGhpcy5jb21wb25lbnRUb01vZHVsZVNjb3BlLmNsZWFyKCk7XG5cbiAgICBjb25zdCBwYXJlbnRJbmplY3RvciA9IHRoaXMucGxhdGZvcm0uaW5qZWN0b3I7XG4gICAgdGhpcy50ZXN0TW9kdWxlUmVmID0gbmV3IE5nTW9kdWxlUmVmKHRoaXMudGVzdE1vZHVsZVR5cGUsIHBhcmVudEluamVjdG9yKTtcblxuICAgIC8vIFNldCB0aGUgbG9jYWxlIElELCBpdCBjYW4gYmUgb3ZlcnJpZGRlbiBmb3IgdGhlIHRlc3RzXG4gICAgY29uc3QgbG9jYWxlSWQgPSB0aGlzLnRlc3RNb2R1bGVSZWYuaW5qZWN0b3IuZ2V0KExPQ0FMRV9JRCwgREVGQVVMVF9MT0NBTEVfSUQpO1xuICAgIHNldExvY2FsZUlkKGxvY2FsZUlkKTtcblxuICAgIC8vIEFwcGxpY2F0aW9uSW5pdFN0YXR1cy5ydW5Jbml0aWFsaXplcnMoKSBpcyBtYXJrZWQgQGludGVybmFsIHRvIGNvcmUuXG4gICAgLy8gQ2FzdCBpdCB0byBhbnkgYmVmb3JlIGFjY2Vzc2luZyBpdC5cbiAgICAodGhpcy50ZXN0TW9kdWxlUmVmLmluamVjdG9yLmdldChBcHBsaWNhdGlvbkluaXRTdGF0dXMpIGFzIGFueSkucnVuSW5pdGlhbGl6ZXJzKCk7XG5cbiAgICByZXR1cm4gdGhpcy50ZXN0TW9kdWxlUmVmO1xuICB9XG5cbiAgLyoqXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgX2NvbXBpbGVOZ01vZHVsZVN5bmMobW9kdWxlVHlwZTogVHlwZTxhbnk+KTogdm9pZCB7XG4gICAgdGhpcy5xdWV1ZVR5cGVzRnJvbU1vZHVsZXNBcnJheShbbW9kdWxlVHlwZV0pO1xuICAgIHRoaXMuY29tcGlsZVR5cGVzU3luYygpO1xuICAgIHRoaXMuYXBwbHlQcm92aWRlck92ZXJyaWRlcygpO1xuICAgIHRoaXMuYXBwbHlQcm92aWRlck92ZXJyaWRlc1RvTW9kdWxlKG1vZHVsZVR5cGUpO1xuICAgIHRoaXMuYXBwbHlUcmFuc2l0aXZlU2NvcGVzKCk7XG4gIH1cblxuICAvKipcbiAgICogQGludGVybmFsXG4gICAqL1xuICBhc3luYyBfY29tcGlsZU5nTW9kdWxlQXN5bmMobW9kdWxlVHlwZTogVHlwZTxhbnk+KTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMub3JpZ2luYWxSZWdpc3RlcmVkTW9kdWxlcyA9PT0gbnVsbCkge1xuICAgICAgdGhpcy5vcmlnaW5hbFJlZ2lzdGVyZWRNb2R1bGVzID0gZ2V0UmVnaXN0ZXJlZE1vZHVsZXNTdGF0ZSgpO1xuICAgIH1cbiAgICB0aGlzLnF1ZXVlVHlwZXNGcm9tTW9kdWxlc0FycmF5KFttb2R1bGVUeXBlXSk7XG4gICAgYXdhaXQgdGhpcy5jb21waWxlQ29tcG9uZW50cygpO1xuICAgIHRoaXMuYXBwbHlQcm92aWRlck92ZXJyaWRlcygpO1xuICAgIHRoaXMuYXBwbHlQcm92aWRlck92ZXJyaWRlc1RvTW9kdWxlKG1vZHVsZVR5cGUpO1xuICAgIHRoaXMuYXBwbHlUcmFuc2l0aXZlU2NvcGVzKCk7XG4gIH1cblxuICAvKipcbiAgICogQGludGVybmFsXG4gICAqL1xuICBfZ2V0TW9kdWxlUmVzb2x2ZXIoKTogUmVzb2x2ZXI8TmdNb2R1bGU+IHsgcmV0dXJuIHRoaXMucmVzb2x2ZXJzLm1vZHVsZTsgfVxuXG4gIC8qKlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIF9nZXRDb21wb25lbnRGYWN0b3JpZXMobW9kdWxlVHlwZTogTmdNb2R1bGVUeXBlKTogQ29tcG9uZW50RmFjdG9yeTxhbnk+W10ge1xuICAgIHJldHVybiBtYXliZVVud3JhcEZuKG1vZHVsZVR5cGUuybVtb2QuZGVjbGFyYXRpb25zKS5yZWR1Y2UoKGZhY3RvcmllcywgZGVjbGFyYXRpb24pID0+IHtcbiAgICAgIGNvbnN0IGNvbXBvbmVudERlZiA9IChkZWNsYXJhdGlvbiBhcyBhbnkpLsm1Y21wO1xuICAgICAgY29tcG9uZW50RGVmICYmIGZhY3Rvcmllcy5wdXNoKG5ldyBDb21wb25lbnRGYWN0b3J5KGNvbXBvbmVudERlZiwgdGhpcy50ZXN0TW9kdWxlUmVmICEpKTtcbiAgICAgIHJldHVybiBmYWN0b3JpZXM7XG4gICAgfSwgW10gYXMgQ29tcG9uZW50RmFjdG9yeTxhbnk+W10pO1xuICB9XG5cbiAgcHJpdmF0ZSBjb21waWxlVHlwZXNTeW5jKCk6IGJvb2xlYW4ge1xuICAgIC8vIENvbXBpbGUgYWxsIHF1ZXVlZCBjb21wb25lbnRzLCBkaXJlY3RpdmVzLCBwaXBlcy5cbiAgICBsZXQgbmVlZHNBc3luY1Jlc291cmNlcyA9IGZhbHNlO1xuICAgIHRoaXMucGVuZGluZ0NvbXBvbmVudHMuZm9yRWFjaChkZWNsYXJhdGlvbiA9PiB7XG4gICAgICBuZWVkc0FzeW5jUmVzb3VyY2VzID0gbmVlZHNBc3luY1Jlc291cmNlcyB8fCBpc0NvbXBvbmVudERlZlBlbmRpbmdSZXNvbHV0aW9uKGRlY2xhcmF0aW9uKTtcbiAgICAgIGNvbnN0IG1ldGFkYXRhID0gdGhpcy5yZXNvbHZlcnMuY29tcG9uZW50LnJlc29sdmUoZGVjbGFyYXRpb24pICE7XG4gICAgICB0aGlzLm1heWJlU3RvcmVOZ0RlZihOR19DT01QX0RFRiwgZGVjbGFyYXRpb24pO1xuICAgICAgY29tcGlsZUNvbXBvbmVudChkZWNsYXJhdGlvbiwgbWV0YWRhdGEpO1xuICAgIH0pO1xuICAgIHRoaXMucGVuZGluZ0NvbXBvbmVudHMuY2xlYXIoKTtcblxuICAgIHRoaXMucGVuZGluZ0RpcmVjdGl2ZXMuZm9yRWFjaChkZWNsYXJhdGlvbiA9PiB7XG4gICAgICBjb25zdCBtZXRhZGF0YSA9IHRoaXMucmVzb2x2ZXJzLmRpcmVjdGl2ZS5yZXNvbHZlKGRlY2xhcmF0aW9uKTtcbiAgICAgIHRoaXMubWF5YmVTdG9yZU5nRGVmKE5HX0RJUl9ERUYsIGRlY2xhcmF0aW9uKTtcbiAgICAgIGNvbXBpbGVEaXJlY3RpdmUoZGVjbGFyYXRpb24sIG1ldGFkYXRhKTtcbiAgICB9KTtcbiAgICB0aGlzLnBlbmRpbmdEaXJlY3RpdmVzLmNsZWFyKCk7XG5cbiAgICB0aGlzLnBlbmRpbmdQaXBlcy5mb3JFYWNoKGRlY2xhcmF0aW9uID0+IHtcbiAgICAgIGNvbnN0IG1ldGFkYXRhID0gdGhpcy5yZXNvbHZlcnMucGlwZS5yZXNvbHZlKGRlY2xhcmF0aW9uKSAhO1xuICAgICAgdGhpcy5tYXliZVN0b3JlTmdEZWYoTkdfUElQRV9ERUYsIGRlY2xhcmF0aW9uKTtcbiAgICAgIGNvbXBpbGVQaXBlKGRlY2xhcmF0aW9uLCBtZXRhZGF0YSk7XG4gICAgfSk7XG4gICAgdGhpcy5wZW5kaW5nUGlwZXMuY2xlYXIoKTtcblxuICAgIHJldHVybiBuZWVkc0FzeW5jUmVzb3VyY2VzO1xuICB9XG5cbiAgcHJpdmF0ZSBhcHBseVRyYW5zaXRpdmVTY29wZXMoKTogdm9pZCB7XG4gICAgY29uc3QgbW9kdWxlVG9TY29wZSA9IG5ldyBNYXA8VHlwZTxhbnk+fFRlc3RpbmdNb2R1bGVPdmVycmlkZSwgTmdNb2R1bGVUcmFuc2l0aXZlU2NvcGVzPigpO1xuICAgIGNvbnN0IGdldFNjb3BlT2ZNb2R1bGUgPVxuICAgICAgICAobW9kdWxlVHlwZTogVHlwZTxhbnk+fCBUZXN0aW5nTW9kdWxlT3ZlcnJpZGUpOiBOZ01vZHVsZVRyYW5zaXRpdmVTY29wZXMgPT4ge1xuICAgICAgICAgIGlmICghbW9kdWxlVG9TY29wZS5oYXMobW9kdWxlVHlwZSkpIHtcbiAgICAgICAgICAgIGNvbnN0IHJlYWxUeXBlID0gaXNUZXN0aW5nTW9kdWxlT3ZlcnJpZGUobW9kdWxlVHlwZSkgPyB0aGlzLnRlc3RNb2R1bGVUeXBlIDogbW9kdWxlVHlwZTtcbiAgICAgICAgICAgIG1vZHVsZVRvU2NvcGUuc2V0KG1vZHVsZVR5cGUsIHRyYW5zaXRpdmVTY29wZXNGb3IocmVhbFR5cGUpKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIG1vZHVsZVRvU2NvcGUuZ2V0KG1vZHVsZVR5cGUpICE7XG4gICAgICAgIH07XG5cbiAgICB0aGlzLmNvbXBvbmVudFRvTW9kdWxlU2NvcGUuZm9yRWFjaCgobW9kdWxlVHlwZSwgY29tcG9uZW50VHlwZSkgPT4ge1xuICAgICAgY29uc3QgbW9kdWxlU2NvcGUgPSBnZXRTY29wZU9mTW9kdWxlKG1vZHVsZVR5cGUpO1xuICAgICAgdGhpcy5zdG9yZUZpZWxkT2ZEZWZPblR5cGUoY29tcG9uZW50VHlwZSwgTkdfQ09NUF9ERUYsICdkaXJlY3RpdmVEZWZzJyk7XG4gICAgICB0aGlzLnN0b3JlRmllbGRPZkRlZk9uVHlwZShjb21wb25lbnRUeXBlLCBOR19DT01QX0RFRiwgJ3BpcGVEZWZzJyk7XG4gICAgICBwYXRjaENvbXBvbmVudERlZldpdGhTY29wZSgoY29tcG9uZW50VHlwZSBhcyBhbnkpLsm1Y21wLCBtb2R1bGVTY29wZSk7XG4gICAgfSk7XG5cbiAgICB0aGlzLmNvbXBvbmVudFRvTW9kdWxlU2NvcGUuY2xlYXIoKTtcbiAgfVxuXG4gIHByaXZhdGUgYXBwbHlQcm92aWRlck92ZXJyaWRlcygpOiB2b2lkIHtcbiAgICBjb25zdCBtYXliZUFwcGx5T3ZlcnJpZGVzID0gKGZpZWxkOiBzdHJpbmcpID0+ICh0eXBlOiBUeXBlPGFueT4pID0+IHtcbiAgICAgIGNvbnN0IHJlc29sdmVyID0gZmllbGQgPT09IE5HX0NPTVBfREVGID8gdGhpcy5yZXNvbHZlcnMuY29tcG9uZW50IDogdGhpcy5yZXNvbHZlcnMuZGlyZWN0aXZlO1xuICAgICAgY29uc3QgbWV0YWRhdGEgPSByZXNvbHZlci5yZXNvbHZlKHR5cGUpICE7XG4gICAgICBpZiAodGhpcy5oYXNQcm92aWRlck92ZXJyaWRlcyhtZXRhZGF0YS5wcm92aWRlcnMpKSB7XG4gICAgICAgIHRoaXMucGF0Y2hEZWZXaXRoUHJvdmlkZXJPdmVycmlkZXModHlwZSwgZmllbGQpO1xuICAgICAgfVxuICAgIH07XG4gICAgdGhpcy5zZWVuQ29tcG9uZW50cy5mb3JFYWNoKG1heWJlQXBwbHlPdmVycmlkZXMoTkdfQ09NUF9ERUYpKTtcbiAgICB0aGlzLnNlZW5EaXJlY3RpdmVzLmZvckVhY2gobWF5YmVBcHBseU92ZXJyaWRlcyhOR19ESVJfREVGKSk7XG5cbiAgICB0aGlzLnNlZW5Db21wb25lbnRzLmNsZWFyKCk7XG4gICAgdGhpcy5zZWVuRGlyZWN0aXZlcy5jbGVhcigpO1xuICB9XG5cbiAgcHJpdmF0ZSBhcHBseVByb3ZpZGVyT3ZlcnJpZGVzVG9Nb2R1bGUobW9kdWxlVHlwZTogVHlwZTxhbnk+KTogdm9pZCB7XG4gICAgaWYgKHRoaXMubW9kdWxlUHJvdmlkZXJzT3ZlcnJpZGRlbi5oYXMobW9kdWxlVHlwZSkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy5tb2R1bGVQcm92aWRlcnNPdmVycmlkZGVuLmFkZChtb2R1bGVUeXBlKTtcblxuICAgIGNvbnN0IGluamVjdG9yRGVmOiBhbnkgPSAobW9kdWxlVHlwZSBhcyBhbnkpW05HX0lOSl9ERUZdO1xuICAgIGlmICh0aGlzLnByb3ZpZGVyT3ZlcnJpZGVzQnlUb2tlbi5zaXplID4gMCkge1xuICAgICAgLy8gRXh0cmFjdCB0aGUgbGlzdCBvZiBwcm92aWRlcnMgZnJvbSBNb2R1bGVXaXRoUHJvdmlkZXJzLCBzbyB3ZSBjYW4gZGVmaW5lIHRoZSBmaW5hbCBsaXN0IG9mXG4gICAgICAvLyBwcm92aWRlcnMgdGhhdCBtaWdodCBoYXZlIG92ZXJyaWRlcy5cbiAgICAgIC8vIE5vdGU6IHNlY29uZCBgZmxhdHRlbmAgb3BlcmF0aW9uIGlzIG5lZWRlZCB0byBjb252ZXJ0IGFuIGFycmF5IG9mIHByb3ZpZGVyc1xuICAgICAgLy8gKGUuZy4gYFtbXSwgW11dYCkgaW50byBvbmUgZmxhdCBsaXN0LCBhbHNvIGVsaW1pbmF0aW5nIGVtcHR5IGFycmF5cy5cbiAgICAgIGNvbnN0IHByb3ZpZGVyc0Zyb21Nb2R1bGVzID0gZmxhdHRlbihmbGF0dGVuKFxuICAgICAgICAgIGluamVjdG9yRGVmLmltcG9ydHMsIChpbXBvcnRlZDogTmdNb2R1bGVUeXBlPGFueT58IE1vZHVsZVdpdGhQcm92aWRlcnM8YW55PikgPT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaXNNb2R1bGVXaXRoUHJvdmlkZXJzKGltcG9ydGVkKSA/IGltcG9ydGVkLnByb3ZpZGVycyA6IFtdKSk7XG4gICAgICBjb25zdCBwcm92aWRlcnMgPSBbLi4ucHJvdmlkZXJzRnJvbU1vZHVsZXMsIC4uLmluamVjdG9yRGVmLnByb3ZpZGVyc107XG4gICAgICBpZiAodGhpcy5oYXNQcm92aWRlck92ZXJyaWRlcyhwcm92aWRlcnMpKSB7XG4gICAgICAgIHRoaXMubWF5YmVTdG9yZU5nRGVmKE5HX0lOSl9ERUYsIG1vZHVsZVR5cGUpO1xuXG4gICAgICAgIHRoaXMuc3RvcmVGaWVsZE9mRGVmT25UeXBlKG1vZHVsZVR5cGUsIE5HX0lOSl9ERUYsICdwcm92aWRlcnMnKTtcbiAgICAgICAgaW5qZWN0b3JEZWYucHJvdmlkZXJzID0gdGhpcy5nZXRPdmVycmlkZGVuUHJvdmlkZXJzKHByb3ZpZGVycyk7XG4gICAgICB9XG5cbiAgICAgIC8vIEFwcGx5IHByb3ZpZGVyIG92ZXJyaWRlcyB0byBpbXBvcnRlZCBtb2R1bGVzIHJlY3Vyc2l2ZWx5XG4gICAgICBjb25zdCBtb2R1bGVEZWY6IGFueSA9IChtb2R1bGVUeXBlIGFzIGFueSlbTkdfTU9EX0RFRl07XG4gICAgICBmb3IgKGNvbnN0IGltcG9ydGVkTW9kdWxlIG9mIG1vZHVsZURlZi5pbXBvcnRzKSB7XG4gICAgICAgIHRoaXMuYXBwbHlQcm92aWRlck92ZXJyaWRlc1RvTW9kdWxlKGltcG9ydGVkTW9kdWxlKTtcbiAgICAgIH1cbiAgICAgIC8vIEFsc28gb3ZlcnJpZGUgdGhlIHByb3ZpZGVycyBvbiBhbnkgTW9kdWxlV2l0aFByb3ZpZGVycyBpbXBvcnRzIHNpbmNlIHRob3NlIGRvbid0IGFwcGVhciBpblxuICAgICAgLy8gdGhlIG1vZHVsZURlZi5cbiAgICAgIGZvciAoY29uc3QgaW1wb3J0ZWRNb2R1bGUgb2YgZmxhdHRlbihpbmplY3RvckRlZi5pbXBvcnRzKSkge1xuICAgICAgICBpZiAoaXNNb2R1bGVXaXRoUHJvdmlkZXJzKGltcG9ydGVkTW9kdWxlKSkge1xuICAgICAgICAgIHRoaXMuZGVmQ2xlYW51cE9wcy5wdXNoKHtcbiAgICAgICAgICAgIG9iamVjdDogaW1wb3J0ZWRNb2R1bGUsXG4gICAgICAgICAgICBmaWVsZE5hbWU6ICdwcm92aWRlcnMnLFxuICAgICAgICAgICAgb3JpZ2luYWxWYWx1ZTogaW1wb3J0ZWRNb2R1bGUucHJvdmlkZXJzXG4gICAgICAgICAgfSk7XG4gICAgICAgICAgaW1wb3J0ZWRNb2R1bGUucHJvdmlkZXJzID0gdGhpcy5nZXRPdmVycmlkZGVuUHJvdmlkZXJzKGltcG9ydGVkTW9kdWxlLnByb3ZpZGVycyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBwcml2YXRlIHBhdGNoQ29tcG9uZW50c1dpdGhFeGlzdGluZ1N0eWxlcygpOiB2b2lkIHtcbiAgICB0aGlzLmV4aXN0aW5nQ29tcG9uZW50U3R5bGVzLmZvckVhY2goXG4gICAgICAgIChzdHlsZXMsIHR5cGUpID0+ICh0eXBlIGFzIGFueSlbTkdfQ09NUF9ERUZdLnN0eWxlcyA9IHN0eWxlcyk7XG4gICAgdGhpcy5leGlzdGluZ0NvbXBvbmVudFN0eWxlcy5jbGVhcigpO1xuICB9XG5cbiAgcHJpdmF0ZSBxdWV1ZVR5cGVBcnJheShhcnI6IGFueVtdLCBtb2R1bGVUeXBlOiBUeXBlPGFueT58VGVzdGluZ01vZHVsZU92ZXJyaWRlKTogdm9pZCB7XG4gICAgZm9yIChjb25zdCB2YWx1ZSBvZiBhcnIpIHtcbiAgICAgIGlmIChBcnJheS5pc0FycmF5KHZhbHVlKSkge1xuICAgICAgICB0aGlzLnF1ZXVlVHlwZUFycmF5KHZhbHVlLCBtb2R1bGVUeXBlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMucXVldWVUeXBlKHZhbHVlLCBtb2R1bGVUeXBlKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBwcml2YXRlIHJlY29tcGlsZU5nTW9kdWxlKG5nTW9kdWxlOiBUeXBlPGFueT4pOiB2b2lkIHtcbiAgICBjb25zdCBtZXRhZGF0YSA9IHRoaXMucmVzb2x2ZXJzLm1vZHVsZS5yZXNvbHZlKG5nTW9kdWxlKTtcbiAgICBpZiAobWV0YWRhdGEgPT09IG51bGwpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgVW5hYmxlIHRvIHJlc29sdmUgbWV0YWRhdGEgZm9yIE5nTW9kdWxlOiAke25nTW9kdWxlLm5hbWV9YCk7XG4gICAgfVxuICAgIC8vIENhY2hlIHRoZSBpbml0aWFsIG5nTW9kdWxlRGVmIGFzIGl0IHdpbGwgYmUgb3ZlcndyaXR0ZW4uXG4gICAgdGhpcy5tYXliZVN0b3JlTmdEZWYoTkdfTU9EX0RFRiwgbmdNb2R1bGUpO1xuICAgIHRoaXMubWF5YmVTdG9yZU5nRGVmKE5HX0lOSl9ERUYsIG5nTW9kdWxlKTtcblxuICAgIGNvbXBpbGVOZ01vZHVsZURlZnMobmdNb2R1bGUgYXMgTmdNb2R1bGVUeXBlPGFueT4sIG1ldGFkYXRhKTtcbiAgfVxuXG4gIHByaXZhdGUgcXVldWVUeXBlKHR5cGU6IFR5cGU8YW55PiwgbW9kdWxlVHlwZTogVHlwZTxhbnk+fFRlc3RpbmdNb2R1bGVPdmVycmlkZSk6IHZvaWQge1xuICAgIGNvbnN0IGNvbXBvbmVudCA9IHRoaXMucmVzb2x2ZXJzLmNvbXBvbmVudC5yZXNvbHZlKHR5cGUpO1xuICAgIGlmIChjb21wb25lbnQpIHtcbiAgICAgIC8vIENoZWNrIHdoZXRoZXIgYSBnaXZlIFR5cGUgaGFzIHJlc3BlY3RpdmUgTkcgZGVmICjJtWNtcCkgYW5kIGNvbXBpbGUgaWYgZGVmIGlzXG4gICAgICAvLyBtaXNzaW5nLiBUaGF0IG1pZ2h0IGhhcHBlbiBpbiBjYXNlIGEgY2xhc3Mgd2l0aG91dCBhbnkgQW5ndWxhciBkZWNvcmF0b3JzIGV4dGVuZHMgYW5vdGhlclxuICAgICAgLy8gY2xhc3Mgd2hlcmUgQ29tcG9uZW50L0RpcmVjdGl2ZS9QaXBlIGRlY29yYXRvciBpcyBkZWZpbmVkLlxuICAgICAgaWYgKGlzQ29tcG9uZW50RGVmUGVuZGluZ1Jlc29sdXRpb24odHlwZSkgfHwgIXR5cGUuaGFzT3duUHJvcGVydHkoTkdfQ09NUF9ERUYpKSB7XG4gICAgICAgIHRoaXMucGVuZGluZ0NvbXBvbmVudHMuYWRkKHR5cGUpO1xuICAgICAgfVxuICAgICAgdGhpcy5zZWVuQ29tcG9uZW50cy5hZGQodHlwZSk7XG5cbiAgICAgIC8vIEtlZXAgdHJhY2sgb2YgdGhlIG1vZHVsZSB3aGljaCBkZWNsYXJlcyB0aGlzIGNvbXBvbmVudCwgc28gbGF0ZXIgdGhlIGNvbXBvbmVudCdzIHNjb3BlXG4gICAgICAvLyBjYW4gYmUgc2V0IGNvcnJlY3RseS4gSWYgdGhlIGNvbXBvbmVudCBoYXMgYWxyZWFkeSBiZWVuIHJlY29yZGVkIGhlcmUsIHRoZW4gb25lIG9mIHNldmVyYWxcbiAgICAgIC8vIGNhc2VzIGlzIHRydWU6XG4gICAgICAvLyAqIHRoZSBtb2R1bGUgY29udGFpbmluZyB0aGUgY29tcG9uZW50IHdhcyBpbXBvcnRlZCBtdWx0aXBsZSB0aW1lcyAoY29tbW9uKS5cbiAgICAgIC8vICogdGhlIGNvbXBvbmVudCBpcyBkZWNsYXJlZCBpbiBtdWx0aXBsZSBtb2R1bGVzICh3aGljaCBpcyBhbiBlcnJvcikuXG4gICAgICAvLyAqIHRoZSBjb21wb25lbnQgd2FzIGluICdkZWNsYXJhdGlvbnMnIG9mIHRoZSB0ZXN0aW5nIG1vZHVsZSwgYW5kIGFsc28gaW4gYW4gaW1wb3J0ZWQgbW9kdWxlXG4gICAgICAvLyAgIGluIHdoaWNoIGNhc2UgdGhlIG1vZHVsZSBzY29wZSB3aWxsIGJlIFRlc3RpbmdNb2R1bGVPdmVycmlkZS5ERUNMQVJBVElPTi5cbiAgICAgIC8vICogb3ZlcnJpZGVUZW1wbGF0ZVVzaW5nVGVzdGluZ01vZHVsZSB3YXMgY2FsbGVkIGZvciB0aGUgY29tcG9uZW50IGluIHdoaWNoIGNhc2UgdGhlIG1vZHVsZVxuICAgICAgLy8gICBzY29wZSB3aWxsIGJlIFRlc3RpbmdNb2R1bGVPdmVycmlkZS5PVkVSUklERV9URU1QTEFURS5cbiAgICAgIC8vXG4gICAgICAvLyBJZiB0aGUgY29tcG9uZW50IHdhcyBwcmV2aW91c2x5IGluIHRoZSB0ZXN0aW5nIG1vZHVsZSdzICdkZWNsYXJhdGlvbnMnIChtZWFuaW5nIHRoZVxuICAgICAgLy8gY3VycmVudCB2YWx1ZSBpcyBUZXN0aW5nTW9kdWxlT3ZlcnJpZGUuREVDTEFSQVRJT04pLCB0aGVuIGBtb2R1bGVUeXBlYCBpcyB0aGUgY29tcG9uZW50J3NcbiAgICAgIC8vIHJlYWwgbW9kdWxlLCB3aGljaCB3YXMgaW1wb3J0ZWQuIFRoaXMgcGF0dGVybiBpcyB1bmRlcnN0b29kIHRvIG1lYW4gdGhhdCB0aGUgY29tcG9uZW50XG4gICAgICAvLyBzaG91bGQgdXNlIGl0cyBvcmlnaW5hbCBzY29wZSwgYnV0IHRoYXQgdGhlIHRlc3RpbmcgbW9kdWxlIHNob3VsZCBhbHNvIGNvbnRhaW4gdGhlXG4gICAgICAvLyBjb21wb25lbnQgaW4gaXRzIHNjb3BlLlxuICAgICAgaWYgKCF0aGlzLmNvbXBvbmVudFRvTW9kdWxlU2NvcGUuaGFzKHR5cGUpIHx8XG4gICAgICAgICAgdGhpcy5jb21wb25lbnRUb01vZHVsZVNjb3BlLmdldCh0eXBlKSA9PT0gVGVzdGluZ01vZHVsZU92ZXJyaWRlLkRFQ0xBUkFUSU9OKSB7XG4gICAgICAgIHRoaXMuY29tcG9uZW50VG9Nb2R1bGVTY29wZS5zZXQodHlwZSwgbW9kdWxlVHlwZSk7XG4gICAgICB9XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgZGlyZWN0aXZlID0gdGhpcy5yZXNvbHZlcnMuZGlyZWN0aXZlLnJlc29sdmUodHlwZSk7XG4gICAgaWYgKGRpcmVjdGl2ZSkge1xuICAgICAgaWYgKCF0eXBlLmhhc093blByb3BlcnR5KE5HX0RJUl9ERUYpKSB7XG4gICAgICAgIHRoaXMucGVuZGluZ0RpcmVjdGl2ZXMuYWRkKHR5cGUpO1xuICAgICAgfVxuICAgICAgdGhpcy5zZWVuRGlyZWN0aXZlcy5hZGQodHlwZSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgcGlwZSA9IHRoaXMucmVzb2x2ZXJzLnBpcGUucmVzb2x2ZSh0eXBlKTtcbiAgICBpZiAocGlwZSAmJiAhdHlwZS5oYXNPd25Qcm9wZXJ0eShOR19QSVBFX0RFRikpIHtcbiAgICAgIHRoaXMucGVuZGluZ1BpcGVzLmFkZCh0eXBlKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIHF1ZXVlVHlwZXNGcm9tTW9kdWxlc0FycmF5KGFycjogYW55W10pOiB2b2lkIHtcbiAgICBmb3IgKGNvbnN0IHZhbHVlIG9mIGFycikge1xuICAgICAgaWYgKEFycmF5LmlzQXJyYXkodmFsdWUpKSB7XG4gICAgICAgIHRoaXMucXVldWVUeXBlc0Zyb21Nb2R1bGVzQXJyYXkodmFsdWUpO1xuICAgICAgfSBlbHNlIGlmIChoYXNOZ01vZHVsZURlZih2YWx1ZSkpIHtcbiAgICAgICAgY29uc3QgZGVmID0gdmFsdWUuybVtb2Q7XG4gICAgICAgIC8vIExvb2sgdGhyb3VnaCBkZWNsYXJhdGlvbnMsIGltcG9ydHMsIGFuZCBleHBvcnRzLCBhbmQgcXVldWUgZXZlcnl0aGluZyBmb3VuZCB0aGVyZS5cbiAgICAgICAgdGhpcy5xdWV1ZVR5cGVBcnJheShtYXliZVVud3JhcEZuKGRlZi5kZWNsYXJhdGlvbnMpLCB2YWx1ZSk7XG4gICAgICAgIHRoaXMucXVldWVUeXBlc0Zyb21Nb2R1bGVzQXJyYXkobWF5YmVVbndyYXBGbihkZWYuaW1wb3J0cykpO1xuICAgICAgICB0aGlzLnF1ZXVlVHlwZXNGcm9tTW9kdWxlc0FycmF5KG1heWJlVW53cmFwRm4oZGVmLmV4cG9ydHMpKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBwcml2YXRlIG1heWJlU3RvcmVOZ0RlZihwcm9wOiBzdHJpbmcsIHR5cGU6IFR5cGU8YW55Pikge1xuICAgIGlmICghdGhpcy5pbml0aWFsTmdEZWZzLmhhcyh0eXBlKSkge1xuICAgICAgY29uc3QgY3VycmVudERlZiA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IodHlwZSwgcHJvcCk7XG4gICAgICB0aGlzLmluaXRpYWxOZ0RlZnMuc2V0KHR5cGUsIFtwcm9wLCBjdXJyZW50RGVmXSk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBzdG9yZUZpZWxkT2ZEZWZPblR5cGUodHlwZTogVHlwZTxhbnk+LCBkZWZGaWVsZDogc3RyaW5nLCBmaWVsZE5hbWU6IHN0cmluZyk6IHZvaWQge1xuICAgIGNvbnN0IGRlZjogYW55ID0gKHR5cGUgYXMgYW55KVtkZWZGaWVsZF07XG4gICAgY29uc3Qgb3JpZ2luYWxWYWx1ZTogYW55ID0gZGVmW2ZpZWxkTmFtZV07XG4gICAgdGhpcy5kZWZDbGVhbnVwT3BzLnB1c2goe29iamVjdDogZGVmLCBmaWVsZE5hbWUsIG9yaWdpbmFsVmFsdWV9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDbGVhcnMgY3VycmVudCBjb21wb25lbnRzIHJlc29sdXRpb24gcXVldWUsIGJ1dCBzdG9yZXMgdGhlIHN0YXRlIG9mIHRoZSBxdWV1ZSwgc28gd2UgY2FuXG4gICAqIHJlc3RvcmUgaXQgbGF0ZXIuIENsZWFyaW5nIHRoZSBxdWV1ZSBpcyByZXF1aXJlZCBiZWZvcmUgd2UgdHJ5IHRvIGNvbXBpbGUgY29tcG9uZW50cyAodmlhXG4gICAqIGBUZXN0QmVkLmNvbXBpbGVDb21wb25lbnRzYCksIHNvIHRoYXQgY29tcG9uZW50IGRlZnMgYXJlIGluIHN5bmMgd2l0aCB0aGUgcmVzb2x1dGlvbiBxdWV1ZS5cbiAgICovXG4gIHByaXZhdGUgY2xlYXJDb21wb25lbnRSZXNvbHV0aW9uUXVldWUoKSB7XG4gICAgaWYgKHRoaXMub3JpZ2luYWxDb21wb25lbnRSZXNvbHV0aW9uUXVldWUgPT09IG51bGwpIHtcbiAgICAgIHRoaXMub3JpZ2luYWxDb21wb25lbnRSZXNvbHV0aW9uUXVldWUgPSBuZXcgTWFwKCk7XG4gICAgfVxuICAgIGNsZWFyUmVzb2x1dGlvbk9mQ29tcG9uZW50UmVzb3VyY2VzUXVldWUoKS5mb3JFYWNoKFxuICAgICAgICAodmFsdWUsIGtleSkgPT4gdGhpcy5vcmlnaW5hbENvbXBvbmVudFJlc29sdXRpb25RdWV1ZSAhLnNldChrZXksIHZhbHVlKSk7XG4gIH1cblxuICAvKlxuICAgKiBSZXN0b3JlcyBjb21wb25lbnQgcmVzb2x1dGlvbiBxdWV1ZSB0byB0aGUgcHJldmlvdXNseSBzYXZlZCBzdGF0ZS4gVGhpcyBvcGVyYXRpb24gaXMgcGVyZm9ybWVkXG4gICAqIGFzIGEgcGFydCBvZiByZXN0b3JpbmcgdGhlIHN0YXRlIGFmdGVyIGNvbXBsZXRpb24gb2YgdGhlIGN1cnJlbnQgc2V0IG9mIHRlc3RzICh0aGF0IG1pZ2h0XG4gICAqIHBvdGVudGlhbGx5IG11dGF0ZSB0aGUgc3RhdGUpLlxuICAgKi9cbiAgcHJpdmF0ZSByZXN0b3JlQ29tcG9uZW50UmVzb2x1dGlvblF1ZXVlKCkge1xuICAgIGlmICh0aGlzLm9yaWdpbmFsQ29tcG9uZW50UmVzb2x1dGlvblF1ZXVlICE9PSBudWxsKSB7XG4gICAgICByZXN0b3JlQ29tcG9uZW50UmVzb2x1dGlvblF1ZXVlKHRoaXMub3JpZ2luYWxDb21wb25lbnRSZXNvbHV0aW9uUXVldWUpO1xuICAgICAgdGhpcy5vcmlnaW5hbENvbXBvbmVudFJlc29sdXRpb25RdWV1ZSA9IG51bGw7XG4gICAgfVxuICB9XG5cbiAgcmVzdG9yZU9yaWdpbmFsU3RhdGUoKTogdm9pZCB7XG4gICAgLy8gUHJvY2VzcyBjbGVhbnVwIG9wcyBpbiByZXZlcnNlIG9yZGVyIHNvIHRoZSBmaWVsZCdzIG9yaWdpbmFsIHZhbHVlIGlzIHJlc3RvcmVkIGNvcnJlY3RseSAoaW5cbiAgICAvLyBjYXNlIHRoZXJlIHdlcmUgbXVsdGlwbGUgb3ZlcnJpZGVzIGZvciB0aGUgc2FtZSBmaWVsZCkuXG4gICAgZm9yRWFjaFJpZ2h0KHRoaXMuZGVmQ2xlYW51cE9wcywgKG9wOiBDbGVhbnVwT3BlcmF0aW9uKSA9PiB7XG4gICAgICBvcC5vYmplY3Rbb3AuZmllbGROYW1lXSA9IG9wLm9yaWdpbmFsVmFsdWU7XG4gICAgfSk7XG4gICAgLy8gUmVzdG9yZSBpbml0aWFsIGNvbXBvbmVudC9kaXJlY3RpdmUvcGlwZSBkZWZzXG4gICAgdGhpcy5pbml0aWFsTmdEZWZzLmZvckVhY2goXG4gICAgICAgICh2YWx1ZTogW3N0cmluZywgUHJvcGVydHlEZXNjcmlwdG9yIHwgdW5kZWZpbmVkXSwgdHlwZTogVHlwZTxhbnk+KSA9PiB7XG4gICAgICAgICAgY29uc3QgW3Byb3AsIGRlc2NyaXB0b3JdID0gdmFsdWU7XG4gICAgICAgICAgaWYgKCFkZXNjcmlwdG9yKSB7XG4gICAgICAgICAgICAvLyBEZWxldGUgb3BlcmF0aW9ucyBhcmUgZ2VuZXJhbGx5IHVuZGVzaXJhYmxlIHNpbmNlIHRoZXkgaGF2ZSBwZXJmb3JtYW5jZSBpbXBsaWNhdGlvbnNcbiAgICAgICAgICAgIC8vIG9uIG9iamVjdHMgdGhleSB3ZXJlIGFwcGxpZWQgdG8uIEluIHRoaXMgcGFydGljdWxhciBjYXNlLCBzaXR1YXRpb25zIHdoZXJlIHRoaXMgY29kZVxuICAgICAgICAgICAgLy8gaXMgaW52b2tlZCBzaG91bGQgYmUgcXVpdGUgcmFyZSB0byBjYXVzZSBhbnkgbm90aWNlYWJsZSBpbXBhY3QsIHNpbmNlIGl0J3MgYXBwbGllZFxuICAgICAgICAgICAgLy8gb25seSB0byBzb21lIHRlc3QgY2FzZXMgKGZvciBleGFtcGxlIHdoZW4gY2xhc3Mgd2l0aCBubyBhbm5vdGF0aW9ucyBleHRlbmRzIHNvbWVcbiAgICAgICAgICAgIC8vIEBDb21wb25lbnQpIHdoZW4gd2UgbmVlZCB0byBjbGVhciAnybVjbXAnIGZpZWxkIG9uIGEgZ2l2ZW4gY2xhc3MgdG8gcmVzdG9yZVxuICAgICAgICAgICAgLy8gaXRzIG9yaWdpbmFsIHN0YXRlIChiZWZvcmUgYXBwbHlpbmcgb3ZlcnJpZGVzIGFuZCBydW5uaW5nIHRlc3RzKS5cbiAgICAgICAgICAgIGRlbGV0ZSAodHlwZSBhcyBhbnkpW3Byb3BdO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodHlwZSwgcHJvcCwgZGVzY3JpcHRvcik7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB0aGlzLmluaXRpYWxOZ0RlZnMuY2xlYXIoKTtcbiAgICB0aGlzLm1vZHVsZVByb3ZpZGVyc092ZXJyaWRkZW4uY2xlYXIoKTtcbiAgICB0aGlzLnJlc3RvcmVDb21wb25lbnRSZXNvbHV0aW9uUXVldWUoKTtcbiAgICBpZiAodGhpcy5vcmlnaW5hbFJlZ2lzdGVyZWRNb2R1bGVzKSB7XG4gICAgICByZXN0b3JlUmVnaXN0ZXJlZE1vZHVsZXNTdGF0ZSh0aGlzLm9yaWdpbmFsUmVnaXN0ZXJlZE1vZHVsZXMpO1xuICAgICAgdGhpcy5vcmlnaW5hbFJlZ2lzdGVyZWRNb2R1bGVzID0gbnVsbDtcbiAgICB9XG4gICAgLy8gUmVzdG9yZSB0aGUgbG9jYWxlIElEIHRvIHRoZSBkZWZhdWx0IHZhbHVlLCB0aGlzIHNob3VsZG4ndCBiZSBuZWNlc3NhcnkgYnV0IHdlIG5ldmVyIGtub3dcbiAgICBzZXRMb2NhbGVJZChERUZBVUxUX0xPQ0FMRV9JRCk7XG4gIH1cblxuICBwcml2YXRlIGNvbXBpbGVUZXN0TW9kdWxlKCk6IHZvaWQge1xuICAgIGNsYXNzIFJvb3RTY29wZU1vZHVsZSB7fVxuICAgIGNvbXBpbGVOZ01vZHVsZURlZnMoUm9vdFNjb3BlTW9kdWxlIGFzIE5nTW9kdWxlVHlwZTxhbnk+LCB7XG4gICAgICBwcm92aWRlcnM6IFsuLi50aGlzLnJvb3RQcm92aWRlck92ZXJyaWRlc10sXG4gICAgfSk7XG5cbiAgICBjb25zdCBuZ1pvbmUgPSBuZXcgTmdab25lKHtlbmFibGVMb25nU3RhY2tUcmFjZTogdHJ1ZX0pO1xuICAgIGNvbnN0IHByb3ZpZGVyczogUHJvdmlkZXJbXSA9IFtcbiAgICAgIHtwcm92aWRlOiBOZ1pvbmUsIHVzZVZhbHVlOiBuZ1pvbmV9LFxuICAgICAge3Byb3ZpZGU6IENvbXBpbGVyLCB1c2VGYWN0b3J5OiAoKSA9PiBuZXcgUjNUZXN0Q29tcGlsZXIodGhpcyl9LFxuICAgICAgLi4udGhpcy5wcm92aWRlcnMsXG4gICAgICAuLi50aGlzLnByb3ZpZGVyT3ZlcnJpZGVzLFxuICAgIF07XG4gICAgY29uc3QgaW1wb3J0cyA9IFtSb290U2NvcGVNb2R1bGUsIHRoaXMuYWRkaXRpb25hbE1vZHVsZVR5cGVzLCB0aGlzLmltcG9ydHMgfHwgW11dO1xuXG4gICAgLy8gY2xhbmctZm9ybWF0IG9mZlxuICAgIGNvbXBpbGVOZ01vZHVsZURlZnModGhpcy50ZXN0TW9kdWxlVHlwZSwge1xuICAgICAgZGVjbGFyYXRpb25zOiB0aGlzLmRlY2xhcmF0aW9ucyxcbiAgICAgIGltcG9ydHMsXG4gICAgICBzY2hlbWFzOiB0aGlzLnNjaGVtYXMsXG4gICAgICBwcm92aWRlcnMsXG4gICAgfSwgLyogYWxsb3dEdXBsaWNhdGVEZWNsYXJhdGlvbnNJblJvb3QgKi8gdHJ1ZSk7XG4gICAgLy8gY2xhbmctZm9ybWF0IG9uXG5cbiAgICB0aGlzLmFwcGx5UHJvdmlkZXJPdmVycmlkZXNUb01vZHVsZSh0aGlzLnRlc3RNb2R1bGVUeXBlKTtcbiAgfVxuXG4gIGdldCBpbmplY3RvcigpOiBJbmplY3RvciB7XG4gICAgaWYgKHRoaXMuX2luamVjdG9yICE9PSBudWxsKSB7XG4gICAgICByZXR1cm4gdGhpcy5faW5qZWN0b3I7XG4gICAgfVxuXG4gICAgY29uc3QgcHJvdmlkZXJzOiBQcm92aWRlcltdID0gW107XG4gICAgY29uc3QgY29tcGlsZXJPcHRpb25zID0gdGhpcy5wbGF0Zm9ybS5pbmplY3Rvci5nZXQoQ09NUElMRVJfT1BUSU9OUyk7XG4gICAgY29tcGlsZXJPcHRpb25zLmZvckVhY2gob3B0cyA9PiB7XG4gICAgICBpZiAob3B0cy5wcm92aWRlcnMpIHtcbiAgICAgICAgcHJvdmlkZXJzLnB1c2gob3B0cy5wcm92aWRlcnMpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIGlmICh0aGlzLmNvbXBpbGVyUHJvdmlkZXJzICE9PSBudWxsKSB7XG4gICAgICBwcm92aWRlcnMucHVzaCguLi50aGlzLmNvbXBpbGVyUHJvdmlkZXJzKTtcbiAgICB9XG5cbiAgICAvLyBUT0RPKG9jb21iZSk6IG1ha2UgdGhpcyB3b3JrIHdpdGggYW4gSW5qZWN0b3IgZGlyZWN0bHkgaW5zdGVhZCBvZiBjcmVhdGluZyBhIG1vZHVsZSBmb3IgaXRcbiAgICBjbGFzcyBDb21waWxlck1vZHVsZSB7fVxuICAgIGNvbXBpbGVOZ01vZHVsZURlZnMoQ29tcGlsZXJNb2R1bGUgYXMgTmdNb2R1bGVUeXBlPGFueT4sIHtwcm92aWRlcnN9KTtcblxuICAgIGNvbnN0IENvbXBpbGVyTW9kdWxlRmFjdG9yeSA9IG5ldyBSM05nTW9kdWxlRmFjdG9yeShDb21waWxlck1vZHVsZSk7XG4gICAgdGhpcy5faW5qZWN0b3IgPSBDb21waWxlck1vZHVsZUZhY3RvcnkuY3JlYXRlKHRoaXMucGxhdGZvcm0uaW5qZWN0b3IpLmluamVjdG9yO1xuICAgIHJldHVybiB0aGlzLl9pbmplY3RvcjtcbiAgfVxuXG4gIC8vIGdldCBvdmVycmlkZXMgZm9yIGEgc3BlY2lmaWMgcHJvdmlkZXIgKGlmIGFueSlcbiAgcHJpdmF0ZSBnZXRTaW5nbGVQcm92aWRlck92ZXJyaWRlcyhwcm92aWRlcjogUHJvdmlkZXIpOiBQcm92aWRlcnxudWxsIHtcbiAgICBjb25zdCB0b2tlbiA9IGdldFByb3ZpZGVyVG9rZW4ocHJvdmlkZXIpO1xuICAgIHJldHVybiB0aGlzLnByb3ZpZGVyT3ZlcnJpZGVzQnlUb2tlbi5nZXQodG9rZW4pIHx8IG51bGw7XG4gIH1cblxuICBwcml2YXRlIGdldFByb3ZpZGVyT3ZlcnJpZGVzKHByb3ZpZGVycz86IFByb3ZpZGVyW10pOiBQcm92aWRlcltdIHtcbiAgICBpZiAoIXByb3ZpZGVycyB8fCAhcHJvdmlkZXJzLmxlbmd0aCB8fCB0aGlzLnByb3ZpZGVyT3ZlcnJpZGVzQnlUb2tlbi5zaXplID09PSAwKSByZXR1cm4gW107XG4gICAgLy8gVGhlcmUgYXJlIHR3byBmbGF0dGVuaW5nIG9wZXJhdGlvbnMgaGVyZS4gVGhlIGlubmVyIGZsYXR0ZW4oKSBvcGVyYXRlcyBvbiB0aGUgbWV0YWRhdGEnc1xuICAgIC8vIHByb3ZpZGVycyBhbmQgYXBwbGllcyBhIG1hcHBpbmcgZnVuY3Rpb24gd2hpY2ggcmV0cmlldmVzIG92ZXJyaWRlcyBmb3IgZWFjaCBpbmNvbWluZ1xuICAgIC8vIHByb3ZpZGVyLiBUaGUgb3V0ZXIgZmxhdHRlbigpIHRoZW4gZmxhdHRlbnMgdGhlIHByb2R1Y2VkIG92ZXJyaWRlcyBhcnJheS4gSWYgdGhpcyBpcyBub3RcbiAgICAvLyBkb25lLCB0aGUgYXJyYXkgY2FuIGNvbnRhaW4gb3RoZXIgZW1wdHkgYXJyYXlzIChlLmcuIGBbW10sIFtdXWApIHdoaWNoIGxlYWsgaW50byB0aGVcbiAgICAvLyBwcm92aWRlcnMgYXJyYXkgYW5kIGNvbnRhbWluYXRlIGFueSBlcnJvciBtZXNzYWdlcyB0aGF0IG1pZ2h0IGJlIGdlbmVyYXRlZC5cbiAgICByZXR1cm4gZmxhdHRlbihmbGF0dGVuKFxuICAgICAgICBwcm92aWRlcnMsIChwcm92aWRlcjogUHJvdmlkZXIpID0+IHRoaXMuZ2V0U2luZ2xlUHJvdmlkZXJPdmVycmlkZXMocHJvdmlkZXIpIHx8IFtdKSk7XG4gIH1cblxuICBwcml2YXRlIGdldE92ZXJyaWRkZW5Qcm92aWRlcnMocHJvdmlkZXJzPzogUHJvdmlkZXJbXSk6IFByb3ZpZGVyW10ge1xuICAgIGlmICghcHJvdmlkZXJzIHx8ICFwcm92aWRlcnMubGVuZ3RoIHx8IHRoaXMucHJvdmlkZXJPdmVycmlkZXNCeVRva2VuLnNpemUgPT09IDApIHJldHVybiBbXTtcblxuICAgIGNvbnN0IGZsYXR0ZW5lZFByb3ZpZGVycyA9IGZsYXR0ZW48UHJvdmlkZXJbXT4ocHJvdmlkZXJzKTtcbiAgICBjb25zdCBvdmVycmlkZXMgPSB0aGlzLmdldFByb3ZpZGVyT3ZlcnJpZGVzKGZsYXR0ZW5lZFByb3ZpZGVycyk7XG4gICAgY29uc3Qgb3ZlcnJpZGRlblByb3ZpZGVycyA9IFsuLi5mbGF0dGVuZWRQcm92aWRlcnMsIC4uLm92ZXJyaWRlc107XG4gICAgY29uc3QgZmluYWw6IFByb3ZpZGVyW10gPSBbXTtcbiAgICBjb25zdCBzZWVuTXVsdGlQcm92aWRlcnMgPSBuZXcgU2V0PFByb3ZpZGVyPigpO1xuXG4gICAgLy8gV2UgaXRlcmF0ZSB0aHJvdWdoIHRoZSBsaXN0IG9mIHByb3ZpZGVycyBpbiByZXZlcnNlIG9yZGVyIHRvIG1ha2Ugc3VyZSBtdWx0aSBwcm92aWRlclxuICAgIC8vIG92ZXJyaWRlcyB0YWtlIHByZWNlZGVuY2Ugb3ZlciB0aGUgdmFsdWVzIGRlZmluZWQgaW4gcHJvdmlkZXIgbGlzdC4gV2UgYWxzbyBmaWx0ZXIgb3V0IGFsbFxuICAgIC8vIG11bHRpIHByb3ZpZGVycyB0aGF0IGhhdmUgb3ZlcnJpZGVzLCBrZWVwaW5nIG92ZXJyaWRkZW4gdmFsdWVzIG9ubHkuXG4gICAgZm9yRWFjaFJpZ2h0KG92ZXJyaWRkZW5Qcm92aWRlcnMsIChwcm92aWRlcjogYW55KSA9PiB7XG4gICAgICBjb25zdCB0b2tlbjogYW55ID0gZ2V0UHJvdmlkZXJUb2tlbihwcm92aWRlcik7XG4gICAgICBpZiAoaXNNdWx0aVByb3ZpZGVyKHByb3ZpZGVyKSAmJiB0aGlzLnByb3ZpZGVyT3ZlcnJpZGVzQnlUb2tlbi5oYXModG9rZW4pKSB7XG4gICAgICAgIC8vIERvbid0IGFkZCBvdmVycmlkZGVuIG11bHRpLXByb3ZpZGVycyB0d2ljZSBiZWNhdXNlIHdoZW4geW91IG92ZXJyaWRlIGEgbXVsdGktcHJvdmlkZXIsIHdlXG4gICAgICAgIC8vIHRyZWF0IGl0IGFzIGB7bXVsdGk6IGZhbHNlfWAgdG8gYXZvaWQgcHJvdmlkaW5nIHRoZSBzYW1lIHZhbHVlIG11bHRpcGxlIHRpbWVzLlxuICAgICAgICBpZiAoIXNlZW5NdWx0aVByb3ZpZGVycy5oYXModG9rZW4pKSB7XG4gICAgICAgICAgc2Vlbk11bHRpUHJvdmlkZXJzLmFkZCh0b2tlbik7XG4gICAgICAgICAgZmluYWwudW5zaGlmdCh7Li4ucHJvdmlkZXIsIG11bHRpOiBmYWxzZX0pO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBmaW5hbC51bnNoaWZ0KHByb3ZpZGVyKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gZmluYWw7XG4gIH1cblxuICBwcml2YXRlIGhhc1Byb3ZpZGVyT3ZlcnJpZGVzKHByb3ZpZGVycz86IFByb3ZpZGVyW10pOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5nZXRQcm92aWRlck92ZXJyaWRlcyhwcm92aWRlcnMpLmxlbmd0aCA+IDA7XG4gIH1cblxuICBwcml2YXRlIHBhdGNoRGVmV2l0aFByb3ZpZGVyT3ZlcnJpZGVzKGRlY2xhcmF0aW9uOiBUeXBlPGFueT4sIGZpZWxkOiBzdHJpbmcpOiB2b2lkIHtcbiAgICBjb25zdCBkZWYgPSAoZGVjbGFyYXRpb24gYXMgYW55KVtmaWVsZF07XG4gICAgaWYgKGRlZiAmJiBkZWYucHJvdmlkZXJzUmVzb2x2ZXIpIHtcbiAgICAgIHRoaXMubWF5YmVTdG9yZU5nRGVmKGZpZWxkLCBkZWNsYXJhdGlvbik7XG5cbiAgICAgIGNvbnN0IHJlc29sdmVyID0gZGVmLnByb3ZpZGVyc1Jlc29sdmVyO1xuICAgICAgY29uc3QgcHJvY2Vzc1Byb3ZpZGVyc0ZuID0gKHByb3ZpZGVyczogUHJvdmlkZXJbXSkgPT4gdGhpcy5nZXRPdmVycmlkZGVuUHJvdmlkZXJzKHByb3ZpZGVycyk7XG4gICAgICB0aGlzLnN0b3JlRmllbGRPZkRlZk9uVHlwZShkZWNsYXJhdGlvbiwgZmllbGQsICdwcm92aWRlcnNSZXNvbHZlcicpO1xuICAgICAgZGVmLnByb3ZpZGVyc1Jlc29sdmVyID0gKG5nRGVmOiBEaXJlY3RpdmVEZWY8YW55PikgPT4gcmVzb2x2ZXIobmdEZWYsIHByb2Nlc3NQcm92aWRlcnNGbik7XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIGluaXRSZXNvbHZlcnMoKTogUmVzb2x2ZXJzIHtcbiAgcmV0dXJuIHtcbiAgICBtb2R1bGU6IG5ldyBOZ01vZHVsZVJlc29sdmVyKCksXG4gICAgY29tcG9uZW50OiBuZXcgQ29tcG9uZW50UmVzb2x2ZXIoKSxcbiAgICBkaXJlY3RpdmU6IG5ldyBEaXJlY3RpdmVSZXNvbHZlcigpLFxuICAgIHBpcGU6IG5ldyBQaXBlUmVzb2x2ZXIoKVxuICB9O1xufVxuXG5mdW5jdGlvbiBoYXNOZ01vZHVsZURlZjxUPih2YWx1ZTogVHlwZTxUPik6IHZhbHVlIGlzIE5nTW9kdWxlVHlwZTxUPiB7XG4gIHJldHVybiB2YWx1ZS5oYXNPd25Qcm9wZXJ0eSgnybVtb2QnKTtcbn1cblxuZnVuY3Rpb24gbWF5YmVVbndyYXBGbjxUPihtYXliZUZuOiAoKCkgPT4gVCkgfCBUKTogVCB7XG4gIHJldHVybiBtYXliZUZuIGluc3RhbmNlb2YgRnVuY3Rpb24gPyBtYXliZUZuKCkgOiBtYXliZUZuO1xufVxuXG5mdW5jdGlvbiBmbGF0dGVuPFQ+KHZhbHVlczogYW55W10sIG1hcEZuPzogKHZhbHVlOiBUKSA9PiBhbnkpOiBUW10ge1xuICBjb25zdCBvdXQ6IFRbXSA9IFtdO1xuICB2YWx1ZXMuZm9yRWFjaCh2YWx1ZSA9PiB7XG4gICAgaWYgKEFycmF5LmlzQXJyYXkodmFsdWUpKSB7XG4gICAgICBvdXQucHVzaCguLi5mbGF0dGVuPFQ+KHZhbHVlLCBtYXBGbikpO1xuICAgIH0gZWxzZSB7XG4gICAgICBvdXQucHVzaChtYXBGbiA/IG1hcEZuKHZhbHVlKSA6IHZhbHVlKTtcbiAgICB9XG4gIH0pO1xuICByZXR1cm4gb3V0O1xufVxuXG5mdW5jdGlvbiBnZXRQcm92aWRlckZpZWxkKHByb3ZpZGVyOiBQcm92aWRlciwgZmllbGQ6IHN0cmluZykge1xuICByZXR1cm4gcHJvdmlkZXIgJiYgdHlwZW9mIHByb3ZpZGVyID09PSAnb2JqZWN0JyAmJiAocHJvdmlkZXIgYXMgYW55KVtmaWVsZF07XG59XG5cbmZ1bmN0aW9uIGdldFByb3ZpZGVyVG9rZW4ocHJvdmlkZXI6IFByb3ZpZGVyKSB7XG4gIHJldHVybiBnZXRQcm92aWRlckZpZWxkKHByb3ZpZGVyLCAncHJvdmlkZScpIHx8IHByb3ZpZGVyO1xufVxuXG5mdW5jdGlvbiBpc011bHRpUHJvdmlkZXIocHJvdmlkZXI6IFByb3ZpZGVyKSB7XG4gIHJldHVybiAhIWdldFByb3ZpZGVyRmllbGQocHJvdmlkZXIsICdtdWx0aScpO1xufVxuXG5mdW5jdGlvbiBpc01vZHVsZVdpdGhQcm92aWRlcnModmFsdWU6IGFueSk6IHZhbHVlIGlzIE1vZHVsZVdpdGhQcm92aWRlcnM8YW55PiB7XG4gIHJldHVybiB2YWx1ZS5oYXNPd25Qcm9wZXJ0eSgnbmdNb2R1bGUnKTtcbn1cblxuZnVuY3Rpb24gZm9yRWFjaFJpZ2h0PFQ+KHZhbHVlczogVFtdLCBmbjogKHZhbHVlOiBULCBpZHg6IG51bWJlcikgPT4gdm9pZCk6IHZvaWQge1xuICBmb3IgKGxldCBpZHggPSB2YWx1ZXMubGVuZ3RoIC0gMTsgaWR4ID49IDA7IGlkeC0tKSB7XG4gICAgZm4odmFsdWVzW2lkeF0sIGlkeCk7XG4gIH1cbn1cblxuY2xhc3MgUjNUZXN0Q29tcGlsZXIgaW1wbGVtZW50cyBDb21waWxlciB7XG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgdGVzdEJlZDogUjNUZXN0QmVkQ29tcGlsZXIpIHt9XG5cbiAgY29tcGlsZU1vZHVsZVN5bmM8VD4obW9kdWxlVHlwZTogVHlwZTxUPik6IE5nTW9kdWxlRmFjdG9yeTxUPiB7XG4gICAgdGhpcy50ZXN0QmVkLl9jb21waWxlTmdNb2R1bGVTeW5jKG1vZHVsZVR5cGUpO1xuICAgIHJldHVybiBuZXcgUjNOZ01vZHVsZUZhY3RvcnkobW9kdWxlVHlwZSk7XG4gIH1cblxuICBhc3luYyBjb21waWxlTW9kdWxlQXN5bmM8VD4obW9kdWxlVHlwZTogVHlwZTxUPik6IFByb21pc2U8TmdNb2R1bGVGYWN0b3J5PFQ+PiB7XG4gICAgYXdhaXQgdGhpcy50ZXN0QmVkLl9jb21waWxlTmdNb2R1bGVBc3luYyhtb2R1bGVUeXBlKTtcbiAgICByZXR1cm4gbmV3IFIzTmdNb2R1bGVGYWN0b3J5KG1vZHVsZVR5cGUpO1xuICB9XG5cbiAgY29tcGlsZU1vZHVsZUFuZEFsbENvbXBvbmVudHNTeW5jPFQ+KG1vZHVsZVR5cGU6IFR5cGU8VD4pOiBNb2R1bGVXaXRoQ29tcG9uZW50RmFjdG9yaWVzPFQ+IHtcbiAgICBjb25zdCBuZ01vZHVsZUZhY3RvcnkgPSB0aGlzLmNvbXBpbGVNb2R1bGVTeW5jKG1vZHVsZVR5cGUpO1xuICAgIGNvbnN0IGNvbXBvbmVudEZhY3RvcmllcyA9IHRoaXMudGVzdEJlZC5fZ2V0Q29tcG9uZW50RmFjdG9yaWVzKG1vZHVsZVR5cGUgYXMgTmdNb2R1bGVUeXBlPFQ+KTtcbiAgICByZXR1cm4gbmV3IE1vZHVsZVdpdGhDb21wb25lbnRGYWN0b3JpZXMobmdNb2R1bGVGYWN0b3J5LCBjb21wb25lbnRGYWN0b3JpZXMpO1xuICB9XG5cbiAgYXN5bmMgY29tcGlsZU1vZHVsZUFuZEFsbENvbXBvbmVudHNBc3luYzxUPihtb2R1bGVUeXBlOiBUeXBlPFQ+KTpcbiAgICAgIFByb21pc2U8TW9kdWxlV2l0aENvbXBvbmVudEZhY3RvcmllczxUPj4ge1xuICAgIGNvbnN0IG5nTW9kdWxlRmFjdG9yeSA9IGF3YWl0IHRoaXMuY29tcGlsZU1vZHVsZUFzeW5jKG1vZHVsZVR5cGUpO1xuICAgIGNvbnN0IGNvbXBvbmVudEZhY3RvcmllcyA9IHRoaXMudGVzdEJlZC5fZ2V0Q29tcG9uZW50RmFjdG9yaWVzKG1vZHVsZVR5cGUgYXMgTmdNb2R1bGVUeXBlPFQ+KTtcbiAgICByZXR1cm4gbmV3IE1vZHVsZVdpdGhDb21wb25lbnRGYWN0b3JpZXMobmdNb2R1bGVGYWN0b3J5LCBjb21wb25lbnRGYWN0b3JpZXMpO1xuICB9XG5cbiAgY2xlYXJDYWNoZSgpOiB2b2lkIHt9XG5cbiAgY2xlYXJDYWNoZUZvcih0eXBlOiBUeXBlPGFueT4pOiB2b2lkIHt9XG5cbiAgZ2V0TW9kdWxlSWQobW9kdWxlVHlwZTogVHlwZTxhbnk+KTogc3RyaW5nfHVuZGVmaW5lZCB7XG4gICAgY29uc3QgbWV0YSA9IHRoaXMudGVzdEJlZC5fZ2V0TW9kdWxlUmVzb2x2ZXIoKS5yZXNvbHZlKG1vZHVsZVR5cGUpO1xuICAgIHJldHVybiBtZXRhICYmIG1ldGEuaWQgfHwgdW5kZWZpbmVkO1xuICB9XG59XG4iXX0=