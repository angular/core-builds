/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { stringify } from '../util';
import { resolveForwardRef } from './forward_ref';
import { InjectionToken } from './injection_token';
import { INJECTOR, NullInjector, THROW_IF_NOT_FOUND, USE_VALUE, inject, injectArgs, setCurrentInjector } from './injector';
import { APP_ROOT } from './scope';
/**
 * Marker which indicates that a value has not yet been created from the factory function.
 */
const /** @type {?} */ NOT_YET = {};
/**
 * Marker which indicates that the factory function for a token is in the process of being called.
 *
 * If the injector is asked to inject a token with its value set to CIRCULAR, that indicates
 * injection of a dependency has recursively attempted to inject the original token, and there is
 * a circular dependency among the providers.
 */
const /** @type {?} */ CIRCULAR = {};
const /** @type {?} */ EMPTY_ARRAY = /** @type {?} */ ([]);
/**
 * A lazily initialized NullInjector.
 */
let /** @type {?} */ NULL_INJECTOR = undefined;
/**
 * @return {?}
 */
function getNullInjector() {
    if (NULL_INJECTOR === undefined) {
        NULL_INJECTOR = new NullInjector();
    }
    return NULL_INJECTOR;
}
/**
 * An entry in the injector which tracks information about the given token, including a possible
 * current value.
 * @record
 * @template T
 */
function Record() { }
function Record_tsickle_Closure_declarations() {
    /** @type {?} */
    Record.prototype.factory;
    /** @type {?} */
    Record.prototype.value;
    /** @type {?} */
    Record.prototype.multi;
}
/**
 * Create a new `Injector` which is configured using `InjectorType`s.
 *
 * \@experimental
 * @param {?} defType
 * @param {?=} parent
 * @return {?}
 */
export function createInjector(defType, parent = null) {
    parent = parent || getNullInjector();
    return new R3Injector(defType, parent);
}
export class R3Injector {
    /**
     * @param {?} def
     * @param {?} parent
     */
    constructor(def, parent) {
        this.parent = parent;
        /**
         * Map of tokens to records which contain the instances of those tokens.
         */
        this.records = new Map();
        /**
         * The transitive set of `InjectorType`s which define this injector.
         */
        this.injectorDefTypes = new Set();
        /**
         * Set of values instantiated by this injector which contain `ngOnDestroy` lifecycle hooks.
         */
        this.onDestroy = new Set();
        /**
         * Flag indicating that this injector was previously destroyed.
         */
        this.destroyed = false;
        // Start off by creating Records for every provider declared in every InjectorType
        // included transitively in `def`.
        deepForEach([def], injectorDef => this.processInjectorType(injectorDef, new Set()));
        // Make sure the INJECTOR token provides this injector.
        this.records.set(INJECTOR, makeRecord(undefined, this));
        // Detect whether this injector has the APP_ROOT_SCOPE token and thus should provide
        // any injectable scoped to APP_ROOT_SCOPE.
        this.isRootInjector = this.records.has(APP_ROOT);
        // Eagerly instantiate the InjectorType classes themselves.
        this.injectorDefTypes.forEach(defType => this.get(defType));
    }
    /**
     * Destroy the injector and release references to every instance or provider associated with it.
     *
     * Also calls the `OnDestroy` lifecycle hooks of every instance that was created for which a
     * hook was found.
     * @return {?}
     */
    destroy() {
        this.assertNotDestroyed();
        // Set destroyed = true first, in case lifecycle hooks re-enter destroy().
        this.destroyed = true;
        try {
            // Call all the lifecycle hooks.
            this.onDestroy.forEach(service => service.ngOnDestroy());
        }
        finally {
            // Release all references.
            this.records.clear();
            this.onDestroy.clear();
            this.injectorDefTypes.clear();
        }
    }
    /**
     * @template T
     * @param {?} token
     * @param {?=} notFoundValue
     * @param {?=} flags
     * @return {?}
     */
    get(token, notFoundValue = THROW_IF_NOT_FOUND, flags = 0 /* Default */) {
        this.assertNotDestroyed();
        // Set the injection context.
        const /** @type {?} */ previousInjector = setCurrentInjector(this);
        try {
            // Check for the SkipSelf flag.
            if (!(flags & 4 /* SkipSelf */)) {
                // SkipSelf isn't set, check if the record belongs to this injector.
                let /** @type {?} */ record = this.records.get(token);
                if (record === undefined) {
                    // No record, but maybe the token is scoped to this injector. Look for an ngInjectableDef
                    // with a scope matching this injector.
                    const /** @type {?} */ def = couldBeInjectableType(token) &&
                        (/** @type {?} */ (token)).ngInjectableDef ||
                        undefined;
                    if (def !== undefined && this.injectableDefInScope(def)) {
                        // Found an ngInjectableDef and it's scoped to this injector. Pretend as if it was here
                        // all along.
                        record = injectableDefRecord(token);
                        this.records.set(token, record);
                    }
                }
                // If a record was found, get the instance for it and return it.
                if (record !== undefined) {
                    return this.hydrate(token, record);
                }
            }
            // Select the next injector based on the Self flag - if self is set, the next injector is
            // the NullInjector, otherwise it's the parent.
            let /** @type {?} */ next = !(flags & 2 /* Self */) ? this.parent : getNullInjector();
            return this.parent.get(token, notFoundValue);
        }
        finally {
            // Lastly, clean up the state by restoring the previous injector.
            setCurrentInjector(previousInjector);
        }
    }
    /**
     * @return {?}
     */
    assertNotDestroyed() {
        if (this.destroyed) {
            throw new Error('Injector has already been destroyed.');
        }
    }
    /**
     * Add an `InjectorType` or `InjectorDefTypeWithProviders` and all of its transitive providers
     * to this injector.
     * @param {?} defOrWrappedDef
     * @param {?} parents
     * @return {?}
     */
    processInjectorType(defOrWrappedDef, parents) {
        defOrWrappedDef = resolveForwardRef(defOrWrappedDef);
        // Either the defOrWrappedDef is an InjectorType (with ngInjectorDef) or an
        // InjectorDefTypeWithProviders (aka ModuleWithProviders). Detecting either is a megamorphic
        // read, so care is taken to only do the read once.
        // First attempt to read the ngInjectorDef.
        let /** @type {?} */ def = /** @type {?} */ ((/** @type {?} */ (defOrWrappedDef)).ngInjectorDef);
        // If that's not present, then attempt to read ngModule from the InjectorDefTypeWithProviders.
        const /** @type {?} */ ngModule = (def == null) && (/** @type {?} */ (defOrWrappedDef)).ngModule || undefined;
        // Determine the InjectorType. In the case where `defOrWrappedDef` is an `InjectorType`,
        // then this is easy. In the case of an InjectorDefTypeWithProviders, then the definition type
        // is the `ngModule`.
        const /** @type {?} */ defType = (ngModule === undefined) ? (/** @type {?} */ (defOrWrappedDef)) : ngModule;
        // If defOrWrappedType was an InjectorDefTypeWithProviders, then .providers may hold some
        // extra providers.
        const /** @type {?} */ providers = (ngModule !== undefined) && (/** @type {?} */ (defOrWrappedDef)).providers ||
            EMPTY_ARRAY;
        // Finally, if defOrWrappedType was an `InjectorDefTypeWithProviders`, then the actual
        // `InjectorDef` is on its `ngModule`.
        if (ngModule !== undefined) {
            def = ngModule.ngInjectorDef;
        }
        // If no definition was found, throw.
        if (def == null) {
            throw new Error(`Type ${stringify(defType)} is missing an ngInjectorDef definition.`);
        }
        // Check for circular dependencies.
        if (parents.has(defType)) {
            throw new Error(`Circular dependency: type ${stringify(defType)} ends up importing itself.`);
        }
        // Track the InjectorType and add a provider for it.
        this.injectorDefTypes.add(defType);
        this.records.set(defType, makeRecord(def.factory));
        // Add providers in the same way that @NgModule resolution did:
        // First, include providers from any imports.
        if (def.imports != null) {
            // Before processing defType's imports, add it to the set of parents. This way, if it ends
            // up deeply importing itself, this can be detected.
            parents.add(defType);
            try {
                deepForEach(def.imports, imported => this.processInjectorType(imported, parents));
            }
            finally {
                // Remove it from the parents set when finished.
                parents.delete(defType);
            }
        }
        // Next, include providers listed on the definition itself.
        if (def.providers != null) {
            deepForEach(def.providers, provider => this.processProvider(provider));
        }
        // Finally, include providers from an InjectorDefTypeWithProviders if there was one.
        deepForEach(providers, provider => this.processProvider(provider));
    }
    /**
     * Process a `SingleProvider` and add it.
     * @param {?} provider
     * @return {?}
     */
    processProvider(provider) {
        // Determine the token from the provider. Either it's its own token, or has a {provide: ...}
        // property.
        provider = resolveForwardRef(provider);
        let /** @type {?} */ token = isTypeProvider(provider) ? provider : resolveForwardRef(provider.provide);
        // Construct a `Record` for the provider.
        const /** @type {?} */ record = providerToRecord(provider);
        if (!isTypeProvider(provider) && provider.multi === true) {
            // If the provider indicates that it's a multi-provider, process it specially.
            // First check whether it's been defined already.
            let /** @type {?} */ multiRecord = this.records.get(token);
            if (multiRecord) {
                // It has. Throw a nice error if
                if (multiRecord.multi === undefined) {
                    throw new Error(`Mixed multi-provider for ${token}.`);
                }
            }
            else {
                token = provider;
                multiRecord = makeRecord(undefined, NOT_YET, true);
                multiRecord.factory = () => injectArgs(/** @type {?} */ ((/** @type {?} */ ((multiRecord)).multi)));
                this.records.set(token, multiRecord);
            }
            token = provider; /** @type {?} */
            ((multiRecord.multi)).push(provider);
        }
        const /** @type {?} */ existing = this.records.get(token);
        if (existing && existing.multi !== undefined) {
            throw new Error(`Mixed multi-provider for ${token}`);
        }
        this.records.set(token, record);
    }
    /**
     * @template T
     * @param {?} token
     * @param {?} record
     * @return {?}
     */
    hydrate(token, record) {
        if (record.value === CIRCULAR) {
            throw new Error(`Circular dep for ${stringify(token)}`);
        }
        else if (record.value === NOT_YET) {
            record.value = CIRCULAR;
            record.value = /** @type {?} */ ((record.factory))();
        }
        if (typeof record.value === 'object' && record.value && hasOnDestroy(record.value)) {
            this.onDestroy.add(record.value);
        }
        return /** @type {?} */ (record.value);
    }
    /**
     * @param {?} def
     * @return {?}
     */
    injectableDefInScope(def) {
        if (!def.providedIn) {
            return false;
        }
        else if (typeof def.providedIn === 'string') {
            return def.providedIn === 'any' || (def.providedIn === 'root' && this.isRootInjector);
        }
        else {
            return this.injectorDefTypes.has(def.providedIn);
        }
    }
}
function R3Injector_tsickle_Closure_declarations() {
    /**
     * Map of tokens to records which contain the instances of those tokens.
     * @type {?}
     */
    R3Injector.prototype.records;
    /**
     * The transitive set of `InjectorType`s which define this injector.
     * @type {?}
     */
    R3Injector.prototype.injectorDefTypes;
    /**
     * Set of values instantiated by this injector which contain `ngOnDestroy` lifecycle hooks.
     * @type {?}
     */
    R3Injector.prototype.onDestroy;
    /**
     * Flag indicating this injector provides the APP_ROOT_SCOPE token, and thus counts as the
     * root scope.
     * @type {?}
     */
    R3Injector.prototype.isRootInjector;
    /**
     * Flag indicating that this injector was previously destroyed.
     * @type {?}
     */
    R3Injector.prototype.destroyed;
    /** @type {?} */
    R3Injector.prototype.parent;
}
/**
 * @param {?} token
 * @return {?}
 */
function injectableDefRecord(token) {
    const /** @type {?} */ def = /** @type {?} */ ((/** @type {?} */ (token)).ngInjectableDef);
    if (def === undefined) {
        throw new Error(`Type ${stringify(token)} is missing an ngInjectableDef definition.`);
    }
    return makeRecord(def.factory);
}
/**
 * @param {?} provider
 * @return {?}
 */
function providerToRecord(provider) {
    let /** @type {?} */ token = resolveForwardRef(provider);
    let /** @type {?} */ value = NOT_YET;
    let /** @type {?} */ factory = undefined;
    if (isTypeProvider(provider)) {
        return injectableDefRecord(provider);
    }
    else {
        token = resolveForwardRef(provider.provide);
        if (isValueProvider(provider)) {
            value = provider.useValue;
        }
        else if (isExistingProvider(provider)) {
            factory = () => inject(provider.useExisting);
        }
        else if (isFactoryProvider(provider)) {
            factory = () => provider.useFactory(...injectArgs(provider.deps || []));
        }
        else {
            const /** @type {?} */ classRef = (/** @type {?} */ (provider)).useClass || token;
            if (hasDeps(provider)) {
                factory = () => new (classRef)(...injectArgs(provider.deps));
            }
            else {
                return injectableDefRecord(classRef);
            }
        }
    }
    return makeRecord(factory, value);
}
/**
 * @template T
 * @param {?} factory
 * @param {?=} value
 * @param {?=} multi
 * @return {?}
 */
function makeRecord(factory, value = NOT_YET, multi = false) {
    return {
        factory: factory,
        value: value,
        multi: multi ? [] : undefined,
    };
}
/**
 * @template T
 * @param {?} input
 * @param {?} fn
 * @return {?}
 */
function deepForEach(input, fn) {
    input.forEach(value => Array.isArray(value) ? deepForEach(value, fn) : fn(value));
}
/**
 * @param {?} value
 * @return {?}
 */
function isValueProvider(value) {
    return USE_VALUE in value;
}
/**
 * @param {?} value
 * @return {?}
 */
function isExistingProvider(value) {
    return !!(/** @type {?} */ (value)).useExisting;
}
/**
 * @param {?} value
 * @return {?}
 */
function isFactoryProvider(value) {
    return !!(/** @type {?} */ (value)).useFactory;
}
/**
 * @param {?} value
 * @return {?}
 */
function isClassProvider(value) {
    return !!(/** @type {?} */ (value)).useClass;
}
/**
 * @param {?} value
 * @return {?}
 */
function isTypeProvider(value) {
    return typeof value === 'function';
}
/**
 * @param {?} value
 * @return {?}
 */
function hasDeps(value) {
    return !!(/** @type {?} */ (value)).deps;
}
/**
 * @param {?} value
 * @return {?}
 */
function hasOnDestroy(value) {
    return typeof value === 'object' && value != null && (/** @type {?} */ (value)).ngOnDestroy &&
        typeof (/** @type {?} */ (value)).ngOnDestroy === 'function';
}
/**
 * @param {?} value
 * @return {?}
 */
function couldBeInjectableType(value) {
    return (typeof value === 'function') ||
        (typeof value === 'object' && value instanceof InjectionToken);
}
//# sourceMappingURL=r3_injector.js.map