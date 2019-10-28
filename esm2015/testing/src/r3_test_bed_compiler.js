/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
import { __awaiter } from "tslib";
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ResourceLoader } from '@angular/compiler';
import { ApplicationInitStatus, COMPILER_OPTIONS, Compiler, LOCALE_ID, ModuleWithComponentFactories, NgZone, ɵDEFAULT_LOCALE_ID as DEFAULT_LOCALE_ID, ɵNG_COMP_DEF as NG_COMP_DEF, ɵNG_DIR_DEF as NG_DIR_DEF, ɵNG_INJ_DEF as NG_INJ_DEF, ɵNG_MOD_DEF as NG_MOD_DEF, ɵNG_PIPE_DEF as NG_PIPE_DEF, ɵNgModuleFactory as R3NgModuleFactory, ɵRender3ComponentFactory as ComponentFactory, ɵRender3NgModuleRef as NgModuleRef, ɵcompileComponent as compileComponent, ɵcompileDirective as compileDirective, ɵcompileNgModuleDefs as compileNgModuleDefs, ɵcompilePipe as compilePipe, ɵgetInjectableDef as getInjectableDef, ɵpatchComponentDefWithScope as patchComponentDefWithScope, ɵsetLocaleId as setLocaleId, ɵtransitiveScopesFor as transitiveScopesFor } from '@angular/core';
import { getRegisteredModulesState, restoreRegisteredModulesState } from '../../src/linker/ng_module_factory_registration';
import { clearResolutionOfComponentResourcesQueue, isComponentDefPendingResolution, resolveComponentResources, restoreComponentResolutionQueue } from '../../src/metadata/resource_loading';
import { ComponentResolver, DirectiveResolver, NgModuleResolver, PipeResolver } from './resolvers';
/** @enum {number} */
const TestingModuleOverride = {
    DECLARATION: 0,
    OVERRIDE_TEMPLATE: 1,
};
TestingModuleOverride[TestingModuleOverride.DECLARATION] = 'DECLARATION';
TestingModuleOverride[TestingModuleOverride.OVERRIDE_TEMPLATE] = 'OVERRIDE_TEMPLATE';
/**
 * @param {?} value
 * @return {?}
 */
function isTestingModuleOverride(value) {
    return value === TestingModuleOverride.DECLARATION ||
        value === TestingModuleOverride.OVERRIDE_TEMPLATE;
}
/**
 * @record
 */
function CleanupOperation() { }
if (false) {
    /** @type {?} */
    CleanupOperation.prototype.fieldName;
    /** @type {?} */
    CleanupOperation.prototype.object;
    /** @type {?} */
    CleanupOperation.prototype.originalValue;
}
export class R3TestBedCompiler {
    /**
     * @param {?} platform
     * @param {?} additionalModuleTypes
     */
    constructor(platform, additionalModuleTypes) {
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
        class DynamicTestModule {
        }
        this.testModuleType = (/** @type {?} */ (DynamicTestModule));
    }
    /**
     * @param {?} providers
     * @return {?}
     */
    setCompilerProviders(providers) {
        this.compilerProviders = providers;
        this._injector = null;
    }
    /**
     * @param {?} moduleDef
     * @return {?}
     */
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
    /**
     * @param {?} ngModule
     * @param {?} override
     * @return {?}
     */
    overrideModule(ngModule, override) {
        // Compile the module right away.
        this.resolvers.module.addOverride(ngModule, override);
        /** @type {?} */
        const metadata = this.resolvers.module.resolve(ngModule);
        if (metadata === null) {
            throw new Error(`${ngModule.name} is not an @NgModule or is missing metadata`);
        }
        this.recompileNgModule(ngModule);
        // At this point, the module has a valid module def (ɵmod), but the override may have introduced
        // new declarations or imported modules. Ingest any possible new types and add them to the
        // current queue.
        this.queueTypesFromModulesArray([ngModule]);
    }
    /**
     * @param {?} component
     * @param {?} override
     * @return {?}
     */
    overrideComponent(component, override) {
        this.resolvers.component.addOverride(component, override);
        this.pendingComponents.add(component);
    }
    /**
     * @param {?} directive
     * @param {?} override
     * @return {?}
     */
    overrideDirective(directive, override) {
        this.resolvers.directive.addOverride(directive, override);
        this.pendingDirectives.add(directive);
    }
    /**
     * @param {?} pipe
     * @param {?} override
     * @return {?}
     */
    overridePipe(pipe, override) {
        this.resolvers.pipe.addOverride(pipe, override);
        this.pendingPipes.add(pipe);
    }
    /**
     * @param {?} token
     * @param {?} provider
     * @return {?}
     */
    overrideProvider(token, provider) {
        /** @type {?} */
        const providerDef = provider.useFactory ?
            {
                provide: token,
                useFactory: provider.useFactory,
                deps: provider.deps || [],
                multi: provider.multi
            } :
            { provide: token, useValue: provider.useValue, multi: provider.multi };
        /** @type {?} */
        let injectableDef;
        /** @type {?} */
        const isRoot = (typeof token !== 'string' && (injectableDef = getInjectableDef(token)) &&
            injectableDef.providedIn === 'root');
        /** @type {?} */
        const overridesBucket = isRoot ? this.rootProviderOverrides : this.providerOverrides;
        overridesBucket.push(providerDef);
        // Keep overrides grouped by token as well for fast lookups using token
        this.providerOverridesByToken.set(token, providerDef);
    }
    /**
     * @param {?} type
     * @param {?} template
     * @return {?}
     */
    overrideTemplateUsingTestingModule(type, template) {
        /** @type {?} */
        const def = ((/** @type {?} */ (type)))[NG_COMP_DEF];
        /** @type {?} */
        const hasStyleUrls = (/**
         * @return {?}
         */
        () => {
            /** @type {?} */
            const metadata = (/** @type {?} */ ((/** @type {?} */ (this.resolvers.component.resolve(type)))));
            return !!metadata.styleUrls && metadata.styleUrls.length > 0;
        });
        /** @type {?} */
        const overrideStyleUrls = !!def && !isComponentDefPendingResolution(type) && hasStyleUrls();
        // In Ivy, compiling a component does not require knowing the module providing the
        // component's scope, so overrideTemplateUsingTestingModule can be implemented purely via
        // overrideComponent. Important: overriding template requires full Component re-compilation,
        // which may fail in case styleUrls are also present (thus Component is considered as required
        // resolution). In order to avoid this, we preemptively set styleUrls to an empty array,
        // preserve current styles available on Component def and restore styles back once compilation
        // is complete.
        /** @type {?} */
        const override = overrideStyleUrls ? { template, styles: [], styleUrls: [] } : { template };
        this.overrideComponent(type, { set: override });
        if (overrideStyleUrls && def.styles && def.styles.length > 0) {
            this.existingComponentStyles.set(type, def.styles);
        }
        // Set the component's scope to be the testing module.
        this.componentToModuleScope.set(type, TestingModuleOverride.OVERRIDE_TEMPLATE);
    }
    /**
     * @return {?}
     */
    compileComponents() {
        return __awaiter(this, void 0, void 0, /** @this {!R3TestBedCompiler} */ function* () {
            this.clearComponentResolutionQueue();
            // Run compilers for all queued types.
            /** @type {?} */
            let needsAsyncResources = this.compileTypesSync();
            // compileComponents() should not be async unless it needs to be.
            if (needsAsyncResources) {
                /** @type {?} */
                let resourceLoader;
                /** @type {?} */
                let resolver = (/**
                 * @param {?} url
                 * @return {?}
                 */
                (url) => {
                    if (!resourceLoader) {
                        resourceLoader = this.injector.get(ResourceLoader);
                    }
                    return Promise.resolve(resourceLoader.get(url));
                });
                yield resolveComponentResources(resolver);
            }
        });
    }
    /**
     * @return {?}
     */
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
        /** @type {?} */
        const parentInjector = this.platform.injector;
        this.testModuleRef = new NgModuleRef(this.testModuleType, parentInjector);
        // Set the locale ID, it can be overridden for the tests
        /** @type {?} */
        const localeId = this.testModuleRef.injector.get(LOCALE_ID, DEFAULT_LOCALE_ID);
        setLocaleId(localeId);
        // ApplicationInitStatus.runInitializers() is marked @internal to core.
        // Cast it to any before accessing it.
        ((/** @type {?} */ (this.testModuleRef.injector.get(ApplicationInitStatus)))).runInitializers();
        return this.testModuleRef;
    }
    /**
     * \@internal
     * @param {?} moduleType
     * @return {?}
     */
    _compileNgModuleSync(moduleType) {
        this.queueTypesFromModulesArray([moduleType]);
        this.compileTypesSync();
        this.applyProviderOverrides();
        this.applyProviderOverridesToModule(moduleType);
        this.applyTransitiveScopes();
    }
    /**
     * \@internal
     * @param {?} moduleType
     * @return {?}
     */
    _compileNgModuleAsync(moduleType) {
        return __awaiter(this, void 0, void 0, /** @this {!R3TestBedCompiler} */ function* () {
            if (this.originalRegisteredModules === null) {
                this.originalRegisteredModules = getRegisteredModulesState();
            }
            this.queueTypesFromModulesArray([moduleType]);
            yield this.compileComponents();
            this.applyProviderOverrides();
            this.applyProviderOverridesToModule(moduleType);
            this.applyTransitiveScopes();
        });
    }
    /**
     * \@internal
     * @return {?}
     */
    _getModuleResolver() { return this.resolvers.module; }
    /**
     * \@internal
     * @param {?} moduleType
     * @return {?}
     */
    _getComponentFactories(moduleType) {
        return maybeUnwrapFn(moduleType.ɵmod.declarations).reduce((/**
         * @param {?} factories
         * @param {?} declaration
         * @return {?}
         */
        (factories, declaration) => {
            /** @nocollapse @type {?} */
            const componentDef = ((/** @type {?} */ (declaration))).ɵcmp;
            componentDef && factories.push(new ComponentFactory(componentDef, (/** @type {?} */ (this.testModuleRef))));
            return factories;
        }), (/** @type {?} */ ([])));
    }
    /**
     * @private
     * @return {?}
     */
    compileTypesSync() {
        // Compile all queued components, directives, pipes.
        /** @type {?} */
        let needsAsyncResources = false;
        this.pendingComponents.forEach((/**
         * @param {?} declaration
         * @return {?}
         */
        declaration => {
            needsAsyncResources = needsAsyncResources || isComponentDefPendingResolution(declaration);
            /** @type {?} */
            const metadata = (/** @type {?} */ (this.resolvers.component.resolve(declaration)));
            this.maybeStoreNgDef(NG_COMP_DEF, declaration);
            compileComponent(declaration, metadata);
        }));
        this.pendingComponents.clear();
        this.pendingDirectives.forEach((/**
         * @param {?} declaration
         * @return {?}
         */
        declaration => {
            /** @type {?} */
            const metadata = this.resolvers.directive.resolve(declaration);
            this.maybeStoreNgDef(NG_DIR_DEF, declaration);
            compileDirective(declaration, metadata);
        }));
        this.pendingDirectives.clear();
        this.pendingPipes.forEach((/**
         * @param {?} declaration
         * @return {?}
         */
        declaration => {
            /** @type {?} */
            const metadata = (/** @type {?} */ (this.resolvers.pipe.resolve(declaration)));
            this.maybeStoreNgDef(NG_PIPE_DEF, declaration);
            compilePipe(declaration, metadata);
        }));
        this.pendingPipes.clear();
        return needsAsyncResources;
    }
    /**
     * @private
     * @return {?}
     */
    applyTransitiveScopes() {
        /** @type {?} */
        const moduleToScope = new Map();
        /** @type {?} */
        const getScopeOfModule = (/**
         * @param {?} moduleType
         * @return {?}
         */
        (moduleType) => {
            if (!moduleToScope.has(moduleType)) {
                /** @type {?} */
                const realType = isTestingModuleOverride(moduleType) ? this.testModuleType : moduleType;
                moduleToScope.set(moduleType, transitiveScopesFor(realType));
            }
            return (/** @type {?} */ (moduleToScope.get(moduleType)));
        });
        this.componentToModuleScope.forEach((/**
         * @param {?} moduleType
         * @param {?} componentType
         * @return {?}
         */
        (moduleType, componentType) => {
            /** @type {?} */
            const moduleScope = getScopeOfModule(moduleType);
            this.storeFieldOfDefOnType(componentType, NG_COMP_DEF, 'directiveDefs');
            this.storeFieldOfDefOnType(componentType, NG_COMP_DEF, 'pipeDefs');
            patchComponentDefWithScope(((/** @type {?} */ (componentType))).ɵcmp, moduleScope);
        }));
        this.componentToModuleScope.clear();
    }
    /**
     * @private
     * @return {?}
     */
    applyProviderOverrides() {
        /** @type {?} */
        const maybeApplyOverrides = (/**
         * @param {?} field
         * @return {?}
         */
        (field) => (/**
         * @param {?} type
         * @return {?}
         */
        (type) => {
            /** @type {?} */
            const resolver = field === NG_COMP_DEF ? this.resolvers.component : this.resolvers.directive;
            /** @type {?} */
            const metadata = (/** @type {?} */ (resolver.resolve(type)));
            if (this.hasProviderOverrides(metadata.providers)) {
                this.patchDefWithProviderOverrides(type, field);
            }
        }));
        this.seenComponents.forEach(maybeApplyOverrides(NG_COMP_DEF));
        this.seenDirectives.forEach(maybeApplyOverrides(NG_DIR_DEF));
        this.seenComponents.clear();
        this.seenDirectives.clear();
    }
    /**
     * @private
     * @param {?} moduleType
     * @return {?}
     */
    applyProviderOverridesToModule(moduleType) {
        if (this.moduleProvidersOverridden.has(moduleType)) {
            return;
        }
        this.moduleProvidersOverridden.add(moduleType);
        /** @type {?} */
        const injectorDef = ((/** @type {?} */ (moduleType)))[NG_INJ_DEF];
        if (this.providerOverridesByToken.size > 0) {
            // Extract the list of providers from ModuleWithProviders, so we can define the final list of
            // providers that might have overrides.
            // Note: second `flatten` operation is needed to convert an array of providers
            // (e.g. `[[], []]`) into one flat list, also eliminating empty arrays.
            /** @type {?} */
            const providersFromModules = flatten(flatten(injectorDef.imports, (/**
             * @param {?} imported
             * @return {?}
             */
            (imported) => isModuleWithProviders(imported) ? imported.providers : [])));
            /** @type {?} */
            const providers = [...providersFromModules, ...injectorDef.providers];
            if (this.hasProviderOverrides(providers)) {
                this.maybeStoreNgDef(NG_INJ_DEF, moduleType);
                this.storeFieldOfDefOnType(moduleType, NG_INJ_DEF, 'providers');
                injectorDef.providers = this.getOverriddenProviders(providers);
            }
            // Apply provider overrides to imported modules recursively
            /** @type {?} */
            const moduleDef = ((/** @type {?} */ (moduleType)))[NG_MOD_DEF];
            for (const importedModule of moduleDef.imports) {
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
    /**
     * @private
     * @return {?}
     */
    patchComponentsWithExistingStyles() {
        this.existingComponentStyles.forEach((/**
         * @param {?} styles
         * @param {?} type
         * @return {?}
         */
        (styles, type) => ((/** @type {?} */ (type)))[NG_COMP_DEF].styles = styles));
        this.existingComponentStyles.clear();
    }
    /**
     * @private
     * @param {?} arr
     * @param {?} moduleType
     * @return {?}
     */
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
    /**
     * @private
     * @param {?} ngModule
     * @return {?}
     */
    recompileNgModule(ngModule) {
        /** @type {?} */
        const metadata = this.resolvers.module.resolve(ngModule);
        if (metadata === null) {
            throw new Error(`Unable to resolve metadata for NgModule: ${ngModule.name}`);
        }
        // Cache the initial ngModuleDef as it will be overwritten.
        this.maybeStoreNgDef(NG_MOD_DEF, ngModule);
        this.maybeStoreNgDef(NG_INJ_DEF, ngModule);
        compileNgModuleDefs((/** @type {?} */ (ngModule)), metadata);
    }
    /**
     * @private
     * @param {?} type
     * @param {?} moduleType
     * @return {?}
     */
    queueType(type, moduleType) {
        /** @type {?} */
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
        /** @type {?} */
        const directive = this.resolvers.directive.resolve(type);
        if (directive) {
            if (!type.hasOwnProperty(NG_DIR_DEF)) {
                this.pendingDirectives.add(type);
            }
            this.seenDirectives.add(type);
            return;
        }
        /** @type {?} */
        const pipe = this.resolvers.pipe.resolve(type);
        if (pipe && !type.hasOwnProperty(NG_PIPE_DEF)) {
            this.pendingPipes.add(type);
            return;
        }
    }
    /**
     * @private
     * @param {?} arr
     * @return {?}
     */
    queueTypesFromModulesArray(arr) {
        for (const value of arr) {
            if (Array.isArray(value)) {
                this.queueTypesFromModulesArray(value);
            }
            else if (hasNgModuleDef(value)) {
                /** @nocollapse @type {?} */
                const def = value.ɵmod;
                // Look through declarations, imports, and exports, and queue everything found there.
                this.queueTypeArray(maybeUnwrapFn(def.declarations), value);
                this.queueTypesFromModulesArray(maybeUnwrapFn(def.imports));
                this.queueTypesFromModulesArray(maybeUnwrapFn(def.exports));
            }
        }
    }
    /**
     * @private
     * @param {?} prop
     * @param {?} type
     * @return {?}
     */
    maybeStoreNgDef(prop, type) {
        if (!this.initialNgDefs.has(type)) {
            /** @type {?} */
            const currentDef = Object.getOwnPropertyDescriptor(type, prop);
            this.initialNgDefs.set(type, [prop, currentDef]);
        }
    }
    /**
     * @private
     * @param {?} type
     * @param {?} defField
     * @param {?} fieldName
     * @return {?}
     */
    storeFieldOfDefOnType(type, defField, fieldName) {
        /** @type {?} */
        const def = ((/** @type {?} */ (type)))[defField];
        /** @type {?} */
        const originalValue = def[fieldName];
        this.defCleanupOps.push({ object: def, fieldName, originalValue });
    }
    /**
     * Clears current components resolution queue, but stores the state of the queue, so we can
     * restore it later. Clearing the queue is required before we try to compile components (via
     * `TestBed.compileComponents`), so that component defs are in sync with the resolution queue.
     * @private
     * @return {?}
     */
    clearComponentResolutionQueue() {
        if (this.originalComponentResolutionQueue === null) {
            this.originalComponentResolutionQueue = new Map();
        }
        clearResolutionOfComponentResourcesQueue().forEach((/**
         * @param {?} value
         * @param {?} key
         * @return {?}
         */
        (value, key) => (/** @type {?} */ (this.originalComponentResolutionQueue)).set(key, value)));
    }
    /*
       * Restores component resolution queue to the previously saved state. This operation is performed
       * as a part of restoring the state after completion of the current set of tests (that might
       * potentially mutate the state).
       */
    /**
     * @private
     * @return {?}
     */
    restoreComponentResolutionQueue() {
        if (this.originalComponentResolutionQueue !== null) {
            restoreComponentResolutionQueue(this.originalComponentResolutionQueue);
            this.originalComponentResolutionQueue = null;
        }
    }
    /**
     * @return {?}
     */
    restoreOriginalState() {
        // Process cleanup ops in reverse order so the field's original value is restored correctly (in
        // case there were multiple overrides for the same field).
        forEachRight(this.defCleanupOps, (/**
         * @param {?} op
         * @return {?}
         */
        (op) => {
            op.object[op.fieldName] = op.originalValue;
        }));
        // Restore initial component/directive/pipe defs
        this.initialNgDefs.forEach((/**
         * @param {?} value
         * @param {?} type
         * @return {?}
         */
        (value, type) => {
            const [prop, descriptor] = value;
            if (!descriptor) {
                // Delete operations are generally undesirable since they have performance implications
                // on objects they were applied to. In this particular case, situations where this code
                // is invoked should be quite rare to cause any noticeable impact, since it's applied
                // only to some test cases (for example when class with no annotations extends some
                // @Component) when we need to clear 'ɵcmp' field on a given class to restore
                // its original state (before applying overrides and running tests).
                delete ((/** @type {?} */ (type)))[prop];
            }
            else {
                Object.defineProperty(type, prop, descriptor);
            }
        }));
        this.initialNgDefs.clear();
        this.moduleProvidersOverridden.clear();
        this.restoreComponentResolutionQueue();
        if (this.originalRegisteredModules) {
            restoreRegisteredModulesState(this.originalRegisteredModules);
            this.originalRegisteredModules = null;
        }
        // Restore the locale ID to the default value, this shouldn't be necessary but we never know
        setLocaleId(DEFAULT_LOCALE_ID);
    }
    /**
     * @private
     * @return {?}
     */
    compileTestModule() {
        class RootScopeModule {
        }
        compileNgModuleDefs((/** @type {?} */ (RootScopeModule)), {
            providers: [...this.rootProviderOverrides],
        });
        /** @type {?} */
        const ngZone = new NgZone({ enableLongStackTrace: true });
        /** @type {?} */
        const providers = [
            { provide: NgZone, useValue: ngZone },
            { provide: Compiler, useFactory: (/**
                 * @return {?}
                 */
                () => new R3TestCompiler(this)) },
            ...this.providers,
            ...this.providerOverrides,
        ];
        /** @type {?} */
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
    /**
     * @return {?}
     */
    get injector() {
        if (this._injector !== null) {
            return this._injector;
        }
        /** @type {?} */
        const providers = [];
        /** @type {?} */
        const compilerOptions = this.platform.injector.get(COMPILER_OPTIONS);
        compilerOptions.forEach((/**
         * @param {?} opts
         * @return {?}
         */
        opts => {
            if (opts.providers) {
                providers.push(opts.providers);
            }
        }));
        if (this.compilerProviders !== null) {
            providers.push(...this.compilerProviders);
        }
        // TODO(ocombe): make this work with an Injector directly instead of creating a module for it
        class CompilerModule {
        }
        compileNgModuleDefs((/** @type {?} */ (CompilerModule)), { providers });
        /** @type {?} */
        const CompilerModuleFactory = new R3NgModuleFactory(CompilerModule);
        this._injector = CompilerModuleFactory.create(this.platform.injector).injector;
        return this._injector;
    }
    // get overrides for a specific provider (if any)
    /**
     * @private
     * @param {?} provider
     * @return {?}
     */
    getSingleProviderOverrides(provider) {
        /** @type {?} */
        const token = getProviderToken(provider);
        return this.providerOverridesByToken.get(token) || null;
    }
    /**
     * @private
     * @param {?=} providers
     * @return {?}
     */
    getProviderOverrides(providers) {
        if (!providers || !providers.length || this.providerOverridesByToken.size === 0)
            return [];
        // There are two flattening operations here. The inner flatten() operates on the metadata's
        // providers and applies a mapping function which retrieves overrides for each incoming
        // provider. The outer flatten() then flattens the produced overrides array. If this is not
        // done, the array can contain other empty arrays (e.g. `[[], []]`) which leak into the
        // providers array and contaminate any error messages that might be generated.
        return flatten(flatten(providers, (/**
         * @param {?} provider
         * @return {?}
         */
        (provider) => this.getSingleProviderOverrides(provider) || [])));
    }
    /**
     * @private
     * @param {?=} providers
     * @return {?}
     */
    getOverriddenProviders(providers) {
        if (!providers || !providers.length || this.providerOverridesByToken.size === 0)
            return [];
        /** @type {?} */
        const flattenedProviders = flatten(providers);
        /** @type {?} */
        const overrides = this.getProviderOverrides(flattenedProviders);
        /** @type {?} */
        const overriddenProviders = [...flattenedProviders, ...overrides];
        /** @type {?} */
        const final = [];
        /** @type {?} */
        const seenMultiProviders = new Set();
        // We iterate through the list of providers in reverse order to make sure multi provider
        // overrides take precedence over the values defined in provider list. We also filter out all
        // multi providers that have overrides, keeping overridden values only.
        forEachRight(overriddenProviders, (/**
         * @param {?} provider
         * @return {?}
         */
        (provider) => {
            /** @type {?} */
            const token = getProviderToken(provider);
            if (isMultiProvider(provider) && this.providerOverridesByToken.has(token)) {
                // Don't add overridden multi-providers twice because when you override a multi-provider, we
                // treat it as `{multi: false}` to avoid providing the same value multiple times.
                if (!seenMultiProviders.has(token)) {
                    seenMultiProviders.add(token);
                    final.unshift(Object.assign(Object.assign({}, provider), { multi: false }));
                }
            }
            else {
                final.unshift(provider);
            }
        }));
        return final;
    }
    /**
     * @private
     * @param {?=} providers
     * @return {?}
     */
    hasProviderOverrides(providers) {
        return this.getProviderOverrides(providers).length > 0;
    }
    /**
     * @private
     * @param {?} declaration
     * @param {?} field
     * @return {?}
     */
    patchDefWithProviderOverrides(declaration, field) {
        /** @type {?} */
        const def = ((/** @type {?} */ (declaration)))[field];
        if (def && def.providersResolver) {
            this.maybeStoreNgDef(field, declaration);
            /** @type {?} */
            const resolver = def.providersResolver;
            /** @type {?} */
            const processProvidersFn = (/**
             * @param {?} providers
             * @return {?}
             */
            (providers) => this.getOverriddenProviders(providers));
            this.storeFieldOfDefOnType(declaration, field, 'providersResolver');
            def.providersResolver = (/**
             * @param {?} ngDef
             * @return {?}
             */
            (ngDef) => resolver(ngDef, processProvidersFn));
        }
    }
}
if (false) {
    /**
     * @type {?}
     * @private
     */
    R3TestBedCompiler.prototype.originalComponentResolutionQueue;
    /**
     * @type {?}
     * @private
     */
    R3TestBedCompiler.prototype.originalRegisteredModules;
    /**
     * @type {?}
     * @private
     */
    R3TestBedCompiler.prototype.declarations;
    /**
     * @type {?}
     * @private
     */
    R3TestBedCompiler.prototype.imports;
    /**
     * @type {?}
     * @private
     */
    R3TestBedCompiler.prototype.providers;
    /**
     * @type {?}
     * @private
     */
    R3TestBedCompiler.prototype.schemas;
    /**
     * @type {?}
     * @private
     */
    R3TestBedCompiler.prototype.pendingComponents;
    /**
     * @type {?}
     * @private
     */
    R3TestBedCompiler.prototype.pendingDirectives;
    /**
     * @type {?}
     * @private
     */
    R3TestBedCompiler.prototype.pendingPipes;
    /**
     * @type {?}
     * @private
     */
    R3TestBedCompiler.prototype.seenComponents;
    /**
     * @type {?}
     * @private
     */
    R3TestBedCompiler.prototype.seenDirectives;
    /**
     * @type {?}
     * @private
     */
    R3TestBedCompiler.prototype.existingComponentStyles;
    /**
     * @type {?}
     * @private
     */
    R3TestBedCompiler.prototype.resolvers;
    /**
     * @type {?}
     * @private
     */
    R3TestBedCompiler.prototype.componentToModuleScope;
    /**
     * @type {?}
     * @private
     */
    R3TestBedCompiler.prototype.initialNgDefs;
    /**
     * @type {?}
     * @private
     */
    R3TestBedCompiler.prototype.defCleanupOps;
    /**
     * @type {?}
     * @private
     */
    R3TestBedCompiler.prototype._injector;
    /**
     * @type {?}
     * @private
     */
    R3TestBedCompiler.prototype.compilerProviders;
    /**
     * @type {?}
     * @private
     */
    R3TestBedCompiler.prototype.providerOverrides;
    /**
     * @type {?}
     * @private
     */
    R3TestBedCompiler.prototype.rootProviderOverrides;
    /**
     * @type {?}
     * @private
     */
    R3TestBedCompiler.prototype.providerOverridesByToken;
    /**
     * @type {?}
     * @private
     */
    R3TestBedCompiler.prototype.moduleProvidersOverridden;
    /**
     * @type {?}
     * @private
     */
    R3TestBedCompiler.prototype.testModuleType;
    /**
     * @type {?}
     * @private
     */
    R3TestBedCompiler.prototype.testModuleRef;
    /**
     * @type {?}
     * @private
     */
    R3TestBedCompiler.prototype.platform;
    /**
     * @type {?}
     * @private
     */
    R3TestBedCompiler.prototype.additionalModuleTypes;
}
/**
 * @return {?}
 */
function initResolvers() {
    return {
        module: new NgModuleResolver(),
        component: new ComponentResolver(),
        directive: new DirectiveResolver(),
        pipe: new PipeResolver()
    };
}
/**
 * @template T
 * @param {?} value
 * @return {?}
 */
function hasNgModuleDef(value) {
    return value.hasOwnProperty('ɵmod');
}
/**
 * @template T
 * @param {?} maybeFn
 * @return {?}
 */
function maybeUnwrapFn(maybeFn) {
    return maybeFn instanceof Function ? maybeFn() : maybeFn;
}
/**
 * @template T
 * @param {?} values
 * @param {?=} mapFn
 * @return {?}
 */
function flatten(values, mapFn) {
    /** @type {?} */
    const out = [];
    values.forEach((/**
     * @param {?} value
     * @return {?}
     */
    value => {
        if (Array.isArray(value)) {
            out.push(...flatten(value, mapFn));
        }
        else {
            out.push(mapFn ? mapFn(value) : value);
        }
    }));
    return out;
}
/**
 * @param {?} provider
 * @param {?} field
 * @return {?}
 */
function getProviderField(provider, field) {
    return provider && typeof provider === 'object' && ((/** @type {?} */ (provider)))[field];
}
/**
 * @param {?} provider
 * @return {?}
 */
function getProviderToken(provider) {
    return getProviderField(provider, 'provide') || provider;
}
/**
 * @param {?} provider
 * @return {?}
 */
function isMultiProvider(provider) {
    return !!getProviderField(provider, 'multi');
}
/**
 * @param {?} value
 * @return {?}
 */
function isModuleWithProviders(value) {
    return value.hasOwnProperty('ngModule');
}
/**
 * @template T
 * @param {?} values
 * @param {?} fn
 * @return {?}
 */
function forEachRight(values, fn) {
    for (let idx = values.length - 1; idx >= 0; idx--) {
        fn(values[idx], idx);
    }
}
class R3TestCompiler {
    /**
     * @param {?} testBed
     */
    constructor(testBed) {
        this.testBed = testBed;
    }
    /**
     * @template T
     * @param {?} moduleType
     * @return {?}
     */
    compileModuleSync(moduleType) {
        this.testBed._compileNgModuleSync(moduleType);
        return new R3NgModuleFactory(moduleType);
    }
    /**
     * @template T
     * @param {?} moduleType
     * @return {?}
     */
    compileModuleAsync(moduleType) {
        return __awaiter(this, void 0, void 0, /** @this {!R3TestCompiler} */ function* () {
            yield this.testBed._compileNgModuleAsync(moduleType);
            return new R3NgModuleFactory(moduleType);
        });
    }
    /**
     * @template T
     * @param {?} moduleType
     * @return {?}
     */
    compileModuleAndAllComponentsSync(moduleType) {
        /** @type {?} */
        const ngModuleFactory = this.compileModuleSync(moduleType);
        /** @type {?} */
        const componentFactories = this.testBed._getComponentFactories((/** @type {?} */ (moduleType)));
        return new ModuleWithComponentFactories(ngModuleFactory, componentFactories);
    }
    /**
     * @template T
     * @param {?} moduleType
     * @return {?}
     */
    compileModuleAndAllComponentsAsync(moduleType) {
        return __awaiter(this, void 0, void 0, /** @this {!R3TestCompiler} */ function* () {
            /** @type {?} */
            const ngModuleFactory = yield this.compileModuleAsync(moduleType);
            /** @type {?} */
            const componentFactories = this.testBed._getComponentFactories((/** @type {?} */ (moduleType)));
            return new ModuleWithComponentFactories(ngModuleFactory, componentFactories);
        });
    }
    /**
     * @return {?}
     */
    clearCache() { }
    /**
     * @param {?} type
     * @return {?}
     */
    clearCacheFor(type) { }
    /**
     * @param {?} moduleType
     * @return {?}
     */
    getModuleId(moduleType) {
        /** @type {?} */
        const meta = this.testBed._getModuleResolver().resolve(moduleType);
        return meta && meta.id || undefined;
    }
}
if (false) {
    /**
     * @type {?}
     * @private
     */
    R3TestCompiler.prototype.testBed;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicjNfdGVzdF9iZWRfY29tcGlsZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3Rlc3Rpbmcvc3JjL3IzX3Rlc3RfYmVkX2NvbXBpbGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQVFBLE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUNqRCxPQUFPLEVBQUMscUJBQXFCLEVBQUUsZ0JBQWdCLEVBQUUsUUFBUSxFQUFrQyxTQUFTLEVBQUUsNEJBQTRCLEVBQWtELE1BQU0sRUFBcUMsa0JBQWtCLElBQUksaUJBQWlCLEVBQWlDLFlBQVksSUFBSSxXQUFXLEVBQUUsV0FBVyxJQUFJLFVBQVUsRUFBRSxXQUFXLElBQUksVUFBVSxFQUFFLFdBQVcsSUFBSSxVQUFVLEVBQUUsWUFBWSxJQUFJLFdBQVcsRUFBRSxnQkFBZ0IsSUFBSSxpQkFBaUIsRUFBd0Ysd0JBQXdCLElBQUksZ0JBQWdCLEVBQUUsbUJBQW1CLElBQUksV0FBVyxFQUFFLGlCQUFpQixJQUFJLGdCQUFnQixFQUFFLGlCQUFpQixJQUFJLGdCQUFnQixFQUFFLG9CQUFvQixJQUFJLG1CQUFtQixFQUFFLFlBQVksSUFBSSxXQUFXLEVBQUUsaUJBQWlCLElBQUksZ0JBQWdCLEVBQUUsMkJBQTJCLElBQUksMEJBQTBCLEVBQUUsWUFBWSxJQUFJLFdBQVcsRUFBRSxvQkFBb0IsSUFBSSxtQkFBbUIsRUFBbUMsTUFBTSxlQUFlLENBQUM7QUFDNS9CLE9BQU8sRUFBd0IseUJBQXlCLEVBQUUsNkJBQTZCLEVBQUMsTUFBTSxpREFBaUQsQ0FBQztBQUVoSixPQUFPLEVBQUMsd0NBQXdDLEVBQUUsK0JBQStCLEVBQUUseUJBQXlCLEVBQUUsK0JBQStCLEVBQUMsTUFBTSxxQ0FBcUMsQ0FBQztBQUcxTCxPQUFPLEVBQUMsaUJBQWlCLEVBQUUsaUJBQWlCLEVBQUUsZ0JBQWdCLEVBQUUsWUFB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QUFJLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxrQkFBa0IsRUFBRSxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUM7UUFDbEUsT0FBTyxJQUFJLElBQUksSUFBSSxDQUFDLEVBQUUsSUFBSSxTQUFTLENBQUM7SUFDdEMsQ0FBQztDQUNGOzs7Ozs7SUFqQ2EsaUNBQWtDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1Jlc291cmNlTG9hZGVyfSBmcm9tICdAYW5ndWxhci9jb21waWxlcic7XG5pbXBvcnQge0FwcGxpY2F0aW9uSW5pdFN0YXR1cywgQ09NUElMRVJfT1BUSU9OUywgQ29tcGlsZXIsIENvbXBvbmVudCwgRGlyZWN0aXZlLCBJbmplY3RvciwgTE9DQUxFX0lELCBNb2R1bGVXaXRoQ29tcG9uZW50RmFjdG9yaWVzLCBNb2R1bGVXaXRoUHJvdmlkZXJzLCBOZ01vZHVsZSwgTmdNb2R1bGVGYWN0b3J5LCBOZ1pvbmUsIFBpcGUsIFBsYXRmb3JtUmVmLCBQcm92aWRlciwgVHlwZSwgybVERUZBVUxUX0xPQ0FMRV9JRCBhcyBERUZBVUxUX0xPQ0FMRV9JRCwgybVEaXJlY3RpdmVEZWYgYXMgRGlyZWN0aXZlRGVmLCDJtU5HX0NPTVBfREVGIGFzIE5HX0NPTVBfREVGLCDJtU5HX0RJUl9ERUYgYXMgTkdfRElSX0RFRiwgybVOR19JTkpfREVGIGFzIE5HX0lOSl9ERUYsIMm1TkdfTU9EX0RFRiBhcyBOR19NT0RfREVGLCDJtU5HX1BJUEVfREVGIGFzIE5HX1BJUEVfREVGLCDJtU5nTW9kdWxlRmFjdG9yeSBhcyBSM05nTW9kdWxlRmFjdG9yeSwgybVOZ01vZHVsZVRyYW5zaXRpdmVTY29wZXMgYXMgTmdNb2R1bGVUcmFuc2l0aXZlU2NvcGVzLCDJtU5nTW9kdWxlVHlwZSBhcyBOZ01vZHVsZVR5cGUsIMm1UmVuZGVyM0NvbXBvbmVudEZhY3RvcnkgYXMgQ29tcG9uZW50RmFjdG9yeSwgybVSZW5kZXIzTmdNb2R1bGVSZWYgYXMgTmdNb2R1bGVSZWYsIMm1Y29tcGlsZUNvbXBvbmVudCBhcyBjb21waWxlQ29tcG9uZW50LCDJtWNvbXBpbGVEaXJlY3RpdmUgYXMgY29tcGlsZURpcmVjdGl2ZSwgybVjb21waWxlTmdNb2R1bGVEZWZzIGFzIGNvbXBpbGVOZ01vZHVsZURlZnMsIMm1Y29tcGlsZVBpcGUgYXMgY29tcGlsZVBpcGUsIMm1Z2V0SW5qZWN0YWJsZURlZiBhcyBnZXRJbmplY3RhYmxlRGVmLCDJtXBhdGNoQ29tcG9uZW50RGVmV2l0aFNjb3BlIGFzIHBhdGNoQ29tcG9uZW50RGVmV2l0aFNjb3BlLCDJtXNldExvY2FsZUlkIGFzIHNldExvY2FsZUlkLCDJtXRyYW5zaXRpdmVTY29wZXNGb3IgYXMgdHJhbnNpdGl2ZVNjb3Blc0ZvciwgybXJtUluamVjdGFibGVEZWYgYXMgSW5qZWN0YWJsZURlZn0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge01vZHVsZVJlZ2lzdHJhdGlvbk1hcCwgZ2V0UmVnaXN0ZXJlZE1vZHVsZXNTdGF0ZSwgcmVzdG9yZVJlZ2lzdGVyZWRNb2R1bGVzU3RhdGV9IGZyb20gJy4uLy4uL3NyYy9saW5rZXIvbmdfbW9kdWxlX2ZhY3RvcnlfcmVnaXN0cmF0aW9uJztcblxuaW1wb3J0IHtjbGVhclJlc29sdXRpb25PZkNvbXBvbmVudFJlc291cmNlc1F1ZXVlLCBpc0NvbXBvbmVudERlZlBlbmRpbmdSZXNvbHV0aW9uLCByZXNvbHZlQ29tcG9uZW50UmVzb3VyY2VzLCByZXN0b3JlQ29tcG9uZW50UmVzb2x1dGlvblF1ZXVlfSBmcm9tICcuLi8uLi9zcmMvbWV0YWRhdGEvcmVzb3VyY2VfbG9hZGluZyc7XG5cbmltcG9ydCB7TWV0YWRhdGFPdmVycmlkZX0gZnJvbSAnLi9tZXRhZGF0YV9vdmVycmlkZSc7XG5pbXBvcnQge0NvbXBvbmVudFJlc29sdmVyLCBEaXJlY3RpdmVSZXNvbHZlciwgTmdNb2R1bGVSZXNvbHZlciwgUGlwZVJlc29sdmVyLCBSZXNvbHZlcn0gZnJvbSAnLi9yZXNvbHZlcnMnO1xuaW1wb3J0IHtUZXN0TW9kdWxlTWV0YWRhdGF9IGZyb20gJy4vdGVzdF9iZWRfY29tbW9uJztcblxuZW51bSBUZXN0aW5nTW9kdWxlT3ZlcnJpZGUge1xuICBERUNMQVJBVElPTixcbiAgT1ZFUlJJREVfVEVNUExBVEUsXG59XG5cbmZ1bmN0aW9uIGlzVGVzdGluZ01vZHVsZU92ZXJyaWRlKHZhbHVlOiB1bmtub3duKTogdmFsdWUgaXMgVGVzdGluZ01vZHVsZU92ZXJyaWRlIHtcbiAgcmV0dXJuIHZhbHVlID09PSBUZXN0aW5nTW9kdWxlT3ZlcnJpZGUuREVDTEFSQVRJT04gfHxcbiAgICAgIHZhbHVlID09PSBUZXN0aW5nTW9kdWxlT3ZlcnJpZGUuT1ZFUlJJREVfVEVNUExBVEU7XG59XG5cbi8vIFJlc29sdmVycyBmb3IgQW5ndWxhciBkZWNvcmF0b3JzXG50eXBlIFJlc29sdmVycyA9IHtcbiAgbW9kdWxlOiBSZXNvbHZlcjxOZ01vZHVsZT4sXG4gIGNvbXBvbmVudDogUmVzb2x2ZXI8RGlyZWN0aXZlPixcbiAgZGlyZWN0aXZlOiBSZXNvbHZlcjxDb21wb25lbnQ+LFxuICBwaXBlOiBSZXNvbHZlcjxQaXBlPixcbn07XG5cbmludGVyZmFjZSBDbGVhbnVwT3BlcmF0aW9uIHtcbiAgZmllbGROYW1lOiBzdHJpbmc7XG4gIG9iamVjdDogYW55O1xuICBvcmlnaW5hbFZhbHVlOiB1bmtub3duO1xufVxuXG5leHBvcnQgY2xhc3MgUjNUZXN0QmVkQ29tcGlsZXIge1xuICBwcml2YXRlIG9yaWdpbmFsQ29tcG9uZW50UmVzb2x1dGlvblF1ZXVlOiBNYXA8VHlwZTxhbnk+LCBDb21wb25lbnQ+fG51bGwgPSBudWxsO1xuICBwcml2YXRlIG9yaWdpbmFsUmVnaXN0ZXJlZE1vZHVsZXM6IG51bGx8TW9kdWxlUmVnaXN0cmF0aW9uTWFwID0gbnVsbDtcblxuICAvLyBUZXN0aW5nIG1vZHVsZSBjb25maWd1cmF0aW9uXG4gIHByaXZhdGUgZGVjbGFyYXRpb25zOiBUeXBlPGFueT5bXSA9IFtdO1xuICBwcml2YXRlIGltcG9ydHM6IFR5cGU8YW55PltdID0gW107XG4gIHByaXZhdGUgcHJvdmlkZXJzOiBQcm92aWRlcltdID0gW107XG4gIHByaXZhdGUgc2NoZW1hczogYW55W10gPSBbXTtcblxuICAvLyBRdWV1ZXMgb2YgY29tcG9uZW50cy9kaXJlY3RpdmVzL3BpcGVzIHRoYXQgc2hvdWxkIGJlIHJlY29tcGlsZWQuXG4gIHByaXZhdGUgcGVuZGluZ0NvbXBvbmVudHMgPSBuZXcgU2V0PFR5cGU8YW55Pj4oKTtcbiAgcHJpdmF0ZSBwZW5kaW5nRGlyZWN0aXZlcyA9IG5ldyBTZXQ8VHlwZTxhbnk+PigpO1xuICBwcml2YXRlIHBlbmRpbmdQaXBlcyA9IG5ldyBTZXQ8VHlwZTxhbnk+PigpO1xuXG4gIC8vIEtlZXAgdHJhY2sgb2YgYWxsIGNvbXBvbmVudHMgYW5kIGRpcmVjdGl2ZXMsIHNvIHdlIGNhbiBwYXRjaCBQcm92aWRlcnMgb250byBkZWZzIGxhdGVyLlxuICBwcml2YXRlIHNlZW5Db21wb25lbnRzID0gbmV3IFNldDxUeXBlPGFueT4+KCk7XG4gIHByaXZhdGUgc2VlbkRpcmVjdGl2ZXMgPSBuZXcgU2V0PFR5cGU8YW55Pj4oKTtcblxuICAvLyBTdG9yZSByZXNvbHZlZCBzdHlsZXMgZm9yIENvbXBvbmVudHMgdGhhdCBoYXZlIHRlbXBsYXRlIG92ZXJyaWRlcyBwcmVzZW50IGFuZCBgc3R5bGVVcmxzYFxuICAvLyBkZWZpbmVkIGF0IHRoZSBzYW1lIHRpbWUuXG4gIHByaXZhdGUgZXhpc3RpbmdDb21wb25lbnRTdHlsZXMgPSBuZXcgTWFwPFR5cGU8YW55Piwgc3RyaW5nW10+KCk7XG5cbiAgcHJpdmF0ZSByZXNvbHZlcnM6IFJlc29sdmVycyA9IGluaXRSZXNvbHZlcnMoKTtcblxuICBwcml2YXRlIGNvbXBvbmVudFRvTW9kdWxlU2NvcGUgPSBuZXcgTWFwPFR5cGU8YW55PiwgVHlwZTxhbnk+fFRlc3RpbmdNb2R1bGVPdmVycmlkZT4oKTtcblxuICAvLyBNYXAgdGhhdCBrZWVwcyBpbml0aWFsIHZlcnNpb24gb2YgY29tcG9uZW50L2RpcmVjdGl2ZS9waXBlIGRlZnMgaW4gY2FzZVxuICAvLyB3ZSBjb21waWxlIGEgVHlwZSBhZ2FpbiwgdGh1cyBvdmVycmlkaW5nIHJlc3BlY3RpdmUgc3RhdGljIGZpZWxkcy4gVGhpcyBpc1xuICAvLyByZXF1aXJlZCB0byBtYWtlIHN1cmUgd2UgcmVzdG9yZSBkZWZzIHRvIHRoZWlyIGluaXRpYWwgc3RhdGVzIGJldHdlZW4gdGVzdCBydW5zXG4gIC8vIFRPRE86IHdlIHNob3VsZCBzdXBwb3J0IHRoZSBjYXNlIHdpdGggbXVsdGlwbGUgZGVmcyBvbiBhIHR5cGVcbiAgcHJpdmF0ZSBpbml0aWFsTmdEZWZzID0gbmV3IE1hcDxUeXBlPGFueT4sIFtzdHJpbmcsIFByb3BlcnR5RGVzY3JpcHRvcnx1bmRlZmluZWRdPigpO1xuXG4gIC8vIEFycmF5IHRoYXQga2VlcHMgY2xlYW51cCBvcGVyYXRpb25zIGZvciBpbml0aWFsIHZlcnNpb25zIG9mIGNvbXBvbmVudC9kaXJlY3RpdmUvcGlwZS9tb2R1bGVcbiAgLy8gZGVmcyBpbiBjYXNlIFRlc3RCZWQgbWFrZXMgY2hhbmdlcyB0byB0aGUgb3JpZ2luYWxzLlxuICBwcml2YXRlIGRlZkNsZWFudXBPcHM6IENsZWFudXBPcGVyYXRpb25bXSA9IFtdO1xuXG4gIHByaXZhdGUgX2luamVjdG9yOiBJbmplY3RvcnxudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBjb21waWxlclByb3ZpZGVyczogUHJvdmlkZXJbXXxudWxsID0gbnVsbDtcblxuICBwcml2YXRlIHByb3ZpZGVyT3ZlcnJpZGVzOiBQcm92aWRlcltdID0gW107XG4gIHByaXZhdGUgcm9vdFByb3ZpZGVyT3ZlcnJpZGVzOiBQcm92aWRlcltdID0gW107XG4gIHByaXZhdGUgcHJvdmlkZXJPdmVycmlkZXNCeVRva2VuID0gbmV3IE1hcDxhbnksIFByb3ZpZGVyPigpO1xuICBwcml2YXRlIG1vZHVsZVByb3ZpZGVyc092ZXJyaWRkZW4gPSBuZXcgU2V0PFR5cGU8YW55Pj4oKTtcblxuICBwcml2YXRlIHRlc3RNb2R1bGVUeXBlOiBOZ01vZHVsZVR5cGU8YW55PjtcbiAgcHJpdmF0ZSB0ZXN0TW9kdWxlUmVmOiBOZ01vZHVsZVJlZjxhbnk+fG51bGwgPSBudWxsO1xuXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgcGxhdGZvcm06IFBsYXRmb3JtUmVmLCBwcml2YXRlIGFkZGl0aW9uYWxNb2R1bGVUeXBlczogVHlwZTxhbnk+fFR5cGU8YW55PltdKSB7XG4gICAgY2xhc3MgRHluYW1pY1Rlc3RNb2R1bGUge31cbiAgICB0aGlzLnRlc3RNb2R1bGVUeXBlID0gRHluYW1pY1Rlc3RNb2R1bGUgYXMgYW55O1xuICB9XG5cbiAgc2V0Q29tcGlsZXJQcm92aWRlcnMocHJvdmlkZXJzOiBQcm92aWRlcltdfG51bGwpOiB2b2lkIHtcbiAgICB0aGlzLmNvbXBpbGVyUHJvdmlkZXJzID0gcHJvdmlkZXJzO1xuICAgIHRoaXMuX2luamVjdG9yID0gbnVsbDtcbiAgfVxuXG4gIGNvbmZpZ3VyZVRlc3RpbmdNb2R1bGUobW9kdWxlRGVmOiBUZXN0TW9kdWxlTWV0YWRhdGEpOiB2b2lkIHtcbiAgICAvLyBFbnF1ZXVlIGFueSBjb21waWxhdGlvbiB0YXNrcyBmb3IgdGhlIGRpcmVjdGx5IGRlY2xhcmVkIGNvbXBvbmVudC5cbiAgICBpZiAobW9kdWxlRGVmLmRlY2xhcmF0aW9ucyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzLnF1ZXVlVHlwZUFycmF5KG1vZHVsZURlZi5kZWNsYXJhdGlvbnMsIFRlc3RpbmdNb2R1bGVPdmVycmlkZS5ERUNMQVJBVElPTik7XG4gICAgICB0aGlzLmRlY2xhcmF0aW9ucy5wdXNoKC4uLm1vZHVsZURlZi5kZWNsYXJhdGlvbnMpO1xuICAgIH1cblxuICAgIC8vIEVucXVldWUgYW55IGNvbXBpbGF0aW9uIHRhc2tzIGZvciBpbXBvcnRlZCBtb2R1bGVzLlxuICAgIGlmIChtb2R1bGVEZWYuaW1wb3J0cyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzLnF1ZXVlVHlwZXNGcm9tTW9kdWxlc0FycmF5KG1vZHVsZURlZi5pbXBvcnRzKTtcbiAgICAgIHRoaXMuaW1wb3J0cy5wdXNoKC4uLm1vZHVsZURlZi5pbXBvcnRzKTtcbiAgICB9XG5cbiAgICBpZiAobW9kdWxlRGVmLnByb3ZpZGVycyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzLnByb3ZpZGVycy5wdXNoKC4uLm1vZHVsZURlZi5wcm92aWRlcnMpO1xuICAgIH1cblxuICAgIGlmIChtb2R1bGVEZWYuc2NoZW1hcyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzLnNjaGVtYXMucHVzaCguLi5tb2R1bGVEZWYuc2NoZW1hcyk7XG4gICAgfVxuICB9XG5cbiAgb3ZlcnJpZGVNb2R1bGUobmdNb2R1bGU6IFR5cGU8YW55Piwgb3ZlcnJpZGU6IE1ldGFkYXRhT3ZlcnJpZGU8TmdNb2R1bGU+KTogdm9pZCB7XG4gICAgLy8gQ29tcGlsZSB0aGUgbW9kdWxlIHJpZ2h0IGF3YXkuXG4gICAgdGhpcy5yZXNvbHZlcnMubW9kdWxlLmFkZE92ZXJyaWRlKG5nTW9kdWxlLCBvdmVycmlkZSk7XG4gICAgY29uc3QgbWV0YWRhdGEgPSB0aGlzLnJlc29sdmVycy5tb2R1bGUucmVzb2x2ZShuZ01vZHVsZSk7XG4gICAgaWYgKG1ldGFkYXRhID09PSBudWxsKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYCR7bmdNb2R1bGUubmFtZX0gaXMgbm90IGFuIEBOZ01vZHVsZSBvciBpcyBtaXNzaW5nIG1ldGFkYXRhYCk7XG4gICAgfVxuXG4gICAgdGhpcy5yZWNvbXBpbGVOZ01vZHVsZShuZ01vZHVsZSk7XG5cbiAgICAvLyBBdCB0aGlzIHBvaW50LCB0aGUgbW9kdWxlIGhhcyBhIHZhbGlkIG1vZHVsZSBkZWYgKMm1bW9kKSwgYnV0IHRoZSBvdmVycmlkZSBtYXkgaGF2ZSBpbnRyb2R1Y2VkXG4gICAgLy8gbmV3IGRlY2xhcmF0aW9ucyBvciBpbXBvcnRlZCBtb2R1bGVzLiBJbmdlc3QgYW55IHBvc3NpYmxlIG5ldyB0eXBlcyBhbmQgYWRkIHRoZW0gdG8gdGhlXG4gICAgLy8gY3VycmVudCBxdWV1ZS5cbiAgICB0aGlzLnF1ZXVlVHlwZXNGcm9tTW9kdWxlc0FycmF5KFtuZ01vZHVsZV0pO1xuICB9XG5cbiAgb3ZlcnJpZGVDb21wb25lbnQoY29tcG9uZW50OiBUeXBlPGFueT4sIG92ZXJyaWRlOiBNZXRhZGF0YU92ZXJyaWRlPENvbXBvbmVudD4pOiB2b2lkIHtcbiAgICB0aGlzLnJlc29sdmVycy5jb21wb25lbnQuYWRkT3ZlcnJpZGUoY29tcG9uZW50LCBvdmVycmlkZSk7XG4gICAgdGhpcy5wZW5kaW5nQ29tcG9uZW50cy5hZGQoY29tcG9uZW50KTtcbiAgfVxuXG4gIG92ZXJyaWRlRGlyZWN0aXZlKGRpcmVjdGl2ZTogVHlwZTxhbnk+LCBvdmVycmlkZTogTWV0YWRhdGFPdmVycmlkZTxEaXJlY3RpdmU+KTogdm9pZCB7XG4gICAgdGhpcy5yZXNvbHZlcnMuZGlyZWN0aXZlLmFkZE92ZXJyaWRlKGRpcmVjdGl2ZSwgb3ZlcnJpZGUpO1xuICAgIHRoaXMucGVuZGluZ0RpcmVjdGl2ZXMuYWRkKGRpcmVjdGl2ZSk7XG4gIH1cblxuICBvdmVycmlkZVBpcGUocGlwZTogVHlwZTxhbnk+LCBvdmVycmlkZTogTWV0YWRhdGFPdmVycmlkZTxQaXBlPik6IHZvaWQge1xuICAgIHRoaXMucmVzb2x2ZXJzLnBpcGUuYWRkT3ZlcnJpZGUocGlwZSwgb3ZlcnJpZGUpO1xuICAgIHRoaXMucGVuZGluZ1BpcGVzLmFkZChwaXBlKTtcbiAgfVxuXG4gIG92ZXJyaWRlUHJvdmlkZXIoXG4gICAgICB0b2tlbjogYW55LFxuICAgICAgcHJvdmlkZXI6IHt1c2VGYWN0b3J5PzogRnVuY3Rpb24sIHVzZVZhbHVlPzogYW55LCBkZXBzPzogYW55W10sIG11bHRpPzogYm9vbGVhbn0pOiB2b2lkIHtcbiAgICBjb25zdCBwcm92aWRlckRlZiA9IHByb3ZpZGVyLnVzZUZhY3RvcnkgP1xuICAgICAgICB7XG4gICAgICAgICAgcHJvdmlkZTogdG9rZW4sXG4gICAgICAgICAgdXNlRmFjdG9yeTogcHJvdmlkZXIudXNlRmFjdG9yeSxcbiAgICAgICAgICBkZXBzOiBwcm92aWRlci5kZXBzIHx8IFtdLFxuICAgICAgICAgIG11bHRpOiBwcm92aWRlci5tdWx0aVxuICAgICAgICB9IDpcbiAgICAgICAge3Byb3ZpZGU6IHRva2VuLCB1c2VWYWx1ZTogcHJvdmlkZXIudXNlVmFsdWUsIG11bHRpOiBwcm92aWRlci5tdWx0aX07XG5cbiAgICBsZXQgaW5qZWN0YWJsZURlZjogSW5qZWN0YWJsZURlZjxhbnk+fG51bGw7XG4gICAgY29uc3QgaXNSb290ID1cbiAgICAgICAgKHR5cGVvZiB0b2tlbiAhPT0gJ3N0cmluZycgJiYgKGluamVjdGFibGVEZWYgPSBnZXRJbmplY3RhYmxlRGVmKHRva2VuKSkgJiZcbiAgICAgICAgIGluamVjdGFibGVEZWYucHJvdmlkZWRJbiA9PT0gJ3Jvb3QnKTtcbiAgICBjb25zdCBvdmVycmlkZXNCdWNrZXQgPSBpc1Jvb3QgPyB0aGlzLnJvb3RQcm92aWRlck92ZXJyaWRlcyA6IHRoaXMucHJvdmlkZXJPdmVycmlkZXM7XG4gICAgb3ZlcnJpZGVzQnVja2V0LnB1c2gocHJvdmlkZXJEZWYpO1xuXG4gICAgLy8gS2VlcCBvdmVycmlkZXMgZ3JvdXBlZCBieSB0b2tlbiBhcyB3ZWxsIGZvciBmYXN0IGxvb2t1cHMgdXNpbmcgdG9rZW5cbiAgICB0aGlzLnByb3ZpZGVyT3ZlcnJpZGVzQnlUb2tlbi5zZXQodG9rZW4sIHByb3ZpZGVyRGVmKTtcbiAgfVxuXG4gIG92ZXJyaWRlVGVtcGxhdGVVc2luZ1Rlc3RpbmdNb2R1bGUodHlwZTogVHlwZTxhbnk+LCB0ZW1wbGF0ZTogc3RyaW5nKTogdm9pZCB7XG4gICAgY29uc3QgZGVmID0gKHR5cGUgYXMgYW55KVtOR19DT01QX0RFRl07XG4gICAgY29uc3QgaGFzU3R5bGVVcmxzID0gKCk6IGJvb2xlYW4gPT4ge1xuICAgICAgY29uc3QgbWV0YWRhdGEgPSB0aGlzLnJlc29sdmVycy5jb21wb25lbnQucmVzb2x2ZSh0eXBlKSAhYXMgQ29tcG9uZW50O1xuICAgICAgcmV0dXJuICEhbWV0YWRhdGEuc3R5bGVVcmxzICYmIG1ldGFkYXRhLnN0eWxlVXJscy5sZW5ndGggPiAwO1xuICAgIH07XG4gICAgY29uc3Qgb3ZlcnJpZGVTdHlsZVVybHMgPSAhIWRlZiAmJiAhaXNDb21wb25lbnREZWZQZW5kaW5nUmVzb2x1dGlvbih0eXBlKSAmJiBoYXNTdHlsZVVybHMoKTtcblxuICAgIC8vIEluIEl2eSwgY29tcGlsaW5nIGEgY29tcG9uZW50IGRvZXMgbm90IHJlcXVpcmUga25vd2luZyB0aGUgbW9kdWxlIHByb3ZpZGluZyB0aGVcbiAgICAvLyBjb21wb25lbnQncyBzY29wZSwgc28gb3ZlcnJpZGVUZW1wbGF0ZVVzaW5nVGVzdGluZ01vZHVsZSBjYW4gYmUgaW1wbGVtZW50ZWQgcHVyZWx5IHZpYVxuICAgIC8vIG92ZXJyaWRlQ29tcG9uZW50LiBJbXBvcnRhbnQ6IG92ZXJyaWRpbmcgdGVtcGxhdGUgcmVxdWlyZXMgZnVsbCBDb21wb25lbnQgcmUtY29tcGlsYXRpb24sXG4gICAgLy8gd2hpY2ggbWF5IGZhaWwgaW4gY2FzZSBzdHlsZVVybHMgYXJlIGFsc28gcHJlc2VudCAodGh1cyBDb21wb25lbnQgaXMgY29uc2lkZXJlZCBhcyByZXF1aXJlZFxuICAgIC8vIHJlc29sdXRpb24pLiBJbiBvcmRlciB0byBhdm9pZCB0aGlzLCB3ZSBwcmVlbXB0aXZlbHkgc2V0IHN0eWxlVXJscyB0byBhbiBlbXB0eSBhcnJheSxcbiAgICAvLyBwcmVzZXJ2ZSBjdXJyZW50IHN0eWxlcyBhdmFpbGFibGUgb24gQ29tcG9uZW50IGRlZiBhbmQgcmVzdG9yZSBzdHlsZXMgYmFjayBvbmNlIGNvbXBpbGF0aW9uXG4gICAgLy8gaXMgY29tcGxldGUuXG4gICAgY29uc3Qgb3ZlcnJpZGUgPSBvdmVycmlkZVN0eWxlVXJscyA/IHt0ZW1wbGF0ZSwgc3R5bGVzOiBbXSwgc3R5bGVVcmxzOiBbXX0gOiB7dGVtcGxhdGV9O1xuICAgIHRoaXMub3ZlcnJpZGVDb21wb25lbnQodHlwZSwge3NldDogb3ZlcnJpZGV9KTtcblxuICAgIGlmIChvdmVycmlkZVN0eWxlVXJscyAmJiBkZWYuc3R5bGVzICYmIGRlZi5zdHlsZXMubGVuZ3RoID4gMCkge1xuICAgICAgdGhpcy5leGlzdGluZ0NvbXBvbmVudFN0eWxlcy5zZXQodHlwZSwgZGVmLnN0eWxlcyk7XG4gICAgfVxuXG4gICAgLy8gU2V0IHRoZSBjb21wb25lbnQncyBzY29wZSB0byBiZSB0aGUgdGVzdGluZyBtb2R1bGUuXG4gICAgdGhpcy5jb21wb25lbnRUb01vZHVsZVNjb3BlLnNldCh0eXBlLCBUZXN0aW5nTW9kdWxlT3ZlcnJpZGUuT1ZFUlJJREVfVEVNUExBVEUpO1xuICB9XG5cbiAgYXN5bmMgY29tcGlsZUNvbXBvbmVudHMoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdGhpcy5jbGVhckNvbXBvbmVudFJlc29sdXRpb25RdWV1ZSgpO1xuICAgIC8vIFJ1biBjb21waWxlcnMgZm9yIGFsbCBxdWV1ZWQgdHlwZXMuXG4gICAgbGV0IG5lZWRzQXN5bmNSZXNvdXJjZXMgPSB0aGlzLmNvbXBpbGVUeXBlc1N5bmMoKTtcblxuICAgIC8vIGNvbXBpbGVDb21wb25lbnRzKCkgc2hvdWxkIG5vdCBiZSBhc3luYyB1bmxlc3MgaXQgbmVlZHMgdG8gYmUuXG4gICAgaWYgKG5lZWRzQXN5bmNSZXNvdXJjZXMpIHtcbiAgICAgIGxldCByZXNvdXJjZUxvYWRlcjogUmVzb3VyY2VMb2FkZXI7XG4gICAgICBsZXQgcmVzb2x2ZXIgPSAodXJsOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4gPT4ge1xuICAgICAgICBpZiAoIXJlc291cmNlTG9hZGVyKSB7XG4gICAgICAgICAgcmVzb3VyY2VMb2FkZXIgPSB0aGlzLmluamVjdG9yLmdldChSZXNvdXJjZUxvYWRlcik7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShyZXNvdXJjZUxvYWRlci5nZXQodXJsKSk7XG4gICAgICB9O1xuICAgICAgYXdhaXQgcmVzb2x2ZUNvbXBvbmVudFJlc291cmNlcyhyZXNvbHZlcik7XG4gICAgfVxuICB9XG5cbiAgZmluYWxpemUoKTogTmdNb2R1bGVSZWY8YW55PiB7XG4gICAgLy8gT25lIGxhc3QgY29tcGlsZVxuICAgIHRoaXMuY29tcGlsZVR5cGVzU3luYygpO1xuXG4gICAgLy8gQ3JlYXRlIHRoZSB0ZXN0aW5nIG1vZHVsZSBpdHNlbGYuXG4gICAgdGhpcy5jb21waWxlVGVzdE1vZHVsZSgpO1xuXG4gICAgdGhpcy5hcHBseVRyYW5zaXRpdmVTY29wZXMoKTtcblxuICAgIHRoaXMuYXBwbHlQcm92aWRlck92ZXJyaWRlcygpO1xuXG4gICAgLy8gUGF0Y2ggcHJldmlvdXNseSBzdG9yZWQgYHN0eWxlc2AgQ29tcG9uZW50IHZhbHVlcyAodGFrZW4gZnJvbSDJtWNtcCksIGluIGNhc2UgdGhlc2VcbiAgICAvLyBDb21wb25lbnRzIGhhdmUgYHN0eWxlVXJsc2AgZmllbGRzIGRlZmluZWQgYW5kIHRlbXBsYXRlIG92ZXJyaWRlIHdhcyByZXF1ZXN0ZWQuXG4gICAgdGhpcy5wYXRjaENvbXBvbmVudHNXaXRoRXhpc3RpbmdTdHlsZXMoKTtcblxuICAgIC8vIENsZWFyIHRoZSBjb21wb25lbnRUb01vZHVsZVNjb3BlIG1hcCwgc28gdGhhdCBmdXR1cmUgY29tcGlsYXRpb25zIGRvbid0IHJlc2V0IHRoZSBzY29wZSBvZlxuICAgIC8vIGV2ZXJ5IGNvbXBvbmVudC5cbiAgICB0aGlzLmNvbXBvbmVudFRvTW9kdWxlU2NvcGUuY2xlYXIoKTtcblxuICAgIGNvbnN0IHBhcmVudEluamVjdG9yID0gdGhpcy5wbGF0Zm9ybS5pbmplY3RvcjtcbiAgICB0aGlzLnRlc3RNb2R1bGVSZWYgPSBuZXcgTmdNb2R1bGVSZWYodGhpcy50ZXN0TW9kdWxlVHlwZSwgcGFyZW50SW5qZWN0b3IpO1xuXG4gICAgLy8gU2V0IHRoZSBsb2NhbGUgSUQsIGl0IGNhbiBiZSBvdmVycmlkZGVuIGZvciB0aGUgdGVzdHNcbiAgICBjb25zdCBsb2NhbGVJZCA9IHRoaXMudGVzdE1vZHVsZVJlZi5pbmplY3Rvci5nZXQoTE9DQUxFX0lELCBERUZBVUxUX0xPQ0FMRV9JRCk7XG4gICAgc2V0TG9jYWxlSWQobG9jYWxlSWQpO1xuXG4gICAgLy8gQXBwbGljYXRpb25Jbml0U3RhdHVzLnJ1bkluaXRpYWxpemVycygpIGlzIG1hcmtlZCBAaW50ZXJuYWwgdG8gY29yZS5cbiAgICAvLyBDYXN0IGl0IHRvIGFueSBiZWZvcmUgYWNjZXNzaW5nIGl0LlxuICAgICh0aGlzLnRlc3RNb2R1bGVSZWYuaW5qZWN0b3IuZ2V0KEFwcGxpY2F0aW9uSW5pdFN0YXR1cykgYXMgYW55KS5ydW5Jbml0aWFsaXplcnMoKTtcblxuICAgIHJldHVybiB0aGlzLnRlc3RNb2R1bGVSZWY7XG4gIH1cblxuICAvKipcbiAgICogQGludGVybmFsXG4gICAqL1xuICBfY29tcGlsZU5nTW9kdWxlU3luYyhtb2R1bGVUeXBlOiBUeXBlPGFueT4pOiB2b2lkIHtcbiAgICB0aGlzLnF1ZXVlVHlwZXNGcm9tTW9kdWxlc0FycmF5KFttb2R1bGVUeXBlXSk7XG4gICAgdGhpcy5jb21waWxlVHlwZXNTeW5jKCk7XG4gICAgdGhpcy5hcHBseVByb3ZpZGVyT3ZlcnJpZGVzKCk7XG4gICAgdGhpcy5hcHBseVByb3ZpZGVyT3ZlcnJpZGVzVG9Nb2R1bGUobW9kdWxlVHlwZSk7XG4gICAgdGhpcy5hcHBseVRyYW5zaXRpdmVTY29wZXMoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIGFzeW5jIF9jb21waWxlTmdNb2R1bGVBc3luYyhtb2R1bGVUeXBlOiBUeXBlPGFueT4pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5vcmlnaW5hbFJlZ2lzdGVyZWRNb2R1bGVzID09PSBudWxsKSB7XG4gICAgICB0aGlzLm9yaWdpbmFsUmVnaXN0ZXJlZE1vZHVsZXMgPSBnZXRSZWdpc3RlcmVkTW9kdWxlc1N0YXRlKCk7XG4gICAgfVxuICAgIHRoaXMucXVldWVUeXBlc0Zyb21Nb2R1bGVzQXJyYXkoW21vZHVsZVR5cGVdKTtcbiAgICBhd2FpdCB0aGlzLmNvbXBpbGVDb21wb25lbnRzKCk7XG4gICAgdGhpcy5hcHBseVByb3ZpZGVyT3ZlcnJpZGVzKCk7XG4gICAgdGhpcy5hcHBseVByb3ZpZGVyT3ZlcnJpZGVzVG9Nb2R1bGUobW9kdWxlVHlwZSk7XG4gICAgdGhpcy5hcHBseVRyYW5zaXRpdmVTY29wZXMoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIF9nZXRNb2R1bGVSZXNvbHZlcigpOiBSZXNvbHZlcjxOZ01vZHVsZT4geyByZXR1cm4gdGhpcy5yZXNvbHZlcnMubW9kdWxlOyB9XG5cbiAgLyoqXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgX2dldENvbXBvbmVudEZhY3Rvcmllcyhtb2R1bGVUeXBlOiBOZ01vZHVsZVR5cGUpOiBDb21wb25lbnRGYWN0b3J5PGFueT5bXSB7XG4gICAgcmV0dXJuIG1heWJlVW53cmFwRm4obW9kdWxlVHlwZS7JtW1vZC5kZWNsYXJhdGlvbnMpLnJlZHVjZSgoZmFjdG9yaWVzLCBkZWNsYXJhdGlvbikgPT4ge1xuICAgICAgY29uc3QgY29tcG9uZW50RGVmID0gKGRlY2xhcmF0aW9uIGFzIGFueSkuybVjbXA7XG4gICAgICBjb21wb25lbnREZWYgJiYgZmFjdG9yaWVzLnB1c2gobmV3IENvbXBvbmVudEZhY3RvcnkoY29tcG9uZW50RGVmLCB0aGlzLnRlc3RNb2R1bGVSZWYgISkpO1xuICAgICAgcmV0dXJuIGZhY3RvcmllcztcbiAgICB9LCBbXSBhcyBDb21wb25lbnRGYWN0b3J5PGFueT5bXSk7XG4gIH1cblxuICBwcml2YXRlIGNvbXBpbGVUeXBlc1N5bmMoKTogYm9vbGVhbiB7XG4gICAgLy8gQ29tcGlsZSBhbGwgcXVldWVkIGNvbXBvbmVudHMsIGRpcmVjdGl2ZXMsIHBpcGVzLlxuICAgIGxldCBuZWVkc0FzeW5jUmVzb3VyY2VzID0gZmFsc2U7XG4gICAgdGhpcy5wZW5kaW5nQ29tcG9uZW50cy5mb3JFYWNoKGRlY2xhcmF0aW9uID0+IHtcbiAgICAgIG5lZWRzQXN5bmNSZXNvdXJjZXMgPSBuZWVkc0FzeW5jUmVzb3VyY2VzIHx8IGlzQ29tcG9uZW50RGVmUGVuZGluZ1Jlc29sdXRpb24oZGVjbGFyYXRpb24pO1xuICAgICAgY29uc3QgbWV0YWRhdGEgPSB0aGlzLnJlc29sdmVycy5jb21wb25lbnQucmVzb2x2ZShkZWNsYXJhdGlvbikgITtcbiAgICAgIHRoaXMubWF5YmVTdG9yZU5nRGVmKE5HX0NPTVBfREVGLCBkZWNsYXJhdGlvbik7XG4gICAgICBjb21waWxlQ29tcG9uZW50KGRlY2xhcmF0aW9uLCBtZXRhZGF0YSk7XG4gICAgfSk7XG4gICAgdGhpcy5wZW5kaW5nQ29tcG9uZW50cy5jbGVhcigpO1xuXG4gICAgdGhpcy5wZW5kaW5nRGlyZWN0aXZlcy5mb3JFYWNoKGRlY2xhcmF0aW9uID0+IHtcbiAgICAgIGNvbnN0IG1ldGFkYXRhID0gdGhpcy5yZXNvbHZlcnMuZGlyZWN0aXZlLnJlc29sdmUoZGVjbGFyYXRpb24pO1xuICAgICAgdGhpcy5tYXliZVN0b3JlTmdEZWYoTkdfRElSX0RFRiwgZGVjbGFyYXRpb24pO1xuICAgICAgY29tcGlsZURpcmVjdGl2ZShkZWNsYXJhdGlvbiwgbWV0YWRhdGEpO1xuICAgIH0pO1xuICAgIHRoaXMucGVuZGluZ0RpcmVjdGl2ZXMuY2xlYXIoKTtcblxuICAgIHRoaXMucGVuZGluZ1BpcGVzLmZvckVhY2goZGVjbGFyYXRpb24gPT4ge1xuICAgICAgY29uc3QgbWV0YWRhdGEgPSB0aGlzLnJlc29sdmVycy5waXBlLnJlc29sdmUoZGVjbGFyYXRpb24pICE7XG4gICAgICB0aGlzLm1heWJlU3RvcmVOZ0RlZihOR19QSVBFX0RFRiwgZGVjbGFyYXRpb24pO1xuICAgICAgY29tcGlsZVBpcGUoZGVjbGFyYXRpb24sIG1ldGFkYXRhKTtcbiAgICB9KTtcbiAgICB0aGlzLnBlbmRpbmdQaXBlcy5jbGVhcigpO1xuXG4gICAgcmV0dXJuIG5lZWRzQXN5bmNSZXNvdXJjZXM7XG4gIH1cblxuICBwcml2YXRlIGFwcGx5VHJhbnNpdGl2ZVNjb3BlcygpOiB2b2lkIHtcbiAgICBjb25zdCBtb2R1bGVUb1Njb3BlID0gbmV3IE1hcDxUeXBlPGFueT58VGVzdGluZ01vZHVsZU92ZXJyaWRlLCBOZ01vZHVsZVRyYW5zaXRpdmVTY29wZXM+KCk7XG4gICAgY29uc3QgZ2V0U2NvcGVPZk1vZHVsZSA9XG4gICAgICAgIChtb2R1bGVUeXBlOiBUeXBlPGFueT58IFRlc3RpbmdNb2R1bGVPdmVycmlkZSk6IE5nTW9kdWxlVHJhbnNpdGl2ZVNjb3BlcyA9PiB7XG4gICAgICAgICAgaWYgKCFtb2R1bGVUb1Njb3BlLmhhcyhtb2R1bGVUeXBlKSkge1xuICAgICAgICAgICAgY29uc3QgcmVhbFR5cGUgPSBpc1Rlc3RpbmdNb2R1bGVPdmVycmlkZShtb2R1bGVUeXBlKSA/IHRoaXMudGVzdE1vZHVsZVR5cGUgOiBtb2R1bGVUeXBlO1xuICAgICAgICAgICAgbW9kdWxlVG9TY29wZS5zZXQobW9kdWxlVHlwZSwgdHJhbnNpdGl2ZVNjb3Blc0ZvcihyZWFsVHlwZSkpO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gbW9kdWxlVG9TY29wZS5nZXQobW9kdWxlVHlwZSkgITtcbiAgICAgICAgfTtcblxuICAgIHRoaXMuY29tcG9uZW50VG9Nb2R1bGVTY29wZS5mb3JFYWNoKChtb2R1bGVUeXBlLCBjb21wb25lbnRUeXBlKSA9PiB7XG4gICAgICBjb25zdCBtb2R1bGVTY29wZSA9IGdldFNjb3BlT2ZNb2R1bGUobW9kdWxlVHlwZSk7XG4gICAgICB0aGlzLnN0b3JlRmllbGRPZkRlZk9uVHlwZShjb21wb25lbnRUeXBlLCBOR19DT01QX0RFRiwgJ2RpcmVjdGl2ZURlZnMnKTtcbiAgICAgIHRoaXMuc3RvcmVGaWVsZE9mRGVmT25UeXBlKGNvbXBvbmVudFR5cGUsIE5HX0NPTVBfREVGLCAncGlwZURlZnMnKTtcbiAgICAgIHBhdGNoQ29tcG9uZW50RGVmV2l0aFNjb3BlKChjb21wb25lbnRUeXBlIGFzIGFueSkuybVjbXAsIG1vZHVsZVNjb3BlKTtcbiAgICB9KTtcblxuICAgIHRoaXMuY29tcG9uZW50VG9Nb2R1bGVTY29wZS5jbGVhcigpO1xuICB9XG5cbiAgcHJpdmF0ZSBhcHBseVByb3ZpZGVyT3ZlcnJpZGVzKCk6IHZvaWQge1xuICAgIGNvbnN0IG1heWJlQXBwbHlPdmVycmlkZXMgPSAoZmllbGQ6IHN0cmluZykgPT4gKHR5cGU6IFR5cGU8YW55PikgPT4ge1xuICAgICAgY29uc3QgcmVzb2x2ZXIgPSBmaWVsZCA9PT0gTkdfQ09NUF9ERUYgPyB0aGlzLnJlc29sdmVycy5jb21wb25lbnQgOiB0aGlzLnJlc29sdmVycy5kaXJlY3RpdmU7XG4gICAgICBjb25zdCBtZXRhZGF0YSA9IHJlc29sdmVyLnJlc29sdmUodHlwZSkgITtcbiAgICAgIGlmICh0aGlzLmhhc1Byb3ZpZGVyT3ZlcnJpZGVzKG1ldGFkYXRhLnByb3ZpZGVycykpIHtcbiAgICAgICAgdGhpcy5wYXRjaERlZldpdGhQcm92aWRlck92ZXJyaWRlcyh0eXBlLCBmaWVsZCk7XG4gICAgICB9XG4gICAgfTtcbiAgICB0aGlzLnNlZW5Db21wb25lbnRzLmZvckVhY2gobWF5YmVBcHBseU92ZXJyaWRlcyhOR19DT01QX0RFRikpO1xuICAgIHRoaXMuc2VlbkRpcmVjdGl2ZXMuZm9yRWFjaChtYXliZUFwcGx5T3ZlcnJpZGVzKE5HX0RJUl9ERUYpKTtcblxuICAgIHRoaXMuc2VlbkNvbXBvbmVudHMuY2xlYXIoKTtcbiAgICB0aGlzLnNlZW5EaXJlY3RpdmVzLmNsZWFyKCk7XG4gIH1cblxuICBwcml2YXRlIGFwcGx5UHJvdmlkZXJPdmVycmlkZXNUb01vZHVsZShtb2R1bGVUeXBlOiBUeXBlPGFueT4pOiB2b2lkIHtcbiAgICBpZiAodGhpcy5tb2R1bGVQcm92aWRlcnNPdmVycmlkZGVuLmhhcyhtb2R1bGVUeXBlKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLm1vZHVsZVByb3ZpZGVyc092ZXJyaWRkZW4uYWRkKG1vZHVsZVR5cGUpO1xuXG4gICAgY29uc3QgaW5qZWN0b3JEZWY6IGFueSA9IChtb2R1bGVUeXBlIGFzIGFueSlbTkdfSU5KX0RFRl07XG4gICAgaWYgKHRoaXMucHJvdmlkZXJPdmVycmlkZXNCeVRva2VuLnNpemUgPiAwKSB7XG4gICAgICAvLyBFeHRyYWN0IHRoZSBsaXN0IG9mIHByb3ZpZGVycyBmcm9tIE1vZHVsZVdpdGhQcm92aWRlcnMsIHNvIHdlIGNhbiBkZWZpbmUgdGhlIGZpbmFsIGxpc3Qgb2ZcbiAgICAgIC8vIHByb3ZpZGVycyB0aGF0IG1pZ2h0IGhhdmUgb3ZlcnJpZGVzLlxuICAgICAgLy8gTm90ZTogc2Vjb25kIGBmbGF0dGVuYCBvcGVyYXRpb24gaXMgbmVlZGVkIHRvIGNvbnZlcnQgYW4gYXJyYXkgb2YgcHJvdmlkZXJzXG4gICAgICAvLyAoZS5nLiBgW1tdLCBbXV1gKSBpbnRvIG9uZSBmbGF0IGxpc3QsIGFsc28gZWxpbWluYXRpbmcgZW1wdHkgYXJyYXlzLlxuICAgICAgY29uc3QgcHJvdmlkZXJzRnJvbU1vZHVsZXMgPSBmbGF0dGVuKGZsYXR0ZW4oXG4gICAgICAgICAgaW5qZWN0b3JEZWYuaW1wb3J0cywgKGltcG9ydGVkOiBOZ01vZHVsZVR5cGU8YW55PnwgTW9kdWxlV2l0aFByb3ZpZGVyczxhbnk+KSA9PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpc01vZHVsZVdpdGhQcm92aWRlcnMoaW1wb3J0ZWQpID8gaW1wb3J0ZWQucHJvdmlkZXJzIDogW10pKTtcbiAgICAgIGNvbnN0IHByb3ZpZGVycyA9IFsuLi5wcm92aWRlcnNGcm9tTW9kdWxlcywgLi4uaW5qZWN0b3JEZWYucHJvdmlkZXJzXTtcbiAgICAgIGlmICh0aGlzLmhhc1Byb3ZpZGVyT3ZlcnJpZGVzKHByb3ZpZGVycykpIHtcbiAgICAgICAgdGhpcy5tYXliZVN0b3JlTmdEZWYoTkdfSU5KX0RFRiwgbW9kdWxlVHlwZSk7XG5cbiAgICAgICAgdGhpcy5zdG9yZUZpZWxkT2ZEZWZPblR5cGUobW9kdWxlVHlwZSwgTkdfSU5KX0RFRiwgJ3Byb3ZpZGVycycpO1xuICAgICAgICBpbmplY3RvckRlZi5wcm92aWRlcnMgPSB0aGlzLmdldE92ZXJyaWRkZW5Qcm92aWRlcnMocHJvdmlkZXJzKTtcbiAgICAgIH1cblxuICAgICAgLy8gQXBwbHkgcHJvdmlkZXIgb3ZlcnJpZGVzIHRvIGltcG9ydGVkIG1vZHVsZXMgcmVjdXJzaXZlbHlcbiAgICAgIGNvbnN0IG1vZHVsZURlZjogYW55ID0gKG1vZHVsZVR5cGUgYXMgYW55KVtOR19NT0RfREVGXTtcbiAgICAgIGZvciAoY29uc3QgaW1wb3J0ZWRNb2R1bGUgb2YgbW9kdWxlRGVmLmltcG9ydHMpIHtcbiAgICAgICAgdGhpcy5hcHBseVByb3ZpZGVyT3ZlcnJpZGVzVG9Nb2R1bGUoaW1wb3J0ZWRNb2R1bGUpO1xuICAgICAgfVxuICAgICAgLy8gQWxzbyBvdmVycmlkZSB0aGUgcHJvdmlkZXJzIG9uIGFueSBNb2R1bGVXaXRoUHJvdmlkZXJzIGltcG9ydHMgc2luY2UgdGhvc2UgZG9uJ3QgYXBwZWFyIGluXG4gICAgICAvLyB0aGUgbW9kdWxlRGVmLlxuICAgICAgZm9yIChjb25zdCBpbXBvcnRlZE1vZHVsZSBvZiBmbGF0dGVuKGluamVjdG9yRGVmLmltcG9ydHMpKSB7XG4gICAgICAgIGlmIChpc01vZHVsZVdpdGhQcm92aWRlcnMoaW1wb3J0ZWRNb2R1bGUpKSB7XG4gICAgICAgICAgdGhpcy5kZWZDbGVhbnVwT3BzLnB1c2goe1xuICAgICAgICAgICAgb2JqZWN0OiBpbXBvcnRlZE1vZHVsZSxcbiAgICAgICAgICAgIGZpZWxkTmFtZTogJ3Byb3ZpZGVycycsXG4gICAgICAgICAgICBvcmlnaW5hbFZhbHVlOiBpbXBvcnRlZE1vZHVsZS5wcm92aWRlcnNcbiAgICAgICAgICB9KTtcbiAgICAgICAgICBpbXBvcnRlZE1vZHVsZS5wcm92aWRlcnMgPSB0aGlzLmdldE92ZXJyaWRkZW5Qcm92aWRlcnMoaW1wb3J0ZWRNb2R1bGUucHJvdmlkZXJzKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgcGF0Y2hDb21wb25lbnRzV2l0aEV4aXN0aW5nU3R5bGVzKCk6IHZvaWQge1xuICAgIHRoaXMuZXhpc3RpbmdDb21wb25lbnRTdHlsZXMuZm9yRWFjaChcbiAgICAgICAgKHN0eWxlcywgdHlwZSkgPT4gKHR5cGUgYXMgYW55KVtOR19DT01QX0RFRl0uc3R5bGVzID0gc3R5bGVzKTtcbiAgICB0aGlzLmV4aXN0aW5nQ29tcG9uZW50U3R5bGVzLmNsZWFyKCk7XG4gIH1cblxuICBwcml2YXRlIHF1ZXVlVHlwZUFycmF5KGFycjogYW55W10sIG1vZHVsZVR5cGU6IFR5cGU8YW55PnxUZXN0aW5nTW9kdWxlT3ZlcnJpZGUpOiB2b2lkIHtcbiAgICBmb3IgKGNvbnN0IHZhbHVlIG9mIGFycikge1xuICAgICAgaWYgKEFycmF5LmlzQXJyYXkodmFsdWUpKSB7XG4gICAgICAgIHRoaXMucXVldWVUeXBlQXJyYXkodmFsdWUsIG1vZHVsZVR5cGUpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5xdWV1ZVR5cGUodmFsdWUsIG1vZHVsZVR5cGUpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgcmVjb21waWxlTmdNb2R1bGUobmdNb2R1bGU6IFR5cGU8YW55Pik6IHZvaWQge1xuICAgIGNvbnN0IG1ldGFkYXRhID0gdGhpcy5yZXNvbHZlcnMubW9kdWxlLnJlc29sdmUobmdNb2R1bGUpO1xuICAgIGlmIChtZXRhZGF0YSA9PT0gbnVsbCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBVbmFibGUgdG8gcmVzb2x2ZSBtZXRhZGF0YSBmb3IgTmdNb2R1bGU6ICR7bmdNb2R1bGUubmFtZX1gKTtcbiAgICB9XG4gICAgLy8gQ2FjaGUgdGhlIGluaXRpYWwgbmdNb2R1bGVEZWYgYXMgaXQgd2lsbCBiZSBvdmVyd3JpdHRlbi5cbiAgICB0aGlzLm1heWJlU3RvcmVOZ0RlZihOR19NT0RfREVGLCBuZ01vZHVsZSk7XG4gICAgdGhpcy5tYXliZVN0b3JlTmdEZWYoTkdfSU5KX0RFRiwgbmdNb2R1bGUpO1xuXG4gICAgY29tcGlsZU5nTW9kdWxlRGVmcyhuZ01vZHVsZSBhcyBOZ01vZHVsZVR5cGU8YW55PiwgbWV0YWRhdGEpO1xuICB9XG5cbiAgcHJpdmF0ZSBxdWV1ZVR5cGUodHlwZTogVHlwZTxhbnk+LCBtb2R1bGVUeXBlOiBUeXBlPGFueT58VGVzdGluZ01vZHVsZU92ZXJyaWRlKTogdm9pZCB7XG4gICAgY29uc3QgY29tcG9uZW50ID0gdGhpcy5yZXNvbHZlcnMuY29tcG9uZW50LnJlc29sdmUodHlwZSk7XG4gICAgaWYgKGNvbXBvbmVudCkge1xuICAgICAgLy8gQ2hlY2sgd2hldGhlciBhIGdpdmUgVHlwZSBoYXMgcmVzcGVjdGl2ZSBORyBkZWYgKMm1Y21wKSBhbmQgY29tcGlsZSBpZiBkZWYgaXNcbiAgICAgIC8vIG1pc3NpbmcuIFRoYXQgbWlnaHQgaGFwcGVuIGluIGNhc2UgYSBjbGFzcyB3aXRob3V0IGFueSBBbmd1bGFyIGRlY29yYXRvcnMgZXh0ZW5kcyBhbm90aGVyXG4gICAgICAvLyBjbGFzcyB3aGVyZSBDb21wb25lbnQvRGlyZWN0aXZlL1BpcGUgZGVjb3JhdG9yIGlzIGRlZmluZWQuXG4gICAgICBpZiAoaXNDb21wb25lbnREZWZQZW5kaW5nUmVzb2x1dGlvbih0eXBlKSB8fCAhdHlwZS5oYXNPd25Qcm9wZXJ0eShOR19DT01QX0RFRikpIHtcbiAgICAgICAgdGhpcy5wZW5kaW5nQ29tcG9uZW50cy5hZGQodHlwZSk7XG4gICAgICB9XG4gICAgICB0aGlzLnNlZW5Db21wb25lbnRzLmFkZCh0eXBlKTtcblxuICAgICAgLy8gS2VlcCB0cmFjayBvZiB0aGUgbW9kdWxlIHdoaWNoIGRlY2xhcmVzIHRoaXMgY29tcG9uZW50LCBzbyBsYXRlciB0aGUgY29tcG9uZW50J3Mgc2NvcGVcbiAgICAgIC8vIGNhbiBiZSBzZXQgY29ycmVjdGx5LiBJZiB0aGUgY29tcG9uZW50IGhhcyBhbHJlYWR5IGJlZW4gcmVjb3JkZWQgaGVyZSwgdGhlbiBvbmUgb2Ygc2V2ZXJhbFxuICAgICAgLy8gY2FzZXMgaXMgdHJ1ZTpcbiAgICAgIC8vICogdGhlIG1vZHVsZSBjb250YWluaW5nIHRoZSBjb21wb25lbnQgd2FzIGltcG9ydGVkIG11bHRpcGxlIHRpbWVzIChjb21tb24pLlxuICAgICAgLy8gKiB0aGUgY29tcG9uZW50IGlzIGRlY2xhcmVkIGluIG11bHRpcGxlIG1vZHVsZXMgKHdoaWNoIGlzIGFuIGVycm9yKS5cbiAgICAgIC8vICogdGhlIGNvbXBvbmVudCB3YXMgaW4gJ2RlY2xhcmF0aW9ucycgb2YgdGhlIHRlc3RpbmcgbW9kdWxlLCBhbmQgYWxzbyBpbiBhbiBpbXBvcnRlZCBtb2R1bGVcbiAgICAgIC8vICAgaW4gd2hpY2ggY2FzZSB0aGUgbW9kdWxlIHNjb3BlIHdpbGwgYmUgVGVzdGluZ01vZHVsZU92ZXJyaWRlLkRFQ0xBUkFUSU9OLlxuICAgICAgLy8gKiBvdmVycmlkZVRlbXBsYXRlVXNpbmdUZXN0aW5nTW9kdWxlIHdhcyBjYWxsZWQgZm9yIHRoZSBjb21wb25lbnQgaW4gd2hpY2ggY2FzZSB0aGUgbW9kdWxlXG4gICAgICAvLyAgIHNjb3BlIHdpbGwgYmUgVGVzdGluZ01vZHVsZU92ZXJyaWRlLk9WRVJSSURFX1RFTVBMQVRFLlxuICAgICAgLy9cbiAgICAgIC8vIElmIHRoZSBjb21wb25lbnQgd2FzIHByZXZpb3VzbHkgaW4gdGhlIHRlc3RpbmcgbW9kdWxlJ3MgJ2RlY2xhcmF0aW9ucycgKG1lYW5pbmcgdGhlXG4gICAgICAvLyBjdXJyZW50IHZhbHVlIGlzIFRlc3RpbmdNb2R1bGVPdmVycmlkZS5ERUNMQVJBVElPTiksIHRoZW4gYG1vZHVsZVR5cGVgIGlzIHRoZSBjb21wb25lbnQnc1xuICAgICAgLy8gcmVhbCBtb2R1bGUsIHdoaWNoIHdhcyBpbXBvcnRlZC4gVGhpcyBwYXR0ZXJuIGlzIHVuZGVyc3Rvb2QgdG8gbWVhbiB0aGF0IHRoZSBjb21wb25lbnRcbiAgICAgIC8vIHNob3VsZCB1c2UgaXRzIG9yaWdpbmFsIHNjb3BlLCBidXQgdGhhdCB0aGUgdGVzdGluZyBtb2R1bGUgc2hvdWxkIGFsc28gY29udGFpbiB0aGVcbiAgICAgIC8vIGNvbXBvbmVudCBpbiBpdHMgc2NvcGUuXG4gICAgICBpZiAoIXRoaXMuY29tcG9uZW50VG9Nb2R1bGVTY29wZS5oYXModHlwZSkgfHxcbiAgICAgICAgICB0aGlzLmNvbXBvbmVudFRvTW9kdWxlU2NvcGUuZ2V0KHR5cGUpID09PSBUZXN0aW5nTW9kdWxlT3ZlcnJpZGUuREVDTEFSQVRJT04pIHtcbiAgICAgICAgdGhpcy5jb21wb25lbnRUb01vZHVsZVNjb3BlLnNldCh0eXBlLCBtb2R1bGVUeXBlKTtcbiAgICAgIH1cbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBkaXJlY3RpdmUgPSB0aGlzLnJlc29sdmVycy5kaXJlY3RpdmUucmVzb2x2ZSh0eXBlKTtcbiAgICBpZiAoZGlyZWN0aXZlKSB7XG4gICAgICBpZiAoIXR5cGUuaGFzT3duUHJvcGVydHkoTkdfRElSX0RFRikpIHtcbiAgICAgICAgdGhpcy5wZW5kaW5nRGlyZWN0aXZlcy5hZGQodHlwZSk7XG4gICAgICB9XG4gICAgICB0aGlzLnNlZW5EaXJlY3RpdmVzLmFkZCh0eXBlKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBwaXBlID0gdGhpcy5yZXNvbHZlcnMucGlwZS5yZXNvbHZlKHR5cGUpO1xuICAgIGlmIChwaXBlICYmICF0eXBlLmhhc093blByb3BlcnR5KE5HX1BJUEVfREVGKSkge1xuICAgICAgdGhpcy5wZW5kaW5nUGlwZXMuYWRkKHR5cGUpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgcXVldWVUeXBlc0Zyb21Nb2R1bGVzQXJyYXkoYXJyOiBhbnlbXSk6IHZvaWQge1xuICAgIGZvciAoY29uc3QgdmFsdWUgb2YgYXJyKSB7XG4gICAgICBpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHtcbiAgICAgICAgdGhpcy5xdWV1ZVR5cGVzRnJvbU1vZHVsZXNBcnJheSh2YWx1ZSk7XG4gICAgICB9IGVsc2UgaWYgKGhhc05nTW9kdWxlRGVmKHZhbHVlKSkge1xuICAgICAgICBjb25zdCBkZWYgPSB2YWx1ZS7JtW1vZDtcbiAgICAgICAgLy8gTG9vayB0aHJvdWdoIGRlY2xhcmF0aW9ucywgaW1wb3J0cywgYW5kIGV4cG9ydHMsIGFuZCBxdWV1ZSBldmVyeXRoaW5nIGZvdW5kIHRoZXJlLlxuICAgICAgICB0aGlzLnF1ZXVlVHlwZUFycmF5KG1heWJlVW53cmFwRm4oZGVmLmRlY2xhcmF0aW9ucyksIHZhbHVlKTtcbiAgICAgICAgdGhpcy5xdWV1ZVR5cGVzRnJvbU1vZHVsZXNBcnJheShtYXliZVVud3JhcEZuKGRlZi5pbXBvcnRzKSk7XG4gICAgICAgIHRoaXMucXVldWVUeXBlc0Zyb21Nb2R1bGVzQXJyYXkobWF5YmVVbndyYXBGbihkZWYuZXhwb3J0cykpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgbWF5YmVTdG9yZU5nRGVmKHByb3A6IHN0cmluZywgdHlwZTogVHlwZTxhbnk+KSB7XG4gICAgaWYgKCF0aGlzLmluaXRpYWxOZ0RlZnMuaGFzKHR5cGUpKSB7XG4gICAgICBjb25zdCBjdXJyZW50RGVmID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcih0eXBlLCBwcm9wKTtcbiAgICAgIHRoaXMuaW5pdGlhbE5nRGVmcy5zZXQodHlwZSwgW3Byb3AsIGN1cnJlbnREZWZdKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIHN0b3JlRmllbGRPZkRlZk9uVHlwZSh0eXBlOiBUeXBlPGFueT4sIGRlZkZpZWxkOiBzdHJpbmcsIGZpZWxkTmFtZTogc3RyaW5nKTogdm9pZCB7XG4gICAgY29uc3QgZGVmOiBhbnkgPSAodHlwZSBhcyBhbnkpW2RlZkZpZWxkXTtcbiAgICBjb25zdCBvcmlnaW5hbFZhbHVlOiBhbnkgPSBkZWZbZmllbGROYW1lXTtcbiAgICB0aGlzLmRlZkNsZWFudXBPcHMucHVzaCh7b2JqZWN0OiBkZWYsIGZpZWxkTmFtZSwgb3JpZ2luYWxWYWx1ZX0pO1xuICB9XG5cbiAgLyoqXG4gICAqIENsZWFycyBjdXJyZW50IGNvbXBvbmVudHMgcmVzb2x1dGlvbiBxdWV1ZSwgYnV0IHN0b3JlcyB0aGUgc3RhdGUgb2YgdGhlIHF1ZXVlLCBzbyB3ZSBjYW5cbiAgICogcmVzdG9yZSBpdCBsYXRlci4gQ2xlYXJpbmcgdGhlIHF1ZXVlIGlzIHJlcXVpcmVkIGJlZm9yZSB3ZSB0cnkgdG8gY29tcGlsZSBjb21wb25lbnRzICh2aWFcbiAgICogYFRlc3RCZWQuY29tcGlsZUNvbXBvbmVudHNgKSwgc28gdGhhdCBjb21wb25lbnQgZGVmcyBhcmUgaW4gc3luYyB3aXRoIHRoZSByZXNvbHV0aW9uIHF1ZXVlLlxuICAgKi9cbiAgcHJpdmF0ZSBjbGVhckNvbXBvbmVudFJlc29sdXRpb25RdWV1ZSgpIHtcbiAgICBpZiAodGhpcy5vcmlnaW5hbENvbXBvbmVudFJlc29sdXRpb25RdWV1ZSA9PT0gbnVsbCkge1xuICAgICAgdGhpcy5vcmlnaW5hbENvbXBvbmVudFJlc29sdXRpb25RdWV1ZSA9IG5ldyBNYXAoKTtcbiAgICB9XG4gICAgY2xlYXJSZXNvbHV0aW9uT2ZDb21wb25lbnRSZXNvdXJjZXNRdWV1ZSgpLmZvckVhY2goXG4gICAgICAgICh2YWx1ZSwga2V5KSA9PiB0aGlzLm9yaWdpbmFsQ29tcG9uZW50UmVzb2x1dGlvblF1ZXVlICEuc2V0KGtleSwgdmFsdWUpKTtcbiAgfVxuXG4gIC8qXG4gICAqIFJlc3RvcmVzIGNvbXBvbmVudCByZXNvbHV0aW9uIHF1ZXVlIHRvIHRoZSBwcmV2aW91c2x5IHNhdmVkIHN0YXRlLiBUaGlzIG9wZXJhdGlvbiBpcyBwZXJmb3JtZWRcbiAgICogYXMgYSBwYXJ0IG9mIHJlc3RvcmluZyB0aGUgc3RhdGUgYWZ0ZXIgY29tcGxldGlvbiBvZiB0aGUgY3VycmVudCBzZXQgb2YgdGVzdHMgKHRoYXQgbWlnaHRcbiAgICogcG90ZW50aWFsbHkgbXV0YXRlIHRoZSBzdGF0ZSkuXG4gICAqL1xuICBwcml2YXRlIHJlc3RvcmVDb21wb25lbnRSZXNvbHV0aW9uUXVldWUoKSB7XG4gICAgaWYgKHRoaXMub3JpZ2luYWxDb21wb25lbnRSZXNvbHV0aW9uUXVldWUgIT09IG51bGwpIHtcbiAgICAgIHJlc3RvcmVDb21wb25lbnRSZXNvbHV0aW9uUXVldWUodGhpcy5vcmlnaW5hbENvbXBvbmVudFJlc29sdXRpb25RdWV1ZSk7XG4gICAgICB0aGlzLm9yaWdpbmFsQ29tcG9uZW50UmVzb2x1dGlvblF1ZXVlID0gbnVsbDtcbiAgICB9XG4gIH1cblxuICByZXN0b3JlT3JpZ2luYWxTdGF0ZSgpOiB2b2lkIHtcbiAgICAvLyBQcm9jZXNzIGNsZWFudXAgb3BzIGluIHJldmVyc2Ugb3JkZXIgc28gdGhlIGZpZWxkJ3Mgb3JpZ2luYWwgdmFsdWUgaXMgcmVzdG9yZWQgY29ycmVjdGx5IChpblxuICAgIC8vIGNhc2UgdGhlcmUgd2VyZSBtdWx0aXBsZSBvdmVycmlkZXMgZm9yIHRoZSBzYW1lIGZpZWxkKS5cbiAgICBmb3JFYWNoUmlnaHQodGhpcy5kZWZDbGVhbnVwT3BzLCAob3A6IENsZWFudXBPcGVyYXRpb24pID0+IHtcbiAgICAgIG9wLm9iamVjdFtvcC5maWVsZE5hbWVdID0gb3Aub3JpZ2luYWxWYWx1ZTtcbiAgICB9KTtcbiAgICAvLyBSZXN0b3JlIGluaXRpYWwgY29tcG9uZW50L2RpcmVjdGl2ZS9waXBlIGRlZnNcbiAgICB0aGlzLmluaXRpYWxOZ0RlZnMuZm9yRWFjaChcbiAgICAgICAgKHZhbHVlOiBbc3RyaW5nLCBQcm9wZXJ0eURlc2NyaXB0b3IgfCB1bmRlZmluZWRdLCB0eXBlOiBUeXBlPGFueT4pID0+IHtcbiAgICAgICAgICBjb25zdCBbcHJvcCwgZGVzY3JpcHRvcl0gPSB2YWx1ZTtcbiAgICAgICAgICBpZiAoIWRlc2NyaXB0b3IpIHtcbiAgICAgICAgICAgIC8vIERlbGV0ZSBvcGVyYXRpb25zIGFyZSBnZW5lcmFsbHkgdW5kZXNpcmFibGUgc2luY2UgdGhleSBoYXZlIHBlcmZvcm1hbmNlIGltcGxpY2F0aW9uc1xuICAgICAgICAgICAgLy8gb24gb2JqZWN0cyB0aGV5IHdlcmUgYXBwbGllZCB0by4gSW4gdGhpcyBwYXJ0aWN1bGFyIGNhc2UsIHNpdHVhdGlvbnMgd2hlcmUgdGhpcyBjb2RlXG4gICAgICAgICAgICAvLyBpcyBpbnZva2VkIHNob3VsZCBiZSBxdWl0ZSByYXJlIHRvIGNhdXNlIGFueSBub3RpY2VhYmxlIGltcGFjdCwgc2luY2UgaXQncyBhcHBsaWVkXG4gICAgICAgICAgICAvLyBvbmx5IHRvIHNvbWUgdGVzdCBjYXNlcyAoZm9yIGV4YW1wbGUgd2hlbiBjbGFzcyB3aXRoIG5vIGFubm90YXRpb25zIGV4dGVuZHMgc29tZVxuICAgICAgICAgICAgLy8gQENvbXBvbmVudCkgd2hlbiB3ZSBuZWVkIHRvIGNsZWFyICfJtWNtcCcgZmllbGQgb24gYSBnaXZlbiBjbGFzcyB0byByZXN0b3JlXG4gICAgICAgICAgICAvLyBpdHMgb3JpZ2luYWwgc3RhdGUgKGJlZm9yZSBhcHBseWluZyBvdmVycmlkZXMgYW5kIHJ1bm5pbmcgdGVzdHMpLlxuICAgICAgICAgICAgZGVsZXRlICh0eXBlIGFzIGFueSlbcHJvcF07XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0eXBlLCBwcm9wLCBkZXNjcmlwdG9yKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIHRoaXMuaW5pdGlhbE5nRGVmcy5jbGVhcigpO1xuICAgIHRoaXMubW9kdWxlUHJvdmlkZXJzT3ZlcnJpZGRlbi5jbGVhcigpO1xuICAgIHRoaXMucmVzdG9yZUNvbXBvbmVudFJlc29sdXRpb25RdWV1ZSgpO1xuICAgIGlmICh0aGlzLm9yaWdpbmFsUmVnaXN0ZXJlZE1vZHVsZXMpIHtcbiAgICAgIHJlc3RvcmVSZWdpc3RlcmVkTW9kdWxlc1N0YXRlKHRoaXMub3JpZ2luYWxSZWdpc3RlcmVkTW9kdWxlcyk7XG4gICAgICB0aGlzLm9yaWdpbmFsUmVnaXN0ZXJlZE1vZHVsZXMgPSBudWxsO1xuICAgIH1cbiAgICAvLyBSZXN0b3JlIHRoZSBsb2NhbGUgSUQgdG8gdGhlIGRlZmF1bHQgdmFsdWUsIHRoaXMgc2hvdWxkbid0IGJlIG5lY2Vzc2FyeSBidXQgd2UgbmV2ZXIga25vd1xuICAgIHNldExvY2FsZUlkKERFRkFVTFRfTE9DQUxFX0lEKTtcbiAgfVxuXG4gIHByaXZhdGUgY29tcGlsZVRlc3RNb2R1bGUoKTogdm9pZCB7XG4gICAgY2xhc3MgUm9vdFNjb3BlTW9kdWxlIHt9XG4gICAgY29tcGlsZU5nTW9kdWxlRGVmcyhSb290U2NvcGVNb2R1bGUgYXMgTmdNb2R1bGVUeXBlPGFueT4sIHtcbiAgICAgIHByb3ZpZGVyczogWy4uLnRoaXMucm9vdFByb3ZpZGVyT3ZlcnJpZGVzXSxcbiAgICB9KTtcblxuICAgIGNvbnN0IG5nWm9uZSA9IG5ldyBOZ1pvbmUoe2VuYWJsZUxvbmdTdGFja1RyYWNlOiB0cnVlfSk7XG4gICAgY29uc3QgcHJvdmlkZXJzOiBQcm92aWRlcltdID0gW1xuICAgICAge3Byb3ZpZGU6IE5nWm9uZSwgdXNlVmFsdWU6IG5nWm9uZX0sXG4gICAgICB7cHJvdmlkZTogQ29tcGlsZXIsIHVzZUZhY3Rvcnk6ICgpID0+IG5ldyBSM1Rlc3RDb21waWxlcih0aGlzKX0sXG4gICAgICAuLi50aGlzLnByb3ZpZGVycyxcbiAgICAgIC4uLnRoaXMucHJvdmlkZXJPdmVycmlkZXMsXG4gICAgXTtcbiAgICBjb25zdCBpbXBvcnRzID0gW1Jvb3RTY29wZU1vZHVsZSwgdGhpcy5hZGRpdGlvbmFsTW9kdWxlVHlwZXMsIHRoaXMuaW1wb3J0cyB8fCBbXV07XG5cbiAgICAvLyBjbGFuZy1mb3JtYXQgb2ZmXG4gICAgY29tcGlsZU5nTW9kdWxlRGVmcyh0aGlzLnRlc3RNb2R1bGVUeXBlLCB7XG4gICAgICBkZWNsYXJhdGlvbnM6IHRoaXMuZGVjbGFyYXRpb25zLFxuICAgICAgaW1wb3J0cyxcbiAgICAgIHNjaGVtYXM6IHRoaXMuc2NoZW1hcyxcbiAgICAgIHByb3ZpZGVycyxcbiAgICB9LCAvKiBhbGxvd0R1cGxpY2F0ZURlY2xhcmF0aW9uc0luUm9vdCAqLyB0cnVlKTtcbiAgICAvLyBjbGFuZy1mb3JtYXQgb25cblxuICAgIHRoaXMuYXBwbHlQcm92aWRlck92ZXJyaWRlc1RvTW9kdWxlKHRoaXMudGVzdE1vZHVsZVR5cGUpO1xuICB9XG5cbiAgZ2V0IGluamVjdG9yKCk6IEluamVjdG9yIHtcbiAgICBpZiAodGhpcy5faW5qZWN0b3IgIT09IG51bGwpIHtcbiAgICAgIHJldHVybiB0aGlzLl9pbmplY3RvcjtcbiAgICB9XG5cbiAgICBjb25zdCBwcm92aWRlcnM6IFByb3ZpZGVyW10gPSBbXTtcbiAgICBjb25zdCBjb21waWxlck9wdGlvbnMgPSB0aGlzLnBsYXRmb3JtLmluamVjdG9yLmdldChDT01QSUxFUl9PUFRJT05TKTtcbiAgICBjb21waWxlck9wdGlvbnMuZm9yRWFjaChvcHRzID0+IHtcbiAgICAgIGlmIChvcHRzLnByb3ZpZGVycykge1xuICAgICAgICBwcm92aWRlcnMucHVzaChvcHRzLnByb3ZpZGVycyk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgaWYgKHRoaXMuY29tcGlsZXJQcm92aWRlcnMgIT09IG51bGwpIHtcbiAgICAgIHByb3ZpZGVycy5wdXNoKC4uLnRoaXMuY29tcGlsZXJQcm92aWRlcnMpO1xuICAgIH1cblxuICAgIC8vIFRPRE8ob2NvbWJlKTogbWFrZSB0aGlzIHdvcmsgd2l0aCBhbiBJbmplY3RvciBkaXJlY3RseSBpbnN0ZWFkIG9mIGNyZWF0aW5nIGEgbW9kdWxlIGZvciBpdFxuICAgIGNsYXNzIENvbXBpbGVyTW9kdWxlIHt9XG4gICAgY29tcGlsZU5nTW9kdWxlRGVmcyhDb21waWxlck1vZHVsZSBhcyBOZ01vZHVsZVR5cGU8YW55Piwge3Byb3ZpZGVyc30pO1xuXG4gICAgY29uc3QgQ29tcGlsZXJNb2R1bGVGYWN0b3J5ID0gbmV3IFIzTmdNb2R1bGVGYWN0b3J5KENvbXBpbGVyTW9kdWxlKTtcbiAgICB0aGlzLl9pbmplY3RvciA9IENvbXBpbGVyTW9kdWxlRmFjdG9yeS5jcmVhdGUodGhpcy5wbGF0Zm9ybS5pbmplY3RvcikuaW5qZWN0b3I7XG4gICAgcmV0dXJuIHRoaXMuX2luamVjdG9yO1xuICB9XG5cbiAgLy8gZ2V0IG92ZXJyaWRlcyBmb3IgYSBzcGVjaWZpYyBwcm92aWRlciAoaWYgYW55KVxuICBwcml2YXRlIGdldFNpbmdsZVByb3ZpZGVyT3ZlcnJpZGVzKHByb3ZpZGVyOiBQcm92aWRlcik6IFByb3ZpZGVyfG51bGwge1xuICAgIGNvbnN0IHRva2VuID0gZ2V0UHJvdmlkZXJUb2tlbihwcm92aWRlcik7XG4gICAgcmV0dXJuIHRoaXMucHJvdmlkZXJPdmVycmlkZXNCeVRva2VuLmdldCh0b2tlbikgfHwgbnVsbDtcbiAgfVxuXG4gIHByaXZhdGUgZ2V0UHJvdmlkZXJPdmVycmlkZXMocHJvdmlkZXJzPzogUHJvdmlkZXJbXSk6IFByb3ZpZGVyW10ge1xuICAgIGlmICghcHJvdmlkZXJzIHx8ICFwcm92aWRlcnMubGVuZ3RoIHx8IHRoaXMucHJvdmlkZXJPdmVycmlkZXNCeVRva2VuLnNpemUgPT09IDApIHJldHVybiBbXTtcbiAgICAvLyBUaGVyZSBhcmUgdHdvIGZsYXR0ZW5pbmcgb3BlcmF0aW9ucyBoZXJlLiBUaGUgaW5uZXIgZmxhdHRlbigpIG9wZXJhdGVzIG9uIHRoZSBtZXRhZGF0YSdzXG4gICAgLy8gcHJvdmlkZXJzIGFuZCBhcHBsaWVzIGEgbWFwcGluZyBmdW5jdGlvbiB3aGljaCByZXRyaWV2ZXMgb3ZlcnJpZGVzIGZvciBlYWNoIGluY29taW5nXG4gICAgLy8gcHJvdmlkZXIuIFRoZSBvdXRlciBmbGF0dGVuKCkgdGhlbiBmbGF0dGVucyB0aGUgcHJvZHVjZWQgb3ZlcnJpZGVzIGFycmF5LiBJZiB0aGlzIGlzIG5vdFxuICAgIC8vIGRvbmUsIHRoZSBhcnJheSBjYW4gY29udGFpbiBvdGhlciBlbXB0eSBhcnJheXMgKGUuZy4gYFtbXSwgW11dYCkgd2hpY2ggbGVhayBpbnRvIHRoZVxuICAgIC8vIHByb3ZpZGVycyBhcnJheSBhbmQgY29udGFtaW5hdGUgYW55IGVycm9yIG1lc3NhZ2VzIHRoYXQgbWlnaHQgYmUgZ2VuZXJhdGVkLlxuICAgIHJldHVybiBmbGF0dGVuKGZsYXR0ZW4oXG4gICAgICAgIHByb3ZpZGVycywgKHByb3ZpZGVyOiBQcm92aWRlcikgPT4gdGhpcy5nZXRTaW5nbGVQcm92aWRlck92ZXJyaWRlcyhwcm92aWRlcikgfHwgW10pKTtcbiAgfVxuXG4gIHByaXZhdGUgZ2V0T3ZlcnJpZGRlblByb3ZpZGVycyhwcm92aWRlcnM/OiBQcm92aWRlcltdKTogUHJvdmlkZXJbXSB7XG4gICAgaWYgKCFwcm92aWRlcnMgfHwgIXByb3ZpZGVycy5sZW5ndGggfHwgdGhpcy5wcm92aWRlck92ZXJyaWRlc0J5VG9rZW4uc2l6ZSA9PT0gMCkgcmV0dXJuIFtdO1xuXG4gICAgY29uc3QgZmxhdHRlbmVkUHJvdmlkZXJzID0gZmxhdHRlbjxQcm92aWRlcltdPihwcm92aWRlcnMpO1xuICAgIGNvbnN0IG92ZXJyaWRlcyA9IHRoaXMuZ2V0UHJvdmlkZXJPdmVycmlkZXMoZmxhdHRlbmVkUHJvdmlkZXJzKTtcbiAgICBjb25zdCBvdmVycmlkZGVuUHJvdmlkZXJzID0gWy4uLmZsYXR0ZW5lZFByb3ZpZGVycywgLi4ub3ZlcnJpZGVzXTtcbiAgICBjb25zdCBmaW5hbDogUHJvdmlkZXJbXSA9IFtdO1xuICAgIGNvbnN0IHNlZW5NdWx0aVByb3ZpZGVycyA9IG5ldyBTZXQ8UHJvdmlkZXI+KCk7XG5cbiAgICAvLyBXZSBpdGVyYXRlIHRocm91Z2ggdGhlIGxpc3Qgb2YgcHJvdmlkZXJzIGluIHJldmVyc2Ugb3JkZXIgdG8gbWFrZSBzdXJlIG11bHRpIHByb3ZpZGVyXG4gICAgLy8gb3ZlcnJpZGVzIHRha2UgcHJlY2VkZW5jZSBvdmVyIHRoZSB2YWx1ZXMgZGVmaW5lZCBpbiBwcm92aWRlciBsaXN0LiBXZSBhbHNvIGZpbHRlciBvdXQgYWxsXG4gICAgLy8gbXVsdGkgcHJvdmlkZXJzIHRoYXQgaGF2ZSBvdmVycmlkZXMsIGtlZXBpbmcgb3ZlcnJpZGRlbiB2YWx1ZXMgb25seS5cbiAgICBmb3JFYWNoUmlnaHQob3ZlcnJpZGRlblByb3ZpZGVycywgKHByb3ZpZGVyOiBhbnkpID0+IHtcbiAgICAgIGNvbnN0IHRva2VuOiBhbnkgPSBnZXRQcm92aWRlclRva2VuKHByb3ZpZGVyKTtcbiAgICAgIGlmIChpc011bHRpUHJvdmlkZXIocHJvdmlkZXIpICYmIHRoaXMucHJvdmlkZXJPdmVycmlkZXNCeVRva2VuLmhhcyh0b2tlbikpIHtcbiAgICAgICAgLy8gRG9uJ3QgYWRkIG92ZXJyaWRkZW4gbXVsdGktcHJvdmlkZXJzIHR3aWNlIGJlY2F1c2Ugd2hlbiB5b3Ugb3ZlcnJpZGUgYSBtdWx0aS1wcm92aWRlciwgd2VcbiAgICAgICAgLy8gdHJlYXQgaXQgYXMgYHttdWx0aTogZmFsc2V9YCB0byBhdm9pZCBwcm92aWRpbmcgdGhlIHNhbWUgdmFsdWUgbXVsdGlwbGUgdGltZXMuXG4gICAgICAgIGlmICghc2Vlbk11bHRpUHJvdmlkZXJzLmhhcyh0b2tlbikpIHtcbiAgICAgICAgICBzZWVuTXVsdGlQcm92aWRlcnMuYWRkKHRva2VuKTtcbiAgICAgICAgICBmaW5hbC51bnNoaWZ0KHsuLi5wcm92aWRlciwgbXVsdGk6IGZhbHNlfSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGZpbmFsLnVuc2hpZnQocHJvdmlkZXIpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiBmaW5hbDtcbiAgfVxuXG4gIHByaXZhdGUgaGFzUHJvdmlkZXJPdmVycmlkZXMocHJvdmlkZXJzPzogUHJvdmlkZXJbXSk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLmdldFByb3ZpZGVyT3ZlcnJpZGVzKHByb3ZpZGVycykubGVuZ3RoID4gMDtcbiAgfVxuXG4gIHByaXZhdGUgcGF0Y2hEZWZXaXRoUHJvdmlkZXJPdmVycmlkZXMoZGVjbGFyYXRpb246IFR5cGU8YW55PiwgZmllbGQ6IHN0cmluZyk6IHZvaWQge1xuICAgIGNvbnN0IGRlZiA9IChkZWNsYXJhdGlvbiBhcyBhbnkpW2ZpZWxkXTtcbiAgICBpZiAoZGVmICYmIGRlZi5wcm92aWRlcnNSZXNvbHZlcikge1xuICAgICAgdGhpcy5tYXliZVN0b3JlTmdEZWYoZmllbGQsIGRlY2xhcmF0aW9uKTtcblxuICAgICAgY29uc3QgcmVzb2x2ZXIgPSBkZWYucHJvdmlkZXJzUmVzb2x2ZXI7XG4gICAgICBjb25zdCBwcm9jZXNzUHJvdmlkZXJzRm4gPSAocHJvdmlkZXJzOiBQcm92aWRlcltdKSA9PiB0aGlzLmdldE92ZXJyaWRkZW5Qcm92aWRlcnMocHJvdmlkZXJzKTtcbiAgICAgIHRoaXMuc3RvcmVGaWVsZE9mRGVmT25UeXBlKGRlY2xhcmF0aW9uLCBmaWVsZCwgJ3Byb3ZpZGVyc1Jlc29sdmVyJyk7XG4gICAgICBkZWYucHJvdmlkZXJzUmVzb2x2ZXIgPSAobmdEZWY6IERpcmVjdGl2ZURlZjxhbnk+KSA9PiByZXNvbHZlcihuZ0RlZiwgcHJvY2Vzc1Byb3ZpZGVyc0ZuKTtcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gaW5pdFJlc29sdmVycygpOiBSZXNvbHZlcnMge1xuICByZXR1cm4ge1xuICAgIG1vZHVsZTogbmV3IE5nTW9kdWxlUmVzb2x2ZXIoKSxcbiAgICBjb21wb25lbnQ6IG5ldyBDb21wb25lbnRSZXNvbHZlcigpLFxuICAgIGRpcmVjdGl2ZTogbmV3IERpcmVjdGl2ZVJlc29sdmVyKCksXG4gICAgcGlwZTogbmV3IFBpcGVSZXNvbHZlcigpXG4gIH07XG59XG5cbmZ1bmN0aW9uIGhhc05nTW9kdWxlRGVmPFQ+KHZhbHVlOiBUeXBlPFQ+KTogdmFsdWUgaXMgTmdNb2R1bGVUeXBlPFQ+IHtcbiAgcmV0dXJuIHZhbHVlLmhhc093blByb3BlcnR5KCfJtW1vZCcpO1xufVxuXG5mdW5jdGlvbiBtYXliZVVud3JhcEZuPFQ+KG1heWJlRm46ICgoKSA9PiBUKSB8IFQpOiBUIHtcbiAgcmV0dXJuIG1heWJlRm4gaW5zdGFuY2VvZiBGdW5jdGlvbiA/IG1heWJlRm4oKSA6IG1heWJlRm47XG59XG5cbmZ1bmN0aW9uIGZsYXR0ZW48VD4odmFsdWVzOiBhbnlbXSwgbWFwRm4/OiAodmFsdWU6IFQpID0+IGFueSk6IFRbXSB7XG4gIGNvbnN0IG91dDogVFtdID0gW107XG4gIHZhbHVlcy5mb3JFYWNoKHZhbHVlID0+IHtcbiAgICBpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHtcbiAgICAgIG91dC5wdXNoKC4uLmZsYXR0ZW48VD4odmFsdWUsIG1hcEZuKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG91dC5wdXNoKG1hcEZuID8gbWFwRm4odmFsdWUpIDogdmFsdWUpO1xuICAgIH1cbiAgfSk7XG4gIHJldHVybiBvdXQ7XG59XG5cbmZ1bmN0aW9uIGdldFByb3ZpZGVyRmllbGQocHJvdmlkZXI6IFByb3ZpZGVyLCBmaWVsZDogc3RyaW5nKSB7XG4gIHJldHVybiBwcm92aWRlciAmJiB0eXBlb2YgcHJvdmlkZXIgPT09ICdvYmplY3QnICYmIChwcm92aWRlciBhcyBhbnkpW2ZpZWxkXTtcbn1cblxuZnVuY3Rpb24gZ2V0UHJvdmlkZXJUb2tlbihwcm92aWRlcjogUHJvdmlkZXIpIHtcbiAgcmV0dXJuIGdldFByb3ZpZGVyRmllbGQocHJvdmlkZXIsICdwcm92aWRlJykgfHwgcHJvdmlkZXI7XG59XG5cbmZ1bmN0aW9uIGlzTXVsdGlQcm92aWRlcihwcm92aWRlcjogUHJvdmlkZXIpIHtcbiAgcmV0dXJuICEhZ2V0UHJvdmlkZXJGaWVsZChwcm92aWRlciwgJ211bHRpJyk7XG59XG5cbmZ1bmN0aW9uIGlzTW9kdWxlV2l0aFByb3ZpZGVycyh2YWx1ZTogYW55KTogdmFsdWUgaXMgTW9kdWxlV2l0aFByb3ZpZGVyczxhbnk+IHtcbiAgcmV0dXJuIHZhbHVlLmhhc093blByb3BlcnR5KCduZ01vZHVsZScpO1xufVxuXG5mdW5jdGlvbiBmb3JFYWNoUmlnaHQ8VD4odmFsdWVzOiBUW10sIGZuOiAodmFsdWU6IFQsIGlkeDogbnVtYmVyKSA9PiB2b2lkKTogdm9pZCB7XG4gIGZvciAobGV0IGlkeCA9IHZhbHVlcy5sZW5ndGggLSAxOyBpZHggPj0gMDsgaWR4LS0pIHtcbiAgICBmbih2YWx1ZXNbaWR4XSwgaWR4KTtcbiAgfVxufVxuXG5jbGFzcyBSM1Rlc3RDb21waWxlciBpbXBsZW1lbnRzIENvbXBpbGVyIHtcbiAgY29uc3RydWN0b3IocHJpdmF0ZSB0ZXN0QmVkOiBSM1Rlc3RCZWRDb21waWxlcikge31cblxuICBjb21waWxlTW9kdWxlU3luYzxUPihtb2R1bGVUeXBlOiBUeXBlPFQ+KTogTmdNb2R1bGVGYWN0b3J5PFQ+IHtcbiAgICB0aGlzLnRlc3RCZWQuX2NvbXBpbGVOZ01vZHVsZVN5bmMobW9kdWxlVHlwZSk7XG4gICAgcmV0dXJuIG5ldyBSM05nTW9kdWxlRmFjdG9yeShtb2R1bGVUeXBlKTtcbiAgfVxuXG4gIGFzeW5jIGNvbXBpbGVNb2R1bGVBc3luYzxUPihtb2R1bGVUeXBlOiBUeXBlPFQ+KTogUHJvbWlzZTxOZ01vZHVsZUZhY3Rvcnk8VD4+IHtcbiAgICBhd2FpdCB0aGlzLnRlc3RCZWQuX2NvbXBpbGVOZ01vZHVsZUFzeW5jKG1vZHVsZVR5cGUpO1xuICAgIHJldHVybiBuZXcgUjNOZ01vZHVsZUZhY3RvcnkobW9kdWxlVHlwZSk7XG4gIH1cblxuICBjb21waWxlTW9kdWxlQW5kQWxsQ29tcG9uZW50c1N5bmM8VD4obW9kdWxlVHlwZTogVHlwZTxUPik6IE1vZHVsZVdpdGhDb21wb25lbnRGYWN0b3JpZXM8VD4ge1xuICAgIGNvbnN0IG5nTW9kdWxlRmFjdG9yeSA9IHRoaXMuY29tcGlsZU1vZHVsZVN5bmMobW9kdWxlVHlwZSk7XG4gICAgY29uc3QgY29tcG9uZW50RmFjdG9yaWVzID0gdGhpcy50ZXN0QmVkLl9nZXRDb21wb25lbnRGYWN0b3JpZXMobW9kdWxlVHlwZSBhcyBOZ01vZHVsZVR5cGU8VD4pO1xuICAgIHJldHVybiBuZXcgTW9kdWxlV2l0aENvbXBvbmVudEZhY3RvcmllcyhuZ01vZHVsZUZhY3RvcnksIGNvbXBvbmVudEZhY3Rvcmllcyk7XG4gIH1cblxuICBhc3luYyBjb21waWxlTW9kdWxlQW5kQWxsQ29tcG9uZW50c0FzeW5jPFQ+KG1vZHVsZVR5cGU6IFR5cGU8VD4pOlxuICAgICAgUHJvbWlzZTxNb2R1bGVXaXRoQ29tcG9uZW50RmFjdG9yaWVzPFQ+PiB7XG4gICAgY29uc3QgbmdNb2R1bGVGYWN0b3J5ID0gYXdhaXQgdGhpcy5jb21waWxlTW9kdWxlQXN5bmMobW9kdWxlVHlwZSk7XG4gICAgY29uc3QgY29tcG9uZW50RmFjdG9yaWVzID0gdGhpcy50ZXN0QmVkLl9nZXRDb21wb25lbnRGYWN0b3JpZXMobW9kdWxlVHlwZSBhcyBOZ01vZHVsZVR5cGU8VD4pO1xuICAgIHJldHVybiBuZXcgTW9kdWxlV2l0aENvbXBvbmVudEZhY3RvcmllcyhuZ01vZHVsZUZhY3RvcnksIGNvbXBvbmVudEZhY3Rvcmllcyk7XG4gIH1cblxuICBjbGVhckNhY2hlKCk6IHZvaWQge31cblxuICBjbGVhckNhY2hlRm9yKHR5cGU6IFR5cGU8YW55Pik6IHZvaWQge31cblxuICBnZXRNb2R1bGVJZChtb2R1bGVUeXBlOiBUeXBlPGFueT4pOiBzdHJpbmd8dW5kZWZpbmVkIHtcbiAgICBjb25zdCBtZXRhID0gdGhpcy50ZXN0QmVkLl9nZXRNb2R1bGVSZXNvbHZlcigpLnJlc29sdmUobW9kdWxlVHlwZSk7XG4gICAgcmV0dXJuIG1ldGEgJiYgbWV0YS5pZCB8fCB1bmRlZmluZWQ7XG4gIH1cbn1cbiJdfQ==