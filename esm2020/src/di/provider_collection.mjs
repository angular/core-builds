/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { getComponentDef } from '../render3/definition';
import { getFactoryDef } from '../render3/definition_factory';
import { throwCyclicDependencyError, throwInvalidProviderError } from '../render3/errors_di';
import { deepForEach } from '../util/array_utils';
import { getClosureSafeProperty } from '../util/property';
import { stringify } from '../util/stringify';
import { EMPTY_ARRAY } from '../view';
import { resolveForwardRef } from './forward_ref';
import { INJECTOR_INITIALIZER } from './initializer_token';
import { ɵɵinject as inject } from './injector_compatibility';
import { getInjectorDef } from './interface/defs';
import { INJECTOR_DEF_TYPES } from './internal_tokens';
/**
 * Collects providers from all NgModules and standalone components, including transitively imported
 * ones.
 *
 * @returns The list of collected providers from the specified list of types.
 * @publicApi
 */
export function importProvidersFrom(...types) {
    const providers = [];
    deepForEach(types, type => walkProviderTree(type, providers, [], new Set()));
    return providers;
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
                        if (importTypesWithProviders === undefined)
                            importTypesWithProviders = [];
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
                for (let i = 0; i < importTypesWithProviders.length; i++) {
                    const { ngModule, providers } = importTypesWithProviders[i];
                    deepForEach(providers, provider => {
                        validateProvider(provider, providers || EMPTY_ARRAY, ngModule);
                        providersOut.push(provider);
                    });
                }
            }
        }
        // Track the InjectorType and add a provider for it.
        // It's important that this is done after the def's imports.
        const factory = getFactoryDef(defType) || (() => new defType());
        // Provider to create `defType` using its factory.
        providersOut.push({
            provide: defType,
            useFactory: factory,
            deps: EMPTY_ARRAY,
        });
        providersOut.push({
            provide: INJECTOR_DEF_TYPES,
            useValue: defType,
            multi: true,
        });
        // Provider to eagerly instantiate `defType` via `INJECTOR_INITIALIZER`.
        providersOut.push({
            provide: INJECTOR_INITIALIZER,
            useValue: () => inject(defType),
            multi: true,
        });
        // Next, include providers listed on the definition itself.
        const defProviders = injDef.providers;
        if (defProviders != null && !isDuplicate) {
            const injectorType = container;
            deepForEach(defProviders, provider => {
                // TODO: fix cast
                validateProvider(provider, defProviders, injectorType);
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
    if (ngDevMode && !classRef) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvdmlkZXJfY29sbGVjdGlvbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL2RpL3Byb3ZpZGVyX2NvbGxlY3Rpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBR0gsT0FBTyxFQUFDLGVBQWUsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQ3RELE9BQU8sRUFBQyxhQUFhLEVBQUMsTUFBTSwrQkFBK0IsQ0FBQztBQUM1RCxPQUFPLEVBQUMsMEJBQTBCLEVBQUUseUJBQXlCLEVBQUMsTUFBTSxzQkFBc0IsQ0FBQztBQUMzRixPQUFPLEVBQUMsV0FBVyxFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFDaEQsT0FBTyxFQUFDLHNCQUFzQixFQUFDLE1BQU0sa0JBQWtCLENBQUM7QUFDeEQsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQzVDLE9BQU8sRUFBQyxXQUFXLEVBQUMsTUFBTSxTQUFTLENBQUM7QUFFcEMsT0FBTyxFQUFDLGlCQUFpQixFQUFDLE1BQU0sZUFBZSxDQUFDO0FBQ2hELE9BQU8sRUFBQyxvQkFBb0IsRUFBQyxNQUFNLHFCQUFxQixDQUFDO0FBQ3pELE9BQU8sRUFBQyxRQUFRLElBQUksTUFBTSxFQUFDLE1BQU0sMEJBQTBCLENBQUM7QUFDNUQsT0FBTyxFQUFDLGNBQWMsRUFBMEMsTUFBTSxrQkFBa0IsQ0FBQztBQUV6RixPQUFPLEVBQUMsa0JBQWtCLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUVyRDs7Ozs7O0dBTUc7QUFDSCxNQUFNLFVBQVUsbUJBQW1CLENBQUMsR0FBRyxLQUEyQjtJQUNoRSxNQUFNLFNBQVMsR0FBcUIsRUFBRSxDQUFDO0lBQ3ZDLFdBQVcsQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLEVBQUUsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLEVBQUUsU0FBUyxFQUFFLEVBQUUsRUFBRSxJQUFJ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Q1I7SUFFRCw0RUFBNEU7SUFDNUUsTUFBTSxRQUFRLEdBQUcsaUJBQWlCLENBQzlCLFFBQVEsSUFBSSxDQUFFLFFBQWdELENBQUMsUUFBUSxJQUFJLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO0lBQ2xHLElBQUksU0FBUyxJQUFJLENBQUMsUUFBUSxFQUFFO1FBQzFCLHlCQUF5QixDQUFDLGFBQWEsRUFBRSxTQUFTLEVBQUUsUUFBUSxDQUFDLENBQUM7S0FDL0Q7QUFDSCxDQUFDO0FBRUQsTUFBTSxDQUFDLE1BQU0sU0FBUyxHQUNsQixzQkFBc0IsQ0FBZ0IsRUFBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLFFBQVEsRUFBRSxzQkFBc0IsRUFBQyxDQUFDLENBQUM7QUFFL0YsTUFBTSxVQUFVLGVBQWUsQ0FBQyxLQUFxQjtJQUNuRCxPQUFPLEtBQUssS0FBSyxJQUFJLElBQUksT0FBTyxLQUFLLElBQUksUUFBUSxJQUFJLFNBQVMsSUFBSSxLQUFLLENBQUM7QUFDMUUsQ0FBQztBQUVELE1BQU0sVUFBVSxrQkFBa0IsQ0FBQyxLQUFxQjtJQUN0RCxPQUFPLENBQUMsQ0FBQyxDQUFDLEtBQUssSUFBSyxLQUEwQixDQUFDLFdBQVcsQ0FBQyxDQUFDO0FBQzlELENBQUM7QUFFRCxNQUFNLFVBQVUsaUJBQWlCLENBQUMsS0FBcUI7SUFDckQsT0FBTyxDQUFDLENBQUMsQ0FBQyxLQUFLLElBQUssS0FBeUIsQ0FBQyxVQUFVLENBQUMsQ0FBQztBQUM1RCxDQUFDO0FBRUQsTUFBTSxVQUFVLGNBQWMsQ0FBQyxLQUFxQjtJQUNsRCxPQUFPLE9BQU8sS0FBSyxLQUFLLFVBQVUsQ0FBQztBQUNyQyxDQUFDO0FBRUQsTUFBTSxVQUFVLGVBQWUsQ0FBQyxLQUFxQjtJQUNuRCxPQUFPLENBQUMsQ0FBRSxLQUE2QyxDQUFDLFFBQVEsQ0FBQztBQUNuRSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7VHlwZX0gZnJvbSAnLi4vaW50ZXJmYWNlL3R5cGUnO1xuaW1wb3J0IHtnZXRDb21wb25lbnREZWZ9IGZyb20gJy4uL3JlbmRlcjMvZGVmaW5pdGlvbic7XG5pbXBvcnQge2dldEZhY3RvcnlEZWZ9IGZyb20gJy4uL3JlbmRlcjMvZGVmaW5pdGlvbl9mYWN0b3J5JztcbmltcG9ydCB7dGhyb3dDeWNsaWNEZXBlbmRlbmN5RXJyb3IsIHRocm93SW52YWxpZFByb3ZpZGVyRXJyb3J9IGZyb20gJy4uL3JlbmRlcjMvZXJyb3JzX2RpJztcbmltcG9ydCB7ZGVlcEZvckVhY2h9IGZyb20gJy4uL3V0aWwvYXJyYXlfdXRpbHMnO1xuaW1wb3J0IHtnZXRDbG9zdXJlU2FmZVByb3BlcnR5fSBmcm9tICcuLi91dGlsL3Byb3BlcnR5JztcbmltcG9ydCB7c3RyaW5naWZ5fSBmcm9tICcuLi91dGlsL3N0cmluZ2lmeSc7XG5pbXBvcnQge0VNUFRZX0FSUkFZfSBmcm9tICcuLi92aWV3JztcblxuaW1wb3J0IHtyZXNvbHZlRm9yd2FyZFJlZn0gZnJvbSAnLi9mb3J3YXJkX3JlZic7XG5pbXBvcnQge0lOSkVDVE9SX0lOSVRJQUxJWkVSfSBmcm9tICcuL2luaXRpYWxpemVyX3Rva2VuJztcbmltcG9ydCB7ybXJtWluamVjdCBhcyBpbmplY3R9IGZyb20gJy4vaW5qZWN0b3JfY29tcGF0aWJpbGl0eSc7XG5pbXBvcnQge2dldEluamVjdG9yRGVmLCBJbmplY3RvclR5cGUsIEluamVjdG9yVHlwZVdpdGhQcm92aWRlcnN9IGZyb20gJy4vaW50ZXJmYWNlL2RlZnMnO1xuaW1wb3J0IHtDbGFzc1Byb3ZpZGVyLCBDb25zdHJ1Y3RvclByb3ZpZGVyLCBFeGlzdGluZ1Byb3ZpZGVyLCBGYWN0b3J5UHJvdmlkZXIsIFByb3ZpZGVyLCBTdGF0aWNDbGFzc1Byb3ZpZGVyLCBUeXBlUHJvdmlkZXIsIFZhbHVlUHJvdmlkZXJ9IGZyb20gJy4vaW50ZXJmYWNlL3Byb3ZpZGVyJztcbmltcG9ydCB7SU5KRUNUT1JfREVGX1RZUEVTfSBmcm9tICcuL2ludGVybmFsX3Rva2Vucyc7XG5cbi8qKlxuICogQ29sbGVjdHMgcHJvdmlkZXJzIGZyb20gYWxsIE5nTW9kdWxlcyBhbmQgc3RhbmRhbG9uZSBjb21wb25lbnRzLCBpbmNsdWRpbmcgdHJhbnNpdGl2ZWx5IGltcG9ydGVkXG4gKiBvbmVzLlxuICpcbiAqIEByZXR1cm5zIFRoZSBsaXN0IG9mIGNvbGxlY3RlZCBwcm92aWRlcnMgZnJvbSB0aGUgc3BlY2lmaWVkIGxpc3Qgb2YgdHlwZXMuXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbXBvcnRQcm92aWRlcnNGcm9tKC4uLnR5cGVzOiBBcnJheTxUeXBlPHVua25vd24+Pik6IFByb3ZpZGVyW10ge1xuICBjb25zdCBwcm92aWRlcnM6IFNpbmdsZVByb3ZpZGVyW10gPSBbXTtcbiAgZGVlcEZvckVhY2godHlwZXMsIHR5cGUgPT4gd2Fsa1Byb3ZpZGVyVHJlZSh0eXBlLCBwcm92aWRlcnMsIFtdLCBuZXcgU2V0KCkpKTtcbiAgcmV0dXJuIHByb3ZpZGVycztcbn1cblxuLyoqXG4gKiBJbnRlcm5hbCB0eXBlIGZvciBhIHNpbmdsZSBwcm92aWRlciBpbiBhIGRlZXAgcHJvdmlkZXIgYXJyYXkuXG4gKi9cbmV4cG9ydCB0eXBlIFNpbmdsZVByb3ZpZGVyID0gVHlwZVByb3ZpZGVyfFZhbHVlUHJvdmlkZXJ8Q2xhc3NQcm92aWRlcnxDb25zdHJ1Y3RvclByb3ZpZGVyfFxuICAgIEV4aXN0aW5nUHJvdmlkZXJ8RmFjdG9yeVByb3ZpZGVyfFN0YXRpY0NsYXNzUHJvdmlkZXI7XG5cbi8qKlxuICogVGhlIGxvZ2ljIHZpc2l0cyBhbiBgSW5qZWN0b3JUeXBlYCwgYW4gYEluamVjdG9yVHlwZVdpdGhQcm92aWRlcnNgLCBvciBhIHN0YW5kYWxvbmVcbiAqIGBDb21wb25lbnRUeXBlYCwgYW5kIGFsbCBvZiBpdHMgdHJhbnNpdGl2ZSBwcm92aWRlcnMgYW5kIGNvbGxlY3RzIHByb3ZpZGVycy5cbiAqXG4gKiBJZiBhbiBgSW5qZWN0b3JUeXBlV2l0aFByb3ZpZGVyc2AgdGhhdCBkZWNsYXJlcyBwcm92aWRlcnMgYmVzaWRlcyB0aGUgdHlwZSBpcyBzcGVjaWZpZWQsXG4gKiB0aGUgZnVuY3Rpb24gd2lsbCByZXR1cm4gXCJ0cnVlXCIgdG8gaW5kaWNhdGUgdGhhdCB0aGUgcHJvdmlkZXJzIG9mIHRoZSB0eXBlIGRlZmluaXRpb24gbmVlZFxuICogdG8gYmUgcHJvY2Vzc2VkLiBUaGlzIGFsbG93cyB1cyB0byBwcm9jZXNzIHByb3ZpZGVycyBvZiBpbmplY3RvciB0eXBlcyBhZnRlciBhbGwgaW1wb3J0cyBvZlxuICogYW4gaW5qZWN0b3IgZGVmaW5pdGlvbiBhcmUgcHJvY2Vzc2VkLiAoZm9sbG93aW5nIFZpZXcgRW5naW5lIHNlbWFudGljczogc2VlIEZXLTEzNDkpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB3YWxrUHJvdmlkZXJUcmVlKFxuICAgIGNvbnRhaW5lcjogVHlwZTx1bmtub3duPnxJbmplY3RvclR5cGVXaXRoUHJvdmlkZXJzPHVua25vd24+LCBwcm92aWRlcnNPdXQ6IFNpbmdsZVByb3ZpZGVyW10sXG4gICAgcGFyZW50czogVHlwZTx1bmtub3duPltdLFxuICAgIGRlZHVwOiBTZXQ8VHlwZTx1bmtub3duPj4pOiBjb250YWluZXIgaXMgSW5qZWN0b3JUeXBlV2l0aFByb3ZpZGVyczx1bmtub3duPiB7XG4gIGNvbnRhaW5lciA9IHJlc29sdmVGb3J3YXJkUmVmKGNvbnRhaW5lcik7XG4gIGlmICghY29udGFpbmVyKSByZXR1cm4gZmFsc2U7XG5cbiAgLy8gVGhlIGFjdHVhbCB0eXBlIHdoaWNoIGhhZCB0aGUgZGVmaW5pdGlvbi4gVXN1YWxseSBgY29udGFpbmVyYCwgYnV0IG1heSBiZSBhbiB1bndyYXBwZWQgdHlwZVxuICAvLyBmcm9tIGBJbmplY3RvclR5cGVXaXRoUHJvdmlkZXJzYC5cbiAgbGV0IGRlZlR5cGU6IFR5cGU8dW5rbm93bj58bnVsbCA9IG51bGw7XG5cbiAgbGV0IGluakRlZiA9IGdldEluamVjdG9yRGVmKGNvbnRhaW5lcik7XG4gIGNvbnN0IGNtcERlZiA9ICFpbmpEZWYgJiYgZ2V0Q29tcG9uZW50RGVmKGNvbnRhaW5lcik7XG4gIGlmICghaW5qRGVmICYmICFjbXBEZWYpIHtcbiAgICAvLyBgY29udGFpbmVyYCBpcyBub3QgYW4gaW5qZWN0b3IgdHlwZSBvciBhIGNvbXBvbmVudCB0eXBlLiBJdCBtaWdodCBiZTpcbiAgICAvLyAgKiBBbiBgSW5qZWN0b3JUeXBlV2l0aFByb3ZpZGVyc2AgdGhhdCB3cmFwcyBhbiBpbmplY3RvciB0eXBlLlxuICAgIC8vICAqIEEgc3RhbmRhbG9uZSBkaXJlY3RpdmUgb3IgcGlwZSB0aGF0IGdvdCBwdWxsZWQgaW4gZnJvbSBhIHN0YW5kYWxvbmUgY29tcG9uZW50J3NcbiAgICAvLyAgICBkZXBlbmRlbmNpZXMuXG4gICAgLy8gVHJ5IHRvIHVud3JhcCBpdCBhcyBhbiBgSW5qZWN0b3JUeXBlV2l0aFByb3ZpZGVyc2AgZmlyc3QuXG4gICAgY29uc3QgbmdNb2R1bGU6IFR5cGU8dW5rbm93bj58dW5kZWZpbmVkID1cbiAgICAgICAgKGNvbnRhaW5lciBhcyBJbmplY3RvclR5cGVXaXRoUHJvdmlkZXJzPGFueT4pLm5nTW9kdWxlIGFzIFR5cGU8dW5rbm93bj58IHVuZGVmaW5lZDtcbiAgICBpbmpEZWYgPSBnZXRJbmplY3RvckRlZihuZ01vZHVsZSk7XG4gICAgaWYgKGluakRlZikge1xuICAgICAgZGVmVHlwZSA9IG5nTW9kdWxlITtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gTm90IGEgY29tcG9uZW50IG9yIGluamVjdG9yIHR5cGUsIHNvIGlnbm9yZSBpdC5cbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH0gZWxzZSBpZiAoY21wRGVmICYmICFjbXBEZWYuc3RhbmRhbG9uZSkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfSBlbHNlIHtcbiAgICBkZWZUeXBlID0gY29udGFpbmVyIGFzIFR5cGU8dW5rbm93bj47XG4gIH1cblxuICAvLyBDaGVjayBmb3IgY2lyY3VsYXIgZGVwZW5kZW5jaWVzLlxuICBpZiAobmdEZXZNb2RlICYmIHBhcmVudHMuaW5kZXhPZihkZWZUeXBlKSAhPT0gLTEpIHtcbiAgICBjb25zdCBkZWZOYW1lID0gc3RyaW5naWZ5KGRlZlR5cGUpO1xuICAgIGNvbnN0IHBhdGggPSBwYXJlbnRzLm1hcChzdHJpbmdpZnkpO1xuICAgIHRocm93Q3ljbGljRGVwZW5kZW5jeUVycm9yKGRlZk5hbWUsIHBhdGgpO1xuICB9XG5cbiAgLy8gQ2hlY2sgZm9yIG11bHRpcGxlIGltcG9ydHMgb2YgdGhlIHNhbWUgbW9kdWxlXG4gIGNvbnN0IGlzRHVwbGljYXRlID0gZGVkdXAuaGFzKGRlZlR5cGUpO1xuXG4gIGlmIChjbXBEZWYpIHtcbiAgICBpZiAoaXNEdXBsaWNhdGUpIHtcbiAgICAgIC8vIFRoaXMgY29tcG9uZW50IGRlZmluaXRpb24gaGFzIGFscmVhZHkgYmVlbiBwcm9jZXNzZWQuXG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGRlZHVwLmFkZChkZWZUeXBlKTtcblxuICAgIGlmIChjbXBEZWYuZGVwZW5kZW5jaWVzKSB7XG4gICAgICBjb25zdCBkZXBzID1cbiAgICAgICAgICB0eXBlb2YgY21wRGVmLmRlcGVuZGVuY2llcyA9PT0gJ2Z1bmN0aW9uJyA/IGNtcERlZi5kZXBlbmRlbmNpZXMoKSA6IGNtcERlZi5kZXBlbmRlbmNpZXM7XG4gICAgICBmb3IgKGNvbnN0IGRlcCBvZiBkZXBzKSB7XG4gICAgICAgIHdhbGtQcm92aWRlclRyZWUoZGVwLCBwcm92aWRlcnNPdXQsIHBhcmVudHMsIGRlZHVwKTtcbiAgICAgIH1cbiAgICB9XG4gIH0gZWxzZSBpZiAoaW5qRGVmKSB7XG4gICAgLy8gRmlyc3QsIGluY2x1ZGUgcHJvdmlkZXJzIGZyb20gYW55IGltcG9ydHMuXG4gICAgaWYgKGluakRlZi5pbXBvcnRzICE9IG51bGwgJiYgIWlzRHVwbGljYXRlKSB7XG4gICAgICAvLyBCZWZvcmUgcHJvY2Vzc2luZyBkZWZUeXBlJ3MgaW1wb3J0cywgYWRkIGl0IHRvIHRoZSBzZXQgb2YgcGFyZW50cy4gVGhpcyB3YXksIGlmIGl0IGVuZHNcbiAgICAgIC8vIHVwIGRlZXBseSBpbXBvcnRpbmcgaXRzZWxmLCB0aGlzIGNhbiBiZSBkZXRlY3RlZC5cbiAgICAgIG5nRGV2TW9kZSAmJiBwYXJlbnRzLnB1c2goZGVmVHlwZSk7XG4gICAgICAvLyBBZGQgaXQgdG8gdGhlIHNldCBvZiBkZWR1cHMuIFRoaXMgd2F5IHdlIGNhbiBkZXRlY3QgbXVsdGlwbGUgaW1wb3J0cyBvZiB0aGUgc2FtZSBtb2R1bGVcbiAgICAgIGRlZHVwLmFkZChkZWZUeXBlKTtcblxuICAgICAgbGV0IGltcG9ydFR5cGVzV2l0aFByb3ZpZGVyczogKEluamVjdG9yVHlwZVdpdGhQcm92aWRlcnM8YW55PltdKXx1bmRlZmluZWQ7XG4gICAgICB0cnkge1xuICAgICAgICBkZWVwRm9yRWFjaChpbmpEZWYuaW1wb3J0cywgaW1wb3J0ZWQgPT4ge1xuICAgICAgICAgIGlmICh3YWxrUHJvdmlkZXJUcmVlKGltcG9ydGVkLCBwcm92aWRlcnNPdXQsIHBhcmVudHMsIGRlZHVwKSkge1xuICAgICAgICAgICAgaWYgKGltcG9ydFR5cGVzV2l0aFByb3ZpZGVycyA9PT0gdW5kZWZpbmVkKSBpbXBvcnRUeXBlc1dpdGhQcm92aWRlcnMgPSBbXTtcbiAgICAgICAgICAgIC8vIElmIHRoZSBwcm9jZXNzZWQgaW1wb3J0IGlzIGFuIGluamVjdG9yIHR5cGUgd2l0aCBwcm92aWRlcnMsIHdlIHN0b3JlIGl0IGluIHRoZVxuICAgICAgICAgICAgLy8gbGlzdCBvZiBpbXBvcnQgdHlwZXMgd2l0aCBwcm92aWRlcnMsIHNvIHRoYXQgd2UgY2FuIHByb2Nlc3MgdGhvc2UgYWZ0ZXJ3YXJkcy5cbiAgICAgICAgICAgIGltcG9ydFR5cGVzV2l0aFByb3ZpZGVycy5wdXNoKGltcG9ydGVkKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgLy8gUmVtb3ZlIGl0IGZyb20gdGhlIHBhcmVudHMgc2V0IHdoZW4gZmluaXNoZWQuXG4gICAgICAgIG5nRGV2TW9kZSAmJiBwYXJlbnRzLnBvcCgpO1xuICAgICAgfVxuXG4gICAgICAvLyBJbXBvcnRzIHdoaWNoIGFyZSBkZWNsYXJlZCB3aXRoIHByb3ZpZGVycyAoVHlwZVdpdGhQcm92aWRlcnMpIG5lZWQgdG8gYmUgcHJvY2Vzc2VkXG4gICAgICAvLyBhZnRlciBhbGwgaW1wb3J0ZWQgbW9kdWxlcyBhcmUgcHJvY2Vzc2VkLiBUaGlzIGlzIHNpbWlsYXIgdG8gaG93IFZpZXcgRW5naW5lXG4gICAgICAvLyBwcm9jZXNzZXMvbWVyZ2VzIG1vZHVsZSBpbXBvcnRzIGluIHRoZSBtZXRhZGF0YSByZXNvbHZlci4gU2VlOiBGVy0xMzQ5LlxuICAgICAgaWYgKGltcG9ydFR5cGVzV2l0aFByb3ZpZGVycyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgaW1wb3J0VHlwZXNXaXRoUHJvdmlkZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgY29uc3Qge25nTW9kdWxlLCBwcm92aWRlcnN9ID0gaW1wb3J0VHlwZXNXaXRoUHJvdmlkZXJzW2ldO1xuICAgICAgICAgIGRlZXBGb3JFYWNoKHByb3ZpZGVycyEsIHByb3ZpZGVyID0+IHtcbiAgICAgICAgICAgIHZhbGlkYXRlUHJvdmlkZXIocHJvdmlkZXIsIHByb3ZpZGVycyB8fCBFTVBUWV9BUlJBWSwgbmdNb2R1bGUpO1xuICAgICAgICAgICAgcHJvdmlkZXJzT3V0LnB1c2gocHJvdmlkZXIpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIC8vIFRyYWNrIHRoZSBJbmplY3RvclR5cGUgYW5kIGFkZCBhIHByb3ZpZGVyIGZvciBpdC5cbiAgICAvLyBJdCdzIGltcG9ydGFudCB0aGF0IHRoaXMgaXMgZG9uZSBhZnRlciB0aGUgZGVmJ3MgaW1wb3J0cy5cbiAgICBjb25zdCBmYWN0b3J5ID0gZ2V0RmFjdG9yeURlZihkZWZUeXBlKSB8fCAoKCkgPT4gbmV3IGRlZlR5cGUhKCkpO1xuXG4gICAgLy8gUHJvdmlkZXIgdG8gY3JlYXRlIGBkZWZUeXBlYCB1c2luZyBpdHMgZmFjdG9yeS5cbiAgICBwcm92aWRlcnNPdXQucHVzaCh7XG4gICAgICBwcm92aWRlOiBkZWZUeXBlLFxuICAgICAgdXNlRmFjdG9yeTogZmFjdG9yeSxcbiAgICAgIGRlcHM6IEVNUFRZX0FSUkFZLFxuICAgIH0pO1xuXG4gICAgcHJvdmlkZXJzT3V0LnB1c2goe1xuICAgICAgcHJvdmlkZTogSU5KRUNUT1JfREVGX1RZUEVTLFxuICAgICAgdXNlVmFsdWU6IGRlZlR5cGUsXG4gICAgICBtdWx0aTogdHJ1ZSxcbiAgICB9KTtcblxuICAgIC8vIFByb3ZpZGVyIHRvIGVhZ2VybHkgaW5zdGFudGlhdGUgYGRlZlR5cGVgIHZpYSBgSU5KRUNUT1JfSU5JVElBTElaRVJgLlxuICAgIHByb3ZpZGVyc091dC5wdXNoKHtcbiAgICAgIHByb3ZpZGU6IElOSkVDVE9SX0lOSVRJQUxJWkVSLFxuICAgICAgdXNlVmFsdWU6ICgpID0+IGluamVjdChkZWZUeXBlISksXG4gICAgICBtdWx0aTogdHJ1ZSxcbiAgICB9KTtcblxuICAgIC8vIE5leHQsIGluY2x1ZGUgcHJvdmlkZXJzIGxpc3RlZCBvbiB0aGUgZGVmaW5pdGlvbiBpdHNlbGYuXG4gICAgY29uc3QgZGVmUHJvdmlkZXJzID0gaW5qRGVmLnByb3ZpZGVycztcbiAgICBpZiAoZGVmUHJvdmlkZXJzICE9IG51bGwgJiYgIWlzRHVwbGljYXRlKSB7XG4gICAgICBjb25zdCBpbmplY3RvclR5cGUgPSBjb250YWluZXIgYXMgSW5qZWN0b3JUeXBlPGFueT47XG4gICAgICBkZWVwRm9yRWFjaChkZWZQcm92aWRlcnMsIHByb3ZpZGVyID0+IHtcbiAgICAgICAgLy8gVE9ETzogZml4IGNhc3RcbiAgICAgICAgdmFsaWRhdGVQcm92aWRlcihwcm92aWRlciwgZGVmUHJvdmlkZXJzIGFzIGFueVtdLCBpbmplY3RvclR5cGUpO1xuICAgICAgICBwcm92aWRlcnNPdXQucHVzaChwcm92aWRlcik7XG4gICAgICB9KTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgLy8gU2hvdWxkIG5vdCBoYXBwZW4sIGJ1dCBqdXN0IGluIGNhc2UuXG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgcmV0dXJuIChcbiAgICAgIGRlZlR5cGUgIT09IGNvbnRhaW5lciAmJlxuICAgICAgKGNvbnRhaW5lciBhcyBJbmplY3RvclR5cGVXaXRoUHJvdmlkZXJzPGFueT4pLnByb3ZpZGVycyAhPT0gdW5kZWZpbmVkKTtcbn1cblxuZnVuY3Rpb24gdmFsaWRhdGVQcm92aWRlcihcbiAgICBwcm92aWRlcjogU2luZ2xlUHJvdmlkZXIsIHByb3ZpZGVyczogU2luZ2xlUHJvdmlkZXJbXSwgY29udGFpbmVyVHlwZTogVHlwZTx1bmtub3duPik6IHZvaWQge1xuICBpZiAoaXNUeXBlUHJvdmlkZXIocHJvdmlkZXIpIHx8IGlzVmFsdWVQcm92aWRlcihwcm92aWRlcikgfHwgaXNGYWN0b3J5UHJvdmlkZXIocHJvdmlkZXIpIHx8XG4gICAgICBpc0V4aXN0aW5nUHJvdmlkZXIocHJvdmlkZXIpKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgLy8gSGVyZSB3ZSBleHBlY3QgdGhlIHByb3ZpZGVyIHRvIGJlIGEgYHVzZUNsYXNzYCBwcm92aWRlciAoYnkgZWxpbWluYXRpb24pLlxuICBjb25zdCBjbGFzc1JlZiA9IHJlc29sdmVGb3J3YXJkUmVmKFxuICAgICAgcHJvdmlkZXIgJiYgKChwcm92aWRlciBhcyBTdGF0aWNDbGFzc1Byb3ZpZGVyIHwgQ2xhc3NQcm92aWRlcikudXNlQ2xhc3MgfHwgcHJvdmlkZXIucHJvdmlkZSkpO1xuICBpZiAobmdEZXZNb2RlICYmICFjbGFzc1JlZikge1xuICAgIHRocm93SW52YWxpZFByb3ZpZGVyRXJyb3IoY29udGFpbmVyVHlwZSwgcHJvdmlkZXJzLCBwcm92aWRlcik7XG4gIH1cbn1cblxuZXhwb3J0IGNvbnN0IFVTRV9WQUxVRSA9XG4gICAgZ2V0Q2xvc3VyZVNhZmVQcm9wZXJ0eTxWYWx1ZVByb3ZpZGVyPih7cHJvdmlkZTogU3RyaW5nLCB1c2VWYWx1ZTogZ2V0Q2xvc3VyZVNhZmVQcm9wZXJ0eX0pO1xuXG5leHBvcnQgZnVuY3Rpb24gaXNWYWx1ZVByb3ZpZGVyKHZhbHVlOiBTaW5nbGVQcm92aWRlcik6IHZhbHVlIGlzIFZhbHVlUHJvdmlkZXIge1xuICByZXR1cm4gdmFsdWUgIT09IG51bGwgJiYgdHlwZW9mIHZhbHVlID09ICdvYmplY3QnICYmIFVTRV9WQUxVRSBpbiB2YWx1ZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzRXhpc3RpbmdQcm92aWRlcih2YWx1ZTogU2luZ2xlUHJvdmlkZXIpOiB2YWx1ZSBpcyBFeGlzdGluZ1Byb3ZpZGVyIHtcbiAgcmV0dXJuICEhKHZhbHVlICYmICh2YWx1ZSBhcyBFeGlzdGluZ1Byb3ZpZGVyKS51c2VFeGlzdGluZyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0ZhY3RvcnlQcm92aWRlcih2YWx1ZTogU2luZ2xlUHJvdmlkZXIpOiB2YWx1ZSBpcyBGYWN0b3J5UHJvdmlkZXIge1xuICByZXR1cm4gISEodmFsdWUgJiYgKHZhbHVlIGFzIEZhY3RvcnlQcm92aWRlcikudXNlRmFjdG9yeSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc1R5cGVQcm92aWRlcih2YWx1ZTogU2luZ2xlUHJvdmlkZXIpOiB2YWx1ZSBpcyBUeXBlUHJvdmlkZXIge1xuICByZXR1cm4gdHlwZW9mIHZhbHVlID09PSAnZnVuY3Rpb24nO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNDbGFzc1Byb3ZpZGVyKHZhbHVlOiBTaW5nbGVQcm92aWRlcik6IHZhbHVlIGlzIENsYXNzUHJvdmlkZXIge1xuICByZXR1cm4gISEodmFsdWUgYXMgU3RhdGljQ2xhc3NQcm92aWRlciB8IENsYXNzUHJvdmlkZXIpLnVzZUNsYXNzO1xufVxuIl19