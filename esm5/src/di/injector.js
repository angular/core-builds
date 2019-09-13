/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as tslib_1 from "tslib";
import { stringify } from '../util/stringify';
import { resolveForwardRef } from './forward_ref';
import { INJECTOR, NG_TEMP_TOKEN_PATH, NullInjector, THROW_IF_NOT_FOUND, USE_VALUE, catchInjectorError, formatError, setCurrentInjector, ɵɵinject } from './injector_compatibility';
import { getInjectableDef, ɵɵdefineInjectable } from './interface/defs';
import { InjectFlags } from './interface/injector';
import { Inject, Optional, Self, SkipSelf } from './metadata';
import { createInjector } from './r3_injector';
import { INJECTOR_SCOPE } from './scope';
export function INJECTOR_IMPL__PRE_R3__(providers, parent, name) {
    return new StaticInjector(providers, parent, name);
}
export function INJECTOR_IMPL__POST_R3__(providers, parent, name) {
    return createInjector({ name: name }, parent, providers, name);
}
export var INJECTOR_IMPL = INJECTOR_IMPL__PRE_R3__;
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
            return INJECTOR_IMPL(options, parent, '');
        }
        else {
            return INJECTOR_IMPL(options.providers, options.parent, options.name || '');
        }
    };
    Injector.THROW_IF_NOT_FOUND = THROW_IF_NOT_FOUND;
    Injector.NULL = new NullInjector();
    /** @nocollapse */
    Injector.ngInjectableDef = ɵɵdefineInjectable({
        token: Injector,
        providedIn: 'any',
        factory: function () { return ɵɵinject(INJECTOR); },
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
var ɵ0 = IDENT;
var EMPTY = [];
var CIRCULAR = IDENT;
var MULTI_PROVIDER_FN = function () {
    return Array.prototype.slice.call(arguments);
};
var ɵ1 = MULTI_PROVIDER_FN;
var NO_NEW_LINE = 'ɵ';
var StaticInjector = /** @class */ (function () {
    function StaticInjector(providers, parent, source) {
        if (parent === void 0) { parent = Injector.NULL; }
        if (source === void 0) { source = null; }
        this.parent = parent;
        this.source = source;
        var records = this._records = new Map();
        records.set(Injector, { token: Injector, fn: IDENT, deps: EMPTY, value: this, useNew: false });
        records.set(INJECTOR, { token: INJECTOR, fn: IDENT, deps: EMPTY, value: this, useNew: false });
        this.scope = recursivelyProcessProviders(records, providers);
    }
    StaticInjector.prototype.get = function (token, notFoundValue, flags) {
        if (flags === void 0) { flags = InjectFlags.Default; }
        var records = this._records;
        var record = records.get(token);
        if (record === undefined) {
            // This means we have never seen this record, see if it is tree shakable provider.
            var injectableDef = getInjectableDef(token);
            if (injectableDef) {
                var providedIn = injectableDef && injectableDef.providedIn;
                if (providedIn === 'any' || providedIn != null && providedIn === this.scope) {
                    records.set(token, record = resolveProvider({ provide: token, useFactory: injectableDef.factory, deps: EMPTY }));
                }
            }
            if (record === undefined) {
                // Set record to null to make sure that we don't go through expensive lookup above again.
                records.set(token, null);
            }
        }
        var lastInjector = setCurrentInjector(this);
        try {
            return tryResolveToken(token, record, records, this.parent, notFoundValue, flags);
        }
        catch (e) {
            return catchInjectorError(e, token, 'StaticInjectorError', this.source);
        }
        finally {
            setCurrentInjector(lastInjector);
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
    var scope = null;
    if (provider) {
        provider = resolveForwardRef(provider);
        if (provider instanceof Array) {
            // if we have an array recurse into the array
            for (var i = 0; i < provider.length; i++) {
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
                    !childRecord && !(options & 4 /* CheckParent */) ? Injector.NULL : parent, options & 1 /* Optional */ ? null : Injector.THROW_IF_NOT_FOUND, InjectFlags.Default));
                }
            }
            record.value = value = useNew ? new ((_a = fn).bind.apply(_a, tslib_1.__spread([void 0], deps)))() : fn.apply(obj, deps);
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
function staticError(text, obj) {
    return new Error(formatError(text, obj, 'StaticInjectorError'));
}
export { ɵ0, ɵ1 };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5qZWN0b3IuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9kaS9pbmplY3Rvci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7O0FBR0gsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBRTVDLE9BQU8sRUFBQyxpQkFBaUIsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUVoRCxPQUFPLEVBQUMsUUFBUSxFQUFFLGtCQUFrQixFQUFFLFlBQVksRUFBRSxrQkFBa0IsRUFBRSxTQUFTLEVBQUUsa0JBQWtCLEVBQUUsV0FBVyxFQUFFLGtCQUFrQixFQUFFLFFBQVEsRUFBQyxNQUFNLDBCQUEwQixDQUFDO0FBQ2xMLE9BQU8sRUFBQyxnQkFBZ0IsRUFBRSxrQkFBa0IsRUFBQyxNQUFNLGtCQUFrQixDQUFDO0FBQ3RFLE9BQU8sRUFBQyxXQUFXLEVBQUMsTUFBTSxzQkFBc0IsQ0FBQztBQUVqRCxPQUFPLEVBQUMsTUFBTSxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFDLE1BQU0sWUFBWSxDQUFDO0FBQzVELE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFDN0MsT0FBTyxFQUFDLGNBQWMsRUFBQyxNQUFNLFNBQVMsQ0FBQztBQUV2QyxNQUFNLFVBQVUsdUJBQXVCLENBQ25DLFNBQTJCLEVBQUUsTUFBNEIsRUFBRSxJQUFZO0lBQ3pFLE9BQU8sSUFBSSxjQUFjLENBQUMsU0FBUyxFQUFFLE1BQU0sRUFBRSxJQUFJLENBQUMsQ0FBQztBQUNyRCxDQUFDO0FBRUQsTUFBTSxVQUFVLHdCQUF3QixDQUNwQyxTQUEyQixFQUFFLE1BQTRCLEVBQUUsSUFBWTtJQUN6RSxPQUFPLGNBQWMsQ0FBQyxFQUFDLElBQUksRUFBRSxJQUFJLEVBQUMsRUFBRSxNQUFNLEVBQUUsU0FBUyxFQUFFLElBQUksQ0FBQyxD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QUFDLENBQUM7S0FDaEQ7U0FBTSxJQUFJLENBQUMsWUFBWSxJQUFJLENBQUMsQ0FBQyxTQUFTLElBQUksUUFBUSxDQUFDLEVBQUU7UUFDcEQsMEZBQTBGO1FBQzFGLE1BQU0sV0FBVyxDQUFDLG1CQUFtQixFQUFFLFFBQVEsQ0FBQyxDQUFDO0tBQ2xEO0lBQ0QsT0FBTyxJQUFJLENBQUM7QUFDZCxDQUFDO0FBRUQsU0FBUyxXQUFXLENBQUMsSUFBWSxFQUFFLEdBQVE7SUFDekMsT0FBTyxJQUFJLEtBQUssQ0FBQyxXQUFXLENBQUMsSUFBSSxFQUFFLEdBQUcsRUFBRSxxQkFBcUIsQ0FBQyxDQUFDLENBQUM7QUFDbEUsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtBYnN0cmFjdFR5cGUsIFR5cGV9IGZyb20gJy4uL2ludGVyZmFjZS90eXBlJztcbmltcG9ydCB7c3RyaW5naWZ5fSBmcm9tICcuLi91dGlsL3N0cmluZ2lmeSc7XG5cbmltcG9ydCB7cmVzb2x2ZUZvcndhcmRSZWZ9IGZyb20gJy4vZm9yd2FyZF9yZWYnO1xuaW1wb3J0IHtJbmplY3Rpb25Ub2tlbn0gZnJvbSAnLi9pbmplY3Rpb25fdG9rZW4nO1xuaW1wb3J0IHtJTkpFQ1RPUiwgTkdfVEVNUF9UT0tFTl9QQVRILCBOdWxsSW5qZWN0b3IsIFRIUk9XX0lGX05PVF9GT1VORCwgVVNFX1ZBTFVFLCBjYXRjaEluamVjdG9yRXJyb3IsIGZvcm1hdEVycm9yLCBzZXRDdXJyZW50SW5qZWN0b3IsIMm1ybVpbmplY3R9IGZyb20gJy4vaW5qZWN0b3JfY29tcGF0aWJpbGl0eSc7XG5pbXBvcnQge2dldEluamVjdGFibGVEZWYsIMm1ybVkZWZpbmVJbmplY3RhYmxlfSBmcm9tICcuL2ludGVyZmFjZS9kZWZzJztcbmltcG9ydCB7SW5qZWN0RmxhZ3N9IGZyb20gJy4vaW50ZXJmYWNlL2luamVjdG9yJztcbmltcG9ydCB7Q29uc3RydWN0b3JQcm92aWRlciwgRXhpc3RpbmdQcm92aWRlciwgRmFjdG9yeVByb3ZpZGVyLCBTdGF0aWNDbGFzc1Byb3ZpZGVyLCBTdGF0aWNQcm92aWRlciwgVmFsdWVQcm92aWRlcn0gZnJvbSAnLi9pbnRlcmZhY2UvcHJvdmlkZXInO1xuaW1wb3J0IHtJbmplY3QsIE9wdGlvbmFsLCBTZWxmLCBTa2lwU2VsZn0gZnJvbSAnLi9tZXRhZGF0YSc7XG5pbXBvcnQge2NyZWF0ZUluamVjdG9yfSBmcm9tICcuL3IzX2luamVjdG9yJztcbmltcG9ydCB7SU5KRUNUT1JfU0NPUEV9IGZyb20gJy4vc2NvcGUnO1xuXG5leHBvcnQgZnVuY3Rpb24gSU5KRUNUT1JfSU1QTF9fUFJFX1IzX18oXG4gICAgcHJvdmlkZXJzOiBTdGF0aWNQcm92aWRlcltdLCBwYXJlbnQ6IEluamVjdG9yIHwgdW5kZWZpbmVkLCBuYW1lOiBzdHJpbmcpIHtcbiAgcmV0dXJuIG5ldyBTdGF0aWNJbmplY3Rvcihwcm92aWRlcnMsIHBhcmVudCwgbmFtZSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBJTkpFQ1RPUl9JTVBMX19QT1NUX1IzX18oXG4gICAgcHJvdmlkZXJzOiBTdGF0aWNQcm92aWRlcltdLCBwYXJlbnQ6IEluamVjdG9yIHwgdW5kZWZpbmVkLCBuYW1lOiBzdHJpbmcpIHtcbiAgcmV0dXJuIGNyZWF0ZUluamVjdG9yKHtuYW1lOiBuYW1lfSwgcGFyZW50LCBwcm92aWRlcnMsIG5hbWUpO1xufVxuXG5leHBvcnQgY29uc3QgSU5KRUNUT1JfSU1QTCA9IElOSkVDVE9SX0lNUExfX1BSRV9SM19fO1xuXG4vKipcbiAqIENvbmNyZXRlIGluamVjdG9ycyBpbXBsZW1lbnQgdGhpcyBpbnRlcmZhY2UuXG4gKlxuICogRm9yIG1vcmUgZGV0YWlscywgc2VlIHRoZSBbXCJEZXBlbmRlbmN5IEluamVjdGlvbiBHdWlkZVwiXShndWlkZS9kZXBlbmRlbmN5LWluamVjdGlvbikuXG4gKlxuICogQHVzYWdlTm90ZXNcbiAqICMjIyBFeGFtcGxlXG4gKlxuICoge0BleGFtcGxlIGNvcmUvZGkvdHMvaW5qZWN0b3Jfc3BlYy50cyByZWdpb249J0luamVjdG9yJ31cbiAqXG4gKiBgSW5qZWN0b3JgIHJldHVybnMgaXRzZWxmIHdoZW4gZ2l2ZW4gYEluamVjdG9yYCBhcyBhIHRva2VuOlxuICpcbiAqIHtAZXhhbXBsZSBjb3JlL2RpL3RzL2luamVjdG9yX3NwZWMudHMgcmVnaW9uPSdpbmplY3RJbmplY3Rvcid9XG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgSW5qZWN0b3Ige1xuICBzdGF0aWMgVEhST1dfSUZfTk9UX0ZPVU5EID0gVEhST1dfSUZfTk9UX0ZPVU5EO1xuICBzdGF0aWMgTlVMTDogSW5qZWN0b3IgPSBuZXcgTnVsbEluamVjdG9yKCk7XG5cbiAgLyoqXG4gICAqIFJldHJpZXZlcyBhbiBpbnN0YW5jZSBmcm9tIHRoZSBpbmplY3RvciBiYXNlZCBvbiB0aGUgcHJvdmlkZWQgdG9rZW4uXG4gICAqIEByZXR1cm5zIFRoZSBpbnN0YW5jZSBmcm9tIHRoZSBpbmplY3RvciBpZiBkZWZpbmVkLCBvdGhlcndpc2UgdGhlIGBub3RGb3VuZFZhbHVlYC5cbiAgICogQHRocm93cyBXaGVuIHRoZSBgbm90Rm91bmRWYWx1ZWAgaXMgYHVuZGVmaW5lZGAgb3IgYEluamVjdG9yLlRIUk9XX0lGX05PVF9GT1VORGAuXG4gICAqL1xuICBhYnN0cmFjdCBnZXQ8VD4oXG4gICAgICB0b2tlbjogVHlwZTxUPnxJbmplY3Rpb25Ub2tlbjxUPnxBYnN0cmFjdFR5cGU8VD4sIG5vdEZvdW5kVmFsdWU/OiBULCBmbGFncz86IEluamVjdEZsYWdzKTogVDtcbiAgLyoqXG4gICAqIEBkZXByZWNhdGVkIGZyb20gdjQuMC4wIHVzZSBUeXBlPFQ+IG9yIEluamVjdGlvblRva2VuPFQ+XG4gICAqIEBzdXBwcmVzcyB7ZHVwbGljYXRlfVxuICAgKi9cbiAgYWJzdHJhY3QgZ2V0KHRva2VuOiBhbnksIG5vdEZvdW5kVmFsdWU/OiBhbnkpOiBhbnk7XG5cbiAgLyoqXG4gICAqIEBkZXByZWNhdGVkIGZyb20gdjUgdXNlIHRoZSBuZXcgc2lnbmF0dXJlIEluamVjdG9yLmNyZWF0ZShvcHRpb25zKVxuICAgKi9cbiAgc3RhdGljIGNyZWF0ZShwcm92aWRlcnM6IFN0YXRpY1Byb3ZpZGVyW10sIHBhcmVudD86IEluamVjdG9yKTogSW5qZWN0b3I7XG5cbiAgc3RhdGljIGNyZWF0ZShvcHRpb25zOiB7cHJvdmlkZXJzOiBTdGF0aWNQcm92aWRlcltdLCBwYXJlbnQ/OiBJbmplY3RvciwgbmFtZT86IHN0cmluZ30pOiBJbmplY3RvcjtcblxuICAvKipcbiAgICogQ3JlYXRlIGEgbmV3IEluamVjdG9yIHdoaWNoIGlzIGNvbmZpZ3VyZSB1c2luZyBgU3RhdGljUHJvdmlkZXJgcy5cbiAgICpcbiAgICogQHVzYWdlTm90ZXNcbiAgICogIyMjIEV4YW1wbGVcbiAgICpcbiAgICoge0BleGFtcGxlIGNvcmUvZGkvdHMvcHJvdmlkZXJfc3BlYy50cyByZWdpb249J0NvbnN0cnVjdG9yUHJvdmlkZXInfVxuICAgKi9cbiAgc3RhdGljIGNyZWF0ZShcbiAgICAgIG9wdGlvbnM6IFN0YXRpY1Byb3ZpZGVyW118e3Byb3ZpZGVyczogU3RhdGljUHJvdmlkZXJbXSwgcGFyZW50PzogSW5qZWN0b3IsIG5hbWU/OiBzdHJpbmd9LFxuICAgICAgcGFyZW50PzogSW5qZWN0b3IpOiBJbmplY3RvciB7XG4gICAgaWYgKEFycmF5LmlzQXJyYXkob3B0aW9ucykpIHtcbiAgICAgIHJldHVybiBJTkpFQ1RPUl9JTVBMKG9wdGlvbnMsIHBhcmVudCwgJycpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gSU5KRUNUT1JfSU1QTChvcHRpb25zLnByb3ZpZGVycywgb3B0aW9ucy5wYXJlbnQsIG9wdGlvbnMubmFtZSB8fCAnJyk7XG4gICAgfVxuICB9XG5cbiAgLyoqIEBub2NvbGxhcHNlICovXG4gIHN0YXRpYyBuZ0luamVjdGFibGVEZWYgPSDJtcm1ZGVmaW5lSW5qZWN0YWJsZSh7XG4gICAgdG9rZW46IEluamVjdG9yLFxuICAgIHByb3ZpZGVkSW46ICdhbnknIGFzIGFueSxcbiAgICBmYWN0b3J5OiAoKSA9PiDJtcm1aW5qZWN0KElOSkVDVE9SKSxcbiAgfSk7XG5cbiAgLyoqXG4gICAqIEBpbnRlcm5hbFxuICAgKiBAbm9jb2xsYXBzZVxuICAgKi9cbiAgc3RhdGljIF9fTkdfRUxFTUVOVF9JRF9fID0gLTE7XG59XG5cblxuXG5jb25zdCBJREVOVCA9IGZ1bmN0aW9uPFQ+KHZhbHVlOiBUKTogVCB7XG4gIHJldHVybiB2YWx1ZTtcbn07XG5jb25zdCBFTVBUWSA9IDxhbnlbXT5bXTtcbmNvbnN0IENJUkNVTEFSID0gSURFTlQ7XG5jb25zdCBNVUxUSV9QUk9WSURFUl9GTiA9IGZ1bmN0aW9uKCk6IGFueVtdIHtcbiAgcmV0dXJuIEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cyk7XG59O1xuXG5jb25zdCBlbnVtIE9wdGlvbkZsYWdzIHtcbiAgT3B0aW9uYWwgPSAxIDw8IDAsXG4gIENoZWNrU2VsZiA9IDEgPDwgMSxcbiAgQ2hlY2tQYXJlbnQgPSAxIDw8IDIsXG4gIERlZmF1bHQgPSBDaGVja1NlbGYgfCBDaGVja1BhcmVudFxufVxuY29uc3QgTk9fTkVXX0xJTkUgPSAnybUnO1xuXG5leHBvcnQgY2xhc3MgU3RhdGljSW5qZWN0b3IgaW1wbGVtZW50cyBJbmplY3RvciB7XG4gIHJlYWRvbmx5IHBhcmVudDogSW5qZWN0b3I7XG4gIHJlYWRvbmx5IHNvdXJjZTogc3RyaW5nfG51bGw7XG4gIHJlYWRvbmx5IHNjb3BlOiBzdHJpbmd8bnVsbDtcblxuICBwcml2YXRlIF9yZWNvcmRzOiBNYXA8YW55LCBSZWNvcmR8bnVsbD47XG5cbiAgY29uc3RydWN0b3IoXG4gICAgICBwcm92aWRlcnM6IFN0YXRpY1Byb3ZpZGVyW10sIHBhcmVudDogSW5qZWN0b3IgPSBJbmplY3Rvci5OVUxMLCBzb3VyY2U6IHN0cmluZ3xudWxsID0gbnVsbCkge1xuICAgIHRoaXMucGFyZW50ID0gcGFyZW50O1xuICAgIHRoaXMuc291cmNlID0gc291cmNlO1xuICAgIGNvbnN0IHJlY29yZHMgPSB0aGlzLl9yZWNvcmRzID0gbmV3IE1hcDxhbnksIFJlY29yZD4oKTtcbiAgICByZWNvcmRzLnNldChcbiAgICAgICAgSW5qZWN0b3IsIDxSZWNvcmQ+e3Rva2VuOiBJbmplY3RvciwgZm46IElERU5ULCBkZXBzOiBFTVBUWSwgdmFsdWU6IHRoaXMsIHVzZU5ldzogZmFsc2V9KTtcbiAgICByZWNvcmRzLnNldChcbiAgICAgICAgSU5KRUNUT1IsIDxSZWNvcmQ+e3Rva2VuOiBJTkpFQ1RPUiwgZm46IElERU5ULCBkZXBzOiBFTVBUWSwgdmFsdWU6IHRoaXMsIHVzZU5ldzogZmFsc2V9KTtcbiAgICB0aGlzLnNjb3BlID0gcmVjdXJzaXZlbHlQcm9jZXNzUHJvdmlkZXJzKHJlY29yZHMsIHByb3ZpZGVycyk7XG4gIH1cblxuICBnZXQ8VD4odG9rZW46IFR5cGU8VD58SW5qZWN0aW9uVG9rZW48VD4sIG5vdEZvdW5kVmFsdWU/OiBULCBmbGFncz86IEluamVjdEZsYWdzKTogVDtcbiAgZ2V0KHRva2VuOiBhbnksIG5vdEZvdW5kVmFsdWU/OiBhbnkpOiBhbnk7XG4gIGdldCh0b2tlbjogYW55LCBub3RGb3VuZFZhbHVlPzogYW55LCBmbGFnczogSW5qZWN0RmxhZ3MgPSBJbmplY3RGbGFncy5EZWZhdWx0KTogYW55IHtcbiAgICBjb25zdCByZWNvcmRzID0gdGhpcy5fcmVjb3JkcztcbiAgICBsZXQgcmVjb3JkID0gcmVjb3Jkcy5nZXQodG9rZW4pO1xuICAgIGlmIChyZWNvcmQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgLy8gVGhpcyBtZWFucyB3ZSBoYXZlIG5ldmVyIHNlZW4gdGhpcyByZWNvcmQsIHNlZSBpZiBpdCBpcyB0cmVlIHNoYWthYmxlIHByb3ZpZGVyLlxuICAgICAgY29uc3QgaW5qZWN0YWJsZURlZiA9IGdldEluamVjdGFibGVEZWYodG9rZW4pO1xuICAgICAgaWYgKGluamVjdGFibGVEZWYpIHtcbiAgICAgICAgY29uc3QgcHJvdmlkZWRJbiA9IGluamVjdGFibGVEZWYgJiYgaW5qZWN0YWJsZURlZi5wcm92aWRlZEluO1xuICAgICAgICBpZiAocHJvdmlkZWRJbiA9PT0gJ2FueScgfHwgcHJvdmlkZWRJbiAhPSBudWxsICYmIHByb3ZpZGVkSW4gPT09IHRoaXMuc2NvcGUpIHtcbiAgICAgICAgICByZWNvcmRzLnNldChcbiAgICAgICAgICAgICAgdG9rZW4sIHJlY29yZCA9IHJlc29sdmVQcm92aWRlcihcbiAgICAgICAgICAgICAgICAgICAgICAgICB7cHJvdmlkZTogdG9rZW4sIHVzZUZhY3Rvcnk6IGluamVjdGFibGVEZWYuZmFjdG9yeSwgZGVwczogRU1QVFl9KSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmIChyZWNvcmQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAvLyBTZXQgcmVjb3JkIHRvIG51bGwgdG8gbWFrZSBzdXJlIHRoYXQgd2UgZG9uJ3QgZ28gdGhyb3VnaCBleHBlbnNpdmUgbG9va3VwIGFib3ZlIGFnYWluLlxuICAgICAgICByZWNvcmRzLnNldCh0b2tlbiwgbnVsbCk7XG4gICAgICB9XG4gICAgfVxuICAgIGxldCBsYXN0SW5qZWN0b3IgPSBzZXRDdXJyZW50SW5qZWN0b3IodGhpcyk7XG4gICAgdHJ5IHtcbiAgICAgIHJldHVybiB0cnlSZXNvbHZlVG9rZW4odG9rZW4sIHJlY29yZCwgcmVjb3JkcywgdGhpcy5wYXJlbnQsIG5vdEZvdW5kVmFsdWUsIGZsYWdzKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICByZXR1cm4gY2F0Y2hJbmplY3RvckVycm9yKGUsIHRva2VuLCAnU3RhdGljSW5qZWN0b3JFcnJvcicsIHRoaXMuc291cmNlKTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgc2V0Q3VycmVudEluamVjdG9yKGxhc3RJbmplY3Rvcik7XG4gICAgfVxuICB9XG5cbiAgdG9TdHJpbmcoKSB7XG4gICAgY29uc3QgdG9rZW5zID0gPHN0cmluZ1tdPltdLCByZWNvcmRzID0gdGhpcy5fcmVjb3JkcztcbiAgICByZWNvcmRzLmZvckVhY2goKHYsIHRva2VuKSA9PiB0b2tlbnMucHVzaChzdHJpbmdpZnkodG9rZW4pKSk7XG4gICAgcmV0dXJuIGBTdGF0aWNJbmplY3Rvclske3Rva2Vucy5qb2luKCcsICcpfV1gO1xuICB9XG59XG5cbnR5cGUgU3VwcG9ydGVkUHJvdmlkZXIgPVxuICAgIFZhbHVlUHJvdmlkZXIgfCBFeGlzdGluZ1Byb3ZpZGVyIHwgU3RhdGljQ2xhc3NQcm92aWRlciB8IENvbnN0cnVjdG9yUHJvdmlkZXIgfCBGYWN0b3J5UHJvdmlkZXI7XG5cbmludGVyZmFjZSBSZWNvcmQge1xuICBmbjogRnVuY3Rpb247XG4gIHVzZU5ldzogYm9vbGVhbjtcbiAgZGVwczogRGVwZW5kZW5jeVJlY29yZFtdO1xuICB2YWx1ZTogYW55O1xufVxuXG5pbnRlcmZhY2UgRGVwZW5kZW5jeVJlY29yZCB7XG4gIHRva2VuOiBhbnk7XG4gIG9wdGlvbnM6IG51bWJlcjtcbn1cblxuZnVuY3Rpb24gcmVzb2x2ZVByb3ZpZGVyKHByb3ZpZGVyOiBTdXBwb3J0ZWRQcm92aWRlcik6IFJlY29yZCB7XG4gIGNvbnN0IGRlcHMgPSBjb21wdXRlRGVwcyhwcm92aWRlcik7XG4gIGxldCBmbjogRnVuY3Rpb24gPSBJREVOVDtcbiAgbGV0IHZhbHVlOiBhbnkgPSBFTVBUWTtcbiAgbGV0IHVzZU5ldzogYm9vbGVhbiA9IGZhbHNlO1xuICBsZXQgcHJvdmlkZSA9IHJlc29sdmVGb3J3YXJkUmVmKHByb3ZpZGVyLnByb3ZpZGUpO1xuICBpZiAoVVNFX1ZBTFVFIGluIHByb3ZpZGVyKSB7XG4gICAgLy8gV2UgbmVlZCB0byB1c2UgVVNFX1ZBTFVFIGluIHByb3ZpZGVyIHNpbmNlIHByb3ZpZGVyLnVzZVZhbHVlIGNvdWxkIGJlIGRlZmluZWQgYXMgdW5kZWZpbmVkLlxuICAgIHZhbHVlID0gKHByb3ZpZGVyIGFzIFZhbHVlUHJvdmlkZXIpLnVzZVZhbHVlO1xuICB9IGVsc2UgaWYgKChwcm92aWRlciBhcyBGYWN0b3J5UHJvdmlkZXIpLnVzZUZhY3RvcnkpIHtcbiAgICBmbiA9IChwcm92aWRlciBhcyBGYWN0b3J5UHJvdmlkZXIpLnVzZUZhY3Rvcnk7XG4gIH0gZWxzZSBpZiAoKHByb3ZpZGVyIGFzIEV4aXN0aW5nUHJvdmlkZXIpLnVzZUV4aXN0aW5nKSB7XG4gICAgLy8gSnVzdCB1c2UgSURFTlRcbiAgfSBlbHNlIGlmICgocHJvdmlkZXIgYXMgU3RhdGljQ2xhc3NQcm92aWRlcikudXNlQ2xhc3MpIHtcbiAgICB1c2VOZXcgPSB0cnVlO1xuICAgIGZuID0gcmVzb2x2ZUZvcndhcmRSZWYoKHByb3ZpZGVyIGFzIFN0YXRpY0NsYXNzUHJvdmlkZXIpLnVzZUNsYXNzKTtcbiAgfSBlbHNlIGlmICh0eXBlb2YgcHJvdmlkZSA9PSAnZnVuY3Rpb24nKSB7XG4gICAgdXNlTmV3ID0gdHJ1ZTtcbiAgICBmbiA9IHByb3ZpZGU7XG4gIH0gZWxzZSB7XG4gICAgdGhyb3cgc3RhdGljRXJyb3IoXG4gICAgICAgICdTdGF0aWNQcm92aWRlciBkb2VzIG5vdCBoYXZlIFt1c2VWYWx1ZXx1c2VGYWN0b3J5fHVzZUV4aXN0aW5nfHVzZUNsYXNzXSBvciBbcHJvdmlkZV0gaXMgbm90IG5ld2FibGUnLFxuICAgICAgICBwcm92aWRlcik7XG4gIH1cbiAgcmV0dXJuIHtkZXBzLCBmbiwgdXNlTmV3LCB2YWx1ZX07XG59XG5cbmZ1bmN0aW9uIG11bHRpUHJvdmlkZXJNaXhFcnJvcih0b2tlbjogYW55KSB7XG4gIHJldHVybiBzdGF0aWNFcnJvcignQ2Fubm90IG1peCBtdWx0aSBwcm92aWRlcnMgYW5kIHJlZ3VsYXIgcHJvdmlkZXJzJywgdG9rZW4pO1xufVxuXG5mdW5jdGlvbiByZWN1cnNpdmVseVByb2Nlc3NQcm92aWRlcnMocmVjb3JkczogTWFwPGFueSwgUmVjb3JkPiwgcHJvdmlkZXI6IFN0YXRpY1Byb3ZpZGVyKTogc3RyaW5nfFxuICAgIG51bGwge1xuICBsZXQgc2NvcGU6IHN0cmluZ3xudWxsID0gbnVsbDtcbiAgaWYgKHByb3ZpZGVyKSB7XG4gICAgcHJvdmlkZXIgPSByZXNvbHZlRm9yd2FyZFJlZihwcm92aWRlcik7XG4gICAgaWYgKHByb3ZpZGVyIGluc3RhbmNlb2YgQXJyYXkpIHtcbiAgICAgIC8vIGlmIHdlIGhhdmUgYW4gYXJyYXkgcmVjdXJzZSBpbnRvIHRoZSBhcnJheVxuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwcm92aWRlci5sZW5ndGg7IGkrKykge1xuICAgICAgICBzY29wZSA9IHJlY3Vyc2l2ZWx5UHJvY2Vzc1Byb3ZpZGVycyhyZWNvcmRzLCBwcm92aWRlcltpXSkgfHwgc2NvcGU7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmICh0eXBlb2YgcHJvdmlkZXIgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIC8vIEZ1bmN0aW9ucyB3ZXJlIHN1cHBvcnRlZCBpbiBSZWZsZWN0aXZlSW5qZWN0b3IsIGJ1dCBhcmUgbm90IGhlcmUuIEZvciBzYWZldHkgZ2l2ZSB1c2VmdWxcbiAgICAgIC8vIGVycm9yIG1lc3NhZ2VzXG4gICAgICB0aHJvdyBzdGF0aWNFcnJvcignRnVuY3Rpb24vQ2xhc3Mgbm90IHN1cHBvcnRlZCcsIHByb3ZpZGVyKTtcbiAgICB9IGVsc2UgaWYgKHByb3ZpZGVyICYmIHR5cGVvZiBwcm92aWRlciA9PT0gJ29iamVjdCcgJiYgcHJvdmlkZXIucHJvdmlkZSkge1xuICAgICAgLy8gQXQgdGhpcyBwb2ludCB3ZSBoYXZlIHdoYXQgbG9va3MgbGlrZSBhIHByb3ZpZGVyOiB7cHJvdmlkZTogPywgLi4uLn1cbiAgICAgIGxldCB0b2tlbiA9IHJlc29sdmVGb3J3YXJkUmVmKHByb3ZpZGVyLnByb3ZpZGUpO1xuICAgICAgY29uc3QgcmVzb2x2ZWRQcm92aWRlciA9IHJlc29sdmVQcm92aWRlcihwcm92aWRlcik7XG4gICAgICBpZiAocHJvdmlkZXIubXVsdGkgPT09IHRydWUpIHtcbiAgICAgICAgLy8gVGhpcyBpcyBhIG11bHRpIHByb3ZpZGVyLlxuICAgICAgICBsZXQgbXVsdGlQcm92aWRlcjogUmVjb3JkfHVuZGVmaW5lZCA9IHJlY29yZHMuZ2V0KHRva2VuKTtcbiAgICAgICAgaWYgKG11bHRpUHJvdmlkZXIpIHtcbiAgICAgICAgICBpZiAobXVsdGlQcm92aWRlci5mbiAhPT0gTVVMVElfUFJPVklERVJfRk4pIHtcbiAgICAgICAgICAgIHRocm93IG11bHRpUHJvdmlkZXJNaXhFcnJvcih0b2tlbik7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIENyZWF0ZSBhIHBsYWNlaG9sZGVyIGZhY3Rvcnkgd2hpY2ggd2lsbCBsb29rIHVwIHRoZSBjb25zdGl0dWVudHMgb2YgdGhlIG11bHRpIHByb3ZpZGVyLlxuICAgICAgICAgIHJlY29yZHMuc2V0KHRva2VuLCBtdWx0aVByb3ZpZGVyID0gPFJlY29yZD57XG4gICAgICAgICAgICB0b2tlbjogcHJvdmlkZXIucHJvdmlkZSxcbiAgICAgICAgICAgIGRlcHM6IFtdLFxuICAgICAgICAgICAgdXNlTmV3OiBmYWxzZSxcbiAgICAgICAgICAgIGZuOiBNVUxUSV9QUk9WSURFUl9GTixcbiAgICAgICAgICAgIHZhbHVlOiBFTVBUWVxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIC8vIFRyZWF0IHRoZSBwcm92aWRlciBhcyB0aGUgdG9rZW4uXG4gICAgICAgIHRva2VuID0gcHJvdmlkZXI7XG4gICAgICAgIG11bHRpUHJvdmlkZXIuZGVwcy5wdXNoKHt0b2tlbiwgb3B0aW9uczogT3B0aW9uRmxhZ3MuRGVmYXVsdH0pO1xuICAgICAgfVxuICAgICAgY29uc3QgcmVjb3JkID0gcmVjb3Jkcy5nZXQodG9rZW4pO1xuICAgICAgaWYgKHJlY29yZCAmJiByZWNvcmQuZm4gPT0gTVVMVElfUFJPVklERVJfRk4pIHtcbiAgICAgICAgdGhyb3cgbXVsdGlQcm92aWRlck1peEVycm9yKHRva2VuKTtcbiAgICAgIH1cbiAgICAgIGlmICh0b2tlbiA9PT0gSU5KRUNUT1JfU0NPUEUpIHtcbiAgICAgICAgc2NvcGUgPSByZXNvbHZlZFByb3ZpZGVyLnZhbHVlO1xuICAgICAgfVxuICAgICAgcmVjb3Jkcy5zZXQodG9rZW4sIHJlc29sdmVkUHJvdmlkZXIpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBzdGF0aWNFcnJvcignVW5leHBlY3RlZCBwcm92aWRlcicsIHByb3ZpZGVyKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHNjb3BlO1xufVxuXG5mdW5jdGlvbiB0cnlSZXNvbHZlVG9rZW4oXG4gICAgdG9rZW46IGFueSwgcmVjb3JkOiBSZWNvcmQgfCB1bmRlZmluZWQgfCBudWxsLCByZWNvcmRzOiBNYXA8YW55LCBSZWNvcmR8bnVsbD4sIHBhcmVudDogSW5qZWN0b3IsXG4gICAgbm90Rm91bmRWYWx1ZTogYW55LCBmbGFnczogSW5qZWN0RmxhZ3MpOiBhbnkge1xuICB0cnkge1xuICAgIHJldHVybiByZXNvbHZlVG9rZW4odG9rZW4sIHJlY29yZCwgcmVjb3JkcywgcGFyZW50LCBub3RGb3VuZFZhbHVlLCBmbGFncyk7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICAvLyBlbnN1cmUgdGhhdCAnZScgaXMgb2YgdHlwZSBFcnJvci5cbiAgICBpZiAoIShlIGluc3RhbmNlb2YgRXJyb3IpKSB7XG4gICAgICBlID0gbmV3IEVycm9yKGUpO1xuICAgIH1cbiAgICBjb25zdCBwYXRoOiBhbnlbXSA9IGVbTkdfVEVNUF9UT0tFTl9QQVRIXSA9IGVbTkdfVEVNUF9UT0tFTl9QQVRIXSB8fCBbXTtcbiAgICBwYXRoLnVuc2hpZnQodG9rZW4pO1xuICAgIGlmIChyZWNvcmQgJiYgcmVjb3JkLnZhbHVlID09IENJUkNVTEFSKSB7XG4gICAgICAvLyBSZXNldCB0aGUgQ2lyY3VsYXIgZmxhZy5cbiAgICAgIHJlY29yZC52YWx1ZSA9IEVNUFRZO1xuICAgIH1cbiAgICB0aHJvdyBlO1xuICB9XG59XG5cbmZ1bmN0aW9uIHJlc29sdmVUb2tlbihcbiAgICB0b2tlbjogYW55LCByZWNvcmQ6IFJlY29yZCB8IHVuZGVmaW5lZCB8IG51bGwsIHJlY29yZHM6IE1hcDxhbnksIFJlY29yZHxudWxsPiwgcGFyZW50OiBJbmplY3RvcixcbiAgICBub3RGb3VuZFZhbHVlOiBhbnksIGZsYWdzOiBJbmplY3RGbGFncyk6IGFueSB7XG4gIGxldCB2YWx1ZTtcbiAgaWYgKHJlY29yZCAmJiAhKGZsYWdzICYgSW5qZWN0RmxhZ3MuU2tpcFNlbGYpKSB7XG4gICAgLy8gSWYgd2UgZG9uJ3QgaGF2ZSBhIHJlY29yZCwgdGhpcyBpbXBsaWVzIHRoYXQgd2UgZG9uJ3Qgb3duIHRoZSBwcm92aWRlciBoZW5jZSBkb24ndCBrbm93IGhvd1xuICAgIC8vIHRvIHJlc29sdmUgaXQuXG4gICAgdmFsdWUgPSByZWNvcmQudmFsdWU7XG4gICAgaWYgKHZhbHVlID09IENJUkNVTEFSKSB7XG4gICAgICB0aHJvdyBFcnJvcihOT19ORVdfTElORSArICdDaXJjdWxhciBkZXBlbmRlbmN5Jyk7XG4gICAgfSBlbHNlIGlmICh2YWx1ZSA9PT0gRU1QVFkpIHtcbiAgICAgIHJlY29yZC52YWx1ZSA9IENJUkNVTEFSO1xuICAgICAgbGV0IG9iaiA9IHVuZGVmaW5lZDtcbiAgICAgIGxldCB1c2VOZXcgPSByZWNvcmQudXNlTmV3O1xuICAgICAgbGV0IGZuID0gcmVjb3JkLmZuO1xuICAgICAgbGV0IGRlcFJlY29yZHMgPSByZWNvcmQuZGVwcztcbiAgICAgIGxldCBkZXBzID0gRU1QVFk7XG4gICAgICBpZiAoZGVwUmVjb3Jkcy5sZW5ndGgpIHtcbiAgICAgICAgZGVwcyA9IFtdO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRlcFJlY29yZHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBjb25zdCBkZXBSZWNvcmQ6IERlcGVuZGVuY3lSZWNvcmQgPSBkZXBSZWNvcmRzW2ldO1xuICAgICAgICAgIGNvbnN0IG9wdGlvbnMgPSBkZXBSZWNvcmQub3B0aW9ucztcbiAgICAgICAgICBjb25zdCBjaGlsZFJlY29yZCA9XG4gICAgICAgICAgICAgIG9wdGlvbnMgJiBPcHRpb25GbGFncy5DaGVja1NlbGYgPyByZWNvcmRzLmdldChkZXBSZWNvcmQudG9rZW4pIDogdW5kZWZpbmVkO1xuICAgICAgICAgIGRlcHMucHVzaCh0cnlSZXNvbHZlVG9rZW4oXG4gICAgICAgICAgICAgIC8vIEN1cnJlbnQgVG9rZW4gdG8gcmVzb2x2ZVxuICAgICAgICAgICAgICBkZXBSZWNvcmQudG9rZW4sXG4gICAgICAgICAgICAgIC8vIEEgcmVjb3JkIHdoaWNoIGRlc2NyaWJlcyBob3cgdG8gcmVzb2x2ZSB0aGUgdG9rZW4uXG4gICAgICAgICAgICAgIC8vIElmIHVuZGVmaW5lZCwgdGhpcyBtZWFucyB3ZSBkb24ndCBoYXZlIHN1Y2ggYSByZWNvcmRcbiAgICAgICAgICAgICAgY2hpbGRSZWNvcmQsXG4gICAgICAgICAgICAgIC8vIE90aGVyIHJlY29yZHMgd2Uga25vdyBhYm91dC5cbiAgICAgICAgICAgICAgcmVjb3JkcyxcbiAgICAgICAgICAgICAgLy8gSWYgd2UgZG9uJ3Qga25vdyBob3cgdG8gcmVzb2x2ZSBkZXBlbmRlbmN5IGFuZCB3ZSBzaG91bGQgbm90IGNoZWNrIHBhcmVudCBmb3IgaXQsXG4gICAgICAgICAgICAgIC8vIHRoYW4gcGFzcyBpbiBOdWxsIGluamVjdG9yLlxuICAgICAgICAgICAgICAhY2hpbGRSZWNvcmQgJiYgIShvcHRpb25zICYgT3B0aW9uRmxhZ3MuQ2hlY2tQYXJlbnQpID8gSW5qZWN0b3IuTlVMTCA6IHBhcmVudCxcbiAgICAgICAgICAgICAgb3B0aW9ucyAmIE9wdGlvbkZsYWdzLk9wdGlvbmFsID8gbnVsbCA6IEluamVjdG9yLlRIUk9XX0lGX05PVF9GT1VORCxcbiAgICAgICAgICAgICAgSW5qZWN0RmxhZ3MuRGVmYXVsdCkpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZWNvcmQudmFsdWUgPSB2YWx1ZSA9IHVzZU5ldyA/IG5ldyAoZm4gYXMgYW55KSguLi5kZXBzKSA6IGZuLmFwcGx5KG9iaiwgZGVwcyk7XG4gICAgfVxuICB9IGVsc2UgaWYgKCEoZmxhZ3MgJiBJbmplY3RGbGFncy5TZWxmKSkge1xuICAgIHZhbHVlID0gcGFyZW50LmdldCh0b2tlbiwgbm90Rm91bmRWYWx1ZSwgSW5qZWN0RmxhZ3MuRGVmYXVsdCk7XG4gIH0gZWxzZSBpZiAoIShmbGFncyAmIEluamVjdEZsYWdzLk9wdGlvbmFsKSkge1xuICAgIHZhbHVlID0gSW5qZWN0b3IuTlVMTC5nZXQodG9rZW4sIG5vdEZvdW5kVmFsdWUpO1xuICB9IGVsc2Uge1xuICAgIHZhbHVlID0gSW5qZWN0b3IuTlVMTC5nZXQodG9rZW4sIHR5cGVvZiBub3RGb3VuZFZhbHVlICE9PSAndW5kZWZpbmVkJyA/IG5vdEZvdW5kVmFsdWUgOiBudWxsKTtcbiAgfVxuICByZXR1cm4gdmFsdWU7XG59XG5cbmZ1bmN0aW9uIGNvbXB1dGVEZXBzKHByb3ZpZGVyOiBTdGF0aWNQcm92aWRlcik6IERlcGVuZGVuY3lSZWNvcmRbXSB7XG4gIGxldCBkZXBzOiBEZXBlbmRlbmN5UmVjb3JkW10gPSBFTVBUWTtcbiAgY29uc3QgcHJvdmlkZXJEZXBzOiBhbnlbXSA9XG4gICAgICAocHJvdmlkZXIgYXMgRXhpc3RpbmdQcm92aWRlciAmIFN0YXRpY0NsYXNzUHJvdmlkZXIgJiBDb25zdHJ1Y3RvclByb3ZpZGVyKS5kZXBzO1xuICBpZiAocHJvdmlkZXJEZXBzICYmIHByb3ZpZGVyRGVwcy5sZW5ndGgpIHtcbiAgICBkZXBzID0gW107XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwcm92aWRlckRlcHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGxldCBvcHRpb25zID0gT3B0aW9uRmxhZ3MuRGVmYXVsdDtcbiAgICAgIGxldCB0b2tlbiA9IHJlc29sdmVGb3J3YXJkUmVmKHByb3ZpZGVyRGVwc1tpXSk7XG4gICAgICBpZiAodG9rZW4gaW5zdGFuY2VvZiBBcnJheSkge1xuICAgICAgICBmb3IgKGxldCBqID0gMCwgYW5ub3RhdGlvbnMgPSB0b2tlbjsgaiA8IGFubm90YXRpb25zLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgY29uc3QgYW5ub3RhdGlvbiA9IGFubm90YXRpb25zW2pdO1xuICAgICAgICAgIGlmIChhbm5vdGF0aW9uIGluc3RhbmNlb2YgT3B0aW9uYWwgfHwgYW5ub3RhdGlvbiA9PSBPcHRpb25hbCkge1xuICAgICAgICAgICAgb3B0aW9ucyA9IG9wdGlvbnMgfCBPcHRpb25GbGFncy5PcHRpb25hbDtcbiAgICAgICAgICB9IGVsc2UgaWYgKGFubm90YXRpb24gaW5zdGFuY2VvZiBTa2lwU2VsZiB8fCBhbm5vdGF0aW9uID09IFNraXBTZWxmKSB7XG4gICAgICAgICAgICBvcHRpb25zID0gb3B0aW9ucyAmIH5PcHRpb25GbGFncy5DaGVja1NlbGY7XG4gICAgICAgICAgfSBlbHNlIGlmIChhbm5vdGF0aW9uIGluc3RhbmNlb2YgU2VsZiB8fCBhbm5vdGF0aW9uID09IFNlbGYpIHtcbiAgICAgICAgICAgIG9wdGlvbnMgPSBvcHRpb25zICYgfk9wdGlvbkZsYWdzLkNoZWNrUGFyZW50O1xuICAgICAgICAgIH0gZWxzZSBpZiAoYW5ub3RhdGlvbiBpbnN0YW5jZW9mIEluamVjdCkge1xuICAgICAgICAgICAgdG9rZW4gPSAoYW5ub3RhdGlvbiBhcyBJbmplY3QpLnRva2VuO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0b2tlbiA9IHJlc29sdmVGb3J3YXJkUmVmKGFubm90YXRpb24pO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZGVwcy5wdXNoKHt0b2tlbiwgb3B0aW9uc30pO1xuICAgIH1cbiAgfSBlbHNlIGlmICgocHJvdmlkZXIgYXMgRXhpc3RpbmdQcm92aWRlcikudXNlRXhpc3RpbmcpIHtcbiAgICBjb25zdCB0b2tlbiA9IHJlc29sdmVGb3J3YXJkUmVmKChwcm92aWRlciBhcyBFeGlzdGluZ1Byb3ZpZGVyKS51c2VFeGlzdGluZyk7XG4gICAgZGVwcyA9IFt7dG9rZW4sIG9wdGlvbnM6IE9wdGlvbkZsYWdzLkRlZmF1bHR9XTtcbiAgfSBlbHNlIGlmICghcHJvdmlkZXJEZXBzICYmICEoVVNFX1ZBTFVFIGluIHByb3ZpZGVyKSkge1xuICAgIC8vIHVzZVZhbHVlICYgdXNlRXhpc3RpbmcgYXJlIHRoZSBvbmx5IG9uZXMgd2hpY2ggYXJlIGV4ZW1wdCBmcm9tIGRlcHMgYWxsIG90aGVycyBuZWVkIGl0LlxuICAgIHRocm93IHN0YXRpY0Vycm9yKCdcXCdkZXBzXFwnIHJlcXVpcmVkJywgcHJvdmlkZXIpO1xuICB9XG4gIHJldHVybiBkZXBzO1xufVxuXG5mdW5jdGlvbiBzdGF0aWNFcnJvcih0ZXh0OiBzdHJpbmcsIG9iajogYW55KTogRXJyb3Ige1xuICByZXR1cm4gbmV3IEVycm9yKGZvcm1hdEVycm9yKHRleHQsIG9iaiwgJ1N0YXRpY0luamVjdG9yRXJyb3InKSk7XG59XG4iXX0=