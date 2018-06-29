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
import { defineInjectable } from './defs';
import { resolveForwardRef } from './forward_ref';
import { InjectionToken } from './injection_token';
import { Inject, Optional, Self, SkipSelf } from './metadata';
export const /** @type {?} */ SOURCE = '__source';
const /** @type {?} */ _THROW_IF_NOT_FOUND = new Object();
export const /** @type {?} */ THROW_IF_NOT_FOUND = _THROW_IF_NOT_FOUND;
/**
 * An InjectionToken that gets the current `Injector` for `createInjector()`-style injectors.
 *
 * Requesting this token instead of `Injector` allows `StaticInjector` to be tree-shaken from a
 * project.
 *
 * \@experimental
 */
export const /** @type {?} */ INJECTOR = new InjectionToken('INJECTOR');
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
            throw new Error(`NullInjectorError: No provider for ${stringify(token)}!`);
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
 *
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
/** @nocollapse */ Injector.ngInjectableDef = defineInjectable({
    providedIn: /** @type {?} */ ('any'),
    factory: () => inject(INJECTOR),
});
function Injector_tsickle_Closure_declarations() {
    /** @type {?} */
    Injector.THROW_IF_NOT_FOUND;
    /** @type {?} */
    Injector.NULL;
    /** @type {?} */
    Injector.ngInjectableDef;
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
const /** @type {?} */ IDENT = function (value) {
    return value;
};
const ɵ0 = IDENT;
const /** @type {?} */ EMPTY = /** @type {?} */ ([]);
const /** @type {?} */ CIRCULAR = IDENT;
const /** @type {?} */ MULTI_PROVIDER_FN = function () {
    return Array.prototype.slice.call(arguments);
};
const ɵ1 = MULTI_PROVIDER_FN;
const /** @type {?} */ GET_PROPERTY_NAME = /** @type {?} */ ({});
export const /** @type {?} */ USE_VALUE = getClosureSafeProperty({ provide: String, useValue: GET_PROPERTY_NAME });
const /** @type {?} */ NG_TOKEN_PATH = 'ngTokenPath';
const /** @type {?} */ NG_TEMP_TOKEN_PATH = 'ngTempTokenPath';
/** @enum {number} */
const OptionFlags = {
    Optional: 1,
    CheckSelf: 2,
    CheckParent: 4,
    Default: 6,
};
const /** @type {?} */ NULL_INJECTOR = Injector.NULL;
const /** @type {?} */ NEW_LINE = /\n/gm;
const /** @type {?} */ NO_NEW_LINE = 'ɵ';
export class StaticInjector {
    /**
     * @param {?} providers
     * @param {?=} parent
     * @param {?=} source
     */
    constructor(providers, parent = NULL_INJECTOR, source = null) {
        this.parent = parent;
        this.source = source;
        const /** @type {?} */ records = this._records = new Map();
        records.set(Injector, /** @type {?} */ ({ token: Injector, fn: IDENT, deps: EMPTY, value: this, useNew: false }));
        records.set(INJECTOR, /** @type {?} */ ({ token: INJECTOR, fn: IDENT, deps: EMPTY, value: this, useNew: false }));
        recursivelyProcessProviders(records, providers);
    }
    /**
     * @param {?} token
     * @param {?=} notFoundValue
     * @param {?=} flags
     * @return {?}
     */
    get(token, notFoundValue, flags = 0 /* Default */) {
        const /** @type {?} */ record = this._records.get(token);
        try {
            return tryResolveToken(token, record, this._records, this.parent, notFoundValue, flags);
        }
        catch (/** @type {?} */ e) {
            const /** @type {?} */ tokenPath = e[NG_TEMP_TOKEN_PATH];
            if (token[SOURCE]) {
                tokenPath.unshift(token[SOURCE]);
            }
            e.message = formatError('\n' + e.message, tokenPath, this.source);
            e[NG_TOKEN_PATH] = tokenPath;
            e[NG_TEMP_TOKEN_PATH] = null;
            throw e;
        }
    }
    /**
     * @return {?}
     */
    toString() {
        const /** @type {?} */ tokens = /** @type {?} */ ([]), /** @type {?} */ records = this._records;
        records.forEach((v, token) => tokens.push(stringify(token)));
        return `StaticInjector[${tokens.join(', ')}]`;
    }
}
function StaticInjector_tsickle_Closure_declarations() {
    /** @type {?} */
    StaticInjector.prototype.parent;
    /** @type {?} */
    StaticInjector.prototype.source;
    /** @type {?} */
    StaticInjector.prototype._records;
}
/**
 * @record
 */
function Record() { }
function Record_tsickle_Closure_declarations() {
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
function DependencyRecord_tsickle_Closure_declarations() {
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
    const /** @type {?} */ deps = computeDeps(provider);
    let /** @type {?} */ fn = IDENT;
    let /** @type {?} */ value = EMPTY;
    let /** @type {?} */ useNew = false;
    let /** @type {?} */ provide = resolveForwardRef(provider.provide);
    if (USE_VALUE in provider) {
        // We need to use USE_VALUE in provider since provider.useValue could be defined as undefined.
        value = (/** @type {?} */ (provider)).useValue;
    }
    else if ((/** @type {?} */ (provider)).useFactory) {
        fn = (/** @type {?} */ (provider)).useFactory;
    }
    else if ((/** @type {?} */ (provider)).useExisting) {
        // Just use IDENT
    }
    else if ((/** @type {?} */ (provider)).useClass) {
        useNew = true;
        fn = resolveForwardRef((/** @type {?} */ (provider)).useClass);
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
            for (let /** @type {?} */ i = 0; i < provider.length; i++) {
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
            let /** @type {?} */ token = resolveForwardRef(provider.provide);
            const /** @type {?} */ resolvedProvider = resolveProvider(provider);
            if (provider.multi === true) {
                // This is a multi provider.
                let /** @type {?} */ multiProvider = records.get(token);
                if (multiProvider) {
                    if (multiProvider.fn !== MULTI_PROVIDER_FN) {
                        throw multiProviderMixError(token);
                    }
                }
                else {
                    // Create a placeholder factory which will look up the constituents of the multi provider.
                    records.set(token, multiProvider = /** @type {?} */ ({
                        token: provider.provide,
                        deps: [],
                        useNew: false,
                        fn: MULTI_PROVIDER_FN,
                        value: EMPTY
                    }));
                }
                // Treat the provider as the token.
                token = provider;
                multiProvider.deps.push({ token, options: 6 /* Default */ });
            }
            const /** @type {?} */ record = records.get(token);
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
    catch (/** @type {?} */ e) {
        // ensure that 'e' is of type Error.
        if (!(e instanceof Error)) {
            e = new Error(e);
        }
        const /** @type {?} */ path = e[NG_TEMP_TOKEN_PATH] = e[NG_TEMP_TOKEN_PATH] || [];
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
    let /** @type {?} */ value;
    if (record && !(flags & 4 /* SkipSelf */)) {
        // If we don't have a record, this implies that we don't own the provider hence don't know how
        // to resolve it.
        value = record.value;
        if (value == CIRCULAR) {
            throw Error(NO_NEW_LINE + 'Circular dependency');
        }
        else if (value === EMPTY) {
            record.value = CIRCULAR;
            let /** @type {?} */ obj = undefined;
            let /** @type {?} */ useNew = record.useNew;
            let /** @type {?} */ fn = record.fn;
            let /** @type {?} */ depRecords = record.deps;
            let /** @type {?} */ deps = EMPTY;
            if (depRecords.length) {
                deps = [];
                for (let /** @type {?} */ i = 0; i < depRecords.length; i++) {
                    const /** @type {?} */ depRecord = depRecords[i];
                    const /** @type {?} */ options = depRecord.options;
                    const /** @type {?} */ childRecord = options & 2 /* CheckSelf */ ? records.get(depRecord.token) : undefined;
                    deps.push(tryResolveToken(
                    // Current Token to resolve
                    depRecord.token, childRecord, records, 
                    // If we don't know how to resolve dependency and we should not check parent for it,
                    // than pass in Null injector.
                    !childRecord && !(options & 4 /* CheckParent */) ? NULL_INJECTOR : parent, options & 1 /* Optional */ ? null : Injector.THROW_IF_NOT_FOUND, 0 /* Default */));
                }
            }
            record.value = value = useNew ? new (/** @type {?} */ (fn))(...deps) : fn.apply(obj, deps);
        }
    }
    else if (!(flags & 2 /* Self */)) {
        value = parent.get(token, notFoundValue, 0 /* Default */);
    }
    return value;
}
/**
 * @param {?} provider
 * @return {?}
 */
function computeDeps(provider) {
    let /** @type {?} */ deps = EMPTY;
    const /** @type {?} */ providerDeps = (/** @type {?} */ (provider)).deps;
    if (providerDeps && providerDeps.length) {
        deps = [];
        for (let /** @type {?} */ i = 0; i < providerDeps.length; i++) {
            let /** @type {?} */ options = 6 /* Default */;
            let /** @type {?} */ token = resolveForwardRef(providerDeps[i]);
            if (token instanceof Array) {
                for (let /** @type {?} */ j = 0, /** @type {?} */ annotations = token; j < annotations.length; j++) {
                    const /** @type {?} */ annotation = annotations[j];
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
                        token = (/** @type {?} */ (annotation)).token;
                    }
                    else {
                        token = resolveForwardRef(annotation);
                    }
                }
            }
            deps.push({ token, options });
        }
    }
    else if ((/** @type {?} */ (provider)).useExisting) {
        const /** @type {?} */ token = resolveForwardRef((/** @type {?} */ (provider)).useExisting);
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
 * @param {?=} source
 * @return {?}
 */
function formatError(text, obj, source = null) {
    text = text && text.charAt(0) === '\n' && text.charAt(1) == NO_NEW_LINE ? text.substr(2) : text;
    let /** @type {?} */ context = stringify(obj);
    if (obj instanceof Array) {
        context = obj.map(stringify).join(' -> ');
    }
    else if (typeof obj === 'object') {
        let /** @type {?} */ parts = /** @type {?} */ ([]);
        for (let /** @type {?} */ key in obj) {
            if (obj.hasOwnProperty(key)) {
                let /** @type {?} */ value = obj[key];
                parts.push(key + ':' + (typeof value === 'string' ? JSON.stringify(value) : stringify(value)));
            }
        }
        context = `{${parts.join(', ')}}`;
    }
    return `StaticInjectorError${source ? '(' + source + ')' : ''}[${context}]: ${text.replace(NEW_LINE, '\n  ')}`;
}
/**
 * @param {?} text
 * @param {?} obj
 * @return {?}
 */
function staticError(text, obj) {
    return new Error(formatError(text, obj));
}
/**
 * @template T
 * @param {?} objWithPropertyToExtract
 * @return {?}
 */
function getClosureSafeProperty(objWithPropertyToExtract) {
    for (let /** @type {?} */ key in objWithPropertyToExtract) {
        if (objWithPropertyToExtract[key] === GET_PROPERTY_NAME) {
            return key;
        }
    }
    throw Error('!prop');
}
/** @enum {number} */
const InjectFlags = {
    Default: 0,
    /**
       * Specifies that an injector should retrieve a dependency from any injector until reaching the
       * host element of the current component. (Only used with Element Injector)
       */
    Host: 1,
    /** Don't descend into ancestors of the node requesting injection. */
    Self: 2,
    /** Skip the node that is requesting injection. */
    SkipSelf: 4,
    /** Inject `defaultValue` instead if token not found. */
    Optional: 8,
};
export { InjectFlags };
/**
 * Current injector value used by `inject`.
 * - `undefined`: it is an error to call `inject`
 * - `null`: `inject` can be called but there is no injector (limp-mode).
 * - Injector instance: Use the injector for resolution.
 */
let /** @type {?} */ _currentInjector = undefined;
/**
 * @param {?} injector
 * @return {?}
 */
export function setCurrentInjector(injector) {
    const /** @type {?} */ former = _currentInjector;
    _currentInjector = injector;
    return former;
}
/**
 * @template T
 * @param {?} token
 * @param {?=} flags
 * @return {?}
 */
export function inject(token, flags = 0 /* Default */) {
    if (_currentInjector === undefined) {
        throw new Error(`inject() must be called from an injection context`);
    }
    else if (_currentInjector === null) {
        const /** @type {?} */ injectableDef = (/** @type {?} */ (token)).ngInjectableDef;
        if (injectableDef && injectableDef.providedIn == 'root') {
            return injectableDef.value === undefined ? injectableDef.value = injectableDef.factory() :
                injectableDef.value;
        }
        if (flags & 8 /* Optional */)
            return null;
        throw new Error(`Injector: NOT_FOUND [${stringify(token)}]`);
    }
    else {
        return _currentInjector.get(token, flags & 8 /* Optional */ ? null : undefined, flags);
    }
}
/**
 * @param {?} types
 * @return {?}
 */
export function injectArgs(types) {
    const /** @type {?} */ args = [];
    for (let /** @type {?} */ i = 0; i < types.length; i++) {
        const /** @type {?} */ arg = types[i];
        if (Array.isArray(arg)) {
            if (arg.length === 0) {
                throw new Error('Arguments array must have arguments.');
            }
            let /** @type {?} */ type = undefined;
            let /** @type {?} */ flags = 0 /* Default */;
            for (let /** @type {?} */ j = 0; j < arg.length; j++) {
                const /** @type {?} */ meta = arg[j];
                if (meta instanceof Optional || meta.ngMetadataName === 'Optional') {
                    flags |= 8 /* Optional */;
                }
                else if (meta instanceof SkipSelf || meta.ngMetadataName === 'SkipSelf') {
                    flags |= 4 /* SkipSelf */;
                }
                else if (meta instanceof Self || meta.ngMetadataName === 'Self') {
                    flags |= 2 /* Self */;
                }
                else if (meta instanceof Inject) {
                    type = meta.token;
                }
                else {
                    type = meta;
                }
            }
            args.push(inject(/** @type {?} */ ((type)), flags));
        }
        else {
            args.push(inject(arg));
        }
    }
    return args;
}
export { ɵ0, ɵ1 };

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5qZWN0b3IuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9kaS9pbmplY3Rvci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQVNBLE9BQU8sRUFBQyxTQUFTLEVBQUMsTUFBTSxTQUFTLENBQUM7QUFFbEMsT0FBTyxFQUFnQixnQkFBZ0IsRUFBQyxNQUFNLFFBQVEsQ0FBQztBQUN2RCxPQUFPLEVBQUMsaUJBQWlCLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFDaEQsT0FBTyxFQUFDLGNBQWMsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQ2pELE9BQU8sRUFBQyxNQUFNLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUMsTUFBTSxZQUFZLENBQUM7QUFHNUQsTUFBTSxDQUFDLHVCQUFNLE1BQU0sR0FBRyxVQUFVLENBQUM7QUFDakMsdUJBQU0sbUJBQW1CLEdBQUcsSUFBSSxNQUFNLEVBQUUsQ0FBQztBQUN6QyxNQUFNLENBQUMsdUJBQU0sa0JBQWtCLEdBQUcsbUJBQW1CLENBQUM7Ozs7Ozs7OztBQVV0RCxNQUFNLENBQUMsdUJBQU0sUUFBUSxHQUFHLElBQUksY0FBYyxDQUFXLFVBQVUsQ0FBQyxDQUFDO0FBRWpFLE1BQU07Ozs7OztJQUNKLEdBQUcsQ0FBQyxLQUFVLEVBQUUsZ0JBQXFCLG1CQUFtQjtRQUN0RCxJQUFJLGFBQWEsS0FBSyxtQkFBbUIsRUFBRTs7Ozs7WUFLekMsTUFBTSxJQUFJLEtBQUssQ0FBQyxzQ0FBc0MsU0FBUyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztTQUM1RTtRQUNELE9BQU8sYUFBYSxDQUFDO0tBQ3RCO0NBQ0Y7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQWtCRCxNQUFNOzs7Ozs7Ozs7Ozs7SUErQkosTUFBTSxDQUFDLE1BQU0sQ0FDVCxPQUF5RixFQUN6RixNQUFpQjtRQUNuQixJQUFJLEtBQUssQ0FBQyxPQUFP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Qy9CO3FCQUFNLElBQUksSUFBSSxZQUFZLElBQUksSUFBSSxJQUFJLENBQUMsY0FBYyxLQUFLLE1BQU0sRUFBRTtvQkFDakUsS0FBSyxnQkFBb0IsQ0FBQztpQkFDM0I7cUJBQU0sSUFBSSxJQUFJLFlBQVksTUFBTSxFQUFFO29CQUNqQyxJQUFJLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQztpQkFDbkI7cUJBQU07b0JBQ0wsSUFBSSxHQUFHLElBQUksQ0FBQztpQkFDYjthQUNGO1lBRUQsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLG9CQUFDLElBQUksSUFBSSxLQUFLLENBQUMsQ0FBQyxDQUFDO1NBQ2xDO2FBQU07WUFDTCxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO1NBQ3hCO0tBQ0Y7SUFDRCxPQUFPLElBQUksQ0FBQztDQUNiIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1R5cGV9IGZyb20gJy4uL3R5cGUnO1xuaW1wb3J0IHtzdHJpbmdpZnl9IGZyb20gJy4uL3V0aWwnO1xuXG5pbXBvcnQge0luamVjdGFibGVEZWYsIGRlZmluZUluamVjdGFibGV9IGZyb20gJy4vZGVmcyc7XG5pbXBvcnQge3Jlc29sdmVGb3J3YXJkUmVmfSBmcm9tICcuL2ZvcndhcmRfcmVmJztcbmltcG9ydCB7SW5qZWN0aW9uVG9rZW59IGZyb20gJy4vaW5qZWN0aW9uX3Rva2VuJztcbmltcG9ydCB7SW5qZWN0LCBPcHRpb25hbCwgU2VsZiwgU2tpcFNlbGZ9IGZyb20gJy4vbWV0YWRhdGEnO1xuaW1wb3J0IHtDb25zdHJ1Y3RvclByb3ZpZGVyLCBFeGlzdGluZ1Byb3ZpZGVyLCBGYWN0b3J5UHJvdmlkZXIsIFN0YXRpY0NsYXNzUHJvdmlkZXIsIFN0YXRpY1Byb3ZpZGVyLCBWYWx1ZVByb3ZpZGVyfSBmcm9tICcuL3Byb3ZpZGVyJztcblxuZXhwb3J0IGNvbnN0IFNPVVJDRSA9ICdfX3NvdXJjZSc7XG5jb25zdCBfVEhST1dfSUZfTk9UX0ZPVU5EID0gbmV3IE9iamVjdCgpO1xuZXhwb3J0IGNvbnN0IFRIUk9XX0lGX05PVF9GT1VORCA9IF9USFJPV19JRl9OT1RfRk9VTkQ7XG5cbi8qKlxuICogQW4gSW5qZWN0aW9uVG9rZW4gdGhhdCBnZXRzIHRoZSBjdXJyZW50IGBJbmplY3RvcmAgZm9yIGBjcmVhdGVJbmplY3RvcigpYC1zdHlsZSBpbmplY3RvcnMuXG4gKlxuICogUmVxdWVzdGluZyB0aGlzIHRva2VuIGluc3RlYWQgb2YgYEluamVjdG9yYCBhbGxvd3MgYFN0YXRpY0luamVjdG9yYCB0byBiZSB0cmVlLXNoYWtlbiBmcm9tIGFcbiAqIHByb2plY3QuXG4gKlxuICogQGV4cGVyaW1lbnRhbFxuICovXG5leHBvcnQgY29uc3QgSU5KRUNUT1IgPSBuZXcgSW5qZWN0aW9uVG9rZW48SW5qZWN0b3I+KCdJTkpFQ1RPUicpO1xuXG5leHBvcnQgY2xhc3MgTnVsbEluamVjdG9yIGltcGxlbWVudHMgSW5qZWN0b3Ige1xuICBnZXQodG9rZW46IGFueSwgbm90Rm91bmRWYWx1ZTogYW55ID0gX1RIUk9XX0lGX05PVF9GT1VORCk6IGFueSB7XG4gICAgaWYgKG5vdEZvdW5kVmFsdWUgPT09IF9USFJPV19JRl9OT1RfRk9VTkQpIHtcbiAgICAgIC8vIEludGVudGlvbmFsbHkgbGVmdCBiZWhpbmQ6IFdpdGggZGV2IHRvb2xzIG9wZW4gdGhlIGRlYnVnZ2VyIHdpbGwgc3RvcCBoZXJlLiBUaGVyZSBpcyBub1xuICAgICAgLy8gcmVhc29uIHdoeSBjb3JyZWN0bHkgd3JpdHRlbiBhcHBsaWNhdGlvbiBzaG91bGQgY2F1c2UgdGhpcyBleGNlcHRpb24uXG4gICAgICAvLyBUT0RPKG1pc2tvKTogdW5jb21tZW50IHRoZSBuZXh0IGxpbmUgb25jZSBgbmdEZXZNb2RlYCB3b3JrcyB3aXRoIGNsb3N1cmUuXG4gICAgICAvLyBpZihuZ0Rldk1vZGUpIGRlYnVnZ2VyO1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBOdWxsSW5qZWN0b3JFcnJvcjogTm8gcHJvdmlkZXIgZm9yICR7c3RyaW5naWZ5KHRva2VuKX0hYCk7XG4gICAgfVxuICAgIHJldHVybiBub3RGb3VuZFZhbHVlO1xuICB9XG59XG5cbi8qKlxuICogQ29uY3JldGUgaW5qZWN0b3JzIGltcGxlbWVudCB0aGlzIGludGVyZmFjZS5cbiAqXG4gKiBGb3IgbW9yZSBkZXRhaWxzLCBzZWUgdGhlIFtcIkRlcGVuZGVuY3kgSW5qZWN0aW9uIEd1aWRlXCJdKGd1aWRlL2RlcGVuZGVuY3ktaW5qZWN0aW9uKS5cbiAqXG4gKiBAdXNhZ2VOb3Rlc1xuICogIyMjIEV4YW1wbGVcbiAqXG4gKiB7QGV4YW1wbGUgY29yZS9kaS90cy9pbmplY3Rvcl9zcGVjLnRzIHJlZ2lvbj0nSW5qZWN0b3InfVxuICpcbiAqIGBJbmplY3RvcmAgcmV0dXJucyBpdHNlbGYgd2hlbiBnaXZlbiBgSW5qZWN0b3JgIGFzIGEgdG9rZW46XG4gKlxuICoge0BleGFtcGxlIGNvcmUvZGkvdHMvaW5qZWN0b3Jfc3BlYy50cyByZWdpb249J2luamVjdEluamVjdG9yJ31cbiAqXG4gKlxuICovXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgSW5qZWN0b3Ige1xuICBzdGF0aWMgVEhST1dfSUZfTk9UX0ZPVU5EID0gX1RIUk9XX0lGX05PVF9GT1VORDtcbiAgc3RhdGljIE5VTEw6IEluamVjdG9yID0gbmV3IE51bGxJbmplY3RvcigpO1xuXG4gIC8qKlxuICAgKiBSZXRyaWV2ZXMgYW4gaW5zdGFuY2UgZnJvbSB0aGUgaW5qZWN0b3IgYmFzZWQgb24gdGhlIHByb3ZpZGVkIHRva2VuLlxuICAgKiBAcmV0dXJucyBUaGUgaW5zdGFuY2UgZnJvbSB0aGUgaW5qZWN0b3IgaWYgZGVmaW5lZCwgb3RoZXJ3aXNlIHRoZSBgbm90Rm91bmRWYWx1ZWAuXG4gICAqIEB0aHJvd3MgV2hlbiB0aGUgYG5vdEZvdW5kVmFsdWVgIGlzIGB1bmRlZmluZWRgIG9yIGBJbmplY3Rvci5USFJPV19JRl9OT1RfRk9VTkRgLlxuICAgKi9cbiAgYWJzdHJhY3QgZ2V0PFQ+KHRva2VuOiBUeXBlPFQ+fEluamVjdGlvblRva2VuPFQ+LCBub3RGb3VuZFZhbHVlPzogVCwgZmxhZ3M/OiBJbmplY3RGbGFncyk6IFQ7XG4gIC8qKlxuICAgKiBAZGVwcmVjYXRlZCBmcm9tIHY0LjAuMCB1c2UgVHlwZTxUPiBvciBJbmplY3Rpb25Ub2tlbjxUPlxuICAgKiBAc3VwcHJlc3Mge2R1cGxpY2F0ZX1cbiAgICovXG4gIGFic3RyYWN0IGdldCh0b2tlbjogYW55LCBub3RGb3VuZFZhbHVlPzogYW55KTogYW55O1xuXG4gIC8qKlxuICAgKiBAZGVwcmVjYXRlZCBmcm9tIHY1IHVzZSB0aGUgbmV3IHNpZ25hdHVyZSBJbmplY3Rvci5jcmVhdGUob3B0aW9ucylcbiAgICovXG4gIHN0YXRpYyBjcmVhdGUocHJvdmlkZXJzOiBTdGF0aWNQcm92aWRlcltdLCBwYXJlbnQ/OiBJbmplY3Rvcik6IEluamVjdG9yO1xuXG4gIHN0YXRpYyBjcmVhdGUob3B0aW9uczoge3Byb3ZpZGVyczogU3RhdGljUHJvdmlkZXJbXSwgcGFyZW50PzogSW5qZWN0b3IsIG5hbWU/OiBzdHJpbmd9KTogSW5qZWN0b3I7XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBhIG5ldyBJbmplY3RvciB3aGljaCBpcyBjb25maWd1cmUgdXNpbmcgYFN0YXRpY1Byb3ZpZGVyYHMuXG4gICAqXG4gICAqIEB1c2FnZU5vdGVzXG4gICAqICMjIyBFeGFtcGxlXG4gICAqXG4gICAqIHtAZXhhbXBsZSBjb3JlL2RpL3RzL3Byb3ZpZGVyX3NwZWMudHMgcmVnaW9uPSdDb25zdHJ1Y3RvclByb3ZpZGVyJ31cbiAgICovXG4gIHN0YXRpYyBjcmVhdGUoXG4gICAgICBvcHRpb25zOiBTdGF0aWNQcm92aWRlcltdfHtwcm92aWRlcnM6IFN0YXRpY1Byb3ZpZGVyW10sIHBhcmVudD86IEluamVjdG9yLCBuYW1lPzogc3RyaW5nfSxcbiAgICAgIHBhcmVudD86IEluamVjdG9yKTogSW5qZWN0b3Ige1xuICAgIGlmIChBcnJheS5pc0FycmF5KG9wdGlvbnMpKSB7XG4gICAgICByZXR1cm4gbmV3IFN0YXRpY0luamVjdG9yKG9wdGlvbnMsIHBhcmVudCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBuZXcgU3RhdGljSW5qZWN0b3Iob3B0aW9ucy5wcm92aWRlcnMsIG9wdGlvbnMucGFyZW50LCBvcHRpb25zLm5hbWUgfHwgbnVsbCk7XG4gICAgfVxuICB9XG5cbiAgc3RhdGljIG5nSW5qZWN0YWJsZURlZiA9IGRlZmluZUluamVjdGFibGUoe1xuICAgIHByb3ZpZGVkSW46ICdhbnknIGFzIGFueSxcbiAgICBmYWN0b3J5OiAoKSA9PiBpbmplY3QoSU5KRUNUT1IpLFxuICB9KTtcbn1cblxuXG5cbmNvbnN0IElERU5UID0gZnVuY3Rpb248VD4odmFsdWU6IFQpOiBUIHtcbiAgcmV0dXJuIHZhbHVlO1xufTtcbmNvbnN0IEVNUFRZID0gPGFueVtdPltdO1xuY29uc3QgQ0lSQ1VMQVIgPSBJREVOVDtcbmNvbnN0IE1VTFRJX1BST1ZJREVSX0ZOID0gZnVuY3Rpb24oKTogYW55W10ge1xuICByZXR1cm4gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzKTtcbn07XG5jb25zdCBHRVRfUFJPUEVSVFlfTkFNRSA9IHt9IGFzIGFueTtcbmV4cG9ydCBjb25zdCBVU0VfVkFMVUUgPVxuICAgIGdldENsb3N1cmVTYWZlUHJvcGVydHk8VmFsdWVQcm92aWRlcj4oe3Byb3ZpZGU6IFN0cmluZywgdXNlVmFsdWU6IEdFVF9QUk9QRVJUWV9OQU1FfSk7XG5jb25zdCBOR19UT0tFTl9QQVRIID0gJ25nVG9rZW5QYXRoJztcbmNvbnN0IE5HX1RFTVBfVE9LRU5fUEFUSCA9ICduZ1RlbXBUb2tlblBhdGgnO1xuY29uc3QgZW51bSBPcHRpb25GbGFncyB7XG4gIE9wdGlvbmFsID0gMSA8PCAwLFxuICBDaGVja1NlbGYgPSAxIDw8IDEsXG4gIENoZWNrUGFyZW50ID0gMSA8PCAyLFxuICBEZWZhdWx0ID0gQ2hlY2tTZWxmIHwgQ2hlY2tQYXJlbnRcbn1cbmNvbnN0IE5VTExfSU5KRUNUT1IgPSBJbmplY3Rvci5OVUxMO1xuY29uc3QgTkVXX0xJTkUgPSAvXFxuL2dtO1xuY29uc3QgTk9fTkVXX0xJTkUgPSAnybUnO1xuXG5leHBvcnQgY2xhc3MgU3RhdGljSW5qZWN0b3IgaW1wbGVtZW50cyBJbmplY3RvciB7XG4gIHJlYWRvbmx5IHBhcmVudDogSW5qZWN0b3I7XG4gIHJlYWRvbmx5IHNvdXJjZTogc3RyaW5nfG51bGw7XG5cbiAgcHJpdmF0ZSBfcmVjb3JkczogTWFwPGFueSwgUmVjb3JkPjtcblxuICBjb25zdHJ1Y3RvcihcbiAgICAgIHByb3ZpZGVyczogU3RhdGljUHJvdmlkZXJbXSwgcGFyZW50OiBJbmplY3RvciA9IE5VTExfSU5KRUNUT1IsIHNvdXJjZTogc3RyaW5nfG51bGwgPSBudWxsKSB7XG4gICAgdGhpcy5wYXJlbnQgPSBwYXJlbnQ7XG4gICAgdGhpcy5zb3VyY2UgPSBzb3VyY2U7XG4gICAgY29uc3QgcmVjb3JkcyA9IHRoaXMuX3JlY29yZHMgPSBuZXcgTWFwPGFueSwgUmVjb3JkPigpO1xuICAgIHJlY29yZHMuc2V0KFxuICAgICAgICBJbmplY3RvciwgPFJlY29yZD57dG9rZW46IEluamVjdG9yLCBmbjogSURFTlQsIGRlcHM6IEVNUFRZLCB2YWx1ZTogdGhpcywgdXNlTmV3OiBmYWxzZX0pO1xuICAgIHJlY29yZHMuc2V0KFxuICAgICAgICBJTkpFQ1RPUiwgPFJlY29yZD57dG9rZW46IElOSkVDVE9SLCBmbjogSURFTlQsIGRlcHM6IEVNUFRZLCB2YWx1ZTogdGhpcywgdXNlTmV3OiBmYWxzZX0pO1xuICAgIHJlY3Vyc2l2ZWx5UHJvY2Vzc1Byb3ZpZGVycyhyZWNvcmRzLCBwcm92aWRlcnMpO1xuICB9XG5cbiAgZ2V0PFQ+KHRva2VuOiBUeXBlPFQ+fEluamVjdGlvblRva2VuPFQ+LCBub3RGb3VuZFZhbHVlPzogVCwgZmxhZ3M/OiBJbmplY3RGbGFncyk6IFQ7XG4gIGdldCh0b2tlbjogYW55LCBub3RGb3VuZFZhbHVlPzogYW55KTogYW55O1xuICBnZXQodG9rZW46IGFueSwgbm90Rm91bmRWYWx1ZT86IGFueSwgZmxhZ3M6IEluamVjdEZsYWdzID0gSW5qZWN0RmxhZ3MuRGVmYXVsdCk6IGFueSB7XG4gICAgY29uc3QgcmVjb3JkID0gdGhpcy5fcmVjb3Jkcy5nZXQodG9rZW4pO1xuICAgIHRyeSB7XG4gICAgICByZXR1cm4gdHJ5UmVzb2x2ZVRva2VuKHRva2VuLCByZWNvcmQsIHRoaXMuX3JlY29yZHMsIHRoaXMucGFyZW50LCBub3RGb3VuZFZhbHVlLCBmbGFncyk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgY29uc3QgdG9rZW5QYXRoOiBhbnlbXSA9IGVbTkdfVEVNUF9UT0tFTl9QQVRIXTtcbiAgICAgIGlmICh0b2tlbltTT1VSQ0VdKSB7XG4gICAgICAgIHRva2VuUGF0aC51bnNoaWZ0KHRva2VuW1NPVVJDRV0pO1xuICAgICAgfVxuICAgICAgZS5tZXNzYWdlID0gZm9ybWF0RXJyb3IoJ1xcbicgKyBlLm1lc3NhZ2UsIHRva2VuUGF0aCwgdGhpcy5zb3VyY2UpO1xuICAgICAgZVtOR19UT0tFTl9QQVRIXSA9IHRva2VuUGF0aDtcbiAgICAgIGVbTkdfVEVNUF9UT0tFTl9QQVRIXSA9IG51bGw7XG4gICAgICB0aHJvdyBlO1xuICAgIH1cbiAgfVxuXG4gIHRvU3RyaW5nKCkge1xuICAgIGNvbnN0IHRva2VucyA9IDxzdHJpbmdbXT5bXSwgcmVjb3JkcyA9IHRoaXMuX3JlY29yZHM7XG4gICAgcmVjb3Jkcy5mb3JFYWNoKCh2LCB0b2tlbikgPT4gdG9rZW5zLnB1c2goc3RyaW5naWZ5KHRva2VuKSkpO1xuICAgIHJldHVybiBgU3RhdGljSW5qZWN0b3JbJHt0b2tlbnMuam9pbignLCAnKX1dYDtcbiAgfVxufVxuXG50eXBlIFN1cHBvcnRlZFByb3ZpZGVyID1cbiAgICBWYWx1ZVByb3ZpZGVyIHwgRXhpc3RpbmdQcm92aWRlciB8IFN0YXRpY0NsYXNzUHJvdmlkZXIgfCBDb25zdHJ1Y3RvclByb3ZpZGVyIHwgRmFjdG9yeVByb3ZpZGVyO1xuXG5pbnRlcmZhY2UgUmVjb3JkIHtcbiAgZm46IEZ1bmN0aW9uO1xuICB1c2VOZXc6IGJvb2xlYW47XG4gIGRlcHM6IERlcGVuZGVuY3lSZWNvcmRbXTtcbiAgdmFsdWU6IGFueTtcbn1cblxuaW50ZXJmYWNlIERlcGVuZGVuY3lSZWNvcmQge1xuICB0b2tlbjogYW55O1xuICBvcHRpb25zOiBudW1iZXI7XG59XG5cbnR5cGUgVG9rZW5QYXRoID0gQXJyYXk8YW55PjtcblxuZnVuY3Rpb24gcmVzb2x2ZVByb3ZpZGVyKHByb3ZpZGVyOiBTdXBwb3J0ZWRQcm92aWRlcik6IFJlY29yZCB7XG4gIGNvbnN0IGRlcHMgPSBjb21wdXRlRGVwcyhwcm92aWRlcik7XG4gIGxldCBmbjogRnVuY3Rpb24gPSBJREVOVDtcbiAgbGV0IHZhbHVlOiBhbnkgPSBFTVBUWTtcbiAgbGV0IHVzZU5ldzogYm9vbGVhbiA9IGZhbHNlO1xuICBsZXQgcHJvdmlkZSA9IHJlc29sdmVGb3J3YXJkUmVmKHByb3ZpZGVyLnByb3ZpZGUpO1xuICBpZiAoVVNFX1ZBTFVFIGluIHByb3ZpZGVyKSB7XG4gICAgLy8gV2UgbmVlZCB0byB1c2UgVVNFX1ZBTFVFIGluIHByb3ZpZGVyIHNpbmNlIHByb3ZpZGVyLnVzZVZhbHVlIGNvdWxkIGJlIGRlZmluZWQgYXMgdW5kZWZpbmVkLlxuICAgIHZhbHVlID0gKHByb3ZpZGVyIGFzIFZhbHVlUHJvdmlkZXIpLnVzZVZhbHVlO1xuICB9IGVsc2UgaWYgKChwcm92aWRlciBhcyBGYWN0b3J5UHJvdmlkZXIpLnVzZUZhY3RvcnkpIHtcbiAgICBmbiA9IChwcm92aWRlciBhcyBGYWN0b3J5UHJvdmlkZXIpLnVzZUZhY3Rvcnk7XG4gIH0gZWxzZSBpZiAoKHByb3ZpZGVyIGFzIEV4aXN0aW5nUHJvdmlkZXIpLnVzZUV4aXN0aW5nKSB7XG4gICAgLy8gSnVzdCB1c2UgSURFTlRcbiAgfSBlbHNlIGlmICgocHJvdmlkZXIgYXMgU3RhdGljQ2xhc3NQcm92aWRlcikudXNlQ2xhc3MpIHtcbiAgICB1c2VOZXcgPSB0cnVlO1xuICAgIGZuID0gcmVzb2x2ZUZvcndhcmRSZWYoKHByb3ZpZGVyIGFzIFN0YXRpY0NsYXNzUHJvdmlkZXIpLnVzZUNsYXNzKTtcbiAgfSBlbHNlIGlmICh0eXBlb2YgcHJvdmlkZSA9PSAnZnVuY3Rpb24nKSB7XG4gICAgdXNlTmV3ID0gdHJ1ZTtcbiAgICBmbiA9IHByb3ZpZGU7XG4gIH0gZWxzZSB7XG4gICAgdGhyb3cgc3RhdGljRXJyb3IoXG4gICAgICAgICdTdGF0aWNQcm92aWRlciBkb2VzIG5vdCBoYXZlIFt1c2VWYWx1ZXx1c2VGYWN0b3J5fHVzZUV4aXN0aW5nfHVzZUNsYXNzXSBvciBbcHJvdmlkZV0gaXMgbm90IG5ld2FibGUnLFxuICAgICAgICBwcm92aWRlcik7XG4gIH1cbiAgcmV0dXJuIHtkZXBzLCBmbiwgdXNlTmV3LCB2YWx1ZX07XG59XG5cbmZ1bmN0aW9uIG11bHRpUHJvdmlkZXJNaXhFcnJvcih0b2tlbjogYW55KSB7XG4gIHJldHVybiBzdGF0aWNFcnJvcignQ2Fubm90IG1peCBtdWx0aSBwcm92aWRlcnMgYW5kIHJlZ3VsYXIgcHJvdmlkZXJzJywgdG9rZW4pO1xufVxuXG5mdW5jdGlvbiByZWN1cnNpdmVseVByb2Nlc3NQcm92aWRlcnMocmVjb3JkczogTWFwPGFueSwgUmVjb3JkPiwgcHJvdmlkZXI6IFN0YXRpY1Byb3ZpZGVyKSB7XG4gIGlmIChwcm92aWRlcikge1xuICAgIHByb3ZpZGVyID0gcmVzb2x2ZUZvcndhcmRSZWYocHJvdmlkZXIpO1xuICAgIGlmIChwcm92aWRlciBpbnN0YW5jZW9mIEFycmF5KSB7XG4gICAgICAvLyBpZiB3ZSBoYXZlIGFuIGFycmF5IHJlY3Vyc2UgaW50byB0aGUgYXJyYXlcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcHJvdmlkZXIubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgcmVjdXJzaXZlbHlQcm9jZXNzUHJvdmlkZXJzKHJlY29yZHMsIHByb3ZpZGVyW2ldKTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBwcm92aWRlciA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgLy8gRnVuY3Rpb25zIHdlcmUgc3VwcG9ydGVkIGluIFJlZmxlY3RpdmVJbmplY3RvciwgYnV0IGFyZSBub3QgaGVyZS4gRm9yIHNhZmV0eSBnaXZlIHVzZWZ1bFxuICAgICAgLy8gZXJyb3IgbWVzc2FnZXNcbiAgICAgIHRocm93IHN0YXRpY0Vycm9yKCdGdW5jdGlvbi9DbGFzcyBub3Qgc3VwcG9ydGVkJywgcHJvdmlkZXIpO1xuICAgIH0gZWxzZSBpZiAocHJvdmlkZXIgJiYgdHlwZW9mIHByb3ZpZGVyID09PSAnb2JqZWN0JyAmJiBwcm92aWRlci5wcm92aWRlKSB7XG4gICAgICAvLyBBdCB0aGlzIHBvaW50IHdlIGhhdmUgd2hhdCBsb29rcyBsaWtlIGEgcHJvdmlkZXI6IHtwcm92aWRlOiA/LCAuLi4ufVxuICAgICAgbGV0IHRva2VuID0gcmVzb2x2ZUZvcndhcmRSZWYocHJvdmlkZXIucHJvdmlkZSk7XG4gICAgICBjb25zdCByZXNvbHZlZFByb3ZpZGVyID0gcmVzb2x2ZVByb3ZpZGVyKHByb3ZpZGVyKTtcbiAgICAgIGlmIChwcm92aWRlci5tdWx0aSA9PT0gdHJ1ZSkge1xuICAgICAgICAvLyBUaGlzIGlzIGEgbXVsdGkgcHJvdmlkZXIuXG4gICAgICAgIGxldCBtdWx0aVByb3ZpZGVyOiBSZWNvcmR8dW5kZWZpbmVkID0gcmVjb3Jkcy5nZXQodG9rZW4pO1xuICAgICAgICBpZiAobXVsdGlQcm92aWRlcikge1xuICAgICAgICAgIGlmIChtdWx0aVByb3ZpZGVyLmZuICE9PSBNVUxUSV9QUk9WSURFUl9GTikge1xuICAgICAgICAgICAgdGhyb3cgbXVsdGlQcm92aWRlck1peEVycm9yKHRva2VuKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gQ3JlYXRlIGEgcGxhY2Vob2xkZXIgZmFjdG9yeSB3aGljaCB3aWxsIGxvb2sgdXAgdGhlIGNvbnN0aXR1ZW50cyBvZiB0aGUgbXVsdGkgcHJvdmlkZXIuXG4gICAgICAgICAgcmVjb3Jkcy5zZXQodG9rZW4sIG11bHRpUHJvdmlkZXIgPSA8UmVjb3JkPntcbiAgICAgICAgICAgIHRva2VuOiBwcm92aWRlci5wcm92aWRlLFxuICAgICAgICAgICAgZGVwczogW10sXG4gICAgICAgICAgICB1c2VOZXc6IGZhbHNlLFxuICAgICAgICAgICAgZm46IE1VTFRJX1BST1ZJREVSX0ZOLFxuICAgICAgICAgICAgdmFsdWU6IEVNUFRZXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gVHJlYXQgdGhlIHByb3ZpZGVyIGFzIHRoZSB0b2tlbi5cbiAgICAgICAgdG9rZW4gPSBwcm92aWRlcjtcbiAgICAgICAgbXVsdGlQcm92aWRlci5kZXBzLnB1c2goe3Rva2VuLCBvcHRpb25zOiBPcHRpb25GbGFncy5EZWZhdWx0fSk7XG4gICAgICB9XG4gICAgICBjb25zdCByZWNvcmQgPSByZWNvcmRzLmdldCh0b2tlbik7XG4gICAgICBpZiAocmVjb3JkICYmIHJlY29yZC5mbiA9PSBNVUxUSV9QUk9WSURFUl9GTikge1xuICAgICAgICB0aHJvdyBtdWx0aVByb3ZpZGVyTWl4RXJyb3IodG9rZW4pO1xuICAgICAgfVxuICAgICAgcmVjb3Jkcy5zZXQodG9rZW4sIHJlc29sdmVkUHJvdmlkZXIpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBzdGF0aWNFcnJvcignVW5leHBlY3RlZCBwcm92aWRlcicsIHByb3ZpZGVyKTtcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gdHJ5UmVzb2x2ZVRva2VuKFxuICAgIHRva2VuOiBhbnksIHJlY29yZDogUmVjb3JkIHwgdW5kZWZpbmVkLCByZWNvcmRzOiBNYXA8YW55LCBSZWNvcmQ+LCBwYXJlbnQ6IEluamVjdG9yLFxuICAgIG5vdEZvdW5kVmFsdWU6IGFueSwgZmxhZ3M6IEluamVjdEZsYWdzKTogYW55IHtcbiAgdHJ5IHtcbiAgICByZXR1cm4gcmVzb2x2ZVRva2VuKHRva2VuLCByZWNvcmQsIHJlY29yZHMsIHBhcmVudCwgbm90Rm91bmRWYWx1ZSwgZmxhZ3MpO1xuICB9IGNhdGNoIChlKSB7XG4gICAgLy8gZW5zdXJlIHRoYXQgJ2UnIGlzIG9mIHR5cGUgRXJyb3IuXG4gICAgaWYgKCEoZSBpbnN0YW5jZW9mIEVycm9yKSkge1xuICAgICAgZSA9IG5ldyBFcnJvcihlKTtcbiAgICB9XG4gICAgY29uc3QgcGF0aDogYW55W10gPSBlW05HX1RFTVBfVE9LRU5fUEFUSF0gPSBlW05HX1RFTVBfVE9LRU5fUEFUSF0gfHwgW107XG4gICAgcGF0aC51bnNoaWZ0KHRva2VuKTtcbiAgICBpZiAocmVjb3JkICYmIHJlY29yZC52YWx1ZSA9PSBDSVJDVUxBUikge1xuICAgICAgLy8gUmVzZXQgdGhlIENpcmN1bGFyIGZsYWcuXG4gICAgICByZWNvcmQudmFsdWUgPSBFTVBUWTtcbiAgICB9XG4gICAgdGhyb3cgZTtcbiAgfVxufVxuXG5mdW5jdGlvbiByZXNvbHZlVG9rZW4oXG4gICAgdG9rZW46IGFueSwgcmVjb3JkOiBSZWNvcmQgfCB1bmRlZmluZWQsIHJlY29yZHM6IE1hcDxhbnksIFJlY29yZD4sIHBhcmVudDogSW5qZWN0b3IsXG4gICAgbm90Rm91bmRWYWx1ZTogYW55LCBmbGFnczogSW5qZWN0RmxhZ3MpOiBhbnkge1xuICBsZXQgdmFsdWU7XG4gIGlmIChyZWNvcmQgJiYgIShmbGFncyAmIEluamVjdEZsYWdzLlNraXBTZWxmKSkge1xuICAgIC8vIElmIHdlIGRvbid0IGhhdmUgYSByZWNvcmQsIHRoaXMgaW1wbGllcyB0aGF0IHdlIGRvbid0IG93biB0aGUgcHJvdmlkZXIgaGVuY2UgZG9uJ3Qga25vdyBob3dcbiAgICAvLyB0byByZXNvbHZlIGl0LlxuICAgIHZhbHVlID0gcmVjb3JkLnZhbHVlO1xuICAgIGlmICh2YWx1ZSA9PSBDSVJDVUxBUikge1xuICAgICAgdGhyb3cgRXJyb3IoTk9fTkVXX0xJTkUgKyAnQ2lyY3VsYXIgZGVwZW5kZW5jeScpO1xuICAgIH0gZWxzZSBpZiAodmFsdWUgPT09IEVNUFRZKSB7XG4gICAgICByZWNvcmQudmFsdWUgPSBDSVJDVUxBUjtcbiAgICAgIGxldCBvYmogPSB1bmRlZmluZWQ7XG4gICAgICBsZXQgdXNlTmV3ID0gcmVjb3JkLnVzZU5ldztcbiAgICAgIGxldCBmbiA9IHJlY29yZC5mbjtcbiAgICAgIGxldCBkZXBSZWNvcmRzID0gcmVjb3JkLmRlcHM7XG4gICAgICBsZXQgZGVwcyA9IEVNUFRZO1xuICAgICAgaWYgKGRlcFJlY29yZHMubGVuZ3RoKSB7XG4gICAgICAgIGRlcHMgPSBbXTtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBkZXBSZWNvcmRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgY29uc3QgZGVwUmVjb3JkOiBEZXBlbmRlbmN5UmVjb3JkID0gZGVwUmVjb3Jkc1tpXTtcbiAgICAgICAgICBjb25zdCBvcHRpb25zID0gZGVwUmVjb3JkLm9wdGlvbnM7XG4gICAgICAgICAgY29uc3QgY2hpbGRSZWNvcmQgPVxuICAgICAgICAgICAgICBvcHRpb25zICYgT3B0aW9uRmxhZ3MuQ2hlY2tTZWxmID8gcmVjb3Jkcy5nZXQoZGVwUmVjb3JkLnRva2VuKSA6IHVuZGVmaW5lZDtcbiAgICAgICAgICBkZXBzLnB1c2godHJ5UmVzb2x2ZVRva2VuKFxuICAgICAgICAgICAgICAvLyBDdXJyZW50IFRva2VuIHRvIHJlc29sdmVcbiAgICAgICAgICAgICAgZGVwUmVjb3JkLnRva2VuLFxuICAgICAgICAgICAgICAvLyBBIHJlY29yZCB3aGljaCBkZXNjcmliZXMgaG93IHRvIHJlc29sdmUgdGhlIHRva2VuLlxuICAgICAgICAgICAgICAvLyBJZiB1bmRlZmluZWQsIHRoaXMgbWVhbnMgd2UgZG9uJ3QgaGF2ZSBzdWNoIGEgcmVjb3JkXG4gICAgICAgICAgICAgIGNoaWxkUmVjb3JkLFxuICAgICAgICAgICAgICAvLyBPdGhlciByZWNvcmRzIHdlIGtub3cgYWJvdXQuXG4gICAgICAgICAgICAgIHJlY29yZHMsXG4gICAgICAgICAgICAgIC8vIElmIHdlIGRvbid0IGtub3cgaG93IHRvIHJlc29sdmUgZGVwZW5kZW5jeSBhbmQgd2Ugc2hvdWxkIG5vdCBjaGVjayBwYXJlbnQgZm9yIGl0LFxuICAgICAgICAgICAgICAvLyB0aGFuIHBhc3MgaW4gTnVsbCBpbmplY3Rvci5cbiAgICAgICAgICAgICAgIWNoaWxkUmVjb3JkICYmICEob3B0aW9ucyAmIE9wdGlvbkZsYWdzLkNoZWNrUGFyZW50KSA/IE5VTExfSU5KRUNUT1IgOiBwYXJlbnQsXG4gICAgICAgICAgICAgIG9wdGlvbnMgJiBPcHRpb25GbGFncy5PcHRpb25hbCA/IG51bGwgOiBJbmplY3Rvci5USFJPV19JRl9OT1RfRk9VTkQsXG4gICAgICAgICAgICAgIEluamVjdEZsYWdzLkRlZmF1bHQpKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmVjb3JkLnZhbHVlID0gdmFsdWUgPSB1c2VOZXcgPyBuZXcgKGZuIGFzIGFueSkoLi4uZGVwcykgOiBmbi5hcHBseShvYmosIGRlcHMpO1xuICAgIH1cbiAgfSBlbHNlIGlmICghKGZsYWdzICYgSW5qZWN0RmxhZ3MuU2VsZikpIHtcbiAgICB2YWx1ZSA9IHBhcmVudC5nZXQodG9rZW4sIG5vdEZvdW5kVmFsdWUsIEluamVjdEZsYWdzLkRlZmF1bHQpO1xuICB9XG4gIHJldHVybiB2YWx1ZTtcbn1cblxuXG5mdW5jdGlvbiBjb21wdXRlRGVwcyhwcm92aWRlcjogU3RhdGljUHJvdmlkZXIpOiBEZXBlbmRlbmN5UmVjb3JkW10ge1xuICBsZXQgZGVwczogRGVwZW5kZW5jeVJlY29yZFtdID0gRU1QVFk7XG4gIGNvbnN0IHByb3ZpZGVyRGVwczogYW55W10gPVxuICAgICAgKHByb3ZpZGVyIGFzIEV4aXN0aW5nUHJvdmlkZXIgJiBTdGF0aWNDbGFzc1Byb3ZpZGVyICYgQ29uc3RydWN0b3JQcm92aWRlcikuZGVwcztcbiAgaWYgKHByb3ZpZGVyRGVwcyAmJiBwcm92aWRlckRlcHMubGVuZ3RoKSB7XG4gICAgZGVwcyA9IFtdO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcHJvdmlkZXJEZXBzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBsZXQgb3B0aW9ucyA9IE9wdGlvbkZsYWdzLkRlZmF1bHQ7XG4gICAgICBsZXQgdG9rZW4gPSByZXNvbHZlRm9yd2FyZFJlZihwcm92aWRlckRlcHNbaV0pO1xuICAgICAgaWYgKHRva2VuIGluc3RhbmNlb2YgQXJyYXkpIHtcbiAgICAgICAgZm9yIChsZXQgaiA9IDAsIGFubm90YXRpb25zID0gdG9rZW47IGogPCBhbm5vdGF0aW9ucy5sZW5ndGg7IGorKykge1xuICAgICAgICAgIGNvbnN0IGFubm90YXRpb24gPSBhbm5vdGF0aW9uc1tqXTtcbiAgICAgICAgICBpZiAoYW5ub3RhdGlvbiBpbnN0YW5jZW9mIE9wdGlvbmFsIHx8IGFubm90YXRpb24gPT0gT3B0aW9uYWwpIHtcbiAgICAgICAgICAgIG9wdGlvbnMgPSBvcHRpb25zIHwgT3B0aW9uRmxhZ3MuT3B0aW9uYWw7XG4gICAgICAgICAgfSBlbHNlIGlmIChhbm5vdGF0aW9uIGluc3RhbmNlb2YgU2tpcFNlbGYgfHwgYW5ub3RhdGlvbiA9PSBTa2lwU2VsZikge1xuICAgICAgICAgICAgb3B0aW9ucyA9IG9wdGlvbnMgJiB+T3B0aW9uRmxhZ3MuQ2hlY2tTZWxmO1xuICAgICAgICAgIH0gZWxzZSBpZiAoYW5ub3RhdGlvbiBpbnN0YW5jZW9mIFNlbGYgfHwgYW5ub3RhdGlvbiA9PSBTZWxmKSB7XG4gICAgICAgICAgICBvcHRpb25zID0gb3B0aW9ucyAmIH5PcHRpb25GbGFncy5DaGVja1BhcmVudDtcbiAgICAgICAgICB9IGVsc2UgaWYgKGFubm90YXRpb24gaW5zdGFuY2VvZiBJbmplY3QpIHtcbiAgICAgICAgICAgIHRva2VuID0gKGFubm90YXRpb24gYXMgSW5qZWN0KS50b2tlbjtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdG9rZW4gPSByZXNvbHZlRm9yd2FyZFJlZihhbm5vdGF0aW9uKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGRlcHMucHVzaCh7dG9rZW4sIG9wdGlvbnN9KTtcbiAgICB9XG4gIH0gZWxzZSBpZiAoKHByb3ZpZGVyIGFzIEV4aXN0aW5nUHJvdmlkZXIpLnVzZUV4aXN0aW5nKSB7XG4gICAgY29uc3QgdG9rZW4gPSByZXNvbHZlRm9yd2FyZFJlZigocHJvdmlkZXIgYXMgRXhpc3RpbmdQcm92aWRlcikudXNlRXhpc3RpbmcpO1xuICAgIGRlcHMgPSBbe3Rva2VuLCBvcHRpb25zOiBPcHRpb25GbGFncy5EZWZhdWx0fV07XG4gIH0gZWxzZSBpZiAoIXByb3ZpZGVyRGVwcyAmJiAhKFVTRV9WQUxVRSBpbiBwcm92aWRlcikpIHtcbiAgICAvLyB1c2VWYWx1ZSAmIHVzZUV4aXN0aW5nIGFyZSB0aGUgb25seSBvbmVzIHdoaWNoIGFyZSBleGVtcHQgZnJvbSBkZXBzIGFsbCBvdGhlcnMgbmVlZCBpdC5cbiAgICB0aHJvdyBzdGF0aWNFcnJvcignXFwnZGVwc1xcJyByZXF1aXJlZCcsIHByb3ZpZGVyKTtcbiAgfVxuICByZXR1cm4gZGVwcztcbn1cblxuZnVuY3Rpb24gZm9ybWF0RXJyb3IodGV4dDogc3RyaW5nLCBvYmo6IGFueSwgc291cmNlOiBzdHJpbmcgfCBudWxsID0gbnVsbCk6IHN0cmluZyB7XG4gIHRleHQgPSB0ZXh0ICYmIHRleHQuY2hhckF0KDApID09PSAnXFxuJyAmJiB0ZXh0LmNoYXJBdCgxKSA9PSBOT19ORVdfTElORSA/IHRleHQuc3Vic3RyKDIpIDogdGV4dDtcbiAgbGV0IGNvbnRleHQgPSBzdHJpbmdpZnkob2JqKTtcbiAgaWYgKG9iaiBpbnN0YW5jZW9mIEFycmF5KSB7XG4gICAgY29udGV4dCA9IG9iai5tYXAoc3RyaW5naWZ5KS5qb2luKCcgLT4gJyk7XG4gIH0gZWxzZSBpZiAodHlwZW9mIG9iaiA9PT0gJ29iamVjdCcpIHtcbiAgICBsZXQgcGFydHMgPSA8c3RyaW5nW10+W107XG4gICAgZm9yIChsZXQga2V5IGluIG9iaikge1xuICAgICAgaWYgKG9iai5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgIGxldCB2YWx1ZSA9IG9ialtrZXldO1xuICAgICAgICBwYXJ0cy5wdXNoKFxuICAgICAgICAgICAga2V5ICsgJzonICsgKHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycgPyBKU09OLnN0cmluZ2lmeSh2YWx1ZSkgOiBzdHJpbmdpZnkodmFsdWUpKSk7XG4gICAgICB9XG4gICAgfVxuICAgIGNvbnRleHQgPSBgeyR7cGFydHMuam9pbignLCAnKX19YDtcbiAgfVxuICByZXR1cm4gYFN0YXRpY0luamVjdG9yRXJyb3Ike3NvdXJjZSA/ICcoJyArIHNvdXJjZSArICcpJyA6ICcnfVske2NvbnRleHR9XTogJHt0ZXh0LnJlcGxhY2UoTkVXX0xJTkUsICdcXG4gICcpfWA7XG59XG5cbmZ1bmN0aW9uIHN0YXRpY0Vycm9yKHRleHQ6IHN0cmluZywgb2JqOiBhbnkpOiBFcnJvciB7XG4gIHJldHVybiBuZXcgRXJyb3IoZm9ybWF0RXJyb3IodGV4dCwgb2JqKSk7XG59XG5cbmZ1bmN0aW9uIGdldENsb3N1cmVTYWZlUHJvcGVydHk8VD4ob2JqV2l0aFByb3BlcnR5VG9FeHRyYWN0OiBUKTogc3RyaW5nIHtcbiAgZm9yIChsZXQga2V5IGluIG9ialdpdGhQcm9wZXJ0eVRvRXh0cmFjdCkge1xuICAgIGlmIChvYmpXaXRoUHJvcGVydHlUb0V4dHJhY3Rba2V5XSA9PT0gR0VUX1BST1BFUlRZX05BTUUpIHtcbiAgICAgIHJldHVybiBrZXk7XG4gICAgfVxuICB9XG4gIHRocm93IEVycm9yKCchcHJvcCcpO1xufVxuXG4vKipcbiAqIEluamVjdGlvbiBmbGFncyBmb3IgREkuXG4gKi9cbmV4cG9ydCBjb25zdCBlbnVtIEluamVjdEZsYWdzIHtcbiAgRGVmYXVsdCA9IDBiMDAwMCxcblxuICAvKipcbiAgICogU3BlY2lmaWVzIHRoYXQgYW4gaW5qZWN0b3Igc2hvdWxkIHJldHJpZXZlIGEgZGVwZW5kZW5jeSBmcm9tIGFueSBpbmplY3RvciB1bnRpbCByZWFjaGluZyB0aGVcbiAgICogaG9zdCBlbGVtZW50IG9mIHRoZSBjdXJyZW50IGNvbXBvbmVudC4gKE9ubHkgdXNlZCB3aXRoIEVsZW1lbnQgSW5qZWN0b3IpXG4gICAqL1xuICBIb3N0ID0gMGIwMDAxLFxuICAvKiogRG9uJ3QgZGVzY2VuZCBpbnRvIGFuY2VzdG9ycyBvZiB0aGUgbm9kZSByZXF1ZXN0aW5nIGluamVjdGlvbi4gKi9cbiAgU2VsZiA9IDBiMDAxMCxcbiAgLyoqIFNraXAgdGhlIG5vZGUgdGhhdCBpcyByZXF1ZXN0aW5nIGluamVjdGlvbi4gKi9cbiAgU2tpcFNlbGYgPSAwYjAxMDAsXG4gIC8qKiBJbmplY3QgYGRlZmF1bHRWYWx1ZWAgaW5zdGVhZCBpZiB0b2tlbiBub3QgZm91bmQuICovXG4gIE9wdGlvbmFsID0gMGIxMDAwLFxufVxuXG4vKipcbiAqIEN1cnJlbnQgaW5qZWN0b3IgdmFsdWUgdXNlZCBieSBgaW5qZWN0YC5cbiAqIC0gYHVuZGVmaW5lZGA6IGl0IGlzIGFuIGVycm9yIHRvIGNhbGwgYGluamVjdGBcbiAqIC0gYG51bGxgOiBgaW5qZWN0YCBjYW4gYmUgY2FsbGVkIGJ1dCB0aGVyZSBpcyBubyBpbmplY3RvciAobGltcC1tb2RlKS5cbiAqIC0gSW5qZWN0b3IgaW5zdGFuY2U6IFVzZSB0aGUgaW5qZWN0b3IgZm9yIHJlc29sdXRpb24uXG4gKi9cbmxldCBfY3VycmVudEluamVjdG9yOiBJbmplY3Rvcnx1bmRlZmluZWR8bnVsbCA9IHVuZGVmaW5lZDtcblxuZXhwb3J0IGZ1bmN0aW9uIHNldEN1cnJlbnRJbmplY3RvcihpbmplY3RvcjogSW5qZWN0b3IgfCBudWxsIHwgdW5kZWZpbmVkKTogSW5qZWN0b3J8dW5kZWZpbmVkfG51bGwge1xuICBjb25zdCBmb3JtZXIgPSBfY3VycmVudEluamVjdG9yO1xuICBfY3VycmVudEluamVjdG9yID0gaW5qZWN0b3I7XG4gIHJldHVybiBmb3JtZXI7XG59XG5cbi8qKlxuICogSW5qZWN0cyBhIHRva2VuIGZyb20gdGhlIGN1cnJlbnRseSBhY3RpdmUgaW5qZWN0b3IuXG4gKlxuICogVGhpcyBmdW5jdGlvbiBtdXN0IGJlIHVzZWQgaW4gdGhlIGNvbnRleHQgb2YgYSBmYWN0b3J5IGZ1bmN0aW9uIHN1Y2ggYXMgb25lIGRlZmluZWQgZm9yIGFuXG4gKiBgSW5qZWN0aW9uVG9rZW5gLCBhbmQgd2lsbCB0aHJvdyBhbiBlcnJvciBpZiBub3QgY2FsbGVkIGZyb20gc3VjaCBhIGNvbnRleHQuXG4gKlxuICogQHVzYWdlTm90ZXNcbiAqICMjIyBFeGFtcGxlXG4gKlxuICoge0BleGFtcGxlIGNvcmUvZGkvdHMvaW5qZWN0b3Jfc3BlYy50cyByZWdpb249J1NoYWtlYWJsZUluamVjdGlvblRva2VuJ31cbiAqXG4gKiBXaXRoaW4gc3VjaCBhIGZhY3RvcnkgZnVuY3Rpb24gYGluamVjdGAgaXMgdXRpbGl6ZWQgdG8gcmVxdWVzdCBpbmplY3Rpb24gb2YgYSBkZXBlbmRlbmN5LCBpbnN0ZWFkXG4gKiBvZiBwcm92aWRpbmcgYW4gYWRkaXRpb25hbCBhcnJheSBvZiBkZXBlbmRlbmNpZXMgYXMgd2FzIGNvbW1vbiB0byBkbyB3aXRoIGB1c2VGYWN0b3J5YCBwcm92aWRlcnMuXG4gKiBgaW5qZWN0YCBpcyBmYXN0ZXIgYW5kIG1vcmUgdHlwZS1zYWZlLlxuICpcbiAqIEBleHBlcmltZW50YWxcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGluamVjdDxUPih0b2tlbjogVHlwZTxUPnwgSW5qZWN0aW9uVG9rZW48VD4pOiBUO1xuZXhwb3J0IGZ1bmN0aW9uIGluamVjdDxUPih0b2tlbjogVHlwZTxUPnwgSW5qZWN0aW9uVG9rZW48VD4sIGZsYWdzPzogSW5qZWN0RmxhZ3MpOiBUfG51bGw7XG5leHBvcnQgZnVuY3Rpb24gaW5qZWN0PFQ+KHRva2VuOiBUeXBlPFQ+fCBJbmplY3Rpb25Ub2tlbjxUPiwgZmxhZ3MgPSBJbmplY3RGbGFncy5EZWZhdWx0KTogVHxudWxsIHtcbiAgaWYgKF9jdXJyZW50SW5qZWN0b3IgPT09IHVuZGVmaW5lZCkge1xuICAgIHRocm93IG5ldyBFcnJvcihgaW5qZWN0KCkgbXVzdCBiZSBjYWxsZWQgZnJvbSBhbiBpbmplY3Rpb24gY29udGV4dGApO1xuICB9IGVsc2UgaWYgKF9jdXJyZW50SW5qZWN0b3IgPT09IG51bGwpIHtcbiAgICBjb25zdCBpbmplY3RhYmxlRGVmOiBJbmplY3RhYmxlRGVmPFQ+ID0gKHRva2VuIGFzIGFueSkubmdJbmplY3RhYmxlRGVmO1xuICAgIGlmIChpbmplY3RhYmxlRGVmICYmIGluamVjdGFibGVEZWYucHJvdmlkZWRJbiA9PSAncm9vdCcpIHtcbiAgICAgIHJldHVybiBpbmplY3RhYmxlRGVmLnZhbHVlID09PSB1bmRlZmluZWQgPyBpbmplY3RhYmxlRGVmLnZhbHVlID0gaW5qZWN0YWJsZURlZi5mYWN0b3J5KCkgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluamVjdGFibGVEZWYudmFsdWU7XG4gICAgfVxuICAgIGlmIChmbGFncyAmIEluamVjdEZsYWdzLk9wdGlvbmFsKSByZXR1cm4gbnVsbDtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYEluamVjdG9yOiBOT1RfRk9VTkQgWyR7c3RyaW5naWZ5KHRva2VuKX1dYCk7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIF9jdXJyZW50SW5qZWN0b3IuZ2V0KHRva2VuLCBmbGFncyAmIEluamVjdEZsYWdzLk9wdGlvbmFsID8gbnVsbCA6IHVuZGVmaW5lZCwgZmxhZ3MpO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpbmplY3RBcmdzKHR5cGVzOiAoVHlwZTxhbnk+fCBJbmplY3Rpb25Ub2tlbjxhbnk+fCBhbnlbXSlbXSk6IGFueVtdIHtcbiAgY29uc3QgYXJnczogYW55W10gPSBbXTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCB0eXBlcy5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IGFyZyA9IHR5cGVzW2ldO1xuICAgIGlmIChBcnJheS5pc0FycmF5KGFyZykpIHtcbiAgICAgIGlmIChhcmcubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignQXJndW1lbnRzIGFycmF5IG11c3QgaGF2ZSBhcmd1bWVudHMuJyk7XG4gICAgICB9XG4gICAgICBsZXQgdHlwZTogVHlwZTxhbnk+fHVuZGVmaW5lZCA9IHVuZGVmaW5lZDtcbiAgICAgIGxldCBmbGFnczogSW5qZWN0RmxhZ3MgPSBJbmplY3RGbGFncy5EZWZhdWx0O1xuXG4gICAgICBmb3IgKGxldCBqID0gMDsgaiA8IGFyZy5sZW5ndGg7IGorKykge1xuICAgICAgICBjb25zdCBtZXRhID0gYXJnW2pdO1xuICAgICAgICBpZiAobWV0YSBpbnN0YW5jZW9mIE9wdGlvbmFsIHx8IG1ldGEubmdNZXRhZGF0YU5hbWUgPT09ICdPcHRpb25hbCcpIHtcbiAgICAgICAgICBmbGFncyB8PSBJbmplY3RGbGFncy5PcHRpb25hbDtcbiAgICAgICAgfSBlbHNlIGlmIChtZXRhIGluc3RhbmNlb2YgU2tpcFNlbGYgfHwgbWV0YS5uZ01ldGFkYXRhTmFtZSA9PT0gJ1NraXBTZWxmJykge1xuICAgICAgICAgIGZsYWdzIHw9IEluamVjdEZsYWdzLlNraXBTZWxmO1xuICAgICAgICB9IGVsc2UgaWYgKG1ldGEgaW5zdGFuY2VvZiBTZWxmIHx8IG1ldGEubmdNZXRhZGF0YU5hbWUgPT09ICdTZWxmJykge1xuICAgICAgICAgIGZsYWdzIHw9IEluamVjdEZsYWdzLlNlbGY7XG4gICAgICAgIH0gZWxzZSBpZiAobWV0YSBpbnN0YW5jZW9mIEluamVjdCkge1xuICAgICAgICAgIHR5cGUgPSBtZXRhLnRva2VuO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHR5cGUgPSBtZXRhO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGFyZ3MucHVzaChpbmplY3QodHlwZSAhLCBmbGFncykpO1xuICAgIH0gZWxzZSB7XG4gICAgICBhcmdzLnB1c2goaW5qZWN0KGFyZykpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gYXJncztcbn1cbiJdfQ==