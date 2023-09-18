/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { resolveForwardRef } from '../../di';
import { RuntimeError } from '../../errors';
import { flatten } from '../../util/array_utils';
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
                throw new RuntimeError(1001 /* RuntimeErrorCode.RUNTIME_DEPS_ORPHAN_COMPONENT */, `Orphan component found! Trying to render the component ${type.name} without first loading the NgModule that declares it. Make sure that you import the component's NgModule in the NgModule or the standalone component in which you are trying to render this component. Also make sure the way the app is bundled and served always includes the component's NgModule before the component.`);
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
                // Some test toolings which run in JIT mode depend on this behavior that the exported scope
                // should also be present in the compilation scope, even though AoT does not support this
                // and it is also in odds with NgModule metadata definitions. Without this some tests in
                // Google will fail.
                addSet(exportedScope.exported.directives, scope.compilation.directives);
                addSet(exportedScope.exported.pipes, scope.compilation.pipes);
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
        for (const rawImport of flatten(rawImports ?? [])) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVwc190cmFja2VyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9kZXBzX3RyYWNrZXIvZGVwc190cmFja2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBQyxpQkFBaUIsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUMzQyxPQUFPLEVBQUMsWUFBWSxFQUFtQixNQUFNLGNBQWMsQ0FBQztBQUc1RCxPQUFPLEVBQUMsT0FBTyxFQUFDLE1BQU0sd0JBQXdCLENBQUM7QUFDL0MsT0FBTyxFQUFDLGVBQWUsRUFBRSxjQUFjLEVBQUUsWUFBWSxFQUFDLE1BQU0sZUFBZSxDQUFDO0FBRTVFLE9BQU8sRUFBQyxXQUFXLEVBQUUsV0FBVyxFQUFFLFVBQVUsRUFBRSxNQUFNLEVBQUUsc0JBQXNCLEVBQUMsTUFBTSxhQUFhLENBQUM7QUFDakcsT0FBTyxFQUFDLGFBQWEsRUFBQyxNQUFNLG9CQUFvQixDQUFDO0FBSWpEOzs7Ozs7R0FNRztBQUNILE1BQU0sQ0FBQyxNQUFNLGdDQUFnQyxHQUFHLEtBQUssQ0FBQztBQUV0RDs7R0FFRztBQUNILE1BQU0sV0FBVztJQUFqQjtRQUNVLGtCQUFhLEdBQUcsSUFBSSxHQUFHLEVBQXlDLENBQUM7UUFDakUscUNBQWdDLEdBQUcsSUFBSSxHQUFHLEVBQXFCLENBQUM7UUFDaEUsd0JBQW1CLEdBQUcsSUFBSSxHQUFHLEVBQW9DLENBQUM7UUFDbEUsbUNBQThCLEdBQUcsSUFBSSxHQUFHLEVBQWdELENBQUM7SUEyUG5HLENBQUM7SUF6UEM7Ozs7T0FJRztJQUNLLHFCQUFxQjtRQUMzQixJQUFJLElBQUksQ0FBQyxnQ0FBZ0MsQ0FBQyxJQUFJLEtBQUssQ0FBQyxFQUFFO1lBQ3BELE9BQU87U0FDUjtRQUVELEtBQUssTUFBTSxVQUFVLElBQUksSUFBSSxDQUFDLGdDQUFnQyxFQUFFO1lB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ZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7cmVzb2x2ZUZvcndhcmRSZWZ9IGZyb20gJy4uLy4uL2RpJztcbmltcG9ydCB7UnVudGltZUVycm9yLCBSdW50aW1lRXJyb3JDb2RlfSBmcm9tICcuLi8uLi9lcnJvcnMnO1xuaW1wb3J0IHtUeXBlfSBmcm9tICcuLi8uLi9pbnRlcmZhY2UvdHlwZSc7XG5pbXBvcnQge05nTW9kdWxlVHlwZX0gZnJvbSAnLi4vLi4vbWV0YWRhdGEvbmdfbW9kdWxlX2RlZic7XG5pbXBvcnQge2ZsYXR0ZW59IGZyb20gJy4uLy4uL3V0aWwvYXJyYXlfdXRpbHMnO1xuaW1wb3J0IHtnZXRDb21wb25lbnREZWYsIGdldE5nTW9kdWxlRGVmLCBpc1N0YW5kYWxvbmV9IGZyb20gJy4uL2RlZmluaXRpb24nO1xuaW1wb3J0IHtDb21wb25lbnRUeXBlLCBOZ01vZHVsZVNjb3BlSW5mb0Zyb21EZWNvcmF0b3IsIFJhd1Njb3BlSW5mb0Zyb21EZWNvcmF0b3J9IGZyb20gJy4uL2ludGVyZmFjZXMvZGVmaW5pdGlvbic7XG5pbXBvcnQge2lzQ29tcG9uZW50LCBpc0RpcmVjdGl2ZSwgaXNOZ01vZHVsZSwgaXNQaXBlLCB2ZXJpZnlTdGFuZGFsb25lSW1wb3J0fSBmcm9tICcuLi9qaXQvdXRpbCc7XG5pbXBvcnQge21heWJlVW53cmFwRm59IGZyb20gJy4uL3V0aWwvbWlzY191dGlscyc7XG5cbmltcG9ydCB7Q29tcG9uZW50RGVwZW5kZW5jaWVzLCBEZXBzVHJhY2tlckFwaSwgTmdNb2R1bGVTY29wZSwgU3RhbmRhbG9uZUNvbXBvbmVudFNjb3BlfSBmcm9tICcuL2FwaSc7XG5cbi8qKlxuICogSW5kaWNhdGVzIHdoZXRoZXIgdG8gdXNlIHRoZSBydW50aW1lIGRlcGVuZGVuY3kgdHJhY2tlciBmb3Igc2NvcGUgY2FsY3VsYXRpb24gaW4gSklUIGNvbXBpbGF0aW9uLlxuICogVGhlIHZhbHVlIFwiZmFsc2VcIiBtZWFucyB0aGUgb2xkIGNvZGUgcGF0aCBiYXNlZCBvbiBwYXRjaGluZyBzY29wZSBpbmZvIGludG8gdGhlIHR5cGVzIHdpbGwgYmVcbiAqIHVzZWQuXG4gKlxuICogQGRlcHJlY2F0ZWQgRm9yIG1pZ3JhdGlvbiBwdXJwb3NlcyBvbmx5LCB0byBiZSByZW1vdmVkIHNvb24uXG4gKi9cbmV4cG9ydCBjb25zdCBVU0VfUlVOVElNRV9ERVBTX1RSQUNLRVJfRk9SX0pJVCA9IGZhbHNlO1xuXG4vKipcbiAqIEFuIGltcGxlbWVudGF0aW9uIG9mIERlcHNUcmFja2VyQXBpIHdoaWNoIHdpbGwgYmUgdXNlZCBmb3IgSklUIGFuZCBsb2NhbCBjb21waWxhdGlvbi5cbiAqL1xuY2xhc3MgRGVwc1RyYWNrZXIgaW1wbGVtZW50cyBEZXBzVHJhY2tlckFwaSB7XG4gIHByaXZhdGUgb3duZXJOZ01vZHVsZSA9IG5ldyBNYXA8Q29tcG9uZW50VHlwZTxhbnk+LCBOZ01vZHVsZVR5cGU8YW55Pj4oKTtcbiAgcHJpdmF0ZSBuZ01vZHVsZXNXaXRoU29tZVVucmVzb2x2ZWREZWNscyA9IG5ldyBTZXQ8TmdNb2R1bGVUeXBlPGFueT4+KCk7XG4gIHByaXZhdGUgbmdNb2R1bGVzU2NvcGVDYWNoZSA9IG5ldyBNYXA8TmdNb2R1bGVUeXBlPGFueT4sIE5nTW9kdWxlU2NvcGU+KCk7XG4gIHByaXZhdGUgc3RhbmRhbG9uZUNvbXBvbmVudHNTY29wZUNhY2hlID0gbmV3IE1hcDxDb21wb25lbnRUeXBlPGFueT4sIFN0YW5kYWxvbmVDb21wb25lbnRTY29wZT4oKTtcblxuICAvKipcbiAgICogQXR0ZW1wdHMgdG8gcmVzb2x2ZSBuZyBtb2R1bGUncyBmb3J3YXJkIHJlZiBkZWNsYXJhdGlvbnMgYXMgbXVjaCBhcyBwb3NzaWJsZSBhbmQgYWRkIHRoZW0gdG9cbiAgICogdGhlIGBvd25lck5nTW9kdWxlYCBtYXAuIFRoaXMgbWV0aG9kIG5vcm1hbGx5IHNob3VsZCBiZSBjYWxsZWQgYWZ0ZXIgdGhlIGluaXRpYWwgcGFyc2luZyB3aGVuXG4gICAqIGFsbCB0aGUgZm9yd2FyZCByZWZzIGFyZSByZXNvbHZlZCAoZS5nLiwgd2hlbiB0cnlpbmcgdG8gcmVuZGVyIGEgY29tcG9uZW50KVxuICAgKi9cbiAgcHJpdmF0ZSByZXNvbHZlTmdNb2R1bGVzRGVjbHMoKTogdm9pZCB7XG4gICAgaWYgKHRoaXMubmdNb2R1bGVzV2l0aFNvbWVVbnJlc29sdmVkRGVjbHMuc2l6ZSA9PT0gMCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGZvciAoY29uc3QgbW9kdWxlVHlwZSBvZiB0aGlzLm5nTW9kdWxlc1dpdGhTb21lVW5yZXNvbHZlZERlY2xzKSB7XG4gICAgICBjb25zdCBkZWYgPSBnZXROZ01vZHVsZURlZihtb2R1bGVUeXBlKTtcbiAgICAgIGlmIChkZWY/LmRlY2xhcmF0aW9ucykge1xuICAgICAgICBmb3IgKGNvbnN0IGRlY2wgb2YgbWF5YmVVbndyYXBGbihkZWYuZGVjbGFyYXRpb25zKSkge1xuICAgICAgICAgIGlmIChpc0NvbXBvbmVudChkZWNsKSkge1xuICAgICAgICAgICAgdGhpcy5vd25lck5nTW9kdWxlLnNldChkZWNsLCBtb2R1bGVUeXBlKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLm5nTW9kdWxlc1dpdGhTb21lVW5yZXNvbHZlZERlY2xzLmNsZWFyKCk7XG4gIH1cblxuICAvKiogQG92ZXJyaWRlICovXG4gIGdldENvbXBvbmVudERlcGVuZGVuY2llcyh0eXBlOiBDb21wb25lbnRUeXBlPGFueT4sIHJhd0ltcG9ydHM/OiBSYXdTY29wZUluZm9Gcm9tRGVjb3JhdG9yW10pOlxuICAgICAgQ29tcG9uZW50RGVwZW5kZW5jaWVzIHtcbiAgICB0aGlzLnJlc29sdmVOZ01vZHVsZXNEZWNscygpO1xuXG4gICAgY29uc3QgZGVmID0gZ2V0Q29tcG9uZW50RGVmKHR5cGUpO1xuICAgIGlmIChkZWYgPT09IG51bGwpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICBgQXR0ZW1wdGluZyB0byBnZXQgY29tcG9uZW50IGRlcGVuZGVuY2llcyBmb3IgYSB0eXBlIHRoYXQgaXMgbm90IGEgY29tcG9uZW50OiAke3R5cGV9YCk7XG4gICAgfVxuXG4gICAgaWYgKGRlZi5zdGFuZGFsb25lKSB7XG4gICAgICBjb25zdCBzY29wZSA9IHRoaXMuZ2V0U3RhbmRhbG9uZUNvbXBvbmVudFNjb3BlKHR5cGUsIHJhd0ltcG9ydHMpO1xuXG4gICAgICBpZiAoc2NvcGUuY29tcGlsYXRpb24uaXNQb2lzb25lZCkge1xuICAgICAgICByZXR1cm4ge2RlcGVuZGVuY2llczogW119O1xuICAgICAgfVxuXG4gICAgICByZXR1cm4ge1xuICAgICAgICBkZXBlbmRlbmNpZXM6IFtcbiAgICAgICAgICAuLi5zY29wZS5jb21waWxhdGlvbi5kaXJlY3RpdmVzLFxuICAgICAgICAgIC4uLnNjb3BlLmNvbXBpbGF0aW9uLnBpcGVzLFxuICAgICAgICBdXG4gICAgICB9O1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoIXRoaXMub3duZXJOZ01vZHVsZS5oYXModHlwZSkpIHtcbiAgICAgICAgdGhyb3cgbmV3IFJ1bnRpbWVFcnJvcihcbiAgICAgICAgICAgIFJ1bnRpbWVFcnJvckNvZGUuUlVOVElNRV9ERVBTX09SUEhBTl9DT01QT05FTlQsXG4gICAgICAgICAgICBgT3JwaGFuIGNvbXBvbmVudCBmb3VuZCEgVHJ5aW5nIHRvIHJlbmRlciB0aGUgY29tcG9uZW50ICR7XG4gICAgICAgICAgICAgICAgdHlwZS5uYW1lfSB3aXRob3V0IGZpcnN0IGxvYWRpbmcgdGhlIE5nTW9kdWxlIHRoYXQgZGVjbGFyZXMgaXQuIE1ha2Ugc3VyZSB0aGF0IHlvdSBpbXBvcnQgdGhlIGNvbXBvbmVudCdzIE5nTW9kdWxlIGluIHRoZSBOZ01vZHVsZSBvciB0aGUgc3RhbmRhbG9uZSBjb21wb25lbnQgaW4gd2hpY2ggeW91IGFyZSB0cnlpbmcgdG8gcmVuZGVyIHRoaXMgY29tcG9uZW50LiBBbHNvIG1ha2Ugc3VyZSB0aGUgd2F5IHRoZSBhcHAgaXMgYnVuZGxlZCBhbmQgc2VydmVkIGFsd2F5cyBpbmNsdWRlcyB0aGUgY29tcG9uZW50J3MgTmdNb2R1bGUgYmVmb3JlIHRoZSBjb21wb25lbnQuYCk7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHNjb3BlID0gdGhpcy5nZXROZ01vZHVsZVNjb3BlKHRoaXMub3duZXJOZ01vZHVsZS5nZXQodHlwZSkhKTtcblxuICAgICAgaWYgKHNjb3BlLmNvbXBpbGF0aW9uLmlzUG9pc29uZWQpIHtcbiAgICAgICAgcmV0dXJuIHtkZXBlbmRlbmNpZXM6IFtdfTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgZGVwZW5kZW5jaWVzOiBbXG4gICAgICAgICAgLi4uc2NvcGUuY29tcGlsYXRpb24uZGlyZWN0aXZlcyxcbiAgICAgICAgICAuLi5zY29wZS5jb21waWxhdGlvbi5waXBlcyxcbiAgICAgICAgXSxcbiAgICAgIH07XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEBvdmVycmlkZVxuICAgKiBUaGlzIGltcGxlbWVudGF0aW9uIGRvZXMgbm90IG1ha2UgdXNlIG9mIHBhcmFtIHNjb3BlSW5mbyBzaW5jZSBpdCBhc3N1bWVzIHRoZSBzY29wZSBpbmZvIGlzXG4gICAqIGFscmVhZHkgYWRkZWQgdG8gdGhlIHR5cGUgaXRzZWxmIHRocm91Z2ggbWV0aG9kcyBsaWtlIHtAbGluayDJtcm1c2V0TmdNb2R1bGVTY29wZX1cbiAgICovXG4gIHJlZ2lzdGVyTmdNb2R1bGUodHlwZTogVHlwZTxhbnk+LCBzY29wZUluZm86IE5nTW9kdWxlU2NvcGVJbmZvRnJvbURlY29yYXRvcik6IHZvaWQge1xuICAgIGlmICghaXNOZ01vZHVsZSh0eXBlKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBBdHRlbXB0aW5nIHRvIHJlZ2lzdGVyIGEgVHlwZSB3aGljaCBpcyBub3QgTmdNb2R1bGUgYXMgTmdNb2R1bGU6ICR7dHlwZX1gKTtcbiAgICB9XG5cbiAgICAvLyBMYXppbHkgcHJvY2VzcyB0aGUgTmdNb2R1bGVzIGxhdGVyIHdoZW4gbmVlZGVkLlxuICAgIHRoaXMubmdNb2R1bGVzV2l0aFNvbWVVbnJlc29sdmVkRGVjbHMuYWRkKHR5cGUpO1xuICB9XG5cbiAgLyoqIEBvdmVycmlkZSAqL1xuICBjbGVhclNjb3BlQ2FjaGVGb3IodHlwZTogVHlwZTxhbnk+KTogdm9pZCB7XG4gICAgaWYgKGlzTmdNb2R1bGUodHlwZSkpIHtcbiAgICAgIHRoaXMubmdNb2R1bGVzU2NvcGVDYWNoZS5kZWxldGUodHlwZSk7XG4gICAgfSBlbHNlIGlmIChpc0NvbXBvbmVudCh0eXBlKSkge1xuICAgICAgdGhpcy5zdGFuZGFsb25lQ29tcG9uZW50c1Njb3BlQ2FjaGUuZGVsZXRlKHR5cGUpO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBAb3ZlcnJpZGUgKi9cbiAgZ2V0TmdNb2R1bGVTY29wZSh0eXBlOiBOZ01vZHVsZVR5cGU8YW55Pik6IE5nTW9kdWxlU2NvcGUge1xuICAgIGlmICh0aGlzLm5nTW9kdWxlc1Njb3BlQ2FjaGUuaGFzKHR5cGUpKSB7XG4gICAgICByZXR1cm4gdGhpcy5uZ01vZHVsZXNTY29wZUNhY2hlLmdldCh0eXBlKSE7XG4gICAgfVxuXG4gICAgY29uc3Qgc2NvcGUgPSB0aGlzLmNvbXB1dGVOZ01vZHVsZVNjb3BlKHR5cGUpO1xuICAgIHRoaXMubmdNb2R1bGVzU2NvcGVDYWNoZS5zZXQodHlwZSwgc2NvcGUpO1xuXG4gICAgcmV0dXJuIHNjb3BlO1xuICB9XG5cbiAgLyoqIENvbXB1dGUgTmdNb2R1bGUgc2NvcGUgYWZyZXNoLiAqL1xuICBwcml2YXRlIGNvbXB1dGVOZ01vZHVsZVNjb3BlKHR5cGU6IE5nTW9kdWxlVHlwZTxhbnk+KTogTmdNb2R1bGVTY29wZSB7XG4gICAgY29uc3QgZGVmID0gZ2V0TmdNb2R1bGVEZWYodHlwZSwgdHJ1ZSk7XG4gICAgY29uc3Qgc2NvcGU6IE5nTW9kdWxlU2NvcGUgPSB7XG4gICAgICBleHBvcnRlZDoge2RpcmVjdGl2ZXM6IG5ldyBTZXQoKSwgcGlwZXM6IG5ldyBTZXQoKX0sXG4gICAgICBjb21waWxhdGlvbjoge2RpcmVjdGl2ZXM6IG5ldyBTZXQoKSwgcGlwZXM6IG5ldyBTZXQoKX0sXG4gICAgfTtcblxuICAgIC8vIEFuYWx5emluZyBpbXBvcnRzXG4gICAgZm9yIChjb25zdCBpbXBvcnRlZCBvZiBtYXliZVVud3JhcEZuKGRlZi5pbXBvcnRzKSkge1xuICAgICAgaWYgKGlzTmdNb2R1bGUoaW1wb3J0ZWQpKSB7XG4gICAgICAgIGNvbnN0IGltcG9ydGVkU2NvcGUgPSB0aGlzLmdldE5nTW9kdWxlU2NvcGUoaW1wb3J0ZWQpO1xuXG4gICAgICAgIC8vIFdoZW4gdGhpcyBtb2R1bGUgaW1wb3J0cyBhbm90aGVyLCB0aGUgaW1wb3J0ZWQgbW9kdWxlJ3MgZXhwb3J0ZWQgZGlyZWN0aXZlcyBhbmQgcGlwZXNcbiAgICAgICAgLy8gYXJlIGFkZGVkIHRvIHRoZSBjb21waWxhdGlvbiBzY29wZSBvZiB0aGlzIG1vZHVsZS5cbiAgICAgICAgYWRkU2V0KGltcG9ydGVkU2NvcGUuZXhwb3J0ZWQuZGlyZWN0aXZlcywgc2NvcGUuY29tcGlsYXRpb24uZGlyZWN0aXZlcyk7XG4gICAgICAgIGFkZFNldChpbXBvcnRlZFNjb3BlLmV4cG9ydGVkLnBpcGVzLCBzY29wZS5jb21waWxhdGlvbi5waXBlcyk7XG4gICAgICB9IGVsc2UgaWYgKGlzU3RhbmRhbG9uZShpbXBvcnRlZCkpIHtcbiAgICAgICAgaWYgKGlzRGlyZWN0aXZlKGltcG9ydGVkKSB8fCBpc0NvbXBvbmVudChpbXBvcnRlZCkpIHtcbiAgICAgICAgICBzY29wZS5jb21waWxhdGlvbi5kaXJlY3RpdmVzLmFkZChpbXBvcnRlZCk7XG4gICAgICAgIH0gZWxzZSBpZiAoaXNQaXBlKGltcG9ydGVkKSkge1xuICAgICAgICAgIHNjb3BlLmNvbXBpbGF0aW9uLnBpcGVzLmFkZChpbXBvcnRlZCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gVGhlIHN0YW5kYWxvbmUgdGhpbmcgaXMgbmVpdGhlciBhIGNvbXBvbmVudCBub3IgYSBkaXJlY3RpdmUgbm9yIGEgcGlwZSAuLi4gKHdoYXQ/KVxuICAgICAgICAgIHRocm93IG5ldyBSdW50aW1lRXJyb3IoXG4gICAgICAgICAgICAgIFJ1bnRpbWVFcnJvckNvZGUuUlVOVElNRV9ERVBTX0lOVkFMSURfSU1QT1JURURfVFlQRSxcbiAgICAgICAgICAgICAgJ1RoZSBzdGFuZGFsb25lIGltcG9ydGVkIHR5cGUgaXMgbmVpdGhlciBhIGNvbXBvbmVudCBub3IgYSBkaXJlY3RpdmUgbm9yIGEgcGlwZScpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBUaGUgaW1wb3J0IGlzIG5laXRoZXIgYSBtb2R1bGUgbm9yIGEgbW9kdWxlLXdpdGgtcHJvdmlkZXJzIG5vciBhIHN0YW5kYWxvbmUgdGhpbmcuIFRoaXNcbiAgICAgICAgLy8gaXMgZ29pbmcgdG8gYmUgYW4gZXJyb3IuIFNvIHdlIHNob3J0IGNpcmN1aXQuXG4gICAgICAgIHNjb3BlLmNvbXBpbGF0aW9uLmlzUG9pc29uZWQgPSB0cnVlO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBBbmFseXppbmcgZGVjbGFyYXRpb25zXG4gICAgaWYgKCFzY29wZS5jb21waWxhdGlvbi5pc1BvaXNvbmVkKSB7XG4gICAgICBmb3IgKGNvbnN0IGRlY2wgb2YgbWF5YmVVbndyYXBGbihkZWYuZGVjbGFyYXRpb25zKSkge1xuICAgICAgICAvLyBDYW5ub3QgZGVjbGFyZSBhbm90aGVyIE5nTW9kdWxlIG9yIGEgc3RhbmRhbG9uZSB0aGluZ1xuICAgICAgICBpZiAoaXNOZ01vZHVsZShkZWNsKSB8fCBpc1N0YW5kYWxvbmUoZGVjbCkpIHtcbiAgICAgICAgICBzY29wZS5jb21waWxhdGlvbi5pc1BvaXNvbmVkID0gdHJ1ZTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChpc1BpcGUoZGVjbCkpIHtcbiAgICAgICAgICBzY29wZS5jb21waWxhdGlvbi5waXBlcy5hZGQoZGVjbCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gZGVjbCBpcyBlaXRoZXIgYSBkaXJlY3RpdmUgb3IgYSBjb21wb25lbnQuIFRoZSBjb21wb25lbnQgbWF5IG5vdCB5ZXQgaGF2ZSB0aGUgybVjbXAgZHVlXG4gICAgICAgICAgLy8gdG8gYXN5bmMgY29tcGlsYXRpb24uXG4gICAgICAgICAgc2NvcGUuY29tcGlsYXRpb24uZGlyZWN0aXZlcy5hZGQoZGVjbCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBBbmFseXppbmcgZXhwb3J0c1xuICAgIGZvciAoY29uc3QgZXhwb3J0ZWQgb2YgbWF5YmVVbndyYXBGbihkZWYuZXhwb3J0cykpIHtcbiAgICAgIGlmIChpc05nTW9kdWxlKGV4cG9ydGVkKSkge1xuICAgICAgICAvLyBXaGVuIHRoaXMgbW9kdWxlIGV4cG9ydHMgYW5vdGhlciwgdGhlIGV4cG9ydGVkIG1vZHVsZSdzIGV4cG9ydGVkIGRpcmVjdGl2ZXMgYW5kIHBpcGVzXG4gICAgICAgIC8vIGFyZSBhZGRlZCB0byBib3RoIHRoZSBjb21waWxhdGlvbiBhbmQgZXhwb3J0ZWQgc2NvcGVzIG9mIHRoaXMgbW9kdWxlLlxuICAgICAgICBjb25zdCBleHBvcnRlZFNjb3BlID0gdGhpcy5nZXROZ01vZHVsZVNjb3BlKGV4cG9ydGVkKTtcblxuICAgICAgICAvLyBCYXNlZCBvbiB0aGUgY3VycmVudCBsb2dpYyB0aGVyZSBpcyBubyB3YXkgdG8gaGF2ZSBwb2lzb25lZCBleHBvcnRlZCBzY29wZS4gU28gbm8gbmVlZCB0b1xuICAgICAgICAvLyBjaGVjayBmb3IgaXQuXG4gICAgICAgIGFkZFNldChleHBvcnRlZFNjb3BlLmV4cG9ydGVkLmRpcmVjdGl2ZXMsIHNjb3BlLmV4cG9ydGVkLmRpcmVjdGl2ZXMpO1xuICAgICAgICBhZGRTZXQoZXhwb3J0ZWRTY29wZS5leHBvcnRlZC5waXBlcywgc2NvcGUuZXhwb3J0ZWQucGlwZXMpO1xuXG4gICAgICAgIC8vIFNvbWUgdGVzdCB0b29saW5ncyB3aGljaCBydW4gaW4gSklUIG1vZGUgZGVwZW5kIG9uIHRoaXMgYmVoYXZpb3IgdGhhdCB0aGUgZXhwb3J0ZWQgc2NvcGVcbiAgICAgICAgLy8gc2hvdWxkIGFsc28gYmUgcHJlc2VudCBpbiB0aGUgY29tcGlsYXRpb24gc2NvcGUsIGV2ZW4gdGhvdWdoIEFvVCBkb2VzIG5vdCBzdXBwb3J0IHRoaXNcbiAgICAgICAgLy8gYW5kIGl0IGlzIGFsc28gaW4gb2RkcyB3aXRoIE5nTW9kdWxlIG1ldGFkYXRhIGRlZmluaXRpb25zLiBXaXRob3V0IHRoaXMgc29tZSB0ZXN0cyBpblxuICAgICAgICAvLyBHb29nbGUgd2lsbCBmYWlsLlxuICAgICAgICBhZGRTZXQoZXhwb3J0ZWRTY29wZS5leHBvcnRlZC5kaXJlY3RpdmVzLCBzY29wZS5jb21waWxhdGlvbi5kaXJlY3RpdmVzKTtcbiAgICAgICAgYWRkU2V0KGV4cG9ydGVkU2NvcGUuZXhwb3J0ZWQucGlwZXMsIHNjb3BlLmNvbXBpbGF0aW9uLnBpcGVzKTtcbiAgICAgIH0gZWxzZSBpZiAoaXNQaXBlKGV4cG9ydGVkKSkge1xuICAgICAgICBzY29wZS5leHBvcnRlZC5waXBlcy5hZGQoZXhwb3J0ZWQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc2NvcGUuZXhwb3J0ZWQuZGlyZWN0aXZlcy5hZGQoZXhwb3J0ZWQpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBzY29wZTtcbiAgfVxuXG4gIC8qKiBAb3ZlcnJpZGUgKi9cbiAgZ2V0U3RhbmRhbG9uZUNvbXBvbmVudFNjb3BlKHR5cGU6IENvbXBvbmVudFR5cGU8YW55PiwgcmF3SW1wb3J0cz86IFJhd1Njb3BlSW5mb0Zyb21EZWNvcmF0b3JbXSk6XG4gICAgICBTdGFuZGFsb25lQ29tcG9uZW50U2NvcGUge1xuICAgIGlmICh0aGlzLnN0YW5kYWxvbmVDb21wb25lbnRzU2NvcGVDYWNoZS5oYXModHlwZSkpIHtcbiAgICAgIHJldHVybiB0aGlzLnN0YW5kYWxvbmVDb21wb25lbnRzU2NvcGVDYWNoZS5nZXQodHlwZSkhO1xuICAgIH1cblxuICAgIGNvbnN0IGFucyA9IHRoaXMuY29tcHV0ZVN0YW5kYWxvbmVDb21wb25lbnRTY29wZSh0eXBlLCByYXdJbXBvcnRzKTtcbiAgICB0aGlzLnN0YW5kYWxvbmVDb21wb25lbnRzU2NvcGVDYWNoZS5zZXQodHlwZSwgYW5zKTtcblxuICAgIHJldHVybiBhbnM7XG4gIH1cblxuICBwcml2YXRlIGNvbXB1dGVTdGFuZGFsb25lQ29tcG9uZW50U2NvcGUoXG4gICAgICB0eXBlOiBDb21wb25lbnRUeXBlPGFueT4sXG4gICAgICByYXdJbXBvcnRzPzogUmF3U2NvcGVJbmZvRnJvbURlY29yYXRvcltdKTogU3RhbmRhbG9uZUNvbXBvbmVudFNjb3BlIHtcbiAgICBjb25zdCBhbnM6IFN0YW5kYWxvbmVDb21wb25lbnRTY29wZSA9IHtcbiAgICAgIGNvbXBpbGF0aW9uOiB7XG4gICAgICAgIC8vIFN0YW5kYWxvbmUgY29tcG9uZW50cyBhcmUgYWx3YXlzIGFibGUgdG8gc2VsZi1yZWZlcmVuY2UuXG4gICAgICAgIGRpcmVjdGl2ZXM6IG5ldyBTZXQoW3R5cGVdKSxcbiAgICAgICAgcGlwZXM6IG5ldyBTZXQoKSxcbiAgICAgIH0sXG4gICAgfTtcblxuICAgIGZvciAoY29uc3QgcmF3SW1wb3J0IG9mIGZsYXR0ZW4ocmF3SW1wb3J0cyA/PyBbXSkpIHtcbiAgICAgIGNvbnN0IGltcG9ydGVkID0gcmVzb2x2ZUZvcndhcmRSZWYocmF3SW1wb3J0KSBhcyBUeXBlPGFueT47XG5cbiAgICAgIHRyeSB7XG4gICAgICAgIHZlcmlmeVN0YW5kYWxvbmVJbXBvcnQoaW1wb3J0ZWQsIHR5cGUpO1xuICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAvLyBTaG9ydC1jaXJjdWl0IGlmIGFuIGltcG9ydCBpcyBub3QgdmFsaWRcbiAgICAgICAgYW5zLmNvbXBpbGF0aW9uLmlzUG9pc29uZWQgPSB0cnVlO1xuICAgICAgICByZXR1cm4gYW5zO1xuICAgICAgfVxuXG4gICAgICBpZiAoaXNOZ01vZHVsZShpbXBvcnRlZCkpIHtcbiAgICAgICAgY29uc3QgaW1wb3J0ZWRTY29wZSA9IHRoaXMuZ2V0TmdNb2R1bGVTY29wZShpbXBvcnRlZCk7XG5cbiAgICAgICAgLy8gU2hvcnQtY2lyY3VpdCBpZiBhbiBpbXBvcnRlZCBOZ01vZHVsZSBoYXMgY29ycnVwdGVkIGV4cG9ydGVkIHNjb3BlLlxuICAgICAgICBpZiAoaW1wb3J0ZWRTY29wZS5leHBvcnRlZC5pc1BvaXNvbmVkKSB7XG4gICAgICAgICAgYW5zLmNvbXBpbGF0aW9uLmlzUG9pc29uZWQgPSB0cnVlO1xuICAgICAgICAgIHJldHVybiBhbnM7XG4gICAgICAgIH1cblxuICAgICAgICBhZGRTZXQoaW1wb3J0ZWRTY29wZS5leHBvcnRlZC5kaXJlY3RpdmVzLCBhbnMuY29tcGlsYXRpb24uZGlyZWN0aXZlcyk7XG4gICAgICAgIGFkZFNldChpbXBvcnRlZFNjb3BlLmV4cG9ydGVkLnBpcGVzLCBhbnMuY29tcGlsYXRpb24ucGlwZXMpO1xuICAgICAgfSBlbHNlIGlmIChpc1BpcGUoaW1wb3J0ZWQpKSB7XG4gICAgICAgIGFucy5jb21waWxhdGlvbi5waXBlcy5hZGQoaW1wb3J0ZWQpO1xuICAgICAgfSBlbHNlIGlmIChpc0RpcmVjdGl2ZShpbXBvcnRlZCkgfHwgaXNDb21wb25lbnQoaW1wb3J0ZWQpKSB7XG4gICAgICAgIGFucy5jb21waWxhdGlvbi5kaXJlY3RpdmVzLmFkZChpbXBvcnRlZCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBUaGUgaW1wb3J0ZWQgdGhpbmcgaXMgbm90IG1vZHVsZS9waXBlL2RpcmVjdGl2ZS9jb21wb25lbnQsIHNvIHdlIGVycm9yIGFuZCBzaG9ydC1jaXJjdWl0XG4gICAgICAgIC8vIGhlcmVcbiAgICAgICAgYW5zLmNvbXBpbGF0aW9uLmlzUG9pc29uZWQgPSB0cnVlO1xuICAgICAgICByZXR1cm4gYW5zO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBhbnM7XG4gIH1cbn1cblxuZnVuY3Rpb24gYWRkU2V0PFQ+KHNvdXJjZVNldDogU2V0PFQ+LCB0YXJnZXRTZXQ6IFNldDxUPik6IHZvaWQge1xuICBmb3IgKGNvbnN0IG0gb2Ygc291cmNlU2V0KSB7XG4gICAgdGFyZ2V0U2V0LmFkZChtKTtcbiAgfVxufVxuXG4vKiogVGhlIGRlcHMgdHJhY2tlciB0byBiZSB1c2VkIGluIHRoZSBjdXJyZW50IEFuZ3VsYXIgYXBwIGluIGRldiBtb2RlLiAqL1xuZXhwb3J0IGNvbnN0IGRlcHNUcmFja2VyID0gbmV3IERlcHNUcmFja2VyKCk7XG5cbmV4cG9ydCBjb25zdCBURVNUX09OTFkgPSB7RGVwc1RyYWNrZXJ9O1xuIl19