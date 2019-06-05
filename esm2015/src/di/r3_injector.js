/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import '../util/ng_dev_mode';
import { throwCyclicDependencyError, throwInvalidProviderError, throwMixedMultiProviderError } from '../render3/errors';
import { stringify } from '../util/stringify';
import { resolveForwardRef } from './forward_ref';
import { InjectionToken } from './injection_token';
import { INJECTOR, NG_TEMP_TOKEN_PATH, NullInjector, THROW_IF_NOT_FOUND, USE_VALUE, catchInjectorError, injectArgs, setCurrentInjector, ɵɵinject } from './injector_compatibility';
import { getInheritedInjectableDef, getInjectableDef, getInjectorDef } from './interface/defs';
import { InjectFlags } from './interface/injector';
import { APP_ROOT } from './scope';
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
        // Start off by creating Records for every provider declared in every InjectorType
        // included transitively in `def`.
        /** @type {?} */
        const dedupStack = [];
        deepForEach([def], (/**
         * @param {?} injectorDef
         * @return {?}
         */
        injectorDef => this.processInjectorType(injectorDef, [], dedupStack)));
        additionalProviders && deepForEach(additionalProviders, (/**
         * @param {?} provider
         * @return {?}
         */
        provider => this.processProvider(provider, def, additionalProviders)));
        // Make sure the INJECTOR token provides this injector.
        this.records.set(INJECTOR, makeRecord(undefined, this));
        // Detect whether this injector has the APP_ROOT_SCOPE token and thus should provide
        // any injectable scoped to APP_ROOT_SCOPE.
        this.isRootInjector = this.records.has(APP_ROOT);
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
            return def.providedIn === 'any' || (def.providedIn === 'root' && this.isRootInjector);
        }
        else {
            return this.injectorDefTypes.has(def.providedIn);
        }
    }
}
if (false) {
    /**
     * Map of tokens to records which contain the instances of those tokens.
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
    R3Injector.prototype.isRootInjector;
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
    if (injectableDef !== null) {
        return injectableDef.factory;
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
        const args = new Array(paramLength).fill('?');
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
        return inheritedInjectableDef.factory;
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
 * @template T
 * @param {?} input
 * @param {?} fn
 * @return {?}
 */
function deepForEach(input, fn) {
    input.forEach((/**
     * @param {?} value
     * @return {?}
     */
    value => Array.isArray(value) ? deepForEach(value, fn) : fn(value)));
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicjNfaW5qZWN0b3IuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9kaS9yM19pbmplY3Rvci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQVFBLE9BQU8scUJBQXFCLENBQUM7QUFJN0IsT0FBTyxFQUFDLDBCQUEwQixFQUFFLHlCQUF5QixFQUFFLDRCQUE0QixFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDdEgsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBRTVDLE9BQU8sRUFBQyxpQkFBaUIsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUNoRCxPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFFakQsT0FBTyxFQUFDLFFBQVEsRUFBRSxrQkFBa0IsRUFBRSxZQUFZLEVBQUUsa0JBQWtCLEVBQUUsU0FBUyxFQUFFLGtCQUFrQixFQUFFLFVBQVUsRUFBRSxrQkFBa0IsRUFBRSxRQUFRLEVBQUMsTUFBTSwwQkFBMEIsQ0FBQztBQUNqTCxPQUFPLEVBQTBDLHlCQUF5QixFQUFFLGdCQUFnQixFQUFFLGNBQWMsRUFBa0IsTUFBTSxrQkFBa0IsQ0FBQztBQUN2SixPQUFPLEVBQUMsV0FBVyxFQUFDLE1BQU0sc0JBQXNCLENBQUM7QUFFakQsT0FBTyxFQUFDLFFBQVEsRUFBQyxNQUFNLFNBQVMsQ0FBQzs7Ozs7TUFhM0IsT0FBTyxHQUFHLEVBQUU7Ozs7Ozs7OztNQVNaLFFBQVEsR0FBRyxFQUFFOztNQUViLFdBQVcsR0FBRyxtQkFBQSxFQUFFLEVBQVM7Ozs7O0lBSzNCLGFBQWEsR0FBdUIsU0FBUzs7OztBQUVqRCxTQUFTLGVBQWU7SUFDdEIsSUFBSSxhQUFhLEtBQUssU0FBUyxFQUFFO1FBQy9CLGFBQWEsR0FBRyxJQUFJLFlBQVksRUFBRSxDQUFDO0tBQ3BDO0lBQ0QsT0FBTyxhQUFhLENBQUM7QUFDdkIsQ0FBQzs7Ozs7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QXFCO0lBQy9DLE9BQU8sQ0FBQyxDQUFDLENBQUMsS0FBSyxJQUFJLENBQUMsbUJBQUEsS0FBSyxFQUFvQixDQUFDLENBQUMsV0FBVyxDQUFDLENBQUM7QUFDOUQsQ0FBQzs7Ozs7QUFFRCxTQUFTLGlCQUFpQixDQUFDLEtBQXFCO0lBQzlDLE9BQU8sQ0FBQyxDQUFDLENBQUMsS0FBSyxJQUFJLENBQUMsbUJBQUEsS0FBSyxFQUFtQixDQUFDLENBQUMsVUFBVSxDQUFDLENBQUM7QUFDNUQsQ0FBQzs7Ozs7QUFFRCxNQUFNLFVBQVUsY0FBYyxDQUFDLEtBQXFCO0lBQ2xELE9BQU8sT0FBTyxLQUFLLEtBQUssVUFBVSxDQUFDO0FBQ3JDLENBQUM7Ozs7O0FBRUQsTUFBTSxVQUFVLGVBQWUsQ0FBQyxLQUFxQjtJQUNuRCxPQUFPLENBQUMsQ0FBQyxDQUFDLG1CQUFBLEtBQUssRUFBdUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQztBQUNuRSxDQUFDOzs7OztBQUVELFNBQVMsT0FBTyxDQUFDLEtBQWdFO0lBRS9FLE9BQU8sQ0FBQyxDQUFDLENBQUMsbUJBQUEsS0FBSyxFQUFPLENBQUMsQ0FBQyxJQUFJLENBQUM7QUFDL0IsQ0FBQzs7Ozs7QUFFRCxTQUFTLFlBQVksQ0FBQyxLQUFVO0lBQzlCLE9BQU8sS0FBSyxLQUFLLElBQUksSUFBSSxPQUFPLEtBQUssS0FBSyxRQUFRO1FBQzlDLE9BQU0sQ0FBQyxtQkFBQSxLQUFLLEVBQWEsQ0FBQyxDQUFDLFdBQVcsS0FBSyxVQUFVLENBQUM7QUFDNUQsQ0FBQzs7Ozs7QUFFRCxTQUFTLHFCQUFxQixDQUFDLEtBQVU7SUFDdkMsT0FBTyxDQUFDLE9BQU8sS0FBSyxLQUFLLFVBQVUsQ0FBQztRQUNoQyxDQUFDLE9BQU8sS0FBSyxLQUFLLFFBQVEsSUFBSSxLQUFLLFlBQVksY0FBYyxDQUFDLENBQUM7QUFDckUsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0ICcuLi91dGlsL25nX2Rldl9tb2RlJztcblxuaW1wb3J0IHtPbkRlc3Ryb3l9IGZyb20gJy4uL2ludGVyZmFjZS9saWZlY3ljbGVfaG9va3MnO1xuaW1wb3J0IHtUeXBlfSBmcm9tICcuLi9pbnRlcmZhY2UvdHlwZSc7XG5pbXBvcnQge3Rocm93Q3ljbGljRGVwZW5kZW5jeUVycm9yLCB0aHJvd0ludmFsaWRQcm92aWRlckVycm9yLCB0aHJvd01peGVkTXVsdGlQcm92aWRlckVycm9yfSBmcm9tICcuLi9yZW5kZXIzL2Vycm9ycyc7XG5pbXBvcnQge3N0cmluZ2lmeX0gZnJvbSAnLi4vdXRpbC9zdHJpbmdpZnknO1xuXG5pbXBvcnQge3Jlc29sdmVGb3J3YXJkUmVmfSBmcm9tICcuL2ZvcndhcmRfcmVmJztcbmltcG9ydCB7SW5qZWN0aW9uVG9rZW59IGZyb20gJy4vaW5qZWN0aW9uX3Rva2VuJztcbmltcG9ydCB7SW5qZWN0b3J9IGZyb20gJy4vaW5qZWN0b3InO1xuaW1wb3J0IHtJTkpFQ1RPUiwgTkdfVEVNUF9UT0tFTl9QQVRILCBOdWxsSW5qZWN0b3IsIFRIUk9XX0lGX05PVF9GT1VORCwgVVNFX1ZBTFVFLCBjYXRjaEluamVjdG9yRXJyb3IsIGluamVjdEFyZ3MsIHNldEN1cnJlbnRJbmplY3RvciwgybXJtWluamVjdH0gZnJvbSAnLi9pbmplY3Rvcl9jb21wYXRpYmlsaXR5JztcbmltcG9ydCB7SW5qZWN0b3JUeXBlLCBJbmplY3RvclR5cGVXaXRoUHJvdmlkZXJzLCBnZXRJbmhlcml0ZWRJbmplY3RhYmxlRGVmLCBnZXRJbmplY3RhYmxlRGVmLCBnZXRJbmplY3RvckRlZiwgybXJtUluamVjdGFibGVEZWZ9IGZyb20gJy4vaW50ZXJmYWNlL2RlZnMnO1xuaW1wb3J0IHtJbmplY3RGbGFnc30gZnJvbSAnLi9pbnRlcmZhY2UvaW5qZWN0b3InO1xuaW1wb3J0IHtDbGFzc1Byb3ZpZGVyLCBDb25zdHJ1Y3RvclByb3ZpZGVyLCBFeGlzdGluZ1Byb3ZpZGVyLCBGYWN0b3J5UHJvdmlkZXIsIFN0YXRpY0NsYXNzUHJvdmlkZXIsIFN0YXRpY1Byb3ZpZGVyLCBUeXBlUHJvdmlkZXIsIFZhbHVlUHJvdmlkZXJ9IGZyb20gJy4vaW50ZXJmYWNlL3Byb3ZpZGVyJztcbmltcG9ydCB7QVBQX1JPT1R9IGZyb20gJy4vc2NvcGUnO1xuXG5cblxuLyoqXG4gKiBJbnRlcm5hbCB0eXBlIGZvciBhIHNpbmdsZSBwcm92aWRlciBpbiBhIGRlZXAgcHJvdmlkZXIgYXJyYXkuXG4gKi9cbnR5cGUgU2luZ2xlUHJvdmlkZXIgPSBUeXBlUHJvdmlkZXIgfCBWYWx1ZVByb3ZpZGVyIHwgQ2xhc3NQcm92aWRlciB8IENvbnN0cnVjdG9yUHJvdmlkZXIgfFxuICAgIEV4aXN0aW5nUHJvdmlkZXIgfCBGYWN0b3J5UHJvdmlkZXIgfCBTdGF0aWNDbGFzc1Byb3ZpZGVyO1xuXG4vKipcbiAqIE1hcmtlciB3aGljaCBpbmRpY2F0ZXMgdGhhdCBhIHZhbHVlIGhhcyBub3QgeWV0IGJlZW4gY3JlYXRlZCBmcm9tIHRoZSBmYWN0b3J5IGZ1bmN0aW9uLlxuICovXG5jb25zdCBOT1RfWUVUID0ge307XG5cbi8qKlxuICogTWFya2VyIHdoaWNoIGluZGljYXRlcyB0aGF0IHRoZSBmYWN0b3J5IGZ1bmN0aW9uIGZvciBhIHRva2VuIGlzIGluIHRoZSBwcm9jZXNzIG9mIGJlaW5nIGNhbGxlZC5cbiAqXG4gKiBJZiB0aGUgaW5qZWN0b3IgaXMgYXNrZWQgdG8gaW5qZWN0IGEgdG9rZW4gd2l0aCBpdHMgdmFsdWUgc2V0IHRvIENJUkNVTEFSLCB0aGF0IGluZGljYXRlc1xuICogaW5qZWN0aW9uIG9mIGEgZGVwZW5kZW5jeSBoYXMgcmVjdXJzaXZlbHkgYXR0ZW1wdGVkIHRvIGluamVjdCB0aGUgb3JpZ2luYWwgdG9rZW4sIGFuZCB0aGVyZSBpc1xuICogYSBjaXJjdWxhciBkZXBlbmRlbmN5IGFtb25nIHRoZSBwcm92aWRlcnMuXG4gKi9cbmNvbnN0IENJUkNVTEFSID0ge307XG5cbmNvbnN0IEVNUFRZX0FSUkFZID0gW10gYXMgYW55W107XG5cbi8qKlxuICogQSBsYXppbHkgaW5pdGlhbGl6ZWQgTnVsbEluamVjdG9yLlxuICovXG5sZXQgTlVMTF9JTkpFQ1RPUjogSW5qZWN0b3J8dW5kZWZpbmVkID0gdW5kZWZpbmVkO1xuXG5mdW5jdGlvbiBnZXROdWxsSW5qZWN0b3IoKTogSW5qZWN0b3Ige1xuICBpZiAoTlVMTF9JTkpFQ1RPUiA9PT0gdW5kZWZpbmVkKSB7XG4gICAgTlVMTF9JTkpFQ1RPUiA9IG5ldyBOdWxsSW5qZWN0b3IoKTtcbiAgfVxuICByZXR1cm4gTlVMTF9JTkpFQ1RPUjtcbn1cblxuLyoqXG4gKiBBbiBlbnRyeSBpbiB0aGUgaW5qZWN0b3Igd2hpY2ggdHJhY2tzIGluZm9ybWF0aW9uIGFib3V0IHRoZSBnaXZlbiB0b2tlbiwgaW5jbHVkaW5nIGEgcG9zc2libGVcbiAqIGN1cnJlbnQgdmFsdWUuXG4gKi9cbmludGVyZmFjZSBSZWNvcmQ8VD4ge1xuICBmYWN0b3J5OiAoKCkgPT4gVCl8dW5kZWZpbmVkO1xuICB2YWx1ZTogVHx7fTtcbiAgbXVsdGk6IGFueVtdfHVuZGVmaW5lZDtcbn1cblxuLyoqXG4gKiBDcmVhdGUgYSBuZXcgYEluamVjdG9yYCB3aGljaCBpcyBjb25maWd1cmVkIHVzaW5nIGEgYGRlZlR5cGVgIG9mIGBJbmplY3RvclR5cGU8YW55PmBzLlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUluamVjdG9yKFxuICAgIGRlZlR5cGU6IC8qIEluamVjdG9yVHlwZTxhbnk+ICovIGFueSwgcGFyZW50OiBJbmplY3RvciB8IG51bGwgPSBudWxsLFxuICAgIGFkZGl0aW9uYWxQcm92aWRlcnM6IFN0YXRpY1Byb3ZpZGVyW10gfCBudWxsID0gbnVsbCwgbmFtZT86IHN0cmluZyk6IEluamVjdG9yIHtcbiAgcGFyZW50ID0gcGFyZW50IHx8IGdldE51bGxJbmplY3RvcigpO1xuICByZXR1cm4gbmV3IFIzSW5qZWN0b3IoZGVmVHlwZSwgYWRkaXRpb25hbFByb3ZpZGVycywgcGFyZW50LCBuYW1lKTtcbn1cblxuZXhwb3J0IGNsYXNzIFIzSW5qZWN0b3Ige1xuICAvKipcbiAgICogTWFwIG9mIHRva2VucyB0byByZWNvcmRzIHdoaWNoIGNvbnRhaW4gdGhlIGluc3RhbmNlcyBvZiB0aG9zZSB0b2tlbnMuXG4gICAqL1xuICBwcml2YXRlIHJlY29yZHMgPSBuZXcgTWFwPFR5cGU8YW55PnxJbmplY3Rpb25Ub2tlbjxhbnk+LCBSZWNvcmQ8YW55Pj4oKTtcblxuICAvKipcbiAgICogVGhlIHRyYW5zaXRpdmUgc2V0IG9mIGBJbmplY3RvclR5cGVgcyB3aGljaCBkZWZpbmUgdGhpcyBpbmplY3Rvci5cbiAgICovXG4gIHByaXZhdGUgaW5qZWN0b3JEZWZUeXBlcyA9IG5ldyBTZXQ8SW5qZWN0b3JUeXBlPGFueT4+KCk7XG5cbiAgLyoqXG4gICAqIFNldCBvZiB2YWx1ZXMgaW5zdGFudGlhdGVkIGJ5IHRoaXMgaW5qZWN0b3Igd2hpY2ggY29udGFpbiBgbmdPbkRlc3Ryb3lgIGxpZmVjeWNsZSBob29rcy5cbiAgICovXG4gIHByaXZhdGUgb25EZXN0cm95ID0gbmV3IFNldDxPbkRlc3Ryb3k+KCk7XG5cbiAgLyoqXG4gICAqIEZsYWcgaW5kaWNhdGluZyB0aGlzIGluamVjdG9yIHByb3ZpZGVzIHRoZSBBUFBfUk9PVF9TQ09QRSB0b2tlbiwgYW5kIHRodXMgY291bnRzIGFzIHRoZVxuICAgKiByb290IHNjb3BlLlxuICAgKi9cbiAgcHJpdmF0ZSByZWFkb25seSBpc1Jvb3RJbmplY3RvcjogYm9vbGVhbjtcblxuICByZWFkb25seSBzb3VyY2U6IHN0cmluZ3xudWxsO1xuXG4gIC8qKlxuICAgKiBGbGFnIGluZGljYXRpbmcgdGhhdCB0aGlzIGluamVjdG9yIHdhcyBwcmV2aW91c2x5IGRlc3Ryb3llZC5cbiAgICovXG4gIGdldCBkZXN0cm95ZWQoKTogYm9vbGVhbiB7IHJldHVybiB0aGlzLl9kZXN0cm95ZWQ7IH1cbiAgcHJpdmF0ZSBfZGVzdHJveWVkID0gZmFsc2U7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgICBkZWY6IEluamVjdG9yVHlwZTxhbnk+LCBhZGRpdGlvbmFsUHJvdmlkZXJzOiBTdGF0aWNQcm92aWRlcltdfG51bGwsIHJlYWRvbmx5IHBhcmVudDogSW5qZWN0b3IsXG4gICAgICBzb3VyY2U6IHN0cmluZ3xudWxsID0gbnVsbCkge1xuICAgIC8vIFN0YXJ0IG9mZiBieSBjcmVhdGluZyBSZWNvcmRzIGZvciBldmVyeSBwcm92aWRlciBkZWNsYXJlZCBpbiBldmVyeSBJbmplY3RvclR5cGVcbiAgICAvLyBpbmNsdWRlZCB0cmFuc2l0aXZlbHkgaW4gYGRlZmAuXG4gICAgY29uc3QgZGVkdXBTdGFjazogSW5qZWN0b3JUeXBlPGFueT5bXSA9IFtdO1xuICAgIGRlZXBGb3JFYWNoKFtkZWZdLCBpbmplY3RvckRlZiA9PiB0aGlzLnByb2Nlc3NJbmplY3RvclR5cGUoaW5qZWN0b3JEZWYsIFtdLCBkZWR1cFN0YWNrKSk7XG5cbiAgICBhZGRpdGlvbmFsUHJvdmlkZXJzICYmIGRlZXBGb3JFYWNoKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFkZGl0aW9uYWxQcm92aWRlcnMsIHByb3ZpZGVyID0+IHRoaXMucHJvY2Vzc1Byb3ZpZGVyKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm92aWRlciwgZGVmLCBhZGRpdGlvbmFsUHJvdmlkZXJzKSk7XG5cblxuICAgIC8vIE1ha2Ugc3VyZSB0aGUgSU5KRUNUT1IgdG9rZW4gcHJvdmlkZXMgdGhpcyBpbmplY3Rvci5cbiAgICB0aGlzLnJlY29yZHMuc2V0KElOSkVDVE9SLCBtYWtlUmVjb3JkKHVuZGVmaW5lZCwgdGhpcykpO1xuXG4gICAgLy8gRGV0ZWN0IHdoZXRoZXIgdGhpcyBpbmplY3RvciBoYXMgdGhlIEFQUF9ST09UX1NDT1BFIHRva2VuIGFuZCB0aHVzIHNob3VsZCBwcm92aWRlXG4gICAgLy8gYW55IGluamVjdGFibGUgc2NvcGVkIHRvIEFQUF9ST09UX1NDT1BFLlxuICAgIHRoaXMuaXNSb290SW5qZWN0b3IgPSB0aGlzLnJlY29yZHMuaGFzKEFQUF9ST09UKTtcblxuICAgIC8vIEVhZ2VybHkgaW5zdGFudGlhdGUgdGhlIEluamVjdG9yVHlwZSBjbGFzc2VzIHRoZW1zZWx2ZXMuXG4gICAgdGhpcy5pbmplY3RvckRlZlR5cGVzLmZvckVhY2goZGVmVHlwZSA9PiB0aGlzLmdldChkZWZUeXBlKSk7XG5cbiAgICAvLyBTb3VyY2UgbmFtZSwgdXNlZCBmb3IgZGVidWdnaW5nXG4gICAgdGhpcy5zb3VyY2UgPSBzb3VyY2UgfHwgKHR5cGVvZiBkZWYgPT09ICdvYmplY3QnID8gbnVsbCA6IHN0cmluZ2lmeShkZWYpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZXN0cm95IHRoZSBpbmplY3RvciBhbmQgcmVsZWFzZSByZWZlcmVuY2VzIHRvIGV2ZXJ5IGluc3RhbmNlIG9yIHByb3ZpZGVyIGFzc29jaWF0ZWQgd2l0aCBpdC5cbiAgICpcbiAgICogQWxzbyBjYWxscyB0aGUgYE9uRGVzdHJveWAgbGlmZWN5Y2xlIGhvb2tzIG9mIGV2ZXJ5IGluc3RhbmNlIHRoYXQgd2FzIGNyZWF0ZWQgZm9yIHdoaWNoIGFcbiAgICogaG9vayB3YXMgZm91bmQuXG4gICAqL1xuICBkZXN0cm95KCk6IHZvaWQge1xuICAgIHRoaXMuYXNzZXJ0Tm90RGVzdHJveWVkKCk7XG5cbiAgICAvLyBTZXQgZGVzdHJveWVkID0gdHJ1ZSBmaXJzdCwgaW4gY2FzZSBsaWZlY3ljbGUgaG9va3MgcmUtZW50ZXIgZGVzdHJveSgpLlxuICAgIHRoaXMuX2Rlc3Ryb3llZCA9IHRydWU7XG4gICAgdHJ5IHtcbiAgICAgIC8vIENhbGwgYWxsIHRoZSBsaWZlY3ljbGUgaG9va3MuXG4gICAgICB0aGlzLm9uRGVzdHJveS5mb3JFYWNoKHNlcnZpY2UgPT4gc2VydmljZS5uZ09uRGVzdHJveSgpKTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgLy8gUmVsZWFzZSBhbGwgcmVmZXJlbmNlcy5cbiAgICAgIHRoaXMucmVjb3Jkcy5jbGVhcigpO1xuICAgICAgdGhpcy5vbkRlc3Ryb3kuY2xlYXIoKTtcbiAgICAgIHRoaXMuaW5qZWN0b3JEZWZUeXBlcy5jbGVhcigpO1xuICAgIH1cbiAgfVxuXG4gIGdldDxUPihcbiAgICAgIHRva2VuOiBUeXBlPFQ+fEluamVjdGlvblRva2VuPFQ+LCBub3RGb3VuZFZhbHVlOiBhbnkgPSBUSFJPV19JRl9OT1RfRk9VTkQsXG4gICAgICBmbGFncyA9IEluamVjdEZsYWdzLkRlZmF1bHQpOiBUIHtcbiAgICB0aGlzLmFzc2VydE5vdERlc3Ryb3llZCgpO1xuICAgIC8vIFNldCB0aGUgaW5qZWN0aW9uIGNvbnRleHQuXG4gICAgY29uc3QgcHJldmlvdXNJbmplY3RvciA9IHNldEN1cnJlbnRJbmplY3Rvcih0aGlzKTtcbiAgICB0cnkge1xuICAgICAgLy8gQ2hlY2sgZm9yIHRoZSBTa2lwU2VsZiBmbGFnLlxuICAgICAgaWYgKCEoZmxhZ3MgJiBJbmplY3RGbGFncy5Ta2lwU2VsZikpIHtcbiAgICAgICAgLy8gU2tpcFNlbGYgaXNuJ3Qgc2V0LCBjaGVjayBpZiB0aGUgcmVjb3JkIGJlbG9uZ3MgdG8gdGhpcyBpbmplY3Rvci5cbiAgICAgICAgbGV0IHJlY29yZDogUmVjb3JkPFQ+fHVuZGVmaW5lZCA9IHRoaXMucmVjb3Jkcy5nZXQodG9rZW4pO1xuICAgICAgICBpZiAocmVjb3JkID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAvLyBObyByZWNvcmQsIGJ1dCBtYXliZSB0aGUgdG9rZW4gaXMgc2NvcGVkIHRvIHRoaXMgaW5qZWN0b3IuIExvb2sgZm9yIGFuIG5nSW5qZWN0YWJsZURlZlxuICAgICAgICAgIC8vIHdpdGggYSBzY29wZSBtYXRjaGluZyB0aGlzIGluamVjdG9yLlxuICAgICAgICAgIGNvbnN0IGRlZiA9IGNvdWxkQmVJbmplY3RhYmxlVHlwZSh0b2tlbikgJiYgZ2V0SW5qZWN0YWJsZURlZih0b2tlbik7XG4gICAgICAgICAgaWYgKGRlZiAmJiB0aGlzLmluamVjdGFibGVEZWZJblNjb3BlKGRlZikpIHtcbiAgICAgICAgICAgIC8vIEZvdW5kIGFuIG5nSW5qZWN0YWJsZURlZiBhbmQgaXQncyBzY29wZWQgdG8gdGhpcyBpbmplY3Rvci4gUHJldGVuZCBhcyBpZiBpdCB3YXMgaGVyZVxuICAgICAgICAgICAgLy8gYWxsIGFsb25nLlxuICAgICAgICAgICAgcmVjb3JkID0gbWFrZVJlY29yZChpbmplY3RhYmxlRGVmT3JJbmplY3RvckRlZkZhY3RvcnkodG9rZW4pLCBOT1RfWUVUKTtcbiAgICAgICAgICAgIHRoaXMucmVjb3Jkcy5zZXQodG9rZW4sIHJlY29yZCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8vIElmIGEgcmVjb3JkIHdhcyBmb3VuZCwgZ2V0IHRoZSBpbnN0YW5jZSBmb3IgaXQgYW5kIHJldHVybiBpdC5cbiAgICAgICAgaWYgKHJlY29yZCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMuaHlkcmF0ZSh0b2tlbiwgcmVjb3JkKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBTZWxlY3QgdGhlIG5leHQgaW5qZWN0b3IgYmFzZWQgb24gdGhlIFNlbGYgZmxhZyAtIGlmIHNlbGYgaXMgc2V0LCB0aGUgbmV4dCBpbmplY3RvciBpc1xuICAgICAgLy8gdGhlIE51bGxJbmplY3Rvciwgb3RoZXJ3aXNlIGl0J3MgdGhlIHBhcmVudC5cbiAgICAgIGNvbnN0IG5leHRJbmplY3RvciA9ICEoZmxhZ3MgJiBJbmplY3RGbGFncy5TZWxmKSA/IHRoaXMucGFyZW50IDogZ2V0TnVsbEluamVjdG9yKCk7XG4gICAgICByZXR1cm4gbmV4dEluamVjdG9yLmdldCh0b2tlbiwgZmxhZ3MgJiBJbmplY3RGbGFncy5PcHRpb25hbCA/IG51bGwgOiBub3RGb3VuZFZhbHVlKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBpZiAoZS5uYW1lID09PSAnTnVsbEluamVjdG9yRXJyb3InKSB7XG4gICAgICAgIGNvbnN0IHBhdGg6IGFueVtdID0gZVtOR19URU1QX1RPS0VOX1BBVEhdID0gZVtOR19URU1QX1RPS0VOX1BBVEhdIHx8IFtdO1xuICAgICAgICBwYXRoLnVuc2hpZnQoc3RyaW5naWZ5KHRva2VuKSk7XG4gICAgICAgIGlmIChwcmV2aW91c0luamVjdG9yKSB7XG4gICAgICAgICAgLy8gV2Ugc3RpbGwgaGF2ZSBhIHBhcmVudCBpbmplY3Rvciwga2VlcCB0aHJvd2luZ1xuICAgICAgICAgIHRocm93IGU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gRm9ybWF0ICYgdGhyb3cgdGhlIGZpbmFsIGVycm9yIG1lc3NhZ2Ugd2hlbiB3ZSBkb24ndCBoYXZlIGFueSBwcmV2aW91cyBpbmplY3RvclxuICAgICAgICAgIHJldHVybiBjYXRjaEluamVjdG9yRXJyb3IoZSwgdG9rZW4sICdSM0luamVjdG9yRXJyb3InLCB0aGlzLnNvdXJjZSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IGU7XG4gICAgICB9XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIC8vIExhc3RseSwgY2xlYW4gdXAgdGhlIHN0YXRlIGJ5IHJlc3RvcmluZyB0aGUgcHJldmlvdXMgaW5qZWN0b3IuXG4gICAgICBzZXRDdXJyZW50SW5qZWN0b3IocHJldmlvdXNJbmplY3Rvcik7XG4gICAgfVxuICB9XG5cbiAgdG9TdHJpbmcoKSB7XG4gICAgY29uc3QgdG9rZW5zID0gPHN0cmluZ1tdPltdLCByZWNvcmRzID0gdGhpcy5yZWNvcmRzO1xuICAgIHJlY29yZHMuZm9yRWFjaCgodiwgdG9rZW4pID0+IHRva2Vucy5wdXNoKHN0cmluZ2lmeSh0b2tlbikpKTtcbiAgICByZXR1cm4gYFIzSW5qZWN0b3JbJHt0b2tlbnMuam9pbignLCAnKX1dYDtcbiAgfVxuXG4gIHByaXZhdGUgYXNzZXJ0Tm90RGVzdHJveWVkKCk6IHZvaWQge1xuICAgIGlmICh0aGlzLl9kZXN0cm95ZWQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignSW5qZWN0b3IgaGFzIGFscmVhZHkgYmVlbiBkZXN0cm95ZWQuJyk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEFkZCBhbiBgSW5qZWN0b3JUeXBlYCBvciBgSW5qZWN0b3JUeXBlV2l0aFByb3ZpZGVyc2AgYW5kIGFsbCBvZiBpdHMgdHJhbnNpdGl2ZSBwcm92aWRlcnNcbiAgICogdG8gdGhpcyBpbmplY3Rvci5cbiAgICpcbiAgICogSWYgYW4gYEluamVjdG9yVHlwZVdpdGhQcm92aWRlcnNgIHRoYXQgZGVjbGFyZXMgcHJvdmlkZXJzIGJlc2lkZXMgdGhlIHR5cGUgaXMgc3BlY2lmaWVkLFxuICAgKiB0aGUgZnVuY3Rpb24gd2lsbCByZXR1cm4gXCJ0cnVlXCIgdG8gaW5kaWNhdGUgdGhhdCB0aGUgcHJvdmlkZXJzIG9mIHRoZSB0eXBlIGRlZmluaXRpb24gbmVlZFxuICAgKiB0byBiZSBwcm9jZXNzZWQuIFRoaXMgYWxsb3dzIHVzIHRvIHByb2Nlc3MgcHJvdmlkZXJzIG9mIGluamVjdG9yIHR5cGVzIGFmdGVyIGFsbCBpbXBvcnRzIG9mXG4gICAqIGFuIGluamVjdG9yIGRlZmluaXRpb24gYXJlIHByb2Nlc3NlZC4gKGZvbGxvd2luZyBWaWV3IEVuZ2luZSBzZW1hbnRpY3M6IHNlZSBGVy0xMzQ5KVxuICAgKi9cbiAgcHJpdmF0ZSBwcm9jZXNzSW5qZWN0b3JUeXBlKFxuICAgICAgZGVmT3JXcmFwcGVkRGVmOiBJbmplY3RvclR5cGU8YW55PnxJbmplY3RvclR5cGVXaXRoUHJvdmlkZXJzPGFueT4sXG4gICAgICBwYXJlbnRzOiBJbmplY3RvclR5cGU8YW55PltdLFxuICAgICAgZGVkdXBTdGFjazogSW5qZWN0b3JUeXBlPGFueT5bXSk6IGRlZk9yV3JhcHBlZERlZiBpcyBJbmplY3RvclR5cGVXaXRoUHJvdmlkZXJzPGFueT4ge1xuICAgIGRlZk9yV3JhcHBlZERlZiA9IHJlc29sdmVGb3J3YXJkUmVmKGRlZk9yV3JhcHBlZERlZik7XG4gICAgaWYgKCFkZWZPcldyYXBwZWREZWYpIHJldHVybiBmYWxzZTtcblxuICAgIC8vIEVpdGhlciB0aGUgZGVmT3JXcmFwcGVkRGVmIGlzIGFuIEluamVjdG9yVHlwZSAod2l0aCBuZ0luamVjdG9yRGVmKSBvciBhblxuICAgIC8vIEluamVjdG9yRGVmVHlwZVdpdGhQcm92aWRlcnMgKGFrYSBNb2R1bGVXaXRoUHJvdmlkZXJzKS4gRGV0ZWN0aW5nIGVpdGhlciBpcyBhIG1lZ2Ftb3JwaGljXG4gICAgLy8gcmVhZCwgc28gY2FyZSBpcyB0YWtlbiB0byBvbmx5IGRvIHRoZSByZWFkIG9uY2UuXG5cbiAgICAvLyBGaXJzdCBhdHRlbXB0IHRvIHJlYWQgdGhlIG5nSW5qZWN0b3JEZWYuXG4gICAgbGV0IGRlZiA9IGdldEluamVjdG9yRGVmKGRlZk9yV3JhcHBlZERlZik7XG5cbiAgICAvLyBJZiB0aGF0J3Mgbm90IHByZXNlbnQsIHRoZW4gYXR0ZW1wdCB0byByZWFkIG5nTW9kdWxlIGZyb20gdGhlIEluamVjdG9yRGVmVHlwZVdpdGhQcm92aWRlcnMuXG4gICAgY29uc3QgbmdNb2R1bGUgPVxuICAgICAgICAoZGVmID09IG51bGwpICYmIChkZWZPcldyYXBwZWREZWYgYXMgSW5qZWN0b3JUeXBlV2l0aFByb3ZpZGVyczxhbnk+KS5uZ01vZHVsZSB8fCB1bmRlZmluZWQ7XG5cbiAgICAvLyBEZXRlcm1pbmUgdGhlIEluamVjdG9yVHlwZS4gSW4gdGhlIGNhc2Ugd2hlcmUgYGRlZk9yV3JhcHBlZERlZmAgaXMgYW4gYEluamVjdG9yVHlwZWAsXG4gICAgLy8gdGhlbiB0aGlzIGlzIGVhc3kuIEluIHRoZSBjYXNlIG9mIGFuIEluamVjdG9yRGVmVHlwZVdpdGhQcm92aWRlcnMsIHRoZW4gdGhlIGRlZmluaXRpb24gdHlwZVxuICAgIC8vIGlzIHRoZSBgbmdNb2R1bGVgLlxuICAgIGNvbnN0IGRlZlR5cGU6IEluamVjdG9yVHlwZTxhbnk+ID1cbiAgICAgICAgKG5nTW9kdWxlID09PSB1bmRlZmluZWQpID8gKGRlZk9yV3JhcHBlZERlZiBhcyBJbmplY3RvclR5cGU8YW55PikgOiBuZ01vZHVsZTtcblxuICAgIC8vIENoZWNrIGZvciBjaXJjdWxhciBkZXBlbmRlbmNpZXMuXG4gICAgaWYgKG5nRGV2TW9kZSAmJiBwYXJlbnRzLmluZGV4T2YoZGVmVHlwZSkgIT09IC0xKSB7XG4gICAgICBjb25zdCBkZWZOYW1lID0gc3RyaW5naWZ5KGRlZlR5cGUpO1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgIGBDaXJjdWxhciBkZXBlbmRlbmN5IGluIERJIGRldGVjdGVkIGZvciB0eXBlICR7ZGVmTmFtZX0uIERlcGVuZGVuY3kgcGF0aDogJHtwYXJlbnRzLm1hcChkZWZUeXBlID0+IHN0cmluZ2lmeShkZWZUeXBlKSkuam9pbignID4gJyl9ID4gJHtkZWZOYW1lfS5gKTtcbiAgICB9XG5cbiAgICAvLyBDaGVjayBmb3IgbXVsdGlwbGUgaW1wb3J0cyBvZiB0aGUgc2FtZSBtb2R1bGVcbiAgICBjb25zdCBpc0R1cGxpY2F0ZSA9IGRlZHVwU3RhY2suaW5kZXhPZihkZWZUeXBlKSAhPT0gLTE7XG5cbiAgICAvLyBGaW5hbGx5LCBpZiBkZWZPcldyYXBwZWRUeXBlIHdhcyBhbiBgSW5qZWN0b3JEZWZUeXBlV2l0aFByb3ZpZGVyc2AsIHRoZW4gdGhlIGFjdHVhbFxuICAgIC8vIGBJbmplY3RvckRlZmAgaXMgb24gaXRzIGBuZ01vZHVsZWAuXG4gICAgaWYgKG5nTW9kdWxlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGRlZiA9IGdldEluamVjdG9yRGVmKG5nTW9kdWxlKTtcbiAgICB9XG5cbiAgICAvLyBJZiBubyBkZWZpbml0aW9uIHdhcyBmb3VuZCwgaXQgbWlnaHQgYmUgZnJvbSBleHBvcnRzLiBSZW1vdmUgaXQuXG4gICAgaWYgKGRlZiA9PSBudWxsKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgLy8gVHJhY2sgdGhlIEluamVjdG9yVHlwZSBhbmQgYWRkIGEgcHJvdmlkZXIgZm9yIGl0LlxuICAgIHRoaXMuaW5qZWN0b3JEZWZUeXBlcy5hZGQoZGVmVHlwZSk7XG4gICAgdGhpcy5yZWNvcmRzLnNldChkZWZUeXBlLCBtYWtlUmVjb3JkKGRlZi5mYWN0b3J5LCBOT1RfWUVUKSk7XG5cbiAgICAvLyBBZGQgcHJvdmlkZXJzIGluIHRoZSBzYW1lIHdheSB0aGF0IEBOZ01vZHVsZSByZXNvbHV0aW9uIGRpZDpcblxuICAgIC8vIEZpcnN0LCBpbmNsdWRlIHByb3ZpZGVycyBmcm9tIGFueSBpbXBvcnRzLlxuICAgIGlmIChkZWYuaW1wb3J0cyAhPSBudWxsICYmICFpc0R1cGxpY2F0ZSkge1xuICAgICAgLy8gQmVmb3JlIHByb2Nlc3NpbmcgZGVmVHlwZSdzIGltcG9ydHMsIGFkZCBpdCB0byB0aGUgc2V0IG9mIHBhcmVudHMuIFRoaXMgd2F5LCBpZiBpdCBlbmRzXG4gICAgICAvLyB1cCBkZWVwbHkgaW1wb3J0aW5nIGl0c2VsZiwgdGhpcyBjYW4gYmUgZGV0ZWN0ZWQuXG4gICAgICBuZ0Rldk1vZGUgJiYgcGFyZW50cy5wdXNoKGRlZlR5cGUpO1xuICAgICAgLy8gQWRkIGl0IHRvIHRoZSBzZXQgb2YgZGVkdXBzLiBUaGlzIHdheSB3ZSBjYW4gZGV0ZWN0IG11bHRpcGxlIGltcG9ydHMgb2YgdGhlIHNhbWUgbW9kdWxlXG4gICAgICBkZWR1cFN0YWNrLnB1c2goZGVmVHlwZSk7XG5cbiAgICAgIGxldCBpbXBvcnRUeXBlc1dpdGhQcm92aWRlcnM6IChJbmplY3RvclR5cGVXaXRoUHJvdmlkZXJzPGFueT5bXSl8dW5kZWZpbmVkO1xuICAgICAgdHJ5IHtcbiAgICAgICAgZGVlcEZvckVhY2goZGVmLmltcG9ydHMsIGltcG9ydGVkID0+IHtcbiAgICAgICAgICBpZiAodGhpcy5wcm9jZXNzSW5qZWN0b3JUeXBlKGltcG9ydGVkLCBwYXJlbnRzLCBkZWR1cFN0YWNrKSkge1xuICAgICAgICAgICAgaWYgKGltcG9ydFR5cGVzV2l0aFByb3ZpZGVycyA9PT0gdW5kZWZpbmVkKSBpbXBvcnRUeXBlc1dpdGhQcm92aWRlcnMgPSBbXTtcbiAgICAgICAgICAgIC8vIElmIHRoZSBwcm9jZXNzZWQgaW1wb3J0IGlzIGFuIGluamVjdG9yIHR5cGUgd2l0aCBwcm92aWRlcnMsIHdlIHN0b3JlIGl0IGluIHRoZVxuICAgICAgICAgICAgLy8gbGlzdCBvZiBpbXBvcnQgdHlwZXMgd2l0aCBwcm92aWRlcnMsIHNvIHRoYXQgd2UgY2FuIHByb2Nlc3MgdGhvc2UgYWZ0ZXJ3YXJkcy5cbiAgICAgICAgICAgIGltcG9ydFR5cGVzV2l0aFByb3ZpZGVycy5wdXNoKGltcG9ydGVkKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgLy8gUmVtb3ZlIGl0IGZyb20gdGhlIHBhcmVudHMgc2V0IHdoZW4gZmluaXNoZWQuXG4gICAgICAgIG5nRGV2TW9kZSAmJiBwYXJlbnRzLnBvcCgpO1xuICAgICAgfVxuXG4gICAgICAvLyBJbXBvcnRzIHdoaWNoIGFyZSBkZWNsYXJlZCB3aXRoIHByb3ZpZGVycyAoVHlwZVdpdGhQcm92aWRlcnMpIG5lZWQgdG8gYmUgcHJvY2Vzc2VkXG4gICAgICAvLyBhZnRlciBhbGwgaW1wb3J0ZWQgbW9kdWxlcyBhcmUgcHJvY2Vzc2VkLiBUaGlzIGlzIHNpbWlsYXIgdG8gaG93IFZpZXcgRW5naW5lXG4gICAgICAvLyBwcm9jZXNzZXMvbWVyZ2VzIG1vZHVsZSBpbXBvcnRzIGluIHRoZSBtZXRhZGF0YSByZXNvbHZlci4gU2VlOiBGVy0xMzQ5LlxuICAgICAgaWYgKGltcG9ydFR5cGVzV2l0aFByb3ZpZGVycyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgaW1wb3J0VHlwZXNXaXRoUHJvdmlkZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgY29uc3Qge25nTW9kdWxlLCBwcm92aWRlcnN9ID0gaW1wb3J0VHlwZXNXaXRoUHJvdmlkZXJzW2ldO1xuICAgICAgICAgIGRlZXBGb3JFYWNoKFxuICAgICAgICAgICAgICBwcm92aWRlcnMgISxcbiAgICAgICAgICAgICAgcHJvdmlkZXIgPT4gdGhpcy5wcm9jZXNzUHJvdmlkZXIocHJvdmlkZXIsIG5nTW9kdWxlLCBwcm92aWRlcnMgfHwgRU1QVFlfQVJSQVkpKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIC8vIE5leHQsIGluY2x1ZGUgcHJvdmlkZXJzIGxpc3RlZCBvbiB0aGUgZGVmaW5pdGlvbiBpdHNlbGYuXG4gICAgY29uc3QgZGVmUHJvdmlkZXJzID0gZGVmLnByb3ZpZGVycztcbiAgICBpZiAoZGVmUHJvdmlkZXJzICE9IG51bGwgJiYgIWlzRHVwbGljYXRlKSB7XG4gICAgICBjb25zdCBpbmplY3RvclR5cGUgPSBkZWZPcldyYXBwZWREZWYgYXMgSW5qZWN0b3JUeXBlPGFueT47XG4gICAgICBkZWVwRm9yRWFjaChcbiAgICAgICAgICBkZWZQcm92aWRlcnMsIHByb3ZpZGVyID0+IHRoaXMucHJvY2Vzc1Byb3ZpZGVyKHByb3ZpZGVyLCBpbmplY3RvclR5cGUsIGRlZlByb3ZpZGVycykpO1xuICAgIH1cblxuICAgIHJldHVybiAoXG4gICAgICAgIG5nTW9kdWxlICE9PSB1bmRlZmluZWQgJiZcbiAgICAgICAgKGRlZk9yV3JhcHBlZERlZiBhcyBJbmplY3RvclR5cGVXaXRoUHJvdmlkZXJzPGFueT4pLnByb3ZpZGVycyAhPT0gdW5kZWZpbmVkKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBQcm9jZXNzIGEgYFNpbmdsZVByb3ZpZGVyYCBhbmQgYWRkIGl0LlxuICAgKi9cbiAgcHJpdmF0ZSBwcm9jZXNzUHJvdmlkZXIoXG4gICAgICBwcm92aWRlcjogU2luZ2xlUHJvdmlkZXIsIG5nTW9kdWxlVHlwZTogSW5qZWN0b3JUeXBlPGFueT4sIHByb3ZpZGVyczogYW55W10pOiB2b2lkIHtcbiAgICAvLyBEZXRlcm1pbmUgdGhlIHRva2VuIGZyb20gdGhlIHByb3ZpZGVyLiBFaXRoZXIgaXQncyBpdHMgb3duIHRva2VuLCBvciBoYXMgYSB7cHJvdmlkZTogLi4ufVxuICAgIC8vIHByb3BlcnR5LlxuICAgIHByb3ZpZGVyID0gcmVzb2x2ZUZvcndhcmRSZWYocHJvdmlkZXIpO1xuICAgIGxldCB0b2tlbjogYW55ID1cbiAgICAgICAgaXNUeXBlUHJvdmlkZXIocHJvdmlkZXIpID8gcHJvdmlkZXIgOiByZXNvbHZlRm9yd2FyZFJlZihwcm92aWRlciAmJiBwcm92aWRlci5wcm92aWRlKTtcblxuICAgIC8vIENvbnN0cnVjdCBhIGBSZWNvcmRgIGZvciB0aGUgcHJvdmlkZXIuXG4gICAgY29uc3QgcmVjb3JkID0gcHJvdmlkZXJUb1JlY29yZChwcm92aWRlciwgbmdNb2R1bGVUeXBlLCBwcm92aWRlcnMpO1xuXG4gICAgaWYgKCFpc1R5cGVQcm92aWRlcihwcm92aWRlcikgJiYgcHJvdmlkZXIubXVsdGkgPT09IHRydWUpIHtcbiAgICAgIC8vIElmIHRoZSBwcm92aWRlciBpbmRpY2F0ZXMgdGhhdCBpdCdzIGEgbXVsdGktcHJvdmlkZXIsIHByb2Nlc3MgaXQgc3BlY2lhbGx5LlxuICAgICAgLy8gRmlyc3QgY2hlY2sgd2hldGhlciBpdCdzIGJlZW4gZGVmaW5lZCBhbHJlYWR5LlxuICAgICAgbGV0IG11bHRpUmVjb3JkID0gdGhpcy5yZWNvcmRzLmdldCh0b2tlbik7XG4gICAgICBpZiAobXVsdGlSZWNvcmQpIHtcbiAgICAgICAgLy8gSXQgaGFzLiBUaHJvdyBhIG5pY2UgZXJyb3IgaWZcbiAgICAgICAgaWYgKG11bHRpUmVjb3JkLm11bHRpID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICB0aHJvd01peGVkTXVsdGlQcm92aWRlckVycm9yKCk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG11bHRpUmVjb3JkID0gbWFrZVJlY29yZCh1bmRlZmluZWQsIE5PVF9ZRVQsIHRydWUpO1xuICAgICAgICBtdWx0aVJlY29yZC5mYWN0b3J5ID0gKCkgPT4gaW5qZWN0QXJncyhtdWx0aVJlY29yZCAhLm11bHRpICEpO1xuICAgICAgICB0aGlzLnJlY29yZHMuc2V0KHRva2VuLCBtdWx0aVJlY29yZCk7XG4gICAgICB9XG4gICAgICB0b2tlbiA9IHByb3ZpZGVyO1xuICAgICAgbXVsdGlSZWNvcmQubXVsdGkgIS5wdXNoKHByb3ZpZGVyKTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgZXhpc3RpbmcgPSB0aGlzLnJlY29yZHMuZ2V0KHRva2VuKTtcbiAgICAgIGlmIChleGlzdGluZyAmJiBleGlzdGluZy5tdWx0aSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHRocm93TWl4ZWRNdWx0aVByb3ZpZGVyRXJyb3IoKTtcbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5yZWNvcmRzLnNldCh0b2tlbiwgcmVjb3JkKTtcbiAgfVxuXG4gIHByaXZhdGUgaHlkcmF0ZTxUPih0b2tlbjogVHlwZTxUPnxJbmplY3Rpb25Ub2tlbjxUPiwgcmVjb3JkOiBSZWNvcmQ8VD4pOiBUIHtcbiAgICBpZiAocmVjb3JkLnZhbHVlID09PSBDSVJDVUxBUikge1xuICAgICAgdGhyb3dDeWNsaWNEZXBlbmRlbmN5RXJyb3Ioc3RyaW5naWZ5KHRva2VuKSk7XG4gICAgfSBlbHNlIGlmIChyZWNvcmQudmFsdWUgPT09IE5PVF9ZRVQpIHtcbiAgICAgIHJlY29yZC52YWx1ZSA9IENJUkNVTEFSO1xuICAgICAgcmVjb3JkLnZhbHVlID0gcmVjb3JkLmZhY3RvcnkgISgpO1xuICAgIH1cbiAgICBpZiAodHlwZW9mIHJlY29yZC52YWx1ZSA9PT0gJ29iamVjdCcgJiYgcmVjb3JkLnZhbHVlICYmIGhhc09uRGVzdHJveShyZWNvcmQudmFsdWUpKSB7XG4gICAgICB0aGlzLm9uRGVzdHJveS5hZGQocmVjb3JkLnZhbHVlKTtcbiAgICB9XG4gICAgcmV0dXJuIHJlY29yZC52YWx1ZSBhcyBUO1xuICB9XG5cbiAgcHJpdmF0ZSBpbmplY3RhYmxlRGVmSW5TY29wZShkZWY6IMm1ybVJbmplY3RhYmxlRGVmPGFueT4pOiBib29sZWFuIHtcbiAgICBpZiAoIWRlZi5wcm92aWRlZEluKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSBlbHNlIGlmICh0eXBlb2YgZGVmLnByb3ZpZGVkSW4gPT09ICdzdHJpbmcnKSB7XG4gICAgICByZXR1cm4gZGVmLnByb3ZpZGVkSW4gPT09ICdhbnknIHx8IChkZWYucHJvdmlkZWRJbiA9PT0gJ3Jvb3QnICYmIHRoaXMuaXNSb290SW5qZWN0b3IpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gdGhpcy5pbmplY3RvckRlZlR5cGVzLmhhcyhkZWYucHJvdmlkZWRJbik7XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIGluamVjdGFibGVEZWZPckluamVjdG9yRGVmRmFjdG9yeSh0b2tlbjogVHlwZTxhbnk+fCBJbmplY3Rpb25Ub2tlbjxhbnk+KTogKCkgPT4gYW55IHtcbiAgLy8gTW9zdCB0b2tlbnMgd2lsbCBoYXZlIGFuIG5nSW5qZWN0YWJsZURlZiBkaXJlY3RseSBvbiB0aGVtLCB3aGljaCBzcGVjaWZpZXMgYSBmYWN0b3J5IGRpcmVjdGx5LlxuICBjb25zdCBpbmplY3RhYmxlRGVmID0gZ2V0SW5qZWN0YWJsZURlZih0b2tlbik7XG4gIGlmIChpbmplY3RhYmxlRGVmICE9PSBudWxsKSB7XG4gICAgcmV0dXJuIGluamVjdGFibGVEZWYuZmFjdG9yeTtcbiAgfVxuXG4gIC8vIElmIHRoZSB0b2tlbiBpcyBhbiBOZ01vZHVsZSwgaXQncyBhbHNvIGluamVjdGFibGUgYnV0IHRoZSBmYWN0b3J5IGlzIG9uIGl0cyBuZ0luamVjdG9yRGVmLlxuICBjb25zdCBpbmplY3RvckRlZiA9IGdldEluamVjdG9yRGVmKHRva2VuKTtcbiAgaWYgKGluamVjdG9yRGVmICE9PSBudWxsKSB7XG4gICAgcmV0dXJuIGluamVjdG9yRGVmLmZhY3Rvcnk7XG4gIH1cblxuICAvLyBJbmplY3Rpb25Ub2tlbnMgc2hvdWxkIGhhdmUgYW4gbmdJbmplY3RhYmxlRGVmIGFuZCB0aHVzIHNob3VsZCBiZSBoYW5kbGVkIGFib3ZlLlxuICAvLyBJZiBpdCdzIG1pc3NpbmcgdGhhdCwgaXQncyBhbiBlcnJvci5cbiAgaWYgKHRva2VuIGluc3RhbmNlb2YgSW5qZWN0aW9uVG9rZW4pIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYFRva2VuICR7c3RyaW5naWZ5KHRva2VuKX0gaXMgbWlzc2luZyBhbiBuZ0luamVjdGFibGVEZWYgZGVmaW5pdGlvbi5gKTtcbiAgfVxuXG4gIC8vIFVuZGVjb3JhdGVkIHR5cGVzIGNhbiBzb21ldGltZXMgYmUgY3JlYXRlZCBpZiB0aGV5IGhhdmUgbm8gY29uc3RydWN0b3IgYXJndW1lbnRzLlxuICBpZiAodG9rZW4gaW5zdGFuY2VvZiBGdW5jdGlvbikge1xuICAgIHJldHVybiBnZXRVbmRlY29yYXRlZEluamVjdGFibGVGYWN0b3J5KHRva2VuKTtcbiAgfVxuXG4gIC8vIFRoZXJlIHdhcyBubyB3YXkgdG8gcmVzb2x2ZSBhIGZhY3RvcnkgZm9yIHRoaXMgdG9rZW4uXG4gIHRocm93IG5ldyBFcnJvcigndW5yZWFjaGFibGUnKTtcbn1cblxuZnVuY3Rpb24gZ2V0VW5kZWNvcmF0ZWRJbmplY3RhYmxlRmFjdG9yeSh0b2tlbjogRnVuY3Rpb24pIHtcbiAgLy8gSWYgdGhlIHRva2VuIGhhcyBwYXJhbWV0ZXJzIHRoZW4gaXQgaGFzIGRlcGVuZGVuY2llcyB0aGF0IHdlIGNhbm5vdCByZXNvbHZlIGltcGxpY2l0bHkuXG4gIGNvbnN0IHBhcmFtTGVuZ3RoID0gdG9rZW4ubGVuZ3RoO1xuICBpZiAocGFyYW1MZW5ndGggPiAwKSB7XG4gICAgY29uc3QgYXJnczogc3RyaW5nW10gPSBuZXcgQXJyYXkocGFyYW1MZW5ndGgpLmZpbGwoJz8nKTtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYENhbid0IHJlc29sdmUgYWxsIHBhcmFtZXRlcnMgZm9yICR7c3RyaW5naWZ5KHRva2VuKX06ICgke2FyZ3Muam9pbignLCAnKX0pLmApO1xuICB9XG5cbiAgLy8gVGhlIGNvbnN0cnVjdG9yIGZ1bmN0aW9uIGFwcGVhcnMgdG8gaGF2ZSBubyBwYXJhbWV0ZXJzLlxuICAvLyBUaGlzIG1pZ2h0IGJlIGJlY2F1c2UgaXQgaW5oZXJpdHMgZnJvbSBhIHN1cGVyLWNsYXNzLiBJbiB3aGljaCBjYXNlLCB1c2UgYW4gbmdJbmplY3RhYmxlRGVmXG4gIC8vIGZyb20gYW4gYW5jZXN0b3IgaWYgdGhlcmUgaXMgb25lLlxuICAvLyBPdGhlcndpc2UgdGhpcyByZWFsbHkgaXMgYSBzaW1wbGUgY2xhc3Mgd2l0aCBubyBkZXBlbmRlbmNpZXMsIHNvIHJldHVybiBhIGZhY3RvcnkgdGhhdFxuICAvLyBqdXN0IGluc3RhbnRpYXRlcyB0aGUgemVyby1hcmcgY29uc3RydWN0b3IuXG4gIGNvbnN0IGluaGVyaXRlZEluamVjdGFibGVEZWYgPSBnZXRJbmhlcml0ZWRJbmplY3RhYmxlRGVmKHRva2VuKTtcbiAgaWYgKGluaGVyaXRlZEluamVjdGFibGVEZWYgIT09IG51bGwpIHtcbiAgICByZXR1cm4gaW5oZXJpdGVkSW5qZWN0YWJsZURlZi5mYWN0b3J5O1xuICB9IGVsc2Uge1xuICAgIHJldHVybiAoKSA9PiBuZXcgKHRva2VuIGFzIFR5cGU8YW55PikoKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBwcm92aWRlclRvUmVjb3JkKFxuICAgIHByb3ZpZGVyOiBTaW5nbGVQcm92aWRlciwgbmdNb2R1bGVUeXBlOiBJbmplY3RvclR5cGU8YW55PiwgcHJvdmlkZXJzOiBhbnlbXSk6IFJlY29yZDxhbnk+IHtcbiAgbGV0IGZhY3Rvcnk6ICgoKSA9PiBhbnkpfHVuZGVmaW5lZCA9IHByb3ZpZGVyVG9GYWN0b3J5KHByb3ZpZGVyLCBuZ01vZHVsZVR5cGUsIHByb3ZpZGVycyk7XG4gIGlmIChpc1ZhbHVlUHJvdmlkZXIocHJvdmlkZXIpKSB7XG4gICAgcmV0dXJuIG1ha2VSZWNvcmQodW5kZWZpbmVkLCBwcm92aWRlci51c2VWYWx1ZSk7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIG1ha2VSZWNvcmQoZmFjdG9yeSwgTk9UX1lFVCk7XG4gIH1cbn1cblxuLyoqXG4gKiBDb252ZXJ0cyBhIGBTaW5nbGVQcm92aWRlcmAgaW50byBhIGZhY3RvcnkgZnVuY3Rpb24uXG4gKlxuICogQHBhcmFtIHByb3ZpZGVyIHByb3ZpZGVyIHRvIGNvbnZlcnQgdG8gZmFjdG9yeVxuICovXG5leHBvcnQgZnVuY3Rpb24gcHJvdmlkZXJUb0ZhY3RvcnkoXG4gICAgcHJvdmlkZXI6IFNpbmdsZVByb3ZpZGVyLCBuZ01vZHVsZVR5cGU/OiBJbmplY3RvclR5cGU8YW55PiwgcHJvdmlkZXJzPzogYW55W10pOiAoKSA9PiBhbnkge1xuICBsZXQgZmFjdG9yeTogKCgpID0+IGFueSl8dW5kZWZpbmVkID0gdW5kZWZpbmVkO1xuICBpZiAoaXNUeXBlUHJvdmlkZXIocHJvdmlkZXIpKSB7XG4gICAgcmV0dXJuIGluamVjdGFibGVEZWZPckluamVjdG9yRGVmRmFjdG9yeShyZXNvbHZlRm9yd2FyZFJlZihwcm92aWRlcikpO1xuICB9IGVsc2Uge1xuICAgIGlmIChpc1ZhbHVlUHJvdmlkZXIocHJvdmlkZXIpKSB7XG4gICAgICBmYWN0b3J5ID0gKCkgPT4gcmVzb2x2ZUZvcndhcmRSZWYocHJvdmlkZXIudXNlVmFsdWUpO1xuICAgIH0gZWxzZSBpZiAoaXNFeGlzdGluZ1Byb3ZpZGVyKHByb3ZpZGVyKSkge1xuICAgICAgZmFjdG9yeSA9ICgpID0+IMm1ybVpbmplY3QocmVzb2x2ZUZvcndhcmRSZWYocHJvdmlkZXIudXNlRXhpc3RpbmcpKTtcbiAgICB9IGVsc2UgaWYgKGlzRmFjdG9yeVByb3ZpZGVyKHByb3ZpZGVyKSkge1xuICAgICAgZmFjdG9yeSA9ICgpID0+IHByb3ZpZGVyLnVzZUZhY3RvcnkoLi4uaW5qZWN0QXJncyhwcm92aWRlci5kZXBzIHx8IFtdKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IGNsYXNzUmVmID0gcmVzb2x2ZUZvcndhcmRSZWYoXG4gICAgICAgICAgcHJvdmlkZXIgJiZcbiAgICAgICAgICAoKHByb3ZpZGVyIGFzIFN0YXRpY0NsYXNzUHJvdmlkZXIgfCBDbGFzc1Byb3ZpZGVyKS51c2VDbGFzcyB8fCBwcm92aWRlci5wcm92aWRlKSk7XG4gICAgICBpZiAoIWNsYXNzUmVmKSB7XG4gICAgICAgIHRocm93SW52YWxpZFByb3ZpZGVyRXJyb3IobmdNb2R1bGVUeXBlLCBwcm92aWRlcnMsIHByb3ZpZGVyKTtcbiAgICAgIH1cbiAgICAgIGlmIChoYXNEZXBzKHByb3ZpZGVyKSkge1xuICAgICAgICBmYWN0b3J5ID0gKCkgPT4gbmV3IChjbGFzc1JlZikoLi4uaW5qZWN0QXJncyhwcm92aWRlci5kZXBzKSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gaW5qZWN0YWJsZURlZk9ySW5qZWN0b3JEZWZGYWN0b3J5KGNsYXNzUmVmKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIGZhY3Rvcnk7XG59XG5cbmZ1bmN0aW9uIG1ha2VSZWNvcmQ8VD4oXG4gICAgZmFjdG9yeTogKCgpID0+IFQpIHwgdW5kZWZpbmVkLCB2YWx1ZTogVCB8IHt9LCBtdWx0aTogYm9vbGVhbiA9IGZhbHNlKTogUmVjb3JkPFQ+IHtcbiAgcmV0dXJuIHtcbiAgICBmYWN0b3J5OiBmYWN0b3J5LFxuICAgIHZhbHVlOiB2YWx1ZSxcbiAgICBtdWx0aTogbXVsdGkgPyBbXSA6IHVuZGVmaW5lZCxcbiAgfTtcbn1cblxuZnVuY3Rpb24gZGVlcEZvckVhY2g8VD4oaW5wdXQ6IChUIHwgYW55W10pW10sIGZuOiAodmFsdWU6IFQpID0+IHZvaWQpOiB2b2lkIHtcbiAgaW5wdXQuZm9yRWFjaCh2YWx1ZSA9PiBBcnJheS5pc0FycmF5KHZhbHVlKSA/IGRlZXBGb3JFYWNoKHZhbHVlLCBmbikgOiBmbih2YWx1ZSkpO1xufVxuXG5mdW5jdGlvbiBpc1ZhbHVlUHJvdmlkZXIodmFsdWU6IFNpbmdsZVByb3ZpZGVyKTogdmFsdWUgaXMgVmFsdWVQcm92aWRlciB7XG4gIHJldHVybiB2YWx1ZSAhPT0gbnVsbCAmJiB0eXBlb2YgdmFsdWUgPT0gJ29iamVjdCcgJiYgVVNFX1ZBTFVFIGluIHZhbHVlO1xufVxuXG5mdW5jdGlvbiBpc0V4aXN0aW5nUHJvdmlkZXIodmFsdWU6IFNpbmdsZVByb3ZpZGVyKTogdmFsdWUgaXMgRXhpc3RpbmdQcm92aWRlciB7XG4gIHJldHVybiAhISh2YWx1ZSAmJiAodmFsdWUgYXMgRXhpc3RpbmdQcm92aWRlcikudXNlRXhpc3RpbmcpO1xufVxuXG5mdW5jdGlvbiBpc0ZhY3RvcnlQcm92aWRlcih2YWx1ZTogU2luZ2xlUHJvdmlkZXIpOiB2YWx1ZSBpcyBGYWN0b3J5UHJvdmlkZXIge1xuICByZXR1cm4gISEodmFsdWUgJiYgKHZhbHVlIGFzIEZhY3RvcnlQcm92aWRlcikudXNlRmFjdG9yeSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc1R5cGVQcm92aWRlcih2YWx1ZTogU2luZ2xlUHJvdmlkZXIpOiB2YWx1ZSBpcyBUeXBlUHJvdmlkZXIge1xuICByZXR1cm4gdHlwZW9mIHZhbHVlID09PSAnZnVuY3Rpb24nO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNDbGFzc1Byb3ZpZGVyKHZhbHVlOiBTaW5nbGVQcm92aWRlcik6IHZhbHVlIGlzIENsYXNzUHJvdmlkZXIge1xuICByZXR1cm4gISEodmFsdWUgYXMgU3RhdGljQ2xhc3NQcm92aWRlciB8IENsYXNzUHJvdmlkZXIpLnVzZUNsYXNzO1xufVxuXG5mdW5jdGlvbiBoYXNEZXBzKHZhbHVlOiBDbGFzc1Byb3ZpZGVyIHwgQ29uc3RydWN0b3JQcm92aWRlciB8IFN0YXRpY0NsYXNzUHJvdmlkZXIpOlxuICAgIHZhbHVlIGlzIENsYXNzUHJvdmlkZXIme2RlcHM6IGFueVtdfSB7XG4gIHJldHVybiAhISh2YWx1ZSBhcyBhbnkpLmRlcHM7XG59XG5cbmZ1bmN0aW9uIGhhc09uRGVzdHJveSh2YWx1ZTogYW55KTogdmFsdWUgaXMgT25EZXN0cm95IHtcbiAgcmV0dXJuIHZhbHVlICE9PSBudWxsICYmIHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcgJiZcbiAgICAgIHR5cGVvZih2YWx1ZSBhcyBPbkRlc3Ryb3kpLm5nT25EZXN0cm95ID09PSAnZnVuY3Rpb24nO1xufVxuXG5mdW5jdGlvbiBjb3VsZEJlSW5qZWN0YWJsZVR5cGUodmFsdWU6IGFueSk6IHZhbHVlIGlzIFR5cGU8YW55PnxJbmplY3Rpb25Ub2tlbjxhbnk+IHtcbiAgcmV0dXJuICh0eXBlb2YgdmFsdWUgPT09ICdmdW5jdGlvbicpIHx8XG4gICAgICAodHlwZW9mIHZhbHVlID09PSAnb2JqZWN0JyAmJiB2YWx1ZSBpbnN0YW5jZW9mIEluamVjdGlvblRva2VuKTtcbn1cbiJdfQ==