/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { stringify } from '../util';
import { getInjectableDef, getInjectorDef } from './defs';
import { resolveForwardRef } from './forward_ref';
import { InjectionToken } from './injection_token';
import { INJECTOR, NullInjector, THROW_IF_NOT_FOUND, USE_VALUE } from './injector';
import { InjectFlags, inject, injectArgs, setCurrentInjector } from './injector_compatibility';
import { APP_ROOT } from './scope';
/** @typedef {?} */
var SingleProvider;
/** *
 * Marker which indicates that a value has not yet been created from the factory function.
  @type {?} */
const NOT_YET = {};
/** *
 * Marker which indicates that the factory function for a token is in the process of being called.
 *
 * If the injector is asked to inject a token with its value set to CIRCULAR, that indicates
 * injection of a dependency has recursively attempted to inject the original token, and there is
 * a circular dependency among the providers.
  @type {?} */
const CIRCULAR = {};
/** @type {?} */
const EMPTY_ARRAY = /** @type {?} */ ([]);
/** *
 * A lazily initialized NullInjector.
  @type {?} */
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
/** @type {?} */
Record.prototype.factory;
/** @type {?} */
Record.prototype.value;
/** @type {?} */
Record.prototype.multi;
/**
 * Create a new `Injector` which is configured using a `defType` of `InjectorType<any>`s.
 *
 * \@publicApi
 * @param {?} defType
 * @param {?=} parent
 * @param {?=} additionalProviders
 * @return {?}
 */
export function createInjector(defType, parent = null, additionalProviders = null) {
    parent = parent || getNullInjector();
    return new R3Injector(defType, additionalProviders, parent);
}
export class R3Injector {
    /**
     * @param {?} def
     * @param {?} additionalProviders
     * @param {?} parent
     */
    constructor(def, additionalProviders, parent) {
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
        /** @type {?} */
        const dedupStack = [];
        deepForEach([def], injectorDef => this.processInjectorType(injectorDef, [], dedupStack));
        additionalProviders &&
            deepForEach(additionalProviders, provider => this.processProvider(provider));
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
    get(token, notFoundValue = THROW_IF_NOT_FOUND, flags = InjectFlags.Default) {
        this.assertNotDestroyed();
        /** @type {?} */
        const previousInjector = setCurrentInjector(this);
        try {
            // Check for the SkipSelf flag.
            if (!(flags & InjectFlags.SkipSelf)) {
                /** @type {?} */
                let record = this.records.get(token);
                if (record === undefined) {
                    /** @type {?} */
                    const def = couldBeInjectableType(token) && getInjectableDef(token);
                    if (def && this.injectableDefInScope(def)) {
                        // Found an ngInjectableDef and it's scoped to this injector. Pretend as if it was here
                        // all along.
                        record = makeRecord(injectableDefFactory(token), NOT_YET);
                        this.records.set(token, record);
                    }
                }
                // If a record was found, get the instance for it and return it.
                if (record !== undefined) {
                    return this.hydrate(token, record);
                }
            }
            /** @type {?} */
            const nextInjector = !(flags & InjectFlags.Self) ? this.parent : getNullInjector();
            return nextInjector.get(token, notFoundValue);
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
     * @param {?} dedupStack
     * @return {?}
     */
    processInjectorType(defOrWrappedDef, parents, dedupStack) {
        defOrWrappedDef = resolveForwardRef(defOrWrappedDef);
        if (!defOrWrappedDef)
            return;
        /** @type {?} */
        let def = getInjectorDef(defOrWrappedDef);
        /** @type {?} */
        const ngModule = (def == null) && (/** @type {?} */ (defOrWrappedDef)).ngModule || undefined;
        /** @type {?} */
        const defType = (ngModule === undefined) ? (/** @type {?} */ (defOrWrappedDef)) : ngModule;
        // Check for circular dependencies.
        if (ngDevMode && parents.indexOf(defType) !== -1) {
            /** @type {?} */
            const defName = stringify(defType);
            throw new Error(`Circular dependency in DI detected for type ${defName}. Dependency path: ${parents.map(defType => stringify(defType)).join(' > ')} > ${defName}.`);
        }
        // Check for multiple imports of the same module
        if (dedupStack.indexOf(defType) !== -1) {
            return;
        }
        /** @type {?} */
        const providers = (ngModule !== undefined) && (/** @type {?} */ (defOrWrappedDef)).providers ||
            EMPTY_ARRAY;
        // Finally, if defOrWrappedType was an `InjectorDefTypeWithProviders`, then the actual
        // `InjectorDef` is on its `ngModule`.
        if (ngModule !== undefined) {
            def = getInjectorDef(ngModule);
        }
        // If no definition was found, it might be from exports. Remove it.
        if (def == null) {
            return;
        }
        // Track the InjectorType and add a provider for it.
        this.injectorDefTypes.add(defType);
        this.records.set(defType, makeRecord(def.factory));
        // Add providers in the same way that @NgModule resolution did:
        // First, include providers from any imports.
        if (def.imports != null) {
            // Before processing defType's imports, add it to the set of parents. This way, if it ends
            // up deeply importing itself, this can be detected.
            ngDevMode && parents.push(defType);
            // Add it to the set of dedups. This way we can detect multiple imports of the same module
            dedupStack.push(defType);
            try {
                deepForEach(def.imports, imported => this.processInjectorType(imported, parents, dedupStack));
            }
            finally {
                // Remove it from the parents set when finished.
                ngDevMode && parents.pop();
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
        /** @type {?} */
        let token = isTypeProvider(provider) ? provider : resolveForwardRef(provider.provide);
        /** @type {?} */
        const record = providerToRecord(provider);
        if (!isTypeProvider(provider) && provider.multi === true) {
            /** @type {?} */
            let multiRecord = this.records.get(token);
            if (multiRecord) {
                // It has. Throw a nice error if
                if (multiRecord.multi === undefined) {
                    throw new Error(`Mixed multi-provider for ${token}.`);
                }
            }
            else {
                multiRecord = makeRecord(undefined, NOT_YET, true);
                multiRecord.factory = () => injectArgs(/** @type {?} */ ((/** @type {?} */ ((multiRecord)).multi)));
                this.records.set(token, multiRecord);
            }
            token = provider; /** @type {?} */
            ((multiRecord.multi)).push(provider);
        }
        else {
            /** @type {?} */
            const existing = this.records.get(token);
            if (existing && existing.multi !== undefined) {
                throw new Error(`Mixed multi-provider for ${stringify(token)}`);
            }
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
if (false) {
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
function injectableDefFactory(token) {
    /** @type {?} */
    const injectableDef = getInjectableDef(/** @type {?} */ (token));
    if (injectableDef === null) {
        if (token instanceof InjectionToken) {
            throw new Error(`Token ${stringify(token)} is missing an ngInjectableDef definition.`);
        }
        // TODO(alxhub): there should probably be a strict mode which throws here instead of assuming a
        // no-args constructor.
        return () => new (/** @type {?} */ (token))();
    }
    return injectableDef.factory;
}
/**
 * @param {?} provider
 * @return {?}
 */
function providerToRecord(provider) {
    /** @type {?} */
    let factory = providerToFactory(provider);
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
 * @return {?}
 */
export function providerToFactory(provider) {
    /** @type {?} */
    let factory = undefined;
    if (isTypeProvider(provider)) {
        return injectableDefFactory(resolveForwardRef(provider));
    }
    else {
        if (isValueProvider(provider)) {
            factory = () => resolveForwardRef(provider.useValue);
        }
        else if (isExistingProvider(provider)) {
            factory = () => inject(resolveForwardRef(provider.useExisting));
        }
        else if (isFactoryProvider(provider)) {
            factory = () => provider.useFactory(...injectArgs(provider.deps || []));
        }
        else {
            /** @type {?} */
            const classRef = resolveForwardRef((/** @type {?} */ (provider)).useClass || provider.provide);
            if (hasDeps(provider)) {
                factory = () => new (classRef)(...injectArgs(provider.deps));
            }
            else {
                return injectableDefFactory(classRef);
            }
        }
    }
    return factory;
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
export function isTypeProvider(value) {
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicjNfaW5qZWN0b3IuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9kaS9yM19pbmplY3Rvci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQVVBLE9BQU8sRUFBQyxTQUFTLEVBQUMsTUFBTSxTQUFTLENBQUM7QUFFbEMsT0FBTyxFQUF5RSxnQkFBZ0IsRUFBRSxjQUFjLEVBQUMsTUFBTSxRQUFRLENBQUM7QUFDaEksT0FBTyxFQUFDLGlCQUFpQixFQUFDLE1BQU0sZUFBZSxDQUFDO0FBQ2hELE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUNqRCxPQUFPLEVBQUMsUUFBUSxFQUFZLFlBQVksRUFBRSxrQkFBa0IsRUFBRSxTQUFTLEVBQUMsTUFBTSxZQUFZLENBQUM7QUFDM0YsT0FBTyxFQUFDLFdBQVcsRUFBRSxNQUFNLEVBQUUsVUFBVSxFQUFFLGtCQUFrQixFQUFDLE1BQU0sMEJBQTBCLENBQUM7QUFFN0YsT0FBTyxFQUFDLFFBQVEsRUFBQyxNQUFNLFNBQVMsQ0FBQzs7Ozs7O0FBYWpDLE1BQU0sT0FBTyxHQUFHLEVBQUUsQ0FBQzs7Ozs7Ozs7QUFTbkIsTUFBTSxRQUFRLEdBQUcsRUFBRSxDQUFDOztBQUVwQixNQUFNLFdBQVcscUJBQUcsRUFBVyxFQUFDOzs7O0FBS2hDLElBQUksYUFBYSxHQUF1QixTQUFTLENBQUM7Ozs7QUFFbEQsU0FBUyxlQUFlO0lBQ3RCLElBQUksYUFBYSxLQUFLLFNBQVMsRUFBRTtRQUMvQixhQUFhLEdBQUcsSUFBSSxZQUFZLEVBQUUsQ0FBQztLQUNwQztJQUNELE9BQU8sYUFBYSxDQUFDO0NBQ3RCOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQWlCRCxNQUFNLFVBQVUsY0FBYyxDQUMxQixPQUFvQyxFQUFFLFNBQTBCLElBQUksRUFDcEUsc0JBQStDLElBQUk7SUFDckQsTUFBTSxHQUFHLE1BQU0sSUFB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TSxtQkFBQyxLQUFrQixFQUFDLENBQUMsV0FBVyxLQUFLLFVBQVUsQ0FBQztDQUMzRDs7Ozs7QUFFRCxTQUFTLHFCQUFxQixDQUFDLEtBQVU7SUFDdkMsT0FBTyxDQUFDLE9BQU8sS0FBSyxLQUFLLFVBQVUsQ0FBQztRQUNoQyxDQUFDLE9BQU8sS0FBSyxLQUFLLFFBQVEsSUFBSSxLQUFLLFlBQVksY0FBYyxDQUFDLENBQUM7Q0FDcEUiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7T25EZXN0cm95fSBmcm9tICcuLi9tZXRhZGF0YS9saWZlY3ljbGVfaG9va3MnO1xuaW1wb3J0IHtUeXBlfSBmcm9tICcuLi90eXBlJztcbmltcG9ydCB7c3RyaW5naWZ5fSBmcm9tICcuLi91dGlsJztcblxuaW1wb3J0IHtJbmplY3RhYmxlRGVmLCBJbmplY3RhYmxlVHlwZSwgSW5qZWN0b3JUeXBlLCBJbmplY3RvclR5cGVXaXRoUHJvdmlkZXJzLCBnZXRJbmplY3RhYmxlRGVmLCBnZXRJbmplY3RvckRlZn0gZnJvbSAnLi9kZWZzJztcbmltcG9ydCB7cmVzb2x2ZUZvcndhcmRSZWZ9IGZyb20gJy4vZm9yd2FyZF9yZWYnO1xuaW1wb3J0IHtJbmplY3Rpb25Ub2tlbn0gZnJvbSAnLi9pbmplY3Rpb25fdG9rZW4nO1xuaW1wb3J0IHtJTkpFQ1RPUiwgSW5qZWN0b3IsIE51bGxJbmplY3RvciwgVEhST1dfSUZfTk9UX0ZPVU5ELCBVU0VfVkFMVUV9IGZyb20gJy4vaW5qZWN0b3InO1xuaW1wb3J0IHtJbmplY3RGbGFncywgaW5qZWN0LCBpbmplY3RBcmdzLCBzZXRDdXJyZW50SW5qZWN0b3J9IGZyb20gJy4vaW5qZWN0b3JfY29tcGF0aWJpbGl0eSc7XG5pbXBvcnQge0NsYXNzUHJvdmlkZXIsIENvbnN0cnVjdG9yUHJvdmlkZXIsIEV4aXN0aW5nUHJvdmlkZXIsIEZhY3RvcnlQcm92aWRlciwgUHJvdmlkZXIsIFN0YXRpY0NsYXNzUHJvdmlkZXIsIFN0YXRpY1Byb3ZpZGVyLCBUeXBlUHJvdmlkZXIsIFZhbHVlUHJvdmlkZXJ9IGZyb20gJy4vcHJvdmlkZXInO1xuaW1wb3J0IHtBUFBfUk9PVH0gZnJvbSAnLi9zY29wZSc7XG5cblxuXG4vKipcbiAqIEludGVybmFsIHR5cGUgZm9yIGEgc2luZ2xlIHByb3ZpZGVyIGluIGEgZGVlcCBwcm92aWRlciBhcnJheS5cbiAqL1xudHlwZSBTaW5nbGVQcm92aWRlciA9IFR5cGVQcm92aWRlciB8IFZhbHVlUHJvdmlkZXIgfCBDbGFzc1Byb3ZpZGVyIHwgQ29uc3RydWN0b3JQcm92aWRlciB8XG4gICAgRXhpc3RpbmdQcm92aWRlciB8IEZhY3RvcnlQcm92aWRlciB8IFN0YXRpY0NsYXNzUHJvdmlkZXI7XG5cbi8qKlxuICogTWFya2VyIHdoaWNoIGluZGljYXRlcyB0aGF0IGEgdmFsdWUgaGFzIG5vdCB5ZXQgYmVlbiBjcmVhdGVkIGZyb20gdGhlIGZhY3RvcnkgZnVuY3Rpb24uXG4gKi9cbmNvbnN0IE5PVF9ZRVQgPSB7fTtcblxuLyoqXG4gKiBNYXJrZXIgd2hpY2ggaW5kaWNhdGVzIHRoYXQgdGhlIGZhY3RvcnkgZnVuY3Rpb24gZm9yIGEgdG9rZW4gaXMgaW4gdGhlIHByb2Nlc3Mgb2YgYmVpbmcgY2FsbGVkLlxuICpcbiAqIElmIHRoZSBpbmplY3RvciBpcyBhc2tlZCB0byBpbmplY3QgYSB0b2tlbiB3aXRoIGl0cyB2YWx1ZSBzZXQgdG8gQ0lSQ1VMQVIsIHRoYXQgaW5kaWNhdGVzXG4gKiBpbmplY3Rpb24gb2YgYSBkZXBlbmRlbmN5IGhhcyByZWN1cnNpdmVseSBhdHRlbXB0ZWQgdG8gaW5qZWN0IHRoZSBvcmlnaW5hbCB0b2tlbiwgYW5kIHRoZXJlIGlzXG4gKiBhIGNpcmN1bGFyIGRlcGVuZGVuY3kgYW1vbmcgdGhlIHByb3ZpZGVycy5cbiAqL1xuY29uc3QgQ0lSQ1VMQVIgPSB7fTtcblxuY29uc3QgRU1QVFlfQVJSQVkgPSBbXSBhcyBhbnlbXTtcblxuLyoqXG4gKiBBIGxhemlseSBpbml0aWFsaXplZCBOdWxsSW5qZWN0b3IuXG4gKi9cbmxldCBOVUxMX0lOSkVDVE9SOiBJbmplY3Rvcnx1bmRlZmluZWQgPSB1bmRlZmluZWQ7XG5cbmZ1bmN0aW9uIGdldE51bGxJbmplY3RvcigpOiBJbmplY3RvciB7XG4gIGlmIChOVUxMX0lOSkVDVE9SID09PSB1bmRlZmluZWQpIHtcbiAgICBOVUxMX0lOSkVDVE9SID0gbmV3IE51bGxJbmplY3RvcigpO1xuICB9XG4gIHJldHVybiBOVUxMX0lOSkVDVE9SO1xufVxuXG4vKipcbiAqIEFuIGVudHJ5IGluIHRoZSBpbmplY3RvciB3aGljaCB0cmFja3MgaW5mb3JtYXRpb24gYWJvdXQgdGhlIGdpdmVuIHRva2VuLCBpbmNsdWRpbmcgYSBwb3NzaWJsZVxuICogY3VycmVudCB2YWx1ZS5cbiAqL1xuaW50ZXJmYWNlIFJlY29yZDxUPiB7XG4gIGZhY3Rvcnk6ICgoKSA9PiBUKXx1bmRlZmluZWQ7XG4gIHZhbHVlOiBUfHt9O1xuICBtdWx0aTogYW55W118dW5kZWZpbmVkO1xufVxuXG4vKipcbiAqIENyZWF0ZSBhIG5ldyBgSW5qZWN0b3JgIHdoaWNoIGlzIGNvbmZpZ3VyZWQgdXNpbmcgYSBgZGVmVHlwZWAgb2YgYEluamVjdG9yVHlwZTxhbnk+YHMuXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlSW5qZWN0b3IoXG4gICAgZGVmVHlwZTogLyogSW5qZWN0b3JUeXBlPGFueT4gKi8gYW55LCBwYXJlbnQ6IEluamVjdG9yIHwgbnVsbCA9IG51bGwsXG4gICAgYWRkaXRpb25hbFByb3ZpZGVyczogU3RhdGljUHJvdmlkZXJbXSB8IG51bGwgPSBudWxsKTogSW5qZWN0b3Ige1xuICBwYXJlbnQgPSBwYXJlbnQgfHwgZ2V0TnVsbEluamVjdG9yKCk7XG4gIHJldHVybiBuZXcgUjNJbmplY3RvcihkZWZUeXBlLCBhZGRpdGlvbmFsUHJvdmlkZXJzLCBwYXJlbnQpO1xufVxuXG5leHBvcnQgY2xhc3MgUjNJbmplY3RvciB7XG4gIC8qKlxuICAgKiBNYXAgb2YgdG9rZW5zIHRvIHJlY29yZHMgd2hpY2ggY29udGFpbiB0aGUgaW5zdGFuY2VzIG9mIHRob3NlIHRva2Vucy5cbiAgICovXG4gIHByaXZhdGUgcmVjb3JkcyA9IG5ldyBNYXA8VHlwZTxhbnk+fEluamVjdGlvblRva2VuPGFueT4sIFJlY29yZDxhbnk+PigpO1xuXG4gIC8qKlxuICAgKiBUaGUgdHJhbnNpdGl2ZSBzZXQgb2YgYEluamVjdG9yVHlwZWBzIHdoaWNoIGRlZmluZSB0aGlzIGluamVjdG9yLlxuICAgKi9cbiAgcHJpdmF0ZSBpbmplY3RvckRlZlR5cGVzID0gbmV3IFNldDxJbmplY3RvclR5cGU8YW55Pj4oKTtcblxuICAvKipcbiAgICogU2V0IG9mIHZhbHVlcyBpbnN0YW50aWF0ZWQgYnkgdGhpcyBpbmplY3RvciB3aGljaCBjb250YWluIGBuZ09uRGVzdHJveWAgbGlmZWN5Y2xlIGhvb2tzLlxuICAgKi9cbiAgcHJpdmF0ZSBvbkRlc3Ryb3kgPSBuZXcgU2V0PE9uRGVzdHJveT4oKTtcblxuICAvKipcbiAgICogRmxhZyBpbmRpY2F0aW5nIHRoaXMgaW5qZWN0b3IgcHJvdmlkZXMgdGhlIEFQUF9ST09UX1NDT1BFIHRva2VuLCBhbmQgdGh1cyBjb3VudHMgYXMgdGhlXG4gICAqIHJvb3Qgc2NvcGUuXG4gICAqL1xuICBwcml2YXRlIHJlYWRvbmx5IGlzUm9vdEluamVjdG9yOiBib29sZWFuO1xuXG4gIC8qKlxuICAgKiBGbGFnIGluZGljYXRpbmcgdGhhdCB0aGlzIGluamVjdG9yIHdhcyBwcmV2aW91c2x5IGRlc3Ryb3llZC5cbiAgICovXG4gIHByaXZhdGUgZGVzdHJveWVkID0gZmFsc2U7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgICBkZWY6IEluamVjdG9yVHlwZTxhbnk+LCBhZGRpdGlvbmFsUHJvdmlkZXJzOiBTdGF0aWNQcm92aWRlcltdfG51bGwsXG4gICAgICByZWFkb25seSBwYXJlbnQ6IEluamVjdG9yKSB7XG4gICAgLy8gU3RhcnQgb2ZmIGJ5IGNyZWF0aW5nIFJlY29yZHMgZm9yIGV2ZXJ5IHByb3ZpZGVyIGRlY2xhcmVkIGluIGV2ZXJ5IEluamVjdG9yVHlwZVxuICAgIC8vIGluY2x1ZGVkIHRyYW5zaXRpdmVseSBpbiBgZGVmYC5cbiAgICBjb25zdCBkZWR1cFN0YWNrOiBJbmplY3RvclR5cGU8YW55PltdID0gW107XG4gICAgZGVlcEZvckVhY2goW2RlZl0sIGluamVjdG9yRGVmID0+IHRoaXMucHJvY2Vzc0luamVjdG9yVHlwZShpbmplY3RvckRlZiwgW10sIGRlZHVwU3RhY2spKTtcblxuICAgIGFkZGl0aW9uYWxQcm92aWRlcnMgJiZcbiAgICAgICAgZGVlcEZvckVhY2goYWRkaXRpb25hbFByb3ZpZGVycywgcHJvdmlkZXIgPT4gdGhpcy5wcm9jZXNzUHJvdmlkZXIocHJvdmlkZXIpKTtcblxuXG4gICAgLy8gTWFrZSBzdXJlIHRoZSBJTkpFQ1RPUiB0b2tlbiBwcm92aWRlcyB0aGlzIGluamVjdG9yLlxuICAgIHRoaXMucmVjb3Jkcy5zZXQoSU5KRUNUT1IsIG1ha2VSZWNvcmQodW5kZWZpbmVkLCB0aGlzKSk7XG5cbiAgICAvLyBEZXRlY3Qgd2hldGhlciB0aGlzIGluamVjdG9yIGhhcyB0aGUgQVBQX1JPT1RfU0NPUEUgdG9rZW4gYW5kIHRodXMgc2hvdWxkIHByb3ZpZGVcbiAgICAvLyBhbnkgaW5qZWN0YWJsZSBzY29wZWQgdG8gQVBQX1JPT1RfU0NPUEUuXG4gICAgdGhpcy5pc1Jvb3RJbmplY3RvciA9IHRoaXMucmVjb3Jkcy5oYXMoQVBQX1JPT1QpO1xuXG4gICAgLy8gRWFnZXJseSBpbnN0YW50aWF0ZSB0aGUgSW5qZWN0b3JUeXBlIGNsYXNzZXMgdGhlbXNlbHZlcy5cbiAgICB0aGlzLmluamVjdG9yRGVmVHlwZXMuZm9yRWFjaChkZWZUeXBlID0+IHRoaXMuZ2V0KGRlZlR5cGUpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZXN0cm95IHRoZSBpbmplY3RvciBhbmQgcmVsZWFzZSByZWZlcmVuY2VzIHRvIGV2ZXJ5IGluc3RhbmNlIG9yIHByb3ZpZGVyIGFzc29jaWF0ZWQgd2l0aCBpdC5cbiAgICpcbiAgICogQWxzbyBjYWxscyB0aGUgYE9uRGVzdHJveWAgbGlmZWN5Y2xlIGhvb2tzIG9mIGV2ZXJ5IGluc3RhbmNlIHRoYXQgd2FzIGNyZWF0ZWQgZm9yIHdoaWNoIGFcbiAgICogaG9vayB3YXMgZm91bmQuXG4gICAqL1xuICBkZXN0cm95KCk6IHZvaWQge1xuICAgIHRoaXMuYXNzZXJ0Tm90RGVzdHJveWVkKCk7XG5cbiAgICAvLyBTZXQgZGVzdHJveWVkID0gdHJ1ZSBmaXJzdCwgaW4gY2FzZSBsaWZlY3ljbGUgaG9va3MgcmUtZW50ZXIgZGVzdHJveSgpLlxuICAgIHRoaXMuZGVzdHJveWVkID0gdHJ1ZTtcbiAgICB0cnkge1xuICAgICAgLy8gQ2FsbCBhbGwgdGhlIGxpZmVjeWNsZSBob29rcy5cbiAgICAgIHRoaXMub25EZXN0cm95LmZvckVhY2goc2VydmljZSA9PiBzZXJ2aWNlLm5nT25EZXN0cm95KCkpO1xuICAgIH0gZmluYWxseSB7XG4gICAgICAvLyBSZWxlYXNlIGFsbCByZWZlcmVuY2VzLlxuICAgICAgdGhpcy5yZWNvcmRzLmNsZWFyKCk7XG4gICAgICB0aGlzLm9uRGVzdHJveS5jbGVhcigpO1xuICAgICAgdGhpcy5pbmplY3RvckRlZlR5cGVzLmNsZWFyKCk7XG4gICAgfVxuICB9XG5cbiAgZ2V0PFQ+KFxuICAgICAgdG9rZW46IFR5cGU8VD58SW5qZWN0aW9uVG9rZW48VD4sIG5vdEZvdW5kVmFsdWU6IGFueSA9IFRIUk9XX0lGX05PVF9GT1VORCxcbiAgICAgIGZsYWdzID0gSW5qZWN0RmxhZ3MuRGVmYXVsdCk6IFQge1xuICAgIHRoaXMuYXNzZXJ0Tm90RGVzdHJveWVkKCk7XG4gICAgLy8gU2V0IHRoZSBpbmplY3Rpb24gY29udGV4dC5cbiAgICBjb25zdCBwcmV2aW91c0luamVjdG9yID0gc2V0Q3VycmVudEluamVjdG9yKHRoaXMpO1xuICAgIHRyeSB7XG4gICAgICAvLyBDaGVjayBmb3IgdGhlIFNraXBTZWxmIGZsYWcuXG4gICAgICBpZiAoIShmbGFncyAmIEluamVjdEZsYWdzLlNraXBTZWxmKSkge1xuICAgICAgICAvLyBTa2lwU2VsZiBpc24ndCBzZXQsIGNoZWNrIGlmIHRoZSByZWNvcmQgYmVsb25ncyB0byB0aGlzIGluamVjdG9yLlxuICAgICAgICBsZXQgcmVjb3JkOiBSZWNvcmQ8VD58dW5kZWZpbmVkID0gdGhpcy5yZWNvcmRzLmdldCh0b2tlbik7XG4gICAgICAgIGlmIChyZWNvcmQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIC8vIE5vIHJlY29yZCwgYnV0IG1heWJlIHRoZSB0b2tlbiBpcyBzY29wZWQgdG8gdGhpcyBpbmplY3Rvci4gTG9vayBmb3IgYW4gbmdJbmplY3RhYmxlRGVmXG4gICAgICAgICAgLy8gd2l0aCBhIHNjb3BlIG1hdGNoaW5nIHRoaXMgaW5qZWN0b3IuXG4gICAgICAgICAgY29uc3QgZGVmID0gY291bGRCZUluamVjdGFibGVUeXBlKHRva2VuKSAmJiBnZXRJbmplY3RhYmxlRGVmKHRva2VuKTtcbiAgICAgICAgICBpZiAoZGVmICYmIHRoaXMuaW5qZWN0YWJsZURlZkluU2NvcGUoZGVmKSkge1xuICAgICAgICAgICAgLy8gRm91bmQgYW4gbmdJbmplY3RhYmxlRGVmIGFuZCBpdCdzIHNjb3BlZCB0byB0aGlzIGluamVjdG9yLiBQcmV0ZW5kIGFzIGlmIGl0IHdhcyBoZXJlXG4gICAgICAgICAgICAvLyBhbGwgYWxvbmcuXG4gICAgICAgICAgICByZWNvcmQgPSBtYWtlUmVjb3JkKGluamVjdGFibGVEZWZGYWN0b3J5KHRva2VuKSwgTk9UX1lFVCk7XG4gICAgICAgICAgICB0aGlzLnJlY29yZHMuc2V0KHRva2VuLCByZWNvcmQpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAvLyBJZiBhIHJlY29yZCB3YXMgZm91bmQsIGdldCB0aGUgaW5zdGFuY2UgZm9yIGl0IGFuZCByZXR1cm4gaXQuXG4gICAgICAgIGlmIChyZWNvcmQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIHJldHVybiB0aGlzLmh5ZHJhdGUodG9rZW4sIHJlY29yZCk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gU2VsZWN0IHRoZSBuZXh0IGluamVjdG9yIGJhc2VkIG9uIHRoZSBTZWxmIGZsYWcgLSBpZiBzZWxmIGlzIHNldCwgdGhlIG5leHQgaW5qZWN0b3IgaXNcbiAgICAgIC8vIHRoZSBOdWxsSW5qZWN0b3IsIG90aGVyd2lzZSBpdCdzIHRoZSBwYXJlbnQuXG4gICAgICBjb25zdCBuZXh0SW5qZWN0b3IgPSAhKGZsYWdzICYgSW5qZWN0RmxhZ3MuU2VsZikgPyB0aGlzLnBhcmVudCA6IGdldE51bGxJbmplY3RvcigpO1xuICAgICAgcmV0dXJuIG5leHRJbmplY3Rvci5nZXQodG9rZW4sIG5vdEZvdW5kVmFsdWUpO1xuICAgIH0gZmluYWxseSB7XG4gICAgICAvLyBMYXN0bHksIGNsZWFuIHVwIHRoZSBzdGF0ZSBieSByZXN0b3JpbmcgdGhlIHByZXZpb3VzIGluamVjdG9yLlxuICAgICAgc2V0Q3VycmVudEluamVjdG9yKHByZXZpb3VzSW5qZWN0b3IpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgYXNzZXJ0Tm90RGVzdHJveWVkKCk6IHZvaWQge1xuICAgIGlmICh0aGlzLmRlc3Ryb3llZCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbmplY3RvciBoYXMgYWxyZWFkeSBiZWVuIGRlc3Ryb3llZC4nKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQWRkIGFuIGBJbmplY3RvclR5cGVgIG9yIGBJbmplY3RvckRlZlR5cGVXaXRoUHJvdmlkZXJzYCBhbmQgYWxsIG9mIGl0cyB0cmFuc2l0aXZlIHByb3ZpZGVyc1xuICAgKiB0byB0aGlzIGluamVjdG9yLlxuICAgKi9cbiAgcHJpdmF0ZSBwcm9jZXNzSW5qZWN0b3JUeXBlKFxuICAgICAgZGVmT3JXcmFwcGVkRGVmOiBJbmplY3RvclR5cGU8YW55PnxJbmplY3RvclR5cGVXaXRoUHJvdmlkZXJzPGFueT4sXG4gICAgICBwYXJlbnRzOiBJbmplY3RvclR5cGU8YW55PltdLCBkZWR1cFN0YWNrOiBJbmplY3RvclR5cGU8YW55PltdKSB7XG4gICAgZGVmT3JXcmFwcGVkRGVmID0gcmVzb2x2ZUZvcndhcmRSZWYoZGVmT3JXcmFwcGVkRGVmKTtcbiAgICBpZiAoIWRlZk9yV3JhcHBlZERlZikgcmV0dXJuO1xuXG4gICAgLy8gRWl0aGVyIHRoZSBkZWZPcldyYXBwZWREZWYgaXMgYW4gSW5qZWN0b3JUeXBlICh3aXRoIG5nSW5qZWN0b3JEZWYpIG9yIGFuXG4gICAgLy8gSW5qZWN0b3JEZWZUeXBlV2l0aFByb3ZpZGVycyAoYWthIE1vZHVsZVdpdGhQcm92aWRlcnMpLiBEZXRlY3RpbmcgZWl0aGVyIGlzIGEgbWVnYW1vcnBoaWNcbiAgICAvLyByZWFkLCBzbyBjYXJlIGlzIHRha2VuIHRvIG9ubHkgZG8gdGhlIHJlYWQgb25jZS5cblxuICAgIC8vIEZpcnN0IGF0dGVtcHQgdG8gcmVhZCB0aGUgbmdJbmplY3RvckRlZi5cbiAgICBsZXQgZGVmID0gZ2V0SW5qZWN0b3JEZWYoZGVmT3JXcmFwcGVkRGVmKTtcblxuICAgIC8vIElmIHRoYXQncyBub3QgcHJlc2VudCwgdGhlbiBhdHRlbXB0IHRvIHJlYWQgbmdNb2R1bGUgZnJvbSB0aGUgSW5qZWN0b3JEZWZUeXBlV2l0aFByb3ZpZGVycy5cbiAgICBjb25zdCBuZ01vZHVsZSA9XG4gICAgICAgIChkZWYgPT0gbnVsbCkgJiYgKGRlZk9yV3JhcHBlZERlZiBhcyBJbmplY3RvclR5cGVXaXRoUHJvdmlkZXJzPGFueT4pLm5nTW9kdWxlIHx8IHVuZGVmaW5lZDtcblxuICAgIC8vIERldGVybWluZSB0aGUgSW5qZWN0b3JUeXBlLiBJbiB0aGUgY2FzZSB3aGVyZSBgZGVmT3JXcmFwcGVkRGVmYCBpcyBhbiBgSW5qZWN0b3JUeXBlYCxcbiAgICAvLyB0aGVuIHRoaXMgaXMgZWFzeS4gSW4gdGhlIGNhc2Ugb2YgYW4gSW5qZWN0b3JEZWZUeXBlV2l0aFByb3ZpZGVycywgdGhlbiB0aGUgZGVmaW5pdGlvbiB0eXBlXG4gICAgLy8gaXMgdGhlIGBuZ01vZHVsZWAuXG4gICAgY29uc3QgZGVmVHlwZTogSW5qZWN0b3JUeXBlPGFueT4gPVxuICAgICAgICAobmdNb2R1bGUgPT09IHVuZGVmaW5lZCkgPyAoZGVmT3JXcmFwcGVkRGVmIGFzIEluamVjdG9yVHlwZTxhbnk+KSA6IG5nTW9kdWxlO1xuXG4gICAgLy8gQ2hlY2sgZm9yIGNpcmN1bGFyIGRlcGVuZGVuY2llcy5cbiAgICBpZiAobmdEZXZNb2RlICYmIHBhcmVudHMuaW5kZXhPZihkZWZUeXBlKSAhPT0gLTEpIHtcbiAgICAgIGNvbnN0IGRlZk5hbWUgPSBzdHJpbmdpZnkoZGVmVHlwZSk7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgYENpcmN1bGFyIGRlcGVuZGVuY3kgaW4gREkgZGV0ZWN0ZWQgZm9yIHR5cGUgJHtkZWZOYW1lfS4gRGVwZW5kZW5jeSBwYXRoOiAke3BhcmVudHMubWFwKGRlZlR5cGUgPT4gc3RyaW5naWZ5KGRlZlR5cGUpKS5qb2luKCcgPiAnKX0gPiAke2RlZk5hbWV9LmApO1xuICAgIH1cblxuICAgIC8vIENoZWNrIGZvciBtdWx0aXBsZSBpbXBvcnRzIG9mIHRoZSBzYW1lIG1vZHVsZVxuICAgIGlmIChkZWR1cFN0YWNrLmluZGV4T2YoZGVmVHlwZSkgIT09IC0xKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gSWYgZGVmT3JXcmFwcGVkVHlwZSB3YXMgYW4gSW5qZWN0b3JEZWZUeXBlV2l0aFByb3ZpZGVycywgdGhlbiAucHJvdmlkZXJzIG1heSBob2xkIHNvbWVcbiAgICAvLyBleHRyYSBwcm92aWRlcnMuXG4gICAgY29uc3QgcHJvdmlkZXJzID1cbiAgICAgICAgKG5nTW9kdWxlICE9PSB1bmRlZmluZWQpICYmIChkZWZPcldyYXBwZWREZWYgYXMgSW5qZWN0b3JUeXBlV2l0aFByb3ZpZGVyczxhbnk+KS5wcm92aWRlcnMgfHxcbiAgICAgICAgRU1QVFlfQVJSQVk7XG5cbiAgICAvLyBGaW5hbGx5LCBpZiBkZWZPcldyYXBwZWRUeXBlIHdhcyBhbiBgSW5qZWN0b3JEZWZUeXBlV2l0aFByb3ZpZGVyc2AsIHRoZW4gdGhlIGFjdHVhbFxuICAgIC8vIGBJbmplY3RvckRlZmAgaXMgb24gaXRzIGBuZ01vZHVsZWAuXG4gICAgaWYgKG5nTW9kdWxlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGRlZiA9IGdldEluamVjdG9yRGVmKG5nTW9kdWxlKTtcbiAgICB9XG5cbiAgICAvLyBJZiBubyBkZWZpbml0aW9uIHdhcyBmb3VuZCwgaXQgbWlnaHQgYmUgZnJvbSBleHBvcnRzLiBSZW1vdmUgaXQuXG4gICAgaWYgKGRlZiA9PSBudWxsKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gVHJhY2sgdGhlIEluamVjdG9yVHlwZSBhbmQgYWRkIGEgcHJvdmlkZXIgZm9yIGl0LlxuICAgIHRoaXMuaW5qZWN0b3JEZWZUeXBlcy5hZGQoZGVmVHlwZSk7XG4gICAgdGhpcy5yZWNvcmRzLnNldChkZWZUeXBlLCBtYWtlUmVjb3JkKGRlZi5mYWN0b3J5KSk7XG5cbiAgICAvLyBBZGQgcHJvdmlkZXJzIGluIHRoZSBzYW1lIHdheSB0aGF0IEBOZ01vZHVsZSByZXNvbHV0aW9uIGRpZDpcblxuICAgIC8vIEZpcnN0LCBpbmNsdWRlIHByb3ZpZGVycyBmcm9tIGFueSBpbXBvcnRzLlxuICAgIGlmIChkZWYuaW1wb3J0cyAhPSBudWxsKSB7XG4gICAgICAvLyBCZWZvcmUgcHJvY2Vzc2luZyBkZWZUeXBlJ3MgaW1wb3J0cywgYWRkIGl0IHRvIHRoZSBzZXQgb2YgcGFyZW50cy4gVGhpcyB3YXksIGlmIGl0IGVuZHNcbiAgICAgIC8vIHVwIGRlZXBseSBpbXBvcnRpbmcgaXRzZWxmLCB0aGlzIGNhbiBiZSBkZXRlY3RlZC5cbiAgICAgIG5nRGV2TW9kZSAmJiBwYXJlbnRzLnB1c2goZGVmVHlwZSk7XG4gICAgICAvLyBBZGQgaXQgdG8gdGhlIHNldCBvZiBkZWR1cHMuIFRoaXMgd2F5IHdlIGNhbiBkZXRlY3QgbXVsdGlwbGUgaW1wb3J0cyBvZiB0aGUgc2FtZSBtb2R1bGVcbiAgICAgIGRlZHVwU3RhY2sucHVzaChkZWZUeXBlKTtcblxuICAgICAgdHJ5IHtcbiAgICAgICAgZGVlcEZvckVhY2goXG4gICAgICAgICAgICBkZWYuaW1wb3J0cywgaW1wb3J0ZWQgPT4gdGhpcy5wcm9jZXNzSW5qZWN0b3JUeXBlKGltcG9ydGVkLCBwYXJlbnRzLCBkZWR1cFN0YWNrKSk7XG4gICAgICB9IGZpbmFsbHkge1xuICAgICAgICAvLyBSZW1vdmUgaXQgZnJvbSB0aGUgcGFyZW50cyBzZXQgd2hlbiBmaW5pc2hlZC5cbiAgICAgICAgbmdEZXZNb2RlICYmIHBhcmVudHMucG9wKCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gTmV4dCwgaW5jbHVkZSBwcm92aWRlcnMgbGlzdGVkIG9uIHRoZSBkZWZpbml0aW9uIGl0c2VsZi5cbiAgICBpZiAoZGVmLnByb3ZpZGVycyAhPSBudWxsKSB7XG4gICAgICBkZWVwRm9yRWFjaChkZWYucHJvdmlkZXJzLCBwcm92aWRlciA9PiB0aGlzLnByb2Nlc3NQcm92aWRlcihwcm92aWRlcikpO1xuICAgIH1cblxuICAgIC8vIEZpbmFsbHksIGluY2x1ZGUgcHJvdmlkZXJzIGZyb20gYW4gSW5qZWN0b3JEZWZUeXBlV2l0aFByb3ZpZGVycyBpZiB0aGVyZSB3YXMgb25lLlxuICAgIGRlZXBGb3JFYWNoKHByb3ZpZGVycywgcHJvdmlkZXIgPT4gdGhpcy5wcm9jZXNzUHJvdmlkZXIocHJvdmlkZXIpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBQcm9jZXNzIGEgYFNpbmdsZVByb3ZpZGVyYCBhbmQgYWRkIGl0LlxuICAgKi9cbiAgcHJpdmF0ZSBwcm9jZXNzUHJvdmlkZXIocHJvdmlkZXI6IFNpbmdsZVByb3ZpZGVyKTogdm9pZCB7XG4gICAgLy8gRGV0ZXJtaW5lIHRoZSB0b2tlbiBmcm9tIHRoZSBwcm92aWRlci4gRWl0aGVyIGl0J3MgaXRzIG93biB0b2tlbiwgb3IgaGFzIGEge3Byb3ZpZGU6IC4uLn1cbiAgICAvLyBwcm9wZXJ0eS5cbiAgICBwcm92aWRlciA9IHJlc29sdmVGb3J3YXJkUmVmKHByb3ZpZGVyKTtcbiAgICBsZXQgdG9rZW46IGFueSA9IGlzVHlwZVByb3ZpZGVyKHByb3ZpZGVyKSA/IHByb3ZpZGVyIDogcmVzb2x2ZUZvcndhcmRSZWYocHJvdmlkZXIucHJvdmlkZSk7XG5cbiAgICAvLyBDb25zdHJ1Y3QgYSBgUmVjb3JkYCBmb3IgdGhlIHByb3ZpZGVyLlxuICAgIGNvbnN0IHJlY29yZCA9IHByb3ZpZGVyVG9SZWNvcmQocHJvdmlkZXIpO1xuXG4gICAgaWYgKCFpc1R5cGVQcm92aWRlcihwcm92aWRlcikgJiYgcHJvdmlkZXIubXVsdGkgPT09IHRydWUpIHtcbiAgICAgIC8vIElmIHRoZSBwcm92aWRlciBpbmRpY2F0ZXMgdGhhdCBpdCdzIGEgbXVsdGktcHJvdmlkZXIsIHByb2Nlc3MgaXQgc3BlY2lhbGx5LlxuICAgICAgLy8gRmlyc3QgY2hlY2sgd2hldGhlciBpdCdzIGJlZW4gZGVmaW5lZCBhbHJlYWR5LlxuICAgICAgbGV0IG11bHRpUmVjb3JkID0gdGhpcy5yZWNvcmRzLmdldCh0b2tlbik7XG4gICAgICBpZiAobXVsdGlSZWNvcmQpIHtcbiAgICAgICAgLy8gSXQgaGFzLiBUaHJvdyBhIG5pY2UgZXJyb3IgaWZcbiAgICAgICAgaWYgKG11bHRpUmVjb3JkLm11bHRpID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYE1peGVkIG11bHRpLXByb3ZpZGVyIGZvciAke3Rva2VufS5gKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbXVsdGlSZWNvcmQgPSBtYWtlUmVjb3JkKHVuZGVmaW5lZCwgTk9UX1lFVCwgdHJ1ZSk7XG4gICAgICAgIG11bHRpUmVjb3JkLmZhY3RvcnkgPSAoKSA9PiBpbmplY3RBcmdzKG11bHRpUmVjb3JkICEubXVsdGkgISk7XG4gICAgICAgIHRoaXMucmVjb3Jkcy5zZXQodG9rZW4sIG11bHRpUmVjb3JkKTtcbiAgICAgIH1cbiAgICAgIHRva2VuID0gcHJvdmlkZXI7XG4gICAgICBtdWx0aVJlY29yZC5tdWx0aSAhLnB1c2gocHJvdmlkZXIpO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBleGlzdGluZyA9IHRoaXMucmVjb3Jkcy5nZXQodG9rZW4pO1xuICAgICAgaWYgKGV4aXN0aW5nICYmIGV4aXN0aW5nLm11bHRpICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBNaXhlZCBtdWx0aS1wcm92aWRlciBmb3IgJHtzdHJpbmdpZnkodG9rZW4pfWApO1xuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLnJlY29yZHMuc2V0KHRva2VuLCByZWNvcmQpO1xuICB9XG5cbiAgcHJpdmF0ZSBoeWRyYXRlPFQ+KHRva2VuOiBUeXBlPFQ+fEluamVjdGlvblRva2VuPFQ+LCByZWNvcmQ6IFJlY29yZDxUPik6IFQge1xuICAgIGlmIChyZWNvcmQudmFsdWUgPT09IENJUkNVTEFSKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYENpcmN1bGFyIGRlcCBmb3IgJHtzdHJpbmdpZnkodG9rZW4pfWApO1xuICAgIH0gZWxzZSBpZiAocmVjb3JkLnZhbHVlID09PSBOT1RfWUVUKSB7XG4gICAgICByZWNvcmQudmFsdWUgPSBDSVJDVUxBUjtcbiAgICAgIHJlY29yZC52YWx1ZSA9IHJlY29yZC5mYWN0b3J5ICEoKTtcbiAgICB9XG4gICAgaWYgKHR5cGVvZiByZWNvcmQudmFsdWUgPT09ICdvYmplY3QnICYmIHJlY29yZC52YWx1ZSAmJiBoYXNPbkRlc3Ryb3kocmVjb3JkLnZhbHVlKSkge1xuICAgICAgdGhpcy5vbkRlc3Ryb3kuYWRkKHJlY29yZC52YWx1ZSk7XG4gICAgfVxuICAgIHJldHVybiByZWNvcmQudmFsdWUgYXMgVDtcbiAgfVxuXG4gIHByaXZhdGUgaW5qZWN0YWJsZURlZkluU2NvcGUoZGVmOiBJbmplY3RhYmxlRGVmPGFueT4pOiBib29sZWFuIHtcbiAgICBpZiAoIWRlZi5wcm92aWRlZEluKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSBlbHNlIGlmICh0eXBlb2YgZGVmLnByb3ZpZGVkSW4gPT09ICdzdHJpbmcnKSB7XG4gICAgICByZXR1cm4gZGVmLnByb3ZpZGVkSW4gPT09ICdhbnknIHx8IChkZWYucHJvdmlkZWRJbiA9PT0gJ3Jvb3QnICYmIHRoaXMuaXNSb290SW5qZWN0b3IpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gdGhpcy5pbmplY3RvckRlZlR5cGVzLmhhcyhkZWYucHJvdmlkZWRJbik7XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIGluamVjdGFibGVEZWZGYWN0b3J5KHRva2VuOiBUeXBlPGFueT58IEluamVjdGlvblRva2VuPGFueT4pOiAoKSA9PiBhbnkge1xuICBjb25zdCBpbmplY3RhYmxlRGVmID0gZ2V0SW5qZWN0YWJsZURlZih0b2tlbiBhcyBJbmplY3RhYmxlVHlwZTxhbnk+KTtcbiAgaWYgKGluamVjdGFibGVEZWYgPT09IG51bGwpIHtcbiAgICBpZiAodG9rZW4gaW5zdGFuY2VvZiBJbmplY3Rpb25Ub2tlbikge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBUb2tlbiAke3N0cmluZ2lmeSh0b2tlbil9IGlzIG1pc3NpbmcgYW4gbmdJbmplY3RhYmxlRGVmIGRlZmluaXRpb24uYCk7XG4gICAgfVxuICAgIC8vIFRPRE8oYWx4aHViKTogdGhlcmUgc2hvdWxkIHByb2JhYmx5IGJlIGEgc3RyaWN0IG1vZGUgd2hpY2ggdGhyb3dzIGhlcmUgaW5zdGVhZCBvZiBhc3N1bWluZyBhXG4gICAgLy8gbm8tYXJncyBjb25zdHJ1Y3Rvci5cbiAgICByZXR1cm4gKCkgPT4gbmV3ICh0b2tlbiBhcyBUeXBlPGFueT4pKCk7XG4gIH1cbiAgcmV0dXJuIGluamVjdGFibGVEZWYuZmFjdG9yeTtcbn1cblxuZnVuY3Rpb24gcHJvdmlkZXJUb1JlY29yZChwcm92aWRlcjogU2luZ2xlUHJvdmlkZXIpOiBSZWNvcmQ8YW55PiB7XG4gIGxldCBmYWN0b3J5OiAoKCkgPT4gYW55KXx1bmRlZmluZWQgPSBwcm92aWRlclRvRmFjdG9yeShwcm92aWRlcik7XG4gIGlmIChpc1ZhbHVlUHJvdmlkZXIocHJvdmlkZXIpKSB7XG4gICAgcmV0dXJuIG1ha2VSZWNvcmQodW5kZWZpbmVkLCBwcm92aWRlci51c2VWYWx1ZSk7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIG1ha2VSZWNvcmQoZmFjdG9yeSwgTk9UX1lFVCk7XG4gIH1cbn1cblxuLyoqXG4gKiBDb252ZXJ0cyBhIGBTaW5nbGVQcm92aWRlcmAgaW50byBhIGZhY3RvcnkgZnVuY3Rpb24uXG4gKlxuICogQHBhcmFtIHByb3ZpZGVyIHByb3ZpZGVyIHRvIGNvbnZlcnQgdG8gZmFjdG9yeVxuICovXG5leHBvcnQgZnVuY3Rpb24gcHJvdmlkZXJUb0ZhY3RvcnkocHJvdmlkZXI6IFNpbmdsZVByb3ZpZGVyKTogKCkgPT4gYW55IHtcbiAgbGV0IGZhY3Rvcnk6ICgoKSA9PiBhbnkpfHVuZGVmaW5lZCA9IHVuZGVmaW5lZDtcbiAgaWYgKGlzVHlwZVByb3ZpZGVyKHByb3ZpZGVyKSkge1xuICAgIHJldHVybiBpbmplY3RhYmxlRGVmRmFjdG9yeShyZXNvbHZlRm9yd2FyZFJlZihwcm92aWRlcikpO1xuICB9IGVsc2Uge1xuICAgIGlmIChpc1ZhbHVlUHJvdmlkZXIocHJvdmlkZXIpKSB7XG4gICAgICBmYWN0b3J5ID0gKCkgPT4gcmVzb2x2ZUZvcndhcmRSZWYocHJvdmlkZXIudXNlVmFsdWUpO1xuICAgIH0gZWxzZSBpZiAoaXNFeGlzdGluZ1Byb3ZpZGVyKHByb3ZpZGVyKSkge1xuICAgICAgZmFjdG9yeSA9ICgpID0+IGluamVjdChyZXNvbHZlRm9yd2FyZFJlZihwcm92aWRlci51c2VFeGlzdGluZykpO1xuICAgIH0gZWxzZSBpZiAoaXNGYWN0b3J5UHJvdmlkZXIocHJvdmlkZXIpKSB7XG4gICAgICBmYWN0b3J5ID0gKCkgPT4gcHJvdmlkZXIudXNlRmFjdG9yeSguLi5pbmplY3RBcmdzKHByb3ZpZGVyLmRlcHMgfHwgW10pKTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgY2xhc3NSZWYgPSByZXNvbHZlRm9yd2FyZFJlZihcbiAgICAgICAgICAocHJvdmlkZXIgYXMgU3RhdGljQ2xhc3NQcm92aWRlciB8IENsYXNzUHJvdmlkZXIpLnVzZUNsYXNzIHx8IHByb3ZpZGVyLnByb3ZpZGUpO1xuICAgICAgaWYgKGhhc0RlcHMocHJvdmlkZXIpKSB7XG4gICAgICAgIGZhY3RvcnkgPSAoKSA9PiBuZXcgKGNsYXNzUmVmKSguLi5pbmplY3RBcmdzKHByb3ZpZGVyLmRlcHMpKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBpbmplY3RhYmxlRGVmRmFjdG9yeShjbGFzc1JlZik7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiBmYWN0b3J5O1xufVxuXG5mdW5jdGlvbiBtYWtlUmVjb3JkPFQ+KFxuICAgIGZhY3Rvcnk6ICgoKSA9PiBUKSB8IHVuZGVmaW5lZCwgdmFsdWU6IFQgfCB7fSA9IE5PVF9ZRVQsIG11bHRpOiBib29sZWFuID0gZmFsc2UpOiBSZWNvcmQ8VD4ge1xuICByZXR1cm4ge1xuICAgIGZhY3Rvcnk6IGZhY3RvcnksXG4gICAgdmFsdWU6IHZhbHVlLFxuICAgIG11bHRpOiBtdWx0aSA/IFtdIDogdW5kZWZpbmVkLFxuICB9O1xufVxuXG5mdW5jdGlvbiBkZWVwRm9yRWFjaDxUPihpbnB1dDogKFQgfCBhbnlbXSlbXSwgZm46ICh2YWx1ZTogVCkgPT4gdm9pZCk6IHZvaWQge1xuICBpbnB1dC5mb3JFYWNoKHZhbHVlID0+IEFycmF5LmlzQXJyYXkodmFsdWUpID8gZGVlcEZvckVhY2godmFsdWUsIGZuKSA6IGZuKHZhbHVlKSk7XG59XG5cbmZ1bmN0aW9uIGlzVmFsdWVQcm92aWRlcih2YWx1ZTogU2luZ2xlUHJvdmlkZXIpOiB2YWx1ZSBpcyBWYWx1ZVByb3ZpZGVyIHtcbiAgcmV0dXJuIFVTRV9WQUxVRSBpbiB2YWx1ZTtcbn1cblxuZnVuY3Rpb24gaXNFeGlzdGluZ1Byb3ZpZGVyKHZhbHVlOiBTaW5nbGVQcm92aWRlcik6IHZhbHVlIGlzIEV4aXN0aW5nUHJvdmlkZXIge1xuICByZXR1cm4gISEodmFsdWUgYXMgRXhpc3RpbmdQcm92aWRlcikudXNlRXhpc3Rpbmc7XG59XG5cbmZ1bmN0aW9uIGlzRmFjdG9yeVByb3ZpZGVyKHZhbHVlOiBTaW5nbGVQcm92aWRlcik6IHZhbHVlIGlzIEZhY3RvcnlQcm92aWRlciB7XG4gIHJldHVybiAhISh2YWx1ZSBhcyBGYWN0b3J5UHJvdmlkZXIpLnVzZUZhY3Rvcnk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc1R5cGVQcm92aWRlcih2YWx1ZTogU2luZ2xlUHJvdmlkZXIpOiB2YWx1ZSBpcyBUeXBlUHJvdmlkZXIge1xuICByZXR1cm4gdHlwZW9mIHZhbHVlID09PSAnZnVuY3Rpb24nO1xufVxuXG5mdW5jdGlvbiBoYXNEZXBzKHZhbHVlOiBDbGFzc1Byb3ZpZGVyIHwgQ29uc3RydWN0b3JQcm92aWRlciB8IFN0YXRpY0NsYXNzUHJvdmlkZXIpOlxuICAgIHZhbHVlIGlzIENsYXNzUHJvdmlkZXIme2RlcHM6IGFueVtdfSB7XG4gIHJldHVybiAhISh2YWx1ZSBhcyBhbnkpLmRlcHM7XG59XG5cbmZ1bmN0aW9uIGhhc09uRGVzdHJveSh2YWx1ZTogYW55KTogdmFsdWUgaXMgT25EZXN0cm95IHtcbiAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcgJiYgdmFsdWUgIT0gbnVsbCAmJiAodmFsdWUgYXMgT25EZXN0cm95KS5uZ09uRGVzdHJveSAmJlxuICAgICAgdHlwZW9mKHZhbHVlIGFzIE9uRGVzdHJveSkubmdPbkRlc3Ryb3kgPT09ICdmdW5jdGlvbic7XG59XG5cbmZ1bmN0aW9uIGNvdWxkQmVJbmplY3RhYmxlVHlwZSh2YWx1ZTogYW55KTogdmFsdWUgaXMgVHlwZTxhbnk+fEluamVjdGlvblRva2VuPGFueT4ge1xuICByZXR1cm4gKHR5cGVvZiB2YWx1ZSA9PT0gJ2Z1bmN0aW9uJykgfHxcbiAgICAgICh0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnICYmIHZhbHVlIGluc3RhbmNlb2YgSW5qZWN0aW9uVG9rZW4pO1xufVxuIl19