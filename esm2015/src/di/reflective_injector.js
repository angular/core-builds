/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,uselessCode} checked by tsc
 */
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
/** @type {?} */
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
 * \@usageNotes
 * ### Example
 *
 * The following example creates an `Injector` configured to create `Engine` and `Car`.
 *
 * ```typescript
 * \@Injectable()
 * class Engine {
 * }
 *
 * \@Injectable()
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
 * @abstract
 */
export class ReflectiveInjector {
    /**
     * Turns an array of provider definitions into an array of resolved providers.
     *
     * A resolution is a process of flattening multiple nested arrays and converting individual
     * providers into an array of `ResolvedReflectiveProvider`s.
     *
     * \@usageNotes
     * ### Example
     *
     * ```typescript
     * \@Injectable()
     * class Engine {
     * }
     *
     * \@Injectable()
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
     * @param {?} providers
     * @return {?}
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
     * \@usageNotes
     * ### Example
     *
     * ```typescript
     * \@Injectable()
     * class Engine {
     * }
     *
     * \@Injectable()
     * class Car {
     *   constructor(public engine:Engine) {}
     * }
     *
     * var injector = ReflectiveInjector.resolveAndCreate([Car, Engine]);
     * expect(injector.get(Car) instanceof Car).toBe(true);
     * ```
     * @param {?} providers
     * @param {?=} parent
     * @return {?}
     */
    static resolveAndCreate(providers, parent) {
        /** @type {?} */
        const ResolvedReflectiveProviders = ReflectiveInjector.resolve(providers);
        return ReflectiveInjector.fromResolvedProviders(ResolvedReflectiveProviders, parent);
    }
    /**
     * Creates an injector from previously resolved providers.
     *
     * This API is the recommended way to construct injectors in performance-sensitive parts.
     *
     * \@usageNotes
     * ### Example
     *
     * ```typescript
     * \@Injectable()
     * class Engine {
     * }
     *
     * \@Injectable()
     * class Car {
     *   constructor(public engine:Engine) {}
     * }
     *
     * var providers = ReflectiveInjector.resolve([Car, Engine]);
     * var injector = ReflectiveInjector.fromResolvedProviders(providers);
     * expect(injector.get(Car) instanceof Car).toBe(true);
     * ```
     * \@experimental
     * @param {?} providers
     * @param {?=} parent
     * @return {?}
     */
    static fromResolvedProviders(providers, parent) {
        return new ReflectiveInjector_(providers, parent);
    }
}
if (false) {
    /**
     * Parent of this injector.
     *
     * <!-- TODO: Add a link to the section of the user guide talking about hierarchical injection.
     * -->
     *
     * \@usageNotes
     * ### Example
     *
     * ```typescript
     * var parent = ReflectiveInjector.resolveAndCreate([]);
     * var child = parent.resolveAndCreateChild([]);
     * expect(child.parent).toBe(parent);
     * ```
     * @abstract
     * @return {?}
     */
    ReflectiveInjector.prototype.parent = function () { };
    /**
     * Resolves an array of providers and creates a child injector from those providers.
     *
     * <!-- TODO: Add a link to the section of the user guide talking about hierarchical injection.
     * -->
     *
     * The passed-in providers can be an array of `Type`, `Provider`,
     * or a recursive array of more providers.
     *
     * \@usageNotes
     * ### Example
     *
     * ```typescript
     * class ParentProvider {}
     * class ChildProvider {}
     *
     * var parent = ReflectiveInjector.resolveAndCreate([ParentProvider]);
     * var child = parent.resolveAndCreateChild([ChildProvider]);
     *
     * expect(child.get(ParentProvider) instanceof ParentProvider).toBe(true);
     * expect(child.get(ChildProvider) instanceof ChildProvider).toBe(true);
     * expect(child.get(ParentProvider)).toBe(parent.get(ParentProvider));
     * ```
     * @abstract
     * @param {?} providers
     * @return {?}
     */
    ReflectiveInjector.prototype.resolveAndCreateChild = function (providers) { };
    /**
     * Creates a child injector from previously resolved providers.
     *
     * <!-- TODO: Add a link to the section of the user guide talking about hierarchical injection.
     * -->
     *
     * This API is the recommended way to construct injectors in performance-sensitive parts.
     *
     * \@usageNotes
     * ### Example
     *
     * ```typescript
     * class ParentProvider {}
     * class ChildProvider {}
     *
     * var parentProviders = ReflectiveInjector.resolve([ParentProvider]);
     * var childProviders = ReflectiveInjector.resolve([ChildProvider]);
     *
     * var parent = ReflectiveInjector.fromResolvedProviders(parentProviders);
     * var child = parent.createChildFromResolved(childProviders);
     *
     * expect(child.get(ParentProvider) instanceof ParentProvider).toBe(true);
     * expect(child.get(ChildProvider) instanceof ChildProvider).toBe(true);
     * expect(child.get(ParentProvider)).toBe(parent.get(ParentProvider));
     * ```
     * @abstract
     * @param {?} providers
     * @return {?}
     */
    ReflectiveInjector.prototype.createChildFromResolved = function (providers) { };
    /**
     * Resolves a provider and instantiates an object in the context of the injector.
     *
     * The created object does not get cached by the injector.
     *
     * \@usageNotes
     * ### Example
     *
     * ```typescript
     * \@Injectable()
     * class Engine {
     * }
     *
     * \@Injectable()
     * class Car {
     *   constructor(public engine:Engine) {}
     * }
     *
     * var injector = ReflectiveInjector.resolveAndCreate([Engine]);
     *
     * var car = injector.resolveAndInstantiate(Car);
     * expect(car.engine).toBe(injector.get(Engine));
     * expect(car).not.toBe(injector.resolveAndInstantiate(Car));
     * ```
     * @abstract
     * @param {?} provider
     * @return {?}
     */
    ReflectiveInjector.prototype.resolveAndInstantiate = function (provider) { };
    /**
     * Instantiates an object using a resolved provider in the context of the injector.
     *
     * The created object does not get cached by the injector.
     *
     * \@usageNotes
     * ### Example
     *
     * ```typescript
     * \@Injectable()
     * class Engine {
     * }
     *
     * \@Injectable()
     * class Car {
     *   constructor(public engine:Engine) {}
     * }
     *
     * var injector = ReflectiveInjector.resolveAndCreate([Engine]);
     * var carProvider = ReflectiveInjector.resolve([Car])[0];
     * var car = injector.instantiateResolved(carProvider);
     * expect(car.engine).toBe(injector.get(Engine));
     * expect(car).not.toBe(injector.instantiateResolved(carProvider));
     * ```
     * @abstract
     * @param {?} provider
     * @return {?}
     */
    ReflectiveInjector.prototype.instantiateResolved = function (provider) { };
    /**
     * @abstract
     * @param {?} token
     * @param {?=} notFoundValue
     * @return {?}
     */
    ReflectiveInjector.prototype.get = function (token, notFoundValue) { };
}
export class ReflectiveInjector_ {
    /**
     * Private
     * @param {?} _providers
     * @param {?=} _parent
     */
    constructor(_providers, _parent) {
        /**
         * \@internal
         */
        this._constructionCounter = 0;
        this._providers = _providers;
        this.parent = _parent || null;
        /** @type {?} */
        const len = _providers.length;
        this.keyIds = new Array(len);
        this.objs = new Array(len);
        for (let i = 0; i < len; i++) {
            this.keyIds[i] = _providers[i].key.id;
            this.objs[i] = UNDEFINED;
        }
    }
    /**
     * @param {?} token
     * @param {?=} notFoundValue
     * @return {?}
     */
    get(token, notFoundValue = THROW_IF_NOT_FOUND) {
        return this._getByKey(ReflectiveKey.get(token), null, notFoundValue);
    }
    /**
     * @param {?} providers
     * @return {?}
     */
    resolveAndCreateChild(providers) {
        /** @type {?} */
        const ResolvedReflectiveProviders = ReflectiveInjector.resolve(providers);
        return this.createChildFromResolved(ResolvedReflectiveProviders);
    }
    /**
     * @param {?} providers
     * @return {?}
     */
    createChildFromResolved(providers) {
        /** @type {?} */
        const inj = new ReflectiveInjector_(providers);
        (/** @type {?} */ (inj)).parent = this;
        return inj;
    }
    /**
     * @param {?} provider
     * @return {?}
     */
    resolveAndInstantiate(provider) {
        return this.instantiateResolved(ReflectiveInjector.resolve([provider])[0]);
    }
    /**
     * @param {?} provider
     * @return {?}
     */
    instantiateResolved(provider) {
        return this._instantiateProvider(provider);
    }
    /**
     * @param {?} index
     * @return {?}
     */
    getProviderAtIndex(index) {
        if (index < 0 || index >= this._providers.length) {
            throw outOfBoundsError(index);
        }
        return this._providers[index];
    }
    /**
     * \@internal
     * @param {?} provider
     * @return {?}
     */
    _new(provider) {
        if (this._constructionCounter++ > this._getMaxNumberOfObjects()) {
            throw cyclicDependencyError(this, provider.key);
        }
        return this._instantiateProvider(provider);
    }
    /**
     * @return {?}
     */
    _getMaxNumberOfObjects() { return this.objs.length; }
    /**
     * @param {?} provider
     * @return {?}
     */
    _instantiateProvider(provider) {
        if (provider.multiProvider) {
            /** @type {?} */
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
    /**
     * @param {?} provider
     * @param {?} ResolvedReflectiveFactory
     * @return {?}
     */
    _instantiate(provider, ResolvedReflectiveFactory) {
        /** @type {?} */
        const factory = ResolvedReflectiveFactory.factory;
        /** @type {?} */
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
        /** @type {?} */
        let obj;
        try {
            obj = factory(...deps);
        }
        catch (e) {
            throw instantiationError(this, e, e.stack, provider.key);
        }
        return obj;
    }
    /**
     * @param {?} dep
     * @return {?}
     */
    _getByReflectiveDependency(dep) {
        return this._getByKey(dep.key, dep.visibility, dep.optional ? null : THROW_IF_NOT_FOUND);
    }
    /**
     * @param {?} key
     * @param {?} visibility
     * @param {?} notFoundValue
     * @return {?}
     */
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
    /**
     * @param {?} keyId
     * @return {?}
     */
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
    /**
     * \@internal
     * @param {?} key
     * @param {?} notFoundValue
     * @return {?}
     */
    _throwOrNull(key, notFoundValue) {
        if (notFoundValue !== THROW_IF_NOT_FOUND) {
            return notFoundValue;
        }
        else {
            throw noProviderError(this, key);
        }
    }
    /**
     * \@internal
     * @param {?} key
     * @param {?} notFoundValue
     * @return {?}
     */
    _getByKeySelf(key, notFoundValue) {
        /** @type {?} */
        const obj = this._getObjByKeyId(key.id);
        return (obj !== UNDEFINED) ? obj : this._throwOrNull(key, notFoundValue);
    }
    /**
     * \@internal
     * @param {?} key
     * @param {?} notFoundValue
     * @param {?} visibility
     * @return {?}
     */
    _getByKeyDefault(key, notFoundValue, visibility) {
        /** @type {?} */
        let inj;
        if (visibility instanceof SkipSelf) {
            inj = this.parent;
        }
        else {
            inj = this;
        }
        while (inj instanceof ReflectiveInjector_) {
            /** @type {?} */
            const inj_ = /** @type {?} */ (inj);
            /** @type {?} */
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
    /**
     * @return {?}
     */
    get displayName() {
        /** @type {?} */
        const providers = _mapProviders(this, (b) => ' "' + b.key.displayName + '" ')
            .join(', ');
        return `ReflectiveInjector(providers: [${providers}])`;
    }
    /**
     * @return {?}
     */
    toString() { return this.displayName; }
}
ReflectiveInjector_.INJECTOR_KEY = ReflectiveKey.get(Injector);
if (false) {
    /** @type {?} */
    ReflectiveInjector_.INJECTOR_KEY;
    /**
     * \@internal
     * @type {?}
     */
    ReflectiveInjector_.prototype._constructionCounter;
    /**
     * \@internal
     * @type {?}
     */
    ReflectiveInjector_.prototype._providers;
    /** @type {?} */
    ReflectiveInjector_.prototype.parent;
    /** @type {?} */
    ReflectiveInjector_.prototype.keyIds;
    /** @type {?} */
    ReflectiveInjector_.prototype.objs;
}
/**
 * @param {?} injector
 * @param {?} fn
 * @return {?}
 */
function _mapProviders(injector, fn) {
    /** @type {?} */
    const res = new Array(injector._providers.length);
    for (let i = 0; i < injector._providers.length; ++i) {
        res[i] = fn(injector.getProviderAtIndex(i));
    }
    return res;
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVmbGVjdGl2ZV9pbmplY3Rvci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL2RpL3JlZmxlY3RpdmVfaW5qZWN0b3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFRQSxPQUFPLEVBQUMsUUFBUSxFQUFFLGtCQUFrQixFQUFDLE1BQU0sWUFBWSxDQUFDO0FBQ3hELE9BQU8sRUFBQyxJQUFJLEVBQUUsUUFBUSxFQUFDLE1BQU0sWUFBWSxDQUFDO0FBRTFDLE9BQU8sRUFBQyxxQkFBcUIsRUFBRSxrQkFBa0IsRUFBRSxlQUFlLEVBQUUsZ0JBQWdCLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUNqSCxPQUFPLEVBQUMsYUFBYSxFQUFDLE1BQU0sa0JBQWtCLENBQUM7QUFDL0MsT0FBTyxFQUE4RSwwQkFBMEIsRUFBQyxNQUFNLHVCQUF1QixDQUFDOztBQUc5SSxNQUFNLFNBQVMsR0FBRyxJQUFJLE1BQU0sRUFBRSxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQXNDL0IsTUFBTSxPQUFnQixrQkFBa0I7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQWtDdEMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxTQUFxQjtRQUNsQyxPQUFPLDBCQUEwQixDQUFDLFNBQVMsQ0FBQyxDQUFDO0tBQzlDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7SUF5QkQsTUFBTSxDQUFDLGdCQUFnQixDQUFDLFNBQXFCLEVBQUUsTUFBaUI7O1FBQzlELE1BQU0sMkJBQTJCLEdBQUcsa0JBQWtCLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQzFFLE9BQU8sa0JBQWtCLENBQUMscUJBQXFCLENBQUMsMkJBQTJCLEVBQUUsTUFBTSxDQUFDLENBQUM7S0FDdEY7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7SUEwQkQsTUFBTSxD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bnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0luamVjdG9yLCBUSFJPV19JRl9OT1RfRk9VTkR9IGZyb20gJy4vaW5qZWN0b3InO1xuaW1wb3J0IHtTZWxmLCBTa2lwU2VsZn0gZnJvbSAnLi9tZXRhZGF0YSc7XG5pbXBvcnQge1Byb3ZpZGVyfSBmcm9tICcuL3Byb3ZpZGVyJztcbmltcG9ydCB7Y3ljbGljRGVwZW5kZW5jeUVycm9yLCBpbnN0YW50aWF0aW9uRXJyb3IsIG5vUHJvdmlkZXJFcnJvciwgb3V0T2ZCb3VuZHNFcnJvcn0gZnJvbSAnLi9yZWZsZWN0aXZlX2Vycm9ycyc7XG5pbXBvcnQge1JlZmxlY3RpdmVLZXl9IGZyb20gJy4vcmVmbGVjdGl2ZV9rZXknO1xuaW1wb3J0IHtSZWZsZWN0aXZlRGVwZW5kZW5jeSwgUmVzb2x2ZWRSZWZsZWN0aXZlRmFjdG9yeSwgUmVzb2x2ZWRSZWZsZWN0aXZlUHJvdmlkZXIsIHJlc29sdmVSZWZsZWN0aXZlUHJvdmlkZXJzfSBmcm9tICcuL3JlZmxlY3RpdmVfcHJvdmlkZXInO1xuXG4vLyBUaHJlc2hvbGQgZm9yIHRoZSBkeW5hbWljIHZlcnNpb25cbmNvbnN0IFVOREVGSU5FRCA9IG5ldyBPYmplY3QoKTtcblxuLyoqXG4gKiBBIFJlZmxlY3RpdmVEZXBlbmRlbmN5IGluamVjdGlvbiBjb250YWluZXIgdXNlZCBmb3IgaW5zdGFudGlhdGluZyBvYmplY3RzIGFuZCByZXNvbHZpbmdcbiAqIGRlcGVuZGVuY2llcy5cbiAqXG4gKiBBbiBgSW5qZWN0b3JgIGlzIGEgcmVwbGFjZW1lbnQgZm9yIGEgYG5ld2Agb3BlcmF0b3IsIHdoaWNoIGNhbiBhdXRvbWF0aWNhbGx5IHJlc29sdmUgdGhlXG4gKiBjb25zdHJ1Y3RvciBkZXBlbmRlbmNpZXMuXG4gKlxuICogSW4gdHlwaWNhbCB1c2UsIGFwcGxpY2F0aW9uIGNvZGUgYXNrcyBmb3IgdGhlIGRlcGVuZGVuY2llcyBpbiB0aGUgY29uc3RydWN0b3IgYW5kIHRoZXkgYXJlXG4gKiByZXNvbHZlZCBieSB0aGUgYEluamVjdG9yYC5cbiAqXG4gKiBAdXNhZ2VOb3Rlc1xuICogIyMjIEV4YW1wbGVcbiAqXG4gKiBUaGUgZm9sbG93aW5nIGV4YW1wbGUgY3JlYXRlcyBhbiBgSW5qZWN0b3JgIGNvbmZpZ3VyZWQgdG8gY3JlYXRlIGBFbmdpbmVgIGFuZCBgQ2FyYC5cbiAqXG4gKiBgYGB0eXBlc2NyaXB0XG4gKiBASW5qZWN0YWJsZSgpXG4gKiBjbGFzcyBFbmdpbmUge1xuICogfVxuICpcbiAqIEBJbmplY3RhYmxlKClcbiAqIGNsYXNzIENhciB7XG4gKiAgIGNvbnN0cnVjdG9yKHB1YmxpYyBlbmdpbmU6RW5naW5lKSB7fVxuICogfVxuICpcbiAqIHZhciBpbmplY3RvciA9IFJlZmxlY3RpdmVJbmplY3Rvci5yZXNvbHZlQW5kQ3JlYXRlKFtDYXIsIEVuZ2luZV0pO1xuICogdmFyIGNhciA9IGluamVjdG9yLmdldChDYXIpO1xuICogZXhwZWN0KGNhciBpbnN0YW5jZW9mIENhcikudG9CZSh0cnVlKTtcbiAqIGV4cGVjdChjYXIuZW5naW5lIGluc3RhbmNlb2YgRW5naW5lKS50b0JlKHRydWUpO1xuICogYGBgXG4gKlxuICogTm90aWNlLCB3ZSBkb24ndCB1c2UgdGhlIGBuZXdgIG9wZXJhdG9yIGJlY2F1c2Ugd2UgZXhwbGljaXRseSB3YW50IHRvIGhhdmUgdGhlIGBJbmplY3RvcmBcbiAqIHJlc29sdmUgYWxsIG9mIHRoZSBvYmplY3QncyBkZXBlbmRlbmNpZXMgYXV0b21hdGljYWxseS5cbiAqXG4gKiBAZGVwcmVjYXRlZCBmcm9tIHY1IC0gc2xvdyBhbmQgYnJpbmdzIGluIGEgbG90IG9mIGNvZGUsIFVzZSBgSW5qZWN0b3IuY3JlYXRlYCBpbnN0ZWFkLlxuICovXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgUmVmbGVjdGl2ZUluamVjdG9yIGltcGxlbWVudHMgSW5qZWN0b3Ige1xuICAvKipcbiAgICogVHVybnMgYW4gYXJyYXkgb2YgcHJvdmlkZXIgZGVmaW5pdGlvbnMgaW50byBhbiBhcnJheSBvZiByZXNvbHZlZCBwcm92aWRlcnMuXG4gICAqXG4gICAqIEEgcmVzb2x1dGlvbiBpcyBhIHByb2Nlc3Mgb2YgZmxhdHRlbmluZyBtdWx0aXBsZSBuZXN0ZWQgYXJyYXlzIGFuZCBjb252ZXJ0aW5nIGluZGl2aWR1YWxcbiAgICogcHJvdmlkZXJzIGludG8gYW4gYXJyYXkgb2YgYFJlc29sdmVkUmVmbGVjdGl2ZVByb3ZpZGVyYHMuXG4gICAqXG4gICAqIEB1c2FnZU5vdGVzXG4gICAqICMjIyBFeGFtcGxlXG4gICAqXG4gICAqIGBgYHR5cGVzY3JpcHRcbiAgICogQEluamVjdGFibGUoKVxuICAgKiBjbGFzcyBFbmdpbmUge1xuICAgKiB9XG4gICAqXG4gICAqIEBJbmplY3RhYmxlKClcbiAgICogY2xhc3MgQ2FyIHtcbiAgICogICBjb25zdHJ1Y3RvcihwdWJsaWMgZW5naW5lOkVuZ2luZSkge31cbiAgICogfVxuICAgKlxuICAgKiB2YXIgcHJvdmlkZXJzID0gUmVmbGVjdGl2ZUluamVjdG9yLnJlc29sdmUoW0NhciwgW1tFbmdpbmVdXV0pO1xuICAgKlxuICAgKiBleHBlY3QocHJvdmlkZXJzLmxlbmd0aCkudG9FcXVhbCgyKTtcbiAgICpcbiAgICogZXhwZWN0KHByb3ZpZGVyc1swXSBpbnN0YW5jZW9mIFJlc29sdmVkUmVmbGVjdGl2ZVByb3ZpZGVyKS50b0JlKHRydWUpO1xuICAgKiBleHBlY3QocHJvdmlkZXJzWzBdLmtleS5kaXNwbGF5TmFtZSkudG9CZShcIkNhclwiKTtcbiAgICogZXhwZWN0KHByb3ZpZGVyc1swXS5kZXBlbmRlbmNpZXMubGVuZ3RoKS50b0VxdWFsKDEpO1xuICAgKiBleHBlY3QocHJvdmlkZXJzWzBdLmZhY3RvcnkpLnRvQmVEZWZpbmVkKCk7XG4gICAqXG4gICAqIGV4cGVjdChwcm92aWRlcnNbMV0ua2V5LmRpc3BsYXlOYW1lKS50b0JlKFwiRW5naW5lXCIpO1xuICAgKiB9KTtcbiAgICogYGBgXG4gICAqXG4gICAqL1xuICBzdGF0aWMgcmVzb2x2ZShwcm92aWRlcnM6IFByb3ZpZGVyW10pOiBSZXNvbHZlZFJlZmxlY3RpdmVQcm92aWRlcltdIHtcbiAgICByZXR1cm4gcmVzb2x2ZVJlZmxlY3RpdmVQcm92aWRlcnMocHJvdmlkZXJzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXNvbHZlcyBhbiBhcnJheSBvZiBwcm92aWRlcnMgYW5kIGNyZWF0ZXMgYW4gaW5qZWN0b3IgZnJvbSB0aG9zZSBwcm92aWRlcnMuXG4gICAqXG4gICAqIFRoZSBwYXNzZWQtaW4gcHJvdmlkZXJzIGNhbiBiZSBhbiBhcnJheSBvZiBgVHlwZWAsIGBQcm92aWRlcmAsXG4gICAqIG9yIGEgcmVjdXJzaXZlIGFycmF5IG9mIG1vcmUgcHJvdmlkZXJzLlxuICAgKlxuICAgKiBAdXNhZ2VOb3Rlc1xuICAgKiAjIyMgRXhhbXBsZVxuICAgKlxuICAgKiBgYGB0eXBlc2NyaXB0XG4gICAqIEBJbmplY3RhYmxlKClcbiAgICogY2xhc3MgRW5naW5lIHtcbiAgICogfVxuICAgKlxuICAgKiBASW5qZWN0YWJsZSgpXG4gICAqIGNsYXNzIENhciB7XG4gICAqICAgY29uc3RydWN0b3IocHVibGljIGVuZ2luZTpFbmdpbmUpIHt9XG4gICAqIH1cbiAgICpcbiAgICogdmFyIGluamVjdG9yID0gUmVmbGVjdGl2ZUluamVjdG9yLnJlc29sdmVBbmRDcmVhdGUoW0NhciwgRW5naW5lXSk7XG4gICAqIGV4cGVjdChpbmplY3Rvci5nZXQoQ2FyKSBpbnN0YW5jZW9mIENhcikudG9CZSh0cnVlKTtcbiAgICogYGBgXG4gICAqL1xuICBzdGF0aWMgcmVzb2x2ZUFuZENyZWF0ZShwcm92aWRlcnM6IFByb3ZpZGVyW10sIHBhcmVudD86IEluamVjdG9yKTogUmVmbGVjdGl2ZUluamVjdG9yIHtcbiAgICBjb25zdCBSZXNvbHZlZFJlZmxlY3RpdmVQcm92aWRlcnMgPSBSZWZsZWN0aXZlSW5qZWN0b3IucmVzb2x2ZShwcm92aWRlcnMpO1xuICAgIHJldHVybiBSZWZsZWN0aXZlSW5qZWN0b3IuZnJvbVJlc29sdmVkUHJvdmlkZXJzKFJlc29sdmVkUmVmbGVjdGl2ZVByb3ZpZGVycywgcGFyZW50KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGFuIGluamVjdG9yIGZyb20gcHJldmlvdXNseSByZXNvbHZlZCBwcm92aWRlcnMuXG4gICAqXG4gICAqIFRoaXMgQVBJIGlzIHRoZSByZWNvbW1lbmRlZCB3YXkgdG8gY29uc3RydWN0IGluamVjdG9ycyBpbiBwZXJmb3JtYW5jZS1zZW5zaXRpdmUgcGFydHMuXG4gICAqXG4gICAqIEB1c2FnZU5vdGVzXG4gICAqICMjIyBFeGFtcGxlXG4gICAqXG4gICAqIGBgYHR5cGVzY3JpcHRcbiAgICogQEluamVjdGFibGUoKVxuICAgKiBjbGFzcyBFbmdpbmUge1xuICAgKiB9XG4gICAqXG4gICAqIEBJbmplY3RhYmxlKClcbiAgICogY2xhc3MgQ2FyIHtcbiAgICogICBjb25zdHJ1Y3RvcihwdWJsaWMgZW5naW5lOkVuZ2luZSkge31cbiAgICogfVxuICAgKlxuICAgKiB2YXIgcHJvdmlkZXJzID0gUmVmbGVjdGl2ZUluamVjdG9yLnJlc29sdmUoW0NhciwgRW5naW5lXSk7XG4gICAqIHZhciBpbmplY3RvciA9IFJlZmxlY3RpdmVJbmplY3Rvci5mcm9tUmVzb2x2ZWRQcm92aWRlcnMocHJvdmlkZXJzKTtcbiAgICogZXhwZWN0KGluamVjdG9yLmdldChDYXIpIGluc3RhbmNlb2YgQ2FyKS50b0JlKHRydWUpO1xuICAgKiBgYGBcbiAgICogQGV4cGVyaW1lbnRhbFxuICAgKi9cbiAgc3RhdGljIGZyb21SZXNvbHZlZFByb3ZpZGVycyhwcm92aWRlcnM6IFJlc29sdmVkUmVmbGVjdGl2ZVByb3ZpZGVyW10sIHBhcmVudD86IEluamVjdG9yKTpcbiAgICAgIFJlZmxlY3RpdmVJbmplY3RvciB7XG4gICAgcmV0dXJuIG5ldyBSZWZsZWN0aXZlSW5qZWN0b3JfKHByb3ZpZGVycywgcGFyZW50KTtcbiAgfVxuXG5cbiAgLyoqXG4gICAqIFBhcmVudCBvZiB0aGlzIGluamVjdG9yLlxuICAgKlxuICAgKiA8IS0tIFRPRE86IEFkZCBhIGxpbmsgdG8gdGhlIHNlY3Rpb24gb2YgdGhlIHVzZXIgZ3VpZGUgdGFsa2luZyBhYm91dCBoaWVyYXJjaGljYWwgaW5qZWN0aW9uLlxuICAgKiAtLT5cbiAgICpcbiAgICogQHVzYWdlTm90ZXNcbiAgICogIyMjIEV4YW1wbGVcbiAgICpcbiAgICogYGBgdHlwZXNjcmlwdFxuICAgKiB2YXIgcGFyZW50ID0gUmVmbGVjdGl2ZUluamVjdG9yLnJlc29sdmVBbmRDcmVhdGUoW10pO1xuICAgKiB2YXIgY2hpbGQgPSBwYXJlbnQucmVzb2x2ZUFuZENyZWF0ZUNoaWxkKFtdKTtcbiAgICogZXhwZWN0KGNoaWxkLnBhcmVudCkudG9CZShwYXJlbnQpO1xuICAgKiBgYGBcbiAgICovXG4gIGFic3RyYWN0IGdldCBwYXJlbnQoKTogSW5qZWN0b3J8bnVsbDtcblxuICAvKipcbiAgICogUmVzb2x2ZXMgYW4gYXJyYXkgb2YgcHJvdmlkZXJzIGFuZCBjcmVhdGVzIGEgY2hpbGQgaW5qZWN0b3IgZnJvbSB0aG9zZSBwcm92aWRlcnMuXG4gICAqXG4gICAqIDwhLS0gVE9ETzogQWRkIGEgbGluayB0byB0aGUgc2VjdGlvbiBvZiB0aGUgdXNlciBndWlkZSB0YWxraW5nIGFib3V0IGhpZXJhcmNoaWNhbCBpbmplY3Rpb24uXG4gICAqIC0tPlxuICAgKlxuICAgKiBUaGUgcGFzc2VkLWluIHByb3ZpZGVycyBjYW4gYmUgYW4gYXJyYXkgb2YgYFR5cGVgLCBgUHJvdmlkZXJgLFxuICAgKiBvciBhIHJlY3Vyc2l2ZSBhcnJheSBvZiBtb3JlIHByb3ZpZGVycy5cbiAgICpcbiAgICogQHVzYWdlTm90ZXNcbiAgICogIyMjIEV4YW1wbGVcbiAgICpcbiAgICogYGBgdHlwZXNjcmlwdFxuICAgKiBjbGFzcyBQYXJlbnRQcm92aWRlciB7fVxuICAgKiBjbGFzcyBDaGlsZFByb3ZpZGVyIHt9XG4gICAqXG4gICAqIHZhciBwYXJlbnQgPSBSZWZsZWN0aXZlSW5qZWN0b3IucmVzb2x2ZUFuZENyZWF0ZShbUGFyZW50UHJvdmlkZXJdKTtcbiAgICogdmFyIGNoaWxkID0gcGFyZW50LnJlc29sdmVBbmRDcmVhdGVDaGlsZChbQ2hpbGRQcm92aWRlcl0pO1xuICAgKlxuICAgKiBleHBlY3QoY2hpbGQuZ2V0KFBhcmVudFByb3ZpZGVyKSBpbnN0YW5jZW9mIFBhcmVudFByb3ZpZGVyKS50b0JlKHRydWUpO1xuICAgKiBleHBlY3QoY2hpbGQuZ2V0KENoaWxkUHJvdmlkZXIpIGluc3RhbmNlb2YgQ2hpbGRQcm92aWRlcikudG9CZSh0cnVlKTtcbiAgICogZXhwZWN0KGNoaWxkLmdldChQYXJlbnRQcm92aWRlcikpLnRvQmUocGFyZW50LmdldChQYXJlbnRQcm92aWRlcikpO1xuICAgKiBgYGBcbiAgICovXG4gIGFic3RyYWN0IHJlc29sdmVBbmRDcmVhdGVDaGlsZChwcm92aWRlcnM6IFByb3ZpZGVyW10pOiBSZWZsZWN0aXZlSW5qZWN0b3I7XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBjaGlsZCBpbmplY3RvciBmcm9tIHByZXZpb3VzbHkgcmVzb2x2ZWQgcHJvdmlkZXJzLlxuICAgKlxuICAgKiA8IS0tIFRPRE86IEFkZCBhIGxpbmsgdG8gdGhlIHNlY3Rpb24gb2YgdGhlIHVzZXIgZ3VpZGUgdGFsa2luZyBhYm91dCBoaWVyYXJjaGljYWwgaW5qZWN0aW9uLlxuICAgKiAtLT5cbiAgICpcbiAgICogVGhpcyBBUEkgaXMgdGhlIHJlY29tbWVuZGVkIHdheSB0byBjb25zdHJ1Y3QgaW5qZWN0b3JzIGluIHBlcmZvcm1hbmNlLXNlbnNpdGl2ZSBwYXJ0cy5cbiAgICpcbiAgICogQHVzYWdlTm90ZXNcbiAgICogIyMjIEV4YW1wbGVcbiAgICpcbiAgICogYGBgdHlwZXNjcmlwdFxuICAgKiBjbGFzcyBQYXJlbnRQcm92aWRlciB7fVxuICAgKiBjbGFzcyBDaGlsZFByb3ZpZGVyIHt9XG4gICAqXG4gICAqIHZhciBwYXJlbnRQcm92aWRlcnMgPSBSZWZsZWN0aXZlSW5qZWN0b3IucmVzb2x2ZShbUGFyZW50UHJvdmlkZXJdKTtcbiAgICogdmFyIGNoaWxkUHJvdmlkZXJzID0gUmVmbGVjdGl2ZUluamVjdG9yLnJlc29sdmUoW0NoaWxkUHJvdmlkZXJdKTtcbiAgICpcbiAgICogdmFyIHBhcmVudCA9IFJlZmxlY3RpdmVJbmplY3Rvci5mcm9tUmVzb2x2ZWRQcm92aWRlcnMocGFyZW50UHJvdmlkZXJzKTtcbiAgICogdmFyIGNoaWxkID0gcGFyZW50LmNyZWF0ZUNoaWxkRnJvbVJlc29sdmVkKGNoaWxkUHJvdmlkZXJzKTtcbiAgICpcbiAgICogZXhwZWN0KGNoaWxkLmdldChQYXJlbnRQcm92aWRlcikgaW5zdGFuY2VvZiBQYXJlbnRQcm92aWRlcikudG9CZSh0cnVlKTtcbiAgICogZXhwZWN0KGNoaWxkLmdldChDaGlsZFByb3ZpZGVyKSBpbnN0YW5jZW9mIENoaWxkUHJvdmlkZXIpLnRvQmUodHJ1ZSk7XG4gICAqIGV4cGVjdChjaGlsZC5nZXQoUGFyZW50UHJvdmlkZXIpKS50b0JlKHBhcmVudC5nZXQoUGFyZW50UHJvdmlkZXIpKTtcbiAgICogYGBgXG4gICAqL1xuICBhYnN0cmFjdCBjcmVhdGVDaGlsZEZyb21SZXNvbHZlZChwcm92aWRlcnM6IFJlc29sdmVkUmVmbGVjdGl2ZVByb3ZpZGVyW10pOiBSZWZsZWN0aXZlSW5qZWN0b3I7XG5cbiAgLyoqXG4gICAqIFJlc29sdmVzIGEgcHJvdmlkZXIgYW5kIGluc3RhbnRpYXRlcyBhbiBvYmplY3QgaW4gdGhlIGNvbnRleHQgb2YgdGhlIGluamVjdG9yLlxuICAgKlxuICAgKiBUaGUgY3JlYXRlZCBvYmplY3QgZG9lcyBub3QgZ2V0IGNhY2hlZCBieSB0aGUgaW5qZWN0b3IuXG4gICAqXG4gICAqIEB1c2FnZU5vdGVzXG4gICAqICMjIyBFeGFtcGxlXG4gICAqXG4gICAqIGBgYHR5cGVzY3JpcHRcbiAgICogQEluamVjdGFibGUoKVxuICAgKiBjbGFzcyBFbmdpbmUge1xuICAgKiB9XG4gICAqXG4gICAqIEBJbmplY3RhYmxlKClcbiAgICogY2xhc3MgQ2FyIHtcbiAgICogICBjb25zdHJ1Y3RvcihwdWJsaWMgZW5naW5lOkVuZ2luZSkge31cbiAgICogfVxuICAgKlxuICAgKiB2YXIgaW5qZWN0b3IgPSBSZWZsZWN0aXZlSW5qZWN0b3IucmVzb2x2ZUFuZENyZWF0ZShbRW5naW5lXSk7XG4gICAqXG4gICAqIHZhciBjYXIgPSBpbmplY3Rvci5yZXNvbHZlQW5kSW5zdGFudGlhdGUoQ2FyKTtcbiAgICogZXhwZWN0KGNhci5lbmdpbmUpLnRvQmUoaW5qZWN0b3IuZ2V0KEVuZ2luZSkpO1xuICAgKiBleHBlY3QoY2FyKS5ub3QudG9CZShpbmplY3Rvci5yZXNvbHZlQW5kSW5zdGFudGlhdGUoQ2FyKSk7XG4gICAqIGBgYFxuICAgKi9cbiAgYWJzdHJhY3QgcmVzb2x2ZUFuZEluc3RhbnRpYXRlKHByb3ZpZGVyOiBQcm92aWRlcik6IGFueTtcblxuICAvKipcbiAgICogSW5zdGFudGlhdGVzIGFuIG9iamVjdCB1c2luZyBhIHJlc29sdmVkIHByb3ZpZGVyIGluIHRoZSBjb250ZXh0IG9mIHRoZSBpbmplY3Rvci5cbiAgICpcbiAgICogVGhlIGNyZWF0ZWQgb2JqZWN0IGRvZXMgbm90IGdldCBjYWNoZWQgYnkgdGhlIGluamVjdG9yLlxuICAgKlxuICAgKiBAdXNhZ2VOb3Rlc1xuICAgKiAjIyMgRXhhbXBsZVxuICAgKlxuICAgKiBgYGB0eXBlc2NyaXB0XG4gICAqIEBJbmplY3RhYmxlKClcbiAgICogY2xhc3MgRW5naW5lIHtcbiAgICogfVxuICAgKlxuICAgKiBASW5qZWN0YWJsZSgpXG4gICAqIGNsYXNzIENhciB7XG4gICAqICAgY29uc3RydWN0b3IocHVibGljIGVuZ2luZTpFbmdpbmUpIHt9XG4gICAqIH1cbiAgICpcbiAgICogdmFyIGluamVjdG9yID0gUmVmbGVjdGl2ZUluamVjdG9yLnJlc29sdmVBbmRDcmVhdGUoW0VuZ2luZV0pO1xuICAgKiB2YXIgY2FyUHJvdmlkZXIgPSBSZWZsZWN0aXZlSW5qZWN0b3IucmVzb2x2ZShbQ2FyXSlbMF07XG4gICAqIHZhciBjYXIgPSBpbmplY3Rvci5pbnN0YW50aWF0ZVJlc29sdmVkKGNhclByb3ZpZGVyKTtcbiAgICogZXhwZWN0KGNhci5lbmdpbmUpLnRvQmUoaW5qZWN0b3IuZ2V0KEVuZ2luZSkpO1xuICAgKiBleHBlY3QoY2FyKS5ub3QudG9CZShpbmplY3Rvci5pbnN0YW50aWF0ZVJlc29sdmVkKGNhclByb3ZpZGVyKSk7XG4gICAqIGBgYFxuICAgKi9cbiAgYWJzdHJhY3QgaW5zdGFudGlhdGVSZXNvbHZlZChwcm92aWRlcjogUmVzb2x2ZWRSZWZsZWN0aXZlUHJvdmlkZXIpOiBhbnk7XG5cbiAgYWJzdHJhY3QgZ2V0KHRva2VuOiBhbnksIG5vdEZvdW5kVmFsdWU/OiBhbnkpOiBhbnk7XG59XG5cbmV4cG9ydCBjbGFzcyBSZWZsZWN0aXZlSW5qZWN0b3JfIGltcGxlbWVudHMgUmVmbGVjdGl2ZUluamVjdG9yIHtcbiAgcHJpdmF0ZSBzdGF0aWMgSU5KRUNUT1JfS0VZID0gUmVmbGVjdGl2ZUtleS5nZXQoSW5qZWN0b3IpO1xuICAvKiogQGludGVybmFsICovXG4gIF9jb25zdHJ1Y3Rpb25Db3VudGVyOiBudW1iZXIgPSAwO1xuICAvKiogQGludGVybmFsICovXG4gIHB1YmxpYyBfcHJvdmlkZXJzOiBSZXNvbHZlZFJlZmxlY3RpdmVQcm92aWRlcltdO1xuICBwdWJsaWMgcmVhZG9ubHkgcGFyZW50OiBJbmplY3RvcnxudWxsO1xuXG4gIGtleUlkczogbnVtYmVyW107XG4gIG9ianM6IGFueVtdO1xuICAvKipcbiAgICogUHJpdmF0ZVxuICAgKi9cbiAgY29uc3RydWN0b3IoX3Byb3ZpZGVyczogUmVzb2x2ZWRSZWZsZWN0aXZlUHJvdmlkZXJbXSwgX3BhcmVudD86IEluamVjdG9yKSB7XG4gICAgdGhpcy5fcHJvdmlkZXJzID0gX3Byb3ZpZGVycztcbiAgICB0aGlzLnBhcmVudCA9IF9wYXJlbnQgfHwgbnVsbDtcblxuICAgIGNvbnN0IGxlbiA9IF9wcm92aWRlcnMubGVuZ3RoO1xuXG4gICAgdGhpcy5rZXlJZHMgPSBuZXcgQXJyYXkobGVuKTtcbiAgICB0aGlzLm9ianMgPSBuZXcgQXJyYXkobGVuKTtcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgIHRoaXMua2V5SWRzW2ldID0gX3Byb3ZpZGVyc1tpXS5rZXkuaWQ7XG4gICAgICB0aGlzLm9ianNbaV0gPSBVTkRFRklORUQ7XG4gICAgfVxuICB9XG5cbiAgZ2V0KHRva2VuOiBhbnksIG5vdEZvdW5kVmFsdWU6IGFueSA9IFRIUk9XX0lGX05PVF9GT1VORCk6IGFueSB7XG4gICAgcmV0dXJuIHRoaXMuX2dldEJ5S2V5KFJlZmxlY3RpdmVLZXkuZ2V0KHRva2VuKSwgbnVsbCwgbm90Rm91bmRWYWx1ZSk7XG4gIH1cblxuICByZXNvbHZlQW5kQ3JlYXRlQ2hpbGQocHJvdmlkZXJzOiBQcm92aWRlcltdKTogUmVmbGVjdGl2ZUluamVjdG9yIHtcbiAgICBjb25zdCBSZXNvbHZlZFJlZmxlY3RpdmVQcm92aWRlcnMgPSBSZWZsZWN0aXZlSW5qZWN0b3IucmVzb2x2ZShwcm92aWRlcnMpO1xuICAgIHJldHVybiB0aGlzLmNyZWF0ZUNoaWxkRnJvbVJlc29sdmVkKFJlc29sdmVkUmVmbGVjdGl2ZVByb3ZpZGVycyk7XG4gIH1cblxuICBjcmVhdGVDaGlsZEZyb21SZXNvbHZlZChwcm92aWRlcnM6IFJlc29sdmVkUmVmbGVjdGl2ZVByb3ZpZGVyW10pOiBSZWZsZWN0aXZlSW5qZWN0b3Ige1xuICAgIGNvbnN0IGluaiA9IG5ldyBSZWZsZWN0aXZlSW5qZWN0b3JfKHByb3ZpZGVycyk7XG4gICAgKGluaiBhc3twYXJlbnQ6IEluamVjdG9yIHwgbnVsbH0pLnBhcmVudCA9IHRoaXM7XG4gICAgcmV0dXJuIGluajtcbiAgfVxuXG4gIHJlc29sdmVBbmRJbnN0YW50aWF0ZShwcm92aWRlcjogUHJvdmlkZXIpOiBhbnkge1xuICAgIHJldHVybiB0aGlzLmluc3RhbnRpYXRlUmVzb2x2ZWQoUmVmbGVjdGl2ZUluamVjdG9yLnJlc29sdmUoW3Byb3ZpZGVyXSlbMF0pO1xuICB9XG5cbiAgaW5zdGFudGlhdGVSZXNvbHZlZChwcm92aWRlcjogUmVzb2x2ZWRSZWZsZWN0aXZlUHJvdmlkZXIpOiBhbnkge1xuICAgIHJldHVybiB0aGlzLl9pbnN0YW50aWF0ZVByb3ZpZGVyKHByb3ZpZGVyKTtcbiAgfVxuXG4gIGdldFByb3ZpZGVyQXRJbmRleChpbmRleDogbnVtYmVyKTogUmVzb2x2ZWRSZWZsZWN0aXZlUHJvdmlkZXIge1xuICAgIGlmIChpbmRleCA8IDAgfHwgaW5kZXggPj0gdGhpcy5fcHJvdmlkZXJzLmxlbmd0aCkge1xuICAgICAgdGhyb3cgb3V0T2ZCb3VuZHNFcnJvcihpbmRleCk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLl9wcm92aWRlcnNbaW5kZXhdO1xuICB9XG5cbiAgLyoqIEBpbnRlcm5hbCAqL1xuICBfbmV3KHByb3ZpZGVyOiBSZXNvbHZlZFJlZmxlY3RpdmVQcm92aWRlcik6IGFueSB7XG4gICAgaWYgKHRoaXMuX2NvbnN0cnVjdGlvbkNvdW50ZXIrKyA+IHRoaXMuX2dldE1heE51bWJlck9mT2JqZWN0cygpKSB7XG4gICAgICB0aHJvdyBjeWNsaWNEZXBlbmRlbmN5RXJyb3IodGhpcywgcHJvdmlkZXIua2V5KTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuX2luc3RhbnRpYXRlUHJvdmlkZXIocHJvdmlkZXIpO1xuICB9XG5cbiAgcHJpdmF0ZSBfZ2V0TWF4TnVtYmVyT2ZPYmplY3RzKCk6IG51bWJlciB7IHJldHVybiB0aGlzLm9ianMubGVuZ3RoOyB9XG5cbiAgcHJpdmF0ZSBfaW5zdGFudGlhdGVQcm92aWRlcihwcm92aWRlcjogUmVzb2x2ZWRSZWZsZWN0aXZlUHJvdmlkZXIpOiBhbnkge1xuICAgIGlmIChwcm92aWRlci5tdWx0aVByb3ZpZGVyKSB7XG4gICAgICBjb25zdCByZXMgPSBuZXcgQXJyYXkocHJvdmlkZXIucmVzb2x2ZWRGYWN0b3JpZXMubGVuZ3RoKTtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcHJvdmlkZXIucmVzb2x2ZWRGYWN0b3JpZXMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgcmVzW2ldID0gdGhpcy5faW5zdGFudGlhdGUocHJvdmlkZXIsIHByb3ZpZGVyLnJlc29sdmVkRmFjdG9yaWVzW2ldKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiByZXM7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB0aGlzLl9pbnN0YW50aWF0ZShwcm92aWRlciwgcHJvdmlkZXIucmVzb2x2ZWRGYWN0b3JpZXNbMF0pO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgX2luc3RhbnRpYXRlKFxuICAgICAgcHJvdmlkZXI6IFJlc29sdmVkUmVmbGVjdGl2ZVByb3ZpZGVyLFxuICAgICAgUmVzb2x2ZWRSZWZsZWN0aXZlRmFjdG9yeTogUmVzb2x2ZWRSZWZsZWN0aXZlRmFjdG9yeSk6IGFueSB7XG4gICAgY29uc3QgZmFjdG9yeSA9IFJlc29sdmVkUmVmbGVjdGl2ZUZhY3RvcnkuZmFjdG9yeTtcblxuICAgIGxldCBkZXBzOiBhbnlbXTtcbiAgICB0cnkge1xuICAgICAgZGVwcyA9XG4gICAgICAgICAgUmVzb2x2ZWRSZWZsZWN0aXZlRmFjdG9yeS5kZXBlbmRlbmNpZXMubWFwKGRlcCA9PiB0aGlzLl9nZXRCeVJlZmxlY3RpdmVEZXBlbmRlbmN5KGRlcCkpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGlmIChlLmFkZEtleSkge1xuICAgICAgICBlLmFkZEtleSh0aGlzLCBwcm92aWRlci5rZXkpO1xuICAgICAgfVxuICAgICAgdGhyb3cgZTtcbiAgICB9XG5cbiAgICBsZXQgb2JqOiBhbnk7XG4gICAgdHJ5IHtcbiAgICAgIG9iaiA9IGZhY3RvcnkoLi4uZGVwcyk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgdGhyb3cgaW5zdGFudGlhdGlvbkVycm9yKHRoaXMsIGUsIGUuc3RhY2ssIHByb3ZpZGVyLmtleSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG9iajtcbiAgfVxuXG4gIHByaXZhdGUgX2dldEJ5UmVmbGVjdGl2ZURlcGVuZGVuY3koZGVwOiBSZWZsZWN0aXZlRGVwZW5kZW5jeSk6IGFueSB7XG4gICAgcmV0dXJuIHRoaXMuX2dldEJ5S2V5KGRlcC5rZXksIGRlcC52aXNpYmlsaXR5LCBkZXAub3B0aW9uYWwgPyBudWxsIDogVEhST1dfSUZfTk9UX0ZPVU5EKTtcbiAgfVxuXG4gIHByaXZhdGUgX2dldEJ5S2V5KGtleTogUmVmbGVjdGl2ZUtleSwgdmlzaWJpbGl0eTogU2VsZnxTa2lwU2VsZnxudWxsLCBub3RGb3VuZFZhbHVlOiBhbnkpOiBhbnkge1xuICAgIGlmIChrZXkgPT09IFJlZmxlY3RpdmVJbmplY3Rvcl8uSU5KRUNUT1JfS0VZKSB7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBpZiAodmlzaWJpbGl0eSBpbnN0YW5jZW9mIFNlbGYpIHtcbiAgICAgIHJldHVybiB0aGlzLl9nZXRCeUtleVNlbGYoa2V5LCBub3RGb3VuZFZhbHVlKTtcblxuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gdGhpcy5fZ2V0QnlLZXlEZWZhdWx0KGtleSwgbm90Rm91bmRWYWx1ZSwgdmlzaWJpbGl0eSk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBfZ2V0T2JqQnlLZXlJZChrZXlJZDogbnVtYmVyKTogYW55IHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMua2V5SWRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAodGhpcy5rZXlJZHNbaV0gPT09IGtleUlkKSB7XG4gICAgICAgIGlmICh0aGlzLm9ianNbaV0gPT09IFVOREVGSU5FRCkge1xuICAgICAgICAgIHRoaXMub2Jqc1tpXSA9IHRoaXMuX25ldyh0aGlzLl9wcm92aWRlcnNbaV0pO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXMub2Jqc1tpXTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gVU5ERUZJTkVEO1xuICB9XG5cbiAgLyoqIEBpbnRlcm5hbCAqL1xuICBfdGhyb3dPck51bGwoa2V5OiBSZWZsZWN0aXZlS2V5LCBub3RGb3VuZFZhbHVlOiBhbnkpOiBhbnkge1xuICAgIGlmIChub3RGb3VuZFZhbHVlICE9PSBUSFJPV19JRl9OT1RfRk9VTkQpIHtcbiAgICAgIHJldHVybiBub3RGb3VuZFZhbHVlO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBub1Byb3ZpZGVyRXJyb3IodGhpcywga2V5KTtcbiAgICB9XG4gIH1cblxuICAvKiogQGludGVybmFsICovXG4gIF9nZXRCeUtleVNlbGYoa2V5OiBSZWZsZWN0aXZlS2V5LCBub3RGb3VuZFZhbHVlOiBhbnkpOiBhbnkge1xuICAgIGNvbnN0IG9iaiA9IHRoaXMuX2dldE9iakJ5S2V5SWQoa2V5LmlkKTtcbiAgICByZXR1cm4gKG9iaiAhPT0gVU5ERUZJTkVEKSA/IG9iaiA6IHRoaXMuX3Rocm93T3JOdWxsKGtleSwgbm90Rm91bmRWYWx1ZSk7XG4gIH1cblxuICAvKiogQGludGVybmFsICovXG4gIF9nZXRCeUtleURlZmF1bHQoa2V5OiBSZWZsZWN0aXZlS2V5LCBub3RGb3VuZFZhbHVlOiBhbnksIHZpc2liaWxpdHk6IFNlbGZ8U2tpcFNlbGZ8bnVsbCk6IGFueSB7XG4gICAgbGV0IGluajogSW5qZWN0b3J8bnVsbDtcblxuICAgIGlmICh2aXNpYmlsaXR5IGluc3RhbmNlb2YgU2tpcFNlbGYpIHtcbiAgICAgIGluaiA9IHRoaXMucGFyZW50O1xuICAgIH0gZWxzZSB7XG4gICAgICBpbmogPSB0aGlzO1xuICAgIH1cblxuICAgIHdoaWxlIChpbmogaW5zdGFuY2VvZiBSZWZsZWN0aXZlSW5qZWN0b3JfKSB7XG4gICAgICBjb25zdCBpbmpfID0gPFJlZmxlY3RpdmVJbmplY3Rvcl8+aW5qO1xuICAgICAgY29uc3Qgb2JqID0gaW5qXy5fZ2V0T2JqQnlLZXlJZChrZXkuaWQpO1xuICAgICAgaWYgKG9iaiAhPT0gVU5ERUZJTkVEKSByZXR1cm4gb2JqO1xuICAgICAgaW5qID0gaW5qXy5wYXJlbnQ7XG4gICAgfVxuICAgIGlmIChpbmogIT09IG51bGwpIHtcbiAgICAgIHJldHVybiBpbmouZ2V0KGtleS50b2tlbiwgbm90Rm91bmRWYWx1ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB0aGlzLl90aHJvd09yTnVsbChrZXksIG5vdEZvdW5kVmFsdWUpO1xuICAgIH1cbiAgfVxuXG4gIGdldCBkaXNwbGF5TmFtZSgpOiBzdHJpbmcge1xuICAgIGNvbnN0IHByb3ZpZGVycyA9XG4gICAgICAgIF9tYXBQcm92aWRlcnModGhpcywgKGI6IFJlc29sdmVkUmVmbGVjdGl2ZVByb3ZpZGVyKSA9PiAnIFwiJyArIGIua2V5LmRpc3BsYXlOYW1lICsgJ1wiICcpXG4gICAgICAgICAgICAuam9pbignLCAnKTtcbiAgICByZXR1cm4gYFJlZmxlY3RpdmVJbmplY3Rvcihwcm92aWRlcnM6IFske3Byb3ZpZGVyc31dKWA7XG4gIH1cblxuICB0b1N0cmluZygpOiBzdHJpbmcgeyByZXR1cm4gdGhpcy5kaXNwbGF5TmFtZTsgfVxufVxuXG5mdW5jdGlvbiBfbWFwUHJvdmlkZXJzKGluamVjdG9yOiBSZWZsZWN0aXZlSW5qZWN0b3JfLCBmbjogRnVuY3Rpb24pOiBhbnlbXSB7XG4gIGNvbnN0IHJlczogYW55W10gPSBuZXcgQXJyYXkoaW5qZWN0b3IuX3Byb3ZpZGVycy5sZW5ndGgpO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGluamVjdG9yLl9wcm92aWRlcnMubGVuZ3RoOyArK2kpIHtcbiAgICByZXNbaV0gPSBmbihpbmplY3Rvci5nZXRQcm92aWRlckF0SW5kZXgoaSkpO1xuICB9XG4gIHJldHVybiByZXM7XG59XG4iXX0=