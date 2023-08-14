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
export const USE_RUNTIME_DEPS_TRACKER_FOR_JIT = true;
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
            if (!rawImports) {
                throw new Error('Standalone component should pass its raw import in order to compute its dependencies');
            }
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
        this.ngModulesScopeCache.delete(type);
        this.standaloneComponentsScopeCache.delete(type);
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
        for (const rawImport of rawImports) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVwc190cmFja2VyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9kZXBzX3RyYWNrZXIvZGVwc190cmFja2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBQyxpQkFBaUIsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUMzQyxPQUFPLEVBQUMsWUFBWSxFQUFtQixNQUFNLGNBQWMsQ0FBQztBQUc1RCxPQUFPLEVBQUMsZUFBZSxFQUFFLGNBQWMsRUFBRSxZQUFZLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFFNUUsT0FBTyxFQUFDLFdBQVcsRUFBRSxXQUFXLEVBQUUsVUFBVSxFQUFFLE1BQU0sRUFBRSxzQkFBc0IsRUFBQyxNQUFNLGFBQWEsQ0FBQztBQUNqRyxPQUFPLEVBQUMsYUFBYSxFQUFDLE1BQU0sb0JBQW9CLENBQUM7QUFJakQ7Ozs7OztHQU1HO0FBQ0gsTUFBTSxDQUFDLE1BQU0sZ0NBQWdDLEdBQUcsSUFBSSxDQUFDO0FBRXJEOztHQUVHO0FBQ0gsTUFBTSxXQUFXO0lBQWpCO1FBQ1Usa0JBQWEsR0FBRyxJQUFJLEdBQUcsRUFBeUMsQ0FBQztRQUNqRSxxQ0FBZ0MsR0FBRyxJQUFJLEdBQUcsRUFBcUIsQ0FBQztRQUNoRSx3QkFBbUIsR0FBRyxJQUFJLEdBQUcsRUFBb0MsQ0FBQztRQUNsRSxtQ0FBOEIsR0FBRyxJQUFJLEdBQUcsRUFBZ0QsQ0FBQztJQXFQbkcsQ0FBQztJQW5QQzs7OztPQUlHO0lBQ0sscUJBQXFCO1FBQzNCLElBQUksSUFBSSxDQUFDLGdDQUFnQyxDQUFDLElBQUksS0FBSyxDQUFDLEVBQUU7WUFDcEQsT0FBTztTQUNSO1FBRUQsS0FBSyxNQUFNLFVBQVUsSUFBSSxJQUFJLENBQUMsZ0NBQWdDLEVBQUU7WUFDOUQsTUFBTSxHQUFHLEdBQUcsY0FBYyxDQUFDLFVBQVUsQ0FBQyxDQUFD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R0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDO2FBQ3JDO2lCQUFNLElBQUksV0FBVyxDQUFDLFFBQVEsQ0FBQyxJQUFJLFdBQVcsQ0FBQyxRQUFRLENBQUMsRUFBRTtnQkFDekQsR0FBRyxDQUFDLFdBQVcsQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDO2FBQzFDO2lCQUFNO2dCQUNMLDJGQUEyRjtnQkFDM0YsT0FBTztnQkFDUCxHQUFHLENBQUMsV0FBVyxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUM7Z0JBQ2xDLE9BQU8sR0FBRyxDQUFDO2FBQ1o7U0FDRjtRQUVELE9BQU8sR0FBRyxDQUFDO0lBQ2IsQ0FBQztDQUNGO0FBRUQsU0FBUyxNQUFNLENBQUksU0FBaUIsRUFBRSxTQUFpQjtJQUNyRCxLQUFLLE1BQU0sQ0FBQyxJQUFJLFNBQVMsRUFBRTtRQUN6QixTQUFTLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO0tBQ2xCO0FBQ0gsQ0FBQztBQUVELDBFQUEwRTtBQUMxRSxNQUFNLENBQUMsTUFBTSxXQUFXLEdBQUcsSUFBSSxXQUFXLEVBQUUsQ0FBQztBQUU3QyxNQUFNLENBQUMsTUFBTSxTQUFTLEdBQUcsRUFBQyxXQUFXLEVBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge3Jlc29sdmVGb3J3YXJkUmVmfSBmcm9tICcuLi8uLi9kaSc7XG5pbXBvcnQge1J1bnRpbWVFcnJvciwgUnVudGltZUVycm9yQ29kZX0gZnJvbSAnLi4vLi4vZXJyb3JzJztcbmltcG9ydCB7VHlwZX0gZnJvbSAnLi4vLi4vaW50ZXJmYWNlL3R5cGUnO1xuaW1wb3J0IHtOZ01vZHVsZVR5cGV9IGZyb20gJy4uLy4uL21ldGFkYXRhL25nX21vZHVsZV9kZWYnO1xuaW1wb3J0IHtnZXRDb21wb25lbnREZWYsIGdldE5nTW9kdWxlRGVmLCBpc1N0YW5kYWxvbmV9IGZyb20gJy4uL2RlZmluaXRpb24nO1xuaW1wb3J0IHtDb21wb25lbnRUeXBlLCBOZ01vZHVsZVNjb3BlSW5mb0Zyb21EZWNvcmF0b3J9IGZyb20gJy4uL2ludGVyZmFjZXMvZGVmaW5pdGlvbic7XG5pbXBvcnQge2lzQ29tcG9uZW50LCBpc0RpcmVjdGl2ZSwgaXNOZ01vZHVsZSwgaXNQaXBlLCB2ZXJpZnlTdGFuZGFsb25lSW1wb3J0fSBmcm9tICcuLi9qaXQvdXRpbCc7XG5pbXBvcnQge21heWJlVW53cmFwRm59IGZyb20gJy4uL3V0aWwvbWlzY191dGlscyc7XG5cbmltcG9ydCB7Q29tcG9uZW50RGVwZW5kZW5jaWVzLCBEZXBzVHJhY2tlckFwaSwgTmdNb2R1bGVTY29wZSwgU3RhbmRhbG9uZUNvbXBvbmVudFNjb3BlfSBmcm9tICcuL2FwaSc7XG5cbi8qKlxuICogSW5kaWNhdGVzIHdoZXRoZXIgdG8gdXNlIHRoZSBydW50aW1lIGRlcGVuZGVuY3kgdHJhY2tlciBmb3Igc2NvcGUgY2FsY3VsYXRpb24gaW4gSklUIGNvbXBpbGF0aW9uLlxuICogVGhlIHZhbHVlIFwiZmFsc2VcIiBtZWFucyB0aGUgb2xkIGNvZGUgcGF0aCBiYXNlZCBvbiBwYXRjaGluZyBzY29wZSBpbmZvIGludG8gdGhlIHR5cGVzIHdpbGwgYmVcbiAqIHVzZWQuXG4gKlxuICogQGRlcHJlY2F0ZWQgRm9yIG1pZ3JhdGlvbiBwdXJwb3NlcyBvbmx5LCB0byBiZSByZW1vdmVkIHNvb24uXG4gKi9cbmV4cG9ydCBjb25zdCBVU0VfUlVOVElNRV9ERVBTX1RSQUNLRVJfRk9SX0pJVCA9IHRydWU7XG5cbi8qKlxuICogQW4gaW1wbGVtZW50YXRpb24gb2YgRGVwc1RyYWNrZXJBcGkgd2hpY2ggd2lsbCBiZSB1c2VkIGZvciBKSVQgYW5kIGxvY2FsIGNvbXBpbGF0aW9uLlxuICovXG5jbGFzcyBEZXBzVHJhY2tlciBpbXBsZW1lbnRzIERlcHNUcmFja2VyQXBpIHtcbiAgcHJpdmF0ZSBvd25lck5nTW9kdWxlID0gbmV3IE1hcDxDb21wb25lbnRUeXBlPGFueT4sIE5nTW9kdWxlVHlwZTxhbnk+PigpO1xuICBwcml2YXRlIG5nTW9kdWxlc1dpdGhTb21lVW5yZXNvbHZlZERlY2xzID0gbmV3IFNldDxOZ01vZHVsZVR5cGU8YW55Pj4oKTtcbiAgcHJpdmF0ZSBuZ01vZHVsZXNTY29wZUNhY2hlID0gbmV3IE1hcDxOZ01vZHVsZVR5cGU8YW55PiwgTmdNb2R1bGVTY29wZT4oKTtcbiAgcHJpdmF0ZSBzdGFuZGFsb25lQ29tcG9uZW50c1Njb3BlQ2FjaGUgPSBuZXcgTWFwPENvbXBvbmVudFR5cGU8YW55PiwgU3RhbmRhbG9uZUNvbXBvbmVudFNjb3BlPigpO1xuXG4gIC8qKlxuICAgKiBBdHRlbXB0cyB0byByZXNvbHZlIG5nIG1vZHVsZSdzIGZvcndhcmQgcmVmIGRlY2xhcmF0aW9ucyBhcyBtdWNoIGFzIHBvc3NpYmxlIGFuZCBhZGQgdGhlbSB0b1xuICAgKiB0aGUgYG93bmVyTmdNb2R1bGVgIG1hcC4gVGhpcyBtZXRob2Qgbm9ybWFsbHkgc2hvdWxkIGJlIGNhbGxlZCBhZnRlciB0aGUgaW5pdGlhbCBwYXJzaW5nIHdoZW5cbiAgICogYWxsIHRoZSBmb3J3YXJkIHJlZnMgYXJlIHJlc29sdmVkIChlLmcuLCB3aGVuIHRyeWluZyB0byByZW5kZXIgYSBjb21wb25lbnQpXG4gICAqL1xuICBwcml2YXRlIHJlc29sdmVOZ01vZHVsZXNEZWNscygpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5uZ01vZHVsZXNXaXRoU29tZVVucmVzb2x2ZWREZWNscy5zaXplID09PSAwKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgZm9yIChjb25zdCBtb2R1bGVUeXBlIG9mIHRoaXMubmdNb2R1bGVzV2l0aFNvbWVVbnJlc29sdmVkRGVjbHMpIHtcbiAgICAgIGNvbnN0IGRlZiA9IGdldE5nTW9kdWxlRGVmKG1vZHVsZVR5cGUpO1xuICAgICAgaWYgKGRlZj8uZGVjbGFyYXRpb25zKSB7XG4gICAgICAgIGZvciAoY29uc3QgZGVjbCBvZiBtYXliZVVud3JhcEZuKGRlZi5kZWNsYXJhdGlvbnMpKSB7XG4gICAgICAgICAgaWYgKGlzQ29tcG9uZW50KGRlY2wpKSB7XG4gICAgICAgICAgICB0aGlzLm93bmVyTmdNb2R1bGUuc2V0KGRlY2wsIG1vZHVsZVR5cGUpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMubmdNb2R1bGVzV2l0aFNvbWVVbnJlc29sdmVkRGVjbHMuY2xlYXIoKTtcbiAgfVxuXG4gIC8qKiBAb3ZlcnJpZGUgKi9cbiAgZ2V0Q29tcG9uZW50RGVwZW5kZW5jaWVzKHR5cGU6IENvbXBvbmVudFR5cGU8YW55PiwgcmF3SW1wb3J0cz86IChUeXBlPGFueT58KCgpID0+IFR5cGU8YW55PikpW10pOlxuICAgICAgQ29tcG9uZW50RGVwZW5kZW5jaWVzIHtcbiAgICB0aGlzLnJlc29sdmVOZ01vZHVsZXNEZWNscygpO1xuXG4gICAgY29uc3QgZGVmID0gZ2V0Q29tcG9uZW50RGVmKHR5cGUpO1xuICAgIGlmIChkZWYgPT09IG51bGwpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICBgQXR0ZW1wdGluZyB0byBnZXQgY29tcG9uZW50IGRlcGVuZGVuY2llcyBmb3IgYSB0eXBlIHRoYXQgaXMgbm90IGEgY29tcG9uZW50OiAke3R5cGV9YCk7XG4gICAgfVxuXG4gICAgaWYgKGRlZi5zdGFuZGFsb25lKSB7XG4gICAgICBpZiAoIXJhd0ltcG9ydHMpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgICAgJ1N0YW5kYWxvbmUgY29tcG9uZW50IHNob3VsZCBwYXNzIGl0cyByYXcgaW1wb3J0IGluIG9yZGVyIHRvIGNvbXB1dGUgaXRzIGRlcGVuZGVuY2llcycpO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBzY29wZSA9IHRoaXMuZ2V0U3RhbmRhbG9uZUNvbXBvbmVudFNjb3BlKHR5cGUsIHJhd0ltcG9ydHMpO1xuXG4gICAgICBpZiAoc2NvcGUuY29tcGlsYXRpb24uaXNQb2lzb25lZCkge1xuICAgICAgICByZXR1cm4ge2RlcGVuZGVuY2llczogW119O1xuICAgICAgfVxuXG4gICAgICByZXR1cm4ge1xuICAgICAgICBkZXBlbmRlbmNpZXM6IFtcbiAgICAgICAgICAuLi5zY29wZS5jb21waWxhdGlvbi5kaXJlY3RpdmVzLFxuICAgICAgICAgIC4uLnNjb3BlLmNvbXBpbGF0aW9uLnBpcGVzLFxuICAgICAgICBdXG4gICAgICB9O1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoIXRoaXMub3duZXJOZ01vZHVsZS5oYXModHlwZSkpIHtcbiAgICAgICAgcmV0dXJuIHtkZXBlbmRlbmNpZXM6IFtdfTtcbiAgICAgIH1cblxuICAgICAgY29uc3Qgc2NvcGUgPSB0aGlzLmdldE5nTW9kdWxlU2NvcGUodGhpcy5vd25lck5nTW9kdWxlLmdldCh0eXBlKSEpO1xuXG4gICAgICBpZiAoc2NvcGUuY29tcGlsYXRpb24uaXNQb2lzb25lZCkge1xuICAgICAgICByZXR1cm4ge2RlcGVuZGVuY2llczogW119O1xuICAgICAgfVxuXG4gICAgICByZXR1cm4ge1xuICAgICAgICBkZXBlbmRlbmNpZXM6IFtcbiAgICAgICAgICAuLi5zY29wZS5jb21waWxhdGlvbi5kaXJlY3RpdmVzLFxuICAgICAgICAgIC4uLnNjb3BlLmNvbXBpbGF0aW9uLnBpcGVzLFxuICAgICAgICBdLFxuICAgICAgfTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQG92ZXJyaWRlXG4gICAqIFRoaXMgaW1wbGVtZW50YXRpb24gZG9lcyBub3QgbWFrZSB1c2Ugb2YgcGFyYW0gc2NvcGVJbmZvIHNpbmNlIGl0IGFzc3VtZXMgdGhlIHNjb3BlIGluZm8gaXNcbiAgICogYWxyZWFkeSBhZGRlZCB0byB0aGUgdHlwZSBpdHNlbGYgdGhyb3VnaCBtZXRob2RzIGxpa2Uge0BsaW5rIMm1ybVzZXROZ01vZHVsZVNjb3BlfVxuICAgKi9cbiAgcmVnaXN0ZXJOZ01vZHVsZSh0eXBlOiBUeXBlPGFueT4sIHNjb3BlSW5mbzogTmdNb2R1bGVTY29wZUluZm9Gcm9tRGVjb3JhdG9yKTogdm9pZCB7XG4gICAgaWYgKCFpc05nTW9kdWxlKHR5cGUpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYEF0dGVtcHRpbmcgdG8gcmVnaXN0ZXIgYSBUeXBlIHdoaWNoIGlzIG5vdCBOZ01vZHVsZSBhcyBOZ01vZHVsZTogJHt0eXBlfWApO1xuICAgIH1cblxuICAgIC8vIExhemlseSBwcm9jZXNzIHRoZSBOZ01vZHVsZXMgbGF0ZXIgd2hlbiBuZWVkZWQuXG4gICAgdGhpcy5uZ01vZHVsZXNXaXRoU29tZVVucmVzb2x2ZWREZWNscy5hZGQodHlwZSk7XG4gIH1cblxuICAvKiogQG92ZXJyaWRlICovXG4gIGNsZWFyU2NvcGVDYWNoZUZvcih0eXBlOiBUeXBlPGFueT4pOiB2b2lkIHtcbiAgICB0aGlzLm5nTW9kdWxlc1Njb3BlQ2FjaGUuZGVsZXRlKHR5cGUgYXMgTmdNb2R1bGVUeXBlKTtcbiAgICB0aGlzLnN0YW5kYWxvbmVDb21wb25lbnRzU2NvcGVDYWNoZS5kZWxldGUodHlwZSBhcyBDb21wb25lbnRUeXBlPGFueT4pO1xuICB9XG5cbiAgLyoqIEBvdmVycmlkZSAqL1xuICBnZXROZ01vZHVsZVNjb3BlKHR5cGU6IE5nTW9kdWxlVHlwZTxhbnk+KTogTmdNb2R1bGVTY29wZSB7XG4gICAgaWYgKHRoaXMubmdNb2R1bGVzU2NvcGVDYWNoZS5oYXModHlwZSkpIHtcbiAgICAgIHJldHVybiB0aGlzLm5nTW9kdWxlc1Njb3BlQ2FjaGUuZ2V0KHR5cGUpITtcbiAgICB9XG5cbiAgICBjb25zdCBzY29wZSA9IHRoaXMuY29tcHV0ZU5nTW9kdWxlU2NvcGUodHlwZSk7XG4gICAgdGhpcy5uZ01vZHVsZXNTY29wZUNhY2hlLnNldCh0eXBlLCBzY29wZSk7XG5cbiAgICByZXR1cm4gc2NvcGU7XG4gIH1cblxuICAvKiogQ29tcHV0ZSBOZ01vZHVsZSBzY29wZSBhZnJlc2guICovXG4gIHByaXZhdGUgY29tcHV0ZU5nTW9kdWxlU2NvcGUodHlwZTogTmdNb2R1bGVUeXBlPGFueT4pOiBOZ01vZHVsZVNjb3BlIHtcbiAgICBjb25zdCBkZWYgPSBnZXROZ01vZHVsZURlZih0eXBlLCB0cnVlKTtcbiAgICBjb25zdCBzY29wZTogTmdNb2R1bGVTY29wZSA9IHtcbiAgICAgIGV4cG9ydGVkOiB7ZGlyZWN0aXZlczogbmV3IFNldCgpLCBwaXBlczogbmV3IFNldCgpfSxcbiAgICAgIGNvbXBpbGF0aW9uOiB7ZGlyZWN0aXZlczogbmV3IFNldCgpLCBwaXBlczogbmV3IFNldCgpfSxcbiAgICB9O1xuXG4gICAgLy8gQW5hbHl6aW5nIGltcG9ydHNcbiAgICBmb3IgKGNvbnN0IGltcG9ydGVkIG9mIG1heWJlVW53cmFwRm4oZGVmLmltcG9ydHMpKSB7XG4gICAgICBpZiAoaXNOZ01vZHVsZShpbXBvcnRlZCkpIHtcbiAgICAgICAgY29uc3QgaW1wb3J0ZWRTY29wZSA9IHRoaXMuZ2V0TmdNb2R1bGVTY29wZShpbXBvcnRlZCk7XG5cbiAgICAgICAgLy8gV2hlbiB0aGlzIG1vZHVsZSBpbXBvcnRzIGFub3RoZXIsIHRoZSBpbXBvcnRlZCBtb2R1bGUncyBleHBvcnRlZCBkaXJlY3RpdmVzIGFuZCBwaXBlc1xuICAgICAgICAvLyBhcmUgYWRkZWQgdG8gdGhlIGNvbXBpbGF0aW9uIHNjb3BlIG9mIHRoaXMgbW9kdWxlLlxuICAgICAgICBhZGRTZXQoaW1wb3J0ZWRTY29wZS5leHBvcnRlZC5kaXJlY3RpdmVzLCBzY29wZS5jb21waWxhdGlvbi5kaXJlY3RpdmVzKTtcbiAgICAgICAgYWRkU2V0KGltcG9ydGVkU2NvcGUuZXhwb3J0ZWQucGlwZXMsIHNjb3BlLmNvbXBpbGF0aW9uLnBpcGVzKTtcbiAgICAgIH0gZWxzZSBpZiAoaXNTdGFuZGFsb25lKGltcG9ydGVkKSkge1xuICAgICAgICBpZiAoaXNEaXJlY3RpdmUoaW1wb3J0ZWQpIHx8IGlzQ29tcG9uZW50KGltcG9ydGVkKSkge1xuICAgICAgICAgIHNjb3BlLmNvbXBpbGF0aW9uLmRpcmVjdGl2ZXMuYWRkKGltcG9ydGVkKTtcbiAgICAgICAgfSBlbHNlIGlmIChpc1BpcGUoaW1wb3J0ZWQpKSB7XG4gICAgICAgICAgc2NvcGUuY29tcGlsYXRpb24ucGlwZXMuYWRkKGltcG9ydGVkKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBUaGUgc3RhbmRhbG9uZSB0aGluZyBpcyBuZWl0aGVyIGEgY29tcG9uZW50IG5vciBhIGRpcmVjdGl2ZSBub3IgYSBwaXBlIC4uLiAod2hhdD8pXG4gICAgICAgICAgdGhyb3cgbmV3IFJ1bnRpbWVFcnJvcihcbiAgICAgICAgICAgICAgUnVudGltZUVycm9yQ29kZS5SVU5USU1FX0RFUFNfSU5WQUxJRF9JTVBPUlRFRF9UWVBFLFxuICAgICAgICAgICAgICAnVGhlIHN0YW5kYWxvbmUgaW1wb3J0ZWQgdHlwZSBpcyBuZWl0aGVyIGEgY29tcG9uZW50IG5vciBhIGRpcmVjdGl2ZSBub3IgYSBwaXBlJyk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIFRoZSBpbXBvcnQgaXMgbmVpdGhlciBhIG1vZHVsZSBub3IgYSBtb2R1bGUtd2l0aC1wcm92aWRlcnMgbm9yIGEgc3RhbmRhbG9uZSB0aGluZy4gVGhpc1xuICAgICAgICAvLyBpcyBnb2luZyB0byBiZSBhbiBlcnJvci4gU28gd2Ugc2hvcnQgY2lyY3VpdC5cbiAgICAgICAgc2NvcGUuY29tcGlsYXRpb24uaXNQb2lzb25lZCA9IHRydWU7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIEFuYWx5emluZyBkZWNsYXJhdGlvbnNcbiAgICBpZiAoIXNjb3BlLmNvbXBpbGF0aW9uLmlzUG9pc29uZWQpIHtcbiAgICAgIGZvciAoY29uc3QgZGVjbCBvZiBtYXliZVVud3JhcEZuKGRlZi5kZWNsYXJhdGlvbnMpKSB7XG4gICAgICAgIC8vIENhbm5vdCBkZWNsYXJlIGFub3RoZXIgTmdNb2R1bGUgb3IgYSBzdGFuZGFsb25lIHRoaW5nXG4gICAgICAgIGlmIChpc05nTW9kdWxlKGRlY2wpIHx8IGlzU3RhbmRhbG9uZShkZWNsKSkge1xuICAgICAgICAgIHNjb3BlLmNvbXBpbGF0aW9uLmlzUG9pc29uZWQgPSB0cnVlO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGlzUGlwZShkZWNsKSkge1xuICAgICAgICAgIHNjb3BlLmNvbXBpbGF0aW9uLnBpcGVzLmFkZChkZWNsKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBkZWNsIGlzIGVpdGhlciBhIGRpcmVjdGl2ZSBvciBhIGNvbXBvbmVudC4gVGhlIGNvbXBvbmVudCBtYXkgbm90IHlldCBoYXZlIHRoZSDJtWNtcCBkdWVcbiAgICAgICAgICAvLyB0byBhc3luYyBjb21waWxhdGlvbi5cbiAgICAgICAgICBzY29wZS5jb21waWxhdGlvbi5kaXJlY3RpdmVzLmFkZChkZWNsKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIC8vIEFuYWx5emluZyBleHBvcnRzXG4gICAgZm9yIChjb25zdCBleHBvcnRlZCBvZiBtYXliZVVud3JhcEZuKGRlZi5leHBvcnRzKSkge1xuICAgICAgaWYgKGlzTmdNb2R1bGUoZXhwb3J0ZWQpKSB7XG4gICAgICAgIC8vIFdoZW4gdGhpcyBtb2R1bGUgZXhwb3J0cyBhbm90aGVyLCB0aGUgZXhwb3J0ZWQgbW9kdWxlJ3MgZXhwb3J0ZWQgZGlyZWN0aXZlcyBhbmQgcGlwZXNcbiAgICAgICAgLy8gYXJlIGFkZGVkIHRvIGJvdGggdGhlIGNvbXBpbGF0aW9uIGFuZCBleHBvcnRlZCBzY29wZXMgb2YgdGhpcyBtb2R1bGUuXG4gICAgICAgIGNvbnN0IGV4cG9ydGVkU2NvcGUgPSB0aGlzLmdldE5nTW9kdWxlU2NvcGUoZXhwb3J0ZWQpO1xuXG4gICAgICAgIC8vIEJhc2VkIG9uIHRoZSBjdXJyZW50IGxvZ2ljIHRoZXJlIGlzIG5vIHdheSB0byBoYXZlIHBvaXNvbmVkIGV4cG9ydGVkIHNjb3BlLiBTbyBubyBuZWVkIHRvXG4gICAgICAgIC8vIGNoZWNrIGZvciBpdC5cbiAgICAgICAgYWRkU2V0KGV4cG9ydGVkU2NvcGUuZXhwb3J0ZWQuZGlyZWN0aXZlcywgc2NvcGUuZXhwb3J0ZWQuZGlyZWN0aXZlcyk7XG4gICAgICAgIGFkZFNldChleHBvcnRlZFNjb3BlLmV4cG9ydGVkLnBpcGVzLCBzY29wZS5leHBvcnRlZC5waXBlcyk7XG5cbiAgICAgIH0gZWxzZSBpZiAoaXNQaXBlKGV4cG9ydGVkKSkge1xuICAgICAgICBzY29wZS5leHBvcnRlZC5waXBlcy5hZGQoZXhwb3J0ZWQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc2NvcGUuZXhwb3J0ZWQuZGlyZWN0aXZlcy5hZGQoZXhwb3J0ZWQpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBzY29wZTtcbiAgfVxuXG4gIC8qKiBAb3ZlcnJpZGUgKi9cbiAgZ2V0U3RhbmRhbG9uZUNvbXBvbmVudFNjb3BlKFxuICAgICAgdHlwZTogQ29tcG9uZW50VHlwZTxhbnk+LFxuICAgICAgcmF3SW1wb3J0czogKFR5cGU8YW55PnwoKCkgPT4gVHlwZTxhbnk+KSlbXSk6IFN0YW5kYWxvbmVDb21wb25lbnRTY29wZSB7XG4gICAgaWYgKHRoaXMuc3RhbmRhbG9uZUNvbXBvbmVudHNTY29wZUNhY2hlLmhhcyh0eXBlKSkge1xuICAgICAgcmV0dXJuIHRoaXMuc3RhbmRhbG9uZUNvbXBvbmVudHNTY29wZUNhY2hlLmdldCh0eXBlKSE7XG4gICAgfVxuXG4gICAgY29uc3QgYW5zID0gdGhpcy5jb21wdXRlU3RhbmRhbG9uZUNvbXBvbmVudFNjb3BlKHR5cGUsIHJhd0ltcG9ydHMpO1xuICAgIHRoaXMuc3RhbmRhbG9uZUNvbXBvbmVudHNTY29wZUNhY2hlLnNldCh0eXBlLCBhbnMpO1xuXG4gICAgcmV0dXJuIGFucztcbiAgfVxuXG4gIHByaXZhdGUgY29tcHV0ZVN0YW5kYWxvbmVDb21wb25lbnRTY29wZShcbiAgICAgIHR5cGU6IENvbXBvbmVudFR5cGU8YW55PixcbiAgICAgIHJhd0ltcG9ydHM6IChUeXBlPGFueT58KCgpID0+IFR5cGU8YW55PikpW10pOiBTdGFuZGFsb25lQ29tcG9uZW50U2NvcGUge1xuICAgIGNvbnN0IGFuczogU3RhbmRhbG9uZUNvbXBvbmVudFNjb3BlID0ge1xuICAgICAgY29tcGlsYXRpb246IHtcbiAgICAgICAgLy8gU3RhbmRhbG9uZSBjb21wb25lbnRzIGFyZSBhbHdheXMgYWJsZSB0byBzZWxmLXJlZmVyZW5jZS5cbiAgICAgICAgZGlyZWN0aXZlczogbmV3IFNldChbdHlwZV0pLFxuICAgICAgICBwaXBlczogbmV3IFNldCgpLFxuICAgICAgfSxcbiAgICB9O1xuXG4gICAgZm9yIChjb25zdCByYXdJbXBvcnQgb2YgcmF3SW1wb3J0cykge1xuICAgICAgY29uc3QgaW1wb3J0ZWQgPSByZXNvbHZlRm9yd2FyZFJlZihyYXdJbXBvcnQpIGFzIFR5cGU8YW55PjtcblxuICAgICAgdHJ5IHtcbiAgICAgICAgdmVyaWZ5U3RhbmRhbG9uZUltcG9ydChpbXBvcnRlZCwgdHlwZSk7XG4gICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIC8vIFNob3J0LWNpcmN1aXQgaWYgYW4gaW1wb3J0IGlzIG5vdCB2YWxpZFxuICAgICAgICBhbnMuY29tcGlsYXRpb24uaXNQb2lzb25lZCA9IHRydWU7XG4gICAgICAgIHJldHVybiBhbnM7XG4gICAgICB9XG5cbiAgICAgIGlmIChpc05nTW9kdWxlKGltcG9ydGVkKSkge1xuICAgICAgICBjb25zdCBpbXBvcnRlZFNjb3BlID0gdGhpcy5nZXROZ01vZHVsZVNjb3BlKGltcG9ydGVkKTtcblxuICAgICAgICAvLyBTaG9ydC1jaXJjdWl0IGlmIGFuIGltcG9ydGVkIE5nTW9kdWxlIGhhcyBjb3JydXB0ZWQgZXhwb3J0ZWQgc2NvcGUuXG4gICAgICAgIGlmIChpbXBvcnRlZFNjb3BlLmV4cG9ydGVkLmlzUG9pc29uZWQpIHtcbiAgICAgICAgICBhbnMuY29tcGlsYXRpb24uaXNQb2lzb25lZCA9IHRydWU7XG4gICAgICAgICAgcmV0dXJuIGFucztcbiAgICAgICAgfVxuXG4gICAgICAgIGFkZFNldChpbXBvcnRlZFNjb3BlLmV4cG9ydGVkLmRpcmVjdGl2ZXMsIGFucy5jb21waWxhdGlvbi5kaXJlY3RpdmVzKTtcbiAgICAgICAgYWRkU2V0KGltcG9ydGVkU2NvcGUuZXhwb3J0ZWQucGlwZXMsIGFucy5jb21waWxhdGlvbi5waXBlcyk7XG4gICAgICB9IGVsc2UgaWYgKGlzUGlwZShpbXBvcnRlZCkpIHtcbiAgICAgICAgYW5zLmNvbXBpbGF0aW9uLnBpcGVzLmFkZChpbXBvcnRlZCk7XG4gICAgICB9IGVsc2UgaWYgKGlzRGlyZWN0aXZlKGltcG9ydGVkKSB8fCBpc0NvbXBvbmVudChpbXBvcnRlZCkpIHtcbiAgICAgICAgYW5zLmNvbXBpbGF0aW9uLmRpcmVjdGl2ZXMuYWRkKGltcG9ydGVkKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIFRoZSBpbXBvcnRlZCB0aGluZyBpcyBub3QgbW9kdWxlL3BpcGUvZGlyZWN0aXZlL2NvbXBvbmVudCwgc28gd2UgZXJyb3IgYW5kIHNob3J0LWNpcmN1aXRcbiAgICAgICAgLy8gaGVyZVxuICAgICAgICBhbnMuY29tcGlsYXRpb24uaXNQb2lzb25lZCA9IHRydWU7XG4gICAgICAgIHJldHVybiBhbnM7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGFucztcbiAgfVxufVxuXG5mdW5jdGlvbiBhZGRTZXQ8VD4oc291cmNlU2V0OiBTZXQ8VD4sIHRhcmdldFNldDogU2V0PFQ+KTogdm9pZCB7XG4gIGZvciAoY29uc3QgbSBvZiBzb3VyY2VTZXQpIHtcbiAgICB0YXJnZXRTZXQuYWRkKG0pO1xuICB9XG59XG5cbi8qKiBUaGUgZGVwcyB0cmFja2VyIHRvIGJlIHVzZWQgaW4gdGhlIGN1cnJlbnQgQW5ndWxhciBhcHAgaW4gZGV2IG1vZGUuICovXG5leHBvcnQgY29uc3QgZGVwc1RyYWNrZXIgPSBuZXcgRGVwc1RyYWNrZXIoKTtcblxuZXhwb3J0IGNvbnN0IFRFU1RfT05MWSA9IHtEZXBzVHJhY2tlcn07XG4iXX0=