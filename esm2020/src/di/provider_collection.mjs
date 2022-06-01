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
 * @developerPreview
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvdmlkZXJfY29sbGVjdGlvbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL2RpL3Byb3ZpZGVyX2NvbGxlY3Rpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLFlBQVksRUFBbUIsTUFBTSxXQUFXLENBQUM7QUFFekQsT0FBTyxFQUFDLGVBQWUsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQ3RELE9BQU8sRUFBQyxhQUFhLEVBQUMsTUFBTSwrQkFBK0IsQ0FBQztBQUM1RCxPQUFPLEVBQUMsMEJBQTBCLEVBQUUseUJBQXlCLEVBQUMsTUFBTSxzQkFBc0IsQ0FBQztBQUMzRixPQUFPLEVBQUMsaUJBQWlCLEVBQUMsTUFBTSxpQ0FBaUMsQ0FBQztBQUNsRSxPQUFPLEVBQUMsV0FBVyxFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFDaEQsT0FBTyxFQUFDLHNCQUFzQixFQUFDLE1BQU0sa0JBQWtCLENBQUM7QUFDeEQsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQzVDLE9BQU8sRUFBQyxXQUFXLEVBQUMsTUFBTSxTQUFTLENBQUM7QUFFcEMsT0FBTyxFQUFDLGlCQUFpQixFQUFDLE1BQU0sZUFBZSxDQUFDO0FBQ2hELE9BQU8sRUFBQyx1QkFBdUIsRUFBQyxNQUFNLHFCQUFxQixDQUFDO0FBQzVELE9BQU8sRUFBQyxRQUFRLElBQUksTUFBTSxFQUFDLE1BQU0sMEJBQTBCLENBQUM7QUFDNUQsT0FBTyxFQUFDLGNBQWMsRUFBMEMsTUFBTSxrQkFBa0IsQ0FBQztBQUV6RixPQUFPLEVBQUMsa0JBQWtCLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQVVyRDs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztHQXdDRztBQUNILE1BQU0sVUFBVSxtQkFBbUIsQ0FBQyxHQUFHLE9BQWdDO0lB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QUFFO1FBQ2hDLE9BQU87S0FDUjtJQUVELDRFQUE0RTtJQUM1RSxNQUFNLFFBQVEsR0FBRyxpQkFBaUIsQ0FDOUIsUUFBUSxJQUFJLENBQUUsUUFBZ0QsQ0FBQyxRQUFRLElBQUksUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7SUFDbEcsSUFBSSxDQUFDLFFBQVEsRUFBRTtRQUNiLHlCQUF5QixDQUFDLGFBQWEsRUFBRSxTQUFTLEVBQUUsUUFBUSxDQUFDLENBQUM7S0FDL0Q7QUFDSCxDQUFDO0FBRUQsTUFBTSxDQUFDLE1BQU0sU0FBUyxHQUNsQixzQkFBc0IsQ0FBZ0IsRUFBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLFFBQVEsRUFBRSxzQkFBc0IsRUFBQyxDQUFDLENBQUM7QUFFL0YsTUFBTSxVQUFVLGVBQWUsQ0FBQyxLQUFxQjtJQUNuRCxPQUFPLEtBQUssS0FBSyxJQUFJLElBQUksT0FBTyxLQUFLLElBQUksUUFBUSxJQUFJLFNBQVMsSUFBSSxLQUFLLENBQUM7QUFDMUUsQ0FBQztBQUVELE1BQU0sVUFBVSxrQkFBa0IsQ0FBQyxLQUFxQjtJQUN0RCxPQUFPLENBQUMsQ0FBQyxDQUFDLEtBQUssSUFBSyxLQUEwQixDQUFDLFdBQVcsQ0FBQyxDQUFDO0FBQzlELENBQUM7QUFFRCxNQUFNLFVBQVUsaUJBQWlCLENBQUMsS0FBcUI7SUFDckQsT0FBTyxDQUFDLENBQUMsQ0FBQyxLQUFLLElBQUssS0FBeUIsQ0FBQyxVQUFVLENBQUMsQ0FBQztBQUM1RCxDQUFDO0FBRUQsTUFBTSxVQUFVLGNBQWMsQ0FBQyxLQUFxQjtJQUNsRCxPQUFPLE9BQU8sS0FBSyxLQUFLLFVBQVUsQ0FBQztBQUNyQyxDQUFDO0FBRUQsTUFBTSxVQUFVLGVBQWUsQ0FBQyxLQUFxQjtJQUNuRCxPQUFPLENBQUMsQ0FBRSxLQUE2QyxDQUFDLFFBQVEsQ0FBQztBQUNuRSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7UnVudGltZUVycm9yLCBSdW50aW1lRXJyb3JDb2RlfSBmcm9tICcuLi9lcnJvcnMnO1xuaW1wb3J0IHtUeXBlfSBmcm9tICcuLi9pbnRlcmZhY2UvdHlwZSc7XG5pbXBvcnQge2dldENvbXBvbmVudERlZn0gZnJvbSAnLi4vcmVuZGVyMy9kZWZpbml0aW9uJztcbmltcG9ydCB7Z2V0RmFjdG9yeURlZn0gZnJvbSAnLi4vcmVuZGVyMy9kZWZpbml0aW9uX2ZhY3RvcnknO1xuaW1wb3J0IHt0aHJvd0N5Y2xpY0RlcGVuZGVuY3lFcnJvciwgdGhyb3dJbnZhbGlkUHJvdmlkZXJFcnJvcn0gZnJvbSAnLi4vcmVuZGVyMy9lcnJvcnNfZGknO1xuaW1wb3J0IHtzdHJpbmdpZnlGb3JFcnJvcn0gZnJvbSAnLi4vcmVuZGVyMy91dGlsL3N0cmluZ2lmeV91dGlscyc7XG5pbXBvcnQge2RlZXBGb3JFYWNofSBmcm9tICcuLi91dGlsL2FycmF5X3V0aWxzJztcbmltcG9ydCB7Z2V0Q2xvc3VyZVNhZmVQcm9wZXJ0eX0gZnJvbSAnLi4vdXRpbC9wcm9wZXJ0eSc7XG5pbXBvcnQge3N0cmluZ2lmeX0gZnJvbSAnLi4vdXRpbC9zdHJpbmdpZnknO1xuaW1wb3J0IHtFTVBUWV9BUlJBWX0gZnJvbSAnLi4vdmlldyc7XG5cbmltcG9ydCB7cmVzb2x2ZUZvcndhcmRSZWZ9IGZyb20gJy4vZm9yd2FyZF9yZWYnO1xuaW1wb3J0IHtFTlZJUk9OTUVOVF9JTklUSUFMSVpFUn0gZnJvbSAnLi9pbml0aWFsaXplcl90b2tlbic7XG5pbXBvcnQge8m1ybVpbmplY3QgYXMgaW5qZWN0fSBmcm9tICcuL2luamVjdG9yX2NvbXBhdGliaWxpdHknO1xuaW1wb3J0IHtnZXRJbmplY3RvckRlZiwgSW5qZWN0b3JUeXBlLCBJbmplY3RvclR5cGVXaXRoUHJvdmlkZXJzfSBmcm9tICcuL2ludGVyZmFjZS9kZWZzJztcbmltcG9ydCB7Q2xhc3NQcm92aWRlciwgQ29uc3RydWN0b3JQcm92aWRlciwgRXhpc3RpbmdQcm92aWRlciwgRmFjdG9yeVByb3ZpZGVyLCBJbXBvcnRlZE5nTW9kdWxlUHJvdmlkZXJzLCBNb2R1bGVXaXRoUHJvdmlkZXJzLCBQcm92aWRlciwgU3RhdGljQ2xhc3NQcm92aWRlciwgVHlwZVByb3ZpZGVyLCBWYWx1ZVByb3ZpZGVyfSBmcm9tICcuL2ludGVyZmFjZS9wcm92aWRlcic7XG5pbXBvcnQge0lOSkVDVE9SX0RFRl9UWVBFU30gZnJvbSAnLi9pbnRlcm5hbF90b2tlbnMnO1xuXG4vKipcbiAqIEEgc291cmNlIG9mIHByb3ZpZGVycyBmb3IgdGhlIGBpbXBvcnRQcm92aWRlcnNGcm9tYCBmdW5jdGlvbi5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCB0eXBlIEltcG9ydFByb3ZpZGVyc1NvdXJjZSA9XG4gICAgVHlwZTx1bmtub3duPnxNb2R1bGVXaXRoUHJvdmlkZXJzPHVua25vd24+fEFycmF5PEltcG9ydFByb3ZpZGVyc1NvdXJjZT47XG5cbi8qKlxuICogQ29sbGVjdHMgcHJvdmlkZXJzIGZyb20gYWxsIE5nTW9kdWxlcyBhbmQgc3RhbmRhbG9uZSBjb21wb25lbnRzLCBpbmNsdWRpbmcgdHJhbnNpdGl2ZWx5IGltcG9ydGVkXG4gKiBvbmVzLlxuICpcbiAqIFByb3ZpZGVycyBleHRyYWN0ZWQgdmlhIGBpbXBvcnRQcm92aWRlcnNGcm9tYCBhcmUgb25seSB1c2FibGUgaW4gYW4gYXBwbGljYXRpb24gaW5qZWN0b3Igb3JcbiAqIGFub3RoZXIgZW52aXJvbm1lbnQgaW5qZWN0b3IgKHN1Y2ggYXMgYSByb3V0ZSBpbmplY3RvcikuIFRoZXkgc2hvdWxkIG5vdCBiZSB1c2VkIGluIGNvbXBvbmVudFxuICogcHJvdmlkZXJzLlxuICpcbiAqIE1vcmUgaW5mb3JtYXRpb24gYWJvdXQgc3RhbmRhbG9uZSBjb21wb25lbnRzIGNhbiBiZSBmb3VuZCBpbiBbdGhpc1xuICogZ3VpZGVdKGd1aWRlL3N0YW5kYWxvbmUtY29tcG9uZW50cykuXG4gKlxuICogQHVzYWdlTm90ZXNcbiAqIFRoZSByZXN1bHRzIG9mIHRoZSBgaW1wb3J0UHJvdmlkZXJzRnJvbWAgY2FsbCBjYW4gYmUgdXNlZCBpbiB0aGUgYGJvb3RzdHJhcEFwcGxpY2F0aW9uYCBjYWxsOlxuICpcbiAqIGBgYHR5cGVzY3JpcHRcbiAqIGF3YWl0IGJvb3RzdHJhcEFwcGxpY2F0aW9uKFJvb3RDb21wb25lbnQsIHtcbiAqICAgcHJvdmlkZXJzOiBbXG4gKiAgICAgaW1wb3J0UHJvdmlkZXJzRnJvbShOZ01vZHVsZU9uZSwgTmdNb2R1bGVUd28pXG4gKiAgIF1cbiAqIH0pO1xuICogYGBgXG4gKlxuICogWW91IGNhbiBhbHNvIHVzZSB0aGUgYGltcG9ydFByb3ZpZGVyc0Zyb21gIHJlc3VsdHMgaW4gdGhlIGBwcm92aWRlcnNgIGZpZWxkIG9mIGEgcm91dGUsIHdoZW4gYVxuICogc3RhbmRhbG9uZSBjb21wb25lbnQgaXMgdXNlZDpcbiAqXG4gKiBgYGB0eXBlc2NyaXB0XG4gKiBleHBvcnQgY29uc3QgUk9VVEVTOiBSb3V0ZVtdID0gW1xuICogICB7XG4gKiAgICAgcGF0aDogJ2ZvbycsXG4gKiAgICAgcHJvdmlkZXJzOiBbXG4gKiAgICAgICBpbXBvcnRQcm92aWRlcnNGcm9tKE5nTW9kdWxlT25lLCBOZ01vZHVsZVR3bylcbiAqICAgICBdLFxuICogICAgIGNvbXBvbmVudDogWW91clN0YW5kYWxvbmVDb21wb25lbnRcbiAqICAgfVxuICogXTtcbiAqIGBgYFxuICpcbiAqIEByZXR1cm5zIENvbGxlY3RlZCBwcm92aWRlcnMgZnJvbSB0aGUgc3BlY2lmaWVkIGxpc3Qgb2YgdHlwZXMuXG4gKiBAcHVibGljQXBpXG4gKiBAZGV2ZWxvcGVyUHJldmlld1xuICovXG5leHBvcnQgZnVuY3Rpb24gaW1wb3J0UHJvdmlkZXJzRnJvbSguLi5zb3VyY2VzOiBJbXBvcnRQcm92aWRlcnNTb3VyY2VbXSk6XG4gICAgSW1wb3J0ZWROZ01vZHVsZVByb3ZpZGVycyB7XG4gIHJldHVybiB7ybVwcm92aWRlcnM6IGludGVybmFsSW1wb3J0UHJvdmlkZXJzRnJvbSh0cnVlLCBzb3VyY2VzKX07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpbnRlcm5hbEltcG9ydFByb3ZpZGVyc0Zyb20oXG4gICAgY2hlY2tGb3JTdGFuZGFsb25lQ21wOiBib29sZWFuLCAuLi5zb3VyY2VzOiBJbXBvcnRQcm92aWRlcnNTb3VyY2VbXSk6IFByb3ZpZGVyW10ge1xuICBjb25zdCBwcm92aWRlcnNPdXQ6IFNpbmdsZVByb3ZpZGVyW10gPSBbXTtcbiAgY29uc3QgZGVkdXAgPSBuZXcgU2V0PFR5cGU8dW5rbm93bj4+KCk7ICAvLyBhbHJlYWR5IHNlZW4gdHlwZXNcbiAgbGV0IGluamVjdG9yVHlwZXNXaXRoUHJvdmlkZXJzOiBJbmplY3RvclR5cGVXaXRoUHJvdmlkZXJzPHVua25vd24+W118dW5kZWZpbmVkO1xuICBkZWVwRm9yRWFjaChzb3VyY2VzLCBzb3VyY2UgPT4ge1xuICAgIGlmICgodHlwZW9mIG5nRGV2TW9kZSA9PT0gJ3VuZGVmaW5lZCcgfHwgbmdEZXZNb2RlKSAmJiBjaGVja0ZvclN0YW5kYWxvbmVDbXApIHtcbiAgICAgIGNvbnN0IGNtcERlZiA9IGdldENvbXBvbmVudERlZihzb3VyY2UpO1xuICAgICAgaWYgKGNtcERlZj8uc3RhbmRhbG9uZSkge1xuICAgICAgICB0aHJvdyBuZXcgUnVudGltZUVycm9yKFxuICAgICAgICAgICAgUnVudGltZUVycm9yQ29kZS5JTVBPUlRfUFJPVklERVJTX0ZST01fU1RBTkRBTE9ORSxcbiAgICAgICAgICAgIGBJbXBvcnRpbmcgcHJvdmlkZXJzIHN1cHBvcnRzIE5nTW9kdWxlIG9yIE1vZHVsZVdpdGhQcm92aWRlcnMgYnV0IGdvdCBhIHN0YW5kYWxvbmUgY29tcG9uZW50IFwiJHtcbiAgICAgICAgICAgICAgICBzdHJpbmdpZnlGb3JFcnJvcihzb3VyY2UpfVwiYCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gTmFycm93IGBzb3VyY2VgIHRvIGFjY2VzcyB0aGUgaW50ZXJuYWwgdHlwZSBhbmFsb2d1ZSBmb3IgYE1vZHVsZVdpdGhQcm92aWRlcnNgLlxuICAgIGNvbnN0IGludGVybmFsU291cmNlID0gc291cmNlIGFzIFR5cGU8dW5rbm93bj58IEluamVjdG9yVHlwZVdpdGhQcm92aWRlcnM8dW5rbm93bj47XG4gICAgaWYgKHdhbGtQcm92aWRlclRyZWUoaW50ZXJuYWxTb3VyY2UsIHByb3ZpZGVyc091dCwgW10sIGRlZHVwKSkge1xuICAgICAgaW5qZWN0b3JUeXBlc1dpdGhQcm92aWRlcnMgfHw9IFtdO1xuICAgICAgaW5qZWN0b3JUeXBlc1dpdGhQcm92aWRlcnMucHVzaChpbnRlcm5hbFNvdXJjZSk7XG4gICAgfVxuICB9KTtcbiAgLy8gQ29sbGVjdCBhbGwgcHJvdmlkZXJzIGZyb20gYE1vZHVsZVdpdGhQcm92aWRlcnNgIHR5cGVzLlxuICBpZiAoaW5qZWN0b3JUeXBlc1dpdGhQcm92aWRlcnMgIT09IHVuZGVmaW5lZCkge1xuICAgIHByb2Nlc3NJbmplY3RvclR5cGVzV2l0aFByb3ZpZGVycyhpbmplY3RvclR5cGVzV2l0aFByb3ZpZGVycywgcHJvdmlkZXJzT3V0KTtcbiAgfVxuXG4gIHJldHVybiBwcm92aWRlcnNPdXQ7XG59XG5cbi8qKlxuICogQ29sbGVjdHMgYWxsIHByb3ZpZGVycyBmcm9tIHRoZSBsaXN0IG9mIGBNb2R1bGVXaXRoUHJvdmlkZXJzYCBhbmQgYXBwZW5kcyB0aGVtIHRvIHRoZSBwcm92aWRlZFxuICogYXJyYXkuXG4gKi9cbmZ1bmN0aW9uIHByb2Nlc3NJbmplY3RvclR5cGVzV2l0aFByb3ZpZGVycyhcbiAgICB0eXBlc1dpdGhQcm92aWRlcnM6IEluamVjdG9yVHlwZVdpdGhQcm92aWRlcnM8dW5rbm93bj5bXSwgcHJvdmlkZXJzT3V0OiBQcm92aWRlcltdKTogdm9pZCB7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgdHlwZXNXaXRoUHJvdmlkZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3Qge25nTW9kdWxlLCBwcm92aWRlcnN9ID0gdHlwZXNXaXRoUHJvdmlkZXJzW2ldO1xuICAgIGRlZXBGb3JFYWNoKHByb3ZpZGVycyEsIHByb3ZpZGVyID0+IHtcbiAgICAgIG5nRGV2TW9kZSAmJiB2YWxpZGF0ZVByb3ZpZGVyKHByb3ZpZGVyLCBwcm92aWRlcnMgfHwgRU1QVFlfQVJSQVksIG5nTW9kdWxlKTtcbiAgICAgIHByb3ZpZGVyc091dC5wdXNoKHByb3ZpZGVyKTtcbiAgICB9KTtcbiAgfVxufVxuXG4vKipcbiAqIEludGVybmFsIHR5cGUgZm9yIGEgc2luZ2xlIHByb3ZpZGVyIGluIGEgZGVlcCBwcm92aWRlciBhcnJheS5cbiAqL1xuZXhwb3J0IHR5cGUgU2luZ2xlUHJvdmlkZXIgPSBUeXBlUHJvdmlkZXJ8VmFsdWVQcm92aWRlcnxDbGFzc1Byb3ZpZGVyfENvbnN0cnVjdG9yUHJvdmlkZXJ8XG4gICAgRXhpc3RpbmdQcm92aWRlcnxGYWN0b3J5UHJvdmlkZXJ8U3RhdGljQ2xhc3NQcm92aWRlcjtcblxuLyoqXG4gKiBUaGUgbG9naWMgdmlzaXRzIGFuIGBJbmplY3RvclR5cGVgLCBhbiBgSW5qZWN0b3JUeXBlV2l0aFByb3ZpZGVyc2AsIG9yIGEgc3RhbmRhbG9uZVxuICogYENvbXBvbmVudFR5cGVgLCBhbmQgYWxsIG9mIGl0cyB0cmFuc2l0aXZlIHByb3ZpZGVycyBhbmQgY29sbGVjdHMgcHJvdmlkZXJzLlxuICpcbiAqIElmIGFuIGBJbmplY3RvclR5cGVXaXRoUHJvdmlkZXJzYCB0aGF0IGRlY2xhcmVzIHByb3ZpZGVycyBiZXNpZGVzIHRoZSB0eXBlIGlzIHNwZWNpZmllZCxcbiAqIHRoZSBmdW5jdGlvbiB3aWxsIHJldHVybiBcInRydWVcIiB0byBpbmRpY2F0ZSB0aGF0IHRoZSBwcm92aWRlcnMgb2YgdGhlIHR5cGUgZGVmaW5pdGlvbiBuZWVkXG4gKiB0byBiZSBwcm9jZXNzZWQuIFRoaXMgYWxsb3dzIHVzIHRvIHByb2Nlc3MgcHJvdmlkZXJzIG9mIGluamVjdG9yIHR5cGVzIGFmdGVyIGFsbCBpbXBvcnRzIG9mXG4gKiBhbiBpbmplY3RvciBkZWZpbml0aW9uIGFyZSBwcm9jZXNzZWQuIChmb2xsb3dpbmcgVmlldyBFbmdpbmUgc2VtYW50aWNzOiBzZWUgRlctMTM0OSlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHdhbGtQcm92aWRlclRyZWUoXG4gICAgY29udGFpbmVyOiBUeXBlPHVua25vd24+fEluamVjdG9yVHlwZVdpdGhQcm92aWRlcnM8dW5rbm93bj4sIHByb3ZpZGVyc091dDogU2luZ2xlUHJvdmlkZXJbXSxcbiAgICBwYXJlbnRzOiBUeXBlPHVua25vd24+W10sXG4gICAgZGVkdXA6IFNldDxUeXBlPHVua25vd24+Pik6IGNvbnRhaW5lciBpcyBJbmplY3RvclR5cGVXaXRoUHJvdmlkZXJzPHVua25vd24+IHtcbiAgY29udGFpbmVyID0gcmVzb2x2ZUZvcndhcmRSZWYoY29udGFpbmVyKTtcbiAgaWYgKCFjb250YWluZXIpIHJldHVybiBmYWxzZTtcblxuICAvLyBUaGUgYWN0dWFsIHR5cGUgd2hpY2ggaGFkIHRoZSBkZWZpbml0aW9uLiBVc3VhbGx5IGBjb250YWluZXJgLCBidXQgbWF5IGJlIGFuIHVud3JhcHBlZCB0eXBlXG4gIC8vIGZyb20gYEluamVjdG9yVHlwZVdpdGhQcm92aWRlcnNgLlxuICBsZXQgZGVmVHlwZTogVHlwZTx1bmtub3duPnxudWxsID0gbnVsbDtcblxuICBsZXQgaW5qRGVmID0gZ2V0SW5qZWN0b3JEZWYoY29udGFpbmVyKTtcbiAgY29uc3QgY21wRGVmID0gIWluakRlZiAmJiBnZXRDb21wb25lbnREZWYoY29udGFpbmVyKTtcbiAgaWYgKCFpbmpEZWYgJiYgIWNtcERlZikge1xuICAgIC8vIGBjb250YWluZXJgIGlzIG5vdCBhbiBpbmplY3RvciB0eXBlIG9yIGEgY29tcG9uZW50IHR5cGUuIEl0IG1pZ2h0IGJlOlxuICAgIC8vICAqIEFuIGBJbmplY3RvclR5cGVXaXRoUHJvdmlkZXJzYCB0aGF0IHdyYXBzIGFuIGluamVjdG9yIHR5cGUuXG4gICAgLy8gICogQSBzdGFuZGFsb25lIGRpcmVjdGl2ZSBvciBwaXBlIHRoYXQgZ290IHB1bGxlZCBpbiBmcm9tIGEgc3RhbmRhbG9uZSBjb21wb25lbnQnc1xuICAgIC8vICAgIGRlcGVuZGVuY2llcy5cbiAgICAvLyBUcnkgdG8gdW53cmFwIGl0IGFzIGFuIGBJbmplY3RvclR5cGVXaXRoUHJvdmlkZXJzYCBmaXJzdC5cbiAgICBjb25zdCBuZ01vZHVsZTogVHlwZTx1bmtub3duPnx1bmRlZmluZWQgPVxuICAgICAgICAoY29udGFpbmVyIGFzIEluamVjdG9yVHlwZVdpdGhQcm92aWRlcnM8YW55PikubmdNb2R1bGUgYXMgVHlwZTx1bmtub3duPnwgdW5kZWZpbmVkO1xuICAgIGluakRlZiA9IGdldEluamVjdG9yRGVmKG5nTW9kdWxlKTtcbiAgICBpZiAoaW5qRGVmKSB7XG4gICAgICBkZWZUeXBlID0gbmdNb2R1bGUhO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBOb3QgYSBjb21wb25lbnQgb3IgaW5qZWN0b3IgdHlwZSwgc28gaWdub3JlIGl0LlxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfSBlbHNlIGlmIChjbXBEZWYgJiYgIWNtcERlZi5zdGFuZGFsb25lKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9IGVsc2Uge1xuICAgIGRlZlR5cGUgPSBjb250YWluZXIgYXMgVHlwZTx1bmtub3duPjtcbiAgfVxuXG4gIC8vIENoZWNrIGZvciBjaXJjdWxhciBkZXBlbmRlbmNpZXMuXG4gIGlmIChuZ0Rldk1vZGUgJiYgcGFyZW50cy5pbmRleE9mKGRlZlR5cGUpICE9PSAtMSkge1xuICAgIGNvbnN0IGRlZk5hbWUgPSBzdHJpbmdpZnkoZGVmVHlwZSk7XG4gICAgY29uc3QgcGF0aCA9IHBhcmVudHMubWFwKHN0cmluZ2lmeSk7XG4gICAgdGhyb3dDeWNsaWNEZXBlbmRlbmN5RXJyb3IoZGVmTmFtZSwgcGF0aCk7XG4gIH1cblxuICAvLyBDaGVjayBmb3IgbXVsdGlwbGUgaW1wb3J0cyBvZiB0aGUgc2FtZSBtb2R1bGVcbiAgY29uc3QgaXNEdXBsaWNhdGUgPSBkZWR1cC5oYXMoZGVmVHlwZSk7XG5cbiAgaWYgKGNtcERlZikge1xuICAgIGlmIChpc0R1cGxpY2F0ZSkge1xuICAgICAgLy8gVGhpcyBjb21wb25lbnQgZGVmaW5pdGlvbiBoYXMgYWxyZWFkeSBiZWVuIHByb2Nlc3NlZC5cbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgZGVkdXAuYWRkKGRlZlR5cGUpO1xuXG4gICAgaWYgKGNtcERlZi5kZXBlbmRlbmNpZXMpIHtcbiAgICAgIGNvbnN0IGRlcHMgPVxuICAgICAgICAgIHR5cGVvZiBjbXBEZWYuZGVwZW5kZW5jaWVzID09PSAnZnVuY3Rpb24nID8gY21wRGVmLmRlcGVuZGVuY2llcygpIDogY21wRGVmLmRlcGVuZGVuY2llcztcbiAgICAgIGZvciAoY29uc3QgZGVwIG9mIGRlcHMpIHtcbiAgICAgICAgd2Fsa1Byb3ZpZGVyVHJlZShkZXAsIHByb3ZpZGVyc091dCwgcGFyZW50cywgZGVkdXApO1xuICAgICAgfVxuICAgIH1cbiAgfSBlbHNlIGlmIChpbmpEZWYpIHtcbiAgICAvLyBGaXJzdCwgaW5jbHVkZSBwcm92aWRlcnMgZnJvbSBhbnkgaW1wb3J0cy5cbiAgICBpZiAoaW5qRGVmLmltcG9ydHMgIT0gbnVsbCAmJiAhaXNEdXBsaWNhdGUpIHtcbiAgICAgIC8vIEJlZm9yZSBwcm9jZXNzaW5nIGRlZlR5cGUncyBpbXBvcnRzLCBhZGQgaXQgdG8gdGhlIHNldCBvZiBwYXJlbnRzLiBUaGlzIHdheSwgaWYgaXQgZW5kc1xuICAgICAgLy8gdXAgZGVlcGx5IGltcG9ydGluZyBpdHNlbGYsIHRoaXMgY2FuIGJlIGRldGVjdGVkLlxuICAgICAgbmdEZXZNb2RlICYmIHBhcmVudHMucHVzaChkZWZUeXBlKTtcbiAgICAgIC8vIEFkZCBpdCB0byB0aGUgc2V0IG9mIGRlZHVwcy4gVGhpcyB3YXkgd2UgY2FuIGRldGVjdCBtdWx0aXBsZSBpbXBvcnRzIG9mIHRoZSBzYW1lIG1vZHVsZVxuICAgICAgZGVkdXAuYWRkKGRlZlR5cGUpO1xuXG4gICAgICBsZXQgaW1wb3J0VHlwZXNXaXRoUHJvdmlkZXJzOiAoSW5qZWN0b3JUeXBlV2l0aFByb3ZpZGVyczxhbnk+W10pfHVuZGVmaW5lZDtcbiAgICAgIHRyeSB7XG4gICAgICAgIGRlZXBGb3JFYWNoKGluakRlZi5pbXBvcnRzLCBpbXBvcnRlZCA9PiB7XG4gICAgICAgICAgaWYgKHdhbGtQcm92aWRlclRyZWUoaW1wb3J0ZWQsIHByb3ZpZGVyc091dCwgcGFyZW50cywgZGVkdXApKSB7XG4gICAgICAgICAgICBpbXBvcnRUeXBlc1dpdGhQcm92aWRlcnMgfHw9IFtdO1xuICAgICAgICAgICAgLy8gSWYgdGhlIHByb2Nlc3NlZCBpbXBvcnQgaXMgYW4gaW5qZWN0b3IgdHlwZSB3aXRoIHByb3ZpZGVycywgd2Ugc3RvcmUgaXQgaW4gdGhlXG4gICAgICAgICAgICAvLyBsaXN0IG9mIGltcG9ydCB0eXBlcyB3aXRoIHByb3ZpZGVycywgc28gdGhhdCB3ZSBjYW4gcHJvY2VzcyB0aG9zZSBhZnRlcndhcmRzLlxuICAgICAgICAgICAgaW1wb3J0VHlwZXNXaXRoUHJvdmlkZXJzLnB1c2goaW1wb3J0ZWQpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9IGZpbmFsbHkge1xuICAgICAgICAvLyBSZW1vdmUgaXQgZnJvbSB0aGUgcGFyZW50cyBzZXQgd2hlbiBmaW5pc2hlZC5cbiAgICAgICAgbmdEZXZNb2RlICYmIHBhcmVudHMucG9wKCk7XG4gICAgICB9XG5cbiAgICAgIC8vIEltcG9ydHMgd2hpY2ggYXJlIGRlY2xhcmVkIHdpdGggcHJvdmlkZXJzIChUeXBlV2l0aFByb3ZpZGVycykgbmVlZCB0byBiZSBwcm9jZXNzZWRcbiAgICAgIC8vIGFmdGVyIGFsbCBpbXBvcnRlZCBtb2R1bGVzIGFyZSBwcm9jZXNzZWQuIFRoaXMgaXMgc2ltaWxhciB0byBob3cgVmlldyBFbmdpbmVcbiAgICAgIC8vIHByb2Nlc3Nlcy9tZXJnZXMgbW9kdWxlIGltcG9ydHMgaW4gdGhlIG1ldGFkYXRhIHJlc29sdmVyLiBTZWU6IEZXLTEzNDkuXG4gICAgICBpZiAoaW1wb3J0VHlwZXNXaXRoUHJvdmlkZXJzICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcHJvY2Vzc0luamVjdG9yVHlwZXNXaXRoUHJvdmlkZXJzKGltcG9ydFR5cGVzV2l0aFByb3ZpZGVycywgcHJvdmlkZXJzT3V0KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoIWlzRHVwbGljYXRlKSB7XG4gICAgICAvLyBUcmFjayB0aGUgSW5qZWN0b3JUeXBlIGFuZCBhZGQgYSBwcm92aWRlciBmb3IgaXQuXG4gICAgICAvLyBJdCdzIGltcG9ydGFudCB0aGF0IHRoaXMgaXMgZG9uZSBhZnRlciB0aGUgZGVmJ3MgaW1wb3J0cy5cbiAgICAgIGNvbnN0IGZhY3RvcnkgPSBnZXRGYWN0b3J5RGVmKGRlZlR5cGUpIHx8ICgoKSA9PiBuZXcgZGVmVHlwZSEoKSk7XG5cbiAgICAgIC8vIEFwcGVuZCBleHRyYSBwcm92aWRlcnMgdG8gbWFrZSBtb3JlIGluZm8gYXZhaWxhYmxlIGZvciBjb25zdW1lcnMgKHRvIHJldHJpZXZlIGFuIGluamVjdG9yXG4gICAgICAvLyB0eXBlKSwgYXMgd2VsbCBhcyBpbnRlcm5hbGx5ICh0byBjYWxjdWxhdGUgYW4gaW5qZWN0aW9uIHNjb3BlIGNvcnJlY3RseSBhbmQgZWFnZXJseVxuICAgICAgLy8gaW5zdGFudGlhdGUgYSBgZGVmVHlwZWAgd2hlbiBhbiBpbmplY3RvciBpcyBjcmVhdGVkKS5cbiAgICAgIHByb3ZpZGVyc091dC5wdXNoKFxuICAgICAgICAgIC8vIFByb3ZpZGVyIHRvIGNyZWF0ZSBgZGVmVHlwZWAgdXNpbmcgaXRzIGZhY3RvcnkuXG4gICAgICAgICAge3Byb3ZpZGU6IGRlZlR5cGUsIHVzZUZhY3Rvcnk6IGZhY3RvcnksIGRlcHM6IEVNUFRZX0FSUkFZfSxcblxuICAgICAgICAgIC8vIE1ha2UgdGhpcyBgZGVmVHlwZWAgYXZhaWxhYmxlIHRvIGFuIGludGVybmFsIGxvZ2ljIHRoYXQgY2FsY3VsYXRlcyBpbmplY3RvciBzY29wZS5cbiAgICAgICAgICB7cHJvdmlkZTogSU5KRUNUT1JfREVGX1RZUEVTLCB1c2VWYWx1ZTogZGVmVHlwZSwgbXVsdGk6IHRydWV9LFxuXG4gICAgICAgICAgLy8gUHJvdmlkZXIgdG8gZWFnZXJseSBpbnN0YW50aWF0ZSBgZGVmVHlwZWAgdmlhIGBFTlZJUk9OTUVOVF9JTklUSUFMSVpFUmAuXG4gICAgICAgICAge3Byb3ZpZGU6IEVOVklST05NRU5UX0lOSVRJQUxJWkVSLCB1c2VWYWx1ZTogKCkgPT4gaW5qZWN0KGRlZlR5cGUhKSwgbXVsdGk6IHRydWV9ICAvL1xuICAgICAgKTtcbiAgICB9XG5cbiAgICAvLyBOZXh0LCBpbmNsdWRlIHByb3ZpZGVycyBsaXN0ZWQgb24gdGhlIGRlZmluaXRpb24gaXRzZWxmLlxuICAgIGNvbnN0IGRlZlByb3ZpZGVycyA9IGluakRlZi5wcm92aWRlcnM7XG4gICAgaWYgKGRlZlByb3ZpZGVycyAhPSBudWxsICYmICFpc0R1cGxpY2F0ZSkge1xuICAgICAgY29uc3QgaW5qZWN0b3JUeXBlID0gY29udGFpbmVyIGFzIEluamVjdG9yVHlwZTxhbnk+O1xuICAgICAgZGVlcEZvckVhY2goZGVmUHJvdmlkZXJzLCBwcm92aWRlciA9PiB7XG4gICAgICAgIG5nRGV2TW9kZSAmJiB2YWxpZGF0ZVByb3ZpZGVyKHByb3ZpZGVyLCBkZWZQcm92aWRlcnMgYXMgU2luZ2xlUHJvdmlkZXJbXSwgaW5qZWN0b3JUeXBlKTtcbiAgICAgICAgcHJvdmlkZXJzT3V0LnB1c2gocHJvdmlkZXIpO1xuICAgICAgfSk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIC8vIFNob3VsZCBub3QgaGFwcGVuLCBidXQganVzdCBpbiBjYXNlLlxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIHJldHVybiAoXG4gICAgICBkZWZUeXBlICE9PSBjb250YWluZXIgJiZcbiAgICAgIChjb250YWluZXIgYXMgSW5qZWN0b3JUeXBlV2l0aFByb3ZpZGVyczxhbnk+KS5wcm92aWRlcnMgIT09IHVuZGVmaW5lZCk7XG59XG5cbmZ1bmN0aW9uIHZhbGlkYXRlUHJvdmlkZXIoXG4gICAgcHJvdmlkZXI6IFNpbmdsZVByb3ZpZGVyLCBwcm92aWRlcnM6IFNpbmdsZVByb3ZpZGVyW10sIGNvbnRhaW5lclR5cGU6IFR5cGU8dW5rbm93bj4pOiB2b2lkIHtcbiAgaWYgKGlzVHlwZVByb3ZpZGVyKHByb3ZpZGVyKSB8fCBpc1ZhbHVlUHJvdmlkZXIocHJvdmlkZXIpIHx8IGlzRmFjdG9yeVByb3ZpZGVyKHByb3ZpZGVyKSB8fFxuICAgICAgaXNFeGlzdGluZ1Byb3ZpZGVyKHByb3ZpZGVyKSkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIC8vIEhlcmUgd2UgZXhwZWN0IHRoZSBwcm92aWRlciB0byBiZSBhIGB1c2VDbGFzc2AgcHJvdmlkZXIgKGJ5IGVsaW1pbmF0aW9uKS5cbiAgY29uc3QgY2xhc3NSZWYgPSByZXNvbHZlRm9yd2FyZFJlZihcbiAgICAgIHByb3ZpZGVyICYmICgocHJvdmlkZXIgYXMgU3RhdGljQ2xhc3NQcm92aWRlciB8IENsYXNzUHJvdmlkZXIpLnVzZUNsYXNzIHx8IHByb3ZpZGVyLnByb3ZpZGUpKTtcbiAgaWYgKCFjbGFzc1JlZikge1xuICAgIHRocm93SW52YWxpZFByb3ZpZGVyRXJyb3IoY29udGFpbmVyVHlwZSwgcHJvdmlkZXJzLCBwcm92aWRlcik7XG4gIH1cbn1cblxuZXhwb3J0IGNvbnN0IFVTRV9WQUxVRSA9XG4gICAgZ2V0Q2xvc3VyZVNhZmVQcm9wZXJ0eTxWYWx1ZVByb3ZpZGVyPih7cHJvdmlkZTogU3RyaW5nLCB1c2VWYWx1ZTogZ2V0Q2xvc3VyZVNhZmVQcm9wZXJ0eX0pO1xuXG5leHBvcnQgZnVuY3Rpb24gaXNWYWx1ZVByb3ZpZGVyKHZhbHVlOiBTaW5nbGVQcm92aWRlcik6IHZhbHVlIGlzIFZhbHVlUHJvdmlkZXIge1xuICByZXR1cm4gdmFsdWUgIT09IG51bGwgJiYgdHlwZW9mIHZhbHVlID09ICdvYmplY3QnICYmIFVTRV9WQUxVRSBpbiB2YWx1ZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzRXhpc3RpbmdQcm92aWRlcih2YWx1ZTogU2luZ2xlUHJvdmlkZXIpOiB2YWx1ZSBpcyBFeGlzdGluZ1Byb3ZpZGVyIHtcbiAgcmV0dXJuICEhKHZhbHVlICYmICh2YWx1ZSBhcyBFeGlzdGluZ1Byb3ZpZGVyKS51c2VFeGlzdGluZyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0ZhY3RvcnlQcm92aWRlcih2YWx1ZTogU2luZ2xlUHJvdmlkZXIpOiB2YWx1ZSBpcyBGYWN0b3J5UHJvdmlkZXIge1xuICByZXR1cm4gISEodmFsdWUgJiYgKHZhbHVlIGFzIEZhY3RvcnlQcm92aWRlcikudXNlRmFjdG9yeSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc1R5cGVQcm92aWRlcih2YWx1ZTogU2luZ2xlUHJvdmlkZXIpOiB2YWx1ZSBpcyBUeXBlUHJvdmlkZXIge1xuICByZXR1cm4gdHlwZW9mIHZhbHVlID09PSAnZnVuY3Rpb24nO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNDbGFzc1Byb3ZpZGVyKHZhbHVlOiBTaW5nbGVQcm92aWRlcik6IHZhbHVlIGlzIENsYXNzUHJvdmlkZXIge1xuICByZXR1cm4gISEodmFsdWUgYXMgU3RhdGljQ2xhc3NQcm92aWRlciB8IENsYXNzUHJvdmlkZXIpLnVzZUNsYXNzO1xufVxuIl19