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
 * More information about standalone components can be found in [this
 * guide](guide/standalone-components).
 *
 * @usageNotes
 * The results of the `importProvidersFrom` call can be used in the `bootstrapApplication` call:
 *
 * ```typescript
 * await bootstrapApplication(RootComponent, {
 *   providers: [
 *     importProvidersFrom(NgModuleOne, NgModuleTwo)
 *   ]
 * });
 * ```
 *
 * You can also use the `importProvidersFrom` results in the `providers` field of a route, when a
 * standalone component is used:
 *
 * ```typescript
 * export const ROUTES: Route[] = [
 *   {
 *     path: 'foo',
 *     providers: [
 *       importProvidersFrom(NgModuleOne, NgModuleTwo)
 *     ],
 *     component: YourStandaloneComponent
 *   }
 * ];
 * ```
 *
 * @returns Collected providers from the specified list of types.
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvdmlkZXJfY29sbGVjdGlvbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL2RpL3Byb3ZpZGVyX2NvbGxlY3Rpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLFlBQVksRUFBbUIsTUFBTSxXQUFXLENBQUM7QUFFekQsT0FBTyxFQUFDLGVBQWUsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQ3RELE9BQU8sRUFBQyxhQUFhLEVBQUMsTUFBTSwrQkFBK0IsQ0FBQztBQUM1RCxPQUFPLEVBQUMsMEJBQTBCLEVBQUUseUJBQXlCLEVBQUMsTUFBTSxzQkFBc0IsQ0FBQztBQUMzRixPQUFPLEVBQUMsaUJBQWlCLEVBQUMsTUFBTSxpQ0FBaUMsQ0FBQztBQUNsRSxPQUFPLEVBQUMsV0FBVyxFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFDaEQsT0FBTyxFQUFDLHNCQUFzQixFQUFDLE1BQU0sa0JBQWtCLENBQUM7QUFDeEQsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQzVDLE9BQU8sRUFBQyxXQUFXLEVBQUMsTUFBTSxTQUFTLENBQUM7QUFFcEMsT0FBTyxFQUFDLGlCQUFpQixFQUFDLE1BQU0sZUFBZSxDQUFDO0FBQ2hELE9BQU8sRUFBQyx1QkFBdUIsRUFBQyxNQUFNLHFCQUFxQixDQUFDO0FBQzVELE9BQU8sRUFBQyxRQUFRLElBQUksTUFBTSxFQUFDLE1BQU0sMEJBQTBCLENBQUM7QUFDNUQsT0FBTyxFQUFDLGNBQWMsRUFBMEMsTUFBTSxrQkFBa0IsQ0FBQztBQUV6RixPQUFPLEVBQUMsa0JBQWtCLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQVVyRDs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBdUNHO0FBQ0gsTUFBTSxVQUFVLG1CQUFtQixDQUFDLEdBQUcsT0FBZ0M7SUFF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QUU7UUFDaEMsT0FBTztLQUNSO0lBRUQsNEVBQTRFO0lBQzVFLE1BQU0sUUFBUSxHQUFHLGlCQUFpQixDQUM5QixRQUFRLElBQUksQ0FBRSxRQUFnRCxDQUFDLFFBQVEsSUFBSSxRQUFRLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztJQUNsRyxJQUFJLENBQUMsUUFBUSxFQUFFO1FBQ2IseUJBQXlCLENBQUMsYUFBYSxFQUFFLFNBQVMsRUFBRSxRQUFRLENBQUMsQ0FBQztLQUMvRDtBQUNILENBQUM7QUFFRCxNQUFNLENBQUMsTUFBTSxTQUFTLEdBQ2xCLHNCQUFzQixDQUFnQixFQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsUUFBUSxFQUFFLHNCQUFzQixFQUFDLENBQUMsQ0FBQztBQUUvRixNQUFNLFVBQVUsZUFBZSxDQUFDLEtBQXFCO0lBQ25ELE9BQU8sS0FBSyxLQUFLLElBQUksSUFBSSxPQUFPLEtBQUssSUFBSSxRQUFRLElBQUksU0FBUyxJQUFJLEtBQUssQ0FBQztBQUMxRSxDQUFDO0FBRUQsTUFBTSxVQUFVLGtCQUFrQixDQUFDLEtBQXFCO0lBQ3RELE9BQU8sQ0FBQyxDQUFDLENBQUMsS0FBSyxJQUFLLEtBQTBCLENBQUMsV0FBVyxDQUFDLENBQUM7QUFDOUQsQ0FBQztBQUVELE1BQU0sVUFBVSxpQkFBaUIsQ0FBQyxLQUFxQjtJQUNyRCxPQUFPLENBQUMsQ0FBQyxDQUFDLEtBQUssSUFBSyxLQUF5QixDQUFDLFVBQVUsQ0FBQyxDQUFDO0FBQzVELENBQUM7QUFFRCxNQUFNLFVBQVUsY0FBYyxDQUFDLEtBQXFCO0lBQ2xELE9BQU8sT0FBTyxLQUFLLEtBQUssVUFBVSxDQUFDO0FBQ3JDLENBQUM7QUFFRCxNQUFNLFVBQVUsZUFBZSxDQUFDLEtBQXFCO0lBQ25ELE9BQU8sQ0FBQyxDQUFFLEtBQTZDLENBQUMsUUFBUSxDQUFDO0FBQ25FLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtSdW50aW1lRXJyb3IsIFJ1bnRpbWVFcnJvckNvZGV9IGZyb20gJy4uL2Vycm9ycyc7XG5pbXBvcnQge1R5cGV9IGZyb20gJy4uL2ludGVyZmFjZS90eXBlJztcbmltcG9ydCB7Z2V0Q29tcG9uZW50RGVmfSBmcm9tICcuLi9yZW5kZXIzL2RlZmluaXRpb24nO1xuaW1wb3J0IHtnZXRGYWN0b3J5RGVmfSBmcm9tICcuLi9yZW5kZXIzL2RlZmluaXRpb25fZmFjdG9yeSc7XG5pbXBvcnQge3Rocm93Q3ljbGljRGVwZW5kZW5jeUVycm9yLCB0aHJvd0ludmFsaWRQcm92aWRlckVycm9yfSBmcm9tICcuLi9yZW5kZXIzL2Vycm9yc19kaSc7XG5pbXBvcnQge3N0cmluZ2lmeUZvckVycm9yfSBmcm9tICcuLi9yZW5kZXIzL3V0aWwvc3RyaW5naWZ5X3V0aWxzJztcbmltcG9ydCB7ZGVlcEZvckVhY2h9IGZyb20gJy4uL3V0aWwvYXJyYXlfdXRpbHMnO1xuaW1wb3J0IHtnZXRDbG9zdXJlU2FmZVByb3BlcnR5fSBmcm9tICcuLi91dGlsL3Byb3BlcnR5JztcbmltcG9ydCB7c3RyaW5naWZ5fSBmcm9tICcuLi91dGlsL3N0cmluZ2lmeSc7XG5pbXBvcnQge0VNUFRZX0FSUkFZfSBmcm9tICcuLi92aWV3JztcblxuaW1wb3J0IHtyZXNvbHZlRm9yd2FyZFJlZn0gZnJvbSAnLi9mb3J3YXJkX3JlZic7XG5pbXBvcnQge0VOVklST05NRU5UX0lOSVRJQUxJWkVSfSBmcm9tICcuL2luaXRpYWxpemVyX3Rva2VuJztcbmltcG9ydCB7ybXJtWluamVjdCBhcyBpbmplY3R9IGZyb20gJy4vaW5qZWN0b3JfY29tcGF0aWJpbGl0eSc7XG5pbXBvcnQge2dldEluamVjdG9yRGVmLCBJbmplY3RvclR5cGUsIEluamVjdG9yVHlwZVdpdGhQcm92aWRlcnN9IGZyb20gJy4vaW50ZXJmYWNlL2RlZnMnO1xuaW1wb3J0IHtDbGFzc1Byb3ZpZGVyLCBDb25zdHJ1Y3RvclByb3ZpZGVyLCBFeGlzdGluZ1Byb3ZpZGVyLCBGYWN0b3J5UHJvdmlkZXIsIEltcG9ydGVkTmdNb2R1bGVQcm92aWRlcnMsIE1vZHVsZVdpdGhQcm92aWRlcnMsIFByb3ZpZGVyLCBTdGF0aWNDbGFzc1Byb3ZpZGVyLCBUeXBlUHJvdmlkZXIsIFZhbHVlUHJvdmlkZXJ9IGZyb20gJy4vaW50ZXJmYWNlL3Byb3ZpZGVyJztcbmltcG9ydCB7SU5KRUNUT1JfREVGX1RZUEVTfSBmcm9tICcuL2ludGVybmFsX3Rva2Vucyc7XG5cbi8qKlxuICogQSBzb3VyY2Ugb2YgcHJvdmlkZXJzIGZvciB0aGUgYGltcG9ydFByb3ZpZGVyc0Zyb21gIGZ1bmN0aW9uLlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IHR5cGUgSW1wb3J0UHJvdmlkZXJzU291cmNlID1cbiAgICBUeXBlPHVua25vd24+fE1vZHVsZVdpdGhQcm92aWRlcnM8dW5rbm93bj58QXJyYXk8SW1wb3J0UHJvdmlkZXJzU291cmNlPjtcblxuLyoqXG4gKiBDb2xsZWN0cyBwcm92aWRlcnMgZnJvbSBhbGwgTmdNb2R1bGVzIGFuZCBzdGFuZGFsb25lIGNvbXBvbmVudHMsIGluY2x1ZGluZyB0cmFuc2l0aXZlbHkgaW1wb3J0ZWRcbiAqIG9uZXMuXG4gKlxuICogUHJvdmlkZXJzIGV4dHJhY3RlZCB2aWEgYGltcG9ydFByb3ZpZGVyc0Zyb21gIGFyZSBvbmx5IHVzYWJsZSBpbiBhbiBhcHBsaWNhdGlvbiBpbmplY3RvciBvclxuICogYW5vdGhlciBlbnZpcm9ubWVudCBpbmplY3RvciAoc3VjaCBhcyBhIHJvdXRlIGluamVjdG9yKS4gVGhleSBzaG91bGQgbm90IGJlIHVzZWQgaW4gY29tcG9uZW50XG4gKiBwcm92aWRlcnMuXG4gKlxuICogTW9yZSBpbmZvcm1hdGlvbiBhYm91dCBzdGFuZGFsb25lIGNvbXBvbmVudHMgY2FuIGJlIGZvdW5kIGluIFt0aGlzXG4gKiBndWlkZV0oZ3VpZGUvc3RhbmRhbG9uZS1jb21wb25lbnRzKS5cbiAqXG4gKiBAdXNhZ2VOb3Rlc1xuICogVGhlIHJlc3VsdHMgb2YgdGhlIGBpbXBvcnRQcm92aWRlcnNGcm9tYCBjYWxsIGNhbiBiZSB1c2VkIGluIHRoZSBgYm9vdHN0cmFwQXBwbGljYXRpb25gIGNhbGw6XG4gKlxuICogYGBgdHlwZXNjcmlwdFxuICogYXdhaXQgYm9vdHN0cmFwQXBwbGljYXRpb24oUm9vdENvbXBvbmVudCwge1xuICogICBwcm92aWRlcnM6IFtcbiAqICAgICBpbXBvcnRQcm92aWRlcnNGcm9tKE5nTW9kdWxlT25lLCBOZ01vZHVsZVR3bylcbiAqICAgXVxuICogfSk7XG4gKiBgYGBcbiAqXG4gKiBZb3UgY2FuIGFsc28gdXNlIHRoZSBgaW1wb3J0UHJvdmlkZXJzRnJvbWAgcmVzdWx0cyBpbiB0aGUgYHByb3ZpZGVyc2AgZmllbGQgb2YgYSByb3V0ZSwgd2hlbiBhXG4gKiBzdGFuZGFsb25lIGNvbXBvbmVudCBpcyB1c2VkOlxuICpcbiAqIGBgYHR5cGVzY3JpcHRcbiAqIGV4cG9ydCBjb25zdCBST1VURVM6IFJvdXRlW10gPSBbXG4gKiAgIHtcbiAqICAgICBwYXRoOiAnZm9vJyxcbiAqICAgICBwcm92aWRlcnM6IFtcbiAqICAgICAgIGltcG9ydFByb3ZpZGVyc0Zyb20oTmdNb2R1bGVPbmUsIE5nTW9kdWxlVHdvKVxuICogICAgIF0sXG4gKiAgICAgY29tcG9uZW50OiBZb3VyU3RhbmRhbG9uZUNvbXBvbmVudFxuICogICB9XG4gKiBdO1xuICogYGBgXG4gKlxuICogQHJldHVybnMgQ29sbGVjdGVkIHByb3ZpZGVycyBmcm9tIHRoZSBzcGVjaWZpZWQgbGlzdCBvZiB0eXBlcy5cbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGltcG9ydFByb3ZpZGVyc0Zyb20oLi4uc291cmNlczogSW1wb3J0UHJvdmlkZXJzU291cmNlW10pOlxuICAgIEltcG9ydGVkTmdNb2R1bGVQcm92aWRlcnMge1xuICByZXR1cm4ge8m1cHJvdmlkZXJzOiBpbnRlcm5hbEltcG9ydFByb3ZpZGVyc0Zyb20odHJ1ZSwgc291cmNlcyl9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaW50ZXJuYWxJbXBvcnRQcm92aWRlcnNGcm9tKFxuICAgIGNoZWNrRm9yU3RhbmRhbG9uZUNtcDogYm9vbGVhbiwgLi4uc291cmNlczogSW1wb3J0UHJvdmlkZXJzU291cmNlW10pOiBQcm92aWRlcltdIHtcbiAgY29uc3QgcHJvdmlkZXJzT3V0OiBTaW5nbGVQcm92aWRlcltdID0gW107XG4gIGNvbnN0IGRlZHVwID0gbmV3IFNldDxUeXBlPHVua25vd24+PigpOyAgLy8gYWxyZWFkeSBzZWVuIHR5cGVzXG4gIGxldCBpbmplY3RvclR5cGVzV2l0aFByb3ZpZGVyczogSW5qZWN0b3JUeXBlV2l0aFByb3ZpZGVyczx1bmtub3duPltdfHVuZGVmaW5lZDtcbiAgZGVlcEZvckVhY2goc291cmNlcywgc291cmNlID0+IHtcbiAgICBpZiAoKHR5cGVvZiBuZ0Rldk1vZGUgPT09ICd1bmRlZmluZWQnIHx8IG5nRGV2TW9kZSkgJiYgY2hlY2tGb3JTdGFuZGFsb25lQ21wKSB7XG4gICAgICBjb25zdCBjbXBEZWYgPSBnZXRDb21wb25lbnREZWYoc291cmNlKTtcbiAgICAgIGlmIChjbXBEZWY/LnN0YW5kYWxvbmUpIHtcbiAgICAgICAgdGhyb3cgbmV3IFJ1bnRpbWVFcnJvcihcbiAgICAgICAgICAgIFJ1bnRpbWVFcnJvckNvZGUuSU1QT1JUX1BST1ZJREVSU19GUk9NX1NUQU5EQUxPTkUsXG4gICAgICAgICAgICBgSW1wb3J0aW5nIHByb3ZpZGVycyBzdXBwb3J0cyBOZ01vZHVsZSBvciBNb2R1bGVXaXRoUHJvdmlkZXJzIGJ1dCBnb3QgYSBzdGFuZGFsb25lIGNvbXBvbmVudCBcIiR7XG4gICAgICAgICAgICAgICAgc3RyaW5naWZ5Rm9yRXJyb3Ioc291cmNlKX1cImApO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIE5hcnJvdyBgc291cmNlYCB0byBhY2Nlc3MgdGhlIGludGVybmFsIHR5cGUgYW5hbG9ndWUgZm9yIGBNb2R1bGVXaXRoUHJvdmlkZXJzYC5cbiAgICBjb25zdCBpbnRlcm5hbFNvdXJjZSA9IHNvdXJjZSBhcyBUeXBlPHVua25vd24+fCBJbmplY3RvclR5cGVXaXRoUHJvdmlkZXJzPHVua25vd24+O1xuICAgIGlmICh3YWxrUHJvdmlkZXJUcmVlKGludGVybmFsU291cmNlLCBwcm92aWRlcnNPdXQsIFtdLCBkZWR1cCkpIHtcbiAgICAgIGluamVjdG9yVHlwZXNXaXRoUHJvdmlkZXJzIHx8PSBbXTtcbiAgICAgIGluamVjdG9yVHlwZXNXaXRoUHJvdmlkZXJzLnB1c2goaW50ZXJuYWxTb3VyY2UpO1xuICAgIH1cbiAgfSk7XG4gIC8vIENvbGxlY3QgYWxsIHByb3ZpZGVycyBmcm9tIGBNb2R1bGVXaXRoUHJvdmlkZXJzYCB0eXBlcy5cbiAgaWYgKGluamVjdG9yVHlwZXNXaXRoUHJvdmlkZXJzICE9PSB1bmRlZmluZWQpIHtcbiAgICBwcm9jZXNzSW5qZWN0b3JUeXBlc1dpdGhQcm92aWRlcnMoaW5qZWN0b3JUeXBlc1dpdGhQcm92aWRlcnMsIHByb3ZpZGVyc091dCk7XG4gIH1cblxuICByZXR1cm4gcHJvdmlkZXJzT3V0O1xufVxuXG4vKipcbiAqIENvbGxlY3RzIGFsbCBwcm92aWRlcnMgZnJvbSB0aGUgbGlzdCBvZiBgTW9kdWxlV2l0aFByb3ZpZGVyc2AgYW5kIGFwcGVuZHMgdGhlbSB0byB0aGUgcHJvdmlkZWRcbiAqIGFycmF5LlxuICovXG5mdW5jdGlvbiBwcm9jZXNzSW5qZWN0b3JUeXBlc1dpdGhQcm92aWRlcnMoXG4gICAgdHlwZXNXaXRoUHJvdmlkZXJzOiBJbmplY3RvclR5cGVXaXRoUHJvdmlkZXJzPHVua25vd24+W10sIHByb3ZpZGVyc091dDogUHJvdmlkZXJbXSk6IHZvaWQge1xuICBmb3IgKGxldCBpID0gMDsgaSA8IHR5cGVzV2l0aFByb3ZpZGVycy5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IHtuZ01vZHVsZSwgcHJvdmlkZXJzfSA9IHR5cGVzV2l0aFByb3ZpZGVyc1tpXTtcbiAgICBkZWVwRm9yRWFjaChwcm92aWRlcnMhLCBwcm92aWRlciA9PiB7XG4gICAgICBuZ0Rldk1vZGUgJiYgdmFsaWRhdGVQcm92aWRlcihwcm92aWRlciwgcHJvdmlkZXJzIHx8IEVNUFRZX0FSUkFZLCBuZ01vZHVsZSk7XG4gICAgICBwcm92aWRlcnNPdXQucHVzaChwcm92aWRlcik7XG4gICAgfSk7XG4gIH1cbn1cblxuLyoqXG4gKiBJbnRlcm5hbCB0eXBlIGZvciBhIHNpbmdsZSBwcm92aWRlciBpbiBhIGRlZXAgcHJvdmlkZXIgYXJyYXkuXG4gKi9cbmV4cG9ydCB0eXBlIFNpbmdsZVByb3ZpZGVyID0gVHlwZVByb3ZpZGVyfFZhbHVlUHJvdmlkZXJ8Q2xhc3NQcm92aWRlcnxDb25zdHJ1Y3RvclByb3ZpZGVyfFxuICAgIEV4aXN0aW5nUHJvdmlkZXJ8RmFjdG9yeVByb3ZpZGVyfFN0YXRpY0NsYXNzUHJvdmlkZXI7XG5cbi8qKlxuICogVGhlIGxvZ2ljIHZpc2l0cyBhbiBgSW5qZWN0b3JUeXBlYCwgYW4gYEluamVjdG9yVHlwZVdpdGhQcm92aWRlcnNgLCBvciBhIHN0YW5kYWxvbmVcbiAqIGBDb21wb25lbnRUeXBlYCwgYW5kIGFsbCBvZiBpdHMgdHJhbnNpdGl2ZSBwcm92aWRlcnMgYW5kIGNvbGxlY3RzIHByb3ZpZGVycy5cbiAqXG4gKiBJZiBhbiBgSW5qZWN0b3JUeXBlV2l0aFByb3ZpZGVyc2AgdGhhdCBkZWNsYXJlcyBwcm92aWRlcnMgYmVzaWRlcyB0aGUgdHlwZSBpcyBzcGVjaWZpZWQsXG4gKiB0aGUgZnVuY3Rpb24gd2lsbCByZXR1cm4gXCJ0cnVlXCIgdG8gaW5kaWNhdGUgdGhhdCB0aGUgcHJvdmlkZXJzIG9mIHRoZSB0eXBlIGRlZmluaXRpb24gbmVlZFxuICogdG8gYmUgcHJvY2Vzc2VkLiBUaGlzIGFsbG93cyB1cyB0byBwcm9jZXNzIHByb3ZpZGVycyBvZiBpbmplY3RvciB0eXBlcyBhZnRlciBhbGwgaW1wb3J0cyBvZlxuICogYW4gaW5qZWN0b3IgZGVmaW5pdGlvbiBhcmUgcHJvY2Vzc2VkLiAoZm9sbG93aW5nIFZpZXcgRW5naW5lIHNlbWFudGljczogc2VlIEZXLTEzNDkpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB3YWxrUHJvdmlkZXJUcmVlKFxuICAgIGNvbnRhaW5lcjogVHlwZTx1bmtub3duPnxJbmplY3RvclR5cGVXaXRoUHJvdmlkZXJzPHVua25vd24+LCBwcm92aWRlcnNPdXQ6IFNpbmdsZVByb3ZpZGVyW10sXG4gICAgcGFyZW50czogVHlwZTx1bmtub3duPltdLFxuICAgIGRlZHVwOiBTZXQ8VHlwZTx1bmtub3duPj4pOiBjb250YWluZXIgaXMgSW5qZWN0b3JUeXBlV2l0aFByb3ZpZGVyczx1bmtub3duPiB7XG4gIGNvbnRhaW5lciA9IHJlc29sdmVGb3J3YXJkUmVmKGNvbnRhaW5lcik7XG4gIGlmICghY29udGFpbmVyKSByZXR1cm4gZmFsc2U7XG5cbiAgLy8gVGhlIGFjdHVhbCB0eXBlIHdoaWNoIGhhZCB0aGUgZGVmaW5pdGlvbi4gVXN1YWxseSBgY29udGFpbmVyYCwgYnV0IG1heSBiZSBhbiB1bndyYXBwZWQgdHlwZVxuICAvLyBmcm9tIGBJbmplY3RvclR5cGVXaXRoUHJvdmlkZXJzYC5cbiAgbGV0IGRlZlR5cGU6IFR5cGU8dW5rbm93bj58bnVsbCA9IG51bGw7XG5cbiAgbGV0IGluakRlZiA9IGdldEluamVjdG9yRGVmKGNvbnRhaW5lcik7XG4gIGNvbnN0IGNtcERlZiA9ICFpbmpEZWYgJiYgZ2V0Q29tcG9uZW50RGVmKGNvbnRhaW5lcik7XG4gIGlmICghaW5qRGVmICYmICFjbXBEZWYpIHtcbiAgICAvLyBgY29udGFpbmVyYCBpcyBub3QgYW4gaW5qZWN0b3IgdHlwZSBvciBhIGNvbXBvbmVudCB0eXBlLiBJdCBtaWdodCBiZTpcbiAgICAvLyAgKiBBbiBgSW5qZWN0b3JUeXBlV2l0aFByb3ZpZGVyc2AgdGhhdCB3cmFwcyBhbiBpbmplY3RvciB0eXBlLlxuICAgIC8vICAqIEEgc3RhbmRhbG9uZSBkaXJlY3RpdmUgb3IgcGlwZSB0aGF0IGdvdCBwdWxsZWQgaW4gZnJvbSBhIHN0YW5kYWxvbmUgY29tcG9uZW50J3NcbiAgICAvLyAgICBkZXBlbmRlbmNpZXMuXG4gICAgLy8gVHJ5IHRvIHVud3JhcCBpdCBhcyBhbiBgSW5qZWN0b3JUeXBlV2l0aFByb3ZpZGVyc2AgZmlyc3QuXG4gICAgY29uc3QgbmdNb2R1bGU6IFR5cGU8dW5rbm93bj58dW5kZWZpbmVkID1cbiAgICAgICAgKGNvbnRhaW5lciBhcyBJbmplY3RvclR5cGVXaXRoUHJvdmlkZXJzPGFueT4pLm5nTW9kdWxlIGFzIFR5cGU8dW5rbm93bj58IHVuZGVmaW5lZDtcbiAgICBpbmpEZWYgPSBnZXRJbmplY3RvckRlZihuZ01vZHVsZSk7XG4gICAgaWYgKGluakRlZikge1xuICAgICAgZGVmVHlwZSA9IG5nTW9kdWxlITtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gTm90IGEgY29tcG9uZW50IG9yIGluamVjdG9yIHR5cGUsIHNvIGlnbm9yZSBpdC5cbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH0gZWxzZSBpZiAoY21wRGVmICYmICFjbXBEZWYuc3RhbmRhbG9uZSkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfSBlbHNlIHtcbiAgICBkZWZUeXBlID0gY29udGFpbmVyIGFzIFR5cGU8dW5rbm93bj47XG4gIH1cblxuICAvLyBDaGVjayBmb3IgY2lyY3VsYXIgZGVwZW5kZW5jaWVzLlxuICBpZiAobmdEZXZNb2RlICYmIHBhcmVudHMuaW5kZXhPZihkZWZUeXBlKSAhPT0gLTEpIHtcbiAgICBjb25zdCBkZWZOYW1lID0gc3RyaW5naWZ5KGRlZlR5cGUpO1xuICAgIGNvbnN0IHBhdGggPSBwYXJlbnRzLm1hcChzdHJpbmdpZnkpO1xuICAgIHRocm93Q3ljbGljRGVwZW5kZW5jeUVycm9yKGRlZk5hbWUsIHBhdGgpO1xuICB9XG5cbiAgLy8gQ2hlY2sgZm9yIG11bHRpcGxlIGltcG9ydHMgb2YgdGhlIHNhbWUgbW9kdWxlXG4gIGNvbnN0IGlzRHVwbGljYXRlID0gZGVkdXAuaGFzKGRlZlR5cGUpO1xuXG4gIGlmIChjbXBEZWYpIHtcbiAgICBpZiAoaXNEdXBsaWNhdGUpIHtcbiAgICAgIC8vIFRoaXMgY29tcG9uZW50IGRlZmluaXRpb24gaGFzIGFscmVhZHkgYmVlbiBwcm9jZXNzZWQuXG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGRlZHVwLmFkZChkZWZUeXBlKTtcblxuICAgIGlmIChjbXBEZWYuZGVwZW5kZW5jaWVzKSB7XG4gICAgICBjb25zdCBkZXBzID1cbiAgICAgICAgICB0eXBlb2YgY21wRGVmLmRlcGVuZGVuY2llcyA9PT0gJ2Z1bmN0aW9uJyA/IGNtcERlZi5kZXBlbmRlbmNpZXMoKSA6IGNtcERlZi5kZXBlbmRlbmNpZXM7XG4gICAgICBmb3IgKGNvbnN0IGRlcCBvZiBkZXBzKSB7XG4gICAgICAgIHdhbGtQcm92aWRlclRyZWUoZGVwLCBwcm92aWRlcnNPdXQsIHBhcmVudHMsIGRlZHVwKTtcbiAgICAgIH1cbiAgICB9XG4gIH0gZWxzZSBpZiAoaW5qRGVmKSB7XG4gICAgLy8gRmlyc3QsIGluY2x1ZGUgcHJvdmlkZXJzIGZyb20gYW55IGltcG9ydHMuXG4gICAgaWYgKGluakRlZi5pbXBvcnRzICE9IG51bGwgJiYgIWlzRHVwbGljYXRlKSB7XG4gICAgICAvLyBCZWZvcmUgcHJvY2Vzc2luZyBkZWZUeXBlJ3MgaW1wb3J0cywgYWRkIGl0IHRvIHRoZSBzZXQgb2YgcGFyZW50cy4gVGhpcyB3YXksIGlmIGl0IGVuZHNcbiAgICAgIC8vIHVwIGRlZXBseSBpbXBvcnRpbmcgaXRzZWxmLCB0aGlzIGNhbiBiZSBkZXRlY3RlZC5cbiAgICAgIG5nRGV2TW9kZSAmJiBwYXJlbnRzLnB1c2goZGVmVHlwZSk7XG4gICAgICAvLyBBZGQgaXQgdG8gdGhlIHNldCBvZiBkZWR1cHMuIFRoaXMgd2F5IHdlIGNhbiBkZXRlY3QgbXVsdGlwbGUgaW1wb3J0cyBvZiB0aGUgc2FtZSBtb2R1bGVcbiAgICAgIGRlZHVwLmFkZChkZWZUeXBlKTtcblxuICAgICAgbGV0IGltcG9ydFR5cGVzV2l0aFByb3ZpZGVyczogKEluamVjdG9yVHlwZVdpdGhQcm92aWRlcnM8YW55PltdKXx1bmRlZmluZWQ7XG4gICAgICB0cnkge1xuICAgICAgICBkZWVwRm9yRWFjaChpbmpEZWYuaW1wb3J0cywgaW1wb3J0ZWQgPT4ge1xuICAgICAgICAgIGlmICh3YWxrUHJvdmlkZXJUcmVlKGltcG9ydGVkLCBwcm92aWRlcnNPdXQsIHBhcmVudHMsIGRlZHVwKSkge1xuICAgICAgICAgICAgaW1wb3J0VHlwZXNXaXRoUHJvdmlkZXJzIHx8PSBbXTtcbiAgICAgICAgICAgIC8vIElmIHRoZSBwcm9jZXNzZWQgaW1wb3J0IGlzIGFuIGluamVjdG9yIHR5cGUgd2l0aCBwcm92aWRlcnMsIHdlIHN0b3JlIGl0IGluIHRoZVxuICAgICAgICAgICAgLy8gbGlzdCBvZiBpbXBvcnQgdHlwZXMgd2l0aCBwcm92aWRlcnMsIHNvIHRoYXQgd2UgY2FuIHByb2Nlc3MgdGhvc2UgYWZ0ZXJ3YXJkcy5cbiAgICAgICAgICAgIGltcG9ydFR5cGVzV2l0aFByb3ZpZGVycy5wdXNoKGltcG9ydGVkKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgLy8gUmVtb3ZlIGl0IGZyb20gdGhlIHBhcmVudHMgc2V0IHdoZW4gZmluaXNoZWQuXG4gICAgICAgIG5nRGV2TW9kZSAmJiBwYXJlbnRzLnBvcCgpO1xuICAgICAgfVxuXG4gICAgICAvLyBJbXBvcnRzIHdoaWNoIGFyZSBkZWNsYXJlZCB3aXRoIHByb3ZpZGVycyAoVHlwZVdpdGhQcm92aWRlcnMpIG5lZWQgdG8gYmUgcHJvY2Vzc2VkXG4gICAgICAvLyBhZnRlciBhbGwgaW1wb3J0ZWQgbW9kdWxlcyBhcmUgcHJvY2Vzc2VkLiBUaGlzIGlzIHNpbWlsYXIgdG8gaG93IFZpZXcgRW5naW5lXG4gICAgICAvLyBwcm9jZXNzZXMvbWVyZ2VzIG1vZHVsZSBpbXBvcnRzIGluIHRoZSBtZXRhZGF0YSByZXNvbHZlci4gU2VlOiBGVy0xMzQ5LlxuICAgICAgaWYgKGltcG9ydFR5cGVzV2l0aFByb3ZpZGVycyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHByb2Nlc3NJbmplY3RvclR5cGVzV2l0aFByb3ZpZGVycyhpbXBvcnRUeXBlc1dpdGhQcm92aWRlcnMsIHByb3ZpZGVyc091dCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKCFpc0R1cGxpY2F0ZSkge1xuICAgICAgLy8gVHJhY2sgdGhlIEluamVjdG9yVHlwZSBhbmQgYWRkIGEgcHJvdmlkZXIgZm9yIGl0LlxuICAgICAgLy8gSXQncyBpbXBvcnRhbnQgdGhhdCB0aGlzIGlzIGRvbmUgYWZ0ZXIgdGhlIGRlZidzIGltcG9ydHMuXG4gICAgICBjb25zdCBmYWN0b3J5ID0gZ2V0RmFjdG9yeURlZihkZWZUeXBlKSB8fCAoKCkgPT4gbmV3IGRlZlR5cGUhKCkpO1xuXG4gICAgICAvLyBBcHBlbmQgZXh0cmEgcHJvdmlkZXJzIHRvIG1ha2UgbW9yZSBpbmZvIGF2YWlsYWJsZSBmb3IgY29uc3VtZXJzICh0byByZXRyaWV2ZSBhbiBpbmplY3RvclxuICAgICAgLy8gdHlwZSksIGFzIHdlbGwgYXMgaW50ZXJuYWxseSAodG8gY2FsY3VsYXRlIGFuIGluamVjdGlvbiBzY29wZSBjb3JyZWN0bHkgYW5kIGVhZ2VybHlcbiAgICAgIC8vIGluc3RhbnRpYXRlIGEgYGRlZlR5cGVgIHdoZW4gYW4gaW5qZWN0b3IgaXMgY3JlYXRlZCkuXG4gICAgICBwcm92aWRlcnNPdXQucHVzaChcbiAgICAgICAgICAvLyBQcm92aWRlciB0byBjcmVhdGUgYGRlZlR5cGVgIHVzaW5nIGl0cyBmYWN0b3J5LlxuICAgICAgICAgIHtwcm92aWRlOiBkZWZUeXBlLCB1c2VGYWN0b3J5OiBmYWN0b3J5LCBkZXBzOiBFTVBUWV9BUlJBWX0sXG5cbiAgICAgICAgICAvLyBNYWtlIHRoaXMgYGRlZlR5cGVgIGF2YWlsYWJsZSB0byBhbiBpbnRlcm5hbCBsb2dpYyB0aGF0IGNhbGN1bGF0ZXMgaW5qZWN0b3Igc2NvcGUuXG4gICAgICAgICAge3Byb3ZpZGU6IElOSkVDVE9SX0RFRl9UWVBFUywgdXNlVmFsdWU6IGRlZlR5cGUsIG11bHRpOiB0cnVlfSxcblxuICAgICAgICAgIC8vIFByb3ZpZGVyIHRvIGVhZ2VybHkgaW5zdGFudGlhdGUgYGRlZlR5cGVgIHZpYSBgRU5WSVJPTk1FTlRfSU5JVElBTElaRVJgLlxuICAgICAgICAgIHtwcm92aWRlOiBFTlZJUk9OTUVOVF9JTklUSUFMSVpFUiwgdXNlVmFsdWU6ICgpID0+IGluamVjdChkZWZUeXBlISksIG11bHRpOiB0cnVlfSAgLy9cbiAgICAgICk7XG4gICAgfVxuXG4gICAgLy8gTmV4dCwgaW5jbHVkZSBwcm92aWRlcnMgbGlzdGVkIG9uIHRoZSBkZWZpbml0aW9uIGl0c2VsZi5cbiAgICBjb25zdCBkZWZQcm92aWRlcnMgPSBpbmpEZWYucHJvdmlkZXJzO1xuICAgIGlmIChkZWZQcm92aWRlcnMgIT0gbnVsbCAmJiAhaXNEdXBsaWNhdGUpIHtcbiAgICAgIGNvbnN0IGluamVjdG9yVHlwZSA9IGNvbnRhaW5lciBhcyBJbmplY3RvclR5cGU8YW55PjtcbiAgICAgIGRlZXBGb3JFYWNoKGRlZlByb3ZpZGVycywgcHJvdmlkZXIgPT4ge1xuICAgICAgICBuZ0Rldk1vZGUgJiYgdmFsaWRhdGVQcm92aWRlcihwcm92aWRlciwgZGVmUHJvdmlkZXJzIGFzIFNpbmdsZVByb3ZpZGVyW10sIGluamVjdG9yVHlwZSk7XG4gICAgICAgIHByb3ZpZGVyc091dC5wdXNoKHByb3ZpZGVyKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICAvLyBTaG91bGQgbm90IGhhcHBlbiwgYnV0IGp1c3QgaW4gY2FzZS5cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICByZXR1cm4gKFxuICAgICAgZGVmVHlwZSAhPT0gY29udGFpbmVyICYmXG4gICAgICAoY29udGFpbmVyIGFzIEluamVjdG9yVHlwZVdpdGhQcm92aWRlcnM8YW55PikucHJvdmlkZXJzICE9PSB1bmRlZmluZWQpO1xufVxuXG5mdW5jdGlvbiB2YWxpZGF0ZVByb3ZpZGVyKFxuICAgIHByb3ZpZGVyOiBTaW5nbGVQcm92aWRlciwgcHJvdmlkZXJzOiBTaW5nbGVQcm92aWRlcltdLCBjb250YWluZXJUeXBlOiBUeXBlPHVua25vd24+KTogdm9pZCB7XG4gIGlmIChpc1R5cGVQcm92aWRlcihwcm92aWRlcikgfHwgaXNWYWx1ZVByb3ZpZGVyKHByb3ZpZGVyKSB8fCBpc0ZhY3RvcnlQcm92aWRlcihwcm92aWRlcikgfHxcbiAgICAgIGlzRXhpc3RpbmdQcm92aWRlcihwcm92aWRlcikpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICAvLyBIZXJlIHdlIGV4cGVjdCB0aGUgcHJvdmlkZXIgdG8gYmUgYSBgdXNlQ2xhc3NgIHByb3ZpZGVyIChieSBlbGltaW5hdGlvbikuXG4gIGNvbnN0IGNsYXNzUmVmID0gcmVzb2x2ZUZvcndhcmRSZWYoXG4gICAgICBwcm92aWRlciAmJiAoKHByb3ZpZGVyIGFzIFN0YXRpY0NsYXNzUHJvdmlkZXIgfCBDbGFzc1Byb3ZpZGVyKS51c2VDbGFzcyB8fCBwcm92aWRlci5wcm92aWRlKSk7XG4gIGlmICghY2xhc3NSZWYpIHtcbiAgICB0aHJvd0ludmFsaWRQcm92aWRlckVycm9yKGNvbnRhaW5lclR5cGUsIHByb3ZpZGVycywgcHJvdmlkZXIpO1xuICB9XG59XG5cbmV4cG9ydCBjb25zdCBVU0VfVkFMVUUgPVxuICAgIGdldENsb3N1cmVTYWZlUHJvcGVydHk8VmFsdWVQcm92aWRlcj4oe3Byb3ZpZGU6IFN0cmluZywgdXNlVmFsdWU6IGdldENsb3N1cmVTYWZlUHJvcGVydHl9KTtcblxuZXhwb3J0IGZ1bmN0aW9uIGlzVmFsdWVQcm92aWRlcih2YWx1ZTogU2luZ2xlUHJvdmlkZXIpOiB2YWx1ZSBpcyBWYWx1ZVByb3ZpZGVyIHtcbiAgcmV0dXJuIHZhbHVlICE9PSBudWxsICYmIHR5cGVvZiB2YWx1ZSA9PSAnb2JqZWN0JyAmJiBVU0VfVkFMVUUgaW4gdmFsdWU7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0V4aXN0aW5nUHJvdmlkZXIodmFsdWU6IFNpbmdsZVByb3ZpZGVyKTogdmFsdWUgaXMgRXhpc3RpbmdQcm92aWRlciB7XG4gIHJldHVybiAhISh2YWx1ZSAmJiAodmFsdWUgYXMgRXhpc3RpbmdQcm92aWRlcikudXNlRXhpc3RpbmcpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNGYWN0b3J5UHJvdmlkZXIodmFsdWU6IFNpbmdsZVByb3ZpZGVyKTogdmFsdWUgaXMgRmFjdG9yeVByb3ZpZGVyIHtcbiAgcmV0dXJuICEhKHZhbHVlICYmICh2YWx1ZSBhcyBGYWN0b3J5UHJvdmlkZXIpLnVzZUZhY3RvcnkpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNUeXBlUHJvdmlkZXIodmFsdWU6IFNpbmdsZVByb3ZpZGVyKTogdmFsdWUgaXMgVHlwZVByb3ZpZGVyIHtcbiAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PT0gJ2Z1bmN0aW9uJztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzQ2xhc3NQcm92aWRlcih2YWx1ZTogU2luZ2xlUHJvdmlkZXIpOiB2YWx1ZSBpcyBDbGFzc1Byb3ZpZGVyIHtcbiAgcmV0dXJuICEhKHZhbHVlIGFzIFN0YXRpY0NsYXNzUHJvdmlkZXIgfCBDbGFzc1Byb3ZpZGVyKS51c2VDbGFzcztcbn1cbiJdfQ==