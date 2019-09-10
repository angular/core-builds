/**
 * @fileoverview added by tsickle
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
                    // No record, but maybe the token is scoped to this injector. Look for an ngInjectableDef
                    // with a scope matching this injector.
                    /** @type {?} */
                    const def = couldBeInjectableType(token) && getInjectableDef(token);
                    if (def && this.injectableDefInScope(def)) {
                        // Found an ngInjectableDef and it's scoped to this injector. Pretend as if it was here
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
            return nextInjector.get(token, flags & InjectFlags.Optional ? null : notFoundValue);
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
        // Either the defOrWrappedDef is an InjectorType (with ngInjectorDef) or an
        // InjectorDefTypeWithProviders (aka ModuleWithProviders). Detecting either is a megamorphic
        // read, so care is taken to only do the read once.
        // First attempt to read the ngInjectorDef.
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
        // Track the InjectorType and add a provider for it.
        this.injectorDefTypes.add(defType);
        this.records.set(defType, makeRecord(def.factory, NOT_YET));
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
    // Most tokens will have an ngInjectableDef directly on them, which specifies a factory directly.
    /** @type {?} */
    const injectableDef = getInjectableDef(token);
    /** @type {?} */
    const factory = injectableDef !== null ? injectableDef.factory : getFactoryDef(token);
    if (factory !== null) {
        return factory;
    }
    // If the token is an NgModule, it's also injectable but the factory is on its ngInjectorDef.
    /** @type {?} */
    const injectorDef = getInjectorDef(token);
    if (injectorDef !== null) {
        return injectorDef.factory;
    }
    // InjectionTokens should have an ngInjectableDef and thus should be handled above.
    // If it's missing that, it's an error.
    if (token instanceof InjectionToken) {
        throw new Error(`Token ${stringify(token)} is missing an ngInjectableDef definition.`);
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
    // This might be because it inherits from a super-class. In which case, use an ngInjectableDef
    // from an ancestor if there is one.
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
    /** @type {?} */
    let factory = providerToFactory(provider, ngModuleType, providers);
    if (isValueProvider(provider)) {
        return makeRecord(undefined, provider.useValue);
    }
    else {
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
        return injectableDefOrInjectorDefFactory(resolveForwardRef(provider));
    }
    else {
        if (isValueProvider(provider)) {
            factory = (/**
             * @return {?}
             */
            () => resolveForwardRef(provider.useValue));
        }
        else if (isExistingProvider(provider)) {
            factory = (/**
             * @return {?}
             */
            () => ɵɵinject(resolveForwardRef(provider.useExisting)));
        }
        else if (isFactoryProvider(provider)) {
            factory = (/**
             * @return {?}
             */
            () => provider.useFactory(...injectArgs(provider.deps || [])));
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
                return injectableDefOrInjectorDefFactory(classRef);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicjNfaW5qZWN0b3IuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9kaS9yM19pbmplY3Rvci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQVFBLE9BQU8scUJBQXFCLENBQUM7QUFJN0IsT0FBTyxFQUFDLGFBQWEsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQ3BELE9BQU8sRUFBQywwQkFBMEIsRUFBRSx5QkFBeUIsRUFBRSw0QkFBNEIsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQ3RILE9BQU8sRUFBQyxXQUFXLEVBQUUsUUFBUSxFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFDMUQsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQzVDLE9BQU8sRUFBQyxpQkFBaUIsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUNoRCxPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFFakQsT0FBTyxFQUFDLFFBQVEsRUFBRSxrQkFBa0IsRUFBRSxZQUFZLEVBQUUsa0JBQWtCLEVBQUUsU0FBUyxFQUFFLGtCQUFrQixFQUFFLFVBQVUsRUFBRSxrQkFBa0IsRUFBRSxRQUFRLEVBQUMsTUFBTSwwQkFBMEIsQ0FBQztBQUNqTCxPQUFPLEVBQTBDLHlCQUF5QixFQUFFLGdCQUFnQixFQUFFLGNBQWMsRUFBa0IsTUFBTSxrQkFBa0IsQ0FBQztBQUN2SixPQUFPLEVBQUMsV0FBVyxFQUFDLE1BQU0sc0JBQXNCLENBQUM7QUFFakQsT0FBTyxFQUFDLGNBQWMsRUFBQyxNQUFNLFNBQVMsQ0FBQzs7Ozs7TUFhakMsT0FBTyxHQUFHLEVBQUU7Ozs7Ozs7OztNQVNaLFFBQVEsR0FBRyxFQUFFOztNQUViLFdBQVcsR0FBRyxtQkFBQSxFQUFFLEVBQVM7Ozs7O0lBSzNCLGFBQWEsR0FBdUIsU0FBUzs7OztBQUVqRCxTQUFTLGVBQWU7SUFDdEIsSUFBSSxhQUFhLEtBQUssU0FBUyxFQUFFO1FBQy9CLGFBQWEsR0FBRyxJQUFJLFlBQVksRUFBRSxDQUFDO0tBQ3BDO0lBQ0QsT0FBTyxhQUFhLENBQUM7QUFDdkIsQ0FBQzs7Ozs7OztBQU1ELHFCQUlDOzs7SUFIQyx5QkFBNkI7O0lBQzdCLHVCQUFZOztJQUNaLHVCQUF1Qjs7Ozs7Ozs7Ozs7O0FBUXpCLE1BQU0sVUFBVSxjQUFjLENBQzFCLE9BQW9DLEVBQUUsU0FBMEIsSUFBSSxFQUNwRSxzQkFBK0MsSUFBSSxFQUFFLElBQWE7SUFDcEUsTUFBTSxHQUFHLE1BQU0sSUFBSSxlQUFlLEVBQUUsQ0FBQztJQUNyQyxPQUFPLElBQUksVUFBVSxDQUFDLE9BQU8sRUFBRSxtQkFBbUIsRUFBRSxNQUFNLEVBQUUsSUFBSSxDQUFDLENBQUM7QUFDcEUsQ0FBQztBQUVELE1BQU0sT0FBTyxVQUFVOzs7Ozs7O0lBZ0NyQixZQUNJLEdBQXNCLEVBQUUsbUJBQTBDLEVBQVcsTUFBZ0IsRUFDN0YsU0FBc0IsSUFBSTtRQURtRCxXQUFNLEdBQU4sTUFBTSxDQUFVOzs7Ozs7UUEzQnpGLFlBQU8sR0FBRyxJQUFJLEdBQUcsRUFBbUQsQ0FBQzs7OztRQUtyRSxxQkFBZ0IsR0FBRyxJQUFJLEdBQUcsRUFBcUIsQ0FBQzs7OztRQUtoRCxjQUFTLEdBQUcsSUFBSSxHQUFHLEVBQWEsQ0FBQztRQWNqQyxlQUFVLEdBQUcsS0FBSyxDQUFDOztjQUtuQixVQUFVLEdBQXdCLEVBQUU7UUFFMUMsa0ZBQWtGO1FBQ2xGLDBGQUEwRjtRQUMxRiwyRkFBMkY7UUFDM0YsbUJBQW1CLElBQUksV0FBVyxDQUNQLG1CQUFtQjs7OztRQUFFLFFBQVEsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FDNUIsUUFBUSxFQUFFLEdBQUcsRUFBRSxtQkFBbUIsQ0FBQyxFQUFDLENBQUM7UUFFekYsV0FBVyxDQUFDLENBQUMsR0FBRyxDQUFDOzs7O1FBQUUsV0FBVyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsbUJBQW1CLENBQUMsV0FBVyxFQUFFLEVBQUUsRUFBRSxVQUFVLENBQUMsRUFBQyxDQUFDO1FBRXpGLHVEQUF1RDtRQUN2RCxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsVUFBVSxDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDOzs7O2NBSWxELE1BQU0sR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxjQUFjLENBQUM7UUFDL0MsSUFBSSxDQUFDLEtBQUssR0FBRyxNQUFNLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7UUFFbEQsMkRBQTJEO1FBQzNELElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPOzs7O1FBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxFQUFDLENBQUM7UUFFNUQsa0NBQWtDO1FBQ2xDLElBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxJQUFJLENBQUMsT0FBTyxHQUFHLEtBQUssUUFBUSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO0lBQzVFLENBQUM7Ozs7O0lBOUJELElBQUksU0FBUyxLQUFjLE9BQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7Ozs7Ozs7O0lBc0NwRCxPQUFPO1FBQ0wsSUFBSSxDQUFDLGtCQUFrQixFQUFFLENBQUM7UUFFMUIsMEVBQTBFO1FBQzFFLElBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDO1FBQ3ZCLElBQUk7WUFDRixnQ0FBZ0M7WUFDaEMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPOzs7O1lBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsV0FBVyxFQUFFLEVBQUMsQ0FBQztTQUMxRDtnQkFBUztZQUNSLDBCQUEwQjtZQUMxQixJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxDQUFDO1lBQ3JCLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxFQUFFLENBQUM7WUFDdkIsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEtBQUssRUFBRSxDQUFDO1NBQy9CO0lBQ0gsQ0FBQzs7Ozs7Ozs7SUFFRCxHQUFHLENBQ0MsS0FBZ0MsRUFBRSxnQkFBcUIsa0JBQWtCLEVBQ3pFLEtBQUssR0FBRyxXQUFXLENBQUMsT0FBTztRQUM3QixJQUFJLENBQUMsa0JBQWtCLEVBQUUsQ0FBQzs7O2NBRXBCLGdCQUFnQixHQUFHLGtCQUFrQixDQUFDLElBQUksQ0FBQztRQUNqRCxJQUFJO1lBQ0YsK0JBQStCO1lBQy9CLElBQUksQ0FBQyxDQUFDLEtBQUssR0FBRyxXQUFXLENBQUMsUUFBUSxDQUFDLEVBQUU7OztvQkFFL0IsTUFBTSxHQUE2QixJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUM7Z0JBQzlELElBQUksTUFBTSxLQUFLLFNBQVMsRUFBRTs7OzswQkFHbEIsR0FBRyxHQUFHLHFCQUFxQixDQUFDLEtBQUssQ0FBQyxJQUFJLGdCQUFnQixDQUFDLEtBQUssQ0FBQztvQkFDbkUsSUFBSSxHQUFHLElBQUksSUFBSSxDQUFDLG9CQUFvQixDQUFDLEdBQUcsQ0FBQyxFQUFFO3dCQUN6Qyx1RkFBdUY7d0JBQ3ZGLGFBQWE7d0JBQ2IsTUFBTSxHQUFHLFVBQVUsQ0FBQyxpQ0FBaUMsQ0FBQyxLQUFLLENBQUMsRUFBRSxPQUFPLENBQUMsQ0FBQztxQkFDeEU7eUJBQU07d0JBQ0wsTUFBTSxHQUFHLElBQUksQ0FBQztxQkFDZjtvQkFDRCxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLENBQUM7aUJBQ2pDO2dCQUNELGdFQUFnRTtnQkFDaEUsSUFBSSxNQUFNLElBQUksSUFBSSxDQUFDLDJCQUEyQixFQUFFO29CQUM5QyxPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxDQUFDO2lCQUNwQzthQUNGOzs7O2tCQUlLLFlBQVksR0FBRyxDQUFDLENBQUMsS0FBSyxHQUFHLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsZUFBZSxFQUFFO1lBQ2xGLE9BQU8sWUFBWSxDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUUsS0FBSyxHQUFHLFdBQVcsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsYUFBYSxDQUFDLENBQUM7U0FDckY7UUFBQyxPQUFPLENBQUMsRUFBRTtZQUNWLElBQUksQ0FBQyxDQUFDLElBQUksS0FBSyxtQkFBbUIsRUFBRTs7c0JBQzVCLElBQUksR0FBVSxDQUFDLENBQUMsa0JBQWtCLENBQUMsR0FBRyxDQUFDLENBQUMsa0JBQWtCLENBQUMsSUFBSSxFQUFFO2dCQUN2RSxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO2dCQUMvQixJQUFJLGdCQUFnQixFQUFFO29CQUNwQixpREFBaUQ7b0JBQ2pELE1BQU0sQ0FBQyxDQUFDO2lCQUNUO3FCQUFNO29CQUNMLGtGQUFrRjtvQkFDbEYsT0FBTyxrQkFBa0IsQ0FBQyxDQUFDLEVBQUUsS0FBSyxFQUFFLGlCQUFpQixFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztpQkFDckU7YUFDRjtpQkFBTTtnQkFDTCxNQUFNLENBQUMsQ0FBQzthQUNUO1NBQ0Y7Z0JBQVM7WUFDUixpRUFBaUU7WUFDakUsa0JBQWtCLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztTQUN0QztJQUNILENBQUM7Ozs7SUFFRCxRQUFROztjQUNBLE1BQU0sR0FBRyxtQkFBVSxFQUFFLEVBQUE7O2NBQUUsT0FBTyxHQUFHLElBQUksQ0FBQyxPQUFPO1FBQ25ELE9BQU8sQ0FBQyxPQUFPOzs7OztRQUFDLENBQUMsQ0FBQyxFQUFFLEtBQUssRUFBRSxFQUFFLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBQyxDQUFDO1FBQzdELE9BQU8sY0FBYyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUM7SUFDNUMsQ0FBQzs7Ozs7SUFFTyxrQkFBa0I7UUFDeEIsSUFBSSxJQUFJLENBQUMsVUFBVSxFQUFFO1lBQ25CLE1BQU0sSUFBSSxLQUFLLENBQUMsc0NBQXNDLENBQUMsQ0FBQztTQUN6RDtJQUNILENBQUM7Ozs7Ozs7Ozs7Ozs7OztJQVdPLG1CQUFtQixDQUN2QixlQUFpRSxFQUNqRSxPQUE0QixFQUM1QixVQUErQjtRQUNqQyxlQUFlLEdBQUcsaUJBQWlCLENBQUMsZUFBZSxDQUFDLENBQUM7UUFDckQsSUFBSSxDQUFDLGVBQWU7WUFBRSxPQUFPLEtBQUssQ0FBQzs7Ozs7O1lBTy9CLEdBQUcsR0FBRyxjQUFjLENBQUMsZUFBZSxDQUFDOzs7Y0FHbkMsUUFBUSxHQUNWLENBQUMsR0FBRyxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsbUJBQUEsZUFBZSxFQUFrQyxDQUFDLENBQUMsUUFBUSxJQUFJLFNBQVM7Ozs7O2NBS3hGLE9BQU8sR0FDVCxDQUFDLFFBQVEsS0FBSyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxtQkFBQSxlQUFlLEVBQXFCLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUTtRQUVoRixtQ0FBbUM7UUFDbkMsSUFBSSxTQUFTLElBQUksT0FBTyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRTs7a0JBQzFDLE9BQU8sR0FBRyxTQUFTLENBQUMsT0FBTyxDQUFDO1lBQ2xDLE1BQU0sSUFBSSxLQUFLLENBQ1gsK0NBQStDLE9BQU8sc0JBQXNCLE9BQU8sQ0FBQyxHQUFHOzs7O1lBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLEVBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sT0FBTyxHQUFHLENBQUMsQ0FBQztTQUN6Sjs7O2NBR0ssV0FBVyxHQUFHLFVBQVUsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBRXRELHNGQUFzRjtRQUN0RixzQ0FBc0M7UUFDdEMsSUFBSSxRQUFRLEtBQUssU0FBUyxFQUFFO1lBQzFCLEdBQUcsR0FBRyxjQUFjLENBQUMsUUFBUSxDQUFDLENBQUM7U0FDaEM7UUFFRCxtRUFBbUU7UUFDbkUsSUFBSSxHQUFHLElBQUksSUFBSSxFQUFFO1lBQ2YsT0FBTyxLQUFLLENBQUM7U0FDZDtRQUVELG9EQUFvRDtRQUNwRCxJQUFJLENBQUMsZ0JBQWdCLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ25DLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLE9BQU8sRUFBRSxVQUFVLENBQUMsR0FBRyxDQUFDLE9BQU8sRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDO1FBRTVELCtEQUErRDtRQUUvRCw2Q0FBNkM7UUFDN0MsSUFBSSxHQUFHLENBQUMsT0FBTyxJQUFJLElBQUksSUFBSSxDQUFDLFdBQVcsRUFBRTtZQUN2QywwRkFBMEY7WUFDMUYsb0RBQW9EO1lBQ3BELFNBQVMsSUFBSSxPQUFPLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQ25DLDBGQUEwRjtZQUMxRixVQUFVLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDOztnQkFFckIsd0JBQXNFO1lBQzFFLElBQUk7Z0JBQ0YsV0FBVyxDQUFDLEdBQUcsQ0FBQyxPQUFPOzs7O2dCQUFFLFFBQVEsQ0FBQyxFQUFFO29CQUNsQyxJQUFJLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxRQUFRLEVBQUUsT0FBTyxFQUFFLFVBQVUsQ0FBQyxFQUFFO3dCQUMzRCxJQUFJLHdCQUF3QixLQUFLLFNBQVM7NEJBQUUsd0JBQXdCLEdBQUcsRUFBRSxDQUFDO3dCQUMxRSxpRkFBaUY7d0JBQ2pGLGdGQUFnRjt3QkFDaEYsd0JBQXdCLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO3FCQUN6QztnQkFDSCxDQUFDLEVBQUMsQ0FBQzthQUNKO29CQUFTO2dCQUNSLGdEQUFnRDtnQkFDaEQsU0FBUyxJQUFJLE9BQU8sQ0FBQyxHQUFHLEVBQUUsQ0FBQzthQUM1QjtZQUVELHFGQUFxRjtZQUNyRiwrRUFBK0U7WUFDL0UsMEVBQTBFO1lBQzFFLElBQUksd0JBQXdCLEtBQUssU0FBUyxFQUFFO2dCQUMxQyxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsd0JBQXdCLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFOzBCQUNsRCxFQUFDLFFBQVEsRUFBRSxTQUFTLEVBQUMsR0FBRyx3QkFBd0IsQ0FBQyxDQUFDLENBQUM7b0JBQ3pELFdBQVcsQ0FDUCxtQkFBQSxTQUFTLEVBQUU7Ozs7b0JBQ1gsUUFBUSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLFFBQVEsRUFBRSxRQUFRLEVBQUUsU0FBUyxJQUFJLFdBQVcsQ0FBQyxFQUFDLENBQUM7aUJBQ3JGO2FBQ0Y7U0FDRjs7O2NBR0ssWUFBWSxHQUFHLEdBQUcsQ0FBQyxTQUFTO1FBQ2xDLElBQUksWUFBWSxJQUFJLElBQUksSUFBSSxDQUFDLFdBQVcsRUFBRTs7a0JBQ2xDLFlBQVksR0FBRyxtQkFBQSxlQUFlLEVBQXFCO1lBQ3pELFdBQVcsQ0FDUCxZQUFZOzs7O1lBQUUsUUFBUSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLFFBQVEsRUFBRSxZQUFZLEVBQUUsWUFBWSxDQUFDLEVBQUMsQ0FBQztTQUMzRjtRQUVELE9BQU8sQ0FDSCxRQUFRLEtBQUssU0FBUztZQUN0QixDQUFDLG1CQUFBLGVBQWUsRUFBa0MsQ0FBQyxDQUFDLFNBQVMsS0FBSyxTQUFTLENBQUMsQ0FBQztJQUNuRixDQUFDOzs7Ozs7Ozs7SUFLTyxlQUFlLENBQ25CLFFBQXdCLEVBQUUsWUFBK0IsRUFBRSxTQUFnQjtRQUM3RSw0RkFBNEY7UUFDNUYsWUFBWTtRQUNaLFFBQVEsR0FBRyxpQkFBaUIsQ0FBQyxRQUFRLENBQUMsQ0FBQzs7WUFDbkMsS0FBSyxHQUNMLGNBQWMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxpQkFBaUIsQ0FBQyxRQUFRLElBQUksUUFBUSxDQUFDLE9BQU8sQ0FBQzs7O2NBR25GLE1BQU0sR0FBRyxnQkFBZ0IsQ0FBQyxRQUFRLEVBQUUsWUFBWSxFQUFFLFNBQVMsQ0FBQztRQUVsRSxJQUFJLENBQUMsY0FBYyxDQUFDLFFBQVEsQ0FBQyxJQUFJLFFBQVEsQ0FBQyxLQUFLLEtBQUssSUFBSSxFQUFFOzs7O2dCQUdwRCxXQUFXLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDO1lBQ3pDLElBQUksV0FBVyxFQUFFO2dCQUNmLGdDQUFnQztnQkFDaEMsSUFBSSxXQUFXLENBQUMsS0FBSyxLQUFLLFNBQVMsRUFBRTtvQkFDbkMsNEJBQTRCLEVBQUUsQ0FBQztpQkFDaEM7YUFDRjtpQkFBTTtnQkFDTCxXQUFXLEdBQUcsVUFBVSxDQUFDLFNBQVMsRUFBRSxPQUFPLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBQ25ELFdBQVcsQ0FBQyxPQUFPOzs7Z0JBQUcsR0FBRyxFQUFFLENBQUMsVUFBVSxDQUFDLG1CQUFBLG1CQUFBLFdBQVcsRUFBRSxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUEsQ0FBQztnQkFDOUQsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsS0FBSyxFQUFFLFdBQVcsQ0FBQyxDQUFDO2FBQ3RDO1lBQ0QsS0FBSyxHQUFHLFFBQVEsQ0FBQztZQUNqQixtQkFBQSxXQUFXLENBQUMsS0FBSyxFQUFFLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1NBQ3BDO2FBQU07O2tCQUNDLFFBQVEsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUM7WUFDeEMsSUFBSSxRQUFRLElBQUksUUFBUSxDQUFDLEtBQUssS0FBSyxTQUFTLEVBQUU7Z0JBQzVDLDRCQUE0QixFQUFFLENBQUM7YUFDaEM7U0FDRjtRQUNELElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssRUFBRSxNQUFNLENBQUMsQ0FBQztJQUNsQyxDQUFDOzs7Ozs7OztJQUVPLE9BQU8sQ0FBSSxLQUFnQyxFQUFFLE1BQWlCO1FBQ3BFLElBQUksTUFBTSxDQUFDLEtBQUssS0FBSyxRQUFRLEVBQUU7WUFDN0IsMEJBQTBCLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7U0FDOUM7YUFBTSxJQUFJLE1BQU0sQ0FBQyxLQUFLLEtBQUssT0FBTyxFQUFFO1lBQ25DLE1BQU0sQ0FBQyxLQUFLLEdBQUcsUUFBUSxDQUFDO1lBQ3hCLE1BQU0sQ0FBQyxLQUFLLEdBQUcsbUJBQUEsTUFBTSxDQUFDLE9BQU8sRUFBRSxFQUFFLENBQUM7U0FDbkM7UUFDRCxJQUFJLE9BQU8sTUFBTSxDQUFDLEtBQUssS0FBSyxRQUFRLElBQUksTUFBTSxDQUFDLEtBQUssSUFBSSxZQUFZLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxFQUFFO1lBQ2xGLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQztTQUNsQztRQUNELE9BQU8sbUJBQUEsTUFBTSxDQUFDLEtBQUssRUFBSyxDQUFDO0lBQzNCLENBQUM7Ozs7OztJQUVPLG9CQUFvQixDQUFDLEdBQXlCO1FBQ3BELElBQUksQ0FBQyxHQUFHLENBQUMsVUFBVSxFQUFFO1lBQ25CLE9BQU8sS0FBSyxDQUFDO1NBQ2Q7YUFBTSxJQUFJLE9BQU8sR0FBRyxDQUFDLFVBQVUsS0FBSyxRQUFRLEVBQUU7WUFDN0MsT0FBTyxHQUFHLENBQUMsVUFBVSxLQUFLLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxVQUFVLEtBQUssSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1NBQ3BFO2FBQU07WUFDTCxPQUFPLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxDQUFDO1NBQ2xEO0lBQ0gsQ0FBQztDQUNGOzs7Ozs7Ozs7SUF6VEMsNkJBQTZFOzs7Ozs7SUFLN0Usc0NBQXdEOzs7Ozs7SUFLeEQsK0JBQXlDOzs7Ozs7O0lBTXpDLDJCQUErQzs7SUFFL0MsNEJBQTZCOzs7OztJQU03QixnQ0FBMkI7O0lBRzZDLDRCQUF5Qjs7Ozs7O0FBZ1NuRyxTQUFTLGlDQUFpQyxDQUFDLEtBQXFDOzs7VUFFeEUsYUFBYSxHQUFHLGdCQUFnQixDQUFDLEtBQUssQ0FBQzs7VUFDdkMsT0FBTyxHQUFHLGFBQWEsS0FBSyxJQUFJLENBQUMsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUM7SUFFckYsSUFBSSxPQUFPLEtBQUssSUFBSSxFQUFFO1FBQ3BCLE9BQU8sT0FBTyxDQUFDO0tBQ2hCOzs7VUFHSyxXQUFXLEdBQUcsY0FBYyxDQUFDLEtBQUssQ0FBQztJQUN6QyxJQUFJLFdBQVcsS0FBSyxJQUFJLEVBQUU7UUFDeEIsT0FBTyxXQUFXLENBQUMsT0FBTyxDQUFDO0tBQzVCO0lBRUQsbUZBQW1GO0lBQ25GLHVDQUF1QztJQUN2QyxJQUFJLEtBQUssWUFBWSxjQUFjLEVBQUU7UUFDbkMsTUFBTSxJQUFJLEtBQUssQ0FBQyxTQUFTLFNBQVMsQ0FBQyxLQUFLLENBQUMsNENBQTRDLENBQUMsQ0FBQztLQUN4RjtJQUVELG9GQUFvRjtJQUNwRixJQUFJLEtBQUssWUFBWSxRQUFRLEVBQUU7UUFDN0IsT0FBTywrQkFBK0IsQ0FBQyxLQUFLLENBQUMsQ0FBQztLQUMvQztJQUVELHdEQUF3RDtJQUN4RCxNQUFNLElBQUksS0FBSyxDQUFDLGFBQWEsQ0FBQyxDQUFDO0FBQ2pDLENBQUM7Ozs7O0FBRUQsU0FBUywrQkFBK0IsQ0FBQyxLQUFlOzs7VUFFaEQsV0FBVyxHQUFHLEtBQUssQ0FBQyxNQUFNO0lBQ2hDLElBQUksV0FBVyxHQUFHLENBQUMsRUFBRTs7Y0FDYixJQUFJLEdBQWEsUUFBUSxDQUFDLFdBQVcsRUFBRSxHQUFHLENBQUM7UUFDakQsTUFBTSxJQUFJLEtBQUssQ0FBQyxvQ0FBb0MsU0FBUyxDQUFDLEtBQUssQ0FBQyxNQUFNLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO0tBQ2hHOzs7Ozs7O1VBT0ssc0JBQXNCLEdBQUcseUJBQXlCLENBQUMsS0FBSyxDQUFDO0lBQy9ELElBQUksc0JBQXNCLEtBQUssSUFBSSxFQUFFO1FBQ25DOzs7UUFBTyxHQUFHLEVBQUUsQ0FBQyxzQkFBc0IsQ0FBQyxPQUFPLENBQUMsbUJBQUEsS0FBSyxFQUFhLENBQUMsRUFBQztLQUNqRTtTQUFNO1FBQ0w7OztRQUFPLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxtQkFBQSxLQUFLLEVBQWEsQ0FBQyxFQUFFLEVBQUM7S0FDekM7QUFDSCxDQUFDOzs7Ozs7O0FBRUQsU0FBUyxnQkFBZ0IsQ0FDckIsUUFBd0IsRUFBRSxZQUErQixFQUFFLFNBQWdCOztRQUN6RSxPQUFPLEdBQTBCLGlCQUFpQixDQUFDLFFBQVEsRUFBRSxZQUFZLEVBQUUsU0FBUyxDQUFDO0lBQ3pGLElBQUksZUFBZSxDQUFDLFFBQVEsQ0FBQyxFQUFFO1FBQzdCLE9BQU8sVUFBVSxDQUFDLFNBQVMsRUFBRSxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUM7S0FDakQ7U0FBTTtRQUNMLE9BQU8sVUFBVSxDQUFDLE9BQU8sRUFBRSxPQUFPLENBQUMsQ0FBQztLQUNyQztBQUNILENBQUM7Ozs7Ozs7OztBQU9ELE1BQU0sVUFBVSxpQkFBaUIsQ0FDN0IsUUFBd0IsRUFBRSxZQUFnQyxFQUFFLFNBQWlCOztRQUMzRSxPQUFPLEdBQTBCLFNBQVM7SUFDOUMsSUFBSSxjQUFjLENBQUMsUUFBUSxDQUFDLEVBQUU7UUFDNUIsT0FBTyxpQ0FBaUMsQ0FBQyxpQkFBaUIsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO0tBQ3ZFO1NBQU07UUFDTCxJQUFJLGVBQWUsQ0FBQyxRQUFRLENBQUMsRUFBRTtZQUM3QixPQUFPOzs7WUFBRyxHQUFHLEVBQUUsQ0FBQyxpQkFBaUIsQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUEsQ0FBQztTQUN0RDthQUFNLElBQUksa0JBQWtCLENBQUMsUUFBUSxDQUFDLEVBQUU7WUFDdkMsT0FBTzs7O1lBQUcsR0FBRyxFQUFFLENBQUMsUUFBUSxDQUFDLGlCQUFpQixDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFBLENBQUM7U0FDbkU7YUFBTSxJQUFJLGlCQUFpQixDQUFDLFFBQVEsQ0FBQyxFQUFFO1lBQ3RDLE9BQU87OztZQUFHLEdBQUcsRUFBRSxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsR0FBRyxVQUFVLENBQUMsUUFBUSxDQUFDLElBQUksSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFBLENBQUM7U0FDekU7YUFBTTs7a0JBQ0MsUUFBUSxHQUFHLGlCQUFpQixDQUM5QixRQUFRO2dCQUNSLENBQUMsQ0FBQyxtQkFBQSxRQUFRLEVBQXVDLENBQUMsQ0FBQyxRQUFRLElBQUksUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQ3JGLElBQUksQ0FBQyxRQUFRLEVBQUU7Z0JBQ2IseUJBQXlCLENBQUMsWUFBWSxFQUFFLFNBQVMsRUFBRSxRQUFRLENBQUMsQ0FBQzthQUM5RDtZQUNELElBQUksT0FBTyxDQUFDLFFBQVEsQ0FBQyxFQUFFO2dCQUNyQixPQUFPOzs7Z0JBQUcsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLEdBQUcsVUFBVSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFBLENBQUM7YUFDOUQ7aUJBQU07Z0JBQ0wsT0FBTyxpQ0FBaUMsQ0FBQyxRQUFRLENBQUMsQ0FBQzthQUNwRDtTQUNGO0tBQ0Y7SUFDRCxPQUFPLE9BQU8sQ0FBQztBQUNqQixDQUFDOzs7Ozs7OztBQUVELFNBQVMsVUFBVSxDQUNmLE9BQThCLEVBQUUsS0FBYSxFQUFFLFFBQWlCLEtBQUs7SUFDdkUsT0FBTztRQUNMLE9BQU8sRUFBRSxPQUFPO1FBQ2hCLEtBQUssRUFBRSxLQUFLO1FBQ1osS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxTQUFTO0tBQzlCLENBQUM7QUFDSixDQUFDOzs7OztBQUVELFNBQVMsZUFBZSxDQUFDLEtBQXFCO0lBQzVDLE9BQU8sS0FBSyxLQUFLLElBQUksSUFBSSxPQUFPLEtBQUssSUFBSSxRQUFRLElBQUksU0FBUyxJQUFJLEtBQUssQ0FBQztBQUMxRSxDQUFDOzs7OztBQUVELFNBQVMsa0JBQWtCLENBQUMsS0FBcUI7SUFDL0MsT0FBTyxDQUFDLENBQUMsQ0FBQyxLQUFLLElBQUksQ0FBQyxtQkFBQSxLQUFLLEVBQW9CLENBQUMsQ0FBQyxXQUFXLENBQUMsQ0FBQztBQUM5RCxDQUFDOzs7OztBQUVELFNBQVMsaUJBQWlCLENBQUMsS0FBcUI7SUFDOUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxLQUFLLElBQUksQ0FBQyxtQkFBQSxLQUFLLEVBQW1CLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQztBQUM1RCxDQUFDOzs7OztBQUVELE1BQU0sVUFBVSxjQUFjLENBQUMsS0FBcUI7SUFDbEQsT0FBTyxPQUFPLEtBQUssS0FBSyxVQUFVLENBQUM7QUFDckMsQ0FBQzs7Ozs7QUFFRCxNQUFNLFVBQVUsZUFBZSxDQUFDLEtBQXFCO0lBQ25ELE9BQU8sQ0FBQyxDQUFDLENBQUMsbUJBQUEsS0FBSyxFQUF1QyxDQUFDLENBQUMsUUFBUSxDQUFDO0FBQ25FLENBQUM7Ozs7O0FBRUQsU0FBUyxPQUFPLENBQUMsS0FBZ0U7SUFFL0UsT0FBTyxDQUFDLENBQUMsQ0FBQyxtQkFBQSxLQUFLLEVBQU8sQ0FBQyxDQUFDLElBQUksQ0FBQztBQUMvQixDQUFDOzs7OztBQUVELFNBQVMsWUFBWSxDQUFDLEtBQVU7SUFDOUIsT0FBTyxLQUFLLEtBQUssSUFBSSxJQUFJLE9BQU8sS0FBSyxLQUFLLFFBQVE7UUFDOUMsT0FBTSxDQUFDLG1CQUFBLEtBQUssRUFBYSxDQUFDLENBQUMsV0FBVyxLQUFLLFVBQVUsQ0FBQztBQUM1RCxDQUFDOzs7OztBQUVELFNBQVMscUJBQXFCLENBQUMsS0FBVTtJQUN2QyxPQUFPLENBQUMsT0FBTyxLQUFLLEtBQUssVUFBVSxDQUFDO1FBQ2hDLENBQUMsT0FBTyxLQUFLLEtBQUssUUFBUSxJQUFJLEtBQUssWUFBWSxjQUFjLENBQUMsQ0FBQztBQUNyRSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgJy4uL3V0aWwvbmdfZGV2X21vZGUnO1xuXG5pbXBvcnQge09uRGVzdHJveX0gZnJvbSAnLi4vaW50ZXJmYWNlL2xpZmVjeWNsZV9ob29rcyc7XG5pbXBvcnQge1R5cGV9IGZyb20gJy4uL2ludGVyZmFjZS90eXBlJztcbmltcG9ydCB7Z2V0RmFjdG9yeURlZn0gZnJvbSAnLi4vcmVuZGVyMy9kZWZpbml0aW9uJztcbmltcG9ydCB7dGhyb3dDeWNsaWNEZXBlbmRlbmN5RXJyb3IsIHRocm93SW52YWxpZFByb3ZpZGVyRXJyb3IsIHRocm93TWl4ZWRNdWx0aVByb3ZpZGVyRXJyb3J9IGZyb20gJy4uL3JlbmRlcjMvZXJyb3JzJztcbmltcG9ydCB7ZGVlcEZvckVhY2gsIG5ld0FycmF5fSBmcm9tICcuLi91dGlsL2FycmF5X3V0aWxzJztcbmltcG9ydCB7c3RyaW5naWZ5fSBmcm9tICcuLi91dGlsL3N0cmluZ2lmeSc7XG5pbXBvcnQge3Jlc29sdmVGb3J3YXJkUmVmfSBmcm9tICcuL2ZvcndhcmRfcmVmJztcbmltcG9ydCB7SW5qZWN0aW9uVG9rZW59IGZyb20gJy4vaW5qZWN0aW9uX3Rva2VuJztcbmltcG9ydCB7SW5qZWN0b3J9IGZyb20gJy4vaW5qZWN0b3InO1xuaW1wb3J0IHtJTkpFQ1RPUiwgTkdfVEVNUF9UT0tFTl9QQVRILCBOdWxsSW5qZWN0b3IsIFRIUk9XX0lGX05PVF9GT1VORCwgVVNFX1ZBTFVFLCBjYXRjaEluamVjdG9yRXJyb3IsIGluamVjdEFyZ3MsIHNldEN1cnJlbnRJbmplY3RvciwgybXJtWluamVjdH0gZnJvbSAnLi9pbmplY3Rvcl9jb21wYXRpYmlsaXR5JztcbmltcG9ydCB7SW5qZWN0b3JUeXBlLCBJbmplY3RvclR5cGVXaXRoUHJvdmlkZXJzLCBnZXRJbmhlcml0ZWRJbmplY3RhYmxlRGVmLCBnZXRJbmplY3RhYmxlRGVmLCBnZXRJbmplY3RvckRlZiwgybXJtUluamVjdGFibGVEZWZ9IGZyb20gJy4vaW50ZXJmYWNlL2RlZnMnO1xuaW1wb3J0IHtJbmplY3RGbGFnc30gZnJvbSAnLi9pbnRlcmZhY2UvaW5qZWN0b3InO1xuaW1wb3J0IHtDbGFzc1Byb3ZpZGVyLCBDb25zdHJ1Y3RvclByb3ZpZGVyLCBFeGlzdGluZ1Byb3ZpZGVyLCBGYWN0b3J5UHJvdmlkZXIsIFN0YXRpY0NsYXNzUHJvdmlkZXIsIFN0YXRpY1Byb3ZpZGVyLCBUeXBlUHJvdmlkZXIsIFZhbHVlUHJvdmlkZXJ9IGZyb20gJy4vaW50ZXJmYWNlL3Byb3ZpZGVyJztcbmltcG9ydCB7SU5KRUNUT1JfU0NPUEV9IGZyb20gJy4vc2NvcGUnO1xuXG5cblxuLyoqXG4gKiBJbnRlcm5hbCB0eXBlIGZvciBhIHNpbmdsZSBwcm92aWRlciBpbiBhIGRlZXAgcHJvdmlkZXIgYXJyYXkuXG4gKi9cbnR5cGUgU2luZ2xlUHJvdmlkZXIgPSBUeXBlUHJvdmlkZXIgfCBWYWx1ZVByb3ZpZGVyIHwgQ2xhc3NQcm92aWRlciB8IENvbnN0cnVjdG9yUHJvdmlkZXIgfFxuICAgIEV4aXN0aW5nUHJvdmlkZXIgfCBGYWN0b3J5UHJvdmlkZXIgfCBTdGF0aWNDbGFzc1Byb3ZpZGVyO1xuXG4vKipcbiAqIE1hcmtlciB3aGljaCBpbmRpY2F0ZXMgdGhhdCBhIHZhbHVlIGhhcyBub3QgeWV0IGJlZW4gY3JlYXRlZCBmcm9tIHRoZSBmYWN0b3J5IGZ1bmN0aW9uLlxuICovXG5jb25zdCBOT1RfWUVUID0ge307XG5cbi8qKlxuICogTWFya2VyIHdoaWNoIGluZGljYXRlcyB0aGF0IHRoZSBmYWN0b3J5IGZ1bmN0aW9uIGZvciBhIHRva2VuIGlzIGluIHRoZSBwcm9jZXNzIG9mIGJlaW5nIGNhbGxlZC5cbiAqXG4gKiBJZiB0aGUgaW5qZWN0b3IgaXMgYXNrZWQgdG8gaW5qZWN0IGEgdG9rZW4gd2l0aCBpdHMgdmFsdWUgc2V0IHRvIENJUkNVTEFSLCB0aGF0IGluZGljYXRlc1xuICogaW5qZWN0aW9uIG9mIGEgZGVwZW5kZW5jeSBoYXMgcmVjdXJzaXZlbHkgYXR0ZW1wdGVkIHRvIGluamVjdCB0aGUgb3JpZ2luYWwgdG9rZW4sIGFuZCB0aGVyZSBpc1xuICogYSBjaXJjdWxhciBkZXBlbmRlbmN5IGFtb25nIHRoZSBwcm92aWRlcnMuXG4gKi9cbmNvbnN0IENJUkNVTEFSID0ge307XG5cbmNvbnN0IEVNUFRZX0FSUkFZID0gW10gYXMgYW55W107XG5cbi8qKlxuICogQSBsYXppbHkgaW5pdGlhbGl6ZWQgTnVsbEluamVjdG9yLlxuICovXG5sZXQgTlVMTF9JTkpFQ1RPUjogSW5qZWN0b3J8dW5kZWZpbmVkID0gdW5kZWZpbmVkO1xuXG5mdW5jdGlvbiBnZXROdWxsSW5qZWN0b3IoKTogSW5qZWN0b3Ige1xuICBpZiAoTlVMTF9JTkpFQ1RPUiA9PT0gdW5kZWZpbmVkKSB7XG4gICAgTlVMTF9JTkpFQ1RPUiA9IG5ldyBOdWxsSW5qZWN0b3IoKTtcbiAgfVxuICByZXR1cm4gTlVMTF9JTkpFQ1RPUjtcbn1cblxuLyoqXG4gKiBBbiBlbnRyeSBpbiB0aGUgaW5qZWN0b3Igd2hpY2ggdHJhY2tzIGluZm9ybWF0aW9uIGFib3V0IHRoZSBnaXZlbiB0b2tlbiwgaW5jbHVkaW5nIGEgcG9zc2libGVcbiAqIGN1cnJlbnQgdmFsdWUuXG4gKi9cbmludGVyZmFjZSBSZWNvcmQ8VD4ge1xuICBmYWN0b3J5OiAoKCkgPT4gVCl8dW5kZWZpbmVkO1xuICB2YWx1ZTogVHx7fTtcbiAgbXVsdGk6IGFueVtdfHVuZGVmaW5lZDtcbn1cblxuLyoqXG4gKiBDcmVhdGUgYSBuZXcgYEluamVjdG9yYCB3aGljaCBpcyBjb25maWd1cmVkIHVzaW5nIGEgYGRlZlR5cGVgIG9mIGBJbmplY3RvclR5cGU8YW55PmBzLlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUluamVjdG9yKFxuICAgIGRlZlR5cGU6IC8qIEluamVjdG9yVHlwZTxhbnk+ICovIGFueSwgcGFyZW50OiBJbmplY3RvciB8IG51bGwgPSBudWxsLFxuICAgIGFkZGl0aW9uYWxQcm92aWRlcnM6IFN0YXRpY1Byb3ZpZGVyW10gfCBudWxsID0gbnVsbCwgbmFtZT86IHN0cmluZyk6IEluamVjdG9yIHtcbiAgcGFyZW50ID0gcGFyZW50IHx8IGdldE51bGxJbmplY3RvcigpO1xuICByZXR1cm4gbmV3IFIzSW5qZWN0b3IoZGVmVHlwZSwgYWRkaXRpb25hbFByb3ZpZGVycywgcGFyZW50LCBuYW1lKTtcbn1cblxuZXhwb3J0IGNsYXNzIFIzSW5qZWN0b3Ige1xuICAvKipcbiAgICogTWFwIG9mIHRva2VucyB0byByZWNvcmRzIHdoaWNoIGNvbnRhaW4gdGhlIGluc3RhbmNlcyBvZiB0aG9zZSB0b2tlbnMuXG4gICAqIC0gYG51bGxgIHZhbHVlIGltcGxpZXMgdGhhdCB3ZSBkb24ndCBoYXZlIHRoZSByZWNvcmQuIFVzZWQgYnkgdHJlZS1zaGFrYWJsZSBpbmplY3RvcnNcbiAgICogdG8gcHJldmVudCBmdXJ0aGVyIHNlYXJjaGVzLlxuICAgKi9cbiAgcHJpdmF0ZSByZWNvcmRzID0gbmV3IE1hcDxUeXBlPGFueT58SW5qZWN0aW9uVG9rZW48YW55PiwgUmVjb3JkPGFueT58bnVsbD4oKTtcblxuICAvKipcbiAgICogVGhlIHRyYW5zaXRpdmUgc2V0IG9mIGBJbmplY3RvclR5cGVgcyB3aGljaCBkZWZpbmUgdGhpcyBpbmplY3Rvci5cbiAgICovXG4gIHByaXZhdGUgaW5qZWN0b3JEZWZUeXBlcyA9IG5ldyBTZXQ8SW5qZWN0b3JUeXBlPGFueT4+KCk7XG5cbiAgLyoqXG4gICAqIFNldCBvZiB2YWx1ZXMgaW5zdGFudGlhdGVkIGJ5IHRoaXMgaW5qZWN0b3Igd2hpY2ggY29udGFpbiBgbmdPbkRlc3Ryb3lgIGxpZmVjeWNsZSBob29rcy5cbiAgICovXG4gIHByaXZhdGUgb25EZXN0cm95ID0gbmV3IFNldDxPbkRlc3Ryb3k+KCk7XG5cbiAgLyoqXG4gICAqIEZsYWcgaW5kaWNhdGluZyB0aGlzIGluamVjdG9yIHByb3ZpZGVzIHRoZSBBUFBfUk9PVF9TQ09QRSB0b2tlbiwgYW5kIHRodXMgY291bnRzIGFzIHRoZVxuICAgKiByb290IHNjb3BlLlxuICAgKi9cbiAgcHJpdmF0ZSByZWFkb25seSBzY29wZTogJ3Jvb3QnfCdwbGF0Zm9ybSd8bnVsbDtcblxuICByZWFkb25seSBzb3VyY2U6IHN0cmluZ3xudWxsO1xuXG4gIC8qKlxuICAgKiBGbGFnIGluZGljYXRpbmcgdGhhdCB0aGlzIGluamVjdG9yIHdhcyBwcmV2aW91c2x5IGRlc3Ryb3llZC5cbiAgICovXG4gIGdldCBkZXN0cm95ZWQoKTogYm9vbGVhbiB7IHJldHVybiB0aGlzLl9kZXN0cm95ZWQ7IH1cbiAgcHJpdmF0ZSBfZGVzdHJveWVkID0gZmFsc2U7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgICBkZWY6IEluamVjdG9yVHlwZTxhbnk+LCBhZGRpdGlvbmFsUHJvdmlkZXJzOiBTdGF0aWNQcm92aWRlcltdfG51bGwsIHJlYWRvbmx5IHBhcmVudDogSW5qZWN0b3IsXG4gICAgICBzb3VyY2U6IHN0cmluZ3xudWxsID0gbnVsbCkge1xuICAgIGNvbnN0IGRlZHVwU3RhY2s6IEluamVjdG9yVHlwZTxhbnk+W10gPSBbXTtcblxuICAgIC8vIFN0YXJ0IG9mZiBieSBjcmVhdGluZyBSZWNvcmRzIGZvciBldmVyeSBwcm92aWRlciBkZWNsYXJlZCBpbiBldmVyeSBJbmplY3RvclR5cGVcbiAgICAvLyBpbmNsdWRlZCB0cmFuc2l0aXZlbHkgaW4gYWRkaXRpb25hbCBwcm92aWRlcnMgdGhlbiBkbyB0aGUgc2FtZSBmb3IgYGRlZmAuIFRoaXMgb3JkZXIgaXNcbiAgICAvLyBpbXBvcnRhbnQgYmVjYXVzZSBgZGVmYCBtYXkgaW5jbHVkZSBwcm92aWRlcnMgdGhhdCBvdmVycmlkZSBvbmVzIGluIGFkZGl0aW9uYWxQcm92aWRlcnMuXG4gICAgYWRkaXRpb25hbFByb3ZpZGVycyAmJiBkZWVwRm9yRWFjaChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhZGRpdGlvbmFsUHJvdmlkZXJzLCBwcm92aWRlciA9PiB0aGlzLnByb2Nlc3NQcm92aWRlcihcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvdmlkZXIsIGRlZiwgYWRkaXRpb25hbFByb3ZpZGVycykpO1xuXG4gICAgZGVlcEZvckVhY2goW2RlZl0sIGluamVjdG9yRGVmID0+IHRoaXMucHJvY2Vzc0luamVjdG9yVHlwZShpbmplY3RvckRlZiwgW10sIGRlZHVwU3RhY2spKTtcblxuICAgIC8vIE1ha2Ugc3VyZSB0aGUgSU5KRUNUT1IgdG9rZW4gcHJvdmlkZXMgdGhpcyBpbmplY3Rvci5cbiAgICB0aGlzLnJlY29yZHMuc2V0KElOSkVDVE9SLCBtYWtlUmVjb3JkKHVuZGVmaW5lZCwgdGhpcykpO1xuXG4gICAgLy8gRGV0ZWN0IHdoZXRoZXIgdGhpcyBpbmplY3RvciBoYXMgdGhlIEFQUF9ST09UX1NDT1BFIHRva2VuIGFuZCB0aHVzIHNob3VsZCBwcm92aWRlXG4gICAgLy8gYW55IGluamVjdGFibGUgc2NvcGVkIHRvIEFQUF9ST09UX1NDT1BFLlxuICAgIGNvbnN0IHJlY29yZCA9IHRoaXMucmVjb3Jkcy5nZXQoSU5KRUNUT1JfU0NPUEUpO1xuICAgIHRoaXMuc2NvcGUgPSByZWNvcmQgIT0gbnVsbCA/IHJlY29yZC52YWx1ZSA6IG51bGw7XG5cbiAgICAvLyBFYWdlcmx5IGluc3RhbnRpYXRlIHRoZSBJbmplY3RvclR5cGUgY2xhc3NlcyB0aGVtc2VsdmVzLlxuICAgIHRoaXMuaW5qZWN0b3JEZWZUeXBlcy5mb3JFYWNoKGRlZlR5cGUgPT4gdGhpcy5nZXQoZGVmVHlwZSkpO1xuXG4gICAgLy8gU291cmNlIG5hbWUsIHVzZWQgZm9yIGRlYnVnZ2luZ1xuICAgIHRoaXMuc291cmNlID0gc291cmNlIHx8ICh0eXBlb2YgZGVmID09PSAnb2JqZWN0JyA/IG51bGwgOiBzdHJpbmdpZnkoZGVmKSk7XG4gIH1cblxuICAvKipcbiAgICogRGVzdHJveSB0aGUgaW5qZWN0b3IgYW5kIHJlbGVhc2UgcmVmZXJlbmNlcyB0byBldmVyeSBpbnN0YW5jZSBvciBwcm92aWRlciBhc3NvY2lhdGVkIHdpdGggaXQuXG4gICAqXG4gICAqIEFsc28gY2FsbHMgdGhlIGBPbkRlc3Ryb3lgIGxpZmVjeWNsZSBob29rcyBvZiBldmVyeSBpbnN0YW5jZSB0aGF0IHdhcyBjcmVhdGVkIGZvciB3aGljaCBhXG4gICAqIGhvb2sgd2FzIGZvdW5kLlxuICAgKi9cbiAgZGVzdHJveSgpOiB2b2lkIHtcbiAgICB0aGlzLmFzc2VydE5vdERlc3Ryb3llZCgpO1xuXG4gICAgLy8gU2V0IGRlc3Ryb3llZCA9IHRydWUgZmlyc3QsIGluIGNhc2UgbGlmZWN5Y2xlIGhvb2tzIHJlLWVudGVyIGRlc3Ryb3koKS5cbiAgICB0aGlzLl9kZXN0cm95ZWQgPSB0cnVlO1xuICAgIHRyeSB7XG4gICAgICAvLyBDYWxsIGFsbCB0aGUgbGlmZWN5Y2xlIGhvb2tzLlxuICAgICAgdGhpcy5vbkRlc3Ryb3kuZm9yRWFjaChzZXJ2aWNlID0+IHNlcnZpY2UubmdPbkRlc3Ryb3koKSk7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIC8vIFJlbGVhc2UgYWxsIHJlZmVyZW5jZXMuXG4gICAgICB0aGlzLnJlY29yZHMuY2xlYXIoKTtcbiAgICAgIHRoaXMub25EZXN0cm95LmNsZWFyKCk7XG4gICAgICB0aGlzLmluamVjdG9yRGVmVHlwZXMuY2xlYXIoKTtcbiAgICB9XG4gIH1cblxuICBnZXQ8VD4oXG4gICAgICB0b2tlbjogVHlwZTxUPnxJbmplY3Rpb25Ub2tlbjxUPiwgbm90Rm91bmRWYWx1ZTogYW55ID0gVEhST1dfSUZfTk9UX0ZPVU5ELFxuICAgICAgZmxhZ3MgPSBJbmplY3RGbGFncy5EZWZhdWx0KTogVCB7XG4gICAgdGhpcy5hc3NlcnROb3REZXN0cm95ZWQoKTtcbiAgICAvLyBTZXQgdGhlIGluamVjdGlvbiBjb250ZXh0LlxuICAgIGNvbnN0IHByZXZpb3VzSW5qZWN0b3IgPSBzZXRDdXJyZW50SW5qZWN0b3IodGhpcyk7XG4gICAgdHJ5IHtcbiAgICAgIC8vIENoZWNrIGZvciB0aGUgU2tpcFNlbGYgZmxhZy5cbiAgICAgIGlmICghKGZsYWdzICYgSW5qZWN0RmxhZ3MuU2tpcFNlbGYpKSB7XG4gICAgICAgIC8vIFNraXBTZWxmIGlzbid0IHNldCwgY2hlY2sgaWYgdGhlIHJlY29yZCBiZWxvbmdzIHRvIHRoaXMgaW5qZWN0b3IuXG4gICAgICAgIGxldCByZWNvcmQ6IFJlY29yZDxUPnx1bmRlZmluZWR8bnVsbCA9IHRoaXMucmVjb3Jkcy5nZXQodG9rZW4pO1xuICAgICAgICBpZiAocmVjb3JkID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAvLyBObyByZWNvcmQsIGJ1dCBtYXliZSB0aGUgdG9rZW4gaXMgc2NvcGVkIHRvIHRoaXMgaW5qZWN0b3IuIExvb2sgZm9yIGFuIG5nSW5qZWN0YWJsZURlZlxuICAgICAgICAgIC8vIHdpdGggYSBzY29wZSBtYXRjaGluZyB0aGlzIGluamVjdG9yLlxuICAgICAgICAgIGNvbnN0IGRlZiA9IGNvdWxkQmVJbmplY3RhYmxlVHlwZSh0b2tlbikgJiYgZ2V0SW5qZWN0YWJsZURlZih0b2tlbik7XG4gICAgICAgICAgaWYgKGRlZiAmJiB0aGlzLmluamVjdGFibGVEZWZJblNjb3BlKGRlZikpIHtcbiAgICAgICAgICAgIC8vIEZvdW5kIGFuIG5nSW5qZWN0YWJsZURlZiBhbmQgaXQncyBzY29wZWQgdG8gdGhpcyBpbmplY3Rvci4gUHJldGVuZCBhcyBpZiBpdCB3YXMgaGVyZVxuICAgICAgICAgICAgLy8gYWxsIGFsb25nLlxuICAgICAgICAgICAgcmVjb3JkID0gbWFrZVJlY29yZChpbmplY3RhYmxlRGVmT3JJbmplY3RvckRlZkZhY3RvcnkodG9rZW4pLCBOT1RfWUVUKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmVjb3JkID0gbnVsbDtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhpcy5yZWNvcmRzLnNldCh0b2tlbiwgcmVjb3JkKTtcbiAgICAgICAgfVxuICAgICAgICAvLyBJZiBhIHJlY29yZCB3YXMgZm91bmQsIGdldCB0aGUgaW5zdGFuY2UgZm9yIGl0IGFuZCByZXR1cm4gaXQuXG4gICAgICAgIGlmIChyZWNvcmQgIT0gbnVsbCAvKiBOT1QgbnVsbCB8fCB1bmRlZmluZWQgKi8pIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5oeWRyYXRlKHRva2VuLCByZWNvcmQpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIFNlbGVjdCB0aGUgbmV4dCBpbmplY3RvciBiYXNlZCBvbiB0aGUgU2VsZiBmbGFnIC0gaWYgc2VsZiBpcyBzZXQsIHRoZSBuZXh0IGluamVjdG9yIGlzXG4gICAgICAvLyB0aGUgTnVsbEluamVjdG9yLCBvdGhlcndpc2UgaXQncyB0aGUgcGFyZW50LlxuICAgICAgY29uc3QgbmV4dEluamVjdG9yID0gIShmbGFncyAmIEluamVjdEZsYWdzLlNlbGYpID8gdGhpcy5wYXJlbnQgOiBnZXROdWxsSW5qZWN0b3IoKTtcbiAgICAgIHJldHVybiBuZXh0SW5qZWN0b3IuZ2V0KHRva2VuLCBmbGFncyAmIEluamVjdEZsYWdzLk9wdGlvbmFsID8gbnVsbCA6IG5vdEZvdW5kVmFsdWUpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGlmIChlLm5hbWUgPT09ICdOdWxsSW5qZWN0b3JFcnJvcicpIHtcbiAgICAgICAgY29uc3QgcGF0aDogYW55W10gPSBlW05HX1RFTVBfVE9LRU5fUEFUSF0gPSBlW05HX1RFTVBfVE9LRU5fUEFUSF0gfHwgW107XG4gICAgICAgIHBhdGgudW5zaGlmdChzdHJpbmdpZnkodG9rZW4pKTtcbiAgICAgICAgaWYgKHByZXZpb3VzSW5qZWN0b3IpIHtcbiAgICAgICAgICAvLyBXZSBzdGlsbCBoYXZlIGEgcGFyZW50IGluamVjdG9yLCBrZWVwIHRocm93aW5nXG4gICAgICAgICAgdGhyb3cgZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBGb3JtYXQgJiB0aHJvdyB0aGUgZmluYWwgZXJyb3IgbWVzc2FnZSB3aGVuIHdlIGRvbid0IGhhdmUgYW55IHByZXZpb3VzIGluamVjdG9yXG4gICAgICAgICAgcmV0dXJuIGNhdGNoSW5qZWN0b3JFcnJvcihlLCB0b2tlbiwgJ1IzSW5qZWN0b3JFcnJvcicsIHRoaXMuc291cmNlKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgZTtcbiAgICAgIH1cbiAgICB9IGZpbmFsbHkge1xuICAgICAgLy8gTGFzdGx5LCBjbGVhbiB1cCB0aGUgc3RhdGUgYnkgcmVzdG9yaW5nIHRoZSBwcmV2aW91cyBpbmplY3Rvci5cbiAgICAgIHNldEN1cnJlbnRJbmplY3RvcihwcmV2aW91c0luamVjdG9yKTtcbiAgICB9XG4gIH1cblxuICB0b1N0cmluZygpIHtcbiAgICBjb25zdCB0b2tlbnMgPSA8c3RyaW5nW10+W10sIHJlY29yZHMgPSB0aGlzLnJlY29yZHM7XG4gICAgcmVjb3Jkcy5mb3JFYWNoKCh2LCB0b2tlbikgPT4gdG9rZW5zLnB1c2goc3RyaW5naWZ5KHRva2VuKSkpO1xuICAgIHJldHVybiBgUjNJbmplY3Rvclske3Rva2Vucy5qb2luKCcsICcpfV1gO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3NlcnROb3REZXN0cm95ZWQoKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuX2Rlc3Ryb3llZCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbmplY3RvciBoYXMgYWxyZWFkeSBiZWVuIGRlc3Ryb3llZC4nKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQWRkIGFuIGBJbmplY3RvclR5cGVgIG9yIGBJbmplY3RvclR5cGVXaXRoUHJvdmlkZXJzYCBhbmQgYWxsIG9mIGl0cyB0cmFuc2l0aXZlIHByb3ZpZGVyc1xuICAgKiB0byB0aGlzIGluamVjdG9yLlxuICAgKlxuICAgKiBJZiBhbiBgSW5qZWN0b3JUeXBlV2l0aFByb3ZpZGVyc2AgdGhhdCBkZWNsYXJlcyBwcm92aWRlcnMgYmVzaWRlcyB0aGUgdHlwZSBpcyBzcGVjaWZpZWQsXG4gICAqIHRoZSBmdW5jdGlvbiB3aWxsIHJldHVybiBcInRydWVcIiB0byBpbmRpY2F0ZSB0aGF0IHRoZSBwcm92aWRlcnMgb2YgdGhlIHR5cGUgZGVmaW5pdGlvbiBuZWVkXG4gICAqIHRvIGJlIHByb2Nlc3NlZC4gVGhpcyBhbGxvd3MgdXMgdG8gcHJvY2VzcyBwcm92aWRlcnMgb2YgaW5qZWN0b3IgdHlwZXMgYWZ0ZXIgYWxsIGltcG9ydHMgb2ZcbiAgICogYW4gaW5qZWN0b3IgZGVmaW5pdGlvbiBhcmUgcHJvY2Vzc2VkLiAoZm9sbG93aW5nIFZpZXcgRW5naW5lIHNlbWFudGljczogc2VlIEZXLTEzNDkpXG4gICAqL1xuICBwcml2YXRlIHByb2Nlc3NJbmplY3RvclR5cGUoXG4gICAgICBkZWZPcldyYXBwZWREZWY6IEluamVjdG9yVHlwZTxhbnk+fEluamVjdG9yVHlwZVdpdGhQcm92aWRlcnM8YW55PixcbiAgICAgIHBhcmVudHM6IEluamVjdG9yVHlwZTxhbnk+W10sXG4gICAgICBkZWR1cFN0YWNrOiBJbmplY3RvclR5cGU8YW55PltdKTogZGVmT3JXcmFwcGVkRGVmIGlzIEluamVjdG9yVHlwZVdpdGhQcm92aWRlcnM8YW55PiB7XG4gICAgZGVmT3JXcmFwcGVkRGVmID0gcmVzb2x2ZUZvcndhcmRSZWYoZGVmT3JXcmFwcGVkRGVmKTtcbiAgICBpZiAoIWRlZk9yV3JhcHBlZERlZikgcmV0dXJuIGZhbHNlO1xuXG4gICAgLy8gRWl0aGVyIHRoZSBkZWZPcldyYXBwZWREZWYgaXMgYW4gSW5qZWN0b3JUeXBlICh3aXRoIG5nSW5qZWN0b3JEZWYpIG9yIGFuXG4gICAgLy8gSW5qZWN0b3JEZWZUeXBlV2l0aFByb3ZpZGVycyAoYWthIE1vZHVsZVdpdGhQcm92aWRlcnMpLiBEZXRlY3RpbmcgZWl0aGVyIGlzIGEgbWVnYW1vcnBoaWNcbiAgICAvLyByZWFkLCBzbyBjYXJlIGlzIHRha2VuIHRvIG9ubHkgZG8gdGhlIHJlYWQgb25jZS5cblxuICAgIC8vIEZpcnN0IGF0dGVtcHQgdG8gcmVhZCB0aGUgbmdJbmplY3RvckRlZi5cbiAgICBsZXQgZGVmID0gZ2V0SW5qZWN0b3JEZWYoZGVmT3JXcmFwcGVkRGVmKTtcblxuICAgIC8vIElmIHRoYXQncyBub3QgcHJlc2VudCwgdGhlbiBhdHRlbXB0IHRvIHJlYWQgbmdNb2R1bGUgZnJvbSB0aGUgSW5qZWN0b3JEZWZUeXBlV2l0aFByb3ZpZGVycy5cbiAgICBjb25zdCBuZ01vZHVsZSA9XG4gICAgICAgIChkZWYgPT0gbnVsbCkgJiYgKGRlZk9yV3JhcHBlZERlZiBhcyBJbmplY3RvclR5cGVXaXRoUHJvdmlkZXJzPGFueT4pLm5nTW9kdWxlIHx8IHVuZGVmaW5lZDtcblxuICAgIC8vIERldGVybWluZSB0aGUgSW5qZWN0b3JUeXBlLiBJbiB0aGUgY2FzZSB3aGVyZSBgZGVmT3JXcmFwcGVkRGVmYCBpcyBhbiBgSW5qZWN0b3JUeXBlYCxcbiAgICAvLyB0aGVuIHRoaXMgaXMgZWFzeS4gSW4gdGhlIGNhc2Ugb2YgYW4gSW5qZWN0b3JEZWZUeXBlV2l0aFByb3ZpZGVycywgdGhlbiB0aGUgZGVmaW5pdGlvbiB0eXBlXG4gICAgLy8gaXMgdGhlIGBuZ01vZHVsZWAuXG4gICAgY29uc3QgZGVmVHlwZTogSW5qZWN0b3JUeXBlPGFueT4gPVxuICAgICAgICAobmdNb2R1bGUgPT09IHVuZGVmaW5lZCkgPyAoZGVmT3JXcmFwcGVkRGVmIGFzIEluamVjdG9yVHlwZTxhbnk+KSA6IG5nTW9kdWxlO1xuXG4gICAgLy8gQ2hlY2sgZm9yIGNpcmN1bGFyIGRlcGVuZGVuY2llcy5cbiAgICBpZiAobmdEZXZNb2RlICYmIHBhcmVudHMuaW5kZXhPZihkZWZUeXBlKSAhPT0gLTEpIHtcbiAgICAgIGNvbnN0IGRlZk5hbWUgPSBzdHJpbmdpZnkoZGVmVHlwZSk7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgYENpcmN1bGFyIGRlcGVuZGVuY3kgaW4gREkgZGV0ZWN0ZWQgZm9yIHR5cGUgJHtkZWZOYW1lfS4gRGVwZW5kZW5jeSBwYXRoOiAke3BhcmVudHMubWFwKGRlZlR5cGUgPT4gc3RyaW5naWZ5KGRlZlR5cGUpKS5qb2luKCcgPiAnKX0gPiAke2RlZk5hbWV9LmApO1xuICAgIH1cblxuICAgIC8vIENoZWNrIGZvciBtdWx0aXBsZSBpbXBvcnRzIG9mIHRoZSBzYW1lIG1vZHVsZVxuICAgIGNvbnN0IGlzRHVwbGljYXRlID0gZGVkdXBTdGFjay5pbmRleE9mKGRlZlR5cGUpICE9PSAtMTtcblxuICAgIC8vIEZpbmFsbHksIGlmIGRlZk9yV3JhcHBlZFR5cGUgd2FzIGFuIGBJbmplY3RvckRlZlR5cGVXaXRoUHJvdmlkZXJzYCwgdGhlbiB0aGUgYWN0dWFsXG4gICAgLy8gYEluamVjdG9yRGVmYCBpcyBvbiBpdHMgYG5nTW9kdWxlYC5cbiAgICBpZiAobmdNb2R1bGUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgZGVmID0gZ2V0SW5qZWN0b3JEZWYobmdNb2R1bGUpO1xuICAgIH1cblxuICAgIC8vIElmIG5vIGRlZmluaXRpb24gd2FzIGZvdW5kLCBpdCBtaWdodCBiZSBmcm9tIGV4cG9ydHMuIFJlbW92ZSBpdC5cbiAgICBpZiAoZGVmID09IG51bGwpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICAvLyBUcmFjayB0aGUgSW5qZWN0b3JUeXBlIGFuZCBhZGQgYSBwcm92aWRlciBmb3IgaXQuXG4gICAgdGhpcy5pbmplY3RvckRlZlR5cGVzLmFkZChkZWZUeXBlKTtcbiAgICB0aGlzLnJlY29yZHMuc2V0KGRlZlR5cGUsIG1ha2VSZWNvcmQoZGVmLmZhY3RvcnksIE5PVF9ZRVQpKTtcblxuICAgIC8vIEFkZCBwcm92aWRlcnMgaW4gdGhlIHNhbWUgd2F5IHRoYXQgQE5nTW9kdWxlIHJlc29sdXRpb24gZGlkOlxuXG4gICAgLy8gRmlyc3QsIGluY2x1ZGUgcHJvdmlkZXJzIGZyb20gYW55IGltcG9ydHMuXG4gICAgaWYgKGRlZi5pbXBvcnRzICE9IG51bGwgJiYgIWlzRHVwbGljYXRlKSB7XG4gICAgICAvLyBCZWZvcmUgcHJvY2Vzc2luZyBkZWZUeXBlJ3MgaW1wb3J0cywgYWRkIGl0IHRvIHRoZSBzZXQgb2YgcGFyZW50cy4gVGhpcyB3YXksIGlmIGl0IGVuZHNcbiAgICAgIC8vIHVwIGRlZXBseSBpbXBvcnRpbmcgaXRzZWxmLCB0aGlzIGNhbiBiZSBkZXRlY3RlZC5cbiAgICAgIG5nRGV2TW9kZSAmJiBwYXJlbnRzLnB1c2goZGVmVHlwZSk7XG4gICAgICAvLyBBZGQgaXQgdG8gdGhlIHNldCBvZiBkZWR1cHMuIFRoaXMgd2F5IHdlIGNhbiBkZXRlY3QgbXVsdGlwbGUgaW1wb3J0cyBvZiB0aGUgc2FtZSBtb2R1bGVcbiAgICAgIGRlZHVwU3RhY2sucHVzaChkZWZUeXBlKTtcblxuICAgICAgbGV0IGltcG9ydFR5cGVzV2l0aFByb3ZpZGVyczogKEluamVjdG9yVHlwZVdpdGhQcm92aWRlcnM8YW55PltdKXx1bmRlZmluZWQ7XG4gICAgICB0cnkge1xuICAgICAgICBkZWVwRm9yRWFjaChkZWYuaW1wb3J0cywgaW1wb3J0ZWQgPT4ge1xuICAgICAgICAgIGlmICh0aGlzLnByb2Nlc3NJbmplY3RvclR5cGUoaW1wb3J0ZWQsIHBhcmVudHMsIGRlZHVwU3RhY2spKSB7XG4gICAgICAgICAgICBpZiAoaW1wb3J0VHlwZXNXaXRoUHJvdmlkZXJzID09PSB1bmRlZmluZWQpIGltcG9ydFR5cGVzV2l0aFByb3ZpZGVycyA9IFtdO1xuICAgICAgICAgICAgLy8gSWYgdGhlIHByb2Nlc3NlZCBpbXBvcnQgaXMgYW4gaW5qZWN0b3IgdHlwZSB3aXRoIHByb3ZpZGVycywgd2Ugc3RvcmUgaXQgaW4gdGhlXG4gICAgICAgICAgICAvLyBsaXN0IG9mIGltcG9ydCB0eXBlcyB3aXRoIHByb3ZpZGVycywgc28gdGhhdCB3ZSBjYW4gcHJvY2VzcyB0aG9zZSBhZnRlcndhcmRzLlxuICAgICAgICAgICAgaW1wb3J0VHlwZXNXaXRoUHJvdmlkZXJzLnB1c2goaW1wb3J0ZWQpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9IGZpbmFsbHkge1xuICAgICAgICAvLyBSZW1vdmUgaXQgZnJvbSB0aGUgcGFyZW50cyBzZXQgd2hlbiBmaW5pc2hlZC5cbiAgICAgICAgbmdEZXZNb2RlICYmIHBhcmVudHMucG9wKCk7XG4gICAgICB9XG5cbiAgICAgIC8vIEltcG9ydHMgd2hpY2ggYXJlIGRlY2xhcmVkIHdpdGggcHJvdmlkZXJzIChUeXBlV2l0aFByb3ZpZGVycykgbmVlZCB0byBiZSBwcm9jZXNzZWRcbiAgICAgIC8vIGFmdGVyIGFsbCBpbXBvcnRlZCBtb2R1bGVzIGFyZSBwcm9jZXNzZWQuIFRoaXMgaXMgc2ltaWxhciB0byBob3cgVmlldyBFbmdpbmVcbiAgICAgIC8vIHByb2Nlc3Nlcy9tZXJnZXMgbW9kdWxlIGltcG9ydHMgaW4gdGhlIG1ldGFkYXRhIHJlc29sdmVyLiBTZWU6IEZXLTEzNDkuXG4gICAgICBpZiAoaW1wb3J0VHlwZXNXaXRoUHJvdmlkZXJzICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBpbXBvcnRUeXBlc1dpdGhQcm92aWRlcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBjb25zdCB7bmdNb2R1bGUsIHByb3ZpZGVyc30gPSBpbXBvcnRUeXBlc1dpdGhQcm92aWRlcnNbaV07XG4gICAgICAgICAgZGVlcEZvckVhY2goXG4gICAgICAgICAgICAgIHByb3ZpZGVycyAhLFxuICAgICAgICAgICAgICBwcm92aWRlciA9PiB0aGlzLnByb2Nlc3NQcm92aWRlcihwcm92aWRlciwgbmdNb2R1bGUsIHByb3ZpZGVycyB8fCBFTVBUWV9BUlJBWSkpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gTmV4dCwgaW5jbHVkZSBwcm92aWRlcnMgbGlzdGVkIG9uIHRoZSBkZWZpbml0aW9uIGl0c2VsZi5cbiAgICBjb25zdCBkZWZQcm92aWRlcnMgPSBkZWYucHJvdmlkZXJzO1xuICAgIGlmIChkZWZQcm92aWRlcnMgIT0gbnVsbCAmJiAhaXNEdXBsaWNhdGUpIHtcbiAgICAgIGNvbnN0IGluamVjdG9yVHlwZSA9IGRlZk9yV3JhcHBlZERlZiBhcyBJbmplY3RvclR5cGU8YW55PjtcbiAgICAgIGRlZXBGb3JFYWNoKFxuICAgICAgICAgIGRlZlByb3ZpZGVycywgcHJvdmlkZXIgPT4gdGhpcy5wcm9jZXNzUHJvdmlkZXIocHJvdmlkZXIsIGluamVjdG9yVHlwZSwgZGVmUHJvdmlkZXJzKSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIChcbiAgICAgICAgbmdNb2R1bGUgIT09IHVuZGVmaW5lZCAmJlxuICAgICAgICAoZGVmT3JXcmFwcGVkRGVmIGFzIEluamVjdG9yVHlwZVdpdGhQcm92aWRlcnM8YW55PikucHJvdmlkZXJzICE9PSB1bmRlZmluZWQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFByb2Nlc3MgYSBgU2luZ2xlUHJvdmlkZXJgIGFuZCBhZGQgaXQuXG4gICAqL1xuICBwcml2YXRlIHByb2Nlc3NQcm92aWRlcihcbiAgICAgIHByb3ZpZGVyOiBTaW5nbGVQcm92aWRlciwgbmdNb2R1bGVUeXBlOiBJbmplY3RvclR5cGU8YW55PiwgcHJvdmlkZXJzOiBhbnlbXSk6IHZvaWQge1xuICAgIC8vIERldGVybWluZSB0aGUgdG9rZW4gZnJvbSB0aGUgcHJvdmlkZXIuIEVpdGhlciBpdCdzIGl0cyBvd24gdG9rZW4sIG9yIGhhcyBhIHtwcm92aWRlOiAuLi59XG4gICAgLy8gcHJvcGVydHkuXG4gICAgcHJvdmlkZXIgPSByZXNvbHZlRm9yd2FyZFJlZihwcm92aWRlcik7XG4gICAgbGV0IHRva2VuOiBhbnkgPVxuICAgICAgICBpc1R5cGVQcm92aWRlcihwcm92aWRlcikgPyBwcm92aWRlciA6IHJlc29sdmVGb3J3YXJkUmVmKHByb3ZpZGVyICYmIHByb3ZpZGVyLnByb3ZpZGUpO1xuXG4gICAgLy8gQ29uc3RydWN0IGEgYFJlY29yZGAgZm9yIHRoZSBwcm92aWRlci5cbiAgICBjb25zdCByZWNvcmQgPSBwcm92aWRlclRvUmVjb3JkKHByb3ZpZGVyLCBuZ01vZHVsZVR5cGUsIHByb3ZpZGVycyk7XG5cbiAgICBpZiAoIWlzVHlwZVByb3ZpZGVyKHByb3ZpZGVyKSAmJiBwcm92aWRlci5tdWx0aSA9PT0gdHJ1ZSkge1xuICAgICAgLy8gSWYgdGhlIHByb3ZpZGVyIGluZGljYXRlcyB0aGF0IGl0J3MgYSBtdWx0aS1wcm92aWRlciwgcHJvY2VzcyBpdCBzcGVjaWFsbHkuXG4gICAgICAvLyBGaXJzdCBjaGVjayB3aGV0aGVyIGl0J3MgYmVlbiBkZWZpbmVkIGFscmVhZHkuXG4gICAgICBsZXQgbXVsdGlSZWNvcmQgPSB0aGlzLnJlY29yZHMuZ2V0KHRva2VuKTtcbiAgICAgIGlmIChtdWx0aVJlY29yZCkge1xuICAgICAgICAvLyBJdCBoYXMuIFRocm93IGEgbmljZSBlcnJvciBpZlxuICAgICAgICBpZiAobXVsdGlSZWNvcmQubXVsdGkgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIHRocm93TWl4ZWRNdWx0aVByb3ZpZGVyRXJyb3IoKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbXVsdGlSZWNvcmQgPSBtYWtlUmVjb3JkKHVuZGVmaW5lZCwgTk9UX1lFVCwgdHJ1ZSk7XG4gICAgICAgIG11bHRpUmVjb3JkLmZhY3RvcnkgPSAoKSA9PiBpbmplY3RBcmdzKG11bHRpUmVjb3JkICEubXVsdGkgISk7XG4gICAgICAgIHRoaXMucmVjb3Jkcy5zZXQodG9rZW4sIG11bHRpUmVjb3JkKTtcbiAgICAgIH1cbiAgICAgIHRva2VuID0gcHJvdmlkZXI7XG4gICAgICBtdWx0aVJlY29yZC5tdWx0aSAhLnB1c2gocHJvdmlkZXIpO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBleGlzdGluZyA9IHRoaXMucmVjb3Jkcy5nZXQodG9rZW4pO1xuICAgICAgaWYgKGV4aXN0aW5nICYmIGV4aXN0aW5nLm11bHRpICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgdGhyb3dNaXhlZE11bHRpUHJvdmlkZXJFcnJvcigpO1xuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLnJlY29yZHMuc2V0KHRva2VuLCByZWNvcmQpO1xuICB9XG5cbiAgcHJpdmF0ZSBoeWRyYXRlPFQ+KHRva2VuOiBUeXBlPFQ+fEluamVjdGlvblRva2VuPFQ+LCByZWNvcmQ6IFJlY29yZDxUPik6IFQge1xuICAgIGlmIChyZWNvcmQudmFsdWUgPT09IENJUkNVTEFSKSB7XG4gICAgICB0aHJvd0N5Y2xpY0RlcGVuZGVuY3lFcnJvcihzdHJpbmdpZnkodG9rZW4pKTtcbiAgICB9IGVsc2UgaWYgKHJlY29yZC52YWx1ZSA9PT0gTk9UX1lFVCkge1xuICAgICAgcmVjb3JkLnZhbHVlID0gQ0lSQ1VMQVI7XG4gICAgICByZWNvcmQudmFsdWUgPSByZWNvcmQuZmFjdG9yeSAhKCk7XG4gICAgfVxuICAgIGlmICh0eXBlb2YgcmVjb3JkLnZhbHVlID09PSAnb2JqZWN0JyAmJiByZWNvcmQudmFsdWUgJiYgaGFzT25EZXN0cm95KHJlY29yZC52YWx1ZSkpIHtcbiAgICAgIHRoaXMub25EZXN0cm95LmFkZChyZWNvcmQudmFsdWUpO1xuICAgIH1cbiAgICByZXR1cm4gcmVjb3JkLnZhbHVlIGFzIFQ7XG4gIH1cblxuICBwcml2YXRlIGluamVjdGFibGVEZWZJblNjb3BlKGRlZjogybXJtUluamVjdGFibGVEZWY8YW55Pik6IGJvb2xlYW4ge1xuICAgIGlmICghZGVmLnByb3ZpZGVkSW4pIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBkZWYucHJvdmlkZWRJbiA9PT0gJ3N0cmluZycpIHtcbiAgICAgIHJldHVybiBkZWYucHJvdmlkZWRJbiA9PT0gJ2FueScgfHwgKGRlZi5wcm92aWRlZEluID09PSB0aGlzLnNjb3BlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHRoaXMuaW5qZWN0b3JEZWZUeXBlcy5oYXMoZGVmLnByb3ZpZGVkSW4pO1xuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBpbmplY3RhYmxlRGVmT3JJbmplY3RvckRlZkZhY3RvcnkodG9rZW46IFR5cGU8YW55PnwgSW5qZWN0aW9uVG9rZW48YW55Pik6ICgpID0+IGFueSB7XG4gIC8vIE1vc3QgdG9rZW5zIHdpbGwgaGF2ZSBhbiBuZ0luamVjdGFibGVEZWYgZGlyZWN0bHkgb24gdGhlbSwgd2hpY2ggc3BlY2lmaWVzIGEgZmFjdG9yeSBkaXJlY3RseS5cbiAgY29uc3QgaW5qZWN0YWJsZURlZiA9IGdldEluamVjdGFibGVEZWYodG9rZW4pO1xuICBjb25zdCBmYWN0b3J5ID0gaW5qZWN0YWJsZURlZiAhPT0gbnVsbCA/IGluamVjdGFibGVEZWYuZmFjdG9yeSA6IGdldEZhY3RvcnlEZWYodG9rZW4pO1xuXG4gIGlmIChmYWN0b3J5ICE9PSBudWxsKSB7XG4gICAgcmV0dXJuIGZhY3Rvcnk7XG4gIH1cblxuICAvLyBJZiB0aGUgdG9rZW4gaXMgYW4gTmdNb2R1bGUsIGl0J3MgYWxzbyBpbmplY3RhYmxlIGJ1dCB0aGUgZmFjdG9yeSBpcyBvbiBpdHMgbmdJbmplY3RvckRlZi5cbiAgY29uc3QgaW5qZWN0b3JEZWYgPSBnZXRJbmplY3RvckRlZih0b2tlbik7XG4gIGlmIChpbmplY3RvckRlZiAhPT0gbnVsbCkge1xuICAgIHJldHVybiBpbmplY3RvckRlZi5mYWN0b3J5O1xuICB9XG5cbiAgLy8gSW5qZWN0aW9uVG9rZW5zIHNob3VsZCBoYXZlIGFuIG5nSW5qZWN0YWJsZURlZiBhbmQgdGh1cyBzaG91bGQgYmUgaGFuZGxlZCBhYm92ZS5cbiAgLy8gSWYgaXQncyBtaXNzaW5nIHRoYXQsIGl0J3MgYW4gZXJyb3IuXG4gIGlmICh0b2tlbiBpbnN0YW5jZW9mIEluamVjdGlvblRva2VuKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBUb2tlbiAke3N0cmluZ2lmeSh0b2tlbil9IGlzIG1pc3NpbmcgYW4gbmdJbmplY3RhYmxlRGVmIGRlZmluaXRpb24uYCk7XG4gIH1cblxuICAvLyBVbmRlY29yYXRlZCB0eXBlcyBjYW4gc29tZXRpbWVzIGJlIGNyZWF0ZWQgaWYgdGhleSBoYXZlIG5vIGNvbnN0cnVjdG9yIGFyZ3VtZW50cy5cbiAgaWYgKHRva2VuIGluc3RhbmNlb2YgRnVuY3Rpb24pIHtcbiAgICByZXR1cm4gZ2V0VW5kZWNvcmF0ZWRJbmplY3RhYmxlRmFjdG9yeSh0b2tlbik7XG4gIH1cblxuICAvLyBUaGVyZSB3YXMgbm8gd2F5IHRvIHJlc29sdmUgYSBmYWN0b3J5IGZvciB0aGlzIHRva2VuLlxuICB0aHJvdyBuZXcgRXJyb3IoJ3VucmVhY2hhYmxlJyk7XG59XG5cbmZ1bmN0aW9uIGdldFVuZGVjb3JhdGVkSW5qZWN0YWJsZUZhY3RvcnkodG9rZW46IEZ1bmN0aW9uKSB7XG4gIC8vIElmIHRoZSB0b2tlbiBoYXMgcGFyYW1ldGVycyB0aGVuIGl0IGhhcyBkZXBlbmRlbmNpZXMgdGhhdCB3ZSBjYW5ub3QgcmVzb2x2ZSBpbXBsaWNpdGx5LlxuICBjb25zdCBwYXJhbUxlbmd0aCA9IHRva2VuLmxlbmd0aDtcbiAgaWYgKHBhcmFtTGVuZ3RoID4gMCkge1xuICAgIGNvbnN0IGFyZ3M6IHN0cmluZ1tdID0gbmV3QXJyYXkocGFyYW1MZW5ndGgsICc/Jyk7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBDYW4ndCByZXNvbHZlIGFsbCBwYXJhbWV0ZXJzIGZvciAke3N0cmluZ2lmeSh0b2tlbil9OiAoJHthcmdzLmpvaW4oJywgJyl9KS5gKTtcbiAgfVxuXG4gIC8vIFRoZSBjb25zdHJ1Y3RvciBmdW5jdGlvbiBhcHBlYXJzIHRvIGhhdmUgbm8gcGFyYW1ldGVycy5cbiAgLy8gVGhpcyBtaWdodCBiZSBiZWNhdXNlIGl0IGluaGVyaXRzIGZyb20gYSBzdXBlci1jbGFzcy4gSW4gd2hpY2ggY2FzZSwgdXNlIGFuIG5nSW5qZWN0YWJsZURlZlxuICAvLyBmcm9tIGFuIGFuY2VzdG9yIGlmIHRoZXJlIGlzIG9uZS5cbiAgLy8gT3RoZXJ3aXNlIHRoaXMgcmVhbGx5IGlzIGEgc2ltcGxlIGNsYXNzIHdpdGggbm8gZGVwZW5kZW5jaWVzLCBzbyByZXR1cm4gYSBmYWN0b3J5IHRoYXRcbiAgLy8ganVzdCBpbnN0YW50aWF0ZXMgdGhlIHplcm8tYXJnIGNvbnN0cnVjdG9yLlxuICBjb25zdCBpbmhlcml0ZWRJbmplY3RhYmxlRGVmID0gZ2V0SW5oZXJpdGVkSW5qZWN0YWJsZURlZih0b2tlbik7XG4gIGlmIChpbmhlcml0ZWRJbmplY3RhYmxlRGVmICE9PSBudWxsKSB7XG4gICAgcmV0dXJuICgpID0+IGluaGVyaXRlZEluamVjdGFibGVEZWYuZmFjdG9yeSh0b2tlbiBhcyBUeXBlPGFueT4pO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiAoKSA9PiBuZXcgKHRva2VuIGFzIFR5cGU8YW55PikoKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBwcm92aWRlclRvUmVjb3JkKFxuICAgIHByb3ZpZGVyOiBTaW5nbGVQcm92aWRlciwgbmdNb2R1bGVUeXBlOiBJbmplY3RvclR5cGU8YW55PiwgcHJvdmlkZXJzOiBhbnlbXSk6IFJlY29yZDxhbnk+IHtcbiAgbGV0IGZhY3Rvcnk6ICgoKSA9PiBhbnkpfHVuZGVmaW5lZCA9IHByb3ZpZGVyVG9GYWN0b3J5KHByb3ZpZGVyLCBuZ01vZHVsZVR5cGUsIHByb3ZpZGVycyk7XG4gIGlmIChpc1ZhbHVlUHJvdmlkZXIocHJvdmlkZXIpKSB7XG4gICAgcmV0dXJuIG1ha2VSZWNvcmQodW5kZWZpbmVkLCBwcm92aWRlci51c2VWYWx1ZSk7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIG1ha2VSZWNvcmQoZmFjdG9yeSwgTk9UX1lFVCk7XG4gIH1cbn1cblxuLyoqXG4gKiBDb252ZXJ0cyBhIGBTaW5nbGVQcm92aWRlcmAgaW50byBhIGZhY3RvcnkgZnVuY3Rpb24uXG4gKlxuICogQHBhcmFtIHByb3ZpZGVyIHByb3ZpZGVyIHRvIGNvbnZlcnQgdG8gZmFjdG9yeVxuICovXG5leHBvcnQgZnVuY3Rpb24gcHJvdmlkZXJUb0ZhY3RvcnkoXG4gICAgcHJvdmlkZXI6IFNpbmdsZVByb3ZpZGVyLCBuZ01vZHVsZVR5cGU/OiBJbmplY3RvclR5cGU8YW55PiwgcHJvdmlkZXJzPzogYW55W10pOiAoKSA9PiBhbnkge1xuICBsZXQgZmFjdG9yeTogKCgpID0+IGFueSl8dW5kZWZpbmVkID0gdW5kZWZpbmVkO1xuICBpZiAoaXNUeXBlUHJvdmlkZXIocHJvdmlkZXIpKSB7XG4gICAgcmV0dXJuIGluamVjdGFibGVEZWZPckluamVjdG9yRGVmRmFjdG9yeShyZXNvbHZlRm9yd2FyZFJlZihwcm92aWRlcikpO1xuICB9IGVsc2Uge1xuICAgIGlmIChpc1ZhbHVlUHJvdmlkZXIocHJvdmlkZXIpKSB7XG4gICAgICBmYWN0b3J5ID0gKCkgPT4gcmVzb2x2ZUZvcndhcmRSZWYocHJvdmlkZXIudXNlVmFsdWUpO1xuICAgIH0gZWxzZSBpZiAoaXNFeGlzdGluZ1Byb3ZpZGVyKHByb3ZpZGVyKSkge1xuICAgICAgZmFjdG9yeSA9ICgpID0+IMm1ybVpbmplY3QocmVzb2x2ZUZvcndhcmRSZWYocHJvdmlkZXIudXNlRXhpc3RpbmcpKTtcbiAgICB9IGVsc2UgaWYgKGlzRmFjdG9yeVByb3ZpZGVyKHByb3ZpZGVyKSkge1xuICAgICAgZmFjdG9yeSA9ICgpID0+IHByb3ZpZGVyLnVzZUZhY3RvcnkoLi4uaW5qZWN0QXJncyhwcm92aWRlci5kZXBzIHx8IFtdKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IGNsYXNzUmVmID0gcmVzb2x2ZUZvcndhcmRSZWYoXG4gICAgICAgICAgcHJvdmlkZXIgJiZcbiAgICAgICAgICAoKHByb3ZpZGVyIGFzIFN0YXRpY0NsYXNzUHJvdmlkZXIgfCBDbGFzc1Byb3ZpZGVyKS51c2VDbGFzcyB8fCBwcm92aWRlci5wcm92aWRlKSk7XG4gICAgICBpZiAoIWNsYXNzUmVmKSB7XG4gICAgICAgIHRocm93SW52YWxpZFByb3ZpZGVyRXJyb3IobmdNb2R1bGVUeXBlLCBwcm92aWRlcnMsIHByb3ZpZGVyKTtcbiAgICAgIH1cbiAgICAgIGlmIChoYXNEZXBzKHByb3ZpZGVyKSkge1xuICAgICAgICBmYWN0b3J5ID0gKCkgPT4gbmV3IChjbGFzc1JlZikoLi4uaW5qZWN0QXJncyhwcm92aWRlci5kZXBzKSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gaW5qZWN0YWJsZURlZk9ySW5qZWN0b3JEZWZGYWN0b3J5KGNsYXNzUmVmKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIGZhY3Rvcnk7XG59XG5cbmZ1bmN0aW9uIG1ha2VSZWNvcmQ8VD4oXG4gICAgZmFjdG9yeTogKCgpID0+IFQpIHwgdW5kZWZpbmVkLCB2YWx1ZTogVCB8IHt9LCBtdWx0aTogYm9vbGVhbiA9IGZhbHNlKTogUmVjb3JkPFQ+IHtcbiAgcmV0dXJuIHtcbiAgICBmYWN0b3J5OiBmYWN0b3J5LFxuICAgIHZhbHVlOiB2YWx1ZSxcbiAgICBtdWx0aTogbXVsdGkgPyBbXSA6IHVuZGVmaW5lZCxcbiAgfTtcbn1cblxuZnVuY3Rpb24gaXNWYWx1ZVByb3ZpZGVyKHZhbHVlOiBTaW5nbGVQcm92aWRlcik6IHZhbHVlIGlzIFZhbHVlUHJvdmlkZXIge1xuICByZXR1cm4gdmFsdWUgIT09IG51bGwgJiYgdHlwZW9mIHZhbHVlID09ICdvYmplY3QnICYmIFVTRV9WQUxVRSBpbiB2YWx1ZTtcbn1cblxuZnVuY3Rpb24gaXNFeGlzdGluZ1Byb3ZpZGVyKHZhbHVlOiBTaW5nbGVQcm92aWRlcik6IHZhbHVlIGlzIEV4aXN0aW5nUHJvdmlkZXIge1xuICByZXR1cm4gISEodmFsdWUgJiYgKHZhbHVlIGFzIEV4aXN0aW5nUHJvdmlkZXIpLnVzZUV4aXN0aW5nKTtcbn1cblxuZnVuY3Rpb24gaXNGYWN0b3J5UHJvdmlkZXIodmFsdWU6IFNpbmdsZVByb3ZpZGVyKTogdmFsdWUgaXMgRmFjdG9yeVByb3ZpZGVyIHtcbiAgcmV0dXJuICEhKHZhbHVlICYmICh2YWx1ZSBhcyBGYWN0b3J5UHJvdmlkZXIpLnVzZUZhY3RvcnkpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNUeXBlUHJvdmlkZXIodmFsdWU6IFNpbmdsZVByb3ZpZGVyKTogdmFsdWUgaXMgVHlwZVByb3ZpZGVyIHtcbiAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PT0gJ2Z1bmN0aW9uJztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzQ2xhc3NQcm92aWRlcih2YWx1ZTogU2luZ2xlUHJvdmlkZXIpOiB2YWx1ZSBpcyBDbGFzc1Byb3ZpZGVyIHtcbiAgcmV0dXJuICEhKHZhbHVlIGFzIFN0YXRpY0NsYXNzUHJvdmlkZXIgfCBDbGFzc1Byb3ZpZGVyKS51c2VDbGFzcztcbn1cblxuZnVuY3Rpb24gaGFzRGVwcyh2YWx1ZTogQ2xhc3NQcm92aWRlciB8IENvbnN0cnVjdG9yUHJvdmlkZXIgfCBTdGF0aWNDbGFzc1Byb3ZpZGVyKTpcbiAgICB2YWx1ZSBpcyBDbGFzc1Byb3ZpZGVyJntkZXBzOiBhbnlbXX0ge1xuICByZXR1cm4gISEodmFsdWUgYXMgYW55KS5kZXBzO1xufVxuXG5mdW5jdGlvbiBoYXNPbkRlc3Ryb3kodmFsdWU6IGFueSk6IHZhbHVlIGlzIE9uRGVzdHJveSB7XG4gIHJldHVybiB2YWx1ZSAhPT0gbnVsbCAmJiB0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnICYmXG4gICAgICB0eXBlb2YodmFsdWUgYXMgT25EZXN0cm95KS5uZ09uRGVzdHJveSA9PT0gJ2Z1bmN0aW9uJztcbn1cblxuZnVuY3Rpb24gY291bGRCZUluamVjdGFibGVUeXBlKHZhbHVlOiBhbnkpOiB2YWx1ZSBpcyBUeXBlPGFueT58SW5qZWN0aW9uVG9rZW48YW55PiB7XG4gIHJldHVybiAodHlwZW9mIHZhbHVlID09PSAnZnVuY3Rpb24nKSB8fFxuICAgICAgKHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcgJiYgdmFsdWUgaW5zdGFuY2VvZiBJbmplY3Rpb25Ub2tlbik7XG59XG4iXX0=