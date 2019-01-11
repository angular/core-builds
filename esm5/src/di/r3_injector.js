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
import { INJECTOR, NullInjector, THROW_IF_NOT_FOUND, USE_VALUE } from './injector';
import { InjectFlags, inject, injectArgs, setCurrentInjector } from './injector_compatibility';
import { getInjectableDef, getInjectorDef } from './interface/defs';
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
export function createInjector(defType, parent, additionalProviders) {
    if (parent === void 0) { parent = null; }
    if (additionalProviders === void 0) { additionalProviders = null; }
    parent = parent || getNullInjector();
    return new R3Injector(defType, additionalProviders, parent);
}
var R3Injector = /** @class */ (function () {
    function R3Injector(def, additionalProviders, parent) {
        var _this = this;
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
        /**
         * Flag indicating that this injector was previously destroyed.
         */
        this.destroyed = false;
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
    }
    /**
     * Destroy the injector and release references to every instance or provider associated with it.
     *
     * Also calls the `OnDestroy` lifecycle hooks of every instance that was created for which a
     * hook was found.
     */
    R3Injector.prototype.destroy = function () {
        this.assertNotDestroyed();
        // Set destroyed = true first, in case lifecycle hooks re-enter destroy().
        this.destroyed = true;
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
            return nextInjector.get(token, notFoundValue);
        }
        finally {
            // Lastly, clean up the state by restoring the previous injector.
            setCurrentInjector(previousInjector);
        }
    };
    R3Injector.prototype.assertNotDestroyed = function () {
        if (this.destroyed) {
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
            factory = function () { return inject(resolveForwardRef(provider.useExisting)); };
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
    return value && typeof value == 'object' && USE_VALUE in value;
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
function hasDeps(value) {
    return !!value.deps;
}
function hasOnDestroy(value) {
    return typeof value === 'object' && value != null && value.ngOnDestroy &&
        typeof value.ngOnDestroy === 'function';
}
function couldBeInjectableType(value) {
    return (typeof value === 'function') ||
        (typeof value === 'object' && value instanceof InjectionToken);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicjNfaW5qZWN0b3IuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9kaS9yM19pbmplY3Rvci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7O0FBSUgsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBRTVDLE9BQU8sRUFBQyxpQkFBaUIsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUNoRCxPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDakQsT0FBTyxFQUFDLFFBQVEsRUFBWSxZQUFZLEVBQUUsa0JBQWtCLEVBQUUsU0FBUyxFQUFDLE1BQU0sWUFBWSxDQUFDO0FBQzNGLE9BQU8sRUFBQyxXQUFXLEVBQUUsTUFBTSxFQUFFLFVBQVUsRUFBRSxrQkFBa0IsRUFBQyxNQUFNLDBCQUEwQixDQUFDO0FBQzdGLE9BQU8sRUFBeUUsZ0JBQWdCLEVBQUUsY0FBYyxFQUFDLE1BQU0sa0JBQWtCLENBQUM7QUFFMUksT0FBTyxFQUFDLFFBQVEsRUFBQyxNQUFNLFNBQVMsQ0FBQztBQVVqQzs7R0FFRztBQUNILElBQU0sT0FBTyxHQUFHLEVBQUUsQ0FBQztBQUVuQjs7Ozs7O0dBTUc7QUFDSCxJQUFNLFFBQVEsR0FBRyxFQUFFLENBQUM7QUFFcEIsSUFBTSxXQUFXLEdBQUcsRUFBVyxDQUFDO0FBRWhDOztHQUVHO0FBQ0gsSUFBSSxhQUFhLEdBQXVCLFNBQVMsQ0FBQztBQUVsRCxTQUFTLGVBQWU7SUFDdEIsSUFBSSxhQUFhLEtBQUssU0FBUyxFQUFFO1FBQy9CLGFBQWEsR0FBRyxJQUFJLFlBQVksRUFBRSxDQUFDO0tBQ3BDO0lBQ0QsT0FBTyxhQUFhLENBQUM7QUFDdkIsQ0FBQztBQVlEOzs7O0dBSUc7QUFDSCxNQUFNLFVBQVUsY0FBYyxDQUMxQixPQUFvQyxFQUFFLE1BQThCLEVBQ3BFLG1CQUFtRDtJQURi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QUFxQjtJQUMvQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEtBQUssSUFBSyxLQUEwQixDQUFDLFdBQVcsQ0FBQyxDQUFDO0FBQzlELENBQUM7QUFFRCxTQUFTLGlCQUFpQixDQUFDLEtBQXFCO0lBQzlDLE9BQU8sQ0FBQyxDQUFDLENBQUMsS0FBSyxJQUFLLEtBQXlCLENBQUMsVUFBVSxDQUFDLENBQUM7QUFDNUQsQ0FBQztBQUVELE1BQU0sVUFBVSxjQUFjLENBQUMsS0FBcUI7SUFDbEQsT0FBTyxPQUFPLEtBQUssS0FBSyxVQUFVLENBQUM7QUFDckMsQ0FBQztBQUVELFNBQVMsT0FBTyxDQUFDLEtBQWdFO0lBRS9FLE9BQU8sQ0FBQyxDQUFFLEtBQWEsQ0FBQyxJQUFJLENBQUM7QUFDL0IsQ0FBQztBQUVELFNBQVMsWUFBWSxDQUFDLEtBQVU7SUFDOUIsT0FBTyxPQUFPLEtBQUssS0FBSyxRQUFRLElBQUksS0FBSyxJQUFJLElBQUksSUFBSyxLQUFtQixDQUFDLFdBQVc7UUFDakYsT0FBTyxLQUFtQixDQUFDLFdBQVcsS0FBSyxVQUFVLENBQUM7QUFDNUQsQ0FBQztBQUVELFNBQVMscUJBQXFCLENBQUMsS0FBVTtJQUN2QyxPQUFPLENBQUMsT0FBTyxLQUFLLEtBQUssVUFBVSxDQUFDO1FBQ2hDLENBQUMsT0FBTyxLQUFLLEtBQUssUUFBUSxJQUFJLEtBQUssWUFBWSxjQUFjLENBQUMsQ0FBQztBQUNyRSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1R5cGV9IGZyb20gJy4uL2ludGVyZmFjZS90eXBlJztcbmltcG9ydCB7T25EZXN0cm95fSBmcm9tICcuLi9tZXRhZGF0YS9saWZlY3ljbGVfaG9va3MnO1xuaW1wb3J0IHtzdHJpbmdpZnl9IGZyb20gJy4uL3V0aWwvc3RyaW5naWZ5JztcblxuaW1wb3J0IHtyZXNvbHZlRm9yd2FyZFJlZn0gZnJvbSAnLi9mb3J3YXJkX3JlZic7XG5pbXBvcnQge0luamVjdGlvblRva2VufSBmcm9tICcuL2luamVjdGlvbl90b2tlbic7XG5pbXBvcnQge0lOSkVDVE9SLCBJbmplY3RvciwgTnVsbEluamVjdG9yLCBUSFJPV19JRl9OT1RfRk9VTkQsIFVTRV9WQUxVRX0gZnJvbSAnLi9pbmplY3Rvcic7XG5pbXBvcnQge0luamVjdEZsYWdzLCBpbmplY3QsIGluamVjdEFyZ3MsIHNldEN1cnJlbnRJbmplY3Rvcn0gZnJvbSAnLi9pbmplY3Rvcl9jb21wYXRpYmlsaXR5JztcbmltcG9ydCB7SW5qZWN0YWJsZURlZiwgSW5qZWN0YWJsZVR5cGUsIEluamVjdG9yVHlwZSwgSW5qZWN0b3JUeXBlV2l0aFByb3ZpZGVycywgZ2V0SW5qZWN0YWJsZURlZiwgZ2V0SW5qZWN0b3JEZWZ9IGZyb20gJy4vaW50ZXJmYWNlL2RlZnMnO1xuaW1wb3J0IHtDbGFzc1Byb3ZpZGVyLCBDb25zdHJ1Y3RvclByb3ZpZGVyLCBFeGlzdGluZ1Byb3ZpZGVyLCBGYWN0b3J5UHJvdmlkZXIsIFByb3ZpZGVyLCBTdGF0aWNDbGFzc1Byb3ZpZGVyLCBTdGF0aWNQcm92aWRlciwgVHlwZVByb3ZpZGVyLCBWYWx1ZVByb3ZpZGVyfSBmcm9tICcuL2ludGVyZmFjZS9wcm92aWRlcic7XG5pbXBvcnQge0FQUF9ST09UfSBmcm9tICcuL3Njb3BlJztcblxuXG5cbi8qKlxuICogSW50ZXJuYWwgdHlwZSBmb3IgYSBzaW5nbGUgcHJvdmlkZXIgaW4gYSBkZWVwIHByb3ZpZGVyIGFycmF5LlxuICovXG50eXBlIFNpbmdsZVByb3ZpZGVyID0gVHlwZVByb3ZpZGVyIHwgVmFsdWVQcm92aWRlciB8IENsYXNzUHJvdmlkZXIgfCBDb25zdHJ1Y3RvclByb3ZpZGVyIHxcbiAgICBFeGlzdGluZ1Byb3ZpZGVyIHwgRmFjdG9yeVByb3ZpZGVyIHwgU3RhdGljQ2xhc3NQcm92aWRlcjtcblxuLyoqXG4gKiBNYXJrZXIgd2hpY2ggaW5kaWNhdGVzIHRoYXQgYSB2YWx1ZSBoYXMgbm90IHlldCBiZWVuIGNyZWF0ZWQgZnJvbSB0aGUgZmFjdG9yeSBmdW5jdGlvbi5cbiAqL1xuY29uc3QgTk9UX1lFVCA9IHt9O1xuXG4vKipcbiAqIE1hcmtlciB3aGljaCBpbmRpY2F0ZXMgdGhhdCB0aGUgZmFjdG9yeSBmdW5jdGlvbiBmb3IgYSB0b2tlbiBpcyBpbiB0aGUgcHJvY2VzcyBvZiBiZWluZyBjYWxsZWQuXG4gKlxuICogSWYgdGhlIGluamVjdG9yIGlzIGFza2VkIHRvIGluamVjdCBhIHRva2VuIHdpdGggaXRzIHZhbHVlIHNldCB0byBDSVJDVUxBUiwgdGhhdCBpbmRpY2F0ZXNcbiAqIGluamVjdGlvbiBvZiBhIGRlcGVuZGVuY3kgaGFzIHJlY3Vyc2l2ZWx5IGF0dGVtcHRlZCB0byBpbmplY3QgdGhlIG9yaWdpbmFsIHRva2VuLCBhbmQgdGhlcmUgaXNcbiAqIGEgY2lyY3VsYXIgZGVwZW5kZW5jeSBhbW9uZyB0aGUgcHJvdmlkZXJzLlxuICovXG5jb25zdCBDSVJDVUxBUiA9IHt9O1xuXG5jb25zdCBFTVBUWV9BUlJBWSA9IFtdIGFzIGFueVtdO1xuXG4vKipcbiAqIEEgbGF6aWx5IGluaXRpYWxpemVkIE51bGxJbmplY3Rvci5cbiAqL1xubGV0IE5VTExfSU5KRUNUT1I6IEluamVjdG9yfHVuZGVmaW5lZCA9IHVuZGVmaW5lZDtcblxuZnVuY3Rpb24gZ2V0TnVsbEluamVjdG9yKCk6IEluamVjdG9yIHtcbiAgaWYgKE5VTExfSU5KRUNUT1IgPT09IHVuZGVmaW5lZCkge1xuICAgIE5VTExfSU5KRUNUT1IgPSBuZXcgTnVsbEluamVjdG9yKCk7XG4gIH1cbiAgcmV0dXJuIE5VTExfSU5KRUNUT1I7XG59XG5cbi8qKlxuICogQW4gZW50cnkgaW4gdGhlIGluamVjdG9yIHdoaWNoIHRyYWNrcyBpbmZvcm1hdGlvbiBhYm91dCB0aGUgZ2l2ZW4gdG9rZW4sIGluY2x1ZGluZyBhIHBvc3NpYmxlXG4gKiBjdXJyZW50IHZhbHVlLlxuICovXG5pbnRlcmZhY2UgUmVjb3JkPFQ+IHtcbiAgZmFjdG9yeTogKCgpID0+IFQpfHVuZGVmaW5lZDtcbiAgdmFsdWU6IFR8e307XG4gIG11bHRpOiBhbnlbXXx1bmRlZmluZWQ7XG59XG5cbi8qKlxuICogQ3JlYXRlIGEgbmV3IGBJbmplY3RvcmAgd2hpY2ggaXMgY29uZmlndXJlZCB1c2luZyBhIGBkZWZUeXBlYCBvZiBgSW5qZWN0b3JUeXBlPGFueT5gcy5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVJbmplY3RvcihcbiAgICBkZWZUeXBlOiAvKiBJbmplY3RvclR5cGU8YW55PiAqLyBhbnksIHBhcmVudDogSW5qZWN0b3IgfCBudWxsID0gbnVsbCxcbiAgICBhZGRpdGlvbmFsUHJvdmlkZXJzOiBTdGF0aWNQcm92aWRlcltdIHwgbnVsbCA9IG51bGwpOiBJbmplY3RvciB7XG4gIHBhcmVudCA9IHBhcmVudCB8fCBnZXROdWxsSW5qZWN0b3IoKTtcbiAgcmV0dXJuIG5ldyBSM0luamVjdG9yKGRlZlR5cGUsIGFkZGl0aW9uYWxQcm92aWRlcnMsIHBhcmVudCk7XG59XG5cbmV4cG9ydCBjbGFzcyBSM0luamVjdG9yIHtcbiAgLyoqXG4gICAqIE1hcCBvZiB0b2tlbnMgdG8gcmVjb3JkcyB3aGljaCBjb250YWluIHRoZSBpbnN0YW5jZXMgb2YgdGhvc2UgdG9rZW5zLlxuICAgKi9cbiAgcHJpdmF0ZSByZWNvcmRzID0gbmV3IE1hcDxUeXBlPGFueT58SW5qZWN0aW9uVG9rZW48YW55PiwgUmVjb3JkPGFueT4+KCk7XG5cbiAgLyoqXG4gICAqIFRoZSB0cmFuc2l0aXZlIHNldCBvZiBgSW5qZWN0b3JUeXBlYHMgd2hpY2ggZGVmaW5lIHRoaXMgaW5qZWN0b3IuXG4gICAqL1xuICBwcml2YXRlIGluamVjdG9yRGVmVHlwZXMgPSBuZXcgU2V0PEluamVjdG9yVHlwZTxhbnk+PigpO1xuXG4gIC8qKlxuICAgKiBTZXQgb2YgdmFsdWVzIGluc3RhbnRpYXRlZCBieSB0aGlzIGluamVjdG9yIHdoaWNoIGNvbnRhaW4gYG5nT25EZXN0cm95YCBsaWZlY3ljbGUgaG9va3MuXG4gICAqL1xuICBwcml2YXRlIG9uRGVzdHJveSA9IG5ldyBTZXQ8T25EZXN0cm95PigpO1xuXG4gIC8qKlxuICAgKiBGbGFnIGluZGljYXRpbmcgdGhpcyBpbmplY3RvciBwcm92aWRlcyB0aGUgQVBQX1JPT1RfU0NPUEUgdG9rZW4sIGFuZCB0aHVzIGNvdW50cyBhcyB0aGVcbiAgICogcm9vdCBzY29wZS5cbiAgICovXG4gIHByaXZhdGUgcmVhZG9ubHkgaXNSb290SW5qZWN0b3I6IGJvb2xlYW47XG5cbiAgLyoqXG4gICAqIEZsYWcgaW5kaWNhdGluZyB0aGF0IHRoaXMgaW5qZWN0b3Igd2FzIHByZXZpb3VzbHkgZGVzdHJveWVkLlxuICAgKi9cbiAgcHJpdmF0ZSBkZXN0cm95ZWQgPSBmYWxzZTtcblxuICBjb25zdHJ1Y3RvcihcbiAgICAgIGRlZjogSW5qZWN0b3JUeXBlPGFueT4sIGFkZGl0aW9uYWxQcm92aWRlcnM6IFN0YXRpY1Byb3ZpZGVyW118bnVsbCxcbiAgICAgIHJlYWRvbmx5IHBhcmVudDogSW5qZWN0b3IpIHtcbiAgICAvLyBTdGFydCBvZmYgYnkgY3JlYXRpbmcgUmVjb3JkcyBmb3IgZXZlcnkgcHJvdmlkZXIgZGVjbGFyZWQgaW4gZXZlcnkgSW5qZWN0b3JUeXBlXG4gICAgLy8gaW5jbHVkZWQgdHJhbnNpdGl2ZWx5IGluIGBkZWZgLlxuICAgIGNvbnN0IGRlZHVwU3RhY2s6IEluamVjdG9yVHlwZTxhbnk+W10gPSBbXTtcbiAgICBkZWVwRm9yRWFjaChbZGVmXSwgaW5qZWN0b3JEZWYgPT4gdGhpcy5wcm9jZXNzSW5qZWN0b3JUeXBlKGluamVjdG9yRGVmLCBbXSwgZGVkdXBTdGFjaykpO1xuXG4gICAgYWRkaXRpb25hbFByb3ZpZGVycyAmJiBkZWVwRm9yRWFjaChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhZGRpdGlvbmFsUHJvdmlkZXJzLCBwcm92aWRlciA9PiB0aGlzLnByb2Nlc3NQcm92aWRlcihcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvdmlkZXIsIGRlZiwgYWRkaXRpb25hbFByb3ZpZGVycykpO1xuXG5cbiAgICAvLyBNYWtlIHN1cmUgdGhlIElOSkVDVE9SIHRva2VuIHByb3ZpZGVzIHRoaXMgaW5qZWN0b3IuXG4gICAgdGhpcy5yZWNvcmRzLnNldChJTkpFQ1RPUiwgbWFrZVJlY29yZCh1bmRlZmluZWQsIHRoaXMpKTtcblxuICAgIC8vIERldGVjdCB3aGV0aGVyIHRoaXMgaW5qZWN0b3IgaGFzIHRoZSBBUFBfUk9PVF9TQ09QRSB0b2tlbiBhbmQgdGh1cyBzaG91bGQgcHJvdmlkZVxuICAgIC8vIGFueSBpbmplY3RhYmxlIHNjb3BlZCB0byBBUFBfUk9PVF9TQ09QRS5cbiAgICB0aGlzLmlzUm9vdEluamVjdG9yID0gdGhpcy5yZWNvcmRzLmhhcyhBUFBfUk9PVCk7XG5cbiAgICAvLyBFYWdlcmx5IGluc3RhbnRpYXRlIHRoZSBJbmplY3RvclR5cGUgY2xhc3NlcyB0aGVtc2VsdmVzLlxuICAgIHRoaXMuaW5qZWN0b3JEZWZUeXBlcy5mb3JFYWNoKGRlZlR5cGUgPT4gdGhpcy5nZXQoZGVmVHlwZSkpO1xuICB9XG5cbiAgLyoqXG4gICAqIERlc3Ryb3kgdGhlIGluamVjdG9yIGFuZCByZWxlYXNlIHJlZmVyZW5jZXMgdG8gZXZlcnkgaW5zdGFuY2Ugb3IgcHJvdmlkZXIgYXNzb2NpYXRlZCB3aXRoIGl0LlxuICAgKlxuICAgKiBBbHNvIGNhbGxzIHRoZSBgT25EZXN0cm95YCBsaWZlY3ljbGUgaG9va3Mgb2YgZXZlcnkgaW5zdGFuY2UgdGhhdCB3YXMgY3JlYXRlZCBmb3Igd2hpY2ggYVxuICAgKiBob29rIHdhcyBmb3VuZC5cbiAgICovXG4gIGRlc3Ryb3koKTogdm9pZCB7XG4gICAgdGhpcy5hc3NlcnROb3REZXN0cm95ZWQoKTtcblxuICAgIC8vIFNldCBkZXN0cm95ZWQgPSB0cnVlIGZpcnN0LCBpbiBjYXNlIGxpZmVjeWNsZSBob29rcyByZS1lbnRlciBkZXN0cm95KCkuXG4gICAgdGhpcy5kZXN0cm95ZWQgPSB0cnVlO1xuICAgIHRyeSB7XG4gICAgICAvLyBDYWxsIGFsbCB0aGUgbGlmZWN5Y2xlIGhvb2tzLlxuICAgICAgdGhpcy5vbkRlc3Ryb3kuZm9yRWFjaChzZXJ2aWNlID0+IHNlcnZpY2UubmdPbkRlc3Ryb3koKSk7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIC8vIFJlbGVhc2UgYWxsIHJlZmVyZW5jZXMuXG4gICAgICB0aGlzLnJlY29yZHMuY2xlYXIoKTtcbiAgICAgIHRoaXMub25EZXN0cm95LmNsZWFyKCk7XG4gICAgICB0aGlzLmluamVjdG9yRGVmVHlwZXMuY2xlYXIoKTtcbiAgICB9XG4gIH1cblxuICBnZXQ8VD4oXG4gICAgICB0b2tlbjogVHlwZTxUPnxJbmplY3Rpb25Ub2tlbjxUPiwgbm90Rm91bmRWYWx1ZTogYW55ID0gVEhST1dfSUZfTk9UX0ZPVU5ELFxuICAgICAgZmxhZ3MgPSBJbmplY3RGbGFncy5EZWZhdWx0KTogVCB7XG4gICAgdGhpcy5hc3NlcnROb3REZXN0cm95ZWQoKTtcbiAgICAvLyBTZXQgdGhlIGluamVjdGlvbiBjb250ZXh0LlxuICAgIGNvbnN0IHByZXZpb3VzSW5qZWN0b3IgPSBzZXRDdXJyZW50SW5qZWN0b3IodGhpcyk7XG4gICAgdHJ5IHtcbiAgICAgIC8vIENoZWNrIGZvciB0aGUgU2tpcFNlbGYgZmxhZy5cbiAgICAgIGlmICghKGZsYWdzICYgSW5qZWN0RmxhZ3MuU2tpcFNlbGYpKSB7XG4gICAgICAgIC8vIFNraXBTZWxmIGlzbid0IHNldCwgY2hlY2sgaWYgdGhlIHJlY29yZCBiZWxvbmdzIHRvIHRoaXMgaW5qZWN0b3IuXG4gICAgICAgIGxldCByZWNvcmQ6IFJlY29yZDxUPnx1bmRlZmluZWQgPSB0aGlzLnJlY29yZHMuZ2V0KHRva2VuKTtcbiAgICAgICAgaWYgKHJlY29yZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgLy8gTm8gcmVjb3JkLCBidXQgbWF5YmUgdGhlIHRva2VuIGlzIHNjb3BlZCB0byB0aGlzIGluamVjdG9yLiBMb29rIGZvciBhbiBuZ0luamVjdGFibGVEZWZcbiAgICAgICAgICAvLyB3aXRoIGEgc2NvcGUgbWF0Y2hpbmcgdGhpcyBpbmplY3Rvci5cbiAgICAgICAgICBjb25zdCBkZWYgPSBjb3VsZEJlSW5qZWN0YWJsZVR5cGUodG9rZW4pICYmIGdldEluamVjdGFibGVEZWYodG9rZW4pO1xuICAgICAgICAgIGlmIChkZWYgJiYgdGhpcy5pbmplY3RhYmxlRGVmSW5TY29wZShkZWYpKSB7XG4gICAgICAgICAgICAvLyBGb3VuZCBhbiBuZ0luamVjdGFibGVEZWYgYW5kIGl0J3Mgc2NvcGVkIHRvIHRoaXMgaW5qZWN0b3IuIFByZXRlbmQgYXMgaWYgaXQgd2FzIGhlcmVcbiAgICAgICAgICAgIC8vIGFsbCBhbG9uZy5cbiAgICAgICAgICAgIHJlY29yZCA9IG1ha2VSZWNvcmQoaW5qZWN0YWJsZURlZk9ySW5qZWN0b3JEZWZGYWN0b3J5KHRva2VuKSwgTk9UX1lFVCk7XG4gICAgICAgICAgICB0aGlzLnJlY29yZHMuc2V0KHRva2VuLCByZWNvcmQpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAvLyBJZiBhIHJlY29yZCB3YXMgZm91bmQsIGdldCB0aGUgaW5zdGFuY2UgZm9yIGl0IGFuZCByZXR1cm4gaXQuXG4gICAgICAgIGlmIChyZWNvcmQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIHJldHVybiB0aGlzLmh5ZHJhdGUodG9rZW4sIHJlY29yZCk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gU2VsZWN0IHRoZSBuZXh0IGluamVjdG9yIGJhc2VkIG9uIHRoZSBTZWxmIGZsYWcgLSBpZiBzZWxmIGlzIHNldCwgdGhlIG5leHQgaW5qZWN0b3IgaXNcbiAgICAgIC8vIHRoZSBOdWxsSW5qZWN0b3IsIG90aGVyd2lzZSBpdCdzIHRoZSBwYXJlbnQuXG4gICAgICBjb25zdCBuZXh0SW5qZWN0b3IgPSAhKGZsYWdzICYgSW5qZWN0RmxhZ3MuU2VsZikgPyB0aGlzLnBhcmVudCA6IGdldE51bGxJbmplY3RvcigpO1xuICAgICAgcmV0dXJuIG5leHRJbmplY3Rvci5nZXQodG9rZW4sIG5vdEZvdW5kVmFsdWUpO1xuICAgIH0gZmluYWxseSB7XG4gICAgICAvLyBMYXN0bHksIGNsZWFuIHVwIHRoZSBzdGF0ZSBieSByZXN0b3JpbmcgdGhlIHByZXZpb3VzIGluamVjdG9yLlxuICAgICAgc2V0Q3VycmVudEluamVjdG9yKHByZXZpb3VzSW5qZWN0b3IpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgYXNzZXJ0Tm90RGVzdHJveWVkKCk6IHZvaWQge1xuICAgIGlmICh0aGlzLmRlc3Ryb3llZCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbmplY3RvciBoYXMgYWxyZWFkeSBiZWVuIGRlc3Ryb3llZC4nKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQWRkIGFuIGBJbmplY3RvclR5cGVgIG9yIGBJbmplY3RvckRlZlR5cGVXaXRoUHJvdmlkZXJzYCBhbmQgYWxsIG9mIGl0cyB0cmFuc2l0aXZlIHByb3ZpZGVyc1xuICAgKiB0byB0aGlzIGluamVjdG9yLlxuICAgKi9cbiAgcHJpdmF0ZSBwcm9jZXNzSW5qZWN0b3JUeXBlKFxuICAgICAgZGVmT3JXcmFwcGVkRGVmOiBJbmplY3RvclR5cGU8YW55PnxJbmplY3RvclR5cGVXaXRoUHJvdmlkZXJzPGFueT4sXG4gICAgICBwYXJlbnRzOiBJbmplY3RvclR5cGU8YW55PltdLCBkZWR1cFN0YWNrOiBJbmplY3RvclR5cGU8YW55PltdKSB7XG4gICAgZGVmT3JXcmFwcGVkRGVmID0gcmVzb2x2ZUZvcndhcmRSZWYoZGVmT3JXcmFwcGVkRGVmKTtcbiAgICBpZiAoIWRlZk9yV3JhcHBlZERlZikgcmV0dXJuO1xuXG4gICAgLy8gRWl0aGVyIHRoZSBkZWZPcldyYXBwZWREZWYgaXMgYW4gSW5qZWN0b3JUeXBlICh3aXRoIG5nSW5qZWN0b3JEZWYpIG9yIGFuXG4gICAgLy8gSW5qZWN0b3JEZWZUeXBlV2l0aFByb3ZpZGVycyAoYWthIE1vZHVsZVdpdGhQcm92aWRlcnMpLiBEZXRlY3RpbmcgZWl0aGVyIGlzIGEgbWVnYW1vcnBoaWNcbiAgICAvLyByZWFkLCBzbyBjYXJlIGlzIHRha2VuIHRvIG9ubHkgZG8gdGhlIHJlYWQgb25jZS5cblxuICAgIC8vIEZpcnN0IGF0dGVtcHQgdG8gcmVhZCB0aGUgbmdJbmplY3RvckRlZi5cbiAgICBsZXQgZGVmID0gZ2V0SW5qZWN0b3JEZWYoZGVmT3JXcmFwcGVkRGVmKTtcblxuICAgIC8vIElmIHRoYXQncyBub3QgcHJlc2VudCwgdGhlbiBhdHRlbXB0IHRvIHJlYWQgbmdNb2R1bGUgZnJvbSB0aGUgSW5qZWN0b3JEZWZUeXBlV2l0aFByb3ZpZGVycy5cbiAgICBjb25zdCBuZ01vZHVsZSA9XG4gICAgICAgIChkZWYgPT0gbnVsbCkgJiYgKGRlZk9yV3JhcHBlZERlZiBhcyBJbmplY3RvclR5cGVXaXRoUHJvdmlkZXJzPGFueT4pLm5nTW9kdWxlIHx8IHVuZGVmaW5lZDtcblxuICAgIC8vIERldGVybWluZSB0aGUgSW5qZWN0b3JUeXBlLiBJbiB0aGUgY2FzZSB3aGVyZSBgZGVmT3JXcmFwcGVkRGVmYCBpcyBhbiBgSW5qZWN0b3JUeXBlYCxcbiAgICAvLyB0aGVuIHRoaXMgaXMgZWFzeS4gSW4gdGhlIGNhc2Ugb2YgYW4gSW5qZWN0b3JEZWZUeXBlV2l0aFByb3ZpZGVycywgdGhlbiB0aGUgZGVmaW5pdGlvbiB0eXBlXG4gICAgLy8gaXMgdGhlIGBuZ01vZHVsZWAuXG4gICAgY29uc3QgZGVmVHlwZTogSW5qZWN0b3JUeXBlPGFueT4gPVxuICAgICAgICAobmdNb2R1bGUgPT09IHVuZGVmaW5lZCkgPyAoZGVmT3JXcmFwcGVkRGVmIGFzIEluamVjdG9yVHlwZTxhbnk+KSA6IG5nTW9kdWxlO1xuXG4gICAgLy8gQ2hlY2sgZm9yIGNpcmN1bGFyIGRlcGVuZGVuY2llcy5cbiAgICBpZiAobmdEZXZNb2RlICYmIHBhcmVudHMuaW5kZXhPZihkZWZUeXBlKSAhPT0gLTEpIHtcbiAgICAgIGNvbnN0IGRlZk5hbWUgPSBzdHJpbmdpZnkoZGVmVHlwZSk7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgYENpcmN1bGFyIGRlcGVuZGVuY3kgaW4gREkgZGV0ZWN0ZWQgZm9yIHR5cGUgJHtkZWZOYW1lfS4gRGVwZW5kZW5jeSBwYXRoOiAke3BhcmVudHMubWFwKGRlZlR5cGUgPT4gc3RyaW5naWZ5KGRlZlR5cGUpKS5qb2luKCcgPiAnKX0gPiAke2RlZk5hbWV9LmApO1xuICAgIH1cblxuICAgIC8vIENoZWNrIGZvciBtdWx0aXBsZSBpbXBvcnRzIG9mIHRoZSBzYW1lIG1vZHVsZVxuICAgIGNvbnN0IGlzRHVwbGljYXRlID0gZGVkdXBTdGFjay5pbmRleE9mKGRlZlR5cGUpICE9PSAtMTtcblxuICAgIC8vIElmIGRlZk9yV3JhcHBlZFR5cGUgd2FzIGFuIEluamVjdG9yRGVmVHlwZVdpdGhQcm92aWRlcnMsIHRoZW4gLnByb3ZpZGVycyBtYXkgaG9sZCBzb21lXG4gICAgLy8gZXh0cmEgcHJvdmlkZXJzLlxuICAgIGNvbnN0IHByb3ZpZGVycyA9XG4gICAgICAgIChuZ01vZHVsZSAhPT0gdW5kZWZpbmVkKSAmJiAoZGVmT3JXcmFwcGVkRGVmIGFzIEluamVjdG9yVHlwZVdpdGhQcm92aWRlcnM8YW55PikucHJvdmlkZXJzIHx8XG4gICAgICAgIEVNUFRZX0FSUkFZO1xuXG4gICAgLy8gRmluYWxseSwgaWYgZGVmT3JXcmFwcGVkVHlwZSB3YXMgYW4gYEluamVjdG9yRGVmVHlwZVdpdGhQcm92aWRlcnNgLCB0aGVuIHRoZSBhY3R1YWxcbiAgICAvLyBgSW5qZWN0b3JEZWZgIGlzIG9uIGl0cyBgbmdNb2R1bGVgLlxuICAgIGlmIChuZ01vZHVsZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBkZWYgPSBnZXRJbmplY3RvckRlZihuZ01vZHVsZSk7XG4gICAgfVxuXG4gICAgLy8gSWYgbm8gZGVmaW5pdGlvbiB3YXMgZm91bmQsIGl0IG1pZ2h0IGJlIGZyb20gZXhwb3J0cy4gUmVtb3ZlIGl0LlxuICAgIGlmIChkZWYgPT0gbnVsbCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIFRyYWNrIHRoZSBJbmplY3RvclR5cGUgYW5kIGFkZCBhIHByb3ZpZGVyIGZvciBpdC5cbiAgICB0aGlzLmluamVjdG9yRGVmVHlwZXMuYWRkKGRlZlR5cGUpO1xuICAgIHRoaXMucmVjb3Jkcy5zZXQoZGVmVHlwZSwgbWFrZVJlY29yZChkZWYuZmFjdG9yeSwgTk9UX1lFVCkpO1xuXG4gICAgLy8gQWRkIHByb3ZpZGVycyBpbiB0aGUgc2FtZSB3YXkgdGhhdCBATmdNb2R1bGUgcmVzb2x1dGlvbiBkaWQ6XG5cbiAgICAvLyBGaXJzdCwgaW5jbHVkZSBwcm92aWRlcnMgZnJvbSBhbnkgaW1wb3J0cy5cbiAgICBpZiAoZGVmLmltcG9ydHMgIT0gbnVsbCAmJiAhaXNEdXBsaWNhdGUpIHtcbiAgICAgIC8vIEJlZm9yZSBwcm9jZXNzaW5nIGRlZlR5cGUncyBpbXBvcnRzLCBhZGQgaXQgdG8gdGhlIHNldCBvZiBwYXJlbnRzLiBUaGlzIHdheSwgaWYgaXQgZW5kc1xuICAgICAgLy8gdXAgZGVlcGx5IGltcG9ydGluZyBpdHNlbGYsIHRoaXMgY2FuIGJlIGRldGVjdGVkLlxuICAgICAgbmdEZXZNb2RlICYmIHBhcmVudHMucHVzaChkZWZUeXBlKTtcbiAgICAgIC8vIEFkZCBpdCB0byB0aGUgc2V0IG9mIGRlZHVwcy4gVGhpcyB3YXkgd2UgY2FuIGRldGVjdCBtdWx0aXBsZSBpbXBvcnRzIG9mIHRoZSBzYW1lIG1vZHVsZVxuICAgICAgZGVkdXBTdGFjay5wdXNoKGRlZlR5cGUpO1xuXG4gICAgICB0cnkge1xuICAgICAgICBkZWVwRm9yRWFjaChcbiAgICAgICAgICAgIGRlZi5pbXBvcnRzLCBpbXBvcnRlZCA9PiB0aGlzLnByb2Nlc3NJbmplY3RvclR5cGUoaW1wb3J0ZWQsIHBhcmVudHMsIGRlZHVwU3RhY2spKTtcbiAgICAgIH0gZmluYWxseSB7XG4gICAgICAgIC8vIFJlbW92ZSBpdCBmcm9tIHRoZSBwYXJlbnRzIHNldCB3aGVuIGZpbmlzaGVkLlxuICAgICAgICBuZ0Rldk1vZGUgJiYgcGFyZW50cy5wb3AoKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBOZXh0LCBpbmNsdWRlIHByb3ZpZGVycyBsaXN0ZWQgb24gdGhlIGRlZmluaXRpb24gaXRzZWxmLlxuICAgIGNvbnN0IGRlZlByb3ZpZGVycyA9IGRlZi5wcm92aWRlcnM7XG4gICAgaWYgKGRlZlByb3ZpZGVycyAhPSBudWxsICYmICFpc0R1cGxpY2F0ZSkge1xuICAgICAgY29uc3QgaW5qZWN0b3JUeXBlID0gZGVmT3JXcmFwcGVkRGVmIGFzIEluamVjdG9yVHlwZTxhbnk+O1xuICAgICAgZGVlcEZvckVhY2goXG4gICAgICAgICAgZGVmUHJvdmlkZXJzLCBwcm92aWRlciA9PiB0aGlzLnByb2Nlc3NQcm92aWRlcihwcm92aWRlciwgaW5qZWN0b3JUeXBlLCBkZWZQcm92aWRlcnMpKTtcbiAgICB9XG5cbiAgICAvLyBGaW5hbGx5LCBpbmNsdWRlIHByb3ZpZGVycyBmcm9tIGFuIEluamVjdG9yRGVmVHlwZVdpdGhQcm92aWRlcnMgaWYgdGhlcmUgd2FzIG9uZS5cbiAgICBjb25zdCBuZ01vZHVsZVR5cGUgPSAoZGVmT3JXcmFwcGVkRGVmIGFzIEluamVjdG9yVHlwZVdpdGhQcm92aWRlcnM8YW55PikubmdNb2R1bGU7XG4gICAgZGVlcEZvckVhY2gocHJvdmlkZXJzLCBwcm92aWRlciA9PiB0aGlzLnByb2Nlc3NQcm92aWRlcihwcm92aWRlciwgbmdNb2R1bGVUeXBlLCBwcm92aWRlcnMpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBQcm9jZXNzIGEgYFNpbmdsZVByb3ZpZGVyYCBhbmQgYWRkIGl0LlxuICAgKi9cbiAgcHJpdmF0ZSBwcm9jZXNzUHJvdmlkZXIoXG4gICAgICBwcm92aWRlcjogU2luZ2xlUHJvdmlkZXIsIG5nTW9kdWxlVHlwZTogSW5qZWN0b3JUeXBlPGFueT4sIHByb3ZpZGVyczogYW55W10pOiB2b2lkIHtcbiAgICAvLyBEZXRlcm1pbmUgdGhlIHRva2VuIGZyb20gdGhlIHByb3ZpZGVyLiBFaXRoZXIgaXQncyBpdHMgb3duIHRva2VuLCBvciBoYXMgYSB7cHJvdmlkZTogLi4ufVxuICAgIC8vIHByb3BlcnR5LlxuICAgIHByb3ZpZGVyID0gcmVzb2x2ZUZvcndhcmRSZWYocHJvdmlkZXIpO1xuICAgIGxldCB0b2tlbjogYW55ID1cbiAgICAgICAgaXNUeXBlUHJvdmlkZXIocHJvdmlkZXIpID8gcHJvdmlkZXIgOiByZXNvbHZlRm9yd2FyZFJlZihwcm92aWRlciAmJiBwcm92aWRlci5wcm92aWRlKTtcblxuICAgIC8vIENvbnN0cnVjdCBhIGBSZWNvcmRgIGZvciB0aGUgcHJvdmlkZXIuXG4gICAgY29uc3QgcmVjb3JkID0gcHJvdmlkZXJUb1JlY29yZChwcm92aWRlciwgbmdNb2R1bGVUeXBlLCBwcm92aWRlcnMpO1xuXG4gICAgaWYgKCFpc1R5cGVQcm92aWRlcihwcm92aWRlcikgJiYgcHJvdmlkZXIubXVsdGkgPT09IHRydWUpIHtcbiAgICAgIC8vIElmIHRoZSBwcm92aWRlciBpbmRpY2F0ZXMgdGhhdCBpdCdzIGEgbXVsdGktcHJvdmlkZXIsIHByb2Nlc3MgaXQgc3BlY2lhbGx5LlxuICAgICAgLy8gRmlyc3QgY2hlY2sgd2hldGhlciBpdCdzIGJlZW4gZGVmaW5lZCBhbHJlYWR5LlxuICAgICAgbGV0IG11bHRpUmVjb3JkID0gdGhpcy5yZWNvcmRzLmdldCh0b2tlbik7XG4gICAgICBpZiAobXVsdGlSZWNvcmQpIHtcbiAgICAgICAgLy8gSXQgaGFzLiBUaHJvdyBhIG5pY2UgZXJyb3IgaWZcbiAgICAgICAgaWYgKG11bHRpUmVjb3JkLm11bHRpID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYE1peGVkIG11bHRpLXByb3ZpZGVyIGZvciAke3Rva2VufS5gKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbXVsdGlSZWNvcmQgPSBtYWtlUmVjb3JkKHVuZGVmaW5lZCwgTk9UX1lFVCwgdHJ1ZSk7XG4gICAgICAgIG11bHRpUmVjb3JkLmZhY3RvcnkgPSAoKSA9PiBpbmplY3RBcmdzKG11bHRpUmVjb3JkICEubXVsdGkgISk7XG4gICAgICAgIHRoaXMucmVjb3Jkcy5zZXQodG9rZW4sIG11bHRpUmVjb3JkKTtcbiAgICAgIH1cbiAgICAgIHRva2VuID0gcHJvdmlkZXI7XG4gICAgICBtdWx0aVJlY29yZC5tdWx0aSAhLnB1c2gocHJvdmlkZXIpO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBleGlzdGluZyA9IHRoaXMucmVjb3Jkcy5nZXQodG9rZW4pO1xuICAgICAgaWYgKGV4aXN0aW5nICYmIGV4aXN0aW5nLm11bHRpICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBNaXhlZCBtdWx0aS1wcm92aWRlciBmb3IgJHtzdHJpbmdpZnkodG9rZW4pfWApO1xuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLnJlY29yZHMuc2V0KHRva2VuLCByZWNvcmQpO1xuICB9XG5cbiAgcHJpdmF0ZSBoeWRyYXRlPFQ+KHRva2VuOiBUeXBlPFQ+fEluamVjdGlvblRva2VuPFQ+LCByZWNvcmQ6IFJlY29yZDxUPik6IFQge1xuICAgIGlmIChyZWNvcmQudmFsdWUgPT09IENJUkNVTEFSKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYENhbm5vdCBpbnN0YW50aWF0ZSBjeWNsaWMgZGVwZW5kZW5jeSEgJHtzdHJpbmdpZnkodG9rZW4pfWApO1xuICAgIH0gZWxzZSBpZiAocmVjb3JkLnZhbHVlID09PSBOT1RfWUVUKSB7XG4gICAgICByZWNvcmQudmFsdWUgPSBDSVJDVUxBUjtcbiAgICAgIHJlY29yZC52YWx1ZSA9IHJlY29yZC5mYWN0b3J5ICEoKTtcbiAgICB9XG4gICAgaWYgKHR5cGVvZiByZWNvcmQudmFsdWUgPT09ICdvYmplY3QnICYmIHJlY29yZC52YWx1ZSAmJiBoYXNPbkRlc3Ryb3kocmVjb3JkLnZhbHVlKSkge1xuICAgICAgdGhpcy5vbkRlc3Ryb3kuYWRkKHJlY29yZC52YWx1ZSk7XG4gICAgfVxuICAgIHJldHVybiByZWNvcmQudmFsdWUgYXMgVDtcbiAgfVxuXG4gIHByaXZhdGUgaW5qZWN0YWJsZURlZkluU2NvcGUoZGVmOiBJbmplY3RhYmxlRGVmPGFueT4pOiBib29sZWFuIHtcbiAgICBpZiAoIWRlZi5wcm92aWRlZEluKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSBlbHNlIGlmICh0eXBlb2YgZGVmLnByb3ZpZGVkSW4gPT09ICdzdHJpbmcnKSB7XG4gICAgICByZXR1cm4gZGVmLnByb3ZpZGVkSW4gPT09ICdhbnknIHx8IChkZWYucHJvdmlkZWRJbiA9PT0gJ3Jvb3QnICYmIHRoaXMuaXNSb290SW5qZWN0b3IpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gdGhpcy5pbmplY3RvckRlZlR5cGVzLmhhcyhkZWYucHJvdmlkZWRJbik7XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIGluamVjdGFibGVEZWZPckluamVjdG9yRGVmRmFjdG9yeSh0b2tlbjogVHlwZTxhbnk+fCBJbmplY3Rpb25Ub2tlbjxhbnk+KTogKCkgPT4gYW55IHtcbiAgY29uc3QgaW5qZWN0YWJsZURlZiA9IGdldEluamVjdGFibGVEZWYodG9rZW4gYXMgSW5qZWN0YWJsZVR5cGU8YW55Pik7XG4gIGlmIChpbmplY3RhYmxlRGVmID09PSBudWxsKSB7XG4gICAgY29uc3QgaW5qZWN0b3JEZWYgPSBnZXRJbmplY3RvckRlZih0b2tlbiBhcyBJbmplY3RvclR5cGU8YW55Pik7XG4gICAgaWYgKGluamVjdG9yRGVmICE9PSBudWxsKSB7XG4gICAgICByZXR1cm4gaW5qZWN0b3JEZWYuZmFjdG9yeTtcbiAgICB9IGVsc2UgaWYgKHRva2VuIGluc3RhbmNlb2YgSW5qZWN0aW9uVG9rZW4pIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgVG9rZW4gJHtzdHJpbmdpZnkodG9rZW4pfSBpcyBtaXNzaW5nIGFuIG5nSW5qZWN0YWJsZURlZiBkZWZpbml0aW9uLmApO1xuICAgIH0gZWxzZSBpZiAodG9rZW4gaW5zdGFuY2VvZiBGdW5jdGlvbikge1xuICAgICAgY29uc3QgcGFyYW1MZW5ndGggPSB0b2tlbi5sZW5ndGg7XG4gICAgICBpZiAocGFyYW1MZW5ndGggPiAwKSB7XG4gICAgICAgIGNvbnN0IGFyZ3M6IHN0cmluZ1tdID0gbmV3IEFycmF5KHBhcmFtTGVuZ3RoKS5maWxsKCc/Jyk7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICAgIGBDYW4ndCByZXNvbHZlIGFsbCBwYXJhbWV0ZXJzIGZvciAke3N0cmluZ2lmeSh0b2tlbil9OiAoJHthcmdzLmpvaW4oJywgJyl9KS5gKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiAoKSA9PiBuZXcgKHRva2VuIGFzIFR5cGU8YW55PikoKTtcbiAgICB9XG4gICAgdGhyb3cgbmV3IEVycm9yKCd1bnJlYWNoYWJsZScpO1xuICB9XG4gIHJldHVybiBpbmplY3RhYmxlRGVmLmZhY3Rvcnk7XG59XG5cbmZ1bmN0aW9uIHByb3ZpZGVyVG9SZWNvcmQoXG4gICAgcHJvdmlkZXI6IFNpbmdsZVByb3ZpZGVyLCBuZ01vZHVsZVR5cGU6IEluamVjdG9yVHlwZTxhbnk+LCBwcm92aWRlcnM6IGFueVtdKTogUmVjb3JkPGFueT4ge1xuICBsZXQgZmFjdG9yeTogKCgpID0+IGFueSl8dW5kZWZpbmVkID0gcHJvdmlkZXJUb0ZhY3RvcnkocHJvdmlkZXIsIG5nTW9kdWxlVHlwZSwgcHJvdmlkZXJzKTtcbiAgaWYgKGlzVmFsdWVQcm92aWRlcihwcm92aWRlcikpIHtcbiAgICByZXR1cm4gbWFrZVJlY29yZCh1bmRlZmluZWQsIHByb3ZpZGVyLnVzZVZhbHVlKTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gbWFrZVJlY29yZChmYWN0b3J5LCBOT1RfWUVUKTtcbiAgfVxufVxuXG4vKipcbiAqIENvbnZlcnRzIGEgYFNpbmdsZVByb3ZpZGVyYCBpbnRvIGEgZmFjdG9yeSBmdW5jdGlvbi5cbiAqXG4gKiBAcGFyYW0gcHJvdmlkZXIgcHJvdmlkZXIgdG8gY29udmVydCB0byBmYWN0b3J5XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwcm92aWRlclRvRmFjdG9yeShcbiAgICBwcm92aWRlcjogU2luZ2xlUHJvdmlkZXIsIG5nTW9kdWxlVHlwZT86IEluamVjdG9yVHlwZTxhbnk+LCBwcm92aWRlcnM/OiBhbnlbXSk6ICgpID0+IGFueSB7XG4gIGxldCBmYWN0b3J5OiAoKCkgPT4gYW55KXx1bmRlZmluZWQgPSB1bmRlZmluZWQ7XG4gIGlmIChpc1R5cGVQcm92aWRlcihwcm92aWRlcikpIHtcbiAgICByZXR1cm4gaW5qZWN0YWJsZURlZk9ySW5qZWN0b3JEZWZGYWN0b3J5KHJlc29sdmVGb3J3YXJkUmVmKHByb3ZpZGVyKSk7XG4gIH0gZWxzZSB7XG4gICAgaWYgKGlzVmFsdWVQcm92aWRlcihwcm92aWRlcikpIHtcbiAgICAgIGZhY3RvcnkgPSAoKSA9PiByZXNvbHZlRm9yd2FyZFJlZihwcm92aWRlci51c2VWYWx1ZSk7XG4gICAgfSBlbHNlIGlmIChpc0V4aXN0aW5nUHJvdmlkZXIocHJvdmlkZXIpKSB7XG4gICAgICBmYWN0b3J5ID0gKCkgPT4gaW5qZWN0KHJlc29sdmVGb3J3YXJkUmVmKHByb3ZpZGVyLnVzZUV4aXN0aW5nKSk7XG4gICAgfSBlbHNlIGlmIChpc0ZhY3RvcnlQcm92aWRlcihwcm92aWRlcikpIHtcbiAgICAgIGZhY3RvcnkgPSAoKSA9PiBwcm92aWRlci51c2VGYWN0b3J5KC4uLmluamVjdEFyZ3MocHJvdmlkZXIuZGVwcyB8fCBbXSkpO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBjbGFzc1JlZiA9IHJlc29sdmVGb3J3YXJkUmVmKFxuICAgICAgICAgIHByb3ZpZGVyICYmXG4gICAgICAgICAgKChwcm92aWRlciBhcyBTdGF0aWNDbGFzc1Byb3ZpZGVyIHwgQ2xhc3NQcm92aWRlcikudXNlQ2xhc3MgfHwgcHJvdmlkZXIucHJvdmlkZSkpO1xuICAgICAgaWYgKCFjbGFzc1JlZikge1xuICAgICAgICBsZXQgbmdNb2R1bGVEZXRhaWwgPSAnJztcbiAgICAgICAgaWYgKG5nTW9kdWxlVHlwZSAmJiBwcm92aWRlcnMpIHtcbiAgICAgICAgICBjb25zdCBwcm92aWRlckRldGFpbCA9IHByb3ZpZGVycy5tYXAodiA9PiB2ID09IHByb3ZpZGVyID8gJz8nICsgcHJvdmlkZXIgKyAnPycgOiAnLi4uJyk7XG4gICAgICAgICAgbmdNb2R1bGVEZXRhaWwgPVxuICAgICAgICAgICAgICBgIC0gb25seSBpbnN0YW5jZXMgb2YgUHJvdmlkZXIgYW5kIFR5cGUgYXJlIGFsbG93ZWQsIGdvdDogWyR7cHJvdmlkZXJEZXRhaWwuam9pbignLCAnKX1dYDtcbiAgICAgICAgfVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgICBgSW52YWxpZCBwcm92aWRlciBmb3IgdGhlIE5nTW9kdWxlICcke3N0cmluZ2lmeShuZ01vZHVsZVR5cGUpfSdgICsgbmdNb2R1bGVEZXRhaWwpO1xuICAgICAgfVxuICAgICAgaWYgKGhhc0RlcHMocHJvdmlkZXIpKSB7XG4gICAgICAgIGZhY3RvcnkgPSAoKSA9PiBuZXcgKGNsYXNzUmVmKSguLi5pbmplY3RBcmdzKHByb3ZpZGVyLmRlcHMpKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBpbmplY3RhYmxlRGVmT3JJbmplY3RvckRlZkZhY3RvcnkoY2xhc3NSZWYpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gZmFjdG9yeTtcbn1cblxuZnVuY3Rpb24gbWFrZVJlY29yZDxUPihcbiAgICBmYWN0b3J5OiAoKCkgPT4gVCkgfCB1bmRlZmluZWQsIHZhbHVlOiBUIHwge30sIG11bHRpOiBib29sZWFuID0gZmFsc2UpOiBSZWNvcmQ8VD4ge1xuICByZXR1cm4ge1xuICAgIGZhY3Rvcnk6IGZhY3RvcnksXG4gICAgdmFsdWU6IHZhbHVlLFxuICAgIG11bHRpOiBtdWx0aSA/IFtdIDogdW5kZWZpbmVkLFxuICB9O1xufVxuXG5mdW5jdGlvbiBkZWVwRm9yRWFjaDxUPihpbnB1dDogKFQgfCBhbnlbXSlbXSwgZm46ICh2YWx1ZTogVCkgPT4gdm9pZCk6IHZvaWQge1xuICBpbnB1dC5mb3JFYWNoKHZhbHVlID0+IEFycmF5LmlzQXJyYXkodmFsdWUpID8gZGVlcEZvckVhY2godmFsdWUsIGZuKSA6IGZuKHZhbHVlKSk7XG59XG5cbmZ1bmN0aW9uIGlzVmFsdWVQcm92aWRlcih2YWx1ZTogU2luZ2xlUHJvdmlkZXIpOiB2YWx1ZSBpcyBWYWx1ZVByb3ZpZGVyIHtcbiAgcmV0dXJuIHZhbHVlICYmIHR5cGVvZiB2YWx1ZSA9PSAnb2JqZWN0JyAmJiBVU0VfVkFMVUUgaW4gdmFsdWU7XG59XG5cbmZ1bmN0aW9uIGlzRXhpc3RpbmdQcm92aWRlcih2YWx1ZTogU2luZ2xlUHJvdmlkZXIpOiB2YWx1ZSBpcyBFeGlzdGluZ1Byb3ZpZGVyIHtcbiAgcmV0dXJuICEhKHZhbHVlICYmICh2YWx1ZSBhcyBFeGlzdGluZ1Byb3ZpZGVyKS51c2VFeGlzdGluZyk7XG59XG5cbmZ1bmN0aW9uIGlzRmFjdG9yeVByb3ZpZGVyKHZhbHVlOiBTaW5nbGVQcm92aWRlcik6IHZhbHVlIGlzIEZhY3RvcnlQcm92aWRlciB7XG4gIHJldHVybiAhISh2YWx1ZSAmJiAodmFsdWUgYXMgRmFjdG9yeVByb3ZpZGVyKS51c2VGYWN0b3J5KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzVHlwZVByb3ZpZGVyKHZhbHVlOiBTaW5nbGVQcm92aWRlcik6IHZhbHVlIGlzIFR5cGVQcm92aWRlciB7XG4gIHJldHVybiB0eXBlb2YgdmFsdWUgPT09ICdmdW5jdGlvbic7XG59XG5cbmZ1bmN0aW9uIGhhc0RlcHModmFsdWU6IENsYXNzUHJvdmlkZXIgfCBDb25zdHJ1Y3RvclByb3ZpZGVyIHwgU3RhdGljQ2xhc3NQcm92aWRlcik6XG4gICAgdmFsdWUgaXMgQ2xhc3NQcm92aWRlciZ7ZGVwczogYW55W119IHtcbiAgcmV0dXJuICEhKHZhbHVlIGFzIGFueSkuZGVwcztcbn1cblxuZnVuY3Rpb24gaGFzT25EZXN0cm95KHZhbHVlOiBhbnkpOiB2YWx1ZSBpcyBPbkRlc3Ryb3kge1xuICByZXR1cm4gdHlwZW9mIHZhbHVlID09PSAnb2JqZWN0JyAmJiB2YWx1ZSAhPSBudWxsICYmICh2YWx1ZSBhcyBPbkRlc3Ryb3kpLm5nT25EZXN0cm95ICYmXG4gICAgICB0eXBlb2YodmFsdWUgYXMgT25EZXN0cm95KS5uZ09uRGVzdHJveSA9PT0gJ2Z1bmN0aW9uJztcbn1cblxuZnVuY3Rpb24gY291bGRCZUluamVjdGFibGVUeXBlKHZhbHVlOiBhbnkpOiB2YWx1ZSBpcyBUeXBlPGFueT58SW5qZWN0aW9uVG9rZW48YW55PiB7XG4gIHJldHVybiAodHlwZW9mIHZhbHVlID09PSAnZnVuY3Rpb24nKSB8fFxuICAgICAgKHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcgJiYgdmFsdWUgaW5zdGFuY2VvZiBJbmplY3Rpb25Ub2tlbik7XG59XG4iXX0=