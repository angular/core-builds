/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as tslib_1 from "tslib";
import { getClosureSafeProperty } from '../util/property';
import { stringify } from '../util/stringify';
import { resolveForwardRef } from './forward_ref';
import { InjectionToken } from './injection_token';
import { inject } from './injector_compatibility';
import { defineInjectable } from './interface/defs';
import { InjectFlags } from './interface/injector';
import { Inject, Optional, Self, SkipSelf } from './metadata';
export var SOURCE = '__source';
var _THROW_IF_NOT_FOUND = new Object();
export var THROW_IF_NOT_FOUND = _THROW_IF_NOT_FOUND;
/**
 * An InjectionToken that gets the current `Injector` for `createInjector()`-style injectors.
 *
 * Requesting this token instead of `Injector` allows `StaticInjector` to be tree-shaken from a
 * project.
 *
 * @publicApi
 */
export var INJECTOR = new InjectionToken('INJECTOR', -1 // `-1` is used by Ivy DI system as special value to recognize it as `Injector`.
);
var NullInjector = /** @class */ (function () {
    function NullInjector() {
    }
    NullInjector.prototype.get = function (token, notFoundValue) {
        if (notFoundValue === void 0) { notFoundValue = _THROW_IF_NOT_FOUND; }
        if (notFoundValue === _THROW_IF_NOT_FOUND) {
            // Intentionally left behind: With dev tools open the debugger will stop here. There is no
            // reason why correctly written application should cause this exception.
            // TODO(misko): uncomment the next line once `ngDevMode` works with closure.
            // if(ngDevMode) debugger;
            var error = new Error("NullInjectorError: No provider for " + stringify(token) + "!");
            error.name = 'NullInjectorError';
            throw error;
        }
        return notFoundValue;
    };
    return NullInjector;
}());
export { NullInjector };
/**
 * Concrete injectors implement this interface.
 *
 * For more details, see the ["Dependency Injection Guide"](guide/dependency-injection).
 *
 * @usageNotes
 * ### Example
 *
 * {@example core/di/ts/injector_spec.ts region='Injector'}
 *
 * `Injector` returns itself when given `Injector` as a token:
 *
 * {@example core/di/ts/injector_spec.ts region='injectInjector'}
 *
 * @publicApi
 */
var Injector = /** @class */ (function () {
    function Injector() {
    }
    /**
     * Create a new Injector which is configure using `StaticProvider`s.
     *
     * @usageNotes
     * ### Example
     *
     * {@example core/di/ts/provider_spec.ts region='ConstructorProvider'}
     */
    Injector.create = function (options, parent) {
        if (Array.isArray(options)) {
            return new StaticInjector(options, parent);
        }
        else {
            return new StaticInjector(options.providers, options.parent, options.name || null);
        }
    };
    Injector.THROW_IF_NOT_FOUND = _THROW_IF_NOT_FOUND;
    Injector.NULL = new NullInjector();
    /** @nocollapse */
    Injector.ngInjectableDef = defineInjectable({
        providedIn: 'any',
        factory: function () { return inject(INJECTOR); },
    });
    /**
     * @internal
     * @nocollapse
     */
    Injector.__NG_ELEMENT_ID__ = -1;
    return Injector;
}());
export { Injector };
var IDENT = function (value) {
    return value;
};
var EMPTY = [];
var CIRCULAR = IDENT;
var MULTI_PROVIDER_FN = function () {
    return Array.prototype.slice.call(arguments);
};
export var USE_VALUE = getClosureSafeProperty({ provide: String, useValue: getClosureSafeProperty });
var NG_TOKEN_PATH = 'ngTokenPath';
export var NG_TEMP_TOKEN_PATH = 'ngTempTokenPath';
var NULL_INJECTOR = Injector.NULL;
var NEW_LINE = /\n/gm;
var NO_NEW_LINE = 'ɵ';
var StaticInjector = /** @class */ (function () {
    function StaticInjector(providers, parent, source) {
        if (parent === void 0) { parent = NULL_INJECTOR; }
        if (source === void 0) { source = null; }
        this.parent = parent;
        this.source = source;
        var records = this._records = new Map();
        records.set(Injector, { token: Injector, fn: IDENT, deps: EMPTY, value: this, useNew: false });
        records.set(INJECTOR, { token: INJECTOR, fn: IDENT, deps: EMPTY, value: this, useNew: false });
        recursivelyProcessProviders(records, providers);
    }
    StaticInjector.prototype.get = function (token, notFoundValue, flags) {
        if (flags === void 0) { flags = InjectFlags.Default; }
        var record = this._records.get(token);
        try {
            return tryResolveToken(token, record, this._records, this.parent, notFoundValue, flags);
        }
        catch (e) {
            return catchInjectorError(e, token, 'StaticInjectorError', this.source);
        }
    };
    StaticInjector.prototype.toString = function () {
        var tokens = [], records = this._records;
        records.forEach(function (v, token) { return tokens.push(stringify(token)); });
        return "StaticInjector[" + tokens.join(', ') + "]";
    };
    return StaticInjector;
}());
export { StaticInjector };
function resolveProvider(provider) {
    var deps = computeDeps(provider);
    var fn = IDENT;
    var value = EMPTY;
    var useNew = false;
    var provide = resolveForwardRef(provider.provide);
    if (USE_VALUE in provider) {
        // We need to use USE_VALUE in provider since provider.useValue could be defined as undefined.
        value = provider.useValue;
    }
    else if (provider.useFactory) {
        fn = provider.useFactory;
    }
    else if (provider.useExisting) {
        // Just use IDENT
    }
    else if (provider.useClass) {
        useNew = true;
        fn = resolveForwardRef(provider.useClass);
    }
    else if (typeof provide == 'function') {
        useNew = true;
        fn = provide;
    }
    else {
        throw staticError('StaticProvider does not have [useValue|useFactory|useExisting|useClass] or [provide] is not newable', provider);
    }
    return { deps: deps, fn: fn, useNew: useNew, value: value };
}
function multiProviderMixError(token) {
    return staticError('Cannot mix multi providers and regular providers', token);
}
function recursivelyProcessProviders(records, provider) {
    if (provider) {
        provider = resolveForwardRef(provider);
        if (provider instanceof Array) {
            // if we have an array recurse into the array
            for (var i = 0; i < provider.length; i++) {
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
            var token = resolveForwardRef(provider.provide);
            var resolvedProvider = resolveProvider(provider);
            if (provider.multi === true) {
                // This is a multi provider.
                var multiProvider = records.get(token);
                if (multiProvider) {
                    if (multiProvider.fn !== MULTI_PROVIDER_FN) {
                        throw multiProviderMixError(token);
                    }
                }
                else {
                    // Create a placeholder factory which will look up the constituents of the multi provider.
                    records.set(token, multiProvider = {
                        token: provider.provide,
                        deps: [],
                        useNew: false,
                        fn: MULTI_PROVIDER_FN,
                        value: EMPTY
                    });
                }
                // Treat the provider as the token.
                token = provider;
                multiProvider.deps.push({ token: token, options: 6 /* Default */ });
            }
            var record = records.get(token);
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
function tryResolveToken(token, record, records, parent, notFoundValue, flags) {
    try {
        return resolveToken(token, record, records, parent, notFoundValue, flags);
    }
    catch (e) {
        // ensure that 'e' is of type Error.
        if (!(e instanceof Error)) {
            e = new Error(e);
        }
        var path = e[NG_TEMP_TOKEN_PATH] = e[NG_TEMP_TOKEN_PATH] || [];
        path.unshift(token);
        if (record && record.value == CIRCULAR) {
            // Reset the Circular flag.
            record.value = EMPTY;
        }
        throw e;
    }
}
function resolveToken(token, record, records, parent, notFoundValue, flags) {
    var _a;
    var value;
    if (record && !(flags & InjectFlags.SkipSelf)) {
        // If we don't have a record, this implies that we don't own the provider hence don't know how
        // to resolve it.
        value = record.value;
        if (value == CIRCULAR) {
            throw Error(NO_NEW_LINE + 'Circular dependency');
        }
        else if (value === EMPTY) {
            record.value = CIRCULAR;
            var obj = undefined;
            var useNew = record.useNew;
            var fn = record.fn;
            var depRecords = record.deps;
            var deps = EMPTY;
            if (depRecords.length) {
                deps = [];
                for (var i = 0; i < depRecords.length; i++) {
                    var depRecord = depRecords[i];
                    var options = depRecord.options;
                    var childRecord = options & 2 /* CheckSelf */ ? records.get(depRecord.token) : undefined;
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
            record.value = value = useNew ? new ((_a = fn).bind.apply(_a, tslib_1.__spread([void 0], deps)))() : fn.apply(obj, deps);
        }
    }
    else if (!(flags & InjectFlags.Self)) {
        value = parent.get(token, notFoundValue, InjectFlags.Default);
    }
    return value;
}
function computeDeps(provider) {
    var deps = EMPTY;
    var providerDeps = provider.deps;
    if (providerDeps && providerDeps.length) {
        deps = [];
        for (var i = 0; i < providerDeps.length; i++) {
            var options = 6 /* Default */;
            var token = resolveForwardRef(providerDeps[i]);
            if (token instanceof Array) {
                for (var j = 0, annotations = token; j < annotations.length; j++) {
                    var annotation = annotations[j];
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
                        token = annotation.token;
                    }
                    else {
                        token = resolveForwardRef(annotation);
                    }
                }
            }
            deps.push({ token: token, options: options });
        }
    }
    else if (provider.useExisting) {
        var token = resolveForwardRef(provider.useExisting);
        deps = [{ token: token, options: 6 /* Default */ }];
    }
    else if (!providerDeps && !(USE_VALUE in provider)) {
        // useValue & useExisting are the only ones which are exempt from deps all others need it.
        throw staticError('\'deps\' required', provider);
    }
    return deps;
}
export function catchInjectorError(e, token, injectorErrorName, source) {
    var tokenPath = e[NG_TEMP_TOKEN_PATH];
    if (token[SOURCE]) {
        tokenPath.unshift(token[SOURCE]);
    }
    e.message = formatError('\n' + e.message, tokenPath, injectorErrorName, source);
    e[NG_TOKEN_PATH] = tokenPath;
    e[NG_TEMP_TOKEN_PATH] = null;
    throw e;
}
function formatError(text, obj, injectorErrorName, source) {
    if (source === void 0) { source = null; }
    text = text && text.charAt(0) === '\n' && text.charAt(1) == NO_NEW_LINE ? text.substr(2) : text;
    var context = stringify(obj);
    if (obj instanceof Array) {
        context = obj.map(stringify).join(' -> ');
    }
    else if (typeof obj === 'object') {
        var parts = [];
        for (var key in obj) {
            if (obj.hasOwnProperty(key)) {
                var value = obj[key];
                parts.push(key + ':' + (typeof value === 'string' ? JSON.stringify(value) : stringify(value)));
            }
        }
        context = "{" + parts.join(', ') + "}";
    }
    return "" + injectorErrorName + (source ? '(' + source + ')' : '') + "[" + context + "]: " + text.replace(NEW_LINE, '\n  ');
}
function staticError(text, obj) {
    return new Error(formatError(text, obj, 'StaticInjectorError'));
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5qZWN0b3IuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9kaS9pbmplY3Rvci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7O0FBR0gsT0FBTyxFQUFDLHNCQUFzQixFQUFDLE1BQU0sa0JBQWtCLENBQUM7QUFDeEQsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQzVDLE9BQU8sRUFBQyxpQkFBaUIsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUNoRCxPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDakQsT0FBTyxFQUFDLE1BQU0sRUFBQyxNQUFNLDBCQUEwQixDQUFDO0FBQ2hELE9BQU8sRUFBQyxnQkFBZ0IsRUFBQyxNQUFNLGtCQUFrQixDQUFDO0FBQ2xELE9BQU8sRUFBQyxXQUFXLEVBQUMsTUFBTSxzQkFBc0IsQ0FBQztBQUVqRCxPQUFPLEVBQUMsTUFBTSxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFDLE1BQU0sWUFBWSxDQUFDO0FBRTVELE1BQU0sQ0FBQyxJQUFNLE1BQU0sR0FBRyxVQUFVLENBQUM7QUFDakMsSUFBTSxtQkFBbUIsR0FBRyxJQUFJLE1BQU0sRUFBRSxDQUFDO0FBQ3pDLE1BQU0sQ0FBQyxJQUFNLGtCQUFrQixHQUFHLG1CQUFtQixDQUFDO0FBRXREOzs7Ozs7O0dBT0c7QUFDSCxNQUFNLENBQUMsSUFBTSxRQUFRLEdBQUcsSUFBSSxjQUFjLENBQ3RDLFVBQVUsRUFDVixDQUFDLENBQVEsQ0FBRSxnRkFBZ0Y7Q0FDMUYsQ0FBQztBQUVOO0lBQUE7SUFhQSxDQUFDO0lBWkMsMEJBQUcsR0FBSCxVQUFJLEtBQVUsRUFBRSxhQUF3QztRQUF4Qyw4QkFBQSxFQUFBLG1DQUF3QztRQUN0RCxJQUFJLGFBQWEsS0FBSyxtQkFBbUIsRUFBRTtZQUN6QywwRkFB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LElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFLE1BQU0sQ0FBRyxDQUFDO0FBQ2xILENBQUM7QUFFRCxTQUFTLFdBQVcsQ0FBQyxJQUFZLEVBQUUsR0FBUTtJQUN6QyxPQUFPLElBQUksS0FBSyxDQUFDLFdBQVcsQ0FBQyxJQUFJLEVBQUUsR0FBRyxFQUFFLHFCQUFxQixDQUFDLENBQUMsQ0FBQztBQUNsRSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1R5cGV9IGZyb20gJy4uL2ludGVyZmFjZS90eXBlJztcbmltcG9ydCB7Z2V0Q2xvc3VyZVNhZmVQcm9wZXJ0eX0gZnJvbSAnLi4vdXRpbC9wcm9wZXJ0eSc7XG5pbXBvcnQge3N0cmluZ2lmeX0gZnJvbSAnLi4vdXRpbC9zdHJpbmdpZnknO1xuaW1wb3J0IHtyZXNvbHZlRm9yd2FyZFJlZn0gZnJvbSAnLi9mb3J3YXJkX3JlZic7XG5pbXBvcnQge0luamVjdGlvblRva2VufSBmcm9tICcuL2luamVjdGlvbl90b2tlbic7XG5pbXBvcnQge2luamVjdH0gZnJvbSAnLi9pbmplY3Rvcl9jb21wYXRpYmlsaXR5JztcbmltcG9ydCB7ZGVmaW5lSW5qZWN0YWJsZX0gZnJvbSAnLi9pbnRlcmZhY2UvZGVmcyc7XG5pbXBvcnQge0luamVjdEZsYWdzfSBmcm9tICcuL2ludGVyZmFjZS9pbmplY3Rvcic7XG5pbXBvcnQge0NvbnN0cnVjdG9yUHJvdmlkZXIsIEV4aXN0aW5nUHJvdmlkZXIsIEZhY3RvcnlQcm92aWRlciwgU3RhdGljQ2xhc3NQcm92aWRlciwgU3RhdGljUHJvdmlkZXIsIFZhbHVlUHJvdmlkZXJ9IGZyb20gJy4vaW50ZXJmYWNlL3Byb3ZpZGVyJztcbmltcG9ydCB7SW5qZWN0LCBPcHRpb25hbCwgU2VsZiwgU2tpcFNlbGZ9IGZyb20gJy4vbWV0YWRhdGEnO1xuXG5leHBvcnQgY29uc3QgU09VUkNFID0gJ19fc291cmNlJztcbmNvbnN0IF9USFJPV19JRl9OT1RfRk9VTkQgPSBuZXcgT2JqZWN0KCk7XG5leHBvcnQgY29uc3QgVEhST1dfSUZfTk9UX0ZPVU5EID0gX1RIUk9XX0lGX05PVF9GT1VORDtcblxuLyoqXG4gKiBBbiBJbmplY3Rpb25Ub2tlbiB0aGF0IGdldHMgdGhlIGN1cnJlbnQgYEluamVjdG9yYCBmb3IgYGNyZWF0ZUluamVjdG9yKClgLXN0eWxlIGluamVjdG9ycy5cbiAqXG4gKiBSZXF1ZXN0aW5nIHRoaXMgdG9rZW4gaW5zdGVhZCBvZiBgSW5qZWN0b3JgIGFsbG93cyBgU3RhdGljSW5qZWN0b3JgIHRvIGJlIHRyZWUtc2hha2VuIGZyb20gYVxuICogcHJvamVjdC5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBjb25zdCBJTkpFQ1RPUiA9IG5ldyBJbmplY3Rpb25Ub2tlbjxJbmplY3Rvcj4oXG4gICAgJ0lOSkVDVE9SJyxcbiAgICAtMSBhcyBhbnkgIC8vIGAtMWAgaXMgdXNlZCBieSBJdnkgREkgc3lzdGVtIGFzIHNwZWNpYWwgdmFsdWUgdG8gcmVjb2duaXplIGl0IGFzIGBJbmplY3RvcmAuXG4gICAgKTtcblxuZXhwb3J0IGNsYXNzIE51bGxJbmplY3RvciBpbXBsZW1lbnRzIEluamVjdG9yIHtcbiAgZ2V0KHRva2VuOiBhbnksIG5vdEZvdW5kVmFsdWU6IGFueSA9IF9USFJPV19JRl9OT1RfRk9VTkQpOiBhbnkge1xuICAgIGlmIChub3RGb3VuZFZhbHVlID09PSBfVEhST1dfSUZfTk9UX0ZPVU5EKSB7XG4gICAgICAvLyBJbnRlbnRpb25hbGx5IGxlZnQgYmVoaW5kOiBXaXRoIGRldiB0b29scyBvcGVuIHRoZSBkZWJ1Z2dlciB3aWxsIHN0b3AgaGVyZS4gVGhlcmUgaXMgbm9cbiAgICAgIC8vIHJlYXNvbiB3aHkgY29ycmVjdGx5IHdyaXR0ZW4gYXBwbGljYXRpb24gc2hvdWxkIGNhdXNlIHRoaXMgZXhjZXB0aW9uLlxuICAgICAgLy8gVE9ETyhtaXNrbyk6IHVuY29tbWVudCB0aGUgbmV4dCBsaW5lIG9uY2UgYG5nRGV2TW9kZWAgd29ya3Mgd2l0aCBjbG9zdXJlLlxuICAgICAgLy8gaWYobmdEZXZNb2RlKSBkZWJ1Z2dlcjtcbiAgICAgIGNvbnN0IGVycm9yID0gbmV3IEVycm9yKGBOdWxsSW5qZWN0b3JFcnJvcjogTm8gcHJvdmlkZXIgZm9yICR7c3RyaW5naWZ5KHRva2VuKX0hYCk7XG4gICAgICBlcnJvci5uYW1lID0gJ051bGxJbmplY3RvckVycm9yJztcbiAgICAgIHRocm93IGVycm9yO1xuICAgIH1cbiAgICByZXR1cm4gbm90Rm91bmRWYWx1ZTtcbiAgfVxufVxuXG4vKipcbiAqIENvbmNyZXRlIGluamVjdG9ycyBpbXBsZW1lbnQgdGhpcyBpbnRlcmZhY2UuXG4gKlxuICogRm9yIG1vcmUgZGV0YWlscywgc2VlIHRoZSBbXCJEZXBlbmRlbmN5IEluamVjdGlvbiBHdWlkZVwiXShndWlkZS9kZXBlbmRlbmN5LWluamVjdGlvbikuXG4gKlxuICogQHVzYWdlTm90ZXNcbiAqICMjIyBFeGFtcGxlXG4gKlxuICoge0BleGFtcGxlIGNvcmUvZGkvdHMvaW5qZWN0b3Jfc3BlYy50cyByZWdpb249J0luamVjdG9yJ31cbiAqXG4gKiBgSW5qZWN0b3JgIHJldHVybnMgaXRzZWxmIHdoZW4gZ2l2ZW4gYEluamVjdG9yYCBhcyBhIHRva2VuOlxuICpcbiAqIHtAZXhhbXBsZSBjb3JlL2RpL3RzL2luamVjdG9yX3NwZWMudHMgcmVnaW9uPSdpbmplY3RJbmplY3Rvcid9XG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgSW5qZWN0b3Ige1xuICBzdGF0aWMgVEhST1dfSUZfTk9UX0ZPVU5EID0gX1RIUk9XX0lGX05PVF9GT1VORDtcbiAgc3RhdGljIE5VTEw6IEluamVjdG9yID0gbmV3IE51bGxJbmplY3RvcigpO1xuXG4gIC8qKlxuICAgKiBSZXRyaWV2ZXMgYW4gaW5zdGFuY2UgZnJvbSB0aGUgaW5qZWN0b3IgYmFzZWQgb24gdGhlIHByb3ZpZGVkIHRva2VuLlxuICAgKiBAcmV0dXJucyBUaGUgaW5zdGFuY2UgZnJvbSB0aGUgaW5qZWN0b3IgaWYgZGVmaW5lZCwgb3RoZXJ3aXNlIHRoZSBgbm90Rm91bmRWYWx1ZWAuXG4gICAqIEB0aHJvd3MgV2hlbiB0aGUgYG5vdEZvdW5kVmFsdWVgIGlzIGB1bmRlZmluZWRgIG9yIGBJbmplY3Rvci5USFJPV19JRl9OT1RfRk9VTkRgLlxuICAgKi9cbiAgYWJzdHJhY3QgZ2V0PFQ+KHRva2VuOiBUeXBlPFQ+fEluamVjdGlvblRva2VuPFQ+LCBub3RGb3VuZFZhbHVlPzogVCwgZmxhZ3M/OiBJbmplY3RGbGFncyk6IFQ7XG4gIC8qKlxuICAgKiBAZGVwcmVjYXRlZCBmcm9tIHY0LjAuMCB1c2UgVHlwZTxUPiBvciBJbmplY3Rpb25Ub2tlbjxUPlxuICAgKiBAc3VwcHJlc3Mge2R1cGxpY2F0ZX1cbiAgICovXG4gIGFic3RyYWN0IGdldCh0b2tlbjogYW55LCBub3RGb3VuZFZhbHVlPzogYW55KTogYW55O1xuXG4gIC8qKlxuICAgKiBAZGVwcmVjYXRlZCBmcm9tIHY1IHVzZSB0aGUgbmV3IHNpZ25hdHVyZSBJbmplY3Rvci5jcmVhdGUob3B0aW9ucylcbiAgICovXG4gIHN0YXRpYyBjcmVhdGUocHJvdmlkZXJzOiBTdGF0aWNQcm92aWRlcltdLCBwYXJlbnQ/OiBJbmplY3Rvcik6IEluamVjdG9yO1xuXG4gIHN0YXRpYyBjcmVhdGUob3B0aW9uczoge3Byb3ZpZGVyczogU3RhdGljUHJvdmlkZXJbXSwgcGFyZW50PzogSW5qZWN0b3IsIG5hbWU/OiBzdHJpbmd9KTogSW5qZWN0b3I7XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBhIG5ldyBJbmplY3RvciB3aGljaCBpcyBjb25maWd1cmUgdXNpbmcgYFN0YXRpY1Byb3ZpZGVyYHMuXG4gICAqXG4gICAqIEB1c2FnZU5vdGVzXG4gICAqICMjIyBFeGFtcGxlXG4gICAqXG4gICAqIHtAZXhhbXBsZSBjb3JlL2RpL3RzL3Byb3ZpZGVyX3NwZWMudHMgcmVnaW9uPSdDb25zdHJ1Y3RvclByb3ZpZGVyJ31cbiAgICovXG4gIHN0YXRpYyBjcmVhdGUoXG4gICAgICBvcHRpb25zOiBTdGF0aWNQcm92aWRlcltdfHtwcm92aWRlcnM6IFN0YXRpY1Byb3ZpZGVyW10sIHBhcmVudD86IEluamVjdG9yLCBuYW1lPzogc3RyaW5nfSxcbiAgICAgIHBhcmVudD86IEluamVjdG9yKTogSW5qZWN0b3Ige1xuICAgIGlmIChBcnJheS5pc0FycmF5KG9wdGlvbnMpKSB7XG4gICAgICByZXR1cm4gbmV3IFN0YXRpY0luamVjdG9yKG9wdGlvbnMsIHBhcmVudCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBuZXcgU3RhdGljSW5qZWN0b3Iob3B0aW9ucy5wcm92aWRlcnMsIG9wdGlvbnMucGFyZW50LCBvcHRpb25zLm5hbWUgfHwgbnVsbCk7XG4gICAgfVxuICB9XG5cbiAgLyoqIEBub2NvbGxhcHNlICovXG4gIHN0YXRpYyBuZ0luamVjdGFibGVEZWYgPSBkZWZpbmVJbmplY3RhYmxlKHtcbiAgICBwcm92aWRlZEluOiAnYW55JyBhcyBhbnksXG4gICAgZmFjdG9yeTogKCkgPT4gaW5qZWN0KElOSkVDVE9SKSxcbiAgfSk7XG5cbiAgLyoqXG4gICAqIEBpbnRlcm5hbFxuICAgKiBAbm9jb2xsYXBzZVxuICAgKi9cbiAgc3RhdGljIF9fTkdfRUxFTUVOVF9JRF9fID0gLTE7XG59XG5cblxuXG5jb25zdCBJREVOVCA9IGZ1bmN0aW9uPFQ+KHZhbHVlOiBUKTogVCB7XG4gIHJldHVybiB2YWx1ZTtcbn07XG5jb25zdCBFTVBUWSA9IDxhbnlbXT5bXTtcbmNvbnN0IENJUkNVTEFSID0gSURFTlQ7XG5jb25zdCBNVUxUSV9QUk9WSURFUl9GTiA9IGZ1bmN0aW9uKCk6IGFueVtdIHtcbiAgcmV0dXJuIEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cyk7XG59O1xuZXhwb3J0IGNvbnN0IFVTRV9WQUxVRSA9XG4gICAgZ2V0Q2xvc3VyZVNhZmVQcm9wZXJ0eTxWYWx1ZVByb3ZpZGVyPih7cHJvdmlkZTogU3RyaW5nLCB1c2VWYWx1ZTogZ2V0Q2xvc3VyZVNhZmVQcm9wZXJ0eX0pO1xuY29uc3QgTkdfVE9LRU5fUEFUSCA9ICduZ1Rva2VuUGF0aCc7XG5leHBvcnQgY29uc3QgTkdfVEVNUF9UT0tFTl9QQVRIID0gJ25nVGVtcFRva2VuUGF0aCc7XG5jb25zdCBlbnVtIE9wdGlvbkZsYWdzIHtcbiAgT3B0aW9uYWwgPSAxIDw8IDAsXG4gIENoZWNrU2VsZiA9IDEgPDwgMSxcbiAgQ2hlY2tQYXJlbnQgPSAxIDw8IDIsXG4gIERlZmF1bHQgPSBDaGVja1NlbGYgfCBDaGVja1BhcmVudFxufVxuY29uc3QgTlVMTF9JTkpFQ1RPUiA9IEluamVjdG9yLk5VTEw7XG5jb25zdCBORVdfTElORSA9IC9cXG4vZ207XG5jb25zdCBOT19ORVdfTElORSA9ICfJtSc7XG5cbmV4cG9ydCBjbGFzcyBTdGF0aWNJbmplY3RvciBpbXBsZW1lbnRzIEluamVjdG9yIHtcbiAgcmVhZG9ubHkgcGFyZW50OiBJbmplY3RvcjtcbiAgcmVhZG9ubHkgc291cmNlOiBzdHJpbmd8bnVsbDtcblxuICBwcml2YXRlIF9yZWNvcmRzOiBNYXA8YW55LCBSZWNvcmQ+O1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgICAgcHJvdmlkZXJzOiBTdGF0aWNQcm92aWRlcltdLCBwYXJlbnQ6IEluamVjdG9yID0gTlVMTF9JTkpFQ1RPUiwgc291cmNlOiBzdHJpbmd8bnVsbCA9IG51bGwpIHtcbiAgICB0aGlzLnBhcmVudCA9IHBhcmVudDtcbiAgICB0aGlzLnNvdXJjZSA9IHNvdXJjZTtcbiAgICBjb25zdCByZWNvcmRzID0gdGhpcy5fcmVjb3JkcyA9IG5ldyBNYXA8YW55LCBSZWNvcmQ+KCk7XG4gICAgcmVjb3Jkcy5zZXQoXG4gICAgICAgIEluamVjdG9yLCA8UmVjb3JkPnt0b2tlbjogSW5qZWN0b3IsIGZuOiBJREVOVCwgZGVwczogRU1QVFksIHZhbHVlOiB0aGlzLCB1c2VOZXc6IGZhbHNlfSk7XG4gICAgcmVjb3Jkcy5zZXQoXG4gICAgICAgIElOSkVDVE9SLCA8UmVjb3JkPnt0b2tlbjogSU5KRUNUT1IsIGZuOiBJREVOVCwgZGVwczogRU1QVFksIHZhbHVlOiB0aGlzLCB1c2VOZXc6IGZhbHNlfSk7XG4gICAgcmVjdXJzaXZlbHlQcm9jZXNzUHJvdmlkZXJzKHJlY29yZHMsIHByb3ZpZGVycyk7XG4gIH1cblxuICBnZXQ8VD4odG9rZW46IFR5cGU8VD58SW5qZWN0aW9uVG9rZW48VD4sIG5vdEZvdW5kVmFsdWU/OiBULCBmbGFncz86IEluamVjdEZsYWdzKTogVDtcbiAgZ2V0KHRva2VuOiBhbnksIG5vdEZvdW5kVmFsdWU/OiBhbnkpOiBhbnk7XG4gIGdldCh0b2tlbjogYW55LCBub3RGb3VuZFZhbHVlPzogYW55LCBmbGFnczogSW5qZWN0RmxhZ3MgPSBJbmplY3RGbGFncy5EZWZhdWx0KTogYW55IHtcbiAgICBjb25zdCByZWNvcmQgPSB0aGlzLl9yZWNvcmRzLmdldCh0b2tlbik7XG4gICAgdHJ5IHtcbiAgICAgIHJldHVybiB0cnlSZXNvbHZlVG9rZW4odG9rZW4sIHJlY29yZCwgdGhpcy5fcmVjb3JkcywgdGhpcy5wYXJlbnQsIG5vdEZvdW5kVmFsdWUsIGZsYWdzKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICByZXR1cm4gY2F0Y2hJbmplY3RvckVycm9yKGUsIHRva2VuLCAnU3RhdGljSW5qZWN0b3JFcnJvcicsIHRoaXMuc291cmNlKTtcbiAgICB9XG4gIH1cblxuICB0b1N0cmluZygpIHtcbiAgICBjb25zdCB0b2tlbnMgPSA8c3RyaW5nW10+W10sIHJlY29yZHMgPSB0aGlzLl9yZWNvcmRzO1xuICAgIHJlY29yZHMuZm9yRWFjaCgodiwgdG9rZW4pID0+IHRva2Vucy5wdXNoKHN0cmluZ2lmeSh0b2tlbikpKTtcbiAgICByZXR1cm4gYFN0YXRpY0luamVjdG9yWyR7dG9rZW5zLmpvaW4oJywgJyl9XWA7XG4gIH1cbn1cblxudHlwZSBTdXBwb3J0ZWRQcm92aWRlciA9XG4gICAgVmFsdWVQcm92aWRlciB8IEV4aXN0aW5nUHJvdmlkZXIgfCBTdGF0aWNDbGFzc1Byb3ZpZGVyIHwgQ29uc3RydWN0b3JQcm92aWRlciB8IEZhY3RvcnlQcm92aWRlcjtcblxuaW50ZXJmYWNlIFJlY29yZCB7XG4gIGZuOiBGdW5jdGlvbjtcbiAgdXNlTmV3OiBib29sZWFuO1xuICBkZXBzOiBEZXBlbmRlbmN5UmVjb3JkW107XG4gIHZhbHVlOiBhbnk7XG59XG5cbmludGVyZmFjZSBEZXBlbmRlbmN5UmVjb3JkIHtcbiAgdG9rZW46IGFueTtcbiAgb3B0aW9uczogbnVtYmVyO1xufVxuXG5mdW5jdGlvbiByZXNvbHZlUHJvdmlkZXIocHJvdmlkZXI6IFN1cHBvcnRlZFByb3ZpZGVyKTogUmVjb3JkIHtcbiAgY29uc3QgZGVwcyA9IGNvbXB1dGVEZXBzKHByb3ZpZGVyKTtcbiAgbGV0IGZuOiBGdW5jdGlvbiA9IElERU5UO1xuICBsZXQgdmFsdWU6IGFueSA9IEVNUFRZO1xuICBsZXQgdXNlTmV3OiBib29sZWFuID0gZmFsc2U7XG4gIGxldCBwcm92aWRlID0gcmVzb2x2ZUZvcndhcmRSZWYocHJvdmlkZXIucHJvdmlkZSk7XG4gIGlmIChVU0VfVkFMVUUgaW4gcHJvdmlkZXIpIHtcbiAgICAvLyBXZSBuZWVkIHRvIHVzZSBVU0VfVkFMVUUgaW4gcHJvdmlkZXIgc2luY2UgcHJvdmlkZXIudXNlVmFsdWUgY291bGQgYmUgZGVmaW5lZCBhcyB1bmRlZmluZWQuXG4gICAgdmFsdWUgPSAocHJvdmlkZXIgYXMgVmFsdWVQcm92aWRlcikudXNlVmFsdWU7XG4gIH0gZWxzZSBpZiAoKHByb3ZpZGVyIGFzIEZhY3RvcnlQcm92aWRlcikudXNlRmFjdG9yeSkge1xuICAgIGZuID0gKHByb3ZpZGVyIGFzIEZhY3RvcnlQcm92aWRlcikudXNlRmFjdG9yeTtcbiAgfSBlbHNlIGlmICgocHJvdmlkZXIgYXMgRXhpc3RpbmdQcm92aWRlcikudXNlRXhpc3RpbmcpIHtcbiAgICAvLyBKdXN0IHVzZSBJREVOVFxuICB9IGVsc2UgaWYgKChwcm92aWRlciBhcyBTdGF0aWNDbGFzc1Byb3ZpZGVyKS51c2VDbGFzcykge1xuICAgIHVzZU5ldyA9IHRydWU7XG4gICAgZm4gPSByZXNvbHZlRm9yd2FyZFJlZigocHJvdmlkZXIgYXMgU3RhdGljQ2xhc3NQcm92aWRlcikudXNlQ2xhc3MpO1xuICB9IGVsc2UgaWYgKHR5cGVvZiBwcm92aWRlID09ICdmdW5jdGlvbicpIHtcbiAgICB1c2VOZXcgPSB0cnVlO1xuICAgIGZuID0gcHJvdmlkZTtcbiAgfSBlbHNlIHtcbiAgICB0aHJvdyBzdGF0aWNFcnJvcihcbiAgICAgICAgJ1N0YXRpY1Byb3ZpZGVyIGRvZXMgbm90IGhhdmUgW3VzZVZhbHVlfHVzZUZhY3Rvcnl8dXNlRXhpc3Rpbmd8dXNlQ2xhc3NdIG9yIFtwcm92aWRlXSBpcyBub3QgbmV3YWJsZScsXG4gICAgICAgIHByb3ZpZGVyKTtcbiAgfVxuICByZXR1cm4ge2RlcHMsIGZuLCB1c2VOZXcsIHZhbHVlfTtcbn1cblxuZnVuY3Rpb24gbXVsdGlQcm92aWRlck1peEVycm9yKHRva2VuOiBhbnkpIHtcbiAgcmV0dXJuIHN0YXRpY0Vycm9yKCdDYW5ub3QgbWl4IG11bHRpIHByb3ZpZGVycyBhbmQgcmVndWxhciBwcm92aWRlcnMnLCB0b2tlbik7XG59XG5cbmZ1bmN0aW9uIHJlY3Vyc2l2ZWx5UHJvY2Vzc1Byb3ZpZGVycyhyZWNvcmRzOiBNYXA8YW55LCBSZWNvcmQ+LCBwcm92aWRlcjogU3RhdGljUHJvdmlkZXIpIHtcbiAgaWYgKHByb3ZpZGVyKSB7XG4gICAgcHJvdmlkZXIgPSByZXNvbHZlRm9yd2FyZFJlZihwcm92aWRlcik7XG4gICAgaWYgKHByb3ZpZGVyIGluc3RhbmNlb2YgQXJyYXkpIHtcbiAgICAgIC8vIGlmIHdlIGhhdmUgYW4gYXJyYXkgcmVjdXJzZSBpbnRvIHRoZSBhcnJheVxuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwcm92aWRlci5sZW5ndGg7IGkrKykge1xuICAgICAgICByZWN1cnNpdmVseVByb2Nlc3NQcm92aWRlcnMocmVjb3JkcywgcHJvdmlkZXJbaV0pO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAodHlwZW9mIHByb3ZpZGVyID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAvLyBGdW5jdGlvbnMgd2VyZSBzdXBwb3J0ZWQgaW4gUmVmbGVjdGl2ZUluamVjdG9yLCBidXQgYXJlIG5vdCBoZXJlLiBGb3Igc2FmZXR5IGdpdmUgdXNlZnVsXG4gICAgICAvLyBlcnJvciBtZXNzYWdlc1xuICAgICAgdGhyb3cgc3RhdGljRXJyb3IoJ0Z1bmN0aW9uL0NsYXNzIG5vdCBzdXBwb3J0ZWQnLCBwcm92aWRlcik7XG4gICAgfSBlbHNlIGlmIChwcm92aWRlciAmJiB0eXBlb2YgcHJvdmlkZXIgPT09ICdvYmplY3QnICYmIHByb3ZpZGVyLnByb3ZpZGUpIHtcbiAgICAgIC8vIEF0IHRoaXMgcG9pbnQgd2UgaGF2ZSB3aGF0IGxvb2tzIGxpa2UgYSBwcm92aWRlcjoge3Byb3ZpZGU6ID8sIC4uLi59XG4gICAgICBsZXQgdG9rZW4gPSByZXNvbHZlRm9yd2FyZFJlZihwcm92aWRlci5wcm92aWRlKTtcbiAgICAgIGNvbnN0IHJlc29sdmVkUHJvdmlkZXIgPSByZXNvbHZlUHJvdmlkZXIocHJvdmlkZXIpO1xuICAgICAgaWYgKHByb3ZpZGVyLm11bHRpID09PSB0cnVlKSB7XG4gICAgICAgIC8vIFRoaXMgaXMgYSBtdWx0aSBwcm92aWRlci5cbiAgICAgICAgbGV0IG11bHRpUHJvdmlkZXI6IFJlY29yZHx1bmRlZmluZWQgPSByZWNvcmRzLmdldCh0b2tlbik7XG4gICAgICAgIGlmIChtdWx0aVByb3ZpZGVyKSB7XG4gICAgICAgICAgaWYgKG11bHRpUHJvdmlkZXIuZm4gIT09IE1VTFRJX1BST1ZJREVSX0ZOKSB7XG4gICAgICAgICAgICB0aHJvdyBtdWx0aVByb3ZpZGVyTWl4RXJyb3IodG9rZW4pO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBDcmVhdGUgYSBwbGFjZWhvbGRlciBmYWN0b3J5IHdoaWNoIHdpbGwgbG9vayB1cCB0aGUgY29uc3RpdHVlbnRzIG9mIHRoZSBtdWx0aSBwcm92aWRlci5cbiAgICAgICAgICByZWNvcmRzLnNldCh0b2tlbiwgbXVsdGlQcm92aWRlciA9IDxSZWNvcmQ+e1xuICAgICAgICAgICAgdG9rZW46IHByb3ZpZGVyLnByb3ZpZGUsXG4gICAgICAgICAgICBkZXBzOiBbXSxcbiAgICAgICAgICAgIHVzZU5ldzogZmFsc2UsXG4gICAgICAgICAgICBmbjogTVVMVElfUFJPVklERVJfRk4sXG4gICAgICAgICAgICB2YWx1ZTogRU1QVFlcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICAvLyBUcmVhdCB0aGUgcHJvdmlkZXIgYXMgdGhlIHRva2VuLlxuICAgICAgICB0b2tlbiA9IHByb3ZpZGVyO1xuICAgICAgICBtdWx0aVByb3ZpZGVyLmRlcHMucHVzaCh7dG9rZW4sIG9wdGlvbnM6IE9wdGlvbkZsYWdzLkRlZmF1bHR9KTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IHJlY29yZCA9IHJlY29yZHMuZ2V0KHRva2VuKTtcbiAgICAgIGlmIChyZWNvcmQgJiYgcmVjb3JkLmZuID09IE1VTFRJX1BST1ZJREVSX0ZOKSB7XG4gICAgICAgIHRocm93IG11bHRpUHJvdmlkZXJNaXhFcnJvcih0b2tlbik7XG4gICAgICB9XG4gICAgICByZWNvcmRzLnNldCh0b2tlbiwgcmVzb2x2ZWRQcm92aWRlcik7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IHN0YXRpY0Vycm9yKCdVbmV4cGVjdGVkIHByb3ZpZGVyJywgcHJvdmlkZXIpO1xuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiB0cnlSZXNvbHZlVG9rZW4oXG4gICAgdG9rZW46IGFueSwgcmVjb3JkOiBSZWNvcmQgfCB1bmRlZmluZWQsIHJlY29yZHM6IE1hcDxhbnksIFJlY29yZD4sIHBhcmVudDogSW5qZWN0b3IsXG4gICAgbm90Rm91bmRWYWx1ZTogYW55LCBmbGFnczogSW5qZWN0RmxhZ3MpOiBhbnkge1xuICB0cnkge1xuICAgIHJldHVybiByZXNvbHZlVG9rZW4odG9rZW4sIHJlY29yZCwgcmVjb3JkcywgcGFyZW50LCBub3RGb3VuZFZhbHVlLCBmbGFncyk7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICAvLyBlbnN1cmUgdGhhdCAnZScgaXMgb2YgdHlwZSBFcnJvci5cbiAgICBpZiAoIShlIGluc3RhbmNlb2YgRXJyb3IpKSB7XG4gICAgICBlID0gbmV3IEVycm9yKGUpO1xuICAgIH1cbiAgICBjb25zdCBwYXRoOiBhbnlbXSA9IGVbTkdfVEVNUF9UT0tFTl9QQVRIXSA9IGVbTkdfVEVNUF9UT0tFTl9QQVRIXSB8fCBbXTtcbiAgICBwYXRoLnVuc2hpZnQodG9rZW4pO1xuICAgIGlmIChyZWNvcmQgJiYgcmVjb3JkLnZhbHVlID09IENJUkNVTEFSKSB7XG4gICAgICAvLyBSZXNldCB0aGUgQ2lyY3VsYXIgZmxhZy5cbiAgICAgIHJlY29yZC52YWx1ZSA9IEVNUFRZO1xuICAgIH1cbiAgICB0aHJvdyBlO1xuICB9XG59XG5cbmZ1bmN0aW9uIHJlc29sdmVUb2tlbihcbiAgICB0b2tlbjogYW55LCByZWNvcmQ6IFJlY29yZCB8IHVuZGVmaW5lZCwgcmVjb3JkczogTWFwPGFueSwgUmVjb3JkPiwgcGFyZW50OiBJbmplY3RvcixcbiAgICBub3RGb3VuZFZhbHVlOiBhbnksIGZsYWdzOiBJbmplY3RGbGFncyk6IGFueSB7XG4gIGxldCB2YWx1ZTtcbiAgaWYgKHJlY29yZCAmJiAhKGZsYWdzICYgSW5qZWN0RmxhZ3MuU2tpcFNlbGYpKSB7XG4gICAgLy8gSWYgd2UgZG9uJ3QgaGF2ZSBhIHJlY29yZCwgdGhpcyBpbXBsaWVzIHRoYXQgd2UgZG9uJ3Qgb3duIHRoZSBwcm92aWRlciBoZW5jZSBkb24ndCBrbm93IGhvd1xuICAgIC8vIHRvIHJlc29sdmUgaXQuXG4gICAgdmFsdWUgPSByZWNvcmQudmFsdWU7XG4gICAgaWYgKHZhbHVlID09IENJUkNVTEFSKSB7XG4gICAgICB0aHJvdyBFcnJvcihOT19ORVdfTElORSArICdDaXJjdWxhciBkZXBlbmRlbmN5Jyk7XG4gICAgfSBlbHNlIGlmICh2YWx1ZSA9PT0gRU1QVFkpIHtcbiAgICAgIHJlY29yZC52YWx1ZSA9IENJUkNVTEFSO1xuICAgICAgbGV0IG9iaiA9IHVuZGVmaW5lZDtcbiAgICAgIGxldCB1c2VOZXcgPSByZWNvcmQudXNlTmV3O1xuICAgICAgbGV0IGZuID0gcmVjb3JkLmZuO1xuICAgICAgbGV0IGRlcFJlY29yZHMgPSByZWNvcmQuZGVwcztcbiAgICAgIGxldCBkZXBzID0gRU1QVFk7XG4gICAgICBpZiAoZGVwUmVjb3Jkcy5sZW5ndGgpIHtcbiAgICAgICAgZGVwcyA9IFtdO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRlcFJlY29yZHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBjb25zdCBkZXBSZWNvcmQ6IERlcGVuZGVuY3lSZWNvcmQgPSBkZXBSZWNvcmRzW2ldO1xuICAgICAgICAgIGNvbnN0IG9wdGlvbnMgPSBkZXBSZWNvcmQub3B0aW9ucztcbiAgICAgICAgICBjb25zdCBjaGlsZFJlY29yZCA9XG4gICAgICAgICAgICAgIG9wdGlvbnMgJiBPcHRpb25GbGFncy5DaGVja1NlbGYgPyByZWNvcmRzLmdldChkZXBSZWNvcmQudG9rZW4pIDogdW5kZWZpbmVkO1xuICAgICAgICAgIGRlcHMucHVzaCh0cnlSZXNvbHZlVG9rZW4oXG4gICAgICAgICAgICAgIC8vIEN1cnJlbnQgVG9rZW4gdG8gcmVzb2x2ZVxuICAgICAgICAgICAgICBkZXBSZWNvcmQudG9rZW4sXG4gICAgICAgICAgICAgIC8vIEEgcmVjb3JkIHdoaWNoIGRlc2NyaWJlcyBob3cgdG8gcmVzb2x2ZSB0aGUgdG9rZW4uXG4gICAgICAgICAgICAgIC8vIElmIHVuZGVmaW5lZCwgdGhpcyBtZWFucyB3ZSBkb24ndCBoYXZlIHN1Y2ggYSByZWNvcmRcbiAgICAgICAgICAgICAgY2hpbGRSZWNvcmQsXG4gICAgICAgICAgICAgIC8vIE90aGVyIHJlY29yZHMgd2Uga25vdyBhYm91dC5cbiAgICAgICAgICAgICAgcmVjb3JkcyxcbiAgICAgICAgICAgICAgLy8gSWYgd2UgZG9uJ3Qga25vdyBob3cgdG8gcmVzb2x2ZSBkZXBlbmRlbmN5IGFuZCB3ZSBzaG91bGQgbm90IGNoZWNrIHBhcmVudCBmb3IgaXQsXG4gICAgICAgICAgICAgIC8vIHRoYW4gcGFzcyBpbiBOdWxsIGluamVjdG9yLlxuICAgICAgICAgICAgICAhY2hpbGRSZWNvcmQgJiYgIShvcHRpb25zICYgT3B0aW9uRmxhZ3MuQ2hlY2tQYXJlbnQpID8gTlVMTF9JTkpFQ1RPUiA6IHBhcmVudCxcbiAgICAgICAgICAgICAgb3B0aW9ucyAmIE9wdGlvbkZsYWdzLk9wdGlvbmFsID8gbnVsbCA6IEluamVjdG9yLlRIUk9XX0lGX05PVF9GT1VORCxcbiAgICAgICAgICAgICAgSW5qZWN0RmxhZ3MuRGVmYXVsdCkpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZWNvcmQudmFsdWUgPSB2YWx1ZSA9IHVzZU5ldyA/IG5ldyAoZm4gYXMgYW55KSguLi5kZXBzKSA6IGZuLmFwcGx5KG9iaiwgZGVwcyk7XG4gICAgfVxuICB9IGVsc2UgaWYgKCEoZmxhZ3MgJiBJbmplY3RGbGFncy5TZWxmKSkge1xuICAgIHZhbHVlID0gcGFyZW50LmdldCh0b2tlbiwgbm90Rm91bmRWYWx1ZSwgSW5qZWN0RmxhZ3MuRGVmYXVsdCk7XG4gIH1cbiAgcmV0dXJuIHZhbHVlO1xufVxuXG5mdW5jdGlvbiBjb21wdXRlRGVwcyhwcm92aWRlcjogU3RhdGljUHJvdmlkZXIpOiBEZXBlbmRlbmN5UmVjb3JkW10ge1xuICBsZXQgZGVwczogRGVwZW5kZW5jeVJlY29yZFtdID0gRU1QVFk7XG4gIGNvbnN0IHByb3ZpZGVyRGVwczogYW55W10gPVxuICAgICAgKHByb3ZpZGVyIGFzIEV4aXN0aW5nUHJvdmlkZXIgJiBTdGF0aWNDbGFzc1Byb3ZpZGVyICYgQ29uc3RydWN0b3JQcm92aWRlcikuZGVwcztcbiAgaWYgKHByb3ZpZGVyRGVwcyAmJiBwcm92aWRlckRlcHMubGVuZ3RoKSB7XG4gICAgZGVwcyA9IFtdO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcHJvdmlkZXJEZXBzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBsZXQgb3B0aW9ucyA9IE9wdGlvbkZsYWdzLkRlZmF1bHQ7XG4gICAgICBsZXQgdG9rZW4gPSByZXNvbHZlRm9yd2FyZFJlZihwcm92aWRlckRlcHNbaV0pO1xuICAgICAgaWYgKHRva2VuIGluc3RhbmNlb2YgQXJyYXkpIHtcbiAgICAgICAgZm9yIChsZXQgaiA9IDAsIGFubm90YXRpb25zID0gdG9rZW47IGogPCBhbm5vdGF0aW9ucy5sZW5ndGg7IGorKykge1xuICAgICAgICAgIGNvbnN0IGFubm90YXRpb24gPSBhbm5vdGF0aW9uc1tqXTtcbiAgICAgICAgICBpZiAoYW5ub3RhdGlvbiBpbnN0YW5jZW9mIE9wdGlvbmFsIHx8IGFubm90YXRpb24gPT0gT3B0aW9uYWwpIHtcbiAgICAgICAgICAgIG9wdGlvbnMgPSBvcHRpb25zIHwgT3B0aW9uRmxhZ3MuT3B0aW9uYWw7XG4gICAgICAgICAgfSBlbHNlIGlmIChhbm5vdGF0aW9uIGluc3RhbmNlb2YgU2tpcFNlbGYgfHwgYW5ub3RhdGlvbiA9PSBTa2lwU2VsZikge1xuICAgICAgICAgICAgb3B0aW9ucyA9IG9wdGlvbnMgJiB+T3B0aW9uRmxhZ3MuQ2hlY2tTZWxmO1xuICAgICAgICAgIH0gZWxzZSBpZiAoYW5ub3RhdGlvbiBpbnN0YW5jZW9mIFNlbGYgfHwgYW5ub3RhdGlvbiA9PSBTZWxmKSB7XG4gICAgICAgICAgICBvcHRpb25zID0gb3B0aW9ucyAmIH5PcHRpb25GbGFncy5DaGVja1BhcmVudDtcbiAgICAgICAgICB9IGVsc2UgaWYgKGFubm90YXRpb24gaW5zdGFuY2VvZiBJbmplY3QpIHtcbiAgICAgICAgICAgIHRva2VuID0gKGFubm90YXRpb24gYXMgSW5qZWN0KS50b2tlbjtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdG9rZW4gPSByZXNvbHZlRm9yd2FyZFJlZihhbm5vdGF0aW9uKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGRlcHMucHVzaCh7dG9rZW4sIG9wdGlvbnN9KTtcbiAgICB9XG4gIH0gZWxzZSBpZiAoKHByb3ZpZGVyIGFzIEV4aXN0aW5nUHJvdmlkZXIpLnVzZUV4aXN0aW5nKSB7XG4gICAgY29uc3QgdG9rZW4gPSByZXNvbHZlRm9yd2FyZFJlZigocHJvdmlkZXIgYXMgRXhpc3RpbmdQcm92aWRlcikudXNlRXhpc3RpbmcpO1xuICAgIGRlcHMgPSBbe3Rva2VuLCBvcHRpb25zOiBPcHRpb25GbGFncy5EZWZhdWx0fV07XG4gIH0gZWxzZSBpZiAoIXByb3ZpZGVyRGVwcyAmJiAhKFVTRV9WQUxVRSBpbiBwcm92aWRlcikpIHtcbiAgICAvLyB1c2VWYWx1ZSAmIHVzZUV4aXN0aW5nIGFyZSB0aGUgb25seSBvbmVzIHdoaWNoIGFyZSBleGVtcHQgZnJvbSBkZXBzIGFsbCBvdGhlcnMgbmVlZCBpdC5cbiAgICB0aHJvdyBzdGF0aWNFcnJvcignXFwnZGVwc1xcJyByZXF1aXJlZCcsIHByb3ZpZGVyKTtcbiAgfVxuICByZXR1cm4gZGVwcztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNhdGNoSW5qZWN0b3JFcnJvcihcbiAgICBlOiBhbnksIHRva2VuOiBhbnksIGluamVjdG9yRXJyb3JOYW1lOiBzdHJpbmcsIHNvdXJjZTogc3RyaW5nIHwgbnVsbCk6IG5ldmVyIHtcbiAgY29uc3QgdG9rZW5QYXRoOiBhbnlbXSA9IGVbTkdfVEVNUF9UT0tFTl9QQVRIXTtcbiAgaWYgKHRva2VuW1NPVVJDRV0pIHtcbiAgICB0b2tlblBhdGgudW5zaGlmdCh0b2tlbltTT1VSQ0VdKTtcbiAgfVxuICBlLm1lc3NhZ2UgPSBmb3JtYXRFcnJvcignXFxuJyArIGUubWVzc2FnZSwgdG9rZW5QYXRoLCBpbmplY3RvckVycm9yTmFtZSwgc291cmNlKTtcbiAgZVtOR19UT0tFTl9QQVRIXSA9IHRva2VuUGF0aDtcbiAgZVtOR19URU1QX1RPS0VOX1BBVEhdID0gbnVsbDtcbiAgdGhyb3cgZTtcbn1cblxuZnVuY3Rpb24gZm9ybWF0RXJyb3IoXG4gICAgdGV4dDogc3RyaW5nLCBvYmo6IGFueSwgaW5qZWN0b3JFcnJvck5hbWU6IHN0cmluZywgc291cmNlOiBzdHJpbmcgfCBudWxsID0gbnVsbCk6IHN0cmluZyB7XG4gIHRleHQgPSB0ZXh0ICYmIHRleHQuY2hhckF0KDApID09PSAnXFxuJyAmJiB0ZXh0LmNoYXJBdCgxKSA9PSBOT19ORVdfTElORSA/IHRleHQuc3Vic3RyKDIpIDogdGV4dDtcbiAgbGV0IGNvbnRleHQgPSBzdHJpbmdpZnkob2JqKTtcbiAgaWYgKG9iaiBpbnN0YW5jZW9mIEFycmF5KSB7XG4gICAgY29udGV4dCA9IG9iai5tYXAoc3RyaW5naWZ5KS5qb2luKCcgLT4gJyk7XG4gIH0gZWxzZSBpZiAodHlwZW9mIG9iaiA9PT0gJ29iamVjdCcpIHtcbiAgICBsZXQgcGFydHMgPSA8c3RyaW5nW10+W107XG4gICAgZm9yIChsZXQga2V5IGluIG9iaikge1xuICAgICAgaWYgKG9iai5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgIGxldCB2YWx1ZSA9IG9ialtrZXldO1xuICAgICAgICBwYXJ0cy5wdXNoKFxuICAgICAgICAgICAga2V5ICsgJzonICsgKHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycgPyBKU09OLnN0cmluZ2lmeSh2YWx1ZSkgOiBzdHJpbmdpZnkodmFsdWUpKSk7XG4gICAgICB9XG4gICAgfVxuICAgIGNvbnRleHQgPSBgeyR7cGFydHMuam9pbignLCAnKX19YDtcbiAgfVxuICByZXR1cm4gYCR7aW5qZWN0b3JFcnJvck5hbWV9JHtzb3VyY2UgPyAnKCcgKyBzb3VyY2UgKyAnKScgOiAnJ31bJHtjb250ZXh0fV06ICR7dGV4dC5yZXBsYWNlKE5FV19MSU5FLCAnXFxuICAnKX1gO1xufVxuXG5mdW5jdGlvbiBzdGF0aWNFcnJvcih0ZXh0OiBzdHJpbmcsIG9iajogYW55KTogRXJyb3Ige1xuICByZXR1cm4gbmV3IEVycm9yKGZvcm1hdEVycm9yKHRleHQsIG9iaiwgJ1N0YXRpY0luamVjdG9yRXJyb3InKSk7XG59XG4iXX0=