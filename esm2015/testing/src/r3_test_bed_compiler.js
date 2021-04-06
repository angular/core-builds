/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { __awaiter } from "tslib";
import { ResourceLoader } from '@angular/compiler';
import { ApplicationInitStatus, Compiler, COMPILER_OPTIONS, LOCALE_ID, ModuleWithComponentFactories, NgZone, resolveForwardRef, ɵcompileComponent as compileComponent, ɵcompileDirective as compileDirective, ɵcompileNgModuleDefs as compileNgModuleDefs, ɵcompilePipe as compilePipe, ɵDEFAULT_LOCALE_ID as DEFAULT_LOCALE_ID, ɵgetInjectableDef as getInjectableDef, ɵNG_COMP_DEF as NG_COMP_DEF, ɵNG_DIR_DEF as NG_DIR_DEF, ɵNG_INJ_DEF as NG_INJ_DEF, ɵNG_MOD_DEF as NG_MOD_DEF, ɵNG_PIPE_DEF as NG_PIPE_DEF, ɵNgModuleFactory as R3NgModuleFactory, ɵpatchComponentDefWithScope as patchComponentDefWithScope, ɵRender3ComponentFactory as ComponentFactory, ɵRender3NgModuleRef as NgModuleRef, ɵsetLocaleId as setLocaleId, ɵtransitiveScopesFor as transitiveScopesFor } from '@angular/core';
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
export class R3TestBedCompiler {
    constructor(platform, additionalModuleTypes) {
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
        // Keep track of overridden modules, so that we can collect all affected ones in the module tree.
        this.overriddenModules = new Set();
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
        // Overrides for injectables with `{providedIn: SomeModule}` need to be tracked and added to that
        // module's provider list.
        this.providerOverridesByModule = new Map();
        this.providerOverridesByToken = new Map();
        this.moduleProvidersOverridden = new Set();
        this.testModuleRef = null;
        class DynamicTestModule {
        }
        this.testModuleType = DynamicTestModule;
    }
    setCompilerProviders(providers) {
        this.compilerProviders = providers;
        this._injector = null;
    }
    configureTestingModule(moduleDef) {
        // Enqueue any compilation tasks for the directly declared component.
        if (moduleDef.declarations !== undefined) {
            this.queueTypeArray(moduleDef.declarations, TestingModuleOverride.DECLARATION);
            this.declarations.push(...moduleDef.declarations);
        }
        // Enqueue any compilation tasks for imported modules.
        if (moduleDef.imports !== undefined) {
            this.queueTypesFromModulesArray(moduleDef.imports);
            this.imports.push(...moduleDef.imports);
        }
        if (moduleDef.providers !== undefined) {
            this.providers.push(...moduleDef.providers);
        }
        if (moduleDef.schemas !== undefined) {
            this.schemas.push(...moduleDef.schemas);
        }
    }
    overrideModule(ngModule, override) {
        this.overriddenModules.add(ngModule);
        // Compile the module right away.
        this.resolvers.module.addOverride(ngModule, override);
        const metadata = this.resolvers.module.resolve(ngModule);
        if (metadata === null) {
            throw invalidTypeError(ngModule.name, 'NgModule');
        }
        this.recompileNgModule(ngModule, metadata);
        // At this point, the module has a valid module def (ɵmod), but the override may have introduced
        // new declarations or imported modules. Ingest any possible new types and add them to the
        // current queue.
        this.queueTypesFromModulesArray([ngModule]);
    }
    overrideComponent(component, override) {
        this.resolvers.component.addOverride(component, override);
        this.pendingComponents.add(component);
    }
    overrideDirective(directive, override) {
        this.resolvers.directive.addOverride(directive, override);
        this.pendingDirectives.add(directive);
    }
    overridePipe(pipe, override) {
        this.resolvers.pipe.addOverride(pipe, override);
        this.pendingPipes.add(pipe);
    }
    overrideProvider(token, provider) {
        let providerDef;
        if (provider.useFactory !== undefined) {
            providerDef = {
                provide: token,
                useFactory: provider.useFactory,
                deps: provider.deps || [],
                multi: provider.multi
            };
        }
        else if (provider.useValue !== undefined) {
            providerDef = { provide: token, useValue: provider.useValue, multi: provider.multi };
        }
        else {
            providerDef = { provide: token };
        }
        const injectableDef = typeof token !== 'string' ? getInjectableDef(token) : null;
        const providedIn = injectableDef === null ? null : resolveForwardRef(injectableDef.providedIn);
        const overridesBucket = providedIn === 'root' ? this.rootProviderOverrides : this.providerOverrides;
        overridesBucket.push(providerDef);
        // Keep overrides grouped by token as well for fast lookups using token
        this.providerOverridesByToken.set(token, providerDef);
        if (injectableDef !== null && providedIn !== null && typeof providedIn !== 'string') {
            const existingOverrides = this.providerOverridesByModule.get(providedIn);
            if (existingOverrides !== undefined) {
                existingOverrides.push(providerDef);
            }
            else {
                this.providerOverridesByModule.set(providedIn, [providerDef]);
            }
        }
    }
    overrideTemplateUsingTestingModule(type, template) {
        const def = type[NG_COMP_DEF];
        const hasStyleUrls = () => {
            const metadata = this.resolvers.component.resolve(type);
            return !!metadata.styleUrls && metadata.styleUrls.length > 0;
        };
        const overrideStyleUrls = !!def && !isComponentDefPendingResolution(type) && hasStyleUrls();
        // In Ivy, compiling a component does not require knowing the module providing the
        // component's scope, so overrideTemplateUsingTestingModule can be implemented purely via
        // overrideComponent. Important: overriding template requires full Component re-compilation,
        // which may fail in case styleUrls are also present (thus Component is considered as required
        // resolution). In order to avoid this, we preemptively set styleUrls to an empty array,
        // preserve current styles available on Component def and restore styles back once compilation
        // is complete.
        const override = overrideStyleUrls ? { template, styles: [], styleUrls: [] } : { template };
        this.overrideComponent(type, { set: override });
        if (overrideStyleUrls && def.styles && def.styles.length > 0) {
            this.existingComponentStyles.set(type, def.styles);
        }
        // Set the component's scope to be the testing module.
        this.componentToModuleScope.set(type, TestingModuleOverride.OVERRIDE_TEMPLATE);
    }
    compileComponents() {
        return __awaiter(this, void 0, void 0, function* () {
            this.clearComponentResolutionQueue();
            // Run compilers for all queued types.
            let needsAsyncResources = this.compileTypesSync();
            // compileComponents() should not be async unless it needs to be.
            if (needsAsyncResources) {
                let resourceLoader;
                let resolver = (url) => {
                    if (!resourceLoader) {
                        resourceLoader = this.injector.get(ResourceLoader);
                    }
                    return Promise.resolve(resourceLoader.get(url));
                };
                yield resolveComponentResources(resolver);
            }
        });
    }
    finalize() {
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
        const parentInjector = this.platform.injector;
        this.testModuleRef = new NgModuleRef(this.testModuleType, parentInjector);
        // ApplicationInitStatus.runInitializers() is marked @internal to core.
        // Cast it to any before accessing it.
        this.testModuleRef.injector.get(ApplicationInitStatus).runInitializers();
        // Set locale ID after running app initializers, since locale information might be updated while
        // running initializers. This is also consistent with the execution order while bootstrapping an
        // app (see `packages/core/src/application_ref.ts` file).
        const localeId = this.testModuleRef.injector.get(LOCALE_ID, DEFAULT_LOCALE_ID);
        setLocaleId(localeId);
        return this.testModuleRef;
    }
    /**
     * @internal
     */
    _compileNgModuleSync(moduleType) {
        this.queueTypesFromModulesArray([moduleType]);
        this.compileTypesSync();
        this.applyProviderOverrides();
        this.applyProviderOverridesToModule(moduleType);
        this.applyTransitiveScopes();
    }
    /**
     * @internal
     */
    _compileNgModuleAsync(moduleType) {
        return __awaiter(this, void 0, void 0, function* () {
            this.queueTypesFromModulesArray([moduleType]);
            yield this.compileComponents();
            this.applyProviderOverrides();
            this.applyProviderOverridesToModule(moduleType);
            this.applyTransitiveScopes();
        });
    }
    /**
     * @internal
     */
    _getModuleResolver() {
        return this.resolvers.module;
    }
    /**
     * @internal
     */
    _getComponentFactories(moduleType) {
        return maybeUnwrapFn(moduleType.ɵmod.declarations).reduce((factories, declaration) => {
            const componentDef = declaration.ɵcmp;
            componentDef && factories.push(new ComponentFactory(componentDef, this.testModuleRef));
            return factories;
        }, []);
    }
    compileTypesSync() {
        // Compile all queued components, directives, pipes.
        let needsAsyncResources = false;
        this.pendingComponents.forEach(declaration => {
            needsAsyncResources = needsAsyncResources || isComponentDefPendingResolution(declaration);
            const metadata = this.resolvers.component.resolve(declaration);
            if (metadata === null) {
                throw invalidTypeError(declaration.name, 'Component');
            }
            this.maybeStoreNgDef(NG_COMP_DEF, declaration);
            compileComponent(declaration, metadata);
        });
        this.pendingComponents.clear();
        this.pendingDirectives.forEach(declaration => {
            const metadata = this.resolvers.directive.resolve(declaration);
            if (metadata === null) {
                throw invalidTypeError(declaration.name, 'Directive');
            }
            this.maybeStoreNgDef(NG_DIR_DEF, declaration);
            compileDirective(declaration, metadata);
        });
        this.pendingDirectives.clear();
        this.pendingPipes.forEach(declaration => {
            const metadata = this.resolvers.pipe.resolve(declaration);
            if (metadata === null) {
                throw invalidTypeError(declaration.name, 'Pipe');
            }
            this.maybeStoreNgDef(NG_PIPE_DEF, declaration);
            compilePipe(declaration, metadata);
        });
        this.pendingPipes.clear();
        return needsAsyncResources;
    }
    applyTransitiveScopes() {
        if (this.overriddenModules.size > 0) {
            // Module overrides (via `TestBed.overrideModule`) might affect scopes that were previously
            // calculated and stored in `transitiveCompileScopes`. If module overrides are present,
            // collect all affected modules and reset scopes to force their re-calculatation.
            const testingModuleDef = this.testModuleType[NG_MOD_DEF];
            const affectedModules = this.collectModulesAffectedByOverrides(testingModuleDef.imports);
            if (affectedModules.size > 0) {
                affectedModules.forEach(moduleType => {
                    this.storeFieldOfDefOnType(moduleType, NG_MOD_DEF, 'transitiveCompileScopes');
                    moduleType[NG_MOD_DEF].transitiveCompileScopes = null;
                });
            }
        }
        const moduleToScope = new Map();
        const getScopeOfModule = (moduleType) => {
            if (!moduleToScope.has(moduleType)) {
                const isTestingModule = isTestingModuleOverride(moduleType);
                const realType = isTestingModule ? this.testModuleType : moduleType;
                moduleToScope.set(moduleType, transitiveScopesFor(realType));
            }
            return moduleToScope.get(moduleType);
        };
        this.componentToModuleScope.forEach((moduleType, componentType) => {
            const moduleScope = getScopeOfModule(moduleType);
            this.storeFieldOfDefOnType(componentType, NG_COMP_DEF, 'directiveDefs');
            this.storeFieldOfDefOnType(componentType, NG_COMP_DEF, 'pipeDefs');
            // `tView` that is stored on component def contains information about directives and pipes
            // that are in the scope of this component. Patching component scope will cause `tView` to be
            // changed. Store original `tView` before patching scope, so the `tView` (including scope
            // information) is restored back to its previous/original state before running next test.
            this.storeFieldOfDefOnType(componentType, NG_COMP_DEF, 'tView');
            patchComponentDefWithScope(componentType.ɵcmp, moduleScope);
        });
        this.componentToModuleScope.clear();
    }
    applyProviderOverrides() {
        const maybeApplyOverrides = (field) => (type) => {
            const resolver = field === NG_COMP_DEF ? this.resolvers.component : this.resolvers.directive;
            const metadata = resolver.resolve(type);
            if (this.hasProviderOverrides(metadata.providers)) {
                this.patchDefWithProviderOverrides(type, field);
            }
        };
        this.seenComponents.forEach(maybeApplyOverrides(NG_COMP_DEF));
        this.seenDirectives.forEach(maybeApplyOverrides(NG_DIR_DEF));
        this.seenComponents.clear();
        this.seenDirectives.clear();
    }
    applyProviderOverridesToModule(moduleType) {
        if (this.moduleProvidersOverridden.has(moduleType)) {
            return;
        }
        this.moduleProvidersOverridden.add(moduleType);
        const injectorDef = moduleType[NG_INJ_DEF];
        if (this.providerOverridesByToken.size > 0) {
            const providers = [
                ...injectorDef.providers,
                ...(this.providerOverridesByModule.get(moduleType) || [])
            ];
            if (this.hasProviderOverrides(providers)) {
                this.maybeStoreNgDef(NG_INJ_DEF, moduleType);
                this.storeFieldOfDefOnType(moduleType, NG_INJ_DEF, 'providers');
                injectorDef.providers = this.getOverriddenProviders(providers);
            }
            // Apply provider overrides to imported modules recursively
            const moduleDef = moduleType[NG_MOD_DEF];
            const imports = maybeUnwrapFn(moduleDef.imports);
            for (const importedModule of imports) {
                this.applyProviderOverridesToModule(importedModule);
            }
            // Also override the providers on any ModuleWithProviders imports since those don't appear in
            // the moduleDef.
            for (const importedModule of flatten(injectorDef.imports)) {
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
    }
    patchComponentsWithExistingStyles() {
        this.existingComponentStyles.forEach((styles, type) => type[NG_COMP_DEF].styles = styles);
        this.existingComponentStyles.clear();
    }
    queueTypeArray(arr, moduleType) {
        for (const value of arr) {
            if (Array.isArray(value)) {
                this.queueTypeArray(value, moduleType);
            }
            else {
                this.queueType(value, moduleType);
            }
        }
    }
    recompileNgModule(ngModule, metadata) {
        // Cache the initial ngModuleDef as it will be overwritten.
        this.maybeStoreNgDef(NG_MOD_DEF, ngModule);
        this.maybeStoreNgDef(NG_INJ_DEF, ngModule);
        compileNgModuleDefs(ngModule, metadata);
    }
    queueType(type, moduleType) {
        const component = this.resolvers.component.resolve(type);
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
        const directive = this.resolvers.directive.resolve(type);
        if (directive) {
            if (!type.hasOwnProperty(NG_DIR_DEF)) {
                this.pendingDirectives.add(type);
            }
            this.seenDirectives.add(type);
            return;
        }
        const pipe = this.resolvers.pipe.resolve(type);
        if (pipe && !type.hasOwnProperty(NG_PIPE_DEF)) {
            this.pendingPipes.add(type);
            return;
        }
    }
    queueTypesFromModulesArray(arr) {
        // Because we may encounter the same NgModule while processing the imports and exports of an
        // NgModule tree, we cache them in this set so we can skip ones that have already been seen
        // encountered. In some test setups, this caching resulted in 10X runtime improvement.
        const processedNgModuleDefs = new Set();
        const queueTypesFromModulesArrayRecur = (arr) => {
            for (const value of arr) {
                if (Array.isArray(value)) {
                    queueTypesFromModulesArrayRecur(value);
                }
                else if (hasNgModuleDef(value)) {
                    const def = value.ɵmod;
                    if (processedNgModuleDefs.has(def)) {
                        continue;
                    }
                    processedNgModuleDefs.add(def);
                    // Look through declarations, imports, and exports, and queue
                    // everything found there.
                    this.queueTypeArray(maybeUnwrapFn(def.declarations), value);
                    queueTypesFromModulesArrayRecur(maybeUnwrapFn(def.imports));
                    queueTypesFromModulesArrayRecur(maybeUnwrapFn(def.exports));
                }
            }
        };
        queueTypesFromModulesArrayRecur(arr);
    }
    // When module overrides (via `TestBed.overrideModule`) are present, it might affect all modules
    // that import (even transitively) an overridden one. For all affected modules we need to
    // recalculate their scopes for a given test run and restore original scopes at the end. The goal
    // of this function is to collect all affected modules in a set for further processing. Example:
    // if we have the following module hierarchy: A -> B -> C (where `->` means `imports`) and module
    // `C` is overridden, we consider `A` and `B` as affected, since their scopes might become
    // invalidated with the override.
    collectModulesAffectedByOverrides(arr) {
        const seenModules = new Set();
        const affectedModules = new Set();
        const calcAffectedModulesRecur = (arr, path) => {
            for (const value of arr) {
                if (Array.isArray(value)) {
                    // If the value is an array, just flatten it (by invoking this function recursively),
                    // keeping "path" the same.
                    calcAffectedModulesRecur(value, path);
                }
                else if (hasNgModuleDef(value)) {
                    if (seenModules.has(value)) {
                        // If we've seen this module before and it's included into "affected modules" list, mark
                        // the whole path that leads to that module as affected, but do not descend into its
                        // imports, since we already examined them before.
                        if (affectedModules.has(value)) {
                            path.forEach(item => affectedModules.add(item));
                        }
                        continue;
                    }
                    seenModules.add(value);
                    if (this.overriddenModules.has(value)) {
                        path.forEach(item => affectedModules.add(item));
                    }
                    // Examine module imports recursively to look for overridden modules.
                    const moduleDef = value[NG_MOD_DEF];
                    calcAffectedModulesRecur(maybeUnwrapFn(moduleDef.imports), path.concat(value));
                }
            }
        };
        calcAffectedModulesRecur(arr, []);
        return affectedModules;
    }
    maybeStoreNgDef(prop, type) {
        if (!this.initialNgDefs.has(type)) {
            const currentDef = Object.getOwnPropertyDescriptor(type, prop);
            this.initialNgDefs.set(type, [prop, currentDef]);
        }
    }
    storeFieldOfDefOnType(type, defField, fieldName) {
        const def = type[defField];
        const originalValue = def[fieldName];
        this.defCleanupOps.push({ object: def, fieldName, originalValue });
    }
    /**
     * Clears current components resolution queue, but stores the state of the queue, so we can
     * restore it later. Clearing the queue is required before we try to compile components (via
     * `TestBed.compileComponents`), so that component defs are in sync with the resolution queue.
     */
    clearComponentResolutionQueue() {
        if (this.originalComponentResolutionQueue === null) {
            this.originalComponentResolutionQueue = new Map();
        }
        clearResolutionOfComponentResourcesQueue().forEach((value, key) => this.originalComponentResolutionQueue.set(key, value));
    }
    /*
     * Restores component resolution queue to the previously saved state. This operation is performed
     * as a part of restoring the state after completion of the current set of tests (that might
     * potentially mutate the state).
     */
    restoreComponentResolutionQueue() {
        if (this.originalComponentResolutionQueue !== null) {
            restoreComponentResolutionQueue(this.originalComponentResolutionQueue);
            this.originalComponentResolutionQueue = null;
        }
    }
    restoreOriginalState() {
        // Process cleanup ops in reverse order so the field's original value is restored correctly (in
        // case there were multiple overrides for the same field).
        forEachRight(this.defCleanupOps, (op) => {
            op.object[op.fieldName] = op.originalValue;
        });
        // Restore initial component/directive/pipe defs
        this.initialNgDefs.forEach((value, type) => {
            const [prop, descriptor] = value;
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
        // Restore the locale ID to the default value, this shouldn't be necessary but we never know
        setLocaleId(DEFAULT_LOCALE_ID);
    }
    compileTestModule() {
        class RootScopeModule {
        }
        compileNgModuleDefs(RootScopeModule, {
            providers: [...this.rootProviderOverrides],
        });
        const ngZone = new NgZone({ enableLongStackTrace: true });
        const providers = [
            { provide: NgZone, useValue: ngZone },
            { provide: Compiler, useFactory: () => new R3TestCompiler(this) },
            ...this.providers,
            ...this.providerOverrides,
        ];
        const imports = [RootScopeModule, this.additionalModuleTypes, this.imports || []];
        // clang-format off
        compileNgModuleDefs(this.testModuleType, {
            declarations: this.declarations,
            imports,
            schemas: this.schemas,
            providers,
        }, /* allowDuplicateDeclarationsInRoot */ true);
        // clang-format on
        this.applyProviderOverridesToModule(this.testModuleType);
    }
    get injector() {
        if (this._injector !== null) {
            return this._injector;
        }
        const providers = [];
        const compilerOptions = this.platform.injector.get(COMPILER_OPTIONS);
        compilerOptions.forEach(opts => {
            if (opts.providers) {
                providers.push(opts.providers);
            }
        });
        if (this.compilerProviders !== null) {
            providers.push(...this.compilerProviders);
        }
        // TODO(ocombe): make this work with an Injector directly instead of creating a module for it
        class CompilerModule {
        }
        compileNgModuleDefs(CompilerModule, { providers });
        const CompilerModuleFactory = new R3NgModuleFactory(CompilerModule);
        this._injector = CompilerModuleFactory.create(this.platform.injector).injector;
        return this._injector;
    }
    // get overrides for a specific provider (if any)
    getSingleProviderOverrides(provider) {
        const token = getProviderToken(provider);
        return this.providerOverridesByToken.get(token) || null;
    }
    getProviderOverrides(providers) {
        if (!providers || !providers.length || this.providerOverridesByToken.size === 0)
            return [];
        // There are two flattening operations here. The inner flatten() operates on the metadata's
        // providers and applies a mapping function which retrieves overrides for each incoming
        // provider. The outer flatten() then flattens the produced overrides array. If this is not
        // done, the array can contain other empty arrays (e.g. `[[], []]`) which leak into the
        // providers array and contaminate any error messages that might be generated.
        return flatten(flatten(providers, (provider) => this.getSingleProviderOverrides(provider) || []));
    }
    getOverriddenProviders(providers) {
        if (!providers || !providers.length || this.providerOverridesByToken.size === 0)
            return [];
        const flattenedProviders = flatten(providers);
        const overrides = this.getProviderOverrides(flattenedProviders);
        const overriddenProviders = [...flattenedProviders, ...overrides];
        const final = [];
        const seenOverriddenProviders = new Set();
        // We iterate through the list of providers in reverse order to make sure provider overrides
        // take precedence over the values defined in provider list. We also filter out all providers
        // that have overrides, keeping overridden values only. This is needed, since presence of a
        // provider with `ngOnDestroy` hook will cause this hook to be registered and invoked later.
        forEachRight(overriddenProviders, (provider) => {
            const token = getProviderToken(provider);
            if (this.providerOverridesByToken.has(token)) {
                if (!seenOverriddenProviders.has(token)) {
                    seenOverriddenProviders.add(token);
                    // Treat all overridden providers as `{multi: false}` (even if it's a multi-provider) to
                    // make sure that provided override takes highest precedence and is not combined with
                    // other instances of the same multi provider.
                    final.unshift(Object.assign(Object.assign({}, provider), { multi: false }));
                }
            }
            else {
                final.unshift(provider);
            }
        });
        return final;
    }
    hasProviderOverrides(providers) {
        return this.getProviderOverrides(providers).length > 0;
    }
    patchDefWithProviderOverrides(declaration, field) {
        const def = declaration[field];
        if (def && def.providersResolver) {
            this.maybeStoreNgDef(field, declaration);
            const resolver = def.providersResolver;
            const processProvidersFn = (providers) => this.getOverriddenProviders(providers);
            this.storeFieldOfDefOnType(declaration, field, 'providersResolver');
            def.providersResolver = (ngDef) => resolver(ngDef, processProvidersFn);
        }
    }
}
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
    const out = [];
    values.forEach(value => {
        if (Array.isArray(value)) {
            out.push(...flatten(value, mapFn));
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
function isModuleWithProviders(value) {
    return value.hasOwnProperty('ngModule');
}
function forEachRight(values, fn) {
    for (let idx = values.length - 1; idx >= 0; idx--) {
        fn(values[idx], idx);
    }
}
function invalidTypeError(name, expectedType) {
    return new Error(`${name} class doesn't have @${expectedType} decorator or is missing metadata.`);
}
class R3TestCompiler {
    constructor(testBed) {
        this.testBed = testBed;
    }
    compileModuleSync(moduleType) {
        this.testBed._compileNgModuleSync(moduleType);
        return new R3NgModuleFactory(moduleType);
    }
    compileModuleAsync(moduleType) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.testBed._compileNgModuleAsync(moduleType);
            return new R3NgModuleFactory(moduleType);
        });
    }
    compileModuleAndAllComponentsSync(moduleType) {
        const ngModuleFactory = this.compileModuleSync(moduleType);
        const componentFactories = this.testBed._getComponentFactories(moduleType);
        return new ModuleWithComponentFactories(ngModuleFactory, componentFactories);
    }
    compileModuleAndAllComponentsAsync(moduleType) {
        return __awaiter(this, void 0, void 0, function* () {
            const ngModuleFactory = yield this.compileModuleAsync(moduleType);
            const componentFactories = this.testBed._getComponentFactories(moduleType);
            return new ModuleWithComponentFactories(ngModuleFactory, componentFactories);
        });
    }
    clearCache() { }
    clearCacheFor(type) { }
    getModuleId(moduleType) {
        const meta = this.testBed._getModuleResolver().resolve(moduleType);
        return meta && meta.id || undefined;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicjNfdGVzdF9iZWRfY29tcGlsZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3Rlc3Rpbmcvc3JjL3IzX3Rlc3RfYmVkX2NvbXBpbGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7QUFFSCxPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDakQsT0FBTyxFQUFDLHFCQUFxQixFQUFFLFFBQVEsRUFBRSxnQkFBZ0IsRUFBZ0QsU0FBUyxFQUFFLDRCQUE0QixFQUFrRCxNQUFNLEVBQStCLGlCQUFpQixFQUFRLGlCQUFpQixJQUFJLGdCQUFnQixFQUFFLGlCQUFpQixJQUFJLGdCQUFnQixFQUFFLG9CQUFvQixJQUFJLG1CQUFtQixFQUFFLFlBQVksSUFBSSxXQUFXLEVBQUUsa0JBQWtCLElBQUksaUJBQWlCLEVBQWlDLGlCQUFpQixJQUFJLGdCQUFnQixFQUFFLFlBQVksSUFBSSxXQUFXLEVBQUUsV0FBVyxJQUFJLFVBQVUsRUFBRSxXQUFXLElBQUksVUFBVSxFQUFFLFdBQVcsSUFBSSxVQUFVLEVBQUUsWUFBWSxJQUFJLFdBQVcsRUFBRSxnQkFBZ0IsSUFBSSxpQkFBaUIsRUFBd0YsMkJBQTJCLElBQUksMEJBQTBCLEVBQUUsd0JBQXdCLElBQUksZ0JBQWdCLEVBQUUsbUJBQW1CLElBQUksV0FBVyxFQUFFLFlBQVksSUFBSSxXQUFXLEVBQUUsb0JBQW9CLElBQUksbUJBQW1CLEVBQW1DLE1BQU0sZUFBZSxDQUFDO0FBRTdoQyxPQUFPLEVBQUMsd0NBQXdDLEVBQUUsK0JBQStCLEVBQUUseUJBQXlCLEVBQUUsK0JBQStCLEVBQUMsTUFBTSxxQ0FBcUMsQ0FBQztBQUcxTCxPQUFPLEVBQUMsaUJBQWlCLEVBQUUsaUJBQWlCLEVBQUUsZ0JBQWdCLEVBQUUsWUFBWSxFQUFXLE1BQU0sYUFBYSxDQUFDO0FBRzNHLElBQUsscUJBR0o7QUFI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QWtCLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxzQkFBc0IsQ0FBQyxVQUE2QixDQUFDLENBQUM7UUFDOUYsT0FBTyxJQUFJLDRCQUE0QixDQUFDLGVBQWUsRUFBRSxrQkFBa0IsQ0FBQyxDQUFDO0lBQy9FLENBQUM7SUFFSyxrQ0FBa0MsQ0FBSSxVQUFtQjs7WUFFN0QsTUFBTSxlQUFlLEdBQUcsTUFBTSxJQUFJLENBQUMsa0JBQWtCLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDbEUsTUFBTSxrQkFBa0IsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLHNCQUFzQixDQUFDLFVBQTZCLENBQUMsQ0FBQztZQUM5RixPQUFPLElBQUksNEJBQTRCLENBQUMsZUFBZSxFQUFFLGtCQUFrQixDQUFDLENBQUM7UUFDL0UsQ0FBQztLQUFBO0lBRUQsVUFBVSxLQUFVLENBQUM7SUFFckIsYUFBYSxDQUFDLElBQWUsSUFBUyxDQUFDO0lBRXZDLFdBQVcsQ0FBQyxVQUFxQjtRQUMvQixNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLGtCQUFrQixFQUFFLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQ25FLE9BQU8sSUFBSSxJQUFJLElBQUksQ0FBQyxFQUFFLElBQUksU0FBUyxDQUFDO0lBQ3RDLENBQUM7Q0FDRiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1Jlc291cmNlTG9hZGVyfSBmcm9tICdAYW5ndWxhci9jb21waWxlcic7XG5pbXBvcnQge0FwcGxpY2F0aW9uSW5pdFN0YXR1cywgQ29tcGlsZXIsIENPTVBJTEVSX09QVElPTlMsIENvbXBvbmVudCwgRGlyZWN0aXZlLCBJbmplY3RvciwgSW5qZWN0b3JUeXBlLCBMT0NBTEVfSUQsIE1vZHVsZVdpdGhDb21wb25lbnRGYWN0b3JpZXMsIE1vZHVsZVdpdGhQcm92aWRlcnMsIE5nTW9kdWxlLCBOZ01vZHVsZUZhY3RvcnksIE5nWm9uZSwgUGlwZSwgUGxhdGZvcm1SZWYsIFByb3ZpZGVyLCByZXNvbHZlRm9yd2FyZFJlZiwgVHlwZSwgybVjb21waWxlQ29tcG9uZW50IGFzIGNvbXBpbGVDb21wb25lbnQsIMm1Y29tcGlsZURpcmVjdGl2ZSBhcyBjb21waWxlRGlyZWN0aXZlLCDJtWNvbXBpbGVOZ01vZHVsZURlZnMgYXMgY29tcGlsZU5nTW9kdWxlRGVmcywgybVjb21waWxlUGlwZSBhcyBjb21waWxlUGlwZSwgybVERUZBVUxUX0xPQ0FMRV9JRCBhcyBERUZBVUxUX0xPQ0FMRV9JRCwgybVEaXJlY3RpdmVEZWYgYXMgRGlyZWN0aXZlRGVmLCDJtWdldEluamVjdGFibGVEZWYgYXMgZ2V0SW5qZWN0YWJsZURlZiwgybVOR19DT01QX0RFRiBhcyBOR19DT01QX0RFRiwgybVOR19ESVJfREVGIGFzIE5HX0RJUl9ERUYsIMm1TkdfSU5KX0RFRiBhcyBOR19JTkpfREVGLCDJtU5HX01PRF9ERUYgYXMgTkdfTU9EX0RFRiwgybVOR19QSVBFX0RFRiBhcyBOR19QSVBFX0RFRiwgybVOZ01vZHVsZUZhY3RvcnkgYXMgUjNOZ01vZHVsZUZhY3RvcnksIMm1TmdNb2R1bGVUcmFuc2l0aXZlU2NvcGVzIGFzIE5nTW9kdWxlVHJhbnNpdGl2ZVNjb3BlcywgybVOZ01vZHVsZVR5cGUgYXMgTmdNb2R1bGVUeXBlLCDJtXBhdGNoQ29tcG9uZW50RGVmV2l0aFNjb3BlIGFzIHBhdGNoQ29tcG9uZW50RGVmV2l0aFNjb3BlLCDJtVJlbmRlcjNDb21wb25lbnRGYWN0b3J5IGFzIENvbXBvbmVudEZhY3RvcnksIMm1UmVuZGVyM05nTW9kdWxlUmVmIGFzIE5nTW9kdWxlUmVmLCDJtXNldExvY2FsZUlkIGFzIHNldExvY2FsZUlkLCDJtXRyYW5zaXRpdmVTY29wZXNGb3IgYXMgdHJhbnNpdGl2ZVNjb3Blc0ZvciwgybXJtUluamVjdGFibGVEZWYgYXMgSW5qZWN0YWJsZURlZn0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5cbmltcG9ydCB7Y2xlYXJSZXNvbHV0aW9uT2ZDb21wb25lbnRSZXNvdXJjZXNRdWV1ZSwgaXNDb21wb25lbnREZWZQZW5kaW5nUmVzb2x1dGlvbiwgcmVzb2x2ZUNvbXBvbmVudFJlc291cmNlcywgcmVzdG9yZUNvbXBvbmVudFJlc29sdXRpb25RdWV1ZX0gZnJvbSAnLi4vLi4vc3JjL21ldGFkYXRhL3Jlc291cmNlX2xvYWRpbmcnO1xuXG5pbXBvcnQge01ldGFkYXRhT3ZlcnJpZGV9IGZyb20gJy4vbWV0YWRhdGFfb3ZlcnJpZGUnO1xuaW1wb3J0IHtDb21wb25lbnRSZXNvbHZlciwgRGlyZWN0aXZlUmVzb2x2ZXIsIE5nTW9kdWxlUmVzb2x2ZXIsIFBpcGVSZXNvbHZlciwgUmVzb2x2ZXJ9IGZyb20gJy4vcmVzb2x2ZXJzJztcbmltcG9ydCB7VGVzdE1vZHVsZU1ldGFkYXRhfSBmcm9tICcuL3Rlc3RfYmVkX2NvbW1vbic7XG5cbmVudW0gVGVzdGluZ01vZHVsZU92ZXJyaWRlIHtcbiAgREVDTEFSQVRJT04sXG4gIE9WRVJSSURFX1RFTVBMQVRFLFxufVxuXG5mdW5jdGlvbiBpc1Rlc3RpbmdNb2R1bGVPdmVycmlkZSh2YWx1ZTogdW5rbm93bik6IHZhbHVlIGlzIFRlc3RpbmdNb2R1bGVPdmVycmlkZSB7XG4gIHJldHVybiB2YWx1ZSA9PT0gVGVzdGluZ01vZHVsZU92ZXJyaWRlLkRFQ0xBUkFUSU9OIHx8XG4gICAgICB2YWx1ZSA9PT0gVGVzdGluZ01vZHVsZU92ZXJyaWRlLk9WRVJSSURFX1RFTVBMQVRFO1xufVxuXG4vLyBSZXNvbHZlcnMgZm9yIEFuZ3VsYXIgZGVjb3JhdG9yc1xudHlwZSBSZXNvbHZlcnMgPSB7XG4gIG1vZHVsZTogUmVzb2x2ZXI8TmdNb2R1bGU+LFxuICBjb21wb25lbnQ6IFJlc29sdmVyPERpcmVjdGl2ZT4sXG4gIGRpcmVjdGl2ZTogUmVzb2x2ZXI8Q29tcG9uZW50PixcbiAgcGlwZTogUmVzb2x2ZXI8UGlwZT4sXG59O1xuXG5pbnRlcmZhY2UgQ2xlYW51cE9wZXJhdGlvbiB7XG4gIGZpZWxkTmFtZTogc3RyaW5nO1xuICBvYmplY3Q6IGFueTtcbiAgb3JpZ2luYWxWYWx1ZTogdW5rbm93bjtcbn1cblxuZXhwb3J0IGNsYXNzIFIzVGVzdEJlZENvbXBpbGVyIHtcbiAgcHJpdmF0ZSBvcmlnaW5hbENvbXBvbmVudFJlc29sdXRpb25RdWV1ZTogTWFwPFR5cGU8YW55PiwgQ29tcG9uZW50PnxudWxsID0gbnVsbDtcblxuICAvLyBUZXN0aW5nIG1vZHVsZSBjb25maWd1cmF0aW9uXG4gIHByaXZhdGUgZGVjbGFyYXRpb25zOiBUeXBlPGFueT5bXSA9IFtdO1xuICBwcml2YXRlIGltcG9ydHM6IFR5cGU8YW55PltdID0gW107XG4gIHByaXZhdGUgcHJvdmlkZXJzOiBQcm92aWRlcltdID0gW107XG4gIHByaXZhdGUgc2NoZW1hczogYW55W10gPSBbXTtcblxuICAvLyBRdWV1ZXMgb2YgY29tcG9uZW50cy9kaXJlY3RpdmVzL3BpcGVzIHRoYXQgc2hvdWxkIGJlIHJlY29tcGlsZWQuXG4gIHByaXZhdGUgcGVuZGluZ0NvbXBvbmVudHMgPSBuZXcgU2V0PFR5cGU8YW55Pj4oKTtcbiAgcHJpdmF0ZSBwZW5kaW5nRGlyZWN0aXZlcyA9IG5ldyBTZXQ8VHlwZTxhbnk+PigpO1xuICBwcml2YXRlIHBlbmRpbmdQaXBlcyA9IG5ldyBTZXQ8VHlwZTxhbnk+PigpO1xuXG4gIC8vIEtlZXAgdHJhY2sgb2YgYWxsIGNvbXBvbmVudHMgYW5kIGRpcmVjdGl2ZXMsIHNvIHdlIGNhbiBwYXRjaCBQcm92aWRlcnMgb250byBkZWZzIGxhdGVyLlxuICBwcml2YXRlIHNlZW5Db21wb25lbnRzID0gbmV3IFNldDxUeXBlPGFueT4+KCk7XG4gIHByaXZhdGUgc2VlbkRpcmVjdGl2ZXMgPSBuZXcgU2V0PFR5cGU8YW55Pj4oKTtcblxuICAvLyBLZWVwIHRyYWNrIG9mIG92ZXJyaWRkZW4gbW9kdWxlcywgc28gdGhhdCB3ZSBjYW4gY29sbGVjdCBhbGwgYWZmZWN0ZWQgb25lcyBpbiB0aGUgbW9kdWxlIHRyZWUuXG4gIHByaXZhdGUgb3ZlcnJpZGRlbk1vZHVsZXMgPSBuZXcgU2V0PE5nTW9kdWxlVHlwZTxhbnk+PigpO1xuXG4gIC8vIFN0b3JlIHJlc29sdmVkIHN0eWxlcyBmb3IgQ29tcG9uZW50cyB0aGF0IGhhdmUgdGVtcGxhdGUgb3ZlcnJpZGVzIHByZXNlbnQgYW5kIGBzdHlsZVVybHNgXG4gIC8vIGRlZmluZWQgYXQgdGhlIHNhbWUgdGltZS5cbiAgcHJpdmF0ZSBleGlzdGluZ0NvbXBvbmVudFN0eWxlcyA9IG5ldyBNYXA8VHlwZTxhbnk+LCBzdHJpbmdbXT4oKTtcblxuICBwcml2YXRlIHJlc29sdmVyczogUmVzb2x2ZXJzID0gaW5pdFJlc29sdmVycygpO1xuXG4gIHByaXZhdGUgY29tcG9uZW50VG9Nb2R1bGVTY29wZSA9IG5ldyBNYXA8VHlwZTxhbnk+LCBUeXBlPGFueT58VGVzdGluZ01vZHVsZU92ZXJyaWRlPigpO1xuXG4gIC8vIE1hcCB0aGF0IGtlZXBzIGluaXRpYWwgdmVyc2lvbiBvZiBjb21wb25lbnQvZGlyZWN0aXZlL3BpcGUgZGVmcyBpbiBjYXNlXG4gIC8vIHdlIGNvbXBpbGUgYSBUeXBlIGFnYWluLCB0aHVzIG92ZXJyaWRpbmcgcmVzcGVjdGl2ZSBzdGF0aWMgZmllbGRzLiBUaGlzIGlzXG4gIC8vIHJlcXVpcmVkIHRvIG1ha2Ugc3VyZSB3ZSByZXN0b3JlIGRlZnMgdG8gdGhlaXIgaW5pdGlhbCBzdGF0ZXMgYmV0d2VlbiB0ZXN0IHJ1bnNcbiAgLy8gVE9ETzogd2Ugc2hvdWxkIHN1cHBvcnQgdGhlIGNhc2Ugd2l0aCBtdWx0aXBsZSBkZWZzIG9uIGEgdHlwZVxuICBwcml2YXRlIGluaXRpYWxOZ0RlZnMgPSBuZXcgTWFwPFR5cGU8YW55PiwgW3N0cmluZywgUHJvcGVydHlEZXNjcmlwdG9yfHVuZGVmaW5lZF0+KCk7XG5cbiAgLy8gQXJyYXkgdGhhdCBrZWVwcyBjbGVhbnVwIG9wZXJhdGlvbnMgZm9yIGluaXRpYWwgdmVyc2lvbnMgb2YgY29tcG9uZW50L2RpcmVjdGl2ZS9waXBlL21vZHVsZVxuICAvLyBkZWZzIGluIGNhc2UgVGVzdEJlZCBtYWtlcyBjaGFuZ2VzIHRvIHRoZSBvcmlnaW5hbHMuXG4gIHByaXZhdGUgZGVmQ2xlYW51cE9wczogQ2xlYW51cE9wZXJhdGlvbltdID0gW107XG5cbiAgcHJpdmF0ZSBfaW5qZWN0b3I6IEluamVjdG9yfG51bGwgPSBudWxsO1xuICBwcml2YXRlIGNvbXBpbGVyUHJvdmlkZXJzOiBQcm92aWRlcltdfG51bGwgPSBudWxsO1xuXG4gIHByaXZhdGUgcHJvdmlkZXJPdmVycmlkZXM6IFByb3ZpZGVyW10gPSBbXTtcbiAgcHJpdmF0ZSByb290UHJvdmlkZXJPdmVycmlkZXM6IFByb3ZpZGVyW10gPSBbXTtcbiAgLy8gT3ZlcnJpZGVzIGZvciBpbmplY3RhYmxlcyB3aXRoIGB7cHJvdmlkZWRJbjogU29tZU1vZHVsZX1gIG5lZWQgdG8gYmUgdHJhY2tlZCBhbmQgYWRkZWQgdG8gdGhhdFxuICAvLyBtb2R1bGUncyBwcm92aWRlciBsaXN0LlxuICBwcml2YXRlIHByb3ZpZGVyT3ZlcnJpZGVzQnlNb2R1bGUgPSBuZXcgTWFwPEluamVjdG9yVHlwZTxhbnk+LCBQcm92aWRlcltdPigpO1xuICBwcml2YXRlIHByb3ZpZGVyT3ZlcnJpZGVzQnlUb2tlbiA9IG5ldyBNYXA8YW55LCBQcm92aWRlcj4oKTtcbiAgcHJpdmF0ZSBtb2R1bGVQcm92aWRlcnNPdmVycmlkZGVuID0gbmV3IFNldDxUeXBlPGFueT4+KCk7XG5cbiAgcHJpdmF0ZSB0ZXN0TW9kdWxlVHlwZTogTmdNb2R1bGVUeXBlPGFueT47XG4gIHByaXZhdGUgdGVzdE1vZHVsZVJlZjogTmdNb2R1bGVSZWY8YW55PnxudWxsID0gbnVsbDtcblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIHBsYXRmb3JtOiBQbGF0Zm9ybVJlZiwgcHJpdmF0ZSBhZGRpdGlvbmFsTW9kdWxlVHlwZXM6IFR5cGU8YW55PnxUeXBlPGFueT5bXSkge1xuICAgIGNsYXNzIER5bmFtaWNUZXN0TW9kdWxlIHt9XG4gICAgdGhpcy50ZXN0TW9kdWxlVHlwZSA9IER5bmFtaWNUZXN0TW9kdWxlIGFzIGFueTtcbiAgfVxuXG4gIHNldENvbXBpbGVyUHJvdmlkZXJzKHByb3ZpZGVyczogUHJvdmlkZXJbXXxudWxsKTogdm9pZCB7XG4gICAgdGhpcy5jb21waWxlclByb3ZpZGVycyA9IHByb3ZpZGVycztcbiAgICB0aGlzLl9pbmplY3RvciA9IG51bGw7XG4gIH1cblxuICBjb25maWd1cmVUZXN0aW5nTW9kdWxlKG1vZHVsZURlZjogVGVzdE1vZHVsZU1ldGFkYXRhKTogdm9pZCB7XG4gICAgLy8gRW5xdWV1ZSBhbnkgY29tcGlsYXRpb24gdGFza3MgZm9yIHRoZSBkaXJlY3RseSBkZWNsYXJlZCBjb21wb25lbnQuXG4gICAgaWYgKG1vZHVsZURlZi5kZWNsYXJhdGlvbnMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhpcy5xdWV1ZVR5cGVBcnJheShtb2R1bGVEZWYuZGVjbGFyYXRpb25zLCBUZXN0aW5nTW9kdWxlT3ZlcnJpZGUuREVDTEFSQVRJT04pO1xuICAgICAgdGhpcy5kZWNsYXJhdGlvbnMucHVzaCguLi5tb2R1bGVEZWYuZGVjbGFyYXRpb25zKTtcbiAgICB9XG5cbiAgICAvLyBFbnF1ZXVlIGFueSBjb21waWxhdGlvbiB0YXNrcyBmb3IgaW1wb3J0ZWQgbW9kdWxlcy5cbiAgICBpZiAobW9kdWxlRGVmLmltcG9ydHMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhpcy5xdWV1ZVR5cGVzRnJvbU1vZHVsZXNBcnJheShtb2R1bGVEZWYuaW1wb3J0cyk7XG4gICAgICB0aGlzLmltcG9ydHMucHVzaCguLi5tb2R1bGVEZWYuaW1wb3J0cyk7XG4gICAgfVxuXG4gICAgaWYgKG1vZHVsZURlZi5wcm92aWRlcnMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhpcy5wcm92aWRlcnMucHVzaCguLi5tb2R1bGVEZWYucHJvdmlkZXJzKTtcbiAgICB9XG5cbiAgICBpZiAobW9kdWxlRGVmLnNjaGVtYXMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhpcy5zY2hlbWFzLnB1c2goLi4ubW9kdWxlRGVmLnNjaGVtYXMpO1xuICAgIH1cbiAgfVxuXG4gIG92ZXJyaWRlTW9kdWxlKG5nTW9kdWxlOiBUeXBlPGFueT4sIG92ZXJyaWRlOiBNZXRhZGF0YU92ZXJyaWRlPE5nTW9kdWxlPik6IHZvaWQge1xuICAgIHRoaXMub3ZlcnJpZGRlbk1vZHVsZXMuYWRkKG5nTW9kdWxlIGFzIE5nTW9kdWxlVHlwZTxhbnk+KTtcblxuICAgIC8vIENvbXBpbGUgdGhlIG1vZHVsZSByaWdodCBhd2F5LlxuICAgIHRoaXMucmVzb2x2ZXJzLm1vZHVsZS5hZGRPdmVycmlkZShuZ01vZHVsZSwgb3ZlcnJpZGUpO1xuICAgIGNvbnN0IG1ldGFkYXRhID0gdGhpcy5yZXNvbHZlcnMubW9kdWxlLnJlc29sdmUobmdNb2R1bGUpO1xuICAgIGlmIChtZXRhZGF0YSA9PT0gbnVsbCkge1xuICAgICAgdGhyb3cgaW52YWxpZFR5cGVFcnJvcihuZ01vZHVsZS5uYW1lLCAnTmdNb2R1bGUnKTtcbiAgICB9XG5cbiAgICB0aGlzLnJlY29tcGlsZU5nTW9kdWxlKG5nTW9kdWxlLCBtZXRhZGF0YSk7XG5cbiAgICAvLyBBdCB0aGlzIHBvaW50LCB0aGUgbW9kdWxlIGhhcyBhIHZhbGlkIG1vZHVsZSBkZWYgKMm1bW9kKSwgYnV0IHRoZSBvdmVycmlkZSBtYXkgaGF2ZSBpbnRyb2R1Y2VkXG4gICAgLy8gbmV3IGRlY2xhcmF0aW9ucyBvciBpbXBvcnRlZCBtb2R1bGVzLiBJbmdlc3QgYW55IHBvc3NpYmxlIG5ldyB0eXBlcyBhbmQgYWRkIHRoZW0gdG8gdGhlXG4gICAgLy8gY3VycmVudCBxdWV1ZS5cbiAgICB0aGlzLnF1ZXVlVHlwZXNGcm9tTW9kdWxlc0FycmF5KFtuZ01vZHVsZV0pO1xuICB9XG5cbiAgb3ZlcnJpZGVDb21wb25lbnQoY29tcG9uZW50OiBUeXBlPGFueT4sIG92ZXJyaWRlOiBNZXRhZGF0YU92ZXJyaWRlPENvbXBvbmVudD4pOiB2b2lkIHtcbiAgICB0aGlzLnJlc29sdmVycy5jb21wb25lbnQuYWRkT3ZlcnJpZGUoY29tcG9uZW50LCBvdmVycmlkZSk7XG4gICAgdGhpcy5wZW5kaW5nQ29tcG9uZW50cy5hZGQoY29tcG9uZW50KTtcbiAgfVxuXG4gIG92ZXJyaWRlRGlyZWN0aXZlKGRpcmVjdGl2ZTogVHlwZTxhbnk+LCBvdmVycmlkZTogTWV0YWRhdGFPdmVycmlkZTxEaXJlY3RpdmU+KTogdm9pZCB7XG4gICAgdGhpcy5yZXNvbHZlcnMuZGlyZWN0aXZlLmFkZE92ZXJyaWRlKGRpcmVjdGl2ZSwgb3ZlcnJpZGUpO1xuICAgIHRoaXMucGVuZGluZ0RpcmVjdGl2ZXMuYWRkKGRpcmVjdGl2ZSk7XG4gIH1cblxuICBvdmVycmlkZVBpcGUocGlwZTogVHlwZTxhbnk+LCBvdmVycmlkZTogTWV0YWRhdGFPdmVycmlkZTxQaXBlPik6IHZvaWQge1xuICAgIHRoaXMucmVzb2x2ZXJzLnBpcGUuYWRkT3ZlcnJpZGUocGlwZSwgb3ZlcnJpZGUpO1xuICAgIHRoaXMucGVuZGluZ1BpcGVzLmFkZChwaXBlKTtcbiAgfVxuXG4gIG92ZXJyaWRlUHJvdmlkZXIoXG4gICAgICB0b2tlbjogYW55LFxuICAgICAgcHJvdmlkZXI6IHt1c2VGYWN0b3J5PzogRnVuY3Rpb24sIHVzZVZhbHVlPzogYW55LCBkZXBzPzogYW55W10sIG11bHRpPzogYm9vbGVhbn0pOiB2b2lkIHtcbiAgICBsZXQgcHJvdmlkZXJEZWY6IFByb3ZpZGVyO1xuICAgIGlmIChwcm92aWRlci51c2VGYWN0b3J5ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHByb3ZpZGVyRGVmID0ge1xuICAgICAgICBwcm92aWRlOiB0b2tlbixcbiAgICAgICAgdXNlRmFjdG9yeTogcHJvdmlkZXIudXNlRmFjdG9yeSxcbiAgICAgICAgZGVwczogcHJvdmlkZXIuZGVwcyB8fCBbXSxcbiAgICAgICAgbXVsdGk6IHByb3ZpZGVyLm11bHRpXG4gICAgICB9O1xuICAgIH0gZWxzZSBpZiAocHJvdmlkZXIudXNlVmFsdWUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgcHJvdmlkZXJEZWYgPSB7cHJvdmlkZTogdG9rZW4sIHVzZVZhbHVlOiBwcm92aWRlci51c2VWYWx1ZSwgbXVsdGk6IHByb3ZpZGVyLm11bHRpfTtcbiAgICB9IGVsc2Uge1xuICAgICAgcHJvdmlkZXJEZWYgPSB7cHJvdmlkZTogdG9rZW59O1xuICAgIH1cblxuICAgIGNvbnN0IGluamVjdGFibGVEZWY6IEluamVjdGFibGVEZWY8YW55PnxudWxsID1cbiAgICAgICAgdHlwZW9mIHRva2VuICE9PSAnc3RyaW5nJyA/IGdldEluamVjdGFibGVEZWYodG9rZW4pIDogbnVsbDtcbiAgICBjb25zdCBwcm92aWRlZEluID0gaW5qZWN0YWJsZURlZiA9PT0gbnVsbCA/IG51bGwgOiByZXNvbHZlRm9yd2FyZFJlZihpbmplY3RhYmxlRGVmLnByb3ZpZGVkSW4pO1xuICAgIGNvbnN0IG92ZXJyaWRlc0J1Y2tldCA9XG4gICAgICAgIHByb3ZpZGVkSW4gPT09ICdyb290JyA/IHRoaXMucm9vdFByb3ZpZGVyT3ZlcnJpZGVzIDogdGhpcy5wcm92aWRlck92ZXJyaWRlcztcbiAgICBvdmVycmlkZXNCdWNrZXQucHVzaChwcm92aWRlckRlZik7XG5cbiAgICAvLyBLZWVwIG92ZXJyaWRlcyBncm91cGVkIGJ5IHRva2VuIGFzIHdlbGwgZm9yIGZhc3QgbG9va3VwcyB1c2luZyB0b2tlblxuICAgIHRoaXMucHJvdmlkZXJPdmVycmlkZXNCeVRva2VuLnNldCh0b2tlbiwgcHJvdmlkZXJEZWYpO1xuICAgIGlmIChpbmplY3RhYmxlRGVmICE9PSBudWxsICYmIHByb3ZpZGVkSW4gIT09IG51bGwgJiYgdHlwZW9mIHByb3ZpZGVkSW4gIT09ICdzdHJpbmcnKSB7XG4gICAgICBjb25zdCBleGlzdGluZ092ZXJyaWRlcyA9IHRoaXMucHJvdmlkZXJPdmVycmlkZXNCeU1vZHVsZS5nZXQocHJvdmlkZWRJbik7XG4gICAgICBpZiAoZXhpc3RpbmdPdmVycmlkZXMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBleGlzdGluZ092ZXJyaWRlcy5wdXNoKHByb3ZpZGVyRGVmKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMucHJvdmlkZXJPdmVycmlkZXNCeU1vZHVsZS5zZXQocHJvdmlkZWRJbiwgW3Byb3ZpZGVyRGVmXSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgb3ZlcnJpZGVUZW1wbGF0ZVVzaW5nVGVzdGluZ01vZHVsZSh0eXBlOiBUeXBlPGFueT4sIHRlbXBsYXRlOiBzdHJpbmcpOiB2b2lkIHtcbiAgICBjb25zdCBkZWYgPSAodHlwZSBhcyBhbnkpW05HX0NPTVBfREVGXTtcbiAgICBjb25zdCBoYXNTdHlsZVVybHMgPSAoKTogYm9vbGVhbiA9PiB7XG4gICAgICBjb25zdCBtZXRhZGF0YSA9IHRoaXMucmVzb2x2ZXJzLmNvbXBvbmVudC5yZXNvbHZlKHR5cGUpISBhcyBDb21wb25lbnQ7XG4gICAgICByZXR1cm4gISFtZXRhZGF0YS5zdHlsZVVybHMgJiYgbWV0YWRhdGEuc3R5bGVVcmxzLmxlbmd0aCA+IDA7XG4gICAgfTtcbiAgICBjb25zdCBvdmVycmlkZVN0eWxlVXJscyA9ICEhZGVmICYmICFpc0NvbXBvbmVudERlZlBlbmRpbmdSZXNvbHV0aW9uKHR5cGUpICYmIGhhc1N0eWxlVXJscygpO1xuXG4gICAgLy8gSW4gSXZ5LCBjb21waWxpbmcgYSBjb21wb25lbnQgZG9lcyBub3QgcmVxdWlyZSBrbm93aW5nIHRoZSBtb2R1bGUgcHJvdmlkaW5nIHRoZVxuICAgIC8vIGNvbXBvbmVudCdzIHNjb3BlLCBzbyBvdmVycmlkZVRlbXBsYXRlVXNpbmdUZXN0aW5nTW9kdWxlIGNhbiBiZSBpbXBsZW1lbnRlZCBwdXJlbHkgdmlhXG4gICAgLy8gb3ZlcnJpZGVDb21wb25lbnQuIEltcG9ydGFudDogb3ZlcnJpZGluZyB0ZW1wbGF0ZSByZXF1aXJlcyBmdWxsIENvbXBvbmVudCByZS1jb21waWxhdGlvbixcbiAgICAvLyB3aGljaCBtYXkgZmFpbCBpbiBjYXNlIHN0eWxlVXJscyBhcmUgYWxzbyBwcmVzZW50ICh0aHVzIENvbXBvbmVudCBpcyBjb25zaWRlcmVkIGFzIHJlcXVpcmVkXG4gICAgLy8gcmVzb2x1dGlvbikuIEluIG9yZGVyIHRvIGF2b2lkIHRoaXMsIHdlIHByZWVtcHRpdmVseSBzZXQgc3R5bGVVcmxzIHRvIGFuIGVtcHR5IGFycmF5LFxuICAgIC8vIHByZXNlcnZlIGN1cnJlbnQgc3R5bGVzIGF2YWlsYWJsZSBvbiBDb21wb25lbnQgZGVmIGFuZCByZXN0b3JlIHN0eWxlcyBiYWNrIG9uY2UgY29tcGlsYXRpb25cbiAgICAvLyBpcyBjb21wbGV0ZS5cbiAgICBjb25zdCBvdmVycmlkZSA9IG92ZXJyaWRlU3R5bGVVcmxzID8ge3RlbXBsYXRlLCBzdHlsZXM6IFtdLCBzdHlsZVVybHM6IFtdfSA6IHt0ZW1wbGF0ZX07XG4gICAgdGhpcy5vdmVycmlkZUNvbXBvbmVudCh0eXBlLCB7c2V0OiBvdmVycmlkZX0pO1xuXG4gICAgaWYgKG92ZXJyaWRlU3R5bGVVcmxzICYmIGRlZi5zdHlsZXMgJiYgZGVmLnN0eWxlcy5sZW5ndGggPiAwKSB7XG4gICAgICB0aGlzLmV4aXN0aW5nQ29tcG9uZW50U3R5bGVzLnNldCh0eXBlLCBkZWYuc3R5bGVzKTtcbiAgICB9XG5cbiAgICAvLyBTZXQgdGhlIGNvbXBvbmVudCdzIHNjb3BlIHRvIGJlIHRoZSB0ZXN0aW5nIG1vZHVsZS5cbiAgICB0aGlzLmNvbXBvbmVudFRvTW9kdWxlU2NvcGUuc2V0KHR5cGUsIFRlc3RpbmdNb2R1bGVPdmVycmlkZS5PVkVSUklERV9URU1QTEFURSk7XG4gIH1cblxuICBhc3luYyBjb21waWxlQ29tcG9uZW50cygpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0aGlzLmNsZWFyQ29tcG9uZW50UmVzb2x1dGlvblF1ZXVlKCk7XG4gICAgLy8gUnVuIGNvbXBpbGVycyBmb3IgYWxsIHF1ZXVlZCB0eXBlcy5cbiAgICBsZXQgbmVlZHNBc3luY1Jlc291cmNlcyA9IHRoaXMuY29tcGlsZVR5cGVzU3luYygpO1xuXG4gICAgLy8gY29tcGlsZUNvbXBvbmVudHMoKSBzaG91bGQgbm90IGJlIGFzeW5jIHVubGVzcyBpdCBuZWVkcyB0byBiZS5cbiAgICBpZiAobmVlZHNBc3luY1Jlc291cmNlcykge1xuICAgICAgbGV0IHJlc291cmNlTG9hZGVyOiBSZXNvdXJjZUxvYWRlcjtcbiAgICAgIGxldCByZXNvbHZlciA9ICh1cmw6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiA9PiB7XG4gICAgICAgIGlmICghcmVzb3VyY2VMb2FkZXIpIHtcbiAgICAgICAgICByZXNvdXJjZUxvYWRlciA9IHRoaXMuaW5qZWN0b3IuZ2V0KFJlc291cmNlTG9hZGVyKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHJlc291cmNlTG9hZGVyLmdldCh1cmwpKTtcbiAgICAgIH07XG4gICAgICBhd2FpdCByZXNvbHZlQ29tcG9uZW50UmVzb3VyY2VzKHJlc29sdmVyKTtcbiAgICB9XG4gIH1cblxuICBmaW5hbGl6ZSgpOiBOZ01vZHVsZVJlZjxhbnk+IHtcbiAgICAvLyBPbmUgbGFzdCBjb21waWxlXG4gICAgdGhpcy5jb21waWxlVHlwZXNTeW5jKCk7XG5cbiAgICAvLyBDcmVhdGUgdGhlIHRlc3RpbmcgbW9kdWxlIGl0c2VsZi5cbiAgICB0aGlzLmNvbXBpbGVUZXN0TW9kdWxlKCk7XG5cbiAgICB0aGlzLmFwcGx5VHJhbnNpdGl2ZVNjb3BlcygpO1xuXG4gICAgdGhpcy5hcHBseVByb3ZpZGVyT3ZlcnJpZGVzKCk7XG5cbiAgICAvLyBQYXRjaCBwcmV2aW91c2x5IHN0b3JlZCBgc3R5bGVzYCBDb21wb25lbnQgdmFsdWVzICh0YWtlbiBmcm9tIMm1Y21wKSwgaW4gY2FzZSB0aGVzZVxuICAgIC8vIENvbXBvbmVudHMgaGF2ZSBgc3R5bGVVcmxzYCBmaWVsZHMgZGVmaW5lZCBhbmQgdGVtcGxhdGUgb3ZlcnJpZGUgd2FzIHJlcXVlc3RlZC5cbiAgICB0aGlzLnBhdGNoQ29tcG9uZW50c1dpdGhFeGlzdGluZ1N0eWxlcygpO1xuXG4gICAgLy8gQ2xlYXIgdGhlIGNvbXBvbmVudFRvTW9kdWxlU2NvcGUgbWFwLCBzbyB0aGF0IGZ1dHVyZSBjb21waWxhdGlvbnMgZG9uJ3QgcmVzZXQgdGhlIHNjb3BlIG9mXG4gICAgLy8gZXZlcnkgY29tcG9uZW50LlxuICAgIHRoaXMuY29tcG9uZW50VG9Nb2R1bGVTY29wZS5jbGVhcigpO1xuXG4gICAgY29uc3QgcGFyZW50SW5qZWN0b3IgPSB0aGlzLnBsYXRmb3JtLmluamVjdG9yO1xuICAgIHRoaXMudGVzdE1vZHVsZVJlZiA9IG5ldyBOZ01vZHVsZVJlZih0aGlzLnRlc3RNb2R1bGVUeXBlLCBwYXJlbnRJbmplY3Rvcik7XG5cbiAgICAvLyBBcHBsaWNhdGlvbkluaXRTdGF0dXMucnVuSW5pdGlhbGl6ZXJzKCkgaXMgbWFya2VkIEBpbnRlcm5hbCB0byBjb3JlLlxuICAgIC8vIENhc3QgaXQgdG8gYW55IGJlZm9yZSBhY2Nlc3NpbmcgaXQuXG4gICAgKHRoaXMudGVzdE1vZHVsZVJlZi5pbmplY3Rvci5nZXQoQXBwbGljYXRpb25Jbml0U3RhdHVzKSBhcyBhbnkpLnJ1bkluaXRpYWxpemVycygpO1xuXG4gICAgLy8gU2V0IGxvY2FsZSBJRCBhZnRlciBydW5uaW5nIGFwcCBpbml0aWFsaXplcnMsIHNpbmNlIGxvY2FsZSBpbmZvcm1hdGlvbiBtaWdodCBiZSB1cGRhdGVkIHdoaWxlXG4gICAgLy8gcnVubmluZyBpbml0aWFsaXplcnMuIFRoaXMgaXMgYWxzbyBjb25zaXN0ZW50IHdpdGggdGhlIGV4ZWN1dGlvbiBvcmRlciB3aGlsZSBib290c3RyYXBwaW5nIGFuXG4gICAgLy8gYXBwIChzZWUgYHBhY2thZ2VzL2NvcmUvc3JjL2FwcGxpY2F0aW9uX3JlZi50c2AgZmlsZSkuXG4gICAgY29uc3QgbG9jYWxlSWQgPSB0aGlzLnRlc3RNb2R1bGVSZWYuaW5qZWN0b3IuZ2V0KExPQ0FMRV9JRCwgREVGQVVMVF9MT0NBTEVfSUQpO1xuICAgIHNldExvY2FsZUlkKGxvY2FsZUlkKTtcblxuICAgIHJldHVybiB0aGlzLnRlc3RNb2R1bGVSZWY7XG4gIH1cblxuICAvKipcbiAgICogQGludGVybmFsXG4gICAqL1xuICBfY29tcGlsZU5nTW9kdWxlU3luYyhtb2R1bGVUeXBlOiBUeXBlPGFueT4pOiB2b2lkIHtcbiAgICB0aGlzLnF1ZXVlVHlwZXNGcm9tTW9kdWxlc0FycmF5KFttb2R1bGVUeXBlXSk7XG4gICAgdGhpcy5jb21waWxlVHlwZXNTeW5jKCk7XG4gICAgdGhpcy5hcHBseVByb3ZpZGVyT3ZlcnJpZGVzKCk7XG4gICAgdGhpcy5hcHBseVByb3ZpZGVyT3ZlcnJpZGVzVG9Nb2R1bGUobW9kdWxlVHlwZSk7XG4gICAgdGhpcy5hcHBseVRyYW5zaXRpdmVTY29wZXMoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIGFzeW5jIF9jb21waWxlTmdNb2R1bGVBc3luYyhtb2R1bGVUeXBlOiBUeXBlPGFueT4pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0aGlzLnF1ZXVlVHlwZXNGcm9tTW9kdWxlc0FycmF5KFttb2R1bGVUeXBlXSk7XG4gICAgYXdhaXQgdGhpcy5jb21waWxlQ29tcG9uZW50cygpO1xuICAgIHRoaXMuYXBwbHlQcm92aWRlck92ZXJyaWRlcygpO1xuICAgIHRoaXMuYXBwbHlQcm92aWRlck92ZXJyaWRlc1RvTW9kdWxlKG1vZHVsZVR5cGUpO1xuICAgIHRoaXMuYXBwbHlUcmFuc2l0aXZlU2NvcGVzKCk7XG4gIH1cblxuICAvKipcbiAgICogQGludGVybmFsXG4gICAqL1xuICBfZ2V0TW9kdWxlUmVzb2x2ZXIoKTogUmVzb2x2ZXI8TmdNb2R1bGU+IHtcbiAgICByZXR1cm4gdGhpcy5yZXNvbHZlcnMubW9kdWxlO1xuICB9XG5cbiAgLyoqXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgX2dldENvbXBvbmVudEZhY3Rvcmllcyhtb2R1bGVUeXBlOiBOZ01vZHVsZVR5cGUpOiBDb21wb25lbnRGYWN0b3J5PGFueT5bXSB7XG4gICAgcmV0dXJuIG1heWJlVW53cmFwRm4obW9kdWxlVHlwZS7JtW1vZC5kZWNsYXJhdGlvbnMpLnJlZHVjZSgoZmFjdG9yaWVzLCBkZWNsYXJhdGlvbikgPT4ge1xuICAgICAgY29uc3QgY29tcG9uZW50RGVmID0gKGRlY2xhcmF0aW9uIGFzIGFueSkuybVjbXA7XG4gICAgICBjb21wb25lbnREZWYgJiYgZmFjdG9yaWVzLnB1c2gobmV3IENvbXBvbmVudEZhY3RvcnkoY29tcG9uZW50RGVmLCB0aGlzLnRlc3RNb2R1bGVSZWYhKSk7XG4gICAgICByZXR1cm4gZmFjdG9yaWVzO1xuICAgIH0sIFtdIGFzIENvbXBvbmVudEZhY3Rvcnk8YW55PltdKTtcbiAgfVxuXG4gIHByaXZhdGUgY29tcGlsZVR5cGVzU3luYygpOiBib29sZWFuIHtcbiAgICAvLyBDb21waWxlIGFsbCBxdWV1ZWQgY29tcG9uZW50cywgZGlyZWN0aXZlcywgcGlwZXMuXG4gICAgbGV0IG5lZWRzQXN5bmNSZXNvdXJjZXMgPSBmYWxzZTtcbiAgICB0aGlzLnBlbmRpbmdDb21wb25lbnRzLmZvckVhY2goZGVjbGFyYXRpb24gPT4ge1xuICAgICAgbmVlZHNBc3luY1Jlc291cmNlcyA9IG5lZWRzQXN5bmNSZXNvdXJjZXMgfHwgaXNDb21wb25lbnREZWZQZW5kaW5nUmVzb2x1dGlvbihkZWNsYXJhdGlvbik7XG4gICAgICBjb25zdCBtZXRhZGF0YSA9IHRoaXMucmVzb2x2ZXJzLmNvbXBvbmVudC5yZXNvbHZlKGRlY2xhcmF0aW9uKTtcbiAgICAgIGlmIChtZXRhZGF0YSA9PT0gbnVsbCkge1xuICAgICAgICB0aHJvdyBpbnZhbGlkVHlwZUVycm9yKGRlY2xhcmF0aW9uLm5hbWUsICdDb21wb25lbnQnKTtcbiAgICAgIH1cbiAgICAgIHRoaXMubWF5YmVTdG9yZU5nRGVmKE5HX0NPTVBfREVGLCBkZWNsYXJhdGlvbik7XG4gICAgICBjb21waWxlQ29tcG9uZW50KGRlY2xhcmF0aW9uLCBtZXRhZGF0YSk7XG4gICAgfSk7XG4gICAgdGhpcy5wZW5kaW5nQ29tcG9uZW50cy5jbGVhcigpO1xuXG4gICAgdGhpcy5wZW5kaW5nRGlyZWN0aXZlcy5mb3JFYWNoKGRlY2xhcmF0aW9uID0+IHtcbiAgICAgIGNvbnN0IG1ldGFkYXRhID0gdGhpcy5yZXNvbHZlcnMuZGlyZWN0aXZlLnJlc29sdmUoZGVjbGFyYXRpb24pO1xuICAgICAgaWYgKG1ldGFkYXRhID09PSBudWxsKSB7XG4gICAgICAgIHRocm93IGludmFsaWRUeXBlRXJyb3IoZGVjbGFyYXRpb24ubmFtZSwgJ0RpcmVjdGl2ZScpO1xuICAgICAgfVxuICAgICAgdGhpcy5tYXliZVN0b3JlTmdEZWYoTkdfRElSX0RFRiwgZGVjbGFyYXRpb24pO1xuICAgICAgY29tcGlsZURpcmVjdGl2ZShkZWNsYXJhdGlvbiwgbWV0YWRhdGEpO1xuICAgIH0pO1xuICAgIHRoaXMucGVuZGluZ0RpcmVjdGl2ZXMuY2xlYXIoKTtcblxuICAgIHRoaXMucGVuZGluZ1BpcGVzLmZvckVhY2goZGVjbGFyYXRpb24gPT4ge1xuICAgICAgY29uc3QgbWV0YWRhdGEgPSB0aGlzLnJlc29sdmVycy5waXBlLnJlc29sdmUoZGVjbGFyYXRpb24pO1xuICAgICAgaWYgKG1ldGFkYXRhID09PSBudWxsKSB7XG4gICAgICAgIHRocm93IGludmFsaWRUeXBlRXJyb3IoZGVjbGFyYXRpb24ubmFtZSwgJ1BpcGUnKTtcbiAgICAgIH1cbiAgICAgIHRoaXMubWF5YmVTdG9yZU5nRGVmKE5HX1BJUEVfREVGLCBkZWNsYXJhdGlvbik7XG4gICAgICBjb21waWxlUGlwZShkZWNsYXJhdGlvbiwgbWV0YWRhdGEpO1xuICAgIH0pO1xuICAgIHRoaXMucGVuZGluZ1BpcGVzLmNsZWFyKCk7XG5cbiAgICByZXR1cm4gbmVlZHNBc3luY1Jlc291cmNlcztcbiAgfVxuXG4gIHByaXZhdGUgYXBwbHlUcmFuc2l0aXZlU2NvcGVzKCk6IHZvaWQge1xuICAgIGlmICh0aGlzLm92ZXJyaWRkZW5Nb2R1bGVzLnNpemUgPiAwKSB7XG4gICAgICAvLyBNb2R1bGUgb3ZlcnJpZGVzICh2aWEgYFRlc3RCZWQub3ZlcnJpZGVNb2R1bGVgKSBtaWdodCBhZmZlY3Qgc2NvcGVzIHRoYXQgd2VyZSBwcmV2aW91c2x5XG4gICAgICAvLyBjYWxjdWxhdGVkIGFuZCBzdG9yZWQgaW4gYHRyYW5zaXRpdmVDb21waWxlU2NvcGVzYC4gSWYgbW9kdWxlIG92ZXJyaWRlcyBhcmUgcHJlc2VudCxcbiAgICAgIC8vIGNvbGxlY3QgYWxsIGFmZmVjdGVkIG1vZHVsZXMgYW5kIHJlc2V0IHNjb3BlcyB0byBmb3JjZSB0aGVpciByZS1jYWxjdWxhdGF0aW9uLlxuICAgICAgY29uc3QgdGVzdGluZ01vZHVsZURlZiA9ICh0aGlzLnRlc3RNb2R1bGVUeXBlIGFzIGFueSlbTkdfTU9EX0RFRl07XG4gICAgICBjb25zdCBhZmZlY3RlZE1vZHVsZXMgPSB0aGlzLmNvbGxlY3RNb2R1bGVzQWZmZWN0ZWRCeU92ZXJyaWRlcyh0ZXN0aW5nTW9kdWxlRGVmLmltcG9ydHMpO1xuICAgICAgaWYgKGFmZmVjdGVkTW9kdWxlcy5zaXplID4gMCkge1xuICAgICAgICBhZmZlY3RlZE1vZHVsZXMuZm9yRWFjaChtb2R1bGVUeXBlID0+IHtcbiAgICAgICAgICB0aGlzLnN0b3JlRmllbGRPZkRlZk9uVHlwZShtb2R1bGVUeXBlIGFzIGFueSwgTkdfTU9EX0RFRiwgJ3RyYW5zaXRpdmVDb21waWxlU2NvcGVzJyk7XG4gICAgICAgICAgKG1vZHVsZVR5cGUgYXMgYW55KVtOR19NT0RfREVGXS50cmFuc2l0aXZlQ29tcGlsZVNjb3BlcyA9IG51bGw7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IG1vZHVsZVRvU2NvcGUgPSBuZXcgTWFwPFR5cGU8YW55PnxUZXN0aW5nTW9kdWxlT3ZlcnJpZGUsIE5nTW9kdWxlVHJhbnNpdGl2ZVNjb3Blcz4oKTtcbiAgICBjb25zdCBnZXRTY29wZU9mTW9kdWxlID1cbiAgICAgICAgKG1vZHVsZVR5cGU6IFR5cGU8YW55PnxUZXN0aW5nTW9kdWxlT3ZlcnJpZGUpOiBOZ01vZHVsZVRyYW5zaXRpdmVTY29wZXMgPT4ge1xuICAgICAgICAgIGlmICghbW9kdWxlVG9TY29wZS5oYXMobW9kdWxlVHlwZSkpIHtcbiAgICAgICAgICAgIGNvbnN0IGlzVGVzdGluZ01vZHVsZSA9IGlzVGVzdGluZ01vZHVsZU92ZXJyaWRlKG1vZHVsZVR5cGUpO1xuICAgICAgICAgICAgY29uc3QgcmVhbFR5cGUgPSBpc1Rlc3RpbmdNb2R1bGUgPyB0aGlzLnRlc3RNb2R1bGVUeXBlIDogbW9kdWxlVHlwZSBhcyBUeXBlPGFueT47XG4gICAgICAgICAgICBtb2R1bGVUb1Njb3BlLnNldChtb2R1bGVUeXBlLCB0cmFuc2l0aXZlU2NvcGVzRm9yKHJlYWxUeXBlKSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBtb2R1bGVUb1Njb3BlLmdldChtb2R1bGVUeXBlKSE7XG4gICAgICAgIH07XG5cbiAgICB0aGlzLmNvbXBvbmVudFRvTW9kdWxlU2NvcGUuZm9yRWFjaCgobW9kdWxlVHlwZSwgY29tcG9uZW50VHlwZSkgPT4ge1xuICAgICAgY29uc3QgbW9kdWxlU2NvcGUgPSBnZXRTY29wZU9mTW9kdWxlKG1vZHVsZVR5cGUpO1xuICAgICAgdGhpcy5zdG9yZUZpZWxkT2ZEZWZPblR5cGUoY29tcG9uZW50VHlwZSwgTkdfQ09NUF9ERUYsICdkaXJlY3RpdmVEZWZzJyk7XG4gICAgICB0aGlzLnN0b3JlRmllbGRPZkRlZk9uVHlwZShjb21wb25lbnRUeXBlLCBOR19DT01QX0RFRiwgJ3BpcGVEZWZzJyk7XG4gICAgICAvLyBgdFZpZXdgIHRoYXQgaXMgc3RvcmVkIG9uIGNvbXBvbmVudCBkZWYgY29udGFpbnMgaW5mb3JtYXRpb24gYWJvdXQgZGlyZWN0aXZlcyBhbmQgcGlwZXNcbiAgICAgIC8vIHRoYXQgYXJlIGluIHRoZSBzY29wZSBvZiB0aGlzIGNvbXBvbmVudC4gUGF0Y2hpbmcgY29tcG9uZW50IHNjb3BlIHdpbGwgY2F1c2UgYHRWaWV3YCB0byBiZVxuICAgICAgLy8gY2hhbmdlZC4gU3RvcmUgb3JpZ2luYWwgYHRWaWV3YCBiZWZvcmUgcGF0Y2hpbmcgc2NvcGUsIHNvIHRoZSBgdFZpZXdgIChpbmNsdWRpbmcgc2NvcGVcbiAgICAgIC8vIGluZm9ybWF0aW9uKSBpcyByZXN0b3JlZCBiYWNrIHRvIGl0cyBwcmV2aW91cy9vcmlnaW5hbCBzdGF0ZSBiZWZvcmUgcnVubmluZyBuZXh0IHRlc3QuXG4gICAgICB0aGlzLnN0b3JlRmllbGRPZkRlZk9uVHlwZShjb21wb25lbnRUeXBlLCBOR19DT01QX0RFRiwgJ3RWaWV3Jyk7XG4gICAgICBwYXRjaENvbXBvbmVudERlZldpdGhTY29wZSgoY29tcG9uZW50VHlwZSBhcyBhbnkpLsm1Y21wLCBtb2R1bGVTY29wZSk7XG4gICAgfSk7XG5cbiAgICB0aGlzLmNvbXBvbmVudFRvTW9kdWxlU2NvcGUuY2xlYXIoKTtcbiAgfVxuXG4gIHByaXZhdGUgYXBwbHlQcm92aWRlck92ZXJyaWRlcygpOiB2b2lkIHtcbiAgICBjb25zdCBtYXliZUFwcGx5T3ZlcnJpZGVzID0gKGZpZWxkOiBzdHJpbmcpID0+ICh0eXBlOiBUeXBlPGFueT4pID0+IHtcbiAgICAgIGNvbnN0IHJlc29sdmVyID0gZmllbGQgPT09IE5HX0NPTVBfREVGID8gdGhpcy5yZXNvbHZlcnMuY29tcG9uZW50IDogdGhpcy5yZXNvbHZlcnMuZGlyZWN0aXZlO1xuICAgICAgY29uc3QgbWV0YWRhdGEgPSByZXNvbHZlci5yZXNvbHZlKHR5cGUpITtcbiAgICAgIGlmICh0aGlzLmhhc1Byb3ZpZGVyT3ZlcnJpZGVzKG1ldGFkYXRhLnByb3ZpZGVycykpIHtcbiAgICAgICAgdGhpcy5wYXRjaERlZldpdGhQcm92aWRlck92ZXJyaWRlcyh0eXBlLCBmaWVsZCk7XG4gICAgICB9XG4gICAgfTtcbiAgICB0aGlzLnNlZW5Db21wb25lbnRzLmZvckVhY2gobWF5YmVBcHBseU92ZXJyaWRlcyhOR19DT01QX0RFRikpO1xuICAgIHRoaXMuc2VlbkRpcmVjdGl2ZXMuZm9yRWFjaChtYXliZUFwcGx5T3ZlcnJpZGVzKE5HX0RJUl9ERUYpKTtcblxuICAgIHRoaXMuc2VlbkNvbXBvbmVudHMuY2xlYXIoKTtcbiAgICB0aGlzLnNlZW5EaXJlY3RpdmVzLmNsZWFyKCk7XG4gIH1cblxuICBwcml2YXRlIGFwcGx5UHJvdmlkZXJPdmVycmlkZXNUb01vZHVsZShtb2R1bGVUeXBlOiBUeXBlPGFueT4pOiB2b2lkIHtcbiAgICBpZiAodGhpcy5tb2R1bGVQcm92aWRlcnNPdmVycmlkZGVuLmhhcyhtb2R1bGVUeXBlKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLm1vZHVsZVByb3ZpZGVyc092ZXJyaWRkZW4uYWRkKG1vZHVsZVR5cGUpO1xuXG4gICAgY29uc3QgaW5qZWN0b3JEZWY6IGFueSA9IChtb2R1bGVUeXBlIGFzIGFueSlbTkdfSU5KX0RFRl07XG4gICAgaWYgKHRoaXMucHJvdmlkZXJPdmVycmlkZXNCeVRva2VuLnNpemUgPiAwKSB7XG4gICAgICBjb25zdCBwcm92aWRlcnMgPSBbXG4gICAgICAgIC4uLmluamVjdG9yRGVmLnByb3ZpZGVycyxcbiAgICAgICAgLi4uKHRoaXMucHJvdmlkZXJPdmVycmlkZXNCeU1vZHVsZS5nZXQobW9kdWxlVHlwZSBhcyBJbmplY3RvclR5cGU8YW55PikgfHwgW10pXG4gICAgICBdO1xuICAgICAgaWYgKHRoaXMuaGFzUHJvdmlkZXJPdmVycmlkZXMocHJvdmlkZXJzKSkge1xuICAgICAgICB0aGlzLm1heWJlU3RvcmVOZ0RlZihOR19JTkpfREVGLCBtb2R1bGVUeXBlKTtcblxuICAgICAgICB0aGlzLnN0b3JlRmllbGRPZkRlZk9uVHlwZShtb2R1bGVUeXBlLCBOR19JTkpfREVGLCAncHJvdmlkZXJzJyk7XG4gICAgICAgIGluamVjdG9yRGVmLnByb3ZpZGVycyA9IHRoaXMuZ2V0T3ZlcnJpZGRlblByb3ZpZGVycyhwcm92aWRlcnMpO1xuICAgICAgfVxuXG4gICAgICAvLyBBcHBseSBwcm92aWRlciBvdmVycmlkZXMgdG8gaW1wb3J0ZWQgbW9kdWxlcyByZWN1cnNpdmVseVxuICAgICAgY29uc3QgbW9kdWxlRGVmID0gKG1vZHVsZVR5cGUgYXMgYW55KVtOR19NT0RfREVGXTtcbiAgICAgIGNvbnN0IGltcG9ydHMgPSBtYXliZVVud3JhcEZuKG1vZHVsZURlZi5pbXBvcnRzKTtcbiAgICAgIGZvciAoY29uc3QgaW1wb3J0ZWRNb2R1bGUgb2YgaW1wb3J0cykge1xuICAgICAgICB0aGlzLmFwcGx5UHJvdmlkZXJPdmVycmlkZXNUb01vZHVsZShpbXBvcnRlZE1vZHVsZSk7XG4gICAgICB9XG4gICAgICAvLyBBbHNvIG92ZXJyaWRlIHRoZSBwcm92aWRlcnMgb24gYW55IE1vZHVsZVdpdGhQcm92aWRlcnMgaW1wb3J0cyBzaW5jZSB0aG9zZSBkb24ndCBhcHBlYXIgaW5cbiAgICAgIC8vIHRoZSBtb2R1bGVEZWYuXG4gICAgICBmb3IgKGNvbnN0IGltcG9ydGVkTW9kdWxlIG9mIGZsYXR0ZW4oaW5qZWN0b3JEZWYuaW1wb3J0cykpIHtcbiAgICAgICAgaWYgKGlzTW9kdWxlV2l0aFByb3ZpZGVycyhpbXBvcnRlZE1vZHVsZSkpIHtcbiAgICAgICAgICB0aGlzLmRlZkNsZWFudXBPcHMucHVzaCh7XG4gICAgICAgICAgICBvYmplY3Q6IGltcG9ydGVkTW9kdWxlLFxuICAgICAgICAgICAgZmllbGROYW1lOiAncHJvdmlkZXJzJyxcbiAgICAgICAgICAgIG9yaWdpbmFsVmFsdWU6IGltcG9ydGVkTW9kdWxlLnByb3ZpZGVyc1xuICAgICAgICAgIH0pO1xuICAgICAgICAgIGltcG9ydGVkTW9kdWxlLnByb3ZpZGVycyA9IHRoaXMuZ2V0T3ZlcnJpZGRlblByb3ZpZGVycyhpbXBvcnRlZE1vZHVsZS5wcm92aWRlcnMpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBwYXRjaENvbXBvbmVudHNXaXRoRXhpc3RpbmdTdHlsZXMoKTogdm9pZCB7XG4gICAgdGhpcy5leGlzdGluZ0NvbXBvbmVudFN0eWxlcy5mb3JFYWNoKFxuICAgICAgICAoc3R5bGVzLCB0eXBlKSA9PiAodHlwZSBhcyBhbnkpW05HX0NPTVBfREVGXS5zdHlsZXMgPSBzdHlsZXMpO1xuICAgIHRoaXMuZXhpc3RpbmdDb21wb25lbnRTdHlsZXMuY2xlYXIoKTtcbiAgfVxuXG4gIHByaXZhdGUgcXVldWVUeXBlQXJyYXkoYXJyOiBhbnlbXSwgbW9kdWxlVHlwZTogVHlwZTxhbnk+fFRlc3RpbmdNb2R1bGVPdmVycmlkZSk6IHZvaWQge1xuICAgIGZvciAoY29uc3QgdmFsdWUgb2YgYXJyKSB7XG4gICAgICBpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHtcbiAgICAgICAgdGhpcy5xdWV1ZVR5cGVBcnJheSh2YWx1ZSwgbW9kdWxlVHlwZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLnF1ZXVlVHlwZSh2YWx1ZSwgbW9kdWxlVHlwZSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSByZWNvbXBpbGVOZ01vZHVsZShuZ01vZHVsZTogVHlwZTxhbnk+LCBtZXRhZGF0YTogTmdNb2R1bGUpOiB2b2lkIHtcbiAgICAvLyBDYWNoZSB0aGUgaW5pdGlhbCBuZ01vZHVsZURlZiBhcyBpdCB3aWxsIGJlIG92ZXJ3cml0dGVuLlxuICAgIHRoaXMubWF5YmVTdG9yZU5nRGVmKE5HX01PRF9ERUYsIG5nTW9kdWxlKTtcbiAgICB0aGlzLm1heWJlU3RvcmVOZ0RlZihOR19JTkpfREVGLCBuZ01vZHVsZSk7XG5cbiAgICBjb21waWxlTmdNb2R1bGVEZWZzKG5nTW9kdWxlIGFzIE5nTW9kdWxlVHlwZTxhbnk+LCBtZXRhZGF0YSk7XG4gIH1cblxuICBwcml2YXRlIHF1ZXVlVHlwZSh0eXBlOiBUeXBlPGFueT4sIG1vZHVsZVR5cGU6IFR5cGU8YW55PnxUZXN0aW5nTW9kdWxlT3ZlcnJpZGUpOiB2b2lkIHtcbiAgICBjb25zdCBjb21wb25lbnQgPSB0aGlzLnJlc29sdmVycy5jb21wb25lbnQucmVzb2x2ZSh0eXBlKTtcbiAgICBpZiAoY29tcG9uZW50KSB7XG4gICAgICAvLyBDaGVjayB3aGV0aGVyIGEgZ2l2ZSBUeXBlIGhhcyByZXNwZWN0aXZlIE5HIGRlZiAoybVjbXApIGFuZCBjb21waWxlIGlmIGRlZiBpc1xuICAgICAgLy8gbWlzc2luZy4gVGhhdCBtaWdodCBoYXBwZW4gaW4gY2FzZSBhIGNsYXNzIHdpdGhvdXQgYW55IEFuZ3VsYXIgZGVjb3JhdG9ycyBleHRlbmRzIGFub3RoZXJcbiAgICAgIC8vIGNsYXNzIHdoZXJlIENvbXBvbmVudC9EaXJlY3RpdmUvUGlwZSBkZWNvcmF0b3IgaXMgZGVmaW5lZC5cbiAgICAgIGlmIChpc0NvbXBvbmVudERlZlBlbmRpbmdSZXNvbHV0aW9uKHR5cGUpIHx8ICF0eXBlLmhhc093blByb3BlcnR5KE5HX0NPTVBfREVGKSkge1xuICAgICAgICB0aGlzLnBlbmRpbmdDb21wb25lbnRzLmFkZCh0eXBlKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuc2VlbkNvbXBvbmVudHMuYWRkKHR5cGUpO1xuXG4gICAgICAvLyBLZWVwIHRyYWNrIG9mIHRoZSBtb2R1bGUgd2hpY2ggZGVjbGFyZXMgdGhpcyBjb21wb25lbnQsIHNvIGxhdGVyIHRoZSBjb21wb25lbnQncyBzY29wZVxuICAgICAgLy8gY2FuIGJlIHNldCBjb3JyZWN0bHkuIElmIHRoZSBjb21wb25lbnQgaGFzIGFscmVhZHkgYmVlbiByZWNvcmRlZCBoZXJlLCB0aGVuIG9uZSBvZiBzZXZlcmFsXG4gICAgICAvLyBjYXNlcyBpcyB0cnVlOlxuICAgICAgLy8gKiB0aGUgbW9kdWxlIGNvbnRhaW5pbmcgdGhlIGNvbXBvbmVudCB3YXMgaW1wb3J0ZWQgbXVsdGlwbGUgdGltZXMgKGNvbW1vbikuXG4gICAgICAvLyAqIHRoZSBjb21wb25lbnQgaXMgZGVjbGFyZWQgaW4gbXVsdGlwbGUgbW9kdWxlcyAod2hpY2ggaXMgYW4gZXJyb3IpLlxuICAgICAgLy8gKiB0aGUgY29tcG9uZW50IHdhcyBpbiAnZGVjbGFyYXRpb25zJyBvZiB0aGUgdGVzdGluZyBtb2R1bGUsIGFuZCBhbHNvIGluIGFuIGltcG9ydGVkIG1vZHVsZVxuICAgICAgLy8gICBpbiB3aGljaCBjYXNlIHRoZSBtb2R1bGUgc2NvcGUgd2lsbCBiZSBUZXN0aW5nTW9kdWxlT3ZlcnJpZGUuREVDTEFSQVRJT04uXG4gICAgICAvLyAqIG92ZXJyaWRlVGVtcGxhdGVVc2luZ1Rlc3RpbmdNb2R1bGUgd2FzIGNhbGxlZCBmb3IgdGhlIGNvbXBvbmVudCBpbiB3aGljaCBjYXNlIHRoZSBtb2R1bGVcbiAgICAgIC8vICAgc2NvcGUgd2lsbCBiZSBUZXN0aW5nTW9kdWxlT3ZlcnJpZGUuT1ZFUlJJREVfVEVNUExBVEUuXG4gICAgICAvL1xuICAgICAgLy8gSWYgdGhlIGNvbXBvbmVudCB3YXMgcHJldmlvdXNseSBpbiB0aGUgdGVzdGluZyBtb2R1bGUncyAnZGVjbGFyYXRpb25zJyAobWVhbmluZyB0aGVcbiAgICAgIC8vIGN1cnJlbnQgdmFsdWUgaXMgVGVzdGluZ01vZHVsZU92ZXJyaWRlLkRFQ0xBUkFUSU9OKSwgdGhlbiBgbW9kdWxlVHlwZWAgaXMgdGhlIGNvbXBvbmVudCdzXG4gICAgICAvLyByZWFsIG1vZHVsZSwgd2hpY2ggd2FzIGltcG9ydGVkLiBUaGlzIHBhdHRlcm4gaXMgdW5kZXJzdG9vZCB0byBtZWFuIHRoYXQgdGhlIGNvbXBvbmVudFxuICAgICAgLy8gc2hvdWxkIHVzZSBpdHMgb3JpZ2luYWwgc2NvcGUsIGJ1dCB0aGF0IHRoZSB0ZXN0aW5nIG1vZHVsZSBzaG91bGQgYWxzbyBjb250YWluIHRoZVxuICAgICAgLy8gY29tcG9uZW50IGluIGl0cyBzY29wZS5cbiAgICAgIGlmICghdGhpcy5jb21wb25lbnRUb01vZHVsZVNjb3BlLmhhcyh0eXBlKSB8fFxuICAgICAgICAgIHRoaXMuY29tcG9uZW50VG9Nb2R1bGVTY29wZS5nZXQodHlwZSkgPT09IFRlc3RpbmdNb2R1bGVPdmVycmlkZS5ERUNMQVJBVElPTikge1xuICAgICAgICB0aGlzLmNvbXBvbmVudFRvTW9kdWxlU2NvcGUuc2V0KHR5cGUsIG1vZHVsZVR5cGUpO1xuICAgICAgfVxuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGRpcmVjdGl2ZSA9IHRoaXMucmVzb2x2ZXJzLmRpcmVjdGl2ZS5yZXNvbHZlKHR5cGUpO1xuICAgIGlmIChkaXJlY3RpdmUpIHtcbiAgICAgIGlmICghdHlwZS5oYXNPd25Qcm9wZXJ0eShOR19ESVJfREVGKSkge1xuICAgICAgICB0aGlzLnBlbmRpbmdEaXJlY3RpdmVzLmFkZCh0eXBlKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuc2VlbkRpcmVjdGl2ZXMuYWRkKHR5cGUpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHBpcGUgPSB0aGlzLnJlc29sdmVycy5waXBlLnJlc29sdmUodHlwZSk7XG4gICAgaWYgKHBpcGUgJiYgIXR5cGUuaGFzT3duUHJvcGVydHkoTkdfUElQRV9ERUYpKSB7XG4gICAgICB0aGlzLnBlbmRpbmdQaXBlcy5hZGQodHlwZSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBxdWV1ZVR5cGVzRnJvbU1vZHVsZXNBcnJheShhcnI6IGFueVtdKTogdm9pZCB7XG4gICAgLy8gQmVjYXVzZSB3ZSBtYXkgZW5jb3VudGVyIHRoZSBzYW1lIE5nTW9kdWxlIHdoaWxlIHByb2Nlc3NpbmcgdGhlIGltcG9ydHMgYW5kIGV4cG9ydHMgb2YgYW5cbiAgICAvLyBOZ01vZHVsZSB0cmVlLCB3ZSBjYWNoZSB0aGVtIGluIHRoaXMgc2V0IHNvIHdlIGNhbiBza2lwIG9uZXMgdGhhdCBoYXZlIGFscmVhZHkgYmVlbiBzZWVuXG4gICAgLy8gZW5jb3VudGVyZWQuIEluIHNvbWUgdGVzdCBzZXR1cHMsIHRoaXMgY2FjaGluZyByZXN1bHRlZCBpbiAxMFggcnVudGltZSBpbXByb3ZlbWVudC5cbiAgICBjb25zdCBwcm9jZXNzZWROZ01vZHVsZURlZnMgPSBuZXcgU2V0KCk7XG4gICAgY29uc3QgcXVldWVUeXBlc0Zyb21Nb2R1bGVzQXJyYXlSZWN1ciA9IChhcnI6IGFueVtdKTogdm9pZCA9PiB7XG4gICAgICBmb3IgKGNvbnN0IHZhbHVlIG9mIGFycikge1xuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHtcbiAgICAgICAgICBxdWV1ZVR5cGVzRnJvbU1vZHVsZXNBcnJheVJlY3VyKHZhbHVlKTtcbiAgICAgICAgfSBlbHNlIGlmIChoYXNOZ01vZHVsZURlZih2YWx1ZSkpIHtcbiAgICAgICAgICBjb25zdCBkZWYgPSB2YWx1ZS7JtW1vZDtcbiAgICAgICAgICBpZiAocHJvY2Vzc2VkTmdNb2R1bGVEZWZzLmhhcyhkZWYpKSB7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcHJvY2Vzc2VkTmdNb2R1bGVEZWZzLmFkZChkZWYpO1xuICAgICAgICAgIC8vIExvb2sgdGhyb3VnaCBkZWNsYXJhdGlvbnMsIGltcG9ydHMsIGFuZCBleHBvcnRzLCBhbmQgcXVldWVcbiAgICAgICAgICAvLyBldmVyeXRoaW5nIGZvdW5kIHRoZXJlLlxuICAgICAgICAgIHRoaXMucXVldWVUeXBlQXJyYXkobWF5YmVVbndyYXBGbihkZWYuZGVjbGFyYXRpb25zKSwgdmFsdWUpO1xuICAgICAgICAgIHF1ZXVlVHlwZXNGcm9tTW9kdWxlc0FycmF5UmVjdXIobWF5YmVVbndyYXBGbihkZWYuaW1wb3J0cykpO1xuICAgICAgICAgIHF1ZXVlVHlwZXNGcm9tTW9kdWxlc0FycmF5UmVjdXIobWF5YmVVbndyYXBGbihkZWYuZXhwb3J0cykpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfTtcbiAgICBxdWV1ZVR5cGVzRnJvbU1vZHVsZXNBcnJheVJlY3VyKGFycik7XG4gIH1cblxuICAvLyBXaGVuIG1vZHVsZSBvdmVycmlkZXMgKHZpYSBgVGVzdEJlZC5vdmVycmlkZU1vZHVsZWApIGFyZSBwcmVzZW50LCBpdCBtaWdodCBhZmZlY3QgYWxsIG1vZHVsZXNcbiAgLy8gdGhhdCBpbXBvcnQgKGV2ZW4gdHJhbnNpdGl2ZWx5KSBhbiBvdmVycmlkZGVuIG9uZS4gRm9yIGFsbCBhZmZlY3RlZCBtb2R1bGVzIHdlIG5lZWQgdG9cbiAgLy8gcmVjYWxjdWxhdGUgdGhlaXIgc2NvcGVzIGZvciBhIGdpdmVuIHRlc3QgcnVuIGFuZCByZXN0b3JlIG9yaWdpbmFsIHNjb3BlcyBhdCB0aGUgZW5kLiBUaGUgZ29hbFxuICAvLyBvZiB0aGlzIGZ1bmN0aW9uIGlzIHRvIGNvbGxlY3QgYWxsIGFmZmVjdGVkIG1vZHVsZXMgaW4gYSBzZXQgZm9yIGZ1cnRoZXIgcHJvY2Vzc2luZy4gRXhhbXBsZTpcbiAgLy8gaWYgd2UgaGF2ZSB0aGUgZm9sbG93aW5nIG1vZHVsZSBoaWVyYXJjaHk6IEEgLT4gQiAtPiBDICh3aGVyZSBgLT5gIG1lYW5zIGBpbXBvcnRzYCkgYW5kIG1vZHVsZVxuICAvLyBgQ2AgaXMgb3ZlcnJpZGRlbiwgd2UgY29uc2lkZXIgYEFgIGFuZCBgQmAgYXMgYWZmZWN0ZWQsIHNpbmNlIHRoZWlyIHNjb3BlcyBtaWdodCBiZWNvbWVcbiAgLy8gaW52YWxpZGF0ZWQgd2l0aCB0aGUgb3ZlcnJpZGUuXG4gIHByaXZhdGUgY29sbGVjdE1vZHVsZXNBZmZlY3RlZEJ5T3ZlcnJpZGVzKGFycjogYW55W10pOiBTZXQ8TmdNb2R1bGVUeXBlPGFueT4+IHtcbiAgICBjb25zdCBzZWVuTW9kdWxlcyA9IG5ldyBTZXQ8TmdNb2R1bGVUeXBlPGFueT4+KCk7XG4gICAgY29uc3QgYWZmZWN0ZWRNb2R1bGVzID0gbmV3IFNldDxOZ01vZHVsZVR5cGU8YW55Pj4oKTtcbiAgICBjb25zdCBjYWxjQWZmZWN0ZWRNb2R1bGVzUmVjdXIgPSAoYXJyOiBhbnlbXSwgcGF0aDogTmdNb2R1bGVUeXBlPGFueT5bXSk6IHZvaWQgPT4ge1xuICAgICAgZm9yIChjb25zdCB2YWx1ZSBvZiBhcnIpIHtcbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkodmFsdWUpKSB7XG4gICAgICAgICAgLy8gSWYgdGhlIHZhbHVlIGlzIGFuIGFycmF5LCBqdXN0IGZsYXR0ZW4gaXQgKGJ5IGludm9raW5nIHRoaXMgZnVuY3Rpb24gcmVjdXJzaXZlbHkpLFxuICAgICAgICAgIC8vIGtlZXBpbmcgXCJwYXRoXCIgdGhlIHNhbWUuXG4gICAgICAgICAgY2FsY0FmZmVjdGVkTW9kdWxlc1JlY3VyKHZhbHVlLCBwYXRoKTtcbiAgICAgICAgfSBlbHNlIGlmIChoYXNOZ01vZHVsZURlZih2YWx1ZSkpIHtcbiAgICAgICAgICBpZiAoc2Vlbk1vZHVsZXMuaGFzKHZhbHVlKSkge1xuICAgICAgICAgICAgLy8gSWYgd2UndmUgc2VlbiB0aGlzIG1vZHVsZSBiZWZvcmUgYW5kIGl0J3MgaW5jbHVkZWQgaW50byBcImFmZmVjdGVkIG1vZHVsZXNcIiBsaXN0LCBtYXJrXG4gICAgICAgICAgICAvLyB0aGUgd2hvbGUgcGF0aCB0aGF0IGxlYWRzIHRvIHRoYXQgbW9kdWxlIGFzIGFmZmVjdGVkLCBidXQgZG8gbm90IGRlc2NlbmQgaW50byBpdHNcbiAgICAgICAgICAgIC8vIGltcG9ydHMsIHNpbmNlIHdlIGFscmVhZHkgZXhhbWluZWQgdGhlbSBiZWZvcmUuXG4gICAgICAgICAgICBpZiAoYWZmZWN0ZWRNb2R1bGVzLmhhcyh2YWx1ZSkpIHtcbiAgICAgICAgICAgICAgcGF0aC5mb3JFYWNoKGl0ZW0gPT4gYWZmZWN0ZWRNb2R1bGVzLmFkZChpdGVtKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgc2Vlbk1vZHVsZXMuYWRkKHZhbHVlKTtcbiAgICAgICAgICBpZiAodGhpcy5vdmVycmlkZGVuTW9kdWxlcy5oYXModmFsdWUpKSB7XG4gICAgICAgICAgICBwYXRoLmZvckVhY2goaXRlbSA9PiBhZmZlY3RlZE1vZHVsZXMuYWRkKGl0ZW0pKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgLy8gRXhhbWluZSBtb2R1bGUgaW1wb3J0cyByZWN1cnNpdmVseSB0byBsb29rIGZvciBvdmVycmlkZGVuIG1vZHVsZXMuXG4gICAgICAgICAgY29uc3QgbW9kdWxlRGVmID0gKHZhbHVlIGFzIGFueSlbTkdfTU9EX0RFRl07XG4gICAgICAgICAgY2FsY0FmZmVjdGVkTW9kdWxlc1JlY3VyKG1heWJlVW53cmFwRm4obW9kdWxlRGVmLmltcG9ydHMpLCBwYXRoLmNvbmNhdCh2YWx1ZSkpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfTtcbiAgICBjYWxjQWZmZWN0ZWRNb2R1bGVzUmVjdXIoYXJyLCBbXSk7XG4gICAgcmV0dXJuIGFmZmVjdGVkTW9kdWxlcztcbiAgfVxuXG4gIHByaXZhdGUgbWF5YmVTdG9yZU5nRGVmKHByb3A6IHN0cmluZywgdHlwZTogVHlwZTxhbnk+KSB7XG4gICAgaWYgKCF0aGlzLmluaXRpYWxOZ0RlZnMuaGFzKHR5cGUpKSB7XG4gICAgICBjb25zdCBjdXJyZW50RGVmID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcih0eXBlLCBwcm9wKTtcbiAgICAgIHRoaXMuaW5pdGlhbE5nRGVmcy5zZXQodHlwZSwgW3Byb3AsIGN1cnJlbnREZWZdKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIHN0b3JlRmllbGRPZkRlZk9uVHlwZSh0eXBlOiBUeXBlPGFueT4sIGRlZkZpZWxkOiBzdHJpbmcsIGZpZWxkTmFtZTogc3RyaW5nKTogdm9pZCB7XG4gICAgY29uc3QgZGVmOiBhbnkgPSAodHlwZSBhcyBhbnkpW2RlZkZpZWxkXTtcbiAgICBjb25zdCBvcmlnaW5hbFZhbHVlOiBhbnkgPSBkZWZbZmllbGROYW1lXTtcbiAgICB0aGlzLmRlZkNsZWFudXBPcHMucHVzaCh7b2JqZWN0OiBkZWYsIGZpZWxkTmFtZSwgb3JpZ2luYWxWYWx1ZX0pO1xuICB9XG5cbiAgLyoqXG4gICAqIENsZWFycyBjdXJyZW50IGNvbXBvbmVudHMgcmVzb2x1dGlvbiBxdWV1ZSwgYnV0IHN0b3JlcyB0aGUgc3RhdGUgb2YgdGhlIHF1ZXVlLCBzbyB3ZSBjYW5cbiAgICogcmVzdG9yZSBpdCBsYXRlci4gQ2xlYXJpbmcgdGhlIHF1ZXVlIGlzIHJlcXVpcmVkIGJlZm9yZSB3ZSB0cnkgdG8gY29tcGlsZSBjb21wb25lbnRzICh2aWFcbiAgICogYFRlc3RCZWQuY29tcGlsZUNvbXBvbmVudHNgKSwgc28gdGhhdCBjb21wb25lbnQgZGVmcyBhcmUgaW4gc3luYyB3aXRoIHRoZSByZXNvbHV0aW9uIHF1ZXVlLlxuICAgKi9cbiAgcHJpdmF0ZSBjbGVhckNvbXBvbmVudFJlc29sdXRpb25RdWV1ZSgpIHtcbiAgICBpZiAodGhpcy5vcmlnaW5hbENvbXBvbmVudFJlc29sdXRpb25RdWV1ZSA9PT0gbnVsbCkge1xuICAgICAgdGhpcy5vcmlnaW5hbENvbXBvbmVudFJlc29sdXRpb25RdWV1ZSA9IG5ldyBNYXAoKTtcbiAgICB9XG4gICAgY2xlYXJSZXNvbHV0aW9uT2ZDb21wb25lbnRSZXNvdXJjZXNRdWV1ZSgpLmZvckVhY2goXG4gICAgICAgICh2YWx1ZSwga2V5KSA9PiB0aGlzLm9yaWdpbmFsQ29tcG9uZW50UmVzb2x1dGlvblF1ZXVlIS5zZXQoa2V5LCB2YWx1ZSkpO1xuICB9XG5cbiAgLypcbiAgICogUmVzdG9yZXMgY29tcG9uZW50IHJlc29sdXRpb24gcXVldWUgdG8gdGhlIHByZXZpb3VzbHkgc2F2ZWQgc3RhdGUuIFRoaXMgb3BlcmF0aW9uIGlzIHBlcmZvcm1lZFxuICAgKiBhcyBhIHBhcnQgb2YgcmVzdG9yaW5nIHRoZSBzdGF0ZSBhZnRlciBjb21wbGV0aW9uIG9mIHRoZSBjdXJyZW50IHNldCBvZiB0ZXN0cyAodGhhdCBtaWdodFxuICAgKiBwb3RlbnRpYWxseSBtdXRhdGUgdGhlIHN0YXRlKS5cbiAgICovXG4gIHByaXZhdGUgcmVzdG9yZUNvbXBvbmVudFJlc29sdXRpb25RdWV1ZSgpIHtcbiAgICBpZiAodGhpcy5vcmlnaW5hbENvbXBvbmVudFJlc29sdXRpb25RdWV1ZSAhPT0gbnVsbCkge1xuICAgICAgcmVzdG9yZUNvbXBvbmVudFJlc29sdXRpb25RdWV1ZSh0aGlzLm9yaWdpbmFsQ29tcG9uZW50UmVzb2x1dGlvblF1ZXVlKTtcbiAgICAgIHRoaXMub3JpZ2luYWxDb21wb25lbnRSZXNvbHV0aW9uUXVldWUgPSBudWxsO1xuICAgIH1cbiAgfVxuXG4gIHJlc3RvcmVPcmlnaW5hbFN0YXRlKCk6IHZvaWQge1xuICAgIC8vIFByb2Nlc3MgY2xlYW51cCBvcHMgaW4gcmV2ZXJzZSBvcmRlciBzbyB0aGUgZmllbGQncyBvcmlnaW5hbCB2YWx1ZSBpcyByZXN0b3JlZCBjb3JyZWN0bHkgKGluXG4gICAgLy8gY2FzZSB0aGVyZSB3ZXJlIG11bHRpcGxlIG92ZXJyaWRlcyBmb3IgdGhlIHNhbWUgZmllbGQpLlxuICAgIGZvckVhY2hSaWdodCh0aGlzLmRlZkNsZWFudXBPcHMsIChvcDogQ2xlYW51cE9wZXJhdGlvbikgPT4ge1xuICAgICAgb3Aub2JqZWN0W29wLmZpZWxkTmFtZV0gPSBvcC5vcmlnaW5hbFZhbHVlO1xuICAgIH0pO1xuICAgIC8vIFJlc3RvcmUgaW5pdGlhbCBjb21wb25lbnQvZGlyZWN0aXZlL3BpcGUgZGVmc1xuICAgIHRoaXMuaW5pdGlhbE5nRGVmcy5mb3JFYWNoKCh2YWx1ZTogW3N0cmluZywgUHJvcGVydHlEZXNjcmlwdG9yfHVuZGVmaW5lZF0sIHR5cGU6IFR5cGU8YW55PikgPT4ge1xuICAgICAgY29uc3QgW3Byb3AsIGRlc2NyaXB0b3JdID0gdmFsdWU7XG4gICAgICBpZiAoIWRlc2NyaXB0b3IpIHtcbiAgICAgICAgLy8gRGVsZXRlIG9wZXJhdGlvbnMgYXJlIGdlbmVyYWxseSB1bmRlc2lyYWJsZSBzaW5jZSB0aGV5IGhhdmUgcGVyZm9ybWFuY2UgaW1wbGljYXRpb25zXG4gICAgICAgIC8vIG9uIG9iamVjdHMgdGhleSB3ZXJlIGFwcGxpZWQgdG8uIEluIHRoaXMgcGFydGljdWxhciBjYXNlLCBzaXR1YXRpb25zIHdoZXJlIHRoaXMgY29kZVxuICAgICAgICAvLyBpcyBpbnZva2VkIHNob3VsZCBiZSBxdWl0ZSByYXJlIHRvIGNhdXNlIGFueSBub3RpY2VhYmxlIGltcGFjdCwgc2luY2UgaXQncyBhcHBsaWVkXG4gICAgICAgIC8vIG9ubHkgdG8gc29tZSB0ZXN0IGNhc2VzIChmb3IgZXhhbXBsZSB3aGVuIGNsYXNzIHdpdGggbm8gYW5ub3RhdGlvbnMgZXh0ZW5kcyBzb21lXG4gICAgICAgIC8vIEBDb21wb25lbnQpIHdoZW4gd2UgbmVlZCB0byBjbGVhciAnybVjbXAnIGZpZWxkIG9uIGEgZ2l2ZW4gY2xhc3MgdG8gcmVzdG9yZVxuICAgICAgICAvLyBpdHMgb3JpZ2luYWwgc3RhdGUgKGJlZm9yZSBhcHBseWluZyBvdmVycmlkZXMgYW5kIHJ1bm5pbmcgdGVzdHMpLlxuICAgICAgICBkZWxldGUgKHR5cGUgYXMgYW55KVtwcm9wXTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0eXBlLCBwcm9wLCBkZXNjcmlwdG9yKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICB0aGlzLmluaXRpYWxOZ0RlZnMuY2xlYXIoKTtcbiAgICB0aGlzLm1vZHVsZVByb3ZpZGVyc092ZXJyaWRkZW4uY2xlYXIoKTtcbiAgICB0aGlzLnJlc3RvcmVDb21wb25lbnRSZXNvbHV0aW9uUXVldWUoKTtcbiAgICAvLyBSZXN0b3JlIHRoZSBsb2NhbGUgSUQgdG8gdGhlIGRlZmF1bHQgdmFsdWUsIHRoaXMgc2hvdWxkbid0IGJlIG5lY2Vzc2FyeSBidXQgd2UgbmV2ZXIga25vd1xuICAgIHNldExvY2FsZUlkKERFRkFVTFRfTE9DQUxFX0lEKTtcbiAgfVxuXG4gIHByaXZhdGUgY29tcGlsZVRlc3RNb2R1bGUoKTogdm9pZCB7XG4gICAgY2xhc3MgUm9vdFNjb3BlTW9kdWxlIHt9XG4gICAgY29tcGlsZU5nTW9kdWxlRGVmcyhSb290U2NvcGVNb2R1bGUgYXMgTmdNb2R1bGVUeXBlPGFueT4sIHtcbiAgICAgIHByb3ZpZGVyczogWy4uLnRoaXMucm9vdFByb3ZpZGVyT3ZlcnJpZGVzXSxcbiAgICB9KTtcblxuICAgIGNvbnN0IG5nWm9uZSA9IG5ldyBOZ1pvbmUoe2VuYWJsZUxvbmdTdGFja1RyYWNlOiB0cnVlfSk7XG4gICAgY29uc3QgcHJvdmlkZXJzOiBQcm92aWRlcltdID0gW1xuICAgICAge3Byb3ZpZGU6IE5nWm9uZSwgdXNlVmFsdWU6IG5nWm9uZX0sXG4gICAgICB7cHJvdmlkZTogQ29tcGlsZXIsIHVzZUZhY3Rvcnk6ICgpID0+IG5ldyBSM1Rlc3RDb21waWxlcih0aGlzKX0sXG4gICAgICAuLi50aGlzLnByb3ZpZGVycyxcbiAgICAgIC4uLnRoaXMucHJvdmlkZXJPdmVycmlkZXMsXG4gICAgXTtcbiAgICBjb25zdCBpbXBvcnRzID0gW1Jvb3RTY29wZU1vZHVsZSwgdGhpcy5hZGRpdGlvbmFsTW9kdWxlVHlwZXMsIHRoaXMuaW1wb3J0cyB8fCBbXV07XG5cbiAgICAvLyBjbGFuZy1mb3JtYXQgb2ZmXG4gICAgY29tcGlsZU5nTW9kdWxlRGVmcyh0aGlzLnRlc3RNb2R1bGVUeXBlLCB7XG4gICAgICBkZWNsYXJhdGlvbnM6IHRoaXMuZGVjbGFyYXRpb25zLFxuICAgICAgaW1wb3J0cyxcbiAgICAgIHNjaGVtYXM6IHRoaXMuc2NoZW1hcyxcbiAgICAgIHByb3ZpZGVycyxcbiAgICB9LCAvKiBhbGxvd0R1cGxpY2F0ZURlY2xhcmF0aW9uc0luUm9vdCAqLyB0cnVlKTtcbiAgICAvLyBjbGFuZy1mb3JtYXQgb25cblxuICAgIHRoaXMuYXBwbHlQcm92aWRlck92ZXJyaWRlc1RvTW9kdWxlKHRoaXMudGVzdE1vZHVsZVR5cGUpO1xuICB9XG5cbiAgZ2V0IGluamVjdG9yKCk6IEluamVjdG9yIHtcbiAgICBpZiAodGhpcy5faW5qZWN0b3IgIT09IG51bGwpIHtcbiAgICAgIHJldHVybiB0aGlzLl9pbmplY3RvcjtcbiAgICB9XG5cbiAgICBjb25zdCBwcm92aWRlcnM6IFByb3ZpZGVyW10gPSBbXTtcbiAgICBjb25zdCBjb21waWxlck9wdGlvbnMgPSB0aGlzLnBsYXRmb3JtLmluamVjdG9yLmdldChDT01QSUxFUl9PUFRJT05TKTtcbiAgICBjb21waWxlck9wdGlvbnMuZm9yRWFjaChvcHRzID0+IHtcbiAgICAgIGlmIChvcHRzLnByb3ZpZGVycykge1xuICAgICAgICBwcm92aWRlcnMucHVzaChvcHRzLnByb3ZpZGVycyk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgaWYgKHRoaXMuY29tcGlsZXJQcm92aWRlcnMgIT09IG51bGwpIHtcbiAgICAgIHByb3ZpZGVycy5wdXNoKC4uLnRoaXMuY29tcGlsZXJQcm92aWRlcnMpO1xuICAgIH1cblxuICAgIC8vIFRPRE8ob2NvbWJlKTogbWFrZSB0aGlzIHdvcmsgd2l0aCBhbiBJbmplY3RvciBkaXJlY3RseSBpbnN0ZWFkIG9mIGNyZWF0aW5nIGEgbW9kdWxlIGZvciBpdFxuICAgIGNsYXNzIENvbXBpbGVyTW9kdWxlIHt9XG4gICAgY29tcGlsZU5nTW9kdWxlRGVmcyhDb21waWxlck1vZHVsZSBhcyBOZ01vZHVsZVR5cGU8YW55Piwge3Byb3ZpZGVyc30pO1xuXG4gICAgY29uc3QgQ29tcGlsZXJNb2R1bGVGYWN0b3J5ID0gbmV3IFIzTmdNb2R1bGVGYWN0b3J5KENvbXBpbGVyTW9kdWxlKTtcbiAgICB0aGlzLl9pbmplY3RvciA9IENvbXBpbGVyTW9kdWxlRmFjdG9yeS5jcmVhdGUodGhpcy5wbGF0Zm9ybS5pbmplY3RvcikuaW5qZWN0b3I7XG4gICAgcmV0dXJuIHRoaXMuX2luamVjdG9yO1xuICB9XG5cbiAgLy8gZ2V0IG92ZXJyaWRlcyBmb3IgYSBzcGVjaWZpYyBwcm92aWRlciAoaWYgYW55KVxuICBwcml2YXRlIGdldFNpbmdsZVByb3ZpZGVyT3ZlcnJpZGVzKHByb3ZpZGVyOiBQcm92aWRlcik6IFByb3ZpZGVyfG51bGwge1xuICAgIGNvbnN0IHRva2VuID0gZ2V0UHJvdmlkZXJUb2tlbihwcm92aWRlcik7XG4gICAgcmV0dXJuIHRoaXMucHJvdmlkZXJPdmVycmlkZXNCeVRva2VuLmdldCh0b2tlbikgfHwgbnVsbDtcbiAgfVxuXG4gIHByaXZhdGUgZ2V0UHJvdmlkZXJPdmVycmlkZXMocHJvdmlkZXJzPzogUHJvdmlkZXJbXSk6IFByb3ZpZGVyW10ge1xuICAgIGlmICghcHJvdmlkZXJzIHx8ICFwcm92aWRlcnMubGVuZ3RoIHx8IHRoaXMucHJvdmlkZXJPdmVycmlkZXNCeVRva2VuLnNpemUgPT09IDApIHJldHVybiBbXTtcbiAgICAvLyBUaGVyZSBhcmUgdHdvIGZsYXR0ZW5pbmcgb3BlcmF0aW9ucyBoZXJlLiBUaGUgaW5uZXIgZmxhdHRlbigpIG9wZXJhdGVzIG9uIHRoZSBtZXRhZGF0YSdzXG4gICAgLy8gcHJvdmlkZXJzIGFuZCBhcHBsaWVzIGEgbWFwcGluZyBmdW5jdGlvbiB3aGljaCByZXRyaWV2ZXMgb3ZlcnJpZGVzIGZvciBlYWNoIGluY29taW5nXG4gICAgLy8gcHJvdmlkZXIuIFRoZSBvdXRlciBmbGF0dGVuKCkgdGhlbiBmbGF0dGVucyB0aGUgcHJvZHVjZWQgb3ZlcnJpZGVzIGFycmF5LiBJZiB0aGlzIGlzIG5vdFxuICAgIC8vIGRvbmUsIHRoZSBhcnJheSBjYW4gY29udGFpbiBvdGhlciBlbXB0eSBhcnJheXMgKGUuZy4gYFtbXSwgW11dYCkgd2hpY2ggbGVhayBpbnRvIHRoZVxuICAgIC8vIHByb3ZpZGVycyBhcnJheSBhbmQgY29udGFtaW5hdGUgYW55IGVycm9yIG1lc3NhZ2VzIHRoYXQgbWlnaHQgYmUgZ2VuZXJhdGVkLlxuICAgIHJldHVybiBmbGF0dGVuKGZsYXR0ZW4oXG4gICAgICAgIHByb3ZpZGVycywgKHByb3ZpZGVyOiBQcm92aWRlcikgPT4gdGhpcy5nZXRTaW5nbGVQcm92aWRlck92ZXJyaWRlcyhwcm92aWRlcikgfHwgW10pKTtcbiAgfVxuXG4gIHByaXZhdGUgZ2V0T3ZlcnJpZGRlblByb3ZpZGVycyhwcm92aWRlcnM/OiBQcm92aWRlcltdKTogUHJvdmlkZXJbXSB7XG4gICAgaWYgKCFwcm92aWRlcnMgfHwgIXByb3ZpZGVycy5sZW5ndGggfHwgdGhpcy5wcm92aWRlck92ZXJyaWRlc0J5VG9rZW4uc2l6ZSA9PT0gMCkgcmV0dXJuIFtdO1xuXG4gICAgY29uc3QgZmxhdHRlbmVkUHJvdmlkZXJzID0gZmxhdHRlbjxQcm92aWRlcltdPihwcm92aWRlcnMpO1xuICAgIGNvbnN0IG92ZXJyaWRlcyA9IHRoaXMuZ2V0UHJvdmlkZXJPdmVycmlkZXMoZmxhdHRlbmVkUHJvdmlkZXJzKTtcbiAgICBjb25zdCBvdmVycmlkZGVuUHJvdmlkZXJzID0gWy4uLmZsYXR0ZW5lZFByb3ZpZGVycywgLi4ub3ZlcnJpZGVzXTtcbiAgICBjb25zdCBmaW5hbDogUHJvdmlkZXJbXSA9IFtdO1xuICAgIGNvbnN0IHNlZW5PdmVycmlkZGVuUHJvdmlkZXJzID0gbmV3IFNldDxQcm92aWRlcj4oKTtcblxuICAgIC8vIFdlIGl0ZXJhdGUgdGhyb3VnaCB0aGUgbGlzdCBvZiBwcm92aWRlcnMgaW4gcmV2ZXJzZSBvcmRlciB0byBtYWtlIHN1cmUgcHJvdmlkZXIgb3ZlcnJpZGVzXG4gICAgLy8gdGFrZSBwcmVjZWRlbmNlIG92ZXIgdGhlIHZhbHVlcyBkZWZpbmVkIGluIHByb3ZpZGVyIGxpc3QuIFdlIGFsc28gZmlsdGVyIG91dCBhbGwgcHJvdmlkZXJzXG4gICAgLy8gdGhhdCBoYXZlIG92ZXJyaWRlcywga2VlcGluZyBvdmVycmlkZGVuIHZhbHVlcyBvbmx5LiBUaGlzIGlzIG5lZWRlZCwgc2luY2UgcHJlc2VuY2Ugb2YgYVxuICAgIC8vIHByb3ZpZGVyIHdpdGggYG5nT25EZXN0cm95YCBob29rIHdpbGwgY2F1c2UgdGhpcyBob29rIHRvIGJlIHJlZ2lzdGVyZWQgYW5kIGludm9rZWQgbGF0ZXIuXG4gICAgZm9yRWFjaFJpZ2h0KG92ZXJyaWRkZW5Qcm92aWRlcnMsIChwcm92aWRlcjogYW55KSA9PiB7XG4gICAgICBjb25zdCB0b2tlbjogYW55ID0gZ2V0UHJvdmlkZXJUb2tlbihwcm92aWRlcik7XG4gICAgICBpZiAodGhpcy5wcm92aWRlck92ZXJyaWRlc0J5VG9rZW4uaGFzKHRva2VuKSkge1xuICAgICAgICBpZiAoIXNlZW5PdmVycmlkZGVuUHJvdmlkZXJzLmhhcyh0b2tlbikpIHtcbiAgICAgICAgICBzZWVuT3ZlcnJpZGRlblByb3ZpZGVycy5hZGQodG9rZW4pO1xuICAgICAgICAgIC8vIFRyZWF0IGFsbCBvdmVycmlkZGVuIHByb3ZpZGVycyBhcyBge211bHRpOiBmYWxzZX1gIChldmVuIGlmIGl0J3MgYSBtdWx0aS1wcm92aWRlcikgdG9cbiAgICAgICAgICAvLyBtYWtlIHN1cmUgdGhhdCBwcm92aWRlZCBvdmVycmlkZSB0YWtlcyBoaWdoZXN0IHByZWNlZGVuY2UgYW5kIGlzIG5vdCBjb21iaW5lZCB3aXRoXG4gICAgICAgICAgLy8gb3RoZXIgaW5zdGFuY2VzIG9mIHRoZSBzYW1lIG11bHRpIHByb3ZpZGVyLlxuICAgICAgICAgIGZpbmFsLnVuc2hpZnQoey4uLnByb3ZpZGVyLCBtdWx0aTogZmFsc2V9KTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZmluYWwudW5zaGlmdChwcm92aWRlcik7XG4gICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIGZpbmFsO1xuICB9XG5cbiAgcHJpdmF0ZSBoYXNQcm92aWRlck92ZXJyaWRlcyhwcm92aWRlcnM/OiBQcm92aWRlcltdKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0UHJvdmlkZXJPdmVycmlkZXMocHJvdmlkZXJzKS5sZW5ndGggPiAwO1xuICB9XG5cbiAgcHJpdmF0ZSBwYXRjaERlZldpdGhQcm92aWRlck92ZXJyaWRlcyhkZWNsYXJhdGlvbjogVHlwZTxhbnk+LCBmaWVsZDogc3RyaW5nKTogdm9pZCB7XG4gICAgY29uc3QgZGVmID0gKGRlY2xhcmF0aW9uIGFzIGFueSlbZmllbGRdO1xuICAgIGlmIChkZWYgJiYgZGVmLnByb3ZpZGVyc1Jlc29sdmVyKSB7XG4gICAgICB0aGlzLm1heWJlU3RvcmVOZ0RlZihmaWVsZCwgZGVjbGFyYXRpb24pO1xuXG4gICAgICBjb25zdCByZXNvbHZlciA9IGRlZi5wcm92aWRlcnNSZXNvbHZlcjtcbiAgICAgIGNvbnN0IHByb2Nlc3NQcm92aWRlcnNGbiA9IChwcm92aWRlcnM6IFByb3ZpZGVyW10pID0+IHRoaXMuZ2V0T3ZlcnJpZGRlblByb3ZpZGVycyhwcm92aWRlcnMpO1xuICAgICAgdGhpcy5zdG9yZUZpZWxkT2ZEZWZPblR5cGUoZGVjbGFyYXRpb24sIGZpZWxkLCAncHJvdmlkZXJzUmVzb2x2ZXInKTtcbiAgICAgIGRlZi5wcm92aWRlcnNSZXNvbHZlciA9IChuZ0RlZjogRGlyZWN0aXZlRGVmPGFueT4pID0+IHJlc29sdmVyKG5nRGVmLCBwcm9jZXNzUHJvdmlkZXJzRm4pO1xuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBpbml0UmVzb2x2ZXJzKCk6IFJlc29sdmVycyB7XG4gIHJldHVybiB7XG4gICAgbW9kdWxlOiBuZXcgTmdNb2R1bGVSZXNvbHZlcigpLFxuICAgIGNvbXBvbmVudDogbmV3IENvbXBvbmVudFJlc29sdmVyKCksXG4gICAgZGlyZWN0aXZlOiBuZXcgRGlyZWN0aXZlUmVzb2x2ZXIoKSxcbiAgICBwaXBlOiBuZXcgUGlwZVJlc29sdmVyKClcbiAgfTtcbn1cblxuZnVuY3Rpb24gaGFzTmdNb2R1bGVEZWY8VD4odmFsdWU6IFR5cGU8VD4pOiB2YWx1ZSBpcyBOZ01vZHVsZVR5cGU8VD4ge1xuICByZXR1cm4gdmFsdWUuaGFzT3duUHJvcGVydHkoJ8m1bW9kJyk7XG59XG5cbmZ1bmN0aW9uIG1heWJlVW53cmFwRm48VD4obWF5YmVGbjogKCgpID0+IFQpfFQpOiBUIHtcbiAgcmV0dXJuIG1heWJlRm4gaW5zdGFuY2VvZiBGdW5jdGlvbiA/IG1heWJlRm4oKSA6IG1heWJlRm47XG59XG5cbmZ1bmN0aW9uIGZsYXR0ZW48VD4odmFsdWVzOiBhbnlbXSwgbWFwRm4/OiAodmFsdWU6IFQpID0+IGFueSk6IFRbXSB7XG4gIGNvbnN0IG91dDogVFtdID0gW107XG4gIHZhbHVlcy5mb3JFYWNoKHZhbHVlID0+IHtcbiAgICBpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHtcbiAgICAgIG91dC5wdXNoKC4uLmZsYXR0ZW48VD4odmFsdWUsIG1hcEZuKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG91dC5wdXNoKG1hcEZuID8gbWFwRm4odmFsdWUpIDogdmFsdWUpO1xuICAgIH1cbiAgfSk7XG4gIHJldHVybiBvdXQ7XG59XG5cbmZ1bmN0aW9uIGdldFByb3ZpZGVyRmllbGQocHJvdmlkZXI6IFByb3ZpZGVyLCBmaWVsZDogc3RyaW5nKSB7XG4gIHJldHVybiBwcm92aWRlciAmJiB0eXBlb2YgcHJvdmlkZXIgPT09ICdvYmplY3QnICYmIChwcm92aWRlciBhcyBhbnkpW2ZpZWxkXTtcbn1cblxuZnVuY3Rpb24gZ2V0UHJvdmlkZXJUb2tlbihwcm92aWRlcjogUHJvdmlkZXIpIHtcbiAgcmV0dXJuIGdldFByb3ZpZGVyRmllbGQocHJvdmlkZXIsICdwcm92aWRlJykgfHwgcHJvdmlkZXI7XG59XG5cbmZ1bmN0aW9uIGlzTW9kdWxlV2l0aFByb3ZpZGVycyh2YWx1ZTogYW55KTogdmFsdWUgaXMgTW9kdWxlV2l0aFByb3ZpZGVyczxhbnk+IHtcbiAgcmV0dXJuIHZhbHVlLmhhc093blByb3BlcnR5KCduZ01vZHVsZScpO1xufVxuXG5mdW5jdGlvbiBmb3JFYWNoUmlnaHQ8VD4odmFsdWVzOiBUW10sIGZuOiAodmFsdWU6IFQsIGlkeDogbnVtYmVyKSA9PiB2b2lkKTogdm9pZCB7XG4gIGZvciAobGV0IGlkeCA9IHZhbHVlcy5sZW5ndGggLSAxOyBpZHggPj0gMDsgaWR4LS0pIHtcbiAgICBmbih2YWx1ZXNbaWR4XSwgaWR4KTtcbiAgfVxufVxuXG5mdW5jdGlvbiBpbnZhbGlkVHlwZUVycm9yKG5hbWU6IHN0cmluZywgZXhwZWN0ZWRUeXBlOiBzdHJpbmcpOiBFcnJvciB7XG4gIHJldHVybiBuZXcgRXJyb3IoYCR7bmFtZX0gY2xhc3MgZG9lc24ndCBoYXZlIEAke2V4cGVjdGVkVHlwZX0gZGVjb3JhdG9yIG9yIGlzIG1pc3NpbmcgbWV0YWRhdGEuYCk7XG59XG5cbmNsYXNzIFIzVGVzdENvbXBpbGVyIGltcGxlbWVudHMgQ29tcGlsZXIge1xuICBjb25zdHJ1Y3Rvcihwcml2YXRlIHRlc3RCZWQ6IFIzVGVzdEJlZENvbXBpbGVyKSB7fVxuXG4gIGNvbXBpbGVNb2R1bGVTeW5jPFQ+KG1vZHVsZVR5cGU6IFR5cGU8VD4pOiBOZ01vZHVsZUZhY3Rvcnk8VD4ge1xuICAgIHRoaXMudGVzdEJlZC5fY29tcGlsZU5nTW9kdWxlU3luYyhtb2R1bGVUeXBlKTtcbiAgICByZXR1cm4gbmV3IFIzTmdNb2R1bGVGYWN0b3J5KG1vZHVsZVR5cGUpO1xuICB9XG5cbiAgYXN5bmMgY29tcGlsZU1vZHVsZUFzeW5jPFQ+KG1vZHVsZVR5cGU6IFR5cGU8VD4pOiBQcm9taXNlPE5nTW9kdWxlRmFjdG9yeTxUPj4ge1xuICAgIGF3YWl0IHRoaXMudGVzdEJlZC5fY29tcGlsZU5nTW9kdWxlQXN5bmMobW9kdWxlVHlwZSk7XG4gICAgcmV0dXJuIG5ldyBSM05nTW9kdWxlRmFjdG9yeShtb2R1bGVUeXBlKTtcbiAgfVxuXG4gIGNvbXBpbGVNb2R1bGVBbmRBbGxDb21wb25lbnRzU3luYzxUPihtb2R1bGVUeXBlOiBUeXBlPFQ+KTogTW9kdWxlV2l0aENvbXBvbmVudEZhY3RvcmllczxUPiB7XG4gICAgY29uc3QgbmdNb2R1bGVGYWN0b3J5ID0gdGhpcy5jb21waWxlTW9kdWxlU3luYyhtb2R1bGVUeXBlKTtcbiAgICBjb25zdCBjb21wb25lbnRGYWN0b3JpZXMgPSB0aGlzLnRlc3RCZWQuX2dldENvbXBvbmVudEZhY3Rvcmllcyhtb2R1bGVUeXBlIGFzIE5nTW9kdWxlVHlwZTxUPik7XG4gICAgcmV0dXJuIG5ldyBNb2R1bGVXaXRoQ29tcG9uZW50RmFjdG9yaWVzKG5nTW9kdWxlRmFjdG9yeSwgY29tcG9uZW50RmFjdG9yaWVzKTtcbiAgfVxuXG4gIGFzeW5jIGNvbXBpbGVNb2R1bGVBbmRBbGxDb21wb25lbnRzQXN5bmM8VD4obW9kdWxlVHlwZTogVHlwZTxUPik6XG4gICAgICBQcm9taXNlPE1vZHVsZVdpdGhDb21wb25lbnRGYWN0b3JpZXM8VD4+IHtcbiAgICBjb25zdCBuZ01vZHVsZUZhY3RvcnkgPSBhd2FpdCB0aGlzLmNvbXBpbGVNb2R1bGVBc3luYyhtb2R1bGVUeXBlKTtcbiAgICBjb25zdCBjb21wb25lbnRGYWN0b3JpZXMgPSB0aGlzLnRlc3RCZWQuX2dldENvbXBvbmVudEZhY3Rvcmllcyhtb2R1bGVUeXBlIGFzIE5nTW9kdWxlVHlwZTxUPik7XG4gICAgcmV0dXJuIG5ldyBNb2R1bGVXaXRoQ29tcG9uZW50RmFjdG9yaWVzKG5nTW9kdWxlRmFjdG9yeSwgY29tcG9uZW50RmFjdG9yaWVzKTtcbiAgfVxuXG4gIGNsZWFyQ2FjaGUoKTogdm9pZCB7fVxuXG4gIGNsZWFyQ2FjaGVGb3IodHlwZTogVHlwZTxhbnk+KTogdm9pZCB7fVxuXG4gIGdldE1vZHVsZUlkKG1vZHVsZVR5cGU6IFR5cGU8YW55Pik6IHN0cmluZ3x1bmRlZmluZWQge1xuICAgIGNvbnN0IG1ldGEgPSB0aGlzLnRlc3RCZWQuX2dldE1vZHVsZVJlc29sdmVyKCkucmVzb2x2ZShtb2R1bGVUeXBlKTtcbiAgICByZXR1cm4gbWV0YSAmJiBtZXRhLmlkIHx8IHVuZGVmaW5lZDtcbiAgfVxufVxuIl19