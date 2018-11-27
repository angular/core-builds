/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as tslib_1 from "tslib";
import { stringify } from '../util';
import { getInjectableDef, getInjectorDef } from './defs';
import { resolveForwardRef } from './forward_ref';
import { InjectionToken } from './injection_token';
import { INJECTOR, NullInjector, THROW_IF_NOT_FOUND, USE_VALUE } from './injector';
import { inject, injectArgs, setCurrentInjector } from './injector_compatibility';
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
        additionalProviders &&
            deepForEach(additionalProviders, function (provider) { return _this.processProvider(provider); });
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
        if (flags === void 0) { flags = 0 /* Default */; }
        this.assertNotDestroyed();
        // Set the injection context.
        var previousInjector = setCurrentInjector(this);
        try {
            // Check for the SkipSelf flag.
            if (!(flags & 4 /* SkipSelf */)) {
                // SkipSelf isn't set, check if the record belongs to this injector.
                var record = this.records.get(token);
                if (record === undefined) {
                    // No record, but maybe the token is scoped to this injector. Look for an ngInjectableDef
                    // with a scope matching this injector.
                    var def = couldBeInjectableType(token) && getInjectableDef(token);
                    if (def && this.injectableDefInScope(def)) {
                        // Found an ngInjectableDef and it's scoped to this injector. Pretend as if it was here
                        // all along.
                        record = makeRecord(injectableDefFactory(token), NOT_YET);
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
            var nextInjector = !(flags & 2 /* Self */) ? this.parent : getNullInjector();
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
        this.records.set(defType, makeRecord(def.factory));
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
        if (def.providers != null && !isDuplicate) {
            deepForEach(def.providers, function (provider) { return _this.processProvider(provider); });
        }
        // Finally, include providers from an InjectorDefTypeWithProviders if there was one.
        deepForEach(providers, function (provider) { return _this.processProvider(provider); });
    };
    /**
     * Process a `SingleProvider` and add it.
     */
    R3Injector.prototype.processProvider = function (provider) {
        // Determine the token from the provider. Either it's its own token, or has a {provide: ...}
        // property.
        provider = resolveForwardRef(provider);
        var token = isTypeProvider(provider) ? provider : resolveForwardRef(provider.provide);
        // Construct a `Record` for the provider.
        var record = providerToRecord(provider);
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
            throw new Error("Circular dep for " + stringify(token));
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
function injectableDefFactory(token) {
    var injectableDef = getInjectableDef(token);
    if (injectableDef === null) {
        if (token instanceof InjectionToken) {
            throw new Error("Token " + stringify(token) + " is missing an ngInjectableDef definition.");
        }
        // TODO(alxhub): there should probably be a strict mode which throws here instead of assuming a
        // no-args constructor.
        return function () { return new token(); };
    }
    return injectableDef.factory;
}
function providerToRecord(provider) {
    var factory = providerToFactory(provider);
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
export function providerToFactory(provider) {
    var factory = undefined;
    if (isTypeProvider(provider)) {
        return injectableDefFactory(resolveForwardRef(provider));
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
            var classRef_1 = resolveForwardRef(provider.useClass || provider.provide);
            if (hasDeps(provider)) {
                factory = function () { return new ((classRef_1).bind.apply((classRef_1), tslib_1.__spread([void 0], injectArgs(provider.deps))))(); };
            }
            else {
                return injectableDefFactory(classRef_1);
            }
        }
    }
    return factory;
}
function makeRecord(factory, value, multi) {
    if (value === void 0) { value = NOT_YET; }
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
    return USE_VALUE in value;
}
function isExistingProvider(value) {
    return !!value.useExisting;
}
function isFactoryProvider(value) {
    return !!value.useFactory;
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicjNfaW5qZWN0b3IuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9kaS9yM19pbmplY3Rvci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7O0FBSUgsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLFNBQVMsQ0FBQztBQUVsQyxPQUFPLEVBQXlFLGdCQUFnQixFQUFFLGNBQWMsRUFBQyxNQUFNLFFBQVEsQ0FBQztBQUNoSSxPQUFPLEVBQUMsaUJBQWlCLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFDaEQsT0FBTyxFQUFDLGNBQWMsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQ2pELE9BQU8sRUFBQyxRQUFRLEVBQVksWUFBWSxFQUFFLGtCQUFrQixFQUFFLFNBQVMsRUFBQyxNQUFNLFlBQVksQ0FBQztBQUMzRixPQUFPLEVBQWMsTUFBTSxFQUFFLFVBQVUsRUFBRSxrQkFBa0IsRUFBQyxNQUFNLDBCQUEwQixDQUFDO0FBRTdGLE9BQU8sRUFBQyxRQUFRLEVBQUMsTUFBTSxTQUFTLENBQUM7QUFVakM7O0dBRUc7QUFDSCxJQUFNLE9BQU8sR0FBRyxFQUFFLENBQUM7QUFFbkI7Ozs7OztHQU1HO0FBQ0gsSUFBTSxRQUFRLEdBQUcsRUFBRSxDQUFDO0FBRXBCLElBQU0sV0FBVyxHQUFHLEVBQVcsQ0FBQztBQUVoQzs7R0FFRztBQUNILElBQUksYUFBYSxHQUF1QixTQUFTLENBQUM7QUFFbEQsU0FBUyxlQUFlO0lBQ3RCLElBQUksYUFBYSxLQUFLLFNBQVMsRUFBRTtRQUMvQixhQUFhLEdBQUcsSUFBSSxZQUFZLEVBQUUsQ0FBQztLQUNwQztJQUNELE9BQU8sYUFBYSxDQUFDO0FBQ3ZCLENBQUM7QUFZRDs7OztHQUlHO0FBQ0gsTUFBTSxVQUFVLGNBQWMsQ0FDMUIsT0FBb0MsRUFBRSxNQUE4QixFQUNwRSxtQkFBbUQ7SUFEYix1QkFBQSxFQUFBLGFB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RCxTQUFTLFlBQVksQ0FBQyxLQUFVO0lBQzlCLE9BQU8sT0FBTyxLQUFLLEtBQUssUUFBUSxJQUFJLEtBQUssSUFBSSxJQUFJLElBQUssS0FBbUIsQ0FBQyxXQUFXO1FBQ2pGLE9BQU8sS0FBbUIsQ0FBQyxXQUFXLEtBQUssVUFBVSxDQUFDO0FBQzVELENBQUM7QUFFRCxTQUFTLHFCQUFxQixDQUFDLEtBQVU7SUFDdkMsT0FBTyxDQUFDLE9BQU8sS0FBSyxLQUFLLFVBQVUsQ0FBQztRQUNoQyxDQUFDLE9BQU8sS0FBSyxLQUFLLFFBQVEsSUFBSSxLQUFLLFlBQVksY0FBYyxDQUFDLENBQUM7QUFDckUsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtPbkRlc3Ryb3l9IGZyb20gJy4uL21ldGFkYXRhL2xpZmVjeWNsZV9ob29rcyc7XG5pbXBvcnQge1R5cGV9IGZyb20gJy4uL3R5cGUnO1xuaW1wb3J0IHtzdHJpbmdpZnl9IGZyb20gJy4uL3V0aWwnO1xuXG5pbXBvcnQge0luamVjdGFibGVEZWYsIEluamVjdGFibGVUeXBlLCBJbmplY3RvclR5cGUsIEluamVjdG9yVHlwZVdpdGhQcm92aWRlcnMsIGdldEluamVjdGFibGVEZWYsIGdldEluamVjdG9yRGVmfSBmcm9tICcuL2RlZnMnO1xuaW1wb3J0IHtyZXNvbHZlRm9yd2FyZFJlZn0gZnJvbSAnLi9mb3J3YXJkX3JlZic7XG5pbXBvcnQge0luamVjdGlvblRva2VufSBmcm9tICcuL2luamVjdGlvbl90b2tlbic7XG5pbXBvcnQge0lOSkVDVE9SLCBJbmplY3RvciwgTnVsbEluamVjdG9yLCBUSFJPV19JRl9OT1RfRk9VTkQsIFVTRV9WQUxVRX0gZnJvbSAnLi9pbmplY3Rvcic7XG5pbXBvcnQge0luamVjdEZsYWdzLCBpbmplY3QsIGluamVjdEFyZ3MsIHNldEN1cnJlbnRJbmplY3Rvcn0gZnJvbSAnLi9pbmplY3Rvcl9jb21wYXRpYmlsaXR5JztcbmltcG9ydCB7Q2xhc3NQcm92aWRlciwgQ29uc3RydWN0b3JQcm92aWRlciwgRXhpc3RpbmdQcm92aWRlciwgRmFjdG9yeVByb3ZpZGVyLCBQcm92aWRlciwgU3RhdGljQ2xhc3NQcm92aWRlciwgU3RhdGljUHJvdmlkZXIsIFR5cGVQcm92aWRlciwgVmFsdWVQcm92aWRlcn0gZnJvbSAnLi9wcm92aWRlcic7XG5pbXBvcnQge0FQUF9ST09UfSBmcm9tICcuL3Njb3BlJztcblxuXG5cbi8qKlxuICogSW50ZXJuYWwgdHlwZSBmb3IgYSBzaW5nbGUgcHJvdmlkZXIgaW4gYSBkZWVwIHByb3ZpZGVyIGFycmF5LlxuICovXG50eXBlIFNpbmdsZVByb3ZpZGVyID0gVHlwZVByb3ZpZGVyIHwgVmFsdWVQcm92aWRlciB8IENsYXNzUHJvdmlkZXIgfCBDb25zdHJ1Y3RvclByb3ZpZGVyIHxcbiAgICBFeGlzdGluZ1Byb3ZpZGVyIHwgRmFjdG9yeVByb3ZpZGVyIHwgU3RhdGljQ2xhc3NQcm92aWRlcjtcblxuLyoqXG4gKiBNYXJrZXIgd2hpY2ggaW5kaWNhdGVzIHRoYXQgYSB2YWx1ZSBoYXMgbm90IHlldCBiZWVuIGNyZWF0ZWQgZnJvbSB0aGUgZmFjdG9yeSBmdW5jdGlvbi5cbiAqL1xuY29uc3QgTk9UX1lFVCA9IHt9O1xuXG4vKipcbiAqIE1hcmtlciB3aGljaCBpbmRpY2F0ZXMgdGhhdCB0aGUgZmFjdG9yeSBmdW5jdGlvbiBmb3IgYSB0b2tlbiBpcyBpbiB0aGUgcHJvY2VzcyBvZiBiZWluZyBjYWxsZWQuXG4gKlxuICogSWYgdGhlIGluamVjdG9yIGlzIGFza2VkIHRvIGluamVjdCBhIHRva2VuIHdpdGggaXRzIHZhbHVlIHNldCB0byBDSVJDVUxBUiwgdGhhdCBpbmRpY2F0ZXNcbiAqIGluamVjdGlvbiBvZiBhIGRlcGVuZGVuY3kgaGFzIHJlY3Vyc2l2ZWx5IGF0dGVtcHRlZCB0byBpbmplY3QgdGhlIG9yaWdpbmFsIHRva2VuLCBhbmQgdGhlcmUgaXNcbiAqIGEgY2lyY3VsYXIgZGVwZW5kZW5jeSBhbW9uZyB0aGUgcHJvdmlkZXJzLlxuICovXG5jb25zdCBDSVJDVUxBUiA9IHt9O1xuXG5jb25zdCBFTVBUWV9BUlJBWSA9IFtdIGFzIGFueVtdO1xuXG4vKipcbiAqIEEgbGF6aWx5IGluaXRpYWxpemVkIE51bGxJbmplY3Rvci5cbiAqL1xubGV0IE5VTExfSU5KRUNUT1I6IEluamVjdG9yfHVuZGVmaW5lZCA9IHVuZGVmaW5lZDtcblxuZnVuY3Rpb24gZ2V0TnVsbEluamVjdG9yKCk6IEluamVjdG9yIHtcbiAgaWYgKE5VTExfSU5KRUNUT1IgPT09IHVuZGVmaW5lZCkge1xuICAgIE5VTExfSU5KRUNUT1IgPSBuZXcgTnVsbEluamVjdG9yKCk7XG4gIH1cbiAgcmV0dXJuIE5VTExfSU5KRUNUT1I7XG59XG5cbi8qKlxuICogQW4gZW50cnkgaW4gdGhlIGluamVjdG9yIHdoaWNoIHRyYWNrcyBpbmZvcm1hdGlvbiBhYm91dCB0aGUgZ2l2ZW4gdG9rZW4sIGluY2x1ZGluZyBhIHBvc3NpYmxlXG4gKiBjdXJyZW50IHZhbHVlLlxuICovXG5pbnRlcmZhY2UgUmVjb3JkPFQ+IHtcbiAgZmFjdG9yeTogKCgpID0+IFQpfHVuZGVmaW5lZDtcbiAgdmFsdWU6IFR8e307XG4gIG11bHRpOiBhbnlbXXx1bmRlZmluZWQ7XG59XG5cbi8qKlxuICogQ3JlYXRlIGEgbmV3IGBJbmplY3RvcmAgd2hpY2ggaXMgY29uZmlndXJlZCB1c2luZyBhIGBkZWZUeXBlYCBvZiBgSW5qZWN0b3JUeXBlPGFueT5gcy5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVJbmplY3RvcihcbiAgICBkZWZUeXBlOiAvKiBJbmplY3RvclR5cGU8YW55PiAqLyBhbnksIHBhcmVudDogSW5qZWN0b3IgfCBudWxsID0gbnVsbCxcbiAgICBhZGRpdGlvbmFsUHJvdmlkZXJzOiBTdGF0aWNQcm92aWRlcltdIHwgbnVsbCA9IG51bGwpOiBJbmplY3RvciB7XG4gIHBhcmVudCA9IHBhcmVudCB8fCBnZXROdWxsSW5qZWN0b3IoKTtcbiAgcmV0dXJuIG5ldyBSM0luamVjdG9yKGRlZlR5cGUsIGFkZGl0aW9uYWxQcm92aWRlcnMsIHBhcmVudCk7XG59XG5cbmV4cG9ydCBjbGFzcyBSM0luamVjdG9yIHtcbiAgLyoqXG4gICAqIE1hcCBvZiB0b2tlbnMgdG8gcmVjb3JkcyB3aGljaCBjb250YWluIHRoZSBpbnN0YW5jZXMgb2YgdGhvc2UgdG9rZW5zLlxuICAgKi9cbiAgcHJpdmF0ZSByZWNvcmRzID0gbmV3IE1hcDxUeXBlPGFueT58SW5qZWN0aW9uVG9rZW48YW55PiwgUmVjb3JkPGFueT4+KCk7XG5cbiAgLyoqXG4gICAqIFRoZSB0cmFuc2l0aXZlIHNldCBvZiBgSW5qZWN0b3JUeXBlYHMgd2hpY2ggZGVmaW5lIHRoaXMgaW5qZWN0b3IuXG4gICAqL1xuICBwcml2YXRlIGluamVjdG9yRGVmVHlwZXMgPSBuZXcgU2V0PEluamVjdG9yVHlwZTxhbnk+PigpO1xuXG4gIC8qKlxuICAgKiBTZXQgb2YgdmFsdWVzIGluc3RhbnRpYXRlZCBieSB0aGlzIGluamVjdG9yIHdoaWNoIGNvbnRhaW4gYG5nT25EZXN0cm95YCBsaWZlY3ljbGUgaG9va3MuXG4gICAqL1xuICBwcml2YXRlIG9uRGVzdHJveSA9IG5ldyBTZXQ8T25EZXN0cm95PigpO1xuXG4gIC8qKlxuICAgKiBGbGFnIGluZGljYXRpbmcgdGhpcyBpbmplY3RvciBwcm92aWRlcyB0aGUgQVBQX1JPT1RfU0NPUEUgdG9rZW4sIGFuZCB0aHVzIGNvdW50cyBhcyB0aGVcbiAgICogcm9vdCBzY29wZS5cbiAgICovXG4gIHByaXZhdGUgcmVhZG9ubHkgaXNSb290SW5qZWN0b3I6IGJvb2xlYW47XG5cbiAgLyoqXG4gICAqIEZsYWcgaW5kaWNhdGluZyB0aGF0IHRoaXMgaW5qZWN0b3Igd2FzIHByZXZpb3VzbHkgZGVzdHJveWVkLlxuICAgKi9cbiAgcHJpdmF0ZSBkZXN0cm95ZWQgPSBmYWxzZTtcblxuICBjb25zdHJ1Y3RvcihcbiAgICAgIGRlZjogSW5qZWN0b3JUeXBlPGFueT4sIGFkZGl0aW9uYWxQcm92aWRlcnM6IFN0YXRpY1Byb3ZpZGVyW118bnVsbCxcbiAgICAgIHJlYWRvbmx5IHBhcmVudDogSW5qZWN0b3IpIHtcbiAgICAvLyBTdGFydCBvZmYgYnkgY3JlYXRpbmcgUmVjb3JkcyBmb3IgZXZlcnkgcHJvdmlkZXIgZGVjbGFyZWQgaW4gZXZlcnkgSW5qZWN0b3JUeXBlXG4gICAgLy8gaW5jbHVkZWQgdHJhbnNpdGl2ZWx5IGluIGBkZWZgLlxuICAgIGNvbnN0IGRlZHVwU3RhY2s6IEluamVjdG9yVHlwZTxhbnk+W10gPSBbXTtcbiAgICBkZWVwRm9yRWFjaChbZGVmXSwgaW5qZWN0b3JEZWYgPT4gdGhpcy5wcm9jZXNzSW5qZWN0b3JUeXBlKGluamVjdG9yRGVmLCBbXSwgZGVkdXBTdGFjaykpO1xuXG4gICAgYWRkaXRpb25hbFByb3ZpZGVycyAmJlxuICAgICAgICBkZWVwRm9yRWFjaChhZGRpdGlvbmFsUHJvdmlkZXJzLCBwcm92aWRlciA9PiB0aGlzLnByb2Nlc3NQcm92aWRlcihwcm92aWRlcikpO1xuXG5cbiAgICAvLyBNYWtlIHN1cmUgdGhlIElOSkVDVE9SIHRva2VuIHByb3ZpZGVzIHRoaXMgaW5qZWN0b3IuXG4gICAgdGhpcy5yZWNvcmRzLnNldChJTkpFQ1RPUiwgbWFrZVJlY29yZCh1bmRlZmluZWQsIHRoaXMpKTtcblxuICAgIC8vIERldGVjdCB3aGV0aGVyIHRoaXMgaW5qZWN0b3IgaGFzIHRoZSBBUFBfUk9PVF9TQ09QRSB0b2tlbiBhbmQgdGh1cyBzaG91bGQgcHJvdmlkZVxuICAgIC8vIGFueSBpbmplY3RhYmxlIHNjb3BlZCB0byBBUFBfUk9PVF9TQ09QRS5cbiAgICB0aGlzLmlzUm9vdEluamVjdG9yID0gdGhpcy5yZWNvcmRzLmhhcyhBUFBfUk9PVCk7XG5cbiAgICAvLyBFYWdlcmx5IGluc3RhbnRpYXRlIHRoZSBJbmplY3RvclR5cGUgY2xhc3NlcyB0aGVtc2VsdmVzLlxuICAgIHRoaXMuaW5qZWN0b3JEZWZUeXBlcy5mb3JFYWNoKGRlZlR5cGUgPT4gdGhpcy5nZXQoZGVmVHlwZSkpO1xuICB9XG5cbiAgLyoqXG4gICAqIERlc3Ryb3kgdGhlIGluamVjdG9yIGFuZCByZWxlYXNlIHJlZmVyZW5jZXMgdG8gZXZlcnkgaW5zdGFuY2Ugb3IgcHJvdmlkZXIgYXNzb2NpYXRlZCB3aXRoIGl0LlxuICAgKlxuICAgKiBBbHNvIGNhbGxzIHRoZSBgT25EZXN0cm95YCBsaWZlY3ljbGUgaG9va3Mgb2YgZXZlcnkgaW5zdGFuY2UgdGhhdCB3YXMgY3JlYXRlZCBmb3Igd2hpY2ggYVxuICAgKiBob29rIHdhcyBmb3VuZC5cbiAgICovXG4gIGRlc3Ryb3koKTogdm9pZCB7XG4gICAgdGhpcy5hc3NlcnROb3REZXN0cm95ZWQoKTtcblxuICAgIC8vIFNldCBkZXN0cm95ZWQgPSB0cnVlIGZpcnN0LCBpbiBjYXNlIGxpZmVjeWNsZSBob29rcyByZS1lbnRlciBkZXN0cm95KCkuXG4gICAgdGhpcy5kZXN0cm95ZWQgPSB0cnVlO1xuICAgIHRyeSB7XG4gICAgICAvLyBDYWxsIGFsbCB0aGUgbGlmZWN5Y2xlIGhvb2tzLlxuICAgICAgdGhpcy5vbkRlc3Ryb3kuZm9yRWFjaChzZXJ2aWNlID0+IHNlcnZpY2UubmdPbkRlc3Ryb3koKSk7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIC8vIFJlbGVhc2UgYWxsIHJlZmVyZW5jZXMuXG4gICAgICB0aGlzLnJlY29yZHMuY2xlYXIoKTtcbiAgICAgIHRoaXMub25EZXN0cm95LmNsZWFyKCk7XG4gICAgICB0aGlzLmluamVjdG9yRGVmVHlwZXMuY2xlYXIoKTtcbiAgICB9XG4gIH1cblxuICBnZXQ8VD4oXG4gICAgICB0b2tlbjogVHlwZTxUPnxJbmplY3Rpb25Ub2tlbjxUPiwgbm90Rm91bmRWYWx1ZTogYW55ID0gVEhST1dfSUZfTk9UX0ZPVU5ELFxuICAgICAgZmxhZ3MgPSBJbmplY3RGbGFncy5EZWZhdWx0KTogVCB7XG4gICAgdGhpcy5hc3NlcnROb3REZXN0cm95ZWQoKTtcbiAgICAvLyBTZXQgdGhlIGluamVjdGlvbiBjb250ZXh0LlxuICAgIGNvbnN0IHByZXZpb3VzSW5qZWN0b3IgPSBzZXRDdXJyZW50SW5qZWN0b3IodGhpcyk7XG4gICAgdHJ5IHtcbiAgICAgIC8vIENoZWNrIGZvciB0aGUgU2tpcFNlbGYgZmxhZy5cbiAgICAgIGlmICghKGZsYWdzICYgSW5qZWN0RmxhZ3MuU2tpcFNlbGYpKSB7XG4gICAgICAgIC8vIFNraXBTZWxmIGlzbid0IHNldCwgY2hlY2sgaWYgdGhlIHJlY29yZCBiZWxvbmdzIHRvIHRoaXMgaW5qZWN0b3IuXG4gICAgICAgIGxldCByZWNvcmQ6IFJlY29yZDxUPnx1bmRlZmluZWQgPSB0aGlzLnJlY29yZHMuZ2V0KHRva2VuKTtcbiAgICAgICAgaWYgKHJlY29yZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgLy8gTm8gcmVjb3JkLCBidXQgbWF5YmUgdGhlIHRva2VuIGlzIHNjb3BlZCB0byB0aGlzIGluamVjdG9yLiBMb29rIGZvciBhbiBuZ0luamVjdGFibGVEZWZcbiAgICAgICAgICAvLyB3aXRoIGEgc2NvcGUgbWF0Y2hpbmcgdGhpcyBpbmplY3Rvci5cbiAgICAgICAgICBjb25zdCBkZWYgPSBjb3VsZEJlSW5qZWN0YWJsZVR5cGUodG9rZW4pICYmIGdldEluamVjdGFibGVEZWYodG9rZW4pO1xuICAgICAgICAgIGlmIChkZWYgJiYgdGhpcy5pbmplY3RhYmxlRGVmSW5TY29wZShkZWYpKSB7XG4gICAgICAgICAgICAvLyBGb3VuZCBhbiBuZ0luamVjdGFibGVEZWYgYW5kIGl0J3Mgc2NvcGVkIHRvIHRoaXMgaW5qZWN0b3IuIFByZXRlbmQgYXMgaWYgaXQgd2FzIGhlcmVcbiAgICAgICAgICAgIC8vIGFsbCBhbG9uZy5cbiAgICAgICAgICAgIHJlY29yZCA9IG1ha2VSZWNvcmQoaW5qZWN0YWJsZURlZkZhY3RvcnkodG9rZW4pLCBOT1RfWUVUKTtcbiAgICAgICAgICAgIHRoaXMucmVjb3Jkcy5zZXQodG9rZW4sIHJlY29yZCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8vIElmIGEgcmVjb3JkIHdhcyBmb3VuZCwgZ2V0IHRoZSBpbnN0YW5jZSBmb3IgaXQgYW5kIHJldHVybiBpdC5cbiAgICAgICAgaWYgKHJlY29yZCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMuaHlkcmF0ZSh0b2tlbiwgcmVjb3JkKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBTZWxlY3QgdGhlIG5leHQgaW5qZWN0b3IgYmFzZWQgb24gdGhlIFNlbGYgZmxhZyAtIGlmIHNlbGYgaXMgc2V0LCB0aGUgbmV4dCBpbmplY3RvciBpc1xuICAgICAgLy8gdGhlIE51bGxJbmplY3Rvciwgb3RoZXJ3aXNlIGl0J3MgdGhlIHBhcmVudC5cbiAgICAgIGNvbnN0IG5leHRJbmplY3RvciA9ICEoZmxhZ3MgJiBJbmplY3RGbGFncy5TZWxmKSA/IHRoaXMucGFyZW50IDogZ2V0TnVsbEluamVjdG9yKCk7XG4gICAgICByZXR1cm4gbmV4dEluamVjdG9yLmdldCh0b2tlbiwgbm90Rm91bmRWYWx1ZSk7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIC8vIExhc3RseSwgY2xlYW4gdXAgdGhlIHN0YXRlIGJ5IHJlc3RvcmluZyB0aGUgcHJldmlvdXMgaW5qZWN0b3IuXG4gICAgICBzZXRDdXJyZW50SW5qZWN0b3IocHJldmlvdXNJbmplY3Rvcik7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBhc3NlcnROb3REZXN0cm95ZWQoKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuZGVzdHJveWVkKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0luamVjdG9yIGhhcyBhbHJlYWR5IGJlZW4gZGVzdHJveWVkLicpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBBZGQgYW4gYEluamVjdG9yVHlwZWAgb3IgYEluamVjdG9yRGVmVHlwZVdpdGhQcm92aWRlcnNgIGFuZCBhbGwgb2YgaXRzIHRyYW5zaXRpdmUgcHJvdmlkZXJzXG4gICAqIHRvIHRoaXMgaW5qZWN0b3IuXG4gICAqL1xuICBwcml2YXRlIHByb2Nlc3NJbmplY3RvclR5cGUoXG4gICAgICBkZWZPcldyYXBwZWREZWY6IEluamVjdG9yVHlwZTxhbnk+fEluamVjdG9yVHlwZVdpdGhQcm92aWRlcnM8YW55PixcbiAgICAgIHBhcmVudHM6IEluamVjdG9yVHlwZTxhbnk+W10sIGRlZHVwU3RhY2s6IEluamVjdG9yVHlwZTxhbnk+W10pIHtcbiAgICBkZWZPcldyYXBwZWREZWYgPSByZXNvbHZlRm9yd2FyZFJlZihkZWZPcldyYXBwZWREZWYpO1xuICAgIGlmICghZGVmT3JXcmFwcGVkRGVmKSByZXR1cm47XG5cbiAgICAvLyBFaXRoZXIgdGhlIGRlZk9yV3JhcHBlZERlZiBpcyBhbiBJbmplY3RvclR5cGUgKHdpdGggbmdJbmplY3RvckRlZikgb3IgYW5cbiAgICAvLyBJbmplY3RvckRlZlR5cGVXaXRoUHJvdmlkZXJzIChha2EgTW9kdWxlV2l0aFByb3ZpZGVycykuIERldGVjdGluZyBlaXRoZXIgaXMgYSBtZWdhbW9ycGhpY1xuICAgIC8vIHJlYWQsIHNvIGNhcmUgaXMgdGFrZW4gdG8gb25seSBkbyB0aGUgcmVhZCBvbmNlLlxuXG4gICAgLy8gRmlyc3QgYXR0ZW1wdCB0byByZWFkIHRoZSBuZ0luamVjdG9yRGVmLlxuICAgIGxldCBkZWYgPSBnZXRJbmplY3RvckRlZihkZWZPcldyYXBwZWREZWYpO1xuXG4gICAgLy8gSWYgdGhhdCdzIG5vdCBwcmVzZW50LCB0aGVuIGF0dGVtcHQgdG8gcmVhZCBuZ01vZHVsZSBmcm9tIHRoZSBJbmplY3RvckRlZlR5cGVXaXRoUHJvdmlkZXJzLlxuICAgIGNvbnN0IG5nTW9kdWxlID1cbiAgICAgICAgKGRlZiA9PSBudWxsKSAmJiAoZGVmT3JXcmFwcGVkRGVmIGFzIEluamVjdG9yVHlwZVdpdGhQcm92aWRlcnM8YW55PikubmdNb2R1bGUgfHwgdW5kZWZpbmVkO1xuXG4gICAgLy8gRGV0ZXJtaW5lIHRoZSBJbmplY3RvclR5cGUuIEluIHRoZSBjYXNlIHdoZXJlIGBkZWZPcldyYXBwZWREZWZgIGlzIGFuIGBJbmplY3RvclR5cGVgLFxuICAgIC8vIHRoZW4gdGhpcyBpcyBlYXN5LiBJbiB0aGUgY2FzZSBvZiBhbiBJbmplY3RvckRlZlR5cGVXaXRoUHJvdmlkZXJzLCB0aGVuIHRoZSBkZWZpbml0aW9uIHR5cGVcbiAgICAvLyBpcyB0aGUgYG5nTW9kdWxlYC5cbiAgICBjb25zdCBkZWZUeXBlOiBJbmplY3RvclR5cGU8YW55PiA9XG4gICAgICAgIChuZ01vZHVsZSA9PT0gdW5kZWZpbmVkKSA/IChkZWZPcldyYXBwZWREZWYgYXMgSW5qZWN0b3JUeXBlPGFueT4pIDogbmdNb2R1bGU7XG5cbiAgICAvLyBDaGVjayBmb3IgY2lyY3VsYXIgZGVwZW5kZW5jaWVzLlxuICAgIGlmIChuZ0Rldk1vZGUgJiYgcGFyZW50cy5pbmRleE9mKGRlZlR5cGUpICE9PSAtMSkge1xuICAgICAgY29uc3QgZGVmTmFtZSA9IHN0cmluZ2lmeShkZWZUeXBlKTtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICBgQ2lyY3VsYXIgZGVwZW5kZW5jeSBpbiBESSBkZXRlY3RlZCBmb3IgdHlwZSAke2RlZk5hbWV9LiBEZXBlbmRlbmN5IHBhdGg6ICR7cGFyZW50cy5tYXAoZGVmVHlwZSA9PiBzdHJpbmdpZnkoZGVmVHlwZSkpLmpvaW4oJyA+ICcpfSA+ICR7ZGVmTmFtZX0uYCk7XG4gICAgfVxuXG4gICAgLy8gQ2hlY2sgZm9yIG11bHRpcGxlIGltcG9ydHMgb2YgdGhlIHNhbWUgbW9kdWxlXG4gICAgY29uc3QgaXNEdXBsaWNhdGUgPSBkZWR1cFN0YWNrLmluZGV4T2YoZGVmVHlwZSkgIT09IC0xO1xuXG4gICAgLy8gSWYgZGVmT3JXcmFwcGVkVHlwZSB3YXMgYW4gSW5qZWN0b3JEZWZUeXBlV2l0aFByb3ZpZGVycywgdGhlbiAucHJvdmlkZXJzIG1heSBob2xkIHNvbWVcbiAgICAvLyBleHRyYSBwcm92aWRlcnMuXG4gICAgY29uc3QgcHJvdmlkZXJzID1cbiAgICAgICAgKG5nTW9kdWxlICE9PSB1bmRlZmluZWQpICYmIChkZWZPcldyYXBwZWREZWYgYXMgSW5qZWN0b3JUeXBlV2l0aFByb3ZpZGVyczxhbnk+KS5wcm92aWRlcnMgfHxcbiAgICAgICAgRU1QVFlfQVJSQVk7XG5cbiAgICAvLyBGaW5hbGx5LCBpZiBkZWZPcldyYXBwZWRUeXBlIHdhcyBhbiBgSW5qZWN0b3JEZWZUeXBlV2l0aFByb3ZpZGVyc2AsIHRoZW4gdGhlIGFjdHVhbFxuICAgIC8vIGBJbmplY3RvckRlZmAgaXMgb24gaXRzIGBuZ01vZHVsZWAuXG4gICAgaWYgKG5nTW9kdWxlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGRlZiA9IGdldEluamVjdG9yRGVmKG5nTW9kdWxlKTtcbiAgICB9XG5cbiAgICAvLyBJZiBubyBkZWZpbml0aW9uIHdhcyBmb3VuZCwgaXQgbWlnaHQgYmUgZnJvbSBleHBvcnRzLiBSZW1vdmUgaXQuXG4gICAgaWYgKGRlZiA9PSBudWxsKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gVHJhY2sgdGhlIEluamVjdG9yVHlwZSBhbmQgYWRkIGEgcHJvdmlkZXIgZm9yIGl0LlxuICAgIHRoaXMuaW5qZWN0b3JEZWZUeXBlcy5hZGQoZGVmVHlwZSk7XG4gICAgdGhpcy5yZWNvcmRzLnNldChkZWZUeXBlLCBtYWtlUmVjb3JkKGRlZi5mYWN0b3J5KSk7XG5cbiAgICAvLyBBZGQgcHJvdmlkZXJzIGluIHRoZSBzYW1lIHdheSB0aGF0IEBOZ01vZHVsZSByZXNvbHV0aW9uIGRpZDpcblxuICAgIC8vIEZpcnN0LCBpbmNsdWRlIHByb3ZpZGVycyBmcm9tIGFueSBpbXBvcnRzLlxuICAgIGlmIChkZWYuaW1wb3J0cyAhPSBudWxsICYmICFpc0R1cGxpY2F0ZSkge1xuICAgICAgLy8gQmVmb3JlIHByb2Nlc3NpbmcgZGVmVHlwZSdzIGltcG9ydHMsIGFkZCBpdCB0byB0aGUgc2V0IG9mIHBhcmVudHMuIFRoaXMgd2F5LCBpZiBpdCBlbmRzXG4gICAgICAvLyB1cCBkZWVwbHkgaW1wb3J0aW5nIGl0c2VsZiwgdGhpcyBjYW4gYmUgZGV0ZWN0ZWQuXG4gICAgICBuZ0Rldk1vZGUgJiYgcGFyZW50cy5wdXNoKGRlZlR5cGUpO1xuICAgICAgLy8gQWRkIGl0IHRvIHRoZSBzZXQgb2YgZGVkdXBzLiBUaGlzIHdheSB3ZSBjYW4gZGV0ZWN0IG11bHRpcGxlIGltcG9ydHMgb2YgdGhlIHNhbWUgbW9kdWxlXG4gICAgICBkZWR1cFN0YWNrLnB1c2goZGVmVHlwZSk7XG5cbiAgICAgIHRyeSB7XG4gICAgICAgIGRlZXBGb3JFYWNoKFxuICAgICAgICAgICAgZGVmLmltcG9ydHMsIGltcG9ydGVkID0+IHRoaXMucHJvY2Vzc0luamVjdG9yVHlwZShpbXBvcnRlZCwgcGFyZW50cywgZGVkdXBTdGFjaykpO1xuICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgLy8gUmVtb3ZlIGl0IGZyb20gdGhlIHBhcmVudHMgc2V0IHdoZW4gZmluaXNoZWQuXG4gICAgICAgIG5nRGV2TW9kZSAmJiBwYXJlbnRzLnBvcCgpO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIE5leHQsIGluY2x1ZGUgcHJvdmlkZXJzIGxpc3RlZCBvbiB0aGUgZGVmaW5pdGlvbiBpdHNlbGYuXG4gICAgaWYgKGRlZi5wcm92aWRlcnMgIT0gbnVsbCAmJiAhaXNEdXBsaWNhdGUpIHtcbiAgICAgIGRlZXBGb3JFYWNoKGRlZi5wcm92aWRlcnMsIHByb3ZpZGVyID0+IHRoaXMucHJvY2Vzc1Byb3ZpZGVyKHByb3ZpZGVyKSk7XG4gICAgfVxuXG4gICAgLy8gRmluYWxseSwgaW5jbHVkZSBwcm92aWRlcnMgZnJvbSBhbiBJbmplY3RvckRlZlR5cGVXaXRoUHJvdmlkZXJzIGlmIHRoZXJlIHdhcyBvbmUuXG4gICAgZGVlcEZvckVhY2gocHJvdmlkZXJzLCBwcm92aWRlciA9PiB0aGlzLnByb2Nlc3NQcm92aWRlcihwcm92aWRlcikpO1xuICB9XG5cbiAgLyoqXG4gICAqIFByb2Nlc3MgYSBgU2luZ2xlUHJvdmlkZXJgIGFuZCBhZGQgaXQuXG4gICAqL1xuICBwcml2YXRlIHByb2Nlc3NQcm92aWRlcihwcm92aWRlcjogU2luZ2xlUHJvdmlkZXIpOiB2b2lkIHtcbiAgICAvLyBEZXRlcm1pbmUgdGhlIHRva2VuIGZyb20gdGhlIHByb3ZpZGVyLiBFaXRoZXIgaXQncyBpdHMgb3duIHRva2VuLCBvciBoYXMgYSB7cHJvdmlkZTogLi4ufVxuICAgIC8vIHByb3BlcnR5LlxuICAgIHByb3ZpZGVyID0gcmVzb2x2ZUZvcndhcmRSZWYocHJvdmlkZXIpO1xuICAgIGxldCB0b2tlbjogYW55ID0gaXNUeXBlUHJvdmlkZXIocHJvdmlkZXIpID8gcHJvdmlkZXIgOiByZXNvbHZlRm9yd2FyZFJlZihwcm92aWRlci5wcm92aWRlKTtcblxuICAgIC8vIENvbnN0cnVjdCBhIGBSZWNvcmRgIGZvciB0aGUgcHJvdmlkZXIuXG4gICAgY29uc3QgcmVjb3JkID0gcHJvdmlkZXJUb1JlY29yZChwcm92aWRlcik7XG5cbiAgICBpZiAoIWlzVHlwZVByb3ZpZGVyKHByb3ZpZGVyKSAmJiBwcm92aWRlci5tdWx0aSA9PT0gdHJ1ZSkge1xuICAgICAgLy8gSWYgdGhlIHByb3ZpZGVyIGluZGljYXRlcyB0aGF0IGl0J3MgYSBtdWx0aS1wcm92aWRlciwgcHJvY2VzcyBpdCBzcGVjaWFsbHkuXG4gICAgICAvLyBGaXJzdCBjaGVjayB3aGV0aGVyIGl0J3MgYmVlbiBkZWZpbmVkIGFscmVhZHkuXG4gICAgICBsZXQgbXVsdGlSZWNvcmQgPSB0aGlzLnJlY29yZHMuZ2V0KHRva2VuKTtcbiAgICAgIGlmIChtdWx0aVJlY29yZCkge1xuICAgICAgICAvLyBJdCBoYXMuIFRocm93IGEgbmljZSBlcnJvciBpZlxuICAgICAgICBpZiAobXVsdGlSZWNvcmQubXVsdGkgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgTWl4ZWQgbXVsdGktcHJvdmlkZXIgZm9yICR7dG9rZW59LmApO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBtdWx0aVJlY29yZCA9IG1ha2VSZWNvcmQodW5kZWZpbmVkLCBOT1RfWUVULCB0cnVlKTtcbiAgICAgICAgbXVsdGlSZWNvcmQuZmFjdG9yeSA9ICgpID0+IGluamVjdEFyZ3MobXVsdGlSZWNvcmQgIS5tdWx0aSAhKTtcbiAgICAgICAgdGhpcy5yZWNvcmRzLnNldCh0b2tlbiwgbXVsdGlSZWNvcmQpO1xuICAgICAgfVxuICAgICAgdG9rZW4gPSBwcm92aWRlcjtcbiAgICAgIG11bHRpUmVjb3JkLm11bHRpICEucHVzaChwcm92aWRlcik7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IGV4aXN0aW5nID0gdGhpcy5yZWNvcmRzLmdldCh0b2tlbik7XG4gICAgICBpZiAoZXhpc3RpbmcgJiYgZXhpc3RpbmcubXVsdGkgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYE1peGVkIG11bHRpLXByb3ZpZGVyIGZvciAke3N0cmluZ2lmeSh0b2tlbil9YCk7XG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMucmVjb3Jkcy5zZXQodG9rZW4sIHJlY29yZCk7XG4gIH1cblxuICBwcml2YXRlIGh5ZHJhdGU8VD4odG9rZW46IFR5cGU8VD58SW5qZWN0aW9uVG9rZW48VD4sIHJlY29yZDogUmVjb3JkPFQ+KTogVCB7XG4gICAgaWYgKHJlY29yZC52YWx1ZSA9PT0gQ0lSQ1VMQVIpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgQ2lyY3VsYXIgZGVwIGZvciAke3N0cmluZ2lmeSh0b2tlbil9YCk7XG4gICAgfSBlbHNlIGlmIChyZWNvcmQudmFsdWUgPT09IE5PVF9ZRVQpIHtcbiAgICAgIHJlY29yZC52YWx1ZSA9IENJUkNVTEFSO1xuICAgICAgcmVjb3JkLnZhbHVlID0gcmVjb3JkLmZhY3RvcnkgISgpO1xuICAgIH1cbiAgICBpZiAodHlwZW9mIHJlY29yZC52YWx1ZSA9PT0gJ29iamVjdCcgJiYgcmVjb3JkLnZhbHVlICYmIGhhc09uRGVzdHJveShyZWNvcmQudmFsdWUpKSB7XG4gICAgICB0aGlzLm9uRGVzdHJveS5hZGQocmVjb3JkLnZhbHVlKTtcbiAgICB9XG4gICAgcmV0dXJuIHJlY29yZC52YWx1ZSBhcyBUO1xuICB9XG5cbiAgcHJpdmF0ZSBpbmplY3RhYmxlRGVmSW5TY29wZShkZWY6IEluamVjdGFibGVEZWY8YW55Pik6IGJvb2xlYW4ge1xuICAgIGlmICghZGVmLnByb3ZpZGVkSW4pIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBkZWYucHJvdmlkZWRJbiA9PT0gJ3N0cmluZycpIHtcbiAgICAgIHJldHVybiBkZWYucHJvdmlkZWRJbiA9PT0gJ2FueScgfHwgKGRlZi5wcm92aWRlZEluID09PSAncm9vdCcgJiYgdGhpcy5pc1Jvb3RJbmplY3Rvcik7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB0aGlzLmluamVjdG9yRGVmVHlwZXMuaGFzKGRlZi5wcm92aWRlZEluKTtcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gaW5qZWN0YWJsZURlZkZhY3RvcnkodG9rZW46IFR5cGU8YW55PnwgSW5qZWN0aW9uVG9rZW48YW55Pik6ICgpID0+IGFueSB7XG4gIGNvbnN0IGluamVjdGFibGVEZWYgPSBnZXRJbmplY3RhYmxlRGVmKHRva2VuIGFzIEluamVjdGFibGVUeXBlPGFueT4pO1xuICBpZiAoaW5qZWN0YWJsZURlZiA9PT0gbnVsbCkge1xuICAgIGlmICh0b2tlbiBpbnN0YW5jZW9mIEluamVjdGlvblRva2VuKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYFRva2VuICR7c3RyaW5naWZ5KHRva2VuKX0gaXMgbWlzc2luZyBhbiBuZ0luamVjdGFibGVEZWYgZGVmaW5pdGlvbi5gKTtcbiAgICB9XG4gICAgLy8gVE9ETyhhbHhodWIpOiB0aGVyZSBzaG91bGQgcHJvYmFibHkgYmUgYSBzdHJpY3QgbW9kZSB3aGljaCB0aHJvd3MgaGVyZSBpbnN0ZWFkIG9mIGFzc3VtaW5nIGFcbiAgICAvLyBuby1hcmdzIGNvbnN0cnVjdG9yLlxuICAgIHJldHVybiAoKSA9PiBuZXcgKHRva2VuIGFzIFR5cGU8YW55PikoKTtcbiAgfVxuICByZXR1cm4gaW5qZWN0YWJsZURlZi5mYWN0b3J5O1xufVxuXG5mdW5jdGlvbiBwcm92aWRlclRvUmVjb3JkKHByb3ZpZGVyOiBTaW5nbGVQcm92aWRlcik6IFJlY29yZDxhbnk+IHtcbiAgbGV0IGZhY3Rvcnk6ICgoKSA9PiBhbnkpfHVuZGVmaW5lZCA9IHByb3ZpZGVyVG9GYWN0b3J5KHByb3ZpZGVyKTtcbiAgaWYgKGlzVmFsdWVQcm92aWRlcihwcm92aWRlcikpIHtcbiAgICByZXR1cm4gbWFrZVJlY29yZCh1bmRlZmluZWQsIHByb3ZpZGVyLnVzZVZhbHVlKTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gbWFrZVJlY29yZChmYWN0b3J5LCBOT1RfWUVUKTtcbiAgfVxufVxuXG4vKipcbiAqIENvbnZlcnRzIGEgYFNpbmdsZVByb3ZpZGVyYCBpbnRvIGEgZmFjdG9yeSBmdW5jdGlvbi5cbiAqXG4gKiBAcGFyYW0gcHJvdmlkZXIgcHJvdmlkZXIgdG8gY29udmVydCB0byBmYWN0b3J5XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwcm92aWRlclRvRmFjdG9yeShwcm92aWRlcjogU2luZ2xlUHJvdmlkZXIpOiAoKSA9PiBhbnkge1xuICBsZXQgZmFjdG9yeTogKCgpID0+IGFueSl8dW5kZWZpbmVkID0gdW5kZWZpbmVkO1xuICBpZiAoaXNUeXBlUHJvdmlkZXIocHJvdmlkZXIpKSB7XG4gICAgcmV0dXJuIGluamVjdGFibGVEZWZGYWN0b3J5KHJlc29sdmVGb3J3YXJkUmVmKHByb3ZpZGVyKSk7XG4gIH0gZWxzZSB7XG4gICAgaWYgKGlzVmFsdWVQcm92aWRlcihwcm92aWRlcikpIHtcbiAgICAgIGZhY3RvcnkgPSAoKSA9PiByZXNvbHZlRm9yd2FyZFJlZihwcm92aWRlci51c2VWYWx1ZSk7XG4gICAgfSBlbHNlIGlmIChpc0V4aXN0aW5nUHJvdmlkZXIocHJvdmlkZXIpKSB7XG4gICAgICBmYWN0b3J5ID0gKCkgPT4gaW5qZWN0KHJlc29sdmVGb3J3YXJkUmVmKHByb3ZpZGVyLnVzZUV4aXN0aW5nKSk7XG4gICAgfSBlbHNlIGlmIChpc0ZhY3RvcnlQcm92aWRlcihwcm92aWRlcikpIHtcbiAgICAgIGZhY3RvcnkgPSAoKSA9PiBwcm92aWRlci51c2VGYWN0b3J5KC4uLmluamVjdEFyZ3MocHJvdmlkZXIuZGVwcyB8fCBbXSkpO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBjbGFzc1JlZiA9IHJlc29sdmVGb3J3YXJkUmVmKFxuICAgICAgICAgIChwcm92aWRlciBhcyBTdGF0aWNDbGFzc1Byb3ZpZGVyIHwgQ2xhc3NQcm92aWRlcikudXNlQ2xhc3MgfHwgcHJvdmlkZXIucHJvdmlkZSk7XG4gICAgICBpZiAoaGFzRGVwcyhwcm92aWRlcikpIHtcbiAgICAgICAgZmFjdG9yeSA9ICgpID0+IG5ldyAoY2xhc3NSZWYpKC4uLmluamVjdEFyZ3MocHJvdmlkZXIuZGVwcykpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGluamVjdGFibGVEZWZGYWN0b3J5KGNsYXNzUmVmKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIGZhY3Rvcnk7XG59XG5cbmZ1bmN0aW9uIG1ha2VSZWNvcmQ8VD4oXG4gICAgZmFjdG9yeTogKCgpID0+IFQpIHwgdW5kZWZpbmVkLCB2YWx1ZTogVCB8IHt9ID0gTk9UX1lFVCwgbXVsdGk6IGJvb2xlYW4gPSBmYWxzZSk6IFJlY29yZDxUPiB7XG4gIHJldHVybiB7XG4gICAgZmFjdG9yeTogZmFjdG9yeSxcbiAgICB2YWx1ZTogdmFsdWUsXG4gICAgbXVsdGk6IG11bHRpID8gW10gOiB1bmRlZmluZWQsXG4gIH07XG59XG5cbmZ1bmN0aW9uIGRlZXBGb3JFYWNoPFQ+KGlucHV0OiAoVCB8IGFueVtdKVtdLCBmbjogKHZhbHVlOiBUKSA9PiB2b2lkKTogdm9pZCB7XG4gIGlucHV0LmZvckVhY2godmFsdWUgPT4gQXJyYXkuaXNBcnJheSh2YWx1ZSkgPyBkZWVwRm9yRWFjaCh2YWx1ZSwgZm4pIDogZm4odmFsdWUpKTtcbn1cblxuZnVuY3Rpb24gaXNWYWx1ZVByb3ZpZGVyKHZhbHVlOiBTaW5nbGVQcm92aWRlcik6IHZhbHVlIGlzIFZhbHVlUHJvdmlkZXIge1xuICByZXR1cm4gVVNFX1ZBTFVFIGluIHZhbHVlO1xufVxuXG5mdW5jdGlvbiBpc0V4aXN0aW5nUHJvdmlkZXIodmFsdWU6IFNpbmdsZVByb3ZpZGVyKTogdmFsdWUgaXMgRXhpc3RpbmdQcm92aWRlciB7XG4gIHJldHVybiAhISh2YWx1ZSBhcyBFeGlzdGluZ1Byb3ZpZGVyKS51c2VFeGlzdGluZztcbn1cblxuZnVuY3Rpb24gaXNGYWN0b3J5UHJvdmlkZXIodmFsdWU6IFNpbmdsZVByb3ZpZGVyKTogdmFsdWUgaXMgRmFjdG9yeVByb3ZpZGVyIHtcbiAgcmV0dXJuICEhKHZhbHVlIGFzIEZhY3RvcnlQcm92aWRlcikudXNlRmFjdG9yeTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzVHlwZVByb3ZpZGVyKHZhbHVlOiBTaW5nbGVQcm92aWRlcik6IHZhbHVlIGlzIFR5cGVQcm92aWRlciB7XG4gIHJldHVybiB0eXBlb2YgdmFsdWUgPT09ICdmdW5jdGlvbic7XG59XG5cbmZ1bmN0aW9uIGhhc0RlcHModmFsdWU6IENsYXNzUHJvdmlkZXIgfCBDb25zdHJ1Y3RvclByb3ZpZGVyIHwgU3RhdGljQ2xhc3NQcm92aWRlcik6XG4gICAgdmFsdWUgaXMgQ2xhc3NQcm92aWRlciZ7ZGVwczogYW55W119IHtcbiAgcmV0dXJuICEhKHZhbHVlIGFzIGFueSkuZGVwcztcbn1cblxuZnVuY3Rpb24gaGFzT25EZXN0cm95KHZhbHVlOiBhbnkpOiB2YWx1ZSBpcyBPbkRlc3Ryb3kge1xuICByZXR1cm4gdHlwZW9mIHZhbHVlID09PSAnb2JqZWN0JyAmJiB2YWx1ZSAhPSBudWxsICYmICh2YWx1ZSBhcyBPbkRlc3Ryb3kpLm5nT25EZXN0cm95ICYmXG4gICAgICB0eXBlb2YodmFsdWUgYXMgT25EZXN0cm95KS5uZ09uRGVzdHJveSA9PT0gJ2Z1bmN0aW9uJztcbn1cblxuZnVuY3Rpb24gY291bGRCZUluamVjdGFibGVUeXBlKHZhbHVlOiBhbnkpOiB2YWx1ZSBpcyBUeXBlPGFueT58SW5qZWN0aW9uVG9rZW48YW55PiB7XG4gIHJldHVybiAodHlwZW9mIHZhbHVlID09PSAnZnVuY3Rpb24nKSB8fFxuICAgICAgKHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcgJiYgdmFsdWUgaW5zdGFuY2VvZiBJbmplY3Rpb25Ub2tlbik7XG59XG4iXX0=