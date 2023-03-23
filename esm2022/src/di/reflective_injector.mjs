/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Injector } from './injector';
import { THROW_IF_NOT_FOUND } from './injector_compatibility';
import { Self, SkipSelf } from './metadata';
import { cyclicDependencyError, instantiationError, noProviderError, outOfBoundsError } from './reflective_errors';
import { ReflectiveKey } from './reflective_key';
import { resolveReflectiveProviders } from './reflective_provider';
// Threshold for the dynamic version
const UNDEFINED = {};
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
 * TODO: delete in v14.
 *
 * @deprecated from v5 - slow and brings in a lot of code, Use `Injector.create` instead.
 * @publicApi
 */
export class ReflectiveInjector {
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
    static resolve(providers) {
        return resolveReflectiveProviders(providers);
    }
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
    static resolveAndCreate(providers, parent) {
        const ResolvedReflectiveProviders = ReflectiveInjector.resolve(providers);
        return ReflectiveInjector.fromResolvedProviders(ResolvedReflectiveProviders, parent);
    }
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
     */
    static fromResolvedProviders(providers, parent) {
        return new ReflectiveInjector_(providers, parent);
    }
}
class ReflectiveInjector_ {
    static { this.INJECTOR_KEY = ( /* @__PURE__ */ReflectiveKey.get(Injector)); }
    /**
     * Private
     */
    constructor(_providers, _parent) {
        /** @internal */
        this._constructionCounter = 0;
        this._providers = _providers;
        this.parent = _parent || null;
        const len = _providers.length;
        this.keyIds = [];
        this.objs = [];
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
    _getMaxNumberOfObjects() {
        return this.objs.length;
    }
    _instantiateProvider(provider) {
        if (provider.multiProvider) {
            const res = [];
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
    toString() {
        return this.displayName;
    }
}
export { ReflectiveInjector_ };
function _mapProviders(injector, fn) {
    const res = [];
    for (let i = 0; i < injector._providers.length; ++i) {
        res[i] = fn(injector.getProviderAtIndex(i));
    }
    return res;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVmbGVjdGl2ZV9pbmplY3Rvci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL2RpL3JlZmxlY3RpdmVfaW5qZWN0b3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLFFBQVEsRUFBQyxNQUFNLFlBQVksQ0FBQztBQUNwQyxPQUFPLEVBQUMsa0JBQWtCLEVBQUMsTUFBTSwwQkFBMEIsQ0FBQztBQUU1RCxPQUFPLEVBQUMsSUFBSSxFQUFFLFFBQVEsRUFBQyxNQUFNLFlBQVksQ0FBQztBQUMxQyxPQUFPLEVBQUMscUJBQXFCLEVBQUUsa0JBQWtCLEVBQUUsZUFBZSxFQUFFLGdCQUFnQixFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFDakgsT0FBTyxFQUFDLGFBQWEsRUFBQyxNQUFNLGtCQUFrQixDQUFDO0FBQy9DLE9BQU8sRUFBOEUsMEJBQTBCLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUc5SSxvQ0FBb0M7QUFDcEMsTUFBTSxTQUFTLEdBQUcsRUFBRSxDQUFDO0FBRXJCOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztHQXNDRztBQUNILE1BQU0sT0FBZ0Isa0JBQWtCO0lBQ3RDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztPQWdDRztJQUNILE1BQU0sQ0FBQyxPQUFPLENBQUMsU0FBcUI7UUFDbEMsT0FBTywwQkFBMEIsQ0FBQyxTQUFTLENBQUMsQ0FBQztJQUMvQyxDQUFDO0lBRUQ7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7T0FzQkc7SUFDSCxNQUFNLENBQUMsZ0JBQWdCLENBQUMsU0FBcUIsRUFBRSxNQUFpQjtRQUM5RCxNQUFNLDJCQUEyQixHQUFHLGtCQUFrQixDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUMxRSxPQUFPLGtCQUFrQixDQUFDLHFCQUFxQixDQUFDLDJCQUEyQixF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QyxDQUFDO1lBQ3hDLElBQUksR0FBRyxLQUFLLFNBQVM7Z0JBQUUsT0FBTyxHQUFHLENBQUM7WUFDbEMsR0FBRyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUM7U0FDbkI7UUFDRCxJQUFJLEdBQUcsS0FBSyxJQUFJLEVBQUU7WUFDaEIsT0FBTyxHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUUsYUFBYSxDQUFDLENBQUM7U0FDMUM7YUFBTTtZQUNMLE9BQU8sSUFBSSxDQUFDLFlBQVksQ0FBQyxHQUFHLEVBQUUsYUFBYSxDQUFDLENBQUM7U0FDOUM7SUFDSCxDQUFDO0lBRUQsSUFBSSxXQUFXO1FBQ2IsTUFBTSxTQUFTLEdBQ1gsYUFBYSxDQUFDLElBQUksRUFBRSxDQUFDLENBQTZCLEVBQUUsRUFBRSxDQUFDLElBQUksR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUM7YUFDbEYsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3BCLE9BQU8sa0NBQWtDLFNBQVMsSUFBSSxDQUFDO0lBQ3pELENBQUM7SUFFRCxRQUFRO1FBQ04sT0FBTyxJQUFJLENBQUMsV0FBVyxDQUFDO0lBQzFCLENBQUM7O1NBMUxVLG1CQUFtQjtBQTZMaEMsU0FBUyxhQUFhLENBQUMsUUFBNkIsRUFBRSxFQUFZO0lBQ2hFLE1BQU0sR0FBRyxHQUFVLEVBQUUsQ0FBQztJQUN0QixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsUUFBUSxDQUFDLFVBQVUsQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLEVBQUU7UUFDbkQsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxRQUFRLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztLQUM3QztJQUNELE9BQU8sR0FBRyxDQUFDO0FBQ2IsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0luamVjdG9yfSBmcm9tICcuL2luamVjdG9yJztcbmltcG9ydCB7VEhST1dfSUZfTk9UX0ZPVU5EfSBmcm9tICcuL2luamVjdG9yX2NvbXBhdGliaWxpdHknO1xuaW1wb3J0IHtQcm92aWRlcn0gZnJvbSAnLi9pbnRlcmZhY2UvcHJvdmlkZXInO1xuaW1wb3J0IHtTZWxmLCBTa2lwU2VsZn0gZnJvbSAnLi9tZXRhZGF0YSc7XG5pbXBvcnQge2N5Y2xpY0RlcGVuZGVuY3lFcnJvciwgaW5zdGFudGlhdGlvbkVycm9yLCBub1Byb3ZpZGVyRXJyb3IsIG91dE9mQm91bmRzRXJyb3J9IGZyb20gJy4vcmVmbGVjdGl2ZV9lcnJvcnMnO1xuaW1wb3J0IHtSZWZsZWN0aXZlS2V5fSBmcm9tICcuL3JlZmxlY3RpdmVfa2V5JztcbmltcG9ydCB7UmVmbGVjdGl2ZURlcGVuZGVuY3ksIFJlc29sdmVkUmVmbGVjdGl2ZUZhY3RvcnksIFJlc29sdmVkUmVmbGVjdGl2ZVByb3ZpZGVyLCByZXNvbHZlUmVmbGVjdGl2ZVByb3ZpZGVyc30gZnJvbSAnLi9yZWZsZWN0aXZlX3Byb3ZpZGVyJztcblxuXG4vLyBUaHJlc2hvbGQgZm9yIHRoZSBkeW5hbWljIHZlcnNpb25cbmNvbnN0IFVOREVGSU5FRCA9IHt9O1xuXG4vKipcbiAqIEEgUmVmbGVjdGl2ZURlcGVuZGVuY3kgaW5qZWN0aW9uIGNvbnRhaW5lciB1c2VkIGZvciBpbnN0YW50aWF0aW5nIG9iamVjdHMgYW5kIHJlc29sdmluZ1xuICogZGVwZW5kZW5jaWVzLlxuICpcbiAqIEFuIGBJbmplY3RvcmAgaXMgYSByZXBsYWNlbWVudCBmb3IgYSBgbmV3YCBvcGVyYXRvciwgd2hpY2ggY2FuIGF1dG9tYXRpY2FsbHkgcmVzb2x2ZSB0aGVcbiAqIGNvbnN0cnVjdG9yIGRlcGVuZGVuY2llcy5cbiAqXG4gKiBJbiB0eXBpY2FsIHVzZSwgYXBwbGljYXRpb24gY29kZSBhc2tzIGZvciB0aGUgZGVwZW5kZW5jaWVzIGluIHRoZSBjb25zdHJ1Y3RvciBhbmQgdGhleSBhcmVcbiAqIHJlc29sdmVkIGJ5IHRoZSBgSW5qZWN0b3JgLlxuICpcbiAqIEB1c2FnZU5vdGVzXG4gKiAjIyMgRXhhbXBsZVxuICpcbiAqIFRoZSBmb2xsb3dpbmcgZXhhbXBsZSBjcmVhdGVzIGFuIGBJbmplY3RvcmAgY29uZmlndXJlZCB0byBjcmVhdGUgYEVuZ2luZWAgYW5kIGBDYXJgLlxuICpcbiAqIGBgYHR5cGVzY3JpcHRcbiAqIEBJbmplY3RhYmxlKClcbiAqIGNsYXNzIEVuZ2luZSB7XG4gKiB9XG4gKlxuICogQEluamVjdGFibGUoKVxuICogY2xhc3MgQ2FyIHtcbiAqICAgY29uc3RydWN0b3IocHVibGljIGVuZ2luZTpFbmdpbmUpIHt9XG4gKiB9XG4gKlxuICogdmFyIGluamVjdG9yID0gUmVmbGVjdGl2ZUluamVjdG9yLnJlc29sdmVBbmRDcmVhdGUoW0NhciwgRW5naW5lXSk7XG4gKiB2YXIgY2FyID0gaW5qZWN0b3IuZ2V0KENhcik7XG4gKiBleHBlY3QoY2FyIGluc3RhbmNlb2YgQ2FyKS50b0JlKHRydWUpO1xuICogZXhwZWN0KGNhci5lbmdpbmUgaW5zdGFuY2VvZiBFbmdpbmUpLnRvQmUodHJ1ZSk7XG4gKiBgYGBcbiAqXG4gKiBOb3RpY2UsIHdlIGRvbid0IHVzZSB0aGUgYG5ld2Agb3BlcmF0b3IgYmVjYXVzZSB3ZSBleHBsaWNpdGx5IHdhbnQgdG8gaGF2ZSB0aGUgYEluamVjdG9yYFxuICogcmVzb2x2ZSBhbGwgb2YgdGhlIG9iamVjdCdzIGRlcGVuZGVuY2llcyBhdXRvbWF0aWNhbGx5LlxuICpcbiAqIFRPRE86IGRlbGV0ZSBpbiB2MTQuXG4gKlxuICogQGRlcHJlY2F0ZWQgZnJvbSB2NSAtIHNsb3cgYW5kIGJyaW5ncyBpbiBhIGxvdCBvZiBjb2RlLCBVc2UgYEluamVjdG9yLmNyZWF0ZWAgaW5zdGVhZC5cbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGFic3RyYWN0IGNsYXNzIFJlZmxlY3RpdmVJbmplY3RvciBpbXBsZW1lbnRzIEluamVjdG9yIHtcbiAgLyoqXG4gICAqIFR1cm5zIGFuIGFycmF5IG9mIHByb3ZpZGVyIGRlZmluaXRpb25zIGludG8gYW4gYXJyYXkgb2YgcmVzb2x2ZWQgcHJvdmlkZXJzLlxuICAgKlxuICAgKiBBIHJlc29sdXRpb24gaXMgYSBwcm9jZXNzIG9mIGZsYXR0ZW5pbmcgbXVsdGlwbGUgbmVzdGVkIGFycmF5cyBhbmQgY29udmVydGluZyBpbmRpdmlkdWFsXG4gICAqIHByb3ZpZGVycyBpbnRvIGFuIGFycmF5IG9mIGBSZXNvbHZlZFJlZmxlY3RpdmVQcm92aWRlcmBzLlxuICAgKlxuICAgKiBAdXNhZ2VOb3Rlc1xuICAgKiAjIyMgRXhhbXBsZVxuICAgKlxuICAgKiBgYGB0eXBlc2NyaXB0XG4gICAqIEBJbmplY3RhYmxlKClcbiAgICogY2xhc3MgRW5naW5lIHtcbiAgICogfVxuICAgKlxuICAgKiBASW5qZWN0YWJsZSgpXG4gICAqIGNsYXNzIENhciB7XG4gICAqICAgY29uc3RydWN0b3IocHVibGljIGVuZ2luZTpFbmdpbmUpIHt9XG4gICAqIH1cbiAgICpcbiAgICogdmFyIHByb3ZpZGVycyA9IFJlZmxlY3RpdmVJbmplY3Rvci5yZXNvbHZlKFtDYXIsIFtbRW5naW5lXV1dKTtcbiAgICpcbiAgICogZXhwZWN0KHByb3ZpZGVycy5sZW5ndGgpLnRvRXF1YWwoMik7XG4gICAqXG4gICAqIGV4cGVjdChwcm92aWRlcnNbMF0gaW5zdGFuY2VvZiBSZXNvbHZlZFJlZmxlY3RpdmVQcm92aWRlcikudG9CZSh0cnVlKTtcbiAgICogZXhwZWN0KHByb3ZpZGVyc1swXS5rZXkuZGlzcGxheU5hbWUpLnRvQmUoXCJDYXJcIik7XG4gICAqIGV4cGVjdChwcm92aWRlcnNbMF0uZGVwZW5kZW5jaWVzLmxlbmd0aCkudG9FcXVhbCgxKTtcbiAgICogZXhwZWN0KHByb3ZpZGVyc1swXS5mYWN0b3J5KS50b0JlRGVmaW5lZCgpO1xuICAgKlxuICAgKiBleHBlY3QocHJvdmlkZXJzWzFdLmtleS5kaXNwbGF5TmFtZSkudG9CZShcIkVuZ2luZVwiKTtcbiAgICogfSk7XG4gICAqIGBgYFxuICAgKlxuICAgKi9cbiAgc3RhdGljIHJlc29sdmUocHJvdmlkZXJzOiBQcm92aWRlcltdKTogUmVzb2x2ZWRSZWZsZWN0aXZlUHJvdmlkZXJbXSB7XG4gICAgcmV0dXJuIHJlc29sdmVSZWZsZWN0aXZlUHJvdmlkZXJzKHByb3ZpZGVycyk7XG4gIH1cblxuICAvKipcbiAgICogUmVzb2x2ZXMgYW4gYXJyYXkgb2YgcHJvdmlkZXJzIGFuZCBjcmVhdGVzIGFuIGluamVjdG9yIGZyb20gdGhvc2UgcHJvdmlkZXJzLlxuICAgKlxuICAgKiBUaGUgcGFzc2VkLWluIHByb3ZpZGVycyBjYW4gYmUgYW4gYXJyYXkgb2YgYFR5cGVgLCBgUHJvdmlkZXJgLFxuICAgKiBvciBhIHJlY3Vyc2l2ZSBhcnJheSBvZiBtb3JlIHByb3ZpZGVycy5cbiAgICpcbiAgICogQHVzYWdlTm90ZXNcbiAgICogIyMjIEV4YW1wbGVcbiAgICpcbiAgICogYGBgdHlwZXNjcmlwdFxuICAgKiBASW5qZWN0YWJsZSgpXG4gICAqIGNsYXNzIEVuZ2luZSB7XG4gICAqIH1cbiAgICpcbiAgICogQEluamVjdGFibGUoKVxuICAgKiBjbGFzcyBDYXIge1xuICAgKiAgIGNvbnN0cnVjdG9yKHB1YmxpYyBlbmdpbmU6RW5naW5lKSB7fVxuICAgKiB9XG4gICAqXG4gICAqIHZhciBpbmplY3RvciA9IFJlZmxlY3RpdmVJbmplY3Rvci5yZXNvbHZlQW5kQ3JlYXRlKFtDYXIsIEVuZ2luZV0pO1xuICAgKiBleHBlY3QoaW5qZWN0b3IuZ2V0KENhcikgaW5zdGFuY2VvZiBDYXIpLnRvQmUodHJ1ZSk7XG4gICAqIGBgYFxuICAgKi9cbiAgc3RhdGljIHJlc29sdmVBbmRDcmVhdGUocHJvdmlkZXJzOiBQcm92aWRlcltdLCBwYXJlbnQ/OiBJbmplY3Rvcik6IFJlZmxlY3RpdmVJbmplY3RvciB7XG4gICAgY29uc3QgUmVzb2x2ZWRSZWZsZWN0aXZlUHJvdmlkZXJzID0gUmVmbGVjdGl2ZUluamVjdG9yLnJlc29sdmUocHJvdmlkZXJzKTtcbiAgICByZXR1cm4gUmVmbGVjdGl2ZUluamVjdG9yLmZyb21SZXNvbHZlZFByb3ZpZGVycyhSZXNvbHZlZFJlZmxlY3RpdmVQcm92aWRlcnMsIHBhcmVudCk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhbiBpbmplY3RvciBmcm9tIHByZXZpb3VzbHkgcmVzb2x2ZWQgcHJvdmlkZXJzLlxuICAgKlxuICAgKiBUaGlzIEFQSSBpcyB0aGUgcmVjb21tZW5kZWQgd2F5IHRvIGNvbnN0cnVjdCBpbmplY3RvcnMgaW4gcGVyZm9ybWFuY2Utc2Vuc2l0aXZlIHBhcnRzLlxuICAgKlxuICAgKiBAdXNhZ2VOb3Rlc1xuICAgKiAjIyMgRXhhbXBsZVxuICAgKlxuICAgKiBgYGB0eXBlc2NyaXB0XG4gICAqIEBJbmplY3RhYmxlKClcbiAgICogY2xhc3MgRW5naW5lIHtcbiAgICogfVxuICAgKlxuICAgKiBASW5qZWN0YWJsZSgpXG4gICAqIGNsYXNzIENhciB7XG4gICAqICAgY29uc3RydWN0b3IocHVibGljIGVuZ2luZTpFbmdpbmUpIHt9XG4gICAqIH1cbiAgICpcbiAgICogdmFyIHByb3ZpZGVycyA9IFJlZmxlY3RpdmVJbmplY3Rvci5yZXNvbHZlKFtDYXIsIEVuZ2luZV0pO1xuICAgKiB2YXIgaW5qZWN0b3IgPSBSZWZsZWN0aXZlSW5qZWN0b3IuZnJvbVJlc29sdmVkUHJvdmlkZXJzKHByb3ZpZGVycyk7XG4gICAqIGV4cGVjdChpbmplY3Rvci5nZXQoQ2FyKSBpbnN0YW5jZW9mIENhcikudG9CZSh0cnVlKTtcbiAgICogYGBgXG4gICAqL1xuICBzdGF0aWMgZnJvbVJlc29sdmVkUHJvdmlkZXJzKHByb3ZpZGVyczogUmVzb2x2ZWRSZWZsZWN0aXZlUHJvdmlkZXJbXSwgcGFyZW50PzogSW5qZWN0b3IpOlxuICAgICAgUmVmbGVjdGl2ZUluamVjdG9yIHtcbiAgICByZXR1cm4gbmV3IFJlZmxlY3RpdmVJbmplY3Rvcl8ocHJvdmlkZXJzLCBwYXJlbnQpO1xuICB9XG5cblxuICAvKipcbiAgICogUGFyZW50IG9mIHRoaXMgaW5qZWN0b3IuXG4gICAqXG4gICAqIDwhLS0gVE9ETzogQWRkIGEgbGluayB0byB0aGUgc2VjdGlvbiBvZiB0aGUgdXNlciBndWlkZSB0YWxraW5nIGFib3V0IGhpZXJhcmNoaWNhbCBpbmplY3Rpb24uXG4gICAqIC0tPlxuICAgKi9cbiAgYWJzdHJhY3QgZ2V0IHBhcmVudCgpOiBJbmplY3RvcnxudWxsO1xuXG4gIC8qKlxuICAgKiBSZXNvbHZlcyBhbiBhcnJheSBvZiBwcm92aWRlcnMgYW5kIGNyZWF0ZXMgYSBjaGlsZCBpbmplY3RvciBmcm9tIHRob3NlIHByb3ZpZGVycy5cbiAgICpcbiAgICogPCEtLSBUT0RPOiBBZGQgYSBsaW5rIHRvIHRoZSBzZWN0aW9uIG9mIHRoZSB1c2VyIGd1aWRlIHRhbGtpbmcgYWJvdXQgaGllcmFyY2hpY2FsIGluamVjdGlvbi5cbiAgICogLS0+XG4gICAqXG4gICAqIFRoZSBwYXNzZWQtaW4gcHJvdmlkZXJzIGNhbiBiZSBhbiBhcnJheSBvZiBgVHlwZWAsIGBQcm92aWRlcmAsXG4gICAqIG9yIGEgcmVjdXJzaXZlIGFycmF5IG9mIG1vcmUgcHJvdmlkZXJzLlxuICAgKlxuICAgKiBAdXNhZ2VOb3Rlc1xuICAgKiAjIyMgRXhhbXBsZVxuICAgKlxuICAgKiBgYGB0eXBlc2NyaXB0XG4gICAqIGNsYXNzIFBhcmVudFByb3ZpZGVyIHt9XG4gICAqIGNsYXNzIENoaWxkUHJvdmlkZXIge31cbiAgICpcbiAgICogdmFyIHBhcmVudCA9IFJlZmxlY3RpdmVJbmplY3Rvci5yZXNvbHZlQW5kQ3JlYXRlKFtQYXJlbnRQcm92aWRlcl0pO1xuICAgKiB2YXIgY2hpbGQgPSBwYXJlbnQucmVzb2x2ZUFuZENyZWF0ZUNoaWxkKFtDaGlsZFByb3ZpZGVyXSk7XG4gICAqXG4gICAqIGV4cGVjdChjaGlsZC5nZXQoUGFyZW50UHJvdmlkZXIpIGluc3RhbmNlb2YgUGFyZW50UHJvdmlkZXIpLnRvQmUodHJ1ZSk7XG4gICAqIGV4cGVjdChjaGlsZC5nZXQoQ2hpbGRQcm92aWRlcikgaW5zdGFuY2VvZiBDaGlsZFByb3ZpZGVyKS50b0JlKHRydWUpO1xuICAgKiBleHBlY3QoY2hpbGQuZ2V0KFBhcmVudFByb3ZpZGVyKSkudG9CZShwYXJlbnQuZ2V0KFBhcmVudFByb3ZpZGVyKSk7XG4gICAqIGBgYFxuICAgKi9cbiAgYWJzdHJhY3QgcmVzb2x2ZUFuZENyZWF0ZUNoaWxkKHByb3ZpZGVyczogUHJvdmlkZXJbXSk6IFJlZmxlY3RpdmVJbmplY3RvcjtcblxuICAvKipcbiAgICogQ3JlYXRlcyBhIGNoaWxkIGluamVjdG9yIGZyb20gcHJldmlvdXNseSByZXNvbHZlZCBwcm92aWRlcnMuXG4gICAqXG4gICAqIDwhLS0gVE9ETzogQWRkIGEgbGluayB0byB0aGUgc2VjdGlvbiBvZiB0aGUgdXNlciBndWlkZSB0YWxraW5nIGFib3V0IGhpZXJhcmNoaWNhbCBpbmplY3Rpb24uXG4gICAqIC0tPlxuICAgKlxuICAgKiBUaGlzIEFQSSBpcyB0aGUgcmVjb21tZW5kZWQgd2F5IHRvIGNvbnN0cnVjdCBpbmplY3RvcnMgaW4gcGVyZm9ybWFuY2Utc2Vuc2l0aXZlIHBhcnRzLlxuICAgKlxuICAgKiBAdXNhZ2VOb3Rlc1xuICAgKiAjIyMgRXhhbXBsZVxuICAgKlxuICAgKiBgYGB0eXBlc2NyaXB0XG4gICAqIGNsYXNzIFBhcmVudFByb3ZpZGVyIHt9XG4gICAqIGNsYXNzIENoaWxkUHJvdmlkZXIge31cbiAgICpcbiAgICogdmFyIHBhcmVudFByb3ZpZGVycyA9IFJlZmxlY3RpdmVJbmplY3Rvci5yZXNvbHZlKFtQYXJlbnRQcm92aWRlcl0pO1xuICAgKiB2YXIgY2hpbGRQcm92aWRlcnMgPSBSZWZsZWN0aXZlSW5qZWN0b3IucmVzb2x2ZShbQ2hpbGRQcm92aWRlcl0pO1xuICAgKlxuICAgKiB2YXIgcGFyZW50ID0gUmVmbGVjdGl2ZUluamVjdG9yLmZyb21SZXNvbHZlZFByb3ZpZGVycyhwYXJlbnRQcm92aWRlcnMpO1xuICAgKiB2YXIgY2hpbGQgPSBwYXJlbnQuY3JlYXRlQ2hpbGRGcm9tUmVzb2x2ZWQoY2hpbGRQcm92aWRlcnMpO1xuICAgKlxuICAgKiBleHBlY3QoY2hpbGQuZ2V0KFBhcmVudFByb3ZpZGVyKSBpbnN0YW5jZW9mIFBhcmVudFByb3ZpZGVyKS50b0JlKHRydWUpO1xuICAgKiBleHBlY3QoY2hpbGQuZ2V0KENoaWxkUHJvdmlkZXIpIGluc3RhbmNlb2YgQ2hpbGRQcm92aWRlcikudG9CZSh0cnVlKTtcbiAgICogZXhwZWN0KGNoaWxkLmdldChQYXJlbnRQcm92aWRlcikpLnRvQmUocGFyZW50LmdldChQYXJlbnRQcm92aWRlcikpO1xuICAgKiBgYGBcbiAgICovXG4gIGFic3RyYWN0IGNyZWF0ZUNoaWxkRnJvbVJlc29sdmVkKHByb3ZpZGVyczogUmVzb2x2ZWRSZWZsZWN0aXZlUHJvdmlkZXJbXSk6IFJlZmxlY3RpdmVJbmplY3RvcjtcblxuICAvKipcbiAgICogUmVzb2x2ZXMgYSBwcm92aWRlciBhbmQgaW5zdGFudGlhdGVzIGFuIG9iamVjdCBpbiB0aGUgY29udGV4dCBvZiB0aGUgaW5qZWN0b3IuXG4gICAqXG4gICAqIFRoZSBjcmVhdGVkIG9iamVjdCBkb2VzIG5vdCBnZXQgY2FjaGVkIGJ5IHRoZSBpbmplY3Rvci5cbiAgICpcbiAgICogQHVzYWdlTm90ZXNcbiAgICogIyMjIEV4YW1wbGVcbiAgICpcbiAgICogYGBgdHlwZXNjcmlwdFxuICAgKiBASW5qZWN0YWJsZSgpXG4gICAqIGNsYXNzIEVuZ2luZSB7XG4gICAqIH1cbiAgICpcbiAgICogQEluamVjdGFibGUoKVxuICAgKiBjbGFzcyBDYXIge1xuICAgKiAgIGNvbnN0cnVjdG9yKHB1YmxpYyBlbmdpbmU6RW5naW5lKSB7fVxuICAgKiB9XG4gICAqXG4gICAqIHZhciBpbmplY3RvciA9IFJlZmxlY3RpdmVJbmplY3Rvci5yZXNvbHZlQW5kQ3JlYXRlKFtFbmdpbmVdKTtcbiAgICpcbiAgICogdmFyIGNhciA9IGluamVjdG9yLnJlc29sdmVBbmRJbnN0YW50aWF0ZShDYXIpO1xuICAgKiBleHBlY3QoY2FyLmVuZ2luZSkudG9CZShpbmplY3Rvci5nZXQoRW5naW5lKSk7XG4gICAqIGV4cGVjdChjYXIpLm5vdC50b0JlKGluamVjdG9yLnJlc29sdmVBbmRJbnN0YW50aWF0ZShDYXIpKTtcbiAgICogYGBgXG4gICAqL1xuICBhYnN0cmFjdCByZXNvbHZlQW5kSW5zdGFudGlhdGUocHJvdmlkZXI6IFByb3ZpZGVyKTogYW55O1xuXG4gIC8qKlxuICAgKiBJbnN0YW50aWF0ZXMgYW4gb2JqZWN0IHVzaW5nIGEgcmVzb2x2ZWQgcHJvdmlkZXIgaW4gdGhlIGNvbnRleHQgb2YgdGhlIGluamVjdG9yLlxuICAgKlxuICAgKiBUaGUgY3JlYXRlZCBvYmplY3QgZG9lcyBub3QgZ2V0IGNhY2hlZCBieSB0aGUgaW5qZWN0b3IuXG4gICAqXG4gICAqIEB1c2FnZU5vdGVzXG4gICAqICMjIyBFeGFtcGxlXG4gICAqXG4gICAqIGBgYHR5cGVzY3JpcHRcbiAgICogQEluamVjdGFibGUoKVxuICAgKiBjbGFzcyBFbmdpbmUge1xuICAgKiB9XG4gICAqXG4gICAqIEBJbmplY3RhYmxlKClcbiAgICogY2xhc3MgQ2FyIHtcbiAgICogICBjb25zdHJ1Y3RvcihwdWJsaWMgZW5naW5lOkVuZ2luZSkge31cbiAgICogfVxuICAgKlxuICAgKiB2YXIgaW5qZWN0b3IgPSBSZWZsZWN0aXZlSW5qZWN0b3IucmVzb2x2ZUFuZENyZWF0ZShbRW5naW5lXSk7XG4gICAqIHZhciBjYXJQcm92aWRlciA9IFJlZmxlY3RpdmVJbmplY3Rvci5yZXNvbHZlKFtDYXJdKVswXTtcbiAgICogdmFyIGNhciA9IGluamVjdG9yLmluc3RhbnRpYXRlUmVzb2x2ZWQoY2FyUHJvdmlkZXIpO1xuICAgKiBleHBlY3QoY2FyLmVuZ2luZSkudG9CZShpbmplY3Rvci5nZXQoRW5naW5lKSk7XG4gICAqIGV4cGVjdChjYXIpLm5vdC50b0JlKGluamVjdG9yLmluc3RhbnRpYXRlUmVzb2x2ZWQoY2FyUHJvdmlkZXIpKTtcbiAgICogYGBgXG4gICAqL1xuICBhYnN0cmFjdCBpbnN0YW50aWF0ZVJlc29sdmVkKHByb3ZpZGVyOiBSZXNvbHZlZFJlZmxlY3RpdmVQcm92aWRlcik6IGFueTtcblxuICBhYnN0cmFjdCBnZXQodG9rZW46IGFueSwgbm90Rm91bmRWYWx1ZT86IGFueSk6IGFueTtcbn1cblxuZXhwb3J0IGNsYXNzIFJlZmxlY3RpdmVJbmplY3Rvcl8gaW1wbGVtZW50cyBSZWZsZWN0aXZlSW5qZWN0b3Ige1xuICBwcml2YXRlIHN0YXRpYyBJTkpFQ1RPUl9LRVkgPSAoLyogQF9fUFVSRV9fICovIFJlZmxlY3RpdmVLZXkuZ2V0KEluamVjdG9yKSk7XG4gIC8qKiBAaW50ZXJuYWwgKi9cbiAgX2NvbnN0cnVjdGlvbkNvdW50ZXI6IG51bWJlciA9IDA7XG4gIC8qKiBAaW50ZXJuYWwgKi9cbiAgcHVibGljIF9wcm92aWRlcnM6IFJlc29sdmVkUmVmbGVjdGl2ZVByb3ZpZGVyW107XG4gIHB1YmxpYyByZWFkb25seSBwYXJlbnQ6IEluamVjdG9yfG51bGw7XG5cbiAga2V5SWRzOiBudW1iZXJbXTtcbiAgb2JqczogYW55W107XG4gIC8qKlxuICAgKiBQcml2YXRlXG4gICAqL1xuICBjb25zdHJ1Y3RvcihfcHJvdmlkZXJzOiBSZXNvbHZlZFJlZmxlY3RpdmVQcm92aWRlcltdLCBfcGFyZW50PzogSW5qZWN0b3IpIHtcbiAgICB0aGlzLl9wcm92aWRlcnMgPSBfcHJvdmlkZXJzO1xuICAgIHRoaXMucGFyZW50ID0gX3BhcmVudCB8fCBudWxsO1xuXG4gICAgY29uc3QgbGVuID0gX3Byb3ZpZGVycy5sZW5ndGg7XG5cbiAgICB0aGlzLmtleUlkcyA9IFtdO1xuICAgIHRoaXMub2JqcyA9IFtdO1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgICAgdGhpcy5rZXlJZHNbaV0gPSBfcHJvdmlkZXJzW2ldLmtleS5pZDtcbiAgICAgIHRoaXMub2Jqc1tpXSA9IFVOREVGSU5FRDtcbiAgICB9XG4gIH1cblxuICBnZXQodG9rZW46IGFueSwgbm90Rm91bmRWYWx1ZTogYW55ID0gVEhST1dfSUZfTk9UX0ZPVU5EKTogYW55IHtcbiAgICByZXR1cm4gdGhpcy5fZ2V0QnlLZXkoUmVmbGVjdGl2ZUtleS5nZXQodG9rZW4pLCBudWxsLCBub3RGb3VuZFZhbHVlKTtcbiAgfVxuXG4gIHJlc29sdmVBbmRDcmVhdGVDaGlsZChwcm92aWRlcnM6IFByb3ZpZGVyW10pOiBSZWZsZWN0aXZlSW5qZWN0b3Ige1xuICAgIGNvbnN0IFJlc29sdmVkUmVmbGVjdGl2ZVByb3ZpZGVycyA9IFJlZmxlY3RpdmVJbmplY3Rvci5yZXNvbHZlKHByb3ZpZGVycyk7XG4gICAgcmV0dXJuIHRoaXMuY3JlYXRlQ2hpbGRGcm9tUmVzb2x2ZWQoUmVzb2x2ZWRSZWZsZWN0aXZlUHJvdmlkZXJzKTtcbiAgfVxuXG4gIGNyZWF0ZUNoaWxkRnJvbVJlc29sdmVkKHByb3ZpZGVyczogUmVzb2x2ZWRSZWZsZWN0aXZlUHJvdmlkZXJbXSk6IFJlZmxlY3RpdmVJbmplY3RvciB7XG4gICAgY29uc3QgaW5qID0gbmV3IFJlZmxlY3RpdmVJbmplY3Rvcl8ocHJvdmlkZXJzKTtcbiAgICAoaW5qIGFzIHtwYXJlbnQ6IEluamVjdG9yIHwgbnVsbH0pLnBhcmVudCA9IHRoaXM7XG4gICAgcmV0dXJuIGluajtcbiAgfVxuXG4gIHJlc29sdmVBbmRJbnN0YW50aWF0ZShwcm92aWRlcjogUHJvdmlkZXIpOiBhbnkge1xuICAgIHJldHVybiB0aGlzLmluc3RhbnRpYXRlUmVzb2x2ZWQoUmVmbGVjdGl2ZUluamVjdG9yLnJlc29sdmUoW3Byb3ZpZGVyXSlbMF0pO1xuICB9XG5cbiAgaW5zdGFudGlhdGVSZXNvbHZlZChwcm92aWRlcjogUmVzb2x2ZWRSZWZsZWN0aXZlUHJvdmlkZXIpOiBhbnkge1xuICAgIHJldHVybiB0aGlzLl9pbnN0YW50aWF0ZVByb3ZpZGVyKHByb3ZpZGVyKTtcbiAgfVxuXG4gIGdldFByb3ZpZGVyQXRJbmRleChpbmRleDogbnVtYmVyKTogUmVzb2x2ZWRSZWZsZWN0aXZlUHJvdmlkZXIge1xuICAgIGlmIChpbmRleCA8IDAgfHwgaW5kZXggPj0gdGhpcy5fcHJvdmlkZXJzLmxlbmd0aCkge1xuICAgICAgdGhyb3cgb3V0T2ZCb3VuZHNFcnJvcihpbmRleCk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLl9wcm92aWRlcnNbaW5kZXhdO1xuICB9XG5cbiAgLyoqIEBpbnRlcm5hbCAqL1xuICBfbmV3KHByb3ZpZGVyOiBSZXNvbHZlZFJlZmxlY3RpdmVQcm92aWRlcik6IGFueSB7XG4gICAgaWYgKHRoaXMuX2NvbnN0cnVjdGlvbkNvdW50ZXIrKyA+IHRoaXMuX2dldE1heE51bWJlck9mT2JqZWN0cygpKSB7XG4gICAgICB0aHJvdyBjeWNsaWNEZXBlbmRlbmN5RXJyb3IodGhpcywgcHJvdmlkZXIua2V5KTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuX2luc3RhbnRpYXRlUHJvdmlkZXIocHJvdmlkZXIpO1xuICB9XG5cbiAgcHJpdmF0ZSBfZ2V0TWF4TnVtYmVyT2ZPYmplY3RzKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMub2Jqcy5sZW5ndGg7XG4gIH1cblxuICBwcml2YXRlIF9pbnN0YW50aWF0ZVByb3ZpZGVyKHByb3ZpZGVyOiBSZXNvbHZlZFJlZmxlY3RpdmVQcm92aWRlcik6IGFueSB7XG4gICAgaWYgKHByb3ZpZGVyLm11bHRpUHJvdmlkZXIpIHtcbiAgICAgIGNvbnN0IHJlcyA9IFtdO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwcm92aWRlci5yZXNvbHZlZEZhY3Rvcmllcy5sZW5ndGg7ICsraSkge1xuICAgICAgICByZXNbaV0gPSB0aGlzLl9pbnN0YW50aWF0ZShwcm92aWRlciwgcHJvdmlkZXIucmVzb2x2ZWRGYWN0b3JpZXNbaV0pO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHJlcztcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHRoaXMuX2luc3RhbnRpYXRlKHByb3ZpZGVyLCBwcm92aWRlci5yZXNvbHZlZEZhY3Rvcmllc1swXSk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBfaW5zdGFudGlhdGUoXG4gICAgICBwcm92aWRlcjogUmVzb2x2ZWRSZWZsZWN0aXZlUHJvdmlkZXIsXG4gICAgICBSZXNvbHZlZFJlZmxlY3RpdmVGYWN0b3J5OiBSZXNvbHZlZFJlZmxlY3RpdmVGYWN0b3J5KTogYW55IHtcbiAgICBjb25zdCBmYWN0b3J5ID0gUmVzb2x2ZWRSZWZsZWN0aXZlRmFjdG9yeS5mYWN0b3J5O1xuXG4gICAgbGV0IGRlcHM6IGFueVtdO1xuICAgIHRyeSB7XG4gICAgICBkZXBzID1cbiAgICAgICAgICBSZXNvbHZlZFJlZmxlY3RpdmVGYWN0b3J5LmRlcGVuZGVuY2llcy5tYXAoZGVwID0+IHRoaXMuX2dldEJ5UmVmbGVjdGl2ZURlcGVuZGVuY3koZGVwKSk7XG4gICAgfSBjYXRjaCAoZTogYW55KSB7XG4gICAgICBpZiAoZS5hZGRLZXkpIHtcbiAgICAgICAgZS5hZGRLZXkodGhpcywgcHJvdmlkZXIua2V5KTtcbiAgICAgIH1cbiAgICAgIHRocm93IGU7XG4gICAgfVxuXG4gICAgbGV0IG9iajogYW55O1xuICAgIHRyeSB7XG4gICAgICBvYmogPSBmYWN0b3J5KC4uLmRlcHMpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIHRocm93IGluc3RhbnRpYXRpb25FcnJvcih0aGlzLCBlLCAoZSBhcyBFcnJvcikuc3RhY2ssIHByb3ZpZGVyLmtleSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG9iajtcbiAgfVxuXG4gIHByaXZhdGUgX2dldEJ5UmVmbGVjdGl2ZURlcGVuZGVuY3koZGVwOiBSZWZsZWN0aXZlRGVwZW5kZW5jeSk6IGFueSB7XG4gICAgcmV0dXJuIHRoaXMuX2dldEJ5S2V5KGRlcC5rZXksIGRlcC52aXNpYmlsaXR5LCBkZXAub3B0aW9uYWwgPyBudWxsIDogVEhST1dfSUZfTk9UX0ZPVU5EKTtcbiAgfVxuXG4gIHByaXZhdGUgX2dldEJ5S2V5KGtleTogUmVmbGVjdGl2ZUtleSwgdmlzaWJpbGl0eTogU2VsZnxTa2lwU2VsZnxudWxsLCBub3RGb3VuZFZhbHVlOiBhbnkpOiBhbnkge1xuICAgIGlmIChrZXkgPT09IFJlZmxlY3RpdmVJbmplY3Rvcl8uSU5KRUNUT1JfS0VZKSB7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBpZiAodmlzaWJpbGl0eSBpbnN0YW5jZW9mIFNlbGYpIHtcbiAgICAgIHJldHVybiB0aGlzLl9nZXRCeUtleVNlbGYoa2V5LCBub3RGb3VuZFZhbHVlKTtcblxuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gdGhpcy5fZ2V0QnlLZXlEZWZhdWx0KGtleSwgbm90Rm91bmRWYWx1ZSwgdmlzaWJpbGl0eSk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBfZ2V0T2JqQnlLZXlJZChrZXlJZDogbnVtYmVyKTogYW55IHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMua2V5SWRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAodGhpcy5rZXlJZHNbaV0gPT09IGtleUlkKSB7XG4gICAgICAgIGlmICh0aGlzLm9ianNbaV0gPT09IFVOREVGSU5FRCkge1xuICAgICAgICAgIHRoaXMub2Jqc1tpXSA9IHRoaXMuX25ldyh0aGlzLl9wcm92aWRlcnNbaV0pO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXMub2Jqc1tpXTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gVU5ERUZJTkVEO1xuICB9XG5cbiAgLyoqIEBpbnRlcm5hbCAqL1xuICBfdGhyb3dPck51bGwoa2V5OiBSZWZsZWN0aXZlS2V5LCBub3RGb3VuZFZhbHVlOiBhbnkpOiBhbnkge1xuICAgIGlmIChub3RGb3VuZFZhbHVlICE9PSBUSFJPV19JRl9OT1RfRk9VTkQpIHtcbiAgICAgIHJldHVybiBub3RGb3VuZFZhbHVlO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBub1Byb3ZpZGVyRXJyb3IodGhpcywga2V5KTtcbiAgICB9XG4gIH1cblxuICAvKiogQGludGVybmFsICovXG4gIF9nZXRCeUtleVNlbGYoa2V5OiBSZWZsZWN0aXZlS2V5LCBub3RGb3VuZFZhbHVlOiBhbnkpOiBhbnkge1xuICAgIGNvbnN0IG9iaiA9IHRoaXMuX2dldE9iakJ5S2V5SWQoa2V5LmlkKTtcbiAgICByZXR1cm4gKG9iaiAhPT0gVU5ERUZJTkVEKSA/IG9iaiA6IHRoaXMuX3Rocm93T3JOdWxsKGtleSwgbm90Rm91bmRWYWx1ZSk7XG4gIH1cblxuICAvKiogQGludGVybmFsICovXG4gIF9nZXRCeUtleURlZmF1bHQoa2V5OiBSZWZsZWN0aXZlS2V5LCBub3RGb3VuZFZhbHVlOiBhbnksIHZpc2liaWxpdHk6IFNlbGZ8U2tpcFNlbGZ8bnVsbCk6IGFueSB7XG4gICAgbGV0IGluajogSW5qZWN0b3J8bnVsbDtcblxuICAgIGlmICh2aXNpYmlsaXR5IGluc3RhbmNlb2YgU2tpcFNlbGYpIHtcbiAgICAgIGluaiA9IHRoaXMucGFyZW50O1xuICAgIH0gZWxzZSB7XG4gICAgICBpbmogPSB0aGlzO1xuICAgIH1cblxuICAgIHdoaWxlIChpbmogaW5zdGFuY2VvZiBSZWZsZWN0aXZlSW5qZWN0b3JfKSB7XG4gICAgICBjb25zdCBpbmpfID0gPFJlZmxlY3RpdmVJbmplY3Rvcl8+aW5qO1xuICAgICAgY29uc3Qgb2JqID0gaW5qXy5fZ2V0T2JqQnlLZXlJZChrZXkuaWQpO1xuICAgICAgaWYgKG9iaiAhPT0gVU5ERUZJTkVEKSByZXR1cm4gb2JqO1xuICAgICAgaW5qID0gaW5qXy5wYXJlbnQ7XG4gICAgfVxuICAgIGlmIChpbmogIT09IG51bGwpIHtcbiAgICAgIHJldHVybiBpbmouZ2V0KGtleS50b2tlbiwgbm90Rm91bmRWYWx1ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB0aGlzLl90aHJvd09yTnVsbChrZXksIG5vdEZvdW5kVmFsdWUpO1xuICAgIH1cbiAgfVxuXG4gIGdldCBkaXNwbGF5TmFtZSgpOiBzdHJpbmcge1xuICAgIGNvbnN0IHByb3ZpZGVycyA9XG4gICAgICAgIF9tYXBQcm92aWRlcnModGhpcywgKGI6IFJlc29sdmVkUmVmbGVjdGl2ZVByb3ZpZGVyKSA9PiAnIFwiJyArIGIua2V5LmRpc3BsYXlOYW1lICsgJ1wiICcpXG4gICAgICAgICAgICAuam9pbignLCAnKTtcbiAgICByZXR1cm4gYFJlZmxlY3RpdmVJbmplY3Rvcihwcm92aWRlcnM6IFske3Byb3ZpZGVyc31dKWA7XG4gIH1cblxuICB0b1N0cmluZygpOiBzdHJpbmcge1xuICAgIHJldHVybiB0aGlzLmRpc3BsYXlOYW1lO1xuICB9XG59XG5cbmZ1bmN0aW9uIF9tYXBQcm92aWRlcnMoaW5qZWN0b3I6IFJlZmxlY3RpdmVJbmplY3Rvcl8sIGZuOiBGdW5jdGlvbik6IGFueVtdIHtcbiAgY29uc3QgcmVzOiBhbnlbXSA9IFtdO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGluamVjdG9yLl9wcm92aWRlcnMubGVuZ3RoOyArK2kpIHtcbiAgICByZXNbaV0gPSBmbihpbmplY3Rvci5nZXRQcm92aWRlckF0SW5kZXgoaSkpO1xuICB9XG4gIHJldHVybiByZXM7XG59XG4iXX0=