/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { reflector } from '../reflection/reflection';
import { Type } from '../type';
import { resolveForwardRef } from './forward_ref';
import { InjectionToken } from './injection_token';
import { Inject, Optional, Self, SkipSelf } from './metadata';
import { invalidProviderError, mixingMultiProvidersWithRegularProvidersError, noAnnotationError } from './reflective_errors';
import { ReflectiveKey } from './reflective_key';
/**
 * `Dependency` is used by the framework to extend DI.
 * This is internal to Angular and should not be used directly.
 */
var /**
 * `Dependency` is used by the framework to extend DI.
 * This is internal to Angular and should not be used directly.
 */
ReflectiveDependency = /** @class */ (function () {
    function ReflectiveDependency(key, optional, visibility) {
        this.key = key;
        this.optional = optional;
        this.visibility = visibility;
    }
    ReflectiveDependency.fromKey = function (key) {
        return new ReflectiveDependency(key, false, null);
    };
    return ReflectiveDependency;
}());
/**
 * `Dependency` is used by the framework to extend DI.
 * This is internal to Angular and should not be used directly.
 */
export { ReflectiveDependency };
var _EMPTY_LIST = [];
var ResolvedReflectiveProvider_ = /** @class */ (function () {
    function ResolvedReflectiveProvider_(key, resolvedFactories, multiProvider) {
        this.key = key;
        this.resolvedFactories = resolvedFactories;
        this.multiProvider = multiProvider;
        this.resolvedFactory = this.resolvedFactories[0];
    }
    return ResolvedReflectiveProvider_;
}());
export { ResolvedReflectiveProvider_ };
/**
 * An internal resolved representation of a factory function created by resolving {@link
 * Provider}.
 * @experimental
 */
var /**
 * An internal resolved representation of a factory function created by resolving {@link
 * Provider}.
 * @experimental
 */
ResolvedReflectiveFactory = /** @class */ (function () {
    function ResolvedReflectiveFactory(/**
           * Factory function which can return an instance of an object represented by a key.
           */
    factory, /**
           * Arguments (dependencies) to the `factory` function.
           */
    dependencies) {
        this.factory = factory;
        this.dependencies = dependencies;
    }
    return ResolvedReflectiveFactory;
}());
/**
 * An internal resolved representation of a factory function created by resolving {@link
 * Provider}.
 * @experimental
 */
export { ResolvedReflectiveFactory };
/**
 * Resolve a single provider.
 */
function resolveReflectiveFactory(provider) {
    var factoryFn;
    var resolvedDeps;
    if (provider.useClass) {
        var useClass = resolveForwardRef(provider.useClass);
        factoryFn = reflector.factory(useClass);
        resolvedDeps = _dependenciesFor(useClass);
    }
    else if (provider.useExisting) {
        factoryFn = function (aliasInstance) { return aliasInstance; };
        resolvedDeps = [ReflectiveDependency.fromKey(ReflectiveKey.get(provider.useExisting))];
    }
    else if (provider.useFactory) {
        factoryFn = provider.useFactory;
        resolvedDeps = constructDependencies(provider.useFactory, provider.deps);
    }
    else {
        factoryFn = function () { return provider.useValue; };
        resolvedDeps = _EMPTY_LIST;
    }
    return new ResolvedReflectiveFactory(factoryFn, resolvedDeps);
}
/**
 * Converts the {@link Provider} into {@link ResolvedProvider}.
 *
 * {@link Injector} internally only uses {@link ResolvedProvider}, {@link Provider} contains
 * convenience provider syntax.
 */
function resolveReflectiveProvider(provider) {
    return new ResolvedReflectiveProvider_(ReflectiveKey.get(provider.provide), [resolveReflectiveFactory(provider)], provider.multi || false);
}
/**
 * Resolve a list of Providers.
 */
export function resolveReflectiveProviders(providers) {
    var normalized = _normalizeProviders(providers, []);
    var resolved = normalized.map(resolveReflectiveProvider);
    var resolvedProviderMap = mergeResolvedReflectiveProviders(resolved, new Map());
    return Array.from(resolvedProviderMap.values());
}
/**
 * Merges a list of ResolvedProviders into a list where
 * each key is contained exactly once and multi providers
 * have been merged.
 */
export function mergeResolvedReflectiveProviders(providers, normalizedProvidersMap) {
    for (var i = 0; i < providers.length; i++) {
        var provider = providers[i];
        var existing = normalizedProvidersMap.get(provider.key.id);
        if (existing) {
            if (provider.multiProvider !== existing.multiProvider) {
                throw mixingMultiProvidersWithRegularProvidersError(existing, provider);
            }
            if (provider.multiProvider) {
                for (var j = 0; j < provider.resolvedFactories.length; j++) {
                    existing.resolvedFactories.push(provider.resolvedFactories[j]);
                }
            }
            else {
                normalizedProvidersMap.set(provider.key.id, provider);
            }
        }
        else {
            var resolvedProvider = void 0;
            if (provider.multiProvider) {
                resolvedProvider = new ResolvedReflectiveProvider_(provider.key, provider.resolvedFactories.slice(), provider.multiProvider);
            }
            else {
                resolvedProvider = provider;
            }
            normalizedProvidersMap.set(provider.key.id, resolvedProvider);
        }
    }
    return normalizedProvidersMap;
}
function _normalizeProviders(providers, res) {
    providers.forEach(function (b) {
        if (b instanceof Type) {
            res.push({ provide: b, useClass: b });
        }
        else if (b && typeof b == 'object' && b.provide !== undefined) {
            res.push(b);
        }
        else if (b instanceof Array) {
            _normalizeProviders(b, res);
        }
        else {
            throw invalidProviderError(b);
        }
    });
    return res;
}
export function constructDependencies(typeOrFunc, dependencies) {
    if (!dependencies) {
        return _dependenciesFor(typeOrFunc);
    }
    else {
        var params_1 = dependencies.map(function (t) { return [t]; });
        return dependencies.map(function (t) { return _extractToken(typeOrFunc, t, params_1); });
    }
}
function _dependenciesFor(typeOrFunc) {
    var params = reflector.parameters(typeOrFunc);
    if (!params)
        return [];
    if (params.some(function (p) { return p == null; })) {
        throw noAnnotationError(typeOrFunc, params);
    }
    return params.map(function (p) { return _extractToken(typeOrFunc, p, params); });
}
function _extractToken(typeOrFunc, metadata, params) {
    var token = null;
    var optional = false;
    if (!Array.isArray(metadata)) {
        if (metadata instanceof Inject) {
            return _createDependency(metadata.token, optional, null);
        }
        else {
            return _createDependency(metadata, optional, null);
        }
    }
    var visibility = null;
    for (var i = 0; i < metadata.length; ++i) {
        var paramMetadata = metadata[i];
        if (paramMetadata instanceof Type) {
            token = paramMetadata;
        }
        else if (paramMetadata instanceof Inject) {
            token = paramMetadata.token;
        }
        else if (paramMetadata instanceof Optional) {
            optional = true;
        }
        else if (paramMetadata instanceof Self || paramMetadata instanceof SkipSelf) {
            visibility = paramMetadata;
        }
        else if (paramMetadata instanceof InjectionToken) {
            token = paramMetadata;
        }
    }
    token = resolveForwardRef(token);
    if (token != null) {
        return _createDependency(token, optional, visibility);
    }
    else {
        throw noAnnotationError(typeOrFunc, params);
    }
}
function _createDependency(token, optional, visibility) {
    return new ReflectiveDependency(ReflectiveKey.get(token), optional, visibility);
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVmbGVjdGl2ZV9wcm92aWRlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL2RpL3JlZmxlY3RpdmVfcHJvdmlkZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7OztBQVFBLE9BQU8sRUFBQyxTQUFTLEVBQUMsTUFBTSwwQkFBMEIsQ0FBQztBQUNuRCxPQUFPLEVBQUMsSUFBSSxFQUFDLE1BQU0sU0FBUyxDQUFDO0FBRTdCLE9BQU8sRUFBQyxpQkFBaUIsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUNoRCxPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDakQsT0FBTyxFQUFDLE1BQU0sRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBQyxNQUFNLFlBQVksQ0FBQztBQUU1RCxPQUFPLEVBQUMsb0JBQW9CLEVBQUUsNkNBQTZDLEVBQUUsaUJBQWlCLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUMzSCxPQUFPLEVBQUMsYUFBYSxFQUFDLE1BQU0sa0JBQWtCLENBQUM7Ozs7O0FBVS9DOzs7O0FBQUE7SUFDRSw4QkFDVyxHQUFrQixFQUFTLFFBQWlCLEVBQVMsVUFBOEI7UUFBbkYsUUFBRyxHQUFILEdBQUcsQ0FBZTtRQUFTLGFBQVEsR0FBUixRQUFRLENBQVM7UUFBUyxlQUFVLEdBQVYsVUFBVSxDQUFvQjtLQUFJO0lBRTNGLDRCQUFPLEdBQWQsVUFBZSxHQUFrQjtRQUMvQixPQUFPLElBQUksb0JBQW9CLENBQUMsR0FBRyxFQUFFLEtBQUssRUFBRSxJQUFJLENBQUMsQ0FBQztLQUNuRDsrQkFoQ0g7SUFpQ0MsQ0FBQTs7Ozs7QUFQRCxnQ0FPQztBQUVELElBQU0sV0FBVyxHQUFVLEVBQUUsQ0FBQztBQXFDOUIsSUFBQTtJQUdFLHFDQUNXLEdBQWtCLEVBQVMsaUJBQThDLEVBQ3pFLGFBQXNCO1FBRHRCLFFBQUcsR0FBSCxH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LEtBQUssR0FBRyxhQUFhLENBQUM7U0FDdkI7S0FDRjtJQUVELEtBQUssR0FBRyxpQkFBaUIsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUVqQyxJQUFJLEtBQUssSUFBSSxJQUFJLEVBQUU7UUFDakIsT0FBTyxpQkFBaUIsQ0FBQyxLQUFLLEVBQUUsUUFBUSxFQUFFLFVBQVUsQ0FBQyxDQUFDO0tBQ3ZEO1NBQU07UUFDTCxNQUFNLGlCQUFpQixDQUFDLFVBQVUsRUFBRSxNQUFNLENBQUMsQ0FBQztLQUM3QztDQUNGO0FBRUQsMkJBQ0ksS0FBVSxFQUFFLFFBQWlCLEVBQUUsVUFBa0M7SUFDbkUsT0FBTyxJQUFJLG9CQUFvQixDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLEVBQUUsUUFBUSxFQUFFLFVBQVUsQ0FBQyxDQUFDO0NBQ2pGIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge3JlZmxlY3Rvcn0gZnJvbSAnLi4vcmVmbGVjdGlvbi9yZWZsZWN0aW9uJztcbmltcG9ydCB7VHlwZX0gZnJvbSAnLi4vdHlwZSc7XG5cbmltcG9ydCB7cmVzb2x2ZUZvcndhcmRSZWZ9IGZyb20gJy4vZm9yd2FyZF9yZWYnO1xuaW1wb3J0IHtJbmplY3Rpb25Ub2tlbn0gZnJvbSAnLi9pbmplY3Rpb25fdG9rZW4nO1xuaW1wb3J0IHtJbmplY3QsIE9wdGlvbmFsLCBTZWxmLCBTa2lwU2VsZn0gZnJvbSAnLi9tZXRhZGF0YSc7XG5pbXBvcnQge0NsYXNzUHJvdmlkZXIsIEV4aXN0aW5nUHJvdmlkZXIsIEZhY3RvcnlQcm92aWRlciwgUHJvdmlkZXIsIFR5cGVQcm92aWRlciwgVmFsdWVQcm92aWRlcn0gZnJvbSAnLi9wcm92aWRlcic7XG5pbXBvcnQge2ludmFsaWRQcm92aWRlckVycm9yLCBtaXhpbmdNdWx0aVByb3ZpZGVyc1dpdGhSZWd1bGFyUHJvdmlkZXJzRXJyb3IsIG5vQW5ub3RhdGlvbkVycm9yfSBmcm9tICcuL3JlZmxlY3RpdmVfZXJyb3JzJztcbmltcG9ydCB7UmVmbGVjdGl2ZUtleX0gZnJvbSAnLi9yZWZsZWN0aXZlX2tleSc7XG5cblxuaW50ZXJmYWNlIE5vcm1hbGl6ZWRQcm92aWRlciBleHRlbmRzIFR5cGVQcm92aWRlciwgVmFsdWVQcm92aWRlciwgQ2xhc3NQcm92aWRlciwgRXhpc3RpbmdQcm92aWRlcixcbiAgICBGYWN0b3J5UHJvdmlkZXIge31cblxuLyoqXG4gKiBgRGVwZW5kZW5jeWAgaXMgdXNlZCBieSB0aGUgZnJhbWV3b3JrIHRvIGV4dGVuZCBESS5cbiAqIFRoaXMgaXMgaW50ZXJuYWwgdG8gQW5ndWxhciBhbmQgc2hvdWxkIG5vdCBiZSB1c2VkIGRpcmVjdGx5LlxuICovXG5leHBvcnQgY2xhc3MgUmVmbGVjdGl2ZURlcGVuZGVuY3kge1xuICBjb25zdHJ1Y3RvcihcbiAgICAgIHB1YmxpYyBrZXk6IFJlZmxlY3RpdmVLZXksIHB1YmxpYyBvcHRpb25hbDogYm9vbGVhbiwgcHVibGljIHZpc2liaWxpdHk6IFNlbGZ8U2tpcFNlbGZ8bnVsbCkge31cblxuICBzdGF0aWMgZnJvbUtleShrZXk6IFJlZmxlY3RpdmVLZXkpOiBSZWZsZWN0aXZlRGVwZW5kZW5jeSB7XG4gICAgcmV0dXJuIG5ldyBSZWZsZWN0aXZlRGVwZW5kZW5jeShrZXksIGZhbHNlLCBudWxsKTtcbiAgfVxufVxuXG5jb25zdCBfRU1QVFlfTElTVDogYW55W10gPSBbXTtcblxuLyoqXG4gKiBBbiBpbnRlcm5hbCByZXNvbHZlZCByZXByZXNlbnRhdGlvbiBvZiBhIHtAbGluayBQcm92aWRlcn0gdXNlZCBieSB0aGUge0BsaW5rIEluamVjdG9yfS5cbiAqXG4gKiBJdCBpcyB1c3VhbGx5IGNyZWF0ZWQgYXV0b21hdGljYWxseSBieSBgSW5qZWN0b3IucmVzb2x2ZUFuZENyZWF0ZWAuXG4gKlxuICogSXQgY2FuIGJlIGNyZWF0ZWQgbWFudWFsbHksIGFzIGZvbGxvd3M6XG4gKlxuICogIyMjIEV4YW1wbGUgKFtsaXZlIGRlbW9dKGh0dHA6Ly9wbG5rci5jby9lZGl0L1JmRW5oaDhrVUVJMEczcXNuSWVUP3AlM0RwcmV2aWV3JnA9cHJldmlldykpXG4gKlxuICogYGBgdHlwZXNjcmlwdFxuICogdmFyIHJlc29sdmVkUHJvdmlkZXJzID0gSW5qZWN0b3IucmVzb2x2ZShbeyBwcm92aWRlOiAnbWVzc2FnZScsIHVzZVZhbHVlOiAnSGVsbG8nIH1dKTtcbiAqIHZhciBpbmplY3RvciA9IEluamVjdG9yLmZyb21SZXNvbHZlZFByb3ZpZGVycyhyZXNvbHZlZFByb3ZpZGVycyk7XG4gKlxuICogZXhwZWN0KGluamVjdG9yLmdldCgnbWVzc2FnZScpKS50b0VxdWFsKCdIZWxsbycpO1xuICogYGBgXG4gKlxuICogQGV4cGVyaW1lbnRhbFxuICovXG5leHBvcnQgaW50ZXJmYWNlIFJlc29sdmVkUmVmbGVjdGl2ZVByb3ZpZGVyIHtcbiAgLyoqXG4gICAqIEEga2V5LCB1c3VhbGx5IGEgYFR5cGU8YW55PmAuXG4gICAqL1xuICBrZXk6IFJlZmxlY3RpdmVLZXk7XG5cbiAgLyoqXG4gICAqIEZhY3RvcnkgZnVuY3Rpb24gd2hpY2ggY2FuIHJldHVybiBhbiBpbnN0YW5jZSBvZiBhbiBvYmplY3QgcmVwcmVzZW50ZWQgYnkgYSBrZXkuXG4gICAqL1xuICByZXNvbHZlZEZhY3RvcmllczogUmVzb2x2ZWRSZWZsZWN0aXZlRmFjdG9yeVtdO1xuXG4gIC8qKlxuICAgKiBJbmRpY2F0ZXMgaWYgdGhlIHByb3ZpZGVyIGlzIGEgbXVsdGktcHJvdmlkZXIgb3IgYSByZWd1bGFyIHByb3ZpZGVyLlxuICAgKi9cbiAgbXVsdGlQcm92aWRlcjogYm9vbGVhbjtcbn1cblxuZXhwb3J0IGNsYXNzIFJlc29sdmVkUmVmbGVjdGl2ZVByb3ZpZGVyXyBpbXBsZW1lbnRzIFJlc29sdmVkUmVmbGVjdGl2ZVByb3ZpZGVyIHtcbiAgcmVhZG9ubHkgcmVzb2x2ZWRGYWN0b3J5OiBSZXNvbHZlZFJlZmxlY3RpdmVGYWN0b3J5O1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgICAgcHVibGljIGtleTogUmVmbGVjdGl2ZUtleSwgcHVibGljIHJlc29sdmVkRmFjdG9yaWVzOiBSZXNvbHZlZFJlZmxlY3RpdmVGYWN0b3J5W10sXG4gICAgICBwdWJsaWMgbXVsdGlQcm92aWRlcjogYm9vbGVhbikge1xuICAgIHRoaXMucmVzb2x2ZWRGYWN0b3J5ID0gdGhpcy5yZXNvbHZlZEZhY3Rvcmllc1swXTtcbiAgfVxufVxuXG4vKipcbiAqIEFuIGludGVybmFsIHJlc29sdmVkIHJlcHJlc2VudGF0aW9uIG9mIGEgZmFjdG9yeSBmdW5jdGlvbiBjcmVhdGVkIGJ5IHJlc29sdmluZyB7QGxpbmtcbiAqIFByb3ZpZGVyfS5cbiAqIEBleHBlcmltZW50YWxcbiAqL1xuZXhwb3J0IGNsYXNzIFJlc29sdmVkUmVmbGVjdGl2ZUZhY3Rvcnkge1xuICBjb25zdHJ1Y3RvcihcbiAgICAgIC8qKlxuICAgICAgICogRmFjdG9yeSBmdW5jdGlvbiB3aGljaCBjYW4gcmV0dXJuIGFuIGluc3RhbmNlIG9mIGFuIG9iamVjdCByZXByZXNlbnRlZCBieSBhIGtleS5cbiAgICAgICAqL1xuICAgICAgcHVibGljIGZhY3Rvcnk6IEZ1bmN0aW9uLFxuXG4gICAgICAvKipcbiAgICAgICAqIEFyZ3VtZW50cyAoZGVwZW5kZW5jaWVzKSB0byB0aGUgYGZhY3RvcnlgIGZ1bmN0aW9uLlxuICAgICAgICovXG4gICAgICBwdWJsaWMgZGVwZW5kZW5jaWVzOiBSZWZsZWN0aXZlRGVwZW5kZW5jeVtdKSB7fVxufVxuXG5cbi8qKlxuICogUmVzb2x2ZSBhIHNpbmdsZSBwcm92aWRlci5cbiAqL1xuZnVuY3Rpb24gcmVzb2x2ZVJlZmxlY3RpdmVGYWN0b3J5KHByb3ZpZGVyOiBOb3JtYWxpemVkUHJvdmlkZXIpOiBSZXNvbHZlZFJlZmxlY3RpdmVGYWN0b3J5IHtcbiAgbGV0IGZhY3RvcnlGbjogRnVuY3Rpb247XG4gIGxldCByZXNvbHZlZERlcHM6IFJlZmxlY3RpdmVEZXBlbmRlbmN5W107XG4gIGlmIChwcm92aWRlci51c2VDbGFzcykge1xuICAgIGNvbnN0IHVzZUNsYXNzID0gcmVzb2x2ZUZvcndhcmRSZWYocHJvdmlkZXIudXNlQ2xhc3MpO1xuICAgIGZhY3RvcnlGbiA9IHJlZmxlY3Rvci5mYWN0b3J5KHVzZUNsYXNzKTtcbiAgICByZXNvbHZlZERlcHMgPSBfZGVwZW5kZW5jaWVzRm9yKHVzZUNsYXNzKTtcbiAgfSBlbHNlIGlmIChwcm92aWRlci51c2VFeGlzdGluZykge1xuICAgIGZhY3RvcnlGbiA9IChhbGlhc0luc3RhbmNlOiBhbnkpID0+IGFsaWFzSW5zdGFuY2U7XG4gICAgcmVzb2x2ZWREZXBzID0gW1JlZmxlY3RpdmVEZXBlbmRlbmN5LmZyb21LZXkoUmVmbGVjdGl2ZUtleS5nZXQocHJvdmlkZXIudXNlRXhpc3RpbmcpKV07XG4gIH0gZWxzZSBpZiAocHJvdmlkZXIudXNlRmFjdG9yeSkge1xuICAgIGZhY3RvcnlGbiA9IHByb3ZpZGVyLnVzZUZhY3Rvcnk7XG4gICAgcmVzb2x2ZWREZXBzID0gY29uc3RydWN0RGVwZW5kZW5jaWVzKHByb3ZpZGVyLnVzZUZhY3RvcnksIHByb3ZpZGVyLmRlcHMpO1xuICB9IGVsc2Uge1xuICAgIGZhY3RvcnlGbiA9ICgpID0+IHByb3ZpZGVyLnVzZVZhbHVlO1xuICAgIHJlc29sdmVkRGVwcyA9IF9FTVBUWV9MSVNUO1xuICB9XG4gIHJldHVybiBuZXcgUmVzb2x2ZWRSZWZsZWN0aXZlRmFjdG9yeShmYWN0b3J5Rm4sIHJlc29sdmVkRGVwcyk7XG59XG5cbi8qKlxuICogQ29udmVydHMgdGhlIHtAbGluayBQcm92aWRlcn0gaW50byB7QGxpbmsgUmVzb2x2ZWRQcm92aWRlcn0uXG4gKlxuICoge0BsaW5rIEluamVjdG9yfSBpbnRlcm5hbGx5IG9ubHkgdXNlcyB7QGxpbmsgUmVzb2x2ZWRQcm92aWRlcn0sIHtAbGluayBQcm92aWRlcn0gY29udGFpbnNcbiAqIGNvbnZlbmllbmNlIHByb3ZpZGVyIHN5bnRheC5cbiAqL1xuZnVuY3Rpb24gcmVzb2x2ZVJlZmxlY3RpdmVQcm92aWRlcihwcm92aWRlcjogTm9ybWFsaXplZFByb3ZpZGVyKTogUmVzb2x2ZWRSZWZsZWN0aXZlUHJvdmlkZXIge1xuICByZXR1cm4gbmV3IFJlc29sdmVkUmVmbGVjdGl2ZVByb3ZpZGVyXyhcbiAgICAgIFJlZmxlY3RpdmVLZXkuZ2V0KHByb3ZpZGVyLnByb3ZpZGUpLCBbcmVzb2x2ZVJlZmxlY3RpdmVGYWN0b3J5KHByb3ZpZGVyKV0sXG4gICAgICBwcm92aWRlci5tdWx0aSB8fCBmYWxzZSk7XG59XG5cbi8qKlxuICogUmVzb2x2ZSBhIGxpc3Qgb2YgUHJvdmlkZXJzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVzb2x2ZVJlZmxlY3RpdmVQcm92aWRlcnMocHJvdmlkZXJzOiBQcm92aWRlcltdKTogUmVzb2x2ZWRSZWZsZWN0aXZlUHJvdmlkZXJbXSB7XG4gIGNvbnN0IG5vcm1hbGl6ZWQgPSBfbm9ybWFsaXplUHJvdmlkZXJzKHByb3ZpZGVycywgW10pO1xuICBjb25zdCByZXNvbHZlZCA9IG5vcm1hbGl6ZWQubWFwKHJlc29sdmVSZWZsZWN0aXZlUHJvdmlkZXIpO1xuICBjb25zdCByZXNvbHZlZFByb3ZpZGVyTWFwID0gbWVyZ2VSZXNvbHZlZFJlZmxlY3RpdmVQcm92aWRlcnMocmVzb2x2ZWQsIG5ldyBNYXAoKSk7XG4gIHJldHVybiBBcnJheS5mcm9tKHJlc29sdmVkUHJvdmlkZXJNYXAudmFsdWVzKCkpO1xufVxuXG4vKipcbiAqIE1lcmdlcyBhIGxpc3Qgb2YgUmVzb2x2ZWRQcm92aWRlcnMgaW50byBhIGxpc3Qgd2hlcmVcbiAqIGVhY2gga2V5IGlzIGNvbnRhaW5lZCBleGFjdGx5IG9uY2UgYW5kIG11bHRpIHByb3ZpZGVyc1xuICogaGF2ZSBiZWVuIG1lcmdlZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG1lcmdlUmVzb2x2ZWRSZWZsZWN0aXZlUHJvdmlkZXJzKFxuICAgIHByb3ZpZGVyczogUmVzb2x2ZWRSZWZsZWN0aXZlUHJvdmlkZXJbXSxcbiAgICBub3JtYWxpemVkUHJvdmlkZXJzTWFwOiBNYXA8bnVtYmVyLCBSZXNvbHZlZFJlZmxlY3RpdmVQcm92aWRlcj4pOlxuICAgIE1hcDxudW1iZXIsIFJlc29sdmVkUmVmbGVjdGl2ZVByb3ZpZGVyPiB7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgcHJvdmlkZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3QgcHJvdmlkZXIgPSBwcm92aWRlcnNbaV07XG4gICAgY29uc3QgZXhpc3RpbmcgPSBub3JtYWxpemVkUHJvdmlkZXJzTWFwLmdldChwcm92aWRlci5rZXkuaWQpO1xuICAgIGlmIChleGlzdGluZykge1xuICAgICAgaWYgKHByb3ZpZGVyLm11bHRpUHJvdmlkZXIgIT09IGV4aXN0aW5nLm11bHRpUHJvdmlkZXIpIHtcbiAgICAgICAgdGhyb3cgbWl4aW5nTXVsdGlQcm92aWRlcnNXaXRoUmVndWxhclByb3ZpZGVyc0Vycm9yKGV4aXN0aW5nLCBwcm92aWRlcik7XG4gICAgICB9XG4gICAgICBpZiAocHJvdmlkZXIubXVsdGlQcm92aWRlcikge1xuICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IHByb3ZpZGVyLnJlc29sdmVkRmFjdG9yaWVzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgZXhpc3RpbmcucmVzb2x2ZWRGYWN0b3JpZXMucHVzaChwcm92aWRlci5yZXNvbHZlZEZhY3Rvcmllc1tqXSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG5vcm1hbGl6ZWRQcm92aWRlcnNNYXAuc2V0KHByb3ZpZGVyLmtleS5pZCwgcHJvdmlkZXIpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBsZXQgcmVzb2x2ZWRQcm92aWRlcjogUmVzb2x2ZWRSZWZsZWN0aXZlUHJvdmlkZXI7XG4gICAgICBpZiAocHJvdmlkZXIubXVsdGlQcm92aWRlcikge1xuICAgICAgICByZXNvbHZlZFByb3ZpZGVyID0gbmV3IFJlc29sdmVkUmVmbGVjdGl2ZVByb3ZpZGVyXyhcbiAgICAgICAgICAgIHByb3ZpZGVyLmtleSwgcHJvdmlkZXIucmVzb2x2ZWRGYWN0b3JpZXMuc2xpY2UoKSwgcHJvdmlkZXIubXVsdGlQcm92aWRlcik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXNvbHZlZFByb3ZpZGVyID0gcHJvdmlkZXI7XG4gICAgICB9XG4gICAgICBub3JtYWxpemVkUHJvdmlkZXJzTWFwLnNldChwcm92aWRlci5rZXkuaWQsIHJlc29sdmVkUHJvdmlkZXIpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gbm9ybWFsaXplZFByb3ZpZGVyc01hcDtcbn1cblxuZnVuY3Rpb24gX25vcm1hbGl6ZVByb3ZpZGVycyhwcm92aWRlcnM6IFByb3ZpZGVyW10sIHJlczogUHJvdmlkZXJbXSk6IFByb3ZpZGVyW10ge1xuICBwcm92aWRlcnMuZm9yRWFjaChiID0+IHtcbiAgICBpZiAoYiBpbnN0YW5jZW9mIFR5cGUpIHtcbiAgICAgIHJlcy5wdXNoKHtwcm92aWRlOiBiLCB1c2VDbGFzczogYn0pO1xuXG4gICAgfSBlbHNlIGlmIChiICYmIHR5cGVvZiBiID09ICdvYmplY3QnICYmIChiIGFzIGFueSkucHJvdmlkZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXMucHVzaChiIGFzIE5vcm1hbGl6ZWRQcm92aWRlcik7XG5cbiAgICB9IGVsc2UgaWYgKGIgaW5zdGFuY2VvZiBBcnJheSkge1xuICAgICAgX25vcm1hbGl6ZVByb3ZpZGVycyhiLCByZXMpO1xuXG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IGludmFsaWRQcm92aWRlckVycm9yKGIpO1xuICAgIH1cbiAgfSk7XG5cbiAgcmV0dXJuIHJlcztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNvbnN0cnVjdERlcGVuZGVuY2llcyhcbiAgICB0eXBlT3JGdW5jOiBhbnksIGRlcGVuZGVuY2llcz86IGFueVtdKTogUmVmbGVjdGl2ZURlcGVuZGVuY3lbXSB7XG4gIGlmICghZGVwZW5kZW5jaWVzKSB7XG4gICAgcmV0dXJuIF9kZXBlbmRlbmNpZXNGb3IodHlwZU9yRnVuYyk7XG4gIH0gZWxzZSB7XG4gICAgY29uc3QgcGFyYW1zOiBhbnlbXVtdID0gZGVwZW5kZW5jaWVzLm1hcCh0ID0+IFt0XSk7XG4gICAgcmV0dXJuIGRlcGVuZGVuY2llcy5tYXAodCA9PiBfZXh0cmFjdFRva2VuKHR5cGVPckZ1bmMsIHQsIHBhcmFtcykpO1xuICB9XG59XG5cbmZ1bmN0aW9uIF9kZXBlbmRlbmNpZXNGb3IodHlwZU9yRnVuYzogYW55KTogUmVmbGVjdGl2ZURlcGVuZGVuY3lbXSB7XG4gIGNvbnN0IHBhcmFtcyA9IHJlZmxlY3Rvci5wYXJhbWV0ZXJzKHR5cGVPckZ1bmMpO1xuXG4gIGlmICghcGFyYW1zKSByZXR1cm4gW107XG4gIGlmIChwYXJhbXMuc29tZShwID0+IHAgPT0gbnVsbCkpIHtcbiAgICB0aHJvdyBub0Fubm90YXRpb25FcnJvcih0eXBlT3JGdW5jLCBwYXJhbXMpO1xuICB9XG4gIHJldHVybiBwYXJhbXMubWFwKHAgPT4gX2V4dHJhY3RUb2tlbih0eXBlT3JGdW5jLCBwLCBwYXJhbXMpKTtcbn1cblxuZnVuY3Rpb24gX2V4dHJhY3RUb2tlbihcbiAgICB0eXBlT3JGdW5jOiBhbnksIG1ldGFkYXRhOiBhbnlbXSB8IGFueSwgcGFyYW1zOiBhbnlbXVtdKTogUmVmbGVjdGl2ZURlcGVuZGVuY3kge1xuICBsZXQgdG9rZW46IGFueSA9IG51bGw7XG4gIGxldCBvcHRpb25hbCA9IGZhbHNlO1xuXG4gIGlmICghQXJyYXkuaXNBcnJheShtZXRhZGF0YSkpIHtcbiAgICBpZiAobWV0YWRhdGEgaW5zdGFuY2VvZiBJbmplY3QpIHtcbiAgICAgIHJldHVybiBfY3JlYXRlRGVwZW5kZW5jeShtZXRhZGF0YS50b2tlbiwgb3B0aW9uYWwsIG51bGwpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gX2NyZWF0ZURlcGVuZGVuY3kobWV0YWRhdGEsIG9wdGlvbmFsLCBudWxsKTtcbiAgICB9XG4gIH1cblxuICBsZXQgdmlzaWJpbGl0eTogU2VsZnxTa2lwU2VsZnxudWxsID0gbnVsbDtcblxuICBmb3IgKGxldCBpID0gMDsgaSA8IG1ldGFkYXRhLmxlbmd0aDsgKytpKSB7XG4gICAgY29uc3QgcGFyYW1NZXRhZGF0YSA9IG1ldGFkYXRhW2ldO1xuXG4gICAgaWYgKHBhcmFtTWV0YWRhdGEgaW5zdGFuY2VvZiBUeXBlKSB7XG4gICAgICB0b2tlbiA9IHBhcmFtTWV0YWRhdGE7XG5cbiAgICB9IGVsc2UgaWYgKHBhcmFtTWV0YWRhdGEgaW5zdGFuY2VvZiBJbmplY3QpIHtcbiAgICAgIHRva2VuID0gcGFyYW1NZXRhZGF0YS50b2tlbjtcblxuICAgIH0gZWxzZSBpZiAocGFyYW1NZXRhZGF0YSBpbnN0YW5jZW9mIE9wdGlvbmFsKSB7XG4gICAgICBvcHRpb25hbCA9IHRydWU7XG5cbiAgICB9IGVsc2UgaWYgKHBhcmFtTWV0YWRhdGEgaW5zdGFuY2VvZiBTZWxmIHx8IHBhcmFtTWV0YWRhdGEgaW5zdGFuY2VvZiBTa2lwU2VsZikge1xuICAgICAgdmlzaWJpbGl0eSA9IHBhcmFtTWV0YWRhdGE7XG4gICAgfSBlbHNlIGlmIChwYXJhbU1ldGFkYXRhIGluc3RhbmNlb2YgSW5qZWN0aW9uVG9rZW4pIHtcbiAgICAgIHRva2VuID0gcGFyYW1NZXRhZGF0YTtcbiAgICB9XG4gIH1cblxuICB0b2tlbiA9IHJlc29sdmVGb3J3YXJkUmVmKHRva2VuKTtcblxuICBpZiAodG9rZW4gIT0gbnVsbCkge1xuICAgIHJldHVybiBfY3JlYXRlRGVwZW5kZW5jeSh0b2tlbiwgb3B0aW9uYWwsIHZpc2liaWxpdHkpO1xuICB9IGVsc2Uge1xuICAgIHRocm93IG5vQW5ub3RhdGlvbkVycm9yKHR5cGVPckZ1bmMsIHBhcmFtcyk7XG4gIH1cbn1cblxuZnVuY3Rpb24gX2NyZWF0ZURlcGVuZGVuY3koXG4gICAgdG9rZW46IGFueSwgb3B0aW9uYWw6IGJvb2xlYW4sIHZpc2liaWxpdHk6IFNlbGYgfCBTa2lwU2VsZiB8IG51bGwpOiBSZWZsZWN0aXZlRGVwZW5kZW5jeSB7XG4gIHJldHVybiBuZXcgUmVmbGVjdGl2ZURlcGVuZGVuY3koUmVmbGVjdGl2ZUtleS5nZXQodG9rZW4pLCBvcHRpb25hbCwgdmlzaWJpbGl0eSk7XG59XG4iXX0=