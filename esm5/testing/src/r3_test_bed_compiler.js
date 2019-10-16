/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as tslib_1 from "tslib";
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
        var e_1, _a;
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
            var providers = tslib_1.__spread(providersFromModules, injectorDef.providers);
            if (this.hasProviderOverrides(providers)) {
                this.maybeStoreNgDef(NG_INJ_DEF, moduleType);
                this.storeFieldOfDefOnType(moduleType, NG_INJ_DEF, 'providers');
                injectorDef.providers = this.getOverriddenProviders(providers);
            }
            // Apply provider overrides to imported modules recursively
            var moduleDef = moduleType[NG_MOD_DEF];
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
        var e_3, _a;
        try {
            for (var arr_2 = tslib_1.__values(arr), arr_2_1 = arr_2.next(); !arr_2_1.done; arr_2_1 = arr_2.next()) {
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
    return value.hasOwnProperty('ɵmod');
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicjNfdGVzdF9iZWRfY29tcGlsZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3Rlc3Rpbmcvc3JjL3IzX3Rlc3RfYmVkX2NvbXBpbGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7QUFFSCxPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDakQsT0FBTyxFQUFDLHFCQUFxQixFQUFFLGdCQUFnQixFQUFFLFFBQVEsRUFBa0MsU0FBUyxFQUFFLDRCQUE0QixFQUFrRCxNQUFNLEVBQXFDLGtCQUFrQixJQUFJLGlCQUFpQixFQUFpQyxZQUFZLElBQUksV0FBVyxFQUFFLFdBQVcsSUFBSSxVQUFVLEVBQUUsV0FBVyxJQUFJLFVBQVUsRUFBRSxXQUFXLElBQUksVUFBVSxFQUFFLFlBQVksSUFBSSxXQUFXLEVBQUUsZ0JBQWdCLElBQUksaUJBQWlCLEVBQXdGLHdCQUF3QixJQUFJLGdCQUFnQixFQUFFLG1CQUFtQixJQUFJLFdBQVcsRUFBRSxpQkFBaUIsSUFBSSxnQkFBZ0IsRUFBRSxpQkFBaUIsSUFBSSxnQkFBZ0IsRUFBRSxvQkFBb0IsSUFBSSxtQkFBbUIsRUFBRSxZQUFZLElBQUksV0FBVyxFQUFFLGlCQUFpQixJQUFJLGdCQUFnQixFQUFFLDJCQUEyQixJQUFJLDBCQUEwQixFQUFFLFlBQVksSUFBSSxXQUFXLEVBQUUsb0JBQW9CLElBQUksbUJBQW1CLEVBQW1DLE1BQU0sZUFBZSxDQUFDO0FBQzUvQixPQUFPLEVBQXdCLHlCQUF5QixFQUFFLDZCQUE2QixFQUFDLE1BQU0saURBQWlELENBQUM7QUFFaEosT0FBTyxFQUFDLHdDQUF3QyxFQUFFLCtCQUErQixFQUFFLHlCQUF5QixFQUFFLCtCQUErQixFQUFDLE1BQU0scUNBQXFDLENBQUM7QUFHMUwsT0FBTyxFQUFDLGlCQUFpQixFQUFFLGlCQUFpQixFQUFF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O0lBRUssMkRBQWtDLEdBQXhDLFVBQTRDLFVBQW1COzs7Ozs0QkFFckMscUJBQU0sSUFBSSxDQUFDLGtCQUFrQixDQUFDLFVBQVUsQ0FBQyxFQUFBOzt3QkFBM0QsZUFBZSxHQUFHLFNBQXlDO3dCQUMzRCxrQkFBa0IsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLHNCQUFzQixDQUFDLFVBQTZCLENBQUMsQ0FBQzt3QkFDOUYsc0JBQU8sSUFBSSw0QkFBNEIsQ0FBQyxlQUFlLEVBQUUsa0JBQWtCLENBQUMsRUFBQzs7OztLQUM5RTtJQUVELG1DQUFVLEdBQVYsY0FBb0IsQ0FBQztJQUVyQixzQ0FBYSxHQUFiLFVBQWMsSUFBZSxJQUFTLENBQUM7SUFFdkMsb0NBQVcsR0FBWCxVQUFZLFVBQXFCO1FBQy9CLElBQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsa0JBQWtCLEVBQUUsQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDbkUsT0FBTyxJQUFJLElBQUksSUFBSSxDQUFDLEVBQUUsSUFBSSxTQUFTLENBQUM7SUFDdEMsQ0FBQztJQUNILHFCQUFDO0FBQUQsQ0FBQyxBQWxDRCxJQWtDQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtSZXNvdXJjZUxvYWRlcn0gZnJvbSAnQGFuZ3VsYXIvY29tcGlsZXInO1xuaW1wb3J0IHtBcHBsaWNhdGlvbkluaXRTdGF0dXMsIENPTVBJTEVSX09QVElPTlMsIENvbXBpbGVyLCBDb21wb25lbnQsIERpcmVjdGl2ZSwgSW5qZWN0b3IsIExPQ0FMRV9JRCwgTW9kdWxlV2l0aENvbXBvbmVudEZhY3RvcmllcywgTW9kdWxlV2l0aFByb3ZpZGVycywgTmdNb2R1bGUsIE5nTW9kdWxlRmFjdG9yeSwgTmdab25lLCBQaXBlLCBQbGF0Zm9ybVJlZiwgUHJvdmlkZXIsIFR5cGUsIMm1REVGQVVMVF9MT0NBTEVfSUQgYXMgREVGQVVMVF9MT0NBTEVfSUQsIMm1RGlyZWN0aXZlRGVmIGFzIERpcmVjdGl2ZURlZiwgybVOR19DT01QX0RFRiBhcyBOR19DT01QX0RFRiwgybVOR19ESVJfREVGIGFzIE5HX0RJUl9ERUYsIMm1TkdfSU5KX0RFRiBhcyBOR19JTkpfREVGLCDJtU5HX01PRF9ERUYgYXMgTkdfTU9EX0RFRiwgybVOR19QSVBFX0RFRiBhcyBOR19QSVBFX0RFRiwgybVOZ01vZHVsZUZhY3RvcnkgYXMgUjNOZ01vZHVsZUZhY3RvcnksIMm1TmdNb2R1bGVUcmFuc2l0aXZlU2NvcGVzIGFzIE5nTW9kdWxlVHJhbnNpdGl2ZVNjb3BlcywgybVOZ01vZHVsZVR5cGUgYXMgTmdNb2R1bGVUeXBlLCDJtVJlbmRlcjNDb21wb25lbnRGYWN0b3J5IGFzIENvbXBvbmVudEZhY3RvcnksIMm1UmVuZGVyM05nTW9kdWxlUmVmIGFzIE5nTW9kdWxlUmVmLCDJtWNvbXBpbGVDb21wb25lbnQgYXMgY29tcGlsZUNvbXBvbmVudCwgybVjb21waWxlRGlyZWN0aXZlIGFzIGNvbXBpbGVEaXJlY3RpdmUsIMm1Y29tcGlsZU5nTW9kdWxlRGVmcyBhcyBjb21waWxlTmdNb2R1bGVEZWZzLCDJtWNvbXBpbGVQaXBlIGFzIGNvbXBpbGVQaXBlLCDJtWdldEluamVjdGFibGVEZWYgYXMgZ2V0SW5qZWN0YWJsZURlZiwgybVwYXRjaENvbXBvbmVudERlZldpdGhTY29wZSBhcyBwYXRjaENvbXBvbmVudERlZldpdGhTY29wZSwgybVzZXRMb2NhbGVJZCBhcyBzZXRMb2NhbGVJZCwgybV0cmFuc2l0aXZlU2NvcGVzRm9yIGFzIHRyYW5zaXRpdmVTY29wZXNGb3IsIMm1ybVJbmplY3RhYmxlRGVmIGFzIEluamVjdGFibGVEZWZ9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHtNb2R1bGVSZWdpc3RyYXRpb25NYXAsIGdldFJlZ2lzdGVyZWRNb2R1bGVzU3RhdGUsIHJlc3RvcmVSZWdpc3RlcmVkTW9kdWxlc1N0YXRlfSBmcm9tICcuLi8uLi9zcmMvbGlua2VyL25nX21vZHVsZV9mYWN0b3J5X3JlZ2lzdHJhdGlvbic7XG5cbmltcG9ydCB7Y2xlYXJSZXNvbHV0aW9uT2ZDb21wb25lbnRSZXNvdXJjZXNRdWV1ZSwgaXNDb21wb25lbnREZWZQZW5kaW5nUmVzb2x1dGlvbiwgcmVzb2x2ZUNvbXBvbmVudFJlc291cmNlcywgcmVzdG9yZUNvbXBvbmVudFJlc29sdXRpb25RdWV1ZX0gZnJvbSAnLi4vLi4vc3JjL21ldGFkYXRhL3Jlc291cmNlX2xvYWRpbmcnO1xuXG5pbXBvcnQge01ldGFkYXRhT3ZlcnJpZGV9IGZyb20gJy4vbWV0YWRhdGFfb3ZlcnJpZGUnO1xuaW1wb3J0IHtDb21wb25lbnRSZXNvbHZlciwgRGlyZWN0aXZlUmVzb2x2ZXIsIE5nTW9kdWxlUmVzb2x2ZXIsIFBpcGVSZXNvbHZlciwgUmVzb2x2ZXJ9IGZyb20gJy4vcmVzb2x2ZXJzJztcbmltcG9ydCB7VGVzdE1vZHVsZU1ldGFkYXRhfSBmcm9tICcuL3Rlc3RfYmVkX2NvbW1vbic7XG5cbmVudW0gVGVzdGluZ01vZHVsZU92ZXJyaWRlIHtcbiAgREVDTEFSQVRJT04sXG4gIE9WRVJSSURFX1RFTVBMQVRFLFxufVxuXG5mdW5jdGlvbiBpc1Rlc3RpbmdNb2R1bGVPdmVycmlkZSh2YWx1ZTogdW5rbm93bik6IHZhbHVlIGlzIFRlc3RpbmdNb2R1bGVPdmVycmlkZSB7XG4gIHJldHVybiB2YWx1ZSA9PT0gVGVzdGluZ01vZHVsZU92ZXJyaWRlLkRFQ0xBUkFUSU9OIHx8XG4gICAgICB2YWx1ZSA9PT0gVGVzdGluZ01vZHVsZU92ZXJyaWRlLk9WRVJSSURFX1RFTVBMQVRFO1xufVxuXG4vLyBSZXNvbHZlcnMgZm9yIEFuZ3VsYXIgZGVjb3JhdG9yc1xudHlwZSBSZXNvbHZlcnMgPSB7XG4gIG1vZHVsZTogUmVzb2x2ZXI8TmdNb2R1bGU+LFxuICBjb21wb25lbnQ6IFJlc29sdmVyPERpcmVjdGl2ZT4sXG4gIGRpcmVjdGl2ZTogUmVzb2x2ZXI8Q29tcG9uZW50PixcbiAgcGlwZTogUmVzb2x2ZXI8UGlwZT4sXG59O1xuXG5pbnRlcmZhY2UgQ2xlYW51cE9wZXJhdGlvbiB7XG4gIGZpZWxkOiBzdHJpbmc7XG4gIGRlZjogYW55O1xuICBvcmlnaW5hbDogdW5rbm93bjtcbn1cblxuZXhwb3J0IGNsYXNzIFIzVGVzdEJlZENvbXBpbGVyIHtcbiAgcHJpdmF0ZSBvcmlnaW5hbENvbXBvbmVudFJlc29sdXRpb25RdWV1ZTogTWFwPFR5cGU8YW55PiwgQ29tcG9uZW50PnxudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBvcmlnaW5hbFJlZ2lzdGVyZWRNb2R1bGVzOiBudWxsfE1vZHVsZVJlZ2lzdHJhdGlvbk1hcCA9IG51bGw7XG5cbiAgLy8gVGVzdGluZyBtb2R1bGUgY29uZmlndXJhdGlvblxuICBwcml2YXRlIGRlY2xhcmF0aW9uczogVHlwZTxhbnk+W10gPSBbXTtcbiAgcHJpdmF0ZSBpbXBvcnRzOiBUeXBlPGFueT5bXSA9IFtdO1xuICBwcml2YXRlIHByb3ZpZGVyczogUHJvdmlkZXJbXSA9IFtdO1xuICBwcml2YXRlIHNjaGVtYXM6IGFueVtdID0gW107XG5cbiAgLy8gUXVldWVzIG9mIGNvbXBvbmVudHMvZGlyZWN0aXZlcy9waXBlcyB0aGF0IHNob3VsZCBiZSByZWNvbXBpbGVkLlxuICBwcml2YXRlIHBlbmRpbmdDb21wb25lbnRzID0gbmV3IFNldDxUeXBlPGFueT4+KCk7XG4gIHByaXZhdGUgcGVuZGluZ0RpcmVjdGl2ZXMgPSBuZXcgU2V0PFR5cGU8YW55Pj4oKTtcbiAgcHJpdmF0ZSBwZW5kaW5nUGlwZXMgPSBuZXcgU2V0PFR5cGU8YW55Pj4oKTtcblxuICAvLyBLZWVwIHRyYWNrIG9mIGFsbCBjb21wb25lbnRzIGFuZCBkaXJlY3RpdmVzLCBzbyB3ZSBjYW4gcGF0Y2ggUHJvdmlkZXJzIG9udG8gZGVmcyBsYXRlci5cbiAgcHJpdmF0ZSBzZWVuQ29tcG9uZW50cyA9IG5ldyBTZXQ8VHlwZTxhbnk+PigpO1xuICBwcml2YXRlIHNlZW5EaXJlY3RpdmVzID0gbmV3IFNldDxUeXBlPGFueT4+KCk7XG5cbiAgLy8gU3RvcmUgcmVzb2x2ZWQgc3R5bGVzIGZvciBDb21wb25lbnRzIHRoYXQgaGF2ZSB0ZW1wbGF0ZSBvdmVycmlkZXMgcHJlc2VudCBhbmQgYHN0eWxlVXJsc2BcbiAgLy8gZGVmaW5lZCBhdCB0aGUgc2FtZSB0aW1lLlxuICBwcml2YXRlIGV4aXN0aW5nQ29tcG9uZW50U3R5bGVzID0gbmV3IE1hcDxUeXBlPGFueT4sIHN0cmluZ1tdPigpO1xuXG4gIHByaXZhdGUgcmVzb2x2ZXJzOiBSZXNvbHZlcnMgPSBpbml0UmVzb2x2ZXJzKCk7XG5cbiAgcHJpdmF0ZSBjb21wb25lbnRUb01vZHVsZVNjb3BlID0gbmV3IE1hcDxUeXBlPGFueT4sIFR5cGU8YW55PnxUZXN0aW5nTW9kdWxlT3ZlcnJpZGU+KCk7XG5cbiAgLy8gTWFwIHRoYXQga2VlcHMgaW5pdGlhbCB2ZXJzaW9uIG9mIGNvbXBvbmVudC9kaXJlY3RpdmUvcGlwZSBkZWZzIGluIGNhc2VcbiAgLy8gd2UgY29tcGlsZSBhIFR5cGUgYWdhaW4sIHRodXMgb3ZlcnJpZGluZyByZXNwZWN0aXZlIHN0YXRpYyBmaWVsZHMuIFRoaXMgaXNcbiAgLy8gcmVxdWlyZWQgdG8gbWFrZSBzdXJlIHdlIHJlc3RvcmUgZGVmcyB0byB0aGVpciBpbml0aWFsIHN0YXRlcyBiZXR3ZWVuIHRlc3QgcnVuc1xuICAvLyBUT0RPOiB3ZSBzaG91bGQgc3VwcG9ydCB0aGUgY2FzZSB3aXRoIG11bHRpcGxlIGRlZnMgb24gYSB0eXBlXG4gIHByaXZhdGUgaW5pdGlhbE5nRGVmcyA9IG5ldyBNYXA8VHlwZTxhbnk+LCBbc3RyaW5nLCBQcm9wZXJ0eURlc2NyaXB0b3J8dW5kZWZpbmVkXT4oKTtcblxuICAvLyBBcnJheSB0aGF0IGtlZXBzIGNsZWFudXAgb3BlcmF0aW9ucyBmb3IgaW5pdGlhbCB2ZXJzaW9ucyBvZiBjb21wb25lbnQvZGlyZWN0aXZlL3BpcGUvbW9kdWxlXG4gIC8vIGRlZnMgaW4gY2FzZSBUZXN0QmVkIG1ha2VzIGNoYW5nZXMgdG8gdGhlIG9yaWdpbmFscy5cbiAgcHJpdmF0ZSBkZWZDbGVhbnVwT3BzOiBDbGVhbnVwT3BlcmF0aW9uW10gPSBbXTtcblxuICBwcml2YXRlIF9pbmplY3RvcjogSW5qZWN0b3J8bnVsbCA9IG51bGw7XG4gIHByaXZhdGUgY29tcGlsZXJQcm92aWRlcnM6IFByb3ZpZGVyW118bnVsbCA9IG51bGw7XG5cbiAgcHJpdmF0ZSBwcm92aWRlck92ZXJyaWRlczogUHJvdmlkZXJbXSA9IFtdO1xuICBwcml2YXRlIHJvb3RQcm92aWRlck92ZXJyaWRlczogUHJvdmlkZXJbXSA9IFtdO1xuICBwcml2YXRlIHByb3ZpZGVyT3ZlcnJpZGVzQnlUb2tlbiA9IG5ldyBNYXA8YW55LCBQcm92aWRlcj4oKTtcbiAgcHJpdmF0ZSBtb2R1bGVQcm92aWRlcnNPdmVycmlkZGVuID0gbmV3IFNldDxUeXBlPGFueT4+KCk7XG5cbiAgcHJpdmF0ZSB0ZXN0TW9kdWxlVHlwZTogTmdNb2R1bGVUeXBlPGFueT47XG4gIHByaXZhdGUgdGVzdE1vZHVsZVJlZjogTmdNb2R1bGVSZWY8YW55PnxudWxsID0gbnVsbDtcblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIHBsYXRmb3JtOiBQbGF0Zm9ybVJlZiwgcHJpdmF0ZSBhZGRpdGlvbmFsTW9kdWxlVHlwZXM6IFR5cGU8YW55PnxUeXBlPGFueT5bXSkge1xuICAgIGNsYXNzIER5bmFtaWNUZXN0TW9kdWxlIHt9XG4gICAgdGhpcy50ZXN0TW9kdWxlVHlwZSA9IER5bmFtaWNUZXN0TW9kdWxlIGFzIGFueTtcbiAgfVxuXG4gIHNldENvbXBpbGVyUHJvdmlkZXJzKHByb3ZpZGVyczogUHJvdmlkZXJbXXxudWxsKTogdm9pZCB7XG4gICAgdGhpcy5jb21waWxlclByb3ZpZGVycyA9IHByb3ZpZGVycztcbiAgICB0aGlzLl9pbmplY3RvciA9IG51bGw7XG4gIH1cblxuICBjb25maWd1cmVUZXN0aW5nTW9kdWxlKG1vZHVsZURlZjogVGVzdE1vZHVsZU1ldGFkYXRhKTogdm9pZCB7XG4gICAgLy8gRW5xdWV1ZSBhbnkgY29tcGlsYXRpb24gdGFza3MgZm9yIHRoZSBkaXJlY3RseSBkZWNsYXJlZCBjb21wb25lbnQuXG4gICAgaWYgKG1vZHVsZURlZi5kZWNsYXJhdGlvbnMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhpcy5xdWV1ZVR5cGVBcnJheShtb2R1bGVEZWYuZGVjbGFyYXRpb25zLCBUZXN0aW5nTW9kdWxlT3ZlcnJpZGUuREVDTEFSQVRJT04pO1xuICAgICAgdGhpcy5kZWNsYXJhdGlvbnMucHVzaCguLi5tb2R1bGVEZWYuZGVjbGFyYXRpb25zKTtcbiAgICB9XG5cbiAgICAvLyBFbnF1ZXVlIGFueSBjb21waWxhdGlvbiB0YXNrcyBmb3IgaW1wb3J0ZWQgbW9kdWxlcy5cbiAgICBpZiAobW9kdWxlRGVmLmltcG9ydHMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhpcy5xdWV1ZVR5cGVzRnJvbU1vZHVsZXNBcnJheShtb2R1bGVEZWYuaW1wb3J0cyk7XG4gICAgICB0aGlzLmltcG9ydHMucHVzaCguLi5tb2R1bGVEZWYuaW1wb3J0cyk7XG4gICAgfVxuXG4gICAgaWYgKG1vZHVsZURlZi5wcm92aWRlcnMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhpcy5wcm92aWRlcnMucHVzaCguLi5tb2R1bGVEZWYucHJvdmlkZXJzKTtcbiAgICB9XG5cbiAgICBpZiAobW9kdWxlRGVmLnNjaGVtYXMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhpcy5zY2hlbWFzLnB1c2goLi4ubW9kdWxlRGVmLnNjaGVtYXMpO1xuICAgIH1cbiAgfVxuXG4gIG92ZXJyaWRlTW9kdWxlKG5nTW9kdWxlOiBUeXBlPGFueT4sIG92ZXJyaWRlOiBNZXRhZGF0YU92ZXJyaWRlPE5nTW9kdWxlPik6IHZvaWQge1xuICAgIC8vIENvbXBpbGUgdGhlIG1vZHVsZSByaWdodCBhd2F5LlxuICAgIHRoaXMucmVzb2x2ZXJzLm1vZHVsZS5hZGRPdmVycmlkZShuZ01vZHVsZSwgb3ZlcnJpZGUpO1xuICAgIGNvbnN0IG1ldGFkYXRhID0gdGhpcy5yZXNvbHZlcnMubW9kdWxlLnJlc29sdmUobmdNb2R1bGUpO1xuICAgIGlmIChtZXRhZGF0YSA9PT0gbnVsbCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGAke25nTW9kdWxlLm5hbWV9IGlzIG5vdCBhbiBATmdNb2R1bGUgb3IgaXMgbWlzc2luZyBtZXRhZGF0YWApO1xuICAgIH1cblxuICAgIHRoaXMucmVjb21waWxlTmdNb2R1bGUobmdNb2R1bGUpO1xuXG4gICAgLy8gQXQgdGhpcyBwb2ludCwgdGhlIG1vZHVsZSBoYXMgYSB2YWxpZCBtb2R1bGUgZGVmICjJtW1vZCksIGJ1dCB0aGUgb3ZlcnJpZGUgbWF5IGhhdmUgaW50cm9kdWNlZFxuICAgIC8vIG5ldyBkZWNsYXJhdGlvbnMgb3IgaW1wb3J0ZWQgbW9kdWxlcy4gSW5nZXN0IGFueSBwb3NzaWJsZSBuZXcgdHlwZXMgYW5kIGFkZCB0aGVtIHRvIHRoZVxuICAgIC8vIGN1cnJlbnQgcXVldWUuXG4gICAgdGhpcy5xdWV1ZVR5cGVzRnJvbU1vZHVsZXNBcnJheShbbmdNb2R1bGVdKTtcbiAgfVxuXG4gIG92ZXJyaWRlQ29tcG9uZW50KGNvbXBvbmVudDogVHlwZTxhbnk+LCBvdmVycmlkZTogTWV0YWRhdGFPdmVycmlkZTxDb21wb25lbnQ+KTogdm9pZCB7XG4gICAgdGhpcy5yZXNvbHZlcnMuY29tcG9uZW50LmFkZE92ZXJyaWRlKGNvbXBvbmVudCwgb3ZlcnJpZGUpO1xuICAgIHRoaXMucGVuZGluZ0NvbXBvbmVudHMuYWRkKGNvbXBvbmVudCk7XG4gIH1cblxuICBvdmVycmlkZURpcmVjdGl2ZShkaXJlY3RpdmU6IFR5cGU8YW55Piwgb3ZlcnJpZGU6IE1ldGFkYXRhT3ZlcnJpZGU8RGlyZWN0aXZlPik6IHZvaWQge1xuICAgIHRoaXMucmVzb2x2ZXJzLmRpcmVjdGl2ZS5hZGRPdmVycmlkZShkaXJlY3RpdmUsIG92ZXJyaWRlKTtcbiAgICB0aGlzLnBlbmRpbmdEaXJlY3RpdmVzLmFkZChkaXJlY3RpdmUpO1xuICB9XG5cbiAgb3ZlcnJpZGVQaXBlKHBpcGU6IFR5cGU8YW55Piwgb3ZlcnJpZGU6IE1ldGFkYXRhT3ZlcnJpZGU8UGlwZT4pOiB2b2lkIHtcbiAgICB0aGlzLnJlc29sdmVycy5waXBlLmFkZE92ZXJyaWRlKHBpcGUsIG92ZXJyaWRlKTtcbiAgICB0aGlzLnBlbmRpbmdQaXBlcy5hZGQocGlwZSk7XG4gIH1cblxuICBvdmVycmlkZVByb3ZpZGVyKFxuICAgICAgdG9rZW46IGFueSxcbiAgICAgIHByb3ZpZGVyOiB7dXNlRmFjdG9yeT86IEZ1bmN0aW9uLCB1c2VWYWx1ZT86IGFueSwgZGVwcz86IGFueVtdLCBtdWx0aT86IGJvb2xlYW59KTogdm9pZCB7XG4gICAgY29uc3QgcHJvdmlkZXJEZWYgPSBwcm92aWRlci51c2VGYWN0b3J5ID9cbiAgICAgICAge1xuICAgICAgICAgIHByb3ZpZGU6IHRva2VuLFxuICAgICAgICAgIHVzZUZhY3Rvcnk6IHByb3ZpZGVyLnVzZUZhY3RvcnksXG4gICAgICAgICAgZGVwczogcHJvdmlkZXIuZGVwcyB8fCBbXSxcbiAgICAgICAgICBtdWx0aTogcHJvdmlkZXIubXVsdGksXG4gICAgICAgIH0gOlxuICAgICAgICB7cHJvdmlkZTogdG9rZW4sIHVzZVZhbHVlOiBwcm92aWRlci51c2VWYWx1ZSwgbXVsdGk6IHByb3ZpZGVyLm11bHRpfTtcblxuICAgIGxldCBpbmplY3RhYmxlRGVmOiBJbmplY3RhYmxlRGVmPGFueT58bnVsbDtcbiAgICBjb25zdCBpc1Jvb3QgPVxuICAgICAgICAodHlwZW9mIHRva2VuICE9PSAnc3RyaW5nJyAmJiAoaW5qZWN0YWJsZURlZiA9IGdldEluamVjdGFibGVEZWYodG9rZW4pKSAmJlxuICAgICAgICAgaW5qZWN0YWJsZURlZi5wcm92aWRlZEluID09PSAncm9vdCcpO1xuICAgIGNvbnN0IG92ZXJyaWRlc0J1Y2tldCA9IGlzUm9vdCA/IHRoaXMucm9vdFByb3ZpZGVyT3ZlcnJpZGVzIDogdGhpcy5wcm92aWRlck92ZXJyaWRlcztcbiAgICBvdmVycmlkZXNCdWNrZXQucHVzaChwcm92aWRlckRlZik7XG5cbiAgICAvLyBLZWVwIG92ZXJyaWRlcyBncm91cGVkIGJ5IHRva2VuIGFzIHdlbGwgZm9yIGZhc3QgbG9va3VwcyB1c2luZyB0b2tlblxuICAgIHRoaXMucHJvdmlkZXJPdmVycmlkZXNCeVRva2VuLnNldCh0b2tlbiwgcHJvdmlkZXJEZWYpO1xuICB9XG5cbiAgb3ZlcnJpZGVUZW1wbGF0ZVVzaW5nVGVzdGluZ01vZHVsZSh0eXBlOiBUeXBlPGFueT4sIHRlbXBsYXRlOiBzdHJpbmcpOiB2b2lkIHtcbiAgICBjb25zdCBkZWYgPSAodHlwZSBhcyBhbnkpW05HX0NPTVBfREVGXTtcbiAgICBjb25zdCBoYXNTdHlsZVVybHMgPSAoKTogYm9vbGVhbiA9PiB7XG4gICAgICBjb25zdCBtZXRhZGF0YSA9IHRoaXMucmVzb2x2ZXJzLmNvbXBvbmVudC5yZXNvbHZlKHR5cGUpICFhcyBDb21wb25lbnQ7XG4gICAgICByZXR1cm4gISFtZXRhZGF0YS5zdHlsZVVybHMgJiYgbWV0YWRhdGEuc3R5bGVVcmxzLmxlbmd0aCA+IDA7XG4gICAgfTtcbiAgICBjb25zdCBvdmVycmlkZVN0eWxlVXJscyA9ICEhZGVmICYmICFpc0NvbXBvbmVudERlZlBlbmRpbmdSZXNvbHV0aW9uKHR5cGUpICYmIGhhc1N0eWxlVXJscygpO1xuXG4gICAgLy8gSW4gSXZ5LCBjb21waWxpbmcgYSBjb21wb25lbnQgZG9lcyBub3QgcmVxdWlyZSBrbm93aW5nIHRoZSBtb2R1bGUgcHJvdmlkaW5nIHRoZVxuICAgIC8vIGNvbXBvbmVudCdzIHNjb3BlLCBzbyBvdmVycmlkZVRlbXBsYXRlVXNpbmdUZXN0aW5nTW9kdWxlIGNhbiBiZSBpbXBsZW1lbnRlZCBwdXJlbHkgdmlhXG4gICAgLy8gb3ZlcnJpZGVDb21wb25lbnQuIEltcG9ydGFudDogb3ZlcnJpZGluZyB0ZW1wbGF0ZSByZXF1aXJlcyBmdWxsIENvbXBvbmVudCByZS1jb21waWxhdGlvbixcbiAgICAvLyB3aGljaCBtYXkgZmFpbCBpbiBjYXNlIHN0eWxlVXJscyBhcmUgYWxzbyBwcmVzZW50ICh0aHVzIENvbXBvbmVudCBpcyBjb25zaWRlcmVkIGFzIHJlcXVpcmVkXG4gICAgLy8gcmVzb2x1dGlvbikuIEluIG9yZGVyIHRvIGF2b2lkIHRoaXMsIHdlIHByZWVtcHRpdmVseSBzZXQgc3R5bGVVcmxzIHRvIGFuIGVtcHR5IGFycmF5LFxuICAgIC8vIHByZXNlcnZlIGN1cnJlbnQgc3R5bGVzIGF2YWlsYWJsZSBvbiBDb21wb25lbnQgZGVmIGFuZCByZXN0b3JlIHN0eWxlcyBiYWNrIG9uY2UgY29tcGlsYXRpb25cbiAgICAvLyBpcyBjb21wbGV0ZS5cbiAgICBjb25zdCBvdmVycmlkZSA9IG92ZXJyaWRlU3R5bGVVcmxzID8ge3RlbXBsYXRlLCBzdHlsZXM6IFtdLCBzdHlsZVVybHM6IFtdfSA6IHt0ZW1wbGF0ZX07XG4gICAgdGhpcy5vdmVycmlkZUNvbXBvbmVudCh0eXBlLCB7c2V0OiBvdmVycmlkZX0pO1xuXG4gICAgaWYgKG92ZXJyaWRlU3R5bGVVcmxzICYmIGRlZi5zdHlsZXMgJiYgZGVmLnN0eWxlcy5sZW5ndGggPiAwKSB7XG4gICAgICB0aGlzLmV4aXN0aW5nQ29tcG9uZW50U3R5bGVzLnNldCh0eXBlLCBkZWYuc3R5bGVzKTtcbiAgICB9XG5cbiAgICAvLyBTZXQgdGhlIGNvbXBvbmVudCdzIHNjb3BlIHRvIGJlIHRoZSB0ZXN0aW5nIG1vZHVsZS5cbiAgICB0aGlzLmNvbXBvbmVudFRvTW9kdWxlU2NvcGUuc2V0KHR5cGUsIFRlc3RpbmdNb2R1bGVPdmVycmlkZS5PVkVSUklERV9URU1QTEFURSk7XG4gIH1cblxuICBhc3luYyBjb21waWxlQ29tcG9uZW50cygpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0aGlzLmNsZWFyQ29tcG9uZW50UmVzb2x1dGlvblF1ZXVlKCk7XG4gICAgLy8gUnVuIGNvbXBpbGVycyBmb3IgYWxsIHF1ZXVlZCB0eXBlcy5cbiAgICBsZXQgbmVlZHNBc3luY1Jlc291cmNlcyA9IHRoaXMuY29tcGlsZVR5cGVzU3luYygpO1xuXG4gICAgLy8gY29tcGlsZUNvbXBvbmVudHMoKSBzaG91bGQgbm90IGJlIGFzeW5jIHVubGVzcyBpdCBuZWVkcyB0byBiZS5cbiAgICBpZiAobmVlZHNBc3luY1Jlc291cmNlcykge1xuICAgICAgbGV0IHJlc291cmNlTG9hZGVyOiBSZXNvdXJjZUxvYWRlcjtcbiAgICAgIGxldCByZXNvbHZlciA9ICh1cmw6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiA9PiB7XG4gICAgICAgIGlmICghcmVzb3VyY2VMb2FkZXIpIHtcbiAgICAgICAgICByZXNvdXJjZUxvYWRlciA9IHRoaXMuaW5qZWN0b3IuZ2V0KFJlc291cmNlTG9hZGVyKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHJlc291cmNlTG9hZGVyLmdldCh1cmwpKTtcbiAgICAgIH07XG4gICAgICBhd2FpdCByZXNvbHZlQ29tcG9uZW50UmVzb3VyY2VzKHJlc29sdmVyKTtcbiAgICB9XG4gIH1cblxuICBmaW5hbGl6ZSgpOiBOZ01vZHVsZVJlZjxhbnk+IHtcbiAgICAvLyBPbmUgbGFzdCBjb21waWxlXG4gICAgdGhpcy5jb21waWxlVHlwZXNTeW5jKCk7XG5cbiAgICAvLyBDcmVhdGUgdGhlIHRlc3RpbmcgbW9kdWxlIGl0c2VsZi5cbiAgICB0aGlzLmNvbXBpbGVUZXN0TW9kdWxlKCk7XG5cbiAgICB0aGlzLmFwcGx5VHJhbnNpdGl2ZVNjb3BlcygpO1xuXG4gICAgdGhpcy5hcHBseVByb3ZpZGVyT3ZlcnJpZGVzKCk7XG5cbiAgICAvLyBQYXRjaCBwcmV2aW91c2x5IHN0b3JlZCBgc3R5bGVzYCBDb21wb25lbnQgdmFsdWVzICh0YWtlbiBmcm9tIMm1Y21wKSwgaW4gY2FzZSB0aGVzZVxuICAgIC8vIENvbXBvbmVudHMgaGF2ZSBgc3R5bGVVcmxzYCBmaWVsZHMgZGVmaW5lZCBhbmQgdGVtcGxhdGUgb3ZlcnJpZGUgd2FzIHJlcXVlc3RlZC5cbiAgICB0aGlzLnBhdGNoQ29tcG9uZW50c1dpdGhFeGlzdGluZ1N0eWxlcygpO1xuXG4gICAgLy8gQ2xlYXIgdGhlIGNvbXBvbmVudFRvTW9kdWxlU2NvcGUgbWFwLCBzbyB0aGF0IGZ1dHVyZSBjb21waWxhdGlvbnMgZG9uJ3QgcmVzZXQgdGhlIHNjb3BlIG9mXG4gICAgLy8gZXZlcnkgY29tcG9uZW50LlxuICAgIHRoaXMuY29tcG9uZW50VG9Nb2R1bGVTY29wZS5jbGVhcigpO1xuXG4gICAgY29uc3QgcGFyZW50SW5qZWN0b3IgPSB0aGlzLnBsYXRmb3JtLmluamVjdG9yO1xuICAgIHRoaXMudGVzdE1vZHVsZVJlZiA9IG5ldyBOZ01vZHVsZVJlZih0aGlzLnRlc3RNb2R1bGVUeXBlLCBwYXJlbnRJbmplY3Rvcik7XG5cbiAgICAvLyBTZXQgdGhlIGxvY2FsZSBJRCwgaXQgY2FuIGJlIG92ZXJyaWRkZW4gZm9yIHRoZSB0ZXN0c1xuICAgIGNvbnN0IGxvY2FsZUlkID0gdGhpcy50ZXN0TW9kdWxlUmVmLmluamVjdG9yLmdldChMT0NBTEVfSUQsIERFRkFVTFRfTE9DQUxFX0lEKTtcbiAgICBzZXRMb2NhbGVJZChsb2NhbGVJZCk7XG5cbiAgICAvLyBBcHBsaWNhdGlvbkluaXRTdGF0dXMucnVuSW5pdGlhbGl6ZXJzKCkgaXMgbWFya2VkIEBpbnRlcm5hbCB0byBjb3JlLlxuICAgIC8vIENhc3QgaXQgdG8gYW55IGJlZm9yZSBhY2Nlc3NpbmcgaXQuXG4gICAgKHRoaXMudGVzdE1vZHVsZVJlZi5pbmplY3Rvci5nZXQoQXBwbGljYXRpb25Jbml0U3RhdHVzKSBhcyBhbnkpLnJ1bkluaXRpYWxpemVycygpO1xuXG4gICAgcmV0dXJuIHRoaXMudGVzdE1vZHVsZVJlZjtcbiAgfVxuXG4gIC8qKlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIF9jb21waWxlTmdNb2R1bGVTeW5jKG1vZHVsZVR5cGU6IFR5cGU8YW55Pik6IHZvaWQge1xuICAgIHRoaXMucXVldWVUeXBlc0Zyb21Nb2R1bGVzQXJyYXkoW21vZHVsZVR5cGVdKTtcbiAgICB0aGlzLmNvbXBpbGVUeXBlc1N5bmMoKTtcbiAgICB0aGlzLmFwcGx5UHJvdmlkZXJPdmVycmlkZXMoKTtcbiAgICB0aGlzLmFwcGx5UHJvdmlkZXJPdmVycmlkZXNUb01vZHVsZShtb2R1bGVUeXBlKTtcbiAgICB0aGlzLmFwcGx5VHJhbnNpdGl2ZVNjb3BlcygpO1xuICB9XG5cbiAgLyoqXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgYXN5bmMgX2NvbXBpbGVOZ01vZHVsZUFzeW5jKG1vZHVsZVR5cGU6IFR5cGU8YW55Pik6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLm9yaWdpbmFsUmVnaXN0ZXJlZE1vZHVsZXMgPT09IG51bGwpIHtcbiAgICAgIHRoaXMub3JpZ2luYWxSZWdpc3RlcmVkTW9kdWxlcyA9IGdldFJlZ2lzdGVyZWRNb2R1bGVzU3RhdGUoKTtcbiAgICB9XG4gICAgdGhpcy5xdWV1ZVR5cGVzRnJvbU1vZHVsZXNBcnJheShbbW9kdWxlVHlwZV0pO1xuICAgIGF3YWl0IHRoaXMuY29tcGlsZUNvbXBvbmVudHMoKTtcbiAgICB0aGlzLmFwcGx5UHJvdmlkZXJPdmVycmlkZXMoKTtcbiAgICB0aGlzLmFwcGx5UHJvdmlkZXJPdmVycmlkZXNUb01vZHVsZShtb2R1bGVUeXBlKTtcbiAgICB0aGlzLmFwcGx5VHJhbnNpdGl2ZVNjb3BlcygpO1xuICB9XG5cbiAgLyoqXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgX2dldE1vZHVsZVJlc29sdmVyKCk6IFJlc29sdmVyPE5nTW9kdWxlPiB7IHJldHVybiB0aGlzLnJlc29sdmVycy5tb2R1bGU7IH1cblxuICAvKipcbiAgICogQGludGVybmFsXG4gICAqL1xuICBfZ2V0Q29tcG9uZW50RmFjdG9yaWVzKG1vZHVsZVR5cGU6IE5nTW9kdWxlVHlwZSk6IENvbXBvbmVudEZhY3Rvcnk8YW55PltdIHtcbiAgICByZXR1cm4gbWF5YmVVbndyYXBGbihtb2R1bGVUeXBlLsm1bW9kLmRlY2xhcmF0aW9ucykucmVkdWNlKChmYWN0b3JpZXMsIGRlY2xhcmF0aW9uKSA9PiB7XG4gICAgICBjb25zdCBjb21wb25lbnREZWYgPSAoZGVjbGFyYXRpb24gYXMgYW55KS7JtWNtcDtcbiAgICAgIGNvbXBvbmVudERlZiAmJiBmYWN0b3JpZXMucHVzaChuZXcgQ29tcG9uZW50RmFjdG9yeShjb21wb25lbnREZWYsIHRoaXMudGVzdE1vZHVsZVJlZiAhKSk7XG4gICAgICByZXR1cm4gZmFjdG9yaWVzO1xuICAgIH0sIFtdIGFzIENvbXBvbmVudEZhY3Rvcnk8YW55PltdKTtcbiAgfVxuXG4gIHByaXZhdGUgY29tcGlsZVR5cGVzU3luYygpOiBib29sZWFuIHtcbiAgICAvLyBDb21waWxlIGFsbCBxdWV1ZWQgY29tcG9uZW50cywgZGlyZWN0aXZlcywgcGlwZXMuXG4gICAgbGV0IG5lZWRzQXN5bmNSZXNvdXJjZXMgPSBmYWxzZTtcbiAgICB0aGlzLnBlbmRpbmdDb21wb25lbnRzLmZvckVhY2goZGVjbGFyYXRpb24gPT4ge1xuICAgICAgbmVlZHNBc3luY1Jlc291cmNlcyA9IG5lZWRzQXN5bmNSZXNvdXJjZXMgfHwgaXNDb21wb25lbnREZWZQZW5kaW5nUmVzb2x1dGlvbihkZWNsYXJhdGlvbik7XG4gICAgICBjb25zdCBtZXRhZGF0YSA9IHRoaXMucmVzb2x2ZXJzLmNvbXBvbmVudC5yZXNvbHZlKGRlY2xhcmF0aW9uKSAhO1xuICAgICAgdGhpcy5tYXliZVN0b3JlTmdEZWYoTkdfQ09NUF9ERUYsIGRlY2xhcmF0aW9uKTtcbiAgICAgIGNvbXBpbGVDb21wb25lbnQoZGVjbGFyYXRpb24sIG1ldGFkYXRhKTtcbiAgICB9KTtcbiAgICB0aGlzLnBlbmRpbmdDb21wb25lbnRzLmNsZWFyKCk7XG5cbiAgICB0aGlzLnBlbmRpbmdEaXJlY3RpdmVzLmZvckVhY2goZGVjbGFyYXRpb24gPT4ge1xuICAgICAgY29uc3QgbWV0YWRhdGEgPSB0aGlzLnJlc29sdmVycy5kaXJlY3RpdmUucmVzb2x2ZShkZWNsYXJhdGlvbik7XG4gICAgICB0aGlzLm1heWJlU3RvcmVOZ0RlZihOR19ESVJfREVGLCBkZWNsYXJhdGlvbik7XG4gICAgICBjb21waWxlRGlyZWN0aXZlKGRlY2xhcmF0aW9uLCBtZXRhZGF0YSk7XG4gICAgfSk7XG4gICAgdGhpcy5wZW5kaW5nRGlyZWN0aXZlcy5jbGVhcigpO1xuXG4gICAgdGhpcy5wZW5kaW5nUGlwZXMuZm9yRWFjaChkZWNsYXJhdGlvbiA9PiB7XG4gICAgICBjb25zdCBtZXRhZGF0YSA9IHRoaXMucmVzb2x2ZXJzLnBpcGUucmVzb2x2ZShkZWNsYXJhdGlvbikgITtcbiAgICAgIHRoaXMubWF5YmVTdG9yZU5nRGVmKE5HX1BJUEVfREVGLCBkZWNsYXJhdGlvbik7XG4gICAgICBjb21waWxlUGlwZShkZWNsYXJhdGlvbiwgbWV0YWRhdGEpO1xuICAgIH0pO1xuICAgIHRoaXMucGVuZGluZ1BpcGVzLmNsZWFyKCk7XG5cbiAgICByZXR1cm4gbmVlZHNBc3luY1Jlc291cmNlcztcbiAgfVxuXG4gIHByaXZhdGUgYXBwbHlUcmFuc2l0aXZlU2NvcGVzKCk6IHZvaWQge1xuICAgIGNvbnN0IG1vZHVsZVRvU2NvcGUgPSBuZXcgTWFwPFR5cGU8YW55PnxUZXN0aW5nTW9kdWxlT3ZlcnJpZGUsIE5nTW9kdWxlVHJhbnNpdGl2ZVNjb3Blcz4oKTtcbiAgICBjb25zdCBnZXRTY29wZU9mTW9kdWxlID1cbiAgICAgICAgKG1vZHVsZVR5cGU6IFR5cGU8YW55PnwgVGVzdGluZ01vZHVsZU92ZXJyaWRlKTogTmdNb2R1bGVUcmFuc2l0aXZlU2NvcGVzID0+IHtcbiAgICAgICAgICBpZiAoIW1vZHVsZVRvU2NvcGUuaGFzKG1vZHVsZVR5cGUpKSB7XG4gICAgICAgICAgICBjb25zdCByZWFsVHlwZSA9IGlzVGVzdGluZ01vZHVsZU92ZXJyaWRlKG1vZHVsZVR5cGUpID8gdGhpcy50ZXN0TW9kdWxlVHlwZSA6IG1vZHVsZVR5cGU7XG4gICAgICAgICAgICBtb2R1bGVUb1Njb3BlLnNldChtb2R1bGVUeXBlLCB0cmFuc2l0aXZlU2NvcGVzRm9yKHJlYWxUeXBlKSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBtb2R1bGVUb1Njb3BlLmdldChtb2R1bGVUeXBlKSAhO1xuICAgICAgICB9O1xuXG4gICAgdGhpcy5jb21wb25lbnRUb01vZHVsZVNjb3BlLmZvckVhY2goKG1vZHVsZVR5cGUsIGNvbXBvbmVudFR5cGUpID0+IHtcbiAgICAgIGNvbnN0IG1vZHVsZVNjb3BlID0gZ2V0U2NvcGVPZk1vZHVsZShtb2R1bGVUeXBlKTtcbiAgICAgIHRoaXMuc3RvcmVGaWVsZE9mRGVmT25UeXBlKGNvbXBvbmVudFR5cGUsIE5HX0NPTVBfREVGLCAnZGlyZWN0aXZlRGVmcycpO1xuICAgICAgdGhpcy5zdG9yZUZpZWxkT2ZEZWZPblR5cGUoY29tcG9uZW50VHlwZSwgTkdfQ09NUF9ERUYsICdwaXBlRGVmcycpO1xuICAgICAgcGF0Y2hDb21wb25lbnREZWZXaXRoU2NvcGUoKGNvbXBvbmVudFR5cGUgYXMgYW55KS7JtWNtcCwgbW9kdWxlU2NvcGUpO1xuICAgIH0pO1xuXG4gICAgdGhpcy5jb21wb25lbnRUb01vZHVsZVNjb3BlLmNsZWFyKCk7XG4gIH1cblxuICBwcml2YXRlIGFwcGx5UHJvdmlkZXJPdmVycmlkZXMoKTogdm9pZCB7XG4gICAgY29uc3QgbWF5YmVBcHBseU92ZXJyaWRlcyA9IChmaWVsZDogc3RyaW5nKSA9PiAodHlwZTogVHlwZTxhbnk+KSA9PiB7XG4gICAgICBjb25zdCByZXNvbHZlciA9IGZpZWxkID09PSBOR19DT01QX0RFRiA/IHRoaXMucmVzb2x2ZXJzLmNvbXBvbmVudCA6IHRoaXMucmVzb2x2ZXJzLmRpcmVjdGl2ZTtcbiAgICAgIGNvbnN0IG1ldGFkYXRhID0gcmVzb2x2ZXIucmVzb2x2ZSh0eXBlKSAhO1xuICAgICAgaWYgKHRoaXMuaGFzUHJvdmlkZXJPdmVycmlkZXMobWV0YWRhdGEucHJvdmlkZXJzKSkge1xuICAgICAgICB0aGlzLnBhdGNoRGVmV2l0aFByb3ZpZGVyT3ZlcnJpZGVzKHR5cGUsIGZpZWxkKTtcbiAgICAgIH1cbiAgICB9O1xuICAgIHRoaXMuc2VlbkNvbXBvbmVudHMuZm9yRWFjaChtYXliZUFwcGx5T3ZlcnJpZGVzKE5HX0NPTVBfREVGKSk7XG4gICAgdGhpcy5zZWVuRGlyZWN0aXZlcy5mb3JFYWNoKG1heWJlQXBwbHlPdmVycmlkZXMoTkdfRElSX0RFRikpO1xuXG4gICAgdGhpcy5zZWVuQ29tcG9uZW50cy5jbGVhcigpO1xuICAgIHRoaXMuc2VlbkRpcmVjdGl2ZXMuY2xlYXIoKTtcbiAgfVxuXG4gIHByaXZhdGUgYXBwbHlQcm92aWRlck92ZXJyaWRlc1RvTW9kdWxlKG1vZHVsZVR5cGU6IFR5cGU8YW55Pik6IHZvaWQge1xuICAgIGlmICh0aGlzLm1vZHVsZVByb3ZpZGVyc092ZXJyaWRkZW4uaGFzKG1vZHVsZVR5cGUpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRoaXMubW9kdWxlUHJvdmlkZXJzT3ZlcnJpZGRlbi5hZGQobW9kdWxlVHlwZSk7XG5cbiAgICBjb25zdCBpbmplY3RvckRlZjogYW55ID0gKG1vZHVsZVR5cGUgYXMgYW55KVtOR19JTkpfREVGXTtcbiAgICBpZiAodGhpcy5wcm92aWRlck92ZXJyaWRlc0J5VG9rZW4uc2l6ZSA+IDApIHtcbiAgICAgIC8vIEV4dHJhY3QgdGhlIGxpc3Qgb2YgcHJvdmlkZXJzIGZyb20gTW9kdWxlV2l0aFByb3ZpZGVycywgc28gd2UgY2FuIGRlZmluZSB0aGUgZmluYWwgbGlzdCBvZlxuICAgICAgLy8gcHJvdmlkZXJzIHRoYXQgbWlnaHQgaGF2ZSBvdmVycmlkZXMuXG4gICAgICAvLyBOb3RlOiBzZWNvbmQgYGZsYXR0ZW5gIG9wZXJhdGlvbiBpcyBuZWVkZWQgdG8gY29udmVydCBhbiBhcnJheSBvZiBwcm92aWRlcnNcbiAgICAgIC8vIChlLmcuIGBbW10sIFtdXWApIGludG8gb25lIGZsYXQgbGlzdCwgYWxzbyBlbGltaW5hdGluZyBlbXB0eSBhcnJheXMuXG4gICAgICBjb25zdCBwcm92aWRlcnNGcm9tTW9kdWxlcyA9IGZsYXR0ZW4oZmxhdHRlbihcbiAgICAgICAgICBpbmplY3RvckRlZi5pbXBvcnRzLCAoaW1wb3J0ZWQ6IE5nTW9kdWxlVHlwZTxhbnk+fCBNb2R1bGVXaXRoUHJvdmlkZXJzPGFueT4pID0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlzTW9kdWxlV2l0aFByb3ZpZGVycyhpbXBvcnRlZCkgPyBpbXBvcnRlZC5wcm92aWRlcnMgOiBbXSkpO1xuICAgICAgY29uc3QgcHJvdmlkZXJzID0gWy4uLnByb3ZpZGVyc0Zyb21Nb2R1bGVzLCAuLi5pbmplY3RvckRlZi5wcm92aWRlcnNdO1xuICAgICAgaWYgKHRoaXMuaGFzUHJvdmlkZXJPdmVycmlkZXMocHJvdmlkZXJzKSkge1xuICAgICAgICB0aGlzLm1heWJlU3RvcmVOZ0RlZihOR19JTkpfREVGLCBtb2R1bGVUeXBlKTtcblxuICAgICAgICB0aGlzLnN0b3JlRmllbGRPZkRlZk9uVHlwZShtb2R1bGVUeXBlLCBOR19JTkpfREVGLCAncHJvdmlkZXJzJyk7XG4gICAgICAgIGluamVjdG9yRGVmLnByb3ZpZGVycyA9IHRoaXMuZ2V0T3ZlcnJpZGRlblByb3ZpZGVycyhwcm92aWRlcnMpO1xuICAgICAgfVxuXG4gICAgICAvLyBBcHBseSBwcm92aWRlciBvdmVycmlkZXMgdG8gaW1wb3J0ZWQgbW9kdWxlcyByZWN1cnNpdmVseVxuICAgICAgY29uc3QgbW9kdWxlRGVmOiBhbnkgPSAobW9kdWxlVHlwZSBhcyBhbnkpW05HX01PRF9ERUZdO1xuICAgICAgZm9yIChjb25zdCBpbXBvcnRUeXBlIG9mIG1vZHVsZURlZi5pbXBvcnRzKSB7XG4gICAgICAgIHRoaXMuYXBwbHlQcm92aWRlck92ZXJyaWRlc1RvTW9kdWxlKGltcG9ydFR5cGUpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgcGF0Y2hDb21wb25lbnRzV2l0aEV4aXN0aW5nU3R5bGVzKCk6IHZvaWQge1xuICAgIHRoaXMuZXhpc3RpbmdDb21wb25lbnRTdHlsZXMuZm9yRWFjaChcbiAgICAgICAgKHN0eWxlcywgdHlwZSkgPT4gKHR5cGUgYXMgYW55KVtOR19DT01QX0RFRl0uc3R5bGVzID0gc3R5bGVzKTtcbiAgICB0aGlzLmV4aXN0aW5nQ29tcG9uZW50U3R5bGVzLmNsZWFyKCk7XG4gIH1cblxuICBwcml2YXRlIHF1ZXVlVHlwZUFycmF5KGFycjogYW55W10sIG1vZHVsZVR5cGU6IFR5cGU8YW55PnxUZXN0aW5nTW9kdWxlT3ZlcnJpZGUpOiB2b2lkIHtcbiAgICBmb3IgKGNvbnN0IHZhbHVlIG9mIGFycikge1xuICAgICAgaWYgKEFycmF5LmlzQXJyYXkodmFsdWUpKSB7XG4gICAgICAgIHRoaXMucXVldWVUeXBlQXJyYXkodmFsdWUsIG1vZHVsZVR5cGUpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5xdWV1ZVR5cGUodmFsdWUsIG1vZHVsZVR5cGUpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgcmVjb21waWxlTmdNb2R1bGUobmdNb2R1bGU6IFR5cGU8YW55Pik6IHZvaWQge1xuICAgIGNvbnN0IG1ldGFkYXRhID0gdGhpcy5yZXNvbHZlcnMubW9kdWxlLnJlc29sdmUobmdNb2R1bGUpO1xuICAgIGlmIChtZXRhZGF0YSA9PT0gbnVsbCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBVbmFibGUgdG8gcmVzb2x2ZSBtZXRhZGF0YSBmb3IgTmdNb2R1bGU6ICR7bmdNb2R1bGUubmFtZX1gKTtcbiAgICB9XG4gICAgLy8gQ2FjaGUgdGhlIGluaXRpYWwgbmdNb2R1bGVEZWYgYXMgaXQgd2lsbCBiZSBvdmVyd3JpdHRlbi5cbiAgICB0aGlzLm1heWJlU3RvcmVOZ0RlZihOR19NT0RfREVGLCBuZ01vZHVsZSk7XG4gICAgdGhpcy5tYXliZVN0b3JlTmdEZWYoTkdfSU5KX0RFRiwgbmdNb2R1bGUpO1xuXG4gICAgY29tcGlsZU5nTW9kdWxlRGVmcyhuZ01vZHVsZSBhcyBOZ01vZHVsZVR5cGU8YW55PiwgbWV0YWRhdGEpO1xuICB9XG5cbiAgcHJpdmF0ZSBxdWV1ZVR5cGUodHlwZTogVHlwZTxhbnk+LCBtb2R1bGVUeXBlOiBUeXBlPGFueT58VGVzdGluZ01vZHVsZU92ZXJyaWRlKTogdm9pZCB7XG4gICAgY29uc3QgY29tcG9uZW50ID0gdGhpcy5yZXNvbHZlcnMuY29tcG9uZW50LnJlc29sdmUodHlwZSk7XG4gICAgaWYgKGNvbXBvbmVudCkge1xuICAgICAgLy8gQ2hlY2sgd2hldGhlciBhIGdpdmUgVHlwZSBoYXMgcmVzcGVjdGl2ZSBORyBkZWYgKMm1Y21wKSBhbmQgY29tcGlsZSBpZiBkZWYgaXNcbiAgICAgIC8vIG1pc3NpbmcuIFRoYXQgbWlnaHQgaGFwcGVuIGluIGNhc2UgYSBjbGFzcyB3aXRob3V0IGFueSBBbmd1bGFyIGRlY29yYXRvcnMgZXh0ZW5kcyBhbm90aGVyXG4gICAgICAvLyBjbGFzcyB3aGVyZSBDb21wb25lbnQvRGlyZWN0aXZlL1BpcGUgZGVjb3JhdG9yIGlzIGRlZmluZWQuXG4gICAgICBpZiAoaXNDb21wb25lbnREZWZQZW5kaW5nUmVzb2x1dGlvbih0eXBlKSB8fCAhdHlwZS5oYXNPd25Qcm9wZXJ0eShOR19DT01QX0RFRikpIHtcbiAgICAgICAgdGhpcy5wZW5kaW5nQ29tcG9uZW50cy5hZGQodHlwZSk7XG4gICAgICB9XG4gICAgICB0aGlzLnNlZW5Db21wb25lbnRzLmFkZCh0eXBlKTtcblxuICAgICAgLy8gS2VlcCB0cmFjayBvZiB0aGUgbW9kdWxlIHdoaWNoIGRlY2xhcmVzIHRoaXMgY29tcG9uZW50LCBzbyBsYXRlciB0aGUgY29tcG9uZW50J3Mgc2NvcGVcbiAgICAgIC8vIGNhbiBiZSBzZXQgY29ycmVjdGx5LiBJZiB0aGUgY29tcG9uZW50IGhhcyBhbHJlYWR5IGJlZW4gcmVjb3JkZWQgaGVyZSwgdGhlbiBvbmUgb2Ygc2V2ZXJhbFxuICAgICAgLy8gY2FzZXMgaXMgdHJ1ZTpcbiAgICAgIC8vICogdGhlIG1vZHVsZSBjb250YWluaW5nIHRoZSBjb21wb25lbnQgd2FzIGltcG9ydGVkIG11bHRpcGxlIHRpbWVzIChjb21tb24pLlxuICAgICAgLy8gKiB0aGUgY29tcG9uZW50IGlzIGRlY2xhcmVkIGluIG11bHRpcGxlIG1vZHVsZXMgKHdoaWNoIGlzIGFuIGVycm9yKS5cbiAgICAgIC8vICogdGhlIGNvbXBvbmVudCB3YXMgaW4gJ2RlY2xhcmF0aW9ucycgb2YgdGhlIHRlc3RpbmcgbW9kdWxlLCBhbmQgYWxzbyBpbiBhbiBpbXBvcnRlZCBtb2R1bGVcbiAgICAgIC8vICAgaW4gd2hpY2ggY2FzZSB0aGUgbW9kdWxlIHNjb3BlIHdpbGwgYmUgVGVzdGluZ01vZHVsZU92ZXJyaWRlLkRFQ0xBUkFUSU9OLlxuICAgICAgLy8gKiBvdmVycmlkZVRlbXBsYXRlVXNpbmdUZXN0aW5nTW9kdWxlIHdhcyBjYWxsZWQgZm9yIHRoZSBjb21wb25lbnQgaW4gd2hpY2ggY2FzZSB0aGUgbW9kdWxlXG4gICAgICAvLyAgIHNjb3BlIHdpbGwgYmUgVGVzdGluZ01vZHVsZU92ZXJyaWRlLk9WRVJSSURFX1RFTVBMQVRFLlxuICAgICAgLy9cbiAgICAgIC8vIElmIHRoZSBjb21wb25lbnQgd2FzIHByZXZpb3VzbHkgaW4gdGhlIHRlc3RpbmcgbW9kdWxlJ3MgJ2RlY2xhcmF0aW9ucycgKG1lYW5pbmcgdGhlXG4gICAgICAvLyBjdXJyZW50IHZhbHVlIGlzIFRlc3RpbmdNb2R1bGVPdmVycmlkZS5ERUNMQVJBVElPTiksIHRoZW4gYG1vZHVsZVR5cGVgIGlzIHRoZSBjb21wb25lbnQnc1xuICAgICAgLy8gcmVhbCBtb2R1bGUsIHdoaWNoIHdhcyBpbXBvcnRlZC4gVGhpcyBwYXR0ZXJuIGlzIHVuZGVyc3Rvb2QgdG8gbWVhbiB0aGF0IHRoZSBjb21wb25lbnRcbiAgICAgIC8vIHNob3VsZCB1c2UgaXRzIG9yaWdpbmFsIHNjb3BlLCBidXQgdGhhdCB0aGUgdGVzdGluZyBtb2R1bGUgc2hvdWxkIGFsc28gY29udGFpbiB0aGVcbiAgICAgIC8vIGNvbXBvbmVudCBpbiBpdHMgc2NvcGUuXG4gICAgICBpZiAoIXRoaXMuY29tcG9uZW50VG9Nb2R1bGVTY29wZS5oYXModHlwZSkgfHxcbiAgICAgICAgICB0aGlzLmNvbXBvbmVudFRvTW9kdWxlU2NvcGUuZ2V0KHR5cGUpID09PSBUZXN0aW5nTW9kdWxlT3ZlcnJpZGUuREVDTEFSQVRJT04pIHtcbiAgICAgICAgdGhpcy5jb21wb25lbnRUb01vZHVsZVNjb3BlLnNldCh0eXBlLCBtb2R1bGVUeXBlKTtcbiAgICAgIH1cbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBkaXJlY3RpdmUgPSB0aGlzLnJlc29sdmVycy5kaXJlY3RpdmUucmVzb2x2ZSh0eXBlKTtcbiAgICBpZiAoZGlyZWN0aXZlKSB7XG4gICAgICBpZiAoIXR5cGUuaGFzT3duUHJvcGVydHkoTkdfRElSX0RFRikpIHtcbiAgICAgICAgdGhpcy5wZW5kaW5nRGlyZWN0aXZlcy5hZGQodHlwZSk7XG4gICAgICB9XG4gICAgICB0aGlzLnNlZW5EaXJlY3RpdmVzLmFkZCh0eXBlKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBwaXBlID0gdGhpcy5yZXNvbHZlcnMucGlwZS5yZXNvbHZlKHR5cGUpO1xuICAgIGlmIChwaXBlICYmICF0eXBlLmhhc093blByb3BlcnR5KE5HX1BJUEVfREVGKSkge1xuICAgICAgdGhpcy5wZW5kaW5nUGlwZXMuYWRkKHR5cGUpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgcXVldWVUeXBlc0Zyb21Nb2R1bGVzQXJyYXkoYXJyOiBhbnlbXSk6IHZvaWQge1xuICAgIGZvciAoY29uc3QgdmFsdWUgb2YgYXJyKSB7XG4gICAgICBpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHtcbiAgICAgICAgdGhpcy5xdWV1ZVR5cGVzRnJvbU1vZHVsZXNBcnJheSh2YWx1ZSk7XG4gICAgICB9IGVsc2UgaWYgKGhhc05nTW9kdWxlRGVmKHZhbHVlKSkge1xuICAgICAgICBjb25zdCBkZWYgPSB2YWx1ZS7JtW1vZDtcbiAgICAgICAgLy8gTG9vayB0aHJvdWdoIGRlY2xhcmF0aW9ucywgaW1wb3J0cywgYW5kIGV4cG9ydHMsIGFuZCBxdWV1ZSBldmVyeXRoaW5nIGZvdW5kIHRoZXJlLlxuICAgICAgICB0aGlzLnF1ZXVlVHlwZUFycmF5KG1heWJlVW53cmFwRm4oZGVmLmRlY2xhcmF0aW9ucyksIHZhbHVlKTtcbiAgICAgICAgdGhpcy5xdWV1ZVR5cGVzRnJvbU1vZHVsZXNBcnJheShtYXliZVVud3JhcEZuKGRlZi5pbXBvcnRzKSk7XG4gICAgICAgIHRoaXMucXVldWVUeXBlc0Zyb21Nb2R1bGVzQXJyYXkobWF5YmVVbndyYXBGbihkZWYuZXhwb3J0cykpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgbWF5YmVTdG9yZU5nRGVmKHByb3A6IHN0cmluZywgdHlwZTogVHlwZTxhbnk+KSB7XG4gICAgaWYgKCF0aGlzLmluaXRpYWxOZ0RlZnMuaGFzKHR5cGUpKSB7XG4gICAgICBjb25zdCBjdXJyZW50RGVmID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcih0eXBlLCBwcm9wKTtcbiAgICAgIHRoaXMuaW5pdGlhbE5nRGVmcy5zZXQodHlwZSwgW3Byb3AsIGN1cnJlbnREZWZdKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIHN0b3JlRmllbGRPZkRlZk9uVHlwZSh0eXBlOiBUeXBlPGFueT4sIGRlZkZpZWxkOiBzdHJpbmcsIGZpZWxkOiBzdHJpbmcpOiB2b2lkIHtcbiAgICBjb25zdCBkZWY6IGFueSA9ICh0eXBlIGFzIGFueSlbZGVmRmllbGRdO1xuICAgIGNvbnN0IG9yaWdpbmFsOiBhbnkgPSBkZWZbZmllbGRdO1xuICAgIHRoaXMuZGVmQ2xlYW51cE9wcy5wdXNoKHtmaWVsZCwgZGVmLCBvcmlnaW5hbH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIENsZWFycyBjdXJyZW50IGNvbXBvbmVudHMgcmVzb2x1dGlvbiBxdWV1ZSwgYnV0IHN0b3JlcyB0aGUgc3RhdGUgb2YgdGhlIHF1ZXVlLCBzbyB3ZSBjYW5cbiAgICogcmVzdG9yZSBpdCBsYXRlci4gQ2xlYXJpbmcgdGhlIHF1ZXVlIGlzIHJlcXVpcmVkIGJlZm9yZSB3ZSB0cnkgdG8gY29tcGlsZSBjb21wb25lbnRzICh2aWFcbiAgICogYFRlc3RCZWQuY29tcGlsZUNvbXBvbmVudHNgKSwgc28gdGhhdCBjb21wb25lbnQgZGVmcyBhcmUgaW4gc3luYyB3aXRoIHRoZSByZXNvbHV0aW9uIHF1ZXVlLlxuICAgKi9cbiAgcHJpdmF0ZSBjbGVhckNvbXBvbmVudFJlc29sdXRpb25RdWV1ZSgpIHtcbiAgICBpZiAodGhpcy5vcmlnaW5hbENvbXBvbmVudFJlc29sdXRpb25RdWV1ZSA9PT0gbnVsbCkge1xuICAgICAgdGhpcy5vcmlnaW5hbENvbXBvbmVudFJlc29sdXRpb25RdWV1ZSA9IG5ldyBNYXAoKTtcbiAgICB9XG4gICAgY2xlYXJSZXNvbHV0aW9uT2ZDb21wb25lbnRSZXNvdXJjZXNRdWV1ZSgpLmZvckVhY2goXG4gICAgICAgICh2YWx1ZSwga2V5KSA9PiB0aGlzLm9yaWdpbmFsQ29tcG9uZW50UmVzb2x1dGlvblF1ZXVlICEuc2V0KGtleSwgdmFsdWUpKTtcbiAgfVxuXG4gIC8qXG4gICAqIFJlc3RvcmVzIGNvbXBvbmVudCByZXNvbHV0aW9uIHF1ZXVlIHRvIHRoZSBwcmV2aW91c2x5IHNhdmVkIHN0YXRlLiBUaGlzIG9wZXJhdGlvbiBpcyBwZXJmb3JtZWRcbiAgICogYXMgYSBwYXJ0IG9mIHJlc3RvcmluZyB0aGUgc3RhdGUgYWZ0ZXIgY29tcGxldGlvbiBvZiB0aGUgY3VycmVudCBzZXQgb2YgdGVzdHMgKHRoYXQgbWlnaHRcbiAgICogcG90ZW50aWFsbHkgbXV0YXRlIHRoZSBzdGF0ZSkuXG4gICAqL1xuICBwcml2YXRlIHJlc3RvcmVDb21wb25lbnRSZXNvbHV0aW9uUXVldWUoKSB7XG4gICAgaWYgKHRoaXMub3JpZ2luYWxDb21wb25lbnRSZXNvbHV0aW9uUXVldWUgIT09IG51bGwpIHtcbiAgICAgIHJlc3RvcmVDb21wb25lbnRSZXNvbHV0aW9uUXVldWUodGhpcy5vcmlnaW5hbENvbXBvbmVudFJlc29sdXRpb25RdWV1ZSk7XG4gICAgICB0aGlzLm9yaWdpbmFsQ29tcG9uZW50UmVzb2x1dGlvblF1ZXVlID0gbnVsbDtcbiAgICB9XG4gIH1cblxuICByZXN0b3JlT3JpZ2luYWxTdGF0ZSgpOiB2b2lkIHtcbiAgICAvLyBQcm9jZXNzIGNsZWFudXAgb3BzIGluIHJldmVyc2Ugb3JkZXIgc28gdGhlIGZpZWxkJ3Mgb3JpZ2luYWwgdmFsdWUgaXMgcmVzdG9yZWQgY29ycmVjdGx5IChpblxuICAgIC8vIGNhc2UgdGhlcmUgd2VyZSBtdWx0aXBsZSBvdmVycmlkZXMgZm9yIHRoZSBzYW1lIGZpZWxkKS5cbiAgICBmb3JFYWNoUmlnaHQodGhpcy5kZWZDbGVhbnVwT3BzLCAob3A6IENsZWFudXBPcGVyYXRpb24pID0+IHsgb3AuZGVmW29wLmZpZWxkXSA9IG9wLm9yaWdpbmFsOyB9KTtcbiAgICAvLyBSZXN0b3JlIGluaXRpYWwgY29tcG9uZW50L2RpcmVjdGl2ZS9waXBlIGRlZnNcbiAgICB0aGlzLmluaXRpYWxOZ0RlZnMuZm9yRWFjaChcbiAgICAgICAgKHZhbHVlOiBbc3RyaW5nLCBQcm9wZXJ0eURlc2NyaXB0b3IgfCB1bmRlZmluZWRdLCB0eXBlOiBUeXBlPGFueT4pID0+IHtcbiAgICAgICAgICBjb25zdCBbcHJvcCwgZGVzY3JpcHRvcl0gPSB2YWx1ZTtcbiAgICAgICAgICBpZiAoIWRlc2NyaXB0b3IpIHtcbiAgICAgICAgICAgIC8vIERlbGV0ZSBvcGVyYXRpb25zIGFyZSBnZW5lcmFsbHkgdW5kZXNpcmFibGUgc2luY2UgdGhleSBoYXZlIHBlcmZvcm1hbmNlIGltcGxpY2F0aW9uc1xuICAgICAgICAgICAgLy8gb24gb2JqZWN0cyB0aGV5IHdlcmUgYXBwbGllZCB0by4gSW4gdGhpcyBwYXJ0aWN1bGFyIGNhc2UsIHNpdHVhdGlvbnMgd2hlcmUgdGhpcyBjb2RlXG4gICAgICAgICAgICAvLyBpcyBpbnZva2VkIHNob3VsZCBiZSBxdWl0ZSByYXJlIHRvIGNhdXNlIGFueSBub3RpY2VhYmxlIGltcGFjdCwgc2luY2UgaXQncyBhcHBsaWVkXG4gICAgICAgICAgICAvLyBvbmx5IHRvIHNvbWUgdGVzdCBjYXNlcyAoZm9yIGV4YW1wbGUgd2hlbiBjbGFzcyB3aXRoIG5vIGFubm90YXRpb25zIGV4dGVuZHMgc29tZVxuICAgICAgICAgICAgLy8gQENvbXBvbmVudCkgd2hlbiB3ZSBuZWVkIHRvIGNsZWFyICfJtWNtcCcgZmllbGQgb24gYSBnaXZlbiBjbGFzcyB0byByZXN0b3JlXG4gICAgICAgICAgICAvLyBpdHMgb3JpZ2luYWwgc3RhdGUgKGJlZm9yZSBhcHBseWluZyBvdmVycmlkZXMgYW5kIHJ1bm5pbmcgdGVzdHMpLlxuICAgICAgICAgICAgZGVsZXRlICh0eXBlIGFzIGFueSlbcHJvcF07XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0eXBlLCBwcm9wLCBkZXNjcmlwdG9yKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIHRoaXMuaW5pdGlhbE5nRGVmcy5jbGVhcigpO1xuICAgIHRoaXMubW9kdWxlUHJvdmlkZXJzT3ZlcnJpZGRlbi5jbGVhcigpO1xuICAgIHRoaXMucmVzdG9yZUNvbXBvbmVudFJlc29sdXRpb25RdWV1ZSgpO1xuICAgIGlmICh0aGlzLm9yaWdpbmFsUmVnaXN0ZXJlZE1vZHVsZXMpIHtcbiAgICAgIHJlc3RvcmVSZWdpc3RlcmVkTW9kdWxlc1N0YXRlKHRoaXMub3JpZ2luYWxSZWdpc3RlcmVkTW9kdWxlcyk7XG4gICAgICB0aGlzLm9yaWdpbmFsUmVnaXN0ZXJlZE1vZHVsZXMgPSBudWxsO1xuICAgIH1cbiAgICAvLyBSZXN0b3JlIHRoZSBsb2NhbGUgSUQgdG8gdGhlIGRlZmF1bHQgdmFsdWUsIHRoaXMgc2hvdWxkbid0IGJlIG5lY2Vzc2FyeSBidXQgd2UgbmV2ZXIga25vd1xuICAgIHNldExvY2FsZUlkKERFRkFVTFRfTE9DQUxFX0lEKTtcbiAgfVxuXG4gIHByaXZhdGUgY29tcGlsZVRlc3RNb2R1bGUoKTogdm9pZCB7XG4gICAgY2xhc3MgUm9vdFNjb3BlTW9kdWxlIHt9XG4gICAgY29tcGlsZU5nTW9kdWxlRGVmcyhSb290U2NvcGVNb2R1bGUgYXMgTmdNb2R1bGVUeXBlPGFueT4sIHtcbiAgICAgIHByb3ZpZGVyczogWy4uLnRoaXMucm9vdFByb3ZpZGVyT3ZlcnJpZGVzXSxcbiAgICB9KTtcblxuICAgIGNvbnN0IG5nWm9uZSA9IG5ldyBOZ1pvbmUoe2VuYWJsZUxvbmdTdGFja1RyYWNlOiB0cnVlfSk7XG4gICAgY29uc3QgcHJvdmlkZXJzOiBQcm92aWRlcltdID0gW1xuICAgICAge3Byb3ZpZGU6IE5nWm9uZSwgdXNlVmFsdWU6IG5nWm9uZX0sXG4gICAgICB7cHJvdmlkZTogQ29tcGlsZXIsIHVzZUZhY3Rvcnk6ICgpID0+IG5ldyBSM1Rlc3RDb21waWxlcih0aGlzKX0sXG4gICAgICAuLi50aGlzLnByb3ZpZGVycyxcbiAgICAgIC4uLnRoaXMucHJvdmlkZXJPdmVycmlkZXMsXG4gICAgXTtcbiAgICBjb25zdCBpbXBvcnRzID0gW1Jvb3RTY29wZU1vZHVsZSwgdGhpcy5hZGRpdGlvbmFsTW9kdWxlVHlwZXMsIHRoaXMuaW1wb3J0cyB8fCBbXV07XG5cbiAgICAvLyBjbGFuZy1mb3JtYXQgb2ZmXG4gICAgY29tcGlsZU5nTW9kdWxlRGVmcyh0aGlzLnRlc3RNb2R1bGVUeXBlLCB7XG4gICAgICBkZWNsYXJhdGlvbnM6IHRoaXMuZGVjbGFyYXRpb25zLFxuICAgICAgaW1wb3J0cyxcbiAgICAgIHNjaGVtYXM6IHRoaXMuc2NoZW1hcyxcbiAgICAgIHByb3ZpZGVycyxcbiAgICB9LCAvKiBhbGxvd0R1cGxpY2F0ZURlY2xhcmF0aW9uc0luUm9vdCAqLyB0cnVlKTtcbiAgICAvLyBjbGFuZy1mb3JtYXQgb25cblxuICAgIHRoaXMuYXBwbHlQcm92aWRlck92ZXJyaWRlc1RvTW9kdWxlKHRoaXMudGVzdE1vZHVsZVR5cGUpO1xuICB9XG5cbiAgZ2V0IGluamVjdG9yKCk6IEluamVjdG9yIHtcbiAgICBpZiAodGhpcy5faW5qZWN0b3IgIT09IG51bGwpIHtcbiAgICAgIHJldHVybiB0aGlzLl9pbmplY3RvcjtcbiAgICB9XG5cbiAgICBjb25zdCBwcm92aWRlcnM6IFByb3ZpZGVyW10gPSBbXTtcbiAgICBjb25zdCBjb21waWxlck9wdGlvbnMgPSB0aGlzLnBsYXRmb3JtLmluamVjdG9yLmdldChDT01QSUxFUl9PUFRJT05TKTtcbiAgICBjb21waWxlck9wdGlvbnMuZm9yRWFjaChvcHRzID0+IHtcbiAgICAgIGlmIChvcHRzLnByb3ZpZGVycykge1xuICAgICAgICBwcm92aWRlcnMucHVzaChvcHRzLnByb3ZpZGVycyk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgaWYgKHRoaXMuY29tcGlsZXJQcm92aWRlcnMgIT09IG51bGwpIHtcbiAgICAgIHByb3ZpZGVycy5wdXNoKC4uLnRoaXMuY29tcGlsZXJQcm92aWRlcnMpO1xuICAgIH1cblxuICAgIC8vIFRPRE8ob2NvbWJlKTogbWFrZSB0aGlzIHdvcmsgd2l0aCBhbiBJbmplY3RvciBkaXJlY3RseSBpbnN0ZWFkIG9mIGNyZWF0aW5nIGEgbW9kdWxlIGZvciBpdFxuICAgIGNsYXNzIENvbXBpbGVyTW9kdWxlIHt9XG4gICAgY29tcGlsZU5nTW9kdWxlRGVmcyhDb21waWxlck1vZHVsZSBhcyBOZ01vZHVsZVR5cGU8YW55Piwge3Byb3ZpZGVyc30pO1xuXG4gICAgY29uc3QgQ29tcGlsZXJNb2R1bGVGYWN0b3J5ID0gbmV3IFIzTmdNb2R1bGVGYWN0b3J5KENvbXBpbGVyTW9kdWxlKTtcbiAgICB0aGlzLl9pbmplY3RvciA9IENvbXBpbGVyTW9kdWxlRmFjdG9yeS5jcmVhdGUodGhpcy5wbGF0Zm9ybS5pbmplY3RvcikuaW5qZWN0b3I7XG4gICAgcmV0dXJuIHRoaXMuX2luamVjdG9yO1xuICB9XG5cbiAgLy8gZ2V0IG92ZXJyaWRlcyBmb3IgYSBzcGVjaWZpYyBwcm92aWRlciAoaWYgYW55KVxuICBwcml2YXRlIGdldFNpbmdsZVByb3ZpZGVyT3ZlcnJpZGVzKHByb3ZpZGVyOiBQcm92aWRlcik6IFByb3ZpZGVyfG51bGwge1xuICAgIGNvbnN0IHRva2VuID0gZ2V0UHJvdmlkZXJUb2tlbihwcm92aWRlcik7XG4gICAgcmV0dXJuIHRoaXMucHJvdmlkZXJPdmVycmlkZXNCeVRva2VuLmdldCh0b2tlbikgfHwgbnVsbDtcbiAgfVxuXG4gIHByaXZhdGUgZ2V0UHJvdmlkZXJPdmVycmlkZXMocHJvdmlkZXJzPzogUHJvdmlkZXJbXSk6IFByb3ZpZGVyW10ge1xuICAgIGlmICghcHJvdmlkZXJzIHx8ICFwcm92aWRlcnMubGVuZ3RoIHx8IHRoaXMucHJvdmlkZXJPdmVycmlkZXNCeVRva2VuLnNpemUgPT09IDApIHJldHVybiBbXTtcbiAgICAvLyBUaGVyZSBhcmUgdHdvIGZsYXR0ZW5pbmcgb3BlcmF0aW9ucyBoZXJlLiBUaGUgaW5uZXIgZmxhdHRlbigpIG9wZXJhdGVzIG9uIHRoZSBtZXRhZGF0YSdzXG4gICAgLy8gcHJvdmlkZXJzIGFuZCBhcHBsaWVzIGEgbWFwcGluZyBmdW5jdGlvbiB3aGljaCByZXRyaWV2ZXMgb3ZlcnJpZGVzIGZvciBlYWNoIGluY29taW5nXG4gICAgLy8gcHJvdmlkZXIuIFRoZSBvdXRlciBmbGF0dGVuKCkgdGhlbiBmbGF0dGVucyB0aGUgcHJvZHVjZWQgb3ZlcnJpZGVzIGFycmF5LiBJZiB0aGlzIGlzIG5vdFxuICAgIC8vIGRvbmUsIHRoZSBhcnJheSBjYW4gY29udGFpbiBvdGhlciBlbXB0eSBhcnJheXMgKGUuZy4gYFtbXSwgW11dYCkgd2hpY2ggbGVhayBpbnRvIHRoZVxuICAgIC8vIHByb3ZpZGVycyBhcnJheSBhbmQgY29udGFtaW5hdGUgYW55IGVycm9yIG1lc3NhZ2VzIHRoYXQgbWlnaHQgYmUgZ2VuZXJhdGVkLlxuICAgIHJldHVybiBmbGF0dGVuKGZsYXR0ZW4oXG4gICAgICAgIHByb3ZpZGVycywgKHByb3ZpZGVyOiBQcm92aWRlcikgPT4gdGhpcy5nZXRTaW5nbGVQcm92aWRlck92ZXJyaWRlcyhwcm92aWRlcikgfHwgW10pKTtcbiAgfVxuXG4gIHByaXZhdGUgZ2V0T3ZlcnJpZGRlblByb3ZpZGVycyhwcm92aWRlcnM/OiBQcm92aWRlcltdKTogUHJvdmlkZXJbXSB7XG4gICAgaWYgKCFwcm92aWRlcnMgfHwgIXByb3ZpZGVycy5sZW5ndGggfHwgdGhpcy5wcm92aWRlck92ZXJyaWRlc0J5VG9rZW4uc2l6ZSA9PT0gMCkgcmV0dXJuIFtdO1xuXG4gICAgY29uc3Qgb3ZlcnJpZGVzID0gdGhpcy5nZXRQcm92aWRlck92ZXJyaWRlcyhwcm92aWRlcnMpO1xuICAgIGNvbnN0IGhhc011bHRpUHJvdmlkZXJPdmVycmlkZXMgPSBvdmVycmlkZXMuc29tZShpc011bHRpUHJvdmlkZXIpO1xuICAgIGNvbnN0IG92ZXJyaWRkZW5Qcm92aWRlcnMgPSBbLi4ucHJvdmlkZXJzLCAuLi5vdmVycmlkZXNdO1xuXG4gICAgLy8gTm8gYWRkaXRpb25hbCBwcm9jZXNzaW5nIGlzIHJlcXVpcmVkIGluIGNhc2Ugd2UgaGF2ZSBubyBtdWx0aSBwcm92aWRlcnMgdG8gb3ZlcnJpZGVcbiAgICBpZiAoIWhhc011bHRpUHJvdmlkZXJPdmVycmlkZXMpIHtcbiAgICAgIHJldHVybiBvdmVycmlkZGVuUHJvdmlkZXJzO1xuICAgIH1cblxuICAgIGNvbnN0IGZpbmFsOiBQcm92aWRlcltdID0gW107XG4gICAgY29uc3Qgc2Vlbk11bHRpUHJvdmlkZXJzID0gbmV3IFNldDxQcm92aWRlcj4oKTtcblxuICAgIC8vIFdlIGl0ZXJhdGUgdGhyb3VnaCB0aGUgbGlzdCBvZiBwcm92aWRlcnMgaW4gcmV2ZXJzZSBvcmRlciB0byBtYWtlIHN1cmUgbXVsdGkgcHJvdmlkZXJcbiAgICAvLyBvdmVycmlkZXMgdGFrZSBwcmVjZWRlbmNlIG92ZXIgdGhlIHZhbHVlcyBkZWZpbmVkIGluIHByb3ZpZGVyIGxpc3QuIFdlIGFsc28gZml0ZXIgb3V0IGFsbFxuICAgIC8vIG11bHRpIHByb3ZpZGVycyB0aGF0IGhhdmUgb3ZlcnJpZGVzLCBrZWVwaW5nIG92ZXJyaWRkZW4gdmFsdWVzIG9ubHkuXG4gICAgZm9yRWFjaFJpZ2h0KG92ZXJyaWRkZW5Qcm92aWRlcnMsIChwcm92aWRlcjogYW55KSA9PiB7XG4gICAgICBjb25zdCB0b2tlbjogYW55ID0gZ2V0UHJvdmlkZXJUb2tlbihwcm92aWRlcik7XG4gICAgICBpZiAoaXNNdWx0aVByb3ZpZGVyKHByb3ZpZGVyKSAmJiB0aGlzLnByb3ZpZGVyT3ZlcnJpZGVzQnlUb2tlbi5oYXModG9rZW4pKSB7XG4gICAgICAgIGlmICghc2Vlbk11bHRpUHJvdmlkZXJzLmhhcyh0b2tlbikpIHtcbiAgICAgICAgICBzZWVuTXVsdGlQcm92aWRlcnMuYWRkKHRva2VuKTtcbiAgICAgICAgICBpZiAocHJvdmlkZXIgJiYgcHJvdmlkZXIudXNlVmFsdWUgJiYgQXJyYXkuaXNBcnJheShwcm92aWRlci51c2VWYWx1ZSkpIHtcbiAgICAgICAgICAgIGZvckVhY2hSaWdodChwcm92aWRlci51c2VWYWx1ZSwgKHZhbHVlOiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgLy8gVW53cmFwIHByb3ZpZGVyIG92ZXJyaWRlIGFycmF5IGludG8gaW5kaXZpZHVhbCBwcm92aWRlcnMgaW4gZmluYWwgc2V0LlxuICAgICAgICAgICAgICBmaW5hbC51bnNoaWZ0KHtwcm92aWRlOiB0b2tlbiwgdXNlVmFsdWU6IHZhbHVlLCBtdWx0aTogdHJ1ZX0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGZpbmFsLnVuc2hpZnQocHJvdmlkZXIpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZmluYWwudW5zaGlmdChwcm92aWRlcik7XG4gICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIGZpbmFsO1xuICB9XG5cbiAgcHJpdmF0ZSBoYXNQcm92aWRlck92ZXJyaWRlcyhwcm92aWRlcnM/OiBQcm92aWRlcltdKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0UHJvdmlkZXJPdmVycmlkZXMocHJvdmlkZXJzKS5sZW5ndGggPiAwO1xuICB9XG5cbiAgcHJpdmF0ZSBwYXRjaERlZldpdGhQcm92aWRlck92ZXJyaWRlcyhkZWNsYXJhdGlvbjogVHlwZTxhbnk+LCBmaWVsZDogc3RyaW5nKTogdm9pZCB7XG4gICAgY29uc3QgZGVmID0gKGRlY2xhcmF0aW9uIGFzIGFueSlbZmllbGRdO1xuICAgIGlmIChkZWYgJiYgZGVmLnByb3ZpZGVyc1Jlc29sdmVyKSB7XG4gICAgICB0aGlzLm1heWJlU3RvcmVOZ0RlZihmaWVsZCwgZGVjbGFyYXRpb24pO1xuXG4gICAgICBjb25zdCByZXNvbHZlciA9IGRlZi5wcm92aWRlcnNSZXNvbHZlcjtcbiAgICAgIGNvbnN0IHByb2Nlc3NQcm92aWRlcnNGbiA9IChwcm92aWRlcnM6IFByb3ZpZGVyW10pID0+IHRoaXMuZ2V0T3ZlcnJpZGRlblByb3ZpZGVycyhwcm92aWRlcnMpO1xuICAgICAgdGhpcy5zdG9yZUZpZWxkT2ZEZWZPblR5cGUoZGVjbGFyYXRpb24sIGZpZWxkLCAncHJvdmlkZXJzUmVzb2x2ZXInKTtcbiAgICAgIGRlZi5wcm92aWRlcnNSZXNvbHZlciA9IChuZ0RlZjogRGlyZWN0aXZlRGVmPGFueT4pID0+IHJlc29sdmVyKG5nRGVmLCBwcm9jZXNzUHJvdmlkZXJzRm4pO1xuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBpbml0UmVzb2x2ZXJzKCk6IFJlc29sdmVycyB7XG4gIHJldHVybiB7XG4gICAgbW9kdWxlOiBuZXcgTmdNb2R1bGVSZXNvbHZlcigpLFxuICAgIGNvbXBvbmVudDogbmV3IENvbXBvbmVudFJlc29sdmVyKCksXG4gICAgZGlyZWN0aXZlOiBuZXcgRGlyZWN0aXZlUmVzb2x2ZXIoKSxcbiAgICBwaXBlOiBuZXcgUGlwZVJlc29sdmVyKClcbiAgfTtcbn1cblxuZnVuY3Rpb24gaGFzTmdNb2R1bGVEZWY8VD4odmFsdWU6IFR5cGU8VD4pOiB2YWx1ZSBpcyBOZ01vZHVsZVR5cGU8VD4ge1xuICByZXR1cm4gdmFsdWUuaGFzT3duUHJvcGVydHkoJ8m1bW9kJyk7XG59XG5cbmZ1bmN0aW9uIG1heWJlVW53cmFwRm48VD4obWF5YmVGbjogKCgpID0+IFQpIHwgVCk6IFQge1xuICByZXR1cm4gbWF5YmVGbiBpbnN0YW5jZW9mIEZ1bmN0aW9uID8gbWF5YmVGbigpIDogbWF5YmVGbjtcbn1cblxuZnVuY3Rpb24gZmxhdHRlbjxUPih2YWx1ZXM6IGFueVtdLCBtYXBGbj86ICh2YWx1ZTogVCkgPT4gYW55KTogVFtdIHtcbiAgY29uc3Qgb3V0OiBUW10gPSBbXTtcbiAgdmFsdWVzLmZvckVhY2godmFsdWUgPT4ge1xuICAgIGlmIChBcnJheS5pc0FycmF5KHZhbHVlKSkge1xuICAgICAgb3V0LnB1c2goLi4uZmxhdHRlbjxUPih2YWx1ZSwgbWFwRm4pKTtcbiAgICB9IGVsc2Uge1xuICAgICAgb3V0LnB1c2gobWFwRm4gPyBtYXBGbih2YWx1ZSkgOiB2YWx1ZSk7XG4gICAgfVxuICB9KTtcbiAgcmV0dXJuIG91dDtcbn1cblxuZnVuY3Rpb24gZ2V0UHJvdmlkZXJGaWVsZChwcm92aWRlcjogUHJvdmlkZXIsIGZpZWxkOiBzdHJpbmcpIHtcbiAgcmV0dXJuIHByb3ZpZGVyICYmIHR5cGVvZiBwcm92aWRlciA9PT0gJ29iamVjdCcgJiYgKHByb3ZpZGVyIGFzIGFueSlbZmllbGRdO1xufVxuXG5mdW5jdGlvbiBnZXRQcm92aWRlclRva2VuKHByb3ZpZGVyOiBQcm92aWRlcikge1xuICByZXR1cm4gZ2V0UHJvdmlkZXJGaWVsZChwcm92aWRlciwgJ3Byb3ZpZGUnKSB8fCBwcm92aWRlcjtcbn1cblxuZnVuY3Rpb24gaXNNdWx0aVByb3ZpZGVyKHByb3ZpZGVyOiBQcm92aWRlcikge1xuICByZXR1cm4gISFnZXRQcm92aWRlckZpZWxkKHByb3ZpZGVyLCAnbXVsdGknKTtcbn1cblxuZnVuY3Rpb24gaXNNb2R1bGVXaXRoUHJvdmlkZXJzKHZhbHVlOiBhbnkpOiB2YWx1ZSBpcyBNb2R1bGVXaXRoUHJvdmlkZXJzPGFueT4ge1xuICByZXR1cm4gdmFsdWUuaGFzT3duUHJvcGVydHkoJ25nTW9kdWxlJyk7XG59XG5cbmZ1bmN0aW9uIGZvckVhY2hSaWdodDxUPih2YWx1ZXM6IFRbXSwgZm46ICh2YWx1ZTogVCwgaWR4OiBudW1iZXIpID0+IHZvaWQpOiB2b2lkIHtcbiAgZm9yIChsZXQgaWR4ID0gdmFsdWVzLmxlbmd0aCAtIDE7IGlkeCA+PSAwOyBpZHgtLSkge1xuICAgIGZuKHZhbHVlc1tpZHhdLCBpZHgpO1xuICB9XG59XG5cbmNsYXNzIFIzVGVzdENvbXBpbGVyIGltcGxlbWVudHMgQ29tcGlsZXIge1xuICBjb25zdHJ1Y3Rvcihwcml2YXRlIHRlc3RCZWQ6IFIzVGVzdEJlZENvbXBpbGVyKSB7fVxuXG4gIGNvbXBpbGVNb2R1bGVTeW5jPFQ+KG1vZHVsZVR5cGU6IFR5cGU8VD4pOiBOZ01vZHVsZUZhY3Rvcnk8VD4ge1xuICAgIHRoaXMudGVzdEJlZC5fY29tcGlsZU5nTW9kdWxlU3luYyhtb2R1bGVUeXBlKTtcbiAgICByZXR1cm4gbmV3IFIzTmdNb2R1bGVGYWN0b3J5KG1vZHVsZVR5cGUpO1xuICB9XG5cbiAgYXN5bmMgY29tcGlsZU1vZHVsZUFzeW5jPFQ+KG1vZHVsZVR5cGU6IFR5cGU8VD4pOiBQcm9taXNlPE5nTW9kdWxlRmFjdG9yeTxUPj4ge1xuICAgIGF3YWl0IHRoaXMudGVzdEJlZC5fY29tcGlsZU5nTW9kdWxlQXN5bmMobW9kdWxlVHlwZSk7XG4gICAgcmV0dXJuIG5ldyBSM05nTW9kdWxlRmFjdG9yeShtb2R1bGVUeXBlKTtcbiAgfVxuXG4gIGNvbXBpbGVNb2R1bGVBbmRBbGxDb21wb25lbnRzU3luYzxUPihtb2R1bGVUeXBlOiBUeXBlPFQ+KTogTW9kdWxlV2l0aENvbXBvbmVudEZhY3RvcmllczxUPiB7XG4gICAgY29uc3QgbmdNb2R1bGVGYWN0b3J5ID0gdGhpcy5jb21waWxlTW9kdWxlU3luYyhtb2R1bGVUeXBlKTtcbiAgICBjb25zdCBjb21wb25lbnRGYWN0b3JpZXMgPSB0aGlzLnRlc3RCZWQuX2dldENvbXBvbmVudEZhY3Rvcmllcyhtb2R1bGVUeXBlIGFzIE5nTW9kdWxlVHlwZTxUPik7XG4gICAgcmV0dXJuIG5ldyBNb2R1bGVXaXRoQ29tcG9uZW50RmFjdG9yaWVzKG5nTW9kdWxlRmFjdG9yeSwgY29tcG9uZW50RmFjdG9yaWVzKTtcbiAgfVxuXG4gIGFzeW5jIGNvbXBpbGVNb2R1bGVBbmRBbGxDb21wb25lbnRzQXN5bmM8VD4obW9kdWxlVHlwZTogVHlwZTxUPik6XG4gICAgICBQcm9taXNlPE1vZHVsZVdpdGhDb21wb25lbnRGYWN0b3JpZXM8VD4+IHtcbiAgICBjb25zdCBuZ01vZHVsZUZhY3RvcnkgPSBhd2FpdCB0aGlzLmNvbXBpbGVNb2R1bGVBc3luYyhtb2R1bGVUeXBlKTtcbiAgICBjb25zdCBjb21wb25lbnRGYWN0b3JpZXMgPSB0aGlzLnRlc3RCZWQuX2dldENvbXBvbmVudEZhY3Rvcmllcyhtb2R1bGVUeXBlIGFzIE5nTW9kdWxlVHlwZTxUPik7XG4gICAgcmV0dXJuIG5ldyBNb2R1bGVXaXRoQ29tcG9uZW50RmFjdG9yaWVzKG5nTW9kdWxlRmFjdG9yeSwgY29tcG9uZW50RmFjdG9yaWVzKTtcbiAgfVxuXG4gIGNsZWFyQ2FjaGUoKTogdm9pZCB7fVxuXG4gIGNsZWFyQ2FjaGVGb3IodHlwZTogVHlwZTxhbnk+KTogdm9pZCB7fVxuXG4gIGdldE1vZHVsZUlkKG1vZHVsZVR5cGU6IFR5cGU8YW55Pik6IHN0cmluZ3x1bmRlZmluZWQge1xuICAgIGNvbnN0IG1ldGEgPSB0aGlzLnRlc3RCZWQuX2dldE1vZHVsZVJlc29sdmVyKCkucmVzb2x2ZShtb2R1bGVUeXBlKTtcbiAgICByZXR1cm4gbWV0YSAmJiBtZXRhLmlkIHx8IHVuZGVmaW5lZDtcbiAgfVxufVxuIl19