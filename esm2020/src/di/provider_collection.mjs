/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { RuntimeError } from '../errors';
import { getComponentDef } from '../render3/definition';
import { getFactoryDef } from '../render3/definition_factory';
import { throwCyclicDependencyError, throwInvalidProviderError } from '../render3/errors_di';
import { stringifyForError } from '../render3/util/stringify_utils';
import { deepForEach } from '../util/array_utils';
import { getClosureSafeProperty } from '../util/property';
import { stringify } from '../util/stringify';
import { EMPTY_ARRAY } from '../view';
import { resolveForwardRef } from './forward_ref';
import { ENVIRONMENT_INITIALIZER } from './initializer_token';
import { ɵɵinject as inject } from './injector_compatibility';
import { getInjectorDef } from './interface/defs';
import { INJECTOR_DEF_TYPES } from './internal_tokens';
/**
 * Collects providers from all NgModules and standalone components, including transitively imported
 * ones.
 *
 * Providers extracted via `importProvidersFrom` are only usable in an application injector or
 * another environment injector (such as a route injector). They should not be used in component
 * providers.
 *
 * @returns The collected providers from the specified list of types.
 * @publicApi
 */
export function importProvidersFrom(...sources) {
    return { ɵproviders: internalImportProvidersFrom(true, sources) };
}
export function internalImportProvidersFrom(checkForStandaloneCmp, ...sources) {
    const providersOut = [];
    const dedup = new Set(); // already seen types
    let injectorTypesWithProviders;
    deepForEach(sources, source => {
        if ((typeof ngDevMode === 'undefined' || ngDevMode) && checkForStandaloneCmp) {
            const cmpDef = getComponentDef(source);
            if (cmpDef?.standalone) {
                throw new RuntimeError(800 /* RuntimeErrorCode.IMPORT_PROVIDERS_FROM_STANDALONE */, `Importing providers supports NgModule or ModuleWithProviders but got a standalone component "${stringifyForError(source)}"`);
            }
        }
        // Narrow `source` to access the internal type analogue for `ModuleWithProviders`.
        const internalSource = source;
        if (walkProviderTree(internalSource, providersOut, [], dedup)) {
            injectorTypesWithProviders || (injectorTypesWithProviders = []);
            injectorTypesWithProviders.push(internalSource);
        }
    });
    // Collect all providers from `ModuleWithProviders` types.
    if (injectorTypesWithProviders !== undefined) {
        processInjectorTypesWithProviders(injectorTypesWithProviders, providersOut);
    }
    return providersOut;
}
/**
 * Collects all providers from the list of `ModuleWithProviders` and appends them to the provided
 * array.
 */
function processInjectorTypesWithProviders(typesWithProviders, providersOut) {
    for (let i = 0; i < typesWithProviders.length; i++) {
        const { ngModule, providers } = typesWithProviders[i];
        deepForEach(providers, provider => {
            ngDevMode && validateProvider(provider, providers || EMPTY_ARRAY, ngModule);
            providersOut.push(provider);
        });
    }
}
/**
 * The logic visits an `InjectorType`, an `InjectorTypeWithProviders`, or a standalone
 * `ComponentType`, and all of its transitive providers and collects providers.
 *
 * If an `InjectorTypeWithProviders` that declares providers besides the type is specified,
 * the function will return "true" to indicate that the providers of the type definition need
 * to be processed. This allows us to process providers of injector types after all imports of
 * an injector definition are processed. (following View Engine semantics: see FW-1349)
 */
export function walkProviderTree(container, providersOut, parents, dedup) {
    container = resolveForwardRef(container);
    if (!container)
        return false;
    // The actual type which had the definition. Usually `container`, but may be an unwrapped type
    // from `InjectorTypeWithProviders`.
    let defType = null;
    let injDef = getInjectorDef(container);
    const cmpDef = !injDef && getComponentDef(container);
    if (!injDef && !cmpDef) {
        // `container` is not an injector type or a component type. It might be:
        //  * An `InjectorTypeWithProviders` that wraps an injector type.
        //  * A standalone directive or pipe that got pulled in from a standalone component's
        //    dependencies.
        // Try to unwrap it as an `InjectorTypeWithProviders` first.
        const ngModule = container.ngModule;
        injDef = getInjectorDef(ngModule);
        if (injDef) {
            defType = ngModule;
        }
        else {
            // Not a component or injector type, so ignore it.
            return false;
        }
    }
    else if (cmpDef && !cmpDef.standalone) {
        return false;
    }
    else {
        defType = container;
    }
    // Check for circular dependencies.
    if (ngDevMode && parents.indexOf(defType) !== -1) {
        const defName = stringify(defType);
        const path = parents.map(stringify);
        throwCyclicDependencyError(defName, path);
    }
    // Check for multiple imports of the same module
    const isDuplicate = dedup.has(defType);
    if (cmpDef) {
        if (isDuplicate) {
            // This component definition has already been processed.
            return false;
        }
        dedup.add(defType);
        if (cmpDef.dependencies) {
            const deps = typeof cmpDef.dependencies === 'function' ? cmpDef.dependencies() : cmpDef.dependencies;
            for (const dep of deps) {
                walkProviderTree(dep, providersOut, parents, dedup);
            }
        }
    }
    else if (injDef) {
        // First, include providers from any imports.
        if (injDef.imports != null && !isDuplicate) {
            // Before processing defType's imports, add it to the set of parents. This way, if it ends
            // up deeply importing itself, this can be detected.
            ngDevMode && parents.push(defType);
            // Add it to the set of dedups. This way we can detect multiple imports of the same module
            dedup.add(defType);
            let importTypesWithProviders;
            try {
                deepForEach(injDef.imports, imported => {
                    if (walkProviderTree(imported, providersOut, parents, dedup)) {
                        importTypesWithProviders || (importTypesWithProviders = []);
                        // If the processed import is an injector type with providers, we store it in the
                        // list of import types with providers, so that we can process those afterwards.
                        importTypesWithProviders.push(imported);
                    }
                });
            }
            finally {
                // Remove it from the parents set when finished.
                ngDevMode && parents.pop();
            }
            // Imports which are declared with providers (TypeWithProviders) need to be processed
            // after all imported modules are processed. This is similar to how View Engine
            // processes/merges module imports in the metadata resolver. See: FW-1349.
            if (importTypesWithProviders !== undefined) {
                processInjectorTypesWithProviders(importTypesWithProviders, providersOut);
            }
        }
        if (!isDuplicate) {
            // Track the InjectorType and add a provider for it.
            // It's important that this is done after the def's imports.
            const factory = getFactoryDef(defType) || (() => new defType());
            // Append extra providers to make more info available for consumers (to retrieve an injector
            // type), as well as internally (to calculate an injection scope correctly and eagerly
            // instantiate a `defType` when an injector is created).
            providersOut.push(
            // Provider to create `defType` using its factory.
            { provide: defType, useFactory: factory, deps: EMPTY_ARRAY }, 
            // Make this `defType` available to an internal logic that calculates injector scope.
            { provide: INJECTOR_DEF_TYPES, useValue: defType, multi: true }, 
            // Provider to eagerly instantiate `defType` via `ENVIRONMENT_INITIALIZER`.
            { provide: ENVIRONMENT_INITIALIZER, useValue: () => inject(defType), multi: true } //
            );
        }
        // Next, include providers listed on the definition itself.
        const defProviders = injDef.providers;
        if (defProviders != null && !isDuplicate) {
            const injectorType = container;
            deepForEach(defProviders, provider => {
                ngDevMode && validateProvider(provider, defProviders, injectorType);
                providersOut.push(provider);
            });
        }
    }
    else {
        // Should not happen, but just in case.
        return false;
    }
    return (defType !== container &&
        container.providers !== undefined);
}
function validateProvider(provider, providers, containerType) {
    if (isTypeProvider(provider) || isValueProvider(provider) || isFactoryProvider(provider) ||
        isExistingProvider(provider)) {
        return;
    }
    // Here we expect the provider to be a `useClass` provider (by elimination).
    const classRef = resolveForwardRef(provider && (provider.useClass || provider.provide));
    if (!classRef) {
        throwInvalidProviderError(containerType, providers, provider);
    }
}
export const USE_VALUE = getClosureSafeProperty({ provide: String, useValue: getClosureSafeProperty });
export function isValueProvider(value) {
    return value !== null && typeof value == 'object' && USE_VALUE in value;
}
export function isExistingProvider(value) {
    return !!(value && value.useExisting);
}
export function isFactoryProvider(value) {
    return !!(value && value.useFactory);
}
export function isTypeProvider(value) {
    return typeof value === 'function';
}
export function isClassProvider(value) {
    return !!value.useClass;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvdmlkZXJfY29sbGVjdGlvbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL2RpL3Byb3ZpZGVyX2NvbGxlY3Rpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLFlBQVksRUFBbUIsTUFBTSxXQUFXLENBQUM7QUFFekQsT0FBTyxFQUFDLGVBQWUsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQ3RELE9BQU8sRUFBQyxhQUFhLEVBQUMsTUFBTSwrQkFBK0IsQ0FBQztBQUM1RCxPQUFPLEVBQUMsMEJBQTBCLEVBQUUseUJBQXlCLEVBQUMsTUFBTSxzQkFBc0IsQ0FBQztBQUMzRixPQUFPLEVBQUMsaUJBQWlCLEVBQUMsTUFBTSxpQ0FBaUMsQ0FBQztBQUNsRSxPQUFPLEVBQUMsV0FBVyxFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFDaEQsT0FBTyxFQUFDLHNCQUFzQixFQUFDLE1BQU0sa0JBQWtCLENBQUM7QUFDeEQsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQzVDLE9BQU8sRUFBQyxXQUFXLEVBQUMsTUFBTSxTQUFTLENBQUM7QUFFcEMsT0FBTyxFQUFDLGlCQUFpQixFQUFDLE1BQU0sZUFBZSxDQUFDO0FBQ2hELE9BQU8sRUFBQyx1QkFBdUIsRUFBQyxNQUFNLHFCQUFxQixDQUFDO0FBQzVELE9BQU8sRUFBQyxRQUFRLElBQUksTUFBTSxFQUFDLE1BQU0sMEJBQTBCLENBQUM7QUFDNUQsT0FBTyxFQUFDLGNBQWMsRUFBMEMsTUFBTSxrQkFBa0IsQ0FBQztBQUV6RixPQUFPLEVBQUMsa0JBQWtCLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQVVyRDs7Ozs7Ozs7OztHQVVHO0FBQ0gsTUFBTSxVQUFVLG1CQUFtQixDQUFDLEdBQUcsT0FBZ0M7SUFFckUsT0FBTyxFQUFDLFVBQVUsRUFBRSwyQkFBMkIs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O0lBQzVFLE1BQU0sUUFBUSxHQUFHLGlCQUFpQixDQUM5QixRQUFRLElBQUksQ0FBRSxRQUFnRCxDQUFDLFFBQVEsSUFBSSxRQUFRLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztJQUNsRyxJQUFJLENBQUMsUUFBUSxFQUFFO1FBQ2IseUJBQXlCLENBQUMsYUFBYSxFQUFFLFNBQVMsRUFBRSxRQUFRLENBQUMsQ0FBQztLQUMvRDtBQUNILENBQUM7QUFFRCxNQUFNLENBQUMsTUFBTSxTQUFTLEdBQ2xCLHNCQUFzQixDQUFnQixFQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsUUFBUSxFQUFFLHNCQUFzQixFQUFDLENBQUMsQ0FBQztBQUUvRixNQUFNLFVBQVUsZUFBZSxDQUFDLEtBQXFCO0lBQ25ELE9BQU8sS0FBSyxLQUFLLElBQUksSUFBSSxPQUFPLEtBQUssSUFBSSxRQUFRLElBQUksU0FBUyxJQUFJLEtBQUssQ0FBQztBQUMxRSxDQUFDO0FBRUQsTUFBTSxVQUFVLGtCQUFrQixDQUFDLEtBQXFCO0lBQ3RELE9BQU8sQ0FBQyxDQUFDLENBQUMsS0FBSyxJQUFLLEtBQTBCLENBQUMsV0FBVyxDQUFDLENBQUM7QUFDOUQsQ0FBQztBQUVELE1BQU0sVUFBVSxpQkFBaUIsQ0FBQyxLQUFxQjtJQUNyRCxPQUFPLENBQUMsQ0FBQyxDQUFDLEtBQUssSUFBSyxLQUF5QixDQUFDLFVBQVUsQ0FBQyxDQUFDO0FBQzVELENBQUM7QUFFRCxNQUFNLFVBQVUsY0FBYyxDQUFDLEtBQXFCO0lBQ2xELE9BQU8sT0FBTyxLQUFLLEtBQUssVUFBVSxDQUFDO0FBQ3JDLENBQUM7QUFFRCxNQUFNLFVBQVUsZUFBZSxDQUFDLEtBQXFCO0lBQ25ELE9BQU8sQ0FBQyxDQUFFLEtBQTZDLENBQUMsUUFBUSxDQUFDO0FBQ25FLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtSdW50aW1lRXJyb3IsIFJ1bnRpbWVFcnJvckNvZGV9IGZyb20gJy4uL2Vycm9ycyc7XG5pbXBvcnQge1R5cGV9IGZyb20gJy4uL2ludGVyZmFjZS90eXBlJztcbmltcG9ydCB7Z2V0Q29tcG9uZW50RGVmfSBmcm9tICcuLi9yZW5kZXIzL2RlZmluaXRpb24nO1xuaW1wb3J0IHtnZXRGYWN0b3J5RGVmfSBmcm9tICcuLi9yZW5kZXIzL2RlZmluaXRpb25fZmFjdG9yeSc7XG5pbXBvcnQge3Rocm93Q3ljbGljRGVwZW5kZW5jeUVycm9yLCB0aHJvd0ludmFsaWRQcm92aWRlckVycm9yfSBmcm9tICcuLi9yZW5kZXIzL2Vycm9yc19kaSc7XG5pbXBvcnQge3N0cmluZ2lmeUZvckVycm9yfSBmcm9tICcuLi9yZW5kZXIzL3V0aWwvc3RyaW5naWZ5X3V0aWxzJztcbmltcG9ydCB7ZGVlcEZvckVhY2h9IGZyb20gJy4uL3V0aWwvYXJyYXlfdXRpbHMnO1xuaW1wb3J0IHtnZXRDbG9zdXJlU2FmZVByb3BlcnR5fSBmcm9tICcuLi91dGlsL3Byb3BlcnR5JztcbmltcG9ydCB7c3RyaW5naWZ5fSBmcm9tICcuLi91dGlsL3N0cmluZ2lmeSc7XG5pbXBvcnQge0VNUFRZX0FSUkFZfSBmcm9tICcuLi92aWV3JztcblxuaW1wb3J0IHtyZXNvbHZlRm9yd2FyZFJlZn0gZnJvbSAnLi9mb3J3YXJkX3JlZic7XG5pbXBvcnQge0VOVklST05NRU5UX0lOSVRJQUxJWkVSfSBmcm9tICcuL2luaXRpYWxpemVyX3Rva2VuJztcbmltcG9ydCB7ybXJtWluamVjdCBhcyBpbmplY3R9IGZyb20gJy4vaW5qZWN0b3JfY29tcGF0aWJpbGl0eSc7XG5pbXBvcnQge2dldEluamVjdG9yRGVmLCBJbmplY3RvclR5cGUsIEluamVjdG9yVHlwZVdpdGhQcm92aWRlcnN9IGZyb20gJy4vaW50ZXJmYWNlL2RlZnMnO1xuaW1wb3J0IHtDbGFzc1Byb3ZpZGVyLCBDb25zdHJ1Y3RvclByb3ZpZGVyLCBFeGlzdGluZ1Byb3ZpZGVyLCBGYWN0b3J5UHJvdmlkZXIsIEltcG9ydGVkTmdNb2R1bGVQcm92aWRlcnMsIE1vZHVsZVdpdGhQcm92aWRlcnMsIFByb3ZpZGVyLCBTdGF0aWNDbGFzc1Byb3ZpZGVyLCBUeXBlUHJvdmlkZXIsIFZhbHVlUHJvdmlkZXJ9IGZyb20gJy4vaW50ZXJmYWNlL3Byb3ZpZGVyJztcbmltcG9ydCB7SU5KRUNUT1JfREVGX1RZUEVTfSBmcm9tICcuL2ludGVybmFsX3Rva2Vucyc7XG5cbi8qKlxuICogQSBzb3VyY2Ugb2YgcHJvdmlkZXJzIGZvciB0aGUgYGltcG9ydFByb3ZpZGVyc0Zyb21gIGZ1bmN0aW9uLlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IHR5cGUgSW1wb3J0UHJvdmlkZXJzU291cmNlID1cbiAgICBUeXBlPHVua25vd24+fE1vZHVsZVdpdGhQcm92aWRlcnM8dW5rbm93bj58QXJyYXk8SW1wb3J0UHJvdmlkZXJzU291cmNlPjtcblxuLyoqXG4gKiBDb2xsZWN0cyBwcm92aWRlcnMgZnJvbSBhbGwgTmdNb2R1bGVzIGFuZCBzdGFuZGFsb25lIGNvbXBvbmVudHMsIGluY2x1ZGluZyB0cmFuc2l0aXZlbHkgaW1wb3J0ZWRcbiAqIG9uZXMuXG4gKlxuICogUHJvdmlkZXJzIGV4dHJhY3RlZCB2aWEgYGltcG9ydFByb3ZpZGVyc0Zyb21gIGFyZSBvbmx5IHVzYWJsZSBpbiBhbiBhcHBsaWNhdGlvbiBpbmplY3RvciBvclxuICogYW5vdGhlciBlbnZpcm9ubWVudCBpbmplY3RvciAoc3VjaCBhcyBhIHJvdXRlIGluamVjdG9yKS4gVGhleSBzaG91bGQgbm90IGJlIHVzZWQgaW4gY29tcG9uZW50XG4gKiBwcm92aWRlcnMuXG4gKlxuICogQHJldHVybnMgVGhlIGNvbGxlY3RlZCBwcm92aWRlcnMgZnJvbSB0aGUgc3BlY2lmaWVkIGxpc3Qgb2YgdHlwZXMuXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbXBvcnRQcm92aWRlcnNGcm9tKC4uLnNvdXJjZXM6IEltcG9ydFByb3ZpZGVyc1NvdXJjZVtdKTpcbiAgICBJbXBvcnRlZE5nTW9kdWxlUHJvdmlkZXJzIHtcbiAgcmV0dXJuIHvJtXByb3ZpZGVyczogaW50ZXJuYWxJbXBvcnRQcm92aWRlcnNGcm9tKHRydWUsIHNvdXJjZXMpfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGludGVybmFsSW1wb3J0UHJvdmlkZXJzRnJvbShcbiAgICBjaGVja0ZvclN0YW5kYWxvbmVDbXA6IGJvb2xlYW4sIC4uLnNvdXJjZXM6IEltcG9ydFByb3ZpZGVyc1NvdXJjZVtdKTogUHJvdmlkZXJbXSB7XG4gIGNvbnN0IHByb3ZpZGVyc091dDogU2luZ2xlUHJvdmlkZXJbXSA9IFtdO1xuICBjb25zdCBkZWR1cCA9IG5ldyBTZXQ8VHlwZTx1bmtub3duPj4oKTsgIC8vIGFscmVhZHkgc2VlbiB0eXBlc1xuICBsZXQgaW5qZWN0b3JUeXBlc1dpdGhQcm92aWRlcnM6IEluamVjdG9yVHlwZVdpdGhQcm92aWRlcnM8dW5rbm93bj5bXXx1bmRlZmluZWQ7XG4gIGRlZXBGb3JFYWNoKHNvdXJjZXMsIHNvdXJjZSA9PiB7XG4gICAgaWYgKCh0eXBlb2YgbmdEZXZNb2RlID09PSAndW5kZWZpbmVkJyB8fCBuZ0Rldk1vZGUpICYmIGNoZWNrRm9yU3RhbmRhbG9uZUNtcCkge1xuICAgICAgY29uc3QgY21wRGVmID0gZ2V0Q29tcG9uZW50RGVmKHNvdXJjZSk7XG4gICAgICBpZiAoY21wRGVmPy5zdGFuZGFsb25lKSB7XG4gICAgICAgIHRocm93IG5ldyBSdW50aW1lRXJyb3IoXG4gICAgICAgICAgICBSdW50aW1lRXJyb3JDb2RlLklNUE9SVF9QUk9WSURFUlNfRlJPTV9TVEFOREFMT05FLFxuICAgICAgICAgICAgYEltcG9ydGluZyBwcm92aWRlcnMgc3VwcG9ydHMgTmdNb2R1bGUgb3IgTW9kdWxlV2l0aFByb3ZpZGVycyBidXQgZ290IGEgc3RhbmRhbG9uZSBjb21wb25lbnQgXCIke1xuICAgICAgICAgICAgICAgIHN0cmluZ2lmeUZvckVycm9yKHNvdXJjZSl9XCJgKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBOYXJyb3cgYHNvdXJjZWAgdG8gYWNjZXNzIHRoZSBpbnRlcm5hbCB0eXBlIGFuYWxvZ3VlIGZvciBgTW9kdWxlV2l0aFByb3ZpZGVyc2AuXG4gICAgY29uc3QgaW50ZXJuYWxTb3VyY2UgPSBzb3VyY2UgYXMgVHlwZTx1bmtub3duPnwgSW5qZWN0b3JUeXBlV2l0aFByb3ZpZGVyczx1bmtub3duPjtcbiAgICBpZiAod2Fsa1Byb3ZpZGVyVHJlZShpbnRlcm5hbFNvdXJjZSwgcHJvdmlkZXJzT3V0LCBbXSwgZGVkdXApKSB7XG4gICAgICBpbmplY3RvclR5cGVzV2l0aFByb3ZpZGVycyB8fD0gW107XG4gICAgICBpbmplY3RvclR5cGVzV2l0aFByb3ZpZGVycy5wdXNoKGludGVybmFsU291cmNlKTtcbiAgICB9XG4gIH0pO1xuICAvLyBDb2xsZWN0IGFsbCBwcm92aWRlcnMgZnJvbSBgTW9kdWxlV2l0aFByb3ZpZGVyc2AgdHlwZXMuXG4gIGlmIChpbmplY3RvclR5cGVzV2l0aFByb3ZpZGVycyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgcHJvY2Vzc0luamVjdG9yVHlwZXNXaXRoUHJvdmlkZXJzKGluamVjdG9yVHlwZXNXaXRoUHJvdmlkZXJzLCBwcm92aWRlcnNPdXQpO1xuICB9XG5cbiAgcmV0dXJuIHByb3ZpZGVyc091dDtcbn1cblxuLyoqXG4gKiBDb2xsZWN0cyBhbGwgcHJvdmlkZXJzIGZyb20gdGhlIGxpc3Qgb2YgYE1vZHVsZVdpdGhQcm92aWRlcnNgIGFuZCBhcHBlbmRzIHRoZW0gdG8gdGhlIHByb3ZpZGVkXG4gKiBhcnJheS5cbiAqL1xuZnVuY3Rpb24gcHJvY2Vzc0luamVjdG9yVHlwZXNXaXRoUHJvdmlkZXJzKFxuICAgIHR5cGVzV2l0aFByb3ZpZGVyczogSW5qZWN0b3JUeXBlV2l0aFByb3ZpZGVyczx1bmtub3duPltdLCBwcm92aWRlcnNPdXQ6IFByb3ZpZGVyW10pOiB2b2lkIHtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCB0eXBlc1dpdGhQcm92aWRlcnMubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCB7bmdNb2R1bGUsIHByb3ZpZGVyc30gPSB0eXBlc1dpdGhQcm92aWRlcnNbaV07XG4gICAgZGVlcEZvckVhY2gocHJvdmlkZXJzISwgcHJvdmlkZXIgPT4ge1xuICAgICAgbmdEZXZNb2RlICYmIHZhbGlkYXRlUHJvdmlkZXIocHJvdmlkZXIsIHByb3ZpZGVycyB8fCBFTVBUWV9BUlJBWSwgbmdNb2R1bGUpO1xuICAgICAgcHJvdmlkZXJzT3V0LnB1c2gocHJvdmlkZXIpO1xuICAgIH0pO1xuICB9XG59XG5cbi8qKlxuICogSW50ZXJuYWwgdHlwZSBmb3IgYSBzaW5nbGUgcHJvdmlkZXIgaW4gYSBkZWVwIHByb3ZpZGVyIGFycmF5LlxuICovXG5leHBvcnQgdHlwZSBTaW5nbGVQcm92aWRlciA9IFR5cGVQcm92aWRlcnxWYWx1ZVByb3ZpZGVyfENsYXNzUHJvdmlkZXJ8Q29uc3RydWN0b3JQcm92aWRlcnxcbiAgICBFeGlzdGluZ1Byb3ZpZGVyfEZhY3RvcnlQcm92aWRlcnxTdGF0aWNDbGFzc1Byb3ZpZGVyO1xuXG4vKipcbiAqIFRoZSBsb2dpYyB2aXNpdHMgYW4gYEluamVjdG9yVHlwZWAsIGFuIGBJbmplY3RvclR5cGVXaXRoUHJvdmlkZXJzYCwgb3IgYSBzdGFuZGFsb25lXG4gKiBgQ29tcG9uZW50VHlwZWAsIGFuZCBhbGwgb2YgaXRzIHRyYW5zaXRpdmUgcHJvdmlkZXJzIGFuZCBjb2xsZWN0cyBwcm92aWRlcnMuXG4gKlxuICogSWYgYW4gYEluamVjdG9yVHlwZVdpdGhQcm92aWRlcnNgIHRoYXQgZGVjbGFyZXMgcHJvdmlkZXJzIGJlc2lkZXMgdGhlIHR5cGUgaXMgc3BlY2lmaWVkLFxuICogdGhlIGZ1bmN0aW9uIHdpbGwgcmV0dXJuIFwidHJ1ZVwiIHRvIGluZGljYXRlIHRoYXQgdGhlIHByb3ZpZGVycyBvZiB0aGUgdHlwZSBkZWZpbml0aW9uIG5lZWRcbiAqIHRvIGJlIHByb2Nlc3NlZC4gVGhpcyBhbGxvd3MgdXMgdG8gcHJvY2VzcyBwcm92aWRlcnMgb2YgaW5qZWN0b3IgdHlwZXMgYWZ0ZXIgYWxsIGltcG9ydHMgb2ZcbiAqIGFuIGluamVjdG9yIGRlZmluaXRpb24gYXJlIHByb2Nlc3NlZC4gKGZvbGxvd2luZyBWaWV3IEVuZ2luZSBzZW1hbnRpY3M6IHNlZSBGVy0xMzQ5KVxuICovXG5leHBvcnQgZnVuY3Rpb24gd2Fsa1Byb3ZpZGVyVHJlZShcbiAgICBjb250YWluZXI6IFR5cGU8dW5rbm93bj58SW5qZWN0b3JUeXBlV2l0aFByb3ZpZGVyczx1bmtub3duPiwgcHJvdmlkZXJzT3V0OiBTaW5nbGVQcm92aWRlcltdLFxuICAgIHBhcmVudHM6IFR5cGU8dW5rbm93bj5bXSxcbiAgICBkZWR1cDogU2V0PFR5cGU8dW5rbm93bj4+KTogY29udGFpbmVyIGlzIEluamVjdG9yVHlwZVdpdGhQcm92aWRlcnM8dW5rbm93bj4ge1xuICBjb250YWluZXIgPSByZXNvbHZlRm9yd2FyZFJlZihjb250YWluZXIpO1xuICBpZiAoIWNvbnRhaW5lcikgcmV0dXJuIGZhbHNlO1xuXG4gIC8vIFRoZSBhY3R1YWwgdHlwZSB3aGljaCBoYWQgdGhlIGRlZmluaXRpb24uIFVzdWFsbHkgYGNvbnRhaW5lcmAsIGJ1dCBtYXkgYmUgYW4gdW53cmFwcGVkIHR5cGVcbiAgLy8gZnJvbSBgSW5qZWN0b3JUeXBlV2l0aFByb3ZpZGVyc2AuXG4gIGxldCBkZWZUeXBlOiBUeXBlPHVua25vd24+fG51bGwgPSBudWxsO1xuXG4gIGxldCBpbmpEZWYgPSBnZXRJbmplY3RvckRlZihjb250YWluZXIpO1xuICBjb25zdCBjbXBEZWYgPSAhaW5qRGVmICYmIGdldENvbXBvbmVudERlZihjb250YWluZXIpO1xuICBpZiAoIWluakRlZiAmJiAhY21wRGVmKSB7XG4gICAgLy8gYGNvbnRhaW5lcmAgaXMgbm90IGFuIGluamVjdG9yIHR5cGUgb3IgYSBjb21wb25lbnQgdHlwZS4gSXQgbWlnaHQgYmU6XG4gICAgLy8gICogQW4gYEluamVjdG9yVHlwZVdpdGhQcm92aWRlcnNgIHRoYXQgd3JhcHMgYW4gaW5qZWN0b3IgdHlwZS5cbiAgICAvLyAgKiBBIHN0YW5kYWxvbmUgZGlyZWN0aXZlIG9yIHBpcGUgdGhhdCBnb3QgcHVsbGVkIGluIGZyb20gYSBzdGFuZGFsb25lIGNvbXBvbmVudCdzXG4gICAgLy8gICAgZGVwZW5kZW5jaWVzLlxuICAgIC8vIFRyeSB0byB1bndyYXAgaXQgYXMgYW4gYEluamVjdG9yVHlwZVdpdGhQcm92aWRlcnNgIGZpcnN0LlxuICAgIGNvbnN0IG5nTW9kdWxlOiBUeXBlPHVua25vd24+fHVuZGVmaW5lZCA9XG4gICAgICAgIChjb250YWluZXIgYXMgSW5qZWN0b3JUeXBlV2l0aFByb3ZpZGVyczxhbnk+KS5uZ01vZHVsZSBhcyBUeXBlPHVua25vd24+fCB1bmRlZmluZWQ7XG4gICAgaW5qRGVmID0gZ2V0SW5qZWN0b3JEZWYobmdNb2R1bGUpO1xuICAgIGlmIChpbmpEZWYpIHtcbiAgICAgIGRlZlR5cGUgPSBuZ01vZHVsZSE7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIE5vdCBhIGNvbXBvbmVudCBvciBpbmplY3RvciB0eXBlLCBzbyBpZ25vcmUgaXQuXG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9IGVsc2UgaWYgKGNtcERlZiAmJiAhY21wRGVmLnN0YW5kYWxvbmUpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH0gZWxzZSB7XG4gICAgZGVmVHlwZSA9IGNvbnRhaW5lciBhcyBUeXBlPHVua25vd24+O1xuICB9XG5cbiAgLy8gQ2hlY2sgZm9yIGNpcmN1bGFyIGRlcGVuZGVuY2llcy5cbiAgaWYgKG5nRGV2TW9kZSAmJiBwYXJlbnRzLmluZGV4T2YoZGVmVHlwZSkgIT09IC0xKSB7XG4gICAgY29uc3QgZGVmTmFtZSA9IHN0cmluZ2lmeShkZWZUeXBlKTtcbiAgICBjb25zdCBwYXRoID0gcGFyZW50cy5tYXAoc3RyaW5naWZ5KTtcbiAgICB0aHJvd0N5Y2xpY0RlcGVuZGVuY3lFcnJvcihkZWZOYW1lLCBwYXRoKTtcbiAgfVxuXG4gIC8vIENoZWNrIGZvciBtdWx0aXBsZSBpbXBvcnRzIG9mIHRoZSBzYW1lIG1vZHVsZVxuICBjb25zdCBpc0R1cGxpY2F0ZSA9IGRlZHVwLmhhcyhkZWZUeXBlKTtcblxuICBpZiAoY21wRGVmKSB7XG4gICAgaWYgKGlzRHVwbGljYXRlKSB7XG4gICAgICAvLyBUaGlzIGNvbXBvbmVudCBkZWZpbml0aW9uIGhhcyBhbHJlYWR5IGJlZW4gcHJvY2Vzc2VkLlxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBkZWR1cC5hZGQoZGVmVHlwZSk7XG5cbiAgICBpZiAoY21wRGVmLmRlcGVuZGVuY2llcykge1xuICAgICAgY29uc3QgZGVwcyA9XG4gICAgICAgICAgdHlwZW9mIGNtcERlZi5kZXBlbmRlbmNpZXMgPT09ICdmdW5jdGlvbicgPyBjbXBEZWYuZGVwZW5kZW5jaWVzKCkgOiBjbXBEZWYuZGVwZW5kZW5jaWVzO1xuICAgICAgZm9yIChjb25zdCBkZXAgb2YgZGVwcykge1xuICAgICAgICB3YWxrUHJvdmlkZXJUcmVlKGRlcCwgcHJvdmlkZXJzT3V0LCBwYXJlbnRzLCBkZWR1cCk7XG4gICAgICB9XG4gICAgfVxuICB9IGVsc2UgaWYgKGluakRlZikge1xuICAgIC8vIEZpcnN0LCBpbmNsdWRlIHByb3ZpZGVycyBmcm9tIGFueSBpbXBvcnRzLlxuICAgIGlmIChpbmpEZWYuaW1wb3J0cyAhPSBudWxsICYmICFpc0R1cGxpY2F0ZSkge1xuICAgICAgLy8gQmVmb3JlIHByb2Nlc3NpbmcgZGVmVHlwZSdzIGltcG9ydHMsIGFkZCBpdCB0byB0aGUgc2V0IG9mIHBhcmVudHMuIFRoaXMgd2F5LCBpZiBpdCBlbmRzXG4gICAgICAvLyB1cCBkZWVwbHkgaW1wb3J0aW5nIGl0c2VsZiwgdGhpcyBjYW4gYmUgZGV0ZWN0ZWQuXG4gICAgICBuZ0Rldk1vZGUgJiYgcGFyZW50cy5wdXNoKGRlZlR5cGUpO1xuICAgICAgLy8gQWRkIGl0IHRvIHRoZSBzZXQgb2YgZGVkdXBzLiBUaGlzIHdheSB3ZSBjYW4gZGV0ZWN0IG11bHRpcGxlIGltcG9ydHMgb2YgdGhlIHNhbWUgbW9kdWxlXG4gICAgICBkZWR1cC5hZGQoZGVmVHlwZSk7XG5cbiAgICAgIGxldCBpbXBvcnRUeXBlc1dpdGhQcm92aWRlcnM6IChJbmplY3RvclR5cGVXaXRoUHJvdmlkZXJzPGFueT5bXSl8dW5kZWZpbmVkO1xuICAgICAgdHJ5IHtcbiAgICAgICAgZGVlcEZvckVhY2goaW5qRGVmLmltcG9ydHMsIGltcG9ydGVkID0+IHtcbiAgICAgICAgICBpZiAod2Fsa1Byb3ZpZGVyVHJlZShpbXBvcnRlZCwgcHJvdmlkZXJzT3V0LCBwYXJlbnRzLCBkZWR1cCkpIHtcbiAgICAgICAgICAgIGltcG9ydFR5cGVzV2l0aFByb3ZpZGVycyB8fD0gW107XG4gICAgICAgICAgICAvLyBJZiB0aGUgcHJvY2Vzc2VkIGltcG9ydCBpcyBhbiBpbmplY3RvciB0eXBlIHdpdGggcHJvdmlkZXJzLCB3ZSBzdG9yZSBpdCBpbiB0aGVcbiAgICAgICAgICAgIC8vIGxpc3Qgb2YgaW1wb3J0IHR5cGVzIHdpdGggcHJvdmlkZXJzLCBzbyB0aGF0IHdlIGNhbiBwcm9jZXNzIHRob3NlIGFmdGVyd2FyZHMuXG4gICAgICAgICAgICBpbXBvcnRUeXBlc1dpdGhQcm92aWRlcnMucHVzaChpbXBvcnRlZCk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0gZmluYWxseSB7XG4gICAgICAgIC8vIFJlbW92ZSBpdCBmcm9tIHRoZSBwYXJlbnRzIHNldCB3aGVuIGZpbmlzaGVkLlxuICAgICAgICBuZ0Rldk1vZGUgJiYgcGFyZW50cy5wb3AoKTtcbiAgICAgIH1cblxuICAgICAgLy8gSW1wb3J0cyB3aGljaCBhcmUgZGVjbGFyZWQgd2l0aCBwcm92aWRlcnMgKFR5cGVXaXRoUHJvdmlkZXJzKSBuZWVkIHRvIGJlIHByb2Nlc3NlZFxuICAgICAgLy8gYWZ0ZXIgYWxsIGltcG9ydGVkIG1vZHVsZXMgYXJlIHByb2Nlc3NlZC4gVGhpcyBpcyBzaW1pbGFyIHRvIGhvdyBWaWV3IEVuZ2luZVxuICAgICAgLy8gcHJvY2Vzc2VzL21lcmdlcyBtb2R1bGUgaW1wb3J0cyBpbiB0aGUgbWV0YWRhdGEgcmVzb2x2ZXIuIFNlZTogRlctMTM0OS5cbiAgICAgIGlmIChpbXBvcnRUeXBlc1dpdGhQcm92aWRlcnMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBwcm9jZXNzSW5qZWN0b3JUeXBlc1dpdGhQcm92aWRlcnMoaW1wb3J0VHlwZXNXaXRoUHJvdmlkZXJzLCBwcm92aWRlcnNPdXQpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmICghaXNEdXBsaWNhdGUpIHtcbiAgICAgIC8vIFRyYWNrIHRoZSBJbmplY3RvclR5cGUgYW5kIGFkZCBhIHByb3ZpZGVyIGZvciBpdC5cbiAgICAgIC8vIEl0J3MgaW1wb3J0YW50IHRoYXQgdGhpcyBpcyBkb25lIGFmdGVyIHRoZSBkZWYncyBpbXBvcnRzLlxuICAgICAgY29uc3QgZmFjdG9yeSA9IGdldEZhY3RvcnlEZWYoZGVmVHlwZSkgfHwgKCgpID0+IG5ldyBkZWZUeXBlISgpKTtcblxuICAgICAgLy8gQXBwZW5kIGV4dHJhIHByb3ZpZGVycyB0byBtYWtlIG1vcmUgaW5mbyBhdmFpbGFibGUgZm9yIGNvbnN1bWVycyAodG8gcmV0cmlldmUgYW4gaW5qZWN0b3JcbiAgICAgIC8vIHR5cGUpLCBhcyB3ZWxsIGFzIGludGVybmFsbHkgKHRvIGNhbGN1bGF0ZSBhbiBpbmplY3Rpb24gc2NvcGUgY29ycmVjdGx5IGFuZCBlYWdlcmx5XG4gICAgICAvLyBpbnN0YW50aWF0ZSBhIGBkZWZUeXBlYCB3aGVuIGFuIGluamVjdG9yIGlzIGNyZWF0ZWQpLlxuICAgICAgcHJvdmlkZXJzT3V0LnB1c2goXG4gICAgICAgICAgLy8gUHJvdmlkZXIgdG8gY3JlYXRlIGBkZWZUeXBlYCB1c2luZyBpdHMgZmFjdG9yeS5cbiAgICAgICAgICB7cHJvdmlkZTogZGVmVHlwZSwgdXNlRmFjdG9yeTogZmFjdG9yeSwgZGVwczogRU1QVFlfQVJSQVl9LFxuXG4gICAgICAgICAgLy8gTWFrZSB0aGlzIGBkZWZUeXBlYCBhdmFpbGFibGUgdG8gYW4gaW50ZXJuYWwgbG9naWMgdGhhdCBjYWxjdWxhdGVzIGluamVjdG9yIHNjb3BlLlxuICAgICAgICAgIHtwcm92aWRlOiBJTkpFQ1RPUl9ERUZfVFlQRVMsIHVzZVZhbHVlOiBkZWZUeXBlLCBtdWx0aTogdHJ1ZX0sXG5cbiAgICAgICAgICAvLyBQcm92aWRlciB0byBlYWdlcmx5IGluc3RhbnRpYXRlIGBkZWZUeXBlYCB2aWEgYEVOVklST05NRU5UX0lOSVRJQUxJWkVSYC5cbiAgICAgICAgICB7cHJvdmlkZTogRU5WSVJPTk1FTlRfSU5JVElBTElaRVIsIHVzZVZhbHVlOiAoKSA9PiBpbmplY3QoZGVmVHlwZSEpLCBtdWx0aTogdHJ1ZX0gIC8vXG4gICAgICApO1xuICAgIH1cblxuICAgIC8vIE5leHQsIGluY2x1ZGUgcHJvdmlkZXJzIGxpc3RlZCBvbiB0aGUgZGVmaW5pdGlvbiBpdHNlbGYuXG4gICAgY29uc3QgZGVmUHJvdmlkZXJzID0gaW5qRGVmLnByb3ZpZGVycztcbiAgICBpZiAoZGVmUHJvdmlkZXJzICE9IG51bGwgJiYgIWlzRHVwbGljYXRlKSB7XG4gICAgICBjb25zdCBpbmplY3RvclR5cGUgPSBjb250YWluZXIgYXMgSW5qZWN0b3JUeXBlPGFueT47XG4gICAgICBkZWVwRm9yRWFjaChkZWZQcm92aWRlcnMsIHByb3ZpZGVyID0+IHtcbiAgICAgICAgbmdEZXZNb2RlICYmIHZhbGlkYXRlUHJvdmlkZXIocHJvdmlkZXIsIGRlZlByb3ZpZGVycyBhcyBTaW5nbGVQcm92aWRlcltdLCBpbmplY3RvclR5cGUpO1xuICAgICAgICBwcm92aWRlcnNPdXQucHVzaChwcm92aWRlcik7XG4gICAgICB9KTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgLy8gU2hvdWxkIG5vdCBoYXBwZW4sIGJ1dCBqdXN0IGluIGNhc2UuXG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgcmV0dXJuIChcbiAgICAgIGRlZlR5cGUgIT09IGNvbnRhaW5lciAmJlxuICAgICAgKGNvbnRhaW5lciBhcyBJbmplY3RvclR5cGVXaXRoUHJvdmlkZXJzPGFueT4pLnByb3ZpZGVycyAhPT0gdW5kZWZpbmVkKTtcbn1cblxuZnVuY3Rpb24gdmFsaWRhdGVQcm92aWRlcihcbiAgICBwcm92aWRlcjogU2luZ2xlUHJvdmlkZXIsIHByb3ZpZGVyczogU2luZ2xlUHJvdmlkZXJbXSwgY29udGFpbmVyVHlwZTogVHlwZTx1bmtub3duPik6IHZvaWQge1xuICBpZiAoaXNUeXBlUHJvdmlkZXIocHJvdmlkZXIpIHx8IGlzVmFsdWVQcm92aWRlcihwcm92aWRlcikgfHwgaXNGYWN0b3J5UHJvdmlkZXIocHJvdmlkZXIpIHx8XG4gICAgICBpc0V4aXN0aW5nUHJvdmlkZXIocHJvdmlkZXIpKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgLy8gSGVyZSB3ZSBleHBlY3QgdGhlIHByb3ZpZGVyIHRvIGJlIGEgYHVzZUNsYXNzYCBwcm92aWRlciAoYnkgZWxpbWluYXRpb24pLlxuICBjb25zdCBjbGFzc1JlZiA9IHJlc29sdmVGb3J3YXJkUmVmKFxuICAgICAgcHJvdmlkZXIgJiYgKChwcm92aWRlciBhcyBTdGF0aWNDbGFzc1Byb3ZpZGVyIHwgQ2xhc3NQcm92aWRlcikudXNlQ2xhc3MgfHwgcHJvdmlkZXIucHJvdmlkZSkpO1xuICBpZiAoIWNsYXNzUmVmKSB7XG4gICAgdGhyb3dJbnZhbGlkUHJvdmlkZXJFcnJvcihjb250YWluZXJUeXBlLCBwcm92aWRlcnMsIHByb3ZpZGVyKTtcbiAgfVxufVxuXG5leHBvcnQgY29uc3QgVVNFX1ZBTFVFID1cbiAgICBnZXRDbG9zdXJlU2FmZVByb3BlcnR5PFZhbHVlUHJvdmlkZXI+KHtwcm92aWRlOiBTdHJpbmcsIHVzZVZhbHVlOiBnZXRDbG9zdXJlU2FmZVByb3BlcnR5fSk7XG5cbmV4cG9ydCBmdW5jdGlvbiBpc1ZhbHVlUHJvdmlkZXIodmFsdWU6IFNpbmdsZVByb3ZpZGVyKTogdmFsdWUgaXMgVmFsdWVQcm92aWRlciB7XG4gIHJldHVybiB2YWx1ZSAhPT0gbnVsbCAmJiB0eXBlb2YgdmFsdWUgPT0gJ29iamVjdCcgJiYgVVNFX1ZBTFVFIGluIHZhbHVlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNFeGlzdGluZ1Byb3ZpZGVyKHZhbHVlOiBTaW5nbGVQcm92aWRlcik6IHZhbHVlIGlzIEV4aXN0aW5nUHJvdmlkZXIge1xuICByZXR1cm4gISEodmFsdWUgJiYgKHZhbHVlIGFzIEV4aXN0aW5nUHJvdmlkZXIpLnVzZUV4aXN0aW5nKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzRmFjdG9yeVByb3ZpZGVyKHZhbHVlOiBTaW5nbGVQcm92aWRlcik6IHZhbHVlIGlzIEZhY3RvcnlQcm92aWRlciB7XG4gIHJldHVybiAhISh2YWx1ZSAmJiAodmFsdWUgYXMgRmFjdG9yeVByb3ZpZGVyKS51c2VGYWN0b3J5KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzVHlwZVByb3ZpZGVyKHZhbHVlOiBTaW5nbGVQcm92aWRlcik6IHZhbHVlIGlzIFR5cGVQcm92aWRlciB7XG4gIHJldHVybiB0eXBlb2YgdmFsdWUgPT09ICdmdW5jdGlvbic7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0NsYXNzUHJvdmlkZXIodmFsdWU6IFNpbmdsZVByb3ZpZGVyKTogdmFsdWUgaXMgQ2xhc3NQcm92aWRlciB7XG4gIHJldHVybiAhISh2YWx1ZSBhcyBTdGF0aWNDbGFzc1Byb3ZpZGVyIHwgQ2xhc3NQcm92aWRlcikudXNlQ2xhc3M7XG59XG4iXX0=