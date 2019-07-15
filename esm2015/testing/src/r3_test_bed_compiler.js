/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
import * as tslib_1 from "tslib";
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ResourceLoader } from '@angular/compiler';
import { ApplicationInitStatus, COMPILER_OPTIONS, Compiler, LOCALE_ID, ModuleWithComponentFactories, NgZone, ɵDEFAULT_LOCALE_ID as DEFAULT_LOCALE_ID, ɵNG_COMPONENT_DEF as NG_COMPONENT_DEF, ɵNG_DIRECTIVE_DEF as NG_DIRECTIVE_DEF, ɵNG_INJECTOR_DEF as NG_INJECTOR_DEF, ɵNG_MODULE_DEF as NG_MODULE_DEF, ɵNG_PIPE_DEF as NG_PIPE_DEF, ɵNgModuleFactory as R3NgModuleFactory, ɵRender3ComponentFactory as ComponentFactory, ɵRender3NgModuleRef as NgModuleRef, ɵcompileComponent as compileComponent, ɵcompileDirective as compileDirective, ɵcompileNgModuleDefs as compileNgModuleDefs, ɵcompilePipe as compilePipe, ɵgetInjectableDef as getInjectableDef, ɵpatchComponentDefWithScope as patchComponentDefWithScope, ɵsetLocaleId as setLocaleId, ɵtransitiveScopesFor as transitiveScopesFor } from '@angular/core';
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
    CleanupOperation.prototype.field;
    /** @type {?} */
    CleanupOperation.prototype.def;
    /** @type {?} */
    CleanupOperation.prototype.original;
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
        // At this point, the module has a valid .ngModuleDef, but the override may have introduced
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
                multi: provider.multi,
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
        const def = ((/** @type {?} */ (type)))[NG_COMPONENT_DEF];
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
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
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
        // Patch previously stored `styles` Component values (taken from ngComponentDef), in case these
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
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
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
        return maybeUnwrapFn(moduleType.ngModuleDef.declarations).reduce((/**
         * @param {?} factories
         * @param {?} declaration
         * @return {?}
         */
        (factories, declaration) => {
            /** @nocollapse @type {?} */
            const componentDef = ((/** @type {?} */ (declaration))).ngComponentDef;
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
            this.maybeStoreNgDef(NG_COMPONENT_DEF, declaration);
            compileComponent(declaration, metadata);
        }));
        this.pendingComponents.clear();
        this.pendingDirectives.forEach((/**
         * @param {?} declaration
         * @return {?}
         */
        declaration => {
            /** @type {?} */
            const metadata = (/** @type {?} */ (this.resolvers.directive.resolve(declaration)));
            this.maybeStoreNgDef(NG_DIRECTIVE_DEF, declaration);
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
            this.storeFieldOfDefOnType(componentType, NG_COMPONENT_DEF, 'directiveDefs');
            this.storeFieldOfDefOnType(componentType, NG_COMPONENT_DEF, 'pipeDefs');
            patchComponentDefWithScope(((/** @type {?} */ (componentType))).ngComponentDef, moduleScope);
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
            const resolver = field === NG_COMPONENT_DEF ? this.resolvers.component : this.resolvers.directive;
            /** @type {?} */
            const metadata = (/** @type {?} */ (resolver.resolve(type)));
            if (this.hasProviderOverrides(metadata.providers)) {
                this.patchDefWithProviderOverrides(type, field);
            }
        }));
        this.seenComponents.forEach(maybeApplyOverrides(NG_COMPONENT_DEF));
        this.seenDirectives.forEach(maybeApplyOverrides(NG_DIRECTIVE_DEF));
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
        const injectorDef = ((/** @type {?} */ (moduleType)))[NG_INJECTOR_DEF];
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
                this.maybeStoreNgDef(NG_INJECTOR_DEF, moduleType);
                this.storeFieldOfDefOnType(moduleType, NG_INJECTOR_DEF, 'providers');
                injectorDef.providers = this.getOverriddenProviders(providers);
            }
            // Apply provider overrides to imported modules recursively
            /** @type {?} */
            const moduleDef = ((/** @type {?} */ (moduleType)))[NG_MODULE_DEF];
            for (const importType of moduleDef.imports) {
                this.applyProviderOverridesToModule(importType);
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
        (styles, type) => ((/** @type {?} */ (type)))[NG_COMPONENT_DEF].styles = styles));
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
        this.maybeStoreNgDef(NG_MODULE_DEF, ngModule);
        this.maybeStoreNgDef(NG_INJECTOR_DEF, ngModule);
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
            // Check whether a give Type has respective NG def (ngComponentDef) and compile if def is
            // missing. That might happen in case a class without any Angular decorators extends another
            // class where Component/Directive/Pipe decorator is defined.
            if (isComponentDefPendingResolution(type) || !type.hasOwnProperty(NG_COMPONENT_DEF)) {
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
            if (!type.hasOwnProperty(NG_DIRECTIVE_DEF)) {
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
                const def = value.ngModuleDef;
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
     * @param {?} field
     * @return {?}
     */
    storeFieldOfDefOnType(type, defField, field) {
        /** @type {?} */
        const def = ((/** @type {?} */ (type)))[defField];
        /** @type {?} */
        const original = def[field];
        this.defCleanupOps.push({ field, def, original });
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
        for (const op of this.defCleanupOps) {
            op.def[op.field] = op.original;
        }
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
                // on objects they were applied to. In this particular case, situations where this code is
                // invoked should be quite rare to cause any noticable impact, since it's applied only to
                // some test cases (for example when class with no annotations extends some @Component)
                // when we need to clear 'ngComponentDef' field on a given class to restore its original
                // state (before applying overrides and running tests).
                delete ((/** @type {?} */ (type)))[prop];
            }
            else {
                Object.defineProperty(type, prop, descriptor);
            }
        }));
        this.initialNgDefs.clear();
        this.moduleProvidersOverridden.clear();
        this.restoreComponentResolutionQueue();
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
        const overrides = this.getProviderOverrides(providers);
        /** @type {?} */
        const hasMultiProviderOverrides = overrides.some(isMultiProvider);
        /** @type {?} */
        const overriddenProviders = [...providers, ...overrides];
        // No additional processing is required in case we have no multi providers to override
        if (!hasMultiProviderOverrides) {
            return overriddenProviders;
        }
        /** @type {?} */
        const final = [];
        /** @type {?} */
        const seenMultiProviders = new Set();
        // We iterate through the list of providers in reverse order to make sure multi provider
        // overrides take precedence over the values defined in provider list. We also fiter out all
        // multi providers that have overrides, keeping overridden values only.
        forEachRight(overriddenProviders, (/**
         * @param {?} provider
         * @return {?}
         */
        (provider) => {
            /** @type {?} */
            const token = getProviderToken(provider);
            if (isMultiProvider(provider) && this.providerOverridesByToken.has(token)) {
                if (!seenMultiProviders.has(token)) {
                    seenMultiProviders.add(token);
                    if (provider && provider.useValue && Array.isArray(provider.useValue)) {
                        forEachRight(provider.useValue, (/**
                         * @param {?} value
                         * @return {?}
                         */
                        (value) => {
                            // Unwrap provider override array into individual providers in final set.
                            final.unshift({ provide: token, useValue: value, multi: true });
                        }));
                    }
                    else {
                        final.unshift(provider);
                    }
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
    return value.hasOwnProperty('ngModuleDef');
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
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
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
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicjNfdGVzdF9iZWRfY29tcGlsZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3Rlc3Rpbmcvc3JjL3IzX3Rlc3RfYmVkX2NvbXBpbGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQVFBLE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUNqRCxPQUFPLEVBQUMscUJBQXFCLEVBQUUsZ0JBQWdCLEVBQUUsUUFBUSxFQUFrQyxTQUFTLEVBQUUsNEJBQTRCLEVBQWtELE1BQU0sRUFBcUMsa0JBQWtCLElBQUksaUJBQWlCLEVBQWlDLGlCQUFpQixJQUFJLGdCQUFnQixFQUFFLGlCQUFpQixJQUFJLGdCQUFnQixFQUFFLGdCQUFnQixJQUFJLGVBQWUsRUFBRSxjQUFjLElBQUksYUFBYSxFQUFFLFlBQVksSUFBSSxXQUFXLEVBQUUsZ0JBQWdCLElBQUksaUJBQWlCLEVBQXdGLHdCQUF3QixJQUFJLGdCQUFnQixFQUFFLG1CQUFtQixJQUFJLFdBQVcsRUFBRSxpQkFBaUIsSUFBSSxnQkFBZ0IsRUFBRSxpQkFBaUIsSUFBSSxnQkFBZ0IsRUFBRSxvQkFBb0IsSUFBSSxtQkFBbUIsRUFBRSxZQUFZLElBQUksV0FBVyxFQUFFLGlCQUFpQixJQUFJLGdCQUFnQixFQUFFLDJCQUEyQixJQUFJLDBCQUEwQixFQUFFLFlBQVksSUFBSSxXQUFXLEVBQUUsb0JBQW9CLElBQUksbUJBQW1CLEVBQW1DLE1BQU0sZUFBZSxDQUFDO0FBRWxpQyxPQUFPLEVBQUMsd0NBQXdDLEVBQUUsK0JBQStCLEVBQUUseUJBQXlCLEVBQUUsK0JBQStCLEVBQUMsTUFBTSxxQ0FBcUMsQ0FBQztBQUcxTCxPQUFPLEVBQUMsaUJBQWlCLEVBQUUsaUJBQWlCLEVBQUUsZ0JBQWdCLEVBQUUsWUFBWSxFQUFXLE1BQU0sYUFBYSxDQUFDOzs7SUFJekcsY0FBVztJQUNYLG9CQUFpQjs7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QztLQUFBOzs7Ozs7SUFFRCxpQ0FBaUMsQ0FBSSxVQUFtQjs7Y0FDaEQsZUFBZSxHQUFHLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxVQUFVLENBQUM7O2NBQ3BELGtCQUFrQixHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsc0JBQXNCLENBQUMsbUJBQUEsVUFBVSxFQUFtQixDQUFDO1FBQzdGLE9BQU8sSUFBSSw0QkFBNEIsQ0FBQyxlQUFlLEVBQUUsa0JBQWtCLENBQUMsQ0FBQztJQUMvRSxDQUFDOzs7Ozs7SUFFSyxrQ0FBa0MsQ0FBSSxVQUFtQjs7O2tCQUV2RCxlQUFlLEdBQUcsTUFBTSxJQUFJLENBQUMsa0JBQWtCLENBQUMsVUFBVSxDQUFDOztrQkFDM0Qsa0JBQWtCLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxzQkFBc0IsQ0FBQyxtQkFBQSxVQUFVLEVBQW1CLENBQUM7WUFDN0YsT0FBTyxJQUFJLDRCQUE0QixDQUFDLGVBQWUsRUFBRSxrQkFBa0IsQ0FBQyxDQUFDO1FBQy9FLENBQUM7S0FBQTs7OztJQUVELFVBQVUsS0FBVSxDQUFDOzs7OztJQUVyQixhQUFhLENBQUMsSUFBZSxJQUFTLENBQUM7Ozs7O0lBRXZDLFdBQVcsQ0FBQyxVQUFxQjs7Y0FDekIsSUFBSSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsa0JBQWtCLEVBQUUsQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDO1FBQ2xFLE9BQU8sSUFBSSxJQUFJLElBQUksQ0FBQyxFQUFFLElBQUksU0FBUyxDQUFDO0lBQ3RDLENBQUM7Q0FDRjs7Ozs7O0lBakNhLGlDQUFrQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtSZXNvdXJjZUxvYWRlcn0gZnJvbSAnQGFuZ3VsYXIvY29tcGlsZXInO1xuaW1wb3J0IHtBcHBsaWNhdGlvbkluaXRTdGF0dXMsIENPTVBJTEVSX09QVElPTlMsIENvbXBpbGVyLCBDb21wb25lbnQsIERpcmVjdGl2ZSwgSW5qZWN0b3IsIExPQ0FMRV9JRCwgTW9kdWxlV2l0aENvbXBvbmVudEZhY3RvcmllcywgTW9kdWxlV2l0aFByb3ZpZGVycywgTmdNb2R1bGUsIE5nTW9kdWxlRmFjdG9yeSwgTmdab25lLCBQaXBlLCBQbGF0Zm9ybVJlZiwgUHJvdmlkZXIsIFR5cGUsIMm1REVGQVVMVF9MT0NBTEVfSUQgYXMgREVGQVVMVF9MT0NBTEVfSUQsIMm1RGlyZWN0aXZlRGVmIGFzIERpcmVjdGl2ZURlZiwgybVOR19DT01QT05FTlRfREVGIGFzIE5HX0NPTVBPTkVOVF9ERUYsIMm1TkdfRElSRUNUSVZFX0RFRiBhcyBOR19ESVJFQ1RJVkVfREVGLCDJtU5HX0lOSkVDVE9SX0RFRiBhcyBOR19JTkpFQ1RPUl9ERUYsIMm1TkdfTU9EVUxFX0RFRiBhcyBOR19NT0RVTEVfREVGLCDJtU5HX1BJUEVfREVGIGFzIE5HX1BJUEVfREVGLCDJtU5nTW9kdWxlRmFjdG9yeSBhcyBSM05nTW9kdWxlRmFjdG9yeSwgybVOZ01vZHVsZVRyYW5zaXRpdmVTY29wZXMgYXMgTmdNb2R1bGVUcmFuc2l0aXZlU2NvcGVzLCDJtU5nTW9kdWxlVHlwZSBhcyBOZ01vZHVsZVR5cGUsIMm1UmVuZGVyM0NvbXBvbmVudEZhY3RvcnkgYXMgQ29tcG9uZW50RmFjdG9yeSwgybVSZW5kZXIzTmdNb2R1bGVSZWYgYXMgTmdNb2R1bGVSZWYsIMm1Y29tcGlsZUNvbXBvbmVudCBhcyBjb21waWxlQ29tcG9uZW50LCDJtWNvbXBpbGVEaXJlY3RpdmUgYXMgY29tcGlsZURpcmVjdGl2ZSwgybVjb21waWxlTmdNb2R1bGVEZWZzIGFzIGNvbXBpbGVOZ01vZHVsZURlZnMsIMm1Y29tcGlsZVBpcGUgYXMgY29tcGlsZVBpcGUsIMm1Z2V0SW5qZWN0YWJsZURlZiBhcyBnZXRJbmplY3RhYmxlRGVmLCDJtXBhdGNoQ29tcG9uZW50RGVmV2l0aFNjb3BlIGFzIHBhdGNoQ29tcG9uZW50RGVmV2l0aFNjb3BlLCDJtXNldExvY2FsZUlkIGFzIHNldExvY2FsZUlkLCDJtXRyYW5zaXRpdmVTY29wZXNGb3IgYXMgdHJhbnNpdGl2ZVNjb3Blc0ZvciwgybXJtUluamVjdGFibGVEZWYgYXMgSW5qZWN0YWJsZURlZn0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5cbmltcG9ydCB7Y2xlYXJSZXNvbHV0aW9uT2ZDb21wb25lbnRSZXNvdXJjZXNRdWV1ZSwgaXNDb21wb25lbnREZWZQZW5kaW5nUmVzb2x1dGlvbiwgcmVzb2x2ZUNvbXBvbmVudFJlc291cmNlcywgcmVzdG9yZUNvbXBvbmVudFJlc29sdXRpb25RdWV1ZX0gZnJvbSAnLi4vLi4vc3JjL21ldGFkYXRhL3Jlc291cmNlX2xvYWRpbmcnO1xuXG5pbXBvcnQge01ldGFkYXRhT3ZlcnJpZGV9IGZyb20gJy4vbWV0YWRhdGFfb3ZlcnJpZGUnO1xuaW1wb3J0IHtDb21wb25lbnRSZXNvbHZlciwgRGlyZWN0aXZlUmVzb2x2ZXIsIE5nTW9kdWxlUmVzb2x2ZXIsIFBpcGVSZXNvbHZlciwgUmVzb2x2ZXJ9IGZyb20gJy4vcmVzb2x2ZXJzJztcbmltcG9ydCB7VGVzdE1vZHVsZU1ldGFkYXRhfSBmcm9tICcuL3Rlc3RfYmVkX2NvbW1vbic7XG5cbmVudW0gVGVzdGluZ01vZHVsZU92ZXJyaWRlIHtcbiAgREVDTEFSQVRJT04sXG4gIE9WRVJSSURFX1RFTVBMQVRFLFxufVxuXG5mdW5jdGlvbiBpc1Rlc3RpbmdNb2R1bGVPdmVycmlkZSh2YWx1ZTogdW5rbm93bik6IHZhbHVlIGlzIFRlc3RpbmdNb2R1bGVPdmVycmlkZSB7XG4gIHJldHVybiB2YWx1ZSA9PT0gVGVzdGluZ01vZHVsZU92ZXJyaWRlLkRFQ0xBUkFUSU9OIHx8XG4gICAgICB2YWx1ZSA9PT0gVGVzdGluZ01vZHVsZU92ZXJyaWRlLk9WRVJSSURFX1RFTVBMQVRFO1xufVxuXG4vLyBSZXNvbHZlcnMgZm9yIEFuZ3VsYXIgZGVjb3JhdG9yc1xudHlwZSBSZXNvbHZlcnMgPSB7XG4gIG1vZHVsZTogUmVzb2x2ZXI8TmdNb2R1bGU+LFxuICBjb21wb25lbnQ6IFJlc29sdmVyPERpcmVjdGl2ZT4sXG4gIGRpcmVjdGl2ZTogUmVzb2x2ZXI8Q29tcG9uZW50PixcbiAgcGlwZTogUmVzb2x2ZXI8UGlwZT4sXG59O1xuXG5pbnRlcmZhY2UgQ2xlYW51cE9wZXJhdGlvbiB7XG4gIGZpZWxkOiBzdHJpbmc7XG4gIGRlZjogYW55O1xuICBvcmlnaW5hbDogdW5rbm93bjtcbn1cblxuZXhwb3J0IGNsYXNzIFIzVGVzdEJlZENvbXBpbGVyIHtcbiAgcHJpdmF0ZSBvcmlnaW5hbENvbXBvbmVudFJlc29sdXRpb25RdWV1ZTogTWFwPFR5cGU8YW55PiwgQ29tcG9uZW50PnxudWxsID0gbnVsbDtcblxuICAvLyBUZXN0aW5nIG1vZHVsZSBjb25maWd1cmF0aW9uXG4gIHByaXZhdGUgZGVjbGFyYXRpb25zOiBUeXBlPGFueT5bXSA9IFtdO1xuICBwcml2YXRlIGltcG9ydHM6IFR5cGU8YW55PltdID0gW107XG4gIHByaXZhdGUgcHJvdmlkZXJzOiBQcm92aWRlcltdID0gW107XG4gIHByaXZhdGUgc2NoZW1hczogYW55W10gPSBbXTtcblxuICAvLyBRdWV1ZXMgb2YgY29tcG9uZW50cy9kaXJlY3RpdmVzL3BpcGVzIHRoYXQgc2hvdWxkIGJlIHJlY29tcGlsZWQuXG4gIHByaXZhdGUgcGVuZGluZ0NvbXBvbmVudHMgPSBuZXcgU2V0PFR5cGU8YW55Pj4oKTtcbiAgcHJpdmF0ZSBwZW5kaW5nRGlyZWN0aXZlcyA9IG5ldyBTZXQ8VHlwZTxhbnk+PigpO1xuICBwcml2YXRlIHBlbmRpbmdQaXBlcyA9IG5ldyBTZXQ8VHlwZTxhbnk+PigpO1xuXG4gIC8vIEtlZXAgdHJhY2sgb2YgYWxsIGNvbXBvbmVudHMgYW5kIGRpcmVjdGl2ZXMsIHNvIHdlIGNhbiBwYXRjaCBQcm92aWRlcnMgb250byBkZWZzIGxhdGVyLlxuICBwcml2YXRlIHNlZW5Db21wb25lbnRzID0gbmV3IFNldDxUeXBlPGFueT4+KCk7XG4gIHByaXZhdGUgc2VlbkRpcmVjdGl2ZXMgPSBuZXcgU2V0PFR5cGU8YW55Pj4oKTtcblxuICAvLyBTdG9yZSByZXNvbHZlZCBzdHlsZXMgZm9yIENvbXBvbmVudHMgdGhhdCBoYXZlIHRlbXBsYXRlIG92ZXJyaWRlcyBwcmVzZW50IGFuZCBgc3R5bGVVcmxzYFxuICAvLyBkZWZpbmVkIGF0IHRoZSBzYW1lIHRpbWUuXG4gIHByaXZhdGUgZXhpc3RpbmdDb21wb25lbnRTdHlsZXMgPSBuZXcgTWFwPFR5cGU8YW55Piwgc3RyaW5nW10+KCk7XG5cbiAgcHJpdmF0ZSByZXNvbHZlcnM6IFJlc29sdmVycyA9IGluaXRSZXNvbHZlcnMoKTtcblxuICBwcml2YXRlIGNvbXBvbmVudFRvTW9kdWxlU2NvcGUgPSBuZXcgTWFwPFR5cGU8YW55PiwgVHlwZTxhbnk+fFRlc3RpbmdNb2R1bGVPdmVycmlkZT4oKTtcblxuICAvLyBNYXAgdGhhdCBrZWVwcyBpbml0aWFsIHZlcnNpb24gb2YgY29tcG9uZW50L2RpcmVjdGl2ZS9waXBlIGRlZnMgaW4gY2FzZVxuICAvLyB3ZSBjb21waWxlIGEgVHlwZSBhZ2FpbiwgdGh1cyBvdmVycmlkaW5nIHJlc3BlY3RpdmUgc3RhdGljIGZpZWxkcy4gVGhpcyBpc1xuICAvLyByZXF1aXJlZCB0byBtYWtlIHN1cmUgd2UgcmVzdG9yZSBkZWZzIHRvIHRoZWlyIGluaXRpYWwgc3RhdGVzIGJldHdlZW4gdGVzdCBydW5zXG4gIC8vIFRPRE86IHdlIHNob3VsZCBzdXBwb3J0IHRoZSBjYXNlIHdpdGggbXVsdGlwbGUgZGVmcyBvbiBhIHR5cGVcbiAgcHJpdmF0ZSBpbml0aWFsTmdEZWZzID0gbmV3IE1hcDxUeXBlPGFueT4sIFtzdHJpbmcsIFByb3BlcnR5RGVzY3JpcHRvcnx1bmRlZmluZWRdPigpO1xuXG4gIC8vIEFycmF5IHRoYXQga2VlcHMgY2xlYW51cCBvcGVyYXRpb25zIGZvciBpbml0aWFsIHZlcnNpb25zIG9mIGNvbXBvbmVudC9kaXJlY3RpdmUvcGlwZS9tb2R1bGVcbiAgLy8gZGVmcyBpbiBjYXNlIFRlc3RCZWQgbWFrZXMgY2hhbmdlcyB0byB0aGUgb3JpZ2luYWxzLlxuICBwcml2YXRlIGRlZkNsZWFudXBPcHM6IENsZWFudXBPcGVyYXRpb25bXSA9IFtdO1xuXG4gIHByaXZhdGUgX2luamVjdG9yOiBJbmplY3RvcnxudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBjb21waWxlclByb3ZpZGVyczogUHJvdmlkZXJbXXxudWxsID0gbnVsbDtcblxuICBwcml2YXRlIHByb3ZpZGVyT3ZlcnJpZGVzOiBQcm92aWRlcltdID0gW107XG4gIHByaXZhdGUgcm9vdFByb3ZpZGVyT3ZlcnJpZGVzOiBQcm92aWRlcltdID0gW107XG4gIHByaXZhdGUgcHJvdmlkZXJPdmVycmlkZXNCeVRva2VuID0gbmV3IE1hcDxhbnksIFByb3ZpZGVyPigpO1xuICBwcml2YXRlIG1vZHVsZVByb3ZpZGVyc092ZXJyaWRkZW4gPSBuZXcgU2V0PFR5cGU8YW55Pj4oKTtcblxuICBwcml2YXRlIHRlc3RNb2R1bGVUeXBlOiBOZ01vZHVsZVR5cGU8YW55PjtcbiAgcHJpdmF0ZSB0ZXN0TW9kdWxlUmVmOiBOZ01vZHVsZVJlZjxhbnk+fG51bGwgPSBudWxsO1xuXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgcGxhdGZvcm06IFBsYXRmb3JtUmVmLCBwcml2YXRlIGFkZGl0aW9uYWxNb2R1bGVUeXBlczogVHlwZTxhbnk+fFR5cGU8YW55PltdKSB7XG4gICAgY2xhc3MgRHluYW1pY1Rlc3RNb2R1bGUge31cbiAgICB0aGlzLnRlc3RNb2R1bGVUeXBlID0gRHluYW1pY1Rlc3RNb2R1bGUgYXMgYW55O1xuICB9XG5cbiAgc2V0Q29tcGlsZXJQcm92aWRlcnMocHJvdmlkZXJzOiBQcm92aWRlcltdfG51bGwpOiB2b2lkIHtcbiAgICB0aGlzLmNvbXBpbGVyUHJvdmlkZXJzID0gcHJvdmlkZXJzO1xuICAgIHRoaXMuX2luamVjdG9yID0gbnVsbDtcbiAgfVxuXG4gIGNvbmZpZ3VyZVRlc3RpbmdNb2R1bGUobW9kdWxlRGVmOiBUZXN0TW9kdWxlTWV0YWRhdGEpOiB2b2lkIHtcbiAgICAvLyBFbnF1ZXVlIGFueSBjb21waWxhdGlvbiB0YXNrcyBmb3IgdGhlIGRpcmVjdGx5IGRlY2xhcmVkIGNvbXBvbmVudC5cbiAgICBpZiAobW9kdWxlRGVmLmRlY2xhcmF0aW9ucyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzLnF1ZXVlVHlwZUFycmF5KG1vZHVsZURlZi5kZWNsYXJhdGlvbnMsIFRlc3RpbmdNb2R1bGVPdmVycmlkZS5ERUNMQVJBVElPTik7XG4gICAgICB0aGlzLmRlY2xhcmF0aW9ucy5wdXNoKC4uLm1vZHVsZURlZi5kZWNsYXJhdGlvbnMpO1xuICAgIH1cblxuICAgIC8vIEVucXVldWUgYW55IGNvbXBpbGF0aW9uIHRhc2tzIGZvciBpbXBvcnRlZCBtb2R1bGVzLlxuICAgIGlmIChtb2R1bGVEZWYuaW1wb3J0cyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzLnF1ZXVlVHlwZXNGcm9tTW9kdWxlc0FycmF5KG1vZHVsZURlZi5pbXBvcnRzKTtcbiAgICAgIHRoaXMuaW1wb3J0cy5wdXNoKC4uLm1vZHVsZURlZi5pbXBvcnRzKTtcbiAgICB9XG5cbiAgICBpZiAobW9kdWxlRGVmLnByb3ZpZGVycyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzLnByb3ZpZGVycy5wdXNoKC4uLm1vZHVsZURlZi5wcm92aWRlcnMpO1xuICAgIH1cblxuICAgIGlmIChtb2R1bGVEZWYuc2NoZW1hcyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzLnNjaGVtYXMucHVzaCguLi5tb2R1bGVEZWYuc2NoZW1hcyk7XG4gICAgfVxuICB9XG5cbiAgb3ZlcnJpZGVNb2R1bGUobmdNb2R1bGU6IFR5cGU8YW55Piwgb3ZlcnJpZGU6IE1ldGFkYXRhT3ZlcnJpZGU8TmdNb2R1bGU+KTogdm9pZCB7XG4gICAgLy8gQ29tcGlsZSB0aGUgbW9kdWxlIHJpZ2h0IGF3YXkuXG4gICAgdGhpcy5yZXNvbHZlcnMubW9kdWxlLmFkZE92ZXJyaWRlKG5nTW9kdWxlLCBvdmVycmlkZSk7XG4gICAgY29uc3QgbWV0YWRhdGEgPSB0aGlzLnJlc29sdmVycy5tb2R1bGUucmVzb2x2ZShuZ01vZHVsZSk7XG4gICAgaWYgKG1ldGFkYXRhID09PSBudWxsKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYCR7bmdNb2R1bGUubmFtZX0gaXMgbm90IGFuIEBOZ01vZHVsZSBvciBpcyBtaXNzaW5nIG1ldGFkYXRhYCk7XG4gICAgfVxuXG4gICAgdGhpcy5yZWNvbXBpbGVOZ01vZHVsZShuZ01vZHVsZSk7XG5cbiAgICAvLyBBdCB0aGlzIHBvaW50LCB0aGUgbW9kdWxlIGhhcyBhIHZhbGlkIC5uZ01vZHVsZURlZiwgYnV0IHRoZSBvdmVycmlkZSBtYXkgaGF2ZSBpbnRyb2R1Y2VkXG4gICAgLy8gbmV3IGRlY2xhcmF0aW9ucyBvciBpbXBvcnRlZCBtb2R1bGVzLiBJbmdlc3QgYW55IHBvc3NpYmxlIG5ldyB0eXBlcyBhbmQgYWRkIHRoZW0gdG8gdGhlXG4gICAgLy8gY3VycmVudCBxdWV1ZS5cbiAgICB0aGlzLnF1ZXVlVHlwZXNGcm9tTW9kdWxlc0FycmF5KFtuZ01vZHVsZV0pO1xuICB9XG5cbiAgb3ZlcnJpZGVDb21wb25lbnQoY29tcG9uZW50OiBUeXBlPGFueT4sIG92ZXJyaWRlOiBNZXRhZGF0YU92ZXJyaWRlPENvbXBvbmVudD4pOiB2b2lkIHtcbiAgICB0aGlzLnJlc29sdmVycy5jb21wb25lbnQuYWRkT3ZlcnJpZGUoY29tcG9uZW50LCBvdmVycmlkZSk7XG4gICAgdGhpcy5wZW5kaW5nQ29tcG9uZW50cy5hZGQoY29tcG9uZW50KTtcbiAgfVxuXG4gIG92ZXJyaWRlRGlyZWN0aXZlKGRpcmVjdGl2ZTogVHlwZTxhbnk+LCBvdmVycmlkZTogTWV0YWRhdGFPdmVycmlkZTxEaXJlY3RpdmU+KTogdm9pZCB7XG4gICAgdGhpcy5yZXNvbHZlcnMuZGlyZWN0aXZlLmFkZE92ZXJyaWRlKGRpcmVjdGl2ZSwgb3ZlcnJpZGUpO1xuICAgIHRoaXMucGVuZGluZ0RpcmVjdGl2ZXMuYWRkKGRpcmVjdGl2ZSk7XG4gIH1cblxuICBvdmVycmlkZVBpcGUocGlwZTogVHlwZTxhbnk+LCBvdmVycmlkZTogTWV0YWRhdGFPdmVycmlkZTxQaXBlPik6IHZvaWQge1xuICAgIHRoaXMucmVzb2x2ZXJzLnBpcGUuYWRkT3ZlcnJpZGUocGlwZSwgb3ZlcnJpZGUpO1xuICAgIHRoaXMucGVuZGluZ1BpcGVzLmFkZChwaXBlKTtcbiAgfVxuXG4gIG92ZXJyaWRlUHJvdmlkZXIoXG4gICAgICB0b2tlbjogYW55LFxuICAgICAgcHJvdmlkZXI6IHt1c2VGYWN0b3J5PzogRnVuY3Rpb24sIHVzZVZhbHVlPzogYW55LCBkZXBzPzogYW55W10sIG11bHRpPzogYm9vbGVhbn0pOiB2b2lkIHtcbiAgICBjb25zdCBwcm92aWRlckRlZiA9IHByb3ZpZGVyLnVzZUZhY3RvcnkgP1xuICAgICAgICB7XG4gICAgICAgICAgcHJvdmlkZTogdG9rZW4sXG4gICAgICAgICAgdXNlRmFjdG9yeTogcHJvdmlkZXIudXNlRmFjdG9yeSxcbiAgICAgICAgICBkZXBzOiBwcm92aWRlci5kZXBzIHx8IFtdLFxuICAgICAgICAgIG11bHRpOiBwcm92aWRlci5tdWx0aSxcbiAgICAgICAgfSA6XG4gICAgICAgIHtwcm92aWRlOiB0b2tlbiwgdXNlVmFsdWU6IHByb3ZpZGVyLnVzZVZhbHVlLCBtdWx0aTogcHJvdmlkZXIubXVsdGl9O1xuXG4gICAgbGV0IGluamVjdGFibGVEZWY6IEluamVjdGFibGVEZWY8YW55PnxudWxsO1xuICAgIGNvbnN0IGlzUm9vdCA9XG4gICAgICAgICh0eXBlb2YgdG9rZW4gIT09ICdzdHJpbmcnICYmIChpbmplY3RhYmxlRGVmID0gZ2V0SW5qZWN0YWJsZURlZih0b2tlbikpICYmXG4gICAgICAgICBpbmplY3RhYmxlRGVmLnByb3ZpZGVkSW4gPT09ICdyb290Jyk7XG4gICAgY29uc3Qgb3ZlcnJpZGVzQnVja2V0ID0gaXNSb290ID8gdGhpcy5yb290UHJvdmlkZXJPdmVycmlkZXMgOiB0aGlzLnByb3ZpZGVyT3ZlcnJpZGVzO1xuICAgIG92ZXJyaWRlc0J1Y2tldC5wdXNoKHByb3ZpZGVyRGVmKTtcblxuICAgIC8vIEtlZXAgb3ZlcnJpZGVzIGdyb3VwZWQgYnkgdG9rZW4gYXMgd2VsbCBmb3IgZmFzdCBsb29rdXBzIHVzaW5nIHRva2VuXG4gICAgdGhpcy5wcm92aWRlck92ZXJyaWRlc0J5VG9rZW4uc2V0KHRva2VuLCBwcm92aWRlckRlZik7XG4gIH1cblxuICBvdmVycmlkZVRlbXBsYXRlVXNpbmdUZXN0aW5nTW9kdWxlKHR5cGU6IFR5cGU8YW55PiwgdGVtcGxhdGU6IHN0cmluZyk6IHZvaWQge1xuICAgIGNvbnN0IGRlZiA9ICh0eXBlIGFzIGFueSlbTkdfQ09NUE9ORU5UX0RFRl07XG4gICAgY29uc3QgaGFzU3R5bGVVcmxzID0gKCk6IGJvb2xlYW4gPT4ge1xuICAgICAgY29uc3QgbWV0YWRhdGEgPSB0aGlzLnJlc29sdmVycy5jb21wb25lbnQucmVzb2x2ZSh0eXBlKSAhYXMgQ29tcG9uZW50O1xuICAgICAgcmV0dXJuICEhbWV0YWRhdGEuc3R5bGVVcmxzICYmIG1ldGFkYXRhLnN0eWxlVXJscy5sZW5ndGggPiAwO1xuICAgIH07XG4gICAgY29uc3Qgb3ZlcnJpZGVTdHlsZVVybHMgPSAhIWRlZiAmJiAhaXNDb21wb25lbnREZWZQZW5kaW5nUmVzb2x1dGlvbih0eXBlKSAmJiBoYXNTdHlsZVVybHMoKTtcblxuICAgIC8vIEluIEl2eSwgY29tcGlsaW5nIGEgY29tcG9uZW50IGRvZXMgbm90IHJlcXVpcmUga25vd2luZyB0aGUgbW9kdWxlIHByb3ZpZGluZyB0aGVcbiAgICAvLyBjb21wb25lbnQncyBzY29wZSwgc28gb3ZlcnJpZGVUZW1wbGF0ZVVzaW5nVGVzdGluZ01vZHVsZSBjYW4gYmUgaW1wbGVtZW50ZWQgcHVyZWx5IHZpYVxuICAgIC8vIG92ZXJyaWRlQ29tcG9uZW50LiBJbXBvcnRhbnQ6IG92ZXJyaWRpbmcgdGVtcGxhdGUgcmVxdWlyZXMgZnVsbCBDb21wb25lbnQgcmUtY29tcGlsYXRpb24sXG4gICAgLy8gd2hpY2ggbWF5IGZhaWwgaW4gY2FzZSBzdHlsZVVybHMgYXJlIGFsc28gcHJlc2VudCAodGh1cyBDb21wb25lbnQgaXMgY29uc2lkZXJlZCBhcyByZXF1aXJlZFxuICAgIC8vIHJlc29sdXRpb24pLiBJbiBvcmRlciB0byBhdm9pZCB0aGlzLCB3ZSBwcmVlbXB0aXZlbHkgc2V0IHN0eWxlVXJscyB0byBhbiBlbXB0eSBhcnJheSxcbiAgICAvLyBwcmVzZXJ2ZSBjdXJyZW50IHN0eWxlcyBhdmFpbGFibGUgb24gQ29tcG9uZW50IGRlZiBhbmQgcmVzdG9yZSBzdHlsZXMgYmFjayBvbmNlIGNvbXBpbGF0aW9uXG4gICAgLy8gaXMgY29tcGxldGUuXG4gICAgY29uc3Qgb3ZlcnJpZGUgPSBvdmVycmlkZVN0eWxlVXJscyA/IHt0ZW1wbGF0ZSwgc3R5bGVzOiBbXSwgc3R5bGVVcmxzOiBbXX0gOiB7dGVtcGxhdGV9O1xuICAgIHRoaXMub3ZlcnJpZGVDb21wb25lbnQodHlwZSwge3NldDogb3ZlcnJpZGV9KTtcblxuICAgIGlmIChvdmVycmlkZVN0eWxlVXJscyAmJiBkZWYuc3R5bGVzICYmIGRlZi5zdHlsZXMubGVuZ3RoID4gMCkge1xuICAgICAgdGhpcy5leGlzdGluZ0NvbXBvbmVudFN0eWxlcy5zZXQodHlwZSwgZGVmLnN0eWxlcyk7XG4gICAgfVxuXG4gICAgLy8gU2V0IHRoZSBjb21wb25lbnQncyBzY29wZSB0byBiZSB0aGUgdGVzdGluZyBtb2R1bGUuXG4gICAgdGhpcy5jb21wb25lbnRUb01vZHVsZVNjb3BlLnNldCh0eXBlLCBUZXN0aW5nTW9kdWxlT3ZlcnJpZGUuT1ZFUlJJREVfVEVNUExBVEUpO1xuICB9XG5cbiAgYXN5bmMgY29tcGlsZUNvbXBvbmVudHMoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdGhpcy5jbGVhckNvbXBvbmVudFJlc29sdXRpb25RdWV1ZSgpO1xuICAgIC8vIFJ1biBjb21waWxlcnMgZm9yIGFsbCBxdWV1ZWQgdHlwZXMuXG4gICAgbGV0IG5lZWRzQXN5bmNSZXNvdXJjZXMgPSB0aGlzLmNvbXBpbGVUeXBlc1N5bmMoKTtcblxuICAgIC8vIGNvbXBpbGVDb21wb25lbnRzKCkgc2hvdWxkIG5vdCBiZSBhc3luYyB1bmxlc3MgaXQgbmVlZHMgdG8gYmUuXG4gICAgaWYgKG5lZWRzQXN5bmNSZXNvdXJjZXMpIHtcbiAgICAgIGxldCByZXNvdXJjZUxvYWRlcjogUmVzb3VyY2VMb2FkZXI7XG4gICAgICBsZXQgcmVzb2x2ZXIgPSAodXJsOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4gPT4ge1xuICAgICAgICBpZiAoIXJlc291cmNlTG9hZGVyKSB7XG4gICAgICAgICAgcmVzb3VyY2VMb2FkZXIgPSB0aGlzLmluamVjdG9yLmdldChSZXNvdXJjZUxvYWRlcik7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShyZXNvdXJjZUxvYWRlci5nZXQodXJsKSk7XG4gICAgICB9O1xuICAgICAgYXdhaXQgcmVzb2x2ZUNvbXBvbmVudFJlc291cmNlcyhyZXNvbHZlcik7XG4gICAgfVxuICB9XG5cbiAgZmluYWxpemUoKTogTmdNb2R1bGVSZWY8YW55PiB7XG4gICAgLy8gT25lIGxhc3QgY29tcGlsZVxuICAgIHRoaXMuY29tcGlsZVR5cGVzU3luYygpO1xuXG4gICAgLy8gQ3JlYXRlIHRoZSB0ZXN0aW5nIG1vZHVsZSBpdHNlbGYuXG4gICAgdGhpcy5jb21waWxlVGVzdE1vZHVsZSgpO1xuXG4gICAgdGhpcy5hcHBseVRyYW5zaXRpdmVTY29wZXMoKTtcblxuICAgIHRoaXMuYXBwbHlQcm92aWRlck92ZXJyaWRlcygpO1xuXG4gICAgLy8gUGF0Y2ggcHJldmlvdXNseSBzdG9yZWQgYHN0eWxlc2AgQ29tcG9uZW50IHZhbHVlcyAodGFrZW4gZnJvbSBuZ0NvbXBvbmVudERlZiksIGluIGNhc2UgdGhlc2VcbiAgICAvLyBDb21wb25lbnRzIGhhdmUgYHN0eWxlVXJsc2AgZmllbGRzIGRlZmluZWQgYW5kIHRlbXBsYXRlIG92ZXJyaWRlIHdhcyByZXF1ZXN0ZWQuXG4gICAgdGhpcy5wYXRjaENvbXBvbmVudHNXaXRoRXhpc3RpbmdTdHlsZXMoKTtcblxuICAgIC8vIENsZWFyIHRoZSBjb21wb25lbnRUb01vZHVsZVNjb3BlIG1hcCwgc28gdGhhdCBmdXR1cmUgY29tcGlsYXRpb25zIGRvbid0IHJlc2V0IHRoZSBzY29wZSBvZlxuICAgIC8vIGV2ZXJ5IGNvbXBvbmVudC5cbiAgICB0aGlzLmNvbXBvbmVudFRvTW9kdWxlU2NvcGUuY2xlYXIoKTtcblxuICAgIGNvbnN0IHBhcmVudEluamVjdG9yID0gdGhpcy5wbGF0Zm9ybS5pbmplY3RvcjtcbiAgICB0aGlzLnRlc3RNb2R1bGVSZWYgPSBuZXcgTmdNb2R1bGVSZWYodGhpcy50ZXN0TW9kdWxlVHlwZSwgcGFyZW50SW5qZWN0b3IpO1xuXG4gICAgLy8gU2V0IHRoZSBsb2NhbGUgSUQsIGl0IGNhbiBiZSBvdmVycmlkZGVuIGZvciB0aGUgdGVzdHNcbiAgICBjb25zdCBsb2NhbGVJZCA9IHRoaXMudGVzdE1vZHVsZVJlZi5pbmplY3Rvci5nZXQoTE9DQUxFX0lELCBERUZBVUxUX0xPQ0FMRV9JRCk7XG4gICAgc2V0TG9jYWxlSWQobG9jYWxlSWQpO1xuXG4gICAgLy8gQXBwbGljYXRpb25Jbml0U3RhdHVzLnJ1bkluaXRpYWxpemVycygpIGlzIG1hcmtlZCBAaW50ZXJuYWwgdG8gY29yZS5cbiAgICAvLyBDYXN0IGl0IHRvIGFueSBiZWZvcmUgYWNjZXNzaW5nIGl0LlxuICAgICh0aGlzLnRlc3RNb2R1bGVSZWYuaW5qZWN0b3IuZ2V0KEFwcGxpY2F0aW9uSW5pdFN0YXR1cykgYXMgYW55KS5ydW5Jbml0aWFsaXplcnMoKTtcblxuICAgIHJldHVybiB0aGlzLnRlc3RNb2R1bGVSZWY7XG4gIH1cblxuICAvKipcbiAgICogQGludGVybmFsXG4gICAqL1xuICBfY29tcGlsZU5nTW9kdWxlU3luYyhtb2R1bGVUeXBlOiBUeXBlPGFueT4pOiB2b2lkIHtcbiAgICB0aGlzLnF1ZXVlVHlwZXNGcm9tTW9kdWxlc0FycmF5KFttb2R1bGVUeXBlXSk7XG4gICAgdGhpcy5jb21waWxlVHlwZXNTeW5jKCk7XG4gICAgdGhpcy5hcHBseVByb3ZpZGVyT3ZlcnJpZGVzKCk7XG4gICAgdGhpcy5hcHBseVByb3ZpZGVyT3ZlcnJpZGVzVG9Nb2R1bGUobW9kdWxlVHlwZSk7XG4gICAgdGhpcy5hcHBseVRyYW5zaXRpdmVTY29wZXMoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIGFzeW5jIF9jb21waWxlTmdNb2R1bGVBc3luYyhtb2R1bGVUeXBlOiBUeXBlPGFueT4pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0aGlzLnF1ZXVlVHlwZXNGcm9tTW9kdWxlc0FycmF5KFttb2R1bGVUeXBlXSk7XG4gICAgYXdhaXQgdGhpcy5jb21waWxlQ29tcG9uZW50cygpO1xuICAgIHRoaXMuYXBwbHlQcm92aWRlck92ZXJyaWRlcygpO1xuICAgIHRoaXMuYXBwbHlQcm92aWRlck92ZXJyaWRlc1RvTW9kdWxlKG1vZHVsZVR5cGUpO1xuICAgIHRoaXMuYXBwbHlUcmFuc2l0aXZlU2NvcGVzKCk7XG4gIH1cblxuICAvKipcbiAgICogQGludGVybmFsXG4gICAqL1xuICBfZ2V0TW9kdWxlUmVzb2x2ZXIoKTogUmVzb2x2ZXI8TmdNb2R1bGU+IHsgcmV0dXJuIHRoaXMucmVzb2x2ZXJzLm1vZHVsZTsgfVxuXG4gIC8qKlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIF9nZXRDb21wb25lbnRGYWN0b3JpZXMobW9kdWxlVHlwZTogTmdNb2R1bGVUeXBlKTogQ29tcG9uZW50RmFjdG9yeTxhbnk+W10ge1xuICAgIHJldHVybiBtYXliZVVud3JhcEZuKG1vZHVsZVR5cGUubmdNb2R1bGVEZWYuZGVjbGFyYXRpb25zKS5yZWR1Y2UoKGZhY3RvcmllcywgZGVjbGFyYXRpb24pID0+IHtcbiAgICAgIGNvbnN0IGNvbXBvbmVudERlZiA9IChkZWNsYXJhdGlvbiBhcyBhbnkpLm5nQ29tcG9uZW50RGVmO1xuICAgICAgY29tcG9uZW50RGVmICYmIGZhY3Rvcmllcy5wdXNoKG5ldyBDb21wb25lbnRGYWN0b3J5KGNvbXBvbmVudERlZiwgdGhpcy50ZXN0TW9kdWxlUmVmICEpKTtcbiAgICAgIHJldHVybiBmYWN0b3JpZXM7XG4gICAgfSwgW10gYXMgQ29tcG9uZW50RmFjdG9yeTxhbnk+W10pO1xuICB9XG5cbiAgcHJpdmF0ZSBjb21waWxlVHlwZXNTeW5jKCk6IGJvb2xlYW4ge1xuICAgIC8vIENvbXBpbGUgYWxsIHF1ZXVlZCBjb21wb25lbnRzLCBkaXJlY3RpdmVzLCBwaXBlcy5cbiAgICBsZXQgbmVlZHNBc3luY1Jlc291cmNlcyA9IGZhbHNlO1xuICAgIHRoaXMucGVuZGluZ0NvbXBvbmVudHMuZm9yRWFjaChkZWNsYXJhdGlvbiA9PiB7XG4gICAgICBuZWVkc0FzeW5jUmVzb3VyY2VzID0gbmVlZHNBc3luY1Jlc291cmNlcyB8fCBpc0NvbXBvbmVudERlZlBlbmRpbmdSZXNvbHV0aW9uKGRlY2xhcmF0aW9uKTtcbiAgICAgIGNvbnN0IG1ldGFkYXRhID0gdGhpcy5yZXNvbHZlcnMuY29tcG9uZW50LnJlc29sdmUoZGVjbGFyYXRpb24pICE7XG4gICAgICB0aGlzLm1heWJlU3RvcmVOZ0RlZihOR19DT01QT05FTlRfREVGLCBkZWNsYXJhdGlvbik7XG4gICAgICBjb21waWxlQ29tcG9uZW50KGRlY2xhcmF0aW9uLCBtZXRhZGF0YSk7XG4gICAgfSk7XG4gICAgdGhpcy5wZW5kaW5nQ29tcG9uZW50cy5jbGVhcigpO1xuXG4gICAgdGhpcy5wZW5kaW5nRGlyZWN0aXZlcy5mb3JFYWNoKGRlY2xhcmF0aW9uID0+IHtcbiAgICAgIGNvbnN0IG1ldGFkYXRhID0gdGhpcy5yZXNvbHZlcnMuZGlyZWN0aXZlLnJlc29sdmUoZGVjbGFyYXRpb24pICE7XG4gICAgICB0aGlzLm1heWJlU3RvcmVOZ0RlZihOR19ESVJFQ1RJVkVfREVGLCBkZWNsYXJhdGlvbik7XG4gICAgICBjb21waWxlRGlyZWN0aXZlKGRlY2xhcmF0aW9uLCBtZXRhZGF0YSk7XG4gICAgfSk7XG4gICAgdGhpcy5wZW5kaW5nRGlyZWN0aXZlcy5jbGVhcigpO1xuXG4gICAgdGhpcy5wZW5kaW5nUGlwZXMuZm9yRWFjaChkZWNsYXJhdGlvbiA9PiB7XG4gICAgICBjb25zdCBtZXRhZGF0YSA9IHRoaXMucmVzb2x2ZXJzLnBpcGUucmVzb2x2ZShkZWNsYXJhdGlvbikgITtcbiAgICAgIHRoaXMubWF5YmVTdG9yZU5nRGVmKE5HX1BJUEVfREVGLCBkZWNsYXJhdGlvbik7XG4gICAgICBjb21waWxlUGlwZShkZWNsYXJhdGlvbiwgbWV0YWRhdGEpO1xuICAgIH0pO1xuICAgIHRoaXMucGVuZGluZ1BpcGVzLmNsZWFyKCk7XG5cbiAgICByZXR1cm4gbmVlZHNBc3luY1Jlc291cmNlcztcbiAgfVxuXG4gIHByaXZhdGUgYXBwbHlUcmFuc2l0aXZlU2NvcGVzKCk6IHZvaWQge1xuICAgIGNvbnN0IG1vZHVsZVRvU2NvcGUgPSBuZXcgTWFwPFR5cGU8YW55PnxUZXN0aW5nTW9kdWxlT3ZlcnJpZGUsIE5nTW9kdWxlVHJhbnNpdGl2ZVNjb3Blcz4oKTtcbiAgICBjb25zdCBnZXRTY29wZU9mTW9kdWxlID1cbiAgICAgICAgKG1vZHVsZVR5cGU6IFR5cGU8YW55PnwgVGVzdGluZ01vZHVsZU92ZXJyaWRlKTogTmdNb2R1bGVUcmFuc2l0aXZlU2NvcGVzID0+IHtcbiAgICAgICAgICBpZiAoIW1vZHVsZVRvU2NvcGUuaGFzKG1vZHVsZVR5cGUpKSB7XG4gICAgICAgICAgICBjb25zdCByZWFsVHlwZSA9IGlzVGVzdGluZ01vZHVsZU92ZXJyaWRlKG1vZHVsZVR5cGUpID8gdGhpcy50ZXN0TW9kdWxlVHlwZSA6IG1vZHVsZVR5cGU7XG4gICAgICAgICAgICBtb2R1bGVUb1Njb3BlLnNldChtb2R1bGVUeXBlLCB0cmFuc2l0aXZlU2NvcGVzRm9yKHJlYWxUeXBlKSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBtb2R1bGVUb1Njb3BlLmdldChtb2R1bGVUeXBlKSAhO1xuICAgICAgICB9O1xuXG4gICAgdGhpcy5jb21wb25lbnRUb01vZHVsZVNjb3BlLmZvckVhY2goKG1vZHVsZVR5cGUsIGNvbXBvbmVudFR5cGUpID0+IHtcbiAgICAgIGNvbnN0IG1vZHVsZVNjb3BlID0gZ2V0U2NvcGVPZk1vZHVsZShtb2R1bGVUeXBlKTtcbiAgICAgIHRoaXMuc3RvcmVGaWVsZE9mRGVmT25UeXBlKGNvbXBvbmVudFR5cGUsIE5HX0NPTVBPTkVOVF9ERUYsICdkaXJlY3RpdmVEZWZzJyk7XG4gICAgICB0aGlzLnN0b3JlRmllbGRPZkRlZk9uVHlwZShjb21wb25lbnRUeXBlLCBOR19DT01QT05FTlRfREVGLCAncGlwZURlZnMnKTtcbiAgICAgIHBhdGNoQ29tcG9uZW50RGVmV2l0aFNjb3BlKChjb21wb25lbnRUeXBlIGFzIGFueSkubmdDb21wb25lbnREZWYsIG1vZHVsZVNjb3BlKTtcbiAgICB9KTtcblxuICAgIHRoaXMuY29tcG9uZW50VG9Nb2R1bGVTY29wZS5jbGVhcigpO1xuICB9XG5cbiAgcHJpdmF0ZSBhcHBseVByb3ZpZGVyT3ZlcnJpZGVzKCk6IHZvaWQge1xuICAgIGNvbnN0IG1heWJlQXBwbHlPdmVycmlkZXMgPSAoZmllbGQ6IHN0cmluZykgPT4gKHR5cGU6IFR5cGU8YW55PikgPT4ge1xuICAgICAgY29uc3QgcmVzb2x2ZXIgPVxuICAgICAgICAgIGZpZWxkID09PSBOR19DT01QT05FTlRfREVGID8gdGhpcy5yZXNvbHZlcnMuY29tcG9uZW50IDogdGhpcy5yZXNvbHZlcnMuZGlyZWN0aXZlO1xuICAgICAgY29uc3QgbWV0YWRhdGEgPSByZXNvbHZlci5yZXNvbHZlKHR5cGUpICE7XG4gICAgICBpZiAodGhpcy5oYXNQcm92aWRlck92ZXJyaWRlcyhtZXRhZGF0YS5wcm92aWRlcnMpKSB7XG4gICAgICAgIHRoaXMucGF0Y2hEZWZXaXRoUHJvdmlkZXJPdmVycmlkZXModHlwZSwgZmllbGQpO1xuICAgICAgfVxuICAgIH07XG4gICAgdGhpcy5zZWVuQ29tcG9uZW50cy5mb3JFYWNoKG1heWJlQXBwbHlPdmVycmlkZXMoTkdfQ09NUE9ORU5UX0RFRikpO1xuICAgIHRoaXMuc2VlbkRpcmVjdGl2ZXMuZm9yRWFjaChtYXliZUFwcGx5T3ZlcnJpZGVzKE5HX0RJUkVDVElWRV9ERUYpKTtcblxuICAgIHRoaXMuc2VlbkNvbXBvbmVudHMuY2xlYXIoKTtcbiAgICB0aGlzLnNlZW5EaXJlY3RpdmVzLmNsZWFyKCk7XG4gIH1cblxuICBwcml2YXRlIGFwcGx5UHJvdmlkZXJPdmVycmlkZXNUb01vZHVsZShtb2R1bGVUeXBlOiBUeXBlPGFueT4pOiB2b2lkIHtcbiAgICBpZiAodGhpcy5tb2R1bGVQcm92aWRlcnNPdmVycmlkZGVuLmhhcyhtb2R1bGVUeXBlKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLm1vZHVsZVByb3ZpZGVyc092ZXJyaWRkZW4uYWRkKG1vZHVsZVR5cGUpO1xuXG4gICAgY29uc3QgaW5qZWN0b3JEZWY6IGFueSA9IChtb2R1bGVUeXBlIGFzIGFueSlbTkdfSU5KRUNUT1JfREVGXTtcbiAgICBpZiAodGhpcy5wcm92aWRlck92ZXJyaWRlc0J5VG9rZW4uc2l6ZSA+IDApIHtcbiAgICAgIC8vIEV4dHJhY3QgdGhlIGxpc3Qgb2YgcHJvdmlkZXJzIGZyb20gTW9kdWxlV2l0aFByb3ZpZGVycywgc28gd2UgY2FuIGRlZmluZSB0aGUgZmluYWwgbGlzdCBvZlxuICAgICAgLy8gcHJvdmlkZXJzIHRoYXQgbWlnaHQgaGF2ZSBvdmVycmlkZXMuXG4gICAgICAvLyBOb3RlOiBzZWNvbmQgYGZsYXR0ZW5gIG9wZXJhdGlvbiBpcyBuZWVkZWQgdG8gY29udmVydCBhbiBhcnJheSBvZiBwcm92aWRlcnNcbiAgICAgIC8vIChlLmcuIGBbW10sIFtdXWApIGludG8gb25lIGZsYXQgbGlzdCwgYWxzbyBlbGltaW5hdGluZyBlbXB0eSBhcnJheXMuXG4gICAgICBjb25zdCBwcm92aWRlcnNGcm9tTW9kdWxlcyA9IGZsYXR0ZW4oZmxhdHRlbihcbiAgICAgICAgICBpbmplY3RvckRlZi5pbXBvcnRzLCAoaW1wb3J0ZWQ6IE5nTW9kdWxlVHlwZTxhbnk+fCBNb2R1bGVXaXRoUHJvdmlkZXJzPGFueT4pID0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlzTW9kdWxlV2l0aFByb3ZpZGVycyhpbXBvcnRlZCkgPyBpbXBvcnRlZC5wcm92aWRlcnMgOiBbXSkpO1xuICAgICAgY29uc3QgcHJvdmlkZXJzID0gWy4uLnByb3ZpZGVyc0Zyb21Nb2R1bGVzLCAuLi5pbmplY3RvckRlZi5wcm92aWRlcnNdO1xuICAgICAgaWYgKHRoaXMuaGFzUHJvdmlkZXJPdmVycmlkZXMocHJvdmlkZXJzKSkge1xuICAgICAgICB0aGlzLm1heWJlU3RvcmVOZ0RlZihOR19JTkpFQ1RPUl9ERUYsIG1vZHVsZVR5cGUpO1xuXG4gICAgICAgIHRoaXMuc3RvcmVGaWVsZE9mRGVmT25UeXBlKG1vZHVsZVR5cGUsIE5HX0lOSkVDVE9SX0RFRiwgJ3Byb3ZpZGVycycpO1xuICAgICAgICBpbmplY3RvckRlZi5wcm92aWRlcnMgPSB0aGlzLmdldE92ZXJyaWRkZW5Qcm92aWRlcnMocHJvdmlkZXJzKTtcbiAgICAgIH1cblxuICAgICAgLy8gQXBwbHkgcHJvdmlkZXIgb3ZlcnJpZGVzIHRvIGltcG9ydGVkIG1vZHVsZXMgcmVjdXJzaXZlbHlcbiAgICAgIGNvbnN0IG1vZHVsZURlZjogYW55ID0gKG1vZHVsZVR5cGUgYXMgYW55KVtOR19NT0RVTEVfREVGXTtcbiAgICAgIGZvciAoY29uc3QgaW1wb3J0VHlwZSBvZiBtb2R1bGVEZWYuaW1wb3J0cykge1xuICAgICAgICB0aGlzLmFwcGx5UHJvdmlkZXJPdmVycmlkZXNUb01vZHVsZShpbXBvcnRUeXBlKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBwcml2YXRlIHBhdGNoQ29tcG9uZW50c1dpdGhFeGlzdGluZ1N0eWxlcygpOiB2b2lkIHtcbiAgICB0aGlzLmV4aXN0aW5nQ29tcG9uZW50U3R5bGVzLmZvckVhY2goXG4gICAgICAgIChzdHlsZXMsIHR5cGUpID0+ICh0eXBlIGFzIGFueSlbTkdfQ09NUE9ORU5UX0RFRl0uc3R5bGVzID0gc3R5bGVzKTtcbiAgICB0aGlzLmV4aXN0aW5nQ29tcG9uZW50U3R5bGVzLmNsZWFyKCk7XG4gIH1cblxuICBwcml2YXRlIHF1ZXVlVHlwZUFycmF5KGFycjogYW55W10sIG1vZHVsZVR5cGU6IFR5cGU8YW55PnxUZXN0aW5nTW9kdWxlT3ZlcnJpZGUpOiB2b2lkIHtcbiAgICBmb3IgKGNvbnN0IHZhbHVlIG9mIGFycikge1xuICAgICAgaWYgKEFycmF5LmlzQXJyYXkodmFsdWUpKSB7XG4gICAgICAgIHRoaXMucXVldWVUeXBlQXJyYXkodmFsdWUsIG1vZHVsZVR5cGUpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5xdWV1ZVR5cGUodmFsdWUsIG1vZHVsZVR5cGUpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgcmVjb21waWxlTmdNb2R1bGUobmdNb2R1bGU6IFR5cGU8YW55Pik6IHZvaWQge1xuICAgIGNvbnN0IG1ldGFkYXRhID0gdGhpcy5yZXNvbHZlcnMubW9kdWxlLnJlc29sdmUobmdNb2R1bGUpO1xuICAgIGlmIChtZXRhZGF0YSA9PT0gbnVsbCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBVbmFibGUgdG8gcmVzb2x2ZSBtZXRhZGF0YSBmb3IgTmdNb2R1bGU6ICR7bmdNb2R1bGUubmFtZX1gKTtcbiAgICB9XG4gICAgLy8gQ2FjaGUgdGhlIGluaXRpYWwgbmdNb2R1bGVEZWYgYXMgaXQgd2lsbCBiZSBvdmVyd3JpdHRlbi5cbiAgICB0aGlzLm1heWJlU3RvcmVOZ0RlZihOR19NT0RVTEVfREVGLCBuZ01vZHVsZSk7XG4gICAgdGhpcy5tYXliZVN0b3JlTmdEZWYoTkdfSU5KRUNUT1JfREVGLCBuZ01vZHVsZSk7XG5cbiAgICBjb21waWxlTmdNb2R1bGVEZWZzKG5nTW9kdWxlIGFzIE5nTW9kdWxlVHlwZTxhbnk+LCBtZXRhZGF0YSk7XG4gIH1cblxuICBwcml2YXRlIHF1ZXVlVHlwZSh0eXBlOiBUeXBlPGFueT4sIG1vZHVsZVR5cGU6IFR5cGU8YW55PnxUZXN0aW5nTW9kdWxlT3ZlcnJpZGUpOiB2b2lkIHtcbiAgICBjb25zdCBjb21wb25lbnQgPSB0aGlzLnJlc29sdmVycy5jb21wb25lbnQucmVzb2x2ZSh0eXBlKTtcbiAgICBpZiAoY29tcG9uZW50KSB7XG4gICAgICAvLyBDaGVjayB3aGV0aGVyIGEgZ2l2ZSBUeXBlIGhhcyByZXNwZWN0aXZlIE5HIGRlZiAobmdDb21wb25lbnREZWYpIGFuZCBjb21waWxlIGlmIGRlZiBpc1xuICAgICAgLy8gbWlzc2luZy4gVGhhdCBtaWdodCBoYXBwZW4gaW4gY2FzZSBhIGNsYXNzIHdpdGhvdXQgYW55IEFuZ3VsYXIgZGVjb3JhdG9ycyBleHRlbmRzIGFub3RoZXJcbiAgICAgIC8vIGNsYXNzIHdoZXJlIENvbXBvbmVudC9EaXJlY3RpdmUvUGlwZSBkZWNvcmF0b3IgaXMgZGVmaW5lZC5cbiAgICAgIGlmIChpc0NvbXBvbmVudERlZlBlbmRpbmdSZXNvbHV0aW9uKHR5cGUpIHx8ICF0eXBlLmhhc093blByb3BlcnR5KE5HX0NPTVBPTkVOVF9ERUYpKSB7XG4gICAgICAgIHRoaXMucGVuZGluZ0NvbXBvbmVudHMuYWRkKHR5cGUpO1xuICAgICAgfVxuICAgICAgdGhpcy5zZWVuQ29tcG9uZW50cy5hZGQodHlwZSk7XG5cbiAgICAgIC8vIEtlZXAgdHJhY2sgb2YgdGhlIG1vZHVsZSB3aGljaCBkZWNsYXJlcyB0aGlzIGNvbXBvbmVudCwgc28gbGF0ZXIgdGhlIGNvbXBvbmVudCdzIHNjb3BlXG4gICAgICAvLyBjYW4gYmUgc2V0IGNvcnJlY3RseS4gSWYgdGhlIGNvbXBvbmVudCBoYXMgYWxyZWFkeSBiZWVuIHJlY29yZGVkIGhlcmUsIHRoZW4gb25lIG9mIHNldmVyYWxcbiAgICAgIC8vIGNhc2VzIGlzIHRydWU6XG4gICAgICAvLyAqIHRoZSBtb2R1bGUgY29udGFpbmluZyB0aGUgY29tcG9uZW50IHdhcyBpbXBvcnRlZCBtdWx0aXBsZSB0aW1lcyAoY29tbW9uKS5cbiAgICAgIC8vICogdGhlIGNvbXBvbmVudCBpcyBkZWNsYXJlZCBpbiBtdWx0aXBsZSBtb2R1bGVzICh3aGljaCBpcyBhbiBlcnJvcikuXG4gICAgICAvLyAqIHRoZSBjb21wb25lbnQgd2FzIGluICdkZWNsYXJhdGlvbnMnIG9mIHRoZSB0ZXN0aW5nIG1vZHVsZSwgYW5kIGFsc28gaW4gYW4gaW1wb3J0ZWQgbW9kdWxlXG4gICAgICAvLyAgIGluIHdoaWNoIGNhc2UgdGhlIG1vZHVsZSBzY29wZSB3aWxsIGJlIFRlc3RpbmdNb2R1bGVPdmVycmlkZS5ERUNMQVJBVElPTi5cbiAgICAgIC8vICogb3ZlcnJpZGVUZW1wbGF0ZVVzaW5nVGVzdGluZ01vZHVsZSB3YXMgY2FsbGVkIGZvciB0aGUgY29tcG9uZW50IGluIHdoaWNoIGNhc2UgdGhlIG1vZHVsZVxuICAgICAgLy8gICBzY29wZSB3aWxsIGJlIFRlc3RpbmdNb2R1bGVPdmVycmlkZS5PVkVSUklERV9URU1QTEFURS5cbiAgICAgIC8vXG4gICAgICAvLyBJZiB0aGUgY29tcG9uZW50IHdhcyBwcmV2aW91c2x5IGluIHRoZSB0ZXN0aW5nIG1vZHVsZSdzICdkZWNsYXJhdGlvbnMnIChtZWFuaW5nIHRoZVxuICAgICAgLy8gY3VycmVudCB2YWx1ZSBpcyBUZXN0aW5nTW9kdWxlT3ZlcnJpZGUuREVDTEFSQVRJT04pLCB0aGVuIGBtb2R1bGVUeXBlYCBpcyB0aGUgY29tcG9uZW50J3NcbiAgICAgIC8vIHJlYWwgbW9kdWxlLCB3aGljaCB3YXMgaW1wb3J0ZWQuIFRoaXMgcGF0dGVybiBpcyB1bmRlcnN0b29kIHRvIG1lYW4gdGhhdCB0aGUgY29tcG9uZW50XG4gICAgICAvLyBzaG91bGQgdXNlIGl0cyBvcmlnaW5hbCBzY29wZSwgYnV0IHRoYXQgdGhlIHRlc3RpbmcgbW9kdWxlIHNob3VsZCBhbHNvIGNvbnRhaW4gdGhlXG4gICAgICAvLyBjb21wb25lbnQgaW4gaXRzIHNjb3BlLlxuICAgICAgaWYgKCF0aGlzLmNvbXBvbmVudFRvTW9kdWxlU2NvcGUuaGFzKHR5cGUpIHx8XG4gICAgICAgICAgdGhpcy5jb21wb25lbnRUb01vZHVsZVNjb3BlLmdldCh0eXBlKSA9PT0gVGVzdGluZ01vZHVsZU92ZXJyaWRlLkRFQ0xBUkFUSU9OKSB7XG4gICAgICAgIHRoaXMuY29tcG9uZW50VG9Nb2R1bGVTY29wZS5zZXQodHlwZSwgbW9kdWxlVHlwZSk7XG4gICAgICB9XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgZGlyZWN0aXZlID0gdGhpcy5yZXNvbHZlcnMuZGlyZWN0aXZlLnJlc29sdmUodHlwZSk7XG4gICAgaWYgKGRpcmVjdGl2ZSkge1xuICAgICAgaWYgKCF0eXBlLmhhc093blByb3BlcnR5KE5HX0RJUkVDVElWRV9ERUYpKSB7XG4gICAgICAgIHRoaXMucGVuZGluZ0RpcmVjdGl2ZXMuYWRkKHR5cGUpO1xuICAgICAgfVxuICAgICAgdGhpcy5zZWVuRGlyZWN0aXZlcy5hZGQodHlwZSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgcGlwZSA9IHRoaXMucmVzb2x2ZXJzLnBpcGUucmVzb2x2ZSh0eXBlKTtcbiAgICBpZiAocGlwZSAmJiAhdHlwZS5oYXNPd25Qcm9wZXJ0eShOR19QSVBFX0RFRikpIHtcbiAgICAgIHRoaXMucGVuZGluZ1BpcGVzLmFkZCh0eXBlKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIHF1ZXVlVHlwZXNGcm9tTW9kdWxlc0FycmF5KGFycjogYW55W10pOiB2b2lkIHtcbiAgICBmb3IgKGNvbnN0IHZhbHVlIG9mIGFycikge1xuICAgICAgaWYgKEFycmF5LmlzQXJyYXkodmFsdWUpKSB7XG4gICAgICAgIHRoaXMucXVldWVUeXBlc0Zyb21Nb2R1bGVzQXJyYXkodmFsdWUpO1xuICAgICAgfSBlbHNlIGlmIChoYXNOZ01vZHVsZURlZih2YWx1ZSkpIHtcbiAgICAgICAgY29uc3QgZGVmID0gdmFsdWUubmdNb2R1bGVEZWY7XG4gICAgICAgIC8vIExvb2sgdGhyb3VnaCBkZWNsYXJhdGlvbnMsIGltcG9ydHMsIGFuZCBleHBvcnRzLCBhbmQgcXVldWUgZXZlcnl0aGluZyBmb3VuZCB0aGVyZS5cbiAgICAgICAgdGhpcy5xdWV1ZVR5cGVBcnJheShtYXliZVVud3JhcEZuKGRlZi5kZWNsYXJhdGlvbnMpLCB2YWx1ZSk7XG4gICAgICAgIHRoaXMucXVldWVUeXBlc0Zyb21Nb2R1bGVzQXJyYXkobWF5YmVVbndyYXBGbihkZWYuaW1wb3J0cykpO1xuICAgICAgICB0aGlzLnF1ZXVlVHlwZXNGcm9tTW9kdWxlc0FycmF5KG1heWJlVW53cmFwRm4oZGVmLmV4cG9ydHMpKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBwcml2YXRlIG1heWJlU3RvcmVOZ0RlZihwcm9wOiBzdHJpbmcsIHR5cGU6IFR5cGU8YW55Pikge1xuICAgIGlmICghdGhpcy5pbml0aWFsTmdEZWZzLmhhcyh0eXBlKSkge1xuICAgICAgY29uc3QgY3VycmVudERlZiA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IodHlwZSwgcHJvcCk7XG4gICAgICB0aGlzLmluaXRpYWxOZ0RlZnMuc2V0KHR5cGUsIFtwcm9wLCBjdXJyZW50RGVmXSk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBzdG9yZUZpZWxkT2ZEZWZPblR5cGUodHlwZTogVHlwZTxhbnk+LCBkZWZGaWVsZDogc3RyaW5nLCBmaWVsZDogc3RyaW5nKTogdm9pZCB7XG4gICAgY29uc3QgZGVmOiBhbnkgPSAodHlwZSBhcyBhbnkpW2RlZkZpZWxkXTtcbiAgICBjb25zdCBvcmlnaW5hbDogYW55ID0gZGVmW2ZpZWxkXTtcbiAgICB0aGlzLmRlZkNsZWFudXBPcHMucHVzaCh7ZmllbGQsIGRlZiwgb3JpZ2luYWx9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDbGVhcnMgY3VycmVudCBjb21wb25lbnRzIHJlc29sdXRpb24gcXVldWUsIGJ1dCBzdG9yZXMgdGhlIHN0YXRlIG9mIHRoZSBxdWV1ZSwgc28gd2UgY2FuXG4gICAqIHJlc3RvcmUgaXQgbGF0ZXIuIENsZWFyaW5nIHRoZSBxdWV1ZSBpcyByZXF1aXJlZCBiZWZvcmUgd2UgdHJ5IHRvIGNvbXBpbGUgY29tcG9uZW50cyAodmlhXG4gICAqIGBUZXN0QmVkLmNvbXBpbGVDb21wb25lbnRzYCksIHNvIHRoYXQgY29tcG9uZW50IGRlZnMgYXJlIGluIHN5bmMgd2l0aCB0aGUgcmVzb2x1dGlvbiBxdWV1ZS5cbiAgICovXG4gIHByaXZhdGUgY2xlYXJDb21wb25lbnRSZXNvbHV0aW9uUXVldWUoKSB7XG4gICAgaWYgKHRoaXMub3JpZ2luYWxDb21wb25lbnRSZXNvbHV0aW9uUXVldWUgPT09IG51bGwpIHtcbiAgICAgIHRoaXMub3JpZ2luYWxDb21wb25lbnRSZXNvbHV0aW9uUXVldWUgPSBuZXcgTWFwKCk7XG4gICAgfVxuICAgIGNsZWFyUmVzb2x1dGlvbk9mQ29tcG9uZW50UmVzb3VyY2VzUXVldWUoKS5mb3JFYWNoKFxuICAgICAgICAodmFsdWUsIGtleSkgPT4gdGhpcy5vcmlnaW5hbENvbXBvbmVudFJlc29sdXRpb25RdWV1ZSAhLnNldChrZXksIHZhbHVlKSk7XG4gIH1cblxuICAvKlxuICAgKiBSZXN0b3JlcyBjb21wb25lbnQgcmVzb2x1dGlvbiBxdWV1ZSB0byB0aGUgcHJldmlvdXNseSBzYXZlZCBzdGF0ZS4gVGhpcyBvcGVyYXRpb24gaXMgcGVyZm9ybWVkXG4gICAqIGFzIGEgcGFydCBvZiByZXN0b3JpbmcgdGhlIHN0YXRlIGFmdGVyIGNvbXBsZXRpb24gb2YgdGhlIGN1cnJlbnQgc2V0IG9mIHRlc3RzICh0aGF0IG1pZ2h0XG4gICAqIHBvdGVudGlhbGx5IG11dGF0ZSB0aGUgc3RhdGUpLlxuICAgKi9cbiAgcHJpdmF0ZSByZXN0b3JlQ29tcG9uZW50UmVzb2x1dGlvblF1ZXVlKCkge1xuICAgIGlmICh0aGlzLm9yaWdpbmFsQ29tcG9uZW50UmVzb2x1dGlvblF1ZXVlICE9PSBudWxsKSB7XG4gICAgICByZXN0b3JlQ29tcG9uZW50UmVzb2x1dGlvblF1ZXVlKHRoaXMub3JpZ2luYWxDb21wb25lbnRSZXNvbHV0aW9uUXVldWUpO1xuICAgICAgdGhpcy5vcmlnaW5hbENvbXBvbmVudFJlc29sdXRpb25RdWV1ZSA9IG51bGw7XG4gICAgfVxuICB9XG5cbiAgcmVzdG9yZU9yaWdpbmFsU3RhdGUoKTogdm9pZCB7XG4gICAgZm9yIChjb25zdCBvcCBvZiB0aGlzLmRlZkNsZWFudXBPcHMpIHtcbiAgICAgIG9wLmRlZltvcC5maWVsZF0gPSBvcC5vcmlnaW5hbDtcbiAgICB9XG4gICAgLy8gUmVzdG9yZSBpbml0aWFsIGNvbXBvbmVudC9kaXJlY3RpdmUvcGlwZSBkZWZzXG4gICAgdGhpcy5pbml0aWFsTmdEZWZzLmZvckVhY2goKHZhbHVlOiBbc3RyaW5nLCBQcm9wZXJ0eURlc2NyaXB0b3JdLCB0eXBlOiBUeXBlPGFueT4pID0+IHtcbiAgICAgIGNvbnN0IFtwcm9wLCBkZXNjcmlwdG9yXSA9IHZhbHVlO1xuICAgICAgaWYgKCFkZXNjcmlwdG9yKSB7XG4gICAgICAgIC8vIERlbGV0ZSBvcGVyYXRpb25zIGFyZSBnZW5lcmFsbHkgdW5kZXNpcmFibGUgc2luY2UgdGhleSBoYXZlIHBlcmZvcm1hbmNlIGltcGxpY2F0aW9uc1xuICAgICAgICAvLyBvbiBvYmplY3RzIHRoZXkgd2VyZSBhcHBsaWVkIHRvLiBJbiB0aGlzIHBhcnRpY3VsYXIgY2FzZSwgc2l0dWF0aW9ucyB3aGVyZSB0aGlzIGNvZGUgaXNcbiAgICAgICAgLy8gaW52b2tlZCBzaG91bGQgYmUgcXVpdGUgcmFyZSB0byBjYXVzZSBhbnkgbm90aWNhYmxlIGltcGFjdCwgc2luY2UgaXQncyBhcHBsaWVkIG9ubHkgdG9cbiAgICAgICAgLy8gc29tZSB0ZXN0IGNhc2VzIChmb3IgZXhhbXBsZSB3aGVuIGNsYXNzIHdpdGggbm8gYW5ub3RhdGlvbnMgZXh0ZW5kcyBzb21lIEBDb21wb25lbnQpXG4gICAgICAgIC8vIHdoZW4gd2UgbmVlZCB0byBjbGVhciAnbmdDb21wb25lbnREZWYnIGZpZWxkIG9uIGEgZ2l2ZW4gY2xhc3MgdG8gcmVzdG9yZSBpdHMgb3JpZ2luYWxcbiAgICAgICAgLy8gc3RhdGUgKGJlZm9yZSBhcHBseWluZyBvdmVycmlkZXMgYW5kIHJ1bm5pbmcgdGVzdHMpLlxuICAgICAgICBkZWxldGUgKHR5cGUgYXMgYW55KVtwcm9wXTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0eXBlLCBwcm9wLCBkZXNjcmlwdG9yKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICB0aGlzLmluaXRpYWxOZ0RlZnMuY2xlYXIoKTtcbiAgICB0aGlzLm1vZHVsZVByb3ZpZGVyc092ZXJyaWRkZW4uY2xlYXIoKTtcbiAgICB0aGlzLnJlc3RvcmVDb21wb25lbnRSZXNvbHV0aW9uUXVldWUoKTtcbiAgICAvLyBSZXN0b3JlIHRoZSBsb2NhbGUgSUQgdG8gdGhlIGRlZmF1bHQgdmFsdWUsIHRoaXMgc2hvdWxkbid0IGJlIG5lY2Vzc2FyeSBidXQgd2UgbmV2ZXIga25vd1xuICAgIHNldExvY2FsZUlkKERFRkFVTFRfTE9DQUxFX0lEKTtcbiAgfVxuXG4gIHByaXZhdGUgY29tcGlsZVRlc3RNb2R1bGUoKTogdm9pZCB7XG4gICAgY2xhc3MgUm9vdFNjb3BlTW9kdWxlIHt9XG4gICAgY29tcGlsZU5nTW9kdWxlRGVmcyhSb290U2NvcGVNb2R1bGUgYXMgTmdNb2R1bGVUeXBlPGFueT4sIHtcbiAgICAgIHByb3ZpZGVyczogWy4uLnRoaXMucm9vdFByb3ZpZGVyT3ZlcnJpZGVzXSxcbiAgICB9KTtcblxuICAgIGNvbnN0IG5nWm9uZSA9IG5ldyBOZ1pvbmUoe2VuYWJsZUxvbmdTdGFja1RyYWNlOiB0cnVlfSk7XG4gICAgY29uc3QgcHJvdmlkZXJzOiBQcm92aWRlcltdID0gW1xuICAgICAge3Byb3ZpZGU6IE5nWm9uZSwgdXNlVmFsdWU6IG5nWm9uZX0sXG4gICAgICB7cHJvdmlkZTogQ29tcGlsZXIsIHVzZUZhY3Rvcnk6ICgpID0+IG5ldyBSM1Rlc3RDb21waWxlcih0aGlzKX0sXG4gICAgICAuLi50aGlzLnByb3ZpZGVycyxcbiAgICAgIC4uLnRoaXMucHJvdmlkZXJPdmVycmlkZXMsXG4gICAgXTtcbiAgICBjb25zdCBpbXBvcnRzID0gW1Jvb3RTY29wZU1vZHVsZSwgdGhpcy5hZGRpdGlvbmFsTW9kdWxlVHlwZXMsIHRoaXMuaW1wb3J0cyB8fCBbXV07XG5cbiAgICAvLyBjbGFuZy1mb3JtYXQgb2ZmXG4gICAgY29tcGlsZU5nTW9kdWxlRGVmcyh0aGlzLnRlc3RNb2R1bGVUeXBlLCB7XG4gICAgICBkZWNsYXJhdGlvbnM6IHRoaXMuZGVjbGFyYXRpb25zLFxuICAgICAgaW1wb3J0cyxcbiAgICAgIHNjaGVtYXM6IHRoaXMuc2NoZW1hcyxcbiAgICAgIHByb3ZpZGVycyxcbiAgICB9LCAvKiBhbGxvd0R1cGxpY2F0ZURlY2xhcmF0aW9uc0luUm9vdCAqLyB0cnVlKTtcbiAgICAvLyBjbGFuZy1mb3JtYXQgb25cblxuICAgIHRoaXMuYXBwbHlQcm92aWRlck92ZXJyaWRlc1RvTW9kdWxlKHRoaXMudGVzdE1vZHVsZVR5cGUpO1xuICB9XG5cbiAgZ2V0IGluamVjdG9yKCk6IEluamVjdG9yIHtcbiAgICBpZiAodGhpcy5faW5qZWN0b3IgIT09IG51bGwpIHtcbiAgICAgIHJldHVybiB0aGlzLl9pbmplY3RvcjtcbiAgICB9XG5cbiAgICBjb25zdCBwcm92aWRlcnM6IFByb3ZpZGVyW10gPSBbXTtcbiAgICBjb25zdCBjb21waWxlck9wdGlvbnMgPSB0aGlzLnBsYXRmb3JtLmluamVjdG9yLmdldChDT01QSUxFUl9PUFRJT05TKTtcbiAgICBjb21waWxlck9wdGlvbnMuZm9yRWFjaChvcHRzID0+IHtcbiAgICAgIGlmIChvcHRzLnByb3ZpZGVycykge1xuICAgICAgICBwcm92aWRlcnMucHVzaChvcHRzLnByb3ZpZGVycyk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgaWYgKHRoaXMuY29tcGlsZXJQcm92aWRlcnMgIT09IG51bGwpIHtcbiAgICAgIHByb3ZpZGVycy5wdXNoKC4uLnRoaXMuY29tcGlsZXJQcm92aWRlcnMpO1xuICAgIH1cblxuICAgIC8vIFRPRE8ob2NvbWJlKTogbWFrZSB0aGlzIHdvcmsgd2l0aCBhbiBJbmplY3RvciBkaXJlY3RseSBpbnN0ZWFkIG9mIGNyZWF0aW5nIGEgbW9kdWxlIGZvciBpdFxuICAgIGNsYXNzIENvbXBpbGVyTW9kdWxlIHt9XG4gICAgY29tcGlsZU5nTW9kdWxlRGVmcyhDb21waWxlck1vZHVsZSBhcyBOZ01vZHVsZVR5cGU8YW55Piwge3Byb3ZpZGVyc30pO1xuXG4gICAgY29uc3QgQ29tcGlsZXJNb2R1bGVGYWN0b3J5ID0gbmV3IFIzTmdNb2R1bGVGYWN0b3J5KENvbXBpbGVyTW9kdWxlKTtcbiAgICB0aGlzLl9pbmplY3RvciA9IENvbXBpbGVyTW9kdWxlRmFjdG9yeS5jcmVhdGUodGhpcy5wbGF0Zm9ybS5pbmplY3RvcikuaW5qZWN0b3I7XG4gICAgcmV0dXJuIHRoaXMuX2luamVjdG9yO1xuICB9XG5cbiAgLy8gZ2V0IG92ZXJyaWRlcyBmb3IgYSBzcGVjaWZpYyBwcm92aWRlciAoaWYgYW55KVxuICBwcml2YXRlIGdldFNpbmdsZVByb3ZpZGVyT3ZlcnJpZGVzKHByb3ZpZGVyOiBQcm92aWRlcik6IFByb3ZpZGVyfG51bGwge1xuICAgIGNvbnN0IHRva2VuID0gZ2V0UHJvdmlkZXJUb2tlbihwcm92aWRlcik7XG4gICAgcmV0dXJuIHRoaXMucHJvdmlkZXJPdmVycmlkZXNCeVRva2VuLmdldCh0b2tlbikgfHwgbnVsbDtcbiAgfVxuXG4gIHByaXZhdGUgZ2V0UHJvdmlkZXJPdmVycmlkZXMocHJvdmlkZXJzPzogUHJvdmlkZXJbXSk6IFByb3ZpZGVyW10ge1xuICAgIGlmICghcHJvdmlkZXJzIHx8ICFwcm92aWRlcnMubGVuZ3RoIHx8IHRoaXMucHJvdmlkZXJPdmVycmlkZXNCeVRva2VuLnNpemUgPT09IDApIHJldHVybiBbXTtcbiAgICAvLyBUaGVyZSBhcmUgdHdvIGZsYXR0ZW5pbmcgb3BlcmF0aW9ucyBoZXJlLiBUaGUgaW5uZXIgZmxhdHRlbigpIG9wZXJhdGVzIG9uIHRoZSBtZXRhZGF0YSdzXG4gICAgLy8gcHJvdmlkZXJzIGFuZCBhcHBsaWVzIGEgbWFwcGluZyBmdW5jdGlvbiB3aGljaCByZXRyaWV2ZXMgb3ZlcnJpZGVzIGZvciBlYWNoIGluY29taW5nXG4gICAgLy8gcHJvdmlkZXIuIFRoZSBvdXRlciBmbGF0dGVuKCkgdGhlbiBmbGF0dGVucyB0aGUgcHJvZHVjZWQgb3ZlcnJpZGVzIGFycmF5LiBJZiB0aGlzIGlzIG5vdFxuICAgIC8vIGRvbmUsIHRoZSBhcnJheSBjYW4gY29udGFpbiBvdGhlciBlbXB0eSBhcnJheXMgKGUuZy4gYFtbXSwgW11dYCkgd2hpY2ggbGVhayBpbnRvIHRoZVxuICAgIC8vIHByb3ZpZGVycyBhcnJheSBhbmQgY29udGFtaW5hdGUgYW55IGVycm9yIG1lc3NhZ2VzIHRoYXQgbWlnaHQgYmUgZ2VuZXJhdGVkLlxuICAgIHJldHVybiBmbGF0dGVuKGZsYXR0ZW4oXG4gICAgICAgIHByb3ZpZGVycywgKHByb3ZpZGVyOiBQcm92aWRlcikgPT4gdGhpcy5nZXRTaW5nbGVQcm92aWRlck92ZXJyaWRlcyhwcm92aWRlcikgfHwgW10pKTtcbiAgfVxuXG4gIHByaXZhdGUgZ2V0T3ZlcnJpZGRlblByb3ZpZGVycyhwcm92aWRlcnM/OiBQcm92aWRlcltdKTogUHJvdmlkZXJbXSB7XG4gICAgaWYgKCFwcm92aWRlcnMgfHwgIXByb3ZpZGVycy5sZW5ndGggfHwgdGhpcy5wcm92aWRlck92ZXJyaWRlc0J5VG9rZW4uc2l6ZSA9PT0gMCkgcmV0dXJuIFtdO1xuXG4gICAgY29uc3Qgb3ZlcnJpZGVzID0gdGhpcy5nZXRQcm92aWRlck92ZXJyaWRlcyhwcm92aWRlcnMpO1xuICAgIGNvbnN0IGhhc011bHRpUHJvdmlkZXJPdmVycmlkZXMgPSBvdmVycmlkZXMuc29tZShpc011bHRpUHJvdmlkZXIpO1xuICAgIGNvbnN0IG92ZXJyaWRkZW5Qcm92aWRlcnMgPSBbLi4ucHJvdmlkZXJzLCAuLi5vdmVycmlkZXNdO1xuXG4gICAgLy8gTm8gYWRkaXRpb25hbCBwcm9jZXNzaW5nIGlzIHJlcXVpcmVkIGluIGNhc2Ugd2UgaGF2ZSBubyBtdWx0aSBwcm92aWRlcnMgdG8gb3ZlcnJpZGVcbiAgICBpZiAoIWhhc011bHRpUHJvdmlkZXJPdmVycmlkZXMpIHtcbiAgICAgIHJldHVybiBvdmVycmlkZGVuUHJvdmlkZXJzO1xuICAgIH1cblxuICAgIGNvbnN0IGZpbmFsOiBQcm92aWRlcltdID0gW107XG4gICAgY29uc3Qgc2Vlbk11bHRpUHJvdmlkZXJzID0gbmV3IFNldDxQcm92aWRlcj4oKTtcblxuICAgIC8vIFdlIGl0ZXJhdGUgdGhyb3VnaCB0aGUgbGlzdCBvZiBwcm92aWRlcnMgaW4gcmV2ZXJzZSBvcmRlciB0byBtYWtlIHN1cmUgbXVsdGkgcHJvdmlkZXJcbiAgICAvLyBvdmVycmlkZXMgdGFrZSBwcmVjZWRlbmNlIG92ZXIgdGhlIHZhbHVlcyBkZWZpbmVkIGluIHByb3ZpZGVyIGxpc3QuIFdlIGFsc28gZml0ZXIgb3V0IGFsbFxuICAgIC8vIG11bHRpIHByb3ZpZGVycyB0aGF0IGhhdmUgb3ZlcnJpZGVzLCBrZWVwaW5nIG92ZXJyaWRkZW4gdmFsdWVzIG9ubHkuXG4gICAgZm9yRWFjaFJpZ2h0KG92ZXJyaWRkZW5Qcm92aWRlcnMsIChwcm92aWRlcjogYW55KSA9PiB7XG4gICAgICBjb25zdCB0b2tlbjogYW55ID0gZ2V0UHJvdmlkZXJUb2tlbihwcm92aWRlcik7XG4gICAgICBpZiAoaXNNdWx0aVByb3ZpZGVyKHByb3ZpZGVyKSAmJiB0aGlzLnByb3ZpZGVyT3ZlcnJpZGVzQnlUb2tlbi5oYXModG9rZW4pKSB7XG4gICAgICAgIGlmICghc2Vlbk11bHRpUHJvdmlkZXJzLmhhcyh0b2tlbikpIHtcbiAgICAgICAgICBzZWVuTXVsdGlQcm92aWRlcnMuYWRkKHRva2VuKTtcbiAgICAgICAgICBpZiAocHJvdmlkZXIgJiYgcHJvdmlkZXIudXNlVmFsdWUgJiYgQXJyYXkuaXNBcnJheShwcm92aWRlci51c2VWYWx1ZSkpIHtcbiAgICAgICAgICAgIGZvckVhY2hSaWdodChwcm92aWRlci51c2VWYWx1ZSwgKHZhbHVlOiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgLy8gVW53cmFwIHByb3ZpZGVyIG92ZXJyaWRlIGFycmF5IGludG8gaW5kaXZpZHVhbCBwcm92aWRlcnMgaW4gZmluYWwgc2V0LlxuICAgICAgICAgICAgICBmaW5hbC51bnNoaWZ0KHtwcm92aWRlOiB0b2tlbiwgdXNlVmFsdWU6IHZhbHVlLCBtdWx0aTogdHJ1ZX0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGZpbmFsLnVuc2hpZnQocHJvdmlkZXIpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZmluYWwudW5zaGlmdChwcm92aWRlcik7XG4gICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIGZpbmFsO1xuICB9XG5cbiAgcHJpdmF0ZSBoYXNQcm92aWRlck92ZXJyaWRlcyhwcm92aWRlcnM/OiBQcm92aWRlcltdKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0UHJvdmlkZXJPdmVycmlkZXMocHJvdmlkZXJzKS5sZW5ndGggPiAwO1xuICB9XG5cbiAgcHJpdmF0ZSBwYXRjaERlZldpdGhQcm92aWRlck92ZXJyaWRlcyhkZWNsYXJhdGlvbjogVHlwZTxhbnk+LCBmaWVsZDogc3RyaW5nKTogdm9pZCB7XG4gICAgY29uc3QgZGVmID0gKGRlY2xhcmF0aW9uIGFzIGFueSlbZmllbGRdO1xuICAgIGlmIChkZWYgJiYgZGVmLnByb3ZpZGVyc1Jlc29sdmVyKSB7XG4gICAgICB0aGlzLm1heWJlU3RvcmVOZ0RlZihmaWVsZCwgZGVjbGFyYXRpb24pO1xuXG4gICAgICBjb25zdCByZXNvbHZlciA9IGRlZi5wcm92aWRlcnNSZXNvbHZlcjtcbiAgICAgIGNvbnN0IHByb2Nlc3NQcm92aWRlcnNGbiA9IChwcm92aWRlcnM6IFByb3ZpZGVyW10pID0+IHRoaXMuZ2V0T3ZlcnJpZGRlblByb3ZpZGVycyhwcm92aWRlcnMpO1xuICAgICAgdGhpcy5zdG9yZUZpZWxkT2ZEZWZPblR5cGUoZGVjbGFyYXRpb24sIGZpZWxkLCAncHJvdmlkZXJzUmVzb2x2ZXInKTtcbiAgICAgIGRlZi5wcm92aWRlcnNSZXNvbHZlciA9IChuZ0RlZjogRGlyZWN0aXZlRGVmPGFueT4pID0+IHJlc29sdmVyKG5nRGVmLCBwcm9jZXNzUHJvdmlkZXJzRm4pO1xuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBpbml0UmVzb2x2ZXJzKCk6IFJlc29sdmVycyB7XG4gIHJldHVybiB7XG4gICAgbW9kdWxlOiBuZXcgTmdNb2R1bGVSZXNvbHZlcigpLFxuICAgIGNvbXBvbmVudDogbmV3IENvbXBvbmVudFJlc29sdmVyKCksXG4gICAgZGlyZWN0aXZlOiBuZXcgRGlyZWN0aXZlUmVzb2x2ZXIoKSxcbiAgICBwaXBlOiBuZXcgUGlwZVJlc29sdmVyKClcbiAgfTtcbn1cblxuZnVuY3Rpb24gaGFzTmdNb2R1bGVEZWY8VD4odmFsdWU6IFR5cGU8VD4pOiB2YWx1ZSBpcyBOZ01vZHVsZVR5cGU8VD4ge1xuICByZXR1cm4gdmFsdWUuaGFzT3duUHJvcGVydHkoJ25nTW9kdWxlRGVmJyk7XG59XG5cbmZ1bmN0aW9uIG1heWJlVW53cmFwRm48VD4obWF5YmVGbjogKCgpID0+IFQpIHwgVCk6IFQge1xuICByZXR1cm4gbWF5YmVGbiBpbnN0YW5jZW9mIEZ1bmN0aW9uID8gbWF5YmVGbigpIDogbWF5YmVGbjtcbn1cblxuZnVuY3Rpb24gZmxhdHRlbjxUPih2YWx1ZXM6IGFueVtdLCBtYXBGbj86ICh2YWx1ZTogVCkgPT4gYW55KTogVFtdIHtcbiAgY29uc3Qgb3V0OiBUW10gPSBbXTtcbiAgdmFsdWVzLmZvckVhY2godmFsdWUgPT4ge1xuICAgIGlmIChBcnJheS5pc0FycmF5KHZhbHVlKSkge1xuICAgICAgb3V0LnB1c2goLi4uZmxhdHRlbjxUPih2YWx1ZSwgbWFwRm4pKTtcbiAgICB9IGVsc2Uge1xuICAgICAgb3V0LnB1c2gobWFwRm4gPyBtYXBGbih2YWx1ZSkgOiB2YWx1ZSk7XG4gICAgfVxuICB9KTtcbiAgcmV0dXJuIG91dDtcbn1cblxuZnVuY3Rpb24gZ2V0UHJvdmlkZXJGaWVsZChwcm92aWRlcjogUHJvdmlkZXIsIGZpZWxkOiBzdHJpbmcpIHtcbiAgcmV0dXJuIHByb3ZpZGVyICYmIHR5cGVvZiBwcm92aWRlciA9PT0gJ29iamVjdCcgJiYgKHByb3ZpZGVyIGFzIGFueSlbZmllbGRdO1xufVxuXG5mdW5jdGlvbiBnZXRQcm92aWRlclRva2VuKHByb3ZpZGVyOiBQcm92aWRlcikge1xuICByZXR1cm4gZ2V0UHJvdmlkZXJGaWVsZChwcm92aWRlciwgJ3Byb3ZpZGUnKSB8fCBwcm92aWRlcjtcbn1cblxuZnVuY3Rpb24gaXNNdWx0aVByb3ZpZGVyKHByb3ZpZGVyOiBQcm92aWRlcikge1xuICByZXR1cm4gISFnZXRQcm92aWRlckZpZWxkKHByb3ZpZGVyLCAnbXVsdGknKTtcbn1cblxuZnVuY3Rpb24gaXNNb2R1bGVXaXRoUHJvdmlkZXJzKHZhbHVlOiBhbnkpOiB2YWx1ZSBpcyBNb2R1bGVXaXRoUHJvdmlkZXJzPGFueT4ge1xuICByZXR1cm4gdmFsdWUuaGFzT3duUHJvcGVydHkoJ25nTW9kdWxlJyk7XG59XG5cbmZ1bmN0aW9uIGZvckVhY2hSaWdodDxUPih2YWx1ZXM6IFRbXSwgZm46ICh2YWx1ZTogVCwgaWR4OiBudW1iZXIpID0+IHZvaWQpOiB2b2lkIHtcbiAgZm9yIChsZXQgaWR4ID0gdmFsdWVzLmxlbmd0aCAtIDE7IGlkeCA+PSAwOyBpZHgtLSkge1xuICAgIGZuKHZhbHVlc1tpZHhdLCBpZHgpO1xuICB9XG59XG5cbmNsYXNzIFIzVGVzdENvbXBpbGVyIGltcGxlbWVudHMgQ29tcGlsZXIge1xuICBjb25zdHJ1Y3Rvcihwcml2YXRlIHRlc3RCZWQ6IFIzVGVzdEJlZENvbXBpbGVyKSB7fVxuXG4gIGNvbXBpbGVNb2R1bGVTeW5jPFQ+KG1vZHVsZVR5cGU6IFR5cGU8VD4pOiBOZ01vZHVsZUZhY3Rvcnk8VD4ge1xuICAgIHRoaXMudGVzdEJlZC5fY29tcGlsZU5nTW9kdWxlU3luYyhtb2R1bGVUeXBlKTtcbiAgICByZXR1cm4gbmV3IFIzTmdNb2R1bGVGYWN0b3J5KG1vZHVsZVR5cGUpO1xuICB9XG5cbiAgYXN5bmMgY29tcGlsZU1vZHVsZUFzeW5jPFQ+KG1vZHVsZVR5cGU6IFR5cGU8VD4pOiBQcm9taXNlPE5nTW9kdWxlRmFjdG9yeTxUPj4ge1xuICAgIGF3YWl0IHRoaXMudGVzdEJlZC5fY29tcGlsZU5nTW9kdWxlQXN5bmMobW9kdWxlVHlwZSk7XG4gICAgcmV0dXJuIG5ldyBSM05nTW9kdWxlRmFjdG9yeShtb2R1bGVUeXBlKTtcbiAgfVxuXG4gIGNvbXBpbGVNb2R1bGVBbmRBbGxDb21wb25lbnRzU3luYzxUPihtb2R1bGVUeXBlOiBUeXBlPFQ+KTogTW9kdWxlV2l0aENvbXBvbmVudEZhY3RvcmllczxUPiB7XG4gICAgY29uc3QgbmdNb2R1bGVGYWN0b3J5ID0gdGhpcy5jb21waWxlTW9kdWxlU3luYyhtb2R1bGVUeXBlKTtcbiAgICBjb25zdCBjb21wb25lbnRGYWN0b3JpZXMgPSB0aGlzLnRlc3RCZWQuX2dldENvbXBvbmVudEZhY3Rvcmllcyhtb2R1bGVUeXBlIGFzIE5nTW9kdWxlVHlwZTxUPik7XG4gICAgcmV0dXJuIG5ldyBNb2R1bGVXaXRoQ29tcG9uZW50RmFjdG9yaWVzKG5nTW9kdWxlRmFjdG9yeSwgY29tcG9uZW50RmFjdG9yaWVzKTtcbiAgfVxuXG4gIGFzeW5jIGNvbXBpbGVNb2R1bGVBbmRBbGxDb21wb25lbnRzQXN5bmM8VD4obW9kdWxlVHlwZTogVHlwZTxUPik6XG4gICAgICBQcm9taXNlPE1vZHVsZVdpdGhDb21wb25lbnRGYWN0b3JpZXM8VD4+IHtcbiAgICBjb25zdCBuZ01vZHVsZUZhY3RvcnkgPSBhd2FpdCB0aGlzLmNvbXBpbGVNb2R1bGVBc3luYyhtb2R1bGVUeXBlKTtcbiAgICBjb25zdCBjb21wb25lbnRGYWN0b3JpZXMgPSB0aGlzLnRlc3RCZWQuX2dldENvbXBvbmVudEZhY3Rvcmllcyhtb2R1bGVUeXBlIGFzIE5nTW9kdWxlVHlwZTxUPik7XG4gICAgcmV0dXJuIG5ldyBNb2R1bGVXaXRoQ29tcG9uZW50RmFjdG9yaWVzKG5nTW9kdWxlRmFjdG9yeSwgY29tcG9uZW50RmFjdG9yaWVzKTtcbiAgfVxuXG4gIGNsZWFyQ2FjaGUoKTogdm9pZCB7fVxuXG4gIGNsZWFyQ2FjaGVGb3IodHlwZTogVHlwZTxhbnk+KTogdm9pZCB7fVxuXG4gIGdldE1vZHVsZUlkKG1vZHVsZVR5cGU6IFR5cGU8YW55Pik6IHN0cmluZ3x1bmRlZmluZWQge1xuICAgIGNvbnN0IG1ldGEgPSB0aGlzLnRlc3RCZWQuX2dldE1vZHVsZVJlc29sdmVyKCkucmVzb2x2ZShtb2R1bGVUeXBlKTtcbiAgICByZXR1cm4gbWV0YSAmJiBtZXRhLmlkIHx8IHVuZGVmaW5lZDtcbiAgfVxufVxuIl19