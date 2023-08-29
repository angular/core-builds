/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ResourceLoader } from '@angular/compiler';
import { ApplicationInitStatus, Compiler, COMPILER_OPTIONS, Injector, LOCALE_ID, ModuleWithComponentFactories, provideZoneChangeDetection, resolveForwardRef, ɵclearResolutionOfComponentResourcesQueue, ɵcompileComponent as compileComponent, ɵcompileDirective as compileDirective, ɵcompileNgModuleDefs as compileNgModuleDefs, ɵcompilePipe as compilePipe, ɵDEFAULT_LOCALE_ID as DEFAULT_LOCALE_ID, ɵdepsTracker as depsTracker, ɵgenerateStandaloneInDeclarationsError, ɵgetAsyncClassMetadata as getAsyncClassMetadata, ɵgetInjectableDef as getInjectableDef, ɵisComponentDefPendingResolution, ɵisEnvironmentProviders as isEnvironmentProviders, ɵNG_COMP_DEF as NG_COMP_DEF, ɵNG_DIR_DEF as NG_DIR_DEF, ɵNG_INJ_DEF as NG_INJ_DEF, ɵNG_MOD_DEF as NG_MOD_DEF, ɵNG_PIPE_DEF as NG_PIPE_DEF, ɵNgModuleFactory as R3NgModuleFactory, ɵpatchComponentDefWithScope as patchComponentDefWithScope, ɵRender3ComponentFactory as ComponentFactory, ɵRender3NgModuleRef as NgModuleRef, ɵresolveComponentResources, ɵrestoreComponentResolutionQueue, ɵsetLocaleId as setLocaleId, ɵtransitiveScopesFor as transitiveScopesFor, ɵUSE_RUNTIME_DEPS_TRACKER_FOR_JIT as USE_RUNTIME_DEPS_TRACKER_FOR_JIT } from '@angular/core';
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
        if (!getAsyncClassMetadata(type)) {
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
            return !!metadata.styleUrls && metadata.styleUrls.length > 0;
        };
        const overrideStyleUrls = !!def && !ɵisComponentDefPendingResolution(type) && hasStyleUrls();
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
    async resolvePendingComponentsWithAsyncMetadata() {
        if (this.pendingComponents.size === 0)
            return;
        const promises = [];
        for (const component of this.pendingComponents) {
            const asyncMetadataPromise = getAsyncClassMetadata(component);
            if (asyncMetadataPromise) {
                promises.push(asyncMetadataPromise);
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
            if (getAsyncClassMetadata(declaration)) {
                throw new Error(`Component '${declaration.name}' has unresolved metadata. ` +
                    `Please call \`await TestBed.compileComponents()\` before running this test.`);
            }
            needsAsyncResources = needsAsyncResources || ɵisComponentDefPendingResolution(declaration);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdF9iZWRfY29tcGlsZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3Rlc3Rpbmcvc3JjL3Rlc3RfYmVkX2NvbXBpbGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUNqRCxPQUFPLEVBQUMscUJBQXFCLEVBQUUsUUFBUSxFQUFFLGdCQUFnQixFQUF3QixRQUFRLEVBQWdCLFNBQVMsRUFBRSw0QkFBNEIsRUFBdUYsMEJBQTBCLEVBQUUsaUJBQWlCLEVBQXdCLHlDQUF5QyxFQUFFLGlCQUFpQixJQUFJLGdCQUFnQixFQUFFLGlCQUFpQixJQUFJLGdCQUFnQixFQUFFLG9CQUFvQixJQUFJLG1CQUFtQixFQUFFLFlBQVksSUFBSSxXQUFXLEVBQUUsa0JBQWtCLElBQUksaUJBQWlCLEVBQUUsWUFBWSxJQUFJLFdBQVcsRUFBaUMsc0NBQXNDLEVBQUUsc0JBQXNCLElBQUkscUJBQXFCLEVBQUUsaUJBQWlCLElBQUksZ0JBQWdCLEVBQWlFLGdDQUFnQyxFQUFFLHVCQUF1QixJQUFJLHNCQUFzQixFQUFFLFlBQVksSUFBSSxXQUFXLEVBQUUsV0FBVyxJQUFJLFVBQVUsRUFBRSxXQUFXLElBQUksVUFBVSxFQUFFLFdBQVcsSUFBSSxVQUFVLEVBQUUsWUFBWSxJQUFJLFdBQVcsRUFBRSxnQkFBZ0IsSUFBSSxpQkFBaUIsRUFBd0YsMkJBQTJCLElBQUksMEJBQTBCLEVBQUUsd0JBQXdCLElBQUksZ0JBQWdCLEVBQUUsbUJBQW1CLElBQUksV0FBVyxFQUFFLDBCQUEwQixFQUFFLGdDQUFnQyxFQUFFLFlBQVksSUFBSSxXQUFXLEVBQUUsb0JBQW9CLElBQUksbUJBQW1CLEVBQUUsaUNBQWlDLElBQUksZ0NBQWdDLEVBQW1ELE1BQU0sZUFBZSxDQUFDO0FBS25oRCxPQUFPLEVBQUMsaUJB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InNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1Jlc291cmNlTG9hZGVyfSBmcm9tICdAYW5ndWxhci9jb21waWxlcic7XG5pbXBvcnQge0FwcGxpY2F0aW9uSW5pdFN0YXR1cywgQ29tcGlsZXIsIENPTVBJTEVSX09QVElPTlMsIENvbXBvbmVudCwgRGlyZWN0aXZlLCBJbmplY3RvciwgSW5qZWN0b3JUeXBlLCBMT0NBTEVfSUQsIE1vZHVsZVdpdGhDb21wb25lbnRGYWN0b3JpZXMsIE1vZHVsZVdpdGhQcm92aWRlcnMsIE5nTW9kdWxlLCBOZ01vZHVsZUZhY3RvcnksIE5nWm9uZSwgUGlwZSwgUGxhdGZvcm1SZWYsIFByb3ZpZGVyLCBwcm92aWRlWm9uZUNoYW5nZURldGVjdGlvbiwgcmVzb2x2ZUZvcndhcmRSZWYsIFN0YXRpY1Byb3ZpZGVyLCBUeXBlLCDJtWNsZWFyUmVzb2x1dGlvbk9mQ29tcG9uZW50UmVzb3VyY2VzUXVldWUsIMm1Y29tcGlsZUNvbXBvbmVudCBhcyBjb21waWxlQ29tcG9uZW50LCDJtWNvbXBpbGVEaXJlY3RpdmUgYXMgY29tcGlsZURpcmVjdGl2ZSwgybVjb21waWxlTmdNb2R1bGVEZWZzIGFzIGNvbXBpbGVOZ01vZHVsZURlZnMsIMm1Y29tcGlsZVBpcGUgYXMgY29tcGlsZVBpcGUsIMm1REVGQVVMVF9MT0NBTEVfSUQgYXMgREVGQVVMVF9MT0NBTEVfSUQsIMm1ZGVwc1RyYWNrZXIgYXMgZGVwc1RyYWNrZXIsIMm1RGlyZWN0aXZlRGVmIGFzIERpcmVjdGl2ZURlZiwgybVnZW5lcmF0ZVN0YW5kYWxvbmVJbkRlY2xhcmF0aW9uc0Vycm9yLCDJtWdldEFzeW5jQ2xhc3NNZXRhZGF0YSBhcyBnZXRBc3luY0NsYXNzTWV0YWRhdGEsIMm1Z2V0SW5qZWN0YWJsZURlZiBhcyBnZXRJbmplY3RhYmxlRGVmLCDJtUludGVybmFsRW52aXJvbm1lbnRQcm92aWRlcnMgYXMgSW50ZXJuYWxFbnZpcm9ubWVudFByb3ZpZGVycywgybVpc0NvbXBvbmVudERlZlBlbmRpbmdSZXNvbHV0aW9uLCDJtWlzRW52aXJvbm1lbnRQcm92aWRlcnMgYXMgaXNFbnZpcm9ubWVudFByb3ZpZGVycywgybVOR19DT01QX0RFRiBhcyBOR19DT01QX0RFRiwgybVOR19ESVJfREVGIGFzIE5HX0RJUl9ERUYsIMm1TkdfSU5KX0RFRiBhcyBOR19JTkpfREVGLCDJtU5HX01PRF9ERUYgYXMgTkdfTU9EX0RFRiwgybVOR19QSVBFX0RFRiBhcyBOR19QSVBFX0RFRiwgybVOZ01vZHVsZUZhY3RvcnkgYXMgUjNOZ01vZHVsZUZhY3RvcnksIMm1TmdNb2R1bGVUcmFuc2l0aXZlU2NvcGVzIGFzIE5nTW9kdWxlVHJhbnNpdGl2ZVNjb3BlcywgybVOZ01vZHVsZVR5cGUgYXMgTmdNb2R1bGVUeXBlLCDJtXBhdGNoQ29tcG9uZW50RGVmV2l0aFNjb3BlIGFzIHBhdGNoQ29tcG9uZW50RGVmV2l0aFNjb3BlLCDJtVJlbmRlcjNDb21wb25lbnRGYWN0b3J5IGFzIENvbXBvbmVudEZhY3RvcnksIMm1UmVuZGVyM05nTW9kdWxlUmVmIGFzIE5nTW9kdWxlUmVmLCDJtXJlc29sdmVDb21wb25lbnRSZXNvdXJjZXMsIMm1cmVzdG9yZUNvbXBvbmVudFJlc29sdXRpb25RdWV1ZSwgybVzZXRMb2NhbGVJZCBhcyBzZXRMb2NhbGVJZCwgybV0cmFuc2l0aXZlU2NvcGVzRm9yIGFzIHRyYW5zaXRpdmVTY29wZXNGb3IsIMm1VVNFX1JVTlRJTUVfREVQU19UUkFDS0VSX0ZPUl9KSVQgYXMgVVNFX1JVTlRJTUVfREVQU19UUkFDS0VSX0ZPUl9KSVQsIMm1ybVJbmplY3RhYmxlRGVjbGFyYXRpb24gYXMgSW5qZWN0YWJsZURlY2xhcmF0aW9ufSBmcm9tICdAYW5ndWxhci9jb3JlJztcblxuaW1wb3J0IHtDb21wb25lbnREZWYsIENvbXBvbmVudFR5cGV9IGZyb20gJy4uLy4uL3NyYy9yZW5kZXIzJztcblxuaW1wb3J0IHtNZXRhZGF0YU92ZXJyaWRlfSBmcm9tICcuL21ldGFkYXRhX292ZXJyaWRlJztcbmltcG9ydCB7Q29tcG9uZW50UmVzb2x2ZXIsIERpcmVjdGl2ZVJlc29sdmVyLCBOZ01vZHVsZVJlc29sdmVyLCBQaXBlUmVzb2x2ZXIsIFJlc29sdmVyfSBmcm9tICcuL3Jlc29sdmVycyc7XG5pbXBvcnQge1Rlc3RNb2R1bGVNZXRhZGF0YX0gZnJvbSAnLi90ZXN0X2JlZF9jb21tb24nO1xuXG5lbnVtIFRlc3RpbmdNb2R1bGVPdmVycmlkZSB7XG4gIERFQ0xBUkFUSU9OLFxuICBPVkVSUklERV9URU1QTEFURSxcbn1cblxuZnVuY3Rpb24gaXNUZXN0aW5nTW9kdWxlT3ZlcnJpZGUodmFsdWU6IHVua25vd24pOiB2YWx1ZSBpcyBUZXN0aW5nTW9kdWxlT3ZlcnJpZGUge1xuICByZXR1cm4gdmFsdWUgPT09IFRlc3RpbmdNb2R1bGVPdmVycmlkZS5ERUNMQVJBVElPTiB8fFxuICAgICAgdmFsdWUgPT09IFRlc3RpbmdNb2R1bGVPdmVycmlkZS5PVkVSUklERV9URU1QTEFURTtcbn1cblxuZnVuY3Rpb24gYXNzZXJ0Tm9TdGFuZGFsb25lQ29tcG9uZW50cyhcbiAgICB0eXBlczogVHlwZTxhbnk+W10sIHJlc29sdmVyOiBSZXNvbHZlcjxhbnk+LCBsb2NhdGlvbjogc3RyaW5nKSB7XG4gIHR5cGVzLmZvckVhY2godHlwZSA9PiB7XG4gICAgaWYgKCFnZXRBc3luY0NsYXNzTWV0YWRhdGEodHlwZSkpIHtcbiAgICAgIGNvbnN0IGNvbXBvbmVudCA9IHJlc29sdmVyLnJlc29sdmUodHlwZSk7XG4gICAgICBpZiAoY29tcG9uZW50ICYmIGNvbXBvbmVudC5zdGFuZGFsb25lKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcijJtWdlbmVyYXRlU3RhbmRhbG9uZUluRGVjbGFyYXRpb25zRXJyb3IodHlwZSwgbG9jYXRpb24pKTtcbiAgICAgIH1cbiAgICB9XG4gIH0pO1xufVxuXG4vLyBSZXNvbHZlcnMgZm9yIEFuZ3VsYXIgZGVjb3JhdG9yc1xudHlwZSBSZXNvbHZlcnMgPSB7XG4gIG1vZHVsZTogUmVzb2x2ZXI8TmdNb2R1bGU+LFxuICBjb21wb25lbnQ6IFJlc29sdmVyPERpcmVjdGl2ZT4sXG4gIGRpcmVjdGl2ZTogUmVzb2x2ZXI8Q29tcG9uZW50PixcbiAgcGlwZTogUmVzb2x2ZXI8UGlwZT4sXG59O1xuXG5pbnRlcmZhY2UgQ2xlYW51cE9wZXJhdGlvbiB7XG4gIGZpZWxkTmFtZTogc3RyaW5nO1xuICBvYmplY3Q6IGFueTtcbiAgb3JpZ2luYWxWYWx1ZTogdW5rbm93bjtcbn1cblxuZXhwb3J0IGNsYXNzIFRlc3RCZWRDb21waWxlciB7XG4gIHByaXZhdGUgb3JpZ2luYWxDb21wb25lbnRSZXNvbHV0aW9uUXVldWU6IE1hcDxUeXBlPGFueT4sIENvbXBvbmVudD58bnVsbCA9IG51bGw7XG5cbiAgLy8gVGVzdGluZyBtb2R1bGUgY29uZmlndXJhdGlvblxuICBwcml2YXRlIGRlY2xhcmF0aW9uczogVHlwZTxhbnk+W10gPSBbXTtcbiAgcHJpdmF0ZSBpbXBvcnRzOiBUeXBlPGFueT5bXSA9IFtdO1xuICBwcml2YXRlIHByb3ZpZGVyczogUHJvdmlkZXJbXSA9IFtdO1xuICBwcml2YXRlIHNjaGVtYXM6IGFueVtdID0gW107XG5cbiAgLy8gUXVldWVzIG9mIGNvbXBvbmVudHMvZGlyZWN0aXZlcy9waXBlcyB0aGF0IHNob3VsZCBiZSByZWNvbXBpbGVkLlxuICBwcml2YXRlIHBlbmRpbmdDb21wb25lbnRzID0gbmV3IFNldDxUeXBlPGFueT4+KCk7XG4gIHByaXZhdGUgcGVuZGluZ0RpcmVjdGl2ZXMgPSBuZXcgU2V0PFR5cGU8YW55Pj4oKTtcbiAgcHJpdmF0ZSBwZW5kaW5nUGlwZXMgPSBuZXcgU2V0PFR5cGU8YW55Pj4oKTtcblxuICAvLyBLZWVwIHRyYWNrIG9mIGFsbCBjb21wb25lbnRzIGFuZCBkaXJlY3RpdmVzLCBzbyB3ZSBjYW4gcGF0Y2ggUHJvdmlkZXJzIG9udG8gZGVmcyBsYXRlci5cbiAgcHJpdmF0ZSBzZWVuQ29tcG9uZW50cyA9IG5ldyBTZXQ8VHlwZTxhbnk+PigpO1xuICBwcml2YXRlIHNlZW5EaXJlY3RpdmVzID0gbmV3IFNldDxUeXBlPGFueT4+KCk7XG5cbiAgLy8gS2VlcCB0cmFjayBvZiBvdmVycmlkZGVuIG1vZHVsZXMsIHNvIHRoYXQgd2UgY2FuIGNvbGxlY3QgYWxsIGFmZmVjdGVkIG9uZXMgaW4gdGhlIG1vZHVsZSB0cmVlLlxuICBwcml2YXRlIG92ZXJyaWRkZW5Nb2R1bGVzID0gbmV3IFNldDxOZ01vZHVsZVR5cGU8YW55Pj4oKTtcblxuICAvLyBTdG9yZSByZXNvbHZlZCBzdHlsZXMgZm9yIENvbXBvbmVudHMgdGhhdCBoYXZlIHRlbXBsYXRlIG92ZXJyaWRlcyBwcmVzZW50IGFuZCBgc3R5bGVVcmxzYFxuICAvLyBkZWZpbmVkIGF0IHRoZSBzYW1lIHRpbWUuXG4gIHByaXZhdGUgZXhpc3RpbmdDb21wb25lbnRTdHlsZXMgPSBuZXcgTWFwPFR5cGU8YW55Piwgc3RyaW5nW10+KCk7XG5cbiAgcHJpdmF0ZSByZXNvbHZlcnM6IFJlc29sdmVycyA9IGluaXRSZXNvbHZlcnMoKTtcblxuICBwcml2YXRlIGNvbXBvbmVudFRvTW9kdWxlU2NvcGUgPSBuZXcgTWFwPFR5cGU8YW55PiwgVHlwZTxhbnk+fFRlc3RpbmdNb2R1bGVPdmVycmlkZT4oKTtcblxuICAvLyBNYXAgdGhhdCBrZWVwcyBpbml0aWFsIHZlcnNpb24gb2YgY29tcG9uZW50L2RpcmVjdGl2ZS9waXBlIGRlZnMgaW4gY2FzZVxuICAvLyB3ZSBjb21waWxlIGEgVHlwZSBhZ2FpbiwgdGh1cyBvdmVycmlkaW5nIHJlc3BlY3RpdmUgc3RhdGljIGZpZWxkcy4gVGhpcyBpc1xuICAvLyByZXF1aXJlZCB0byBtYWtlIHN1cmUgd2UgcmVzdG9yZSBkZWZzIHRvIHRoZWlyIGluaXRpYWwgc3RhdGVzIGJldHdlZW4gdGVzdCBydW5zLlxuICAvLyBOb3RlOiBvbmUgY2xhc3MgbWF5IGhhdmUgbXVsdGlwbGUgZGVmcyAoZm9yIGV4YW1wbGU6IMm1bW9kIGFuZCDJtWluaiBpbiBjYXNlIG9mIGFuXG4gIC8vIE5nTW9kdWxlKSwgc3RvcmUgYWxsIG9mIHRoZW0gaW4gYSBtYXAuXG4gIHByaXZhdGUgaW5pdGlhbE5nRGVmcyA9IG5ldyBNYXA8VHlwZTxhbnk+LCBNYXA8c3RyaW5nLCBQcm9wZXJ0eURlc2NyaXB0b3J8dW5kZWZpbmVkPj4oKTtcblxuICAvLyBBcnJheSB0aGF0IGtlZXBzIGNsZWFudXAgb3BlcmF0aW9ucyBmb3IgaW5pdGlhbCB2ZXJzaW9ucyBvZiBjb21wb25lbnQvZGlyZWN0aXZlL3BpcGUvbW9kdWxlXG4gIC8vIGRlZnMgaW4gY2FzZSBUZXN0QmVkIG1ha2VzIGNoYW5nZXMgdG8gdGhlIG9yaWdpbmFscy5cbiAgcHJpdmF0ZSBkZWZDbGVhbnVwT3BzOiBDbGVhbnVwT3BlcmF0aW9uW10gPSBbXTtcblxuICBwcml2YXRlIF9pbmplY3RvcjogSW5qZWN0b3J8bnVsbCA9IG51bGw7XG4gIHByaXZhdGUgY29tcGlsZXJQcm92aWRlcnM6IFByb3ZpZGVyW118bnVsbCA9IG51bGw7XG5cbiAgcHJpdmF0ZSBwcm92aWRlck92ZXJyaWRlczogUHJvdmlkZXJbXSA9IFtdO1xuICBwcml2YXRlIHJvb3RQcm92aWRlck92ZXJyaWRlczogUHJvdmlkZXJbXSA9IFtdO1xuICAvLyBPdmVycmlkZXMgZm9yIGluamVjdGFibGVzIHdpdGggYHtwcm92aWRlZEluOiBTb21lTW9kdWxlfWAgbmVlZCB0byBiZSB0cmFja2VkIGFuZCBhZGRlZCB0byB0aGF0XG4gIC8vIG1vZHVsZSdzIHByb3ZpZGVyIGxpc3QuXG4gIHByaXZhdGUgcHJvdmlkZXJPdmVycmlkZXNCeU1vZHVsZSA9IG5ldyBNYXA8SW5qZWN0b3JUeXBlPGFueT4sIFByb3ZpZGVyW10+KCk7XG4gIHByaXZhdGUgcHJvdmlkZXJPdmVycmlkZXNCeVRva2VuID0gbmV3IE1hcDxhbnksIFByb3ZpZGVyPigpO1xuICBwcml2YXRlIHNjb3Blc1dpdGhPdmVycmlkZGVuUHJvdmlkZXJzID0gbmV3IFNldDxUeXBlPGFueT4+KCk7XG5cbiAgcHJpdmF0ZSB0ZXN0TW9kdWxlVHlwZTogTmdNb2R1bGVUeXBlPGFueT47XG4gIHByaXZhdGUgdGVzdE1vZHVsZVJlZjogTmdNb2R1bGVSZWY8YW55PnxudWxsID0gbnVsbDtcblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIHBsYXRmb3JtOiBQbGF0Zm9ybVJlZiwgcHJpdmF0ZSBhZGRpdGlvbmFsTW9kdWxlVHlwZXM6IFR5cGU8YW55PnxUeXBlPGFueT5bXSkge1xuICAgIGNsYXNzIER5bmFtaWNUZXN0TW9kdWxlIHt9XG4gICAgdGhpcy50ZXN0TW9kdWxlVHlwZSA9IER5bmFtaWNUZXN0TW9kdWxlIGFzIGFueTtcbiAgfVxuXG4gIHNldENvbXBpbGVyUHJvdmlkZXJzKHByb3ZpZGVyczogUHJvdmlkZXJbXXxudWxsKTogdm9pZCB7XG4gICAgdGhpcy5jb21waWxlclByb3ZpZGVycyA9IHByb3ZpZGVycztcbiAgICB0aGlzLl9pbmplY3RvciA9IG51bGw7XG4gIH1cblxuICBjb25maWd1cmVUZXN0aW5nTW9kdWxlKG1vZHVsZURlZjogVGVzdE1vZHVsZU1ldGFkYXRhKTogdm9pZCB7XG4gICAgLy8gRW5xdWV1ZSBhbnkgY29tcGlsYXRpb24gdGFza3MgZm9yIHRoZSBkaXJlY3RseSBkZWNsYXJlZCBjb21wb25lbnQuXG4gICAgaWYgKG1vZHVsZURlZi5kZWNsYXJhdGlvbnMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgLy8gVmVyaWZ5IHRoYXQgdGhlcmUgYXJlIG5vIHN0YW5kYWxvbmUgY29tcG9uZW50c1xuICAgICAgYXNzZXJ0Tm9TdGFuZGFsb25lQ29tcG9uZW50cyhcbiAgICAgICAgICBtb2R1bGVEZWYuZGVjbGFyYXRpb25zLCB0aGlzLnJlc29sdmVycy5jb21wb25lbnQsXG4gICAgICAgICAgJ1wiVGVzdEJlZC5jb25maWd1cmVUZXN0aW5nTW9kdWxlXCIgY2FsbCcpO1xuICAgICAgdGhpcy5xdWV1ZVR5cGVBcnJheShtb2R1bGVEZWYuZGVjbGFyYXRpb25zLCBUZXN0aW5nTW9kdWxlT3ZlcnJpZGUuREVDTEFSQVRJT04pO1xuICAgICAgdGhpcy5kZWNsYXJhdGlvbnMucHVzaCguLi5tb2R1bGVEZWYuZGVjbGFyYXRpb25zKTtcbiAgICB9XG5cbiAgICAvLyBFbnF1ZXVlIGFueSBjb21waWxhdGlvbiB0YXNrcyBmb3IgaW1wb3J0ZWQgbW9kdWxlcy5cbiAgICBpZiAobW9kdWxlRGVmLmltcG9ydHMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhpcy5xdWV1ZVR5cGVzRnJvbU1vZHVsZXNBcnJheShtb2R1bGVEZWYuaW1wb3J0cyk7XG4gICAgICB0aGlzLmltcG9ydHMucHVzaCguLi5tb2R1bGVEZWYuaW1wb3J0cyk7XG4gICAgfVxuXG4gICAgaWYgKG1vZHVsZURlZi5wcm92aWRlcnMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhpcy5wcm92aWRlcnMucHVzaCguLi5tb2R1bGVEZWYucHJvdmlkZXJzKTtcbiAgICB9XG5cbiAgICBpZiAobW9kdWxlRGVmLnNjaGVtYXMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhpcy5zY2hlbWFzLnB1c2goLi4ubW9kdWxlRGVmLnNjaGVtYXMpO1xuICAgIH1cbiAgfVxuXG4gIG92ZXJyaWRlTW9kdWxlKG5nTW9kdWxlOiBUeXBlPGFueT4sIG92ZXJyaWRlOiBNZXRhZGF0YU92ZXJyaWRlPE5nTW9kdWxlPik6IHZvaWQge1xuICAgIGlmIChVU0VfUlVOVElNRV9ERVBTX1RSQUNLRVJfRk9SX0pJVCkge1xuICAgICAgZGVwc1RyYWNrZXIuY2xlYXJTY29wZUNhY2hlRm9yKG5nTW9kdWxlKTtcbiAgICB9XG4gICAgdGhpcy5vdmVycmlkZGVuTW9kdWxlcy5hZGQobmdNb2R1bGUgYXMgTmdNb2R1bGVUeXBlPGFueT4pO1xuXG4gICAgLy8gQ29tcGlsZSB0aGUgbW9kdWxlIHJpZ2h0IGF3YXkuXG4gICAgdGhpcy5yZXNvbHZlcnMubW9kdWxlLmFkZE92ZXJyaWRlKG5nTW9kdWxlLCBvdmVycmlkZSk7XG4gICAgY29uc3QgbWV0YWRhdGEgPSB0aGlzLnJlc29sdmVycy5tb2R1bGUucmVzb2x2ZShuZ01vZHVsZSk7XG4gICAgaWYgKG1ldGFkYXRhID09PSBudWxsKSB7XG4gICAgICB0aHJvdyBpbnZhbGlkVHlwZUVycm9yKG5nTW9kdWxlLm5hbWUsICdOZ01vZHVsZScpO1xuICAgIH1cblxuICAgIHRoaXMucmVjb21waWxlTmdNb2R1bGUobmdNb2R1bGUsIG1ldGFkYXRhKTtcblxuICAgIC8vIEF0IHRoaXMgcG9pbnQsIHRoZSBtb2R1bGUgaGFzIGEgdmFsaWQgbW9kdWxlIGRlZiAoybVtb2QpLCBidXQgdGhlIG92ZXJyaWRlIG1heSBoYXZlIGludHJvZHVjZWRcbiAgICAvLyBuZXcgZGVjbGFyYXRpb25zIG9yIGltcG9ydGVkIG1vZHVsZXMuIEluZ2VzdCBhbnkgcG9zc2libGUgbmV3IHR5cGVzIGFuZCBhZGQgdGhlbSB0byB0aGVcbiAgICAvLyBjdXJyZW50IHF1ZXVlLlxuICAgIHRoaXMucXVldWVUeXBlc0Zyb21Nb2R1bGVzQXJyYXkoW25nTW9kdWxlXSk7XG4gIH1cblxuICBvdmVycmlkZUNvbXBvbmVudChjb21wb25lbnQ6IFR5cGU8YW55Piwgb3ZlcnJpZGU6IE1ldGFkYXRhT3ZlcnJpZGU8Q29tcG9uZW50Pik6IHZvaWQge1xuICAgIHRoaXMudmVyaWZ5Tm9TdGFuZGFsb25lRmxhZ092ZXJyaWRlcyhjb21wb25lbnQsIG92ZXJyaWRlKTtcbiAgICB0aGlzLnJlc29sdmVycy5jb21wb25lbnQuYWRkT3ZlcnJpZGUoY29tcG9uZW50LCBvdmVycmlkZSk7XG4gICAgdGhpcy5wZW5kaW5nQ29tcG9uZW50cy5hZGQoY29tcG9uZW50KTtcbiAgfVxuXG4gIG92ZXJyaWRlRGlyZWN0aXZlKGRpcmVjdGl2ZTogVHlwZTxhbnk+LCBvdmVycmlkZTogTWV0YWRhdGFPdmVycmlkZTxEaXJlY3RpdmU+KTogdm9pZCB7XG4gICAgdGhpcy52ZXJpZnlOb1N0YW5kYWxvbmVGbGFnT3ZlcnJpZGVzKGRpcmVjdGl2ZSwgb3ZlcnJpZGUpO1xuICAgIHRoaXMucmVzb2x2ZXJzLmRpcmVjdGl2ZS5hZGRPdmVycmlkZShkaXJlY3RpdmUsIG92ZXJyaWRlKTtcbiAgICB0aGlzLnBlbmRpbmdEaXJlY3RpdmVzLmFkZChkaXJlY3RpdmUpO1xuICB9XG5cbiAgb3ZlcnJpZGVQaXBlKHBpcGU6IFR5cGU8YW55Piwgb3ZlcnJpZGU6IE1ldGFkYXRhT3ZlcnJpZGU8UGlwZT4pOiB2b2lkIHtcbiAgICB0aGlzLnZlcmlmeU5vU3RhbmRhbG9uZUZsYWdPdmVycmlkZXMocGlwZSwgb3ZlcnJpZGUpO1xuICAgIHRoaXMucmVzb2x2ZXJzLnBpcGUuYWRkT3ZlcnJpZGUocGlwZSwgb3ZlcnJpZGUpO1xuICAgIHRoaXMucGVuZGluZ1BpcGVzLmFkZChwaXBlKTtcbiAgfVxuXG4gIHByaXZhdGUgdmVyaWZ5Tm9TdGFuZGFsb25lRmxhZ092ZXJyaWRlcyhcbiAgICAgIHR5cGU6IFR5cGU8YW55Piwgb3ZlcnJpZGU6IE1ldGFkYXRhT3ZlcnJpZGU8Q29tcG9uZW50fERpcmVjdGl2ZXxQaXBlPikge1xuICAgIGlmIChvdmVycmlkZS5hZGQ/Lmhhc093blByb3BlcnR5KCdzdGFuZGFsb25lJykgfHwgb3ZlcnJpZGUuc2V0Py5oYXNPd25Qcm9wZXJ0eSgnc3RhbmRhbG9uZScpIHx8XG4gICAgICAgIG92ZXJyaWRlLnJlbW92ZT8uaGFzT3duUHJvcGVydHkoJ3N0YW5kYWxvbmUnKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgIGBBbiBvdmVycmlkZSBmb3IgdGhlICR7dHlwZS5uYW1lfSBjbGFzcyBoYXMgdGhlIFxcYHN0YW5kYWxvbmVcXGAgZmxhZy4gYCArXG4gICAgICAgICAgYENoYW5naW5nIHRoZSBcXGBzdGFuZGFsb25lXFxgIGZsYWcgdmlhIFRlc3RCZWQgb3ZlcnJpZGVzIGlzIG5vdCBzdXBwb3J0ZWQuYCk7XG4gICAgfVxuICB9XG5cbiAgb3ZlcnJpZGVQcm92aWRlcihcbiAgICAgIHRva2VuOiBhbnksXG4gICAgICBwcm92aWRlcjoge3VzZUZhY3Rvcnk/OiBGdW5jdGlvbiwgdXNlVmFsdWU/OiBhbnksIGRlcHM/OiBhbnlbXSwgbXVsdGk/OiBib29sZWFufSk6IHZvaWQge1xuICAgIGxldCBwcm92aWRlckRlZjogUHJvdmlkZXI7XG4gICAgaWYgKHByb3ZpZGVyLnVzZUZhY3RvcnkgIT09IHVuZGVmaW5lZCkge1xuICAgICAgcHJvdmlkZXJEZWYgPSB7XG4gICAgICAgIHByb3ZpZGU6IHRva2VuLFxuICAgICAgICB1c2VGYWN0b3J5OiBwcm92aWRlci51c2VGYWN0b3J5LFxuICAgICAgICBkZXBzOiBwcm92aWRlci5kZXBzIHx8IFtdLFxuICAgICAgICBtdWx0aTogcHJvdmlkZXIubXVsdGlcbiAgICAgIH07XG4gICAgfSBlbHNlIGlmIChwcm92aWRlci51c2VWYWx1ZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBwcm92aWRlckRlZiA9IHtwcm92aWRlOiB0b2tlbiwgdXNlVmFsdWU6IHByb3ZpZGVyLnVzZVZhbHVlLCBtdWx0aTogcHJvdmlkZXIubXVsdGl9O1xuICAgIH0gZWxzZSB7XG4gICAgICBwcm92aWRlckRlZiA9IHtwcm92aWRlOiB0b2tlbn07XG4gICAgfVxuXG4gICAgY29uc3QgaW5qZWN0YWJsZURlZjogSW5qZWN0YWJsZURlY2xhcmF0aW9uPGFueT58bnVsbCA9XG4gICAgICAgIHR5cGVvZiB0b2tlbiAhPT0gJ3N0cmluZycgPyBnZXRJbmplY3RhYmxlRGVmKHRva2VuKSA6IG51bGw7XG4gICAgY29uc3QgcHJvdmlkZWRJbiA9IGluamVjdGFibGVEZWYgPT09IG51bGwgPyBudWxsIDogcmVzb2x2ZUZvcndhcmRSZWYoaW5qZWN0YWJsZURlZi5wcm92aWRlZEluKTtcbiAgICBjb25zdCBvdmVycmlkZXNCdWNrZXQgPVxuICAgICAgICBwcm92aWRlZEluID09PSAncm9vdCcgPyB0aGlzLnJvb3RQcm92aWRlck92ZXJyaWRlcyA6IHRoaXMucHJvdmlkZXJPdmVycmlkZXM7XG4gICAgb3ZlcnJpZGVzQnVja2V0LnB1c2gocHJvdmlkZXJEZWYpO1xuXG4gICAgLy8gS2VlcCBvdmVycmlkZXMgZ3JvdXBlZCBieSB0b2tlbiBhcyB3ZWxsIGZvciBmYXN0IGxvb2t1cHMgdXNpbmcgdG9rZW5cbiAgICB0aGlzLnByb3ZpZGVyT3ZlcnJpZGVzQnlUb2tlbi5zZXQodG9rZW4sIHByb3ZpZGVyRGVmKTtcbiAgICBpZiAoaW5qZWN0YWJsZURlZiAhPT0gbnVsbCAmJiBwcm92aWRlZEluICE9PSBudWxsICYmIHR5cGVvZiBwcm92aWRlZEluICE9PSAnc3RyaW5nJykge1xuICAgICAgY29uc3QgZXhpc3RpbmdPdmVycmlkZXMgPSB0aGlzLnByb3ZpZGVyT3ZlcnJpZGVzQnlNb2R1bGUuZ2V0KHByb3ZpZGVkSW4pO1xuICAgICAgaWYgKGV4aXN0aW5nT3ZlcnJpZGVzICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgZXhpc3RpbmdPdmVycmlkZXMucHVzaChwcm92aWRlckRlZik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLnByb3ZpZGVyT3ZlcnJpZGVzQnlNb2R1bGUuc2V0KHByb3ZpZGVkSW4sIFtwcm92aWRlckRlZl0pO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIG92ZXJyaWRlVGVtcGxhdGVVc2luZ1Rlc3RpbmdNb2R1bGUodHlwZTogVHlwZTxhbnk+LCB0ZW1wbGF0ZTogc3RyaW5nKTogdm9pZCB7XG4gICAgY29uc3QgZGVmID0gKHR5cGUgYXMgYW55KVtOR19DT01QX0RFRl07XG4gICAgY29uc3QgaGFzU3R5bGVVcmxzID0gKCk6IGJvb2xlYW4gPT4ge1xuICAgICAgY29uc3QgbWV0YWRhdGEgPSB0aGlzLnJlc29sdmVycy5jb21wb25lbnQucmVzb2x2ZSh0eXBlKSEgYXMgQ29tcG9uZW50O1xuICAgICAgcmV0dXJuICEhbWV0YWRhdGEuc3R5bGVVcmxzICYmIG1ldGFkYXRhLnN0eWxlVXJscy5sZW5ndGggPiAwO1xuICAgIH07XG4gICAgY29uc3Qgb3ZlcnJpZGVTdHlsZVVybHMgPSAhIWRlZiAmJiAhybVpc0NvbXBvbmVudERlZlBlbmRpbmdSZXNvbHV0aW9uKHR5cGUpICYmIGhhc1N0eWxlVXJscygpO1xuXG4gICAgLy8gSW4gSXZ5LCBjb21waWxpbmcgYSBjb21wb25lbnQgZG9lcyBub3QgcmVxdWlyZSBrbm93aW5nIHRoZSBtb2R1bGUgcHJvdmlkaW5nIHRoZVxuICAgIC8vIGNvbXBvbmVudCdzIHNjb3BlLCBzbyBvdmVycmlkZVRlbXBsYXRlVXNpbmdUZXN0aW5nTW9kdWxlIGNhbiBiZSBpbXBsZW1lbnRlZCBwdXJlbHkgdmlhXG4gICAgLy8gb3ZlcnJpZGVDb21wb25lbnQuIEltcG9ydGFudDogb3ZlcnJpZGluZyB0ZW1wbGF0ZSByZXF1aXJlcyBmdWxsIENvbXBvbmVudCByZS1jb21waWxhdGlvbixcbiAgICAvLyB3aGljaCBtYXkgZmFpbCBpbiBjYXNlIHN0eWxlVXJscyBhcmUgYWxzbyBwcmVzZW50ICh0aHVzIENvbXBvbmVudCBpcyBjb25zaWRlcmVkIGFzIHJlcXVpcmVkXG4gICAgLy8gcmVzb2x1dGlvbikuIEluIG9yZGVyIHRvIGF2b2lkIHRoaXMsIHdlIHByZWVtcHRpdmVseSBzZXQgc3R5bGVVcmxzIHRvIGFuIGVtcHR5IGFycmF5LFxuICAgIC8vIHByZXNlcnZlIGN1cnJlbnQgc3R5bGVzIGF2YWlsYWJsZSBvbiBDb21wb25lbnQgZGVmIGFuZCByZXN0b3JlIHN0eWxlcyBiYWNrIG9uY2UgY29tcGlsYXRpb25cbiAgICAvLyBpcyBjb21wbGV0ZS5cbiAgICBjb25zdCBvdmVycmlkZSA9IG92ZXJyaWRlU3R5bGVVcmxzID8ge3RlbXBsYXRlLCBzdHlsZXM6IFtdLCBzdHlsZVVybHM6IFtdfSA6IHt0ZW1wbGF0ZX07XG4gICAgdGhpcy5vdmVycmlkZUNvbXBvbmVudCh0eXBlLCB7c2V0OiBvdmVycmlkZX0pO1xuXG4gICAgaWYgKG92ZXJyaWRlU3R5bGVVcmxzICYmIGRlZi5zdHlsZXMgJiYgZGVmLnN0eWxlcy5sZW5ndGggPiAwKSB7XG4gICAgICB0aGlzLmV4aXN0aW5nQ29tcG9uZW50U3R5bGVzLnNldCh0eXBlLCBkZWYuc3R5bGVzKTtcbiAgICB9XG5cbiAgICAvLyBTZXQgdGhlIGNvbXBvbmVudCdzIHNjb3BlIHRvIGJlIHRoZSB0ZXN0aW5nIG1vZHVsZS5cbiAgICB0aGlzLmNvbXBvbmVudFRvTW9kdWxlU2NvcGUuc2V0KHR5cGUsIFRlc3RpbmdNb2R1bGVPdmVycmlkZS5PVkVSUklERV9URU1QTEFURSk7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIHJlc29sdmVQZW5kaW5nQ29tcG9uZW50c1dpdGhBc3luY01ldGFkYXRhKCkge1xuICAgIGlmICh0aGlzLnBlbmRpbmdDb21wb25lbnRzLnNpemUgPT09IDApIHJldHVybjtcblxuICAgIGNvbnN0IHByb21pc2VzID0gW107XG4gICAgZm9yIChjb25zdCBjb21wb25lbnQgb2YgdGhpcy5wZW5kaW5nQ29tcG9uZW50cykge1xuICAgICAgY29uc3QgYXN5bmNNZXRhZGF0YVByb21pc2UgPSBnZXRBc3luY0NsYXNzTWV0YWRhdGEoY29tcG9uZW50KTtcbiAgICAgIGlmIChhc3luY01ldGFkYXRhUHJvbWlzZSkge1xuICAgICAgICBwcm9taXNlcy5wdXNoKGFzeW5jTWV0YWRhdGFQcm9taXNlKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zdCByZXNvbHZlZERlcHMgPSBhd2FpdCBQcm9taXNlLmFsbChwcm9taXNlcyk7XG4gICAgdGhpcy5xdWV1ZVR5cGVzRnJvbU1vZHVsZXNBcnJheShyZXNvbHZlZERlcHMuZmxhdCgyKSk7XG4gIH1cblxuICBhc3luYyBjb21waWxlQ29tcG9uZW50cygpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0aGlzLmNsZWFyQ29tcG9uZW50UmVzb2x1dGlvblF1ZXVlKCk7XG5cbiAgICAvLyBXYWl0IGZvciBhbGwgYXN5bmMgbWV0YWRhdGEgZm9yIGNvbXBvbmVudHMgdGhhdCB3ZXJlXG4gICAgLy8gb3ZlcnJpZGRlbiwgd2UgbmVlZCByZXNvbHZlZCBtZXRhZGF0YSB0byBwZXJmb3JtIGFuIG92ZXJyaWRlXG4gICAgLy8gYW5kIHJlLWNvbXBpbGUgYSBjb21wb25lbnQuXG4gICAgYXdhaXQgdGhpcy5yZXNvbHZlUGVuZGluZ0NvbXBvbmVudHNXaXRoQXN5bmNNZXRhZGF0YSgpO1xuXG4gICAgLy8gVmVyaWZ5IHRoYXQgdGhlcmUgd2VyZSBubyBzdGFuZGFsb25lIGNvbXBvbmVudHMgcHJlc2VudCBpbiB0aGUgYGRlY2xhcmF0aW9uc2AgZmllbGRcbiAgICAvLyBkdXJpbmcgdGhlIGBUZXN0QmVkLmNvbmZpZ3VyZVRlc3RpbmdNb2R1bGVgIGNhbGwuIFdlIHBlcmZvcm0gdGhpcyBjaGVjayBoZXJlIGluIGFkZGl0aW9uXG4gICAgLy8gdG8gdGhlIGxvZ2ljIGluIHRoZSBgY29uZmlndXJlVGVzdGluZ01vZHVsZWAgZnVuY3Rpb24sIHNpbmNlIGF0IHRoaXMgcG9pbnQgd2UgaGF2ZVxuICAgIC8vIGFsbCBhc3luYyBtZXRhZGF0YSByZXNvbHZlZC5cbiAgICBhc3NlcnROb1N0YW5kYWxvbmVDb21wb25lbnRzKFxuICAgICAgICB0aGlzLmRlY2xhcmF0aW9ucywgdGhpcy5yZXNvbHZlcnMuY29tcG9uZW50LCAnXCJUZXN0QmVkLmNvbmZpZ3VyZVRlc3RpbmdNb2R1bGVcIiBjYWxsJyk7XG5cbiAgICAvLyBSdW4gY29tcGlsZXJzIGZvciBhbGwgcXVldWVkIHR5cGVzLlxuICAgIGxldCBuZWVkc0FzeW5jUmVzb3VyY2VzID0gdGhpcy5jb21waWxlVHlwZXNTeW5jKCk7XG5cbiAgICAvLyBjb21waWxlQ29tcG9uZW50cygpIHNob3VsZCBub3QgYmUgYXN5bmMgdW5sZXNzIGl0IG5lZWRzIHRvIGJlLlxuICAgIGlmIChuZWVkc0FzeW5jUmVzb3VyY2VzKSB7XG4gICAgICBsZXQgcmVzb3VyY2VMb2FkZXI6IFJlc291cmNlTG9hZGVyO1xuICAgICAgbGV0IHJlc29sdmVyID0gKHVybDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+ID0+IHtcbiAgICAgICAgaWYgKCFyZXNvdXJjZUxvYWRlcikge1xuICAgICAgICAgIHJlc291cmNlTG9hZGVyID0gdGhpcy5pbmplY3Rvci5nZXQoUmVzb3VyY2VMb2FkZXIpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUocmVzb3VyY2VMb2FkZXIuZ2V0KHVybCkpO1xuICAgICAgfTtcbiAgICAgIGF3YWl0IMm1cmVzb2x2ZUNvbXBvbmVudFJlc291cmNlcyhyZXNvbHZlcik7XG4gICAgfVxuICB9XG5cbiAgZmluYWxpemUoKTogTmdNb2R1bGVSZWY8YW55PiB7XG4gICAgLy8gT25lIGxhc3QgY29tcGlsZVxuICAgIHRoaXMuY29tcGlsZVR5cGVzU3luYygpO1xuXG4gICAgLy8gQ3JlYXRlIHRoZSB0ZXN0aW5nIG1vZHVsZSBpdHNlbGYuXG4gICAgdGhpcy5jb21waWxlVGVzdE1vZHVsZSgpO1xuXG4gICAgdGhpcy5hcHBseVRyYW5zaXRpdmVTY29wZXMoKTtcblxuICAgIHRoaXMuYXBwbHlQcm92aWRlck92ZXJyaWRlcygpO1xuXG4gICAgLy8gUGF0Y2ggcHJldmlvdXNseSBzdG9yZWQgYHN0eWxlc2AgQ29tcG9uZW50IHZhbHVlcyAodGFrZW4gZnJvbSDJtWNtcCksIGluIGNhc2UgdGhlc2VcbiAgICAvLyBDb21wb25lbnRzIGhhdmUgYHN0eWxlVXJsc2AgZmllbGRzIGRlZmluZWQgYW5kIHRlbXBsYXRlIG92ZXJyaWRlIHdhcyByZXF1ZXN0ZWQuXG4gICAgdGhpcy5wYXRjaENvbXBvbmVudHNXaXRoRXhpc3RpbmdTdHlsZXMoKTtcblxuICAgIC8vIENsZWFyIHRoZSBjb21wb25lbnRUb01vZHVsZVNjb3BlIG1hcCwgc28gdGhhdCBmdXR1cmUgY29tcGlsYXRpb25zIGRvbid0IHJlc2V0IHRoZSBzY29wZSBvZlxuICAgIC8vIGV2ZXJ5IGNvbXBvbmVudC5cbiAgICB0aGlzLmNvbXBvbmVudFRvTW9kdWxlU2NvcGUuY2xlYXIoKTtcblxuICAgIGNvbnN0IHBhcmVudEluamVjdG9yID0gdGhpcy5wbGF0Zm9ybS5pbmplY3RvcjtcbiAgICB0aGlzLnRlc3RNb2R1bGVSZWYgPSBuZXcgTmdNb2R1bGVSZWYodGhpcy50ZXN0TW9kdWxlVHlwZSwgcGFyZW50SW5qZWN0b3IsIFtdKTtcblxuICAgIC8vIEFwcGxpY2F0aW9uSW5pdFN0YXR1cy5ydW5Jbml0aWFsaXplcnMoKSBpcyBtYXJrZWQgQGludGVybmFsIHRvIGNvcmUuXG4gICAgLy8gQ2FzdCBpdCB0byBhbnkgYmVmb3JlIGFjY2Vzc2luZyBpdC5cbiAgICAodGhpcy50ZXN0TW9kdWxlUmVmLmluamVjdG9yLmdldChBcHBsaWNhdGlvbkluaXRTdGF0dXMpIGFzIGFueSkucnVuSW5pdGlhbGl6ZXJzKCk7XG5cbiAgICAvLyBTZXQgbG9jYWxlIElEIGFmdGVyIHJ1bm5pbmcgYXBwIGluaXRpYWxpemVycywgc2luY2UgbG9jYWxlIGluZm9ybWF0aW9uIG1pZ2h0IGJlIHVwZGF0ZWQgd2hpbGVcbiAgICAvLyBydW5uaW5nIGluaXRpYWxpemVycy4gVGhpcyBpcyBhbHNvIGNvbnNpc3RlbnQgd2l0aCB0aGUgZXhlY3V0aW9uIG9yZGVyIHdoaWxlIGJvb3RzdHJhcHBpbmcgYW5cbiAgICAvLyBhcHAgKHNlZSBgcGFja2FnZXMvY29yZS9zcmMvYXBwbGljYXRpb25fcmVmLnRzYCBmaWxlKS5cbiAgICBjb25zdCBsb2NhbGVJZCA9IHRoaXMudGVzdE1vZHVsZVJlZi5pbmplY3Rvci5nZXQoTE9DQUxFX0lELCBERUZBVUxUX0xPQ0FMRV9JRCk7XG4gICAgc2V0TG9jYWxlSWQobG9jYWxlSWQpO1xuXG4gICAgcmV0dXJuIHRoaXMudGVzdE1vZHVsZVJlZjtcbiAgfVxuXG4gIC8qKlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIF9jb21waWxlTmdNb2R1bGVTeW5jKG1vZHVsZVR5cGU6IFR5cGU8YW55Pik6IHZvaWQge1xuICAgIHRoaXMucXVldWVUeXBlc0Zyb21Nb2R1bGVzQXJyYXkoW21vZHVsZVR5cGVdKTtcbiAgICB0aGlzLmNvbXBpbGVUeXBlc1N5bmMoKTtcbiAgICB0aGlzLmFwcGx5UHJvdmlkZXJPdmVycmlkZXMoKTtcbiAgICB0aGlzLmFwcGx5UHJvdmlkZXJPdmVycmlkZXNJblNjb3BlKG1vZHVsZVR5cGUpO1xuICAgIHRoaXMuYXBwbHlUcmFuc2l0aXZlU2NvcGVzKCk7XG4gIH1cblxuICAvKipcbiAgICogQGludGVybmFsXG4gICAqL1xuICBhc3luYyBfY29tcGlsZU5nTW9kdWxlQXN5bmMobW9kdWxlVHlwZTogVHlwZTxhbnk+KTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdGhpcy5xdWV1ZVR5cGVzRnJvbU1vZHVsZXNBcnJheShbbW9kdWxlVHlwZV0pO1xuICAgIGF3YWl0IHRoaXMuY29tcGlsZUNvbXBvbmVudHMoKTtcbiAgICB0aGlzLmFwcGx5UHJvdmlkZXJPdmVycmlkZXMoKTtcbiAgICB0aGlzLmFwcGx5UHJvdmlkZXJPdmVycmlkZXNJblNjb3BlKG1vZHVsZVR5cGUpO1xuICAgIHRoaXMuYXBwbHlUcmFuc2l0aXZlU2NvcGVzKCk7XG4gIH1cblxuICAvKipcbiAgICogQGludGVybmFsXG4gICAqL1xuICBfZ2V0TW9kdWxlUmVzb2x2ZXIoKTogUmVzb2x2ZXI8TmdNb2R1bGU+IHtcbiAgICByZXR1cm4gdGhpcy5yZXNvbHZlcnMubW9kdWxlO1xuICB9XG5cbiAgLyoqXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgX2dldENvbXBvbmVudEZhY3Rvcmllcyhtb2R1bGVUeXBlOiBOZ01vZHVsZVR5cGUpOiBDb21wb25lbnRGYWN0b3J5PGFueT5bXSB7XG4gICAgcmV0dXJuIG1heWJlVW53cmFwRm4obW9kdWxlVHlwZS7JtW1vZC5kZWNsYXJhdGlvbnMpLnJlZHVjZSgoZmFjdG9yaWVzLCBkZWNsYXJhdGlvbikgPT4ge1xuICAgICAgY29uc3QgY29tcG9uZW50RGVmID0gKGRlY2xhcmF0aW9uIGFzIGFueSkuybVjbXA7XG4gICAgICBjb21wb25lbnREZWYgJiYgZmFjdG9yaWVzLnB1c2gobmV3IENvbXBvbmVudEZhY3RvcnkoY29tcG9uZW50RGVmLCB0aGlzLnRlc3RNb2R1bGVSZWYhKSk7XG4gICAgICByZXR1cm4gZmFjdG9yaWVzO1xuICAgIH0sIFtdIGFzIENvbXBvbmVudEZhY3Rvcnk8YW55PltdKTtcbiAgfVxuXG4gIHByaXZhdGUgY29tcGlsZVR5cGVzU3luYygpOiBib29sZWFuIHtcbiAgICAvLyBDb21waWxlIGFsbCBxdWV1ZWQgY29tcG9uZW50cywgZGlyZWN0aXZlcywgcGlwZXMuXG4gICAgbGV0IG5lZWRzQXN5bmNSZXNvdXJjZXMgPSBmYWxzZTtcbiAgICB0aGlzLnBlbmRpbmdDb21wb25lbnRzLmZvckVhY2goZGVjbGFyYXRpb24gPT4ge1xuICAgICAgaWYgKGdldEFzeW5jQ2xhc3NNZXRhZGF0YShkZWNsYXJhdGlvbikpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgICAgYENvbXBvbmVudCAnJHtkZWNsYXJhdGlvbi5uYW1lfScgaGFzIHVucmVzb2x2ZWQgbWV0YWRhdGEuIGAgK1xuICAgICAgICAgICAgYFBsZWFzZSBjYWxsIFxcYGF3YWl0IFRlc3RCZWQuY29tcGlsZUNvbXBvbmVudHMoKVxcYCBiZWZvcmUgcnVubmluZyB0aGlzIHRlc3QuYCk7XG4gICAgICB9XG5cbiAgICAgIG5lZWRzQXN5bmNSZXNvdXJjZXMgPSBuZWVkc0FzeW5jUmVzb3VyY2VzIHx8IMm1aXNDb21wb25lbnREZWZQZW5kaW5nUmVzb2x1dGlvbihkZWNsYXJhdGlvbik7XG5cbiAgICAgIGNvbnN0IG1ldGFkYXRhID0gdGhpcy5yZXNvbHZlcnMuY29tcG9uZW50LnJlc29sdmUoZGVjbGFyYXRpb24pO1xuICAgICAgaWYgKG1ldGFkYXRhID09PSBudWxsKSB7XG4gICAgICAgIHRocm93IGludmFsaWRUeXBlRXJyb3IoZGVjbGFyYXRpb24ubmFtZSwgJ0NvbXBvbmVudCcpO1xuICAgICAgfVxuXG4gICAgICB0aGlzLm1heWJlU3RvcmVOZ0RlZihOR19DT01QX0RFRiwgZGVjbGFyYXRpb24pO1xuICAgICAgY29tcGlsZUNvbXBvbmVudChkZWNsYXJhdGlvbiwgbWV0YWRhdGEpO1xuICAgIH0pO1xuICAgIHRoaXMucGVuZGluZ0NvbXBvbmVudHMuY2xlYXIoKTtcblxuICAgIHRoaXMucGVuZGluZ0RpcmVjdGl2ZXMuZm9yRWFjaChkZWNsYXJhdGlvbiA9PiB7XG4gICAgICBjb25zdCBtZXRhZGF0YSA9IHRoaXMucmVzb2x2ZXJzLmRpcmVjdGl2ZS5yZXNvbHZlKGRlY2xhcmF0aW9uKTtcbiAgICAgIGlmIChtZXRhZGF0YSA9PT0gbnVsbCkge1xuICAgICAgICB0aHJvdyBpbnZhbGlkVHlwZUVycm9yKGRlY2xhcmF0aW9uLm5hbWUsICdEaXJlY3RpdmUnKTtcbiAgICAgIH1cbiAgICAgIHRoaXMubWF5YmVTdG9yZU5nRGVmKE5HX0RJUl9ERUYsIGRlY2xhcmF0aW9uKTtcbiAgICAgIGNvbXBpbGVEaXJlY3RpdmUoZGVjbGFyYXRpb24sIG1ldGFkYXRhKTtcbiAgICB9KTtcbiAgICB0aGlzLnBlbmRpbmdEaXJlY3RpdmVzLmNsZWFyKCk7XG5cbiAgICB0aGlzLnBlbmRpbmdQaXBlcy5mb3JFYWNoKGRlY2xhcmF0aW9uID0+IHtcbiAgICAgIGNvbnN0IG1ldGFkYXRhID0gdGhpcy5yZXNvbHZlcnMucGlwZS5yZXNvbHZlKGRlY2xhcmF0aW9uKTtcbiAgICAgIGlmIChtZXRhZGF0YSA9PT0gbnVsbCkge1xuICAgICAgICB0aHJvdyBpbnZhbGlkVHlwZUVycm9yKGRlY2xhcmF0aW9uLm5hbWUsICdQaXBlJyk7XG4gICAgICB9XG4gICAgICB0aGlzLm1heWJlU3RvcmVOZ0RlZihOR19QSVBFX0RFRiwgZGVjbGFyYXRpb24pO1xuICAgICAgY29tcGlsZVBpcGUoZGVjbGFyYXRpb24sIG1ldGFkYXRhKTtcbiAgICB9KTtcbiAgICB0aGlzLnBlbmRpbmdQaXBlcy5jbGVhcigpO1xuXG4gICAgcmV0dXJuIG5lZWRzQXN5bmNSZXNvdXJjZXM7XG4gIH1cblxuICBwcml2YXRlIGFwcGx5VHJhbnNpdGl2ZVNjb3BlcygpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5vdmVycmlkZGVuTW9kdWxlcy5zaXplID4gMCkge1xuICAgICAgLy8gTW9kdWxlIG92ZXJyaWRlcyAodmlhIGBUZXN0QmVkLm92ZXJyaWRlTW9kdWxlYCkgbWlnaHQgYWZmZWN0IHNjb3BlcyB0aGF0IHdlcmUgcHJldmlvdXNseVxuICAgICAgLy8gY2FsY3VsYXRlZCBhbmQgc3RvcmVkIGluIGB0cmFuc2l0aXZlQ29tcGlsZVNjb3Blc2AuIElmIG1vZHVsZSBvdmVycmlkZXMgYXJlIHByZXNlbnQsXG4gICAgICAvLyBjb2xsZWN0IGFsbCBhZmZlY3RlZCBtb2R1bGVzIGFuZCByZXNldCBzY29wZXMgdG8gZm9yY2UgdGhlaXIgcmUtY2FsY3VsYXRpb24uXG4gICAgICBjb25zdCB0ZXN0aW5nTW9kdWxlRGVmID0gKHRoaXMudGVzdE1vZHVsZVR5cGUgYXMgYW55KVtOR19NT0RfREVGXTtcbiAgICAgIGNvbnN0IGFmZmVjdGVkTW9kdWxlcyA9IHRoaXMuY29sbGVjdE1vZHVsZXNBZmZlY3RlZEJ5T3ZlcnJpZGVzKHRlc3RpbmdNb2R1bGVEZWYuaW1wb3J0cyk7XG4gICAgICBpZiAoYWZmZWN0ZWRNb2R1bGVzLnNpemUgPiAwKSB7XG4gICAgICAgIGFmZmVjdGVkTW9kdWxlcy5mb3JFYWNoKG1vZHVsZVR5cGUgPT4ge1xuICAgICAgICAgIGlmICghVVNFX1JVTlRJTUVfREVQU19UUkFDS0VSX0ZPUl9KSVQpIHtcbiAgICAgICAgICAgIHRoaXMuc3RvcmVGaWVsZE9mRGVmT25UeXBlKG1vZHVsZVR5cGUgYXMgYW55LCBOR19NT0RfREVGLCAndHJhbnNpdGl2ZUNvbXBpbGVTY29wZXMnKTtcbiAgICAgICAgICAgIChtb2R1bGVUeXBlIGFzIGFueSlbTkdfTU9EX0RFRl0udHJhbnNpdGl2ZUNvbXBpbGVTY29wZXMgPSBudWxsO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBkZXBzVHJhY2tlci5jbGVhclNjb3BlQ2FjaGVGb3IobW9kdWxlVHlwZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zdCBtb2R1bGVUb1Njb3BlID0gbmV3IE1hcDxUeXBlPGFueT58VGVzdGluZ01vZHVsZU92ZXJyaWRlLCBOZ01vZHVsZVRyYW5zaXRpdmVTY29wZXM+KCk7XG4gICAgY29uc3QgZ2V0U2NvcGVPZk1vZHVsZSA9XG4gICAgICAgIChtb2R1bGVUeXBlOiBUeXBlPGFueT58VGVzdGluZ01vZHVsZU92ZXJyaWRlKTogTmdNb2R1bGVUcmFuc2l0aXZlU2NvcGVzID0+IHtcbiAgICAgICAgICBpZiAoIW1vZHVsZVRvU2NvcGUuaGFzKG1vZHVsZVR5cGUpKSB7XG4gICAgICAgICAgICBjb25zdCBpc1Rlc3RpbmdNb2R1bGUgPSBpc1Rlc3RpbmdNb2R1bGVPdmVycmlkZShtb2R1bGVUeXBlKTtcbiAgICAgICAgICAgIGNvbnN0IHJlYWxUeXBlID0gaXNUZXN0aW5nTW9kdWxlID8gdGhpcy50ZXN0TW9kdWxlVHlwZSA6IG1vZHVsZVR5cGUgYXMgVHlwZTxhbnk+O1xuICAgICAgICAgICAgbW9kdWxlVG9TY29wZS5zZXQobW9kdWxlVHlwZSwgdHJhbnNpdGl2ZVNjb3Blc0ZvcihyZWFsVHlwZSkpO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gbW9kdWxlVG9TY29wZS5nZXQobW9kdWxlVHlwZSkhO1xuICAgICAgICB9O1xuXG4gICAgdGhpcy5jb21wb25lbnRUb01vZHVsZVNjb3BlLmZvckVhY2goKG1vZHVsZVR5cGUsIGNvbXBvbmVudFR5cGUpID0+IHtcbiAgICAgIGNvbnN0IG1vZHVsZVNjb3BlID0gZ2V0U2NvcGVPZk1vZHVsZShtb2R1bGVUeXBlKTtcbiAgICAgIHRoaXMuc3RvcmVGaWVsZE9mRGVmT25UeXBlKGNvbXBvbmVudFR5cGUsIE5HX0NPTVBfREVGLCAnZGlyZWN0aXZlRGVmcycpO1xuICAgICAgdGhpcy5zdG9yZUZpZWxkT2ZEZWZPblR5cGUoY29tcG9uZW50VHlwZSwgTkdfQ09NUF9ERUYsICdwaXBlRGVmcycpO1xuICAgICAgLy8gYHRWaWV3YCB0aGF0IGlzIHN0b3JlZCBvbiBjb21wb25lbnQgZGVmIGNvbnRhaW5zIGluZm9ybWF0aW9uIGFib3V0IGRpcmVjdGl2ZXMgYW5kIHBpcGVzXG4gICAgICAvLyB0aGF0IGFyZSBpbiB0aGUgc2NvcGUgb2YgdGhpcyBjb21wb25lbnQuIFBhdGNoaW5nIGNvbXBvbmVudCBzY29wZSB3aWxsIGNhdXNlIGB0Vmlld2AgdG8gYmVcbiAgICAgIC8vIGNoYW5nZWQuIFN0b3JlIG9yaWdpbmFsIGB0Vmlld2AgYmVmb3JlIHBhdGNoaW5nIHNjb3BlLCBzbyB0aGUgYHRWaWV3YCAoaW5jbHVkaW5nIHNjb3BlXG4gICAgICAvLyBpbmZvcm1hdGlvbikgaXMgcmVzdG9yZWQgYmFjayB0byBpdHMgcHJldmlvdXMvb3JpZ2luYWwgc3RhdGUgYmVmb3JlIHJ1bm5pbmcgbmV4dCB0ZXN0LlxuICAgICAgdGhpcy5zdG9yZUZpZWxkT2ZEZWZPblR5cGUoY29tcG9uZW50VHlwZSwgTkdfQ09NUF9ERUYsICd0VmlldycpO1xuICAgICAgcGF0Y2hDb21wb25lbnREZWZXaXRoU2NvcGUoKGNvbXBvbmVudFR5cGUgYXMgYW55KS7JtWNtcCwgbW9kdWxlU2NvcGUpO1xuICAgIH0pO1xuXG4gICAgdGhpcy5jb21wb25lbnRUb01vZHVsZVNjb3BlLmNsZWFyKCk7XG4gIH1cblxuICBwcml2YXRlIGFwcGx5UHJvdmlkZXJPdmVycmlkZXMoKTogdm9pZCB7XG4gICAgY29uc3QgbWF5YmVBcHBseU92ZXJyaWRlcyA9IChmaWVsZDogc3RyaW5nKSA9PiAodHlwZTogVHlwZTxhbnk+KSA9PiB7XG4gICAgICBjb25zdCByZXNvbHZlciA9IGZpZWxkID09PSBOR19DT01QX0RFRiA/IHRoaXMucmVzb2x2ZXJzLmNvbXBvbmVudCA6IHRoaXMucmVzb2x2ZXJzLmRpcmVjdGl2ZTtcbiAgICAgIGNvbnN0IG1ldGFkYXRhID0gcmVzb2x2ZXIucmVzb2x2ZSh0eXBlKSE7XG4gICAgICBpZiAodGhpcy5oYXNQcm92aWRlck92ZXJyaWRlcyhtZXRhZGF0YS5wcm92aWRlcnMpKSB7XG4gICAgICAgIHRoaXMucGF0Y2hEZWZXaXRoUHJvdmlkZXJPdmVycmlkZXModHlwZSwgZmllbGQpO1xuICAgICAgfVxuICAgIH07XG4gICAgdGhpcy5zZWVuQ29tcG9uZW50cy5mb3JFYWNoKG1heWJlQXBwbHlPdmVycmlkZXMoTkdfQ09NUF9ERUYpKTtcbiAgICB0aGlzLnNlZW5EaXJlY3RpdmVzLmZvckVhY2gobWF5YmVBcHBseU92ZXJyaWRlcyhOR19ESVJfREVGKSk7XG5cbiAgICB0aGlzLnNlZW5Db21wb25lbnRzLmNsZWFyKCk7XG4gICAgdGhpcy5zZWVuRGlyZWN0aXZlcy5jbGVhcigpO1xuICB9XG5cblxuICAvKipcbiAgICogQXBwbGllcyBwcm92aWRlciBvdmVycmlkZXMgdG8gYSBnaXZlbiB0eXBlIChlaXRoZXIgYW4gTmdNb2R1bGUgb3IgYSBzdGFuZGFsb25lIGNvbXBvbmVudClcbiAgICogYW5kIGFsbCBpbXBvcnRlZCBOZ01vZHVsZXMgYW5kIHN0YW5kYWxvbmUgY29tcG9uZW50cyByZWN1cnNpdmVseS5cbiAgICovXG4gIHByaXZhdGUgYXBwbHlQcm92aWRlck92ZXJyaWRlc0luU2NvcGUodHlwZTogVHlwZTxhbnk+KTogdm9pZCB7XG4gICAgY29uc3QgaGFzU2NvcGUgPSBpc1N0YW5kYWxvbmVDb21wb25lbnQodHlwZSkgfHwgaXNOZ01vZHVsZSh0eXBlKTtcblxuICAgIC8vIFRoZSBmdW5jdGlvbiBjYW4gYmUgcmUtZW50ZXJlZCByZWN1cnNpdmVseSB3aGlsZSBpbnNwZWN0aW5nIGRlcGVuZGVuY2llc1xuICAgIC8vIG9mIGFuIE5nTW9kdWxlIG9yIGEgc3RhbmRhbG9uZSBjb21wb25lbnQuIEV4aXQgZWFybHkgaWYgd2UgY29tZSBhY3Jvc3MgYVxuICAgIC8vIHR5cGUgdGhhdCBjYW4gbm90IGhhdmUgYSBzY29wZSAoZGlyZWN0aXZlIG9yIHBpcGUpIG9yIHRoZSB0eXBlIGlzIGFscmVhZHlcbiAgICAvLyBwcm9jZXNzZWQgZWFybGllci5cbiAgICBpZiAoIWhhc1Njb3BlIHx8IHRoaXMuc2NvcGVzV2l0aE92ZXJyaWRkZW5Qcm92aWRlcnMuaGFzKHR5cGUpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRoaXMuc2NvcGVzV2l0aE92ZXJyaWRkZW5Qcm92aWRlcnMuYWRkKHR5cGUpO1xuXG4gICAgLy8gTk9URTogdGhlIGxpbmUgYmVsb3cgdHJpZ2dlcnMgSklUIGNvbXBpbGF0aW9uIG9mIHRoZSBtb2R1bGUgaW5qZWN0b3IsXG4gICAgLy8gd2hpY2ggYWxzbyBpbnZva2VzIHZlcmlmaWNhdGlvbiBvZiB0aGUgTmdNb2R1bGUgc2VtYW50aWNzLCB3aGljaCBwcm9kdWNlc1xuICAgIC8vIGRldGFpbGVkIGVycm9yIG1lc3NhZ2VzLiBUaGUgZmFjdCB0aGF0IHRoZSBjb2RlIHJlbGllcyBvbiB0aGlzIGxpbmUgYmVpbmdcbiAgICAvLyBwcmVzZW50IGhlcmUgaXMgc3VzcGljaW91cyBhbmQgc2hvdWxkIGJlIHJlZmFjdG9yZWQgaW4gYSB3YXkgdGhhdCB0aGUgbGluZVxuICAgIC8vIGJlbG93IGNhbiBiZSBtb3ZlZCAoZm9yIGV4LiBhZnRlciBhbiBlYXJseSBleGl0IGNoZWNrIGJlbG93KS5cbiAgICBjb25zdCBpbmplY3RvckRlZjogYW55ID0gKHR5cGUgYXMgYW55KVtOR19JTkpfREVGXTtcblxuICAgIC8vIE5vIHByb3ZpZGVyIG92ZXJyaWRlcywgZXhpdCBlYXJseS5cbiAgICBpZiAodGhpcy5wcm92aWRlck92ZXJyaWRlc0J5VG9rZW4uc2l6ZSA9PT0gMCkgcmV0dXJuO1xuXG4gICAgaWYgKGlzU3RhbmRhbG9uZUNvbXBvbmVudCh0eXBlKSkge1xuICAgICAgLy8gVmlzaXQgYWxsIGNvbXBvbmVudCBkZXBlbmRlbmNpZXMgYW5kIG92ZXJyaWRlIHByb3ZpZGVycyB0aGVyZS5cbiAgICAgIGNvbnN0IGRlZiA9IGdldENvbXBvbmVudERlZih0eXBlKTtcbiAgICAgIGNvbnN0IGRlcGVuZGVuY2llcyA9IG1heWJlVW53cmFwRm4oZGVmLmRlcGVuZGVuY2llcyA/PyBbXSk7XG4gICAgICBmb3IgKGNvbnN0IGRlcGVuZGVuY3kgb2YgZGVwZW5kZW5jaWVzKSB7XG4gICAgICAgIHRoaXMuYXBwbHlQcm92aWRlck92ZXJyaWRlc0luU2NvcGUoZGVwZW5kZW5jeSk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IHByb3ZpZGVyczogQXJyYXk8UHJvdmlkZXJ8SW50ZXJuYWxFbnZpcm9ubWVudFByb3ZpZGVycz4gPSBbXG4gICAgICAgIC4uLmluamVjdG9yRGVmLnByb3ZpZGVycyxcbiAgICAgICAgLi4uKHRoaXMucHJvdmlkZXJPdmVycmlkZXNCeU1vZHVsZS5nZXQodHlwZSBhcyBJbmplY3RvclR5cGU8YW55PikgfHwgW10pXG4gICAgICBdO1xuICAgICAgaWYgKHRoaXMuaGFzUHJvdmlkZXJPdmVycmlkZXMocHJvdmlkZXJzKSkge1xuICAgICAgICB0aGlzLm1heWJlU3RvcmVOZ0RlZihOR19JTkpfREVGLCB0eXBlKTtcblxuICAgICAgICB0aGlzLnN0b3JlRmllbGRPZkRlZk9uVHlwZSh0eXBlLCBOR19JTkpfREVGLCAncHJvdmlkZXJzJyk7XG4gICAgICAgIGluamVjdG9yRGVmLnByb3ZpZGVycyA9IHRoaXMuZ2V0T3ZlcnJpZGRlblByb3ZpZGVycyhwcm92aWRlcnMpO1xuICAgICAgfVxuXG4gICAgICAvLyBBcHBseSBwcm92aWRlciBvdmVycmlkZXMgdG8gaW1wb3J0ZWQgbW9kdWxlcyByZWN1cnNpdmVseVxuICAgICAgY29uc3QgbW9kdWxlRGVmID0gKHR5cGUgYXMgYW55KVtOR19NT0RfREVGXTtcbiAgICAgIGNvbnN0IGltcG9ydHMgPSBtYXliZVVud3JhcEZuKG1vZHVsZURlZi5pbXBvcnRzKTtcbiAgICAgIGZvciAoY29uc3QgaW1wb3J0ZWRNb2R1bGUgb2YgaW1wb3J0cykge1xuICAgICAgICB0aGlzLmFwcGx5UHJvdmlkZXJPdmVycmlkZXNJblNjb3BlKGltcG9ydGVkTW9kdWxlKTtcbiAgICAgIH1cbiAgICAgIC8vIEFsc28gb3ZlcnJpZGUgdGhlIHByb3ZpZGVycyBvbiBhbnkgTW9kdWxlV2l0aFByb3ZpZGVycyBpbXBvcnRzIHNpbmNlIHRob3NlIGRvbid0IGFwcGVhciBpblxuICAgICAgLy8gdGhlIG1vZHVsZURlZi5cbiAgICAgIGZvciAoY29uc3QgaW1wb3J0ZWRNb2R1bGUgb2YgZmxhdHRlbihpbmplY3RvckRlZi5pbXBvcnRzKSkge1xuICAgICAgICBpZiAoaXNNb2R1bGVXaXRoUHJvdmlkZXJzKGltcG9ydGVkTW9kdWxlKSkge1xuICAgICAgICAgIHRoaXMuZGVmQ2xlYW51cE9wcy5wdXNoKHtcbiAgICAgICAgICAgIG9iamVjdDogaW1wb3J0ZWRNb2R1bGUsXG4gICAgICAgICAgICBmaWVsZE5hbWU6ICdwcm92aWRlcnMnLFxuICAgICAgICAgICAgb3JpZ2luYWxWYWx1ZTogaW1wb3J0ZWRNb2R1bGUucHJvdmlkZXJzXG4gICAgICAgICAgfSk7XG4gICAgICAgICAgaW1wb3J0ZWRNb2R1bGUucHJvdmlkZXJzID0gdGhpcy5nZXRPdmVycmlkZGVuUHJvdmlkZXJzKFxuICAgICAgICAgICAgICBpbXBvcnRlZE1vZHVsZS5wcm92aWRlcnMgYXMgQXJyYXk8UHJvdmlkZXJ8SW50ZXJuYWxFbnZpcm9ubWVudFByb3ZpZGVycz4pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBwYXRjaENvbXBvbmVudHNXaXRoRXhpc3RpbmdTdHlsZXMoKTogdm9pZCB7XG4gICAgdGhpcy5leGlzdGluZ0NvbXBvbmVudFN0eWxlcy5mb3JFYWNoKFxuICAgICAgICAoc3R5bGVzLCB0eXBlKSA9PiAodHlwZSBhcyBhbnkpW05HX0NPTVBfREVGXS5zdHlsZXMgPSBzdHlsZXMpO1xuICAgIHRoaXMuZXhpc3RpbmdDb21wb25lbnRTdHlsZXMuY2xlYXIoKTtcbiAgfVxuXG4gIHByaXZhdGUgcXVldWVUeXBlQXJyYXkoYXJyOiBhbnlbXSwgbW9kdWxlVHlwZTogVHlwZTxhbnk+fFRlc3RpbmdNb2R1bGVPdmVycmlkZSk6IHZvaWQge1xuICAgIGZvciAoY29uc3QgdmFsdWUgb2YgYXJyKSB7XG4gICAgICBpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHtcbiAgICAgICAgdGhpcy5xdWV1ZVR5cGVBcnJheSh2YWx1ZSwgbW9kdWxlVHlwZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLnF1ZXVlVHlwZSh2YWx1ZSwgbW9kdWxlVHlwZSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSByZWNvbXBpbGVOZ01vZHVsZShuZ01vZHVsZTogVHlwZTxhbnk+LCBtZXRhZGF0YTogTmdNb2R1bGUpOiB2b2lkIHtcbiAgICAvLyBDYWNoZSB0aGUgaW5pdGlhbCBuZ01vZHVsZURlZiBhcyBpdCB3aWxsIGJlIG92ZXJ3cml0dGVuLlxuICAgIHRoaXMubWF5YmVTdG9yZU5nRGVmKE5HX01PRF9ERUYsIG5nTW9kdWxlKTtcbiAgICB0aGlzLm1heWJlU3RvcmVOZ0RlZihOR19JTkpfREVGLCBuZ01vZHVsZSk7XG5cbiAgICBjb21waWxlTmdNb2R1bGVEZWZzKG5nTW9kdWxlIGFzIE5nTW9kdWxlVHlwZTxhbnk+LCBtZXRhZGF0YSk7XG4gIH1cblxuICBwcml2YXRlIHF1ZXVlVHlwZSh0eXBlOiBUeXBlPGFueT4sIG1vZHVsZVR5cGU6IFR5cGU8YW55PnxUZXN0aW5nTW9kdWxlT3ZlcnJpZGV8bnVsbCk6IHZvaWQge1xuICAgIGNvbnN0IGNvbXBvbmVudCA9IHRoaXMucmVzb2x2ZXJzLmNvbXBvbmVudC5yZXNvbHZlKHR5cGUpO1xuICAgIGlmIChjb21wb25lbnQpIHtcbiAgICAgIC8vIENoZWNrIHdoZXRoZXIgYSBnaXZlIFR5cGUgaGFzIHJlc3BlY3RpdmUgTkcgZGVmICjJtWNtcCkgYW5kIGNvbXBpbGUgaWYgZGVmIGlzXG4gICAgICAvLyBtaXNzaW5nLiBUaGF0IG1pZ2h0IGhhcHBlbiBpbiBjYXNlIGEgY2xhc3Mgd2l0aG91dCBhbnkgQW5ndWxhciBkZWNvcmF0b3JzIGV4dGVuZHMgYW5vdGhlclxuICAgICAgLy8gY2xhc3Mgd2hlcmUgQ29tcG9uZW50L0RpcmVjdGl2ZS9QaXBlIGRlY29yYXRvciBpcyBkZWZpbmVkLlxuICAgICAgaWYgKMm1aXNDb21wb25lbnREZWZQZW5kaW5nUmVzb2x1dGlvbih0eXBlKSB8fCAhdHlwZS5oYXNPd25Qcm9wZXJ0eShOR19DT01QX0RFRikpIHtcbiAgICAgICAgdGhpcy5wZW5kaW5nQ29tcG9uZW50cy5hZGQodHlwZSk7XG4gICAgICB9XG4gICAgICB0aGlzLnNlZW5Db21wb25lbnRzLmFkZCh0eXBlKTtcblxuICAgICAgLy8gS2VlcCB0cmFjayBvZiB0aGUgbW9kdWxlIHdoaWNoIGRlY2xhcmVzIHRoaXMgY29tcG9uZW50LCBzbyBsYXRlciB0aGUgY29tcG9uZW50J3Mgc2NvcGVcbiAgICAgIC8vIGNhbiBiZSBzZXQgY29ycmVjdGx5LiBJZiB0aGUgY29tcG9uZW50IGhhcyBhbHJlYWR5IGJlZW4gcmVjb3JkZWQgaGVyZSwgdGhlbiBvbmUgb2Ygc2V2ZXJhbFxuICAgICAgLy8gY2FzZXMgaXMgdHJ1ZTpcbiAgICAgIC8vICogdGhlIG1vZHVsZSBjb250YWluaW5nIHRoZSBjb21wb25lbnQgd2FzIGltcG9ydGVkIG11bHRpcGxlIHRpbWVzIChjb21tb24pLlxuICAgICAgLy8gKiB0aGUgY29tcG9uZW50IGlzIGRlY2xhcmVkIGluIG11bHRpcGxlIG1vZHVsZXMgKHdoaWNoIGlzIGFuIGVycm9yKS5cbiAgICAgIC8vICogdGhlIGNvbXBvbmVudCB3YXMgaW4gJ2RlY2xhcmF0aW9ucycgb2YgdGhlIHRlc3RpbmcgbW9kdWxlLCBhbmQgYWxzbyBpbiBhbiBpbXBvcnRlZCBtb2R1bGVcbiAgICAgIC8vICAgaW4gd2hpY2ggY2FzZSB0aGUgbW9kdWxlIHNjb3BlIHdpbGwgYmUgVGVzdGluZ01vZHVsZU92ZXJyaWRlLkRFQ0xBUkFUSU9OLlxuICAgICAgLy8gKiBvdmVycmlkZVRlbXBsYXRlVXNpbmdUZXN0aW5nTW9kdWxlIHdhcyBjYWxsZWQgZm9yIHRoZSBjb21wb25lbnQgaW4gd2hpY2ggY2FzZSB0aGUgbW9kdWxlXG4gICAgICAvLyAgIHNjb3BlIHdpbGwgYmUgVGVzdGluZ01vZHVsZU92ZXJyaWRlLk9WRVJSSURFX1RFTVBMQVRFLlxuICAgICAgLy9cbiAgICAgIC8vIElmIHRoZSBjb21wb25lbnQgd2FzIHByZXZpb3VzbHkgaW4gdGhlIHRlc3RpbmcgbW9kdWxlJ3MgJ2RlY2xhcmF0aW9ucycgKG1lYW5pbmcgdGhlXG4gICAgICAvLyBjdXJyZW50IHZhbHVlIGlzIFRlc3RpbmdNb2R1bGVPdmVycmlkZS5ERUNMQVJBVElPTiksIHRoZW4gYG1vZHVsZVR5cGVgIGlzIHRoZSBjb21wb25lbnQnc1xuICAgICAgLy8gcmVhbCBtb2R1bGUsIHdoaWNoIHdhcyBpbXBvcnRlZC4gVGhpcyBwYXR0ZXJuIGlzIHVuZGVyc3Rvb2QgdG8gbWVhbiB0aGF0IHRoZSBjb21wb25lbnRcbiAgICAgIC8vIHNob3VsZCB1c2UgaXRzIG9yaWdpbmFsIHNjb3BlLCBidXQgdGhhdCB0aGUgdGVzdGluZyBtb2R1bGUgc2hvdWxkIGFsc28gY29udGFpbiB0aGVcbiAgICAgIC8vIGNvbXBvbmVudCBpbiBpdHMgc2NvcGUuXG4gICAgICAvL1xuICAgICAgLy8gTm90ZTogc3RhbmRhbG9uZSBjb21wb25lbnRzIGhhdmUgbm8gYXNzb2NpYXRlZCBOZ01vZHVsZSwgc28gdGhlIGBtb2R1bGVUeXBlYCBjYW4gYmUgYG51bGxgLlxuICAgICAgaWYgKG1vZHVsZVR5cGUgIT09IG51bGwgJiZcbiAgICAgICAgICAoIXRoaXMuY29tcG9uZW50VG9Nb2R1bGVTY29wZS5oYXModHlwZSkgfHxcbiAgICAgICAgICAgdGhpcy5jb21wb25lbnRUb01vZHVsZVNjb3BlLmdldCh0eXBlKSA9PT0gVGVzdGluZ01vZHVsZU92ZXJyaWRlLkRFQ0xBUkFUSU9OKSkge1xuICAgICAgICB0aGlzLmNvbXBvbmVudFRvTW9kdWxlU2NvcGUuc2V0KHR5cGUsIG1vZHVsZVR5cGUpO1xuICAgICAgfVxuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGRpcmVjdGl2ZSA9IHRoaXMucmVzb2x2ZXJzLmRpcmVjdGl2ZS5yZXNvbHZlKHR5cGUpO1xuICAgIGlmIChkaXJlY3RpdmUpIHtcbiAgICAgIGlmICghdHlwZS5oYXNPd25Qcm9wZXJ0eShOR19ESVJfREVGKSkge1xuICAgICAgICB0aGlzLnBlbmRpbmdEaXJlY3RpdmVzLmFkZCh0eXBlKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuc2VlbkRpcmVjdGl2ZXMuYWRkKHR5cGUpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHBpcGUgPSB0aGlzLnJlc29sdmVycy5waXBlLnJlc29sdmUodHlwZSk7XG4gICAgaWYgKHBpcGUgJiYgIXR5cGUuaGFzT3duUHJvcGVydHkoTkdfUElQRV9ERUYpKSB7XG4gICAgICB0aGlzLnBlbmRpbmdQaXBlcy5hZGQodHlwZSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBxdWV1ZVR5cGVzRnJvbU1vZHVsZXNBcnJheShhcnI6IGFueVtdKTogdm9pZCB7XG4gICAgLy8gQmVjYXVzZSB3ZSBtYXkgZW5jb3VudGVyIHRoZSBzYW1lIE5nTW9kdWxlIG9yIGEgc3RhbmRhbG9uZSBDb21wb25lbnQgd2hpbGUgcHJvY2Vzc2luZ1xuICAgIC8vIHRoZSBkZXBlbmRlbmNpZXMgb2YgYW4gTmdNb2R1bGUgb3IgYSBzdGFuZGFsb25lIENvbXBvbmVudCwgd2UgY2FjaGUgdGhlbSBpbiB0aGlzIHNldCBzbyB3ZVxuICAgIC8vIGNhbiBza2lwIG9uZXMgdGhhdCBoYXZlIGFscmVhZHkgYmVlbiBzZWVuIGVuY291bnRlcmVkLiBJbiBzb21lIHRlc3Qgc2V0dXBzLCB0aGlzIGNhY2hpbmdcbiAgICAvLyByZXN1bHRlZCBpbiAxMFggcnVudGltZSBpbXByb3ZlbWVudC5cbiAgICBjb25zdCBwcm9jZXNzZWREZWZzID0gbmV3IFNldCgpO1xuICAgIGNvbnN0IHF1ZXVlVHlwZXNGcm9tTW9kdWxlc0FycmF5UmVjdXIgPSAoYXJyOiBhbnlbXSk6IHZvaWQgPT4ge1xuICAgICAgZm9yIChjb25zdCB2YWx1ZSBvZiBhcnIpIHtcbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkodmFsdWUpKSB7XG4gICAgICAgICAgcXVldWVUeXBlc0Zyb21Nb2R1bGVzQXJyYXlSZWN1cih2YWx1ZSk7XG4gICAgICAgIH0gZWxzZSBpZiAoaGFzTmdNb2R1bGVEZWYodmFsdWUpKSB7XG4gICAgICAgICAgY29uc3QgZGVmID0gdmFsdWUuybVtb2Q7XG4gICAgICAgICAgaWYgKHByb2Nlc3NlZERlZnMuaGFzKGRlZikpIHtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgICBwcm9jZXNzZWREZWZzLmFkZChkZWYpO1xuICAgICAgICAgIC8vIExvb2sgdGhyb3VnaCBkZWNsYXJhdGlvbnMsIGltcG9ydHMsIGFuZCBleHBvcnRzLCBhbmQgcXVldWVcbiAgICAgICAgICAvLyBldmVyeXRoaW5nIGZvdW5kIHRoZXJlLlxuICAgICAgICAgIHRoaXMucXVldWVUeXBlQXJyYXkobWF5YmVVbndyYXBGbihkZWYuZGVjbGFyYXRpb25zKSwgdmFsdWUpO1xuICAgICAgICAgIHF1ZXVlVHlwZXNGcm9tTW9kdWxlc0FycmF5UmVjdXIobWF5YmVVbndyYXBGbihkZWYuaW1wb3J0cykpO1xuICAgICAgICAgIHF1ZXVlVHlwZXNGcm9tTW9kdWxlc0FycmF5UmVjdXIobWF5YmVVbndyYXBGbihkZWYuZXhwb3J0cykpO1xuICAgICAgICB9IGVsc2UgaWYgKGlzTW9kdWxlV2l0aFByb3ZpZGVycyh2YWx1ZSkpIHtcbiAgICAgICAgICBxdWV1ZVR5cGVzRnJvbU1vZHVsZXNBcnJheVJlY3VyKFt2YWx1ZS5uZ01vZHVsZV0pO1xuICAgICAgICB9IGVsc2UgaWYgKGlzU3RhbmRhbG9uZUNvbXBvbmVudCh2YWx1ZSkpIHtcbiAgICAgICAgICB0aGlzLnF1ZXVlVHlwZSh2YWx1ZSwgbnVsbCk7XG4gICAgICAgICAgY29uc3QgZGVmID0gZ2V0Q29tcG9uZW50RGVmKHZhbHVlKTtcblxuICAgICAgICAgIGlmIChwcm9jZXNzZWREZWZzLmhhcyhkZWYpKSB7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcHJvY2Vzc2VkRGVmcy5hZGQoZGVmKTtcblxuICAgICAgICAgIGNvbnN0IGRlcGVuZGVuY2llcyA9IG1heWJlVW53cmFwRm4oZGVmLmRlcGVuZGVuY2llcyA/PyBbXSk7XG4gICAgICAgICAgZGVwZW5kZW5jaWVzLmZvckVhY2goKGRlcGVuZGVuY3kpID0+IHtcbiAgICAgICAgICAgIC8vIE5vdGU6IGluIEFPVCwgdGhlIGBkZXBlbmRlbmNpZXNgIG1pZ2h0IGFsc28gY29udGFpbiByZWd1bGFyXG4gICAgICAgICAgICAvLyAoTmdNb2R1bGUtYmFzZWQpIENvbXBvbmVudCwgRGlyZWN0aXZlIGFuZCBQaXBlcywgc28gd2UgaGFuZGxlXG4gICAgICAgICAgICAvLyB0aGVtIHNlcGFyYXRlbHkgYW5kIHByb2NlZWQgd2l0aCByZWN1cnNpdmUgcHJvY2VzcyBmb3Igc3RhbmRhbG9uZVxuICAgICAgICAgICAgLy8gQ29tcG9uZW50cyBhbmQgTmdNb2R1bGVzIG9ubHkuXG4gICAgICAgICAgICBpZiAoaXNTdGFuZGFsb25lQ29tcG9uZW50KGRlcGVuZGVuY3kpIHx8IGhhc05nTW9kdWxlRGVmKGRlcGVuZGVuY3kpKSB7XG4gICAgICAgICAgICAgIHF1ZXVlVHlwZXNGcm9tTW9kdWxlc0FycmF5UmVjdXIoW2RlcGVuZGVuY3ldKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHRoaXMucXVldWVUeXBlKGRlcGVuZGVuY3ksIG51bGwpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfTtcbiAgICBxdWV1ZVR5cGVzRnJvbU1vZHVsZXNBcnJheVJlY3VyKGFycik7XG4gIH1cblxuICAvLyBXaGVuIG1vZHVsZSBvdmVycmlkZXMgKHZpYSBgVGVzdEJlZC5vdmVycmlkZU1vZHVsZWApIGFyZSBwcmVzZW50LCBpdCBtaWdodCBhZmZlY3QgYWxsIG1vZHVsZXNcbiAgLy8gdGhhdCBpbXBvcnQgKGV2ZW4gdHJhbnNpdGl2ZWx5KSBhbiBvdmVycmlkZGVuIG9uZS4gRm9yIGFsbCBhZmZlY3RlZCBtb2R1bGVzIHdlIG5lZWQgdG9cbiAgLy8gcmVjYWxjdWxhdGUgdGhlaXIgc2NvcGVzIGZvciBhIGdpdmVuIHRlc3QgcnVuIGFuZCByZXN0b3JlIG9yaWdpbmFsIHNjb3BlcyBhdCB0aGUgZW5kLiBUaGUgZ29hbFxuICAvLyBvZiB0aGlzIGZ1bmN0aW9uIGlzIHRvIGNvbGxlY3QgYWxsIGFmZmVjdGVkIG1vZHVsZXMgaW4gYSBzZXQgZm9yIGZ1cnRoZXIgcHJvY2Vzc2luZy4gRXhhbXBsZTpcbiAgLy8gaWYgd2UgaGF2ZSB0aGUgZm9sbG93aW5nIG1vZHVsZSBoaWVyYXJjaHk6IEEgLT4gQiAtPiBDICh3aGVyZSBgLT5gIG1lYW5zIGBpbXBvcnRzYCkgYW5kIG1vZHVsZVxuICAvLyBgQ2AgaXMgb3ZlcnJpZGRlbiwgd2UgY29uc2lkZXIgYEFgIGFuZCBgQmAgYXMgYWZmZWN0ZWQsIHNpbmNlIHRoZWlyIHNjb3BlcyBtaWdodCBiZWNvbWVcbiAgLy8gaW52YWxpZGF0ZWQgd2l0aCB0aGUgb3ZlcnJpZGUuXG4gIHByaXZhdGUgY29sbGVjdE1vZHVsZXNBZmZlY3RlZEJ5T3ZlcnJpZGVzKGFycjogYW55W10pOiBTZXQ8TmdNb2R1bGVUeXBlPGFueT4+IHtcbiAgICBjb25zdCBzZWVuTW9kdWxlcyA9IG5ldyBTZXQ8TmdNb2R1bGVUeXBlPGFueT4+KCk7XG4gICAgY29uc3QgYWZmZWN0ZWRNb2R1bGVzID0gbmV3IFNldDxOZ01vZHVsZVR5cGU8YW55Pj4oKTtcbiAgICBjb25zdCBjYWxjQWZmZWN0ZWRNb2R1bGVzUmVjdXIgPSAoYXJyOiBhbnlbXSwgcGF0aDogTmdNb2R1bGVUeXBlPGFueT5bXSk6IHZvaWQgPT4ge1xuICAgICAgZm9yIChjb25zdCB2YWx1ZSBvZiBhcnIpIHtcbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkodmFsdWUpKSB7XG4gICAgICAgICAgLy8gSWYgdGhlIHZhbHVlIGlzIGFuIGFycmF5LCBqdXN0IGZsYXR0ZW4gaXQgKGJ5IGludm9raW5nIHRoaXMgZnVuY3Rpb24gcmVjdXJzaXZlbHkpLFxuICAgICAgICAgIC8vIGtlZXBpbmcgXCJwYXRoXCIgdGhlIHNhbWUuXG4gICAgICAgICAgY2FsY0FmZmVjdGVkTW9kdWxlc1JlY3VyKHZhbHVlLCBwYXRoKTtcbiAgICAgICAgfSBlbHNlIGlmIChoYXNOZ01vZHVsZURlZih2YWx1ZSkpIHtcbiAgICAgICAgICBpZiAoc2Vlbk1vZHVsZXMuaGFzKHZhbHVlKSkge1xuICAgICAgICAgICAgLy8gSWYgd2UndmUgc2VlbiB0aGlzIG1vZHVsZSBiZWZvcmUgYW5kIGl0J3MgaW5jbHVkZWQgaW50byBcImFmZmVjdGVkIG1vZHVsZXNcIiBsaXN0LCBtYXJrXG4gICAgICAgICAgICAvLyB0aGUgd2hvbGUgcGF0aCB0aGF0IGxlYWRzIHRvIHRoYXQgbW9kdWxlIGFzIGFmZmVjdGVkLCBidXQgZG8gbm90IGRlc2NlbmQgaW50byBpdHNcbiAgICAgICAgICAgIC8vIGltcG9ydHMsIHNpbmNlIHdlIGFscmVhZHkgZXhhbWluZWQgdGhlbSBiZWZvcmUuXG4gICAgICAgICAgICBpZiAoYWZmZWN0ZWRNb2R1bGVzLmhhcyh2YWx1ZSkpIHtcbiAgICAgICAgICAgICAgcGF0aC5mb3JFYWNoKGl0ZW0gPT4gYWZmZWN0ZWRNb2R1bGVzLmFkZChpdGVtKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgc2Vlbk1vZHVsZXMuYWRkKHZhbHVlKTtcbiAgICAgICAgICBpZiAodGhpcy5vdmVycmlkZGVuTW9kdWxlcy5oYXModmFsdWUpKSB7XG4gICAgICAgICAgICBwYXRoLmZvckVhY2goaXRlbSA9PiBhZmZlY3RlZE1vZHVsZXMuYWRkKGl0ZW0pKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgLy8gRXhhbWluZSBtb2R1bGUgaW1wb3J0cyByZWN1cnNpdmVseSB0byBsb29rIGZvciBvdmVycmlkZGVuIG1vZHVsZXMuXG4gICAgICAgICAgY29uc3QgbW9kdWxlRGVmID0gKHZhbHVlIGFzIGFueSlbTkdfTU9EX0RFRl07XG4gICAgICAgICAgY2FsY0FmZmVjdGVkTW9kdWxlc1JlY3VyKG1heWJlVW53cmFwRm4obW9kdWxlRGVmLmltcG9ydHMpLCBwYXRoLmNvbmNhdCh2YWx1ZSkpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfTtcbiAgICBjYWxjQWZmZWN0ZWRNb2R1bGVzUmVjdXIoYXJyLCBbXSk7XG4gICAgcmV0dXJuIGFmZmVjdGVkTW9kdWxlcztcbiAgfVxuXG4gIC8qKlxuICAgKiBQcmVzZXJ2ZSBhbiBvcmlnaW5hbCBkZWYgKHN1Y2ggYXMgybVtb2QsIMm1aW5qLCBldGMpIGJlZm9yZSBhcHBseWluZyBhbiBvdmVycmlkZS5cbiAgICogTm90ZTogb25lIGNsYXNzIG1heSBoYXZlIG11bHRpcGxlIGRlZnMgKGZvciBleGFtcGxlOiDJtW1vZCBhbmQgybVpbmogaW4gY2FzZSBvZlxuICAgKiBhbiBOZ01vZHVsZSkuIElmIHRoZXJlIGlzIGEgZGVmIGluIGEgc2V0IGFscmVhZHksIGRvbid0IG92ZXJyaWRlIGl0LCBzaW5jZVxuICAgKiBhbiBvcmlnaW5hbCBvbmUgc2hvdWxkIGJlIHJlc3RvcmVkIGF0IHRoZSBlbmQgb2YgYSB0ZXN0LlxuICAgKi9cbiAgcHJpdmF0ZSBtYXliZVN0b3JlTmdEZWYocHJvcDogc3RyaW5nLCB0eXBlOiBUeXBlPGFueT4pIHtcbiAgICBpZiAoIXRoaXMuaW5pdGlhbE5nRGVmcy5oYXModHlwZSkpIHtcbiAgICAgIHRoaXMuaW5pdGlhbE5nRGVmcy5zZXQodHlwZSwgbmV3IE1hcCgpKTtcbiAgICB9XG4gICAgY29uc3QgY3VycmVudERlZnMgPSB0aGlzLmluaXRpYWxOZ0RlZnMuZ2V0KHR5cGUpITtcbiAgICBpZiAoIWN1cnJlbnREZWZzLmhhcyhwcm9wKSkge1xuICAgICAgY29uc3QgY3VycmVudERlZiA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IodHlwZSwgcHJvcCk7XG4gICAgICBjdXJyZW50RGVmcy5zZXQocHJvcCwgY3VycmVudERlZik7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBzdG9yZUZpZWxkT2ZEZWZPblR5cGUodHlwZTogVHlwZTxhbnk+LCBkZWZGaWVsZDogc3RyaW5nLCBmaWVsZE5hbWU6IHN0cmluZyk6IHZvaWQge1xuICAgIGNvbnN0IGRlZjogYW55ID0gKHR5cGUgYXMgYW55KVtkZWZGaWVsZF07XG4gICAgY29uc3Qgb3JpZ2luYWxWYWx1ZTogYW55ID0gZGVmW2ZpZWxkTmFtZV07XG4gICAgdGhpcy5kZWZDbGVhbnVwT3BzLnB1c2goe29iamVjdDogZGVmLCBmaWVsZE5hbWUsIG9yaWdpbmFsVmFsdWV9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDbGVhcnMgY3VycmVudCBjb21wb25lbnRzIHJlc29sdXRpb24gcXVldWUsIGJ1dCBzdG9yZXMgdGhlIHN0YXRlIG9mIHRoZSBxdWV1ZSwgc28gd2UgY2FuXG4gICAqIHJlc3RvcmUgaXQgbGF0ZXIuIENsZWFyaW5nIHRoZSBxdWV1ZSBpcyByZXF1aXJlZCBiZWZvcmUgd2UgdHJ5IHRvIGNvbXBpbGUgY29tcG9uZW50cyAodmlhXG4gICAqIGBUZXN0QmVkLmNvbXBpbGVDb21wb25lbnRzYCksIHNvIHRoYXQgY29tcG9uZW50IGRlZnMgYXJlIGluIHN5bmMgd2l0aCB0aGUgcmVzb2x1dGlvbiBxdWV1ZS5cbiAgICovXG4gIHByaXZhdGUgY2xlYXJDb21wb25lbnRSZXNvbHV0aW9uUXVldWUoKSB7XG4gICAgaWYgKHRoaXMub3JpZ2luYWxDb21wb25lbnRSZXNvbHV0aW9uUXVldWUgPT09IG51bGwpIHtcbiAgICAgIHRoaXMub3JpZ2luYWxDb21wb25lbnRSZXNvbHV0aW9uUXVldWUgPSBuZXcgTWFwKCk7XG4gICAgfVxuICAgIMm1Y2xlYXJSZXNvbHV0aW9uT2ZDb21wb25lbnRSZXNvdXJjZXNRdWV1ZSgpLmZvckVhY2goXG4gICAgICAgICh2YWx1ZSwga2V5KSA9PiB0aGlzLm9yaWdpbmFsQ29tcG9uZW50UmVzb2x1dGlvblF1ZXVlIS5zZXQoa2V5LCB2YWx1ZSkpO1xuICB9XG5cbiAgLypcbiAgICogUmVzdG9yZXMgY29tcG9uZW50IHJlc29sdXRpb24gcXVldWUgdG8gdGhlIHByZXZpb3VzbHkgc2F2ZWQgc3RhdGUuIFRoaXMgb3BlcmF0aW9uIGlzIHBlcmZvcm1lZFxuICAgKiBhcyBhIHBhcnQgb2YgcmVzdG9yaW5nIHRoZSBzdGF0ZSBhZnRlciBjb21wbGV0aW9uIG9mIHRoZSBjdXJyZW50IHNldCBvZiB0ZXN0cyAodGhhdCBtaWdodFxuICAgKiBwb3RlbnRpYWxseSBtdXRhdGUgdGhlIHN0YXRlKS5cbiAgICovXG4gIHByaXZhdGUgcmVzdG9yZUNvbXBvbmVudFJlc29sdXRpb25RdWV1ZSgpIHtcbiAgICBpZiAodGhpcy5vcmlnaW5hbENvbXBvbmVudFJlc29sdXRpb25RdWV1ZSAhPT0gbnVsbCkge1xuICAgICAgybVyZXN0b3JlQ29tcG9uZW50UmVzb2x1dGlvblF1ZXVlKHRoaXMub3JpZ2luYWxDb21wb25lbnRSZXNvbHV0aW9uUXVldWUpO1xuICAgICAgdGhpcy5vcmlnaW5hbENvbXBvbmVudFJlc29sdXRpb25RdWV1ZSA9IG51bGw7XG4gICAgfVxuICB9XG5cbiAgcmVzdG9yZU9yaWdpbmFsU3RhdGUoKTogdm9pZCB7XG4gICAgLy8gUHJvY2VzcyBjbGVhbnVwIG9wcyBpbiByZXZlcnNlIG9yZGVyIHNvIHRoZSBmaWVsZCdzIG9yaWdpbmFsIHZhbHVlIGlzIHJlc3RvcmVkIGNvcnJlY3RseSAoaW5cbiAgICAvLyBjYXNlIHRoZXJlIHdlcmUgbXVsdGlwbGUgb3ZlcnJpZGVzIGZvciB0aGUgc2FtZSBmaWVsZCkuXG4gICAgZm9yRWFjaFJpZ2h0KHRoaXMuZGVmQ2xlYW51cE9wcywgKG9wOiBDbGVhbnVwT3BlcmF0aW9uKSA9PiB7XG4gICAgICBvcC5vYmplY3Rbb3AuZmllbGROYW1lXSA9IG9wLm9yaWdpbmFsVmFsdWU7XG4gICAgfSk7XG4gICAgLy8gUmVzdG9yZSBpbml0aWFsIGNvbXBvbmVudC9kaXJlY3RpdmUvcGlwZSBkZWZzXG4gICAgdGhpcy5pbml0aWFsTmdEZWZzLmZvckVhY2goXG4gICAgICAgIChkZWZzOiBNYXA8c3RyaW5nLCBQcm9wZXJ0eURlc2NyaXB0b3J8dW5kZWZpbmVkPiwgdHlwZTogVHlwZTxhbnk+KSA9PiB7XG4gICAgICAgICAgaWYgKFVTRV9SVU5USU1FX0RFUFNfVFJBQ0tFUl9GT1JfSklUKSB7XG4gICAgICAgICAgICBkZXBzVHJhY2tlci5jbGVhclNjb3BlQ2FjaGVGb3IodHlwZSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGRlZnMuZm9yRWFjaCgoZGVzY3JpcHRvciwgcHJvcCkgPT4ge1xuICAgICAgICAgICAgaWYgKCFkZXNjcmlwdG9yKSB7XG4gICAgICAgICAgICAgIC8vIERlbGV0ZSBvcGVyYXRpb25zIGFyZSBnZW5lcmFsbHkgdW5kZXNpcmFibGUgc2luY2UgdGhleSBoYXZlIHBlcmZvcm1hbmNlXG4gICAgICAgICAgICAgIC8vIGltcGxpY2F0aW9ucyBvbiBvYmplY3RzIHRoZXkgd2VyZSBhcHBsaWVkIHRvLiBJbiB0aGlzIHBhcnRpY3VsYXIgY2FzZSwgc2l0dWF0aW9uc1xuICAgICAgICAgICAgICAvLyB3aGVyZSB0aGlzIGNvZGUgaXMgaW52b2tlZCBzaG91bGQgYmUgcXVpdGUgcmFyZSB0byBjYXVzZSBhbnkgbm90aWNlYWJsZSBpbXBhY3QsXG4gICAgICAgICAgICAgIC8vIHNpbmNlIGl0J3MgYXBwbGllZCBvbmx5IHRvIHNvbWUgdGVzdCBjYXNlcyAoZm9yIGV4YW1wbGUgd2hlbiBjbGFzcyB3aXRoIG5vXG4gICAgICAgICAgICAgIC8vIGFubm90YXRpb25zIGV4dGVuZHMgc29tZSBAQ29tcG9uZW50KSB3aGVuIHdlIG5lZWQgdG8gY2xlYXIgJ8m1Y21wJyBmaWVsZCBvbiBhIGdpdmVuXG4gICAgICAgICAgICAgIC8vIGNsYXNzIHRvIHJlc3RvcmUgaXRzIG9yaWdpbmFsIHN0YXRlIChiZWZvcmUgYXBwbHlpbmcgb3ZlcnJpZGVzIGFuZCBydW5uaW5nIHRlc3RzKS5cbiAgICAgICAgICAgICAgZGVsZXRlICh0eXBlIGFzIGFueSlbcHJvcF07XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodHlwZSwgcHJvcCwgZGVzY3JpcHRvcik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIHRoaXMuaW5pdGlhbE5nRGVmcy5jbGVhcigpO1xuICAgIHRoaXMuc2NvcGVzV2l0aE92ZXJyaWRkZW5Qcm92aWRlcnMuY2xlYXIoKTtcbiAgICB0aGlzLnJlc3RvcmVDb21wb25lbnRSZXNvbHV0aW9uUXVldWUoKTtcbiAgICAvLyBSZXN0b3JlIHRoZSBsb2NhbGUgSUQgdG8gdGhlIGRlZmF1bHQgdmFsdWUsIHRoaXMgc2hvdWxkbid0IGJlIG5lY2Vzc2FyeSBidXQgd2UgbmV2ZXIga25vd1xuICAgIHNldExvY2FsZUlkKERFRkFVTFRfTE9DQUxFX0lEKTtcbiAgfVxuXG4gIHByaXZhdGUgY29tcGlsZVRlc3RNb2R1bGUoKTogdm9pZCB7XG4gICAgY2xhc3MgUm9vdFNjb3BlTW9kdWxlIHt9XG4gICAgY29tcGlsZU5nTW9kdWxlRGVmcyhSb290U2NvcGVNb2R1bGUgYXMgTmdNb2R1bGVUeXBlPGFueT4sIHtcbiAgICAgIHByb3ZpZGVyczogWy4uLnRoaXMucm9vdFByb3ZpZGVyT3ZlcnJpZGVzXSxcbiAgICB9KTtcblxuICAgIGNvbnN0IHByb3ZpZGVycyA9IFtcbiAgICAgIHByb3ZpZGVab25lQ2hhbmdlRGV0ZWN0aW9uKCksXG4gICAgICB7cHJvdmlkZTogQ29tcGlsZXIsIHVzZUZhY3Rvcnk6ICgpID0+IG5ldyBSM1Rlc3RDb21waWxlcih0aGlzKX0sXG4gICAgICAuLi50aGlzLnByb3ZpZGVycyxcbiAgICAgIC4uLnRoaXMucHJvdmlkZXJPdmVycmlkZXMsXG4gICAgXTtcbiAgICBjb25zdCBpbXBvcnRzID0gW1Jvb3RTY29wZU1vZHVsZSwgdGhpcy5hZGRpdGlvbmFsTW9kdWxlVHlwZXMsIHRoaXMuaW1wb3J0cyB8fCBbXV07XG5cbiAgICAvLyBjbGFuZy1mb3JtYXQgb2ZmXG4gICAgY29tcGlsZU5nTW9kdWxlRGVmcyh0aGlzLnRlc3RNb2R1bGVUeXBlLCB7XG4gICAgICBkZWNsYXJhdGlvbnM6IHRoaXMuZGVjbGFyYXRpb25zLFxuICAgICAgaW1wb3J0cyxcbiAgICAgIHNjaGVtYXM6IHRoaXMuc2NoZW1hcyxcbiAgICAgIHByb3ZpZGVycyxcbiAgICB9LCAvKiBhbGxvd0R1cGxpY2F0ZURlY2xhcmF0aW9uc0luUm9vdCAqLyB0cnVlKTtcbiAgICAvLyBjbGFuZy1mb3JtYXQgb25cblxuICAgIHRoaXMuYXBwbHlQcm92aWRlck92ZXJyaWRlc0luU2NvcGUodGhpcy50ZXN0TW9kdWxlVHlwZSk7XG4gIH1cblxuICBnZXQgaW5qZWN0b3IoKTogSW5qZWN0b3Ige1xuICAgIGlmICh0aGlzLl9pbmplY3RvciAhPT0gbnVsbCkge1xuICAgICAgcmV0dXJuIHRoaXMuX2luamVjdG9yO1xuICAgIH1cblxuICAgIGNvbnN0IHByb3ZpZGVyczogU3RhdGljUHJvdmlkZXJbXSA9IFtdO1xuICAgIGNvbnN0IGNvbXBpbGVyT3B0aW9ucyA9IHRoaXMucGxhdGZvcm0uaW5qZWN0b3IuZ2V0KENPTVBJTEVSX09QVElPTlMpO1xuICAgIGNvbXBpbGVyT3B0aW9ucy5mb3JFYWNoKG9wdHMgPT4ge1xuICAgICAgaWYgKG9wdHMucHJvdmlkZXJzKSB7XG4gICAgICAgIHByb3ZpZGVycy5wdXNoKG9wdHMucHJvdmlkZXJzKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICBpZiAodGhpcy5jb21waWxlclByb3ZpZGVycyAhPT0gbnVsbCkge1xuICAgICAgcHJvdmlkZXJzLnB1c2goLi4udGhpcy5jb21waWxlclByb3ZpZGVycyBhcyBTdGF0aWNQcm92aWRlcltdKTtcbiAgICB9XG5cbiAgICB0aGlzLl9pbmplY3RvciA9IEluamVjdG9yLmNyZWF0ZSh7cHJvdmlkZXJzLCBwYXJlbnQ6IHRoaXMucGxhdGZvcm0uaW5qZWN0b3J9KTtcbiAgICByZXR1cm4gdGhpcy5faW5qZWN0b3I7XG4gIH1cblxuICAvLyBnZXQgb3ZlcnJpZGVzIGZvciBhIHNwZWNpZmljIHByb3ZpZGVyIChpZiBhbnkpXG4gIHByaXZhdGUgZ2V0U2luZ2xlUHJvdmlkZXJPdmVycmlkZXMocHJvdmlkZXI6IFByb3ZpZGVyKTogUHJvdmlkZXJ8bnVsbCB7XG4gICAgY29uc3QgdG9rZW4gPSBnZXRQcm92aWRlclRva2VuKHByb3ZpZGVyKTtcbiAgICByZXR1cm4gdGhpcy5wcm92aWRlck92ZXJyaWRlc0J5VG9rZW4uZ2V0KHRva2VuKSB8fCBudWxsO1xuICB9XG5cbiAgcHJpdmF0ZSBnZXRQcm92aWRlck92ZXJyaWRlcyhwcm92aWRlcnM/OiBBcnJheTxQcm92aWRlcnxJbnRlcm5hbEVudmlyb25tZW50UHJvdmlkZXJzPik6XG4gICAgICBQcm92aWRlcltdIHtcbiAgICBpZiAoIXByb3ZpZGVycyB8fCAhcHJvdmlkZXJzLmxlbmd0aCB8fCB0aGlzLnByb3ZpZGVyT3ZlcnJpZGVzQnlUb2tlbi5zaXplID09PSAwKSByZXR1cm4gW107XG4gICAgLy8gVGhlcmUgYXJlIHR3byBmbGF0dGVuaW5nIG9wZXJhdGlvbnMgaGVyZS4gVGhlIGlubmVyIGZsYXR0ZW5Qcm92aWRlcnMoKSBvcGVyYXRlcyBvbiB0aGVcbiAgICAvLyBtZXRhZGF0YSdzIHByb3ZpZGVycyBhbmQgYXBwbGllcyBhIG1hcHBpbmcgZnVuY3Rpb24gd2hpY2ggcmV0cmlldmVzIG92ZXJyaWRlcyBmb3IgZWFjaFxuICAgIC8vIGluY29taW5nIHByb3ZpZGVyLiBUaGUgb3V0ZXIgZmxhdHRlbigpIHRoZW4gZmxhdHRlbnMgdGhlIHByb2R1Y2VkIG92ZXJyaWRlcyBhcnJheS4gSWYgdGhpcyBpc1xuICAgIC8vIG5vdCBkb25lLCB0aGUgYXJyYXkgY2FuIGNvbnRhaW4gb3RoZXIgZW1wdHkgYXJyYXlzIChlLmcuIGBbW10sIFtdXWApIHdoaWNoIGxlYWsgaW50byB0aGVcbiAgICAvLyBwcm92aWRlcnMgYXJyYXkgYW5kIGNvbnRhbWluYXRlIGFueSBlcnJvciBtZXNzYWdlcyB0aGF0IG1pZ2h0IGJlIGdlbmVyYXRlZC5cbiAgICByZXR1cm4gZmxhdHRlbihmbGF0dGVuUHJvdmlkZXJzKFxuICAgICAgICBwcm92aWRlcnMsIChwcm92aWRlcjogUHJvdmlkZXIpID0+IHRoaXMuZ2V0U2luZ2xlUHJvdmlkZXJPdmVycmlkZXMocHJvdmlkZXIpIHx8IFtdKSk7XG4gIH1cblxuICBwcml2YXRlIGdldE92ZXJyaWRkZW5Qcm92aWRlcnMocHJvdmlkZXJzPzogQXJyYXk8UHJvdmlkZXJ8SW50ZXJuYWxFbnZpcm9ubWVudFByb3ZpZGVycz4pOlxuICAgICAgUHJvdmlkZXJbXSB7XG4gICAgaWYgKCFwcm92aWRlcnMgfHwgIXByb3ZpZGVycy5sZW5ndGggfHwgdGhpcy5wcm92aWRlck92ZXJyaWRlc0J5VG9rZW4uc2l6ZSA9PT0gMCkgcmV0dXJuIFtdO1xuXG4gICAgY29uc3QgZmxhdHRlbmVkUHJvdmlkZXJzID0gZmxhdHRlblByb3ZpZGVycyhwcm92aWRlcnMpO1xuICAgIGNvbnN0IG92ZXJyaWRlcyA9IHRoaXMuZ2V0UHJvdmlkZXJPdmVycmlkZXMoZmxhdHRlbmVkUHJvdmlkZXJzKTtcbiAgICBjb25zdCBvdmVycmlkZGVuUHJvdmlkZXJzID0gWy4uLmZsYXR0ZW5lZFByb3ZpZGVycywgLi4ub3ZlcnJpZGVzXTtcbiAgICBjb25zdCBmaW5hbDogUHJvdmlkZXJbXSA9IFtdO1xuICAgIGNvbnN0IHNlZW5PdmVycmlkZGVuUHJvdmlkZXJzID0gbmV3IFNldDxQcm92aWRlcj4oKTtcblxuICAgIC8vIFdlIGl0ZXJhdGUgdGhyb3VnaCB0aGUgbGlzdCBvZiBwcm92aWRlcnMgaW4gcmV2ZXJzZSBvcmRlciB0byBtYWtlIHN1cmUgcHJvdmlkZXIgb3ZlcnJpZGVzXG4gICAgLy8gdGFrZSBwcmVjZWRlbmNlIG92ZXIgdGhlIHZhbHVlcyBkZWZpbmVkIGluIHByb3ZpZGVyIGxpc3QuIFdlIGFsc28gZmlsdGVyIG91dCBhbGwgcHJvdmlkZXJzXG4gICAgLy8gdGhhdCBoYXZlIG92ZXJyaWRlcywga2VlcGluZyBvdmVycmlkZGVuIHZhbHVlcyBvbmx5LiBUaGlzIGlzIG5lZWRlZCwgc2luY2UgcHJlc2VuY2Ugb2YgYVxuICAgIC8vIHByb3ZpZGVyIHdpdGggYG5nT25EZXN0cm95YCBob29rIHdpbGwgY2F1c2UgdGhpcyBob29rIHRvIGJlIHJlZ2lzdGVyZWQgYW5kIGludm9rZWQgbGF0ZXIuXG4gICAgZm9yRWFjaFJpZ2h0KG92ZXJyaWRkZW5Qcm92aWRlcnMsIChwcm92aWRlcjogYW55KSA9PiB7XG4gICAgICBjb25zdCB0b2tlbjogYW55ID0gZ2V0UHJvdmlkZXJUb2tlbihwcm92aWRlcik7XG4gICAgICBpZiAodGhpcy5wcm92aWRlck92ZXJyaWRlc0J5VG9rZW4uaGFzKHRva2VuKSkge1xuICAgICAgICBpZiAoIXNlZW5PdmVycmlkZGVuUHJvdmlkZXJzLmhhcyh0b2tlbikpIHtcbiAgICAgICAgICBzZWVuT3ZlcnJpZGRlblByb3ZpZGVycy5hZGQodG9rZW4pO1xuICAgICAgICAgIC8vIFRyZWF0IGFsbCBvdmVycmlkZGVuIHByb3ZpZGVycyBhcyBge211bHRpOiBmYWxzZX1gIChldmVuIGlmIGl0J3MgYSBtdWx0aS1wcm92aWRlcikgdG9cbiAgICAgICAgICAvLyBtYWtlIHN1cmUgdGhhdCBwcm92aWRlZCBvdmVycmlkZSB0YWtlcyBoaWdoZXN0IHByZWNlZGVuY2UgYW5kIGlzIG5vdCBjb21iaW5lZCB3aXRoXG4gICAgICAgICAgLy8gb3RoZXIgaW5zdGFuY2VzIG9mIHRoZSBzYW1lIG11bHRpIHByb3ZpZGVyLlxuICAgICAgICAgIGZpbmFsLnVuc2hpZnQoey4uLnByb3ZpZGVyLCBtdWx0aTogZmFsc2V9KTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZmluYWwudW5zaGlmdChwcm92aWRlcik7XG4gICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIGZpbmFsO1xuICB9XG5cbiAgcHJpdmF0ZSBoYXNQcm92aWRlck92ZXJyaWRlcyhwcm92aWRlcnM/OiBBcnJheTxQcm92aWRlcnxJbnRlcm5hbEVudmlyb25tZW50UHJvdmlkZXJzPik6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLmdldFByb3ZpZGVyT3ZlcnJpZGVzKHByb3ZpZGVycykubGVuZ3RoID4gMDtcbiAgfVxuXG4gIHByaXZhdGUgcGF0Y2hEZWZXaXRoUHJvdmlkZXJPdmVycmlkZXMoZGVjbGFyYXRpb246IFR5cGU8YW55PiwgZmllbGQ6IHN0cmluZyk6IHZvaWQge1xuICAgIGNvbnN0IGRlZiA9IChkZWNsYXJhdGlvbiBhcyBhbnkpW2ZpZWxkXTtcbiAgICBpZiAoZGVmICYmIGRlZi5wcm92aWRlcnNSZXNvbHZlcikge1xuICAgICAgdGhpcy5tYXliZVN0b3JlTmdEZWYoZmllbGQsIGRlY2xhcmF0aW9uKTtcblxuICAgICAgY29uc3QgcmVzb2x2ZXIgPSBkZWYucHJvdmlkZXJzUmVzb2x2ZXI7XG4gICAgICBjb25zdCBwcm9jZXNzUHJvdmlkZXJzRm4gPSAocHJvdmlkZXJzOiBQcm92aWRlcltdKSA9PiB0aGlzLmdldE92ZXJyaWRkZW5Qcm92aWRlcnMocHJvdmlkZXJzKTtcbiAgICAgIHRoaXMuc3RvcmVGaWVsZE9mRGVmT25UeXBlKGRlY2xhcmF0aW9uLCBmaWVsZCwgJ3Byb3ZpZGVyc1Jlc29sdmVyJyk7XG4gICAgICBkZWYucHJvdmlkZXJzUmVzb2x2ZXIgPSAobmdEZWY6IERpcmVjdGl2ZURlZjxhbnk+KSA9PiByZXNvbHZlcihuZ0RlZiwgcHJvY2Vzc1Byb3ZpZGVyc0ZuKTtcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gaW5pdFJlc29sdmVycygpOiBSZXNvbHZlcnMge1xuICByZXR1cm4ge1xuICAgIG1vZHVsZTogbmV3IE5nTW9kdWxlUmVzb2x2ZXIoKSxcbiAgICBjb21wb25lbnQ6IG5ldyBDb21wb25lbnRSZXNvbHZlcigpLFxuICAgIGRpcmVjdGl2ZTogbmV3IERpcmVjdGl2ZVJlc29sdmVyKCksXG4gICAgcGlwZTogbmV3IFBpcGVSZXNvbHZlcigpXG4gIH07XG59XG5cbmZ1bmN0aW9uIGlzU3RhbmRhbG9uZUNvbXBvbmVudDxUPih2YWx1ZTogVHlwZTxUPik6IHZhbHVlIGlzIENvbXBvbmVudFR5cGU8VD4ge1xuICBjb25zdCBkZWYgPSBnZXRDb21wb25lbnREZWYodmFsdWUpO1xuICByZXR1cm4gISFkZWY/LnN0YW5kYWxvbmU7XG59XG5cbmZ1bmN0aW9uIGdldENvbXBvbmVudERlZih2YWx1ZTogQ29tcG9uZW50VHlwZTx1bmtub3duPik6IENvbXBvbmVudERlZjx1bmtub3duPjtcbmZ1bmN0aW9uIGdldENvbXBvbmVudERlZih2YWx1ZTogVHlwZTx1bmtub3duPik6IENvbXBvbmVudERlZjx1bmtub3duPnxudWxsO1xuZnVuY3Rpb24gZ2V0Q29tcG9uZW50RGVmKHZhbHVlOiBUeXBlPHVua25vd24+KTogQ29tcG9uZW50RGVmPHVua25vd24+fG51bGwge1xuICByZXR1cm4gKHZhbHVlIGFzIGFueSkuybVjbXAgPz8gbnVsbDtcbn1cblxuZnVuY3Rpb24gaGFzTmdNb2R1bGVEZWY8VD4odmFsdWU6IFR5cGU8VD4pOiB2YWx1ZSBpcyBOZ01vZHVsZVR5cGU8VD4ge1xuICByZXR1cm4gdmFsdWUuaGFzT3duUHJvcGVydHkoJ8m1bW9kJyk7XG59XG5cbmZ1bmN0aW9uIGlzTmdNb2R1bGU8VD4odmFsdWU6IFR5cGU8VD4pOiBib29sZWFuIHtcbiAgcmV0dXJuIGhhc05nTW9kdWxlRGVmKHZhbHVlKTtcbn1cblxuZnVuY3Rpb24gbWF5YmVVbndyYXBGbjxUPihtYXliZUZuOiAoKCkgPT4gVCl8VCk6IFQge1xuICByZXR1cm4gbWF5YmVGbiBpbnN0YW5jZW9mIEZ1bmN0aW9uID8gbWF5YmVGbigpIDogbWF5YmVGbjtcbn1cblxuZnVuY3Rpb24gZmxhdHRlbjxUPih2YWx1ZXM6IGFueVtdKTogVFtdIHtcbiAgY29uc3Qgb3V0OiBUW10gPSBbXTtcbiAgdmFsdWVzLmZvckVhY2godmFsdWUgPT4ge1xuICAgIGlmIChBcnJheS5pc0FycmF5KHZhbHVlKSkge1xuICAgICAgb3V0LnB1c2goLi4uZmxhdHRlbjxUPih2YWx1ZSkpO1xuICAgIH0gZWxzZSB7XG4gICAgICBvdXQucHVzaCh2YWx1ZSk7XG4gICAgfVxuICB9KTtcbiAgcmV0dXJuIG91dDtcbn1cblxuZnVuY3Rpb24gaWRlbnRpdHlGbjxUPih2YWx1ZTogVCk6IFQge1xuICByZXR1cm4gdmFsdWU7XG59XG5cbmZ1bmN0aW9uIGZsYXR0ZW5Qcm92aWRlcnM8VD4oXG4gICAgcHJvdmlkZXJzOiBBcnJheTxQcm92aWRlcnxJbnRlcm5hbEVudmlyb25tZW50UHJvdmlkZXJzPiwgbWFwRm46IChwcm92aWRlcjogUHJvdmlkZXIpID0+IFQpOiBUW107XG5mdW5jdGlvbiBmbGF0dGVuUHJvdmlkZXJzKHByb3ZpZGVyczogQXJyYXk8UHJvdmlkZXJ8SW50ZXJuYWxFbnZpcm9ubWVudFByb3ZpZGVycz4pOiBQcm92aWRlcltdO1xuZnVuY3Rpb24gZmxhdHRlblByb3ZpZGVycyhcbiAgICBwcm92aWRlcnM6IEFycmF5PFByb3ZpZGVyfEludGVybmFsRW52aXJvbm1lbnRQcm92aWRlcnM+LFxuICAgIG1hcEZuOiAocHJvdmlkZXI6IFByb3ZpZGVyKSA9PiBhbnkgPSBpZGVudGl0eUZuKTogYW55W10ge1xuICBjb25zdCBvdXQ6IGFueVtdID0gW107XG4gIGZvciAobGV0IHByb3ZpZGVyIG9mIHByb3ZpZGVycykge1xuICAgIGlmIChpc0Vudmlyb25tZW50UHJvdmlkZXJzKHByb3ZpZGVyKSkge1xuICAgICAgcHJvdmlkZXIgPSBwcm92aWRlci7JtXByb3ZpZGVycztcbiAgICB9XG4gICAgaWYgKEFycmF5LmlzQXJyYXkocHJvdmlkZXIpKSB7XG4gICAgICBvdXQucHVzaCguLi5mbGF0dGVuUHJvdmlkZXJzKHByb3ZpZGVyLCBtYXBGbikpO1xuICAgIH0gZWxzZSB7XG4gICAgICBvdXQucHVzaChtYXBGbihwcm92aWRlcikpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gb3V0O1xufVxuXG5mdW5jdGlvbiBnZXRQcm92aWRlckZpZWxkKHByb3ZpZGVyOiBQcm92aWRlciwgZmllbGQ6IHN0cmluZykge1xuICByZXR1cm4gcHJvdmlkZXIgJiYgdHlwZW9mIHByb3ZpZGVyID09PSAnb2JqZWN0JyAmJiAocHJvdmlkZXIgYXMgYW55KVtmaWVsZF07XG59XG5cbmZ1bmN0aW9uIGdldFByb3ZpZGVyVG9rZW4ocHJvdmlkZXI6IFByb3ZpZGVyKSB7XG4gIHJldHVybiBnZXRQcm92aWRlckZpZWxkKHByb3ZpZGVyLCAncHJvdmlkZScpIHx8IHByb3ZpZGVyO1xufVxuXG5mdW5jdGlvbiBpc01vZHVsZVdpdGhQcm92aWRlcnModmFsdWU6IGFueSk6IHZhbHVlIGlzIE1vZHVsZVdpdGhQcm92aWRlcnM8YW55PiB7XG4gIHJldHVybiB2YWx1ZS5oYXNPd25Qcm9wZXJ0eSgnbmdNb2R1bGUnKTtcbn1cblxuZnVuY3Rpb24gZm9yRWFjaFJpZ2h0PFQ+KHZhbHVlczogVFtdLCBmbjogKHZhbHVlOiBULCBpZHg6IG51bWJlcikgPT4gdm9pZCk6IHZvaWQge1xuICBmb3IgKGxldCBpZHggPSB2YWx1ZXMubGVuZ3RoIC0gMTsgaWR4ID49IDA7IGlkeC0tKSB7XG4gICAgZm4odmFsdWVzW2lkeF0sIGlkeCk7XG4gIH1cbn1cblxuZnVuY3Rpb24gaW52YWxpZFR5cGVFcnJvcihuYW1lOiBzdHJpbmcsIGV4cGVjdGVkVHlwZTogc3RyaW5nKTogRXJyb3Ige1xuICByZXR1cm4gbmV3IEVycm9yKGAke25hbWV9IGNsYXNzIGRvZXNuJ3QgaGF2ZSBAJHtleHBlY3RlZFR5cGV9IGRlY29yYXRvciBvciBpcyBtaXNzaW5nIG1ldGFkYXRhLmApO1xufVxuXG5jbGFzcyBSM1Rlc3RDb21waWxlciBpbXBsZW1lbnRzIENvbXBpbGVyIHtcbiAgY29uc3RydWN0b3IocHJpdmF0ZSB0ZXN0QmVkOiBUZXN0QmVkQ29tcGlsZXIpIHt9XG5cbiAgY29tcGlsZU1vZHVsZVN5bmM8VD4obW9kdWxlVHlwZTogVHlwZTxUPik6IE5nTW9kdWxlRmFjdG9yeTxUPiB7XG4gICAgdGhpcy50ZXN0QmVkLl9jb21waWxlTmdNb2R1bGVTeW5jKG1vZHVsZVR5cGUpO1xuICAgIHJldHVybiBuZXcgUjNOZ01vZHVsZUZhY3RvcnkobW9kdWxlVHlwZSk7XG4gIH1cblxuICBhc3luYyBjb21waWxlTW9kdWxlQXN5bmM8VD4obW9kdWxlVHlwZTogVHlwZTxUPik6IFByb21pc2U8TmdNb2R1bGVGYWN0b3J5PFQ+PiB7XG4gICAgYXdhaXQgdGhpcy50ZXN0QmVkLl9jb21waWxlTmdNb2R1bGVBc3luYyhtb2R1bGVUeXBlKTtcbiAgICByZXR1cm4gbmV3IFIzTmdNb2R1bGVGYWN0b3J5KG1vZHVsZVR5cGUpO1xuICB9XG5cbiAgY29tcGlsZU1vZHVsZUFuZEFsbENvbXBvbmVudHNTeW5jPFQ+KG1vZHVsZVR5cGU6IFR5cGU8VD4pOiBNb2R1bGVXaXRoQ29tcG9uZW50RmFjdG9yaWVzPFQ+IHtcbiAgICBjb25zdCBuZ01vZHVsZUZhY3RvcnkgPSB0aGlzLmNvbXBpbGVNb2R1bGVTeW5jKG1vZHVsZVR5cGUpO1xuICAgIGNvbnN0IGNvbXBvbmVudEZhY3RvcmllcyA9IHRoaXMudGVzdEJlZC5fZ2V0Q29tcG9uZW50RmFjdG9yaWVzKG1vZHVsZVR5cGUgYXMgTmdNb2R1bGVUeXBlPFQ+KTtcbiAgICByZXR1cm4gbmV3IE1vZHVsZVdpdGhDb21wb25lbnRGYWN0b3JpZXMobmdNb2R1bGVGYWN0b3J5LCBjb21wb25lbnRGYWN0b3JpZXMpO1xuICB9XG5cbiAgYXN5bmMgY29tcGlsZU1vZHVsZUFuZEFsbENvbXBvbmVudHNBc3luYzxUPihtb2R1bGVUeXBlOiBUeXBlPFQ+KTpcbiAgICAgIFByb21pc2U8TW9kdWxlV2l0aENvbXBvbmVudEZhY3RvcmllczxUPj4ge1xuICAgIGNvbnN0IG5nTW9kdWxlRmFjdG9yeSA9IGF3YWl0IHRoaXMuY29tcGlsZU1vZHVsZUFzeW5jKG1vZHVsZVR5cGUpO1xuICAgIGNvbnN0IGNvbXBvbmVudEZhY3RvcmllcyA9IHRoaXMudGVzdEJlZC5fZ2V0Q29tcG9uZW50RmFjdG9yaWVzKG1vZHVsZVR5cGUgYXMgTmdNb2R1bGVUeXBlPFQ+KTtcbiAgICByZXR1cm4gbmV3IE1vZHVsZVdpdGhDb21wb25lbnRGYWN0b3JpZXMobmdNb2R1bGVGYWN0b3J5LCBjb21wb25lbnRGYWN0b3JpZXMpO1xuICB9XG5cbiAgY2xlYXJDYWNoZSgpOiB2b2lkIHt9XG5cbiAgY2xlYXJDYWNoZUZvcih0eXBlOiBUeXBlPGFueT4pOiB2b2lkIHt9XG5cbiAgZ2V0TW9kdWxlSWQobW9kdWxlVHlwZTogVHlwZTxhbnk+KTogc3RyaW5nfHVuZGVmaW5lZCB7XG4gICAgY29uc3QgbWV0YSA9IHRoaXMudGVzdEJlZC5fZ2V0TW9kdWxlUmVzb2x2ZXIoKS5yZXNvbHZlKG1vZHVsZVR5cGUpO1xuICAgIHJldHVybiBtZXRhICYmIG1ldGEuaWQgfHwgdW5kZWZpbmVkO1xuICB9XG59XG4iXX0=