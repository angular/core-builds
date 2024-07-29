/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ResourceLoader } from '@angular/compiler';
import { ApplicationInitStatus, ɵINTERNAL_APPLICATION_ERROR_HANDLER as INTERNAL_APPLICATION_ERROR_HANDLER, ɵChangeDetectionScheduler as ChangeDetectionScheduler, ɵChangeDetectionSchedulerImpl as ChangeDetectionSchedulerImpl, Compiler, COMPILER_OPTIONS, Injector, inject, LOCALE_ID, ModuleWithComponentFactories, resolveForwardRef, ɵclearResolutionOfComponentResourcesQueue, ɵcompileComponent as compileComponent, ɵcompileDirective as compileDirective, ɵcompileNgModuleDefs as compileNgModuleDefs, ɵcompilePipe as compilePipe, ɵDEFAULT_LOCALE_ID as DEFAULT_LOCALE_ID, ɵDEFER_BLOCK_CONFIG as DEFER_BLOCK_CONFIG, ɵdepsTracker as depsTracker, ɵgenerateStandaloneInDeclarationsError, ɵgetAsyncClassMetadataFn as getAsyncClassMetadataFn, ɵgetInjectableDef as getInjectableDef, ɵinternalProvideZoneChangeDetection as internalProvideZoneChangeDetection, ɵisComponentDefPendingResolution, ɵisEnvironmentProviders as isEnvironmentProviders, ɵNG_COMP_DEF as NG_COMP_DEF, ɵNG_DIR_DEF as NG_DIR_DEF, ɵNG_INJ_DEF as NG_INJ_DEF, ɵNG_MOD_DEF as NG_MOD_DEF, ɵNG_PIPE_DEF as NG_PIPE_DEF, ɵNgModuleFactory as R3NgModuleFactory, ɵpatchComponentDefWithScope as patchComponentDefWithScope, ɵRender3ComponentFactory as ComponentFactory, ɵRender3NgModuleRef as NgModuleRef, ɵresolveComponentResources, ɵrestoreComponentResolutionQueue, ɵsetLocaleId as setLocaleId, ɵtransitiveScopesFor as transitiveScopesFor, ɵUSE_RUNTIME_DEPS_TRACKER_FOR_JIT as USE_RUNTIME_DEPS_TRACKER_FOR_JIT, } from '@angular/core';
import { ComponentResolver, DirectiveResolver, NgModuleResolver, PipeResolver, } from './resolvers';
import { DEFER_BLOCK_DEFAULT_BEHAVIOR } from './test_bed_common';
import { TestBedApplicationErrorHandler } from './application_error_handler';
var TestingModuleOverride;
(function (TestingModuleOverride) {
    TestingModuleOverride[TestingModuleOverride["DECLARATION"] = 0] = "DECLARATION";
    TestingModuleOverride[TestingModuleOverride["OVERRIDE_TEMPLATE"] = 1] = "OVERRIDE_TEMPLATE";
})(TestingModuleOverride || (TestingModuleOverride = {}));
function isTestingModuleOverride(value) {
    return (value === TestingModuleOverride.DECLARATION || value === TestingModuleOverride.OVERRIDE_TEMPLATE);
}
function assertNoStandaloneComponents(types, resolver, location) {
    types.forEach((type) => {
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
        // Set of components with async metadata, i.e. components with `@defer` blocks
        // in their templates.
        this.componentsWithAsyncMetadata = new Set();
        // Keep track of all components and directives, so we can patch Providers onto defs later.
        this.seenComponents = new Set();
        this.seenDirectives = new Set();
        // Keep track of overridden modules, so that we can collect all affected ones in the module tree.
        this.overriddenModules = new Set();
        // Store resolved styles for Components that have template overrides present and `styleUrls`
        // defined at the same time.
        this.existingComponentStyles = new Map();
        this.resolvers = initResolvers();
        // Map of component type to an NgModule that declares it.
        //
        // There are a couple special cases:
        // - for standalone components, the module scope value is `null`
        // - when a component is declared in `TestBed.configureTestingModule()` call or
        //   a component's template is overridden via `TestBed.overrideTemplateUsingTestingModule()`.
        //   we use a special value from the `TestingModuleOverride` enum.
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
        this.deferBlockBehavior = DEFER_BLOCK_DEFAULT_BEHAVIOR;
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
        this.deferBlockBehavior = moduleDef.deferBlockBehavior ?? DEFER_BLOCK_DEFAULT_BEHAVIOR;
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
        // If this is a component with async metadata (i.e. a component with a `@defer` block
        // in a template) - store it for future processing.
        this.maybeRegisterComponentWithAsyncMetadata(component);
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
        if (override.add?.hasOwnProperty('standalone') ||
            override.set?.hasOwnProperty('standalone') ||
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
                multi: provider.multi,
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
        const override = overrideStyleUrls
            ? { template, styles: [], styleUrls: [], styleUrl: undefined }
            : { template };
        this.overrideComponent(type, { set: override });
        if (overrideStyleUrls && def.styles && def.styles.length > 0) {
            this.existingComponentStyles.set(type, def.styles);
        }
        // Set the component's scope to be the testing module.
        this.componentToModuleScope.set(type, TestingModuleOverride.OVERRIDE_TEMPLATE);
    }
    async resolvePendingComponentsWithAsyncMetadata() {
        if (this.componentsWithAsyncMetadata.size === 0)
            return;
        const promises = [];
        for (const component of this.componentsWithAsyncMetadata) {
            const asyncMetadataFn = getAsyncClassMetadataFn(component);
            if (asyncMetadataFn) {
                promises.push(asyncMetadataFn());
            }
        }
        this.componentsWithAsyncMetadata.clear();
        const resolvedDeps = await Promise.all(promises);
        const flatResolvedDeps = resolvedDeps.flat(2);
        this.queueTypesFromModulesArray(flatResolvedDeps);
        // Loaded standalone components might contain imports of NgModules
        // with providers, make sure we override providers there too.
        for (const component of flatResolvedDeps) {
            this.applyProviderOverridesInScope(component);
        }
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
        this.pendingComponents.forEach((declaration) => {
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
        this.pendingDirectives.forEach((declaration) => {
            const metadata = this.resolvers.directive.resolve(declaration);
            if (metadata === null) {
                throw invalidTypeError(declaration.name, 'Directive');
            }
            this.maybeStoreNgDef(NG_DIR_DEF, declaration);
            compileDirective(declaration, metadata);
        });
        this.pendingDirectives.clear();
        this.pendingPipes.forEach((declaration) => {
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
                affectedModules.forEach((moduleType) => {
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
            if (moduleType !== null) {
                const moduleScope = getScopeOfModule(moduleType);
                this.storeFieldOfDefOnType(componentType, NG_COMP_DEF, 'directiveDefs');
                this.storeFieldOfDefOnType(componentType, NG_COMP_DEF, 'pipeDefs');
                patchComponentDefWithScope(getComponentDef(componentType), moduleScope);
            }
            // `tView` that is stored on component def contains information about directives and pipes
            // that are in the scope of this component. Patching component scope will cause `tView` to be
            // changed. Store original `tView` before patching scope, so the `tView` (including scope
            // information) is restored back to its previous/original state before running next test.
            // Resetting `tView` is also needed for cases when we apply provider overrides and those
            // providers are defined on component's level, in which case they may end up included into
            // `tView.blueprint`.
            this.storeFieldOfDefOnType(componentType, NG_COMP_DEF, 'tView');
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
                ...(this.providerOverridesByModule.get(type) || []),
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
                        originalValue: importedModule.providers,
                    });
                    importedModule.providers = this.getOverriddenProviders(importedModule.providers);
                }
            }
        }
    }
    patchComponentsWithExistingStyles() {
        this.existingComponentStyles.forEach((styles, type) => (type[NG_COMP_DEF].styles = styles));
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
    maybeRegisterComponentWithAsyncMetadata(type) {
        const asyncMetadataFn = getAsyncClassMetadataFn(type);
        if (asyncMetadataFn) {
            this.componentsWithAsyncMetadata.add(type);
        }
    }
    queueType(type, moduleType) {
        // If this is a component with async metadata (i.e. a component with a `@defer` block
        // in a template) - store it for future processing.
        this.maybeRegisterComponentWithAsyncMetadata(type);
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
                            path.forEach((item) => affectedModules.add(item));
                        }
                        continue;
                    }
                    seenModules.add(value);
                    if (this.overriddenModules.has(value)) {
                        path.forEach((item) => affectedModules.add(item));
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
            providers: [
                ...this.rootProviderOverrides,
                internalProvideZoneChangeDetection({}),
                TestBedApplicationErrorHandler,
                {
                    provide: INTERNAL_APPLICATION_ERROR_HANDLER,
                    useFactory: () => {
                        const handler = inject(TestBedApplicationErrorHandler);
                        return (e) => {
                            handler.handleError(e);
                        };
                    },
                },
                { provide: ChangeDetectionScheduler, useExisting: ChangeDetectionSchedulerImpl },
            ],
        });
        const providers = [
            { provide: Compiler, useFactory: () => new R3TestCompiler(this) },
            { provide: DEFER_BLOCK_CONFIG, useValue: { behavior: this.deferBlockBehavior } },
            ...this.providers,
            ...this.providerOverrides,
        ];
        const imports = [RootScopeModule, this.additionalModuleTypes, this.imports || []];
        compileNgModuleDefs(this.testModuleType, {
            declarations: this.declarations,
            imports,
            schemas: this.schemas,
            providers,
        }, 
        /* allowDuplicateDeclarationsInRoot */ true);
        this.applyProviderOverridesInScope(this.testModuleType);
    }
    get injector() {
        if (this._injector !== null) {
            return this._injector;
        }
        const providers = [];
        const compilerOptions = this.platform.injector.get(COMPILER_OPTIONS);
        compilerOptions.forEach((opts) => {
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
        pipe: new PipeResolver(),
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
    values.forEach((value) => {
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
        return (meta && meta.id) || undefined;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdF9iZWRfY29tcGlsZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3Rlc3Rpbmcvc3JjL3Rlc3RfYmVkX2NvbXBpbGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUNqRCxPQUFPLEVBQ0wscUJBQXFCLEVBQ3JCLG1DQUFtQyxJQUFJLGtDQUFrQyxFQUN6RSx5QkFBeUIsSUFBSSx3QkFBd0IsRUFDckQsNkJBQTZCLElBQUksNEJBQTRCLEVBQzdELFFBQVEsRUFDUixnQkFBZ0IsRUFJaEIsUUFBUSxFQUNSLE1BQU0sRUFFTixTQUFTLEVBQ1QsNEJBQTRCLEVBUTVCLGlCQUFpQixFQUdqQix5Q0FBeUMsRUFDekMsaUJBQWlCLElBQUksZ0JBQWdCLEVBQ3JDLGlCQUFpQixJQUFJLGdCQUFnQixFQUNyQyxvQkFBb0IsSUFBSSxtQkFBbUIsRUFDM0MsWUFBWSxJQUFJLFdBQVcsRUFDM0Isa0JBQWtCLElBQUksaUJBQWlCLEVBQ3ZDLG1CQUFtQixJQUFJLGtCQUFrQixFQUV6QyxZQUFZLElBQUksV0FBVyxFQUUzQixzQ0FBc0MsRUFDdEMsd0JBQXdCLElBQUksdUJBQXVCLEVBQ25ELGlCQUFpQixJQUFJLGdCQUFnQixFQUVyQyxtQ0FBbUMsSUFBSSxrQ0FBa0MsRUFDekUsZ0NBQWdDLEVBQ2hDLHVCQUF1QixJQUFJLHNCQUFzQixFQUNqRCxZQUFZLElBQUksV0FBVyxFQUMzQixXQUFXLElBQUksVUFBVSxFQUN6QixXQUFXLElBQUksVUFBVSxFQUN6QixXQUFXLElBQUksVUFBVSxFQUN6QixZQUFZLElBQUksV0FBVyxFQUMzQixnQkFBZ0IsSUFBSSxpQkFBaUIsRUFHckMsMkJBQTJCLElBQUksMEJBQTBCLEVBQ3pELHdCQUF3QixJQUFJLGdCQUFnQixFQUM1QyxtQkFBbUIsSUFB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RCxNQUFNLGtCQUFrQixHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsc0JBQXNCLENBQUMsVUFBNkIsQ0FBQyxDQUFDO1FBQzlGLE9BQU8sSUFBSSw0QkFBNEIsQ0FBQyxlQUFlLEVBQUUsa0JBQWtCLENBQUMsQ0FBQztJQUMvRSxDQUFDO0lBRUQsS0FBSyxDQUFDLGtDQUFrQyxDQUN0QyxVQUFtQjtRQUVuQixNQUFNLGVBQWUsR0FBRyxNQUFNLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUNsRSxNQUFNLGtCQUFrQixHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsc0JBQXNCLENBQUMsVUFBNkIsQ0FBQyxDQUFDO1FBQzlGLE9BQU8sSUFBSSw0QkFBNEIsQ0FBQyxlQUFlLEVBQUUsa0JBQWtCLENBQUMsQ0FBQztJQUMvRSxDQUFDO0lBRUQsVUFBVSxLQUFVLENBQUM7SUFFckIsYUFBYSxDQUFDLElBQWUsSUFBUyxDQUFDO0lBRXZDLFdBQVcsQ0FBQyxVQUFxQjtRQUMvQixNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLGtCQUFrQixFQUFFLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQ25FLE9BQU8sQ0FBQyxJQUFJLElBQUksSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLFNBQVMsQ0FBQztJQUN4QyxDQUFDO0NBQ0YiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtSZXNvdXJjZUxvYWRlcn0gZnJvbSAnQGFuZ3VsYXIvY29tcGlsZXInO1xuaW1wb3J0IHtcbiAgQXBwbGljYXRpb25Jbml0U3RhdHVzLFxuICDJtUlOVEVSTkFMX0FQUExJQ0FUSU9OX0VSUk9SX0hBTkRMRVIgYXMgSU5URVJOQUxfQVBQTElDQVRJT05fRVJST1JfSEFORExFUixcbiAgybVDaGFuZ2VEZXRlY3Rpb25TY2hlZHVsZXIgYXMgQ2hhbmdlRGV0ZWN0aW9uU2NoZWR1bGVyLFxuICDJtUNoYW5nZURldGVjdGlvblNjaGVkdWxlckltcGwgYXMgQ2hhbmdlRGV0ZWN0aW9uU2NoZWR1bGVySW1wbCxcbiAgQ29tcGlsZXIsXG4gIENPTVBJTEVSX09QVElPTlMsXG4gIENvbXBvbmVudCxcbiAgRXJyb3JIYW5kbGVyLFxuICBEaXJlY3RpdmUsXG4gIEluamVjdG9yLFxuICBpbmplY3QsXG4gIEluamVjdG9yVHlwZSxcbiAgTE9DQUxFX0lELFxuICBNb2R1bGVXaXRoQ29tcG9uZW50RmFjdG9yaWVzLFxuICBNb2R1bGVXaXRoUHJvdmlkZXJzLFxuICDJtVpPTkVMRVNTX0VOQUJMRUQgYXMgWk9ORUxFU1NfRU5BQkxFRCxcbiAgTmdNb2R1bGUsXG4gIE5nTW9kdWxlRmFjdG9yeSxcbiAgUGlwZSxcbiAgUGxhdGZvcm1SZWYsXG4gIFByb3ZpZGVyLFxuICByZXNvbHZlRm9yd2FyZFJlZixcbiAgU3RhdGljUHJvdmlkZXIsXG4gIFR5cGUsXG4gIMm1Y2xlYXJSZXNvbHV0aW9uT2ZDb21wb25lbnRSZXNvdXJjZXNRdWV1ZSxcbiAgybVjb21waWxlQ29tcG9uZW50IGFzIGNvbXBpbGVDb21wb25lbnQsXG4gIMm1Y29tcGlsZURpcmVjdGl2ZSBhcyBjb21waWxlRGlyZWN0aXZlLFxuICDJtWNvbXBpbGVOZ01vZHVsZURlZnMgYXMgY29tcGlsZU5nTW9kdWxlRGVmcyxcbiAgybVjb21waWxlUGlwZSBhcyBjb21waWxlUGlwZSxcbiAgybVERUZBVUxUX0xPQ0FMRV9JRCBhcyBERUZBVUxUX0xPQ0FMRV9JRCxcbiAgybVERUZFUl9CTE9DS19DT05GSUcgYXMgREVGRVJfQkxPQ0tfQ09ORklHLFxuICDJtURlZmVyQmxvY2tCZWhhdmlvciBhcyBEZWZlckJsb2NrQmVoYXZpb3IsXG4gIMm1ZGVwc1RyYWNrZXIgYXMgZGVwc1RyYWNrZXIsXG4gIMm1RGlyZWN0aXZlRGVmIGFzIERpcmVjdGl2ZURlZixcbiAgybVnZW5lcmF0ZVN0YW5kYWxvbmVJbkRlY2xhcmF0aW9uc0Vycm9yLFxuICDJtWdldEFzeW5jQ2xhc3NNZXRhZGF0YUZuIGFzIGdldEFzeW5jQ2xhc3NNZXRhZGF0YUZuLFxuICDJtWdldEluamVjdGFibGVEZWYgYXMgZ2V0SW5qZWN0YWJsZURlZixcbiAgybVJbnRlcm5hbEVudmlyb25tZW50UHJvdmlkZXJzIGFzIEludGVybmFsRW52aXJvbm1lbnRQcm92aWRlcnMsXG4gIMm1aW50ZXJuYWxQcm92aWRlWm9uZUNoYW5nZURldGVjdGlvbiBhcyBpbnRlcm5hbFByb3ZpZGVab25lQ2hhbmdlRGV0ZWN0aW9uLFxuICDJtWlzQ29tcG9uZW50RGVmUGVuZGluZ1Jlc29sdXRpb24sXG4gIMm1aXNFbnZpcm9ubWVudFByb3ZpZGVycyBhcyBpc0Vudmlyb25tZW50UHJvdmlkZXJzLFxuICDJtU5HX0NPTVBfREVGIGFzIE5HX0NPTVBfREVGLFxuICDJtU5HX0RJUl9ERUYgYXMgTkdfRElSX0RFRixcbiAgybVOR19JTkpfREVGIGFzIE5HX0lOSl9ERUYsXG4gIMm1TkdfTU9EX0RFRiBhcyBOR19NT0RfREVGLFxuICDJtU5HX1BJUEVfREVGIGFzIE5HX1BJUEVfREVGLFxuICDJtU5nTW9kdWxlRmFjdG9yeSBhcyBSM05nTW9kdWxlRmFjdG9yeSxcbiAgybVOZ01vZHVsZVRyYW5zaXRpdmVTY29wZXMgYXMgTmdNb2R1bGVUcmFuc2l0aXZlU2NvcGVzLFxuICDJtU5nTW9kdWxlVHlwZSBhcyBOZ01vZHVsZVR5cGUsXG4gIMm1cGF0Y2hDb21wb25lbnREZWZXaXRoU2NvcGUgYXMgcGF0Y2hDb21wb25lbnREZWZXaXRoU2NvcGUsXG4gIMm1UmVuZGVyM0NvbXBvbmVudEZhY3RvcnkgYXMgQ29tcG9uZW50RmFjdG9yeSxcbiAgybVSZW5kZXIzTmdNb2R1bGVSZWYgYXMgTmdNb2R1bGVSZWYsXG4gIMm1cmVzb2x2ZUNvbXBvbmVudFJlc291cmNlcyxcbiAgybVyZXN0b3JlQ29tcG9uZW50UmVzb2x1dGlvblF1ZXVlLFxuICDJtXNldExvY2FsZUlkIGFzIHNldExvY2FsZUlkLFxuICDJtXRyYW5zaXRpdmVTY29wZXNGb3IgYXMgdHJhbnNpdGl2ZVNjb3Blc0ZvcixcbiAgybVVU0VfUlVOVElNRV9ERVBTX1RSQUNLRVJfRk9SX0pJVCBhcyBVU0VfUlVOVElNRV9ERVBTX1RSQUNLRVJfRk9SX0pJVCxcbiAgybXJtUluamVjdGFibGVEZWNsYXJhdGlvbiBhcyBJbmplY3RhYmxlRGVjbGFyYXRpb24sXG4gIE5nWm9uZSxcbn0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5cbmltcG9ydCB7Q29tcG9uZW50RGVmLCBDb21wb25lbnRUeXBlfSBmcm9tICcuLi8uLi9zcmMvcmVuZGVyMyc7XG5cbmltcG9ydCB7TWV0YWRhdGFPdmVycmlkZX0gZnJvbSAnLi9tZXRhZGF0YV9vdmVycmlkZSc7XG5pbXBvcnQge1xuICBDb21wb25lbnRSZXNvbHZlcixcbiAgRGlyZWN0aXZlUmVzb2x2ZXIsXG4gIE5nTW9kdWxlUmVzb2x2ZXIsXG4gIFBpcGVSZXNvbHZlcixcbiAgUmVzb2x2ZXIsXG59IGZyb20gJy4vcmVzb2x2ZXJzJztcbmltcG9ydCB7REVGRVJfQkxPQ0tfREVGQVVMVF9CRUhBVklPUiwgVGVzdE1vZHVsZU1ldGFkYXRhfSBmcm9tICcuL3Rlc3RfYmVkX2NvbW1vbic7XG5pbXBvcnQge1Rlc3RCZWRBcHBsaWNhdGlvbkVycm9ySGFuZGxlcn0gZnJvbSAnLi9hcHBsaWNhdGlvbl9lcnJvcl9oYW5kbGVyJztcblxuZW51bSBUZXN0aW5nTW9kdWxlT3ZlcnJpZGUge1xuICBERUNMQVJBVElPTixcbiAgT1ZFUlJJREVfVEVNUExBVEUsXG59XG5cbmZ1bmN0aW9uIGlzVGVzdGluZ01vZHVsZU92ZXJyaWRlKHZhbHVlOiB1bmtub3duKTogdmFsdWUgaXMgVGVzdGluZ01vZHVsZU92ZXJyaWRlIHtcbiAgcmV0dXJuIChcbiAgICB2YWx1ZSA9PT0gVGVzdGluZ01vZHVsZU92ZXJyaWRlLkRFQ0xBUkFUSU9OIHx8IHZhbHVlID09PSBUZXN0aW5nTW9kdWxlT3ZlcnJpZGUuT1ZFUlJJREVfVEVNUExBVEVcbiAgKTtcbn1cblxuZnVuY3Rpb24gYXNzZXJ0Tm9TdGFuZGFsb25lQ29tcG9uZW50cyhcbiAgdHlwZXM6IFR5cGU8YW55PltdLFxuICByZXNvbHZlcjogUmVzb2x2ZXI8YW55PixcbiAgbG9jYXRpb246IHN0cmluZyxcbikge1xuICB0eXBlcy5mb3JFYWNoKCh0eXBlKSA9PiB7XG4gICAgaWYgKCFnZXRBc3luY0NsYXNzTWV0YWRhdGFGbih0eXBlKSkge1xuICAgICAgY29uc3QgY29tcG9uZW50ID0gcmVzb2x2ZXIucmVzb2x2ZSh0eXBlKTtcbiAgICAgIGlmIChjb21wb25lbnQgJiYgY29tcG9uZW50LnN0YW5kYWxvbmUpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKMm1Z2VuZXJhdGVTdGFuZGFsb25lSW5EZWNsYXJhdGlvbnNFcnJvcih0eXBlLCBsb2NhdGlvbikpO1xuICAgICAgfVxuICAgIH1cbiAgfSk7XG59XG5cbi8vIFJlc29sdmVycyBmb3IgQW5ndWxhciBkZWNvcmF0b3JzXG50eXBlIFJlc29sdmVycyA9IHtcbiAgbW9kdWxlOiBSZXNvbHZlcjxOZ01vZHVsZT47XG4gIGNvbXBvbmVudDogUmVzb2x2ZXI8RGlyZWN0aXZlPjtcbiAgZGlyZWN0aXZlOiBSZXNvbHZlcjxDb21wb25lbnQ+O1xuICBwaXBlOiBSZXNvbHZlcjxQaXBlPjtcbn07XG5cbmludGVyZmFjZSBDbGVhbnVwT3BlcmF0aW9uIHtcbiAgZmllbGROYW1lOiBzdHJpbmc7XG4gIG9iamVjdDogYW55O1xuICBvcmlnaW5hbFZhbHVlOiB1bmtub3duO1xufVxuXG5leHBvcnQgY2xhc3MgVGVzdEJlZENvbXBpbGVyIHtcbiAgcHJpdmF0ZSBvcmlnaW5hbENvbXBvbmVudFJlc29sdXRpb25RdWV1ZTogTWFwPFR5cGU8YW55PiwgQ29tcG9uZW50PiB8IG51bGwgPSBudWxsO1xuXG4gIC8vIFRlc3RpbmcgbW9kdWxlIGNvbmZpZ3VyYXRpb25cbiAgcHJpdmF0ZSBkZWNsYXJhdGlvbnM6IFR5cGU8YW55PltdID0gW107XG4gIHByaXZhdGUgaW1wb3J0czogVHlwZTxhbnk+W10gPSBbXTtcbiAgcHJpdmF0ZSBwcm92aWRlcnM6IFByb3ZpZGVyW10gPSBbXTtcbiAgcHJpdmF0ZSBzY2hlbWFzOiBhbnlbXSA9IFtdO1xuXG4gIC8vIFF1ZXVlcyBvZiBjb21wb25lbnRzL2RpcmVjdGl2ZXMvcGlwZXMgdGhhdCBzaG91bGQgYmUgcmVjb21waWxlZC5cbiAgcHJpdmF0ZSBwZW5kaW5nQ29tcG9uZW50cyA9IG5ldyBTZXQ8VHlwZTxhbnk+PigpO1xuICBwcml2YXRlIHBlbmRpbmdEaXJlY3RpdmVzID0gbmV3IFNldDxUeXBlPGFueT4+KCk7XG4gIHByaXZhdGUgcGVuZGluZ1BpcGVzID0gbmV3IFNldDxUeXBlPGFueT4+KCk7XG5cbiAgLy8gU2V0IG9mIGNvbXBvbmVudHMgd2l0aCBhc3luYyBtZXRhZGF0YSwgaS5lLiBjb21wb25lbnRzIHdpdGggYEBkZWZlcmAgYmxvY2tzXG4gIC8vIGluIHRoZWlyIHRlbXBsYXRlcy5cbiAgcHJpdmF0ZSBjb21wb25lbnRzV2l0aEFzeW5jTWV0YWRhdGEgPSBuZXcgU2V0PFR5cGU8dW5rbm93bj4+KCk7XG5cbiAgLy8gS2VlcCB0cmFjayBvZiBhbGwgY29tcG9uZW50cyBhbmQgZGlyZWN0aXZlcywgc28gd2UgY2FuIHBhdGNoIFByb3ZpZGVycyBvbnRvIGRlZnMgbGF0ZXIuXG4gIHByaXZhdGUgc2VlbkNvbXBvbmVudHMgPSBuZXcgU2V0PFR5cGU8YW55Pj4oKTtcbiAgcHJpdmF0ZSBzZWVuRGlyZWN0aXZlcyA9IG5ldyBTZXQ8VHlwZTxhbnk+PigpO1xuXG4gIC8vIEtlZXAgdHJhY2sgb2Ygb3ZlcnJpZGRlbiBtb2R1bGVzLCBzbyB0aGF0IHdlIGNhbiBjb2xsZWN0IGFsbCBhZmZlY3RlZCBvbmVzIGluIHRoZSBtb2R1bGUgdHJlZS5cbiAgcHJpdmF0ZSBvdmVycmlkZGVuTW9kdWxlcyA9IG5ldyBTZXQ8TmdNb2R1bGVUeXBlPGFueT4+KCk7XG5cbiAgLy8gU3RvcmUgcmVzb2x2ZWQgc3R5bGVzIGZvciBDb21wb25lbnRzIHRoYXQgaGF2ZSB0ZW1wbGF0ZSBvdmVycmlkZXMgcHJlc2VudCBhbmQgYHN0eWxlVXJsc2BcbiAgLy8gZGVmaW5lZCBhdCB0aGUgc2FtZSB0aW1lLlxuICBwcml2YXRlIGV4aXN0aW5nQ29tcG9uZW50U3R5bGVzID0gbmV3IE1hcDxUeXBlPGFueT4sIHN0cmluZ1tdPigpO1xuXG4gIHByaXZhdGUgcmVzb2x2ZXJzOiBSZXNvbHZlcnMgPSBpbml0UmVzb2x2ZXJzKCk7XG5cbiAgLy8gTWFwIG9mIGNvbXBvbmVudCB0eXBlIHRvIGFuIE5nTW9kdWxlIHRoYXQgZGVjbGFyZXMgaXQuXG4gIC8vXG4gIC8vIFRoZXJlIGFyZSBhIGNvdXBsZSBzcGVjaWFsIGNhc2VzOlxuICAvLyAtIGZvciBzdGFuZGFsb25lIGNvbXBvbmVudHMsIHRoZSBtb2R1bGUgc2NvcGUgdmFsdWUgaXMgYG51bGxgXG4gIC8vIC0gd2hlbiBhIGNvbXBvbmVudCBpcyBkZWNsYXJlZCBpbiBgVGVzdEJlZC5jb25maWd1cmVUZXN0aW5nTW9kdWxlKClgIGNhbGwgb3JcbiAgLy8gICBhIGNvbXBvbmVudCdzIHRlbXBsYXRlIGlzIG92ZXJyaWRkZW4gdmlhIGBUZXN0QmVkLm92ZXJyaWRlVGVtcGxhdGVVc2luZ1Rlc3RpbmdNb2R1bGUoKWAuXG4gIC8vICAgd2UgdXNlIGEgc3BlY2lhbCB2YWx1ZSBmcm9tIHRoZSBgVGVzdGluZ01vZHVsZU92ZXJyaWRlYCBlbnVtLlxuICBwcml2YXRlIGNvbXBvbmVudFRvTW9kdWxlU2NvcGUgPSBuZXcgTWFwPFR5cGU8YW55PiwgVHlwZTxhbnk+IHwgVGVzdGluZ01vZHVsZU92ZXJyaWRlIHwgbnVsbD4oKTtcblxuICAvLyBNYXAgdGhhdCBrZWVwcyBpbml0aWFsIHZlcnNpb24gb2YgY29tcG9uZW50L2RpcmVjdGl2ZS9waXBlIGRlZnMgaW4gY2FzZVxuICAvLyB3ZSBjb21waWxlIGEgVHlwZSBhZ2FpbiwgdGh1cyBvdmVycmlkaW5nIHJlc3BlY3RpdmUgc3RhdGljIGZpZWxkcy4gVGhpcyBpc1xuICAvLyByZXF1aXJlZCB0byBtYWtlIHN1cmUgd2UgcmVzdG9yZSBkZWZzIHRvIHRoZWlyIGluaXRpYWwgc3RhdGVzIGJldHdlZW4gdGVzdCBydW5zLlxuICAvLyBOb3RlOiBvbmUgY2xhc3MgbWF5IGhhdmUgbXVsdGlwbGUgZGVmcyAoZm9yIGV4YW1wbGU6IMm1bW9kIGFuZCDJtWluaiBpbiBjYXNlIG9mIGFuXG4gIC8vIE5nTW9kdWxlKSwgc3RvcmUgYWxsIG9mIHRoZW0gaW4gYSBtYXAuXG4gIHByaXZhdGUgaW5pdGlhbE5nRGVmcyA9IG5ldyBNYXA8VHlwZTxhbnk+LCBNYXA8c3RyaW5nLCBQcm9wZXJ0eURlc2NyaXB0b3IgfCB1bmRlZmluZWQ+PigpO1xuXG4gIC8vIEFycmF5IHRoYXQga2VlcHMgY2xlYW51cCBvcGVyYXRpb25zIGZvciBpbml0aWFsIHZlcnNpb25zIG9mIGNvbXBvbmVudC9kaXJlY3RpdmUvcGlwZS9tb2R1bGVcbiAgLy8gZGVmcyBpbiBjYXNlIFRlc3RCZWQgbWFrZXMgY2hhbmdlcyB0byB0aGUgb3JpZ2luYWxzLlxuICBwcml2YXRlIGRlZkNsZWFudXBPcHM6IENsZWFudXBPcGVyYXRpb25bXSA9IFtdO1xuXG4gIHByaXZhdGUgX2luamVjdG9yOiBJbmplY3RvciB8IG51bGwgPSBudWxsO1xuICBwcml2YXRlIGNvbXBpbGVyUHJvdmlkZXJzOiBQcm92aWRlcltdIHwgbnVsbCA9IG51bGw7XG5cbiAgcHJpdmF0ZSBwcm92aWRlck92ZXJyaWRlczogUHJvdmlkZXJbXSA9IFtdO1xuICBwcml2YXRlIHJvb3RQcm92aWRlck92ZXJyaWRlczogUHJvdmlkZXJbXSA9IFtdO1xuICAvLyBPdmVycmlkZXMgZm9yIGluamVjdGFibGVzIHdpdGggYHtwcm92aWRlZEluOiBTb21lTW9kdWxlfWAgbmVlZCB0byBiZSB0cmFja2VkIGFuZCBhZGRlZCB0byB0aGF0XG4gIC8vIG1vZHVsZSdzIHByb3ZpZGVyIGxpc3QuXG4gIHByaXZhdGUgcHJvdmlkZXJPdmVycmlkZXNCeU1vZHVsZSA9IG5ldyBNYXA8SW5qZWN0b3JUeXBlPGFueT4sIFByb3ZpZGVyW10+KCk7XG4gIHByaXZhdGUgcHJvdmlkZXJPdmVycmlkZXNCeVRva2VuID0gbmV3IE1hcDxhbnksIFByb3ZpZGVyPigpO1xuICBwcml2YXRlIHNjb3Blc1dpdGhPdmVycmlkZGVuUHJvdmlkZXJzID0gbmV3IFNldDxUeXBlPGFueT4+KCk7XG5cbiAgcHJpdmF0ZSB0ZXN0TW9kdWxlVHlwZTogTmdNb2R1bGVUeXBlPGFueT47XG4gIHByaXZhdGUgdGVzdE1vZHVsZVJlZjogTmdNb2R1bGVSZWY8YW55PiB8IG51bGwgPSBudWxsO1xuXG4gIHByaXZhdGUgZGVmZXJCbG9ja0JlaGF2aW9yID0gREVGRVJfQkxPQ0tfREVGQVVMVF9CRUhBVklPUjtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBwcml2YXRlIHBsYXRmb3JtOiBQbGF0Zm9ybVJlZixcbiAgICBwcml2YXRlIGFkZGl0aW9uYWxNb2R1bGVUeXBlczogVHlwZTxhbnk+IHwgVHlwZTxhbnk+W10sXG4gICkge1xuICAgIGNsYXNzIER5bmFtaWNUZXN0TW9kdWxlIHt9XG4gICAgdGhpcy50ZXN0TW9kdWxlVHlwZSA9IER5bmFtaWNUZXN0TW9kdWxlIGFzIGFueTtcbiAgfVxuXG4gIHNldENvbXBpbGVyUHJvdmlkZXJzKHByb3ZpZGVyczogUHJvdmlkZXJbXSB8IG51bGwpOiB2b2lkIHtcbiAgICB0aGlzLmNvbXBpbGVyUHJvdmlkZXJzID0gcHJvdmlkZXJzO1xuICAgIHRoaXMuX2luamVjdG9yID0gbnVsbDtcbiAgfVxuXG4gIGNvbmZpZ3VyZVRlc3RpbmdNb2R1bGUobW9kdWxlRGVmOiBUZXN0TW9kdWxlTWV0YWRhdGEpOiB2b2lkIHtcbiAgICAvLyBFbnF1ZXVlIGFueSBjb21waWxhdGlvbiB0YXNrcyBmb3IgdGhlIGRpcmVjdGx5IGRlY2xhcmVkIGNvbXBvbmVudC5cbiAgICBpZiAobW9kdWxlRGVmLmRlY2xhcmF0aW9ucyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAvLyBWZXJpZnkgdGhhdCB0aGVyZSBhcmUgbm8gc3RhbmRhbG9uZSBjb21wb25lbnRzXG4gICAgICBhc3NlcnROb1N0YW5kYWxvbmVDb21wb25lbnRzKFxuICAgICAgICBtb2R1bGVEZWYuZGVjbGFyYXRpb25zLFxuICAgICAgICB0aGlzLnJlc29sdmVycy5jb21wb25lbnQsXG4gICAgICAgICdcIlRlc3RCZWQuY29uZmlndXJlVGVzdGluZ01vZHVsZVwiIGNhbGwnLFxuICAgICAgKTtcbiAgICAgIHRoaXMucXVldWVUeXBlQXJyYXkobW9kdWxlRGVmLmRlY2xhcmF0aW9ucywgVGVzdGluZ01vZHVsZU92ZXJyaWRlLkRFQ0xBUkFUSU9OKTtcbiAgICAgIHRoaXMuZGVjbGFyYXRpb25zLnB1c2goLi4ubW9kdWxlRGVmLmRlY2xhcmF0aW9ucyk7XG4gICAgfVxuXG4gICAgLy8gRW5xdWV1ZSBhbnkgY29tcGlsYXRpb24gdGFza3MgZm9yIGltcG9ydGVkIG1vZHVsZXMuXG4gICAgaWYgKG1vZHVsZURlZi5pbXBvcnRzICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHRoaXMucXVldWVUeXBlc0Zyb21Nb2R1bGVzQXJyYXkobW9kdWxlRGVmLmltcG9ydHMpO1xuICAgICAgdGhpcy5pbXBvcnRzLnB1c2goLi4ubW9kdWxlRGVmLmltcG9ydHMpO1xuICAgIH1cblxuICAgIGlmIChtb2R1bGVEZWYucHJvdmlkZXJzICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHRoaXMucHJvdmlkZXJzLnB1c2goLi4ubW9kdWxlRGVmLnByb3ZpZGVycyk7XG4gICAgfVxuXG4gICAgaWYgKG1vZHVsZURlZi5zY2hlbWFzICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHRoaXMuc2NoZW1hcy5wdXNoKC4uLm1vZHVsZURlZi5zY2hlbWFzKTtcbiAgICB9XG5cbiAgICB0aGlzLmRlZmVyQmxvY2tCZWhhdmlvciA9IG1vZHVsZURlZi5kZWZlckJsb2NrQmVoYXZpb3IgPz8gREVGRVJfQkxPQ0tfREVGQVVMVF9CRUhBVklPUjtcbiAgfVxuXG4gIG92ZXJyaWRlTW9kdWxlKG5nTW9kdWxlOiBUeXBlPGFueT4sIG92ZXJyaWRlOiBNZXRhZGF0YU92ZXJyaWRlPE5nTW9kdWxlPik6IHZvaWQge1xuICAgIGlmIChVU0VfUlVOVElNRV9ERVBTX1RSQUNLRVJfRk9SX0pJVCkge1xuICAgICAgZGVwc1RyYWNrZXIuY2xlYXJTY29wZUNhY2hlRm9yKG5nTW9kdWxlKTtcbiAgICB9XG4gICAgdGhpcy5vdmVycmlkZGVuTW9kdWxlcy5hZGQobmdNb2R1bGUgYXMgTmdNb2R1bGVUeXBlPGFueT4pO1xuXG4gICAgLy8gQ29tcGlsZSB0aGUgbW9kdWxlIHJpZ2h0IGF3YXkuXG4gICAgdGhpcy5yZXNvbHZlcnMubW9kdWxlLmFkZE92ZXJyaWRlKG5nTW9kdWxlLCBvdmVycmlkZSk7XG4gICAgY29uc3QgbWV0YWRhdGEgPSB0aGlzLnJlc29sdmVycy5tb2R1bGUucmVzb2x2ZShuZ01vZHVsZSk7XG4gICAgaWYgKG1ldGFkYXRhID09PSBudWxsKSB7XG4gICAgICB0aHJvdyBpbnZhbGlkVHlwZUVycm9yKG5nTW9kdWxlLm5hbWUsICdOZ01vZHVsZScpO1xuICAgIH1cblxuICAgIHRoaXMucmVjb21waWxlTmdNb2R1bGUobmdNb2R1bGUsIG1ldGFkYXRhKTtcblxuICAgIC8vIEF0IHRoaXMgcG9pbnQsIHRoZSBtb2R1bGUgaGFzIGEgdmFsaWQgbW9kdWxlIGRlZiAoybVtb2QpLCBidXQgdGhlIG92ZXJyaWRlIG1heSBoYXZlIGludHJvZHVjZWRcbiAgICAvLyBuZXcgZGVjbGFyYXRpb25zIG9yIGltcG9ydGVkIG1vZHVsZXMuIEluZ2VzdCBhbnkgcG9zc2libGUgbmV3IHR5cGVzIGFuZCBhZGQgdGhlbSB0byB0aGVcbiAgICAvLyBjdXJyZW50IHF1ZXVlLlxuICAgIHRoaXMucXVldWVUeXBlc0Zyb21Nb2R1bGVzQXJyYXkoW25nTW9kdWxlXSk7XG4gIH1cblxuICBvdmVycmlkZUNvbXBvbmVudChjb21wb25lbnQ6IFR5cGU8YW55Piwgb3ZlcnJpZGU6IE1ldGFkYXRhT3ZlcnJpZGU8Q29tcG9uZW50Pik6IHZvaWQge1xuICAgIHRoaXMudmVyaWZ5Tm9TdGFuZGFsb25lRmxhZ092ZXJyaWRlcyhjb21wb25lbnQsIG92ZXJyaWRlKTtcbiAgICB0aGlzLnJlc29sdmVycy5jb21wb25lbnQuYWRkT3ZlcnJpZGUoY29tcG9uZW50LCBvdmVycmlkZSk7XG4gICAgdGhpcy5wZW5kaW5nQ29tcG9uZW50cy5hZGQoY29tcG9uZW50KTtcblxuICAgIC8vIElmIHRoaXMgaXMgYSBjb21wb25lbnQgd2l0aCBhc3luYyBtZXRhZGF0YSAoaS5lLiBhIGNvbXBvbmVudCB3aXRoIGEgYEBkZWZlcmAgYmxvY2tcbiAgICAvLyBpbiBhIHRlbXBsYXRlKSAtIHN0b3JlIGl0IGZvciBmdXR1cmUgcHJvY2Vzc2luZy5cbiAgICB0aGlzLm1heWJlUmVnaXN0ZXJDb21wb25lbnRXaXRoQXN5bmNNZXRhZGF0YShjb21wb25lbnQpO1xuICB9XG5cbiAgb3ZlcnJpZGVEaXJlY3RpdmUoZGlyZWN0aXZlOiBUeXBlPGFueT4sIG92ZXJyaWRlOiBNZXRhZGF0YU92ZXJyaWRlPERpcmVjdGl2ZT4pOiB2b2lkIHtcbiAgICB0aGlzLnZlcmlmeU5vU3RhbmRhbG9uZUZsYWdPdmVycmlkZXMoZGlyZWN0aXZlLCBvdmVycmlkZSk7XG4gICAgdGhpcy5yZXNvbHZlcnMuZGlyZWN0aXZlLmFkZE92ZXJyaWRlKGRpcmVjdGl2ZSwgb3ZlcnJpZGUpO1xuICAgIHRoaXMucGVuZGluZ0RpcmVjdGl2ZXMuYWRkKGRpcmVjdGl2ZSk7XG4gIH1cblxuICBvdmVycmlkZVBpcGUocGlwZTogVHlwZTxhbnk+LCBvdmVycmlkZTogTWV0YWRhdGFPdmVycmlkZTxQaXBlPik6IHZvaWQge1xuICAgIHRoaXMudmVyaWZ5Tm9TdGFuZGFsb25lRmxhZ092ZXJyaWRlcyhwaXBlLCBvdmVycmlkZSk7XG4gICAgdGhpcy5yZXNvbHZlcnMucGlwZS5hZGRPdmVycmlkZShwaXBlLCBvdmVycmlkZSk7XG4gICAgdGhpcy5wZW5kaW5nUGlwZXMuYWRkKHBpcGUpO1xuICB9XG5cbiAgcHJpdmF0ZSB2ZXJpZnlOb1N0YW5kYWxvbmVGbGFnT3ZlcnJpZGVzKFxuICAgIHR5cGU6IFR5cGU8YW55PixcbiAgICBvdmVycmlkZTogTWV0YWRhdGFPdmVycmlkZTxDb21wb25lbnQgfCBEaXJlY3RpdmUgfCBQaXBlPixcbiAgKSB7XG4gICAgaWYgKFxuICAgICAgb3ZlcnJpZGUuYWRkPy5oYXNPd25Qcm9wZXJ0eSgnc3RhbmRhbG9uZScpIHx8XG4gICAgICBvdmVycmlkZS5zZXQ/Lmhhc093blByb3BlcnR5KCdzdGFuZGFsb25lJykgfHxcbiAgICAgIG92ZXJyaWRlLnJlbW92ZT8uaGFzT3duUHJvcGVydHkoJ3N0YW5kYWxvbmUnKVxuICAgICkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICBgQW4gb3ZlcnJpZGUgZm9yIHRoZSAke3R5cGUubmFtZX0gY2xhc3MgaGFzIHRoZSBcXGBzdGFuZGFsb25lXFxgIGZsYWcuIGAgK1xuICAgICAgICAgIGBDaGFuZ2luZyB0aGUgXFxgc3RhbmRhbG9uZVxcYCBmbGFnIHZpYSBUZXN0QmVkIG92ZXJyaWRlcyBpcyBub3Qgc3VwcG9ydGVkLmAsXG4gICAgICApO1xuICAgIH1cbiAgfVxuXG4gIG92ZXJyaWRlUHJvdmlkZXIoXG4gICAgdG9rZW46IGFueSxcbiAgICBwcm92aWRlcjoge3VzZUZhY3Rvcnk/OiBGdW5jdGlvbjsgdXNlVmFsdWU/OiBhbnk7IGRlcHM/OiBhbnlbXTsgbXVsdGk/OiBib29sZWFufSxcbiAgKTogdm9pZCB7XG4gICAgbGV0IHByb3ZpZGVyRGVmOiBQcm92aWRlcjtcbiAgICBpZiAocHJvdmlkZXIudXNlRmFjdG9yeSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBwcm92aWRlckRlZiA9IHtcbiAgICAgICAgcHJvdmlkZTogdG9rZW4sXG4gICAgICAgIHVzZUZhY3Rvcnk6IHByb3ZpZGVyLnVzZUZhY3RvcnksXG4gICAgICAgIGRlcHM6IHByb3ZpZGVyLmRlcHMgfHwgW10sXG4gICAgICAgIG11bHRpOiBwcm92aWRlci5tdWx0aSxcbiAgICAgIH07XG4gICAgfSBlbHNlIGlmIChwcm92aWRlci51c2VWYWx1ZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBwcm92aWRlckRlZiA9IHtwcm92aWRlOiB0b2tlbiwgdXNlVmFsdWU6IHByb3ZpZGVyLnVzZVZhbHVlLCBtdWx0aTogcHJvdmlkZXIubXVsdGl9O1xuICAgIH0gZWxzZSB7XG4gICAgICBwcm92aWRlckRlZiA9IHtwcm92aWRlOiB0b2tlbn07XG4gICAgfVxuXG4gICAgY29uc3QgaW5qZWN0YWJsZURlZjogSW5qZWN0YWJsZURlY2xhcmF0aW9uPGFueT4gfCBudWxsID1cbiAgICAgIHR5cGVvZiB0b2tlbiAhPT0gJ3N0cmluZycgPyBnZXRJbmplY3RhYmxlRGVmKHRva2VuKSA6IG51bGw7XG4gICAgY29uc3QgcHJvdmlkZWRJbiA9IGluamVjdGFibGVEZWYgPT09IG51bGwgPyBudWxsIDogcmVzb2x2ZUZvcndhcmRSZWYoaW5qZWN0YWJsZURlZi5wcm92aWRlZEluKTtcbiAgICBjb25zdCBvdmVycmlkZXNCdWNrZXQgPVxuICAgICAgcHJvdmlkZWRJbiA9PT0gJ3Jvb3QnID8gdGhpcy5yb290UHJvdmlkZXJPdmVycmlkZXMgOiB0aGlzLnByb3ZpZGVyT3ZlcnJpZGVzO1xuICAgIG92ZXJyaWRlc0J1Y2tldC5wdXNoKHByb3ZpZGVyRGVmKTtcblxuICAgIC8vIEtlZXAgb3ZlcnJpZGVzIGdyb3VwZWQgYnkgdG9rZW4gYXMgd2VsbCBmb3IgZmFzdCBsb29rdXBzIHVzaW5nIHRva2VuXG4gICAgdGhpcy5wcm92aWRlck92ZXJyaWRlc0J5VG9rZW4uc2V0KHRva2VuLCBwcm92aWRlckRlZik7XG4gICAgaWYgKGluamVjdGFibGVEZWYgIT09IG51bGwgJiYgcHJvdmlkZWRJbiAhPT0gbnVsbCAmJiB0eXBlb2YgcHJvdmlkZWRJbiAhPT0gJ3N0cmluZycpIHtcbiAgICAgIGNvbnN0IGV4aXN0aW5nT3ZlcnJpZGVzID0gdGhpcy5wcm92aWRlck92ZXJyaWRlc0J5TW9kdWxlLmdldChwcm92aWRlZEluKTtcbiAgICAgIGlmIChleGlzdGluZ092ZXJyaWRlcyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGV4aXN0aW5nT3ZlcnJpZGVzLnB1c2gocHJvdmlkZXJEZWYpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5wcm92aWRlck92ZXJyaWRlc0J5TW9kdWxlLnNldChwcm92aWRlZEluLCBbcHJvdmlkZXJEZWZdKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBvdmVycmlkZVRlbXBsYXRlVXNpbmdUZXN0aW5nTW9kdWxlKHR5cGU6IFR5cGU8YW55PiwgdGVtcGxhdGU6IHN0cmluZyk6IHZvaWQge1xuICAgIGNvbnN0IGRlZiA9ICh0eXBlIGFzIGFueSlbTkdfQ09NUF9ERUZdO1xuICAgIGNvbnN0IGhhc1N0eWxlVXJscyA9ICgpOiBib29sZWFuID0+IHtcbiAgICAgIGNvbnN0IG1ldGFkYXRhID0gdGhpcy5yZXNvbHZlcnMuY29tcG9uZW50LnJlc29sdmUodHlwZSkhIGFzIENvbXBvbmVudDtcbiAgICAgIHJldHVybiAhIW1ldGFkYXRhLnN0eWxlVXJsIHx8ICEhbWV0YWRhdGEuc3R5bGVVcmxzPy5sZW5ndGg7XG4gICAgfTtcbiAgICBjb25zdCBvdmVycmlkZVN0eWxlVXJscyA9ICEhZGVmICYmICHJtWlzQ29tcG9uZW50RGVmUGVuZGluZ1Jlc29sdXRpb24odHlwZSkgJiYgaGFzU3R5bGVVcmxzKCk7XG5cbiAgICAvLyBJbiBJdnksIGNvbXBpbGluZyBhIGNvbXBvbmVudCBkb2VzIG5vdCByZXF1aXJlIGtub3dpbmcgdGhlIG1vZHVsZSBwcm92aWRpbmcgdGhlXG4gICAgLy8gY29tcG9uZW50J3Mgc2NvcGUsIHNvIG92ZXJyaWRlVGVtcGxhdGVVc2luZ1Rlc3RpbmdNb2R1bGUgY2FuIGJlIGltcGxlbWVudGVkIHB1cmVseSB2aWFcbiAgICAvLyBvdmVycmlkZUNvbXBvbmVudC4gSW1wb3J0YW50OiBvdmVycmlkaW5nIHRlbXBsYXRlIHJlcXVpcmVzIGZ1bGwgQ29tcG9uZW50IHJlLWNvbXBpbGF0aW9uLFxuICAgIC8vIHdoaWNoIG1heSBmYWlsIGluIGNhc2Ugc3R5bGVVcmxzIGFyZSBhbHNvIHByZXNlbnQgKHRodXMgQ29tcG9uZW50IGlzIGNvbnNpZGVyZWQgYXMgcmVxdWlyZWRcbiAgICAvLyByZXNvbHV0aW9uKS4gSW4gb3JkZXIgdG8gYXZvaWQgdGhpcywgd2UgcHJlZW1wdGl2ZWx5IHNldCBzdHlsZVVybHMgdG8gYW4gZW1wdHkgYXJyYXksXG4gICAgLy8gcHJlc2VydmUgY3VycmVudCBzdHlsZXMgYXZhaWxhYmxlIG9uIENvbXBvbmVudCBkZWYgYW5kIHJlc3RvcmUgc3R5bGVzIGJhY2sgb25jZSBjb21waWxhdGlvblxuICAgIC8vIGlzIGNvbXBsZXRlLlxuICAgIGNvbnN0IG92ZXJyaWRlID0gb3ZlcnJpZGVTdHlsZVVybHNcbiAgICAgID8ge3RlbXBsYXRlLCBzdHlsZXM6IFtdLCBzdHlsZVVybHM6IFtdLCBzdHlsZVVybDogdW5kZWZpbmVkfVxuICAgICAgOiB7dGVtcGxhdGV9O1xuICAgIHRoaXMub3ZlcnJpZGVDb21wb25lbnQodHlwZSwge3NldDogb3ZlcnJpZGV9KTtcblxuICAgIGlmIChvdmVycmlkZVN0eWxlVXJscyAmJiBkZWYuc3R5bGVzICYmIGRlZi5zdHlsZXMubGVuZ3RoID4gMCkge1xuICAgICAgdGhpcy5leGlzdGluZ0NvbXBvbmVudFN0eWxlcy5zZXQodHlwZSwgZGVmLnN0eWxlcyk7XG4gICAgfVxuXG4gICAgLy8gU2V0IHRoZSBjb21wb25lbnQncyBzY29wZSB0byBiZSB0aGUgdGVzdGluZyBtb2R1bGUuXG4gICAgdGhpcy5jb21wb25lbnRUb01vZHVsZVNjb3BlLnNldCh0eXBlLCBUZXN0aW5nTW9kdWxlT3ZlcnJpZGUuT1ZFUlJJREVfVEVNUExBVEUpO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyByZXNvbHZlUGVuZGluZ0NvbXBvbmVudHNXaXRoQXN5bmNNZXRhZGF0YSgpIHtcbiAgICBpZiAodGhpcy5jb21wb25lbnRzV2l0aEFzeW5jTWV0YWRhdGEuc2l6ZSA9PT0gMCkgcmV0dXJuO1xuXG4gICAgY29uc3QgcHJvbWlzZXMgPSBbXTtcbiAgICBmb3IgKGNvbnN0IGNvbXBvbmVudCBvZiB0aGlzLmNvbXBvbmVudHNXaXRoQXN5bmNNZXRhZGF0YSkge1xuICAgICAgY29uc3QgYXN5bmNNZXRhZGF0YUZuID0gZ2V0QXN5bmNDbGFzc01ldGFkYXRhRm4oY29tcG9uZW50KTtcbiAgICAgIGlmIChhc3luY01ldGFkYXRhRm4pIHtcbiAgICAgICAgcHJvbWlzZXMucHVzaChhc3luY01ldGFkYXRhRm4oKSk7XG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMuY29tcG9uZW50c1dpdGhBc3luY01ldGFkYXRhLmNsZWFyKCk7XG5cbiAgICBjb25zdCByZXNvbHZlZERlcHMgPSBhd2FpdCBQcm9taXNlLmFsbChwcm9taXNlcyk7XG4gICAgY29uc3QgZmxhdFJlc29sdmVkRGVwcyA9IHJlc29sdmVkRGVwcy5mbGF0KDIpO1xuICAgIHRoaXMucXVldWVUeXBlc0Zyb21Nb2R1bGVzQXJyYXkoZmxhdFJlc29sdmVkRGVwcyk7XG5cbiAgICAvLyBMb2FkZWQgc3RhbmRhbG9uZSBjb21wb25lbnRzIG1pZ2h0IGNvbnRhaW4gaW1wb3J0cyBvZiBOZ01vZHVsZXNcbiAgICAvLyB3aXRoIHByb3ZpZGVycywgbWFrZSBzdXJlIHdlIG92ZXJyaWRlIHByb3ZpZGVycyB0aGVyZSB0b28uXG4gICAgZm9yIChjb25zdCBjb21wb25lbnQgb2YgZmxhdFJlc29sdmVkRGVwcykge1xuICAgICAgdGhpcy5hcHBseVByb3ZpZGVyT3ZlcnJpZGVzSW5TY29wZShjb21wb25lbnQpO1xuICAgIH1cbiAgfVxuXG4gIGFzeW5jIGNvbXBpbGVDb21wb25lbnRzKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRoaXMuY2xlYXJDb21wb25lbnRSZXNvbHV0aW9uUXVldWUoKTtcblxuICAgIC8vIFdhaXQgZm9yIGFsbCBhc3luYyBtZXRhZGF0YSBmb3IgY29tcG9uZW50cyB0aGF0IHdlcmVcbiAgICAvLyBvdmVycmlkZGVuLCB3ZSBuZWVkIHJlc29sdmVkIG1ldGFkYXRhIHRvIHBlcmZvcm0gYW4gb3ZlcnJpZGVcbiAgICAvLyBhbmQgcmUtY29tcGlsZSBhIGNvbXBvbmVudC5cbiAgICBhd2FpdCB0aGlzLnJlc29sdmVQZW5kaW5nQ29tcG9uZW50c1dpdGhBc3luY01ldGFkYXRhKCk7XG5cbiAgICAvLyBWZXJpZnkgdGhhdCB0aGVyZSB3ZXJlIG5vIHN0YW5kYWxvbmUgY29tcG9uZW50cyBwcmVzZW50IGluIHRoZSBgZGVjbGFyYXRpb25zYCBmaWVsZFxuICAgIC8vIGR1cmluZyB0aGUgYFRlc3RCZWQuY29uZmlndXJlVGVzdGluZ01vZHVsZWAgY2FsbC4gV2UgcGVyZm9ybSB0aGlzIGNoZWNrIGhlcmUgaW4gYWRkaXRpb25cbiAgICAvLyB0byB0aGUgbG9naWMgaW4gdGhlIGBjb25maWd1cmVUZXN0aW5nTW9kdWxlYCBmdW5jdGlvbiwgc2luY2UgYXQgdGhpcyBwb2ludCB3ZSBoYXZlXG4gICAgLy8gYWxsIGFzeW5jIG1ldGFkYXRhIHJlc29sdmVkLlxuICAgIGFzc2VydE5vU3RhbmRhbG9uZUNvbXBvbmVudHMoXG4gICAgICB0aGlzLmRlY2xhcmF0aW9ucyxcbiAgICAgIHRoaXMucmVzb2x2ZXJzLmNvbXBvbmVudCxcbiAgICAgICdcIlRlc3RCZWQuY29uZmlndXJlVGVzdGluZ01vZHVsZVwiIGNhbGwnLFxuICAgICk7XG5cbiAgICAvLyBSdW4gY29tcGlsZXJzIGZvciBhbGwgcXVldWVkIHR5cGVzLlxuICAgIGxldCBuZWVkc0FzeW5jUmVzb3VyY2VzID0gdGhpcy5jb21waWxlVHlwZXNTeW5jKCk7XG5cbiAgICAvLyBjb21waWxlQ29tcG9uZW50cygpIHNob3VsZCBub3QgYmUgYXN5bmMgdW5sZXNzIGl0IG5lZWRzIHRvIGJlLlxuICAgIGlmIChuZWVkc0FzeW5jUmVzb3VyY2VzKSB7XG4gICAgICBsZXQgcmVzb3VyY2VMb2FkZXI6IFJlc291cmNlTG9hZGVyO1xuICAgICAgbGV0IHJlc29sdmVyID0gKHVybDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+ID0+IHtcbiAgICAgICAgaWYgKCFyZXNvdXJjZUxvYWRlcikge1xuICAgICAgICAgIHJlc291cmNlTG9hZGVyID0gdGhpcy5pbmplY3Rvci5nZXQoUmVzb3VyY2VMb2FkZXIpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUocmVzb3VyY2VMb2FkZXIuZ2V0KHVybCkpO1xuICAgICAgfTtcbiAgICAgIGF3YWl0IMm1cmVzb2x2ZUNvbXBvbmVudFJlc291cmNlcyhyZXNvbHZlcik7XG4gICAgfVxuICB9XG5cbiAgZmluYWxpemUoKTogTmdNb2R1bGVSZWY8YW55PiB7XG4gICAgLy8gT25lIGxhc3QgY29tcGlsZVxuICAgIHRoaXMuY29tcGlsZVR5cGVzU3luYygpO1xuXG4gICAgLy8gQ3JlYXRlIHRoZSB0ZXN0aW5nIG1vZHVsZSBpdHNlbGYuXG4gICAgdGhpcy5jb21waWxlVGVzdE1vZHVsZSgpO1xuXG4gICAgdGhpcy5hcHBseVRyYW5zaXRpdmVTY29wZXMoKTtcblxuICAgIHRoaXMuYXBwbHlQcm92aWRlck92ZXJyaWRlcygpO1xuXG4gICAgLy8gUGF0Y2ggcHJldmlvdXNseSBzdG9yZWQgYHN0eWxlc2AgQ29tcG9uZW50IHZhbHVlcyAodGFrZW4gZnJvbSDJtWNtcCksIGluIGNhc2UgdGhlc2VcbiAgICAvLyBDb21wb25lbnRzIGhhdmUgYHN0eWxlVXJsc2AgZmllbGRzIGRlZmluZWQgYW5kIHRlbXBsYXRlIG92ZXJyaWRlIHdhcyByZXF1ZXN0ZWQuXG4gICAgdGhpcy5wYXRjaENvbXBvbmVudHNXaXRoRXhpc3RpbmdTdHlsZXMoKTtcblxuICAgIC8vIENsZWFyIHRoZSBjb21wb25lbnRUb01vZHVsZVNjb3BlIG1hcCwgc28gdGhhdCBmdXR1cmUgY29tcGlsYXRpb25zIGRvbid0IHJlc2V0IHRoZSBzY29wZSBvZlxuICAgIC8vIGV2ZXJ5IGNvbXBvbmVudC5cbiAgICB0aGlzLmNvbXBvbmVudFRvTW9kdWxlU2NvcGUuY2xlYXIoKTtcblxuICAgIGNvbnN0IHBhcmVudEluamVjdG9yID0gdGhpcy5wbGF0Zm9ybS5pbmplY3RvcjtcbiAgICB0aGlzLnRlc3RNb2R1bGVSZWYgPSBuZXcgTmdNb2R1bGVSZWYodGhpcy50ZXN0TW9kdWxlVHlwZSwgcGFyZW50SW5qZWN0b3IsIFtdKTtcblxuICAgIC8vIEFwcGxpY2F0aW9uSW5pdFN0YXR1cy5ydW5Jbml0aWFsaXplcnMoKSBpcyBtYXJrZWQgQGludGVybmFsIHRvIGNvcmUuXG4gICAgLy8gQ2FzdCBpdCB0byBhbnkgYmVmb3JlIGFjY2Vzc2luZyBpdC5cbiAgICAodGhpcy50ZXN0TW9kdWxlUmVmLmluamVjdG9yLmdldChBcHBsaWNhdGlvbkluaXRTdGF0dXMpIGFzIGFueSkucnVuSW5pdGlhbGl6ZXJzKCk7XG5cbiAgICAvLyBTZXQgbG9jYWxlIElEIGFmdGVyIHJ1bm5pbmcgYXBwIGluaXRpYWxpemVycywgc2luY2UgbG9jYWxlIGluZm9ybWF0aW9uIG1pZ2h0IGJlIHVwZGF0ZWQgd2hpbGVcbiAgICAvLyBydW5uaW5nIGluaXRpYWxpemVycy4gVGhpcyBpcyBhbHNvIGNvbnNpc3RlbnQgd2l0aCB0aGUgZXhlY3V0aW9uIG9yZGVyIHdoaWxlIGJvb3RzdHJhcHBpbmcgYW5cbiAgICAvLyBhcHAgKHNlZSBgcGFja2FnZXMvY29yZS9zcmMvYXBwbGljYXRpb25fcmVmLnRzYCBmaWxlKS5cbiAgICBjb25zdCBsb2NhbGVJZCA9IHRoaXMudGVzdE1vZHVsZVJlZi5pbmplY3Rvci5nZXQoTE9DQUxFX0lELCBERUZBVUxUX0xPQ0FMRV9JRCk7XG4gICAgc2V0TG9jYWxlSWQobG9jYWxlSWQpO1xuXG4gICAgcmV0dXJuIHRoaXMudGVzdE1vZHVsZVJlZjtcbiAgfVxuXG4gIC8qKlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIF9jb21waWxlTmdNb2R1bGVTeW5jKG1vZHVsZVR5cGU6IFR5cGU8YW55Pik6IHZvaWQge1xuICAgIHRoaXMucXVldWVUeXBlc0Zyb21Nb2R1bGVzQXJyYXkoW21vZHVsZVR5cGVdKTtcbiAgICB0aGlzLmNvbXBpbGVUeXBlc1N5bmMoKTtcbiAgICB0aGlzLmFwcGx5UHJvdmlkZXJPdmVycmlkZXMoKTtcbiAgICB0aGlzLmFwcGx5UHJvdmlkZXJPdmVycmlkZXNJblNjb3BlKG1vZHVsZVR5cGUpO1xuICAgIHRoaXMuYXBwbHlUcmFuc2l0aXZlU2NvcGVzKCk7XG4gIH1cblxuICAvKipcbiAgICogQGludGVybmFsXG4gICAqL1xuICBhc3luYyBfY29tcGlsZU5nTW9kdWxlQXN5bmMobW9kdWxlVHlwZTogVHlwZTxhbnk+KTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdGhpcy5xdWV1ZVR5cGVzRnJvbU1vZHVsZXNBcnJheShbbW9kdWxlVHlwZV0pO1xuICAgIGF3YWl0IHRoaXMuY29tcGlsZUNvbXBvbmVudHMoKTtcbiAgICB0aGlzLmFwcGx5UHJvdmlkZXJPdmVycmlkZXMoKTtcbiAgICB0aGlzLmFwcGx5UHJvdmlkZXJPdmVycmlkZXNJblNjb3BlKG1vZHVsZVR5cGUpO1xuICAgIHRoaXMuYXBwbHlUcmFuc2l0aXZlU2NvcGVzKCk7XG4gIH1cblxuICAvKipcbiAgICogQGludGVybmFsXG4gICAqL1xuICBfZ2V0TW9kdWxlUmVzb2x2ZXIoKTogUmVzb2x2ZXI8TmdNb2R1bGU+IHtcbiAgICByZXR1cm4gdGhpcy5yZXNvbHZlcnMubW9kdWxlO1xuICB9XG5cbiAgLyoqXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgX2dldENvbXBvbmVudEZhY3Rvcmllcyhtb2R1bGVUeXBlOiBOZ01vZHVsZVR5cGUpOiBDb21wb25lbnRGYWN0b3J5PGFueT5bXSB7XG4gICAgcmV0dXJuIG1heWJlVW53cmFwRm4obW9kdWxlVHlwZS7JtW1vZC5kZWNsYXJhdGlvbnMpLnJlZHVjZSgoZmFjdG9yaWVzLCBkZWNsYXJhdGlvbikgPT4ge1xuICAgICAgY29uc3QgY29tcG9uZW50RGVmID0gKGRlY2xhcmF0aW9uIGFzIGFueSkuybVjbXA7XG4gICAgICBjb21wb25lbnREZWYgJiYgZmFjdG9yaWVzLnB1c2gobmV3IENvbXBvbmVudEZhY3RvcnkoY29tcG9uZW50RGVmLCB0aGlzLnRlc3RNb2R1bGVSZWYhKSk7XG4gICAgICByZXR1cm4gZmFjdG9yaWVzO1xuICAgIH0sIFtdIGFzIENvbXBvbmVudEZhY3Rvcnk8YW55PltdKTtcbiAgfVxuXG4gIHByaXZhdGUgY29tcGlsZVR5cGVzU3luYygpOiBib29sZWFuIHtcbiAgICAvLyBDb21waWxlIGFsbCBxdWV1ZWQgY29tcG9uZW50cywgZGlyZWN0aXZlcywgcGlwZXMuXG4gICAgbGV0IG5lZWRzQXN5bmNSZXNvdXJjZXMgPSBmYWxzZTtcbiAgICB0aGlzLnBlbmRpbmdDb21wb25lbnRzLmZvckVhY2goKGRlY2xhcmF0aW9uKSA9PiB7XG4gICAgICBpZiAoZ2V0QXN5bmNDbGFzc01ldGFkYXRhRm4oZGVjbGFyYXRpb24pKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICBgQ29tcG9uZW50ICcke2RlY2xhcmF0aW9uLm5hbWV9JyBoYXMgdW5yZXNvbHZlZCBtZXRhZGF0YS4gYCArXG4gICAgICAgICAgICBgUGxlYXNlIGNhbGwgXFxgYXdhaXQgVGVzdEJlZC5jb21waWxlQ29tcG9uZW50cygpXFxgIGJlZm9yZSBydW5uaW5nIHRoaXMgdGVzdC5gLFxuICAgICAgICApO1xuICAgICAgfVxuXG4gICAgICBuZWVkc0FzeW5jUmVzb3VyY2VzID0gbmVlZHNBc3luY1Jlc291cmNlcyB8fCDJtWlzQ29tcG9uZW50RGVmUGVuZGluZ1Jlc29sdXRpb24oZGVjbGFyYXRpb24pO1xuXG4gICAgICBjb25zdCBtZXRhZGF0YSA9IHRoaXMucmVzb2x2ZXJzLmNvbXBvbmVudC5yZXNvbHZlKGRlY2xhcmF0aW9uKTtcbiAgICAgIGlmIChtZXRhZGF0YSA9PT0gbnVsbCkge1xuICAgICAgICB0aHJvdyBpbnZhbGlkVHlwZUVycm9yKGRlY2xhcmF0aW9uLm5hbWUsICdDb21wb25lbnQnKTtcbiAgICAgIH1cblxuICAgICAgdGhpcy5tYXliZVN0b3JlTmdEZWYoTkdfQ09NUF9ERUYsIGRlY2xhcmF0aW9uKTtcbiAgICAgIGlmIChVU0VfUlVOVElNRV9ERVBTX1RSQUNLRVJfRk9SX0pJVCkge1xuICAgICAgICBkZXBzVHJhY2tlci5jbGVhclNjb3BlQ2FjaGVGb3IoZGVjbGFyYXRpb24pO1xuICAgICAgfVxuICAgICAgY29tcGlsZUNvbXBvbmVudChkZWNsYXJhdGlvbiwgbWV0YWRhdGEpO1xuICAgIH0pO1xuICAgIHRoaXMucGVuZGluZ0NvbXBvbmVudHMuY2xlYXIoKTtcblxuICAgIHRoaXMucGVuZGluZ0RpcmVjdGl2ZXMuZm9yRWFjaCgoZGVjbGFyYXRpb24pID0+IHtcbiAgICAgIGNvbnN0IG1ldGFkYXRhID0gdGhpcy5yZXNvbHZlcnMuZGlyZWN0aXZlLnJlc29sdmUoZGVjbGFyYXRpb24pO1xuICAgICAgaWYgKG1ldGFkYXRhID09PSBudWxsKSB7XG4gICAgICAgIHRocm93IGludmFsaWRUeXBlRXJyb3IoZGVjbGFyYXRpb24ubmFtZSwgJ0RpcmVjdGl2ZScpO1xuICAgICAgfVxuICAgICAgdGhpcy5tYXliZVN0b3JlTmdEZWYoTkdfRElSX0RFRiwgZGVjbGFyYXRpb24pO1xuICAgICAgY29tcGlsZURpcmVjdGl2ZShkZWNsYXJhdGlvbiwgbWV0YWRhdGEpO1xuICAgIH0pO1xuICAgIHRoaXMucGVuZGluZ0RpcmVjdGl2ZXMuY2xlYXIoKTtcblxuICAgIHRoaXMucGVuZGluZ1BpcGVzLmZvckVhY2goKGRlY2xhcmF0aW9uKSA9PiB7XG4gICAgICBjb25zdCBtZXRhZGF0YSA9IHRoaXMucmVzb2x2ZXJzLnBpcGUucmVzb2x2ZShkZWNsYXJhdGlvbik7XG4gICAgICBpZiAobWV0YWRhdGEgPT09IG51bGwpIHtcbiAgICAgICAgdGhyb3cgaW52YWxpZFR5cGVFcnJvcihkZWNsYXJhdGlvbi5uYW1lLCAnUGlwZScpO1xuICAgICAgfVxuICAgICAgdGhpcy5tYXliZVN0b3JlTmdEZWYoTkdfUElQRV9ERUYsIGRlY2xhcmF0aW9uKTtcbiAgICAgIGNvbXBpbGVQaXBlKGRlY2xhcmF0aW9uLCBtZXRhZGF0YSk7XG4gICAgfSk7XG4gICAgdGhpcy5wZW5kaW5nUGlwZXMuY2xlYXIoKTtcblxuICAgIHJldHVybiBuZWVkc0FzeW5jUmVzb3VyY2VzO1xuICB9XG5cbiAgcHJpdmF0ZSBhcHBseVRyYW5zaXRpdmVTY29wZXMoKTogdm9pZCB7XG4gICAgaWYgKHRoaXMub3ZlcnJpZGRlbk1vZHVsZXMuc2l6ZSA+IDApIHtcbiAgICAgIC8vIE1vZHVsZSBvdmVycmlkZXMgKHZpYSBgVGVzdEJlZC5vdmVycmlkZU1vZHVsZWApIG1pZ2h0IGFmZmVjdCBzY29wZXMgdGhhdCB3ZXJlIHByZXZpb3VzbHlcbiAgICAgIC8vIGNhbGN1bGF0ZWQgYW5kIHN0b3JlZCBpbiBgdHJhbnNpdGl2ZUNvbXBpbGVTY29wZXNgLiBJZiBtb2R1bGUgb3ZlcnJpZGVzIGFyZSBwcmVzZW50LFxuICAgICAgLy8gY29sbGVjdCBhbGwgYWZmZWN0ZWQgbW9kdWxlcyBhbmQgcmVzZXQgc2NvcGVzIHRvIGZvcmNlIHRoZWlyIHJlLWNhbGN1bGF0aW9uLlxuICAgICAgY29uc3QgdGVzdGluZ01vZHVsZURlZiA9ICh0aGlzLnRlc3RNb2R1bGVUeXBlIGFzIGFueSlbTkdfTU9EX0RFRl07XG4gICAgICBjb25zdCBhZmZlY3RlZE1vZHVsZXMgPSB0aGlzLmNvbGxlY3RNb2R1bGVzQWZmZWN0ZWRCeU92ZXJyaWRlcyh0ZXN0aW5nTW9kdWxlRGVmLmltcG9ydHMpO1xuICAgICAgaWYgKGFmZmVjdGVkTW9kdWxlcy5zaXplID4gMCkge1xuICAgICAgICBhZmZlY3RlZE1vZHVsZXMuZm9yRWFjaCgobW9kdWxlVHlwZSkgPT4ge1xuICAgICAgICAgIGlmICghVVNFX1JVTlRJTUVfREVQU19UUkFDS0VSX0ZPUl9KSVQpIHtcbiAgICAgICAgICAgIHRoaXMuc3RvcmVGaWVsZE9mRGVmT25UeXBlKG1vZHVsZVR5cGUgYXMgYW55LCBOR19NT0RfREVGLCAndHJhbnNpdGl2ZUNvbXBpbGVTY29wZXMnKTtcbiAgICAgICAgICAgIChtb2R1bGVUeXBlIGFzIGFueSlbTkdfTU9EX0RFRl0udHJhbnNpdGl2ZUNvbXBpbGVTY29wZXMgPSBudWxsO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBkZXBzVHJhY2tlci5jbGVhclNjb3BlQ2FjaGVGb3IobW9kdWxlVHlwZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zdCBtb2R1bGVUb1Njb3BlID0gbmV3IE1hcDxUeXBlPGFueT4gfCBUZXN0aW5nTW9kdWxlT3ZlcnJpZGUsIE5nTW9kdWxlVHJhbnNpdGl2ZVNjb3Blcz4oKTtcbiAgICBjb25zdCBnZXRTY29wZU9mTW9kdWxlID0gKFxuICAgICAgbW9kdWxlVHlwZTogVHlwZTxhbnk+IHwgVGVzdGluZ01vZHVsZU92ZXJyaWRlLFxuICAgICk6IE5nTW9kdWxlVHJhbnNpdGl2ZVNjb3BlcyA9PiB7XG4gICAgICBpZiAoIW1vZHVsZVRvU2NvcGUuaGFzKG1vZHVsZVR5cGUpKSB7XG4gICAgICAgIGNvbnN0IGlzVGVzdGluZ01vZHVsZSA9IGlzVGVzdGluZ01vZHVsZU92ZXJyaWRlKG1vZHVsZVR5cGUpO1xuICAgICAgICBjb25zdCByZWFsVHlwZSA9IGlzVGVzdGluZ01vZHVsZSA/IHRoaXMudGVzdE1vZHVsZVR5cGUgOiAobW9kdWxlVHlwZSBhcyBUeXBlPGFueT4pO1xuICAgICAgICBtb2R1bGVUb1Njb3BlLnNldChtb2R1bGVUeXBlLCB0cmFuc2l0aXZlU2NvcGVzRm9yKHJlYWxUeXBlKSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gbW9kdWxlVG9TY29wZS5nZXQobW9kdWxlVHlwZSkhO1xuICAgIH07XG5cbiAgICB0aGlzLmNvbXBvbmVudFRvTW9kdWxlU2NvcGUuZm9yRWFjaCgobW9kdWxlVHlwZSwgY29tcG9uZW50VHlwZSkgPT4ge1xuICAgICAgaWYgKG1vZHVsZVR5cGUgIT09IG51bGwpIHtcbiAgICAgICAgY29uc3QgbW9kdWxlU2NvcGUgPSBnZXRTY29wZU9mTW9kdWxlKG1vZHVsZVR5cGUpO1xuICAgICAgICB0aGlzLnN0b3JlRmllbGRPZkRlZk9uVHlwZShjb21wb25lbnRUeXBlLCBOR19DT01QX0RFRiwgJ2RpcmVjdGl2ZURlZnMnKTtcbiAgICAgICAgdGhpcy5zdG9yZUZpZWxkT2ZEZWZPblR5cGUoY29tcG9uZW50VHlwZSwgTkdfQ09NUF9ERUYsICdwaXBlRGVmcycpO1xuICAgICAgICBwYXRjaENvbXBvbmVudERlZldpdGhTY29wZShnZXRDb21wb25lbnREZWYoY29tcG9uZW50VHlwZSkhLCBtb2R1bGVTY29wZSk7XG4gICAgICB9XG4gICAgICAvLyBgdFZpZXdgIHRoYXQgaXMgc3RvcmVkIG9uIGNvbXBvbmVudCBkZWYgY29udGFpbnMgaW5mb3JtYXRpb24gYWJvdXQgZGlyZWN0aXZlcyBhbmQgcGlwZXNcbiAgICAgIC8vIHRoYXQgYXJlIGluIHRoZSBzY29wZSBvZiB0aGlzIGNvbXBvbmVudC4gUGF0Y2hpbmcgY29tcG9uZW50IHNjb3BlIHdpbGwgY2F1c2UgYHRWaWV3YCB0byBiZVxuICAgICAgLy8gY2hhbmdlZC4gU3RvcmUgb3JpZ2luYWwgYHRWaWV3YCBiZWZvcmUgcGF0Y2hpbmcgc2NvcGUsIHNvIHRoZSBgdFZpZXdgIChpbmNsdWRpbmcgc2NvcGVcbiAgICAgIC8vIGluZm9ybWF0aW9uKSBpcyByZXN0b3JlZCBiYWNrIHRvIGl0cyBwcmV2aW91cy9vcmlnaW5hbCBzdGF0ZSBiZWZvcmUgcnVubmluZyBuZXh0IHRlc3QuXG4gICAgICAvLyBSZXNldHRpbmcgYHRWaWV3YCBpcyBhbHNvIG5lZWRlZCBmb3IgY2FzZXMgd2hlbiB3ZSBhcHBseSBwcm92aWRlciBvdmVycmlkZXMgYW5kIHRob3NlXG4gICAgICAvLyBwcm92aWRlcnMgYXJlIGRlZmluZWQgb24gY29tcG9uZW50J3MgbGV2ZWwsIGluIHdoaWNoIGNhc2UgdGhleSBtYXkgZW5kIHVwIGluY2x1ZGVkIGludG9cbiAgICAgIC8vIGB0Vmlldy5ibHVlcHJpbnRgLlxuICAgICAgdGhpcy5zdG9yZUZpZWxkT2ZEZWZPblR5cGUoY29tcG9uZW50VHlwZSwgTkdfQ09NUF9ERUYsICd0VmlldycpO1xuICAgIH0pO1xuXG4gICAgdGhpcy5jb21wb25lbnRUb01vZHVsZVNjb3BlLmNsZWFyKCk7XG4gIH1cblxuICBwcml2YXRlIGFwcGx5UHJvdmlkZXJPdmVycmlkZXMoKTogdm9pZCB7XG4gICAgY29uc3QgbWF5YmVBcHBseU92ZXJyaWRlcyA9IChmaWVsZDogc3RyaW5nKSA9PiAodHlwZTogVHlwZTxhbnk+KSA9PiB7XG4gICAgICBjb25zdCByZXNvbHZlciA9IGZpZWxkID09PSBOR19DT01QX0RFRiA/IHRoaXMucmVzb2x2ZXJzLmNvbXBvbmVudCA6IHRoaXMucmVzb2x2ZXJzLmRpcmVjdGl2ZTtcbiAgICAgIGNvbnN0IG1ldGFkYXRhID0gcmVzb2x2ZXIucmVzb2x2ZSh0eXBlKSE7XG4gICAgICBpZiAodGhpcy5oYXNQcm92aWRlck92ZXJyaWRlcyhtZXRhZGF0YS5wcm92aWRlcnMpKSB7XG4gICAgICAgIHRoaXMucGF0Y2hEZWZXaXRoUHJvdmlkZXJPdmVycmlkZXModHlwZSwgZmllbGQpO1xuICAgICAgfVxuICAgIH07XG4gICAgdGhpcy5zZWVuQ29tcG9uZW50cy5mb3JFYWNoKG1heWJlQXBwbHlPdmVycmlkZXMoTkdfQ09NUF9ERUYpKTtcbiAgICB0aGlzLnNlZW5EaXJlY3RpdmVzLmZvckVhY2gobWF5YmVBcHBseU92ZXJyaWRlcyhOR19ESVJfREVGKSk7XG5cbiAgICB0aGlzLnNlZW5Db21wb25lbnRzLmNsZWFyKCk7XG4gICAgdGhpcy5zZWVuRGlyZWN0aXZlcy5jbGVhcigpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFwcGxpZXMgcHJvdmlkZXIgb3ZlcnJpZGVzIHRvIGEgZ2l2ZW4gdHlwZSAoZWl0aGVyIGFuIE5nTW9kdWxlIG9yIGEgc3RhbmRhbG9uZSBjb21wb25lbnQpXG4gICAqIGFuZCBhbGwgaW1wb3J0ZWQgTmdNb2R1bGVzIGFuZCBzdGFuZGFsb25lIGNvbXBvbmVudHMgcmVjdXJzaXZlbHkuXG4gICAqL1xuICBwcml2YXRlIGFwcGx5UHJvdmlkZXJPdmVycmlkZXNJblNjb3BlKHR5cGU6IFR5cGU8YW55Pik6IHZvaWQge1xuICAgIGNvbnN0IGhhc1Njb3BlID0gaXNTdGFuZGFsb25lQ29tcG9uZW50KHR5cGUpIHx8IGlzTmdNb2R1bGUodHlwZSk7XG5cbiAgICAvLyBUaGUgZnVuY3Rpb24gY2FuIGJlIHJlLWVudGVyZWQgcmVjdXJzaXZlbHkgd2hpbGUgaW5zcGVjdGluZyBkZXBlbmRlbmNpZXNcbiAgICAvLyBvZiBhbiBOZ01vZHVsZSBvciBhIHN0YW5kYWxvbmUgY29tcG9uZW50LiBFeGl0IGVhcmx5IGlmIHdlIGNvbWUgYWNyb3NzIGFcbiAgICAvLyB0eXBlIHRoYXQgY2FuIG5vdCBoYXZlIGEgc2NvcGUgKGRpcmVjdGl2ZSBvciBwaXBlKSBvciB0aGUgdHlwZSBpcyBhbHJlYWR5XG4gICAgLy8gcHJvY2Vzc2VkIGVhcmxpZXIuXG4gICAgaWYgKCFoYXNTY29wZSB8fCB0aGlzLnNjb3Blc1dpdGhPdmVycmlkZGVuUHJvdmlkZXJzLmhhcyh0eXBlKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLnNjb3Blc1dpdGhPdmVycmlkZGVuUHJvdmlkZXJzLmFkZCh0eXBlKTtcblxuICAgIC8vIE5PVEU6IHRoZSBsaW5lIGJlbG93IHRyaWdnZXJzIEpJVCBjb21waWxhdGlvbiBvZiB0aGUgbW9kdWxlIGluamVjdG9yLFxuICAgIC8vIHdoaWNoIGFsc28gaW52b2tlcyB2ZXJpZmljYXRpb24gb2YgdGhlIE5nTW9kdWxlIHNlbWFudGljcywgd2hpY2ggcHJvZHVjZXNcbiAgICAvLyBkZXRhaWxlZCBlcnJvciBtZXNzYWdlcy4gVGhlIGZhY3QgdGhhdCB0aGUgY29kZSByZWxpZXMgb24gdGhpcyBsaW5lIGJlaW5nXG4gICAgLy8gcHJlc2VudCBoZXJlIGlzIHN1c3BpY2lvdXMgYW5kIHNob3VsZCBiZSByZWZhY3RvcmVkIGluIGEgd2F5IHRoYXQgdGhlIGxpbmVcbiAgICAvLyBiZWxvdyBjYW4gYmUgbW92ZWQgKGZvciBleC4gYWZ0ZXIgYW4gZWFybHkgZXhpdCBjaGVjayBiZWxvdykuXG4gICAgY29uc3QgaW5qZWN0b3JEZWY6IGFueSA9ICh0eXBlIGFzIGFueSlbTkdfSU5KX0RFRl07XG5cbiAgICAvLyBObyBwcm92aWRlciBvdmVycmlkZXMsIGV4aXQgZWFybHkuXG4gICAgaWYgKHRoaXMucHJvdmlkZXJPdmVycmlkZXNCeVRva2VuLnNpemUgPT09IDApIHJldHVybjtcblxuICAgIGlmIChpc1N0YW5kYWxvbmVDb21wb25lbnQodHlwZSkpIHtcbiAgICAgIC8vIFZpc2l0IGFsbCBjb21wb25lbnQgZGVwZW5kZW5jaWVzIGFuZCBvdmVycmlkZSBwcm92aWRlcnMgdGhlcmUuXG4gICAgICBjb25zdCBkZWYgPSBnZXRDb21wb25lbnREZWYodHlwZSk7XG4gICAgICBjb25zdCBkZXBlbmRlbmNpZXMgPSBtYXliZVVud3JhcEZuKGRlZi5kZXBlbmRlbmNpZXMgPz8gW10pO1xuICAgICAgZm9yIChjb25zdCBkZXBlbmRlbmN5IG9mIGRlcGVuZGVuY2llcykge1xuICAgICAgICB0aGlzLmFwcGx5UHJvdmlkZXJPdmVycmlkZXNJblNjb3BlKGRlcGVuZGVuY3kpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBwcm92aWRlcnM6IEFycmF5PFByb3ZpZGVyIHwgSW50ZXJuYWxFbnZpcm9ubWVudFByb3ZpZGVycz4gPSBbXG4gICAgICAgIC4uLmluamVjdG9yRGVmLnByb3ZpZGVycyxcbiAgICAgICAgLi4uKHRoaXMucHJvdmlkZXJPdmVycmlkZXNCeU1vZHVsZS5nZXQodHlwZSBhcyBJbmplY3RvclR5cGU8YW55PikgfHwgW10pLFxuICAgICAgXTtcbiAgICAgIGlmICh0aGlzLmhhc1Byb3ZpZGVyT3ZlcnJpZGVzKHByb3ZpZGVycykpIHtcbiAgICAgICAgdGhpcy5tYXliZVN0b3JlTmdEZWYoTkdfSU5KX0RFRiwgdHlwZSk7XG5cbiAgICAgICAgdGhpcy5zdG9yZUZpZWxkT2ZEZWZPblR5cGUodHlwZSwgTkdfSU5KX0RFRiwgJ3Byb3ZpZGVycycpO1xuICAgICAgICBpbmplY3RvckRlZi5wcm92aWRlcnMgPSB0aGlzLmdldE92ZXJyaWRkZW5Qcm92aWRlcnMocHJvdmlkZXJzKTtcbiAgICAgIH1cblxuICAgICAgLy8gQXBwbHkgcHJvdmlkZXIgb3ZlcnJpZGVzIHRvIGltcG9ydGVkIG1vZHVsZXMgcmVjdXJzaXZlbHlcbiAgICAgIGNvbnN0IG1vZHVsZURlZiA9ICh0eXBlIGFzIGFueSlbTkdfTU9EX0RFRl07XG4gICAgICBjb25zdCBpbXBvcnRzID0gbWF5YmVVbndyYXBGbihtb2R1bGVEZWYuaW1wb3J0cyk7XG4gICAgICBmb3IgKGNvbnN0IGltcG9ydGVkTW9kdWxlIG9mIGltcG9ydHMpIHtcbiAgICAgICAgdGhpcy5hcHBseVByb3ZpZGVyT3ZlcnJpZGVzSW5TY29wZShpbXBvcnRlZE1vZHVsZSk7XG4gICAgICB9XG4gICAgICAvLyBBbHNvIG92ZXJyaWRlIHRoZSBwcm92aWRlcnMgb24gYW55IE1vZHVsZVdpdGhQcm92aWRlcnMgaW1wb3J0cyBzaW5jZSB0aG9zZSBkb24ndCBhcHBlYXIgaW5cbiAgICAgIC8vIHRoZSBtb2R1bGVEZWYuXG4gICAgICBmb3IgKGNvbnN0IGltcG9ydGVkTW9kdWxlIG9mIGZsYXR0ZW4oaW5qZWN0b3JEZWYuaW1wb3J0cykpIHtcbiAgICAgICAgaWYgKGlzTW9kdWxlV2l0aFByb3ZpZGVycyhpbXBvcnRlZE1vZHVsZSkpIHtcbiAgICAgICAgICB0aGlzLmRlZkNsZWFudXBPcHMucHVzaCh7XG4gICAgICAgICAgICBvYmplY3Q6IGltcG9ydGVkTW9kdWxlLFxuICAgICAgICAgICAgZmllbGROYW1lOiAncHJvdmlkZXJzJyxcbiAgICAgICAgICAgIG9yaWdpbmFsVmFsdWU6IGltcG9ydGVkTW9kdWxlLnByb3ZpZGVycyxcbiAgICAgICAgICB9KTtcbiAgICAgICAgICBpbXBvcnRlZE1vZHVsZS5wcm92aWRlcnMgPSB0aGlzLmdldE92ZXJyaWRkZW5Qcm92aWRlcnMoXG4gICAgICAgICAgICBpbXBvcnRlZE1vZHVsZS5wcm92aWRlcnMgYXMgQXJyYXk8UHJvdmlkZXIgfCBJbnRlcm5hbEVudmlyb25tZW50UHJvdmlkZXJzPixcbiAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBwYXRjaENvbXBvbmVudHNXaXRoRXhpc3RpbmdTdHlsZXMoKTogdm9pZCB7XG4gICAgdGhpcy5leGlzdGluZ0NvbXBvbmVudFN0eWxlcy5mb3JFYWNoKFxuICAgICAgKHN0eWxlcywgdHlwZSkgPT4gKCh0eXBlIGFzIGFueSlbTkdfQ09NUF9ERUZdLnN0eWxlcyA9IHN0eWxlcyksXG4gICAgKTtcbiAgICB0aGlzLmV4aXN0aW5nQ29tcG9uZW50U3R5bGVzLmNsZWFyKCk7XG4gIH1cblxuICBwcml2YXRlIHF1ZXVlVHlwZUFycmF5KGFycjogYW55W10sIG1vZHVsZVR5cGU6IFR5cGU8YW55PiB8IFRlc3RpbmdNb2R1bGVPdmVycmlkZSk6IHZvaWQge1xuICAgIGZvciAoY29uc3QgdmFsdWUgb2YgYXJyKSB7XG4gICAgICBpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHtcbiAgICAgICAgdGhpcy5xdWV1ZVR5cGVBcnJheSh2YWx1ZSwgbW9kdWxlVHlwZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLnF1ZXVlVHlwZSh2YWx1ZSwgbW9kdWxlVHlwZSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSByZWNvbXBpbGVOZ01vZHVsZShuZ01vZHVsZTogVHlwZTxhbnk+LCBtZXRhZGF0YTogTmdNb2R1bGUpOiB2b2lkIHtcbiAgICAvLyBDYWNoZSB0aGUgaW5pdGlhbCBuZ01vZHVsZURlZiBhcyBpdCB3aWxsIGJlIG92ZXJ3cml0dGVuLlxuICAgIHRoaXMubWF5YmVTdG9yZU5nRGVmKE5HX01PRF9ERUYsIG5nTW9kdWxlKTtcbiAgICB0aGlzLm1heWJlU3RvcmVOZ0RlZihOR19JTkpfREVGLCBuZ01vZHVsZSk7XG5cbiAgICBjb21waWxlTmdNb2R1bGVEZWZzKG5nTW9kdWxlIGFzIE5nTW9kdWxlVHlwZTxhbnk+LCBtZXRhZGF0YSk7XG4gIH1cblxuICBwcml2YXRlIG1heWJlUmVnaXN0ZXJDb21wb25lbnRXaXRoQXN5bmNNZXRhZGF0YSh0eXBlOiBUeXBlPHVua25vd24+KSB7XG4gICAgY29uc3QgYXN5bmNNZXRhZGF0YUZuID0gZ2V0QXN5bmNDbGFzc01ldGFkYXRhRm4odHlwZSk7XG4gICAgaWYgKGFzeW5jTWV0YWRhdGFGbikge1xuICAgICAgdGhpcy5jb21wb25lbnRzV2l0aEFzeW5jTWV0YWRhdGEuYWRkKHR5cGUpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgcXVldWVUeXBlKHR5cGU6IFR5cGU8YW55PiwgbW9kdWxlVHlwZTogVHlwZTxhbnk+IHwgVGVzdGluZ01vZHVsZU92ZXJyaWRlIHwgbnVsbCk6IHZvaWQge1xuICAgIC8vIElmIHRoaXMgaXMgYSBjb21wb25lbnQgd2l0aCBhc3luYyBtZXRhZGF0YSAoaS5lLiBhIGNvbXBvbmVudCB3aXRoIGEgYEBkZWZlcmAgYmxvY2tcbiAgICAvLyBpbiBhIHRlbXBsYXRlKSAtIHN0b3JlIGl0IGZvciBmdXR1cmUgcHJvY2Vzc2luZy5cbiAgICB0aGlzLm1heWJlUmVnaXN0ZXJDb21wb25lbnRXaXRoQXN5bmNNZXRhZGF0YSh0eXBlKTtcblxuICAgIGNvbnN0IGNvbXBvbmVudCA9IHRoaXMucmVzb2x2ZXJzLmNvbXBvbmVudC5yZXNvbHZlKHR5cGUpO1xuICAgIGlmIChjb21wb25lbnQpIHtcbiAgICAgIC8vIENoZWNrIHdoZXRoZXIgYSBnaXZlIFR5cGUgaGFzIHJlc3BlY3RpdmUgTkcgZGVmICjJtWNtcCkgYW5kIGNvbXBpbGUgaWYgZGVmIGlzXG4gICAgICAvLyBtaXNzaW5nLiBUaGF0IG1pZ2h0IGhhcHBlbiBpbiBjYXNlIGEgY2xhc3Mgd2l0aG91dCBhbnkgQW5ndWxhciBkZWNvcmF0b3JzIGV4dGVuZHMgYW5vdGhlclxuICAgICAgLy8gY2xhc3Mgd2hlcmUgQ29tcG9uZW50L0RpcmVjdGl2ZS9QaXBlIGRlY29yYXRvciBpcyBkZWZpbmVkLlxuICAgICAgaWYgKMm1aXNDb21wb25lbnREZWZQZW5kaW5nUmVzb2x1dGlvbih0eXBlKSB8fCAhdHlwZS5oYXNPd25Qcm9wZXJ0eShOR19DT01QX0RFRikpIHtcbiAgICAgICAgdGhpcy5wZW5kaW5nQ29tcG9uZW50cy5hZGQodHlwZSk7XG4gICAgICB9XG4gICAgICB0aGlzLnNlZW5Db21wb25lbnRzLmFkZCh0eXBlKTtcblxuICAgICAgLy8gS2VlcCB0cmFjayBvZiB0aGUgbW9kdWxlIHdoaWNoIGRlY2xhcmVzIHRoaXMgY29tcG9uZW50LCBzbyBsYXRlciB0aGUgY29tcG9uZW50J3Mgc2NvcGVcbiAgICAgIC8vIGNhbiBiZSBzZXQgY29ycmVjdGx5LiBJZiB0aGUgY29tcG9uZW50IGhhcyBhbHJlYWR5IGJlZW4gcmVjb3JkZWQgaGVyZSwgdGhlbiBvbmUgb2Ygc2V2ZXJhbFxuICAgICAgLy8gY2FzZXMgaXMgdHJ1ZTpcbiAgICAgIC8vICogdGhlIG1vZHVsZSBjb250YWluaW5nIHRoZSBjb21wb25lbnQgd2FzIGltcG9ydGVkIG11bHRpcGxlIHRpbWVzIChjb21tb24pLlxuICAgICAgLy8gKiB0aGUgY29tcG9uZW50IGlzIGRlY2xhcmVkIGluIG11bHRpcGxlIG1vZHVsZXMgKHdoaWNoIGlzIGFuIGVycm9yKS5cbiAgICAgIC8vICogdGhlIGNvbXBvbmVudCB3YXMgaW4gJ2RlY2xhcmF0aW9ucycgb2YgdGhlIHRlc3RpbmcgbW9kdWxlLCBhbmQgYWxzbyBpbiBhbiBpbXBvcnRlZCBtb2R1bGVcbiAgICAgIC8vICAgaW4gd2hpY2ggY2FzZSB0aGUgbW9kdWxlIHNjb3BlIHdpbGwgYmUgVGVzdGluZ01vZHVsZU92ZXJyaWRlLkRFQ0xBUkFUSU9OLlxuICAgICAgLy8gKiBvdmVycmlkZVRlbXBsYXRlVXNpbmdUZXN0aW5nTW9kdWxlIHdhcyBjYWxsZWQgZm9yIHRoZSBjb21wb25lbnQgaW4gd2hpY2ggY2FzZSB0aGUgbW9kdWxlXG4gICAgICAvLyAgIHNjb3BlIHdpbGwgYmUgVGVzdGluZ01vZHVsZU92ZXJyaWRlLk9WRVJSSURFX1RFTVBMQVRFLlxuICAgICAgLy9cbiAgICAgIC8vIElmIHRoZSBjb21wb25lbnQgd2FzIHByZXZpb3VzbHkgaW4gdGhlIHRlc3RpbmcgbW9kdWxlJ3MgJ2RlY2xhcmF0aW9ucycgKG1lYW5pbmcgdGhlXG4gICAgICAvLyBjdXJyZW50IHZhbHVlIGlzIFRlc3RpbmdNb2R1bGVPdmVycmlkZS5ERUNMQVJBVElPTiksIHRoZW4gYG1vZHVsZVR5cGVgIGlzIHRoZSBjb21wb25lbnQnc1xuICAgICAgLy8gcmVhbCBtb2R1bGUsIHdoaWNoIHdhcyBpbXBvcnRlZC4gVGhpcyBwYXR0ZXJuIGlzIHVuZGVyc3Rvb2QgdG8gbWVhbiB0aGF0IHRoZSBjb21wb25lbnRcbiAgICAgIC8vIHNob3VsZCB1c2UgaXRzIG9yaWdpbmFsIHNjb3BlLCBidXQgdGhhdCB0aGUgdGVzdGluZyBtb2R1bGUgc2hvdWxkIGFsc28gY29udGFpbiB0aGVcbiAgICAgIC8vIGNvbXBvbmVudCBpbiBpdHMgc2NvcGUuXG4gICAgICBpZiAoXG4gICAgICAgICF0aGlzLmNvbXBvbmVudFRvTW9kdWxlU2NvcGUuaGFzKHR5cGUpIHx8XG4gICAgICAgIHRoaXMuY29tcG9uZW50VG9Nb2R1bGVTY29wZS5nZXQodHlwZSkgPT09IFRlc3RpbmdNb2R1bGVPdmVycmlkZS5ERUNMQVJBVElPTlxuICAgICAgKSB7XG4gICAgICAgIHRoaXMuY29tcG9uZW50VG9Nb2R1bGVTY29wZS5zZXQodHlwZSwgbW9kdWxlVHlwZSk7XG4gICAgICB9XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgZGlyZWN0aXZlID0gdGhpcy5yZXNvbHZlcnMuZGlyZWN0aXZlLnJlc29sdmUodHlwZSk7XG4gICAgaWYgKGRpcmVjdGl2ZSkge1xuICAgICAgaWYgKCF0eXBlLmhhc093blByb3BlcnR5KE5HX0RJUl9ERUYpKSB7XG4gICAgICAgIHRoaXMucGVuZGluZ0RpcmVjdGl2ZXMuYWRkKHR5cGUpO1xuICAgICAgfVxuICAgICAgdGhpcy5zZWVuRGlyZWN0aXZlcy5hZGQodHlwZSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgcGlwZSA9IHRoaXMucmVzb2x2ZXJzLnBpcGUucmVzb2x2ZSh0eXBlKTtcbiAgICBpZiAocGlwZSAmJiAhdHlwZS5oYXNPd25Qcm9wZXJ0eShOR19QSVBFX0RFRikpIHtcbiAgICAgIHRoaXMucGVuZGluZ1BpcGVzLmFkZCh0eXBlKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIHF1ZXVlVHlwZXNGcm9tTW9kdWxlc0FycmF5KGFycjogYW55W10pOiB2b2lkIHtcbiAgICAvLyBCZWNhdXNlIHdlIG1heSBlbmNvdW50ZXIgdGhlIHNhbWUgTmdNb2R1bGUgb3IgYSBzdGFuZGFsb25lIENvbXBvbmVudCB3aGlsZSBwcm9jZXNzaW5nXG4gICAgLy8gdGhlIGRlcGVuZGVuY2llcyBvZiBhbiBOZ01vZHVsZSBvciBhIHN0YW5kYWxvbmUgQ29tcG9uZW50LCB3ZSBjYWNoZSB0aGVtIGluIHRoaXMgc2V0IHNvIHdlXG4gICAgLy8gY2FuIHNraXAgb25lcyB0aGF0IGhhdmUgYWxyZWFkeSBiZWVuIHNlZW4gZW5jb3VudGVyZWQuIEluIHNvbWUgdGVzdCBzZXR1cHMsIHRoaXMgY2FjaGluZ1xuICAgIC8vIHJlc3VsdGVkIGluIDEwWCBydW50aW1lIGltcHJvdmVtZW50LlxuICAgIGNvbnN0IHByb2Nlc3NlZERlZnMgPSBuZXcgU2V0KCk7XG4gICAgY29uc3QgcXVldWVUeXBlc0Zyb21Nb2R1bGVzQXJyYXlSZWN1ciA9IChhcnI6IGFueVtdKTogdm9pZCA9PiB7XG4gICAgICBmb3IgKGNvbnN0IHZhbHVlIG9mIGFycikge1xuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHtcbiAgICAgICAgICBxdWV1ZVR5cGVzRnJvbU1vZHVsZXNBcnJheVJlY3VyKHZhbHVlKTtcbiAgICAgICAgfSBlbHNlIGlmIChoYXNOZ01vZHVsZURlZih2YWx1ZSkpIHtcbiAgICAgICAgICBjb25zdCBkZWYgPSB2YWx1ZS7JtW1vZDtcbiAgICAgICAgICBpZiAocHJvY2Vzc2VkRGVmcy5oYXMoZGVmKSkge1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgfVxuICAgICAgICAgIHByb2Nlc3NlZERlZnMuYWRkKGRlZik7XG4gICAgICAgICAgLy8gTG9vayB0aHJvdWdoIGRlY2xhcmF0aW9ucywgaW1wb3J0cywgYW5kIGV4cG9ydHMsIGFuZCBxdWV1ZVxuICAgICAgICAgIC8vIGV2ZXJ5dGhpbmcgZm91bmQgdGhlcmUuXG4gICAgICAgICAgdGhpcy5xdWV1ZVR5cGVBcnJheShtYXliZVVud3JhcEZuKGRlZi5kZWNsYXJhdGlvbnMpLCB2YWx1ZSk7XG4gICAgICAgICAgcXVldWVUeXBlc0Zyb21Nb2R1bGVzQXJyYXlSZWN1cihtYXliZVVud3JhcEZuKGRlZi5pbXBvcnRzKSk7XG4gICAgICAgICAgcXVldWVUeXBlc0Zyb21Nb2R1bGVzQXJyYXlSZWN1cihtYXliZVVud3JhcEZuKGRlZi5leHBvcnRzKSk7XG4gICAgICAgIH0gZWxzZSBpZiAoaXNNb2R1bGVXaXRoUHJvdmlkZXJzKHZhbHVlKSkge1xuICAgICAgICAgIHF1ZXVlVHlwZXNGcm9tTW9kdWxlc0FycmF5UmVjdXIoW3ZhbHVlLm5nTW9kdWxlXSk7XG4gICAgICAgIH0gZWxzZSBpZiAoaXNTdGFuZGFsb25lQ29tcG9uZW50KHZhbHVlKSkge1xuICAgICAgICAgIHRoaXMucXVldWVUeXBlKHZhbHVlLCBudWxsKTtcbiAgICAgICAgICBjb25zdCBkZWYgPSBnZXRDb21wb25lbnREZWYodmFsdWUpO1xuXG4gICAgICAgICAgaWYgKHByb2Nlc3NlZERlZnMuaGFzKGRlZikpIHtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgICBwcm9jZXNzZWREZWZzLmFkZChkZWYpO1xuXG4gICAgICAgICAgY29uc3QgZGVwZW5kZW5jaWVzID0gbWF5YmVVbndyYXBGbihkZWYuZGVwZW5kZW5jaWVzID8/IFtdKTtcbiAgICAgICAgICBkZXBlbmRlbmNpZXMuZm9yRWFjaCgoZGVwZW5kZW5jeSkgPT4ge1xuICAgICAgICAgICAgLy8gTm90ZTogaW4gQU9ULCB0aGUgYGRlcGVuZGVuY2llc2AgbWlnaHQgYWxzbyBjb250YWluIHJlZ3VsYXJcbiAgICAgICAgICAgIC8vIChOZ01vZHVsZS1iYXNlZCkgQ29tcG9uZW50LCBEaXJlY3RpdmUgYW5kIFBpcGVzLCBzbyB3ZSBoYW5kbGVcbiAgICAgICAgICAgIC8vIHRoZW0gc2VwYXJhdGVseSBhbmQgcHJvY2VlZCB3aXRoIHJlY3Vyc2l2ZSBwcm9jZXNzIGZvciBzdGFuZGFsb25lXG4gICAgICAgICAgICAvLyBDb21wb25lbnRzIGFuZCBOZ01vZHVsZXMgb25seS5cbiAgICAgICAgICAgIGlmIChpc1N0YW5kYWxvbmVDb21wb25lbnQoZGVwZW5kZW5jeSkgfHwgaGFzTmdNb2R1bGVEZWYoZGVwZW5kZW5jeSkpIHtcbiAgICAgICAgICAgICAgcXVldWVUeXBlc0Zyb21Nb2R1bGVzQXJyYXlSZWN1cihbZGVwZW5kZW5jeV0pO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgdGhpcy5xdWV1ZVR5cGUoZGVwZW5kZW5jeSwgbnVsbCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9O1xuICAgIHF1ZXVlVHlwZXNGcm9tTW9kdWxlc0FycmF5UmVjdXIoYXJyKTtcbiAgfVxuXG4gIC8vIFdoZW4gbW9kdWxlIG92ZXJyaWRlcyAodmlhIGBUZXN0QmVkLm92ZXJyaWRlTW9kdWxlYCkgYXJlIHByZXNlbnQsIGl0IG1pZ2h0IGFmZmVjdCBhbGwgbW9kdWxlc1xuICAvLyB0aGF0IGltcG9ydCAoZXZlbiB0cmFuc2l0aXZlbHkpIGFuIG92ZXJyaWRkZW4gb25lLiBGb3IgYWxsIGFmZmVjdGVkIG1vZHVsZXMgd2UgbmVlZCB0b1xuICAvLyByZWNhbGN1bGF0ZSB0aGVpciBzY29wZXMgZm9yIGEgZ2l2ZW4gdGVzdCBydW4gYW5kIHJlc3RvcmUgb3JpZ2luYWwgc2NvcGVzIGF0IHRoZSBlbmQuIFRoZSBnb2FsXG4gIC8vIG9mIHRoaXMgZnVuY3Rpb24gaXMgdG8gY29sbGVjdCBhbGwgYWZmZWN0ZWQgbW9kdWxlcyBpbiBhIHNldCBmb3IgZnVydGhlciBwcm9jZXNzaW5nLiBFeGFtcGxlOlxuICAvLyBpZiB3ZSBoYXZlIHRoZSBmb2xsb3dpbmcgbW9kdWxlIGhpZXJhcmNoeTogQSAtPiBCIC0+IEMgKHdoZXJlIGAtPmAgbWVhbnMgYGltcG9ydHNgKSBhbmQgbW9kdWxlXG4gIC8vIGBDYCBpcyBvdmVycmlkZGVuLCB3ZSBjb25zaWRlciBgQWAgYW5kIGBCYCBhcyBhZmZlY3RlZCwgc2luY2UgdGhlaXIgc2NvcGVzIG1pZ2h0IGJlY29tZVxuICAvLyBpbnZhbGlkYXRlZCB3aXRoIHRoZSBvdmVycmlkZS5cbiAgcHJpdmF0ZSBjb2xsZWN0TW9kdWxlc0FmZmVjdGVkQnlPdmVycmlkZXMoYXJyOiBhbnlbXSk6IFNldDxOZ01vZHVsZVR5cGU8YW55Pj4ge1xuICAgIGNvbnN0IHNlZW5Nb2R1bGVzID0gbmV3IFNldDxOZ01vZHVsZVR5cGU8YW55Pj4oKTtcbiAgICBjb25zdCBhZmZlY3RlZE1vZHVsZXMgPSBuZXcgU2V0PE5nTW9kdWxlVHlwZTxhbnk+PigpO1xuICAgIGNvbnN0IGNhbGNBZmZlY3RlZE1vZHVsZXNSZWN1ciA9IChhcnI6IGFueVtdLCBwYXRoOiBOZ01vZHVsZVR5cGU8YW55PltdKTogdm9pZCA9PiB7XG4gICAgICBmb3IgKGNvbnN0IHZhbHVlIG9mIGFycikge1xuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHtcbiAgICAgICAgICAvLyBJZiB0aGUgdmFsdWUgaXMgYW4gYXJyYXksIGp1c3QgZmxhdHRlbiBpdCAoYnkgaW52b2tpbmcgdGhpcyBmdW5jdGlvbiByZWN1cnNpdmVseSksXG4gICAgICAgICAgLy8ga2VlcGluZyBcInBhdGhcIiB0aGUgc2FtZS5cbiAgICAgICAgICBjYWxjQWZmZWN0ZWRNb2R1bGVzUmVjdXIodmFsdWUsIHBhdGgpO1xuICAgICAgICB9IGVsc2UgaWYgKGhhc05nTW9kdWxlRGVmKHZhbHVlKSkge1xuICAgICAgICAgIGlmIChzZWVuTW9kdWxlcy5oYXModmFsdWUpKSB7XG4gICAgICAgICAgICAvLyBJZiB3ZSd2ZSBzZWVuIHRoaXMgbW9kdWxlIGJlZm9yZSBhbmQgaXQncyBpbmNsdWRlZCBpbnRvIFwiYWZmZWN0ZWQgbW9kdWxlc1wiIGxpc3QsIG1hcmtcbiAgICAgICAgICAgIC8vIHRoZSB3aG9sZSBwYXRoIHRoYXQgbGVhZHMgdG8gdGhhdCBtb2R1bGUgYXMgYWZmZWN0ZWQsIGJ1dCBkbyBub3QgZGVzY2VuZCBpbnRvIGl0c1xuICAgICAgICAgICAgLy8gaW1wb3J0cywgc2luY2Ugd2UgYWxyZWFkeSBleGFtaW5lZCB0aGVtIGJlZm9yZS5cbiAgICAgICAgICAgIGlmIChhZmZlY3RlZE1vZHVsZXMuaGFzKHZhbHVlKSkge1xuICAgICAgICAgICAgICBwYXRoLmZvckVhY2goKGl0ZW0pID0+IGFmZmVjdGVkTW9kdWxlcy5hZGQoaXRlbSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgfVxuICAgICAgICAgIHNlZW5Nb2R1bGVzLmFkZCh2YWx1ZSk7XG4gICAgICAgICAgaWYgKHRoaXMub3ZlcnJpZGRlbk1vZHVsZXMuaGFzKHZhbHVlKSkge1xuICAgICAgICAgICAgcGF0aC5mb3JFYWNoKChpdGVtKSA9PiBhZmZlY3RlZE1vZHVsZXMuYWRkKGl0ZW0pKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgLy8gRXhhbWluZSBtb2R1bGUgaW1wb3J0cyByZWN1cnNpdmVseSB0byBsb29rIGZvciBvdmVycmlkZGVuIG1vZHVsZXMuXG4gICAgICAgICAgY29uc3QgbW9kdWxlRGVmID0gKHZhbHVlIGFzIGFueSlbTkdfTU9EX0RFRl07XG4gICAgICAgICAgY2FsY0FmZmVjdGVkTW9kdWxlc1JlY3VyKG1heWJlVW53cmFwRm4obW9kdWxlRGVmLmltcG9ydHMpLCBwYXRoLmNvbmNhdCh2YWx1ZSkpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfTtcbiAgICBjYWxjQWZmZWN0ZWRNb2R1bGVzUmVjdXIoYXJyLCBbXSk7XG4gICAgcmV0dXJuIGFmZmVjdGVkTW9kdWxlcztcbiAgfVxuXG4gIC8qKlxuICAgKiBQcmVzZXJ2ZSBhbiBvcmlnaW5hbCBkZWYgKHN1Y2ggYXMgybVtb2QsIMm1aW5qLCBldGMpIGJlZm9yZSBhcHBseWluZyBhbiBvdmVycmlkZS5cbiAgICogTm90ZTogb25lIGNsYXNzIG1heSBoYXZlIG11bHRpcGxlIGRlZnMgKGZvciBleGFtcGxlOiDJtW1vZCBhbmQgybVpbmogaW4gY2FzZSBvZlxuICAgKiBhbiBOZ01vZHVsZSkuIElmIHRoZXJlIGlzIGEgZGVmIGluIGEgc2V0IGFscmVhZHksIGRvbid0IG92ZXJyaWRlIGl0LCBzaW5jZVxuICAgKiBhbiBvcmlnaW5hbCBvbmUgc2hvdWxkIGJlIHJlc3RvcmVkIGF0IHRoZSBlbmQgb2YgYSB0ZXN0LlxuICAgKi9cbiAgcHJpdmF0ZSBtYXliZVN0b3JlTmdEZWYocHJvcDogc3RyaW5nLCB0eXBlOiBUeXBlPGFueT4pIHtcbiAgICBpZiAoIXRoaXMuaW5pdGlhbE5nRGVmcy5oYXModHlwZSkpIHtcbiAgICAgIHRoaXMuaW5pdGlhbE5nRGVmcy5zZXQodHlwZSwgbmV3IE1hcCgpKTtcbiAgICB9XG4gICAgY29uc3QgY3VycmVudERlZnMgPSB0aGlzLmluaXRpYWxOZ0RlZnMuZ2V0KHR5cGUpITtcbiAgICBpZiAoIWN1cnJlbnREZWZzLmhhcyhwcm9wKSkge1xuICAgICAgY29uc3QgY3VycmVudERlZiA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IodHlwZSwgcHJvcCk7XG4gICAgICBjdXJyZW50RGVmcy5zZXQocHJvcCwgY3VycmVudERlZik7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBzdG9yZUZpZWxkT2ZEZWZPblR5cGUodHlwZTogVHlwZTxhbnk+LCBkZWZGaWVsZDogc3RyaW5nLCBmaWVsZE5hbWU6IHN0cmluZyk6IHZvaWQge1xuICAgIGNvbnN0IGRlZjogYW55ID0gKHR5cGUgYXMgYW55KVtkZWZGaWVsZF07XG4gICAgY29uc3Qgb3JpZ2luYWxWYWx1ZTogYW55ID0gZGVmW2ZpZWxkTmFtZV07XG4gICAgdGhpcy5kZWZDbGVhbnVwT3BzLnB1c2goe29iamVjdDogZGVmLCBmaWVsZE5hbWUsIG9yaWdpbmFsVmFsdWV9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDbGVhcnMgY3VycmVudCBjb21wb25lbnRzIHJlc29sdXRpb24gcXVldWUsIGJ1dCBzdG9yZXMgdGhlIHN0YXRlIG9mIHRoZSBxdWV1ZSwgc28gd2UgY2FuXG4gICAqIHJlc3RvcmUgaXQgbGF0ZXIuIENsZWFyaW5nIHRoZSBxdWV1ZSBpcyByZXF1aXJlZCBiZWZvcmUgd2UgdHJ5IHRvIGNvbXBpbGUgY29tcG9uZW50cyAodmlhXG4gICAqIGBUZXN0QmVkLmNvbXBpbGVDb21wb25lbnRzYCksIHNvIHRoYXQgY29tcG9uZW50IGRlZnMgYXJlIGluIHN5bmMgd2l0aCB0aGUgcmVzb2x1dGlvbiBxdWV1ZS5cbiAgICovXG4gIHByaXZhdGUgY2xlYXJDb21wb25lbnRSZXNvbHV0aW9uUXVldWUoKSB7XG4gICAgaWYgKHRoaXMub3JpZ2luYWxDb21wb25lbnRSZXNvbHV0aW9uUXVldWUgPT09IG51bGwpIHtcbiAgICAgIHRoaXMub3JpZ2luYWxDb21wb25lbnRSZXNvbHV0aW9uUXVldWUgPSBuZXcgTWFwKCk7XG4gICAgfVxuICAgIMm1Y2xlYXJSZXNvbHV0aW9uT2ZDb21wb25lbnRSZXNvdXJjZXNRdWV1ZSgpLmZvckVhY2goKHZhbHVlLCBrZXkpID0+XG4gICAgICB0aGlzLm9yaWdpbmFsQ29tcG9uZW50UmVzb2x1dGlvblF1ZXVlIS5zZXQoa2V5LCB2YWx1ZSksXG4gICAgKTtcbiAgfVxuXG4gIC8qXG4gICAqIFJlc3RvcmVzIGNvbXBvbmVudCByZXNvbHV0aW9uIHF1ZXVlIHRvIHRoZSBwcmV2aW91c2x5IHNhdmVkIHN0YXRlLiBUaGlzIG9wZXJhdGlvbiBpcyBwZXJmb3JtZWRcbiAgICogYXMgYSBwYXJ0IG9mIHJlc3RvcmluZyB0aGUgc3RhdGUgYWZ0ZXIgY29tcGxldGlvbiBvZiB0aGUgY3VycmVudCBzZXQgb2YgdGVzdHMgKHRoYXQgbWlnaHRcbiAgICogcG90ZW50aWFsbHkgbXV0YXRlIHRoZSBzdGF0ZSkuXG4gICAqL1xuICBwcml2YXRlIHJlc3RvcmVDb21wb25lbnRSZXNvbHV0aW9uUXVldWUoKSB7XG4gICAgaWYgKHRoaXMub3JpZ2luYWxDb21wb25lbnRSZXNvbHV0aW9uUXVldWUgIT09IG51bGwpIHtcbiAgICAgIMm1cmVzdG9yZUNvbXBvbmVudFJlc29sdXRpb25RdWV1ZSh0aGlzLm9yaWdpbmFsQ29tcG9uZW50UmVzb2x1dGlvblF1ZXVlKTtcbiAgICAgIHRoaXMub3JpZ2luYWxDb21wb25lbnRSZXNvbHV0aW9uUXVldWUgPSBudWxsO1xuICAgIH1cbiAgfVxuXG4gIHJlc3RvcmVPcmlnaW5hbFN0YXRlKCk6IHZvaWQge1xuICAgIC8vIFByb2Nlc3MgY2xlYW51cCBvcHMgaW4gcmV2ZXJzZSBvcmRlciBzbyB0aGUgZmllbGQncyBvcmlnaW5hbCB2YWx1ZSBpcyByZXN0b3JlZCBjb3JyZWN0bHkgKGluXG4gICAgLy8gY2FzZSB0aGVyZSB3ZXJlIG11bHRpcGxlIG92ZXJyaWRlcyBmb3IgdGhlIHNhbWUgZmllbGQpLlxuICAgIGZvckVhY2hSaWdodCh0aGlzLmRlZkNsZWFudXBPcHMsIChvcDogQ2xlYW51cE9wZXJhdGlvbikgPT4ge1xuICAgICAgb3Aub2JqZWN0W29wLmZpZWxkTmFtZV0gPSBvcC5vcmlnaW5hbFZhbHVlO1xuICAgIH0pO1xuICAgIC8vIFJlc3RvcmUgaW5pdGlhbCBjb21wb25lbnQvZGlyZWN0aXZlL3BpcGUgZGVmc1xuICAgIHRoaXMuaW5pdGlhbE5nRGVmcy5mb3JFYWNoKFxuICAgICAgKGRlZnM6IE1hcDxzdHJpbmcsIFByb3BlcnR5RGVzY3JpcHRvciB8IHVuZGVmaW5lZD4sIHR5cGU6IFR5cGU8YW55PikgPT4ge1xuICAgICAgICBpZiAoVVNFX1JVTlRJTUVfREVQU19UUkFDS0VSX0ZPUl9KSVQpIHtcbiAgICAgICAgICBkZXBzVHJhY2tlci5jbGVhclNjb3BlQ2FjaGVGb3IodHlwZSk7XG4gICAgICAgIH1cbiAgICAgICAgZGVmcy5mb3JFYWNoKChkZXNjcmlwdG9yLCBwcm9wKSA9PiB7XG4gICAgICAgICAgaWYgKCFkZXNjcmlwdG9yKSB7XG4gICAgICAgICAgICAvLyBEZWxldGUgb3BlcmF0aW9ucyBhcmUgZ2VuZXJhbGx5IHVuZGVzaXJhYmxlIHNpbmNlIHRoZXkgaGF2ZSBwZXJmb3JtYW5jZVxuICAgICAgICAgICAgLy8gaW1wbGljYXRpb25zIG9uIG9iamVjdHMgdGhleSB3ZXJlIGFwcGxpZWQgdG8uIEluIHRoaXMgcGFydGljdWxhciBjYXNlLCBzaXR1YXRpb25zXG4gICAgICAgICAgICAvLyB3aGVyZSB0aGlzIGNvZGUgaXMgaW52b2tlZCBzaG91bGQgYmUgcXVpdGUgcmFyZSB0byBjYXVzZSBhbnkgbm90aWNlYWJsZSBpbXBhY3QsXG4gICAgICAgICAgICAvLyBzaW5jZSBpdCdzIGFwcGxpZWQgb25seSB0byBzb21lIHRlc3QgY2FzZXMgKGZvciBleGFtcGxlIHdoZW4gY2xhc3Mgd2l0aCBub1xuICAgICAgICAgICAgLy8gYW5ub3RhdGlvbnMgZXh0ZW5kcyBzb21lIEBDb21wb25lbnQpIHdoZW4gd2UgbmVlZCB0byBjbGVhciAnybVjbXAnIGZpZWxkIG9uIGEgZ2l2ZW5cbiAgICAgICAgICAgIC8vIGNsYXNzIHRvIHJlc3RvcmUgaXRzIG9yaWdpbmFsIHN0YXRlIChiZWZvcmUgYXBwbHlpbmcgb3ZlcnJpZGVzIGFuZCBydW5uaW5nIHRlc3RzKS5cbiAgICAgICAgICAgIGRlbGV0ZSAodHlwZSBhcyBhbnkpW3Byb3BdO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodHlwZSwgcHJvcCwgZGVzY3JpcHRvcik7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0sXG4gICAgKTtcbiAgICB0aGlzLmluaXRpYWxOZ0RlZnMuY2xlYXIoKTtcbiAgICB0aGlzLnNjb3Blc1dpdGhPdmVycmlkZGVuUHJvdmlkZXJzLmNsZWFyKCk7XG4gICAgdGhpcy5yZXN0b3JlQ29tcG9uZW50UmVzb2x1dGlvblF1ZXVlKCk7XG4gICAgLy8gUmVzdG9yZSB0aGUgbG9jYWxlIElEIHRvIHRoZSBkZWZhdWx0IHZhbHVlLCB0aGlzIHNob3VsZG4ndCBiZSBuZWNlc3NhcnkgYnV0IHdlIG5ldmVyIGtub3dcbiAgICBzZXRMb2NhbGVJZChERUZBVUxUX0xPQ0FMRV9JRCk7XG4gIH1cblxuICBwcml2YXRlIGNvbXBpbGVUZXN0TW9kdWxlKCk6IHZvaWQge1xuICAgIGNsYXNzIFJvb3RTY29wZU1vZHVsZSB7fVxuICAgIGNvbXBpbGVOZ01vZHVsZURlZnMoUm9vdFNjb3BlTW9kdWxlIGFzIE5nTW9kdWxlVHlwZTxhbnk+LCB7XG4gICAgICBwcm92aWRlcnM6IFtcbiAgICAgICAgLi4udGhpcy5yb290UHJvdmlkZXJPdmVycmlkZXMsXG4gICAgICAgIGludGVybmFsUHJvdmlkZVpvbmVDaGFuZ2VEZXRlY3Rpb24oe30pLFxuICAgICAgICBUZXN0QmVkQXBwbGljYXRpb25FcnJvckhhbmRsZXIsXG4gICAgICAgIHtcbiAgICAgICAgICBwcm92aWRlOiBJTlRFUk5BTF9BUFBMSUNBVElPTl9FUlJPUl9IQU5ETEVSLFxuICAgICAgICAgIHVzZUZhY3Rvcnk6ICgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGhhbmRsZXIgPSBpbmplY3QoVGVzdEJlZEFwcGxpY2F0aW9uRXJyb3JIYW5kbGVyKTtcbiAgICAgICAgICAgIHJldHVybiAoZTogdW5rbm93bikgPT4ge1xuICAgICAgICAgICAgICBoYW5kbGVyLmhhbmRsZUVycm9yKGUpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICB7cHJvdmlkZTogQ2hhbmdlRGV0ZWN0aW9uU2NoZWR1bGVyLCB1c2VFeGlzdGluZzogQ2hhbmdlRGV0ZWN0aW9uU2NoZWR1bGVySW1wbH0sXG4gICAgICBdLFxuICAgIH0pO1xuXG4gICAgY29uc3QgcHJvdmlkZXJzID0gW1xuICAgICAge3Byb3ZpZGU6IENvbXBpbGVyLCB1c2VGYWN0b3J5OiAoKSA9PiBuZXcgUjNUZXN0Q29tcGlsZXIodGhpcyl9LFxuICAgICAge3Byb3ZpZGU6IERFRkVSX0JMT0NLX0NPTkZJRywgdXNlVmFsdWU6IHtiZWhhdmlvcjogdGhpcy5kZWZlckJsb2NrQmVoYXZpb3J9fSxcbiAgICAgIC4uLnRoaXMucHJvdmlkZXJzLFxuICAgICAgLi4udGhpcy5wcm92aWRlck92ZXJyaWRlcyxcbiAgICBdO1xuICAgIGNvbnN0IGltcG9ydHMgPSBbUm9vdFNjb3BlTW9kdWxlLCB0aGlzLmFkZGl0aW9uYWxNb2R1bGVUeXBlcywgdGhpcy5pbXBvcnRzIHx8IFtdXTtcblxuICAgIGNvbXBpbGVOZ01vZHVsZURlZnMoXG4gICAgICB0aGlzLnRlc3RNb2R1bGVUeXBlLFxuICAgICAge1xuICAgICAgICBkZWNsYXJhdGlvbnM6IHRoaXMuZGVjbGFyYXRpb25zLFxuICAgICAgICBpbXBvcnRzLFxuICAgICAgICBzY2hlbWFzOiB0aGlzLnNjaGVtYXMsXG4gICAgICAgIHByb3ZpZGVycyxcbiAgICAgIH0sXG4gICAgICAvKiBhbGxvd0R1cGxpY2F0ZURlY2xhcmF0aW9uc0luUm9vdCAqLyB0cnVlLFxuICAgICk7XG5cbiAgICB0aGlzLmFwcGx5UHJvdmlkZXJPdmVycmlkZXNJblNjb3BlKHRoaXMudGVzdE1vZHVsZVR5cGUpO1xuICB9XG5cbiAgZ2V0IGluamVjdG9yKCk6IEluamVjdG9yIHtcbiAgICBpZiAodGhpcy5faW5qZWN0b3IgIT09IG51bGwpIHtcbiAgICAgIHJldHVybiB0aGlzLl9pbmplY3RvcjtcbiAgICB9XG5cbiAgICBjb25zdCBwcm92aWRlcnM6IFN0YXRpY1Byb3ZpZGVyW10gPSBbXTtcbiAgICBjb25zdCBjb21waWxlck9wdGlvbnMgPSB0aGlzLnBsYXRmb3JtLmluamVjdG9yLmdldChDT01QSUxFUl9PUFRJT05TKTtcbiAgICBjb21waWxlck9wdGlvbnMuZm9yRWFjaCgob3B0cykgPT4ge1xuICAgICAgaWYgKG9wdHMucHJvdmlkZXJzKSB7XG4gICAgICAgIHByb3ZpZGVycy5wdXNoKG9wdHMucHJvdmlkZXJzKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICBpZiAodGhpcy5jb21waWxlclByb3ZpZGVycyAhPT0gbnVsbCkge1xuICAgICAgcHJvdmlkZXJzLnB1c2goLi4uKHRoaXMuY29tcGlsZXJQcm92aWRlcnMgYXMgU3RhdGljUHJvdmlkZXJbXSkpO1xuICAgIH1cblxuICAgIHRoaXMuX2luamVjdG9yID0gSW5qZWN0b3IuY3JlYXRlKHtwcm92aWRlcnMsIHBhcmVudDogdGhpcy5wbGF0Zm9ybS5pbmplY3Rvcn0pO1xuICAgIHJldHVybiB0aGlzLl9pbmplY3RvcjtcbiAgfVxuXG4gIC8vIGdldCBvdmVycmlkZXMgZm9yIGEgc3BlY2lmaWMgcHJvdmlkZXIgKGlmIGFueSlcbiAgcHJpdmF0ZSBnZXRTaW5nbGVQcm92aWRlck92ZXJyaWRlcyhwcm92aWRlcjogUHJvdmlkZXIpOiBQcm92aWRlciB8IG51bGwge1xuICAgIGNvbnN0IHRva2VuID0gZ2V0UHJvdmlkZXJUb2tlbihwcm92aWRlcik7XG4gICAgcmV0dXJuIHRoaXMucHJvdmlkZXJPdmVycmlkZXNCeVRva2VuLmdldCh0b2tlbikgfHwgbnVsbDtcbiAgfVxuXG4gIHByaXZhdGUgZ2V0UHJvdmlkZXJPdmVycmlkZXMoXG4gICAgcHJvdmlkZXJzPzogQXJyYXk8UHJvdmlkZXIgfCBJbnRlcm5hbEVudmlyb25tZW50UHJvdmlkZXJzPixcbiAgKTogUHJvdmlkZXJbXSB7XG4gICAgaWYgKCFwcm92aWRlcnMgfHwgIXByb3ZpZGVycy5sZW5ndGggfHwgdGhpcy5wcm92aWRlck92ZXJyaWRlc0J5VG9rZW4uc2l6ZSA9PT0gMCkgcmV0dXJuIFtdO1xuICAgIC8vIFRoZXJlIGFyZSB0d28gZmxhdHRlbmluZyBvcGVyYXRpb25zIGhlcmUuIFRoZSBpbm5lciBmbGF0dGVuUHJvdmlkZXJzKCkgb3BlcmF0ZXMgb24gdGhlXG4gICAgLy8gbWV0YWRhdGEncyBwcm92aWRlcnMgYW5kIGFwcGxpZXMgYSBtYXBwaW5nIGZ1bmN0aW9uIHdoaWNoIHJldHJpZXZlcyBvdmVycmlkZXMgZm9yIGVhY2hcbiAgICAvLyBpbmNvbWluZyBwcm92aWRlci4gVGhlIG91dGVyIGZsYXR0ZW4oKSB0aGVuIGZsYXR0ZW5zIHRoZSBwcm9kdWNlZCBvdmVycmlkZXMgYXJyYXkuIElmIHRoaXMgaXNcbiAgICAvLyBub3QgZG9uZSwgdGhlIGFycmF5IGNhbiBjb250YWluIG90aGVyIGVtcHR5IGFycmF5cyAoZS5nLiBgW1tdLCBbXV1gKSB3aGljaCBsZWFrIGludG8gdGhlXG4gICAgLy8gcHJvdmlkZXJzIGFycmF5IGFuZCBjb250YW1pbmF0ZSBhbnkgZXJyb3IgbWVzc2FnZXMgdGhhdCBtaWdodCBiZSBnZW5lcmF0ZWQuXG4gICAgcmV0dXJuIGZsYXR0ZW4oXG4gICAgICBmbGF0dGVuUHJvdmlkZXJzKFxuICAgICAgICBwcm92aWRlcnMsXG4gICAgICAgIChwcm92aWRlcjogUHJvdmlkZXIpID0+IHRoaXMuZ2V0U2luZ2xlUHJvdmlkZXJPdmVycmlkZXMocHJvdmlkZXIpIHx8IFtdLFxuICAgICAgKSxcbiAgICApO1xuICB9XG5cbiAgcHJpdmF0ZSBnZXRPdmVycmlkZGVuUHJvdmlkZXJzKFxuICAgIHByb3ZpZGVycz86IEFycmF5PFByb3ZpZGVyIHwgSW50ZXJuYWxFbnZpcm9ubWVudFByb3ZpZGVycz4sXG4gICk6IFByb3ZpZGVyW10ge1xuICAgIGlmICghcHJvdmlkZXJzIHx8ICFwcm92aWRlcnMubGVuZ3RoIHx8IHRoaXMucHJvdmlkZXJPdmVycmlkZXNCeVRva2VuLnNpemUgPT09IDApIHJldHVybiBbXTtcblxuICAgIGNvbnN0IGZsYXR0ZW5lZFByb3ZpZGVycyA9IGZsYXR0ZW5Qcm92aWRlcnMocHJvdmlkZXJzKTtcbiAgICBjb25zdCBvdmVycmlkZXMgPSB0aGlzLmdldFByb3ZpZGVyT3ZlcnJpZGVzKGZsYXR0ZW5lZFByb3ZpZGVycyk7XG4gICAgY29uc3Qgb3ZlcnJpZGRlblByb3ZpZGVycyA9IFsuLi5mbGF0dGVuZWRQcm92aWRlcnMsIC4uLm92ZXJyaWRlc107XG4gICAgY29uc3QgZmluYWw6IFByb3ZpZGVyW10gPSBbXTtcbiAgICBjb25zdCBzZWVuT3ZlcnJpZGRlblByb3ZpZGVycyA9IG5ldyBTZXQ8UHJvdmlkZXI+KCk7XG5cbiAgICAvLyBXZSBpdGVyYXRlIHRocm91Z2ggdGhlIGxpc3Qgb2YgcHJvdmlkZXJzIGluIHJldmVyc2Ugb3JkZXIgdG8gbWFrZSBzdXJlIHByb3ZpZGVyIG92ZXJyaWRlc1xuICAgIC8vIHRha2UgcHJlY2VkZW5jZSBvdmVyIHRoZSB2YWx1ZXMgZGVmaW5lZCBpbiBwcm92aWRlciBsaXN0LiBXZSBhbHNvIGZpbHRlciBvdXQgYWxsIHByb3ZpZGVyc1xuICAgIC8vIHRoYXQgaGF2ZSBvdmVycmlkZXMsIGtlZXBpbmcgb3ZlcnJpZGRlbiB2YWx1ZXMgb25seS4gVGhpcyBpcyBuZWVkZWQsIHNpbmNlIHByZXNlbmNlIG9mIGFcbiAgICAvLyBwcm92aWRlciB3aXRoIGBuZ09uRGVzdHJveWAgaG9vayB3aWxsIGNhdXNlIHRoaXMgaG9vayB0byBiZSByZWdpc3RlcmVkIGFuZCBpbnZva2VkIGxhdGVyLlxuICAgIGZvckVhY2hSaWdodChvdmVycmlkZGVuUHJvdmlkZXJzLCAocHJvdmlkZXI6IGFueSkgPT4ge1xuICAgICAgY29uc3QgdG9rZW46IGFueSA9IGdldFByb3ZpZGVyVG9rZW4ocHJvdmlkZXIpO1xuICAgICAgaWYgKHRoaXMucHJvdmlkZXJPdmVycmlkZXNCeVRva2VuLmhhcyh0b2tlbikpIHtcbiAgICAgICAgaWYgKCFzZWVuT3ZlcnJpZGRlblByb3ZpZGVycy5oYXModG9rZW4pKSB7XG4gICAgICAgICAgc2Vlbk92ZXJyaWRkZW5Qcm92aWRlcnMuYWRkKHRva2VuKTtcbiAgICAgICAgICAvLyBUcmVhdCBhbGwgb3ZlcnJpZGRlbiBwcm92aWRlcnMgYXMgYHttdWx0aTogZmFsc2V9YCAoZXZlbiBpZiBpdCdzIGEgbXVsdGktcHJvdmlkZXIpIHRvXG4gICAgICAgICAgLy8gbWFrZSBzdXJlIHRoYXQgcHJvdmlkZWQgb3ZlcnJpZGUgdGFrZXMgaGlnaGVzdCBwcmVjZWRlbmNlIGFuZCBpcyBub3QgY29tYmluZWQgd2l0aFxuICAgICAgICAgIC8vIG90aGVyIGluc3RhbmNlcyBvZiB0aGUgc2FtZSBtdWx0aSBwcm92aWRlci5cbiAgICAgICAgICBmaW5hbC51bnNoaWZ0KHsuLi5wcm92aWRlciwgbXVsdGk6IGZhbHNlfSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGZpbmFsLnVuc2hpZnQocHJvdmlkZXIpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiBmaW5hbDtcbiAgfVxuXG4gIHByaXZhdGUgaGFzUHJvdmlkZXJPdmVycmlkZXMoXG4gICAgcHJvdmlkZXJzPzogQXJyYXk8UHJvdmlkZXIgfCBJbnRlcm5hbEVudmlyb25tZW50UHJvdmlkZXJzPixcbiAgKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0UHJvdmlkZXJPdmVycmlkZXMocHJvdmlkZXJzKS5sZW5ndGggPiAwO1xuICB9XG5cbiAgcHJpdmF0ZSBwYXRjaERlZldpdGhQcm92aWRlck92ZXJyaWRlcyhkZWNsYXJhdGlvbjogVHlwZTxhbnk+LCBmaWVsZDogc3RyaW5nKTogdm9pZCB7XG4gICAgY29uc3QgZGVmID0gKGRlY2xhcmF0aW9uIGFzIGFueSlbZmllbGRdO1xuICAgIGlmIChkZWYgJiYgZGVmLnByb3ZpZGVyc1Jlc29sdmVyKSB7XG4gICAgICB0aGlzLm1heWJlU3RvcmVOZ0RlZihmaWVsZCwgZGVjbGFyYXRpb24pO1xuXG4gICAgICBjb25zdCByZXNvbHZlciA9IGRlZi5wcm92aWRlcnNSZXNvbHZlcjtcbiAgICAgIGNvbnN0IHByb2Nlc3NQcm92aWRlcnNGbiA9IChwcm92aWRlcnM6IFByb3ZpZGVyW10pID0+IHRoaXMuZ2V0T3ZlcnJpZGRlblByb3ZpZGVycyhwcm92aWRlcnMpO1xuICAgICAgdGhpcy5zdG9yZUZpZWxkT2ZEZWZPblR5cGUoZGVjbGFyYXRpb24sIGZpZWxkLCAncHJvdmlkZXJzUmVzb2x2ZXInKTtcbiAgICAgIGRlZi5wcm92aWRlcnNSZXNvbHZlciA9IChuZ0RlZjogRGlyZWN0aXZlRGVmPGFueT4pID0+IHJlc29sdmVyKG5nRGVmLCBwcm9jZXNzUHJvdmlkZXJzRm4pO1xuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBpbml0UmVzb2x2ZXJzKCk6IFJlc29sdmVycyB7XG4gIHJldHVybiB7XG4gICAgbW9kdWxlOiBuZXcgTmdNb2R1bGVSZXNvbHZlcigpLFxuICAgIGNvbXBvbmVudDogbmV3IENvbXBvbmVudFJlc29sdmVyKCksXG4gICAgZGlyZWN0aXZlOiBuZXcgRGlyZWN0aXZlUmVzb2x2ZXIoKSxcbiAgICBwaXBlOiBuZXcgUGlwZVJlc29sdmVyKCksXG4gIH07XG59XG5cbmZ1bmN0aW9uIGlzU3RhbmRhbG9uZUNvbXBvbmVudDxUPih2YWx1ZTogVHlwZTxUPik6IHZhbHVlIGlzIENvbXBvbmVudFR5cGU8VD4ge1xuICBjb25zdCBkZWYgPSBnZXRDb21wb25lbnREZWYodmFsdWUpO1xuICByZXR1cm4gISFkZWY/LnN0YW5kYWxvbmU7XG59XG5cbmZ1bmN0aW9uIGdldENvbXBvbmVudERlZih2YWx1ZTogQ29tcG9uZW50VHlwZTx1bmtub3duPik6IENvbXBvbmVudERlZjx1bmtub3duPjtcbmZ1bmN0aW9uIGdldENvbXBvbmVudERlZih2YWx1ZTogVHlwZTx1bmtub3duPik6IENvbXBvbmVudERlZjx1bmtub3duPiB8IG51bGw7XG5mdW5jdGlvbiBnZXRDb21wb25lbnREZWYodmFsdWU6IFR5cGU8dW5rbm93bj4pOiBDb21wb25lbnREZWY8dW5rbm93bj4gfCBudWxsIHtcbiAgcmV0dXJuICh2YWx1ZSBhcyBhbnkpLsm1Y21wID8/IG51bGw7XG59XG5cbmZ1bmN0aW9uIGhhc05nTW9kdWxlRGVmPFQ+KHZhbHVlOiBUeXBlPFQ+KTogdmFsdWUgaXMgTmdNb2R1bGVUeXBlPFQ+IHtcbiAgcmV0dXJuIHZhbHVlLmhhc093blByb3BlcnR5KCfJtW1vZCcpO1xufVxuXG5mdW5jdGlvbiBpc05nTW9kdWxlPFQ+KHZhbHVlOiBUeXBlPFQ+KTogYm9vbGVhbiB7XG4gIHJldHVybiBoYXNOZ01vZHVsZURlZih2YWx1ZSk7XG59XG5cbmZ1bmN0aW9uIG1heWJlVW53cmFwRm48VD4obWF5YmVGbjogKCgpID0+IFQpIHwgVCk6IFQge1xuICByZXR1cm4gbWF5YmVGbiBpbnN0YW5jZW9mIEZ1bmN0aW9uID8gbWF5YmVGbigpIDogbWF5YmVGbjtcbn1cblxuZnVuY3Rpb24gZmxhdHRlbjxUPih2YWx1ZXM6IGFueVtdKTogVFtdIHtcbiAgY29uc3Qgb3V0OiBUW10gPSBbXTtcbiAgdmFsdWVzLmZvckVhY2goKHZhbHVlKSA9PiB7XG4gICAgaWYgKEFycmF5LmlzQXJyYXkodmFsdWUpKSB7XG4gICAgICBvdXQucHVzaCguLi5mbGF0dGVuPFQ+KHZhbHVlKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG91dC5wdXNoKHZhbHVlKTtcbiAgICB9XG4gIH0pO1xuICByZXR1cm4gb3V0O1xufVxuXG5mdW5jdGlvbiBpZGVudGl0eUZuPFQ+KHZhbHVlOiBUKTogVCB7XG4gIHJldHVybiB2YWx1ZTtcbn1cblxuZnVuY3Rpb24gZmxhdHRlblByb3ZpZGVyczxUPihcbiAgcHJvdmlkZXJzOiBBcnJheTxQcm92aWRlciB8IEludGVybmFsRW52aXJvbm1lbnRQcm92aWRlcnM+LFxuICBtYXBGbjogKHByb3ZpZGVyOiBQcm92aWRlcikgPT4gVCxcbik6IFRbXTtcbmZ1bmN0aW9uIGZsYXR0ZW5Qcm92aWRlcnMocHJvdmlkZXJzOiBBcnJheTxQcm92aWRlciB8IEludGVybmFsRW52aXJvbm1lbnRQcm92aWRlcnM+KTogUHJvdmlkZXJbXTtcbmZ1bmN0aW9uIGZsYXR0ZW5Qcm92aWRlcnMoXG4gIHByb3ZpZGVyczogQXJyYXk8UHJvdmlkZXIgfCBJbnRlcm5hbEVudmlyb25tZW50UHJvdmlkZXJzPixcbiAgbWFwRm46IChwcm92aWRlcjogUHJvdmlkZXIpID0+IGFueSA9IGlkZW50aXR5Rm4sXG4pOiBhbnlbXSB7XG4gIGNvbnN0IG91dDogYW55W10gPSBbXTtcbiAgZm9yIChsZXQgcHJvdmlkZXIgb2YgcHJvdmlkZXJzKSB7XG4gICAgaWYgKGlzRW52aXJvbm1lbnRQcm92aWRlcnMocHJvdmlkZXIpKSB7XG4gICAgICBwcm92aWRlciA9IHByb3ZpZGVyLsm1cHJvdmlkZXJzO1xuICAgIH1cbiAgICBpZiAoQXJyYXkuaXNBcnJheShwcm92aWRlcikpIHtcbiAgICAgIG91dC5wdXNoKC4uLmZsYXR0ZW5Qcm92aWRlcnMocHJvdmlkZXIsIG1hcEZuKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG91dC5wdXNoKG1hcEZuKHByb3ZpZGVyKSk7XG4gICAgfVxuICB9XG4gIHJldHVybiBvdXQ7XG59XG5cbmZ1bmN0aW9uIGdldFByb3ZpZGVyRmllbGQocHJvdmlkZXI6IFByb3ZpZGVyLCBmaWVsZDogc3RyaW5nKSB7XG4gIHJldHVybiBwcm92aWRlciAmJiB0eXBlb2YgcHJvdmlkZXIgPT09ICdvYmplY3QnICYmIChwcm92aWRlciBhcyBhbnkpW2ZpZWxkXTtcbn1cblxuZnVuY3Rpb24gZ2V0UHJvdmlkZXJUb2tlbihwcm92aWRlcjogUHJvdmlkZXIpIHtcbiAgcmV0dXJuIGdldFByb3ZpZGVyRmllbGQocHJvdmlkZXIsICdwcm92aWRlJykgfHwgcHJvdmlkZXI7XG59XG5cbmZ1bmN0aW9uIGlzTW9kdWxlV2l0aFByb3ZpZGVycyh2YWx1ZTogYW55KTogdmFsdWUgaXMgTW9kdWxlV2l0aFByb3ZpZGVyczxhbnk+IHtcbiAgcmV0dXJuIHZhbHVlLmhhc093blByb3BlcnR5KCduZ01vZHVsZScpO1xufVxuXG5mdW5jdGlvbiBmb3JFYWNoUmlnaHQ8VD4odmFsdWVzOiBUW10sIGZuOiAodmFsdWU6IFQsIGlkeDogbnVtYmVyKSA9PiB2b2lkKTogdm9pZCB7XG4gIGZvciAobGV0IGlkeCA9IHZhbHVlcy5sZW5ndGggLSAxOyBpZHggPj0gMDsgaWR4LS0pIHtcbiAgICBmbih2YWx1ZXNbaWR4XSwgaWR4KTtcbiAgfVxufVxuXG5mdW5jdGlvbiBpbnZhbGlkVHlwZUVycm9yKG5hbWU6IHN0cmluZywgZXhwZWN0ZWRUeXBlOiBzdHJpbmcpOiBFcnJvciB7XG4gIHJldHVybiBuZXcgRXJyb3IoYCR7bmFtZX0gY2xhc3MgZG9lc24ndCBoYXZlIEAke2V4cGVjdGVkVHlwZX0gZGVjb3JhdG9yIG9yIGlzIG1pc3NpbmcgbWV0YWRhdGEuYCk7XG59XG5cbmNsYXNzIFIzVGVzdENvbXBpbGVyIGltcGxlbWVudHMgQ29tcGlsZXIge1xuICBjb25zdHJ1Y3Rvcihwcml2YXRlIHRlc3RCZWQ6IFRlc3RCZWRDb21waWxlcikge31cblxuICBjb21waWxlTW9kdWxlU3luYzxUPihtb2R1bGVUeXBlOiBUeXBlPFQ+KTogTmdNb2R1bGVGYWN0b3J5PFQ+IHtcbiAgICB0aGlzLnRlc3RCZWQuX2NvbXBpbGVOZ01vZHVsZVN5bmMobW9kdWxlVHlwZSk7XG4gICAgcmV0dXJuIG5ldyBSM05nTW9kdWxlRmFjdG9yeShtb2R1bGVUeXBlKTtcbiAgfVxuXG4gIGFzeW5jIGNvbXBpbGVNb2R1bGVBc3luYzxUPihtb2R1bGVUeXBlOiBUeXBlPFQ+KTogUHJvbWlzZTxOZ01vZHVsZUZhY3Rvcnk8VD4+IHtcbiAgICBhd2FpdCB0aGlzLnRlc3RCZWQuX2NvbXBpbGVOZ01vZHVsZUFzeW5jKG1vZHVsZVR5cGUpO1xuICAgIHJldHVybiBuZXcgUjNOZ01vZHVsZUZhY3RvcnkobW9kdWxlVHlwZSk7XG4gIH1cblxuICBjb21waWxlTW9kdWxlQW5kQWxsQ29tcG9uZW50c1N5bmM8VD4obW9kdWxlVHlwZTogVHlwZTxUPik6IE1vZHVsZVdpdGhDb21wb25lbnRGYWN0b3JpZXM8VD4ge1xuICAgIGNvbnN0IG5nTW9kdWxlRmFjdG9yeSA9IHRoaXMuY29tcGlsZU1vZHVsZVN5bmMobW9kdWxlVHlwZSk7XG4gICAgY29uc3QgY29tcG9uZW50RmFjdG9yaWVzID0gdGhpcy50ZXN0QmVkLl9nZXRDb21wb25lbnRGYWN0b3JpZXMobW9kdWxlVHlwZSBhcyBOZ01vZHVsZVR5cGU8VD4pO1xuICAgIHJldHVybiBuZXcgTW9kdWxlV2l0aENvbXBvbmVudEZhY3RvcmllcyhuZ01vZHVsZUZhY3RvcnksIGNvbXBvbmVudEZhY3Rvcmllcyk7XG4gIH1cblxuICBhc3luYyBjb21waWxlTW9kdWxlQW5kQWxsQ29tcG9uZW50c0FzeW5jPFQ+KFxuICAgIG1vZHVsZVR5cGU6IFR5cGU8VD4sXG4gICk6IFByb21pc2U8TW9kdWxlV2l0aENvbXBvbmVudEZhY3RvcmllczxUPj4ge1xuICAgIGNvbnN0IG5nTW9kdWxlRmFjdG9yeSA9IGF3YWl0IHRoaXMuY29tcGlsZU1vZHVsZUFzeW5jKG1vZHVsZVR5cGUpO1xuICAgIGNvbnN0IGNvbXBvbmVudEZhY3RvcmllcyA9IHRoaXMudGVzdEJlZC5fZ2V0Q29tcG9uZW50RmFjdG9yaWVzKG1vZHVsZVR5cGUgYXMgTmdNb2R1bGVUeXBlPFQ+KTtcbiAgICByZXR1cm4gbmV3IE1vZHVsZVdpdGhDb21wb25lbnRGYWN0b3JpZXMobmdNb2R1bGVGYWN0b3J5LCBjb21wb25lbnRGYWN0b3JpZXMpO1xuICB9XG5cbiAgY2xlYXJDYWNoZSgpOiB2b2lkIHt9XG5cbiAgY2xlYXJDYWNoZUZvcih0eXBlOiBUeXBlPGFueT4pOiB2b2lkIHt9XG5cbiAgZ2V0TW9kdWxlSWQobW9kdWxlVHlwZTogVHlwZTxhbnk+KTogc3RyaW5nIHwgdW5kZWZpbmVkIHtcbiAgICBjb25zdCBtZXRhID0gdGhpcy50ZXN0QmVkLl9nZXRNb2R1bGVSZXNvbHZlcigpLnJlc29sdmUobW9kdWxlVHlwZSk7XG4gICAgcmV0dXJuIChtZXRhICYmIG1ldGEuaWQpIHx8IHVuZGVmaW5lZDtcbiAgfVxufVxuIl19