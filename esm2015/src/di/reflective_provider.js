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
import { reflector } from '../reflection/reflection';
import { Type } from '../type';
import { resolveForwardRef } from './forward_ref';
import { InjectionToken } from './injection_token';
import { Inject, Optional, Self, SkipSelf } from './metadata';
import { invalidProviderError, mixingMultiProvidersWithRegularProvidersError, noAnnotationError } from './reflective_errors';
import { ReflectiveKey } from './reflective_key';
/**
 * @record
 */
function NormalizedProvider() { }
function NormalizedProvider_tsickle_Closure_declarations() {
}
/**
 * `Dependency` is used by the framework to extend DI.
 * This is internal to Angular and should not be used directly.
 */
export class ReflectiveDependency {
    /**
     * @param {?} key
     * @param {?} optional
     * @param {?} visibility
     */
    constructor(key, optional, visibility) {
        this.key = key;
        this.optional = optional;
        this.visibility = visibility;
    }
    /**
     * @param {?} key
     * @return {?}
     */
    static fromKey(key) {
        return new ReflectiveDependency(key, false, null);
    }
}
function ReflectiveDependency_tsickle_Closure_declarations() {
    /** @type {?} */
    ReflectiveDependency.prototype.key;
    /** @type {?} */
    ReflectiveDependency.prototype.optional;
    /** @type {?} */
    ReflectiveDependency.prototype.visibility;
}
const /** @type {?} */ _EMPTY_LIST = [];
/**
 * An internal resolved representation of a `Provider` used by the `Injector`.
 *
 * \@usageNotes
 * This is usually created automatically by `Injector.resolveAndCreate`.
 *
 * It can be created manually, as follows:
 *
 * ### Example
 *
 * ```typescript
 * var resolvedProviders = Injector.resolve([{ provide: 'message', useValue: 'Hello' }]);
 * var injector = Injector.fromResolvedProviders(resolvedProviders);
 *
 * expect(injector.get('message')).toEqual('Hello');
 * ```
 *
 * \@experimental
 * @record
 */
export function ResolvedReflectiveProvider() { }
function ResolvedReflectiveProvider_tsickle_Closure_declarations() {
    /**
     * A key, usually a `Type<any>`.
     * @type {?}
     */
    ResolvedReflectiveProvider.prototype.key;
    /**
     * Factory function which can return an instance of an object represented by a key.
     * @type {?}
     */
    ResolvedReflectiveProvider.prototype.resolvedFactories;
    /**
     * Indicates if the provider is a multi-provider or a regular provider.
     * @type {?}
     */
    ResolvedReflectiveProvider.prototype.multiProvider;
}
export class ResolvedReflectiveProvider_ {
    /**
     * @param {?} key
     * @param {?} resolvedFactories
     * @param {?} multiProvider
     */
    constructor(key, resolvedFactories, multiProvider) {
        this.key = key;
        this.resolvedFactories = resolvedFactories;
        this.multiProvider = multiProvider;
        this.resolvedFactory = this.resolvedFactories[0];
    }
}
function ResolvedReflectiveProvider__tsickle_Closure_declarations() {
    /** @type {?} */
    ResolvedReflectiveProvider_.prototype.resolvedFactory;
    /** @type {?} */
    ResolvedReflectiveProvider_.prototype.key;
    /** @type {?} */
    ResolvedReflectiveProvider_.prototype.resolvedFactories;
    /** @type {?} */
    ResolvedReflectiveProvider_.prototype.multiProvider;
}
/**
 * An internal resolved representation of a factory function created by resolving `Provider`.
 * \@experimental
 */
export class ResolvedReflectiveFactory {
    /**
     * @param {?} factory
     * @param {?} dependencies
     */
    constructor(factory, dependencies) {
        this.factory = factory;
        this.dependencies = dependencies;
    }
}
function ResolvedReflectiveFactory_tsickle_Closure_declarations() {
    /**
     * Factory function which can return an instance of an object represented by a key.
     * @type {?}
     */
    ResolvedReflectiveFactory.prototype.factory;
    /**
     * Arguments (dependencies) to the `factory` function.
     * @type {?}
     */
    ResolvedReflectiveFactory.prototype.dependencies;
}
/**
 * Resolve a single provider.
 * @param {?} provider
 * @return {?}
 */
function resolveReflectiveFactory(provider) {
    let /** @type {?} */ factoryFn;
    let /** @type {?} */ resolvedDeps;
    if (provider.useClass) {
        const /** @type {?} */ useClass = resolveForwardRef(provider.useClass);
        factoryFn = reflector.factory(useClass);
        resolvedDeps = _dependenciesFor(useClass);
    }
    else if (provider.useExisting) {
        factoryFn = (aliasInstance) => aliasInstance;
        resolvedDeps = [ReflectiveDependency.fromKey(ReflectiveKey.get(provider.useExisting))];
    }
    else if (provider.useFactory) {
        factoryFn = provider.useFactory;
        resolvedDeps = constructDependencies(provider.useFactory, provider.deps);
    }
    else {
        factoryFn = () => provider.useValue;
        resolvedDeps = _EMPTY_LIST;
    }
    return new ResolvedReflectiveFactory(factoryFn, resolvedDeps);
}
/**
 * Converts the `Provider` into `ResolvedProvider`.
 *
 * `Injector` internally only uses `ResolvedProvider`, `Provider` contains convenience provider
 * syntax.
 * @param {?} provider
 * @return {?}
 */
function resolveReflectiveProvider(provider) {
    return new ResolvedReflectiveProvider_(ReflectiveKey.get(provider.provide), [resolveReflectiveFactory(provider)], provider.multi || false);
}
/**
 * Resolve a list of Providers.
 * @param {?} providers
 * @return {?}
 */
export function resolveReflectiveProviders(providers) {
    const /** @type {?} */ normalized = _normalizeProviders(providers, []);
    const /** @type {?} */ resolved = normalized.map(resolveReflectiveProvider);
    const /** @type {?} */ resolvedProviderMap = mergeResolvedReflectiveProviders(resolved, new Map());
    return Array.from(resolvedProviderMap.values());
}
/**
 * Merges a list of ResolvedProviders into a list where each key is contained exactly once and
 * multi providers have been merged.
 * @param {?} providers
 * @param {?} normalizedProvidersMap
 * @return {?}
 */
export function mergeResolvedReflectiveProviders(providers, normalizedProvidersMap) {
    for (let /** @type {?} */ i = 0; i < providers.length; i++) {
        const /** @type {?} */ provider = providers[i];
        const /** @type {?} */ existing = normalizedProvidersMap.get(provider.key.id);
        if (existing) {
            if (provider.multiProvider !== existing.multiProvider) {
                throw mixingMultiProvidersWithRegularProvidersError(existing, provider);
            }
            if (provider.multiProvider) {
                for (let /** @type {?} */ j = 0; j < provider.resolvedFactories.length; j++) {
                    existing.resolvedFactories.push(provider.resolvedFactories[j]);
                }
            }
            else {
                normalizedProvidersMap.set(provider.key.id, provider);
            }
        }
        else {
            let /** @type {?} */ resolvedProvider;
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
/**
 * @param {?} providers
 * @param {?} res
 * @return {?}
 */
function _normalizeProviders(providers, res) {
    providers.forEach(b => {
        if (b instanceof Type) {
            res.push({ provide: b, useClass: b });
        }
        else if (b && typeof b == 'object' && (/** @type {?} */ (b)).provide !== undefined) {
            res.push(/** @type {?} */ (b));
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
/**
 * @param {?} typeOrFunc
 * @param {?=} dependencies
 * @return {?}
 */
export function constructDependencies(typeOrFunc, dependencies) {
    if (!dependencies) {
        return _dependenciesFor(typeOrFunc);
    }
    else {
        const /** @type {?} */ params = dependencies.map(t => [t]);
        return dependencies.map(t => _extractToken(typeOrFunc, t, params));
    }
}
/**
 * @param {?} typeOrFunc
 * @return {?}
 */
function _dependenciesFor(typeOrFunc) {
    const /** @type {?} */ params = reflector.parameters(typeOrFunc);
    if (!params)
        return [];
    if (params.some(p => p == null)) {
        throw noAnnotationError(typeOrFunc, params);
    }
    return params.map(p => _extractToken(typeOrFunc, p, params));
}
/**
 * @param {?} typeOrFunc
 * @param {?} metadata
 * @param {?} params
 * @return {?}
 */
function _extractToken(typeOrFunc, metadata, params) {
    let /** @type {?} */ token = null;
    let /** @type {?} */ optional = false;
    if (!Array.isArray(metadata)) {
        if (metadata instanceof Inject) {
            return _createDependency(metadata.token, optional, null);
        }
        else {
            return _createDependency(metadata, optional, null);
        }
    }
    let /** @type {?} */ visibility = null;
    for (let /** @type {?} */ i = 0; i < metadata.length; ++i) {
        const /** @type {?} */ paramMetadata = metadata[i];
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
/**
 * @param {?} token
 * @param {?} optional
 * @param {?} visibility
 * @return {?}
 */
function _createDependency(token, optional, visibility) {
    return new ReflectiveDependency(ReflectiveKey.get(token), optional, visibility);
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVmbGVjdGl2ZV9wcm92aWRlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL2RpL3JlZmxlY3RpdmVfcHJvdmlkZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFRQSxPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sMEJBQTBCLENBQUM7QUFDbkQsT0FBTyxFQUFDLElBQUksRUFBQyxNQUFNLFNBQVMsQ0FBQztBQUU3QixPQUFPLEVBQUMsaUJBQWlCLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFDaEQsT0FBTyxFQUFDLGNBQWMsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQ2pELE9BQU8sRUFBQyxNQUFNLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUMsTUFBTSxZQUFZLENBQUM7QUFFNUQsT0FBTyxFQUFDLG9CQUFvQixFQUFFLDZDQUE2QyxFQUFFLGlCQUFpQixFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFDM0gsT0FBTyxFQUFDLGFBQWEsRUFBQyxNQUFNLGtCQUFrQixDQUFDOzs7Ozs7Ozs7OztBQVUvQyxNQUFNOzs7Ozs7SUFDSixZQUNXLEtBQTJCLFFBQWlCLEVBQVMsVUFBOEI7UUFBbkYsUUFBRyxHQUFILEdBQUc7UUFBd0IsYUFBUSxHQUFSLFFBQVEsQ0FBUztRQUFTLGVBQVUsR0FBVixVQUFVLENBQW9CO0tBQUk7Ozs7O0lBRWxHLE1BQU0sQ0FBQyxPQUFPLENBQUMsR0FBa0I7UUFDL0IsT0FBTyxJQUFJLG9CQUFvQixDQUFDLEdBQUcsRUFBRSxLQUFLLEVBQUUsSUFBSSxDQUFDLENBQUM7S0FDbkQ7Q0FDRjs7Ozs7Ozs7O0FBRUQsdUJBQU0sV0FBVyxHQUFVLEVBQUUsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBc0M5QixNQUFNOzs7Ozs7SUFHSixZQUNXLEtBQTJCLGlCQUE4QyxFQUN6RTtRQURB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QyxLQUFLLENBQUMsQ0FBQztJQUVqQyxJQUFJLEtBQUssSUFBSSxJQUFJLEVBQUU7UUFDakIsT0FBTyxpQkFBaUIsQ0FBQyxLQUFLLEVBQUUsUUFBUSxFQUFFLFVBQVUsQ0FBQyxDQUFDO0tBQ3ZEO1NBQU07UUFDTCxNQUFNLGlCQUFpQixDQUFDLFVBQVUsRUFBRSxNQUFNLENBQUMsQ0FBQztLQUM3QztDQUNGOzs7Ozs7O0FBRUQsMkJBQ0ksS0FBVSxFQUFFLFFBQWlCLEVBQUUsVUFBa0M7SUFDbkUsT0FBTyxJQUFJLG9CQUFvQixDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLEVBQUUsUUFBUSxFQUFFLFVBQVUsQ0FBQyxDQUFDO0NBQ2pGIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge3JlZmxlY3Rvcn0gZnJvbSAnLi4vcmVmbGVjdGlvbi9yZWZsZWN0aW9uJztcbmltcG9ydCB7VHlwZX0gZnJvbSAnLi4vdHlwZSc7XG5cbmltcG9ydCB7cmVzb2x2ZUZvcndhcmRSZWZ9IGZyb20gJy4vZm9yd2FyZF9yZWYnO1xuaW1wb3J0IHtJbmplY3Rpb25Ub2tlbn0gZnJvbSAnLi9pbmplY3Rpb25fdG9rZW4nO1xuaW1wb3J0IHtJbmplY3QsIE9wdGlvbmFsLCBTZWxmLCBTa2lwU2VsZn0gZnJvbSAnLi9tZXRhZGF0YSc7XG5pbXBvcnQge0NsYXNzUHJvdmlkZXIsIEV4aXN0aW5nUHJvdmlkZXIsIEZhY3RvcnlQcm92aWRlciwgUHJvdmlkZXIsIFR5cGVQcm92aWRlciwgVmFsdWVQcm92aWRlcn0gZnJvbSAnLi9wcm92aWRlcic7XG5pbXBvcnQge2ludmFsaWRQcm92aWRlckVycm9yLCBtaXhpbmdNdWx0aVByb3ZpZGVyc1dpdGhSZWd1bGFyUHJvdmlkZXJzRXJyb3IsIG5vQW5ub3RhdGlvbkVycm9yfSBmcm9tICcuL3JlZmxlY3RpdmVfZXJyb3JzJztcbmltcG9ydCB7UmVmbGVjdGl2ZUtleX0gZnJvbSAnLi9yZWZsZWN0aXZlX2tleSc7XG5cblxuaW50ZXJmYWNlIE5vcm1hbGl6ZWRQcm92aWRlciBleHRlbmRzIFR5cGVQcm92aWRlciwgVmFsdWVQcm92aWRlciwgQ2xhc3NQcm92aWRlciwgRXhpc3RpbmdQcm92aWRlcixcbiAgICBGYWN0b3J5UHJvdmlkZXIge31cblxuLyoqXG4gKiBgRGVwZW5kZW5jeWAgaXMgdXNlZCBieSB0aGUgZnJhbWV3b3JrIHRvIGV4dGVuZCBESS5cbiAqIFRoaXMgaXMgaW50ZXJuYWwgdG8gQW5ndWxhciBhbmQgc2hvdWxkIG5vdCBiZSB1c2VkIGRpcmVjdGx5LlxuICovXG5leHBvcnQgY2xhc3MgUmVmbGVjdGl2ZURlcGVuZGVuY3kge1xuICBjb25zdHJ1Y3RvcihcbiAgICAgIHB1YmxpYyBrZXk6IFJlZmxlY3RpdmVLZXksIHB1YmxpYyBvcHRpb25hbDogYm9vbGVhbiwgcHVibGljIHZpc2liaWxpdHk6IFNlbGZ8U2tpcFNlbGZ8bnVsbCkge31cblxuICBzdGF0aWMgZnJvbUtleShrZXk6IFJlZmxlY3RpdmVLZXkpOiBSZWZsZWN0aXZlRGVwZW5kZW5jeSB7XG4gICAgcmV0dXJuIG5ldyBSZWZsZWN0aXZlRGVwZW5kZW5jeShrZXksIGZhbHNlLCBudWxsKTtcbiAgfVxufVxuXG5jb25zdCBfRU1QVFlfTElTVDogYW55W10gPSBbXTtcblxuLyoqXG4gKiBBbiBpbnRlcm5hbCByZXNvbHZlZCByZXByZXNlbnRhdGlvbiBvZiBhIGBQcm92aWRlcmAgdXNlZCBieSB0aGUgYEluamVjdG9yYC5cbiAqXG4gKiBAdXNhZ2VOb3Rlc1xuICogVGhpcyBpcyB1c3VhbGx5IGNyZWF0ZWQgYXV0b21hdGljYWxseSBieSBgSW5qZWN0b3IucmVzb2x2ZUFuZENyZWF0ZWAuXG4gKlxuICogSXQgY2FuIGJlIGNyZWF0ZWQgbWFudWFsbHksIGFzIGZvbGxvd3M6XG4gKlxuICogIyMjIEV4YW1wbGVcbiAqXG4gKiBgYGB0eXBlc2NyaXB0XG4gKiB2YXIgcmVzb2x2ZWRQcm92aWRlcnMgPSBJbmplY3Rvci5yZXNvbHZlKFt7IHByb3ZpZGU6ICdtZXNzYWdlJywgdXNlVmFsdWU6ICdIZWxsbycgfV0pO1xuICogdmFyIGluamVjdG9yID0gSW5qZWN0b3IuZnJvbVJlc29sdmVkUHJvdmlkZXJzKHJlc29sdmVkUHJvdmlkZXJzKTtcbiAqXG4gKiBleHBlY3QoaW5qZWN0b3IuZ2V0KCdtZXNzYWdlJykpLnRvRXF1YWwoJ0hlbGxvJyk7XG4gKiBgYGBcbiAqXG4gKiBAZXhwZXJpbWVudGFsXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgUmVzb2x2ZWRSZWZsZWN0aXZlUHJvdmlkZXIge1xuICAvKipcbiAgICogQSBrZXksIHVzdWFsbHkgYSBgVHlwZTxhbnk+YC5cbiAgICovXG4gIGtleTogUmVmbGVjdGl2ZUtleTtcblxuICAvKipcbiAgICogRmFjdG9yeSBmdW5jdGlvbiB3aGljaCBjYW4gcmV0dXJuIGFuIGluc3RhbmNlIG9mIGFuIG9iamVjdCByZXByZXNlbnRlZCBieSBhIGtleS5cbiAgICovXG4gIHJlc29sdmVkRmFjdG9yaWVzOiBSZXNvbHZlZFJlZmxlY3RpdmVGYWN0b3J5W107XG5cbiAgLyoqXG4gICAqIEluZGljYXRlcyBpZiB0aGUgcHJvdmlkZXIgaXMgYSBtdWx0aS1wcm92aWRlciBvciBhIHJlZ3VsYXIgcHJvdmlkZXIuXG4gICAqL1xuICBtdWx0aVByb3ZpZGVyOiBib29sZWFuO1xufVxuXG5leHBvcnQgY2xhc3MgUmVzb2x2ZWRSZWZsZWN0aXZlUHJvdmlkZXJfIGltcGxlbWVudHMgUmVzb2x2ZWRSZWZsZWN0aXZlUHJvdmlkZXIge1xuICByZWFkb25seSByZXNvbHZlZEZhY3Rvcnk6IFJlc29sdmVkUmVmbGVjdGl2ZUZhY3Rvcnk7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgICBwdWJsaWMga2V5OiBSZWZsZWN0aXZlS2V5LCBwdWJsaWMgcmVzb2x2ZWRGYWN0b3JpZXM6IFJlc29sdmVkUmVmbGVjdGl2ZUZhY3RvcnlbXSxcbiAgICAgIHB1YmxpYyBtdWx0aVByb3ZpZGVyOiBib29sZWFuKSB7XG4gICAgdGhpcy5yZXNvbHZlZEZhY3RvcnkgPSB0aGlzLnJlc29sdmVkRmFjdG9yaWVzWzBdO1xuICB9XG59XG5cbi8qKlxuICogQW4gaW50ZXJuYWwgcmVzb2x2ZWQgcmVwcmVzZW50YXRpb24gb2YgYSBmYWN0b3J5IGZ1bmN0aW9uIGNyZWF0ZWQgYnkgcmVzb2x2aW5nIGBQcm92aWRlcmAuXG4gKiBAZXhwZXJpbWVudGFsXG4gKi9cbmV4cG9ydCBjbGFzcyBSZXNvbHZlZFJlZmxlY3RpdmVGYWN0b3J5IHtcbiAgY29uc3RydWN0b3IoXG4gICAgICAvKipcbiAgICAgICAqIEZhY3RvcnkgZnVuY3Rpb24gd2hpY2ggY2FuIHJldHVybiBhbiBpbnN0YW5jZSBvZiBhbiBvYmplY3QgcmVwcmVzZW50ZWQgYnkgYSBrZXkuXG4gICAgICAgKi9cbiAgICAgIHB1YmxpYyBmYWN0b3J5OiBGdW5jdGlvbixcblxuICAgICAgLyoqXG4gICAgICAgKiBBcmd1bWVudHMgKGRlcGVuZGVuY2llcykgdG8gdGhlIGBmYWN0b3J5YCBmdW5jdGlvbi5cbiAgICAgICAqL1xuICAgICAgcHVibGljIGRlcGVuZGVuY2llczogUmVmbGVjdGl2ZURlcGVuZGVuY3lbXSkge31cbn1cblxuXG4vKipcbiAqIFJlc29sdmUgYSBzaW5nbGUgcHJvdmlkZXIuXG4gKi9cbmZ1bmN0aW9uIHJlc29sdmVSZWZsZWN0aXZlRmFjdG9yeShwcm92aWRlcjogTm9ybWFsaXplZFByb3ZpZGVyKTogUmVzb2x2ZWRSZWZsZWN0aXZlRmFjdG9yeSB7XG4gIGxldCBmYWN0b3J5Rm46IEZ1bmN0aW9uO1xuICBsZXQgcmVzb2x2ZWREZXBzOiBSZWZsZWN0aXZlRGVwZW5kZW5jeVtdO1xuICBpZiAocHJvdmlkZXIudXNlQ2xhc3MpIHtcbiAgICBjb25zdCB1c2VDbGFzcyA9IHJlc29sdmVGb3J3YXJkUmVmKHByb3ZpZGVyLnVzZUNsYXNzKTtcbiAgICBmYWN0b3J5Rm4gPSByZWZsZWN0b3IuZmFjdG9yeSh1c2VDbGFzcyk7XG4gICAgcmVzb2x2ZWREZXBzID0gX2RlcGVuZGVuY2llc0Zvcih1c2VDbGFzcyk7XG4gIH0gZWxzZSBpZiAocHJvdmlkZXIudXNlRXhpc3RpbmcpIHtcbiAgICBmYWN0b3J5Rm4gPSAoYWxpYXNJbnN0YW5jZTogYW55KSA9PiBhbGlhc0luc3RhbmNlO1xuICAgIHJlc29sdmVkRGVwcyA9IFtSZWZsZWN0aXZlRGVwZW5kZW5jeS5mcm9tS2V5KFJlZmxlY3RpdmVLZXkuZ2V0KHByb3ZpZGVyLnVzZUV4aXN0aW5nKSldO1xuICB9IGVsc2UgaWYgKHByb3ZpZGVyLnVzZUZhY3RvcnkpIHtcbiAgICBmYWN0b3J5Rm4gPSBwcm92aWRlci51c2VGYWN0b3J5O1xuICAgIHJlc29sdmVkRGVwcyA9IGNvbnN0cnVjdERlcGVuZGVuY2llcyhwcm92aWRlci51c2VGYWN0b3J5LCBwcm92aWRlci5kZXBzKTtcbiAgfSBlbHNlIHtcbiAgICBmYWN0b3J5Rm4gPSAoKSA9PiBwcm92aWRlci51c2VWYWx1ZTtcbiAgICByZXNvbHZlZERlcHMgPSBfRU1QVFlfTElTVDtcbiAgfVxuICByZXR1cm4gbmV3IFJlc29sdmVkUmVmbGVjdGl2ZUZhY3RvcnkoZmFjdG9yeUZuLCByZXNvbHZlZERlcHMpO1xufVxuXG4vKipcbiAqIENvbnZlcnRzIHRoZSBgUHJvdmlkZXJgIGludG8gYFJlc29sdmVkUHJvdmlkZXJgLlxuICpcbiAqIGBJbmplY3RvcmAgaW50ZXJuYWxseSBvbmx5IHVzZXMgYFJlc29sdmVkUHJvdmlkZXJgLCBgUHJvdmlkZXJgIGNvbnRhaW5zIGNvbnZlbmllbmNlIHByb3ZpZGVyXG4gKiBzeW50YXguXG4gKi9cbmZ1bmN0aW9uIHJlc29sdmVSZWZsZWN0aXZlUHJvdmlkZXIocHJvdmlkZXI6IE5vcm1hbGl6ZWRQcm92aWRlcik6IFJlc29sdmVkUmVmbGVjdGl2ZVByb3ZpZGVyIHtcbiAgcmV0dXJuIG5ldyBSZXNvbHZlZFJlZmxlY3RpdmVQcm92aWRlcl8oXG4gICAgICBSZWZsZWN0aXZlS2V5LmdldChwcm92aWRlci5wcm92aWRlKSwgW3Jlc29sdmVSZWZsZWN0aXZlRmFjdG9yeShwcm92aWRlcildLFxuICAgICAgcHJvdmlkZXIubXVsdGkgfHwgZmFsc2UpO1xufVxuXG4vKipcbiAqIFJlc29sdmUgYSBsaXN0IG9mIFByb3ZpZGVycy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlc29sdmVSZWZsZWN0aXZlUHJvdmlkZXJzKHByb3ZpZGVyczogUHJvdmlkZXJbXSk6IFJlc29sdmVkUmVmbGVjdGl2ZVByb3ZpZGVyW10ge1xuICBjb25zdCBub3JtYWxpemVkID0gX25vcm1hbGl6ZVByb3ZpZGVycyhwcm92aWRlcnMsIFtdKTtcbiAgY29uc3QgcmVzb2x2ZWQgPSBub3JtYWxpemVkLm1hcChyZXNvbHZlUmVmbGVjdGl2ZVByb3ZpZGVyKTtcbiAgY29uc3QgcmVzb2x2ZWRQcm92aWRlck1hcCA9IG1lcmdlUmVzb2x2ZWRSZWZsZWN0aXZlUHJvdmlkZXJzKHJlc29sdmVkLCBuZXcgTWFwKCkpO1xuICByZXR1cm4gQXJyYXkuZnJvbShyZXNvbHZlZFByb3ZpZGVyTWFwLnZhbHVlcygpKTtcbn1cblxuLyoqXG4gKiBNZXJnZXMgYSBsaXN0IG9mIFJlc29sdmVkUHJvdmlkZXJzIGludG8gYSBsaXN0IHdoZXJlIGVhY2gga2V5IGlzIGNvbnRhaW5lZCBleGFjdGx5IG9uY2UgYW5kXG4gKiBtdWx0aSBwcm92aWRlcnMgaGF2ZSBiZWVuIG1lcmdlZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG1lcmdlUmVzb2x2ZWRSZWZsZWN0aXZlUHJvdmlkZXJzKFxuICAgIHByb3ZpZGVyczogUmVzb2x2ZWRSZWZsZWN0aXZlUHJvdmlkZXJbXSxcbiAgICBub3JtYWxpemVkUHJvdmlkZXJzTWFwOiBNYXA8bnVtYmVyLCBSZXNvbHZlZFJlZmxlY3RpdmVQcm92aWRlcj4pOlxuICAgIE1hcDxudW1iZXIsIFJlc29sdmVkUmVmbGVjdGl2ZVByb3ZpZGVyPiB7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgcHJvdmlkZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3QgcHJvdmlkZXIgPSBwcm92aWRlcnNbaV07XG4gICAgY29uc3QgZXhpc3RpbmcgPSBub3JtYWxpemVkUHJvdmlkZXJzTWFwLmdldChwcm92aWRlci5rZXkuaWQpO1xuICAgIGlmIChleGlzdGluZykge1xuICAgICAgaWYgKHByb3ZpZGVyLm11bHRpUHJvdmlkZXIgIT09IGV4aXN0aW5nLm11bHRpUHJvdmlkZXIpIHtcbiAgICAgICAgdGhyb3cgbWl4aW5nTXVsdGlQcm92aWRlcnNXaXRoUmVndWxhclByb3ZpZGVyc0Vycm9yKGV4aXN0aW5nLCBwcm92aWRlcik7XG4gICAgICB9XG4gICAgICBpZiAocHJvdmlkZXIubXVsdGlQcm92aWRlcikge1xuICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IHByb3ZpZGVyLnJlc29sdmVkRmFjdG9yaWVzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgZXhpc3RpbmcucmVzb2x2ZWRGYWN0b3JpZXMucHVzaChwcm92aWRlci5yZXNvbHZlZEZhY3Rvcmllc1tqXSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG5vcm1hbGl6ZWRQcm92aWRlcnNNYXAuc2V0KHByb3ZpZGVyLmtleS5pZCwgcHJvdmlkZXIpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBsZXQgcmVzb2x2ZWRQcm92aWRlcjogUmVzb2x2ZWRSZWZsZWN0aXZlUHJvdmlkZXI7XG4gICAgICBpZiAocHJvdmlkZXIubXVsdGlQcm92aWRlcikge1xuICAgICAgICByZXNvbHZlZFByb3ZpZGVyID0gbmV3IFJlc29sdmVkUmVmbGVjdGl2ZVByb3ZpZGVyXyhcbiAgICAgICAgICAgIHByb3ZpZGVyLmtleSwgcHJvdmlkZXIucmVzb2x2ZWRGYWN0b3JpZXMuc2xpY2UoKSwgcHJvdmlkZXIubXVsdGlQcm92aWRlcik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXNvbHZlZFByb3ZpZGVyID0gcHJvdmlkZXI7XG4gICAgICB9XG4gICAgICBub3JtYWxpemVkUHJvdmlkZXJzTWFwLnNldChwcm92aWRlci5rZXkuaWQsIHJlc29sdmVkUHJvdmlkZXIpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gbm9ybWFsaXplZFByb3ZpZGVyc01hcDtcbn1cblxuZnVuY3Rpb24gX25vcm1hbGl6ZVByb3ZpZGVycyhwcm92aWRlcnM6IFByb3ZpZGVyW10sIHJlczogUHJvdmlkZXJbXSk6IFByb3ZpZGVyW10ge1xuICBwcm92aWRlcnMuZm9yRWFjaChiID0+IHtcbiAgICBpZiAoYiBpbnN0YW5jZW9mIFR5cGUpIHtcbiAgICAgIHJlcy5wdXNoKHtwcm92aWRlOiBiLCB1c2VDbGFzczogYn0pO1xuXG4gICAgfSBlbHNlIGlmIChiICYmIHR5cGVvZiBiID09ICdvYmplY3QnICYmIChiIGFzIGFueSkucHJvdmlkZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXMucHVzaChiIGFzIE5vcm1hbGl6ZWRQcm92aWRlcik7XG5cbiAgICB9IGVsc2UgaWYgKGIgaW5zdGFuY2VvZiBBcnJheSkge1xuICAgICAgX25vcm1hbGl6ZVByb3ZpZGVycyhiLCByZXMpO1xuXG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IGludmFsaWRQcm92aWRlckVycm9yKGIpO1xuICAgIH1cbiAgfSk7XG5cbiAgcmV0dXJuIHJlcztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNvbnN0cnVjdERlcGVuZGVuY2llcyhcbiAgICB0eXBlT3JGdW5jOiBhbnksIGRlcGVuZGVuY2llcz86IGFueVtdKTogUmVmbGVjdGl2ZURlcGVuZGVuY3lbXSB7XG4gIGlmICghZGVwZW5kZW5jaWVzKSB7XG4gICAgcmV0dXJuIF9kZXBlbmRlbmNpZXNGb3IodHlwZU9yRnVuYyk7XG4gIH0gZWxzZSB7XG4gICAgY29uc3QgcGFyYW1zOiBhbnlbXVtdID0gZGVwZW5kZW5jaWVzLm1hcCh0ID0+IFt0XSk7XG4gICAgcmV0dXJuIGRlcGVuZGVuY2llcy5tYXAodCA9PiBfZXh0cmFjdFRva2VuKHR5cGVPckZ1bmMsIHQsIHBhcmFtcykpO1xuICB9XG59XG5cbmZ1bmN0aW9uIF9kZXBlbmRlbmNpZXNGb3IodHlwZU9yRnVuYzogYW55KTogUmVmbGVjdGl2ZURlcGVuZGVuY3lbXSB7XG4gIGNvbnN0IHBhcmFtcyA9IHJlZmxlY3Rvci5wYXJhbWV0ZXJzKHR5cGVPckZ1bmMpO1xuXG4gIGlmICghcGFyYW1zKSByZXR1cm4gW107XG4gIGlmIChwYXJhbXMuc29tZShwID0+IHAgPT0gbnVsbCkpIHtcbiAgICB0aHJvdyBub0Fubm90YXRpb25FcnJvcih0eXBlT3JGdW5jLCBwYXJhbXMpO1xuICB9XG4gIHJldHVybiBwYXJhbXMubWFwKHAgPT4gX2V4dHJhY3RUb2tlbih0eXBlT3JGdW5jLCBwLCBwYXJhbXMpKTtcbn1cblxuZnVuY3Rpb24gX2V4dHJhY3RUb2tlbihcbiAgICB0eXBlT3JGdW5jOiBhbnksIG1ldGFkYXRhOiBhbnlbXSB8IGFueSwgcGFyYW1zOiBhbnlbXVtdKTogUmVmbGVjdGl2ZURlcGVuZGVuY3kge1xuICBsZXQgdG9rZW46IGFueSA9IG51bGw7XG4gIGxldCBvcHRpb25hbCA9IGZhbHNlO1xuXG4gIGlmICghQXJyYXkuaXNBcnJheShtZXRhZGF0YSkpIHtcbiAgICBpZiAobWV0YWRhdGEgaW5zdGFuY2VvZiBJbmplY3QpIHtcbiAgICAgIHJldHVybiBfY3JlYXRlRGVwZW5kZW5jeShtZXRhZGF0YS50b2tlbiwgb3B0aW9uYWwsIG51bGwpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gX2NyZWF0ZURlcGVuZGVuY3kobWV0YWRhdGEsIG9wdGlvbmFsLCBudWxsKTtcbiAgICB9XG4gIH1cblxuICBsZXQgdmlzaWJpbGl0eTogU2VsZnxTa2lwU2VsZnxudWxsID0gbnVsbDtcblxuICBmb3IgKGxldCBpID0gMDsgaSA8IG1ldGFkYXRhLmxlbmd0aDsgKytpKSB7XG4gICAgY29uc3QgcGFyYW1NZXRhZGF0YSA9IG1ldGFkYXRhW2ldO1xuXG4gICAgaWYgKHBhcmFtTWV0YWRhdGEgaW5zdGFuY2VvZiBUeXBlKSB7XG4gICAgICB0b2tlbiA9IHBhcmFtTWV0YWRhdGE7XG5cbiAgICB9IGVsc2UgaWYgKHBhcmFtTWV0YWRhdGEgaW5zdGFuY2VvZiBJbmplY3QpIHtcbiAgICAgIHRva2VuID0gcGFyYW1NZXRhZGF0YS50b2tlbjtcblxuICAgIH0gZWxzZSBpZiAocGFyYW1NZXRhZGF0YSBpbnN0YW5jZW9mIE9wdGlvbmFsKSB7XG4gICAgICBvcHRpb25hbCA9IHRydWU7XG5cbiAgICB9IGVsc2UgaWYgKHBhcmFtTWV0YWRhdGEgaW5zdGFuY2VvZiBTZWxmIHx8IHBhcmFtTWV0YWRhdGEgaW5zdGFuY2VvZiBTa2lwU2VsZikge1xuICAgICAgdmlzaWJpbGl0eSA9IHBhcmFtTWV0YWRhdGE7XG4gICAgfSBlbHNlIGlmIChwYXJhbU1ldGFkYXRhIGluc3RhbmNlb2YgSW5qZWN0aW9uVG9rZW4pIHtcbiAgICAgIHRva2VuID0gcGFyYW1NZXRhZGF0YTtcbiAgICB9XG4gIH1cblxuICB0b2tlbiA9IHJlc29sdmVGb3J3YXJkUmVmKHRva2VuKTtcblxuICBpZiAodG9rZW4gIT0gbnVsbCkge1xuICAgIHJldHVybiBfY3JlYXRlRGVwZW5kZW5jeSh0b2tlbiwgb3B0aW9uYWwsIHZpc2liaWxpdHkpO1xuICB9IGVsc2Uge1xuICAgIHRocm93IG5vQW5ub3RhdGlvbkVycm9yKHR5cGVPckZ1bmMsIHBhcmFtcyk7XG4gIH1cbn1cblxuZnVuY3Rpb24gX2NyZWF0ZURlcGVuZGVuY3koXG4gICAgdG9rZW46IGFueSwgb3B0aW9uYWw6IGJvb2xlYW4sIHZpc2liaWxpdHk6IFNlbGYgfCBTa2lwU2VsZiB8IG51bGwpOiBSZWZsZWN0aXZlRGVwZW5kZW5jeSB7XG4gIHJldHVybiBuZXcgUmVmbGVjdGl2ZURlcGVuZGVuY3koUmVmbGVjdGl2ZUtleS5nZXQodG9rZW4pLCBvcHRpb25hbCwgdmlzaWJpbGl0eSk7XG59XG4iXX0=