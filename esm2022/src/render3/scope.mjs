/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { isForwardRef, resolveForwardRef } from '../di/forward_ref';
import { flatten } from '../util/array_utils';
import { noSideEffects } from '../util/closure';
import { EMPTY_ARRAY } from '../util/empty';
import { extractDefListOrFactory, getNgModuleDef } from './definition';
import { depsTracker } from './deps_tracker/deps_tracker';
import { isModuleWithProviders } from './jit/util';
/**
 * Generated next to NgModules to monkey-patch directive and pipe references onto a component's
 * definition, when generating a direct reference in the component file would otherwise create an
 * import cycle.
 *
 * See [this explanation](https://hackmd.io/Odw80D0pR6yfsOjg_7XCJg?view) for more details.
 *
 * @codeGenApi
 */
export function ɵɵsetComponentScope(type, directives, pipes) {
    const def = type.ɵcmp;
    def.directiveDefs = extractDefListOrFactory(directives, /* pipeDef */ false);
    def.pipeDefs = extractDefListOrFactory(pipes, /* pipeDef */ true);
}
/**
 * Adds the module metadata that is necessary to compute the module's transitive scope to an
 * existing module definition.
 *
 * Scope metadata of modules is not used in production builds, so calls to this function can be
 * marked pure to tree-shake it from the bundle, allowing for all referenced declarations
 * to become eligible for tree-shaking as well.
 *
 * @codeGenApi
 */
export function ɵɵsetNgModuleScope(type, scope) {
    return noSideEffects(() => {
        const ngModuleDef = getNgModuleDef(type, true);
        ngModuleDef.declarations = convertToTypeArray(scope.declarations || EMPTY_ARRAY);
        ngModuleDef.imports = convertToTypeArray(scope.imports || EMPTY_ARRAY);
        ngModuleDef.exports = convertToTypeArray(scope.exports || EMPTY_ARRAY);
        if (scope.bootstrap) {
            // This only happens in local compilation mode.
            ngModuleDef.bootstrap = convertToTypeArray(scope.bootstrap);
        }
        depsTracker.registerNgModule(type, scope);
    });
}
function convertToTypeArray(values) {
    if (typeof values === 'function') {
        return values;
    }
    const flattenValues = flatten(values);
    if (flattenValues.some(isForwardRef)) {
        return () => flattenValues.map(resolveForwardRef).map(maybeUnwrapModuleWithProviders);
    }
    else {
        return flattenValues.map(maybeUnwrapModuleWithProviders);
    }
}
function maybeUnwrapModuleWithProviders(value) {
    return isModuleWithProviders(value) ? value.ngModule : value;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2NvcGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL3Njb3BlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBQyxZQUFZLEVBQUUsaUJBQWlCLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUVsRSxPQUFPLEVBQUMsT0FBTyxFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFDNUMsT0FBTyxFQUFDLGFBQWEsRUFBQyxNQUFNLGlCQUFpQixDQUFDO0FBQzlDLE9BQU8sRUFBQyxXQUFXLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFFMUMsT0FBTyxFQUFDLHVCQUF1QixFQUFFLGNBQWMsRUFBQyxNQUFNLGNBQWMsQ0FBQztBQUNyRSxPQUFPLEVBQUMsV0FBVyxFQUFDLE1BQU0sNkJBQTZCLENBQUM7QUFPeEQsT0FBTyxFQUFDLHFCQUFxQixFQUFDLE1BQU0sWUFBWSxDQUFDO0FBRWpEOzs7Ozs7OztHQVFHO0FBQ0gsTUFBTSxVQUFVLG1CQUFtQixDQUNqQyxJQUF3QixFQUN4QixVQUE2QyxFQUM3QyxLQUF3QztJQUV4QyxNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsSUFBeUIsQ0FBQztJQUMzQyxHQUFHLENBQUMsYUFBYSxHQUFHLHVCQUF1QixDQUFDLFVBQVUsRUFBRSxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDN0UsR0FBRyxDQUFDLFFBQVEsR0FBRyx1QkFBdUIsQ0FBQyxLQUFLLEVBQUUsYUFBYSxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQ3BFLENBQUM7QUFFRDs7Ozs7Ozs7O0dBU0c7QUFDSCxNQUFNLFVBQVUsa0JBQWtCLENBQUMsSUFBUyxFQUFFLEtBQXFDO0lBQ2pGLE9BQU8sYUFBYSxDQUFDLEdBQUcsRUFBRTtRQUN4QixNQUFNLFdBQVcsR0FBRyxjQUFjLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQy9DLFdBQVcsQ0FBQyxZQUFZLEdBQUcsa0JBQWtCLENBQUMsS0FBSyxDQUFDLFlBQVksSUFBSSxXQUFXLENBQUMsQ0FBQztRQUNqRixXQUFXLENBQUMsT0FBTyxHQUFHLGtCQUFrQixDQUFDLEtBQUssQ0FBQyxPQUFPLElBQUksV0FBVyxDQUFDLENBQUM7UUFDdkUsV0FBVyxDQUFDLE9BQU8sR0FBRyxrQkFBa0IsQ0FBQyxLQUFLLENBQUMsT0FBTyxJQUFJLFdBQVcsQ0FBQyxDQUFDO1FBRXZFLElBQUksS0FBSyxDQUFDLFNBQVMsRUFBRSxDQUFDO1lBQ3BCLCtDQUErQztZQUMvQyxXQUFXLENBQUMsU0FBUyxHQUFHLGtCQUFrQixDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUM5RCxDQUFDO1FBRUQsV0FBVyxDQUFDLGdCQUFnQixDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQztJQUM1QyxDQUFDLENBQUMsQ0FBQztBQUNMLENBQUM7QUFFRCxTQUFTLGtCQUFrQixDQUN6QixNQUF1RTtJQUV2RSxJQUFJLE9BQU8sTUFBTSxLQUFLLFVBQVUsRUFBRSxDQUFDO1FBQ2pDLE9BQU8sTUFBTSxDQUFDO0lBQ2hCLENBQUM7SUFFRCxNQUFNLGFBQWEsR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUM7SUFFdEMsSUFBSSxhQUFhLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxFQUFFLENBQUM7UUFDckMsT0FBTyxHQUFHLEVBQUUsQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFDLGlCQUFpQixDQUFDLENBQUMsR0FBRyxDQUFDLDhCQUE4QixDQUFDLENBQUM7SUFDeEYsQ0FBQztTQUFNLENBQUM7UUFDTixPQUFPLGFBQWEsQ0FBQyxHQUFHLENBQUMsOEJBQThCLENBQUMsQ0FBQztJQUMzRCxDQUFDO0FBQ0gsQ0FBQztBQUVELFNBQVMsOEJBQThCLENBQUMsS0FBVTtJQUNoRCxPQUFPLHFCQUFxQixDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBRSxLQUFtQixDQUFDO0FBQzlFLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtpc0ZvcndhcmRSZWYsIHJlc29sdmVGb3J3YXJkUmVmfSBmcm9tICcuLi9kaS9mb3J3YXJkX3JlZic7XG5pbXBvcnQge1R5cGV9IGZyb20gJy4uL2ludGVyZmFjZS90eXBlJztcbmltcG9ydCB7ZmxhdHRlbn0gZnJvbSAnLi4vdXRpbC9hcnJheV91dGlscyc7XG5pbXBvcnQge25vU2lkZUVmZmVjdHN9IGZyb20gJy4uL3V0aWwvY2xvc3VyZSc7XG5pbXBvcnQge0VNUFRZX0FSUkFZfSBmcm9tICcuLi91dGlsL2VtcHR5JztcblxuaW1wb3J0IHtleHRyYWN0RGVmTGlzdE9yRmFjdG9yeSwgZ2V0TmdNb2R1bGVEZWZ9IGZyb20gJy4vZGVmaW5pdGlvbic7XG5pbXBvcnQge2RlcHNUcmFja2VyfSBmcm9tICcuL2RlcHNfdHJhY2tlci9kZXBzX3RyYWNrZXInO1xuaW1wb3J0IHtcbiAgQ29tcG9uZW50RGVmLFxuICBDb21wb25lbnRUeXBlLFxuICBOZ01vZHVsZVNjb3BlSW5mb0Zyb21EZWNvcmF0b3IsXG4gIFJhd1Njb3BlSW5mb0Zyb21EZWNvcmF0b3IsXG59IGZyb20gJy4vaW50ZXJmYWNlcy9kZWZpbml0aW9uJztcbmltcG9ydCB7aXNNb2R1bGVXaXRoUHJvdmlkZXJzfSBmcm9tICcuL2ppdC91dGlsJztcblxuLyoqXG4gKiBHZW5lcmF0ZWQgbmV4dCB0byBOZ01vZHVsZXMgdG8gbW9ua2V5LXBhdGNoIGRpcmVjdGl2ZSBhbmQgcGlwZSByZWZlcmVuY2VzIG9udG8gYSBjb21wb25lbnQnc1xuICogZGVmaW5pdGlvbiwgd2hlbiBnZW5lcmF0aW5nIGEgZGlyZWN0IHJlZmVyZW5jZSBpbiB0aGUgY29tcG9uZW50IGZpbGUgd291bGQgb3RoZXJ3aXNlIGNyZWF0ZSBhblxuICogaW1wb3J0IGN5Y2xlLlxuICpcbiAqIFNlZSBbdGhpcyBleHBsYW5hdGlvbl0oaHR0cHM6Ly9oYWNrbWQuaW8vT2R3ODBEMHBSNnlmc09qZ183WENKZz92aWV3KSBmb3IgbW9yZSBkZXRhaWxzLlxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1c2V0Q29tcG9uZW50U2NvcGUoXG4gIHR5cGU6IENvbXBvbmVudFR5cGU8YW55PixcbiAgZGlyZWN0aXZlczogVHlwZTxhbnk+W10gfCAoKCkgPT4gVHlwZTxhbnk+W10pLFxuICBwaXBlczogVHlwZTxhbnk+W10gfCAoKCkgPT4gVHlwZTxhbnk+W10pLFxuKTogdm9pZCB7XG4gIGNvbnN0IGRlZiA9IHR5cGUuybVjbXAgYXMgQ29tcG9uZW50RGVmPGFueT47XG4gIGRlZi5kaXJlY3RpdmVEZWZzID0gZXh0cmFjdERlZkxpc3RPckZhY3RvcnkoZGlyZWN0aXZlcywgLyogcGlwZURlZiAqLyBmYWxzZSk7XG4gIGRlZi5waXBlRGVmcyA9IGV4dHJhY3REZWZMaXN0T3JGYWN0b3J5KHBpcGVzLCAvKiBwaXBlRGVmICovIHRydWUpO1xufVxuXG4vKipcbiAqIEFkZHMgdGhlIG1vZHVsZSBtZXRhZGF0YSB0aGF0IGlzIG5lY2Vzc2FyeSB0byBjb21wdXRlIHRoZSBtb2R1bGUncyB0cmFuc2l0aXZlIHNjb3BlIHRvIGFuXG4gKiBleGlzdGluZyBtb2R1bGUgZGVmaW5pdGlvbi5cbiAqXG4gKiBTY29wZSBtZXRhZGF0YSBvZiBtb2R1bGVzIGlzIG5vdCB1c2VkIGluIHByb2R1Y3Rpb24gYnVpbGRzLCBzbyBjYWxscyB0byB0aGlzIGZ1bmN0aW9uIGNhbiBiZVxuICogbWFya2VkIHB1cmUgdG8gdHJlZS1zaGFrZSBpdCBmcm9tIHRoZSBidW5kbGUsIGFsbG93aW5nIGZvciBhbGwgcmVmZXJlbmNlZCBkZWNsYXJhdGlvbnNcbiAqIHRvIGJlY29tZSBlbGlnaWJsZSBmb3IgdHJlZS1zaGFraW5nIGFzIHdlbGwuXG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVzZXROZ01vZHVsZVNjb3BlKHR5cGU6IGFueSwgc2NvcGU6IE5nTW9kdWxlU2NvcGVJbmZvRnJvbURlY29yYXRvcik6IHVua25vd24ge1xuICByZXR1cm4gbm9TaWRlRWZmZWN0cygoKSA9PiB7XG4gICAgY29uc3QgbmdNb2R1bGVEZWYgPSBnZXROZ01vZHVsZURlZih0eXBlLCB0cnVlKTtcbiAgICBuZ01vZHVsZURlZi5kZWNsYXJhdGlvbnMgPSBjb252ZXJ0VG9UeXBlQXJyYXkoc2NvcGUuZGVjbGFyYXRpb25zIHx8IEVNUFRZX0FSUkFZKTtcbiAgICBuZ01vZHVsZURlZi5pbXBvcnRzID0gY29udmVydFRvVHlwZUFycmF5KHNjb3BlLmltcG9ydHMgfHwgRU1QVFlfQVJSQVkpO1xuICAgIG5nTW9kdWxlRGVmLmV4cG9ydHMgPSBjb252ZXJ0VG9UeXBlQXJyYXkoc2NvcGUuZXhwb3J0cyB8fCBFTVBUWV9BUlJBWSk7XG5cbiAgICBpZiAoc2NvcGUuYm9vdHN0cmFwKSB7XG4gICAgICAvLyBUaGlzIG9ubHkgaGFwcGVucyBpbiBsb2NhbCBjb21waWxhdGlvbiBtb2RlLlxuICAgICAgbmdNb2R1bGVEZWYuYm9vdHN0cmFwID0gY29udmVydFRvVHlwZUFycmF5KHNjb3BlLmJvb3RzdHJhcCk7XG4gICAgfVxuXG4gICAgZGVwc1RyYWNrZXIucmVnaXN0ZXJOZ01vZHVsZSh0eXBlLCBzY29wZSk7XG4gIH0pO1xufVxuXG5mdW5jdGlvbiBjb252ZXJ0VG9UeXBlQXJyYXkoXG4gIHZhbHVlczogVHlwZTxhbnk+W10gfCAoKCkgPT4gVHlwZTxhbnk+W10pIHwgUmF3U2NvcGVJbmZvRnJvbURlY29yYXRvcltdLFxuKTogVHlwZTxhbnk+W10gfCAoKCkgPT4gVHlwZTxhbnk+W10pIHtcbiAgaWYgKHR5cGVvZiB2YWx1ZXMgPT09ICdmdW5jdGlvbicpIHtcbiAgICByZXR1cm4gdmFsdWVzO1xuICB9XG5cbiAgY29uc3QgZmxhdHRlblZhbHVlcyA9IGZsYXR0ZW4odmFsdWVzKTtcblxuICBpZiAoZmxhdHRlblZhbHVlcy5zb21lKGlzRm9yd2FyZFJlZikpIHtcbiAgICByZXR1cm4gKCkgPT4gZmxhdHRlblZhbHVlcy5tYXAocmVzb2x2ZUZvcndhcmRSZWYpLm1hcChtYXliZVVud3JhcE1vZHVsZVdpdGhQcm92aWRlcnMpO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBmbGF0dGVuVmFsdWVzLm1hcChtYXliZVVud3JhcE1vZHVsZVdpdGhQcm92aWRlcnMpO1xuICB9XG59XG5cbmZ1bmN0aW9uIG1heWJlVW53cmFwTW9kdWxlV2l0aFByb3ZpZGVycyh2YWx1ZTogYW55KTogVHlwZTxhbnk+IHtcbiAgcmV0dXJuIGlzTW9kdWxlV2l0aFByb3ZpZGVycyh2YWx1ZSkgPyB2YWx1ZS5uZ01vZHVsZSA6ICh2YWx1ZSBhcyBUeXBlPGFueT4pO1xufVxuIl19