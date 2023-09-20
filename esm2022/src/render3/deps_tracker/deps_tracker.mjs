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
                    ...scope.compilation.ngModules,
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
                ngModules: new Set(),
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
                ans.compilation.ngModules.add(imported);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVwc190cmFja2VyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9kZXBzX3RyYWNrZXIvZGVwc190cmFja2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBQyxpQkFBaUIsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUMzQyxPQUFPLEVBQUMsWUFBWSxFQUFtQixNQUFNLGNBQWMsQ0FBQztBQUc1RCxPQUFPLEVBQUMsT0FBTyxFQUFDLE1BQU0sd0JBQXdCLENBQUM7QUFDL0MsT0FBTyxFQUFDLGVBQWUsRUFBRSxjQUFjLEVBQUUsWUFBWSxFQUFDLE1BQU0sZUFBZSxDQUFDO0FBRTVFLE9BQU8sRUFBQyxXQUFXLEVBQUUsV0FBVyxFQUFFLFVBQVUsRUFBRSxNQUFNLEVBQUUsc0JBQXNCLEVBQUMsTUFBTSxhQUFhLENBQUM7QUFDakcsT0FBTyxFQUFDLGFBQWEsRUFBQyxNQUFNLG9CQUFvQixDQUFDO0FBSWpEOzs7Ozs7R0FNRztBQUNILE1BQU0sQ0FBQyxNQUFNLGdDQUFnQyxHQUFHLEtBQUssQ0FBQztBQUV0RDs7R0FFRztBQUNILE1BQU0sV0FBVztJQUFqQjtRQUNVLGtCQUFhLEdBQUcsSUFBSSxHQUFHLEVBQXlDLENBQUM7UUFDakUscUNBQWdDLEdBQUcsSUFBSSxHQUFHLEVBQXFCLENBQUM7UUFDaEUsd0JBQW1CLEdBQUcsSUFBSSxHQUFHLEVBQW9DLENBQUM7UUFDbEUsbUNBQThCLEdBQUcsSUFBSSxHQUFHLEVBQWdELENBQUM7SUE4UG5HLENBQUM7SUE1UEM7Ozs7T0FJRztJQUNLLHFCQUFxQjtRQUMzQixJQUFJLElBQUksQ0FBQyxnQ0FBZ0MsQ0FBQyxJQUFJLEtBQUssQ0FBQyxFQUFFO1lBQ3BELE9BQU87U0FDUjtRQUVELEtBQUssTUFBTSxVQUFVLElBQUksSUFBSSxDQUFDLGdDQUFnQyxFQUFFO1lB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TUFBTSxDQUFDLE1BQU0sV0FBVyxHQUFHLElBQUksV0FBVyxFQUFFLENBQUM7QUFFN0MsTUFBTSxDQUFDLE1BQU0sU0FBUyxHQUFHLEVBQUMsV0FBVyxFQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtyZXNvbHZlRm9yd2FyZFJlZn0gZnJvbSAnLi4vLi4vZGknO1xuaW1wb3J0IHtSdW50aW1lRXJyb3IsIFJ1bnRpbWVFcnJvckNvZGV9IGZyb20gJy4uLy4uL2Vycm9ycyc7XG5pbXBvcnQge1R5cGV9IGZyb20gJy4uLy4uL2ludGVyZmFjZS90eXBlJztcbmltcG9ydCB7TmdNb2R1bGVUeXBlfSBmcm9tICcuLi8uLi9tZXRhZGF0YS9uZ19tb2R1bGVfZGVmJztcbmltcG9ydCB7ZmxhdHRlbn0gZnJvbSAnLi4vLi4vdXRpbC9hcnJheV91dGlscyc7XG5pbXBvcnQge2dldENvbXBvbmVudERlZiwgZ2V0TmdNb2R1bGVEZWYsIGlzU3RhbmRhbG9uZX0gZnJvbSAnLi4vZGVmaW5pdGlvbic7XG5pbXBvcnQge0NvbXBvbmVudFR5cGUsIE5nTW9kdWxlU2NvcGVJbmZvRnJvbURlY29yYXRvciwgUmF3U2NvcGVJbmZvRnJvbURlY29yYXRvcn0gZnJvbSAnLi4vaW50ZXJmYWNlcy9kZWZpbml0aW9uJztcbmltcG9ydCB7aXNDb21wb25lbnQsIGlzRGlyZWN0aXZlLCBpc05nTW9kdWxlLCBpc1BpcGUsIHZlcmlmeVN0YW5kYWxvbmVJbXBvcnR9IGZyb20gJy4uL2ppdC91dGlsJztcbmltcG9ydCB7bWF5YmVVbndyYXBGbn0gZnJvbSAnLi4vdXRpbC9taXNjX3V0aWxzJztcblxuaW1wb3J0IHtDb21wb25lbnREZXBlbmRlbmNpZXMsIERlcHNUcmFja2VyQXBpLCBOZ01vZHVsZVNjb3BlLCBTdGFuZGFsb25lQ29tcG9uZW50U2NvcGV9IGZyb20gJy4vYXBpJztcblxuLyoqXG4gKiBJbmRpY2F0ZXMgd2hldGhlciB0byB1c2UgdGhlIHJ1bnRpbWUgZGVwZW5kZW5jeSB0cmFja2VyIGZvciBzY29wZSBjYWxjdWxhdGlvbiBpbiBKSVQgY29tcGlsYXRpb24uXG4gKiBUaGUgdmFsdWUgXCJmYWxzZVwiIG1lYW5zIHRoZSBvbGQgY29kZSBwYXRoIGJhc2VkIG9uIHBhdGNoaW5nIHNjb3BlIGluZm8gaW50byB0aGUgdHlwZXMgd2lsbCBiZVxuICogdXNlZC5cbiAqXG4gKiBAZGVwcmVjYXRlZCBGb3IgbWlncmF0aW9uIHB1cnBvc2VzIG9ubHksIHRvIGJlIHJlbW92ZWQgc29vbi5cbiAqL1xuZXhwb3J0IGNvbnN0IFVTRV9SVU5USU1FX0RFUFNfVFJBQ0tFUl9GT1JfSklUID0gZmFsc2U7XG5cbi8qKlxuICogQW4gaW1wbGVtZW50YXRpb24gb2YgRGVwc1RyYWNrZXJBcGkgd2hpY2ggd2lsbCBiZSB1c2VkIGZvciBKSVQgYW5kIGxvY2FsIGNvbXBpbGF0aW9uLlxuICovXG5jbGFzcyBEZXBzVHJhY2tlciBpbXBsZW1lbnRzIERlcHNUcmFja2VyQXBpIHtcbiAgcHJpdmF0ZSBvd25lck5nTW9kdWxlID0gbmV3IE1hcDxDb21wb25lbnRUeXBlPGFueT4sIE5nTW9kdWxlVHlwZTxhbnk+PigpO1xuICBwcml2YXRlIG5nTW9kdWxlc1dpdGhTb21lVW5yZXNvbHZlZERlY2xzID0gbmV3IFNldDxOZ01vZHVsZVR5cGU8YW55Pj4oKTtcbiAgcHJpdmF0ZSBuZ01vZHVsZXNTY29wZUNhY2hlID0gbmV3IE1hcDxOZ01vZHVsZVR5cGU8YW55PiwgTmdNb2R1bGVTY29wZT4oKTtcbiAgcHJpdmF0ZSBzdGFuZGFsb25lQ29tcG9uZW50c1Njb3BlQ2FjaGUgPSBuZXcgTWFwPENvbXBvbmVudFR5cGU8YW55PiwgU3RhbmRhbG9uZUNvbXBvbmVudFNjb3BlPigpO1xuXG4gIC8qKlxuICAgKiBBdHRlbXB0cyB0byByZXNvbHZlIG5nIG1vZHVsZSdzIGZvcndhcmQgcmVmIGRlY2xhcmF0aW9ucyBhcyBtdWNoIGFzIHBvc3NpYmxlIGFuZCBhZGQgdGhlbSB0b1xuICAgKiB0aGUgYG93bmVyTmdNb2R1bGVgIG1hcC4gVGhpcyBtZXRob2Qgbm9ybWFsbHkgc2hvdWxkIGJlIGNhbGxlZCBhZnRlciB0aGUgaW5pdGlhbCBwYXJzaW5nIHdoZW5cbiAgICogYWxsIHRoZSBmb3J3YXJkIHJlZnMgYXJlIHJlc29sdmVkIChlLmcuLCB3aGVuIHRyeWluZyB0byByZW5kZXIgYSBjb21wb25lbnQpXG4gICAqL1xuICBwcml2YXRlIHJlc29sdmVOZ01vZHVsZXNEZWNscygpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5uZ01vZHVsZXNXaXRoU29tZVVucmVzb2x2ZWREZWNscy5zaXplID09PSAwKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgZm9yIChjb25zdCBtb2R1bGVUeXBlIG9mIHRoaXMubmdNb2R1bGVzV2l0aFNvbWVVbnJlc29sdmVkRGVjbHMpIHtcbiAgICAgIGNvbnN0IGRlZiA9IGdldE5nTW9kdWxlRGVmKG1vZHVsZVR5cGUpO1xuICAgICAgaWYgKGRlZj8uZGVjbGFyYXRpb25zKSB7XG4gICAgICAgIGZvciAoY29uc3QgZGVjbCBvZiBtYXliZVVud3JhcEZuKGRlZi5kZWNsYXJhdGlvbnMpKSB7XG4gICAgICAgICAgaWYgKGlzQ29tcG9uZW50KGRlY2wpKSB7XG4gICAgICAgICAgICB0aGlzLm93bmVyTmdNb2R1bGUuc2V0KGRlY2wsIG1vZHVsZVR5cGUpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMubmdNb2R1bGVzV2l0aFNvbWVVbnJlc29sdmVkRGVjbHMuY2xlYXIoKTtcbiAgfVxuXG4gIC8qKiBAb3ZlcnJpZGUgKi9cbiAgZ2V0Q29tcG9uZW50RGVwZW5kZW5jaWVzKHR5cGU6IENvbXBvbmVudFR5cGU8YW55PiwgcmF3SW1wb3J0cz86IFJhd1Njb3BlSW5mb0Zyb21EZWNvcmF0b3JbXSk6XG4gICAgICBDb21wb25lbnREZXBlbmRlbmNpZXMge1xuICAgIHRoaXMucmVzb2x2ZU5nTW9kdWxlc0RlY2xzKCk7XG5cbiAgICBjb25zdCBkZWYgPSBnZXRDb21wb25lbnREZWYodHlwZSk7XG4gICAgaWYgKGRlZiA9PT0gbnVsbCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgIGBBdHRlbXB0aW5nIHRvIGdldCBjb21wb25lbnQgZGVwZW5kZW5jaWVzIGZvciBhIHR5cGUgdGhhdCBpcyBub3QgYSBjb21wb25lbnQ6ICR7dHlwZX1gKTtcbiAgICB9XG5cbiAgICBpZiAoZGVmLnN0YW5kYWxvbmUpIHtcbiAgICAgIGNvbnN0IHNjb3BlID0gdGhpcy5nZXRTdGFuZGFsb25lQ29tcG9uZW50U2NvcGUodHlwZSwgcmF3SW1wb3J0cyk7XG5cbiAgICAgIGlmIChzY29wZS5jb21waWxhdGlvbi5pc1BvaXNvbmVkKSB7XG4gICAgICAgIHJldHVybiB7ZGVwZW5kZW5jaWVzOiBbXX07XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB7XG4gICAgICAgIGRlcGVuZGVuY2llczogW1xuICAgICAgICAgIC4uLnNjb3BlLmNvbXBpbGF0aW9uLmRpcmVjdGl2ZXMsXG4gICAgICAgICAgLi4uc2NvcGUuY29tcGlsYXRpb24ucGlwZXMsXG4gICAgICAgICAgLi4uc2NvcGUuY29tcGlsYXRpb24ubmdNb2R1bGVzLFxuICAgICAgICBdXG4gICAgICB9O1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoIXRoaXMub3duZXJOZ01vZHVsZS5oYXModHlwZSkpIHtcbiAgICAgICAgdGhyb3cgbmV3IFJ1bnRpbWVFcnJvcihcbiAgICAgICAgICAgIFJ1bnRpbWVFcnJvckNvZGUuUlVOVElNRV9ERVBTX09SUEhBTl9DT01QT05FTlQsXG4gICAgICAgICAgICBgT3JwaGFuIGNvbXBvbmVudCBmb3VuZCEgVHJ5aW5nIHRvIHJlbmRlciB0aGUgY29tcG9uZW50ICR7XG4gICAgICAgICAgICAgICAgdHlwZS5uYW1lfSB3aXRob3V0IGZpcnN0IGxvYWRpbmcgdGhlIE5nTW9kdWxlIHRoYXQgZGVjbGFyZXMgaXQuIE1ha2Ugc3VyZSB0aGF0IHlvdSBpbXBvcnQgdGhlIGNvbXBvbmVudCdzIE5nTW9kdWxlIGluIHRoZSBOZ01vZHVsZSBvciB0aGUgc3RhbmRhbG9uZSBjb21wb25lbnQgaW4gd2hpY2ggeW91IGFyZSB0cnlpbmcgdG8gcmVuZGVyIHRoaXMgY29tcG9uZW50LiBBbHNvIG1ha2Ugc3VyZSB0aGUgd2F5IHRoZSBhcHAgaXMgYnVuZGxlZCBhbmQgc2VydmVkIGFsd2F5cyBpbmNsdWRlcyB0aGUgY29tcG9uZW50J3MgTmdNb2R1bGUgYmVmb3JlIHRoZSBjb21wb25lbnQuYCk7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHNjb3BlID0gdGhpcy5nZXROZ01vZHVsZVNjb3BlKHRoaXMub3duZXJOZ01vZHVsZS5nZXQodHlwZSkhKTtcblxuICAgICAgaWYgKHNjb3BlLmNvbXBpbGF0aW9uLmlzUG9pc29uZWQpIHtcbiAgICAgICAgcmV0dXJuIHtkZXBlbmRlbmNpZXM6IFtdfTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgZGVwZW5kZW5jaWVzOiBbXG4gICAgICAgICAgLi4uc2NvcGUuY29tcGlsYXRpb24uZGlyZWN0aXZlcyxcbiAgICAgICAgICAuLi5zY29wZS5jb21waWxhdGlvbi5waXBlcyxcbiAgICAgICAgXSxcbiAgICAgIH07XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEBvdmVycmlkZVxuICAgKiBUaGlzIGltcGxlbWVudGF0aW9uIGRvZXMgbm90IG1ha2UgdXNlIG9mIHBhcmFtIHNjb3BlSW5mbyBzaW5jZSBpdCBhc3N1bWVzIHRoZSBzY29wZSBpbmZvIGlzXG4gICAqIGFscmVhZHkgYWRkZWQgdG8gdGhlIHR5cGUgaXRzZWxmIHRocm91Z2ggbWV0aG9kcyBsaWtlIHtAbGluayDJtcm1c2V0TmdNb2R1bGVTY29wZX1cbiAgICovXG4gIHJlZ2lzdGVyTmdNb2R1bGUodHlwZTogVHlwZTxhbnk+LCBzY29wZUluZm86IE5nTW9kdWxlU2NvcGVJbmZvRnJvbURlY29yYXRvcik6IHZvaWQge1xuICAgIGlmICghaXNOZ01vZHVsZSh0eXBlKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBBdHRlbXB0aW5nIHRvIHJlZ2lzdGVyIGEgVHlwZSB3aGljaCBpcyBub3QgTmdNb2R1bGUgYXMgTmdNb2R1bGU6ICR7dHlwZX1gKTtcbiAgICB9XG5cbiAgICAvLyBMYXppbHkgcHJvY2VzcyB0aGUgTmdNb2R1bGVzIGxhdGVyIHdoZW4gbmVlZGVkLlxuICAgIHRoaXMubmdNb2R1bGVzV2l0aFNvbWVVbnJlc29sdmVkRGVjbHMuYWRkKHR5cGUpO1xuICB9XG5cbiAgLyoqIEBvdmVycmlkZSAqL1xuICBjbGVhclNjb3BlQ2FjaGVGb3IodHlwZTogVHlwZTxhbnk+KTogdm9pZCB7XG4gICAgaWYgKGlzTmdNb2R1bGUodHlwZSkpIHtcbiAgICAgIHRoaXMubmdNb2R1bGVzU2NvcGVDYWNoZS5kZWxldGUodHlwZSk7XG4gICAgfSBlbHNlIGlmIChpc0NvbXBvbmVudCh0eXBlKSkge1xuICAgICAgdGhpcy5zdGFuZGFsb25lQ29tcG9uZW50c1Njb3BlQ2FjaGUuZGVsZXRlKHR5cGUpO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBAb3ZlcnJpZGUgKi9cbiAgZ2V0TmdNb2R1bGVTY29wZSh0eXBlOiBOZ01vZHVsZVR5cGU8YW55Pik6IE5nTW9kdWxlU2NvcGUge1xuICAgIGlmICh0aGlzLm5nTW9kdWxlc1Njb3BlQ2FjaGUuaGFzKHR5cGUpKSB7XG4gICAgICByZXR1cm4gdGhpcy5uZ01vZHVsZXNTY29wZUNhY2hlLmdldCh0eXBlKSE7XG4gICAgfVxuXG4gICAgY29uc3Qgc2NvcGUgPSB0aGlzLmNvbXB1dGVOZ01vZHVsZVNjb3BlKHR5cGUpO1xuICAgIHRoaXMubmdNb2R1bGVzU2NvcGVDYWNoZS5zZXQodHlwZSwgc2NvcGUpO1xuXG4gICAgcmV0dXJuIHNjb3BlO1xuICB9XG5cbiAgLyoqIENvbXB1dGUgTmdNb2R1bGUgc2NvcGUgYWZyZXNoLiAqL1xuICBwcml2YXRlIGNvbXB1dGVOZ01vZHVsZVNjb3BlKHR5cGU6IE5nTW9kdWxlVHlwZTxhbnk+KTogTmdNb2R1bGVTY29wZSB7XG4gICAgY29uc3QgZGVmID0gZ2V0TmdNb2R1bGVEZWYodHlwZSwgdHJ1ZSk7XG4gICAgY29uc3Qgc2NvcGU6IE5nTW9kdWxlU2NvcGUgPSB7XG4gICAgICBleHBvcnRlZDoge2RpcmVjdGl2ZXM6IG5ldyBTZXQoKSwgcGlwZXM6IG5ldyBTZXQoKX0sXG4gICAgICBjb21waWxhdGlvbjoge2RpcmVjdGl2ZXM6IG5ldyBTZXQoKSwgcGlwZXM6IG5ldyBTZXQoKX0sXG4gICAgfTtcblxuICAgIC8vIEFuYWx5emluZyBpbXBvcnRzXG4gICAgZm9yIChjb25zdCBpbXBvcnRlZCBvZiBtYXliZVVud3JhcEZuKGRlZi5pbXBvcnRzKSkge1xuICAgICAgaWYgKGlzTmdNb2R1bGUoaW1wb3J0ZWQpKSB7XG4gICAgICAgIGNvbnN0IGltcG9ydGVkU2NvcGUgPSB0aGlzLmdldE5nTW9kdWxlU2NvcGUoaW1wb3J0ZWQpO1xuXG4gICAgICAgIC8vIFdoZW4gdGhpcyBtb2R1bGUgaW1wb3J0cyBhbm90aGVyLCB0aGUgaW1wb3J0ZWQgbW9kdWxlJ3MgZXhwb3J0ZWQgZGlyZWN0aXZlcyBhbmQgcGlwZXNcbiAgICAgICAgLy8gYXJlIGFkZGVkIHRvIHRoZSBjb21waWxhdGlvbiBzY29wZSBvZiB0aGlzIG1vZHVsZS5cbiAgICAgICAgYWRkU2V0KGltcG9ydGVkU2NvcGUuZXhwb3J0ZWQuZGlyZWN0aXZlcywgc2NvcGUuY29tcGlsYXRpb24uZGlyZWN0aXZlcyk7XG4gICAgICAgIGFkZFNldChpbXBvcnRlZFNjb3BlLmV4cG9ydGVkLnBpcGVzLCBzY29wZS5jb21waWxhdGlvbi5waXBlcyk7XG4gICAgICB9IGVsc2UgaWYgKGlzU3RhbmRhbG9uZShpbXBvcnRlZCkpIHtcbiAgICAgICAgaWYgKGlzRGlyZWN0aXZlKGltcG9ydGVkKSB8fCBpc0NvbXBvbmVudChpbXBvcnRlZCkpIHtcbiAgICAgICAgICBzY29wZS5jb21waWxhdGlvbi5kaXJlY3RpdmVzLmFkZChpbXBvcnRlZCk7XG4gICAgICAgIH0gZWxzZSBpZiAoaXNQaXBlKGltcG9ydGVkKSkge1xuICAgICAgICAgIHNjb3BlLmNvbXBpbGF0aW9uLnBpcGVzLmFkZChpbXBvcnRlZCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gVGhlIHN0YW5kYWxvbmUgdGhpbmcgaXMgbmVpdGhlciBhIGNvbXBvbmVudCBub3IgYSBkaXJlY3RpdmUgbm9yIGEgcGlwZSAuLi4gKHdoYXQ/KVxuICAgICAgICAgIHRocm93IG5ldyBSdW50aW1lRXJyb3IoXG4gICAgICAgICAgICAgIFJ1bnRpbWVFcnJvckNvZGUuUlVOVElNRV9ERVBTX0lOVkFMSURfSU1QT1JURURfVFlQRSxcbiAgICAgICAgICAgICAgJ1RoZSBzdGFuZGFsb25lIGltcG9ydGVkIHR5cGUgaXMgbmVpdGhlciBhIGNvbXBvbmVudCBub3IgYSBkaXJlY3RpdmUgbm9yIGEgcGlwZScpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBUaGUgaW1wb3J0IGlzIG5laXRoZXIgYSBtb2R1bGUgbm9yIGEgbW9kdWxlLXdpdGgtcHJvdmlkZXJzIG5vciBhIHN0YW5kYWxvbmUgdGhpbmcuIFRoaXNcbiAgICAgICAgLy8gaXMgZ29pbmcgdG8gYmUgYW4gZXJyb3IuIFNvIHdlIHNob3J0IGNpcmN1aXQuXG4gICAgICAgIHNjb3BlLmNvbXBpbGF0aW9uLmlzUG9pc29uZWQgPSB0cnVlO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBBbmFseXppbmcgZGVjbGFyYXRpb25zXG4gICAgaWYgKCFzY29wZS5jb21waWxhdGlvbi5pc1BvaXNvbmVkKSB7XG4gICAgICBmb3IgKGNvbnN0IGRlY2wgb2YgbWF5YmVVbndyYXBGbihkZWYuZGVjbGFyYXRpb25zKSkge1xuICAgICAgICAvLyBDYW5ub3QgZGVjbGFyZSBhbm90aGVyIE5nTW9kdWxlIG9yIGEgc3RhbmRhbG9uZSB0aGluZ1xuICAgICAgICBpZiAoaXNOZ01vZHVsZShkZWNsKSB8fCBpc1N0YW5kYWxvbmUoZGVjbCkpIHtcbiAgICAgICAgICBzY29wZS5jb21waWxhdGlvbi5pc1BvaXNvbmVkID0gdHJ1ZTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChpc1BpcGUoZGVjbCkpIHtcbiAgICAgICAgICBzY29wZS5jb21waWxhdGlvbi5waXBlcy5hZGQoZGVjbCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gZGVjbCBpcyBlaXRoZXIgYSBkaXJlY3RpdmUgb3IgYSBjb21wb25lbnQuIFRoZSBjb21wb25lbnQgbWF5IG5vdCB5ZXQgaGF2ZSB0aGUgybVjbXAgZHVlXG4gICAgICAgICAgLy8gdG8gYXN5bmMgY29tcGlsYXRpb24uXG4gICAgICAgICAgc2NvcGUuY29tcGlsYXRpb24uZGlyZWN0aXZlcy5hZGQoZGVjbCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBBbmFseXppbmcgZXhwb3J0c1xuICAgIGZvciAoY29uc3QgZXhwb3J0ZWQgb2YgbWF5YmVVbndyYXBGbihkZWYuZXhwb3J0cykpIHtcbiAgICAgIGlmIChpc05nTW9kdWxlKGV4cG9ydGVkKSkge1xuICAgICAgICAvLyBXaGVuIHRoaXMgbW9kdWxlIGV4cG9ydHMgYW5vdGhlciwgdGhlIGV4cG9ydGVkIG1vZHVsZSdzIGV4cG9ydGVkIGRpcmVjdGl2ZXMgYW5kIHBpcGVzXG4gICAgICAgIC8vIGFyZSBhZGRlZCB0byBib3RoIHRoZSBjb21waWxhdGlvbiBhbmQgZXhwb3J0ZWQgc2NvcGVzIG9mIHRoaXMgbW9kdWxlLlxuICAgICAgICBjb25zdCBleHBvcnRlZFNjb3BlID0gdGhpcy5nZXROZ01vZHVsZVNjb3BlKGV4cG9ydGVkKTtcblxuICAgICAgICAvLyBCYXNlZCBvbiB0aGUgY3VycmVudCBsb2dpYyB0aGVyZSBpcyBubyB3YXkgdG8gaGF2ZSBwb2lzb25lZCBleHBvcnRlZCBzY29wZS4gU28gbm8gbmVlZCB0b1xuICAgICAgICAvLyBjaGVjayBmb3IgaXQuXG4gICAgICAgIGFkZFNldChleHBvcnRlZFNjb3BlLmV4cG9ydGVkLmRpcmVjdGl2ZXMsIHNjb3BlLmV4cG9ydGVkLmRpcmVjdGl2ZXMpO1xuICAgICAgICBhZGRTZXQoZXhwb3J0ZWRTY29wZS5leHBvcnRlZC5waXBlcywgc2NvcGUuZXhwb3J0ZWQucGlwZXMpO1xuXG4gICAgICAgIC8vIFNvbWUgdGVzdCB0b29saW5ncyB3aGljaCBydW4gaW4gSklUIG1vZGUgZGVwZW5kIG9uIHRoaXMgYmVoYXZpb3IgdGhhdCB0aGUgZXhwb3J0ZWQgc2NvcGVcbiAgICAgICAgLy8gc2hvdWxkIGFsc28gYmUgcHJlc2VudCBpbiB0aGUgY29tcGlsYXRpb24gc2NvcGUsIGV2ZW4gdGhvdWdoIEFvVCBkb2VzIG5vdCBzdXBwb3J0IHRoaXNcbiAgICAgICAgLy8gYW5kIGl0IGlzIGFsc28gaW4gb2RkcyB3aXRoIE5nTW9kdWxlIG1ldGFkYXRhIGRlZmluaXRpb25zLiBXaXRob3V0IHRoaXMgc29tZSB0ZXN0cyBpblxuICAgICAgICAvLyBHb29nbGUgd2lsbCBmYWlsLlxuICAgICAgICBhZGRTZXQoZXhwb3J0ZWRTY29wZS5leHBvcnRlZC5kaXJlY3RpdmVzLCBzY29wZS5jb21waWxhdGlvbi5kaXJlY3RpdmVzKTtcbiAgICAgICAgYWRkU2V0KGV4cG9ydGVkU2NvcGUuZXhwb3J0ZWQucGlwZXMsIHNjb3BlLmNvbXBpbGF0aW9uLnBpcGVzKTtcbiAgICAgIH0gZWxzZSBpZiAoaXNQaXBlKGV4cG9ydGVkKSkge1xuICAgICAgICBzY29wZS5leHBvcnRlZC5waXBlcy5hZGQoZXhwb3J0ZWQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc2NvcGUuZXhwb3J0ZWQuZGlyZWN0aXZlcy5hZGQoZXhwb3J0ZWQpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBzY29wZTtcbiAgfVxuXG4gIC8qKiBAb3ZlcnJpZGUgKi9cbiAgZ2V0U3RhbmRhbG9uZUNvbXBvbmVudFNjb3BlKHR5cGU6IENvbXBvbmVudFR5cGU8YW55PiwgcmF3SW1wb3J0cz86IFJhd1Njb3BlSW5mb0Zyb21EZWNvcmF0b3JbXSk6XG4gICAgICBTdGFuZGFsb25lQ29tcG9uZW50U2NvcGUge1xuICAgIGlmICh0aGlzLnN0YW5kYWxvbmVDb21wb25lbnRzU2NvcGVDYWNoZS5oYXModHlwZSkpIHtcbiAgICAgIHJldHVybiB0aGlzLnN0YW5kYWxvbmVDb21wb25lbnRzU2NvcGVDYWNoZS5nZXQodHlwZSkhO1xuICAgIH1cblxuICAgIGNvbnN0IGFucyA9IHRoaXMuY29tcHV0ZVN0YW5kYWxvbmVDb21wb25lbnRTY29wZSh0eXBlLCByYXdJbXBvcnRzKTtcbiAgICB0aGlzLnN0YW5kYWxvbmVDb21wb25lbnRzU2NvcGVDYWNoZS5zZXQodHlwZSwgYW5zKTtcblxuICAgIHJldHVybiBhbnM7XG4gIH1cblxuICBwcml2YXRlIGNvbXB1dGVTdGFuZGFsb25lQ29tcG9uZW50U2NvcGUoXG4gICAgICB0eXBlOiBDb21wb25lbnRUeXBlPGFueT4sXG4gICAgICByYXdJbXBvcnRzPzogUmF3U2NvcGVJbmZvRnJvbURlY29yYXRvcltdKTogU3RhbmRhbG9uZUNvbXBvbmVudFNjb3BlIHtcbiAgICBjb25zdCBhbnM6IFN0YW5kYWxvbmVDb21wb25lbnRTY29wZSA9IHtcbiAgICAgIGNvbXBpbGF0aW9uOiB7XG4gICAgICAgIC8vIFN0YW5kYWxvbmUgY29tcG9uZW50cyBhcmUgYWx3YXlzIGFibGUgdG8gc2VsZi1yZWZlcmVuY2UuXG4gICAgICAgIGRpcmVjdGl2ZXM6IG5ldyBTZXQoW3R5cGVdKSxcbiAgICAgICAgcGlwZXM6IG5ldyBTZXQoKSxcbiAgICAgICAgbmdNb2R1bGVzOiBuZXcgU2V0KCksXG4gICAgICB9LFxuICAgIH07XG5cbiAgICBmb3IgKGNvbnN0IHJhd0ltcG9ydCBvZiBmbGF0dGVuKHJhd0ltcG9ydHMgPz8gW10pKSB7XG4gICAgICBjb25zdCBpbXBvcnRlZCA9IHJlc29sdmVGb3J3YXJkUmVmKHJhd0ltcG9ydCkgYXMgVHlwZTxhbnk+O1xuXG4gICAgICB0cnkge1xuICAgICAgICB2ZXJpZnlTdGFuZGFsb25lSW1wb3J0KGltcG9ydGVkLCB0eXBlKTtcbiAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgLy8gU2hvcnQtY2lyY3VpdCBpZiBhbiBpbXBvcnQgaXMgbm90IHZhbGlkXG4gICAgICAgIGFucy5jb21waWxhdGlvbi5pc1BvaXNvbmVkID0gdHJ1ZTtcbiAgICAgICAgcmV0dXJuIGFucztcbiAgICAgIH1cblxuICAgICAgaWYgKGlzTmdNb2R1bGUoaW1wb3J0ZWQpKSB7XG4gICAgICAgIGFucy5jb21waWxhdGlvbi5uZ01vZHVsZXMuYWRkKGltcG9ydGVkKTtcbiAgICAgICAgY29uc3QgaW1wb3J0ZWRTY29wZSA9IHRoaXMuZ2V0TmdNb2R1bGVTY29wZShpbXBvcnRlZCk7XG5cbiAgICAgICAgLy8gU2hvcnQtY2lyY3VpdCBpZiBhbiBpbXBvcnRlZCBOZ01vZHVsZSBoYXMgY29ycnVwdGVkIGV4cG9ydGVkIHNjb3BlLlxuICAgICAgICBpZiAoaW1wb3J0ZWRTY29wZS5leHBvcnRlZC5pc1BvaXNvbmVkKSB7XG4gICAgICAgICAgYW5zLmNvbXBpbGF0aW9uLmlzUG9pc29uZWQgPSB0cnVlO1xuICAgICAgICAgIHJldHVybiBhbnM7XG4gICAgICAgIH1cblxuICAgICAgICBhZGRTZXQoaW1wb3J0ZWRTY29wZS5leHBvcnRlZC5kaXJlY3RpdmVzLCBhbnMuY29tcGlsYXRpb24uZGlyZWN0aXZlcyk7XG4gICAgICAgIGFkZFNldChpbXBvcnRlZFNjb3BlLmV4cG9ydGVkLnBpcGVzLCBhbnMuY29tcGlsYXRpb24ucGlwZXMpO1xuICAgICAgfSBlbHNlIGlmIChpc1BpcGUoaW1wb3J0ZWQpKSB7XG4gICAgICAgIGFucy5jb21waWxhdGlvbi5waXBlcy5hZGQoaW1wb3J0ZWQpO1xuICAgICAgfSBlbHNlIGlmIChpc0RpcmVjdGl2ZShpbXBvcnRlZCkgfHwgaXNDb21wb25lbnQoaW1wb3J0ZWQpKSB7XG4gICAgICAgIGFucy5jb21waWxhdGlvbi5kaXJlY3RpdmVzLmFkZChpbXBvcnRlZCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBUaGUgaW1wb3J0ZWQgdGhpbmcgaXMgbm90IG1vZHVsZS9waXBlL2RpcmVjdGl2ZS9jb21wb25lbnQsIHNvIHdlIGVycm9yIGFuZCBzaG9ydC1jaXJjdWl0XG4gICAgICAgIC8vIGhlcmVcbiAgICAgICAgYW5zLmNvbXBpbGF0aW9uLmlzUG9pc29uZWQgPSB0cnVlO1xuICAgICAgICByZXR1cm4gYW5zO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBhbnM7XG4gIH1cbn1cblxuZnVuY3Rpb24gYWRkU2V0PFQ+KHNvdXJjZVNldDogU2V0PFQ+LCB0YXJnZXRTZXQ6IFNldDxUPik6IHZvaWQge1xuICBmb3IgKGNvbnN0IG0gb2Ygc291cmNlU2V0KSB7XG4gICAgdGFyZ2V0U2V0LmFkZChtKTtcbiAgfVxufVxuXG4vKiogVGhlIGRlcHMgdHJhY2tlciB0byBiZSB1c2VkIGluIHRoZSBjdXJyZW50IEFuZ3VsYXIgYXBwIGluIGRldiBtb2RlLiAqL1xuZXhwb3J0IGNvbnN0IGRlcHNUcmFja2VyID0gbmV3IERlcHNUcmFja2VyKCk7XG5cbmV4cG9ydCBjb25zdCBURVNUX09OTFkgPSB7RGVwc1RyYWNrZXJ9O1xuIl19