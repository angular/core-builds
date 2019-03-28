import * as tslib_1 from "tslib";
/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
// clang-format off
import { ApplicationInitStatus, COMPILER_OPTIONS, Compiler, ErrorHandler, ModuleWithComponentFactories, NgModule, NgZone, ɵcompileComponent as compileComponent, ɵcompileDirective as compileDirective, ɵcompileNgModuleDefs as compileNgModuleDefs, ɵcompilePipe as compilePipe, ɵgetInjectableDef as getInjectableDef, ɵNG_COMPONENT_DEF as NG_COMPONENT_DEF, ɵNG_DIRECTIVE_DEF as NG_DIRECTIVE_DEF, ɵNG_INJECTOR_DEF as NG_INJECTOR_DEF, ɵNG_MODULE_DEF as NG_MODULE_DEF, ɵNG_PIPE_DEF as NG_PIPE_DEF, ɵRender3ComponentFactory as ComponentFactory, ɵRender3NgModuleRef as NgModuleRef, ɵNgModuleFactory as R3NgModuleFactory, ɵpatchComponentDefWithScope as patchComponentDefWithScope, ɵtransitiveScopesFor as transitiveScopesFor, } from '@angular/core';
// clang-format on
import { ResourceLoader } from '@angular/compiler';
import { clearResolutionOfComponentResourcesQueue, restoreComponentResolutionQueue, resolveComponentResources, isComponentDefPendingResolution } from '../../src/metadata/resource_loading';
import { ComponentResolver, DirectiveResolver, NgModuleResolver, PipeResolver } from './resolvers';
import * as i0 from "@angular/core";
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/** @type {?} */
const TESTING_MODULE = 'TestingModule';
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
            this.queueTypeArray(moduleDef.declarations, TESTING_MODULE);
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
            { provide: token, useFactory: provider.useFactory, deps: provider.deps || [] } :
            { provide: token, useValue: provider.useValue };
        /** @type {?} */
        let injectableDef;
        /** @type {?} */
        const isRoot = (typeof token !== 'string' && (injectableDef = getInjectableDef(token)) &&
            injectableDef.providedIn === 'root');
        /** @type {?} */
        const overridesBucket = isRoot ? this.rootProviderOverrides : this.providerOverrides;
        overridesBucket.push(providerDef);
        // Keep all overrides grouped by token as well for fast lookups using token
        /** @type {?} */
        const overridesForToken = this.providerOverridesByToken.get(token) || [];
        overridesForToken.push(providerDef);
        this.providerOverridesByToken.set(token, overridesForToken);
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
        this.componentToModuleScope.set(type, TESTING_MODULE);
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
                const realType = moduleType === TESTING_MODULE ? this.testModuleType : moduleType;
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
            if (this.hasProviderOverrides(injectorDef.providers)) {
                this.maybeStoreNgDef(NG_INJECTOR_DEF, moduleType);
                this.storeFieldOfDefOnType(moduleType, NG_INJECTOR_DEF, 'providers');
                injectorDef.providers = [
                    ...injectorDef.providers,
                    ...this.getProviderOverrides(injectorDef.providers)
                ];
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
            // can be set correctly. Only record this the first time, because it might be overridden by
            // overrideTemplateUsingTestingModule.
            if (!this.componentToModuleScope.has(type)) {
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
    }
    /**
     * @private
     * @return {?}
     */
    compileTestModule() {
        /** @type {?} */
        const rootProviderOverrides = this.rootProviderOverrides;
        class RootScopeModule {
        }
        RootScopeModule.decorators = [
            { type: NgModule, args: [{
                        providers: [...rootProviderOverrides],
                        jit: true,
                    },] },
        ];
        class R3ErrorHandlerModule {
        }
        R3ErrorHandlerModule.decorators = [
            { type: NgModule, args: [{ providers: [{ provide: ErrorHandler, useClass: R3TestErrorHandler }] },] },
        ];
        /** @nocollapse */ R3ErrorHandlerModule.ngModuleDef = i0.ɵdefineNgModule({ type: R3ErrorHandlerModule });
        /** @nocollapse */ R3ErrorHandlerModule.ngInjectorDef = i0.defineInjector({ factory: function R3ErrorHandlerModule_Factory(t) { return new (t || R3ErrorHandlerModule)(); }, providers: [{ provide: ErrorHandler, useClass: R3TestErrorHandler }], imports: [] });
        /*@__PURE__*/ i0.ɵsetClassMetadata(R3ErrorHandlerModule, [{
                type: NgModule,
                args: [{ providers: [{ provide: ErrorHandler, useClass: R3TestErrorHandler }] }]
            }], null, null);
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
        const imports = [RootScopeModule, this.additionalModuleTypes, R3ErrorHandlerModule, this.imports || []];
        // clang-format off
        compileNgModuleDefs(this.testModuleType, {
            declarations: this.declarations,
            imports,
            schemas: this.schemas,
            providers,
        });
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
        CompilerModule.decorators = [
            { type: NgModule, args: [{ providers },] },
        ];
        /** @nocollapse */ CompilerModule.ngModuleDef = i0.ɵdefineNgModule({ type: CompilerModule });
        /** @nocollapse */ CompilerModule.ngInjectorDef = i0.defineInjector({ factory: function CompilerModule_Factory(t) { return new (t || CompilerModule)(); }, providers: providers, imports: [] });
        /*@__PURE__*/ i0.ɵsetClassMetadata(CompilerModule, [{
                type: NgModule,
                args: [{ providers }]
            }], null, null);
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
        const token = provider && typeof provider === 'object' && provider.hasOwnProperty('provide') ?
            provider.provide :
            provider;
        return this.providerOverridesByToken.get(token) || [];
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
        (provider) => this.getSingleProviderOverrides(provider))));
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
            (providers) => {
                /** @type {?} */
                const overrides = this.getProviderOverrides(providers);
                return [...providers, ...overrides];
            });
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
 * Error handler used for tests. Rethrows errors rather than logging them out.
 */
class R3TestErrorHandler extends ErrorHandler {
    /**
     * @param {?} error
     * @return {?}
     */
    handleError(error) { throw error; }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicjNfdGVzdF9iZWRfY29tcGlsZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3Rlc3Rpbmcvc3JjL3IzX3Rlc3RfYmVkX2NvbXBpbGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQVNBLE9BQU8sRUFDTCxxQkFBcUIsRUFDckIsZ0JBQWdCLEVBQ2hCLFFBQVEsRUFHUixZQUFZLEVBQ1osNEJBQTRCLEVBQzVCLFFBQVEsRUFFUixNQUFNLEVBTU4saUJBQWlCLElBQUksZ0JBQWdCLEVBQ3JDLGlCQUFpQixJQUFJLGdCQUFnQixFQUNyQyxvQkFBb0IsSUFBSSxtQkFBbUIsRUFDM0MsWUFBWSxJQUFJLFdBQVcsRUFDM0IsaUJBQWlCLElBQUksZ0JBQWdCLEVBQ3JDLGlCQUFpQixJQUFJLGdCQUFnQixFQUNyQyxpQkFBaUIsSUFBSSxnQkFBZ0IsRUFDckMsZ0JBQWdCLElBQUksZUFBZSxFQUNuQyxjQUFjLElBQUksYUFBYSxFQUMvQixZQUFZLElBQUksV0FBVyxFQUMzQix3QkFBd0IsSUFBSSxnQkFBZ0IsRUFDNUMsbUJBQW1CLElBQUksV0FBVyxFQUVsQyxnQkFBZ0IsSUFBSSxpQkFBaUIsRUFJckMsMkJBQTJCLElBQUksMEJBQTBCLEVBQ3pELG9CQUFvQixJQUFJLG1CQUFtQixHQUM1QyxNQUFNLGVBQWUsQ0FBQzs7QUFFdkIsT0FBTyxFQUFDLGNBQWMsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBRWpELE9BQU8sRUFBQyx3Q0FBd0MsRUFBRSwrQkFBK0IsRUFBRSx5QkFBeUIsRUFBRSwrQkFBK0IsRUFBQyxNQUFNLHFDQUFxQyxDQUFDO0FBRzFMLE9BQU8sRUFBQyxpQkFBaUIsRUFBRSxpQkFBaUIsRUFBRSxnQkFBZ0IsRUFBRSxZQUFZLEVBQVcsTUFBTSxhQUFhLENBQUM7Ozs7Ozs7Ozs7TUFHckcsY0FBYyxHQUFHLGVBQWU7Ozs7QUFXdEMsK0JBSUM7OztJQUhDLGlD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QkFBc0IsQ0FBQyxtQkFBQSxVQUFVLEVBQW1CLENBQUM7UUFDN0YsT0FBTyxJQUFJLDRCQUE0QixDQUFDLGVBQWUsRUFBRSxrQkFBa0IsQ0FBQyxDQUFDO0lBQy9FLENBQUM7Ozs7OztJQUVLLGtDQUFrQyxDQUFJLFVBQW1COzs7a0JBRXZELGVBQWUsR0FBRyxNQUFNLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxVQUFVLENBQUM7O2tCQUMzRCxrQkFBa0IsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLHNCQUFzQixDQUFDLG1CQUFBLFVBQVUsRUFBbUIsQ0FBQztZQUM3RixPQUFPLElBQUksNEJBQTRCLENBQUMsZUFBZSxFQUFFLGtCQUFrQixDQUFDLENBQUM7UUFDL0UsQ0FBQztLQUFBOzs7O0lBRUQsVUFBVSxLQUFVLENBQUM7Ozs7O0lBRXJCLGFBQWEsQ0FBQyxJQUFlLElBQVMsQ0FBQzs7Ozs7SUFFdkMsV0FBVyxDQUFDLFVBQXFCOztjQUN6QixJQUFJLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxrQkFBa0IsRUFBRSxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUM7UUFDbEUsT0FBTyxJQUFJLElBQUksSUFBSSxDQUFDLEVBQUUsSUFBSSxTQUFTLENBQUM7SUFDdEMsQ0FBQztDQUNGOzs7Ozs7SUFqQ2EsaUNBQWtDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG4vLyBjbGFuZy1mb3JtYXQgb2ZmXG5pbXBvcnQge1xuICBBcHBsaWNhdGlvbkluaXRTdGF0dXMsXG4gIENPTVBJTEVSX09QVElPTlMsXG4gIENvbXBpbGVyLFxuICBDb21wb25lbnQsXG4gIERpcmVjdGl2ZSxcbiAgRXJyb3JIYW5kbGVyLFxuICBNb2R1bGVXaXRoQ29tcG9uZW50RmFjdG9yaWVzLFxuICBOZ01vZHVsZSxcbiAgTmdNb2R1bGVGYWN0b3J5LFxuICBOZ1pvbmUsXG4gIEluamVjdG9yLFxuICBQaXBlLFxuICBQbGF0Zm9ybVJlZixcbiAgUHJvdmlkZXIsXG4gIFR5cGUsXG4gIMm1Y29tcGlsZUNvbXBvbmVudCBhcyBjb21waWxlQ29tcG9uZW50LFxuICDJtWNvbXBpbGVEaXJlY3RpdmUgYXMgY29tcGlsZURpcmVjdGl2ZSxcbiAgybVjb21waWxlTmdNb2R1bGVEZWZzIGFzIGNvbXBpbGVOZ01vZHVsZURlZnMsXG4gIMm1Y29tcGlsZVBpcGUgYXMgY29tcGlsZVBpcGUsXG4gIMm1Z2V0SW5qZWN0YWJsZURlZiBhcyBnZXRJbmplY3RhYmxlRGVmLFxuICDJtU5HX0NPTVBPTkVOVF9ERUYgYXMgTkdfQ09NUE9ORU5UX0RFRixcbiAgybVOR19ESVJFQ1RJVkVfREVGIGFzIE5HX0RJUkVDVElWRV9ERUYsXG4gIMm1TkdfSU5KRUNUT1JfREVGIGFzIE5HX0lOSkVDVE9SX0RFRixcbiAgybVOR19NT0RVTEVfREVGIGFzIE5HX01PRFVMRV9ERUYsXG4gIMm1TkdfUElQRV9ERUYgYXMgTkdfUElQRV9ERUYsXG4gIMm1UmVuZGVyM0NvbXBvbmVudEZhY3RvcnkgYXMgQ29tcG9uZW50RmFjdG9yeSxcbiAgybVSZW5kZXIzTmdNb2R1bGVSZWYgYXMgTmdNb2R1bGVSZWYsXG4gIMm1SW5qZWN0YWJsZURlZiBhcyBJbmplY3RhYmxlRGVmLFxuICDJtU5nTW9kdWxlRmFjdG9yeSBhcyBSM05nTW9kdWxlRmFjdG9yeSxcbiAgybVOZ01vZHVsZVRyYW5zaXRpdmVTY29wZXMgYXMgTmdNb2R1bGVUcmFuc2l0aXZlU2NvcGVzLFxuICDJtU5nTW9kdWxlVHlwZSBhcyBOZ01vZHVsZVR5cGUsXG4gIMm1RGlyZWN0aXZlRGVmIGFzIERpcmVjdGl2ZURlZixcbiAgybVwYXRjaENvbXBvbmVudERlZldpdGhTY29wZSBhcyBwYXRjaENvbXBvbmVudERlZldpdGhTY29wZSxcbiAgybV0cmFuc2l0aXZlU2NvcGVzRm9yIGFzIHRyYW5zaXRpdmVTY29wZXNGb3IsXG59IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuLy8gY2xhbmctZm9ybWF0IG9uXG5pbXBvcnQge1Jlc291cmNlTG9hZGVyfSBmcm9tICdAYW5ndWxhci9jb21waWxlcic7XG5cbmltcG9ydCB7Y2xlYXJSZXNvbHV0aW9uT2ZDb21wb25lbnRSZXNvdXJjZXNRdWV1ZSwgcmVzdG9yZUNvbXBvbmVudFJlc29sdXRpb25RdWV1ZSwgcmVzb2x2ZUNvbXBvbmVudFJlc291cmNlcywgaXNDb21wb25lbnREZWZQZW5kaW5nUmVzb2x1dGlvbn0gZnJvbSAnLi4vLi4vc3JjL21ldGFkYXRhL3Jlc291cmNlX2xvYWRpbmcnO1xuXG5pbXBvcnQge01ldGFkYXRhT3ZlcnJpZGV9IGZyb20gJy4vbWV0YWRhdGFfb3ZlcnJpZGUnO1xuaW1wb3J0IHtDb21wb25lbnRSZXNvbHZlciwgRGlyZWN0aXZlUmVzb2x2ZXIsIE5nTW9kdWxlUmVzb2x2ZXIsIFBpcGVSZXNvbHZlciwgUmVzb2x2ZXJ9IGZyb20gJy4vcmVzb2x2ZXJzJztcbmltcG9ydCB7VGVzdE1vZHVsZU1ldGFkYXRhfSBmcm9tICcuL3Rlc3RfYmVkX2NvbW1vbic7XG5cbmNvbnN0IFRFU1RJTkdfTU9EVUxFID0gJ1Rlc3RpbmdNb2R1bGUnO1xudHlwZSBURVNUSU5HX01PRFVMRSA9IHR5cGVvZiBURVNUSU5HX01PRFVMRTtcblxuLy8gUmVzb2x2ZXJzIGZvciBBbmd1bGFyIGRlY29yYXRvcnNcbnR5cGUgUmVzb2x2ZXJzID0ge1xuICBtb2R1bGU6IFJlc29sdmVyPE5nTW9kdWxlPixcbiAgY29tcG9uZW50OiBSZXNvbHZlcjxEaXJlY3RpdmU+LFxuICBkaXJlY3RpdmU6IFJlc29sdmVyPENvbXBvbmVudD4sXG4gIHBpcGU6IFJlc29sdmVyPFBpcGU+LFxufTtcblxuaW50ZXJmYWNlIENsZWFudXBPcGVyYXRpb24ge1xuICBmaWVsZDogc3RyaW5nO1xuICBkZWY6IGFueTtcbiAgb3JpZ2luYWw6IHVua25vd247XG59XG5cbmV4cG9ydCBjbGFzcyBSM1Rlc3RCZWRDb21waWxlciB7XG4gIHByaXZhdGUgb3JpZ2luYWxDb21wb25lbnRSZXNvbHV0aW9uUXVldWU6IE1hcDxUeXBlPGFueT4sIENvbXBvbmVudD58bnVsbCA9IG51bGw7XG5cbiAgLy8gVGVzdGluZyBtb2R1bGUgY29uZmlndXJhdGlvblxuICBwcml2YXRlIGRlY2xhcmF0aW9uczogVHlwZTxhbnk+W10gPSBbXTtcbiAgcHJpdmF0ZSBpbXBvcnRzOiBUeXBlPGFueT5bXSA9IFtdO1xuICBwcml2YXRlIHByb3ZpZGVyczogUHJvdmlkZXJbXSA9IFtdO1xuICBwcml2YXRlIHNjaGVtYXM6IGFueVtdID0gW107XG5cbiAgLy8gUXVldWVzIG9mIGNvbXBvbmVudHMvZGlyZWN0aXZlcy9waXBlcyB0aGF0IHNob3VsZCBiZSByZWNvbXBpbGVkLlxuICBwcml2YXRlIHBlbmRpbmdDb21wb25lbnRzID0gbmV3IFNldDxUeXBlPGFueT4+KCk7XG4gIHByaXZhdGUgcGVuZGluZ0RpcmVjdGl2ZXMgPSBuZXcgU2V0PFR5cGU8YW55Pj4oKTtcbiAgcHJpdmF0ZSBwZW5kaW5nUGlwZXMgPSBuZXcgU2V0PFR5cGU8YW55Pj4oKTtcblxuICAvLyBLZWVwIHRyYWNrIG9mIGFsbCBjb21wb25lbnRzIGFuZCBkaXJlY3RpdmVzLCBzbyB3ZSBjYW4gcGF0Y2ggUHJvdmlkZXJzIG9udG8gZGVmcyBsYXRlci5cbiAgcHJpdmF0ZSBzZWVuQ29tcG9uZW50cyA9IG5ldyBTZXQ8VHlwZTxhbnk+PigpO1xuICBwcml2YXRlIHNlZW5EaXJlY3RpdmVzID0gbmV3IFNldDxUeXBlPGFueT4+KCk7XG5cbiAgLy8gU3RvcmUgcmVzb2x2ZWQgc3R5bGVzIGZvciBDb21wb25lbnRzIHRoYXQgaGF2ZSB0ZW1wbGF0ZSBvdmVycmlkZXMgcHJlc2VudCBhbmQgYHN0eWxlVXJsc2BcbiAgLy8gZGVmaW5lZCBhdCB0aGUgc2FtZSB0aW1lLlxuICBwcml2YXRlIGV4aXN0aW5nQ29tcG9uZW50U3R5bGVzID0gbmV3IE1hcDxUeXBlPGFueT4sIHN0cmluZ1tdPigpO1xuXG4gIHByaXZhdGUgcmVzb2x2ZXJzOiBSZXNvbHZlcnMgPSBpbml0UmVzb2x2ZXJzKCk7XG5cbiAgcHJpdmF0ZSBjb21wb25lbnRUb01vZHVsZVNjb3BlID0gbmV3IE1hcDxUeXBlPGFueT4sIFR5cGU8YW55PnxURVNUSU5HX01PRFVMRT4oKTtcblxuICAvLyBNYXAgdGhhdCBrZWVwcyBpbml0aWFsIHZlcnNpb24gb2YgY29tcG9uZW50L2RpcmVjdGl2ZS9waXBlIGRlZnMgaW4gY2FzZVxuICAvLyB3ZSBjb21waWxlIGEgVHlwZSBhZ2FpbiwgdGh1cyBvdmVycmlkaW5nIHJlc3BlY3RpdmUgc3RhdGljIGZpZWxkcy4gVGhpcyBpc1xuICAvLyByZXF1aXJlZCB0byBtYWtlIHN1cmUgd2UgcmVzdG9yZSBkZWZzIHRvIHRoZWlyIGluaXRpYWwgc3RhdGVzIGJldHdlZW4gdGVzdCBydW5zXG4gIC8vIFRPRE86IHdlIHNob3VsZCBzdXBwb3J0IHRoZSBjYXNlIHdpdGggbXVsdGlwbGUgZGVmcyBvbiBhIHR5cGVcbiAgcHJpdmF0ZSBpbml0aWFsTmdEZWZzID0gbmV3IE1hcDxUeXBlPGFueT4sIFtzdHJpbmcsIFByb3BlcnR5RGVzY3JpcHRvcnx1bmRlZmluZWRdPigpO1xuXG4gIC8vIEFycmF5IHRoYXQga2VlcHMgY2xlYW51cCBvcGVyYXRpb25zIGZvciBpbml0aWFsIHZlcnNpb25zIG9mIGNvbXBvbmVudC9kaXJlY3RpdmUvcGlwZS9tb2R1bGVcbiAgLy8gZGVmcyBpbiBjYXNlIFRlc3RCZWQgbWFrZXMgY2hhbmdlcyB0byB0aGUgb3JpZ2luYWxzLlxuICBwcml2YXRlIGRlZkNsZWFudXBPcHM6IENsZWFudXBPcGVyYXRpb25bXSA9IFtdO1xuXG4gIHByaXZhdGUgX2luamVjdG9yOiBJbmplY3RvcnxudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBjb21waWxlclByb3ZpZGVyczogUHJvdmlkZXJbXXxudWxsID0gbnVsbDtcblxuICBwcml2YXRlIHByb3ZpZGVyT3ZlcnJpZGVzOiBQcm92aWRlcltdID0gW107XG4gIHByaXZhdGUgcm9vdFByb3ZpZGVyT3ZlcnJpZGVzOiBQcm92aWRlcltdID0gW107XG4gIHByaXZhdGUgcHJvdmlkZXJPdmVycmlkZXNCeVRva2VuID0gbmV3IE1hcDxhbnksIFByb3ZpZGVyW10+KCk7XG4gIHByaXZhdGUgbW9kdWxlUHJvdmlkZXJzT3ZlcnJpZGRlbiA9IG5ldyBTZXQ8VHlwZTxhbnk+PigpO1xuXG4gIHByaXZhdGUgdGVzdE1vZHVsZVR5cGU6IE5nTW9kdWxlVHlwZTxhbnk+O1xuICBwcml2YXRlIHRlc3RNb2R1bGVSZWY6IE5nTW9kdWxlUmVmPGFueT58bnVsbCA9IG51bGw7XG5cbiAgY29uc3RydWN0b3IocHJpdmF0ZSBwbGF0Zm9ybTogUGxhdGZvcm1SZWYsIHByaXZhdGUgYWRkaXRpb25hbE1vZHVsZVR5cGVzOiBUeXBlPGFueT58VHlwZTxhbnk+W10pIHtcbiAgICBjbGFzcyBEeW5hbWljVGVzdE1vZHVsZSB7fVxuICAgIHRoaXMudGVzdE1vZHVsZVR5cGUgPSBEeW5hbWljVGVzdE1vZHVsZSBhcyBhbnk7XG4gIH1cblxuICBzZXRDb21waWxlclByb3ZpZGVycyhwcm92aWRlcnM6IFByb3ZpZGVyW118bnVsbCk6IHZvaWQge1xuICAgIHRoaXMuY29tcGlsZXJQcm92aWRlcnMgPSBwcm92aWRlcnM7XG4gICAgdGhpcy5faW5qZWN0b3IgPSBudWxsO1xuICB9XG5cbiAgY29uZmlndXJlVGVzdGluZ01vZHVsZShtb2R1bGVEZWY6IFRlc3RNb2R1bGVNZXRhZGF0YSk6IHZvaWQge1xuICAgIC8vIEVucXVldWUgYW55IGNvbXBpbGF0aW9uIHRhc2tzIGZvciB0aGUgZGlyZWN0bHkgZGVjbGFyZWQgY29tcG9uZW50LlxuICAgIGlmIChtb2R1bGVEZWYuZGVjbGFyYXRpb25zICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHRoaXMucXVldWVUeXBlQXJyYXkobW9kdWxlRGVmLmRlY2xhcmF0aW9ucywgVEVTVElOR19NT0RVTEUpO1xuICAgICAgdGhpcy5kZWNsYXJhdGlvbnMucHVzaCguLi5tb2R1bGVEZWYuZGVjbGFyYXRpb25zKTtcbiAgICB9XG5cbiAgICAvLyBFbnF1ZXVlIGFueSBjb21waWxhdGlvbiB0YXNrcyBmb3IgaW1wb3J0ZWQgbW9kdWxlcy5cbiAgICBpZiAobW9kdWxlRGVmLmltcG9ydHMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhpcy5xdWV1ZVR5cGVzRnJvbU1vZHVsZXNBcnJheShtb2R1bGVEZWYuaW1wb3J0cyk7XG4gICAgICB0aGlzLmltcG9ydHMucHVzaCguLi5tb2R1bGVEZWYuaW1wb3J0cyk7XG4gICAgfVxuXG4gICAgaWYgKG1vZHVsZURlZi5wcm92aWRlcnMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhpcy5wcm92aWRlcnMucHVzaCguLi5tb2R1bGVEZWYucHJvdmlkZXJzKTtcbiAgICB9XG5cbiAgICBpZiAobW9kdWxlRGVmLnNjaGVtYXMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhpcy5zY2hlbWFzLnB1c2goLi4ubW9kdWxlRGVmLnNjaGVtYXMpO1xuICAgIH1cbiAgfVxuXG4gIG92ZXJyaWRlTW9kdWxlKG5nTW9kdWxlOiBUeXBlPGFueT4sIG92ZXJyaWRlOiBNZXRhZGF0YU92ZXJyaWRlPE5nTW9kdWxlPik6IHZvaWQge1xuICAgIC8vIENvbXBpbGUgdGhlIG1vZHVsZSByaWdodCBhd2F5LlxuICAgIHRoaXMucmVzb2x2ZXJzLm1vZHVsZS5hZGRPdmVycmlkZShuZ01vZHVsZSwgb3ZlcnJpZGUpO1xuICAgIGNvbnN0IG1ldGFkYXRhID0gdGhpcy5yZXNvbHZlcnMubW9kdWxlLnJlc29sdmUobmdNb2R1bGUpO1xuICAgIGlmIChtZXRhZGF0YSA9PT0gbnVsbCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGAke25nTW9kdWxlLm5hbWV9IGlzIG5vdCBhbiBATmdNb2R1bGUgb3IgaXMgbWlzc2luZyBtZXRhZGF0YWApO1xuICAgIH1cblxuICAgIHRoaXMucmVjb21waWxlTmdNb2R1bGUobmdNb2R1bGUpO1xuXG4gICAgLy8gQXQgdGhpcyBwb2ludCwgdGhlIG1vZHVsZSBoYXMgYSB2YWxpZCAubmdNb2R1bGVEZWYsIGJ1dCB0aGUgb3ZlcnJpZGUgbWF5IGhhdmUgaW50cm9kdWNlZFxuICAgIC8vIG5ldyBkZWNsYXJhdGlvbnMgb3IgaW1wb3J0ZWQgbW9kdWxlcy4gSW5nZXN0IGFueSBwb3NzaWJsZSBuZXcgdHlwZXMgYW5kIGFkZCB0aGVtIHRvIHRoZVxuICAgIC8vIGN1cnJlbnQgcXVldWUuXG4gICAgdGhpcy5xdWV1ZVR5cGVzRnJvbU1vZHVsZXNBcnJheShbbmdNb2R1bGVdKTtcbiAgfVxuXG4gIG92ZXJyaWRlQ29tcG9uZW50KGNvbXBvbmVudDogVHlwZTxhbnk+LCBvdmVycmlkZTogTWV0YWRhdGFPdmVycmlkZTxDb21wb25lbnQ+KTogdm9pZCB7XG4gICAgdGhpcy5yZXNvbHZlcnMuY29tcG9uZW50LmFkZE92ZXJyaWRlKGNvbXBvbmVudCwgb3ZlcnJpZGUpO1xuICAgIHRoaXMucGVuZGluZ0NvbXBvbmVudHMuYWRkKGNvbXBvbmVudCk7XG4gIH1cblxuICBvdmVycmlkZURpcmVjdGl2ZShkaXJlY3RpdmU6IFR5cGU8YW55Piwgb3ZlcnJpZGU6IE1ldGFkYXRhT3ZlcnJpZGU8RGlyZWN0aXZlPik6IHZvaWQge1xuICAgIHRoaXMucmVzb2x2ZXJzLmRpcmVjdGl2ZS5hZGRPdmVycmlkZShkaXJlY3RpdmUsIG92ZXJyaWRlKTtcbiAgICB0aGlzLnBlbmRpbmdEaXJlY3RpdmVzLmFkZChkaXJlY3RpdmUpO1xuICB9XG5cbiAgb3ZlcnJpZGVQaXBlKHBpcGU6IFR5cGU8YW55Piwgb3ZlcnJpZGU6IE1ldGFkYXRhT3ZlcnJpZGU8UGlwZT4pOiB2b2lkIHtcbiAgICB0aGlzLnJlc29sdmVycy5waXBlLmFkZE92ZXJyaWRlKHBpcGUsIG92ZXJyaWRlKTtcbiAgICB0aGlzLnBlbmRpbmdQaXBlcy5hZGQocGlwZSk7XG4gIH1cblxuICBvdmVycmlkZVByb3ZpZGVyKHRva2VuOiBhbnksIHByb3ZpZGVyOiB7dXNlRmFjdG9yeT86IEZ1bmN0aW9uLCB1c2VWYWx1ZT86IGFueSwgZGVwcz86IGFueVtdfSk6XG4gICAgICB2b2lkIHtcbiAgICBjb25zdCBwcm92aWRlckRlZiA9IHByb3ZpZGVyLnVzZUZhY3RvcnkgP1xuICAgICAgICB7cHJvdmlkZTogdG9rZW4sIHVzZUZhY3Rvcnk6IHByb3ZpZGVyLnVzZUZhY3RvcnksIGRlcHM6IHByb3ZpZGVyLmRlcHMgfHwgW119IDpcbiAgICAgICAge3Byb3ZpZGU6IHRva2VuLCB1c2VWYWx1ZTogcHJvdmlkZXIudXNlVmFsdWV9O1xuXG4gICAgbGV0IGluamVjdGFibGVEZWY6IEluamVjdGFibGVEZWY8YW55PnxudWxsO1xuICAgIGNvbnN0IGlzUm9vdCA9XG4gICAgICAgICh0eXBlb2YgdG9rZW4gIT09ICdzdHJpbmcnICYmIChpbmplY3RhYmxlRGVmID0gZ2V0SW5qZWN0YWJsZURlZih0b2tlbikpICYmXG4gICAgICAgICBpbmplY3RhYmxlRGVmLnByb3ZpZGVkSW4gPT09ICdyb290Jyk7XG4gICAgY29uc3Qgb3ZlcnJpZGVzQnVja2V0ID0gaXNSb290ID8gdGhpcy5yb290UHJvdmlkZXJPdmVycmlkZXMgOiB0aGlzLnByb3ZpZGVyT3ZlcnJpZGVzO1xuICAgIG92ZXJyaWRlc0J1Y2tldC5wdXNoKHByb3ZpZGVyRGVmKTtcblxuICAgIC8vIEtlZXAgYWxsIG92ZXJyaWRlcyBncm91cGVkIGJ5IHRva2VuIGFzIHdlbGwgZm9yIGZhc3QgbG9va3VwcyB1c2luZyB0b2tlblxuICAgIGNvbnN0IG92ZXJyaWRlc0ZvclRva2VuID0gdGhpcy5wcm92aWRlck92ZXJyaWRlc0J5VG9rZW4uZ2V0KHRva2VuKSB8fCBbXTtcbiAgICBvdmVycmlkZXNGb3JUb2tlbi5wdXNoKHByb3ZpZGVyRGVmKTtcbiAgICB0aGlzLnByb3ZpZGVyT3ZlcnJpZGVzQnlUb2tlbi5zZXQodG9rZW4sIG92ZXJyaWRlc0ZvclRva2VuKTtcbiAgfVxuXG4gIG92ZXJyaWRlVGVtcGxhdGVVc2luZ1Rlc3RpbmdNb2R1bGUodHlwZTogVHlwZTxhbnk+LCB0ZW1wbGF0ZTogc3RyaW5nKTogdm9pZCB7XG4gICAgY29uc3QgZGVmID0gKHR5cGUgYXMgYW55KVtOR19DT01QT05FTlRfREVGXTtcbiAgICBjb25zdCBoYXNTdHlsZVVybHMgPSAoKTogYm9vbGVhbiA9PiB7XG4gICAgICBjb25zdCBtZXRhZGF0YSA9IHRoaXMucmVzb2x2ZXJzLmNvbXBvbmVudC5yZXNvbHZlKHR5cGUpICFhcyBDb21wb25lbnQ7XG4gICAgICByZXR1cm4gISFtZXRhZGF0YS5zdHlsZVVybHMgJiYgbWV0YWRhdGEuc3R5bGVVcmxzLmxlbmd0aCA+IDA7XG4gICAgfTtcbiAgICBjb25zdCBvdmVycmlkZVN0eWxlVXJscyA9ICEhZGVmICYmICFpc0NvbXBvbmVudERlZlBlbmRpbmdSZXNvbHV0aW9uKHR5cGUpICYmIGhhc1N0eWxlVXJscygpO1xuXG4gICAgLy8gSW4gSXZ5LCBjb21waWxpbmcgYSBjb21wb25lbnQgZG9lcyBub3QgcmVxdWlyZSBrbm93aW5nIHRoZSBtb2R1bGUgcHJvdmlkaW5nIHRoZVxuICAgIC8vIGNvbXBvbmVudCdzIHNjb3BlLCBzbyBvdmVycmlkZVRlbXBsYXRlVXNpbmdUZXN0aW5nTW9kdWxlIGNhbiBiZSBpbXBsZW1lbnRlZCBwdXJlbHkgdmlhXG4gICAgLy8gb3ZlcnJpZGVDb21wb25lbnQuIEltcG9ydGFudDogb3ZlcnJpZGluZyB0ZW1wbGF0ZSByZXF1aXJlcyBmdWxsIENvbXBvbmVudCByZS1jb21waWxhdGlvbixcbiAgICAvLyB3aGljaCBtYXkgZmFpbCBpbiBjYXNlIHN0eWxlVXJscyBhcmUgYWxzbyBwcmVzZW50ICh0aHVzIENvbXBvbmVudCBpcyBjb25zaWRlcmVkIGFzIHJlcXVpcmVkXG4gICAgLy8gcmVzb2x1dGlvbikuIEluIG9yZGVyIHRvIGF2b2lkIHRoaXMsIHdlIHByZWVtcHRpdmVseSBzZXQgc3R5bGVVcmxzIHRvIGFuIGVtcHR5IGFycmF5LFxuICAgIC8vIHByZXNlcnZlIGN1cnJlbnQgc3R5bGVzIGF2YWlsYWJsZSBvbiBDb21wb25lbnQgZGVmIGFuZCByZXN0b3JlIHN0eWxlcyBiYWNrIG9uY2UgY29tcGlsYXRpb25cbiAgICAvLyBpcyBjb21wbGV0ZS5cbiAgICBjb25zdCBvdmVycmlkZSA9IG92ZXJyaWRlU3R5bGVVcmxzID8ge3RlbXBsYXRlLCBzdHlsZXM6IFtdLCBzdHlsZVVybHM6IFtdfSA6IHt0ZW1wbGF0ZX07XG4gICAgdGhpcy5vdmVycmlkZUNvbXBvbmVudCh0eXBlLCB7c2V0OiBvdmVycmlkZX0pO1xuXG4gICAgaWYgKG92ZXJyaWRlU3R5bGVVcmxzICYmIGRlZi5zdHlsZXMgJiYgZGVmLnN0eWxlcy5sZW5ndGggPiAwKSB7XG4gICAgICB0aGlzLmV4aXN0aW5nQ29tcG9uZW50U3R5bGVzLnNldCh0eXBlLCBkZWYuc3R5bGVzKTtcbiAgICB9XG5cbiAgICAvLyBTZXQgdGhlIGNvbXBvbmVudCdzIHNjb3BlIHRvIGJlIHRoZSB0ZXN0aW5nIG1vZHVsZS5cbiAgICB0aGlzLmNvbXBvbmVudFRvTW9kdWxlU2NvcGUuc2V0KHR5cGUsIFRFU1RJTkdfTU9EVUxFKTtcbiAgfVxuXG4gIGFzeW5jIGNvbXBpbGVDb21wb25lbnRzKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRoaXMuY2xlYXJDb21wb25lbnRSZXNvbHV0aW9uUXVldWUoKTtcbiAgICAvLyBSdW4gY29tcGlsZXJzIGZvciBhbGwgcXVldWVkIHR5cGVzLlxuICAgIGxldCBuZWVkc0FzeW5jUmVzb3VyY2VzID0gdGhpcy5jb21waWxlVHlwZXNTeW5jKCk7XG5cbiAgICAvLyBjb21waWxlQ29tcG9uZW50cygpIHNob3VsZCBub3QgYmUgYXN5bmMgdW5sZXNzIGl0IG5lZWRzIHRvIGJlLlxuICAgIGlmIChuZWVkc0FzeW5jUmVzb3VyY2VzKSB7XG4gICAgICBsZXQgcmVzb3VyY2VMb2FkZXI6IFJlc291cmNlTG9hZGVyO1xuICAgICAgbGV0IHJlc29sdmVyID0gKHVybDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+ID0+IHtcbiAgICAgICAgaWYgKCFyZXNvdXJjZUxvYWRlcikge1xuICAgICAgICAgIHJlc291cmNlTG9hZGVyID0gdGhpcy5pbmplY3Rvci5nZXQoUmVzb3VyY2VMb2FkZXIpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUocmVzb3VyY2VMb2FkZXIuZ2V0KHVybCkpO1xuICAgICAgfTtcbiAgICAgIGF3YWl0IHJlc29sdmVDb21wb25lbnRSZXNvdXJjZXMocmVzb2x2ZXIpO1xuICAgIH1cbiAgfVxuXG4gIGZpbmFsaXplKCk6IE5nTW9kdWxlUmVmPGFueT4ge1xuICAgIC8vIE9uZSBsYXN0IGNvbXBpbGVcbiAgICB0aGlzLmNvbXBpbGVUeXBlc1N5bmMoKTtcblxuICAgIC8vIENyZWF0ZSB0aGUgdGVzdGluZyBtb2R1bGUgaXRzZWxmLlxuICAgIHRoaXMuY29tcGlsZVRlc3RNb2R1bGUoKTtcblxuICAgIHRoaXMuYXBwbHlUcmFuc2l0aXZlU2NvcGVzKCk7XG5cbiAgICB0aGlzLmFwcGx5UHJvdmlkZXJPdmVycmlkZXMoKTtcblxuICAgIC8vIFBhdGNoIHByZXZpb3VzbHkgc3RvcmVkIGBzdHlsZXNgIENvbXBvbmVudCB2YWx1ZXMgKHRha2VuIGZyb20gbmdDb21wb25lbnREZWYpLCBpbiBjYXNlIHRoZXNlXG4gICAgLy8gQ29tcG9uZW50cyBoYXZlIGBzdHlsZVVybHNgIGZpZWxkcyBkZWZpbmVkIGFuZCB0ZW1wbGF0ZSBvdmVycmlkZSB3YXMgcmVxdWVzdGVkLlxuICAgIHRoaXMucGF0Y2hDb21wb25lbnRzV2l0aEV4aXN0aW5nU3R5bGVzKCk7XG5cbiAgICAvLyBDbGVhciB0aGUgY29tcG9uZW50VG9Nb2R1bGVTY29wZSBtYXAsIHNvIHRoYXQgZnV0dXJlIGNvbXBpbGF0aW9ucyBkb24ndCByZXNldCB0aGUgc2NvcGUgb2ZcbiAgICAvLyBldmVyeSBjb21wb25lbnQuXG4gICAgdGhpcy5jb21wb25lbnRUb01vZHVsZVNjb3BlLmNsZWFyKCk7XG5cbiAgICBjb25zdCBwYXJlbnRJbmplY3RvciA9IHRoaXMucGxhdGZvcm0uaW5qZWN0b3I7XG4gICAgdGhpcy50ZXN0TW9kdWxlUmVmID0gbmV3IE5nTW9kdWxlUmVmKHRoaXMudGVzdE1vZHVsZVR5cGUsIHBhcmVudEluamVjdG9yKTtcblxuXG4gICAgLy8gQXBwbGljYXRpb25Jbml0U3RhdHVzLnJ1bkluaXRpYWxpemVycygpIGlzIG1hcmtlZCBAaW50ZXJuYWwgdG8gY29yZS5cbiAgICAvLyBDYXN0IGl0IHRvIGFueSBiZWZvcmUgYWNjZXNzaW5nIGl0LlxuICAgICh0aGlzLnRlc3RNb2R1bGVSZWYuaW5qZWN0b3IuZ2V0KEFwcGxpY2F0aW9uSW5pdFN0YXR1cykgYXMgYW55KS5ydW5Jbml0aWFsaXplcnMoKTtcblxuICAgIHJldHVybiB0aGlzLnRlc3RNb2R1bGVSZWY7XG4gIH1cblxuICAvKipcbiAgICogQGludGVybmFsXG4gICAqL1xuICBfY29tcGlsZU5nTW9kdWxlU3luYyhtb2R1bGVUeXBlOiBUeXBlPGFueT4pOiB2b2lkIHtcbiAgICB0aGlzLnF1ZXVlVHlwZXNGcm9tTW9kdWxlc0FycmF5KFttb2R1bGVUeXBlXSk7XG4gICAgdGhpcy5jb21waWxlVHlwZXNTeW5jKCk7XG4gICAgdGhpcy5hcHBseVByb3ZpZGVyT3ZlcnJpZGVzKCk7XG4gICAgdGhpcy5hcHBseVByb3ZpZGVyT3ZlcnJpZGVzVG9Nb2R1bGUobW9kdWxlVHlwZSk7XG4gICAgdGhpcy5hcHBseVRyYW5zaXRpdmVTY29wZXMoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIGFzeW5jIF9jb21waWxlTmdNb2R1bGVBc3luYyhtb2R1bGVUeXBlOiBUeXBlPGFueT4pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0aGlzLnF1ZXVlVHlwZXNGcm9tTW9kdWxlc0FycmF5KFttb2R1bGVUeXBlXSk7XG4gICAgYXdhaXQgdGhpcy5jb21waWxlQ29tcG9uZW50cygpO1xuICAgIHRoaXMuYXBwbHlQcm92aWRlck92ZXJyaWRlcygpO1xuICAgIHRoaXMuYXBwbHlQcm92aWRlck92ZXJyaWRlc1RvTW9kdWxlKG1vZHVsZVR5cGUpO1xuICAgIHRoaXMuYXBwbHlUcmFuc2l0aXZlU2NvcGVzKCk7XG4gIH1cblxuICAvKipcbiAgICogQGludGVybmFsXG4gICAqL1xuICBfZ2V0TW9kdWxlUmVzb2x2ZXIoKTogUmVzb2x2ZXI8TmdNb2R1bGU+IHsgcmV0dXJuIHRoaXMucmVzb2x2ZXJzLm1vZHVsZTsgfVxuXG4gIC8qKlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIF9nZXRDb21wb25lbnRGYWN0b3JpZXMobW9kdWxlVHlwZTogTmdNb2R1bGVUeXBlKTogQ29tcG9uZW50RmFjdG9yeTxhbnk+W10ge1xuICAgIHJldHVybiBtYXliZVVud3JhcEZuKG1vZHVsZVR5cGUubmdNb2R1bGVEZWYuZGVjbGFyYXRpb25zKS5yZWR1Y2UoKGZhY3RvcmllcywgZGVjbGFyYXRpb24pID0+IHtcbiAgICAgIGNvbnN0IGNvbXBvbmVudERlZiA9IChkZWNsYXJhdGlvbiBhcyBhbnkpLm5nQ29tcG9uZW50RGVmO1xuICAgICAgY29tcG9uZW50RGVmICYmIGZhY3Rvcmllcy5wdXNoKG5ldyBDb21wb25lbnRGYWN0b3J5KGNvbXBvbmVudERlZiwgdGhpcy50ZXN0TW9kdWxlUmVmICEpKTtcbiAgICAgIHJldHVybiBmYWN0b3JpZXM7XG4gICAgfSwgW10gYXMgQ29tcG9uZW50RmFjdG9yeTxhbnk+W10pO1xuICB9XG5cbiAgcHJpdmF0ZSBjb21waWxlVHlwZXNTeW5jKCk6IGJvb2xlYW4ge1xuICAgIC8vIENvbXBpbGUgYWxsIHF1ZXVlZCBjb21wb25lbnRzLCBkaXJlY3RpdmVzLCBwaXBlcy5cbiAgICBsZXQgbmVlZHNBc3luY1Jlc291cmNlcyA9IGZhbHNlO1xuICAgIHRoaXMucGVuZGluZ0NvbXBvbmVudHMuZm9yRWFjaChkZWNsYXJhdGlvbiA9PiB7XG4gICAgICBuZWVkc0FzeW5jUmVzb3VyY2VzID0gbmVlZHNBc3luY1Jlc291cmNlcyB8fCBpc0NvbXBvbmVudERlZlBlbmRpbmdSZXNvbHV0aW9uKGRlY2xhcmF0aW9uKTtcbiAgICAgIGNvbnN0IG1ldGFkYXRhID0gdGhpcy5yZXNvbHZlcnMuY29tcG9uZW50LnJlc29sdmUoZGVjbGFyYXRpb24pICE7XG4gICAgICB0aGlzLm1heWJlU3RvcmVOZ0RlZihOR19DT01QT05FTlRfREVGLCBkZWNsYXJhdGlvbik7XG4gICAgICBjb21waWxlQ29tcG9uZW50KGRlY2xhcmF0aW9uLCBtZXRhZGF0YSk7XG4gICAgfSk7XG4gICAgdGhpcy5wZW5kaW5nQ29tcG9uZW50cy5jbGVhcigpO1xuXG4gICAgdGhpcy5wZW5kaW5nRGlyZWN0aXZlcy5mb3JFYWNoKGRlY2xhcmF0aW9uID0+IHtcbiAgICAgIGNvbnN0IG1ldGFkYXRhID0gdGhpcy5yZXNvbHZlcnMuZGlyZWN0aXZlLnJlc29sdmUoZGVjbGFyYXRpb24pICE7XG4gICAgICB0aGlzLm1heWJlU3RvcmVOZ0RlZihOR19ESVJFQ1RJVkVfREVGLCBkZWNsYXJhdGlvbik7XG4gICAgICBjb21waWxlRGlyZWN0aXZlKGRlY2xhcmF0aW9uLCBtZXRhZGF0YSk7XG4gICAgfSk7XG4gICAgdGhpcy5wZW5kaW5nRGlyZWN0aXZlcy5jbGVhcigpO1xuXG4gICAgdGhpcy5wZW5kaW5nUGlwZXMuZm9yRWFjaChkZWNsYXJhdGlvbiA9PiB7XG4gICAgICBjb25zdCBtZXRhZGF0YSA9IHRoaXMucmVzb2x2ZXJzLnBpcGUucmVzb2x2ZShkZWNsYXJhdGlvbikgITtcbiAgICAgIHRoaXMubWF5YmVTdG9yZU5nRGVmKE5HX1BJUEVfREVGLCBkZWNsYXJhdGlvbik7XG4gICAgICBjb21waWxlUGlwZShkZWNsYXJhdGlvbiwgbWV0YWRhdGEpO1xuICAgIH0pO1xuICAgIHRoaXMucGVuZGluZ1BpcGVzLmNsZWFyKCk7XG5cbiAgICByZXR1cm4gbmVlZHNBc3luY1Jlc291cmNlcztcbiAgfVxuXG4gIHByaXZhdGUgYXBwbHlUcmFuc2l0aXZlU2NvcGVzKCk6IHZvaWQge1xuICAgIGNvbnN0IG1vZHVsZVRvU2NvcGUgPSBuZXcgTWFwPFR5cGU8YW55PnxURVNUSU5HX01PRFVMRSwgTmdNb2R1bGVUcmFuc2l0aXZlU2NvcGVzPigpO1xuICAgIGNvbnN0IGdldFNjb3BlT2ZNb2R1bGUgPSAobW9kdWxlVHlwZTogVHlwZTxhbnk+fCBURVNUSU5HX01PRFVMRSk6IE5nTW9kdWxlVHJhbnNpdGl2ZVNjb3BlcyA9PiB7XG4gICAgICBpZiAoIW1vZHVsZVRvU2NvcGUuaGFzKG1vZHVsZVR5cGUpKSB7XG4gICAgICAgIGNvbnN0IHJlYWxUeXBlID0gbW9kdWxlVHlwZSA9PT0gVEVTVElOR19NT0RVTEUgPyB0aGlzLnRlc3RNb2R1bGVUeXBlIDogbW9kdWxlVHlwZTtcbiAgICAgICAgbW9kdWxlVG9TY29wZS5zZXQobW9kdWxlVHlwZSwgdHJhbnNpdGl2ZVNjb3Blc0ZvcihyZWFsVHlwZSkpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIG1vZHVsZVRvU2NvcGUuZ2V0KG1vZHVsZVR5cGUpICE7XG4gICAgfTtcblxuICAgIHRoaXMuY29tcG9uZW50VG9Nb2R1bGVTY29wZS5mb3JFYWNoKChtb2R1bGVUeXBlLCBjb21wb25lbnRUeXBlKSA9PiB7XG4gICAgICBjb25zdCBtb2R1bGVTY29wZSA9IGdldFNjb3BlT2ZNb2R1bGUobW9kdWxlVHlwZSk7XG4gICAgICB0aGlzLnN0b3JlRmllbGRPZkRlZk9uVHlwZShjb21wb25lbnRUeXBlLCBOR19DT01QT05FTlRfREVGLCAnZGlyZWN0aXZlRGVmcycpO1xuICAgICAgdGhpcy5zdG9yZUZpZWxkT2ZEZWZPblR5cGUoY29tcG9uZW50VHlwZSwgTkdfQ09NUE9ORU5UX0RFRiwgJ3BpcGVEZWZzJyk7XG4gICAgICBwYXRjaENvbXBvbmVudERlZldpdGhTY29wZSgoY29tcG9uZW50VHlwZSBhcyBhbnkpLm5nQ29tcG9uZW50RGVmLCBtb2R1bGVTY29wZSk7XG4gICAgfSk7XG5cbiAgICB0aGlzLmNvbXBvbmVudFRvTW9kdWxlU2NvcGUuY2xlYXIoKTtcbiAgfVxuXG4gIHByaXZhdGUgYXBwbHlQcm92aWRlck92ZXJyaWRlcygpOiB2b2lkIHtcbiAgICBjb25zdCBtYXliZUFwcGx5T3ZlcnJpZGVzID0gKGZpZWxkOiBzdHJpbmcpID0+ICh0eXBlOiBUeXBlPGFueT4pID0+IHtcbiAgICAgIGNvbnN0IHJlc29sdmVyID1cbiAgICAgICAgICBmaWVsZCA9PT0gTkdfQ09NUE9ORU5UX0RFRiA/IHRoaXMucmVzb2x2ZXJzLmNvbXBvbmVudCA6IHRoaXMucmVzb2x2ZXJzLmRpcmVjdGl2ZTtcbiAgICAgIGNvbnN0IG1ldGFkYXRhID0gcmVzb2x2ZXIucmVzb2x2ZSh0eXBlKSAhO1xuICAgICAgaWYgKHRoaXMuaGFzUHJvdmlkZXJPdmVycmlkZXMobWV0YWRhdGEucHJvdmlkZXJzKSkge1xuICAgICAgICB0aGlzLnBhdGNoRGVmV2l0aFByb3ZpZGVyT3ZlcnJpZGVzKHR5cGUsIGZpZWxkKTtcbiAgICAgIH1cbiAgICB9O1xuICAgIHRoaXMuc2VlbkNvbXBvbmVudHMuZm9yRWFjaChtYXliZUFwcGx5T3ZlcnJpZGVzKE5HX0NPTVBPTkVOVF9ERUYpKTtcbiAgICB0aGlzLnNlZW5EaXJlY3RpdmVzLmZvckVhY2gobWF5YmVBcHBseU92ZXJyaWRlcyhOR19ESVJFQ1RJVkVfREVGKSk7XG5cbiAgICB0aGlzLnNlZW5Db21wb25lbnRzLmNsZWFyKCk7XG4gICAgdGhpcy5zZWVuRGlyZWN0aXZlcy5jbGVhcigpO1xuICB9XG5cbiAgcHJpdmF0ZSBhcHBseVByb3ZpZGVyT3ZlcnJpZGVzVG9Nb2R1bGUobW9kdWxlVHlwZTogVHlwZTxhbnk+KTogdm9pZCB7XG4gICAgaWYgKHRoaXMubW9kdWxlUHJvdmlkZXJzT3ZlcnJpZGRlbi5oYXMobW9kdWxlVHlwZSkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy5tb2R1bGVQcm92aWRlcnNPdmVycmlkZGVuLmFkZChtb2R1bGVUeXBlKTtcblxuICAgIGNvbnN0IGluamVjdG9yRGVmOiBhbnkgPSAobW9kdWxlVHlwZSBhcyBhbnkpW05HX0lOSkVDVE9SX0RFRl07XG4gICAgaWYgKHRoaXMucHJvdmlkZXJPdmVycmlkZXNCeVRva2VuLnNpemUgPiAwKSB7XG4gICAgICBpZiAodGhpcy5oYXNQcm92aWRlck92ZXJyaWRlcyhpbmplY3RvckRlZi5wcm92aWRlcnMpKSB7XG4gICAgICAgIHRoaXMubWF5YmVTdG9yZU5nRGVmKE5HX0lOSkVDVE9SX0RFRiwgbW9kdWxlVHlwZSk7XG5cbiAgICAgICAgdGhpcy5zdG9yZUZpZWxkT2ZEZWZPblR5cGUobW9kdWxlVHlwZSwgTkdfSU5KRUNUT1JfREVGLCAncHJvdmlkZXJzJyk7XG4gICAgICAgIGluamVjdG9yRGVmLnByb3ZpZGVycyA9IFtcbiAgICAgICAgICAuLi5pbmplY3RvckRlZi5wcm92aWRlcnMsICAvL1xuICAgICAgICAgIC4uLnRoaXMuZ2V0UHJvdmlkZXJPdmVycmlkZXMoaW5qZWN0b3JEZWYucHJvdmlkZXJzKVxuICAgICAgICBdO1xuICAgICAgfVxuXG4gICAgICAvLyBBcHBseSBwcm92aWRlciBvdmVycmlkZXMgdG8gaW1wb3J0ZWQgbW9kdWxlcyByZWN1cnNpdmVseVxuICAgICAgY29uc3QgbW9kdWxlRGVmOiBhbnkgPSAobW9kdWxlVHlwZSBhcyBhbnkpW05HX01PRFVMRV9ERUZdO1xuICAgICAgZm9yIChjb25zdCBpbXBvcnRUeXBlIG9mIG1vZHVsZURlZi5pbXBvcnRzKSB7XG4gICAgICAgIHRoaXMuYXBwbHlQcm92aWRlck92ZXJyaWRlc1RvTW9kdWxlKGltcG9ydFR5cGUpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgcGF0Y2hDb21wb25lbnRzV2l0aEV4aXN0aW5nU3R5bGVzKCk6IHZvaWQge1xuICAgIHRoaXMuZXhpc3RpbmdDb21wb25lbnRTdHlsZXMuZm9yRWFjaChcbiAgICAgICAgKHN0eWxlcywgdHlwZSkgPT4gKHR5cGUgYXMgYW55KVtOR19DT01QT05FTlRfREVGXS5zdHlsZXMgPSBzdHlsZXMpO1xuICAgIHRoaXMuZXhpc3RpbmdDb21wb25lbnRTdHlsZXMuY2xlYXIoKTtcbiAgfVxuXG4gIHByaXZhdGUgcXVldWVUeXBlQXJyYXkoYXJyOiBhbnlbXSwgbW9kdWxlVHlwZTogVHlwZTxhbnk+fFRFU1RJTkdfTU9EVUxFKTogdm9pZCB7XG4gICAgZm9yIChjb25zdCB2YWx1ZSBvZiBhcnIpIHtcbiAgICAgIGlmIChBcnJheS5pc0FycmF5KHZhbHVlKSkge1xuICAgICAgICB0aGlzLnF1ZXVlVHlwZUFycmF5KHZhbHVlLCBtb2R1bGVUeXBlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMucXVldWVUeXBlKHZhbHVlLCBtb2R1bGVUeXBlKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBwcml2YXRlIHJlY29tcGlsZU5nTW9kdWxlKG5nTW9kdWxlOiBUeXBlPGFueT4pOiB2b2lkIHtcbiAgICBjb25zdCBtZXRhZGF0YSA9IHRoaXMucmVzb2x2ZXJzLm1vZHVsZS5yZXNvbHZlKG5nTW9kdWxlKTtcbiAgICBpZiAobWV0YWRhdGEgPT09IG51bGwpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgVW5hYmxlIHRvIHJlc29sdmUgbWV0YWRhdGEgZm9yIE5nTW9kdWxlOiAke25nTW9kdWxlLm5hbWV9YCk7XG4gICAgfVxuICAgIC8vIENhY2hlIHRoZSBpbml0aWFsIG5nTW9kdWxlRGVmIGFzIGl0IHdpbGwgYmUgb3ZlcndyaXR0ZW4uXG4gICAgdGhpcy5tYXliZVN0b3JlTmdEZWYoTkdfTU9EVUxFX0RFRiwgbmdNb2R1bGUpO1xuICAgIHRoaXMubWF5YmVTdG9yZU5nRGVmKE5HX0lOSkVDVE9SX0RFRiwgbmdNb2R1bGUpO1xuXG4gICAgY29tcGlsZU5nTW9kdWxlRGVmcyhuZ01vZHVsZSBhcyBOZ01vZHVsZVR5cGU8YW55PiwgbWV0YWRhdGEpO1xuICB9XG5cbiAgcHJpdmF0ZSBxdWV1ZVR5cGUodHlwZTogVHlwZTxhbnk+LCBtb2R1bGVUeXBlOiBUeXBlPGFueT58VEVTVElOR19NT0RVTEUpOiB2b2lkIHtcbiAgICBjb25zdCBjb21wb25lbnQgPSB0aGlzLnJlc29sdmVycy5jb21wb25lbnQucmVzb2x2ZSh0eXBlKTtcbiAgICBpZiAoY29tcG9uZW50KSB7XG4gICAgICAvLyBDaGVjayB3aGV0aGVyIGEgZ2l2ZSBUeXBlIGhhcyByZXNwZWN0aXZlIE5HIGRlZiAobmdDb21wb25lbnREZWYpIGFuZCBjb21waWxlIGlmIGRlZiBpc1xuICAgICAgLy8gbWlzc2luZy4gVGhhdCBtaWdodCBoYXBwZW4gaW4gY2FzZSBhIGNsYXNzIHdpdGhvdXQgYW55IEFuZ3VsYXIgZGVjb3JhdG9ycyBleHRlbmRzIGFub3RoZXJcbiAgICAgIC8vIGNsYXNzIHdoZXJlIENvbXBvbmVudC9EaXJlY3RpdmUvUGlwZSBkZWNvcmF0b3IgaXMgZGVmaW5lZC5cbiAgICAgIGlmIChpc0NvbXBvbmVudERlZlBlbmRpbmdSZXNvbHV0aW9uKHR5cGUpIHx8ICF0eXBlLmhhc093blByb3BlcnR5KE5HX0NPTVBPTkVOVF9ERUYpKSB7XG4gICAgICAgIHRoaXMucGVuZGluZ0NvbXBvbmVudHMuYWRkKHR5cGUpO1xuICAgICAgfVxuICAgICAgdGhpcy5zZWVuQ29tcG9uZW50cy5hZGQodHlwZSk7XG5cbiAgICAgIC8vIEtlZXAgdHJhY2sgb2YgdGhlIG1vZHVsZSB3aGljaCBkZWNsYXJlcyB0aGlzIGNvbXBvbmVudCwgc28gbGF0ZXIgdGhlIGNvbXBvbmVudCdzIHNjb3BlXG4gICAgICAvLyBjYW4gYmUgc2V0IGNvcnJlY3RseS4gT25seSByZWNvcmQgdGhpcyB0aGUgZmlyc3QgdGltZSwgYmVjYXVzZSBpdCBtaWdodCBiZSBvdmVycmlkZGVuIGJ5XG4gICAgICAvLyBvdmVycmlkZVRlbXBsYXRlVXNpbmdUZXN0aW5nTW9kdWxlLlxuICAgICAgaWYgKCF0aGlzLmNvbXBvbmVudFRvTW9kdWxlU2NvcGUuaGFzKHR5cGUpKSB7XG4gICAgICAgIHRoaXMuY29tcG9uZW50VG9Nb2R1bGVTY29wZS5zZXQodHlwZSwgbW9kdWxlVHlwZSk7XG4gICAgICB9XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgZGlyZWN0aXZlID0gdGhpcy5yZXNvbHZlcnMuZGlyZWN0aXZlLnJlc29sdmUodHlwZSk7XG4gICAgaWYgKGRpcmVjdGl2ZSkge1xuICAgICAgaWYgKCF0eXBlLmhhc093blByb3BlcnR5KE5HX0RJUkVDVElWRV9ERUYpKSB7XG4gICAgICAgIHRoaXMucGVuZGluZ0RpcmVjdGl2ZXMuYWRkKHR5cGUpO1xuICAgICAgfVxuICAgICAgdGhpcy5zZWVuRGlyZWN0aXZlcy5hZGQodHlwZSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgcGlwZSA9IHRoaXMucmVzb2x2ZXJzLnBpcGUucmVzb2x2ZSh0eXBlKTtcbiAgICBpZiAocGlwZSAmJiAhdHlwZS5oYXNPd25Qcm9wZXJ0eShOR19QSVBFX0RFRikpIHtcbiAgICAgIHRoaXMucGVuZGluZ1BpcGVzLmFkZCh0eXBlKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIHF1ZXVlVHlwZXNGcm9tTW9kdWxlc0FycmF5KGFycjogYW55W10pOiB2b2lkIHtcbiAgICBmb3IgKGNvbnN0IHZhbHVlIG9mIGFycikge1xuICAgICAgaWYgKEFycmF5LmlzQXJyYXkodmFsdWUpKSB7XG4gICAgICAgIHRoaXMucXVldWVUeXBlc0Zyb21Nb2R1bGVzQXJyYXkodmFsdWUpO1xuICAgICAgfSBlbHNlIGlmIChoYXNOZ01vZHVsZURlZih2YWx1ZSkpIHtcbiAgICAgICAgY29uc3QgZGVmID0gdmFsdWUubmdNb2R1bGVEZWY7XG4gICAgICAgIC8vIExvb2sgdGhyb3VnaCBkZWNsYXJhdGlvbnMsIGltcG9ydHMsIGFuZCBleHBvcnRzLCBhbmQgcXVldWUgZXZlcnl0aGluZyBmb3VuZCB0aGVyZS5cbiAgICAgICAgdGhpcy5xdWV1ZVR5cGVBcnJheShtYXliZVVud3JhcEZuKGRlZi5kZWNsYXJhdGlvbnMpLCB2YWx1ZSk7XG4gICAgICAgIHRoaXMucXVldWVUeXBlc0Zyb21Nb2R1bGVzQXJyYXkobWF5YmVVbndyYXBGbihkZWYuaW1wb3J0cykpO1xuICAgICAgICB0aGlzLnF1ZXVlVHlwZXNGcm9tTW9kdWxlc0FycmF5KG1heWJlVW53cmFwRm4oZGVmLmV4cG9ydHMpKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBwcml2YXRlIG1heWJlU3RvcmVOZ0RlZihwcm9wOiBzdHJpbmcsIHR5cGU6IFR5cGU8YW55Pikge1xuICAgIGlmICghdGhpcy5pbml0aWFsTmdEZWZzLmhhcyh0eXBlKSkge1xuICAgICAgY29uc3QgY3VycmVudERlZiA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IodHlwZSwgcHJvcCk7XG4gICAgICB0aGlzLmluaXRpYWxOZ0RlZnMuc2V0KHR5cGUsIFtwcm9wLCBjdXJyZW50RGVmXSk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBzdG9yZUZpZWxkT2ZEZWZPblR5cGUodHlwZTogVHlwZTxhbnk+LCBkZWZGaWVsZDogc3RyaW5nLCBmaWVsZDogc3RyaW5nKTogdm9pZCB7XG4gICAgY29uc3QgZGVmOiBhbnkgPSAodHlwZSBhcyBhbnkpW2RlZkZpZWxkXTtcbiAgICBjb25zdCBvcmlnaW5hbDogYW55ID0gZGVmW2ZpZWxkXTtcbiAgICB0aGlzLmRlZkNsZWFudXBPcHMucHVzaCh7ZmllbGQsIGRlZiwgb3JpZ2luYWx9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDbGVhcnMgY3VycmVudCBjb21wb25lbnRzIHJlc29sdXRpb24gcXVldWUsIGJ1dCBzdG9yZXMgdGhlIHN0YXRlIG9mIHRoZSBxdWV1ZSwgc28gd2UgY2FuXG4gICAqIHJlc3RvcmUgaXQgbGF0ZXIuIENsZWFyaW5nIHRoZSBxdWV1ZSBpcyByZXF1aXJlZCBiZWZvcmUgd2UgdHJ5IHRvIGNvbXBpbGUgY29tcG9uZW50cyAodmlhXG4gICAqIGBUZXN0QmVkLmNvbXBpbGVDb21wb25lbnRzYCksIHNvIHRoYXQgY29tcG9uZW50IGRlZnMgYXJlIGluIHN5bmMgd2l0aCB0aGUgcmVzb2x1dGlvbiBxdWV1ZS5cbiAgICovXG4gIHByaXZhdGUgY2xlYXJDb21wb25lbnRSZXNvbHV0aW9uUXVldWUoKSB7XG4gICAgaWYgKHRoaXMub3JpZ2luYWxDb21wb25lbnRSZXNvbHV0aW9uUXVldWUgPT09IG51bGwpIHtcbiAgICAgIHRoaXMub3JpZ2luYWxDb21wb25lbnRSZXNvbHV0aW9uUXVldWUgPSBuZXcgTWFwKCk7XG4gICAgfVxuICAgIGNsZWFyUmVzb2x1dGlvbk9mQ29tcG9uZW50UmVzb3VyY2VzUXVldWUoKS5mb3JFYWNoKFxuICAgICAgICAodmFsdWUsIGtleSkgPT4gdGhpcy5vcmlnaW5hbENvbXBvbmVudFJlc29sdXRpb25RdWV1ZSAhLnNldChrZXksIHZhbHVlKSk7XG4gIH1cblxuICAvKlxuICAgKiBSZXN0b3JlcyBjb21wb25lbnQgcmVzb2x1dGlvbiBxdWV1ZSB0byB0aGUgcHJldmlvdXNseSBzYXZlZCBzdGF0ZS4gVGhpcyBvcGVyYXRpb24gaXMgcGVyZm9ybWVkXG4gICAqIGFzIGEgcGFydCBvZiByZXN0b3JpbmcgdGhlIHN0YXRlIGFmdGVyIGNvbXBsZXRpb24gb2YgdGhlIGN1cnJlbnQgc2V0IG9mIHRlc3RzICh0aGF0IG1pZ2h0XG4gICAqIHBvdGVudGlhbGx5IG11dGF0ZSB0aGUgc3RhdGUpLlxuICAgKi9cbiAgcHJpdmF0ZSByZXN0b3JlQ29tcG9uZW50UmVzb2x1dGlvblF1ZXVlKCkge1xuICAgIGlmICh0aGlzLm9yaWdpbmFsQ29tcG9uZW50UmVzb2x1dGlvblF1ZXVlICE9PSBudWxsKSB7XG4gICAgICByZXN0b3JlQ29tcG9uZW50UmVzb2x1dGlvblF1ZXVlKHRoaXMub3JpZ2luYWxDb21wb25lbnRSZXNvbHV0aW9uUXVldWUpO1xuICAgICAgdGhpcy5vcmlnaW5hbENvbXBvbmVudFJlc29sdXRpb25RdWV1ZSA9IG51bGw7XG4gICAgfVxuICB9XG5cbiAgcmVzdG9yZU9yaWdpbmFsU3RhdGUoKTogdm9pZCB7XG4gICAgZm9yIChjb25zdCBvcCBvZiB0aGlzLmRlZkNsZWFudXBPcHMpIHtcbiAgICAgIG9wLmRlZltvcC5maWVsZF0gPSBvcC5vcmlnaW5hbDtcbiAgICB9XG4gICAgLy8gUmVzdG9yZSBpbml0aWFsIGNvbXBvbmVudC9kaXJlY3RpdmUvcGlwZSBkZWZzXG4gICAgdGhpcy5pbml0aWFsTmdEZWZzLmZvckVhY2goKHZhbHVlOiBbc3RyaW5nLCBQcm9wZXJ0eURlc2NyaXB0b3JdLCB0eXBlOiBUeXBlPGFueT4pID0+IHtcbiAgICAgIGNvbnN0IFtwcm9wLCBkZXNjcmlwdG9yXSA9IHZhbHVlO1xuICAgICAgaWYgKCFkZXNjcmlwdG9yKSB7XG4gICAgICAgIC8vIERlbGV0ZSBvcGVyYXRpb25zIGFyZSBnZW5lcmFsbHkgdW5kZXNpcmFibGUgc2luY2UgdGhleSBoYXZlIHBlcmZvcm1hbmNlIGltcGxpY2F0aW9uc1xuICAgICAgICAvLyBvbiBvYmplY3RzIHRoZXkgd2VyZSBhcHBsaWVkIHRvLiBJbiB0aGlzIHBhcnRpY3VsYXIgY2FzZSwgc2l0dWF0aW9ucyB3aGVyZSB0aGlzIGNvZGUgaXNcbiAgICAgICAgLy8gaW52b2tlZCBzaG91bGQgYmUgcXVpdGUgcmFyZSB0byBjYXVzZSBhbnkgbm90aWNhYmxlIGltcGFjdCwgc2luY2UgaXQncyBhcHBsaWVkIG9ubHkgdG9cbiAgICAgICAgLy8gc29tZSB0ZXN0IGNhc2VzIChmb3IgZXhhbXBsZSB3aGVuIGNsYXNzIHdpdGggbm8gYW5ub3RhdGlvbnMgZXh0ZW5kcyBzb21lIEBDb21wb25lbnQpXG4gICAgICAgIC8vIHdoZW4gd2UgbmVlZCB0byBjbGVhciAnbmdDb21wb25lbnREZWYnIGZpZWxkIG9uIGEgZ2l2ZW4gY2xhc3MgdG8gcmVzdG9yZSBpdHMgb3JpZ2luYWxcbiAgICAgICAgLy8gc3RhdGUgKGJlZm9yZSBhcHBseWluZyBvdmVycmlkZXMgYW5kIHJ1bm5pbmcgdGVzdHMpLlxuICAgICAgICBkZWxldGUgKHR5cGUgYXMgYW55KVtwcm9wXTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0eXBlLCBwcm9wLCBkZXNjcmlwdG9yKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICB0aGlzLmluaXRpYWxOZ0RlZnMuY2xlYXIoKTtcbiAgICB0aGlzLm1vZHVsZVByb3ZpZGVyc092ZXJyaWRkZW4uY2xlYXIoKTtcbiAgICB0aGlzLnJlc3RvcmVDb21wb25lbnRSZXNvbHV0aW9uUXVldWUoKTtcbiAgfVxuXG4gIHByaXZhdGUgY29tcGlsZVRlc3RNb2R1bGUoKTogdm9pZCB7XG4gICAgY29uc3Qgcm9vdFByb3ZpZGVyT3ZlcnJpZGVzID0gdGhpcy5yb290UHJvdmlkZXJPdmVycmlkZXM7XG5cbiAgICBATmdNb2R1bGUoe1xuICAgICAgcHJvdmlkZXJzOiBbLi4ucm9vdFByb3ZpZGVyT3ZlcnJpZGVzXSxcbiAgICAgIGppdDogdHJ1ZSxcbiAgICB9KVxuICAgIGNsYXNzIFJvb3RTY29wZU1vZHVsZSB7XG4gICAgfVxuXG4gICAgQE5nTW9kdWxlKHtwcm92aWRlcnM6IFt7cHJvdmlkZTogRXJyb3JIYW5kbGVyLCB1c2VDbGFzczogUjNUZXN0RXJyb3JIYW5kbGVyfV19KVxuICAgIGNsYXNzIFIzRXJyb3JIYW5kbGVyTW9kdWxlIHtcbiAgICB9XG5cbiAgICBjb25zdCBuZ1pvbmUgPSBuZXcgTmdab25lKHtlbmFibGVMb25nU3RhY2tUcmFjZTogdHJ1ZX0pO1xuICAgIGNvbnN0IHByb3ZpZGVyczogUHJvdmlkZXJbXSA9IFtcbiAgICAgIHtwcm92aWRlOiBOZ1pvbmUsIHVzZVZhbHVlOiBuZ1pvbmV9LFxuICAgICAge3Byb3ZpZGU6IENvbXBpbGVyLCB1c2VGYWN0b3J5OiAoKSA9PiBuZXcgUjNUZXN0Q29tcGlsZXIodGhpcyl9LFxuICAgICAgLi4udGhpcy5wcm92aWRlcnMsXG4gICAgICAuLi50aGlzLnByb3ZpZGVyT3ZlcnJpZGVzLFxuICAgIF07XG4gICAgY29uc3QgaW1wb3J0cyA9XG4gICAgICAgIFtSb290U2NvcGVNb2R1bGUsIHRoaXMuYWRkaXRpb25hbE1vZHVsZVR5cGVzLCBSM0Vycm9ySGFuZGxlck1vZHVsZSwgdGhpcy5pbXBvcnRzIHx8IFtdXTtcblxuICAgIC8vIGNsYW5nLWZvcm1hdCBvZmZcbiAgICBjb21waWxlTmdNb2R1bGVEZWZzKHRoaXMudGVzdE1vZHVsZVR5cGUsIHtcbiAgICAgIGRlY2xhcmF0aW9uczogdGhpcy5kZWNsYXJhdGlvbnMsXG4gICAgICBpbXBvcnRzLFxuICAgICAgc2NoZW1hczogdGhpcy5zY2hlbWFzLFxuICAgICAgcHJvdmlkZXJzLFxuICAgIH0pO1xuICAgIC8vIGNsYW5nLWZvcm1hdCBvblxuXG4gICAgdGhpcy5hcHBseVByb3ZpZGVyT3ZlcnJpZGVzVG9Nb2R1bGUodGhpcy50ZXN0TW9kdWxlVHlwZSk7XG4gIH1cblxuICBnZXQgaW5qZWN0b3IoKTogSW5qZWN0b3Ige1xuICAgIGlmICh0aGlzLl9pbmplY3RvciAhPT0gbnVsbCkge1xuICAgICAgcmV0dXJuIHRoaXMuX2luamVjdG9yO1xuICAgIH1cblxuICAgIGNvbnN0IHByb3ZpZGVyczogUHJvdmlkZXJbXSA9IFtdO1xuICAgIGNvbnN0IGNvbXBpbGVyT3B0aW9ucyA9IHRoaXMucGxhdGZvcm0uaW5qZWN0b3IuZ2V0KENPTVBJTEVSX09QVElPTlMpO1xuICAgIGNvbXBpbGVyT3B0aW9ucy5mb3JFYWNoKG9wdHMgPT4ge1xuICAgICAgaWYgKG9wdHMucHJvdmlkZXJzKSB7XG4gICAgICAgIHByb3ZpZGVycy5wdXNoKG9wdHMucHJvdmlkZXJzKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICBpZiAodGhpcy5jb21waWxlclByb3ZpZGVycyAhPT0gbnVsbCkge1xuICAgICAgcHJvdmlkZXJzLnB1c2goLi4udGhpcy5jb21waWxlclByb3ZpZGVycyk7XG4gICAgfVxuXG4gICAgLy8gVE9ETyhvY29tYmUpOiBtYWtlIHRoaXMgd29yayB3aXRoIGFuIEluamVjdG9yIGRpcmVjdGx5IGluc3RlYWQgb2YgY3JlYXRpbmcgYSBtb2R1bGUgZm9yIGl0XG4gICAgQE5nTW9kdWxlKHtwcm92aWRlcnN9KVxuICAgIGNsYXNzIENvbXBpbGVyTW9kdWxlIHtcbiAgICB9XG5cbiAgICBjb25zdCBDb21waWxlck1vZHVsZUZhY3RvcnkgPSBuZXcgUjNOZ01vZHVsZUZhY3RvcnkoQ29tcGlsZXJNb2R1bGUpO1xuICAgIHRoaXMuX2luamVjdG9yID0gQ29tcGlsZXJNb2R1bGVGYWN0b3J5LmNyZWF0ZSh0aGlzLnBsYXRmb3JtLmluamVjdG9yKS5pbmplY3RvcjtcbiAgICByZXR1cm4gdGhpcy5faW5qZWN0b3I7XG4gIH1cblxuICAvLyBnZXQgb3ZlcnJpZGVzIGZvciBhIHNwZWNpZmljIHByb3ZpZGVyIChpZiBhbnkpXG4gIHByaXZhdGUgZ2V0U2luZ2xlUHJvdmlkZXJPdmVycmlkZXMocHJvdmlkZXI6IFByb3ZpZGVyJntwcm92aWRlPzogYW55fSk6IFByb3ZpZGVyW10ge1xuICAgIGNvbnN0IHRva2VuID0gcHJvdmlkZXIgJiYgdHlwZW9mIHByb3ZpZGVyID09PSAnb2JqZWN0JyAmJiBwcm92aWRlci5oYXNPd25Qcm9wZXJ0eSgncHJvdmlkZScpID9cbiAgICAgICAgcHJvdmlkZXIucHJvdmlkZSA6XG4gICAgICAgIHByb3ZpZGVyO1xuICAgIHJldHVybiB0aGlzLnByb3ZpZGVyT3ZlcnJpZGVzQnlUb2tlbi5nZXQodG9rZW4pIHx8IFtdO1xuICB9XG5cbiAgcHJpdmF0ZSBnZXRQcm92aWRlck92ZXJyaWRlcyhwcm92aWRlcnM/OiBQcm92aWRlcltdKTogUHJvdmlkZXJbXSB7XG4gICAgaWYgKCFwcm92aWRlcnMgfHwgIXByb3ZpZGVycy5sZW5ndGggfHwgdGhpcy5wcm92aWRlck92ZXJyaWRlc0J5VG9rZW4uc2l6ZSA9PT0gMCkgcmV0dXJuIFtdO1xuICAgIC8vIFRoZXJlIGFyZSB0d28gZmxhdHRlbmluZyBvcGVyYXRpb25zIGhlcmUuIFRoZSBpbm5lciBmbGF0dGVuKCkgb3BlcmF0ZXMgb24gdGhlIG1ldGFkYXRhJ3NcbiAgICAvLyBwcm92aWRlcnMgYW5kIGFwcGxpZXMgYSBtYXBwaW5nIGZ1bmN0aW9uIHdoaWNoIHJldHJpZXZlcyBvdmVycmlkZXMgZm9yIGVhY2ggaW5jb21pbmdcbiAgICAvLyBwcm92aWRlci4gVGhlIG91dGVyIGZsYXR0ZW4oKSB0aGVuIGZsYXR0ZW5zIHRoZSBwcm9kdWNlZCBvdmVycmlkZXMgYXJyYXkuIElmIHRoaXMgaXMgbm90XG4gICAgLy8gZG9uZSwgdGhlIGFycmF5IGNhbiBjb250YWluIG90aGVyIGVtcHR5IGFycmF5cyAoZS5nLiBgW1tdLCBbXV1gKSB3aGljaCBsZWFrIGludG8gdGhlXG4gICAgLy8gcHJvdmlkZXJzIGFycmF5IGFuZCBjb250YW1pbmF0ZSBhbnkgZXJyb3IgbWVzc2FnZXMgdGhhdCBtaWdodCBiZSBnZW5lcmF0ZWQuXG4gICAgcmV0dXJuIGZsYXR0ZW4oXG4gICAgICAgIGZsYXR0ZW4ocHJvdmlkZXJzLCAocHJvdmlkZXI6IFByb3ZpZGVyKSA9PiB0aGlzLmdldFNpbmdsZVByb3ZpZGVyT3ZlcnJpZGVzKHByb3ZpZGVyKSkpO1xuICB9XG5cbiAgcHJpdmF0ZSBoYXNQcm92aWRlck92ZXJyaWRlcyhwcm92aWRlcnM/OiBQcm92aWRlcltdKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0UHJvdmlkZXJPdmVycmlkZXMocHJvdmlkZXJzKS5sZW5ndGggPiAwO1xuICB9XG5cbiAgcHJpdmF0ZSBwYXRjaERlZldpdGhQcm92aWRlck92ZXJyaWRlcyhkZWNsYXJhdGlvbjogVHlwZTxhbnk+LCBmaWVsZDogc3RyaW5nKTogdm9pZCB7XG4gICAgY29uc3QgZGVmID0gKGRlY2xhcmF0aW9uIGFzIGFueSlbZmllbGRdO1xuICAgIGlmIChkZWYgJiYgZGVmLnByb3ZpZGVyc1Jlc29sdmVyKSB7XG4gICAgICB0aGlzLm1heWJlU3RvcmVOZ0RlZihmaWVsZCwgZGVjbGFyYXRpb24pO1xuXG4gICAgICBjb25zdCByZXNvbHZlciA9IGRlZi5wcm92aWRlcnNSZXNvbHZlcjtcbiAgICAgIGNvbnN0IHByb2Nlc3NQcm92aWRlcnNGbiA9IChwcm92aWRlcnM6IFByb3ZpZGVyW10pID0+IHtcbiAgICAgICAgY29uc3Qgb3ZlcnJpZGVzID0gdGhpcy5nZXRQcm92aWRlck92ZXJyaWRlcyhwcm92aWRlcnMpO1xuICAgICAgICByZXR1cm4gWy4uLnByb3ZpZGVycywgLi4ub3ZlcnJpZGVzXTtcbiAgICAgIH07XG4gICAgICB0aGlzLnN0b3JlRmllbGRPZkRlZk9uVHlwZShkZWNsYXJhdGlvbiwgZmllbGQsICdwcm92aWRlcnNSZXNvbHZlcicpO1xuICAgICAgZGVmLnByb3ZpZGVyc1Jlc29sdmVyID0gKG5nRGVmOiBEaXJlY3RpdmVEZWY8YW55PikgPT4gcmVzb2x2ZXIobmdEZWYsIHByb2Nlc3NQcm92aWRlcnNGbik7XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIGluaXRSZXNvbHZlcnMoKTogUmVzb2x2ZXJzIHtcbiAgcmV0dXJuIHtcbiAgICBtb2R1bGU6IG5ldyBOZ01vZHVsZVJlc29sdmVyKCksXG4gICAgY29tcG9uZW50OiBuZXcgQ29tcG9uZW50UmVzb2x2ZXIoKSxcbiAgICBkaXJlY3RpdmU6IG5ldyBEaXJlY3RpdmVSZXNvbHZlcigpLFxuICAgIHBpcGU6IG5ldyBQaXBlUmVzb2x2ZXIoKVxuICB9O1xufVxuXG5mdW5jdGlvbiBoYXNOZ01vZHVsZURlZjxUPih2YWx1ZTogVHlwZTxUPik6IHZhbHVlIGlzIE5nTW9kdWxlVHlwZTxUPiB7XG4gIHJldHVybiB2YWx1ZS5oYXNPd25Qcm9wZXJ0eSgnbmdNb2R1bGVEZWYnKTtcbn1cblxuZnVuY3Rpb24gbWF5YmVVbndyYXBGbjxUPihtYXliZUZuOiAoKCkgPT4gVCkgfCBUKTogVCB7XG4gIHJldHVybiBtYXliZUZuIGluc3RhbmNlb2YgRnVuY3Rpb24gPyBtYXliZUZuKCkgOiBtYXliZUZuO1xufVxuXG5mdW5jdGlvbiBmbGF0dGVuPFQ+KHZhbHVlczogYW55W10sIG1hcEZuPzogKHZhbHVlOiBUKSA9PiBhbnkpOiBUW10ge1xuICBjb25zdCBvdXQ6IFRbXSA9IFtdO1xuICB2YWx1ZXMuZm9yRWFjaCh2YWx1ZSA9PiB7XG4gICAgaWYgKEFycmF5LmlzQXJyYXkodmFsdWUpKSB7XG4gICAgICBvdXQucHVzaCguLi5mbGF0dGVuPFQ+KHZhbHVlLCBtYXBGbikpO1xuICAgIH0gZWxzZSB7XG4gICAgICBvdXQucHVzaChtYXBGbiA/IG1hcEZuKHZhbHVlKSA6IHZhbHVlKTtcbiAgICB9XG4gIH0pO1xuICByZXR1cm4gb3V0O1xufVxuXG4vKiogRXJyb3IgaGFuZGxlciB1c2VkIGZvciB0ZXN0cy4gUmV0aHJvd3MgZXJyb3JzIHJhdGhlciB0aGFuIGxvZ2dpbmcgdGhlbSBvdXQuICovXG5jbGFzcyBSM1Rlc3RFcnJvckhhbmRsZXIgZXh0ZW5kcyBFcnJvckhhbmRsZXIge1xuICBoYW5kbGVFcnJvcihlcnJvcjogYW55KSB7IHRocm93IGVycm9yOyB9XG59XG5cbmNsYXNzIFIzVGVzdENvbXBpbGVyIGltcGxlbWVudHMgQ29tcGlsZXIge1xuICBjb25zdHJ1Y3Rvcihwcml2YXRlIHRlc3RCZWQ6IFIzVGVzdEJlZENvbXBpbGVyKSB7fVxuXG4gIGNvbXBpbGVNb2R1bGVTeW5jPFQ+KG1vZHVsZVR5cGU6IFR5cGU8VD4pOiBOZ01vZHVsZUZhY3Rvcnk8VD4ge1xuICAgIHRoaXMudGVzdEJlZC5fY29tcGlsZU5nTW9kdWxlU3luYyhtb2R1bGVUeXBlKTtcbiAgICByZXR1cm4gbmV3IFIzTmdNb2R1bGVGYWN0b3J5KG1vZHVsZVR5cGUpO1xuICB9XG5cbiAgYXN5bmMgY29tcGlsZU1vZHVsZUFzeW5jPFQ+KG1vZHVsZVR5cGU6IFR5cGU8VD4pOiBQcm9taXNlPE5nTW9kdWxlRmFjdG9yeTxUPj4ge1xuICAgIGF3YWl0IHRoaXMudGVzdEJlZC5fY29tcGlsZU5nTW9kdWxlQXN5bmMobW9kdWxlVHlwZSk7XG4gICAgcmV0dXJuIG5ldyBSM05nTW9kdWxlRmFjdG9yeShtb2R1bGVUeXBlKTtcbiAgfVxuXG4gIGNvbXBpbGVNb2R1bGVBbmRBbGxDb21wb25lbnRzU3luYzxUPihtb2R1bGVUeXBlOiBUeXBlPFQ+KTogTW9kdWxlV2l0aENvbXBvbmVudEZhY3RvcmllczxUPiB7XG4gICAgY29uc3QgbmdNb2R1bGVGYWN0b3J5ID0gdGhpcy5jb21waWxlTW9kdWxlU3luYyhtb2R1bGVUeXBlKTtcbiAgICBjb25zdCBjb21wb25lbnRGYWN0b3JpZXMgPSB0aGlzLnRlc3RCZWQuX2dldENvbXBvbmVudEZhY3Rvcmllcyhtb2R1bGVUeXBlIGFzIE5nTW9kdWxlVHlwZTxUPik7XG4gICAgcmV0dXJuIG5ldyBNb2R1bGVXaXRoQ29tcG9uZW50RmFjdG9yaWVzKG5nTW9kdWxlRmFjdG9yeSwgY29tcG9uZW50RmFjdG9yaWVzKTtcbiAgfVxuXG4gIGFzeW5jIGNvbXBpbGVNb2R1bGVBbmRBbGxDb21wb25lbnRzQXN5bmM8VD4obW9kdWxlVHlwZTogVHlwZTxUPik6XG4gICAgICBQcm9taXNlPE1vZHVsZVdpdGhDb21wb25lbnRGYWN0b3JpZXM8VD4+IHtcbiAgICBjb25zdCBuZ01vZHVsZUZhY3RvcnkgPSBhd2FpdCB0aGlzLmNvbXBpbGVNb2R1bGVBc3luYyhtb2R1bGVUeXBlKTtcbiAgICBjb25zdCBjb21wb25lbnRGYWN0b3JpZXMgPSB0aGlzLnRlc3RCZWQuX2dldENvbXBvbmVudEZhY3Rvcmllcyhtb2R1bGVUeXBlIGFzIE5nTW9kdWxlVHlwZTxUPik7XG4gICAgcmV0dXJuIG5ldyBNb2R1bGVXaXRoQ29tcG9uZW50RmFjdG9yaWVzKG5nTW9kdWxlRmFjdG9yeSwgY29tcG9uZW50RmFjdG9yaWVzKTtcbiAgfVxuXG4gIGNsZWFyQ2FjaGUoKTogdm9pZCB7fVxuXG4gIGNsZWFyQ2FjaGVGb3IodHlwZTogVHlwZTxhbnk+KTogdm9pZCB7fVxuXG4gIGdldE1vZHVsZUlkKG1vZHVsZVR5cGU6IFR5cGU8YW55Pik6IHN0cmluZ3x1bmRlZmluZWQge1xuICAgIGNvbnN0IG1ldGEgPSB0aGlzLnRlc3RCZWQuX2dldE1vZHVsZVJlc29sdmVyKCkucmVzb2x2ZShtb2R1bGVUeXBlKTtcbiAgICByZXR1cm4gbWV0YSAmJiBtZXRhLmlkIHx8IHVuZGVmaW5lZDtcbiAgfVxufSJdfQ==