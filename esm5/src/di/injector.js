import * as tslib_1 from "tslib";
import { injectInjector } from '../render3/di';
import { noop } from '../util/noop';
import { getClosureSafeProperty } from '../util/property';
import { stringify } from '../util/stringify';
import { resolveForwardRef } from './forward_ref';
import { InjectionToken } from './injection_token';
import { InjectFlags, inject } from './injector_compatibility';
import { defineInjectable } from './interface/defs';
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
    /** @internal */
    /** @nocollapse */
    Injector.__NG_ELEMENT_ID__ = function () { return SWITCH_INJECTOR_FACTORY(); };
    return Injector;
}());
export { Injector };
export var SWITCH_INJECTOR_FACTORY__POST_R3__ = function () {
    return injectInjector();
};
var SWITCH_INJECTOR_FACTORY__PRE_R3__ = noop;
var SWITCH_INJECTOR_FACTORY = SWITCH_INJECTOR_FACTORY__POST_R3__;
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
        if (flags === void 0) { flags = InjectFlags.Default; }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5qZWN0b3IuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9kaS9pbmplY3Rvci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBU0EsT0FBTyxFQUFDLGNBQWMsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUM3QyxPQUFPLEVBQUMsSUFBSSxFQUFDLE1BQU0sY0FBYyxDQUFDO0FBQ2xDLE9BQU8sRUFBQyxzQkFBc0IsRUFBQyxNQUFNLGtCQUFrQixDQUFDO0FBQ3hELE9BQU8sRUFBQyxTQUFTLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUU1QyxPQUFPLEVBQUMsaUJBQWlCLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFDaEQsT0FBTyxFQUFDLGNBQWMsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQ2pELE9BQU8sRUFBQyxXQUFXLEVBQUUsTUFBTSxFQUFDLE1BQU0sMEJBQTBCLENBQUM7QUFDN0QsT0FBTyxFQUFDLGdCQUFnQixFQUFDLE1BQU0sa0JBQWtCLENBQUM7QUFFbEQsT0FBTyxFQUFDLE1BQU0sRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBQyxNQUFNLFlBQVksQ0FBQztBQUU1RCxNQUFNLENBQUMsSUFBTSxNQUFNLEdBQUcsVUFBVSxDQUFDO0FBQ2pDLElBQU0sbUJBQW1CLEdBQUcsSUFBSSxNQUFNLEVBQUUsQ0FBQztBQUN6QyxNQUFNLENBQUMsSUFBTSxrQkFBa0IsR0FBRyxtQkFBbUIsQ0FBQztBQUV0RDs7Ozs7OztHQU9HO0FBQ0gsTUFBTSxDQUFDLElBQU0sUUFBUSxHQUFHLElBQUksY0FBYyxDQUFXLFVBQVUsQ0FBQyxDQUFDO0FBRWpFO0lBQUE7SUFXQSxDQUFDO0lBVkMsMEJBQUcsR0FBSCxVQUFJLEtBQVUsRUFBRSxhQUF3QztRQUF4Qyw4QkFBQSxFQUFBLG1DQUF3QztRQUN0RCxJQUFJLGFBQWEsS0FBSyxtQkFBbUIsRUFBRTtZQUN6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Q0FBQyxJQUFZLEVBQUUsR0FBUTtJQUN6QyxPQUFPLElBQUksS0FBSyxDQUFDLFdBQVcsQ0FBQyxJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQztBQUMzQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1R5cGV9IGZyb20gJy4uL2ludGVyZmFjZS90eXBlJztcbmltcG9ydCB7aW5qZWN0SW5qZWN0b3J9IGZyb20gJy4uL3JlbmRlcjMvZGknO1xuaW1wb3J0IHtub29wfSBmcm9tICcuLi91dGlsL25vb3AnO1xuaW1wb3J0IHtnZXRDbG9zdXJlU2FmZVByb3BlcnR5fSBmcm9tICcuLi91dGlsL3Byb3BlcnR5JztcbmltcG9ydCB7c3RyaW5naWZ5fSBmcm9tICcuLi91dGlsL3N0cmluZ2lmeSc7XG5cbmltcG9ydCB7cmVzb2x2ZUZvcndhcmRSZWZ9IGZyb20gJy4vZm9yd2FyZF9yZWYnO1xuaW1wb3J0IHtJbmplY3Rpb25Ub2tlbn0gZnJvbSAnLi9pbmplY3Rpb25fdG9rZW4nO1xuaW1wb3J0IHtJbmplY3RGbGFncywgaW5qZWN0fSBmcm9tICcuL2luamVjdG9yX2NvbXBhdGliaWxpdHknO1xuaW1wb3J0IHtkZWZpbmVJbmplY3RhYmxlfSBmcm9tICcuL2ludGVyZmFjZS9kZWZzJztcbmltcG9ydCB7Q29uc3RydWN0b3JQcm92aWRlciwgRXhpc3RpbmdQcm92aWRlciwgRmFjdG9yeVByb3ZpZGVyLCBTdGF0aWNDbGFzc1Byb3ZpZGVyLCBTdGF0aWNQcm92aWRlciwgVmFsdWVQcm92aWRlcn0gZnJvbSAnLi9pbnRlcmZhY2UvcHJvdmlkZXInO1xuaW1wb3J0IHtJbmplY3QsIE9wdGlvbmFsLCBTZWxmLCBTa2lwU2VsZn0gZnJvbSAnLi9tZXRhZGF0YSc7XG5cbmV4cG9ydCBjb25zdCBTT1VSQ0UgPSAnX19zb3VyY2UnO1xuY29uc3QgX1RIUk9XX0lGX05PVF9GT1VORCA9IG5ldyBPYmplY3QoKTtcbmV4cG9ydCBjb25zdCBUSFJPV19JRl9OT1RfRk9VTkQgPSBfVEhST1dfSUZfTk9UX0ZPVU5EO1xuXG4vKipcbiAqIEFuIEluamVjdGlvblRva2VuIHRoYXQgZ2V0cyB0aGUgY3VycmVudCBgSW5qZWN0b3JgIGZvciBgY3JlYXRlSW5qZWN0b3IoKWAtc3R5bGUgaW5qZWN0b3JzLlxuICpcbiAqIFJlcXVlc3RpbmcgdGhpcyB0b2tlbiBpbnN0ZWFkIG9mIGBJbmplY3RvcmAgYWxsb3dzIGBTdGF0aWNJbmplY3RvcmAgdG8gYmUgdHJlZS1zaGFrZW4gZnJvbSBhXG4gKiBwcm9qZWN0LlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGNvbnN0IElOSkVDVE9SID0gbmV3IEluamVjdGlvblRva2VuPEluamVjdG9yPignSU5KRUNUT1InKTtcblxuZXhwb3J0IGNsYXNzIE51bGxJbmplY3RvciBpbXBsZW1lbnRzIEluamVjdG9yIHtcbiAgZ2V0KHRva2VuOiBhbnksIG5vdEZvdW5kVmFsdWU6IGFueSA9IF9USFJPV19JRl9OT1RfRk9VTkQpOiBhbnkge1xuICAgIGlmIChub3RGb3VuZFZhbHVlID09PSBfVEhST1dfSUZfTk9UX0ZPVU5EKSB7XG4gICAgICAvLyBJbnRlbnRpb25hbGx5IGxlZnQgYmVoaW5kOiBXaXRoIGRldiB0b29scyBvcGVuIHRoZSBkZWJ1Z2dlciB3aWxsIHN0b3AgaGVyZS4gVGhlcmUgaXMgbm9cbiAgICAgIC8vIHJlYXNvbiB3aHkgY29ycmVjdGx5IHdyaXR0ZW4gYXBwbGljYXRpb24gc2hvdWxkIGNhdXNlIHRoaXMgZXhjZXB0aW9uLlxuICAgICAgLy8gVE9ETyhtaXNrbyk6IHVuY29tbWVudCB0aGUgbmV4dCBsaW5lIG9uY2UgYG5nRGV2TW9kZWAgd29ya3Mgd2l0aCBjbG9zdXJlLlxuICAgICAgLy8gaWYobmdEZXZNb2RlKSBkZWJ1Z2dlcjtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgTnVsbEluamVjdG9yRXJyb3I6IE5vIHByb3ZpZGVyIGZvciAke3N0cmluZ2lmeSh0b2tlbil9IWApO1xuICAgIH1cbiAgICByZXR1cm4gbm90Rm91bmRWYWx1ZTtcbiAgfVxufVxuXG4vKipcbiAqIENvbmNyZXRlIGluamVjdG9ycyBpbXBsZW1lbnQgdGhpcyBpbnRlcmZhY2UuXG4gKlxuICogRm9yIG1vcmUgZGV0YWlscywgc2VlIHRoZSBbXCJEZXBlbmRlbmN5IEluamVjdGlvbiBHdWlkZVwiXShndWlkZS9kZXBlbmRlbmN5LWluamVjdGlvbikuXG4gKlxuICogQHVzYWdlTm90ZXNcbiAqICMjIyBFeGFtcGxlXG4gKlxuICoge0BleGFtcGxlIGNvcmUvZGkvdHMvaW5qZWN0b3Jfc3BlYy50cyByZWdpb249J0luamVjdG9yJ31cbiAqXG4gKiBgSW5qZWN0b3JgIHJldHVybnMgaXRzZWxmIHdoZW4gZ2l2ZW4gYEluamVjdG9yYCBhcyBhIHRva2VuOlxuICpcbiAqIHtAZXhhbXBsZSBjb3JlL2RpL3RzL2luamVjdG9yX3NwZWMudHMgcmVnaW9uPSdpbmplY3RJbmplY3Rvcid9XG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgSW5qZWN0b3Ige1xuICBzdGF0aWMgVEhST1dfSUZfTk9UX0ZPVU5EID0gX1RIUk9XX0lGX05PVF9GT1VORDtcbiAgc3RhdGljIE5VTEw6IEluamVjdG9yID0gbmV3IE51bGxJbmplY3RvcigpO1xuXG4gIC8qKlxuICAgKiBSZXRyaWV2ZXMgYW4gaW5zdGFuY2UgZnJvbSB0aGUgaW5qZWN0b3IgYmFzZWQgb24gdGhlIHByb3ZpZGVkIHRva2VuLlxuICAgKiBAcmV0dXJucyBUaGUgaW5zdGFuY2UgZnJvbSB0aGUgaW5qZWN0b3IgaWYgZGVmaW5lZCwgb3RoZXJ3aXNlIHRoZSBgbm90Rm91bmRWYWx1ZWAuXG4gICAqIEB0aHJvd3MgV2hlbiB0aGUgYG5vdEZvdW5kVmFsdWVgIGlzIGB1bmRlZmluZWRgIG9yIGBJbmplY3Rvci5USFJPV19JRl9OT1RfRk9VTkRgLlxuICAgKi9cbiAgYWJzdHJhY3QgZ2V0PFQ+KHRva2VuOiBUeXBlPFQ+fEluamVjdGlvblRva2VuPFQ+LCBub3RGb3VuZFZhbHVlPzogVCwgZmxhZ3M/OiBJbmplY3RGbGFncyk6IFQ7XG4gIC8qKlxuICAgKiBAZGVwcmVjYXRlZCBmcm9tIHY0LjAuMCB1c2UgVHlwZTxUPiBvciBJbmplY3Rpb25Ub2tlbjxUPlxuICAgKiBAc3VwcHJlc3Mge2R1cGxpY2F0ZX1cbiAgICovXG4gIGFic3RyYWN0IGdldCh0b2tlbjogYW55LCBub3RGb3VuZFZhbHVlPzogYW55KTogYW55O1xuXG4gIC8qKlxuICAgKiBAZGVwcmVjYXRlZCBmcm9tIHY1IHVzZSB0aGUgbmV3IHNpZ25hdHVyZSBJbmplY3Rvci5jcmVhdGUob3B0aW9ucylcbiAgICovXG4gIHN0YXRpYyBjcmVhdGUocHJvdmlkZXJzOiBTdGF0aWNQcm92aWRlcltdLCBwYXJlbnQ/OiBJbmplY3Rvcik6IEluamVjdG9yO1xuXG4gIHN0YXRpYyBjcmVhdGUob3B0aW9uczoge3Byb3ZpZGVyczogU3RhdGljUHJvdmlkZXJbXSwgcGFyZW50PzogSW5qZWN0b3IsIG5hbWU/OiBzdHJpbmd9KTogSW5qZWN0b3I7XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBhIG5ldyBJbmplY3RvciB3aGljaCBpcyBjb25maWd1cmUgdXNpbmcgYFN0YXRpY1Byb3ZpZGVyYHMuXG4gICAqXG4gICAqIEB1c2FnZU5vdGVzXG4gICAqICMjIyBFeGFtcGxlXG4gICAqXG4gICAqIHtAZXhhbXBsZSBjb3JlL2RpL3RzL3Byb3ZpZGVyX3NwZWMudHMgcmVnaW9uPSdDb25zdHJ1Y3RvclByb3ZpZGVyJ31cbiAgICovXG4gIHN0YXRpYyBjcmVhdGUoXG4gICAgICBvcHRpb25zOiBTdGF0aWNQcm92aWRlcltdfHtwcm92aWRlcnM6IFN0YXRpY1Byb3ZpZGVyW10sIHBhcmVudD86IEluamVjdG9yLCBuYW1lPzogc3RyaW5nfSxcbiAgICAgIHBhcmVudD86IEluamVjdG9yKTogSW5qZWN0b3Ige1xuICAgIGlmIChBcnJheS5pc0FycmF5KG9wdGlvbnMpKSB7XG4gICAgICByZXR1cm4gbmV3IFN0YXRpY0luamVjdG9yKG9wdGlvbnMsIHBhcmVudCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBuZXcgU3RhdGljSW5qZWN0b3Iob3B0aW9ucy5wcm92aWRlcnMsIG9wdGlvbnMucGFyZW50LCBvcHRpb25zLm5hbWUgfHwgbnVsbCk7XG4gICAgfVxuICB9XG5cbiAgLyoqIEBub2NvbGxhcHNlICovXG4gIHN0YXRpYyBuZ0luamVjdGFibGVEZWYgPSBkZWZpbmVJbmplY3RhYmxlKHtcbiAgICBwcm92aWRlZEluOiAnYW55JyBhcyBhbnksXG4gICAgZmFjdG9yeTogKCkgPT4gaW5qZWN0KElOSkVDVE9SKSxcbiAgfSk7XG5cbiAgLyoqIEBpbnRlcm5hbCAqL1xuICAvKiogQG5vY29sbGFwc2UgKi9cbiAgc3RhdGljIF9fTkdfRUxFTUVOVF9JRF9fOiAoKSA9PiBJbmplY3RvciA9ICgpID0+IFNXSVRDSF9JTkpFQ1RPUl9GQUNUT1JZKCk7XG59XG5cbmV4cG9ydCBjb25zdCBTV0lUQ0hfSU5KRUNUT1JfRkFDVE9SWV9fUE9TVF9SM19fID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiBpbmplY3RJbmplY3RvcigpO1xufTtcbmNvbnN0IFNXSVRDSF9JTkpFQ1RPUl9GQUNUT1JZX19QUkVfUjNfXyA9IG5vb3A7XG5jb25zdCBTV0lUQ0hfSU5KRUNUT1JfRkFDVE9SWTogdHlwZW9mIGluamVjdEluamVjdG9yID0gU1dJVENIX0lOSkVDVE9SX0ZBQ1RPUllfX1BSRV9SM19fO1xuXG5cbmNvbnN0IElERU5UID0gZnVuY3Rpb248VD4odmFsdWU6IFQpOiBUIHtcbiAgcmV0dXJuIHZhbHVlO1xufTtcbmNvbnN0IEVNUFRZID0gPGFueVtdPltdO1xuY29uc3QgQ0lSQ1VMQVIgPSBJREVOVDtcbmNvbnN0IE1VTFRJX1BST1ZJREVSX0ZOID0gZnVuY3Rpb24oKTogYW55W10ge1xuICByZXR1cm4gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzKTtcbn07XG5leHBvcnQgY29uc3QgVVNFX1ZBTFVFID1cbiAgICBnZXRDbG9zdXJlU2FmZVByb3BlcnR5PFZhbHVlUHJvdmlkZXI+KHtwcm92aWRlOiBTdHJpbmcsIHVzZVZhbHVlOiBnZXRDbG9zdXJlU2FmZVByb3BlcnR5fSk7XG5jb25zdCBOR19UT0tFTl9QQVRIID0gJ25nVG9rZW5QYXRoJztcbmNvbnN0IE5HX1RFTVBfVE9LRU5fUEFUSCA9ICduZ1RlbXBUb2tlblBhdGgnO1xuY29uc3QgZW51bSBPcHRpb25GbGFncyB7XG4gIE9wdGlvbmFsID0gMSA8PCAwLFxuICBDaGVja1NlbGYgPSAxIDw8IDEsXG4gIENoZWNrUGFyZW50ID0gMSA8PCAyLFxuICBEZWZhdWx0ID0gQ2hlY2tTZWxmIHwgQ2hlY2tQYXJlbnRcbn1cbmNvbnN0IE5VTExfSU5KRUNUT1IgPSBJbmplY3Rvci5OVUxMO1xuY29uc3QgTkVXX0xJTkUgPSAvXFxuL2dtO1xuY29uc3QgTk9fTkVXX0xJTkUgPSAnybUnO1xuXG5leHBvcnQgY2xhc3MgU3RhdGljSW5qZWN0b3IgaW1wbGVtZW50cyBJbmplY3RvciB7XG4gIHJlYWRvbmx5IHBhcmVudDogSW5qZWN0b3I7XG4gIHJlYWRvbmx5IHNvdXJjZTogc3RyaW5nfG51bGw7XG5cbiAgcHJpdmF0ZSBfcmVjb3JkczogTWFwPGFueSwgUmVjb3JkPjtcblxuICBjb25zdHJ1Y3RvcihcbiAgICAgIHByb3ZpZGVyczogU3RhdGljUHJvdmlkZXJbXSwgcGFyZW50OiBJbmplY3RvciA9IE5VTExfSU5KRUNUT1IsIHNvdXJjZTogc3RyaW5nfG51bGwgPSBudWxsKSB7XG4gICAgdGhpcy5wYXJlbnQgPSBwYXJlbnQ7XG4gICAgdGhpcy5zb3VyY2UgPSBzb3VyY2U7XG4gICAgY29uc3QgcmVjb3JkcyA9IHRoaXMuX3JlY29yZHMgPSBuZXcgTWFwPGFueSwgUmVjb3JkPigpO1xuICAgIHJlY29yZHMuc2V0KFxuICAgICAgICBJbmplY3RvciwgPFJlY29yZD57dG9rZW46IEluamVjdG9yLCBmbjogSURFTlQsIGRlcHM6IEVNUFRZLCB2YWx1ZTogdGhpcywgdXNlTmV3OiBmYWxzZX0pO1xuICAgIHJlY29yZHMuc2V0KFxuICAgICAgICBJTkpFQ1RPUiwgPFJlY29yZD57dG9rZW46IElOSkVDVE9SLCBmbjogSURFTlQsIGRlcHM6IEVNUFRZLCB2YWx1ZTogdGhpcywgdXNlTmV3OiBmYWxzZX0pO1xuICAgIHJlY3Vyc2l2ZWx5UHJvY2Vzc1Byb3ZpZGVycyhyZWNvcmRzLCBwcm92aWRlcnMpO1xuICB9XG5cbiAgZ2V0PFQ+KHRva2VuOiBUeXBlPFQ+fEluamVjdGlvblRva2VuPFQ+LCBub3RGb3VuZFZhbHVlPzogVCwgZmxhZ3M/OiBJbmplY3RGbGFncyk6IFQ7XG4gIGdldCh0b2tlbjogYW55LCBub3RGb3VuZFZhbHVlPzogYW55KTogYW55O1xuICBnZXQodG9rZW46IGFueSwgbm90Rm91bmRWYWx1ZT86IGFueSwgZmxhZ3M6IEluamVjdEZsYWdzID0gSW5qZWN0RmxhZ3MuRGVmYXVsdCk6IGFueSB7XG4gICAgY29uc3QgcmVjb3JkID0gdGhpcy5fcmVjb3Jkcy5nZXQodG9rZW4pO1xuICAgIHRyeSB7XG4gICAgICByZXR1cm4gdHJ5UmVzb2x2ZVRva2VuKHRva2VuLCByZWNvcmQsIHRoaXMuX3JlY29yZHMsIHRoaXMucGFyZW50LCBub3RGb3VuZFZhbHVlLCBmbGFncyk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgY29uc3QgdG9rZW5QYXRoOiBhbnlbXSA9IGVbTkdfVEVNUF9UT0tFTl9QQVRIXTtcbiAgICAgIGlmICh0b2tlbltTT1VSQ0VdKSB7XG4gICAgICAgIHRva2VuUGF0aC51bnNoaWZ0KHRva2VuW1NPVVJDRV0pO1xuICAgICAgfVxuICAgICAgZS5tZXNzYWdlID0gZm9ybWF0RXJyb3IoJ1xcbicgKyBlLm1lc3NhZ2UsIHRva2VuUGF0aCwgdGhpcy5zb3VyY2UpO1xuICAgICAgZVtOR19UT0tFTl9QQVRIXSA9IHRva2VuUGF0aDtcbiAgICAgIGVbTkdfVEVNUF9UT0tFTl9QQVRIXSA9IG51bGw7XG4gICAgICB0aHJvdyBlO1xuICAgIH1cbiAgfVxuXG4gIHRvU3RyaW5nKCkge1xuICAgIGNvbnN0IHRva2VucyA9IDxzdHJpbmdbXT5bXSwgcmVjb3JkcyA9IHRoaXMuX3JlY29yZHM7XG4gICAgcmVjb3Jkcy5mb3JFYWNoKCh2LCB0b2tlbikgPT4gdG9rZW5zLnB1c2goc3RyaW5naWZ5KHRva2VuKSkpO1xuICAgIHJldHVybiBgU3RhdGljSW5qZWN0b3JbJHt0b2tlbnMuam9pbignLCAnKX1dYDtcbiAgfVxufVxuXG50eXBlIFN1cHBvcnRlZFByb3ZpZGVyID1cbiAgICBWYWx1ZVByb3ZpZGVyIHwgRXhpc3RpbmdQcm92aWRlciB8IFN0YXRpY0NsYXNzUHJvdmlkZXIgfCBDb25zdHJ1Y3RvclByb3ZpZGVyIHwgRmFjdG9yeVByb3ZpZGVyO1xuXG5pbnRlcmZhY2UgUmVjb3JkIHtcbiAgZm46IEZ1bmN0aW9uO1xuICB1c2VOZXc6IGJvb2xlYW47XG4gIGRlcHM6IERlcGVuZGVuY3lSZWNvcmRbXTtcbiAgdmFsdWU6IGFueTtcbn1cblxuaW50ZXJmYWNlIERlcGVuZGVuY3lSZWNvcmQge1xuICB0b2tlbjogYW55O1xuICBvcHRpb25zOiBudW1iZXI7XG59XG5cbnR5cGUgVG9rZW5QYXRoID0gQXJyYXk8YW55PjtcblxuZnVuY3Rpb24gcmVzb2x2ZVByb3ZpZGVyKHByb3ZpZGVyOiBTdXBwb3J0ZWRQcm92aWRlcik6IFJlY29yZCB7XG4gIGNvbnN0IGRlcHMgPSBjb21wdXRlRGVwcyhwcm92aWRlcik7XG4gIGxldCBmbjogRnVuY3Rpb24gPSBJREVOVDtcbiAgbGV0IHZhbHVlOiBhbnkgPSBFTVBUWTtcbiAgbGV0IHVzZU5ldzogYm9vbGVhbiA9IGZhbHNlO1xuICBsZXQgcHJvdmlkZSA9IHJlc29sdmVGb3J3YXJkUmVmKHByb3ZpZGVyLnByb3ZpZGUpO1xuICBpZiAoVVNFX1ZBTFVFIGluIHByb3ZpZGVyKSB7XG4gICAgLy8gV2UgbmVlZCB0byB1c2UgVVNFX1ZBTFVFIGluIHByb3ZpZGVyIHNpbmNlIHByb3ZpZGVyLnVzZVZhbHVlIGNvdWxkIGJlIGRlZmluZWQgYXMgdW5kZWZpbmVkLlxuICAgIHZhbHVlID0gKHByb3ZpZGVyIGFzIFZhbHVlUHJvdmlkZXIpLnVzZVZhbHVlO1xuICB9IGVsc2UgaWYgKChwcm92aWRlciBhcyBGYWN0b3J5UHJvdmlkZXIpLnVzZUZhY3RvcnkpIHtcbiAgICBmbiA9IChwcm92aWRlciBhcyBGYWN0b3J5UHJvdmlkZXIpLnVzZUZhY3Rvcnk7XG4gIH0gZWxzZSBpZiAoKHByb3ZpZGVyIGFzIEV4aXN0aW5nUHJvdmlkZXIpLnVzZUV4aXN0aW5nKSB7XG4gICAgLy8gSnVzdCB1c2UgSURFTlRcbiAgfSBlbHNlIGlmICgocHJvdmlkZXIgYXMgU3RhdGljQ2xhc3NQcm92aWRlcikudXNlQ2xhc3MpIHtcbiAgICB1c2VOZXcgPSB0cnVlO1xuICAgIGZuID0gcmVzb2x2ZUZvcndhcmRSZWYoKHByb3ZpZGVyIGFzIFN0YXRpY0NsYXNzUHJvdmlkZXIpLnVzZUNsYXNzKTtcbiAgfSBlbHNlIGlmICh0eXBlb2YgcHJvdmlkZSA9PSAnZnVuY3Rpb24nKSB7XG4gICAgdXNlTmV3ID0gdHJ1ZTtcbiAgICBmbiA9IHByb3ZpZGU7XG4gIH0gZWxzZSB7XG4gICAgdGhyb3cgc3RhdGljRXJyb3IoXG4gICAgICAgICdTdGF0aWNQcm92aWRlciBkb2VzIG5vdCBoYXZlIFt1c2VWYWx1ZXx1c2VGYWN0b3J5fHVzZUV4aXN0aW5nfHVzZUNsYXNzXSBvciBbcHJvdmlkZV0gaXMgbm90IG5ld2FibGUnLFxuICAgICAgICBwcm92aWRlcik7XG4gIH1cbiAgcmV0dXJuIHtkZXBzLCBmbiwgdXNlTmV3LCB2YWx1ZX07XG59XG5cbmZ1bmN0aW9uIG11bHRpUHJvdmlkZXJNaXhFcnJvcih0b2tlbjogYW55KSB7XG4gIHJldHVybiBzdGF0aWNFcnJvcignQ2Fubm90IG1peCBtdWx0aSBwcm92aWRlcnMgYW5kIHJlZ3VsYXIgcHJvdmlkZXJzJywgdG9rZW4pO1xufVxuXG5mdW5jdGlvbiByZWN1cnNpdmVseVByb2Nlc3NQcm92aWRlcnMocmVjb3JkczogTWFwPGFueSwgUmVjb3JkPiwgcHJvdmlkZXI6IFN0YXRpY1Byb3ZpZGVyKSB7XG4gIGlmIChwcm92aWRlcikge1xuICAgIHByb3ZpZGVyID0gcmVzb2x2ZUZvcndhcmRSZWYocHJvdmlkZXIpO1xuICAgIGlmIChwcm92aWRlciBpbnN0YW5jZW9mIEFycmF5KSB7XG4gICAgICAvLyBpZiB3ZSBoYXZlIGFuIGFycmF5IHJlY3Vyc2UgaW50byB0aGUgYXJyYXlcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcHJvdmlkZXIubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgcmVjdXJzaXZlbHlQcm9jZXNzUHJvdmlkZXJzKHJlY29yZHMsIHByb3ZpZGVyW2ldKTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBwcm92aWRlciA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgLy8gRnVuY3Rpb25zIHdlcmUgc3VwcG9ydGVkIGluIFJlZmxlY3RpdmVJbmplY3RvciwgYnV0IGFyZSBub3QgaGVyZS4gRm9yIHNhZmV0eSBnaXZlIHVzZWZ1bFxuICAgICAgLy8gZXJyb3IgbWVzc2FnZXNcbiAgICAgIHRocm93IHN0YXRpY0Vycm9yKCdGdW5jdGlvbi9DbGFzcyBub3Qgc3VwcG9ydGVkJywgcHJvdmlkZXIpO1xuICAgIH0gZWxzZSBpZiAocHJvdmlkZXIgJiYgdHlwZW9mIHByb3ZpZGVyID09PSAnb2JqZWN0JyAmJiBwcm92aWRlci5wcm92aWRlKSB7XG4gICAgICAvLyBBdCB0aGlzIHBvaW50IHdlIGhhdmUgd2hhdCBsb29rcyBsaWtlIGEgcHJvdmlkZXI6IHtwcm92aWRlOiA/LCAuLi4ufVxuICAgICAgbGV0IHRva2VuID0gcmVzb2x2ZUZvcndhcmRSZWYocHJvdmlkZXIucHJvdmlkZSk7XG4gICAgICBjb25zdCByZXNvbHZlZFByb3ZpZGVyID0gcmVzb2x2ZVByb3ZpZGVyKHByb3ZpZGVyKTtcbiAgICAgIGlmIChwcm92aWRlci5tdWx0aSA9PT0gdHJ1ZSkge1xuICAgICAgICAvLyBUaGlzIGlzIGEgbXVsdGkgcHJvdmlkZXIuXG4gICAgICAgIGxldCBtdWx0aVByb3ZpZGVyOiBSZWNvcmR8dW5kZWZpbmVkID0gcmVjb3Jkcy5nZXQodG9rZW4pO1xuICAgICAgICBpZiAobXVsdGlQcm92aWRlcikge1xuICAgICAgICAgIGlmIChtdWx0aVByb3ZpZGVyLmZuICE9PSBNVUxUSV9QUk9WSURFUl9GTikge1xuICAgICAgICAgICAgdGhyb3cgbXVsdGlQcm92aWRlck1peEVycm9yKHRva2VuKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gQ3JlYXRlIGEgcGxhY2Vob2xkZXIgZmFjdG9yeSB3aGljaCB3aWxsIGxvb2sgdXAgdGhlIGNvbnN0aXR1ZW50cyBvZiB0aGUgbXVsdGkgcHJvdmlkZXIuXG4gICAgICAgICAgcmVjb3Jkcy5zZXQodG9rZW4sIG11bHRpUHJvdmlkZXIgPSA8UmVjb3JkPntcbiAgICAgICAgICAgIHRva2VuOiBwcm92aWRlci5wcm92aWRlLFxuICAgICAgICAgICAgZGVwczogW10sXG4gICAgICAgICAgICB1c2VOZXc6IGZhbHNlLFxuICAgICAgICAgICAgZm46IE1VTFRJX1BST1ZJREVSX0ZOLFxuICAgICAgICAgICAgdmFsdWU6IEVNUFRZXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gVHJlYXQgdGhlIHByb3ZpZGVyIGFzIHRoZSB0b2tlbi5cbiAgICAgICAgdG9rZW4gPSBwcm92aWRlcjtcbiAgICAgICAgbXVsdGlQcm92aWRlci5kZXBzLnB1c2goe3Rva2VuLCBvcHRpb25zOiBPcHRpb25GbGFncy5EZWZhdWx0fSk7XG4gICAgICB9XG4gICAgICBjb25zdCByZWNvcmQgPSByZWNvcmRzLmdldCh0b2tlbik7XG4gICAgICBpZiAocmVjb3JkICYmIHJlY29yZC5mbiA9PSBNVUxUSV9QUk9WSURFUl9GTikge1xuICAgICAgICB0aHJvdyBtdWx0aVByb3ZpZGVyTWl4RXJyb3IodG9rZW4pO1xuICAgICAgfVxuICAgICAgcmVjb3Jkcy5zZXQodG9rZW4sIHJlc29sdmVkUHJvdmlkZXIpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBzdGF0aWNFcnJvcignVW5leHBlY3RlZCBwcm92aWRlcicsIHByb3ZpZGVyKTtcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gdHJ5UmVzb2x2ZVRva2VuKFxuICAgIHRva2VuOiBhbnksIHJlY29yZDogUmVjb3JkIHwgdW5kZWZpbmVkLCByZWNvcmRzOiBNYXA8YW55LCBSZWNvcmQ+LCBwYXJlbnQ6IEluamVjdG9yLFxuICAgIG5vdEZvdW5kVmFsdWU6IGFueSwgZmxhZ3M6IEluamVjdEZsYWdzKTogYW55IHtcbiAgdHJ5IHtcbiAgICByZXR1cm4gcmVzb2x2ZVRva2VuKHRva2VuLCByZWNvcmQsIHJlY29yZHMsIHBhcmVudCwgbm90Rm91bmRWYWx1ZSwgZmxhZ3MpO1xuICB9IGNhdGNoIChlKSB7XG4gICAgLy8gZW5zdXJlIHRoYXQgJ2UnIGlzIG9mIHR5cGUgRXJyb3IuXG4gICAgaWYgKCEoZSBpbnN0YW5jZW9mIEVycm9yKSkge1xuICAgICAgZSA9IG5ldyBFcnJvcihlKTtcbiAgICB9XG4gICAgY29uc3QgcGF0aDogYW55W10gPSBlW05HX1RFTVBfVE9LRU5fUEFUSF0gPSBlW05HX1RFTVBfVE9LRU5fUEFUSF0gfHwgW107XG4gICAgcGF0aC51bnNoaWZ0KHRva2VuKTtcbiAgICBpZiAocmVjb3JkICYmIHJlY29yZC52YWx1ZSA9PSBDSVJDVUxBUikge1xuICAgICAgLy8gUmVzZXQgdGhlIENpcmN1bGFyIGZsYWcuXG4gICAgICByZWNvcmQudmFsdWUgPSBFTVBUWTtcbiAgICB9XG4gICAgdGhyb3cgZTtcbiAgfVxufVxuXG5mdW5jdGlvbiByZXNvbHZlVG9rZW4oXG4gICAgdG9rZW46IGFueSwgcmVjb3JkOiBSZWNvcmQgfCB1bmRlZmluZWQsIHJlY29yZHM6IE1hcDxhbnksIFJlY29yZD4sIHBhcmVudDogSW5qZWN0b3IsXG4gICAgbm90Rm91bmRWYWx1ZTogYW55LCBmbGFnczogSW5qZWN0RmxhZ3MpOiBhbnkge1xuICBsZXQgdmFsdWU7XG4gIGlmIChyZWNvcmQgJiYgIShmbGFncyAmIEluamVjdEZsYWdzLlNraXBTZWxmKSkge1xuICAgIC8vIElmIHdlIGRvbid0IGhhdmUgYSByZWNvcmQsIHRoaXMgaW1wbGllcyB0aGF0IHdlIGRvbid0IG93biB0aGUgcHJvdmlkZXIgaGVuY2UgZG9uJ3Qga25vdyBob3dcbiAgICAvLyB0byByZXNvbHZlIGl0LlxuICAgIHZhbHVlID0gcmVjb3JkLnZhbHVlO1xuICAgIGlmICh2YWx1ZSA9PSBDSVJDVUxBUikge1xuICAgICAgdGhyb3cgRXJyb3IoTk9fTkVXX0xJTkUgKyAnQ2lyY3VsYXIgZGVwZW5kZW5jeScpO1xuICAgIH0gZWxzZSBpZiAodmFsdWUgPT09IEVNUFRZKSB7XG4gICAgICByZWNvcmQudmFsdWUgPSBDSVJDVUxBUjtcbiAgICAgIGxldCBvYmogPSB1bmRlZmluZWQ7XG4gICAgICBsZXQgdXNlTmV3ID0gcmVjb3JkLnVzZU5ldztcbiAgICAgIGxldCBmbiA9IHJlY29yZC5mbjtcbiAgICAgIGxldCBkZXBSZWNvcmRzID0gcmVjb3JkLmRlcHM7XG4gICAgICBsZXQgZGVwcyA9IEVNUFRZO1xuICAgICAgaWYgKGRlcFJlY29yZHMubGVuZ3RoKSB7XG4gICAgICAgIGRlcHMgPSBbXTtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBkZXBSZWNvcmRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgY29uc3QgZGVwUmVjb3JkOiBEZXBlbmRlbmN5UmVjb3JkID0gZGVwUmVjb3Jkc1tpXTtcbiAgICAgICAgICBjb25zdCBvcHRpb25zID0gZGVwUmVjb3JkLm9wdGlvbnM7XG4gICAgICAgICAgY29uc3QgY2hpbGRSZWNvcmQgPVxuICAgICAgICAgICAgICBvcHRpb25zICYgT3B0aW9uRmxhZ3MuQ2hlY2tTZWxmID8gcmVjb3Jkcy5nZXQoZGVwUmVjb3JkLnRva2VuKSA6IHVuZGVmaW5lZDtcbiAgICAgICAgICBkZXBzLnB1c2godHJ5UmVzb2x2ZVRva2VuKFxuICAgICAgICAgICAgICAvLyBDdXJyZW50IFRva2VuIHRvIHJlc29sdmVcbiAgICAgICAgICAgICAgZGVwUmVjb3JkLnRva2VuLFxuICAgICAgICAgICAgICAvLyBBIHJlY29yZCB3aGljaCBkZXNjcmliZXMgaG93IHRvIHJlc29sdmUgdGhlIHRva2VuLlxuICAgICAgICAgICAgICAvLyBJZiB1bmRlZmluZWQsIHRoaXMgbWVhbnMgd2UgZG9uJ3QgaGF2ZSBzdWNoIGEgcmVjb3JkXG4gICAgICAgICAgICAgIGNoaWxkUmVjb3JkLFxuICAgICAgICAgICAgICAvLyBPdGhlciByZWNvcmRzIHdlIGtub3cgYWJvdXQuXG4gICAgICAgICAgICAgIHJlY29yZHMsXG4gICAgICAgICAgICAgIC8vIElmIHdlIGRvbid0IGtub3cgaG93IHRvIHJlc29sdmUgZGVwZW5kZW5jeSBhbmQgd2Ugc2hvdWxkIG5vdCBjaGVjayBwYXJlbnQgZm9yIGl0LFxuICAgICAgICAgICAgICAvLyB0aGFuIHBhc3MgaW4gTnVsbCBpbmplY3Rvci5cbiAgICAgICAgICAgICAgIWNoaWxkUmVjb3JkICYmICEob3B0aW9ucyAmIE9wdGlvbkZsYWdzLkNoZWNrUGFyZW50KSA/IE5VTExfSU5KRUNUT1IgOiBwYXJlbnQsXG4gICAgICAgICAgICAgIG9wdGlvbnMgJiBPcHRpb25GbGFncy5PcHRpb25hbCA/IG51bGwgOiBJbmplY3Rvci5USFJPV19JRl9OT1RfRk9VTkQsXG4gICAgICAgICAgICAgIEluamVjdEZsYWdzLkRlZmF1bHQpKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmVjb3JkLnZhbHVlID0gdmFsdWUgPSB1c2VOZXcgPyBuZXcgKGZuIGFzIGFueSkoLi4uZGVwcykgOiBmbi5hcHBseShvYmosIGRlcHMpO1xuICAgIH1cbiAgfSBlbHNlIGlmICghKGZsYWdzICYgSW5qZWN0RmxhZ3MuU2VsZikpIHtcbiAgICB2YWx1ZSA9IHBhcmVudC5nZXQodG9rZW4sIG5vdEZvdW5kVmFsdWUsIEluamVjdEZsYWdzLkRlZmF1bHQpO1xuICB9XG4gIHJldHVybiB2YWx1ZTtcbn1cblxuZnVuY3Rpb24gY29tcHV0ZURlcHMocHJvdmlkZXI6IFN0YXRpY1Byb3ZpZGVyKTogRGVwZW5kZW5jeVJlY29yZFtdIHtcbiAgbGV0IGRlcHM6IERlcGVuZGVuY3lSZWNvcmRbXSA9IEVNUFRZO1xuICBjb25zdCBwcm92aWRlckRlcHM6IGFueVtdID1cbiAgICAgIChwcm92aWRlciBhcyBFeGlzdGluZ1Byb3ZpZGVyICYgU3RhdGljQ2xhc3NQcm92aWRlciAmIENvbnN0cnVjdG9yUHJvdmlkZXIpLmRlcHM7XG4gIGlmIChwcm92aWRlckRlcHMgJiYgcHJvdmlkZXJEZXBzLmxlbmd0aCkge1xuICAgIGRlcHMgPSBbXTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHByb3ZpZGVyRGVwcy5sZW5ndGg7IGkrKykge1xuICAgICAgbGV0IG9wdGlvbnMgPSBPcHRpb25GbGFncy5EZWZhdWx0O1xuICAgICAgbGV0IHRva2VuID0gcmVzb2x2ZUZvcndhcmRSZWYocHJvdmlkZXJEZXBzW2ldKTtcbiAgICAgIGlmICh0b2tlbiBpbnN0YW5jZW9mIEFycmF5KSB7XG4gICAgICAgIGZvciAobGV0IGogPSAwLCBhbm5vdGF0aW9ucyA9IHRva2VuOyBqIDwgYW5ub3RhdGlvbnMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICBjb25zdCBhbm5vdGF0aW9uID0gYW5ub3RhdGlvbnNbal07XG4gICAgICAgICAgaWYgKGFubm90YXRpb24gaW5zdGFuY2VvZiBPcHRpb25hbCB8fCBhbm5vdGF0aW9uID09IE9wdGlvbmFsKSB7XG4gICAgICAgICAgICBvcHRpb25zID0gb3B0aW9ucyB8IE9wdGlvbkZsYWdzLk9wdGlvbmFsO1xuICAgICAgICAgIH0gZWxzZSBpZiAoYW5ub3RhdGlvbiBpbnN0YW5jZW9mIFNraXBTZWxmIHx8IGFubm90YXRpb24gPT0gU2tpcFNlbGYpIHtcbiAgICAgICAgICAgIG9wdGlvbnMgPSBvcHRpb25zICYgfk9wdGlvbkZsYWdzLkNoZWNrU2VsZjtcbiAgICAgICAgICB9IGVsc2UgaWYgKGFubm90YXRpb24gaW5zdGFuY2VvZiBTZWxmIHx8IGFubm90YXRpb24gPT0gU2VsZikge1xuICAgICAgICAgICAgb3B0aW9ucyA9IG9wdGlvbnMgJiB+T3B0aW9uRmxhZ3MuQ2hlY2tQYXJlbnQ7XG4gICAgICAgICAgfSBlbHNlIGlmIChhbm5vdGF0aW9uIGluc3RhbmNlb2YgSW5qZWN0KSB7XG4gICAgICAgICAgICB0b2tlbiA9IChhbm5vdGF0aW9uIGFzIEluamVjdCkudG9rZW47XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRva2VuID0gcmVzb2x2ZUZvcndhcmRSZWYoYW5ub3RhdGlvbik7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBkZXBzLnB1c2goe3Rva2VuLCBvcHRpb25zfSk7XG4gICAgfVxuICB9IGVsc2UgaWYgKChwcm92aWRlciBhcyBFeGlzdGluZ1Byb3ZpZGVyKS51c2VFeGlzdGluZykge1xuICAgIGNvbnN0IHRva2VuID0gcmVzb2x2ZUZvcndhcmRSZWYoKHByb3ZpZGVyIGFzIEV4aXN0aW5nUHJvdmlkZXIpLnVzZUV4aXN0aW5nKTtcbiAgICBkZXBzID0gW3t0b2tlbiwgb3B0aW9uczogT3B0aW9uRmxhZ3MuRGVmYXVsdH1dO1xuICB9IGVsc2UgaWYgKCFwcm92aWRlckRlcHMgJiYgIShVU0VfVkFMVUUgaW4gcHJvdmlkZXIpKSB7XG4gICAgLy8gdXNlVmFsdWUgJiB1c2VFeGlzdGluZyBhcmUgdGhlIG9ubHkgb25lcyB3aGljaCBhcmUgZXhlbXB0IGZyb20gZGVwcyBhbGwgb3RoZXJzIG5lZWQgaXQuXG4gICAgdGhyb3cgc3RhdGljRXJyb3IoJ1xcJ2RlcHNcXCcgcmVxdWlyZWQnLCBwcm92aWRlcik7XG4gIH1cbiAgcmV0dXJuIGRlcHM7XG59XG5cbmZ1bmN0aW9uIGZvcm1hdEVycm9yKHRleHQ6IHN0cmluZywgb2JqOiBhbnksIHNvdXJjZTogc3RyaW5nIHwgbnVsbCA9IG51bGwpOiBzdHJpbmcge1xuICB0ZXh0ID0gdGV4dCAmJiB0ZXh0LmNoYXJBdCgwKSA9PT0gJ1xcbicgJiYgdGV4dC5jaGFyQXQoMSkgPT0gTk9fTkVXX0xJTkUgPyB0ZXh0LnN1YnN0cigyKSA6IHRleHQ7XG4gIGxldCBjb250ZXh0ID0gc3RyaW5naWZ5KG9iaik7XG4gIGlmIChvYmogaW5zdGFuY2VvZiBBcnJheSkge1xuICAgIGNvbnRleHQgPSBvYmoubWFwKHN0cmluZ2lmeSkuam9pbignIC0+ICcpO1xuICB9IGVsc2UgaWYgKHR5cGVvZiBvYmogPT09ICdvYmplY3QnKSB7XG4gICAgbGV0IHBhcnRzID0gPHN0cmluZ1tdPltdO1xuICAgIGZvciAobGV0IGtleSBpbiBvYmopIHtcbiAgICAgIGlmIChvYmouaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgICBsZXQgdmFsdWUgPSBvYmpba2V5XTtcbiAgICAgICAgcGFydHMucHVzaChcbiAgICAgICAgICAgIGtleSArICc6JyArICh0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnID8gSlNPTi5zdHJpbmdpZnkodmFsdWUpIDogc3RyaW5naWZ5KHZhbHVlKSkpO1xuICAgICAgfVxuICAgIH1cbiAgICBjb250ZXh0ID0gYHske3BhcnRzLmpvaW4oJywgJyl9fWA7XG4gIH1cbiAgcmV0dXJuIGBTdGF0aWNJbmplY3RvckVycm9yJHtzb3VyY2UgPyAnKCcgKyBzb3VyY2UgKyAnKScgOiAnJ31bJHtjb250ZXh0fV06ICR7dGV4dC5yZXBsYWNlKE5FV19MSU5FLCAnXFxuICAnKX1gO1xufVxuXG5mdW5jdGlvbiBzdGF0aWNFcnJvcih0ZXh0OiBzdHJpbmcsIG9iajogYW55KTogRXJyb3Ige1xuICByZXR1cm4gbmV3IEVycm9yKGZvcm1hdEVycm9yKHRleHQsIG9iaikpO1xufVxuIl19