/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ResourceLoader } from '@angular/compiler';
import { ApplicationInitStatus, ɵINTERNAL_APPLICATION_ERROR_HANDLER as INTERNAL_APPLICATION_ERROR_HANDLER, ɵChangeDetectionScheduler as ChangeDetectionScheduler, ɵChangeDetectionSchedulerImpl as ChangeDetectionSchedulerImpl, Compiler, COMPILER_OPTIONS, Injector, inject, LOCALE_ID, ModuleWithComponentFactories, ɵZONELESS_ENABLED as ZONELESS_ENABLED, resolveForwardRef, ɵclearResolutionOfComponentResourcesQueue, ɵcompileComponent as compileComponent, ɵcompileDirective as compileDirective, ɵcompileNgModuleDefs as compileNgModuleDefs, ɵcompilePipe as compilePipe, ɵDEFAULT_LOCALE_ID as DEFAULT_LOCALE_ID, ɵDEFER_BLOCK_CONFIG as DEFER_BLOCK_CONFIG, ɵdepsTracker as depsTracker, ɵgenerateStandaloneInDeclarationsError, ɵgetAsyncClassMetadataFn as getAsyncClassMetadataFn, ɵgetInjectableDef as getInjectableDef, ɵinternalProvideZoneChangeDetection as internalProvideZoneChangeDetection, ɵisComponentDefPendingResolution, ɵisEnvironmentProviders as isEnvironmentProviders, ɵNG_COMP_DEF as NG_COMP_DEF, ɵNG_DIR_DEF as NG_DIR_DEF, ɵNG_INJ_DEF as NG_INJ_DEF, ɵNG_MOD_DEF as NG_MOD_DEF, ɵNG_PIPE_DEF as NG_PIPE_DEF, ɵNgModuleFactory as R3NgModuleFactory, ɵpatchComponentDefWithScope as patchComponentDefWithScope, ɵRender3ComponentFactory as ComponentFactory, ɵRender3NgModuleRef as NgModuleRef, ɵresolveComponentResources, ɵrestoreComponentResolutionQueue, ɵsetLocaleId as setLocaleId, ɵtransitiveScopesFor as transitiveScopesFor, ɵUSE_RUNTIME_DEPS_TRACKER_FOR_JIT as USE_RUNTIME_DEPS_TRACKER_FOR_JIT, NgZone, ErrorHandler, } from '@angular/core';
import { ComponentResolver, DirectiveResolver, NgModuleResolver, PipeResolver, } from './resolvers';
import { DEFER_BLOCK_DEFAULT_BEHAVIOR } from './test_bed_common';
import { RETHROW_APPLICATION_ERRORS, TestBedApplicationErrorHandler, } from './application_error_handler';
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
        this.providers.push({
            provide: RETHROW_APPLICATION_ERRORS,
            useValue: moduleDef._rethrowApplicationTickErrors ?? false,
        });
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
                        if (inject(ZONELESS_ENABLED) || inject(RETHROW_APPLICATION_ERRORS, { optional: true })) {
                            const handler = inject(TestBedApplicationErrorHandler);
                            return (e) => {
                                handler.handleError(e);
                            };
                        }
                        else {
                            const userErrorHandler = inject(ErrorHandler);
                            const ngZone = inject(NgZone);
                            return (e) => ngZone.runOutsideAngular(() => userErrorHandler.handleError(e));
                        }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdF9iZWRfY29tcGlsZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3Rlc3Rpbmcvc3JjL3Rlc3RfYmVkX2NvbXBpbGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUNqRCxPQUFPLEVBQ0wscUJBQXFCLEVBQ3JCLG1DQUFtQyxJQUFJLGtDQUFrQyxFQUN6RSx5QkFBeUIsSUFBSSx3QkFBd0IsRUFDckQsNkJBQTZCLElBQUksNEJBQTRCLEVBQzdELFFBQVEsRUFDUixnQkFBZ0IsRUFHaEIsUUFBUSxFQUNSLE1BQU0sRUFFTixTQUFTLEVBQ1QsNEJBQTRCLEVBRTVCLGlCQUFpQixJQUFJLGdCQUFnQixFQU1yQyxpQkFBaUIsRUFHakIseUNBQXlDLEVBQ3pDLGlCQUFpQixJQUFJLGdCQUFnQixFQUNyQyxpQkFBaUIsSUFBSSxnQkFBZ0IsRUFDckMsb0JBQW9CLElBQUksbUJBQW1CLEVBQzNDLFlBQVksSUFBSSxXQUFXLEVBQzNCLGtCQUFrQixJQUFJLGlCQUFpQixFQUN2QyxtQkFBbUIsSUFBSSxrQkFBa0IsRUFDekMsWUFBWSxJQUFJLFdBQVcsRUFFM0Isc0NBQXNDLEVBQ3RDLHdCQUF3QixJQUFJLHVCQUF1QixFQUNuRCxpQkFBaUIsSUFBSSxnQkFBZ0IsRUFFckMsbUNBQW1DLElBQUksa0NBQWtDLEVBQ3pFLGdDQUFnQyxFQUNoQyx1QkFBdUIsSUFBSSxzQkFBc0IsRUFDakQsWUFBWSxJQUFJLFdBQVcsRUFDM0IsV0FBVyxJQUFJLFVBQVUsRUFDekIsV0FBVyxJQUFJLFVBQVUsRUFDekIsV0FBVyxJQUFJLFVBQVUsRUFDekIsWUFBWSxJQUFJLFdBQVcsRUFDM0IsZ0JBQWdCLElBQUksaUJBQWlCLEVBR3JDLDJCQUEyQixJQUFJLDBCQUEwQixFQUN6RCx3QkFBd0IsSUFB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S0FBVSxDQUFDO0lBRXJCLGFBQWEsQ0FBQyxJQUFlLElBQVMsQ0FBQztJQUV2QyxXQUFXLENBQUMsVUFBcUI7UUFDL0IsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxrQkFBa0IsRUFBRSxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUNuRSxPQUFPLENBQUMsSUFBSSxJQUFJLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxTQUFTLENBQUM7SUFDeEMsQ0FBQztDQUNGIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7UmVzb3VyY2VMb2FkZXJ9IGZyb20gJ0Bhbmd1bGFyL2NvbXBpbGVyJztcbmltcG9ydCB7XG4gIEFwcGxpY2F0aW9uSW5pdFN0YXR1cyxcbiAgybVJTlRFUk5BTF9BUFBMSUNBVElPTl9FUlJPUl9IQU5ETEVSIGFzIElOVEVSTkFMX0FQUExJQ0FUSU9OX0VSUk9SX0hBTkRMRVIsXG4gIMm1Q2hhbmdlRGV0ZWN0aW9uU2NoZWR1bGVyIGFzIENoYW5nZURldGVjdGlvblNjaGVkdWxlcixcbiAgybVDaGFuZ2VEZXRlY3Rpb25TY2hlZHVsZXJJbXBsIGFzIENoYW5nZURldGVjdGlvblNjaGVkdWxlckltcGwsXG4gIENvbXBpbGVyLFxuICBDT01QSUxFUl9PUFRJT05TLFxuICBDb21wb25lbnQsXG4gIERpcmVjdGl2ZSxcbiAgSW5qZWN0b3IsXG4gIGluamVjdCxcbiAgSW5qZWN0b3JUeXBlLFxuICBMT0NBTEVfSUQsXG4gIE1vZHVsZVdpdGhDb21wb25lbnRGYWN0b3JpZXMsXG4gIE1vZHVsZVdpdGhQcm92aWRlcnMsXG4gIMm1Wk9ORUxFU1NfRU5BQkxFRCBhcyBaT05FTEVTU19FTkFCTEVELFxuICBOZ01vZHVsZSxcbiAgTmdNb2R1bGVGYWN0b3J5LFxuICBQaXBlLFxuICBQbGF0Zm9ybVJlZixcbiAgUHJvdmlkZXIsXG4gIHJlc29sdmVGb3J3YXJkUmVmLFxuICBTdGF0aWNQcm92aWRlcixcbiAgVHlwZSxcbiAgybVjbGVhclJlc29sdXRpb25PZkNvbXBvbmVudFJlc291cmNlc1F1ZXVlLFxuICDJtWNvbXBpbGVDb21wb25lbnQgYXMgY29tcGlsZUNvbXBvbmVudCxcbiAgybVjb21waWxlRGlyZWN0aXZlIGFzIGNvbXBpbGVEaXJlY3RpdmUsXG4gIMm1Y29tcGlsZU5nTW9kdWxlRGVmcyBhcyBjb21waWxlTmdNb2R1bGVEZWZzLFxuICDJtWNvbXBpbGVQaXBlIGFzIGNvbXBpbGVQaXBlLFxuICDJtURFRkFVTFRfTE9DQUxFX0lEIGFzIERFRkFVTFRfTE9DQUxFX0lELFxuICDJtURFRkVSX0JMT0NLX0NPTkZJRyBhcyBERUZFUl9CTE9DS19DT05GSUcsXG4gIMm1ZGVwc1RyYWNrZXIgYXMgZGVwc1RyYWNrZXIsXG4gIMm1RGlyZWN0aXZlRGVmIGFzIERpcmVjdGl2ZURlZixcbiAgybVnZW5lcmF0ZVN0YW5kYWxvbmVJbkRlY2xhcmF0aW9uc0Vycm9yLFxuICDJtWdldEFzeW5jQ2xhc3NNZXRhZGF0YUZuIGFzIGdldEFzeW5jQ2xhc3NNZXRhZGF0YUZuLFxuICDJtWdldEluamVjdGFibGVEZWYgYXMgZ2V0SW5qZWN0YWJsZURlZixcbiAgybVJbnRlcm5hbEVudmlyb25tZW50UHJvdmlkZXJzIGFzIEludGVybmFsRW52aXJvbm1lbnRQcm92aWRlcnMsXG4gIMm1aW50ZXJuYWxQcm92aWRlWm9uZUNoYW5nZURldGVjdGlvbiBhcyBpbnRlcm5hbFByb3ZpZGVab25lQ2hhbmdlRGV0ZWN0aW9uLFxuICDJtWlzQ29tcG9uZW50RGVmUGVuZGluZ1Jlc29sdXRpb24sXG4gIMm1aXNFbnZpcm9ubWVudFByb3ZpZGVycyBhcyBpc0Vudmlyb25tZW50UHJvdmlkZXJzLFxuICDJtU5HX0NPTVBfREVGIGFzIE5HX0NPTVBfREVGLFxuICDJtU5HX0RJUl9ERUYgYXMgTkdfRElSX0RFRixcbiAgybVOR19JTkpfREVGIGFzIE5HX0lOSl9ERUYsXG4gIMm1TkdfTU9EX0RFRiBhcyBOR19NT0RfREVGLFxuICDJtU5HX1BJUEVfREVGIGFzIE5HX1BJUEVfREVGLFxuICDJtU5nTW9kdWxlRmFjdG9yeSBhcyBSM05nTW9kdWxlRmFjdG9yeSxcbiAgybVOZ01vZHVsZVRyYW5zaXRpdmVTY29wZXMgYXMgTmdNb2R1bGVUcmFuc2l0aXZlU2NvcGVzLFxuICDJtU5nTW9kdWxlVHlwZSBhcyBOZ01vZHVsZVR5cGUsXG4gIMm1cGF0Y2hDb21wb25lbnREZWZXaXRoU2NvcGUgYXMgcGF0Y2hDb21wb25lbnREZWZXaXRoU2NvcGUsXG4gIMm1UmVuZGVyM0NvbXBvbmVudEZhY3RvcnkgYXMgQ29tcG9uZW50RmFjdG9yeSxcbiAgybVSZW5kZXIzTmdNb2R1bGVSZWYgYXMgTmdNb2R1bGVSZWYsXG4gIMm1cmVzb2x2ZUNvbXBvbmVudFJlc291cmNlcyxcbiAgybVyZXN0b3JlQ29tcG9uZW50UmVzb2x1dGlvblF1ZXVlLFxuICDJtXNldExvY2FsZUlkIGFzIHNldExvY2FsZUlkLFxuICDJtXRyYW5zaXRpdmVTY29wZXNGb3IgYXMgdHJhbnNpdGl2ZVNjb3Blc0ZvcixcbiAgybVVU0VfUlVOVElNRV9ERVBTX1RSQUNLRVJfRk9SX0pJVCBhcyBVU0VfUlVOVElNRV9ERVBTX1RSQUNLRVJfRk9SX0pJVCxcbiAgybXJtUluamVjdGFibGVEZWNsYXJhdGlvbiBhcyBJbmplY3RhYmxlRGVjbGFyYXRpb24sXG4gIE5nWm9uZSxcbiAgRXJyb3JIYW5kbGVyLFxufSBmcm9tICdAYW5ndWxhci9jb3JlJztcblxuaW1wb3J0IHtDb21wb25lbnREZWYsIENvbXBvbmVudFR5cGV9IGZyb20gJy4uLy4uL3NyYy9yZW5kZXIzJztcblxuaW1wb3J0IHtNZXRhZGF0YU92ZXJyaWRlfSBmcm9tICcuL21ldGFkYXRhX292ZXJyaWRlJztcbmltcG9ydCB7XG4gIENvbXBvbmVudFJlc29sdmVyLFxuICBEaXJlY3RpdmVSZXNvbHZlcixcbiAgTmdNb2R1bGVSZXNvbHZlcixcbiAgUGlwZVJlc29sdmVyLFxuICBSZXNvbHZlcixcbn0gZnJvbSAnLi9yZXNvbHZlcnMnO1xuaW1wb3J0IHtERUZFUl9CTE9DS19ERUZBVUxUX0JFSEFWSU9SLCBUZXN0TW9kdWxlTWV0YWRhdGF9IGZyb20gJy4vdGVzdF9iZWRfY29tbW9uJztcbmltcG9ydCB7XG4gIFJFVEhST1dfQVBQTElDQVRJT05fRVJST1JTLFxuICBUZXN0QmVkQXBwbGljYXRpb25FcnJvckhhbmRsZXIsXG59IGZyb20gJy4vYXBwbGljYXRpb25fZXJyb3JfaGFuZGxlcic7XG5cbmVudW0gVGVzdGluZ01vZHVsZU92ZXJyaWRlIHtcbiAgREVDTEFSQVRJT04sXG4gIE9WRVJSSURFX1RFTVBMQVRFLFxufVxuXG5mdW5jdGlvbiBpc1Rlc3RpbmdNb2R1bGVPdmVycmlkZSh2YWx1ZTogdW5rbm93bik6IHZhbHVlIGlzIFRlc3RpbmdNb2R1bGVPdmVycmlkZSB7XG4gIHJldHVybiAoXG4gICAgdmFsdWUgPT09IFRlc3RpbmdNb2R1bGVPdmVycmlkZS5ERUNMQVJBVElPTiB8fCB2YWx1ZSA9PT0gVGVzdGluZ01vZHVsZU92ZXJyaWRlLk9WRVJSSURFX1RFTVBMQVRFXG4gICk7XG59XG5cbmZ1bmN0aW9uIGFzc2VydE5vU3RhbmRhbG9uZUNvbXBvbmVudHMoXG4gIHR5cGVzOiBUeXBlPGFueT5bXSxcbiAgcmVzb2x2ZXI6IFJlc29sdmVyPGFueT4sXG4gIGxvY2F0aW9uOiBzdHJpbmcsXG4pIHtcbiAgdHlwZXMuZm9yRWFjaCgodHlwZSkgPT4ge1xuICAgIGlmICghZ2V0QXN5bmNDbGFzc01ldGFkYXRhRm4odHlwZSkpIHtcbiAgICAgIGNvbnN0IGNvbXBvbmVudCA9IHJlc29sdmVyLnJlc29sdmUodHlwZSk7XG4gICAgICBpZiAoY29tcG9uZW50ICYmIGNvbXBvbmVudC5zdGFuZGFsb25lKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcijJtWdlbmVyYXRlU3RhbmRhbG9uZUluRGVjbGFyYXRpb25zRXJyb3IodHlwZSwgbG9jYXRpb24pKTtcbiAgICAgIH1cbiAgICB9XG4gIH0pO1xufVxuXG4vLyBSZXNvbHZlcnMgZm9yIEFuZ3VsYXIgZGVjb3JhdG9yc1xudHlwZSBSZXNvbHZlcnMgPSB7XG4gIG1vZHVsZTogUmVzb2x2ZXI8TmdNb2R1bGU+O1xuICBjb21wb25lbnQ6IFJlc29sdmVyPERpcmVjdGl2ZT47XG4gIGRpcmVjdGl2ZTogUmVzb2x2ZXI8Q29tcG9uZW50PjtcbiAgcGlwZTogUmVzb2x2ZXI8UGlwZT47XG59O1xuXG5pbnRlcmZhY2UgQ2xlYW51cE9wZXJhdGlvbiB7XG4gIGZpZWxkTmFtZTogc3RyaW5nO1xuICBvYmplY3Q6IGFueTtcbiAgb3JpZ2luYWxWYWx1ZTogdW5rbm93bjtcbn1cblxuZXhwb3J0IGNsYXNzIFRlc3RCZWRDb21waWxlciB7XG4gIHByaXZhdGUgb3JpZ2luYWxDb21wb25lbnRSZXNvbHV0aW9uUXVldWU6IE1hcDxUeXBlPGFueT4sIENvbXBvbmVudD4gfCBudWxsID0gbnVsbDtcblxuICAvLyBUZXN0aW5nIG1vZHVsZSBjb25maWd1cmF0aW9uXG4gIHByaXZhdGUgZGVjbGFyYXRpb25zOiBUeXBlPGFueT5bXSA9IFtdO1xuICBwcml2YXRlIGltcG9ydHM6IFR5cGU8YW55PltdID0gW107XG4gIHByaXZhdGUgcHJvdmlkZXJzOiBQcm92aWRlcltdID0gW107XG4gIHByaXZhdGUgc2NoZW1hczogYW55W10gPSBbXTtcblxuICAvLyBRdWV1ZXMgb2YgY29tcG9uZW50cy9kaXJlY3RpdmVzL3BpcGVzIHRoYXQgc2hvdWxkIGJlIHJlY29tcGlsZWQuXG4gIHByaXZhdGUgcGVuZGluZ0NvbXBvbmVudHMgPSBuZXcgU2V0PFR5cGU8YW55Pj4oKTtcbiAgcHJpdmF0ZSBwZW5kaW5nRGlyZWN0aXZlcyA9IG5ldyBTZXQ8VHlwZTxhbnk+PigpO1xuICBwcml2YXRlIHBlbmRpbmdQaXBlcyA9IG5ldyBTZXQ8VHlwZTxhbnk+PigpO1xuXG4gIC8vIFNldCBvZiBjb21wb25lbnRzIHdpdGggYXN5bmMgbWV0YWRhdGEsIGkuZS4gY29tcG9uZW50cyB3aXRoIGBAZGVmZXJgIGJsb2Nrc1xuICAvLyBpbiB0aGVpciB0ZW1wbGF0ZXMuXG4gIHByaXZhdGUgY29tcG9uZW50c1dpdGhBc3luY01ldGFkYXRhID0gbmV3IFNldDxUeXBlPHVua25vd24+PigpO1xuXG4gIC8vIEtlZXAgdHJhY2sgb2YgYWxsIGNvbXBvbmVudHMgYW5kIGRpcmVjdGl2ZXMsIHNvIHdlIGNhbiBwYXRjaCBQcm92aWRlcnMgb250byBkZWZzIGxhdGVyLlxuICBwcml2YXRlIHNlZW5Db21wb25lbnRzID0gbmV3IFNldDxUeXBlPGFueT4+KCk7XG4gIHByaXZhdGUgc2VlbkRpcmVjdGl2ZXMgPSBuZXcgU2V0PFR5cGU8YW55Pj4oKTtcblxuICAvLyBLZWVwIHRyYWNrIG9mIG92ZXJyaWRkZW4gbW9kdWxlcywgc28gdGhhdCB3ZSBjYW4gY29sbGVjdCBhbGwgYWZmZWN0ZWQgb25lcyBpbiB0aGUgbW9kdWxlIHRyZWUuXG4gIHByaXZhdGUgb3ZlcnJpZGRlbk1vZHVsZXMgPSBuZXcgU2V0PE5nTW9kdWxlVHlwZTxhbnk+PigpO1xuXG4gIC8vIFN0b3JlIHJlc29sdmVkIHN0eWxlcyBmb3IgQ29tcG9uZW50cyB0aGF0IGhhdmUgdGVtcGxhdGUgb3ZlcnJpZGVzIHByZXNlbnQgYW5kIGBzdHlsZVVybHNgXG4gIC8vIGRlZmluZWQgYXQgdGhlIHNhbWUgdGltZS5cbiAgcHJpdmF0ZSBleGlzdGluZ0NvbXBvbmVudFN0eWxlcyA9IG5ldyBNYXA8VHlwZTxhbnk+LCBzdHJpbmdbXT4oKTtcblxuICBwcml2YXRlIHJlc29sdmVyczogUmVzb2x2ZXJzID0gaW5pdFJlc29sdmVycygpO1xuXG4gIC8vIE1hcCBvZiBjb21wb25lbnQgdHlwZSB0byBhbiBOZ01vZHVsZSB0aGF0IGRlY2xhcmVzIGl0LlxuICAvL1xuICAvLyBUaGVyZSBhcmUgYSBjb3VwbGUgc3BlY2lhbCBjYXNlczpcbiAgLy8gLSBmb3Igc3RhbmRhbG9uZSBjb21wb25lbnRzLCB0aGUgbW9kdWxlIHNjb3BlIHZhbHVlIGlzIGBudWxsYFxuICAvLyAtIHdoZW4gYSBjb21wb25lbnQgaXMgZGVjbGFyZWQgaW4gYFRlc3RCZWQuY29uZmlndXJlVGVzdGluZ01vZHVsZSgpYCBjYWxsIG9yXG4gIC8vICAgYSBjb21wb25lbnQncyB0ZW1wbGF0ZSBpcyBvdmVycmlkZGVuIHZpYSBgVGVzdEJlZC5vdmVycmlkZVRlbXBsYXRlVXNpbmdUZXN0aW5nTW9kdWxlKClgLlxuICAvLyAgIHdlIHVzZSBhIHNwZWNpYWwgdmFsdWUgZnJvbSB0aGUgYFRlc3RpbmdNb2R1bGVPdmVycmlkZWAgZW51bS5cbiAgcHJpdmF0ZSBjb21wb25lbnRUb01vZHVsZVNjb3BlID0gbmV3IE1hcDxUeXBlPGFueT4sIFR5cGU8YW55PiB8IFRlc3RpbmdNb2R1bGVPdmVycmlkZSB8IG51bGw+KCk7XG5cbiAgLy8gTWFwIHRoYXQga2VlcHMgaW5pdGlhbCB2ZXJzaW9uIG9mIGNvbXBvbmVudC9kaXJlY3RpdmUvcGlwZSBkZWZzIGluIGNhc2VcbiAgLy8gd2UgY29tcGlsZSBhIFR5cGUgYWdhaW4sIHRodXMgb3ZlcnJpZGluZyByZXNwZWN0aXZlIHN0YXRpYyBmaWVsZHMuIFRoaXMgaXNcbiAgLy8gcmVxdWlyZWQgdG8gbWFrZSBzdXJlIHdlIHJlc3RvcmUgZGVmcyB0byB0aGVpciBpbml0aWFsIHN0YXRlcyBiZXR3ZWVuIHRlc3QgcnVucy5cbiAgLy8gTm90ZTogb25lIGNsYXNzIG1heSBoYXZlIG11bHRpcGxlIGRlZnMgKGZvciBleGFtcGxlOiDJtW1vZCBhbmQgybVpbmogaW4gY2FzZSBvZiBhblxuICAvLyBOZ01vZHVsZSksIHN0b3JlIGFsbCBvZiB0aGVtIGluIGEgbWFwLlxuICBwcml2YXRlIGluaXRpYWxOZ0RlZnMgPSBuZXcgTWFwPFR5cGU8YW55PiwgTWFwPHN0cmluZywgUHJvcGVydHlEZXNjcmlwdG9yIHwgdW5kZWZpbmVkPj4oKTtcblxuICAvLyBBcnJheSB0aGF0IGtlZXBzIGNsZWFudXAgb3BlcmF0aW9ucyBmb3IgaW5pdGlhbCB2ZXJzaW9ucyBvZiBjb21wb25lbnQvZGlyZWN0aXZlL3BpcGUvbW9kdWxlXG4gIC8vIGRlZnMgaW4gY2FzZSBUZXN0QmVkIG1ha2VzIGNoYW5nZXMgdG8gdGhlIG9yaWdpbmFscy5cbiAgcHJpdmF0ZSBkZWZDbGVhbnVwT3BzOiBDbGVhbnVwT3BlcmF0aW9uW10gPSBbXTtcblxuICBwcml2YXRlIF9pbmplY3RvcjogSW5qZWN0b3IgfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBjb21waWxlclByb3ZpZGVyczogUHJvdmlkZXJbXSB8IG51bGwgPSBudWxsO1xuXG4gIHByaXZhdGUgcHJvdmlkZXJPdmVycmlkZXM6IFByb3ZpZGVyW10gPSBbXTtcbiAgcHJpdmF0ZSByb290UHJvdmlkZXJPdmVycmlkZXM6IFByb3ZpZGVyW10gPSBbXTtcbiAgLy8gT3ZlcnJpZGVzIGZvciBpbmplY3RhYmxlcyB3aXRoIGB7cHJvdmlkZWRJbjogU29tZU1vZHVsZX1gIG5lZWQgdG8gYmUgdHJhY2tlZCBhbmQgYWRkZWQgdG8gdGhhdFxuICAvLyBtb2R1bGUncyBwcm92aWRlciBsaXN0LlxuICBwcml2YXRlIHByb3ZpZGVyT3ZlcnJpZGVzQnlNb2R1bGUgPSBuZXcgTWFwPEluamVjdG9yVHlwZTxhbnk+LCBQcm92aWRlcltdPigpO1xuICBwcml2YXRlIHByb3ZpZGVyT3ZlcnJpZGVzQnlUb2tlbiA9IG5ldyBNYXA8YW55LCBQcm92aWRlcj4oKTtcbiAgcHJpdmF0ZSBzY29wZXNXaXRoT3ZlcnJpZGRlblByb3ZpZGVycyA9IG5ldyBTZXQ8VHlwZTxhbnk+PigpO1xuXG4gIHByaXZhdGUgdGVzdE1vZHVsZVR5cGU6IE5nTW9kdWxlVHlwZTxhbnk+O1xuICBwcml2YXRlIHRlc3RNb2R1bGVSZWY6IE5nTW9kdWxlUmVmPGFueT4gfCBudWxsID0gbnVsbDtcblxuICBwcml2YXRlIGRlZmVyQmxvY2tCZWhhdmlvciA9IERFRkVSX0JMT0NLX0RFRkFVTFRfQkVIQVZJT1I7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgcHJpdmF0ZSBwbGF0Zm9ybTogUGxhdGZvcm1SZWYsXG4gICAgcHJpdmF0ZSBhZGRpdGlvbmFsTW9kdWxlVHlwZXM6IFR5cGU8YW55PiB8IFR5cGU8YW55PltdLFxuICApIHtcbiAgICBjbGFzcyBEeW5hbWljVGVzdE1vZHVsZSB7fVxuICAgIHRoaXMudGVzdE1vZHVsZVR5cGUgPSBEeW5hbWljVGVzdE1vZHVsZSBhcyBhbnk7XG4gIH1cblxuICBzZXRDb21waWxlclByb3ZpZGVycyhwcm92aWRlcnM6IFByb3ZpZGVyW10gfCBudWxsKTogdm9pZCB7XG4gICAgdGhpcy5jb21waWxlclByb3ZpZGVycyA9IHByb3ZpZGVycztcbiAgICB0aGlzLl9pbmplY3RvciA9IG51bGw7XG4gIH1cblxuICBjb25maWd1cmVUZXN0aW5nTW9kdWxlKG1vZHVsZURlZjogVGVzdE1vZHVsZU1ldGFkYXRhKTogdm9pZCB7XG4gICAgLy8gRW5xdWV1ZSBhbnkgY29tcGlsYXRpb24gdGFza3MgZm9yIHRoZSBkaXJlY3RseSBkZWNsYXJlZCBjb21wb25lbnQuXG4gICAgaWYgKG1vZHVsZURlZi5kZWNsYXJhdGlvbnMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgLy8gVmVyaWZ5IHRoYXQgdGhlcmUgYXJlIG5vIHN0YW5kYWxvbmUgY29tcG9uZW50c1xuICAgICAgYXNzZXJ0Tm9TdGFuZGFsb25lQ29tcG9uZW50cyhcbiAgICAgICAgbW9kdWxlRGVmLmRlY2xhcmF0aW9ucyxcbiAgICAgICAgdGhpcy5yZXNvbHZlcnMuY29tcG9uZW50LFxuICAgICAgICAnXCJUZXN0QmVkLmNvbmZpZ3VyZVRlc3RpbmdNb2R1bGVcIiBjYWxsJyxcbiAgICAgICk7XG4gICAgICB0aGlzLnF1ZXVlVHlwZUFycmF5KG1vZHVsZURlZi5kZWNsYXJhdGlvbnMsIFRlc3RpbmdNb2R1bGVPdmVycmlkZS5ERUNMQVJBVElPTik7XG4gICAgICB0aGlzLmRlY2xhcmF0aW9ucy5wdXNoKC4uLm1vZHVsZURlZi5kZWNsYXJhdGlvbnMpO1xuICAgIH1cblxuICAgIC8vIEVucXVldWUgYW55IGNvbXBpbGF0aW9uIHRhc2tzIGZvciBpbXBvcnRlZCBtb2R1bGVzLlxuICAgIGlmIChtb2R1bGVEZWYuaW1wb3J0cyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzLnF1ZXVlVHlwZXNGcm9tTW9kdWxlc0FycmF5KG1vZHVsZURlZi5pbXBvcnRzKTtcbiAgICAgIHRoaXMuaW1wb3J0cy5wdXNoKC4uLm1vZHVsZURlZi5pbXBvcnRzKTtcbiAgICB9XG5cbiAgICBpZiAobW9kdWxlRGVmLnByb3ZpZGVycyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzLnByb3ZpZGVycy5wdXNoKC4uLm1vZHVsZURlZi5wcm92aWRlcnMpO1xuICAgIH1cbiAgICB0aGlzLnByb3ZpZGVycy5wdXNoKHtcbiAgICAgIHByb3ZpZGU6IFJFVEhST1dfQVBQTElDQVRJT05fRVJST1JTLFxuICAgICAgdXNlVmFsdWU6IG1vZHVsZURlZi5fcmV0aHJvd0FwcGxpY2F0aW9uVGlja0Vycm9ycyA/PyBmYWxzZSxcbiAgICB9KTtcblxuICAgIGlmIChtb2R1bGVEZWYuc2NoZW1hcyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzLnNjaGVtYXMucHVzaCguLi5tb2R1bGVEZWYuc2NoZW1hcyk7XG4gICAgfVxuXG4gICAgdGhpcy5kZWZlckJsb2NrQmVoYXZpb3IgPSBtb2R1bGVEZWYuZGVmZXJCbG9ja0JlaGF2aW9yID8/IERFRkVSX0JMT0NLX0RFRkFVTFRfQkVIQVZJT1I7XG4gIH1cblxuICBvdmVycmlkZU1vZHVsZShuZ01vZHVsZTogVHlwZTxhbnk+LCBvdmVycmlkZTogTWV0YWRhdGFPdmVycmlkZTxOZ01vZHVsZT4pOiB2b2lkIHtcbiAgICBpZiAoVVNFX1JVTlRJTUVfREVQU19UUkFDS0VSX0ZPUl9KSVQpIHtcbiAgICAgIGRlcHNUcmFja2VyLmNsZWFyU2NvcGVDYWNoZUZvcihuZ01vZHVsZSk7XG4gICAgfVxuICAgIHRoaXMub3ZlcnJpZGRlbk1vZHVsZXMuYWRkKG5nTW9kdWxlIGFzIE5nTW9kdWxlVHlwZTxhbnk+KTtcblxuICAgIC8vIENvbXBpbGUgdGhlIG1vZHVsZSByaWdodCBhd2F5LlxuICAgIHRoaXMucmVzb2x2ZXJzLm1vZHVsZS5hZGRPdmVycmlkZShuZ01vZHVsZSwgb3ZlcnJpZGUpO1xuICAgIGNvbnN0IG1ldGFkYXRhID0gdGhpcy5yZXNvbHZlcnMubW9kdWxlLnJlc29sdmUobmdNb2R1bGUpO1xuICAgIGlmIChtZXRhZGF0YSA9PT0gbnVsbCkge1xuICAgICAgdGhyb3cgaW52YWxpZFR5cGVFcnJvcihuZ01vZHVsZS5uYW1lLCAnTmdNb2R1bGUnKTtcbiAgICB9XG5cbiAgICB0aGlzLnJlY29tcGlsZU5nTW9kdWxlKG5nTW9kdWxlLCBtZXRhZGF0YSk7XG5cbiAgICAvLyBBdCB0aGlzIHBvaW50LCB0aGUgbW9kdWxlIGhhcyBhIHZhbGlkIG1vZHVsZSBkZWYgKMm1bW9kKSwgYnV0IHRoZSBvdmVycmlkZSBtYXkgaGF2ZSBpbnRyb2R1Y2VkXG4gICAgLy8gbmV3IGRlY2xhcmF0aW9ucyBvciBpbXBvcnRlZCBtb2R1bGVzLiBJbmdlc3QgYW55IHBvc3NpYmxlIG5ldyB0eXBlcyBhbmQgYWRkIHRoZW0gdG8gdGhlXG4gICAgLy8gY3VycmVudCBxdWV1ZS5cbiAgICB0aGlzLnF1ZXVlVHlwZXNGcm9tTW9kdWxlc0FycmF5KFtuZ01vZHVsZV0pO1xuICB9XG5cbiAgb3ZlcnJpZGVDb21wb25lbnQoY29tcG9uZW50OiBUeXBlPGFueT4sIG92ZXJyaWRlOiBNZXRhZGF0YU92ZXJyaWRlPENvbXBvbmVudD4pOiB2b2lkIHtcbiAgICB0aGlzLnZlcmlmeU5vU3RhbmRhbG9uZUZsYWdPdmVycmlkZXMoY29tcG9uZW50LCBvdmVycmlkZSk7XG4gICAgdGhpcy5yZXNvbHZlcnMuY29tcG9uZW50LmFkZE92ZXJyaWRlKGNvbXBvbmVudCwgb3ZlcnJpZGUpO1xuICAgIHRoaXMucGVuZGluZ0NvbXBvbmVudHMuYWRkKGNvbXBvbmVudCk7XG5cbiAgICAvLyBJZiB0aGlzIGlzIGEgY29tcG9uZW50IHdpdGggYXN5bmMgbWV0YWRhdGEgKGkuZS4gYSBjb21wb25lbnQgd2l0aCBhIGBAZGVmZXJgIGJsb2NrXG4gICAgLy8gaW4gYSB0ZW1wbGF0ZSkgLSBzdG9yZSBpdCBmb3IgZnV0dXJlIHByb2Nlc3NpbmcuXG4gICAgdGhpcy5tYXliZVJlZ2lzdGVyQ29tcG9uZW50V2l0aEFzeW5jTWV0YWRhdGEoY29tcG9uZW50KTtcbiAgfVxuXG4gIG92ZXJyaWRlRGlyZWN0aXZlKGRpcmVjdGl2ZTogVHlwZTxhbnk+LCBvdmVycmlkZTogTWV0YWRhdGFPdmVycmlkZTxEaXJlY3RpdmU+KTogdm9pZCB7XG4gICAgdGhpcy52ZXJpZnlOb1N0YW5kYWxvbmVGbGFnT3ZlcnJpZGVzKGRpcmVjdGl2ZSwgb3ZlcnJpZGUpO1xuICAgIHRoaXMucmVzb2x2ZXJzLmRpcmVjdGl2ZS5hZGRPdmVycmlkZShkaXJlY3RpdmUsIG92ZXJyaWRlKTtcbiAgICB0aGlzLnBlbmRpbmdEaXJlY3RpdmVzLmFkZChkaXJlY3RpdmUpO1xuICB9XG5cbiAgb3ZlcnJpZGVQaXBlKHBpcGU6IFR5cGU8YW55Piwgb3ZlcnJpZGU6IE1ldGFkYXRhT3ZlcnJpZGU8UGlwZT4pOiB2b2lkIHtcbiAgICB0aGlzLnZlcmlmeU5vU3RhbmRhbG9uZUZsYWdPdmVycmlkZXMocGlwZSwgb3ZlcnJpZGUpO1xuICAgIHRoaXMucmVzb2x2ZXJzLnBpcGUuYWRkT3ZlcnJpZGUocGlwZSwgb3ZlcnJpZGUpO1xuICAgIHRoaXMucGVuZGluZ1BpcGVzLmFkZChwaXBlKTtcbiAgfVxuXG4gIHByaXZhdGUgdmVyaWZ5Tm9TdGFuZGFsb25lRmxhZ092ZXJyaWRlcyhcbiAgICB0eXBlOiBUeXBlPGFueT4sXG4gICAgb3ZlcnJpZGU6IE1ldGFkYXRhT3ZlcnJpZGU8Q29tcG9uZW50IHwgRGlyZWN0aXZlIHwgUGlwZT4sXG4gICkge1xuICAgIGlmIChcbiAgICAgIG92ZXJyaWRlLmFkZD8uaGFzT3duUHJvcGVydHkoJ3N0YW5kYWxvbmUnKSB8fFxuICAgICAgb3ZlcnJpZGUuc2V0Py5oYXNPd25Qcm9wZXJ0eSgnc3RhbmRhbG9uZScpIHx8XG4gICAgICBvdmVycmlkZS5yZW1vdmU/Lmhhc093blByb3BlcnR5KCdzdGFuZGFsb25lJylcbiAgICApIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgYEFuIG92ZXJyaWRlIGZvciB0aGUgJHt0eXBlLm5hbWV9IGNsYXNzIGhhcyB0aGUgXFxgc3RhbmRhbG9uZVxcYCBmbGFnLiBgICtcbiAgICAgICAgICBgQ2hhbmdpbmcgdGhlIFxcYHN0YW5kYWxvbmVcXGAgZmxhZyB2aWEgVGVzdEJlZCBvdmVycmlkZXMgaXMgbm90IHN1cHBvcnRlZC5gLFxuICAgICAgKTtcbiAgICB9XG4gIH1cblxuICBvdmVycmlkZVByb3ZpZGVyKFxuICAgIHRva2VuOiBhbnksXG4gICAgcHJvdmlkZXI6IHt1c2VGYWN0b3J5PzogRnVuY3Rpb247IHVzZVZhbHVlPzogYW55OyBkZXBzPzogYW55W107IG11bHRpPzogYm9vbGVhbn0sXG4gICk6IHZvaWQge1xuICAgIGxldCBwcm92aWRlckRlZjogUHJvdmlkZXI7XG4gICAgaWYgKHByb3ZpZGVyLnVzZUZhY3RvcnkgIT09IHVuZGVmaW5lZCkge1xuICAgICAgcHJvdmlkZXJEZWYgPSB7XG4gICAgICAgIHByb3ZpZGU6IHRva2VuLFxuICAgICAgICB1c2VGYWN0b3J5OiBwcm92aWRlci51c2VGYWN0b3J5LFxuICAgICAgICBkZXBzOiBwcm92aWRlci5kZXBzIHx8IFtdLFxuICAgICAgICBtdWx0aTogcHJvdmlkZXIubXVsdGksXG4gICAgICB9O1xuICAgIH0gZWxzZSBpZiAocHJvdmlkZXIudXNlVmFsdWUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgcHJvdmlkZXJEZWYgPSB7cHJvdmlkZTogdG9rZW4sIHVzZVZhbHVlOiBwcm92aWRlci51c2VWYWx1ZSwgbXVsdGk6IHByb3ZpZGVyLm11bHRpfTtcbiAgICB9IGVsc2Uge1xuICAgICAgcHJvdmlkZXJEZWYgPSB7cHJvdmlkZTogdG9rZW59O1xuICAgIH1cblxuICAgIGNvbnN0IGluamVjdGFibGVEZWY6IEluamVjdGFibGVEZWNsYXJhdGlvbjxhbnk+IHwgbnVsbCA9XG4gICAgICB0eXBlb2YgdG9rZW4gIT09ICdzdHJpbmcnID8gZ2V0SW5qZWN0YWJsZURlZih0b2tlbikgOiBudWxsO1xuICAgIGNvbnN0IHByb3ZpZGVkSW4gPSBpbmplY3RhYmxlRGVmID09PSBudWxsID8gbnVsbCA6IHJlc29sdmVGb3J3YXJkUmVmKGluamVjdGFibGVEZWYucHJvdmlkZWRJbik7XG4gICAgY29uc3Qgb3ZlcnJpZGVzQnVja2V0ID1cbiAgICAgIHByb3ZpZGVkSW4gPT09ICdyb290JyA/IHRoaXMucm9vdFByb3ZpZGVyT3ZlcnJpZGVzIDogdGhpcy5wcm92aWRlck92ZXJyaWRlcztcbiAgICBvdmVycmlkZXNCdWNrZXQucHVzaChwcm92aWRlckRlZik7XG5cbiAgICAvLyBLZWVwIG92ZXJyaWRlcyBncm91cGVkIGJ5IHRva2VuIGFzIHdlbGwgZm9yIGZhc3QgbG9va3VwcyB1c2luZyB0b2tlblxuICAgIHRoaXMucHJvdmlkZXJPdmVycmlkZXNCeVRva2VuLnNldCh0b2tlbiwgcHJvdmlkZXJEZWYpO1xuICAgIGlmIChpbmplY3RhYmxlRGVmICE9PSBudWxsICYmIHByb3ZpZGVkSW4gIT09IG51bGwgJiYgdHlwZW9mIHByb3ZpZGVkSW4gIT09ICdzdHJpbmcnKSB7XG4gICAgICBjb25zdCBleGlzdGluZ092ZXJyaWRlcyA9IHRoaXMucHJvdmlkZXJPdmVycmlkZXNCeU1vZHVsZS5nZXQocHJvdmlkZWRJbik7XG4gICAgICBpZiAoZXhpc3RpbmdPdmVycmlkZXMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBleGlzdGluZ092ZXJyaWRlcy5wdXNoKHByb3ZpZGVyRGVmKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMucHJvdmlkZXJPdmVycmlkZXNCeU1vZHVsZS5zZXQocHJvdmlkZWRJbiwgW3Byb3ZpZGVyRGVmXSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgb3ZlcnJpZGVUZW1wbGF0ZVVzaW5nVGVzdGluZ01vZHVsZSh0eXBlOiBUeXBlPGFueT4sIHRlbXBsYXRlOiBzdHJpbmcpOiB2b2lkIHtcbiAgICBjb25zdCBkZWYgPSAodHlwZSBhcyBhbnkpW05HX0NPTVBfREVGXTtcbiAgICBjb25zdCBoYXNTdHlsZVVybHMgPSAoKTogYm9vbGVhbiA9PiB7XG4gICAgICBjb25zdCBtZXRhZGF0YSA9IHRoaXMucmVzb2x2ZXJzLmNvbXBvbmVudC5yZXNvbHZlKHR5cGUpISBhcyBDb21wb25lbnQ7XG4gICAgICByZXR1cm4gISFtZXRhZGF0YS5zdHlsZVVybCB8fCAhIW1ldGFkYXRhLnN0eWxlVXJscz8ubGVuZ3RoO1xuICAgIH07XG4gICAgY29uc3Qgb3ZlcnJpZGVTdHlsZVVybHMgPSAhIWRlZiAmJiAhybVpc0NvbXBvbmVudERlZlBlbmRpbmdSZXNvbHV0aW9uKHR5cGUpICYmIGhhc1N0eWxlVXJscygpO1xuXG4gICAgLy8gSW4gSXZ5LCBjb21waWxpbmcgYSBjb21wb25lbnQgZG9lcyBub3QgcmVxdWlyZSBrbm93aW5nIHRoZSBtb2R1bGUgcHJvdmlkaW5nIHRoZVxuICAgIC8vIGNvbXBvbmVudCdzIHNjb3BlLCBzbyBvdmVycmlkZVRlbXBsYXRlVXNpbmdUZXN0aW5nTW9kdWxlIGNhbiBiZSBpbXBsZW1lbnRlZCBwdXJlbHkgdmlhXG4gICAgLy8gb3ZlcnJpZGVDb21wb25lbnQuIEltcG9ydGFudDogb3ZlcnJpZGluZyB0ZW1wbGF0ZSByZXF1aXJlcyBmdWxsIENvbXBvbmVudCByZS1jb21waWxhdGlvbixcbiAgICAvLyB3aGljaCBtYXkgZmFpbCBpbiBjYXNlIHN0eWxlVXJscyBhcmUgYWxzbyBwcmVzZW50ICh0aHVzIENvbXBvbmVudCBpcyBjb25zaWRlcmVkIGFzIHJlcXVpcmVkXG4gICAgLy8gcmVzb2x1dGlvbikuIEluIG9yZGVyIHRvIGF2b2lkIHRoaXMsIHdlIHByZWVtcHRpdmVseSBzZXQgc3R5bGVVcmxzIHRvIGFuIGVtcHR5IGFycmF5LFxuICAgIC8vIHByZXNlcnZlIGN1cnJlbnQgc3R5bGVzIGF2YWlsYWJsZSBvbiBDb21wb25lbnQgZGVmIGFuZCByZXN0b3JlIHN0eWxlcyBiYWNrIG9uY2UgY29tcGlsYXRpb25cbiAgICAvLyBpcyBjb21wbGV0ZS5cbiAgICBjb25zdCBvdmVycmlkZSA9IG92ZXJyaWRlU3R5bGVVcmxzXG4gICAgICA/IHt0ZW1wbGF0ZSwgc3R5bGVzOiBbXSwgc3R5bGVVcmxzOiBbXSwgc3R5bGVVcmw6IHVuZGVmaW5lZH1cbiAgICAgIDoge3RlbXBsYXRlfTtcbiAgICB0aGlzLm92ZXJyaWRlQ29tcG9uZW50KHR5cGUsIHtzZXQ6IG92ZXJyaWRlfSk7XG5cbiAgICBpZiAob3ZlcnJpZGVTdHlsZVVybHMgJiYgZGVmLnN0eWxlcyAmJiBkZWYuc3R5bGVzLmxlbmd0aCA+IDApIHtcbiAgICAgIHRoaXMuZXhpc3RpbmdDb21wb25lbnRTdHlsZXMuc2V0KHR5cGUsIGRlZi5zdHlsZXMpO1xuICAgIH1cblxuICAgIC8vIFNldCB0aGUgY29tcG9uZW50J3Mgc2NvcGUgdG8gYmUgdGhlIHRlc3RpbmcgbW9kdWxlLlxuICAgIHRoaXMuY29tcG9uZW50VG9Nb2R1bGVTY29wZS5zZXQodHlwZSwgVGVzdGluZ01vZHVsZU92ZXJyaWRlLk9WRVJSSURFX1RFTVBMQVRFKTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgcmVzb2x2ZVBlbmRpbmdDb21wb25lbnRzV2l0aEFzeW5jTWV0YWRhdGEoKSB7XG4gICAgaWYgKHRoaXMuY29tcG9uZW50c1dpdGhBc3luY01ldGFkYXRhLnNpemUgPT09IDApIHJldHVybjtcblxuICAgIGNvbnN0IHByb21pc2VzID0gW107XG4gICAgZm9yIChjb25zdCBjb21wb25lbnQgb2YgdGhpcy5jb21wb25lbnRzV2l0aEFzeW5jTWV0YWRhdGEpIHtcbiAgICAgIGNvbnN0IGFzeW5jTWV0YWRhdGFGbiA9IGdldEFzeW5jQ2xhc3NNZXRhZGF0YUZuKGNvbXBvbmVudCk7XG4gICAgICBpZiAoYXN5bmNNZXRhZGF0YUZuKSB7XG4gICAgICAgIHByb21pc2VzLnB1c2goYXN5bmNNZXRhZGF0YUZuKCkpO1xuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLmNvbXBvbmVudHNXaXRoQXN5bmNNZXRhZGF0YS5jbGVhcigpO1xuXG4gICAgY29uc3QgcmVzb2x2ZWREZXBzID0gYXdhaXQgUHJvbWlzZS5hbGwocHJvbWlzZXMpO1xuICAgIGNvbnN0IGZsYXRSZXNvbHZlZERlcHMgPSByZXNvbHZlZERlcHMuZmxhdCgyKTtcbiAgICB0aGlzLnF1ZXVlVHlwZXNGcm9tTW9kdWxlc0FycmF5KGZsYXRSZXNvbHZlZERlcHMpO1xuXG4gICAgLy8gTG9hZGVkIHN0YW5kYWxvbmUgY29tcG9uZW50cyBtaWdodCBjb250YWluIGltcG9ydHMgb2YgTmdNb2R1bGVzXG4gICAgLy8gd2l0aCBwcm92aWRlcnMsIG1ha2Ugc3VyZSB3ZSBvdmVycmlkZSBwcm92aWRlcnMgdGhlcmUgdG9vLlxuICAgIGZvciAoY29uc3QgY29tcG9uZW50IG9mIGZsYXRSZXNvbHZlZERlcHMpIHtcbiAgICAgIHRoaXMuYXBwbHlQcm92aWRlck92ZXJyaWRlc0luU2NvcGUoY29tcG9uZW50KTtcbiAgICB9XG4gIH1cblxuICBhc3luYyBjb21waWxlQ29tcG9uZW50cygpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0aGlzLmNsZWFyQ29tcG9uZW50UmVzb2x1dGlvblF1ZXVlKCk7XG5cbiAgICAvLyBXYWl0IGZvciBhbGwgYXN5bmMgbWV0YWRhdGEgZm9yIGNvbXBvbmVudHMgdGhhdCB3ZXJlXG4gICAgLy8gb3ZlcnJpZGRlbiwgd2UgbmVlZCByZXNvbHZlZCBtZXRhZGF0YSB0byBwZXJmb3JtIGFuIG92ZXJyaWRlXG4gICAgLy8gYW5kIHJlLWNvbXBpbGUgYSBjb21wb25lbnQuXG4gICAgYXdhaXQgdGhpcy5yZXNvbHZlUGVuZGluZ0NvbXBvbmVudHNXaXRoQXN5bmNNZXRhZGF0YSgpO1xuXG4gICAgLy8gVmVyaWZ5IHRoYXQgdGhlcmUgd2VyZSBubyBzdGFuZGFsb25lIGNvbXBvbmVudHMgcHJlc2VudCBpbiB0aGUgYGRlY2xhcmF0aW9uc2AgZmllbGRcbiAgICAvLyBkdXJpbmcgdGhlIGBUZXN0QmVkLmNvbmZpZ3VyZVRlc3RpbmdNb2R1bGVgIGNhbGwuIFdlIHBlcmZvcm0gdGhpcyBjaGVjayBoZXJlIGluIGFkZGl0aW9uXG4gICAgLy8gdG8gdGhlIGxvZ2ljIGluIHRoZSBgY29uZmlndXJlVGVzdGluZ01vZHVsZWAgZnVuY3Rpb24sIHNpbmNlIGF0IHRoaXMgcG9pbnQgd2UgaGF2ZVxuICAgIC8vIGFsbCBhc3luYyBtZXRhZGF0YSByZXNvbHZlZC5cbiAgICBhc3NlcnROb1N0YW5kYWxvbmVDb21wb25lbnRzKFxuICAgICAgdGhpcy5kZWNsYXJhdGlvbnMsXG4gICAgICB0aGlzLnJlc29sdmVycy5jb21wb25lbnQsXG4gICAgICAnXCJUZXN0QmVkLmNvbmZpZ3VyZVRlc3RpbmdNb2R1bGVcIiBjYWxsJyxcbiAgICApO1xuXG4gICAgLy8gUnVuIGNvbXBpbGVycyBmb3IgYWxsIHF1ZXVlZCB0eXBlcy5cbiAgICBsZXQgbmVlZHNBc3luY1Jlc291cmNlcyA9IHRoaXMuY29tcGlsZVR5cGVzU3luYygpO1xuXG4gICAgLy8gY29tcGlsZUNvbXBvbmVudHMoKSBzaG91bGQgbm90IGJlIGFzeW5jIHVubGVzcyBpdCBuZWVkcyB0byBiZS5cbiAgICBpZiAobmVlZHNBc3luY1Jlc291cmNlcykge1xuICAgICAgbGV0IHJlc291cmNlTG9hZGVyOiBSZXNvdXJjZUxvYWRlcjtcbiAgICAgIGxldCByZXNvbHZlciA9ICh1cmw6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiA9PiB7XG4gICAgICAgIGlmICghcmVzb3VyY2VMb2FkZXIpIHtcbiAgICAgICAgICByZXNvdXJjZUxvYWRlciA9IHRoaXMuaW5qZWN0b3IuZ2V0KFJlc291cmNlTG9hZGVyKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHJlc291cmNlTG9hZGVyLmdldCh1cmwpKTtcbiAgICAgIH07XG4gICAgICBhd2FpdCDJtXJlc29sdmVDb21wb25lbnRSZXNvdXJjZXMocmVzb2x2ZXIpO1xuICAgIH1cbiAgfVxuXG4gIGZpbmFsaXplKCk6IE5nTW9kdWxlUmVmPGFueT4ge1xuICAgIC8vIE9uZSBsYXN0IGNvbXBpbGVcbiAgICB0aGlzLmNvbXBpbGVUeXBlc1N5bmMoKTtcblxuICAgIC8vIENyZWF0ZSB0aGUgdGVzdGluZyBtb2R1bGUgaXRzZWxmLlxuICAgIHRoaXMuY29tcGlsZVRlc3RNb2R1bGUoKTtcblxuICAgIHRoaXMuYXBwbHlUcmFuc2l0aXZlU2NvcGVzKCk7XG5cbiAgICB0aGlzLmFwcGx5UHJvdmlkZXJPdmVycmlkZXMoKTtcblxuICAgIC8vIFBhdGNoIHByZXZpb3VzbHkgc3RvcmVkIGBzdHlsZXNgIENvbXBvbmVudCB2YWx1ZXMgKHRha2VuIGZyb20gybVjbXApLCBpbiBjYXNlIHRoZXNlXG4gICAgLy8gQ29tcG9uZW50cyBoYXZlIGBzdHlsZVVybHNgIGZpZWxkcyBkZWZpbmVkIGFuZCB0ZW1wbGF0ZSBvdmVycmlkZSB3YXMgcmVxdWVzdGVkLlxuICAgIHRoaXMucGF0Y2hDb21wb25lbnRzV2l0aEV4aXN0aW5nU3R5bGVzKCk7XG5cbiAgICAvLyBDbGVhciB0aGUgY29tcG9uZW50VG9Nb2R1bGVTY29wZSBtYXAsIHNvIHRoYXQgZnV0dXJlIGNvbXBpbGF0aW9ucyBkb24ndCByZXNldCB0aGUgc2NvcGUgb2ZcbiAgICAvLyBldmVyeSBjb21wb25lbnQuXG4gICAgdGhpcy5jb21wb25lbnRUb01vZHVsZVNjb3BlLmNsZWFyKCk7XG5cbiAgICBjb25zdCBwYXJlbnRJbmplY3RvciA9IHRoaXMucGxhdGZvcm0uaW5qZWN0b3I7XG4gICAgdGhpcy50ZXN0TW9kdWxlUmVmID0gbmV3IE5nTW9kdWxlUmVmKHRoaXMudGVzdE1vZHVsZVR5cGUsIHBhcmVudEluamVjdG9yLCBbXSk7XG5cbiAgICAvLyBBcHBsaWNhdGlvbkluaXRTdGF0dXMucnVuSW5pdGlhbGl6ZXJzKCkgaXMgbWFya2VkIEBpbnRlcm5hbCB0byBjb3JlLlxuICAgIC8vIENhc3QgaXQgdG8gYW55IGJlZm9yZSBhY2Nlc3NpbmcgaXQuXG4gICAgKHRoaXMudGVzdE1vZHVsZVJlZi5pbmplY3Rvci5nZXQoQXBwbGljYXRpb25Jbml0U3RhdHVzKSBhcyBhbnkpLnJ1bkluaXRpYWxpemVycygpO1xuXG4gICAgLy8gU2V0IGxvY2FsZSBJRCBhZnRlciBydW5uaW5nIGFwcCBpbml0aWFsaXplcnMsIHNpbmNlIGxvY2FsZSBpbmZvcm1hdGlvbiBtaWdodCBiZSB1cGRhdGVkIHdoaWxlXG4gICAgLy8gcnVubmluZyBpbml0aWFsaXplcnMuIFRoaXMgaXMgYWxzbyBjb25zaXN0ZW50IHdpdGggdGhlIGV4ZWN1dGlvbiBvcmRlciB3aGlsZSBib290c3RyYXBwaW5nIGFuXG4gICAgLy8gYXBwIChzZWUgYHBhY2thZ2VzL2NvcmUvc3JjL2FwcGxpY2F0aW9uX3JlZi50c2AgZmlsZSkuXG4gICAgY29uc3QgbG9jYWxlSWQgPSB0aGlzLnRlc3RNb2R1bGVSZWYuaW5qZWN0b3IuZ2V0KExPQ0FMRV9JRCwgREVGQVVMVF9MT0NBTEVfSUQpO1xuICAgIHNldExvY2FsZUlkKGxvY2FsZUlkKTtcblxuICAgIHJldHVybiB0aGlzLnRlc3RNb2R1bGVSZWY7XG4gIH1cblxuICAvKipcbiAgICogQGludGVybmFsXG4gICAqL1xuICBfY29tcGlsZU5nTW9kdWxlU3luYyhtb2R1bGVUeXBlOiBUeXBlPGFueT4pOiB2b2lkIHtcbiAgICB0aGlzLnF1ZXVlVHlwZXNGcm9tTW9kdWxlc0FycmF5KFttb2R1bGVUeXBlXSk7XG4gICAgdGhpcy5jb21waWxlVHlwZXNTeW5jKCk7XG4gICAgdGhpcy5hcHBseVByb3ZpZGVyT3ZlcnJpZGVzKCk7XG4gICAgdGhpcy5hcHBseVByb3ZpZGVyT3ZlcnJpZGVzSW5TY29wZShtb2R1bGVUeXBlKTtcbiAgICB0aGlzLmFwcGx5VHJhbnNpdGl2ZVNjb3BlcygpO1xuICB9XG5cbiAgLyoqXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgYXN5bmMgX2NvbXBpbGVOZ01vZHVsZUFzeW5jKG1vZHVsZVR5cGU6IFR5cGU8YW55Pik6IFByb21pc2U8dm9pZD4ge1xuICAgIHRoaXMucXVldWVUeXBlc0Zyb21Nb2R1bGVzQXJyYXkoW21vZHVsZVR5cGVdKTtcbiAgICBhd2FpdCB0aGlzLmNvbXBpbGVDb21wb25lbnRzKCk7XG4gICAgdGhpcy5hcHBseVByb3ZpZGVyT3ZlcnJpZGVzKCk7XG4gICAgdGhpcy5hcHBseVByb3ZpZGVyT3ZlcnJpZGVzSW5TY29wZShtb2R1bGVUeXBlKTtcbiAgICB0aGlzLmFwcGx5VHJhbnNpdGl2ZVNjb3BlcygpO1xuICB9XG5cbiAgLyoqXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgX2dldE1vZHVsZVJlc29sdmVyKCk6IFJlc29sdmVyPE5nTW9kdWxlPiB7XG4gICAgcmV0dXJuIHRoaXMucmVzb2x2ZXJzLm1vZHVsZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIF9nZXRDb21wb25lbnRGYWN0b3JpZXMobW9kdWxlVHlwZTogTmdNb2R1bGVUeXBlKTogQ29tcG9uZW50RmFjdG9yeTxhbnk+W10ge1xuICAgIHJldHVybiBtYXliZVVud3JhcEZuKG1vZHVsZVR5cGUuybVtb2QuZGVjbGFyYXRpb25zKS5yZWR1Y2UoKGZhY3RvcmllcywgZGVjbGFyYXRpb24pID0+IHtcbiAgICAgIGNvbnN0IGNvbXBvbmVudERlZiA9IChkZWNsYXJhdGlvbiBhcyBhbnkpLsm1Y21wO1xuICAgICAgY29tcG9uZW50RGVmICYmIGZhY3Rvcmllcy5wdXNoKG5ldyBDb21wb25lbnRGYWN0b3J5KGNvbXBvbmVudERlZiwgdGhpcy50ZXN0TW9kdWxlUmVmISkpO1xuICAgICAgcmV0dXJuIGZhY3RvcmllcztcbiAgICB9LCBbXSBhcyBDb21wb25lbnRGYWN0b3J5PGFueT5bXSk7XG4gIH1cblxuICBwcml2YXRlIGNvbXBpbGVUeXBlc1N5bmMoKTogYm9vbGVhbiB7XG4gICAgLy8gQ29tcGlsZSBhbGwgcXVldWVkIGNvbXBvbmVudHMsIGRpcmVjdGl2ZXMsIHBpcGVzLlxuICAgIGxldCBuZWVkc0FzeW5jUmVzb3VyY2VzID0gZmFsc2U7XG4gICAgdGhpcy5wZW5kaW5nQ29tcG9uZW50cy5mb3JFYWNoKChkZWNsYXJhdGlvbikgPT4ge1xuICAgICAgaWYgKGdldEFzeW5jQ2xhc3NNZXRhZGF0YUZuKGRlY2xhcmF0aW9uKSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgYENvbXBvbmVudCAnJHtkZWNsYXJhdGlvbi5uYW1lfScgaGFzIHVucmVzb2x2ZWQgbWV0YWRhdGEuIGAgK1xuICAgICAgICAgICAgYFBsZWFzZSBjYWxsIFxcYGF3YWl0IFRlc3RCZWQuY29tcGlsZUNvbXBvbmVudHMoKVxcYCBiZWZvcmUgcnVubmluZyB0aGlzIHRlc3QuYCxcbiAgICAgICAgKTtcbiAgICAgIH1cblxuICAgICAgbmVlZHNBc3luY1Jlc291cmNlcyA9IG5lZWRzQXN5bmNSZXNvdXJjZXMgfHwgybVpc0NvbXBvbmVudERlZlBlbmRpbmdSZXNvbHV0aW9uKGRlY2xhcmF0aW9uKTtcblxuICAgICAgY29uc3QgbWV0YWRhdGEgPSB0aGlzLnJlc29sdmVycy5jb21wb25lbnQucmVzb2x2ZShkZWNsYXJhdGlvbik7XG4gICAgICBpZiAobWV0YWRhdGEgPT09IG51bGwpIHtcbiAgICAgICAgdGhyb3cgaW52YWxpZFR5cGVFcnJvcihkZWNsYXJhdGlvbi5uYW1lLCAnQ29tcG9uZW50Jyk7XG4gICAgICB9XG5cbiAgICAgIHRoaXMubWF5YmVTdG9yZU5nRGVmKE5HX0NPTVBfREVGLCBkZWNsYXJhdGlvbik7XG4gICAgICBpZiAoVVNFX1JVTlRJTUVfREVQU19UUkFDS0VSX0ZPUl9KSVQpIHtcbiAgICAgICAgZGVwc1RyYWNrZXIuY2xlYXJTY29wZUNhY2hlRm9yKGRlY2xhcmF0aW9uKTtcbiAgICAgIH1cbiAgICAgIGNvbXBpbGVDb21wb25lbnQoZGVjbGFyYXRpb24sIG1ldGFkYXRhKTtcbiAgICB9KTtcbiAgICB0aGlzLnBlbmRpbmdDb21wb25lbnRzLmNsZWFyKCk7XG5cbiAgICB0aGlzLnBlbmRpbmdEaXJlY3RpdmVzLmZvckVhY2goKGRlY2xhcmF0aW9uKSA9PiB7XG4gICAgICBjb25zdCBtZXRhZGF0YSA9IHRoaXMucmVzb2x2ZXJzLmRpcmVjdGl2ZS5yZXNvbHZlKGRlY2xhcmF0aW9uKTtcbiAgICAgIGlmIChtZXRhZGF0YSA9PT0gbnVsbCkge1xuICAgICAgICB0aHJvdyBpbnZhbGlkVHlwZUVycm9yKGRlY2xhcmF0aW9uLm5hbWUsICdEaXJlY3RpdmUnKTtcbiAgICAgIH1cbiAgICAgIHRoaXMubWF5YmVTdG9yZU5nRGVmKE5HX0RJUl9ERUYsIGRlY2xhcmF0aW9uKTtcbiAgICAgIGNvbXBpbGVEaXJlY3RpdmUoZGVjbGFyYXRpb24sIG1ldGFkYXRhKTtcbiAgICB9KTtcbiAgICB0aGlzLnBlbmRpbmdEaXJlY3RpdmVzLmNsZWFyKCk7XG5cbiAgICB0aGlzLnBlbmRpbmdQaXBlcy5mb3JFYWNoKChkZWNsYXJhdGlvbikgPT4ge1xuICAgICAgY29uc3QgbWV0YWRhdGEgPSB0aGlzLnJlc29sdmVycy5waXBlLnJlc29sdmUoZGVjbGFyYXRpb24pO1xuICAgICAgaWYgKG1ldGFkYXRhID09PSBudWxsKSB7XG4gICAgICAgIHRocm93IGludmFsaWRUeXBlRXJyb3IoZGVjbGFyYXRpb24ubmFtZSwgJ1BpcGUnKTtcbiAgICAgIH1cbiAgICAgIHRoaXMubWF5YmVTdG9yZU5nRGVmKE5HX1BJUEVfREVGLCBkZWNsYXJhdGlvbik7XG4gICAgICBjb21waWxlUGlwZShkZWNsYXJhdGlvbiwgbWV0YWRhdGEpO1xuICAgIH0pO1xuICAgIHRoaXMucGVuZGluZ1BpcGVzLmNsZWFyKCk7XG5cbiAgICByZXR1cm4gbmVlZHNBc3luY1Jlc291cmNlcztcbiAgfVxuXG4gIHByaXZhdGUgYXBwbHlUcmFuc2l0aXZlU2NvcGVzKCk6IHZvaWQge1xuICAgIGlmICh0aGlzLm92ZXJyaWRkZW5Nb2R1bGVzLnNpemUgPiAwKSB7XG4gICAgICAvLyBNb2R1bGUgb3ZlcnJpZGVzICh2aWEgYFRlc3RCZWQub3ZlcnJpZGVNb2R1bGVgKSBtaWdodCBhZmZlY3Qgc2NvcGVzIHRoYXQgd2VyZSBwcmV2aW91c2x5XG4gICAgICAvLyBjYWxjdWxhdGVkIGFuZCBzdG9yZWQgaW4gYHRyYW5zaXRpdmVDb21waWxlU2NvcGVzYC4gSWYgbW9kdWxlIG92ZXJyaWRlcyBhcmUgcHJlc2VudCxcbiAgICAgIC8vIGNvbGxlY3QgYWxsIGFmZmVjdGVkIG1vZHVsZXMgYW5kIHJlc2V0IHNjb3BlcyB0byBmb3JjZSB0aGVpciByZS1jYWxjdWxhdGlvbi5cbiAgICAgIGNvbnN0IHRlc3RpbmdNb2R1bGVEZWYgPSAodGhpcy50ZXN0TW9kdWxlVHlwZSBhcyBhbnkpW05HX01PRF9ERUZdO1xuICAgICAgY29uc3QgYWZmZWN0ZWRNb2R1bGVzID0gdGhpcy5jb2xsZWN0TW9kdWxlc0FmZmVjdGVkQnlPdmVycmlkZXModGVzdGluZ01vZHVsZURlZi5pbXBvcnRzKTtcbiAgICAgIGlmIChhZmZlY3RlZE1vZHVsZXMuc2l6ZSA+IDApIHtcbiAgICAgICAgYWZmZWN0ZWRNb2R1bGVzLmZvckVhY2goKG1vZHVsZVR5cGUpID0+IHtcbiAgICAgICAgICBpZiAoIVVTRV9SVU5USU1FX0RFUFNfVFJBQ0tFUl9GT1JfSklUKSB7XG4gICAgICAgICAgICB0aGlzLnN0b3JlRmllbGRPZkRlZk9uVHlwZShtb2R1bGVUeXBlIGFzIGFueSwgTkdfTU9EX0RFRiwgJ3RyYW5zaXRpdmVDb21waWxlU2NvcGVzJyk7XG4gICAgICAgICAgICAobW9kdWxlVHlwZSBhcyBhbnkpW05HX01PRF9ERUZdLnRyYW5zaXRpdmVDb21waWxlU2NvcGVzID0gbnVsbDtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZGVwc1RyYWNrZXIuY2xlYXJTY29wZUNhY2hlRm9yKG1vZHVsZVR5cGUpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgY29uc3QgbW9kdWxlVG9TY29wZSA9IG5ldyBNYXA8VHlwZTxhbnk+IHwgVGVzdGluZ01vZHVsZU92ZXJyaWRlLCBOZ01vZHVsZVRyYW5zaXRpdmVTY29wZXM+KCk7XG4gICAgY29uc3QgZ2V0U2NvcGVPZk1vZHVsZSA9IChcbiAgICAgIG1vZHVsZVR5cGU6IFR5cGU8YW55PiB8IFRlc3RpbmdNb2R1bGVPdmVycmlkZSxcbiAgICApOiBOZ01vZHVsZVRyYW5zaXRpdmVTY29wZXMgPT4ge1xuICAgICAgaWYgKCFtb2R1bGVUb1Njb3BlLmhhcyhtb2R1bGVUeXBlKSkge1xuICAgICAgICBjb25zdCBpc1Rlc3RpbmdNb2R1bGUgPSBpc1Rlc3RpbmdNb2R1bGVPdmVycmlkZShtb2R1bGVUeXBlKTtcbiAgICAgICAgY29uc3QgcmVhbFR5cGUgPSBpc1Rlc3RpbmdNb2R1bGUgPyB0aGlzLnRlc3RNb2R1bGVUeXBlIDogKG1vZHVsZVR5cGUgYXMgVHlwZTxhbnk+KTtcbiAgICAgICAgbW9kdWxlVG9TY29wZS5zZXQobW9kdWxlVHlwZSwgdHJhbnNpdGl2ZVNjb3Blc0ZvcihyZWFsVHlwZSkpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIG1vZHVsZVRvU2NvcGUuZ2V0KG1vZHVsZVR5cGUpITtcbiAgICB9O1xuXG4gICAgdGhpcy5jb21wb25lbnRUb01vZHVsZVNjb3BlLmZvckVhY2goKG1vZHVsZVR5cGUsIGNvbXBvbmVudFR5cGUpID0+IHtcbiAgICAgIGlmIChtb2R1bGVUeXBlICE9PSBudWxsKSB7XG4gICAgICAgIGNvbnN0IG1vZHVsZVNjb3BlID0gZ2V0U2NvcGVPZk1vZHVsZShtb2R1bGVUeXBlKTtcbiAgICAgICAgdGhpcy5zdG9yZUZpZWxkT2ZEZWZPblR5cGUoY29tcG9uZW50VHlwZSwgTkdfQ09NUF9ERUYsICdkaXJlY3RpdmVEZWZzJyk7XG4gICAgICAgIHRoaXMuc3RvcmVGaWVsZE9mRGVmT25UeXBlKGNvbXBvbmVudFR5cGUsIE5HX0NPTVBfREVGLCAncGlwZURlZnMnKTtcbiAgICAgICAgcGF0Y2hDb21wb25lbnREZWZXaXRoU2NvcGUoZ2V0Q29tcG9uZW50RGVmKGNvbXBvbmVudFR5cGUpISwgbW9kdWxlU2NvcGUpO1xuICAgICAgfVxuICAgICAgLy8gYHRWaWV3YCB0aGF0IGlzIHN0b3JlZCBvbiBjb21wb25lbnQgZGVmIGNvbnRhaW5zIGluZm9ybWF0aW9uIGFib3V0IGRpcmVjdGl2ZXMgYW5kIHBpcGVzXG4gICAgICAvLyB0aGF0IGFyZSBpbiB0aGUgc2NvcGUgb2YgdGhpcyBjb21wb25lbnQuIFBhdGNoaW5nIGNvbXBvbmVudCBzY29wZSB3aWxsIGNhdXNlIGB0Vmlld2AgdG8gYmVcbiAgICAgIC8vIGNoYW5nZWQuIFN0b3JlIG9yaWdpbmFsIGB0Vmlld2AgYmVmb3JlIHBhdGNoaW5nIHNjb3BlLCBzbyB0aGUgYHRWaWV3YCAoaW5jbHVkaW5nIHNjb3BlXG4gICAgICAvLyBpbmZvcm1hdGlvbikgaXMgcmVzdG9yZWQgYmFjayB0byBpdHMgcHJldmlvdXMvb3JpZ2luYWwgc3RhdGUgYmVmb3JlIHJ1bm5pbmcgbmV4dCB0ZXN0LlxuICAgICAgLy8gUmVzZXR0aW5nIGB0Vmlld2AgaXMgYWxzbyBuZWVkZWQgZm9yIGNhc2VzIHdoZW4gd2UgYXBwbHkgcHJvdmlkZXIgb3ZlcnJpZGVzIGFuZCB0aG9zZVxuICAgICAgLy8gcHJvdmlkZXJzIGFyZSBkZWZpbmVkIG9uIGNvbXBvbmVudCdzIGxldmVsLCBpbiB3aGljaCBjYXNlIHRoZXkgbWF5IGVuZCB1cCBpbmNsdWRlZCBpbnRvXG4gICAgICAvLyBgdFZpZXcuYmx1ZXByaW50YC5cbiAgICAgIHRoaXMuc3RvcmVGaWVsZE9mRGVmT25UeXBlKGNvbXBvbmVudFR5cGUsIE5HX0NPTVBfREVGLCAndFZpZXcnKTtcbiAgICB9KTtcblxuICAgIHRoaXMuY29tcG9uZW50VG9Nb2R1bGVTY29wZS5jbGVhcigpO1xuICB9XG5cbiAgcHJpdmF0ZSBhcHBseVByb3ZpZGVyT3ZlcnJpZGVzKCk6IHZvaWQge1xuICAgIGNvbnN0IG1heWJlQXBwbHlPdmVycmlkZXMgPSAoZmllbGQ6IHN0cmluZykgPT4gKHR5cGU6IFR5cGU8YW55PikgPT4ge1xuICAgICAgY29uc3QgcmVzb2x2ZXIgPSBmaWVsZCA9PT0gTkdfQ09NUF9ERUYgPyB0aGlzLnJlc29sdmVycy5jb21wb25lbnQgOiB0aGlzLnJlc29sdmVycy5kaXJlY3RpdmU7XG4gICAgICBjb25zdCBtZXRhZGF0YSA9IHJlc29sdmVyLnJlc29sdmUodHlwZSkhO1xuICAgICAgaWYgKHRoaXMuaGFzUHJvdmlkZXJPdmVycmlkZXMobWV0YWRhdGEucHJvdmlkZXJzKSkge1xuICAgICAgICB0aGlzLnBhdGNoRGVmV2l0aFByb3ZpZGVyT3ZlcnJpZGVzKHR5cGUsIGZpZWxkKTtcbiAgICAgIH1cbiAgICB9O1xuICAgIHRoaXMuc2VlbkNvbXBvbmVudHMuZm9yRWFjaChtYXliZUFwcGx5T3ZlcnJpZGVzKE5HX0NPTVBfREVGKSk7XG4gICAgdGhpcy5zZWVuRGlyZWN0aXZlcy5mb3JFYWNoKG1heWJlQXBwbHlPdmVycmlkZXMoTkdfRElSX0RFRikpO1xuXG4gICAgdGhpcy5zZWVuQ29tcG9uZW50cy5jbGVhcigpO1xuICAgIHRoaXMuc2VlbkRpcmVjdGl2ZXMuY2xlYXIoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBcHBsaWVzIHByb3ZpZGVyIG92ZXJyaWRlcyB0byBhIGdpdmVuIHR5cGUgKGVpdGhlciBhbiBOZ01vZHVsZSBvciBhIHN0YW5kYWxvbmUgY29tcG9uZW50KVxuICAgKiBhbmQgYWxsIGltcG9ydGVkIE5nTW9kdWxlcyBhbmQgc3RhbmRhbG9uZSBjb21wb25lbnRzIHJlY3Vyc2l2ZWx5LlxuICAgKi9cbiAgcHJpdmF0ZSBhcHBseVByb3ZpZGVyT3ZlcnJpZGVzSW5TY29wZSh0eXBlOiBUeXBlPGFueT4pOiB2b2lkIHtcbiAgICBjb25zdCBoYXNTY29wZSA9IGlzU3RhbmRhbG9uZUNvbXBvbmVudCh0eXBlKSB8fCBpc05nTW9kdWxlKHR5cGUpO1xuXG4gICAgLy8gVGhlIGZ1bmN0aW9uIGNhbiBiZSByZS1lbnRlcmVkIHJlY3Vyc2l2ZWx5IHdoaWxlIGluc3BlY3RpbmcgZGVwZW5kZW5jaWVzXG4gICAgLy8gb2YgYW4gTmdNb2R1bGUgb3IgYSBzdGFuZGFsb25lIGNvbXBvbmVudC4gRXhpdCBlYXJseSBpZiB3ZSBjb21lIGFjcm9zcyBhXG4gICAgLy8gdHlwZSB0aGF0IGNhbiBub3QgaGF2ZSBhIHNjb3BlIChkaXJlY3RpdmUgb3IgcGlwZSkgb3IgdGhlIHR5cGUgaXMgYWxyZWFkeVxuICAgIC8vIHByb2Nlc3NlZCBlYXJsaWVyLlxuICAgIGlmICghaGFzU2NvcGUgfHwgdGhpcy5zY29wZXNXaXRoT3ZlcnJpZGRlblByb3ZpZGVycy5oYXModHlwZSkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy5zY29wZXNXaXRoT3ZlcnJpZGRlblByb3ZpZGVycy5hZGQodHlwZSk7XG5cbiAgICAvLyBOT1RFOiB0aGUgbGluZSBiZWxvdyB0cmlnZ2VycyBKSVQgY29tcGlsYXRpb24gb2YgdGhlIG1vZHVsZSBpbmplY3RvcixcbiAgICAvLyB3aGljaCBhbHNvIGludm9rZXMgdmVyaWZpY2F0aW9uIG9mIHRoZSBOZ01vZHVsZSBzZW1hbnRpY3MsIHdoaWNoIHByb2R1Y2VzXG4gICAgLy8gZGV0YWlsZWQgZXJyb3IgbWVzc2FnZXMuIFRoZSBmYWN0IHRoYXQgdGhlIGNvZGUgcmVsaWVzIG9uIHRoaXMgbGluZSBiZWluZ1xuICAgIC8vIHByZXNlbnQgaGVyZSBpcyBzdXNwaWNpb3VzIGFuZCBzaG91bGQgYmUgcmVmYWN0b3JlZCBpbiBhIHdheSB0aGF0IHRoZSBsaW5lXG4gICAgLy8gYmVsb3cgY2FuIGJlIG1vdmVkIChmb3IgZXguIGFmdGVyIGFuIGVhcmx5IGV4aXQgY2hlY2sgYmVsb3cpLlxuICAgIGNvbnN0IGluamVjdG9yRGVmOiBhbnkgPSAodHlwZSBhcyBhbnkpW05HX0lOSl9ERUZdO1xuXG4gICAgLy8gTm8gcHJvdmlkZXIgb3ZlcnJpZGVzLCBleGl0IGVhcmx5LlxuICAgIGlmICh0aGlzLnByb3ZpZGVyT3ZlcnJpZGVzQnlUb2tlbi5zaXplID09PSAwKSByZXR1cm47XG5cbiAgICBpZiAoaXNTdGFuZGFsb25lQ29tcG9uZW50KHR5cGUpKSB7XG4gICAgICAvLyBWaXNpdCBhbGwgY29tcG9uZW50IGRlcGVuZGVuY2llcyBhbmQgb3ZlcnJpZGUgcHJvdmlkZXJzIHRoZXJlLlxuICAgICAgY29uc3QgZGVmID0gZ2V0Q29tcG9uZW50RGVmKHR5cGUpO1xuICAgICAgY29uc3QgZGVwZW5kZW5jaWVzID0gbWF5YmVVbndyYXBGbihkZWYuZGVwZW5kZW5jaWVzID8/IFtdKTtcbiAgICAgIGZvciAoY29uc3QgZGVwZW5kZW5jeSBvZiBkZXBlbmRlbmNpZXMpIHtcbiAgICAgICAgdGhpcy5hcHBseVByb3ZpZGVyT3ZlcnJpZGVzSW5TY29wZShkZXBlbmRlbmN5KTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgcHJvdmlkZXJzOiBBcnJheTxQcm92aWRlciB8IEludGVybmFsRW52aXJvbm1lbnRQcm92aWRlcnM+ID0gW1xuICAgICAgICAuLi5pbmplY3RvckRlZi5wcm92aWRlcnMsXG4gICAgICAgIC4uLih0aGlzLnByb3ZpZGVyT3ZlcnJpZGVzQnlNb2R1bGUuZ2V0KHR5cGUgYXMgSW5qZWN0b3JUeXBlPGFueT4pIHx8IFtdKSxcbiAgICAgIF07XG4gICAgICBpZiAodGhpcy5oYXNQcm92aWRlck92ZXJyaWRlcyhwcm92aWRlcnMpKSB7XG4gICAgICAgIHRoaXMubWF5YmVTdG9yZU5nRGVmKE5HX0lOSl9ERUYsIHR5cGUpO1xuXG4gICAgICAgIHRoaXMuc3RvcmVGaWVsZE9mRGVmT25UeXBlKHR5cGUsIE5HX0lOSl9ERUYsICdwcm92aWRlcnMnKTtcbiAgICAgICAgaW5qZWN0b3JEZWYucHJvdmlkZXJzID0gdGhpcy5nZXRPdmVycmlkZGVuUHJvdmlkZXJzKHByb3ZpZGVycyk7XG4gICAgICB9XG5cbiAgICAgIC8vIEFwcGx5IHByb3ZpZGVyIG92ZXJyaWRlcyB0byBpbXBvcnRlZCBtb2R1bGVzIHJlY3Vyc2l2ZWx5XG4gICAgICBjb25zdCBtb2R1bGVEZWYgPSAodHlwZSBhcyBhbnkpW05HX01PRF9ERUZdO1xuICAgICAgY29uc3QgaW1wb3J0cyA9IG1heWJlVW53cmFwRm4obW9kdWxlRGVmLmltcG9ydHMpO1xuICAgICAgZm9yIChjb25zdCBpbXBvcnRlZE1vZHVsZSBvZiBpbXBvcnRzKSB7XG4gICAgICAgIHRoaXMuYXBwbHlQcm92aWRlck92ZXJyaWRlc0luU2NvcGUoaW1wb3J0ZWRNb2R1bGUpO1xuICAgICAgfVxuICAgICAgLy8gQWxzbyBvdmVycmlkZSB0aGUgcHJvdmlkZXJzIG9uIGFueSBNb2R1bGVXaXRoUHJvdmlkZXJzIGltcG9ydHMgc2luY2UgdGhvc2UgZG9uJ3QgYXBwZWFyIGluXG4gICAgICAvLyB0aGUgbW9kdWxlRGVmLlxuICAgICAgZm9yIChjb25zdCBpbXBvcnRlZE1vZHVsZSBvZiBmbGF0dGVuKGluamVjdG9yRGVmLmltcG9ydHMpKSB7XG4gICAgICAgIGlmIChpc01vZHVsZVdpdGhQcm92aWRlcnMoaW1wb3J0ZWRNb2R1bGUpKSB7XG4gICAgICAgICAgdGhpcy5kZWZDbGVhbnVwT3BzLnB1c2goe1xuICAgICAgICAgICAgb2JqZWN0OiBpbXBvcnRlZE1vZHVsZSxcbiAgICAgICAgICAgIGZpZWxkTmFtZTogJ3Byb3ZpZGVycycsXG4gICAgICAgICAgICBvcmlnaW5hbFZhbHVlOiBpbXBvcnRlZE1vZHVsZS5wcm92aWRlcnMsXG4gICAgICAgICAgfSk7XG4gICAgICAgICAgaW1wb3J0ZWRNb2R1bGUucHJvdmlkZXJzID0gdGhpcy5nZXRPdmVycmlkZGVuUHJvdmlkZXJzKFxuICAgICAgICAgICAgaW1wb3J0ZWRNb2R1bGUucHJvdmlkZXJzIGFzIEFycmF5PFByb3ZpZGVyIHwgSW50ZXJuYWxFbnZpcm9ubWVudFByb3ZpZGVycz4sXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgcGF0Y2hDb21wb25lbnRzV2l0aEV4aXN0aW5nU3R5bGVzKCk6IHZvaWQge1xuICAgIHRoaXMuZXhpc3RpbmdDb21wb25lbnRTdHlsZXMuZm9yRWFjaChcbiAgICAgIChzdHlsZXMsIHR5cGUpID0+ICgodHlwZSBhcyBhbnkpW05HX0NPTVBfREVGXS5zdHlsZXMgPSBzdHlsZXMpLFxuICAgICk7XG4gICAgdGhpcy5leGlzdGluZ0NvbXBvbmVudFN0eWxlcy5jbGVhcigpO1xuICB9XG5cbiAgcHJpdmF0ZSBxdWV1ZVR5cGVBcnJheShhcnI6IGFueVtdLCBtb2R1bGVUeXBlOiBUeXBlPGFueT4gfCBUZXN0aW5nTW9kdWxlT3ZlcnJpZGUpOiB2b2lkIHtcbiAgICBmb3IgKGNvbnN0IHZhbHVlIG9mIGFycikge1xuICAgICAgaWYgKEFycmF5LmlzQXJyYXkodmFsdWUpKSB7XG4gICAgICAgIHRoaXMucXVldWVUeXBlQXJyYXkodmFsdWUsIG1vZHVsZVR5cGUpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5xdWV1ZVR5cGUodmFsdWUsIG1vZHVsZVR5cGUpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgcmVjb21waWxlTmdNb2R1bGUobmdNb2R1bGU6IFR5cGU8YW55PiwgbWV0YWRhdGE6IE5nTW9kdWxlKTogdm9pZCB7XG4gICAgLy8gQ2FjaGUgdGhlIGluaXRpYWwgbmdNb2R1bGVEZWYgYXMgaXQgd2lsbCBiZSBvdmVyd3JpdHRlbi5cbiAgICB0aGlzLm1heWJlU3RvcmVOZ0RlZihOR19NT0RfREVGLCBuZ01vZHVsZSk7XG4gICAgdGhpcy5tYXliZVN0b3JlTmdEZWYoTkdfSU5KX0RFRiwgbmdNb2R1bGUpO1xuXG4gICAgY29tcGlsZU5nTW9kdWxlRGVmcyhuZ01vZHVsZSBhcyBOZ01vZHVsZVR5cGU8YW55PiwgbWV0YWRhdGEpO1xuICB9XG5cbiAgcHJpdmF0ZSBtYXliZVJlZ2lzdGVyQ29tcG9uZW50V2l0aEFzeW5jTWV0YWRhdGEodHlwZTogVHlwZTx1bmtub3duPikge1xuICAgIGNvbnN0IGFzeW5jTWV0YWRhdGFGbiA9IGdldEFzeW5jQ2xhc3NNZXRhZGF0YUZuKHR5cGUpO1xuICAgIGlmIChhc3luY01ldGFkYXRhRm4pIHtcbiAgICAgIHRoaXMuY29tcG9uZW50c1dpdGhBc3luY01ldGFkYXRhLmFkZCh0eXBlKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIHF1ZXVlVHlwZSh0eXBlOiBUeXBlPGFueT4sIG1vZHVsZVR5cGU6IFR5cGU8YW55PiB8IFRlc3RpbmdNb2R1bGVPdmVycmlkZSB8IG51bGwpOiB2b2lkIHtcbiAgICAvLyBJZiB0aGlzIGlzIGEgY29tcG9uZW50IHdpdGggYXN5bmMgbWV0YWRhdGEgKGkuZS4gYSBjb21wb25lbnQgd2l0aCBhIGBAZGVmZXJgIGJsb2NrXG4gICAgLy8gaW4gYSB0ZW1wbGF0ZSkgLSBzdG9yZSBpdCBmb3IgZnV0dXJlIHByb2Nlc3NpbmcuXG4gICAgdGhpcy5tYXliZVJlZ2lzdGVyQ29tcG9uZW50V2l0aEFzeW5jTWV0YWRhdGEodHlwZSk7XG5cbiAgICBjb25zdCBjb21wb25lbnQgPSB0aGlzLnJlc29sdmVycy5jb21wb25lbnQucmVzb2x2ZSh0eXBlKTtcbiAgICBpZiAoY29tcG9uZW50KSB7XG4gICAgICAvLyBDaGVjayB3aGV0aGVyIGEgZ2l2ZSBUeXBlIGhhcyByZXNwZWN0aXZlIE5HIGRlZiAoybVjbXApIGFuZCBjb21waWxlIGlmIGRlZiBpc1xuICAgICAgLy8gbWlzc2luZy4gVGhhdCBtaWdodCBoYXBwZW4gaW4gY2FzZSBhIGNsYXNzIHdpdGhvdXQgYW55IEFuZ3VsYXIgZGVjb3JhdG9ycyBleHRlbmRzIGFub3RoZXJcbiAgICAgIC8vIGNsYXNzIHdoZXJlIENvbXBvbmVudC9EaXJlY3RpdmUvUGlwZSBkZWNvcmF0b3IgaXMgZGVmaW5lZC5cbiAgICAgIGlmICjJtWlzQ29tcG9uZW50RGVmUGVuZGluZ1Jlc29sdXRpb24odHlwZSkgfHwgIXR5cGUuaGFzT3duUHJvcGVydHkoTkdfQ09NUF9ERUYpKSB7XG4gICAgICAgIHRoaXMucGVuZGluZ0NvbXBvbmVudHMuYWRkKHR5cGUpO1xuICAgICAgfVxuICAgICAgdGhpcy5zZWVuQ29tcG9uZW50cy5hZGQodHlwZSk7XG5cbiAgICAgIC8vIEtlZXAgdHJhY2sgb2YgdGhlIG1vZHVsZSB3aGljaCBkZWNsYXJlcyB0aGlzIGNvbXBvbmVudCwgc28gbGF0ZXIgdGhlIGNvbXBvbmVudCdzIHNjb3BlXG4gICAgICAvLyBjYW4gYmUgc2V0IGNvcnJlY3RseS4gSWYgdGhlIGNvbXBvbmVudCBoYXMgYWxyZWFkeSBiZWVuIHJlY29yZGVkIGhlcmUsIHRoZW4gb25lIG9mIHNldmVyYWxcbiAgICAgIC8vIGNhc2VzIGlzIHRydWU6XG4gICAgICAvLyAqIHRoZSBtb2R1bGUgY29udGFpbmluZyB0aGUgY29tcG9uZW50IHdhcyBpbXBvcnRlZCBtdWx0aXBsZSB0aW1lcyAoY29tbW9uKS5cbiAgICAgIC8vICogdGhlIGNvbXBvbmVudCBpcyBkZWNsYXJlZCBpbiBtdWx0aXBsZSBtb2R1bGVzICh3aGljaCBpcyBhbiBlcnJvcikuXG4gICAgICAvLyAqIHRoZSBjb21wb25lbnQgd2FzIGluICdkZWNsYXJhdGlvbnMnIG9mIHRoZSB0ZXN0aW5nIG1vZHVsZSwgYW5kIGFsc28gaW4gYW4gaW1wb3J0ZWQgbW9kdWxlXG4gICAgICAvLyAgIGluIHdoaWNoIGNhc2UgdGhlIG1vZHVsZSBzY29wZSB3aWxsIGJlIFRlc3RpbmdNb2R1bGVPdmVycmlkZS5ERUNMQVJBVElPTi5cbiAgICAgIC8vICogb3ZlcnJpZGVUZW1wbGF0ZVVzaW5nVGVzdGluZ01vZHVsZSB3YXMgY2FsbGVkIGZvciB0aGUgY29tcG9uZW50IGluIHdoaWNoIGNhc2UgdGhlIG1vZHVsZVxuICAgICAgLy8gICBzY29wZSB3aWxsIGJlIFRlc3RpbmdNb2R1bGVPdmVycmlkZS5PVkVSUklERV9URU1QTEFURS5cbiAgICAgIC8vXG4gICAgICAvLyBJZiB0aGUgY29tcG9uZW50IHdhcyBwcmV2aW91c2x5IGluIHRoZSB0ZXN0aW5nIG1vZHVsZSdzICdkZWNsYXJhdGlvbnMnIChtZWFuaW5nIHRoZVxuICAgICAgLy8gY3VycmVudCB2YWx1ZSBpcyBUZXN0aW5nTW9kdWxlT3ZlcnJpZGUuREVDTEFSQVRJT04pLCB0aGVuIGBtb2R1bGVUeXBlYCBpcyB0aGUgY29tcG9uZW50J3NcbiAgICAgIC8vIHJlYWwgbW9kdWxlLCB3aGljaCB3YXMgaW1wb3J0ZWQuIFRoaXMgcGF0dGVybiBpcyB1bmRlcnN0b29kIHRvIG1lYW4gdGhhdCB0aGUgY29tcG9uZW50XG4gICAgICAvLyBzaG91bGQgdXNlIGl0cyBvcmlnaW5hbCBzY29wZSwgYnV0IHRoYXQgdGhlIHRlc3RpbmcgbW9kdWxlIHNob3VsZCBhbHNvIGNvbnRhaW4gdGhlXG4gICAgICAvLyBjb21wb25lbnQgaW4gaXRzIHNjb3BlLlxuICAgICAgaWYgKFxuICAgICAgICAhdGhpcy5jb21wb25lbnRUb01vZHVsZVNjb3BlLmhhcyh0eXBlKSB8fFxuICAgICAgICB0aGlzLmNvbXBvbmVudFRvTW9kdWxlU2NvcGUuZ2V0KHR5cGUpID09PSBUZXN0aW5nTW9kdWxlT3ZlcnJpZGUuREVDTEFSQVRJT05cbiAgICAgICkge1xuICAgICAgICB0aGlzLmNvbXBvbmVudFRvTW9kdWxlU2NvcGUuc2V0KHR5cGUsIG1vZHVsZVR5cGUpO1xuICAgICAgfVxuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGRpcmVjdGl2ZSA9IHRoaXMucmVzb2x2ZXJzLmRpcmVjdGl2ZS5yZXNvbHZlKHR5cGUpO1xuICAgIGlmIChkaXJlY3RpdmUpIHtcbiAgICAgIGlmICghdHlwZS5oYXNPd25Qcm9wZXJ0eShOR19ESVJfREVGKSkge1xuICAgICAgICB0aGlzLnBlbmRpbmdEaXJlY3RpdmVzLmFkZCh0eXBlKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuc2VlbkRpcmVjdGl2ZXMuYWRkKHR5cGUpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHBpcGUgPSB0aGlzLnJlc29sdmVycy5waXBlLnJlc29sdmUodHlwZSk7XG4gICAgaWYgKHBpcGUgJiYgIXR5cGUuaGFzT3duUHJvcGVydHkoTkdfUElQRV9ERUYpKSB7XG4gICAgICB0aGlzLnBlbmRpbmdQaXBlcy5hZGQodHlwZSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBxdWV1ZVR5cGVzRnJvbU1vZHVsZXNBcnJheShhcnI6IGFueVtdKTogdm9pZCB7XG4gICAgLy8gQmVjYXVzZSB3ZSBtYXkgZW5jb3VudGVyIHRoZSBzYW1lIE5nTW9kdWxlIG9yIGEgc3RhbmRhbG9uZSBDb21wb25lbnQgd2hpbGUgcHJvY2Vzc2luZ1xuICAgIC8vIHRoZSBkZXBlbmRlbmNpZXMgb2YgYW4gTmdNb2R1bGUgb3IgYSBzdGFuZGFsb25lIENvbXBvbmVudCwgd2UgY2FjaGUgdGhlbSBpbiB0aGlzIHNldCBzbyB3ZVxuICAgIC8vIGNhbiBza2lwIG9uZXMgdGhhdCBoYXZlIGFscmVhZHkgYmVlbiBzZWVuIGVuY291bnRlcmVkLiBJbiBzb21lIHRlc3Qgc2V0dXBzLCB0aGlzIGNhY2hpbmdcbiAgICAvLyByZXN1bHRlZCBpbiAxMFggcnVudGltZSBpbXByb3ZlbWVudC5cbiAgICBjb25zdCBwcm9jZXNzZWREZWZzID0gbmV3IFNldCgpO1xuICAgIGNvbnN0IHF1ZXVlVHlwZXNGcm9tTW9kdWxlc0FycmF5UmVjdXIgPSAoYXJyOiBhbnlbXSk6IHZvaWQgPT4ge1xuICAgICAgZm9yIChjb25zdCB2YWx1ZSBvZiBhcnIpIHtcbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkodmFsdWUpKSB7XG4gICAgICAgICAgcXVldWVUeXBlc0Zyb21Nb2R1bGVzQXJyYXlSZWN1cih2YWx1ZSk7XG4gICAgICAgIH0gZWxzZSBpZiAoaGFzTmdNb2R1bGVEZWYodmFsdWUpKSB7XG4gICAgICAgICAgY29uc3QgZGVmID0gdmFsdWUuybVtb2Q7XG4gICAgICAgICAgaWYgKHByb2Nlc3NlZERlZnMuaGFzKGRlZikpIHtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgICBwcm9jZXNzZWREZWZzLmFkZChkZWYpO1xuICAgICAgICAgIC8vIExvb2sgdGhyb3VnaCBkZWNsYXJhdGlvbnMsIGltcG9ydHMsIGFuZCBleHBvcnRzLCBhbmQgcXVldWVcbiAgICAgICAgICAvLyBldmVyeXRoaW5nIGZvdW5kIHRoZXJlLlxuICAgICAgICAgIHRoaXMucXVldWVUeXBlQXJyYXkobWF5YmVVbndyYXBGbihkZWYuZGVjbGFyYXRpb25zKSwgdmFsdWUpO1xuICAgICAgICAgIHF1ZXVlVHlwZXNGcm9tTW9kdWxlc0FycmF5UmVjdXIobWF5YmVVbndyYXBGbihkZWYuaW1wb3J0cykpO1xuICAgICAgICAgIHF1ZXVlVHlwZXNGcm9tTW9kdWxlc0FycmF5UmVjdXIobWF5YmVVbndyYXBGbihkZWYuZXhwb3J0cykpO1xuICAgICAgICB9IGVsc2UgaWYgKGlzTW9kdWxlV2l0aFByb3ZpZGVycyh2YWx1ZSkpIHtcbiAgICAgICAgICBxdWV1ZVR5cGVzRnJvbU1vZHVsZXNBcnJheVJlY3VyKFt2YWx1ZS5uZ01vZHVsZV0pO1xuICAgICAgICB9IGVsc2UgaWYgKGlzU3RhbmRhbG9uZUNvbXBvbmVudCh2YWx1ZSkpIHtcbiAgICAgICAgICB0aGlzLnF1ZXVlVHlwZSh2YWx1ZSwgbnVsbCk7XG4gICAgICAgICAgY29uc3QgZGVmID0gZ2V0Q29tcG9uZW50RGVmKHZhbHVlKTtcblxuICAgICAgICAgIGlmIChwcm9jZXNzZWREZWZzLmhhcyhkZWYpKSB7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcHJvY2Vzc2VkRGVmcy5hZGQoZGVmKTtcblxuICAgICAgICAgIGNvbnN0IGRlcGVuZGVuY2llcyA9IG1heWJlVW53cmFwRm4oZGVmLmRlcGVuZGVuY2llcyA/PyBbXSk7XG4gICAgICAgICAgZGVwZW5kZW5jaWVzLmZvckVhY2goKGRlcGVuZGVuY3kpID0+IHtcbiAgICAgICAgICAgIC8vIE5vdGU6IGluIEFPVCwgdGhlIGBkZXBlbmRlbmNpZXNgIG1pZ2h0IGFsc28gY29udGFpbiByZWd1bGFyXG4gICAgICAgICAgICAvLyAoTmdNb2R1bGUtYmFzZWQpIENvbXBvbmVudCwgRGlyZWN0aXZlIGFuZCBQaXBlcywgc28gd2UgaGFuZGxlXG4gICAgICAgICAgICAvLyB0aGVtIHNlcGFyYXRlbHkgYW5kIHByb2NlZWQgd2l0aCByZWN1cnNpdmUgcHJvY2VzcyBmb3Igc3RhbmRhbG9uZVxuICAgICAgICAgICAgLy8gQ29tcG9uZW50cyBhbmQgTmdNb2R1bGVzIG9ubHkuXG4gICAgICAgICAgICBpZiAoaXNTdGFuZGFsb25lQ29tcG9uZW50KGRlcGVuZGVuY3kpIHx8IGhhc05nTW9kdWxlRGVmKGRlcGVuZGVuY3kpKSB7XG4gICAgICAgICAgICAgIHF1ZXVlVHlwZXNGcm9tTW9kdWxlc0FycmF5UmVjdXIoW2RlcGVuZGVuY3ldKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHRoaXMucXVldWVUeXBlKGRlcGVuZGVuY3ksIG51bGwpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfTtcbiAgICBxdWV1ZVR5cGVzRnJvbU1vZHVsZXNBcnJheVJlY3VyKGFycik7XG4gIH1cblxuICAvLyBXaGVuIG1vZHVsZSBvdmVycmlkZXMgKHZpYSBgVGVzdEJlZC5vdmVycmlkZU1vZHVsZWApIGFyZSBwcmVzZW50LCBpdCBtaWdodCBhZmZlY3QgYWxsIG1vZHVsZXNcbiAgLy8gdGhhdCBpbXBvcnQgKGV2ZW4gdHJhbnNpdGl2ZWx5KSBhbiBvdmVycmlkZGVuIG9uZS4gRm9yIGFsbCBhZmZlY3RlZCBtb2R1bGVzIHdlIG5lZWQgdG9cbiAgLy8gcmVjYWxjdWxhdGUgdGhlaXIgc2NvcGVzIGZvciBhIGdpdmVuIHRlc3QgcnVuIGFuZCByZXN0b3JlIG9yaWdpbmFsIHNjb3BlcyBhdCB0aGUgZW5kLiBUaGUgZ29hbFxuICAvLyBvZiB0aGlzIGZ1bmN0aW9uIGlzIHRvIGNvbGxlY3QgYWxsIGFmZmVjdGVkIG1vZHVsZXMgaW4gYSBzZXQgZm9yIGZ1cnRoZXIgcHJvY2Vzc2luZy4gRXhhbXBsZTpcbiAgLy8gaWYgd2UgaGF2ZSB0aGUgZm9sbG93aW5nIG1vZHVsZSBoaWVyYXJjaHk6IEEgLT4gQiAtPiBDICh3aGVyZSBgLT5gIG1lYW5zIGBpbXBvcnRzYCkgYW5kIG1vZHVsZVxuICAvLyBgQ2AgaXMgb3ZlcnJpZGRlbiwgd2UgY29uc2lkZXIgYEFgIGFuZCBgQmAgYXMgYWZmZWN0ZWQsIHNpbmNlIHRoZWlyIHNjb3BlcyBtaWdodCBiZWNvbWVcbiAgLy8gaW52YWxpZGF0ZWQgd2l0aCB0aGUgb3ZlcnJpZGUuXG4gIHByaXZhdGUgY29sbGVjdE1vZHVsZXNBZmZlY3RlZEJ5T3ZlcnJpZGVzKGFycjogYW55W10pOiBTZXQ8TmdNb2R1bGVUeXBlPGFueT4+IHtcbiAgICBjb25zdCBzZWVuTW9kdWxlcyA9IG5ldyBTZXQ8TmdNb2R1bGVUeXBlPGFueT4+KCk7XG4gICAgY29uc3QgYWZmZWN0ZWRNb2R1bGVzID0gbmV3IFNldDxOZ01vZHVsZVR5cGU8YW55Pj4oKTtcbiAgICBjb25zdCBjYWxjQWZmZWN0ZWRNb2R1bGVzUmVjdXIgPSAoYXJyOiBhbnlbXSwgcGF0aDogTmdNb2R1bGVUeXBlPGFueT5bXSk6IHZvaWQgPT4ge1xuICAgICAgZm9yIChjb25zdCB2YWx1ZSBvZiBhcnIpIHtcbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkodmFsdWUpKSB7XG4gICAgICAgICAgLy8gSWYgdGhlIHZhbHVlIGlzIGFuIGFycmF5LCBqdXN0IGZsYXR0ZW4gaXQgKGJ5IGludm9raW5nIHRoaXMgZnVuY3Rpb24gcmVjdXJzaXZlbHkpLFxuICAgICAgICAgIC8vIGtlZXBpbmcgXCJwYXRoXCIgdGhlIHNhbWUuXG4gICAgICAgICAgY2FsY0FmZmVjdGVkTW9kdWxlc1JlY3VyKHZhbHVlLCBwYXRoKTtcbiAgICAgICAgfSBlbHNlIGlmIChoYXNOZ01vZHVsZURlZih2YWx1ZSkpIHtcbiAgICAgICAgICBpZiAoc2Vlbk1vZHVsZXMuaGFzKHZhbHVlKSkge1xuICAgICAgICAgICAgLy8gSWYgd2UndmUgc2VlbiB0aGlzIG1vZHVsZSBiZWZvcmUgYW5kIGl0J3MgaW5jbHVkZWQgaW50byBcImFmZmVjdGVkIG1vZHVsZXNcIiBsaXN0LCBtYXJrXG4gICAgICAgICAgICAvLyB0aGUgd2hvbGUgcGF0aCB0aGF0IGxlYWRzIHRvIHRoYXQgbW9kdWxlIGFzIGFmZmVjdGVkLCBidXQgZG8gbm90IGRlc2NlbmQgaW50byBpdHNcbiAgICAgICAgICAgIC8vIGltcG9ydHMsIHNpbmNlIHdlIGFscmVhZHkgZXhhbWluZWQgdGhlbSBiZWZvcmUuXG4gICAgICAgICAgICBpZiAoYWZmZWN0ZWRNb2R1bGVzLmhhcyh2YWx1ZSkpIHtcbiAgICAgICAgICAgICAgcGF0aC5mb3JFYWNoKChpdGVtKSA9PiBhZmZlY3RlZE1vZHVsZXMuYWRkKGl0ZW0pKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgICBzZWVuTW9kdWxlcy5hZGQodmFsdWUpO1xuICAgICAgICAgIGlmICh0aGlzLm92ZXJyaWRkZW5Nb2R1bGVzLmhhcyh2YWx1ZSkpIHtcbiAgICAgICAgICAgIHBhdGguZm9yRWFjaCgoaXRlbSkgPT4gYWZmZWN0ZWRNb2R1bGVzLmFkZChpdGVtKSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIC8vIEV4YW1pbmUgbW9kdWxlIGltcG9ydHMgcmVjdXJzaXZlbHkgdG8gbG9vayBmb3Igb3ZlcnJpZGRlbiBtb2R1bGVzLlxuICAgICAgICAgIGNvbnN0IG1vZHVsZURlZiA9ICh2YWx1ZSBhcyBhbnkpW05HX01PRF9ERUZdO1xuICAgICAgICAgIGNhbGNBZmZlY3RlZE1vZHVsZXNSZWN1cihtYXliZVVud3JhcEZuKG1vZHVsZURlZi5pbXBvcnRzKSwgcGF0aC5jb25jYXQodmFsdWUpKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH07XG4gICAgY2FsY0FmZmVjdGVkTW9kdWxlc1JlY3VyKGFyciwgW10pO1xuICAgIHJldHVybiBhZmZlY3RlZE1vZHVsZXM7XG4gIH1cblxuICAvKipcbiAgICogUHJlc2VydmUgYW4gb3JpZ2luYWwgZGVmIChzdWNoIGFzIMm1bW9kLCDJtWluaiwgZXRjKSBiZWZvcmUgYXBwbHlpbmcgYW4gb3ZlcnJpZGUuXG4gICAqIE5vdGU6IG9uZSBjbGFzcyBtYXkgaGF2ZSBtdWx0aXBsZSBkZWZzIChmb3IgZXhhbXBsZTogybVtb2QgYW5kIMm1aW5qIGluIGNhc2Ugb2ZcbiAgICogYW4gTmdNb2R1bGUpLiBJZiB0aGVyZSBpcyBhIGRlZiBpbiBhIHNldCBhbHJlYWR5LCBkb24ndCBvdmVycmlkZSBpdCwgc2luY2VcbiAgICogYW4gb3JpZ2luYWwgb25lIHNob3VsZCBiZSByZXN0b3JlZCBhdCB0aGUgZW5kIG9mIGEgdGVzdC5cbiAgICovXG4gIHByaXZhdGUgbWF5YmVTdG9yZU5nRGVmKHByb3A6IHN0cmluZywgdHlwZTogVHlwZTxhbnk+KSB7XG4gICAgaWYgKCF0aGlzLmluaXRpYWxOZ0RlZnMuaGFzKHR5cGUpKSB7XG4gICAgICB0aGlzLmluaXRpYWxOZ0RlZnMuc2V0KHR5cGUsIG5ldyBNYXAoKSk7XG4gICAgfVxuICAgIGNvbnN0IGN1cnJlbnREZWZzID0gdGhpcy5pbml0aWFsTmdEZWZzLmdldCh0eXBlKSE7XG4gICAgaWYgKCFjdXJyZW50RGVmcy5oYXMocHJvcCkpIHtcbiAgICAgIGNvbnN0IGN1cnJlbnREZWYgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHR5cGUsIHByb3ApO1xuICAgICAgY3VycmVudERlZnMuc2V0KHByb3AsIGN1cnJlbnREZWYpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgc3RvcmVGaWVsZE9mRGVmT25UeXBlKHR5cGU6IFR5cGU8YW55PiwgZGVmRmllbGQ6IHN0cmluZywgZmllbGROYW1lOiBzdHJpbmcpOiB2b2lkIHtcbiAgICBjb25zdCBkZWY6IGFueSA9ICh0eXBlIGFzIGFueSlbZGVmRmllbGRdO1xuICAgIGNvbnN0IG9yaWdpbmFsVmFsdWU6IGFueSA9IGRlZltmaWVsZE5hbWVdO1xuICAgIHRoaXMuZGVmQ2xlYW51cE9wcy5wdXNoKHtvYmplY3Q6IGRlZiwgZmllbGROYW1lLCBvcmlnaW5hbFZhbHVlfSk7XG4gIH1cblxuICAvKipcbiAgICogQ2xlYXJzIGN1cnJlbnQgY29tcG9uZW50cyByZXNvbHV0aW9uIHF1ZXVlLCBidXQgc3RvcmVzIHRoZSBzdGF0ZSBvZiB0aGUgcXVldWUsIHNvIHdlIGNhblxuICAgKiByZXN0b3JlIGl0IGxhdGVyLiBDbGVhcmluZyB0aGUgcXVldWUgaXMgcmVxdWlyZWQgYmVmb3JlIHdlIHRyeSB0byBjb21waWxlIGNvbXBvbmVudHMgKHZpYVxuICAgKiBgVGVzdEJlZC5jb21waWxlQ29tcG9uZW50c2ApLCBzbyB0aGF0IGNvbXBvbmVudCBkZWZzIGFyZSBpbiBzeW5jIHdpdGggdGhlIHJlc29sdXRpb24gcXVldWUuXG4gICAqL1xuICBwcml2YXRlIGNsZWFyQ29tcG9uZW50UmVzb2x1dGlvblF1ZXVlKCkge1xuICAgIGlmICh0aGlzLm9yaWdpbmFsQ29tcG9uZW50UmVzb2x1dGlvblF1ZXVlID09PSBudWxsKSB7XG4gICAgICB0aGlzLm9yaWdpbmFsQ29tcG9uZW50UmVzb2x1dGlvblF1ZXVlID0gbmV3IE1hcCgpO1xuICAgIH1cbiAgICDJtWNsZWFyUmVzb2x1dGlvbk9mQ29tcG9uZW50UmVzb3VyY2VzUXVldWUoKS5mb3JFYWNoKCh2YWx1ZSwga2V5KSA9PlxuICAgICAgdGhpcy5vcmlnaW5hbENvbXBvbmVudFJlc29sdXRpb25RdWV1ZSEuc2V0KGtleSwgdmFsdWUpLFxuICAgICk7XG4gIH1cblxuICAvKlxuICAgKiBSZXN0b3JlcyBjb21wb25lbnQgcmVzb2x1dGlvbiBxdWV1ZSB0byB0aGUgcHJldmlvdXNseSBzYXZlZCBzdGF0ZS4gVGhpcyBvcGVyYXRpb24gaXMgcGVyZm9ybWVkXG4gICAqIGFzIGEgcGFydCBvZiByZXN0b3JpbmcgdGhlIHN0YXRlIGFmdGVyIGNvbXBsZXRpb24gb2YgdGhlIGN1cnJlbnQgc2V0IG9mIHRlc3RzICh0aGF0IG1pZ2h0XG4gICAqIHBvdGVudGlhbGx5IG11dGF0ZSB0aGUgc3RhdGUpLlxuICAgKi9cbiAgcHJpdmF0ZSByZXN0b3JlQ29tcG9uZW50UmVzb2x1dGlvblF1ZXVlKCkge1xuICAgIGlmICh0aGlzLm9yaWdpbmFsQ29tcG9uZW50UmVzb2x1dGlvblF1ZXVlICE9PSBudWxsKSB7XG4gICAgICDJtXJlc3RvcmVDb21wb25lbnRSZXNvbHV0aW9uUXVldWUodGhpcy5vcmlnaW5hbENvbXBvbmVudFJlc29sdXRpb25RdWV1ZSk7XG4gICAgICB0aGlzLm9yaWdpbmFsQ29tcG9uZW50UmVzb2x1dGlvblF1ZXVlID0gbnVsbDtcbiAgICB9XG4gIH1cblxuICByZXN0b3JlT3JpZ2luYWxTdGF0ZSgpOiB2b2lkIHtcbiAgICAvLyBQcm9jZXNzIGNsZWFudXAgb3BzIGluIHJldmVyc2Ugb3JkZXIgc28gdGhlIGZpZWxkJ3Mgb3JpZ2luYWwgdmFsdWUgaXMgcmVzdG9yZWQgY29ycmVjdGx5IChpblxuICAgIC8vIGNhc2UgdGhlcmUgd2VyZSBtdWx0aXBsZSBvdmVycmlkZXMgZm9yIHRoZSBzYW1lIGZpZWxkKS5cbiAgICBmb3JFYWNoUmlnaHQodGhpcy5kZWZDbGVhbnVwT3BzLCAob3A6IENsZWFudXBPcGVyYXRpb24pID0+IHtcbiAgICAgIG9wLm9iamVjdFtvcC5maWVsZE5hbWVdID0gb3Aub3JpZ2luYWxWYWx1ZTtcbiAgICB9KTtcbiAgICAvLyBSZXN0b3JlIGluaXRpYWwgY29tcG9uZW50L2RpcmVjdGl2ZS9waXBlIGRlZnNcbiAgICB0aGlzLmluaXRpYWxOZ0RlZnMuZm9yRWFjaChcbiAgICAgIChkZWZzOiBNYXA8c3RyaW5nLCBQcm9wZXJ0eURlc2NyaXB0b3IgfCB1bmRlZmluZWQ+LCB0eXBlOiBUeXBlPGFueT4pID0+IHtcbiAgICAgICAgaWYgKFVTRV9SVU5USU1FX0RFUFNfVFJBQ0tFUl9GT1JfSklUKSB7XG4gICAgICAgICAgZGVwc1RyYWNrZXIuY2xlYXJTY29wZUNhY2hlRm9yKHR5cGUpO1xuICAgICAgICB9XG4gICAgICAgIGRlZnMuZm9yRWFjaCgoZGVzY3JpcHRvciwgcHJvcCkgPT4ge1xuICAgICAgICAgIGlmICghZGVzY3JpcHRvcikge1xuICAgICAgICAgICAgLy8gRGVsZXRlIG9wZXJhdGlvbnMgYXJlIGdlbmVyYWxseSB1bmRlc2lyYWJsZSBzaW5jZSB0aGV5IGhhdmUgcGVyZm9ybWFuY2VcbiAgICAgICAgICAgIC8vIGltcGxpY2F0aW9ucyBvbiBvYmplY3RzIHRoZXkgd2VyZSBhcHBsaWVkIHRvLiBJbiB0aGlzIHBhcnRpY3VsYXIgY2FzZSwgc2l0dWF0aW9uc1xuICAgICAgICAgICAgLy8gd2hlcmUgdGhpcyBjb2RlIGlzIGludm9rZWQgc2hvdWxkIGJlIHF1aXRlIHJhcmUgdG8gY2F1c2UgYW55IG5vdGljZWFibGUgaW1wYWN0LFxuICAgICAgICAgICAgLy8gc2luY2UgaXQncyBhcHBsaWVkIG9ubHkgdG8gc29tZSB0ZXN0IGNhc2VzIChmb3IgZXhhbXBsZSB3aGVuIGNsYXNzIHdpdGggbm9cbiAgICAgICAgICAgIC8vIGFubm90YXRpb25zIGV4dGVuZHMgc29tZSBAQ29tcG9uZW50KSB3aGVuIHdlIG5lZWQgdG8gY2xlYXIgJ8m1Y21wJyBmaWVsZCBvbiBhIGdpdmVuXG4gICAgICAgICAgICAvLyBjbGFzcyB0byByZXN0b3JlIGl0cyBvcmlnaW5hbCBzdGF0ZSAoYmVmb3JlIGFwcGx5aW5nIG92ZXJyaWRlcyBhbmQgcnVubmluZyB0ZXN0cykuXG4gICAgICAgICAgICBkZWxldGUgKHR5cGUgYXMgYW55KVtwcm9wXTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHR5cGUsIHByb3AsIGRlc2NyaXB0b3IpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9LFxuICAgICk7XG4gICAgdGhpcy5pbml0aWFsTmdEZWZzLmNsZWFyKCk7XG4gICAgdGhpcy5zY29wZXNXaXRoT3ZlcnJpZGRlblByb3ZpZGVycy5jbGVhcigpO1xuICAgIHRoaXMucmVzdG9yZUNvbXBvbmVudFJlc29sdXRpb25RdWV1ZSgpO1xuICAgIC8vIFJlc3RvcmUgdGhlIGxvY2FsZSBJRCB0byB0aGUgZGVmYXVsdCB2YWx1ZSwgdGhpcyBzaG91bGRuJ3QgYmUgbmVjZXNzYXJ5IGJ1dCB3ZSBuZXZlciBrbm93XG4gICAgc2V0TG9jYWxlSWQoREVGQVVMVF9MT0NBTEVfSUQpO1xuICB9XG5cbiAgcHJpdmF0ZSBjb21waWxlVGVzdE1vZHVsZSgpOiB2b2lkIHtcbiAgICBjbGFzcyBSb290U2NvcGVNb2R1bGUge31cbiAgICBjb21waWxlTmdNb2R1bGVEZWZzKFJvb3RTY29wZU1vZHVsZSBhcyBOZ01vZHVsZVR5cGU8YW55Piwge1xuICAgICAgcHJvdmlkZXJzOiBbXG4gICAgICAgIC4uLnRoaXMucm9vdFByb3ZpZGVyT3ZlcnJpZGVzLFxuICAgICAgICBpbnRlcm5hbFByb3ZpZGVab25lQ2hhbmdlRGV0ZWN0aW9uKHt9KSxcbiAgICAgICAgVGVzdEJlZEFwcGxpY2F0aW9uRXJyb3JIYW5kbGVyLFxuICAgICAgICB7XG4gICAgICAgICAgcHJvdmlkZTogSU5URVJOQUxfQVBQTElDQVRJT05fRVJST1JfSEFORExFUixcbiAgICAgICAgICB1c2VGYWN0b3J5OiAoKSA9PiB7XG4gICAgICAgICAgICBpZiAoaW5qZWN0KFpPTkVMRVNTX0VOQUJMRUQpIHx8IGluamVjdChSRVRIUk9XX0FQUExJQ0FUSU9OX0VSUk9SUywge29wdGlvbmFsOiB0cnVlfSkpIHtcbiAgICAgICAgICAgICAgY29uc3QgaGFuZGxlciA9IGluamVjdChUZXN0QmVkQXBwbGljYXRpb25FcnJvckhhbmRsZXIpO1xuICAgICAgICAgICAgICByZXR1cm4gKGU6IHVua25vd24pID0+IHtcbiAgICAgICAgICAgICAgICBoYW5kbGVyLmhhbmRsZUVycm9yKGUpO1xuICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgY29uc3QgdXNlckVycm9ySGFuZGxlciA9IGluamVjdChFcnJvckhhbmRsZXIpO1xuICAgICAgICAgICAgICBjb25zdCBuZ1pvbmUgPSBpbmplY3QoTmdab25lKTtcbiAgICAgICAgICAgICAgcmV0dXJuIChlOiB1bmtub3duKSA9PlxuICAgICAgICAgICAgICAgIG5nWm9uZS5ydW5PdXRzaWRlQW5ndWxhcigoKSA9PiB1c2VyRXJyb3JIYW5kbGVyLmhhbmRsZUVycm9yKGUpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICB7cHJvdmlkZTogQ2hhbmdlRGV0ZWN0aW9uU2NoZWR1bGVyLCB1c2VFeGlzdGluZzogQ2hhbmdlRGV0ZWN0aW9uU2NoZWR1bGVySW1wbH0sXG4gICAgICBdLFxuICAgIH0pO1xuXG4gICAgY29uc3QgcHJvdmlkZXJzID0gW1xuICAgICAge3Byb3ZpZGU6IENvbXBpbGVyLCB1c2VGYWN0b3J5OiAoKSA9PiBuZXcgUjNUZXN0Q29tcGlsZXIodGhpcyl9LFxuICAgICAge3Byb3ZpZGU6IERFRkVSX0JMT0NLX0NPTkZJRywgdXNlVmFsdWU6IHtiZWhhdmlvcjogdGhpcy5kZWZlckJsb2NrQmVoYXZpb3J9fSxcbiAgICAgIC4uLnRoaXMucHJvdmlkZXJzLFxuICAgICAgLi4udGhpcy5wcm92aWRlck92ZXJyaWRlcyxcbiAgICBdO1xuICAgIGNvbnN0IGltcG9ydHMgPSBbUm9vdFNjb3BlTW9kdWxlLCB0aGlzLmFkZGl0aW9uYWxNb2R1bGVUeXBlcywgdGhpcy5pbXBvcnRzIHx8IFtdXTtcblxuICAgIGNvbXBpbGVOZ01vZHVsZURlZnMoXG4gICAgICB0aGlzLnRlc3RNb2R1bGVUeXBlLFxuICAgICAge1xuICAgICAgICBkZWNsYXJhdGlvbnM6IHRoaXMuZGVjbGFyYXRpb25zLFxuICAgICAgICBpbXBvcnRzLFxuICAgICAgICBzY2hlbWFzOiB0aGlzLnNjaGVtYXMsXG4gICAgICAgIHByb3ZpZGVycyxcbiAgICAgIH0sXG4gICAgICAvKiBhbGxvd0R1cGxpY2F0ZURlY2xhcmF0aW9uc0luUm9vdCAqLyB0cnVlLFxuICAgICk7XG5cbiAgICB0aGlzLmFwcGx5UHJvdmlkZXJPdmVycmlkZXNJblNjb3BlKHRoaXMudGVzdE1vZHVsZVR5cGUpO1xuICB9XG5cbiAgZ2V0IGluamVjdG9yKCk6IEluamVjdG9yIHtcbiAgICBpZiAodGhpcy5faW5qZWN0b3IgIT09IG51bGwpIHtcbiAgICAgIHJldHVybiB0aGlzLl9pbmplY3RvcjtcbiAgICB9XG5cbiAgICBjb25zdCBwcm92aWRlcnM6IFN0YXRpY1Byb3ZpZGVyW10gPSBbXTtcbiAgICBjb25zdCBjb21waWxlck9wdGlvbnMgPSB0aGlzLnBsYXRmb3JtLmluamVjdG9yLmdldChDT01QSUxFUl9PUFRJT05TKTtcbiAgICBjb21waWxlck9wdGlvbnMuZm9yRWFjaCgob3B0cykgPT4ge1xuICAgICAgaWYgKG9wdHMucHJvdmlkZXJzKSB7XG4gICAgICAgIHByb3ZpZGVycy5wdXNoKG9wdHMucHJvdmlkZXJzKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICBpZiAodGhpcy5jb21waWxlclByb3ZpZGVycyAhPT0gbnVsbCkge1xuICAgICAgcHJvdmlkZXJzLnB1c2goLi4uKHRoaXMuY29tcGlsZXJQcm92aWRlcnMgYXMgU3RhdGljUHJvdmlkZXJbXSkpO1xuICAgIH1cblxuICAgIHRoaXMuX2luamVjdG9yID0gSW5qZWN0b3IuY3JlYXRlKHtwcm92aWRlcnMsIHBhcmVudDogdGhpcy5wbGF0Zm9ybS5pbmplY3Rvcn0pO1xuICAgIHJldHVybiB0aGlzLl9pbmplY3RvcjtcbiAgfVxuXG4gIC8vIGdldCBvdmVycmlkZXMgZm9yIGEgc3BlY2lmaWMgcHJvdmlkZXIgKGlmIGFueSlcbiAgcHJpdmF0ZSBnZXRTaW5nbGVQcm92aWRlck92ZXJyaWRlcyhwcm92aWRlcjogUHJvdmlkZXIpOiBQcm92aWRlciB8IG51bGwge1xuICAgIGNvbnN0IHRva2VuID0gZ2V0UHJvdmlkZXJUb2tlbihwcm92aWRlcik7XG4gICAgcmV0dXJuIHRoaXMucHJvdmlkZXJPdmVycmlkZXNCeVRva2VuLmdldCh0b2tlbikgfHwgbnVsbDtcbiAgfVxuXG4gIHByaXZhdGUgZ2V0UHJvdmlkZXJPdmVycmlkZXMoXG4gICAgcHJvdmlkZXJzPzogQXJyYXk8UHJvdmlkZXIgfCBJbnRlcm5hbEVudmlyb25tZW50UHJvdmlkZXJzPixcbiAgKTogUHJvdmlkZXJbXSB7XG4gICAgaWYgKCFwcm92aWRlcnMgfHwgIXByb3ZpZGVycy5sZW5ndGggfHwgdGhpcy5wcm92aWRlck92ZXJyaWRlc0J5VG9rZW4uc2l6ZSA9PT0gMCkgcmV0dXJuIFtdO1xuICAgIC8vIFRoZXJlIGFyZSB0d28gZmxhdHRlbmluZyBvcGVyYXRpb25zIGhlcmUuIFRoZSBpbm5lciBmbGF0dGVuUHJvdmlkZXJzKCkgb3BlcmF0ZXMgb24gdGhlXG4gICAgLy8gbWV0YWRhdGEncyBwcm92aWRlcnMgYW5kIGFwcGxpZXMgYSBtYXBwaW5nIGZ1bmN0aW9uIHdoaWNoIHJldHJpZXZlcyBvdmVycmlkZXMgZm9yIGVhY2hcbiAgICAvLyBpbmNvbWluZyBwcm92aWRlci4gVGhlIG91dGVyIGZsYXR0ZW4oKSB0aGVuIGZsYXR0ZW5zIHRoZSBwcm9kdWNlZCBvdmVycmlkZXMgYXJyYXkuIElmIHRoaXMgaXNcbiAgICAvLyBub3QgZG9uZSwgdGhlIGFycmF5IGNhbiBjb250YWluIG90aGVyIGVtcHR5IGFycmF5cyAoZS5nLiBgW1tdLCBbXV1gKSB3aGljaCBsZWFrIGludG8gdGhlXG4gICAgLy8gcHJvdmlkZXJzIGFycmF5IGFuZCBjb250YW1pbmF0ZSBhbnkgZXJyb3IgbWVzc2FnZXMgdGhhdCBtaWdodCBiZSBnZW5lcmF0ZWQuXG4gICAgcmV0dXJuIGZsYXR0ZW4oXG4gICAgICBmbGF0dGVuUHJvdmlkZXJzKFxuICAgICAgICBwcm92aWRlcnMsXG4gICAgICAgIChwcm92aWRlcjogUHJvdmlkZXIpID0+IHRoaXMuZ2V0U2luZ2xlUHJvdmlkZXJPdmVycmlkZXMocHJvdmlkZXIpIHx8IFtdLFxuICAgICAgKSxcbiAgICApO1xuICB9XG5cbiAgcHJpdmF0ZSBnZXRPdmVycmlkZGVuUHJvdmlkZXJzKFxuICAgIHByb3ZpZGVycz86IEFycmF5PFByb3ZpZGVyIHwgSW50ZXJuYWxFbnZpcm9ubWVudFByb3ZpZGVycz4sXG4gICk6IFByb3ZpZGVyW10ge1xuICAgIGlmICghcHJvdmlkZXJzIHx8ICFwcm92aWRlcnMubGVuZ3RoIHx8IHRoaXMucHJvdmlkZXJPdmVycmlkZXNCeVRva2VuLnNpemUgPT09IDApIHJldHVybiBbXTtcblxuICAgIGNvbnN0IGZsYXR0ZW5lZFByb3ZpZGVycyA9IGZsYXR0ZW5Qcm92aWRlcnMocHJvdmlkZXJzKTtcbiAgICBjb25zdCBvdmVycmlkZXMgPSB0aGlzLmdldFByb3ZpZGVyT3ZlcnJpZGVzKGZsYXR0ZW5lZFByb3ZpZGVycyk7XG4gICAgY29uc3Qgb3ZlcnJpZGRlblByb3ZpZGVycyA9IFsuLi5mbGF0dGVuZWRQcm92aWRlcnMsIC4uLm92ZXJyaWRlc107XG4gICAgY29uc3QgZmluYWw6IFByb3ZpZGVyW10gPSBbXTtcbiAgICBjb25zdCBzZWVuT3ZlcnJpZGRlblByb3ZpZGVycyA9IG5ldyBTZXQ8UHJvdmlkZXI+KCk7XG5cbiAgICAvLyBXZSBpdGVyYXRlIHRocm91Z2ggdGhlIGxpc3Qgb2YgcHJvdmlkZXJzIGluIHJldmVyc2Ugb3JkZXIgdG8gbWFrZSBzdXJlIHByb3ZpZGVyIG92ZXJyaWRlc1xuICAgIC8vIHRha2UgcHJlY2VkZW5jZSBvdmVyIHRoZSB2YWx1ZXMgZGVmaW5lZCBpbiBwcm92aWRlciBsaXN0LiBXZSBhbHNvIGZpbHRlciBvdXQgYWxsIHByb3ZpZGVyc1xuICAgIC8vIHRoYXQgaGF2ZSBvdmVycmlkZXMsIGtlZXBpbmcgb3ZlcnJpZGRlbiB2YWx1ZXMgb25seS4gVGhpcyBpcyBuZWVkZWQsIHNpbmNlIHByZXNlbmNlIG9mIGFcbiAgICAvLyBwcm92aWRlciB3aXRoIGBuZ09uRGVzdHJveWAgaG9vayB3aWxsIGNhdXNlIHRoaXMgaG9vayB0byBiZSByZWdpc3RlcmVkIGFuZCBpbnZva2VkIGxhdGVyLlxuICAgIGZvckVhY2hSaWdodChvdmVycmlkZGVuUHJvdmlkZXJzLCAocHJvdmlkZXI6IGFueSkgPT4ge1xuICAgICAgY29uc3QgdG9rZW46IGFueSA9IGdldFByb3ZpZGVyVG9rZW4ocHJvdmlkZXIpO1xuICAgICAgaWYgKHRoaXMucHJvdmlkZXJPdmVycmlkZXNCeVRva2VuLmhhcyh0b2tlbikpIHtcbiAgICAgICAgaWYgKCFzZWVuT3ZlcnJpZGRlblByb3ZpZGVycy5oYXModG9rZW4pKSB7XG4gICAgICAgICAgc2Vlbk92ZXJyaWRkZW5Qcm92aWRlcnMuYWRkKHRva2VuKTtcbiAgICAgICAgICAvLyBUcmVhdCBhbGwgb3ZlcnJpZGRlbiBwcm92aWRlcnMgYXMgYHttdWx0aTogZmFsc2V9YCAoZXZlbiBpZiBpdCdzIGEgbXVsdGktcHJvdmlkZXIpIHRvXG4gICAgICAgICAgLy8gbWFrZSBzdXJlIHRoYXQgcHJvdmlkZWQgb3ZlcnJpZGUgdGFrZXMgaGlnaGVzdCBwcmVjZWRlbmNlIGFuZCBpcyBub3QgY29tYmluZWQgd2l0aFxuICAgICAgICAgIC8vIG90aGVyIGluc3RhbmNlcyBvZiB0aGUgc2FtZSBtdWx0aSBwcm92aWRlci5cbiAgICAgICAgICBmaW5hbC51bnNoaWZ0KHsuLi5wcm92aWRlciwgbXVsdGk6IGZhbHNlfSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGZpbmFsLnVuc2hpZnQocHJvdmlkZXIpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiBmaW5hbDtcbiAgfVxuXG4gIHByaXZhdGUgaGFzUHJvdmlkZXJPdmVycmlkZXMoXG4gICAgcHJvdmlkZXJzPzogQXJyYXk8UHJvdmlkZXIgfCBJbnRlcm5hbEVudmlyb25tZW50UHJvdmlkZXJzPixcbiAgKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0UHJvdmlkZXJPdmVycmlkZXMocHJvdmlkZXJzKS5sZW5ndGggPiAwO1xuICB9XG5cbiAgcHJpdmF0ZSBwYXRjaERlZldpdGhQcm92aWRlck92ZXJyaWRlcyhkZWNsYXJhdGlvbjogVHlwZTxhbnk+LCBmaWVsZDogc3RyaW5nKTogdm9pZCB7XG4gICAgY29uc3QgZGVmID0gKGRlY2xhcmF0aW9uIGFzIGFueSlbZmllbGRdO1xuICAgIGlmIChkZWYgJiYgZGVmLnByb3ZpZGVyc1Jlc29sdmVyKSB7XG4gICAgICB0aGlzLm1heWJlU3RvcmVOZ0RlZihmaWVsZCwgZGVjbGFyYXRpb24pO1xuXG4gICAgICBjb25zdCByZXNvbHZlciA9IGRlZi5wcm92aWRlcnNSZXNvbHZlcjtcbiAgICAgIGNvbnN0IHByb2Nlc3NQcm92aWRlcnNGbiA9IChwcm92aWRlcnM6IFByb3ZpZGVyW10pID0+IHRoaXMuZ2V0T3ZlcnJpZGRlblByb3ZpZGVycyhwcm92aWRlcnMpO1xuICAgICAgdGhpcy5zdG9yZUZpZWxkT2ZEZWZPblR5cGUoZGVjbGFyYXRpb24sIGZpZWxkLCAncHJvdmlkZXJzUmVzb2x2ZXInKTtcbiAgICAgIGRlZi5wcm92aWRlcnNSZXNvbHZlciA9IChuZ0RlZjogRGlyZWN0aXZlRGVmPGFueT4pID0+IHJlc29sdmVyKG5nRGVmLCBwcm9jZXNzUHJvdmlkZXJzRm4pO1xuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBpbml0UmVzb2x2ZXJzKCk6IFJlc29sdmVycyB7XG4gIHJldHVybiB7XG4gICAgbW9kdWxlOiBuZXcgTmdNb2R1bGVSZXNvbHZlcigpLFxuICAgIGNvbXBvbmVudDogbmV3IENvbXBvbmVudFJlc29sdmVyKCksXG4gICAgZGlyZWN0aXZlOiBuZXcgRGlyZWN0aXZlUmVzb2x2ZXIoKSxcbiAgICBwaXBlOiBuZXcgUGlwZVJlc29sdmVyKCksXG4gIH07XG59XG5cbmZ1bmN0aW9uIGlzU3RhbmRhbG9uZUNvbXBvbmVudDxUPih2YWx1ZTogVHlwZTxUPik6IHZhbHVlIGlzIENvbXBvbmVudFR5cGU8VD4ge1xuICBjb25zdCBkZWYgPSBnZXRDb21wb25lbnREZWYodmFsdWUpO1xuICByZXR1cm4gISFkZWY/LnN0YW5kYWxvbmU7XG59XG5cbmZ1bmN0aW9uIGdldENvbXBvbmVudERlZih2YWx1ZTogQ29tcG9uZW50VHlwZTx1bmtub3duPik6IENvbXBvbmVudERlZjx1bmtub3duPjtcbmZ1bmN0aW9uIGdldENvbXBvbmVudERlZih2YWx1ZTogVHlwZTx1bmtub3duPik6IENvbXBvbmVudERlZjx1bmtub3duPiB8IG51bGw7XG5mdW5jdGlvbiBnZXRDb21wb25lbnREZWYodmFsdWU6IFR5cGU8dW5rbm93bj4pOiBDb21wb25lbnREZWY8dW5rbm93bj4gfCBudWxsIHtcbiAgcmV0dXJuICh2YWx1ZSBhcyBhbnkpLsm1Y21wID8/IG51bGw7XG59XG5cbmZ1bmN0aW9uIGhhc05nTW9kdWxlRGVmPFQ+KHZhbHVlOiBUeXBlPFQ+KTogdmFsdWUgaXMgTmdNb2R1bGVUeXBlPFQ+IHtcbiAgcmV0dXJuIHZhbHVlLmhhc093blByb3BlcnR5KCfJtW1vZCcpO1xufVxuXG5mdW5jdGlvbiBpc05nTW9kdWxlPFQ+KHZhbHVlOiBUeXBlPFQ+KTogYm9vbGVhbiB7XG4gIHJldHVybiBoYXNOZ01vZHVsZURlZih2YWx1ZSk7XG59XG5cbmZ1bmN0aW9uIG1heWJlVW53cmFwRm48VD4obWF5YmVGbjogKCgpID0+IFQpIHwgVCk6IFQge1xuICByZXR1cm4gbWF5YmVGbiBpbnN0YW5jZW9mIEZ1bmN0aW9uID8gbWF5YmVGbigpIDogbWF5YmVGbjtcbn1cblxuZnVuY3Rpb24gZmxhdHRlbjxUPih2YWx1ZXM6IGFueVtdKTogVFtdIHtcbiAgY29uc3Qgb3V0OiBUW10gPSBbXTtcbiAgdmFsdWVzLmZvckVhY2goKHZhbHVlKSA9PiB7XG4gICAgaWYgKEFycmF5LmlzQXJyYXkodmFsdWUpKSB7XG4gICAgICBvdXQucHVzaCguLi5mbGF0dGVuPFQ+KHZhbHVlKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG91dC5wdXNoKHZhbHVlKTtcbiAgICB9XG4gIH0pO1xuICByZXR1cm4gb3V0O1xufVxuXG5mdW5jdGlvbiBpZGVudGl0eUZuPFQ+KHZhbHVlOiBUKTogVCB7XG4gIHJldHVybiB2YWx1ZTtcbn1cblxuZnVuY3Rpb24gZmxhdHRlblByb3ZpZGVyczxUPihcbiAgcHJvdmlkZXJzOiBBcnJheTxQcm92aWRlciB8IEludGVybmFsRW52aXJvbm1lbnRQcm92aWRlcnM+LFxuICBtYXBGbjogKHByb3ZpZGVyOiBQcm92aWRlcikgPT4gVCxcbik6IFRbXTtcbmZ1bmN0aW9uIGZsYXR0ZW5Qcm92aWRlcnMocHJvdmlkZXJzOiBBcnJheTxQcm92aWRlciB8IEludGVybmFsRW52aXJvbm1lbnRQcm92aWRlcnM+KTogUHJvdmlkZXJbXTtcbmZ1bmN0aW9uIGZsYXR0ZW5Qcm92aWRlcnMoXG4gIHByb3ZpZGVyczogQXJyYXk8UHJvdmlkZXIgfCBJbnRlcm5hbEVudmlyb25tZW50UHJvdmlkZXJzPixcbiAgbWFwRm46IChwcm92aWRlcjogUHJvdmlkZXIpID0+IGFueSA9IGlkZW50aXR5Rm4sXG4pOiBhbnlbXSB7XG4gIGNvbnN0IG91dDogYW55W10gPSBbXTtcbiAgZm9yIChsZXQgcHJvdmlkZXIgb2YgcHJvdmlkZXJzKSB7XG4gICAgaWYgKGlzRW52aXJvbm1lbnRQcm92aWRlcnMocHJvdmlkZXIpKSB7XG4gICAgICBwcm92aWRlciA9IHByb3ZpZGVyLsm1cHJvdmlkZXJzO1xuICAgIH1cbiAgICBpZiAoQXJyYXkuaXNBcnJheShwcm92aWRlcikpIHtcbiAgICAgIG91dC5wdXNoKC4uLmZsYXR0ZW5Qcm92aWRlcnMocHJvdmlkZXIsIG1hcEZuKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG91dC5wdXNoKG1hcEZuKHByb3ZpZGVyKSk7XG4gICAgfVxuICB9XG4gIHJldHVybiBvdXQ7XG59XG5cbmZ1bmN0aW9uIGdldFByb3ZpZGVyRmllbGQocHJvdmlkZXI6IFByb3ZpZGVyLCBmaWVsZDogc3RyaW5nKSB7XG4gIHJldHVybiBwcm92aWRlciAmJiB0eXBlb2YgcHJvdmlkZXIgPT09ICdvYmplY3QnICYmIChwcm92aWRlciBhcyBhbnkpW2ZpZWxkXTtcbn1cblxuZnVuY3Rpb24gZ2V0UHJvdmlkZXJUb2tlbihwcm92aWRlcjogUHJvdmlkZXIpIHtcbiAgcmV0dXJuIGdldFByb3ZpZGVyRmllbGQocHJvdmlkZXIsICdwcm92aWRlJykgfHwgcHJvdmlkZXI7XG59XG5cbmZ1bmN0aW9uIGlzTW9kdWxlV2l0aFByb3ZpZGVycyh2YWx1ZTogYW55KTogdmFsdWUgaXMgTW9kdWxlV2l0aFByb3ZpZGVyczxhbnk+IHtcbiAgcmV0dXJuIHZhbHVlLmhhc093blByb3BlcnR5KCduZ01vZHVsZScpO1xufVxuXG5mdW5jdGlvbiBmb3JFYWNoUmlnaHQ8VD4odmFsdWVzOiBUW10sIGZuOiAodmFsdWU6IFQsIGlkeDogbnVtYmVyKSA9PiB2b2lkKTogdm9pZCB7XG4gIGZvciAobGV0IGlkeCA9IHZhbHVlcy5sZW5ndGggLSAxOyBpZHggPj0gMDsgaWR4LS0pIHtcbiAgICBmbih2YWx1ZXNbaWR4XSwgaWR4KTtcbiAgfVxufVxuXG5mdW5jdGlvbiBpbnZhbGlkVHlwZUVycm9yKG5hbWU6IHN0cmluZywgZXhwZWN0ZWRUeXBlOiBzdHJpbmcpOiBFcnJvciB7XG4gIHJldHVybiBuZXcgRXJyb3IoYCR7bmFtZX0gY2xhc3MgZG9lc24ndCBoYXZlIEAke2V4cGVjdGVkVHlwZX0gZGVjb3JhdG9yIG9yIGlzIG1pc3NpbmcgbWV0YWRhdGEuYCk7XG59XG5cbmNsYXNzIFIzVGVzdENvbXBpbGVyIGltcGxlbWVudHMgQ29tcGlsZXIge1xuICBjb25zdHJ1Y3Rvcihwcml2YXRlIHRlc3RCZWQ6IFRlc3RCZWRDb21waWxlcikge31cblxuICBjb21waWxlTW9kdWxlU3luYzxUPihtb2R1bGVUeXBlOiBUeXBlPFQ+KTogTmdNb2R1bGVGYWN0b3J5PFQ+IHtcbiAgICB0aGlzLnRlc3RCZWQuX2NvbXBpbGVOZ01vZHVsZVN5bmMobW9kdWxlVHlwZSk7XG4gICAgcmV0dXJuIG5ldyBSM05nTW9kdWxlRmFjdG9yeShtb2R1bGVUeXBlKTtcbiAgfVxuXG4gIGFzeW5jIGNvbXBpbGVNb2R1bGVBc3luYzxUPihtb2R1bGVUeXBlOiBUeXBlPFQ+KTogUHJvbWlzZTxOZ01vZHVsZUZhY3Rvcnk8VD4+IHtcbiAgICBhd2FpdCB0aGlzLnRlc3RCZWQuX2NvbXBpbGVOZ01vZHVsZUFzeW5jKG1vZHVsZVR5cGUpO1xuICAgIHJldHVybiBuZXcgUjNOZ01vZHVsZUZhY3RvcnkobW9kdWxlVHlwZSk7XG4gIH1cblxuICBjb21waWxlTW9kdWxlQW5kQWxsQ29tcG9uZW50c1N5bmM8VD4obW9kdWxlVHlwZTogVHlwZTxUPik6IE1vZHVsZVdpdGhDb21wb25lbnRGYWN0b3JpZXM8VD4ge1xuICAgIGNvbnN0IG5nTW9kdWxlRmFjdG9yeSA9IHRoaXMuY29tcGlsZU1vZHVsZVN5bmMobW9kdWxlVHlwZSk7XG4gICAgY29uc3QgY29tcG9uZW50RmFjdG9yaWVzID0gdGhpcy50ZXN0QmVkLl9nZXRDb21wb25lbnRGYWN0b3JpZXMobW9kdWxlVHlwZSBhcyBOZ01vZHVsZVR5cGU8VD4pO1xuICAgIHJldHVybiBuZXcgTW9kdWxlV2l0aENvbXBvbmVudEZhY3RvcmllcyhuZ01vZHVsZUZhY3RvcnksIGNvbXBvbmVudEZhY3Rvcmllcyk7XG4gIH1cblxuICBhc3luYyBjb21waWxlTW9kdWxlQW5kQWxsQ29tcG9uZW50c0FzeW5jPFQ+KFxuICAgIG1vZHVsZVR5cGU6IFR5cGU8VD4sXG4gICk6IFByb21pc2U8TW9kdWxlV2l0aENvbXBvbmVudEZhY3RvcmllczxUPj4ge1xuICAgIGNvbnN0IG5nTW9kdWxlRmFjdG9yeSA9IGF3YWl0IHRoaXMuY29tcGlsZU1vZHVsZUFzeW5jKG1vZHVsZVR5cGUpO1xuICAgIGNvbnN0IGNvbXBvbmVudEZhY3RvcmllcyA9IHRoaXMudGVzdEJlZC5fZ2V0Q29tcG9uZW50RmFjdG9yaWVzKG1vZHVsZVR5cGUgYXMgTmdNb2R1bGVUeXBlPFQ+KTtcbiAgICByZXR1cm4gbmV3IE1vZHVsZVdpdGhDb21wb25lbnRGYWN0b3JpZXMobmdNb2R1bGVGYWN0b3J5LCBjb21wb25lbnRGYWN0b3JpZXMpO1xuICB9XG5cbiAgY2xlYXJDYWNoZSgpOiB2b2lkIHt9XG5cbiAgY2xlYXJDYWNoZUZvcih0eXBlOiBUeXBlPGFueT4pOiB2b2lkIHt9XG5cbiAgZ2V0TW9kdWxlSWQobW9kdWxlVHlwZTogVHlwZTxhbnk+KTogc3RyaW5nIHwgdW5kZWZpbmVkIHtcbiAgICBjb25zdCBtZXRhID0gdGhpcy50ZXN0QmVkLl9nZXRNb2R1bGVSZXNvbHZlcigpLnJlc29sdmUobW9kdWxlVHlwZSk7XG4gICAgcmV0dXJuIChtZXRhICYmIG1ldGEuaWQpIHx8IHVuZGVmaW5lZDtcbiAgfVxufVxuIl19