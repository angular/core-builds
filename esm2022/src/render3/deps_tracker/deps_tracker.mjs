/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { resolveForwardRef } from '../../di';
import { RuntimeError } from '../../errors';
import { getComponentDef, getNgModuleDef, isStandalone } from '../definition';
import { isComponent, isDirective, isNgModule, isPipe, verifyStandaloneImport } from '../jit/util';
import { maybeUnwrapFn } from '../util/misc_utils';
/**
 * Indicates whether to use the runtime dependency tracker for scope calculation in JIT compilation.
 * The value "false" means the old code path based on patching scope info into the types will be
 * used.
 *
 * @deprecated For migration purposes only, to be removed soon.
 */
export const USE_RUNTIME_DEPS_TRACKER_FOR_JIT = false;
/**
 * An implementation of DepsTrackerApi which will be used for JIT and local compilation.
 */
class DepsTracker {
    constructor() {
        this.ownerNgModule = new Map();
        this.ngModulesWithSomeUnresolvedDecls = new Set();
        this.ngModulesScopeCache = new Map();
        this.standaloneComponentsScopeCache = new Map();
    }
    /**
     * Attempts to resolve ng module's forward ref declarations as much as possible and add them to
     * the `ownerNgModule` map. This method normally should be called after the initial parsing when
     * all the forward refs are resolved (e.g., when trying to render a component)
     */
    resolveNgModulesDecls() {
        if (this.ngModulesWithSomeUnresolvedDecls.size === 0) {
            return;
        }
        for (const moduleType of this.ngModulesWithSomeUnresolvedDecls) {
            const def = getNgModuleDef(moduleType);
            if (def?.declarations) {
                for (const decl of maybeUnwrapFn(def.declarations)) {
                    if (isComponent(decl)) {
                        this.ownerNgModule.set(decl, moduleType);
                    }
                }
            }
        }
        this.ngModulesWithSomeUnresolvedDecls.clear();
    }
    /** @override */
    getComponentDependencies(type, rawImports) {
        this.resolveNgModulesDecls();
        const def = getComponentDef(type);
        if (def === null) {
            throw new Error(`Attempting to get component dependencies for a type that is not a component: ${type}`);
        }
        if (def.standalone) {
            const scope = this.getStandaloneComponentScope(type, rawImports);
            if (scope.compilation.isPoisoned) {
                return { dependencies: [] };
            }
            return {
                dependencies: [
                    ...scope.compilation.directives,
                    ...scope.compilation.pipes,
                ]
            };
        }
        else {
            if (!this.ownerNgModule.has(type)) {
                return { dependencies: [] };
            }
            const scope = this.getNgModuleScope(this.ownerNgModule.get(type));
            if (scope.compilation.isPoisoned) {
                return { dependencies: [] };
            }
            return {
                dependencies: [
                    ...scope.compilation.directives,
                    ...scope.compilation.pipes,
                ],
            };
        }
    }
    /**
     * @override
     * This implementation does not make use of param scopeInfo since it assumes the scope info is
     * already added to the type itself through methods like {@link ɵɵsetNgModuleScope}
     */
    registerNgModule(type, scopeInfo) {
        if (!isNgModule(type)) {
            throw new Error(`Attempting to register a Type which is not NgModule as NgModule: ${type}`);
        }
        // Lazily process the NgModules later when needed.
        this.ngModulesWithSomeUnresolvedDecls.add(type);
    }
    /** @override */
    clearScopeCacheFor(type) {
        if (isNgModule(type)) {
            this.ngModulesScopeCache.delete(type);
        }
        else if (isComponent(type)) {
            this.standaloneComponentsScopeCache.delete(type);
        }
    }
    /** @override */
    getNgModuleScope(type) {
        if (this.ngModulesScopeCache.has(type)) {
            return this.ngModulesScopeCache.get(type);
        }
        const scope = this.computeNgModuleScope(type);
        this.ngModulesScopeCache.set(type, scope);
        return scope;
    }
    /** Compute NgModule scope afresh. */
    computeNgModuleScope(type) {
        const def = getNgModuleDef(type, true);
        const scope = {
            exported: { directives: new Set(), pipes: new Set() },
            compilation: { directives: new Set(), pipes: new Set() },
        };
        // Analyzing imports
        for (const imported of maybeUnwrapFn(def.imports)) {
            if (isNgModule(imported)) {
                const importedScope = this.getNgModuleScope(imported);
                // When this module imports another, the imported module's exported directives and pipes
                // are added to the compilation scope of this module.
                addSet(importedScope.exported.directives, scope.compilation.directives);
                addSet(importedScope.exported.pipes, scope.compilation.pipes);
            }
            else if (isStandalone(imported)) {
                if (isDirective(imported) || isComponent(imported)) {
                    scope.compilation.directives.add(imported);
                }
                else if (isPipe(imported)) {
                    scope.compilation.pipes.add(imported);
                }
                else {
                    // The standalone thing is neither a component nor a directive nor a pipe ... (what?)
                    throw new RuntimeError(1000 /* RuntimeErrorCode.RUNTIME_DEPS_INVALID_IMPORTED_TYPE */, 'The standalone imported type is neither a component nor a directive nor a pipe');
                }
            }
            else {
                // The import is neither a module nor a module-with-providers nor a standalone thing. This
                // is going to be an error. So we short circuit.
                scope.compilation.isPoisoned = true;
                break;
            }
        }
        // Analyzing declarations
        if (!scope.compilation.isPoisoned) {
            for (const decl of maybeUnwrapFn(def.declarations)) {
                // Cannot declare another NgModule or a standalone thing
                if (isNgModule(decl) || isStandalone(decl)) {
                    scope.compilation.isPoisoned = true;
                    break;
                }
                if (isPipe(decl)) {
                    scope.compilation.pipes.add(decl);
                }
                else {
                    // decl is either a directive or a component. The component may not yet have the ɵcmp due
                    // to async compilation.
                    scope.compilation.directives.add(decl);
                }
            }
        }
        // Analyzing exports
        for (const exported of maybeUnwrapFn(def.exports)) {
            if (isNgModule(exported)) {
                // When this module exports another, the exported module's exported directives and pipes
                // are added to both the compilation and exported scopes of this module.
                const exportedScope = this.getNgModuleScope(exported);
                // Based on the current logic there is no way to have poisoned exported scope. So no need to
                // check for it.
                addSet(exportedScope.exported.directives, scope.exported.directives);
                addSet(exportedScope.exported.pipes, scope.exported.pipes);
            }
            else if (isPipe(exported)) {
                scope.exported.pipes.add(exported);
            }
            else {
                scope.exported.directives.add(exported);
            }
        }
        return scope;
    }
    /** @override */
    getStandaloneComponentScope(type, rawImports) {
        if (this.standaloneComponentsScopeCache.has(type)) {
            return this.standaloneComponentsScopeCache.get(type);
        }
        const ans = this.computeStandaloneComponentScope(type, rawImports);
        this.standaloneComponentsScopeCache.set(type, ans);
        return ans;
    }
    computeStandaloneComponentScope(type, rawImports) {
        const ans = {
            compilation: {
                // Standalone components are always able to self-reference.
                directives: new Set([type]),
                pipes: new Set(),
            },
        };
        for (const rawImport of rawImports ?? []) {
            const imported = resolveForwardRef(rawImport);
            try {
                verifyStandaloneImport(imported, type);
            }
            catch (e) {
                // Short-circuit if an import is not valid
                ans.compilation.isPoisoned = true;
                return ans;
            }
            if (isNgModule(imported)) {
                const importedScope = this.getNgModuleScope(imported);
                // Short-circuit if an imported NgModule has corrupted exported scope.
                if (importedScope.exported.isPoisoned) {
                    ans.compilation.isPoisoned = true;
                    return ans;
                }
                addSet(importedScope.exported.directives, ans.compilation.directives);
                addSet(importedScope.exported.pipes, ans.compilation.pipes);
            }
            else if (isPipe(imported)) {
                ans.compilation.pipes.add(imported);
            }
            else if (isDirective(imported) || isComponent(imported)) {
                ans.compilation.directives.add(imported);
            }
            else {
                // The imported thing is not module/pipe/directive/component, so we error and short-circuit
                // here
                ans.compilation.isPoisoned = true;
                return ans;
            }
        }
        return ans;
    }
}
function addSet(sourceSet, targetSet) {
    for (const m of sourceSet) {
        targetSet.add(m);
    }
}
/** The deps tracker to be used in the current Angular app in dev mode. */
export const depsTracker = new DepsTracker();
export const TEST_ONLY = { DepsTracker };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVwc190cmFja2VyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9kZXBzX3RyYWNrZXIvZGVwc190cmFja2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBQyxpQkFBaUIsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUMzQyxPQUFPLEVBQUMsWUFBWSxFQUFtQixNQUFNLGNBQWMsQ0FBQztBQUc1RCxPQUFPLEVBQUMsZUFBZSxFQUFFLGNBQWMsRUFBRSxZQUFZLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFFNUUsT0FBTyxFQUFDLFdBQVcsRUFBRSxXQUFXLEVBQUUsVUFBVSxFQUFFLE1BQU0sRUFBRSxzQkFBc0IsRUFBQyxNQUFNLGFBQWEsQ0FBQztBQUNqRyxPQUFPLEVBQUMsYUFBYSxFQUFDLE1BQU0sb0JBQW9CLENBQUM7QUFJakQ7Ozs7OztHQU1HO0FBQ0gsTUFBTSxDQUFDLE1BQU0sZ0NBQWdDLEdBQUcsS0FBSyxDQUFDO0FBRXREOztHQUVHO0FBQ0gsTUFBTSxXQUFXO0lBQWpCO1FBQ1Usa0JBQWEsR0FBRyxJQUFJLEdBQUcsRUFBeUMsQ0FBQztRQUNqRSxxQ0FBZ0MsR0FBRyxJQUFJLEdBQUcsRUFBcUIsQ0FBQztRQUNoRSx3QkFBbUIsR0FBRyxJQUFJLEdBQUcsRUFBb0MsQ0FBQztRQUNsRSxtQ0FBOEIsR0FBRyxJQUFJLEdBQUcsRUFBZ0QsQ0FBQztJQWtQbkcsQ0FBQztJQWhQQzs7OztPQUlHO0lBQ0sscUJBQXFCO1FBQzNCLElBQUksSUFBSSxDQUFDLGdDQUFnQyxDQUFDLElBQUksS0FBSyxDQUFDLEVBQUU7WUFDcEQsT0FBTztTQUNSO1FBRUQsS0FBSyxNQUFNLFVBQVUsSUFBSSxJQUFJLENBQUMsZ0NBQWdDLEVBQUU7WUFDOUQsTUFBTSxHQUFHLEdBQUcsY0FBYyxDQUFDLFVBQVUsQ0FBQyxDQUFD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QUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUM7YUFDckM7aUJBQU0sSUFBSSxXQUFXLENBQUMsUUFBUSxDQUFDLElBQUksV0FBVyxDQUFDLFFBQVEsQ0FBQyxFQUFFO2dCQUN6RCxHQUFHLENBQUMsV0FBVyxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUM7YUFDMUM7aUJBQU07Z0JBQ0wsMkZBQTJGO2dCQUMzRixPQUFPO2dCQUNQLEdBQUcsQ0FBQyxXQUFXLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQztnQkFDbEMsT0FBTyxHQUFHLENBQUM7YUFDWjtTQUNGO1FBRUQsT0FBTyxHQUFHLENBQUM7SUFDYixDQUFDO0NBQ0Y7QUFFRCxTQUFTLE1BQU0sQ0FBSSxTQUFpQixFQUFFLFNBQWlCO0lBQ3JELEtBQUssTUFBTSxDQUFDLElBQUksU0FBUyxFQUFFO1FBQ3pCLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7S0FDbEI7QUFDSCxDQUFDO0FBRUQsMEVBQTBFO0FBQzFFLE1BQU0sQ0FBQyxNQUFNLFdBQVcsR0FBRyxJQUFJLFdBQVcsRUFBRSxDQUFDO0FBRTdDLE1BQU0sQ0FBQyxNQUFNLFNBQVMsR0FBRyxFQUFDLFdBQVcsRUFBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7cmVzb2x2ZUZvcndhcmRSZWZ9IGZyb20gJy4uLy4uL2RpJztcbmltcG9ydCB7UnVudGltZUVycm9yLCBSdW50aW1lRXJyb3JDb2RlfSBmcm9tICcuLi8uLi9lcnJvcnMnO1xuaW1wb3J0IHtUeXBlfSBmcm9tICcuLi8uLi9pbnRlcmZhY2UvdHlwZSc7XG5pbXBvcnQge05nTW9kdWxlVHlwZX0gZnJvbSAnLi4vLi4vbWV0YWRhdGEvbmdfbW9kdWxlX2RlZic7XG5pbXBvcnQge2dldENvbXBvbmVudERlZiwgZ2V0TmdNb2R1bGVEZWYsIGlzU3RhbmRhbG9uZX0gZnJvbSAnLi4vZGVmaW5pdGlvbic7XG5pbXBvcnQge0NvbXBvbmVudFR5cGUsIE5nTW9kdWxlU2NvcGVJbmZvRnJvbURlY29yYXRvciwgUmF3U2NvcGVJbmZvRnJvbURlY29yYXRvcn0gZnJvbSAnLi4vaW50ZXJmYWNlcy9kZWZpbml0aW9uJztcbmltcG9ydCB7aXNDb21wb25lbnQsIGlzRGlyZWN0aXZlLCBpc05nTW9kdWxlLCBpc1BpcGUsIHZlcmlmeVN0YW5kYWxvbmVJbXBvcnR9IGZyb20gJy4uL2ppdC91dGlsJztcbmltcG9ydCB7bWF5YmVVbndyYXBGbn0gZnJvbSAnLi4vdXRpbC9taXNjX3V0aWxzJztcblxuaW1wb3J0IHtDb21wb25lbnREZXBlbmRlbmNpZXMsIERlcHNUcmFja2VyQXBpLCBOZ01vZHVsZVNjb3BlLCBTdGFuZGFsb25lQ29tcG9uZW50U2NvcGV9IGZyb20gJy4vYXBpJztcblxuLyoqXG4gKiBJbmRpY2F0ZXMgd2hldGhlciB0byB1c2UgdGhlIHJ1bnRpbWUgZGVwZW5kZW5jeSB0cmFja2VyIGZvciBzY29wZSBjYWxjdWxhdGlvbiBpbiBKSVQgY29tcGlsYXRpb24uXG4gKiBUaGUgdmFsdWUgXCJmYWxzZVwiIG1lYW5zIHRoZSBvbGQgY29kZSBwYXRoIGJhc2VkIG9uIHBhdGNoaW5nIHNjb3BlIGluZm8gaW50byB0aGUgdHlwZXMgd2lsbCBiZVxuICogdXNlZC5cbiAqXG4gKiBAZGVwcmVjYXRlZCBGb3IgbWlncmF0aW9uIHB1cnBvc2VzIG9ubHksIHRvIGJlIHJlbW92ZWQgc29vbi5cbiAqL1xuZXhwb3J0IGNvbnN0IFVTRV9SVU5USU1FX0RFUFNfVFJBQ0tFUl9GT1JfSklUID0gZmFsc2U7XG5cbi8qKlxuICogQW4gaW1wbGVtZW50YXRpb24gb2YgRGVwc1RyYWNrZXJBcGkgd2hpY2ggd2lsbCBiZSB1c2VkIGZvciBKSVQgYW5kIGxvY2FsIGNvbXBpbGF0aW9uLlxuICovXG5jbGFzcyBEZXBzVHJhY2tlciBpbXBsZW1lbnRzIERlcHNUcmFja2VyQXBpIHtcbiAgcHJpdmF0ZSBvd25lck5nTW9kdWxlID0gbmV3IE1hcDxDb21wb25lbnRUeXBlPGFueT4sIE5nTW9kdWxlVHlwZTxhbnk+PigpO1xuICBwcml2YXRlIG5nTW9kdWxlc1dpdGhTb21lVW5yZXNvbHZlZERlY2xzID0gbmV3IFNldDxOZ01vZHVsZVR5cGU8YW55Pj4oKTtcbiAgcHJpdmF0ZSBuZ01vZHVsZXNTY29wZUNhY2hlID0gbmV3IE1hcDxOZ01vZHVsZVR5cGU8YW55PiwgTmdNb2R1bGVTY29wZT4oKTtcbiAgcHJpdmF0ZSBzdGFuZGFsb25lQ29tcG9uZW50c1Njb3BlQ2FjaGUgPSBuZXcgTWFwPENvbXBvbmVudFR5cGU8YW55PiwgU3RhbmRhbG9uZUNvbXBvbmVudFNjb3BlPigpO1xuXG4gIC8qKlxuICAgKiBBdHRlbXB0cyB0byByZXNvbHZlIG5nIG1vZHVsZSdzIGZvcndhcmQgcmVmIGRlY2xhcmF0aW9ucyBhcyBtdWNoIGFzIHBvc3NpYmxlIGFuZCBhZGQgdGhlbSB0b1xuICAgKiB0aGUgYG93bmVyTmdNb2R1bGVgIG1hcC4gVGhpcyBtZXRob2Qgbm9ybWFsbHkgc2hvdWxkIGJlIGNhbGxlZCBhZnRlciB0aGUgaW5pdGlhbCBwYXJzaW5nIHdoZW5cbiAgICogYWxsIHRoZSBmb3J3YXJkIHJlZnMgYXJlIHJlc29sdmVkIChlLmcuLCB3aGVuIHRyeWluZyB0byByZW5kZXIgYSBjb21wb25lbnQpXG4gICAqL1xuICBwcml2YXRlIHJlc29sdmVOZ01vZHVsZXNEZWNscygpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5uZ01vZHVsZXNXaXRoU29tZVVucmVzb2x2ZWREZWNscy5zaXplID09PSAwKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgZm9yIChjb25zdCBtb2R1bGVUeXBlIG9mIHRoaXMubmdNb2R1bGVzV2l0aFNvbWVVbnJlc29sdmVkRGVjbHMpIHtcbiAgICAgIGNvbnN0IGRlZiA9IGdldE5nTW9kdWxlRGVmKG1vZHVsZVR5cGUpO1xuICAgICAgaWYgKGRlZj8uZGVjbGFyYXRpb25zKSB7XG4gICAgICAgIGZvciAoY29uc3QgZGVjbCBvZiBtYXliZVVud3JhcEZuKGRlZi5kZWNsYXJhdGlvbnMpKSB7XG4gICAgICAgICAgaWYgKGlzQ29tcG9uZW50KGRlY2wpKSB7XG4gICAgICAgICAgICB0aGlzLm93bmVyTmdNb2R1bGUuc2V0KGRlY2wsIG1vZHVsZVR5cGUpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMubmdNb2R1bGVzV2l0aFNvbWVVbnJlc29sdmVkRGVjbHMuY2xlYXIoKTtcbiAgfVxuXG4gIC8qKiBAb3ZlcnJpZGUgKi9cbiAgZ2V0Q29tcG9uZW50RGVwZW5kZW5jaWVzKHR5cGU6IENvbXBvbmVudFR5cGU8YW55PiwgcmF3SW1wb3J0cz86IFJhd1Njb3BlSW5mb0Zyb21EZWNvcmF0b3JbXSk6XG4gICAgICBDb21wb25lbnREZXBlbmRlbmNpZXMge1xuICAgIHRoaXMucmVzb2x2ZU5nTW9kdWxlc0RlY2xzKCk7XG5cbiAgICBjb25zdCBkZWYgPSBnZXRDb21wb25lbnREZWYodHlwZSk7XG4gICAgaWYgKGRlZiA9PT0gbnVsbCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgIGBBdHRlbXB0aW5nIHRvIGdldCBjb21wb25lbnQgZGVwZW5kZW5jaWVzIGZvciBhIHR5cGUgdGhhdCBpcyBub3QgYSBjb21wb25lbnQ6ICR7dHlwZX1gKTtcbiAgICB9XG5cbiAgICBpZiAoZGVmLnN0YW5kYWxvbmUpIHtcbiAgICAgIGNvbnN0IHNjb3BlID0gdGhpcy5nZXRTdGFuZGFsb25lQ29tcG9uZW50U2NvcGUodHlwZSwgcmF3SW1wb3J0cyk7XG5cbiAgICAgIGlmIChzY29wZS5jb21waWxhdGlvbi5pc1BvaXNvbmVkKSB7XG4gICAgICAgIHJldHVybiB7ZGVwZW5kZW5jaWVzOiBbXX07XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB7XG4gICAgICAgIGRlcGVuZGVuY2llczogW1xuICAgICAgICAgIC4uLnNjb3BlLmNvbXBpbGF0aW9uLmRpcmVjdGl2ZXMsXG4gICAgICAgICAgLi4uc2NvcGUuY29tcGlsYXRpb24ucGlwZXMsXG4gICAgICAgIF1cbiAgICAgIH07XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmICghdGhpcy5vd25lck5nTW9kdWxlLmhhcyh0eXBlKSkge1xuICAgICAgICByZXR1cm4ge2RlcGVuZGVuY2llczogW119O1xuICAgICAgfVxuXG4gICAgICBjb25zdCBzY29wZSA9IHRoaXMuZ2V0TmdNb2R1bGVTY29wZSh0aGlzLm93bmVyTmdNb2R1bGUuZ2V0KHR5cGUpISk7XG5cbiAgICAgIGlmIChzY29wZS5jb21waWxhdGlvbi5pc1BvaXNvbmVkKSB7XG4gICAgICAgIHJldHVybiB7ZGVwZW5kZW5jaWVzOiBbXX07XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB7XG4gICAgICAgIGRlcGVuZGVuY2llczogW1xuICAgICAgICAgIC4uLnNjb3BlLmNvbXBpbGF0aW9uLmRpcmVjdGl2ZXMsXG4gICAgICAgICAgLi4uc2NvcGUuY29tcGlsYXRpb24ucGlwZXMsXG4gICAgICAgIF0sXG4gICAgICB9O1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBAb3ZlcnJpZGVcbiAgICogVGhpcyBpbXBsZW1lbnRhdGlvbiBkb2VzIG5vdCBtYWtlIHVzZSBvZiBwYXJhbSBzY29wZUluZm8gc2luY2UgaXQgYXNzdW1lcyB0aGUgc2NvcGUgaW5mbyBpc1xuICAgKiBhbHJlYWR5IGFkZGVkIHRvIHRoZSB0eXBlIGl0c2VsZiB0aHJvdWdoIG1ldGhvZHMgbGlrZSB7QGxpbmsgybXJtXNldE5nTW9kdWxlU2NvcGV9XG4gICAqL1xuICByZWdpc3Rlck5nTW9kdWxlKHR5cGU6IFR5cGU8YW55Piwgc2NvcGVJbmZvOiBOZ01vZHVsZVNjb3BlSW5mb0Zyb21EZWNvcmF0b3IpOiB2b2lkIHtcbiAgICBpZiAoIWlzTmdNb2R1bGUodHlwZSkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgQXR0ZW1wdGluZyB0byByZWdpc3RlciBhIFR5cGUgd2hpY2ggaXMgbm90IE5nTW9kdWxlIGFzIE5nTW9kdWxlOiAke3R5cGV9YCk7XG4gICAgfVxuXG4gICAgLy8gTGF6aWx5IHByb2Nlc3MgdGhlIE5nTW9kdWxlcyBsYXRlciB3aGVuIG5lZWRlZC5cbiAgICB0aGlzLm5nTW9kdWxlc1dpdGhTb21lVW5yZXNvbHZlZERlY2xzLmFkZCh0eXBlKTtcbiAgfVxuXG4gIC8qKiBAb3ZlcnJpZGUgKi9cbiAgY2xlYXJTY29wZUNhY2hlRm9yKHR5cGU6IFR5cGU8YW55Pik6IHZvaWQge1xuICAgIGlmIChpc05nTW9kdWxlKHR5cGUpKSB7XG4gICAgICB0aGlzLm5nTW9kdWxlc1Njb3BlQ2FjaGUuZGVsZXRlKHR5cGUpO1xuICAgIH0gZWxzZSBpZiAoaXNDb21wb25lbnQodHlwZSkpIHtcbiAgICAgIHRoaXMuc3RhbmRhbG9uZUNvbXBvbmVudHNTY29wZUNhY2hlLmRlbGV0ZSh0eXBlKTtcbiAgICB9XG4gIH1cblxuICAvKiogQG92ZXJyaWRlICovXG4gIGdldE5nTW9kdWxlU2NvcGUodHlwZTogTmdNb2R1bGVUeXBlPGFueT4pOiBOZ01vZHVsZVNjb3BlIHtcbiAgICBpZiAodGhpcy5uZ01vZHVsZXNTY29wZUNhY2hlLmhhcyh0eXBlKSkge1xuICAgICAgcmV0dXJuIHRoaXMubmdNb2R1bGVzU2NvcGVDYWNoZS5nZXQodHlwZSkhO1xuICAgIH1cblxuICAgIGNvbnN0IHNjb3BlID0gdGhpcy5jb21wdXRlTmdNb2R1bGVTY29wZSh0eXBlKTtcbiAgICB0aGlzLm5nTW9kdWxlc1Njb3BlQ2FjaGUuc2V0KHR5cGUsIHNjb3BlKTtcblxuICAgIHJldHVybiBzY29wZTtcbiAgfVxuXG4gIC8qKiBDb21wdXRlIE5nTW9kdWxlIHNjb3BlIGFmcmVzaC4gKi9cbiAgcHJpdmF0ZSBjb21wdXRlTmdNb2R1bGVTY29wZSh0eXBlOiBOZ01vZHVsZVR5cGU8YW55Pik6IE5nTW9kdWxlU2NvcGUge1xuICAgIGNvbnN0IGRlZiA9IGdldE5nTW9kdWxlRGVmKHR5cGUsIHRydWUpO1xuICAgIGNvbnN0IHNjb3BlOiBOZ01vZHVsZVNjb3BlID0ge1xuICAgICAgZXhwb3J0ZWQ6IHtkaXJlY3RpdmVzOiBuZXcgU2V0KCksIHBpcGVzOiBuZXcgU2V0KCl9LFxuICAgICAgY29tcGlsYXRpb246IHtkaXJlY3RpdmVzOiBuZXcgU2V0KCksIHBpcGVzOiBuZXcgU2V0KCl9LFxuICAgIH07XG5cbiAgICAvLyBBbmFseXppbmcgaW1wb3J0c1xuICAgIGZvciAoY29uc3QgaW1wb3J0ZWQgb2YgbWF5YmVVbndyYXBGbihkZWYuaW1wb3J0cykpIHtcbiAgICAgIGlmIChpc05nTW9kdWxlKGltcG9ydGVkKSkge1xuICAgICAgICBjb25zdCBpbXBvcnRlZFNjb3BlID0gdGhpcy5nZXROZ01vZHVsZVNjb3BlKGltcG9ydGVkKTtcblxuICAgICAgICAvLyBXaGVuIHRoaXMgbW9kdWxlIGltcG9ydHMgYW5vdGhlciwgdGhlIGltcG9ydGVkIG1vZHVsZSdzIGV4cG9ydGVkIGRpcmVjdGl2ZXMgYW5kIHBpcGVzXG4gICAgICAgIC8vIGFyZSBhZGRlZCB0byB0aGUgY29tcGlsYXRpb24gc2NvcGUgb2YgdGhpcyBtb2R1bGUuXG4gICAgICAgIGFkZFNldChpbXBvcnRlZFNjb3BlLmV4cG9ydGVkLmRpcmVjdGl2ZXMsIHNjb3BlLmNvbXBpbGF0aW9uLmRpcmVjdGl2ZXMpO1xuICAgICAgICBhZGRTZXQoaW1wb3J0ZWRTY29wZS5leHBvcnRlZC5waXBlcywgc2NvcGUuY29tcGlsYXRpb24ucGlwZXMpO1xuICAgICAgfSBlbHNlIGlmIChpc1N0YW5kYWxvbmUoaW1wb3J0ZWQpKSB7XG4gICAgICAgIGlmIChpc0RpcmVjdGl2ZShpbXBvcnRlZCkgfHwgaXNDb21wb25lbnQoaW1wb3J0ZWQpKSB7XG4gICAgICAgICAgc2NvcGUuY29tcGlsYXRpb24uZGlyZWN0aXZlcy5hZGQoaW1wb3J0ZWQpO1xuICAgICAgICB9IGVsc2UgaWYgKGlzUGlwZShpbXBvcnRlZCkpIHtcbiAgICAgICAgICBzY29wZS5jb21waWxhdGlvbi5waXBlcy5hZGQoaW1wb3J0ZWQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIFRoZSBzdGFuZGFsb25lIHRoaW5nIGlzIG5laXRoZXIgYSBjb21wb25lbnQgbm9yIGEgZGlyZWN0aXZlIG5vciBhIHBpcGUgLi4uICh3aGF0PylcbiAgICAgICAgICB0aHJvdyBuZXcgUnVudGltZUVycm9yKFxuICAgICAgICAgICAgICBSdW50aW1lRXJyb3JDb2RlLlJVTlRJTUVfREVQU19JTlZBTElEX0lNUE9SVEVEX1RZUEUsXG4gICAgICAgICAgICAgICdUaGUgc3RhbmRhbG9uZSBpbXBvcnRlZCB0eXBlIGlzIG5laXRoZXIgYSBjb21wb25lbnQgbm9yIGEgZGlyZWN0aXZlIG5vciBhIHBpcGUnKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gVGhlIGltcG9ydCBpcyBuZWl0aGVyIGEgbW9kdWxlIG5vciBhIG1vZHVsZS13aXRoLXByb3ZpZGVycyBub3IgYSBzdGFuZGFsb25lIHRoaW5nLiBUaGlzXG4gICAgICAgIC8vIGlzIGdvaW5nIHRvIGJlIGFuIGVycm9yLiBTbyB3ZSBzaG9ydCBjaXJjdWl0LlxuICAgICAgICBzY29wZS5jb21waWxhdGlvbi5pc1BvaXNvbmVkID0gdHJ1ZTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gQW5hbHl6aW5nIGRlY2xhcmF0aW9uc1xuICAgIGlmICghc2NvcGUuY29tcGlsYXRpb24uaXNQb2lzb25lZCkge1xuICAgICAgZm9yIChjb25zdCBkZWNsIG9mIG1heWJlVW53cmFwRm4oZGVmLmRlY2xhcmF0aW9ucykpIHtcbiAgICAgICAgLy8gQ2Fubm90IGRlY2xhcmUgYW5vdGhlciBOZ01vZHVsZSBvciBhIHN0YW5kYWxvbmUgdGhpbmdcbiAgICAgICAgaWYgKGlzTmdNb2R1bGUoZGVjbCkgfHwgaXNTdGFuZGFsb25lKGRlY2wpKSB7XG4gICAgICAgICAgc2NvcGUuY29tcGlsYXRpb24uaXNQb2lzb25lZCA9IHRydWU7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoaXNQaXBlKGRlY2wpKSB7XG4gICAgICAgICAgc2NvcGUuY29tcGlsYXRpb24ucGlwZXMuYWRkKGRlY2wpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIGRlY2wgaXMgZWl0aGVyIGEgZGlyZWN0aXZlIG9yIGEgY29tcG9uZW50LiBUaGUgY29tcG9uZW50IG1heSBub3QgeWV0IGhhdmUgdGhlIMm1Y21wIGR1ZVxuICAgICAgICAgIC8vIHRvIGFzeW5jIGNvbXBpbGF0aW9uLlxuICAgICAgICAgIHNjb3BlLmNvbXBpbGF0aW9uLmRpcmVjdGl2ZXMuYWRkKGRlY2wpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gQW5hbHl6aW5nIGV4cG9ydHNcbiAgICBmb3IgKGNvbnN0IGV4cG9ydGVkIG9mIG1heWJlVW53cmFwRm4oZGVmLmV4cG9ydHMpKSB7XG4gICAgICBpZiAoaXNOZ01vZHVsZShleHBvcnRlZCkpIHtcbiAgICAgICAgLy8gV2hlbiB0aGlzIG1vZHVsZSBleHBvcnRzIGFub3RoZXIsIHRoZSBleHBvcnRlZCBtb2R1bGUncyBleHBvcnRlZCBkaXJlY3RpdmVzIGFuZCBwaXBlc1xuICAgICAgICAvLyBhcmUgYWRkZWQgdG8gYm90aCB0aGUgY29tcGlsYXRpb24gYW5kIGV4cG9ydGVkIHNjb3BlcyBvZiB0aGlzIG1vZHVsZS5cbiAgICAgICAgY29uc3QgZXhwb3J0ZWRTY29wZSA9IHRoaXMuZ2V0TmdNb2R1bGVTY29wZShleHBvcnRlZCk7XG5cbiAgICAgICAgLy8gQmFzZWQgb24gdGhlIGN1cnJlbnQgbG9naWMgdGhlcmUgaXMgbm8gd2F5IHRvIGhhdmUgcG9pc29uZWQgZXhwb3J0ZWQgc2NvcGUuIFNvIG5vIG5lZWQgdG9cbiAgICAgICAgLy8gY2hlY2sgZm9yIGl0LlxuICAgICAgICBhZGRTZXQoZXhwb3J0ZWRTY29wZS5leHBvcnRlZC5kaXJlY3RpdmVzLCBzY29wZS5leHBvcnRlZC5kaXJlY3RpdmVzKTtcbiAgICAgICAgYWRkU2V0KGV4cG9ydGVkU2NvcGUuZXhwb3J0ZWQucGlwZXMsIHNjb3BlLmV4cG9ydGVkLnBpcGVzKTtcblxuICAgICAgfSBlbHNlIGlmIChpc1BpcGUoZXhwb3J0ZWQpKSB7XG4gICAgICAgIHNjb3BlLmV4cG9ydGVkLnBpcGVzLmFkZChleHBvcnRlZCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzY29wZS5leHBvcnRlZC5kaXJlY3RpdmVzLmFkZChleHBvcnRlZCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHNjb3BlO1xuICB9XG5cbiAgLyoqIEBvdmVycmlkZSAqL1xuICBnZXRTdGFuZGFsb25lQ29tcG9uZW50U2NvcGUodHlwZTogQ29tcG9uZW50VHlwZTxhbnk+LCByYXdJbXBvcnRzPzogUmF3U2NvcGVJbmZvRnJvbURlY29yYXRvcltdKTpcbiAgICAgIFN0YW5kYWxvbmVDb21wb25lbnRTY29wZSB7XG4gICAgaWYgKHRoaXMuc3RhbmRhbG9uZUNvbXBvbmVudHNTY29wZUNhY2hlLmhhcyh0eXBlKSkge1xuICAgICAgcmV0dXJuIHRoaXMuc3RhbmRhbG9uZUNvbXBvbmVudHNTY29wZUNhY2hlLmdldCh0eXBlKSE7XG4gICAgfVxuXG4gICAgY29uc3QgYW5zID0gdGhpcy5jb21wdXRlU3RhbmRhbG9uZUNvbXBvbmVudFNjb3BlKHR5cGUsIHJhd0ltcG9ydHMpO1xuICAgIHRoaXMuc3RhbmRhbG9uZUNvbXBvbmVudHNTY29wZUNhY2hlLnNldCh0eXBlLCBhbnMpO1xuXG4gICAgcmV0dXJuIGFucztcbiAgfVxuXG4gIHByaXZhdGUgY29tcHV0ZVN0YW5kYWxvbmVDb21wb25lbnRTY29wZShcbiAgICAgIHR5cGU6IENvbXBvbmVudFR5cGU8YW55PixcbiAgICAgIHJhd0ltcG9ydHM/OiBSYXdTY29wZUluZm9Gcm9tRGVjb3JhdG9yW10pOiBTdGFuZGFsb25lQ29tcG9uZW50U2NvcGUge1xuICAgIGNvbnN0IGFuczogU3RhbmRhbG9uZUNvbXBvbmVudFNjb3BlID0ge1xuICAgICAgY29tcGlsYXRpb246IHtcbiAgICAgICAgLy8gU3RhbmRhbG9uZSBjb21wb25lbnRzIGFyZSBhbHdheXMgYWJsZSB0byBzZWxmLXJlZmVyZW5jZS5cbiAgICAgICAgZGlyZWN0aXZlczogbmV3IFNldChbdHlwZV0pLFxuICAgICAgICBwaXBlczogbmV3IFNldCgpLFxuICAgICAgfSxcbiAgICB9O1xuXG4gICAgZm9yIChjb25zdCByYXdJbXBvcnQgb2YgcmF3SW1wb3J0cyA/PyBbXSkge1xuICAgICAgY29uc3QgaW1wb3J0ZWQgPSByZXNvbHZlRm9yd2FyZFJlZihyYXdJbXBvcnQpIGFzIFR5cGU8YW55PjtcblxuICAgICAgdHJ5IHtcbiAgICAgICAgdmVyaWZ5U3RhbmRhbG9uZUltcG9ydChpbXBvcnRlZCwgdHlwZSk7XG4gICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIC8vIFNob3J0LWNpcmN1aXQgaWYgYW4gaW1wb3J0IGlzIG5vdCB2YWxpZFxuICAgICAgICBhbnMuY29tcGlsYXRpb24uaXNQb2lzb25lZCA9IHRydWU7XG4gICAgICAgIHJldHVybiBhbnM7XG4gICAgICB9XG5cbiAgICAgIGlmIChpc05nTW9kdWxlKGltcG9ydGVkKSkge1xuICAgICAgICBjb25zdCBpbXBvcnRlZFNjb3BlID0gdGhpcy5nZXROZ01vZHVsZVNjb3BlKGltcG9ydGVkKTtcblxuICAgICAgICAvLyBTaG9ydC1jaXJjdWl0IGlmIGFuIGltcG9ydGVkIE5nTW9kdWxlIGhhcyBjb3JydXB0ZWQgZXhwb3J0ZWQgc2NvcGUuXG4gICAgICAgIGlmIChpbXBvcnRlZFNjb3BlLmV4cG9ydGVkLmlzUG9pc29uZWQpIHtcbiAgICAgICAgICBhbnMuY29tcGlsYXRpb24uaXNQb2lzb25lZCA9IHRydWU7XG4gICAgICAgICAgcmV0dXJuIGFucztcbiAgICAgICAgfVxuXG4gICAgICAgIGFkZFNldChpbXBvcnRlZFNjb3BlLmV4cG9ydGVkLmRpcmVjdGl2ZXMsIGFucy5jb21waWxhdGlvbi5kaXJlY3RpdmVzKTtcbiAgICAgICAgYWRkU2V0KGltcG9ydGVkU2NvcGUuZXhwb3J0ZWQucGlwZXMsIGFucy5jb21waWxhdGlvbi5waXBlcyk7XG4gICAgICB9IGVsc2UgaWYgKGlzUGlwZShpbXBvcnRlZCkpIHtcbiAgICAgICAgYW5zLmNvbXBpbGF0aW9uLnBpcGVzLmFkZChpbXBvcnRlZCk7XG4gICAgICB9IGVsc2UgaWYgKGlzRGlyZWN0aXZlKGltcG9ydGVkKSB8fCBpc0NvbXBvbmVudChpbXBvcnRlZCkpIHtcbiAgICAgICAgYW5zLmNvbXBpbGF0aW9uLmRpcmVjdGl2ZXMuYWRkKGltcG9ydGVkKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIFRoZSBpbXBvcnRlZCB0aGluZyBpcyBub3QgbW9kdWxlL3BpcGUvZGlyZWN0aXZlL2NvbXBvbmVudCwgc28gd2UgZXJyb3IgYW5kIHNob3J0LWNpcmN1aXRcbiAgICAgICAgLy8gaGVyZVxuICAgICAgICBhbnMuY29tcGlsYXRpb24uaXNQb2lzb25lZCA9IHRydWU7XG4gICAgICAgIHJldHVybiBhbnM7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGFucztcbiAgfVxufVxuXG5mdW5jdGlvbiBhZGRTZXQ8VD4oc291cmNlU2V0OiBTZXQ8VD4sIHRhcmdldFNldDogU2V0PFQ+KTogdm9pZCB7XG4gIGZvciAoY29uc3QgbSBvZiBzb3VyY2VTZXQpIHtcbiAgICB0YXJnZXRTZXQuYWRkKG0pO1xuICB9XG59XG5cbi8qKiBUaGUgZGVwcyB0cmFja2VyIHRvIGJlIHVzZWQgaW4gdGhlIGN1cnJlbnQgQW5ndWxhciBhcHAgaW4gZGV2IG1vZGUuICovXG5leHBvcnQgY29uc3QgZGVwc1RyYWNrZXIgPSBuZXcgRGVwc1RyYWNrZXIoKTtcblxuZXhwb3J0IGNvbnN0IFRFU1RfT05MWSA9IHtEZXBzVHJhY2tlcn07XG4iXX0=