/**
 * @fileoverview added by tsickle
 * Generated from: packages/core/src/di/r3_injector.ts
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import '../util/ng_dev_mode';
import { getFactoryDef } from '../render3/definition';
import { throwCyclicDependencyError, throwInvalidProviderError, throwMixedMultiProviderError } from '../render3/errors';
import { deepForEach, newArray } from '../util/array_utils';
import { stringify } from '../util/stringify';
import { resolveForwardRef } from './forward_ref';
import { InjectionToken } from './injection_token';
import { INJECTOR, NG_TEMP_TOKEN_PATH, NullInjector, THROW_IF_NOT_FOUND, USE_VALUE, catchInjectorError, injectArgs, setCurrentInjector, ɵɵinject } from './injector_compatibility';
import { getInheritedInjectableDef, getInjectableDef, getInjectorDef } from './interface/defs';
import { InjectFlags } from './interface/injector';
import { INJECTOR_SCOPE } from './scope';
/**
 * Marker which indicates that a value has not yet been created from the factory function.
 * @type {?}
 */
const NOT_YET = {};
/**
 * Marker which indicates that the factory function for a token is in the process of being called.
 *
 * If the injector is asked to inject a token with its value set to CIRCULAR, that indicates
 * injection of a dependency has recursively attempted to inject the original token, and there is
 * a circular dependency among the providers.
 * @type {?}
 */
const CIRCULAR = {};
/** @type {?} */
const EMPTY_ARRAY = (/** @type {?} */ ([]));
/**
 * A lazily initialized NullInjector.
 * @type {?}
 */
let NULL_INJECTOR = undefined;
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
if (false) {
    /** @type {?} */
    Record.prototype.factory;
    /** @type {?} */
    Record.prototype.value;
    /** @type {?} */
    Record.prototype.multi;
}
/**
 * Create a new `Injector` which is configured using a `defType` of `InjectorType<any>`s.
 *
 * \@publicApi
 * @param {?} defType
 * @param {?=} parent
 * @param {?=} additionalProviders
 * @param {?=} name
 * @return {?}
 */
export function createInjector(defType, parent = null, additionalProviders = null, name) {
    parent = parent || getNullInjector();
    return new R3Injector(defType, additionalProviders, parent, name);
}
export class R3Injector {
    /**
     * @param {?} def
     * @param {?} additionalProviders
     * @param {?} parent
     * @param {?=} source
     */
    constructor(def, additionalProviders, parent, source = null) {
        this.parent = parent;
        /**
         * Map of tokens to records which contain the instances of those tokens.
         * - `null` value implies that we don't have the record. Used by tree-shakable injectors
         * to prevent further searches.
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
        this._destroyed = false;
        /** @type {?} */
        const dedupStack = [];
        // Start off by creating Records for every provider declared in every InjectorType
        // included transitively in additional providers then do the same for `def`. This order is
        // important because `def` may include providers that override ones in additionalProviders.
        additionalProviders && deepForEach(additionalProviders, (/**
         * @param {?} provider
         * @return {?}
         */
        provider => this.processProvider(provider, def, additionalProviders)));
        deepForEach([def], (/**
         * @param {?} injectorDef
         * @return {?}
         */
        injectorDef => this.processInjectorType(injectorDef, [], dedupStack)));
        // Make sure the INJECTOR token provides this injector.
        this.records.set(INJECTOR, makeRecord(undefined, this));
        // Detect whether this injector has the APP_ROOT_SCOPE token and thus should provide
        // any injectable scoped to APP_ROOT_SCOPE.
        /** @type {?} */
        const record = this.records.get(INJECTOR_SCOPE);
        this.scope = record != null ? record.value : null;
        // Eagerly instantiate the InjectorType classes themselves.
        this.injectorDefTypes.forEach((/**
         * @param {?} defType
         * @return {?}
         */
        defType => this.get(defType)));
        // Source name, used for debugging
        this.source = source || (typeof def === 'object' ? null : stringify(def));
    }
    /**
     * Flag indicating that this injector was previously destroyed.
     * @return {?}
     */
    get destroyed() { return this._destroyed; }
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
        this._destroyed = true;
        try {
            // Call all the lifecycle hooks.
            this.onDestroy.forEach((/**
             * @param {?} service
             * @return {?}
             */
            service => service.ngOnDestroy()));
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
    get(token, notFoundValue = THROW_IF_NOT_FOUND, flags = InjectFlags.Default) {
        this.assertNotDestroyed();
        // Set the injection context.
        /** @type {?} */
        const previousInjector = setCurrentInjector(this);
        try {
            // Check for the SkipSelf flag.
            if (!(flags & InjectFlags.SkipSelf)) {
                // SkipSelf isn't set, check if the record belongs to this injector.
                /** @type {?} */
                let record = this.records.get(token);
                if (record === undefined) {
                    // No record, but maybe the token is scoped to this injector. Look for an injectable
                    // def with a scope matching this injector.
                    /** @type {?} */
                    const def = couldBeInjectableType(token) && getInjectableDef(token);
                    if (def && this.injectableDefInScope(def)) {
                        // Found an injectable def and it's scoped to this injector. Pretend as if it was here
                        // all along.
                        record = makeRecord(injectableDefOrInjectorDefFactory(token), NOT_YET);
                    }
                    else {
                        record = null;
                    }
                    this.records.set(token, record);
                }
                // If a record was found, get the instance for it and return it.
                if (record != null /* NOT null || undefined */) {
                    return this.hydrate(token, record);
                }
            }
            // Select the next injector based on the Self flag - if self is set, the next injector is
            // the NullInjector, otherwise it's the parent.
            /** @type {?} */
            const nextInjector = !(flags & InjectFlags.Self) ? this.parent : getNullInjector();
            // Set the notFoundValue based on the Optional flag - if optional is set and notFoundValue
            // is undefined, the value is null, otherwise it's the notFoundValue.
            notFoundValue = (flags & InjectFlags.Optional) && notFoundValue === THROW_IF_NOT_FOUND ?
                null :
                notFoundValue;
            return nextInjector.get(token, notFoundValue);
        }
        catch (e) {
            if (e.name === 'NullInjectorError') {
                /** @type {?} */
                const path = e[NG_TEMP_TOKEN_PATH] = e[NG_TEMP_TOKEN_PATH] || [];
                path.unshift(stringify(token));
                if (previousInjector) {
                    // We still have a parent injector, keep throwing
                    throw e;
                }
                else {
                    // Format & throw the final error message when we don't have any previous injector
                    return catchInjectorError(e, token, 'R3InjectorError', this.source);
                }
            }
            else {
                throw e;
            }
        }
        finally {
            // Lastly, clean up the state by restoring the previous injector.
            setCurrentInjector(previousInjector);
        }
    }
    /**
     * @return {?}
     */
    toString() {
        /** @type {?} */
        const tokens = (/** @type {?} */ ([]));
        /** @type {?} */
        const records = this.records;
        records.forEach((/**
         * @param {?} v
         * @param {?} token
         * @return {?}
         */
        (v, token) => tokens.push(stringify(token))));
        return `R3Injector[${tokens.join(', ')}]`;
    }
    /**
     * @private
     * @return {?}
     */
    assertNotDestroyed() {
        if (this._destroyed) {
            throw new Error('Injector has already been destroyed.');
        }
    }
    /**
     * Add an `InjectorType` or `InjectorTypeWithProviders` and all of its transitive providers
     * to this injector.
     *
     * If an `InjectorTypeWithProviders` that declares providers besides the type is specified,
     * the function will return "true" to indicate that the providers of the type definition need
     * to be processed. This allows us to process providers of injector types after all imports of
     * an injector definition are processed. (following View Engine semantics: see FW-1349)
     * @private
     * @param {?} defOrWrappedDef
     * @param {?} parents
     * @param {?} dedupStack
     * @return {?}
     */
    processInjectorType(defOrWrappedDef, parents, dedupStack) {
        defOrWrappedDef = resolveForwardRef(defOrWrappedDef);
        if (!defOrWrappedDef)
            return false;
        // Either the defOrWrappedDef is an InjectorType (with injector def) or an
        // InjectorDefTypeWithProviders (aka ModuleWithProviders). Detecting either is a megamorphic
        // read, so care is taken to only do the read once.
        // First attempt to read the injector def (`ɵinj`).
        /** @type {?} */
        let def = getInjectorDef(defOrWrappedDef);
        // If that's not present, then attempt to read ngModule from the InjectorDefTypeWithProviders.
        /** @type {?} */
        const ngModule = (def == null) && ((/** @type {?} */ (defOrWrappedDef))).ngModule || undefined;
        // Determine the InjectorType. In the case where `defOrWrappedDef` is an `InjectorType`,
        // then this is easy. In the case of an InjectorDefTypeWithProviders, then the definition type
        // is the `ngModule`.
        /** @type {?} */
        const defType = (ngModule === undefined) ? ((/** @type {?} */ (defOrWrappedDef))) : ngModule;
        // Check for circular dependencies.
        if (ngDevMode && parents.indexOf(defType) !== -1) {
            /** @type {?} */
            const defName = stringify(defType);
            throw new Error(`Circular dependency in DI detected for type ${defName}. Dependency path: ${parents.map((/**
             * @param {?} defType
             * @return {?}
             */
            defType => stringify(defType))).join(' > ')} > ${defName}.`);
        }
        // Check for multiple imports of the same module
        /** @type {?} */
        const isDuplicate = dedupStack.indexOf(defType) !== -1;
        // Finally, if defOrWrappedType was an `InjectorDefTypeWithProviders`, then the actual
        // `InjectorDef` is on its `ngModule`.
        if (ngModule !== undefined) {
            def = getInjectorDef(ngModule);
        }
        // If no definition was found, it might be from exports. Remove it.
        if (def == null) {
            return false;
        }
        // Add providers in the same way that @NgModule resolution did:
        // First, include providers from any imports.
        if (def.imports != null && !isDuplicate) {
            // Before processing defType's imports, add it to the set of parents. This way, if it ends
            // up deeply importing itself, this can be detected.
            ngDevMode && parents.push(defType);
            // Add it to the set of dedups. This way we can detect multiple imports of the same module
            dedupStack.push(defType);
            /** @type {?} */
            let importTypesWithProviders;
            try {
                deepForEach(def.imports, (/**
                 * @param {?} imported
                 * @return {?}
                 */
                imported => {
                    if (this.processInjectorType(imported, parents, dedupStack)) {
                        if (importTypesWithProviders === undefined)
                            importTypesWithProviders = [];
                        // If the processed import is an injector type with providers, we store it in the
                        // list of import types with providers, so that we can process those afterwards.
                        importTypesWithProviders.push(imported);
                    }
                }));
            }
            finally {
                // Remove it from the parents set when finished.
                ngDevMode && parents.pop();
            }
            // Imports which are declared with providers (TypeWithProviders) need to be processed
            // after all imported modules are processed. This is similar to how View Engine
            // processes/merges module imports in the metadata resolver. See: FW-1349.
            if (importTypesWithProviders !== undefined) {
                for (let i = 0; i < importTypesWithProviders.length; i++) {
                    const { ngModule, providers } = importTypesWithProviders[i];
                    deepForEach((/** @type {?} */ (providers)), (/**
                     * @param {?} provider
                     * @return {?}
                     */
                    provider => this.processProvider(provider, ngModule, providers || EMPTY_ARRAY)));
                }
            }
        }
        // Track the InjectorType and add a provider for it. It's important that this is done after the
        // def's imports.
        this.injectorDefTypes.add(defType);
        this.records.set(defType, makeRecord(def.factory, NOT_YET));
        // Next, include providers listed on the definition itself.
        /** @type {?} */
        const defProviders = def.providers;
        if (defProviders != null && !isDuplicate) {
            /** @type {?} */
            const injectorType = (/** @type {?} */ (defOrWrappedDef));
            deepForEach(defProviders, (/**
             * @param {?} provider
             * @return {?}
             */
            provider => this.processProvider(provider, injectorType, defProviders)));
        }
        return (ngModule !== undefined &&
            ((/** @type {?} */ (defOrWrappedDef))).providers !== undefined);
    }
    /**
     * Process a `SingleProvider` and add it.
     * @private
     * @param {?} provider
     * @param {?} ngModuleType
     * @param {?} providers
     * @return {?}
     */
    processProvider(provider, ngModuleType, providers) {
        // Determine the token from the provider. Either it's its own token, or has a {provide: ...}
        // property.
        provider = resolveForwardRef(provider);
        /** @type {?} */
        let token = isTypeProvider(provider) ? provider : resolveForwardRef(provider && provider.provide);
        // Construct a `Record` for the provider.
        /** @type {?} */
        const record = providerToRecord(provider, ngModuleType, providers);
        if (!isTypeProvider(provider) && provider.multi === true) {
            // If the provider indicates that it's a multi-provider, process it specially.
            // First check whether it's been defined already.
            /** @type {?} */
            let multiRecord = this.records.get(token);
            if (multiRecord) {
                // It has. Throw a nice error if
                if (multiRecord.multi === undefined) {
                    throwMixedMultiProviderError();
                }
            }
            else {
                multiRecord = makeRecord(undefined, NOT_YET, true);
                multiRecord.factory = (/**
                 * @return {?}
                 */
                () => injectArgs((/** @type {?} */ ((/** @type {?} */ (multiRecord)).multi))));
                this.records.set(token, multiRecord);
            }
            token = provider;
            (/** @type {?} */ (multiRecord.multi)).push(provider);
        }
        else {
            /** @type {?} */
            const existing = this.records.get(token);
            if (existing && existing.multi !== undefined) {
                throwMixedMultiProviderError();
            }
        }
        this.records.set(token, record);
    }
    /**
     * @private
     * @template T
     * @param {?} token
     * @param {?} record
     * @return {?}
     */
    hydrate(token, record) {
        if (record.value === CIRCULAR) {
            throwCyclicDependencyError(stringify(token));
        }
        else if (record.value === NOT_YET) {
            record.value = CIRCULAR;
            record.value = (/** @type {?} */ (record.factory))();
        }
        if (typeof record.value === 'object' && record.value && hasOnDestroy(record.value)) {
            this.onDestroy.add(record.value);
        }
        return (/** @type {?} */ (record.value));
    }
    /**
     * @private
     * @param {?} def
     * @return {?}
     */
    injectableDefInScope(def) {
        if (!def.providedIn) {
            return false;
        }
        else if (typeof def.providedIn === 'string') {
            return def.providedIn === 'any' || (def.providedIn === this.scope);
        }
        else {
            return this.injectorDefTypes.has(def.providedIn);
        }
    }
}
if (false) {
    /**
     * Map of tokens to records which contain the instances of those tokens.
     * - `null` value implies that we don't have the record. Used by tree-shakable injectors
     * to prevent further searches.
     * @type {?}
     * @private
     */
    R3Injector.prototype.records;
    /**
     * The transitive set of `InjectorType`s which define this injector.
     * @type {?}
     * @private
     */
    R3Injector.prototype.injectorDefTypes;
    /**
     * Set of values instantiated by this injector which contain `ngOnDestroy` lifecycle hooks.
     * @type {?}
     * @private
     */
    R3Injector.prototype.onDestroy;
    /**
     * Flag indicating this injector provides the APP_ROOT_SCOPE token, and thus counts as the
     * root scope.
     * @type {?}
     * @private
     */
    R3Injector.prototype.scope;
    /** @type {?} */
    R3Injector.prototype.source;
    /**
     * @type {?}
     * @private
     */
    R3Injector.prototype._destroyed;
    /** @type {?} */
    R3Injector.prototype.parent;
}
/**
 * @param {?} token
 * @return {?}
 */
function injectableDefOrInjectorDefFactory(token) {
    // Most tokens will have an injectable def directly on them, which specifies a factory directly.
    /** @type {?} */
    const injectableDef = getInjectableDef(token);
    /** @type {?} */
    const factory = injectableDef !== null ? injectableDef.factory : getFactoryDef(token);
    if (factory !== null) {
        return factory;
    }
    // If the token is an NgModule, it's also injectable but the factory is on its injector def
    // (`ɵinj`)
    /** @type {?} */
    const injectorDef = getInjectorDef(token);
    if (injectorDef !== null) {
        return injectorDef.factory;
    }
    // InjectionTokens should have an injectable def (ɵprov) and thus should be handled above.
    // If it's missing that, it's an error.
    if (token instanceof InjectionToken) {
        throw new Error(`Token ${stringify(token)} is missing a ɵprov definition.`);
    }
    // Undecorated types can sometimes be created if they have no constructor arguments.
    if (token instanceof Function) {
        return getUndecoratedInjectableFactory(token);
    }
    // There was no way to resolve a factory for this token.
    throw new Error('unreachable');
}
/**
 * @param {?} token
 * @return {?}
 */
function getUndecoratedInjectableFactory(token) {
    // If the token has parameters then it has dependencies that we cannot resolve implicitly.
    /** @type {?} */
    const paramLength = token.length;
    if (paramLength > 0) {
        /** @type {?} */
        const args = newArray(paramLength, '?');
        throw new Error(`Can't resolve all parameters for ${stringify(token)}: (${args.join(', ')}).`);
    }
    // The constructor function appears to have no parameters.
    // This might be because it inherits from a super-class. In which case, use an injectable
    // def from an ancestor if there is one.
    // Otherwise this really is a simple class with no dependencies, so return a factory that
    // just instantiates the zero-arg constructor.
    /** @type {?} */
    const inheritedInjectableDef = getInheritedInjectableDef(token);
    if (inheritedInjectableDef !== null) {
        return (/**
         * @return {?}
         */
        () => inheritedInjectableDef.factory((/** @type {?} */ (token))));
    }
    else {
        return (/**
         * @return {?}
         */
        () => new ((/** @type {?} */ (token)))());
    }
}
/**
 * @param {?} provider
 * @param {?} ngModuleType
 * @param {?} providers
 * @return {?}
 */
function providerToRecord(provider, ngModuleType, providers) {
    if (isValueProvider(provider)) {
        return makeRecord(undefined, provider.useValue);
    }
    else {
        /** @type {?} */
        const factory = providerToFactory(provider, ngModuleType, providers);
        return makeRecord(factory, NOT_YET);
    }
}
/**
 * Converts a `SingleProvider` into a factory function.
 *
 * @param {?} provider provider to convert to factory
 * @param {?=} ngModuleType
 * @param {?=} providers
 * @return {?}
 */
export function providerToFactory(provider, ngModuleType, providers) {
    /** @type {?} */
    let factory = undefined;
    if (isTypeProvider(provider)) {
        /** @type {?} */
        const unwrappedProvider = resolveForwardRef(provider);
        return getFactoryDef(unwrappedProvider) || injectableDefOrInjectorDefFactory(unwrappedProvider);
    }
    else {
        if (isValueProvider(provider)) {
            factory = (/**
             * @return {?}
             */
            () => resolveForwardRef(provider.useValue));
        }
        else if (isFactoryProvider(provider)) {
            factory = (/**
             * @return {?}
             */
            () => provider.useFactory(...injectArgs(provider.deps || [])));
        }
        else if (isExistingProvider(provider)) {
            factory = (/**
             * @return {?}
             */
            () => ɵɵinject(resolveForwardRef(provider.useExisting)));
        }
        else {
            /** @type {?} */
            const classRef = resolveForwardRef(provider &&
                (((/** @type {?} */ (provider))).useClass || provider.provide));
            if (!classRef) {
                throwInvalidProviderError(ngModuleType, providers, provider);
            }
            if (hasDeps(provider)) {
                factory = (/**
                 * @return {?}
                 */
                () => new (classRef)(...injectArgs(provider.deps)));
            }
            else {
                return getFactoryDef(classRef) || injectableDefOrInjectorDefFactory(classRef);
            }
        }
    }
    return factory;
}
/**
 * @template T
 * @param {?} factory
 * @param {?} value
 * @param {?=} multi
 * @return {?}
 */
function makeRecord(factory, value, multi = false) {
    return {
        factory: factory,
        value: value,
        multi: multi ? [] : undefined,
    };
}
/**
 * @param {?} value
 * @return {?}
 */
function isValueProvider(value) {
    return value !== null && typeof value == 'object' && USE_VALUE in value;
}
/**
 * @param {?} value
 * @return {?}
 */
function isExistingProvider(value) {
    return !!(value && ((/** @type {?} */ (value))).useExisting);
}
/**
 * @param {?} value
 * @return {?}
 */
function isFactoryProvider(value) {
    return !!(value && ((/** @type {?} */ (value))).useFactory);
}
/**
 * @param {?} value
 * @return {?}
 */
export function isTypeProvider(value) {
    return typeof value === 'function';
}
/**
 * @param {?} value
 * @return {?}
 */
export function isClassProvider(value) {
    return !!((/** @type {?} */ (value))).useClass;
}
/**
 * @param {?} value
 * @return {?}
 */
function hasDeps(value) {
    return !!((/** @type {?} */ (value))).deps;
}
/**
 * @param {?} value
 * @return {?}
 */
function hasOnDestroy(value) {
    return value !== null && typeof value === 'object' &&
        typeof ((/** @type {?} */ (value))).ngOnDestroy === 'function';
}
/**
 * @param {?} value
 * @return {?}
 */
function couldBeInjectableType(value) {
    return (typeof value === 'function') ||
        (typeof value === 'object' && value instanceof InjectionToken);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicjNfaW5qZWN0b3IuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9kaS9yM19pbmplY3Rvci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFRQSxPQUFPLHFCQUFxQixDQUFDO0FBSTdCLE9BQU8sRUFBQyxhQUFhLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUNwRCxPQUFPLEVBQUMsMEJBQTBCLEVBQUUseUJBQXlCLEVBQUUsNEJBQTRCLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUV0SCxPQUFPLEVBQUMsV0FBVyxFQUFFLFFBQVEsRUFBQyxNQUFNLHFCQUFxQixDQUFDO0FBQzFELE9BQU8sRUFBQyxTQUFTLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUM1QyxPQUFPLEVBQUMsaUJBQWlCLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFDaEQsT0FBTyxFQUFDLGNBQWMsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBRWpELE9BQU8sRUFBQyxRQUFRLEVBQUUsa0JBQWtCLEVBQUUsWUFBWSxFQUFFLGtCQUFrQixFQUFFLFNBQVMsRUFBRSxrQkFBa0IsRUFBRSxVQUFVLEVBQUUsa0JBQWtCLEVBQUUsUUFBUSxFQUFDLE1BQU0sMEJBQTBCLENBQUM7QUFDakwsT0FBTyxFQUEwQyx5QkFBeUIsRUFBRSxnQkFBZ0IsRUFBRSxjQUFjLEVBQWtCLE1BQU0sa0JBQWtCLENBQUM7QUFDdkosT0FBTyxFQUFDLFdBQVcsRUFBQyxNQUFNLHNCQUFzQixDQUFDO0FBRWpELE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSxTQUFTLENBQUM7Ozs7O01BYWpDLE9BQU8sR0FBRyxFQUFFOzs7Ozs7Ozs7TUFTWixRQUFRLEdBQUcsRUFBRTs7TUFFYixXQUFXLEdBQUcsbUJBQUEsRUFBRSxFQUFTOzs7OztJQUszQixhQUFhLEdBQXVCLFNBQVM7Ozs7QUFFakQsU0FBUyxlQUFlO0lBQ3RCLElBQUksYUFBYSxLQUFLLFNBQVMsRUFBRTtRQUMvQixhQUFhLEdBQUcsSUFBSSxZQUFZLEVBQUUsQ0FBQztLQUNwQztJQUNELE9BQU8sYUFBYSxDQUFDO0FBQ3ZCLENBQUM7Ozs7Ozs7QUFNRCxxQkFJQzs7O0lBSEMseUJBQTZCOztJQUM3Qix1QkFBWTs7SUFDWix1QkFBdUI7Ozs7Ozs7Ozs7OztBQVF6QixNQUFNLFVBQVUsY0FBYyxDQUMxQixPQUFvQyxFQUFFLFNBQTBCLElBQUksRUFDcEUsc0JBQStDLElBQUksRUFBRSxJQUFhO0lBQ3BFLE1BQU0sR0FBRyxNQUFNLElBQUksZUFBZSxFQUFFLENBQUM7SUFDckMsT0FBTyxJQUFJLFVBQVUsQ0FBQyxPQUFPLEVBQUUsbUJBQW1CLEVBQUUsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFDO0FBQ3BFLENBQUM7QUFFRCxNQUFNLE9BQU8sVUFBVTs7Ozs7OztJQWdDckIsWUFDSSxHQUFzQixFQUFFLG1CQUEwQyxFQUFXLE1BQWdCLEVBQzdGLFNBQXNCLElBQUk7UUFEbUQsV0FBTSxHQUFOLE1BQU0sQ0FBVTs7Ozs7O1FBM0J6RixZQUFPLEdBQUcsSUFBSSxHQUFHLEVBQW1ELENBQUM7Ozs7UUFLckUscUJBQWdCLEdBQUcsSUFBSSxHQUFHLEVBQXFCLENBQUM7Ozs7UUFLaEQsY0FBUyxHQUFHLElBQUksR0FBRyxFQUFhLENBQUM7UUFjakMsZUFBVSxHQUFHLEtBQUssQ0FBQzs7Y0FLbkIsVUFBVSxHQUF3QixFQUFFO1FBRTFDLGtGQUFrRjtRQUNsRiwwRkFBMEY7UUFDMUYsMkZBQTJGO1FBQzNGLG1CQUFtQixJQUFJLFdBQVcsQ0FDUCxtQkFBbUI7Ozs7UUFBRSxRQUFRLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxlQUFlLENBQzVCLFFBQVEsRUFBRSxHQUFHLEVBQUUsbUJBQW1CLENBQUMsRUFBQyxDQUFDO1FBRXpGLFdBQVcsQ0FBQyxDQUFDLEdBQUcsQ0FBQzs7OztRQUFFLFdBQVcsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLG1CQUFtQixDQUFDLFdBQVcsRUFBRSxFQUFFLEVBQUUsVUFBVSxDQUFDLEVBQUMsQ0FBQztRQUV6Rix1REFBdUQ7UUFDdkQsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLFVBQVUsQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQzs7OztjQUlsRCxNQUFNLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsY0FBYyxDQUFDO1FBQy9DLElBQUksQ0FBQyxLQUFLLEdBQUcsTUFBTSxJQUFJLElBQUksQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO1FBRWxELDJEQUEyRDtRQUMzRCxJQUFJLENBQUMsZ0JBQWdCLENBQUMsT0FBTzs7OztRQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsRUFBQyxDQUFDO1FBRTVELGtDQUFrQztRQUNsQyxJQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sSUFBSSxDQUFDLE9BQU8sR0FBRyxLQUFLLFFBQVEsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztJQUM1RSxDQUFDOzs7OztJQTlCRCxJQUFJLFNBQVMsS0FBYyxPQUFPLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDOzs7Ozs7OztJQXNDcEQsT0FBTztRQUNMLElBQUksQ0FBQyxrQkFBa0IsRUFBRSxDQUFDO1FBRTFCLDBFQUEwRTtRQUMxRSxJQUFJLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQztRQUN2QixJQUFJO1lBQ0YsZ0NBQWdDO1lBQ2hDLElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTzs7OztZQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLFdBQVcsRUFBRSxFQUFDLENBQUM7U0FDMUQ7Z0JBQVM7WUFDUiwwQkFBMEI7WUFDMUIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUNyQixJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssRUFBRSxDQUFDO1lBQ3ZCLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFLLEVBQUUsQ0FBQztTQUMvQjtJQUNILENBQUM7Ozs7Ozs7O0lBRUQsR0FBRyxDQUNDLEtBQWdDLEVBQUUsZ0JBQXFCLGtCQUFrQixFQUN6RSxLQUFLLEdBQUcsV0FBVyxDQUFDLE9BQU87UUFDN0IsSUFBSSxDQUFDLGtCQUFrQixFQUFFLENBQUM7OztjQUVwQixnQkFBZ0IsR0FBRyxrQkFBa0IsQ0FBQyxJQUFJLENBQUM7UUFDakQsSUFBSTtZQUNGLCtCQUErQjtZQUMvQixJQUFJLENBQUMsQ0FBQyxLQUFLLEdBQUcsV0FBVyxDQUFDLFFBQVEsQ0FBQyxFQUFFOzs7b0JBRS9CLE1BQU0sR0FBNkIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDO2dCQUM5RCxJQUFJLE1BQU0sS0FBSyxTQUFTLEVBQUU7Ozs7MEJBR2xCLEdBQUcsR0FBRyxxQkFBcUIsQ0FBQyxLQUFLLENBQUMsSUFBSSxnQkFBZ0IsQ0FBQyxLQUFLLENBQUM7b0JBQ25FLElBQUksR0FBRyxJQUFJLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxHQUFHLENBQUMsRUFBRTt3QkFDekMsc0ZBQXNGO3dCQUN0RixhQUFhO3dCQUNiLE1BQU0sR0FBRyxVQUFVLENBQUMsaUNBQWlDLENBQUMsS0FBSyxDQUFDLEVBQUUsT0FBTyxDQUFDLENBQUM7cUJBQ3hFO3lCQUFNO3dCQUNMLE1BQU0sR0FBRyxJQUFJLENBQUM7cUJBQ2Y7b0JBQ0QsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxDQUFDO2lCQUNqQztnQkFDRCxnRUFBZ0U7Z0JBQ2hFLElBQUksTUFBTSxJQUFJLElBQUksQ0FBQywyQkFBMkIsRUFBRTtvQkFDOUMsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxNQUFNLENBQUMsQ0FBQztpQkFDcEM7YUFDRjs7OztrQkFJSyxZQUFZLEdBQUcsQ0FBQyxDQUFDLEtBQUssR0FBRyxXQUFXLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLGVBQWUsRUFBRTtZQUNsRiwwRkFBMEY7WUFDMUYscUVBQXFFO1lBQ3JFLGFBQWEsR0FBRyxDQUFDLEtBQUssR0FBRyxXQUFXLENBQUMsUUFBUSxDQUFDLElBQUksYUFBYSxLQUFLLGtCQUFrQixDQUFDLENBQUM7Z0JBQ3BGLElBQUksQ0FBQyxDQUFDO2dCQUNOLGFBQWEsQ0FBQztZQUNsQixPQUFPLFlBQVksQ0FBQyxHQUFHLENBQUMsS0FBSyxFQUFFLGFBQWEsQ0FBQyxDQUFDO1NBQy9DO1FBQUMsT0FBTyxDQUFDLEVBQUU7WUFDVixJQUFJLENBQUMsQ0FBQyxJQUFJLEtBQUssbUJBQW1CLEVBQUU7O3NCQUM1QixJQUFJLEdBQVUsQ0FBQyxDQUFDLGtCQUFrQixDQUFDLEdBQUcsQ0FBQyxDQUFDLGtCQUFrQixDQUFDLElBQUksRUFBRTtnQkFDdkUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztnQkFDL0IsSUFBSSxnQkFBZ0IsRUFBRTtvQkFDcEIsaURBQWlEO29CQUNqRCxNQUFNLENBQUMsQ0FBQztpQkFDVDtxQkFBTTtvQkFDTCxrRkFBa0Y7b0JBQ2xGLE9BQU8sa0JBQWtCLENBQUMsQ0FBQyxFQUFFLEtBQUssRUFBRSxpQkFBaUIsRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7aUJBQ3JFO2FBQ0Y7aUJBQU07Z0JBQ0wsTUFBTSxDQUFDLENBQUM7YUFDVDtTQUNGO2dCQUFTO1lBQ1IsaUVBQWlFO1lBQ2pFLGtCQUFrQixDQUFDLGdCQUFnQixDQUFDLENBQUM7U0FDdEM7SUFDSCxDQUFDOzs7O0lBRUQsUUFBUTs7Y0FDQSxNQUFNLEdBQUcsbUJBQVUsRUFBRSxFQUFBOztjQUFFLE9BQU8sR0FBRyxJQUFJLENBQUMsT0FBTztRQUNuRCxPQUFPLENBQUMsT0FBTzs7Ozs7UUFBQyxDQUFDLENBQUMsRUFBRSxLQUFLLEVBQUUsRUFBRSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUMsQ0FBQztRQUM3RCxPQUFPLGNBQWMsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDO0lBQzVDLENBQUM7Ozs7O0lBRU8sa0JBQWtCO1FBQ3hCLElBQUksSUFBSSxDQUFDLFVBQVUsRUFBRTtZQUNuQixNQUFNLElBQUksS0FBSyxDQUFDLHNDQUFzQyxDQUFDLENBQUM7U0FDekQ7SUFDSCxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7SUFXTyxtQkFBbUIsQ0FDdkIsZUFBaUUsRUFDakUsT0FBNEIsRUFDNUIsVUFBK0I7UUFDakMsZUFBZSxHQUFHLGlCQUFpQixDQUFDLGVBQWUsQ0FBQyxDQUFDO1FBQ3JELElBQUksQ0FBQyxlQUFlO1lBQUUsT0FBTyxLQUFLLENBQUM7Ozs7OztZQU8vQixHQUFHLEdBQUcsY0FBYyxDQUFDLGVBQWUsQ0FBQzs7O2NBR25DLFFBQVEsR0FDVixDQUFDLEdBQUcsSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLG1CQUFBLGVBQWUsRUFBa0MsQ0FBQyxDQUFDLFFBQVEsSUFBSSxTQUFTOzs7OztjQUt4RixPQUFPLEdBQ1QsQ0FBQyxRQUFRLEtBQUssU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsbUJBQUEsZUFBZSxFQUFxQixDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVE7UUFFaEYsbUNBQW1DO1FBQ25DLElBQUksU0FBUyxJQUFJLE9BQU8sQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUU7O2tCQUMxQyxPQUFPLEdBQUcsU0FBUyxDQUFDLE9BQU8sQ0FBQztZQUNsQyxNQUFNLElBQUksS0FBSyxDQUNYLCtDQUErQyxPQUFPLHNCQUFzQixPQUFPLENBQUMsR0FBRzs7OztZQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxFQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLE9BQU8sR0FBRyxDQUFDLENBQUM7U0FDeko7OztjQUdLLFdBQVcsR0FBRyxVQUFVLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUV0RCxzRkFBc0Y7UUFDdEYsc0NBQXNDO1FBQ3RDLElBQUksUUFBUSxLQUFLLFNBQVMsRUFBRTtZQUMxQixHQUFHLEdBQUcsY0FBYyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1NBQ2hDO1FBRUQsbUVBQW1FO1FBQ25FLElBQUksR0FBRyxJQUFJLElBQUksRUFBRTtZQUNmLE9BQU8sS0FBSyxDQUFDO1NBQ2Q7UUFFRCwrREFBK0Q7UUFFL0QsNkNBQTZDO1FBQzdDLElBQUksR0FBRyxDQUFDLE9BQU8sSUFBSSxJQUFJLElBQUksQ0FBQyxXQUFXLEVBQUU7WUFDdkMsMEZBQTBGO1lBQzFGLG9EQUFvRDtZQUNwRCxTQUFTLElBQUksT0FBTyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUNuQywwRkFBMEY7WUFDMUYsVUFBVSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQzs7Z0JBRXJCLHdCQUFzRTtZQUMxRSxJQUFJO2dCQUNGLFdBQVcsQ0FBQyxHQUFHLENBQUMsT0FBTzs7OztnQkFBRSxRQUFRLENBQUMsRUFBRTtvQkFDbEMsSUFBSSxJQUFJLENBQUMsbUJBQW1CLENBQUMsUUFBUSxFQUFFLE9BQU8sRUFBRSxVQUFVLENBQUMsRUFBRTt3QkFDM0QsSUFBSSx3QkFBd0IsS0FBSyxTQUFTOzRCQUFFLHdCQUF3QixHQUFHLEVBQUUsQ0FBQzt3QkFDMUUsaUZBQWlGO3dCQUNqRixnRkFBZ0Y7d0JBQ2hGLHdCQUF3QixDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztxQkFDekM7Z0JBQ0gsQ0FBQyxFQUFDLENBQUM7YUFDSjtvQkFBUztnQkFDUixnREFBZ0Q7Z0JBQ2hELFNBQVMsSUFBSSxPQUFPLENBQUMsR0FBRyxFQUFFLENBQUM7YUFDNUI7WUFFRCxxRkFBcUY7WUFDckYsK0VBQStFO1lBQy9FLDBFQUEwRTtZQUMxRSxJQUFJLHdCQUF3QixLQUFLLFNBQVMsRUFBRTtnQkFDMUMsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLHdCQUF3QixDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTswQkFDbEQsRUFBQyxRQUFRLEVBQUUsU0FBUyxFQUFDLEdBQUcsd0JBQXdCLENBQUMsQ0FBQyxDQUFDO29CQUN6RCxXQUFXLENBQ1AsbUJBQUEsU0FBUyxFQUFFOzs7O29CQUNYLFFBQVEsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxRQUFRLEVBQUUsUUFBUSxFQUFFLFNBQVMsSUFBSSxXQUFXLENBQUMsRUFBQyxDQUFDO2lCQUNyRjthQUNGO1NBQ0Y7UUFDRCwrRkFBK0Y7UUFDL0YsaUJBQWlCO1FBQ2pCLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDbkMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsT0FBTyxFQUFFLFVBQVUsQ0FBQyxHQUFHLENBQUMsT0FBTyxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUM7OztjQUd0RCxZQUFZLEdBQUcsR0FBRyxDQUFDLFNBQVM7UUFDbEMsSUFBSSxZQUFZLElBQUksSUFBSSxJQUFJLENBQUMsV0FBVyxFQUFFOztrQkFDbEMsWUFBWSxHQUFHLG1CQUFBLGVBQWUsRUFBcUI7WUFDekQsV0FBVyxDQUNQLFlBQVk7Ozs7WUFBRSxRQUFRLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsUUFBUSxFQUFFLFlBQVksRUFBRSxZQUFZLENBQUMsRUFBQyxDQUFDO1NBQzNGO1FBRUQsT0FBTyxDQUNILFFBQVEsS0FBSyxTQUFTO1lBQ3RCLENBQUMsbUJBQUEsZUFBZSxFQUFrQyxDQUFDLENBQUMsU0FBUyxLQUFLLFNBQVMsQ0FBQyxDQUFDO0lBQ25GLENBQUM7Ozs7Ozs7OztJQUtPLGVBQWUsQ0FDbkIsUUFBd0IsRUFBRSxZQUErQixFQUFFLFNBQWdCO1FBQzdFLDRGQUE0RjtRQUM1RixZQUFZO1FBQ1osUUFBUSxHQUFHLGlCQUFpQixDQUFDLFFBQVEsQ0FBQyxDQUFDOztZQUNuQyxLQUFLLEdBQ0wsY0FBYyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLGlCQUFpQixDQUFDLFFBQVEsSUFBSSxRQUFRLENBQUMsT0FBTyxDQUFDOzs7Y0FHbkYsTUFBTSxHQUFHLGdCQUFnQixDQUFDLFFBQVEsRUFBRSxZQUFZLEVBQUUsU0FBUyxDQUFDO1FBRWxFLElBQUksQ0FBQyxjQUFjLENBQUMsUUFBUSxDQUFDLElBQUksUUFBUSxDQUFDLEtBQUssS0FBSyxJQUFJLEVBQUU7Ozs7Z0JBR3BELFdBQVcsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUM7WUFDekMsSUFBSSxXQUFXLEVBQUU7Z0JBQ2YsZ0NBQWdDO2dCQUNoQyxJQUFJLFdBQVcsQ0FBQyxLQUFLLEtBQUssU0FBUyxFQUFFO29CQUNuQyw0QkFBNEIsRUFBRSxDQUFDO2lCQUNoQzthQUNGO2lCQUFNO2dCQUNMLFdBQVcsR0FBRyxVQUFVLENBQUMsU0FBUyxFQUFFLE9BQU8sRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFDbkQsV0FBVyxDQUFDLE9BQU87OztnQkFBRyxHQUFHLEVBQUUsQ0FBQyxVQUFVLENBQUMsbUJBQUEsbUJBQUEsV0FBVyxFQUFFLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQSxDQUFDO2dCQUM5RCxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUUsV0FBVyxDQUFDLENBQUM7YUFDdEM7WUFDRCxLQUFLLEdBQUcsUUFBUSxDQUFDO1lBQ2pCLG1CQUFBLFdBQVcsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7U0FDcEM7YUFBTTs7a0JBQ0MsUUFBUSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQztZQUN4QyxJQUFJLFFBQVEsSUFBSSxRQUFRLENBQUMsS0FBSyxLQUFLLFNBQVMsRUFBRTtnQkFDNUMsNEJBQTRCLEVBQUUsQ0FBQzthQUNoQztTQUNGO1FBQ0QsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxDQUFDO0lBQ2xDLENBQUM7Ozs7Ozs7O0lBRU8sT0FBTyxDQUFJLEtBQWdDLEVBQUUsTUFBaUI7UUFDcEUsSUFBSSxNQUFNLENBQUMsS0FBSyxLQUFLLFFBQVEsRUFBRTtZQUM3QiwwQkFBMEIsQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztTQUM5QzthQUFNLElBQUksTUFBTSxDQUFDLEtBQUssS0FBSyxPQUFPLEVBQUU7WUFDbkMsTUFBTSxDQUFDLEtBQUssR0FBRyxRQUFRLENBQUM7WUFDeEIsTUFBTSxDQUFDLEtBQUssR0FBRyxtQkFBQSxNQUFNLENBQUMsT0FBTyxFQUFFLEVBQUUsQ0FBQztTQUNuQztRQUNELElBQUksT0FBTyxNQUFNLENBQUMsS0FBSyxLQUFLLFFBQVEsSUFBSSxNQUFNLENBQUMsS0FBSyxJQUFJLFlBQVksQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLEVBQUU7WUFDbEYsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDO1NBQ2xDO1FBQ0QsT0FBTyxtQkFBQSxNQUFNLENBQUMsS0FBSyxFQUFLLENBQUM7SUFDM0IsQ0FBQzs7Ozs7O0lBRU8sb0JBQW9CLENBQUMsR0FBeUI7UUFDcEQsSUFBSSxDQUFDLEdBQUcsQ0FBQyxVQUFVLEVBQUU7WUFDbkIsT0FBTyxLQUFLLENBQUM7U0FDZDthQUFNLElBQUksT0FBTyxHQUFHLENBQUMsVUFBVSxLQUFLLFFBQVEsRUFBRTtZQUM3QyxPQUFPLEdBQUcsQ0FBQyxVQUFVLEtBQUssS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLFVBQVUsS0FBSyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7U0FDcEU7YUFBTTtZQUNMLE9BQU8sSUFBSSxDQUFDLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUM7U0FDbEQ7SUFDSCxDQUFDO0NBQ0Y7Ozs7Ozs7OztJQTlUQyw2QkFBNkU7Ozs7OztJQUs3RSxzQ0FBd0Q7Ozs7OztJQUt4RCwrQkFBeUM7Ozs7Ozs7SUFNekMsMkJBQStDOztJQUUvQyw0QkFBNkI7Ozs7O0lBTTdCLGdDQUEyQjs7SUFHNkMsNEJBQXlCOzs7Ozs7QUFxU25HLFNBQVMsaUNBQWlDLENBQUMsS0FBcUM7OztVQUV4RSxhQUFhLEdBQUcsZ0JBQWdCLENBQUMsS0FBSyxDQUFDOztVQUN2QyxPQUFPLEdBQUcsYUFBYSxLQUFLLElBQUksQ0FBQyxDQUFDLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQztJQUVyRixJQUFJLE9BQU8sS0FBSyxJQUFJLEVBQUU7UUFDcEIsT0FBTyxPQUFPLENBQUM7S0FDaEI7Ozs7VUFJSyxXQUFXLEdBQUcsY0FBYyxDQUFDLEtBQUssQ0FBQztJQUN6QyxJQUFJLFdBQVcsS0FBSyxJQUFJLEVBQUU7UUFDeEIsT0FBTyxXQUFXLENBQUMsT0FBTyxDQUFDO0tBQzVCO0lBRUQsMEZBQTBGO0lBQzFGLHVDQUF1QztJQUN2QyxJQUFJLEtBQUssWUFBWSxjQUFjLEVBQUU7UUFDbkMsTUFBTSxJQUFJLEtBQUssQ0FBQyxTQUFTLFNBQVMsQ0FBQyxLQUFLLENBQUMsaUNBQWlDLENBQUMsQ0FBQztLQUM3RTtJQUVELG9GQUFvRjtJQUNwRixJQUFJLEtBQUssWUFBWSxRQUFRLEVBQUU7UUFDN0IsT0FBTywrQkFBK0IsQ0FBQyxLQUFLLENBQUMsQ0FBQztLQUMvQztJQUVELHdEQUF3RDtJQUN4RCxNQUFNLElBQUksS0FBSyxDQUFDLGFBQWEsQ0FBQyxDQUFDO0FBQ2pDLENBQUM7Ozs7O0FBRUQsU0FBUywrQkFBK0IsQ0FBQyxLQUFlOzs7VUFFaEQsV0FBVyxHQUFHLEtBQUssQ0FBQyxNQUFNO0lBQ2hDLElBQUksV0FBVyxHQUFHLENBQUMsRUFBRTs7Y0FDYixJQUFJLEdBQWEsUUFBUSxDQUFDLFdBQVcsRUFBRSxHQUFHLENBQUM7UUFDakQsTUFBTSxJQUFJLEtBQUssQ0FBQyxvQ0FBb0MsU0FBUyxDQUFDLEtBQUssQ0FBQyxNQUFNLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO0tBQ2hHOzs7Ozs7O1VBT0ssc0JBQXNCLEdBQUcseUJBQXlCLENBQUMsS0FBSyxDQUFDO0lBQy9ELElBQUksc0JBQXNCLEtBQUssSUFBSSxFQUFFO1FBQ25DOzs7UUFBTyxHQUFHLEVBQUUsQ0FBQyxzQkFBc0IsQ0FBQyxPQUFPLENBQUMsbUJBQUEsS0FBSyxFQUFhLENBQUMsRUFBQztLQUNqRTtTQUFNO1FBQ0w7OztRQUFPLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxtQkFBQSxLQUFLLEVBQWEsQ0FBQyxFQUFFLEVBQUM7S0FDekM7QUFDSCxDQUFDOzs7Ozs7O0FBRUQsU0FBUyxnQkFBZ0IsQ0FDckIsUUFBd0IsRUFBRSxZQUErQixFQUFFLFNBQWdCO0lBQzdFLElBQUksZUFBZSxDQUFDLFFBQVEsQ0FBQyxFQUFFO1FBQzdCLE9BQU8sVUFBVSxDQUFDLFNBQVMsRUFBRSxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUM7S0FDakQ7U0FBTTs7Y0FDQyxPQUFPLEdBQTBCLGlCQUFpQixDQUFDLFFBQVEsRUFBRSxZQUFZLEVBQUUsU0FBUyxDQUFDO1FBQzNGLE9BQU8sVUFBVSxDQUFDLE9BQU8sRUFBRSxPQUFPLENBQUMsQ0FBQztLQUNyQztBQUNILENBQUM7Ozs7Ozs7OztBQU9ELE1BQU0sVUFBVSxpQkFBaUIsQ0FDN0IsUUFBd0IsRUFBRSxZQUFnQyxFQUFFLFNBQWlCOztRQUMzRSxPQUFPLEdBQTBCLFNBQVM7SUFDOUMsSUFBSSxjQUFjLENBQUMsUUFBUSxDQUFDLEVBQUU7O2NBQ3RCLGlCQUFpQixHQUFHLGlCQUFpQixDQUFDLFFBQVEsQ0FBQztRQUNyRCxPQUFPLGFBQWEsQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLGlDQUFpQyxDQUFDLGlCQUFpQixDQUFDLENBQUM7S0FDakc7U0FBTTtRQUNMLElBQUksZUFBZSxDQUFDLFFBQVEsQ0FBQyxFQUFFO1lBQzdCLE9BQU87OztZQUFHLEdBQUcsRUFBRSxDQUFDLGlCQUFpQixDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQSxDQUFDO1NBQ3REO2FBQU0sSUFBSSxpQkFBaUIsQ0FBQyxRQUFRLENBQUMsRUFBRTtZQUN0QyxPQUFPOzs7WUFBRyxHQUFHLEVBQUUsQ0FBQyxRQUFRLENBQUMsVUFBVSxDQUFDLEdBQUcsVUFBVSxDQUFDLFFBQVEsQ0FBQyxJQUFJLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQSxDQUFDO1NBQ3pFO2FBQU0sSUFBSSxrQkFBa0IsQ0FBQyxRQUFRLENBQUMsRUFBRTtZQUN2QyxPQUFPOzs7WUFBRyxHQUFHLEVBQUUsQ0FBQyxRQUFRLENBQUMsaUJBQWlCLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUEsQ0FBQztTQUNuRTthQUFNOztrQkFDQyxRQUFRLEdBQUcsaUJBQWlCLENBQzlCLFFBQVE7Z0JBQ1IsQ0FBQyxDQUFDLG1CQUFBLFFBQVEsRUFBdUMsQ0FBQyxDQUFDLFFBQVEsSUFBSSxRQUFRLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDckYsSUFBSSxDQUFDLFFBQVEsRUFBRTtnQkFDYix5QkFBeUIsQ0FBQyxZQUFZLEVBQUUsU0FBUyxFQUFFLFFBQVEsQ0FBQyxDQUFDO2FBQzlEO1lBQ0QsSUFBSSxPQUFPLENBQUMsUUFBUSxDQUFDLEVBQUU7Z0JBQ3JCLE9BQU87OztnQkFBRyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsR0FBRyxVQUFVLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUEsQ0FBQzthQUM5RDtpQkFBTTtnQkFDTCxPQUFPLGFBQWEsQ0FBQyxRQUFRLENBQUMsSUFBSSxpQ0FBaUMsQ0FBQyxRQUFRLENBQUMsQ0FBQzthQUMvRTtTQUNGO0tBQ0Y7SUFDRCxPQUFPLE9BQU8sQ0FBQztBQUNqQixDQUFDOzs7Ozs7OztBQUVELFNBQVMsVUFBVSxDQUNmLE9BQThCLEVBQUUsS0FBYSxFQUFFLFFBQWlCLEtBQUs7SUFDdkUsT0FBTztRQUNMLE9BQU8sRUFBRSxPQUFPO1FBQ2hCLEtBQUssRUFBRSxLQUFLO1FBQ1osS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxTQUFTO0tBQzlCLENBQUM7QUFDSixDQUFDOzs7OztBQUVELFNBQVMsZUFBZSxDQUFDLEtBQXFCO0lBQzVDLE9BQU8sS0FBSyxLQUFLLElBQUksSUFBSSxPQUFPLEtBQUssSUFBSSxRQUFRLElBQUksU0FBUyxJQUFJLEtBQUssQ0FBQztBQUMxRSxDQUFDOzs7OztBQUVELFNBQVMsa0JBQWtCLENBQUMsS0FBcUI7SUFDL0MsT0FBTyxDQUFDLENBQUMsQ0FBQyxLQUFLLElBQUksQ0FBQyxtQkFBQSxLQUFLLEVBQW9CLENBQUMsQ0FBQyxXQUFXLENBQUMsQ0FBQztBQUM5RCxDQUFDOzs7OztBQUVELFNBQVMsaUJBQWlCLENBQUMsS0FBcUI7SUFDOUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxLQUFLLElBQUksQ0FBQyxtQkFBQSxLQUFLLEVBQW1CLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQztBQUM1RCxDQUFDOzs7OztBQUVELE1BQU0sVUFBVSxjQUFjLENBQUMsS0FBcUI7SUFDbEQsT0FBTyxPQUFPLEtBQUssS0FBSyxVQUFVLENBQUM7QUFDckMsQ0FBQzs7Ozs7QUFFRCxNQUFNLFVBQVUsZUFBZSxDQUFDLEtBQXFCO0lBQ25ELE9BQU8sQ0FBQyxDQUFDLENBQUMsbUJBQUEsS0FBSyxFQUF1QyxDQUFDLENBQUMsUUFBUSxDQUFDO0FBQ25FLENBQUM7Ozs7O0FBRUQsU0FBUyxPQUFPLENBQUMsS0FBZ0U7SUFFL0UsT0FBTyxDQUFDLENBQUMsQ0FBQyxtQkFBQSxLQUFLLEVBQU8sQ0FBQyxDQUFDLElBQUksQ0FBQztBQUMvQixDQUFDOzs7OztBQUVELFNBQVMsWUFBWSxDQUFDLEtBQVU7SUFDOUIsT0FBTyxLQUFLLEtBQUssSUFBSSxJQUFJLE9BQU8sS0FBSyxLQUFLLFFBQVE7UUFDOUMsT0FBTSxDQUFDLG1CQUFBLEtBQUssRUFBYSxDQUFDLENBQUMsV0FBVyxLQUFLLFVBQVUsQ0FBQztBQUM1RCxDQUFDOzs7OztBQUVELFNBQVMscUJBQXFCLENBQUMsS0FBVTtJQUN2QyxPQUFPLENBQUMsT0FBTyxLQUFLLEtBQUssVUFBVSxDQUFDO1FBQ2hDLENBQUMsT0FBTyxLQUFLLEtBQUssUUFBUSxJQUFJLEtBQUssWUFBWSxjQUFjLENBQUMsQ0FBQztBQUNyRSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgJy4uL3V0aWwvbmdfZGV2X21vZGUnO1xuXG5pbXBvcnQge09uRGVzdHJveX0gZnJvbSAnLi4vaW50ZXJmYWNlL2xpZmVjeWNsZV9ob29rcyc7XG5pbXBvcnQge1R5cGV9IGZyb20gJy4uL2ludGVyZmFjZS90eXBlJztcbmltcG9ydCB7Z2V0RmFjdG9yeURlZn0gZnJvbSAnLi4vcmVuZGVyMy9kZWZpbml0aW9uJztcbmltcG9ydCB7dGhyb3dDeWNsaWNEZXBlbmRlbmN5RXJyb3IsIHRocm93SW52YWxpZFByb3ZpZGVyRXJyb3IsIHRocm93TWl4ZWRNdWx0aVByb3ZpZGVyRXJyb3J9IGZyb20gJy4uL3JlbmRlcjMvZXJyb3JzJztcbmltcG9ydCB7RmFjdG9yeUZufSBmcm9tICcuLi9yZW5kZXIzL2ludGVyZmFjZXMvZGVmaW5pdGlvbic7XG5pbXBvcnQge2RlZXBGb3JFYWNoLCBuZXdBcnJheX0gZnJvbSAnLi4vdXRpbC9hcnJheV91dGlscyc7XG5pbXBvcnQge3N0cmluZ2lmeX0gZnJvbSAnLi4vdXRpbC9zdHJpbmdpZnknO1xuaW1wb3J0IHtyZXNvbHZlRm9yd2FyZFJlZn0gZnJvbSAnLi9mb3J3YXJkX3JlZic7XG5pbXBvcnQge0luamVjdGlvblRva2VufSBmcm9tICcuL2luamVjdGlvbl90b2tlbic7XG5pbXBvcnQge0luamVjdG9yfSBmcm9tICcuL2luamVjdG9yJztcbmltcG9ydCB7SU5KRUNUT1IsIE5HX1RFTVBfVE9LRU5fUEFUSCwgTnVsbEluamVjdG9yLCBUSFJPV19JRl9OT1RfRk9VTkQsIFVTRV9WQUxVRSwgY2F0Y2hJbmplY3RvckVycm9yLCBpbmplY3RBcmdzLCBzZXRDdXJyZW50SW5qZWN0b3IsIMm1ybVpbmplY3R9IGZyb20gJy4vaW5qZWN0b3JfY29tcGF0aWJpbGl0eSc7XG5pbXBvcnQge0luamVjdG9yVHlwZSwgSW5qZWN0b3JUeXBlV2l0aFByb3ZpZGVycywgZ2V0SW5oZXJpdGVkSW5qZWN0YWJsZURlZiwgZ2V0SW5qZWN0YWJsZURlZiwgZ2V0SW5qZWN0b3JEZWYsIMm1ybVJbmplY3RhYmxlRGVmfSBmcm9tICcuL2ludGVyZmFjZS9kZWZzJztcbmltcG9ydCB7SW5qZWN0RmxhZ3N9IGZyb20gJy4vaW50ZXJmYWNlL2luamVjdG9yJztcbmltcG9ydCB7Q2xhc3NQcm92aWRlciwgQ29uc3RydWN0b3JQcm92aWRlciwgRXhpc3RpbmdQcm92aWRlciwgRmFjdG9yeVByb3ZpZGVyLCBTdGF0aWNDbGFzc1Byb3ZpZGVyLCBTdGF0aWNQcm92aWRlciwgVHlwZVByb3ZpZGVyLCBWYWx1ZVByb3ZpZGVyfSBmcm9tICcuL2ludGVyZmFjZS9wcm92aWRlcic7XG5pbXBvcnQge0lOSkVDVE9SX1NDT1BFfSBmcm9tICcuL3Njb3BlJztcblxuXG5cbi8qKlxuICogSW50ZXJuYWwgdHlwZSBmb3IgYSBzaW5nbGUgcHJvdmlkZXIgaW4gYSBkZWVwIHByb3ZpZGVyIGFycmF5LlxuICovXG50eXBlIFNpbmdsZVByb3ZpZGVyID0gVHlwZVByb3ZpZGVyIHwgVmFsdWVQcm92aWRlciB8IENsYXNzUHJvdmlkZXIgfCBDb25zdHJ1Y3RvclByb3ZpZGVyIHxcbiAgICBFeGlzdGluZ1Byb3ZpZGVyIHwgRmFjdG9yeVByb3ZpZGVyIHwgU3RhdGljQ2xhc3NQcm92aWRlcjtcblxuLyoqXG4gKiBNYXJrZXIgd2hpY2ggaW5kaWNhdGVzIHRoYXQgYSB2YWx1ZSBoYXMgbm90IHlldCBiZWVuIGNyZWF0ZWQgZnJvbSB0aGUgZmFjdG9yeSBmdW5jdGlvbi5cbiAqL1xuY29uc3QgTk9UX1lFVCA9IHt9O1xuXG4vKipcbiAqIE1hcmtlciB3aGljaCBpbmRpY2F0ZXMgdGhhdCB0aGUgZmFjdG9yeSBmdW5jdGlvbiBmb3IgYSB0b2tlbiBpcyBpbiB0aGUgcHJvY2VzcyBvZiBiZWluZyBjYWxsZWQuXG4gKlxuICogSWYgdGhlIGluamVjdG9yIGlzIGFza2VkIHRvIGluamVjdCBhIHRva2VuIHdpdGggaXRzIHZhbHVlIHNldCB0byBDSVJDVUxBUiwgdGhhdCBpbmRpY2F0ZXNcbiAqIGluamVjdGlvbiBvZiBhIGRlcGVuZGVuY3kgaGFzIHJlY3Vyc2l2ZWx5IGF0dGVtcHRlZCB0byBpbmplY3QgdGhlIG9yaWdpbmFsIHRva2VuLCBhbmQgdGhlcmUgaXNcbiAqIGEgY2lyY3VsYXIgZGVwZW5kZW5jeSBhbW9uZyB0aGUgcHJvdmlkZXJzLlxuICovXG5jb25zdCBDSVJDVUxBUiA9IHt9O1xuXG5jb25zdCBFTVBUWV9BUlJBWSA9IFtdIGFzIGFueVtdO1xuXG4vKipcbiAqIEEgbGF6aWx5IGluaXRpYWxpemVkIE51bGxJbmplY3Rvci5cbiAqL1xubGV0IE5VTExfSU5KRUNUT1I6IEluamVjdG9yfHVuZGVmaW5lZCA9IHVuZGVmaW5lZDtcblxuZnVuY3Rpb24gZ2V0TnVsbEluamVjdG9yKCk6IEluamVjdG9yIHtcbiAgaWYgKE5VTExfSU5KRUNUT1IgPT09IHVuZGVmaW5lZCkge1xuICAgIE5VTExfSU5KRUNUT1IgPSBuZXcgTnVsbEluamVjdG9yKCk7XG4gIH1cbiAgcmV0dXJuIE5VTExfSU5KRUNUT1I7XG59XG5cbi8qKlxuICogQW4gZW50cnkgaW4gdGhlIGluamVjdG9yIHdoaWNoIHRyYWNrcyBpbmZvcm1hdGlvbiBhYm91dCB0aGUgZ2l2ZW4gdG9rZW4sIGluY2x1ZGluZyBhIHBvc3NpYmxlXG4gKiBjdXJyZW50IHZhbHVlLlxuICovXG5pbnRlcmZhY2UgUmVjb3JkPFQ+IHtcbiAgZmFjdG9yeTogKCgpID0+IFQpfHVuZGVmaW5lZDtcbiAgdmFsdWU6IFR8e307XG4gIG11bHRpOiBhbnlbXXx1bmRlZmluZWQ7XG59XG5cbi8qKlxuICogQ3JlYXRlIGEgbmV3IGBJbmplY3RvcmAgd2hpY2ggaXMgY29uZmlndXJlZCB1c2luZyBhIGBkZWZUeXBlYCBvZiBgSW5qZWN0b3JUeXBlPGFueT5gcy5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVJbmplY3RvcihcbiAgICBkZWZUeXBlOiAvKiBJbmplY3RvclR5cGU8YW55PiAqLyBhbnksIHBhcmVudDogSW5qZWN0b3IgfCBudWxsID0gbnVsbCxcbiAgICBhZGRpdGlvbmFsUHJvdmlkZXJzOiBTdGF0aWNQcm92aWRlcltdIHwgbnVsbCA9IG51bGwsIG5hbWU/OiBzdHJpbmcpOiBJbmplY3RvciB7XG4gIHBhcmVudCA9IHBhcmVudCB8fCBnZXROdWxsSW5qZWN0b3IoKTtcbiAgcmV0dXJuIG5ldyBSM0luamVjdG9yKGRlZlR5cGUsIGFkZGl0aW9uYWxQcm92aWRlcnMsIHBhcmVudCwgbmFtZSk7XG59XG5cbmV4cG9ydCBjbGFzcyBSM0luamVjdG9yIHtcbiAgLyoqXG4gICAqIE1hcCBvZiB0b2tlbnMgdG8gcmVjb3JkcyB3aGljaCBjb250YWluIHRoZSBpbnN0YW5jZXMgb2YgdGhvc2UgdG9rZW5zLlxuICAgKiAtIGBudWxsYCB2YWx1ZSBpbXBsaWVzIHRoYXQgd2UgZG9uJ3QgaGF2ZSB0aGUgcmVjb3JkLiBVc2VkIGJ5IHRyZWUtc2hha2FibGUgaW5qZWN0b3JzXG4gICAqIHRvIHByZXZlbnQgZnVydGhlciBzZWFyY2hlcy5cbiAgICovXG4gIHByaXZhdGUgcmVjb3JkcyA9IG5ldyBNYXA8VHlwZTxhbnk+fEluamVjdGlvblRva2VuPGFueT4sIFJlY29yZDxhbnk+fG51bGw+KCk7XG5cbiAgLyoqXG4gICAqIFRoZSB0cmFuc2l0aXZlIHNldCBvZiBgSW5qZWN0b3JUeXBlYHMgd2hpY2ggZGVmaW5lIHRoaXMgaW5qZWN0b3IuXG4gICAqL1xuICBwcml2YXRlIGluamVjdG9yRGVmVHlwZXMgPSBuZXcgU2V0PEluamVjdG9yVHlwZTxhbnk+PigpO1xuXG4gIC8qKlxuICAgKiBTZXQgb2YgdmFsdWVzIGluc3RhbnRpYXRlZCBieSB0aGlzIGluamVjdG9yIHdoaWNoIGNvbnRhaW4gYG5nT25EZXN0cm95YCBsaWZlY3ljbGUgaG9va3MuXG4gICAqL1xuICBwcml2YXRlIG9uRGVzdHJveSA9IG5ldyBTZXQ8T25EZXN0cm95PigpO1xuXG4gIC8qKlxuICAgKiBGbGFnIGluZGljYXRpbmcgdGhpcyBpbmplY3RvciBwcm92aWRlcyB0aGUgQVBQX1JPT1RfU0NPUEUgdG9rZW4sIGFuZCB0aHVzIGNvdW50cyBhcyB0aGVcbiAgICogcm9vdCBzY29wZS5cbiAgICovXG4gIHByaXZhdGUgcmVhZG9ubHkgc2NvcGU6ICdyb290J3wncGxhdGZvcm0nfG51bGw7XG5cbiAgcmVhZG9ubHkgc291cmNlOiBzdHJpbmd8bnVsbDtcblxuICAvKipcbiAgICogRmxhZyBpbmRpY2F0aW5nIHRoYXQgdGhpcyBpbmplY3RvciB3YXMgcHJldmlvdXNseSBkZXN0cm95ZWQuXG4gICAqL1xuICBnZXQgZGVzdHJveWVkKCk6IGJvb2xlYW4geyByZXR1cm4gdGhpcy5fZGVzdHJveWVkOyB9XG4gIHByaXZhdGUgX2Rlc3Ryb3llZCA9IGZhbHNlO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgICAgZGVmOiBJbmplY3RvclR5cGU8YW55PiwgYWRkaXRpb25hbFByb3ZpZGVyczogU3RhdGljUHJvdmlkZXJbXXxudWxsLCByZWFkb25seSBwYXJlbnQ6IEluamVjdG9yLFxuICAgICAgc291cmNlOiBzdHJpbmd8bnVsbCA9IG51bGwpIHtcbiAgICBjb25zdCBkZWR1cFN0YWNrOiBJbmplY3RvclR5cGU8YW55PltdID0gW107XG5cbiAgICAvLyBTdGFydCBvZmYgYnkgY3JlYXRpbmcgUmVjb3JkcyBmb3IgZXZlcnkgcHJvdmlkZXIgZGVjbGFyZWQgaW4gZXZlcnkgSW5qZWN0b3JUeXBlXG4gICAgLy8gaW5jbHVkZWQgdHJhbnNpdGl2ZWx5IGluIGFkZGl0aW9uYWwgcHJvdmlkZXJzIHRoZW4gZG8gdGhlIHNhbWUgZm9yIGBkZWZgLiBUaGlzIG9yZGVyIGlzXG4gICAgLy8gaW1wb3J0YW50IGJlY2F1c2UgYGRlZmAgbWF5IGluY2x1ZGUgcHJvdmlkZXJzIHRoYXQgb3ZlcnJpZGUgb25lcyBpbiBhZGRpdGlvbmFsUHJvdmlkZXJzLlxuICAgIGFkZGl0aW9uYWxQcm92aWRlcnMgJiYgZGVlcEZvckVhY2goXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWRkaXRpb25hbFByb3ZpZGVycywgcHJvdmlkZXIgPT4gdGhpcy5wcm9jZXNzUHJvdmlkZXIoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb3ZpZGVyLCBkZWYsIGFkZGl0aW9uYWxQcm92aWRlcnMpKTtcblxuICAgIGRlZXBGb3JFYWNoKFtkZWZdLCBpbmplY3RvckRlZiA9PiB0aGlzLnByb2Nlc3NJbmplY3RvclR5cGUoaW5qZWN0b3JEZWYsIFtdLCBkZWR1cFN0YWNrKSk7XG5cbiAgICAvLyBNYWtlIHN1cmUgdGhlIElOSkVDVE9SIHRva2VuIHByb3ZpZGVzIHRoaXMgaW5qZWN0b3IuXG4gICAgdGhpcy5yZWNvcmRzLnNldChJTkpFQ1RPUiwgbWFrZVJlY29yZCh1bmRlZmluZWQsIHRoaXMpKTtcblxuICAgIC8vIERldGVjdCB3aGV0aGVyIHRoaXMgaW5qZWN0b3IgaGFzIHRoZSBBUFBfUk9PVF9TQ09QRSB0b2tlbiBhbmQgdGh1cyBzaG91bGQgcHJvdmlkZVxuICAgIC8vIGFueSBpbmplY3RhYmxlIHNjb3BlZCB0byBBUFBfUk9PVF9TQ09QRS5cbiAgICBjb25zdCByZWNvcmQgPSB0aGlzLnJlY29yZHMuZ2V0KElOSkVDVE9SX1NDT1BFKTtcbiAgICB0aGlzLnNjb3BlID0gcmVjb3JkICE9IG51bGwgPyByZWNvcmQudmFsdWUgOiBudWxsO1xuXG4gICAgLy8gRWFnZXJseSBpbnN0YW50aWF0ZSB0aGUgSW5qZWN0b3JUeXBlIGNsYXNzZXMgdGhlbXNlbHZlcy5cbiAgICB0aGlzLmluamVjdG9yRGVmVHlwZXMuZm9yRWFjaChkZWZUeXBlID0+IHRoaXMuZ2V0KGRlZlR5cGUpKTtcblxuICAgIC8vIFNvdXJjZSBuYW1lLCB1c2VkIGZvciBkZWJ1Z2dpbmdcbiAgICB0aGlzLnNvdXJjZSA9IHNvdXJjZSB8fCAodHlwZW9mIGRlZiA9PT0gJ29iamVjdCcgPyBudWxsIDogc3RyaW5naWZ5KGRlZikpO1xuICB9XG5cbiAgLyoqXG4gICAqIERlc3Ryb3kgdGhlIGluamVjdG9yIGFuZCByZWxlYXNlIHJlZmVyZW5jZXMgdG8gZXZlcnkgaW5zdGFuY2Ugb3IgcHJvdmlkZXIgYXNzb2NpYXRlZCB3aXRoIGl0LlxuICAgKlxuICAgKiBBbHNvIGNhbGxzIHRoZSBgT25EZXN0cm95YCBsaWZlY3ljbGUgaG9va3Mgb2YgZXZlcnkgaW5zdGFuY2UgdGhhdCB3YXMgY3JlYXRlZCBmb3Igd2hpY2ggYVxuICAgKiBob29rIHdhcyBmb3VuZC5cbiAgICovXG4gIGRlc3Ryb3koKTogdm9pZCB7XG4gICAgdGhpcy5hc3NlcnROb3REZXN0cm95ZWQoKTtcblxuICAgIC8vIFNldCBkZXN0cm95ZWQgPSB0cnVlIGZpcnN0LCBpbiBjYXNlIGxpZmVjeWNsZSBob29rcyByZS1lbnRlciBkZXN0cm95KCkuXG4gICAgdGhpcy5fZGVzdHJveWVkID0gdHJ1ZTtcbiAgICB0cnkge1xuICAgICAgLy8gQ2FsbCBhbGwgdGhlIGxpZmVjeWNsZSBob29rcy5cbiAgICAgIHRoaXMub25EZXN0cm95LmZvckVhY2goc2VydmljZSA9PiBzZXJ2aWNlLm5nT25EZXN0cm95KCkpO1xuICAgIH0gZmluYWxseSB7XG4gICAgICAvLyBSZWxlYXNlIGFsbCByZWZlcmVuY2VzLlxuICAgICAgdGhpcy5yZWNvcmRzLmNsZWFyKCk7XG4gICAgICB0aGlzLm9uRGVzdHJveS5jbGVhcigpO1xuICAgICAgdGhpcy5pbmplY3RvckRlZlR5cGVzLmNsZWFyKCk7XG4gICAgfVxuICB9XG5cbiAgZ2V0PFQ+KFxuICAgICAgdG9rZW46IFR5cGU8VD58SW5qZWN0aW9uVG9rZW48VD4sIG5vdEZvdW5kVmFsdWU6IGFueSA9IFRIUk9XX0lGX05PVF9GT1VORCxcbiAgICAgIGZsYWdzID0gSW5qZWN0RmxhZ3MuRGVmYXVsdCk6IFQge1xuICAgIHRoaXMuYXNzZXJ0Tm90RGVzdHJveWVkKCk7XG4gICAgLy8gU2V0IHRoZSBpbmplY3Rpb24gY29udGV4dC5cbiAgICBjb25zdCBwcmV2aW91c0luamVjdG9yID0gc2V0Q3VycmVudEluamVjdG9yKHRoaXMpO1xuICAgIHRyeSB7XG4gICAgICAvLyBDaGVjayBmb3IgdGhlIFNraXBTZWxmIGZsYWcuXG4gICAgICBpZiAoIShmbGFncyAmIEluamVjdEZsYWdzLlNraXBTZWxmKSkge1xuICAgICAgICAvLyBTa2lwU2VsZiBpc24ndCBzZXQsIGNoZWNrIGlmIHRoZSByZWNvcmQgYmVsb25ncyB0byB0aGlzIGluamVjdG9yLlxuICAgICAgICBsZXQgcmVjb3JkOiBSZWNvcmQ8VD58dW5kZWZpbmVkfG51bGwgPSB0aGlzLnJlY29yZHMuZ2V0KHRva2VuKTtcbiAgICAgICAgaWYgKHJlY29yZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgLy8gTm8gcmVjb3JkLCBidXQgbWF5YmUgdGhlIHRva2VuIGlzIHNjb3BlZCB0byB0aGlzIGluamVjdG9yLiBMb29rIGZvciBhbiBpbmplY3RhYmxlXG4gICAgICAgICAgLy8gZGVmIHdpdGggYSBzY29wZSBtYXRjaGluZyB0aGlzIGluamVjdG9yLlxuICAgICAgICAgIGNvbnN0IGRlZiA9IGNvdWxkQmVJbmplY3RhYmxlVHlwZSh0b2tlbikgJiYgZ2V0SW5qZWN0YWJsZURlZih0b2tlbik7XG4gICAgICAgICAgaWYgKGRlZiAmJiB0aGlzLmluamVjdGFibGVEZWZJblNjb3BlKGRlZikpIHtcbiAgICAgICAgICAgIC8vIEZvdW5kIGFuIGluamVjdGFibGUgZGVmIGFuZCBpdCdzIHNjb3BlZCB0byB0aGlzIGluamVjdG9yLiBQcmV0ZW5kIGFzIGlmIGl0IHdhcyBoZXJlXG4gICAgICAgICAgICAvLyBhbGwgYWxvbmcuXG4gICAgICAgICAgICByZWNvcmQgPSBtYWtlUmVjb3JkKGluamVjdGFibGVEZWZPckluamVjdG9yRGVmRmFjdG9yeSh0b2tlbiksIE5PVF9ZRVQpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZWNvcmQgPSBudWxsO1xuICAgICAgICAgIH1cbiAgICAgICAgICB0aGlzLnJlY29yZHMuc2V0KHRva2VuLCByZWNvcmQpO1xuICAgICAgICB9XG4gICAgICAgIC8vIElmIGEgcmVjb3JkIHdhcyBmb3VuZCwgZ2V0IHRoZSBpbnN0YW5jZSBmb3IgaXQgYW5kIHJldHVybiBpdC5cbiAgICAgICAgaWYgKHJlY29yZCAhPSBudWxsIC8qIE5PVCBudWxsIHx8IHVuZGVmaW5lZCAqLykge1xuICAgICAgICAgIHJldHVybiB0aGlzLmh5ZHJhdGUodG9rZW4sIHJlY29yZCk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gU2VsZWN0IHRoZSBuZXh0IGluamVjdG9yIGJhc2VkIG9uIHRoZSBTZWxmIGZsYWcgLSBpZiBzZWxmIGlzIHNldCwgdGhlIG5leHQgaW5qZWN0b3IgaXNcbiAgICAgIC8vIHRoZSBOdWxsSW5qZWN0b3IsIG90aGVyd2lzZSBpdCdzIHRoZSBwYXJlbnQuXG4gICAgICBjb25zdCBuZXh0SW5qZWN0b3IgPSAhKGZsYWdzICYgSW5qZWN0RmxhZ3MuU2VsZikgPyB0aGlzLnBhcmVudCA6IGdldE51bGxJbmplY3RvcigpO1xuICAgICAgLy8gU2V0IHRoZSBub3RGb3VuZFZhbHVlIGJhc2VkIG9uIHRoZSBPcHRpb25hbCBmbGFnIC0gaWYgb3B0aW9uYWwgaXMgc2V0IGFuZCBub3RGb3VuZFZhbHVlXG4gICAgICAvLyBpcyB1bmRlZmluZWQsIHRoZSB2YWx1ZSBpcyBudWxsLCBvdGhlcndpc2UgaXQncyB0aGUgbm90Rm91bmRWYWx1ZS5cbiAgICAgIG5vdEZvdW5kVmFsdWUgPSAoZmxhZ3MgJiBJbmplY3RGbGFncy5PcHRpb25hbCkgJiYgbm90Rm91bmRWYWx1ZSA9PT0gVEhST1dfSUZfTk9UX0ZPVU5EID9cbiAgICAgICAgICBudWxsIDpcbiAgICAgICAgICBub3RGb3VuZFZhbHVlO1xuICAgICAgcmV0dXJuIG5leHRJbmplY3Rvci5nZXQodG9rZW4sIG5vdEZvdW5kVmFsdWUpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGlmIChlLm5hbWUgPT09ICdOdWxsSW5qZWN0b3JFcnJvcicpIHtcbiAgICAgICAgY29uc3QgcGF0aDogYW55W10gPSBlW05HX1RFTVBfVE9LRU5fUEFUSF0gPSBlW05HX1RFTVBfVE9LRU5fUEFUSF0gfHwgW107XG4gICAgICAgIHBhdGgudW5zaGlmdChzdHJpbmdpZnkodG9rZW4pKTtcbiAgICAgICAgaWYgKHByZXZpb3VzSW5qZWN0b3IpIHtcbiAgICAgICAgICAvLyBXZSBzdGlsbCBoYXZlIGEgcGFyZW50IGluamVjdG9yLCBrZWVwIHRocm93aW5nXG4gICAgICAgICAgdGhyb3cgZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBGb3JtYXQgJiB0aHJvdyB0aGUgZmluYWwgZXJyb3IgbWVzc2FnZSB3aGVuIHdlIGRvbid0IGhhdmUgYW55IHByZXZpb3VzIGluamVjdG9yXG4gICAgICAgICAgcmV0dXJuIGNhdGNoSW5qZWN0b3JFcnJvcihlLCB0b2tlbiwgJ1IzSW5qZWN0b3JFcnJvcicsIHRoaXMuc291cmNlKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgZTtcbiAgICAgIH1cbiAgICB9IGZpbmFsbHkge1xuICAgICAgLy8gTGFzdGx5LCBjbGVhbiB1cCB0aGUgc3RhdGUgYnkgcmVzdG9yaW5nIHRoZSBwcmV2aW91cyBpbmplY3Rvci5cbiAgICAgIHNldEN1cnJlbnRJbmplY3RvcihwcmV2aW91c0luamVjdG9yKTtcbiAgICB9XG4gIH1cblxuICB0b1N0cmluZygpIHtcbiAgICBjb25zdCB0b2tlbnMgPSA8c3RyaW5nW10+W10sIHJlY29yZHMgPSB0aGlzLnJlY29yZHM7XG4gICAgcmVjb3Jkcy5mb3JFYWNoKCh2LCB0b2tlbikgPT4gdG9rZW5zLnB1c2goc3RyaW5naWZ5KHRva2VuKSkpO1xuICAgIHJldHVybiBgUjNJbmplY3Rvclske3Rva2Vucy5qb2luKCcsICcpfV1gO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3NlcnROb3REZXN0cm95ZWQoKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuX2Rlc3Ryb3llZCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbmplY3RvciBoYXMgYWxyZWFkeSBiZWVuIGRlc3Ryb3llZC4nKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQWRkIGFuIGBJbmplY3RvclR5cGVgIG9yIGBJbmplY3RvclR5cGVXaXRoUHJvdmlkZXJzYCBhbmQgYWxsIG9mIGl0cyB0cmFuc2l0aXZlIHByb3ZpZGVyc1xuICAgKiB0byB0aGlzIGluamVjdG9yLlxuICAgKlxuICAgKiBJZiBhbiBgSW5qZWN0b3JUeXBlV2l0aFByb3ZpZGVyc2AgdGhhdCBkZWNsYXJlcyBwcm92aWRlcnMgYmVzaWRlcyB0aGUgdHlwZSBpcyBzcGVjaWZpZWQsXG4gICAqIHRoZSBmdW5jdGlvbiB3aWxsIHJldHVybiBcInRydWVcIiB0byBpbmRpY2F0ZSB0aGF0IHRoZSBwcm92aWRlcnMgb2YgdGhlIHR5cGUgZGVmaW5pdGlvbiBuZWVkXG4gICAqIHRvIGJlIHByb2Nlc3NlZC4gVGhpcyBhbGxvd3MgdXMgdG8gcHJvY2VzcyBwcm92aWRlcnMgb2YgaW5qZWN0b3IgdHlwZXMgYWZ0ZXIgYWxsIGltcG9ydHMgb2ZcbiAgICogYW4gaW5qZWN0b3IgZGVmaW5pdGlvbiBhcmUgcHJvY2Vzc2VkLiAoZm9sbG93aW5nIFZpZXcgRW5naW5lIHNlbWFudGljczogc2VlIEZXLTEzNDkpXG4gICAqL1xuICBwcml2YXRlIHByb2Nlc3NJbmplY3RvclR5cGUoXG4gICAgICBkZWZPcldyYXBwZWREZWY6IEluamVjdG9yVHlwZTxhbnk+fEluamVjdG9yVHlwZVdpdGhQcm92aWRlcnM8YW55PixcbiAgICAgIHBhcmVudHM6IEluamVjdG9yVHlwZTxhbnk+W10sXG4gICAgICBkZWR1cFN0YWNrOiBJbmplY3RvclR5cGU8YW55PltdKTogZGVmT3JXcmFwcGVkRGVmIGlzIEluamVjdG9yVHlwZVdpdGhQcm92aWRlcnM8YW55PiB7XG4gICAgZGVmT3JXcmFwcGVkRGVmID0gcmVzb2x2ZUZvcndhcmRSZWYoZGVmT3JXcmFwcGVkRGVmKTtcbiAgICBpZiAoIWRlZk9yV3JhcHBlZERlZikgcmV0dXJuIGZhbHNlO1xuXG4gICAgLy8gRWl0aGVyIHRoZSBkZWZPcldyYXBwZWREZWYgaXMgYW4gSW5qZWN0b3JUeXBlICh3aXRoIGluamVjdG9yIGRlZikgb3IgYW5cbiAgICAvLyBJbmplY3RvckRlZlR5cGVXaXRoUHJvdmlkZXJzIChha2EgTW9kdWxlV2l0aFByb3ZpZGVycykuIERldGVjdGluZyBlaXRoZXIgaXMgYSBtZWdhbW9ycGhpY1xuICAgIC8vIHJlYWQsIHNvIGNhcmUgaXMgdGFrZW4gdG8gb25seSBkbyB0aGUgcmVhZCBvbmNlLlxuXG4gICAgLy8gRmlyc3QgYXR0ZW1wdCB0byByZWFkIHRoZSBpbmplY3RvciBkZWYgKGDJtWluamApLlxuICAgIGxldCBkZWYgPSBnZXRJbmplY3RvckRlZihkZWZPcldyYXBwZWREZWYpO1xuXG4gICAgLy8gSWYgdGhhdCdzIG5vdCBwcmVzZW50LCB0aGVuIGF0dGVtcHQgdG8gcmVhZCBuZ01vZHVsZSBmcm9tIHRoZSBJbmplY3RvckRlZlR5cGVXaXRoUHJvdmlkZXJzLlxuICAgIGNvbnN0IG5nTW9kdWxlID1cbiAgICAgICAgKGRlZiA9PSBudWxsKSAmJiAoZGVmT3JXcmFwcGVkRGVmIGFzIEluamVjdG9yVHlwZVdpdGhQcm92aWRlcnM8YW55PikubmdNb2R1bGUgfHwgdW5kZWZpbmVkO1xuXG4gICAgLy8gRGV0ZXJtaW5lIHRoZSBJbmplY3RvclR5cGUuIEluIHRoZSBjYXNlIHdoZXJlIGBkZWZPcldyYXBwZWREZWZgIGlzIGFuIGBJbmplY3RvclR5cGVgLFxuICAgIC8vIHRoZW4gdGhpcyBpcyBlYXN5LiBJbiB0aGUgY2FzZSBvZiBhbiBJbmplY3RvckRlZlR5cGVXaXRoUHJvdmlkZXJzLCB0aGVuIHRoZSBkZWZpbml0aW9uIHR5cGVcbiAgICAvLyBpcyB0aGUgYG5nTW9kdWxlYC5cbiAgICBjb25zdCBkZWZUeXBlOiBJbmplY3RvclR5cGU8YW55PiA9XG4gICAgICAgIChuZ01vZHVsZSA9PT0gdW5kZWZpbmVkKSA/IChkZWZPcldyYXBwZWREZWYgYXMgSW5qZWN0b3JUeXBlPGFueT4pIDogbmdNb2R1bGU7XG5cbiAgICAvLyBDaGVjayBmb3IgY2lyY3VsYXIgZGVwZW5kZW5jaWVzLlxuICAgIGlmIChuZ0Rldk1vZGUgJiYgcGFyZW50cy5pbmRleE9mKGRlZlR5cGUpICE9PSAtMSkge1xuICAgICAgY29uc3QgZGVmTmFtZSA9IHN0cmluZ2lmeShkZWZUeXBlKTtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICBgQ2lyY3VsYXIgZGVwZW5kZW5jeSBpbiBESSBkZXRlY3RlZCBmb3IgdHlwZSAke2RlZk5hbWV9LiBEZXBlbmRlbmN5IHBhdGg6ICR7cGFyZW50cy5tYXAoZGVmVHlwZSA9PiBzdHJpbmdpZnkoZGVmVHlwZSkpLmpvaW4oJyA+ICcpfSA+ICR7ZGVmTmFtZX0uYCk7XG4gICAgfVxuXG4gICAgLy8gQ2hlY2sgZm9yIG11bHRpcGxlIGltcG9ydHMgb2YgdGhlIHNhbWUgbW9kdWxlXG4gICAgY29uc3QgaXNEdXBsaWNhdGUgPSBkZWR1cFN0YWNrLmluZGV4T2YoZGVmVHlwZSkgIT09IC0xO1xuXG4gICAgLy8gRmluYWxseSwgaWYgZGVmT3JXcmFwcGVkVHlwZSB3YXMgYW4gYEluamVjdG9yRGVmVHlwZVdpdGhQcm92aWRlcnNgLCB0aGVuIHRoZSBhY3R1YWxcbiAgICAvLyBgSW5qZWN0b3JEZWZgIGlzIG9uIGl0cyBgbmdNb2R1bGVgLlxuICAgIGlmIChuZ01vZHVsZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBkZWYgPSBnZXRJbmplY3RvckRlZihuZ01vZHVsZSk7XG4gICAgfVxuXG4gICAgLy8gSWYgbm8gZGVmaW5pdGlvbiB3YXMgZm91bmQsIGl0IG1pZ2h0IGJlIGZyb20gZXhwb3J0cy4gUmVtb3ZlIGl0LlxuICAgIGlmIChkZWYgPT0gbnVsbCkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIC8vIEFkZCBwcm92aWRlcnMgaW4gdGhlIHNhbWUgd2F5IHRoYXQgQE5nTW9kdWxlIHJlc29sdXRpb24gZGlkOlxuXG4gICAgLy8gRmlyc3QsIGluY2x1ZGUgcHJvdmlkZXJzIGZyb20gYW55IGltcG9ydHMuXG4gICAgaWYgKGRlZi5pbXBvcnRzICE9IG51bGwgJiYgIWlzRHVwbGljYXRlKSB7XG4gICAgICAvLyBCZWZvcmUgcHJvY2Vzc2luZyBkZWZUeXBlJ3MgaW1wb3J0cywgYWRkIGl0IHRvIHRoZSBzZXQgb2YgcGFyZW50cy4gVGhpcyB3YXksIGlmIGl0IGVuZHNcbiAgICAgIC8vIHVwIGRlZXBseSBpbXBvcnRpbmcgaXRzZWxmLCB0aGlzIGNhbiBiZSBkZXRlY3RlZC5cbiAgICAgIG5nRGV2TW9kZSAmJiBwYXJlbnRzLnB1c2goZGVmVHlwZSk7XG4gICAgICAvLyBBZGQgaXQgdG8gdGhlIHNldCBvZiBkZWR1cHMuIFRoaXMgd2F5IHdlIGNhbiBkZXRlY3QgbXVsdGlwbGUgaW1wb3J0cyBvZiB0aGUgc2FtZSBtb2R1bGVcbiAgICAgIGRlZHVwU3RhY2sucHVzaChkZWZUeXBlKTtcblxuICAgICAgbGV0IGltcG9ydFR5cGVzV2l0aFByb3ZpZGVyczogKEluamVjdG9yVHlwZVdpdGhQcm92aWRlcnM8YW55PltdKXx1bmRlZmluZWQ7XG4gICAgICB0cnkge1xuICAgICAgICBkZWVwRm9yRWFjaChkZWYuaW1wb3J0cywgaW1wb3J0ZWQgPT4ge1xuICAgICAgICAgIGlmICh0aGlzLnByb2Nlc3NJbmplY3RvclR5cGUoaW1wb3J0ZWQsIHBhcmVudHMsIGRlZHVwU3RhY2spKSB7XG4gICAgICAgICAgICBpZiAoaW1wb3J0VHlwZXNXaXRoUHJvdmlkZXJzID09PSB1bmRlZmluZWQpIGltcG9ydFR5cGVzV2l0aFByb3ZpZGVycyA9IFtdO1xuICAgICAgICAgICAgLy8gSWYgdGhlIHByb2Nlc3NlZCBpbXBvcnQgaXMgYW4gaW5qZWN0b3IgdHlwZSB3aXRoIHByb3ZpZGVycywgd2Ugc3RvcmUgaXQgaW4gdGhlXG4gICAgICAgICAgICAvLyBsaXN0IG9mIGltcG9ydCB0eXBlcyB3aXRoIHByb3ZpZGVycywgc28gdGhhdCB3ZSBjYW4gcHJvY2VzcyB0aG9zZSBhZnRlcndhcmRzLlxuICAgICAgICAgICAgaW1wb3J0VHlwZXNXaXRoUHJvdmlkZXJzLnB1c2goaW1wb3J0ZWQpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9IGZpbmFsbHkge1xuICAgICAgICAvLyBSZW1vdmUgaXQgZnJvbSB0aGUgcGFyZW50cyBzZXQgd2hlbiBmaW5pc2hlZC5cbiAgICAgICAgbmdEZXZNb2RlICYmIHBhcmVudHMucG9wKCk7XG4gICAgICB9XG5cbiAgICAgIC8vIEltcG9ydHMgd2hpY2ggYXJlIGRlY2xhcmVkIHdpdGggcHJvdmlkZXJzIChUeXBlV2l0aFByb3ZpZGVycykgbmVlZCB0byBiZSBwcm9jZXNzZWRcbiAgICAgIC8vIGFmdGVyIGFsbCBpbXBvcnRlZCBtb2R1bGVzIGFyZSBwcm9jZXNzZWQuIFRoaXMgaXMgc2ltaWxhciB0byBob3cgVmlldyBFbmdpbmVcbiAgICAgIC8vIHByb2Nlc3Nlcy9tZXJnZXMgbW9kdWxlIGltcG9ydHMgaW4gdGhlIG1ldGFkYXRhIHJlc29sdmVyLiBTZWU6IEZXLTEzNDkuXG4gICAgICBpZiAoaW1wb3J0VHlwZXNXaXRoUHJvdmlkZXJzICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBpbXBvcnRUeXBlc1dpdGhQcm92aWRlcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBjb25zdCB7bmdNb2R1bGUsIHByb3ZpZGVyc30gPSBpbXBvcnRUeXBlc1dpdGhQcm92aWRlcnNbaV07XG4gICAgICAgICAgZGVlcEZvckVhY2goXG4gICAgICAgICAgICAgIHByb3ZpZGVycyAhLFxuICAgICAgICAgICAgICBwcm92aWRlciA9PiB0aGlzLnByb2Nlc3NQcm92aWRlcihwcm92aWRlciwgbmdNb2R1bGUsIHByb3ZpZGVycyB8fCBFTVBUWV9BUlJBWSkpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIC8vIFRyYWNrIHRoZSBJbmplY3RvclR5cGUgYW5kIGFkZCBhIHByb3ZpZGVyIGZvciBpdC4gSXQncyBpbXBvcnRhbnQgdGhhdCB0aGlzIGlzIGRvbmUgYWZ0ZXIgdGhlXG4gICAgLy8gZGVmJ3MgaW1wb3J0cy5cbiAgICB0aGlzLmluamVjdG9yRGVmVHlwZXMuYWRkKGRlZlR5cGUpO1xuICAgIHRoaXMucmVjb3Jkcy5zZXQoZGVmVHlwZSwgbWFrZVJlY29yZChkZWYuZmFjdG9yeSwgTk9UX1lFVCkpO1xuXG4gICAgLy8gTmV4dCwgaW5jbHVkZSBwcm92aWRlcnMgbGlzdGVkIG9uIHRoZSBkZWZpbml0aW9uIGl0c2VsZi5cbiAgICBjb25zdCBkZWZQcm92aWRlcnMgPSBkZWYucHJvdmlkZXJzO1xuICAgIGlmIChkZWZQcm92aWRlcnMgIT0gbnVsbCAmJiAhaXNEdXBsaWNhdGUpIHtcbiAgICAgIGNvbnN0IGluamVjdG9yVHlwZSA9IGRlZk9yV3JhcHBlZERlZiBhcyBJbmplY3RvclR5cGU8YW55PjtcbiAgICAgIGRlZXBGb3JFYWNoKFxuICAgICAgICAgIGRlZlByb3ZpZGVycywgcHJvdmlkZXIgPT4gdGhpcy5wcm9jZXNzUHJvdmlkZXIocHJvdmlkZXIsIGluamVjdG9yVHlwZSwgZGVmUHJvdmlkZXJzKSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIChcbiAgICAgICAgbmdNb2R1bGUgIT09IHVuZGVmaW5lZCAmJlxuICAgICAgICAoZGVmT3JXcmFwcGVkRGVmIGFzIEluamVjdG9yVHlwZVdpdGhQcm92aWRlcnM8YW55PikucHJvdmlkZXJzICE9PSB1bmRlZmluZWQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFByb2Nlc3MgYSBgU2luZ2xlUHJvdmlkZXJgIGFuZCBhZGQgaXQuXG4gICAqL1xuICBwcml2YXRlIHByb2Nlc3NQcm92aWRlcihcbiAgICAgIHByb3ZpZGVyOiBTaW5nbGVQcm92aWRlciwgbmdNb2R1bGVUeXBlOiBJbmplY3RvclR5cGU8YW55PiwgcHJvdmlkZXJzOiBhbnlbXSk6IHZvaWQge1xuICAgIC8vIERldGVybWluZSB0aGUgdG9rZW4gZnJvbSB0aGUgcHJvdmlkZXIuIEVpdGhlciBpdCdzIGl0cyBvd24gdG9rZW4sIG9yIGhhcyBhIHtwcm92aWRlOiAuLi59XG4gICAgLy8gcHJvcGVydHkuXG4gICAgcHJvdmlkZXIgPSByZXNvbHZlRm9yd2FyZFJlZihwcm92aWRlcik7XG4gICAgbGV0IHRva2VuOiBhbnkgPVxuICAgICAgICBpc1R5cGVQcm92aWRlcihwcm92aWRlcikgPyBwcm92aWRlciA6IHJlc29sdmVGb3J3YXJkUmVmKHByb3ZpZGVyICYmIHByb3ZpZGVyLnByb3ZpZGUpO1xuXG4gICAgLy8gQ29uc3RydWN0IGEgYFJlY29yZGAgZm9yIHRoZSBwcm92aWRlci5cbiAgICBjb25zdCByZWNvcmQgPSBwcm92aWRlclRvUmVjb3JkKHByb3ZpZGVyLCBuZ01vZHVsZVR5cGUsIHByb3ZpZGVycyk7XG5cbiAgICBpZiAoIWlzVHlwZVByb3ZpZGVyKHByb3ZpZGVyKSAmJiBwcm92aWRlci5tdWx0aSA9PT0gdHJ1ZSkge1xuICAgICAgLy8gSWYgdGhlIHByb3ZpZGVyIGluZGljYXRlcyB0aGF0IGl0J3MgYSBtdWx0aS1wcm92aWRlciwgcHJvY2VzcyBpdCBzcGVjaWFsbHkuXG4gICAgICAvLyBGaXJzdCBjaGVjayB3aGV0aGVyIGl0J3MgYmVlbiBkZWZpbmVkIGFscmVhZHkuXG4gICAgICBsZXQgbXVsdGlSZWNvcmQgPSB0aGlzLnJlY29yZHMuZ2V0KHRva2VuKTtcbiAgICAgIGlmIChtdWx0aVJlY29yZCkge1xuICAgICAgICAvLyBJdCBoYXMuIFRocm93IGEgbmljZSBlcnJvciBpZlxuICAgICAgICBpZiAobXVsdGlSZWNvcmQubXVsdGkgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIHRocm93TWl4ZWRNdWx0aVByb3ZpZGVyRXJyb3IoKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbXVsdGlSZWNvcmQgPSBtYWtlUmVjb3JkKHVuZGVmaW5lZCwgTk9UX1lFVCwgdHJ1ZSk7XG4gICAgICAgIG11bHRpUmVjb3JkLmZhY3RvcnkgPSAoKSA9PiBpbmplY3RBcmdzKG11bHRpUmVjb3JkICEubXVsdGkgISk7XG4gICAgICAgIHRoaXMucmVjb3Jkcy5zZXQodG9rZW4sIG11bHRpUmVjb3JkKTtcbiAgICAgIH1cbiAgICAgIHRva2VuID0gcHJvdmlkZXI7XG4gICAgICBtdWx0aVJlY29yZC5tdWx0aSAhLnB1c2gocHJvdmlkZXIpO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBleGlzdGluZyA9IHRoaXMucmVjb3Jkcy5nZXQodG9rZW4pO1xuICAgICAgaWYgKGV4aXN0aW5nICYmIGV4aXN0aW5nLm11bHRpICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgdGhyb3dNaXhlZE11bHRpUHJvdmlkZXJFcnJvcigpO1xuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLnJlY29yZHMuc2V0KHRva2VuLCByZWNvcmQpO1xuICB9XG5cbiAgcHJpdmF0ZSBoeWRyYXRlPFQ+KHRva2VuOiBUeXBlPFQ+fEluamVjdGlvblRva2VuPFQ+LCByZWNvcmQ6IFJlY29yZDxUPik6IFQge1xuICAgIGlmIChyZWNvcmQudmFsdWUgPT09IENJUkNVTEFSKSB7XG4gICAgICB0aHJvd0N5Y2xpY0RlcGVuZGVuY3lFcnJvcihzdHJpbmdpZnkodG9rZW4pKTtcbiAgICB9IGVsc2UgaWYgKHJlY29yZC52YWx1ZSA9PT0gTk9UX1lFVCkge1xuICAgICAgcmVjb3JkLnZhbHVlID0gQ0lSQ1VMQVI7XG4gICAgICByZWNvcmQudmFsdWUgPSByZWNvcmQuZmFjdG9yeSAhKCk7XG4gICAgfVxuICAgIGlmICh0eXBlb2YgcmVjb3JkLnZhbHVlID09PSAnb2JqZWN0JyAmJiByZWNvcmQudmFsdWUgJiYgaGFzT25EZXN0cm95KHJlY29yZC52YWx1ZSkpIHtcbiAgICAgIHRoaXMub25EZXN0cm95LmFkZChyZWNvcmQudmFsdWUpO1xuICAgIH1cbiAgICByZXR1cm4gcmVjb3JkLnZhbHVlIGFzIFQ7XG4gIH1cblxuICBwcml2YXRlIGluamVjdGFibGVEZWZJblNjb3BlKGRlZjogybXJtUluamVjdGFibGVEZWY8YW55Pik6IGJvb2xlYW4ge1xuICAgIGlmICghZGVmLnByb3ZpZGVkSW4pIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBkZWYucHJvdmlkZWRJbiA9PT0gJ3N0cmluZycpIHtcbiAgICAgIHJldHVybiBkZWYucHJvdmlkZWRJbiA9PT0gJ2FueScgfHwgKGRlZi5wcm92aWRlZEluID09PSB0aGlzLnNjb3BlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHRoaXMuaW5qZWN0b3JEZWZUeXBlcy5oYXMoZGVmLnByb3ZpZGVkSW4pO1xuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBpbmplY3RhYmxlRGVmT3JJbmplY3RvckRlZkZhY3RvcnkodG9rZW46IFR5cGU8YW55PnwgSW5qZWN0aW9uVG9rZW48YW55Pik6IEZhY3RvcnlGbjxhbnk+IHtcbiAgLy8gTW9zdCB0b2tlbnMgd2lsbCBoYXZlIGFuIGluamVjdGFibGUgZGVmIGRpcmVjdGx5IG9uIHRoZW0sIHdoaWNoIHNwZWNpZmllcyBhIGZhY3RvcnkgZGlyZWN0bHkuXG4gIGNvbnN0IGluamVjdGFibGVEZWYgPSBnZXRJbmplY3RhYmxlRGVmKHRva2VuKTtcbiAgY29uc3QgZmFjdG9yeSA9IGluamVjdGFibGVEZWYgIT09IG51bGwgPyBpbmplY3RhYmxlRGVmLmZhY3RvcnkgOiBnZXRGYWN0b3J5RGVmKHRva2VuKTtcblxuICBpZiAoZmFjdG9yeSAhPT0gbnVsbCkge1xuICAgIHJldHVybiBmYWN0b3J5O1xuICB9XG5cbiAgLy8gSWYgdGhlIHRva2VuIGlzIGFuIE5nTW9kdWxlLCBpdCdzIGFsc28gaW5qZWN0YWJsZSBidXQgdGhlIGZhY3RvcnkgaXMgb24gaXRzIGluamVjdG9yIGRlZlxuICAvLyAoYMm1aW5qYClcbiAgY29uc3QgaW5qZWN0b3JEZWYgPSBnZXRJbmplY3RvckRlZih0b2tlbik7XG4gIGlmIChpbmplY3RvckRlZiAhPT0gbnVsbCkge1xuICAgIHJldHVybiBpbmplY3RvckRlZi5mYWN0b3J5O1xuICB9XG5cbiAgLy8gSW5qZWN0aW9uVG9rZW5zIHNob3VsZCBoYXZlIGFuIGluamVjdGFibGUgZGVmICjJtXByb3YpIGFuZCB0aHVzIHNob3VsZCBiZSBoYW5kbGVkIGFib3ZlLlxuICAvLyBJZiBpdCdzIG1pc3NpbmcgdGhhdCwgaXQncyBhbiBlcnJvci5cbiAgaWYgKHRva2VuIGluc3RhbmNlb2YgSW5qZWN0aW9uVG9rZW4pIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYFRva2VuICR7c3RyaW5naWZ5KHRva2VuKX0gaXMgbWlzc2luZyBhIMm1cHJvdiBkZWZpbml0aW9uLmApO1xuICB9XG5cbiAgLy8gVW5kZWNvcmF0ZWQgdHlwZXMgY2FuIHNvbWV0aW1lcyBiZSBjcmVhdGVkIGlmIHRoZXkgaGF2ZSBubyBjb25zdHJ1Y3RvciBhcmd1bWVudHMuXG4gIGlmICh0b2tlbiBpbnN0YW5jZW9mIEZ1bmN0aW9uKSB7XG4gICAgcmV0dXJuIGdldFVuZGVjb3JhdGVkSW5qZWN0YWJsZUZhY3RvcnkodG9rZW4pO1xuICB9XG5cbiAgLy8gVGhlcmUgd2FzIG5vIHdheSB0byByZXNvbHZlIGEgZmFjdG9yeSBmb3IgdGhpcyB0b2tlbi5cbiAgdGhyb3cgbmV3IEVycm9yKCd1bnJlYWNoYWJsZScpO1xufVxuXG5mdW5jdGlvbiBnZXRVbmRlY29yYXRlZEluamVjdGFibGVGYWN0b3J5KHRva2VuOiBGdW5jdGlvbikge1xuICAvLyBJZiB0aGUgdG9rZW4gaGFzIHBhcmFtZXRlcnMgdGhlbiBpdCBoYXMgZGVwZW5kZW5jaWVzIHRoYXQgd2UgY2Fubm90IHJlc29sdmUgaW1wbGljaXRseS5cbiAgY29uc3QgcGFyYW1MZW5ndGggPSB0b2tlbi5sZW5ndGg7XG4gIGlmIChwYXJhbUxlbmd0aCA+IDApIHtcbiAgICBjb25zdCBhcmdzOiBzdHJpbmdbXSA9IG5ld0FycmF5KHBhcmFtTGVuZ3RoLCAnPycpO1xuICAgIHRocm93IG5ldyBFcnJvcihgQ2FuJ3QgcmVzb2x2ZSBhbGwgcGFyYW1ldGVycyBmb3IgJHtzdHJpbmdpZnkodG9rZW4pfTogKCR7YXJncy5qb2luKCcsICcpfSkuYCk7XG4gIH1cblxuICAvLyBUaGUgY29uc3RydWN0b3IgZnVuY3Rpb24gYXBwZWFycyB0byBoYXZlIG5vIHBhcmFtZXRlcnMuXG4gIC8vIFRoaXMgbWlnaHQgYmUgYmVjYXVzZSBpdCBpbmhlcml0cyBmcm9tIGEgc3VwZXItY2xhc3MuIEluIHdoaWNoIGNhc2UsIHVzZSBhbiBpbmplY3RhYmxlXG4gIC8vIGRlZiBmcm9tIGFuIGFuY2VzdG9yIGlmIHRoZXJlIGlzIG9uZS5cbiAgLy8gT3RoZXJ3aXNlIHRoaXMgcmVhbGx5IGlzIGEgc2ltcGxlIGNsYXNzIHdpdGggbm8gZGVwZW5kZW5jaWVzLCBzbyByZXR1cm4gYSBmYWN0b3J5IHRoYXRcbiAgLy8ganVzdCBpbnN0YW50aWF0ZXMgdGhlIHplcm8tYXJnIGNvbnN0cnVjdG9yLlxuICBjb25zdCBpbmhlcml0ZWRJbmplY3RhYmxlRGVmID0gZ2V0SW5oZXJpdGVkSW5qZWN0YWJsZURlZih0b2tlbik7XG4gIGlmIChpbmhlcml0ZWRJbmplY3RhYmxlRGVmICE9PSBudWxsKSB7XG4gICAgcmV0dXJuICgpID0+IGluaGVyaXRlZEluamVjdGFibGVEZWYuZmFjdG9yeSh0b2tlbiBhcyBUeXBlPGFueT4pO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiAoKSA9PiBuZXcgKHRva2VuIGFzIFR5cGU8YW55PikoKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBwcm92aWRlclRvUmVjb3JkKFxuICAgIHByb3ZpZGVyOiBTaW5nbGVQcm92aWRlciwgbmdNb2R1bGVUeXBlOiBJbmplY3RvclR5cGU8YW55PiwgcHJvdmlkZXJzOiBhbnlbXSk6IFJlY29yZDxhbnk+IHtcbiAgaWYgKGlzVmFsdWVQcm92aWRlcihwcm92aWRlcikpIHtcbiAgICByZXR1cm4gbWFrZVJlY29yZCh1bmRlZmluZWQsIHByb3ZpZGVyLnVzZVZhbHVlKTtcbiAgfSBlbHNlIHtcbiAgICBjb25zdCBmYWN0b3J5OiAoKCkgPT4gYW55KXx1bmRlZmluZWQgPSBwcm92aWRlclRvRmFjdG9yeShwcm92aWRlciwgbmdNb2R1bGVUeXBlLCBwcm92aWRlcnMpO1xuICAgIHJldHVybiBtYWtlUmVjb3JkKGZhY3RvcnksIE5PVF9ZRVQpO1xuICB9XG59XG5cbi8qKlxuICogQ29udmVydHMgYSBgU2luZ2xlUHJvdmlkZXJgIGludG8gYSBmYWN0b3J5IGZ1bmN0aW9uLlxuICpcbiAqIEBwYXJhbSBwcm92aWRlciBwcm92aWRlciB0byBjb252ZXJ0IHRvIGZhY3RvcnlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHByb3ZpZGVyVG9GYWN0b3J5KFxuICAgIHByb3ZpZGVyOiBTaW5nbGVQcm92aWRlciwgbmdNb2R1bGVUeXBlPzogSW5qZWN0b3JUeXBlPGFueT4sIHByb3ZpZGVycz86IGFueVtdKTogKCkgPT4gYW55IHtcbiAgbGV0IGZhY3Rvcnk6ICgoKSA9PiBhbnkpfHVuZGVmaW5lZCA9IHVuZGVmaW5lZDtcbiAgaWYgKGlzVHlwZVByb3ZpZGVyKHByb3ZpZGVyKSkge1xuICAgIGNvbnN0IHVud3JhcHBlZFByb3ZpZGVyID0gcmVzb2x2ZUZvcndhcmRSZWYocHJvdmlkZXIpO1xuICAgIHJldHVybiBnZXRGYWN0b3J5RGVmKHVud3JhcHBlZFByb3ZpZGVyKSB8fCBpbmplY3RhYmxlRGVmT3JJbmplY3RvckRlZkZhY3RvcnkodW53cmFwcGVkUHJvdmlkZXIpO1xuICB9IGVsc2Uge1xuICAgIGlmIChpc1ZhbHVlUHJvdmlkZXIocHJvdmlkZXIpKSB7XG4gICAgICBmYWN0b3J5ID0gKCkgPT4gcmVzb2x2ZUZvcndhcmRSZWYocHJvdmlkZXIudXNlVmFsdWUpO1xuICAgIH0gZWxzZSBpZiAoaXNGYWN0b3J5UHJvdmlkZXIocHJvdmlkZXIpKSB7XG4gICAgICBmYWN0b3J5ID0gKCkgPT4gcHJvdmlkZXIudXNlRmFjdG9yeSguLi5pbmplY3RBcmdzKHByb3ZpZGVyLmRlcHMgfHwgW10pKTtcbiAgICB9IGVsc2UgaWYgKGlzRXhpc3RpbmdQcm92aWRlcihwcm92aWRlcikpIHtcbiAgICAgIGZhY3RvcnkgPSAoKSA9PiDJtcm1aW5qZWN0KHJlc29sdmVGb3J3YXJkUmVmKHByb3ZpZGVyLnVzZUV4aXN0aW5nKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IGNsYXNzUmVmID0gcmVzb2x2ZUZvcndhcmRSZWYoXG4gICAgICAgICAgcHJvdmlkZXIgJiZcbiAgICAgICAgICAoKHByb3ZpZGVyIGFzIFN0YXRpY0NsYXNzUHJvdmlkZXIgfCBDbGFzc1Byb3ZpZGVyKS51c2VDbGFzcyB8fCBwcm92aWRlci5wcm92aWRlKSk7XG4gICAgICBpZiAoIWNsYXNzUmVmKSB7XG4gICAgICAgIHRocm93SW52YWxpZFByb3ZpZGVyRXJyb3IobmdNb2R1bGVUeXBlLCBwcm92aWRlcnMsIHByb3ZpZGVyKTtcbiAgICAgIH1cbiAgICAgIGlmIChoYXNEZXBzKHByb3ZpZGVyKSkge1xuICAgICAgICBmYWN0b3J5ID0gKCkgPT4gbmV3IChjbGFzc1JlZikoLi4uaW5qZWN0QXJncyhwcm92aWRlci5kZXBzKSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gZ2V0RmFjdG9yeURlZihjbGFzc1JlZikgfHwgaW5qZWN0YWJsZURlZk9ySW5qZWN0b3JEZWZGYWN0b3J5KGNsYXNzUmVmKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIGZhY3Rvcnk7XG59XG5cbmZ1bmN0aW9uIG1ha2VSZWNvcmQ8VD4oXG4gICAgZmFjdG9yeTogKCgpID0+IFQpIHwgdW5kZWZpbmVkLCB2YWx1ZTogVCB8IHt9LCBtdWx0aTogYm9vbGVhbiA9IGZhbHNlKTogUmVjb3JkPFQ+IHtcbiAgcmV0dXJuIHtcbiAgICBmYWN0b3J5OiBmYWN0b3J5LFxuICAgIHZhbHVlOiB2YWx1ZSxcbiAgICBtdWx0aTogbXVsdGkgPyBbXSA6IHVuZGVmaW5lZCxcbiAgfTtcbn1cblxuZnVuY3Rpb24gaXNWYWx1ZVByb3ZpZGVyKHZhbHVlOiBTaW5nbGVQcm92aWRlcik6IHZhbHVlIGlzIFZhbHVlUHJvdmlkZXIge1xuICByZXR1cm4gdmFsdWUgIT09IG51bGwgJiYgdHlwZW9mIHZhbHVlID09ICdvYmplY3QnICYmIFVTRV9WQUxVRSBpbiB2YWx1ZTtcbn1cblxuZnVuY3Rpb24gaXNFeGlzdGluZ1Byb3ZpZGVyKHZhbHVlOiBTaW5nbGVQcm92aWRlcik6IHZhbHVlIGlzIEV4aXN0aW5nUHJvdmlkZXIge1xuICByZXR1cm4gISEodmFsdWUgJiYgKHZhbHVlIGFzIEV4aXN0aW5nUHJvdmlkZXIpLnVzZUV4aXN0aW5nKTtcbn1cblxuZnVuY3Rpb24gaXNGYWN0b3J5UHJvdmlkZXIodmFsdWU6IFNpbmdsZVByb3ZpZGVyKTogdmFsdWUgaXMgRmFjdG9yeVByb3ZpZGVyIHtcbiAgcmV0dXJuICEhKHZhbHVlICYmICh2YWx1ZSBhcyBGYWN0b3J5UHJvdmlkZXIpLnVzZUZhY3RvcnkpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNUeXBlUHJvdmlkZXIodmFsdWU6IFNpbmdsZVByb3ZpZGVyKTogdmFsdWUgaXMgVHlwZVByb3ZpZGVyIHtcbiAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PT0gJ2Z1bmN0aW9uJztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzQ2xhc3NQcm92aWRlcih2YWx1ZTogU2luZ2xlUHJvdmlkZXIpOiB2YWx1ZSBpcyBDbGFzc1Byb3ZpZGVyIHtcbiAgcmV0dXJuICEhKHZhbHVlIGFzIFN0YXRpY0NsYXNzUHJvdmlkZXIgfCBDbGFzc1Byb3ZpZGVyKS51c2VDbGFzcztcbn1cblxuZnVuY3Rpb24gaGFzRGVwcyh2YWx1ZTogQ2xhc3NQcm92aWRlciB8IENvbnN0cnVjdG9yUHJvdmlkZXIgfCBTdGF0aWNDbGFzc1Byb3ZpZGVyKTpcbiAgICB2YWx1ZSBpcyBDbGFzc1Byb3ZpZGVyJntkZXBzOiBhbnlbXX0ge1xuICByZXR1cm4gISEodmFsdWUgYXMgYW55KS5kZXBzO1xufVxuXG5mdW5jdGlvbiBoYXNPbkRlc3Ryb3kodmFsdWU6IGFueSk6IHZhbHVlIGlzIE9uRGVzdHJveSB7XG4gIHJldHVybiB2YWx1ZSAhPT0gbnVsbCAmJiB0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnICYmXG4gICAgICB0eXBlb2YodmFsdWUgYXMgT25EZXN0cm95KS5uZ09uRGVzdHJveSA9PT0gJ2Z1bmN0aW9uJztcbn1cblxuZnVuY3Rpb24gY291bGRCZUluamVjdGFibGVUeXBlKHZhbHVlOiBhbnkpOiB2YWx1ZSBpcyBUeXBlPGFueT58SW5qZWN0aW9uVG9rZW48YW55PiB7XG4gIHJldHVybiAodHlwZW9mIHZhbHVlID09PSAnZnVuY3Rpb24nKSB8fFxuICAgICAgKHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcgJiYgdmFsdWUgaW5zdGFuY2VvZiBJbmplY3Rpb25Ub2tlbik7XG59XG4iXX0=