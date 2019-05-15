/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as tslib_1 from "tslib";
import { throwCyclicDependencyError, throwInvalidProviderError, throwMixedMultiProviderError } from '../render3/errors';
import { stringify } from '../util/stringify';
import { resolveForwardRef } from './forward_ref';
import { InjectionToken } from './injection_token';
import { INJECTOR, NG_TEMP_TOKEN_PATH, NullInjector, THROW_IF_NOT_FOUND, USE_VALUE, catchInjectorError, injectArgs, setCurrentInjector, Δinject } from './injector_compatibility';
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
        this.source = source || (typeof def === 'object' ? null : stringify(def));
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
        if (notFoundValue === void 0) { notFoundValue = THROW_IF_NOT_FOUND; }
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
    R3Injector.prototype.toString = function () {
        var tokens = [], records = this.records;
        records.forEach(function (v, token) { return tokens.push(stringify(token)); });
        return "R3Injector[" + tokens.join(', ') + "]";
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
        // TODO(FW-1307): Re-add ngDevMode when closure can handle it
        if (parents.indexOf(defType) !== -1) {
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
            // TODO(FW-1307): Re-add ngDevMode when closure can handle it
            parents.push(defType);
            // Add it to the set of dedups. This way we can detect multiple imports of the same module
            dedupStack.push(defType);
            try {
                deepForEach(def.imports, function (imported) { return _this.processInjectorType(imported, parents, dedupStack); });
            }
            finally {
                // Remove it from the parents set when finished.
                // TODO(FW-1307): Re-add ngDevMode when closure can handle it
                parents.pop();
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
                    throwMixedMultiProviderError();
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
                throwMixedMultiProviderError();
            }
        }
        this.records.set(token, record);
    };
    R3Injector.prototype.hydrate = function (token, record) {
        if (record.value === CIRCULAR) {
            throwCyclicDependencyError(stringify(token));
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
                throwInvalidProviderError(ngModuleType, providers, provider);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicjNfaW5qZWN0b3IuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9kaS9yM19pbmplY3Rvci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7O0FBSUgsT0FBTyxFQUFDLDBCQUEwQixFQUFFLHlCQUF5QixFQUFFLDRCQUE0QixFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDdEgsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBRTVDLE9BQU8sRUFBQyxpQkFBaUIsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUNoRCxPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFFakQsT0FBTyxFQUFDLFFBQVEsRUFBRSxrQkFBa0IsRUFBRSxZQUFZLEVBQUUsa0JBQWtCLEVBQUUsU0FBUyxFQUFFLGtCQUFrQixFQUFFLFVBQVUsRUFBRSxrQkFBa0IsRUFBRSxPQUFPLEVBQUMsTUFBTSwwQkFBMEIsQ0FBQztBQUNoTCxPQUFPLEVBQTBELGdCQUFnQixFQUFFLGNBQWMsRUFBaUIsTUFBTSxrQkFBa0IsQ0FBQztBQUMzSSxPQUFPLEVBQUMsV0FBVyxFQUFDLE1BQU0sc0JBQXNCLENBQUM7QUFFakQsT0FBTyxFQUFDLFFBQVEsRUFBQyxNQUFNLFNBQVMsQ0FBQztBQVVqQzs7R0FFRztBQUNILElBQU0sT0FBTyxHQUFHLEVBQUUsQ0FBQztBQUVuQjs7Ozs7O0dBTUc7QUFDSCxJQUFNLFFBQVEsR0FBRyxFQUFFLENBQUM7QUFFcEIsSUFBTSxXQUFXLEdBQUcsRUFBVyxDQUFDO0FBRWhDOztHQUVHO0FBQ0gsSUFBSSxhQUFhLEdBQXVCLFNBQVMsQ0FBQztBQUVsRCxTQUFTLGVBQWU7SUFDdEIsSUFBSSxhQUFhLEtBQUssU0FBUyxFQUFFO1FBQy9CLGFBQWEsR0FBRyxJQUFJLFlBQVksRUFBRSxDQUFDO0tBQ3BDO0lBQ0QsT0FB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QUFDO0FBRUQsTUFBTSxVQUFVLGNBQWMsQ0FBQyxLQUFxQjtJQUNsRCxPQUFPLE9BQU8sS0FBSyxLQUFLLFVBQVUsQ0FBQztBQUNyQyxDQUFDO0FBRUQsTUFBTSxVQUFVLGVBQWUsQ0FBQyxLQUFxQjtJQUNuRCxPQUFPLENBQUMsQ0FBRSxLQUE2QyxDQUFDLFFBQVEsQ0FBQztBQUNuRSxDQUFDO0FBRUQsU0FBUyxPQUFPLENBQUMsS0FBZ0U7SUFFL0UsT0FBTyxDQUFDLENBQUUsS0FBYSxDQUFDLElBQUksQ0FBQztBQUMvQixDQUFDO0FBRUQsU0FBUyxZQUFZLENBQUMsS0FBVTtJQUM5QixPQUFPLEtBQUssS0FBSyxJQUFJLElBQUksT0FBTyxLQUFLLEtBQUssUUFBUTtRQUM5QyxPQUFPLEtBQW1CLENBQUMsV0FBVyxLQUFLLFVBQVUsQ0FBQztBQUM1RCxDQUFDO0FBRUQsU0FBUyxxQkFBcUIsQ0FBQyxLQUFVO0lBQ3ZDLE9BQU8sQ0FBQyxPQUFPLEtBQUssS0FBSyxVQUFVLENBQUM7UUFDaEMsQ0FBQyxPQUFPLEtBQUssS0FBSyxRQUFRLElBQUksS0FBSyxZQUFZLGNBQWMsQ0FBQyxDQUFDO0FBQ3JFLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7T25EZXN0cm95fSBmcm9tICcuLi9pbnRlcmZhY2UvbGlmZWN5Y2xlX2hvb2tzJztcbmltcG9ydCB7VHlwZX0gZnJvbSAnLi4vaW50ZXJmYWNlL3R5cGUnO1xuaW1wb3J0IHt0aHJvd0N5Y2xpY0RlcGVuZGVuY3lFcnJvciwgdGhyb3dJbnZhbGlkUHJvdmlkZXJFcnJvciwgdGhyb3dNaXhlZE11bHRpUHJvdmlkZXJFcnJvcn0gZnJvbSAnLi4vcmVuZGVyMy9lcnJvcnMnO1xuaW1wb3J0IHtzdHJpbmdpZnl9IGZyb20gJy4uL3V0aWwvc3RyaW5naWZ5JztcblxuaW1wb3J0IHtyZXNvbHZlRm9yd2FyZFJlZn0gZnJvbSAnLi9mb3J3YXJkX3JlZic7XG5pbXBvcnQge0luamVjdGlvblRva2VufSBmcm9tICcuL2luamVjdGlvbl90b2tlbic7XG5pbXBvcnQge0luamVjdG9yfSBmcm9tICcuL2luamVjdG9yJztcbmltcG9ydCB7SU5KRUNUT1IsIE5HX1RFTVBfVE9LRU5fUEFUSCwgTnVsbEluamVjdG9yLCBUSFJPV19JRl9OT1RfRk9VTkQsIFVTRV9WQUxVRSwgY2F0Y2hJbmplY3RvckVycm9yLCBpbmplY3RBcmdzLCBzZXRDdXJyZW50SW5qZWN0b3IsIM6UaW5qZWN0fSBmcm9tICcuL2luamVjdG9yX2NvbXBhdGliaWxpdHknO1xuaW1wb3J0IHtJbmplY3RhYmxlVHlwZSwgSW5qZWN0b3JUeXBlLCBJbmplY3RvclR5cGVXaXRoUHJvdmlkZXJzLCBnZXRJbmplY3RhYmxlRGVmLCBnZXRJbmplY3RvckRlZiwgzpRJbmplY3RhYmxlRGVmfSBmcm9tICcuL2ludGVyZmFjZS9kZWZzJztcbmltcG9ydCB7SW5qZWN0RmxhZ3N9IGZyb20gJy4vaW50ZXJmYWNlL2luamVjdG9yJztcbmltcG9ydCB7Q2xhc3NQcm92aWRlciwgQ29uc3RydWN0b3JQcm92aWRlciwgRXhpc3RpbmdQcm92aWRlciwgRmFjdG9yeVByb3ZpZGVyLCBTdGF0aWNDbGFzc1Byb3ZpZGVyLCBTdGF0aWNQcm92aWRlciwgVHlwZVByb3ZpZGVyLCBWYWx1ZVByb3ZpZGVyfSBmcm9tICcuL2ludGVyZmFjZS9wcm92aWRlcic7XG5pbXBvcnQge0FQUF9ST09UfSBmcm9tICcuL3Njb3BlJztcblxuXG5cbi8qKlxuICogSW50ZXJuYWwgdHlwZSBmb3IgYSBzaW5nbGUgcHJvdmlkZXIgaW4gYSBkZWVwIHByb3ZpZGVyIGFycmF5LlxuICovXG50eXBlIFNpbmdsZVByb3ZpZGVyID0gVHlwZVByb3ZpZGVyIHwgVmFsdWVQcm92aWRlciB8IENsYXNzUHJvdmlkZXIgfCBDb25zdHJ1Y3RvclByb3ZpZGVyIHxcbiAgICBFeGlzdGluZ1Byb3ZpZGVyIHwgRmFjdG9yeVByb3ZpZGVyIHwgU3RhdGljQ2xhc3NQcm92aWRlcjtcblxuLyoqXG4gKiBNYXJrZXIgd2hpY2ggaW5kaWNhdGVzIHRoYXQgYSB2YWx1ZSBoYXMgbm90IHlldCBiZWVuIGNyZWF0ZWQgZnJvbSB0aGUgZmFjdG9yeSBmdW5jdGlvbi5cbiAqL1xuY29uc3QgTk9UX1lFVCA9IHt9O1xuXG4vKipcbiAqIE1hcmtlciB3aGljaCBpbmRpY2F0ZXMgdGhhdCB0aGUgZmFjdG9yeSBmdW5jdGlvbiBmb3IgYSB0b2tlbiBpcyBpbiB0aGUgcHJvY2VzcyBvZiBiZWluZyBjYWxsZWQuXG4gKlxuICogSWYgdGhlIGluamVjdG9yIGlzIGFza2VkIHRvIGluamVjdCBhIHRva2VuIHdpdGggaXRzIHZhbHVlIHNldCB0byBDSVJDVUxBUiwgdGhhdCBpbmRpY2F0ZXNcbiAqIGluamVjdGlvbiBvZiBhIGRlcGVuZGVuY3kgaGFzIHJlY3Vyc2l2ZWx5IGF0dGVtcHRlZCB0byBpbmplY3QgdGhlIG9yaWdpbmFsIHRva2VuLCBhbmQgdGhlcmUgaXNcbiAqIGEgY2lyY3VsYXIgZGVwZW5kZW5jeSBhbW9uZyB0aGUgcHJvdmlkZXJzLlxuICovXG5jb25zdCBDSVJDVUxBUiA9IHt9O1xuXG5jb25zdCBFTVBUWV9BUlJBWSA9IFtdIGFzIGFueVtdO1xuXG4vKipcbiAqIEEgbGF6aWx5IGluaXRpYWxpemVkIE51bGxJbmplY3Rvci5cbiAqL1xubGV0IE5VTExfSU5KRUNUT1I6IEluamVjdG9yfHVuZGVmaW5lZCA9IHVuZGVmaW5lZDtcblxuZnVuY3Rpb24gZ2V0TnVsbEluamVjdG9yKCk6IEluamVjdG9yIHtcbiAgaWYgKE5VTExfSU5KRUNUT1IgPT09IHVuZGVmaW5lZCkge1xuICAgIE5VTExfSU5KRUNUT1IgPSBuZXcgTnVsbEluamVjdG9yKCk7XG4gIH1cbiAgcmV0dXJuIE5VTExfSU5KRUNUT1I7XG59XG5cbi8qKlxuICogQW4gZW50cnkgaW4gdGhlIGluamVjdG9yIHdoaWNoIHRyYWNrcyBpbmZvcm1hdGlvbiBhYm91dCB0aGUgZ2l2ZW4gdG9rZW4sIGluY2x1ZGluZyBhIHBvc3NpYmxlXG4gKiBjdXJyZW50IHZhbHVlLlxuICovXG5pbnRlcmZhY2UgUmVjb3JkPFQ+IHtcbiAgZmFjdG9yeTogKCgpID0+IFQpfHVuZGVmaW5lZDtcbiAgdmFsdWU6IFR8e307XG4gIG11bHRpOiBhbnlbXXx1bmRlZmluZWQ7XG59XG5cbi8qKlxuICogQ3JlYXRlIGEgbmV3IGBJbmplY3RvcmAgd2hpY2ggaXMgY29uZmlndXJlZCB1c2luZyBhIGBkZWZUeXBlYCBvZiBgSW5qZWN0b3JUeXBlPGFueT5gcy5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVJbmplY3RvcihcbiAgICBkZWZUeXBlOiAvKiBJbmplY3RvclR5cGU8YW55PiAqLyBhbnksIHBhcmVudDogSW5qZWN0b3IgfCBudWxsID0gbnVsbCxcbiAgICBhZGRpdGlvbmFsUHJvdmlkZXJzOiBTdGF0aWNQcm92aWRlcltdIHwgbnVsbCA9IG51bGwsIG5hbWU/OiBzdHJpbmcpOiBJbmplY3RvciB7XG4gIHBhcmVudCA9IHBhcmVudCB8fCBnZXROdWxsSW5qZWN0b3IoKTtcbiAgcmV0dXJuIG5ldyBSM0luamVjdG9yKGRlZlR5cGUsIGFkZGl0aW9uYWxQcm92aWRlcnMsIHBhcmVudCwgbmFtZSk7XG59XG5cbmV4cG9ydCBjbGFzcyBSM0luamVjdG9yIHtcbiAgLyoqXG4gICAqIE1hcCBvZiB0b2tlbnMgdG8gcmVjb3JkcyB3aGljaCBjb250YWluIHRoZSBpbnN0YW5jZXMgb2YgdGhvc2UgdG9rZW5zLlxuICAgKi9cbiAgcHJpdmF0ZSByZWNvcmRzID0gbmV3IE1hcDxUeXBlPGFueT58SW5qZWN0aW9uVG9rZW48YW55PiwgUmVjb3JkPGFueT4+KCk7XG5cbiAgLyoqXG4gICAqIFRoZSB0cmFuc2l0aXZlIHNldCBvZiBgSW5qZWN0b3JUeXBlYHMgd2hpY2ggZGVmaW5lIHRoaXMgaW5qZWN0b3IuXG4gICAqL1xuICBwcml2YXRlIGluamVjdG9yRGVmVHlwZXMgPSBuZXcgU2V0PEluamVjdG9yVHlwZTxhbnk+PigpO1xuXG4gIC8qKlxuICAgKiBTZXQgb2YgdmFsdWVzIGluc3RhbnRpYXRlZCBieSB0aGlzIGluamVjdG9yIHdoaWNoIGNvbnRhaW4gYG5nT25EZXN0cm95YCBsaWZlY3ljbGUgaG9va3MuXG4gICAqL1xuICBwcml2YXRlIG9uRGVzdHJveSA9IG5ldyBTZXQ8T25EZXN0cm95PigpO1xuXG4gIC8qKlxuICAgKiBGbGFnIGluZGljYXRpbmcgdGhpcyBpbmplY3RvciBwcm92aWRlcyB0aGUgQVBQX1JPT1RfU0NPUEUgdG9rZW4sIGFuZCB0aHVzIGNvdW50cyBhcyB0aGVcbiAgICogcm9vdCBzY29wZS5cbiAgICovXG4gIHByaXZhdGUgcmVhZG9ubHkgaXNSb290SW5qZWN0b3I6IGJvb2xlYW47XG5cbiAgcmVhZG9ubHkgc291cmNlOiBzdHJpbmd8bnVsbDtcblxuICAvKipcbiAgICogRmxhZyBpbmRpY2F0aW5nIHRoYXQgdGhpcyBpbmplY3RvciB3YXMgcHJldmlvdXNseSBkZXN0cm95ZWQuXG4gICAqL1xuICBnZXQgZGVzdHJveWVkKCk6IGJvb2xlYW4geyByZXR1cm4gdGhpcy5fZGVzdHJveWVkOyB9XG4gIHByaXZhdGUgX2Rlc3Ryb3llZCA9IGZhbHNlO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgICAgZGVmOiBJbmplY3RvclR5cGU8YW55PiwgYWRkaXRpb25hbFByb3ZpZGVyczogU3RhdGljUHJvdmlkZXJbXXxudWxsLCByZWFkb25seSBwYXJlbnQ6IEluamVjdG9yLFxuICAgICAgc291cmNlOiBzdHJpbmd8bnVsbCA9IG51bGwpIHtcbiAgICAvLyBTdGFydCBvZmYgYnkgY3JlYXRpbmcgUmVjb3JkcyBmb3IgZXZlcnkgcHJvdmlkZXIgZGVjbGFyZWQgaW4gZXZlcnkgSW5qZWN0b3JUeXBlXG4gICAgLy8gaW5jbHVkZWQgdHJhbnNpdGl2ZWx5IGluIGBkZWZgLlxuICAgIGNvbnN0IGRlZHVwU3RhY2s6IEluamVjdG9yVHlwZTxhbnk+W10gPSBbXTtcbiAgICBkZWVwRm9yRWFjaChbZGVmXSwgaW5qZWN0b3JEZWYgPT4gdGhpcy5wcm9jZXNzSW5qZWN0b3JUeXBlKGluamVjdG9yRGVmLCBbXSwgZGVkdXBTdGFjaykpO1xuXG4gICAgYWRkaXRpb25hbFByb3ZpZGVycyAmJiBkZWVwRm9yRWFjaChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhZGRpdGlvbmFsUHJvdmlkZXJzLCBwcm92aWRlciA9PiB0aGlzLnByb2Nlc3NQcm92aWRlcihcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvdmlkZXIsIGRlZiwgYWRkaXRpb25hbFByb3ZpZGVycykpO1xuXG5cbiAgICAvLyBNYWtlIHN1cmUgdGhlIElOSkVDVE9SIHRva2VuIHByb3ZpZGVzIHRoaXMgaW5qZWN0b3IuXG4gICAgdGhpcy5yZWNvcmRzLnNldChJTkpFQ1RPUiwgbWFrZVJlY29yZCh1bmRlZmluZWQsIHRoaXMpKTtcblxuICAgIC8vIERldGVjdCB3aGV0aGVyIHRoaXMgaW5qZWN0b3IgaGFzIHRoZSBBUFBfUk9PVF9TQ09QRSB0b2tlbiBhbmQgdGh1cyBzaG91bGQgcHJvdmlkZVxuICAgIC8vIGFueSBpbmplY3RhYmxlIHNjb3BlZCB0byBBUFBfUk9PVF9TQ09QRS5cbiAgICB0aGlzLmlzUm9vdEluamVjdG9yID0gdGhpcy5yZWNvcmRzLmhhcyhBUFBfUk9PVCk7XG5cbiAgICAvLyBFYWdlcmx5IGluc3RhbnRpYXRlIHRoZSBJbmplY3RvclR5cGUgY2xhc3NlcyB0aGVtc2VsdmVzLlxuICAgIHRoaXMuaW5qZWN0b3JEZWZUeXBlcy5mb3JFYWNoKGRlZlR5cGUgPT4gdGhpcy5nZXQoZGVmVHlwZSkpO1xuXG4gICAgLy8gU291cmNlIG5hbWUsIHVzZWQgZm9yIGRlYnVnZ2luZ1xuICAgIHRoaXMuc291cmNlID0gc291cmNlIHx8ICh0eXBlb2YgZGVmID09PSAnb2JqZWN0JyA/IG51bGwgOiBzdHJpbmdpZnkoZGVmKSk7XG4gIH1cblxuICAvKipcbiAgICogRGVzdHJveSB0aGUgaW5qZWN0b3IgYW5kIHJlbGVhc2UgcmVmZXJlbmNlcyB0byBldmVyeSBpbnN0YW5jZSBvciBwcm92aWRlciBhc3NvY2lhdGVkIHdpdGggaXQuXG4gICAqXG4gICAqIEFsc28gY2FsbHMgdGhlIGBPbkRlc3Ryb3lgIGxpZmVjeWNsZSBob29rcyBvZiBldmVyeSBpbnN0YW5jZSB0aGF0IHdhcyBjcmVhdGVkIGZvciB3aGljaCBhXG4gICAqIGhvb2sgd2FzIGZvdW5kLlxuICAgKi9cbiAgZGVzdHJveSgpOiB2b2lkIHtcbiAgICB0aGlzLmFzc2VydE5vdERlc3Ryb3llZCgpO1xuXG4gICAgLy8gU2V0IGRlc3Ryb3llZCA9IHRydWUgZmlyc3QsIGluIGNhc2UgbGlmZWN5Y2xlIGhvb2tzIHJlLWVudGVyIGRlc3Ryb3koKS5cbiAgICB0aGlzLl9kZXN0cm95ZWQgPSB0cnVlO1xuICAgIHRyeSB7XG4gICAgICAvLyBDYWxsIGFsbCB0aGUgbGlmZWN5Y2xlIGhvb2tzLlxuICAgICAgdGhpcy5vbkRlc3Ryb3kuZm9yRWFjaChzZXJ2aWNlID0+IHNlcnZpY2UubmdPbkRlc3Ryb3koKSk7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIC8vIFJlbGVhc2UgYWxsIHJlZmVyZW5jZXMuXG4gICAgICB0aGlzLnJlY29yZHMuY2xlYXIoKTtcbiAgICAgIHRoaXMub25EZXN0cm95LmNsZWFyKCk7XG4gICAgICB0aGlzLmluamVjdG9yRGVmVHlwZXMuY2xlYXIoKTtcbiAgICB9XG4gIH1cblxuICBnZXQ8VD4oXG4gICAgICB0b2tlbjogVHlwZTxUPnxJbmplY3Rpb25Ub2tlbjxUPiwgbm90Rm91bmRWYWx1ZTogYW55ID0gVEhST1dfSUZfTk9UX0ZPVU5ELFxuICAgICAgZmxhZ3MgPSBJbmplY3RGbGFncy5EZWZhdWx0KTogVCB7XG4gICAgdGhpcy5hc3NlcnROb3REZXN0cm95ZWQoKTtcbiAgICAvLyBTZXQgdGhlIGluamVjdGlvbiBjb250ZXh0LlxuICAgIGNvbnN0IHByZXZpb3VzSW5qZWN0b3IgPSBzZXRDdXJyZW50SW5qZWN0b3IodGhpcyk7XG4gICAgdHJ5IHtcbiAgICAgIC8vIENoZWNrIGZvciB0aGUgU2tpcFNlbGYgZmxhZy5cbiAgICAgIGlmICghKGZsYWdzICYgSW5qZWN0RmxhZ3MuU2tpcFNlbGYpKSB7XG4gICAgICAgIC8vIFNraXBTZWxmIGlzbid0IHNldCwgY2hlY2sgaWYgdGhlIHJlY29yZCBiZWxvbmdzIHRvIHRoaXMgaW5qZWN0b3IuXG4gICAgICAgIGxldCByZWNvcmQ6IFJlY29yZDxUPnx1bmRlZmluZWQgPSB0aGlzLnJlY29yZHMuZ2V0KHRva2VuKTtcbiAgICAgICAgaWYgKHJlY29yZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgLy8gTm8gcmVjb3JkLCBidXQgbWF5YmUgdGhlIHRva2VuIGlzIHNjb3BlZCB0byB0aGlzIGluamVjdG9yLiBMb29rIGZvciBhbiBuZ0luamVjdGFibGVEZWZcbiAgICAgICAgICAvLyB3aXRoIGEgc2NvcGUgbWF0Y2hpbmcgdGhpcyBpbmplY3Rvci5cbiAgICAgICAgICBjb25zdCBkZWYgPSBjb3VsZEJlSW5qZWN0YWJsZVR5cGUodG9rZW4pICYmIGdldEluamVjdGFibGVEZWYodG9rZW4pO1xuICAgICAgICAgIGlmIChkZWYgJiYgdGhpcy5pbmplY3RhYmxlRGVmSW5TY29wZShkZWYpKSB7XG4gICAgICAgICAgICAvLyBGb3VuZCBhbiBuZ0luamVjdGFibGVEZWYgYW5kIGl0J3Mgc2NvcGVkIHRvIHRoaXMgaW5qZWN0b3IuIFByZXRlbmQgYXMgaWYgaXQgd2FzIGhlcmVcbiAgICAgICAgICAgIC8vIGFsbCBhbG9uZy5cbiAgICAgICAgICAgIHJlY29yZCA9IG1ha2VSZWNvcmQoaW5qZWN0YWJsZURlZk9ySW5qZWN0b3JEZWZGYWN0b3J5KHRva2VuKSwgTk9UX1lFVCk7XG4gICAgICAgICAgICB0aGlzLnJlY29yZHMuc2V0KHRva2VuLCByZWNvcmQpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAvLyBJZiBhIHJlY29yZCB3YXMgZm91bmQsIGdldCB0aGUgaW5zdGFuY2UgZm9yIGl0IGFuZCByZXR1cm4gaXQuXG4gICAgICAgIGlmIChyZWNvcmQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIHJldHVybiB0aGlzLmh5ZHJhdGUodG9rZW4sIHJlY29yZCk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gU2VsZWN0IHRoZSBuZXh0IGluamVjdG9yIGJhc2VkIG9uIHRoZSBTZWxmIGZsYWcgLSBpZiBzZWxmIGlzIHNldCwgdGhlIG5leHQgaW5qZWN0b3IgaXNcbiAgICAgIC8vIHRoZSBOdWxsSW5qZWN0b3IsIG90aGVyd2lzZSBpdCdzIHRoZSBwYXJlbnQuXG4gICAgICBjb25zdCBuZXh0SW5qZWN0b3IgPSAhKGZsYWdzICYgSW5qZWN0RmxhZ3MuU2VsZikgPyB0aGlzLnBhcmVudCA6IGdldE51bGxJbmplY3RvcigpO1xuICAgICAgcmV0dXJuIG5leHRJbmplY3Rvci5nZXQodG9rZW4sIGZsYWdzICYgSW5qZWN0RmxhZ3MuT3B0aW9uYWwgPyBudWxsIDogbm90Rm91bmRWYWx1ZSk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgaWYgKGUubmFtZSA9PT0gJ051bGxJbmplY3RvckVycm9yJykge1xuICAgICAgICBjb25zdCBwYXRoOiBhbnlbXSA9IGVbTkdfVEVNUF9UT0tFTl9QQVRIXSA9IGVbTkdfVEVNUF9UT0tFTl9QQVRIXSB8fCBbXTtcbiAgICAgICAgcGF0aC51bnNoaWZ0KHN0cmluZ2lmeSh0b2tlbikpO1xuICAgICAgICBpZiAocHJldmlvdXNJbmplY3Rvcikge1xuICAgICAgICAgIC8vIFdlIHN0aWxsIGhhdmUgYSBwYXJlbnQgaW5qZWN0b3IsIGtlZXAgdGhyb3dpbmdcbiAgICAgICAgICB0aHJvdyBlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIEZvcm1hdCAmIHRocm93IHRoZSBmaW5hbCBlcnJvciBtZXNzYWdlIHdoZW4gd2UgZG9uJ3QgaGF2ZSBhbnkgcHJldmlvdXMgaW5qZWN0b3JcbiAgICAgICAgICByZXR1cm4gY2F0Y2hJbmplY3RvckVycm9yKGUsIHRva2VuLCAnUjNJbmplY3RvckVycm9yJywgdGhpcy5zb3VyY2UpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyBlO1xuICAgICAgfVxuICAgIH0gZmluYWxseSB7XG4gICAgICAvLyBMYXN0bHksIGNsZWFuIHVwIHRoZSBzdGF0ZSBieSByZXN0b3JpbmcgdGhlIHByZXZpb3VzIGluamVjdG9yLlxuICAgICAgc2V0Q3VycmVudEluamVjdG9yKHByZXZpb3VzSW5qZWN0b3IpO1xuICAgIH1cbiAgfVxuXG4gIHRvU3RyaW5nKCkge1xuICAgIGNvbnN0IHRva2VucyA9IDxzdHJpbmdbXT5bXSwgcmVjb3JkcyA9IHRoaXMucmVjb3JkcztcbiAgICByZWNvcmRzLmZvckVhY2goKHYsIHRva2VuKSA9PiB0b2tlbnMucHVzaChzdHJpbmdpZnkodG9rZW4pKSk7XG4gICAgcmV0dXJuIGBSM0luamVjdG9yWyR7dG9rZW5zLmpvaW4oJywgJyl9XWA7XG4gIH1cblxuICBwcml2YXRlIGFzc2VydE5vdERlc3Ryb3llZCgpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5fZGVzdHJveWVkKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0luamVjdG9yIGhhcyBhbHJlYWR5IGJlZW4gZGVzdHJveWVkLicpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBBZGQgYW4gYEluamVjdG9yVHlwZWAgb3IgYEluamVjdG9yRGVmVHlwZVdpdGhQcm92aWRlcnNgIGFuZCBhbGwgb2YgaXRzIHRyYW5zaXRpdmUgcHJvdmlkZXJzXG4gICAqIHRvIHRoaXMgaW5qZWN0b3IuXG4gICAqL1xuICBwcml2YXRlIHByb2Nlc3NJbmplY3RvclR5cGUoXG4gICAgICBkZWZPcldyYXBwZWREZWY6IEluamVjdG9yVHlwZTxhbnk+fEluamVjdG9yVHlwZVdpdGhQcm92aWRlcnM8YW55PixcbiAgICAgIHBhcmVudHM6IEluamVjdG9yVHlwZTxhbnk+W10sIGRlZHVwU3RhY2s6IEluamVjdG9yVHlwZTxhbnk+W10pIHtcbiAgICBkZWZPcldyYXBwZWREZWYgPSByZXNvbHZlRm9yd2FyZFJlZihkZWZPcldyYXBwZWREZWYpO1xuICAgIGlmICghZGVmT3JXcmFwcGVkRGVmKSByZXR1cm47XG5cbiAgICAvLyBFaXRoZXIgdGhlIGRlZk9yV3JhcHBlZERlZiBpcyBhbiBJbmplY3RvclR5cGUgKHdpdGggbmdJbmplY3RvckRlZikgb3IgYW5cbiAgICAvLyBJbmplY3RvckRlZlR5cGVXaXRoUHJvdmlkZXJzIChha2EgTW9kdWxlV2l0aFByb3ZpZGVycykuIERldGVjdGluZyBlaXRoZXIgaXMgYSBtZWdhbW9ycGhpY1xuICAgIC8vIHJlYWQsIHNvIGNhcmUgaXMgdGFrZW4gdG8gb25seSBkbyB0aGUgcmVhZCBvbmNlLlxuXG4gICAgLy8gRmlyc3QgYXR0ZW1wdCB0byByZWFkIHRoZSBuZ0luamVjdG9yRGVmLlxuICAgIGxldCBkZWYgPSBnZXRJbmplY3RvckRlZihkZWZPcldyYXBwZWREZWYpO1xuXG4gICAgLy8gSWYgdGhhdCdzIG5vdCBwcmVzZW50LCB0aGVuIGF0dGVtcHQgdG8gcmVhZCBuZ01vZHVsZSBmcm9tIHRoZSBJbmplY3RvckRlZlR5cGVXaXRoUHJvdmlkZXJzLlxuICAgIGNvbnN0IG5nTW9kdWxlID1cbiAgICAgICAgKGRlZiA9PSBudWxsKSAmJiAoZGVmT3JXcmFwcGVkRGVmIGFzIEluamVjdG9yVHlwZVdpdGhQcm92aWRlcnM8YW55PikubmdNb2R1bGUgfHwgdW5kZWZpbmVkO1xuXG4gICAgLy8gRGV0ZXJtaW5lIHRoZSBJbmplY3RvclR5cGUuIEluIHRoZSBjYXNlIHdoZXJlIGBkZWZPcldyYXBwZWREZWZgIGlzIGFuIGBJbmplY3RvclR5cGVgLFxuICAgIC8vIHRoZW4gdGhpcyBpcyBlYXN5LiBJbiB0aGUgY2FzZSBvZiBhbiBJbmplY3RvckRlZlR5cGVXaXRoUHJvdmlkZXJzLCB0aGVuIHRoZSBkZWZpbml0aW9uIHR5cGVcbiAgICAvLyBpcyB0aGUgYG5nTW9kdWxlYC5cbiAgICBjb25zdCBkZWZUeXBlOiBJbmplY3RvclR5cGU8YW55PiA9XG4gICAgICAgIChuZ01vZHVsZSA9PT0gdW5kZWZpbmVkKSA/IChkZWZPcldyYXBwZWREZWYgYXMgSW5qZWN0b3JUeXBlPGFueT4pIDogbmdNb2R1bGU7XG5cbiAgICAvLyBDaGVjayBmb3IgY2lyY3VsYXIgZGVwZW5kZW5jaWVzLlxuICAgIC8vIFRPRE8oRlctMTMwNyk6IFJlLWFkZCBuZ0Rldk1vZGUgd2hlbiBjbG9zdXJlIGNhbiBoYW5kbGUgaXRcbiAgICBpZiAocGFyZW50cy5pbmRleE9mKGRlZlR5cGUpICE9PSAtMSkge1xuICAgICAgY29uc3QgZGVmTmFtZSA9IHN0cmluZ2lmeShkZWZUeXBlKTtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICBgQ2lyY3VsYXIgZGVwZW5kZW5jeSBpbiBESSBkZXRlY3RlZCBmb3IgdHlwZSAke2RlZk5hbWV9LiBEZXBlbmRlbmN5IHBhdGg6ICR7cGFyZW50cy5tYXAoZGVmVHlwZSA9PiBzdHJpbmdpZnkoZGVmVHlwZSkpLmpvaW4oJyA+ICcpfSA+ICR7ZGVmTmFtZX0uYCk7XG4gICAgfVxuXG4gICAgLy8gQ2hlY2sgZm9yIG11bHRpcGxlIGltcG9ydHMgb2YgdGhlIHNhbWUgbW9kdWxlXG4gICAgY29uc3QgaXNEdXBsaWNhdGUgPSBkZWR1cFN0YWNrLmluZGV4T2YoZGVmVHlwZSkgIT09IC0xO1xuXG4gICAgLy8gSWYgZGVmT3JXcmFwcGVkVHlwZSB3YXMgYW4gSW5qZWN0b3JEZWZUeXBlV2l0aFByb3ZpZGVycywgdGhlbiAucHJvdmlkZXJzIG1heSBob2xkIHNvbWVcbiAgICAvLyBleHRyYSBwcm92aWRlcnMuXG4gICAgY29uc3QgcHJvdmlkZXJzID1cbiAgICAgICAgKG5nTW9kdWxlICE9PSB1bmRlZmluZWQpICYmIChkZWZPcldyYXBwZWREZWYgYXMgSW5qZWN0b3JUeXBlV2l0aFByb3ZpZGVyczxhbnk+KS5wcm92aWRlcnMgfHxcbiAgICAgICAgRU1QVFlfQVJSQVk7XG5cbiAgICAvLyBGaW5hbGx5LCBpZiBkZWZPcldyYXBwZWRUeXBlIHdhcyBhbiBgSW5qZWN0b3JEZWZUeXBlV2l0aFByb3ZpZGVyc2AsIHRoZW4gdGhlIGFjdHVhbFxuICAgIC8vIGBJbmplY3RvckRlZmAgaXMgb24gaXRzIGBuZ01vZHVsZWAuXG4gICAgaWYgKG5nTW9kdWxlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGRlZiA9IGdldEluamVjdG9yRGVmKG5nTW9kdWxlKTtcbiAgICB9XG5cbiAgICAvLyBJZiBubyBkZWZpbml0aW9uIHdhcyBmb3VuZCwgaXQgbWlnaHQgYmUgZnJvbSBleHBvcnRzLiBSZW1vdmUgaXQuXG4gICAgaWYgKGRlZiA9PSBudWxsKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gVHJhY2sgdGhlIEluamVjdG9yVHlwZSBhbmQgYWRkIGEgcHJvdmlkZXIgZm9yIGl0LlxuICAgIHRoaXMuaW5qZWN0b3JEZWZUeXBlcy5hZGQoZGVmVHlwZSk7XG4gICAgdGhpcy5yZWNvcmRzLnNldChkZWZUeXBlLCBtYWtlUmVjb3JkKGRlZi5mYWN0b3J5LCBOT1RfWUVUKSk7XG5cbiAgICAvLyBBZGQgcHJvdmlkZXJzIGluIHRoZSBzYW1lIHdheSB0aGF0IEBOZ01vZHVsZSByZXNvbHV0aW9uIGRpZDpcblxuICAgIC8vIEZpcnN0LCBpbmNsdWRlIHByb3ZpZGVycyBmcm9tIGFueSBpbXBvcnRzLlxuICAgIGlmIChkZWYuaW1wb3J0cyAhPSBudWxsICYmICFpc0R1cGxpY2F0ZSkge1xuICAgICAgLy8gQmVmb3JlIHByb2Nlc3NpbmcgZGVmVHlwZSdzIGltcG9ydHMsIGFkZCBpdCB0byB0aGUgc2V0IG9mIHBhcmVudHMuIFRoaXMgd2F5LCBpZiBpdCBlbmRzXG4gICAgICAvLyB1cCBkZWVwbHkgaW1wb3J0aW5nIGl0c2VsZiwgdGhpcyBjYW4gYmUgZGV0ZWN0ZWQuXG4gICAgICAvLyBUT0RPKEZXLTEzMDcpOiBSZS1hZGQgbmdEZXZNb2RlIHdoZW4gY2xvc3VyZSBjYW4gaGFuZGxlIGl0XG4gICAgICBwYXJlbnRzLnB1c2goZGVmVHlwZSk7XG4gICAgICAvLyBBZGQgaXQgdG8gdGhlIHNldCBvZiBkZWR1cHMuIFRoaXMgd2F5IHdlIGNhbiBkZXRlY3QgbXVsdGlwbGUgaW1wb3J0cyBvZiB0aGUgc2FtZSBtb2R1bGVcbiAgICAgIGRlZHVwU3RhY2sucHVzaChkZWZUeXBlKTtcblxuICAgICAgdHJ5IHtcbiAgICAgICAgZGVlcEZvckVhY2goXG4gICAgICAgICAgICBkZWYuaW1wb3J0cywgaW1wb3J0ZWQgPT4gdGhpcy5wcm9jZXNzSW5qZWN0b3JUeXBlKGltcG9ydGVkLCBwYXJlbnRzLCBkZWR1cFN0YWNrKSk7XG4gICAgICB9IGZpbmFsbHkge1xuICAgICAgICAvLyBSZW1vdmUgaXQgZnJvbSB0aGUgcGFyZW50cyBzZXQgd2hlbiBmaW5pc2hlZC5cbiAgICAgICAgLy8gVE9ETyhGVy0xMzA3KTogUmUtYWRkIG5nRGV2TW9kZSB3aGVuIGNsb3N1cmUgY2FuIGhhbmRsZSBpdFxuICAgICAgICBwYXJlbnRzLnBvcCgpO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIE5leHQsIGluY2x1ZGUgcHJvdmlkZXJzIGxpc3RlZCBvbiB0aGUgZGVmaW5pdGlvbiBpdHNlbGYuXG4gICAgY29uc3QgZGVmUHJvdmlkZXJzID0gZGVmLnByb3ZpZGVycztcbiAgICBpZiAoZGVmUHJvdmlkZXJzICE9IG51bGwgJiYgIWlzRHVwbGljYXRlKSB7XG4gICAgICBjb25zdCBpbmplY3RvclR5cGUgPSBkZWZPcldyYXBwZWREZWYgYXMgSW5qZWN0b3JUeXBlPGFueT47XG4gICAgICBkZWVwRm9yRWFjaChcbiAgICAgICAgICBkZWZQcm92aWRlcnMsIHByb3ZpZGVyID0+IHRoaXMucHJvY2Vzc1Byb3ZpZGVyKHByb3ZpZGVyLCBpbmplY3RvclR5cGUsIGRlZlByb3ZpZGVycykpO1xuICAgIH1cblxuICAgIC8vIEZpbmFsbHksIGluY2x1ZGUgcHJvdmlkZXJzIGZyb20gYW4gSW5qZWN0b3JEZWZUeXBlV2l0aFByb3ZpZGVycyBpZiB0aGVyZSB3YXMgb25lLlxuICAgIGNvbnN0IG5nTW9kdWxlVHlwZSA9IChkZWZPcldyYXBwZWREZWYgYXMgSW5qZWN0b3JUeXBlV2l0aFByb3ZpZGVyczxhbnk+KS5uZ01vZHVsZTtcbiAgICBkZWVwRm9yRWFjaChwcm92aWRlcnMsIHByb3ZpZGVyID0+IHRoaXMucHJvY2Vzc1Byb3ZpZGVyKHByb3ZpZGVyLCBuZ01vZHVsZVR5cGUsIHByb3ZpZGVycykpO1xuICB9XG5cbiAgLyoqXG4gICAqIFByb2Nlc3MgYSBgU2luZ2xlUHJvdmlkZXJgIGFuZCBhZGQgaXQuXG4gICAqL1xuICBwcml2YXRlIHByb2Nlc3NQcm92aWRlcihcbiAgICAgIHByb3ZpZGVyOiBTaW5nbGVQcm92aWRlciwgbmdNb2R1bGVUeXBlOiBJbmplY3RvclR5cGU8YW55PiwgcHJvdmlkZXJzOiBhbnlbXSk6IHZvaWQge1xuICAgIC8vIERldGVybWluZSB0aGUgdG9rZW4gZnJvbSB0aGUgcHJvdmlkZXIuIEVpdGhlciBpdCdzIGl0cyBvd24gdG9rZW4sIG9yIGhhcyBhIHtwcm92aWRlOiAuLi59XG4gICAgLy8gcHJvcGVydHkuXG4gICAgcHJvdmlkZXIgPSByZXNvbHZlRm9yd2FyZFJlZihwcm92aWRlcik7XG4gICAgbGV0IHRva2VuOiBhbnkgPVxuICAgICAgICBpc1R5cGVQcm92aWRlcihwcm92aWRlcikgPyBwcm92aWRlciA6IHJlc29sdmVGb3J3YXJkUmVmKHByb3ZpZGVyICYmIHByb3ZpZGVyLnByb3ZpZGUpO1xuXG4gICAgLy8gQ29uc3RydWN0IGEgYFJlY29yZGAgZm9yIHRoZSBwcm92aWRlci5cbiAgICBjb25zdCByZWNvcmQgPSBwcm92aWRlclRvUmVjb3JkKHByb3ZpZGVyLCBuZ01vZHVsZVR5cGUsIHByb3ZpZGVycyk7XG5cbiAgICBpZiAoIWlzVHlwZVByb3ZpZGVyKHByb3ZpZGVyKSAmJiBwcm92aWRlci5tdWx0aSA9PT0gdHJ1ZSkge1xuICAgICAgLy8gSWYgdGhlIHByb3ZpZGVyIGluZGljYXRlcyB0aGF0IGl0J3MgYSBtdWx0aS1wcm92aWRlciwgcHJvY2VzcyBpdCBzcGVjaWFsbHkuXG4gICAgICAvLyBGaXJzdCBjaGVjayB3aGV0aGVyIGl0J3MgYmVlbiBkZWZpbmVkIGFscmVhZHkuXG4gICAgICBsZXQgbXVsdGlSZWNvcmQgPSB0aGlzLnJlY29yZHMuZ2V0KHRva2VuKTtcbiAgICAgIGlmIChtdWx0aVJlY29yZCkge1xuICAgICAgICAvLyBJdCBoYXMuIFRocm93IGEgbmljZSBlcnJvciBpZlxuICAgICAgICBpZiAobXVsdGlSZWNvcmQubXVsdGkgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIHRocm93TWl4ZWRNdWx0aVByb3ZpZGVyRXJyb3IoKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbXVsdGlSZWNvcmQgPSBtYWtlUmVjb3JkKHVuZGVmaW5lZCwgTk9UX1lFVCwgdHJ1ZSk7XG4gICAgICAgIG11bHRpUmVjb3JkLmZhY3RvcnkgPSAoKSA9PiBpbmplY3RBcmdzKG11bHRpUmVjb3JkICEubXVsdGkgISk7XG4gICAgICAgIHRoaXMucmVjb3Jkcy5zZXQodG9rZW4sIG11bHRpUmVjb3JkKTtcbiAgICAgIH1cbiAgICAgIHRva2VuID0gcHJvdmlkZXI7XG4gICAgICBtdWx0aVJlY29yZC5tdWx0aSAhLnB1c2gocHJvdmlkZXIpO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBleGlzdGluZyA9IHRoaXMucmVjb3Jkcy5nZXQodG9rZW4pO1xuICAgICAgaWYgKGV4aXN0aW5nICYmIGV4aXN0aW5nLm11bHRpICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgdGhyb3dNaXhlZE11bHRpUHJvdmlkZXJFcnJvcigpO1xuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLnJlY29yZHMuc2V0KHRva2VuLCByZWNvcmQpO1xuICB9XG5cbiAgcHJpdmF0ZSBoeWRyYXRlPFQ+KHRva2VuOiBUeXBlPFQ+fEluamVjdGlvblRva2VuPFQ+LCByZWNvcmQ6IFJlY29yZDxUPik6IFQge1xuICAgIGlmIChyZWNvcmQudmFsdWUgPT09IENJUkNVTEFSKSB7XG4gICAgICB0aHJvd0N5Y2xpY0RlcGVuZGVuY3lFcnJvcihzdHJpbmdpZnkodG9rZW4pKTtcbiAgICB9IGVsc2UgaWYgKHJlY29yZC52YWx1ZSA9PT0gTk9UX1lFVCkge1xuICAgICAgcmVjb3JkLnZhbHVlID0gQ0lSQ1VMQVI7XG4gICAgICByZWNvcmQudmFsdWUgPSByZWNvcmQuZmFjdG9yeSAhKCk7XG4gICAgfVxuICAgIGlmICh0eXBlb2YgcmVjb3JkLnZhbHVlID09PSAnb2JqZWN0JyAmJiByZWNvcmQudmFsdWUgJiYgaGFzT25EZXN0cm95KHJlY29yZC52YWx1ZSkpIHtcbiAgICAgIHRoaXMub25EZXN0cm95LmFkZChyZWNvcmQudmFsdWUpO1xuICAgIH1cbiAgICByZXR1cm4gcmVjb3JkLnZhbHVlIGFzIFQ7XG4gIH1cblxuICBwcml2YXRlIGluamVjdGFibGVEZWZJblNjb3BlKGRlZjogzpRJbmplY3RhYmxlRGVmPGFueT4pOiBib29sZWFuIHtcbiAgICBpZiAoIWRlZi5wcm92aWRlZEluKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSBlbHNlIGlmICh0eXBlb2YgZGVmLnByb3ZpZGVkSW4gPT09ICdzdHJpbmcnKSB7XG4gICAgICByZXR1cm4gZGVmLnByb3ZpZGVkSW4gPT09ICdhbnknIHx8IChkZWYucHJvdmlkZWRJbiA9PT0gJ3Jvb3QnICYmIHRoaXMuaXNSb290SW5qZWN0b3IpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gdGhpcy5pbmplY3RvckRlZlR5cGVzLmhhcyhkZWYucHJvdmlkZWRJbik7XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIGluamVjdGFibGVEZWZPckluamVjdG9yRGVmRmFjdG9yeSh0b2tlbjogVHlwZTxhbnk+fCBJbmplY3Rpb25Ub2tlbjxhbnk+KTogKCkgPT4gYW55IHtcbiAgY29uc3QgaW5qZWN0YWJsZURlZiA9IGdldEluamVjdGFibGVEZWYodG9rZW4gYXMgSW5qZWN0YWJsZVR5cGU8YW55Pik7XG4gIGlmIChpbmplY3RhYmxlRGVmID09PSBudWxsKSB7XG4gICAgY29uc3QgaW5qZWN0b3JEZWYgPSBnZXRJbmplY3RvckRlZih0b2tlbiBhcyBJbmplY3RvclR5cGU8YW55Pik7XG4gICAgaWYgKGluamVjdG9yRGVmICE9PSBudWxsKSB7XG4gICAgICByZXR1cm4gaW5qZWN0b3JEZWYuZmFjdG9yeTtcbiAgICB9IGVsc2UgaWYgKHRva2VuIGluc3RhbmNlb2YgSW5qZWN0aW9uVG9rZW4pIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgVG9rZW4gJHtzdHJpbmdpZnkodG9rZW4pfSBpcyBtaXNzaW5nIGFuIG5nSW5qZWN0YWJsZURlZiBkZWZpbml0aW9uLmApO1xuICAgIH0gZWxzZSBpZiAodG9rZW4gaW5zdGFuY2VvZiBGdW5jdGlvbikge1xuICAgICAgY29uc3QgcGFyYW1MZW5ndGggPSB0b2tlbi5sZW5ndGg7XG4gICAgICBpZiAocGFyYW1MZW5ndGggPiAwKSB7XG4gICAgICAgIGNvbnN0IGFyZ3M6IHN0cmluZ1tdID0gbmV3IEFycmF5KHBhcmFtTGVuZ3RoKS5maWxsKCc/Jyk7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICAgIGBDYW4ndCByZXNvbHZlIGFsbCBwYXJhbWV0ZXJzIGZvciAke3N0cmluZ2lmeSh0b2tlbil9OiAoJHthcmdzLmpvaW4oJywgJyl9KS5gKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiAoKSA9PiBuZXcgKHRva2VuIGFzIFR5cGU8YW55PikoKTtcbiAgICB9XG4gICAgdGhyb3cgbmV3IEVycm9yKCd1bnJlYWNoYWJsZScpO1xuICB9XG4gIHJldHVybiBpbmplY3RhYmxlRGVmLmZhY3Rvcnk7XG59XG5cbmZ1bmN0aW9uIHByb3ZpZGVyVG9SZWNvcmQoXG4gICAgcHJvdmlkZXI6IFNpbmdsZVByb3ZpZGVyLCBuZ01vZHVsZVR5cGU6IEluamVjdG9yVHlwZTxhbnk+LCBwcm92aWRlcnM6IGFueVtdKTogUmVjb3JkPGFueT4ge1xuICBsZXQgZmFjdG9yeTogKCgpID0+IGFueSl8dW5kZWZpbmVkID0gcHJvdmlkZXJUb0ZhY3RvcnkocHJvdmlkZXIsIG5nTW9kdWxlVHlwZSwgcHJvdmlkZXJzKTtcbiAgaWYgKGlzVmFsdWVQcm92aWRlcihwcm92aWRlcikpIHtcbiAgICByZXR1cm4gbWFrZVJlY29yZCh1bmRlZmluZWQsIHByb3ZpZGVyLnVzZVZhbHVlKTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gbWFrZVJlY29yZChmYWN0b3J5LCBOT1RfWUVUKTtcbiAgfVxufVxuXG4vKipcbiAqIENvbnZlcnRzIGEgYFNpbmdsZVByb3ZpZGVyYCBpbnRvIGEgZmFjdG9yeSBmdW5jdGlvbi5cbiAqXG4gKiBAcGFyYW0gcHJvdmlkZXIgcHJvdmlkZXIgdG8gY29udmVydCB0byBmYWN0b3J5XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwcm92aWRlclRvRmFjdG9yeShcbiAgICBwcm92aWRlcjogU2luZ2xlUHJvdmlkZXIsIG5nTW9kdWxlVHlwZT86IEluamVjdG9yVHlwZTxhbnk+LCBwcm92aWRlcnM/OiBhbnlbXSk6ICgpID0+IGFueSB7XG4gIGxldCBmYWN0b3J5OiAoKCkgPT4gYW55KXx1bmRlZmluZWQgPSB1bmRlZmluZWQ7XG4gIGlmIChpc1R5cGVQcm92aWRlcihwcm92aWRlcikpIHtcbiAgICByZXR1cm4gaW5qZWN0YWJsZURlZk9ySW5qZWN0b3JEZWZGYWN0b3J5KHJlc29sdmVGb3J3YXJkUmVmKHByb3ZpZGVyKSk7XG4gIH0gZWxzZSB7XG4gICAgaWYgKGlzVmFsdWVQcm92aWRlcihwcm92aWRlcikpIHtcbiAgICAgIGZhY3RvcnkgPSAoKSA9PiByZXNvbHZlRm9yd2FyZFJlZihwcm92aWRlci51c2VWYWx1ZSk7XG4gICAgfSBlbHNlIGlmIChpc0V4aXN0aW5nUHJvdmlkZXIocHJvdmlkZXIpKSB7XG4gICAgICBmYWN0b3J5ID0gKCkgPT4gzpRpbmplY3QocmVzb2x2ZUZvcndhcmRSZWYocHJvdmlkZXIudXNlRXhpc3RpbmcpKTtcbiAgICB9IGVsc2UgaWYgKGlzRmFjdG9yeVByb3ZpZGVyKHByb3ZpZGVyKSkge1xuICAgICAgZmFjdG9yeSA9ICgpID0+IHByb3ZpZGVyLnVzZUZhY3RvcnkoLi4uaW5qZWN0QXJncyhwcm92aWRlci5kZXBzIHx8IFtdKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IGNsYXNzUmVmID0gcmVzb2x2ZUZvcndhcmRSZWYoXG4gICAgICAgICAgcHJvdmlkZXIgJiZcbiAgICAgICAgICAoKHByb3ZpZGVyIGFzIFN0YXRpY0NsYXNzUHJvdmlkZXIgfCBDbGFzc1Byb3ZpZGVyKS51c2VDbGFzcyB8fCBwcm92aWRlci5wcm92aWRlKSk7XG4gICAgICBpZiAoIWNsYXNzUmVmKSB7XG4gICAgICAgIHRocm93SW52YWxpZFByb3ZpZGVyRXJyb3IobmdNb2R1bGVUeXBlLCBwcm92aWRlcnMsIHByb3ZpZGVyKTtcbiAgICAgIH1cbiAgICAgIGlmIChoYXNEZXBzKHByb3ZpZGVyKSkge1xuICAgICAgICBmYWN0b3J5ID0gKCkgPT4gbmV3IChjbGFzc1JlZikoLi4uaW5qZWN0QXJncyhwcm92aWRlci5kZXBzKSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gaW5qZWN0YWJsZURlZk9ySW5qZWN0b3JEZWZGYWN0b3J5KGNsYXNzUmVmKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIGZhY3Rvcnk7XG59XG5cbmZ1bmN0aW9uIG1ha2VSZWNvcmQ8VD4oXG4gICAgZmFjdG9yeTogKCgpID0+IFQpIHwgdW5kZWZpbmVkLCB2YWx1ZTogVCB8IHt9LCBtdWx0aTogYm9vbGVhbiA9IGZhbHNlKTogUmVjb3JkPFQ+IHtcbiAgcmV0dXJuIHtcbiAgICBmYWN0b3J5OiBmYWN0b3J5LFxuICAgIHZhbHVlOiB2YWx1ZSxcbiAgICBtdWx0aTogbXVsdGkgPyBbXSA6IHVuZGVmaW5lZCxcbiAgfTtcbn1cblxuZnVuY3Rpb24gZGVlcEZvckVhY2g8VD4oaW5wdXQ6IChUIHwgYW55W10pW10sIGZuOiAodmFsdWU6IFQpID0+IHZvaWQpOiB2b2lkIHtcbiAgaW5wdXQuZm9yRWFjaCh2YWx1ZSA9PiBBcnJheS5pc0FycmF5KHZhbHVlKSA/IGRlZXBGb3JFYWNoKHZhbHVlLCBmbikgOiBmbih2YWx1ZSkpO1xufVxuXG5mdW5jdGlvbiBpc1ZhbHVlUHJvdmlkZXIodmFsdWU6IFNpbmdsZVByb3ZpZGVyKTogdmFsdWUgaXMgVmFsdWVQcm92aWRlciB7XG4gIHJldHVybiB2YWx1ZSAhPT0gbnVsbCAmJiB0eXBlb2YgdmFsdWUgPT0gJ29iamVjdCcgJiYgVVNFX1ZBTFVFIGluIHZhbHVlO1xufVxuXG5mdW5jdGlvbiBpc0V4aXN0aW5nUHJvdmlkZXIodmFsdWU6IFNpbmdsZVByb3ZpZGVyKTogdmFsdWUgaXMgRXhpc3RpbmdQcm92aWRlciB7XG4gIHJldHVybiAhISh2YWx1ZSAmJiAodmFsdWUgYXMgRXhpc3RpbmdQcm92aWRlcikudXNlRXhpc3RpbmcpO1xufVxuXG5mdW5jdGlvbiBpc0ZhY3RvcnlQcm92aWRlcih2YWx1ZTogU2luZ2xlUHJvdmlkZXIpOiB2YWx1ZSBpcyBGYWN0b3J5UHJvdmlkZXIge1xuICByZXR1cm4gISEodmFsdWUgJiYgKHZhbHVlIGFzIEZhY3RvcnlQcm92aWRlcikudXNlRmFjdG9yeSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc1R5cGVQcm92aWRlcih2YWx1ZTogU2luZ2xlUHJvdmlkZXIpOiB2YWx1ZSBpcyBUeXBlUHJvdmlkZXIge1xuICByZXR1cm4gdHlwZW9mIHZhbHVlID09PSAnZnVuY3Rpb24nO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNDbGFzc1Byb3ZpZGVyKHZhbHVlOiBTaW5nbGVQcm92aWRlcik6IHZhbHVlIGlzIENsYXNzUHJvdmlkZXIge1xuICByZXR1cm4gISEodmFsdWUgYXMgU3RhdGljQ2xhc3NQcm92aWRlciB8IENsYXNzUHJvdmlkZXIpLnVzZUNsYXNzO1xufVxuXG5mdW5jdGlvbiBoYXNEZXBzKHZhbHVlOiBDbGFzc1Byb3ZpZGVyIHwgQ29uc3RydWN0b3JQcm92aWRlciB8IFN0YXRpY0NsYXNzUHJvdmlkZXIpOlxuICAgIHZhbHVlIGlzIENsYXNzUHJvdmlkZXIme2RlcHM6IGFueVtdfSB7XG4gIHJldHVybiAhISh2YWx1ZSBhcyBhbnkpLmRlcHM7XG59XG5cbmZ1bmN0aW9uIGhhc09uRGVzdHJveSh2YWx1ZTogYW55KTogdmFsdWUgaXMgT25EZXN0cm95IHtcbiAgcmV0dXJuIHZhbHVlICE9PSBudWxsICYmIHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcgJiZcbiAgICAgIHR5cGVvZih2YWx1ZSBhcyBPbkRlc3Ryb3kpLm5nT25EZXN0cm95ID09PSAnZnVuY3Rpb24nO1xufVxuXG5mdW5jdGlvbiBjb3VsZEJlSW5qZWN0YWJsZVR5cGUodmFsdWU6IGFueSk6IHZhbHVlIGlzIFR5cGU8YW55PnxJbmplY3Rpb25Ub2tlbjxhbnk+IHtcbiAgcmV0dXJuICh0eXBlb2YgdmFsdWUgPT09ICdmdW5jdGlvbicpIHx8XG4gICAgICAodHlwZW9mIHZhbHVlID09PSAnb2JqZWN0JyAmJiB2YWx1ZSBpbnN0YW5jZW9mIEluamVjdGlvblRva2VuKTtcbn1cbiJdfQ==