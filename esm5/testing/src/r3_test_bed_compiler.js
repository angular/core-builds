/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as tslib_1 from "tslib";
import { ApplicationInitStatus, COMPILER_OPTIONS, Compiler, ModuleWithComponentFactories, NgZone, ɵcompileComponent as compileComponent, ɵcompileDirective as compileDirective, ɵcompileNgModuleDefs as compileNgModuleDefs, ɵcompilePipe as compilePipe, ɵgetInjectableDef as getInjectableDef, ɵNG_COMPONENT_DEF as NG_COMPONENT_DEF, ɵNG_DIRECTIVE_DEF as NG_DIRECTIVE_DEF, ɵNG_INJECTOR_DEF as NG_INJECTOR_DEF, ɵNG_MODULE_DEF as NG_MODULE_DEF, ɵNG_PIPE_DEF as NG_PIPE_DEF, ɵRender3ComponentFactory as ComponentFactory, ɵRender3NgModuleRef as NgModuleRef, ɵNgModuleFactory as R3NgModuleFactory, ɵpatchComponentDefWithScope as patchComponentDefWithScope, ɵtransitiveScopesFor as transitiveScopesFor, } from '@angular/core';
import { ResourceLoader } from '@angular/compiler';
import { clearResolutionOfComponentResourcesQueue, restoreComponentResolutionQueue, resolveComponentResources, isComponentDefPendingResolution } from '../../src/metadata/resource_loading';
import { ComponentResolver, DirectiveResolver, NgModuleResolver, PipeResolver } from './resolvers';
var TESTING_MODULE = 'TestingModule';
var R3TestBedCompiler = /** @class */ (function () {
    function R3TestBedCompiler(platform, additionalModuleTypes) {
        this.platform = platform;
        this.additionalModuleTypes = additionalModuleTypes;
        this.originalComponentResolutionQueue = null;
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
            this.queueTypeArray(moduleDef.declarations, TESTING_MODULE);
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
        var def = type[NG_COMPONENT_DEF];
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
        this.componentToModuleScope.set(type, TESTING_MODULE);
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
        // Patch previously stored `styles` Component values (taken from ngComponentDef), in case these
        // Components have `styleUrls` fields defined and template override was requested.
        this.patchComponentsWithExistingStyles();
        // Clear the componentToModuleScope map, so that future compilations don't reset the scope of
        // every component.
        this.componentToModuleScope.clear();
        var parentInjector = this.platform.injector;
        this.testModuleRef = new NgModuleRef(this.testModuleType, parentInjector);
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
            var componentDef = declaration.ngComponentDef;
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
            _this.maybeStoreNgDef(NG_COMPONENT_DEF, declaration);
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
                var realType = moduleType === TESTING_MODULE ? _this.testModuleType : moduleType;
                moduleToScope.set(moduleType, transitiveScopesFor(realType));
            }
            return moduleToScope.get(moduleType);
        };
        this.componentToModuleScope.forEach(function (moduleType, componentType) {
            var moduleScope = getScopeOfModule(moduleType);
            _this.storeFieldOfDefOnType(componentType, NG_COMPONENT_DEF, 'directiveDefs');
            _this.storeFieldOfDefOnType(componentType, NG_COMPONENT_DEF, 'pipeDefs');
            patchComponentDefWithScope(componentType.ngComponentDef, moduleScope);
        });
        this.componentToModuleScope.clear();
    };
    R3TestBedCompiler.prototype.applyProviderOverrides = function () {
        var _this = this;
        var maybeApplyOverrides = function (field) { return function (type) {
            var resolver = field === NG_COMPONENT_DEF ? _this.resolvers.component : _this.resolvers.directive;
            var metadata = resolver.resolve(type);
            if (_this.hasProviderOverrides(metadata.providers)) {
                _this.patchDefWithProviderOverrides(type, field);
            }
        }; };
        this.seenComponents.forEach(maybeApplyOverrides(NG_COMPONENT_DEF));
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
            if (this.hasProviderOverrides(injectorDef.providers)) {
                this.maybeStoreNgDef(NG_INJECTOR_DEF, moduleType);
                this.storeFieldOfDefOnType(moduleType, NG_INJECTOR_DEF, 'providers');
                injectorDef.providers = this.getOverriddenProviders(injectorDef.providers);
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
        this.existingComponentStyles.forEach(function (styles, type) { return type[NG_COMPONENT_DEF].styles = styles; });
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
            // Check whether a give Type has respective NG def (ngComponentDef) and compile if def is
            // missing. That might happen in case a class without any Angular decorators extends another
            // class where Component/Directive/Pipe decorator is defined.
            if (isComponentDefPendingResolution(type) || !type.hasOwnProperty(NG_COMPONENT_DEF)) {
                this.pendingComponents.add(type);
            }
            this.seenComponents.add(type);
            // Keep track of the module which declares this component, so later the component's scope
            // can be set correctly. Only record this the first time, because it might be overridden by
            // overrideTemplateUsingTestingModule.
            if (!this.componentToModuleScope.has(type)) {
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
        var e_4, _a;
        try {
            for (var _b = tslib_1.__values(this.defCleanupOps), _c = _b.next(); !_c.done; _c = _b.next()) {
                var op = _c.value;
                op.def[op.field] = op.original;
            }
        }
        catch (e_4_1) { e_4 = { error: e_4_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_4) throw e_4.error; }
        }
        // Restore initial component/directive/pipe defs
        this.initialNgDefs.forEach(function (value, type) {
            var _a = tslib_1.__read(value, 2), prop = _a[0], descriptor = _a[1];
            if (!descriptor) {
                // Delete operations are generally undesirable since they have performance implications
                // on objects they were applied to. In this particular case, situations where this code is
                // invoked should be quite rare to cause any noticable impact, since it's applied only to
                // some test cases (for example when class with no annotations extends some @Component)
                // when we need to clear 'ngComponentDef' field on a given class to restore its original
                // state (before applying overrides and running tests).
                delete type[prop];
            }
            else {
                Object.defineProperty(type, prop, descriptor);
            }
        });
        this.initialNgDefs.clear();
        this.moduleProvidersOverridden.clear();
        this.restoreComponentResolutionQueue();
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
        });
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicjNfdGVzdF9iZWRfY29tcGlsZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3Rlc3Rpbmcvc3JjL3IzX3Rlc3RfYmVkX2NvbXBpbGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7QUFFSCxPQUFPLEVBQUMscUJBQXFCLEVBQUUsZ0JBQWdCLEVBQUUsUUFBUSxFQUF3Qiw0QkFBNEIsRUFBNkIsTUFBTSxFQUErQyxpQkFBaUIsSUFBSSxnQkFBZ0IsRUFBRSxpQkFBaUIsSUFBSSxnQkFBZ0IsRUFBRSxvQkFBb0IsSUFBSSxtQkFBbUIsRUFBRSxZQUFZLElBQUksV0FBVyxFQUFFLGlCQUFpQixJQUFJLGdCQUFnQixFQUFFLGlCQUFpQixJQUFJLGdCQUFnQixFQUFFLGlCQUFpQixJQUFJLGdCQUFnQixFQUFFLGdCQUFnQixJQUFJLGVBQWUsRUFBRSxjQUFjLElBQUksYUFBYSxFQUFFLFlBQVksSUFBSSxXQUFXLEVBQUUsd0JBQXdCLElBQUksZ0JBQWdCLEVBQUUsbUJBQW1CLElBQUksV0FBVyxFQUFtQyxnQkFBZ0IsSUFBSSxpQkFBaUIsRUFBdUgsMkJBQTJCLElBQUksMEJBQTBCLEVBQUUsb0JBQW9CLElBQUksbUJBQW1CLEdBQUUsTUFBTSxlQUFlLENBQUM7QUFDNTdCLE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUVqRCxPQUFPLEVBQUMsd0NBQXdDLEVBQUUsK0JBQStCLEVBQUUseUJBQXlCLEVBQUUsK0JBQStCLEVBQUMsTUFBTSxxQ0FBcUMsQ0FBQztBQUcxTCxPQUFPLEVBQUMsaUJBQWlCLEVBQUUsaUJBQWlCLEVBQUUsZ0JBQWdCLEVBQUUsWUFBWSxFQUFXLE1BQU0sYUFBYSxDQUFDO0FBRzNHLElBQU0sY0FBYyxHQUFHLGVBQWUsQ0FBQztBQWlCdkM7SUErQ0UsMkJBQW9CLFFBQXFCLEVBQVUscUJB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LElBQUksQ0FBQyxFQUFFLElBQUksU0FBUyxDQUFDO0lBQ3RDLENBQUM7SUFDSCxxQkFBQztBQUFELENBQUMsQUFsQ0QsSUFrQ0MiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7QXBwbGljYXRpb25Jbml0U3RhdHVzLCBDT01QSUxFUl9PUFRJT05TLCBDb21waWxlciwgQ29tcG9uZW50LCBEaXJlY3RpdmUsIE1vZHVsZVdpdGhDb21wb25lbnRGYWN0b3JpZXMsIE5nTW9kdWxlLCBOZ01vZHVsZUZhY3RvcnksIE5nWm9uZSwgSW5qZWN0b3IsIFBpcGUsIFBsYXRmb3JtUmVmLCBQcm92aWRlciwgVHlwZSwgybVjb21waWxlQ29tcG9uZW50IGFzIGNvbXBpbGVDb21wb25lbnQsIMm1Y29tcGlsZURpcmVjdGl2ZSBhcyBjb21waWxlRGlyZWN0aXZlLCDJtWNvbXBpbGVOZ01vZHVsZURlZnMgYXMgY29tcGlsZU5nTW9kdWxlRGVmcywgybVjb21waWxlUGlwZSBhcyBjb21waWxlUGlwZSwgybVnZXRJbmplY3RhYmxlRGVmIGFzIGdldEluamVjdGFibGVEZWYsIMm1TkdfQ09NUE9ORU5UX0RFRiBhcyBOR19DT01QT05FTlRfREVGLCDJtU5HX0RJUkVDVElWRV9ERUYgYXMgTkdfRElSRUNUSVZFX0RFRiwgybVOR19JTkpFQ1RPUl9ERUYgYXMgTkdfSU5KRUNUT1JfREVGLCDJtU5HX01PRFVMRV9ERUYgYXMgTkdfTU9EVUxFX0RFRiwgybVOR19QSVBFX0RFRiBhcyBOR19QSVBFX0RFRiwgybVSZW5kZXIzQ29tcG9uZW50RmFjdG9yeSBhcyBDb21wb25lbnRGYWN0b3J5LCDJtVJlbmRlcjNOZ01vZHVsZVJlZiBhcyBOZ01vZHVsZVJlZiwgzpRJbmplY3RhYmxlRGVmIGFzIEluamVjdGFibGVEZWYsIMm1TmdNb2R1bGVGYWN0b3J5IGFzIFIzTmdNb2R1bGVGYWN0b3J5LCDJtU5nTW9kdWxlVHJhbnNpdGl2ZVNjb3BlcyBhcyBOZ01vZHVsZVRyYW5zaXRpdmVTY29wZXMsIMm1TmdNb2R1bGVUeXBlIGFzIE5nTW9kdWxlVHlwZSwgybVEaXJlY3RpdmVEZWYgYXMgRGlyZWN0aXZlRGVmLCDJtXBhdGNoQ29tcG9uZW50RGVmV2l0aFNjb3BlIGFzIHBhdGNoQ29tcG9uZW50RGVmV2l0aFNjb3BlLCDJtXRyYW5zaXRpdmVTY29wZXNGb3IgYXMgdHJhbnNpdGl2ZVNjb3Blc0Zvcix9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHtSZXNvdXJjZUxvYWRlcn0gZnJvbSAnQGFuZ3VsYXIvY29tcGlsZXInO1xuXG5pbXBvcnQge2NsZWFyUmVzb2x1dGlvbk9mQ29tcG9uZW50UmVzb3VyY2VzUXVldWUsIHJlc3RvcmVDb21wb25lbnRSZXNvbHV0aW9uUXVldWUsIHJlc29sdmVDb21wb25lbnRSZXNvdXJjZXMsIGlzQ29tcG9uZW50RGVmUGVuZGluZ1Jlc29sdXRpb259IGZyb20gJy4uLy4uL3NyYy9tZXRhZGF0YS9yZXNvdXJjZV9sb2FkaW5nJztcblxuaW1wb3J0IHtNZXRhZGF0YU92ZXJyaWRlfSBmcm9tICcuL21ldGFkYXRhX292ZXJyaWRlJztcbmltcG9ydCB7Q29tcG9uZW50UmVzb2x2ZXIsIERpcmVjdGl2ZVJlc29sdmVyLCBOZ01vZHVsZVJlc29sdmVyLCBQaXBlUmVzb2x2ZXIsIFJlc29sdmVyfSBmcm9tICcuL3Jlc29sdmVycyc7XG5pbXBvcnQge1Rlc3RNb2R1bGVNZXRhZGF0YX0gZnJvbSAnLi90ZXN0X2JlZF9jb21tb24nO1xuXG5jb25zdCBURVNUSU5HX01PRFVMRSA9ICdUZXN0aW5nTW9kdWxlJztcbnR5cGUgVEVTVElOR19NT0RVTEUgPSB0eXBlb2YgVEVTVElOR19NT0RVTEU7XG5cbi8vIFJlc29sdmVycyBmb3IgQW5ndWxhciBkZWNvcmF0b3JzXG50eXBlIFJlc29sdmVycyA9IHtcbiAgbW9kdWxlOiBSZXNvbHZlcjxOZ01vZHVsZT4sXG4gIGNvbXBvbmVudDogUmVzb2x2ZXI8RGlyZWN0aXZlPixcbiAgZGlyZWN0aXZlOiBSZXNvbHZlcjxDb21wb25lbnQ+LFxuICBwaXBlOiBSZXNvbHZlcjxQaXBlPixcbn07XG5cbmludGVyZmFjZSBDbGVhbnVwT3BlcmF0aW9uIHtcbiAgZmllbGQ6IHN0cmluZztcbiAgZGVmOiBhbnk7XG4gIG9yaWdpbmFsOiB1bmtub3duO1xufVxuXG5leHBvcnQgY2xhc3MgUjNUZXN0QmVkQ29tcGlsZXIge1xuICBwcml2YXRlIG9yaWdpbmFsQ29tcG9uZW50UmVzb2x1dGlvblF1ZXVlOiBNYXA8VHlwZTxhbnk+LCBDb21wb25lbnQ+fG51bGwgPSBudWxsO1xuXG4gIC8vIFRlc3RpbmcgbW9kdWxlIGNvbmZpZ3VyYXRpb25cbiAgcHJpdmF0ZSBkZWNsYXJhdGlvbnM6IFR5cGU8YW55PltdID0gW107XG4gIHByaXZhdGUgaW1wb3J0czogVHlwZTxhbnk+W10gPSBbXTtcbiAgcHJpdmF0ZSBwcm92aWRlcnM6IFByb3ZpZGVyW10gPSBbXTtcbiAgcHJpdmF0ZSBzY2hlbWFzOiBhbnlbXSA9IFtdO1xuXG4gIC8vIFF1ZXVlcyBvZiBjb21wb25lbnRzL2RpcmVjdGl2ZXMvcGlwZXMgdGhhdCBzaG91bGQgYmUgcmVjb21waWxlZC5cbiAgcHJpdmF0ZSBwZW5kaW5nQ29tcG9uZW50cyA9IG5ldyBTZXQ8VHlwZTxhbnk+PigpO1xuICBwcml2YXRlIHBlbmRpbmdEaXJlY3RpdmVzID0gbmV3IFNldDxUeXBlPGFueT4+KCk7XG4gIHByaXZhdGUgcGVuZGluZ1BpcGVzID0gbmV3IFNldDxUeXBlPGFueT4+KCk7XG5cbiAgLy8gS2VlcCB0cmFjayBvZiBhbGwgY29tcG9uZW50cyBhbmQgZGlyZWN0aXZlcywgc28gd2UgY2FuIHBhdGNoIFByb3ZpZGVycyBvbnRvIGRlZnMgbGF0ZXIuXG4gIHByaXZhdGUgc2VlbkNvbXBvbmVudHMgPSBuZXcgU2V0PFR5cGU8YW55Pj4oKTtcbiAgcHJpdmF0ZSBzZWVuRGlyZWN0aXZlcyA9IG5ldyBTZXQ8VHlwZTxhbnk+PigpO1xuXG4gIC8vIFN0b3JlIHJlc29sdmVkIHN0eWxlcyBmb3IgQ29tcG9uZW50cyB0aGF0IGhhdmUgdGVtcGxhdGUgb3ZlcnJpZGVzIHByZXNlbnQgYW5kIGBzdHlsZVVybHNgXG4gIC8vIGRlZmluZWQgYXQgdGhlIHNhbWUgdGltZS5cbiAgcHJpdmF0ZSBleGlzdGluZ0NvbXBvbmVudFN0eWxlcyA9IG5ldyBNYXA8VHlwZTxhbnk+LCBzdHJpbmdbXT4oKTtcblxuICBwcml2YXRlIHJlc29sdmVyczogUmVzb2x2ZXJzID0gaW5pdFJlc29sdmVycygpO1xuXG4gIHByaXZhdGUgY29tcG9uZW50VG9Nb2R1bGVTY29wZSA9IG5ldyBNYXA8VHlwZTxhbnk+LCBUeXBlPGFueT58VEVTVElOR19NT0RVTEU+KCk7XG5cbiAgLy8gTWFwIHRoYXQga2VlcHMgaW5pdGlhbCB2ZXJzaW9uIG9mIGNvbXBvbmVudC9kaXJlY3RpdmUvcGlwZSBkZWZzIGluIGNhc2VcbiAgLy8gd2UgY29tcGlsZSBhIFR5cGUgYWdhaW4sIHRodXMgb3ZlcnJpZGluZyByZXNwZWN0aXZlIHN0YXRpYyBmaWVsZHMuIFRoaXMgaXNcbiAgLy8gcmVxdWlyZWQgdG8gbWFrZSBzdXJlIHdlIHJlc3RvcmUgZGVmcyB0byB0aGVpciBpbml0aWFsIHN0YXRlcyBiZXR3ZWVuIHRlc3QgcnVuc1xuICAvLyBUT0RPOiB3ZSBzaG91bGQgc3VwcG9ydCB0aGUgY2FzZSB3aXRoIG11bHRpcGxlIGRlZnMgb24gYSB0eXBlXG4gIHByaXZhdGUgaW5pdGlhbE5nRGVmcyA9IG5ldyBNYXA8VHlwZTxhbnk+LCBbc3RyaW5nLCBQcm9wZXJ0eURlc2NyaXB0b3J8dW5kZWZpbmVkXT4oKTtcblxuICAvLyBBcnJheSB0aGF0IGtlZXBzIGNsZWFudXAgb3BlcmF0aW9ucyBmb3IgaW5pdGlhbCB2ZXJzaW9ucyBvZiBjb21wb25lbnQvZGlyZWN0aXZlL3BpcGUvbW9kdWxlXG4gIC8vIGRlZnMgaW4gY2FzZSBUZXN0QmVkIG1ha2VzIGNoYW5nZXMgdG8gdGhlIG9yaWdpbmFscy5cbiAgcHJpdmF0ZSBkZWZDbGVhbnVwT3BzOiBDbGVhbnVwT3BlcmF0aW9uW10gPSBbXTtcblxuICBwcml2YXRlIF9pbmplY3RvcjogSW5qZWN0b3J8bnVsbCA9IG51bGw7XG4gIHByaXZhdGUgY29tcGlsZXJQcm92aWRlcnM6IFByb3ZpZGVyW118bnVsbCA9IG51bGw7XG5cbiAgcHJpdmF0ZSBwcm92aWRlck92ZXJyaWRlczogUHJvdmlkZXJbXSA9IFtdO1xuICBwcml2YXRlIHJvb3RQcm92aWRlck92ZXJyaWRlczogUHJvdmlkZXJbXSA9IFtdO1xuICBwcml2YXRlIHByb3ZpZGVyT3ZlcnJpZGVzQnlUb2tlbiA9IG5ldyBNYXA8YW55LCBQcm92aWRlcj4oKTtcbiAgcHJpdmF0ZSBtb2R1bGVQcm92aWRlcnNPdmVycmlkZGVuID0gbmV3IFNldDxUeXBlPGFueT4+KCk7XG5cbiAgcHJpdmF0ZSB0ZXN0TW9kdWxlVHlwZTogTmdNb2R1bGVUeXBlPGFueT47XG4gIHByaXZhdGUgdGVzdE1vZHVsZVJlZjogTmdNb2R1bGVSZWY8YW55PnxudWxsID0gbnVsbDtcblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIHBsYXRmb3JtOiBQbGF0Zm9ybVJlZiwgcHJpdmF0ZSBhZGRpdGlvbmFsTW9kdWxlVHlwZXM6IFR5cGU8YW55PnxUeXBlPGFueT5bXSkge1xuICAgIGNsYXNzIER5bmFtaWNUZXN0TW9kdWxlIHt9XG4gICAgdGhpcy50ZXN0TW9kdWxlVHlwZSA9IER5bmFtaWNUZXN0TW9kdWxlIGFzIGFueTtcbiAgfVxuXG4gIHNldENvbXBpbGVyUHJvdmlkZXJzKHByb3ZpZGVyczogUHJvdmlkZXJbXXxudWxsKTogdm9pZCB7XG4gICAgdGhpcy5jb21waWxlclByb3ZpZGVycyA9IHByb3ZpZGVycztcbiAgICB0aGlzLl9pbmplY3RvciA9IG51bGw7XG4gIH1cblxuICBjb25maWd1cmVUZXN0aW5nTW9kdWxlKG1vZHVsZURlZjogVGVzdE1vZHVsZU1ldGFkYXRhKTogdm9pZCB7XG4gICAgLy8gRW5xdWV1ZSBhbnkgY29tcGlsYXRpb24gdGFza3MgZm9yIHRoZSBkaXJlY3RseSBkZWNsYXJlZCBjb21wb25lbnQuXG4gICAgaWYgKG1vZHVsZURlZi5kZWNsYXJhdGlvbnMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhpcy5xdWV1ZVR5cGVBcnJheShtb2R1bGVEZWYuZGVjbGFyYXRpb25zLCBURVNUSU5HX01PRFVMRSk7XG4gICAgICB0aGlzLmRlY2xhcmF0aW9ucy5wdXNoKC4uLm1vZHVsZURlZi5kZWNsYXJhdGlvbnMpO1xuICAgIH1cblxuICAgIC8vIEVucXVldWUgYW55IGNvbXBpbGF0aW9uIHRhc2tzIGZvciBpbXBvcnRlZCBtb2R1bGVzLlxuICAgIGlmIChtb2R1bGVEZWYuaW1wb3J0cyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzLnF1ZXVlVHlwZXNGcm9tTW9kdWxlc0FycmF5KG1vZHVsZURlZi5pbXBvcnRzKTtcbiAgICAgIHRoaXMuaW1wb3J0cy5wdXNoKC4uLm1vZHVsZURlZi5pbXBvcnRzKTtcbiAgICB9XG5cbiAgICBpZiAobW9kdWxlRGVmLnByb3ZpZGVycyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzLnByb3ZpZGVycy5wdXNoKC4uLm1vZHVsZURlZi5wcm92aWRlcnMpO1xuICAgIH1cblxuICAgIGlmIChtb2R1bGVEZWYuc2NoZW1hcyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzLnNjaGVtYXMucHVzaCguLi5tb2R1bGVEZWYuc2NoZW1hcyk7XG4gICAgfVxuICB9XG5cbiAgb3ZlcnJpZGVNb2R1bGUobmdNb2R1bGU6IFR5cGU8YW55Piwgb3ZlcnJpZGU6IE1ldGFkYXRhT3ZlcnJpZGU8TmdNb2R1bGU+KTogdm9pZCB7XG4gICAgLy8gQ29tcGlsZSB0aGUgbW9kdWxlIHJpZ2h0IGF3YXkuXG4gICAgdGhpcy5yZXNvbHZlcnMubW9kdWxlLmFkZE92ZXJyaWRlKG5nTW9kdWxlLCBvdmVycmlkZSk7XG4gICAgY29uc3QgbWV0YWRhdGEgPSB0aGlzLnJlc29sdmVycy5tb2R1bGUucmVzb2x2ZShuZ01vZHVsZSk7XG4gICAgaWYgKG1ldGFkYXRhID09PSBudWxsKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYCR7bmdNb2R1bGUubmFtZX0gaXMgbm90IGFuIEBOZ01vZHVsZSBvciBpcyBtaXNzaW5nIG1ldGFkYXRhYCk7XG4gICAgfVxuXG4gICAgdGhpcy5yZWNvbXBpbGVOZ01vZHVsZShuZ01vZHVsZSk7XG5cbiAgICAvLyBBdCB0aGlzIHBvaW50LCB0aGUgbW9kdWxlIGhhcyBhIHZhbGlkIC5uZ01vZHVsZURlZiwgYnV0IHRoZSBvdmVycmlkZSBtYXkgaGF2ZSBpbnRyb2R1Y2VkXG4gICAgLy8gbmV3IGRlY2xhcmF0aW9ucyBvciBpbXBvcnRlZCBtb2R1bGVzLiBJbmdlc3QgYW55IHBvc3NpYmxlIG5ldyB0eXBlcyBhbmQgYWRkIHRoZW0gdG8gdGhlXG4gICAgLy8gY3VycmVudCBxdWV1ZS5cbiAgICB0aGlzLnF1ZXVlVHlwZXNGcm9tTW9kdWxlc0FycmF5KFtuZ01vZHVsZV0pO1xuICB9XG5cbiAgb3ZlcnJpZGVDb21wb25lbnQoY29tcG9uZW50OiBUeXBlPGFueT4sIG92ZXJyaWRlOiBNZXRhZGF0YU92ZXJyaWRlPENvbXBvbmVudD4pOiB2b2lkIHtcbiAgICB0aGlzLnJlc29sdmVycy5jb21wb25lbnQuYWRkT3ZlcnJpZGUoY29tcG9uZW50LCBvdmVycmlkZSk7XG4gICAgdGhpcy5wZW5kaW5nQ29tcG9uZW50cy5hZGQoY29tcG9uZW50KTtcbiAgfVxuXG4gIG92ZXJyaWRlRGlyZWN0aXZlKGRpcmVjdGl2ZTogVHlwZTxhbnk+LCBvdmVycmlkZTogTWV0YWRhdGFPdmVycmlkZTxEaXJlY3RpdmU+KTogdm9pZCB7XG4gICAgdGhpcy5yZXNvbHZlcnMuZGlyZWN0aXZlLmFkZE92ZXJyaWRlKGRpcmVjdGl2ZSwgb3ZlcnJpZGUpO1xuICAgIHRoaXMucGVuZGluZ0RpcmVjdGl2ZXMuYWRkKGRpcmVjdGl2ZSk7XG4gIH1cblxuICBvdmVycmlkZVBpcGUocGlwZTogVHlwZTxhbnk+LCBvdmVycmlkZTogTWV0YWRhdGFPdmVycmlkZTxQaXBlPik6IHZvaWQge1xuICAgIHRoaXMucmVzb2x2ZXJzLnBpcGUuYWRkT3ZlcnJpZGUocGlwZSwgb3ZlcnJpZGUpO1xuICAgIHRoaXMucGVuZGluZ1BpcGVzLmFkZChwaXBlKTtcbiAgfVxuXG4gIG92ZXJyaWRlUHJvdmlkZXIoXG4gICAgICB0b2tlbjogYW55LFxuICAgICAgcHJvdmlkZXI6IHt1c2VGYWN0b3J5PzogRnVuY3Rpb24sIHVzZVZhbHVlPzogYW55LCBkZXBzPzogYW55W10sIG11bHRpPzogYm9vbGVhbn0pOiB2b2lkIHtcbiAgICBjb25zdCBwcm92aWRlckRlZiA9IHByb3ZpZGVyLnVzZUZhY3RvcnkgP1xuICAgICAgICB7XG4gICAgICAgICAgcHJvdmlkZTogdG9rZW4sXG4gICAgICAgICAgdXNlRmFjdG9yeTogcHJvdmlkZXIudXNlRmFjdG9yeSxcbiAgICAgICAgICBkZXBzOiBwcm92aWRlci5kZXBzIHx8IFtdLFxuICAgICAgICAgIG11bHRpOiBwcm92aWRlci5tdWx0aSxcbiAgICAgICAgfSA6XG4gICAgICAgIHtwcm92aWRlOiB0b2tlbiwgdXNlVmFsdWU6IHByb3ZpZGVyLnVzZVZhbHVlLCBtdWx0aTogcHJvdmlkZXIubXVsdGl9O1xuXG4gICAgbGV0IGluamVjdGFibGVEZWY6IEluamVjdGFibGVEZWY8YW55PnxudWxsO1xuICAgIGNvbnN0IGlzUm9vdCA9XG4gICAgICAgICh0eXBlb2YgdG9rZW4gIT09ICdzdHJpbmcnICYmIChpbmplY3RhYmxlRGVmID0gZ2V0SW5qZWN0YWJsZURlZih0b2tlbikpICYmXG4gICAgICAgICBpbmplY3RhYmxlRGVmLnByb3ZpZGVkSW4gPT09ICdyb290Jyk7XG4gICAgY29uc3Qgb3ZlcnJpZGVzQnVja2V0ID0gaXNSb290ID8gdGhpcy5yb290UHJvdmlkZXJPdmVycmlkZXMgOiB0aGlzLnByb3ZpZGVyT3ZlcnJpZGVzO1xuICAgIG92ZXJyaWRlc0J1Y2tldC5wdXNoKHByb3ZpZGVyRGVmKTtcblxuICAgIC8vIEtlZXAgb3ZlcnJpZGVzIGdyb3VwZWQgYnkgdG9rZW4gYXMgd2VsbCBmb3IgZmFzdCBsb29rdXBzIHVzaW5nIHRva2VuXG4gICAgdGhpcy5wcm92aWRlck92ZXJyaWRlc0J5VG9rZW4uc2V0KHRva2VuLCBwcm92aWRlckRlZik7XG4gIH1cblxuICBvdmVycmlkZVRlbXBsYXRlVXNpbmdUZXN0aW5nTW9kdWxlKHR5cGU6IFR5cGU8YW55PiwgdGVtcGxhdGU6IHN0cmluZyk6IHZvaWQge1xuICAgIGNvbnN0IGRlZiA9ICh0eXBlIGFzIGFueSlbTkdfQ09NUE9ORU5UX0RFRl07XG4gICAgY29uc3QgaGFzU3R5bGVVcmxzID0gKCk6IGJvb2xlYW4gPT4ge1xuICAgICAgY29uc3QgbWV0YWRhdGEgPSB0aGlzLnJlc29sdmVycy5jb21wb25lbnQucmVzb2x2ZSh0eXBlKSAhYXMgQ29tcG9uZW50O1xuICAgICAgcmV0dXJuICEhbWV0YWRhdGEuc3R5bGVVcmxzICYmIG1ldGFkYXRhLnN0eWxlVXJscy5sZW5ndGggPiAwO1xuICAgIH07XG4gICAgY29uc3Qgb3ZlcnJpZGVTdHlsZVVybHMgPSAhIWRlZiAmJiAhaXNDb21wb25lbnREZWZQZW5kaW5nUmVzb2x1dGlvbih0eXBlKSAmJiBoYXNTdHlsZVVybHMoKTtcblxuICAgIC8vIEluIEl2eSwgY29tcGlsaW5nIGEgY29tcG9uZW50IGRvZXMgbm90IHJlcXVpcmUga25vd2luZyB0aGUgbW9kdWxlIHByb3ZpZGluZyB0aGVcbiAgICAvLyBjb21wb25lbnQncyBzY29wZSwgc28gb3ZlcnJpZGVUZW1wbGF0ZVVzaW5nVGVzdGluZ01vZHVsZSBjYW4gYmUgaW1wbGVtZW50ZWQgcHVyZWx5IHZpYVxuICAgIC8vIG92ZXJyaWRlQ29tcG9uZW50LiBJbXBvcnRhbnQ6IG92ZXJyaWRpbmcgdGVtcGxhdGUgcmVxdWlyZXMgZnVsbCBDb21wb25lbnQgcmUtY29tcGlsYXRpb24sXG4gICAgLy8gd2hpY2ggbWF5IGZhaWwgaW4gY2FzZSBzdHlsZVVybHMgYXJlIGFsc28gcHJlc2VudCAodGh1cyBDb21wb25lbnQgaXMgY29uc2lkZXJlZCBhcyByZXF1aXJlZFxuICAgIC8vIHJlc29sdXRpb24pLiBJbiBvcmRlciB0byBhdm9pZCB0aGlzLCB3ZSBwcmVlbXB0aXZlbHkgc2V0IHN0eWxlVXJscyB0byBhbiBlbXB0eSBhcnJheSxcbiAgICAvLyBwcmVzZXJ2ZSBjdXJyZW50IHN0eWxlcyBhdmFpbGFibGUgb24gQ29tcG9uZW50IGRlZiBhbmQgcmVzdG9yZSBzdHlsZXMgYmFjayBvbmNlIGNvbXBpbGF0aW9uXG4gICAgLy8gaXMgY29tcGxldGUuXG4gICAgY29uc3Qgb3ZlcnJpZGUgPSBvdmVycmlkZVN0eWxlVXJscyA/IHt0ZW1wbGF0ZSwgc3R5bGVzOiBbXSwgc3R5bGVVcmxzOiBbXX0gOiB7dGVtcGxhdGV9O1xuICAgIHRoaXMub3ZlcnJpZGVDb21wb25lbnQodHlwZSwge3NldDogb3ZlcnJpZGV9KTtcblxuICAgIGlmIChvdmVycmlkZVN0eWxlVXJscyAmJiBkZWYuc3R5bGVzICYmIGRlZi5zdHlsZXMubGVuZ3RoID4gMCkge1xuICAgICAgdGhpcy5leGlzdGluZ0NvbXBvbmVudFN0eWxlcy5zZXQodHlwZSwgZGVmLnN0eWxlcyk7XG4gICAgfVxuXG4gICAgLy8gU2V0IHRoZSBjb21wb25lbnQncyBzY29wZSB0byBiZSB0aGUgdGVzdGluZyBtb2R1bGUuXG4gICAgdGhpcy5jb21wb25lbnRUb01vZHVsZVNjb3BlLnNldCh0eXBlLCBURVNUSU5HX01PRFVMRSk7XG4gIH1cblxuICBhc3luYyBjb21waWxlQ29tcG9uZW50cygpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0aGlzLmNsZWFyQ29tcG9uZW50UmVzb2x1dGlvblF1ZXVlKCk7XG4gICAgLy8gUnVuIGNvbXBpbGVycyBmb3IgYWxsIHF1ZXVlZCB0eXBlcy5cbiAgICBsZXQgbmVlZHNBc3luY1Jlc291cmNlcyA9IHRoaXMuY29tcGlsZVR5cGVzU3luYygpO1xuXG4gICAgLy8gY29tcGlsZUNvbXBvbmVudHMoKSBzaG91bGQgbm90IGJlIGFzeW5jIHVubGVzcyBpdCBuZWVkcyB0byBiZS5cbiAgICBpZiAobmVlZHNBc3luY1Jlc291cmNlcykge1xuICAgICAgbGV0IHJlc291cmNlTG9hZGVyOiBSZXNvdXJjZUxvYWRlcjtcbiAgICAgIGxldCByZXNvbHZlciA9ICh1cmw6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiA9PiB7XG4gICAgICAgIGlmICghcmVzb3VyY2VMb2FkZXIpIHtcbiAgICAgICAgICByZXNvdXJjZUxvYWRlciA9IHRoaXMuaW5qZWN0b3IuZ2V0KFJlc291cmNlTG9hZGVyKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHJlc291cmNlTG9hZGVyLmdldCh1cmwpKTtcbiAgICAgIH07XG4gICAgICBhd2FpdCByZXNvbHZlQ29tcG9uZW50UmVzb3VyY2VzKHJlc29sdmVyKTtcbiAgICB9XG4gIH1cblxuICBmaW5hbGl6ZSgpOiBOZ01vZHVsZVJlZjxhbnk+IHtcbiAgICAvLyBPbmUgbGFzdCBjb21waWxlXG4gICAgdGhpcy5jb21waWxlVHlwZXNTeW5jKCk7XG5cbiAgICAvLyBDcmVhdGUgdGhlIHRlc3RpbmcgbW9kdWxlIGl0c2VsZi5cbiAgICB0aGlzLmNvbXBpbGVUZXN0TW9kdWxlKCk7XG5cbiAgICB0aGlzLmFwcGx5VHJhbnNpdGl2ZVNjb3BlcygpO1xuXG4gICAgdGhpcy5hcHBseVByb3ZpZGVyT3ZlcnJpZGVzKCk7XG5cbiAgICAvLyBQYXRjaCBwcmV2aW91c2x5IHN0b3JlZCBgc3R5bGVzYCBDb21wb25lbnQgdmFsdWVzICh0YWtlbiBmcm9tIG5nQ29tcG9uZW50RGVmKSwgaW4gY2FzZSB0aGVzZVxuICAgIC8vIENvbXBvbmVudHMgaGF2ZSBgc3R5bGVVcmxzYCBmaWVsZHMgZGVmaW5lZCBhbmQgdGVtcGxhdGUgb3ZlcnJpZGUgd2FzIHJlcXVlc3RlZC5cbiAgICB0aGlzLnBhdGNoQ29tcG9uZW50c1dpdGhFeGlzdGluZ1N0eWxlcygpO1xuXG4gICAgLy8gQ2xlYXIgdGhlIGNvbXBvbmVudFRvTW9kdWxlU2NvcGUgbWFwLCBzbyB0aGF0IGZ1dHVyZSBjb21waWxhdGlvbnMgZG9uJ3QgcmVzZXQgdGhlIHNjb3BlIG9mXG4gICAgLy8gZXZlcnkgY29tcG9uZW50LlxuICAgIHRoaXMuY29tcG9uZW50VG9Nb2R1bGVTY29wZS5jbGVhcigpO1xuXG4gICAgY29uc3QgcGFyZW50SW5qZWN0b3IgPSB0aGlzLnBsYXRmb3JtLmluamVjdG9yO1xuICAgIHRoaXMudGVzdE1vZHVsZVJlZiA9IG5ldyBOZ01vZHVsZVJlZih0aGlzLnRlc3RNb2R1bGVUeXBlLCBwYXJlbnRJbmplY3Rvcik7XG5cblxuICAgIC8vIEFwcGxpY2F0aW9uSW5pdFN0YXR1cy5ydW5Jbml0aWFsaXplcnMoKSBpcyBtYXJrZWQgQGludGVybmFsIHRvIGNvcmUuXG4gICAgLy8gQ2FzdCBpdCB0byBhbnkgYmVmb3JlIGFjY2Vzc2luZyBpdC5cbiAgICAodGhpcy50ZXN0TW9kdWxlUmVmLmluamVjdG9yLmdldChBcHBsaWNhdGlvbkluaXRTdGF0dXMpIGFzIGFueSkucnVuSW5pdGlhbGl6ZXJzKCk7XG5cbiAgICByZXR1cm4gdGhpcy50ZXN0TW9kdWxlUmVmO1xuICB9XG5cbiAgLyoqXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgX2NvbXBpbGVOZ01vZHVsZVN5bmMobW9kdWxlVHlwZTogVHlwZTxhbnk+KTogdm9pZCB7XG4gICAgdGhpcy5xdWV1ZVR5cGVzRnJvbU1vZHVsZXNBcnJheShbbW9kdWxlVHlwZV0pO1xuICAgIHRoaXMuY29tcGlsZVR5cGVzU3luYygpO1xuICAgIHRoaXMuYXBwbHlQcm92aWRlck92ZXJyaWRlcygpO1xuICAgIHRoaXMuYXBwbHlQcm92aWRlck92ZXJyaWRlc1RvTW9kdWxlKG1vZHVsZVR5cGUpO1xuICAgIHRoaXMuYXBwbHlUcmFuc2l0aXZlU2NvcGVzKCk7XG4gIH1cblxuICAvKipcbiAgICogQGludGVybmFsXG4gICAqL1xuICBhc3luYyBfY29tcGlsZU5nTW9kdWxlQXN5bmMobW9kdWxlVHlwZTogVHlwZTxhbnk+KTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdGhpcy5xdWV1ZVR5cGVzRnJvbU1vZHVsZXNBcnJheShbbW9kdWxlVHlwZV0pO1xuICAgIGF3YWl0IHRoaXMuY29tcGlsZUNvbXBvbmVudHMoKTtcbiAgICB0aGlzLmFwcGx5UHJvdmlkZXJPdmVycmlkZXMoKTtcbiAgICB0aGlzLmFwcGx5UHJvdmlkZXJPdmVycmlkZXNUb01vZHVsZShtb2R1bGVUeXBlKTtcbiAgICB0aGlzLmFwcGx5VHJhbnNpdGl2ZVNjb3BlcygpO1xuICB9XG5cbiAgLyoqXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgX2dldE1vZHVsZVJlc29sdmVyKCk6IFJlc29sdmVyPE5nTW9kdWxlPiB7IHJldHVybiB0aGlzLnJlc29sdmVycy5tb2R1bGU7IH1cblxuICAvKipcbiAgICogQGludGVybmFsXG4gICAqL1xuICBfZ2V0Q29tcG9uZW50RmFjdG9yaWVzKG1vZHVsZVR5cGU6IE5nTW9kdWxlVHlwZSk6IENvbXBvbmVudEZhY3Rvcnk8YW55PltdIHtcbiAgICByZXR1cm4gbWF5YmVVbndyYXBGbihtb2R1bGVUeXBlLm5nTW9kdWxlRGVmLmRlY2xhcmF0aW9ucykucmVkdWNlKChmYWN0b3JpZXMsIGRlY2xhcmF0aW9uKSA9PiB7XG4gICAgICBjb25zdCBjb21wb25lbnREZWYgPSAoZGVjbGFyYXRpb24gYXMgYW55KS5uZ0NvbXBvbmVudERlZjtcbiAgICAgIGNvbXBvbmVudERlZiAmJiBmYWN0b3JpZXMucHVzaChuZXcgQ29tcG9uZW50RmFjdG9yeShjb21wb25lbnREZWYsIHRoaXMudGVzdE1vZHVsZVJlZiAhKSk7XG4gICAgICByZXR1cm4gZmFjdG9yaWVzO1xuICAgIH0sIFtdIGFzIENvbXBvbmVudEZhY3Rvcnk8YW55PltdKTtcbiAgfVxuXG4gIHByaXZhdGUgY29tcGlsZVR5cGVzU3luYygpOiBib29sZWFuIHtcbiAgICAvLyBDb21waWxlIGFsbCBxdWV1ZWQgY29tcG9uZW50cywgZGlyZWN0aXZlcywgcGlwZXMuXG4gICAgbGV0IG5lZWRzQXN5bmNSZXNvdXJjZXMgPSBmYWxzZTtcbiAgICB0aGlzLnBlbmRpbmdDb21wb25lbnRzLmZvckVhY2goZGVjbGFyYXRpb24gPT4ge1xuICAgICAgbmVlZHNBc3luY1Jlc291cmNlcyA9IG5lZWRzQXN5bmNSZXNvdXJjZXMgfHwgaXNDb21wb25lbnREZWZQZW5kaW5nUmVzb2x1dGlvbihkZWNsYXJhdGlvbik7XG4gICAgICBjb25zdCBtZXRhZGF0YSA9IHRoaXMucmVzb2x2ZXJzLmNvbXBvbmVudC5yZXNvbHZlKGRlY2xhcmF0aW9uKSAhO1xuICAgICAgdGhpcy5tYXliZVN0b3JlTmdEZWYoTkdfQ09NUE9ORU5UX0RFRiwgZGVjbGFyYXRpb24pO1xuICAgICAgY29tcGlsZUNvbXBvbmVudChkZWNsYXJhdGlvbiwgbWV0YWRhdGEpO1xuICAgIH0pO1xuICAgIHRoaXMucGVuZGluZ0NvbXBvbmVudHMuY2xlYXIoKTtcblxuICAgIHRoaXMucGVuZGluZ0RpcmVjdGl2ZXMuZm9yRWFjaChkZWNsYXJhdGlvbiA9PiB7XG4gICAgICBjb25zdCBtZXRhZGF0YSA9IHRoaXMucmVzb2x2ZXJzLmRpcmVjdGl2ZS5yZXNvbHZlKGRlY2xhcmF0aW9uKSAhO1xuICAgICAgdGhpcy5tYXliZVN0b3JlTmdEZWYoTkdfRElSRUNUSVZFX0RFRiwgZGVjbGFyYXRpb24pO1xuICAgICAgY29tcGlsZURpcmVjdGl2ZShkZWNsYXJhdGlvbiwgbWV0YWRhdGEpO1xuICAgIH0pO1xuICAgIHRoaXMucGVuZGluZ0RpcmVjdGl2ZXMuY2xlYXIoKTtcblxuICAgIHRoaXMucGVuZGluZ1BpcGVzLmZvckVhY2goZGVjbGFyYXRpb24gPT4ge1xuICAgICAgY29uc3QgbWV0YWRhdGEgPSB0aGlzLnJlc29sdmVycy5waXBlLnJlc29sdmUoZGVjbGFyYXRpb24pICE7XG4gICAgICB0aGlzLm1heWJlU3RvcmVOZ0RlZihOR19QSVBFX0RFRiwgZGVjbGFyYXRpb24pO1xuICAgICAgY29tcGlsZVBpcGUoZGVjbGFyYXRpb24sIG1ldGFkYXRhKTtcbiAgICB9KTtcbiAgICB0aGlzLnBlbmRpbmdQaXBlcy5jbGVhcigpO1xuXG4gICAgcmV0dXJuIG5lZWRzQXN5bmNSZXNvdXJjZXM7XG4gIH1cblxuICBwcml2YXRlIGFwcGx5VHJhbnNpdGl2ZVNjb3BlcygpOiB2b2lkIHtcbiAgICBjb25zdCBtb2R1bGVUb1Njb3BlID0gbmV3IE1hcDxUeXBlPGFueT58VEVTVElOR19NT0RVTEUsIE5nTW9kdWxlVHJhbnNpdGl2ZVNjb3Blcz4oKTtcbiAgICBjb25zdCBnZXRTY29wZU9mTW9kdWxlID0gKG1vZHVsZVR5cGU6IFR5cGU8YW55PnwgVEVTVElOR19NT0RVTEUpOiBOZ01vZHVsZVRyYW5zaXRpdmVTY29wZXMgPT4ge1xuICAgICAgaWYgKCFtb2R1bGVUb1Njb3BlLmhhcyhtb2R1bGVUeXBlKSkge1xuICAgICAgICBjb25zdCByZWFsVHlwZSA9IG1vZHVsZVR5cGUgPT09IFRFU1RJTkdfTU9EVUxFID8gdGhpcy50ZXN0TW9kdWxlVHlwZSA6IG1vZHVsZVR5cGU7XG4gICAgICAgIG1vZHVsZVRvU2NvcGUuc2V0KG1vZHVsZVR5cGUsIHRyYW5zaXRpdmVTY29wZXNGb3IocmVhbFR5cGUpKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBtb2R1bGVUb1Njb3BlLmdldChtb2R1bGVUeXBlKSAhO1xuICAgIH07XG5cbiAgICB0aGlzLmNvbXBvbmVudFRvTW9kdWxlU2NvcGUuZm9yRWFjaCgobW9kdWxlVHlwZSwgY29tcG9uZW50VHlwZSkgPT4ge1xuICAgICAgY29uc3QgbW9kdWxlU2NvcGUgPSBnZXRTY29wZU9mTW9kdWxlKG1vZHVsZVR5cGUpO1xuICAgICAgdGhpcy5zdG9yZUZpZWxkT2ZEZWZPblR5cGUoY29tcG9uZW50VHlwZSwgTkdfQ09NUE9ORU5UX0RFRiwgJ2RpcmVjdGl2ZURlZnMnKTtcbiAgICAgIHRoaXMuc3RvcmVGaWVsZE9mRGVmT25UeXBlKGNvbXBvbmVudFR5cGUsIE5HX0NPTVBPTkVOVF9ERUYsICdwaXBlRGVmcycpO1xuICAgICAgcGF0Y2hDb21wb25lbnREZWZXaXRoU2NvcGUoKGNvbXBvbmVudFR5cGUgYXMgYW55KS5uZ0NvbXBvbmVudERlZiwgbW9kdWxlU2NvcGUpO1xuICAgIH0pO1xuXG4gICAgdGhpcy5jb21wb25lbnRUb01vZHVsZVNjb3BlLmNsZWFyKCk7XG4gIH1cblxuICBwcml2YXRlIGFwcGx5UHJvdmlkZXJPdmVycmlkZXMoKTogdm9pZCB7XG4gICAgY29uc3QgbWF5YmVBcHBseU92ZXJyaWRlcyA9IChmaWVsZDogc3RyaW5nKSA9PiAodHlwZTogVHlwZTxhbnk+KSA9PiB7XG4gICAgICBjb25zdCByZXNvbHZlciA9XG4gICAgICAgICAgZmllbGQgPT09IE5HX0NPTVBPTkVOVF9ERUYgPyB0aGlzLnJlc29sdmVycy5jb21wb25lbnQgOiB0aGlzLnJlc29sdmVycy5kaXJlY3RpdmU7XG4gICAgICBjb25zdCBtZXRhZGF0YSA9IHJlc29sdmVyLnJlc29sdmUodHlwZSkgITtcbiAgICAgIGlmICh0aGlzLmhhc1Byb3ZpZGVyT3ZlcnJpZGVzKG1ldGFkYXRhLnByb3ZpZGVycykpIHtcbiAgICAgICAgdGhpcy5wYXRjaERlZldpdGhQcm92aWRlck92ZXJyaWRlcyh0eXBlLCBmaWVsZCk7XG4gICAgICB9XG4gICAgfTtcbiAgICB0aGlzLnNlZW5Db21wb25lbnRzLmZvckVhY2gobWF5YmVBcHBseU92ZXJyaWRlcyhOR19DT01QT05FTlRfREVGKSk7XG4gICAgdGhpcy5zZWVuRGlyZWN0aXZlcy5mb3JFYWNoKG1heWJlQXBwbHlPdmVycmlkZXMoTkdfRElSRUNUSVZFX0RFRikpO1xuXG4gICAgdGhpcy5zZWVuQ29tcG9uZW50cy5jbGVhcigpO1xuICAgIHRoaXMuc2VlbkRpcmVjdGl2ZXMuY2xlYXIoKTtcbiAgfVxuXG4gIHByaXZhdGUgYXBwbHlQcm92aWRlck92ZXJyaWRlc1RvTW9kdWxlKG1vZHVsZVR5cGU6IFR5cGU8YW55Pik6IHZvaWQge1xuICAgIGlmICh0aGlzLm1vZHVsZVByb3ZpZGVyc092ZXJyaWRkZW4uaGFzKG1vZHVsZVR5cGUpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRoaXMubW9kdWxlUHJvdmlkZXJzT3ZlcnJpZGRlbi5hZGQobW9kdWxlVHlwZSk7XG5cbiAgICBjb25zdCBpbmplY3RvckRlZjogYW55ID0gKG1vZHVsZVR5cGUgYXMgYW55KVtOR19JTkpFQ1RPUl9ERUZdO1xuICAgIGlmICh0aGlzLnByb3ZpZGVyT3ZlcnJpZGVzQnlUb2tlbi5zaXplID4gMCkge1xuICAgICAgaWYgKHRoaXMuaGFzUHJvdmlkZXJPdmVycmlkZXMoaW5qZWN0b3JEZWYucHJvdmlkZXJzKSkge1xuICAgICAgICB0aGlzLm1heWJlU3RvcmVOZ0RlZihOR19JTkpFQ1RPUl9ERUYsIG1vZHVsZVR5cGUpO1xuXG4gICAgICAgIHRoaXMuc3RvcmVGaWVsZE9mRGVmT25UeXBlKG1vZHVsZVR5cGUsIE5HX0lOSkVDVE9SX0RFRiwgJ3Byb3ZpZGVycycpO1xuICAgICAgICBpbmplY3RvckRlZi5wcm92aWRlcnMgPSB0aGlzLmdldE92ZXJyaWRkZW5Qcm92aWRlcnMoaW5qZWN0b3JEZWYucHJvdmlkZXJzKTtcbiAgICAgIH1cblxuICAgICAgLy8gQXBwbHkgcHJvdmlkZXIgb3ZlcnJpZGVzIHRvIGltcG9ydGVkIG1vZHVsZXMgcmVjdXJzaXZlbHlcbiAgICAgIGNvbnN0IG1vZHVsZURlZjogYW55ID0gKG1vZHVsZVR5cGUgYXMgYW55KVtOR19NT0RVTEVfREVGXTtcbiAgICAgIGZvciAoY29uc3QgaW1wb3J0VHlwZSBvZiBtb2R1bGVEZWYuaW1wb3J0cykge1xuICAgICAgICB0aGlzLmFwcGx5UHJvdmlkZXJPdmVycmlkZXNUb01vZHVsZShpbXBvcnRUeXBlKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBwcml2YXRlIHBhdGNoQ29tcG9uZW50c1dpdGhFeGlzdGluZ1N0eWxlcygpOiB2b2lkIHtcbiAgICB0aGlzLmV4aXN0aW5nQ29tcG9uZW50U3R5bGVzLmZvckVhY2goXG4gICAgICAgIChzdHlsZXMsIHR5cGUpID0+ICh0eXBlIGFzIGFueSlbTkdfQ09NUE9ORU5UX0RFRl0uc3R5bGVzID0gc3R5bGVzKTtcbiAgICB0aGlzLmV4aXN0aW5nQ29tcG9uZW50U3R5bGVzLmNsZWFyKCk7XG4gIH1cblxuICBwcml2YXRlIHF1ZXVlVHlwZUFycmF5KGFycjogYW55W10sIG1vZHVsZVR5cGU6IFR5cGU8YW55PnxURVNUSU5HX01PRFVMRSk6IHZvaWQge1xuICAgIGZvciAoY29uc3QgdmFsdWUgb2YgYXJyKSB7XG4gICAgICBpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHtcbiAgICAgICAgdGhpcy5xdWV1ZVR5cGVBcnJheSh2YWx1ZSwgbW9kdWxlVHlwZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLnF1ZXVlVHlwZSh2YWx1ZSwgbW9kdWxlVHlwZSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSByZWNvbXBpbGVOZ01vZHVsZShuZ01vZHVsZTogVHlwZTxhbnk+KTogdm9pZCB7XG4gICAgY29uc3QgbWV0YWRhdGEgPSB0aGlzLnJlc29sdmVycy5tb2R1bGUucmVzb2x2ZShuZ01vZHVsZSk7XG4gICAgaWYgKG1ldGFkYXRhID09PSBudWxsKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYFVuYWJsZSB0byByZXNvbHZlIG1ldGFkYXRhIGZvciBOZ01vZHVsZTogJHtuZ01vZHVsZS5uYW1lfWApO1xuICAgIH1cbiAgICAvLyBDYWNoZSB0aGUgaW5pdGlhbCBuZ01vZHVsZURlZiBhcyBpdCB3aWxsIGJlIG92ZXJ3cml0dGVuLlxuICAgIHRoaXMubWF5YmVTdG9yZU5nRGVmKE5HX01PRFVMRV9ERUYsIG5nTW9kdWxlKTtcbiAgICB0aGlzLm1heWJlU3RvcmVOZ0RlZihOR19JTkpFQ1RPUl9ERUYsIG5nTW9kdWxlKTtcblxuICAgIGNvbXBpbGVOZ01vZHVsZURlZnMobmdNb2R1bGUgYXMgTmdNb2R1bGVUeXBlPGFueT4sIG1ldGFkYXRhKTtcbiAgfVxuXG4gIHByaXZhdGUgcXVldWVUeXBlKHR5cGU6IFR5cGU8YW55PiwgbW9kdWxlVHlwZTogVHlwZTxhbnk+fFRFU1RJTkdfTU9EVUxFKTogdm9pZCB7XG4gICAgY29uc3QgY29tcG9uZW50ID0gdGhpcy5yZXNvbHZlcnMuY29tcG9uZW50LnJlc29sdmUodHlwZSk7XG4gICAgaWYgKGNvbXBvbmVudCkge1xuICAgICAgLy8gQ2hlY2sgd2hldGhlciBhIGdpdmUgVHlwZSBoYXMgcmVzcGVjdGl2ZSBORyBkZWYgKG5nQ29tcG9uZW50RGVmKSBhbmQgY29tcGlsZSBpZiBkZWYgaXNcbiAgICAgIC8vIG1pc3NpbmcuIFRoYXQgbWlnaHQgaGFwcGVuIGluIGNhc2UgYSBjbGFzcyB3aXRob3V0IGFueSBBbmd1bGFyIGRlY29yYXRvcnMgZXh0ZW5kcyBhbm90aGVyXG4gICAgICAvLyBjbGFzcyB3aGVyZSBDb21wb25lbnQvRGlyZWN0aXZlL1BpcGUgZGVjb3JhdG9yIGlzIGRlZmluZWQuXG4gICAgICBpZiAoaXNDb21wb25lbnREZWZQZW5kaW5nUmVzb2x1dGlvbih0eXBlKSB8fCAhdHlwZS5oYXNPd25Qcm9wZXJ0eShOR19DT01QT05FTlRfREVGKSkge1xuICAgICAgICB0aGlzLnBlbmRpbmdDb21wb25lbnRzLmFkZCh0eXBlKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuc2VlbkNvbXBvbmVudHMuYWRkKHR5cGUpO1xuXG4gICAgICAvLyBLZWVwIHRyYWNrIG9mIHRoZSBtb2R1bGUgd2hpY2ggZGVjbGFyZXMgdGhpcyBjb21wb25lbnQsIHNvIGxhdGVyIHRoZSBjb21wb25lbnQncyBzY29wZVxuICAgICAgLy8gY2FuIGJlIHNldCBjb3JyZWN0bHkuIE9ubHkgcmVjb3JkIHRoaXMgdGhlIGZpcnN0IHRpbWUsIGJlY2F1c2UgaXQgbWlnaHQgYmUgb3ZlcnJpZGRlbiBieVxuICAgICAgLy8gb3ZlcnJpZGVUZW1wbGF0ZVVzaW5nVGVzdGluZ01vZHVsZS5cbiAgICAgIGlmICghdGhpcy5jb21wb25lbnRUb01vZHVsZVNjb3BlLmhhcyh0eXBlKSkge1xuICAgICAgICB0aGlzLmNvbXBvbmVudFRvTW9kdWxlU2NvcGUuc2V0KHR5cGUsIG1vZHVsZVR5cGUpO1xuICAgICAgfVxuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGRpcmVjdGl2ZSA9IHRoaXMucmVzb2x2ZXJzLmRpcmVjdGl2ZS5yZXNvbHZlKHR5cGUpO1xuICAgIGlmIChkaXJlY3RpdmUpIHtcbiAgICAgIGlmICghdHlwZS5oYXNPd25Qcm9wZXJ0eShOR19ESVJFQ1RJVkVfREVGKSkge1xuICAgICAgICB0aGlzLnBlbmRpbmdEaXJlY3RpdmVzLmFkZCh0eXBlKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuc2VlbkRpcmVjdGl2ZXMuYWRkKHR5cGUpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHBpcGUgPSB0aGlzLnJlc29sdmVycy5waXBlLnJlc29sdmUodHlwZSk7XG4gICAgaWYgKHBpcGUgJiYgIXR5cGUuaGFzT3duUHJvcGVydHkoTkdfUElQRV9ERUYpKSB7XG4gICAgICB0aGlzLnBlbmRpbmdQaXBlcy5hZGQodHlwZSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBxdWV1ZVR5cGVzRnJvbU1vZHVsZXNBcnJheShhcnI6IGFueVtdKTogdm9pZCB7XG4gICAgZm9yIChjb25zdCB2YWx1ZSBvZiBhcnIpIHtcbiAgICAgIGlmIChBcnJheS5pc0FycmF5KHZhbHVlKSkge1xuICAgICAgICB0aGlzLnF1ZXVlVHlwZXNGcm9tTW9kdWxlc0FycmF5KHZhbHVlKTtcbiAgICAgIH0gZWxzZSBpZiAoaGFzTmdNb2R1bGVEZWYodmFsdWUpKSB7XG4gICAgICAgIGNvbnN0IGRlZiA9IHZhbHVlLm5nTW9kdWxlRGVmO1xuICAgICAgICAvLyBMb29rIHRocm91Z2ggZGVjbGFyYXRpb25zLCBpbXBvcnRzLCBhbmQgZXhwb3J0cywgYW5kIHF1ZXVlIGV2ZXJ5dGhpbmcgZm91bmQgdGhlcmUuXG4gICAgICAgIHRoaXMucXVldWVUeXBlQXJyYXkobWF5YmVVbndyYXBGbihkZWYuZGVjbGFyYXRpb25zKSwgdmFsdWUpO1xuICAgICAgICB0aGlzLnF1ZXVlVHlwZXNGcm9tTW9kdWxlc0FycmF5KG1heWJlVW53cmFwRm4oZGVmLmltcG9ydHMpKTtcbiAgICAgICAgdGhpcy5xdWV1ZVR5cGVzRnJvbU1vZHVsZXNBcnJheShtYXliZVVud3JhcEZuKGRlZi5leHBvcnRzKSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBtYXliZVN0b3JlTmdEZWYocHJvcDogc3RyaW5nLCB0eXBlOiBUeXBlPGFueT4pIHtcbiAgICBpZiAoIXRoaXMuaW5pdGlhbE5nRGVmcy5oYXModHlwZSkpIHtcbiAgICAgIGNvbnN0IGN1cnJlbnREZWYgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHR5cGUsIHByb3ApO1xuICAgICAgdGhpcy5pbml0aWFsTmdEZWZzLnNldCh0eXBlLCBbcHJvcCwgY3VycmVudERlZl0pO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgc3RvcmVGaWVsZE9mRGVmT25UeXBlKHR5cGU6IFR5cGU8YW55PiwgZGVmRmllbGQ6IHN0cmluZywgZmllbGQ6IHN0cmluZyk6IHZvaWQge1xuICAgIGNvbnN0IGRlZjogYW55ID0gKHR5cGUgYXMgYW55KVtkZWZGaWVsZF07XG4gICAgY29uc3Qgb3JpZ2luYWw6IGFueSA9IGRlZltmaWVsZF07XG4gICAgdGhpcy5kZWZDbGVhbnVwT3BzLnB1c2goe2ZpZWxkLCBkZWYsIG9yaWdpbmFsfSk7XG4gIH1cblxuICAvKipcbiAgICogQ2xlYXJzIGN1cnJlbnQgY29tcG9uZW50cyByZXNvbHV0aW9uIHF1ZXVlLCBidXQgc3RvcmVzIHRoZSBzdGF0ZSBvZiB0aGUgcXVldWUsIHNvIHdlIGNhblxuICAgKiByZXN0b3JlIGl0IGxhdGVyLiBDbGVhcmluZyB0aGUgcXVldWUgaXMgcmVxdWlyZWQgYmVmb3JlIHdlIHRyeSB0byBjb21waWxlIGNvbXBvbmVudHMgKHZpYVxuICAgKiBgVGVzdEJlZC5jb21waWxlQ29tcG9uZW50c2ApLCBzbyB0aGF0IGNvbXBvbmVudCBkZWZzIGFyZSBpbiBzeW5jIHdpdGggdGhlIHJlc29sdXRpb24gcXVldWUuXG4gICAqL1xuICBwcml2YXRlIGNsZWFyQ29tcG9uZW50UmVzb2x1dGlvblF1ZXVlKCkge1xuICAgIGlmICh0aGlzLm9yaWdpbmFsQ29tcG9uZW50UmVzb2x1dGlvblF1ZXVlID09PSBudWxsKSB7XG4gICAgICB0aGlzLm9yaWdpbmFsQ29tcG9uZW50UmVzb2x1dGlvblF1ZXVlID0gbmV3IE1hcCgpO1xuICAgIH1cbiAgICBjbGVhclJlc29sdXRpb25PZkNvbXBvbmVudFJlc291cmNlc1F1ZXVlKCkuZm9yRWFjaChcbiAgICAgICAgKHZhbHVlLCBrZXkpID0+IHRoaXMub3JpZ2luYWxDb21wb25lbnRSZXNvbHV0aW9uUXVldWUgIS5zZXQoa2V5LCB2YWx1ZSkpO1xuICB9XG5cbiAgLypcbiAgICogUmVzdG9yZXMgY29tcG9uZW50IHJlc29sdXRpb24gcXVldWUgdG8gdGhlIHByZXZpb3VzbHkgc2F2ZWQgc3RhdGUuIFRoaXMgb3BlcmF0aW9uIGlzIHBlcmZvcm1lZFxuICAgKiBhcyBhIHBhcnQgb2YgcmVzdG9yaW5nIHRoZSBzdGF0ZSBhZnRlciBjb21wbGV0aW9uIG9mIHRoZSBjdXJyZW50IHNldCBvZiB0ZXN0cyAodGhhdCBtaWdodFxuICAgKiBwb3RlbnRpYWxseSBtdXRhdGUgdGhlIHN0YXRlKS5cbiAgICovXG4gIHByaXZhdGUgcmVzdG9yZUNvbXBvbmVudFJlc29sdXRpb25RdWV1ZSgpIHtcbiAgICBpZiAodGhpcy5vcmlnaW5hbENvbXBvbmVudFJlc29sdXRpb25RdWV1ZSAhPT0gbnVsbCkge1xuICAgICAgcmVzdG9yZUNvbXBvbmVudFJlc29sdXRpb25RdWV1ZSh0aGlzLm9yaWdpbmFsQ29tcG9uZW50UmVzb2x1dGlvblF1ZXVlKTtcbiAgICAgIHRoaXMub3JpZ2luYWxDb21wb25lbnRSZXNvbHV0aW9uUXVldWUgPSBudWxsO1xuICAgIH1cbiAgfVxuXG4gIHJlc3RvcmVPcmlnaW5hbFN0YXRlKCk6IHZvaWQge1xuICAgIGZvciAoY29uc3Qgb3Agb2YgdGhpcy5kZWZDbGVhbnVwT3BzKSB7XG4gICAgICBvcC5kZWZbb3AuZmllbGRdID0gb3Aub3JpZ2luYWw7XG4gICAgfVxuICAgIC8vIFJlc3RvcmUgaW5pdGlhbCBjb21wb25lbnQvZGlyZWN0aXZlL3BpcGUgZGVmc1xuICAgIHRoaXMuaW5pdGlhbE5nRGVmcy5mb3JFYWNoKCh2YWx1ZTogW3N0cmluZywgUHJvcGVydHlEZXNjcmlwdG9yXSwgdHlwZTogVHlwZTxhbnk+KSA9PiB7XG4gICAgICBjb25zdCBbcHJvcCwgZGVzY3JpcHRvcl0gPSB2YWx1ZTtcbiAgICAgIGlmICghZGVzY3JpcHRvcikge1xuICAgICAgICAvLyBEZWxldGUgb3BlcmF0aW9ucyBhcmUgZ2VuZXJhbGx5IHVuZGVzaXJhYmxlIHNpbmNlIHRoZXkgaGF2ZSBwZXJmb3JtYW5jZSBpbXBsaWNhdGlvbnNcbiAgICAgICAgLy8gb24gb2JqZWN0cyB0aGV5IHdlcmUgYXBwbGllZCB0by4gSW4gdGhpcyBwYXJ0aWN1bGFyIGNhc2UsIHNpdHVhdGlvbnMgd2hlcmUgdGhpcyBjb2RlIGlzXG4gICAgICAgIC8vIGludm9rZWQgc2hvdWxkIGJlIHF1aXRlIHJhcmUgdG8gY2F1c2UgYW55IG5vdGljYWJsZSBpbXBhY3QsIHNpbmNlIGl0J3MgYXBwbGllZCBvbmx5IHRvXG4gICAgICAgIC8vIHNvbWUgdGVzdCBjYXNlcyAoZm9yIGV4YW1wbGUgd2hlbiBjbGFzcyB3aXRoIG5vIGFubm90YXRpb25zIGV4dGVuZHMgc29tZSBAQ29tcG9uZW50KVxuICAgICAgICAvLyB3aGVuIHdlIG5lZWQgdG8gY2xlYXIgJ25nQ29tcG9uZW50RGVmJyBmaWVsZCBvbiBhIGdpdmVuIGNsYXNzIHRvIHJlc3RvcmUgaXRzIG9yaWdpbmFsXG4gICAgICAgIC8vIHN0YXRlIChiZWZvcmUgYXBwbHlpbmcgb3ZlcnJpZGVzIGFuZCBydW5uaW5nIHRlc3RzKS5cbiAgICAgICAgZGVsZXRlICh0eXBlIGFzIGFueSlbcHJvcF07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodHlwZSwgcHJvcCwgZGVzY3JpcHRvcik7XG4gICAgICB9XG4gICAgfSk7XG4gICAgdGhpcy5pbml0aWFsTmdEZWZzLmNsZWFyKCk7XG4gICAgdGhpcy5tb2R1bGVQcm92aWRlcnNPdmVycmlkZGVuLmNsZWFyKCk7XG4gICAgdGhpcy5yZXN0b3JlQ29tcG9uZW50UmVzb2x1dGlvblF1ZXVlKCk7XG4gIH1cblxuICBwcml2YXRlIGNvbXBpbGVUZXN0TW9kdWxlKCk6IHZvaWQge1xuICAgIGNsYXNzIFJvb3RTY29wZU1vZHVsZSB7fVxuICAgIGNvbXBpbGVOZ01vZHVsZURlZnMoUm9vdFNjb3BlTW9kdWxlIGFzIE5nTW9kdWxlVHlwZTxhbnk+LCB7XG4gICAgICBwcm92aWRlcnM6IFsuLi50aGlzLnJvb3RQcm92aWRlck92ZXJyaWRlc10sXG4gICAgfSk7XG5cbiAgICBjb25zdCBuZ1pvbmUgPSBuZXcgTmdab25lKHtlbmFibGVMb25nU3RhY2tUcmFjZTogdHJ1ZX0pO1xuICAgIGNvbnN0IHByb3ZpZGVyczogUHJvdmlkZXJbXSA9IFtcbiAgICAgIHtwcm92aWRlOiBOZ1pvbmUsIHVzZVZhbHVlOiBuZ1pvbmV9LFxuICAgICAge3Byb3ZpZGU6IENvbXBpbGVyLCB1c2VGYWN0b3J5OiAoKSA9PiBuZXcgUjNUZXN0Q29tcGlsZXIodGhpcyl9LFxuICAgICAgLi4udGhpcy5wcm92aWRlcnMsXG4gICAgICAuLi50aGlzLnByb3ZpZGVyT3ZlcnJpZGVzLFxuICAgIF07XG4gICAgY29uc3QgaW1wb3J0cyA9IFtSb290U2NvcGVNb2R1bGUsIHRoaXMuYWRkaXRpb25hbE1vZHVsZVR5cGVzLCB0aGlzLmltcG9ydHMgfHwgW11dO1xuXG4gICAgLy8gY2xhbmctZm9ybWF0IG9mZlxuICAgIGNvbXBpbGVOZ01vZHVsZURlZnModGhpcy50ZXN0TW9kdWxlVHlwZSwge1xuICAgICAgZGVjbGFyYXRpb25zOiB0aGlzLmRlY2xhcmF0aW9ucyxcbiAgICAgIGltcG9ydHMsXG4gICAgICBzY2hlbWFzOiB0aGlzLnNjaGVtYXMsXG4gICAgICBwcm92aWRlcnMsXG4gICAgfSk7XG4gICAgLy8gY2xhbmctZm9ybWF0IG9uXG5cbiAgICB0aGlzLmFwcGx5UHJvdmlkZXJPdmVycmlkZXNUb01vZHVsZSh0aGlzLnRlc3RNb2R1bGVUeXBlKTtcbiAgfVxuXG4gIGdldCBpbmplY3RvcigpOiBJbmplY3RvciB7XG4gICAgaWYgKHRoaXMuX2luamVjdG9yICE9PSBudWxsKSB7XG4gICAgICByZXR1cm4gdGhpcy5faW5qZWN0b3I7XG4gICAgfVxuXG4gICAgY29uc3QgcHJvdmlkZXJzOiBQcm92aWRlcltdID0gW107XG4gICAgY29uc3QgY29tcGlsZXJPcHRpb25zID0gdGhpcy5wbGF0Zm9ybS5pbmplY3Rvci5nZXQoQ09NUElMRVJfT1BUSU9OUyk7XG4gICAgY29tcGlsZXJPcHRpb25zLmZvckVhY2gob3B0cyA9PiB7XG4gICAgICBpZiAob3B0cy5wcm92aWRlcnMpIHtcbiAgICAgICAgcHJvdmlkZXJzLnB1c2gob3B0cy5wcm92aWRlcnMpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIGlmICh0aGlzLmNvbXBpbGVyUHJvdmlkZXJzICE9PSBudWxsKSB7XG4gICAgICBwcm92aWRlcnMucHVzaCguLi50aGlzLmNvbXBpbGVyUHJvdmlkZXJzKTtcbiAgICB9XG5cbiAgICAvLyBUT0RPKG9jb21iZSk6IG1ha2UgdGhpcyB3b3JrIHdpdGggYW4gSW5qZWN0b3IgZGlyZWN0bHkgaW5zdGVhZCBvZiBjcmVhdGluZyBhIG1vZHVsZSBmb3IgaXRcbiAgICBjbGFzcyBDb21waWxlck1vZHVsZSB7fVxuICAgIGNvbXBpbGVOZ01vZHVsZURlZnMoQ29tcGlsZXJNb2R1bGUgYXMgTmdNb2R1bGVUeXBlPGFueT4sIHtwcm92aWRlcnN9KTtcblxuICAgIGNvbnN0IENvbXBpbGVyTW9kdWxlRmFjdG9yeSA9IG5ldyBSM05nTW9kdWxlRmFjdG9yeShDb21waWxlck1vZHVsZSk7XG4gICAgdGhpcy5faW5qZWN0b3IgPSBDb21waWxlck1vZHVsZUZhY3RvcnkuY3JlYXRlKHRoaXMucGxhdGZvcm0uaW5qZWN0b3IpLmluamVjdG9yO1xuICAgIHJldHVybiB0aGlzLl9pbmplY3RvcjtcbiAgfVxuXG4gIC8vIGdldCBvdmVycmlkZXMgZm9yIGEgc3BlY2lmaWMgcHJvdmlkZXIgKGlmIGFueSlcbiAgcHJpdmF0ZSBnZXRTaW5nbGVQcm92aWRlck92ZXJyaWRlcyhwcm92aWRlcjogUHJvdmlkZXIpOiBQcm92aWRlcnxudWxsIHtcbiAgICBjb25zdCB0b2tlbiA9IGdldFByb3ZpZGVyVG9rZW4ocHJvdmlkZXIpO1xuICAgIHJldHVybiB0aGlzLnByb3ZpZGVyT3ZlcnJpZGVzQnlUb2tlbi5nZXQodG9rZW4pIHx8IG51bGw7XG4gIH1cblxuICBwcml2YXRlIGdldFByb3ZpZGVyT3ZlcnJpZGVzKHByb3ZpZGVycz86IFByb3ZpZGVyW10pOiBQcm92aWRlcltdIHtcbiAgICBpZiAoIXByb3ZpZGVycyB8fCAhcHJvdmlkZXJzLmxlbmd0aCB8fCB0aGlzLnByb3ZpZGVyT3ZlcnJpZGVzQnlUb2tlbi5zaXplID09PSAwKSByZXR1cm4gW107XG4gICAgLy8gVGhlcmUgYXJlIHR3byBmbGF0dGVuaW5nIG9wZXJhdGlvbnMgaGVyZS4gVGhlIGlubmVyIGZsYXR0ZW4oKSBvcGVyYXRlcyBvbiB0aGUgbWV0YWRhdGEnc1xuICAgIC8vIHByb3ZpZGVycyBhbmQgYXBwbGllcyBhIG1hcHBpbmcgZnVuY3Rpb24gd2hpY2ggcmV0cmlldmVzIG92ZXJyaWRlcyBmb3IgZWFjaCBpbmNvbWluZ1xuICAgIC8vIHByb3ZpZGVyLiBUaGUgb3V0ZXIgZmxhdHRlbigpIHRoZW4gZmxhdHRlbnMgdGhlIHByb2R1Y2VkIG92ZXJyaWRlcyBhcnJheS4gSWYgdGhpcyBpcyBub3RcbiAgICAvLyBkb25lLCB0aGUgYXJyYXkgY2FuIGNvbnRhaW4gb3RoZXIgZW1wdHkgYXJyYXlzIChlLmcuIGBbW10sIFtdXWApIHdoaWNoIGxlYWsgaW50byB0aGVcbiAgICAvLyBwcm92aWRlcnMgYXJyYXkgYW5kIGNvbnRhbWluYXRlIGFueSBlcnJvciBtZXNzYWdlcyB0aGF0IG1pZ2h0IGJlIGdlbmVyYXRlZC5cbiAgICByZXR1cm4gZmxhdHRlbihmbGF0dGVuKFxuICAgICAgICBwcm92aWRlcnMsIChwcm92aWRlcjogUHJvdmlkZXIpID0+IHRoaXMuZ2V0U2luZ2xlUHJvdmlkZXJPdmVycmlkZXMocHJvdmlkZXIpIHx8IFtdKSk7XG4gIH1cblxuICBwcml2YXRlIGdldE92ZXJyaWRkZW5Qcm92aWRlcnMocHJvdmlkZXJzPzogUHJvdmlkZXJbXSk6IFByb3ZpZGVyW10ge1xuICAgIGlmICghcHJvdmlkZXJzIHx8ICFwcm92aWRlcnMubGVuZ3RoIHx8IHRoaXMucHJvdmlkZXJPdmVycmlkZXNCeVRva2VuLnNpemUgPT09IDApIHJldHVybiBbXTtcblxuICAgIGNvbnN0IG92ZXJyaWRlcyA9IHRoaXMuZ2V0UHJvdmlkZXJPdmVycmlkZXMocHJvdmlkZXJzKTtcbiAgICBjb25zdCBoYXNNdWx0aVByb3ZpZGVyT3ZlcnJpZGVzID0gb3ZlcnJpZGVzLnNvbWUoaXNNdWx0aVByb3ZpZGVyKTtcbiAgICBjb25zdCBvdmVycmlkZGVuUHJvdmlkZXJzID0gWy4uLnByb3ZpZGVycywgLi4ub3ZlcnJpZGVzXTtcblxuICAgIC8vIE5vIGFkZGl0aW9uYWwgcHJvY2Vzc2luZyBpcyByZXF1aXJlZCBpbiBjYXNlIHdlIGhhdmUgbm8gbXVsdGkgcHJvdmlkZXJzIHRvIG92ZXJyaWRlXG4gICAgaWYgKCFoYXNNdWx0aVByb3ZpZGVyT3ZlcnJpZGVzKSB7XG4gICAgICByZXR1cm4gb3ZlcnJpZGRlblByb3ZpZGVycztcbiAgICB9XG5cbiAgICBjb25zdCBmaW5hbDogUHJvdmlkZXJbXSA9IFtdO1xuICAgIGNvbnN0IHNlZW5NdWx0aVByb3ZpZGVycyA9IG5ldyBTZXQ8UHJvdmlkZXI+KCk7XG5cbiAgICAvLyBXZSBpdGVyYXRlIHRocm91Z2ggdGhlIGxpc3Qgb2YgcHJvdmlkZXJzIGluIHJldmVyc2Ugb3JkZXIgdG8gbWFrZSBzdXJlIG11bHRpIHByb3ZpZGVyXG4gICAgLy8gb3ZlcnJpZGVzIHRha2UgcHJlY2VkZW5jZSBvdmVyIHRoZSB2YWx1ZXMgZGVmaW5lZCBpbiBwcm92aWRlciBsaXN0LiBXZSBhbHNvIGZpdGVyIG91dCBhbGxcbiAgICAvLyBtdWx0aSBwcm92aWRlcnMgdGhhdCBoYXZlIG92ZXJyaWRlcywga2VlcGluZyBvdmVycmlkZGVuIHZhbHVlcyBvbmx5LlxuICAgIGZvckVhY2hSaWdodChvdmVycmlkZGVuUHJvdmlkZXJzLCAocHJvdmlkZXI6IGFueSkgPT4ge1xuICAgICAgY29uc3QgdG9rZW46IGFueSA9IGdldFByb3ZpZGVyVG9rZW4ocHJvdmlkZXIpO1xuICAgICAgaWYgKGlzTXVsdGlQcm92aWRlcihwcm92aWRlcikgJiYgdGhpcy5wcm92aWRlck92ZXJyaWRlc0J5VG9rZW4uaGFzKHRva2VuKSkge1xuICAgICAgICBpZiAoIXNlZW5NdWx0aVByb3ZpZGVycy5oYXModG9rZW4pKSB7XG4gICAgICAgICAgc2Vlbk11bHRpUHJvdmlkZXJzLmFkZCh0b2tlbik7XG4gICAgICAgICAgaWYgKHByb3ZpZGVyICYmIHByb3ZpZGVyLnVzZVZhbHVlICYmIEFycmF5LmlzQXJyYXkocHJvdmlkZXIudXNlVmFsdWUpKSB7XG4gICAgICAgICAgICBmb3JFYWNoUmlnaHQocHJvdmlkZXIudXNlVmFsdWUsICh2YWx1ZTogYW55KSA9PiB7XG4gICAgICAgICAgICAgIC8vIFVud3JhcCBwcm92aWRlciBvdmVycmlkZSBhcnJheSBpbnRvIGluZGl2aWR1YWwgcHJvdmlkZXJzIGluIGZpbmFsIHNldC5cbiAgICAgICAgICAgICAgZmluYWwudW5zaGlmdCh7cHJvdmlkZTogdG9rZW4sIHVzZVZhbHVlOiB2YWx1ZSwgbXVsdGk6IHRydWV9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBmaW5hbC51bnNoaWZ0KHByb3ZpZGVyKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGZpbmFsLnVuc2hpZnQocHJvdmlkZXIpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiBmaW5hbDtcbiAgfVxuXG4gIHByaXZhdGUgaGFzUHJvdmlkZXJPdmVycmlkZXMocHJvdmlkZXJzPzogUHJvdmlkZXJbXSk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLmdldFByb3ZpZGVyT3ZlcnJpZGVzKHByb3ZpZGVycykubGVuZ3RoID4gMDtcbiAgfVxuXG4gIHByaXZhdGUgcGF0Y2hEZWZXaXRoUHJvdmlkZXJPdmVycmlkZXMoZGVjbGFyYXRpb246IFR5cGU8YW55PiwgZmllbGQ6IHN0cmluZyk6IHZvaWQge1xuICAgIGNvbnN0IGRlZiA9IChkZWNsYXJhdGlvbiBhcyBhbnkpW2ZpZWxkXTtcbiAgICBpZiAoZGVmICYmIGRlZi5wcm92aWRlcnNSZXNvbHZlcikge1xuICAgICAgdGhpcy5tYXliZVN0b3JlTmdEZWYoZmllbGQsIGRlY2xhcmF0aW9uKTtcblxuICAgICAgY29uc3QgcmVzb2x2ZXIgPSBkZWYucHJvdmlkZXJzUmVzb2x2ZXI7XG4gICAgICBjb25zdCBwcm9jZXNzUHJvdmlkZXJzRm4gPSAocHJvdmlkZXJzOiBQcm92aWRlcltdKSA9PiB0aGlzLmdldE92ZXJyaWRkZW5Qcm92aWRlcnMocHJvdmlkZXJzKTtcbiAgICAgIHRoaXMuc3RvcmVGaWVsZE9mRGVmT25UeXBlKGRlY2xhcmF0aW9uLCBmaWVsZCwgJ3Byb3ZpZGVyc1Jlc29sdmVyJyk7XG4gICAgICBkZWYucHJvdmlkZXJzUmVzb2x2ZXIgPSAobmdEZWY6IERpcmVjdGl2ZURlZjxhbnk+KSA9PiByZXNvbHZlcihuZ0RlZiwgcHJvY2Vzc1Byb3ZpZGVyc0ZuKTtcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gaW5pdFJlc29sdmVycygpOiBSZXNvbHZlcnMge1xuICByZXR1cm4ge1xuICAgIG1vZHVsZTogbmV3IE5nTW9kdWxlUmVzb2x2ZXIoKSxcbiAgICBjb21wb25lbnQ6IG5ldyBDb21wb25lbnRSZXNvbHZlcigpLFxuICAgIGRpcmVjdGl2ZTogbmV3IERpcmVjdGl2ZVJlc29sdmVyKCksXG4gICAgcGlwZTogbmV3IFBpcGVSZXNvbHZlcigpXG4gIH07XG59XG5cbmZ1bmN0aW9uIGhhc05nTW9kdWxlRGVmPFQ+KHZhbHVlOiBUeXBlPFQ+KTogdmFsdWUgaXMgTmdNb2R1bGVUeXBlPFQ+IHtcbiAgcmV0dXJuIHZhbHVlLmhhc093blByb3BlcnR5KCduZ01vZHVsZURlZicpO1xufVxuXG5mdW5jdGlvbiBtYXliZVVud3JhcEZuPFQ+KG1heWJlRm46ICgoKSA9PiBUKSB8IFQpOiBUIHtcbiAgcmV0dXJuIG1heWJlRm4gaW5zdGFuY2VvZiBGdW5jdGlvbiA/IG1heWJlRm4oKSA6IG1heWJlRm47XG59XG5cbmZ1bmN0aW9uIGZsYXR0ZW48VD4odmFsdWVzOiBhbnlbXSwgbWFwRm4/OiAodmFsdWU6IFQpID0+IGFueSk6IFRbXSB7XG4gIGNvbnN0IG91dDogVFtdID0gW107XG4gIHZhbHVlcy5mb3JFYWNoKHZhbHVlID0+IHtcbiAgICBpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHtcbiAgICAgIG91dC5wdXNoKC4uLmZsYXR0ZW48VD4odmFsdWUsIG1hcEZuKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG91dC5wdXNoKG1hcEZuID8gbWFwRm4odmFsdWUpIDogdmFsdWUpO1xuICAgIH1cbiAgfSk7XG4gIHJldHVybiBvdXQ7XG59XG5cbmZ1bmN0aW9uIGdldFByb3ZpZGVyRmllbGQocHJvdmlkZXI6IFByb3ZpZGVyLCBmaWVsZDogc3RyaW5nKSB7XG4gIHJldHVybiBwcm92aWRlciAmJiB0eXBlb2YgcHJvdmlkZXIgPT09ICdvYmplY3QnICYmIChwcm92aWRlciBhcyBhbnkpW2ZpZWxkXTtcbn1cblxuZnVuY3Rpb24gZ2V0UHJvdmlkZXJUb2tlbihwcm92aWRlcjogUHJvdmlkZXIpIHtcbiAgcmV0dXJuIGdldFByb3ZpZGVyRmllbGQocHJvdmlkZXIsICdwcm92aWRlJykgfHwgcHJvdmlkZXI7XG59XG5cbmZ1bmN0aW9uIGlzTXVsdGlQcm92aWRlcihwcm92aWRlcjogUHJvdmlkZXIpIHtcbiAgcmV0dXJuICEhZ2V0UHJvdmlkZXJGaWVsZChwcm92aWRlciwgJ211bHRpJyk7XG59XG5cbmZ1bmN0aW9uIGZvckVhY2hSaWdodDxUPih2YWx1ZXM6IFRbXSwgZm46ICh2YWx1ZTogVCwgaWR4OiBudW1iZXIpID0+IHZvaWQpOiB2b2lkIHtcbiAgZm9yIChsZXQgaWR4ID0gdmFsdWVzLmxlbmd0aCAtIDE7IGlkeCA+PSAwOyBpZHgtLSkge1xuICAgIGZuKHZhbHVlc1tpZHhdLCBpZHgpO1xuICB9XG59XG5cbmNsYXNzIFIzVGVzdENvbXBpbGVyIGltcGxlbWVudHMgQ29tcGlsZXIge1xuICBjb25zdHJ1Y3Rvcihwcml2YXRlIHRlc3RCZWQ6IFIzVGVzdEJlZENvbXBpbGVyKSB7fVxuXG4gIGNvbXBpbGVNb2R1bGVTeW5jPFQ+KG1vZHVsZVR5cGU6IFR5cGU8VD4pOiBOZ01vZHVsZUZhY3Rvcnk8VD4ge1xuICAgIHRoaXMudGVzdEJlZC5fY29tcGlsZU5nTW9kdWxlU3luYyhtb2R1bGVUeXBlKTtcbiAgICByZXR1cm4gbmV3IFIzTmdNb2R1bGVGYWN0b3J5KG1vZHVsZVR5cGUpO1xuICB9XG5cbiAgYXN5bmMgY29tcGlsZU1vZHVsZUFzeW5jPFQ+KG1vZHVsZVR5cGU6IFR5cGU8VD4pOiBQcm9taXNlPE5nTW9kdWxlRmFjdG9yeTxUPj4ge1xuICAgIGF3YWl0IHRoaXMudGVzdEJlZC5fY29tcGlsZU5nTW9kdWxlQXN5bmMobW9kdWxlVHlwZSk7XG4gICAgcmV0dXJuIG5ldyBSM05nTW9kdWxlRmFjdG9yeShtb2R1bGVUeXBlKTtcbiAgfVxuXG4gIGNvbXBpbGVNb2R1bGVBbmRBbGxDb21wb25lbnRzU3luYzxUPihtb2R1bGVUeXBlOiBUeXBlPFQ+KTogTW9kdWxlV2l0aENvbXBvbmVudEZhY3RvcmllczxUPiB7XG4gICAgY29uc3QgbmdNb2R1bGVGYWN0b3J5ID0gdGhpcy5jb21waWxlTW9kdWxlU3luYyhtb2R1bGVUeXBlKTtcbiAgICBjb25zdCBjb21wb25lbnRGYWN0b3JpZXMgPSB0aGlzLnRlc3RCZWQuX2dldENvbXBvbmVudEZhY3Rvcmllcyhtb2R1bGVUeXBlIGFzIE5nTW9kdWxlVHlwZTxUPik7XG4gICAgcmV0dXJuIG5ldyBNb2R1bGVXaXRoQ29tcG9uZW50RmFjdG9yaWVzKG5nTW9kdWxlRmFjdG9yeSwgY29tcG9uZW50RmFjdG9yaWVzKTtcbiAgfVxuXG4gIGFzeW5jIGNvbXBpbGVNb2R1bGVBbmRBbGxDb21wb25lbnRzQXN5bmM8VD4obW9kdWxlVHlwZTogVHlwZTxUPik6XG4gICAgICBQcm9taXNlPE1vZHVsZVdpdGhDb21wb25lbnRGYWN0b3JpZXM8VD4+IHtcbiAgICBjb25zdCBuZ01vZHVsZUZhY3RvcnkgPSBhd2FpdCB0aGlzLmNvbXBpbGVNb2R1bGVBc3luYyhtb2R1bGVUeXBlKTtcbiAgICBjb25zdCBjb21wb25lbnRGYWN0b3JpZXMgPSB0aGlzLnRlc3RCZWQuX2dldENvbXBvbmVudEZhY3Rvcmllcyhtb2R1bGVUeXBlIGFzIE5nTW9kdWxlVHlwZTxUPik7XG4gICAgcmV0dXJuIG5ldyBNb2R1bGVXaXRoQ29tcG9uZW50RmFjdG9yaWVzKG5nTW9kdWxlRmFjdG9yeSwgY29tcG9uZW50RmFjdG9yaWVzKTtcbiAgfVxuXG4gIGNsZWFyQ2FjaGUoKTogdm9pZCB7fVxuXG4gIGNsZWFyQ2FjaGVGb3IodHlwZTogVHlwZTxhbnk+KTogdm9pZCB7fVxuXG4gIGdldE1vZHVsZUlkKG1vZHVsZVR5cGU6IFR5cGU8YW55Pik6IHN0cmluZ3x1bmRlZmluZWQge1xuICAgIGNvbnN0IG1ldGEgPSB0aGlzLnRlc3RCZWQuX2dldE1vZHVsZVJlc29sdmVyKCkucmVzb2x2ZShtb2R1bGVUeXBlKTtcbiAgICByZXR1cm4gbWV0YSAmJiBtZXRhLmlkIHx8IHVuZGVmaW5lZDtcbiAgfVxufVxuIl19