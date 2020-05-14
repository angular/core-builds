/**
 * @fileoverview added by tsickle
 * Generated from: packages/core/src/di/injector.ts
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { stringify } from '../util/stringify';
import { resolveForwardRef } from './forward_ref';
import { catchInjectorError, formatError, INJECTOR, NG_TEMP_TOKEN_PATH, NullInjector, setCurrentInjector, THROW_IF_NOT_FOUND, USE_VALUE, ɵɵinject } from './injector_compatibility';
import { getInjectableDef, ɵɵdefineInjectable } from './interface/defs';
import { InjectFlags } from './interface/injector';
import { Inject, Optional, Self, SkipSelf } from './metadata';
import { createInjector } from './r3_injector';
import { INJECTOR_SCOPE } from './scope';
/**
 * @param {?} providers
 * @param {?} parent
 * @param {?} name
 * @return {?}
 */
export function INJECTOR_IMPL__PRE_R3__(providers, parent, name) {
    return new StaticInjector(providers, parent, name);
}
/**
 * @param {?} providers
 * @param {?} parent
 * @param {?} name
 * @return {?}
 */
export function INJECTOR_IMPL__POST_R3__(providers, parent, name) {
    return createInjector({ name: name }, parent, providers, name);
}
/** @type {?} */
export const INJECTOR_IMPL = INJECTOR_IMPL__POST_R3__;
/**
 * Concrete injectors implement this interface. Injectors are configured
 * with [providers](guide/glossary#provider) that associate
 * dependencies of various types with [injection tokens](guide/glossary#di-token).
 *
 * @see ["DI Providers"](guide/dependency-injection-providers).
 * @see `StaticProvider`
 *
 * \@usageNotes
 *
 *  The following example creates a service injector instance.
 *
 * {\@example core/di/ts/provider_spec.ts region='ConstructorProvider'}
 *
 * ### Usage example
 *
 * {\@example core/di/ts/injector_spec.ts region='Injector'}
 *
 * `Injector` returns itself when given `Injector` as a token:
 *
 * {\@example core/di/ts/injector_spec.ts region='injectInjector'}
 *
 * \@publicApi
 * @abstract
 */
let Injector = /** @class */ (() => {
    /**
     * Concrete injectors implement this interface. Injectors are configured
     * with [providers](guide/glossary#provider) that associate
     * dependencies of various types with [injection tokens](guide/glossary#di-token).
     *
     * @see ["DI Providers"](guide/dependency-injection-providers).
     * @see `StaticProvider`
     *
     * \@usageNotes
     *
     *  The following example creates a service injector instance.
     *
     * {\@example core/di/ts/provider_spec.ts region='ConstructorProvider'}
     *
     * ### Usage example
     *
     * {\@example core/di/ts/injector_spec.ts region='Injector'}
     *
     * `Injector` returns itself when given `Injector` as a token:
     *
     * {\@example core/di/ts/injector_spec.ts region='injectInjector'}
     *
     * \@publicApi
     * @abstract
     */
    class Injector {
        /**
         * @param {?} options
         * @param {?=} parent
         * @return {?}
         */
        static create(options, parent) {
            if (Array.isArray(options)) {
                return INJECTOR_IMPL(options, parent, '');
            }
            else {
                return INJECTOR_IMPL(options.providers, options.parent, options.name || '');
            }
        }
    }
    Injector.THROW_IF_NOT_FOUND = THROW_IF_NOT_FOUND;
    Injector.NULL = new NullInjector();
    /** @nocollapse */
    Injector.ɵprov = ɵɵdefineInjectable({
        token: Injector,
        providedIn: (/** @type {?} */ ('any')),
        factory: (/**
         * @return {?}
         */
        () => ɵɵinject(INJECTOR)),
    });
    /**
     * \@internal
     * @nocollapse
     */
    Injector.__NG_ELEMENT_ID__ = -1;
    return Injector;
})();
export { Injector };
if (false) {
    /** @type {?} */
    Injector.THROW_IF_NOT_FOUND;
    /** @type {?} */
    Injector.NULL;
    /**
     * @nocollapse
     * @type {?}
     */
    Injector.ɵprov;
    /**
     * \@internal
     * @nocollapse
     * @type {?}
     */
    Injector.__NG_ELEMENT_ID__;
    /**
     * Retrieves an instance from the injector based on the provided token.
     * @throws When the `notFoundValue` is `undefined` or `Injector.THROW_IF_NOT_FOUND`.
     * @abstract
     * @template T
     * @param {?} token
     * @param {?=} notFoundValue
     * @param {?=} flags
     * @return {?} The instance from the injector if defined, otherwise the `notFoundValue`.
     */
    Injector.prototype.get = function (token, notFoundValue, flags) { };
    /**
     * @deprecated from v4.0.0 use Type<T> or InjectionToken<T>
     * @suppress {duplicate}
     * @abstract
     * @param {?} token
     * @param {?=} notFoundValue
     * @return {?}
     */
    Injector.prototype.get = function (token, notFoundValue) { };
}
/** @type {?} */
const IDENT = (/**
 * @template T
 * @param {?} value
 * @return {?}
 */
function (value) {
    return value;
});
/** @type {?} */
const EMPTY = (/** @type {?} */ ([]));
/** @type {?} */
const CIRCULAR = IDENT;
/** @type {?} */
const MULTI_PROVIDER_FN = (/**
 * @return {?}
 */
function () {
    return Array.prototype.slice.call(arguments);
});
/** @enum {number} */
const OptionFlags = {
    Optional: 1,
    CheckSelf: 2,
    CheckParent: 4,
    Default: 6,
};
/** @type {?} */
const NO_NEW_LINE = 'ɵ';
export class StaticInjector {
    /**
     * @param {?} providers
     * @param {?=} parent
     * @param {?=} source
     */
    constructor(providers, parent = Injector.NULL, source = null) {
        this.parent = parent;
        this.source = source;
        /** @type {?} */
        const records = this._records = new Map();
        records.set(Injector, (/** @type {?} */ ({ token: Injector, fn: IDENT, deps: EMPTY, value: this, useNew: false })));
        records.set(INJECTOR, (/** @type {?} */ ({ token: INJECTOR, fn: IDENT, deps: EMPTY, value: this, useNew: false })));
        this.scope = recursivelyProcessProviders(records, providers);
    }
    /**
     * @param {?} token
     * @param {?=} notFoundValue
     * @param {?=} flags
     * @return {?}
     */
    get(token, notFoundValue, flags = InjectFlags.Default) {
        /** @type {?} */
        const records = this._records;
        /** @type {?} */
        let record = records.get(token);
        if (record === undefined) {
            // This means we have never seen this record, see if it is tree shakable provider.
            /** @type {?} */
            const injectableDef = getInjectableDef(token);
            if (injectableDef) {
                /** @type {?} */
                const providedIn = injectableDef && injectableDef.providedIn;
                if (providedIn === 'any' || providedIn != null && providedIn === this.scope) {
                    records.set(token, record = resolveProvider({ provide: token, useFactory: injectableDef.factory, deps: EMPTY }));
                }
            }
            if (record === undefined) {
                // Set record to null to make sure that we don't go through expensive lookup above again.
                records.set(token, null);
            }
        }
        /** @type {?} */
        let lastInjector = setCurrentInjector(this);
        try {
            return tryResolveToken(token, record, records, this.parent, notFoundValue, flags);
        }
        catch (e) {
            return catchInjectorError(e, token, 'StaticInjectorError', this.source);
        }
        finally {
            setCurrentInjector(lastInjector);
        }
    }
    /**
     * @return {?}
     */
    toString() {
        /** @type {?} */
        const tokens = (/** @type {?} */ ([]));
        /** @type {?} */
        const records = this._records;
        records.forEach((/**
         * @param {?} v
         * @param {?} token
         * @return {?}
         */
        (v, token) => tokens.push(stringify(token))));
        return `StaticInjector[${tokens.join(', ')}]`;
    }
}
if (false) {
    /** @type {?} */
    StaticInjector.prototype.parent;
    /** @type {?} */
    StaticInjector.prototype.source;
    /** @type {?} */
    StaticInjector.prototype.scope;
    /**
     * @type {?}
     * @private
     */
    StaticInjector.prototype._records;
}
/**
 * @record
 */
function Record() { }
if (false) {
    /** @type {?} */
    Record.prototype.fn;
    /** @type {?} */
    Record.prototype.useNew;
    /** @type {?} */
    Record.prototype.deps;
    /** @type {?} */
    Record.prototype.value;
}
/**
 * @record
 */
function DependencyRecord() { }
if (false) {
    /** @type {?} */
    DependencyRecord.prototype.token;
    /** @type {?} */
    DependencyRecord.prototype.options;
}
/**
 * @param {?} provider
 * @return {?}
 */
function resolveProvider(provider) {
    /** @type {?} */
    const deps = computeDeps(provider);
    /** @type {?} */
    let fn = IDENT;
    /** @type {?} */
    let value = EMPTY;
    /** @type {?} */
    let useNew = false;
    /** @type {?} */
    let provide = resolveForwardRef(provider.provide);
    if (USE_VALUE in provider) {
        // We need to use USE_VALUE in provider since provider.useValue could be defined as undefined.
        value = ((/** @type {?} */ (provider))).useValue;
    }
    else if (((/** @type {?} */ (provider))).useFactory) {
        fn = ((/** @type {?} */ (provider))).useFactory;
    }
    else if (((/** @type {?} */ (provider))).useExisting) {
        // Just use IDENT
    }
    else if (((/** @type {?} */ (provider))).useClass) {
        useNew = true;
        fn = resolveForwardRef(((/** @type {?} */ (provider))).useClass);
    }
    else if (typeof provide == 'function') {
        useNew = true;
        fn = provide;
    }
    else {
        throw staticError('StaticProvider does not have [useValue|useFactory|useExisting|useClass] or [provide] is not newable', provider);
    }
    return { deps, fn, useNew, value };
}
/**
 * @param {?} token
 * @return {?}
 */
function multiProviderMixError(token) {
    return staticError('Cannot mix multi providers and regular providers', token);
}
/**
 * @param {?} records
 * @param {?} provider
 * @return {?}
 */
function recursivelyProcessProviders(records, provider) {
    /** @type {?} */
    let scope = null;
    if (provider) {
        provider = resolveForwardRef(provider);
        if (Array.isArray(provider)) {
            // if we have an array recurse into the array
            for (let i = 0; i < provider.length; i++) {
                scope = recursivelyProcessProviders(records, provider[i]) || scope;
            }
        }
        else if (typeof provider === 'function') {
            // Functions were supported in ReflectiveInjector, but are not here. For safety give useful
            // error messages
            throw staticError('Function/Class not supported', provider);
        }
        else if (provider && typeof provider === 'object' && provider.provide) {
            // At this point we have what looks like a provider: {provide: ?, ....}
            /** @type {?} */
            let token = resolveForwardRef(provider.provide);
            /** @type {?} */
            const resolvedProvider = resolveProvider(provider);
            if (provider.multi === true) {
                // This is a multi provider.
                /** @type {?} */
                let multiProvider = records.get(token);
                if (multiProvider) {
                    if (multiProvider.fn !== MULTI_PROVIDER_FN) {
                        throw multiProviderMixError(token);
                    }
                }
                else {
                    // Create a placeholder factory which will look up the constituents of the multi provider.
                    records.set(token, multiProvider = (/** @type {?} */ ({
                        token: provider.provide,
                        deps: [],
                        useNew: false,
                        fn: MULTI_PROVIDER_FN,
                        value: EMPTY
                    })));
                }
                // Treat the provider as the token.
                token = provider;
                multiProvider.deps.push({ token, options: 6 /* Default */ });
            }
            /** @type {?} */
            const record = records.get(token);
            if (record && record.fn == MULTI_PROVIDER_FN) {
                throw multiProviderMixError(token);
            }
            if (token === INJECTOR_SCOPE) {
                scope = resolvedProvider.value;
            }
            records.set(token, resolvedProvider);
        }
        else {
            throw staticError('Unexpected provider', provider);
        }
    }
    return scope;
}
/**
 * @param {?} token
 * @param {?} record
 * @param {?} records
 * @param {?} parent
 * @param {?} notFoundValue
 * @param {?} flags
 * @return {?}
 */
function tryResolveToken(token, record, records, parent, notFoundValue, flags) {
    try {
        return resolveToken(token, record, records, parent, notFoundValue, flags);
    }
    catch (e) {
        // ensure that 'e' is of type Error.
        if (!(e instanceof Error)) {
            e = new Error(e);
        }
        /** @type {?} */
        const path = e[NG_TEMP_TOKEN_PATH] = e[NG_TEMP_TOKEN_PATH] || [];
        path.unshift(token);
        if (record && record.value == CIRCULAR) {
            // Reset the Circular flag.
            record.value = EMPTY;
        }
        throw e;
    }
}
/**
 * @param {?} token
 * @param {?} record
 * @param {?} records
 * @param {?} parent
 * @param {?} notFoundValue
 * @param {?} flags
 * @return {?}
 */
function resolveToken(token, record, records, parent, notFoundValue, flags) {
    /** @type {?} */
    let value;
    if (record && !(flags & InjectFlags.SkipSelf)) {
        // If we don't have a record, this implies that we don't own the provider hence don't know how
        // to resolve it.
        value = record.value;
        if (value == CIRCULAR) {
            throw Error(NO_NEW_LINE + 'Circular dependency');
        }
        else if (value === EMPTY) {
            record.value = CIRCULAR;
            /** @type {?} */
            let obj = undefined;
            /** @type {?} */
            let useNew = record.useNew;
            /** @type {?} */
            let fn = record.fn;
            /** @type {?} */
            let depRecords = record.deps;
            /** @type {?} */
            let deps = EMPTY;
            if (depRecords.length) {
                deps = [];
                for (let i = 0; i < depRecords.length; i++) {
                    /** @type {?} */
                    const depRecord = depRecords[i];
                    /** @type {?} */
                    const options = depRecord.options;
                    /** @type {?} */
                    const childRecord = options & 2 /* CheckSelf */ ? records.get(depRecord.token) : undefined;
                    deps.push(tryResolveToken(
                    // Current Token to resolve
                    depRecord.token, 
                    // A record which describes how to resolve the token.
                    // If undefined, this means we don't have such a record
                    childRecord, 
                    // Other records we know about.
                    records, 
                    // If we don't know how to resolve dependency and we should not check parent for it,
                    // than pass in Null injector.
                    !childRecord && !(options & 4 /* CheckParent */) ? Injector.NULL : parent, options & 1 /* Optional */ ? null : Injector.THROW_IF_NOT_FOUND, InjectFlags.Default));
                }
            }
            record.value = value = useNew ? new ((/** @type {?} */ (fn)))(...deps) : fn.apply(obj, deps);
        }
    }
    else if (!(flags & InjectFlags.Self)) {
        value = parent.get(token, notFoundValue, InjectFlags.Default);
    }
    else if (!(flags & InjectFlags.Optional)) {
        value = Injector.NULL.get(token, notFoundValue);
    }
    else {
        value = Injector.NULL.get(token, typeof notFoundValue !== 'undefined' ? notFoundValue : null);
    }
    return value;
}
/**
 * @param {?} provider
 * @return {?}
 */
function computeDeps(provider) {
    /** @type {?} */
    let deps = EMPTY;
    /** @type {?} */
    const providerDeps = ((/** @type {?} */ (provider))).deps;
    if (providerDeps && providerDeps.length) {
        deps = [];
        for (let i = 0; i < providerDeps.length; i++) {
            /** @type {?} */
            let options = 6 /* Default */;
            /** @type {?} */
            let token = resolveForwardRef(providerDeps[i]);
            if (Array.isArray(token)) {
                for (let j = 0, annotations = token; j < annotations.length; j++) {
                    /** @type {?} */
                    const annotation = annotations[j];
                    if (annotation instanceof Optional || annotation == Optional) {
                        options = options | 1 /* Optional */;
                    }
                    else if (annotation instanceof SkipSelf || annotation == SkipSelf) {
                        options = options & ~2 /* CheckSelf */;
                    }
                    else if (annotation instanceof Self || annotation == Self) {
                        options = options & ~4 /* CheckParent */;
                    }
                    else if (annotation instanceof Inject) {
                        token = ((/** @type {?} */ (annotation))).token;
                    }
                    else {
                        token = resolveForwardRef(annotation);
                    }
                }
            }
            deps.push({ token, options });
        }
    }
    else if (((/** @type {?} */ (provider))).useExisting) {
        /** @type {?} */
        const token = resolveForwardRef(((/** @type {?} */ (provider))).useExisting);
        deps = [{ token, options: 6 /* Default */ }];
    }
    else if (!providerDeps && !(USE_VALUE in provider)) {
        // useValue & useExisting are the only ones which are exempt from deps all others need it.
        throw staticError('\'deps\' required', provider);
    }
    return deps;
}
/**
 * @param {?} text
 * @param {?} obj
 * @return {?}
 */
function staticError(text, obj) {
    return new Error(formatError(text, obj, 'StaticInjectorError'));
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5qZWN0b3IuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9kaS9pbmplY3Rvci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFTQSxPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFFNUMsT0FBTyxFQUFDLGlCQUFpQixFQUFDLE1BQU0sZUFBZSxDQUFDO0FBRWhELE9BQU8sRUFBQyxrQkFBa0IsRUFBRSxXQUFXLEVBQUUsUUFBUSxFQUFFLGtCQUFrQixFQUFFLFlBQVksRUFBRSxrQkFBa0IsRUFBRSxrQkFBa0IsRUFBRSxTQUFTLEVBQUUsUUFBUSxFQUFDLE1BQU0sMEJBQTBCLENBQUM7QUFDbEwsT0FBTyxFQUFDLGdCQUFnQixFQUFFLGtCQUFrQixFQUFDLE1BQU0sa0JBQWtCLENBQUM7QUFDdEUsT0FBTyxFQUFDLFdBQVcsRUFBQyxNQUFNLHNCQUFzQixDQUFDO0FBRWpELE9BQU8sRUFBQyxNQUFNLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUMsTUFBTSxZQUFZLENBQUM7QUFDNUQsT0FBTyxFQUFDLGNBQWMsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUM3QyxPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0sU0FBUyxDQUFDOzs7Ozs7O0FBRXZDLE1BQU0sVUFBVSx1QkFBdUIsQ0FDbkMsU0FBMkIsRUFBRSxNQUEwQixFQUFFLElBQVk7SUFDdkUsT0FBTyxJQUFJLGNBQWMsQ0FBQyxTQUFTLEVBQUUsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFDO0FBQ3JELENBQUM7Ozs7Ozs7QUFFRCxNQUFNLFVBQVUsd0JBQXdCLENBQ3BDLFNBQTJCLEVBQUUsTUFBMEIsRUFBRSxJQUFZO0lBQ3ZFLE9BQU8sY0FBYyxDQUFDLEVBQUMsSUFBSSxFQUFFLElBQUksRUFBQyxFQUFFLE1BQU0sRUFBRSxTQUFTLEVBQUUsSUFBSSxDQUFDLENB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LElBQUksQ0FBQyxFQUFDLEtBQUssRUFBRSxPQUFPLEVBQUMsQ0FBQyxDQUFDO1NBQzdCO0tBQ0Y7U0FBTSxJQUFJLENBQUMsbUJBQUEsUUFBUSxFQUFvQixDQUFDLENBQUMsV0FBVyxFQUFFOztjQUMvQyxLQUFLLEdBQUcsaUJBQWlCLENBQUMsQ0FBQyxtQkFBQSxRQUFRLEVBQW9CLENBQUMsQ0FBQyxXQUFXLENBQUM7UUFDM0UsSUFBSSxHQUFHLENBQUMsRUFBQyxLQUFLLEVBQUUsT0FBTyxpQkFBcUIsRUFBQyxDQUFDLENBQUM7S0FDaEQ7U0FBTSxJQUFJLENBQUMsWUFBWSxJQUFJLENBQUMsQ0FBQyxTQUFTLElBQUksUUFBUSxDQUFDLEVBQUU7UUFDcEQsMEZBQTBGO1FBQzFGLE1BQU0sV0FBVyxDQUFDLG1CQUFtQixFQUFFLFFBQVEsQ0FBQyxDQUFDO0tBQ2xEO0lBQ0QsT0FBTyxJQUFJLENBQUM7QUFDZCxDQUFDOzs7Ozs7QUFFRCxTQUFTLFdBQVcsQ0FBQyxJQUFZLEVBQUUsR0FBUTtJQUN6QyxPQUFPLElBQUksS0FBSyxDQUFDLFdBQVcsQ0FBQyxJQUFJLEVBQUUsR0FBRyxFQUFFLHFCQUFxQixDQUFDLENBQUMsQ0FBQztBQUNsRSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0Fic3RyYWN0VHlwZSwgVHlwZX0gZnJvbSAnLi4vaW50ZXJmYWNlL3R5cGUnO1xuaW1wb3J0IHtzdHJpbmdpZnl9IGZyb20gJy4uL3V0aWwvc3RyaW5naWZ5JztcblxuaW1wb3J0IHtyZXNvbHZlRm9yd2FyZFJlZn0gZnJvbSAnLi9mb3J3YXJkX3JlZic7XG5pbXBvcnQge0luamVjdGlvblRva2VufSBmcm9tICcuL2luamVjdGlvbl90b2tlbic7XG5pbXBvcnQge2NhdGNoSW5qZWN0b3JFcnJvciwgZm9ybWF0RXJyb3IsIElOSkVDVE9SLCBOR19URU1QX1RPS0VOX1BBVEgsIE51bGxJbmplY3Rvciwgc2V0Q3VycmVudEluamVjdG9yLCBUSFJPV19JRl9OT1RfRk9VTkQsIFVTRV9WQUxVRSwgybXJtWluamVjdH0gZnJvbSAnLi9pbmplY3Rvcl9jb21wYXRpYmlsaXR5JztcbmltcG9ydCB7Z2V0SW5qZWN0YWJsZURlZiwgybXJtWRlZmluZUluamVjdGFibGV9IGZyb20gJy4vaW50ZXJmYWNlL2RlZnMnO1xuaW1wb3J0IHtJbmplY3RGbGFnc30gZnJvbSAnLi9pbnRlcmZhY2UvaW5qZWN0b3InO1xuaW1wb3J0IHtDb25zdHJ1Y3RvclByb3ZpZGVyLCBFeGlzdGluZ1Byb3ZpZGVyLCBGYWN0b3J5UHJvdmlkZXIsIFN0YXRpY0NsYXNzUHJvdmlkZXIsIFN0YXRpY1Byb3ZpZGVyLCBWYWx1ZVByb3ZpZGVyfSBmcm9tICcuL2ludGVyZmFjZS9wcm92aWRlcic7XG5pbXBvcnQge0luamVjdCwgT3B0aW9uYWwsIFNlbGYsIFNraXBTZWxmfSBmcm9tICcuL21ldGFkYXRhJztcbmltcG9ydCB7Y3JlYXRlSW5qZWN0b3J9IGZyb20gJy4vcjNfaW5qZWN0b3InO1xuaW1wb3J0IHtJTkpFQ1RPUl9TQ09QRX0gZnJvbSAnLi9zY29wZSc7XG5cbmV4cG9ydCBmdW5jdGlvbiBJTkpFQ1RPUl9JTVBMX19QUkVfUjNfXyhcbiAgICBwcm92aWRlcnM6IFN0YXRpY1Byb3ZpZGVyW10sIHBhcmVudDogSW5qZWN0b3J8dW5kZWZpbmVkLCBuYW1lOiBzdHJpbmcpIHtcbiAgcmV0dXJuIG5ldyBTdGF0aWNJbmplY3Rvcihwcm92aWRlcnMsIHBhcmVudCwgbmFtZSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBJTkpFQ1RPUl9JTVBMX19QT1NUX1IzX18oXG4gICAgcHJvdmlkZXJzOiBTdGF0aWNQcm92aWRlcltdLCBwYXJlbnQ6IEluamVjdG9yfHVuZGVmaW5lZCwgbmFtZTogc3RyaW5nKSB7XG4gIHJldHVybiBjcmVhdGVJbmplY3Rvcih7bmFtZTogbmFtZX0sIHBhcmVudCwgcHJvdmlkZXJzLCBuYW1lKTtcbn1cblxuZXhwb3J0IGNvbnN0IElOSkVDVE9SX0lNUEwgPSBJTkpFQ1RPUl9JTVBMX19QUkVfUjNfXztcblxuLyoqXG4gKiBDb25jcmV0ZSBpbmplY3RvcnMgaW1wbGVtZW50IHRoaXMgaW50ZXJmYWNlLiBJbmplY3RvcnMgYXJlIGNvbmZpZ3VyZWRcbiAqIHdpdGggW3Byb3ZpZGVyc10oZ3VpZGUvZ2xvc3NhcnkjcHJvdmlkZXIpIHRoYXQgYXNzb2NpYXRlXG4gKiBkZXBlbmRlbmNpZXMgb2YgdmFyaW91cyB0eXBlcyB3aXRoIFtpbmplY3Rpb24gdG9rZW5zXShndWlkZS9nbG9zc2FyeSNkaS10b2tlbikuXG4gKlxuICogQHNlZSBbXCJESSBQcm92aWRlcnNcIl0oZ3VpZGUvZGVwZW5kZW5jeS1pbmplY3Rpb24tcHJvdmlkZXJzKS5cbiAqIEBzZWUgYFN0YXRpY1Byb3ZpZGVyYFxuICpcbiAqIEB1c2FnZU5vdGVzXG4gKlxuICogIFRoZSBmb2xsb3dpbmcgZXhhbXBsZSBjcmVhdGVzIGEgc2VydmljZSBpbmplY3RvciBpbnN0YW5jZS5cbiAqXG4gKiB7QGV4YW1wbGUgY29yZS9kaS90cy9wcm92aWRlcl9zcGVjLnRzIHJlZ2lvbj0nQ29uc3RydWN0b3JQcm92aWRlcid9XG4gKlxuICogIyMjIFVzYWdlIGV4YW1wbGVcbiAqXG4gKiB7QGV4YW1wbGUgY29yZS9kaS90cy9pbmplY3Rvcl9zcGVjLnRzIHJlZ2lvbj0nSW5qZWN0b3InfVxuICpcbiAqIGBJbmplY3RvcmAgcmV0dXJucyBpdHNlbGYgd2hlbiBnaXZlbiBgSW5qZWN0b3JgIGFzIGEgdG9rZW46XG4gKlxuICoge0BleGFtcGxlIGNvcmUvZGkvdHMvaW5qZWN0b3Jfc3BlYy50cyByZWdpb249J2luamVjdEluamVjdG9yJ31cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBJbmplY3RvciB7XG4gIHN0YXRpYyBUSFJPV19JRl9OT1RfRk9VTkQgPSBUSFJPV19JRl9OT1RfRk9VTkQ7XG4gIHN0YXRpYyBOVUxMOiBJbmplY3RvciA9IG5ldyBOdWxsSW5qZWN0b3IoKTtcblxuICAvKipcbiAgICogUmV0cmlldmVzIGFuIGluc3RhbmNlIGZyb20gdGhlIGluamVjdG9yIGJhc2VkIG9uIHRoZSBwcm92aWRlZCB0b2tlbi5cbiAgICogQHJldHVybnMgVGhlIGluc3RhbmNlIGZyb20gdGhlIGluamVjdG9yIGlmIGRlZmluZWQsIG90aGVyd2lzZSB0aGUgYG5vdEZvdW5kVmFsdWVgLlxuICAgKiBAdGhyb3dzIFdoZW4gdGhlIGBub3RGb3VuZFZhbHVlYCBpcyBgdW5kZWZpbmVkYCBvciBgSW5qZWN0b3IuVEhST1dfSUZfTk9UX0ZPVU5EYC5cbiAgICovXG4gIGFic3RyYWN0IGdldDxUPihcbiAgICAgIHRva2VuOiBUeXBlPFQ+fEluamVjdGlvblRva2VuPFQ+fEFic3RyYWN0VHlwZTxUPiwgbm90Rm91bmRWYWx1ZT86IFQsIGZsYWdzPzogSW5qZWN0RmxhZ3MpOiBUO1xuICAvKipcbiAgICogQGRlcHJlY2F0ZWQgZnJvbSB2NC4wLjAgdXNlIFR5cGU8VD4gb3IgSW5qZWN0aW9uVG9rZW48VD5cbiAgICogQHN1cHByZXNzIHtkdXBsaWNhdGV9XG4gICAqL1xuICBhYnN0cmFjdCBnZXQodG9rZW46IGFueSwgbm90Rm91bmRWYWx1ZT86IGFueSk6IGFueTtcblxuICAvKipcbiAgICogQGRlcHJlY2F0ZWQgZnJvbSB2NSB1c2UgdGhlIG5ldyBzaWduYXR1cmUgSW5qZWN0b3IuY3JlYXRlKG9wdGlvbnMpXG4gICAqL1xuICBzdGF0aWMgY3JlYXRlKHByb3ZpZGVyczogU3RhdGljUHJvdmlkZXJbXSwgcGFyZW50PzogSW5qZWN0b3IpOiBJbmplY3RvcjtcblxuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyBpbmplY3RvciBpbnN0YW5jZSB0aGF0IHByb3ZpZGVzIG9uZSBvciBtb3JlIGRlcGVuZGVuY2llcyxcbiAgICogYWNjb3JkaW5nIHRvIGEgZ2l2ZW4gdHlwZSBvciB0eXBlcyBvZiBgU3RhdGljUHJvdmlkZXJgLlxuICAgKlxuICAgKiBAcGFyYW0gb3B0aW9ucyBBbiBvYmplY3Qgd2l0aCB0aGUgZm9sbG93aW5nIHByb3BlcnRpZXM6XG4gICAqICogYHByb3ZpZGVyc2A6IEFuIGFycmF5IG9mIHByb3ZpZGVycyBvZiB0aGUgW1N0YXRpY1Byb3ZpZGVyIHR5cGVdKGFwaS9jb3JlL1N0YXRpY1Byb3ZpZGVyKS5cbiAgICogKiBgcGFyZW50YDogKG9wdGlvbmFsKSBBIHBhcmVudCBpbmplY3Rvci5cbiAgICogKiBgbmFtZWA6IChvcHRpb25hbCkgQSBkZXZlbG9wZXItZGVmaW5lZCBpZGVudGlmeWluZyBuYW1lIGZvciB0aGUgbmV3IGluamVjdG9yLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgbmV3IGluamVjdG9yIGluc3RhbmNlLlxuICAgKlxuICAgKi9cbiAgc3RhdGljIGNyZWF0ZShvcHRpb25zOiB7cHJvdmlkZXJzOiBTdGF0aWNQcm92aWRlcltdLCBwYXJlbnQ/OiBJbmplY3RvciwgbmFtZT86IHN0cmluZ30pOiBJbmplY3RvcjtcblxuXG4gIHN0YXRpYyBjcmVhdGUoXG4gICAgICBvcHRpb25zOiBTdGF0aWNQcm92aWRlcltdfHtwcm92aWRlcnM6IFN0YXRpY1Byb3ZpZGVyW10sIHBhcmVudD86IEluamVjdG9yLCBuYW1lPzogc3RyaW5nfSxcbiAgICAgIHBhcmVudD86IEluamVjdG9yKTogSW5qZWN0b3Ige1xuICAgIGlmIChBcnJheS5pc0FycmF5KG9wdGlvbnMpKSB7XG4gICAgICByZXR1cm4gSU5KRUNUT1JfSU1QTChvcHRpb25zLCBwYXJlbnQsICcnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIElOSkVDVE9SX0lNUEwob3B0aW9ucy5wcm92aWRlcnMsIG9wdGlvbnMucGFyZW50LCBvcHRpb25zLm5hbWUgfHwgJycpO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBAbm9jb2xsYXBzZSAqL1xuICBzdGF0aWMgybVwcm92ID0gybXJtWRlZmluZUluamVjdGFibGUoe1xuICAgIHRva2VuOiBJbmplY3RvcixcbiAgICBwcm92aWRlZEluOiAnYW55JyBhcyBhbnksXG4gICAgZmFjdG9yeTogKCkgPT4gybXJtWluamVjdChJTkpFQ1RPUiksXG4gIH0pO1xuXG4gIC8qKlxuICAgKiBAaW50ZXJuYWxcbiAgICogQG5vY29sbGFwc2VcbiAgICovXG4gIHN0YXRpYyBfX05HX0VMRU1FTlRfSURfXyA9IC0xO1xufVxuXG5cblxuY29uc3QgSURFTlQgPSBmdW5jdGlvbjxUPih2YWx1ZTogVCk6IFQge1xuICByZXR1cm4gdmFsdWU7XG59O1xuY29uc3QgRU1QVFkgPSA8YW55W10+W107XG5jb25zdCBDSVJDVUxBUiA9IElERU5UO1xuY29uc3QgTVVMVElfUFJPVklERVJfRk4gPSBmdW5jdGlvbigpOiBhbnlbXSB7XG4gIHJldHVybiBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpO1xufTtcblxuY29uc3QgZW51bSBPcHRpb25GbGFncyB7XG4gIE9wdGlvbmFsID0gMSA8PCAwLFxuICBDaGVja1NlbGYgPSAxIDw8IDEsXG4gIENoZWNrUGFyZW50ID0gMSA8PCAyLFxuICBEZWZhdWx0ID0gQ2hlY2tTZWxmIHwgQ2hlY2tQYXJlbnRcbn1cbmNvbnN0IE5PX05FV19MSU5FID0gJ8m1JztcblxuZXhwb3J0IGNsYXNzIFN0YXRpY0luamVjdG9yIGltcGxlbWVudHMgSW5qZWN0b3Ige1xuICByZWFkb25seSBwYXJlbnQ6IEluamVjdG9yO1xuICByZWFkb25seSBzb3VyY2U6IHN0cmluZ3xudWxsO1xuICByZWFkb25seSBzY29wZTogc3RyaW5nfG51bGw7XG5cbiAgcHJpdmF0ZSBfcmVjb3JkczogTWFwPGFueSwgUmVjb3JkfG51bGw+O1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgICAgcHJvdmlkZXJzOiBTdGF0aWNQcm92aWRlcltdLCBwYXJlbnQ6IEluamVjdG9yID0gSW5qZWN0b3IuTlVMTCwgc291cmNlOiBzdHJpbmd8bnVsbCA9IG51bGwpIHtcbiAgICB0aGlzLnBhcmVudCA9IHBhcmVudDtcbiAgICB0aGlzLnNvdXJjZSA9IHNvdXJjZTtcbiAgICBjb25zdCByZWNvcmRzID0gdGhpcy5fcmVjb3JkcyA9IG5ldyBNYXA8YW55LCBSZWNvcmQ+KCk7XG4gICAgcmVjb3Jkcy5zZXQoXG4gICAgICAgIEluamVjdG9yLCA8UmVjb3JkPnt0b2tlbjogSW5qZWN0b3IsIGZuOiBJREVOVCwgZGVwczogRU1QVFksIHZhbHVlOiB0aGlzLCB1c2VOZXc6IGZhbHNlfSk7XG4gICAgcmVjb3Jkcy5zZXQoXG4gICAgICAgIElOSkVDVE9SLCA8UmVjb3JkPnt0b2tlbjogSU5KRUNUT1IsIGZuOiBJREVOVCwgZGVwczogRU1QVFksIHZhbHVlOiB0aGlzLCB1c2VOZXc6IGZhbHNlfSk7XG4gICAgdGhpcy5zY29wZSA9IHJlY3Vyc2l2ZWx5UHJvY2Vzc1Byb3ZpZGVycyhyZWNvcmRzLCBwcm92aWRlcnMpO1xuICB9XG5cbiAgZ2V0PFQ+KHRva2VuOiBUeXBlPFQ+fEluamVjdGlvblRva2VuPFQ+LCBub3RGb3VuZFZhbHVlPzogVCwgZmxhZ3M/OiBJbmplY3RGbGFncyk6IFQ7XG4gIGdldCh0b2tlbjogYW55LCBub3RGb3VuZFZhbHVlPzogYW55KTogYW55O1xuICBnZXQodG9rZW46IGFueSwgbm90Rm91bmRWYWx1ZT86IGFueSwgZmxhZ3M6IEluamVjdEZsYWdzID0gSW5qZWN0RmxhZ3MuRGVmYXVsdCk6IGFueSB7XG4gICAgY29uc3QgcmVjb3JkcyA9IHRoaXMuX3JlY29yZHM7XG4gICAgbGV0IHJlY29yZCA9IHJlY29yZHMuZ2V0KHRva2VuKTtcbiAgICBpZiAocmVjb3JkID09PSB1bmRlZmluZWQpIHtcbiAgICAgIC8vIFRoaXMgbWVhbnMgd2UgaGF2ZSBuZXZlciBzZWVuIHRoaXMgcmVjb3JkLCBzZWUgaWYgaXQgaXMgdHJlZSBzaGFrYWJsZSBwcm92aWRlci5cbiAgICAgIGNvbnN0IGluamVjdGFibGVEZWYgPSBnZXRJbmplY3RhYmxlRGVmKHRva2VuKTtcbiAgICAgIGlmIChpbmplY3RhYmxlRGVmKSB7XG4gICAgICAgIGNvbnN0IHByb3ZpZGVkSW4gPSBpbmplY3RhYmxlRGVmICYmIGluamVjdGFibGVEZWYucHJvdmlkZWRJbjtcbiAgICAgICAgaWYgKHByb3ZpZGVkSW4gPT09ICdhbnknIHx8IHByb3ZpZGVkSW4gIT0gbnVsbCAmJiBwcm92aWRlZEluID09PSB0aGlzLnNjb3BlKSB7XG4gICAgICAgICAgcmVjb3Jkcy5zZXQoXG4gICAgICAgICAgICAgIHRva2VuLFxuICAgICAgICAgICAgICByZWNvcmQgPSByZXNvbHZlUHJvdmlkZXIoXG4gICAgICAgICAgICAgICAgICB7cHJvdmlkZTogdG9rZW4sIHVzZUZhY3Rvcnk6IGluamVjdGFibGVEZWYuZmFjdG9yeSwgZGVwczogRU1QVFl9KSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmIChyZWNvcmQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAvLyBTZXQgcmVjb3JkIHRvIG51bGwgdG8gbWFrZSBzdXJlIHRoYXQgd2UgZG9uJ3QgZ28gdGhyb3VnaCBleHBlbnNpdmUgbG9va3VwIGFib3ZlIGFnYWluLlxuICAgICAgICByZWNvcmRzLnNldCh0b2tlbiwgbnVsbCk7XG4gICAgICB9XG4gICAgfVxuICAgIGxldCBsYXN0SW5qZWN0b3IgPSBzZXRDdXJyZW50SW5qZWN0b3IodGhpcyk7XG4gICAgdHJ5IHtcbiAgICAgIHJldHVybiB0cnlSZXNvbHZlVG9rZW4odG9rZW4sIHJlY29yZCwgcmVjb3JkcywgdGhpcy5wYXJlbnQsIG5vdEZvdW5kVmFsdWUsIGZsYWdzKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICByZXR1cm4gY2F0Y2hJbmplY3RvckVycm9yKGUsIHRva2VuLCAnU3RhdGljSW5qZWN0b3JFcnJvcicsIHRoaXMuc291cmNlKTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgc2V0Q3VycmVudEluamVjdG9yKGxhc3RJbmplY3Rvcik7XG4gICAgfVxuICB9XG5cbiAgdG9TdHJpbmcoKSB7XG4gICAgY29uc3QgdG9rZW5zID0gPHN0cmluZ1tdPltdLCByZWNvcmRzID0gdGhpcy5fcmVjb3JkcztcbiAgICByZWNvcmRzLmZvckVhY2goKHYsIHRva2VuKSA9PiB0b2tlbnMucHVzaChzdHJpbmdpZnkodG9rZW4pKSk7XG4gICAgcmV0dXJuIGBTdGF0aWNJbmplY3Rvclske3Rva2Vucy5qb2luKCcsICcpfV1gO1xuICB9XG59XG5cbnR5cGUgU3VwcG9ydGVkUHJvdmlkZXIgPVxuICAgIFZhbHVlUHJvdmlkZXJ8RXhpc3RpbmdQcm92aWRlcnxTdGF0aWNDbGFzc1Byb3ZpZGVyfENvbnN0cnVjdG9yUHJvdmlkZXJ8RmFjdG9yeVByb3ZpZGVyO1xuXG5pbnRlcmZhY2UgUmVjb3JkIHtcbiAgZm46IEZ1bmN0aW9uO1xuICB1c2VOZXc6IGJvb2xlYW47XG4gIGRlcHM6IERlcGVuZGVuY3lSZWNvcmRbXTtcbiAgdmFsdWU6IGFueTtcbn1cblxuaW50ZXJmYWNlIERlcGVuZGVuY3lSZWNvcmQge1xuICB0b2tlbjogYW55O1xuICBvcHRpb25zOiBudW1iZXI7XG59XG5cbmZ1bmN0aW9uIHJlc29sdmVQcm92aWRlcihwcm92aWRlcjogU3VwcG9ydGVkUHJvdmlkZXIpOiBSZWNvcmQge1xuICBjb25zdCBkZXBzID0gY29tcHV0ZURlcHMocHJvdmlkZXIpO1xuICBsZXQgZm46IEZ1bmN0aW9uID0gSURFTlQ7XG4gIGxldCB2YWx1ZTogYW55ID0gRU1QVFk7XG4gIGxldCB1c2VOZXc6IGJvb2xlYW4gPSBmYWxzZTtcbiAgbGV0IHByb3ZpZGUgPSByZXNvbHZlRm9yd2FyZFJlZihwcm92aWRlci5wcm92aWRlKTtcbiAgaWYgKFVTRV9WQUxVRSBpbiBwcm92aWRlcikge1xuICAgIC8vIFdlIG5lZWQgdG8gdXNlIFVTRV9WQUxVRSBpbiBwcm92aWRlciBzaW5jZSBwcm92aWRlci51c2VWYWx1ZSBjb3VsZCBiZSBkZWZpbmVkIGFzIHVuZGVmaW5lZC5cbiAgICB2YWx1ZSA9IChwcm92aWRlciBhcyBWYWx1ZVByb3ZpZGVyKS51c2VWYWx1ZTtcbiAgfSBlbHNlIGlmICgocHJvdmlkZXIgYXMgRmFjdG9yeVByb3ZpZGVyKS51c2VGYWN0b3J5KSB7XG4gICAgZm4gPSAocHJvdmlkZXIgYXMgRmFjdG9yeVByb3ZpZGVyKS51c2VGYWN0b3J5O1xuICB9IGVsc2UgaWYgKChwcm92aWRlciBhcyBFeGlzdGluZ1Byb3ZpZGVyKS51c2VFeGlzdGluZykge1xuICAgIC8vIEp1c3QgdXNlIElERU5UXG4gIH0gZWxzZSBpZiAoKHByb3ZpZGVyIGFzIFN0YXRpY0NsYXNzUHJvdmlkZXIpLnVzZUNsYXNzKSB7XG4gICAgdXNlTmV3ID0gdHJ1ZTtcbiAgICBmbiA9IHJlc29sdmVGb3J3YXJkUmVmKChwcm92aWRlciBhcyBTdGF0aWNDbGFzc1Byb3ZpZGVyKS51c2VDbGFzcyk7XG4gIH0gZWxzZSBpZiAodHlwZW9mIHByb3ZpZGUgPT0gJ2Z1bmN0aW9uJykge1xuICAgIHVzZU5ldyA9IHRydWU7XG4gICAgZm4gPSBwcm92aWRlO1xuICB9IGVsc2Uge1xuICAgIHRocm93IHN0YXRpY0Vycm9yKFxuICAgICAgICAnU3RhdGljUHJvdmlkZXIgZG9lcyBub3QgaGF2ZSBbdXNlVmFsdWV8dXNlRmFjdG9yeXx1c2VFeGlzdGluZ3x1c2VDbGFzc10gb3IgW3Byb3ZpZGVdIGlzIG5vdCBuZXdhYmxlJyxcbiAgICAgICAgcHJvdmlkZXIpO1xuICB9XG4gIHJldHVybiB7ZGVwcywgZm4sIHVzZU5ldywgdmFsdWV9O1xufVxuXG5mdW5jdGlvbiBtdWx0aVByb3ZpZGVyTWl4RXJyb3IodG9rZW46IGFueSkge1xuICByZXR1cm4gc3RhdGljRXJyb3IoJ0Nhbm5vdCBtaXggbXVsdGkgcHJvdmlkZXJzIGFuZCByZWd1bGFyIHByb3ZpZGVycycsIHRva2VuKTtcbn1cblxuZnVuY3Rpb24gcmVjdXJzaXZlbHlQcm9jZXNzUHJvdmlkZXJzKHJlY29yZHM6IE1hcDxhbnksIFJlY29yZD4sIHByb3ZpZGVyOiBTdGF0aWNQcm92aWRlcik6IHN0cmluZ3xcbiAgICBudWxsIHtcbiAgbGV0IHNjb3BlOiBzdHJpbmd8bnVsbCA9IG51bGw7XG4gIGlmIChwcm92aWRlcikge1xuICAgIHByb3ZpZGVyID0gcmVzb2x2ZUZvcndhcmRSZWYocHJvdmlkZXIpO1xuICAgIGlmIChBcnJheS5pc0FycmF5KHByb3ZpZGVyKSkge1xuICAgICAgLy8gaWYgd2UgaGF2ZSBhbiBhcnJheSByZWN1cnNlIGludG8gdGhlIGFycmF5XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHByb3ZpZGVyLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHNjb3BlID0gcmVjdXJzaXZlbHlQcm9jZXNzUHJvdmlkZXJzKHJlY29yZHMsIHByb3ZpZGVyW2ldKSB8fCBzY29wZTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBwcm92aWRlciA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgLy8gRnVuY3Rpb25zIHdlcmUgc3VwcG9ydGVkIGluIFJlZmxlY3RpdmVJbmplY3RvciwgYnV0IGFyZSBub3QgaGVyZS4gRm9yIHNhZmV0eSBnaXZlIHVzZWZ1bFxuICAgICAgLy8gZXJyb3IgbWVzc2FnZXNcbiAgICAgIHRocm93IHN0YXRpY0Vycm9yKCdGdW5jdGlvbi9DbGFzcyBub3Qgc3VwcG9ydGVkJywgcHJvdmlkZXIpO1xuICAgIH0gZWxzZSBpZiAocHJvdmlkZXIgJiYgdHlwZW9mIHByb3ZpZGVyID09PSAnb2JqZWN0JyAmJiBwcm92aWRlci5wcm92aWRlKSB7XG4gICAgICAvLyBBdCB0aGlzIHBvaW50IHdlIGhhdmUgd2hhdCBsb29rcyBsaWtlIGEgcHJvdmlkZXI6IHtwcm92aWRlOiA/LCAuLi4ufVxuICAgICAgbGV0IHRva2VuID0gcmVzb2x2ZUZvcndhcmRSZWYocHJvdmlkZXIucHJvdmlkZSk7XG4gICAgICBjb25zdCByZXNvbHZlZFByb3ZpZGVyID0gcmVzb2x2ZVByb3ZpZGVyKHByb3ZpZGVyKTtcbiAgICAgIGlmIChwcm92aWRlci5tdWx0aSA9PT0gdHJ1ZSkge1xuICAgICAgICAvLyBUaGlzIGlzIGEgbXVsdGkgcHJvdmlkZXIuXG4gICAgICAgIGxldCBtdWx0aVByb3ZpZGVyOiBSZWNvcmR8dW5kZWZpbmVkID0gcmVjb3Jkcy5nZXQodG9rZW4pO1xuICAgICAgICBpZiAobXVsdGlQcm92aWRlcikge1xuICAgICAgICAgIGlmIChtdWx0aVByb3ZpZGVyLmZuICE9PSBNVUxUSV9QUk9WSURFUl9GTikge1xuICAgICAgICAgICAgdGhyb3cgbXVsdGlQcm92aWRlck1peEVycm9yKHRva2VuKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gQ3JlYXRlIGEgcGxhY2Vob2xkZXIgZmFjdG9yeSB3aGljaCB3aWxsIGxvb2sgdXAgdGhlIGNvbnN0aXR1ZW50cyBvZiB0aGUgbXVsdGkgcHJvdmlkZXIuXG4gICAgICAgICAgcmVjb3Jkcy5zZXQodG9rZW4sIG11bHRpUHJvdmlkZXIgPSA8UmVjb3JkPntcbiAgICAgICAgICAgIHRva2VuOiBwcm92aWRlci5wcm92aWRlLFxuICAgICAgICAgICAgZGVwczogW10sXG4gICAgICAgICAgICB1c2VOZXc6IGZhbHNlLFxuICAgICAgICAgICAgZm46IE1VTFRJX1BST1ZJREVSX0ZOLFxuICAgICAgICAgICAgdmFsdWU6IEVNUFRZXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gVHJlYXQgdGhlIHByb3ZpZGVyIGFzIHRoZSB0b2tlbi5cbiAgICAgICAgdG9rZW4gPSBwcm92aWRlcjtcbiAgICAgICAgbXVsdGlQcm92aWRlci5kZXBzLnB1c2goe3Rva2VuLCBvcHRpb25zOiBPcHRpb25GbGFncy5EZWZhdWx0fSk7XG4gICAgICB9XG4gICAgICBjb25zdCByZWNvcmQgPSByZWNvcmRzLmdldCh0b2tlbik7XG4gICAgICBpZiAocmVjb3JkICYmIHJlY29yZC5mbiA9PSBNVUxUSV9QUk9WSURFUl9GTikge1xuICAgICAgICB0aHJvdyBtdWx0aVByb3ZpZGVyTWl4RXJyb3IodG9rZW4pO1xuICAgICAgfVxuICAgICAgaWYgKHRva2VuID09PSBJTkpFQ1RPUl9TQ09QRSkge1xuICAgICAgICBzY29wZSA9IHJlc29sdmVkUHJvdmlkZXIudmFsdWU7XG4gICAgICB9XG4gICAgICByZWNvcmRzLnNldCh0b2tlbiwgcmVzb2x2ZWRQcm92aWRlcik7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IHN0YXRpY0Vycm9yKCdVbmV4cGVjdGVkIHByb3ZpZGVyJywgcHJvdmlkZXIpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gc2NvcGU7XG59XG5cbmZ1bmN0aW9uIHRyeVJlc29sdmVUb2tlbihcbiAgICB0b2tlbjogYW55LCByZWNvcmQ6IFJlY29yZHx1bmRlZmluZWR8bnVsbCwgcmVjb3JkczogTWFwPGFueSwgUmVjb3JkfG51bGw+LCBwYXJlbnQ6IEluamVjdG9yLFxuICAgIG5vdEZvdW5kVmFsdWU6IGFueSwgZmxhZ3M6IEluamVjdEZsYWdzKTogYW55IHtcbiAgdHJ5IHtcbiAgICByZXR1cm4gcmVzb2x2ZVRva2VuKHRva2VuLCByZWNvcmQsIHJlY29yZHMsIHBhcmVudCwgbm90Rm91bmRWYWx1ZSwgZmxhZ3MpO1xuICB9IGNhdGNoIChlKSB7XG4gICAgLy8gZW5zdXJlIHRoYXQgJ2UnIGlzIG9mIHR5cGUgRXJyb3IuXG4gICAgaWYgKCEoZSBpbnN0YW5jZW9mIEVycm9yKSkge1xuICAgICAgZSA9IG5ldyBFcnJvcihlKTtcbiAgICB9XG4gICAgY29uc3QgcGF0aDogYW55W10gPSBlW05HX1RFTVBfVE9LRU5fUEFUSF0gPSBlW05HX1RFTVBfVE9LRU5fUEFUSF0gfHwgW107XG4gICAgcGF0aC51bnNoaWZ0KHRva2VuKTtcbiAgICBpZiAocmVjb3JkICYmIHJlY29yZC52YWx1ZSA9PSBDSVJDVUxBUikge1xuICAgICAgLy8gUmVzZXQgdGhlIENpcmN1bGFyIGZsYWcuXG4gICAgICByZWNvcmQudmFsdWUgPSBFTVBUWTtcbiAgICB9XG4gICAgdGhyb3cgZTtcbiAgfVxufVxuXG5mdW5jdGlvbiByZXNvbHZlVG9rZW4oXG4gICAgdG9rZW46IGFueSwgcmVjb3JkOiBSZWNvcmR8dW5kZWZpbmVkfG51bGwsIHJlY29yZHM6IE1hcDxhbnksIFJlY29yZHxudWxsPiwgcGFyZW50OiBJbmplY3RvcixcbiAgICBub3RGb3VuZFZhbHVlOiBhbnksIGZsYWdzOiBJbmplY3RGbGFncyk6IGFueSB7XG4gIGxldCB2YWx1ZTtcbiAgaWYgKHJlY29yZCAmJiAhKGZsYWdzICYgSW5qZWN0RmxhZ3MuU2tpcFNlbGYpKSB7XG4gICAgLy8gSWYgd2UgZG9uJ3QgaGF2ZSBhIHJlY29yZCwgdGhpcyBpbXBsaWVzIHRoYXQgd2UgZG9uJ3Qgb3duIHRoZSBwcm92aWRlciBoZW5jZSBkb24ndCBrbm93IGhvd1xuICAgIC8vIHRvIHJlc29sdmUgaXQuXG4gICAgdmFsdWUgPSByZWNvcmQudmFsdWU7XG4gICAgaWYgKHZhbHVlID09IENJUkNVTEFSKSB7XG4gICAgICB0aHJvdyBFcnJvcihOT19ORVdfTElORSArICdDaXJjdWxhciBkZXBlbmRlbmN5Jyk7XG4gICAgfSBlbHNlIGlmICh2YWx1ZSA9PT0gRU1QVFkpIHtcbiAgICAgIHJlY29yZC52YWx1ZSA9IENJUkNVTEFSO1xuICAgICAgbGV0IG9iaiA9IHVuZGVmaW5lZDtcbiAgICAgIGxldCB1c2VOZXcgPSByZWNvcmQudXNlTmV3O1xuICAgICAgbGV0IGZuID0gcmVjb3JkLmZuO1xuICAgICAgbGV0IGRlcFJlY29yZHMgPSByZWNvcmQuZGVwcztcbiAgICAgIGxldCBkZXBzID0gRU1QVFk7XG4gICAgICBpZiAoZGVwUmVjb3Jkcy5sZW5ndGgpIHtcbiAgICAgICAgZGVwcyA9IFtdO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRlcFJlY29yZHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBjb25zdCBkZXBSZWNvcmQ6IERlcGVuZGVuY3lSZWNvcmQgPSBkZXBSZWNvcmRzW2ldO1xuICAgICAgICAgIGNvbnN0IG9wdGlvbnMgPSBkZXBSZWNvcmQub3B0aW9ucztcbiAgICAgICAgICBjb25zdCBjaGlsZFJlY29yZCA9XG4gICAgICAgICAgICAgIG9wdGlvbnMgJiBPcHRpb25GbGFncy5DaGVja1NlbGYgPyByZWNvcmRzLmdldChkZXBSZWNvcmQudG9rZW4pIDogdW5kZWZpbmVkO1xuICAgICAgICAgIGRlcHMucHVzaCh0cnlSZXNvbHZlVG9rZW4oXG4gICAgICAgICAgICAgIC8vIEN1cnJlbnQgVG9rZW4gdG8gcmVzb2x2ZVxuICAgICAgICAgICAgICBkZXBSZWNvcmQudG9rZW4sXG4gICAgICAgICAgICAgIC8vIEEgcmVjb3JkIHdoaWNoIGRlc2NyaWJlcyBob3cgdG8gcmVzb2x2ZSB0aGUgdG9rZW4uXG4gICAgICAgICAgICAgIC8vIElmIHVuZGVmaW5lZCwgdGhpcyBtZWFucyB3ZSBkb24ndCBoYXZlIHN1Y2ggYSByZWNvcmRcbiAgICAgICAgICAgICAgY2hpbGRSZWNvcmQsXG4gICAgICAgICAgICAgIC8vIE90aGVyIHJlY29yZHMgd2Uga25vdyBhYm91dC5cbiAgICAgICAgICAgICAgcmVjb3JkcyxcbiAgICAgICAgICAgICAgLy8gSWYgd2UgZG9uJ3Qga25vdyBob3cgdG8gcmVzb2x2ZSBkZXBlbmRlbmN5IGFuZCB3ZSBzaG91bGQgbm90IGNoZWNrIHBhcmVudCBmb3IgaXQsXG4gICAgICAgICAgICAgIC8vIHRoYW4gcGFzcyBpbiBOdWxsIGluamVjdG9yLlxuICAgICAgICAgICAgICAhY2hpbGRSZWNvcmQgJiYgIShvcHRpb25zICYgT3B0aW9uRmxhZ3MuQ2hlY2tQYXJlbnQpID8gSW5qZWN0b3IuTlVMTCA6IHBhcmVudCxcbiAgICAgICAgICAgICAgb3B0aW9ucyAmIE9wdGlvbkZsYWdzLk9wdGlvbmFsID8gbnVsbCA6IEluamVjdG9yLlRIUk9XX0lGX05PVF9GT1VORCxcbiAgICAgICAgICAgICAgSW5qZWN0RmxhZ3MuRGVmYXVsdCkpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZWNvcmQudmFsdWUgPSB2YWx1ZSA9IHVzZU5ldyA/IG5ldyAoZm4gYXMgYW55KSguLi5kZXBzKSA6IGZuLmFwcGx5KG9iaiwgZGVwcyk7XG4gICAgfVxuICB9IGVsc2UgaWYgKCEoZmxhZ3MgJiBJbmplY3RGbGFncy5TZWxmKSkge1xuICAgIHZhbHVlID0gcGFyZW50LmdldCh0b2tlbiwgbm90Rm91bmRWYWx1ZSwgSW5qZWN0RmxhZ3MuRGVmYXVsdCk7XG4gIH0gZWxzZSBpZiAoIShmbGFncyAmIEluamVjdEZsYWdzLk9wdGlvbmFsKSkge1xuICAgIHZhbHVlID0gSW5qZWN0b3IuTlVMTC5nZXQodG9rZW4sIG5vdEZvdW5kVmFsdWUpO1xuICB9IGVsc2Uge1xuICAgIHZhbHVlID0gSW5qZWN0b3IuTlVMTC5nZXQodG9rZW4sIHR5cGVvZiBub3RGb3VuZFZhbHVlICE9PSAndW5kZWZpbmVkJyA/IG5vdEZvdW5kVmFsdWUgOiBudWxsKTtcbiAgfVxuICByZXR1cm4gdmFsdWU7XG59XG5cbmZ1bmN0aW9uIGNvbXB1dGVEZXBzKHByb3ZpZGVyOiBTdGF0aWNQcm92aWRlcik6IERlcGVuZGVuY3lSZWNvcmRbXSB7XG4gIGxldCBkZXBzOiBEZXBlbmRlbmN5UmVjb3JkW10gPSBFTVBUWTtcbiAgY29uc3QgcHJvdmlkZXJEZXBzOiBhbnlbXSA9XG4gICAgICAocHJvdmlkZXIgYXMgRXhpc3RpbmdQcm92aWRlciAmIFN0YXRpY0NsYXNzUHJvdmlkZXIgJiBDb25zdHJ1Y3RvclByb3ZpZGVyKS5kZXBzO1xuICBpZiAocHJvdmlkZXJEZXBzICYmIHByb3ZpZGVyRGVwcy5sZW5ndGgpIHtcbiAgICBkZXBzID0gW107XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwcm92aWRlckRlcHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGxldCBvcHRpb25zID0gT3B0aW9uRmxhZ3MuRGVmYXVsdDtcbiAgICAgIGxldCB0b2tlbiA9IHJlc29sdmVGb3J3YXJkUmVmKHByb3ZpZGVyRGVwc1tpXSk7XG4gICAgICBpZiAoQXJyYXkuaXNBcnJheSh0b2tlbikpIHtcbiAgICAgICAgZm9yIChsZXQgaiA9IDAsIGFubm90YXRpb25zID0gdG9rZW47IGogPCBhbm5vdGF0aW9ucy5sZW5ndGg7IGorKykge1xuICAgICAgICAgIGNvbnN0IGFubm90YXRpb24gPSBhbm5vdGF0aW9uc1tqXTtcbiAgICAgICAgICBpZiAoYW5ub3RhdGlvbiBpbnN0YW5jZW9mIE9wdGlvbmFsIHx8IGFubm90YXRpb24gPT0gT3B0aW9uYWwpIHtcbiAgICAgICAgICAgIG9wdGlvbnMgPSBvcHRpb25zIHwgT3B0aW9uRmxhZ3MuT3B0aW9uYWw7XG4gICAgICAgICAgfSBlbHNlIGlmIChhbm5vdGF0aW9uIGluc3RhbmNlb2YgU2tpcFNlbGYgfHwgYW5ub3RhdGlvbiA9PSBTa2lwU2VsZikge1xuICAgICAgICAgICAgb3B0aW9ucyA9IG9wdGlvbnMgJiB+T3B0aW9uRmxhZ3MuQ2hlY2tTZWxmO1xuICAgICAgICAgIH0gZWxzZSBpZiAoYW5ub3RhdGlvbiBpbnN0YW5jZW9mIFNlbGYgfHwgYW5ub3RhdGlvbiA9PSBTZWxmKSB7XG4gICAgICAgICAgICBvcHRpb25zID0gb3B0aW9ucyAmIH5PcHRpb25GbGFncy5DaGVja1BhcmVudDtcbiAgICAgICAgICB9IGVsc2UgaWYgKGFubm90YXRpb24gaW5zdGFuY2VvZiBJbmplY3QpIHtcbiAgICAgICAgICAgIHRva2VuID0gKGFubm90YXRpb24gYXMgSW5qZWN0KS50b2tlbjtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdG9rZW4gPSByZXNvbHZlRm9yd2FyZFJlZihhbm5vdGF0aW9uKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGRlcHMucHVzaCh7dG9rZW4sIG9wdGlvbnN9KTtcbiAgICB9XG4gIH0gZWxzZSBpZiAoKHByb3ZpZGVyIGFzIEV4aXN0aW5nUHJvdmlkZXIpLnVzZUV4aXN0aW5nKSB7XG4gICAgY29uc3QgdG9rZW4gPSByZXNvbHZlRm9yd2FyZFJlZigocHJvdmlkZXIgYXMgRXhpc3RpbmdQcm92aWRlcikudXNlRXhpc3RpbmcpO1xuICAgIGRlcHMgPSBbe3Rva2VuLCBvcHRpb25zOiBPcHRpb25GbGFncy5EZWZhdWx0fV07XG4gIH0gZWxzZSBpZiAoIXByb3ZpZGVyRGVwcyAmJiAhKFVTRV9WQUxVRSBpbiBwcm92aWRlcikpIHtcbiAgICAvLyB1c2VWYWx1ZSAmIHVzZUV4aXN0aW5nIGFyZSB0aGUgb25seSBvbmVzIHdoaWNoIGFyZSBleGVtcHQgZnJvbSBkZXBzIGFsbCBvdGhlcnMgbmVlZCBpdC5cbiAgICB0aHJvdyBzdGF0aWNFcnJvcignXFwnZGVwc1xcJyByZXF1aXJlZCcsIHByb3ZpZGVyKTtcbiAgfVxuICByZXR1cm4gZGVwcztcbn1cblxuZnVuY3Rpb24gc3RhdGljRXJyb3IodGV4dDogc3RyaW5nLCBvYmo6IGFueSk6IEVycm9yIHtcbiAgcmV0dXJuIG5ldyBFcnJvcihmb3JtYXRFcnJvcih0ZXh0LCBvYmosICdTdGF0aWNJbmplY3RvckVycm9yJykpO1xufVxuIl19