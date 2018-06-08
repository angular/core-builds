/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { stringify } from '../util';
import { resolveForwardRef } from './forward_ref';
import { InjectionToken } from './injection_token';
import { INJECTOR, NullInjector, THROW_IF_NOT_FOUND, USE_VALUE, inject, injectArgs, setCurrentInjector } from './injector';
import { APP_ROOT } from './scope';
/**
 * Marker which indicates that a value has not yet been created from the factory function.
 */
const NOT_YET = {};
/**
 * Marker which indicates that the factory function for a token is in the process of being called.
 *
 * If the injector is asked to inject a token with its value set to CIRCULAR, that indicates
 * injection of a dependency has recursively attempted to inject the original token, and there is
 * a circular dependency among the providers.
 */
const CIRCULAR = {};
const EMPTY_ARRAY = [];
/**
 * A lazily initialized NullInjector.
 */
let NULL_INJECTOR = undefined;
function getNullInjector() {
    if (NULL_INJECTOR === undefined) {
        NULL_INJECTOR = new NullInjector();
    }
    return NULL_INJECTOR;
}
/**
 * Create a new `Injector` which is configured using a `defType` of `InjectorType<any>`s.
 *
 * @experimental
 */
export function createInjector(defType, parent = null, additionalProviders = null) {
    parent = parent || getNullInjector();
    return new R3Injector(defType, additionalProviders, parent);
}
export class R3Injector {
    constructor(def, additionalProviders, parent) {
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
        deepForEach([def], injectorDef => this.processInjectorType(injectorDef, new Set()));
        additionalProviders &&
            deepForEach(additionalProviders, provider => this.processProvider(provider));
        // Make sure the INJECTOR token provides this injector.
        this.records.set(INJECTOR, makeRecord(undefined, this));
        // Detect whether this injector has the APP_ROOT_SCOPE token and thus should provide
        // any injectable scoped to APP_ROOT_SCOPE.
        this.isRootInjector = this.records.has(APP_ROOT);
        // Eagerly instantiate the InjectorType classes themselves.
        this.injectorDefTypes.forEach(defType => this.get(defType));
    }
    /**
     * Destroy the injector and release references to every instance or provider associated with it.
     *
     * Also calls the `OnDestroy` lifecycle hooks of every instance that was created for which a
     * hook was found.
     */
    destroy() {
        this.assertNotDestroyed();
        // Set destroyed = true first, in case lifecycle hooks re-enter destroy().
        this.destroyed = true;
        try {
            // Call all the lifecycle hooks.
            this.onDestroy.forEach(service => service.ngOnDestroy());
        }
        finally {
            // Release all references.
            this.records.clear();
            this.onDestroy.clear();
            this.injectorDefTypes.clear();
        }
    }
    get(token, notFoundValue = THROW_IF_NOT_FOUND, flags = 0 /* Default */) {
        this.assertNotDestroyed();
        // Set the injection context.
        const previousInjector = setCurrentInjector(this);
        try {
            // Check for the SkipSelf flag.
            if (!(flags & 4 /* SkipSelf */)) {
                // SkipSelf isn't set, check if the record belongs to this injector.
                let record = this.records.get(token);
                if (record === undefined) {
                    // No record, but maybe the token is scoped to this injector. Look for an ngInjectableDef
                    // with a scope matching this injector.
                    const def = couldBeInjectableType(token) &&
                        token.ngInjectableDef ||
                        undefined;
                    if (def !== undefined && this.injectableDefInScope(def)) {
                        // Found an ngInjectableDef and it's scoped to this injector. Pretend as if it was here
                        // all along.
                        record = injectableDefRecord(token);
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
            let next = !(flags & 2 /* Self */) ? this.parent : getNullInjector();
            return this.parent.get(token, notFoundValue);
        }
        finally {
            // Lastly, clean up the state by restoring the previous injector.
            setCurrentInjector(previousInjector);
        }
    }
    assertNotDestroyed() {
        if (this.destroyed) {
            throw new Error('Injector has already been destroyed.');
        }
    }
    /**
     * Add an `InjectorType` or `InjectorDefTypeWithProviders` and all of its transitive providers
     * to this injector.
     */
    processInjectorType(defOrWrappedDef, parents) {
        defOrWrappedDef = resolveForwardRef(defOrWrappedDef);
        // Either the defOrWrappedDef is an InjectorType (with ngInjectorDef) or an
        // InjectorDefTypeWithProviders (aka ModuleWithProviders). Detecting either is a megamorphic
        // read, so care is taken to only do the read once.
        // First attempt to read the ngInjectorDef.
        let def = defOrWrappedDef.ngInjectorDef;
        // If that's not present, then attempt to read ngModule from the InjectorDefTypeWithProviders.
        const ngModule = (def == null) && defOrWrappedDef.ngModule || undefined;
        // Determine the InjectorType. In the case where `defOrWrappedDef` is an `InjectorType`,
        // then this is easy. In the case of an InjectorDefTypeWithProviders, then the definition type
        // is the `ngModule`.
        const defType = (ngModule === undefined) ? defOrWrappedDef : ngModule;
        // If defOrWrappedType was an InjectorDefTypeWithProviders, then .providers may hold some
        // extra providers.
        const providers = (ngModule !== undefined) && defOrWrappedDef.providers ||
            EMPTY_ARRAY;
        // Finally, if defOrWrappedType was an `InjectorDefTypeWithProviders`, then the actual
        // `InjectorDef` is on its `ngModule`.
        if (ngModule !== undefined) {
            def = ngModule.ngInjectorDef;
        }
        // If no definition was found, throw.
        if (def == null) {
            throw new Error(`Type ${stringify(defType)} is missing an ngInjectorDef definition.`);
        }
        // Check for circular dependencies.
        if (parents.has(defType)) {
            throw new Error(`Circular dependency: type ${stringify(defType)} ends up importing itself.`);
        }
        // Track the InjectorType and add a provider for it.
        this.injectorDefTypes.add(defType);
        this.records.set(defType, makeRecord(def.factory));
        // Add providers in the same way that @NgModule resolution did:
        // First, include providers from any imports.
        if (def.imports != null) {
            // Before processing defType's imports, add it to the set of parents. This way, if it ends
            // up deeply importing itself, this can be detected.
            parents.add(defType);
            try {
                deepForEach(def.imports, imported => this.processInjectorType(imported, parents));
            }
            finally {
                // Remove it from the parents set when finished.
                parents.delete(defType);
            }
        }
        // Next, include providers listed on the definition itself.
        if (def.providers != null) {
            deepForEach(def.providers, provider => this.processProvider(provider));
        }
        // Finally, include providers from an InjectorDefTypeWithProviders if there was one.
        deepForEach(providers, provider => this.processProvider(provider));
    }
    /**
     * Process a `SingleProvider` and add it.
     */
    processProvider(provider) {
        // Determine the token from the provider. Either it's its own token, or has a {provide: ...}
        // property.
        provider = resolveForwardRef(provider);
        let token = isTypeProvider(provider) ? provider : resolveForwardRef(provider.provide);
        // Construct a `Record` for the provider.
        const record = providerToRecord(provider);
        if (!isTypeProvider(provider) && provider.multi === true) {
            // If the provider indicates that it's a multi-provider, process it specially.
            // First check whether it's been defined already.
            let multiRecord = this.records.get(token);
            if (multiRecord) {
                // It has. Throw a nice error if
                if (multiRecord.multi === undefined) {
                    throw new Error(`Mixed multi-provider for ${token}.`);
                }
            }
            else {
                multiRecord = makeRecord(undefined, NOT_YET, true);
                multiRecord.factory = () => injectArgs(multiRecord.multi);
                this.records.set(token, multiRecord);
            }
            token = provider;
            multiRecord.multi.push(provider);
        }
        else {
            const existing = this.records.get(token);
            if (existing && existing.multi !== undefined) {
                throw new Error(`Mixed multi-provider for ${stringify(token)}`);
            }
        }
        this.records.set(token, record);
    }
    hydrate(token, record) {
        if (record.value === CIRCULAR) {
            throw new Error(`Circular dep for ${stringify(token)}`);
        }
        else if (record.value === NOT_YET) {
            record.value = CIRCULAR;
            record.value = record.factory();
        }
        if (typeof record.value === 'object' && record.value && hasOnDestroy(record.value)) {
            this.onDestroy.add(record.value);
        }
        return record.value;
    }
    injectableDefInScope(def) {
        if (!def.providedIn) {
            return false;
        }
        else if (typeof def.providedIn === 'string') {
            return def.providedIn === 'any' || (def.providedIn === 'root' && this.isRootInjector);
        }
        else {
            return this.injectorDefTypes.has(def.providedIn);
        }
    }
}
function injectableDefRecord(token) {
    const def = token.ngInjectableDef;
    if (def === undefined) {
        throw new Error(`Type ${stringify(token)} is missing an ngInjectableDef definition.`);
    }
    return makeRecord(def.factory);
}
function providerToRecord(provider) {
    let token = resolveForwardRef(provider);
    let value = NOT_YET;
    let factory = undefined;
    if (isTypeProvider(provider)) {
        return injectableDefRecord(provider);
    }
    else {
        token = resolveForwardRef(provider.provide);
        if (isValueProvider(provider)) {
            value = provider.useValue;
        }
        else if (isExistingProvider(provider)) {
            factory = () => inject(provider.useExisting);
        }
        else if (isFactoryProvider(provider)) {
            factory = () => provider.useFactory(...injectArgs(provider.deps || []));
        }
        else {
            const classRef = provider.useClass || token;
            if (hasDeps(provider)) {
                factory = () => new (classRef)(...injectArgs(provider.deps));
            }
            else {
                return injectableDefRecord(classRef);
            }
        }
    }
    return makeRecord(factory, value);
}
function makeRecord(factory, value = NOT_YET, multi = false) {
    return {
        factory: factory,
        value: value,
        multi: multi ? [] : undefined,
    };
}
function deepForEach(input, fn) {
    input.forEach(value => Array.isArray(value) ? deepForEach(value, fn) : fn(value));
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
function isClassProvider(value) {
    return !!value.useClass;
}
function isTypeProvider(value) {
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicjNfaW5qZWN0b3IuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9kaS9yM19pbmplY3Rvci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFJSCxPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sU0FBUyxDQUFDO0FBR2xDLE9BQU8sRUFBQyxpQkFBaUIsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUNoRCxPQUFPLEVBQXFCLGNBQWMsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQ3JFLE9BQU8sRUFBQyxRQUFRLEVBQXlCLFlBQVksRUFBRSxrQkFBa0IsRUFBRSxTQUFTLEVBQUUsTUFBTSxFQUFFLFVBQVUsRUFBRSxrQkFBa0IsRUFBQyxNQUFNLFlBQVksQ0FBQztBQUVoSixPQUFPLEVBQUMsUUFBUSxFQUFDLE1BQU0sU0FBUyxDQUFDO0FBVWpDOztHQUVHO0FBQ0gsTUFBTSxPQUFPLEdBQUcsRUFBRSxDQUFDO0FBRW5COzs7Ozs7R0FNRztBQUNILE1BQU0sUUFBUSxHQUFHLEVBQUUsQ0FBQztBQUVwQixNQUFNLFdBQVcsR0FBRyxFQUFXLENBQUM7QUFFaEM7O0dBRUc7QUFDSCxJQUFJLGFBQWEsR0FBdUIsU0FBUyxDQUFDO0FBRWxEO0lBQ0UsSUFBSSxhQUFhLEtBQUssU0FBUyxFQUFFO1FBQy9CLGFBQWEsR0FBRyxJQUFJLFlBQVksRUFBRSxDQUFDO0tBQ3BDO0lBQ0QsT0FBTyxhQUFhLENBQUM7QUFDdkIsQ0FBQztBQVlEOzs7O0dBSUc7QUFDSCxNQUFNLHlCQUNGLE9BQW9DLEVBQUUsU0FBMEIsSUFBSSxFQUNwRSxzQkFBK0MsSUFBSTtJQUNyRCxNQUFNLEdBQUcsTUFBTSxJQUFJLGVBQWUsRUFBRSxDQUFDO0lBQ3JDLE9BQU8sSUFBSSxVQUFVLENBQUMsT0FBTyxFQUFFLG1CQUFtQixFQUFFLE1BQU0sQ0FBQyxDQUFDO0FBQzlELENBQUM7QUFFRCxNQUFNO0lBMkJKLFlBQ0ksR0FBc0IsRUFBRSxtQkFBMEMsRUFDekQsTUFBZ0I7UUFBaEIsV0FBTSxHQUFOLE1BQU0sQ0FBVTtRQTVCN0I7O1dBRUc7UUFDSyxZQUFPLEdBQUcsSUFBSSxHQUFHLEVBQThDLENBQUM7UUFFeEU7O1dBRUc7UUFDSyxxQkFBZ0IsR0FBRyxJQUFJLEdBQUcsRUFBcUIsQ0FBQztRQUV4RDs7V0FFRztRQUNLLGNBQVMsR0FBRyxJQUFJLEdBQUcsRUFBYSxDQUFDO1FBUXpDOztXQUVHO1FBQ0ssY0FBUyxHQUFHLEtBQUssQ0FBQztRQUt4QixrRkFBa0Y7UUFDbEYsa0NBQWtDO1FBQ2xDLFdBQVcsQ0FDUCxDQUFDLEdBQUcsQ0FBQyxFQUFFLFdBQVcsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLG1CQUFtQixDQUFDLFdBQVcsRUFBRSxJQUFJLEdBQUcsRUFBcUIsQ0FBQyxDQUFDLENBQUM7UUFFL0YsbUJBQW1CO1lBQ2YsV0FBVyxDQUFDLG1CQUFtQixFQUFFLFFBQVEsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO1FBR2pGLHVEQUF1RDtRQUN2RCxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsVUFBVSxDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO1FBRXhELG9GQUFvRjtRQUNwRiwyQ0FBMkM7UUFDM0MsSUFBSSxDQUFDLGNBQWMsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUVqRCwyREFBMkQ7UUFDM0QsSUFBSSxDQUFDLGdCQUFnQixDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztJQUM5RCxDQUFDO0lBRUQ7Ozs7O09BS0c7SUFDSCxPQUFPO1FBQ0wsSUFBSSxDQUFDLGtCQUFrQixFQUFFLENBQUM7UUFFMUIsMEVBQTBFO1FBQzFFLElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDO1FBQ3RCLElBQUk7WUFDRixnQ0FBZ0M7WUFDaEMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQztTQUMxRDtnQkFBUztZQUNSLDBCQUEwQjtZQUMxQixJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxDQUFDO1lBQ3JCLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxFQUFFLENBQUM7WUFDdkIsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEtBQUssRUFBRSxDQUFDO1NBQy9CO0lBQ0gsQ0FBQztJQUVELEdBQUcsQ0FDQyxLQUFnQyxFQUFFLGdCQUFxQixrQkFBa0IsRUFDekUsS0FBSyxrQkFBc0I7UUFDN0IsSUFBSSxDQUFDLGtCQUFrQixFQUFFLENBQUM7UUFDMUIsNkJBQTZCO1FBQzdCLE1BQU0sZ0JBQWdCLEdBQUcsa0JBQWtCLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDbEQsSUFBSTtZQUNGLCtCQUErQjtZQUMvQixJQUFJLENBQUMsQ0FBQyxLQUFLLG1CQUF1QixDQUFDLEVBQUU7Z0JBQ25DLG9FQUFvRTtnQkFDcEUsSUFBSSxNQUFNLEdBQXdCLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUMxRCxJQUFJLE1BQU0sS0FBSyxTQUFTLEVBQUU7b0JBQ3hCLHlGQUF5RjtvQkFDekYsdUNBQXVDO29CQUN2QyxNQUFNLEdBQUcsR0FBRyxxQkFBcUIsQ0FBQyxLQUFLLENBQUM7d0JBQy9CLEtBQXNELENBQUMsZUFBZTt3QkFDM0UsU0FBUyxDQUFDO29CQUNkLElBQUksR0FBRyxLQUFLLFNBQVMsSUFBSSxJQUFJLENBQUMsb0JBQW9CLENBQUMsR0FBRyxDQUFDLEVBQUU7d0JBQ3ZELHVGQUF1Rjt3QkFDdkYsYUFBYTt3QkFDYixNQUFNLEdBQUcsbUJBQW1CLENBQUMsS0FBSyxDQUFDLENBQUM7d0JBQ3BDLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssRUFBRSxNQUFNLENBQUMsQ0FBQztxQkFDakM7aUJBQ0Y7Z0JBQ0QsZ0VBQWdFO2dCQUNoRSxJQUFJLE1BQU0sS0FBSyxTQUFTLEVBQUU7b0JBQ3hCLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLENBQUM7aUJBQ3BDO2FBQ0Y7WUFFRCx5RkFBeUY7WUFDekYsK0NBQStDO1lBQy9DLElBQUksSUFBSSxHQUFHLENBQUMsQ0FBQyxLQUFLLGVBQW1CLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUM7WUFDekUsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUUsYUFBYSxDQUFDLENBQUM7U0FDOUM7Z0JBQVM7WUFDUixpRUFBaUU7WUFDakUsa0JBQWtCLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztTQUN0QztJQUNILENBQUM7SUFFTyxrQkFBa0I7UUFDeEIsSUFBSSxJQUFJLENBQUMsU0FBUyxFQUFFO1lBQ2xCLE1BQU0sSUFBSSxLQUFLLENBQUMsc0NBQXNDLENBQUMsQ0FBQztTQUN6RDtJQUNILENBQUM7SUFFRDs7O09BR0c7SUFDSyxtQkFBbUIsQ0FDdkIsZUFBaUUsRUFDakUsT0FBK0I7UUFDakMsZUFBZSxHQUFHLGlCQUFpQixDQUFDLGVBQWUsQ0FBQyxDQUFDO1FBRXJELDJFQUEyRTtRQUMzRSw0RkFBNEY7UUFDNUYsbURBQW1EO1FBRW5ELDJDQUEyQztRQUMzQyxJQUFJLEdBQUcsR0FBSSxlQUFxQyxDQUFDLGFBQTZDLENBQUM7UUFFL0YsOEZBQThGO1FBQzlGLE1BQU0sUUFBUSxHQUNWLENBQUMsR0FBRyxJQUFJLElBQUksQ0FBQyxJQUFLLGVBQWtELENBQUMsUUFBUSxJQUFJLFNBQVMsQ0FBQztRQUUvRix3RkFBd0Y7UUFDeEYsOEZBQThGO1FBQzlGLHFCQUFxQjtRQUNyQixNQUFNLE9BQU8sR0FDVCxDQUFDLFFBQVEsS0FBSyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUUsZUFBcUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDO1FBRWpGLHlGQUF5RjtRQUN6RixtQkFBbUI7UUFDbkIsTUFBTSxTQUFTLEdBQ1gsQ0FBQyxRQUFRLEtBQUssU0FBUyxDQUFDLElBQUssZUFBa0QsQ0FBQyxTQUFTO1lBQ3pGLFdBQVcsQ0FBQztRQUVoQixzRkFBc0Y7UUFDdEYsc0NBQXNDO1FBQ3RDLElBQUksUUFBUSxLQUFLLFNBQVMsRUFBRTtZQUMxQixHQUFHLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQztTQUM5QjtRQUVELHFDQUFxQztRQUNyQyxJQUFJLEdBQUcsSUFBSSxJQUFJLEVBQUU7WUFDZixNQUFNLElBQUksS0FBSyxDQUFDLFFBQVEsU0FBUyxDQUFDLE9BQU8sQ0FBQywwQ0FBMEMsQ0FBQyxDQUFDO1NBQ3ZGO1FBRUQsbUNBQW1DO1FBQ25DLElBQUksT0FBTyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsRUFBRTtZQUN4QixNQUFNLElBQUksS0FBSyxDQUFDLDZCQUE2QixTQUFTLENBQUMsT0FBTyxDQUFDLDRCQUE0QixDQUFDLENBQUM7U0FDOUY7UUFFRCxvREFBb0Q7UUFDcEQsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUNuQyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxPQUFPLEVBQUUsVUFBVSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO1FBRW5ELCtEQUErRDtRQUUvRCw2Q0FBNkM7UUFDN0MsSUFBSSxHQUFHLENBQUMsT0FBTyxJQUFJLElBQUksRUFBRTtZQUN2QiwwRkFBMEY7WUFDMUYsb0RBQW9EO1lBQ3BELE9BQU8sQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDckIsSUFBSTtnQkFDRixXQUFXLENBQUMsR0FBRyxDQUFDLE9BQU8sRUFBRSxRQUFRLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxRQUFRLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQzthQUNuRjtvQkFBUztnQkFDUixnREFBZ0Q7Z0JBQ2hELE9BQU8sQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUM7YUFDekI7U0FDRjtRQUVELDJEQUEyRDtRQUMzRCxJQUFJLEdBQUcsQ0FBQyxTQUFTLElBQUksSUFBSSxFQUFFO1lBQ3pCLFdBQVcsQ0FBQyxHQUFHLENBQUMsU0FBUyxFQUFFLFFBQVEsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO1NBQ3hFO1FBRUQsb0ZBQW9GO1FBQ3BGLFdBQVcsQ0FBQyxTQUFTLEVBQUUsUUFBUSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7SUFDckUsQ0FBQztJQUVEOztPQUVHO0lBQ0ssZUFBZSxDQUFDLFFBQXdCO1FBQzlDLDRGQUE0RjtRQUM1RixZQUFZO1FBQ1osUUFBUSxHQUFHLGlCQUFpQixDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ3ZDLElBQUksS0FBSyxHQUFRLGNBQWMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxpQkFBaUIsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLENBQUM7UUFFM0YseUNBQXlDO1FBQ3pDLE1BQU0sTUFBTSxHQUFHLGdCQUFnQixDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBRTFDLElBQUksQ0FBQyxjQUFjLENBQUMsUUFBUSxDQUFDLElBQUksUUFBUSxDQUFDLEtBQUssS0FBSyxJQUFJLEVBQUU7WUFDeEQsOEVBQThFO1lBQzlFLGlEQUFpRDtZQUNqRCxJQUFJLFdBQVcsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUMxQyxJQUFJLFdBQVcsRUFBRTtnQkFDZixnQ0FBZ0M7Z0JBQ2hDLElBQUksV0FBVyxDQUFDLEtBQUssS0FBSyxTQUFTLEVBQUU7b0JBQ25DLE1BQU0sSUFBSSxLQUFLLENBQUMsNEJBQTRCLEtBQUssR0FBRyxDQUFDLENBQUM7aUJBQ3ZEO2FBQ0Y7aUJBQU07Z0JBQ0wsV0FBVyxHQUFHLFVBQVUsQ0FBQyxTQUFTLEVBQUUsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUNuRCxXQUFXLENBQUMsT0FBTyxHQUFHLEdBQUcsRUFBRSxDQUFDLFVBQVUsQ0FBQyxXQUFhLENBQUMsS0FBTyxDQUFDLENBQUM7Z0JBQzlELElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssRUFBRSxXQUFXLENBQUMsQ0FBQzthQUN0QztZQUNELEtBQUssR0FBRyxRQUFRLENBQUM7WUFDakIsV0FBVyxDQUFDLEtBQU8sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7U0FDcEM7YUFBTTtZQUNMLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ3pDLElBQUksUUFBUSxJQUFJLFFBQVEsQ0FBQyxLQUFLLEtBQUssU0FBUyxFQUFFO2dCQUM1QyxNQUFNLElBQUksS0FBSyxDQUFDLDRCQUE0QixTQUFTLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFDO2FBQ2pFO1NBQ0Y7UUFDRCxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLENBQUM7SUFDbEMsQ0FBQztJQUVPLE9BQU8sQ0FBSSxLQUFnQyxFQUFFLE1BQWlCO1FBQ3BFLElBQUksTUFBTSxDQUFDLEtBQUssS0FBSyxRQUFRLEVBQUU7WUFDN0IsTUFBTSxJQUFJLEtBQUssQ0FBQyxvQkFBb0IsU0FBUyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQztTQUN6RDthQUFNLElBQUksTUFBTSxDQUFDLEtBQUssS0FBSyxPQUFPLEVBQUU7WUFDbkMsTUFBTSxDQUFDLEtBQUssR0FBRyxRQUFRLENBQUM7WUFDeEIsTUFBTSxDQUFDLEtBQUssR0FBRyxNQUFNLENBQUMsT0FBUyxFQUFFLENBQUM7U0FDbkM7UUFDRCxJQUFJLE9BQU8sTUFBTSxDQUFDLEtBQUssS0FBSyxRQUFRLElBQUksTUFBTSxDQUFDLEtBQUssSUFBSSxZQUFZLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxFQUFFO1lBQ2xGLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQztTQUNsQztRQUNELE9BQU8sTUFBTSxDQUFDLEtBQVUsQ0FBQztJQUMzQixDQUFDO0lBRU8sb0JBQW9CLENBQUMsR0FBdUI7UUFDbEQsSUFBSSxDQUFDLEdBQUcsQ0FBQyxVQUFVLEVBQUU7WUFDbkIsT0FBTyxLQUFLLENBQUM7U0FDZDthQUFNLElBQUksT0FBTyxHQUFHLENBQUMsVUFBVSxLQUFLLFFBQVEsRUFBRTtZQUM3QyxPQUFPLEdBQUcsQ0FBQyxVQUFVLEtBQUssS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLFVBQVUsS0FBSyxNQUFNLElBQUksSUFBSSxDQUFDLGNBQWMsQ0FBQyxDQUFDO1NBQ3ZGO2FBQU07WUFDTCxPQUFPLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxDQUFDO1NBQ2xEO0lBQ0gsQ0FBQztDQUNGO0FBRUQsNkJBQTZCLEtBQXFDO0lBQ2hFLE1BQU0sR0FBRyxHQUFJLEtBQTZCLENBQUMsZUFBcUMsQ0FBQztJQUNqRixJQUFJLEdBQUcsS0FBSyxTQUFTLEVBQUU7UUFDckIsTUFBTSxJQUFJLEtBQUssQ0FBQyxRQUFRLFNBQVMsQ0FBQyxLQUFLLENBQUMsNENBQTRDLENBQUMsQ0FBQztLQUN2RjtJQUNELE9BQU8sVUFBVSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQztBQUNqQyxDQUFDO0FBRUQsMEJBQTBCLFFBQXdCO0lBQ2hELElBQUksS0FBSyxHQUFHLGlCQUFpQixDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQ3hDLElBQUksS0FBSyxHQUFRLE9BQU8sQ0FBQztJQUN6QixJQUFJLE9BQU8sR0FBMEIsU0FBUyxDQUFDO0lBQy9DLElBQUksY0FBYyxDQUFDLFFBQVEsQ0FBQyxFQUFFO1FBQzVCLE9BQU8sbUJBQW1CLENBQUMsUUFBUSxDQUFDLENBQUM7S0FDdEM7U0FBTTtRQUNMLEtBQUssR0FBRyxpQkFBaUIsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDNUMsSUFBSSxlQUFlLENBQUMsUUFBUSxDQUFDLEVBQUU7WUFDN0IsS0FBSyxHQUFHLFFBQVEsQ0FBQyxRQUFRLENBQUM7U0FDM0I7YUFBTSxJQUFJLGtCQUFrQixDQUFDLFFBQVEsQ0FBQyxFQUFFO1lBQ3ZDLE9BQU8sR0FBRyxHQUFHLEVBQUUsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1NBQzlDO2FBQU0sSUFBSSxpQkFBaUIsQ0FBQyxRQUFRLENBQUMsRUFBRTtZQUN0QyxPQUFPLEdBQUcsR0FBRyxFQUFFLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxRQUFRLENBQUMsSUFBSSxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUM7U0FDekU7YUFBTTtZQUNMLE1BQU0sUUFBUSxHQUFJLFFBQWdELENBQUMsUUFBUSxJQUFJLEtBQUssQ0FBQztZQUNyRixJQUFJLE9BQU8sQ0FBQyxRQUFRLENBQUMsRUFBRTtnQkFDckIsT0FBTyxHQUFHLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQzthQUM5RDtpQkFBTTtnQkFDTCxPQUFPLG1CQUFtQixDQUFDLFFBQVEsQ0FBQyxDQUFDO2FBQ3RDO1NBQ0Y7S0FDRjtJQUNELE9BQU8sVUFBVSxDQUFDLE9BQU8sRUFBRSxLQUFLLENBQUMsQ0FBQztBQUNwQyxDQUFDO0FBRUQsb0JBQ0ksT0FBOEIsRUFBRSxRQUFnQixPQUFPLEVBQUUsUUFBaUIsS0FBSztJQUNqRixPQUFPO1FBQ0wsT0FBTyxFQUFFLE9BQU87UUFDaEIsS0FBSyxFQUFFLEtBQUs7UUFDWixLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLFNBQVM7S0FDOUIsQ0FBQztBQUNKLENBQUM7QUFFRCxxQkFBd0IsS0FBb0IsRUFBRSxFQUFzQjtJQUNsRSxLQUFLLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7QUFDcEYsQ0FBQztBQUVELHlCQUF5QixLQUFxQjtJQUM1QyxPQUFPLFNBQVMsSUFBSSxLQUFLLENBQUM7QUFDNUIsQ0FBQztBQUVELDRCQUE0QixLQUFxQjtJQUMvQyxPQUFPLENBQUMsQ0FBRSxLQUEwQixDQUFDLFdBQVcsQ0FBQztBQUNuRCxDQUFDO0FBRUQsMkJBQTJCLEtBQXFCO0lBQzlDLE9BQU8sQ0FBQyxDQUFFLEtBQXlCLENBQUMsVUFBVSxDQUFDO0FBQ2pELENBQUM7QUFFRCx5QkFBeUIsS0FBcUI7SUFDNUMsT0FBTyxDQUFDLENBQUUsS0FBdUIsQ0FBQyxRQUFRLENBQUM7QUFDN0MsQ0FBQztBQUVELHdCQUF3QixLQUFxQjtJQUMzQyxPQUFPLE9BQU8sS0FBSyxLQUFLLFVBQVUsQ0FBQztBQUNyQyxDQUFDO0FBRUQsaUJBQWlCLEtBQWdFO0lBRS9FLE9BQU8sQ0FBQyxDQUFFLEtBQWEsQ0FBQyxJQUFJLENBQUM7QUFDL0IsQ0FBQztBQUVELHNCQUFzQixLQUFVO0lBQzlCLE9BQU8sT0FBTyxLQUFLLEtBQUssUUFBUSxJQUFJLEtBQUssSUFBSSxJQUFJLElBQUssS0FBbUIsQ0FBQyxXQUFXO1FBQ2pGLE9BQU8sS0FBbUIsQ0FBQyxXQUFXLEtBQUssVUFBVSxDQUFDO0FBQzVELENBQUM7QUFFRCwrQkFBK0IsS0FBVTtJQUN2QyxPQUFPLENBQUMsT0FBTyxLQUFLLEtBQUssVUFBVSxDQUFDO1FBQ2hDLENBQUMsT0FBTyxLQUFLLEtBQUssUUFBUSxJQUFJLEtBQUssWUFBWSxjQUFjLENBQUMsQ0FBQztBQUNyRSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge09uRGVzdHJveX0gZnJvbSAnLi4vbWV0YWRhdGEvbGlmZWN5Y2xlX2hvb2tzJztcbmltcG9ydCB7VHlwZX0gZnJvbSAnLi4vdHlwZSc7XG5pbXBvcnQge3N0cmluZ2lmeX0gZnJvbSAnLi4vdXRpbCc7XG5cbmltcG9ydCB7SW5qZWN0YWJsZURlZiwgSW5qZWN0YWJsZVR5cGUsIEluamVjdG9yRGVmLCBJbmplY3RvclR5cGUsIEluamVjdG9yVHlwZVdpdGhQcm92aWRlcnN9IGZyb20gJy4vZGVmcyc7XG5pbXBvcnQge3Jlc29sdmVGb3J3YXJkUmVmfSBmcm9tICcuL2ZvcndhcmRfcmVmJztcbmltcG9ydCB7SW5qZWN0YWJsZURlZlRva2VuLCBJbmplY3Rpb25Ub2tlbn0gZnJvbSAnLi9pbmplY3Rpb25fdG9rZW4nO1xuaW1wb3J0IHtJTkpFQ1RPUiwgSW5qZWN0RmxhZ3MsIEluamVjdG9yLCBOdWxsSW5qZWN0b3IsIFRIUk9XX0lGX05PVF9GT1VORCwgVVNFX1ZBTFVFLCBpbmplY3QsIGluamVjdEFyZ3MsIHNldEN1cnJlbnRJbmplY3Rvcn0gZnJvbSAnLi9pbmplY3Rvcic7XG5pbXBvcnQge0NsYXNzUHJvdmlkZXIsIENvbnN0cnVjdG9yUHJvdmlkZXIsIEV4aXN0aW5nUHJvdmlkZXIsIEZhY3RvcnlQcm92aWRlciwgUHJvdmlkZXIsIFN0YXRpY0NsYXNzUHJvdmlkZXIsIFN0YXRpY1Byb3ZpZGVyLCBUeXBlUHJvdmlkZXIsIFZhbHVlUHJvdmlkZXJ9IGZyb20gJy4vcHJvdmlkZXInO1xuaW1wb3J0IHtBUFBfUk9PVH0gZnJvbSAnLi9zY29wZSc7XG5cblxuXG4vKipcbiAqIEludGVybmFsIHR5cGUgZm9yIGEgc2luZ2xlIHByb3ZpZGVyIGluIGEgZGVlcCBwcm92aWRlciBhcnJheS5cbiAqL1xudHlwZSBTaW5nbGVQcm92aWRlciA9IFR5cGVQcm92aWRlciB8IFZhbHVlUHJvdmlkZXIgfCBDbGFzc1Byb3ZpZGVyIHwgQ29uc3RydWN0b3JQcm92aWRlciB8XG4gICAgRXhpc3RpbmdQcm92aWRlciB8IEZhY3RvcnlQcm92aWRlciB8IFN0YXRpY0NsYXNzUHJvdmlkZXI7XG5cbi8qKlxuICogTWFya2VyIHdoaWNoIGluZGljYXRlcyB0aGF0IGEgdmFsdWUgaGFzIG5vdCB5ZXQgYmVlbiBjcmVhdGVkIGZyb20gdGhlIGZhY3RvcnkgZnVuY3Rpb24uXG4gKi9cbmNvbnN0IE5PVF9ZRVQgPSB7fTtcblxuLyoqXG4gKiBNYXJrZXIgd2hpY2ggaW5kaWNhdGVzIHRoYXQgdGhlIGZhY3RvcnkgZnVuY3Rpb24gZm9yIGEgdG9rZW4gaXMgaW4gdGhlIHByb2Nlc3Mgb2YgYmVpbmcgY2FsbGVkLlxuICpcbiAqIElmIHRoZSBpbmplY3RvciBpcyBhc2tlZCB0byBpbmplY3QgYSB0b2tlbiB3aXRoIGl0cyB2YWx1ZSBzZXQgdG8gQ0lSQ1VMQVIsIHRoYXQgaW5kaWNhdGVzXG4gKiBpbmplY3Rpb24gb2YgYSBkZXBlbmRlbmN5IGhhcyByZWN1cnNpdmVseSBhdHRlbXB0ZWQgdG8gaW5qZWN0IHRoZSBvcmlnaW5hbCB0b2tlbiwgYW5kIHRoZXJlIGlzXG4gKiBhIGNpcmN1bGFyIGRlcGVuZGVuY3kgYW1vbmcgdGhlIHByb3ZpZGVycy5cbiAqL1xuY29uc3QgQ0lSQ1VMQVIgPSB7fTtcblxuY29uc3QgRU1QVFlfQVJSQVkgPSBbXSBhcyBhbnlbXTtcblxuLyoqXG4gKiBBIGxhemlseSBpbml0aWFsaXplZCBOdWxsSW5qZWN0b3IuXG4gKi9cbmxldCBOVUxMX0lOSkVDVE9SOiBJbmplY3Rvcnx1bmRlZmluZWQgPSB1bmRlZmluZWQ7XG5cbmZ1bmN0aW9uIGdldE51bGxJbmplY3RvcigpOiBJbmplY3RvciB7XG4gIGlmIChOVUxMX0lOSkVDVE9SID09PSB1bmRlZmluZWQpIHtcbiAgICBOVUxMX0lOSkVDVE9SID0gbmV3IE51bGxJbmplY3RvcigpO1xuICB9XG4gIHJldHVybiBOVUxMX0lOSkVDVE9SO1xufVxuXG4vKipcbiAqIEFuIGVudHJ5IGluIHRoZSBpbmplY3RvciB3aGljaCB0cmFja3MgaW5mb3JtYXRpb24gYWJvdXQgdGhlIGdpdmVuIHRva2VuLCBpbmNsdWRpbmcgYSBwb3NzaWJsZVxuICogY3VycmVudCB2YWx1ZS5cbiAqL1xuaW50ZXJmYWNlIFJlY29yZDxUPiB7XG4gIGZhY3Rvcnk6ICgoKSA9PiBUKXx1bmRlZmluZWQ7XG4gIHZhbHVlOiBUfHt9O1xuICBtdWx0aTogYW55W118dW5kZWZpbmVkO1xufVxuXG4vKipcbiAqIENyZWF0ZSBhIG5ldyBgSW5qZWN0b3JgIHdoaWNoIGlzIGNvbmZpZ3VyZWQgdXNpbmcgYSBgZGVmVHlwZWAgb2YgYEluamVjdG9yVHlwZTxhbnk+YHMuXG4gKlxuICogQGV4cGVyaW1lbnRhbFxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlSW5qZWN0b3IoXG4gICAgZGVmVHlwZTogLyogSW5qZWN0b3JUeXBlPGFueT4gKi8gYW55LCBwYXJlbnQ6IEluamVjdG9yIHwgbnVsbCA9IG51bGwsXG4gICAgYWRkaXRpb25hbFByb3ZpZGVyczogU3RhdGljUHJvdmlkZXJbXSB8IG51bGwgPSBudWxsKTogSW5qZWN0b3Ige1xuICBwYXJlbnQgPSBwYXJlbnQgfHwgZ2V0TnVsbEluamVjdG9yKCk7XG4gIHJldHVybiBuZXcgUjNJbmplY3RvcihkZWZUeXBlLCBhZGRpdGlvbmFsUHJvdmlkZXJzLCBwYXJlbnQpO1xufVxuXG5leHBvcnQgY2xhc3MgUjNJbmplY3RvciB7XG4gIC8qKlxuICAgKiBNYXAgb2YgdG9rZW5zIHRvIHJlY29yZHMgd2hpY2ggY29udGFpbiB0aGUgaW5zdGFuY2VzIG9mIHRob3NlIHRva2Vucy5cbiAgICovXG4gIHByaXZhdGUgcmVjb3JkcyA9IG5ldyBNYXA8VHlwZTxhbnk+fEluamVjdGlvblRva2VuPGFueT4sIFJlY29yZDxhbnk+PigpO1xuXG4gIC8qKlxuICAgKiBUaGUgdHJhbnNpdGl2ZSBzZXQgb2YgYEluamVjdG9yVHlwZWBzIHdoaWNoIGRlZmluZSB0aGlzIGluamVjdG9yLlxuICAgKi9cbiAgcHJpdmF0ZSBpbmplY3RvckRlZlR5cGVzID0gbmV3IFNldDxJbmplY3RvclR5cGU8YW55Pj4oKTtcblxuICAvKipcbiAgICogU2V0IG9mIHZhbHVlcyBpbnN0YW50aWF0ZWQgYnkgdGhpcyBpbmplY3RvciB3aGljaCBjb250YWluIGBuZ09uRGVzdHJveWAgbGlmZWN5Y2xlIGhvb2tzLlxuICAgKi9cbiAgcHJpdmF0ZSBvbkRlc3Ryb3kgPSBuZXcgU2V0PE9uRGVzdHJveT4oKTtcblxuICAvKipcbiAgICogRmxhZyBpbmRpY2F0aW5nIHRoaXMgaW5qZWN0b3IgcHJvdmlkZXMgdGhlIEFQUF9ST09UX1NDT1BFIHRva2VuLCBhbmQgdGh1cyBjb3VudHMgYXMgdGhlXG4gICAqIHJvb3Qgc2NvcGUuXG4gICAqL1xuICBwcml2YXRlIHJlYWRvbmx5IGlzUm9vdEluamVjdG9yOiBib29sZWFuO1xuXG4gIC8qKlxuICAgKiBGbGFnIGluZGljYXRpbmcgdGhhdCB0aGlzIGluamVjdG9yIHdhcyBwcmV2aW91c2x5IGRlc3Ryb3llZC5cbiAgICovXG4gIHByaXZhdGUgZGVzdHJveWVkID0gZmFsc2U7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgICBkZWY6IEluamVjdG9yVHlwZTxhbnk+LCBhZGRpdGlvbmFsUHJvdmlkZXJzOiBTdGF0aWNQcm92aWRlcltdfG51bGwsXG4gICAgICByZWFkb25seSBwYXJlbnQ6IEluamVjdG9yKSB7XG4gICAgLy8gU3RhcnQgb2ZmIGJ5IGNyZWF0aW5nIFJlY29yZHMgZm9yIGV2ZXJ5IHByb3ZpZGVyIGRlY2xhcmVkIGluIGV2ZXJ5IEluamVjdG9yVHlwZVxuICAgIC8vIGluY2x1ZGVkIHRyYW5zaXRpdmVseSBpbiBgZGVmYC5cbiAgICBkZWVwRm9yRWFjaChcbiAgICAgICAgW2RlZl0sIGluamVjdG9yRGVmID0+IHRoaXMucHJvY2Vzc0luamVjdG9yVHlwZShpbmplY3RvckRlZiwgbmV3IFNldDxJbmplY3RvclR5cGU8YW55Pj4oKSkpO1xuXG4gICAgYWRkaXRpb25hbFByb3ZpZGVycyAmJlxuICAgICAgICBkZWVwRm9yRWFjaChhZGRpdGlvbmFsUHJvdmlkZXJzLCBwcm92aWRlciA9PiB0aGlzLnByb2Nlc3NQcm92aWRlcihwcm92aWRlcikpO1xuXG5cbiAgICAvLyBNYWtlIHN1cmUgdGhlIElOSkVDVE9SIHRva2VuIHByb3ZpZGVzIHRoaXMgaW5qZWN0b3IuXG4gICAgdGhpcy5yZWNvcmRzLnNldChJTkpFQ1RPUiwgbWFrZVJlY29yZCh1bmRlZmluZWQsIHRoaXMpKTtcblxuICAgIC8vIERldGVjdCB3aGV0aGVyIHRoaXMgaW5qZWN0b3IgaGFzIHRoZSBBUFBfUk9PVF9TQ09QRSB0b2tlbiBhbmQgdGh1cyBzaG91bGQgcHJvdmlkZVxuICAgIC8vIGFueSBpbmplY3RhYmxlIHNjb3BlZCB0byBBUFBfUk9PVF9TQ09QRS5cbiAgICB0aGlzLmlzUm9vdEluamVjdG9yID0gdGhpcy5yZWNvcmRzLmhhcyhBUFBfUk9PVCk7XG5cbiAgICAvLyBFYWdlcmx5IGluc3RhbnRpYXRlIHRoZSBJbmplY3RvclR5cGUgY2xhc3NlcyB0aGVtc2VsdmVzLlxuICAgIHRoaXMuaW5qZWN0b3JEZWZUeXBlcy5mb3JFYWNoKGRlZlR5cGUgPT4gdGhpcy5nZXQoZGVmVHlwZSkpO1xuICB9XG5cbiAgLyoqXG4gICAqIERlc3Ryb3kgdGhlIGluamVjdG9yIGFuZCByZWxlYXNlIHJlZmVyZW5jZXMgdG8gZXZlcnkgaW5zdGFuY2Ugb3IgcHJvdmlkZXIgYXNzb2NpYXRlZCB3aXRoIGl0LlxuICAgKlxuICAgKiBBbHNvIGNhbGxzIHRoZSBgT25EZXN0cm95YCBsaWZlY3ljbGUgaG9va3Mgb2YgZXZlcnkgaW5zdGFuY2UgdGhhdCB3YXMgY3JlYXRlZCBmb3Igd2hpY2ggYVxuICAgKiBob29rIHdhcyBmb3VuZC5cbiAgICovXG4gIGRlc3Ryb3koKTogdm9pZCB7XG4gICAgdGhpcy5hc3NlcnROb3REZXN0cm95ZWQoKTtcblxuICAgIC8vIFNldCBkZXN0cm95ZWQgPSB0cnVlIGZpcnN0LCBpbiBjYXNlIGxpZmVjeWNsZSBob29rcyByZS1lbnRlciBkZXN0cm95KCkuXG4gICAgdGhpcy5kZXN0cm95ZWQgPSB0cnVlO1xuICAgIHRyeSB7XG4gICAgICAvLyBDYWxsIGFsbCB0aGUgbGlmZWN5Y2xlIGhvb2tzLlxuICAgICAgdGhpcy5vbkRlc3Ryb3kuZm9yRWFjaChzZXJ2aWNlID0+IHNlcnZpY2UubmdPbkRlc3Ryb3koKSk7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIC8vIFJlbGVhc2UgYWxsIHJlZmVyZW5jZXMuXG4gICAgICB0aGlzLnJlY29yZHMuY2xlYXIoKTtcbiAgICAgIHRoaXMub25EZXN0cm95LmNsZWFyKCk7XG4gICAgICB0aGlzLmluamVjdG9yRGVmVHlwZXMuY2xlYXIoKTtcbiAgICB9XG4gIH1cblxuICBnZXQ8VD4oXG4gICAgICB0b2tlbjogVHlwZTxUPnxJbmplY3Rpb25Ub2tlbjxUPiwgbm90Rm91bmRWYWx1ZTogYW55ID0gVEhST1dfSUZfTk9UX0ZPVU5ELFxuICAgICAgZmxhZ3MgPSBJbmplY3RGbGFncy5EZWZhdWx0KTogVCB7XG4gICAgdGhpcy5hc3NlcnROb3REZXN0cm95ZWQoKTtcbiAgICAvLyBTZXQgdGhlIGluamVjdGlvbiBjb250ZXh0LlxuICAgIGNvbnN0IHByZXZpb3VzSW5qZWN0b3IgPSBzZXRDdXJyZW50SW5qZWN0b3IodGhpcyk7XG4gICAgdHJ5IHtcbiAgICAgIC8vIENoZWNrIGZvciB0aGUgU2tpcFNlbGYgZmxhZy5cbiAgICAgIGlmICghKGZsYWdzICYgSW5qZWN0RmxhZ3MuU2tpcFNlbGYpKSB7XG4gICAgICAgIC8vIFNraXBTZWxmIGlzbid0IHNldCwgY2hlY2sgaWYgdGhlIHJlY29yZCBiZWxvbmdzIHRvIHRoaXMgaW5qZWN0b3IuXG4gICAgICAgIGxldCByZWNvcmQ6IFJlY29yZDxUPnx1bmRlZmluZWQgPSB0aGlzLnJlY29yZHMuZ2V0KHRva2VuKTtcbiAgICAgICAgaWYgKHJlY29yZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgLy8gTm8gcmVjb3JkLCBidXQgbWF5YmUgdGhlIHRva2VuIGlzIHNjb3BlZCB0byB0aGlzIGluamVjdG9yLiBMb29rIGZvciBhbiBuZ0luamVjdGFibGVEZWZcbiAgICAgICAgICAvLyB3aXRoIGEgc2NvcGUgbWF0Y2hpbmcgdGhpcyBpbmplY3Rvci5cbiAgICAgICAgICBjb25zdCBkZWYgPSBjb3VsZEJlSW5qZWN0YWJsZVR5cGUodG9rZW4pICYmXG4gICAgICAgICAgICAgICAgICAodG9rZW4gYXMgSW5qZWN0YWJsZVR5cGU8YW55PnwgSW5qZWN0YWJsZURlZlRva2VuPGFueT4pLm5nSW5qZWN0YWJsZURlZiB8fFxuICAgICAgICAgICAgICB1bmRlZmluZWQ7XG4gICAgICAgICAgaWYgKGRlZiAhPT0gdW5kZWZpbmVkICYmIHRoaXMuaW5qZWN0YWJsZURlZkluU2NvcGUoZGVmKSkge1xuICAgICAgICAgICAgLy8gRm91bmQgYW4gbmdJbmplY3RhYmxlRGVmIGFuZCBpdCdzIHNjb3BlZCB0byB0aGlzIGluamVjdG9yLiBQcmV0ZW5kIGFzIGlmIGl0IHdhcyBoZXJlXG4gICAgICAgICAgICAvLyBhbGwgYWxvbmcuXG4gICAgICAgICAgICByZWNvcmQgPSBpbmplY3RhYmxlRGVmUmVjb3JkKHRva2VuKTtcbiAgICAgICAgICAgIHRoaXMucmVjb3Jkcy5zZXQodG9rZW4sIHJlY29yZCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8vIElmIGEgcmVjb3JkIHdhcyBmb3VuZCwgZ2V0IHRoZSBpbnN0YW5jZSBmb3IgaXQgYW5kIHJldHVybiBpdC5cbiAgICAgICAgaWYgKHJlY29yZCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMuaHlkcmF0ZSh0b2tlbiwgcmVjb3JkKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBTZWxlY3QgdGhlIG5leHQgaW5qZWN0b3IgYmFzZWQgb24gdGhlIFNlbGYgZmxhZyAtIGlmIHNlbGYgaXMgc2V0LCB0aGUgbmV4dCBpbmplY3RvciBpc1xuICAgICAgLy8gdGhlIE51bGxJbmplY3Rvciwgb3RoZXJ3aXNlIGl0J3MgdGhlIHBhcmVudC5cbiAgICAgIGxldCBuZXh0ID0gIShmbGFncyAmIEluamVjdEZsYWdzLlNlbGYpID8gdGhpcy5wYXJlbnQgOiBnZXROdWxsSW5qZWN0b3IoKTtcbiAgICAgIHJldHVybiB0aGlzLnBhcmVudC5nZXQodG9rZW4sIG5vdEZvdW5kVmFsdWUpO1xuICAgIH0gZmluYWxseSB7XG4gICAgICAvLyBMYXN0bHksIGNsZWFuIHVwIHRoZSBzdGF0ZSBieSByZXN0b3JpbmcgdGhlIHByZXZpb3VzIGluamVjdG9yLlxuICAgICAgc2V0Q3VycmVudEluamVjdG9yKHByZXZpb3VzSW5qZWN0b3IpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgYXNzZXJ0Tm90RGVzdHJveWVkKCk6IHZvaWQge1xuICAgIGlmICh0aGlzLmRlc3Ryb3llZCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbmplY3RvciBoYXMgYWxyZWFkeSBiZWVuIGRlc3Ryb3llZC4nKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQWRkIGFuIGBJbmplY3RvclR5cGVgIG9yIGBJbmplY3RvckRlZlR5cGVXaXRoUHJvdmlkZXJzYCBhbmQgYWxsIG9mIGl0cyB0cmFuc2l0aXZlIHByb3ZpZGVyc1xuICAgKiB0byB0aGlzIGluamVjdG9yLlxuICAgKi9cbiAgcHJpdmF0ZSBwcm9jZXNzSW5qZWN0b3JUeXBlKFxuICAgICAgZGVmT3JXcmFwcGVkRGVmOiBJbmplY3RvclR5cGU8YW55PnxJbmplY3RvclR5cGVXaXRoUHJvdmlkZXJzPGFueT4sXG4gICAgICBwYXJlbnRzOiBTZXQ8SW5qZWN0b3JUeXBlPGFueT4+KSB7XG4gICAgZGVmT3JXcmFwcGVkRGVmID0gcmVzb2x2ZUZvcndhcmRSZWYoZGVmT3JXcmFwcGVkRGVmKTtcblxuICAgIC8vIEVpdGhlciB0aGUgZGVmT3JXcmFwcGVkRGVmIGlzIGFuIEluamVjdG9yVHlwZSAod2l0aCBuZ0luamVjdG9yRGVmKSBvciBhblxuICAgIC8vIEluamVjdG9yRGVmVHlwZVdpdGhQcm92aWRlcnMgKGFrYSBNb2R1bGVXaXRoUHJvdmlkZXJzKS4gRGV0ZWN0aW5nIGVpdGhlciBpcyBhIG1lZ2Ftb3JwaGljXG4gICAgLy8gcmVhZCwgc28gY2FyZSBpcyB0YWtlbiB0byBvbmx5IGRvIHRoZSByZWFkIG9uY2UuXG5cbiAgICAvLyBGaXJzdCBhdHRlbXB0IHRvIHJlYWQgdGhlIG5nSW5qZWN0b3JEZWYuXG4gICAgbGV0IGRlZiA9IChkZWZPcldyYXBwZWREZWYgYXMgSW5qZWN0b3JUeXBlPGFueT4pLm5nSW5qZWN0b3JEZWYgYXMoSW5qZWN0b3JEZWY8YW55PnwgdW5kZWZpbmVkKTtcblxuICAgIC8vIElmIHRoYXQncyBub3QgcHJlc2VudCwgdGhlbiBhdHRlbXB0IHRvIHJlYWQgbmdNb2R1bGUgZnJvbSB0aGUgSW5qZWN0b3JEZWZUeXBlV2l0aFByb3ZpZGVycy5cbiAgICBjb25zdCBuZ01vZHVsZSA9XG4gICAgICAgIChkZWYgPT0gbnVsbCkgJiYgKGRlZk9yV3JhcHBlZERlZiBhcyBJbmplY3RvclR5cGVXaXRoUHJvdmlkZXJzPGFueT4pLm5nTW9kdWxlIHx8IHVuZGVmaW5lZDtcblxuICAgIC8vIERldGVybWluZSB0aGUgSW5qZWN0b3JUeXBlLiBJbiB0aGUgY2FzZSB3aGVyZSBgZGVmT3JXcmFwcGVkRGVmYCBpcyBhbiBgSW5qZWN0b3JUeXBlYCxcbiAgICAvLyB0aGVuIHRoaXMgaXMgZWFzeS4gSW4gdGhlIGNhc2Ugb2YgYW4gSW5qZWN0b3JEZWZUeXBlV2l0aFByb3ZpZGVycywgdGhlbiB0aGUgZGVmaW5pdGlvbiB0eXBlXG4gICAgLy8gaXMgdGhlIGBuZ01vZHVsZWAuXG4gICAgY29uc3QgZGVmVHlwZTogSW5qZWN0b3JUeXBlPGFueT4gPVxuICAgICAgICAobmdNb2R1bGUgPT09IHVuZGVmaW5lZCkgPyAoZGVmT3JXcmFwcGVkRGVmIGFzIEluamVjdG9yVHlwZTxhbnk+KSA6IG5nTW9kdWxlO1xuXG4gICAgLy8gSWYgZGVmT3JXcmFwcGVkVHlwZSB3YXMgYW4gSW5qZWN0b3JEZWZUeXBlV2l0aFByb3ZpZGVycywgdGhlbiAucHJvdmlkZXJzIG1heSBob2xkIHNvbWVcbiAgICAvLyBleHRyYSBwcm92aWRlcnMuXG4gICAgY29uc3QgcHJvdmlkZXJzID1cbiAgICAgICAgKG5nTW9kdWxlICE9PSB1bmRlZmluZWQpICYmIChkZWZPcldyYXBwZWREZWYgYXMgSW5qZWN0b3JUeXBlV2l0aFByb3ZpZGVyczxhbnk+KS5wcm92aWRlcnMgfHxcbiAgICAgICAgRU1QVFlfQVJSQVk7XG5cbiAgICAvLyBGaW5hbGx5LCBpZiBkZWZPcldyYXBwZWRUeXBlIHdhcyBhbiBgSW5qZWN0b3JEZWZUeXBlV2l0aFByb3ZpZGVyc2AsIHRoZW4gdGhlIGFjdHVhbFxuICAgIC8vIGBJbmplY3RvckRlZmAgaXMgb24gaXRzIGBuZ01vZHVsZWAuXG4gICAgaWYgKG5nTW9kdWxlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGRlZiA9IG5nTW9kdWxlLm5nSW5qZWN0b3JEZWY7XG4gICAgfVxuXG4gICAgLy8gSWYgbm8gZGVmaW5pdGlvbiB3YXMgZm91bmQsIHRocm93LlxuICAgIGlmIChkZWYgPT0gbnVsbCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBUeXBlICR7c3RyaW5naWZ5KGRlZlR5cGUpfSBpcyBtaXNzaW5nIGFuIG5nSW5qZWN0b3JEZWYgZGVmaW5pdGlvbi5gKTtcbiAgICB9XG5cbiAgICAvLyBDaGVjayBmb3IgY2lyY3VsYXIgZGVwZW5kZW5jaWVzLlxuICAgIGlmIChwYXJlbnRzLmhhcyhkZWZUeXBlKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBDaXJjdWxhciBkZXBlbmRlbmN5OiB0eXBlICR7c3RyaW5naWZ5KGRlZlR5cGUpfSBlbmRzIHVwIGltcG9ydGluZyBpdHNlbGYuYCk7XG4gICAgfVxuXG4gICAgLy8gVHJhY2sgdGhlIEluamVjdG9yVHlwZSBhbmQgYWRkIGEgcHJvdmlkZXIgZm9yIGl0LlxuICAgIHRoaXMuaW5qZWN0b3JEZWZUeXBlcy5hZGQoZGVmVHlwZSk7XG4gICAgdGhpcy5yZWNvcmRzLnNldChkZWZUeXBlLCBtYWtlUmVjb3JkKGRlZi5mYWN0b3J5KSk7XG5cbiAgICAvLyBBZGQgcHJvdmlkZXJzIGluIHRoZSBzYW1lIHdheSB0aGF0IEBOZ01vZHVsZSByZXNvbHV0aW9uIGRpZDpcblxuICAgIC8vIEZpcnN0LCBpbmNsdWRlIHByb3ZpZGVycyBmcm9tIGFueSBpbXBvcnRzLlxuICAgIGlmIChkZWYuaW1wb3J0cyAhPSBudWxsKSB7XG4gICAgICAvLyBCZWZvcmUgcHJvY2Vzc2luZyBkZWZUeXBlJ3MgaW1wb3J0cywgYWRkIGl0IHRvIHRoZSBzZXQgb2YgcGFyZW50cy4gVGhpcyB3YXksIGlmIGl0IGVuZHNcbiAgICAgIC8vIHVwIGRlZXBseSBpbXBvcnRpbmcgaXRzZWxmLCB0aGlzIGNhbiBiZSBkZXRlY3RlZC5cbiAgICAgIHBhcmVudHMuYWRkKGRlZlR5cGUpO1xuICAgICAgdHJ5IHtcbiAgICAgICAgZGVlcEZvckVhY2goZGVmLmltcG9ydHMsIGltcG9ydGVkID0+IHRoaXMucHJvY2Vzc0luamVjdG9yVHlwZShpbXBvcnRlZCwgcGFyZW50cykpO1xuICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgLy8gUmVtb3ZlIGl0IGZyb20gdGhlIHBhcmVudHMgc2V0IHdoZW4gZmluaXNoZWQuXG4gICAgICAgIHBhcmVudHMuZGVsZXRlKGRlZlR5cGUpO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIE5leHQsIGluY2x1ZGUgcHJvdmlkZXJzIGxpc3RlZCBvbiB0aGUgZGVmaW5pdGlvbiBpdHNlbGYuXG4gICAgaWYgKGRlZi5wcm92aWRlcnMgIT0gbnVsbCkge1xuICAgICAgZGVlcEZvckVhY2goZGVmLnByb3ZpZGVycywgcHJvdmlkZXIgPT4gdGhpcy5wcm9jZXNzUHJvdmlkZXIocHJvdmlkZXIpKTtcbiAgICB9XG5cbiAgICAvLyBGaW5hbGx5LCBpbmNsdWRlIHByb3ZpZGVycyBmcm9tIGFuIEluamVjdG9yRGVmVHlwZVdpdGhQcm92aWRlcnMgaWYgdGhlcmUgd2FzIG9uZS5cbiAgICBkZWVwRm9yRWFjaChwcm92aWRlcnMsIHByb3ZpZGVyID0+IHRoaXMucHJvY2Vzc1Byb3ZpZGVyKHByb3ZpZGVyKSk7XG4gIH1cblxuICAvKipcbiAgICogUHJvY2VzcyBhIGBTaW5nbGVQcm92aWRlcmAgYW5kIGFkZCBpdC5cbiAgICovXG4gIHByaXZhdGUgcHJvY2Vzc1Byb3ZpZGVyKHByb3ZpZGVyOiBTaW5nbGVQcm92aWRlcik6IHZvaWQge1xuICAgIC8vIERldGVybWluZSB0aGUgdG9rZW4gZnJvbSB0aGUgcHJvdmlkZXIuIEVpdGhlciBpdCdzIGl0cyBvd24gdG9rZW4sIG9yIGhhcyBhIHtwcm92aWRlOiAuLi59XG4gICAgLy8gcHJvcGVydHkuXG4gICAgcHJvdmlkZXIgPSByZXNvbHZlRm9yd2FyZFJlZihwcm92aWRlcik7XG4gICAgbGV0IHRva2VuOiBhbnkgPSBpc1R5cGVQcm92aWRlcihwcm92aWRlcikgPyBwcm92aWRlciA6IHJlc29sdmVGb3J3YXJkUmVmKHByb3ZpZGVyLnByb3ZpZGUpO1xuXG4gICAgLy8gQ29uc3RydWN0IGEgYFJlY29yZGAgZm9yIHRoZSBwcm92aWRlci5cbiAgICBjb25zdCByZWNvcmQgPSBwcm92aWRlclRvUmVjb3JkKHByb3ZpZGVyKTtcblxuICAgIGlmICghaXNUeXBlUHJvdmlkZXIocHJvdmlkZXIpICYmIHByb3ZpZGVyLm11bHRpID09PSB0cnVlKSB7XG4gICAgICAvLyBJZiB0aGUgcHJvdmlkZXIgaW5kaWNhdGVzIHRoYXQgaXQncyBhIG11bHRpLXByb3ZpZGVyLCBwcm9jZXNzIGl0IHNwZWNpYWxseS5cbiAgICAgIC8vIEZpcnN0IGNoZWNrIHdoZXRoZXIgaXQncyBiZWVuIGRlZmluZWQgYWxyZWFkeS5cbiAgICAgIGxldCBtdWx0aVJlY29yZCA9IHRoaXMucmVjb3Jkcy5nZXQodG9rZW4pO1xuICAgICAgaWYgKG11bHRpUmVjb3JkKSB7XG4gICAgICAgIC8vIEl0IGhhcy4gVGhyb3cgYSBuaWNlIGVycm9yIGlmXG4gICAgICAgIGlmIChtdWx0aVJlY29yZC5tdWx0aSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBNaXhlZCBtdWx0aS1wcm92aWRlciBmb3IgJHt0b2tlbn0uYCk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG11bHRpUmVjb3JkID0gbWFrZVJlY29yZCh1bmRlZmluZWQsIE5PVF9ZRVQsIHRydWUpO1xuICAgICAgICBtdWx0aVJlY29yZC5mYWN0b3J5ID0gKCkgPT4gaW5qZWN0QXJncyhtdWx0aVJlY29yZCAhLm11bHRpICEpO1xuICAgICAgICB0aGlzLnJlY29yZHMuc2V0KHRva2VuLCBtdWx0aVJlY29yZCk7XG4gICAgICB9XG4gICAgICB0b2tlbiA9IHByb3ZpZGVyO1xuICAgICAgbXVsdGlSZWNvcmQubXVsdGkgIS5wdXNoKHByb3ZpZGVyKTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgZXhpc3RpbmcgPSB0aGlzLnJlY29yZHMuZ2V0KHRva2VuKTtcbiAgICAgIGlmIChleGlzdGluZyAmJiBleGlzdGluZy5tdWx0aSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgTWl4ZWQgbXVsdGktcHJvdmlkZXIgZm9yICR7c3RyaW5naWZ5KHRva2VuKX1gKTtcbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5yZWNvcmRzLnNldCh0b2tlbiwgcmVjb3JkKTtcbiAgfVxuXG4gIHByaXZhdGUgaHlkcmF0ZTxUPih0b2tlbjogVHlwZTxUPnxJbmplY3Rpb25Ub2tlbjxUPiwgcmVjb3JkOiBSZWNvcmQ8VD4pOiBUIHtcbiAgICBpZiAocmVjb3JkLnZhbHVlID09PSBDSVJDVUxBUikge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBDaXJjdWxhciBkZXAgZm9yICR7c3RyaW5naWZ5KHRva2VuKX1gKTtcbiAgICB9IGVsc2UgaWYgKHJlY29yZC52YWx1ZSA9PT0gTk9UX1lFVCkge1xuICAgICAgcmVjb3JkLnZhbHVlID0gQ0lSQ1VMQVI7XG4gICAgICByZWNvcmQudmFsdWUgPSByZWNvcmQuZmFjdG9yeSAhKCk7XG4gICAgfVxuICAgIGlmICh0eXBlb2YgcmVjb3JkLnZhbHVlID09PSAnb2JqZWN0JyAmJiByZWNvcmQudmFsdWUgJiYgaGFzT25EZXN0cm95KHJlY29yZC52YWx1ZSkpIHtcbiAgICAgIHRoaXMub25EZXN0cm95LmFkZChyZWNvcmQudmFsdWUpO1xuICAgIH1cbiAgICByZXR1cm4gcmVjb3JkLnZhbHVlIGFzIFQ7XG4gIH1cblxuICBwcml2YXRlIGluamVjdGFibGVEZWZJblNjb3BlKGRlZjogSW5qZWN0YWJsZURlZjxhbnk+KTogYm9vbGVhbiB7XG4gICAgaWYgKCFkZWYucHJvdmlkZWRJbikge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIGRlZi5wcm92aWRlZEluID09PSAnc3RyaW5nJykge1xuICAgICAgcmV0dXJuIGRlZi5wcm92aWRlZEluID09PSAnYW55JyB8fCAoZGVmLnByb3ZpZGVkSW4gPT09ICdyb290JyAmJiB0aGlzLmlzUm9vdEluamVjdG9yKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHRoaXMuaW5qZWN0b3JEZWZUeXBlcy5oYXMoZGVmLnByb3ZpZGVkSW4pO1xuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBpbmplY3RhYmxlRGVmUmVjb3JkKHRva2VuOiBUeXBlPGFueT58IEluamVjdGlvblRva2VuPGFueT4pOiBSZWNvcmQ8YW55PiB7XG4gIGNvbnN0IGRlZiA9ICh0b2tlbiBhcyBJbmplY3RhYmxlVHlwZTxhbnk+KS5uZ0luamVjdGFibGVEZWYgYXMgSW5qZWN0YWJsZURlZjxhbnk+O1xuICBpZiAoZGVmID09PSB1bmRlZmluZWQpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYFR5cGUgJHtzdHJpbmdpZnkodG9rZW4pfSBpcyBtaXNzaW5nIGFuIG5nSW5qZWN0YWJsZURlZiBkZWZpbml0aW9uLmApO1xuICB9XG4gIHJldHVybiBtYWtlUmVjb3JkKGRlZi5mYWN0b3J5KTtcbn1cblxuZnVuY3Rpb24gcHJvdmlkZXJUb1JlY29yZChwcm92aWRlcjogU2luZ2xlUHJvdmlkZXIpOiBSZWNvcmQ8YW55PiB7XG4gIGxldCB0b2tlbiA9IHJlc29sdmVGb3J3YXJkUmVmKHByb3ZpZGVyKTtcbiAgbGV0IHZhbHVlOiBhbnkgPSBOT1RfWUVUO1xuICBsZXQgZmFjdG9yeTogKCgpID0+IGFueSl8dW5kZWZpbmVkID0gdW5kZWZpbmVkO1xuICBpZiAoaXNUeXBlUHJvdmlkZXIocHJvdmlkZXIpKSB7XG4gICAgcmV0dXJuIGluamVjdGFibGVEZWZSZWNvcmQocHJvdmlkZXIpO1xuICB9IGVsc2Uge1xuICAgIHRva2VuID0gcmVzb2x2ZUZvcndhcmRSZWYocHJvdmlkZXIucHJvdmlkZSk7XG4gICAgaWYgKGlzVmFsdWVQcm92aWRlcihwcm92aWRlcikpIHtcbiAgICAgIHZhbHVlID0gcHJvdmlkZXIudXNlVmFsdWU7XG4gICAgfSBlbHNlIGlmIChpc0V4aXN0aW5nUHJvdmlkZXIocHJvdmlkZXIpKSB7XG4gICAgICBmYWN0b3J5ID0gKCkgPT4gaW5qZWN0KHByb3ZpZGVyLnVzZUV4aXN0aW5nKTtcbiAgICB9IGVsc2UgaWYgKGlzRmFjdG9yeVByb3ZpZGVyKHByb3ZpZGVyKSkge1xuICAgICAgZmFjdG9yeSA9ICgpID0+IHByb3ZpZGVyLnVzZUZhY3RvcnkoLi4uaW5qZWN0QXJncyhwcm92aWRlci5kZXBzIHx8IFtdKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IGNsYXNzUmVmID0gKHByb3ZpZGVyIGFzIFN0YXRpY0NsYXNzUHJvdmlkZXIgfCBDbGFzc1Byb3ZpZGVyKS51c2VDbGFzcyB8fCB0b2tlbjtcbiAgICAgIGlmIChoYXNEZXBzKHByb3ZpZGVyKSkge1xuICAgICAgICBmYWN0b3J5ID0gKCkgPT4gbmV3IChjbGFzc1JlZikoLi4uaW5qZWN0QXJncyhwcm92aWRlci5kZXBzKSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gaW5qZWN0YWJsZURlZlJlY29yZChjbGFzc1JlZik7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiBtYWtlUmVjb3JkKGZhY3RvcnksIHZhbHVlKTtcbn1cblxuZnVuY3Rpb24gbWFrZVJlY29yZDxUPihcbiAgICBmYWN0b3J5OiAoKCkgPT4gVCkgfCB1bmRlZmluZWQsIHZhbHVlOiBUIHwge30gPSBOT1RfWUVULCBtdWx0aTogYm9vbGVhbiA9IGZhbHNlKTogUmVjb3JkPFQ+IHtcbiAgcmV0dXJuIHtcbiAgICBmYWN0b3J5OiBmYWN0b3J5LFxuICAgIHZhbHVlOiB2YWx1ZSxcbiAgICBtdWx0aTogbXVsdGkgPyBbXSA6IHVuZGVmaW5lZCxcbiAgfTtcbn1cblxuZnVuY3Rpb24gZGVlcEZvckVhY2g8VD4oaW5wdXQ6IChUIHwgYW55W10pW10sIGZuOiAodmFsdWU6IFQpID0+IHZvaWQpOiB2b2lkIHtcbiAgaW5wdXQuZm9yRWFjaCh2YWx1ZSA9PiBBcnJheS5pc0FycmF5KHZhbHVlKSA/IGRlZXBGb3JFYWNoKHZhbHVlLCBmbikgOiBmbih2YWx1ZSkpO1xufVxuXG5mdW5jdGlvbiBpc1ZhbHVlUHJvdmlkZXIodmFsdWU6IFNpbmdsZVByb3ZpZGVyKTogdmFsdWUgaXMgVmFsdWVQcm92aWRlciB7XG4gIHJldHVybiBVU0VfVkFMVUUgaW4gdmFsdWU7XG59XG5cbmZ1bmN0aW9uIGlzRXhpc3RpbmdQcm92aWRlcih2YWx1ZTogU2luZ2xlUHJvdmlkZXIpOiB2YWx1ZSBpcyBFeGlzdGluZ1Byb3ZpZGVyIHtcbiAgcmV0dXJuICEhKHZhbHVlIGFzIEV4aXN0aW5nUHJvdmlkZXIpLnVzZUV4aXN0aW5nO1xufVxuXG5mdW5jdGlvbiBpc0ZhY3RvcnlQcm92aWRlcih2YWx1ZTogU2luZ2xlUHJvdmlkZXIpOiB2YWx1ZSBpcyBGYWN0b3J5UHJvdmlkZXIge1xuICByZXR1cm4gISEodmFsdWUgYXMgRmFjdG9yeVByb3ZpZGVyKS51c2VGYWN0b3J5O1xufVxuXG5mdW5jdGlvbiBpc0NsYXNzUHJvdmlkZXIodmFsdWU6IFNpbmdsZVByb3ZpZGVyKTogdmFsdWUgaXMgQ2xhc3NQcm92aWRlciB7XG4gIHJldHVybiAhISh2YWx1ZSBhcyBDbGFzc1Byb3ZpZGVyKS51c2VDbGFzcztcbn1cblxuZnVuY3Rpb24gaXNUeXBlUHJvdmlkZXIodmFsdWU6IFNpbmdsZVByb3ZpZGVyKTogdmFsdWUgaXMgVHlwZVByb3ZpZGVyIHtcbiAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PT0gJ2Z1bmN0aW9uJztcbn1cblxuZnVuY3Rpb24gaGFzRGVwcyh2YWx1ZTogQ2xhc3NQcm92aWRlciB8IENvbnN0cnVjdG9yUHJvdmlkZXIgfCBTdGF0aWNDbGFzc1Byb3ZpZGVyKTpcbiAgICB2YWx1ZSBpcyBDbGFzc1Byb3ZpZGVyJntkZXBzOiBhbnlbXX0ge1xuICByZXR1cm4gISEodmFsdWUgYXMgYW55KS5kZXBzO1xufVxuXG5mdW5jdGlvbiBoYXNPbkRlc3Ryb3kodmFsdWU6IGFueSk6IHZhbHVlIGlzIE9uRGVzdHJveSB7XG4gIHJldHVybiB0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnICYmIHZhbHVlICE9IG51bGwgJiYgKHZhbHVlIGFzIE9uRGVzdHJveSkubmdPbkRlc3Ryb3kgJiZcbiAgICAgIHR5cGVvZih2YWx1ZSBhcyBPbkRlc3Ryb3kpLm5nT25EZXN0cm95ID09PSAnZnVuY3Rpb24nO1xufVxuXG5mdW5jdGlvbiBjb3VsZEJlSW5qZWN0YWJsZVR5cGUodmFsdWU6IGFueSk6IHZhbHVlIGlzIFR5cGU8YW55PnxJbmplY3Rpb25Ub2tlbjxhbnk+IHtcbiAgcmV0dXJuICh0eXBlb2YgdmFsdWUgPT09ICdmdW5jdGlvbicpIHx8XG4gICAgICAodHlwZW9mIHZhbHVlID09PSAnb2JqZWN0JyAmJiB2YWx1ZSBpbnN0YW5jZW9mIEluamVjdGlvblRva2VuKTtcbn1cbiJdfQ==