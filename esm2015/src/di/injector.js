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
import { stringify } from '../util/stringify';
import { resolveForwardRef } from './forward_ref';
import { INJECTOR, NG_TEMP_TOKEN_PATH, NullInjector, THROW_IF_NOT_FOUND, USE_VALUE, catchInjectorError, formatError, ɵɵinject } from './injector_compatibility';
import { ɵɵdefineInjectable } from './interface/defs';
import { InjectFlags } from './interface/injector';
import { Inject, Optional, Self, SkipSelf } from './metadata';
import { createInjector } from './r3_injector';
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
 * Concrete injectors implement this interface.
 *
 * For more details, see the ["Dependency Injection Guide"](guide/dependency-injection).
 *
 * \@usageNotes
 * ### Example
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
export class Injector {
    /**
     * Create a new Injector which is configure using `StaticProvider`s.
     *
     * \@usageNotes
     * ### Example
     *
     * {\@example core/di/ts/provider_spec.ts region='ConstructorProvider'}
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
/** @nocollapse */ Injector.ngInjectableDef = ɵɵdefineInjectable({
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
if (false) {
    /** @type {?} */
    Injector.THROW_IF_NOT_FOUND;
    /** @type {?} */
    Injector.NULL;
    /**
     * @nocollapse
     * @type {?}
     */
    Injector.ngInjectableDef;
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
        recursivelyProcessProviders(records, providers);
    }
    /**
     * @param {?} token
     * @param {?=} notFoundValue
     * @param {?=} flags
     * @return {?}
     */
    get(token, notFoundValue, flags = InjectFlags.Default) {
        /** @type {?} */
        const record = this._records.get(token);
        try {
            return tryResolveToken(token, record, this._records, this.parent, notFoundValue, flags);
        }
        catch (e) {
            return catchInjectorError(e, token, 'StaticInjectorError', this.source);
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
    if (provider) {
        provider = resolveForwardRef(provider);
        if (provider instanceof Array) {
            // if we have an array recurse into the array
            for (let i = 0; i < provider.length; i++) {
                recursivelyProcessProviders(records, provider[i]);
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
            records.set(token, resolvedProvider);
        }
        else {
            throw staticError('Unexpected provider', provider);
        }
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
            if (token instanceof Array) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5qZWN0b3IuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9kaS9pbmplY3Rvci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQVNBLE9BQU8sRUFBQyxTQUFTLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUU1QyxPQUFPLEVBQUMsaUJBQWlCLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFFaEQsT0FBTyxFQUFDLFFBQVEsRUFBRSxrQkFBa0IsRUFBRSxZQUFZLEVBQUUsa0JBQWtCLEVBQUUsU0FBUyxFQUFFLGtCQUFrQixFQUFFLFdBQVcsRUFBRSxRQUFRLEVBQUMsTUFBTSwwQkFBMEIsQ0FBQztBQUM5SixPQUFPLEVBQUMsa0JBQWtCLEVBQUMsTUFBTSxrQkFBa0IsQ0FBQztBQUNwRCxPQUFPLEVBQUMsV0FBVyxFQUFDLE1BQU0sc0JBQXNCLENBQUM7QUFFakQsT0FBTyxFQUFDLE1BQU0sRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBQyxNQUFNLFlBQVksQ0FBQztBQUM1RCxPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0sZUFBZSxDQUFDOzs7Ozs7O0FBRTdDLE1BQU0sVUFBVSx1QkFBdUIsQ0FDbkMsU0FBMkIsRUFBRSxNQUE0QixFQUFFLElBQVk7SUFDekUsT0FBTyxJQUFJLGNBQWMsQ0FBQyxTQUFTLEVBQUUsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFDO0FBQ3JELENBQUM7Ozs7Ozs7QUFFRCxNQUFNLFVBQVUsd0JBQXdCLENBQ3BDLFNBQTJCLEVBQUUsTUFBNEIsRUFBRSxJQUFZO0lBQ3pFLE9BQU8sY0FBYyxDQUFDLEVBQUMsSUFBSSxFQUFFLElBQUksRUFBQyxFQUFFLE1BQU0sRUFBRSxTQUFTLEVBQUUsSUFBSSxDQUFDLENBQUM7QUFDL0QsQ0FBQzs7QUFFRCxNQUFNLE9BQU8sYUFBYSxHQUxWLHdCQUtvQzs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FB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QUFFO1FBQ3BELDBGQUEwRjtRQUMxRixNQUFNLFdBQVcsQ0FBQyxtQkFBbUIsRUFBRSxRQUFRLENBQUMsQ0FBQztLQUNsRDtJQUNELE9BQU8sSUFBSSxDQUFDO0FBQ2QsQ0FBQzs7Ozs7O0FBRUQsU0FBUyxXQUFXLENBQUMsSUFBWSxFQUFFLEdBQVE7SUFDekMsT0FBTyxJQUFJLEtBQUssQ0FBQyxXQUFXLENBQUMsSUFBSSxFQUFFLEdBQUcsRUFBRSxxQkFBcUIsQ0FBQyxDQUFDLENBQUM7QUFDbEUsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtBYnN0cmFjdFR5cGUsIFR5cGV9IGZyb20gJy4uL2ludGVyZmFjZS90eXBlJztcbmltcG9ydCB7c3RyaW5naWZ5fSBmcm9tICcuLi91dGlsL3N0cmluZ2lmeSc7XG5cbmltcG9ydCB7cmVzb2x2ZUZvcndhcmRSZWZ9IGZyb20gJy4vZm9yd2FyZF9yZWYnO1xuaW1wb3J0IHtJbmplY3Rpb25Ub2tlbn0gZnJvbSAnLi9pbmplY3Rpb25fdG9rZW4nO1xuaW1wb3J0IHtJTkpFQ1RPUiwgTkdfVEVNUF9UT0tFTl9QQVRILCBOdWxsSW5qZWN0b3IsIFRIUk9XX0lGX05PVF9GT1VORCwgVVNFX1ZBTFVFLCBjYXRjaEluamVjdG9yRXJyb3IsIGZvcm1hdEVycm9yLCDJtcm1aW5qZWN0fSBmcm9tICcuL2luamVjdG9yX2NvbXBhdGliaWxpdHknO1xuaW1wb3J0IHvJtcm1ZGVmaW5lSW5qZWN0YWJsZX0gZnJvbSAnLi9pbnRlcmZhY2UvZGVmcyc7XG5pbXBvcnQge0luamVjdEZsYWdzfSBmcm9tICcuL2ludGVyZmFjZS9pbmplY3Rvcic7XG5pbXBvcnQge0NvbnN0cnVjdG9yUHJvdmlkZXIsIEV4aXN0aW5nUHJvdmlkZXIsIEZhY3RvcnlQcm92aWRlciwgU3RhdGljQ2xhc3NQcm92aWRlciwgU3RhdGljUHJvdmlkZXIsIFZhbHVlUHJvdmlkZXJ9IGZyb20gJy4vaW50ZXJmYWNlL3Byb3ZpZGVyJztcbmltcG9ydCB7SW5qZWN0LCBPcHRpb25hbCwgU2VsZiwgU2tpcFNlbGZ9IGZyb20gJy4vbWV0YWRhdGEnO1xuaW1wb3J0IHtjcmVhdGVJbmplY3Rvcn0gZnJvbSAnLi9yM19pbmplY3Rvcic7XG5cbmV4cG9ydCBmdW5jdGlvbiBJTkpFQ1RPUl9JTVBMX19QUkVfUjNfXyhcbiAgICBwcm92aWRlcnM6IFN0YXRpY1Byb3ZpZGVyW10sIHBhcmVudDogSW5qZWN0b3IgfCB1bmRlZmluZWQsIG5hbWU6IHN0cmluZykge1xuICByZXR1cm4gbmV3IFN0YXRpY0luamVjdG9yKHByb3ZpZGVycywgcGFyZW50LCBuYW1lKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIElOSkVDVE9SX0lNUExfX1BPU1RfUjNfXyhcbiAgICBwcm92aWRlcnM6IFN0YXRpY1Byb3ZpZGVyW10sIHBhcmVudDogSW5qZWN0b3IgfCB1bmRlZmluZWQsIG5hbWU6IHN0cmluZykge1xuICByZXR1cm4gY3JlYXRlSW5qZWN0b3Ioe25hbWU6IG5hbWV9LCBwYXJlbnQsIHByb3ZpZGVycywgbmFtZSk7XG59XG5cbmV4cG9ydCBjb25zdCBJTkpFQ1RPUl9JTVBMID0gSU5KRUNUT1JfSU1QTF9fUFJFX1IzX187XG5cbi8qKlxuICogQ29uY3JldGUgaW5qZWN0b3JzIGltcGxlbWVudCB0aGlzIGludGVyZmFjZS5cbiAqXG4gKiBGb3IgbW9yZSBkZXRhaWxzLCBzZWUgdGhlIFtcIkRlcGVuZGVuY3kgSW5qZWN0aW9uIEd1aWRlXCJdKGd1aWRlL2RlcGVuZGVuY3ktaW5qZWN0aW9uKS5cbiAqXG4gKiBAdXNhZ2VOb3Rlc1xuICogIyMjIEV4YW1wbGVcbiAqXG4gKiB7QGV4YW1wbGUgY29yZS9kaS90cy9pbmplY3Rvcl9zcGVjLnRzIHJlZ2lvbj0nSW5qZWN0b3InfVxuICpcbiAqIGBJbmplY3RvcmAgcmV0dXJucyBpdHNlbGYgd2hlbiBnaXZlbiBgSW5qZWN0b3JgIGFzIGEgdG9rZW46XG4gKlxuICoge0BleGFtcGxlIGNvcmUvZGkvdHMvaW5qZWN0b3Jfc3BlYy50cyByZWdpb249J2luamVjdEluamVjdG9yJ31cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBJbmplY3RvciB7XG4gIHN0YXRpYyBUSFJPV19JRl9OT1RfRk9VTkQgPSBUSFJPV19JRl9OT1RfRk9VTkQ7XG4gIHN0YXRpYyBOVUxMOiBJbmplY3RvciA9IG5ldyBOdWxsSW5qZWN0b3IoKTtcblxuICAvKipcbiAgICogUmV0cmlldmVzIGFuIGluc3RhbmNlIGZyb20gdGhlIGluamVjdG9yIGJhc2VkIG9uIHRoZSBwcm92aWRlZCB0b2tlbi5cbiAgICogQHJldHVybnMgVGhlIGluc3RhbmNlIGZyb20gdGhlIGluamVjdG9yIGlmIGRlZmluZWQsIG90aGVyd2lzZSB0aGUgYG5vdEZvdW5kVmFsdWVgLlxuICAgKiBAdGhyb3dzIFdoZW4gdGhlIGBub3RGb3VuZFZhbHVlYCBpcyBgdW5kZWZpbmVkYCBvciBgSW5qZWN0b3IuVEhST1dfSUZfTk9UX0ZPVU5EYC5cbiAgICovXG4gIGFic3RyYWN0IGdldDxUPihcbiAgICAgIHRva2VuOiBUeXBlPFQ+fEluamVjdGlvblRva2VuPFQ+fEFic3RyYWN0VHlwZTxUPiwgbm90Rm91bmRWYWx1ZT86IFQsIGZsYWdzPzogSW5qZWN0RmxhZ3MpOiBUO1xuICAvKipcbiAgICogQGRlcHJlY2F0ZWQgZnJvbSB2NC4wLjAgdXNlIFR5cGU8VD4gb3IgSW5qZWN0aW9uVG9rZW48VD5cbiAgICogQHN1cHByZXNzIHtkdXBsaWNhdGV9XG4gICAqL1xuICBhYnN0cmFjdCBnZXQodG9rZW46IGFueSwgbm90Rm91bmRWYWx1ZT86IGFueSk6IGFueTtcblxuICAvKipcbiAgICogQGRlcHJlY2F0ZWQgZnJvbSB2NSB1c2UgdGhlIG5ldyBzaWduYXR1cmUgSW5qZWN0b3IuY3JlYXRlKG9wdGlvbnMpXG4gICAqL1xuICBzdGF0aWMgY3JlYXRlKHByb3ZpZGVyczogU3RhdGljUHJvdmlkZXJbXSwgcGFyZW50PzogSW5qZWN0b3IpOiBJbmplY3RvcjtcblxuICBzdGF0aWMgY3JlYXRlKG9wdGlvbnM6IHtwcm92aWRlcnM6IFN0YXRpY1Byb3ZpZGVyW10sIHBhcmVudD86IEluamVjdG9yLCBuYW1lPzogc3RyaW5nfSk6IEluamVjdG9yO1xuXG4gIC8qKlxuICAgKiBDcmVhdGUgYSBuZXcgSW5qZWN0b3Igd2hpY2ggaXMgY29uZmlndXJlIHVzaW5nIGBTdGF0aWNQcm92aWRlcmBzLlxuICAgKlxuICAgKiBAdXNhZ2VOb3Rlc1xuICAgKiAjIyMgRXhhbXBsZVxuICAgKlxuICAgKiB7QGV4YW1wbGUgY29yZS9kaS90cy9wcm92aWRlcl9zcGVjLnRzIHJlZ2lvbj0nQ29uc3RydWN0b3JQcm92aWRlcid9XG4gICAqL1xuICBzdGF0aWMgY3JlYXRlKFxuICAgICAgb3B0aW9uczogU3RhdGljUHJvdmlkZXJbXXx7cHJvdmlkZXJzOiBTdGF0aWNQcm92aWRlcltdLCBwYXJlbnQ/OiBJbmplY3RvciwgbmFtZT86IHN0cmluZ30sXG4gICAgICBwYXJlbnQ/OiBJbmplY3Rvcik6IEluamVjdG9yIHtcbiAgICBpZiAoQXJyYXkuaXNBcnJheShvcHRpb25zKSkge1xuICAgICAgcmV0dXJuIElOSkVDVE9SX0lNUEwob3B0aW9ucywgcGFyZW50LCAnJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBJTkpFQ1RPUl9JTVBMKG9wdGlvbnMucHJvdmlkZXJzLCBvcHRpb25zLnBhcmVudCwgb3B0aW9ucy5uYW1lIHx8ICcnKTtcbiAgICB9XG4gIH1cblxuICAvKiogQG5vY29sbGFwc2UgKi9cbiAgc3RhdGljIG5nSW5qZWN0YWJsZURlZiA9IMm1ybVkZWZpbmVJbmplY3RhYmxlKHtcbiAgICB0b2tlbjogSW5qZWN0b3IsXG4gICAgcHJvdmlkZWRJbjogJ2FueScgYXMgYW55LFxuICAgIGZhY3Rvcnk6ICgpID0+IMm1ybVpbmplY3QoSU5KRUNUT1IpLFxuICB9KTtcblxuICAvKipcbiAgICogQGludGVybmFsXG4gICAqIEBub2NvbGxhcHNlXG4gICAqL1xuICBzdGF0aWMgX19OR19FTEVNRU5UX0lEX18gPSAtMTtcbn1cblxuXG5cbmNvbnN0IElERU5UID0gZnVuY3Rpb248VD4odmFsdWU6IFQpOiBUIHtcbiAgcmV0dXJuIHZhbHVlO1xufTtcbmNvbnN0IEVNUFRZID0gPGFueVtdPltdO1xuY29uc3QgQ0lSQ1VMQVIgPSBJREVOVDtcbmNvbnN0IE1VTFRJX1BST1ZJREVSX0ZOID0gZnVuY3Rpb24oKTogYW55W10ge1xuICByZXR1cm4gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzKTtcbn07XG5cbmNvbnN0IGVudW0gT3B0aW9uRmxhZ3Mge1xuICBPcHRpb25hbCA9IDEgPDwgMCxcbiAgQ2hlY2tTZWxmID0gMSA8PCAxLFxuICBDaGVja1BhcmVudCA9IDEgPDwgMixcbiAgRGVmYXVsdCA9IENoZWNrU2VsZiB8IENoZWNrUGFyZW50XG59XG5jb25zdCBOT19ORVdfTElORSA9ICfJtSc7XG5cbmV4cG9ydCBjbGFzcyBTdGF0aWNJbmplY3RvciBpbXBsZW1lbnRzIEluamVjdG9yIHtcbiAgcmVhZG9ubHkgcGFyZW50OiBJbmplY3RvcjtcbiAgcmVhZG9ubHkgc291cmNlOiBzdHJpbmd8bnVsbDtcblxuICBwcml2YXRlIF9yZWNvcmRzOiBNYXA8YW55LCBSZWNvcmQ+O1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgICAgcHJvdmlkZXJzOiBTdGF0aWNQcm92aWRlcltdLCBwYXJlbnQ6IEluamVjdG9yID0gSW5qZWN0b3IuTlVMTCwgc291cmNlOiBzdHJpbmd8bnVsbCA9IG51bGwpIHtcbiAgICB0aGlzLnBhcmVudCA9IHBhcmVudDtcbiAgICB0aGlzLnNvdXJjZSA9IHNvdXJjZTtcbiAgICBjb25zdCByZWNvcmRzID0gdGhpcy5fcmVjb3JkcyA9IG5ldyBNYXA8YW55LCBSZWNvcmQ+KCk7XG4gICAgcmVjb3Jkcy5zZXQoXG4gICAgICAgIEluamVjdG9yLCA8UmVjb3JkPnt0b2tlbjogSW5qZWN0b3IsIGZuOiBJREVOVCwgZGVwczogRU1QVFksIHZhbHVlOiB0aGlzLCB1c2VOZXc6IGZhbHNlfSk7XG4gICAgcmVjb3Jkcy5zZXQoXG4gICAgICAgIElOSkVDVE9SLCA8UmVjb3JkPnt0b2tlbjogSU5KRUNUT1IsIGZuOiBJREVOVCwgZGVwczogRU1QVFksIHZhbHVlOiB0aGlzLCB1c2VOZXc6IGZhbHNlfSk7XG4gICAgcmVjdXJzaXZlbHlQcm9jZXNzUHJvdmlkZXJzKHJlY29yZHMsIHByb3ZpZGVycyk7XG4gIH1cblxuICBnZXQ8VD4odG9rZW46IFR5cGU8VD58SW5qZWN0aW9uVG9rZW48VD4sIG5vdEZvdW5kVmFsdWU/OiBULCBmbGFncz86IEluamVjdEZsYWdzKTogVDtcbiAgZ2V0KHRva2VuOiBhbnksIG5vdEZvdW5kVmFsdWU/OiBhbnkpOiBhbnk7XG4gIGdldCh0b2tlbjogYW55LCBub3RGb3VuZFZhbHVlPzogYW55LCBmbGFnczogSW5qZWN0RmxhZ3MgPSBJbmplY3RGbGFncy5EZWZhdWx0KTogYW55IHtcbiAgICBjb25zdCByZWNvcmQgPSB0aGlzLl9yZWNvcmRzLmdldCh0b2tlbik7XG4gICAgdHJ5IHtcbiAgICAgIHJldHVybiB0cnlSZXNvbHZlVG9rZW4odG9rZW4sIHJlY29yZCwgdGhpcy5fcmVjb3JkcywgdGhpcy5wYXJlbnQsIG5vdEZvdW5kVmFsdWUsIGZsYWdzKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICByZXR1cm4gY2F0Y2hJbmplY3RvckVycm9yKGUsIHRva2VuLCAnU3RhdGljSW5qZWN0b3JFcnJvcicsIHRoaXMuc291cmNlKTtcbiAgICB9XG4gIH1cblxuICB0b1N0cmluZygpIHtcbiAgICBjb25zdCB0b2tlbnMgPSA8c3RyaW5nW10+W10sIHJlY29yZHMgPSB0aGlzLl9yZWNvcmRzO1xuICAgIHJlY29yZHMuZm9yRWFjaCgodiwgdG9rZW4pID0+IHRva2Vucy5wdXNoKHN0cmluZ2lmeSh0b2tlbikpKTtcbiAgICByZXR1cm4gYFN0YXRpY0luamVjdG9yWyR7dG9rZW5zLmpvaW4oJywgJyl9XWA7XG4gIH1cbn1cblxudHlwZSBTdXBwb3J0ZWRQcm92aWRlciA9XG4gICAgVmFsdWVQcm92aWRlciB8IEV4aXN0aW5nUHJvdmlkZXIgfCBTdGF0aWNDbGFzc1Byb3ZpZGVyIHwgQ29uc3RydWN0b3JQcm92aWRlciB8IEZhY3RvcnlQcm92aWRlcjtcblxuaW50ZXJmYWNlIFJlY29yZCB7XG4gIGZuOiBGdW5jdGlvbjtcbiAgdXNlTmV3OiBib29sZWFuO1xuICBkZXBzOiBEZXBlbmRlbmN5UmVjb3JkW107XG4gIHZhbHVlOiBhbnk7XG59XG5cbmludGVyZmFjZSBEZXBlbmRlbmN5UmVjb3JkIHtcbiAgdG9rZW46IGFueTtcbiAgb3B0aW9uczogbnVtYmVyO1xufVxuXG5mdW5jdGlvbiByZXNvbHZlUHJvdmlkZXIocHJvdmlkZXI6IFN1cHBvcnRlZFByb3ZpZGVyKTogUmVjb3JkIHtcbiAgY29uc3QgZGVwcyA9IGNvbXB1dGVEZXBzKHByb3ZpZGVyKTtcbiAgbGV0IGZuOiBGdW5jdGlvbiA9IElERU5UO1xuICBsZXQgdmFsdWU6IGFueSA9IEVNUFRZO1xuICBsZXQgdXNlTmV3OiBib29sZWFuID0gZmFsc2U7XG4gIGxldCBwcm92aWRlID0gcmVzb2x2ZUZvcndhcmRSZWYocHJvdmlkZXIucHJvdmlkZSk7XG4gIGlmIChVU0VfVkFMVUUgaW4gcHJvdmlkZXIpIHtcbiAgICAvLyBXZSBuZWVkIHRvIHVzZSBVU0VfVkFMVUUgaW4gcHJvdmlkZXIgc2luY2UgcHJvdmlkZXIudXNlVmFsdWUgY291bGQgYmUgZGVmaW5lZCBhcyB1bmRlZmluZWQuXG4gICAgdmFsdWUgPSAocHJvdmlkZXIgYXMgVmFsdWVQcm92aWRlcikudXNlVmFsdWU7XG4gIH0gZWxzZSBpZiAoKHByb3ZpZGVyIGFzIEZhY3RvcnlQcm92aWRlcikudXNlRmFjdG9yeSkge1xuICAgIGZuID0gKHByb3ZpZGVyIGFzIEZhY3RvcnlQcm92aWRlcikudXNlRmFjdG9yeTtcbiAgfSBlbHNlIGlmICgocHJvdmlkZXIgYXMgRXhpc3RpbmdQcm92aWRlcikudXNlRXhpc3RpbmcpIHtcbiAgICAvLyBKdXN0IHVzZSBJREVOVFxuICB9IGVsc2UgaWYgKChwcm92aWRlciBhcyBTdGF0aWNDbGFzc1Byb3ZpZGVyKS51c2VDbGFzcykge1xuICAgIHVzZU5ldyA9IHRydWU7XG4gICAgZm4gPSByZXNvbHZlRm9yd2FyZFJlZigocHJvdmlkZXIgYXMgU3RhdGljQ2xhc3NQcm92aWRlcikudXNlQ2xhc3MpO1xuICB9IGVsc2UgaWYgKHR5cGVvZiBwcm92aWRlID09ICdmdW5jdGlvbicpIHtcbiAgICB1c2VOZXcgPSB0cnVlO1xuICAgIGZuID0gcHJvdmlkZTtcbiAgfSBlbHNlIHtcbiAgICB0aHJvdyBzdGF0aWNFcnJvcihcbiAgICAgICAgJ1N0YXRpY1Byb3ZpZGVyIGRvZXMgbm90IGhhdmUgW3VzZVZhbHVlfHVzZUZhY3Rvcnl8dXNlRXhpc3Rpbmd8dXNlQ2xhc3NdIG9yIFtwcm92aWRlXSBpcyBub3QgbmV3YWJsZScsXG4gICAgICAgIHByb3ZpZGVyKTtcbiAgfVxuICByZXR1cm4ge2RlcHMsIGZuLCB1c2VOZXcsIHZhbHVlfTtcbn1cblxuZnVuY3Rpb24gbXVsdGlQcm92aWRlck1peEVycm9yKHRva2VuOiBhbnkpIHtcbiAgcmV0dXJuIHN0YXRpY0Vycm9yKCdDYW5ub3QgbWl4IG11bHRpIHByb3ZpZGVycyBhbmQgcmVndWxhciBwcm92aWRlcnMnLCB0b2tlbik7XG59XG5cbmZ1bmN0aW9uIHJlY3Vyc2l2ZWx5UHJvY2Vzc1Byb3ZpZGVycyhyZWNvcmRzOiBNYXA8YW55LCBSZWNvcmQ+LCBwcm92aWRlcjogU3RhdGljUHJvdmlkZXIpIHtcbiAgaWYgKHByb3ZpZGVyKSB7XG4gICAgcHJvdmlkZXIgPSByZXNvbHZlRm9yd2FyZFJlZihwcm92aWRlcik7XG4gICAgaWYgKHByb3ZpZGVyIGluc3RhbmNlb2YgQXJyYXkpIHtcbiAgICAgIC8vIGlmIHdlIGhhdmUgYW4gYXJyYXkgcmVjdXJzZSBpbnRvIHRoZSBhcnJheVxuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwcm92aWRlci5sZW5ndGg7IGkrKykge1xuICAgICAgICByZWN1cnNpdmVseVByb2Nlc3NQcm92aWRlcnMocmVjb3JkcywgcHJvdmlkZXJbaV0pO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAodHlwZW9mIHByb3ZpZGVyID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAvLyBGdW5jdGlvbnMgd2VyZSBzdXBwb3J0ZWQgaW4gUmVmbGVjdGl2ZUluamVjdG9yLCBidXQgYXJlIG5vdCBoZXJlLiBGb3Igc2FmZXR5IGdpdmUgdXNlZnVsXG4gICAgICAvLyBlcnJvciBtZXNzYWdlc1xuICAgICAgdGhyb3cgc3RhdGljRXJyb3IoJ0Z1bmN0aW9uL0NsYXNzIG5vdCBzdXBwb3J0ZWQnLCBwcm92aWRlcik7XG4gICAgfSBlbHNlIGlmIChwcm92aWRlciAmJiB0eXBlb2YgcHJvdmlkZXIgPT09ICdvYmplY3QnICYmIHByb3ZpZGVyLnByb3ZpZGUpIHtcbiAgICAgIC8vIEF0IHRoaXMgcG9pbnQgd2UgaGF2ZSB3aGF0IGxvb2tzIGxpa2UgYSBwcm92aWRlcjoge3Byb3ZpZGU6ID8sIC4uLi59XG4gICAgICBsZXQgdG9rZW4gPSByZXNvbHZlRm9yd2FyZFJlZihwcm92aWRlci5wcm92aWRlKTtcbiAgICAgIGNvbnN0IHJlc29sdmVkUHJvdmlkZXIgPSByZXNvbHZlUHJvdmlkZXIocHJvdmlkZXIpO1xuICAgICAgaWYgKHByb3ZpZGVyLm11bHRpID09PSB0cnVlKSB7XG4gICAgICAgIC8vIFRoaXMgaXMgYSBtdWx0aSBwcm92aWRlci5cbiAgICAgICAgbGV0IG11bHRpUHJvdmlkZXI6IFJlY29yZHx1bmRlZmluZWQgPSByZWNvcmRzLmdldCh0b2tlbik7XG4gICAgICAgIGlmIChtdWx0aVByb3ZpZGVyKSB7XG4gICAgICAgICAgaWYgKG11bHRpUHJvdmlkZXIuZm4gIT09IE1VTFRJX1BST1ZJREVSX0ZOKSB7XG4gICAgICAgICAgICB0aHJvdyBtdWx0aVByb3ZpZGVyTWl4RXJyb3IodG9rZW4pO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBDcmVhdGUgYSBwbGFjZWhvbGRlciBmYWN0b3J5IHdoaWNoIHdpbGwgbG9vayB1cCB0aGUgY29uc3RpdHVlbnRzIG9mIHRoZSBtdWx0aSBwcm92aWRlci5cbiAgICAgICAgICByZWNvcmRzLnNldCh0b2tlbiwgbXVsdGlQcm92aWRlciA9IDxSZWNvcmQ+e1xuICAgICAgICAgICAgdG9rZW46IHByb3ZpZGVyLnByb3ZpZGUsXG4gICAgICAgICAgICBkZXBzOiBbXSxcbiAgICAgICAgICAgIHVzZU5ldzogZmFsc2UsXG4gICAgICAgICAgICBmbjogTVVMVElfUFJPVklERVJfRk4sXG4gICAgICAgICAgICB2YWx1ZTogRU1QVFlcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICAvLyBUcmVhdCB0aGUgcHJvdmlkZXIgYXMgdGhlIHRva2VuLlxuICAgICAgICB0b2tlbiA9IHByb3ZpZGVyO1xuICAgICAgICBtdWx0aVByb3ZpZGVyLmRlcHMucHVzaCh7dG9rZW4sIG9wdGlvbnM6IE9wdGlvbkZsYWdzLkRlZmF1bHR9KTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IHJlY29yZCA9IHJlY29yZHMuZ2V0KHRva2VuKTtcbiAgICAgIGlmIChyZWNvcmQgJiYgcmVjb3JkLmZuID09IE1VTFRJX1BST1ZJREVSX0ZOKSB7XG4gICAgICAgIHRocm93IG11bHRpUHJvdmlkZXJNaXhFcnJvcih0b2tlbik7XG4gICAgICB9XG4gICAgICByZWNvcmRzLnNldCh0b2tlbiwgcmVzb2x2ZWRQcm92aWRlcik7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IHN0YXRpY0Vycm9yKCdVbmV4cGVjdGVkIHByb3ZpZGVyJywgcHJvdmlkZXIpO1xuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiB0cnlSZXNvbHZlVG9rZW4oXG4gICAgdG9rZW46IGFueSwgcmVjb3JkOiBSZWNvcmQgfCB1bmRlZmluZWQsIHJlY29yZHM6IE1hcDxhbnksIFJlY29yZD4sIHBhcmVudDogSW5qZWN0b3IsXG4gICAgbm90Rm91bmRWYWx1ZTogYW55LCBmbGFnczogSW5qZWN0RmxhZ3MpOiBhbnkge1xuICB0cnkge1xuICAgIHJldHVybiByZXNvbHZlVG9rZW4odG9rZW4sIHJlY29yZCwgcmVjb3JkcywgcGFyZW50LCBub3RGb3VuZFZhbHVlLCBmbGFncyk7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICAvLyBlbnN1cmUgdGhhdCAnZScgaXMgb2YgdHlwZSBFcnJvci5cbiAgICBpZiAoIShlIGluc3RhbmNlb2YgRXJyb3IpKSB7XG4gICAgICBlID0gbmV3IEVycm9yKGUpO1xuICAgIH1cbiAgICBjb25zdCBwYXRoOiBhbnlbXSA9IGVbTkdfVEVNUF9UT0tFTl9QQVRIXSA9IGVbTkdfVEVNUF9UT0tFTl9QQVRIXSB8fCBbXTtcbiAgICBwYXRoLnVuc2hpZnQodG9rZW4pO1xuICAgIGlmIChyZWNvcmQgJiYgcmVjb3JkLnZhbHVlID09IENJUkNVTEFSKSB7XG4gICAgICAvLyBSZXNldCB0aGUgQ2lyY3VsYXIgZmxhZy5cbiAgICAgIHJlY29yZC52YWx1ZSA9IEVNUFRZO1xuICAgIH1cbiAgICB0aHJvdyBlO1xuICB9XG59XG5cbmZ1bmN0aW9uIHJlc29sdmVUb2tlbihcbiAgICB0b2tlbjogYW55LCByZWNvcmQ6IFJlY29yZCB8IHVuZGVmaW5lZCwgcmVjb3JkczogTWFwPGFueSwgUmVjb3JkPiwgcGFyZW50OiBJbmplY3RvcixcbiAgICBub3RGb3VuZFZhbHVlOiBhbnksIGZsYWdzOiBJbmplY3RGbGFncyk6IGFueSB7XG4gIGxldCB2YWx1ZTtcbiAgaWYgKHJlY29yZCAmJiAhKGZsYWdzICYgSW5qZWN0RmxhZ3MuU2tpcFNlbGYpKSB7XG4gICAgLy8gSWYgd2UgZG9uJ3QgaGF2ZSBhIHJlY29yZCwgdGhpcyBpbXBsaWVzIHRoYXQgd2UgZG9uJ3Qgb3duIHRoZSBwcm92aWRlciBoZW5jZSBkb24ndCBrbm93IGhvd1xuICAgIC8vIHRvIHJlc29sdmUgaXQuXG4gICAgdmFsdWUgPSByZWNvcmQudmFsdWU7XG4gICAgaWYgKHZhbHVlID09IENJUkNVTEFSKSB7XG4gICAgICB0aHJvdyBFcnJvcihOT19ORVdfTElORSArICdDaXJjdWxhciBkZXBlbmRlbmN5Jyk7XG4gICAgfSBlbHNlIGlmICh2YWx1ZSA9PT0gRU1QVFkpIHtcbiAgICAgIHJlY29yZC52YWx1ZSA9IENJUkNVTEFSO1xuICAgICAgbGV0IG9iaiA9IHVuZGVmaW5lZDtcbiAgICAgIGxldCB1c2VOZXcgPSByZWNvcmQudXNlTmV3O1xuICAgICAgbGV0IGZuID0gcmVjb3JkLmZuO1xuICAgICAgbGV0IGRlcFJlY29yZHMgPSByZWNvcmQuZGVwcztcbiAgICAgIGxldCBkZXBzID0gRU1QVFk7XG4gICAgICBpZiAoZGVwUmVjb3Jkcy5sZW5ndGgpIHtcbiAgICAgICAgZGVwcyA9IFtdO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRlcFJlY29yZHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBjb25zdCBkZXBSZWNvcmQ6IERlcGVuZGVuY3lSZWNvcmQgPSBkZXBSZWNvcmRzW2ldO1xuICAgICAgICAgIGNvbnN0IG9wdGlvbnMgPSBkZXBSZWNvcmQub3B0aW9ucztcbiAgICAgICAgICBjb25zdCBjaGlsZFJlY29yZCA9XG4gICAgICAgICAgICAgIG9wdGlvbnMgJiBPcHRpb25GbGFncy5DaGVja1NlbGYgPyByZWNvcmRzLmdldChkZXBSZWNvcmQudG9rZW4pIDogdW5kZWZpbmVkO1xuICAgICAgICAgIGRlcHMucHVzaCh0cnlSZXNvbHZlVG9rZW4oXG4gICAgICAgICAgICAgIC8vIEN1cnJlbnQgVG9rZW4gdG8gcmVzb2x2ZVxuICAgICAgICAgICAgICBkZXBSZWNvcmQudG9rZW4sXG4gICAgICAgICAgICAgIC8vIEEgcmVjb3JkIHdoaWNoIGRlc2NyaWJlcyBob3cgdG8gcmVzb2x2ZSB0aGUgdG9rZW4uXG4gICAgICAgICAgICAgIC8vIElmIHVuZGVmaW5lZCwgdGhpcyBtZWFucyB3ZSBkb24ndCBoYXZlIHN1Y2ggYSByZWNvcmRcbiAgICAgICAgICAgICAgY2hpbGRSZWNvcmQsXG4gICAgICAgICAgICAgIC8vIE90aGVyIHJlY29yZHMgd2Uga25vdyBhYm91dC5cbiAgICAgICAgICAgICAgcmVjb3JkcyxcbiAgICAgICAgICAgICAgLy8gSWYgd2UgZG9uJ3Qga25vdyBob3cgdG8gcmVzb2x2ZSBkZXBlbmRlbmN5IGFuZCB3ZSBzaG91bGQgbm90IGNoZWNrIHBhcmVudCBmb3IgaXQsXG4gICAgICAgICAgICAgIC8vIHRoYW4gcGFzcyBpbiBOdWxsIGluamVjdG9yLlxuICAgICAgICAgICAgICAhY2hpbGRSZWNvcmQgJiYgIShvcHRpb25zICYgT3B0aW9uRmxhZ3MuQ2hlY2tQYXJlbnQpID8gSW5qZWN0b3IuTlVMTCA6IHBhcmVudCxcbiAgICAgICAgICAgICAgb3B0aW9ucyAmIE9wdGlvbkZsYWdzLk9wdGlvbmFsID8gbnVsbCA6IEluamVjdG9yLlRIUk9XX0lGX05PVF9GT1VORCxcbiAgICAgICAgICAgICAgSW5qZWN0RmxhZ3MuRGVmYXVsdCkpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZWNvcmQudmFsdWUgPSB2YWx1ZSA9IHVzZU5ldyA/IG5ldyAoZm4gYXMgYW55KSguLi5kZXBzKSA6IGZuLmFwcGx5KG9iaiwgZGVwcyk7XG4gICAgfVxuICB9IGVsc2UgaWYgKCEoZmxhZ3MgJiBJbmplY3RGbGFncy5TZWxmKSkge1xuICAgIHZhbHVlID0gcGFyZW50LmdldCh0b2tlbiwgbm90Rm91bmRWYWx1ZSwgSW5qZWN0RmxhZ3MuRGVmYXVsdCk7XG4gIH1cbiAgcmV0dXJuIHZhbHVlO1xufVxuXG5mdW5jdGlvbiBjb21wdXRlRGVwcyhwcm92aWRlcjogU3RhdGljUHJvdmlkZXIpOiBEZXBlbmRlbmN5UmVjb3JkW10ge1xuICBsZXQgZGVwczogRGVwZW5kZW5jeVJlY29yZFtdID0gRU1QVFk7XG4gIGNvbnN0IHByb3ZpZGVyRGVwczogYW55W10gPVxuICAgICAgKHByb3ZpZGVyIGFzIEV4aXN0aW5nUHJvdmlkZXIgJiBTdGF0aWNDbGFzc1Byb3ZpZGVyICYgQ29uc3RydWN0b3JQcm92aWRlcikuZGVwcztcbiAgaWYgKHByb3ZpZGVyRGVwcyAmJiBwcm92aWRlckRlcHMubGVuZ3RoKSB7XG4gICAgZGVwcyA9IFtdO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcHJvdmlkZXJEZXBzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBsZXQgb3B0aW9ucyA9IE9wdGlvbkZsYWdzLkRlZmF1bHQ7XG4gICAgICBsZXQgdG9rZW4gPSByZXNvbHZlRm9yd2FyZFJlZihwcm92aWRlckRlcHNbaV0pO1xuICAgICAgaWYgKHRva2VuIGluc3RhbmNlb2YgQXJyYXkpIHtcbiAgICAgICAgZm9yIChsZXQgaiA9IDAsIGFubm90YXRpb25zID0gdG9rZW47IGogPCBhbm5vdGF0aW9ucy5sZW5ndGg7IGorKykge1xuICAgICAgICAgIGNvbnN0IGFubm90YXRpb24gPSBhbm5vdGF0aW9uc1tqXTtcbiAgICAgICAgICBpZiAoYW5ub3RhdGlvbiBpbnN0YW5jZW9mIE9wdGlvbmFsIHx8IGFubm90YXRpb24gPT0gT3B0aW9uYWwpIHtcbiAgICAgICAgICAgIG9wdGlvbnMgPSBvcHRpb25zIHwgT3B0aW9uRmxhZ3MuT3B0aW9uYWw7XG4gICAgICAgICAgfSBlbHNlIGlmIChhbm5vdGF0aW9uIGluc3RhbmNlb2YgU2tpcFNlbGYgfHwgYW5ub3RhdGlvbiA9PSBTa2lwU2VsZikge1xuICAgICAgICAgICAgb3B0aW9ucyA9IG9wdGlvbnMgJiB+T3B0aW9uRmxhZ3MuQ2hlY2tTZWxmO1xuICAgICAgICAgIH0gZWxzZSBpZiAoYW5ub3RhdGlvbiBpbnN0YW5jZW9mIFNlbGYgfHwgYW5ub3RhdGlvbiA9PSBTZWxmKSB7XG4gICAgICAgICAgICBvcHRpb25zID0gb3B0aW9ucyAmIH5PcHRpb25GbGFncy5DaGVja1BhcmVudDtcbiAgICAgICAgICB9IGVsc2UgaWYgKGFubm90YXRpb24gaW5zdGFuY2VvZiBJbmplY3QpIHtcbiAgICAgICAgICAgIHRva2VuID0gKGFubm90YXRpb24gYXMgSW5qZWN0KS50b2tlbjtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdG9rZW4gPSByZXNvbHZlRm9yd2FyZFJlZihhbm5vdGF0aW9uKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGRlcHMucHVzaCh7dG9rZW4sIG9wdGlvbnN9KTtcbiAgICB9XG4gIH0gZWxzZSBpZiAoKHByb3ZpZGVyIGFzIEV4aXN0aW5nUHJvdmlkZXIpLnVzZUV4aXN0aW5nKSB7XG4gICAgY29uc3QgdG9rZW4gPSByZXNvbHZlRm9yd2FyZFJlZigocHJvdmlkZXIgYXMgRXhpc3RpbmdQcm92aWRlcikudXNlRXhpc3RpbmcpO1xuICAgIGRlcHMgPSBbe3Rva2VuLCBvcHRpb25zOiBPcHRpb25GbGFncy5EZWZhdWx0fV07XG4gIH0gZWxzZSBpZiAoIXByb3ZpZGVyRGVwcyAmJiAhKFVTRV9WQUxVRSBpbiBwcm92aWRlcikpIHtcbiAgICAvLyB1c2VWYWx1ZSAmIHVzZUV4aXN0aW5nIGFyZSB0aGUgb25seSBvbmVzIHdoaWNoIGFyZSBleGVtcHQgZnJvbSBkZXBzIGFsbCBvdGhlcnMgbmVlZCBpdC5cbiAgICB0aHJvdyBzdGF0aWNFcnJvcignXFwnZGVwc1xcJyByZXF1aXJlZCcsIHByb3ZpZGVyKTtcbiAgfVxuICByZXR1cm4gZGVwcztcbn1cblxuZnVuY3Rpb24gc3RhdGljRXJyb3IodGV4dDogc3RyaW5nLCBvYmo6IGFueSk6IEVycm9yIHtcbiAgcmV0dXJuIG5ldyBFcnJvcihmb3JtYXRFcnJvcih0ZXh0LCBvYmosICdTdGF0aWNJbmplY3RvckVycm9yJykpO1xufVxuIl19