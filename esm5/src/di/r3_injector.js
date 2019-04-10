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
import { InjectionToken } from './injection_token';
import { INJECTOR, Injector, NG_TEMP_TOKEN_PATH, NullInjector, USE_VALUE, catchInjectorError } from './injector';
import { injectArgs, setCurrentInjector, Δinject } from './injector_compatibility';
import { getInjectableDef, getInjectorDef } from './interface/defs';
import { InjectFlags } from './interface/injector';
import { APP_ROOT } from './scope';
/**
 * Marker which indicates that a value has not yet been created from the factory function.
 */
var NOT_YET = {};
/**
 * Marker which indicates that the factory function for a token is in the process of being called.
 *
 * If the injector is asked to inject a token with its value set to CIRCULAR, that indicates
 * injection of a dependency has recursively attempted to inject the original token, and there is
 * a circular dependency among the providers.
 */
var CIRCULAR = {};
var EMPTY_ARRAY = [];
/**
 * A lazily initialized NullInjector.
 */
var NULL_INJECTOR = undefined;
function getNullInjector() {
    if (NULL_INJECTOR === undefined) {
        NULL_INJECTOR = new NullInjector();
    }
    return NULL_INJECTOR;
}
/**
 * Create a new `Injector` which is configured using a `defType` of `InjectorType<any>`s.
 *
 * @publicApi
 */
export function createInjector(defType, parent, additionalProviders, name) {
    if (parent === void 0) { parent = null; }
    if (additionalProviders === void 0) { additionalProviders = null; }
    parent = parent || getNullInjector();
    return new R3Injector(defType, additionalProviders, parent, name);
}
var R3Injector = /** @class */ (function () {
    function R3Injector(def, additionalProviders, parent, source) {
        var _this = this;
        if (source === void 0) { source = null; }
        this.parent = parent;
        /**
         * Map of tokens to records which contain the instances of those tokens.
         */
        this.records = new Map();
        /**
         * The transitive set of `InjectorType`s which define this injector.
         */
        this.injectorDefTypes = new Set();
        /**
         * Set of values instantiated by this injector which contain `ngOnDestroy` lifecycle hooks.
         */
        this.onDestroy = new Set();
        this._destroyed = false;
        // Start off by creating Records for every provider declared in every InjectorType
        // included transitively in `def`.
        var dedupStack = [];
        deepForEach([def], function (injectorDef) { return _this.processInjectorType(injectorDef, [], dedupStack); });
        additionalProviders && deepForEach(additionalProviders, function (provider) { return _this.processProvider(provider, def, additionalProviders); });
        // Make sure the INJECTOR token provides this injector.
        this.records.set(INJECTOR, makeRecord(undefined, this));
        // Detect whether this injector has the APP_ROOT_SCOPE token and thus should provide
        // any injectable scoped to APP_ROOT_SCOPE.
        this.isRootInjector = this.records.has(APP_ROOT);
        // Eagerly instantiate the InjectorType classes themselves.
        this.injectorDefTypes.forEach(function (defType) { return _this.get(defType); });
        // Source name, used for debugging
        this.source = source || (def instanceof Array ? null : stringify(def));
    }
    Object.defineProperty(R3Injector.prototype, "destroyed", {
        /**
         * Flag indicating that this injector was previously destroyed.
         */
        get: function () { return this._destroyed; },
        enumerable: true,
        configurable: true
    });
    /**
     * Destroy the injector and release references to every instance or provider associated with it.
     *
     * Also calls the `OnDestroy` lifecycle hooks of every instance that was created for which a
     * hook was found.
     */
    R3Injector.prototype.destroy = function () {
        this.assertNotDestroyed();
        // Set destroyed = true first, in case lifecycle hooks re-enter destroy().
        this._destroyed = true;
        try {
            // Call all the lifecycle hooks.
            this.onDestroy.forEach(function (service) { return service.ngOnDestroy(); });
        }
        finally {
            // Release all references.
            this.records.clear();
            this.onDestroy.clear();
            this.injectorDefTypes.clear();
        }
    };
    R3Injector.prototype.get = function (token, notFoundValue, flags) {
        if (notFoundValue === void 0) { notFoundValue = Injector.THROW_IF_NOT_FOUND; }
        if (flags === void 0) { flags = InjectFlags.Default; }
        this.assertNotDestroyed();
        // Set the injection context.
        var previousInjector = setCurrentInjector(this);
        try {
            // Check for the SkipSelf flag.
            if (!(flags & InjectFlags.SkipSelf)) {
                // SkipSelf isn't set, check if the record belongs to this injector.
                var record = this.records.get(token);
                if (record === undefined) {
                    // No record, but maybe the token is scoped to this injector. Look for an ngInjectableDef
                    // with a scope matching this injector.
                    var def = couldBeInjectableType(token) && getInjectableDef(token);
                    if (def && this.injectableDefInScope(def)) {
                        // Found an ngInjectableDef and it's scoped to this injector. Pretend as if it was here
                        // all along.
                        record = makeRecord(injectableDefOrInjectorDefFactory(token), NOT_YET);
                        this.records.set(token, record);
                    }
                }
                // If a record was found, get the instance for it and return it.
                if (record !== undefined) {
                    return this.hydrate(token, record);
                }
            }
            // Select the next injector based on the Self flag - if self is set, the next injector is
            // the NullInjector, otherwise it's the parent.
            var nextInjector = !(flags & InjectFlags.Self) ? this.parent : getNullInjector();
            return nextInjector.get(token, flags & InjectFlags.Optional ? null : notFoundValue);
        }
        catch (e) {
            if (e.name === 'NullInjectorError') {
                var path = e[NG_TEMP_TOKEN_PATH] = e[NG_TEMP_TOKEN_PATH] || [];
                path.unshift(stringify(token));
                if (previousInjector) {
                    // We still have a parent injector, keep throwing
                    throw e;
                }
                else {
                    // Format & throw the final error message when we don't have any previous injector
                    return catchInjectorError(e, token, 'R3InjectorError', this.source);
                }
            }
            else {
                throw e;
            }
        }
        finally {
            // Lastly, clean up the state by restoring the previous injector.
            setCurrentInjector(previousInjector);
        }
    };
    R3Injector.prototype.assertNotDestroyed = function () {
        if (this._destroyed) {
            throw new Error('Injector has already been destroyed.');
        }
    };
    /**
     * Add an `InjectorType` or `InjectorDefTypeWithProviders` and all of its transitive providers
     * to this injector.
     */
    R3Injector.prototype.processInjectorType = function (defOrWrappedDef, parents, dedupStack) {
        var _this = this;
        defOrWrappedDef = resolveForwardRef(defOrWrappedDef);
        if (!defOrWrappedDef)
            return;
        // Either the defOrWrappedDef is an InjectorType (with ngInjectorDef) or an
        // InjectorDefTypeWithProviders (aka ModuleWithProviders). Detecting either is a megamorphic
        // read, so care is taken to only do the read once.
        // First attempt to read the ngInjectorDef.
        var def = getInjectorDef(defOrWrappedDef);
        // If that's not present, then attempt to read ngModule from the InjectorDefTypeWithProviders.
        var ngModule = (def == null) && defOrWrappedDef.ngModule || undefined;
        // Determine the InjectorType. In the case where `defOrWrappedDef` is an `InjectorType`,
        // then this is easy. In the case of an InjectorDefTypeWithProviders, then the definition type
        // is the `ngModule`.
        var defType = (ngModule === undefined) ? defOrWrappedDef : ngModule;
        // Check for circular dependencies.
        if (ngDevMode && parents.indexOf(defType) !== -1) {
            var defName = stringify(defType);
            throw new Error("Circular dependency in DI detected for type " + defName + ". Dependency path: " + parents.map(function (defType) { return stringify(defType); }).join(' > ') + " > " + defName + ".");
        }
        // Check for multiple imports of the same module
        var isDuplicate = dedupStack.indexOf(defType) !== -1;
        // If defOrWrappedType was an InjectorDefTypeWithProviders, then .providers may hold some
        // extra providers.
        var providers = (ngModule !== undefined) && defOrWrappedDef.providers ||
            EMPTY_ARRAY;
        // Finally, if defOrWrappedType was an `InjectorDefTypeWithProviders`, then the actual
        // `InjectorDef` is on its `ngModule`.
        if (ngModule !== undefined) {
            def = getInjectorDef(ngModule);
        }
        // If no definition was found, it might be from exports. Remove it.
        if (def == null) {
            return;
        }
        // Track the InjectorType and add a provider for it.
        this.injectorDefTypes.add(defType);
        this.records.set(defType, makeRecord(def.factory, NOT_YET));
        // Add providers in the same way that @NgModule resolution did:
        // First, include providers from any imports.
        if (def.imports != null && !isDuplicate) {
            // Before processing defType's imports, add it to the set of parents. This way, if it ends
            // up deeply importing itself, this can be detected.
            ngDevMode && parents.push(defType);
            // Add it to the set of dedups. This way we can detect multiple imports of the same module
            dedupStack.push(defType);
            try {
                deepForEach(def.imports, function (imported) { return _this.processInjectorType(imported, parents, dedupStack); });
            }
            finally {
                // Remove it from the parents set when finished.
                ngDevMode && parents.pop();
            }
        }
        // Next, include providers listed on the definition itself.
        var defProviders = def.providers;
        if (defProviders != null && !isDuplicate) {
            var injectorType_1 = defOrWrappedDef;
            deepForEach(defProviders, function (provider) { return _this.processProvider(provider, injectorType_1, defProviders); });
        }
        // Finally, include providers from an InjectorDefTypeWithProviders if there was one.
        var ngModuleType = defOrWrappedDef.ngModule;
        deepForEach(providers, function (provider) { return _this.processProvider(provider, ngModuleType, providers); });
    };
    /**
     * Process a `SingleProvider` and add it.
     */
    R3Injector.prototype.processProvider = function (provider, ngModuleType, providers) {
        // Determine the token from the provider. Either it's its own token, or has a {provide: ...}
        // property.
        provider = resolveForwardRef(provider);
        var token = isTypeProvider(provider) ? provider : resolveForwardRef(provider && provider.provide);
        // Construct a `Record` for the provider.
        var record = providerToRecord(provider, ngModuleType, providers);
        if (!isTypeProvider(provider) && provider.multi === true) {
            // If the provider indicates that it's a multi-provider, process it specially.
            // First check whether it's been defined already.
            var multiRecord_1 = this.records.get(token);
            if (multiRecord_1) {
                // It has. Throw a nice error if
                if (multiRecord_1.multi === undefined) {
                    throw new Error("Mixed multi-provider for " + token + ".");
                }
            }
            else {
                multiRecord_1 = makeRecord(undefined, NOT_YET, true);
                multiRecord_1.factory = function () { return injectArgs(multiRecord_1.multi); };
                this.records.set(token, multiRecord_1);
            }
            token = provider;
            multiRecord_1.multi.push(provider);
        }
        else {
            var existing = this.records.get(token);
            if (existing && existing.multi !== undefined) {
                throw new Error("Mixed multi-provider for " + stringify(token));
            }
        }
        this.records.set(token, record);
    };
    R3Injector.prototype.hydrate = function (token, record) {
        if (record.value === CIRCULAR) {
            throw new Error("Cannot instantiate cyclic dependency! " + stringify(token));
        }
        else if (record.value === NOT_YET) {
            record.value = CIRCULAR;
            record.value = record.factory();
        }
        if (typeof record.value === 'object' && record.value && hasOnDestroy(record.value)) {
            this.onDestroy.add(record.value);
        }
        return record.value;
    };
    R3Injector.prototype.injectableDefInScope = function (def) {
        if (!def.providedIn) {
            return false;
        }
        else if (typeof def.providedIn === 'string') {
            return def.providedIn === 'any' || (def.providedIn === 'root' && this.isRootInjector);
        }
        else {
            return this.injectorDefTypes.has(def.providedIn);
        }
    };
    return R3Injector;
}());
export { R3Injector };
function injectableDefOrInjectorDefFactory(token) {
    var injectableDef = getInjectableDef(token);
    if (injectableDef === null) {
        var injectorDef = getInjectorDef(token);
        if (injectorDef !== null) {
            return injectorDef.factory;
        }
        else if (token instanceof InjectionToken) {
            throw new Error("Token " + stringify(token) + " is missing an ngInjectableDef definition.");
        }
        else if (token instanceof Function) {
            var paramLength = token.length;
            if (paramLength > 0) {
                var args = new Array(paramLength).fill('?');
                throw new Error("Can't resolve all parameters for " + stringify(token) + ": (" + args.join(', ') + ").");
            }
            return function () { return new token(); };
        }
        throw new Error('unreachable');
    }
    return injectableDef.factory;
}
function providerToRecord(provider, ngModuleType, providers) {
    var factory = providerToFactory(provider, ngModuleType, providers);
    if (isValueProvider(provider)) {
        return makeRecord(undefined, provider.useValue);
    }
    else {
        return makeRecord(factory, NOT_YET);
    }
}
/**
 * Converts a `SingleProvider` into a factory function.
 *
 * @param provider provider to convert to factory
 */
export function providerToFactory(provider, ngModuleType, providers) {
    var factory = undefined;
    if (isTypeProvider(provider)) {
        return injectableDefOrInjectorDefFactory(resolveForwardRef(provider));
    }
    else {
        if (isValueProvider(provider)) {
            factory = function () { return resolveForwardRef(provider.useValue); };
        }
        else if (isExistingProvider(provider)) {
            factory = function () { return Δinject(resolveForwardRef(provider.useExisting)); };
        }
        else if (isFactoryProvider(provider)) {
            factory = function () { return provider.useFactory.apply(provider, tslib_1.__spread(injectArgs(provider.deps || []))); };
        }
        else {
            var classRef_1 = resolveForwardRef(provider &&
                (provider.useClass || provider.provide));
            if (!classRef_1) {
                var ngModuleDetail = '';
                if (ngModuleType && providers) {
                    var providerDetail = providers.map(function (v) { return v == provider ? '?' + provider + '?' : '...'; });
                    ngModuleDetail =
                        " - only instances of Provider and Type are allowed, got: [" + providerDetail.join(', ') + "]";
                }
                throw new Error("Invalid provider for the NgModule '" + stringify(ngModuleType) + "'" + ngModuleDetail);
            }
            if (hasDeps(provider)) {
                factory = function () { return new ((classRef_1).bind.apply((classRef_1), tslib_1.__spread([void 0], injectArgs(provider.deps))))(); };
            }
            else {
                return injectableDefOrInjectorDefFactory(classRef_1);
            }
        }
    }
    return factory;
}
function makeRecord(factory, value, multi) {
    if (multi === void 0) { multi = false; }
    return {
        factory: factory,
        value: value,
        multi: multi ? [] : undefined,
    };
}
function deepForEach(input, fn) {
    input.forEach(function (value) { return Array.isArray(value) ? deepForEach(value, fn) : fn(value); });
}
function isValueProvider(value) {
    return value !== null && typeof value == 'object' && USE_VALUE in value;
}
function isExistingProvider(value) {
    return !!(value && value.useExisting);
}
function isFactoryProvider(value) {
    return !!(value && value.useFactory);
}
export function isTypeProvider(value) {
    return typeof value === 'function';
}
export function isClassProvider(value) {
    return !!value.useClass;
}
function hasDeps(value) {
    return !!value.deps;
}
function hasOnDestroy(value) {
    return value !== null && typeof value === 'object' &&
        typeof value.ngOnDestroy === 'function';
}
function couldBeInjectableType(value) {
    return (typeof value === 'function') ||
        (typeof value === 'object' && value instanceof InjectionToken);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicjNfaW5qZWN0b3IuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9kaS9yM19pbmplY3Rvci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7O0FBSUgsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBRTVDLE9BQU8sRUFBQyxpQkFBaUIsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUNoRCxPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDakQsT0FBTyxFQUFDLFFBQVEsRUFBRSxRQUFRLEVBQUUsa0JBQWtCLEVBQUUsWUFBWSxFQUFFLFNBQVMsRUFBRSxrQkFBa0IsRUFBQyxNQUFNLFlBQVksQ0FBQztBQUMvRyxPQUFPLEVBQUMsVUFBVSxFQUFFLGtCQUFrQixFQUFFLE9BQU8sRUFBQyxNQUFNLDBCQUEwQixDQUFDO0FBQ2pGLE9BQU8sRUFBMEQsZ0JBQWdCLEVBQUUsY0FBYyxFQUFpQixNQUFNLGtCQUFrQixDQUFDO0FBQzNJLE9BQU8sRUFBQyxXQUFXLEVBQUMsTUFBTSxzQkFBc0IsQ0FBQztBQUVqRCxPQUFPLEVBQUMsUUFBUSxFQUFDLE1BQU0sU0FBUyxDQUFDO0FBVWpDOztHQUVHO0FBQ0gsSUFBTSxPQUFPLEdBQUcsRUFBRSxDQUFDO0FBRW5COzs7Ozs7R0FNRztBQUNILElBQU0sUUFBUSxHQUFHLEVBQUUsQ0FBQztBQUVwQixJQUFNLFdBQVcsR0FBRyxFQUFXLENBQUM7QUFFaEM7O0dBRUc7QUFDSCxJQUFJLGFBQWEsR0FBdUIsU0FBUyxDQUFDO0FBRWxELFNBQVMsZUFBZTtJQUN0QixJQUFJLGFBQWEsS0FBSyxTQUFTLEVBQUU7UUFDL0IsYUFBYSxHQUFHLElBQUksWUFBWSxFQUFFLENBQUM7S0FDcEM7SUFDRCxPQUFPLGFBQWEsQ0FBQztBQUN2QixDQUFDO0FBWUQ7Ozs7R0FJRztBQUNI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QUM7QUFFRCxTQUFTLGlCQUFpQixDQUFDLEtBQXFCO0lBQzlDLE9BQU8sQ0FBQyxDQUFDLENBQUMsS0FBSyxJQUFLLEtBQXlCLENBQUMsVUFBVSxDQUFDLENBQUM7QUFDNUQsQ0FBQztBQUVELE1BQU0sVUFBVSxjQUFjLENBQUMsS0FBcUI7SUFDbEQsT0FBTyxPQUFPLEtBQUssS0FBSyxVQUFVLENBQUM7QUFDckMsQ0FBQztBQUVELE1BQU0sVUFBVSxlQUFlLENBQUMsS0FBcUI7SUFDbkQsT0FBTyxDQUFDLENBQUUsS0FBNkMsQ0FBQyxRQUFRLENBQUM7QUFDbkUsQ0FBQztBQUVELFNBQVMsT0FBTyxDQUFDLEtBQWdFO0lBRS9FLE9BQU8sQ0FBQyxDQUFFLEtBQWEsQ0FBQyxJQUFJLENBQUM7QUFDL0IsQ0FBQztBQUVELFNBQVMsWUFBWSxDQUFDLEtBQVU7SUFDOUIsT0FBTyxLQUFLLEtBQUssSUFBSSxJQUFJLE9BQU8sS0FBSyxLQUFLLFFBQVE7UUFDOUMsT0FBTyxLQUFtQixDQUFDLFdBQVcsS0FBSyxVQUFVLENBQUM7QUFDNUQsQ0FBQztBQUVELFNBQVMscUJBQXFCLENBQUMsS0FBVTtJQUN2QyxPQUFPLENBQUMsT0FBTyxLQUFLLEtBQUssVUFBVSxDQUFDO1FBQ2hDLENBQUMsT0FBTyxLQUFLLEtBQUssUUFBUSxJQUFJLEtBQUssWUFBWSxjQUFjLENBQUMsQ0FBQztBQUNyRSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge09uRGVzdHJveX0gZnJvbSAnLi4vaW50ZXJmYWNlL2xpZmVjeWNsZV9ob29rcyc7XG5pbXBvcnQge1R5cGV9IGZyb20gJy4uL2ludGVyZmFjZS90eXBlJztcbmltcG9ydCB7c3RyaW5naWZ5fSBmcm9tICcuLi91dGlsL3N0cmluZ2lmeSc7XG5cbmltcG9ydCB7cmVzb2x2ZUZvcndhcmRSZWZ9IGZyb20gJy4vZm9yd2FyZF9yZWYnO1xuaW1wb3J0IHtJbmplY3Rpb25Ub2tlbn0gZnJvbSAnLi9pbmplY3Rpb25fdG9rZW4nO1xuaW1wb3J0IHtJTkpFQ1RPUiwgSW5qZWN0b3IsIE5HX1RFTVBfVE9LRU5fUEFUSCwgTnVsbEluamVjdG9yLCBVU0VfVkFMVUUsIGNhdGNoSW5qZWN0b3JFcnJvcn0gZnJvbSAnLi9pbmplY3Rvcic7XG5pbXBvcnQge2luamVjdEFyZ3MsIHNldEN1cnJlbnRJbmplY3RvciwgzpRpbmplY3R9IGZyb20gJy4vaW5qZWN0b3JfY29tcGF0aWJpbGl0eSc7XG5pbXBvcnQge0luamVjdGFibGVUeXBlLCBJbmplY3RvclR5cGUsIEluamVjdG9yVHlwZVdpdGhQcm92aWRlcnMsIGdldEluamVjdGFibGVEZWYsIGdldEluamVjdG9yRGVmLCDOlEluamVjdGFibGVEZWZ9IGZyb20gJy4vaW50ZXJmYWNlL2RlZnMnO1xuaW1wb3J0IHtJbmplY3RGbGFnc30gZnJvbSAnLi9pbnRlcmZhY2UvaW5qZWN0b3InO1xuaW1wb3J0IHtDbGFzc1Byb3ZpZGVyLCBDb25zdHJ1Y3RvclByb3ZpZGVyLCBFeGlzdGluZ1Byb3ZpZGVyLCBGYWN0b3J5UHJvdmlkZXIsIFN0YXRpY0NsYXNzUHJvdmlkZXIsIFN0YXRpY1Byb3ZpZGVyLCBUeXBlUHJvdmlkZXIsIFZhbHVlUHJvdmlkZXJ9IGZyb20gJy4vaW50ZXJmYWNlL3Byb3ZpZGVyJztcbmltcG9ydCB7QVBQX1JPT1R9IGZyb20gJy4vc2NvcGUnO1xuXG5cblxuLyoqXG4gKiBJbnRlcm5hbCB0eXBlIGZvciBhIHNpbmdsZSBwcm92aWRlciBpbiBhIGRlZXAgcHJvdmlkZXIgYXJyYXkuXG4gKi9cbnR5cGUgU2luZ2xlUHJvdmlkZXIgPSBUeXBlUHJvdmlkZXIgfCBWYWx1ZVByb3ZpZGVyIHwgQ2xhc3NQcm92aWRlciB8IENvbnN0cnVjdG9yUHJvdmlkZXIgfFxuICAgIEV4aXN0aW5nUHJvdmlkZXIgfCBGYWN0b3J5UHJvdmlkZXIgfCBTdGF0aWNDbGFzc1Byb3ZpZGVyO1xuXG4vKipcbiAqIE1hcmtlciB3aGljaCBpbmRpY2F0ZXMgdGhhdCBhIHZhbHVlIGhhcyBub3QgeWV0IGJlZW4gY3JlYXRlZCBmcm9tIHRoZSBmYWN0b3J5IGZ1bmN0aW9uLlxuICovXG5jb25zdCBOT1RfWUVUID0ge307XG5cbi8qKlxuICogTWFya2VyIHdoaWNoIGluZGljYXRlcyB0aGF0IHRoZSBmYWN0b3J5IGZ1bmN0aW9uIGZvciBhIHRva2VuIGlzIGluIHRoZSBwcm9jZXNzIG9mIGJlaW5nIGNhbGxlZC5cbiAqXG4gKiBJZiB0aGUgaW5qZWN0b3IgaXMgYXNrZWQgdG8gaW5qZWN0IGEgdG9rZW4gd2l0aCBpdHMgdmFsdWUgc2V0IHRvIENJUkNVTEFSLCB0aGF0IGluZGljYXRlc1xuICogaW5qZWN0aW9uIG9mIGEgZGVwZW5kZW5jeSBoYXMgcmVjdXJzaXZlbHkgYXR0ZW1wdGVkIHRvIGluamVjdCB0aGUgb3JpZ2luYWwgdG9rZW4sIGFuZCB0aGVyZSBpc1xuICogYSBjaXJjdWxhciBkZXBlbmRlbmN5IGFtb25nIHRoZSBwcm92aWRlcnMuXG4gKi9cbmNvbnN0IENJUkNVTEFSID0ge307XG5cbmNvbnN0IEVNUFRZX0FSUkFZID0gW10gYXMgYW55W107XG5cbi8qKlxuICogQSBsYXppbHkgaW5pdGlhbGl6ZWQgTnVsbEluamVjdG9yLlxuICovXG5sZXQgTlVMTF9JTkpFQ1RPUjogSW5qZWN0b3J8dW5kZWZpbmVkID0gdW5kZWZpbmVkO1xuXG5mdW5jdGlvbiBnZXROdWxsSW5qZWN0b3IoKTogSW5qZWN0b3Ige1xuICBpZiAoTlVMTF9JTkpFQ1RPUiA9PT0gdW5kZWZpbmVkKSB7XG4gICAgTlVMTF9JTkpFQ1RPUiA9IG5ldyBOdWxsSW5qZWN0b3IoKTtcbiAgfVxuICByZXR1cm4gTlVMTF9JTkpFQ1RPUjtcbn1cblxuLyoqXG4gKiBBbiBlbnRyeSBpbiB0aGUgaW5qZWN0b3Igd2hpY2ggdHJhY2tzIGluZm9ybWF0aW9uIGFib3V0IHRoZSBnaXZlbiB0b2tlbiwgaW5jbHVkaW5nIGEgcG9zc2libGVcbiAqIGN1cnJlbnQgdmFsdWUuXG4gKi9cbmludGVyZmFjZSBSZWNvcmQ8VD4ge1xuICBmYWN0b3J5OiAoKCkgPT4gVCl8dW5kZWZpbmVkO1xuICB2YWx1ZTogVHx7fTtcbiAgbXVsdGk6IGFueVtdfHVuZGVmaW5lZDtcbn1cblxuLyoqXG4gKiBDcmVhdGUgYSBuZXcgYEluamVjdG9yYCB3aGljaCBpcyBjb25maWd1cmVkIHVzaW5nIGEgYGRlZlR5cGVgIG9mIGBJbmplY3RvclR5cGU8YW55PmBzLlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUluamVjdG9yKFxuICAgIGRlZlR5cGU6IC8qIEluamVjdG9yVHlwZTxhbnk+ICovIGFueSwgcGFyZW50OiBJbmplY3RvciB8IG51bGwgPSBudWxsLFxuICAgIGFkZGl0aW9uYWxQcm92aWRlcnM6IFN0YXRpY1Byb3ZpZGVyW10gfCBudWxsID0gbnVsbCwgbmFtZT86IHN0cmluZyk6IEluamVjdG9yIHtcbiAgcGFyZW50ID0gcGFyZW50IHx8IGdldE51bGxJbmplY3RvcigpO1xuICByZXR1cm4gbmV3IFIzSW5qZWN0b3IoZGVmVHlwZSwgYWRkaXRpb25hbFByb3ZpZGVycywgcGFyZW50LCBuYW1lKTtcbn1cblxuZXhwb3J0IGNsYXNzIFIzSW5qZWN0b3Ige1xuICAvKipcbiAgICogTWFwIG9mIHRva2VucyB0byByZWNvcmRzIHdoaWNoIGNvbnRhaW4gdGhlIGluc3RhbmNlcyBvZiB0aG9zZSB0b2tlbnMuXG4gICAqL1xuICBwcml2YXRlIHJlY29yZHMgPSBuZXcgTWFwPFR5cGU8YW55PnxJbmplY3Rpb25Ub2tlbjxhbnk+LCBSZWNvcmQ8YW55Pj4oKTtcblxuICAvKipcbiAgICogVGhlIHRyYW5zaXRpdmUgc2V0IG9mIGBJbmplY3RvclR5cGVgcyB3aGljaCBkZWZpbmUgdGhpcyBpbmplY3Rvci5cbiAgICovXG4gIHByaXZhdGUgaW5qZWN0b3JEZWZUeXBlcyA9IG5ldyBTZXQ8SW5qZWN0b3JUeXBlPGFueT4+KCk7XG5cbiAgLyoqXG4gICAqIFNldCBvZiB2YWx1ZXMgaW5zdGFudGlhdGVkIGJ5IHRoaXMgaW5qZWN0b3Igd2hpY2ggY29udGFpbiBgbmdPbkRlc3Ryb3lgIGxpZmVjeWNsZSBob29rcy5cbiAgICovXG4gIHByaXZhdGUgb25EZXN0cm95ID0gbmV3IFNldDxPbkRlc3Ryb3k+KCk7XG5cbiAgLyoqXG4gICAqIEZsYWcgaW5kaWNhdGluZyB0aGlzIGluamVjdG9yIHByb3ZpZGVzIHRoZSBBUFBfUk9PVF9TQ09QRSB0b2tlbiwgYW5kIHRodXMgY291bnRzIGFzIHRoZVxuICAgKiByb290IHNjb3BlLlxuICAgKi9cbiAgcHJpdmF0ZSByZWFkb25seSBpc1Jvb3RJbmplY3RvcjogYm9vbGVhbjtcblxuICByZWFkb25seSBzb3VyY2U6IHN0cmluZ3xudWxsO1xuXG4gIC8qKlxuICAgKiBGbGFnIGluZGljYXRpbmcgdGhhdCB0aGlzIGluamVjdG9yIHdhcyBwcmV2aW91c2x5IGRlc3Ryb3llZC5cbiAgICovXG4gIGdldCBkZXN0cm95ZWQoKTogYm9vbGVhbiB7IHJldHVybiB0aGlzLl9kZXN0cm95ZWQ7IH1cbiAgcHJpdmF0ZSBfZGVzdHJveWVkID0gZmFsc2U7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgICBkZWY6IEluamVjdG9yVHlwZTxhbnk+LCBhZGRpdGlvbmFsUHJvdmlkZXJzOiBTdGF0aWNQcm92aWRlcltdfG51bGwsIHJlYWRvbmx5IHBhcmVudDogSW5qZWN0b3IsXG4gICAgICBzb3VyY2U6IHN0cmluZ3xudWxsID0gbnVsbCkge1xuICAgIC8vIFN0YXJ0IG9mZiBieSBjcmVhdGluZyBSZWNvcmRzIGZvciBldmVyeSBwcm92aWRlciBkZWNsYXJlZCBpbiBldmVyeSBJbmplY3RvclR5cGVcbiAgICAvLyBpbmNsdWRlZCB0cmFuc2l0aXZlbHkgaW4gYGRlZmAuXG4gICAgY29uc3QgZGVkdXBTdGFjazogSW5qZWN0b3JUeXBlPGFueT5bXSA9IFtdO1xuICAgIGRlZXBGb3JFYWNoKFtkZWZdLCBpbmplY3RvckRlZiA9PiB0aGlzLnByb2Nlc3NJbmplY3RvclR5cGUoaW5qZWN0b3JEZWYsIFtdLCBkZWR1cFN0YWNrKSk7XG5cbiAgICBhZGRpdGlvbmFsUHJvdmlkZXJzICYmIGRlZXBGb3JFYWNoKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFkZGl0aW9uYWxQcm92aWRlcnMsIHByb3ZpZGVyID0+IHRoaXMucHJvY2Vzc1Byb3ZpZGVyKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm92aWRlciwgZGVmLCBhZGRpdGlvbmFsUHJvdmlkZXJzKSk7XG5cblxuICAgIC8vIE1ha2Ugc3VyZSB0aGUgSU5KRUNUT1IgdG9rZW4gcHJvdmlkZXMgdGhpcyBpbmplY3Rvci5cbiAgICB0aGlzLnJlY29yZHMuc2V0KElOSkVDVE9SLCBtYWtlUmVjb3JkKHVuZGVmaW5lZCwgdGhpcykpO1xuXG4gICAgLy8gRGV0ZWN0IHdoZXRoZXIgdGhpcyBpbmplY3RvciBoYXMgdGhlIEFQUF9ST09UX1NDT1BFIHRva2VuIGFuZCB0aHVzIHNob3VsZCBwcm92aWRlXG4gICAgLy8gYW55IGluamVjdGFibGUgc2NvcGVkIHRvIEFQUF9ST09UX1NDT1BFLlxuICAgIHRoaXMuaXNSb290SW5qZWN0b3IgPSB0aGlzLnJlY29yZHMuaGFzKEFQUF9ST09UKTtcblxuICAgIC8vIEVhZ2VybHkgaW5zdGFudGlhdGUgdGhlIEluamVjdG9yVHlwZSBjbGFzc2VzIHRoZW1zZWx2ZXMuXG4gICAgdGhpcy5pbmplY3RvckRlZlR5cGVzLmZvckVhY2goZGVmVHlwZSA9PiB0aGlzLmdldChkZWZUeXBlKSk7XG5cbiAgICAvLyBTb3VyY2UgbmFtZSwgdXNlZCBmb3IgZGVidWdnaW5nXG4gICAgdGhpcy5zb3VyY2UgPSBzb3VyY2UgfHwgKGRlZiBpbnN0YW5jZW9mIEFycmF5ID8gbnVsbCA6IHN0cmluZ2lmeShkZWYpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZXN0cm95IHRoZSBpbmplY3RvciBhbmQgcmVsZWFzZSByZWZlcmVuY2VzIHRvIGV2ZXJ5IGluc3RhbmNlIG9yIHByb3ZpZGVyIGFzc29jaWF0ZWQgd2l0aCBpdC5cbiAgICpcbiAgICogQWxzbyBjYWxscyB0aGUgYE9uRGVzdHJveWAgbGlmZWN5Y2xlIGhvb2tzIG9mIGV2ZXJ5IGluc3RhbmNlIHRoYXQgd2FzIGNyZWF0ZWQgZm9yIHdoaWNoIGFcbiAgICogaG9vayB3YXMgZm91bmQuXG4gICAqL1xuICBkZXN0cm95KCk6IHZvaWQge1xuICAgIHRoaXMuYXNzZXJ0Tm90RGVzdHJveWVkKCk7XG5cbiAgICAvLyBTZXQgZGVzdHJveWVkID0gdHJ1ZSBmaXJzdCwgaW4gY2FzZSBsaWZlY3ljbGUgaG9va3MgcmUtZW50ZXIgZGVzdHJveSgpLlxuICAgIHRoaXMuX2Rlc3Ryb3llZCA9IHRydWU7XG4gICAgdHJ5IHtcbiAgICAgIC8vIENhbGwgYWxsIHRoZSBsaWZlY3ljbGUgaG9va3MuXG4gICAgICB0aGlzLm9uRGVzdHJveS5mb3JFYWNoKHNlcnZpY2UgPT4gc2VydmljZS5uZ09uRGVzdHJveSgpKTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgLy8gUmVsZWFzZSBhbGwgcmVmZXJlbmNlcy5cbiAgICAgIHRoaXMucmVjb3Jkcy5jbGVhcigpO1xuICAgICAgdGhpcy5vbkRlc3Ryb3kuY2xlYXIoKTtcbiAgICAgIHRoaXMuaW5qZWN0b3JEZWZUeXBlcy5jbGVhcigpO1xuICAgIH1cbiAgfVxuXG4gIGdldDxUPihcbiAgICAgIHRva2VuOiBUeXBlPFQ+fEluamVjdGlvblRva2VuPFQ+LCBub3RGb3VuZFZhbHVlOiBhbnkgPSBJbmplY3Rvci5USFJPV19JRl9OT1RfRk9VTkQsXG4gICAgICBmbGFncyA9IEluamVjdEZsYWdzLkRlZmF1bHQpOiBUIHtcbiAgICB0aGlzLmFzc2VydE5vdERlc3Ryb3llZCgpO1xuICAgIC8vIFNldCB0aGUgaW5qZWN0aW9uIGNvbnRleHQuXG4gICAgY29uc3QgcHJldmlvdXNJbmplY3RvciA9IHNldEN1cnJlbnRJbmplY3Rvcih0aGlzKTtcbiAgICB0cnkge1xuICAgICAgLy8gQ2hlY2sgZm9yIHRoZSBTa2lwU2VsZiBmbGFnLlxuICAgICAgaWYgKCEoZmxhZ3MgJiBJbmplY3RGbGFncy5Ta2lwU2VsZikpIHtcbiAgICAgICAgLy8gU2tpcFNlbGYgaXNuJ3Qgc2V0LCBjaGVjayBpZiB0aGUgcmVjb3JkIGJlbG9uZ3MgdG8gdGhpcyBpbmplY3Rvci5cbiAgICAgICAgbGV0IHJlY29yZDogUmVjb3JkPFQ+fHVuZGVmaW5lZCA9IHRoaXMucmVjb3Jkcy5nZXQodG9rZW4pO1xuICAgICAgICBpZiAocmVjb3JkID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAvLyBObyByZWNvcmQsIGJ1dCBtYXliZSB0aGUgdG9rZW4gaXMgc2NvcGVkIHRvIHRoaXMgaW5qZWN0b3IuIExvb2sgZm9yIGFuIG5nSW5qZWN0YWJsZURlZlxuICAgICAgICAgIC8vIHdpdGggYSBzY29wZSBtYXRjaGluZyB0aGlzIGluamVjdG9yLlxuICAgICAgICAgIGNvbnN0IGRlZiA9IGNvdWxkQmVJbmplY3RhYmxlVHlwZSh0b2tlbikgJiYgZ2V0SW5qZWN0YWJsZURlZih0b2tlbik7XG4gICAgICAgICAgaWYgKGRlZiAmJiB0aGlzLmluamVjdGFibGVEZWZJblNjb3BlKGRlZikpIHtcbiAgICAgICAgICAgIC8vIEZvdW5kIGFuIG5nSW5qZWN0YWJsZURlZiBhbmQgaXQncyBzY29wZWQgdG8gdGhpcyBpbmplY3Rvci4gUHJldGVuZCBhcyBpZiBpdCB3YXMgaGVyZVxuICAgICAgICAgICAgLy8gYWxsIGFsb25nLlxuICAgICAgICAgICAgcmVjb3JkID0gbWFrZVJlY29yZChpbmplY3RhYmxlRGVmT3JJbmplY3RvckRlZkZhY3RvcnkodG9rZW4pLCBOT1RfWUVUKTtcbiAgICAgICAgICAgIHRoaXMucmVjb3Jkcy5zZXQodG9rZW4sIHJlY29yZCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8vIElmIGEgcmVjb3JkIHdhcyBmb3VuZCwgZ2V0IHRoZSBpbnN0YW5jZSBmb3IgaXQgYW5kIHJldHVybiBpdC5cbiAgICAgICAgaWYgKHJlY29yZCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMuaHlkcmF0ZSh0b2tlbiwgcmVjb3JkKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBTZWxlY3QgdGhlIG5leHQgaW5qZWN0b3IgYmFzZWQgb24gdGhlIFNlbGYgZmxhZyAtIGlmIHNlbGYgaXMgc2V0LCB0aGUgbmV4dCBpbmplY3RvciBpc1xuICAgICAgLy8gdGhlIE51bGxJbmplY3Rvciwgb3RoZXJ3aXNlIGl0J3MgdGhlIHBhcmVudC5cbiAgICAgIGNvbnN0IG5leHRJbmplY3RvciA9ICEoZmxhZ3MgJiBJbmplY3RGbGFncy5TZWxmKSA/IHRoaXMucGFyZW50IDogZ2V0TnVsbEluamVjdG9yKCk7XG4gICAgICByZXR1cm4gbmV4dEluamVjdG9yLmdldCh0b2tlbiwgZmxhZ3MgJiBJbmplY3RGbGFncy5PcHRpb25hbCA/IG51bGwgOiBub3RGb3VuZFZhbHVlKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBpZiAoZS5uYW1lID09PSAnTnVsbEluamVjdG9yRXJyb3InKSB7XG4gICAgICAgIGNvbnN0IHBhdGg6IGFueVtdID0gZVtOR19URU1QX1RPS0VOX1BBVEhdID0gZVtOR19URU1QX1RPS0VOX1BBVEhdIHx8IFtdO1xuICAgICAgICBwYXRoLnVuc2hpZnQoc3RyaW5naWZ5KHRva2VuKSk7XG4gICAgICAgIGlmIChwcmV2aW91c0luamVjdG9yKSB7XG4gICAgICAgICAgLy8gV2Ugc3RpbGwgaGF2ZSBhIHBhcmVudCBpbmplY3Rvciwga2VlcCB0aHJvd2luZ1xuICAgICAgICAgIHRocm93IGU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gRm9ybWF0ICYgdGhyb3cgdGhlIGZpbmFsIGVycm9yIG1lc3NhZ2Ugd2hlbiB3ZSBkb24ndCBoYXZlIGFueSBwcmV2aW91cyBpbmplY3RvclxuICAgICAgICAgIHJldHVybiBjYXRjaEluamVjdG9yRXJyb3IoZSwgdG9rZW4sICdSM0luamVjdG9yRXJyb3InLCB0aGlzLnNvdXJjZSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IGU7XG4gICAgICB9XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIC8vIExhc3RseSwgY2xlYW4gdXAgdGhlIHN0YXRlIGJ5IHJlc3RvcmluZyB0aGUgcHJldmlvdXMgaW5qZWN0b3IuXG4gICAgICBzZXRDdXJyZW50SW5qZWN0b3IocHJldmlvdXNJbmplY3Rvcik7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBhc3NlcnROb3REZXN0cm95ZWQoKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuX2Rlc3Ryb3llZCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbmplY3RvciBoYXMgYWxyZWFkeSBiZWVuIGRlc3Ryb3llZC4nKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQWRkIGFuIGBJbmplY3RvclR5cGVgIG9yIGBJbmplY3RvckRlZlR5cGVXaXRoUHJvdmlkZXJzYCBhbmQgYWxsIG9mIGl0cyB0cmFuc2l0aXZlIHByb3ZpZGVyc1xuICAgKiB0byB0aGlzIGluamVjdG9yLlxuICAgKi9cbiAgcHJpdmF0ZSBwcm9jZXNzSW5qZWN0b3JUeXBlKFxuICAgICAgZGVmT3JXcmFwcGVkRGVmOiBJbmplY3RvclR5cGU8YW55PnxJbmplY3RvclR5cGVXaXRoUHJvdmlkZXJzPGFueT4sXG4gICAgICBwYXJlbnRzOiBJbmplY3RvclR5cGU8YW55PltdLCBkZWR1cFN0YWNrOiBJbmplY3RvclR5cGU8YW55PltdKSB7XG4gICAgZGVmT3JXcmFwcGVkRGVmID0gcmVzb2x2ZUZvcndhcmRSZWYoZGVmT3JXcmFwcGVkRGVmKTtcbiAgICBpZiAoIWRlZk9yV3JhcHBlZERlZikgcmV0dXJuO1xuXG4gICAgLy8gRWl0aGVyIHRoZSBkZWZPcldyYXBwZWREZWYgaXMgYW4gSW5qZWN0b3JUeXBlICh3aXRoIG5nSW5qZWN0b3JEZWYpIG9yIGFuXG4gICAgLy8gSW5qZWN0b3JEZWZUeXBlV2l0aFByb3ZpZGVycyAoYWthIE1vZHVsZVdpdGhQcm92aWRlcnMpLiBEZXRlY3RpbmcgZWl0aGVyIGlzIGEgbWVnYW1vcnBoaWNcbiAgICAvLyByZWFkLCBzbyBjYXJlIGlzIHRha2VuIHRvIG9ubHkgZG8gdGhlIHJlYWQgb25jZS5cblxuICAgIC8vIEZpcnN0IGF0dGVtcHQgdG8gcmVhZCB0aGUgbmdJbmplY3RvckRlZi5cbiAgICBsZXQgZGVmID0gZ2V0SW5qZWN0b3JEZWYoZGVmT3JXcmFwcGVkRGVmKTtcblxuICAgIC8vIElmIHRoYXQncyBub3QgcHJlc2VudCwgdGhlbiBhdHRlbXB0IHRvIHJlYWQgbmdNb2R1bGUgZnJvbSB0aGUgSW5qZWN0b3JEZWZUeXBlV2l0aFByb3ZpZGVycy5cbiAgICBjb25zdCBuZ01vZHVsZSA9XG4gICAgICAgIChkZWYgPT0gbnVsbCkgJiYgKGRlZk9yV3JhcHBlZERlZiBhcyBJbmplY3RvclR5cGVXaXRoUHJvdmlkZXJzPGFueT4pLm5nTW9kdWxlIHx8IHVuZGVmaW5lZDtcblxuICAgIC8vIERldGVybWluZSB0aGUgSW5qZWN0b3JUeXBlLiBJbiB0aGUgY2FzZSB3aGVyZSBgZGVmT3JXcmFwcGVkRGVmYCBpcyBhbiBgSW5qZWN0b3JUeXBlYCxcbiAgICAvLyB0aGVuIHRoaXMgaXMgZWFzeS4gSW4gdGhlIGNhc2Ugb2YgYW4gSW5qZWN0b3JEZWZUeXBlV2l0aFByb3ZpZGVycywgdGhlbiB0aGUgZGVmaW5pdGlvbiB0eXBlXG4gICAgLy8gaXMgdGhlIGBuZ01vZHVsZWAuXG4gICAgY29uc3QgZGVmVHlwZTogSW5qZWN0b3JUeXBlPGFueT4gPVxuICAgICAgICAobmdNb2R1bGUgPT09IHVuZGVmaW5lZCkgPyAoZGVmT3JXcmFwcGVkRGVmIGFzIEluamVjdG9yVHlwZTxhbnk+KSA6IG5nTW9kdWxlO1xuXG4gICAgLy8gQ2hlY2sgZm9yIGNpcmN1bGFyIGRlcGVuZGVuY2llcy5cbiAgICBpZiAobmdEZXZNb2RlICYmIHBhcmVudHMuaW5kZXhPZihkZWZUeXBlKSAhPT0gLTEpIHtcbiAgICAgIGNvbnN0IGRlZk5hbWUgPSBzdHJpbmdpZnkoZGVmVHlwZSk7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgYENpcmN1bGFyIGRlcGVuZGVuY3kgaW4gREkgZGV0ZWN0ZWQgZm9yIHR5cGUgJHtkZWZOYW1lfS4gRGVwZW5kZW5jeSBwYXRoOiAke3BhcmVudHMubWFwKGRlZlR5cGUgPT4gc3RyaW5naWZ5KGRlZlR5cGUpKS5qb2luKCcgPiAnKX0gPiAke2RlZk5hbWV9LmApO1xuICAgIH1cblxuICAgIC8vIENoZWNrIGZvciBtdWx0aXBsZSBpbXBvcnRzIG9mIHRoZSBzYW1lIG1vZHVsZVxuICAgIGNvbnN0IGlzRHVwbGljYXRlID0gZGVkdXBTdGFjay5pbmRleE9mKGRlZlR5cGUpICE9PSAtMTtcblxuICAgIC8vIElmIGRlZk9yV3JhcHBlZFR5cGUgd2FzIGFuIEluamVjdG9yRGVmVHlwZVdpdGhQcm92aWRlcnMsIHRoZW4gLnByb3ZpZGVycyBtYXkgaG9sZCBzb21lXG4gICAgLy8gZXh0cmEgcHJvdmlkZXJzLlxuICAgIGNvbnN0IHByb3ZpZGVycyA9XG4gICAgICAgIChuZ01vZHVsZSAhPT0gdW5kZWZpbmVkKSAmJiAoZGVmT3JXcmFwcGVkRGVmIGFzIEluamVjdG9yVHlwZVdpdGhQcm92aWRlcnM8YW55PikucHJvdmlkZXJzIHx8XG4gICAgICAgIEVNUFRZX0FSUkFZO1xuXG4gICAgLy8gRmluYWxseSwgaWYgZGVmT3JXcmFwcGVkVHlwZSB3YXMgYW4gYEluamVjdG9yRGVmVHlwZVdpdGhQcm92aWRlcnNgLCB0aGVuIHRoZSBhY3R1YWxcbiAgICAvLyBgSW5qZWN0b3JEZWZgIGlzIG9uIGl0cyBgbmdNb2R1bGVgLlxuICAgIGlmIChuZ01vZHVsZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBkZWYgPSBnZXRJbmplY3RvckRlZihuZ01vZHVsZSk7XG4gICAgfVxuXG4gICAgLy8gSWYgbm8gZGVmaW5pdGlvbiB3YXMgZm91bmQsIGl0IG1pZ2h0IGJlIGZyb20gZXhwb3J0cy4gUmVtb3ZlIGl0LlxuICAgIGlmIChkZWYgPT0gbnVsbCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIFRyYWNrIHRoZSBJbmplY3RvclR5cGUgYW5kIGFkZCBhIHByb3ZpZGVyIGZvciBpdC5cbiAgICB0aGlzLmluamVjdG9yRGVmVHlwZXMuYWRkKGRlZlR5cGUpO1xuICAgIHRoaXMucmVjb3Jkcy5zZXQoZGVmVHlwZSwgbWFrZVJlY29yZChkZWYuZmFjdG9yeSwgTk9UX1lFVCkpO1xuXG4gICAgLy8gQWRkIHByb3ZpZGVycyBpbiB0aGUgc2FtZSB3YXkgdGhhdCBATmdNb2R1bGUgcmVzb2x1dGlvbiBkaWQ6XG5cbiAgICAvLyBGaXJzdCwgaW5jbHVkZSBwcm92aWRlcnMgZnJvbSBhbnkgaW1wb3J0cy5cbiAgICBpZiAoZGVmLmltcG9ydHMgIT0gbnVsbCAmJiAhaXNEdXBsaWNhdGUpIHtcbiAgICAgIC8vIEJlZm9yZSBwcm9jZXNzaW5nIGRlZlR5cGUncyBpbXBvcnRzLCBhZGQgaXQgdG8gdGhlIHNldCBvZiBwYXJlbnRzLiBUaGlzIHdheSwgaWYgaXQgZW5kc1xuICAgICAgLy8gdXAgZGVlcGx5IGltcG9ydGluZyBpdHNlbGYsIHRoaXMgY2FuIGJlIGRldGVjdGVkLlxuICAgICAgbmdEZXZNb2RlICYmIHBhcmVudHMucHVzaChkZWZUeXBlKTtcbiAgICAgIC8vIEFkZCBpdCB0byB0aGUgc2V0IG9mIGRlZHVwcy4gVGhpcyB3YXkgd2UgY2FuIGRldGVjdCBtdWx0aXBsZSBpbXBvcnRzIG9mIHRoZSBzYW1lIG1vZHVsZVxuICAgICAgZGVkdXBTdGFjay5wdXNoKGRlZlR5cGUpO1xuXG4gICAgICB0cnkge1xuICAgICAgICBkZWVwRm9yRWFjaChcbiAgICAgICAgICAgIGRlZi5pbXBvcnRzLCBpbXBvcnRlZCA9PiB0aGlzLnByb2Nlc3NJbmplY3RvclR5cGUoaW1wb3J0ZWQsIHBhcmVudHMsIGRlZHVwU3RhY2spKTtcbiAgICAgIH0gZmluYWxseSB7XG4gICAgICAgIC8vIFJlbW92ZSBpdCBmcm9tIHRoZSBwYXJlbnRzIHNldCB3aGVuIGZpbmlzaGVkLlxuICAgICAgICBuZ0Rldk1vZGUgJiYgcGFyZW50cy5wb3AoKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBOZXh0LCBpbmNsdWRlIHByb3ZpZGVycyBsaXN0ZWQgb24gdGhlIGRlZmluaXRpb24gaXRzZWxmLlxuICAgIGNvbnN0IGRlZlByb3ZpZGVycyA9IGRlZi5wcm92aWRlcnM7XG4gICAgaWYgKGRlZlByb3ZpZGVycyAhPSBudWxsICYmICFpc0R1cGxpY2F0ZSkge1xuICAgICAgY29uc3QgaW5qZWN0b3JUeXBlID0gZGVmT3JXcmFwcGVkRGVmIGFzIEluamVjdG9yVHlwZTxhbnk+O1xuICAgICAgZGVlcEZvckVhY2goXG4gICAgICAgICAgZGVmUHJvdmlkZXJzLCBwcm92aWRlciA9PiB0aGlzLnByb2Nlc3NQcm92aWRlcihwcm92aWRlciwgaW5qZWN0b3JUeXBlLCBkZWZQcm92aWRlcnMpKTtcbiAgICB9XG5cbiAgICAvLyBGaW5hbGx5LCBpbmNsdWRlIHByb3ZpZGVycyBmcm9tIGFuIEluamVjdG9yRGVmVHlwZVdpdGhQcm92aWRlcnMgaWYgdGhlcmUgd2FzIG9uZS5cbiAgICBjb25zdCBuZ01vZHVsZVR5cGUgPSAoZGVmT3JXcmFwcGVkRGVmIGFzIEluamVjdG9yVHlwZVdpdGhQcm92aWRlcnM8YW55PikubmdNb2R1bGU7XG4gICAgZGVlcEZvckVhY2gocHJvdmlkZXJzLCBwcm92aWRlciA9PiB0aGlzLnByb2Nlc3NQcm92aWRlcihwcm92aWRlciwgbmdNb2R1bGVUeXBlLCBwcm92aWRlcnMpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBQcm9jZXNzIGEgYFNpbmdsZVByb3ZpZGVyYCBhbmQgYWRkIGl0LlxuICAgKi9cbiAgcHJpdmF0ZSBwcm9jZXNzUHJvdmlkZXIoXG4gICAgICBwcm92aWRlcjogU2luZ2xlUHJvdmlkZXIsIG5nTW9kdWxlVHlwZTogSW5qZWN0b3JUeXBlPGFueT4sIHByb3ZpZGVyczogYW55W10pOiB2b2lkIHtcbiAgICAvLyBEZXRlcm1pbmUgdGhlIHRva2VuIGZyb20gdGhlIHByb3ZpZGVyLiBFaXRoZXIgaXQncyBpdHMgb3duIHRva2VuLCBvciBoYXMgYSB7cHJvdmlkZTogLi4ufVxuICAgIC8vIHByb3BlcnR5LlxuICAgIHByb3ZpZGVyID0gcmVzb2x2ZUZvcndhcmRSZWYocHJvdmlkZXIpO1xuICAgIGxldCB0b2tlbjogYW55ID1cbiAgICAgICAgaXNUeXBlUHJvdmlkZXIocHJvdmlkZXIpID8gcHJvdmlkZXIgOiByZXNvbHZlRm9yd2FyZFJlZihwcm92aWRlciAmJiBwcm92aWRlci5wcm92aWRlKTtcblxuICAgIC8vIENvbnN0cnVjdCBhIGBSZWNvcmRgIGZvciB0aGUgcHJvdmlkZXIuXG4gICAgY29uc3QgcmVjb3JkID0gcHJvdmlkZXJUb1JlY29yZChwcm92aWRlciwgbmdNb2R1bGVUeXBlLCBwcm92aWRlcnMpO1xuXG4gICAgaWYgKCFpc1R5cGVQcm92aWRlcihwcm92aWRlcikgJiYgcHJvdmlkZXIubXVsdGkgPT09IHRydWUpIHtcbiAgICAgIC8vIElmIHRoZSBwcm92aWRlciBpbmRpY2F0ZXMgdGhhdCBpdCdzIGEgbXVsdGktcHJvdmlkZXIsIHByb2Nlc3MgaXQgc3BlY2lhbGx5LlxuICAgICAgLy8gRmlyc3QgY2hlY2sgd2hldGhlciBpdCdzIGJlZW4gZGVmaW5lZCBhbHJlYWR5LlxuICAgICAgbGV0IG11bHRpUmVjb3JkID0gdGhpcy5yZWNvcmRzLmdldCh0b2tlbik7XG4gICAgICBpZiAobXVsdGlSZWNvcmQpIHtcbiAgICAgICAgLy8gSXQgaGFzLiBUaHJvdyBhIG5pY2UgZXJyb3IgaWZcbiAgICAgICAgaWYgKG11bHRpUmVjb3JkLm11bHRpID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYE1peGVkIG11bHRpLXByb3ZpZGVyIGZvciAke3Rva2VufS5gKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbXVsdGlSZWNvcmQgPSBtYWtlUmVjb3JkKHVuZGVmaW5lZCwgTk9UX1lFVCwgdHJ1ZSk7XG4gICAgICAgIG11bHRpUmVjb3JkLmZhY3RvcnkgPSAoKSA9PiBpbmplY3RBcmdzKG11bHRpUmVjb3JkICEubXVsdGkgISk7XG4gICAgICAgIHRoaXMucmVjb3Jkcy5zZXQodG9rZW4sIG11bHRpUmVjb3JkKTtcbiAgICAgIH1cbiAgICAgIHRva2VuID0gcHJvdmlkZXI7XG4gICAgICBtdWx0aVJlY29yZC5tdWx0aSAhLnB1c2gocHJvdmlkZXIpO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBleGlzdGluZyA9IHRoaXMucmVjb3Jkcy5nZXQodG9rZW4pO1xuICAgICAgaWYgKGV4aXN0aW5nICYmIGV4aXN0aW5nLm11bHRpICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBNaXhlZCBtdWx0aS1wcm92aWRlciBmb3IgJHtzdHJpbmdpZnkodG9rZW4pfWApO1xuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLnJlY29yZHMuc2V0KHRva2VuLCByZWNvcmQpO1xuICB9XG5cbiAgcHJpdmF0ZSBoeWRyYXRlPFQ+KHRva2VuOiBUeXBlPFQ+fEluamVjdGlvblRva2VuPFQ+LCByZWNvcmQ6IFJlY29yZDxUPik6IFQge1xuICAgIGlmIChyZWNvcmQudmFsdWUgPT09IENJUkNVTEFSKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYENhbm5vdCBpbnN0YW50aWF0ZSBjeWNsaWMgZGVwZW5kZW5jeSEgJHtzdHJpbmdpZnkodG9rZW4pfWApO1xuICAgIH0gZWxzZSBpZiAocmVjb3JkLnZhbHVlID09PSBOT1RfWUVUKSB7XG4gICAgICByZWNvcmQudmFsdWUgPSBDSVJDVUxBUjtcbiAgICAgIHJlY29yZC52YWx1ZSA9IHJlY29yZC5mYWN0b3J5ICEoKTtcbiAgICB9XG4gICAgaWYgKHR5cGVvZiByZWNvcmQudmFsdWUgPT09ICdvYmplY3QnICYmIHJlY29yZC52YWx1ZSAmJiBoYXNPbkRlc3Ryb3kocmVjb3JkLnZhbHVlKSkge1xuICAgICAgdGhpcy5vbkRlc3Ryb3kuYWRkKHJlY29yZC52YWx1ZSk7XG4gICAgfVxuICAgIHJldHVybiByZWNvcmQudmFsdWUgYXMgVDtcbiAgfVxuXG4gIHByaXZhdGUgaW5qZWN0YWJsZURlZkluU2NvcGUoZGVmOiDOlEluamVjdGFibGVEZWY8YW55Pik6IGJvb2xlYW4ge1xuICAgIGlmICghZGVmLnByb3ZpZGVkSW4pIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBkZWYucHJvdmlkZWRJbiA9PT0gJ3N0cmluZycpIHtcbiAgICAgIHJldHVybiBkZWYucHJvdmlkZWRJbiA9PT0gJ2FueScgfHwgKGRlZi5wcm92aWRlZEluID09PSAncm9vdCcgJiYgdGhpcy5pc1Jvb3RJbmplY3Rvcik7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB0aGlzLmluamVjdG9yRGVmVHlwZXMuaGFzKGRlZi5wcm92aWRlZEluKTtcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gaW5qZWN0YWJsZURlZk9ySW5qZWN0b3JEZWZGYWN0b3J5KHRva2VuOiBUeXBlPGFueT58IEluamVjdGlvblRva2VuPGFueT4pOiAoKSA9PiBhbnkge1xuICBjb25zdCBpbmplY3RhYmxlRGVmID0gZ2V0SW5qZWN0YWJsZURlZih0b2tlbiBhcyBJbmplY3RhYmxlVHlwZTxhbnk+KTtcbiAgaWYgKGluamVjdGFibGVEZWYgPT09IG51bGwpIHtcbiAgICBjb25zdCBpbmplY3RvckRlZiA9IGdldEluamVjdG9yRGVmKHRva2VuIGFzIEluamVjdG9yVHlwZTxhbnk+KTtcbiAgICBpZiAoaW5qZWN0b3JEZWYgIT09IG51bGwpIHtcbiAgICAgIHJldHVybiBpbmplY3RvckRlZi5mYWN0b3J5O1xuICAgIH0gZWxzZSBpZiAodG9rZW4gaW5zdGFuY2VvZiBJbmplY3Rpb25Ub2tlbikge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBUb2tlbiAke3N0cmluZ2lmeSh0b2tlbil9IGlzIG1pc3NpbmcgYW4gbmdJbmplY3RhYmxlRGVmIGRlZmluaXRpb24uYCk7XG4gICAgfSBlbHNlIGlmICh0b2tlbiBpbnN0YW5jZW9mIEZ1bmN0aW9uKSB7XG4gICAgICBjb25zdCBwYXJhbUxlbmd0aCA9IHRva2VuLmxlbmd0aDtcbiAgICAgIGlmIChwYXJhbUxlbmd0aCA+IDApIHtcbiAgICAgICAgY29uc3QgYXJnczogc3RyaW5nW10gPSBuZXcgQXJyYXkocGFyYW1MZW5ndGgpLmZpbGwoJz8nKTtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgICAgYENhbid0IHJlc29sdmUgYWxsIHBhcmFtZXRlcnMgZm9yICR7c3RyaW5naWZ5KHRva2VuKX06ICgke2FyZ3Muam9pbignLCAnKX0pLmApO1xuICAgICAgfVxuICAgICAgcmV0dXJuICgpID0+IG5ldyAodG9rZW4gYXMgVHlwZTxhbnk+KSgpO1xuICAgIH1cbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3VucmVhY2hhYmxlJyk7XG4gIH1cbiAgcmV0dXJuIGluamVjdGFibGVEZWYuZmFjdG9yeTtcbn1cblxuZnVuY3Rpb24gcHJvdmlkZXJUb1JlY29yZChcbiAgICBwcm92aWRlcjogU2luZ2xlUHJvdmlkZXIsIG5nTW9kdWxlVHlwZTogSW5qZWN0b3JUeXBlPGFueT4sIHByb3ZpZGVyczogYW55W10pOiBSZWNvcmQ8YW55PiB7XG4gIGxldCBmYWN0b3J5OiAoKCkgPT4gYW55KXx1bmRlZmluZWQgPSBwcm92aWRlclRvRmFjdG9yeShwcm92aWRlciwgbmdNb2R1bGVUeXBlLCBwcm92aWRlcnMpO1xuICBpZiAoaXNWYWx1ZVByb3ZpZGVyKHByb3ZpZGVyKSkge1xuICAgIHJldHVybiBtYWtlUmVjb3JkKHVuZGVmaW5lZCwgcHJvdmlkZXIudXNlVmFsdWUpO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBtYWtlUmVjb3JkKGZhY3RvcnksIE5PVF9ZRVQpO1xuICB9XG59XG5cbi8qKlxuICogQ29udmVydHMgYSBgU2luZ2xlUHJvdmlkZXJgIGludG8gYSBmYWN0b3J5IGZ1bmN0aW9uLlxuICpcbiAqIEBwYXJhbSBwcm92aWRlciBwcm92aWRlciB0byBjb252ZXJ0IHRvIGZhY3RvcnlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHByb3ZpZGVyVG9GYWN0b3J5KFxuICAgIHByb3ZpZGVyOiBTaW5nbGVQcm92aWRlciwgbmdNb2R1bGVUeXBlPzogSW5qZWN0b3JUeXBlPGFueT4sIHByb3ZpZGVycz86IGFueVtdKTogKCkgPT4gYW55IHtcbiAgbGV0IGZhY3Rvcnk6ICgoKSA9PiBhbnkpfHVuZGVmaW5lZCA9IHVuZGVmaW5lZDtcbiAgaWYgKGlzVHlwZVByb3ZpZGVyKHByb3ZpZGVyKSkge1xuICAgIHJldHVybiBpbmplY3RhYmxlRGVmT3JJbmplY3RvckRlZkZhY3RvcnkocmVzb2x2ZUZvcndhcmRSZWYocHJvdmlkZXIpKTtcbiAgfSBlbHNlIHtcbiAgICBpZiAoaXNWYWx1ZVByb3ZpZGVyKHByb3ZpZGVyKSkge1xuICAgICAgZmFjdG9yeSA9ICgpID0+IHJlc29sdmVGb3J3YXJkUmVmKHByb3ZpZGVyLnVzZVZhbHVlKTtcbiAgICB9IGVsc2UgaWYgKGlzRXhpc3RpbmdQcm92aWRlcihwcm92aWRlcikpIHtcbiAgICAgIGZhY3RvcnkgPSAoKSA9PiDOlGluamVjdChyZXNvbHZlRm9yd2FyZFJlZihwcm92aWRlci51c2VFeGlzdGluZykpO1xuICAgIH0gZWxzZSBpZiAoaXNGYWN0b3J5UHJvdmlkZXIocHJvdmlkZXIpKSB7XG4gICAgICBmYWN0b3J5ID0gKCkgPT4gcHJvdmlkZXIudXNlRmFjdG9yeSguLi5pbmplY3RBcmdzKHByb3ZpZGVyLmRlcHMgfHwgW10pKTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgY2xhc3NSZWYgPSByZXNvbHZlRm9yd2FyZFJlZihcbiAgICAgICAgICBwcm92aWRlciAmJlxuICAgICAgICAgICgocHJvdmlkZXIgYXMgU3RhdGljQ2xhc3NQcm92aWRlciB8IENsYXNzUHJvdmlkZXIpLnVzZUNsYXNzIHx8IHByb3ZpZGVyLnByb3ZpZGUpKTtcbiAgICAgIGlmICghY2xhc3NSZWYpIHtcbiAgICAgICAgbGV0IG5nTW9kdWxlRGV0YWlsID0gJyc7XG4gICAgICAgIGlmIChuZ01vZHVsZVR5cGUgJiYgcHJvdmlkZXJzKSB7XG4gICAgICAgICAgY29uc3QgcHJvdmlkZXJEZXRhaWwgPSBwcm92aWRlcnMubWFwKHYgPT4gdiA9PSBwcm92aWRlciA/ICc/JyArIHByb3ZpZGVyICsgJz8nIDogJy4uLicpO1xuICAgICAgICAgIG5nTW9kdWxlRGV0YWlsID1cbiAgICAgICAgICAgICAgYCAtIG9ubHkgaW5zdGFuY2VzIG9mIFByb3ZpZGVyIGFuZCBUeXBlIGFyZSBhbGxvd2VkLCBnb3Q6IFske3Byb3ZpZGVyRGV0YWlsLmpvaW4oJywgJyl9XWA7XG4gICAgICAgIH1cbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgICAgYEludmFsaWQgcHJvdmlkZXIgZm9yIHRoZSBOZ01vZHVsZSAnJHtzdHJpbmdpZnkobmdNb2R1bGVUeXBlKX0nYCArIG5nTW9kdWxlRGV0YWlsKTtcbiAgICAgIH1cbiAgICAgIGlmIChoYXNEZXBzKHByb3ZpZGVyKSkge1xuICAgICAgICBmYWN0b3J5ID0gKCkgPT4gbmV3IChjbGFzc1JlZikoLi4uaW5qZWN0QXJncyhwcm92aWRlci5kZXBzKSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gaW5qZWN0YWJsZURlZk9ySW5qZWN0b3JEZWZGYWN0b3J5KGNsYXNzUmVmKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIGZhY3Rvcnk7XG59XG5cbmZ1bmN0aW9uIG1ha2VSZWNvcmQ8VD4oXG4gICAgZmFjdG9yeTogKCgpID0+IFQpIHwgdW5kZWZpbmVkLCB2YWx1ZTogVCB8IHt9LCBtdWx0aTogYm9vbGVhbiA9IGZhbHNlKTogUmVjb3JkPFQ+IHtcbiAgcmV0dXJuIHtcbiAgICBmYWN0b3J5OiBmYWN0b3J5LFxuICAgIHZhbHVlOiB2YWx1ZSxcbiAgICBtdWx0aTogbXVsdGkgPyBbXSA6IHVuZGVmaW5lZCxcbiAgfTtcbn1cblxuZnVuY3Rpb24gZGVlcEZvckVhY2g8VD4oaW5wdXQ6IChUIHwgYW55W10pW10sIGZuOiAodmFsdWU6IFQpID0+IHZvaWQpOiB2b2lkIHtcbiAgaW5wdXQuZm9yRWFjaCh2YWx1ZSA9PiBBcnJheS5pc0FycmF5KHZhbHVlKSA/IGRlZXBGb3JFYWNoKHZhbHVlLCBmbikgOiBmbih2YWx1ZSkpO1xufVxuXG5mdW5jdGlvbiBpc1ZhbHVlUHJvdmlkZXIodmFsdWU6IFNpbmdsZVByb3ZpZGVyKTogdmFsdWUgaXMgVmFsdWVQcm92aWRlciB7XG4gIHJldHVybiB2YWx1ZSAhPT0gbnVsbCAmJiB0eXBlb2YgdmFsdWUgPT0gJ29iamVjdCcgJiYgVVNFX1ZBTFVFIGluIHZhbHVlO1xufVxuXG5mdW5jdGlvbiBpc0V4aXN0aW5nUHJvdmlkZXIodmFsdWU6IFNpbmdsZVByb3ZpZGVyKTogdmFsdWUgaXMgRXhpc3RpbmdQcm92aWRlciB7XG4gIHJldHVybiAhISh2YWx1ZSAmJiAodmFsdWUgYXMgRXhpc3RpbmdQcm92aWRlcikudXNlRXhpc3RpbmcpO1xufVxuXG5mdW5jdGlvbiBpc0ZhY3RvcnlQcm92aWRlcih2YWx1ZTogU2luZ2xlUHJvdmlkZXIpOiB2YWx1ZSBpcyBGYWN0b3J5UHJvdmlkZXIge1xuICByZXR1cm4gISEodmFsdWUgJiYgKHZhbHVlIGFzIEZhY3RvcnlQcm92aWRlcikudXNlRmFjdG9yeSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc1R5cGVQcm92aWRlcih2YWx1ZTogU2luZ2xlUHJvdmlkZXIpOiB2YWx1ZSBpcyBUeXBlUHJvdmlkZXIge1xuICByZXR1cm4gdHlwZW9mIHZhbHVlID09PSAnZnVuY3Rpb24nO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNDbGFzc1Byb3ZpZGVyKHZhbHVlOiBTaW5nbGVQcm92aWRlcik6IHZhbHVlIGlzIENsYXNzUHJvdmlkZXIge1xuICByZXR1cm4gISEodmFsdWUgYXMgU3RhdGljQ2xhc3NQcm92aWRlciB8IENsYXNzUHJvdmlkZXIpLnVzZUNsYXNzO1xufVxuXG5mdW5jdGlvbiBoYXNEZXBzKHZhbHVlOiBDbGFzc1Byb3ZpZGVyIHwgQ29uc3RydWN0b3JQcm92aWRlciB8IFN0YXRpY0NsYXNzUHJvdmlkZXIpOlxuICAgIHZhbHVlIGlzIENsYXNzUHJvdmlkZXIme2RlcHM6IGFueVtdfSB7XG4gIHJldHVybiAhISh2YWx1ZSBhcyBhbnkpLmRlcHM7XG59XG5cbmZ1bmN0aW9uIGhhc09uRGVzdHJveSh2YWx1ZTogYW55KTogdmFsdWUgaXMgT25EZXN0cm95IHtcbiAgcmV0dXJuIHZhbHVlICE9PSBudWxsICYmIHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcgJiZcbiAgICAgIHR5cGVvZih2YWx1ZSBhcyBPbkRlc3Ryb3kpLm5nT25EZXN0cm95ID09PSAnZnVuY3Rpb24nO1xufVxuXG5mdW5jdGlvbiBjb3VsZEJlSW5qZWN0YWJsZVR5cGUodmFsdWU6IGFueSk6IHZhbHVlIGlzIFR5cGU8YW55PnxJbmplY3Rpb25Ub2tlbjxhbnk+IHtcbiAgcmV0dXJuICh0eXBlb2YgdmFsdWUgPT09ICdmdW5jdGlvbicpIHx8XG4gICAgICAodHlwZW9mIHZhbHVlID09PSAnb2JqZWN0JyAmJiB2YWx1ZSBpbnN0YW5jZW9mIEluamVjdGlvblRva2VuKTtcbn1cbiJdfQ==