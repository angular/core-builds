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
import { getClosureSafeProperty } from '../util/property';
import { stringify } from '../util/stringify';
import { resolveForwardRef } from './forward_ref';
import { InjectionToken } from './injection_token';
import { ɵɵinject } from './injector_compatibility';
import { ɵɵdefineInjectable } from './interface/defs';
import { InjectFlags } from './interface/injector';
import { Inject, Optional, Self, SkipSelf } from './metadata';
/** @type {?} */
export const SOURCE = '__source';
/** @type {?} */
const _THROW_IF_NOT_FOUND = new Object();
/** @type {?} */
export const THROW_IF_NOT_FOUND = _THROW_IF_NOT_FOUND;
/**
 * An InjectionToken that gets the current `Injector` for `createInjector()`-style injectors.
 *
 * Requesting this token instead of `Injector` allows `StaticInjector` to be tree-shaken from a
 * project.
 *
 * \@publicApi
 * @type {?}
 */
export const INJECTOR = new InjectionToken('INJECTOR', (/** @type {?} */ (-1)));
export class NullInjector {
    /**
     * @param {?} token
     * @param {?=} notFoundValue
     * @return {?}
     */
    get(token, notFoundValue = _THROW_IF_NOT_FOUND) {
        if (notFoundValue === _THROW_IF_NOT_FOUND) {
            // Intentionally left behind: With dev tools open the debugger will stop here. There is no
            // reason why correctly written application should cause this exception.
            // TODO(misko): uncomment the next line once `ngDevMode` works with closure.
            // if(ngDevMode) debugger;
            /** @type {?} */
            const error = new Error(`NullInjectorError: No provider for ${stringify(token)}!`);
            error.name = 'NullInjectorError';
            throw error;
        }
        return notFoundValue;
    }
}
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
            return new StaticInjector(options, parent);
        }
        else {
            return new StaticInjector(options.providers, options.parent, options.name || null);
        }
    }
}
Injector.THROW_IF_NOT_FOUND = _THROW_IF_NOT_FOUND;
Injector.NULL = new NullInjector();
/** @nocollapse */
/** @nocollapse */ Injector.ngInjectableDef = ɵɵdefineInjectable({
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
const ɵ0 = IDENT;
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
const ɵ1 = MULTI_PROVIDER_FN;
const ɵ2 = getClosureSafeProperty;
/** @type {?} */
export const USE_VALUE = getClosureSafeProperty({ provide: String, useValue: ɵ2 });
/** @type {?} */
const NG_TOKEN_PATH = 'ngTokenPath';
/** @type {?} */
export const NG_TEMP_TOKEN_PATH = 'ngTempTokenPath';
/** @enum {number} */
const OptionFlags = {
    Optional: 1,
    CheckSelf: 2,
    CheckParent: 4,
    Default: 6,
};
/** @type {?} */
const NULL_INJECTOR = Injector.NULL;
/** @type {?} */
const NEW_LINE = /\n/gm;
/** @type {?} */
const NO_NEW_LINE = 'ɵ';
export class StaticInjector {
    /**
     * @param {?} providers
     * @param {?=} parent
     * @param {?=} source
     */
    constructor(providers, parent = NULL_INJECTOR, source = null) {
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
                    !childRecord && !(options & 4 /* CheckParent */) ? NULL_INJECTOR : parent, options & 1 /* Optional */ ? null : Injector.THROW_IF_NOT_FOUND, InjectFlags.Default));
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
 * @param {?} e
 * @param {?} token
 * @param {?} injectorErrorName
 * @param {?} source
 * @return {?}
 */
export function catchInjectorError(e, token, injectorErrorName, source) {
    /** @type {?} */
    const tokenPath = e[NG_TEMP_TOKEN_PATH];
    if (token[SOURCE]) {
        tokenPath.unshift(token[SOURCE]);
    }
    e.message = formatError('\n' + e.message, tokenPath, injectorErrorName, source);
    e[NG_TOKEN_PATH] = tokenPath;
    e[NG_TEMP_TOKEN_PATH] = null;
    throw e;
}
/**
 * @param {?} text
 * @param {?} obj
 * @param {?} injectorErrorName
 * @param {?=} source
 * @return {?}
 */
function formatError(text, obj, injectorErrorName, source = null) {
    text = text && text.charAt(0) === '\n' && text.charAt(1) == NO_NEW_LINE ? text.substr(2) : text;
    /** @type {?} */
    let context = stringify(obj);
    if (obj instanceof Array) {
        context = obj.map(stringify).join(' -> ');
    }
    else if (typeof obj === 'object') {
        /** @type {?} */
        let parts = (/** @type {?} */ ([]));
        for (let key in obj) {
            if (obj.hasOwnProperty(key)) {
                /** @type {?} */
                let value = obj[key];
                parts.push(key + ':' + (typeof value === 'string' ? JSON.stringify(value) : stringify(value)));
            }
        }
        context = `{${parts.join(', ')}}`;
    }
    return `${injectorErrorName}${source ? '(' + source + ')' : ''}[${context}]: ${text.replace(NEW_LINE, '\n  ')}`;
}
/**
 * @param {?} text
 * @param {?} obj
 * @return {?}
 */
function staticError(text, obj) {
    return new Error(formatError(text, obj, 'StaticInjectorError'));
}
export { ɵ0, ɵ1, ɵ2 };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5qZWN0b3IuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9kaS9pbmplY3Rvci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQVNBLE9BQU8sRUFBQyxzQkFBc0IsRUFBQyxNQUFNLGtCQUFrQixDQUFDO0FBQ3hELE9BQU8sRUFBQyxTQUFTLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUM1QyxPQUFPLEVBQUMsaUJBQWlCLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFDaEQsT0FBTyxFQUFDLGNBQWMsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQ2pELE9BQU8sRUFBQyxRQUFRLEVBQUMsTUFBTSwwQkFBMEIsQ0FBQztBQUNsRCxPQUFPLEVBQUMsa0JBQWtCLEVBQUMsTUFBTSxrQkFBa0IsQ0FBQztBQUNwRCxPQUFPLEVBQUMsV0FBVyxFQUFDLE1BQU0sc0JBQXNCLENBQUM7QUFFakQsT0FBTyxFQUFDLE1BQU0sRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBQyxNQUFNLFlBQVksQ0FBQzs7QUFFNUQsTUFBTSxPQUFPLE1BQU0sR0FBRyxVQUFVOztNQUMxQixtQkFBbUIsR0FBRyxJQUFJLE1BQU0sRUFBRTs7QUFDeEMsTUFBTSxPQUFPLGtCQUFrQixHQUFHLG1CQUFtQjs7Ozs7Ozs7OztBQVVyRCxNQUFNLE9BQU8sUUFBUSxHQUFHLElBQUksY0FBYyxDQUN0QyxVQUFVLEVBQ1YsbUJBQUEsQ0FBQyxDQUFDLEVBQU8sQ0FDUjtBQUVMLE1BQU0sT0FBTyxZQUFZOzs7Ozs7SUFDdkIsR0FBRyxDQUFDLEtBQVUsRUFBRSxnQkFBcUIsbUJBQW1CO1FBQ3RELElBQUksYUFBYSxLQUFLLG1CQUFtQixFQUFFOzs7Ozs7a0JBS25DLEtBQUssR0FBRyxJQUFJLEtBQUssQ0FBQyxzQ0FBc0MsU0FBUyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUM7WUFDbEYsS0FBSyxD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QUFDbEgsQ0FBQzs7Ozs7O0FBRUQsU0FBUyxXQUFXLENBQUMsSUFBWSxFQUFFLEdBQVE7SUFDekMsT0FBTyxJQUFJLEtBQUssQ0FBQyxXQUFXLENBQUMsSUFBSSxFQUFFLEdBQUcsRUFBRSxxQkFBcUIsQ0FBQyxDQUFDLENBQUM7QUFDbEUsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtUeXBlfSBmcm9tICcuLi9pbnRlcmZhY2UvdHlwZSc7XG5pbXBvcnQge2dldENsb3N1cmVTYWZlUHJvcGVydHl9IGZyb20gJy4uL3V0aWwvcHJvcGVydHknO1xuaW1wb3J0IHtzdHJpbmdpZnl9IGZyb20gJy4uL3V0aWwvc3RyaW5naWZ5JztcbmltcG9ydCB7cmVzb2x2ZUZvcndhcmRSZWZ9IGZyb20gJy4vZm9yd2FyZF9yZWYnO1xuaW1wb3J0IHtJbmplY3Rpb25Ub2tlbn0gZnJvbSAnLi9pbmplY3Rpb25fdG9rZW4nO1xuaW1wb3J0IHvJtcm1aW5qZWN0fSBmcm9tICcuL2luamVjdG9yX2NvbXBhdGliaWxpdHknO1xuaW1wb3J0IHvJtcm1ZGVmaW5lSW5qZWN0YWJsZX0gZnJvbSAnLi9pbnRlcmZhY2UvZGVmcyc7XG5pbXBvcnQge0luamVjdEZsYWdzfSBmcm9tICcuL2ludGVyZmFjZS9pbmplY3Rvcic7XG5pbXBvcnQge0NvbnN0cnVjdG9yUHJvdmlkZXIsIEV4aXN0aW5nUHJvdmlkZXIsIEZhY3RvcnlQcm92aWRlciwgU3RhdGljQ2xhc3NQcm92aWRlciwgU3RhdGljUHJvdmlkZXIsIFZhbHVlUHJvdmlkZXJ9IGZyb20gJy4vaW50ZXJmYWNlL3Byb3ZpZGVyJztcbmltcG9ydCB7SW5qZWN0LCBPcHRpb25hbCwgU2VsZiwgU2tpcFNlbGZ9IGZyb20gJy4vbWV0YWRhdGEnO1xuXG5leHBvcnQgY29uc3QgU09VUkNFID0gJ19fc291cmNlJztcbmNvbnN0IF9USFJPV19JRl9OT1RfRk9VTkQgPSBuZXcgT2JqZWN0KCk7XG5leHBvcnQgY29uc3QgVEhST1dfSUZfTk9UX0ZPVU5EID0gX1RIUk9XX0lGX05PVF9GT1VORDtcblxuLyoqXG4gKiBBbiBJbmplY3Rpb25Ub2tlbiB0aGF0IGdldHMgdGhlIGN1cnJlbnQgYEluamVjdG9yYCBmb3IgYGNyZWF0ZUluamVjdG9yKClgLXN0eWxlIGluamVjdG9ycy5cbiAqXG4gKiBSZXF1ZXN0aW5nIHRoaXMgdG9rZW4gaW5zdGVhZCBvZiBgSW5qZWN0b3JgIGFsbG93cyBgU3RhdGljSW5qZWN0b3JgIHRvIGJlIHRyZWUtc2hha2VuIGZyb20gYVxuICogcHJvamVjdC5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBjb25zdCBJTkpFQ1RPUiA9IG5ldyBJbmplY3Rpb25Ub2tlbjxJbmplY3Rvcj4oXG4gICAgJ0lOSkVDVE9SJyxcbiAgICAtMSBhcyBhbnkgIC8vIGAtMWAgaXMgdXNlZCBieSBJdnkgREkgc3lzdGVtIGFzIHNwZWNpYWwgdmFsdWUgdG8gcmVjb2duaXplIGl0IGFzIGBJbmplY3RvcmAuXG4gICAgKTtcblxuZXhwb3J0IGNsYXNzIE51bGxJbmplY3RvciBpbXBsZW1lbnRzIEluamVjdG9yIHtcbiAgZ2V0KHRva2VuOiBhbnksIG5vdEZvdW5kVmFsdWU6IGFueSA9IF9USFJPV19JRl9OT1RfRk9VTkQpOiBhbnkge1xuICAgIGlmIChub3RGb3VuZFZhbHVlID09PSBfVEhST1dfSUZfTk9UX0ZPVU5EKSB7XG4gICAgICAvLyBJbnRlbnRpb25hbGx5IGxlZnQgYmVoaW5kOiBXaXRoIGRldiB0b29scyBvcGVuIHRoZSBkZWJ1Z2dlciB3aWxsIHN0b3AgaGVyZS4gVGhlcmUgaXMgbm9cbiAgICAgIC8vIHJlYXNvbiB3aHkgY29ycmVjdGx5IHdyaXR0ZW4gYXBwbGljYXRpb24gc2hvdWxkIGNhdXNlIHRoaXMgZXhjZXB0aW9uLlxuICAgICAgLy8gVE9ETyhtaXNrbyk6IHVuY29tbWVudCB0aGUgbmV4dCBsaW5lIG9uY2UgYG5nRGV2TW9kZWAgd29ya3Mgd2l0aCBjbG9zdXJlLlxuICAgICAgLy8gaWYobmdEZXZNb2RlKSBkZWJ1Z2dlcjtcbiAgICAgIGNvbnN0IGVycm9yID0gbmV3IEVycm9yKGBOdWxsSW5qZWN0b3JFcnJvcjogTm8gcHJvdmlkZXIgZm9yICR7c3RyaW5naWZ5KHRva2VuKX0hYCk7XG4gICAgICBlcnJvci5uYW1lID0gJ051bGxJbmplY3RvckVycm9yJztcbiAgICAgIHRocm93IGVycm9yO1xuICAgIH1cbiAgICByZXR1cm4gbm90Rm91bmRWYWx1ZTtcbiAgfVxufVxuXG4vKipcbiAqIENvbmNyZXRlIGluamVjdG9ycyBpbXBsZW1lbnQgdGhpcyBpbnRlcmZhY2UuXG4gKlxuICogRm9yIG1vcmUgZGV0YWlscywgc2VlIHRoZSBbXCJEZXBlbmRlbmN5IEluamVjdGlvbiBHdWlkZVwiXShndWlkZS9kZXBlbmRlbmN5LWluamVjdGlvbikuXG4gKlxuICogQHVzYWdlTm90ZXNcbiAqICMjIyBFeGFtcGxlXG4gKlxuICoge0BleGFtcGxlIGNvcmUvZGkvdHMvaW5qZWN0b3Jfc3BlYy50cyByZWdpb249J0luamVjdG9yJ31cbiAqXG4gKiBgSW5qZWN0b3JgIHJldHVybnMgaXRzZWxmIHdoZW4gZ2l2ZW4gYEluamVjdG9yYCBhcyBhIHRva2VuOlxuICpcbiAqIHtAZXhhbXBsZSBjb3JlL2RpL3RzL2luamVjdG9yX3NwZWMudHMgcmVnaW9uPSdpbmplY3RJbmplY3Rvcid9XG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgSW5qZWN0b3Ige1xuICBzdGF0aWMgVEhST1dfSUZfTk9UX0ZPVU5EID0gX1RIUk9XX0lGX05PVF9GT1VORDtcbiAgc3RhdGljIE5VTEw6IEluamVjdG9yID0gbmV3IE51bGxJbmplY3RvcigpO1xuXG4gIC8qKlxuICAgKiBSZXRyaWV2ZXMgYW4gaW5zdGFuY2UgZnJvbSB0aGUgaW5qZWN0b3IgYmFzZWQgb24gdGhlIHByb3ZpZGVkIHRva2VuLlxuICAgKiBAcmV0dXJucyBUaGUgaW5zdGFuY2UgZnJvbSB0aGUgaW5qZWN0b3IgaWYgZGVmaW5lZCwgb3RoZXJ3aXNlIHRoZSBgbm90Rm91bmRWYWx1ZWAuXG4gICAqIEB0aHJvd3MgV2hlbiB0aGUgYG5vdEZvdW5kVmFsdWVgIGlzIGB1bmRlZmluZWRgIG9yIGBJbmplY3Rvci5USFJPV19JRl9OT1RfRk9VTkRgLlxuICAgKi9cbiAgYWJzdHJhY3QgZ2V0PFQ+KHRva2VuOiBUeXBlPFQ+fEluamVjdGlvblRva2VuPFQ+LCBub3RGb3VuZFZhbHVlPzogVCwgZmxhZ3M/OiBJbmplY3RGbGFncyk6IFQ7XG4gIC8qKlxuICAgKiBAZGVwcmVjYXRlZCBmcm9tIHY0LjAuMCB1c2UgVHlwZTxUPiBvciBJbmplY3Rpb25Ub2tlbjxUPlxuICAgKiBAc3VwcHJlc3Mge2R1cGxpY2F0ZX1cbiAgICovXG4gIGFic3RyYWN0IGdldCh0b2tlbjogYW55LCBub3RGb3VuZFZhbHVlPzogYW55KTogYW55O1xuXG4gIC8qKlxuICAgKiBAZGVwcmVjYXRlZCBmcm9tIHY1IHVzZSB0aGUgbmV3IHNpZ25hdHVyZSBJbmplY3Rvci5jcmVhdGUob3B0aW9ucylcbiAgICovXG4gIHN0YXRpYyBjcmVhdGUocHJvdmlkZXJzOiBTdGF0aWNQcm92aWRlcltdLCBwYXJlbnQ/OiBJbmplY3Rvcik6IEluamVjdG9yO1xuXG4gIHN0YXRpYyBjcmVhdGUob3B0aW9uczoge3Byb3ZpZGVyczogU3RhdGljUHJvdmlkZXJbXSwgcGFyZW50PzogSW5qZWN0b3IsIG5hbWU/OiBzdHJpbmd9KTogSW5qZWN0b3I7XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBhIG5ldyBJbmplY3RvciB3aGljaCBpcyBjb25maWd1cmUgdXNpbmcgYFN0YXRpY1Byb3ZpZGVyYHMuXG4gICAqXG4gICAqIEB1c2FnZU5vdGVzXG4gICAqICMjIyBFeGFtcGxlXG4gICAqXG4gICAqIHtAZXhhbXBsZSBjb3JlL2RpL3RzL3Byb3ZpZGVyX3NwZWMudHMgcmVnaW9uPSdDb25zdHJ1Y3RvclByb3ZpZGVyJ31cbiAgICovXG4gIHN0YXRpYyBjcmVhdGUoXG4gICAgICBvcHRpb25zOiBTdGF0aWNQcm92aWRlcltdfHtwcm92aWRlcnM6IFN0YXRpY1Byb3ZpZGVyW10sIHBhcmVudD86IEluamVjdG9yLCBuYW1lPzogc3RyaW5nfSxcbiAgICAgIHBhcmVudD86IEluamVjdG9yKTogSW5qZWN0b3Ige1xuICAgIGlmIChBcnJheS5pc0FycmF5KG9wdGlvbnMpKSB7XG4gICAgICByZXR1cm4gbmV3IFN0YXRpY0luamVjdG9yKG9wdGlvbnMsIHBhcmVudCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBuZXcgU3RhdGljSW5qZWN0b3Iob3B0aW9ucy5wcm92aWRlcnMsIG9wdGlvbnMucGFyZW50LCBvcHRpb25zLm5hbWUgfHwgbnVsbCk7XG4gICAgfVxuICB9XG5cbiAgLyoqIEBub2NvbGxhcHNlICovXG4gIHN0YXRpYyBuZ0luamVjdGFibGVEZWYgPSDJtcm1ZGVmaW5lSW5qZWN0YWJsZSh7XG4gICAgcHJvdmlkZWRJbjogJ2FueScgYXMgYW55LFxuICAgIGZhY3Rvcnk6ICgpID0+IMm1ybVpbmplY3QoSU5KRUNUT1IpLFxuICB9KTtcblxuICAvKipcbiAgICogQGludGVybmFsXG4gICAqIEBub2NvbGxhcHNlXG4gICAqL1xuICBzdGF0aWMgX19OR19FTEVNRU5UX0lEX18gPSAtMTtcbn1cblxuXG5cbmNvbnN0IElERU5UID0gZnVuY3Rpb248VD4odmFsdWU6IFQpOiBUIHtcbiAgcmV0dXJuIHZhbHVlO1xufTtcbmNvbnN0IEVNUFRZID0gPGFueVtdPltdO1xuY29uc3QgQ0lSQ1VMQVIgPSBJREVOVDtcbmNvbnN0IE1VTFRJX1BST1ZJREVSX0ZOID0gZnVuY3Rpb24oKTogYW55W10ge1xuICByZXR1cm4gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzKTtcbn07XG5leHBvcnQgY29uc3QgVVNFX1ZBTFVFID1cbiAgICBnZXRDbG9zdXJlU2FmZVByb3BlcnR5PFZhbHVlUHJvdmlkZXI+KHtwcm92aWRlOiBTdHJpbmcsIHVzZVZhbHVlOiBnZXRDbG9zdXJlU2FmZVByb3BlcnR5fSk7XG5jb25zdCBOR19UT0tFTl9QQVRIID0gJ25nVG9rZW5QYXRoJztcbmV4cG9ydCBjb25zdCBOR19URU1QX1RPS0VOX1BBVEggPSAnbmdUZW1wVG9rZW5QYXRoJztcbmNvbnN0IGVudW0gT3B0aW9uRmxhZ3Mge1xuICBPcHRpb25hbCA9IDEgPDwgMCxcbiAgQ2hlY2tTZWxmID0gMSA8PCAxLFxuICBDaGVja1BhcmVudCA9IDEgPDwgMixcbiAgRGVmYXVsdCA9IENoZWNrU2VsZiB8IENoZWNrUGFyZW50XG59XG5jb25zdCBOVUxMX0lOSkVDVE9SID0gSW5qZWN0b3IuTlVMTDtcbmNvbnN0IE5FV19MSU5FID0gL1xcbi9nbTtcbmNvbnN0IE5PX05FV19MSU5FID0gJ8m1JztcblxuZXhwb3J0IGNsYXNzIFN0YXRpY0luamVjdG9yIGltcGxlbWVudHMgSW5qZWN0b3Ige1xuICByZWFkb25seSBwYXJlbnQ6IEluamVjdG9yO1xuICByZWFkb25seSBzb3VyY2U6IHN0cmluZ3xudWxsO1xuXG4gIHByaXZhdGUgX3JlY29yZHM6IE1hcDxhbnksIFJlY29yZD47XG5cbiAgY29uc3RydWN0b3IoXG4gICAgICBwcm92aWRlcnM6IFN0YXRpY1Byb3ZpZGVyW10sIHBhcmVudDogSW5qZWN0b3IgPSBOVUxMX0lOSkVDVE9SLCBzb3VyY2U6IHN0cmluZ3xudWxsID0gbnVsbCkge1xuICAgIHRoaXMucGFyZW50ID0gcGFyZW50O1xuICAgIHRoaXMuc291cmNlID0gc291cmNlO1xuICAgIGNvbnN0IHJlY29yZHMgPSB0aGlzLl9yZWNvcmRzID0gbmV3IE1hcDxhbnksIFJlY29yZD4oKTtcbiAgICByZWNvcmRzLnNldChcbiAgICAgICAgSW5qZWN0b3IsIDxSZWNvcmQ+e3Rva2VuOiBJbmplY3RvciwgZm46IElERU5ULCBkZXBzOiBFTVBUWSwgdmFsdWU6IHRoaXMsIHVzZU5ldzogZmFsc2V9KTtcbiAgICByZWNvcmRzLnNldChcbiAgICAgICAgSU5KRUNUT1IsIDxSZWNvcmQ+e3Rva2VuOiBJTkpFQ1RPUiwgZm46IElERU5ULCBkZXBzOiBFTVBUWSwgdmFsdWU6IHRoaXMsIHVzZU5ldzogZmFsc2V9KTtcbiAgICByZWN1cnNpdmVseVByb2Nlc3NQcm92aWRlcnMocmVjb3JkcywgcHJvdmlkZXJzKTtcbiAgfVxuXG4gIGdldDxUPih0b2tlbjogVHlwZTxUPnxJbmplY3Rpb25Ub2tlbjxUPiwgbm90Rm91bmRWYWx1ZT86IFQsIGZsYWdzPzogSW5qZWN0RmxhZ3MpOiBUO1xuICBnZXQodG9rZW46IGFueSwgbm90Rm91bmRWYWx1ZT86IGFueSk6IGFueTtcbiAgZ2V0KHRva2VuOiBhbnksIG5vdEZvdW5kVmFsdWU/OiBhbnksIGZsYWdzOiBJbmplY3RGbGFncyA9IEluamVjdEZsYWdzLkRlZmF1bHQpOiBhbnkge1xuICAgIGNvbnN0IHJlY29yZCA9IHRoaXMuX3JlY29yZHMuZ2V0KHRva2VuKTtcbiAgICB0cnkge1xuICAgICAgcmV0dXJuIHRyeVJlc29sdmVUb2tlbih0b2tlbiwgcmVjb3JkLCB0aGlzLl9yZWNvcmRzLCB0aGlzLnBhcmVudCwgbm90Rm91bmRWYWx1ZSwgZmxhZ3MpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIHJldHVybiBjYXRjaEluamVjdG9yRXJyb3IoZSwgdG9rZW4sICdTdGF0aWNJbmplY3RvckVycm9yJywgdGhpcy5zb3VyY2UpO1xuICAgIH1cbiAgfVxuXG4gIHRvU3RyaW5nKCkge1xuICAgIGNvbnN0IHRva2VucyA9IDxzdHJpbmdbXT5bXSwgcmVjb3JkcyA9IHRoaXMuX3JlY29yZHM7XG4gICAgcmVjb3Jkcy5mb3JFYWNoKCh2LCB0b2tlbikgPT4gdG9rZW5zLnB1c2goc3RyaW5naWZ5KHRva2VuKSkpO1xuICAgIHJldHVybiBgU3RhdGljSW5qZWN0b3JbJHt0b2tlbnMuam9pbignLCAnKX1dYDtcbiAgfVxufVxuXG50eXBlIFN1cHBvcnRlZFByb3ZpZGVyID1cbiAgICBWYWx1ZVByb3ZpZGVyIHwgRXhpc3RpbmdQcm92aWRlciB8IFN0YXRpY0NsYXNzUHJvdmlkZXIgfCBDb25zdHJ1Y3RvclByb3ZpZGVyIHwgRmFjdG9yeVByb3ZpZGVyO1xuXG5pbnRlcmZhY2UgUmVjb3JkIHtcbiAgZm46IEZ1bmN0aW9uO1xuICB1c2VOZXc6IGJvb2xlYW47XG4gIGRlcHM6IERlcGVuZGVuY3lSZWNvcmRbXTtcbiAgdmFsdWU6IGFueTtcbn1cblxuaW50ZXJmYWNlIERlcGVuZGVuY3lSZWNvcmQge1xuICB0b2tlbjogYW55O1xuICBvcHRpb25zOiBudW1iZXI7XG59XG5cbmZ1bmN0aW9uIHJlc29sdmVQcm92aWRlcihwcm92aWRlcjogU3VwcG9ydGVkUHJvdmlkZXIpOiBSZWNvcmQge1xuICBjb25zdCBkZXBzID0gY29tcHV0ZURlcHMocHJvdmlkZXIpO1xuICBsZXQgZm46IEZ1bmN0aW9uID0gSURFTlQ7XG4gIGxldCB2YWx1ZTogYW55ID0gRU1QVFk7XG4gIGxldCB1c2VOZXc6IGJvb2xlYW4gPSBmYWxzZTtcbiAgbGV0IHByb3ZpZGUgPSByZXNvbHZlRm9yd2FyZFJlZihwcm92aWRlci5wcm92aWRlKTtcbiAgaWYgKFVTRV9WQUxVRSBpbiBwcm92aWRlcikge1xuICAgIC8vIFdlIG5lZWQgdG8gdXNlIFVTRV9WQUxVRSBpbiBwcm92aWRlciBzaW5jZSBwcm92aWRlci51c2VWYWx1ZSBjb3VsZCBiZSBkZWZpbmVkIGFzIHVuZGVmaW5lZC5cbiAgICB2YWx1ZSA9IChwcm92aWRlciBhcyBWYWx1ZVByb3ZpZGVyKS51c2VWYWx1ZTtcbiAgfSBlbHNlIGlmICgocHJvdmlkZXIgYXMgRmFjdG9yeVByb3ZpZGVyKS51c2VGYWN0b3J5KSB7XG4gICAgZm4gPSAocHJvdmlkZXIgYXMgRmFjdG9yeVByb3ZpZGVyKS51c2VGYWN0b3J5O1xuICB9IGVsc2UgaWYgKChwcm92aWRlciBhcyBFeGlzdGluZ1Byb3ZpZGVyKS51c2VFeGlzdGluZykge1xuICAgIC8vIEp1c3QgdXNlIElERU5UXG4gIH0gZWxzZSBpZiAoKHByb3ZpZGVyIGFzIFN0YXRpY0NsYXNzUHJvdmlkZXIpLnVzZUNsYXNzKSB7XG4gICAgdXNlTmV3ID0gdHJ1ZTtcbiAgICBmbiA9IHJlc29sdmVGb3J3YXJkUmVmKChwcm92aWRlciBhcyBTdGF0aWNDbGFzc1Byb3ZpZGVyKS51c2VDbGFzcyk7XG4gIH0gZWxzZSBpZiAodHlwZW9mIHByb3ZpZGUgPT0gJ2Z1bmN0aW9uJykge1xuICAgIHVzZU5ldyA9IHRydWU7XG4gICAgZm4gPSBwcm92aWRlO1xuICB9IGVsc2Uge1xuICAgIHRocm93IHN0YXRpY0Vycm9yKFxuICAgICAgICAnU3RhdGljUHJvdmlkZXIgZG9lcyBub3QgaGF2ZSBbdXNlVmFsdWV8dXNlRmFjdG9yeXx1c2VFeGlzdGluZ3x1c2VDbGFzc10gb3IgW3Byb3ZpZGVdIGlzIG5vdCBuZXdhYmxlJyxcbiAgICAgICAgcHJvdmlkZXIpO1xuICB9XG4gIHJldHVybiB7ZGVwcywgZm4sIHVzZU5ldywgdmFsdWV9O1xufVxuXG5mdW5jdGlvbiBtdWx0aVByb3ZpZGVyTWl4RXJyb3IodG9rZW46IGFueSkge1xuICByZXR1cm4gc3RhdGljRXJyb3IoJ0Nhbm5vdCBtaXggbXVsdGkgcHJvdmlkZXJzIGFuZCByZWd1bGFyIHByb3ZpZGVycycsIHRva2VuKTtcbn1cblxuZnVuY3Rpb24gcmVjdXJzaXZlbHlQcm9jZXNzUHJvdmlkZXJzKHJlY29yZHM6IE1hcDxhbnksIFJlY29yZD4sIHByb3ZpZGVyOiBTdGF0aWNQcm92aWRlcikge1xuICBpZiAocHJvdmlkZXIpIHtcbiAgICBwcm92aWRlciA9IHJlc29sdmVGb3J3YXJkUmVmKHByb3ZpZGVyKTtcbiAgICBpZiAocHJvdmlkZXIgaW5zdGFuY2VvZiBBcnJheSkge1xuICAgICAgLy8gaWYgd2UgaGF2ZSBhbiBhcnJheSByZWN1cnNlIGludG8gdGhlIGFycmF5XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHByb3ZpZGVyLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHJlY3Vyc2l2ZWx5UHJvY2Vzc1Byb3ZpZGVycyhyZWNvcmRzLCBwcm92aWRlcltpXSk7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmICh0eXBlb2YgcHJvdmlkZXIgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIC8vIEZ1bmN0aW9ucyB3ZXJlIHN1cHBvcnRlZCBpbiBSZWZsZWN0aXZlSW5qZWN0b3IsIGJ1dCBhcmUgbm90IGhlcmUuIEZvciBzYWZldHkgZ2l2ZSB1c2VmdWxcbiAgICAgIC8vIGVycm9yIG1lc3NhZ2VzXG4gICAgICB0aHJvdyBzdGF0aWNFcnJvcignRnVuY3Rpb24vQ2xhc3Mgbm90IHN1cHBvcnRlZCcsIHByb3ZpZGVyKTtcbiAgICB9IGVsc2UgaWYgKHByb3ZpZGVyICYmIHR5cGVvZiBwcm92aWRlciA9PT0gJ29iamVjdCcgJiYgcHJvdmlkZXIucHJvdmlkZSkge1xuICAgICAgLy8gQXQgdGhpcyBwb2ludCB3ZSBoYXZlIHdoYXQgbG9va3MgbGlrZSBhIHByb3ZpZGVyOiB7cHJvdmlkZTogPywgLi4uLn1cbiAgICAgIGxldCB0b2tlbiA9IHJlc29sdmVGb3J3YXJkUmVmKHByb3ZpZGVyLnByb3ZpZGUpO1xuICAgICAgY29uc3QgcmVzb2x2ZWRQcm92aWRlciA9IHJlc29sdmVQcm92aWRlcihwcm92aWRlcik7XG4gICAgICBpZiAocHJvdmlkZXIubXVsdGkgPT09IHRydWUpIHtcbiAgICAgICAgLy8gVGhpcyBpcyBhIG11bHRpIHByb3ZpZGVyLlxuICAgICAgICBsZXQgbXVsdGlQcm92aWRlcjogUmVjb3JkfHVuZGVmaW5lZCA9IHJlY29yZHMuZ2V0KHRva2VuKTtcbiAgICAgICAgaWYgKG11bHRpUHJvdmlkZXIpIHtcbiAgICAgICAgICBpZiAobXVsdGlQcm92aWRlci5mbiAhPT0gTVVMVElfUFJPVklERVJfRk4pIHtcbiAgICAgICAgICAgIHRocm93IG11bHRpUHJvdmlkZXJNaXhFcnJvcih0b2tlbik7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIENyZWF0ZSBhIHBsYWNlaG9sZGVyIGZhY3Rvcnkgd2hpY2ggd2lsbCBsb29rIHVwIHRoZSBjb25zdGl0dWVudHMgb2YgdGhlIG11bHRpIHByb3ZpZGVyLlxuICAgICAgICAgIHJlY29yZHMuc2V0KHRva2VuLCBtdWx0aVByb3ZpZGVyID0gPFJlY29yZD57XG4gICAgICAgICAgICB0b2tlbjogcHJvdmlkZXIucHJvdmlkZSxcbiAgICAgICAgICAgIGRlcHM6IFtdLFxuICAgICAgICAgICAgdXNlTmV3OiBmYWxzZSxcbiAgICAgICAgICAgIGZuOiBNVUxUSV9QUk9WSURFUl9GTixcbiAgICAgICAgICAgIHZhbHVlOiBFTVBUWVxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIC8vIFRyZWF0IHRoZSBwcm92aWRlciBhcyB0aGUgdG9rZW4uXG4gICAgICAgIHRva2VuID0gcHJvdmlkZXI7XG4gICAgICAgIG11bHRpUHJvdmlkZXIuZGVwcy5wdXNoKHt0b2tlbiwgb3B0aW9uczogT3B0aW9uRmxhZ3MuRGVmYXVsdH0pO1xuICAgICAgfVxuICAgICAgY29uc3QgcmVjb3JkID0gcmVjb3Jkcy5nZXQodG9rZW4pO1xuICAgICAgaWYgKHJlY29yZCAmJiByZWNvcmQuZm4gPT0gTVVMVElfUFJPVklERVJfRk4pIHtcbiAgICAgICAgdGhyb3cgbXVsdGlQcm92aWRlck1peEVycm9yKHRva2VuKTtcbiAgICAgIH1cbiAgICAgIHJlY29yZHMuc2V0KHRva2VuLCByZXNvbHZlZFByb3ZpZGVyKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgc3RhdGljRXJyb3IoJ1VuZXhwZWN0ZWQgcHJvdmlkZXInLCBwcm92aWRlcik7XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIHRyeVJlc29sdmVUb2tlbihcbiAgICB0b2tlbjogYW55LCByZWNvcmQ6IFJlY29yZCB8IHVuZGVmaW5lZCwgcmVjb3JkczogTWFwPGFueSwgUmVjb3JkPiwgcGFyZW50OiBJbmplY3RvcixcbiAgICBub3RGb3VuZFZhbHVlOiBhbnksIGZsYWdzOiBJbmplY3RGbGFncyk6IGFueSB7XG4gIHRyeSB7XG4gICAgcmV0dXJuIHJlc29sdmVUb2tlbih0b2tlbiwgcmVjb3JkLCByZWNvcmRzLCBwYXJlbnQsIG5vdEZvdW5kVmFsdWUsIGZsYWdzKTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIC8vIGVuc3VyZSB0aGF0ICdlJyBpcyBvZiB0eXBlIEVycm9yLlxuICAgIGlmICghKGUgaW5zdGFuY2VvZiBFcnJvcikpIHtcbiAgICAgIGUgPSBuZXcgRXJyb3IoZSk7XG4gICAgfVxuICAgIGNvbnN0IHBhdGg6IGFueVtdID0gZVtOR19URU1QX1RPS0VOX1BBVEhdID0gZVtOR19URU1QX1RPS0VOX1BBVEhdIHx8IFtdO1xuICAgIHBhdGgudW5zaGlmdCh0b2tlbik7XG4gICAgaWYgKHJlY29yZCAmJiByZWNvcmQudmFsdWUgPT0gQ0lSQ1VMQVIpIHtcbiAgICAgIC8vIFJlc2V0IHRoZSBDaXJjdWxhciBmbGFnLlxuICAgICAgcmVjb3JkLnZhbHVlID0gRU1QVFk7XG4gICAgfVxuICAgIHRocm93IGU7XG4gIH1cbn1cblxuZnVuY3Rpb24gcmVzb2x2ZVRva2VuKFxuICAgIHRva2VuOiBhbnksIHJlY29yZDogUmVjb3JkIHwgdW5kZWZpbmVkLCByZWNvcmRzOiBNYXA8YW55LCBSZWNvcmQ+LCBwYXJlbnQ6IEluamVjdG9yLFxuICAgIG5vdEZvdW5kVmFsdWU6IGFueSwgZmxhZ3M6IEluamVjdEZsYWdzKTogYW55IHtcbiAgbGV0IHZhbHVlO1xuICBpZiAocmVjb3JkICYmICEoZmxhZ3MgJiBJbmplY3RGbGFncy5Ta2lwU2VsZikpIHtcbiAgICAvLyBJZiB3ZSBkb24ndCBoYXZlIGEgcmVjb3JkLCB0aGlzIGltcGxpZXMgdGhhdCB3ZSBkb24ndCBvd24gdGhlIHByb3ZpZGVyIGhlbmNlIGRvbid0IGtub3cgaG93XG4gICAgLy8gdG8gcmVzb2x2ZSBpdC5cbiAgICB2YWx1ZSA9IHJlY29yZC52YWx1ZTtcbiAgICBpZiAodmFsdWUgPT0gQ0lSQ1VMQVIpIHtcbiAgICAgIHRocm93IEVycm9yKE5PX05FV19MSU5FICsgJ0NpcmN1bGFyIGRlcGVuZGVuY3knKTtcbiAgICB9IGVsc2UgaWYgKHZhbHVlID09PSBFTVBUWSkge1xuICAgICAgcmVjb3JkLnZhbHVlID0gQ0lSQ1VMQVI7XG4gICAgICBsZXQgb2JqID0gdW5kZWZpbmVkO1xuICAgICAgbGV0IHVzZU5ldyA9IHJlY29yZC51c2VOZXc7XG4gICAgICBsZXQgZm4gPSByZWNvcmQuZm47XG4gICAgICBsZXQgZGVwUmVjb3JkcyA9IHJlY29yZC5kZXBzO1xuICAgICAgbGV0IGRlcHMgPSBFTVBUWTtcbiAgICAgIGlmIChkZXBSZWNvcmRzLmxlbmd0aCkge1xuICAgICAgICBkZXBzID0gW107XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZGVwUmVjb3Jkcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIGNvbnN0IGRlcFJlY29yZDogRGVwZW5kZW5jeVJlY29yZCA9IGRlcFJlY29yZHNbaV07XG4gICAgICAgICAgY29uc3Qgb3B0aW9ucyA9IGRlcFJlY29yZC5vcHRpb25zO1xuICAgICAgICAgIGNvbnN0IGNoaWxkUmVjb3JkID1cbiAgICAgICAgICAgICAgb3B0aW9ucyAmIE9wdGlvbkZsYWdzLkNoZWNrU2VsZiA/IHJlY29yZHMuZ2V0KGRlcFJlY29yZC50b2tlbikgOiB1bmRlZmluZWQ7XG4gICAgICAgICAgZGVwcy5wdXNoKHRyeVJlc29sdmVUb2tlbihcbiAgICAgICAgICAgICAgLy8gQ3VycmVudCBUb2tlbiB0byByZXNvbHZlXG4gICAgICAgICAgICAgIGRlcFJlY29yZC50b2tlbixcbiAgICAgICAgICAgICAgLy8gQSByZWNvcmQgd2hpY2ggZGVzY3JpYmVzIGhvdyB0byByZXNvbHZlIHRoZSB0b2tlbi5cbiAgICAgICAgICAgICAgLy8gSWYgdW5kZWZpbmVkLCB0aGlzIG1lYW5zIHdlIGRvbid0IGhhdmUgc3VjaCBhIHJlY29yZFxuICAgICAgICAgICAgICBjaGlsZFJlY29yZCxcbiAgICAgICAgICAgICAgLy8gT3RoZXIgcmVjb3JkcyB3ZSBrbm93IGFib3V0LlxuICAgICAgICAgICAgICByZWNvcmRzLFxuICAgICAgICAgICAgICAvLyBJZiB3ZSBkb24ndCBrbm93IGhvdyB0byByZXNvbHZlIGRlcGVuZGVuY3kgYW5kIHdlIHNob3VsZCBub3QgY2hlY2sgcGFyZW50IGZvciBpdCxcbiAgICAgICAgICAgICAgLy8gdGhhbiBwYXNzIGluIE51bGwgaW5qZWN0b3IuXG4gICAgICAgICAgICAgICFjaGlsZFJlY29yZCAmJiAhKG9wdGlvbnMgJiBPcHRpb25GbGFncy5DaGVja1BhcmVudCkgPyBOVUxMX0lOSkVDVE9SIDogcGFyZW50LFxuICAgICAgICAgICAgICBvcHRpb25zICYgT3B0aW9uRmxhZ3MuT3B0aW9uYWwgPyBudWxsIDogSW5qZWN0b3IuVEhST1dfSUZfTk9UX0ZPVU5ELFxuICAgICAgICAgICAgICBJbmplY3RGbGFncy5EZWZhdWx0KSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJlY29yZC52YWx1ZSA9IHZhbHVlID0gdXNlTmV3ID8gbmV3IChmbiBhcyBhbnkpKC4uLmRlcHMpIDogZm4uYXBwbHkob2JqLCBkZXBzKTtcbiAgICB9XG4gIH0gZWxzZSBpZiAoIShmbGFncyAmIEluamVjdEZsYWdzLlNlbGYpKSB7XG4gICAgdmFsdWUgPSBwYXJlbnQuZ2V0KHRva2VuLCBub3RGb3VuZFZhbHVlLCBJbmplY3RGbGFncy5EZWZhdWx0KTtcbiAgfVxuICByZXR1cm4gdmFsdWU7XG59XG5cbmZ1bmN0aW9uIGNvbXB1dGVEZXBzKHByb3ZpZGVyOiBTdGF0aWNQcm92aWRlcik6IERlcGVuZGVuY3lSZWNvcmRbXSB7XG4gIGxldCBkZXBzOiBEZXBlbmRlbmN5UmVjb3JkW10gPSBFTVBUWTtcbiAgY29uc3QgcHJvdmlkZXJEZXBzOiBhbnlbXSA9XG4gICAgICAocHJvdmlkZXIgYXMgRXhpc3RpbmdQcm92aWRlciAmIFN0YXRpY0NsYXNzUHJvdmlkZXIgJiBDb25zdHJ1Y3RvclByb3ZpZGVyKS5kZXBzO1xuICBpZiAocHJvdmlkZXJEZXBzICYmIHByb3ZpZGVyRGVwcy5sZW5ndGgpIHtcbiAgICBkZXBzID0gW107XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwcm92aWRlckRlcHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGxldCBvcHRpb25zID0gT3B0aW9uRmxhZ3MuRGVmYXVsdDtcbiAgICAgIGxldCB0b2tlbiA9IHJlc29sdmVGb3J3YXJkUmVmKHByb3ZpZGVyRGVwc1tpXSk7XG4gICAgICBpZiAodG9rZW4gaW5zdGFuY2VvZiBBcnJheSkge1xuICAgICAgICBmb3IgKGxldCBqID0gMCwgYW5ub3RhdGlvbnMgPSB0b2tlbjsgaiA8IGFubm90YXRpb25zLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgY29uc3QgYW5ub3RhdGlvbiA9IGFubm90YXRpb25zW2pdO1xuICAgICAgICAgIGlmIChhbm5vdGF0aW9uIGluc3RhbmNlb2YgT3B0aW9uYWwgfHwgYW5ub3RhdGlvbiA9PSBPcHRpb25hbCkge1xuICAgICAgICAgICAgb3B0aW9ucyA9IG9wdGlvbnMgfCBPcHRpb25GbGFncy5PcHRpb25hbDtcbiAgICAgICAgICB9IGVsc2UgaWYgKGFubm90YXRpb24gaW5zdGFuY2VvZiBTa2lwU2VsZiB8fCBhbm5vdGF0aW9uID09IFNraXBTZWxmKSB7XG4gICAgICAgICAgICBvcHRpb25zID0gb3B0aW9ucyAmIH5PcHRpb25GbGFncy5DaGVja1NlbGY7XG4gICAgICAgICAgfSBlbHNlIGlmIChhbm5vdGF0aW9uIGluc3RhbmNlb2YgU2VsZiB8fCBhbm5vdGF0aW9uID09IFNlbGYpIHtcbiAgICAgICAgICAgIG9wdGlvbnMgPSBvcHRpb25zICYgfk9wdGlvbkZsYWdzLkNoZWNrUGFyZW50O1xuICAgICAgICAgIH0gZWxzZSBpZiAoYW5ub3RhdGlvbiBpbnN0YW5jZW9mIEluamVjdCkge1xuICAgICAgICAgICAgdG9rZW4gPSAoYW5ub3RhdGlvbiBhcyBJbmplY3QpLnRva2VuO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0b2tlbiA9IHJlc29sdmVGb3J3YXJkUmVmKGFubm90YXRpb24pO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZGVwcy5wdXNoKHt0b2tlbiwgb3B0aW9uc30pO1xuICAgIH1cbiAgfSBlbHNlIGlmICgocHJvdmlkZXIgYXMgRXhpc3RpbmdQcm92aWRlcikudXNlRXhpc3RpbmcpIHtcbiAgICBjb25zdCB0b2tlbiA9IHJlc29sdmVGb3J3YXJkUmVmKChwcm92aWRlciBhcyBFeGlzdGluZ1Byb3ZpZGVyKS51c2VFeGlzdGluZyk7XG4gICAgZGVwcyA9IFt7dG9rZW4sIG9wdGlvbnM6IE9wdGlvbkZsYWdzLkRlZmF1bHR9XTtcbiAgfSBlbHNlIGlmICghcHJvdmlkZXJEZXBzICYmICEoVVNFX1ZBTFVFIGluIHByb3ZpZGVyKSkge1xuICAgIC8vIHVzZVZhbHVlICYgdXNlRXhpc3RpbmcgYXJlIHRoZSBvbmx5IG9uZXMgd2hpY2ggYXJlIGV4ZW1wdCBmcm9tIGRlcHMgYWxsIG90aGVycyBuZWVkIGl0LlxuICAgIHRocm93IHN0YXRpY0Vycm9yKCdcXCdkZXBzXFwnIHJlcXVpcmVkJywgcHJvdmlkZXIpO1xuICB9XG4gIHJldHVybiBkZXBzO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY2F0Y2hJbmplY3RvckVycm9yKFxuICAgIGU6IGFueSwgdG9rZW46IGFueSwgaW5qZWN0b3JFcnJvck5hbWU6IHN0cmluZywgc291cmNlOiBzdHJpbmcgfCBudWxsKTogbmV2ZXIge1xuICBjb25zdCB0b2tlblBhdGg6IGFueVtdID0gZVtOR19URU1QX1RPS0VOX1BBVEhdO1xuICBpZiAodG9rZW5bU09VUkNFXSkge1xuICAgIHRva2VuUGF0aC51bnNoaWZ0KHRva2VuW1NPVVJDRV0pO1xuICB9XG4gIGUubWVzc2FnZSA9IGZvcm1hdEVycm9yKCdcXG4nICsgZS5tZXNzYWdlLCB0b2tlblBhdGgsIGluamVjdG9yRXJyb3JOYW1lLCBzb3VyY2UpO1xuICBlW05HX1RPS0VOX1BBVEhdID0gdG9rZW5QYXRoO1xuICBlW05HX1RFTVBfVE9LRU5fUEFUSF0gPSBudWxsO1xuICB0aHJvdyBlO1xufVxuXG5mdW5jdGlvbiBmb3JtYXRFcnJvcihcbiAgICB0ZXh0OiBzdHJpbmcsIG9iajogYW55LCBpbmplY3RvckVycm9yTmFtZTogc3RyaW5nLCBzb3VyY2U6IHN0cmluZyB8IG51bGwgPSBudWxsKTogc3RyaW5nIHtcbiAgdGV4dCA9IHRleHQgJiYgdGV4dC5jaGFyQXQoMCkgPT09ICdcXG4nICYmIHRleHQuY2hhckF0KDEpID09IE5PX05FV19MSU5FID8gdGV4dC5zdWJzdHIoMikgOiB0ZXh0O1xuICBsZXQgY29udGV4dCA9IHN0cmluZ2lmeShvYmopO1xuICBpZiAob2JqIGluc3RhbmNlb2YgQXJyYXkpIHtcbiAgICBjb250ZXh0ID0gb2JqLm1hcChzdHJpbmdpZnkpLmpvaW4oJyAtPiAnKTtcbiAgfSBlbHNlIGlmICh0eXBlb2Ygb2JqID09PSAnb2JqZWN0Jykge1xuICAgIGxldCBwYXJ0cyA9IDxzdHJpbmdbXT5bXTtcbiAgICBmb3IgKGxldCBrZXkgaW4gb2JqKSB7XG4gICAgICBpZiAob2JqLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgbGV0IHZhbHVlID0gb2JqW2tleV07XG4gICAgICAgIHBhcnRzLnB1c2goXG4gICAgICAgICAgICBrZXkgKyAnOicgKyAodHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJyA/IEpTT04uc3RyaW5naWZ5KHZhbHVlKSA6IHN0cmluZ2lmeSh2YWx1ZSkpKTtcbiAgICAgIH1cbiAgICB9XG4gICAgY29udGV4dCA9IGB7JHtwYXJ0cy5qb2luKCcsICcpfX1gO1xuICB9XG4gIHJldHVybiBgJHtpbmplY3RvckVycm9yTmFtZX0ke3NvdXJjZSA/ICcoJyArIHNvdXJjZSArICcpJyA6ICcnfVske2NvbnRleHR9XTogJHt0ZXh0LnJlcGxhY2UoTkVXX0xJTkUsICdcXG4gICcpfWA7XG59XG5cbmZ1bmN0aW9uIHN0YXRpY0Vycm9yKHRleHQ6IHN0cmluZywgb2JqOiBhbnkpOiBFcnJvciB7XG4gIHJldHVybiBuZXcgRXJyb3IoZm9ybWF0RXJyb3IodGV4dCwgb2JqLCAnU3RhdGljSW5qZWN0b3JFcnJvcicpKTtcbn1cbiJdfQ==