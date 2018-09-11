/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as tslib_1 from "tslib";
import { stringify } from '../util';
import { getClosureSafeProperty } from '../util/property';
import { defineInjectable, getInjectableDef } from './defs';
import { resolveForwardRef } from './forward_ref';
import { InjectionToken } from './injection_token';
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
 * @experimental
 */
export var INJECTOR = new InjectionToken('INJECTOR');
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
            throw new Error("NullInjectorError: No provider for " + stringify(token) + "!");
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
 *
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
    Injector.ngInjectableDef = defineInjectable({
        providedIn: 'any',
        factory: function () { return inject(INJECTOR); },
    });
    return Injector;
}());
export { Injector };
var IDENT = function (value) {
    return value;
};
var ɵ0 = IDENT;
var EMPTY = [];
var CIRCULAR = IDENT;
var MULTI_PROVIDER_FN = function () {
    return Array.prototype.slice.call(arguments);
};
var ɵ1 = MULTI_PROVIDER_FN;
export var USE_VALUE = getClosureSafeProperty({ provide: String, useValue: getClosureSafeProperty });
var NG_TOKEN_PATH = 'ngTokenPath';
var NG_TEMP_TOKEN_PATH = 'ngTempTokenPath';
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
        if (flags === void 0) { flags = 0 /* Default */; }
        var record = this._records.get(token);
        try {
            return tryResolveToken(token, record, this._records, this.parent, notFoundValue, flags);
        }
        catch (e) {
            var tokenPath = e[NG_TEMP_TOKEN_PATH];
            if (token[SOURCE]) {
                tokenPath.unshift(token[SOURCE]);
            }
            e.message = formatError('\n' + e.message, tokenPath, this.source);
            e[NG_TOKEN_PATH] = tokenPath;
            e[NG_TEMP_TOKEN_PATH] = null;
            throw e;
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
    if (record && !(flags & 4 /* SkipSelf */)) {
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
                    !childRecord && !(options & 4 /* CheckParent */) ? NULL_INJECTOR : parent, options & 1 /* Optional */ ? null : Injector.THROW_IF_NOT_FOUND, 0 /* Default */));
                }
            }
            record.value = value = useNew ? new ((_a = fn).bind.apply(_a, tslib_1.__spread([void 0], deps)))() : fn.apply(obj, deps);
        }
    }
    else if (!(flags & 2 /* Self */)) {
        value = parent.get(token, notFoundValue, 0 /* Default */);
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
function formatError(text, obj, source) {
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
    return "StaticInjectorError" + (source ? '(' + source + ')' : '') + "[" + context + "]: " + text.replace(NEW_LINE, '\n  ');
}
function staticError(text, obj) {
    return new Error(formatError(text, obj));
}
/**
 * Current injector value used by `inject`.
 * - `undefined`: it is an error to call `inject`
 * - `null`: `inject` can be called but there is no injector (limp-mode).
 * - Injector instance: Use the injector for resolution.
 */
var _currentInjector = undefined;
export function setCurrentInjector(injector) {
    var former = _currentInjector;
    _currentInjector = injector;
    return former;
}
export function inject(token, flags) {
    if (flags === void 0) { flags = 0 /* Default */; }
    if (_currentInjector === undefined) {
        throw new Error("inject() must be called from an injection context");
    }
    else if (_currentInjector === null) {
        var injectableDef = getInjectableDef(token);
        if (injectableDef && injectableDef.providedIn == 'root') {
            return injectableDef.value === undefined ? injectableDef.value = injectableDef.factory() :
                injectableDef.value;
        }
        if (flags & 8 /* Optional */)
            return null;
        throw new Error("Injector: NOT_FOUND [" + stringify(token) + "]");
    }
    else {
        return _currentInjector.get(token, flags & 8 /* Optional */ ? null : undefined, flags);
    }
}
export function injectArgs(types) {
    var args = [];
    for (var i = 0; i < types.length; i++) {
        var arg = types[i];
        if (Array.isArray(arg)) {
            if (arg.length === 0) {
                throw new Error('Arguments array must have arguments.');
            }
            var type = undefined;
            var flags = 0 /* Default */;
            for (var j = 0; j < arg.length; j++) {
                var meta = arg[j];
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
            args.push(inject(type, flags));
        }
        else {
            args.push(inject(arg));
        }
    }
    return args;
}
export { ɵ0, ɵ1 };

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5qZWN0b3IuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9kaS9pbmplY3Rvci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7O0FBR0gsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLFNBQVMsQ0FBQztBQUNsQyxPQUFPLEVBQUMsc0JBQXNCLEVBQUMsTUFBTSxrQkFBa0IsQ0FBQztBQUV4RCxPQUFPLEVBQWdCLGdCQUFnQixFQUFFLGdCQUFnQixFQUFDLE1BQU0sUUFBUSxDQUFDO0FBQ3pFLE9BQU8sRUFBQyxpQkFBaUIsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUNoRCxPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDakQsT0FBTyxFQUFDLE1BQU0sRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBQyxNQUFNLFlBQVksQ0FBQztBQUc1RCxNQUFNLENBQUMsSUFBTSxNQUFNLEdBQUcsVUFBVSxDQUFDO0FBQ2pDLElBQU0sbUJBQW1CLEdBQUcsSUFBSSxNQUFNLEVBQUUsQ0FBQztBQUN6QyxNQUFNLENBQUMsSUFBTSxrQkFBa0IsR0FBRyxtQkFBbUIsQ0FBQztBQUV0RDs7Ozs7OztHQU9HO0FBQ0gsTUFBTSxDQUFDLElBQU0sUUFBUSxHQUFHLElBQUksY0FBYyxDQUFXLFVBQVUsQ0FBQyxDQUFDO0FBRWpFO0lBQUE7SUFXQSxDQUFDO0lBVkMsMEJBQUcsR0FBSCxVQUFJLEtBQVUsRUFBRSxhQUF3QztRQUF4Qyw4QkFBQSxFQUFBLG1DQUF3QztRQUN0RCxJQUFJLGFBQWEsS0FBSyxtQkFBbUIsRUFBRTtZQUN6QywwRkFBMEY7WUFDMUYsd0VBQXdFO1lBQ3hFLDRFQUE0RTtZQUM1RSwwQkFBMEI7WUFDMUIsTUFBTSxJQUFJLEtBQUssQ0FBQyx3Q0FBc0MsU0FBUyxDQUFDLEtBQUssQ0FBQyxNQUFHLENBQUMs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RTdDLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxHQUFHLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO2dCQUNuQyxJQUFNLElBQUksR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ3BCLElBQUksSUFBSSxZQUFZLFFBQVEsSUFBSSxJQUFJLENBQUMsY0FBYyxLQUFLLFVBQVUsRUFBRTtvQkFDbEUsS0FBSyxvQkFBd0IsQ0FBQztpQkFDL0I7cUJBQU0sSUFBSSxJQUFJLFlBQVksUUFBUSxJQUFJLElBQUksQ0FBQyxjQUFjLEtBQUssVUFBVSxFQUFFO29CQUN6RSxLQUFLLG9CQUF3QixDQUFDO2lCQUMvQjtxQkFBTSxJQUFJLElBQUksWUFBWSxJQUFJLElBQUksSUFBSSxDQUFDLGNBQWMsS0FBSyxNQUFNLEVBQUU7b0JBQ2pFLEtBQUssZ0JBQW9CLENBQUM7aUJBQzNCO3FCQUFNLElBQUksSUFBSSxZQUFZLE1BQU0sRUFBRTtvQkFDakMsSUFBSSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUM7aUJBQ25CO3FCQUFNO29CQUNMLElBQUksR0FBRyxJQUFJLENBQUM7aUJBQ2I7YUFDRjtZQUVELElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQU0sRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDO1NBQ2xDO2FBQU07WUFDTCxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO1NBQ3hCO0tBQ0Y7SUFDRCxPQUFPLElBQUksQ0FBQztBQUNkLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7VHlwZX0gZnJvbSAnLi4vdHlwZSc7XG5pbXBvcnQge3N0cmluZ2lmeX0gZnJvbSAnLi4vdXRpbCc7XG5pbXBvcnQge2dldENsb3N1cmVTYWZlUHJvcGVydHl9IGZyb20gJy4uL3V0aWwvcHJvcGVydHknO1xuXG5pbXBvcnQge0luamVjdGFibGVEZWYsIGRlZmluZUluamVjdGFibGUsIGdldEluamVjdGFibGVEZWZ9IGZyb20gJy4vZGVmcyc7XG5pbXBvcnQge3Jlc29sdmVGb3J3YXJkUmVmfSBmcm9tICcuL2ZvcndhcmRfcmVmJztcbmltcG9ydCB7SW5qZWN0aW9uVG9rZW59IGZyb20gJy4vaW5qZWN0aW9uX3Rva2VuJztcbmltcG9ydCB7SW5qZWN0LCBPcHRpb25hbCwgU2VsZiwgU2tpcFNlbGZ9IGZyb20gJy4vbWV0YWRhdGEnO1xuaW1wb3J0IHtDb25zdHJ1Y3RvclByb3ZpZGVyLCBFeGlzdGluZ1Byb3ZpZGVyLCBGYWN0b3J5UHJvdmlkZXIsIFN0YXRpY0NsYXNzUHJvdmlkZXIsIFN0YXRpY1Byb3ZpZGVyLCBWYWx1ZVByb3ZpZGVyfSBmcm9tICcuL3Byb3ZpZGVyJztcblxuZXhwb3J0IGNvbnN0IFNPVVJDRSA9ICdfX3NvdXJjZSc7XG5jb25zdCBfVEhST1dfSUZfTk9UX0ZPVU5EID0gbmV3IE9iamVjdCgpO1xuZXhwb3J0IGNvbnN0IFRIUk9XX0lGX05PVF9GT1VORCA9IF9USFJPV19JRl9OT1RfRk9VTkQ7XG5cbi8qKlxuICogQW4gSW5qZWN0aW9uVG9rZW4gdGhhdCBnZXRzIHRoZSBjdXJyZW50IGBJbmplY3RvcmAgZm9yIGBjcmVhdGVJbmplY3RvcigpYC1zdHlsZSBpbmplY3RvcnMuXG4gKlxuICogUmVxdWVzdGluZyB0aGlzIHRva2VuIGluc3RlYWQgb2YgYEluamVjdG9yYCBhbGxvd3MgYFN0YXRpY0luamVjdG9yYCB0byBiZSB0cmVlLXNoYWtlbiBmcm9tIGFcbiAqIHByb2plY3QuXG4gKlxuICogQGV4cGVyaW1lbnRhbFxuICovXG5leHBvcnQgY29uc3QgSU5KRUNUT1IgPSBuZXcgSW5qZWN0aW9uVG9rZW48SW5qZWN0b3I+KCdJTkpFQ1RPUicpO1xuXG5leHBvcnQgY2xhc3MgTnVsbEluamVjdG9yIGltcGxlbWVudHMgSW5qZWN0b3Ige1xuICBnZXQodG9rZW46IGFueSwgbm90Rm91bmRWYWx1ZTogYW55ID0gX1RIUk9XX0lGX05PVF9GT1VORCk6IGFueSB7XG4gICAgaWYgKG5vdEZvdW5kVmFsdWUgPT09IF9USFJPV19JRl9OT1RfRk9VTkQpIHtcbiAgICAgIC8vIEludGVudGlvbmFsbHkgbGVmdCBiZWhpbmQ6IFdpdGggZGV2IHRvb2xzIG9wZW4gdGhlIGRlYnVnZ2VyIHdpbGwgc3RvcCBoZXJlLiBUaGVyZSBpcyBub1xuICAgICAgLy8gcmVhc29uIHdoeSBjb3JyZWN0bHkgd3JpdHRlbiBhcHBsaWNhdGlvbiBzaG91bGQgY2F1c2UgdGhpcyBleGNlcHRpb24uXG4gICAgICAvLyBUT0RPKG1pc2tvKTogdW5jb21tZW50IHRoZSBuZXh0IGxpbmUgb25jZSBgbmdEZXZNb2RlYCB3b3JrcyB3aXRoIGNsb3N1cmUuXG4gICAgICAvLyBpZihuZ0Rldk1vZGUpIGRlYnVnZ2VyO1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBOdWxsSW5qZWN0b3JFcnJvcjogTm8gcHJvdmlkZXIgZm9yICR7c3RyaW5naWZ5KHRva2VuKX0hYCk7XG4gICAgfVxuICAgIHJldHVybiBub3RGb3VuZFZhbHVlO1xuICB9XG59XG5cbi8qKlxuICogQ29uY3JldGUgaW5qZWN0b3JzIGltcGxlbWVudCB0aGlzIGludGVyZmFjZS5cbiAqXG4gKiBGb3IgbW9yZSBkZXRhaWxzLCBzZWUgdGhlIFtcIkRlcGVuZGVuY3kgSW5qZWN0aW9uIEd1aWRlXCJdKGd1aWRlL2RlcGVuZGVuY3ktaW5qZWN0aW9uKS5cbiAqXG4gKiBAdXNhZ2VOb3Rlc1xuICogIyMjIEV4YW1wbGVcbiAqXG4gKiB7QGV4YW1wbGUgY29yZS9kaS90cy9pbmplY3Rvcl9zcGVjLnRzIHJlZ2lvbj0nSW5qZWN0b3InfVxuICpcbiAqIGBJbmplY3RvcmAgcmV0dXJucyBpdHNlbGYgd2hlbiBnaXZlbiBgSW5qZWN0b3JgIGFzIGEgdG9rZW46XG4gKlxuICoge0BleGFtcGxlIGNvcmUvZGkvdHMvaW5qZWN0b3Jfc3BlYy50cyByZWdpb249J2luamVjdEluamVjdG9yJ31cbiAqXG4gKlxuICovXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgSW5qZWN0b3Ige1xuICBzdGF0aWMgVEhST1dfSUZfTk9UX0ZPVU5EID0gX1RIUk9XX0lGX05PVF9GT1VORDtcbiAgc3RhdGljIE5VTEw6IEluamVjdG9yID0gbmV3IE51bGxJbmplY3RvcigpO1xuXG4gIC8qKlxuICAgKiBSZXRyaWV2ZXMgYW4gaW5zdGFuY2UgZnJvbSB0aGUgaW5qZWN0b3IgYmFzZWQgb24gdGhlIHByb3ZpZGVkIHRva2VuLlxuICAgKiBAcmV0dXJucyBUaGUgaW5zdGFuY2UgZnJvbSB0aGUgaW5qZWN0b3IgaWYgZGVmaW5lZCwgb3RoZXJ3aXNlIHRoZSBgbm90Rm91bmRWYWx1ZWAuXG4gICAqIEB0aHJvd3MgV2hlbiB0aGUgYG5vdEZvdW5kVmFsdWVgIGlzIGB1bmRlZmluZWRgIG9yIGBJbmplY3Rvci5USFJPV19JRl9OT1RfRk9VTkRgLlxuICAgKi9cbiAgYWJzdHJhY3QgZ2V0PFQ+KHRva2VuOiBUeXBlPFQ+fEluamVjdGlvblRva2VuPFQ+LCBub3RGb3VuZFZhbHVlPzogVCwgZmxhZ3M/OiBJbmplY3RGbGFncyk6IFQ7XG4gIC8qKlxuICAgKiBAZGVwcmVjYXRlZCBmcm9tIHY0LjAuMCB1c2UgVHlwZTxUPiBvciBJbmplY3Rpb25Ub2tlbjxUPlxuICAgKiBAc3VwcHJlc3Mge2R1cGxpY2F0ZX1cbiAgICovXG4gIGFic3RyYWN0IGdldCh0b2tlbjogYW55LCBub3RGb3VuZFZhbHVlPzogYW55KTogYW55O1xuXG4gIC8qKlxuICAgKiBAZGVwcmVjYXRlZCBmcm9tIHY1IHVzZSB0aGUgbmV3IHNpZ25hdHVyZSBJbmplY3Rvci5jcmVhdGUob3B0aW9ucylcbiAgICovXG4gIHN0YXRpYyBjcmVhdGUocHJvdmlkZXJzOiBTdGF0aWNQcm92aWRlcltdLCBwYXJlbnQ/OiBJbmplY3Rvcik6IEluamVjdG9yO1xuXG4gIHN0YXRpYyBjcmVhdGUob3B0aW9uczoge3Byb3ZpZGVyczogU3RhdGljUHJvdmlkZXJbXSwgcGFyZW50PzogSW5qZWN0b3IsIG5hbWU/OiBzdHJpbmd9KTogSW5qZWN0b3I7XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBhIG5ldyBJbmplY3RvciB3aGljaCBpcyBjb25maWd1cmUgdXNpbmcgYFN0YXRpY1Byb3ZpZGVyYHMuXG4gICAqXG4gICAqIEB1c2FnZU5vdGVzXG4gICAqICMjIyBFeGFtcGxlXG4gICAqXG4gICAqIHtAZXhhbXBsZSBjb3JlL2RpL3RzL3Byb3ZpZGVyX3NwZWMudHMgcmVnaW9uPSdDb25zdHJ1Y3RvclByb3ZpZGVyJ31cbiAgICovXG4gIHN0YXRpYyBjcmVhdGUoXG4gICAgICBvcHRpb25zOiBTdGF0aWNQcm92aWRlcltdfHtwcm92aWRlcnM6IFN0YXRpY1Byb3ZpZGVyW10sIHBhcmVudD86IEluamVjdG9yLCBuYW1lPzogc3RyaW5nfSxcbiAgICAgIHBhcmVudD86IEluamVjdG9yKTogSW5qZWN0b3Ige1xuICAgIGlmIChBcnJheS5pc0FycmF5KG9wdGlvbnMpKSB7XG4gICAgICByZXR1cm4gbmV3IFN0YXRpY0luamVjdG9yKG9wdGlvbnMsIHBhcmVudCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBuZXcgU3RhdGljSW5qZWN0b3Iob3B0aW9ucy5wcm92aWRlcnMsIG9wdGlvbnMucGFyZW50LCBvcHRpb25zLm5hbWUgfHwgbnVsbCk7XG4gICAgfVxuICB9XG5cbiAgc3RhdGljIG5nSW5qZWN0YWJsZURlZiA9IGRlZmluZUluamVjdGFibGUoe1xuICAgIHByb3ZpZGVkSW46ICdhbnknIGFzIGFueSxcbiAgICBmYWN0b3J5OiAoKSA9PiBpbmplY3QoSU5KRUNUT1IpLFxuICB9KTtcbn1cblxuXG5cbmNvbnN0IElERU5UID0gZnVuY3Rpb248VD4odmFsdWU6IFQpOiBUIHtcbiAgcmV0dXJuIHZhbHVlO1xufTtcbmNvbnN0IEVNUFRZID0gPGFueVtdPltdO1xuY29uc3QgQ0lSQ1VMQVIgPSBJREVOVDtcbmNvbnN0IE1VTFRJX1BST1ZJREVSX0ZOID0gZnVuY3Rpb24oKTogYW55W10ge1xuICByZXR1cm4gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzKTtcbn07XG5leHBvcnQgY29uc3QgVVNFX1ZBTFVFID1cbiAgICBnZXRDbG9zdXJlU2FmZVByb3BlcnR5PFZhbHVlUHJvdmlkZXI+KHtwcm92aWRlOiBTdHJpbmcsIHVzZVZhbHVlOiBnZXRDbG9zdXJlU2FmZVByb3BlcnR5fSk7XG5jb25zdCBOR19UT0tFTl9QQVRIID0gJ25nVG9rZW5QYXRoJztcbmNvbnN0IE5HX1RFTVBfVE9LRU5fUEFUSCA9ICduZ1RlbXBUb2tlblBhdGgnO1xuY29uc3QgZW51bSBPcHRpb25GbGFncyB7XG4gIE9wdGlvbmFsID0gMSA8PCAwLFxuICBDaGVja1NlbGYgPSAxIDw8IDEsXG4gIENoZWNrUGFyZW50ID0gMSA8PCAyLFxuICBEZWZhdWx0ID0gQ2hlY2tTZWxmIHwgQ2hlY2tQYXJlbnRcbn1cbmNvbnN0IE5VTExfSU5KRUNUT1IgPSBJbmplY3Rvci5OVUxMO1xuY29uc3QgTkVXX0xJTkUgPSAvXFxuL2dtO1xuY29uc3QgTk9fTkVXX0xJTkUgPSAnybUnO1xuXG5leHBvcnQgY2xhc3MgU3RhdGljSW5qZWN0b3IgaW1wbGVtZW50cyBJbmplY3RvciB7XG4gIHJlYWRvbmx5IHBhcmVudDogSW5qZWN0b3I7XG4gIHJlYWRvbmx5IHNvdXJjZTogc3RyaW5nfG51bGw7XG5cbiAgcHJpdmF0ZSBfcmVjb3JkczogTWFwPGFueSwgUmVjb3JkPjtcblxuICBjb25zdHJ1Y3RvcihcbiAgICAgIHByb3ZpZGVyczogU3RhdGljUHJvdmlkZXJbXSwgcGFyZW50OiBJbmplY3RvciA9IE5VTExfSU5KRUNUT1IsIHNvdXJjZTogc3RyaW5nfG51bGwgPSBudWxsKSB7XG4gICAgdGhpcy5wYXJlbnQgPSBwYXJlbnQ7XG4gICAgdGhpcy5zb3VyY2UgPSBzb3VyY2U7XG4gICAgY29uc3QgcmVjb3JkcyA9IHRoaXMuX3JlY29yZHMgPSBuZXcgTWFwPGFueSwgUmVjb3JkPigpO1xuICAgIHJlY29yZHMuc2V0KFxuICAgICAgICBJbmplY3RvciwgPFJlY29yZD57dG9rZW46IEluamVjdG9yLCBmbjogSURFTlQsIGRlcHM6IEVNUFRZLCB2YWx1ZTogdGhpcywgdXNlTmV3OiBmYWxzZX0pO1xuICAgIHJlY29yZHMuc2V0KFxuICAgICAgICBJTkpFQ1RPUiwgPFJlY29yZD57dG9rZW46IElOSkVDVE9SLCBmbjogSURFTlQsIGRlcHM6IEVNUFRZLCB2YWx1ZTogdGhpcywgdXNlTmV3OiBmYWxzZX0pO1xuICAgIHJlY3Vyc2l2ZWx5UHJvY2Vzc1Byb3ZpZGVycyhyZWNvcmRzLCBwcm92aWRlcnMpO1xuICB9XG5cbiAgZ2V0PFQ+KHRva2VuOiBUeXBlPFQ+fEluamVjdGlvblRva2VuPFQ+LCBub3RGb3VuZFZhbHVlPzogVCwgZmxhZ3M/OiBJbmplY3RGbGFncyk6IFQ7XG4gIGdldCh0b2tlbjogYW55LCBub3RGb3VuZFZhbHVlPzogYW55KTogYW55O1xuICBnZXQodG9rZW46IGFueSwgbm90Rm91bmRWYWx1ZT86IGFueSwgZmxhZ3M6IEluamVjdEZsYWdzID0gSW5qZWN0RmxhZ3MuRGVmYXVsdCk6IGFueSB7XG4gICAgY29uc3QgcmVjb3JkID0gdGhpcy5fcmVjb3Jkcy5nZXQodG9rZW4pO1xuICAgIHRyeSB7XG4gICAgICByZXR1cm4gdHJ5UmVzb2x2ZVRva2VuKHRva2VuLCByZWNvcmQsIHRoaXMuX3JlY29yZHMsIHRoaXMucGFyZW50LCBub3RGb3VuZFZhbHVlLCBmbGFncyk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgY29uc3QgdG9rZW5QYXRoOiBhbnlbXSA9IGVbTkdfVEVNUF9UT0tFTl9QQVRIXTtcbiAgICAgIGlmICh0b2tlbltTT1VSQ0VdKSB7XG4gICAgICAgIHRva2VuUGF0aC51bnNoaWZ0KHRva2VuW1NPVVJDRV0pO1xuICAgICAgfVxuICAgICAgZS5tZXNzYWdlID0gZm9ybWF0RXJyb3IoJ1xcbicgKyBlLm1lc3NhZ2UsIHRva2VuUGF0aCwgdGhpcy5zb3VyY2UpO1xuICAgICAgZVtOR19UT0tFTl9QQVRIXSA9IHRva2VuUGF0aDtcbiAgICAgIGVbTkdfVEVNUF9UT0tFTl9QQVRIXSA9IG51bGw7XG4gICAgICB0aHJvdyBlO1xuICAgIH1cbiAgfVxuXG4gIHRvU3RyaW5nKCkge1xuICAgIGNvbnN0IHRva2VucyA9IDxzdHJpbmdbXT5bXSwgcmVjb3JkcyA9IHRoaXMuX3JlY29yZHM7XG4gICAgcmVjb3Jkcy5mb3JFYWNoKCh2LCB0b2tlbikgPT4gdG9rZW5zLnB1c2goc3RyaW5naWZ5KHRva2VuKSkpO1xuICAgIHJldHVybiBgU3RhdGljSW5qZWN0b3JbJHt0b2tlbnMuam9pbignLCAnKX1dYDtcbiAgfVxufVxuXG50eXBlIFN1cHBvcnRlZFByb3ZpZGVyID1cbiAgICBWYWx1ZVByb3ZpZGVyIHwgRXhpc3RpbmdQcm92aWRlciB8IFN0YXRpY0NsYXNzUHJvdmlkZXIgfCBDb25zdHJ1Y3RvclByb3ZpZGVyIHwgRmFjdG9yeVByb3ZpZGVyO1xuXG5pbnRlcmZhY2UgUmVjb3JkIHtcbiAgZm46IEZ1bmN0aW9uO1xuICB1c2VOZXc6IGJvb2xlYW47XG4gIGRlcHM6IERlcGVuZGVuY3lSZWNvcmRbXTtcbiAgdmFsdWU6IGFueTtcbn1cblxuaW50ZXJmYWNlIERlcGVuZGVuY3lSZWNvcmQge1xuICB0b2tlbjogYW55O1xuICBvcHRpb25zOiBudW1iZXI7XG59XG5cbnR5cGUgVG9rZW5QYXRoID0gQXJyYXk8YW55PjtcblxuZnVuY3Rpb24gcmVzb2x2ZVByb3ZpZGVyKHByb3ZpZGVyOiBTdXBwb3J0ZWRQcm92aWRlcik6IFJlY29yZCB7XG4gIGNvbnN0IGRlcHMgPSBjb21wdXRlRGVwcyhwcm92aWRlcik7XG4gIGxldCBmbjogRnVuY3Rpb24gPSBJREVOVDtcbiAgbGV0IHZhbHVlOiBhbnkgPSBFTVBUWTtcbiAgbGV0IHVzZU5ldzogYm9vbGVhbiA9IGZhbHNlO1xuICBsZXQgcHJvdmlkZSA9IHJlc29sdmVGb3J3YXJkUmVmKHByb3ZpZGVyLnByb3ZpZGUpO1xuICBpZiAoVVNFX1ZBTFVFIGluIHByb3ZpZGVyKSB7XG4gICAgLy8gV2UgbmVlZCB0byB1c2UgVVNFX1ZBTFVFIGluIHByb3ZpZGVyIHNpbmNlIHByb3ZpZGVyLnVzZVZhbHVlIGNvdWxkIGJlIGRlZmluZWQgYXMgdW5kZWZpbmVkLlxuICAgIHZhbHVlID0gKHByb3ZpZGVyIGFzIFZhbHVlUHJvdmlkZXIpLnVzZVZhbHVlO1xuICB9IGVsc2UgaWYgKChwcm92aWRlciBhcyBGYWN0b3J5UHJvdmlkZXIpLnVzZUZhY3RvcnkpIHtcbiAgICBmbiA9IChwcm92aWRlciBhcyBGYWN0b3J5UHJvdmlkZXIpLnVzZUZhY3Rvcnk7XG4gIH0gZWxzZSBpZiAoKHByb3ZpZGVyIGFzIEV4aXN0aW5nUHJvdmlkZXIpLnVzZUV4aXN0aW5nKSB7XG4gICAgLy8gSnVzdCB1c2UgSURFTlRcbiAgfSBlbHNlIGlmICgocHJvdmlkZXIgYXMgU3RhdGljQ2xhc3NQcm92aWRlcikudXNlQ2xhc3MpIHtcbiAgICB1c2VOZXcgPSB0cnVlO1xuICAgIGZuID0gcmVzb2x2ZUZvcndhcmRSZWYoKHByb3ZpZGVyIGFzIFN0YXRpY0NsYXNzUHJvdmlkZXIpLnVzZUNsYXNzKTtcbiAgfSBlbHNlIGlmICh0eXBlb2YgcHJvdmlkZSA9PSAnZnVuY3Rpb24nKSB7XG4gICAgdXNlTmV3ID0gdHJ1ZTtcbiAgICBmbiA9IHByb3ZpZGU7XG4gIH0gZWxzZSB7XG4gICAgdGhyb3cgc3RhdGljRXJyb3IoXG4gICAgICAgICdTdGF0aWNQcm92aWRlciBkb2VzIG5vdCBoYXZlIFt1c2VWYWx1ZXx1c2VGYWN0b3J5fHVzZUV4aXN0aW5nfHVzZUNsYXNzXSBvciBbcHJvdmlkZV0gaXMgbm90IG5ld2FibGUnLFxuICAgICAgICBwcm92aWRlcik7XG4gIH1cbiAgcmV0dXJuIHtkZXBzLCBmbiwgdXNlTmV3LCB2YWx1ZX07XG59XG5cbmZ1bmN0aW9uIG11bHRpUHJvdmlkZXJNaXhFcnJvcih0b2tlbjogYW55KSB7XG4gIHJldHVybiBzdGF0aWNFcnJvcignQ2Fubm90IG1peCBtdWx0aSBwcm92aWRlcnMgYW5kIHJlZ3VsYXIgcHJvdmlkZXJzJywgdG9rZW4pO1xufVxuXG5mdW5jdGlvbiByZWN1cnNpdmVseVByb2Nlc3NQcm92aWRlcnMocmVjb3JkczogTWFwPGFueSwgUmVjb3JkPiwgcHJvdmlkZXI6IFN0YXRpY1Byb3ZpZGVyKSB7XG4gIGlmIChwcm92aWRlcikge1xuICAgIHByb3ZpZGVyID0gcmVzb2x2ZUZvcndhcmRSZWYocHJvdmlkZXIpO1xuICAgIGlmIChwcm92aWRlciBpbnN0YW5jZW9mIEFycmF5KSB7XG4gICAgICAvLyBpZiB3ZSBoYXZlIGFuIGFycmF5IHJlY3Vyc2UgaW50byB0aGUgYXJyYXlcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcHJvdmlkZXIubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgcmVjdXJzaXZlbHlQcm9jZXNzUHJvdmlkZXJzKHJlY29yZHMsIHByb3ZpZGVyW2ldKTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBwcm92aWRlciA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgLy8gRnVuY3Rpb25zIHdlcmUgc3VwcG9ydGVkIGluIFJlZmxlY3RpdmVJbmplY3RvciwgYnV0IGFyZSBub3QgaGVyZS4gRm9yIHNhZmV0eSBnaXZlIHVzZWZ1bFxuICAgICAgLy8gZXJyb3IgbWVzc2FnZXNcbiAgICAgIHRocm93IHN0YXRpY0Vycm9yKCdGdW5jdGlvbi9DbGFzcyBub3Qgc3VwcG9ydGVkJywgcHJvdmlkZXIpO1xuICAgIH0gZWxzZSBpZiAocHJvdmlkZXIgJiYgdHlwZW9mIHByb3ZpZGVyID09PSAnb2JqZWN0JyAmJiBwcm92aWRlci5wcm92aWRlKSB7XG4gICAgICAvLyBBdCB0aGlzIHBvaW50IHdlIGhhdmUgd2hhdCBsb29rcyBsaWtlIGEgcHJvdmlkZXI6IHtwcm92aWRlOiA/LCAuLi4ufVxuICAgICAgbGV0IHRva2VuID0gcmVzb2x2ZUZvcndhcmRSZWYocHJvdmlkZXIucHJvdmlkZSk7XG4gICAgICBjb25zdCByZXNvbHZlZFByb3ZpZGVyID0gcmVzb2x2ZVByb3ZpZGVyKHByb3ZpZGVyKTtcbiAgICAgIGlmIChwcm92aWRlci5tdWx0aSA9PT0gdHJ1ZSkge1xuICAgICAgICAvLyBUaGlzIGlzIGEgbXVsdGkgcHJvdmlkZXIuXG4gICAgICAgIGxldCBtdWx0aVByb3ZpZGVyOiBSZWNvcmR8dW5kZWZpbmVkID0gcmVjb3Jkcy5nZXQodG9rZW4pO1xuICAgICAgICBpZiAobXVsdGlQcm92aWRlcikge1xuICAgICAgICAgIGlmIChtdWx0aVByb3ZpZGVyLmZuICE9PSBNVUxUSV9QUk9WSURFUl9GTikge1xuICAgICAgICAgICAgdGhyb3cgbXVsdGlQcm92aWRlck1peEVycm9yKHRva2VuKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gQ3JlYXRlIGEgcGxhY2Vob2xkZXIgZmFjdG9yeSB3aGljaCB3aWxsIGxvb2sgdXAgdGhlIGNvbnN0aXR1ZW50cyBvZiB0aGUgbXVsdGkgcHJvdmlkZXIuXG4gICAgICAgICAgcmVjb3Jkcy5zZXQodG9rZW4sIG11bHRpUHJvdmlkZXIgPSA8UmVjb3JkPntcbiAgICAgICAgICAgIHRva2VuOiBwcm92aWRlci5wcm92aWRlLFxuICAgICAgICAgICAgZGVwczogW10sXG4gICAgICAgICAgICB1c2VOZXc6IGZhbHNlLFxuICAgICAgICAgICAgZm46IE1VTFRJX1BST1ZJREVSX0ZOLFxuICAgICAgICAgICAgdmFsdWU6IEVNUFRZXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gVHJlYXQgdGhlIHByb3ZpZGVyIGFzIHRoZSB0b2tlbi5cbiAgICAgICAgdG9rZW4gPSBwcm92aWRlcjtcbiAgICAgICAgbXVsdGlQcm92aWRlci5kZXBzLnB1c2goe3Rva2VuLCBvcHRpb25zOiBPcHRpb25GbGFncy5EZWZhdWx0fSk7XG4gICAgICB9XG4gICAgICBjb25zdCByZWNvcmQgPSByZWNvcmRzLmdldCh0b2tlbik7XG4gICAgICBpZiAocmVjb3JkICYmIHJlY29yZC5mbiA9PSBNVUxUSV9QUk9WSURFUl9GTikge1xuICAgICAgICB0aHJvdyBtdWx0aVByb3ZpZGVyTWl4RXJyb3IodG9rZW4pO1xuICAgICAgfVxuICAgICAgcmVjb3Jkcy5zZXQodG9rZW4sIHJlc29sdmVkUHJvdmlkZXIpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBzdGF0aWNFcnJvcignVW5leHBlY3RlZCBwcm92aWRlcicsIHByb3ZpZGVyKTtcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gdHJ5UmVzb2x2ZVRva2VuKFxuICAgIHRva2VuOiBhbnksIHJlY29yZDogUmVjb3JkIHwgdW5kZWZpbmVkLCByZWNvcmRzOiBNYXA8YW55LCBSZWNvcmQ+LCBwYXJlbnQ6IEluamVjdG9yLFxuICAgIG5vdEZvdW5kVmFsdWU6IGFueSwgZmxhZ3M6IEluamVjdEZsYWdzKTogYW55IHtcbiAgdHJ5IHtcbiAgICByZXR1cm4gcmVzb2x2ZVRva2VuKHRva2VuLCByZWNvcmQsIHJlY29yZHMsIHBhcmVudCwgbm90Rm91bmRWYWx1ZSwgZmxhZ3MpO1xuICB9IGNhdGNoIChlKSB7XG4gICAgLy8gZW5zdXJlIHRoYXQgJ2UnIGlzIG9mIHR5cGUgRXJyb3IuXG4gICAgaWYgKCEoZSBpbnN0YW5jZW9mIEVycm9yKSkge1xuICAgICAgZSA9IG5ldyBFcnJvcihlKTtcbiAgICB9XG4gICAgY29uc3QgcGF0aDogYW55W10gPSBlW05HX1RFTVBfVE9LRU5fUEFUSF0gPSBlW05HX1RFTVBfVE9LRU5fUEFUSF0gfHwgW107XG4gICAgcGF0aC51bnNoaWZ0KHRva2VuKTtcbiAgICBpZiAocmVjb3JkICYmIHJlY29yZC52YWx1ZSA9PSBDSVJDVUxBUikge1xuICAgICAgLy8gUmVzZXQgdGhlIENpcmN1bGFyIGZsYWcuXG4gICAgICByZWNvcmQudmFsdWUgPSBFTVBUWTtcbiAgICB9XG4gICAgdGhyb3cgZTtcbiAgfVxufVxuXG5mdW5jdGlvbiByZXNvbHZlVG9rZW4oXG4gICAgdG9rZW46IGFueSwgcmVjb3JkOiBSZWNvcmQgfCB1bmRlZmluZWQsIHJlY29yZHM6IE1hcDxhbnksIFJlY29yZD4sIHBhcmVudDogSW5qZWN0b3IsXG4gICAgbm90Rm91bmRWYWx1ZTogYW55LCBmbGFnczogSW5qZWN0RmxhZ3MpOiBhbnkge1xuICBsZXQgdmFsdWU7XG4gIGlmIChyZWNvcmQgJiYgIShmbGFncyAmIEluamVjdEZsYWdzLlNraXBTZWxmKSkge1xuICAgIC8vIElmIHdlIGRvbid0IGhhdmUgYSByZWNvcmQsIHRoaXMgaW1wbGllcyB0aGF0IHdlIGRvbid0IG93biB0aGUgcHJvdmlkZXIgaGVuY2UgZG9uJ3Qga25vdyBob3dcbiAgICAvLyB0byByZXNvbHZlIGl0LlxuICAgIHZhbHVlID0gcmVjb3JkLnZhbHVlO1xuICAgIGlmICh2YWx1ZSA9PSBDSVJDVUxBUikge1xuICAgICAgdGhyb3cgRXJyb3IoTk9fTkVXX0xJTkUgKyAnQ2lyY3VsYXIgZGVwZW5kZW5jeScpO1xuICAgIH0gZWxzZSBpZiAodmFsdWUgPT09IEVNUFRZKSB7XG4gICAgICByZWNvcmQudmFsdWUgPSBDSVJDVUxBUjtcbiAgICAgIGxldCBvYmogPSB1bmRlZmluZWQ7XG4gICAgICBsZXQgdXNlTmV3ID0gcmVjb3JkLnVzZU5ldztcbiAgICAgIGxldCBmbiA9IHJlY29yZC5mbjtcbiAgICAgIGxldCBkZXBSZWNvcmRzID0gcmVjb3JkLmRlcHM7XG4gICAgICBsZXQgZGVwcyA9IEVNUFRZO1xuICAgICAgaWYgKGRlcFJlY29yZHMubGVuZ3RoKSB7XG4gICAgICAgIGRlcHMgPSBbXTtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBkZXBSZWNvcmRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgY29uc3QgZGVwUmVjb3JkOiBEZXBlbmRlbmN5UmVjb3JkID0gZGVwUmVjb3Jkc1tpXTtcbiAgICAgICAgICBjb25zdCBvcHRpb25zID0gZGVwUmVjb3JkLm9wdGlvbnM7XG4gICAgICAgICAgY29uc3QgY2hpbGRSZWNvcmQgPVxuICAgICAgICAgICAgICBvcHRpb25zICYgT3B0aW9uRmxhZ3MuQ2hlY2tTZWxmID8gcmVjb3Jkcy5nZXQoZGVwUmVjb3JkLnRva2VuKSA6IHVuZGVmaW5lZDtcbiAgICAgICAgICBkZXBzLnB1c2godHJ5UmVzb2x2ZVRva2VuKFxuICAgICAgICAgICAgICAvLyBDdXJyZW50IFRva2VuIHRvIHJlc29sdmVcbiAgICAgICAgICAgICAgZGVwUmVjb3JkLnRva2VuLFxuICAgICAgICAgICAgICAvLyBBIHJlY29yZCB3aGljaCBkZXNjcmliZXMgaG93IHRvIHJlc29sdmUgdGhlIHRva2VuLlxuICAgICAgICAgICAgICAvLyBJZiB1bmRlZmluZWQsIHRoaXMgbWVhbnMgd2UgZG9uJ3QgaGF2ZSBzdWNoIGEgcmVjb3JkXG4gICAgICAgICAgICAgIGNoaWxkUmVjb3JkLFxuICAgICAgICAgICAgICAvLyBPdGhlciByZWNvcmRzIHdlIGtub3cgYWJvdXQuXG4gICAgICAgICAgICAgIHJlY29yZHMsXG4gICAgICAgICAgICAgIC8vIElmIHdlIGRvbid0IGtub3cgaG93IHRvIHJlc29sdmUgZGVwZW5kZW5jeSBhbmQgd2Ugc2hvdWxkIG5vdCBjaGVjayBwYXJlbnQgZm9yIGl0LFxuICAgICAgICAgICAgICAvLyB0aGFuIHBhc3MgaW4gTnVsbCBpbmplY3Rvci5cbiAgICAgICAgICAgICAgIWNoaWxkUmVjb3JkICYmICEob3B0aW9ucyAmIE9wdGlvbkZsYWdzLkNoZWNrUGFyZW50KSA/IE5VTExfSU5KRUNUT1IgOiBwYXJlbnQsXG4gICAgICAgICAgICAgIG9wdGlvbnMgJiBPcHRpb25GbGFncy5PcHRpb25hbCA/IG51bGwgOiBJbmplY3Rvci5USFJPV19JRl9OT1RfRk9VTkQsXG4gICAgICAgICAgICAgIEluamVjdEZsYWdzLkRlZmF1bHQpKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmVjb3JkLnZhbHVlID0gdmFsdWUgPSB1c2VOZXcgPyBuZXcgKGZuIGFzIGFueSkoLi4uZGVwcykgOiBmbi5hcHBseShvYmosIGRlcHMpO1xuICAgIH1cbiAgfSBlbHNlIGlmICghKGZsYWdzICYgSW5qZWN0RmxhZ3MuU2VsZikpIHtcbiAgICB2YWx1ZSA9IHBhcmVudC5nZXQodG9rZW4sIG5vdEZvdW5kVmFsdWUsIEluamVjdEZsYWdzLkRlZmF1bHQpO1xuICB9XG4gIHJldHVybiB2YWx1ZTtcbn1cblxuXG5mdW5jdGlvbiBjb21wdXRlRGVwcyhwcm92aWRlcjogU3RhdGljUHJvdmlkZXIpOiBEZXBlbmRlbmN5UmVjb3JkW10ge1xuICBsZXQgZGVwczogRGVwZW5kZW5jeVJlY29yZFtdID0gRU1QVFk7XG4gIGNvbnN0IHByb3ZpZGVyRGVwczogYW55W10gPVxuICAgICAgKHByb3ZpZGVyIGFzIEV4aXN0aW5nUHJvdmlkZXIgJiBTdGF0aWNDbGFzc1Byb3ZpZGVyICYgQ29uc3RydWN0b3JQcm92aWRlcikuZGVwcztcbiAgaWYgKHByb3ZpZGVyRGVwcyAmJiBwcm92aWRlckRlcHMubGVuZ3RoKSB7XG4gICAgZGVwcyA9IFtdO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcHJvdmlkZXJEZXBzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBsZXQgb3B0aW9ucyA9IE9wdGlvbkZsYWdzLkRlZmF1bHQ7XG4gICAgICBsZXQgdG9rZW4gPSByZXNvbHZlRm9yd2FyZFJlZihwcm92aWRlckRlcHNbaV0pO1xuICAgICAgaWYgKHRva2VuIGluc3RhbmNlb2YgQXJyYXkpIHtcbiAgICAgICAgZm9yIChsZXQgaiA9IDAsIGFubm90YXRpb25zID0gdG9rZW47IGogPCBhbm5vdGF0aW9ucy5sZW5ndGg7IGorKykge1xuICAgICAgICAgIGNvbnN0IGFubm90YXRpb24gPSBhbm5vdGF0aW9uc1tqXTtcbiAgICAgICAgICBpZiAoYW5ub3RhdGlvbiBpbnN0YW5jZW9mIE9wdGlvbmFsIHx8IGFubm90YXRpb24gPT0gT3B0aW9uYWwpIHtcbiAgICAgICAgICAgIG9wdGlvbnMgPSBvcHRpb25zIHwgT3B0aW9uRmxhZ3MuT3B0aW9uYWw7XG4gICAgICAgICAgfSBlbHNlIGlmIChhbm5vdGF0aW9uIGluc3RhbmNlb2YgU2tpcFNlbGYgfHwgYW5ub3RhdGlvbiA9PSBTa2lwU2VsZikge1xuICAgICAgICAgICAgb3B0aW9ucyA9IG9wdGlvbnMgJiB+T3B0aW9uRmxhZ3MuQ2hlY2tTZWxmO1xuICAgICAgICAgIH0gZWxzZSBpZiAoYW5ub3RhdGlvbiBpbnN0YW5jZW9mIFNlbGYgfHwgYW5ub3RhdGlvbiA9PSBTZWxmKSB7XG4gICAgICAgICAgICBvcHRpb25zID0gb3B0aW9ucyAmIH5PcHRpb25GbGFncy5DaGVja1BhcmVudDtcbiAgICAgICAgICB9IGVsc2UgaWYgKGFubm90YXRpb24gaW5zdGFuY2VvZiBJbmplY3QpIHtcbiAgICAgICAgICAgIHRva2VuID0gKGFubm90YXRpb24gYXMgSW5qZWN0KS50b2tlbjtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdG9rZW4gPSByZXNvbHZlRm9yd2FyZFJlZihhbm5vdGF0aW9uKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGRlcHMucHVzaCh7dG9rZW4sIG9wdGlvbnN9KTtcbiAgICB9XG4gIH0gZWxzZSBpZiAoKHByb3ZpZGVyIGFzIEV4aXN0aW5nUHJvdmlkZXIpLnVzZUV4aXN0aW5nKSB7XG4gICAgY29uc3QgdG9rZW4gPSByZXNvbHZlRm9yd2FyZFJlZigocHJvdmlkZXIgYXMgRXhpc3RpbmdQcm92aWRlcikudXNlRXhpc3RpbmcpO1xuICAgIGRlcHMgPSBbe3Rva2VuLCBvcHRpb25zOiBPcHRpb25GbGFncy5EZWZhdWx0fV07XG4gIH0gZWxzZSBpZiAoIXByb3ZpZGVyRGVwcyAmJiAhKFVTRV9WQUxVRSBpbiBwcm92aWRlcikpIHtcbiAgICAvLyB1c2VWYWx1ZSAmIHVzZUV4aXN0aW5nIGFyZSB0aGUgb25seSBvbmVzIHdoaWNoIGFyZSBleGVtcHQgZnJvbSBkZXBzIGFsbCBvdGhlcnMgbmVlZCBpdC5cbiAgICB0aHJvdyBzdGF0aWNFcnJvcignXFwnZGVwc1xcJyByZXF1aXJlZCcsIHByb3ZpZGVyKTtcbiAgfVxuICByZXR1cm4gZGVwcztcbn1cblxuZnVuY3Rpb24gZm9ybWF0RXJyb3IodGV4dDogc3RyaW5nLCBvYmo6IGFueSwgc291cmNlOiBzdHJpbmcgfCBudWxsID0gbnVsbCk6IHN0cmluZyB7XG4gIHRleHQgPSB0ZXh0ICYmIHRleHQuY2hhckF0KDApID09PSAnXFxuJyAmJiB0ZXh0LmNoYXJBdCgxKSA9PSBOT19ORVdfTElORSA/IHRleHQuc3Vic3RyKDIpIDogdGV4dDtcbiAgbGV0IGNvbnRleHQgPSBzdHJpbmdpZnkob2JqKTtcbiAgaWYgKG9iaiBpbnN0YW5jZW9mIEFycmF5KSB7XG4gICAgY29udGV4dCA9IG9iai5tYXAoc3RyaW5naWZ5KS5qb2luKCcgLT4gJyk7XG4gIH0gZWxzZSBpZiAodHlwZW9mIG9iaiA9PT0gJ29iamVjdCcpIHtcbiAgICBsZXQgcGFydHMgPSA8c3RyaW5nW10+W107XG4gICAgZm9yIChsZXQga2V5IGluIG9iaikge1xuICAgICAgaWYgKG9iai5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgIGxldCB2YWx1ZSA9IG9ialtrZXldO1xuICAgICAgICBwYXJ0cy5wdXNoKFxuICAgICAgICAgICAga2V5ICsgJzonICsgKHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycgPyBKU09OLnN0cmluZ2lmeSh2YWx1ZSkgOiBzdHJpbmdpZnkodmFsdWUpKSk7XG4gICAgICB9XG4gICAgfVxuICAgIGNvbnRleHQgPSBgeyR7cGFydHMuam9pbignLCAnKX19YDtcbiAgfVxuICByZXR1cm4gYFN0YXRpY0luamVjdG9yRXJyb3Ike3NvdXJjZSA/ICcoJyArIHNvdXJjZSArICcpJyA6ICcnfVske2NvbnRleHR9XTogJHt0ZXh0LnJlcGxhY2UoTkVXX0xJTkUsICdcXG4gICcpfWA7XG59XG5cbmZ1bmN0aW9uIHN0YXRpY0Vycm9yKHRleHQ6IHN0cmluZywgb2JqOiBhbnkpOiBFcnJvciB7XG4gIHJldHVybiBuZXcgRXJyb3IoZm9ybWF0RXJyb3IodGV4dCwgb2JqKSk7XG59XG5cbi8qKlxuICogSW5qZWN0aW9uIGZsYWdzIGZvciBESS5cbiAqL1xuZXhwb3J0IGNvbnN0IGVudW0gSW5qZWN0RmxhZ3Mge1xuICBEZWZhdWx0ID0gMGIwMDAwLFxuXG4gIC8qKlxuICAgKiBTcGVjaWZpZXMgdGhhdCBhbiBpbmplY3RvciBzaG91bGQgcmV0cmlldmUgYSBkZXBlbmRlbmN5IGZyb20gYW55IGluamVjdG9yIHVudGlsIHJlYWNoaW5nIHRoZVxuICAgKiBob3N0IGVsZW1lbnQgb2YgdGhlIGN1cnJlbnQgY29tcG9uZW50LiAoT25seSB1c2VkIHdpdGggRWxlbWVudCBJbmplY3RvcilcbiAgICovXG4gIEhvc3QgPSAwYjAwMDEsXG4gIC8qKiBEb24ndCBkZXNjZW5kIGludG8gYW5jZXN0b3JzIG9mIHRoZSBub2RlIHJlcXVlc3RpbmcgaW5qZWN0aW9uLiAqL1xuICBTZWxmID0gMGIwMDEwLFxuICAvKiogU2tpcCB0aGUgbm9kZSB0aGF0IGlzIHJlcXVlc3RpbmcgaW5qZWN0aW9uLiAqL1xuICBTa2lwU2VsZiA9IDBiMDEwMCxcbiAgLyoqIEluamVjdCBgZGVmYXVsdFZhbHVlYCBpbnN0ZWFkIGlmIHRva2VuIG5vdCBmb3VuZC4gKi9cbiAgT3B0aW9uYWwgPSAwYjEwMDAsXG59XG5cbi8qKlxuICogQ3VycmVudCBpbmplY3RvciB2YWx1ZSB1c2VkIGJ5IGBpbmplY3RgLlxuICogLSBgdW5kZWZpbmVkYDogaXQgaXMgYW4gZXJyb3IgdG8gY2FsbCBgaW5qZWN0YFxuICogLSBgbnVsbGA6IGBpbmplY3RgIGNhbiBiZSBjYWxsZWQgYnV0IHRoZXJlIGlzIG5vIGluamVjdG9yIChsaW1wLW1vZGUpLlxuICogLSBJbmplY3RvciBpbnN0YW5jZTogVXNlIHRoZSBpbmplY3RvciBmb3IgcmVzb2x1dGlvbi5cbiAqL1xubGV0IF9jdXJyZW50SW5qZWN0b3I6IEluamVjdG9yfHVuZGVmaW5lZHxudWxsID0gdW5kZWZpbmVkO1xuXG5leHBvcnQgZnVuY3Rpb24gc2V0Q3VycmVudEluamVjdG9yKGluamVjdG9yOiBJbmplY3RvciB8IG51bGwgfCB1bmRlZmluZWQpOiBJbmplY3Rvcnx1bmRlZmluZWR8bnVsbCB7XG4gIGNvbnN0IGZvcm1lciA9IF9jdXJyZW50SW5qZWN0b3I7XG4gIF9jdXJyZW50SW5qZWN0b3IgPSBpbmplY3RvcjtcbiAgcmV0dXJuIGZvcm1lcjtcbn1cblxuLyoqXG4gKiBJbmplY3RzIGEgdG9rZW4gZnJvbSB0aGUgY3VycmVudGx5IGFjdGl2ZSBpbmplY3Rvci5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIG11c3QgYmUgdXNlZCBpbiB0aGUgY29udGV4dCBvZiBhIGZhY3RvcnkgZnVuY3Rpb24gc3VjaCBhcyBvbmUgZGVmaW5lZCBmb3IgYW5cbiAqIGBJbmplY3Rpb25Ub2tlbmAsIGFuZCB3aWxsIHRocm93IGFuIGVycm9yIGlmIG5vdCBjYWxsZWQgZnJvbSBzdWNoIGEgY29udGV4dC5cbiAqXG4gKiBAdXNhZ2VOb3Rlc1xuICogIyMjIEV4YW1wbGVcbiAqXG4gKiB7QGV4YW1wbGUgY29yZS9kaS90cy9pbmplY3Rvcl9zcGVjLnRzIHJlZ2lvbj0nU2hha2VhYmxlSW5qZWN0aW9uVG9rZW4nfVxuICpcbiAqIFdpdGhpbiBzdWNoIGEgZmFjdG9yeSBmdW5jdGlvbiBgaW5qZWN0YCBpcyB1dGlsaXplZCB0byByZXF1ZXN0IGluamVjdGlvbiBvZiBhIGRlcGVuZGVuY3ksIGluc3RlYWRcbiAqIG9mIHByb3ZpZGluZyBhbiBhZGRpdGlvbmFsIGFycmF5IG9mIGRlcGVuZGVuY2llcyBhcyB3YXMgY29tbW9uIHRvIGRvIHdpdGggYHVzZUZhY3RvcnlgIHByb3ZpZGVycy5cbiAqIGBpbmplY3RgIGlzIGZhc3RlciBhbmQgbW9yZSB0eXBlLXNhZmUuXG4gKlxuICogQGV4cGVyaW1lbnRhbFxuICovXG5leHBvcnQgZnVuY3Rpb24gaW5qZWN0PFQ+KHRva2VuOiBUeXBlPFQ+fCBJbmplY3Rpb25Ub2tlbjxUPik6IFQ7XG5leHBvcnQgZnVuY3Rpb24gaW5qZWN0PFQ+KHRva2VuOiBUeXBlPFQ+fCBJbmplY3Rpb25Ub2tlbjxUPiwgZmxhZ3M/OiBJbmplY3RGbGFncyk6IFR8bnVsbDtcbmV4cG9ydCBmdW5jdGlvbiBpbmplY3Q8VD4odG9rZW46IFR5cGU8VD58IEluamVjdGlvblRva2VuPFQ+LCBmbGFncyA9IEluamVjdEZsYWdzLkRlZmF1bHQpOiBUfG51bGwge1xuICBpZiAoX2N1cnJlbnRJbmplY3RvciA9PT0gdW5kZWZpbmVkKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBpbmplY3QoKSBtdXN0IGJlIGNhbGxlZCBmcm9tIGFuIGluamVjdGlvbiBjb250ZXh0YCk7XG4gIH0gZWxzZSBpZiAoX2N1cnJlbnRJbmplY3RvciA9PT0gbnVsbCkge1xuICAgIGNvbnN0IGluamVjdGFibGVEZWY6IEluamVjdGFibGVEZWY8VD58bnVsbCA9IGdldEluamVjdGFibGVEZWYodG9rZW4pO1xuICAgIGlmIChpbmplY3RhYmxlRGVmICYmIGluamVjdGFibGVEZWYucHJvdmlkZWRJbiA9PSAncm9vdCcpIHtcbiAgICAgIHJldHVybiBpbmplY3RhYmxlRGVmLnZhbHVlID09PSB1bmRlZmluZWQgPyBpbmplY3RhYmxlRGVmLnZhbHVlID0gaW5qZWN0YWJsZURlZi5mYWN0b3J5KCkgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluamVjdGFibGVEZWYudmFsdWU7XG4gICAgfVxuICAgIGlmIChmbGFncyAmIEluamVjdEZsYWdzLk9wdGlvbmFsKSByZXR1cm4gbnVsbDtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYEluamVjdG9yOiBOT1RfRk9VTkQgWyR7c3RyaW5naWZ5KHRva2VuKX1dYCk7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIF9jdXJyZW50SW5qZWN0b3IuZ2V0KHRva2VuLCBmbGFncyAmIEluamVjdEZsYWdzLk9wdGlvbmFsID8gbnVsbCA6IHVuZGVmaW5lZCwgZmxhZ3MpO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpbmplY3RBcmdzKHR5cGVzOiAoVHlwZTxhbnk+fCBJbmplY3Rpb25Ub2tlbjxhbnk+fCBhbnlbXSlbXSk6IGFueVtdIHtcbiAgY29uc3QgYXJnczogYW55W10gPSBbXTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCB0eXBlcy5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IGFyZyA9IHR5cGVzW2ldO1xuICAgIGlmIChBcnJheS5pc0FycmF5KGFyZykpIHtcbiAgICAgIGlmIChhcmcubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignQXJndW1lbnRzIGFycmF5IG11c3QgaGF2ZSBhcmd1bWVudHMuJyk7XG4gICAgICB9XG4gICAgICBsZXQgdHlwZTogVHlwZTxhbnk+fHVuZGVmaW5lZCA9IHVuZGVmaW5lZDtcbiAgICAgIGxldCBmbGFnczogSW5qZWN0RmxhZ3MgPSBJbmplY3RGbGFncy5EZWZhdWx0O1xuXG4gICAgICBmb3IgKGxldCBqID0gMDsgaiA8IGFyZy5sZW5ndGg7IGorKykge1xuICAgICAgICBjb25zdCBtZXRhID0gYXJnW2pdO1xuICAgICAgICBpZiAobWV0YSBpbnN0YW5jZW9mIE9wdGlvbmFsIHx8IG1ldGEubmdNZXRhZGF0YU5hbWUgPT09ICdPcHRpb25hbCcpIHtcbiAgICAgICAgICBmbGFncyB8PSBJbmplY3RGbGFncy5PcHRpb25hbDtcbiAgICAgICAgfSBlbHNlIGlmIChtZXRhIGluc3RhbmNlb2YgU2tpcFNlbGYgfHwgbWV0YS5uZ01ldGFkYXRhTmFtZSA9PT0gJ1NraXBTZWxmJykge1xuICAgICAgICAgIGZsYWdzIHw9IEluamVjdEZsYWdzLlNraXBTZWxmO1xuICAgICAgICB9IGVsc2UgaWYgKG1ldGEgaW5zdGFuY2VvZiBTZWxmIHx8IG1ldGEubmdNZXRhZGF0YU5hbWUgPT09ICdTZWxmJykge1xuICAgICAgICAgIGZsYWdzIHw9IEluamVjdEZsYWdzLlNlbGY7XG4gICAgICAgIH0gZWxzZSBpZiAobWV0YSBpbnN0YW5jZW9mIEluamVjdCkge1xuICAgICAgICAgIHR5cGUgPSBtZXRhLnRva2VuO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHR5cGUgPSBtZXRhO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGFyZ3MucHVzaChpbmplY3QodHlwZSAhLCBmbGFncykpO1xuICAgIH0gZWxzZSB7XG4gICAgICBhcmdzLnB1c2goaW5qZWN0KGFyZykpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gYXJncztcbn1cbiJdfQ==