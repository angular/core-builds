/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ResourceLoader } from '@angular/compiler';
import { ApplicationInitStatus, ɵINTERNAL_APPLICATION_ERROR_HANDLER as INTERNAL_APPLICATION_ERROR_HANDLER, ɵChangeDetectionScheduler as ChangeDetectionScheduler, ɵChangeDetectionSchedulerImpl as ChangeDetectionSchedulerImpl, Compiler, COMPILER_OPTIONS, Injector, inject, LOCALE_ID, ModuleWithComponentFactories, resolveForwardRef, ɵclearResolutionOfComponentResourcesQueue, ɵcompileComponent as compileComponent, ɵcompileDirective as compileDirective, ɵcompileNgModuleDefs as compileNgModuleDefs, ɵcompilePipe as compilePipe, ɵDEFAULT_LOCALE_ID as DEFAULT_LOCALE_ID, ɵDEFER_BLOCK_CONFIG as DEFER_BLOCK_CONFIG, ɵdepsTracker as depsTracker, ɵgenerateStandaloneInDeclarationsError, ɵgetAsyncClassMetadataFn as getAsyncClassMetadataFn, ɵgetInjectableDef as getInjectableDef, ɵinternalProvideZoneChangeDetection as internalProvideZoneChangeDetection, ɵisComponentDefPendingResolution, ɵisEnvironmentProviders as isEnvironmentProviders, ɵNG_COMP_DEF as NG_COMP_DEF, ɵNG_DIR_DEF as NG_DIR_DEF, ɵNG_INJ_DEF as NG_INJ_DEF, ɵNG_MOD_DEF as NG_MOD_DEF, ɵNG_PIPE_DEF as NG_PIPE_DEF, ɵNgModuleFactory as R3NgModuleFactory, ɵpatchComponentDefWithScope as patchComponentDefWithScope, ɵRender3ComponentFactory as ComponentFactory, ɵRender3NgModuleRef as NgModuleRef, ɵresolveComponentResources, ɵrestoreComponentResolutionQueue, ɵsetLocaleId as setLocaleId, ɵtransitiveScopesFor as transitiveScopesFor, ɵUSE_RUNTIME_DEPS_TRACKER_FOR_JIT as USE_RUNTIME_DEPS_TRACKER_FOR_JIT, NgZone, ErrorHandler, } from '@angular/core';
import { ComponentResolver, DirectiveResolver, NgModuleResolver, PipeResolver, } from './resolvers';
import { DEFER_BLOCK_DEFAULT_BEHAVIOR } from './test_bed_common';
import { RETHROW_APPLICATION_ERRORS_DEFAULT, TestBedApplicationErrorHandler, } from './application_error_handler';
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
        this.rethrowApplicationTickErrors = RETHROW_APPLICATION_ERRORS_DEFAULT;
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
        this.rethrowApplicationTickErrors =
            moduleDef.rethrowApplicationErrors ?? RETHROW_APPLICATION_ERRORS_DEFAULT;
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
                { provide: ChangeDetectionScheduler, useExisting: ChangeDetectionSchedulerImpl },
            ],
        });
        const providers = [
            { provide: Compiler, useFactory: () => new R3TestCompiler(this) },
            { provide: DEFER_BLOCK_CONFIG, useValue: { behavior: this.deferBlockBehavior } },
            {
                provide: INTERNAL_APPLICATION_ERROR_HANDLER,
                useFactory: () => {
                    if (this.rethrowApplicationTickErrors) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdF9iZWRfY29tcGlsZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3Rlc3Rpbmcvc3JjL3Rlc3RfYmVkX2NvbXBpbGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUNqRCxPQUFPLEVBQ0wscUJBQXFCLEVBQ3JCLG1DQUFtQyxJQUFJLGtDQUFrQyxFQUN6RSx5QkFBeUIsSUFBSSx3QkFBd0IsRUFDckQsNkJBQTZCLElBQUksNEJBQTRCLEVBQzdELFFBQVEsRUFDUixnQkFBZ0IsRUFHaEIsUUFBUSxFQUNSLE1BQU0sRUFFTixTQUFTLEVBQ1QsNEJBQTRCLEVBTzVCLGlCQUFpQixFQUdqQix5Q0FBeUMsRUFDekMsaUJBQWlCLElBQUksZ0JBQWdCLEVBQ3JDLGlCQUFpQixJQUFJLGdCQUFnQixFQUNyQyxvQkFBb0IsSUFBSSxtQkFBbUIsRUFDM0MsWUFBWSxJQUFJLFdBQVcsRUFDM0Isa0JBQWtCLElBQUksaUJBQWlCLEVBQ3ZDLG1CQUFtQixJQUFJLGtCQUFrQixFQUN6QyxZQUFZLElBQUksV0FBVyxFQUUzQixzQ0FBc0MsRUFDdEMsd0JBQXdCLElBQUksdUJBQXVCLEVBQ25ELGlCQUFpQixJQUFJLGdCQUFnQixFQUVyQyxtQ0FBbUMsSUFBSSxrQ0FBa0MsRUFDekUsZ0NBQWdDLEVBQ2hDLHVCQUF1QixJQUFJLHNCQUFzQixFQUNqRCxZQUFZLElBQUksV0FBVyxFQUMzQixXQUFXLElBQUksVUFBVSxFQUN6QixXQUFXLElBQUksVUFBVSxFQUN6QixXQUFXLElBQUksVUFBVSxFQUN6QixZQUFZLElBQUksV0FBVyxFQUMzQixnQkFBZ0IsSUFBSSxpQkFBaUIsRUFHckMsMkJBQTJCLElBQUksMEJBQTBCLEVBQ3pELHdCQUF3QixJQUFJLGdCQUFnQixFQUM1QyxtQkFBbUIsSUFB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RSxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUNuRSxPQUFPLENBQUMsSUFBSSxJQUFJLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxTQUFTLENBQUM7SUFDeEMsQ0FBQztDQUNGIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7UmVzb3VyY2VMb2FkZXJ9IGZyb20gJ0Bhbmd1bGFyL2NvbXBpbGVyJztcbmltcG9ydCB7XG4gIEFwcGxpY2F0aW9uSW5pdFN0YXR1cyxcbiAgybVJTlRFUk5BTF9BUFBMSUNBVElPTl9FUlJPUl9IQU5ETEVSIGFzIElOVEVSTkFMX0FQUExJQ0FUSU9OX0VSUk9SX0hBTkRMRVIsXG4gIMm1Q2hhbmdlRGV0ZWN0aW9uU2NoZWR1bGVyIGFzIENoYW5nZURldGVjdGlvblNjaGVkdWxlcixcbiAgybVDaGFuZ2VEZXRlY3Rpb25TY2hlZHVsZXJJbXBsIGFzIENoYW5nZURldGVjdGlvblNjaGVkdWxlckltcGwsXG4gIENvbXBpbGVyLFxuICBDT01QSUxFUl9PUFRJT05TLFxuICBDb21wb25lbnQsXG4gIERpcmVjdGl2ZSxcbiAgSW5qZWN0b3IsXG4gIGluamVjdCxcbiAgSW5qZWN0b3JUeXBlLFxuICBMT0NBTEVfSUQsXG4gIE1vZHVsZVdpdGhDb21wb25lbnRGYWN0b3JpZXMsXG4gIE1vZHVsZVdpdGhQcm92aWRlcnMsXG4gIE5nTW9kdWxlLFxuICBOZ01vZHVsZUZhY3RvcnksXG4gIFBpcGUsXG4gIFBsYXRmb3JtUmVmLFxuICBQcm92aWRlcixcbiAgcmVzb2x2ZUZvcndhcmRSZWYsXG4gIFN0YXRpY1Byb3ZpZGVyLFxuICBUeXBlLFxuICDJtWNsZWFyUmVzb2x1dGlvbk9mQ29tcG9uZW50UmVzb3VyY2VzUXVldWUsXG4gIMm1Y29tcGlsZUNvbXBvbmVudCBhcyBjb21waWxlQ29tcG9uZW50LFxuICDJtWNvbXBpbGVEaXJlY3RpdmUgYXMgY29tcGlsZURpcmVjdGl2ZSxcbiAgybVjb21waWxlTmdNb2R1bGVEZWZzIGFzIGNvbXBpbGVOZ01vZHVsZURlZnMsXG4gIMm1Y29tcGlsZVBpcGUgYXMgY29tcGlsZVBpcGUsXG4gIMm1REVGQVVMVF9MT0NBTEVfSUQgYXMgREVGQVVMVF9MT0NBTEVfSUQsXG4gIMm1REVGRVJfQkxPQ0tfQ09ORklHIGFzIERFRkVSX0JMT0NLX0NPTkZJRyxcbiAgybVkZXBzVHJhY2tlciBhcyBkZXBzVHJhY2tlcixcbiAgybVEaXJlY3RpdmVEZWYgYXMgRGlyZWN0aXZlRGVmLFxuICDJtWdlbmVyYXRlU3RhbmRhbG9uZUluRGVjbGFyYXRpb25zRXJyb3IsXG4gIMm1Z2V0QXN5bmNDbGFzc01ldGFkYXRhRm4gYXMgZ2V0QXN5bmNDbGFzc01ldGFkYXRhRm4sXG4gIMm1Z2V0SW5qZWN0YWJsZURlZiBhcyBnZXRJbmplY3RhYmxlRGVmLFxuICDJtUludGVybmFsRW52aXJvbm1lbnRQcm92aWRlcnMgYXMgSW50ZXJuYWxFbnZpcm9ubWVudFByb3ZpZGVycyxcbiAgybVpbnRlcm5hbFByb3ZpZGVab25lQ2hhbmdlRGV0ZWN0aW9uIGFzIGludGVybmFsUHJvdmlkZVpvbmVDaGFuZ2VEZXRlY3Rpb24sXG4gIMm1aXNDb21wb25lbnREZWZQZW5kaW5nUmVzb2x1dGlvbixcbiAgybVpc0Vudmlyb25tZW50UHJvdmlkZXJzIGFzIGlzRW52aXJvbm1lbnRQcm92aWRlcnMsXG4gIMm1TkdfQ09NUF9ERUYgYXMgTkdfQ09NUF9ERUYsXG4gIMm1TkdfRElSX0RFRiBhcyBOR19ESVJfREVGLFxuICDJtU5HX0lOSl9ERUYgYXMgTkdfSU5KX0RFRixcbiAgybVOR19NT0RfREVGIGFzIE5HX01PRF9ERUYsXG4gIMm1TkdfUElQRV9ERUYgYXMgTkdfUElQRV9ERUYsXG4gIMm1TmdNb2R1bGVGYWN0b3J5IGFzIFIzTmdNb2R1bGVGYWN0b3J5LFxuICDJtU5nTW9kdWxlVHJhbnNpdGl2ZVNjb3BlcyBhcyBOZ01vZHVsZVRyYW5zaXRpdmVTY29wZXMsXG4gIMm1TmdNb2R1bGVUeXBlIGFzIE5nTW9kdWxlVHlwZSxcbiAgybVwYXRjaENvbXBvbmVudERlZldpdGhTY29wZSBhcyBwYXRjaENvbXBvbmVudERlZldpdGhTY29wZSxcbiAgybVSZW5kZXIzQ29tcG9uZW50RmFjdG9yeSBhcyBDb21wb25lbnRGYWN0b3J5LFxuICDJtVJlbmRlcjNOZ01vZHVsZVJlZiBhcyBOZ01vZHVsZVJlZixcbiAgybVyZXNvbHZlQ29tcG9uZW50UmVzb3VyY2VzLFxuICDJtXJlc3RvcmVDb21wb25lbnRSZXNvbHV0aW9uUXVldWUsXG4gIMm1c2V0TG9jYWxlSWQgYXMgc2V0TG9jYWxlSWQsXG4gIMm1dHJhbnNpdGl2ZVNjb3Blc0ZvciBhcyB0cmFuc2l0aXZlU2NvcGVzRm9yLFxuICDJtVVTRV9SVU5USU1FX0RFUFNfVFJBQ0tFUl9GT1JfSklUIGFzIFVTRV9SVU5USU1FX0RFUFNfVFJBQ0tFUl9GT1JfSklULFxuICDJtcm1SW5qZWN0YWJsZURlY2xhcmF0aW9uIGFzIEluamVjdGFibGVEZWNsYXJhdGlvbixcbiAgTmdab25lLFxuICBFcnJvckhhbmRsZXIsXG59IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuXG5pbXBvcnQge0NvbXBvbmVudERlZiwgQ29tcG9uZW50VHlwZX0gZnJvbSAnLi4vLi4vc3JjL3JlbmRlcjMnO1xuXG5pbXBvcnQge01ldGFkYXRhT3ZlcnJpZGV9IGZyb20gJy4vbWV0YWRhdGFfb3ZlcnJpZGUnO1xuaW1wb3J0IHtcbiAgQ29tcG9uZW50UmVzb2x2ZXIsXG4gIERpcmVjdGl2ZVJlc29sdmVyLFxuICBOZ01vZHVsZVJlc29sdmVyLFxuICBQaXBlUmVzb2x2ZXIsXG4gIFJlc29sdmVyLFxufSBmcm9tICcuL3Jlc29sdmVycyc7XG5pbXBvcnQge0RFRkVSX0JMT0NLX0RFRkFVTFRfQkVIQVZJT1IsIFRlc3RNb2R1bGVNZXRhZGF0YX0gZnJvbSAnLi90ZXN0X2JlZF9jb21tb24nO1xuaW1wb3J0IHtcbiAgUkVUSFJPV19BUFBMSUNBVElPTl9FUlJPUlNfREVGQVVMVCxcbiAgVGVzdEJlZEFwcGxpY2F0aW9uRXJyb3JIYW5kbGVyLFxufSBmcm9tICcuL2FwcGxpY2F0aW9uX2Vycm9yX2hhbmRsZXInO1xuXG5lbnVtIFRlc3RpbmdNb2R1bGVPdmVycmlkZSB7XG4gIERFQ0xBUkFUSU9OLFxuICBPVkVSUklERV9URU1QTEFURSxcbn1cblxuZnVuY3Rpb24gaXNUZXN0aW5nTW9kdWxlT3ZlcnJpZGUodmFsdWU6IHVua25vd24pOiB2YWx1ZSBpcyBUZXN0aW5nTW9kdWxlT3ZlcnJpZGUge1xuICByZXR1cm4gKFxuICAgIHZhbHVlID09PSBUZXN0aW5nTW9kdWxlT3ZlcnJpZGUuREVDTEFSQVRJT04gfHwgdmFsdWUgPT09IFRlc3RpbmdNb2R1bGVPdmVycmlkZS5PVkVSUklERV9URU1QTEFURVxuICApO1xufVxuXG5mdW5jdGlvbiBhc3NlcnROb1N0YW5kYWxvbmVDb21wb25lbnRzKFxuICB0eXBlczogVHlwZTxhbnk+W10sXG4gIHJlc29sdmVyOiBSZXNvbHZlcjxhbnk+LFxuICBsb2NhdGlvbjogc3RyaW5nLFxuKSB7XG4gIHR5cGVzLmZvckVhY2goKHR5cGUpID0+IHtcbiAgICBpZiAoIWdldEFzeW5jQ2xhc3NNZXRhZGF0YUZuKHR5cGUpKSB7XG4gICAgICBjb25zdCBjb21wb25lbnQgPSByZXNvbHZlci5yZXNvbHZlKHR5cGUpO1xuICAgICAgaWYgKGNvbXBvbmVudCAmJiBjb21wb25lbnQuc3RhbmRhbG9uZSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoybVnZW5lcmF0ZVN0YW5kYWxvbmVJbkRlY2xhcmF0aW9uc0Vycm9yKHR5cGUsIGxvY2F0aW9uKSk7XG4gICAgICB9XG4gICAgfVxuICB9KTtcbn1cblxuLy8gUmVzb2x2ZXJzIGZvciBBbmd1bGFyIGRlY29yYXRvcnNcbnR5cGUgUmVzb2x2ZXJzID0ge1xuICBtb2R1bGU6IFJlc29sdmVyPE5nTW9kdWxlPjtcbiAgY29tcG9uZW50OiBSZXNvbHZlcjxEaXJlY3RpdmU+O1xuICBkaXJlY3RpdmU6IFJlc29sdmVyPENvbXBvbmVudD47XG4gIHBpcGU6IFJlc29sdmVyPFBpcGU+O1xufTtcblxuaW50ZXJmYWNlIENsZWFudXBPcGVyYXRpb24ge1xuICBmaWVsZE5hbWU6IHN0cmluZztcbiAgb2JqZWN0OiBhbnk7XG4gIG9yaWdpbmFsVmFsdWU6IHVua25vd247XG59XG5cbmV4cG9ydCBjbGFzcyBUZXN0QmVkQ29tcGlsZXIge1xuICBwcml2YXRlIG9yaWdpbmFsQ29tcG9uZW50UmVzb2x1dGlvblF1ZXVlOiBNYXA8VHlwZTxhbnk+LCBDb21wb25lbnQ+IHwgbnVsbCA9IG51bGw7XG5cbiAgLy8gVGVzdGluZyBtb2R1bGUgY29uZmlndXJhdGlvblxuICBwcml2YXRlIGRlY2xhcmF0aW9uczogVHlwZTxhbnk+W10gPSBbXTtcbiAgcHJpdmF0ZSBpbXBvcnRzOiBUeXBlPGFueT5bXSA9IFtdO1xuICBwcml2YXRlIHByb3ZpZGVyczogUHJvdmlkZXJbXSA9IFtdO1xuICBwcml2YXRlIHNjaGVtYXM6IGFueVtdID0gW107XG5cbiAgLy8gUXVldWVzIG9mIGNvbXBvbmVudHMvZGlyZWN0aXZlcy9waXBlcyB0aGF0IHNob3VsZCBiZSByZWNvbXBpbGVkLlxuICBwcml2YXRlIHBlbmRpbmdDb21wb25lbnRzID0gbmV3IFNldDxUeXBlPGFueT4+KCk7XG4gIHByaXZhdGUgcGVuZGluZ0RpcmVjdGl2ZXMgPSBuZXcgU2V0PFR5cGU8YW55Pj4oKTtcbiAgcHJpdmF0ZSBwZW5kaW5nUGlwZXMgPSBuZXcgU2V0PFR5cGU8YW55Pj4oKTtcblxuICAvLyBTZXQgb2YgY29tcG9uZW50cyB3aXRoIGFzeW5jIG1ldGFkYXRhLCBpLmUuIGNvbXBvbmVudHMgd2l0aCBgQGRlZmVyYCBibG9ja3NcbiAgLy8gaW4gdGhlaXIgdGVtcGxhdGVzLlxuICBwcml2YXRlIGNvbXBvbmVudHNXaXRoQXN5bmNNZXRhZGF0YSA9IG5ldyBTZXQ8VHlwZTx1bmtub3duPj4oKTtcblxuICAvLyBLZWVwIHRyYWNrIG9mIGFsbCBjb21wb25lbnRzIGFuZCBkaXJlY3RpdmVzLCBzbyB3ZSBjYW4gcGF0Y2ggUHJvdmlkZXJzIG9udG8gZGVmcyBsYXRlci5cbiAgcHJpdmF0ZSBzZWVuQ29tcG9uZW50cyA9IG5ldyBTZXQ8VHlwZTxhbnk+PigpO1xuICBwcml2YXRlIHNlZW5EaXJlY3RpdmVzID0gbmV3IFNldDxUeXBlPGFueT4+KCk7XG5cbiAgLy8gS2VlcCB0cmFjayBvZiBvdmVycmlkZGVuIG1vZHVsZXMsIHNvIHRoYXQgd2UgY2FuIGNvbGxlY3QgYWxsIGFmZmVjdGVkIG9uZXMgaW4gdGhlIG1vZHVsZSB0cmVlLlxuICBwcml2YXRlIG92ZXJyaWRkZW5Nb2R1bGVzID0gbmV3IFNldDxOZ01vZHVsZVR5cGU8YW55Pj4oKTtcblxuICAvLyBTdG9yZSByZXNvbHZlZCBzdHlsZXMgZm9yIENvbXBvbmVudHMgdGhhdCBoYXZlIHRlbXBsYXRlIG92ZXJyaWRlcyBwcmVzZW50IGFuZCBgc3R5bGVVcmxzYFxuICAvLyBkZWZpbmVkIGF0IHRoZSBzYW1lIHRpbWUuXG4gIHByaXZhdGUgZXhpc3RpbmdDb21wb25lbnRTdHlsZXMgPSBuZXcgTWFwPFR5cGU8YW55Piwgc3RyaW5nW10+KCk7XG5cbiAgcHJpdmF0ZSByZXNvbHZlcnM6IFJlc29sdmVycyA9IGluaXRSZXNvbHZlcnMoKTtcblxuICAvLyBNYXAgb2YgY29tcG9uZW50IHR5cGUgdG8gYW4gTmdNb2R1bGUgdGhhdCBkZWNsYXJlcyBpdC5cbiAgLy9cbiAgLy8gVGhlcmUgYXJlIGEgY291cGxlIHNwZWNpYWwgY2FzZXM6XG4gIC8vIC0gZm9yIHN0YW5kYWxvbmUgY29tcG9uZW50cywgdGhlIG1vZHVsZSBzY29wZSB2YWx1ZSBpcyBgbnVsbGBcbiAgLy8gLSB3aGVuIGEgY29tcG9uZW50IGlzIGRlY2xhcmVkIGluIGBUZXN0QmVkLmNvbmZpZ3VyZVRlc3RpbmdNb2R1bGUoKWAgY2FsbCBvclxuICAvLyAgIGEgY29tcG9uZW50J3MgdGVtcGxhdGUgaXMgb3ZlcnJpZGRlbiB2aWEgYFRlc3RCZWQub3ZlcnJpZGVUZW1wbGF0ZVVzaW5nVGVzdGluZ01vZHVsZSgpYC5cbiAgLy8gICB3ZSB1c2UgYSBzcGVjaWFsIHZhbHVlIGZyb20gdGhlIGBUZXN0aW5nTW9kdWxlT3ZlcnJpZGVgIGVudW0uXG4gIHByaXZhdGUgY29tcG9uZW50VG9Nb2R1bGVTY29wZSA9IG5ldyBNYXA8VHlwZTxhbnk+LCBUeXBlPGFueT4gfCBUZXN0aW5nTW9kdWxlT3ZlcnJpZGUgfCBudWxsPigpO1xuXG4gIC8vIE1hcCB0aGF0IGtlZXBzIGluaXRpYWwgdmVyc2lvbiBvZiBjb21wb25lbnQvZGlyZWN0aXZlL3BpcGUgZGVmcyBpbiBjYXNlXG4gIC8vIHdlIGNvbXBpbGUgYSBUeXBlIGFnYWluLCB0aHVzIG92ZXJyaWRpbmcgcmVzcGVjdGl2ZSBzdGF0aWMgZmllbGRzLiBUaGlzIGlzXG4gIC8vIHJlcXVpcmVkIHRvIG1ha2Ugc3VyZSB3ZSByZXN0b3JlIGRlZnMgdG8gdGhlaXIgaW5pdGlhbCBzdGF0ZXMgYmV0d2VlbiB0ZXN0IHJ1bnMuXG4gIC8vIE5vdGU6IG9uZSBjbGFzcyBtYXkgaGF2ZSBtdWx0aXBsZSBkZWZzIChmb3IgZXhhbXBsZTogybVtb2QgYW5kIMm1aW5qIGluIGNhc2Ugb2YgYW5cbiAgLy8gTmdNb2R1bGUpLCBzdG9yZSBhbGwgb2YgdGhlbSBpbiBhIG1hcC5cbiAgcHJpdmF0ZSBpbml0aWFsTmdEZWZzID0gbmV3IE1hcDxUeXBlPGFueT4sIE1hcDxzdHJpbmcsIFByb3BlcnR5RGVzY3JpcHRvciB8IHVuZGVmaW5lZD4+KCk7XG5cbiAgLy8gQXJyYXkgdGhhdCBrZWVwcyBjbGVhbnVwIG9wZXJhdGlvbnMgZm9yIGluaXRpYWwgdmVyc2lvbnMgb2YgY29tcG9uZW50L2RpcmVjdGl2ZS9waXBlL21vZHVsZVxuICAvLyBkZWZzIGluIGNhc2UgVGVzdEJlZCBtYWtlcyBjaGFuZ2VzIHRvIHRoZSBvcmlnaW5hbHMuXG4gIHByaXZhdGUgZGVmQ2xlYW51cE9wczogQ2xlYW51cE9wZXJhdGlvbltdID0gW107XG5cbiAgcHJpdmF0ZSBfaW5qZWN0b3I6IEluamVjdG9yIHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgY29tcGlsZXJQcm92aWRlcnM6IFByb3ZpZGVyW10gfCBudWxsID0gbnVsbDtcblxuICBwcml2YXRlIHByb3ZpZGVyT3ZlcnJpZGVzOiBQcm92aWRlcltdID0gW107XG4gIHByaXZhdGUgcm9vdFByb3ZpZGVyT3ZlcnJpZGVzOiBQcm92aWRlcltdID0gW107XG4gIC8vIE92ZXJyaWRlcyBmb3IgaW5qZWN0YWJsZXMgd2l0aCBge3Byb3ZpZGVkSW46IFNvbWVNb2R1bGV9YCBuZWVkIHRvIGJlIHRyYWNrZWQgYW5kIGFkZGVkIHRvIHRoYXRcbiAgLy8gbW9kdWxlJ3MgcHJvdmlkZXIgbGlzdC5cbiAgcHJpdmF0ZSBwcm92aWRlck92ZXJyaWRlc0J5TW9kdWxlID0gbmV3IE1hcDxJbmplY3RvclR5cGU8YW55PiwgUHJvdmlkZXJbXT4oKTtcbiAgcHJpdmF0ZSBwcm92aWRlck92ZXJyaWRlc0J5VG9rZW4gPSBuZXcgTWFwPGFueSwgUHJvdmlkZXI+KCk7XG4gIHByaXZhdGUgc2NvcGVzV2l0aE92ZXJyaWRkZW5Qcm92aWRlcnMgPSBuZXcgU2V0PFR5cGU8YW55Pj4oKTtcblxuICBwcml2YXRlIHRlc3RNb2R1bGVUeXBlOiBOZ01vZHVsZVR5cGU8YW55PjtcbiAgcHJpdmF0ZSB0ZXN0TW9kdWxlUmVmOiBOZ01vZHVsZVJlZjxhbnk+IHwgbnVsbCA9IG51bGw7XG5cbiAgcHJpdmF0ZSBkZWZlckJsb2NrQmVoYXZpb3IgPSBERUZFUl9CTE9DS19ERUZBVUxUX0JFSEFWSU9SO1xuICBwcml2YXRlIHJldGhyb3dBcHBsaWNhdGlvblRpY2tFcnJvcnMgPSBSRVRIUk9XX0FQUExJQ0FUSU9OX0VSUk9SU19ERUZBVUxUO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIHByaXZhdGUgcGxhdGZvcm06IFBsYXRmb3JtUmVmLFxuICAgIHByaXZhdGUgYWRkaXRpb25hbE1vZHVsZVR5cGVzOiBUeXBlPGFueT4gfCBUeXBlPGFueT5bXSxcbiAgKSB7XG4gICAgY2xhc3MgRHluYW1pY1Rlc3RNb2R1bGUge31cbiAgICB0aGlzLnRlc3RNb2R1bGVUeXBlID0gRHluYW1pY1Rlc3RNb2R1bGUgYXMgYW55O1xuICB9XG5cbiAgc2V0Q29tcGlsZXJQcm92aWRlcnMocHJvdmlkZXJzOiBQcm92aWRlcltdIHwgbnVsbCk6IHZvaWQge1xuICAgIHRoaXMuY29tcGlsZXJQcm92aWRlcnMgPSBwcm92aWRlcnM7XG4gICAgdGhpcy5faW5qZWN0b3IgPSBudWxsO1xuICB9XG5cbiAgY29uZmlndXJlVGVzdGluZ01vZHVsZShtb2R1bGVEZWY6IFRlc3RNb2R1bGVNZXRhZGF0YSk6IHZvaWQge1xuICAgIC8vIEVucXVldWUgYW55IGNvbXBpbGF0aW9uIHRhc2tzIGZvciB0aGUgZGlyZWN0bHkgZGVjbGFyZWQgY29tcG9uZW50LlxuICAgIGlmIChtb2R1bGVEZWYuZGVjbGFyYXRpb25zICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIC8vIFZlcmlmeSB0aGF0IHRoZXJlIGFyZSBubyBzdGFuZGFsb25lIGNvbXBvbmVudHNcbiAgICAgIGFzc2VydE5vU3RhbmRhbG9uZUNvbXBvbmVudHMoXG4gICAgICAgIG1vZHVsZURlZi5kZWNsYXJhdGlvbnMsXG4gICAgICAgIHRoaXMucmVzb2x2ZXJzLmNvbXBvbmVudCxcbiAgICAgICAgJ1wiVGVzdEJlZC5jb25maWd1cmVUZXN0aW5nTW9kdWxlXCIgY2FsbCcsXG4gICAgICApO1xuICAgICAgdGhpcy5xdWV1ZVR5cGVBcnJheShtb2R1bGVEZWYuZGVjbGFyYXRpb25zLCBUZXN0aW5nTW9kdWxlT3ZlcnJpZGUuREVDTEFSQVRJT04pO1xuICAgICAgdGhpcy5kZWNsYXJhdGlvbnMucHVzaCguLi5tb2R1bGVEZWYuZGVjbGFyYXRpb25zKTtcbiAgICB9XG5cbiAgICAvLyBFbnF1ZXVlIGFueSBjb21waWxhdGlvbiB0YXNrcyBmb3IgaW1wb3J0ZWQgbW9kdWxlcy5cbiAgICBpZiAobW9kdWxlRGVmLmltcG9ydHMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhpcy5xdWV1ZVR5cGVzRnJvbU1vZHVsZXNBcnJheShtb2R1bGVEZWYuaW1wb3J0cyk7XG4gICAgICB0aGlzLmltcG9ydHMucHVzaCguLi5tb2R1bGVEZWYuaW1wb3J0cyk7XG4gICAgfVxuXG4gICAgaWYgKG1vZHVsZURlZi5wcm92aWRlcnMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhpcy5wcm92aWRlcnMucHVzaCguLi5tb2R1bGVEZWYucHJvdmlkZXJzKTtcbiAgICB9XG5cbiAgICBpZiAobW9kdWxlRGVmLnNjaGVtYXMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhpcy5zY2hlbWFzLnB1c2goLi4ubW9kdWxlRGVmLnNjaGVtYXMpO1xuICAgIH1cblxuICAgIHRoaXMuZGVmZXJCbG9ja0JlaGF2aW9yID0gbW9kdWxlRGVmLmRlZmVyQmxvY2tCZWhhdmlvciA/PyBERUZFUl9CTE9DS19ERUZBVUxUX0JFSEFWSU9SO1xuICAgIHRoaXMucmV0aHJvd0FwcGxpY2F0aW9uVGlja0Vycm9ycyA9XG4gICAgICBtb2R1bGVEZWYucmV0aHJvd0FwcGxpY2F0aW9uRXJyb3JzID8/IFJFVEhST1dfQVBQTElDQVRJT05fRVJST1JTX0RFRkFVTFQ7XG4gIH1cblxuICBvdmVycmlkZU1vZHVsZShuZ01vZHVsZTogVHlwZTxhbnk+LCBvdmVycmlkZTogTWV0YWRhdGFPdmVycmlkZTxOZ01vZHVsZT4pOiB2b2lkIHtcbiAgICBpZiAoVVNFX1JVTlRJTUVfREVQU19UUkFDS0VSX0ZPUl9KSVQpIHtcbiAgICAgIGRlcHNUcmFja2VyLmNsZWFyU2NvcGVDYWNoZUZvcihuZ01vZHVsZSk7XG4gICAgfVxuICAgIHRoaXMub3ZlcnJpZGRlbk1vZHVsZXMuYWRkKG5nTW9kdWxlIGFzIE5nTW9kdWxlVHlwZTxhbnk+KTtcblxuICAgIC8vIENvbXBpbGUgdGhlIG1vZHVsZSByaWdodCBhd2F5LlxuICAgIHRoaXMucmVzb2x2ZXJzLm1vZHVsZS5hZGRPdmVycmlkZShuZ01vZHVsZSwgb3ZlcnJpZGUpO1xuICAgIGNvbnN0IG1ldGFkYXRhID0gdGhpcy5yZXNvbHZlcnMubW9kdWxlLnJlc29sdmUobmdNb2R1bGUpO1xuICAgIGlmIChtZXRhZGF0YSA9PT0gbnVsbCkge1xuICAgICAgdGhyb3cgaW52YWxpZFR5cGVFcnJvcihuZ01vZHVsZS5uYW1lLCAnTmdNb2R1bGUnKTtcbiAgICB9XG5cbiAgICB0aGlzLnJlY29tcGlsZU5nTW9kdWxlKG5nTW9kdWxlLCBtZXRhZGF0YSk7XG5cbiAgICAvLyBBdCB0aGlzIHBvaW50LCB0aGUgbW9kdWxlIGhhcyBhIHZhbGlkIG1vZHVsZSBkZWYgKMm1bW9kKSwgYnV0IHRoZSBvdmVycmlkZSBtYXkgaGF2ZSBpbnRyb2R1Y2VkXG4gICAgLy8gbmV3IGRlY2xhcmF0aW9ucyBvciBpbXBvcnRlZCBtb2R1bGVzLiBJbmdlc3QgYW55IHBvc3NpYmxlIG5ldyB0eXBlcyBhbmQgYWRkIHRoZW0gdG8gdGhlXG4gICAgLy8gY3VycmVudCBxdWV1ZS5cbiAgICB0aGlzLnF1ZXVlVHlwZXNGcm9tTW9kdWxlc0FycmF5KFtuZ01vZHVsZV0pO1xuICB9XG5cbiAgb3ZlcnJpZGVDb21wb25lbnQoY29tcG9uZW50OiBUeXBlPGFueT4sIG92ZXJyaWRlOiBNZXRhZGF0YU92ZXJyaWRlPENvbXBvbmVudD4pOiB2b2lkIHtcbiAgICB0aGlzLnZlcmlmeU5vU3RhbmRhbG9uZUZsYWdPdmVycmlkZXMoY29tcG9uZW50LCBvdmVycmlkZSk7XG4gICAgdGhpcy5yZXNvbHZlcnMuY29tcG9uZW50LmFkZE92ZXJyaWRlKGNvbXBvbmVudCwgb3ZlcnJpZGUpO1xuICAgIHRoaXMucGVuZGluZ0NvbXBvbmVudHMuYWRkKGNvbXBvbmVudCk7XG5cbiAgICAvLyBJZiB0aGlzIGlzIGEgY29tcG9uZW50IHdpdGggYXN5bmMgbWV0YWRhdGEgKGkuZS4gYSBjb21wb25lbnQgd2l0aCBhIGBAZGVmZXJgIGJsb2NrXG4gICAgLy8gaW4gYSB0ZW1wbGF0ZSkgLSBzdG9yZSBpdCBmb3IgZnV0dXJlIHByb2Nlc3NpbmcuXG4gICAgdGhpcy5tYXliZVJlZ2lzdGVyQ29tcG9uZW50V2l0aEFzeW5jTWV0YWRhdGEoY29tcG9uZW50KTtcbiAgfVxuXG4gIG92ZXJyaWRlRGlyZWN0aXZlKGRpcmVjdGl2ZTogVHlwZTxhbnk+LCBvdmVycmlkZTogTWV0YWRhdGFPdmVycmlkZTxEaXJlY3RpdmU+KTogdm9pZCB7XG4gICAgdGhpcy52ZXJpZnlOb1N0YW5kYWxvbmVGbGFnT3ZlcnJpZGVzKGRpcmVjdGl2ZSwgb3ZlcnJpZGUpO1xuICAgIHRoaXMucmVzb2x2ZXJzLmRpcmVjdGl2ZS5hZGRPdmVycmlkZShkaXJlY3RpdmUsIG92ZXJyaWRlKTtcbiAgICB0aGlzLnBlbmRpbmdEaXJlY3RpdmVzLmFkZChkaXJlY3RpdmUpO1xuICB9XG5cbiAgb3ZlcnJpZGVQaXBlKHBpcGU6IFR5cGU8YW55Piwgb3ZlcnJpZGU6IE1ldGFkYXRhT3ZlcnJpZGU8UGlwZT4pOiB2b2lkIHtcbiAgICB0aGlzLnZlcmlmeU5vU3RhbmRhbG9uZUZsYWdPdmVycmlkZXMocGlwZSwgb3ZlcnJpZGUpO1xuICAgIHRoaXMucmVzb2x2ZXJzLnBpcGUuYWRkT3ZlcnJpZGUocGlwZSwgb3ZlcnJpZGUpO1xuICAgIHRoaXMucGVuZGluZ1BpcGVzLmFkZChwaXBlKTtcbiAgfVxuXG4gIHByaXZhdGUgdmVyaWZ5Tm9TdGFuZGFsb25lRmxhZ092ZXJyaWRlcyhcbiAgICB0eXBlOiBUeXBlPGFueT4sXG4gICAgb3ZlcnJpZGU6IE1ldGFkYXRhT3ZlcnJpZGU8Q29tcG9uZW50IHwgRGlyZWN0aXZlIHwgUGlwZT4sXG4gICkge1xuICAgIGlmIChcbiAgICAgIG92ZXJyaWRlLmFkZD8uaGFzT3duUHJvcGVydHkoJ3N0YW5kYWxvbmUnKSB8fFxuICAgICAgb3ZlcnJpZGUuc2V0Py5oYXNPd25Qcm9wZXJ0eSgnc3RhbmRhbG9uZScpIHx8XG4gICAgICBvdmVycmlkZS5yZW1vdmU/Lmhhc093blByb3BlcnR5KCdzdGFuZGFsb25lJylcbiAgICApIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgYEFuIG92ZXJyaWRlIGZvciB0aGUgJHt0eXBlLm5hbWV9IGNsYXNzIGhhcyB0aGUgXFxgc3RhbmRhbG9uZVxcYCBmbGFnLiBgICtcbiAgICAgICAgICBgQ2hhbmdpbmcgdGhlIFxcYHN0YW5kYWxvbmVcXGAgZmxhZyB2aWEgVGVzdEJlZCBvdmVycmlkZXMgaXMgbm90IHN1cHBvcnRlZC5gLFxuICAgICAgKTtcbiAgICB9XG4gIH1cblxuICBvdmVycmlkZVByb3ZpZGVyKFxuICAgIHRva2VuOiBhbnksXG4gICAgcHJvdmlkZXI6IHt1c2VGYWN0b3J5PzogRnVuY3Rpb247IHVzZVZhbHVlPzogYW55OyBkZXBzPzogYW55W107IG11bHRpPzogYm9vbGVhbn0sXG4gICk6IHZvaWQge1xuICAgIGxldCBwcm92aWRlckRlZjogUHJvdmlkZXI7XG4gICAgaWYgKHByb3ZpZGVyLnVzZUZhY3RvcnkgIT09IHVuZGVmaW5lZCkge1xuICAgICAgcHJvdmlkZXJEZWYgPSB7XG4gICAgICAgIHByb3ZpZGU6IHRva2VuLFxuICAgICAgICB1c2VGYWN0b3J5OiBwcm92aWRlci51c2VGYWN0b3J5LFxuICAgICAgICBkZXBzOiBwcm92aWRlci5kZXBzIHx8IFtdLFxuICAgICAgICBtdWx0aTogcHJvdmlkZXIubXVsdGksXG4gICAgICB9O1xuICAgIH0gZWxzZSBpZiAocHJvdmlkZXIudXNlVmFsdWUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgcHJvdmlkZXJEZWYgPSB7cHJvdmlkZTogdG9rZW4sIHVzZVZhbHVlOiBwcm92aWRlci51c2VWYWx1ZSwgbXVsdGk6IHByb3ZpZGVyLm11bHRpfTtcbiAgICB9IGVsc2Uge1xuICAgICAgcHJvdmlkZXJEZWYgPSB7cHJvdmlkZTogdG9rZW59O1xuICAgIH1cblxuICAgIGNvbnN0IGluamVjdGFibGVEZWY6IEluamVjdGFibGVEZWNsYXJhdGlvbjxhbnk+IHwgbnVsbCA9XG4gICAgICB0eXBlb2YgdG9rZW4gIT09ICdzdHJpbmcnID8gZ2V0SW5qZWN0YWJsZURlZih0b2tlbikgOiBudWxsO1xuICAgIGNvbnN0IHByb3ZpZGVkSW4gPSBpbmplY3RhYmxlRGVmID09PSBudWxsID8gbnVsbCA6IHJlc29sdmVGb3J3YXJkUmVmKGluamVjdGFibGVEZWYucHJvdmlkZWRJbik7XG4gICAgY29uc3Qgb3ZlcnJpZGVzQnVja2V0ID1cbiAgICAgIHByb3ZpZGVkSW4gPT09ICdyb290JyA/IHRoaXMucm9vdFByb3ZpZGVyT3ZlcnJpZGVzIDogdGhpcy5wcm92aWRlck92ZXJyaWRlcztcbiAgICBvdmVycmlkZXNCdWNrZXQucHVzaChwcm92aWRlckRlZik7XG5cbiAgICAvLyBLZWVwIG92ZXJyaWRlcyBncm91cGVkIGJ5IHRva2VuIGFzIHdlbGwgZm9yIGZhc3QgbG9va3VwcyB1c2luZyB0b2tlblxuICAgIHRoaXMucHJvdmlkZXJPdmVycmlkZXNCeVRva2VuLnNldCh0b2tlbiwgcHJvdmlkZXJEZWYpO1xuICAgIGlmIChpbmplY3RhYmxlRGVmICE9PSBudWxsICYmIHByb3ZpZGVkSW4gIT09IG51bGwgJiYgdHlwZW9mIHByb3ZpZGVkSW4gIT09ICdzdHJpbmcnKSB7XG4gICAgICBjb25zdCBleGlzdGluZ092ZXJyaWRlcyA9IHRoaXMucHJvdmlkZXJPdmVycmlkZXNCeU1vZHVsZS5nZXQocHJvdmlkZWRJbik7XG4gICAgICBpZiAoZXhpc3RpbmdPdmVycmlkZXMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBleGlzdGluZ092ZXJyaWRlcy5wdXNoKHByb3ZpZGVyRGVmKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMucHJvdmlkZXJPdmVycmlkZXNCeU1vZHVsZS5zZXQocHJvdmlkZWRJbiwgW3Byb3ZpZGVyRGVmXSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgb3ZlcnJpZGVUZW1wbGF0ZVVzaW5nVGVzdGluZ01vZHVsZSh0eXBlOiBUeXBlPGFueT4sIHRlbXBsYXRlOiBzdHJpbmcpOiB2b2lkIHtcbiAgICBjb25zdCBkZWYgPSAodHlwZSBhcyBhbnkpW05HX0NPTVBfREVGXTtcbiAgICBjb25zdCBoYXNTdHlsZVVybHMgPSAoKTogYm9vbGVhbiA9PiB7XG4gICAgICBjb25zdCBtZXRhZGF0YSA9IHRoaXMucmVzb2x2ZXJzLmNvbXBvbmVudC5yZXNvbHZlKHR5cGUpISBhcyBDb21wb25lbnQ7XG4gICAgICByZXR1cm4gISFtZXRhZGF0YS5zdHlsZVVybCB8fCAhIW1ldGFkYXRhLnN0eWxlVXJscz8ubGVuZ3RoO1xuICAgIH07XG4gICAgY29uc3Qgb3ZlcnJpZGVTdHlsZVVybHMgPSAhIWRlZiAmJiAhybVpc0NvbXBvbmVudERlZlBlbmRpbmdSZXNvbHV0aW9uKHR5cGUpICYmIGhhc1N0eWxlVXJscygpO1xuXG4gICAgLy8gSW4gSXZ5LCBjb21waWxpbmcgYSBjb21wb25lbnQgZG9lcyBub3QgcmVxdWlyZSBrbm93aW5nIHRoZSBtb2R1bGUgcHJvdmlkaW5nIHRoZVxuICAgIC8vIGNvbXBvbmVudCdzIHNjb3BlLCBzbyBvdmVycmlkZVRlbXBsYXRlVXNpbmdUZXN0aW5nTW9kdWxlIGNhbiBiZSBpbXBsZW1lbnRlZCBwdXJlbHkgdmlhXG4gICAgLy8gb3ZlcnJpZGVDb21wb25lbnQuIEltcG9ydGFudDogb3ZlcnJpZGluZyB0ZW1wbGF0ZSByZXF1aXJlcyBmdWxsIENvbXBvbmVudCByZS1jb21waWxhdGlvbixcbiAgICAvLyB3aGljaCBtYXkgZmFpbCBpbiBjYXNlIHN0eWxlVXJscyBhcmUgYWxzbyBwcmVzZW50ICh0aHVzIENvbXBvbmVudCBpcyBjb25zaWRlcmVkIGFzIHJlcXVpcmVkXG4gICAgLy8gcmVzb2x1dGlvbikuIEluIG9yZGVyIHRvIGF2b2lkIHRoaXMsIHdlIHByZWVtcHRpdmVseSBzZXQgc3R5bGVVcmxzIHRvIGFuIGVtcHR5IGFycmF5LFxuICAgIC8vIHByZXNlcnZlIGN1cnJlbnQgc3R5bGVzIGF2YWlsYWJsZSBvbiBDb21wb25lbnQgZGVmIGFuZCByZXN0b3JlIHN0eWxlcyBiYWNrIG9uY2UgY29tcGlsYXRpb25cbiAgICAvLyBpcyBjb21wbGV0ZS5cbiAgICBjb25zdCBvdmVycmlkZSA9IG92ZXJyaWRlU3R5bGVVcmxzXG4gICAgICA/IHt0ZW1wbGF0ZSwgc3R5bGVzOiBbXSwgc3R5bGVVcmxzOiBbXSwgc3R5bGVVcmw6IHVuZGVmaW5lZH1cbiAgICAgIDoge3RlbXBsYXRlfTtcbiAgICB0aGlzLm92ZXJyaWRlQ29tcG9uZW50KHR5cGUsIHtzZXQ6IG92ZXJyaWRlfSk7XG5cbiAgICBpZiAob3ZlcnJpZGVTdHlsZVVybHMgJiYgZGVmLnN0eWxlcyAmJiBkZWYuc3R5bGVzLmxlbmd0aCA+IDApIHtcbiAgICAgIHRoaXMuZXhpc3RpbmdDb21wb25lbnRTdHlsZXMuc2V0KHR5cGUsIGRlZi5zdHlsZXMpO1xuICAgIH1cblxuICAgIC8vIFNldCB0aGUgY29tcG9uZW50J3Mgc2NvcGUgdG8gYmUgdGhlIHRlc3RpbmcgbW9kdWxlLlxuICAgIHRoaXMuY29tcG9uZW50VG9Nb2R1bGVTY29wZS5zZXQodHlwZSwgVGVzdGluZ01vZHVsZU92ZXJyaWRlLk9WRVJSSURFX1RFTVBMQVRFKTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgcmVzb2x2ZVBlbmRpbmdDb21wb25lbnRzV2l0aEFzeW5jTWV0YWRhdGEoKSB7XG4gICAgaWYgKHRoaXMuY29tcG9uZW50c1dpdGhBc3luY01ldGFkYXRhLnNpemUgPT09IDApIHJldHVybjtcblxuICAgIGNvbnN0IHByb21pc2VzID0gW107XG4gICAgZm9yIChjb25zdCBjb21wb25lbnQgb2YgdGhpcy5jb21wb25lbnRzV2l0aEFzeW5jTWV0YWRhdGEpIHtcbiAgICAgIGNvbnN0IGFzeW5jTWV0YWRhdGFGbiA9IGdldEFzeW5jQ2xhc3NNZXRhZGF0YUZuKGNvbXBvbmVudCk7XG4gICAgICBpZiAoYXN5bmNNZXRhZGF0YUZuKSB7XG4gICAgICAgIHByb21pc2VzLnB1c2goYXN5bmNNZXRhZGF0YUZuKCkpO1xuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLmNvbXBvbmVudHNXaXRoQXN5bmNNZXRhZGF0YS5jbGVhcigpO1xuXG4gICAgY29uc3QgcmVzb2x2ZWREZXBzID0gYXdhaXQgUHJvbWlzZS5hbGwocHJvbWlzZXMpO1xuICAgIGNvbnN0IGZsYXRSZXNvbHZlZERlcHMgPSByZXNvbHZlZERlcHMuZmxhdCgyKTtcbiAgICB0aGlzLnF1ZXVlVHlwZXNGcm9tTW9kdWxlc0FycmF5KGZsYXRSZXNvbHZlZERlcHMpO1xuXG4gICAgLy8gTG9hZGVkIHN0YW5kYWxvbmUgY29tcG9uZW50cyBtaWdodCBjb250YWluIGltcG9ydHMgb2YgTmdNb2R1bGVzXG4gICAgLy8gd2l0aCBwcm92aWRlcnMsIG1ha2Ugc3VyZSB3ZSBvdmVycmlkZSBwcm92aWRlcnMgdGhlcmUgdG9vLlxuICAgIGZvciAoY29uc3QgY29tcG9uZW50IG9mIGZsYXRSZXNvbHZlZERlcHMpIHtcbiAgICAgIHRoaXMuYXBwbHlQcm92aWRlck92ZXJyaWRlc0luU2NvcGUoY29tcG9uZW50KTtcbiAgICB9XG4gIH1cblxuICBhc3luYyBjb21waWxlQ29tcG9uZW50cygpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0aGlzLmNsZWFyQ29tcG9uZW50UmVzb2x1dGlvblF1ZXVlKCk7XG5cbiAgICAvLyBXYWl0IGZvciBhbGwgYXN5bmMgbWV0YWRhdGEgZm9yIGNvbXBvbmVudHMgdGhhdCB3ZXJlXG4gICAgLy8gb3ZlcnJpZGRlbiwgd2UgbmVlZCByZXNvbHZlZCBtZXRhZGF0YSB0byBwZXJmb3JtIGFuIG92ZXJyaWRlXG4gICAgLy8gYW5kIHJlLWNvbXBpbGUgYSBjb21wb25lbnQuXG4gICAgYXdhaXQgdGhpcy5yZXNvbHZlUGVuZGluZ0NvbXBvbmVudHNXaXRoQXN5bmNNZXRhZGF0YSgpO1xuXG4gICAgLy8gVmVyaWZ5IHRoYXQgdGhlcmUgd2VyZSBubyBzdGFuZGFsb25lIGNvbXBvbmVudHMgcHJlc2VudCBpbiB0aGUgYGRlY2xhcmF0aW9uc2AgZmllbGRcbiAgICAvLyBkdXJpbmcgdGhlIGBUZXN0QmVkLmNvbmZpZ3VyZVRlc3RpbmdNb2R1bGVgIGNhbGwuIFdlIHBlcmZvcm0gdGhpcyBjaGVjayBoZXJlIGluIGFkZGl0aW9uXG4gICAgLy8gdG8gdGhlIGxvZ2ljIGluIHRoZSBgY29uZmlndXJlVGVzdGluZ01vZHVsZWAgZnVuY3Rpb24sIHNpbmNlIGF0IHRoaXMgcG9pbnQgd2UgaGF2ZVxuICAgIC8vIGFsbCBhc3luYyBtZXRhZGF0YSByZXNvbHZlZC5cbiAgICBhc3NlcnROb1N0YW5kYWxvbmVDb21wb25lbnRzKFxuICAgICAgdGhpcy5kZWNsYXJhdGlvbnMsXG4gICAgICB0aGlzLnJlc29sdmVycy5jb21wb25lbnQsXG4gICAgICAnXCJUZXN0QmVkLmNvbmZpZ3VyZVRlc3RpbmdNb2R1bGVcIiBjYWxsJyxcbiAgICApO1xuXG4gICAgLy8gUnVuIGNvbXBpbGVycyBmb3IgYWxsIHF1ZXVlZCB0eXBlcy5cbiAgICBsZXQgbmVlZHNBc3luY1Jlc291cmNlcyA9IHRoaXMuY29tcGlsZVR5cGVzU3luYygpO1xuXG4gICAgLy8gY29tcGlsZUNvbXBvbmVudHMoKSBzaG91bGQgbm90IGJlIGFzeW5jIHVubGVzcyBpdCBuZWVkcyB0byBiZS5cbiAgICBpZiAobmVlZHNBc3luY1Jlc291cmNlcykge1xuICAgICAgbGV0IHJlc291cmNlTG9hZGVyOiBSZXNvdXJjZUxvYWRlcjtcbiAgICAgIGxldCByZXNvbHZlciA9ICh1cmw6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiA9PiB7XG4gICAgICAgIGlmICghcmVzb3VyY2VMb2FkZXIpIHtcbiAgICAgICAgICByZXNvdXJjZUxvYWRlciA9IHRoaXMuaW5qZWN0b3IuZ2V0KFJlc291cmNlTG9hZGVyKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHJlc291cmNlTG9hZGVyLmdldCh1cmwpKTtcbiAgICAgIH07XG4gICAgICBhd2FpdCDJtXJlc29sdmVDb21wb25lbnRSZXNvdXJjZXMocmVzb2x2ZXIpO1xuICAgIH1cbiAgfVxuXG4gIGZpbmFsaXplKCk6IE5nTW9kdWxlUmVmPGFueT4ge1xuICAgIC8vIE9uZSBsYXN0IGNvbXBpbGVcbiAgICB0aGlzLmNvbXBpbGVUeXBlc1N5bmMoKTtcblxuICAgIC8vIENyZWF0ZSB0aGUgdGVzdGluZyBtb2R1bGUgaXRzZWxmLlxuICAgIHRoaXMuY29tcGlsZVRlc3RNb2R1bGUoKTtcblxuICAgIHRoaXMuYXBwbHlUcmFuc2l0aXZlU2NvcGVzKCk7XG5cbiAgICB0aGlzLmFwcGx5UHJvdmlkZXJPdmVycmlkZXMoKTtcblxuICAgIC8vIFBhdGNoIHByZXZpb3VzbHkgc3RvcmVkIGBzdHlsZXNgIENvbXBvbmVudCB2YWx1ZXMgKHRha2VuIGZyb20gybVjbXApLCBpbiBjYXNlIHRoZXNlXG4gICAgLy8gQ29tcG9uZW50cyBoYXZlIGBzdHlsZVVybHNgIGZpZWxkcyBkZWZpbmVkIGFuZCB0ZW1wbGF0ZSBvdmVycmlkZSB3YXMgcmVxdWVzdGVkLlxuICAgIHRoaXMucGF0Y2hDb21wb25lbnRzV2l0aEV4aXN0aW5nU3R5bGVzKCk7XG5cbiAgICAvLyBDbGVhciB0aGUgY29tcG9uZW50VG9Nb2R1bGVTY29wZSBtYXAsIHNvIHRoYXQgZnV0dXJlIGNvbXBpbGF0aW9ucyBkb24ndCByZXNldCB0aGUgc2NvcGUgb2ZcbiAgICAvLyBldmVyeSBjb21wb25lbnQuXG4gICAgdGhpcy5jb21wb25lbnRUb01vZHVsZVNjb3BlLmNsZWFyKCk7XG5cbiAgICBjb25zdCBwYXJlbnRJbmplY3RvciA9IHRoaXMucGxhdGZvcm0uaW5qZWN0b3I7XG4gICAgdGhpcy50ZXN0TW9kdWxlUmVmID0gbmV3IE5nTW9kdWxlUmVmKHRoaXMudGVzdE1vZHVsZVR5cGUsIHBhcmVudEluamVjdG9yLCBbXSk7XG5cbiAgICAvLyBBcHBsaWNhdGlvbkluaXRTdGF0dXMucnVuSW5pdGlhbGl6ZXJzKCkgaXMgbWFya2VkIEBpbnRlcm5hbCB0byBjb3JlLlxuICAgIC8vIENhc3QgaXQgdG8gYW55IGJlZm9yZSBhY2Nlc3NpbmcgaXQuXG4gICAgKHRoaXMudGVzdE1vZHVsZVJlZi5pbmplY3Rvci5nZXQoQXBwbGljYXRpb25Jbml0U3RhdHVzKSBhcyBhbnkpLnJ1bkluaXRpYWxpemVycygpO1xuXG4gICAgLy8gU2V0IGxvY2FsZSBJRCBhZnRlciBydW5uaW5nIGFwcCBpbml0aWFsaXplcnMsIHNpbmNlIGxvY2FsZSBpbmZvcm1hdGlvbiBtaWdodCBiZSB1cGRhdGVkIHdoaWxlXG4gICAgLy8gcnVubmluZyBpbml0aWFsaXplcnMuIFRoaXMgaXMgYWxzbyBjb25zaXN0ZW50IHdpdGggdGhlIGV4ZWN1dGlvbiBvcmRlciB3aGlsZSBib290c3RyYXBwaW5nIGFuXG4gICAgLy8gYXBwIChzZWUgYHBhY2thZ2VzL2NvcmUvc3JjL2FwcGxpY2F0aW9uX3JlZi50c2AgZmlsZSkuXG4gICAgY29uc3QgbG9jYWxlSWQgPSB0aGlzLnRlc3RNb2R1bGVSZWYuaW5qZWN0b3IuZ2V0KExPQ0FMRV9JRCwgREVGQVVMVF9MT0NBTEVfSUQpO1xuICAgIHNldExvY2FsZUlkKGxvY2FsZUlkKTtcblxuICAgIHJldHVybiB0aGlzLnRlc3RNb2R1bGVSZWY7XG4gIH1cblxuICAvKipcbiAgICogQGludGVybmFsXG4gICAqL1xuICBfY29tcGlsZU5nTW9kdWxlU3luYyhtb2R1bGVUeXBlOiBUeXBlPGFueT4pOiB2b2lkIHtcbiAgICB0aGlzLnF1ZXVlVHlwZXNGcm9tTW9kdWxlc0FycmF5KFttb2R1bGVUeXBlXSk7XG4gICAgdGhpcy5jb21waWxlVHlwZXNTeW5jKCk7XG4gICAgdGhpcy5hcHBseVByb3ZpZGVyT3ZlcnJpZGVzKCk7XG4gICAgdGhpcy5hcHBseVByb3ZpZGVyT3ZlcnJpZGVzSW5TY29wZShtb2R1bGVUeXBlKTtcbiAgICB0aGlzLmFwcGx5VHJhbnNpdGl2ZVNjb3BlcygpO1xuICB9XG5cbiAgLyoqXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgYXN5bmMgX2NvbXBpbGVOZ01vZHVsZUFzeW5jKG1vZHVsZVR5cGU6IFR5cGU8YW55Pik6IFByb21pc2U8dm9pZD4ge1xuICAgIHRoaXMucXVldWVUeXBlc0Zyb21Nb2R1bGVzQXJyYXkoW21vZHVsZVR5cGVdKTtcbiAgICBhd2FpdCB0aGlzLmNvbXBpbGVDb21wb25lbnRzKCk7XG4gICAgdGhpcy5hcHBseVByb3ZpZGVyT3ZlcnJpZGVzKCk7XG4gICAgdGhpcy5hcHBseVByb3ZpZGVyT3ZlcnJpZGVzSW5TY29wZShtb2R1bGVUeXBlKTtcbiAgICB0aGlzLmFwcGx5VHJhbnNpdGl2ZVNjb3BlcygpO1xuICB9XG5cbiAgLyoqXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgX2dldE1vZHVsZVJlc29sdmVyKCk6IFJlc29sdmVyPE5nTW9kdWxlPiB7XG4gICAgcmV0dXJuIHRoaXMucmVzb2x2ZXJzLm1vZHVsZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIF9nZXRDb21wb25lbnRGYWN0b3JpZXMobW9kdWxlVHlwZTogTmdNb2R1bGVUeXBlKTogQ29tcG9uZW50RmFjdG9yeTxhbnk+W10ge1xuICAgIHJldHVybiBtYXliZVVud3JhcEZuKG1vZHVsZVR5cGUuybVtb2QuZGVjbGFyYXRpb25zKS5yZWR1Y2UoKGZhY3RvcmllcywgZGVjbGFyYXRpb24pID0+IHtcbiAgICAgIGNvbnN0IGNvbXBvbmVudERlZiA9IChkZWNsYXJhdGlvbiBhcyBhbnkpLsm1Y21wO1xuICAgICAgY29tcG9uZW50RGVmICYmIGZhY3Rvcmllcy5wdXNoKG5ldyBDb21wb25lbnRGYWN0b3J5KGNvbXBvbmVudERlZiwgdGhpcy50ZXN0TW9kdWxlUmVmISkpO1xuICAgICAgcmV0dXJuIGZhY3RvcmllcztcbiAgICB9LCBbXSBhcyBDb21wb25lbnRGYWN0b3J5PGFueT5bXSk7XG4gIH1cblxuICBwcml2YXRlIGNvbXBpbGVUeXBlc1N5bmMoKTogYm9vbGVhbiB7XG4gICAgLy8gQ29tcGlsZSBhbGwgcXVldWVkIGNvbXBvbmVudHMsIGRpcmVjdGl2ZXMsIHBpcGVzLlxuICAgIGxldCBuZWVkc0FzeW5jUmVzb3VyY2VzID0gZmFsc2U7XG4gICAgdGhpcy5wZW5kaW5nQ29tcG9uZW50cy5mb3JFYWNoKChkZWNsYXJhdGlvbikgPT4ge1xuICAgICAgaWYgKGdldEFzeW5jQ2xhc3NNZXRhZGF0YUZuKGRlY2xhcmF0aW9uKSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgYENvbXBvbmVudCAnJHtkZWNsYXJhdGlvbi5uYW1lfScgaGFzIHVucmVzb2x2ZWQgbWV0YWRhdGEuIGAgK1xuICAgICAgICAgICAgYFBsZWFzZSBjYWxsIFxcYGF3YWl0IFRlc3RCZWQuY29tcGlsZUNvbXBvbmVudHMoKVxcYCBiZWZvcmUgcnVubmluZyB0aGlzIHRlc3QuYCxcbiAgICAgICAgKTtcbiAgICAgIH1cblxuICAgICAgbmVlZHNBc3luY1Jlc291cmNlcyA9IG5lZWRzQXN5bmNSZXNvdXJjZXMgfHwgybVpc0NvbXBvbmVudERlZlBlbmRpbmdSZXNvbHV0aW9uKGRlY2xhcmF0aW9uKTtcblxuICAgICAgY29uc3QgbWV0YWRhdGEgPSB0aGlzLnJlc29sdmVycy5jb21wb25lbnQucmVzb2x2ZShkZWNsYXJhdGlvbik7XG4gICAgICBpZiAobWV0YWRhdGEgPT09IG51bGwpIHtcbiAgICAgICAgdGhyb3cgaW52YWxpZFR5cGVFcnJvcihkZWNsYXJhdGlvbi5uYW1lLCAnQ29tcG9uZW50Jyk7XG4gICAgICB9XG5cbiAgICAgIHRoaXMubWF5YmVTdG9yZU5nRGVmKE5HX0NPTVBfREVGLCBkZWNsYXJhdGlvbik7XG4gICAgICBpZiAoVVNFX1JVTlRJTUVfREVQU19UUkFDS0VSX0ZPUl9KSVQpIHtcbiAgICAgICAgZGVwc1RyYWNrZXIuY2xlYXJTY29wZUNhY2hlRm9yKGRlY2xhcmF0aW9uKTtcbiAgICAgIH1cbiAgICAgIGNvbXBpbGVDb21wb25lbnQoZGVjbGFyYXRpb24sIG1ldGFkYXRhKTtcbiAgICB9KTtcbiAgICB0aGlzLnBlbmRpbmdDb21wb25lbnRzLmNsZWFyKCk7XG5cbiAgICB0aGlzLnBlbmRpbmdEaXJlY3RpdmVzLmZvckVhY2goKGRlY2xhcmF0aW9uKSA9PiB7XG4gICAgICBjb25zdCBtZXRhZGF0YSA9IHRoaXMucmVzb2x2ZXJzLmRpcmVjdGl2ZS5yZXNvbHZlKGRlY2xhcmF0aW9uKTtcbiAgICAgIGlmIChtZXRhZGF0YSA9PT0gbnVsbCkge1xuICAgICAgICB0aHJvdyBpbnZhbGlkVHlwZUVycm9yKGRlY2xhcmF0aW9uLm5hbWUsICdEaXJlY3RpdmUnKTtcbiAgICAgIH1cbiAgICAgIHRoaXMubWF5YmVTdG9yZU5nRGVmKE5HX0RJUl9ERUYsIGRlY2xhcmF0aW9uKTtcbiAgICAgIGNvbXBpbGVEaXJlY3RpdmUoZGVjbGFyYXRpb24sIG1ldGFkYXRhKTtcbiAgICB9KTtcbiAgICB0aGlzLnBlbmRpbmdEaXJlY3RpdmVzLmNsZWFyKCk7XG5cbiAgICB0aGlzLnBlbmRpbmdQaXBlcy5mb3JFYWNoKChkZWNsYXJhdGlvbikgPT4ge1xuICAgICAgY29uc3QgbWV0YWRhdGEgPSB0aGlzLnJlc29sdmVycy5waXBlLnJlc29sdmUoZGVjbGFyYXRpb24pO1xuICAgICAgaWYgKG1ldGFkYXRhID09PSBudWxsKSB7XG4gICAgICAgIHRocm93IGludmFsaWRUeXBlRXJyb3IoZGVjbGFyYXRpb24ubmFtZSwgJ1BpcGUnKTtcbiAgICAgIH1cbiAgICAgIHRoaXMubWF5YmVTdG9yZU5nRGVmKE5HX1BJUEVfREVGLCBkZWNsYXJhdGlvbik7XG4gICAgICBjb21waWxlUGlwZShkZWNsYXJhdGlvbiwgbWV0YWRhdGEpO1xuICAgIH0pO1xuICAgIHRoaXMucGVuZGluZ1BpcGVzLmNsZWFyKCk7XG5cbiAgICByZXR1cm4gbmVlZHNBc3luY1Jlc291cmNlcztcbiAgfVxuXG4gIHByaXZhdGUgYXBwbHlUcmFuc2l0aXZlU2NvcGVzKCk6IHZvaWQge1xuICAgIGlmICh0aGlzLm92ZXJyaWRkZW5Nb2R1bGVzLnNpemUgPiAwKSB7XG4gICAgICAvLyBNb2R1bGUgb3ZlcnJpZGVzICh2aWEgYFRlc3RCZWQub3ZlcnJpZGVNb2R1bGVgKSBtaWdodCBhZmZlY3Qgc2NvcGVzIHRoYXQgd2VyZSBwcmV2aW91c2x5XG4gICAgICAvLyBjYWxjdWxhdGVkIGFuZCBzdG9yZWQgaW4gYHRyYW5zaXRpdmVDb21waWxlU2NvcGVzYC4gSWYgbW9kdWxlIG92ZXJyaWRlcyBhcmUgcHJlc2VudCxcbiAgICAgIC8vIGNvbGxlY3QgYWxsIGFmZmVjdGVkIG1vZHVsZXMgYW5kIHJlc2V0IHNjb3BlcyB0byBmb3JjZSB0aGVpciByZS1jYWxjdWxhdGlvbi5cbiAgICAgIGNvbnN0IHRlc3RpbmdNb2R1bGVEZWYgPSAodGhpcy50ZXN0TW9kdWxlVHlwZSBhcyBhbnkpW05HX01PRF9ERUZdO1xuICAgICAgY29uc3QgYWZmZWN0ZWRNb2R1bGVzID0gdGhpcy5jb2xsZWN0TW9kdWxlc0FmZmVjdGVkQnlPdmVycmlkZXModGVzdGluZ01vZHVsZURlZi5pbXBvcnRzKTtcbiAgICAgIGlmIChhZmZlY3RlZE1vZHVsZXMuc2l6ZSA+IDApIHtcbiAgICAgICAgYWZmZWN0ZWRNb2R1bGVzLmZvckVhY2goKG1vZHVsZVR5cGUpID0+IHtcbiAgICAgICAgICBpZiAoIVVTRV9SVU5USU1FX0RFUFNfVFJBQ0tFUl9GT1JfSklUKSB7XG4gICAgICAgICAgICB0aGlzLnN0b3JlRmllbGRPZkRlZk9uVHlwZShtb2R1bGVUeXBlIGFzIGFueSwgTkdfTU9EX0RFRiwgJ3RyYW5zaXRpdmVDb21waWxlU2NvcGVzJyk7XG4gICAgICAgICAgICAobW9kdWxlVHlwZSBhcyBhbnkpW05HX01PRF9ERUZdLnRyYW5zaXRpdmVDb21waWxlU2NvcGVzID0gbnVsbDtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZGVwc1RyYWNrZXIuY2xlYXJTY29wZUNhY2hlRm9yKG1vZHVsZVR5cGUpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgY29uc3QgbW9kdWxlVG9TY29wZSA9IG5ldyBNYXA8VHlwZTxhbnk+IHwgVGVzdGluZ01vZHVsZU92ZXJyaWRlLCBOZ01vZHVsZVRyYW5zaXRpdmVTY29wZXM+KCk7XG4gICAgY29uc3QgZ2V0U2NvcGVPZk1vZHVsZSA9IChcbiAgICAgIG1vZHVsZVR5cGU6IFR5cGU8YW55PiB8IFRlc3RpbmdNb2R1bGVPdmVycmlkZSxcbiAgICApOiBOZ01vZHVsZVRyYW5zaXRpdmVTY29wZXMgPT4ge1xuICAgICAgaWYgKCFtb2R1bGVUb1Njb3BlLmhhcyhtb2R1bGVUeXBlKSkge1xuICAgICAgICBjb25zdCBpc1Rlc3RpbmdNb2R1bGUgPSBpc1Rlc3RpbmdNb2R1bGVPdmVycmlkZShtb2R1bGVUeXBlKTtcbiAgICAgICAgY29uc3QgcmVhbFR5cGUgPSBpc1Rlc3RpbmdNb2R1bGUgPyB0aGlzLnRlc3RNb2R1bGVUeXBlIDogKG1vZHVsZVR5cGUgYXMgVHlwZTxhbnk+KTtcbiAgICAgICAgbW9kdWxlVG9TY29wZS5zZXQobW9kdWxlVHlwZSwgdHJhbnNpdGl2ZVNjb3Blc0ZvcihyZWFsVHlwZSkpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIG1vZHVsZVRvU2NvcGUuZ2V0KG1vZHVsZVR5cGUpITtcbiAgICB9O1xuXG4gICAgdGhpcy5jb21wb25lbnRUb01vZHVsZVNjb3BlLmZvckVhY2goKG1vZHVsZVR5cGUsIGNvbXBvbmVudFR5cGUpID0+IHtcbiAgICAgIGlmIChtb2R1bGVUeXBlICE9PSBudWxsKSB7XG4gICAgICAgIGNvbnN0IG1vZHVsZVNjb3BlID0gZ2V0U2NvcGVPZk1vZHVsZShtb2R1bGVUeXBlKTtcbiAgICAgICAgdGhpcy5zdG9yZUZpZWxkT2ZEZWZPblR5cGUoY29tcG9uZW50VHlwZSwgTkdfQ09NUF9ERUYsICdkaXJlY3RpdmVEZWZzJyk7XG4gICAgICAgIHRoaXMuc3RvcmVGaWVsZE9mRGVmT25UeXBlKGNvbXBvbmVudFR5cGUsIE5HX0NPTVBfREVGLCAncGlwZURlZnMnKTtcbiAgICAgICAgcGF0Y2hDb21wb25lbnREZWZXaXRoU2NvcGUoZ2V0Q29tcG9uZW50RGVmKGNvbXBvbmVudFR5cGUpISwgbW9kdWxlU2NvcGUpO1xuICAgICAgfVxuICAgICAgLy8gYHRWaWV3YCB0aGF0IGlzIHN0b3JlZCBvbiBjb21wb25lbnQgZGVmIGNvbnRhaW5zIGluZm9ybWF0aW9uIGFib3V0IGRpcmVjdGl2ZXMgYW5kIHBpcGVzXG4gICAgICAvLyB0aGF0IGFyZSBpbiB0aGUgc2NvcGUgb2YgdGhpcyBjb21wb25lbnQuIFBhdGNoaW5nIGNvbXBvbmVudCBzY29wZSB3aWxsIGNhdXNlIGB0Vmlld2AgdG8gYmVcbiAgICAgIC8vIGNoYW5nZWQuIFN0b3JlIG9yaWdpbmFsIGB0Vmlld2AgYmVmb3JlIHBhdGNoaW5nIHNjb3BlLCBzbyB0aGUgYHRWaWV3YCAoaW5jbHVkaW5nIHNjb3BlXG4gICAgICAvLyBpbmZvcm1hdGlvbikgaXMgcmVzdG9yZWQgYmFjayB0byBpdHMgcHJldmlvdXMvb3JpZ2luYWwgc3RhdGUgYmVmb3JlIHJ1bm5pbmcgbmV4dCB0ZXN0LlxuICAgICAgLy8gUmVzZXR0aW5nIGB0Vmlld2AgaXMgYWxzbyBuZWVkZWQgZm9yIGNhc2VzIHdoZW4gd2UgYXBwbHkgcHJvdmlkZXIgb3ZlcnJpZGVzIGFuZCB0aG9zZVxuICAgICAgLy8gcHJvdmlkZXJzIGFyZSBkZWZpbmVkIG9uIGNvbXBvbmVudCdzIGxldmVsLCBpbiB3aGljaCBjYXNlIHRoZXkgbWF5IGVuZCB1cCBpbmNsdWRlZCBpbnRvXG4gICAgICAvLyBgdFZpZXcuYmx1ZXByaW50YC5cbiAgICAgIHRoaXMuc3RvcmVGaWVsZE9mRGVmT25UeXBlKGNvbXBvbmVudFR5cGUsIE5HX0NPTVBfREVGLCAndFZpZXcnKTtcbiAgICB9KTtcblxuICAgIHRoaXMuY29tcG9uZW50VG9Nb2R1bGVTY29wZS5jbGVhcigpO1xuICB9XG5cbiAgcHJpdmF0ZSBhcHBseVByb3ZpZGVyT3ZlcnJpZGVzKCk6IHZvaWQge1xuICAgIGNvbnN0IG1heWJlQXBwbHlPdmVycmlkZXMgPSAoZmllbGQ6IHN0cmluZykgPT4gKHR5cGU6IFR5cGU8YW55PikgPT4ge1xuICAgICAgY29uc3QgcmVzb2x2ZXIgPSBmaWVsZCA9PT0gTkdfQ09NUF9ERUYgPyB0aGlzLnJlc29sdmVycy5jb21wb25lbnQgOiB0aGlzLnJlc29sdmVycy5kaXJlY3RpdmU7XG4gICAgICBjb25zdCBtZXRhZGF0YSA9IHJlc29sdmVyLnJlc29sdmUodHlwZSkhO1xuICAgICAgaWYgKHRoaXMuaGFzUHJvdmlkZXJPdmVycmlkZXMobWV0YWRhdGEucHJvdmlkZXJzKSkge1xuICAgICAgICB0aGlzLnBhdGNoRGVmV2l0aFByb3ZpZGVyT3ZlcnJpZGVzKHR5cGUsIGZpZWxkKTtcbiAgICAgIH1cbiAgICB9O1xuICAgIHRoaXMuc2VlbkNvbXBvbmVudHMuZm9yRWFjaChtYXliZUFwcGx5T3ZlcnJpZGVzKE5HX0NPTVBfREVGKSk7XG4gICAgdGhpcy5zZWVuRGlyZWN0aXZlcy5mb3JFYWNoKG1heWJlQXBwbHlPdmVycmlkZXMoTkdfRElSX0RFRikpO1xuXG4gICAgdGhpcy5zZWVuQ29tcG9uZW50cy5jbGVhcigpO1xuICAgIHRoaXMuc2VlbkRpcmVjdGl2ZXMuY2xlYXIoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBcHBsaWVzIHByb3ZpZGVyIG92ZXJyaWRlcyB0byBhIGdpdmVuIHR5cGUgKGVpdGhlciBhbiBOZ01vZHVsZSBvciBhIHN0YW5kYWxvbmUgY29tcG9uZW50KVxuICAgKiBhbmQgYWxsIGltcG9ydGVkIE5nTW9kdWxlcyBhbmQgc3RhbmRhbG9uZSBjb21wb25lbnRzIHJlY3Vyc2l2ZWx5LlxuICAgKi9cbiAgcHJpdmF0ZSBhcHBseVByb3ZpZGVyT3ZlcnJpZGVzSW5TY29wZSh0eXBlOiBUeXBlPGFueT4pOiB2b2lkIHtcbiAgICBjb25zdCBoYXNTY29wZSA9IGlzU3RhbmRhbG9uZUNvbXBvbmVudCh0eXBlKSB8fCBpc05nTW9kdWxlKHR5cGUpO1xuXG4gICAgLy8gVGhlIGZ1bmN0aW9uIGNhbiBiZSByZS1lbnRlcmVkIHJlY3Vyc2l2ZWx5IHdoaWxlIGluc3BlY3RpbmcgZGVwZW5kZW5jaWVzXG4gICAgLy8gb2YgYW4gTmdNb2R1bGUgb3IgYSBzdGFuZGFsb25lIGNvbXBvbmVudC4gRXhpdCBlYXJseSBpZiB3ZSBjb21lIGFjcm9zcyBhXG4gICAgLy8gdHlwZSB0aGF0IGNhbiBub3QgaGF2ZSBhIHNjb3BlIChkaXJlY3RpdmUgb3IgcGlwZSkgb3IgdGhlIHR5cGUgaXMgYWxyZWFkeVxuICAgIC8vIHByb2Nlc3NlZCBlYXJsaWVyLlxuICAgIGlmICghaGFzU2NvcGUgfHwgdGhpcy5zY29wZXNXaXRoT3ZlcnJpZGRlblByb3ZpZGVycy5oYXModHlwZSkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy5zY29wZXNXaXRoT3ZlcnJpZGRlblByb3ZpZGVycy5hZGQodHlwZSk7XG5cbiAgICAvLyBOT1RFOiB0aGUgbGluZSBiZWxvdyB0cmlnZ2VycyBKSVQgY29tcGlsYXRpb24gb2YgdGhlIG1vZHVsZSBpbmplY3RvcixcbiAgICAvLyB3aGljaCBhbHNvIGludm9rZXMgdmVyaWZpY2F0aW9uIG9mIHRoZSBOZ01vZHVsZSBzZW1hbnRpY3MsIHdoaWNoIHByb2R1Y2VzXG4gICAgLy8gZGV0YWlsZWQgZXJyb3IgbWVzc2FnZXMuIFRoZSBmYWN0IHRoYXQgdGhlIGNvZGUgcmVsaWVzIG9uIHRoaXMgbGluZSBiZWluZ1xuICAgIC8vIHByZXNlbnQgaGVyZSBpcyBzdXNwaWNpb3VzIGFuZCBzaG91bGQgYmUgcmVmYWN0b3JlZCBpbiBhIHdheSB0aGF0IHRoZSBsaW5lXG4gICAgLy8gYmVsb3cgY2FuIGJlIG1vdmVkIChmb3IgZXguIGFmdGVyIGFuIGVhcmx5IGV4aXQgY2hlY2sgYmVsb3cpLlxuICAgIGNvbnN0IGluamVjdG9yRGVmOiBhbnkgPSAodHlwZSBhcyBhbnkpW05HX0lOSl9ERUZdO1xuXG4gICAgLy8gTm8gcHJvdmlkZXIgb3ZlcnJpZGVzLCBleGl0IGVhcmx5LlxuICAgIGlmICh0aGlzLnByb3ZpZGVyT3ZlcnJpZGVzQnlUb2tlbi5zaXplID09PSAwKSByZXR1cm47XG5cbiAgICBpZiAoaXNTdGFuZGFsb25lQ29tcG9uZW50KHR5cGUpKSB7XG4gICAgICAvLyBWaXNpdCBhbGwgY29tcG9uZW50IGRlcGVuZGVuY2llcyBhbmQgb3ZlcnJpZGUgcHJvdmlkZXJzIHRoZXJlLlxuICAgICAgY29uc3QgZGVmID0gZ2V0Q29tcG9uZW50RGVmKHR5cGUpO1xuICAgICAgY29uc3QgZGVwZW5kZW5jaWVzID0gbWF5YmVVbndyYXBGbihkZWYuZGVwZW5kZW5jaWVzID8/IFtdKTtcbiAgICAgIGZvciAoY29uc3QgZGVwZW5kZW5jeSBvZiBkZXBlbmRlbmNpZXMpIHtcbiAgICAgICAgdGhpcy5hcHBseVByb3ZpZGVyT3ZlcnJpZGVzSW5TY29wZShkZXBlbmRlbmN5KTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgcHJvdmlkZXJzOiBBcnJheTxQcm92aWRlciB8IEludGVybmFsRW52aXJvbm1lbnRQcm92aWRlcnM+ID0gW1xuICAgICAgICAuLi5pbmplY3RvckRlZi5wcm92aWRlcnMsXG4gICAgICAgIC4uLih0aGlzLnByb3ZpZGVyT3ZlcnJpZGVzQnlNb2R1bGUuZ2V0KHR5cGUgYXMgSW5qZWN0b3JUeXBlPGFueT4pIHx8IFtdKSxcbiAgICAgIF07XG4gICAgICBpZiAodGhpcy5oYXNQcm92aWRlck92ZXJyaWRlcyhwcm92aWRlcnMpKSB7XG4gICAgICAgIHRoaXMubWF5YmVTdG9yZU5nRGVmKE5HX0lOSl9ERUYsIHR5cGUpO1xuXG4gICAgICAgIHRoaXMuc3RvcmVGaWVsZE9mRGVmT25UeXBlKHR5cGUsIE5HX0lOSl9ERUYsICdwcm92aWRlcnMnKTtcbiAgICAgICAgaW5qZWN0b3JEZWYucHJvdmlkZXJzID0gdGhpcy5nZXRPdmVycmlkZGVuUHJvdmlkZXJzKHByb3ZpZGVycyk7XG4gICAgICB9XG5cbiAgICAgIC8vIEFwcGx5IHByb3ZpZGVyIG92ZXJyaWRlcyB0byBpbXBvcnRlZCBtb2R1bGVzIHJlY3Vyc2l2ZWx5XG4gICAgICBjb25zdCBtb2R1bGVEZWYgPSAodHlwZSBhcyBhbnkpW05HX01PRF9ERUZdO1xuICAgICAgY29uc3QgaW1wb3J0cyA9IG1heWJlVW53cmFwRm4obW9kdWxlRGVmLmltcG9ydHMpO1xuICAgICAgZm9yIChjb25zdCBpbXBvcnRlZE1vZHVsZSBvZiBpbXBvcnRzKSB7XG4gICAgICAgIHRoaXMuYXBwbHlQcm92aWRlck92ZXJyaWRlc0luU2NvcGUoaW1wb3J0ZWRNb2R1bGUpO1xuICAgICAgfVxuICAgICAgLy8gQWxzbyBvdmVycmlkZSB0aGUgcHJvdmlkZXJzIG9uIGFueSBNb2R1bGVXaXRoUHJvdmlkZXJzIGltcG9ydHMgc2luY2UgdGhvc2UgZG9uJ3QgYXBwZWFyIGluXG4gICAgICAvLyB0aGUgbW9kdWxlRGVmLlxuICAgICAgZm9yIChjb25zdCBpbXBvcnRlZE1vZHVsZSBvZiBmbGF0dGVuKGluamVjdG9yRGVmLmltcG9ydHMpKSB7XG4gICAgICAgIGlmIChpc01vZHVsZVdpdGhQcm92aWRlcnMoaW1wb3J0ZWRNb2R1bGUpKSB7XG4gICAgICAgICAgdGhpcy5kZWZDbGVhbnVwT3BzLnB1c2goe1xuICAgICAgICAgICAgb2JqZWN0OiBpbXBvcnRlZE1vZHVsZSxcbiAgICAgICAgICAgIGZpZWxkTmFtZTogJ3Byb3ZpZGVycycsXG4gICAgICAgICAgICBvcmlnaW5hbFZhbHVlOiBpbXBvcnRlZE1vZHVsZS5wcm92aWRlcnMsXG4gICAgICAgICAgfSk7XG4gICAgICAgICAgaW1wb3J0ZWRNb2R1bGUucHJvdmlkZXJzID0gdGhpcy5nZXRPdmVycmlkZGVuUHJvdmlkZXJzKFxuICAgICAgICAgICAgaW1wb3J0ZWRNb2R1bGUucHJvdmlkZXJzIGFzIEFycmF5PFByb3ZpZGVyIHwgSW50ZXJuYWxFbnZpcm9ubWVudFByb3ZpZGVycz4sXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgcGF0Y2hDb21wb25lbnRzV2l0aEV4aXN0aW5nU3R5bGVzKCk6IHZvaWQge1xuICAgIHRoaXMuZXhpc3RpbmdDb21wb25lbnRTdHlsZXMuZm9yRWFjaChcbiAgICAgIChzdHlsZXMsIHR5cGUpID0+ICgodHlwZSBhcyBhbnkpW05HX0NPTVBfREVGXS5zdHlsZXMgPSBzdHlsZXMpLFxuICAgICk7XG4gICAgdGhpcy5leGlzdGluZ0NvbXBvbmVudFN0eWxlcy5jbGVhcigpO1xuICB9XG5cbiAgcHJpdmF0ZSBxdWV1ZVR5cGVBcnJheShhcnI6IGFueVtdLCBtb2R1bGVUeXBlOiBUeXBlPGFueT4gfCBUZXN0aW5nTW9kdWxlT3ZlcnJpZGUpOiB2b2lkIHtcbiAgICBmb3IgKGNvbnN0IHZhbHVlIG9mIGFycikge1xuICAgICAgaWYgKEFycmF5LmlzQXJyYXkodmFsdWUpKSB7XG4gICAgICAgIHRoaXMucXVldWVUeXBlQXJyYXkodmFsdWUsIG1vZHVsZVR5cGUpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5xdWV1ZVR5cGUodmFsdWUsIG1vZHVsZVR5cGUpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgcmVjb21waWxlTmdNb2R1bGUobmdNb2R1bGU6IFR5cGU8YW55PiwgbWV0YWRhdGE6IE5nTW9kdWxlKTogdm9pZCB7XG4gICAgLy8gQ2FjaGUgdGhlIGluaXRpYWwgbmdNb2R1bGVEZWYgYXMgaXQgd2lsbCBiZSBvdmVyd3JpdHRlbi5cbiAgICB0aGlzLm1heWJlU3RvcmVOZ0RlZihOR19NT0RfREVGLCBuZ01vZHVsZSk7XG4gICAgdGhpcy5tYXliZVN0b3JlTmdEZWYoTkdfSU5KX0RFRiwgbmdNb2R1bGUpO1xuXG4gICAgY29tcGlsZU5nTW9kdWxlRGVmcyhuZ01vZHVsZSBhcyBOZ01vZHVsZVR5cGU8YW55PiwgbWV0YWRhdGEpO1xuICB9XG5cbiAgcHJpdmF0ZSBtYXliZVJlZ2lzdGVyQ29tcG9uZW50V2l0aEFzeW5jTWV0YWRhdGEodHlwZTogVHlwZTx1bmtub3duPikge1xuICAgIGNvbnN0IGFzeW5jTWV0YWRhdGFGbiA9IGdldEFzeW5jQ2xhc3NNZXRhZGF0YUZuKHR5cGUpO1xuICAgIGlmIChhc3luY01ldGFkYXRhRm4pIHtcbiAgICAgIHRoaXMuY29tcG9uZW50c1dpdGhBc3luY01ldGFkYXRhLmFkZCh0eXBlKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIHF1ZXVlVHlwZSh0eXBlOiBUeXBlPGFueT4sIG1vZHVsZVR5cGU6IFR5cGU8YW55PiB8IFRlc3RpbmdNb2R1bGVPdmVycmlkZSB8IG51bGwpOiB2b2lkIHtcbiAgICAvLyBJZiB0aGlzIGlzIGEgY29tcG9uZW50IHdpdGggYXN5bmMgbWV0YWRhdGEgKGkuZS4gYSBjb21wb25lbnQgd2l0aCBhIGBAZGVmZXJgIGJsb2NrXG4gICAgLy8gaW4gYSB0ZW1wbGF0ZSkgLSBzdG9yZSBpdCBmb3IgZnV0dXJlIHByb2Nlc3NpbmcuXG4gICAgdGhpcy5tYXliZVJlZ2lzdGVyQ29tcG9uZW50V2l0aEFzeW5jTWV0YWRhdGEodHlwZSk7XG5cbiAgICBjb25zdCBjb21wb25lbnQgPSB0aGlzLnJlc29sdmVycy5jb21wb25lbnQucmVzb2x2ZSh0eXBlKTtcbiAgICBpZiAoY29tcG9uZW50KSB7XG4gICAgICAvLyBDaGVjayB3aGV0aGVyIGEgZ2l2ZSBUeXBlIGhhcyByZXNwZWN0aXZlIE5HIGRlZiAoybVjbXApIGFuZCBjb21waWxlIGlmIGRlZiBpc1xuICAgICAgLy8gbWlzc2luZy4gVGhhdCBtaWdodCBoYXBwZW4gaW4gY2FzZSBhIGNsYXNzIHdpdGhvdXQgYW55IEFuZ3VsYXIgZGVjb3JhdG9ycyBleHRlbmRzIGFub3RoZXJcbiAgICAgIC8vIGNsYXNzIHdoZXJlIENvbXBvbmVudC9EaXJlY3RpdmUvUGlwZSBkZWNvcmF0b3IgaXMgZGVmaW5lZC5cbiAgICAgIGlmICjJtWlzQ29tcG9uZW50RGVmUGVuZGluZ1Jlc29sdXRpb24odHlwZSkgfHwgIXR5cGUuaGFzT3duUHJvcGVydHkoTkdfQ09NUF9ERUYpKSB7XG4gICAgICAgIHRoaXMucGVuZGluZ0NvbXBvbmVudHMuYWRkKHR5cGUpO1xuICAgICAgfVxuICAgICAgdGhpcy5zZWVuQ29tcG9uZW50cy5hZGQodHlwZSk7XG5cbiAgICAgIC8vIEtlZXAgdHJhY2sgb2YgdGhlIG1vZHVsZSB3aGljaCBkZWNsYXJlcyB0aGlzIGNvbXBvbmVudCwgc28gbGF0ZXIgdGhlIGNvbXBvbmVudCdzIHNjb3BlXG4gICAgICAvLyBjYW4gYmUgc2V0IGNvcnJlY3RseS4gSWYgdGhlIGNvbXBvbmVudCBoYXMgYWxyZWFkeSBiZWVuIHJlY29yZGVkIGhlcmUsIHRoZW4gb25lIG9mIHNldmVyYWxcbiAgICAgIC8vIGNhc2VzIGlzIHRydWU6XG4gICAgICAvLyAqIHRoZSBtb2R1bGUgY29udGFpbmluZyB0aGUgY29tcG9uZW50IHdhcyBpbXBvcnRlZCBtdWx0aXBsZSB0aW1lcyAoY29tbW9uKS5cbiAgICAgIC8vICogdGhlIGNvbXBvbmVudCBpcyBkZWNsYXJlZCBpbiBtdWx0aXBsZSBtb2R1bGVzICh3aGljaCBpcyBhbiBlcnJvcikuXG4gICAgICAvLyAqIHRoZSBjb21wb25lbnQgd2FzIGluICdkZWNsYXJhdGlvbnMnIG9mIHRoZSB0ZXN0aW5nIG1vZHVsZSwgYW5kIGFsc28gaW4gYW4gaW1wb3J0ZWQgbW9kdWxlXG4gICAgICAvLyAgIGluIHdoaWNoIGNhc2UgdGhlIG1vZHVsZSBzY29wZSB3aWxsIGJlIFRlc3RpbmdNb2R1bGVPdmVycmlkZS5ERUNMQVJBVElPTi5cbiAgICAgIC8vICogb3ZlcnJpZGVUZW1wbGF0ZVVzaW5nVGVzdGluZ01vZHVsZSB3YXMgY2FsbGVkIGZvciB0aGUgY29tcG9uZW50IGluIHdoaWNoIGNhc2UgdGhlIG1vZHVsZVxuICAgICAgLy8gICBzY29wZSB3aWxsIGJlIFRlc3RpbmdNb2R1bGVPdmVycmlkZS5PVkVSUklERV9URU1QTEFURS5cbiAgICAgIC8vXG4gICAgICAvLyBJZiB0aGUgY29tcG9uZW50IHdhcyBwcmV2aW91c2x5IGluIHRoZSB0ZXN0aW5nIG1vZHVsZSdzICdkZWNsYXJhdGlvbnMnIChtZWFuaW5nIHRoZVxuICAgICAgLy8gY3VycmVudCB2YWx1ZSBpcyBUZXN0aW5nTW9kdWxlT3ZlcnJpZGUuREVDTEFSQVRJT04pLCB0aGVuIGBtb2R1bGVUeXBlYCBpcyB0aGUgY29tcG9uZW50J3NcbiAgICAgIC8vIHJlYWwgbW9kdWxlLCB3aGljaCB3YXMgaW1wb3J0ZWQuIFRoaXMgcGF0dGVybiBpcyB1bmRlcnN0b29kIHRvIG1lYW4gdGhhdCB0aGUgY29tcG9uZW50XG4gICAgICAvLyBzaG91bGQgdXNlIGl0cyBvcmlnaW5hbCBzY29wZSwgYnV0IHRoYXQgdGhlIHRlc3RpbmcgbW9kdWxlIHNob3VsZCBhbHNvIGNvbnRhaW4gdGhlXG4gICAgICAvLyBjb21wb25lbnQgaW4gaXRzIHNjb3BlLlxuICAgICAgaWYgKFxuICAgICAgICAhdGhpcy5jb21wb25lbnRUb01vZHVsZVNjb3BlLmhhcyh0eXBlKSB8fFxuICAgICAgICB0aGlzLmNvbXBvbmVudFRvTW9kdWxlU2NvcGUuZ2V0KHR5cGUpID09PSBUZXN0aW5nTW9kdWxlT3ZlcnJpZGUuREVDTEFSQVRJT05cbiAgICAgICkge1xuICAgICAgICB0aGlzLmNvbXBvbmVudFRvTW9kdWxlU2NvcGUuc2V0KHR5cGUsIG1vZHVsZVR5cGUpO1xuICAgICAgfVxuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGRpcmVjdGl2ZSA9IHRoaXMucmVzb2x2ZXJzLmRpcmVjdGl2ZS5yZXNvbHZlKHR5cGUpO1xuICAgIGlmIChkaXJlY3RpdmUpIHtcbiAgICAgIGlmICghdHlwZS5oYXNPd25Qcm9wZXJ0eShOR19ESVJfREVGKSkge1xuICAgICAgICB0aGlzLnBlbmRpbmdEaXJlY3RpdmVzLmFkZCh0eXBlKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuc2VlbkRpcmVjdGl2ZXMuYWRkKHR5cGUpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHBpcGUgPSB0aGlzLnJlc29sdmVycy5waXBlLnJlc29sdmUodHlwZSk7XG4gICAgaWYgKHBpcGUgJiYgIXR5cGUuaGFzT3duUHJvcGVydHkoTkdfUElQRV9ERUYpKSB7XG4gICAgICB0aGlzLnBlbmRpbmdQaXBlcy5hZGQodHlwZSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBxdWV1ZVR5cGVzRnJvbU1vZHVsZXNBcnJheShhcnI6IGFueVtdKTogdm9pZCB7XG4gICAgLy8gQmVjYXVzZSB3ZSBtYXkgZW5jb3VudGVyIHRoZSBzYW1lIE5nTW9kdWxlIG9yIGEgc3RhbmRhbG9uZSBDb21wb25lbnQgd2hpbGUgcHJvY2Vzc2luZ1xuICAgIC8vIHRoZSBkZXBlbmRlbmNpZXMgb2YgYW4gTmdNb2R1bGUgb3IgYSBzdGFuZGFsb25lIENvbXBvbmVudCwgd2UgY2FjaGUgdGhlbSBpbiB0aGlzIHNldCBzbyB3ZVxuICAgIC8vIGNhbiBza2lwIG9uZXMgdGhhdCBoYXZlIGFscmVhZHkgYmVlbiBzZWVuIGVuY291bnRlcmVkLiBJbiBzb21lIHRlc3Qgc2V0dXBzLCB0aGlzIGNhY2hpbmdcbiAgICAvLyByZXN1bHRlZCBpbiAxMFggcnVudGltZSBpbXByb3ZlbWVudC5cbiAgICBjb25zdCBwcm9jZXNzZWREZWZzID0gbmV3IFNldCgpO1xuICAgIGNvbnN0IHF1ZXVlVHlwZXNGcm9tTW9kdWxlc0FycmF5UmVjdXIgPSAoYXJyOiBhbnlbXSk6IHZvaWQgPT4ge1xuICAgICAgZm9yIChjb25zdCB2YWx1ZSBvZiBhcnIpIHtcbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkodmFsdWUpKSB7XG4gICAgICAgICAgcXVldWVUeXBlc0Zyb21Nb2R1bGVzQXJyYXlSZWN1cih2YWx1ZSk7XG4gICAgICAgIH0gZWxzZSBpZiAoaGFzTmdNb2R1bGVEZWYodmFsdWUpKSB7XG4gICAgICAgICAgY29uc3QgZGVmID0gdmFsdWUuybVtb2Q7XG4gICAgICAgICAgaWYgKHByb2Nlc3NlZERlZnMuaGFzKGRlZikpIHtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgICBwcm9jZXNzZWREZWZzLmFkZChkZWYpO1xuICAgICAgICAgIC8vIExvb2sgdGhyb3VnaCBkZWNsYXJhdGlvbnMsIGltcG9ydHMsIGFuZCBleHBvcnRzLCBhbmQgcXVldWVcbiAgICAgICAgICAvLyBldmVyeXRoaW5nIGZvdW5kIHRoZXJlLlxuICAgICAgICAgIHRoaXMucXVldWVUeXBlQXJyYXkobWF5YmVVbndyYXBGbihkZWYuZGVjbGFyYXRpb25zKSwgdmFsdWUpO1xuICAgICAgICAgIHF1ZXVlVHlwZXNGcm9tTW9kdWxlc0FycmF5UmVjdXIobWF5YmVVbndyYXBGbihkZWYuaW1wb3J0cykpO1xuICAgICAgICAgIHF1ZXVlVHlwZXNGcm9tTW9kdWxlc0FycmF5UmVjdXIobWF5YmVVbndyYXBGbihkZWYuZXhwb3J0cykpO1xuICAgICAgICB9IGVsc2UgaWYgKGlzTW9kdWxlV2l0aFByb3ZpZGVycyh2YWx1ZSkpIHtcbiAgICAgICAgICBxdWV1ZVR5cGVzRnJvbU1vZHVsZXNBcnJheVJlY3VyKFt2YWx1ZS5uZ01vZHVsZV0pO1xuICAgICAgICB9IGVsc2UgaWYgKGlzU3RhbmRhbG9uZUNvbXBvbmVudCh2YWx1ZSkpIHtcbiAgICAgICAgICB0aGlzLnF1ZXVlVHlwZSh2YWx1ZSwgbnVsbCk7XG4gICAgICAgICAgY29uc3QgZGVmID0gZ2V0Q29tcG9uZW50RGVmKHZhbHVlKTtcblxuICAgICAgICAgIGlmIChwcm9jZXNzZWREZWZzLmhhcyhkZWYpKSB7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcHJvY2Vzc2VkRGVmcy5hZGQoZGVmKTtcblxuICAgICAgICAgIGNvbnN0IGRlcGVuZGVuY2llcyA9IG1heWJlVW53cmFwRm4oZGVmLmRlcGVuZGVuY2llcyA/PyBbXSk7XG4gICAgICAgICAgZGVwZW5kZW5jaWVzLmZvckVhY2goKGRlcGVuZGVuY3kpID0+IHtcbiAgICAgICAgICAgIC8vIE5vdGU6IGluIEFPVCwgdGhlIGBkZXBlbmRlbmNpZXNgIG1pZ2h0IGFsc28gY29udGFpbiByZWd1bGFyXG4gICAgICAgICAgICAvLyAoTmdNb2R1bGUtYmFzZWQpIENvbXBvbmVudCwgRGlyZWN0aXZlIGFuZCBQaXBlcywgc28gd2UgaGFuZGxlXG4gICAgICAgICAgICAvLyB0aGVtIHNlcGFyYXRlbHkgYW5kIHByb2NlZWQgd2l0aCByZWN1cnNpdmUgcHJvY2VzcyBmb3Igc3RhbmRhbG9uZVxuICAgICAgICAgICAgLy8gQ29tcG9uZW50cyBhbmQgTmdNb2R1bGVzIG9ubHkuXG4gICAgICAgICAgICBpZiAoaXNTdGFuZGFsb25lQ29tcG9uZW50KGRlcGVuZGVuY3kpIHx8IGhhc05nTW9kdWxlRGVmKGRlcGVuZGVuY3kpKSB7XG4gICAgICAgICAgICAgIHF1ZXVlVHlwZXNGcm9tTW9kdWxlc0FycmF5UmVjdXIoW2RlcGVuZGVuY3ldKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHRoaXMucXVldWVUeXBlKGRlcGVuZGVuY3ksIG51bGwpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfTtcbiAgICBxdWV1ZVR5cGVzRnJvbU1vZHVsZXNBcnJheVJlY3VyKGFycik7XG4gIH1cblxuICAvLyBXaGVuIG1vZHVsZSBvdmVycmlkZXMgKHZpYSBgVGVzdEJlZC5vdmVycmlkZU1vZHVsZWApIGFyZSBwcmVzZW50LCBpdCBtaWdodCBhZmZlY3QgYWxsIG1vZHVsZXNcbiAgLy8gdGhhdCBpbXBvcnQgKGV2ZW4gdHJhbnNpdGl2ZWx5KSBhbiBvdmVycmlkZGVuIG9uZS4gRm9yIGFsbCBhZmZlY3RlZCBtb2R1bGVzIHdlIG5lZWQgdG9cbiAgLy8gcmVjYWxjdWxhdGUgdGhlaXIgc2NvcGVzIGZvciBhIGdpdmVuIHRlc3QgcnVuIGFuZCByZXN0b3JlIG9yaWdpbmFsIHNjb3BlcyBhdCB0aGUgZW5kLiBUaGUgZ29hbFxuICAvLyBvZiB0aGlzIGZ1bmN0aW9uIGlzIHRvIGNvbGxlY3QgYWxsIGFmZmVjdGVkIG1vZHVsZXMgaW4gYSBzZXQgZm9yIGZ1cnRoZXIgcHJvY2Vzc2luZy4gRXhhbXBsZTpcbiAgLy8gaWYgd2UgaGF2ZSB0aGUgZm9sbG93aW5nIG1vZHVsZSBoaWVyYXJjaHk6IEEgLT4gQiAtPiBDICh3aGVyZSBgLT5gIG1lYW5zIGBpbXBvcnRzYCkgYW5kIG1vZHVsZVxuICAvLyBgQ2AgaXMgb3ZlcnJpZGRlbiwgd2UgY29uc2lkZXIgYEFgIGFuZCBgQmAgYXMgYWZmZWN0ZWQsIHNpbmNlIHRoZWlyIHNjb3BlcyBtaWdodCBiZWNvbWVcbiAgLy8gaW52YWxpZGF0ZWQgd2l0aCB0aGUgb3ZlcnJpZGUuXG4gIHByaXZhdGUgY29sbGVjdE1vZHVsZXNBZmZlY3RlZEJ5T3ZlcnJpZGVzKGFycjogYW55W10pOiBTZXQ8TmdNb2R1bGVUeXBlPGFueT4+IHtcbiAgICBjb25zdCBzZWVuTW9kdWxlcyA9IG5ldyBTZXQ8TmdNb2R1bGVUeXBlPGFueT4+KCk7XG4gICAgY29uc3QgYWZmZWN0ZWRNb2R1bGVzID0gbmV3IFNldDxOZ01vZHVsZVR5cGU8YW55Pj4oKTtcbiAgICBjb25zdCBjYWxjQWZmZWN0ZWRNb2R1bGVzUmVjdXIgPSAoYXJyOiBhbnlbXSwgcGF0aDogTmdNb2R1bGVUeXBlPGFueT5bXSk6IHZvaWQgPT4ge1xuICAgICAgZm9yIChjb25zdCB2YWx1ZSBvZiBhcnIpIHtcbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkodmFsdWUpKSB7XG4gICAgICAgICAgLy8gSWYgdGhlIHZhbHVlIGlzIGFuIGFycmF5LCBqdXN0IGZsYXR0ZW4gaXQgKGJ5IGludm9raW5nIHRoaXMgZnVuY3Rpb24gcmVjdXJzaXZlbHkpLFxuICAgICAgICAgIC8vIGtlZXBpbmcgXCJwYXRoXCIgdGhlIHNhbWUuXG4gICAgICAgICAgY2FsY0FmZmVjdGVkTW9kdWxlc1JlY3VyKHZhbHVlLCBwYXRoKTtcbiAgICAgICAgfSBlbHNlIGlmIChoYXNOZ01vZHVsZURlZih2YWx1ZSkpIHtcbiAgICAgICAgICBpZiAoc2Vlbk1vZHVsZXMuaGFzKHZhbHVlKSkge1xuICAgICAgICAgICAgLy8gSWYgd2UndmUgc2VlbiB0aGlzIG1vZHVsZSBiZWZvcmUgYW5kIGl0J3MgaW5jbHVkZWQgaW50byBcImFmZmVjdGVkIG1vZHVsZXNcIiBsaXN0LCBtYXJrXG4gICAgICAgICAgICAvLyB0aGUgd2hvbGUgcGF0aCB0aGF0IGxlYWRzIHRvIHRoYXQgbW9kdWxlIGFzIGFmZmVjdGVkLCBidXQgZG8gbm90IGRlc2NlbmQgaW50byBpdHNcbiAgICAgICAgICAgIC8vIGltcG9ydHMsIHNpbmNlIHdlIGFscmVhZHkgZXhhbWluZWQgdGhlbSBiZWZvcmUuXG4gICAgICAgICAgICBpZiAoYWZmZWN0ZWRNb2R1bGVzLmhhcyh2YWx1ZSkpIHtcbiAgICAgICAgICAgICAgcGF0aC5mb3JFYWNoKChpdGVtKSA9PiBhZmZlY3RlZE1vZHVsZXMuYWRkKGl0ZW0pKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgICBzZWVuTW9kdWxlcy5hZGQodmFsdWUpO1xuICAgICAgICAgIGlmICh0aGlzLm92ZXJyaWRkZW5Nb2R1bGVzLmhhcyh2YWx1ZSkpIHtcbiAgICAgICAgICAgIHBhdGguZm9yRWFjaCgoaXRlbSkgPT4gYWZmZWN0ZWRNb2R1bGVzLmFkZChpdGVtKSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIC8vIEV4YW1pbmUgbW9kdWxlIGltcG9ydHMgcmVjdXJzaXZlbHkgdG8gbG9vayBmb3Igb3ZlcnJpZGRlbiBtb2R1bGVzLlxuICAgICAgICAgIGNvbnN0IG1vZHVsZURlZiA9ICh2YWx1ZSBhcyBhbnkpW05HX01PRF9ERUZdO1xuICAgICAgICAgIGNhbGNBZmZlY3RlZE1vZHVsZXNSZWN1cihtYXliZVVud3JhcEZuKG1vZHVsZURlZi5pbXBvcnRzKSwgcGF0aC5jb25jYXQodmFsdWUpKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH07XG4gICAgY2FsY0FmZmVjdGVkTW9kdWxlc1JlY3VyKGFyciwgW10pO1xuICAgIHJldHVybiBhZmZlY3RlZE1vZHVsZXM7XG4gIH1cblxuICAvKipcbiAgICogUHJlc2VydmUgYW4gb3JpZ2luYWwgZGVmIChzdWNoIGFzIMm1bW9kLCDJtWluaiwgZXRjKSBiZWZvcmUgYXBwbHlpbmcgYW4gb3ZlcnJpZGUuXG4gICAqIE5vdGU6IG9uZSBjbGFzcyBtYXkgaGF2ZSBtdWx0aXBsZSBkZWZzIChmb3IgZXhhbXBsZTogybVtb2QgYW5kIMm1aW5qIGluIGNhc2Ugb2ZcbiAgICogYW4gTmdNb2R1bGUpLiBJZiB0aGVyZSBpcyBhIGRlZiBpbiBhIHNldCBhbHJlYWR5LCBkb24ndCBvdmVycmlkZSBpdCwgc2luY2VcbiAgICogYW4gb3JpZ2luYWwgb25lIHNob3VsZCBiZSByZXN0b3JlZCBhdCB0aGUgZW5kIG9mIGEgdGVzdC5cbiAgICovXG4gIHByaXZhdGUgbWF5YmVTdG9yZU5nRGVmKHByb3A6IHN0cmluZywgdHlwZTogVHlwZTxhbnk+KSB7XG4gICAgaWYgKCF0aGlzLmluaXRpYWxOZ0RlZnMuaGFzKHR5cGUpKSB7XG4gICAgICB0aGlzLmluaXRpYWxOZ0RlZnMuc2V0KHR5cGUsIG5ldyBNYXAoKSk7XG4gICAgfVxuICAgIGNvbnN0IGN1cnJlbnREZWZzID0gdGhpcy5pbml0aWFsTmdEZWZzLmdldCh0eXBlKSE7XG4gICAgaWYgKCFjdXJyZW50RGVmcy5oYXMocHJvcCkpIHtcbiAgICAgIGNvbnN0IGN1cnJlbnREZWYgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHR5cGUsIHByb3ApO1xuICAgICAgY3VycmVudERlZnMuc2V0KHByb3AsIGN1cnJlbnREZWYpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgc3RvcmVGaWVsZE9mRGVmT25UeXBlKHR5cGU6IFR5cGU8YW55PiwgZGVmRmllbGQ6IHN0cmluZywgZmllbGROYW1lOiBzdHJpbmcpOiB2b2lkIHtcbiAgICBjb25zdCBkZWY6IGFueSA9ICh0eXBlIGFzIGFueSlbZGVmRmllbGRdO1xuICAgIGNvbnN0IG9yaWdpbmFsVmFsdWU6IGFueSA9IGRlZltmaWVsZE5hbWVdO1xuICAgIHRoaXMuZGVmQ2xlYW51cE9wcy5wdXNoKHtvYmplY3Q6IGRlZiwgZmllbGROYW1lLCBvcmlnaW5hbFZhbHVlfSk7XG4gIH1cblxuICAvKipcbiAgICogQ2xlYXJzIGN1cnJlbnQgY29tcG9uZW50cyByZXNvbHV0aW9uIHF1ZXVlLCBidXQgc3RvcmVzIHRoZSBzdGF0ZSBvZiB0aGUgcXVldWUsIHNvIHdlIGNhblxuICAgKiByZXN0b3JlIGl0IGxhdGVyLiBDbGVhcmluZyB0aGUgcXVldWUgaXMgcmVxdWlyZWQgYmVmb3JlIHdlIHRyeSB0byBjb21waWxlIGNvbXBvbmVudHMgKHZpYVxuICAgKiBgVGVzdEJlZC5jb21waWxlQ29tcG9uZW50c2ApLCBzbyB0aGF0IGNvbXBvbmVudCBkZWZzIGFyZSBpbiBzeW5jIHdpdGggdGhlIHJlc29sdXRpb24gcXVldWUuXG4gICAqL1xuICBwcml2YXRlIGNsZWFyQ29tcG9uZW50UmVzb2x1dGlvblF1ZXVlKCkge1xuICAgIGlmICh0aGlzLm9yaWdpbmFsQ29tcG9uZW50UmVzb2x1dGlvblF1ZXVlID09PSBudWxsKSB7XG4gICAgICB0aGlzLm9yaWdpbmFsQ29tcG9uZW50UmVzb2x1dGlvblF1ZXVlID0gbmV3IE1hcCgpO1xuICAgIH1cbiAgICDJtWNsZWFyUmVzb2x1dGlvbk9mQ29tcG9uZW50UmVzb3VyY2VzUXVldWUoKS5mb3JFYWNoKCh2YWx1ZSwga2V5KSA9PlxuICAgICAgdGhpcy5vcmlnaW5hbENvbXBvbmVudFJlc29sdXRpb25RdWV1ZSEuc2V0KGtleSwgdmFsdWUpLFxuICAgICk7XG4gIH1cblxuICAvKlxuICAgKiBSZXN0b3JlcyBjb21wb25lbnQgcmVzb2x1dGlvbiBxdWV1ZSB0byB0aGUgcHJldmlvdXNseSBzYXZlZCBzdGF0ZS4gVGhpcyBvcGVyYXRpb24gaXMgcGVyZm9ybWVkXG4gICAqIGFzIGEgcGFydCBvZiByZXN0b3JpbmcgdGhlIHN0YXRlIGFmdGVyIGNvbXBsZXRpb24gb2YgdGhlIGN1cnJlbnQgc2V0IG9mIHRlc3RzICh0aGF0IG1pZ2h0XG4gICAqIHBvdGVudGlhbGx5IG11dGF0ZSB0aGUgc3RhdGUpLlxuICAgKi9cbiAgcHJpdmF0ZSByZXN0b3JlQ29tcG9uZW50UmVzb2x1dGlvblF1ZXVlKCkge1xuICAgIGlmICh0aGlzLm9yaWdpbmFsQ29tcG9uZW50UmVzb2x1dGlvblF1ZXVlICE9PSBudWxsKSB7XG4gICAgICDJtXJlc3RvcmVDb21wb25lbnRSZXNvbHV0aW9uUXVldWUodGhpcy5vcmlnaW5hbENvbXBvbmVudFJlc29sdXRpb25RdWV1ZSk7XG4gICAgICB0aGlzLm9yaWdpbmFsQ29tcG9uZW50UmVzb2x1dGlvblF1ZXVlID0gbnVsbDtcbiAgICB9XG4gIH1cblxuICByZXN0b3JlT3JpZ2luYWxTdGF0ZSgpOiB2b2lkIHtcbiAgICAvLyBQcm9jZXNzIGNsZWFudXAgb3BzIGluIHJldmVyc2Ugb3JkZXIgc28gdGhlIGZpZWxkJ3Mgb3JpZ2luYWwgdmFsdWUgaXMgcmVzdG9yZWQgY29ycmVjdGx5IChpblxuICAgIC8vIGNhc2UgdGhlcmUgd2VyZSBtdWx0aXBsZSBvdmVycmlkZXMgZm9yIHRoZSBzYW1lIGZpZWxkKS5cbiAgICBmb3JFYWNoUmlnaHQodGhpcy5kZWZDbGVhbnVwT3BzLCAob3A6IENsZWFudXBPcGVyYXRpb24pID0+IHtcbiAgICAgIG9wLm9iamVjdFtvcC5maWVsZE5hbWVdID0gb3Aub3JpZ2luYWxWYWx1ZTtcbiAgICB9KTtcbiAgICAvLyBSZXN0b3JlIGluaXRpYWwgY29tcG9uZW50L2RpcmVjdGl2ZS9waXBlIGRlZnNcbiAgICB0aGlzLmluaXRpYWxOZ0RlZnMuZm9yRWFjaChcbiAgICAgIChkZWZzOiBNYXA8c3RyaW5nLCBQcm9wZXJ0eURlc2NyaXB0b3IgfCB1bmRlZmluZWQ+LCB0eXBlOiBUeXBlPGFueT4pID0+IHtcbiAgICAgICAgaWYgKFVTRV9SVU5USU1FX0RFUFNfVFJBQ0tFUl9GT1JfSklUKSB7XG4gICAgICAgICAgZGVwc1RyYWNrZXIuY2xlYXJTY29wZUNhY2hlRm9yKHR5cGUpO1xuICAgICAgICB9XG4gICAgICAgIGRlZnMuZm9yRWFjaCgoZGVzY3JpcHRvciwgcHJvcCkgPT4ge1xuICAgICAgICAgIGlmICghZGVzY3JpcHRvcikge1xuICAgICAgICAgICAgLy8gRGVsZXRlIG9wZXJhdGlvbnMgYXJlIGdlbmVyYWxseSB1bmRlc2lyYWJsZSBzaW5jZSB0aGV5IGhhdmUgcGVyZm9ybWFuY2VcbiAgICAgICAgICAgIC8vIGltcGxpY2F0aW9ucyBvbiBvYmplY3RzIHRoZXkgd2VyZSBhcHBsaWVkIHRvLiBJbiB0aGlzIHBhcnRpY3VsYXIgY2FzZSwgc2l0dWF0aW9uc1xuICAgICAgICAgICAgLy8gd2hlcmUgdGhpcyBjb2RlIGlzIGludm9rZWQgc2hvdWxkIGJlIHF1aXRlIHJhcmUgdG8gY2F1c2UgYW55IG5vdGljZWFibGUgaW1wYWN0LFxuICAgICAgICAgICAgLy8gc2luY2UgaXQncyBhcHBsaWVkIG9ubHkgdG8gc29tZSB0ZXN0IGNhc2VzIChmb3IgZXhhbXBsZSB3aGVuIGNsYXNzIHdpdGggbm9cbiAgICAgICAgICAgIC8vIGFubm90YXRpb25zIGV4dGVuZHMgc29tZSBAQ29tcG9uZW50KSB3aGVuIHdlIG5lZWQgdG8gY2xlYXIgJ8m1Y21wJyBmaWVsZCBvbiBhIGdpdmVuXG4gICAgICAgICAgICAvLyBjbGFzcyB0byByZXN0b3JlIGl0cyBvcmlnaW5hbCBzdGF0ZSAoYmVmb3JlIGFwcGx5aW5nIG92ZXJyaWRlcyBhbmQgcnVubmluZyB0ZXN0cykuXG4gICAgICAgICAgICBkZWxldGUgKHR5cGUgYXMgYW55KVtwcm9wXTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHR5cGUsIHByb3AsIGRlc2NyaXB0b3IpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9LFxuICAgICk7XG4gICAgdGhpcy5pbml0aWFsTmdEZWZzLmNsZWFyKCk7XG4gICAgdGhpcy5zY29wZXNXaXRoT3ZlcnJpZGRlblByb3ZpZGVycy5jbGVhcigpO1xuICAgIHRoaXMucmVzdG9yZUNvbXBvbmVudFJlc29sdXRpb25RdWV1ZSgpO1xuICAgIC8vIFJlc3RvcmUgdGhlIGxvY2FsZSBJRCB0byB0aGUgZGVmYXVsdCB2YWx1ZSwgdGhpcyBzaG91bGRuJ3QgYmUgbmVjZXNzYXJ5IGJ1dCB3ZSBuZXZlciBrbm93XG4gICAgc2V0TG9jYWxlSWQoREVGQVVMVF9MT0NBTEVfSUQpO1xuICB9XG5cbiAgcHJpdmF0ZSBjb21waWxlVGVzdE1vZHVsZSgpOiB2b2lkIHtcbiAgICBjbGFzcyBSb290U2NvcGVNb2R1bGUge31cbiAgICBjb21waWxlTmdNb2R1bGVEZWZzKFJvb3RTY29wZU1vZHVsZSBhcyBOZ01vZHVsZVR5cGU8YW55Piwge1xuICAgICAgcHJvdmlkZXJzOiBbXG4gICAgICAgIC4uLnRoaXMucm9vdFByb3ZpZGVyT3ZlcnJpZGVzLFxuICAgICAgICBpbnRlcm5hbFByb3ZpZGVab25lQ2hhbmdlRGV0ZWN0aW9uKHt9KSxcbiAgICAgICAgVGVzdEJlZEFwcGxpY2F0aW9uRXJyb3JIYW5kbGVyLFxuICAgICAgICB7cHJvdmlkZTogQ2hhbmdlRGV0ZWN0aW9uU2NoZWR1bGVyLCB1c2VFeGlzdGluZzogQ2hhbmdlRGV0ZWN0aW9uU2NoZWR1bGVySW1wbH0sXG4gICAgICBdLFxuICAgIH0pO1xuXG4gICAgY29uc3QgcHJvdmlkZXJzID0gW1xuICAgICAge3Byb3ZpZGU6IENvbXBpbGVyLCB1c2VGYWN0b3J5OiAoKSA9PiBuZXcgUjNUZXN0Q29tcGlsZXIodGhpcyl9LFxuICAgICAge3Byb3ZpZGU6IERFRkVSX0JMT0NLX0NPTkZJRywgdXNlVmFsdWU6IHtiZWhhdmlvcjogdGhpcy5kZWZlckJsb2NrQmVoYXZpb3J9fSxcbiAgICAgIHtcbiAgICAgICAgcHJvdmlkZTogSU5URVJOQUxfQVBQTElDQVRJT05fRVJST1JfSEFORExFUixcbiAgICAgICAgdXNlRmFjdG9yeTogKCkgPT4ge1xuICAgICAgICAgIGlmICh0aGlzLnJldGhyb3dBcHBsaWNhdGlvblRpY2tFcnJvcnMpIHtcbiAgICAgICAgICAgIGNvbnN0IGhhbmRsZXIgPSBpbmplY3QoVGVzdEJlZEFwcGxpY2F0aW9uRXJyb3JIYW5kbGVyKTtcbiAgICAgICAgICAgIHJldHVybiAoZTogdW5rbm93bikgPT4ge1xuICAgICAgICAgICAgICBoYW5kbGVyLmhhbmRsZUVycm9yKGUpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc3QgdXNlckVycm9ySGFuZGxlciA9IGluamVjdChFcnJvckhhbmRsZXIpO1xuICAgICAgICAgICAgY29uc3Qgbmdab25lID0gaW5qZWN0KE5nWm9uZSk7XG4gICAgICAgICAgICByZXR1cm4gKGU6IHVua25vd24pID0+IG5nWm9uZS5ydW5PdXRzaWRlQW5ndWxhcigoKSA9PiB1c2VyRXJyb3JIYW5kbGVyLmhhbmRsZUVycm9yKGUpKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgICAgLi4udGhpcy5wcm92aWRlcnMsXG4gICAgICAuLi50aGlzLnByb3ZpZGVyT3ZlcnJpZGVzLFxuICAgIF07XG4gICAgY29uc3QgaW1wb3J0cyA9IFtSb290U2NvcGVNb2R1bGUsIHRoaXMuYWRkaXRpb25hbE1vZHVsZVR5cGVzLCB0aGlzLmltcG9ydHMgfHwgW11dO1xuXG4gICAgY29tcGlsZU5nTW9kdWxlRGVmcyhcbiAgICAgIHRoaXMudGVzdE1vZHVsZVR5cGUsXG4gICAgICB7XG4gICAgICAgIGRlY2xhcmF0aW9uczogdGhpcy5kZWNsYXJhdGlvbnMsXG4gICAgICAgIGltcG9ydHMsXG4gICAgICAgIHNjaGVtYXM6IHRoaXMuc2NoZW1hcyxcbiAgICAgICAgcHJvdmlkZXJzLFxuICAgICAgfSxcbiAgICAgIC8qIGFsbG93RHVwbGljYXRlRGVjbGFyYXRpb25zSW5Sb290ICovIHRydWUsXG4gICAgKTtcblxuICAgIHRoaXMuYXBwbHlQcm92aWRlck92ZXJyaWRlc0luU2NvcGUodGhpcy50ZXN0TW9kdWxlVHlwZSk7XG4gIH1cblxuICBnZXQgaW5qZWN0b3IoKTogSW5qZWN0b3Ige1xuICAgIGlmICh0aGlzLl9pbmplY3RvciAhPT0gbnVsbCkge1xuICAgICAgcmV0dXJuIHRoaXMuX2luamVjdG9yO1xuICAgIH1cblxuICAgIGNvbnN0IHByb3ZpZGVyczogU3RhdGljUHJvdmlkZXJbXSA9IFtdO1xuICAgIGNvbnN0IGNvbXBpbGVyT3B0aW9ucyA9IHRoaXMucGxhdGZvcm0uaW5qZWN0b3IuZ2V0KENPTVBJTEVSX09QVElPTlMpO1xuICAgIGNvbXBpbGVyT3B0aW9ucy5mb3JFYWNoKChvcHRzKSA9PiB7XG4gICAgICBpZiAob3B0cy5wcm92aWRlcnMpIHtcbiAgICAgICAgcHJvdmlkZXJzLnB1c2gob3B0cy5wcm92aWRlcnMpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIGlmICh0aGlzLmNvbXBpbGVyUHJvdmlkZXJzICE9PSBudWxsKSB7XG4gICAgICBwcm92aWRlcnMucHVzaCguLi4odGhpcy5jb21waWxlclByb3ZpZGVycyBhcyBTdGF0aWNQcm92aWRlcltdKSk7XG4gICAgfVxuXG4gICAgdGhpcy5faW5qZWN0b3IgPSBJbmplY3Rvci5jcmVhdGUoe3Byb3ZpZGVycywgcGFyZW50OiB0aGlzLnBsYXRmb3JtLmluamVjdG9yfSk7XG4gICAgcmV0dXJuIHRoaXMuX2luamVjdG9yO1xuICB9XG5cbiAgLy8gZ2V0IG92ZXJyaWRlcyBmb3IgYSBzcGVjaWZpYyBwcm92aWRlciAoaWYgYW55KVxuICBwcml2YXRlIGdldFNpbmdsZVByb3ZpZGVyT3ZlcnJpZGVzKHByb3ZpZGVyOiBQcm92aWRlcik6IFByb3ZpZGVyIHwgbnVsbCB7XG4gICAgY29uc3QgdG9rZW4gPSBnZXRQcm92aWRlclRva2VuKHByb3ZpZGVyKTtcbiAgICByZXR1cm4gdGhpcy5wcm92aWRlck92ZXJyaWRlc0J5VG9rZW4uZ2V0KHRva2VuKSB8fCBudWxsO1xuICB9XG5cbiAgcHJpdmF0ZSBnZXRQcm92aWRlck92ZXJyaWRlcyhcbiAgICBwcm92aWRlcnM/OiBBcnJheTxQcm92aWRlciB8IEludGVybmFsRW52aXJvbm1lbnRQcm92aWRlcnM+LFxuICApOiBQcm92aWRlcltdIHtcbiAgICBpZiAoIXByb3ZpZGVycyB8fCAhcHJvdmlkZXJzLmxlbmd0aCB8fCB0aGlzLnByb3ZpZGVyT3ZlcnJpZGVzQnlUb2tlbi5zaXplID09PSAwKSByZXR1cm4gW107XG4gICAgLy8gVGhlcmUgYXJlIHR3byBmbGF0dGVuaW5nIG9wZXJhdGlvbnMgaGVyZS4gVGhlIGlubmVyIGZsYXR0ZW5Qcm92aWRlcnMoKSBvcGVyYXRlcyBvbiB0aGVcbiAgICAvLyBtZXRhZGF0YSdzIHByb3ZpZGVycyBhbmQgYXBwbGllcyBhIG1hcHBpbmcgZnVuY3Rpb24gd2hpY2ggcmV0cmlldmVzIG92ZXJyaWRlcyBmb3IgZWFjaFxuICAgIC8vIGluY29taW5nIHByb3ZpZGVyLiBUaGUgb3V0ZXIgZmxhdHRlbigpIHRoZW4gZmxhdHRlbnMgdGhlIHByb2R1Y2VkIG92ZXJyaWRlcyBhcnJheS4gSWYgdGhpcyBpc1xuICAgIC8vIG5vdCBkb25lLCB0aGUgYXJyYXkgY2FuIGNvbnRhaW4gb3RoZXIgZW1wdHkgYXJyYXlzIChlLmcuIGBbW10sIFtdXWApIHdoaWNoIGxlYWsgaW50byB0aGVcbiAgICAvLyBwcm92aWRlcnMgYXJyYXkgYW5kIGNvbnRhbWluYXRlIGFueSBlcnJvciBtZXNzYWdlcyB0aGF0IG1pZ2h0IGJlIGdlbmVyYXRlZC5cbiAgICByZXR1cm4gZmxhdHRlbihcbiAgICAgIGZsYXR0ZW5Qcm92aWRlcnMoXG4gICAgICAgIHByb3ZpZGVycyxcbiAgICAgICAgKHByb3ZpZGVyOiBQcm92aWRlcikgPT4gdGhpcy5nZXRTaW5nbGVQcm92aWRlck92ZXJyaWRlcyhwcm92aWRlcikgfHwgW10sXG4gICAgICApLFxuICAgICk7XG4gIH1cblxuICBwcml2YXRlIGdldE92ZXJyaWRkZW5Qcm92aWRlcnMoXG4gICAgcHJvdmlkZXJzPzogQXJyYXk8UHJvdmlkZXIgfCBJbnRlcm5hbEVudmlyb25tZW50UHJvdmlkZXJzPixcbiAgKTogUHJvdmlkZXJbXSB7XG4gICAgaWYgKCFwcm92aWRlcnMgfHwgIXByb3ZpZGVycy5sZW5ndGggfHwgdGhpcy5wcm92aWRlck92ZXJyaWRlc0J5VG9rZW4uc2l6ZSA9PT0gMCkgcmV0dXJuIFtdO1xuXG4gICAgY29uc3QgZmxhdHRlbmVkUHJvdmlkZXJzID0gZmxhdHRlblByb3ZpZGVycyhwcm92aWRlcnMpO1xuICAgIGNvbnN0IG92ZXJyaWRlcyA9IHRoaXMuZ2V0UHJvdmlkZXJPdmVycmlkZXMoZmxhdHRlbmVkUHJvdmlkZXJzKTtcbiAgICBjb25zdCBvdmVycmlkZGVuUHJvdmlkZXJzID0gWy4uLmZsYXR0ZW5lZFByb3ZpZGVycywgLi4ub3ZlcnJpZGVzXTtcbiAgICBjb25zdCBmaW5hbDogUHJvdmlkZXJbXSA9IFtdO1xuICAgIGNvbnN0IHNlZW5PdmVycmlkZGVuUHJvdmlkZXJzID0gbmV3IFNldDxQcm92aWRlcj4oKTtcblxuICAgIC8vIFdlIGl0ZXJhdGUgdGhyb3VnaCB0aGUgbGlzdCBvZiBwcm92aWRlcnMgaW4gcmV2ZXJzZSBvcmRlciB0byBtYWtlIHN1cmUgcHJvdmlkZXIgb3ZlcnJpZGVzXG4gICAgLy8gdGFrZSBwcmVjZWRlbmNlIG92ZXIgdGhlIHZhbHVlcyBkZWZpbmVkIGluIHByb3ZpZGVyIGxpc3QuIFdlIGFsc28gZmlsdGVyIG91dCBhbGwgcHJvdmlkZXJzXG4gICAgLy8gdGhhdCBoYXZlIG92ZXJyaWRlcywga2VlcGluZyBvdmVycmlkZGVuIHZhbHVlcyBvbmx5LiBUaGlzIGlzIG5lZWRlZCwgc2luY2UgcHJlc2VuY2Ugb2YgYVxuICAgIC8vIHByb3ZpZGVyIHdpdGggYG5nT25EZXN0cm95YCBob29rIHdpbGwgY2F1c2UgdGhpcyBob29rIHRvIGJlIHJlZ2lzdGVyZWQgYW5kIGludm9rZWQgbGF0ZXIuXG4gICAgZm9yRWFjaFJpZ2h0KG92ZXJyaWRkZW5Qcm92aWRlcnMsIChwcm92aWRlcjogYW55KSA9PiB7XG4gICAgICBjb25zdCB0b2tlbjogYW55ID0gZ2V0UHJvdmlkZXJUb2tlbihwcm92aWRlcik7XG4gICAgICBpZiAodGhpcy5wcm92aWRlck92ZXJyaWRlc0J5VG9rZW4uaGFzKHRva2VuKSkge1xuICAgICAgICBpZiAoIXNlZW5PdmVycmlkZGVuUHJvdmlkZXJzLmhhcyh0b2tlbikpIHtcbiAgICAgICAgICBzZWVuT3ZlcnJpZGRlblByb3ZpZGVycy5hZGQodG9rZW4pO1xuICAgICAgICAgIC8vIFRyZWF0IGFsbCBvdmVycmlkZGVuIHByb3ZpZGVycyBhcyBge211bHRpOiBmYWxzZX1gIChldmVuIGlmIGl0J3MgYSBtdWx0aS1wcm92aWRlcikgdG9cbiAgICAgICAgICAvLyBtYWtlIHN1cmUgdGhhdCBwcm92aWRlZCBvdmVycmlkZSB0YWtlcyBoaWdoZXN0IHByZWNlZGVuY2UgYW5kIGlzIG5vdCBjb21iaW5lZCB3aXRoXG4gICAgICAgICAgLy8gb3RoZXIgaW5zdGFuY2VzIG9mIHRoZSBzYW1lIG11bHRpIHByb3ZpZGVyLlxuICAgICAgICAgIGZpbmFsLnVuc2hpZnQoey4uLnByb3ZpZGVyLCBtdWx0aTogZmFsc2V9KTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZmluYWwudW5zaGlmdChwcm92aWRlcik7XG4gICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIGZpbmFsO1xuICB9XG5cbiAgcHJpdmF0ZSBoYXNQcm92aWRlck92ZXJyaWRlcyhcbiAgICBwcm92aWRlcnM/OiBBcnJheTxQcm92aWRlciB8IEludGVybmFsRW52aXJvbm1lbnRQcm92aWRlcnM+LFxuICApOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5nZXRQcm92aWRlck92ZXJyaWRlcyhwcm92aWRlcnMpLmxlbmd0aCA+IDA7XG4gIH1cblxuICBwcml2YXRlIHBhdGNoRGVmV2l0aFByb3ZpZGVyT3ZlcnJpZGVzKGRlY2xhcmF0aW9uOiBUeXBlPGFueT4sIGZpZWxkOiBzdHJpbmcpOiB2b2lkIHtcbiAgICBjb25zdCBkZWYgPSAoZGVjbGFyYXRpb24gYXMgYW55KVtmaWVsZF07XG4gICAgaWYgKGRlZiAmJiBkZWYucHJvdmlkZXJzUmVzb2x2ZXIpIHtcbiAgICAgIHRoaXMubWF5YmVTdG9yZU5nRGVmKGZpZWxkLCBkZWNsYXJhdGlvbik7XG5cbiAgICAgIGNvbnN0IHJlc29sdmVyID0gZGVmLnByb3ZpZGVyc1Jlc29sdmVyO1xuICAgICAgY29uc3QgcHJvY2Vzc1Byb3ZpZGVyc0ZuID0gKHByb3ZpZGVyczogUHJvdmlkZXJbXSkgPT4gdGhpcy5nZXRPdmVycmlkZGVuUHJvdmlkZXJzKHByb3ZpZGVycyk7XG4gICAgICB0aGlzLnN0b3JlRmllbGRPZkRlZk9uVHlwZShkZWNsYXJhdGlvbiwgZmllbGQsICdwcm92aWRlcnNSZXNvbHZlcicpO1xuICAgICAgZGVmLnByb3ZpZGVyc1Jlc29sdmVyID0gKG5nRGVmOiBEaXJlY3RpdmVEZWY8YW55PikgPT4gcmVzb2x2ZXIobmdEZWYsIHByb2Nlc3NQcm92aWRlcnNGbik7XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIGluaXRSZXNvbHZlcnMoKTogUmVzb2x2ZXJzIHtcbiAgcmV0dXJuIHtcbiAgICBtb2R1bGU6IG5ldyBOZ01vZHVsZVJlc29sdmVyKCksXG4gICAgY29tcG9uZW50OiBuZXcgQ29tcG9uZW50UmVzb2x2ZXIoKSxcbiAgICBkaXJlY3RpdmU6IG5ldyBEaXJlY3RpdmVSZXNvbHZlcigpLFxuICAgIHBpcGU6IG5ldyBQaXBlUmVzb2x2ZXIoKSxcbiAgfTtcbn1cblxuZnVuY3Rpb24gaXNTdGFuZGFsb25lQ29tcG9uZW50PFQ+KHZhbHVlOiBUeXBlPFQ+KTogdmFsdWUgaXMgQ29tcG9uZW50VHlwZTxUPiB7XG4gIGNvbnN0IGRlZiA9IGdldENvbXBvbmVudERlZih2YWx1ZSk7XG4gIHJldHVybiAhIWRlZj8uc3RhbmRhbG9uZTtcbn1cblxuZnVuY3Rpb24gZ2V0Q29tcG9uZW50RGVmKHZhbHVlOiBDb21wb25lbnRUeXBlPHVua25vd24+KTogQ29tcG9uZW50RGVmPHVua25vd24+O1xuZnVuY3Rpb24gZ2V0Q29tcG9uZW50RGVmKHZhbHVlOiBUeXBlPHVua25vd24+KTogQ29tcG9uZW50RGVmPHVua25vd24+IHwgbnVsbDtcbmZ1bmN0aW9uIGdldENvbXBvbmVudERlZih2YWx1ZTogVHlwZTx1bmtub3duPik6IENvbXBvbmVudERlZjx1bmtub3duPiB8IG51bGwge1xuICByZXR1cm4gKHZhbHVlIGFzIGFueSkuybVjbXAgPz8gbnVsbDtcbn1cblxuZnVuY3Rpb24gaGFzTmdNb2R1bGVEZWY8VD4odmFsdWU6IFR5cGU8VD4pOiB2YWx1ZSBpcyBOZ01vZHVsZVR5cGU8VD4ge1xuICByZXR1cm4gdmFsdWUuaGFzT3duUHJvcGVydHkoJ8m1bW9kJyk7XG59XG5cbmZ1bmN0aW9uIGlzTmdNb2R1bGU8VD4odmFsdWU6IFR5cGU8VD4pOiBib29sZWFuIHtcbiAgcmV0dXJuIGhhc05nTW9kdWxlRGVmKHZhbHVlKTtcbn1cblxuZnVuY3Rpb24gbWF5YmVVbndyYXBGbjxUPihtYXliZUZuOiAoKCkgPT4gVCkgfCBUKTogVCB7XG4gIHJldHVybiBtYXliZUZuIGluc3RhbmNlb2YgRnVuY3Rpb24gPyBtYXliZUZuKCkgOiBtYXliZUZuO1xufVxuXG5mdW5jdGlvbiBmbGF0dGVuPFQ+KHZhbHVlczogYW55W10pOiBUW10ge1xuICBjb25zdCBvdXQ6IFRbXSA9IFtdO1xuICB2YWx1ZXMuZm9yRWFjaCgodmFsdWUpID0+IHtcbiAgICBpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHtcbiAgICAgIG91dC5wdXNoKC4uLmZsYXR0ZW48VD4odmFsdWUpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgb3V0LnB1c2godmFsdWUpO1xuICAgIH1cbiAgfSk7XG4gIHJldHVybiBvdXQ7XG59XG5cbmZ1bmN0aW9uIGlkZW50aXR5Rm48VD4odmFsdWU6IFQpOiBUIHtcbiAgcmV0dXJuIHZhbHVlO1xufVxuXG5mdW5jdGlvbiBmbGF0dGVuUHJvdmlkZXJzPFQ+KFxuICBwcm92aWRlcnM6IEFycmF5PFByb3ZpZGVyIHwgSW50ZXJuYWxFbnZpcm9ubWVudFByb3ZpZGVycz4sXG4gIG1hcEZuOiAocHJvdmlkZXI6IFByb3ZpZGVyKSA9PiBULFxuKTogVFtdO1xuZnVuY3Rpb24gZmxhdHRlblByb3ZpZGVycyhwcm92aWRlcnM6IEFycmF5PFByb3ZpZGVyIHwgSW50ZXJuYWxFbnZpcm9ubWVudFByb3ZpZGVycz4pOiBQcm92aWRlcltdO1xuZnVuY3Rpb24gZmxhdHRlblByb3ZpZGVycyhcbiAgcHJvdmlkZXJzOiBBcnJheTxQcm92aWRlciB8IEludGVybmFsRW52aXJvbm1lbnRQcm92aWRlcnM+LFxuICBtYXBGbjogKHByb3ZpZGVyOiBQcm92aWRlcikgPT4gYW55ID0gaWRlbnRpdHlGbixcbik6IGFueVtdIHtcbiAgY29uc3Qgb3V0OiBhbnlbXSA9IFtdO1xuICBmb3IgKGxldCBwcm92aWRlciBvZiBwcm92aWRlcnMpIHtcbiAgICBpZiAoaXNFbnZpcm9ubWVudFByb3ZpZGVycyhwcm92aWRlcikpIHtcbiAgICAgIHByb3ZpZGVyID0gcHJvdmlkZXIuybVwcm92aWRlcnM7XG4gICAgfVxuICAgIGlmIChBcnJheS5pc0FycmF5KHByb3ZpZGVyKSkge1xuICAgICAgb3V0LnB1c2goLi4uZmxhdHRlblByb3ZpZGVycyhwcm92aWRlciwgbWFwRm4pKTtcbiAgICB9IGVsc2Uge1xuICAgICAgb3V0LnB1c2gobWFwRm4ocHJvdmlkZXIpKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIG91dDtcbn1cblxuZnVuY3Rpb24gZ2V0UHJvdmlkZXJGaWVsZChwcm92aWRlcjogUHJvdmlkZXIsIGZpZWxkOiBzdHJpbmcpIHtcbiAgcmV0dXJuIHByb3ZpZGVyICYmIHR5cGVvZiBwcm92aWRlciA9PT0gJ29iamVjdCcgJiYgKHByb3ZpZGVyIGFzIGFueSlbZmllbGRdO1xufVxuXG5mdW5jdGlvbiBnZXRQcm92aWRlclRva2VuKHByb3ZpZGVyOiBQcm92aWRlcikge1xuICByZXR1cm4gZ2V0UHJvdmlkZXJGaWVsZChwcm92aWRlciwgJ3Byb3ZpZGUnKSB8fCBwcm92aWRlcjtcbn1cblxuZnVuY3Rpb24gaXNNb2R1bGVXaXRoUHJvdmlkZXJzKHZhbHVlOiBhbnkpOiB2YWx1ZSBpcyBNb2R1bGVXaXRoUHJvdmlkZXJzPGFueT4ge1xuICByZXR1cm4gdmFsdWUuaGFzT3duUHJvcGVydHkoJ25nTW9kdWxlJyk7XG59XG5cbmZ1bmN0aW9uIGZvckVhY2hSaWdodDxUPih2YWx1ZXM6IFRbXSwgZm46ICh2YWx1ZTogVCwgaWR4OiBudW1iZXIpID0+IHZvaWQpOiB2b2lkIHtcbiAgZm9yIChsZXQgaWR4ID0gdmFsdWVzLmxlbmd0aCAtIDE7IGlkeCA+PSAwOyBpZHgtLSkge1xuICAgIGZuKHZhbHVlc1tpZHhdLCBpZHgpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGludmFsaWRUeXBlRXJyb3IobmFtZTogc3RyaW5nLCBleHBlY3RlZFR5cGU6IHN0cmluZyk6IEVycm9yIHtcbiAgcmV0dXJuIG5ldyBFcnJvcihgJHtuYW1lfSBjbGFzcyBkb2Vzbid0IGhhdmUgQCR7ZXhwZWN0ZWRUeXBlfSBkZWNvcmF0b3Igb3IgaXMgbWlzc2luZyBtZXRhZGF0YS5gKTtcbn1cblxuY2xhc3MgUjNUZXN0Q29tcGlsZXIgaW1wbGVtZW50cyBDb21waWxlciB7XG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgdGVzdEJlZDogVGVzdEJlZENvbXBpbGVyKSB7fVxuXG4gIGNvbXBpbGVNb2R1bGVTeW5jPFQ+KG1vZHVsZVR5cGU6IFR5cGU8VD4pOiBOZ01vZHVsZUZhY3Rvcnk8VD4ge1xuICAgIHRoaXMudGVzdEJlZC5fY29tcGlsZU5nTW9kdWxlU3luYyhtb2R1bGVUeXBlKTtcbiAgICByZXR1cm4gbmV3IFIzTmdNb2R1bGVGYWN0b3J5KG1vZHVsZVR5cGUpO1xuICB9XG5cbiAgYXN5bmMgY29tcGlsZU1vZHVsZUFzeW5jPFQ+KG1vZHVsZVR5cGU6IFR5cGU8VD4pOiBQcm9taXNlPE5nTW9kdWxlRmFjdG9yeTxUPj4ge1xuICAgIGF3YWl0IHRoaXMudGVzdEJlZC5fY29tcGlsZU5nTW9kdWxlQXN5bmMobW9kdWxlVHlwZSk7XG4gICAgcmV0dXJuIG5ldyBSM05nTW9kdWxlRmFjdG9yeShtb2R1bGVUeXBlKTtcbiAgfVxuXG4gIGNvbXBpbGVNb2R1bGVBbmRBbGxDb21wb25lbnRzU3luYzxUPihtb2R1bGVUeXBlOiBUeXBlPFQ+KTogTW9kdWxlV2l0aENvbXBvbmVudEZhY3RvcmllczxUPiB7XG4gICAgY29uc3QgbmdNb2R1bGVGYWN0b3J5ID0gdGhpcy5jb21waWxlTW9kdWxlU3luYyhtb2R1bGVUeXBlKTtcbiAgICBjb25zdCBjb21wb25lbnRGYWN0b3JpZXMgPSB0aGlzLnRlc3RCZWQuX2dldENvbXBvbmVudEZhY3Rvcmllcyhtb2R1bGVUeXBlIGFzIE5nTW9kdWxlVHlwZTxUPik7XG4gICAgcmV0dXJuIG5ldyBNb2R1bGVXaXRoQ29tcG9uZW50RmFjdG9yaWVzKG5nTW9kdWxlRmFjdG9yeSwgY29tcG9uZW50RmFjdG9yaWVzKTtcbiAgfVxuXG4gIGFzeW5jIGNvbXBpbGVNb2R1bGVBbmRBbGxDb21wb25lbnRzQXN5bmM8VD4oXG4gICAgbW9kdWxlVHlwZTogVHlwZTxUPixcbiAgKTogUHJvbWlzZTxNb2R1bGVXaXRoQ29tcG9uZW50RmFjdG9yaWVzPFQ+PiB7XG4gICAgY29uc3QgbmdNb2R1bGVGYWN0b3J5ID0gYXdhaXQgdGhpcy5jb21waWxlTW9kdWxlQXN5bmMobW9kdWxlVHlwZSk7XG4gICAgY29uc3QgY29tcG9uZW50RmFjdG9yaWVzID0gdGhpcy50ZXN0QmVkLl9nZXRDb21wb25lbnRGYWN0b3JpZXMobW9kdWxlVHlwZSBhcyBOZ01vZHVsZVR5cGU8VD4pO1xuICAgIHJldHVybiBuZXcgTW9kdWxlV2l0aENvbXBvbmVudEZhY3RvcmllcyhuZ01vZHVsZUZhY3RvcnksIGNvbXBvbmVudEZhY3Rvcmllcyk7XG4gIH1cblxuICBjbGVhckNhY2hlKCk6IHZvaWQge31cblxuICBjbGVhckNhY2hlRm9yKHR5cGU6IFR5cGU8YW55Pik6IHZvaWQge31cblxuICBnZXRNb2R1bGVJZChtb2R1bGVUeXBlOiBUeXBlPGFueT4pOiBzdHJpbmcgfCB1bmRlZmluZWQge1xuICAgIGNvbnN0IG1ldGEgPSB0aGlzLnRlc3RCZWQuX2dldE1vZHVsZVJlc29sdmVyKCkucmVzb2x2ZShtb2R1bGVUeXBlKTtcbiAgICByZXR1cm4gKG1ldGEgJiYgbWV0YS5pZCkgfHwgdW5kZWZpbmVkO1xuICB9XG59XG4iXX0=