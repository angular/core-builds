/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ResourceLoader } from '@angular/compiler';
import { ApplicationInitStatus, Compiler, COMPILER_OPTIONS, Injector, LOCALE_ID, ModuleWithComponentFactories, provideZoneChangeDetection, resolveForwardRef, ɵclearResolutionOfComponentResourcesQueue, ɵcompileComponent as compileComponent, ɵcompileDirective as compileDirective, ɵcompileNgModuleDefs as compileNgModuleDefs, ɵcompilePipe as compilePipe, ɵDEFAULT_LOCALE_ID as DEFAULT_LOCALE_ID, ɵDEFER_BLOCK_CONFIG as DEFER_BLOCK_CONFIG, ɵDeferBlockBehavior as DeferBlockBehavior, ɵdepsTracker as depsTracker, ɵgenerateStandaloneInDeclarationsError, ɵgetAsyncClassMetadataFn as getAsyncClassMetadataFn, ɵgetInjectableDef as getInjectableDef, ɵisComponentDefPendingResolution, ɵisEnvironmentProviders as isEnvironmentProviders, ɵNG_COMP_DEF as NG_COMP_DEF, ɵNG_DIR_DEF as NG_DIR_DEF, ɵNG_INJ_DEF as NG_INJ_DEF, ɵNG_MOD_DEF as NG_MOD_DEF, ɵNG_PIPE_DEF as NG_PIPE_DEF, ɵNgModuleFactory as R3NgModuleFactory, ɵpatchComponentDefWithScope as patchComponentDefWithScope, ɵRender3ComponentFactory as ComponentFactory, ɵRender3NgModuleRef as NgModuleRef, ɵresolveComponentResources, ɵrestoreComponentResolutionQueue, ɵsetLocaleId as setLocaleId, ɵtransitiveScopesFor as transitiveScopesFor, ɵUSE_RUNTIME_DEPS_TRACKER_FOR_JIT as USE_RUNTIME_DEPS_TRACKER_FOR_JIT } from '@angular/core';
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
function assertNoStandaloneComponents(types, resolver, location) {
    types.forEach(type => {
        if (!getAsyncClassMetadataFn(type)) {
            const component = resolver.resolve(type);
            if (component && component.standalone) {
                throw new Error(ɵgenerateStandaloneInDeclarationsError(type, location));
            }
        }
    });
}
export class TestBedCompiler {
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
        // required to make sure we restore defs to their initial states between test runs.
        // Note: one class may have multiple defs (for example: ɵmod and ɵinj in case of an
        // NgModule), store all of them in a map.
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
        this.scopesWithOverriddenProviders = new Set();
        this.testModuleRef = null;
        this.deferBlockBehavior = DeferBlockBehavior.Manual;
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
            // Verify that there are no standalone components
            assertNoStandaloneComponents(moduleDef.declarations, this.resolvers.component, '"TestBed.configureTestingModule" call');
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
        this.deferBlockBehavior = moduleDef.deferBlockBehavior ?? DeferBlockBehavior.Manual;
    }
    overrideModule(ngModule, override) {
        if (USE_RUNTIME_DEPS_TRACKER_FOR_JIT) {
            depsTracker.clearScopeCacheFor(ngModule);
        }
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
        this.verifyNoStandaloneFlagOverrides(component, override);
        this.resolvers.component.addOverride(component, override);
        this.pendingComponents.add(component);
    }
    overrideDirective(directive, override) {
        this.verifyNoStandaloneFlagOverrides(directive, override);
        this.resolvers.directive.addOverride(directive, override);
        this.pendingDirectives.add(directive);
    }
    overridePipe(pipe, override) {
        this.verifyNoStandaloneFlagOverrides(pipe, override);
        this.resolvers.pipe.addOverride(pipe, override);
        this.pendingPipes.add(pipe);
    }
    verifyNoStandaloneFlagOverrides(type, override) {
        if (override.add?.hasOwnProperty('standalone') || override.set?.hasOwnProperty('standalone') ||
            override.remove?.hasOwnProperty('standalone')) {
            throw new Error(`An override for the ${type.name} class has the \`standalone\` flag. ` +
                `Changing the \`standalone\` flag via TestBed overrides is not supported.`);
        }
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
            return !!metadata.styleUrl || !!metadata.styleUrls?.length;
        };
        const overrideStyleUrls = !!def && !ɵisComponentDefPendingResolution(type) && hasStyleUrls();
        // In Ivy, compiling a component does not require knowing the module providing the
        // component's scope, so overrideTemplateUsingTestingModule can be implemented purely via
        // overrideComponent. Important: overriding template requires full Component re-compilation,
        // which may fail in case styleUrls are also present (thus Component is considered as required
        // resolution). In order to avoid this, we preemptively set styleUrls to an empty array,
        // preserve current styles available on Component def and restore styles back once compilation
        // is complete.
        const override = overrideStyleUrls ? { template, styles: [], styleUrls: [], styleUrl: undefined } : { template };
        this.overrideComponent(type, { set: override });
        if (overrideStyleUrls && def.styles && def.styles.length > 0) {
            this.existingComponentStyles.set(type, def.styles);
        }
        // Set the component's scope to be the testing module.
        this.componentToModuleScope.set(type, TestingModuleOverride.OVERRIDE_TEMPLATE);
    }
    async resolvePendingComponentsWithAsyncMetadata() {
        if (this.pendingComponents.size === 0)
            return;
        const promises = [];
        for (const component of this.pendingComponents) {
            const asyncMetadataFn = getAsyncClassMetadataFn(component);
            if (asyncMetadataFn) {
                promises.push(asyncMetadataFn());
            }
        }
        const resolvedDeps = await Promise.all(promises);
        this.queueTypesFromModulesArray(resolvedDeps.flat(2));
    }
    async compileComponents() {
        this.clearComponentResolutionQueue();
        // Wait for all async metadata for components that were
        // overridden, we need resolved metadata to perform an override
        // and re-compile a component.
        await this.resolvePendingComponentsWithAsyncMetadata();
        // Verify that there were no standalone components present in the `declarations` field
        // during the `TestBed.configureTestingModule` call. We perform this check here in addition
        // to the logic in the `configureTestingModule` function, since at this point we have
        // all async metadata resolved.
        assertNoStandaloneComponents(this.declarations, this.resolvers.component, '"TestBed.configureTestingModule" call');
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
            await ɵresolveComponentResources(resolver);
        }
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
        this.testModuleRef = new NgModuleRef(this.testModuleType, parentInjector, []);
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
        this.applyProviderOverridesInScope(moduleType);
        this.applyTransitiveScopes();
    }
    /**
     * @internal
     */
    async _compileNgModuleAsync(moduleType) {
        this.queueTypesFromModulesArray([moduleType]);
        await this.compileComponents();
        this.applyProviderOverrides();
        this.applyProviderOverridesInScope(moduleType);
        this.applyTransitiveScopes();
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
            if (getAsyncClassMetadataFn(declaration)) {
                throw new Error(`Component '${declaration.name}' has unresolved metadata. ` +
                    `Please call \`await TestBed.compileComponents()\` before running this test.`);
            }
            needsAsyncResources = needsAsyncResources || ɵisComponentDefPendingResolution(declaration);
            const metadata = this.resolvers.component.resolve(declaration);
            if (metadata === null) {
                throw invalidTypeError(declaration.name, 'Component');
            }
            this.maybeStoreNgDef(NG_COMP_DEF, declaration);
            if (USE_RUNTIME_DEPS_TRACKER_FOR_JIT) {
                depsTracker.clearScopeCacheFor(declaration);
            }
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
            // collect all affected modules and reset scopes to force their re-calculation.
            const testingModuleDef = this.testModuleType[NG_MOD_DEF];
            const affectedModules = this.collectModulesAffectedByOverrides(testingModuleDef.imports);
            if (affectedModules.size > 0) {
                affectedModules.forEach(moduleType => {
                    if (!USE_RUNTIME_DEPS_TRACKER_FOR_JIT) {
                        this.storeFieldOfDefOnType(moduleType, NG_MOD_DEF, 'transitiveCompileScopes');
                        moduleType[NG_MOD_DEF].transitiveCompileScopes = null;
                    }
                    else {
                        depsTracker.clearScopeCacheFor(moduleType);
                    }
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
    /**
     * Applies provider overrides to a given type (either an NgModule or a standalone component)
     * and all imported NgModules and standalone components recursively.
     */
    applyProviderOverridesInScope(type) {
        const hasScope = isStandaloneComponent(type) || isNgModule(type);
        // The function can be re-entered recursively while inspecting dependencies
        // of an NgModule or a standalone component. Exit early if we come across a
        // type that can not have a scope (directive or pipe) or the type is already
        // processed earlier.
        if (!hasScope || this.scopesWithOverriddenProviders.has(type)) {
            return;
        }
        this.scopesWithOverriddenProviders.add(type);
        // NOTE: the line below triggers JIT compilation of the module injector,
        // which also invokes verification of the NgModule semantics, which produces
        // detailed error messages. The fact that the code relies on this line being
        // present here is suspicious and should be refactored in a way that the line
        // below can be moved (for ex. after an early exit check below).
        const injectorDef = type[NG_INJ_DEF];
        // No provider overrides, exit early.
        if (this.providerOverridesByToken.size === 0)
            return;
        if (isStandaloneComponent(type)) {
            // Visit all component dependencies and override providers there.
            const def = getComponentDef(type);
            const dependencies = maybeUnwrapFn(def.dependencies ?? []);
            for (const dependency of dependencies) {
                this.applyProviderOverridesInScope(dependency);
            }
        }
        else {
            const providers = [
                ...injectorDef.providers,
                ...(this.providerOverridesByModule.get(type) || [])
            ];
            if (this.hasProviderOverrides(providers)) {
                this.maybeStoreNgDef(NG_INJ_DEF, type);
                this.storeFieldOfDefOnType(type, NG_INJ_DEF, 'providers');
                injectorDef.providers = this.getOverriddenProviders(providers);
            }
            // Apply provider overrides to imported modules recursively
            const moduleDef = type[NG_MOD_DEF];
            const imports = maybeUnwrapFn(moduleDef.imports);
            for (const importedModule of imports) {
                this.applyProviderOverridesInScope(importedModule);
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
            if (ɵisComponentDefPendingResolution(type) || !type.hasOwnProperty(NG_COMP_DEF)) {
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
            //
            // Note: standalone components have no associated NgModule, so the `moduleType` can be `null`.
            if (moduleType !== null &&
                (!this.componentToModuleScope.has(type) ||
                    this.componentToModuleScope.get(type) === TestingModuleOverride.DECLARATION)) {
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
        // Because we may encounter the same NgModule or a standalone Component while processing
        // the dependencies of an NgModule or a standalone Component, we cache them in this set so we
        // can skip ones that have already been seen encountered. In some test setups, this caching
        // resulted in 10X runtime improvement.
        const processedDefs = new Set();
        const queueTypesFromModulesArrayRecur = (arr) => {
            for (const value of arr) {
                if (Array.isArray(value)) {
                    queueTypesFromModulesArrayRecur(value);
                }
                else if (hasNgModuleDef(value)) {
                    const def = value.ɵmod;
                    if (processedDefs.has(def)) {
                        continue;
                    }
                    processedDefs.add(def);
                    // Look through declarations, imports, and exports, and queue
                    // everything found there.
                    this.queueTypeArray(maybeUnwrapFn(def.declarations), value);
                    queueTypesFromModulesArrayRecur(maybeUnwrapFn(def.imports));
                    queueTypesFromModulesArrayRecur(maybeUnwrapFn(def.exports));
                }
                else if (isModuleWithProviders(value)) {
                    queueTypesFromModulesArrayRecur([value.ngModule]);
                }
                else if (isStandaloneComponent(value)) {
                    this.queueType(value, null);
                    const def = getComponentDef(value);
                    if (processedDefs.has(def)) {
                        continue;
                    }
                    processedDefs.add(def);
                    const dependencies = maybeUnwrapFn(def.dependencies ?? []);
                    dependencies.forEach((dependency) => {
                        // Note: in AOT, the `dependencies` might also contain regular
                        // (NgModule-based) Component, Directive and Pipes, so we handle
                        // them separately and proceed with recursive process for standalone
                        // Components and NgModules only.
                        if (isStandaloneComponent(dependency) || hasNgModuleDef(dependency)) {
                            queueTypesFromModulesArrayRecur([dependency]);
                        }
                        else {
                            this.queueType(dependency, null);
                        }
                    });
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
    /**
     * Preserve an original def (such as ɵmod, ɵinj, etc) before applying an override.
     * Note: one class may have multiple defs (for example: ɵmod and ɵinj in case of
     * an NgModule). If there is a def in a set already, don't override it, since
     * an original one should be restored at the end of a test.
     */
    maybeStoreNgDef(prop, type) {
        if (!this.initialNgDefs.has(type)) {
            this.initialNgDefs.set(type, new Map());
        }
        const currentDefs = this.initialNgDefs.get(type);
        if (!currentDefs.has(prop)) {
            const currentDef = Object.getOwnPropertyDescriptor(type, prop);
            currentDefs.set(prop, currentDef);
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
        ɵclearResolutionOfComponentResourcesQueue().forEach((value, key) => this.originalComponentResolutionQueue.set(key, value));
    }
    /*
     * Restores component resolution queue to the previously saved state. This operation is performed
     * as a part of restoring the state after completion of the current set of tests (that might
     * potentially mutate the state).
     */
    restoreComponentResolutionQueue() {
        if (this.originalComponentResolutionQueue !== null) {
            ɵrestoreComponentResolutionQueue(this.originalComponentResolutionQueue);
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
        this.initialNgDefs.forEach((defs, type) => {
            if (USE_RUNTIME_DEPS_TRACKER_FOR_JIT) {
                depsTracker.clearScopeCacheFor(type);
            }
            defs.forEach((descriptor, prop) => {
                if (!descriptor) {
                    // Delete operations are generally undesirable since they have performance
                    // implications on objects they were applied to. In this particular case, situations
                    // where this code is invoked should be quite rare to cause any noticeable impact,
                    // since it's applied only to some test cases (for example when class with no
                    // annotations extends some @Component) when we need to clear 'ɵcmp' field on a given
                    // class to restore its original state (before applying overrides and running tests).
                    delete type[prop];
                }
                else {
                    Object.defineProperty(type, prop, descriptor);
                }
            });
        });
        this.initialNgDefs.clear();
        this.scopesWithOverriddenProviders.clear();
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
        const providers = [
            provideZoneChangeDetection(),
            { provide: Compiler, useFactory: () => new R3TestCompiler(this) },
            { provide: DEFER_BLOCK_CONFIG, useValue: { behavior: this.deferBlockBehavior } },
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
        this.applyProviderOverridesInScope(this.testModuleType);
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
        this._injector = Injector.create({ providers, parent: this.platform.injector });
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
        // There are two flattening operations here. The inner flattenProviders() operates on the
        // metadata's providers and applies a mapping function which retrieves overrides for each
        // incoming provider. The outer flatten() then flattens the produced overrides array. If this is
        // not done, the array can contain other empty arrays (e.g. `[[], []]`) which leak into the
        // providers array and contaminate any error messages that might be generated.
        return flatten(flattenProviders(providers, (provider) => this.getSingleProviderOverrides(provider) || []));
    }
    getOverriddenProviders(providers) {
        if (!providers || !providers.length || this.providerOverridesByToken.size === 0)
            return [];
        const flattenedProviders = flattenProviders(providers);
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
                    final.unshift({ ...provider, multi: false });
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
function isStandaloneComponent(value) {
    const def = getComponentDef(value);
    return !!def?.standalone;
}
function getComponentDef(value) {
    return value.ɵcmp ?? null;
}
function hasNgModuleDef(value) {
    return value.hasOwnProperty('ɵmod');
}
function isNgModule(value) {
    return hasNgModuleDef(value);
}
function maybeUnwrapFn(maybeFn) {
    return maybeFn instanceof Function ? maybeFn() : maybeFn;
}
function flatten(values) {
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
function identityFn(value) {
    return value;
}
function flattenProviders(providers, mapFn = identityFn) {
    const out = [];
    for (let provider of providers) {
        if (isEnvironmentProviders(provider)) {
            provider = provider.ɵproviders;
        }
        if (Array.isArray(provider)) {
            out.push(...flattenProviders(provider, mapFn));
        }
        else {
            out.push(mapFn(provider));
        }
    }
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
    async compileModuleAsync(moduleType) {
        await this.testBed._compileNgModuleAsync(moduleType);
        return new R3NgModuleFactory(moduleType);
    }
    compileModuleAndAllComponentsSync(moduleType) {
        const ngModuleFactory = this.compileModuleSync(moduleType);
        const componentFactories = this.testBed._getComponentFactories(moduleType);
        return new ModuleWithComponentFactories(ngModuleFactory, componentFactories);
    }
    async compileModuleAndAllComponentsAsync(moduleType) {
        const ngModuleFactory = await this.compileModuleAsync(moduleType);
        const componentFactories = this.testBed._getComponentFactories(moduleType);
        return new ModuleWithComponentFactories(ngModuleFactory, componentFactories);
    }
    clearCache() { }
    clearCacheFor(type) { }
    getModuleId(moduleType) {
        const meta = this.testBed._getModuleResolver().resolve(moduleType);
        return meta && meta.id || undefined;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdF9iZWRfY29tcGlsZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3Rlc3Rpbmcvc3JjL3Rlc3RfYmVkX2NvbXBpbGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUNqRCxPQUFPLEVBQUMscUJBQXFCLEVBQUUsUUFBUSxFQUFFLGdCQUFnQixFQUF3QixRQUFRLEVBQWdCLFNBQVMsRUFBRSw0QkFBNEIsRUFBdUYsMEJBQTBCLEVBQUUsaUJBQWlCLEVBQXdCLHlDQUF5QyxFQUFFLGlCQUFpQixJQUFJLGdCQUFnQixFQUFFLGlCQUFpQixJQUFJLGdCQUFnQixFQUFFLG9CQUFvQixJQUFJLG1CQUFtQixFQUFFLFlBQVksSUFBSSxXQUFXLEVBQUUsa0JBQWtCLElBQUksaUJBQWlCLEVBQUUsbUJBQW1CLElBQUksa0JBQWtCLEVBQUUsbUJBQW1CLElBQUksa0JBQWtCLEVBQUUsWUFBWSxJQUFJLFdBQVcsRUFBaUMsc0NBQXNDLEVBQUUsd0JBQXdCLElBQUksdUJBQXVCLEVBQUUsaUJBQWlCLElBQUksZ0JBQWdCLEVBQWlFLGdDQUFnQyxFQUFFLHVCQUF1QixJQUFJLHNCQUFzQixFQUFFLFlBQVksSUFBSSxXQUFXLEVBQUUsV0FBVyxJQUFJLFVBQVUsRUFBRSxXQUFXLElBQUksVUFBVSxFQUFFLFdBQVcsSUFBSSxVQUFVLEVBQUUsWUFBWSxJQUFJLFdBQVcsRUFBRSxnQkFBZ0IsSUFBSSxpQkFBaUIsRUFBd0YsMkJBQTJCLElBQUksMEJBQTBCLEVBQUUsd0JBQXdCLElBQUksZ0JBQWdCLEVBQUUsbUJBQW1CLElBQUksV0FBVyxFQUFFLDBCQUEwQixFQUFFLGdDQUFnQyxFQUFFLFlBQVksSUFBSSxXQUFXLEVBQUUsb0JBQW9CLElBQUksbUJBQW1CLEVBQUUsaUNBQWlDLElBQUks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QUksQ0FBQyxPQUFPLENBQUMsc0JBQXNCLENBQUMsVUFBNkIsQ0FBQyxDQUFDO1FBQzlGLE9BQU8sSUFBSSw0QkFBNEIsQ0FBQyxlQUFlLEVBQUUsa0JBQWtCLENBQUMsQ0FBQztJQUMvRSxDQUFDO0lBRUQsVUFBVSxLQUFVLENBQUM7SUFFckIsYUFBYSxDQUFDLElBQWUsSUFBUyxDQUFDO0lBRXZDLFdBQVcsQ0FBQyxVQUFxQjtRQUMvQixNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLGtCQUFrQixFQUFFLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQ25FLE9BQU8sSUFBSSxJQUFJLElBQUksQ0FBQyxFQUFFLElBQUksU0FBUyxDQUFDO0lBQ3RDLENBQUM7Q0FDRiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1Jlc291cmNlTG9hZGVyfSBmcm9tICdAYW5ndWxhci9jb21waWxlcic7XG5pbXBvcnQge0FwcGxpY2F0aW9uSW5pdFN0YXR1cywgQ29tcGlsZXIsIENPTVBJTEVSX09QVElPTlMsIENvbXBvbmVudCwgRGlyZWN0aXZlLCBJbmplY3RvciwgSW5qZWN0b3JUeXBlLCBMT0NBTEVfSUQsIE1vZHVsZVdpdGhDb21wb25lbnRGYWN0b3JpZXMsIE1vZHVsZVdpdGhQcm92aWRlcnMsIE5nTW9kdWxlLCBOZ01vZHVsZUZhY3RvcnksIE5nWm9uZSwgUGlwZSwgUGxhdGZvcm1SZWYsIFByb3ZpZGVyLCBwcm92aWRlWm9uZUNoYW5nZURldGVjdGlvbiwgcmVzb2x2ZUZvcndhcmRSZWYsIFN0YXRpY1Byb3ZpZGVyLCBUeXBlLCDJtWNsZWFyUmVzb2x1dGlvbk9mQ29tcG9uZW50UmVzb3VyY2VzUXVldWUsIMm1Y29tcGlsZUNvbXBvbmVudCBhcyBjb21waWxlQ29tcG9uZW50LCDJtWNvbXBpbGVEaXJlY3RpdmUgYXMgY29tcGlsZURpcmVjdGl2ZSwgybVjb21waWxlTmdNb2R1bGVEZWZzIGFzIGNvbXBpbGVOZ01vZHVsZURlZnMsIMm1Y29tcGlsZVBpcGUgYXMgY29tcGlsZVBpcGUsIMm1REVGQVVMVF9MT0NBTEVfSUQgYXMgREVGQVVMVF9MT0NBTEVfSUQsIMm1REVGRVJfQkxPQ0tfQ09ORklHIGFzIERFRkVSX0JMT0NLX0NPTkZJRywgybVEZWZlckJsb2NrQmVoYXZpb3IgYXMgRGVmZXJCbG9ja0JlaGF2aW9yLCDJtWRlcHNUcmFja2VyIGFzIGRlcHNUcmFja2VyLCDJtURpcmVjdGl2ZURlZiBhcyBEaXJlY3RpdmVEZWYsIMm1Z2VuZXJhdGVTdGFuZGFsb25lSW5EZWNsYXJhdGlvbnNFcnJvciwgybVnZXRBc3luY0NsYXNzTWV0YWRhdGFGbiBhcyBnZXRBc3luY0NsYXNzTWV0YWRhdGFGbiwgybVnZXRJbmplY3RhYmxlRGVmIGFzIGdldEluamVjdGFibGVEZWYsIMm1SW50ZXJuYWxFbnZpcm9ubWVudFByb3ZpZGVycyBhcyBJbnRlcm5hbEVudmlyb25tZW50UHJvdmlkZXJzLCDJtWlzQ29tcG9uZW50RGVmUGVuZGluZ1Jlc29sdXRpb24sIMm1aXNFbnZpcm9ubWVudFByb3ZpZGVycyBhcyBpc0Vudmlyb25tZW50UHJvdmlkZXJzLCDJtU5HX0NPTVBfREVGIGFzIE5HX0NPTVBfREVGLCDJtU5HX0RJUl9ERUYgYXMgTkdfRElSX0RFRiwgybVOR19JTkpfREVGIGFzIE5HX0lOSl9ERUYsIMm1TkdfTU9EX0RFRiBhcyBOR19NT0RfREVGLCDJtU5HX1BJUEVfREVGIGFzIE5HX1BJUEVfREVGLCDJtU5nTW9kdWxlRmFjdG9yeSBhcyBSM05nTW9kdWxlRmFjdG9yeSwgybVOZ01vZHVsZVRyYW5zaXRpdmVTY29wZXMgYXMgTmdNb2R1bGVUcmFuc2l0aXZlU2NvcGVzLCDJtU5nTW9kdWxlVHlwZSBhcyBOZ01vZHVsZVR5cGUsIMm1cGF0Y2hDb21wb25lbnREZWZXaXRoU2NvcGUgYXMgcGF0Y2hDb21wb25lbnREZWZXaXRoU2NvcGUsIMm1UmVuZGVyM0NvbXBvbmVudEZhY3RvcnkgYXMgQ29tcG9uZW50RmFjdG9yeSwgybVSZW5kZXIzTmdNb2R1bGVSZWYgYXMgTmdNb2R1bGVSZWYsIMm1cmVzb2x2ZUNvbXBvbmVudFJlc291cmNlcywgybVyZXN0b3JlQ29tcG9uZW50UmVzb2x1dGlvblF1ZXVlLCDJtXNldExvY2FsZUlkIGFzIHNldExvY2FsZUlkLCDJtXRyYW5zaXRpdmVTY29wZXNGb3IgYXMgdHJhbnNpdGl2ZVNjb3Blc0ZvciwgybVVU0VfUlVOVElNRV9ERVBTX1RSQUNLRVJfRk9SX0pJVCBhcyBVU0VfUlVOVElNRV9ERVBTX1RSQUNLRVJfRk9SX0pJVCwgybXJtUluamVjdGFibGVEZWNsYXJhdGlvbiBhcyBJbmplY3RhYmxlRGVjbGFyYXRpb259IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuXG5pbXBvcnQge0NvbXBvbmVudERlZiwgQ29tcG9uZW50VHlwZX0gZnJvbSAnLi4vLi4vc3JjL3JlbmRlcjMnO1xuXG5pbXBvcnQge01ldGFkYXRhT3ZlcnJpZGV9IGZyb20gJy4vbWV0YWRhdGFfb3ZlcnJpZGUnO1xuaW1wb3J0IHtDb21wb25lbnRSZXNvbHZlciwgRGlyZWN0aXZlUmVzb2x2ZXIsIE5nTW9kdWxlUmVzb2x2ZXIsIFBpcGVSZXNvbHZlciwgUmVzb2x2ZXJ9IGZyb20gJy4vcmVzb2x2ZXJzJztcbmltcG9ydCB7VGVzdE1vZHVsZU1ldGFkYXRhfSBmcm9tICcuL3Rlc3RfYmVkX2NvbW1vbic7XG5cbmVudW0gVGVzdGluZ01vZHVsZU92ZXJyaWRlIHtcbiAgREVDTEFSQVRJT04sXG4gIE9WRVJSSURFX1RFTVBMQVRFLFxufVxuXG5mdW5jdGlvbiBpc1Rlc3RpbmdNb2R1bGVPdmVycmlkZSh2YWx1ZTogdW5rbm93bik6IHZhbHVlIGlzIFRlc3RpbmdNb2R1bGVPdmVycmlkZSB7XG4gIHJldHVybiB2YWx1ZSA9PT0gVGVzdGluZ01vZHVsZU92ZXJyaWRlLkRFQ0xBUkFUSU9OIHx8XG4gICAgICB2YWx1ZSA9PT0gVGVzdGluZ01vZHVsZU92ZXJyaWRlLk9WRVJSSURFX1RFTVBMQVRFO1xufVxuXG5mdW5jdGlvbiBhc3NlcnROb1N0YW5kYWxvbmVDb21wb25lbnRzKFxuICAgIHR5cGVzOiBUeXBlPGFueT5bXSwgcmVzb2x2ZXI6IFJlc29sdmVyPGFueT4sIGxvY2F0aW9uOiBzdHJpbmcpIHtcbiAgdHlwZXMuZm9yRWFjaCh0eXBlID0+IHtcbiAgICBpZiAoIWdldEFzeW5jQ2xhc3NNZXRhZGF0YUZuKHR5cGUpKSB7XG4gICAgICBjb25zdCBjb21wb25lbnQgPSByZXNvbHZlci5yZXNvbHZlKHR5cGUpO1xuICAgICAgaWYgKGNvbXBvbmVudCAmJiBjb21wb25lbnQuc3RhbmRhbG9uZSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoybVnZW5lcmF0ZVN0YW5kYWxvbmVJbkRlY2xhcmF0aW9uc0Vycm9yKHR5cGUsIGxvY2F0aW9uKSk7XG4gICAgICB9XG4gICAgfVxuICB9KTtcbn1cblxuLy8gUmVzb2x2ZXJzIGZvciBBbmd1bGFyIGRlY29yYXRvcnNcbnR5cGUgUmVzb2x2ZXJzID0ge1xuICBtb2R1bGU6IFJlc29sdmVyPE5nTW9kdWxlPixcbiAgY29tcG9uZW50OiBSZXNvbHZlcjxEaXJlY3RpdmU+LFxuICBkaXJlY3RpdmU6IFJlc29sdmVyPENvbXBvbmVudD4sXG4gIHBpcGU6IFJlc29sdmVyPFBpcGU+LFxufTtcblxuaW50ZXJmYWNlIENsZWFudXBPcGVyYXRpb24ge1xuICBmaWVsZE5hbWU6IHN0cmluZztcbiAgb2JqZWN0OiBhbnk7XG4gIG9yaWdpbmFsVmFsdWU6IHVua25vd247XG59XG5cbmV4cG9ydCBjbGFzcyBUZXN0QmVkQ29tcGlsZXIge1xuICBwcml2YXRlIG9yaWdpbmFsQ29tcG9uZW50UmVzb2x1dGlvblF1ZXVlOiBNYXA8VHlwZTxhbnk+LCBDb21wb25lbnQ+fG51bGwgPSBudWxsO1xuXG4gIC8vIFRlc3RpbmcgbW9kdWxlIGNvbmZpZ3VyYXRpb25cbiAgcHJpdmF0ZSBkZWNsYXJhdGlvbnM6IFR5cGU8YW55PltdID0gW107XG4gIHByaXZhdGUgaW1wb3J0czogVHlwZTxhbnk+W10gPSBbXTtcbiAgcHJpdmF0ZSBwcm92aWRlcnM6IFByb3ZpZGVyW10gPSBbXTtcbiAgcHJpdmF0ZSBzY2hlbWFzOiBhbnlbXSA9IFtdO1xuXG4gIC8vIFF1ZXVlcyBvZiBjb21wb25lbnRzL2RpcmVjdGl2ZXMvcGlwZXMgdGhhdCBzaG91bGQgYmUgcmVjb21waWxlZC5cbiAgcHJpdmF0ZSBwZW5kaW5nQ29tcG9uZW50cyA9IG5ldyBTZXQ8VHlwZTxhbnk+PigpO1xuICBwcml2YXRlIHBlbmRpbmdEaXJlY3RpdmVzID0gbmV3IFNldDxUeXBlPGFueT4+KCk7XG4gIHByaXZhdGUgcGVuZGluZ1BpcGVzID0gbmV3IFNldDxUeXBlPGFueT4+KCk7XG5cbiAgLy8gS2VlcCB0cmFjayBvZiBhbGwgY29tcG9uZW50cyBhbmQgZGlyZWN0aXZlcywgc28gd2UgY2FuIHBhdGNoIFByb3ZpZGVycyBvbnRvIGRlZnMgbGF0ZXIuXG4gIHByaXZhdGUgc2VlbkNvbXBvbmVudHMgPSBuZXcgU2V0PFR5cGU8YW55Pj4oKTtcbiAgcHJpdmF0ZSBzZWVuRGlyZWN0aXZlcyA9IG5ldyBTZXQ8VHlwZTxhbnk+PigpO1xuXG4gIC8vIEtlZXAgdHJhY2sgb2Ygb3ZlcnJpZGRlbiBtb2R1bGVzLCBzbyB0aGF0IHdlIGNhbiBjb2xsZWN0IGFsbCBhZmZlY3RlZCBvbmVzIGluIHRoZSBtb2R1bGUgdHJlZS5cbiAgcHJpdmF0ZSBvdmVycmlkZGVuTW9kdWxlcyA9IG5ldyBTZXQ8TmdNb2R1bGVUeXBlPGFueT4+KCk7XG5cbiAgLy8gU3RvcmUgcmVzb2x2ZWQgc3R5bGVzIGZvciBDb21wb25lbnRzIHRoYXQgaGF2ZSB0ZW1wbGF0ZSBvdmVycmlkZXMgcHJlc2VudCBhbmQgYHN0eWxlVXJsc2BcbiAgLy8gZGVmaW5lZCBhdCB0aGUgc2FtZSB0aW1lLlxuICBwcml2YXRlIGV4aXN0aW5nQ29tcG9uZW50U3R5bGVzID0gbmV3IE1hcDxUeXBlPGFueT4sIHN0cmluZ1tdPigpO1xuXG4gIHByaXZhdGUgcmVzb2x2ZXJzOiBSZXNvbHZlcnMgPSBpbml0UmVzb2x2ZXJzKCk7XG5cbiAgcHJpdmF0ZSBjb21wb25lbnRUb01vZHVsZVNjb3BlID0gbmV3IE1hcDxUeXBlPGFueT4sIFR5cGU8YW55PnxUZXN0aW5nTW9kdWxlT3ZlcnJpZGU+KCk7XG5cbiAgLy8gTWFwIHRoYXQga2VlcHMgaW5pdGlhbCB2ZXJzaW9uIG9mIGNvbXBvbmVudC9kaXJlY3RpdmUvcGlwZSBkZWZzIGluIGNhc2VcbiAgLy8gd2UgY29tcGlsZSBhIFR5cGUgYWdhaW4sIHRodXMgb3ZlcnJpZGluZyByZXNwZWN0aXZlIHN0YXRpYyBmaWVsZHMuIFRoaXMgaXNcbiAgLy8gcmVxdWlyZWQgdG8gbWFrZSBzdXJlIHdlIHJlc3RvcmUgZGVmcyB0byB0aGVpciBpbml0aWFsIHN0YXRlcyBiZXR3ZWVuIHRlc3QgcnVucy5cbiAgLy8gTm90ZTogb25lIGNsYXNzIG1heSBoYXZlIG11bHRpcGxlIGRlZnMgKGZvciBleGFtcGxlOiDJtW1vZCBhbmQgybVpbmogaW4gY2FzZSBvZiBhblxuICAvLyBOZ01vZHVsZSksIHN0b3JlIGFsbCBvZiB0aGVtIGluIGEgbWFwLlxuICBwcml2YXRlIGluaXRpYWxOZ0RlZnMgPSBuZXcgTWFwPFR5cGU8YW55PiwgTWFwPHN0cmluZywgUHJvcGVydHlEZXNjcmlwdG9yfHVuZGVmaW5lZD4+KCk7XG5cbiAgLy8gQXJyYXkgdGhhdCBrZWVwcyBjbGVhbnVwIG9wZXJhdGlvbnMgZm9yIGluaXRpYWwgdmVyc2lvbnMgb2YgY29tcG9uZW50L2RpcmVjdGl2ZS9waXBlL21vZHVsZVxuICAvLyBkZWZzIGluIGNhc2UgVGVzdEJlZCBtYWtlcyBjaGFuZ2VzIHRvIHRoZSBvcmlnaW5hbHMuXG4gIHByaXZhdGUgZGVmQ2xlYW51cE9wczogQ2xlYW51cE9wZXJhdGlvbltdID0gW107XG5cbiAgcHJpdmF0ZSBfaW5qZWN0b3I6IEluamVjdG9yfG51bGwgPSBudWxsO1xuICBwcml2YXRlIGNvbXBpbGVyUHJvdmlkZXJzOiBQcm92aWRlcltdfG51bGwgPSBudWxsO1xuXG4gIHByaXZhdGUgcHJvdmlkZXJPdmVycmlkZXM6IFByb3ZpZGVyW10gPSBbXTtcbiAgcHJpdmF0ZSByb290UHJvdmlkZXJPdmVycmlkZXM6IFByb3ZpZGVyW10gPSBbXTtcbiAgLy8gT3ZlcnJpZGVzIGZvciBpbmplY3RhYmxlcyB3aXRoIGB7cHJvdmlkZWRJbjogU29tZU1vZHVsZX1gIG5lZWQgdG8gYmUgdHJhY2tlZCBhbmQgYWRkZWQgdG8gdGhhdFxuICAvLyBtb2R1bGUncyBwcm92aWRlciBsaXN0LlxuICBwcml2YXRlIHByb3ZpZGVyT3ZlcnJpZGVzQnlNb2R1bGUgPSBuZXcgTWFwPEluamVjdG9yVHlwZTxhbnk+LCBQcm92aWRlcltdPigpO1xuICBwcml2YXRlIHByb3ZpZGVyT3ZlcnJpZGVzQnlUb2tlbiA9IG5ldyBNYXA8YW55LCBQcm92aWRlcj4oKTtcbiAgcHJpdmF0ZSBzY29wZXNXaXRoT3ZlcnJpZGRlblByb3ZpZGVycyA9IG5ldyBTZXQ8VHlwZTxhbnk+PigpO1xuXG4gIHByaXZhdGUgdGVzdE1vZHVsZVR5cGU6IE5nTW9kdWxlVHlwZTxhbnk+O1xuICBwcml2YXRlIHRlc3RNb2R1bGVSZWY6IE5nTW9kdWxlUmVmPGFueT58bnVsbCA9IG51bGw7XG5cbiAgcHJpdmF0ZSBkZWZlckJsb2NrQmVoYXZpb3IgPSBEZWZlckJsb2NrQmVoYXZpb3IuTWFudWFsO1xuXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgcGxhdGZvcm06IFBsYXRmb3JtUmVmLCBwcml2YXRlIGFkZGl0aW9uYWxNb2R1bGVUeXBlczogVHlwZTxhbnk+fFR5cGU8YW55PltdKSB7XG4gICAgY2xhc3MgRHluYW1pY1Rlc3RNb2R1bGUge31cbiAgICB0aGlzLnRlc3RNb2R1bGVUeXBlID0gRHluYW1pY1Rlc3RNb2R1bGUgYXMgYW55O1xuICB9XG5cbiAgc2V0Q29tcGlsZXJQcm92aWRlcnMocHJvdmlkZXJzOiBQcm92aWRlcltdfG51bGwpOiB2b2lkIHtcbiAgICB0aGlzLmNvbXBpbGVyUHJvdmlkZXJzID0gcHJvdmlkZXJzO1xuICAgIHRoaXMuX2luamVjdG9yID0gbnVsbDtcbiAgfVxuXG4gIGNvbmZpZ3VyZVRlc3RpbmdNb2R1bGUobW9kdWxlRGVmOiBUZXN0TW9kdWxlTWV0YWRhdGEpOiB2b2lkIHtcbiAgICAvLyBFbnF1ZXVlIGFueSBjb21waWxhdGlvbiB0YXNrcyBmb3IgdGhlIGRpcmVjdGx5IGRlY2xhcmVkIGNvbXBvbmVudC5cbiAgICBpZiAobW9kdWxlRGVmLmRlY2xhcmF0aW9ucyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAvLyBWZXJpZnkgdGhhdCB0aGVyZSBhcmUgbm8gc3RhbmRhbG9uZSBjb21wb25lbnRzXG4gICAgICBhc3NlcnROb1N0YW5kYWxvbmVDb21wb25lbnRzKFxuICAgICAgICAgIG1vZHVsZURlZi5kZWNsYXJhdGlvbnMsIHRoaXMucmVzb2x2ZXJzLmNvbXBvbmVudCxcbiAgICAgICAgICAnXCJUZXN0QmVkLmNvbmZpZ3VyZVRlc3RpbmdNb2R1bGVcIiBjYWxsJyk7XG4gICAgICB0aGlzLnF1ZXVlVHlwZUFycmF5KG1vZHVsZURlZi5kZWNsYXJhdGlvbnMsIFRlc3RpbmdNb2R1bGVPdmVycmlkZS5ERUNMQVJBVElPTik7XG4gICAgICB0aGlzLmRlY2xhcmF0aW9ucy5wdXNoKC4uLm1vZHVsZURlZi5kZWNsYXJhdGlvbnMpO1xuICAgIH1cblxuICAgIC8vIEVucXVldWUgYW55IGNvbXBpbGF0aW9uIHRhc2tzIGZvciBpbXBvcnRlZCBtb2R1bGVzLlxuICAgIGlmIChtb2R1bGVEZWYuaW1wb3J0cyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzLnF1ZXVlVHlwZXNGcm9tTW9kdWxlc0FycmF5KG1vZHVsZURlZi5pbXBvcnRzKTtcbiAgICAgIHRoaXMuaW1wb3J0cy5wdXNoKC4uLm1vZHVsZURlZi5pbXBvcnRzKTtcbiAgICB9XG5cbiAgICBpZiAobW9kdWxlRGVmLnByb3ZpZGVycyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzLnByb3ZpZGVycy5wdXNoKC4uLm1vZHVsZURlZi5wcm92aWRlcnMpO1xuICAgIH1cblxuICAgIGlmIChtb2R1bGVEZWYuc2NoZW1hcyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzLnNjaGVtYXMucHVzaCguLi5tb2R1bGVEZWYuc2NoZW1hcyk7XG4gICAgfVxuXG4gICAgdGhpcy5kZWZlckJsb2NrQmVoYXZpb3IgPSBtb2R1bGVEZWYuZGVmZXJCbG9ja0JlaGF2aW9yID8/IERlZmVyQmxvY2tCZWhhdmlvci5NYW51YWw7XG4gIH1cblxuICBvdmVycmlkZU1vZHVsZShuZ01vZHVsZTogVHlwZTxhbnk+LCBvdmVycmlkZTogTWV0YWRhdGFPdmVycmlkZTxOZ01vZHVsZT4pOiB2b2lkIHtcbiAgICBpZiAoVVNFX1JVTlRJTUVfREVQU19UUkFDS0VSX0ZPUl9KSVQpIHtcbiAgICAgIGRlcHNUcmFja2VyLmNsZWFyU2NvcGVDYWNoZUZvcihuZ01vZHVsZSk7XG4gICAgfVxuICAgIHRoaXMub3ZlcnJpZGRlbk1vZHVsZXMuYWRkKG5nTW9kdWxlIGFzIE5nTW9kdWxlVHlwZTxhbnk+KTtcblxuICAgIC8vIENvbXBpbGUgdGhlIG1vZHVsZSByaWdodCBhd2F5LlxuICAgIHRoaXMucmVzb2x2ZXJzLm1vZHVsZS5hZGRPdmVycmlkZShuZ01vZHVsZSwgb3ZlcnJpZGUpO1xuICAgIGNvbnN0IG1ldGFkYXRhID0gdGhpcy5yZXNvbHZlcnMubW9kdWxlLnJlc29sdmUobmdNb2R1bGUpO1xuICAgIGlmIChtZXRhZGF0YSA9PT0gbnVsbCkge1xuICAgICAgdGhyb3cgaW52YWxpZFR5cGVFcnJvcihuZ01vZHVsZS5uYW1lLCAnTmdNb2R1bGUnKTtcbiAgICB9XG5cbiAgICB0aGlzLnJlY29tcGlsZU5nTW9kdWxlKG5nTW9kdWxlLCBtZXRhZGF0YSk7XG5cbiAgICAvLyBBdCB0aGlzIHBvaW50LCB0aGUgbW9kdWxlIGhhcyBhIHZhbGlkIG1vZHVsZSBkZWYgKMm1bW9kKSwgYnV0IHRoZSBvdmVycmlkZSBtYXkgaGF2ZSBpbnRyb2R1Y2VkXG4gICAgLy8gbmV3IGRlY2xhcmF0aW9ucyBvciBpbXBvcnRlZCBtb2R1bGVzLiBJbmdlc3QgYW55IHBvc3NpYmxlIG5ldyB0eXBlcyBhbmQgYWRkIHRoZW0gdG8gdGhlXG4gICAgLy8gY3VycmVudCBxdWV1ZS5cbiAgICB0aGlzLnF1ZXVlVHlwZXNGcm9tTW9kdWxlc0FycmF5KFtuZ01vZHVsZV0pO1xuICB9XG5cbiAgb3ZlcnJpZGVDb21wb25lbnQoY29tcG9uZW50OiBUeXBlPGFueT4sIG92ZXJyaWRlOiBNZXRhZGF0YU92ZXJyaWRlPENvbXBvbmVudD4pOiB2b2lkIHtcbiAgICB0aGlzLnZlcmlmeU5vU3RhbmRhbG9uZUZsYWdPdmVycmlkZXMoY29tcG9uZW50LCBvdmVycmlkZSk7XG4gICAgdGhpcy5yZXNvbHZlcnMuY29tcG9uZW50LmFkZE92ZXJyaWRlKGNvbXBvbmVudCwgb3ZlcnJpZGUpO1xuICAgIHRoaXMucGVuZGluZ0NvbXBvbmVudHMuYWRkKGNvbXBvbmVudCk7XG4gIH1cblxuICBvdmVycmlkZURpcmVjdGl2ZShkaXJlY3RpdmU6IFR5cGU8YW55Piwgb3ZlcnJpZGU6IE1ldGFkYXRhT3ZlcnJpZGU8RGlyZWN0aXZlPik6IHZvaWQge1xuICAgIHRoaXMudmVyaWZ5Tm9TdGFuZGFsb25lRmxhZ092ZXJyaWRlcyhkaXJlY3RpdmUsIG92ZXJyaWRlKTtcbiAgICB0aGlzLnJlc29sdmVycy5kaXJlY3RpdmUuYWRkT3ZlcnJpZGUoZGlyZWN0aXZlLCBvdmVycmlkZSk7XG4gICAgdGhpcy5wZW5kaW5nRGlyZWN0aXZlcy5hZGQoZGlyZWN0aXZlKTtcbiAgfVxuXG4gIG92ZXJyaWRlUGlwZShwaXBlOiBUeXBlPGFueT4sIG92ZXJyaWRlOiBNZXRhZGF0YU92ZXJyaWRlPFBpcGU+KTogdm9pZCB7XG4gICAgdGhpcy52ZXJpZnlOb1N0YW5kYWxvbmVGbGFnT3ZlcnJpZGVzKHBpcGUsIG92ZXJyaWRlKTtcbiAgICB0aGlzLnJlc29sdmVycy5waXBlLmFkZE92ZXJyaWRlKHBpcGUsIG92ZXJyaWRlKTtcbiAgICB0aGlzLnBlbmRpbmdQaXBlcy5hZGQocGlwZSk7XG4gIH1cblxuICBwcml2YXRlIHZlcmlmeU5vU3RhbmRhbG9uZUZsYWdPdmVycmlkZXMoXG4gICAgICB0eXBlOiBUeXBlPGFueT4sIG92ZXJyaWRlOiBNZXRhZGF0YU92ZXJyaWRlPENvbXBvbmVudHxEaXJlY3RpdmV8UGlwZT4pIHtcbiAgICBpZiAob3ZlcnJpZGUuYWRkPy5oYXNPd25Qcm9wZXJ0eSgnc3RhbmRhbG9uZScpIHx8IG92ZXJyaWRlLnNldD8uaGFzT3duUHJvcGVydHkoJ3N0YW5kYWxvbmUnKSB8fFxuICAgICAgICBvdmVycmlkZS5yZW1vdmU/Lmhhc093blByb3BlcnR5KCdzdGFuZGFsb25lJykpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICBgQW4gb3ZlcnJpZGUgZm9yIHRoZSAke3R5cGUubmFtZX0gY2xhc3MgaGFzIHRoZSBcXGBzdGFuZGFsb25lXFxgIGZsYWcuIGAgK1xuICAgICAgICAgIGBDaGFuZ2luZyB0aGUgXFxgc3RhbmRhbG9uZVxcYCBmbGFnIHZpYSBUZXN0QmVkIG92ZXJyaWRlcyBpcyBub3Qgc3VwcG9ydGVkLmApO1xuICAgIH1cbiAgfVxuXG4gIG92ZXJyaWRlUHJvdmlkZXIoXG4gICAgICB0b2tlbjogYW55LFxuICAgICAgcHJvdmlkZXI6IHt1c2VGYWN0b3J5PzogRnVuY3Rpb24sIHVzZVZhbHVlPzogYW55LCBkZXBzPzogYW55W10sIG11bHRpPzogYm9vbGVhbn0pOiB2b2lkIHtcbiAgICBsZXQgcHJvdmlkZXJEZWY6IFByb3ZpZGVyO1xuICAgIGlmIChwcm92aWRlci51c2VGYWN0b3J5ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHByb3ZpZGVyRGVmID0ge1xuICAgICAgICBwcm92aWRlOiB0b2tlbixcbiAgICAgICAgdXNlRmFjdG9yeTogcHJvdmlkZXIudXNlRmFjdG9yeSxcbiAgICAgICAgZGVwczogcHJvdmlkZXIuZGVwcyB8fCBbXSxcbiAgICAgICAgbXVsdGk6IHByb3ZpZGVyLm11bHRpXG4gICAgICB9O1xuICAgIH0gZWxzZSBpZiAocHJvdmlkZXIudXNlVmFsdWUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgcHJvdmlkZXJEZWYgPSB7cHJvdmlkZTogdG9rZW4sIHVzZVZhbHVlOiBwcm92aWRlci51c2VWYWx1ZSwgbXVsdGk6IHByb3ZpZGVyLm11bHRpfTtcbiAgICB9IGVsc2Uge1xuICAgICAgcHJvdmlkZXJEZWYgPSB7cHJvdmlkZTogdG9rZW59O1xuICAgIH1cblxuICAgIGNvbnN0IGluamVjdGFibGVEZWY6IEluamVjdGFibGVEZWNsYXJhdGlvbjxhbnk+fG51bGwgPVxuICAgICAgICB0eXBlb2YgdG9rZW4gIT09ICdzdHJpbmcnID8gZ2V0SW5qZWN0YWJsZURlZih0b2tlbikgOiBudWxsO1xuICAgIGNvbnN0IHByb3ZpZGVkSW4gPSBpbmplY3RhYmxlRGVmID09PSBudWxsID8gbnVsbCA6IHJlc29sdmVGb3J3YXJkUmVmKGluamVjdGFibGVEZWYucHJvdmlkZWRJbik7XG4gICAgY29uc3Qgb3ZlcnJpZGVzQnVja2V0ID1cbiAgICAgICAgcHJvdmlkZWRJbiA9PT0gJ3Jvb3QnID8gdGhpcy5yb290UHJvdmlkZXJPdmVycmlkZXMgOiB0aGlzLnByb3ZpZGVyT3ZlcnJpZGVzO1xuICAgIG92ZXJyaWRlc0J1Y2tldC5wdXNoKHByb3ZpZGVyRGVmKTtcblxuICAgIC8vIEtlZXAgb3ZlcnJpZGVzIGdyb3VwZWQgYnkgdG9rZW4gYXMgd2VsbCBmb3IgZmFzdCBsb29rdXBzIHVzaW5nIHRva2VuXG4gICAgdGhpcy5wcm92aWRlck92ZXJyaWRlc0J5VG9rZW4uc2V0KHRva2VuLCBwcm92aWRlckRlZik7XG4gICAgaWYgKGluamVjdGFibGVEZWYgIT09IG51bGwgJiYgcHJvdmlkZWRJbiAhPT0gbnVsbCAmJiB0eXBlb2YgcHJvdmlkZWRJbiAhPT0gJ3N0cmluZycpIHtcbiAgICAgIGNvbnN0IGV4aXN0aW5nT3ZlcnJpZGVzID0gdGhpcy5wcm92aWRlck92ZXJyaWRlc0J5TW9kdWxlLmdldChwcm92aWRlZEluKTtcbiAgICAgIGlmIChleGlzdGluZ092ZXJyaWRlcyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGV4aXN0aW5nT3ZlcnJpZGVzLnB1c2gocHJvdmlkZXJEZWYpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5wcm92aWRlck92ZXJyaWRlc0J5TW9kdWxlLnNldChwcm92aWRlZEluLCBbcHJvdmlkZXJEZWZdKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBvdmVycmlkZVRlbXBsYXRlVXNpbmdUZXN0aW5nTW9kdWxlKHR5cGU6IFR5cGU8YW55PiwgdGVtcGxhdGU6IHN0cmluZyk6IHZvaWQge1xuICAgIGNvbnN0IGRlZiA9ICh0eXBlIGFzIGFueSlbTkdfQ09NUF9ERUZdO1xuICAgIGNvbnN0IGhhc1N0eWxlVXJscyA9ICgpOiBib29sZWFuID0+IHtcbiAgICAgIGNvbnN0IG1ldGFkYXRhID0gdGhpcy5yZXNvbHZlcnMuY29tcG9uZW50LnJlc29sdmUodHlwZSkhIGFzIENvbXBvbmVudDtcbiAgICAgIHJldHVybiAhIW1ldGFkYXRhLnN0eWxlVXJsIHx8ICEhbWV0YWRhdGEuc3R5bGVVcmxzPy5sZW5ndGg7XG4gICAgfTtcbiAgICBjb25zdCBvdmVycmlkZVN0eWxlVXJscyA9ICEhZGVmICYmICHJtWlzQ29tcG9uZW50RGVmUGVuZGluZ1Jlc29sdXRpb24odHlwZSkgJiYgaGFzU3R5bGVVcmxzKCk7XG5cbiAgICAvLyBJbiBJdnksIGNvbXBpbGluZyBhIGNvbXBvbmVudCBkb2VzIG5vdCByZXF1aXJlIGtub3dpbmcgdGhlIG1vZHVsZSBwcm92aWRpbmcgdGhlXG4gICAgLy8gY29tcG9uZW50J3Mgc2NvcGUsIHNvIG92ZXJyaWRlVGVtcGxhdGVVc2luZ1Rlc3RpbmdNb2R1bGUgY2FuIGJlIGltcGxlbWVudGVkIHB1cmVseSB2aWFcbiAgICAvLyBvdmVycmlkZUNvbXBvbmVudC4gSW1wb3J0YW50OiBvdmVycmlkaW5nIHRlbXBsYXRlIHJlcXVpcmVzIGZ1bGwgQ29tcG9uZW50IHJlLWNvbXBpbGF0aW9uLFxuICAgIC8vIHdoaWNoIG1heSBmYWlsIGluIGNhc2Ugc3R5bGVVcmxzIGFyZSBhbHNvIHByZXNlbnQgKHRodXMgQ29tcG9uZW50IGlzIGNvbnNpZGVyZWQgYXMgcmVxdWlyZWRcbiAgICAvLyByZXNvbHV0aW9uKS4gSW4gb3JkZXIgdG8gYXZvaWQgdGhpcywgd2UgcHJlZW1wdGl2ZWx5IHNldCBzdHlsZVVybHMgdG8gYW4gZW1wdHkgYXJyYXksXG4gICAgLy8gcHJlc2VydmUgY3VycmVudCBzdHlsZXMgYXZhaWxhYmxlIG9uIENvbXBvbmVudCBkZWYgYW5kIHJlc3RvcmUgc3R5bGVzIGJhY2sgb25jZSBjb21waWxhdGlvblxuICAgIC8vIGlzIGNvbXBsZXRlLlxuICAgIGNvbnN0IG92ZXJyaWRlID1cbiAgICAgICAgb3ZlcnJpZGVTdHlsZVVybHMgPyB7dGVtcGxhdGUsIHN0eWxlczogW10sIHN0eWxlVXJsczogW10sIHN0eWxlVXJsOiB1bmRlZmluZWR9IDoge3RlbXBsYXRlfTtcbiAgICB0aGlzLm92ZXJyaWRlQ29tcG9uZW50KHR5cGUsIHtzZXQ6IG92ZXJyaWRlfSk7XG5cbiAgICBpZiAob3ZlcnJpZGVTdHlsZVVybHMgJiYgZGVmLnN0eWxlcyAmJiBkZWYuc3R5bGVzLmxlbmd0aCA+IDApIHtcbiAgICAgIHRoaXMuZXhpc3RpbmdDb21wb25lbnRTdHlsZXMuc2V0KHR5cGUsIGRlZi5zdHlsZXMpO1xuICAgIH1cblxuICAgIC8vIFNldCB0aGUgY29tcG9uZW50J3Mgc2NvcGUgdG8gYmUgdGhlIHRlc3RpbmcgbW9kdWxlLlxuICAgIHRoaXMuY29tcG9uZW50VG9Nb2R1bGVTY29wZS5zZXQodHlwZSwgVGVzdGluZ01vZHVsZU92ZXJyaWRlLk9WRVJSSURFX1RFTVBMQVRFKTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgcmVzb2x2ZVBlbmRpbmdDb21wb25lbnRzV2l0aEFzeW5jTWV0YWRhdGEoKSB7XG4gICAgaWYgKHRoaXMucGVuZGluZ0NvbXBvbmVudHMuc2l6ZSA9PT0gMCkgcmV0dXJuO1xuXG4gICAgY29uc3QgcHJvbWlzZXMgPSBbXTtcbiAgICBmb3IgKGNvbnN0IGNvbXBvbmVudCBvZiB0aGlzLnBlbmRpbmdDb21wb25lbnRzKSB7XG4gICAgICBjb25zdCBhc3luY01ldGFkYXRhRm4gPSBnZXRBc3luY0NsYXNzTWV0YWRhdGFGbihjb21wb25lbnQpO1xuICAgICAgaWYgKGFzeW5jTWV0YWRhdGFGbikge1xuICAgICAgICBwcm9taXNlcy5wdXNoKGFzeW5jTWV0YWRhdGFGbigpKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zdCByZXNvbHZlZERlcHMgPSBhd2FpdCBQcm9taXNlLmFsbChwcm9taXNlcyk7XG4gICAgdGhpcy5xdWV1ZVR5cGVzRnJvbU1vZHVsZXNBcnJheShyZXNvbHZlZERlcHMuZmxhdCgyKSk7XG4gIH1cblxuICBhc3luYyBjb21waWxlQ29tcG9uZW50cygpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0aGlzLmNsZWFyQ29tcG9uZW50UmVzb2x1dGlvblF1ZXVlKCk7XG5cbiAgICAvLyBXYWl0IGZvciBhbGwgYXN5bmMgbWV0YWRhdGEgZm9yIGNvbXBvbmVudHMgdGhhdCB3ZXJlXG4gICAgLy8gb3ZlcnJpZGRlbiwgd2UgbmVlZCByZXNvbHZlZCBtZXRhZGF0YSB0byBwZXJmb3JtIGFuIG92ZXJyaWRlXG4gICAgLy8gYW5kIHJlLWNvbXBpbGUgYSBjb21wb25lbnQuXG4gICAgYXdhaXQgdGhpcy5yZXNvbHZlUGVuZGluZ0NvbXBvbmVudHNXaXRoQXN5bmNNZXRhZGF0YSgpO1xuXG4gICAgLy8gVmVyaWZ5IHRoYXQgdGhlcmUgd2VyZSBubyBzdGFuZGFsb25lIGNvbXBvbmVudHMgcHJlc2VudCBpbiB0aGUgYGRlY2xhcmF0aW9uc2AgZmllbGRcbiAgICAvLyBkdXJpbmcgdGhlIGBUZXN0QmVkLmNvbmZpZ3VyZVRlc3RpbmdNb2R1bGVgIGNhbGwuIFdlIHBlcmZvcm0gdGhpcyBjaGVjayBoZXJlIGluIGFkZGl0aW9uXG4gICAgLy8gdG8gdGhlIGxvZ2ljIGluIHRoZSBgY29uZmlndXJlVGVzdGluZ01vZHVsZWAgZnVuY3Rpb24sIHNpbmNlIGF0IHRoaXMgcG9pbnQgd2UgaGF2ZVxuICAgIC8vIGFsbCBhc3luYyBtZXRhZGF0YSByZXNvbHZlZC5cbiAgICBhc3NlcnROb1N0YW5kYWxvbmVDb21wb25lbnRzKFxuICAgICAgICB0aGlzLmRlY2xhcmF0aW9ucywgdGhpcy5yZXNvbHZlcnMuY29tcG9uZW50LCAnXCJUZXN0QmVkLmNvbmZpZ3VyZVRlc3RpbmdNb2R1bGVcIiBjYWxsJyk7XG5cbiAgICAvLyBSdW4gY29tcGlsZXJzIGZvciBhbGwgcXVldWVkIHR5cGVzLlxuICAgIGxldCBuZWVkc0FzeW5jUmVzb3VyY2VzID0gdGhpcy5jb21waWxlVHlwZXNTeW5jKCk7XG5cbiAgICAvLyBjb21waWxlQ29tcG9uZW50cygpIHNob3VsZCBub3QgYmUgYXN5bmMgdW5sZXNzIGl0IG5lZWRzIHRvIGJlLlxuICAgIGlmIChuZWVkc0FzeW5jUmVzb3VyY2VzKSB7XG4gICAgICBsZXQgcmVzb3VyY2VMb2FkZXI6IFJlc291cmNlTG9hZGVyO1xuICAgICAgbGV0IHJlc29sdmVyID0gKHVybDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+ID0+IHtcbiAgICAgICAgaWYgKCFyZXNvdXJjZUxvYWRlcikge1xuICAgICAgICAgIHJlc291cmNlTG9hZGVyID0gdGhpcy5pbmplY3Rvci5nZXQoUmVzb3VyY2VMb2FkZXIpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUocmVzb3VyY2VMb2FkZXIuZ2V0KHVybCkpO1xuICAgICAgfTtcbiAgICAgIGF3YWl0IMm1cmVzb2x2ZUNvbXBvbmVudFJlc291cmNlcyhyZXNvbHZlcik7XG4gICAgfVxuICB9XG5cbiAgZmluYWxpemUoKTogTmdNb2R1bGVSZWY8YW55PiB7XG4gICAgLy8gT25lIGxhc3QgY29tcGlsZVxuICAgIHRoaXMuY29tcGlsZVR5cGVzU3luYygpO1xuXG4gICAgLy8gQ3JlYXRlIHRoZSB0ZXN0aW5nIG1vZHVsZSBpdHNlbGYuXG4gICAgdGhpcy5jb21waWxlVGVzdE1vZHVsZSgpO1xuXG4gICAgdGhpcy5hcHBseVRyYW5zaXRpdmVTY29wZXMoKTtcblxuICAgIHRoaXMuYXBwbHlQcm92aWRlck92ZXJyaWRlcygpO1xuXG4gICAgLy8gUGF0Y2ggcHJldmlvdXNseSBzdG9yZWQgYHN0eWxlc2AgQ29tcG9uZW50IHZhbHVlcyAodGFrZW4gZnJvbSDJtWNtcCksIGluIGNhc2UgdGhlc2VcbiAgICAvLyBDb21wb25lbnRzIGhhdmUgYHN0eWxlVXJsc2AgZmllbGRzIGRlZmluZWQgYW5kIHRlbXBsYXRlIG92ZXJyaWRlIHdhcyByZXF1ZXN0ZWQuXG4gICAgdGhpcy5wYXRjaENvbXBvbmVudHNXaXRoRXhpc3RpbmdTdHlsZXMoKTtcblxuICAgIC8vIENsZWFyIHRoZSBjb21wb25lbnRUb01vZHVsZVNjb3BlIG1hcCwgc28gdGhhdCBmdXR1cmUgY29tcGlsYXRpb25zIGRvbid0IHJlc2V0IHRoZSBzY29wZSBvZlxuICAgIC8vIGV2ZXJ5IGNvbXBvbmVudC5cbiAgICB0aGlzLmNvbXBvbmVudFRvTW9kdWxlU2NvcGUuY2xlYXIoKTtcblxuICAgIGNvbnN0IHBhcmVudEluamVjdG9yID0gdGhpcy5wbGF0Zm9ybS5pbmplY3RvcjtcbiAgICB0aGlzLnRlc3RNb2R1bGVSZWYgPSBuZXcgTmdNb2R1bGVSZWYodGhpcy50ZXN0TW9kdWxlVHlwZSwgcGFyZW50SW5qZWN0b3IsIFtdKTtcblxuICAgIC8vIEFwcGxpY2F0aW9uSW5pdFN0YXR1cy5ydW5Jbml0aWFsaXplcnMoKSBpcyBtYXJrZWQgQGludGVybmFsIHRvIGNvcmUuXG4gICAgLy8gQ2FzdCBpdCB0byBhbnkgYmVmb3JlIGFjY2Vzc2luZyBpdC5cbiAgICAodGhpcy50ZXN0TW9kdWxlUmVmLmluamVjdG9yLmdldChBcHBsaWNhdGlvbkluaXRTdGF0dXMpIGFzIGFueSkucnVuSW5pdGlhbGl6ZXJzKCk7XG5cbiAgICAvLyBTZXQgbG9jYWxlIElEIGFmdGVyIHJ1bm5pbmcgYXBwIGluaXRpYWxpemVycywgc2luY2UgbG9jYWxlIGluZm9ybWF0aW9uIG1pZ2h0IGJlIHVwZGF0ZWQgd2hpbGVcbiAgICAvLyBydW5uaW5nIGluaXRpYWxpemVycy4gVGhpcyBpcyBhbHNvIGNvbnNpc3RlbnQgd2l0aCB0aGUgZXhlY3V0aW9uIG9yZGVyIHdoaWxlIGJvb3RzdHJhcHBpbmcgYW5cbiAgICAvLyBhcHAgKHNlZSBgcGFja2FnZXMvY29yZS9zcmMvYXBwbGljYXRpb25fcmVmLnRzYCBmaWxlKS5cbiAgICBjb25zdCBsb2NhbGVJZCA9IHRoaXMudGVzdE1vZHVsZVJlZi5pbmplY3Rvci5nZXQoTE9DQUxFX0lELCBERUZBVUxUX0xPQ0FMRV9JRCk7XG4gICAgc2V0TG9jYWxlSWQobG9jYWxlSWQpO1xuXG4gICAgcmV0dXJuIHRoaXMudGVzdE1vZHVsZVJlZjtcbiAgfVxuXG4gIC8qKlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIF9jb21waWxlTmdNb2R1bGVTeW5jKG1vZHVsZVR5cGU6IFR5cGU8YW55Pik6IHZvaWQge1xuICAgIHRoaXMucXVldWVUeXBlc0Zyb21Nb2R1bGVzQXJyYXkoW21vZHVsZVR5cGVdKTtcbiAgICB0aGlzLmNvbXBpbGVUeXBlc1N5bmMoKTtcbiAgICB0aGlzLmFwcGx5UHJvdmlkZXJPdmVycmlkZXMoKTtcbiAgICB0aGlzLmFwcGx5UHJvdmlkZXJPdmVycmlkZXNJblNjb3BlKG1vZHVsZVR5cGUpO1xuICAgIHRoaXMuYXBwbHlUcmFuc2l0aXZlU2NvcGVzKCk7XG4gIH1cblxuICAvKipcbiAgICogQGludGVybmFsXG4gICAqL1xuICBhc3luYyBfY29tcGlsZU5nTW9kdWxlQXN5bmMobW9kdWxlVHlwZTogVHlwZTxhbnk+KTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdGhpcy5xdWV1ZVR5cGVzRnJvbU1vZHVsZXNBcnJheShbbW9kdWxlVHlwZV0pO1xuICAgIGF3YWl0IHRoaXMuY29tcGlsZUNvbXBvbmVudHMoKTtcbiAgICB0aGlzLmFwcGx5UHJvdmlkZXJPdmVycmlkZXMoKTtcbiAgICB0aGlzLmFwcGx5UHJvdmlkZXJPdmVycmlkZXNJblNjb3BlKG1vZHVsZVR5cGUpO1xuICAgIHRoaXMuYXBwbHlUcmFuc2l0aXZlU2NvcGVzKCk7XG4gIH1cblxuICAvKipcbiAgICogQGludGVybmFsXG4gICAqL1xuICBfZ2V0TW9kdWxlUmVzb2x2ZXIoKTogUmVzb2x2ZXI8TmdNb2R1bGU+IHtcbiAgICByZXR1cm4gdGhpcy5yZXNvbHZlcnMubW9kdWxlO1xuICB9XG5cbiAgLyoqXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgX2dldENvbXBvbmVudEZhY3Rvcmllcyhtb2R1bGVUeXBlOiBOZ01vZHVsZVR5cGUpOiBDb21wb25lbnRGYWN0b3J5PGFueT5bXSB7XG4gICAgcmV0dXJuIG1heWJlVW53cmFwRm4obW9kdWxlVHlwZS7JtW1vZC5kZWNsYXJhdGlvbnMpLnJlZHVjZSgoZmFjdG9yaWVzLCBkZWNsYXJhdGlvbikgPT4ge1xuICAgICAgY29uc3QgY29tcG9uZW50RGVmID0gKGRlY2xhcmF0aW9uIGFzIGFueSkuybVjbXA7XG4gICAgICBjb21wb25lbnREZWYgJiYgZmFjdG9yaWVzLnB1c2gobmV3IENvbXBvbmVudEZhY3RvcnkoY29tcG9uZW50RGVmLCB0aGlzLnRlc3RNb2R1bGVSZWYhKSk7XG4gICAgICByZXR1cm4gZmFjdG9yaWVzO1xuICAgIH0sIFtdIGFzIENvbXBvbmVudEZhY3Rvcnk8YW55PltdKTtcbiAgfVxuXG4gIHByaXZhdGUgY29tcGlsZVR5cGVzU3luYygpOiBib29sZWFuIHtcbiAgICAvLyBDb21waWxlIGFsbCBxdWV1ZWQgY29tcG9uZW50cywgZGlyZWN0aXZlcywgcGlwZXMuXG4gICAgbGV0IG5lZWRzQXN5bmNSZXNvdXJjZXMgPSBmYWxzZTtcbiAgICB0aGlzLnBlbmRpbmdDb21wb25lbnRzLmZvckVhY2goZGVjbGFyYXRpb24gPT4ge1xuICAgICAgaWYgKGdldEFzeW5jQ2xhc3NNZXRhZGF0YUZuKGRlY2xhcmF0aW9uKSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgICBgQ29tcG9uZW50ICcke2RlY2xhcmF0aW9uLm5hbWV9JyBoYXMgdW5yZXNvbHZlZCBtZXRhZGF0YS4gYCArXG4gICAgICAgICAgICBgUGxlYXNlIGNhbGwgXFxgYXdhaXQgVGVzdEJlZC5jb21waWxlQ29tcG9uZW50cygpXFxgIGJlZm9yZSBydW5uaW5nIHRoaXMgdGVzdC5gKTtcbiAgICAgIH1cblxuICAgICAgbmVlZHNBc3luY1Jlc291cmNlcyA9IG5lZWRzQXN5bmNSZXNvdXJjZXMgfHwgybVpc0NvbXBvbmVudERlZlBlbmRpbmdSZXNvbHV0aW9uKGRlY2xhcmF0aW9uKTtcblxuICAgICAgY29uc3QgbWV0YWRhdGEgPSB0aGlzLnJlc29sdmVycy5jb21wb25lbnQucmVzb2x2ZShkZWNsYXJhdGlvbik7XG4gICAgICBpZiAobWV0YWRhdGEgPT09IG51bGwpIHtcbiAgICAgICAgdGhyb3cgaW52YWxpZFR5cGVFcnJvcihkZWNsYXJhdGlvbi5uYW1lLCAnQ29tcG9uZW50Jyk7XG4gICAgICB9XG5cbiAgICAgIHRoaXMubWF5YmVTdG9yZU5nRGVmKE5HX0NPTVBfREVGLCBkZWNsYXJhdGlvbik7XG4gICAgICBpZiAoVVNFX1JVTlRJTUVfREVQU19UUkFDS0VSX0ZPUl9KSVQpIHtcbiAgICAgICAgZGVwc1RyYWNrZXIuY2xlYXJTY29wZUNhY2hlRm9yKGRlY2xhcmF0aW9uKTtcbiAgICAgIH1cbiAgICAgIGNvbXBpbGVDb21wb25lbnQoZGVjbGFyYXRpb24sIG1ldGFkYXRhKTtcbiAgICB9KTtcbiAgICB0aGlzLnBlbmRpbmdDb21wb25lbnRzLmNsZWFyKCk7XG5cbiAgICB0aGlzLnBlbmRpbmdEaXJlY3RpdmVzLmZvckVhY2goZGVjbGFyYXRpb24gPT4ge1xuICAgICAgY29uc3QgbWV0YWRhdGEgPSB0aGlzLnJlc29sdmVycy5kaXJlY3RpdmUucmVzb2x2ZShkZWNsYXJhdGlvbik7XG4gICAgICBpZiAobWV0YWRhdGEgPT09IG51bGwpIHtcbiAgICAgICAgdGhyb3cgaW52YWxpZFR5cGVFcnJvcihkZWNsYXJhdGlvbi5uYW1lLCAnRGlyZWN0aXZlJyk7XG4gICAgICB9XG4gICAgICB0aGlzLm1heWJlU3RvcmVOZ0RlZihOR19ESVJfREVGLCBkZWNsYXJhdGlvbik7XG4gICAgICBjb21waWxlRGlyZWN0aXZlKGRlY2xhcmF0aW9uLCBtZXRhZGF0YSk7XG4gICAgfSk7XG4gICAgdGhpcy5wZW5kaW5nRGlyZWN0aXZlcy5jbGVhcigpO1xuXG4gICAgdGhpcy5wZW5kaW5nUGlwZXMuZm9yRWFjaChkZWNsYXJhdGlvbiA9PiB7XG4gICAgICBjb25zdCBtZXRhZGF0YSA9IHRoaXMucmVzb2x2ZXJzLnBpcGUucmVzb2x2ZShkZWNsYXJhdGlvbik7XG4gICAgICBpZiAobWV0YWRhdGEgPT09IG51bGwpIHtcbiAgICAgICAgdGhyb3cgaW52YWxpZFR5cGVFcnJvcihkZWNsYXJhdGlvbi5uYW1lLCAnUGlwZScpO1xuICAgICAgfVxuICAgICAgdGhpcy5tYXliZVN0b3JlTmdEZWYoTkdfUElQRV9ERUYsIGRlY2xhcmF0aW9uKTtcbiAgICAgIGNvbXBpbGVQaXBlKGRlY2xhcmF0aW9uLCBtZXRhZGF0YSk7XG4gICAgfSk7XG4gICAgdGhpcy5wZW5kaW5nUGlwZXMuY2xlYXIoKTtcblxuICAgIHJldHVybiBuZWVkc0FzeW5jUmVzb3VyY2VzO1xuICB9XG5cbiAgcHJpdmF0ZSBhcHBseVRyYW5zaXRpdmVTY29wZXMoKTogdm9pZCB7XG4gICAgaWYgKHRoaXMub3ZlcnJpZGRlbk1vZHVsZXMuc2l6ZSA+IDApIHtcbiAgICAgIC8vIE1vZHVsZSBvdmVycmlkZXMgKHZpYSBgVGVzdEJlZC5vdmVycmlkZU1vZHVsZWApIG1pZ2h0IGFmZmVjdCBzY29wZXMgdGhhdCB3ZXJlIHByZXZpb3VzbHlcbiAgICAgIC8vIGNhbGN1bGF0ZWQgYW5kIHN0b3JlZCBpbiBgdHJhbnNpdGl2ZUNvbXBpbGVTY29wZXNgLiBJZiBtb2R1bGUgb3ZlcnJpZGVzIGFyZSBwcmVzZW50LFxuICAgICAgLy8gY29sbGVjdCBhbGwgYWZmZWN0ZWQgbW9kdWxlcyBhbmQgcmVzZXQgc2NvcGVzIHRvIGZvcmNlIHRoZWlyIHJlLWNhbGN1bGF0aW9uLlxuICAgICAgY29uc3QgdGVzdGluZ01vZHVsZURlZiA9ICh0aGlzLnRlc3RNb2R1bGVUeXBlIGFzIGFueSlbTkdfTU9EX0RFRl07XG4gICAgICBjb25zdCBhZmZlY3RlZE1vZHVsZXMgPSB0aGlzLmNvbGxlY3RNb2R1bGVzQWZmZWN0ZWRCeU92ZXJyaWRlcyh0ZXN0aW5nTW9kdWxlRGVmLmltcG9ydHMpO1xuICAgICAgaWYgKGFmZmVjdGVkTW9kdWxlcy5zaXplID4gMCkge1xuICAgICAgICBhZmZlY3RlZE1vZHVsZXMuZm9yRWFjaChtb2R1bGVUeXBlID0+IHtcbiAgICAgICAgICBpZiAoIVVTRV9SVU5USU1FX0RFUFNfVFJBQ0tFUl9GT1JfSklUKSB7XG4gICAgICAgICAgICB0aGlzLnN0b3JlRmllbGRPZkRlZk9uVHlwZShtb2R1bGVUeXBlIGFzIGFueSwgTkdfTU9EX0RFRiwgJ3RyYW5zaXRpdmVDb21waWxlU2NvcGVzJyk7XG4gICAgICAgICAgICAobW9kdWxlVHlwZSBhcyBhbnkpW05HX01PRF9ERUZdLnRyYW5zaXRpdmVDb21waWxlU2NvcGVzID0gbnVsbDtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZGVwc1RyYWNrZXIuY2xlYXJTY29wZUNhY2hlRm9yKG1vZHVsZVR5cGUpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgY29uc3QgbW9kdWxlVG9TY29wZSA9IG5ldyBNYXA8VHlwZTxhbnk+fFRlc3RpbmdNb2R1bGVPdmVycmlkZSwgTmdNb2R1bGVUcmFuc2l0aXZlU2NvcGVzPigpO1xuICAgIGNvbnN0IGdldFNjb3BlT2ZNb2R1bGUgPVxuICAgICAgICAobW9kdWxlVHlwZTogVHlwZTxhbnk+fFRlc3RpbmdNb2R1bGVPdmVycmlkZSk6IE5nTW9kdWxlVHJhbnNpdGl2ZVNjb3BlcyA9PiB7XG4gICAgICAgICAgaWYgKCFtb2R1bGVUb1Njb3BlLmhhcyhtb2R1bGVUeXBlKSkge1xuICAgICAgICAgICAgY29uc3QgaXNUZXN0aW5nTW9kdWxlID0gaXNUZXN0aW5nTW9kdWxlT3ZlcnJpZGUobW9kdWxlVHlwZSk7XG4gICAgICAgICAgICBjb25zdCByZWFsVHlwZSA9IGlzVGVzdGluZ01vZHVsZSA/IHRoaXMudGVzdE1vZHVsZVR5cGUgOiBtb2R1bGVUeXBlIGFzIFR5cGU8YW55PjtcbiAgICAgICAgICAgIG1vZHVsZVRvU2NvcGUuc2V0KG1vZHVsZVR5cGUsIHRyYW5zaXRpdmVTY29wZXNGb3IocmVhbFR5cGUpKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIG1vZHVsZVRvU2NvcGUuZ2V0KG1vZHVsZVR5cGUpITtcbiAgICAgICAgfTtcblxuICAgIHRoaXMuY29tcG9uZW50VG9Nb2R1bGVTY29wZS5mb3JFYWNoKChtb2R1bGVUeXBlLCBjb21wb25lbnRUeXBlKSA9PiB7XG4gICAgICBjb25zdCBtb2R1bGVTY29wZSA9IGdldFNjb3BlT2ZNb2R1bGUobW9kdWxlVHlwZSk7XG4gICAgICB0aGlzLnN0b3JlRmllbGRPZkRlZk9uVHlwZShjb21wb25lbnRUeXBlLCBOR19DT01QX0RFRiwgJ2RpcmVjdGl2ZURlZnMnKTtcbiAgICAgIHRoaXMuc3RvcmVGaWVsZE9mRGVmT25UeXBlKGNvbXBvbmVudFR5cGUsIE5HX0NPTVBfREVGLCAncGlwZURlZnMnKTtcbiAgICAgIC8vIGB0Vmlld2AgdGhhdCBpcyBzdG9yZWQgb24gY29tcG9uZW50IGRlZiBjb250YWlucyBpbmZvcm1hdGlvbiBhYm91dCBkaXJlY3RpdmVzIGFuZCBwaXBlc1xuICAgICAgLy8gdGhhdCBhcmUgaW4gdGhlIHNjb3BlIG9mIHRoaXMgY29tcG9uZW50LiBQYXRjaGluZyBjb21wb25lbnQgc2NvcGUgd2lsbCBjYXVzZSBgdFZpZXdgIHRvIGJlXG4gICAgICAvLyBjaGFuZ2VkLiBTdG9yZSBvcmlnaW5hbCBgdFZpZXdgIGJlZm9yZSBwYXRjaGluZyBzY29wZSwgc28gdGhlIGB0Vmlld2AgKGluY2x1ZGluZyBzY29wZVxuICAgICAgLy8gaW5mb3JtYXRpb24pIGlzIHJlc3RvcmVkIGJhY2sgdG8gaXRzIHByZXZpb3VzL29yaWdpbmFsIHN0YXRlIGJlZm9yZSBydW5uaW5nIG5leHQgdGVzdC5cbiAgICAgIHRoaXMuc3RvcmVGaWVsZE9mRGVmT25UeXBlKGNvbXBvbmVudFR5cGUsIE5HX0NPTVBfREVGLCAndFZpZXcnKTtcbiAgICAgIHBhdGNoQ29tcG9uZW50RGVmV2l0aFNjb3BlKChjb21wb25lbnRUeXBlIGFzIGFueSkuybVjbXAsIG1vZHVsZVNjb3BlKTtcbiAgICB9KTtcblxuICAgIHRoaXMuY29tcG9uZW50VG9Nb2R1bGVTY29wZS5jbGVhcigpO1xuICB9XG5cbiAgcHJpdmF0ZSBhcHBseVByb3ZpZGVyT3ZlcnJpZGVzKCk6IHZvaWQge1xuICAgIGNvbnN0IG1heWJlQXBwbHlPdmVycmlkZXMgPSAoZmllbGQ6IHN0cmluZykgPT4gKHR5cGU6IFR5cGU8YW55PikgPT4ge1xuICAgICAgY29uc3QgcmVzb2x2ZXIgPSBmaWVsZCA9PT0gTkdfQ09NUF9ERUYgPyB0aGlzLnJlc29sdmVycy5jb21wb25lbnQgOiB0aGlzLnJlc29sdmVycy5kaXJlY3RpdmU7XG4gICAgICBjb25zdCBtZXRhZGF0YSA9IHJlc29sdmVyLnJlc29sdmUodHlwZSkhO1xuICAgICAgaWYgKHRoaXMuaGFzUHJvdmlkZXJPdmVycmlkZXMobWV0YWRhdGEucHJvdmlkZXJzKSkge1xuICAgICAgICB0aGlzLnBhdGNoRGVmV2l0aFByb3ZpZGVyT3ZlcnJpZGVzKHR5cGUsIGZpZWxkKTtcbiAgICAgIH1cbiAgICB9O1xuICAgIHRoaXMuc2VlbkNvbXBvbmVudHMuZm9yRWFjaChtYXliZUFwcGx5T3ZlcnJpZGVzKE5HX0NPTVBfREVGKSk7XG4gICAgdGhpcy5zZWVuRGlyZWN0aXZlcy5mb3JFYWNoKG1heWJlQXBwbHlPdmVycmlkZXMoTkdfRElSX0RFRikpO1xuXG4gICAgdGhpcy5zZWVuQ29tcG9uZW50cy5jbGVhcigpO1xuICAgIHRoaXMuc2VlbkRpcmVjdGl2ZXMuY2xlYXIoKTtcbiAgfVxuXG5cbiAgLyoqXG4gICAqIEFwcGxpZXMgcHJvdmlkZXIgb3ZlcnJpZGVzIHRvIGEgZ2l2ZW4gdHlwZSAoZWl0aGVyIGFuIE5nTW9kdWxlIG9yIGEgc3RhbmRhbG9uZSBjb21wb25lbnQpXG4gICAqIGFuZCBhbGwgaW1wb3J0ZWQgTmdNb2R1bGVzIGFuZCBzdGFuZGFsb25lIGNvbXBvbmVudHMgcmVjdXJzaXZlbHkuXG4gICAqL1xuICBwcml2YXRlIGFwcGx5UHJvdmlkZXJPdmVycmlkZXNJblNjb3BlKHR5cGU6IFR5cGU8YW55Pik6IHZvaWQge1xuICAgIGNvbnN0IGhhc1Njb3BlID0gaXNTdGFuZGFsb25lQ29tcG9uZW50KHR5cGUpIHx8IGlzTmdNb2R1bGUodHlwZSk7XG5cbiAgICAvLyBUaGUgZnVuY3Rpb24gY2FuIGJlIHJlLWVudGVyZWQgcmVjdXJzaXZlbHkgd2hpbGUgaW5zcGVjdGluZyBkZXBlbmRlbmNpZXNcbiAgICAvLyBvZiBhbiBOZ01vZHVsZSBvciBhIHN0YW5kYWxvbmUgY29tcG9uZW50LiBFeGl0IGVhcmx5IGlmIHdlIGNvbWUgYWNyb3NzIGFcbiAgICAvLyB0eXBlIHRoYXQgY2FuIG5vdCBoYXZlIGEgc2NvcGUgKGRpcmVjdGl2ZSBvciBwaXBlKSBvciB0aGUgdHlwZSBpcyBhbHJlYWR5XG4gICAgLy8gcHJvY2Vzc2VkIGVhcmxpZXIuXG4gICAgaWYgKCFoYXNTY29wZSB8fCB0aGlzLnNjb3Blc1dpdGhPdmVycmlkZGVuUHJvdmlkZXJzLmhhcyh0eXBlKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLnNjb3Blc1dpdGhPdmVycmlkZGVuUHJvdmlkZXJzLmFkZCh0eXBlKTtcblxuICAgIC8vIE5PVEU6IHRoZSBsaW5lIGJlbG93IHRyaWdnZXJzIEpJVCBjb21waWxhdGlvbiBvZiB0aGUgbW9kdWxlIGluamVjdG9yLFxuICAgIC8vIHdoaWNoIGFsc28gaW52b2tlcyB2ZXJpZmljYXRpb24gb2YgdGhlIE5nTW9kdWxlIHNlbWFudGljcywgd2hpY2ggcHJvZHVjZXNcbiAgICAvLyBkZXRhaWxlZCBlcnJvciBtZXNzYWdlcy4gVGhlIGZhY3QgdGhhdCB0aGUgY29kZSByZWxpZXMgb24gdGhpcyBsaW5lIGJlaW5nXG4gICAgLy8gcHJlc2VudCBoZXJlIGlzIHN1c3BpY2lvdXMgYW5kIHNob3VsZCBiZSByZWZhY3RvcmVkIGluIGEgd2F5IHRoYXQgdGhlIGxpbmVcbiAgICAvLyBiZWxvdyBjYW4gYmUgbW92ZWQgKGZvciBleC4gYWZ0ZXIgYW4gZWFybHkgZXhpdCBjaGVjayBiZWxvdykuXG4gICAgY29uc3QgaW5qZWN0b3JEZWY6IGFueSA9ICh0eXBlIGFzIGFueSlbTkdfSU5KX0RFRl07XG5cbiAgICAvLyBObyBwcm92aWRlciBvdmVycmlkZXMsIGV4aXQgZWFybHkuXG4gICAgaWYgKHRoaXMucHJvdmlkZXJPdmVycmlkZXNCeVRva2VuLnNpemUgPT09IDApIHJldHVybjtcblxuICAgIGlmIChpc1N0YW5kYWxvbmVDb21wb25lbnQodHlwZSkpIHtcbiAgICAgIC8vIFZpc2l0IGFsbCBjb21wb25lbnQgZGVwZW5kZW5jaWVzIGFuZCBvdmVycmlkZSBwcm92aWRlcnMgdGhlcmUuXG4gICAgICBjb25zdCBkZWYgPSBnZXRDb21wb25lbnREZWYodHlwZSk7XG4gICAgICBjb25zdCBkZXBlbmRlbmNpZXMgPSBtYXliZVVud3JhcEZuKGRlZi5kZXBlbmRlbmNpZXMgPz8gW10pO1xuICAgICAgZm9yIChjb25zdCBkZXBlbmRlbmN5IG9mIGRlcGVuZGVuY2llcykge1xuICAgICAgICB0aGlzLmFwcGx5UHJvdmlkZXJPdmVycmlkZXNJblNjb3BlKGRlcGVuZGVuY3kpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBwcm92aWRlcnM6IEFycmF5PFByb3ZpZGVyfEludGVybmFsRW52aXJvbm1lbnRQcm92aWRlcnM+ID0gW1xuICAgICAgICAuLi5pbmplY3RvckRlZi5wcm92aWRlcnMsXG4gICAgICAgIC4uLih0aGlzLnByb3ZpZGVyT3ZlcnJpZGVzQnlNb2R1bGUuZ2V0KHR5cGUgYXMgSW5qZWN0b3JUeXBlPGFueT4pIHx8IFtdKVxuICAgICAgXTtcbiAgICAgIGlmICh0aGlzLmhhc1Byb3ZpZGVyT3ZlcnJpZGVzKHByb3ZpZGVycykpIHtcbiAgICAgICAgdGhpcy5tYXliZVN0b3JlTmdEZWYoTkdfSU5KX0RFRiwgdHlwZSk7XG5cbiAgICAgICAgdGhpcy5zdG9yZUZpZWxkT2ZEZWZPblR5cGUodHlwZSwgTkdfSU5KX0RFRiwgJ3Byb3ZpZGVycycpO1xuICAgICAgICBpbmplY3RvckRlZi5wcm92aWRlcnMgPSB0aGlzLmdldE92ZXJyaWRkZW5Qcm92aWRlcnMocHJvdmlkZXJzKTtcbiAgICAgIH1cblxuICAgICAgLy8gQXBwbHkgcHJvdmlkZXIgb3ZlcnJpZGVzIHRvIGltcG9ydGVkIG1vZHVsZXMgcmVjdXJzaXZlbHlcbiAgICAgIGNvbnN0IG1vZHVsZURlZiA9ICh0eXBlIGFzIGFueSlbTkdfTU9EX0RFRl07XG4gICAgICBjb25zdCBpbXBvcnRzID0gbWF5YmVVbndyYXBGbihtb2R1bGVEZWYuaW1wb3J0cyk7XG4gICAgICBmb3IgKGNvbnN0IGltcG9ydGVkTW9kdWxlIG9mIGltcG9ydHMpIHtcbiAgICAgICAgdGhpcy5hcHBseVByb3ZpZGVyT3ZlcnJpZGVzSW5TY29wZShpbXBvcnRlZE1vZHVsZSk7XG4gICAgICB9XG4gICAgICAvLyBBbHNvIG92ZXJyaWRlIHRoZSBwcm92aWRlcnMgb24gYW55IE1vZHVsZVdpdGhQcm92aWRlcnMgaW1wb3J0cyBzaW5jZSB0aG9zZSBkb24ndCBhcHBlYXIgaW5cbiAgICAgIC8vIHRoZSBtb2R1bGVEZWYuXG4gICAgICBmb3IgKGNvbnN0IGltcG9ydGVkTW9kdWxlIG9mIGZsYXR0ZW4oaW5qZWN0b3JEZWYuaW1wb3J0cykpIHtcbiAgICAgICAgaWYgKGlzTW9kdWxlV2l0aFByb3ZpZGVycyhpbXBvcnRlZE1vZHVsZSkpIHtcbiAgICAgICAgICB0aGlzLmRlZkNsZWFudXBPcHMucHVzaCh7XG4gICAgICAgICAgICBvYmplY3Q6IGltcG9ydGVkTW9kdWxlLFxuICAgICAgICAgICAgZmllbGROYW1lOiAncHJvdmlkZXJzJyxcbiAgICAgICAgICAgIG9yaWdpbmFsVmFsdWU6IGltcG9ydGVkTW9kdWxlLnByb3ZpZGVyc1xuICAgICAgICAgIH0pO1xuICAgICAgICAgIGltcG9ydGVkTW9kdWxlLnByb3ZpZGVycyA9IHRoaXMuZ2V0T3ZlcnJpZGRlblByb3ZpZGVycyhcbiAgICAgICAgICAgICAgaW1wb3J0ZWRNb2R1bGUucHJvdmlkZXJzIGFzIEFycmF5PFByb3ZpZGVyfEludGVybmFsRW52aXJvbm1lbnRQcm92aWRlcnM+KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgcGF0Y2hDb21wb25lbnRzV2l0aEV4aXN0aW5nU3R5bGVzKCk6IHZvaWQge1xuICAgIHRoaXMuZXhpc3RpbmdDb21wb25lbnRTdHlsZXMuZm9yRWFjaChcbiAgICAgICAgKHN0eWxlcywgdHlwZSkgPT4gKHR5cGUgYXMgYW55KVtOR19DT01QX0RFRl0uc3R5bGVzID0gc3R5bGVzKTtcbiAgICB0aGlzLmV4aXN0aW5nQ29tcG9uZW50U3R5bGVzLmNsZWFyKCk7XG4gIH1cblxuICBwcml2YXRlIHF1ZXVlVHlwZUFycmF5KGFycjogYW55W10sIG1vZHVsZVR5cGU6IFR5cGU8YW55PnxUZXN0aW5nTW9kdWxlT3ZlcnJpZGUpOiB2b2lkIHtcbiAgICBmb3IgKGNvbnN0IHZhbHVlIG9mIGFycikge1xuICAgICAgaWYgKEFycmF5LmlzQXJyYXkodmFsdWUpKSB7XG4gICAgICAgIHRoaXMucXVldWVUeXBlQXJyYXkodmFsdWUsIG1vZHVsZVR5cGUpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5xdWV1ZVR5cGUodmFsdWUsIG1vZHVsZVR5cGUpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgcmVjb21waWxlTmdNb2R1bGUobmdNb2R1bGU6IFR5cGU8YW55PiwgbWV0YWRhdGE6IE5nTW9kdWxlKTogdm9pZCB7XG4gICAgLy8gQ2FjaGUgdGhlIGluaXRpYWwgbmdNb2R1bGVEZWYgYXMgaXQgd2lsbCBiZSBvdmVyd3JpdHRlbi5cbiAgICB0aGlzLm1heWJlU3RvcmVOZ0RlZihOR19NT0RfREVGLCBuZ01vZHVsZSk7XG4gICAgdGhpcy5tYXliZVN0b3JlTmdEZWYoTkdfSU5KX0RFRiwgbmdNb2R1bGUpO1xuXG4gICAgY29tcGlsZU5nTW9kdWxlRGVmcyhuZ01vZHVsZSBhcyBOZ01vZHVsZVR5cGU8YW55PiwgbWV0YWRhdGEpO1xuICB9XG5cbiAgcHJpdmF0ZSBxdWV1ZVR5cGUodHlwZTogVHlwZTxhbnk+LCBtb2R1bGVUeXBlOiBUeXBlPGFueT58VGVzdGluZ01vZHVsZU92ZXJyaWRlfG51bGwpOiB2b2lkIHtcbiAgICBjb25zdCBjb21wb25lbnQgPSB0aGlzLnJlc29sdmVycy5jb21wb25lbnQucmVzb2x2ZSh0eXBlKTtcbiAgICBpZiAoY29tcG9uZW50KSB7XG4gICAgICAvLyBDaGVjayB3aGV0aGVyIGEgZ2l2ZSBUeXBlIGhhcyByZXNwZWN0aXZlIE5HIGRlZiAoybVjbXApIGFuZCBjb21waWxlIGlmIGRlZiBpc1xuICAgICAgLy8gbWlzc2luZy4gVGhhdCBtaWdodCBoYXBwZW4gaW4gY2FzZSBhIGNsYXNzIHdpdGhvdXQgYW55IEFuZ3VsYXIgZGVjb3JhdG9ycyBleHRlbmRzIGFub3RoZXJcbiAgICAgIC8vIGNsYXNzIHdoZXJlIENvbXBvbmVudC9EaXJlY3RpdmUvUGlwZSBkZWNvcmF0b3IgaXMgZGVmaW5lZC5cbiAgICAgIGlmICjJtWlzQ29tcG9uZW50RGVmUGVuZGluZ1Jlc29sdXRpb24odHlwZSkgfHwgIXR5cGUuaGFzT3duUHJvcGVydHkoTkdfQ09NUF9ERUYpKSB7XG4gICAgICAgIHRoaXMucGVuZGluZ0NvbXBvbmVudHMuYWRkKHR5cGUpO1xuICAgICAgfVxuICAgICAgdGhpcy5zZWVuQ29tcG9uZW50cy5hZGQodHlwZSk7XG5cbiAgICAgIC8vIEtlZXAgdHJhY2sgb2YgdGhlIG1vZHVsZSB3aGljaCBkZWNsYXJlcyB0aGlzIGNvbXBvbmVudCwgc28gbGF0ZXIgdGhlIGNvbXBvbmVudCdzIHNjb3BlXG4gICAgICAvLyBjYW4gYmUgc2V0IGNvcnJlY3RseS4gSWYgdGhlIGNvbXBvbmVudCBoYXMgYWxyZWFkeSBiZWVuIHJlY29yZGVkIGhlcmUsIHRoZW4gb25lIG9mIHNldmVyYWxcbiAgICAgIC8vIGNhc2VzIGlzIHRydWU6XG4gICAgICAvLyAqIHRoZSBtb2R1bGUgY29udGFpbmluZyB0aGUgY29tcG9uZW50IHdhcyBpbXBvcnRlZCBtdWx0aXBsZSB0aW1lcyAoY29tbW9uKS5cbiAgICAgIC8vICogdGhlIGNvbXBvbmVudCBpcyBkZWNsYXJlZCBpbiBtdWx0aXBsZSBtb2R1bGVzICh3aGljaCBpcyBhbiBlcnJvcikuXG4gICAgICAvLyAqIHRoZSBjb21wb25lbnQgd2FzIGluICdkZWNsYXJhdGlvbnMnIG9mIHRoZSB0ZXN0aW5nIG1vZHVsZSwgYW5kIGFsc28gaW4gYW4gaW1wb3J0ZWQgbW9kdWxlXG4gICAgICAvLyAgIGluIHdoaWNoIGNhc2UgdGhlIG1vZHVsZSBzY29wZSB3aWxsIGJlIFRlc3RpbmdNb2R1bGVPdmVycmlkZS5ERUNMQVJBVElPTi5cbiAgICAgIC8vICogb3ZlcnJpZGVUZW1wbGF0ZVVzaW5nVGVzdGluZ01vZHVsZSB3YXMgY2FsbGVkIGZvciB0aGUgY29tcG9uZW50IGluIHdoaWNoIGNhc2UgdGhlIG1vZHVsZVxuICAgICAgLy8gICBzY29wZSB3aWxsIGJlIFRlc3RpbmdNb2R1bGVPdmVycmlkZS5PVkVSUklERV9URU1QTEFURS5cbiAgICAgIC8vXG4gICAgICAvLyBJZiB0aGUgY29tcG9uZW50IHdhcyBwcmV2aW91c2x5IGluIHRoZSB0ZXN0aW5nIG1vZHVsZSdzICdkZWNsYXJhdGlvbnMnIChtZWFuaW5nIHRoZVxuICAgICAgLy8gY3VycmVudCB2YWx1ZSBpcyBUZXN0aW5nTW9kdWxlT3ZlcnJpZGUuREVDTEFSQVRJT04pLCB0aGVuIGBtb2R1bGVUeXBlYCBpcyB0aGUgY29tcG9uZW50J3NcbiAgICAgIC8vIHJlYWwgbW9kdWxlLCB3aGljaCB3YXMgaW1wb3J0ZWQuIFRoaXMgcGF0dGVybiBpcyB1bmRlcnN0b29kIHRvIG1lYW4gdGhhdCB0aGUgY29tcG9uZW50XG4gICAgICAvLyBzaG91bGQgdXNlIGl0cyBvcmlnaW5hbCBzY29wZSwgYnV0IHRoYXQgdGhlIHRlc3RpbmcgbW9kdWxlIHNob3VsZCBhbHNvIGNvbnRhaW4gdGhlXG4gICAgICAvLyBjb21wb25lbnQgaW4gaXRzIHNjb3BlLlxuICAgICAgLy9cbiAgICAgIC8vIE5vdGU6IHN0YW5kYWxvbmUgY29tcG9uZW50cyBoYXZlIG5vIGFzc29jaWF0ZWQgTmdNb2R1bGUsIHNvIHRoZSBgbW9kdWxlVHlwZWAgY2FuIGJlIGBudWxsYC5cbiAgICAgIGlmIChtb2R1bGVUeXBlICE9PSBudWxsICYmXG4gICAgICAgICAgKCF0aGlzLmNvbXBvbmVudFRvTW9kdWxlU2NvcGUuaGFzKHR5cGUpIHx8XG4gICAgICAgICAgIHRoaXMuY29tcG9uZW50VG9Nb2R1bGVTY29wZS5nZXQodHlwZSkgPT09IFRlc3RpbmdNb2R1bGVPdmVycmlkZS5ERUNMQVJBVElPTikpIHtcbiAgICAgICAgdGhpcy5jb21wb25lbnRUb01vZHVsZVNjb3BlLnNldCh0eXBlLCBtb2R1bGVUeXBlKTtcbiAgICAgIH1cbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBkaXJlY3RpdmUgPSB0aGlzLnJlc29sdmVycy5kaXJlY3RpdmUucmVzb2x2ZSh0eXBlKTtcbiAgICBpZiAoZGlyZWN0aXZlKSB7XG4gICAgICBpZiAoIXR5cGUuaGFzT3duUHJvcGVydHkoTkdfRElSX0RFRikpIHtcbiAgICAgICAgdGhpcy5wZW5kaW5nRGlyZWN0aXZlcy5hZGQodHlwZSk7XG4gICAgICB9XG4gICAgICB0aGlzLnNlZW5EaXJlY3RpdmVzLmFkZCh0eXBlKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBwaXBlID0gdGhpcy5yZXNvbHZlcnMucGlwZS5yZXNvbHZlKHR5cGUpO1xuICAgIGlmIChwaXBlICYmICF0eXBlLmhhc093blByb3BlcnR5KE5HX1BJUEVfREVGKSkge1xuICAgICAgdGhpcy5wZW5kaW5nUGlwZXMuYWRkKHR5cGUpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgcXVldWVUeXBlc0Zyb21Nb2R1bGVzQXJyYXkoYXJyOiBhbnlbXSk6IHZvaWQge1xuICAgIC8vIEJlY2F1c2Ugd2UgbWF5IGVuY291bnRlciB0aGUgc2FtZSBOZ01vZHVsZSBvciBhIHN0YW5kYWxvbmUgQ29tcG9uZW50IHdoaWxlIHByb2Nlc3NpbmdcbiAgICAvLyB0aGUgZGVwZW5kZW5jaWVzIG9mIGFuIE5nTW9kdWxlIG9yIGEgc3RhbmRhbG9uZSBDb21wb25lbnQsIHdlIGNhY2hlIHRoZW0gaW4gdGhpcyBzZXQgc28gd2VcbiAgICAvLyBjYW4gc2tpcCBvbmVzIHRoYXQgaGF2ZSBhbHJlYWR5IGJlZW4gc2VlbiBlbmNvdW50ZXJlZC4gSW4gc29tZSB0ZXN0IHNldHVwcywgdGhpcyBjYWNoaW5nXG4gICAgLy8gcmVzdWx0ZWQgaW4gMTBYIHJ1bnRpbWUgaW1wcm92ZW1lbnQuXG4gICAgY29uc3QgcHJvY2Vzc2VkRGVmcyA9IG5ldyBTZXQoKTtcbiAgICBjb25zdCBxdWV1ZVR5cGVzRnJvbU1vZHVsZXNBcnJheVJlY3VyID0gKGFycjogYW55W10pOiB2b2lkID0+IHtcbiAgICAgIGZvciAoY29uc3QgdmFsdWUgb2YgYXJyKSB7XG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KHZhbHVlKSkge1xuICAgICAgICAgIHF1ZXVlVHlwZXNGcm9tTW9kdWxlc0FycmF5UmVjdXIodmFsdWUpO1xuICAgICAgICB9IGVsc2UgaWYgKGhhc05nTW9kdWxlRGVmKHZhbHVlKSkge1xuICAgICAgICAgIGNvbnN0IGRlZiA9IHZhbHVlLsm1bW9kO1xuICAgICAgICAgIGlmIChwcm9jZXNzZWREZWZzLmhhcyhkZWYpKSB7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcHJvY2Vzc2VkRGVmcy5hZGQoZGVmKTtcbiAgICAgICAgICAvLyBMb29rIHRocm91Z2ggZGVjbGFyYXRpb25zLCBpbXBvcnRzLCBhbmQgZXhwb3J0cywgYW5kIHF1ZXVlXG4gICAgICAgICAgLy8gZXZlcnl0aGluZyBmb3VuZCB0aGVyZS5cbiAgICAgICAgICB0aGlzLnF1ZXVlVHlwZUFycmF5KG1heWJlVW53cmFwRm4oZGVmLmRlY2xhcmF0aW9ucyksIHZhbHVlKTtcbiAgICAgICAgICBxdWV1ZVR5cGVzRnJvbU1vZHVsZXNBcnJheVJlY3VyKG1heWJlVW53cmFwRm4oZGVmLmltcG9ydHMpKTtcbiAgICAgICAgICBxdWV1ZVR5cGVzRnJvbU1vZHVsZXNBcnJheVJlY3VyKG1heWJlVW53cmFwRm4oZGVmLmV4cG9ydHMpKTtcbiAgICAgICAgfSBlbHNlIGlmIChpc01vZHVsZVdpdGhQcm92aWRlcnModmFsdWUpKSB7XG4gICAgICAgICAgcXVldWVUeXBlc0Zyb21Nb2R1bGVzQXJyYXlSZWN1cihbdmFsdWUubmdNb2R1bGVdKTtcbiAgICAgICAgfSBlbHNlIGlmIChpc1N0YW5kYWxvbmVDb21wb25lbnQodmFsdWUpKSB7XG4gICAgICAgICAgdGhpcy5xdWV1ZVR5cGUodmFsdWUsIG51bGwpO1xuICAgICAgICAgIGNvbnN0IGRlZiA9IGdldENvbXBvbmVudERlZih2YWx1ZSk7XG5cbiAgICAgICAgICBpZiAocHJvY2Vzc2VkRGVmcy5oYXMoZGVmKSkge1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgfVxuICAgICAgICAgIHByb2Nlc3NlZERlZnMuYWRkKGRlZik7XG5cbiAgICAgICAgICBjb25zdCBkZXBlbmRlbmNpZXMgPSBtYXliZVVud3JhcEZuKGRlZi5kZXBlbmRlbmNpZXMgPz8gW10pO1xuICAgICAgICAgIGRlcGVuZGVuY2llcy5mb3JFYWNoKChkZXBlbmRlbmN5KSA9PiB7XG4gICAgICAgICAgICAvLyBOb3RlOiBpbiBBT1QsIHRoZSBgZGVwZW5kZW5jaWVzYCBtaWdodCBhbHNvIGNvbnRhaW4gcmVndWxhclxuICAgICAgICAgICAgLy8gKE5nTW9kdWxlLWJhc2VkKSBDb21wb25lbnQsIERpcmVjdGl2ZSBhbmQgUGlwZXMsIHNvIHdlIGhhbmRsZVxuICAgICAgICAgICAgLy8gdGhlbSBzZXBhcmF0ZWx5IGFuZCBwcm9jZWVkIHdpdGggcmVjdXJzaXZlIHByb2Nlc3MgZm9yIHN0YW5kYWxvbmVcbiAgICAgICAgICAgIC8vIENvbXBvbmVudHMgYW5kIE5nTW9kdWxlcyBvbmx5LlxuICAgICAgICAgICAgaWYgKGlzU3RhbmRhbG9uZUNvbXBvbmVudChkZXBlbmRlbmN5KSB8fCBoYXNOZ01vZHVsZURlZihkZXBlbmRlbmN5KSkge1xuICAgICAgICAgICAgICBxdWV1ZVR5cGVzRnJvbU1vZHVsZXNBcnJheVJlY3VyKFtkZXBlbmRlbmN5XSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICB0aGlzLnF1ZXVlVHlwZShkZXBlbmRlbmN5LCBudWxsKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH07XG4gICAgcXVldWVUeXBlc0Zyb21Nb2R1bGVzQXJyYXlSZWN1cihhcnIpO1xuICB9XG5cbiAgLy8gV2hlbiBtb2R1bGUgb3ZlcnJpZGVzICh2aWEgYFRlc3RCZWQub3ZlcnJpZGVNb2R1bGVgKSBhcmUgcHJlc2VudCwgaXQgbWlnaHQgYWZmZWN0IGFsbCBtb2R1bGVzXG4gIC8vIHRoYXQgaW1wb3J0IChldmVuIHRyYW5zaXRpdmVseSkgYW4gb3ZlcnJpZGRlbiBvbmUuIEZvciBhbGwgYWZmZWN0ZWQgbW9kdWxlcyB3ZSBuZWVkIHRvXG4gIC8vIHJlY2FsY3VsYXRlIHRoZWlyIHNjb3BlcyBmb3IgYSBnaXZlbiB0ZXN0IHJ1biBhbmQgcmVzdG9yZSBvcmlnaW5hbCBzY29wZXMgYXQgdGhlIGVuZC4gVGhlIGdvYWxcbiAgLy8gb2YgdGhpcyBmdW5jdGlvbiBpcyB0byBjb2xsZWN0IGFsbCBhZmZlY3RlZCBtb2R1bGVzIGluIGEgc2V0IGZvciBmdXJ0aGVyIHByb2Nlc3NpbmcuIEV4YW1wbGU6XG4gIC8vIGlmIHdlIGhhdmUgdGhlIGZvbGxvd2luZyBtb2R1bGUgaGllcmFyY2h5OiBBIC0+IEIgLT4gQyAod2hlcmUgYC0+YCBtZWFucyBgaW1wb3J0c2ApIGFuZCBtb2R1bGVcbiAgLy8gYENgIGlzIG92ZXJyaWRkZW4sIHdlIGNvbnNpZGVyIGBBYCBhbmQgYEJgIGFzIGFmZmVjdGVkLCBzaW5jZSB0aGVpciBzY29wZXMgbWlnaHQgYmVjb21lXG4gIC8vIGludmFsaWRhdGVkIHdpdGggdGhlIG92ZXJyaWRlLlxuICBwcml2YXRlIGNvbGxlY3RNb2R1bGVzQWZmZWN0ZWRCeU92ZXJyaWRlcyhhcnI6IGFueVtdKTogU2V0PE5nTW9kdWxlVHlwZTxhbnk+PiB7XG4gICAgY29uc3Qgc2Vlbk1vZHVsZXMgPSBuZXcgU2V0PE5nTW9kdWxlVHlwZTxhbnk+PigpO1xuICAgIGNvbnN0IGFmZmVjdGVkTW9kdWxlcyA9IG5ldyBTZXQ8TmdNb2R1bGVUeXBlPGFueT4+KCk7XG4gICAgY29uc3QgY2FsY0FmZmVjdGVkTW9kdWxlc1JlY3VyID0gKGFycjogYW55W10sIHBhdGg6IE5nTW9kdWxlVHlwZTxhbnk+W10pOiB2b2lkID0+IHtcbiAgICAgIGZvciAoY29uc3QgdmFsdWUgb2YgYXJyKSB7XG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KHZhbHVlKSkge1xuICAgICAgICAgIC8vIElmIHRoZSB2YWx1ZSBpcyBhbiBhcnJheSwganVzdCBmbGF0dGVuIGl0IChieSBpbnZva2luZyB0aGlzIGZ1bmN0aW9uIHJlY3Vyc2l2ZWx5KSxcbiAgICAgICAgICAvLyBrZWVwaW5nIFwicGF0aFwiIHRoZSBzYW1lLlxuICAgICAgICAgIGNhbGNBZmZlY3RlZE1vZHVsZXNSZWN1cih2YWx1ZSwgcGF0aCk7XG4gICAgICAgIH0gZWxzZSBpZiAoaGFzTmdNb2R1bGVEZWYodmFsdWUpKSB7XG4gICAgICAgICAgaWYgKHNlZW5Nb2R1bGVzLmhhcyh2YWx1ZSkpIHtcbiAgICAgICAgICAgIC8vIElmIHdlJ3ZlIHNlZW4gdGhpcyBtb2R1bGUgYmVmb3JlIGFuZCBpdCdzIGluY2x1ZGVkIGludG8gXCJhZmZlY3RlZCBtb2R1bGVzXCIgbGlzdCwgbWFya1xuICAgICAgICAgICAgLy8gdGhlIHdob2xlIHBhdGggdGhhdCBsZWFkcyB0byB0aGF0IG1vZHVsZSBhcyBhZmZlY3RlZCwgYnV0IGRvIG5vdCBkZXNjZW5kIGludG8gaXRzXG4gICAgICAgICAgICAvLyBpbXBvcnRzLCBzaW5jZSB3ZSBhbHJlYWR5IGV4YW1pbmVkIHRoZW0gYmVmb3JlLlxuICAgICAgICAgICAgaWYgKGFmZmVjdGVkTW9kdWxlcy5oYXModmFsdWUpKSB7XG4gICAgICAgICAgICAgIHBhdGguZm9yRWFjaChpdGVtID0+IGFmZmVjdGVkTW9kdWxlcy5hZGQoaXRlbSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgfVxuICAgICAgICAgIHNlZW5Nb2R1bGVzLmFkZCh2YWx1ZSk7XG4gICAgICAgICAgaWYgKHRoaXMub3ZlcnJpZGRlbk1vZHVsZXMuaGFzKHZhbHVlKSkge1xuICAgICAgICAgICAgcGF0aC5mb3JFYWNoKGl0ZW0gPT4gYWZmZWN0ZWRNb2R1bGVzLmFkZChpdGVtKSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIC8vIEV4YW1pbmUgbW9kdWxlIGltcG9ydHMgcmVjdXJzaXZlbHkgdG8gbG9vayBmb3Igb3ZlcnJpZGRlbiBtb2R1bGVzLlxuICAgICAgICAgIGNvbnN0IG1vZHVsZURlZiA9ICh2YWx1ZSBhcyBhbnkpW05HX01PRF9ERUZdO1xuICAgICAgICAgIGNhbGNBZmZlY3RlZE1vZHVsZXNSZWN1cihtYXliZVVud3JhcEZuKG1vZHVsZURlZi5pbXBvcnRzKSwgcGF0aC5jb25jYXQodmFsdWUpKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH07XG4gICAgY2FsY0FmZmVjdGVkTW9kdWxlc1JlY3VyKGFyciwgW10pO1xuICAgIHJldHVybiBhZmZlY3RlZE1vZHVsZXM7XG4gIH1cblxuICAvKipcbiAgICogUHJlc2VydmUgYW4gb3JpZ2luYWwgZGVmIChzdWNoIGFzIMm1bW9kLCDJtWluaiwgZXRjKSBiZWZvcmUgYXBwbHlpbmcgYW4gb3ZlcnJpZGUuXG4gICAqIE5vdGU6IG9uZSBjbGFzcyBtYXkgaGF2ZSBtdWx0aXBsZSBkZWZzIChmb3IgZXhhbXBsZTogybVtb2QgYW5kIMm1aW5qIGluIGNhc2Ugb2ZcbiAgICogYW4gTmdNb2R1bGUpLiBJZiB0aGVyZSBpcyBhIGRlZiBpbiBhIHNldCBhbHJlYWR5LCBkb24ndCBvdmVycmlkZSBpdCwgc2luY2VcbiAgICogYW4gb3JpZ2luYWwgb25lIHNob3VsZCBiZSByZXN0b3JlZCBhdCB0aGUgZW5kIG9mIGEgdGVzdC5cbiAgICovXG4gIHByaXZhdGUgbWF5YmVTdG9yZU5nRGVmKHByb3A6IHN0cmluZywgdHlwZTogVHlwZTxhbnk+KSB7XG4gICAgaWYgKCF0aGlzLmluaXRpYWxOZ0RlZnMuaGFzKHR5cGUpKSB7XG4gICAgICB0aGlzLmluaXRpYWxOZ0RlZnMuc2V0KHR5cGUsIG5ldyBNYXAoKSk7XG4gICAgfVxuICAgIGNvbnN0IGN1cnJlbnREZWZzID0gdGhpcy5pbml0aWFsTmdEZWZzLmdldCh0eXBlKSE7XG4gICAgaWYgKCFjdXJyZW50RGVmcy5oYXMocHJvcCkpIHtcbiAgICAgIGNvbnN0IGN1cnJlbnREZWYgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHR5cGUsIHByb3ApO1xuICAgICAgY3VycmVudERlZnMuc2V0KHByb3AsIGN1cnJlbnREZWYpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgc3RvcmVGaWVsZE9mRGVmT25UeXBlKHR5cGU6IFR5cGU8YW55PiwgZGVmRmllbGQ6IHN0cmluZywgZmllbGROYW1lOiBzdHJpbmcpOiB2b2lkIHtcbiAgICBjb25zdCBkZWY6IGFueSA9ICh0eXBlIGFzIGFueSlbZGVmRmllbGRdO1xuICAgIGNvbnN0IG9yaWdpbmFsVmFsdWU6IGFueSA9IGRlZltmaWVsZE5hbWVdO1xuICAgIHRoaXMuZGVmQ2xlYW51cE9wcy5wdXNoKHtvYmplY3Q6IGRlZiwgZmllbGROYW1lLCBvcmlnaW5hbFZhbHVlfSk7XG4gIH1cblxuICAvKipcbiAgICogQ2xlYXJzIGN1cnJlbnQgY29tcG9uZW50cyByZXNvbHV0aW9uIHF1ZXVlLCBidXQgc3RvcmVzIHRoZSBzdGF0ZSBvZiB0aGUgcXVldWUsIHNvIHdlIGNhblxuICAgKiByZXN0b3JlIGl0IGxhdGVyLiBDbGVhcmluZyB0aGUgcXVldWUgaXMgcmVxdWlyZWQgYmVmb3JlIHdlIHRyeSB0byBjb21waWxlIGNvbXBvbmVudHMgKHZpYVxuICAgKiBgVGVzdEJlZC5jb21waWxlQ29tcG9uZW50c2ApLCBzbyB0aGF0IGNvbXBvbmVudCBkZWZzIGFyZSBpbiBzeW5jIHdpdGggdGhlIHJlc29sdXRpb24gcXVldWUuXG4gICAqL1xuICBwcml2YXRlIGNsZWFyQ29tcG9uZW50UmVzb2x1dGlvblF1ZXVlKCkge1xuICAgIGlmICh0aGlzLm9yaWdpbmFsQ29tcG9uZW50UmVzb2x1dGlvblF1ZXVlID09PSBudWxsKSB7XG4gICAgICB0aGlzLm9yaWdpbmFsQ29tcG9uZW50UmVzb2x1dGlvblF1ZXVlID0gbmV3IE1hcCgpO1xuICAgIH1cbiAgICDJtWNsZWFyUmVzb2x1dGlvbk9mQ29tcG9uZW50UmVzb3VyY2VzUXVldWUoKS5mb3JFYWNoKFxuICAgICAgICAodmFsdWUsIGtleSkgPT4gdGhpcy5vcmlnaW5hbENvbXBvbmVudFJlc29sdXRpb25RdWV1ZSEuc2V0KGtleSwgdmFsdWUpKTtcbiAgfVxuXG4gIC8qXG4gICAqIFJlc3RvcmVzIGNvbXBvbmVudCByZXNvbHV0aW9uIHF1ZXVlIHRvIHRoZSBwcmV2aW91c2x5IHNhdmVkIHN0YXRlLiBUaGlzIG9wZXJhdGlvbiBpcyBwZXJmb3JtZWRcbiAgICogYXMgYSBwYXJ0IG9mIHJlc3RvcmluZyB0aGUgc3RhdGUgYWZ0ZXIgY29tcGxldGlvbiBvZiB0aGUgY3VycmVudCBzZXQgb2YgdGVzdHMgKHRoYXQgbWlnaHRcbiAgICogcG90ZW50aWFsbHkgbXV0YXRlIHRoZSBzdGF0ZSkuXG4gICAqL1xuICBwcml2YXRlIHJlc3RvcmVDb21wb25lbnRSZXNvbHV0aW9uUXVldWUoKSB7XG4gICAgaWYgKHRoaXMub3JpZ2luYWxDb21wb25lbnRSZXNvbHV0aW9uUXVldWUgIT09IG51bGwpIHtcbiAgICAgIMm1cmVzdG9yZUNvbXBvbmVudFJlc29sdXRpb25RdWV1ZSh0aGlzLm9yaWdpbmFsQ29tcG9uZW50UmVzb2x1dGlvblF1ZXVlKTtcbiAgICAgIHRoaXMub3JpZ2luYWxDb21wb25lbnRSZXNvbHV0aW9uUXVldWUgPSBudWxsO1xuICAgIH1cbiAgfVxuXG4gIHJlc3RvcmVPcmlnaW5hbFN0YXRlKCk6IHZvaWQge1xuICAgIC8vIFByb2Nlc3MgY2xlYW51cCBvcHMgaW4gcmV2ZXJzZSBvcmRlciBzbyB0aGUgZmllbGQncyBvcmlnaW5hbCB2YWx1ZSBpcyByZXN0b3JlZCBjb3JyZWN0bHkgKGluXG4gICAgLy8gY2FzZSB0aGVyZSB3ZXJlIG11bHRpcGxlIG92ZXJyaWRlcyBmb3IgdGhlIHNhbWUgZmllbGQpLlxuICAgIGZvckVhY2hSaWdodCh0aGlzLmRlZkNsZWFudXBPcHMsIChvcDogQ2xlYW51cE9wZXJhdGlvbikgPT4ge1xuICAgICAgb3Aub2JqZWN0W29wLmZpZWxkTmFtZV0gPSBvcC5vcmlnaW5hbFZhbHVlO1xuICAgIH0pO1xuICAgIC8vIFJlc3RvcmUgaW5pdGlhbCBjb21wb25lbnQvZGlyZWN0aXZlL3BpcGUgZGVmc1xuICAgIHRoaXMuaW5pdGlhbE5nRGVmcy5mb3JFYWNoKFxuICAgICAgICAoZGVmczogTWFwPHN0cmluZywgUHJvcGVydHlEZXNjcmlwdG9yfHVuZGVmaW5lZD4sIHR5cGU6IFR5cGU8YW55PikgPT4ge1xuICAgICAgICAgIGlmIChVU0VfUlVOVElNRV9ERVBTX1RSQUNLRVJfRk9SX0pJVCkge1xuICAgICAgICAgICAgZGVwc1RyYWNrZXIuY2xlYXJTY29wZUNhY2hlRm9yKHR5cGUpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBkZWZzLmZvckVhY2goKGRlc2NyaXB0b3IsIHByb3ApID0+IHtcbiAgICAgICAgICAgIGlmICghZGVzY3JpcHRvcikge1xuICAgICAgICAgICAgICAvLyBEZWxldGUgb3BlcmF0aW9ucyBhcmUgZ2VuZXJhbGx5IHVuZGVzaXJhYmxlIHNpbmNlIHRoZXkgaGF2ZSBwZXJmb3JtYW5jZVxuICAgICAgICAgICAgICAvLyBpbXBsaWNhdGlvbnMgb24gb2JqZWN0cyB0aGV5IHdlcmUgYXBwbGllZCB0by4gSW4gdGhpcyBwYXJ0aWN1bGFyIGNhc2UsIHNpdHVhdGlvbnNcbiAgICAgICAgICAgICAgLy8gd2hlcmUgdGhpcyBjb2RlIGlzIGludm9rZWQgc2hvdWxkIGJlIHF1aXRlIHJhcmUgdG8gY2F1c2UgYW55IG5vdGljZWFibGUgaW1wYWN0LFxuICAgICAgICAgICAgICAvLyBzaW5jZSBpdCdzIGFwcGxpZWQgb25seSB0byBzb21lIHRlc3QgY2FzZXMgKGZvciBleGFtcGxlIHdoZW4gY2xhc3Mgd2l0aCBub1xuICAgICAgICAgICAgICAvLyBhbm5vdGF0aW9ucyBleHRlbmRzIHNvbWUgQENvbXBvbmVudCkgd2hlbiB3ZSBuZWVkIHRvIGNsZWFyICfJtWNtcCcgZmllbGQgb24gYSBnaXZlblxuICAgICAgICAgICAgICAvLyBjbGFzcyB0byByZXN0b3JlIGl0cyBvcmlnaW5hbCBzdGF0ZSAoYmVmb3JlIGFwcGx5aW5nIG92ZXJyaWRlcyBhbmQgcnVubmluZyB0ZXN0cykuXG4gICAgICAgICAgICAgIGRlbGV0ZSAodHlwZSBhcyBhbnkpW3Byb3BdO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHR5cGUsIHByb3AsIGRlc2NyaXB0b3IpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB0aGlzLmluaXRpYWxOZ0RlZnMuY2xlYXIoKTtcbiAgICB0aGlzLnNjb3Blc1dpdGhPdmVycmlkZGVuUHJvdmlkZXJzLmNsZWFyKCk7XG4gICAgdGhpcy5yZXN0b3JlQ29tcG9uZW50UmVzb2x1dGlvblF1ZXVlKCk7XG4gICAgLy8gUmVzdG9yZSB0aGUgbG9jYWxlIElEIHRvIHRoZSBkZWZhdWx0IHZhbHVlLCB0aGlzIHNob3VsZG4ndCBiZSBuZWNlc3NhcnkgYnV0IHdlIG5ldmVyIGtub3dcbiAgICBzZXRMb2NhbGVJZChERUZBVUxUX0xPQ0FMRV9JRCk7XG4gIH1cblxuICBwcml2YXRlIGNvbXBpbGVUZXN0TW9kdWxlKCk6IHZvaWQge1xuICAgIGNsYXNzIFJvb3RTY29wZU1vZHVsZSB7fVxuICAgIGNvbXBpbGVOZ01vZHVsZURlZnMoUm9vdFNjb3BlTW9kdWxlIGFzIE5nTW9kdWxlVHlwZTxhbnk+LCB7XG4gICAgICBwcm92aWRlcnM6IFsuLi50aGlzLnJvb3RQcm92aWRlck92ZXJyaWRlc10sXG4gICAgfSk7XG5cbiAgICBjb25zdCBwcm92aWRlcnMgPSBbXG4gICAgICBwcm92aWRlWm9uZUNoYW5nZURldGVjdGlvbigpLFxuICAgICAge3Byb3ZpZGU6IENvbXBpbGVyLCB1c2VGYWN0b3J5OiAoKSA9PiBuZXcgUjNUZXN0Q29tcGlsZXIodGhpcyl9LFxuICAgICAge3Byb3ZpZGU6IERFRkVSX0JMT0NLX0NPTkZJRywgdXNlVmFsdWU6IHtiZWhhdmlvcjogdGhpcy5kZWZlckJsb2NrQmVoYXZpb3J9fSxcbiAgICAgIC4uLnRoaXMucHJvdmlkZXJzLFxuICAgICAgLi4udGhpcy5wcm92aWRlck92ZXJyaWRlcyxcbiAgICBdO1xuICAgIGNvbnN0IGltcG9ydHMgPSBbUm9vdFNjb3BlTW9kdWxlLCB0aGlzLmFkZGl0aW9uYWxNb2R1bGVUeXBlcywgdGhpcy5pbXBvcnRzIHx8IFtdXTtcblxuICAgIC8vIGNsYW5nLWZvcm1hdCBvZmZcbiAgICBjb21waWxlTmdNb2R1bGVEZWZzKHRoaXMudGVzdE1vZHVsZVR5cGUsIHtcbiAgICAgIGRlY2xhcmF0aW9uczogdGhpcy5kZWNsYXJhdGlvbnMsXG4gICAgICBpbXBvcnRzLFxuICAgICAgc2NoZW1hczogdGhpcy5zY2hlbWFzLFxuICAgICAgcHJvdmlkZXJzLFxuICAgIH0sIC8qIGFsbG93RHVwbGljYXRlRGVjbGFyYXRpb25zSW5Sb290ICovIHRydWUpO1xuICAgIC8vIGNsYW5nLWZvcm1hdCBvblxuXG4gICAgdGhpcy5hcHBseVByb3ZpZGVyT3ZlcnJpZGVzSW5TY29wZSh0aGlzLnRlc3RNb2R1bGVUeXBlKTtcbiAgfVxuXG4gIGdldCBpbmplY3RvcigpOiBJbmplY3RvciB7XG4gICAgaWYgKHRoaXMuX2luamVjdG9yICE9PSBudWxsKSB7XG4gICAgICByZXR1cm4gdGhpcy5faW5qZWN0b3I7XG4gICAgfVxuXG4gICAgY29uc3QgcHJvdmlkZXJzOiBTdGF0aWNQcm92aWRlcltdID0gW107XG4gICAgY29uc3QgY29tcGlsZXJPcHRpb25zID0gdGhpcy5wbGF0Zm9ybS5pbmplY3Rvci5nZXQoQ09NUElMRVJfT1BUSU9OUyk7XG4gICAgY29tcGlsZXJPcHRpb25zLmZvckVhY2gob3B0cyA9PiB7XG4gICAgICBpZiAob3B0cy5wcm92aWRlcnMpIHtcbiAgICAgICAgcHJvdmlkZXJzLnB1c2gob3B0cy5wcm92aWRlcnMpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIGlmICh0aGlzLmNvbXBpbGVyUHJvdmlkZXJzICE9PSBudWxsKSB7XG4gICAgICBwcm92aWRlcnMucHVzaCguLi50aGlzLmNvbXBpbGVyUHJvdmlkZXJzIGFzIFN0YXRpY1Byb3ZpZGVyW10pO1xuICAgIH1cblxuICAgIHRoaXMuX2luamVjdG9yID0gSW5qZWN0b3IuY3JlYXRlKHtwcm92aWRlcnMsIHBhcmVudDogdGhpcy5wbGF0Zm9ybS5pbmplY3Rvcn0pO1xuICAgIHJldHVybiB0aGlzLl9pbmplY3RvcjtcbiAgfVxuXG4gIC8vIGdldCBvdmVycmlkZXMgZm9yIGEgc3BlY2lmaWMgcHJvdmlkZXIgKGlmIGFueSlcbiAgcHJpdmF0ZSBnZXRTaW5nbGVQcm92aWRlck92ZXJyaWRlcyhwcm92aWRlcjogUHJvdmlkZXIpOiBQcm92aWRlcnxudWxsIHtcbiAgICBjb25zdCB0b2tlbiA9IGdldFByb3ZpZGVyVG9rZW4ocHJvdmlkZXIpO1xuICAgIHJldHVybiB0aGlzLnByb3ZpZGVyT3ZlcnJpZGVzQnlUb2tlbi5nZXQodG9rZW4pIHx8IG51bGw7XG4gIH1cblxuICBwcml2YXRlIGdldFByb3ZpZGVyT3ZlcnJpZGVzKHByb3ZpZGVycz86IEFycmF5PFByb3ZpZGVyfEludGVybmFsRW52aXJvbm1lbnRQcm92aWRlcnM+KTpcbiAgICAgIFByb3ZpZGVyW10ge1xuICAgIGlmICghcHJvdmlkZXJzIHx8ICFwcm92aWRlcnMubGVuZ3RoIHx8IHRoaXMucHJvdmlkZXJPdmVycmlkZXNCeVRva2VuLnNpemUgPT09IDApIHJldHVybiBbXTtcbiAgICAvLyBUaGVyZSBhcmUgdHdvIGZsYXR0ZW5pbmcgb3BlcmF0aW9ucyBoZXJlLiBUaGUgaW5uZXIgZmxhdHRlblByb3ZpZGVycygpIG9wZXJhdGVzIG9uIHRoZVxuICAgIC8vIG1ldGFkYXRhJ3MgcHJvdmlkZXJzIGFuZCBhcHBsaWVzIGEgbWFwcGluZyBmdW5jdGlvbiB3aGljaCByZXRyaWV2ZXMgb3ZlcnJpZGVzIGZvciBlYWNoXG4gICAgLy8gaW5jb21pbmcgcHJvdmlkZXIuIFRoZSBvdXRlciBmbGF0dGVuKCkgdGhlbiBmbGF0dGVucyB0aGUgcHJvZHVjZWQgb3ZlcnJpZGVzIGFycmF5LiBJZiB0aGlzIGlzXG4gICAgLy8gbm90IGRvbmUsIHRoZSBhcnJheSBjYW4gY29udGFpbiBvdGhlciBlbXB0eSBhcnJheXMgKGUuZy4gYFtbXSwgW11dYCkgd2hpY2ggbGVhayBpbnRvIHRoZVxuICAgIC8vIHByb3ZpZGVycyBhcnJheSBhbmQgY29udGFtaW5hdGUgYW55IGVycm9yIG1lc3NhZ2VzIHRoYXQgbWlnaHQgYmUgZ2VuZXJhdGVkLlxuICAgIHJldHVybiBmbGF0dGVuKGZsYXR0ZW5Qcm92aWRlcnMoXG4gICAgICAgIHByb3ZpZGVycywgKHByb3ZpZGVyOiBQcm92aWRlcikgPT4gdGhpcy5nZXRTaW5nbGVQcm92aWRlck92ZXJyaWRlcyhwcm92aWRlcikgfHwgW10pKTtcbiAgfVxuXG4gIHByaXZhdGUgZ2V0T3ZlcnJpZGRlblByb3ZpZGVycyhwcm92aWRlcnM/OiBBcnJheTxQcm92aWRlcnxJbnRlcm5hbEVudmlyb25tZW50UHJvdmlkZXJzPik6XG4gICAgICBQcm92aWRlcltdIHtcbiAgICBpZiAoIXByb3ZpZGVycyB8fCAhcHJvdmlkZXJzLmxlbmd0aCB8fCB0aGlzLnByb3ZpZGVyT3ZlcnJpZGVzQnlUb2tlbi5zaXplID09PSAwKSByZXR1cm4gW107XG5cbiAgICBjb25zdCBmbGF0dGVuZWRQcm92aWRlcnMgPSBmbGF0dGVuUHJvdmlkZXJzKHByb3ZpZGVycyk7XG4gICAgY29uc3Qgb3ZlcnJpZGVzID0gdGhpcy5nZXRQcm92aWRlck92ZXJyaWRlcyhmbGF0dGVuZWRQcm92aWRlcnMpO1xuICAgIGNvbnN0IG92ZXJyaWRkZW5Qcm92aWRlcnMgPSBbLi4uZmxhdHRlbmVkUHJvdmlkZXJzLCAuLi5vdmVycmlkZXNdO1xuICAgIGNvbnN0IGZpbmFsOiBQcm92aWRlcltdID0gW107XG4gICAgY29uc3Qgc2Vlbk92ZXJyaWRkZW5Qcm92aWRlcnMgPSBuZXcgU2V0PFByb3ZpZGVyPigpO1xuXG4gICAgLy8gV2UgaXRlcmF0ZSB0aHJvdWdoIHRoZSBsaXN0IG9mIHByb3ZpZGVycyBpbiByZXZlcnNlIG9yZGVyIHRvIG1ha2Ugc3VyZSBwcm92aWRlciBvdmVycmlkZXNcbiAgICAvLyB0YWtlIHByZWNlZGVuY2Ugb3ZlciB0aGUgdmFsdWVzIGRlZmluZWQgaW4gcHJvdmlkZXIgbGlzdC4gV2UgYWxzbyBmaWx0ZXIgb3V0IGFsbCBwcm92aWRlcnNcbiAgICAvLyB0aGF0IGhhdmUgb3ZlcnJpZGVzLCBrZWVwaW5nIG92ZXJyaWRkZW4gdmFsdWVzIG9ubHkuIFRoaXMgaXMgbmVlZGVkLCBzaW5jZSBwcmVzZW5jZSBvZiBhXG4gICAgLy8gcHJvdmlkZXIgd2l0aCBgbmdPbkRlc3Ryb3lgIGhvb2sgd2lsbCBjYXVzZSB0aGlzIGhvb2sgdG8gYmUgcmVnaXN0ZXJlZCBhbmQgaW52b2tlZCBsYXRlci5cbiAgICBmb3JFYWNoUmlnaHQob3ZlcnJpZGRlblByb3ZpZGVycywgKHByb3ZpZGVyOiBhbnkpID0+IHtcbiAgICAgIGNvbnN0IHRva2VuOiBhbnkgPSBnZXRQcm92aWRlclRva2VuKHByb3ZpZGVyKTtcbiAgICAgIGlmICh0aGlzLnByb3ZpZGVyT3ZlcnJpZGVzQnlUb2tlbi5oYXModG9rZW4pKSB7XG4gICAgICAgIGlmICghc2Vlbk92ZXJyaWRkZW5Qcm92aWRlcnMuaGFzKHRva2VuKSkge1xuICAgICAgICAgIHNlZW5PdmVycmlkZGVuUHJvdmlkZXJzLmFkZCh0b2tlbik7XG4gICAgICAgICAgLy8gVHJlYXQgYWxsIG92ZXJyaWRkZW4gcHJvdmlkZXJzIGFzIGB7bXVsdGk6IGZhbHNlfWAgKGV2ZW4gaWYgaXQncyBhIG11bHRpLXByb3ZpZGVyKSB0b1xuICAgICAgICAgIC8vIG1ha2Ugc3VyZSB0aGF0IHByb3ZpZGVkIG92ZXJyaWRlIHRha2VzIGhpZ2hlc3QgcHJlY2VkZW5jZSBhbmQgaXMgbm90IGNvbWJpbmVkIHdpdGhcbiAgICAgICAgICAvLyBvdGhlciBpbnN0YW5jZXMgb2YgdGhlIHNhbWUgbXVsdGkgcHJvdmlkZXIuXG4gICAgICAgICAgZmluYWwudW5zaGlmdCh7Li4ucHJvdmlkZXIsIG11bHRpOiBmYWxzZX0pO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBmaW5hbC51bnNoaWZ0KHByb3ZpZGVyKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gZmluYWw7XG4gIH1cblxuICBwcml2YXRlIGhhc1Byb3ZpZGVyT3ZlcnJpZGVzKHByb3ZpZGVycz86IEFycmF5PFByb3ZpZGVyfEludGVybmFsRW52aXJvbm1lbnRQcm92aWRlcnM+KTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0UHJvdmlkZXJPdmVycmlkZXMocHJvdmlkZXJzKS5sZW5ndGggPiAwO1xuICB9XG5cbiAgcHJpdmF0ZSBwYXRjaERlZldpdGhQcm92aWRlck92ZXJyaWRlcyhkZWNsYXJhdGlvbjogVHlwZTxhbnk+LCBmaWVsZDogc3RyaW5nKTogdm9pZCB7XG4gICAgY29uc3QgZGVmID0gKGRlY2xhcmF0aW9uIGFzIGFueSlbZmllbGRdO1xuICAgIGlmIChkZWYgJiYgZGVmLnByb3ZpZGVyc1Jlc29sdmVyKSB7XG4gICAgICB0aGlzLm1heWJlU3RvcmVOZ0RlZihmaWVsZCwgZGVjbGFyYXRpb24pO1xuXG4gICAgICBjb25zdCByZXNvbHZlciA9IGRlZi5wcm92aWRlcnNSZXNvbHZlcjtcbiAgICAgIGNvbnN0IHByb2Nlc3NQcm92aWRlcnNGbiA9IChwcm92aWRlcnM6IFByb3ZpZGVyW10pID0+IHRoaXMuZ2V0T3ZlcnJpZGRlblByb3ZpZGVycyhwcm92aWRlcnMpO1xuICAgICAgdGhpcy5zdG9yZUZpZWxkT2ZEZWZPblR5cGUoZGVjbGFyYXRpb24sIGZpZWxkLCAncHJvdmlkZXJzUmVzb2x2ZXInKTtcbiAgICAgIGRlZi5wcm92aWRlcnNSZXNvbHZlciA9IChuZ0RlZjogRGlyZWN0aXZlRGVmPGFueT4pID0+IHJlc29sdmVyKG5nRGVmLCBwcm9jZXNzUHJvdmlkZXJzRm4pO1xuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBpbml0UmVzb2x2ZXJzKCk6IFJlc29sdmVycyB7XG4gIHJldHVybiB7XG4gICAgbW9kdWxlOiBuZXcgTmdNb2R1bGVSZXNvbHZlcigpLFxuICAgIGNvbXBvbmVudDogbmV3IENvbXBvbmVudFJlc29sdmVyKCksXG4gICAgZGlyZWN0aXZlOiBuZXcgRGlyZWN0aXZlUmVzb2x2ZXIoKSxcbiAgICBwaXBlOiBuZXcgUGlwZVJlc29sdmVyKClcbiAgfTtcbn1cblxuZnVuY3Rpb24gaXNTdGFuZGFsb25lQ29tcG9uZW50PFQ+KHZhbHVlOiBUeXBlPFQ+KTogdmFsdWUgaXMgQ29tcG9uZW50VHlwZTxUPiB7XG4gIGNvbnN0IGRlZiA9IGdldENvbXBvbmVudERlZih2YWx1ZSk7XG4gIHJldHVybiAhIWRlZj8uc3RhbmRhbG9uZTtcbn1cblxuZnVuY3Rpb24gZ2V0Q29tcG9uZW50RGVmKHZhbHVlOiBDb21wb25lbnRUeXBlPHVua25vd24+KTogQ29tcG9uZW50RGVmPHVua25vd24+O1xuZnVuY3Rpb24gZ2V0Q29tcG9uZW50RGVmKHZhbHVlOiBUeXBlPHVua25vd24+KTogQ29tcG9uZW50RGVmPHVua25vd24+fG51bGw7XG5mdW5jdGlvbiBnZXRDb21wb25lbnREZWYodmFsdWU6IFR5cGU8dW5rbm93bj4pOiBDb21wb25lbnREZWY8dW5rbm93bj58bnVsbCB7XG4gIHJldHVybiAodmFsdWUgYXMgYW55KS7JtWNtcCA/PyBudWxsO1xufVxuXG5mdW5jdGlvbiBoYXNOZ01vZHVsZURlZjxUPih2YWx1ZTogVHlwZTxUPik6IHZhbHVlIGlzIE5nTW9kdWxlVHlwZTxUPiB7XG4gIHJldHVybiB2YWx1ZS5oYXNPd25Qcm9wZXJ0eSgnybVtb2QnKTtcbn1cblxuZnVuY3Rpb24gaXNOZ01vZHVsZTxUPih2YWx1ZTogVHlwZTxUPik6IGJvb2xlYW4ge1xuICByZXR1cm4gaGFzTmdNb2R1bGVEZWYodmFsdWUpO1xufVxuXG5mdW5jdGlvbiBtYXliZVVud3JhcEZuPFQ+KG1heWJlRm46ICgoKSA9PiBUKXxUKTogVCB7XG4gIHJldHVybiBtYXliZUZuIGluc3RhbmNlb2YgRnVuY3Rpb24gPyBtYXliZUZuKCkgOiBtYXliZUZuO1xufVxuXG5mdW5jdGlvbiBmbGF0dGVuPFQ+KHZhbHVlczogYW55W10pOiBUW10ge1xuICBjb25zdCBvdXQ6IFRbXSA9IFtdO1xuICB2YWx1ZXMuZm9yRWFjaCh2YWx1ZSA9PiB7XG4gICAgaWYgKEFycmF5LmlzQXJyYXkodmFsdWUpKSB7XG4gICAgICBvdXQucHVzaCguLi5mbGF0dGVuPFQ+KHZhbHVlKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG91dC5wdXNoKHZhbHVlKTtcbiAgICB9XG4gIH0pO1xuICByZXR1cm4gb3V0O1xufVxuXG5mdW5jdGlvbiBpZGVudGl0eUZuPFQ+KHZhbHVlOiBUKTogVCB7XG4gIHJldHVybiB2YWx1ZTtcbn1cblxuZnVuY3Rpb24gZmxhdHRlblByb3ZpZGVyczxUPihcbiAgICBwcm92aWRlcnM6IEFycmF5PFByb3ZpZGVyfEludGVybmFsRW52aXJvbm1lbnRQcm92aWRlcnM+LCBtYXBGbjogKHByb3ZpZGVyOiBQcm92aWRlcikgPT4gVCk6IFRbXTtcbmZ1bmN0aW9uIGZsYXR0ZW5Qcm92aWRlcnMocHJvdmlkZXJzOiBBcnJheTxQcm92aWRlcnxJbnRlcm5hbEVudmlyb25tZW50UHJvdmlkZXJzPik6IFByb3ZpZGVyW107XG5mdW5jdGlvbiBmbGF0dGVuUHJvdmlkZXJzKFxuICAgIHByb3ZpZGVyczogQXJyYXk8UHJvdmlkZXJ8SW50ZXJuYWxFbnZpcm9ubWVudFByb3ZpZGVycz4sXG4gICAgbWFwRm46IChwcm92aWRlcjogUHJvdmlkZXIpID0+IGFueSA9IGlkZW50aXR5Rm4pOiBhbnlbXSB7XG4gIGNvbnN0IG91dDogYW55W10gPSBbXTtcbiAgZm9yIChsZXQgcHJvdmlkZXIgb2YgcHJvdmlkZXJzKSB7XG4gICAgaWYgKGlzRW52aXJvbm1lbnRQcm92aWRlcnMocHJvdmlkZXIpKSB7XG4gICAgICBwcm92aWRlciA9IHByb3ZpZGVyLsm1cHJvdmlkZXJzO1xuICAgIH1cbiAgICBpZiAoQXJyYXkuaXNBcnJheShwcm92aWRlcikpIHtcbiAgICAgIG91dC5wdXNoKC4uLmZsYXR0ZW5Qcm92aWRlcnMocHJvdmlkZXIsIG1hcEZuKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG91dC5wdXNoKG1hcEZuKHByb3ZpZGVyKSk7XG4gICAgfVxuICB9XG4gIHJldHVybiBvdXQ7XG59XG5cbmZ1bmN0aW9uIGdldFByb3ZpZGVyRmllbGQocHJvdmlkZXI6IFByb3ZpZGVyLCBmaWVsZDogc3RyaW5nKSB7XG4gIHJldHVybiBwcm92aWRlciAmJiB0eXBlb2YgcHJvdmlkZXIgPT09ICdvYmplY3QnICYmIChwcm92aWRlciBhcyBhbnkpW2ZpZWxkXTtcbn1cblxuZnVuY3Rpb24gZ2V0UHJvdmlkZXJUb2tlbihwcm92aWRlcjogUHJvdmlkZXIpIHtcbiAgcmV0dXJuIGdldFByb3ZpZGVyRmllbGQocHJvdmlkZXIsICdwcm92aWRlJykgfHwgcHJvdmlkZXI7XG59XG5cbmZ1bmN0aW9uIGlzTW9kdWxlV2l0aFByb3ZpZGVycyh2YWx1ZTogYW55KTogdmFsdWUgaXMgTW9kdWxlV2l0aFByb3ZpZGVyczxhbnk+IHtcbiAgcmV0dXJuIHZhbHVlLmhhc093blByb3BlcnR5KCduZ01vZHVsZScpO1xufVxuXG5mdW5jdGlvbiBmb3JFYWNoUmlnaHQ8VD4odmFsdWVzOiBUW10sIGZuOiAodmFsdWU6IFQsIGlkeDogbnVtYmVyKSA9PiB2b2lkKTogdm9pZCB7XG4gIGZvciAobGV0IGlkeCA9IHZhbHVlcy5sZW5ndGggLSAxOyBpZHggPj0gMDsgaWR4LS0pIHtcbiAgICBmbih2YWx1ZXNbaWR4XSwgaWR4KTtcbiAgfVxufVxuXG5mdW5jdGlvbiBpbnZhbGlkVHlwZUVycm9yKG5hbWU6IHN0cmluZywgZXhwZWN0ZWRUeXBlOiBzdHJpbmcpOiBFcnJvciB7XG4gIHJldHVybiBuZXcgRXJyb3IoYCR7bmFtZX0gY2xhc3MgZG9lc24ndCBoYXZlIEAke2V4cGVjdGVkVHlwZX0gZGVjb3JhdG9yIG9yIGlzIG1pc3NpbmcgbWV0YWRhdGEuYCk7XG59XG5cbmNsYXNzIFIzVGVzdENvbXBpbGVyIGltcGxlbWVudHMgQ29tcGlsZXIge1xuICBjb25zdHJ1Y3Rvcihwcml2YXRlIHRlc3RCZWQ6IFRlc3RCZWRDb21waWxlcikge31cblxuICBjb21waWxlTW9kdWxlU3luYzxUPihtb2R1bGVUeXBlOiBUeXBlPFQ+KTogTmdNb2R1bGVGYWN0b3J5PFQ+IHtcbiAgICB0aGlzLnRlc3RCZWQuX2NvbXBpbGVOZ01vZHVsZVN5bmMobW9kdWxlVHlwZSk7XG4gICAgcmV0dXJuIG5ldyBSM05nTW9kdWxlRmFjdG9yeShtb2R1bGVUeXBlKTtcbiAgfVxuXG4gIGFzeW5jIGNvbXBpbGVNb2R1bGVBc3luYzxUPihtb2R1bGVUeXBlOiBUeXBlPFQ+KTogUHJvbWlzZTxOZ01vZHVsZUZhY3Rvcnk8VD4+IHtcbiAgICBhd2FpdCB0aGlzLnRlc3RCZWQuX2NvbXBpbGVOZ01vZHVsZUFzeW5jKG1vZHVsZVR5cGUpO1xuICAgIHJldHVybiBuZXcgUjNOZ01vZHVsZUZhY3RvcnkobW9kdWxlVHlwZSk7XG4gIH1cblxuICBjb21waWxlTW9kdWxlQW5kQWxsQ29tcG9uZW50c1N5bmM8VD4obW9kdWxlVHlwZTogVHlwZTxUPik6IE1vZHVsZVdpdGhDb21wb25lbnRGYWN0b3JpZXM8VD4ge1xuICAgIGNvbnN0IG5nTW9kdWxlRmFjdG9yeSA9IHRoaXMuY29tcGlsZU1vZHVsZVN5bmMobW9kdWxlVHlwZSk7XG4gICAgY29uc3QgY29tcG9uZW50RmFjdG9yaWVzID0gdGhpcy50ZXN0QmVkLl9nZXRDb21wb25lbnRGYWN0b3JpZXMobW9kdWxlVHlwZSBhcyBOZ01vZHVsZVR5cGU8VD4pO1xuICAgIHJldHVybiBuZXcgTW9kdWxlV2l0aENvbXBvbmVudEZhY3RvcmllcyhuZ01vZHVsZUZhY3RvcnksIGNvbXBvbmVudEZhY3Rvcmllcyk7XG4gIH1cblxuICBhc3luYyBjb21waWxlTW9kdWxlQW5kQWxsQ29tcG9uZW50c0FzeW5jPFQ+KG1vZHVsZVR5cGU6IFR5cGU8VD4pOlxuICAgICAgUHJvbWlzZTxNb2R1bGVXaXRoQ29tcG9uZW50RmFjdG9yaWVzPFQ+PiB7XG4gICAgY29uc3QgbmdNb2R1bGVGYWN0b3J5ID0gYXdhaXQgdGhpcy5jb21waWxlTW9kdWxlQXN5bmMobW9kdWxlVHlwZSk7XG4gICAgY29uc3QgY29tcG9uZW50RmFjdG9yaWVzID0gdGhpcy50ZXN0QmVkLl9nZXRDb21wb25lbnRGYWN0b3JpZXMobW9kdWxlVHlwZSBhcyBOZ01vZHVsZVR5cGU8VD4pO1xuICAgIHJldHVybiBuZXcgTW9kdWxlV2l0aENvbXBvbmVudEZhY3RvcmllcyhuZ01vZHVsZUZhY3RvcnksIGNvbXBvbmVudEZhY3Rvcmllcyk7XG4gIH1cblxuICBjbGVhckNhY2hlKCk6IHZvaWQge31cblxuICBjbGVhckNhY2hlRm9yKHR5cGU6IFR5cGU8YW55Pik6IHZvaWQge31cblxuICBnZXRNb2R1bGVJZChtb2R1bGVUeXBlOiBUeXBlPGFueT4pOiBzdHJpbmd8dW5kZWZpbmVkIHtcbiAgICBjb25zdCBtZXRhID0gdGhpcy50ZXN0QmVkLl9nZXRNb2R1bGVSZXNvbHZlcigpLnJlc29sdmUobW9kdWxlVHlwZSk7XG4gICAgcmV0dXJuIG1ldGEgJiYgbWV0YS5pZCB8fCB1bmRlZmluZWQ7XG4gIH1cbn1cbiJdfQ==