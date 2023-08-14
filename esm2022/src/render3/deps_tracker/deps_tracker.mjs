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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVwc190cmFja2VyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9kZXBzX3RyYWNrZXIvZGVwc190cmFja2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBQyxpQkFBaUIsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUMzQyxPQUFPLEVBQUMsWUFBWSxFQUFtQixNQUFNLGNBQWMsQ0FBQztBQUc1RCxPQUFPLEVBQUMsZUFBZSxFQUFFLGNBQWMsRUFBRSxZQUFZLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFFNUUsT0FBTyxFQUFDLFdBQVcsRUFBRSxXQUFXLEVBQUUsVUFBVSxFQUFFLE1BQU0sRUFBRSxzQkFBc0IsRUFBQyxNQUFNLGFBQWEsQ0FBQztBQUNqRyxPQUFPLEVBQUMsYUFBYSxFQUFDLE1BQU0sb0JBQW9CLENBQUM7QUFJakQ7Ozs7OztHQU1HO0FBQ0gsTUFBTSxDQUFDLE1BQU0sZ0NBQWdDLEdBQUcsSUFBSSxDQUFDO0FBRXJEOztHQUVHO0FBQ0gsTUFBTSxXQUFXO0lBQWpCO1FBQ1Usa0JBQWEsR0FBRyxJQUFJLEdBQUcsRUFBeUMsQ0FBQztRQUNqRSxxQ0FBZ0MsR0FBRyxJQUFJLEdBQUcsRUFBcUIsQ0FBQztRQUNoRSx3QkFBbUIsR0FBRyxJQUFJLEdBQUcsRUFBb0MsQ0FBQztRQUNsRSxtQ0FBOEIsR0FBRyxJQUFJLEdBQUcsRUFBZ0QsQ0FBQztJQStPbkcsQ0FBQztJQTdPQzs7OztPQUlHO0lBQ0sscUJBQXFCO1FBQzNCLElBQUksSUFBSSxDQUFDLGdDQUFnQyxDQUFDLElBQUksS0FBSyxDQUFDLEVBQUU7WUFDcEQsT0FBTztTQUNSO1FBRUQsS0FBSyxNQUFNLFVBQVUsSUFBSSxJQUFJLENBQUMsZ0NBQWdDLEVBQUU7WUFDOUQsTUFBTSxHQUFHLEdBQUcsY0FBYyxDQUFDLFVBQVUsQ0FBQyxDQUFD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LFdBQVcsQ0FBQyxRQUFRLENBQUMsRUFBRTtnQkFDekQsR0FBRyxDQUFDLFdBQVcsQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDO2FBQzFDO2lCQUFNO2dCQUNMLDJGQUEyRjtnQkFDM0YsT0FBTztnQkFDUCxHQUFHLENBQUMsV0FBVyxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUM7Z0JBQ2xDLE9BQU8sR0FBRyxDQUFDO2FBQ1o7U0FDRjtRQUVELE9BQU8sR0FBRyxDQUFDO0lBQ2IsQ0FBQztDQUNGO0FBRUQsU0FBUyxNQUFNLENBQUksU0FBaUIsRUFBRSxTQUFpQjtJQUNyRCxLQUFLLE1BQU0sQ0FBQyxJQUFJLFNBQVMsRUFBRTtRQUN6QixTQUFTLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO0tBQ2xCO0FBQ0gsQ0FBQztBQUVELDBFQUEwRTtBQUMxRSxNQUFNLENBQUMsTUFBTSxXQUFXLEdBQUcsSUFBSSxXQUFXLEVBQUUsQ0FBQztBQUU3QyxNQUFNLENBQUMsTUFBTSxTQUFTLEdBQUcsRUFBQyxXQUFXLEVBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge3Jlc29sdmVGb3J3YXJkUmVmfSBmcm9tICcuLi8uLi9kaSc7XG5pbXBvcnQge1J1bnRpbWVFcnJvciwgUnVudGltZUVycm9yQ29kZX0gZnJvbSAnLi4vLi4vZXJyb3JzJztcbmltcG9ydCB7VHlwZX0gZnJvbSAnLi4vLi4vaW50ZXJmYWNlL3R5cGUnO1xuaW1wb3J0IHtOZ01vZHVsZVR5cGV9IGZyb20gJy4uLy4uL21ldGFkYXRhL25nX21vZHVsZV9kZWYnO1xuaW1wb3J0IHtnZXRDb21wb25lbnREZWYsIGdldE5nTW9kdWxlRGVmLCBpc1N0YW5kYWxvbmV9IGZyb20gJy4uL2RlZmluaXRpb24nO1xuaW1wb3J0IHtDb21wb25lbnRUeXBlLCBOZ01vZHVsZVNjb3BlSW5mb0Zyb21EZWNvcmF0b3IsIFJhd1Njb3BlSW5mb0Zyb21EZWNvcmF0b3J9IGZyb20gJy4uL2ludGVyZmFjZXMvZGVmaW5pdGlvbic7XG5pbXBvcnQge2lzQ29tcG9uZW50LCBpc0RpcmVjdGl2ZSwgaXNOZ01vZHVsZSwgaXNQaXBlLCB2ZXJpZnlTdGFuZGFsb25lSW1wb3J0fSBmcm9tICcuLi9qaXQvdXRpbCc7XG5pbXBvcnQge21heWJlVW53cmFwRm59IGZyb20gJy4uL3V0aWwvbWlzY191dGlscyc7XG5cbmltcG9ydCB7Q29tcG9uZW50RGVwZW5kZW5jaWVzLCBEZXBzVHJhY2tlckFwaSwgTmdNb2R1bGVTY29wZSwgU3RhbmRhbG9uZUNvbXBvbmVudFNjb3BlfSBmcm9tICcuL2FwaSc7XG5cbi8qKlxuICogSW5kaWNhdGVzIHdoZXRoZXIgdG8gdXNlIHRoZSBydW50aW1lIGRlcGVuZGVuY3kgdHJhY2tlciBmb3Igc2NvcGUgY2FsY3VsYXRpb24gaW4gSklUIGNvbXBpbGF0aW9uLlxuICogVGhlIHZhbHVlIFwiZmFsc2VcIiBtZWFucyB0aGUgb2xkIGNvZGUgcGF0aCBiYXNlZCBvbiBwYXRjaGluZyBzY29wZSBpbmZvIGludG8gdGhlIHR5cGVzIHdpbGwgYmVcbiAqIHVzZWQuXG4gKlxuICogQGRlcHJlY2F0ZWQgRm9yIG1pZ3JhdGlvbiBwdXJwb3NlcyBvbmx5LCB0byBiZSByZW1vdmVkIHNvb24uXG4gKi9cbmV4cG9ydCBjb25zdCBVU0VfUlVOVElNRV9ERVBTX1RSQUNLRVJfRk9SX0pJVCA9IHRydWU7XG5cbi8qKlxuICogQW4gaW1wbGVtZW50YXRpb24gb2YgRGVwc1RyYWNrZXJBcGkgd2hpY2ggd2lsbCBiZSB1c2VkIGZvciBKSVQgYW5kIGxvY2FsIGNvbXBpbGF0aW9uLlxuICovXG5jbGFzcyBEZXBzVHJhY2tlciBpbXBsZW1lbnRzIERlcHNUcmFja2VyQXBpIHtcbiAgcHJpdmF0ZSBvd25lck5nTW9kdWxlID0gbmV3IE1hcDxDb21wb25lbnRUeXBlPGFueT4sIE5nTW9kdWxlVHlwZTxhbnk+PigpO1xuICBwcml2YXRlIG5nTW9kdWxlc1dpdGhTb21lVW5yZXNvbHZlZERlY2xzID0gbmV3IFNldDxOZ01vZHVsZVR5cGU8YW55Pj4oKTtcbiAgcHJpdmF0ZSBuZ01vZHVsZXNTY29wZUNhY2hlID0gbmV3IE1hcDxOZ01vZHVsZVR5cGU8YW55PiwgTmdNb2R1bGVTY29wZT4oKTtcbiAgcHJpdmF0ZSBzdGFuZGFsb25lQ29tcG9uZW50c1Njb3BlQ2FjaGUgPSBuZXcgTWFwPENvbXBvbmVudFR5cGU8YW55PiwgU3RhbmRhbG9uZUNvbXBvbmVudFNjb3BlPigpO1xuXG4gIC8qKlxuICAgKiBBdHRlbXB0cyB0byByZXNvbHZlIG5nIG1vZHVsZSdzIGZvcndhcmQgcmVmIGRlY2xhcmF0aW9ucyBhcyBtdWNoIGFzIHBvc3NpYmxlIGFuZCBhZGQgdGhlbSB0b1xuICAgKiB0aGUgYG93bmVyTmdNb2R1bGVgIG1hcC4gVGhpcyBtZXRob2Qgbm9ybWFsbHkgc2hvdWxkIGJlIGNhbGxlZCBhZnRlciB0aGUgaW5pdGlhbCBwYXJzaW5nIHdoZW5cbiAgICogYWxsIHRoZSBmb3J3YXJkIHJlZnMgYXJlIHJlc29sdmVkIChlLmcuLCB3aGVuIHRyeWluZyB0byByZW5kZXIgYSBjb21wb25lbnQpXG4gICAqL1xuICBwcml2YXRlIHJlc29sdmVOZ01vZHVsZXNEZWNscygpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5uZ01vZHVsZXNXaXRoU29tZVVucmVzb2x2ZWREZWNscy5zaXplID09PSAwKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgZm9yIChjb25zdCBtb2R1bGVUeXBlIG9mIHRoaXMubmdNb2R1bGVzV2l0aFNvbWVVbnJlc29sdmVkRGVjbHMpIHtcbiAgICAgIGNvbnN0IGRlZiA9IGdldE5nTW9kdWxlRGVmKG1vZHVsZVR5cGUpO1xuICAgICAgaWYgKGRlZj8uZGVjbGFyYXRpb25zKSB7XG4gICAgICAgIGZvciAoY29uc3QgZGVjbCBvZiBtYXliZVVud3JhcEZuKGRlZi5kZWNsYXJhdGlvbnMpKSB7XG4gICAgICAgICAgaWYgKGlzQ29tcG9uZW50KGRlY2wpKSB7XG4gICAgICAgICAgICB0aGlzLm93bmVyTmdNb2R1bGUuc2V0KGRlY2wsIG1vZHVsZVR5cGUpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMubmdNb2R1bGVzV2l0aFNvbWVVbnJlc29sdmVkRGVjbHMuY2xlYXIoKTtcbiAgfVxuXG4gIC8qKiBAb3ZlcnJpZGUgKi9cbiAgZ2V0Q29tcG9uZW50RGVwZW5kZW5jaWVzKHR5cGU6IENvbXBvbmVudFR5cGU8YW55PiwgcmF3SW1wb3J0cz86IFJhd1Njb3BlSW5mb0Zyb21EZWNvcmF0b3JbXSk6XG4gICAgICBDb21wb25lbnREZXBlbmRlbmNpZXMge1xuICAgIHRoaXMucmVzb2x2ZU5nTW9kdWxlc0RlY2xzKCk7XG5cbiAgICBjb25zdCBkZWYgPSBnZXRDb21wb25lbnREZWYodHlwZSk7XG4gICAgaWYgKGRlZiA9PT0gbnVsbCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgIGBBdHRlbXB0aW5nIHRvIGdldCBjb21wb25lbnQgZGVwZW5kZW5jaWVzIGZvciBhIHR5cGUgdGhhdCBpcyBub3QgYSBjb21wb25lbnQ6ICR7dHlwZX1gKTtcbiAgICB9XG5cbiAgICBpZiAoZGVmLnN0YW5kYWxvbmUpIHtcbiAgICAgIGNvbnN0IHNjb3BlID0gdGhpcy5nZXRTdGFuZGFsb25lQ29tcG9uZW50U2NvcGUodHlwZSwgcmF3SW1wb3J0cyk7XG5cbiAgICAgIGlmIChzY29wZS5jb21waWxhdGlvbi5pc1BvaXNvbmVkKSB7XG4gICAgICAgIHJldHVybiB7ZGVwZW5kZW5jaWVzOiBbXX07XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB7XG4gICAgICAgIGRlcGVuZGVuY2llczogW1xuICAgICAgICAgIC4uLnNjb3BlLmNvbXBpbGF0aW9uLmRpcmVjdGl2ZXMsXG4gICAgICAgICAgLi4uc2NvcGUuY29tcGlsYXRpb24ucGlwZXMsXG4gICAgICAgIF1cbiAgICAgIH07XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmICghdGhpcy5vd25lck5nTW9kdWxlLmhhcyh0eXBlKSkge1xuICAgICAgICByZXR1cm4ge2RlcGVuZGVuY2llczogW119O1xuICAgICAgfVxuXG4gICAgICBjb25zdCBzY29wZSA9IHRoaXMuZ2V0TmdNb2R1bGVTY29wZSh0aGlzLm93bmVyTmdNb2R1bGUuZ2V0KHR5cGUpISk7XG5cbiAgICAgIGlmIChzY29wZS5jb21waWxhdGlvbi5pc1BvaXNvbmVkKSB7XG4gICAgICAgIHJldHVybiB7ZGVwZW5kZW5jaWVzOiBbXX07XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB7XG4gICAgICAgIGRlcGVuZGVuY2llczogW1xuICAgICAgICAgIC4uLnNjb3BlLmNvbXBpbGF0aW9uLmRpcmVjdGl2ZXMsXG4gICAgICAgICAgLi4uc2NvcGUuY29tcGlsYXRpb24ucGlwZXMsXG4gICAgICAgIF0sXG4gICAgICB9O1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBAb3ZlcnJpZGVcbiAgICogVGhpcyBpbXBsZW1lbnRhdGlvbiBkb2VzIG5vdCBtYWtlIHVzZSBvZiBwYXJhbSBzY29wZUluZm8gc2luY2UgaXQgYXNzdW1lcyB0aGUgc2NvcGUgaW5mbyBpc1xuICAgKiBhbHJlYWR5IGFkZGVkIHRvIHRoZSB0eXBlIGl0c2VsZiB0aHJvdWdoIG1ldGhvZHMgbGlrZSB7QGxpbmsgybXJtXNldE5nTW9kdWxlU2NvcGV9XG4gICAqL1xuICByZWdpc3Rlck5nTW9kdWxlKHR5cGU6IFR5cGU8YW55Piwgc2NvcGVJbmZvOiBOZ01vZHVsZVNjb3BlSW5mb0Zyb21EZWNvcmF0b3IpOiB2b2lkIHtcbiAgICBpZiAoIWlzTmdNb2R1bGUodHlwZSkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgQXR0ZW1wdGluZyB0byByZWdpc3RlciBhIFR5cGUgd2hpY2ggaXMgbm90IE5nTW9kdWxlIGFzIE5nTW9kdWxlOiAke3R5cGV9YCk7XG4gICAgfVxuXG4gICAgLy8gTGF6aWx5IHByb2Nlc3MgdGhlIE5nTW9kdWxlcyBsYXRlciB3aGVuIG5lZWRlZC5cbiAgICB0aGlzLm5nTW9kdWxlc1dpdGhTb21lVW5yZXNvbHZlZERlY2xzLmFkZCh0eXBlKTtcbiAgfVxuXG4gIC8qKiBAb3ZlcnJpZGUgKi9cbiAgY2xlYXJTY29wZUNhY2hlRm9yKHR5cGU6IFR5cGU8YW55Pik6IHZvaWQge1xuICAgIHRoaXMubmdNb2R1bGVzU2NvcGVDYWNoZS5kZWxldGUodHlwZSBhcyBOZ01vZHVsZVR5cGUpO1xuICAgIHRoaXMuc3RhbmRhbG9uZUNvbXBvbmVudHNTY29wZUNhY2hlLmRlbGV0ZSh0eXBlIGFzIENvbXBvbmVudFR5cGU8YW55Pik7XG4gIH1cblxuICAvKiogQG92ZXJyaWRlICovXG4gIGdldE5nTW9kdWxlU2NvcGUodHlwZTogTmdNb2R1bGVUeXBlPGFueT4pOiBOZ01vZHVsZVNjb3BlIHtcbiAgICBpZiAodGhpcy5uZ01vZHVsZXNTY29wZUNhY2hlLmhhcyh0eXBlKSkge1xuICAgICAgcmV0dXJuIHRoaXMubmdNb2R1bGVzU2NvcGVDYWNoZS5nZXQodHlwZSkhO1xuICAgIH1cblxuICAgIGNvbnN0IHNjb3BlID0gdGhpcy5jb21wdXRlTmdNb2R1bGVTY29wZSh0eXBlKTtcbiAgICB0aGlzLm5nTW9kdWxlc1Njb3BlQ2FjaGUuc2V0KHR5cGUsIHNjb3BlKTtcblxuICAgIHJldHVybiBzY29wZTtcbiAgfVxuXG4gIC8qKiBDb21wdXRlIE5nTW9kdWxlIHNjb3BlIGFmcmVzaC4gKi9cbiAgcHJpdmF0ZSBjb21wdXRlTmdNb2R1bGVTY29wZSh0eXBlOiBOZ01vZHVsZVR5cGU8YW55Pik6IE5nTW9kdWxlU2NvcGUge1xuICAgIGNvbnN0IGRlZiA9IGdldE5nTW9kdWxlRGVmKHR5cGUsIHRydWUpO1xuICAgIGNvbnN0IHNjb3BlOiBOZ01vZHVsZVNjb3BlID0ge1xuICAgICAgZXhwb3J0ZWQ6IHtkaXJlY3RpdmVzOiBuZXcgU2V0KCksIHBpcGVzOiBuZXcgU2V0KCl9LFxuICAgICAgY29tcGlsYXRpb246IHtkaXJlY3RpdmVzOiBuZXcgU2V0KCksIHBpcGVzOiBuZXcgU2V0KCl9LFxuICAgIH07XG5cbiAgICAvLyBBbmFseXppbmcgaW1wb3J0c1xuICAgIGZvciAoY29uc3QgaW1wb3J0ZWQgb2YgbWF5YmVVbndyYXBGbihkZWYuaW1wb3J0cykpIHtcbiAgICAgIGlmIChpc05nTW9kdWxlKGltcG9ydGVkKSkge1xuICAgICAgICBjb25zdCBpbXBvcnRlZFNjb3BlID0gdGhpcy5nZXROZ01vZHVsZVNjb3BlKGltcG9ydGVkKTtcblxuICAgICAgICAvLyBXaGVuIHRoaXMgbW9kdWxlIGltcG9ydHMgYW5vdGhlciwgdGhlIGltcG9ydGVkIG1vZHVsZSdzIGV4cG9ydGVkIGRpcmVjdGl2ZXMgYW5kIHBpcGVzXG4gICAgICAgIC8vIGFyZSBhZGRlZCB0byB0aGUgY29tcGlsYXRpb24gc2NvcGUgb2YgdGhpcyBtb2R1bGUuXG4gICAgICAgIGFkZFNldChpbXBvcnRlZFNjb3BlLmV4cG9ydGVkLmRpcmVjdGl2ZXMsIHNjb3BlLmNvbXBpbGF0aW9uLmRpcmVjdGl2ZXMpO1xuICAgICAgICBhZGRTZXQoaW1wb3J0ZWRTY29wZS5leHBvcnRlZC5waXBlcywgc2NvcGUuY29tcGlsYXRpb24ucGlwZXMpO1xuICAgICAgfSBlbHNlIGlmIChpc1N0YW5kYWxvbmUoaW1wb3J0ZWQpKSB7XG4gICAgICAgIGlmIChpc0RpcmVjdGl2ZShpbXBvcnRlZCkgfHwgaXNDb21wb25lbnQoaW1wb3J0ZWQpKSB7XG4gICAgICAgICAgc2NvcGUuY29tcGlsYXRpb24uZGlyZWN0aXZlcy5hZGQoaW1wb3J0ZWQpO1xuICAgICAgICB9IGVsc2UgaWYgKGlzUGlwZShpbXBvcnRlZCkpIHtcbiAgICAgICAgICBzY29wZS5jb21waWxhdGlvbi5waXBlcy5hZGQoaW1wb3J0ZWQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIFRoZSBzdGFuZGFsb25lIHRoaW5nIGlzIG5laXRoZXIgYSBjb21wb25lbnQgbm9yIGEgZGlyZWN0aXZlIG5vciBhIHBpcGUgLi4uICh3aGF0PylcbiAgICAgICAgICB0aHJvdyBuZXcgUnVudGltZUVycm9yKFxuICAgICAgICAgICAgICBSdW50aW1lRXJyb3JDb2RlLlJVTlRJTUVfREVQU19JTlZBTElEX0lNUE9SVEVEX1RZUEUsXG4gICAgICAgICAgICAgICdUaGUgc3RhbmRhbG9uZSBpbXBvcnRlZCB0eXBlIGlzIG5laXRoZXIgYSBjb21wb25lbnQgbm9yIGEgZGlyZWN0aXZlIG5vciBhIHBpcGUnKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gVGhlIGltcG9ydCBpcyBuZWl0aGVyIGEgbW9kdWxlIG5vciBhIG1vZHVsZS13aXRoLXByb3ZpZGVycyBub3IgYSBzdGFuZGFsb25lIHRoaW5nLiBUaGlzXG4gICAgICAgIC8vIGlzIGdvaW5nIHRvIGJlIGFuIGVycm9yLiBTbyB3ZSBzaG9ydCBjaXJjdWl0LlxuICAgICAgICBzY29wZS5jb21waWxhdGlvbi5pc1BvaXNvbmVkID0gdHJ1ZTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gQW5hbHl6aW5nIGRlY2xhcmF0aW9uc1xuICAgIGlmICghc2NvcGUuY29tcGlsYXRpb24uaXNQb2lzb25lZCkge1xuICAgICAgZm9yIChjb25zdCBkZWNsIG9mIG1heWJlVW53cmFwRm4oZGVmLmRlY2xhcmF0aW9ucykpIHtcbiAgICAgICAgLy8gQ2Fubm90IGRlY2xhcmUgYW5vdGhlciBOZ01vZHVsZSBvciBhIHN0YW5kYWxvbmUgdGhpbmdcbiAgICAgICAgaWYgKGlzTmdNb2R1bGUoZGVjbCkgfHwgaXNTdGFuZGFsb25lKGRlY2wpKSB7XG4gICAgICAgICAgc2NvcGUuY29tcGlsYXRpb24uaXNQb2lzb25lZCA9IHRydWU7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoaXNQaXBlKGRlY2wpKSB7XG4gICAgICAgICAgc2NvcGUuY29tcGlsYXRpb24ucGlwZXMuYWRkKGRlY2wpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIGRlY2wgaXMgZWl0aGVyIGEgZGlyZWN0aXZlIG9yIGEgY29tcG9uZW50LiBUaGUgY29tcG9uZW50IG1heSBub3QgeWV0IGhhdmUgdGhlIMm1Y21wIGR1ZVxuICAgICAgICAgIC8vIHRvIGFzeW5jIGNvbXBpbGF0aW9uLlxuICAgICAgICAgIHNjb3BlLmNvbXBpbGF0aW9uLmRpcmVjdGl2ZXMuYWRkKGRlY2wpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gQW5hbHl6aW5nIGV4cG9ydHNcbiAgICBmb3IgKGNvbnN0IGV4cG9ydGVkIG9mIG1heWJlVW53cmFwRm4oZGVmLmV4cG9ydHMpKSB7XG4gICAgICBpZiAoaXNOZ01vZHVsZShleHBvcnRlZCkpIHtcbiAgICAgICAgLy8gV2hlbiB0aGlzIG1vZHVsZSBleHBvcnRzIGFub3RoZXIsIHRoZSBleHBvcnRlZCBtb2R1bGUncyBleHBvcnRlZCBkaXJlY3RpdmVzIGFuZCBwaXBlc1xuICAgICAgICAvLyBhcmUgYWRkZWQgdG8gYm90aCB0aGUgY29tcGlsYXRpb24gYW5kIGV4cG9ydGVkIHNjb3BlcyBvZiB0aGlzIG1vZHVsZS5cbiAgICAgICAgY29uc3QgZXhwb3J0ZWRTY29wZSA9IHRoaXMuZ2V0TmdNb2R1bGVTY29wZShleHBvcnRlZCk7XG5cbiAgICAgICAgLy8gQmFzZWQgb24gdGhlIGN1cnJlbnQgbG9naWMgdGhlcmUgaXMgbm8gd2F5IHRvIGhhdmUgcG9pc29uZWQgZXhwb3J0ZWQgc2NvcGUuIFNvIG5vIG5lZWQgdG9cbiAgICAgICAgLy8gY2hlY2sgZm9yIGl0LlxuICAgICAgICBhZGRTZXQoZXhwb3J0ZWRTY29wZS5leHBvcnRlZC5kaXJlY3RpdmVzLCBzY29wZS5leHBvcnRlZC5kaXJlY3RpdmVzKTtcbiAgICAgICAgYWRkU2V0KGV4cG9ydGVkU2NvcGUuZXhwb3J0ZWQucGlwZXMsIHNjb3BlLmV4cG9ydGVkLnBpcGVzKTtcblxuICAgICAgfSBlbHNlIGlmIChpc1BpcGUoZXhwb3J0ZWQpKSB7XG4gICAgICAgIHNjb3BlLmV4cG9ydGVkLnBpcGVzLmFkZChleHBvcnRlZCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzY29wZS5leHBvcnRlZC5kaXJlY3RpdmVzLmFkZChleHBvcnRlZCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHNjb3BlO1xuICB9XG5cbiAgLyoqIEBvdmVycmlkZSAqL1xuICBnZXRTdGFuZGFsb25lQ29tcG9uZW50U2NvcGUodHlwZTogQ29tcG9uZW50VHlwZTxhbnk+LCByYXdJbXBvcnRzPzogUmF3U2NvcGVJbmZvRnJvbURlY29yYXRvcltdKTpcbiAgICAgIFN0YW5kYWxvbmVDb21wb25lbnRTY29wZSB7XG4gICAgaWYgKHRoaXMuc3RhbmRhbG9uZUNvbXBvbmVudHNTY29wZUNhY2hlLmhhcyh0eXBlKSkge1xuICAgICAgcmV0dXJuIHRoaXMuc3RhbmRhbG9uZUNvbXBvbmVudHNTY29wZUNhY2hlLmdldCh0eXBlKSE7XG4gICAgfVxuXG4gICAgY29uc3QgYW5zID0gdGhpcy5jb21wdXRlU3RhbmRhbG9uZUNvbXBvbmVudFNjb3BlKHR5cGUsIHJhd0ltcG9ydHMpO1xuICAgIHRoaXMuc3RhbmRhbG9uZUNvbXBvbmVudHNTY29wZUNhY2hlLnNldCh0eXBlLCBhbnMpO1xuXG4gICAgcmV0dXJuIGFucztcbiAgfVxuXG4gIHByaXZhdGUgY29tcHV0ZVN0YW5kYWxvbmVDb21wb25lbnRTY29wZShcbiAgICAgIHR5cGU6IENvbXBvbmVudFR5cGU8YW55PixcbiAgICAgIHJhd0ltcG9ydHM/OiBSYXdTY29wZUluZm9Gcm9tRGVjb3JhdG9yW10pOiBTdGFuZGFsb25lQ29tcG9uZW50U2NvcGUge1xuICAgIGNvbnN0IGFuczogU3RhbmRhbG9uZUNvbXBvbmVudFNjb3BlID0ge1xuICAgICAgY29tcGlsYXRpb246IHtcbiAgICAgICAgLy8gU3RhbmRhbG9uZSBjb21wb25lbnRzIGFyZSBhbHdheXMgYWJsZSB0byBzZWxmLXJlZmVyZW5jZS5cbiAgICAgICAgZGlyZWN0aXZlczogbmV3IFNldChbdHlwZV0pLFxuICAgICAgICBwaXBlczogbmV3IFNldCgpLFxuICAgICAgfSxcbiAgICB9O1xuXG4gICAgZm9yIChjb25zdCByYXdJbXBvcnQgb2YgcmF3SW1wb3J0cyA/PyBbXSkge1xuICAgICAgY29uc3QgaW1wb3J0ZWQgPSByZXNvbHZlRm9yd2FyZFJlZihyYXdJbXBvcnQpIGFzIFR5cGU8YW55PjtcblxuICAgICAgdHJ5IHtcbiAgICAgICAgdmVyaWZ5U3RhbmRhbG9uZUltcG9ydChpbXBvcnRlZCwgdHlwZSk7XG4gICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIC8vIFNob3J0LWNpcmN1aXQgaWYgYW4gaW1wb3J0IGlzIG5vdCB2YWxpZFxuICAgICAgICBhbnMuY29tcGlsYXRpb24uaXNQb2lzb25lZCA9IHRydWU7XG4gICAgICAgIHJldHVybiBhbnM7XG4gICAgICB9XG5cbiAgICAgIGlmIChpc05nTW9kdWxlKGltcG9ydGVkKSkge1xuICAgICAgICBjb25zdCBpbXBvcnRlZFNjb3BlID0gdGhpcy5nZXROZ01vZHVsZVNjb3BlKGltcG9ydGVkKTtcblxuICAgICAgICAvLyBTaG9ydC1jaXJjdWl0IGlmIGFuIGltcG9ydGVkIE5nTW9kdWxlIGhhcyBjb3JydXB0ZWQgZXhwb3J0ZWQgc2NvcGUuXG4gICAgICAgIGlmIChpbXBvcnRlZFNjb3BlLmV4cG9ydGVkLmlzUG9pc29uZWQpIHtcbiAgICAgICAgICBhbnMuY29tcGlsYXRpb24uaXNQb2lzb25lZCA9IHRydWU7XG4gICAgICAgICAgcmV0dXJuIGFucztcbiAgICAgICAgfVxuXG4gICAgICAgIGFkZFNldChpbXBvcnRlZFNjb3BlLmV4cG9ydGVkLmRpcmVjdGl2ZXMsIGFucy5jb21waWxhdGlvbi5kaXJlY3RpdmVzKTtcbiAgICAgICAgYWRkU2V0KGltcG9ydGVkU2NvcGUuZXhwb3J0ZWQucGlwZXMsIGFucy5jb21waWxhdGlvbi5waXBlcyk7XG4gICAgICB9IGVsc2UgaWYgKGlzUGlwZShpbXBvcnRlZCkpIHtcbiAgICAgICAgYW5zLmNvbXBpbGF0aW9uLnBpcGVzLmFkZChpbXBvcnRlZCk7XG4gICAgICB9IGVsc2UgaWYgKGlzRGlyZWN0aXZlKGltcG9ydGVkKSB8fCBpc0NvbXBvbmVudChpbXBvcnRlZCkpIHtcbiAgICAgICAgYW5zLmNvbXBpbGF0aW9uLmRpcmVjdGl2ZXMuYWRkKGltcG9ydGVkKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIFRoZSBpbXBvcnRlZCB0aGluZyBpcyBub3QgbW9kdWxlL3BpcGUvZGlyZWN0aXZlL2NvbXBvbmVudCwgc28gd2UgZXJyb3IgYW5kIHNob3J0LWNpcmN1aXRcbiAgICAgICAgLy8gaGVyZVxuICAgICAgICBhbnMuY29tcGlsYXRpb24uaXNQb2lzb25lZCA9IHRydWU7XG4gICAgICAgIHJldHVybiBhbnM7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGFucztcbiAgfVxufVxuXG5mdW5jdGlvbiBhZGRTZXQ8VD4oc291cmNlU2V0OiBTZXQ8VD4sIHRhcmdldFNldDogU2V0PFQ+KTogdm9pZCB7XG4gIGZvciAoY29uc3QgbSBvZiBzb3VyY2VTZXQpIHtcbiAgICB0YXJnZXRTZXQuYWRkKG0pO1xuICB9XG59XG5cbi8qKiBUaGUgZGVwcyB0cmFja2VyIHRvIGJlIHVzZWQgaW4gdGhlIGN1cnJlbnQgQW5ndWxhciBhcHAgaW4gZGV2IG1vZGUuICovXG5leHBvcnQgY29uc3QgZGVwc1RyYWNrZXIgPSBuZXcgRGVwc1RyYWNrZXIoKTtcblxuZXhwb3J0IGNvbnN0IFRFU1RfT05MWSA9IHtEZXBzVHJhY2tlcn07XG4iXX0=