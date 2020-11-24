import { stringify } from '../util/stringify';
import { resolveForwardRef } from './forward_ref';
import { catchInjectorError, formatError, NG_TEMP_TOKEN_PATH, setCurrentInjector, THROW_IF_NOT_FOUND, USE_VALUE, ɵɵinject } from './injector_compatibility';
import { INJECTOR } from './injector_token';
import { getInjectableDef, ɵɵdefineInjectable } from './interface/defs';
import { InjectFlags } from './interface/injector';
import { Inject, Optional, Self, SkipSelf } from './metadata';
import { NullInjector } from './null_injector';
import { createInjector } from './r3_injector';
import { INJECTOR_SCOPE } from './scope';
export function INJECTOR_IMPL__PRE_R3__(providers, parent, name) {
    return new StaticInjector(providers, parent, name);
}
export function INJECTOR_IMPL__POST_R3__(providers, parent, name) {
    return createInjector({ name: name }, parent, providers, name);
}
export const INJECTOR_IMPL = INJECTOR_IMPL__POST_R3__;
/**
 * Concrete injectors implement this interface. Injectors are configured
 * with [providers](guide/glossary#provider) that associate
 * dependencies of various types with [injection tokens](guide/glossary#di-token).
 *
 * @see ["DI Providers"](guide/dependency-injection-providers).
 * @see `StaticProvider`
 *
 * @usageNotes
 *
 *  The following example creates a service injector instance.
 *
 * {@example core/di/ts/provider_spec.ts region='ConstructorProvider'}
 *
 * ### Usage example
 *
 * {@example core/di/ts/injector_spec.ts region='Injector'}
 *
 * `Injector` returns itself when given `Injector` as a token:
 *
 * {@example core/di/ts/injector_spec.ts region='injectInjector'}
 *
 * @publicApi
 */
export class Injector {
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
    providedIn: 'any',
    factory: () => ɵɵinject(INJECTOR),
});
/**
 * @internal
 * @nocollapse
 */
Injector.__NG_ELEMENT_ID__ = -1 /* Injector */;
const IDENT = function (value) {
    return value;
};
const EMPTY = [];
const CIRCULAR = IDENT;
const MULTI_PROVIDER_FN = function () {
    return Array.prototype.slice.call(arguments);
};
const NO_NEW_LINE = 'ɵ';
export class StaticInjector {
    constructor(providers, parent = Injector.NULL, source = null) {
        this.parent = parent;
        this.source = source;
        const records = this._records = new Map();
        records.set(Injector, { token: Injector, fn: IDENT, deps: EMPTY, value: this, useNew: false });
        records.set(INJECTOR, { token: INJECTOR, fn: IDENT, deps: EMPTY, value: this, useNew: false });
        this.scope = recursivelyProcessProviders(records, providers);
    }
    get(token, notFoundValue, flags = InjectFlags.Default) {
        const records = this._records;
        let record = records.get(token);
        if (record === undefined) {
            // This means we have never seen this record, see if it is tree shakable provider.
            const injectableDef = getInjectableDef(token);
            if (injectableDef) {
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
    toString() {
        const tokens = [], records = this._records;
        records.forEach((v, token) => tokens.push(stringify(token)));
        return `StaticInjector[${tokens.join(', ')}]`;
    }
}
function resolveProvider(provider) {
    const deps = computeDeps(provider);
    let fn = IDENT;
    let value = EMPTY;
    let useNew = false;
    let provide = resolveForwardRef(provider.provide);
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
    return { deps, fn, useNew, value };
}
function multiProviderMixError(token) {
    return staticError('Cannot mix multi providers and regular providers', token);
}
function recursivelyProcessProviders(records, provider) {
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
            let token = resolveForwardRef(provider.provide);
            const resolvedProvider = resolveProvider(provider);
            if (provider.multi === true) {
                // This is a multi provider.
                let multiProvider = records.get(token);
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
                multiProvider.deps.push({ token, options: 6 /* Default */ });
            }
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
function tryResolveToken(token, record, records, parent, notFoundValue, flags) {
    try {
        return resolveToken(token, record, records, parent, notFoundValue, flags);
    }
    catch (e) {
        // ensure that 'e' is of type Error.
        if (!(e instanceof Error)) {
            e = new Error(e);
        }
        const path = e[NG_TEMP_TOKEN_PATH] = e[NG_TEMP_TOKEN_PATH] || [];
        path.unshift(token);
        if (record && record.value == CIRCULAR) {
            // Reset the Circular flag.
            record.value = EMPTY;
        }
        throw e;
    }
}
function resolveToken(token, record, records, parent, notFoundValue, flags) {
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
            let obj = undefined;
            let useNew = record.useNew;
            let fn = record.fn;
            let depRecords = record.deps;
            let deps = EMPTY;
            if (depRecords.length) {
                deps = [];
                for (let i = 0; i < depRecords.length; i++) {
                    const depRecord = depRecords[i];
                    const options = depRecord.options;
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
            record.value = value = useNew ? new fn(...deps) : fn.apply(obj, deps);
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
    let deps = EMPTY;
    const providerDeps = provider.deps;
    if (providerDeps && providerDeps.length) {
        deps = [];
        for (let i = 0; i < providerDeps.length; i++) {
            let options = 6 /* Default */;
            let token = resolveForwardRef(providerDeps[i]);
            if (Array.isArray(token)) {
                for (let j = 0, annotations = token; j < annotations.length; j++) {
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
                        token = annotation.token;
                    }
                    else {
                        token = resolveForwardRef(annotation);
                    }
                }
            }
            deps.push({ token, options });
        }
    }
    else if (provider.useExisting) {
        const token = resolveForwardRef(provider.useExisting);
        deps = [{ token, options: 6 /* Default */ }];
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5qZWN0b3IuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9kaS9pbmplY3Rvci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFTQSxPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDNUMsT0FBTyxFQUFDLGlCQUFpQixFQUFDLE1BQU0sZUFBZSxDQUFDO0FBRWhELE9BQU8sRUFBQyxrQkFBa0IsRUFBRSxXQUFXLEVBQUUsa0JBQWtCLEVBQUUsa0JBQWtCLEVBQUUsa0JBQWtCLEVBQUUsU0FBUyxFQUFFLFFBQVEsRUFBQyxNQUFNLDBCQUEwQixDQUFDO0FBRTFKLE9BQU8sRUFBQyxRQUFRLEVBQUMsTUFBTSxrQkFBa0IsQ0FBQztBQUMxQyxPQUFPLEVBQUMsZ0JBQWdCLEVBQUUsa0JBQWtCLEVBQUMsTUFBTSxrQkFBa0IsQ0FBQztBQUN0RSxPQUFPLEVBQUMsV0FBVyxFQUFDLE1BQU0sc0JBQXNCLENBQUM7QUFFakQsT0FBTyxFQUFDLE1BQU0sRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBQyxNQUFNLFlBQVksQ0FBQztBQUM1RCxPQUFPLEVBQUMsWUFBWSxFQUFDLE1BQU0saUJBQWlCLENBQUM7QUFDN0MsT0FBTyxFQUFDLGNBQWMsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUM3QyxPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0sU0FBUyxDQUFDO0FBRXZDLE1BQU0sVUFBVSx1QkFBdUIsQ0FDbkMsU0FBMkIsRUFBRSxNQUEwQixFQUFFLElBQVk7SUFDdkUsT0FBTyxJQUFJLGNBQWMsQ0FBQyxTQUFTLEVBQUUsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFDO0FBQ3JELENBQUM7QUFFRCxNQUFNLFVBQVUsd0JBQXdCLENBQ3BDLFNBQTJCLEVBQUUsTUFBMEIsRUFBRSxJQUFZO0lBQ3ZFLE9BQU8sY0FBYyxDQUFDLEVBQUMsSUFBSSxFQUFFLElBQUksRUFBQyxFQUFFLE1BQU0sRUFBRSxTQUFTLEVBQUUsSUFBSSxDQUFDLENBQUM7QUFDL0QsQ0FBQztBQUVELE1BQU0sQ0FBQyxNQUFNLGFBQWEsR0FMVix3QkFLb0MsQ0FBQztBQUVyRDs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7R0F1Qkc7QUFDSCxNQUFNLE9BQWdCLFFBQVE7SUFxQzVCLE1BQU0sQ0FBQyxNQUFNLENBQ1QsT0FBeUYsRUFDekYsTUFBaUI7UUFDbkIsSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxFQUFFO1lBQzFCLE9BQU8sYUFBYSxDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsRUFBRSxDQUFDLENBQUM7U0FDM0M7YUFBTTtZQUNMLE9BQU8sYUFBYSxDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUUsT0FBTyxDQUFDLE1BQU0sRUFBRSxPQUFPLENBQUMsSUFBSSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1NBQzdFO0lBQ0gsQ0FBQzs7QUE1Q00sMkJBQWtCLEdBQUcsa0JBQWtCLENBQUM7QUFDeEMsYUFBSSxHQUFhLElBQUksWUFBWSxFQUFFLENBQUM7QUE2QzNDLGtCQUFrQjtBQUNYLGNBQUssR0FBRyxrQkFBa0IsQ0FBQztJQUNoQyxLQUFLLEVBQUUsUUFBUTtJQUNmLFVBQVUsRUFBRSxLQUFZO0lBQ3hCLE9BQU8sRUFBRSxHQUFHLEVBQUUsQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDO0NBQ2xDLENBQUMsQ0FBQztBQUVIOzs7R0FHRztBQUNJLDBCQUFpQixxQkFBNEI7QUFLdEQsTUFBTSxLQUFLLEdBQUcsVUFBWSxLQUFRO0lBQ2hDLE9BQU8sS0FBSyxDQUFDO0FBQ2YsQ0FBQyxDQUFDO0FBQ0YsTUFBTSxLQUFLLEdBQVUsRUFBRSxDQUFDO0FBQ3hCLE1BQU0sUUFBUSxHQUFHLEtBQUssQ0FBQztBQUN2QixNQUFNLGlCQUFpQixHQUFHO0lBQ3hCLE9BQU8sS0FBSyxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO0FBQy9DLENBQUMsQ0FBQztBQVFGLE1BQU0sV0FBVyxHQUFHLEdBQUcsQ0FBQztBQUV4QixNQUFNLE9BQU8sY0FBYztJQU96QixZQUNJLFNBQTJCLEVBQUUsU0FBbUIsUUFBUSxDQUFDLElBQUksRUFBRSxTQUFzQixJQUFJO1FBQzNGLElBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDO1FBQ3JCLElBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDO1FBQ3JCLE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxHQUFHLEVBQWUsQ0FBQztRQUN2RCxPQUFPLENBQUMsR0FBRyxDQUNQLFFBQVEsRUFBVSxFQUFDLEtBQUssRUFBRSxRQUFRLEVBQUUsRUFBRSxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBQyxDQUFDLENBQUM7UUFDN0YsT0FBTyxDQUFDLEdBQUcsQ0FDUCxRQUFRLEVBQVUsRUFBQyxLQUFLLEVBQUUsUUFBUSxFQUFFLEVBQUUsRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUMsQ0FBQyxDQUFDO1FBQzdGLElBQUksQ0FBQyxLQUFLLEdBQUcsMkJBQTJCLENBQUMsT0FBTyxFQUFFLFNBQVMsQ0FBQyxDQUFDO0lBQy9ELENBQUM7SUFLRCxHQUFHLENBQUMsS0FBVSxFQUFFLGFBQW1CLEVBQUUsUUFBcUIsV0FBVyxDQUFDLE9BQU87UUFDM0UsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQztRQUM5QixJQUFJLE1BQU0sR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ2hDLElBQUksTUFBTSxLQUFLLFNBQVMsRUFBRTtZQUN4QixrRkFBa0Y7WUFDbEYsTUFBTSxhQUFhLEdBQUcsZ0JBQWdCLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDOUMsSUFBSSxhQUFhLEVBQUU7Z0JBQ2pCLE1BQU0sVUFBVSxHQUFHLGFBQWEsSUFBSSxhQUFhLENBQUMsVUFBVSxDQUFDO2dCQUM3RCxJQUFJLFVBQVUsS0FBSyxLQUFLLElBQUksVUFBVSxJQUFJLElBQUksSUFBSSxVQUFVLEtBQUssSUFBSSxDQUFDLEtBQUssRUFBRTtvQkFDM0UsT0FBTyxDQUFDLEdBQUcsQ0FDUCxLQUFLLEVBQ0wsTUFBTSxHQUFHLGVBQWUsQ0FDcEIsRUFBQyxPQUFPLEVBQUUsS0FBSyxFQUFFLFVBQVUsRUFBRSxhQUFhLENBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUMsQ0FBQyxDQUFDLENBQUM7aUJBQzVFO2FBQ0Y7WUFDRCxJQUFJLE1BQU0sS0FBSyxTQUFTLEVBQUU7Z0JBQ3hCLHlGQUF5RjtnQkFDekYsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLENBQUM7YUFDMUI7U0FDRjtRQUNELElBQUksWUFBWSxHQUFHLGtCQUFrQixDQUFDLElBQUksQ0FBQyxDQUFDO1FBQzVDLElBQUk7WUFDRixPQUFPLGVBQWUsQ0FBQyxLQUFLLEVBQUUsTUFBTSxFQUFFLE9BQU8sRUFBRSxJQUFJLENBQUMsTUFBTSxFQUFFLGFBQWEsRUFBRSxLQUFLLENBQUMsQ0FBQztTQUNuRjtRQUFDLE9BQU8sQ0FBQyxFQUFFO1lBQ1YsT0FBTyxrQkFBa0IsQ0FBQyxDQUFDLEVBQUUsS0FBSyxFQUFFLHFCQUFxQixFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztTQUN6RTtnQkFBUztZQUNSLGtCQUFrQixDQUFDLFlBQVksQ0FBQyxDQUFDO1NBQ2xDO0lBQ0gsQ0FBQztJQUVELFFBQVE7UUFDTixNQUFNLE1BQU0sR0FBYSxFQUFFLEVBQUUsT0FBTyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUM7UUFDckQsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRSxLQUFLLEVBQUUsRUFBRSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUM3RCxPQUFPLGtCQUFrQixNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUM7SUFDaEQsQ0FBQztDQUNGO0FBaUJELFNBQVMsZUFBZSxDQUFDLFFBQTJCO0lBQ2xELE1BQU0sSUFBSSxHQUFHLFdBQVcsQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUNuQyxJQUFJLEVBQUUsR0FBYSxLQUFLLENBQUM7SUFDekIsSUFBSSxLQUFLLEdBQVEsS0FBSyxDQUFDO0lBQ3ZCLElBQUksTUFBTSxHQUFZLEtBQUssQ0FBQztJQUM1QixJQUFJLE9BQU8sR0FBRyxpQkFBaUIsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDbEQsSUFBSSxTQUFTLElBQUksUUFBUSxFQUFFO1FBQ3pCLDhGQUE4RjtRQUM5RixLQUFLLEdBQUksUUFBMEIsQ0FBQyxRQUFRLENBQUM7S0FDOUM7U0FBTSxJQUFLLFFBQTRCLENBQUMsVUFBVSxFQUFFO1FBQ25ELEVBQUUsR0FBSSxRQUE0QixDQUFDLFVBQVUsQ0FBQztLQUMvQztTQUFNLElBQUssUUFBNkIsQ0FBQyxXQUFXLEVBQUU7UUFDckQsaUJBQWlCO0tBQ2xCO1NBQU0sSUFBSyxRQUFnQyxDQUFDLFFBQVEsRUFBRTtRQUNyRCxNQUFNLEdBQUcsSUFBSSxDQUFDO1FBQ2QsRUFBRSxHQUFHLGlCQUFpQixDQUFFLFFBQWdDLENBQUMsUUFBUSxDQUFDLENBQUM7S0FDcEU7U0FBTSxJQUFJLE9BQU8sT0FBTyxJQUFJLFVBQVUsRUFBRTtRQUN2QyxNQUFNLEdBQUcsSUFBSSxDQUFDO1FBQ2QsRUFBRSxHQUFHLE9BQU8sQ0FBQztLQUNkO1NBQU07UUFDTCxNQUFNLFdBQVcsQ0FDYixxR0FBcUcsRUFDckcsUUFBUSxDQUFDLENBQUM7S0FDZjtJQUNELE9BQU8sRUFBQyxJQUFJLEVBQUUsRUFBRSxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUMsQ0FBQztBQUNuQyxDQUFDO0FBRUQsU0FBUyxxQkFBcUIsQ0FBQyxLQUFVO0lBQ3ZDLE9BQU8sV0FBVyxDQUFDLGtEQUFrRCxFQUFFLEtBQUssQ0FBQyxDQUFDO0FBQ2hGLENBQUM7QUFFRCxTQUFTLDJCQUEyQixDQUFDLE9BQXlCLEVBQUUsUUFBd0I7SUFFdEYsSUFBSSxLQUFLLEdBQWdCLElBQUksQ0FBQztJQUM5QixJQUFJLFFBQVEsRUFBRTtRQUNaLFFBQVEsR0FBRyxpQkFBaUIsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUN2QyxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLEVBQUU7WUFDM0IsNkNBQTZDO1lBQzdDLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxRQUFRLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO2dCQUN4QyxLQUFLLEdBQUcsMkJBQTJCLENBQUMsT0FBTyxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLEtBQUssQ0FBQzthQUNwRTtTQUNGO2FBQU0sSUFBSSxPQUFPLFFBQVEsS0FBSyxVQUFVLEVBQUU7WUFDekMsMkZBQTJGO1lBQzNGLGlCQUFpQjtZQUNqQixNQUFNLFdBQVcsQ0FBQyw4QkFBOEIsRUFBRSxRQUFRLENBQUMsQ0FBQztTQUM3RDthQUFNLElBQUksUUFBUSxJQUFJLE9BQU8sUUFBUSxLQUFLLFFBQVEsSUFBSSxRQUFRLENBQUMsT0FBTyxFQUFFO1lBQ3ZFLHVFQUF1RTtZQUN2RSxJQUFJLEtBQUssR0FBRyxpQkFBaUIsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDaEQsTUFBTSxnQkFBZ0IsR0FBRyxlQUFlLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDbkQsSUFBSSxRQUFRLENBQUMsS0FBSyxLQUFLLElBQUksRUFBRTtnQkFDM0IsNEJBQTRCO2dCQUM1QixJQUFJLGFBQWEsR0FBcUIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDekQsSUFBSSxhQUFhLEVBQUU7b0JBQ2pCLElBQUksYUFBYSxDQUFDLEVBQUUsS0FBSyxpQkFBaUIsRUFBRTt3QkFDMUMsTUFBTSxxQkFBcUIsQ0FBQyxLQUFLLENBQUMsQ0FBQztxQkFDcEM7aUJBQ0Y7cUJBQU07b0JBQ0wsMEZBQTBGO29CQUMxRixPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssRUFBRSxhQUFhLEdBQVc7d0JBQ3pDLEtBQUssRUFBRSxRQUFRLENBQUMsT0FBTzt3QkFDdkIsSUFBSSxFQUFFLEVBQUU7d0JBQ1IsTUFBTSxFQUFFLEtBQUs7d0JBQ2IsRUFBRSxFQUFFLGlCQUFpQjt3QkFDckIsS0FBSyxFQUFFLEtBQUs7cUJBQ2IsQ0FBQyxDQUFDO2lCQUNKO2dCQUNELG1DQUFtQztnQkFDbkMsS0FBSyxHQUFHLFFBQVEsQ0FBQztnQkFDakIsYUFBYSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBQyxLQUFLLEVBQUUsT0FBTyxpQkFBcUIsRUFBQyxDQUFDLENBQUM7YUFDaEU7WUFDRCxNQUFNLE1BQU0sR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ2xDLElBQUksTUFBTSxJQUFJLE1BQU0sQ0FBQyxFQUFFLElBQUksaUJBQWlCLEVBQUU7Z0JBQzVDLE1BQU0scUJBQXFCLENBQUMsS0FBSyxDQUFDLENBQUM7YUFDcEM7WUFDRCxJQUFJLEtBQUssS0FBSyxjQUFjLEVBQUU7Z0JBQzVCLEtBQUssR0FBRyxnQkFBZ0IsQ0FBQyxLQUFLLENBQUM7YUFDaEM7WUFDRCxPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDO1NBQ3RDO2FBQU07WUFDTCxNQUFNLFdBQVcsQ0FBQyxxQkFBcUIsRUFBRSxRQUFRLENBQUMsQ0FBQztTQUNwRDtLQUNGO0lBQ0QsT0FBTyxLQUFLLENBQUM7QUFDZixDQUFDO0FBRUQsU0FBUyxlQUFlLENBQ3BCLEtBQVUsRUFBRSxNQUE2QixFQUFFLE9BQThCLEVBQUUsTUFBZ0IsRUFDM0YsYUFBa0IsRUFBRSxLQUFrQjtJQUN4QyxJQUFJO1FBQ0YsT0FBTyxZQUFZLENBQUMsS0FBSyxFQUFFLE1BQU0sRUFBRSxPQUFPLEVBQUUsTUFBTSxFQUFFLGFBQWEsRUFBRSxLQUFLLENBQUMsQ0FBQztLQUMzRTtJQUFDLE9BQU8sQ0FBQyxFQUFFO1FBQ1Ysb0NBQW9DO1FBQ3BDLElBQUksQ0FBQyxDQUFDLENBQUMsWUFBWSxLQUFLLENBQUMsRUFBRTtZQUN6QixDQUFDLEdBQUcsSUFBSSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7U0FDbEI7UUFDRCxNQUFNLElBQUksR0FBVSxDQUFDLENBQUMsa0JBQWtCLENBQUMsR0FBRyxDQUFDLENBQUMsa0JBQWtCLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDeEUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNwQixJQUFJLE1BQU0sSUFBSSxNQUFNLENBQUMsS0FBSyxJQUFJLFFBQVEsRUFBRTtZQUN0QywyQkFBMkI7WUFDM0IsTUFBTSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUM7U0FDdEI7UUFDRCxNQUFNLENBQUMsQ0FBQztLQUNUO0FBQ0gsQ0FBQztBQUVELFNBQVMsWUFBWSxDQUNqQixLQUFVLEVBQUUsTUFBNkIsRUFBRSxPQUE4QixFQUFFLE1BQWdCLEVBQzNGLGFBQWtCLEVBQUUsS0FBa0I7SUFDeEMsSUFBSSxLQUFLLENBQUM7SUFDVixJQUFJLE1BQU0sSUFBSSxDQUFDLENBQUMsS0FBSyxHQUFHLFdBQVcsQ0FBQyxRQUFRLENBQUMsRUFBRTtRQUM3Qyw4RkFBOEY7UUFDOUYsaUJBQWlCO1FBQ2pCLEtBQUssR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFDO1FBQ3JCLElBQUksS0FBSyxJQUFJLFFBQVEsRUFBRTtZQUNyQixNQUFNLEtBQUssQ0FBQyxXQUFXLEdBQUcscUJBQXFCLENBQUMsQ0FBQztTQUNsRDthQUFNLElBQUksS0FBSyxLQUFLLEtBQUssRUFBRTtZQUMxQixNQUFNLENBQUMsS0FBSyxHQUFHLFFBQVEsQ0FBQztZQUN4QixJQUFJLEdBQUcsR0FBRyxTQUFTLENBQUM7WUFDcEIsSUFBSSxNQUFNLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQztZQUMzQixJQUFJLEVBQUUsR0FBRyxNQUFNLENBQUMsRUFBRSxDQUFDO1lBQ25CLElBQUksVUFBVSxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUM7WUFDN0IsSUFBSSxJQUFJLEdBQUcsS0FBSyxDQUFDO1lBQ2pCLElBQUksVUFBVSxDQUFDLE1BQU0sRUFBRTtnQkFDckIsSUFBSSxHQUFHLEVBQUUsQ0FBQztnQkFDVixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsVUFBVSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtvQkFDMUMsTUFBTSxTQUFTLEdBQXFCLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFDbEQsTUFBTSxPQUFPLEdBQUcsU0FBUyxDQUFDLE9BQU8sQ0FBQztvQkFDbEMsTUFBTSxXQUFXLEdBQ2IsT0FBTyxvQkFBd0IsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQztvQkFDL0UsSUFBSSxDQUFDLElBQUksQ0FBQyxlQUFlO29CQUNyQiwyQkFBMkI7b0JBQzNCLFNBQVMsQ0FBQyxLQUFLO29CQUNmLHFEQUFxRDtvQkFDckQsdURBQXVEO29CQUN2RCxXQUFXO29CQUNYLCtCQUErQjtvQkFDL0IsT0FBTztvQkFDUCxvRkFBb0Y7b0JBQ3BGLDhCQUE4QjtvQkFDOUIsQ0FBQyxXQUFXLElBQUksQ0FBQyxDQUFDLE9BQU8sc0JBQTBCLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsTUFBTSxFQUM3RSxPQUFPLG1CQUF1QixDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxrQkFBa0IsRUFDbkUsV0FBVyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7aUJBQzNCO2FBQ0Y7WUFDRCxNQUFNLENBQUMsS0FBSyxHQUFHLEtBQUssR0FBRyxNQUFNLENBQUMsQ0FBQyxDQUFDLElBQUssRUFBVSxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxDQUFDO1NBQ2hGO0tBQ0Y7U0FBTSxJQUFJLENBQUMsQ0FBQyxLQUFLLEdBQUcsV0FBVyxDQUFDLElBQUksQ0FBQyxFQUFFO1FBQ3RDLEtBQUssR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFDLEtBQUssRUFBRSxhQUFhLEVBQUUsV0FBVyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0tBQy9EO1NBQU0sSUFBSSxDQUFDLENBQUMsS0FBSyxHQUFHLFdBQVcsQ0FBQyxRQUFRLENBQUMsRUFBRTtRQUMxQyxLQUFLLEdBQUcsUUFBUSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxFQUFFLGFBQWEsQ0FBQyxDQUFDO0tBQ2pEO1NBQU07UUFDTCxLQUFLLEdBQUcsUUFBUSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxFQUFFLE9BQU8sYUFBYSxLQUFLLFdBQVcsQ0FBQyxDQUFDLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQztLQUMvRjtJQUNELE9BQU8sS0FBSyxDQUFDO0FBQ2YsQ0FBQztBQUVELFNBQVMsV0FBVyxDQUFDLFFBQXdCO0lBQzNDLElBQUksSUFBSSxHQUF1QixLQUFLLENBQUM7SUFDckMsTUFBTSxZQUFZLEdBQ2IsUUFBeUUsQ0FBQyxJQUFJLENBQUM7SUFDcEYsSUFBSSxZQUFZLElBQUksWUFBWSxDQUFDLE1BQU0sRUFBRTtRQUN2QyxJQUFJLEdBQUcsRUFBRSxDQUFDO1FBQ1YsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFlBQVksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7WUFDNUMsSUFBSSxPQUFPLGtCQUFzQixDQUFDO1lBQ2xDLElBQUksS0FBSyxHQUFHLGlCQUFpQixDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQy9DLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsRUFBRTtnQkFDeEIsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsV0FBVyxHQUFHLEtBQUssRUFBRSxDQUFDLEdBQUcsV0FBVyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtvQkFDaEUsTUFBTSxVQUFVLEdBQUcsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUNsQyxJQUFJLFVBQVUsWUFBWSxRQUFRLElBQUksVUFBVSxJQUFJLFFBQVEsRUFBRTt3QkFDNUQsT0FBTyxHQUFHLE9BQU8sbUJBQXVCLENBQUM7cUJBQzFDO3lCQUFNLElBQUksVUFBVSxZQUFZLFFBQVEsSUFBSSxVQUFVLElBQUksUUFBUSxFQUFFO3dCQUNuRSxPQUFPLEdBQUcsT0FBTyxHQUFHLGtCQUFzQixDQUFDO3FCQUM1Qzt5QkFBTSxJQUFJLFVBQVUsWUFBWSxJQUFJLElBQUksVUFBVSxJQUFJLElBQUksRUFBRTt3QkFDM0QsT0FBTyxHQUFHLE9BQU8sR0FBRyxvQkFBd0IsQ0FBQztxQkFDOUM7eUJBQU0sSUFBSSxVQUFVLFlBQVksTUFBTSxFQUFFO3dCQUN2QyxLQUFLLEdBQUksVUFBcUIsQ0FBQyxLQUFLLENBQUM7cUJBQ3RDO3lCQUFNO3dCQUNMLEtBQUssR0FBRyxpQkFBaUIsQ0FBQyxVQUFVLENBQUMsQ0FBQztxQkFDdkM7aUJBQ0Y7YUFDRjtZQUNELElBQUksQ0FBQyxJQUFJLENBQUMsRUFBQyxLQUFLLEVBQUUsT0FBTyxFQUFDLENBQUMsQ0FBQztTQUM3QjtLQUNGO1NBQU0sSUFBSyxRQUE2QixDQUFDLFdBQVcsRUFBRTtRQUNyRCxNQUFNLEtBQUssR0FBRyxpQkFBaUIsQ0FBRSxRQUE2QixDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBQzVFLElBQUksR0FBRyxDQUFDLEVBQUMsS0FBSyxFQUFFLE9BQU8saUJBQXFCLEVBQUMsQ0FBQyxDQUFDO0tBQ2hEO1NBQU0sSUFBSSxDQUFDLFlBQVksSUFBSSxDQUFDLENBQUMsU0FBUyxJQUFJLFFBQVEsQ0FBQyxFQUFFO1FBQ3BELDBGQUEwRjtRQUMxRixNQUFNLFdBQVcsQ0FBQyxtQkFBbUIsRUFBRSxRQUFRLENBQUMsQ0FBQztLQUNsRDtJQUNELE9BQU8sSUFBSSxDQUFDO0FBQ2QsQ0FBQztBQUVELFNBQVMsV0FBVyxDQUFDLElBQVksRUFBRSxHQUFRO0lBQ3pDLE9BQU8sSUFBSSxLQUFLLENBQUMsV0FBVyxDQUFDLElBQUksRUFBRSxHQUFHLEVBQUUscUJBQXFCLENBQUMsQ0FBQyxDQUFDO0FBQ2xFLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtBYnN0cmFjdFR5cGUsIFR5cGV9IGZyb20gJy4uL2ludGVyZmFjZS90eXBlJztcbmltcG9ydCB7c3RyaW5naWZ5fSBmcm9tICcuLi91dGlsL3N0cmluZ2lmeSc7XG5pbXBvcnQge3Jlc29sdmVGb3J3YXJkUmVmfSBmcm9tICcuL2ZvcndhcmRfcmVmJztcbmltcG9ydCB7SW5qZWN0aW9uVG9rZW59IGZyb20gJy4vaW5qZWN0aW9uX3Rva2VuJztcbmltcG9ydCB7Y2F0Y2hJbmplY3RvckVycm9yLCBmb3JtYXRFcnJvciwgTkdfVEVNUF9UT0tFTl9QQVRILCBzZXRDdXJyZW50SW5qZWN0b3IsIFRIUk9XX0lGX05PVF9GT1VORCwgVVNFX1ZBTFVFLCDJtcm1aW5qZWN0fSBmcm9tICcuL2luamVjdG9yX2NvbXBhdGliaWxpdHknO1xuaW1wb3J0IHtJbmplY3Rvck1hcmtlcnN9IGZyb20gJy4vaW5qZWN0b3JfbWFya2VyJztcbmltcG9ydCB7SU5KRUNUT1J9IGZyb20gJy4vaW5qZWN0b3JfdG9rZW4nO1xuaW1wb3J0IHtnZXRJbmplY3RhYmxlRGVmLCDJtcm1ZGVmaW5lSW5qZWN0YWJsZX0gZnJvbSAnLi9pbnRlcmZhY2UvZGVmcyc7XG5pbXBvcnQge0luamVjdEZsYWdzfSBmcm9tICcuL2ludGVyZmFjZS9pbmplY3Rvcic7XG5pbXBvcnQge0NvbnN0cnVjdG9yUHJvdmlkZXIsIEV4aXN0aW5nUHJvdmlkZXIsIEZhY3RvcnlQcm92aWRlciwgU3RhdGljQ2xhc3NQcm92aWRlciwgU3RhdGljUHJvdmlkZXIsIFZhbHVlUHJvdmlkZXJ9IGZyb20gJy4vaW50ZXJmYWNlL3Byb3ZpZGVyJztcbmltcG9ydCB7SW5qZWN0LCBPcHRpb25hbCwgU2VsZiwgU2tpcFNlbGZ9IGZyb20gJy4vbWV0YWRhdGEnO1xuaW1wb3J0IHtOdWxsSW5qZWN0b3J9IGZyb20gJy4vbnVsbF9pbmplY3Rvcic7XG5pbXBvcnQge2NyZWF0ZUluamVjdG9yfSBmcm9tICcuL3IzX2luamVjdG9yJztcbmltcG9ydCB7SU5KRUNUT1JfU0NPUEV9IGZyb20gJy4vc2NvcGUnO1xuXG5leHBvcnQgZnVuY3Rpb24gSU5KRUNUT1JfSU1QTF9fUFJFX1IzX18oXG4gICAgcHJvdmlkZXJzOiBTdGF0aWNQcm92aWRlcltdLCBwYXJlbnQ6IEluamVjdG9yfHVuZGVmaW5lZCwgbmFtZTogc3RyaW5nKSB7XG4gIHJldHVybiBuZXcgU3RhdGljSW5qZWN0b3IocHJvdmlkZXJzLCBwYXJlbnQsIG5hbWUpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gSU5KRUNUT1JfSU1QTF9fUE9TVF9SM19fKFxuICAgIHByb3ZpZGVyczogU3RhdGljUHJvdmlkZXJbXSwgcGFyZW50OiBJbmplY3Rvcnx1bmRlZmluZWQsIG5hbWU6IHN0cmluZykge1xuICByZXR1cm4gY3JlYXRlSW5qZWN0b3Ioe25hbWU6IG5hbWV9LCBwYXJlbnQsIHByb3ZpZGVycywgbmFtZSk7XG59XG5cbmV4cG9ydCBjb25zdCBJTkpFQ1RPUl9JTVBMID0gSU5KRUNUT1JfSU1QTF9fUFJFX1IzX187XG5cbi8qKlxuICogQ29uY3JldGUgaW5qZWN0b3JzIGltcGxlbWVudCB0aGlzIGludGVyZmFjZS4gSW5qZWN0b3JzIGFyZSBjb25maWd1cmVkXG4gKiB3aXRoIFtwcm92aWRlcnNdKGd1aWRlL2dsb3NzYXJ5I3Byb3ZpZGVyKSB0aGF0IGFzc29jaWF0ZVxuICogZGVwZW5kZW5jaWVzIG9mIHZhcmlvdXMgdHlwZXMgd2l0aCBbaW5qZWN0aW9uIHRva2Vuc10oZ3VpZGUvZ2xvc3NhcnkjZGktdG9rZW4pLlxuICpcbiAqIEBzZWUgW1wiREkgUHJvdmlkZXJzXCJdKGd1aWRlL2RlcGVuZGVuY3ktaW5qZWN0aW9uLXByb3ZpZGVycykuXG4gKiBAc2VlIGBTdGF0aWNQcm92aWRlcmBcbiAqXG4gKiBAdXNhZ2VOb3Rlc1xuICpcbiAqICBUaGUgZm9sbG93aW5nIGV4YW1wbGUgY3JlYXRlcyBhIHNlcnZpY2UgaW5qZWN0b3IgaW5zdGFuY2UuXG4gKlxuICoge0BleGFtcGxlIGNvcmUvZGkvdHMvcHJvdmlkZXJfc3BlYy50cyByZWdpb249J0NvbnN0cnVjdG9yUHJvdmlkZXInfVxuICpcbiAqICMjIyBVc2FnZSBleGFtcGxlXG4gKlxuICoge0BleGFtcGxlIGNvcmUvZGkvdHMvaW5qZWN0b3Jfc3BlYy50cyByZWdpb249J0luamVjdG9yJ31cbiAqXG4gKiBgSW5qZWN0b3JgIHJldHVybnMgaXRzZWxmIHdoZW4gZ2l2ZW4gYEluamVjdG9yYCBhcyBhIHRva2VuOlxuICpcbiAqIHtAZXhhbXBsZSBjb3JlL2RpL3RzL2luamVjdG9yX3NwZWMudHMgcmVnaW9uPSdpbmplY3RJbmplY3Rvcid9XG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgSW5qZWN0b3Ige1xuICBzdGF0aWMgVEhST1dfSUZfTk9UX0ZPVU5EID0gVEhST1dfSUZfTk9UX0ZPVU5EO1xuICBzdGF0aWMgTlVMTDogSW5qZWN0b3IgPSBuZXcgTnVsbEluamVjdG9yKCk7XG5cbiAgLyoqXG4gICAqIFJldHJpZXZlcyBhbiBpbnN0YW5jZSBmcm9tIHRoZSBpbmplY3RvciBiYXNlZCBvbiB0aGUgcHJvdmlkZWQgdG9rZW4uXG4gICAqIEByZXR1cm5zIFRoZSBpbnN0YW5jZSBmcm9tIHRoZSBpbmplY3RvciBpZiBkZWZpbmVkLCBvdGhlcndpc2UgdGhlIGBub3RGb3VuZFZhbHVlYC5cbiAgICogQHRocm93cyBXaGVuIHRoZSBgbm90Rm91bmRWYWx1ZWAgaXMgYHVuZGVmaW5lZGAgb3IgYEluamVjdG9yLlRIUk9XX0lGX05PVF9GT1VORGAuXG4gICAqL1xuICBhYnN0cmFjdCBnZXQ8VD4oXG4gICAgICB0b2tlbjogVHlwZTxUPnxBYnN0cmFjdFR5cGU8VD58SW5qZWN0aW9uVG9rZW48VD4sIG5vdEZvdW5kVmFsdWU/OiBULCBmbGFncz86IEluamVjdEZsYWdzKTogVDtcbiAgLyoqXG4gICAqIEBkZXByZWNhdGVkIGZyb20gdjQuMC4wIHVzZSBUeXBlPFQ+LCBBYnN0cmFjdFR5cGU8VD4gb3IgSW5qZWN0aW9uVG9rZW48VD5cbiAgICogQHN1cHByZXNzIHtkdXBsaWNhdGV9XG4gICAqL1xuICBhYnN0cmFjdCBnZXQodG9rZW46IGFueSwgbm90Rm91bmRWYWx1ZT86IGFueSk6IGFueTtcblxuICAvKipcbiAgICogQGRlcHJlY2F0ZWQgZnJvbSB2NSB1c2UgdGhlIG5ldyBzaWduYXR1cmUgSW5qZWN0b3IuY3JlYXRlKG9wdGlvbnMpXG4gICAqL1xuICBzdGF0aWMgY3JlYXRlKHByb3ZpZGVyczogU3RhdGljUHJvdmlkZXJbXSwgcGFyZW50PzogSW5qZWN0b3IpOiBJbmplY3RvcjtcblxuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyBpbmplY3RvciBpbnN0YW5jZSB0aGF0IHByb3ZpZGVzIG9uZSBvciBtb3JlIGRlcGVuZGVuY2llcyxcbiAgICogYWNjb3JkaW5nIHRvIGEgZ2l2ZW4gdHlwZSBvciB0eXBlcyBvZiBgU3RhdGljUHJvdmlkZXJgLlxuICAgKlxuICAgKiBAcGFyYW0gb3B0aW9ucyBBbiBvYmplY3Qgd2l0aCB0aGUgZm9sbG93aW5nIHByb3BlcnRpZXM6XG4gICAqICogYHByb3ZpZGVyc2A6IEFuIGFycmF5IG9mIHByb3ZpZGVycyBvZiB0aGUgW1N0YXRpY1Byb3ZpZGVyIHR5cGVdKGFwaS9jb3JlL1N0YXRpY1Byb3ZpZGVyKS5cbiAgICogKiBgcGFyZW50YDogKG9wdGlvbmFsKSBBIHBhcmVudCBpbmplY3Rvci5cbiAgICogKiBgbmFtZWA6IChvcHRpb25hbCkgQSBkZXZlbG9wZXItZGVmaW5lZCBpZGVudGlmeWluZyBuYW1lIGZvciB0aGUgbmV3IGluamVjdG9yLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgbmV3IGluamVjdG9yIGluc3RhbmNlLlxuICAgKlxuICAgKi9cbiAgc3RhdGljIGNyZWF0ZShvcHRpb25zOiB7cHJvdmlkZXJzOiBTdGF0aWNQcm92aWRlcltdLCBwYXJlbnQ/OiBJbmplY3RvciwgbmFtZT86IHN0cmluZ30pOiBJbmplY3RvcjtcblxuXG4gIHN0YXRpYyBjcmVhdGUoXG4gICAgICBvcHRpb25zOiBTdGF0aWNQcm92aWRlcltdfHtwcm92aWRlcnM6IFN0YXRpY1Byb3ZpZGVyW10sIHBhcmVudD86IEluamVjdG9yLCBuYW1lPzogc3RyaW5nfSxcbiAgICAgIHBhcmVudD86IEluamVjdG9yKTogSW5qZWN0b3Ige1xuICAgIGlmIChBcnJheS5pc0FycmF5KG9wdGlvbnMpKSB7XG4gICAgICByZXR1cm4gSU5KRUNUT1JfSU1QTChvcHRpb25zLCBwYXJlbnQsICcnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIElOSkVDVE9SX0lNUEwob3B0aW9ucy5wcm92aWRlcnMsIG9wdGlvbnMucGFyZW50LCBvcHRpb25zLm5hbWUgfHwgJycpO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBAbm9jb2xsYXBzZSAqL1xuICBzdGF0aWMgybVwcm92ID0gybXJtWRlZmluZUluamVjdGFibGUoe1xuICAgIHRva2VuOiBJbmplY3RvcixcbiAgICBwcm92aWRlZEluOiAnYW55JyBhcyBhbnksXG4gICAgZmFjdG9yeTogKCkgPT4gybXJtWluamVjdChJTkpFQ1RPUiksXG4gIH0pO1xuXG4gIC8qKlxuICAgKiBAaW50ZXJuYWxcbiAgICogQG5vY29sbGFwc2VcbiAgICovXG4gIHN0YXRpYyBfX05HX0VMRU1FTlRfSURfXyA9IEluamVjdG9yTWFya2Vycy5JbmplY3Rvcjtcbn1cblxuXG5cbmNvbnN0IElERU5UID0gZnVuY3Rpb248VD4odmFsdWU6IFQpOiBUIHtcbiAgcmV0dXJuIHZhbHVlO1xufTtcbmNvbnN0IEVNUFRZID0gPGFueVtdPltdO1xuY29uc3QgQ0lSQ1VMQVIgPSBJREVOVDtcbmNvbnN0IE1VTFRJX1BST1ZJREVSX0ZOID0gZnVuY3Rpb24oKTogYW55W10ge1xuICByZXR1cm4gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzKTtcbn07XG5cbmNvbnN0IGVudW0gT3B0aW9uRmxhZ3Mge1xuICBPcHRpb25hbCA9IDEgPDwgMCxcbiAgQ2hlY2tTZWxmID0gMSA8PCAxLFxuICBDaGVja1BhcmVudCA9IDEgPDwgMixcbiAgRGVmYXVsdCA9IENoZWNrU2VsZiB8IENoZWNrUGFyZW50XG59XG5jb25zdCBOT19ORVdfTElORSA9ICfJtSc7XG5cbmV4cG9ydCBjbGFzcyBTdGF0aWNJbmplY3RvciBpbXBsZW1lbnRzIEluamVjdG9yIHtcbiAgcmVhZG9ubHkgcGFyZW50OiBJbmplY3RvcjtcbiAgcmVhZG9ubHkgc291cmNlOiBzdHJpbmd8bnVsbDtcbiAgcmVhZG9ubHkgc2NvcGU6IHN0cmluZ3xudWxsO1xuXG4gIHByaXZhdGUgX3JlY29yZHM6IE1hcDxhbnksIFJlY29yZHxudWxsPjtcblxuICBjb25zdHJ1Y3RvcihcbiAgICAgIHByb3ZpZGVyczogU3RhdGljUHJvdmlkZXJbXSwgcGFyZW50OiBJbmplY3RvciA9IEluamVjdG9yLk5VTEwsIHNvdXJjZTogc3RyaW5nfG51bGwgPSBudWxsKSB7XG4gICAgdGhpcy5wYXJlbnQgPSBwYXJlbnQ7XG4gICAgdGhpcy5zb3VyY2UgPSBzb3VyY2U7XG4gICAgY29uc3QgcmVjb3JkcyA9IHRoaXMuX3JlY29yZHMgPSBuZXcgTWFwPGFueSwgUmVjb3JkPigpO1xuICAgIHJlY29yZHMuc2V0KFxuICAgICAgICBJbmplY3RvciwgPFJlY29yZD57dG9rZW46IEluamVjdG9yLCBmbjogSURFTlQsIGRlcHM6IEVNUFRZLCB2YWx1ZTogdGhpcywgdXNlTmV3OiBmYWxzZX0pO1xuICAgIHJlY29yZHMuc2V0KFxuICAgICAgICBJTkpFQ1RPUiwgPFJlY29yZD57dG9rZW46IElOSkVDVE9SLCBmbjogSURFTlQsIGRlcHM6IEVNUFRZLCB2YWx1ZTogdGhpcywgdXNlTmV3OiBmYWxzZX0pO1xuICAgIHRoaXMuc2NvcGUgPSByZWN1cnNpdmVseVByb2Nlc3NQcm92aWRlcnMocmVjb3JkcywgcHJvdmlkZXJzKTtcbiAgfVxuXG4gIGdldDxUPih0b2tlbjogVHlwZTxUPnxBYnN0cmFjdFR5cGU8VD58SW5qZWN0aW9uVG9rZW48VD4sIG5vdEZvdW5kVmFsdWU/OiBULCBmbGFncz86IEluamVjdEZsYWdzKTpcbiAgICAgIFQ7XG4gIGdldCh0b2tlbjogYW55LCBub3RGb3VuZFZhbHVlPzogYW55KTogYW55O1xuICBnZXQodG9rZW46IGFueSwgbm90Rm91bmRWYWx1ZT86IGFueSwgZmxhZ3M6IEluamVjdEZsYWdzID0gSW5qZWN0RmxhZ3MuRGVmYXVsdCk6IGFueSB7XG4gICAgY29uc3QgcmVjb3JkcyA9IHRoaXMuX3JlY29yZHM7XG4gICAgbGV0IHJlY29yZCA9IHJlY29yZHMuZ2V0KHRva2VuKTtcbiAgICBpZiAocmVjb3JkID09PSB1bmRlZmluZWQpIHtcbiAgICAgIC8vIFRoaXMgbWVhbnMgd2UgaGF2ZSBuZXZlciBzZWVuIHRoaXMgcmVjb3JkLCBzZWUgaWYgaXQgaXMgdHJlZSBzaGFrYWJsZSBwcm92aWRlci5cbiAgICAgIGNvbnN0IGluamVjdGFibGVEZWYgPSBnZXRJbmplY3RhYmxlRGVmKHRva2VuKTtcbiAgICAgIGlmIChpbmplY3RhYmxlRGVmKSB7XG4gICAgICAgIGNvbnN0IHByb3ZpZGVkSW4gPSBpbmplY3RhYmxlRGVmICYmIGluamVjdGFibGVEZWYucHJvdmlkZWRJbjtcbiAgICAgICAgaWYgKHByb3ZpZGVkSW4gPT09ICdhbnknIHx8IHByb3ZpZGVkSW4gIT0gbnVsbCAmJiBwcm92aWRlZEluID09PSB0aGlzLnNjb3BlKSB7XG4gICAgICAgICAgcmVjb3Jkcy5zZXQoXG4gICAgICAgICAgICAgIHRva2VuLFxuICAgICAgICAgICAgICByZWNvcmQgPSByZXNvbHZlUHJvdmlkZXIoXG4gICAgICAgICAgICAgICAgICB7cHJvdmlkZTogdG9rZW4sIHVzZUZhY3Rvcnk6IGluamVjdGFibGVEZWYuZmFjdG9yeSwgZGVwczogRU1QVFl9KSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmIChyZWNvcmQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAvLyBTZXQgcmVjb3JkIHRvIG51bGwgdG8gbWFrZSBzdXJlIHRoYXQgd2UgZG9uJ3QgZ28gdGhyb3VnaCBleHBlbnNpdmUgbG9va3VwIGFib3ZlIGFnYWluLlxuICAgICAgICByZWNvcmRzLnNldCh0b2tlbiwgbnVsbCk7XG4gICAgICB9XG4gICAgfVxuICAgIGxldCBsYXN0SW5qZWN0b3IgPSBzZXRDdXJyZW50SW5qZWN0b3IodGhpcyk7XG4gICAgdHJ5IHtcbiAgICAgIHJldHVybiB0cnlSZXNvbHZlVG9rZW4odG9rZW4sIHJlY29yZCwgcmVjb3JkcywgdGhpcy5wYXJlbnQsIG5vdEZvdW5kVmFsdWUsIGZsYWdzKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICByZXR1cm4gY2F0Y2hJbmplY3RvckVycm9yKGUsIHRva2VuLCAnU3RhdGljSW5qZWN0b3JFcnJvcicsIHRoaXMuc291cmNlKTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgc2V0Q3VycmVudEluamVjdG9yKGxhc3RJbmplY3Rvcik7XG4gICAgfVxuICB9XG5cbiAgdG9TdHJpbmcoKSB7XG4gICAgY29uc3QgdG9rZW5zID0gPHN0cmluZ1tdPltdLCByZWNvcmRzID0gdGhpcy5fcmVjb3JkcztcbiAgICByZWNvcmRzLmZvckVhY2goKHYsIHRva2VuKSA9PiB0b2tlbnMucHVzaChzdHJpbmdpZnkodG9rZW4pKSk7XG4gICAgcmV0dXJuIGBTdGF0aWNJbmplY3Rvclske3Rva2Vucy5qb2luKCcsICcpfV1gO1xuICB9XG59XG5cbnR5cGUgU3VwcG9ydGVkUHJvdmlkZXIgPVxuICAgIFZhbHVlUHJvdmlkZXJ8RXhpc3RpbmdQcm92aWRlcnxTdGF0aWNDbGFzc1Byb3ZpZGVyfENvbnN0cnVjdG9yUHJvdmlkZXJ8RmFjdG9yeVByb3ZpZGVyO1xuXG5pbnRlcmZhY2UgUmVjb3JkIHtcbiAgZm46IEZ1bmN0aW9uO1xuICB1c2VOZXc6IGJvb2xlYW47XG4gIGRlcHM6IERlcGVuZGVuY3lSZWNvcmRbXTtcbiAgdmFsdWU6IGFueTtcbn1cblxuaW50ZXJmYWNlIERlcGVuZGVuY3lSZWNvcmQge1xuICB0b2tlbjogYW55O1xuICBvcHRpb25zOiBudW1iZXI7XG59XG5cbmZ1bmN0aW9uIHJlc29sdmVQcm92aWRlcihwcm92aWRlcjogU3VwcG9ydGVkUHJvdmlkZXIpOiBSZWNvcmQge1xuICBjb25zdCBkZXBzID0gY29tcHV0ZURlcHMocHJvdmlkZXIpO1xuICBsZXQgZm46IEZ1bmN0aW9uID0gSURFTlQ7XG4gIGxldCB2YWx1ZTogYW55ID0gRU1QVFk7XG4gIGxldCB1c2VOZXc6IGJvb2xlYW4gPSBmYWxzZTtcbiAgbGV0IHByb3ZpZGUgPSByZXNvbHZlRm9yd2FyZFJlZihwcm92aWRlci5wcm92aWRlKTtcbiAgaWYgKFVTRV9WQUxVRSBpbiBwcm92aWRlcikge1xuICAgIC8vIFdlIG5lZWQgdG8gdXNlIFVTRV9WQUxVRSBpbiBwcm92aWRlciBzaW5jZSBwcm92aWRlci51c2VWYWx1ZSBjb3VsZCBiZSBkZWZpbmVkIGFzIHVuZGVmaW5lZC5cbiAgICB2YWx1ZSA9IChwcm92aWRlciBhcyBWYWx1ZVByb3ZpZGVyKS51c2VWYWx1ZTtcbiAgfSBlbHNlIGlmICgocHJvdmlkZXIgYXMgRmFjdG9yeVByb3ZpZGVyKS51c2VGYWN0b3J5KSB7XG4gICAgZm4gPSAocHJvdmlkZXIgYXMgRmFjdG9yeVByb3ZpZGVyKS51c2VGYWN0b3J5O1xuICB9IGVsc2UgaWYgKChwcm92aWRlciBhcyBFeGlzdGluZ1Byb3ZpZGVyKS51c2VFeGlzdGluZykge1xuICAgIC8vIEp1c3QgdXNlIElERU5UXG4gIH0gZWxzZSBpZiAoKHByb3ZpZGVyIGFzIFN0YXRpY0NsYXNzUHJvdmlkZXIpLnVzZUNsYXNzKSB7XG4gICAgdXNlTmV3ID0gdHJ1ZTtcbiAgICBmbiA9IHJlc29sdmVGb3J3YXJkUmVmKChwcm92aWRlciBhcyBTdGF0aWNDbGFzc1Byb3ZpZGVyKS51c2VDbGFzcyk7XG4gIH0gZWxzZSBpZiAodHlwZW9mIHByb3ZpZGUgPT0gJ2Z1bmN0aW9uJykge1xuICAgIHVzZU5ldyA9IHRydWU7XG4gICAgZm4gPSBwcm92aWRlO1xuICB9IGVsc2Uge1xuICAgIHRocm93IHN0YXRpY0Vycm9yKFxuICAgICAgICAnU3RhdGljUHJvdmlkZXIgZG9lcyBub3QgaGF2ZSBbdXNlVmFsdWV8dXNlRmFjdG9yeXx1c2VFeGlzdGluZ3x1c2VDbGFzc10gb3IgW3Byb3ZpZGVdIGlzIG5vdCBuZXdhYmxlJyxcbiAgICAgICAgcHJvdmlkZXIpO1xuICB9XG4gIHJldHVybiB7ZGVwcywgZm4sIHVzZU5ldywgdmFsdWV9O1xufVxuXG5mdW5jdGlvbiBtdWx0aVByb3ZpZGVyTWl4RXJyb3IodG9rZW46IGFueSkge1xuICByZXR1cm4gc3RhdGljRXJyb3IoJ0Nhbm5vdCBtaXggbXVsdGkgcHJvdmlkZXJzIGFuZCByZWd1bGFyIHByb3ZpZGVycycsIHRva2VuKTtcbn1cblxuZnVuY3Rpb24gcmVjdXJzaXZlbHlQcm9jZXNzUHJvdmlkZXJzKHJlY29yZHM6IE1hcDxhbnksIFJlY29yZD4sIHByb3ZpZGVyOiBTdGF0aWNQcm92aWRlcik6IHN0cmluZ3xcbiAgICBudWxsIHtcbiAgbGV0IHNjb3BlOiBzdHJpbmd8bnVsbCA9IG51bGw7XG4gIGlmIChwcm92aWRlcikge1xuICAgIHByb3ZpZGVyID0gcmVzb2x2ZUZvcndhcmRSZWYocHJvdmlkZXIpO1xuICAgIGlmIChBcnJheS5pc0FycmF5KHByb3ZpZGVyKSkge1xuICAgICAgLy8gaWYgd2UgaGF2ZSBhbiBhcnJheSByZWN1cnNlIGludG8gdGhlIGFycmF5XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHByb3ZpZGVyLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHNjb3BlID0gcmVjdXJzaXZlbHlQcm9jZXNzUHJvdmlkZXJzKHJlY29yZHMsIHByb3ZpZGVyW2ldKSB8fCBzY29wZTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBwcm92aWRlciA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgLy8gRnVuY3Rpb25zIHdlcmUgc3VwcG9ydGVkIGluIFJlZmxlY3RpdmVJbmplY3RvciwgYnV0IGFyZSBub3QgaGVyZS4gRm9yIHNhZmV0eSBnaXZlIHVzZWZ1bFxuICAgICAgLy8gZXJyb3IgbWVzc2FnZXNcbiAgICAgIHRocm93IHN0YXRpY0Vycm9yKCdGdW5jdGlvbi9DbGFzcyBub3Qgc3VwcG9ydGVkJywgcHJvdmlkZXIpO1xuICAgIH0gZWxzZSBpZiAocHJvdmlkZXIgJiYgdHlwZW9mIHByb3ZpZGVyID09PSAnb2JqZWN0JyAmJiBwcm92aWRlci5wcm92aWRlKSB7XG4gICAgICAvLyBBdCB0aGlzIHBvaW50IHdlIGhhdmUgd2hhdCBsb29rcyBsaWtlIGEgcHJvdmlkZXI6IHtwcm92aWRlOiA/LCAuLi4ufVxuICAgICAgbGV0IHRva2VuID0gcmVzb2x2ZUZvcndhcmRSZWYocHJvdmlkZXIucHJvdmlkZSk7XG4gICAgICBjb25zdCByZXNvbHZlZFByb3ZpZGVyID0gcmVzb2x2ZVByb3ZpZGVyKHByb3ZpZGVyKTtcbiAgICAgIGlmIChwcm92aWRlci5tdWx0aSA9PT0gdHJ1ZSkge1xuICAgICAgICAvLyBUaGlzIGlzIGEgbXVsdGkgcHJvdmlkZXIuXG4gICAgICAgIGxldCBtdWx0aVByb3ZpZGVyOiBSZWNvcmR8dW5kZWZpbmVkID0gcmVjb3Jkcy5nZXQodG9rZW4pO1xuICAgICAgICBpZiAobXVsdGlQcm92aWRlcikge1xuICAgICAgICAgIGlmIChtdWx0aVByb3ZpZGVyLmZuICE9PSBNVUxUSV9QUk9WSURFUl9GTikge1xuICAgICAgICAgICAgdGhyb3cgbXVsdGlQcm92aWRlck1peEVycm9yKHRva2VuKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gQ3JlYXRlIGEgcGxhY2Vob2xkZXIgZmFjdG9yeSB3aGljaCB3aWxsIGxvb2sgdXAgdGhlIGNvbnN0aXR1ZW50cyBvZiB0aGUgbXVsdGkgcHJvdmlkZXIuXG4gICAgICAgICAgcmVjb3Jkcy5zZXQodG9rZW4sIG11bHRpUHJvdmlkZXIgPSA8UmVjb3JkPntcbiAgICAgICAgICAgIHRva2VuOiBwcm92aWRlci5wcm92aWRlLFxuICAgICAgICAgICAgZGVwczogW10sXG4gICAgICAgICAgICB1c2VOZXc6IGZhbHNlLFxuICAgICAgICAgICAgZm46IE1VTFRJX1BST1ZJREVSX0ZOLFxuICAgICAgICAgICAgdmFsdWU6IEVNUFRZXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gVHJlYXQgdGhlIHByb3ZpZGVyIGFzIHRoZSB0b2tlbi5cbiAgICAgICAgdG9rZW4gPSBwcm92aWRlcjtcbiAgICAgICAgbXVsdGlQcm92aWRlci5kZXBzLnB1c2goe3Rva2VuLCBvcHRpb25zOiBPcHRpb25GbGFncy5EZWZhdWx0fSk7XG4gICAgICB9XG4gICAgICBjb25zdCByZWNvcmQgPSByZWNvcmRzLmdldCh0b2tlbik7XG4gICAgICBpZiAocmVjb3JkICYmIHJlY29yZC5mbiA9PSBNVUxUSV9QUk9WSURFUl9GTikge1xuICAgICAgICB0aHJvdyBtdWx0aVByb3ZpZGVyTWl4RXJyb3IodG9rZW4pO1xuICAgICAgfVxuICAgICAgaWYgKHRva2VuID09PSBJTkpFQ1RPUl9TQ09QRSkge1xuICAgICAgICBzY29wZSA9IHJlc29sdmVkUHJvdmlkZXIudmFsdWU7XG4gICAgICB9XG4gICAgICByZWNvcmRzLnNldCh0b2tlbiwgcmVzb2x2ZWRQcm92aWRlcik7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IHN0YXRpY0Vycm9yKCdVbmV4cGVjdGVkIHByb3ZpZGVyJywgcHJvdmlkZXIpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gc2NvcGU7XG59XG5cbmZ1bmN0aW9uIHRyeVJlc29sdmVUb2tlbihcbiAgICB0b2tlbjogYW55LCByZWNvcmQ6IFJlY29yZHx1bmRlZmluZWR8bnVsbCwgcmVjb3JkczogTWFwPGFueSwgUmVjb3JkfG51bGw+LCBwYXJlbnQ6IEluamVjdG9yLFxuICAgIG5vdEZvdW5kVmFsdWU6IGFueSwgZmxhZ3M6IEluamVjdEZsYWdzKTogYW55IHtcbiAgdHJ5IHtcbiAgICByZXR1cm4gcmVzb2x2ZVRva2VuKHRva2VuLCByZWNvcmQsIHJlY29yZHMsIHBhcmVudCwgbm90Rm91bmRWYWx1ZSwgZmxhZ3MpO1xuICB9IGNhdGNoIChlKSB7XG4gICAgLy8gZW5zdXJlIHRoYXQgJ2UnIGlzIG9mIHR5cGUgRXJyb3IuXG4gICAgaWYgKCEoZSBpbnN0YW5jZW9mIEVycm9yKSkge1xuICAgICAgZSA9IG5ldyBFcnJvcihlKTtcbiAgICB9XG4gICAgY29uc3QgcGF0aDogYW55W10gPSBlW05HX1RFTVBfVE9LRU5fUEFUSF0gPSBlW05HX1RFTVBfVE9LRU5fUEFUSF0gfHwgW107XG4gICAgcGF0aC51bnNoaWZ0KHRva2VuKTtcbiAgICBpZiAocmVjb3JkICYmIHJlY29yZC52YWx1ZSA9PSBDSVJDVUxBUikge1xuICAgICAgLy8gUmVzZXQgdGhlIENpcmN1bGFyIGZsYWcuXG4gICAgICByZWNvcmQudmFsdWUgPSBFTVBUWTtcbiAgICB9XG4gICAgdGhyb3cgZTtcbiAgfVxufVxuXG5mdW5jdGlvbiByZXNvbHZlVG9rZW4oXG4gICAgdG9rZW46IGFueSwgcmVjb3JkOiBSZWNvcmR8dW5kZWZpbmVkfG51bGwsIHJlY29yZHM6IE1hcDxhbnksIFJlY29yZHxudWxsPiwgcGFyZW50OiBJbmplY3RvcixcbiAgICBub3RGb3VuZFZhbHVlOiBhbnksIGZsYWdzOiBJbmplY3RGbGFncyk6IGFueSB7XG4gIGxldCB2YWx1ZTtcbiAgaWYgKHJlY29yZCAmJiAhKGZsYWdzICYgSW5qZWN0RmxhZ3MuU2tpcFNlbGYpKSB7XG4gICAgLy8gSWYgd2UgZG9uJ3QgaGF2ZSBhIHJlY29yZCwgdGhpcyBpbXBsaWVzIHRoYXQgd2UgZG9uJ3Qgb3duIHRoZSBwcm92aWRlciBoZW5jZSBkb24ndCBrbm93IGhvd1xuICAgIC8vIHRvIHJlc29sdmUgaXQuXG4gICAgdmFsdWUgPSByZWNvcmQudmFsdWU7XG4gICAgaWYgKHZhbHVlID09IENJUkNVTEFSKSB7XG4gICAgICB0aHJvdyBFcnJvcihOT19ORVdfTElORSArICdDaXJjdWxhciBkZXBlbmRlbmN5Jyk7XG4gICAgfSBlbHNlIGlmICh2YWx1ZSA9PT0gRU1QVFkpIHtcbiAgICAgIHJlY29yZC52YWx1ZSA9IENJUkNVTEFSO1xuICAgICAgbGV0IG9iaiA9IHVuZGVmaW5lZDtcbiAgICAgIGxldCB1c2VOZXcgPSByZWNvcmQudXNlTmV3O1xuICAgICAgbGV0IGZuID0gcmVjb3JkLmZuO1xuICAgICAgbGV0IGRlcFJlY29yZHMgPSByZWNvcmQuZGVwcztcbiAgICAgIGxldCBkZXBzID0gRU1QVFk7XG4gICAgICBpZiAoZGVwUmVjb3Jkcy5sZW5ndGgpIHtcbiAgICAgICAgZGVwcyA9IFtdO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRlcFJlY29yZHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBjb25zdCBkZXBSZWNvcmQ6IERlcGVuZGVuY3lSZWNvcmQgPSBkZXBSZWNvcmRzW2ldO1xuICAgICAgICAgIGNvbnN0IG9wdGlvbnMgPSBkZXBSZWNvcmQub3B0aW9ucztcbiAgICAgICAgICBjb25zdCBjaGlsZFJlY29yZCA9XG4gICAgICAgICAgICAgIG9wdGlvbnMgJiBPcHRpb25GbGFncy5DaGVja1NlbGYgPyByZWNvcmRzLmdldChkZXBSZWNvcmQudG9rZW4pIDogdW5kZWZpbmVkO1xuICAgICAgICAgIGRlcHMucHVzaCh0cnlSZXNvbHZlVG9rZW4oXG4gICAgICAgICAgICAgIC8vIEN1cnJlbnQgVG9rZW4gdG8gcmVzb2x2ZVxuICAgICAgICAgICAgICBkZXBSZWNvcmQudG9rZW4sXG4gICAgICAgICAgICAgIC8vIEEgcmVjb3JkIHdoaWNoIGRlc2NyaWJlcyBob3cgdG8gcmVzb2x2ZSB0aGUgdG9rZW4uXG4gICAgICAgICAgICAgIC8vIElmIHVuZGVmaW5lZCwgdGhpcyBtZWFucyB3ZSBkb24ndCBoYXZlIHN1Y2ggYSByZWNvcmRcbiAgICAgICAgICAgICAgY2hpbGRSZWNvcmQsXG4gICAgICAgICAgICAgIC8vIE90aGVyIHJlY29yZHMgd2Uga25vdyBhYm91dC5cbiAgICAgICAgICAgICAgcmVjb3JkcyxcbiAgICAgICAgICAgICAgLy8gSWYgd2UgZG9uJ3Qga25vdyBob3cgdG8gcmVzb2x2ZSBkZXBlbmRlbmN5IGFuZCB3ZSBzaG91bGQgbm90IGNoZWNrIHBhcmVudCBmb3IgaXQsXG4gICAgICAgICAgICAgIC8vIHRoYW4gcGFzcyBpbiBOdWxsIGluamVjdG9yLlxuICAgICAgICAgICAgICAhY2hpbGRSZWNvcmQgJiYgIShvcHRpb25zICYgT3B0aW9uRmxhZ3MuQ2hlY2tQYXJlbnQpID8gSW5qZWN0b3IuTlVMTCA6IHBhcmVudCxcbiAgICAgICAgICAgICAgb3B0aW9ucyAmIE9wdGlvbkZsYWdzLk9wdGlvbmFsID8gbnVsbCA6IEluamVjdG9yLlRIUk9XX0lGX05PVF9GT1VORCxcbiAgICAgICAgICAgICAgSW5qZWN0RmxhZ3MuRGVmYXVsdCkpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZWNvcmQudmFsdWUgPSB2YWx1ZSA9IHVzZU5ldyA/IG5ldyAoZm4gYXMgYW55KSguLi5kZXBzKSA6IGZuLmFwcGx5KG9iaiwgZGVwcyk7XG4gICAgfVxuICB9IGVsc2UgaWYgKCEoZmxhZ3MgJiBJbmplY3RGbGFncy5TZWxmKSkge1xuICAgIHZhbHVlID0gcGFyZW50LmdldCh0b2tlbiwgbm90Rm91bmRWYWx1ZSwgSW5qZWN0RmxhZ3MuRGVmYXVsdCk7XG4gIH0gZWxzZSBpZiAoIShmbGFncyAmIEluamVjdEZsYWdzLk9wdGlvbmFsKSkge1xuICAgIHZhbHVlID0gSW5qZWN0b3IuTlVMTC5nZXQodG9rZW4sIG5vdEZvdW5kVmFsdWUpO1xuICB9IGVsc2Uge1xuICAgIHZhbHVlID0gSW5qZWN0b3IuTlVMTC5nZXQodG9rZW4sIHR5cGVvZiBub3RGb3VuZFZhbHVlICE9PSAndW5kZWZpbmVkJyA/IG5vdEZvdW5kVmFsdWUgOiBudWxsKTtcbiAgfVxuICByZXR1cm4gdmFsdWU7XG59XG5cbmZ1bmN0aW9uIGNvbXB1dGVEZXBzKHByb3ZpZGVyOiBTdGF0aWNQcm92aWRlcik6IERlcGVuZGVuY3lSZWNvcmRbXSB7XG4gIGxldCBkZXBzOiBEZXBlbmRlbmN5UmVjb3JkW10gPSBFTVBUWTtcbiAgY29uc3QgcHJvdmlkZXJEZXBzOiBhbnlbXSA9XG4gICAgICAocHJvdmlkZXIgYXMgRXhpc3RpbmdQcm92aWRlciAmIFN0YXRpY0NsYXNzUHJvdmlkZXIgJiBDb25zdHJ1Y3RvclByb3ZpZGVyKS5kZXBzO1xuICBpZiAocHJvdmlkZXJEZXBzICYmIHByb3ZpZGVyRGVwcy5sZW5ndGgpIHtcbiAgICBkZXBzID0gW107XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwcm92aWRlckRlcHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGxldCBvcHRpb25zID0gT3B0aW9uRmxhZ3MuRGVmYXVsdDtcbiAgICAgIGxldCB0b2tlbiA9IHJlc29sdmVGb3J3YXJkUmVmKHByb3ZpZGVyRGVwc1tpXSk7XG4gICAgICBpZiAoQXJyYXkuaXNBcnJheSh0b2tlbikpIHtcbiAgICAgICAgZm9yIChsZXQgaiA9IDAsIGFubm90YXRpb25zID0gdG9rZW47IGogPCBhbm5vdGF0aW9ucy5sZW5ndGg7IGorKykge1xuICAgICAgICAgIGNvbnN0IGFubm90YXRpb24gPSBhbm5vdGF0aW9uc1tqXTtcbiAgICAgICAgICBpZiAoYW5ub3RhdGlvbiBpbnN0YW5jZW9mIE9wdGlvbmFsIHx8IGFubm90YXRpb24gPT0gT3B0aW9uYWwpIHtcbiAgICAgICAgICAgIG9wdGlvbnMgPSBvcHRpb25zIHwgT3B0aW9uRmxhZ3MuT3B0aW9uYWw7XG4gICAgICAgICAgfSBlbHNlIGlmIChhbm5vdGF0aW9uIGluc3RhbmNlb2YgU2tpcFNlbGYgfHwgYW5ub3RhdGlvbiA9PSBTa2lwU2VsZikge1xuICAgICAgICAgICAgb3B0aW9ucyA9IG9wdGlvbnMgJiB+T3B0aW9uRmxhZ3MuQ2hlY2tTZWxmO1xuICAgICAgICAgIH0gZWxzZSBpZiAoYW5ub3RhdGlvbiBpbnN0YW5jZW9mIFNlbGYgfHwgYW5ub3RhdGlvbiA9PSBTZWxmKSB7XG4gICAgICAgICAgICBvcHRpb25zID0gb3B0aW9ucyAmIH5PcHRpb25GbGFncy5DaGVja1BhcmVudDtcbiAgICAgICAgICB9IGVsc2UgaWYgKGFubm90YXRpb24gaW5zdGFuY2VvZiBJbmplY3QpIHtcbiAgICAgICAgICAgIHRva2VuID0gKGFubm90YXRpb24gYXMgSW5qZWN0KS50b2tlbjtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdG9rZW4gPSByZXNvbHZlRm9yd2FyZFJlZihhbm5vdGF0aW9uKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGRlcHMucHVzaCh7dG9rZW4sIG9wdGlvbnN9KTtcbiAgICB9XG4gIH0gZWxzZSBpZiAoKHByb3ZpZGVyIGFzIEV4aXN0aW5nUHJvdmlkZXIpLnVzZUV4aXN0aW5nKSB7XG4gICAgY29uc3QgdG9rZW4gPSByZXNvbHZlRm9yd2FyZFJlZigocHJvdmlkZXIgYXMgRXhpc3RpbmdQcm92aWRlcikudXNlRXhpc3RpbmcpO1xuICAgIGRlcHMgPSBbe3Rva2VuLCBvcHRpb25zOiBPcHRpb25GbGFncy5EZWZhdWx0fV07XG4gIH0gZWxzZSBpZiAoIXByb3ZpZGVyRGVwcyAmJiAhKFVTRV9WQUxVRSBpbiBwcm92aWRlcikpIHtcbiAgICAvLyB1c2VWYWx1ZSAmIHVzZUV4aXN0aW5nIGFyZSB0aGUgb25seSBvbmVzIHdoaWNoIGFyZSBleGVtcHQgZnJvbSBkZXBzIGFsbCBvdGhlcnMgbmVlZCBpdC5cbiAgICB0aHJvdyBzdGF0aWNFcnJvcignXFwnZGVwc1xcJyByZXF1aXJlZCcsIHByb3ZpZGVyKTtcbiAgfVxuICByZXR1cm4gZGVwcztcbn1cblxuZnVuY3Rpb24gc3RhdGljRXJyb3IodGV4dDogc3RyaW5nLCBvYmo6IGFueSk6IEVycm9yIHtcbiAgcmV0dXJuIG5ldyBFcnJvcihmb3JtYXRFcnJvcih0ZXh0LCBvYmosICdTdGF0aWNJbmplY3RvckVycm9yJykpO1xufVxuIl19