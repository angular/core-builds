/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { WrappedNodeExpr, compileInjector, compileNgModule as compileR3NgModule, jitExpression } from '@angular/compiler';
import { angularCoreEnv } from './environment';
import { NG_COMPONENT_DEF, NG_DIRECTIVE_DEF, NG_INJECTOR_DEF, NG_MODULE_DEF, NG_PIPE_DEF } from './fields';
import { reflectDependencies } from './util';
/** @type {?} */
const EMPTY_ARRAY = [];
/**
 * Compiles a module in JIT mode.
 *
 * This function automatically gets called when a class has a `\@NgModule` decorator.
 * @param {?} moduleType
 * @param {?} ngModule
 * @return {?}
 */
export function compileNgModule(moduleType, ngModule) {
    compileNgModuleDefs(moduleType, ngModule);
    setScopeOnDeclaredComponents(moduleType, ngModule);
}
/**
 * Compiles and adds the `ngModuleDef` and `ngInjectorDef` properties to the module class.
 * @param {?} moduleType
 * @param {?} ngModule
 * @return {?}
 */
export function compileNgModuleDefs(moduleType, ngModule) {
    /** @type {?} */
    const declarations = flatten(ngModule.declarations || EMPTY_ARRAY);
    /** @type {?} */
    let ngModuleDef = null;
    Object.defineProperty(moduleType, NG_MODULE_DEF, {
        get: () => {
            if (ngModuleDef === null) {
                /** @type {?} */
                const meta = {
                    type: wrap(moduleType),
                    bootstrap: flatten(ngModule.bootstrap || EMPTY_ARRAY).map(wrap),
                    declarations: declarations.map(wrapReference),
                    imports: flatten(ngModule.imports || EMPTY_ARRAY)
                        .map(expandModuleWithProviders)
                        .map(wrapReference),
                    exports: flatten(ngModule.exports || EMPTY_ARRAY)
                        .map(expandModuleWithProviders)
                        .map(wrapReference),
                    emitInline: true,
                };
                /** @type {?} */
                const res = compileR3NgModule(meta);
                ngModuleDef = jitExpression(res.expression, angularCoreEnv, `ng://${moduleType.name}/ngModuleDef.js`, []);
            }
            return ngModuleDef;
        },
        // Make the property configurable in dev mode to allow overriding in tests
        configurable: !!ngDevMode,
    });
    /** @type {?} */
    let ngInjectorDef = null;
    Object.defineProperty(moduleType, NG_INJECTOR_DEF, {
        get: () => {
            if (ngInjectorDef === null) {
                /** @type {?} */
                const meta = {
                    name: moduleType.name,
                    type: wrap(moduleType),
                    deps: reflectDependencies(moduleType),
                    providers: new WrappedNodeExpr(ngModule.providers || EMPTY_ARRAY),
                    imports: new WrappedNodeExpr([
                        ngModule.imports || EMPTY_ARRAY,
                        ngModule.exports || EMPTY_ARRAY,
                    ]),
                };
                /** @type {?} */
                const res = compileInjector(meta);
                ngInjectorDef = jitExpression(res.expression, angularCoreEnv, `ng://${moduleType.name}/ngInjectorDef.js`, res.statements);
            }
            return ngInjectorDef;
        },
        // Make the property configurable in dev mode to allow overriding in tests
        configurable: !!ngDevMode,
    });
}
/**
 * Some declared components may be compiled asynchronously, and thus may not have their
 * ngComponentDef set yet. If this is the case, then a reference to the module is written into
 * the `ngSelectorScope` property of the declared type.
 * @param {?} moduleType
 * @param {?} ngModule
 * @return {?}
 */
function setScopeOnDeclaredComponents(moduleType, ngModule) {
    /** @type {?} */
    const declarations = flatten(ngModule.declarations || EMPTY_ARRAY);
    /** @type {?} */
    const transitiveScopes = transitiveScopesFor(moduleType);
    declarations.forEach(declaration => {
        if (declaration.hasOwnProperty(NG_COMPONENT_DEF)) {
            /** @type {?} */
            const component = /** @type {?} */ (declaration);
            /** @type {?} */
            const componentDef = component.ngComponentDef;
            patchComponentDefWithScope(componentDef, transitiveScopes);
        }
        else if (!declaration.hasOwnProperty(NG_DIRECTIVE_DEF) && !declaration.hasOwnProperty(NG_PIPE_DEF)) {
            // Set `ngSelectorScope` for future reference when the component compilation finishes.
            (/** @type {?} */ (declaration)).ngSelectorScope = moduleType;
        }
    });
}
/**
 * Patch the definition of a component with directives and pipes from the compilation scope of
 * a given module.
 * @template C
 * @param {?} componentDef
 * @param {?} transitiveScopes
 * @return {?}
 */
export function patchComponentDefWithScope(componentDef, transitiveScopes) {
    componentDef.directiveDefs = () => Array.from(transitiveScopes.compilation.directives)
        .map(dir => dir.ngDirectiveDef || dir.ngComponentDef)
        .filter(def => !!def);
    componentDef.pipeDefs = () => Array.from(transitiveScopes.compilation.pipes).map(pipe => pipe.ngPipeDef);
}
/**
 * Compute the pair of transitive scopes (compilation scope and exported scope) for a given module.
 *
 * This operation is memoized and the result is cached on the module's definition. It can be called
 * on modules with components that have not fully compiled yet, but the result should not be used
 * until they have.
 * @template T
 * @param {?} moduleType
 * @return {?}
 */
export function transitiveScopesFor(moduleType) {
    if (!isNgModule(moduleType)) {
        throw new Error(`${moduleType.name} does not have an ngModuleDef`);
    }
    /** @type {?} */
    const def = moduleType.ngModuleDef;
    if (def.transitiveCompileScopes !== null) {
        return def.transitiveCompileScopes;
    }
    /** @type {?} */
    const scopes = {
        compilation: {
            directives: new Set(),
            pipes: new Set(),
        },
        exported: {
            directives: new Set(),
            pipes: new Set(),
        },
    };
    def.declarations.forEach(declared => {
        /** @type {?} */
        const declaredWithDefs = /** @type {?} */ (declared);
        if (declaredWithDefs.ngPipeDef !== undefined) {
            scopes.compilation.pipes.add(declared);
        }
        else {
            // Either declared has an ngComponentDef or ngDirectiveDef, or it's a component which hasn't
            // had its template compiled yet. In either case, it gets added to the compilation's
            // directives.
            scopes.compilation.directives.add(declared);
        }
    });
    def.imports.forEach((imported) => {
        /** @type {?} */
        const importedTyped = /** @type {?} */ (imported);
        if (!isNgModule(importedTyped)) {
            throw new Error(`Importing ${importedTyped.name} which does not have an ngModuleDef`);
        }
        /** @type {?} */
        const importedScope = transitiveScopesFor(importedTyped);
        importedScope.exported.directives.forEach(entry => scopes.compilation.directives.add(entry));
        importedScope.exported.pipes.forEach(entry => scopes.compilation.pipes.add(entry));
    });
    def.exports.forEach((exported) => {
        /** @type {?} */
        const exportedTyped = /** @type {?} */ (exported);
        // Either the type is a module, a pipe, or a component/directive (which may not have an
        // ngComponentDef as it might be compiled asynchronously).
        if (isNgModule(exportedTyped)) {
            /** @type {?} */
            const exportedScope = transitiveScopesFor(exportedTyped);
            exportedScope.exported.directives.forEach(entry => {
                scopes.compilation.directives.add(entry);
                scopes.exported.directives.add(entry);
            });
            exportedScope.exported.pipes.forEach(entry => {
                scopes.compilation.pipes.add(entry);
                scopes.exported.pipes.add(entry);
            });
        }
        else if (exportedTyped.ngPipeDef !== undefined) {
            scopes.exported.pipes.add(exportedTyped);
        }
        else {
            scopes.exported.directives.add(exportedTyped);
        }
    });
    def.transitiveCompileScopes = scopes;
    return scopes;
}
/**
 * @template T
 * @param {?} values
 * @return {?}
 */
function flatten(values) {
    /** @type {?} */
    const out = [];
    values.forEach(value => {
        if (Array.isArray(value)) {
            out.push(...flatten(value));
        }
        else {
            out.push(value);
        }
    });
    return out;
}
/**
 * @param {?} value
 * @return {?}
 */
function expandModuleWithProviders(value) {
    if (isModuleWithProviders(value)) {
        return value.ngModule;
    }
    return value;
}
/**
 * @param {?} value
 * @return {?}
 */
function wrap(value) {
    return new WrappedNodeExpr(value);
}
/**
 * @param {?} value
 * @return {?}
 */
function wrapReference(value) {
    /** @type {?} */
    const wrapped = wrap(value);
    return { value: wrapped, type: wrapped };
}
/**
 * @param {?} value
 * @return {?}
 */
function isModuleWithProviders(value) {
    return (/** @type {?} */ (value)).ngModule !== undefined;
}
/**
 * @template T
 * @param {?} value
 * @return {?}
 */
function isNgModule(value) {
    return (/** @type {?} */ (value)).ngModuleDef !== undefined;
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9kdWxlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9qaXQvbW9kdWxlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBUUEsT0FBTyxFQUFrRSxlQUFlLEVBQUUsZUFBZSxFQUFFLGVBQWUsSUFBSSxpQkFBaUIsRUFBRSxhQUFhLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQU16TCxPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0sZUFBZSxDQUFDO0FBQzdDLE9BQU8sRUFBQyxnQkFBZ0IsRUFBRSxnQkFBZ0IsRUFBRSxlQUFlLEVBQUUsYUFBYSxFQUFFLFdBQVcsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUN6RyxPQUFPLEVBQUMsbUJBQW1CLEVBQUMsTUFBTSxRQUFRLENBQUM7O0FBRTNDLE1BQU0sV0FBVyxHQUFnQixFQUFFLENBQUM7Ozs7Ozs7OztBQU9wQyxNQUFNLDBCQUEwQixVQUFxQixFQUFFLFFBQWtCO0lBQ3ZFLG1CQUFtQixDQUFDLFVBQVUsRUFBRSxRQUFRLENBQUMsQ0FBQztJQUMxQyw0QkFBNEIsQ0FBQyxVQUFVLEVBQUUsUUFBUSxDQUFDLENBQUM7Q0FDcEQ7Ozs7Ozs7QUFLRCxNQUFNLDhCQUE4QixVQUFxQixFQUFFLFFBQWtCOztJQUMzRSxNQUFNLFlBQVksR0FBZ0IsT0FBTyxDQUFDLFFBQVEsQ0FBQyxZQUFZLElBQUksV0FBVyxDQUFDLENBQUM7O0lBRWhGLElBQUksV0FBVyxHQUFRLElBQUksQ0FBQztJQUM1QixNQUFNLENBQUMsY0FBYyxDQUFDLFVBQVUsRUFBRSxhQUFhLEVBQUU7UUFDL0MsR0FBRyxFQUFFLEdBQUcsRUFBRTtZQUNSLElBQUksV0FBVyxLQUFLLElBQUksRUFBRTs7Z0JBQ3hCLE1BQU0sSUFBSSxHQUF1QjtvQkFDL0IsSUFBSSxFQUFFLElBQUksQ0FBQyxVQUFVLENBQUM7b0JBQ3RCLFNBQVMsRUFB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QUssQ0FBQyxFQUFFO1lBQ3hCLEdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxPQUFPLENBQUksS0FBSyxDQUFDLENBQUMsQ0FBQztTQUNoQzthQUFNO1lBQ0wsR0FBRyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztTQUNqQjtLQUNGLENBQUMsQ0FBQztJQUNILE9BQU8sR0FBRyxDQUFDO0NBQ1o7Ozs7O0FBRUQsbUNBQW1DLEtBQXFDO0lBQ3RFLElBQUkscUJBQXFCLENBQUMsS0FBSyxDQUFDLEVBQUU7UUFDaEMsT0FBTyxLQUFLLENBQUMsUUFBUSxDQUFDO0tBQ3ZCO0lBQ0QsT0FBTyxLQUFLLENBQUM7Q0FDZDs7Ozs7QUFFRCxjQUFjLEtBQWdCO0lBQzVCLE9BQU8sSUFBSSxlQUFlLENBQUMsS0FBSyxDQUFDLENBQUM7Q0FDbkM7Ozs7O0FBRUQsdUJBQXVCLEtBQWdCOztJQUNyQyxNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDNUIsT0FBTyxFQUFDLEtBQUssRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBQyxDQUFDO0NBQ3hDOzs7OztBQUVELCtCQUErQixLQUFVO0lBQ3ZDLE9BQU8sbUJBQUMsS0FBd0IsRUFBQyxDQUFDLFFBQVEsS0FBSyxTQUFTLENBQUM7Q0FDMUQ7Ozs7OztBQUVELG9CQUF1QixLQUFjO0lBQ25DLE9BQU8sbUJBQUMsS0FBOEMsRUFBQyxDQUFDLFdBQVcsS0FBSyxTQUFTLENBQUM7Q0FDbkYiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7RXhwcmVzc2lvbiwgUjNJbmplY3Rvck1ldGFkYXRhLCBSM05nTW9kdWxlTWV0YWRhdGEsIFIzUmVmZXJlbmNlLCBXcmFwcGVkTm9kZUV4cHIsIGNvbXBpbGVJbmplY3RvciwgY29tcGlsZU5nTW9kdWxlIGFzIGNvbXBpbGVSM05nTW9kdWxlLCBqaXRFeHByZXNzaW9ufSBmcm9tICdAYW5ndWxhci9jb21waWxlcic7XG5cbmltcG9ydCB7TW9kdWxlV2l0aFByb3ZpZGVycywgTmdNb2R1bGUsIE5nTW9kdWxlRGVmSW50ZXJuYWwsIE5nTW9kdWxlVHJhbnNpdGl2ZVNjb3Blc30gZnJvbSAnLi4vLi4vbWV0YWRhdGEvbmdfbW9kdWxlJztcbmltcG9ydCB7VHlwZX0gZnJvbSAnLi4vLi4vdHlwZSc7XG5pbXBvcnQge0NvbXBvbmVudERlZkludGVybmFsfSBmcm9tICcuLi9pbnRlcmZhY2VzL2RlZmluaXRpb24nO1xuXG5pbXBvcnQge2FuZ3VsYXJDb3JlRW52fSBmcm9tICcuL2Vudmlyb25tZW50JztcbmltcG9ydCB7TkdfQ09NUE9ORU5UX0RFRiwgTkdfRElSRUNUSVZFX0RFRiwgTkdfSU5KRUNUT1JfREVGLCBOR19NT0RVTEVfREVGLCBOR19QSVBFX0RFRn0gZnJvbSAnLi9maWVsZHMnO1xuaW1wb3J0IHtyZWZsZWN0RGVwZW5kZW5jaWVzfSBmcm9tICcuL3V0aWwnO1xuXG5jb25zdCBFTVBUWV9BUlJBWTogVHlwZTxhbnk+W10gPSBbXTtcblxuLyoqXG4gKiBDb21waWxlcyBhIG1vZHVsZSBpbiBKSVQgbW9kZS5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIGF1dG9tYXRpY2FsbHkgZ2V0cyBjYWxsZWQgd2hlbiBhIGNsYXNzIGhhcyBhIGBATmdNb2R1bGVgIGRlY29yYXRvci5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbXBpbGVOZ01vZHVsZShtb2R1bGVUeXBlOiBUeXBlPGFueT4sIG5nTW9kdWxlOiBOZ01vZHVsZSk6IHZvaWQge1xuICBjb21waWxlTmdNb2R1bGVEZWZzKG1vZHVsZVR5cGUsIG5nTW9kdWxlKTtcbiAgc2V0U2NvcGVPbkRlY2xhcmVkQ29tcG9uZW50cyhtb2R1bGVUeXBlLCBuZ01vZHVsZSk7XG59XG5cbi8qKlxuICogQ29tcGlsZXMgYW5kIGFkZHMgdGhlIGBuZ01vZHVsZURlZmAgYW5kIGBuZ0luamVjdG9yRGVmYCBwcm9wZXJ0aWVzIHRvIHRoZSBtb2R1bGUgY2xhc3MuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb21waWxlTmdNb2R1bGVEZWZzKG1vZHVsZVR5cGU6IFR5cGU8YW55PiwgbmdNb2R1bGU6IE5nTW9kdWxlKTogdm9pZCB7XG4gIGNvbnN0IGRlY2xhcmF0aW9uczogVHlwZTxhbnk+W10gPSBmbGF0dGVuKG5nTW9kdWxlLmRlY2xhcmF0aW9ucyB8fCBFTVBUWV9BUlJBWSk7XG5cbiAgbGV0IG5nTW9kdWxlRGVmOiBhbnkgPSBudWxsO1xuICBPYmplY3QuZGVmaW5lUHJvcGVydHkobW9kdWxlVHlwZSwgTkdfTU9EVUxFX0RFRiwge1xuICAgIGdldDogKCkgPT4ge1xuICAgICAgaWYgKG5nTW9kdWxlRGVmID09PSBudWxsKSB7XG4gICAgICAgIGNvbnN0IG1ldGE6IFIzTmdNb2R1bGVNZXRhZGF0YSA9IHtcbiAgICAgICAgICB0eXBlOiB3cmFwKG1vZHVsZVR5cGUpLFxuICAgICAgICAgIGJvb3RzdHJhcDogZmxhdHRlbihuZ01vZHVsZS5ib290c3RyYXAgfHwgRU1QVFlfQVJSQVkpLm1hcCh3cmFwKSxcbiAgICAgICAgICBkZWNsYXJhdGlvbnM6IGRlY2xhcmF0aW9ucy5tYXAod3JhcFJlZmVyZW5jZSksXG4gICAgICAgICAgaW1wb3J0czogZmxhdHRlbihuZ01vZHVsZS5pbXBvcnRzIHx8IEVNUFRZX0FSUkFZKVxuICAgICAgICAgICAgICAgICAgICAgICAubWFwKGV4cGFuZE1vZHVsZVdpdGhQcm92aWRlcnMpXG4gICAgICAgICAgICAgICAgICAgICAgIC5tYXAod3JhcFJlZmVyZW5jZSksXG4gICAgICAgICAgZXhwb3J0czogZmxhdHRlbihuZ01vZHVsZS5leHBvcnRzIHx8IEVNUFRZX0FSUkFZKVxuICAgICAgICAgICAgICAgICAgICAgICAubWFwKGV4cGFuZE1vZHVsZVdpdGhQcm92aWRlcnMpXG4gICAgICAgICAgICAgICAgICAgICAgIC5tYXAod3JhcFJlZmVyZW5jZSksXG4gICAgICAgICAgZW1pdElubGluZTogdHJ1ZSxcbiAgICAgICAgfTtcbiAgICAgICAgY29uc3QgcmVzID0gY29tcGlsZVIzTmdNb2R1bGUobWV0YSk7XG4gICAgICAgIG5nTW9kdWxlRGVmID0gaml0RXhwcmVzc2lvbihcbiAgICAgICAgICAgIHJlcy5leHByZXNzaW9uLCBhbmd1bGFyQ29yZUVudiwgYG5nOi8vJHttb2R1bGVUeXBlLm5hbWV9L25nTW9kdWxlRGVmLmpzYCwgW10pO1xuICAgICAgfVxuICAgICAgcmV0dXJuIG5nTW9kdWxlRGVmO1xuICAgIH0sXG4gICAgLy8gTWFrZSB0aGUgcHJvcGVydHkgY29uZmlndXJhYmxlIGluIGRldiBtb2RlIHRvIGFsbG93IG92ZXJyaWRpbmcgaW4gdGVzdHNcbiAgICBjb25maWd1cmFibGU6ICEhbmdEZXZNb2RlLFxuICB9KTtcblxuICBsZXQgbmdJbmplY3RvckRlZjogYW55ID0gbnVsbDtcbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KG1vZHVsZVR5cGUsIE5HX0lOSkVDVE9SX0RFRiwge1xuICAgIGdldDogKCkgPT4ge1xuICAgICAgaWYgKG5nSW5qZWN0b3JEZWYgPT09IG51bGwpIHtcbiAgICAgICAgY29uc3QgbWV0YTogUjNJbmplY3Rvck1ldGFkYXRhID0ge1xuICAgICAgICAgIG5hbWU6IG1vZHVsZVR5cGUubmFtZSxcbiAgICAgICAgICB0eXBlOiB3cmFwKG1vZHVsZVR5cGUpLFxuICAgICAgICAgIGRlcHM6IHJlZmxlY3REZXBlbmRlbmNpZXMobW9kdWxlVHlwZSksXG4gICAgICAgICAgcHJvdmlkZXJzOiBuZXcgV3JhcHBlZE5vZGVFeHByKG5nTW9kdWxlLnByb3ZpZGVycyB8fCBFTVBUWV9BUlJBWSksXG4gICAgICAgICAgaW1wb3J0czogbmV3IFdyYXBwZWROb2RlRXhwcihbXG4gICAgICAgICAgICBuZ01vZHVsZS5pbXBvcnRzIHx8IEVNUFRZX0FSUkFZLFxuICAgICAgICAgICAgbmdNb2R1bGUuZXhwb3J0cyB8fCBFTVBUWV9BUlJBWSxcbiAgICAgICAgICBdKSxcbiAgICAgICAgfTtcbiAgICAgICAgY29uc3QgcmVzID0gY29tcGlsZUluamVjdG9yKG1ldGEpO1xuICAgICAgICBuZ0luamVjdG9yRGVmID0gaml0RXhwcmVzc2lvbihcbiAgICAgICAgICAgIHJlcy5leHByZXNzaW9uLCBhbmd1bGFyQ29yZUVudiwgYG5nOi8vJHttb2R1bGVUeXBlLm5hbWV9L25nSW5qZWN0b3JEZWYuanNgLFxuICAgICAgICAgICAgcmVzLnN0YXRlbWVudHMpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIG5nSW5qZWN0b3JEZWY7XG4gICAgfSxcbiAgICAvLyBNYWtlIHRoZSBwcm9wZXJ0eSBjb25maWd1cmFibGUgaW4gZGV2IG1vZGUgdG8gYWxsb3cgb3ZlcnJpZGluZyBpbiB0ZXN0c1xuICAgIGNvbmZpZ3VyYWJsZTogISFuZ0Rldk1vZGUsXG4gIH0pO1xufVxuXG4vKipcbiAqIFNvbWUgZGVjbGFyZWQgY29tcG9uZW50cyBtYXkgYmUgY29tcGlsZWQgYXN5bmNocm9ub3VzbHksIGFuZCB0aHVzIG1heSBub3QgaGF2ZSB0aGVpclxuICogbmdDb21wb25lbnREZWYgc2V0IHlldC4gSWYgdGhpcyBpcyB0aGUgY2FzZSwgdGhlbiBhIHJlZmVyZW5jZSB0byB0aGUgbW9kdWxlIGlzIHdyaXR0ZW4gaW50b1xuICogdGhlIGBuZ1NlbGVjdG9yU2NvcGVgIHByb3BlcnR5IG9mIHRoZSBkZWNsYXJlZCB0eXBlLlxuICovXG5mdW5jdGlvbiBzZXRTY29wZU9uRGVjbGFyZWRDb21wb25lbnRzKG1vZHVsZVR5cGU6IFR5cGU8YW55PiwgbmdNb2R1bGU6IE5nTW9kdWxlKSB7XG4gIGNvbnN0IGRlY2xhcmF0aW9uczogVHlwZTxhbnk+W10gPSBmbGF0dGVuKG5nTW9kdWxlLmRlY2xhcmF0aW9ucyB8fCBFTVBUWV9BUlJBWSk7XG5cbiAgY29uc3QgdHJhbnNpdGl2ZVNjb3BlcyA9IHRyYW5zaXRpdmVTY29wZXNGb3IobW9kdWxlVHlwZSk7XG5cbiAgZGVjbGFyYXRpb25zLmZvckVhY2goZGVjbGFyYXRpb24gPT4ge1xuICAgIGlmIChkZWNsYXJhdGlvbi5oYXNPd25Qcm9wZXJ0eShOR19DT01QT05FTlRfREVGKSkge1xuICAgICAgLy8gQW4gYG5nQ29tcG9uZW50RGVmYCBmaWVsZCBleGlzdHMgLSBnbyBhaGVhZCBhbmQgcGF0Y2ggdGhlIGNvbXBvbmVudCBkaXJlY3RseS5cbiAgICAgIGNvbnN0IGNvbXBvbmVudCA9IGRlY2xhcmF0aW9uIGFzIFR5cGU8YW55PiYge25nQ29tcG9uZW50RGVmOiBDb21wb25lbnREZWZJbnRlcm5hbDxhbnk+fTtcbiAgICAgIGNvbnN0IGNvbXBvbmVudERlZiA9IGNvbXBvbmVudC5uZ0NvbXBvbmVudERlZjtcbiAgICAgIHBhdGNoQ29tcG9uZW50RGVmV2l0aFNjb3BlKGNvbXBvbmVudERlZiwgdHJhbnNpdGl2ZVNjb3Blcyk7XG4gICAgfSBlbHNlIGlmIChcbiAgICAgICAgIWRlY2xhcmF0aW9uLmhhc093blByb3BlcnR5KE5HX0RJUkVDVElWRV9ERUYpICYmICFkZWNsYXJhdGlvbi5oYXNPd25Qcm9wZXJ0eShOR19QSVBFX0RFRikpIHtcbiAgICAgIC8vIFNldCBgbmdTZWxlY3RvclNjb3BlYCBmb3IgZnV0dXJlIHJlZmVyZW5jZSB3aGVuIHRoZSBjb21wb25lbnQgY29tcGlsYXRpb24gZmluaXNoZXMuXG4gICAgICAoZGVjbGFyYXRpb24gYXMgVHlwZTxhbnk+JiB7bmdTZWxlY3RvclNjb3BlPzogYW55fSkubmdTZWxlY3RvclNjb3BlID0gbW9kdWxlVHlwZTtcbiAgICB9XG4gIH0pO1xufVxuXG4vKipcbiAqIFBhdGNoIHRoZSBkZWZpbml0aW9uIG9mIGEgY29tcG9uZW50IHdpdGggZGlyZWN0aXZlcyBhbmQgcGlwZXMgZnJvbSB0aGUgY29tcGlsYXRpb24gc2NvcGUgb2ZcbiAqIGEgZ2l2ZW4gbW9kdWxlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcGF0Y2hDb21wb25lbnREZWZXaXRoU2NvcGU8Qz4oXG4gICAgY29tcG9uZW50RGVmOiBDb21wb25lbnREZWZJbnRlcm5hbDxDPiwgdHJhbnNpdGl2ZVNjb3BlczogTmdNb2R1bGVUcmFuc2l0aXZlU2NvcGVzKSB7XG4gIGNvbXBvbmVudERlZi5kaXJlY3RpdmVEZWZzID0gKCkgPT4gQXJyYXkuZnJvbSh0cmFuc2l0aXZlU2NvcGVzLmNvbXBpbGF0aW9uLmRpcmVjdGl2ZXMpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5tYXAoZGlyID0+IGRpci5uZ0RpcmVjdGl2ZURlZiB8fCBkaXIubmdDb21wb25lbnREZWYpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5maWx0ZXIoZGVmID0+ICEhZGVmKTtcbiAgY29tcG9uZW50RGVmLnBpcGVEZWZzID0gKCkgPT5cbiAgICAgIEFycmF5LmZyb20odHJhbnNpdGl2ZVNjb3Blcy5jb21waWxhdGlvbi5waXBlcykubWFwKHBpcGUgPT4gcGlwZS5uZ1BpcGVEZWYpO1xufVxuXG4vKipcbiAqIENvbXB1dGUgdGhlIHBhaXIgb2YgdHJhbnNpdGl2ZSBzY29wZXMgKGNvbXBpbGF0aW9uIHNjb3BlIGFuZCBleHBvcnRlZCBzY29wZSkgZm9yIGEgZ2l2ZW4gbW9kdWxlLlxuICpcbiAqIFRoaXMgb3BlcmF0aW9uIGlzIG1lbW9pemVkIGFuZCB0aGUgcmVzdWx0IGlzIGNhY2hlZCBvbiB0aGUgbW9kdWxlJ3MgZGVmaW5pdGlvbi4gSXQgY2FuIGJlIGNhbGxlZFxuICogb24gbW9kdWxlcyB3aXRoIGNvbXBvbmVudHMgdGhhdCBoYXZlIG5vdCBmdWxseSBjb21waWxlZCB5ZXQsIGJ1dCB0aGUgcmVzdWx0IHNob3VsZCBub3QgYmUgdXNlZFxuICogdW50aWwgdGhleSBoYXZlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gdHJhbnNpdGl2ZVNjb3Blc0ZvcjxUPihtb2R1bGVUeXBlOiBUeXBlPFQ+KTogTmdNb2R1bGVUcmFuc2l0aXZlU2NvcGVzIHtcbiAgaWYgKCFpc05nTW9kdWxlKG1vZHVsZVR5cGUpKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGAke21vZHVsZVR5cGUubmFtZX0gZG9lcyBub3QgaGF2ZSBhbiBuZ01vZHVsZURlZmApO1xuICB9XG4gIGNvbnN0IGRlZiA9IG1vZHVsZVR5cGUubmdNb2R1bGVEZWY7XG5cbiAgaWYgKGRlZi50cmFuc2l0aXZlQ29tcGlsZVNjb3BlcyAhPT0gbnVsbCkge1xuICAgIHJldHVybiBkZWYudHJhbnNpdGl2ZUNvbXBpbGVTY29wZXM7XG4gIH1cblxuICBjb25zdCBzY29wZXM6IE5nTW9kdWxlVHJhbnNpdGl2ZVNjb3BlcyA9IHtcbiAgICBjb21waWxhdGlvbjoge1xuICAgICAgZGlyZWN0aXZlczogbmV3IFNldDxhbnk+KCksXG4gICAgICBwaXBlczogbmV3IFNldDxhbnk+KCksXG4gICAgfSxcbiAgICBleHBvcnRlZDoge1xuICAgICAgZGlyZWN0aXZlczogbmV3IFNldDxhbnk+KCksXG4gICAgICBwaXBlczogbmV3IFNldDxhbnk+KCksXG4gICAgfSxcbiAgfTtcblxuICBkZWYuZGVjbGFyYXRpb25zLmZvckVhY2goZGVjbGFyZWQgPT4ge1xuICAgIGNvbnN0IGRlY2xhcmVkV2l0aERlZnMgPSBkZWNsYXJlZCBhcyBUeXBlPGFueT4mIHsgbmdQaXBlRGVmPzogYW55OyB9O1xuXG4gICAgaWYgKGRlY2xhcmVkV2l0aERlZnMubmdQaXBlRGVmICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHNjb3Blcy5jb21waWxhdGlvbi5waXBlcy5hZGQoZGVjbGFyZWQpO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBFaXRoZXIgZGVjbGFyZWQgaGFzIGFuIG5nQ29tcG9uZW50RGVmIG9yIG5nRGlyZWN0aXZlRGVmLCBvciBpdCdzIGEgY29tcG9uZW50IHdoaWNoIGhhc24ndFxuICAgICAgLy8gaGFkIGl0cyB0ZW1wbGF0ZSBjb21waWxlZCB5ZXQuIEluIGVpdGhlciBjYXNlLCBpdCBnZXRzIGFkZGVkIHRvIHRoZSBjb21waWxhdGlvbidzXG4gICAgICAvLyBkaXJlY3RpdmVzLlxuICAgICAgc2NvcGVzLmNvbXBpbGF0aW9uLmRpcmVjdGl2ZXMuYWRkKGRlY2xhcmVkKTtcbiAgICB9XG4gIH0pO1xuXG4gIGRlZi5pbXBvcnRzLmZvckVhY2goPEk+KGltcG9ydGVkOiBUeXBlPEk+KSA9PiB7XG4gICAgY29uc3QgaW1wb3J0ZWRUeXBlZCA9IGltcG9ydGVkIGFzIFR5cGU8ST4mIHtcbiAgICAgIC8vIElmIGltcG9ydGVkIGlzIGFuIEBOZ01vZHVsZTpcbiAgICAgIG5nTW9kdWxlRGVmPzogTmdNb2R1bGVEZWZJbnRlcm5hbDxJPjtcbiAgICB9O1xuXG4gICAgaWYgKCFpc05nTW9kdWxlPEk+KGltcG9ydGVkVHlwZWQpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYEltcG9ydGluZyAke2ltcG9ydGVkVHlwZWQubmFtZX0gd2hpY2ggZG9lcyBub3QgaGF2ZSBhbiBuZ01vZHVsZURlZmApO1xuICAgIH1cblxuICAgIC8vIFdoZW4gdGhpcyBtb2R1bGUgaW1wb3J0cyBhbm90aGVyLCB0aGUgaW1wb3J0ZWQgbW9kdWxlJ3MgZXhwb3J0ZWQgZGlyZWN0aXZlcyBhbmQgcGlwZXMgYXJlXG4gICAgLy8gYWRkZWQgdG8gdGhlIGNvbXBpbGF0aW9uIHNjb3BlIG9mIHRoaXMgbW9kdWxlLlxuICAgIGNvbnN0IGltcG9ydGVkU2NvcGUgPSB0cmFuc2l0aXZlU2NvcGVzRm9yKGltcG9ydGVkVHlwZWQpO1xuICAgIGltcG9ydGVkU2NvcGUuZXhwb3J0ZWQuZGlyZWN0aXZlcy5mb3JFYWNoKGVudHJ5ID0+IHNjb3Blcy5jb21waWxhdGlvbi5kaXJlY3RpdmVzLmFkZChlbnRyeSkpO1xuICAgIGltcG9ydGVkU2NvcGUuZXhwb3J0ZWQucGlwZXMuZm9yRWFjaChlbnRyeSA9PiBzY29wZXMuY29tcGlsYXRpb24ucGlwZXMuYWRkKGVudHJ5KSk7XG4gIH0pO1xuXG4gIGRlZi5leHBvcnRzLmZvckVhY2goPEU+KGV4cG9ydGVkOiBUeXBlPEU+KSA9PiB7XG4gICAgY29uc3QgZXhwb3J0ZWRUeXBlZCA9IGV4cG9ydGVkIGFzIFR5cGU8RT4mIHtcbiAgICAgIC8vIENvbXBvbmVudHMsIERpcmVjdGl2ZXMsIE5nTW9kdWxlcywgYW5kIFBpcGVzIGNhbiBhbGwgYmUgZXhwb3J0ZWQuXG4gICAgICBuZ0NvbXBvbmVudERlZj86IGFueTtcbiAgICAgIG5nRGlyZWN0aXZlRGVmPzogYW55O1xuICAgICAgbmdNb2R1bGVEZWY/OiBOZ01vZHVsZURlZkludGVybmFsPEU+O1xuICAgICAgbmdQaXBlRGVmPzogYW55O1xuICAgIH07XG5cbiAgICAvLyBFaXRoZXIgdGhlIHR5cGUgaXMgYSBtb2R1bGUsIGEgcGlwZSwgb3IgYSBjb21wb25lbnQvZGlyZWN0aXZlICh3aGljaCBtYXkgbm90IGhhdmUgYW5cbiAgICAvLyBuZ0NvbXBvbmVudERlZiBhcyBpdCBtaWdodCBiZSBjb21waWxlZCBhc3luY2hyb25vdXNseSkuXG4gICAgaWYgKGlzTmdNb2R1bGUoZXhwb3J0ZWRUeXBlZCkpIHtcbiAgICAgIC8vIFdoZW4gdGhpcyBtb2R1bGUgZXhwb3J0cyBhbm90aGVyLCB0aGUgZXhwb3J0ZWQgbW9kdWxlJ3MgZXhwb3J0ZWQgZGlyZWN0aXZlcyBhbmQgcGlwZXMgYXJlXG4gICAgICAvLyBhZGRlZCB0byBib3RoIHRoZSBjb21waWxhdGlvbiBhbmQgZXhwb3J0ZWQgc2NvcGVzIG9mIHRoaXMgbW9kdWxlLlxuICAgICAgY29uc3QgZXhwb3J0ZWRTY29wZSA9IHRyYW5zaXRpdmVTY29wZXNGb3IoZXhwb3J0ZWRUeXBlZCk7XG4gICAgICBleHBvcnRlZFNjb3BlLmV4cG9ydGVkLmRpcmVjdGl2ZXMuZm9yRWFjaChlbnRyeSA9PiB7XG4gICAgICAgIHNjb3Blcy5jb21waWxhdGlvbi5kaXJlY3RpdmVzLmFkZChlbnRyeSk7XG4gICAgICAgIHNjb3Blcy5leHBvcnRlZC5kaXJlY3RpdmVzLmFkZChlbnRyeSk7XG4gICAgICB9KTtcbiAgICAgIGV4cG9ydGVkU2NvcGUuZXhwb3J0ZWQucGlwZXMuZm9yRWFjaChlbnRyeSA9PiB7XG4gICAgICAgIHNjb3Blcy5jb21waWxhdGlvbi5waXBlcy5hZGQoZW50cnkpO1xuICAgICAgICBzY29wZXMuZXhwb3J0ZWQucGlwZXMuYWRkKGVudHJ5KTtcbiAgICAgIH0pO1xuICAgIH0gZWxzZSBpZiAoZXhwb3J0ZWRUeXBlZC5uZ1BpcGVEZWYgIT09IHVuZGVmaW5lZCkge1xuICAgICAgc2NvcGVzLmV4cG9ydGVkLnBpcGVzLmFkZChleHBvcnRlZFR5cGVkKTtcbiAgICB9IGVsc2Uge1xuICAgICAgc2NvcGVzLmV4cG9ydGVkLmRpcmVjdGl2ZXMuYWRkKGV4cG9ydGVkVHlwZWQpO1xuICAgIH1cbiAgfSk7XG5cbiAgZGVmLnRyYW5zaXRpdmVDb21waWxlU2NvcGVzID0gc2NvcGVzO1xuICByZXR1cm4gc2NvcGVzO1xufVxuXG5mdW5jdGlvbiBmbGF0dGVuPFQ+KHZhbHVlczogYW55W10pOiBUW10ge1xuICBjb25zdCBvdXQ6IFRbXSA9IFtdO1xuICB2YWx1ZXMuZm9yRWFjaCh2YWx1ZSA9PiB7XG4gICAgaWYgKEFycmF5LmlzQXJyYXkodmFsdWUpKSB7XG4gICAgICBvdXQucHVzaCguLi5mbGF0dGVuPFQ+KHZhbHVlKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG91dC5wdXNoKHZhbHVlKTtcbiAgICB9XG4gIH0pO1xuICByZXR1cm4gb3V0O1xufVxuXG5mdW5jdGlvbiBleHBhbmRNb2R1bGVXaXRoUHJvdmlkZXJzKHZhbHVlOiBUeXBlPGFueT58IE1vZHVsZVdpdGhQcm92aWRlcnMpOiBUeXBlPGFueT4ge1xuICBpZiAoaXNNb2R1bGVXaXRoUHJvdmlkZXJzKHZhbHVlKSkge1xuICAgIHJldHVybiB2YWx1ZS5uZ01vZHVsZTtcbiAgfVxuICByZXR1cm4gdmFsdWU7XG59XG5cbmZ1bmN0aW9uIHdyYXAodmFsdWU6IFR5cGU8YW55Pik6IEV4cHJlc3Npb24ge1xuICByZXR1cm4gbmV3IFdyYXBwZWROb2RlRXhwcih2YWx1ZSk7XG59XG5cbmZ1bmN0aW9uIHdyYXBSZWZlcmVuY2UodmFsdWU6IFR5cGU8YW55Pik6IFIzUmVmZXJlbmNlIHtcbiAgY29uc3Qgd3JhcHBlZCA9IHdyYXAodmFsdWUpO1xuICByZXR1cm4ge3ZhbHVlOiB3cmFwcGVkLCB0eXBlOiB3cmFwcGVkfTtcbn1cblxuZnVuY3Rpb24gaXNNb2R1bGVXaXRoUHJvdmlkZXJzKHZhbHVlOiBhbnkpOiB2YWx1ZSBpcyBNb2R1bGVXaXRoUHJvdmlkZXJzIHtcbiAgcmV0dXJuICh2YWx1ZSBhc3tuZ01vZHVsZT86IGFueX0pLm5nTW9kdWxlICE9PSB1bmRlZmluZWQ7XG59XG5cbmZ1bmN0aW9uIGlzTmdNb2R1bGU8VD4odmFsdWU6IFR5cGU8VD4pOiB2YWx1ZSBpcyBUeXBlPFQ+JntuZ01vZHVsZURlZjogTmdNb2R1bGVEZWZJbnRlcm5hbDxUPn0ge1xuICByZXR1cm4gKHZhbHVlIGFze25nTW9kdWxlRGVmPzogTmdNb2R1bGVEZWZJbnRlcm5hbDxUPn0pLm5nTW9kdWxlRGVmICE9PSB1bmRlZmluZWQ7XG59XG4iXX0=