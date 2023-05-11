/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import '../util/ng_dev_mode';
import { RuntimeError } from '../errors';
import { getFactoryDef } from '../render3/definition_factory';
import { throwCyclicDependencyError, throwInvalidProviderError, throwMixedMultiProviderError } from '../render3/errors_di';
import { NG_ENV_ID } from '../render3/fields';
import { newArray } from '../util/array_utils';
import { EMPTY_ARRAY } from '../util/empty';
import { stringify } from '../util/stringify';
import { resolveForwardRef } from './forward_ref';
import { ENVIRONMENT_INITIALIZER } from './initializer_token';
import { setInjectImplementation } from './inject_switch';
import { InjectionToken } from './injection_token';
import { catchInjectorError, convertToBitFlags, injectArgs, NG_TEMP_TOKEN_PATH, setCurrentInjector, THROW_IF_NOT_FOUND, ɵɵinject } from './injector_compatibility';
import { INJECTOR } from './injector_token';
import { getInheritedInjectableDef, getInjectableDef } from './interface/defs';
import { InjectFlags } from './interface/injector';
import { isEnvironmentProviders } from './interface/provider';
import { INJECTOR_DEF_TYPES } from './internal_tokens';
import { NullInjector } from './null_injector';
import { isExistingProvider, isFactoryProvider, isTypeProvider, isValueProvider } from './provider_collection';
import { INJECTOR_SCOPE } from './scope';
/**
 * Marker which indicates that a value has not yet been created from the factory function.
 */
const NOT_YET = {};
/**
 * Marker which indicates that the factory function for a token is in the process of being called.
 *
 * If the injector is asked to inject a token with its value set to CIRCULAR, that indicates
 * injection of a dependency has recursively attempted to inject the original token, and there is
 * a circular dependency among the providers.
 */
const CIRCULAR = {};
/**
 * A lazily initialized NullInjector.
 */
let NULL_INJECTOR = undefined;
export function getNullInjector() {
    if (NULL_INJECTOR === undefined) {
        NULL_INJECTOR = new NullInjector();
    }
    return NULL_INJECTOR;
}
/**
 * An `Injector` that's part of the environment injector hierarchy, which exists outside of the
 * component tree.
 */
export class EnvironmentInjector {
}
export class R3Injector extends EnvironmentInjector {
    /**
     * Flag indicating that this injector was previously destroyed.
     */
    get destroyed() {
        return this._destroyed;
    }
    constructor(providers, parent, source, scopes) {
        super();
        this.parent = parent;
        this.source = source;
        this.scopes = scopes;
        /**
         * Map of tokens to records which contain the instances of those tokens.
         * - `null` value implies that we don't have the record. Used by tree-shakable injectors
         * to prevent further searches.
         */
        this.records = new Map();
        /**
         * Set of values instantiated by this injector which contain `ngOnDestroy` lifecycle hooks.
         */
        this._ngOnDestroyHooks = new Set();
        this._onDestroyHooks = [];
        this._destroyed = false;
        // Start off by creating Records for every provider.
        forEachSingleProvider(providers, provider => this.processProvider(provider));
        // Make sure the INJECTOR token provides this injector.
        this.records.set(INJECTOR, makeRecord(undefined, this));
        // And `EnvironmentInjector` if the current injector is supposed to be env-scoped.
        if (scopes.has('environment')) {
            this.records.set(EnvironmentInjector, makeRecord(undefined, this));
        }
        // Detect whether this injector has the APP_ROOT_SCOPE token and thus should provide
        // any injectable scoped to APP_ROOT_SCOPE.
        const record = this.records.get(INJECTOR_SCOPE);
        if (record != null && typeof record.value === 'string') {
            this.scopes.add(record.value);
        }
        this.injectorDefTypes =
            new Set(this.get(INJECTOR_DEF_TYPES.multi, EMPTY_ARRAY, InjectFlags.Self));
    }
    /**
     * Destroy the injector and release references to every instance or provider associated with it.
     *
     * Also calls the `OnDestroy` lifecycle hooks of every instance that was created for which a
     * hook was found.
     */
    destroy() {
        this.assertNotDestroyed();
        // Set destroyed = true first, in case lifecycle hooks re-enter destroy().
        this._destroyed = true;
        try {
            // Call all the lifecycle hooks.
            for (const service of this._ngOnDestroyHooks) {
                service.ngOnDestroy();
            }
            const onDestroyHooks = this._onDestroyHooks;
            // Reset the _onDestroyHooks array before iterating over it to prevent hooks that unregister
            // themselves from mutating the array during iteration.
            this._onDestroyHooks = [];
            for (const hook of onDestroyHooks) {
                hook();
            }
        }
        finally {
            // Release all references.
            this.records.clear();
            this._ngOnDestroyHooks.clear();
            this.injectorDefTypes.clear();
        }
    }
    onDestroy(callback) {
        this.assertNotDestroyed();
        this._onDestroyHooks.push(callback);
        return () => this.removeOnDestroy(callback);
    }
    runInContext(fn) {
        this.assertNotDestroyed();
        const previousInjector = setCurrentInjector(this);
        const previousInjectImplementation = setInjectImplementation(undefined);
        try {
            return fn();
        }
        finally {
            setCurrentInjector(previousInjector);
            setInjectImplementation(previousInjectImplementation);
        }
    }
    get(token, notFoundValue = THROW_IF_NOT_FOUND, flags = InjectFlags.Default) {
        this.assertNotDestroyed();
        if (token.hasOwnProperty(NG_ENV_ID)) {
            return token[NG_ENV_ID](this);
        }
        flags = convertToBitFlags(flags);
        // Set the injection context.
        const previousInjector = setCurrentInjector(this);
        const previousInjectImplementation = setInjectImplementation(undefined);
        try {
            // Check for the SkipSelf flag.
            if (!(flags & InjectFlags.SkipSelf)) {
                // SkipSelf isn't set, check if the record belongs to this injector.
                let record = this.records.get(token);
                if (record === undefined) {
                    // No record, but maybe the token is scoped to this injector. Look for an injectable
                    // def with a scope matching this injector.
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
            // Lastly, restore the previous injection context.
            setInjectImplementation(previousInjectImplementation);
            setCurrentInjector(previousInjector);
        }
    }
    /** @internal */
    resolveInjectorInitializers() {
        const previousInjector = setCurrentInjector(this);
        const previousInjectImplementation = setInjectImplementation(undefined);
        try {
            const initializers = this.get(ENVIRONMENT_INITIALIZER.multi, EMPTY_ARRAY, InjectFlags.Self);
            if (ngDevMode && !Array.isArray(initializers)) {
                throw new RuntimeError(-209 /* RuntimeErrorCode.INVALID_MULTI_PROVIDER */, 'Unexpected type of the `ENVIRONMENT_INITIALIZER` token value ' +
                    `(expected an array, but got ${typeof initializers}). ` +
                    'Please check that the `ENVIRONMENT_INITIALIZER` token is configured as a ' +
                    '`multi: true` provider.');
            }
            for (const initializer of initializers) {
                initializer();
            }
        }
        finally {
            setCurrentInjector(previousInjector);
            setInjectImplementation(previousInjectImplementation);
        }
    }
    toString() {
        const tokens = [];
        const records = this.records;
        for (const token of records.keys()) {
            tokens.push(stringify(token));
        }
        return `R3Injector[${tokens.join(', ')}]`;
    }
    assertNotDestroyed() {
        if (this._destroyed) {
            throw new RuntimeError(205 /* RuntimeErrorCode.INJECTOR_ALREADY_DESTROYED */, ngDevMode && 'Injector has already been destroyed.');
        }
    }
    /**
     * Process a `SingleProvider` and add it.
     */
    processProvider(provider) {
        // Determine the token from the provider. Either it's its own token, or has a {provide: ...}
        // property.
        provider = resolveForwardRef(provider);
        let token = isTypeProvider(provider) ? provider : resolveForwardRef(provider && provider.provide);
        // Construct a `Record` for the provider.
        const record = providerToRecord(provider);
        if (!isTypeProvider(provider) && provider.multi === true) {
            // If the provider indicates that it's a multi-provider, process it specially.
            // First check whether it's been defined already.
            let multiRecord = this.records.get(token);
            if (multiRecord) {
                // It has. Throw a nice error if
                if (ngDevMode && multiRecord.multi === undefined) {
                    throwMixedMultiProviderError();
                }
            }
            else {
                multiRecord = makeRecord(undefined, NOT_YET, true);
                multiRecord.factory = () => injectArgs(multiRecord.multi);
                this.records.set(token, multiRecord);
            }
            token = provider;
            multiRecord.multi.push(provider);
        }
        else {
            const existing = this.records.get(token);
            if (ngDevMode && existing && existing.multi !== undefined) {
                throwMixedMultiProviderError();
            }
        }
        this.records.set(token, record);
    }
    hydrate(token, record) {
        if (ngDevMode && record.value === CIRCULAR) {
            throwCyclicDependencyError(stringify(token));
        }
        else if (record.value === NOT_YET) {
            record.value = CIRCULAR;
            record.value = record.factory();
        }
        if (typeof record.value === 'object' && record.value && hasOnDestroy(record.value)) {
            this._ngOnDestroyHooks.add(record.value);
        }
        return record.value;
    }
    injectableDefInScope(def) {
        if (!def.providedIn) {
            return false;
        }
        const providedIn = resolveForwardRef(def.providedIn);
        if (typeof providedIn === 'string') {
            return providedIn === 'any' || (this.scopes.has(providedIn));
        }
        else {
            return this.injectorDefTypes.has(providedIn);
        }
    }
    removeOnDestroy(callback) {
        const destroyCBIdx = this._onDestroyHooks.indexOf(callback);
        if (destroyCBIdx !== -1) {
            this._onDestroyHooks.splice(destroyCBIdx, 1);
        }
    }
}
function injectableDefOrInjectorDefFactory(token) {
    // Most tokens will have an injectable def directly on them, which specifies a factory directly.
    const injectableDef = getInjectableDef(token);
    const factory = injectableDef !== null ? injectableDef.factory : getFactoryDef(token);
    if (factory !== null) {
        return factory;
    }
    // InjectionTokens should have an injectable def (ɵprov) and thus should be handled above.
    // If it's missing that, it's an error.
    if (token instanceof InjectionToken) {
        throw new RuntimeError(204 /* RuntimeErrorCode.INVALID_INJECTION_TOKEN */, ngDevMode && `Token ${stringify(token)} is missing a ɵprov definition.`);
    }
    // Undecorated types can sometimes be created if they have no constructor arguments.
    if (token instanceof Function) {
        return getUndecoratedInjectableFactory(token);
    }
    // There was no way to resolve a factory for this token.
    throw new RuntimeError(204 /* RuntimeErrorCode.INVALID_INJECTION_TOKEN */, ngDevMode && 'unreachable');
}
function getUndecoratedInjectableFactory(token) {
    // If the token has parameters then it has dependencies that we cannot resolve implicitly.
    const paramLength = token.length;
    if (paramLength > 0) {
        const args = newArray(paramLength, '?');
        throw new RuntimeError(204 /* RuntimeErrorCode.INVALID_INJECTION_TOKEN */, ngDevMode && `Can't resolve all parameters for ${stringify(token)}: (${args.join(', ')}).`);
    }
    // The constructor function appears to have no parameters.
    // This might be because it inherits from a super-class. In which case, use an injectable
    // def from an ancestor if there is one.
    // Otherwise this really is a simple class with no dependencies, so return a factory that
    // just instantiates the zero-arg constructor.
    const inheritedInjectableDef = getInheritedInjectableDef(token);
    if (inheritedInjectableDef !== null) {
        return () => inheritedInjectableDef.factory(token);
    }
    else {
        return () => new token();
    }
}
function providerToRecord(provider) {
    if (isValueProvider(provider)) {
        return makeRecord(undefined, provider.useValue);
    }
    else {
        const factory = providerToFactory(provider);
        return makeRecord(factory, NOT_YET);
    }
}
/**
 * Converts a `SingleProvider` into a factory function.
 *
 * @param provider provider to convert to factory
 */
export function providerToFactory(provider, ngModuleType, providers) {
    let factory = undefined;
    if (ngDevMode && isEnvironmentProviders(provider)) {
        throwInvalidProviderError(undefined, providers, provider);
    }
    if (isTypeProvider(provider)) {
        const unwrappedProvider = resolveForwardRef(provider);
        return getFactoryDef(unwrappedProvider) || injectableDefOrInjectorDefFactory(unwrappedProvider);
    }
    else {
        if (isValueProvider(provider)) {
            factory = () => resolveForwardRef(provider.useValue);
        }
        else if (isFactoryProvider(provider)) {
            factory = () => provider.useFactory(...injectArgs(provider.deps || []));
        }
        else if (isExistingProvider(provider)) {
            factory = () => ɵɵinject(resolveForwardRef(provider.useExisting));
        }
        else {
            const classRef = resolveForwardRef(provider &&
                (provider.useClass || provider.provide));
            if (ngDevMode && !classRef) {
                throwInvalidProviderError(ngModuleType, providers, provider);
            }
            if (hasDeps(provider)) {
                factory = () => new (classRef)(...injectArgs(provider.deps));
            }
            else {
                return getFactoryDef(classRef) || injectableDefOrInjectorDefFactory(classRef);
            }
        }
    }
    return factory;
}
function makeRecord(factory, value, multi = false) {
    return {
        factory: factory,
        value: value,
        multi: multi ? [] : undefined,
    };
}
function hasDeps(value) {
    return !!value.deps;
}
function hasOnDestroy(value) {
    return value !== null && typeof value === 'object' &&
        typeof value.ngOnDestroy === 'function';
}
function couldBeInjectableType(value) {
    return (typeof value === 'function') ||
        (typeof value === 'object' && value instanceof InjectionToken);
}
function forEachSingleProvider(providers, fn) {
    for (const provider of providers) {
        if (Array.isArray(provider)) {
            forEachSingleProvider(provider, fn);
        }
        else if (provider && isEnvironmentProviders(provider)) {
            forEachSingleProvider(provider.ɵproviders, fn);
        }
        else {
            fn(provider);
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicjNfaW5qZWN0b3IuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9kaS9yM19pbmplY3Rvci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLHFCQUFxQixDQUFDO0FBRTdCLE9BQU8sRUFBQyxZQUFZLEVBQW1CLE1BQU0sV0FBVyxDQUFDO0FBR3pELE9BQU8sRUFBWSxhQUFhLEVBQUMsTUFBTSwrQkFBK0IsQ0FBQztBQUN2RSxPQUFPLEVBQUMsMEJBQTBCLEVBQUUseUJBQXlCLEVBQUUsNEJBQTRCLEVBQUMsTUFBTSxzQkFBc0IsQ0FBQztBQUN6SCxPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDNUMsT0FBTyxFQUFDLFFBQVEsRUFBQyxNQUFNLHFCQUFxQixDQUFDO0FBQzdDLE9BQU8sRUFBQyxXQUFXLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFDMUMsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBRTVDLE9BQU8sRUFBQyxpQkFBaUIsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUNoRCxPQUFPLEVBQUMsdUJBQXVCLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUM1RCxPQUFPLEVBQUMsdUJBQXVCLEVBQUMsTUFBTSxpQkFBaUIsQ0FBQztBQUN4RCxPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFFakQsT0FBTyxFQUFDLGtCQUFrQixFQUFFLGlCQUFpQixFQUFFLFVBQVUsRUFBRSxrQkFBa0IsRUFBRSxrQkFBa0IsRUFBRSxrQkFBa0IsRUFBRSxRQUFRLEVBQUMsTUFBTSwwQkFBMEIsQ0FBQztBQUNqSyxPQUFPLEVBQUMsUUFBUSxFQUFDLE1BQU0sa0JBQWtCLENBQUM7QUFDMUMsT0FBTyxFQUFDLHlCQUF5QixFQUFFLGdCQUFnQixFQUF3QyxNQUFNLGtCQUFrQixDQUFDO0FB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S0FBSyxZQUFZLGNBQWMsQ0FBQyxDQUFDO0FBQ3JFLENBQUM7QUFFRCxTQUFTLHFCQUFxQixDQUMxQixTQUErQyxFQUFFLEVBQXNDO0lBQ3pGLEtBQUssTUFBTSxRQUFRLElBQUksU0FBUyxFQUFFO1FBQ2hDLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsRUFBRTtZQUMzQixxQkFBcUIsQ0FBQyxRQUFRLEVBQUUsRUFBRSxDQUFDLENBQUM7U0FDckM7YUFBTSxJQUFJLFFBQVEsSUFBSSxzQkFBc0IsQ0FBQyxRQUFRLENBQUMsRUFBRTtZQUN2RCxxQkFBcUIsQ0FBQyxRQUFRLENBQUMsVUFBVSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1NBQ2hEO2FBQU07WUFDTCxFQUFFLENBQUMsUUFBMEIsQ0FBQyxDQUFDO1NBQ2hDO0tBQ0Y7QUFDSCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCAnLi4vdXRpbC9uZ19kZXZfbW9kZSc7XG5cbmltcG9ydCB7UnVudGltZUVycm9yLCBSdW50aW1lRXJyb3JDb2RlfSBmcm9tICcuLi9lcnJvcnMnO1xuaW1wb3J0IHtPbkRlc3Ryb3l9IGZyb20gJy4uL2ludGVyZmFjZS9saWZlY3ljbGVfaG9va3MnO1xuaW1wb3J0IHtUeXBlfSBmcm9tICcuLi9pbnRlcmZhY2UvdHlwZSc7XG5pbXBvcnQge0ZhY3RvcnlGbiwgZ2V0RmFjdG9yeURlZn0gZnJvbSAnLi4vcmVuZGVyMy9kZWZpbml0aW9uX2ZhY3RvcnknO1xuaW1wb3J0IHt0aHJvd0N5Y2xpY0RlcGVuZGVuY3lFcnJvciwgdGhyb3dJbnZhbGlkUHJvdmlkZXJFcnJvciwgdGhyb3dNaXhlZE11bHRpUHJvdmlkZXJFcnJvcn0gZnJvbSAnLi4vcmVuZGVyMy9lcnJvcnNfZGknO1xuaW1wb3J0IHtOR19FTlZfSUR9IGZyb20gJy4uL3JlbmRlcjMvZmllbGRzJztcbmltcG9ydCB7bmV3QXJyYXl9IGZyb20gJy4uL3V0aWwvYXJyYXlfdXRpbHMnO1xuaW1wb3J0IHtFTVBUWV9BUlJBWX0gZnJvbSAnLi4vdXRpbC9lbXB0eSc7XG5pbXBvcnQge3N0cmluZ2lmeX0gZnJvbSAnLi4vdXRpbC9zdHJpbmdpZnknO1xuXG5pbXBvcnQge3Jlc29sdmVGb3J3YXJkUmVmfSBmcm9tICcuL2ZvcndhcmRfcmVmJztcbmltcG9ydCB7RU5WSVJPTk1FTlRfSU5JVElBTElaRVJ9IGZyb20gJy4vaW5pdGlhbGl6ZXJfdG9rZW4nO1xuaW1wb3J0IHtzZXRJbmplY3RJbXBsZW1lbnRhdGlvbn0gZnJvbSAnLi9pbmplY3Rfc3dpdGNoJztcbmltcG9ydCB7SW5qZWN0aW9uVG9rZW59IGZyb20gJy4vaW5qZWN0aW9uX3Rva2VuJztcbmltcG9ydCB7SW5qZWN0b3J9IGZyb20gJy4vaW5qZWN0b3InO1xuaW1wb3J0IHtjYXRjaEluamVjdG9yRXJyb3IsIGNvbnZlcnRUb0JpdEZsYWdzLCBpbmplY3RBcmdzLCBOR19URU1QX1RPS0VOX1BBVEgsIHNldEN1cnJlbnRJbmplY3RvciwgVEhST1dfSUZfTk9UX0ZPVU5ELCDJtcm1aW5qZWN0fSBmcm9tICcuL2luamVjdG9yX2NvbXBhdGliaWxpdHknO1xuaW1wb3J0IHtJTkpFQ1RPUn0gZnJvbSAnLi9pbmplY3Rvcl90b2tlbic7XG5pbXBvcnQge2dldEluaGVyaXRlZEluamVjdGFibGVEZWYsIGdldEluamVjdGFibGVEZWYsIEluamVjdG9yVHlwZSwgybXJtUluamVjdGFibGVEZWNsYXJhdGlvbn0gZnJvbSAnLi9pbnRlcmZhY2UvZGVmcyc7XG5pbXBvcnQge0luamVjdEZsYWdzLCBJbmplY3RPcHRpb25zfSBmcm9tICcuL2ludGVyZmFjZS9pbmplY3Rvcic7XG5pbXBvcnQge0NsYXNzUHJvdmlkZXIsIENvbnN0cnVjdG9yUHJvdmlkZXIsIEVudmlyb25tZW50UHJvdmlkZXJzLCBJbnRlcm5hbEVudmlyb25tZW50UHJvdmlkZXJzLCBpc0Vudmlyb25tZW50UHJvdmlkZXJzLCBQcm92aWRlciwgU3RhdGljQ2xhc3NQcm92aWRlcn0gZnJvbSAnLi9pbnRlcmZhY2UvcHJvdmlkZXInO1xuaW1wb3J0IHtJTkpFQ1RPUl9ERUZfVFlQRVN9IGZyb20gJy4vaW50ZXJuYWxfdG9rZW5zJztcbmltcG9ydCB7TnVsbEluamVjdG9yfSBmcm9tICcuL251bGxfaW5qZWN0b3InO1xuaW1wb3J0IHtpc0V4aXN0aW5nUHJvdmlkZXIsIGlzRmFjdG9yeVByb3ZpZGVyLCBpc1R5cGVQcm92aWRlciwgaXNWYWx1ZVByb3ZpZGVyLCBTaW5nbGVQcm92aWRlcn0gZnJvbSAnLi9wcm92aWRlcl9jb2xsZWN0aW9uJztcbmltcG9ydCB7UHJvdmlkZXJUb2tlbn0gZnJvbSAnLi9wcm92aWRlcl90b2tlbic7XG5pbXBvcnQge0lOSkVDVE9SX1NDT1BFLCBJbmplY3RvclNjb3BlfSBmcm9tICcuL3Njb3BlJztcblxuLyoqXG4gKiBNYXJrZXIgd2hpY2ggaW5kaWNhdGVzIHRoYXQgYSB2YWx1ZSBoYXMgbm90IHlldCBiZWVuIGNyZWF0ZWQgZnJvbSB0aGUgZmFjdG9yeSBmdW5jdGlvbi5cbiAqL1xuY29uc3QgTk9UX1lFVCA9IHt9O1xuXG4vKipcbiAqIE1hcmtlciB3aGljaCBpbmRpY2F0ZXMgdGhhdCB0aGUgZmFjdG9yeSBmdW5jdGlvbiBmb3IgYSB0b2tlbiBpcyBpbiB0aGUgcHJvY2VzcyBvZiBiZWluZyBjYWxsZWQuXG4gKlxuICogSWYgdGhlIGluamVjdG9yIGlzIGFza2VkIHRvIGluamVjdCBhIHRva2VuIHdpdGggaXRzIHZhbHVlIHNldCB0byBDSVJDVUxBUiwgdGhhdCBpbmRpY2F0ZXNcbiAqIGluamVjdGlvbiBvZiBhIGRlcGVuZGVuY3kgaGFzIHJlY3Vyc2l2ZWx5IGF0dGVtcHRlZCB0byBpbmplY3QgdGhlIG9yaWdpbmFsIHRva2VuLCBhbmQgdGhlcmUgaXNcbiAqIGEgY2lyY3VsYXIgZGVwZW5kZW5jeSBhbW9uZyB0aGUgcHJvdmlkZXJzLlxuICovXG5jb25zdCBDSVJDVUxBUiA9IHt9O1xuXG4vKipcbiAqIEEgbGF6aWx5IGluaXRpYWxpemVkIE51bGxJbmplY3Rvci5cbiAqL1xubGV0IE5VTExfSU5KRUNUT1I6IEluamVjdG9yfHVuZGVmaW5lZCA9IHVuZGVmaW5lZDtcblxuZXhwb3J0IGZ1bmN0aW9uIGdldE51bGxJbmplY3RvcigpOiBJbmplY3RvciB7XG4gIGlmIChOVUxMX0lOSkVDVE9SID09PSB1bmRlZmluZWQpIHtcbiAgICBOVUxMX0lOSkVDVE9SID0gbmV3IE51bGxJbmplY3RvcigpO1xuICB9XG4gIHJldHVybiBOVUxMX0lOSkVDVE9SO1xufVxuXG4vKipcbiAqIEFuIGVudHJ5IGluIHRoZSBpbmplY3RvciB3aGljaCB0cmFja3MgaW5mb3JtYXRpb24gYWJvdXQgdGhlIGdpdmVuIHRva2VuLCBpbmNsdWRpbmcgYSBwb3NzaWJsZVxuICogY3VycmVudCB2YWx1ZS5cbiAqL1xuaW50ZXJmYWNlIFJlY29yZDxUPiB7XG4gIGZhY3Rvcnk6ICgoKSA9PiBUKXx1bmRlZmluZWQ7XG4gIHZhbHVlOiBUfHt9O1xuICBtdWx0aTogYW55W118dW5kZWZpbmVkO1xufVxuXG4vKipcbiAqIEFuIGBJbmplY3RvcmAgdGhhdCdzIHBhcnQgb2YgdGhlIGVudmlyb25tZW50IGluamVjdG9yIGhpZXJhcmNoeSwgd2hpY2ggZXhpc3RzIG91dHNpZGUgb2YgdGhlXG4gKiBjb21wb25lbnQgdHJlZS5cbiAqL1xuZXhwb3J0IGFic3RyYWN0IGNsYXNzIEVudmlyb25tZW50SW5qZWN0b3IgaW1wbGVtZW50cyBJbmplY3RvciB7XG4gIC8qKlxuICAgKiBSZXRyaWV2ZXMgYW4gaW5zdGFuY2UgZnJvbSB0aGUgaW5qZWN0b3IgYmFzZWQgb24gdGhlIHByb3ZpZGVkIHRva2VuLlxuICAgKiBAcmV0dXJucyBUaGUgaW5zdGFuY2UgZnJvbSB0aGUgaW5qZWN0b3IgaWYgZGVmaW5lZCwgb3RoZXJ3aXNlIHRoZSBgbm90Rm91bmRWYWx1ZWAuXG4gICAqIEB0aHJvd3MgV2hlbiB0aGUgYG5vdEZvdW5kVmFsdWVgIGlzIGB1bmRlZmluZWRgIG9yIGBJbmplY3Rvci5USFJPV19JRl9OT1RfRk9VTkRgLlxuICAgKi9cbiAgYWJzdHJhY3QgZ2V0PFQ+KHRva2VuOiBQcm92aWRlclRva2VuPFQ+LCBub3RGb3VuZFZhbHVlOiB1bmRlZmluZWQsIG9wdGlvbnM6IEluamVjdE9wdGlvbnMme1xuICAgIG9wdGlvbmFsPzogZmFsc2U7XG4gIH0pOiBUO1xuICAvKipcbiAgICogUmV0cmlldmVzIGFuIGluc3RhbmNlIGZyb20gdGhlIGluamVjdG9yIGJhc2VkIG9uIHRoZSBwcm92aWRlZCB0b2tlbi5cbiAgICogQHJldHVybnMgVGhlIGluc3RhbmNlIGZyb20gdGhlIGluamVjdG9yIGlmIGRlZmluZWQsIG90aGVyd2lzZSB0aGUgYG5vdEZvdW5kVmFsdWVgLlxuICAgKiBAdGhyb3dzIFdoZW4gdGhlIGBub3RGb3VuZFZhbHVlYCBpcyBgdW5kZWZpbmVkYCBvciBgSW5qZWN0b3IuVEhST1dfSUZfTk9UX0ZPVU5EYC5cbiAgICovXG4gIGFic3RyYWN0IGdldDxUPih0b2tlbjogUHJvdmlkZXJUb2tlbjxUPiwgbm90Rm91bmRWYWx1ZTogbnVsbHx1bmRlZmluZWQsIG9wdGlvbnM6IEluamVjdE9wdGlvbnMpOiBUXG4gICAgICB8bnVsbDtcbiAgLyoqXG4gICAqIFJldHJpZXZlcyBhbiBpbnN0YW5jZSBmcm9tIHRoZSBpbmplY3RvciBiYXNlZCBvbiB0aGUgcHJvdmlkZWQgdG9rZW4uXG4gICAqIEByZXR1cm5zIFRoZSBpbnN0YW5jZSBmcm9tIHRoZSBpbmplY3RvciBpZiBkZWZpbmVkLCBvdGhlcndpc2UgdGhlIGBub3RGb3VuZFZhbHVlYC5cbiAgICogQHRocm93cyBXaGVuIHRoZSBgbm90Rm91bmRWYWx1ZWAgaXMgYHVuZGVmaW5lZGAgb3IgYEluamVjdG9yLlRIUk9XX0lGX05PVF9GT1VORGAuXG4gICAqL1xuICBhYnN0cmFjdCBnZXQ8VD4odG9rZW46IFByb3ZpZGVyVG9rZW48VD4sIG5vdEZvdW5kVmFsdWU/OiBULCBvcHRpb25zPzogSW5qZWN0T3B0aW9ucyk6IFQ7XG4gIC8qKlxuICAgKiBSZXRyaWV2ZXMgYW4gaW5zdGFuY2UgZnJvbSB0aGUgaW5qZWN0b3IgYmFzZWQgb24gdGhlIHByb3ZpZGVkIHRva2VuLlxuICAgKiBAcmV0dXJucyBUaGUgaW5zdGFuY2UgZnJvbSB0aGUgaW5qZWN0b3IgaWYgZGVmaW5lZCwgb3RoZXJ3aXNlIHRoZSBgbm90Rm91bmRWYWx1ZWAuXG4gICAqIEB0aHJvd3MgV2hlbiB0aGUgYG5vdEZvdW5kVmFsdWVgIGlzIGB1bmRlZmluZWRgIG9yIGBJbmplY3Rvci5USFJPV19JRl9OT1RfRk9VTkRgLlxuICAgKiBAZGVwcmVjYXRlZCB1c2Ugb2JqZWN0LWJhc2VkIGZsYWdzIChgSW5qZWN0T3B0aW9uc2ApIGluc3RlYWQuXG4gICAqL1xuICBhYnN0cmFjdCBnZXQ8VD4odG9rZW46IFByb3ZpZGVyVG9rZW48VD4sIG5vdEZvdW5kVmFsdWU/OiBULCBmbGFncz86IEluamVjdEZsYWdzKTogVDtcbiAgLyoqXG4gICAqIEBkZXByZWNhdGVkIGZyb20gdjQuMC4wIHVzZSBQcm92aWRlclRva2VuPFQ+XG4gICAqIEBzdXBwcmVzcyB7ZHVwbGljYXRlfVxuICAgKi9cbiAgYWJzdHJhY3QgZ2V0KHRva2VuOiBhbnksIG5vdEZvdW5kVmFsdWU/OiBhbnkpOiBhbnk7XG5cbiAgLyoqXG4gICAqIFJ1bnMgdGhlIGdpdmVuIGZ1bmN0aW9uIGluIHRoZSBjb250ZXh0IG9mIHRoaXMgYEVudmlyb25tZW50SW5qZWN0b3JgLlxuICAgKlxuICAgKiBXaXRoaW4gdGhlIGZ1bmN0aW9uJ3Mgc3RhY2sgZnJhbWUsIGBpbmplY3RgIGNhbiBiZSB1c2VkIHRvIGluamVjdCBkZXBlbmRlbmNpZXMgZnJvbSB0aGlzXG4gICAqIGluamVjdG9yLiBOb3RlIHRoYXQgYGluamVjdGAgaXMgb25seSB1c2FibGUgc3luY2hyb25vdXNseSwgYW5kIGNhbm5vdCBiZSB1c2VkIGluIGFueVxuICAgKiBhc3luY2hyb25vdXMgY2FsbGJhY2tzIG9yIGFmdGVyIGFueSBgYXdhaXRgIHBvaW50cy5cbiAgICpcbiAgICogQHBhcmFtIGZuIHRoZSBjbG9zdXJlIHRvIGJlIHJ1biBpbiB0aGUgY29udGV4dCBvZiB0aGlzIGluamVjdG9yXG4gICAqIEByZXR1cm5zIHRoZSByZXR1cm4gdmFsdWUgb2YgdGhlIGZ1bmN0aW9uLCBpZiBhbnlcbiAgICogQGRlcHJlY2F0ZWQgdXNlIHRoZSBzdGFuZGFsb25lIGZ1bmN0aW9uIGBydW5JbkluamVjdGlvbkNvbnRleHRgIGluc3RlYWRcbiAgICovXG4gIGFic3RyYWN0IHJ1bkluQ29udGV4dDxSZXR1cm5UPihmbjogKCkgPT4gUmV0dXJuVCk6IFJldHVyblQ7XG5cbiAgYWJzdHJhY3QgZGVzdHJveSgpOiB2b2lkO1xuXG4gIC8qKlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIGFic3RyYWN0IG9uRGVzdHJveShjYWxsYmFjazogKCkgPT4gdm9pZCk6ICgpID0+IHZvaWQ7XG59XG5cbmV4cG9ydCBjbGFzcyBSM0luamVjdG9yIGV4dGVuZHMgRW52aXJvbm1lbnRJbmplY3RvciB7XG4gIC8qKlxuICAgKiBNYXAgb2YgdG9rZW5zIHRvIHJlY29yZHMgd2hpY2ggY29udGFpbiB0aGUgaW5zdGFuY2VzIG9mIHRob3NlIHRva2Vucy5cbiAgICogLSBgbnVsbGAgdmFsdWUgaW1wbGllcyB0aGF0IHdlIGRvbid0IGhhdmUgdGhlIHJlY29yZC4gVXNlZCBieSB0cmVlLXNoYWthYmxlIGluamVjdG9yc1xuICAgKiB0byBwcmV2ZW50IGZ1cnRoZXIgc2VhcmNoZXMuXG4gICAqL1xuICBwcml2YXRlIHJlY29yZHMgPSBuZXcgTWFwPFByb3ZpZGVyVG9rZW48YW55PiwgUmVjb3JkPGFueT58bnVsbD4oKTtcblxuICAvKipcbiAgICogU2V0IG9mIHZhbHVlcyBpbnN0YW50aWF0ZWQgYnkgdGhpcyBpbmplY3RvciB3aGljaCBjb250YWluIGBuZ09uRGVzdHJveWAgbGlmZWN5Y2xlIGhvb2tzLlxuICAgKi9cbiAgcHJpdmF0ZSBfbmdPbkRlc3Ryb3lIb29rcyA9IG5ldyBTZXQ8T25EZXN0cm95PigpO1xuXG4gIHByaXZhdGUgX29uRGVzdHJveUhvb2tzOiBBcnJheTwoKSA9PiB2b2lkPiA9IFtdO1xuXG4gIC8qKlxuICAgKiBGbGFnIGluZGljYXRpbmcgdGhhdCB0aGlzIGluamVjdG9yIHdhcyBwcmV2aW91c2x5IGRlc3Ryb3llZC5cbiAgICovXG4gIGdldCBkZXN0cm95ZWQoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuX2Rlc3Ryb3llZDtcbiAgfVxuICBwcml2YXRlIF9kZXN0cm95ZWQgPSBmYWxzZTtcblxuICBwcml2YXRlIGluamVjdG9yRGVmVHlwZXM6IFNldDxUeXBlPHVua25vd24+PjtcblxuICBjb25zdHJ1Y3RvcihcbiAgICAgIHByb3ZpZGVyczogQXJyYXk8UHJvdmlkZXJ8RW52aXJvbm1lbnRQcm92aWRlcnM+LCByZWFkb25seSBwYXJlbnQ6IEluamVjdG9yLFxuICAgICAgcmVhZG9ubHkgc291cmNlOiBzdHJpbmd8bnVsbCwgcmVhZG9ubHkgc2NvcGVzOiBTZXQ8SW5qZWN0b3JTY29wZT4pIHtcbiAgICBzdXBlcigpO1xuICAgIC8vIFN0YXJ0IG9mZiBieSBjcmVhdGluZyBSZWNvcmRzIGZvciBldmVyeSBwcm92aWRlci5cbiAgICBmb3JFYWNoU2luZ2xlUHJvdmlkZXIoXG4gICAgICAgIHByb3ZpZGVycyBhcyBBcnJheTxQcm92aWRlcnxJbnRlcm5hbEVudmlyb25tZW50UHJvdmlkZXJzPixcbiAgICAgICAgcHJvdmlkZXIgPT4gdGhpcy5wcm9jZXNzUHJvdmlkZXIocHJvdmlkZXIpKTtcblxuICAgIC8vIE1ha2Ugc3VyZSB0aGUgSU5KRUNUT1IgdG9rZW4gcHJvdmlkZXMgdGhpcyBpbmplY3Rvci5cbiAgICB0aGlzLnJlY29yZHMuc2V0KElOSkVDVE9SLCBtYWtlUmVjb3JkKHVuZGVmaW5lZCwgdGhpcykpO1xuXG4gICAgLy8gQW5kIGBFbnZpcm9ubWVudEluamVjdG9yYCBpZiB0aGUgY3VycmVudCBpbmplY3RvciBpcyBzdXBwb3NlZCB0byBiZSBlbnYtc2NvcGVkLlxuICAgIGlmIChzY29wZXMuaGFzKCdlbnZpcm9ubWVudCcpKSB7XG4gICAgICB0aGlzLnJlY29yZHMuc2V0KEVudmlyb25tZW50SW5qZWN0b3IsIG1ha2VSZWNvcmQodW5kZWZpbmVkLCB0aGlzKSk7XG4gICAgfVxuXG4gICAgLy8gRGV0ZWN0IHdoZXRoZXIgdGhpcyBpbmplY3RvciBoYXMgdGhlIEFQUF9ST09UX1NDT1BFIHRva2VuIGFuZCB0aHVzIHNob3VsZCBwcm92aWRlXG4gICAgLy8gYW55IGluamVjdGFibGUgc2NvcGVkIHRvIEFQUF9ST09UX1NDT1BFLlxuICAgIGNvbnN0IHJlY29yZCA9IHRoaXMucmVjb3Jkcy5nZXQoSU5KRUNUT1JfU0NPUEUpIGFzIFJlY29yZDxJbmplY3RvclNjb3BlfG51bGw+O1xuICAgIGlmIChyZWNvcmQgIT0gbnVsbCAmJiB0eXBlb2YgcmVjb3JkLnZhbHVlID09PSAnc3RyaW5nJykge1xuICAgICAgdGhpcy5zY29wZXMuYWRkKHJlY29yZC52YWx1ZSBhcyBJbmplY3RvclNjb3BlKTtcbiAgICB9XG5cbiAgICB0aGlzLmluamVjdG9yRGVmVHlwZXMgPVxuICAgICAgICBuZXcgU2V0KHRoaXMuZ2V0KElOSkVDVE9SX0RFRl9UWVBFUy5tdWx0aSwgRU1QVFlfQVJSQVksIEluamVjdEZsYWdzLlNlbGYpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZXN0cm95IHRoZSBpbmplY3RvciBhbmQgcmVsZWFzZSByZWZlcmVuY2VzIHRvIGV2ZXJ5IGluc3RhbmNlIG9yIHByb3ZpZGVyIGFzc29jaWF0ZWQgd2l0aCBpdC5cbiAgICpcbiAgICogQWxzbyBjYWxscyB0aGUgYE9uRGVzdHJveWAgbGlmZWN5Y2xlIGhvb2tzIG9mIGV2ZXJ5IGluc3RhbmNlIHRoYXQgd2FzIGNyZWF0ZWQgZm9yIHdoaWNoIGFcbiAgICogaG9vayB3YXMgZm91bmQuXG4gICAqL1xuICBvdmVycmlkZSBkZXN0cm95KCk6IHZvaWQge1xuICAgIHRoaXMuYXNzZXJ0Tm90RGVzdHJveWVkKCk7XG5cbiAgICAvLyBTZXQgZGVzdHJveWVkID0gdHJ1ZSBmaXJzdCwgaW4gY2FzZSBsaWZlY3ljbGUgaG9va3MgcmUtZW50ZXIgZGVzdHJveSgpLlxuICAgIHRoaXMuX2Rlc3Ryb3llZCA9IHRydWU7XG4gICAgdHJ5IHtcbiAgICAgIC8vIENhbGwgYWxsIHRoZSBsaWZlY3ljbGUgaG9va3MuXG4gICAgICBmb3IgKGNvbnN0IHNlcnZpY2Ugb2YgdGhpcy5fbmdPbkRlc3Ryb3lIb29rcykge1xuICAgICAgICBzZXJ2aWNlLm5nT25EZXN0cm95KCk7XG4gICAgICB9XG4gICAgICBjb25zdCBvbkRlc3Ryb3lIb29rcyA9IHRoaXMuX29uRGVzdHJveUhvb2tzO1xuICAgICAgLy8gUmVzZXQgdGhlIF9vbkRlc3Ryb3lIb29rcyBhcnJheSBiZWZvcmUgaXRlcmF0aW5nIG92ZXIgaXQgdG8gcHJldmVudCBob29rcyB0aGF0IHVucmVnaXN0ZXJcbiAgICAgIC8vIHRoZW1zZWx2ZXMgZnJvbSBtdXRhdGluZyB0aGUgYXJyYXkgZHVyaW5nIGl0ZXJhdGlvbi5cbiAgICAgIHRoaXMuX29uRGVzdHJveUhvb2tzID0gW107XG4gICAgICBmb3IgKGNvbnN0IGhvb2sgb2Ygb25EZXN0cm95SG9va3MpIHtcbiAgICAgICAgaG9vaygpO1xuICAgICAgfVxuICAgIH0gZmluYWxseSB7XG4gICAgICAvLyBSZWxlYXNlIGFsbCByZWZlcmVuY2VzLlxuICAgICAgdGhpcy5yZWNvcmRzLmNsZWFyKCk7XG4gICAgICB0aGlzLl9uZ09uRGVzdHJveUhvb2tzLmNsZWFyKCk7XG4gICAgICB0aGlzLmluamVjdG9yRGVmVHlwZXMuY2xlYXIoKTtcbiAgICB9XG4gIH1cblxuICBvdmVycmlkZSBvbkRlc3Ryb3koY2FsbGJhY2s6ICgpID0+IHZvaWQpOiAoKSA9PiB2b2lkIHtcbiAgICB0aGlzLmFzc2VydE5vdERlc3Ryb3llZCgpO1xuICAgIHRoaXMuX29uRGVzdHJveUhvb2tzLnB1c2goY2FsbGJhY2spO1xuICAgIHJldHVybiAoKSA9PiB0aGlzLnJlbW92ZU9uRGVzdHJveShjYWxsYmFjayk7XG4gIH1cblxuICBvdmVycmlkZSBydW5JbkNvbnRleHQ8UmV0dXJuVD4oZm46ICgpID0+IFJldHVyblQpOiBSZXR1cm5UIHtcbiAgICB0aGlzLmFzc2VydE5vdERlc3Ryb3llZCgpO1xuXG4gICAgY29uc3QgcHJldmlvdXNJbmplY3RvciA9IHNldEN1cnJlbnRJbmplY3Rvcih0aGlzKTtcbiAgICBjb25zdCBwcmV2aW91c0luamVjdEltcGxlbWVudGF0aW9uID0gc2V0SW5qZWN0SW1wbGVtZW50YXRpb24odW5kZWZpbmVkKTtcbiAgICB0cnkge1xuICAgICAgcmV0dXJuIGZuKCk7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIHNldEN1cnJlbnRJbmplY3RvcihwcmV2aW91c0luamVjdG9yKTtcbiAgICAgIHNldEluamVjdEltcGxlbWVudGF0aW9uKHByZXZpb3VzSW5qZWN0SW1wbGVtZW50YXRpb24pO1xuICAgIH1cbiAgfVxuXG4gIG92ZXJyaWRlIGdldDxUPihcbiAgICAgIHRva2VuOiBQcm92aWRlclRva2VuPFQ+LCBub3RGb3VuZFZhbHVlOiBhbnkgPSBUSFJPV19JRl9OT1RfRk9VTkQsXG4gICAgICBmbGFnczogSW5qZWN0RmxhZ3N8SW5qZWN0T3B0aW9ucyA9IEluamVjdEZsYWdzLkRlZmF1bHQpOiBUIHtcbiAgICB0aGlzLmFzc2VydE5vdERlc3Ryb3llZCgpO1xuXG4gICAgaWYgKHRva2VuLmhhc093blByb3BlcnR5KE5HX0VOVl9JRCkpIHtcbiAgICAgIHJldHVybiAodG9rZW4gYXMgYW55KVtOR19FTlZfSURdKHRoaXMpO1xuICAgIH1cblxuICAgIGZsYWdzID0gY29udmVydFRvQml0RmxhZ3MoZmxhZ3MpIGFzIEluamVjdEZsYWdzO1xuXG4gICAgLy8gU2V0IHRoZSBpbmplY3Rpb24gY29udGV4dC5cbiAgICBjb25zdCBwcmV2aW91c0luamVjdG9yID0gc2V0Q3VycmVudEluamVjdG9yKHRoaXMpO1xuICAgIGNvbnN0IHByZXZpb3VzSW5qZWN0SW1wbGVtZW50YXRpb24gPSBzZXRJbmplY3RJbXBsZW1lbnRhdGlvbih1bmRlZmluZWQpO1xuICAgIHRyeSB7XG4gICAgICAvLyBDaGVjayBmb3IgdGhlIFNraXBTZWxmIGZsYWcuXG4gICAgICBpZiAoIShmbGFncyAmIEluamVjdEZsYWdzLlNraXBTZWxmKSkge1xuICAgICAgICAvLyBTa2lwU2VsZiBpc24ndCBzZXQsIGNoZWNrIGlmIHRoZSByZWNvcmQgYmVsb25ncyB0byB0aGlzIGluamVjdG9yLlxuICAgICAgICBsZXQgcmVjb3JkOiBSZWNvcmQ8VD58dW5kZWZpbmVkfG51bGwgPSB0aGlzLnJlY29yZHMuZ2V0KHRva2VuKTtcbiAgICAgICAgaWYgKHJlY29yZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgLy8gTm8gcmVjb3JkLCBidXQgbWF5YmUgdGhlIHRva2VuIGlzIHNjb3BlZCB0byB0aGlzIGluamVjdG9yLiBMb29rIGZvciBhbiBpbmplY3RhYmxlXG4gICAgICAgICAgLy8gZGVmIHdpdGggYSBzY29wZSBtYXRjaGluZyB0aGlzIGluamVjdG9yLlxuICAgICAgICAgIGNvbnN0IGRlZiA9IGNvdWxkQmVJbmplY3RhYmxlVHlwZSh0b2tlbikgJiYgZ2V0SW5qZWN0YWJsZURlZih0b2tlbik7XG4gICAgICAgICAgaWYgKGRlZiAmJiB0aGlzLmluamVjdGFibGVEZWZJblNjb3BlKGRlZikpIHtcbiAgICAgICAgICAgIC8vIEZvdW5kIGFuIGluamVjdGFibGUgZGVmIGFuZCBpdCdzIHNjb3BlZCB0byB0aGlzIGluamVjdG9yLiBQcmV0ZW5kIGFzIGlmIGl0IHdhcyBoZXJlXG4gICAgICAgICAgICAvLyBhbGwgYWxvbmcuXG4gICAgICAgICAgICByZWNvcmQgPSBtYWtlUmVjb3JkKGluamVjdGFibGVEZWZPckluamVjdG9yRGVmRmFjdG9yeSh0b2tlbiksIE5PVF9ZRVQpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZWNvcmQgPSBudWxsO1xuICAgICAgICAgIH1cbiAgICAgICAgICB0aGlzLnJlY29yZHMuc2V0KHRva2VuLCByZWNvcmQpO1xuICAgICAgICB9XG4gICAgICAgIC8vIElmIGEgcmVjb3JkIHdhcyBmb3VuZCwgZ2V0IHRoZSBpbnN0YW5jZSBmb3IgaXQgYW5kIHJldHVybiBpdC5cbiAgICAgICAgaWYgKHJlY29yZCAhPSBudWxsIC8qIE5PVCBudWxsIHx8IHVuZGVmaW5lZCAqLykge1xuICAgICAgICAgIHJldHVybiB0aGlzLmh5ZHJhdGUodG9rZW4sIHJlY29yZCk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gU2VsZWN0IHRoZSBuZXh0IGluamVjdG9yIGJhc2VkIG9uIHRoZSBTZWxmIGZsYWcgLSBpZiBzZWxmIGlzIHNldCwgdGhlIG5leHQgaW5qZWN0b3IgaXNcbiAgICAgIC8vIHRoZSBOdWxsSW5qZWN0b3IsIG90aGVyd2lzZSBpdCdzIHRoZSBwYXJlbnQuXG4gICAgICBjb25zdCBuZXh0SW5qZWN0b3IgPSAhKGZsYWdzICYgSW5qZWN0RmxhZ3MuU2VsZikgPyB0aGlzLnBhcmVudCA6IGdldE51bGxJbmplY3RvcigpO1xuICAgICAgLy8gU2V0IHRoZSBub3RGb3VuZFZhbHVlIGJhc2VkIG9uIHRoZSBPcHRpb25hbCBmbGFnIC0gaWYgb3B0aW9uYWwgaXMgc2V0IGFuZCBub3RGb3VuZFZhbHVlXG4gICAgICAvLyBpcyB1bmRlZmluZWQsIHRoZSB2YWx1ZSBpcyBudWxsLCBvdGhlcndpc2UgaXQncyB0aGUgbm90Rm91bmRWYWx1ZS5cbiAgICAgIG5vdEZvdW5kVmFsdWUgPSAoZmxhZ3MgJiBJbmplY3RGbGFncy5PcHRpb25hbCkgJiYgbm90Rm91bmRWYWx1ZSA9PT0gVEhST1dfSUZfTk9UX0ZPVU5EID9cbiAgICAgICAgICBudWxsIDpcbiAgICAgICAgICBub3RGb3VuZFZhbHVlO1xuICAgICAgcmV0dXJuIG5leHRJbmplY3Rvci5nZXQodG9rZW4sIG5vdEZvdW5kVmFsdWUpO1xuICAgIH0gY2F0Y2ggKGU6IGFueSkge1xuICAgICAgaWYgKGUubmFtZSA9PT0gJ051bGxJbmplY3RvckVycm9yJykge1xuICAgICAgICBjb25zdCBwYXRoOiBhbnlbXSA9IGVbTkdfVEVNUF9UT0tFTl9QQVRIXSA9IGVbTkdfVEVNUF9UT0tFTl9QQVRIXSB8fCBbXTtcbiAgICAgICAgcGF0aC51bnNoaWZ0KHN0cmluZ2lmeSh0b2tlbikpO1xuICAgICAgICBpZiAocHJldmlvdXNJbmplY3Rvcikge1xuICAgICAgICAgIC8vIFdlIHN0aWxsIGhhdmUgYSBwYXJlbnQgaW5qZWN0b3IsIGtlZXAgdGhyb3dpbmdcbiAgICAgICAgICB0aHJvdyBlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIEZvcm1hdCAmIHRocm93IHRoZSBmaW5hbCBlcnJvciBtZXNzYWdlIHdoZW4gd2UgZG9uJ3QgaGF2ZSBhbnkgcHJldmlvdXMgaW5qZWN0b3JcbiAgICAgICAgICByZXR1cm4gY2F0Y2hJbmplY3RvckVycm9yKGUsIHRva2VuLCAnUjNJbmplY3RvckVycm9yJywgdGhpcy5zb3VyY2UpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyBlO1xuICAgICAgfVxuICAgIH0gZmluYWxseSB7XG4gICAgICAvLyBMYXN0bHksIHJlc3RvcmUgdGhlIHByZXZpb3VzIGluamVjdGlvbiBjb250ZXh0LlxuICAgICAgc2V0SW5qZWN0SW1wbGVtZW50YXRpb24ocHJldmlvdXNJbmplY3RJbXBsZW1lbnRhdGlvbik7XG4gICAgICBzZXRDdXJyZW50SW5qZWN0b3IocHJldmlvdXNJbmplY3Rvcik7XG4gICAgfVxuICB9XG5cbiAgLyoqIEBpbnRlcm5hbCAqL1xuICByZXNvbHZlSW5qZWN0b3JJbml0aWFsaXplcnMoKSB7XG4gICAgY29uc3QgcHJldmlvdXNJbmplY3RvciA9IHNldEN1cnJlbnRJbmplY3Rvcih0aGlzKTtcbiAgICBjb25zdCBwcmV2aW91c0luamVjdEltcGxlbWVudGF0aW9uID0gc2V0SW5qZWN0SW1wbGVtZW50YXRpb24odW5kZWZpbmVkKTtcbiAgICB0cnkge1xuICAgICAgY29uc3QgaW5pdGlhbGl6ZXJzID0gdGhpcy5nZXQoRU5WSVJPTk1FTlRfSU5JVElBTElaRVIubXVsdGksIEVNUFRZX0FSUkFZLCBJbmplY3RGbGFncy5TZWxmKTtcbiAgICAgIGlmIChuZ0Rldk1vZGUgJiYgIUFycmF5LmlzQXJyYXkoaW5pdGlhbGl6ZXJzKSkge1xuICAgICAgICB0aHJvdyBuZXcgUnVudGltZUVycm9yKFxuICAgICAgICAgICAgUnVudGltZUVycm9yQ29kZS5JTlZBTElEX01VTFRJX1BST1ZJREVSLFxuICAgICAgICAgICAgJ1VuZXhwZWN0ZWQgdHlwZSBvZiB0aGUgYEVOVklST05NRU5UX0lOSVRJQUxJWkVSYCB0b2tlbiB2YWx1ZSAnICtcbiAgICAgICAgICAgICAgICBgKGV4cGVjdGVkIGFuIGFycmF5LCBidXQgZ290ICR7dHlwZW9mIGluaXRpYWxpemVyc30pLiBgICtcbiAgICAgICAgICAgICAgICAnUGxlYXNlIGNoZWNrIHRoYXQgdGhlIGBFTlZJUk9OTUVOVF9JTklUSUFMSVpFUmAgdG9rZW4gaXMgY29uZmlndXJlZCBhcyBhICcgK1xuICAgICAgICAgICAgICAgICdgbXVsdGk6IHRydWVgIHByb3ZpZGVyLicpO1xuICAgICAgfVxuICAgICAgZm9yIChjb25zdCBpbml0aWFsaXplciBvZiBpbml0aWFsaXplcnMpIHtcbiAgICAgICAgaW5pdGlhbGl6ZXIoKTtcbiAgICAgIH1cbiAgICB9IGZpbmFsbHkge1xuICAgICAgc2V0Q3VycmVudEluamVjdG9yKHByZXZpb3VzSW5qZWN0b3IpO1xuICAgICAgc2V0SW5qZWN0SW1wbGVtZW50YXRpb24ocHJldmlvdXNJbmplY3RJbXBsZW1lbnRhdGlvbik7XG4gICAgfVxuICB9XG5cbiAgb3ZlcnJpZGUgdG9TdHJpbmcoKSB7XG4gICAgY29uc3QgdG9rZW5zOiBzdHJpbmdbXSA9IFtdO1xuICAgIGNvbnN0IHJlY29yZHMgPSB0aGlzLnJlY29yZHM7XG4gICAgZm9yIChjb25zdCB0b2tlbiBvZiByZWNvcmRzLmtleXMoKSkge1xuICAgICAgdG9rZW5zLnB1c2goc3RyaW5naWZ5KHRva2VuKSk7XG4gICAgfVxuICAgIHJldHVybiBgUjNJbmplY3Rvclske3Rva2Vucy5qb2luKCcsICcpfV1gO1xuICB9XG5cbiAgYXNzZXJ0Tm90RGVzdHJveWVkKCk6IHZvaWQge1xuICAgIGlmICh0aGlzLl9kZXN0cm95ZWQpIHtcbiAgICAgIHRocm93IG5ldyBSdW50aW1lRXJyb3IoXG4gICAgICAgICAgUnVudGltZUVycm9yQ29kZS5JTkpFQ1RPUl9BTFJFQURZX0RFU1RST1lFRCxcbiAgICAgICAgICBuZ0Rldk1vZGUgJiYgJ0luamVjdG9yIGhhcyBhbHJlYWR5IGJlZW4gZGVzdHJveWVkLicpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBQcm9jZXNzIGEgYFNpbmdsZVByb3ZpZGVyYCBhbmQgYWRkIGl0LlxuICAgKi9cbiAgcHJpdmF0ZSBwcm9jZXNzUHJvdmlkZXIocHJvdmlkZXI6IFNpbmdsZVByb3ZpZGVyKTogdm9pZCB7XG4gICAgLy8gRGV0ZXJtaW5lIHRoZSB0b2tlbiBmcm9tIHRoZSBwcm92aWRlci4gRWl0aGVyIGl0J3MgaXRzIG93biB0b2tlbiwgb3IgaGFzIGEge3Byb3ZpZGU6IC4uLn1cbiAgICAvLyBwcm9wZXJ0eS5cbiAgICBwcm92aWRlciA9IHJlc29sdmVGb3J3YXJkUmVmKHByb3ZpZGVyKTtcbiAgICBsZXQgdG9rZW46IGFueSA9XG4gICAgICAgIGlzVHlwZVByb3ZpZGVyKHByb3ZpZGVyKSA/IHByb3ZpZGVyIDogcmVzb2x2ZUZvcndhcmRSZWYocHJvdmlkZXIgJiYgcHJvdmlkZXIucHJvdmlkZSk7XG5cbiAgICAvLyBDb25zdHJ1Y3QgYSBgUmVjb3JkYCBmb3IgdGhlIHByb3ZpZGVyLlxuICAgIGNvbnN0IHJlY29yZCA9IHByb3ZpZGVyVG9SZWNvcmQocHJvdmlkZXIpO1xuXG4gICAgaWYgKCFpc1R5cGVQcm92aWRlcihwcm92aWRlcikgJiYgcHJvdmlkZXIubXVsdGkgPT09IHRydWUpIHtcbiAgICAgIC8vIElmIHRoZSBwcm92aWRlciBpbmRpY2F0ZXMgdGhhdCBpdCdzIGEgbXVsdGktcHJvdmlkZXIsIHByb2Nlc3MgaXQgc3BlY2lhbGx5LlxuICAgICAgLy8gRmlyc3QgY2hlY2sgd2hldGhlciBpdCdzIGJlZW4gZGVmaW5lZCBhbHJlYWR5LlxuICAgICAgbGV0IG11bHRpUmVjb3JkID0gdGhpcy5yZWNvcmRzLmdldCh0b2tlbik7XG4gICAgICBpZiAobXVsdGlSZWNvcmQpIHtcbiAgICAgICAgLy8gSXQgaGFzLiBUaHJvdyBhIG5pY2UgZXJyb3IgaWZcbiAgICAgICAgaWYgKG5nRGV2TW9kZSAmJiBtdWx0aVJlY29yZC5tdWx0aSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgdGhyb3dNaXhlZE11bHRpUHJvdmlkZXJFcnJvcigpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBtdWx0aVJlY29yZCA9IG1ha2VSZWNvcmQodW5kZWZpbmVkLCBOT1RfWUVULCB0cnVlKTtcbiAgICAgICAgbXVsdGlSZWNvcmQuZmFjdG9yeSA9ICgpID0+IGluamVjdEFyZ3MobXVsdGlSZWNvcmQhLm11bHRpISk7XG4gICAgICAgIHRoaXMucmVjb3Jkcy5zZXQodG9rZW4sIG11bHRpUmVjb3JkKTtcbiAgICAgIH1cbiAgICAgIHRva2VuID0gcHJvdmlkZXI7XG4gICAgICBtdWx0aVJlY29yZC5tdWx0aSEucHVzaChwcm92aWRlcik7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IGV4aXN0aW5nID0gdGhpcy5yZWNvcmRzLmdldCh0b2tlbik7XG4gICAgICBpZiAobmdEZXZNb2RlICYmIGV4aXN0aW5nICYmIGV4aXN0aW5nLm11bHRpICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgdGhyb3dNaXhlZE11bHRpUHJvdmlkZXJFcnJvcigpO1xuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLnJlY29yZHMuc2V0KHRva2VuLCByZWNvcmQpO1xuICB9XG5cbiAgcHJpdmF0ZSBoeWRyYXRlPFQ+KHRva2VuOiBQcm92aWRlclRva2VuPFQ+LCByZWNvcmQ6IFJlY29yZDxUPik6IFQge1xuICAgIGlmIChuZ0Rldk1vZGUgJiYgcmVjb3JkLnZhbHVlID09PSBDSVJDVUxBUikge1xuICAgICAgdGhyb3dDeWNsaWNEZXBlbmRlbmN5RXJyb3Ioc3RyaW5naWZ5KHRva2VuKSk7XG4gICAgfSBlbHNlIGlmIChyZWNvcmQudmFsdWUgPT09IE5PVF9ZRVQpIHtcbiAgICAgIHJlY29yZC52YWx1ZSA9IENJUkNVTEFSO1xuICAgICAgcmVjb3JkLnZhbHVlID0gcmVjb3JkLmZhY3RvcnkhKCk7XG4gICAgfVxuICAgIGlmICh0eXBlb2YgcmVjb3JkLnZhbHVlID09PSAnb2JqZWN0JyAmJiByZWNvcmQudmFsdWUgJiYgaGFzT25EZXN0cm95KHJlY29yZC52YWx1ZSkpIHtcbiAgICAgIHRoaXMuX25nT25EZXN0cm95SG9va3MuYWRkKHJlY29yZC52YWx1ZSk7XG4gICAgfVxuICAgIHJldHVybiByZWNvcmQudmFsdWUgYXMgVDtcbiAgfVxuXG4gIHByaXZhdGUgaW5qZWN0YWJsZURlZkluU2NvcGUoZGVmOiDJtcm1SW5qZWN0YWJsZURlY2xhcmF0aW9uPGFueT4pOiBib29sZWFuIHtcbiAgICBpZiAoIWRlZi5wcm92aWRlZEluKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGNvbnN0IHByb3ZpZGVkSW4gPSByZXNvbHZlRm9yd2FyZFJlZihkZWYucHJvdmlkZWRJbik7XG4gICAgaWYgKHR5cGVvZiBwcm92aWRlZEluID09PSAnc3RyaW5nJykge1xuICAgICAgcmV0dXJuIHByb3ZpZGVkSW4gPT09ICdhbnknIHx8ICh0aGlzLnNjb3Blcy5oYXMocHJvdmlkZWRJbikpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gdGhpcy5pbmplY3RvckRlZlR5cGVzLmhhcyhwcm92aWRlZEluKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIHJlbW92ZU9uRGVzdHJveShjYWxsYmFjazogKCkgPT4gdm9pZCk6IHZvaWQge1xuICAgIGNvbnN0IGRlc3Ryb3lDQklkeCA9IHRoaXMuX29uRGVzdHJveUhvb2tzLmluZGV4T2YoY2FsbGJhY2spO1xuICAgIGlmIChkZXN0cm95Q0JJZHggIT09IC0xKSB7XG4gICAgICB0aGlzLl9vbkRlc3Ryb3lIb29rcy5zcGxpY2UoZGVzdHJveUNCSWR4LCAxKTtcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gaW5qZWN0YWJsZURlZk9ySW5qZWN0b3JEZWZGYWN0b3J5KHRva2VuOiBQcm92aWRlclRva2VuPGFueT4pOiBGYWN0b3J5Rm48YW55PiB7XG4gIC8vIE1vc3QgdG9rZW5zIHdpbGwgaGF2ZSBhbiBpbmplY3RhYmxlIGRlZiBkaXJlY3RseSBvbiB0aGVtLCB3aGljaCBzcGVjaWZpZXMgYSBmYWN0b3J5IGRpcmVjdGx5LlxuICBjb25zdCBpbmplY3RhYmxlRGVmID0gZ2V0SW5qZWN0YWJsZURlZih0b2tlbik7XG4gIGNvbnN0IGZhY3RvcnkgPSBpbmplY3RhYmxlRGVmICE9PSBudWxsID8gaW5qZWN0YWJsZURlZi5mYWN0b3J5IDogZ2V0RmFjdG9yeURlZih0b2tlbik7XG5cbiAgaWYgKGZhY3RvcnkgIT09IG51bGwpIHtcbiAgICByZXR1cm4gZmFjdG9yeTtcbiAgfVxuXG4gIC8vIEluamVjdGlvblRva2VucyBzaG91bGQgaGF2ZSBhbiBpbmplY3RhYmxlIGRlZiAoybVwcm92KSBhbmQgdGh1cyBzaG91bGQgYmUgaGFuZGxlZCBhYm92ZS5cbiAgLy8gSWYgaXQncyBtaXNzaW5nIHRoYXQsIGl0J3MgYW4gZXJyb3IuXG4gIGlmICh0b2tlbiBpbnN0YW5jZW9mIEluamVjdGlvblRva2VuKSB7XG4gICAgdGhyb3cgbmV3IFJ1bnRpbWVFcnJvcihcbiAgICAgICAgUnVudGltZUVycm9yQ29kZS5JTlZBTElEX0lOSkVDVElPTl9UT0tFTixcbiAgICAgICAgbmdEZXZNb2RlICYmIGBUb2tlbiAke3N0cmluZ2lmeSh0b2tlbil9IGlzIG1pc3NpbmcgYSDJtXByb3YgZGVmaW5pdGlvbi5gKTtcbiAgfVxuXG4gIC8vIFVuZGVjb3JhdGVkIHR5cGVzIGNhbiBzb21ldGltZXMgYmUgY3JlYXRlZCBpZiB0aGV5IGhhdmUgbm8gY29uc3RydWN0b3IgYXJndW1lbnRzLlxuICBpZiAodG9rZW4gaW5zdGFuY2VvZiBGdW5jdGlvbikge1xuICAgIHJldHVybiBnZXRVbmRlY29yYXRlZEluamVjdGFibGVGYWN0b3J5KHRva2VuKTtcbiAgfVxuXG4gIC8vIFRoZXJlIHdhcyBubyB3YXkgdG8gcmVzb2x2ZSBhIGZhY3RvcnkgZm9yIHRoaXMgdG9rZW4uXG4gIHRocm93IG5ldyBSdW50aW1lRXJyb3IoUnVudGltZUVycm9yQ29kZS5JTlZBTElEX0lOSkVDVElPTl9UT0tFTiwgbmdEZXZNb2RlICYmICd1bnJlYWNoYWJsZScpO1xufVxuXG5mdW5jdGlvbiBnZXRVbmRlY29yYXRlZEluamVjdGFibGVGYWN0b3J5KHRva2VuOiBGdW5jdGlvbikge1xuICAvLyBJZiB0aGUgdG9rZW4gaGFzIHBhcmFtZXRlcnMgdGhlbiBpdCBoYXMgZGVwZW5kZW5jaWVzIHRoYXQgd2UgY2Fubm90IHJlc29sdmUgaW1wbGljaXRseS5cbiAgY29uc3QgcGFyYW1MZW5ndGggPSB0b2tlbi5sZW5ndGg7XG4gIGlmIChwYXJhbUxlbmd0aCA+IDApIHtcbiAgICBjb25zdCBhcmdzOiBzdHJpbmdbXSA9IG5ld0FycmF5KHBhcmFtTGVuZ3RoLCAnPycpO1xuICAgIHRocm93IG5ldyBSdW50aW1lRXJyb3IoXG4gICAgICAgIFJ1bnRpbWVFcnJvckNvZGUuSU5WQUxJRF9JTkpFQ1RJT05fVE9LRU4sXG4gICAgICAgIG5nRGV2TW9kZSAmJiBgQ2FuJ3QgcmVzb2x2ZSBhbGwgcGFyYW1ldGVycyBmb3IgJHtzdHJpbmdpZnkodG9rZW4pfTogKCR7YXJncy5qb2luKCcsICcpfSkuYCk7XG4gIH1cblxuICAvLyBUaGUgY29uc3RydWN0b3IgZnVuY3Rpb24gYXBwZWFycyB0byBoYXZlIG5vIHBhcmFtZXRlcnMuXG4gIC8vIFRoaXMgbWlnaHQgYmUgYmVjYXVzZSBpdCBpbmhlcml0cyBmcm9tIGEgc3VwZXItY2xhc3MuIEluIHdoaWNoIGNhc2UsIHVzZSBhbiBpbmplY3RhYmxlXG4gIC8vIGRlZiBmcm9tIGFuIGFuY2VzdG9yIGlmIHRoZXJlIGlzIG9uZS5cbiAgLy8gT3RoZXJ3aXNlIHRoaXMgcmVhbGx5IGlzIGEgc2ltcGxlIGNsYXNzIHdpdGggbm8gZGVwZW5kZW5jaWVzLCBzbyByZXR1cm4gYSBmYWN0b3J5IHRoYXRcbiAgLy8ganVzdCBpbnN0YW50aWF0ZXMgdGhlIHplcm8tYXJnIGNvbnN0cnVjdG9yLlxuICBjb25zdCBpbmhlcml0ZWRJbmplY3RhYmxlRGVmID0gZ2V0SW5oZXJpdGVkSW5qZWN0YWJsZURlZih0b2tlbik7XG4gIGlmIChpbmhlcml0ZWRJbmplY3RhYmxlRGVmICE9PSBudWxsKSB7XG4gICAgcmV0dXJuICgpID0+IGluaGVyaXRlZEluamVjdGFibGVEZWYuZmFjdG9yeSh0b2tlbiBhcyBUeXBlPGFueT4pO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiAoKSA9PiBuZXcgKHRva2VuIGFzIFR5cGU8YW55PikoKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBwcm92aWRlclRvUmVjb3JkKHByb3ZpZGVyOiBTaW5nbGVQcm92aWRlcik6IFJlY29yZDxhbnk+IHtcbiAgaWYgKGlzVmFsdWVQcm92aWRlcihwcm92aWRlcikpIHtcbiAgICByZXR1cm4gbWFrZVJlY29yZCh1bmRlZmluZWQsIHByb3ZpZGVyLnVzZVZhbHVlKTtcbiAgfSBlbHNlIHtcbiAgICBjb25zdCBmYWN0b3J5OiAoKCkgPT4gYW55KXx1bmRlZmluZWQgPSBwcm92aWRlclRvRmFjdG9yeShwcm92aWRlcik7XG4gICAgcmV0dXJuIG1ha2VSZWNvcmQoZmFjdG9yeSwgTk9UX1lFVCk7XG4gIH1cbn1cblxuLyoqXG4gKiBDb252ZXJ0cyBhIGBTaW5nbGVQcm92aWRlcmAgaW50byBhIGZhY3RvcnkgZnVuY3Rpb24uXG4gKlxuICogQHBhcmFtIHByb3ZpZGVyIHByb3ZpZGVyIHRvIGNvbnZlcnQgdG8gZmFjdG9yeVxuICovXG5leHBvcnQgZnVuY3Rpb24gcHJvdmlkZXJUb0ZhY3RvcnkoXG4gICAgcHJvdmlkZXI6IFNpbmdsZVByb3ZpZGVyLCBuZ01vZHVsZVR5cGU/OiBJbmplY3RvclR5cGU8YW55PiwgcHJvdmlkZXJzPzogYW55W10pOiAoKSA9PiBhbnkge1xuICBsZXQgZmFjdG9yeTogKCgpID0+IGFueSl8dW5kZWZpbmVkID0gdW5kZWZpbmVkO1xuICBpZiAobmdEZXZNb2RlICYmIGlzRW52aXJvbm1lbnRQcm92aWRlcnMocHJvdmlkZXIpKSB7XG4gICAgdGhyb3dJbnZhbGlkUHJvdmlkZXJFcnJvcih1bmRlZmluZWQsIHByb3ZpZGVycywgcHJvdmlkZXIpO1xuICB9XG5cbiAgaWYgKGlzVHlwZVByb3ZpZGVyKHByb3ZpZGVyKSkge1xuICAgIGNvbnN0IHVud3JhcHBlZFByb3ZpZGVyID0gcmVzb2x2ZUZvcndhcmRSZWYocHJvdmlkZXIpO1xuICAgIHJldHVybiBnZXRGYWN0b3J5RGVmKHVud3JhcHBlZFByb3ZpZGVyKSB8fCBpbmplY3RhYmxlRGVmT3JJbmplY3RvckRlZkZhY3RvcnkodW53cmFwcGVkUHJvdmlkZXIpO1xuICB9IGVsc2Uge1xuICAgIGlmIChpc1ZhbHVlUHJvdmlkZXIocHJvdmlkZXIpKSB7XG4gICAgICBmYWN0b3J5ID0gKCkgPT4gcmVzb2x2ZUZvcndhcmRSZWYocHJvdmlkZXIudXNlVmFsdWUpO1xuICAgIH0gZWxzZSBpZiAoaXNGYWN0b3J5UHJvdmlkZXIocHJvdmlkZXIpKSB7XG4gICAgICBmYWN0b3J5ID0gKCkgPT4gcHJvdmlkZXIudXNlRmFjdG9yeSguLi5pbmplY3RBcmdzKHByb3ZpZGVyLmRlcHMgfHwgW10pKTtcbiAgICB9IGVsc2UgaWYgKGlzRXhpc3RpbmdQcm92aWRlcihwcm92aWRlcikpIHtcbiAgICAgIGZhY3RvcnkgPSAoKSA9PiDJtcm1aW5qZWN0KHJlc29sdmVGb3J3YXJkUmVmKHByb3ZpZGVyLnVzZUV4aXN0aW5nKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IGNsYXNzUmVmID0gcmVzb2x2ZUZvcndhcmRSZWYoXG4gICAgICAgICAgcHJvdmlkZXIgJiZcbiAgICAgICAgICAoKHByb3ZpZGVyIGFzIFN0YXRpY0NsYXNzUHJvdmlkZXIgfCBDbGFzc1Byb3ZpZGVyKS51c2VDbGFzcyB8fCBwcm92aWRlci5wcm92aWRlKSk7XG4gICAgICBpZiAobmdEZXZNb2RlICYmICFjbGFzc1JlZikge1xuICAgICAgICB0aHJvd0ludmFsaWRQcm92aWRlckVycm9yKG5nTW9kdWxlVHlwZSwgcHJvdmlkZXJzLCBwcm92aWRlcik7XG4gICAgICB9XG4gICAgICBpZiAoaGFzRGVwcyhwcm92aWRlcikpIHtcbiAgICAgICAgZmFjdG9yeSA9ICgpID0+IG5ldyAoY2xhc3NSZWYpKC4uLmluamVjdEFyZ3MocHJvdmlkZXIuZGVwcykpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGdldEZhY3RvcnlEZWYoY2xhc3NSZWYpIHx8IGluamVjdGFibGVEZWZPckluamVjdG9yRGVmRmFjdG9yeShjbGFzc1JlZik7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiBmYWN0b3J5O1xufVxuXG5mdW5jdGlvbiBtYWtlUmVjb3JkPFQ+KFxuICAgIGZhY3Rvcnk6ICgoKSA9PiBUKXx1bmRlZmluZWQsIHZhbHVlOiBUfHt9LCBtdWx0aTogYm9vbGVhbiA9IGZhbHNlKTogUmVjb3JkPFQ+IHtcbiAgcmV0dXJuIHtcbiAgICBmYWN0b3J5OiBmYWN0b3J5LFxuICAgIHZhbHVlOiB2YWx1ZSxcbiAgICBtdWx0aTogbXVsdGkgPyBbXSA6IHVuZGVmaW5lZCxcbiAgfTtcbn1cblxuZnVuY3Rpb24gaGFzRGVwcyh2YWx1ZTogQ2xhc3NQcm92aWRlcnxDb25zdHJ1Y3RvclByb3ZpZGVyfFxuICAgICAgICAgICAgICAgICBTdGF0aWNDbGFzc1Byb3ZpZGVyKTogdmFsdWUgaXMgQ2xhc3NQcm92aWRlciZ7ZGVwczogYW55W119IHtcbiAgcmV0dXJuICEhKHZhbHVlIGFzIGFueSkuZGVwcztcbn1cblxuZnVuY3Rpb24gaGFzT25EZXN0cm95KHZhbHVlOiBhbnkpOiB2YWx1ZSBpcyBPbkRlc3Ryb3kge1xuICByZXR1cm4gdmFsdWUgIT09IG51bGwgJiYgdHlwZW9mIHZhbHVlID09PSAnb2JqZWN0JyAmJlxuICAgICAgdHlwZW9mICh2YWx1ZSBhcyBPbkRlc3Ryb3kpLm5nT25EZXN0cm95ID09PSAnZnVuY3Rpb24nO1xufVxuXG5mdW5jdGlvbiBjb3VsZEJlSW5qZWN0YWJsZVR5cGUodmFsdWU6IGFueSk6IHZhbHVlIGlzIFByb3ZpZGVyVG9rZW48YW55PiB7XG4gIHJldHVybiAodHlwZW9mIHZhbHVlID09PSAnZnVuY3Rpb24nKSB8fFxuICAgICAgKHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcgJiYgdmFsdWUgaW5zdGFuY2VvZiBJbmplY3Rpb25Ub2tlbik7XG59XG5cbmZ1bmN0aW9uIGZvckVhY2hTaW5nbGVQcm92aWRlcihcbiAgICBwcm92aWRlcnM6IEFycmF5PFByb3ZpZGVyfEVudmlyb25tZW50UHJvdmlkZXJzPiwgZm46IChwcm92aWRlcjogU2luZ2xlUHJvdmlkZXIpID0+IHZvaWQpOiB2b2lkIHtcbiAgZm9yIChjb25zdCBwcm92aWRlciBvZiBwcm92aWRlcnMpIHtcbiAgICBpZiAoQXJyYXkuaXNBcnJheShwcm92aWRlcikpIHtcbiAgICAgIGZvckVhY2hTaW5nbGVQcm92aWRlcihwcm92aWRlciwgZm4pO1xuICAgIH0gZWxzZSBpZiAocHJvdmlkZXIgJiYgaXNFbnZpcm9ubWVudFByb3ZpZGVycyhwcm92aWRlcikpIHtcbiAgICAgIGZvckVhY2hTaW5nbGVQcm92aWRlcihwcm92aWRlci7JtXByb3ZpZGVycywgZm4pO1xuICAgIH0gZWxzZSB7XG4gICAgICBmbihwcm92aWRlciBhcyBTaW5nbGVQcm92aWRlcik7XG4gICAgfVxuICB9XG59XG4iXX0=