/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as tslib_1 from "tslib";
import { stringify } from '../util';
import { defineInjectable } from './defs';
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
var EMPTY = [];
var CIRCULAR = IDENT;
var MULTI_PROVIDER_FN = function () {
    return Array.prototype.slice.call(arguments);
};
var GET_PROPERTY_NAME = {};
export var USE_VALUE = getClosureSafeProperty({ provide: String, useValue: GET_PROPERTY_NAME });
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
    var _a;
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
function getClosureSafeProperty(objWithPropertyToExtract) {
    for (var key in objWithPropertyToExtract) {
        if (objWithPropertyToExtract[key] === GET_PROPERTY_NAME) {
            return key;
        }
    }
    throw Error('!prop');
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
        var injectableDef = token.ngInjectableDef;
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5qZWN0b3IuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9kaS9pbmplY3Rvci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7O0FBR0gsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLFNBQVMsQ0FBQztBQUVsQyxPQUFPLEVBQWdCLGdCQUFnQixFQUFDLE1BQU0sUUFBUSxDQUFDO0FBQ3ZELE9BQU8sRUFBQyxpQkFBaUIsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUNoRCxPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDakQsT0FBTyxFQUFDLE1BQU0sRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBQyxNQUFNLFlBQVksQ0FBQztBQUc1RCxNQUFNLENBQUMsSUFBTSxNQUFNLEdBQUcsVUFBVSxDQUFDO0FBQ2pDLElBQU0sbUJBQW1CLEdBQUcsSUFBSSxNQUFNLEVBQUUsQ0FBQztBQUN6QyxNQUFNLENBQUMsSUFBTSxrQkFBa0IsR0FBRyxtQkFBbUIsQ0FBQztBQUV0RDs7Ozs7OztHQU9HO0FBQ0gsTUFBTSxDQUFDLElBQU0sUUFBUSxHQUFHLElBQUksY0FBYyxDQUFXLFVBQVUsQ0FBQyxDQUFDO0FBRWpFO0lBQUE7SUFXQSxDQUFDO0lBVkMsMEJBQUcsR0FBSCxVQUFJLEtBQVUsRUFBRSxhQUF3QztRQUF4Qyw4QkFBQSxFQUFBLG1DQUF3QztRQUN0RCxJQUFJLGFBQWEsS0FBSyxtQkFBbUIsRUFBRTtZQUN6QywwRkFBMEY7WUFDMUYsd0VBQXdFO1lBQ3hFLDRFQUE0RTtZQUM1RSwwQkFBMEI7WUFDMUIsTUFBTSxJQUFJLEtBQUssQ0FBQyx3Q0FBc0MsU0FBUyxDQUFDLEtBQUssQ0FBQyxNQUFHLENBQUMsQ0FBQztTQUM1RTtRQUNELE9BQU8sYUFBYSxDQUFDO0lBQ3ZCLENBQUM7SUFDSCxtQkFBQztBQUFE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SSxJQUFJLEdBQXdCLFNBQVMsQ0FBQztZQUMxQyxJQUFJLEtBQUssa0JBQW1DLENBQUM7WUFFN0MsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7Z0JBQ25DLElBQU0sSUFBSSxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDcEIsSUFBSSxJQUFJLFlBQVksUUFBUSxJQUFJLElBQUksQ0FBQyxjQUFjLEtBQUssVUFBVSxFQUFFO29CQUNsRSxLQUFLLG9CQUF3QixDQUFDO2lCQUMvQjtxQkFBTSxJQUFJLElBQUksWUFBWSxRQUFRLElBQUksSUFBSSxDQUFDLGNBQWMsS0FBSyxVQUFVLEVBQUU7b0JBQ3pFLEtBQUssb0JBQXdCLENBQUM7aUJBQy9CO3FCQUFNLElBQUksSUFBSSxZQUFZLElBQUksSUFBSSxJQUFJLENBQUMsY0FBYyxLQUFLLE1BQU0sRUFBRTtvQkFDakUsS0FBSyxnQkFBb0IsQ0FBQztpQkFDM0I7cUJBQU0sSUFBSSxJQUFJLFlBQVksTUFBTSxFQUFFO29CQUNqQyxJQUFJLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQztpQkFDbkI7cUJBQU07b0JBQ0wsSUFBSSxHQUFHLElBQUksQ0FBQztpQkFDYjthQUNGO1lBRUQsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBTSxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUM7U0FDbEM7YUFBTTtZQUNMLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7U0FDeEI7S0FDRjtJQUNELE9BQU8sSUFBSSxDQUFDO0FBQ2QsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtUeXBlfSBmcm9tICcuLi90eXBlJztcbmltcG9ydCB7c3RyaW5naWZ5fSBmcm9tICcuLi91dGlsJztcblxuaW1wb3J0IHtJbmplY3RhYmxlRGVmLCBkZWZpbmVJbmplY3RhYmxlfSBmcm9tICcuL2RlZnMnO1xuaW1wb3J0IHtyZXNvbHZlRm9yd2FyZFJlZn0gZnJvbSAnLi9mb3J3YXJkX3JlZic7XG5pbXBvcnQge0luamVjdGlvblRva2VufSBmcm9tICcuL2luamVjdGlvbl90b2tlbic7XG5pbXBvcnQge0luamVjdCwgT3B0aW9uYWwsIFNlbGYsIFNraXBTZWxmfSBmcm9tICcuL21ldGFkYXRhJztcbmltcG9ydCB7Q29uc3RydWN0b3JQcm92aWRlciwgRXhpc3RpbmdQcm92aWRlciwgRmFjdG9yeVByb3ZpZGVyLCBTdGF0aWNDbGFzc1Byb3ZpZGVyLCBTdGF0aWNQcm92aWRlciwgVmFsdWVQcm92aWRlcn0gZnJvbSAnLi9wcm92aWRlcic7XG5cbmV4cG9ydCBjb25zdCBTT1VSQ0UgPSAnX19zb3VyY2UnO1xuY29uc3QgX1RIUk9XX0lGX05PVF9GT1VORCA9IG5ldyBPYmplY3QoKTtcbmV4cG9ydCBjb25zdCBUSFJPV19JRl9OT1RfRk9VTkQgPSBfVEhST1dfSUZfTk9UX0ZPVU5EO1xuXG4vKipcbiAqIEFuIEluamVjdGlvblRva2VuIHRoYXQgZ2V0cyB0aGUgY3VycmVudCBgSW5qZWN0b3JgIGZvciBgY3JlYXRlSW5qZWN0b3IoKWAtc3R5bGUgaW5qZWN0b3JzLlxuICpcbiAqIFJlcXVlc3RpbmcgdGhpcyB0b2tlbiBpbnN0ZWFkIG9mIGBJbmplY3RvcmAgYWxsb3dzIGBTdGF0aWNJbmplY3RvcmAgdG8gYmUgdHJlZS1zaGFrZW4gZnJvbSBhXG4gKiBwcm9qZWN0LlxuICpcbiAqIEBleHBlcmltZW50YWxcbiAqL1xuZXhwb3J0IGNvbnN0IElOSkVDVE9SID0gbmV3IEluamVjdGlvblRva2VuPEluamVjdG9yPignSU5KRUNUT1InKTtcblxuZXhwb3J0IGNsYXNzIE51bGxJbmplY3RvciBpbXBsZW1lbnRzIEluamVjdG9yIHtcbiAgZ2V0KHRva2VuOiBhbnksIG5vdEZvdW5kVmFsdWU6IGFueSA9IF9USFJPV19JRl9OT1RfRk9VTkQpOiBhbnkge1xuICAgIGlmIChub3RGb3VuZFZhbHVlID09PSBfVEhST1dfSUZfTk9UX0ZPVU5EKSB7XG4gICAgICAvLyBJbnRlbnRpb25hbGx5IGxlZnQgYmVoaW5kOiBXaXRoIGRldiB0b29scyBvcGVuIHRoZSBkZWJ1Z2dlciB3aWxsIHN0b3AgaGVyZS4gVGhlcmUgaXMgbm9cbiAgICAgIC8vIHJlYXNvbiB3aHkgY29ycmVjdGx5IHdyaXR0ZW4gYXBwbGljYXRpb24gc2hvdWxkIGNhdXNlIHRoaXMgZXhjZXB0aW9uLlxuICAgICAgLy8gVE9ETyhtaXNrbyk6IHVuY29tbWVudCB0aGUgbmV4dCBsaW5lIG9uY2UgYG5nRGV2TW9kZWAgd29ya3Mgd2l0aCBjbG9zdXJlLlxuICAgICAgLy8gaWYobmdEZXZNb2RlKSBkZWJ1Z2dlcjtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgTnVsbEluamVjdG9yRXJyb3I6IE5vIHByb3ZpZGVyIGZvciAke3N0cmluZ2lmeSh0b2tlbil9IWApO1xuICAgIH1cbiAgICByZXR1cm4gbm90Rm91bmRWYWx1ZTtcbiAgfVxufVxuXG4vKipcbiAqIENvbmNyZXRlIGluamVjdG9ycyBpbXBsZW1lbnQgdGhpcyBpbnRlcmZhY2UuXG4gKlxuICogRm9yIG1vcmUgZGV0YWlscywgc2VlIHRoZSBbXCJEZXBlbmRlbmN5IEluamVjdGlvbiBHdWlkZVwiXShndWlkZS9kZXBlbmRlbmN5LWluamVjdGlvbikuXG4gKlxuICogQHVzYWdlTm90ZXNcbiAqICMjIyBFeGFtcGxlXG4gKlxuICoge0BleGFtcGxlIGNvcmUvZGkvdHMvaW5qZWN0b3Jfc3BlYy50cyByZWdpb249J0luamVjdG9yJ31cbiAqXG4gKiBgSW5qZWN0b3JgIHJldHVybnMgaXRzZWxmIHdoZW4gZ2l2ZW4gYEluamVjdG9yYCBhcyBhIHRva2VuOlxuICpcbiAqIHtAZXhhbXBsZSBjb3JlL2RpL3RzL2luamVjdG9yX3NwZWMudHMgcmVnaW9uPSdpbmplY3RJbmplY3Rvcid9XG4gKlxuICpcbiAqL1xuZXhwb3J0IGFic3RyYWN0IGNsYXNzIEluamVjdG9yIHtcbiAgc3RhdGljIFRIUk9XX0lGX05PVF9GT1VORCA9IF9USFJPV19JRl9OT1RfRk9VTkQ7XG4gIHN0YXRpYyBOVUxMOiBJbmplY3RvciA9IG5ldyBOdWxsSW5qZWN0b3IoKTtcblxuICAvKipcbiAgICogUmV0cmlldmVzIGFuIGluc3RhbmNlIGZyb20gdGhlIGluamVjdG9yIGJhc2VkIG9uIHRoZSBwcm92aWRlZCB0b2tlbi5cbiAgICogSWYgbm90IGZvdW5kOlxuICAgKiAtIFRocm93cyBhbiBlcnJvciBpZiBubyBgbm90Rm91bmRWYWx1ZWAgdGhhdCBpcyBub3QgZXF1YWwgdG9cbiAgICogSW5qZWN0b3IuVEhST1dfSUZfTk9UX0ZPVU5EIGlzIGdpdmVuXG4gICAqIC0gUmV0dXJucyB0aGUgYG5vdEZvdW5kVmFsdWVgIG90aGVyd2lzZVxuICAgKi9cbiAgYWJzdHJhY3QgZ2V0PFQ+KHRva2VuOiBUeXBlPFQ+fEluamVjdGlvblRva2VuPFQ+LCBub3RGb3VuZFZhbHVlPzogVCwgZmxhZ3M/OiBJbmplY3RGbGFncyk6IFQ7XG4gIC8qKlxuICAgKiBAZGVwcmVjYXRlZCBmcm9tIHY0LjAuMCB1c2UgVHlwZTxUPiBvciBJbmplY3Rpb25Ub2tlbjxUPlxuICAgKiBAc3VwcHJlc3Mge2R1cGxpY2F0ZX1cbiAgICovXG4gIGFic3RyYWN0IGdldCh0b2tlbjogYW55LCBub3RGb3VuZFZhbHVlPzogYW55KTogYW55O1xuXG4gIC8qKlxuICAgKiBAZGVwcmVjYXRlZCBmcm9tIHY1IHVzZSB0aGUgbmV3IHNpZ25hdHVyZSBJbmplY3Rvci5jcmVhdGUob3B0aW9ucylcbiAgICovXG4gIHN0YXRpYyBjcmVhdGUocHJvdmlkZXJzOiBTdGF0aWNQcm92aWRlcltdLCBwYXJlbnQ/OiBJbmplY3Rvcik6IEluamVjdG9yO1xuXG4gIHN0YXRpYyBjcmVhdGUob3B0aW9uczoge3Byb3ZpZGVyczogU3RhdGljUHJvdmlkZXJbXSwgcGFyZW50PzogSW5qZWN0b3IsIG5hbWU/OiBzdHJpbmd9KTogSW5qZWN0b3I7XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBhIG5ldyBJbmplY3RvciB3aGljaCBpcyBjb25maWd1cmUgdXNpbmcgYFN0YXRpY1Byb3ZpZGVyYHMuXG4gICAqXG4gICAqIEB1c2FnZU5vdGVzXG4gICAqICMjIyBFeGFtcGxlXG4gICAqXG4gICAqIHtAZXhhbXBsZSBjb3JlL2RpL3RzL3Byb3ZpZGVyX3NwZWMudHMgcmVnaW9uPSdDb25zdHJ1Y3RvclByb3ZpZGVyJ31cbiAgICovXG4gIHN0YXRpYyBjcmVhdGUoXG4gICAgICBvcHRpb25zOiBTdGF0aWNQcm92aWRlcltdfHtwcm92aWRlcnM6IFN0YXRpY1Byb3ZpZGVyW10sIHBhcmVudD86IEluamVjdG9yLCBuYW1lPzogc3RyaW5nfSxcbiAgICAgIHBhcmVudD86IEluamVjdG9yKTogSW5qZWN0b3Ige1xuICAgIGlmIChBcnJheS5pc0FycmF5KG9wdGlvbnMpKSB7XG4gICAgICByZXR1cm4gbmV3IFN0YXRpY0luamVjdG9yKG9wdGlvbnMsIHBhcmVudCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBuZXcgU3RhdGljSW5qZWN0b3Iob3B0aW9ucy5wcm92aWRlcnMsIG9wdGlvbnMucGFyZW50LCBvcHRpb25zLm5hbWUgfHwgbnVsbCk7XG4gICAgfVxuICB9XG5cbiAgc3RhdGljIG5nSW5qZWN0YWJsZURlZiA9IGRlZmluZUluamVjdGFibGUoe1xuICAgIHByb3ZpZGVkSW46ICdhbnknIGFzIGFueSxcbiAgICBmYWN0b3J5OiAoKSA9PiBpbmplY3QoSU5KRUNUT1IpLFxuICB9KTtcbn1cblxuXG5cbmNvbnN0IElERU5UID0gZnVuY3Rpb248VD4odmFsdWU6IFQpOiBUIHtcbiAgcmV0dXJuIHZhbHVlO1xufTtcbmNvbnN0IEVNUFRZID0gPGFueVtdPltdO1xuY29uc3QgQ0lSQ1VMQVIgPSBJREVOVDtcbmNvbnN0IE1VTFRJX1BST1ZJREVSX0ZOID0gZnVuY3Rpb24oKTogYW55W10ge1xuICByZXR1cm4gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzKTtcbn07XG5jb25zdCBHRVRfUFJPUEVSVFlfTkFNRSA9IHt9IGFzIGFueTtcbmV4cG9ydCBjb25zdCBVU0VfVkFMVUUgPVxuICAgIGdldENsb3N1cmVTYWZlUHJvcGVydHk8VmFsdWVQcm92aWRlcj4oe3Byb3ZpZGU6IFN0cmluZywgdXNlVmFsdWU6IEdFVF9QUk9QRVJUWV9OQU1FfSk7XG5jb25zdCBOR19UT0tFTl9QQVRIID0gJ25nVG9rZW5QYXRoJztcbmNvbnN0IE5HX1RFTVBfVE9LRU5fUEFUSCA9ICduZ1RlbXBUb2tlblBhdGgnO1xuY29uc3QgZW51bSBPcHRpb25GbGFncyB7XG4gIE9wdGlvbmFsID0gMSA8PCAwLFxuICBDaGVja1NlbGYgPSAxIDw8IDEsXG4gIENoZWNrUGFyZW50ID0gMSA8PCAyLFxuICBEZWZhdWx0ID0gQ2hlY2tTZWxmIHwgQ2hlY2tQYXJlbnRcbn1cbmNvbnN0IE5VTExfSU5KRUNUT1IgPSBJbmplY3Rvci5OVUxMO1xuY29uc3QgTkVXX0xJTkUgPSAvXFxuL2dtO1xuY29uc3QgTk9fTkVXX0xJTkUgPSAnybUnO1xuXG5leHBvcnQgY2xhc3MgU3RhdGljSW5qZWN0b3IgaW1wbGVtZW50cyBJbmplY3RvciB7XG4gIHJlYWRvbmx5IHBhcmVudDogSW5qZWN0b3I7XG4gIHJlYWRvbmx5IHNvdXJjZTogc3RyaW5nfG51bGw7XG5cbiAgcHJpdmF0ZSBfcmVjb3JkczogTWFwPGFueSwgUmVjb3JkPjtcblxuICBjb25zdHJ1Y3RvcihcbiAgICAgIHByb3ZpZGVyczogU3RhdGljUHJvdmlkZXJbXSwgcGFyZW50OiBJbmplY3RvciA9IE5VTExfSU5KRUNUT1IsIHNvdXJjZTogc3RyaW5nfG51bGwgPSBudWxsKSB7XG4gICAgdGhpcy5wYXJlbnQgPSBwYXJlbnQ7XG4gICAgdGhpcy5zb3VyY2UgPSBzb3VyY2U7XG4gICAgY29uc3QgcmVjb3JkcyA9IHRoaXMuX3JlY29yZHMgPSBuZXcgTWFwPGFueSwgUmVjb3JkPigpO1xuICAgIHJlY29yZHMuc2V0KFxuICAgICAgICBJbmplY3RvciwgPFJlY29yZD57dG9rZW46IEluamVjdG9yLCBmbjogSURFTlQsIGRlcHM6IEVNUFRZLCB2YWx1ZTogdGhpcywgdXNlTmV3OiBmYWxzZX0pO1xuICAgIHJlY29yZHMuc2V0KFxuICAgICAgICBJTkpFQ1RPUiwgPFJlY29yZD57dG9rZW46IElOSkVDVE9SLCBmbjogSURFTlQsIGRlcHM6IEVNUFRZLCB2YWx1ZTogdGhpcywgdXNlTmV3OiBmYWxzZX0pO1xuICAgIHJlY3Vyc2l2ZWx5UHJvY2Vzc1Byb3ZpZGVycyhyZWNvcmRzLCBwcm92aWRlcnMpO1xuICB9XG5cbiAgZ2V0PFQ+KHRva2VuOiBUeXBlPFQ+fEluamVjdGlvblRva2VuPFQ+LCBub3RGb3VuZFZhbHVlPzogVCwgZmxhZ3M/OiBJbmplY3RGbGFncyk6IFQ7XG4gIGdldCh0b2tlbjogYW55LCBub3RGb3VuZFZhbHVlPzogYW55KTogYW55O1xuICBnZXQodG9rZW46IGFueSwgbm90Rm91bmRWYWx1ZT86IGFueSwgZmxhZ3M6IEluamVjdEZsYWdzID0gSW5qZWN0RmxhZ3MuRGVmYXVsdCk6IGFueSB7XG4gICAgY29uc3QgcmVjb3JkID0gdGhpcy5fcmVjb3Jkcy5nZXQodG9rZW4pO1xuICAgIHRyeSB7XG4gICAgICByZXR1cm4gdHJ5UmVzb2x2ZVRva2VuKHRva2VuLCByZWNvcmQsIHRoaXMuX3JlY29yZHMsIHRoaXMucGFyZW50LCBub3RGb3VuZFZhbHVlLCBmbGFncyk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgY29uc3QgdG9rZW5QYXRoOiBhbnlbXSA9IGVbTkdfVEVNUF9UT0tFTl9QQVRIXTtcbiAgICAgIGlmICh0b2tlbltTT1VSQ0VdKSB7XG4gICAgICAgIHRva2VuUGF0aC51bnNoaWZ0KHRva2VuW1NPVVJDRV0pO1xuICAgICAgfVxuICAgICAgZS5tZXNzYWdlID0gZm9ybWF0RXJyb3IoJ1xcbicgKyBlLm1lc3NhZ2UsIHRva2VuUGF0aCwgdGhpcy5zb3VyY2UpO1xuICAgICAgZVtOR19UT0tFTl9QQVRIXSA9IHRva2VuUGF0aDtcbiAgICAgIGVbTkdfVEVNUF9UT0tFTl9QQVRIXSA9IG51bGw7XG4gICAgICB0aHJvdyBlO1xuICAgIH1cbiAgfVxuXG4gIHRvU3RyaW5nKCkge1xuICAgIGNvbnN0IHRva2VucyA9IDxzdHJpbmdbXT5bXSwgcmVjb3JkcyA9IHRoaXMuX3JlY29yZHM7XG4gICAgcmVjb3Jkcy5mb3JFYWNoKCh2LCB0b2tlbikgPT4gdG9rZW5zLnB1c2goc3RyaW5naWZ5KHRva2VuKSkpO1xuICAgIHJldHVybiBgU3RhdGljSW5qZWN0b3JbJHt0b2tlbnMuam9pbignLCAnKX1dYDtcbiAgfVxufVxuXG50eXBlIFN1cHBvcnRlZFByb3ZpZGVyID1cbiAgICBWYWx1ZVByb3ZpZGVyIHwgRXhpc3RpbmdQcm92aWRlciB8IFN0YXRpY0NsYXNzUHJvdmlkZXIgfCBDb25zdHJ1Y3RvclByb3ZpZGVyIHwgRmFjdG9yeVByb3ZpZGVyO1xuXG5pbnRlcmZhY2UgUmVjb3JkIHtcbiAgZm46IEZ1bmN0aW9uO1xuICB1c2VOZXc6IGJvb2xlYW47XG4gIGRlcHM6IERlcGVuZGVuY3lSZWNvcmRbXTtcbiAgdmFsdWU6IGFueTtcbn1cblxuaW50ZXJmYWNlIERlcGVuZGVuY3lSZWNvcmQge1xuICB0b2tlbjogYW55O1xuICBvcHRpb25zOiBudW1iZXI7XG59XG5cbnR5cGUgVG9rZW5QYXRoID0gQXJyYXk8YW55PjtcblxuZnVuY3Rpb24gcmVzb2x2ZVByb3ZpZGVyKHByb3ZpZGVyOiBTdXBwb3J0ZWRQcm92aWRlcik6IFJlY29yZCB7XG4gIGNvbnN0IGRlcHMgPSBjb21wdXRlRGVwcyhwcm92aWRlcik7XG4gIGxldCBmbjogRnVuY3Rpb24gPSBJREVOVDtcbiAgbGV0IHZhbHVlOiBhbnkgPSBFTVBUWTtcbiAgbGV0IHVzZU5ldzogYm9vbGVhbiA9IGZhbHNlO1xuICBsZXQgcHJvdmlkZSA9IHJlc29sdmVGb3J3YXJkUmVmKHByb3ZpZGVyLnByb3ZpZGUpO1xuICBpZiAoVVNFX1ZBTFVFIGluIHByb3ZpZGVyKSB7XG4gICAgLy8gV2UgbmVlZCB0byB1c2UgVVNFX1ZBTFVFIGluIHByb3ZpZGVyIHNpbmNlIHByb3ZpZGVyLnVzZVZhbHVlIGNvdWxkIGJlIGRlZmluZWQgYXMgdW5kZWZpbmVkLlxuICAgIHZhbHVlID0gKHByb3ZpZGVyIGFzIFZhbHVlUHJvdmlkZXIpLnVzZVZhbHVlO1xuICB9IGVsc2UgaWYgKChwcm92aWRlciBhcyBGYWN0b3J5UHJvdmlkZXIpLnVzZUZhY3RvcnkpIHtcbiAgICBmbiA9IChwcm92aWRlciBhcyBGYWN0b3J5UHJvdmlkZXIpLnVzZUZhY3Rvcnk7XG4gIH0gZWxzZSBpZiAoKHByb3ZpZGVyIGFzIEV4aXN0aW5nUHJvdmlkZXIpLnVzZUV4aXN0aW5nKSB7XG4gICAgLy8gSnVzdCB1c2UgSURFTlRcbiAgfSBlbHNlIGlmICgocHJvdmlkZXIgYXMgU3RhdGljQ2xhc3NQcm92aWRlcikudXNlQ2xhc3MpIHtcbiAgICB1c2VOZXcgPSB0cnVlO1xuICAgIGZuID0gcmVzb2x2ZUZvcndhcmRSZWYoKHByb3ZpZGVyIGFzIFN0YXRpY0NsYXNzUHJvdmlkZXIpLnVzZUNsYXNzKTtcbiAgfSBlbHNlIGlmICh0eXBlb2YgcHJvdmlkZSA9PSAnZnVuY3Rpb24nKSB7XG4gICAgdXNlTmV3ID0gdHJ1ZTtcbiAgICBmbiA9IHByb3ZpZGU7XG4gIH0gZWxzZSB7XG4gICAgdGhyb3cgc3RhdGljRXJyb3IoXG4gICAgICAgICdTdGF0aWNQcm92aWRlciBkb2VzIG5vdCBoYXZlIFt1c2VWYWx1ZXx1c2VGYWN0b3J5fHVzZUV4aXN0aW5nfHVzZUNsYXNzXSBvciBbcHJvdmlkZV0gaXMgbm90IG5ld2FibGUnLFxuICAgICAgICBwcm92aWRlcik7XG4gIH1cbiAgcmV0dXJuIHtkZXBzLCBmbiwgdXNlTmV3LCB2YWx1ZX07XG59XG5cbmZ1bmN0aW9uIG11bHRpUHJvdmlkZXJNaXhFcnJvcih0b2tlbjogYW55KSB7XG4gIHJldHVybiBzdGF0aWNFcnJvcignQ2Fubm90IG1peCBtdWx0aSBwcm92aWRlcnMgYW5kIHJlZ3VsYXIgcHJvdmlkZXJzJywgdG9rZW4pO1xufVxuXG5mdW5jdGlvbiByZWN1cnNpdmVseVByb2Nlc3NQcm92aWRlcnMocmVjb3JkczogTWFwPGFueSwgUmVjb3JkPiwgcHJvdmlkZXI6IFN0YXRpY1Byb3ZpZGVyKSB7XG4gIGlmIChwcm92aWRlcikge1xuICAgIHByb3ZpZGVyID0gcmVzb2x2ZUZvcndhcmRSZWYocHJvdmlkZXIpO1xuICAgIGlmIChwcm92aWRlciBpbnN0YW5jZW9mIEFycmF5KSB7XG4gICAgICAvLyBpZiB3ZSBoYXZlIGFuIGFycmF5IHJlY3Vyc2UgaW50byB0aGUgYXJyYXlcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcHJvdmlkZXIubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgcmVjdXJzaXZlbHlQcm9jZXNzUHJvdmlkZXJzKHJlY29yZHMsIHByb3ZpZGVyW2ldKTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBwcm92aWRlciA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgLy8gRnVuY3Rpb25zIHdlcmUgc3VwcG9ydGVkIGluIFJlZmxlY3RpdmVJbmplY3RvciwgYnV0IGFyZSBub3QgaGVyZS4gRm9yIHNhZmV0eSBnaXZlIHVzZWZ1bFxuICAgICAgLy8gZXJyb3IgbWVzc2FnZXNcbiAgICAgIHRocm93IHN0YXRpY0Vycm9yKCdGdW5jdGlvbi9DbGFzcyBub3Qgc3VwcG9ydGVkJywgcHJvdmlkZXIpO1xuICAgIH0gZWxzZSBpZiAocHJvdmlkZXIgJiYgdHlwZW9mIHByb3ZpZGVyID09PSAnb2JqZWN0JyAmJiBwcm92aWRlci5wcm92aWRlKSB7XG4gICAgICAvLyBBdCB0aGlzIHBvaW50IHdlIGhhdmUgd2hhdCBsb29rcyBsaWtlIGEgcHJvdmlkZXI6IHtwcm92aWRlOiA/LCAuLi4ufVxuICAgICAgbGV0IHRva2VuID0gcmVzb2x2ZUZvcndhcmRSZWYocHJvdmlkZXIucHJvdmlkZSk7XG4gICAgICBjb25zdCByZXNvbHZlZFByb3ZpZGVyID0gcmVzb2x2ZVByb3ZpZGVyKHByb3ZpZGVyKTtcbiAgICAgIGlmIChwcm92aWRlci5tdWx0aSA9PT0gdHJ1ZSkge1xuICAgICAgICAvLyBUaGlzIGlzIGEgbXVsdGkgcHJvdmlkZXIuXG4gICAgICAgIGxldCBtdWx0aVByb3ZpZGVyOiBSZWNvcmR8dW5kZWZpbmVkID0gcmVjb3Jkcy5nZXQodG9rZW4pO1xuICAgICAgICBpZiAobXVsdGlQcm92aWRlcikge1xuICAgICAgICAgIGlmIChtdWx0aVByb3ZpZGVyLmZuICE9PSBNVUxUSV9QUk9WSURFUl9GTikge1xuICAgICAgICAgICAgdGhyb3cgbXVsdGlQcm92aWRlck1peEVycm9yKHRva2VuKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gQ3JlYXRlIGEgcGxhY2Vob2xkZXIgZmFjdG9yeSB3aGljaCB3aWxsIGxvb2sgdXAgdGhlIGNvbnN0aXR1ZW50cyBvZiB0aGUgbXVsdGkgcHJvdmlkZXIuXG4gICAgICAgICAgcmVjb3Jkcy5zZXQodG9rZW4sIG11bHRpUHJvdmlkZXIgPSA8UmVjb3JkPntcbiAgICAgICAgICAgIHRva2VuOiBwcm92aWRlci5wcm92aWRlLFxuICAgICAgICAgICAgZGVwczogW10sXG4gICAgICAgICAgICB1c2VOZXc6IGZhbHNlLFxuICAgICAgICAgICAgZm46IE1VTFRJX1BST1ZJREVSX0ZOLFxuICAgICAgICAgICAgdmFsdWU6IEVNUFRZXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gVHJlYXQgdGhlIHByb3ZpZGVyIGFzIHRoZSB0b2tlbi5cbiAgICAgICAgdG9rZW4gPSBwcm92aWRlcjtcbiAgICAgICAgbXVsdGlQcm92aWRlci5kZXBzLnB1c2goe3Rva2VuLCBvcHRpb25zOiBPcHRpb25GbGFncy5EZWZhdWx0fSk7XG4gICAgICB9XG4gICAgICBjb25zdCByZWNvcmQgPSByZWNvcmRzLmdldCh0b2tlbik7XG4gICAgICBpZiAocmVjb3JkICYmIHJlY29yZC5mbiA9PSBNVUxUSV9QUk9WSURFUl9GTikge1xuICAgICAgICB0aHJvdyBtdWx0aVByb3ZpZGVyTWl4RXJyb3IodG9rZW4pO1xuICAgICAgfVxuICAgICAgcmVjb3Jkcy5zZXQodG9rZW4sIHJlc29sdmVkUHJvdmlkZXIpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBzdGF0aWNFcnJvcignVW5leHBlY3RlZCBwcm92aWRlcicsIHByb3ZpZGVyKTtcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gdHJ5UmVzb2x2ZVRva2VuKFxuICAgIHRva2VuOiBhbnksIHJlY29yZDogUmVjb3JkIHwgdW5kZWZpbmVkLCByZWNvcmRzOiBNYXA8YW55LCBSZWNvcmQ+LCBwYXJlbnQ6IEluamVjdG9yLFxuICAgIG5vdEZvdW5kVmFsdWU6IGFueSwgZmxhZ3M6IEluamVjdEZsYWdzKTogYW55IHtcbiAgdHJ5IHtcbiAgICByZXR1cm4gcmVzb2x2ZVRva2VuKHRva2VuLCByZWNvcmQsIHJlY29yZHMsIHBhcmVudCwgbm90Rm91bmRWYWx1ZSwgZmxhZ3MpO1xuICB9IGNhdGNoIChlKSB7XG4gICAgLy8gZW5zdXJlIHRoYXQgJ2UnIGlzIG9mIHR5cGUgRXJyb3IuXG4gICAgaWYgKCEoZSBpbnN0YW5jZW9mIEVycm9yKSkge1xuICAgICAgZSA9IG5ldyBFcnJvcihlKTtcbiAgICB9XG4gICAgY29uc3QgcGF0aDogYW55W10gPSBlW05HX1RFTVBfVE9LRU5fUEFUSF0gPSBlW05HX1RFTVBfVE9LRU5fUEFUSF0gfHwgW107XG4gICAgcGF0aC51bnNoaWZ0KHRva2VuKTtcbiAgICBpZiAocmVjb3JkICYmIHJlY29yZC52YWx1ZSA9PSBDSVJDVUxBUikge1xuICAgICAgLy8gUmVzZXQgdGhlIENpcmN1bGFyIGZsYWcuXG4gICAgICByZWNvcmQudmFsdWUgPSBFTVBUWTtcbiAgICB9XG4gICAgdGhyb3cgZTtcbiAgfVxufVxuXG5mdW5jdGlvbiByZXNvbHZlVG9rZW4oXG4gICAgdG9rZW46IGFueSwgcmVjb3JkOiBSZWNvcmQgfCB1bmRlZmluZWQsIHJlY29yZHM6IE1hcDxhbnksIFJlY29yZD4sIHBhcmVudDogSW5qZWN0b3IsXG4gICAgbm90Rm91bmRWYWx1ZTogYW55LCBmbGFnczogSW5qZWN0RmxhZ3MpOiBhbnkge1xuICBsZXQgdmFsdWU7XG4gIGlmIChyZWNvcmQgJiYgIShmbGFncyAmIEluamVjdEZsYWdzLlNraXBTZWxmKSkge1xuICAgIC8vIElmIHdlIGRvbid0IGhhdmUgYSByZWNvcmQsIHRoaXMgaW1wbGllcyB0aGF0IHdlIGRvbid0IG93biB0aGUgcHJvdmlkZXIgaGVuY2UgZG9uJ3Qga25vdyBob3dcbiAgICAvLyB0byByZXNvbHZlIGl0LlxuICAgIHZhbHVlID0gcmVjb3JkLnZhbHVlO1xuICAgIGlmICh2YWx1ZSA9PSBDSVJDVUxBUikge1xuICAgICAgdGhyb3cgRXJyb3IoTk9fTkVXX0xJTkUgKyAnQ2lyY3VsYXIgZGVwZW5kZW5jeScpO1xuICAgIH0gZWxzZSBpZiAodmFsdWUgPT09IEVNUFRZKSB7XG4gICAgICByZWNvcmQudmFsdWUgPSBDSVJDVUxBUjtcbiAgICAgIGxldCBvYmogPSB1bmRlZmluZWQ7XG4gICAgICBsZXQgdXNlTmV3ID0gcmVjb3JkLnVzZU5ldztcbiAgICAgIGxldCBmbiA9IHJlY29yZC5mbjtcbiAgICAgIGxldCBkZXBSZWNvcmRzID0gcmVjb3JkLmRlcHM7XG4gICAgICBsZXQgZGVwcyA9IEVNUFRZO1xuICAgICAgaWYgKGRlcFJlY29yZHMubGVuZ3RoKSB7XG4gICAgICAgIGRlcHMgPSBbXTtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBkZXBSZWNvcmRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgY29uc3QgZGVwUmVjb3JkOiBEZXBlbmRlbmN5UmVjb3JkID0gZGVwUmVjb3Jkc1tpXTtcbiAgICAgICAgICBjb25zdCBvcHRpb25zID0gZGVwUmVjb3JkLm9wdGlvbnM7XG4gICAgICAgICAgY29uc3QgY2hpbGRSZWNvcmQgPVxuICAgICAgICAgICAgICBvcHRpb25zICYgT3B0aW9uRmxhZ3MuQ2hlY2tTZWxmID8gcmVjb3Jkcy5nZXQoZGVwUmVjb3JkLnRva2VuKSA6IHVuZGVmaW5lZDtcbiAgICAgICAgICBkZXBzLnB1c2godHJ5UmVzb2x2ZVRva2VuKFxuICAgICAgICAgICAgICAvLyBDdXJyZW50IFRva2VuIHRvIHJlc29sdmVcbiAgICAgICAgICAgICAgZGVwUmVjb3JkLnRva2VuLFxuICAgICAgICAgICAgICAvLyBBIHJlY29yZCB3aGljaCBkZXNjcmliZXMgaG93IHRvIHJlc29sdmUgdGhlIHRva2VuLlxuICAgICAgICAgICAgICAvLyBJZiB1bmRlZmluZWQsIHRoaXMgbWVhbnMgd2UgZG9uJ3QgaGF2ZSBzdWNoIGEgcmVjb3JkXG4gICAgICAgICAgICAgIGNoaWxkUmVjb3JkLFxuICAgICAgICAgICAgICAvLyBPdGhlciByZWNvcmRzIHdlIGtub3cgYWJvdXQuXG4gICAgICAgICAgICAgIHJlY29yZHMsXG4gICAgICAgICAgICAgIC8vIElmIHdlIGRvbid0IGtub3cgaG93IHRvIHJlc29sdmUgZGVwZW5kZW5jeSBhbmQgd2Ugc2hvdWxkIG5vdCBjaGVjayBwYXJlbnQgZm9yIGl0LFxuICAgICAgICAgICAgICAvLyB0aGFuIHBhc3MgaW4gTnVsbCBpbmplY3Rvci5cbiAgICAgICAgICAgICAgIWNoaWxkUmVjb3JkICYmICEob3B0aW9ucyAmIE9wdGlvbkZsYWdzLkNoZWNrUGFyZW50KSA/IE5VTExfSU5KRUNUT1IgOiBwYXJlbnQsXG4gICAgICAgICAgICAgIG9wdGlvbnMgJiBPcHRpb25GbGFncy5PcHRpb25hbCA/IG51bGwgOiBJbmplY3Rvci5USFJPV19JRl9OT1RfRk9VTkQsXG4gICAgICAgICAgICAgIEluamVjdEZsYWdzLkRlZmF1bHQpKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmVjb3JkLnZhbHVlID0gdmFsdWUgPSB1c2VOZXcgPyBuZXcgKGZuIGFzIGFueSkoLi4uZGVwcykgOiBmbi5hcHBseShvYmosIGRlcHMpO1xuICAgIH1cbiAgfSBlbHNlIGlmICghKGZsYWdzICYgSW5qZWN0RmxhZ3MuU2VsZikpIHtcbiAgICB2YWx1ZSA9IHBhcmVudC5nZXQodG9rZW4sIG5vdEZvdW5kVmFsdWUsIEluamVjdEZsYWdzLkRlZmF1bHQpO1xuICB9XG4gIHJldHVybiB2YWx1ZTtcbn1cblxuXG5mdW5jdGlvbiBjb21wdXRlRGVwcyhwcm92aWRlcjogU3RhdGljUHJvdmlkZXIpOiBEZXBlbmRlbmN5UmVjb3JkW10ge1xuICBsZXQgZGVwczogRGVwZW5kZW5jeVJlY29yZFtdID0gRU1QVFk7XG4gIGNvbnN0IHByb3ZpZGVyRGVwczogYW55W10gPVxuICAgICAgKHByb3ZpZGVyIGFzIEV4aXN0aW5nUHJvdmlkZXIgJiBTdGF0aWNDbGFzc1Byb3ZpZGVyICYgQ29uc3RydWN0b3JQcm92aWRlcikuZGVwcztcbiAgaWYgKHByb3ZpZGVyRGVwcyAmJiBwcm92aWRlckRlcHMubGVuZ3RoKSB7XG4gICAgZGVwcyA9IFtdO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcHJvdmlkZXJEZXBzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBsZXQgb3B0aW9ucyA9IE9wdGlvbkZsYWdzLkRlZmF1bHQ7XG4gICAgICBsZXQgdG9rZW4gPSByZXNvbHZlRm9yd2FyZFJlZihwcm92aWRlckRlcHNbaV0pO1xuICAgICAgaWYgKHRva2VuIGluc3RhbmNlb2YgQXJyYXkpIHtcbiAgICAgICAgZm9yIChsZXQgaiA9IDAsIGFubm90YXRpb25zID0gdG9rZW47IGogPCBhbm5vdGF0aW9ucy5sZW5ndGg7IGorKykge1xuICAgICAgICAgIGNvbnN0IGFubm90YXRpb24gPSBhbm5vdGF0aW9uc1tqXTtcbiAgICAgICAgICBpZiAoYW5ub3RhdGlvbiBpbnN0YW5jZW9mIE9wdGlvbmFsIHx8IGFubm90YXRpb24gPT0gT3B0aW9uYWwpIHtcbiAgICAgICAgICAgIG9wdGlvbnMgPSBvcHRpb25zIHwgT3B0aW9uRmxhZ3MuT3B0aW9uYWw7XG4gICAgICAgICAgfSBlbHNlIGlmIChhbm5vdGF0aW9uIGluc3RhbmNlb2YgU2tpcFNlbGYgfHwgYW5ub3RhdGlvbiA9PSBTa2lwU2VsZikge1xuICAgICAgICAgICAgb3B0aW9ucyA9IG9wdGlvbnMgJiB+T3B0aW9uRmxhZ3MuQ2hlY2tTZWxmO1xuICAgICAgICAgIH0gZWxzZSBpZiAoYW5ub3RhdGlvbiBpbnN0YW5jZW9mIFNlbGYgfHwgYW5ub3RhdGlvbiA9PSBTZWxmKSB7XG4gICAgICAgICAgICBvcHRpb25zID0gb3B0aW9ucyAmIH5PcHRpb25GbGFncy5DaGVja1BhcmVudDtcbiAgICAgICAgICB9IGVsc2UgaWYgKGFubm90YXRpb24gaW5zdGFuY2VvZiBJbmplY3QpIHtcbiAgICAgICAgICAgIHRva2VuID0gKGFubm90YXRpb24gYXMgSW5qZWN0KS50b2tlbjtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdG9rZW4gPSByZXNvbHZlRm9yd2FyZFJlZihhbm5vdGF0aW9uKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGRlcHMucHVzaCh7dG9rZW4sIG9wdGlvbnN9KTtcbiAgICB9XG4gIH0gZWxzZSBpZiAoKHByb3ZpZGVyIGFzIEV4aXN0aW5nUHJvdmlkZXIpLnVzZUV4aXN0aW5nKSB7XG4gICAgY29uc3QgdG9rZW4gPSByZXNvbHZlRm9yd2FyZFJlZigocHJvdmlkZXIgYXMgRXhpc3RpbmdQcm92aWRlcikudXNlRXhpc3RpbmcpO1xuICAgIGRlcHMgPSBbe3Rva2VuLCBvcHRpb25zOiBPcHRpb25GbGFncy5EZWZhdWx0fV07XG4gIH0gZWxzZSBpZiAoIXByb3ZpZGVyRGVwcyAmJiAhKFVTRV9WQUxVRSBpbiBwcm92aWRlcikpIHtcbiAgICAvLyB1c2VWYWx1ZSAmIHVzZUV4aXN0aW5nIGFyZSB0aGUgb25seSBvbmVzIHdoaWNoIGFyZSBleGVtcHQgZnJvbSBkZXBzIGFsbCBvdGhlcnMgbmVlZCBpdC5cbiAgICB0aHJvdyBzdGF0aWNFcnJvcignXFwnZGVwc1xcJyByZXF1aXJlZCcsIHByb3ZpZGVyKTtcbiAgfVxuICByZXR1cm4gZGVwcztcbn1cblxuZnVuY3Rpb24gZm9ybWF0RXJyb3IodGV4dDogc3RyaW5nLCBvYmo6IGFueSwgc291cmNlOiBzdHJpbmcgfCBudWxsID0gbnVsbCk6IHN0cmluZyB7XG4gIHRleHQgPSB0ZXh0ICYmIHRleHQuY2hhckF0KDApID09PSAnXFxuJyAmJiB0ZXh0LmNoYXJBdCgxKSA9PSBOT19ORVdfTElORSA/IHRleHQuc3Vic3RyKDIpIDogdGV4dDtcbiAgbGV0IGNvbnRleHQgPSBzdHJpbmdpZnkob2JqKTtcbiAgaWYgKG9iaiBpbnN0YW5jZW9mIEFycmF5KSB7XG4gICAgY29udGV4dCA9IG9iai5tYXAoc3RyaW5naWZ5KS5qb2luKCcgLT4gJyk7XG4gIH0gZWxzZSBpZiAodHlwZW9mIG9iaiA9PT0gJ29iamVjdCcpIHtcbiAgICBsZXQgcGFydHMgPSA8c3RyaW5nW10+W107XG4gICAgZm9yIChsZXQga2V5IGluIG9iaikge1xuICAgICAgaWYgKG9iai5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgIGxldCB2YWx1ZSA9IG9ialtrZXldO1xuICAgICAgICBwYXJ0cy5wdXNoKFxuICAgICAgICAgICAga2V5ICsgJzonICsgKHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycgPyBKU09OLnN0cmluZ2lmeSh2YWx1ZSkgOiBzdHJpbmdpZnkodmFsdWUpKSk7XG4gICAgICB9XG4gICAgfVxuICAgIGNvbnRleHQgPSBgeyR7cGFydHMuam9pbignLCAnKX19YDtcbiAgfVxuICByZXR1cm4gYFN0YXRpY0luamVjdG9yRXJyb3Ike3NvdXJjZSA/ICcoJyArIHNvdXJjZSArICcpJyA6ICcnfVske2NvbnRleHR9XTogJHt0ZXh0LnJlcGxhY2UoTkVXX0xJTkUsICdcXG4gICcpfWA7XG59XG5cbmZ1bmN0aW9uIHN0YXRpY0Vycm9yKHRleHQ6IHN0cmluZywgb2JqOiBhbnkpOiBFcnJvciB7XG4gIHJldHVybiBuZXcgRXJyb3IoZm9ybWF0RXJyb3IodGV4dCwgb2JqKSk7XG59XG5cbmZ1bmN0aW9uIGdldENsb3N1cmVTYWZlUHJvcGVydHk8VD4ob2JqV2l0aFByb3BlcnR5VG9FeHRyYWN0OiBUKTogc3RyaW5nIHtcbiAgZm9yIChsZXQga2V5IGluIG9ialdpdGhQcm9wZXJ0eVRvRXh0cmFjdCkge1xuICAgIGlmIChvYmpXaXRoUHJvcGVydHlUb0V4dHJhY3Rba2V5XSA9PT0gR0VUX1BST1BFUlRZX05BTUUpIHtcbiAgICAgIHJldHVybiBrZXk7XG4gICAgfVxuICB9XG4gIHRocm93IEVycm9yKCchcHJvcCcpO1xufVxuXG4vKipcbiAqIEluamVjdGlvbiBmbGFncyBmb3IgREkuXG4gKi9cbmV4cG9ydCBjb25zdCBlbnVtIEluamVjdEZsYWdzIHtcbiAgRGVmYXVsdCA9IDBiMDAwMCxcblxuICAvKipcbiAgICogU3BlY2lmaWVzIHRoYXQgYW4gaW5qZWN0b3Igc2hvdWxkIHJldHJpZXZlIGEgZGVwZW5kZW5jeSBmcm9tIGFueSBpbmplY3RvciB1bnRpbCByZWFjaGluZyB0aGVcbiAgICogaG9zdCBlbGVtZW50IG9mIHRoZSBjdXJyZW50IGNvbXBvbmVudC4gKE9ubHkgdXNlZCB3aXRoIEVsZW1lbnQgSW5qZWN0b3IpXG4gICAqL1xuICBIb3N0ID0gMGIwMDAxLFxuICAvKiogRG9uJ3QgZGVzY2VuZCBpbnRvIGFuY2VzdG9ycyBvZiB0aGUgbm9kZSByZXF1ZXN0aW5nIGluamVjdGlvbi4gKi9cbiAgU2VsZiA9IDBiMDAxMCxcbiAgLyoqIFNraXAgdGhlIG5vZGUgdGhhdCBpcyByZXF1ZXN0aW5nIGluamVjdGlvbi4gKi9cbiAgU2tpcFNlbGYgPSAwYjAxMDAsXG4gIC8qKiBJbmplY3QgYGRlZmF1bHRWYWx1ZWAgaW5zdGVhZCBpZiB0b2tlbiBub3QgZm91bmQuICovXG4gIE9wdGlvbmFsID0gMGIxMDAwLFxufVxuXG4vKipcbiAqIEN1cnJlbnQgaW5qZWN0b3IgdmFsdWUgdXNlZCBieSBgaW5qZWN0YC5cbiAqIC0gYHVuZGVmaW5lZGA6IGl0IGlzIGFuIGVycm9yIHRvIGNhbGwgYGluamVjdGBcbiAqIC0gYG51bGxgOiBgaW5qZWN0YCBjYW4gYmUgY2FsbGVkIGJ1dCB0aGVyZSBpcyBubyBpbmplY3RvciAobGltcC1tb2RlKS5cbiAqIC0gSW5qZWN0b3IgaW5zdGFuY2U6IFVzZSB0aGUgaW5qZWN0b3IgZm9yIHJlc29sdXRpb24uXG4gKi9cbmxldCBfY3VycmVudEluamVjdG9yOiBJbmplY3Rvcnx1bmRlZmluZWR8bnVsbCA9IHVuZGVmaW5lZDtcblxuZXhwb3J0IGZ1bmN0aW9uIHNldEN1cnJlbnRJbmplY3RvcihpbmplY3RvcjogSW5qZWN0b3IgfCBudWxsIHwgdW5kZWZpbmVkKTogSW5qZWN0b3J8dW5kZWZpbmVkfG51bGwge1xuICBjb25zdCBmb3JtZXIgPSBfY3VycmVudEluamVjdG9yO1xuICBfY3VycmVudEluamVjdG9yID0gaW5qZWN0b3I7XG4gIHJldHVybiBmb3JtZXI7XG59XG5cbi8qKlxuICogSW5qZWN0cyBhIHRva2VuIGZyb20gdGhlIGN1cnJlbnRseSBhY3RpdmUgaW5qZWN0b3IuXG4gKlxuICogVGhpcyBmdW5jdGlvbiBtdXN0IGJlIHVzZWQgaW4gdGhlIGNvbnRleHQgb2YgYSBmYWN0b3J5IGZ1bmN0aW9uIHN1Y2ggYXMgb25lIGRlZmluZWQgZm9yIGFuXG4gKiBgSW5qZWN0aW9uVG9rZW5gLCBhbmQgd2lsbCB0aHJvdyBhbiBlcnJvciBpZiBub3QgY2FsbGVkIGZyb20gc3VjaCBhIGNvbnRleHQuXG4gKlxuICogQHVzYWdlTm90ZXNcbiAqICMjIyBFeGFtcGxlXG4gKlxuICoge0BleGFtcGxlIGNvcmUvZGkvdHMvaW5qZWN0b3Jfc3BlYy50cyByZWdpb249J1NoYWtlYWJsZUluamVjdGlvblRva2VuJ31cbiAqXG4gKiBXaXRoaW4gc3VjaCBhIGZhY3RvcnkgZnVuY3Rpb24gYGluamVjdGAgaXMgdXRpbGl6ZWQgdG8gcmVxdWVzdCBpbmplY3Rpb24gb2YgYSBkZXBlbmRlbmN5LCBpbnN0ZWFkXG4gKiBvZiBwcm92aWRpbmcgYW4gYWRkaXRpb25hbCBhcnJheSBvZiBkZXBlbmRlbmNpZXMgYXMgd2FzIGNvbW1vbiB0byBkbyB3aXRoIGB1c2VGYWN0b3J5YCBwcm92aWRlcnMuXG4gKiBgaW5qZWN0YCBpcyBmYXN0ZXIgYW5kIG1vcmUgdHlwZS1zYWZlLlxuICpcbiAqIEBleHBlcmltZW50YWxcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGluamVjdDxUPih0b2tlbjogVHlwZTxUPnwgSW5qZWN0aW9uVG9rZW48VD4pOiBUO1xuZXhwb3J0IGZ1bmN0aW9uIGluamVjdDxUPih0b2tlbjogVHlwZTxUPnwgSW5qZWN0aW9uVG9rZW48VD4sIGZsYWdzPzogSW5qZWN0RmxhZ3MpOiBUfG51bGw7XG5leHBvcnQgZnVuY3Rpb24gaW5qZWN0PFQ+KHRva2VuOiBUeXBlPFQ+fCBJbmplY3Rpb25Ub2tlbjxUPiwgZmxhZ3MgPSBJbmplY3RGbGFncy5EZWZhdWx0KTogVHxudWxsIHtcbiAgaWYgKF9jdXJyZW50SW5qZWN0b3IgPT09IHVuZGVmaW5lZCkge1xuICAgIHRocm93IG5ldyBFcnJvcihgaW5qZWN0KCkgbXVzdCBiZSBjYWxsZWQgZnJvbSBhbiBpbmplY3Rpb24gY29udGV4dGApO1xuICB9IGVsc2UgaWYgKF9jdXJyZW50SW5qZWN0b3IgPT09IG51bGwpIHtcbiAgICBjb25zdCBpbmplY3RhYmxlRGVmOiBJbmplY3RhYmxlRGVmPFQ+ID0gKHRva2VuIGFzIGFueSkubmdJbmplY3RhYmxlRGVmO1xuICAgIGlmIChpbmplY3RhYmxlRGVmICYmIGluamVjdGFibGVEZWYucHJvdmlkZWRJbiA9PSAncm9vdCcpIHtcbiAgICAgIHJldHVybiBpbmplY3RhYmxlRGVmLnZhbHVlID09PSB1bmRlZmluZWQgPyBpbmplY3RhYmxlRGVmLnZhbHVlID0gaW5qZWN0YWJsZURlZi5mYWN0b3J5KCkgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluamVjdGFibGVEZWYudmFsdWU7XG4gICAgfVxuICAgIGlmIChmbGFncyAmIEluamVjdEZsYWdzLk9wdGlvbmFsKSByZXR1cm4gbnVsbDtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYEluamVjdG9yOiBOT1RfRk9VTkQgWyR7c3RyaW5naWZ5KHRva2VuKX1dYCk7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIF9jdXJyZW50SW5qZWN0b3IuZ2V0KHRva2VuLCBmbGFncyAmIEluamVjdEZsYWdzLk9wdGlvbmFsID8gbnVsbCA6IHVuZGVmaW5lZCwgZmxhZ3MpO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpbmplY3RBcmdzKHR5cGVzOiAoVHlwZTxhbnk+fCBJbmplY3Rpb25Ub2tlbjxhbnk+fCBhbnlbXSlbXSk6IGFueVtdIHtcbiAgY29uc3QgYXJnczogYW55W10gPSBbXTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCB0eXBlcy5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IGFyZyA9IHR5cGVzW2ldO1xuICAgIGlmIChBcnJheS5pc0FycmF5KGFyZykpIHtcbiAgICAgIGlmIChhcmcubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignQXJndW1lbnRzIGFycmF5IG11c3QgaGF2ZSBhcmd1bWVudHMuJyk7XG4gICAgICB9XG4gICAgICBsZXQgdHlwZTogVHlwZTxhbnk+fHVuZGVmaW5lZCA9IHVuZGVmaW5lZDtcbiAgICAgIGxldCBmbGFnczogSW5qZWN0RmxhZ3MgPSBJbmplY3RGbGFncy5EZWZhdWx0O1xuXG4gICAgICBmb3IgKGxldCBqID0gMDsgaiA8IGFyZy5sZW5ndGg7IGorKykge1xuICAgICAgICBjb25zdCBtZXRhID0gYXJnW2pdO1xuICAgICAgICBpZiAobWV0YSBpbnN0YW5jZW9mIE9wdGlvbmFsIHx8IG1ldGEubmdNZXRhZGF0YU5hbWUgPT09ICdPcHRpb25hbCcpIHtcbiAgICAgICAgICBmbGFncyB8PSBJbmplY3RGbGFncy5PcHRpb25hbDtcbiAgICAgICAgfSBlbHNlIGlmIChtZXRhIGluc3RhbmNlb2YgU2tpcFNlbGYgfHwgbWV0YS5uZ01ldGFkYXRhTmFtZSA9PT0gJ1NraXBTZWxmJykge1xuICAgICAgICAgIGZsYWdzIHw9IEluamVjdEZsYWdzLlNraXBTZWxmO1xuICAgICAgICB9IGVsc2UgaWYgKG1ldGEgaW5zdGFuY2VvZiBTZWxmIHx8IG1ldGEubmdNZXRhZGF0YU5hbWUgPT09ICdTZWxmJykge1xuICAgICAgICAgIGZsYWdzIHw9IEluamVjdEZsYWdzLlNlbGY7XG4gICAgICAgIH0gZWxzZSBpZiAobWV0YSBpbnN0YW5jZW9mIEluamVjdCkge1xuICAgICAgICAgIHR5cGUgPSBtZXRhLnRva2VuO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHR5cGUgPSBtZXRhO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGFyZ3MucHVzaChpbmplY3QodHlwZSAhLCBmbGFncykpO1xuICAgIH0gZWxzZSB7XG4gICAgICBhcmdzLnB1c2goaW5qZWN0KGFyZykpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gYXJncztcbn1cbiJdfQ==