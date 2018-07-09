/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as tslib_1 from "tslib";
import { Injector, THROW_IF_NOT_FOUND } from './injector';
import { Self, SkipSelf } from './metadata';
import { cyclicDependencyError, instantiationError, noProviderError, outOfBoundsError } from './reflective_errors';
import { ReflectiveKey } from './reflective_key';
import { resolveReflectiveProviders } from './reflective_provider';
// Threshold for the dynamic version
var UNDEFINED = new Object();
/**
 * A ReflectiveDependency injection container used for instantiating objects and resolving
 * dependencies.
 *
 * An `Injector` is a replacement for a `new` operator, which can automatically resolve the
 * constructor dependencies.
 *
 * In typical use, application code asks for the dependencies in the constructor and they are
 * resolved by the `Injector`.
 *
 * ### Example ([live demo](http://plnkr.co/edit/jzjec0?p=preview))
 *
 * The following example creates an `Injector` configured to create `Engine` and `Car`.
 *
 * ```typescript
 * @Injectable()
 * class Engine {
 * }
 *
 * @Injectable()
 * class Car {
 *   constructor(public engine:Engine) {}
 * }
 *
 * var injector = ReflectiveInjector.resolveAndCreate([Car, Engine]);
 * var car = injector.get(Car);
 * expect(car instanceof Car).toBe(true);
 * expect(car.engine instanceof Engine).toBe(true);
 * ```
 *
 * Notice, we don't use the `new` operator because we explicitly want to have the `Injector`
 * resolve all of the object's dependencies automatically.
 *
 * @deprecated from v5 - slow and brings in a lot of code, Use `Injector.create` instead.
 */
var ReflectiveInjector = /** @class */ (function () {
    function ReflectiveInjector() {
    }
    /**
     * Turns an array of provider definitions into an array of resolved providers.
     *
     * A resolution is a process of flattening multiple nested arrays and converting individual
     * providers into an array of {@link ResolvedReflectiveProvider}s.
     *
     * ### Example ([live demo](http://plnkr.co/edit/AiXTHi?p=preview))
     *
     * ```typescript
     * @Injectable()
     * class Engine {
     * }
     *
     * @Injectable()
     * class Car {
     *   constructor(public engine:Engine) {}
     * }
     *
     * var providers = ReflectiveInjector.resolve([Car, [[Engine]]]);
     *
     * expect(providers.length).toEqual(2);
     *
     * expect(providers[0] instanceof ResolvedReflectiveProvider).toBe(true);
     * expect(providers[0].key.displayName).toBe("Car");
     * expect(providers[0].dependencies.length).toEqual(1);
     * expect(providers[0].factory).toBeDefined();
     *
     * expect(providers[1].key.displayName).toBe("Engine");
     * });
     * ```
     *
     * See {@link ReflectiveInjector#fromResolvedProviders fromResolvedProviders} for more info.
     */
    ReflectiveInjector.resolve = function (providers) {
        return resolveReflectiveProviders(providers);
    };
    /**
     * Resolves an array of providers and creates an injector from those providers.
     *
     * The passed-in providers can be an array of `Type`, {@link Provider},
     * or a recursive array of more providers.
     *
     * ### Example ([live demo](http://plnkr.co/edit/ePOccA?p=preview))
     *
     * ```typescript
     * @Injectable()
     * class Engine {
     * }
     *
     * @Injectable()
     * class Car {
     *   constructor(public engine:Engine) {}
     * }
     *
     * var injector = ReflectiveInjector.resolveAndCreate([Car, Engine]);
     * expect(injector.get(Car) instanceof Car).toBe(true);
     * ```
     *
     * This function is slower than the corresponding `fromResolvedProviders`
     * because it needs to resolve the passed-in providers first.
     * See {@link ReflectiveInjector#resolve resolve} and
     * {@link ReflectiveInjector#fromResolvedProviders fromResolvedProviders}.
     */
    ReflectiveInjector.resolveAndCreate = function (providers, parent) {
        var ResolvedReflectiveProviders = ReflectiveInjector.resolve(providers);
        return ReflectiveInjector.fromResolvedProviders(ResolvedReflectiveProviders, parent);
    };
    /**
     * Creates an injector from previously resolved providers.
     *
     * This API is the recommended way to construct injectors in performance-sensitive parts.
     *
     * ### Example ([live demo](http://plnkr.co/edit/KrSMci?p=preview))
     *
     * ```typescript
     * @Injectable()
     * class Engine {
     * }
     *
     * @Injectable()
     * class Car {
     *   constructor(public engine:Engine) {}
     * }
     *
     * var providers = ReflectiveInjector.resolve([Car, Engine]);
     * var injector = ReflectiveInjector.fromResolvedProviders(providers);
     * expect(injector.get(Car) instanceof Car).toBe(true);
     * ```
     * @experimental
     */
    ReflectiveInjector.fromResolvedProviders = function (providers, parent) {
        return new ReflectiveInjector_(providers, parent);
    };
    return ReflectiveInjector;
}());
export { ReflectiveInjector };
var ReflectiveInjector_ = /** @class */ (function () {
    /**
     * Private
     */
    function ReflectiveInjector_(_providers, _parent) {
        /** @internal */
        this._constructionCounter = 0;
        this._providers = _providers;
        this.parent = _parent || null;
        var len = _providers.length;
        this.keyIds = new Array(len);
        this.objs = new Array(len);
        for (var i = 0; i < len; i++) {
            this.keyIds[i] = _providers[i].key.id;
            this.objs[i] = UNDEFINED;
        }
    }
    ReflectiveInjector_.prototype.get = function (token, notFoundValue) {
        if (notFoundValue === void 0) { notFoundValue = THROW_IF_NOT_FOUND; }
        return this._getByKey(ReflectiveKey.get(token), null, notFoundValue);
    };
    ReflectiveInjector_.prototype.resolveAndCreateChild = function (providers) {
        var ResolvedReflectiveProviders = ReflectiveInjector.resolve(providers);
        return this.createChildFromResolved(ResolvedReflectiveProviders);
    };
    ReflectiveInjector_.prototype.createChildFromResolved = function (providers) {
        var inj = new ReflectiveInjector_(providers);
        inj.parent = this;
        return inj;
    };
    ReflectiveInjector_.prototype.resolveAndInstantiate = function (provider) {
        return this.instantiateResolved(ReflectiveInjector.resolve([provider])[0]);
    };
    ReflectiveInjector_.prototype.instantiateResolved = function (provider) {
        return this._instantiateProvider(provider);
    };
    ReflectiveInjector_.prototype.getProviderAtIndex = function (index) {
        if (index < 0 || index >= this._providers.length) {
            throw outOfBoundsError(index);
        }
        return this._providers[index];
    };
    /** @internal */
    ReflectiveInjector_.prototype._new = function (provider) {
        if (this._constructionCounter++ > this._getMaxNumberOfObjects()) {
            throw cyclicDependencyError(this, provider.key);
        }
        return this._instantiateProvider(provider);
    };
    ReflectiveInjector_.prototype._getMaxNumberOfObjects = function () { return this.objs.length; };
    ReflectiveInjector_.prototype._instantiateProvider = function (provider) {
        if (provider.multiProvider) {
            var res = new Array(provider.resolvedFactories.length);
            for (var i = 0; i < provider.resolvedFactories.length; ++i) {
                res[i] = this._instantiate(provider, provider.resolvedFactories[i]);
            }
            return res;
        }
        else {
            return this._instantiate(provider, provider.resolvedFactories[0]);
        }
    };
    ReflectiveInjector_.prototype._instantiate = function (provider, ResolvedReflectiveFactory) {
        var _this = this;
        var factory = ResolvedReflectiveFactory.factory;
        var deps;
        try {
            deps =
                ResolvedReflectiveFactory.dependencies.map(function (dep) { return _this._getByReflectiveDependency(dep); });
        }
        catch (e) {
            if (e.addKey) {
                e.addKey(this, provider.key);
            }
            throw e;
        }
        var obj;
        try {
            obj = factory.apply(void 0, tslib_1.__spread(deps));
        }
        catch (e) {
            throw instantiationError(this, e, e.stack, provider.key);
        }
        return obj;
    };
    ReflectiveInjector_.prototype._getByReflectiveDependency = function (dep) {
        return this._getByKey(dep.key, dep.visibility, dep.optional ? null : THROW_IF_NOT_FOUND);
    };
    ReflectiveInjector_.prototype._getByKey = function (key, visibility, notFoundValue) {
        if (key === ReflectiveInjector_.INJECTOR_KEY) {
            return this;
        }
        if (visibility instanceof Self) {
            return this._getByKeySelf(key, notFoundValue);
        }
        else {
            return this._getByKeyDefault(key, notFoundValue, visibility);
        }
    };
    ReflectiveInjector_.prototype._getObjByKeyId = function (keyId) {
        for (var i = 0; i < this.keyIds.length; i++) {
            if (this.keyIds[i] === keyId) {
                if (this.objs[i] === UNDEFINED) {
                    this.objs[i] = this._new(this._providers[i]);
                }
                return this.objs[i];
            }
        }
        return UNDEFINED;
    };
    /** @internal */
    ReflectiveInjector_.prototype._throwOrNull = function (key, notFoundValue) {
        if (notFoundValue !== THROW_IF_NOT_FOUND) {
            return notFoundValue;
        }
        else {
            throw noProviderError(this, key);
        }
    };
    /** @internal */
    ReflectiveInjector_.prototype._getByKeySelf = function (key, notFoundValue) {
        var obj = this._getObjByKeyId(key.id);
        return (obj !== UNDEFINED) ? obj : this._throwOrNull(key, notFoundValue);
    };
    /** @internal */
    ReflectiveInjector_.prototype._getByKeyDefault = function (key, notFoundValue, visibility) {
        var inj;
        if (visibility instanceof SkipSelf) {
            inj = this.parent;
        }
        else {
            inj = this;
        }
        while (inj instanceof ReflectiveInjector_) {
            var inj_ = inj;
            var obj = inj_._getObjByKeyId(key.id);
            if (obj !== UNDEFINED)
                return obj;
            inj = inj_.parent;
        }
        if (inj !== null) {
            return inj.get(key.token, notFoundValue);
        }
        else {
            return this._throwOrNull(key, notFoundValue);
        }
    };
    Object.defineProperty(ReflectiveInjector_.prototype, "displayName", {
        get: function () {
            var providers = _mapProviders(this, function (b) { return ' "' + b.key.displayName + '" '; })
                .join(', ');
            return "ReflectiveInjector(providers: [" + providers + "])";
        },
        enumerable: true,
        configurable: true
    });
    ReflectiveInjector_.prototype.toString = function () { return this.displayName; };
    ReflectiveInjector_.INJECTOR_KEY = ReflectiveKey.get(Injector);
    return ReflectiveInjector_;
}());
export { ReflectiveInjector_ };
function _mapProviders(injector, fn) {
    var res = new Array(injector._providers.length);
    for (var i = 0; i < injector._providers.length; ++i) {
        res[i] = fn(injector.getProviderAtIndex(i));
    }
    return res;
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVmbGVjdGl2ZV9pbmplY3Rvci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL2RpL3JlZmxlY3RpdmVfaW5qZWN0b3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOztBQUVILE9BQU8sRUFBQyxRQUFRLEVBQUUsa0JBQWtCLEVBQUMsTUFBTSxZQUFZLENBQUM7QUFDeEQsT0FBTyxFQUFDLElBQUksRUFBRSxRQUFRLEVBQUMsTUFBTSxZQUFZLENBQUM7QUFFMUMsT0FBTyxFQUFDLHFCQUFxQixFQUFFLGtCQUFrQixFQUFFLGVBQWUsRUFBRSxnQkFBZ0IsRUFBQyxNQUFNLHFCQUFxQixDQUFDO0FBQ2pILE9BQU8sRUFBQyxhQUFhLEVBQUMsTUFBTSxrQkFBa0IsQ0FBQztBQUMvQyxPQUFPLEVBQThFLDBCQUEwQixFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFFOUksb0NBQW9DO0FBQ3BDLElBQU0sU0FBUyxHQUFHLElBQUksTUFBTSxFQUFFLENBQUM7QUFFL0I7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7R0FrQ0c7QUFDSDtJQUFBO0lBaU9BLENBQUM7SUFoT0M7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O09BZ0NHO0lBQ0ksMEJBQU8sR0FBZCxVQUFlLFNBQXFCO1FBQ2xDLE1BQU0sQ0FBQywwQkFBMEIsQ0FBQyxTQUFTLENBQUMsQ0FBQztJQUMvQyxDQUFDO0lBRUQ7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O09BMEJHO0lBQ0ksbUNBQWdCLEdBQXZCLFVBQXdCLFNBQXFCLEVBQUUsTUFBaUI7UUFDOUQsSUFBTSwyQkFBMkIsR0FBRyxrQkFBa0IsQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDMUUsTUFBTSxDQUFDLGtCQUFrQixDQUFDLHFCQUFxQixDQUFDLDJCQUEyQixFQUFFLE1BQU0sQ0FB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QUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7SW5qZWN0b3IsIFRIUk9XX0lGX05PVF9GT1VORH0gZnJvbSAnLi9pbmplY3Rvcic7XG5pbXBvcnQge1NlbGYsIFNraXBTZWxmfSBmcm9tICcuL21ldGFkYXRhJztcbmltcG9ydCB7UHJvdmlkZXJ9IGZyb20gJy4vcHJvdmlkZXInO1xuaW1wb3J0IHtjeWNsaWNEZXBlbmRlbmN5RXJyb3IsIGluc3RhbnRpYXRpb25FcnJvciwgbm9Qcm92aWRlckVycm9yLCBvdXRPZkJvdW5kc0Vycm9yfSBmcm9tICcuL3JlZmxlY3RpdmVfZXJyb3JzJztcbmltcG9ydCB7UmVmbGVjdGl2ZUtleX0gZnJvbSAnLi9yZWZsZWN0aXZlX2tleSc7XG5pbXBvcnQge1JlZmxlY3RpdmVEZXBlbmRlbmN5LCBSZXNvbHZlZFJlZmxlY3RpdmVGYWN0b3J5LCBSZXNvbHZlZFJlZmxlY3RpdmVQcm92aWRlciwgcmVzb2x2ZVJlZmxlY3RpdmVQcm92aWRlcnN9IGZyb20gJy4vcmVmbGVjdGl2ZV9wcm92aWRlcic7XG5cbi8vIFRocmVzaG9sZCBmb3IgdGhlIGR5bmFtaWMgdmVyc2lvblxuY29uc3QgVU5ERUZJTkVEID0gbmV3IE9iamVjdCgpO1xuXG4vKipcbiAqIEEgUmVmbGVjdGl2ZURlcGVuZGVuY3kgaW5qZWN0aW9uIGNvbnRhaW5lciB1c2VkIGZvciBpbnN0YW50aWF0aW5nIG9iamVjdHMgYW5kIHJlc29sdmluZ1xuICogZGVwZW5kZW5jaWVzLlxuICpcbiAqIEFuIGBJbmplY3RvcmAgaXMgYSByZXBsYWNlbWVudCBmb3IgYSBgbmV3YCBvcGVyYXRvciwgd2hpY2ggY2FuIGF1dG9tYXRpY2FsbHkgcmVzb2x2ZSB0aGVcbiAqIGNvbnN0cnVjdG9yIGRlcGVuZGVuY2llcy5cbiAqXG4gKiBJbiB0eXBpY2FsIHVzZSwgYXBwbGljYXRpb24gY29kZSBhc2tzIGZvciB0aGUgZGVwZW5kZW5jaWVzIGluIHRoZSBjb25zdHJ1Y3RvciBhbmQgdGhleSBhcmVcbiAqIHJlc29sdmVkIGJ5IHRoZSBgSW5qZWN0b3JgLlxuICpcbiAqICMjIyBFeGFtcGxlIChbbGl2ZSBkZW1vXShodHRwOi8vcGxua3IuY28vZWRpdC9qemplYzA/cD1wcmV2aWV3KSlcbiAqXG4gKiBUaGUgZm9sbG93aW5nIGV4YW1wbGUgY3JlYXRlcyBhbiBgSW5qZWN0b3JgIGNvbmZpZ3VyZWQgdG8gY3JlYXRlIGBFbmdpbmVgIGFuZCBgQ2FyYC5cbiAqXG4gKiBgYGB0eXBlc2NyaXB0XG4gKiBASW5qZWN0YWJsZSgpXG4gKiBjbGFzcyBFbmdpbmUge1xuICogfVxuICpcbiAqIEBJbmplY3RhYmxlKClcbiAqIGNsYXNzIENhciB7XG4gKiAgIGNvbnN0cnVjdG9yKHB1YmxpYyBlbmdpbmU6RW5naW5lKSB7fVxuICogfVxuICpcbiAqIHZhciBpbmplY3RvciA9IFJlZmxlY3RpdmVJbmplY3Rvci5yZXNvbHZlQW5kQ3JlYXRlKFtDYXIsIEVuZ2luZV0pO1xuICogdmFyIGNhciA9IGluamVjdG9yLmdldChDYXIpO1xuICogZXhwZWN0KGNhciBpbnN0YW5jZW9mIENhcikudG9CZSh0cnVlKTtcbiAqIGV4cGVjdChjYXIuZW5naW5lIGluc3RhbmNlb2YgRW5naW5lKS50b0JlKHRydWUpO1xuICogYGBgXG4gKlxuICogTm90aWNlLCB3ZSBkb24ndCB1c2UgdGhlIGBuZXdgIG9wZXJhdG9yIGJlY2F1c2Ugd2UgZXhwbGljaXRseSB3YW50IHRvIGhhdmUgdGhlIGBJbmplY3RvcmBcbiAqIHJlc29sdmUgYWxsIG9mIHRoZSBvYmplY3QncyBkZXBlbmRlbmNpZXMgYXV0b21hdGljYWxseS5cbiAqXG4gKiBAZGVwcmVjYXRlZCBmcm9tIHY1IC0gc2xvdyBhbmQgYnJpbmdzIGluIGEgbG90IG9mIGNvZGUsIFVzZSBgSW5qZWN0b3IuY3JlYXRlYCBpbnN0ZWFkLlxuICovXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgUmVmbGVjdGl2ZUluamVjdG9yIGltcGxlbWVudHMgSW5qZWN0b3Ige1xuICAvKipcbiAgICogVHVybnMgYW4gYXJyYXkgb2YgcHJvdmlkZXIgZGVmaW5pdGlvbnMgaW50byBhbiBhcnJheSBvZiByZXNvbHZlZCBwcm92aWRlcnMuXG4gICAqXG4gICAqIEEgcmVzb2x1dGlvbiBpcyBhIHByb2Nlc3Mgb2YgZmxhdHRlbmluZyBtdWx0aXBsZSBuZXN0ZWQgYXJyYXlzIGFuZCBjb252ZXJ0aW5nIGluZGl2aWR1YWxcbiAgICogcHJvdmlkZXJzIGludG8gYW4gYXJyYXkgb2Yge0BsaW5rIFJlc29sdmVkUmVmbGVjdGl2ZVByb3ZpZGVyfXMuXG4gICAqXG4gICAqICMjIyBFeGFtcGxlIChbbGl2ZSBkZW1vXShodHRwOi8vcGxua3IuY28vZWRpdC9BaVhUSGk/cD1wcmV2aWV3KSlcbiAgICpcbiAgICogYGBgdHlwZXNjcmlwdFxuICAgKiBASW5qZWN0YWJsZSgpXG4gICAqIGNsYXNzIEVuZ2luZSB7XG4gICAqIH1cbiAgICpcbiAgICogQEluamVjdGFibGUoKVxuICAgKiBjbGFzcyBDYXIge1xuICAgKiAgIGNvbnN0cnVjdG9yKHB1YmxpYyBlbmdpbmU6RW5naW5lKSB7fVxuICAgKiB9XG4gICAqXG4gICAqIHZhciBwcm92aWRlcnMgPSBSZWZsZWN0aXZlSW5qZWN0b3IucmVzb2x2ZShbQ2FyLCBbW0VuZ2luZV1dXSk7XG4gICAqXG4gICAqIGV4cGVjdChwcm92aWRlcnMubGVuZ3RoKS50b0VxdWFsKDIpO1xuICAgKlxuICAgKiBleHBlY3QocHJvdmlkZXJzWzBdIGluc3RhbmNlb2YgUmVzb2x2ZWRSZWZsZWN0aXZlUHJvdmlkZXIpLnRvQmUodHJ1ZSk7XG4gICAqIGV4cGVjdChwcm92aWRlcnNbMF0ua2V5LmRpc3BsYXlOYW1lKS50b0JlKFwiQ2FyXCIpO1xuICAgKiBleHBlY3QocHJvdmlkZXJzWzBdLmRlcGVuZGVuY2llcy5sZW5ndGgpLnRvRXF1YWwoMSk7XG4gICAqIGV4cGVjdChwcm92aWRlcnNbMF0uZmFjdG9yeSkudG9CZURlZmluZWQoKTtcbiAgICpcbiAgICogZXhwZWN0KHByb3ZpZGVyc1sxXS5rZXkuZGlzcGxheU5hbWUpLnRvQmUoXCJFbmdpbmVcIik7XG4gICAqIH0pO1xuICAgKiBgYGBcbiAgICpcbiAgICogU2VlIHtAbGluayBSZWZsZWN0aXZlSW5qZWN0b3IjZnJvbVJlc29sdmVkUHJvdmlkZXJzIGZyb21SZXNvbHZlZFByb3ZpZGVyc30gZm9yIG1vcmUgaW5mby5cbiAgICovXG4gIHN0YXRpYyByZXNvbHZlKHByb3ZpZGVyczogUHJvdmlkZXJbXSk6IFJlc29sdmVkUmVmbGVjdGl2ZVByb3ZpZGVyW10ge1xuICAgIHJldHVybiByZXNvbHZlUmVmbGVjdGl2ZVByb3ZpZGVycyhwcm92aWRlcnMpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlc29sdmVzIGFuIGFycmF5IG9mIHByb3ZpZGVycyBhbmQgY3JlYXRlcyBhbiBpbmplY3RvciBmcm9tIHRob3NlIHByb3ZpZGVycy5cbiAgICpcbiAgICogVGhlIHBhc3NlZC1pbiBwcm92aWRlcnMgY2FuIGJlIGFuIGFycmF5IG9mIGBUeXBlYCwge0BsaW5rIFByb3ZpZGVyfSxcbiAgICogb3IgYSByZWN1cnNpdmUgYXJyYXkgb2YgbW9yZSBwcm92aWRlcnMuXG4gICAqXG4gICAqICMjIyBFeGFtcGxlIChbbGl2ZSBkZW1vXShodHRwOi8vcGxua3IuY28vZWRpdC9lUE9jY0E/cD1wcmV2aWV3KSlcbiAgICpcbiAgICogYGBgdHlwZXNjcmlwdFxuICAgKiBASW5qZWN0YWJsZSgpXG4gICAqIGNsYXNzIEVuZ2luZSB7XG4gICAqIH1cbiAgICpcbiAgICogQEluamVjdGFibGUoKVxuICAgKiBjbGFzcyBDYXIge1xuICAgKiAgIGNvbnN0cnVjdG9yKHB1YmxpYyBlbmdpbmU6RW5naW5lKSB7fVxuICAgKiB9XG4gICAqXG4gICAqIHZhciBpbmplY3RvciA9IFJlZmxlY3RpdmVJbmplY3Rvci5yZXNvbHZlQW5kQ3JlYXRlKFtDYXIsIEVuZ2luZV0pO1xuICAgKiBleHBlY3QoaW5qZWN0b3IuZ2V0KENhcikgaW5zdGFuY2VvZiBDYXIpLnRvQmUodHJ1ZSk7XG4gICAqIGBgYFxuICAgKlxuICAgKiBUaGlzIGZ1bmN0aW9uIGlzIHNsb3dlciB0aGFuIHRoZSBjb3JyZXNwb25kaW5nIGBmcm9tUmVzb2x2ZWRQcm92aWRlcnNgXG4gICAqIGJlY2F1c2UgaXQgbmVlZHMgdG8gcmVzb2x2ZSB0aGUgcGFzc2VkLWluIHByb3ZpZGVycyBmaXJzdC5cbiAgICogU2VlIHtAbGluayBSZWZsZWN0aXZlSW5qZWN0b3IjcmVzb2x2ZSByZXNvbHZlfSBhbmRcbiAgICoge0BsaW5rIFJlZmxlY3RpdmVJbmplY3RvciNmcm9tUmVzb2x2ZWRQcm92aWRlcnMgZnJvbVJlc29sdmVkUHJvdmlkZXJzfS5cbiAgICovXG4gIHN0YXRpYyByZXNvbHZlQW5kQ3JlYXRlKHByb3ZpZGVyczogUHJvdmlkZXJbXSwgcGFyZW50PzogSW5qZWN0b3IpOiBSZWZsZWN0aXZlSW5qZWN0b3Ige1xuICAgIGNvbnN0IFJlc29sdmVkUmVmbGVjdGl2ZVByb3ZpZGVycyA9IFJlZmxlY3RpdmVJbmplY3Rvci5yZXNvbHZlKHByb3ZpZGVycyk7XG4gICAgcmV0dXJuIFJlZmxlY3RpdmVJbmplY3Rvci5mcm9tUmVzb2x2ZWRQcm92aWRlcnMoUmVzb2x2ZWRSZWZsZWN0aXZlUHJvdmlkZXJzLCBwYXJlbnQpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYW4gaW5qZWN0b3IgZnJvbSBwcmV2aW91c2x5IHJlc29sdmVkIHByb3ZpZGVycy5cbiAgICpcbiAgICogVGhpcyBBUEkgaXMgdGhlIHJlY29tbWVuZGVkIHdheSB0byBjb25zdHJ1Y3QgaW5qZWN0b3JzIGluIHBlcmZvcm1hbmNlLXNlbnNpdGl2ZSBwYXJ0cy5cbiAgICpcbiAgICogIyMjIEV4YW1wbGUgKFtsaXZlIGRlbW9dKGh0dHA6Ly9wbG5rci5jby9lZGl0L0tyU01jaT9wPXByZXZpZXcpKVxuICAgKlxuICAgKiBgYGB0eXBlc2NyaXB0XG4gICAqIEBJbmplY3RhYmxlKClcbiAgICogY2xhc3MgRW5naW5lIHtcbiAgICogfVxuICAgKlxuICAgKiBASW5qZWN0YWJsZSgpXG4gICAqIGNsYXNzIENhciB7XG4gICAqICAgY29uc3RydWN0b3IocHVibGljIGVuZ2luZTpFbmdpbmUpIHt9XG4gICAqIH1cbiAgICpcbiAgICogdmFyIHByb3ZpZGVycyA9IFJlZmxlY3RpdmVJbmplY3Rvci5yZXNvbHZlKFtDYXIsIEVuZ2luZV0pO1xuICAgKiB2YXIgaW5qZWN0b3IgPSBSZWZsZWN0aXZlSW5qZWN0b3IuZnJvbVJlc29sdmVkUHJvdmlkZXJzKHByb3ZpZGVycyk7XG4gICAqIGV4cGVjdChpbmplY3Rvci5nZXQoQ2FyKSBpbnN0YW5jZW9mIENhcikudG9CZSh0cnVlKTtcbiAgICogYGBgXG4gICAqIEBleHBlcmltZW50YWxcbiAgICovXG4gIHN0YXRpYyBmcm9tUmVzb2x2ZWRQcm92aWRlcnMocHJvdmlkZXJzOiBSZXNvbHZlZFJlZmxlY3RpdmVQcm92aWRlcltdLCBwYXJlbnQ/OiBJbmplY3Rvcik6XG4gICAgICBSZWZsZWN0aXZlSW5qZWN0b3Ige1xuICAgIHJldHVybiBuZXcgUmVmbGVjdGl2ZUluamVjdG9yXyhwcm92aWRlcnMsIHBhcmVudCk7XG4gIH1cblxuXG4gIC8qKlxuICAgKiBQYXJlbnQgb2YgdGhpcyBpbmplY3Rvci5cbiAgICpcbiAgICogPCEtLSBUT0RPOiBBZGQgYSBsaW5rIHRvIHRoZSBzZWN0aW9uIG9mIHRoZSB1c2VyIGd1aWRlIHRhbGtpbmcgYWJvdXQgaGllcmFyY2hpY2FsIGluamVjdGlvbi5cbiAgICogLS0+XG4gICAqXG4gICAqICMjIyBFeGFtcGxlIChbbGl2ZSBkZW1vXShodHRwOi8vcGxua3IuY28vZWRpdC9lb3NNR28/cD1wcmV2aWV3KSlcbiAgICpcbiAgICogYGBgdHlwZXNjcmlwdFxuICAgKiB2YXIgcGFyZW50ID0gUmVmbGVjdGl2ZUluamVjdG9yLnJlc29sdmVBbmRDcmVhdGUoW10pO1xuICAgKiB2YXIgY2hpbGQgPSBwYXJlbnQucmVzb2x2ZUFuZENyZWF0ZUNoaWxkKFtdKTtcbiAgICogZXhwZWN0KGNoaWxkLnBhcmVudCkudG9CZShwYXJlbnQpO1xuICAgKiBgYGBcbiAgICovXG4gIGFic3RyYWN0IGdldCBwYXJlbnQoKTogSW5qZWN0b3J8bnVsbDtcblxuICAvKipcbiAgICogUmVzb2x2ZXMgYW4gYXJyYXkgb2YgcHJvdmlkZXJzIGFuZCBjcmVhdGVzIGEgY2hpbGQgaW5qZWN0b3IgZnJvbSB0aG9zZSBwcm92aWRlcnMuXG4gICAqXG4gICAqIDwhLS0gVE9ETzogQWRkIGEgbGluayB0byB0aGUgc2VjdGlvbiBvZiB0aGUgdXNlciBndWlkZSB0YWxraW5nIGFib3V0IGhpZXJhcmNoaWNhbCBpbmplY3Rpb24uXG4gICAqIC0tPlxuICAgKlxuICAgKiBUaGUgcGFzc2VkLWluIHByb3ZpZGVycyBjYW4gYmUgYW4gYXJyYXkgb2YgYFR5cGVgLCB7QGxpbmsgUHJvdmlkZXJ9LFxuICAgKiBvciBhIHJlY3Vyc2l2ZSBhcnJheSBvZiBtb3JlIHByb3ZpZGVycy5cbiAgICpcbiAgICogIyMjIEV4YW1wbGUgKFtsaXZlIGRlbW9dKGh0dHA6Ly9wbG5rci5jby9lZGl0L29wQjNUND9wPXByZXZpZXcpKVxuICAgKlxuICAgKiBgYGB0eXBlc2NyaXB0XG4gICAqIGNsYXNzIFBhcmVudFByb3ZpZGVyIHt9XG4gICAqIGNsYXNzIENoaWxkUHJvdmlkZXIge31cbiAgICpcbiAgICogdmFyIHBhcmVudCA9IFJlZmxlY3RpdmVJbmplY3Rvci5yZXNvbHZlQW5kQ3JlYXRlKFtQYXJlbnRQcm92aWRlcl0pO1xuICAgKiB2YXIgY2hpbGQgPSBwYXJlbnQucmVzb2x2ZUFuZENyZWF0ZUNoaWxkKFtDaGlsZFByb3ZpZGVyXSk7XG4gICAqXG4gICAqIGV4cGVjdChjaGlsZC5nZXQoUGFyZW50UHJvdmlkZXIpIGluc3RhbmNlb2YgUGFyZW50UHJvdmlkZXIpLnRvQmUodHJ1ZSk7XG4gICAqIGV4cGVjdChjaGlsZC5nZXQoQ2hpbGRQcm92aWRlcikgaW5zdGFuY2VvZiBDaGlsZFByb3ZpZGVyKS50b0JlKHRydWUpO1xuICAgKiBleHBlY3QoY2hpbGQuZ2V0KFBhcmVudFByb3ZpZGVyKSkudG9CZShwYXJlbnQuZ2V0KFBhcmVudFByb3ZpZGVyKSk7XG4gICAqIGBgYFxuICAgKlxuICAgKiBUaGlzIGZ1bmN0aW9uIGlzIHNsb3dlciB0aGFuIHRoZSBjb3JyZXNwb25kaW5nIGBjcmVhdGVDaGlsZEZyb21SZXNvbHZlZGBcbiAgICogYmVjYXVzZSBpdCBuZWVkcyB0byByZXNvbHZlIHRoZSBwYXNzZWQtaW4gcHJvdmlkZXJzIGZpcnN0LlxuICAgKiBTZWUge0BsaW5rIFJlZmxlY3RpdmVJbmplY3RvciNyZXNvbHZlIHJlc29sdmV9IGFuZFxuICAgKiB7QGxpbmsgUmVmbGVjdGl2ZUluamVjdG9yI2NyZWF0ZUNoaWxkRnJvbVJlc29sdmVkIGNyZWF0ZUNoaWxkRnJvbVJlc29sdmVkfS5cbiAgICovXG4gIGFic3RyYWN0IHJlc29sdmVBbmRDcmVhdGVDaGlsZChwcm92aWRlcnM6IFByb3ZpZGVyW10pOiBSZWZsZWN0aXZlSW5qZWN0b3I7XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBjaGlsZCBpbmplY3RvciBmcm9tIHByZXZpb3VzbHkgcmVzb2x2ZWQgcHJvdmlkZXJzLlxuICAgKlxuICAgKiA8IS0tIFRPRE86IEFkZCBhIGxpbmsgdG8gdGhlIHNlY3Rpb24gb2YgdGhlIHVzZXIgZ3VpZGUgdGFsa2luZyBhYm91dCBoaWVyYXJjaGljYWwgaW5qZWN0aW9uLlxuICAgKiAtLT5cbiAgICpcbiAgICogVGhpcyBBUEkgaXMgdGhlIHJlY29tbWVuZGVkIHdheSB0byBjb25zdHJ1Y3QgaW5qZWN0b3JzIGluIHBlcmZvcm1hbmNlLXNlbnNpdGl2ZSBwYXJ0cy5cbiAgICpcbiAgICogIyMjIEV4YW1wbGUgKFtsaXZlIGRlbW9dKGh0dHA6Ly9wbG5rci5jby9lZGl0L1ZoeWZqTj9wPXByZXZpZXcpKVxuICAgKlxuICAgKiBgYGB0eXBlc2NyaXB0XG4gICAqIGNsYXNzIFBhcmVudFByb3ZpZGVyIHt9XG4gICAqIGNsYXNzIENoaWxkUHJvdmlkZXIge31cbiAgICpcbiAgICogdmFyIHBhcmVudFByb3ZpZGVycyA9IFJlZmxlY3RpdmVJbmplY3Rvci5yZXNvbHZlKFtQYXJlbnRQcm92aWRlcl0pO1xuICAgKiB2YXIgY2hpbGRQcm92aWRlcnMgPSBSZWZsZWN0aXZlSW5qZWN0b3IucmVzb2x2ZShbQ2hpbGRQcm92aWRlcl0pO1xuICAgKlxuICAgKiB2YXIgcGFyZW50ID0gUmVmbGVjdGl2ZUluamVjdG9yLmZyb21SZXNvbHZlZFByb3ZpZGVycyhwYXJlbnRQcm92aWRlcnMpO1xuICAgKiB2YXIgY2hpbGQgPSBwYXJlbnQuY3JlYXRlQ2hpbGRGcm9tUmVzb2x2ZWQoY2hpbGRQcm92aWRlcnMpO1xuICAgKlxuICAgKiBleHBlY3QoY2hpbGQuZ2V0KFBhcmVudFByb3ZpZGVyKSBpbnN0YW5jZW9mIFBhcmVudFByb3ZpZGVyKS50b0JlKHRydWUpO1xuICAgKiBleHBlY3QoY2hpbGQuZ2V0KENoaWxkUHJvdmlkZXIpIGluc3RhbmNlb2YgQ2hpbGRQcm92aWRlcikudG9CZSh0cnVlKTtcbiAgICogZXhwZWN0KGNoaWxkLmdldChQYXJlbnRQcm92aWRlcikpLnRvQmUocGFyZW50LmdldChQYXJlbnRQcm92aWRlcikpO1xuICAgKiBgYGBcbiAgICovXG4gIGFic3RyYWN0IGNyZWF0ZUNoaWxkRnJvbVJlc29sdmVkKHByb3ZpZGVyczogUmVzb2x2ZWRSZWZsZWN0aXZlUHJvdmlkZXJbXSk6IFJlZmxlY3RpdmVJbmplY3RvcjtcblxuICAvKipcbiAgICogUmVzb2x2ZXMgYSBwcm92aWRlciBhbmQgaW5zdGFudGlhdGVzIGFuIG9iamVjdCBpbiB0aGUgY29udGV4dCBvZiB0aGUgaW5qZWN0b3IuXG4gICAqXG4gICAqIFRoZSBjcmVhdGVkIG9iamVjdCBkb2VzIG5vdCBnZXQgY2FjaGVkIGJ5IHRoZSBpbmplY3Rvci5cbiAgICpcbiAgICogIyMjIEV4YW1wbGUgKFtsaXZlIGRlbW9dKGh0dHA6Ly9wbG5rci5jby9lZGl0L3l2VlhvQj9wPXByZXZpZXcpKVxuICAgKlxuICAgKiBgYGB0eXBlc2NyaXB0XG4gICAqIEBJbmplY3RhYmxlKClcbiAgICogY2xhc3MgRW5naW5lIHtcbiAgICogfVxuICAgKlxuICAgKiBASW5qZWN0YWJsZSgpXG4gICAqIGNsYXNzIENhciB7XG4gICAqICAgY29uc3RydWN0b3IocHVibGljIGVuZ2luZTpFbmdpbmUpIHt9XG4gICAqIH1cbiAgICpcbiAgICogdmFyIGluamVjdG9yID0gUmVmbGVjdGl2ZUluamVjdG9yLnJlc29sdmVBbmRDcmVhdGUoW0VuZ2luZV0pO1xuICAgKlxuICAgKiB2YXIgY2FyID0gaW5qZWN0b3IucmVzb2x2ZUFuZEluc3RhbnRpYXRlKENhcik7XG4gICAqIGV4cGVjdChjYXIuZW5naW5lKS50b0JlKGluamVjdG9yLmdldChFbmdpbmUpKTtcbiAgICogZXhwZWN0KGNhcikubm90LnRvQmUoaW5qZWN0b3IucmVzb2x2ZUFuZEluc3RhbnRpYXRlKENhcikpO1xuICAgKiBgYGBcbiAgICovXG4gIGFic3RyYWN0IHJlc29sdmVBbmRJbnN0YW50aWF0ZShwcm92aWRlcjogUHJvdmlkZXIpOiBhbnk7XG5cbiAgLyoqXG4gICAqIEluc3RhbnRpYXRlcyBhbiBvYmplY3QgdXNpbmcgYSByZXNvbHZlZCBwcm92aWRlciBpbiB0aGUgY29udGV4dCBvZiB0aGUgaW5qZWN0b3IuXG4gICAqXG4gICAqIFRoZSBjcmVhdGVkIG9iamVjdCBkb2VzIG5vdCBnZXQgY2FjaGVkIGJ5IHRoZSBpbmplY3Rvci5cbiAgICpcbiAgICogIyMjIEV4YW1wbGUgKFtsaXZlIGRlbW9dKGh0dHA6Ly9wbG5rci5jby9lZGl0L3B0Q0ltUT9wPXByZXZpZXcpKVxuICAgKlxuICAgKiBgYGB0eXBlc2NyaXB0XG4gICAqIEBJbmplY3RhYmxlKClcbiAgICogY2xhc3MgRW5naW5lIHtcbiAgICogfVxuICAgKlxuICAgKiBASW5qZWN0YWJsZSgpXG4gICAqIGNsYXNzIENhciB7XG4gICAqICAgY29uc3RydWN0b3IocHVibGljIGVuZ2luZTpFbmdpbmUpIHt9XG4gICAqIH1cbiAgICpcbiAgICogdmFyIGluamVjdG9yID0gUmVmbGVjdGl2ZUluamVjdG9yLnJlc29sdmVBbmRDcmVhdGUoW0VuZ2luZV0pO1xuICAgKiB2YXIgY2FyUHJvdmlkZXIgPSBSZWZsZWN0aXZlSW5qZWN0b3IucmVzb2x2ZShbQ2FyXSlbMF07XG4gICAqIHZhciBjYXIgPSBpbmplY3Rvci5pbnN0YW50aWF0ZVJlc29sdmVkKGNhclByb3ZpZGVyKTtcbiAgICogZXhwZWN0KGNhci5lbmdpbmUpLnRvQmUoaW5qZWN0b3IuZ2V0KEVuZ2luZSkpO1xuICAgKiBleHBlY3QoY2FyKS5ub3QudG9CZShpbmplY3Rvci5pbnN0YW50aWF0ZVJlc29sdmVkKGNhclByb3ZpZGVyKSk7XG4gICAqIGBgYFxuICAgKi9cbiAgYWJzdHJhY3QgaW5zdGFudGlhdGVSZXNvbHZlZChwcm92aWRlcjogUmVzb2x2ZWRSZWZsZWN0aXZlUHJvdmlkZXIpOiBhbnk7XG5cbiAgYWJzdHJhY3QgZ2V0KHRva2VuOiBhbnksIG5vdEZvdW5kVmFsdWU/OiBhbnkpOiBhbnk7XG59XG5cbmV4cG9ydCBjbGFzcyBSZWZsZWN0aXZlSW5qZWN0b3JfIGltcGxlbWVudHMgUmVmbGVjdGl2ZUluamVjdG9yIHtcbiAgcHJpdmF0ZSBzdGF0aWMgSU5KRUNUT1JfS0VZID0gUmVmbGVjdGl2ZUtleS5nZXQoSW5qZWN0b3IpO1xuICAvKiogQGludGVybmFsICovXG4gIF9jb25zdHJ1Y3Rpb25Db3VudGVyOiBudW1iZXIgPSAwO1xuICAvKiogQGludGVybmFsICovXG4gIHB1YmxpYyBfcHJvdmlkZXJzOiBSZXNvbHZlZFJlZmxlY3RpdmVQcm92aWRlcltdO1xuICBwdWJsaWMgcmVhZG9ubHkgcGFyZW50OiBJbmplY3RvcnxudWxsO1xuXG4gIGtleUlkczogbnVtYmVyW107XG4gIG9ianM6IGFueVtdO1xuICAvKipcbiAgICogUHJpdmF0ZVxuICAgKi9cbiAgY29uc3RydWN0b3IoX3Byb3ZpZGVyczogUmVzb2x2ZWRSZWZsZWN0aXZlUHJvdmlkZXJbXSwgX3BhcmVudD86IEluamVjdG9yKSB7XG4gICAgdGhpcy5fcHJvdmlkZXJzID0gX3Byb3ZpZGVycztcbiAgICB0aGlzLnBhcmVudCA9IF9wYXJlbnQgfHwgbnVsbDtcblxuICAgIGNvbnN0IGxlbiA9IF9wcm92aWRlcnMubGVuZ3RoO1xuXG4gICAgdGhpcy5rZXlJZHMgPSBuZXcgQXJyYXkobGVuKTtcbiAgICB0aGlzLm9ianMgPSBuZXcgQXJyYXkobGVuKTtcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgIHRoaXMua2V5SWRzW2ldID0gX3Byb3ZpZGVyc1tpXS5rZXkuaWQ7XG4gICAgICB0aGlzLm9ianNbaV0gPSBVTkRFRklORUQ7XG4gICAgfVxuICB9XG5cbiAgZ2V0KHRva2VuOiBhbnksIG5vdEZvdW5kVmFsdWU6IGFueSA9IFRIUk9XX0lGX05PVF9GT1VORCk6IGFueSB7XG4gICAgcmV0dXJuIHRoaXMuX2dldEJ5S2V5KFJlZmxlY3RpdmVLZXkuZ2V0KHRva2VuKSwgbnVsbCwgbm90Rm91bmRWYWx1ZSk7XG4gIH1cblxuICByZXNvbHZlQW5kQ3JlYXRlQ2hpbGQocHJvdmlkZXJzOiBQcm92aWRlcltdKTogUmVmbGVjdGl2ZUluamVjdG9yIHtcbiAgICBjb25zdCBSZXNvbHZlZFJlZmxlY3RpdmVQcm92aWRlcnMgPSBSZWZsZWN0aXZlSW5qZWN0b3IucmVzb2x2ZShwcm92aWRlcnMpO1xuICAgIHJldHVybiB0aGlzLmNyZWF0ZUNoaWxkRnJvbVJlc29sdmVkKFJlc29sdmVkUmVmbGVjdGl2ZVByb3ZpZGVycyk7XG4gIH1cblxuICBjcmVhdGVDaGlsZEZyb21SZXNvbHZlZChwcm92aWRlcnM6IFJlc29sdmVkUmVmbGVjdGl2ZVByb3ZpZGVyW10pOiBSZWZsZWN0aXZlSW5qZWN0b3Ige1xuICAgIGNvbnN0IGluaiA9IG5ldyBSZWZsZWN0aXZlSW5qZWN0b3JfKHByb3ZpZGVycyk7XG4gICAgKGluaiBhc3twYXJlbnQ6IEluamVjdG9yIHwgbnVsbH0pLnBhcmVudCA9IHRoaXM7XG4gICAgcmV0dXJuIGluajtcbiAgfVxuXG4gIHJlc29sdmVBbmRJbnN0YW50aWF0ZShwcm92aWRlcjogUHJvdmlkZXIpOiBhbnkge1xuICAgIHJldHVybiB0aGlzLmluc3RhbnRpYXRlUmVzb2x2ZWQoUmVmbGVjdGl2ZUluamVjdG9yLnJlc29sdmUoW3Byb3ZpZGVyXSlbMF0pO1xuICB9XG5cbiAgaW5zdGFudGlhdGVSZXNvbHZlZChwcm92aWRlcjogUmVzb2x2ZWRSZWZsZWN0aXZlUHJvdmlkZXIpOiBhbnkge1xuICAgIHJldHVybiB0aGlzLl9pbnN0YW50aWF0ZVByb3ZpZGVyKHByb3ZpZGVyKTtcbiAgfVxuXG4gIGdldFByb3ZpZGVyQXRJbmRleChpbmRleDogbnVtYmVyKTogUmVzb2x2ZWRSZWZsZWN0aXZlUHJvdmlkZXIge1xuICAgIGlmIChpbmRleCA8IDAgfHwgaW5kZXggPj0gdGhpcy5fcHJvdmlkZXJzLmxlbmd0aCkge1xuICAgICAgdGhyb3cgb3V0T2ZCb3VuZHNFcnJvcihpbmRleCk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLl9wcm92aWRlcnNbaW5kZXhdO1xuICB9XG5cbiAgLyoqIEBpbnRlcm5hbCAqL1xuICBfbmV3KHByb3ZpZGVyOiBSZXNvbHZlZFJlZmxlY3RpdmVQcm92aWRlcik6IGFueSB7XG4gICAgaWYgKHRoaXMuX2NvbnN0cnVjdGlvbkNvdW50ZXIrKyA+IHRoaXMuX2dldE1heE51bWJlck9mT2JqZWN0cygpKSB7XG4gICAgICB0aHJvdyBjeWNsaWNEZXBlbmRlbmN5RXJyb3IodGhpcywgcHJvdmlkZXIua2V5KTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuX2luc3RhbnRpYXRlUHJvdmlkZXIocHJvdmlkZXIpO1xuICB9XG5cbiAgcHJpdmF0ZSBfZ2V0TWF4TnVtYmVyT2ZPYmplY3RzKCk6IG51bWJlciB7IHJldHVybiB0aGlzLm9ianMubGVuZ3RoOyB9XG5cbiAgcHJpdmF0ZSBfaW5zdGFudGlhdGVQcm92aWRlcihwcm92aWRlcjogUmVzb2x2ZWRSZWZsZWN0aXZlUHJvdmlkZXIpOiBhbnkge1xuICAgIGlmIChwcm92aWRlci5tdWx0aVByb3ZpZGVyKSB7XG4gICAgICBjb25zdCByZXMgPSBuZXcgQXJyYXkocHJvdmlkZXIucmVzb2x2ZWRGYWN0b3JpZXMubGVuZ3RoKTtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcHJvdmlkZXIucmVzb2x2ZWRGYWN0b3JpZXMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgcmVzW2ldID0gdGhpcy5faW5zdGFudGlhdGUocHJvdmlkZXIsIHByb3ZpZGVyLnJlc29sdmVkRmFjdG9yaWVzW2ldKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiByZXM7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB0aGlzLl9pbnN0YW50aWF0ZShwcm92aWRlciwgcHJvdmlkZXIucmVzb2x2ZWRGYWN0b3JpZXNbMF0pO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgX2luc3RhbnRpYXRlKFxuICAgICAgcHJvdmlkZXI6IFJlc29sdmVkUmVmbGVjdGl2ZVByb3ZpZGVyLFxuICAgICAgUmVzb2x2ZWRSZWZsZWN0aXZlRmFjdG9yeTogUmVzb2x2ZWRSZWZsZWN0aXZlRmFjdG9yeSk6IGFueSB7XG4gICAgY29uc3QgZmFjdG9yeSA9IFJlc29sdmVkUmVmbGVjdGl2ZUZhY3RvcnkuZmFjdG9yeTtcblxuICAgIGxldCBkZXBzOiBhbnlbXTtcbiAgICB0cnkge1xuICAgICAgZGVwcyA9XG4gICAgICAgICAgUmVzb2x2ZWRSZWZsZWN0aXZlRmFjdG9yeS5kZXBlbmRlbmNpZXMubWFwKGRlcCA9PiB0aGlzLl9nZXRCeVJlZmxlY3RpdmVEZXBlbmRlbmN5KGRlcCkpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGlmIChlLmFkZEtleSkge1xuICAgICAgICBlLmFkZEtleSh0aGlzLCBwcm92aWRlci5rZXkpO1xuICAgICAgfVxuICAgICAgdGhyb3cgZTtcbiAgICB9XG5cbiAgICBsZXQgb2JqOiBhbnk7XG4gICAgdHJ5IHtcbiAgICAgIG9iaiA9IGZhY3RvcnkoLi4uZGVwcyk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgdGhyb3cgaW5zdGFudGlhdGlvbkVycm9yKHRoaXMsIGUsIGUuc3RhY2ssIHByb3ZpZGVyLmtleSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG9iajtcbiAgfVxuXG4gIHByaXZhdGUgX2dldEJ5UmVmbGVjdGl2ZURlcGVuZGVuY3koZGVwOiBSZWZsZWN0aXZlRGVwZW5kZW5jeSk6IGFueSB7XG4gICAgcmV0dXJuIHRoaXMuX2dldEJ5S2V5KGRlcC5rZXksIGRlcC52aXNpYmlsaXR5LCBkZXAub3B0aW9uYWwgPyBudWxsIDogVEhST1dfSUZfTk9UX0ZPVU5EKTtcbiAgfVxuXG4gIHByaXZhdGUgX2dldEJ5S2V5KGtleTogUmVmbGVjdGl2ZUtleSwgdmlzaWJpbGl0eTogU2VsZnxTa2lwU2VsZnxudWxsLCBub3RGb3VuZFZhbHVlOiBhbnkpOiBhbnkge1xuICAgIGlmIChrZXkgPT09IFJlZmxlY3RpdmVJbmplY3Rvcl8uSU5KRUNUT1JfS0VZKSB7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBpZiAodmlzaWJpbGl0eSBpbnN0YW5jZW9mIFNlbGYpIHtcbiAgICAgIHJldHVybiB0aGlzLl9nZXRCeUtleVNlbGYoa2V5LCBub3RGb3VuZFZhbHVlKTtcblxuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gdGhpcy5fZ2V0QnlLZXlEZWZhdWx0KGtleSwgbm90Rm91bmRWYWx1ZSwgdmlzaWJpbGl0eSk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBfZ2V0T2JqQnlLZXlJZChrZXlJZDogbnVtYmVyKTogYW55IHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMua2V5SWRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAodGhpcy5rZXlJZHNbaV0gPT09IGtleUlkKSB7XG4gICAgICAgIGlmICh0aGlzLm9ianNbaV0gPT09IFVOREVGSU5FRCkge1xuICAgICAgICAgIHRoaXMub2Jqc1tpXSA9IHRoaXMuX25ldyh0aGlzLl9wcm92aWRlcnNbaV0pO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXMub2Jqc1tpXTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gVU5ERUZJTkVEO1xuICB9XG5cbiAgLyoqIEBpbnRlcm5hbCAqL1xuICBfdGhyb3dPck51bGwoa2V5OiBSZWZsZWN0aXZlS2V5LCBub3RGb3VuZFZhbHVlOiBhbnkpOiBhbnkge1xuICAgIGlmIChub3RGb3VuZFZhbHVlICE9PSBUSFJPV19JRl9OT1RfRk9VTkQpIHtcbiAgICAgIHJldHVybiBub3RGb3VuZFZhbHVlO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBub1Byb3ZpZGVyRXJyb3IodGhpcywga2V5KTtcbiAgICB9XG4gIH1cblxuICAvKiogQGludGVybmFsICovXG4gIF9nZXRCeUtleVNlbGYoa2V5OiBSZWZsZWN0aXZlS2V5LCBub3RGb3VuZFZhbHVlOiBhbnkpOiBhbnkge1xuICAgIGNvbnN0IG9iaiA9IHRoaXMuX2dldE9iakJ5S2V5SWQoa2V5LmlkKTtcbiAgICByZXR1cm4gKG9iaiAhPT0gVU5ERUZJTkVEKSA/IG9iaiA6IHRoaXMuX3Rocm93T3JOdWxsKGtleSwgbm90Rm91bmRWYWx1ZSk7XG4gIH1cblxuICAvKiogQGludGVybmFsICovXG4gIF9nZXRCeUtleURlZmF1bHQoa2V5OiBSZWZsZWN0aXZlS2V5LCBub3RGb3VuZFZhbHVlOiBhbnksIHZpc2liaWxpdHk6IFNlbGZ8U2tpcFNlbGZ8bnVsbCk6IGFueSB7XG4gICAgbGV0IGluajogSW5qZWN0b3J8bnVsbDtcblxuICAgIGlmICh2aXNpYmlsaXR5IGluc3RhbmNlb2YgU2tpcFNlbGYpIHtcbiAgICAgIGluaiA9IHRoaXMucGFyZW50O1xuICAgIH0gZWxzZSB7XG4gICAgICBpbmogPSB0aGlzO1xuICAgIH1cblxuICAgIHdoaWxlIChpbmogaW5zdGFuY2VvZiBSZWZsZWN0aXZlSW5qZWN0b3JfKSB7XG4gICAgICBjb25zdCBpbmpfID0gPFJlZmxlY3RpdmVJbmplY3Rvcl8+aW5qO1xuICAgICAgY29uc3Qgb2JqID0gaW5qXy5fZ2V0T2JqQnlLZXlJZChrZXkuaWQpO1xuICAgICAgaWYgKG9iaiAhPT0gVU5ERUZJTkVEKSByZXR1cm4gb2JqO1xuICAgICAgaW5qID0gaW5qXy5wYXJlbnQ7XG4gICAgfVxuICAgIGlmIChpbmogIT09IG51bGwpIHtcbiAgICAgIHJldHVybiBpbmouZ2V0KGtleS50b2tlbiwgbm90Rm91bmRWYWx1ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB0aGlzLl90aHJvd09yTnVsbChrZXksIG5vdEZvdW5kVmFsdWUpO1xuICAgIH1cbiAgfVxuXG4gIGdldCBkaXNwbGF5TmFtZSgpOiBzdHJpbmcge1xuICAgIGNvbnN0IHByb3ZpZGVycyA9XG4gICAgICAgIF9tYXBQcm92aWRlcnModGhpcywgKGI6IFJlc29sdmVkUmVmbGVjdGl2ZVByb3ZpZGVyKSA9PiAnIFwiJyArIGIua2V5LmRpc3BsYXlOYW1lICsgJ1wiICcpXG4gICAgICAgICAgICAuam9pbignLCAnKTtcbiAgICByZXR1cm4gYFJlZmxlY3RpdmVJbmplY3Rvcihwcm92aWRlcnM6IFske3Byb3ZpZGVyc31dKWA7XG4gIH1cblxuICB0b1N0cmluZygpOiBzdHJpbmcgeyByZXR1cm4gdGhpcy5kaXNwbGF5TmFtZTsgfVxufVxuXG5mdW5jdGlvbiBfbWFwUHJvdmlkZXJzKGluamVjdG9yOiBSZWZsZWN0aXZlSW5qZWN0b3JfLCBmbjogRnVuY3Rpb24pOiBhbnlbXSB7XG4gIGNvbnN0IHJlczogYW55W10gPSBuZXcgQXJyYXkoaW5qZWN0b3IuX3Byb3ZpZGVycy5sZW5ndGgpO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGluamVjdG9yLl9wcm92aWRlcnMubGVuZ3RoOyArK2kpIHtcbiAgICByZXNbaV0gPSBmbihpbmplY3Rvci5nZXRQcm92aWRlckF0SW5kZXgoaSkpO1xuICB9XG4gIHJldHVybiByZXM7XG59XG4iXX0=