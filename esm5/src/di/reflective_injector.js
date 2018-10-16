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
 * @usageNotes
 * ### Example
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
     * providers into an array of `ResolvedReflectiveProvider`s.
     *
     * @usageNotes
     * ### Example
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
     */
    ReflectiveInjector.resolve = function (providers) {
        return resolveReflectiveProviders(providers);
    };
    /**
     * Resolves an array of providers and creates an injector from those providers.
     *
     * The passed-in providers can be an array of `Type`, `Provider`,
     * or a recursive array of more providers.
     *
     * @usageNotes
     * ### Example
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
     * @usageNotes
     * ### Example
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVmbGVjdGl2ZV9pbmplY3Rvci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL2RpL3JlZmxlY3RpdmVfaW5qZWN0b3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOztBQUVILE9BQU8sRUFBQyxRQUFRLEVBQUUsa0JBQWtCLEVBQUMsTUFBTSxZQUFZLENBQUM7QUFDeEQsT0FBTyxFQUFDLElBQUksRUFBRSxRQUFRLEVBQUMsTUFBTSxZQUFZLENBQUM7QUFFMUMsT0FBTyxFQUFDLHFCQUFxQixFQUFFLGtCQUFrQixFQUFFLGVBQWUsRUFBRSxnQkFBZ0IsRUFBQyxNQUFNLHFCQUFxQixDQUFDO0FBQ2pILE9BQU8sRUFBQyxhQUFhLEVBQUMsTUFBTSxrQkFBa0IsQ0FBQztBQUMvQyxPQUFPLEVBQThFLDBCQUEwQixFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFFOUksb0NBQW9DO0FBQ3BDLElBQU0sU0FBUyxHQUFHLElBQUksTUFBTSxFQUFFLENBQUM7QUFFL0I7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBbUNHO0FBQ0g7SUFBQTtJQXFOQSxDQUFDO0lBcE5DOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztPQWdDRztJQUNJLDBCQUFPLEdBQWQsVUFBZSxTQUFxQjtRQUNsQyxPQUFPLDBCQUEwQixDQUFDLFNBQVMsQ0FBQyxDQUFDO0lBQy9DLENBQUM7SUFFRDs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztPQXNCRztJQUNJLG1DQUFnQixHQUF2QixVQUF3QixTQUFxQixFQUFFLE1BQWlCO1FBQzlELElBQU0sMkJBQTJCLEdBQUcsa0JBQWtCLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQzFFLE9BQU8sa0JBQWtCLENBQUMscUJBQXFCLENBQUMsMkJBQTJCLEVBQUUsTUFBTSxDQUFDLENBQUM7SUFDdkYs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QUFDLENBQUM7SUFDekQsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFFBQVEsQ0FBQyxVQUFVLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxFQUFFO1FBQ25ELEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsUUFBUSxDQUFDLGtCQUFrQixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7S0FDN0M7SUFDRCxPQUFPLEdBQUcsQ0FBQztBQUNiLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7SW5qZWN0b3IsIFRIUk9XX0lGX05PVF9GT1VORH0gZnJvbSAnLi9pbmplY3Rvcic7XG5pbXBvcnQge1NlbGYsIFNraXBTZWxmfSBmcm9tICcuL21ldGFkYXRhJztcbmltcG9ydCB7UHJvdmlkZXJ9IGZyb20gJy4vcHJvdmlkZXInO1xuaW1wb3J0IHtjeWNsaWNEZXBlbmRlbmN5RXJyb3IsIGluc3RhbnRpYXRpb25FcnJvciwgbm9Qcm92aWRlckVycm9yLCBvdXRPZkJvdW5kc0Vycm9yfSBmcm9tICcuL3JlZmxlY3RpdmVfZXJyb3JzJztcbmltcG9ydCB7UmVmbGVjdGl2ZUtleX0gZnJvbSAnLi9yZWZsZWN0aXZlX2tleSc7XG5pbXBvcnQge1JlZmxlY3RpdmVEZXBlbmRlbmN5LCBSZXNvbHZlZFJlZmxlY3RpdmVGYWN0b3J5LCBSZXNvbHZlZFJlZmxlY3RpdmVQcm92aWRlciwgcmVzb2x2ZVJlZmxlY3RpdmVQcm92aWRlcnN9IGZyb20gJy4vcmVmbGVjdGl2ZV9wcm92aWRlcic7XG5cbi8vIFRocmVzaG9sZCBmb3IgdGhlIGR5bmFtaWMgdmVyc2lvblxuY29uc3QgVU5ERUZJTkVEID0gbmV3IE9iamVjdCgpO1xuXG4vKipcbiAqIEEgUmVmbGVjdGl2ZURlcGVuZGVuY3kgaW5qZWN0aW9uIGNvbnRhaW5lciB1c2VkIGZvciBpbnN0YW50aWF0aW5nIG9iamVjdHMgYW5kIHJlc29sdmluZ1xuICogZGVwZW5kZW5jaWVzLlxuICpcbiAqIEFuIGBJbmplY3RvcmAgaXMgYSByZXBsYWNlbWVudCBmb3IgYSBgbmV3YCBvcGVyYXRvciwgd2hpY2ggY2FuIGF1dG9tYXRpY2FsbHkgcmVzb2x2ZSB0aGVcbiAqIGNvbnN0cnVjdG9yIGRlcGVuZGVuY2llcy5cbiAqXG4gKiBJbiB0eXBpY2FsIHVzZSwgYXBwbGljYXRpb24gY29kZSBhc2tzIGZvciB0aGUgZGVwZW5kZW5jaWVzIGluIHRoZSBjb25zdHJ1Y3RvciBhbmQgdGhleSBhcmVcbiAqIHJlc29sdmVkIGJ5IHRoZSBgSW5qZWN0b3JgLlxuICpcbiAqIEB1c2FnZU5vdGVzXG4gKiAjIyMgRXhhbXBsZVxuICpcbiAqIFRoZSBmb2xsb3dpbmcgZXhhbXBsZSBjcmVhdGVzIGFuIGBJbmplY3RvcmAgY29uZmlndXJlZCB0byBjcmVhdGUgYEVuZ2luZWAgYW5kIGBDYXJgLlxuICpcbiAqIGBgYHR5cGVzY3JpcHRcbiAqIEBJbmplY3RhYmxlKClcbiAqIGNsYXNzIEVuZ2luZSB7XG4gKiB9XG4gKlxuICogQEluamVjdGFibGUoKVxuICogY2xhc3MgQ2FyIHtcbiAqICAgY29uc3RydWN0b3IocHVibGljIGVuZ2luZTpFbmdpbmUpIHt9XG4gKiB9XG4gKlxuICogdmFyIGluamVjdG9yID0gUmVmbGVjdGl2ZUluamVjdG9yLnJlc29sdmVBbmRDcmVhdGUoW0NhciwgRW5naW5lXSk7XG4gKiB2YXIgY2FyID0gaW5qZWN0b3IuZ2V0KENhcik7XG4gKiBleHBlY3QoY2FyIGluc3RhbmNlb2YgQ2FyKS50b0JlKHRydWUpO1xuICogZXhwZWN0KGNhci5lbmdpbmUgaW5zdGFuY2VvZiBFbmdpbmUpLnRvQmUodHJ1ZSk7XG4gKiBgYGBcbiAqXG4gKiBOb3RpY2UsIHdlIGRvbid0IHVzZSB0aGUgYG5ld2Agb3BlcmF0b3IgYmVjYXVzZSB3ZSBleHBsaWNpdGx5IHdhbnQgdG8gaGF2ZSB0aGUgYEluamVjdG9yYFxuICogcmVzb2x2ZSBhbGwgb2YgdGhlIG9iamVjdCdzIGRlcGVuZGVuY2llcyBhdXRvbWF0aWNhbGx5LlxuICpcbiAqIEBkZXByZWNhdGVkIGZyb20gdjUgLSBzbG93IGFuZCBicmluZ3MgaW4gYSBsb3Qgb2YgY29kZSwgVXNlIGBJbmplY3Rvci5jcmVhdGVgIGluc3RlYWQuXG4gKi9cbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBSZWZsZWN0aXZlSW5qZWN0b3IgaW1wbGVtZW50cyBJbmplY3RvciB7XG4gIC8qKlxuICAgKiBUdXJucyBhbiBhcnJheSBvZiBwcm92aWRlciBkZWZpbml0aW9ucyBpbnRvIGFuIGFycmF5IG9mIHJlc29sdmVkIHByb3ZpZGVycy5cbiAgICpcbiAgICogQSByZXNvbHV0aW9uIGlzIGEgcHJvY2VzcyBvZiBmbGF0dGVuaW5nIG11bHRpcGxlIG5lc3RlZCBhcnJheXMgYW5kIGNvbnZlcnRpbmcgaW5kaXZpZHVhbFxuICAgKiBwcm92aWRlcnMgaW50byBhbiBhcnJheSBvZiBgUmVzb2x2ZWRSZWZsZWN0aXZlUHJvdmlkZXJgcy5cbiAgICpcbiAgICogQHVzYWdlTm90ZXNcbiAgICogIyMjIEV4YW1wbGVcbiAgICpcbiAgICogYGBgdHlwZXNjcmlwdFxuICAgKiBASW5qZWN0YWJsZSgpXG4gICAqIGNsYXNzIEVuZ2luZSB7XG4gICAqIH1cbiAgICpcbiAgICogQEluamVjdGFibGUoKVxuICAgKiBjbGFzcyBDYXIge1xuICAgKiAgIGNvbnN0cnVjdG9yKHB1YmxpYyBlbmdpbmU6RW5naW5lKSB7fVxuICAgKiB9XG4gICAqXG4gICAqIHZhciBwcm92aWRlcnMgPSBSZWZsZWN0aXZlSW5qZWN0b3IucmVzb2x2ZShbQ2FyLCBbW0VuZ2luZV1dXSk7XG4gICAqXG4gICAqIGV4cGVjdChwcm92aWRlcnMubGVuZ3RoKS50b0VxdWFsKDIpO1xuICAgKlxuICAgKiBleHBlY3QocHJvdmlkZXJzWzBdIGluc3RhbmNlb2YgUmVzb2x2ZWRSZWZsZWN0aXZlUHJvdmlkZXIpLnRvQmUodHJ1ZSk7XG4gICAqIGV4cGVjdChwcm92aWRlcnNbMF0ua2V5LmRpc3BsYXlOYW1lKS50b0JlKFwiQ2FyXCIpO1xuICAgKiBleHBlY3QocHJvdmlkZXJzWzBdLmRlcGVuZGVuY2llcy5sZW5ndGgpLnRvRXF1YWwoMSk7XG4gICAqIGV4cGVjdChwcm92aWRlcnNbMF0uZmFjdG9yeSkudG9CZURlZmluZWQoKTtcbiAgICpcbiAgICogZXhwZWN0KHByb3ZpZGVyc1sxXS5rZXkuZGlzcGxheU5hbWUpLnRvQmUoXCJFbmdpbmVcIik7XG4gICAqIH0pO1xuICAgKiBgYGBcbiAgICpcbiAgICovXG4gIHN0YXRpYyByZXNvbHZlKHByb3ZpZGVyczogUHJvdmlkZXJbXSk6IFJlc29sdmVkUmVmbGVjdGl2ZVByb3ZpZGVyW10ge1xuICAgIHJldHVybiByZXNvbHZlUmVmbGVjdGl2ZVByb3ZpZGVycyhwcm92aWRlcnMpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlc29sdmVzIGFuIGFycmF5IG9mIHByb3ZpZGVycyBhbmQgY3JlYXRlcyBhbiBpbmplY3RvciBmcm9tIHRob3NlIHByb3ZpZGVycy5cbiAgICpcbiAgICogVGhlIHBhc3NlZC1pbiBwcm92aWRlcnMgY2FuIGJlIGFuIGFycmF5IG9mIGBUeXBlYCwgYFByb3ZpZGVyYCxcbiAgICogb3IgYSByZWN1cnNpdmUgYXJyYXkgb2YgbW9yZSBwcm92aWRlcnMuXG4gICAqXG4gICAqIEB1c2FnZU5vdGVzXG4gICAqICMjIyBFeGFtcGxlXG4gICAqXG4gICAqIGBgYHR5cGVzY3JpcHRcbiAgICogQEluamVjdGFibGUoKVxuICAgKiBjbGFzcyBFbmdpbmUge1xuICAgKiB9XG4gICAqXG4gICAqIEBJbmplY3RhYmxlKClcbiAgICogY2xhc3MgQ2FyIHtcbiAgICogICBjb25zdHJ1Y3RvcihwdWJsaWMgZW5naW5lOkVuZ2luZSkge31cbiAgICogfVxuICAgKlxuICAgKiB2YXIgaW5qZWN0b3IgPSBSZWZsZWN0aXZlSW5qZWN0b3IucmVzb2x2ZUFuZENyZWF0ZShbQ2FyLCBFbmdpbmVdKTtcbiAgICogZXhwZWN0KGluamVjdG9yLmdldChDYXIpIGluc3RhbmNlb2YgQ2FyKS50b0JlKHRydWUpO1xuICAgKiBgYGBcbiAgICovXG4gIHN0YXRpYyByZXNvbHZlQW5kQ3JlYXRlKHByb3ZpZGVyczogUHJvdmlkZXJbXSwgcGFyZW50PzogSW5qZWN0b3IpOiBSZWZsZWN0aXZlSW5qZWN0b3Ige1xuICAgIGNvbnN0IFJlc29sdmVkUmVmbGVjdGl2ZVByb3ZpZGVycyA9IFJlZmxlY3RpdmVJbmplY3Rvci5yZXNvbHZlKHByb3ZpZGVycyk7XG4gICAgcmV0dXJuIFJlZmxlY3RpdmVJbmplY3Rvci5mcm9tUmVzb2x2ZWRQcm92aWRlcnMoUmVzb2x2ZWRSZWZsZWN0aXZlUHJvdmlkZXJzLCBwYXJlbnQpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYW4gaW5qZWN0b3IgZnJvbSBwcmV2aW91c2x5IHJlc29sdmVkIHByb3ZpZGVycy5cbiAgICpcbiAgICogVGhpcyBBUEkgaXMgdGhlIHJlY29tbWVuZGVkIHdheSB0byBjb25zdHJ1Y3QgaW5qZWN0b3JzIGluIHBlcmZvcm1hbmNlLXNlbnNpdGl2ZSBwYXJ0cy5cbiAgICpcbiAgICogQHVzYWdlTm90ZXNcbiAgICogIyMjIEV4YW1wbGVcbiAgICpcbiAgICogYGBgdHlwZXNjcmlwdFxuICAgKiBASW5qZWN0YWJsZSgpXG4gICAqIGNsYXNzIEVuZ2luZSB7XG4gICAqIH1cbiAgICpcbiAgICogQEluamVjdGFibGUoKVxuICAgKiBjbGFzcyBDYXIge1xuICAgKiAgIGNvbnN0cnVjdG9yKHB1YmxpYyBlbmdpbmU6RW5naW5lKSB7fVxuICAgKiB9XG4gICAqXG4gICAqIHZhciBwcm92aWRlcnMgPSBSZWZsZWN0aXZlSW5qZWN0b3IucmVzb2x2ZShbQ2FyLCBFbmdpbmVdKTtcbiAgICogdmFyIGluamVjdG9yID0gUmVmbGVjdGl2ZUluamVjdG9yLmZyb21SZXNvbHZlZFByb3ZpZGVycyhwcm92aWRlcnMpO1xuICAgKiBleHBlY3QoaW5qZWN0b3IuZ2V0KENhcikgaW5zdGFuY2VvZiBDYXIpLnRvQmUodHJ1ZSk7XG4gICAqIGBgYFxuICAgKiBAZXhwZXJpbWVudGFsXG4gICAqL1xuICBzdGF0aWMgZnJvbVJlc29sdmVkUHJvdmlkZXJzKHByb3ZpZGVyczogUmVzb2x2ZWRSZWZsZWN0aXZlUHJvdmlkZXJbXSwgcGFyZW50PzogSW5qZWN0b3IpOlxuICAgICAgUmVmbGVjdGl2ZUluamVjdG9yIHtcbiAgICByZXR1cm4gbmV3IFJlZmxlY3RpdmVJbmplY3Rvcl8ocHJvdmlkZXJzLCBwYXJlbnQpO1xuICB9XG5cblxuICAvKipcbiAgICogUGFyZW50IG9mIHRoaXMgaW5qZWN0b3IuXG4gICAqXG4gICAqIDwhLS0gVE9ETzogQWRkIGEgbGluayB0byB0aGUgc2VjdGlvbiBvZiB0aGUgdXNlciBndWlkZSB0YWxraW5nIGFib3V0IGhpZXJhcmNoaWNhbCBpbmplY3Rpb24uXG4gICAqIC0tPlxuICAgKi9cbiAgYWJzdHJhY3QgZ2V0IHBhcmVudCgpOiBJbmplY3RvcnxudWxsO1xuXG4gIC8qKlxuICAgKiBSZXNvbHZlcyBhbiBhcnJheSBvZiBwcm92aWRlcnMgYW5kIGNyZWF0ZXMgYSBjaGlsZCBpbmplY3RvciBmcm9tIHRob3NlIHByb3ZpZGVycy5cbiAgICpcbiAgICogPCEtLSBUT0RPOiBBZGQgYSBsaW5rIHRvIHRoZSBzZWN0aW9uIG9mIHRoZSB1c2VyIGd1aWRlIHRhbGtpbmcgYWJvdXQgaGllcmFyY2hpY2FsIGluamVjdGlvbi5cbiAgICogLS0+XG4gICAqXG4gICAqIFRoZSBwYXNzZWQtaW4gcHJvdmlkZXJzIGNhbiBiZSBhbiBhcnJheSBvZiBgVHlwZWAsIGBQcm92aWRlcmAsXG4gICAqIG9yIGEgcmVjdXJzaXZlIGFycmF5IG9mIG1vcmUgcHJvdmlkZXJzLlxuICAgKlxuICAgKiBAdXNhZ2VOb3Rlc1xuICAgKiAjIyMgRXhhbXBsZVxuICAgKlxuICAgKiBgYGB0eXBlc2NyaXB0XG4gICAqIGNsYXNzIFBhcmVudFByb3ZpZGVyIHt9XG4gICAqIGNsYXNzIENoaWxkUHJvdmlkZXIge31cbiAgICpcbiAgICogdmFyIHBhcmVudCA9IFJlZmxlY3RpdmVJbmplY3Rvci5yZXNvbHZlQW5kQ3JlYXRlKFtQYXJlbnRQcm92aWRlcl0pO1xuICAgKiB2YXIgY2hpbGQgPSBwYXJlbnQucmVzb2x2ZUFuZENyZWF0ZUNoaWxkKFtDaGlsZFByb3ZpZGVyXSk7XG4gICAqXG4gICAqIGV4cGVjdChjaGlsZC5nZXQoUGFyZW50UHJvdmlkZXIpIGluc3RhbmNlb2YgUGFyZW50UHJvdmlkZXIpLnRvQmUodHJ1ZSk7XG4gICAqIGV4cGVjdChjaGlsZC5nZXQoQ2hpbGRQcm92aWRlcikgaW5zdGFuY2VvZiBDaGlsZFByb3ZpZGVyKS50b0JlKHRydWUpO1xuICAgKiBleHBlY3QoY2hpbGQuZ2V0KFBhcmVudFByb3ZpZGVyKSkudG9CZShwYXJlbnQuZ2V0KFBhcmVudFByb3ZpZGVyKSk7XG4gICAqIGBgYFxuICAgKi9cbiAgYWJzdHJhY3QgcmVzb2x2ZUFuZENyZWF0ZUNoaWxkKHByb3ZpZGVyczogUHJvdmlkZXJbXSk6IFJlZmxlY3RpdmVJbmplY3RvcjtcblxuICAvKipcbiAgICogQ3JlYXRlcyBhIGNoaWxkIGluamVjdG9yIGZyb20gcHJldmlvdXNseSByZXNvbHZlZCBwcm92aWRlcnMuXG4gICAqXG4gICAqIDwhLS0gVE9ETzogQWRkIGEgbGluayB0byB0aGUgc2VjdGlvbiBvZiB0aGUgdXNlciBndWlkZSB0YWxraW5nIGFib3V0IGhpZXJhcmNoaWNhbCBpbmplY3Rpb24uXG4gICAqIC0tPlxuICAgKlxuICAgKiBUaGlzIEFQSSBpcyB0aGUgcmVjb21tZW5kZWQgd2F5IHRvIGNvbnN0cnVjdCBpbmplY3RvcnMgaW4gcGVyZm9ybWFuY2Utc2Vuc2l0aXZlIHBhcnRzLlxuICAgKlxuICAgKiBAdXNhZ2VOb3Rlc1xuICAgKiAjIyMgRXhhbXBsZVxuICAgKlxuICAgKiBgYGB0eXBlc2NyaXB0XG4gICAqIGNsYXNzIFBhcmVudFByb3ZpZGVyIHt9XG4gICAqIGNsYXNzIENoaWxkUHJvdmlkZXIge31cbiAgICpcbiAgICogdmFyIHBhcmVudFByb3ZpZGVycyA9IFJlZmxlY3RpdmVJbmplY3Rvci5yZXNvbHZlKFtQYXJlbnRQcm92aWRlcl0pO1xuICAgKiB2YXIgY2hpbGRQcm92aWRlcnMgPSBSZWZsZWN0aXZlSW5qZWN0b3IucmVzb2x2ZShbQ2hpbGRQcm92aWRlcl0pO1xuICAgKlxuICAgKiB2YXIgcGFyZW50ID0gUmVmbGVjdGl2ZUluamVjdG9yLmZyb21SZXNvbHZlZFByb3ZpZGVycyhwYXJlbnRQcm92aWRlcnMpO1xuICAgKiB2YXIgY2hpbGQgPSBwYXJlbnQuY3JlYXRlQ2hpbGRGcm9tUmVzb2x2ZWQoY2hpbGRQcm92aWRlcnMpO1xuICAgKlxuICAgKiBleHBlY3QoY2hpbGQuZ2V0KFBhcmVudFByb3ZpZGVyKSBpbnN0YW5jZW9mIFBhcmVudFByb3ZpZGVyKS50b0JlKHRydWUpO1xuICAgKiBleHBlY3QoY2hpbGQuZ2V0KENoaWxkUHJvdmlkZXIpIGluc3RhbmNlb2YgQ2hpbGRQcm92aWRlcikudG9CZSh0cnVlKTtcbiAgICogZXhwZWN0KGNoaWxkLmdldChQYXJlbnRQcm92aWRlcikpLnRvQmUocGFyZW50LmdldChQYXJlbnRQcm92aWRlcikpO1xuICAgKiBgYGBcbiAgICovXG4gIGFic3RyYWN0IGNyZWF0ZUNoaWxkRnJvbVJlc29sdmVkKHByb3ZpZGVyczogUmVzb2x2ZWRSZWZsZWN0aXZlUHJvdmlkZXJbXSk6IFJlZmxlY3RpdmVJbmplY3RvcjtcblxuICAvKipcbiAgICogUmVzb2x2ZXMgYSBwcm92aWRlciBhbmQgaW5zdGFudGlhdGVzIGFuIG9iamVjdCBpbiB0aGUgY29udGV4dCBvZiB0aGUgaW5qZWN0b3IuXG4gICAqXG4gICAqIFRoZSBjcmVhdGVkIG9iamVjdCBkb2VzIG5vdCBnZXQgY2FjaGVkIGJ5IHRoZSBpbmplY3Rvci5cbiAgICpcbiAgICogQHVzYWdlTm90ZXNcbiAgICogIyMjIEV4YW1wbGVcbiAgICpcbiAgICogYGBgdHlwZXNjcmlwdFxuICAgKiBASW5qZWN0YWJsZSgpXG4gICAqIGNsYXNzIEVuZ2luZSB7XG4gICAqIH1cbiAgICpcbiAgICogQEluamVjdGFibGUoKVxuICAgKiBjbGFzcyBDYXIge1xuICAgKiAgIGNvbnN0cnVjdG9yKHB1YmxpYyBlbmdpbmU6RW5naW5lKSB7fVxuICAgKiB9XG4gICAqXG4gICAqIHZhciBpbmplY3RvciA9IFJlZmxlY3RpdmVJbmplY3Rvci5yZXNvbHZlQW5kQ3JlYXRlKFtFbmdpbmVdKTtcbiAgICpcbiAgICogdmFyIGNhciA9IGluamVjdG9yLnJlc29sdmVBbmRJbnN0YW50aWF0ZShDYXIpO1xuICAgKiBleHBlY3QoY2FyLmVuZ2luZSkudG9CZShpbmplY3Rvci5nZXQoRW5naW5lKSk7XG4gICAqIGV4cGVjdChjYXIpLm5vdC50b0JlKGluamVjdG9yLnJlc29sdmVBbmRJbnN0YW50aWF0ZShDYXIpKTtcbiAgICogYGBgXG4gICAqL1xuICBhYnN0cmFjdCByZXNvbHZlQW5kSW5zdGFudGlhdGUocHJvdmlkZXI6IFByb3ZpZGVyKTogYW55O1xuXG4gIC8qKlxuICAgKiBJbnN0YW50aWF0ZXMgYW4gb2JqZWN0IHVzaW5nIGEgcmVzb2x2ZWQgcHJvdmlkZXIgaW4gdGhlIGNvbnRleHQgb2YgdGhlIGluamVjdG9yLlxuICAgKlxuICAgKiBUaGUgY3JlYXRlZCBvYmplY3QgZG9lcyBub3QgZ2V0IGNhY2hlZCBieSB0aGUgaW5qZWN0b3IuXG4gICAqXG4gICAqIEB1c2FnZU5vdGVzXG4gICAqICMjIyBFeGFtcGxlXG4gICAqXG4gICAqIGBgYHR5cGVzY3JpcHRcbiAgICogQEluamVjdGFibGUoKVxuICAgKiBjbGFzcyBFbmdpbmUge1xuICAgKiB9XG4gICAqXG4gICAqIEBJbmplY3RhYmxlKClcbiAgICogY2xhc3MgQ2FyIHtcbiAgICogICBjb25zdHJ1Y3RvcihwdWJsaWMgZW5naW5lOkVuZ2luZSkge31cbiAgICogfVxuICAgKlxuICAgKiB2YXIgaW5qZWN0b3IgPSBSZWZsZWN0aXZlSW5qZWN0b3IucmVzb2x2ZUFuZENyZWF0ZShbRW5naW5lXSk7XG4gICAqIHZhciBjYXJQcm92aWRlciA9IFJlZmxlY3RpdmVJbmplY3Rvci5yZXNvbHZlKFtDYXJdKVswXTtcbiAgICogdmFyIGNhciA9IGluamVjdG9yLmluc3RhbnRpYXRlUmVzb2x2ZWQoY2FyUHJvdmlkZXIpO1xuICAgKiBleHBlY3QoY2FyLmVuZ2luZSkudG9CZShpbmplY3Rvci5nZXQoRW5naW5lKSk7XG4gICAqIGV4cGVjdChjYXIpLm5vdC50b0JlKGluamVjdG9yLmluc3RhbnRpYXRlUmVzb2x2ZWQoY2FyUHJvdmlkZXIpKTtcbiAgICogYGBgXG4gICAqL1xuICBhYnN0cmFjdCBpbnN0YW50aWF0ZVJlc29sdmVkKHByb3ZpZGVyOiBSZXNvbHZlZFJlZmxlY3RpdmVQcm92aWRlcik6IGFueTtcblxuICBhYnN0cmFjdCBnZXQodG9rZW46IGFueSwgbm90Rm91bmRWYWx1ZT86IGFueSk6IGFueTtcbn1cblxuZXhwb3J0IGNsYXNzIFJlZmxlY3RpdmVJbmplY3Rvcl8gaW1wbGVtZW50cyBSZWZsZWN0aXZlSW5qZWN0b3Ige1xuICBwcml2YXRlIHN0YXRpYyBJTkpFQ1RPUl9LRVkgPSBSZWZsZWN0aXZlS2V5LmdldChJbmplY3Rvcik7XG4gIC8qKiBAaW50ZXJuYWwgKi9cbiAgX2NvbnN0cnVjdGlvbkNvdW50ZXI6IG51bWJlciA9IDA7XG4gIC8qKiBAaW50ZXJuYWwgKi9cbiAgcHVibGljIF9wcm92aWRlcnM6IFJlc29sdmVkUmVmbGVjdGl2ZVByb3ZpZGVyW107XG4gIHB1YmxpYyByZWFkb25seSBwYXJlbnQ6IEluamVjdG9yfG51bGw7XG5cbiAga2V5SWRzOiBudW1iZXJbXTtcbiAgb2JqczogYW55W107XG4gIC8qKlxuICAgKiBQcml2YXRlXG4gICAqL1xuICBjb25zdHJ1Y3RvcihfcHJvdmlkZXJzOiBSZXNvbHZlZFJlZmxlY3RpdmVQcm92aWRlcltdLCBfcGFyZW50PzogSW5qZWN0b3IpIHtcbiAgICB0aGlzLl9wcm92aWRlcnMgPSBfcHJvdmlkZXJzO1xuICAgIHRoaXMucGFyZW50ID0gX3BhcmVudCB8fCBudWxsO1xuXG4gICAgY29uc3QgbGVuID0gX3Byb3ZpZGVycy5sZW5ndGg7XG5cbiAgICB0aGlzLmtleUlkcyA9IG5ldyBBcnJheShsZW4pO1xuICAgIHRoaXMub2JqcyA9IG5ldyBBcnJheShsZW4pO1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgICAgdGhpcy5rZXlJZHNbaV0gPSBfcHJvdmlkZXJzW2ldLmtleS5pZDtcbiAgICAgIHRoaXMub2Jqc1tpXSA9IFVOREVGSU5FRDtcbiAgICB9XG4gIH1cblxuICBnZXQodG9rZW46IGFueSwgbm90Rm91bmRWYWx1ZTogYW55ID0gVEhST1dfSUZfTk9UX0ZPVU5EKTogYW55IHtcbiAgICByZXR1cm4gdGhpcy5fZ2V0QnlLZXkoUmVmbGVjdGl2ZUtleS5nZXQodG9rZW4pLCBudWxsLCBub3RGb3VuZFZhbHVlKTtcbiAgfVxuXG4gIHJlc29sdmVBbmRDcmVhdGVDaGlsZChwcm92aWRlcnM6IFByb3ZpZGVyW10pOiBSZWZsZWN0aXZlSW5qZWN0b3Ige1xuICAgIGNvbnN0IFJlc29sdmVkUmVmbGVjdGl2ZVByb3ZpZGVycyA9IFJlZmxlY3RpdmVJbmplY3Rvci5yZXNvbHZlKHByb3ZpZGVycyk7XG4gICAgcmV0dXJuIHRoaXMuY3JlYXRlQ2hpbGRGcm9tUmVzb2x2ZWQoUmVzb2x2ZWRSZWZsZWN0aXZlUHJvdmlkZXJzKTtcbiAgfVxuXG4gIGNyZWF0ZUNoaWxkRnJvbVJlc29sdmVkKHByb3ZpZGVyczogUmVzb2x2ZWRSZWZsZWN0aXZlUHJvdmlkZXJbXSk6IFJlZmxlY3RpdmVJbmplY3RvciB7XG4gICAgY29uc3QgaW5qID0gbmV3IFJlZmxlY3RpdmVJbmplY3Rvcl8ocHJvdmlkZXJzKTtcbiAgICAoaW5qIGFze3BhcmVudDogSW5qZWN0b3IgfCBudWxsfSkucGFyZW50ID0gdGhpcztcbiAgICByZXR1cm4gaW5qO1xuICB9XG5cbiAgcmVzb2x2ZUFuZEluc3RhbnRpYXRlKHByb3ZpZGVyOiBQcm92aWRlcik6IGFueSB7XG4gICAgcmV0dXJuIHRoaXMuaW5zdGFudGlhdGVSZXNvbHZlZChSZWZsZWN0aXZlSW5qZWN0b3IucmVzb2x2ZShbcHJvdmlkZXJdKVswXSk7XG4gIH1cblxuICBpbnN0YW50aWF0ZVJlc29sdmVkKHByb3ZpZGVyOiBSZXNvbHZlZFJlZmxlY3RpdmVQcm92aWRlcik6IGFueSB7XG4gICAgcmV0dXJuIHRoaXMuX2luc3RhbnRpYXRlUHJvdmlkZXIocHJvdmlkZXIpO1xuICB9XG5cbiAgZ2V0UHJvdmlkZXJBdEluZGV4KGluZGV4OiBudW1iZXIpOiBSZXNvbHZlZFJlZmxlY3RpdmVQcm92aWRlciB7XG4gICAgaWYgKGluZGV4IDwgMCB8fCBpbmRleCA+PSB0aGlzLl9wcm92aWRlcnMubGVuZ3RoKSB7XG4gICAgICB0aHJvdyBvdXRPZkJvdW5kc0Vycm9yKGluZGV4KTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuX3Byb3ZpZGVyc1tpbmRleF07XG4gIH1cblxuICAvKiogQGludGVybmFsICovXG4gIF9uZXcocHJvdmlkZXI6IFJlc29sdmVkUmVmbGVjdGl2ZVByb3ZpZGVyKTogYW55IHtcbiAgICBpZiAodGhpcy5fY29uc3RydWN0aW9uQ291bnRlcisrID4gdGhpcy5fZ2V0TWF4TnVtYmVyT2ZPYmplY3RzKCkpIHtcbiAgICAgIHRocm93IGN5Y2xpY0RlcGVuZGVuY3lFcnJvcih0aGlzLCBwcm92aWRlci5rZXkpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5faW5zdGFudGlhdGVQcm92aWRlcihwcm92aWRlcik7XG4gIH1cblxuICBwcml2YXRlIF9nZXRNYXhOdW1iZXJPZk9iamVjdHMoKTogbnVtYmVyIHsgcmV0dXJuIHRoaXMub2Jqcy5sZW5ndGg7IH1cblxuICBwcml2YXRlIF9pbnN0YW50aWF0ZVByb3ZpZGVyKHByb3ZpZGVyOiBSZXNvbHZlZFJlZmxlY3RpdmVQcm92aWRlcik6IGFueSB7XG4gICAgaWYgKHByb3ZpZGVyLm11bHRpUHJvdmlkZXIpIHtcbiAgICAgIGNvbnN0IHJlcyA9IG5ldyBBcnJheShwcm92aWRlci5yZXNvbHZlZEZhY3Rvcmllcy5sZW5ndGgpO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwcm92aWRlci5yZXNvbHZlZEZhY3Rvcmllcy5sZW5ndGg7ICsraSkge1xuICAgICAgICByZXNbaV0gPSB0aGlzLl9pbnN0YW50aWF0ZShwcm92aWRlciwgcHJvdmlkZXIucmVzb2x2ZWRGYWN0b3JpZXNbaV0pO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHJlcztcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHRoaXMuX2luc3RhbnRpYXRlKHByb3ZpZGVyLCBwcm92aWRlci5yZXNvbHZlZEZhY3Rvcmllc1swXSk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBfaW5zdGFudGlhdGUoXG4gICAgICBwcm92aWRlcjogUmVzb2x2ZWRSZWZsZWN0aXZlUHJvdmlkZXIsXG4gICAgICBSZXNvbHZlZFJlZmxlY3RpdmVGYWN0b3J5OiBSZXNvbHZlZFJlZmxlY3RpdmVGYWN0b3J5KTogYW55IHtcbiAgICBjb25zdCBmYWN0b3J5ID0gUmVzb2x2ZWRSZWZsZWN0aXZlRmFjdG9yeS5mYWN0b3J5O1xuXG4gICAgbGV0IGRlcHM6IGFueVtdO1xuICAgIHRyeSB7XG4gICAgICBkZXBzID1cbiAgICAgICAgICBSZXNvbHZlZFJlZmxlY3RpdmVGYWN0b3J5LmRlcGVuZGVuY2llcy5tYXAoZGVwID0+IHRoaXMuX2dldEJ5UmVmbGVjdGl2ZURlcGVuZGVuY3koZGVwKSk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgaWYgKGUuYWRkS2V5KSB7XG4gICAgICAgIGUuYWRkS2V5KHRoaXMsIHByb3ZpZGVyLmtleSk7XG4gICAgICB9XG4gICAgICB0aHJvdyBlO1xuICAgIH1cblxuICAgIGxldCBvYmo6IGFueTtcbiAgICB0cnkge1xuICAgICAgb2JqID0gZmFjdG9yeSguLi5kZXBzKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICB0aHJvdyBpbnN0YW50aWF0aW9uRXJyb3IodGhpcywgZSwgZS5zdGFjaywgcHJvdmlkZXIua2V5KTtcbiAgICB9XG5cbiAgICByZXR1cm4gb2JqO1xuICB9XG5cbiAgcHJpdmF0ZSBfZ2V0QnlSZWZsZWN0aXZlRGVwZW5kZW5jeShkZXA6IFJlZmxlY3RpdmVEZXBlbmRlbmN5KTogYW55IHtcbiAgICByZXR1cm4gdGhpcy5fZ2V0QnlLZXkoZGVwLmtleSwgZGVwLnZpc2liaWxpdHksIGRlcC5vcHRpb25hbCA/IG51bGwgOiBUSFJPV19JRl9OT1RfRk9VTkQpO1xuICB9XG5cbiAgcHJpdmF0ZSBfZ2V0QnlLZXkoa2V5OiBSZWZsZWN0aXZlS2V5LCB2aXNpYmlsaXR5OiBTZWxmfFNraXBTZWxmfG51bGwsIG5vdEZvdW5kVmFsdWU6IGFueSk6IGFueSB7XG4gICAgaWYgKGtleSA9PT0gUmVmbGVjdGl2ZUluamVjdG9yXy5JTkpFQ1RPUl9LRVkpIHtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIGlmICh2aXNpYmlsaXR5IGluc3RhbmNlb2YgU2VsZikge1xuICAgICAgcmV0dXJuIHRoaXMuX2dldEJ5S2V5U2VsZihrZXksIG5vdEZvdW5kVmFsdWUpO1xuXG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB0aGlzLl9nZXRCeUtleURlZmF1bHQoa2V5LCBub3RGb3VuZFZhbHVlLCB2aXNpYmlsaXR5KTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIF9nZXRPYmpCeUtleUlkKGtleUlkOiBudW1iZXIpOiBhbnkge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5rZXlJZHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmICh0aGlzLmtleUlkc1tpXSA9PT0ga2V5SWQpIHtcbiAgICAgICAgaWYgKHRoaXMub2Jqc1tpXSA9PT0gVU5ERUZJTkVEKSB7XG4gICAgICAgICAgdGhpcy5vYmpzW2ldID0gdGhpcy5fbmV3KHRoaXMuX3Byb3ZpZGVyc1tpXSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcy5vYmpzW2ldO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBVTkRFRklORUQ7XG4gIH1cblxuICAvKiogQGludGVybmFsICovXG4gIF90aHJvd09yTnVsbChrZXk6IFJlZmxlY3RpdmVLZXksIG5vdEZvdW5kVmFsdWU6IGFueSk6IGFueSB7XG4gICAgaWYgKG5vdEZvdW5kVmFsdWUgIT09IFRIUk9XX0lGX05PVF9GT1VORCkge1xuICAgICAgcmV0dXJuIG5vdEZvdW5kVmFsdWU7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IG5vUHJvdmlkZXJFcnJvcih0aGlzLCBrZXkpO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBAaW50ZXJuYWwgKi9cbiAgX2dldEJ5S2V5U2VsZihrZXk6IFJlZmxlY3RpdmVLZXksIG5vdEZvdW5kVmFsdWU6IGFueSk6IGFueSB7XG4gICAgY29uc3Qgb2JqID0gdGhpcy5fZ2V0T2JqQnlLZXlJZChrZXkuaWQpO1xuICAgIHJldHVybiAob2JqICE9PSBVTkRFRklORUQpID8gb2JqIDogdGhpcy5fdGhyb3dPck51bGwoa2V5LCBub3RGb3VuZFZhbHVlKTtcbiAgfVxuXG4gIC8qKiBAaW50ZXJuYWwgKi9cbiAgX2dldEJ5S2V5RGVmYXVsdChrZXk6IFJlZmxlY3RpdmVLZXksIG5vdEZvdW5kVmFsdWU6IGFueSwgdmlzaWJpbGl0eTogU2VsZnxTa2lwU2VsZnxudWxsKTogYW55IHtcbiAgICBsZXQgaW5qOiBJbmplY3RvcnxudWxsO1xuXG4gICAgaWYgKHZpc2liaWxpdHkgaW5zdGFuY2VvZiBTa2lwU2VsZikge1xuICAgICAgaW5qID0gdGhpcy5wYXJlbnQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIGluaiA9IHRoaXM7XG4gICAgfVxuXG4gICAgd2hpbGUgKGluaiBpbnN0YW5jZW9mIFJlZmxlY3RpdmVJbmplY3Rvcl8pIHtcbiAgICAgIGNvbnN0IGlual8gPSA8UmVmbGVjdGl2ZUluamVjdG9yXz5pbmo7XG4gICAgICBjb25zdCBvYmogPSBpbmpfLl9nZXRPYmpCeUtleUlkKGtleS5pZCk7XG4gICAgICBpZiAob2JqICE9PSBVTkRFRklORUQpIHJldHVybiBvYmo7XG4gICAgICBpbmogPSBpbmpfLnBhcmVudDtcbiAgICB9XG4gICAgaWYgKGluaiAhPT0gbnVsbCkge1xuICAgICAgcmV0dXJuIGluai5nZXQoa2V5LnRva2VuLCBub3RGb3VuZFZhbHVlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHRoaXMuX3Rocm93T3JOdWxsKGtleSwgbm90Rm91bmRWYWx1ZSk7XG4gICAgfVxuICB9XG5cbiAgZ2V0IGRpc3BsYXlOYW1lKCk6IHN0cmluZyB7XG4gICAgY29uc3QgcHJvdmlkZXJzID1cbiAgICAgICAgX21hcFByb3ZpZGVycyh0aGlzLCAoYjogUmVzb2x2ZWRSZWZsZWN0aXZlUHJvdmlkZXIpID0+ICcgXCInICsgYi5rZXkuZGlzcGxheU5hbWUgKyAnXCIgJylcbiAgICAgICAgICAgIC5qb2luKCcsICcpO1xuICAgIHJldHVybiBgUmVmbGVjdGl2ZUluamVjdG9yKHByb3ZpZGVyczogWyR7cHJvdmlkZXJzfV0pYDtcbiAgfVxuXG4gIHRvU3RyaW5nKCk6IHN0cmluZyB7IHJldHVybiB0aGlzLmRpc3BsYXlOYW1lOyB9XG59XG5cbmZ1bmN0aW9uIF9tYXBQcm92aWRlcnMoaW5qZWN0b3I6IFJlZmxlY3RpdmVJbmplY3Rvcl8sIGZuOiBGdW5jdGlvbik6IGFueVtdIHtcbiAgY29uc3QgcmVzOiBhbnlbXSA9IG5ldyBBcnJheShpbmplY3Rvci5fcHJvdmlkZXJzLmxlbmd0aCk7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgaW5qZWN0b3IuX3Byb3ZpZGVycy5sZW5ndGg7ICsraSkge1xuICAgIHJlc1tpXSA9IGZuKGluamVjdG9yLmdldFByb3ZpZGVyQXRJbmRleChpKSk7XG4gIH1cbiAgcmV0dXJuIHJlcztcbn1cbiJdfQ==