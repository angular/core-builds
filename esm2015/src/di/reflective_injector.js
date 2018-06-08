/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Injector, THROW_IF_NOT_FOUND } from './injector';
import { Self, SkipSelf } from './metadata';
import { cyclicDependencyError, instantiationError, noProviderError, outOfBoundsError } from './reflective_errors';
import { ReflectiveKey } from './reflective_key';
import { resolveReflectiveProviders } from './reflective_provider';
// Threshold for the dynamic version
const UNDEFINED = new Object();
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
export class ReflectiveInjector {
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
    static resolve(providers) {
        return resolveReflectiveProviders(providers);
    }
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
    static resolveAndCreate(providers, parent) {
        const ResolvedReflectiveProviders = ReflectiveInjector.resolve(providers);
        return ReflectiveInjector.fromResolvedProviders(ResolvedReflectiveProviders, parent);
    }
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
    static fromResolvedProviders(providers, parent) {
        return new ReflectiveInjector_(providers, parent);
    }
}
export class ReflectiveInjector_ {
    /**
     * Private
     */
    constructor(_providers, _parent) {
        /** @internal */
        this._constructionCounter = 0;
        this._providers = _providers;
        this.parent = _parent || null;
        const len = _providers.length;
        this.keyIds = new Array(len);
        this.objs = new Array(len);
        for (let i = 0; i < len; i++) {
            this.keyIds[i] = _providers[i].key.id;
            this.objs[i] = UNDEFINED;
        }
    }
    get(token, notFoundValue = THROW_IF_NOT_FOUND) {
        return this._getByKey(ReflectiveKey.get(token), null, notFoundValue);
    }
    resolveAndCreateChild(providers) {
        const ResolvedReflectiveProviders = ReflectiveInjector.resolve(providers);
        return this.createChildFromResolved(ResolvedReflectiveProviders);
    }
    createChildFromResolved(providers) {
        const inj = new ReflectiveInjector_(providers);
        inj.parent = this;
        return inj;
    }
    resolveAndInstantiate(provider) {
        return this.instantiateResolved(ReflectiveInjector.resolve([provider])[0]);
    }
    instantiateResolved(provider) {
        return this._instantiateProvider(provider);
    }
    getProviderAtIndex(index) {
        if (index < 0 || index >= this._providers.length) {
            throw outOfBoundsError(index);
        }
        return this._providers[index];
    }
    /** @internal */
    _new(provider) {
        if (this._constructionCounter++ > this._getMaxNumberOfObjects()) {
            throw cyclicDependencyError(this, provider.key);
        }
        return this._instantiateProvider(provider);
    }
    _getMaxNumberOfObjects() { return this.objs.length; }
    _instantiateProvider(provider) {
        if (provider.multiProvider) {
            const res = new Array(provider.resolvedFactories.length);
            for (let i = 0; i < provider.resolvedFactories.length; ++i) {
                res[i] = this._instantiate(provider, provider.resolvedFactories[i]);
            }
            return res;
        }
        else {
            return this._instantiate(provider, provider.resolvedFactories[0]);
        }
    }
    _instantiate(provider, ResolvedReflectiveFactory) {
        const factory = ResolvedReflectiveFactory.factory;
        let deps;
        try {
            deps =
                ResolvedReflectiveFactory.dependencies.map(dep => this._getByReflectiveDependency(dep));
        }
        catch (e) {
            if (e.addKey) {
                e.addKey(this, provider.key);
            }
            throw e;
        }
        let obj;
        try {
            obj = factory(...deps);
        }
        catch (e) {
            throw instantiationError(this, e, e.stack, provider.key);
        }
        return obj;
    }
    _getByReflectiveDependency(dep) {
        return this._getByKey(dep.key, dep.visibility, dep.optional ? null : THROW_IF_NOT_FOUND);
    }
    _getByKey(key, visibility, notFoundValue) {
        if (key === ReflectiveInjector_.INJECTOR_KEY) {
            return this;
        }
        if (visibility instanceof Self) {
            return this._getByKeySelf(key, notFoundValue);
        }
        else {
            return this._getByKeyDefault(key, notFoundValue, visibility);
        }
    }
    _getObjByKeyId(keyId) {
        for (let i = 0; i < this.keyIds.length; i++) {
            if (this.keyIds[i] === keyId) {
                if (this.objs[i] === UNDEFINED) {
                    this.objs[i] = this._new(this._providers[i]);
                }
                return this.objs[i];
            }
        }
        return UNDEFINED;
    }
    /** @internal */
    _throwOrNull(key, notFoundValue) {
        if (notFoundValue !== THROW_IF_NOT_FOUND) {
            return notFoundValue;
        }
        else {
            throw noProviderError(this, key);
        }
    }
    /** @internal */
    _getByKeySelf(key, notFoundValue) {
        const obj = this._getObjByKeyId(key.id);
        return (obj !== UNDEFINED) ? obj : this._throwOrNull(key, notFoundValue);
    }
    /** @internal */
    _getByKeyDefault(key, notFoundValue, visibility) {
        let inj;
        if (visibility instanceof SkipSelf) {
            inj = this.parent;
        }
        else {
            inj = this;
        }
        while (inj instanceof ReflectiveInjector_) {
            const inj_ = inj;
            const obj = inj_._getObjByKeyId(key.id);
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
    }
    get displayName() {
        const providers = _mapProviders(this, (b) => ' "' + b.key.displayName + '" ')
            .join(', ');
        return `ReflectiveInjector(providers: [${providers}])`;
    }
    toString() { return this.displayName; }
}
ReflectiveInjector_.INJECTOR_KEY = ReflectiveKey.get(Injector);
function _mapProviders(injector, fn) {
    const res = new Array(injector._providers.length);
    for (let i = 0; i < injector._providers.length; ++i) {
        res[i] = fn(injector.getProviderAtIndex(i));
    }
    return res;
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVmbGVjdGl2ZV9pbmplY3Rvci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL2RpL3JlZmxlY3RpdmVfaW5qZWN0b3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLFFBQVEsRUFBRSxrQkFBa0IsRUFBQyxNQUFNLFlBQVksQ0FBQztBQUN4RCxPQUFPLEVBQUMsSUFBSSxFQUFFLFFBQVEsRUFBQyxNQUFNLFlBQVksQ0FBQztBQUUxQyxPQUFPLEVBQUMscUJBQXFCLEVBQUUsa0JBQWtCLEVBQUUsZUFBZSxFQUFFLGdCQUFnQixFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFDakgsT0FBTyxFQUFDLGFBQWEsRUFBQyxNQUFNLGtCQUFrQixDQUFDO0FBQy9DLE9BQU8sRUFBOEUsMEJBQTBCLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUU5SSxvQ0FBb0M7QUFDcEMsTUFBTSxTQUFTLEdBQUcsSUFBSSxNQUFNLEVBQUUsQ0FBQztBQUUvQjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztHQWtDRztBQUNILE1BQU07SUFDSjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7T0FnQ0c7SUFDSCxNQUFNLENBQUMsT0FBTyxDQUFDLFNBQXFCO1FBQ2xDLE9BQU8sMEJBQTBCLENBQUMsU0FBUyxDQUFDLENBQUM7SUFDL0MsQ0FBQztJQUVEOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztPQTBCRztJQUNILE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxTQUFxQixFQUFFLE1BQWlCO1FBQzlELE1BQU0sMkJBQTJCLEdBQUcsa0JBQWtCLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQzFFLE9BQU8sa0JBQWtCLENBQUMscUJBQXFCLENBQUMsMkJBQTJCLEVBQUUsTUFBTSxDQUFDLENBQUM7SUFDdkYsQ0FBQztJQUVEOzs7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Q29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0luamVjdG9yLCBUSFJPV19JRl9OT1RfRk9VTkR9IGZyb20gJy4vaW5qZWN0b3InO1xuaW1wb3J0IHtTZWxmLCBTa2lwU2VsZn0gZnJvbSAnLi9tZXRhZGF0YSc7XG5pbXBvcnQge1Byb3ZpZGVyfSBmcm9tICcuL3Byb3ZpZGVyJztcbmltcG9ydCB7Y3ljbGljRGVwZW5kZW5jeUVycm9yLCBpbnN0YW50aWF0aW9uRXJyb3IsIG5vUHJvdmlkZXJFcnJvciwgb3V0T2ZCb3VuZHNFcnJvcn0gZnJvbSAnLi9yZWZsZWN0aXZlX2Vycm9ycyc7XG5pbXBvcnQge1JlZmxlY3RpdmVLZXl9IGZyb20gJy4vcmVmbGVjdGl2ZV9rZXknO1xuaW1wb3J0IHtSZWZsZWN0aXZlRGVwZW5kZW5jeSwgUmVzb2x2ZWRSZWZsZWN0aXZlRmFjdG9yeSwgUmVzb2x2ZWRSZWZsZWN0aXZlUHJvdmlkZXIsIHJlc29sdmVSZWZsZWN0aXZlUHJvdmlkZXJzfSBmcm9tICcuL3JlZmxlY3RpdmVfcHJvdmlkZXInO1xuXG4vLyBUaHJlc2hvbGQgZm9yIHRoZSBkeW5hbWljIHZlcnNpb25cbmNvbnN0IFVOREVGSU5FRCA9IG5ldyBPYmplY3QoKTtcblxuLyoqXG4gKiBBIFJlZmxlY3RpdmVEZXBlbmRlbmN5IGluamVjdGlvbiBjb250YWluZXIgdXNlZCBmb3IgaW5zdGFudGlhdGluZyBvYmplY3RzIGFuZCByZXNvbHZpbmdcbiAqIGRlcGVuZGVuY2llcy5cbiAqXG4gKiBBbiBgSW5qZWN0b3JgIGlzIGEgcmVwbGFjZW1lbnQgZm9yIGEgYG5ld2Agb3BlcmF0b3IsIHdoaWNoIGNhbiBhdXRvbWF0aWNhbGx5IHJlc29sdmUgdGhlXG4gKiBjb25zdHJ1Y3RvciBkZXBlbmRlbmNpZXMuXG4gKlxuICogSW4gdHlwaWNhbCB1c2UsIGFwcGxpY2F0aW9uIGNvZGUgYXNrcyBmb3IgdGhlIGRlcGVuZGVuY2llcyBpbiB0aGUgY29uc3RydWN0b3IgYW5kIHRoZXkgYXJlXG4gKiByZXNvbHZlZCBieSB0aGUgYEluamVjdG9yYC5cbiAqXG4gKiAjIyMgRXhhbXBsZSAoW2xpdmUgZGVtb10oaHR0cDovL3BsbmtyLmNvL2VkaXQvanpqZWMwP3A9cHJldmlldykpXG4gKlxuICogVGhlIGZvbGxvd2luZyBleGFtcGxlIGNyZWF0ZXMgYW4gYEluamVjdG9yYCBjb25maWd1cmVkIHRvIGNyZWF0ZSBgRW5naW5lYCBhbmQgYENhcmAuXG4gKlxuICogYGBgdHlwZXNjcmlwdFxuICogQEluamVjdGFibGUoKVxuICogY2xhc3MgRW5naW5lIHtcbiAqIH1cbiAqXG4gKiBASW5qZWN0YWJsZSgpXG4gKiBjbGFzcyBDYXIge1xuICogICBjb25zdHJ1Y3RvcihwdWJsaWMgZW5naW5lOkVuZ2luZSkge31cbiAqIH1cbiAqXG4gKiB2YXIgaW5qZWN0b3IgPSBSZWZsZWN0aXZlSW5qZWN0b3IucmVzb2x2ZUFuZENyZWF0ZShbQ2FyLCBFbmdpbmVdKTtcbiAqIHZhciBjYXIgPSBpbmplY3Rvci5nZXQoQ2FyKTtcbiAqIGV4cGVjdChjYXIgaW5zdGFuY2VvZiBDYXIpLnRvQmUodHJ1ZSk7XG4gKiBleHBlY3QoY2FyLmVuZ2luZSBpbnN0YW5jZW9mIEVuZ2luZSkudG9CZSh0cnVlKTtcbiAqIGBgYFxuICpcbiAqIE5vdGljZSwgd2UgZG9uJ3QgdXNlIHRoZSBgbmV3YCBvcGVyYXRvciBiZWNhdXNlIHdlIGV4cGxpY2l0bHkgd2FudCB0byBoYXZlIHRoZSBgSW5qZWN0b3JgXG4gKiByZXNvbHZlIGFsbCBvZiB0aGUgb2JqZWN0J3MgZGVwZW5kZW5jaWVzIGF1dG9tYXRpY2FsbHkuXG4gKlxuICogQGRlcHJlY2F0ZWQgZnJvbSB2NSAtIHNsb3cgYW5kIGJyaW5ncyBpbiBhIGxvdCBvZiBjb2RlLCBVc2UgYEluamVjdG9yLmNyZWF0ZWAgaW5zdGVhZC5cbiAqL1xuZXhwb3J0IGFic3RyYWN0IGNsYXNzIFJlZmxlY3RpdmVJbmplY3RvciBpbXBsZW1lbnRzIEluamVjdG9yIHtcbiAgLyoqXG4gICAqIFR1cm5zIGFuIGFycmF5IG9mIHByb3ZpZGVyIGRlZmluaXRpb25zIGludG8gYW4gYXJyYXkgb2YgcmVzb2x2ZWQgcHJvdmlkZXJzLlxuICAgKlxuICAgKiBBIHJlc29sdXRpb24gaXMgYSBwcm9jZXNzIG9mIGZsYXR0ZW5pbmcgbXVsdGlwbGUgbmVzdGVkIGFycmF5cyBhbmQgY29udmVydGluZyBpbmRpdmlkdWFsXG4gICAqIHByb3ZpZGVycyBpbnRvIGFuIGFycmF5IG9mIHtAbGluayBSZXNvbHZlZFJlZmxlY3RpdmVQcm92aWRlcn1zLlxuICAgKlxuICAgKiAjIyMgRXhhbXBsZSAoW2xpdmUgZGVtb10oaHR0cDovL3BsbmtyLmNvL2VkaXQvQWlYVEhpP3A9cHJldmlldykpXG4gICAqXG4gICAqIGBgYHR5cGVzY3JpcHRcbiAgICogQEluamVjdGFibGUoKVxuICAgKiBjbGFzcyBFbmdpbmUge1xuICAgKiB9XG4gICAqXG4gICAqIEBJbmplY3RhYmxlKClcbiAgICogY2xhc3MgQ2FyIHtcbiAgICogICBjb25zdHJ1Y3RvcihwdWJsaWMgZW5naW5lOkVuZ2luZSkge31cbiAgICogfVxuICAgKlxuICAgKiB2YXIgcHJvdmlkZXJzID0gUmVmbGVjdGl2ZUluamVjdG9yLnJlc29sdmUoW0NhciwgW1tFbmdpbmVdXV0pO1xuICAgKlxuICAgKiBleHBlY3QocHJvdmlkZXJzLmxlbmd0aCkudG9FcXVhbCgyKTtcbiAgICpcbiAgICogZXhwZWN0KHByb3ZpZGVyc1swXSBpbnN0YW5jZW9mIFJlc29sdmVkUmVmbGVjdGl2ZVByb3ZpZGVyKS50b0JlKHRydWUpO1xuICAgKiBleHBlY3QocHJvdmlkZXJzWzBdLmtleS5kaXNwbGF5TmFtZSkudG9CZShcIkNhclwiKTtcbiAgICogZXhwZWN0KHByb3ZpZGVyc1swXS5kZXBlbmRlbmNpZXMubGVuZ3RoKS50b0VxdWFsKDEpO1xuICAgKiBleHBlY3QocHJvdmlkZXJzWzBdLmZhY3RvcnkpLnRvQmVEZWZpbmVkKCk7XG4gICAqXG4gICAqIGV4cGVjdChwcm92aWRlcnNbMV0ua2V5LmRpc3BsYXlOYW1lKS50b0JlKFwiRW5naW5lXCIpO1xuICAgKiB9KTtcbiAgICogYGBgXG4gICAqXG4gICAqIFNlZSB7QGxpbmsgUmVmbGVjdGl2ZUluamVjdG9yI2Zyb21SZXNvbHZlZFByb3ZpZGVycyBmcm9tUmVzb2x2ZWRQcm92aWRlcnN9IGZvciBtb3JlIGluZm8uXG4gICAqL1xuICBzdGF0aWMgcmVzb2x2ZShwcm92aWRlcnM6IFByb3ZpZGVyW10pOiBSZXNvbHZlZFJlZmxlY3RpdmVQcm92aWRlcltdIHtcbiAgICByZXR1cm4gcmVzb2x2ZVJlZmxlY3RpdmVQcm92aWRlcnMocHJvdmlkZXJzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXNvbHZlcyBhbiBhcnJheSBvZiBwcm92aWRlcnMgYW5kIGNyZWF0ZXMgYW4gaW5qZWN0b3IgZnJvbSB0aG9zZSBwcm92aWRlcnMuXG4gICAqXG4gICAqIFRoZSBwYXNzZWQtaW4gcHJvdmlkZXJzIGNhbiBiZSBhbiBhcnJheSBvZiBgVHlwZWAsIHtAbGluayBQcm92aWRlcn0sXG4gICAqIG9yIGEgcmVjdXJzaXZlIGFycmF5IG9mIG1vcmUgcHJvdmlkZXJzLlxuICAgKlxuICAgKiAjIyMgRXhhbXBsZSAoW2xpdmUgZGVtb10oaHR0cDovL3BsbmtyLmNvL2VkaXQvZVBPY2NBP3A9cHJldmlldykpXG4gICAqXG4gICAqIGBgYHR5cGVzY3JpcHRcbiAgICogQEluamVjdGFibGUoKVxuICAgKiBjbGFzcyBFbmdpbmUge1xuICAgKiB9XG4gICAqXG4gICAqIEBJbmplY3RhYmxlKClcbiAgICogY2xhc3MgQ2FyIHtcbiAgICogICBjb25zdHJ1Y3RvcihwdWJsaWMgZW5naW5lOkVuZ2luZSkge31cbiAgICogfVxuICAgKlxuICAgKiB2YXIgaW5qZWN0b3IgPSBSZWZsZWN0aXZlSW5qZWN0b3IucmVzb2x2ZUFuZENyZWF0ZShbQ2FyLCBFbmdpbmVdKTtcbiAgICogZXhwZWN0KGluamVjdG9yLmdldChDYXIpIGluc3RhbmNlb2YgQ2FyKS50b0JlKHRydWUpO1xuICAgKiBgYGBcbiAgICpcbiAgICogVGhpcyBmdW5jdGlvbiBpcyBzbG93ZXIgdGhhbiB0aGUgY29ycmVzcG9uZGluZyBgZnJvbVJlc29sdmVkUHJvdmlkZXJzYFxuICAgKiBiZWNhdXNlIGl0IG5lZWRzIHRvIHJlc29sdmUgdGhlIHBhc3NlZC1pbiBwcm92aWRlcnMgZmlyc3QuXG4gICAqIFNlZSB7QGxpbmsgUmVmbGVjdGl2ZUluamVjdG9yI3Jlc29sdmUgcmVzb2x2ZX0gYW5kXG4gICAqIHtAbGluayBSZWZsZWN0aXZlSW5qZWN0b3IjZnJvbVJlc29sdmVkUHJvdmlkZXJzIGZyb21SZXNvbHZlZFByb3ZpZGVyc30uXG4gICAqL1xuICBzdGF0aWMgcmVzb2x2ZUFuZENyZWF0ZShwcm92aWRlcnM6IFByb3ZpZGVyW10sIHBhcmVudD86IEluamVjdG9yKTogUmVmbGVjdGl2ZUluamVjdG9yIHtcbiAgICBjb25zdCBSZXNvbHZlZFJlZmxlY3RpdmVQcm92aWRlcnMgPSBSZWZsZWN0aXZlSW5qZWN0b3IucmVzb2x2ZShwcm92aWRlcnMpO1xuICAgIHJldHVybiBSZWZsZWN0aXZlSW5qZWN0b3IuZnJvbVJlc29sdmVkUHJvdmlkZXJzKFJlc29sdmVkUmVmbGVjdGl2ZVByb3ZpZGVycywgcGFyZW50KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGFuIGluamVjdG9yIGZyb20gcHJldmlvdXNseSByZXNvbHZlZCBwcm92aWRlcnMuXG4gICAqXG4gICAqIFRoaXMgQVBJIGlzIHRoZSByZWNvbW1lbmRlZCB3YXkgdG8gY29uc3RydWN0IGluamVjdG9ycyBpbiBwZXJmb3JtYW5jZS1zZW5zaXRpdmUgcGFydHMuXG4gICAqXG4gICAqICMjIyBFeGFtcGxlIChbbGl2ZSBkZW1vXShodHRwOi8vcGxua3IuY28vZWRpdC9LclNNY2k/cD1wcmV2aWV3KSlcbiAgICpcbiAgICogYGBgdHlwZXNjcmlwdFxuICAgKiBASW5qZWN0YWJsZSgpXG4gICAqIGNsYXNzIEVuZ2luZSB7XG4gICAqIH1cbiAgICpcbiAgICogQEluamVjdGFibGUoKVxuICAgKiBjbGFzcyBDYXIge1xuICAgKiAgIGNvbnN0cnVjdG9yKHB1YmxpYyBlbmdpbmU6RW5naW5lKSB7fVxuICAgKiB9XG4gICAqXG4gICAqIHZhciBwcm92aWRlcnMgPSBSZWZsZWN0aXZlSW5qZWN0b3IucmVzb2x2ZShbQ2FyLCBFbmdpbmVdKTtcbiAgICogdmFyIGluamVjdG9yID0gUmVmbGVjdGl2ZUluamVjdG9yLmZyb21SZXNvbHZlZFByb3ZpZGVycyhwcm92aWRlcnMpO1xuICAgKiBleHBlY3QoaW5qZWN0b3IuZ2V0KENhcikgaW5zdGFuY2VvZiBDYXIpLnRvQmUodHJ1ZSk7XG4gICAqIGBgYFxuICAgKiBAZXhwZXJpbWVudGFsXG4gICAqL1xuICBzdGF0aWMgZnJvbVJlc29sdmVkUHJvdmlkZXJzKHByb3ZpZGVyczogUmVzb2x2ZWRSZWZsZWN0aXZlUHJvdmlkZXJbXSwgcGFyZW50PzogSW5qZWN0b3IpOlxuICAgICAgUmVmbGVjdGl2ZUluamVjdG9yIHtcbiAgICByZXR1cm4gbmV3IFJlZmxlY3RpdmVJbmplY3Rvcl8ocHJvdmlkZXJzLCBwYXJlbnQpO1xuICB9XG5cblxuICAvKipcbiAgICogUGFyZW50IG9mIHRoaXMgaW5qZWN0b3IuXG4gICAqXG4gICAqIDwhLS0gVE9ETzogQWRkIGEgbGluayB0byB0aGUgc2VjdGlvbiBvZiB0aGUgdXNlciBndWlkZSB0YWxraW5nIGFib3V0IGhpZXJhcmNoaWNhbCBpbmplY3Rpb24uXG4gICAqIC0tPlxuICAgKlxuICAgKiAjIyMgRXhhbXBsZSAoW2xpdmUgZGVtb10oaHR0cDovL3BsbmtyLmNvL2VkaXQvZW9zTUdvP3A9cHJldmlldykpXG4gICAqXG4gICAqIGBgYHR5cGVzY3JpcHRcbiAgICogdmFyIHBhcmVudCA9IFJlZmxlY3RpdmVJbmplY3Rvci5yZXNvbHZlQW5kQ3JlYXRlKFtdKTtcbiAgICogdmFyIGNoaWxkID0gcGFyZW50LnJlc29sdmVBbmRDcmVhdGVDaGlsZChbXSk7XG4gICAqIGV4cGVjdChjaGlsZC5wYXJlbnQpLnRvQmUocGFyZW50KTtcbiAgICogYGBgXG4gICAqL1xuICBhYnN0cmFjdCBnZXQgcGFyZW50KCk6IEluamVjdG9yfG51bGw7XG5cbiAgLyoqXG4gICAqIFJlc29sdmVzIGFuIGFycmF5IG9mIHByb3ZpZGVycyBhbmQgY3JlYXRlcyBhIGNoaWxkIGluamVjdG9yIGZyb20gdGhvc2UgcHJvdmlkZXJzLlxuICAgKlxuICAgKiA8IS0tIFRPRE86IEFkZCBhIGxpbmsgdG8gdGhlIHNlY3Rpb24gb2YgdGhlIHVzZXIgZ3VpZGUgdGFsa2luZyBhYm91dCBoaWVyYXJjaGljYWwgaW5qZWN0aW9uLlxuICAgKiAtLT5cbiAgICpcbiAgICogVGhlIHBhc3NlZC1pbiBwcm92aWRlcnMgY2FuIGJlIGFuIGFycmF5IG9mIGBUeXBlYCwge0BsaW5rIFByb3ZpZGVyfSxcbiAgICogb3IgYSByZWN1cnNpdmUgYXJyYXkgb2YgbW9yZSBwcm92aWRlcnMuXG4gICAqXG4gICAqICMjIyBFeGFtcGxlIChbbGl2ZSBkZW1vXShodHRwOi8vcGxua3IuY28vZWRpdC9vcEIzVDQ/cD1wcmV2aWV3KSlcbiAgICpcbiAgICogYGBgdHlwZXNjcmlwdFxuICAgKiBjbGFzcyBQYXJlbnRQcm92aWRlciB7fVxuICAgKiBjbGFzcyBDaGlsZFByb3ZpZGVyIHt9XG4gICAqXG4gICAqIHZhciBwYXJlbnQgPSBSZWZsZWN0aXZlSW5qZWN0b3IucmVzb2x2ZUFuZENyZWF0ZShbUGFyZW50UHJvdmlkZXJdKTtcbiAgICogdmFyIGNoaWxkID0gcGFyZW50LnJlc29sdmVBbmRDcmVhdGVDaGlsZChbQ2hpbGRQcm92aWRlcl0pO1xuICAgKlxuICAgKiBleHBlY3QoY2hpbGQuZ2V0KFBhcmVudFByb3ZpZGVyKSBpbnN0YW5jZW9mIFBhcmVudFByb3ZpZGVyKS50b0JlKHRydWUpO1xuICAgKiBleHBlY3QoY2hpbGQuZ2V0KENoaWxkUHJvdmlkZXIpIGluc3RhbmNlb2YgQ2hpbGRQcm92aWRlcikudG9CZSh0cnVlKTtcbiAgICogZXhwZWN0KGNoaWxkLmdldChQYXJlbnRQcm92aWRlcikpLnRvQmUocGFyZW50LmdldChQYXJlbnRQcm92aWRlcikpO1xuICAgKiBgYGBcbiAgICpcbiAgICogVGhpcyBmdW5jdGlvbiBpcyBzbG93ZXIgdGhhbiB0aGUgY29ycmVzcG9uZGluZyBgY3JlYXRlQ2hpbGRGcm9tUmVzb2x2ZWRgXG4gICAqIGJlY2F1c2UgaXQgbmVlZHMgdG8gcmVzb2x2ZSB0aGUgcGFzc2VkLWluIHByb3ZpZGVycyBmaXJzdC5cbiAgICogU2VlIHtAbGluayBSZWZsZWN0aXZlSW5qZWN0b3IjcmVzb2x2ZSByZXNvbHZlfSBhbmRcbiAgICoge0BsaW5rIFJlZmxlY3RpdmVJbmplY3RvciNjcmVhdGVDaGlsZEZyb21SZXNvbHZlZCBjcmVhdGVDaGlsZEZyb21SZXNvbHZlZH0uXG4gICAqL1xuICBhYnN0cmFjdCByZXNvbHZlQW5kQ3JlYXRlQ2hpbGQocHJvdmlkZXJzOiBQcm92aWRlcltdKTogUmVmbGVjdGl2ZUluamVjdG9yO1xuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgY2hpbGQgaW5qZWN0b3IgZnJvbSBwcmV2aW91c2x5IHJlc29sdmVkIHByb3ZpZGVycy5cbiAgICpcbiAgICogPCEtLSBUT0RPOiBBZGQgYSBsaW5rIHRvIHRoZSBzZWN0aW9uIG9mIHRoZSB1c2VyIGd1aWRlIHRhbGtpbmcgYWJvdXQgaGllcmFyY2hpY2FsIGluamVjdGlvbi5cbiAgICogLS0+XG4gICAqXG4gICAqIFRoaXMgQVBJIGlzIHRoZSByZWNvbW1lbmRlZCB3YXkgdG8gY29uc3RydWN0IGluamVjdG9ycyBpbiBwZXJmb3JtYW5jZS1zZW5zaXRpdmUgcGFydHMuXG4gICAqXG4gICAqICMjIyBFeGFtcGxlIChbbGl2ZSBkZW1vXShodHRwOi8vcGxua3IuY28vZWRpdC9WaHlmak4/cD1wcmV2aWV3KSlcbiAgICpcbiAgICogYGBgdHlwZXNjcmlwdFxuICAgKiBjbGFzcyBQYXJlbnRQcm92aWRlciB7fVxuICAgKiBjbGFzcyBDaGlsZFByb3ZpZGVyIHt9XG4gICAqXG4gICAqIHZhciBwYXJlbnRQcm92aWRlcnMgPSBSZWZsZWN0aXZlSW5qZWN0b3IucmVzb2x2ZShbUGFyZW50UHJvdmlkZXJdKTtcbiAgICogdmFyIGNoaWxkUHJvdmlkZXJzID0gUmVmbGVjdGl2ZUluamVjdG9yLnJlc29sdmUoW0NoaWxkUHJvdmlkZXJdKTtcbiAgICpcbiAgICogdmFyIHBhcmVudCA9IFJlZmxlY3RpdmVJbmplY3Rvci5mcm9tUmVzb2x2ZWRQcm92aWRlcnMocGFyZW50UHJvdmlkZXJzKTtcbiAgICogdmFyIGNoaWxkID0gcGFyZW50LmNyZWF0ZUNoaWxkRnJvbVJlc29sdmVkKGNoaWxkUHJvdmlkZXJzKTtcbiAgICpcbiAgICogZXhwZWN0KGNoaWxkLmdldChQYXJlbnRQcm92aWRlcikgaW5zdGFuY2VvZiBQYXJlbnRQcm92aWRlcikudG9CZSh0cnVlKTtcbiAgICogZXhwZWN0KGNoaWxkLmdldChDaGlsZFByb3ZpZGVyKSBpbnN0YW5jZW9mIENoaWxkUHJvdmlkZXIpLnRvQmUodHJ1ZSk7XG4gICAqIGV4cGVjdChjaGlsZC5nZXQoUGFyZW50UHJvdmlkZXIpKS50b0JlKHBhcmVudC5nZXQoUGFyZW50UHJvdmlkZXIpKTtcbiAgICogYGBgXG4gICAqL1xuICBhYnN0cmFjdCBjcmVhdGVDaGlsZEZyb21SZXNvbHZlZChwcm92aWRlcnM6IFJlc29sdmVkUmVmbGVjdGl2ZVByb3ZpZGVyW10pOiBSZWZsZWN0aXZlSW5qZWN0b3I7XG5cbiAgLyoqXG4gICAqIFJlc29sdmVzIGEgcHJvdmlkZXIgYW5kIGluc3RhbnRpYXRlcyBhbiBvYmplY3QgaW4gdGhlIGNvbnRleHQgb2YgdGhlIGluamVjdG9yLlxuICAgKlxuICAgKiBUaGUgY3JlYXRlZCBvYmplY3QgZG9lcyBub3QgZ2V0IGNhY2hlZCBieSB0aGUgaW5qZWN0b3IuXG4gICAqXG4gICAqICMjIyBFeGFtcGxlIChbbGl2ZSBkZW1vXShodHRwOi8vcGxua3IuY28vZWRpdC95dlZYb0I/cD1wcmV2aWV3KSlcbiAgICpcbiAgICogYGBgdHlwZXNjcmlwdFxuICAgKiBASW5qZWN0YWJsZSgpXG4gICAqIGNsYXNzIEVuZ2luZSB7XG4gICAqIH1cbiAgICpcbiAgICogQEluamVjdGFibGUoKVxuICAgKiBjbGFzcyBDYXIge1xuICAgKiAgIGNvbnN0cnVjdG9yKHB1YmxpYyBlbmdpbmU6RW5naW5lKSB7fVxuICAgKiB9XG4gICAqXG4gICAqIHZhciBpbmplY3RvciA9IFJlZmxlY3RpdmVJbmplY3Rvci5yZXNvbHZlQW5kQ3JlYXRlKFtFbmdpbmVdKTtcbiAgICpcbiAgICogdmFyIGNhciA9IGluamVjdG9yLnJlc29sdmVBbmRJbnN0YW50aWF0ZShDYXIpO1xuICAgKiBleHBlY3QoY2FyLmVuZ2luZSkudG9CZShpbmplY3Rvci5nZXQoRW5naW5lKSk7XG4gICAqIGV4cGVjdChjYXIpLm5vdC50b0JlKGluamVjdG9yLnJlc29sdmVBbmRJbnN0YW50aWF0ZShDYXIpKTtcbiAgICogYGBgXG4gICAqL1xuICBhYnN0cmFjdCByZXNvbHZlQW5kSW5zdGFudGlhdGUocHJvdmlkZXI6IFByb3ZpZGVyKTogYW55O1xuXG4gIC8qKlxuICAgKiBJbnN0YW50aWF0ZXMgYW4gb2JqZWN0IHVzaW5nIGEgcmVzb2x2ZWQgcHJvdmlkZXIgaW4gdGhlIGNvbnRleHQgb2YgdGhlIGluamVjdG9yLlxuICAgKlxuICAgKiBUaGUgY3JlYXRlZCBvYmplY3QgZG9lcyBub3QgZ2V0IGNhY2hlZCBieSB0aGUgaW5qZWN0b3IuXG4gICAqXG4gICAqICMjIyBFeGFtcGxlIChbbGl2ZSBkZW1vXShodHRwOi8vcGxua3IuY28vZWRpdC9wdENJbVE/cD1wcmV2aWV3KSlcbiAgICpcbiAgICogYGBgdHlwZXNjcmlwdFxuICAgKiBASW5qZWN0YWJsZSgpXG4gICAqIGNsYXNzIEVuZ2luZSB7XG4gICAqIH1cbiAgICpcbiAgICogQEluamVjdGFibGUoKVxuICAgKiBjbGFzcyBDYXIge1xuICAgKiAgIGNvbnN0cnVjdG9yKHB1YmxpYyBlbmdpbmU6RW5naW5lKSB7fVxuICAgKiB9XG4gICAqXG4gICAqIHZhciBpbmplY3RvciA9IFJlZmxlY3RpdmVJbmplY3Rvci5yZXNvbHZlQW5kQ3JlYXRlKFtFbmdpbmVdKTtcbiAgICogdmFyIGNhclByb3ZpZGVyID0gUmVmbGVjdGl2ZUluamVjdG9yLnJlc29sdmUoW0Nhcl0pWzBdO1xuICAgKiB2YXIgY2FyID0gaW5qZWN0b3IuaW5zdGFudGlhdGVSZXNvbHZlZChjYXJQcm92aWRlcik7XG4gICAqIGV4cGVjdChjYXIuZW5naW5lKS50b0JlKGluamVjdG9yLmdldChFbmdpbmUpKTtcbiAgICogZXhwZWN0KGNhcikubm90LnRvQmUoaW5qZWN0b3IuaW5zdGFudGlhdGVSZXNvbHZlZChjYXJQcm92aWRlcikpO1xuICAgKiBgYGBcbiAgICovXG4gIGFic3RyYWN0IGluc3RhbnRpYXRlUmVzb2x2ZWQocHJvdmlkZXI6IFJlc29sdmVkUmVmbGVjdGl2ZVByb3ZpZGVyKTogYW55O1xuXG4gIGFic3RyYWN0IGdldCh0b2tlbjogYW55LCBub3RGb3VuZFZhbHVlPzogYW55KTogYW55O1xufVxuXG5leHBvcnQgY2xhc3MgUmVmbGVjdGl2ZUluamVjdG9yXyBpbXBsZW1lbnRzIFJlZmxlY3RpdmVJbmplY3RvciB7XG4gIHByaXZhdGUgc3RhdGljIElOSkVDVE9SX0tFWSA9IFJlZmxlY3RpdmVLZXkuZ2V0KEluamVjdG9yKTtcbiAgLyoqIEBpbnRlcm5hbCAqL1xuICBfY29uc3RydWN0aW9uQ291bnRlcjogbnVtYmVyID0gMDtcbiAgLyoqIEBpbnRlcm5hbCAqL1xuICBwdWJsaWMgX3Byb3ZpZGVyczogUmVzb2x2ZWRSZWZsZWN0aXZlUHJvdmlkZXJbXTtcbiAgcHVibGljIHJlYWRvbmx5IHBhcmVudDogSW5qZWN0b3J8bnVsbDtcblxuICBrZXlJZHM6IG51bWJlcltdO1xuICBvYmpzOiBhbnlbXTtcbiAgLyoqXG4gICAqIFByaXZhdGVcbiAgICovXG4gIGNvbnN0cnVjdG9yKF9wcm92aWRlcnM6IFJlc29sdmVkUmVmbGVjdGl2ZVByb3ZpZGVyW10sIF9wYXJlbnQ/OiBJbmplY3Rvcikge1xuICAgIHRoaXMuX3Byb3ZpZGVycyA9IF9wcm92aWRlcnM7XG4gICAgdGhpcy5wYXJlbnQgPSBfcGFyZW50IHx8IG51bGw7XG5cbiAgICBjb25zdCBsZW4gPSBfcHJvdmlkZXJzLmxlbmd0aDtcblxuICAgIHRoaXMua2V5SWRzID0gbmV3IEFycmF5KGxlbik7XG4gICAgdGhpcy5vYmpzID0gbmV3IEFycmF5KGxlbik7XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICB0aGlzLmtleUlkc1tpXSA9IF9wcm92aWRlcnNbaV0ua2V5LmlkO1xuICAgICAgdGhpcy5vYmpzW2ldID0gVU5ERUZJTkVEO1xuICAgIH1cbiAgfVxuXG4gIGdldCh0b2tlbjogYW55LCBub3RGb3VuZFZhbHVlOiBhbnkgPSBUSFJPV19JRl9OT1RfRk9VTkQpOiBhbnkge1xuICAgIHJldHVybiB0aGlzLl9nZXRCeUtleShSZWZsZWN0aXZlS2V5LmdldCh0b2tlbiksIG51bGwsIG5vdEZvdW5kVmFsdWUpO1xuICB9XG5cbiAgcmVzb2x2ZUFuZENyZWF0ZUNoaWxkKHByb3ZpZGVyczogUHJvdmlkZXJbXSk6IFJlZmxlY3RpdmVJbmplY3RvciB7XG4gICAgY29uc3QgUmVzb2x2ZWRSZWZsZWN0aXZlUHJvdmlkZXJzID0gUmVmbGVjdGl2ZUluamVjdG9yLnJlc29sdmUocHJvdmlkZXJzKTtcbiAgICByZXR1cm4gdGhpcy5jcmVhdGVDaGlsZEZyb21SZXNvbHZlZChSZXNvbHZlZFJlZmxlY3RpdmVQcm92aWRlcnMpO1xuICB9XG5cbiAgY3JlYXRlQ2hpbGRGcm9tUmVzb2x2ZWQocHJvdmlkZXJzOiBSZXNvbHZlZFJlZmxlY3RpdmVQcm92aWRlcltdKTogUmVmbGVjdGl2ZUluamVjdG9yIHtcbiAgICBjb25zdCBpbmogPSBuZXcgUmVmbGVjdGl2ZUluamVjdG9yXyhwcm92aWRlcnMpO1xuICAgIChpbmogYXN7cGFyZW50OiBJbmplY3RvciB8IG51bGx9KS5wYXJlbnQgPSB0aGlzO1xuICAgIHJldHVybiBpbmo7XG4gIH1cblxuICByZXNvbHZlQW5kSW5zdGFudGlhdGUocHJvdmlkZXI6IFByb3ZpZGVyKTogYW55IHtcbiAgICByZXR1cm4gdGhpcy5pbnN0YW50aWF0ZVJlc29sdmVkKFJlZmxlY3RpdmVJbmplY3Rvci5yZXNvbHZlKFtwcm92aWRlcl0pWzBdKTtcbiAgfVxuXG4gIGluc3RhbnRpYXRlUmVzb2x2ZWQocHJvdmlkZXI6IFJlc29sdmVkUmVmbGVjdGl2ZVByb3ZpZGVyKTogYW55IHtcbiAgICByZXR1cm4gdGhpcy5faW5zdGFudGlhdGVQcm92aWRlcihwcm92aWRlcik7XG4gIH1cblxuICBnZXRQcm92aWRlckF0SW5kZXgoaW5kZXg6IG51bWJlcik6IFJlc29sdmVkUmVmbGVjdGl2ZVByb3ZpZGVyIHtcbiAgICBpZiAoaW5kZXggPCAwIHx8IGluZGV4ID49IHRoaXMuX3Byb3ZpZGVycy5sZW5ndGgpIHtcbiAgICAgIHRocm93IG91dE9mQm91bmRzRXJyb3IoaW5kZXgpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5fcHJvdmlkZXJzW2luZGV4XTtcbiAgfVxuXG4gIC8qKiBAaW50ZXJuYWwgKi9cbiAgX25ldyhwcm92aWRlcjogUmVzb2x2ZWRSZWZsZWN0aXZlUHJvdmlkZXIpOiBhbnkge1xuICAgIGlmICh0aGlzLl9jb25zdHJ1Y3Rpb25Db3VudGVyKysgPiB0aGlzLl9nZXRNYXhOdW1iZXJPZk9iamVjdHMoKSkge1xuICAgICAgdGhyb3cgY3ljbGljRGVwZW5kZW5jeUVycm9yKHRoaXMsIHByb3ZpZGVyLmtleSk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLl9pbnN0YW50aWF0ZVByb3ZpZGVyKHByb3ZpZGVyKTtcbiAgfVxuXG4gIHByaXZhdGUgX2dldE1heE51bWJlck9mT2JqZWN0cygpOiBudW1iZXIgeyByZXR1cm4gdGhpcy5vYmpzLmxlbmd0aDsgfVxuXG4gIHByaXZhdGUgX2luc3RhbnRpYXRlUHJvdmlkZXIocHJvdmlkZXI6IFJlc29sdmVkUmVmbGVjdGl2ZVByb3ZpZGVyKTogYW55IHtcbiAgICBpZiAocHJvdmlkZXIubXVsdGlQcm92aWRlcikge1xuICAgICAgY29uc3QgcmVzID0gbmV3IEFycmF5KHByb3ZpZGVyLnJlc29sdmVkRmFjdG9yaWVzLmxlbmd0aCk7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHByb3ZpZGVyLnJlc29sdmVkRmFjdG9yaWVzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgIHJlc1tpXSA9IHRoaXMuX2luc3RhbnRpYXRlKHByb3ZpZGVyLCBwcm92aWRlci5yZXNvbHZlZEZhY3Rvcmllc1tpXSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gcmVzO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gdGhpcy5faW5zdGFudGlhdGUocHJvdmlkZXIsIHByb3ZpZGVyLnJlc29sdmVkRmFjdG9yaWVzWzBdKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIF9pbnN0YW50aWF0ZShcbiAgICAgIHByb3ZpZGVyOiBSZXNvbHZlZFJlZmxlY3RpdmVQcm92aWRlcixcbiAgICAgIFJlc29sdmVkUmVmbGVjdGl2ZUZhY3Rvcnk6IFJlc29sdmVkUmVmbGVjdGl2ZUZhY3RvcnkpOiBhbnkge1xuICAgIGNvbnN0IGZhY3RvcnkgPSBSZXNvbHZlZFJlZmxlY3RpdmVGYWN0b3J5LmZhY3Rvcnk7XG5cbiAgICBsZXQgZGVwczogYW55W107XG4gICAgdHJ5IHtcbiAgICAgIGRlcHMgPVxuICAgICAgICAgIFJlc29sdmVkUmVmbGVjdGl2ZUZhY3RvcnkuZGVwZW5kZW5jaWVzLm1hcChkZXAgPT4gdGhpcy5fZ2V0QnlSZWZsZWN0aXZlRGVwZW5kZW5jeShkZXApKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBpZiAoZS5hZGRLZXkpIHtcbiAgICAgICAgZS5hZGRLZXkodGhpcywgcHJvdmlkZXIua2V5KTtcbiAgICAgIH1cbiAgICAgIHRocm93IGU7XG4gICAgfVxuXG4gICAgbGV0IG9iajogYW55O1xuICAgIHRyeSB7XG4gICAgICBvYmogPSBmYWN0b3J5KC4uLmRlcHMpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIHRocm93IGluc3RhbnRpYXRpb25FcnJvcih0aGlzLCBlLCBlLnN0YWNrLCBwcm92aWRlci5rZXkpO1xuICAgIH1cblxuICAgIHJldHVybiBvYmo7XG4gIH1cblxuICBwcml2YXRlIF9nZXRCeVJlZmxlY3RpdmVEZXBlbmRlbmN5KGRlcDogUmVmbGVjdGl2ZURlcGVuZGVuY3kpOiBhbnkge1xuICAgIHJldHVybiB0aGlzLl9nZXRCeUtleShkZXAua2V5LCBkZXAudmlzaWJpbGl0eSwgZGVwLm9wdGlvbmFsID8gbnVsbCA6IFRIUk9XX0lGX05PVF9GT1VORCk7XG4gIH1cblxuICBwcml2YXRlIF9nZXRCeUtleShrZXk6IFJlZmxlY3RpdmVLZXksIHZpc2liaWxpdHk6IFNlbGZ8U2tpcFNlbGZ8bnVsbCwgbm90Rm91bmRWYWx1ZTogYW55KTogYW55IHtcbiAgICBpZiAoa2V5ID09PSBSZWZsZWN0aXZlSW5qZWN0b3JfLklOSkVDVE9SX0tFWSkge1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgaWYgKHZpc2liaWxpdHkgaW5zdGFuY2VvZiBTZWxmKSB7XG4gICAgICByZXR1cm4gdGhpcy5fZ2V0QnlLZXlTZWxmKGtleSwgbm90Rm91bmRWYWx1ZSk7XG5cbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHRoaXMuX2dldEJ5S2V5RGVmYXVsdChrZXksIG5vdEZvdW5kVmFsdWUsIHZpc2liaWxpdHkpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgX2dldE9iakJ5S2V5SWQoa2V5SWQ6IG51bWJlcik6IGFueSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLmtleUlkcy5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKHRoaXMua2V5SWRzW2ldID09PSBrZXlJZCkge1xuICAgICAgICBpZiAodGhpcy5vYmpzW2ldID09PSBVTkRFRklORUQpIHtcbiAgICAgICAgICB0aGlzLm9ianNbaV0gPSB0aGlzLl9uZXcodGhpcy5fcHJvdmlkZXJzW2ldKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzLm9ianNbaV07XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIFVOREVGSU5FRDtcbiAgfVxuXG4gIC8qKiBAaW50ZXJuYWwgKi9cbiAgX3Rocm93T3JOdWxsKGtleTogUmVmbGVjdGl2ZUtleSwgbm90Rm91bmRWYWx1ZTogYW55KTogYW55IHtcbiAgICBpZiAobm90Rm91bmRWYWx1ZSAhPT0gVEhST1dfSUZfTk9UX0ZPVU5EKSB7XG4gICAgICByZXR1cm4gbm90Rm91bmRWYWx1ZTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgbm9Qcm92aWRlckVycm9yKHRoaXMsIGtleSk7XG4gICAgfVxuICB9XG5cbiAgLyoqIEBpbnRlcm5hbCAqL1xuICBfZ2V0QnlLZXlTZWxmKGtleTogUmVmbGVjdGl2ZUtleSwgbm90Rm91bmRWYWx1ZTogYW55KTogYW55IHtcbiAgICBjb25zdCBvYmogPSB0aGlzLl9nZXRPYmpCeUtleUlkKGtleS5pZCk7XG4gICAgcmV0dXJuIChvYmogIT09IFVOREVGSU5FRCkgPyBvYmogOiB0aGlzLl90aHJvd09yTnVsbChrZXksIG5vdEZvdW5kVmFsdWUpO1xuICB9XG5cbiAgLyoqIEBpbnRlcm5hbCAqL1xuICBfZ2V0QnlLZXlEZWZhdWx0KGtleTogUmVmbGVjdGl2ZUtleSwgbm90Rm91bmRWYWx1ZTogYW55LCB2aXNpYmlsaXR5OiBTZWxmfFNraXBTZWxmfG51bGwpOiBhbnkge1xuICAgIGxldCBpbmo6IEluamVjdG9yfG51bGw7XG5cbiAgICBpZiAodmlzaWJpbGl0eSBpbnN0YW5jZW9mIFNraXBTZWxmKSB7XG4gICAgICBpbmogPSB0aGlzLnBhcmVudDtcbiAgICB9IGVsc2Uge1xuICAgICAgaW5qID0gdGhpcztcbiAgICB9XG5cbiAgICB3aGlsZSAoaW5qIGluc3RhbmNlb2YgUmVmbGVjdGl2ZUluamVjdG9yXykge1xuICAgICAgY29uc3QgaW5qXyA9IDxSZWZsZWN0aXZlSW5qZWN0b3JfPmluajtcbiAgICAgIGNvbnN0IG9iaiA9IGlual8uX2dldE9iakJ5S2V5SWQoa2V5LmlkKTtcbiAgICAgIGlmIChvYmogIT09IFVOREVGSU5FRCkgcmV0dXJuIG9iajtcbiAgICAgIGluaiA9IGlual8ucGFyZW50O1xuICAgIH1cbiAgICBpZiAoaW5qICE9PSBudWxsKSB7XG4gICAgICByZXR1cm4gaW5qLmdldChrZXkudG9rZW4sIG5vdEZvdW5kVmFsdWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gdGhpcy5fdGhyb3dPck51bGwoa2V5LCBub3RGb3VuZFZhbHVlKTtcbiAgICB9XG4gIH1cblxuICBnZXQgZGlzcGxheU5hbWUoKTogc3RyaW5nIHtcbiAgICBjb25zdCBwcm92aWRlcnMgPVxuICAgICAgICBfbWFwUHJvdmlkZXJzKHRoaXMsIChiOiBSZXNvbHZlZFJlZmxlY3RpdmVQcm92aWRlcikgPT4gJyBcIicgKyBiLmtleS5kaXNwbGF5TmFtZSArICdcIiAnKVxuICAgICAgICAgICAgLmpvaW4oJywgJyk7XG4gICAgcmV0dXJuIGBSZWZsZWN0aXZlSW5qZWN0b3IocHJvdmlkZXJzOiBbJHtwcm92aWRlcnN9XSlgO1xuICB9XG5cbiAgdG9TdHJpbmcoKTogc3RyaW5nIHsgcmV0dXJuIHRoaXMuZGlzcGxheU5hbWU7IH1cbn1cblxuZnVuY3Rpb24gX21hcFByb3ZpZGVycyhpbmplY3RvcjogUmVmbGVjdGl2ZUluamVjdG9yXywgZm46IEZ1bmN0aW9uKTogYW55W10ge1xuICBjb25zdCByZXM6IGFueVtdID0gbmV3IEFycmF5KGluamVjdG9yLl9wcm92aWRlcnMubGVuZ3RoKTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBpbmplY3Rvci5fcHJvdmlkZXJzLmxlbmd0aDsgKytpKSB7XG4gICAgcmVzW2ldID0gZm4oaW5qZWN0b3IuZ2V0UHJvdmlkZXJBdEluZGV4KGkpKTtcbiAgfVxuICByZXR1cm4gcmVzO1xufVxuIl19