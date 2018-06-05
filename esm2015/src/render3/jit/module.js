/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { WrappedNodeExpr, compileNgModule as compileR3NgModule, jitExpression } from '@angular/compiler';
import { flatten } from '../util';
import { angularCoreEnv } from './environment';
const /** @type {?} */ EMPTY_ARRAY = [];
/**
 * @param {?} type
 * @param {?} ngModule
 * @return {?}
 */
export function compileNgModule(type, ngModule) {
    const /** @type {?} */ meta = {
        type: wrap(type),
        bootstrap: flatten(ngModule.bootstrap || EMPTY_ARRAY).map(wrap),
        declarations: flatten(ngModule.declarations || EMPTY_ARRAY).map(wrap),
        imports: flatten(ngModule.imports || EMPTY_ARRAY).map(expandModuleWithProviders).map(wrap),
        exports: flatten(ngModule.exports || EMPTY_ARRAY).map(expandModuleWithProviders).map(wrap),
        emitInline: true,
    };
    // Compute transitiveCompileScope
    const /** @type {?} */ transitiveCompileScope = {
        directives: new Set(),
        pipes: new Set(),
        modules: new Set(),
    };
    /**
     * @param {?} module
     * @return {?}
     */
    function addExportsFrom(module) {
        if (!transitiveCompileScope.modules.has(module)) {
            module.ngModuleDef.exports.forEach((exp) => {
                if (isNgModule(exp)) {
                    addExportsFrom(exp);
                }
                else if (exp.ngPipeDef) {
                    transitiveCompileScope.pipes.add(exp);
                }
                else {
                    transitiveCompileScope.directives.add(exp);
                }
            });
        }
    }
    flatten([
        (ngModule.imports || EMPTY_ARRAY), (ngModule.exports || EMPTY_ARRAY)
    ]).forEach(importExport => {
        const /** @type {?} */ maybeModule = expandModuleWithProviders(importExport);
        if (isNgModule(maybeModule)) {
            addExportsFrom(maybeModule);
        }
    });
    flatten(ngModule.declarations || EMPTY_ARRAY).forEach(decl => {
        if (decl.ngPipeDef) {
            transitiveCompileScope.pipes.add(decl);
        }
        else if (decl.ngDirectiveDef) {
            transitiveCompileScope.directives.add(decl);
        }
        else if (decl.ngComponentDef) {
            transitiveCompileScope.directives.add(decl);
            patchComponentWithScope(decl, /** @type {?} */ (type));
        }
        else {
            // A component that has not been compiled yet because the template is being fetched
            // we need to store a reference to the module to update the selector scope after
            // the component gets compiled
            transitiveCompileScope.directives.add(decl);
            decl.ngSelectorScope = type;
        }
    });
    let /** @type {?} */ def = null;
    Object.defineProperty(type, 'ngModuleDef', {
        get: () => {
            if (def === null) {
                const /** @type {?} */ meta = {
                    type: wrap(type),
                    bootstrap: flatten(ngModule.bootstrap || EMPTY_ARRAY).map(wrap),
                    declarations: flatten(ngModule.declarations || EMPTY_ARRAY).map(wrap),
                    imports: flatten(ngModule.imports || EMPTY_ARRAY).map(expandModuleWithProviders).map(wrap),
                    exports: flatten(ngModule.exports || EMPTY_ARRAY).map(expandModuleWithProviders).map(wrap),
                    emitInline: true,
                };
                const /** @type {?} */ res = compileR3NgModule(meta);
                def = jitExpression(res.expression, angularCoreEnv, `ng://${type.name}/ngModuleDef.js`);
                def.transitiveCompileScope = {
                    directives: Array.from(transitiveCompileScope.directives),
                    pipes: Array.from(transitiveCompileScope.pipes),
                };
            }
            return def;
        },
    });
}
/**
 * @template C, M
 * @param {?} component
 * @param {?} module
 * @return {?}
 */
export function patchComponentWithScope(component, module) {
    component.ngComponentDef.directiveDefs = () => /** @type {?} */ ((module.ngModuleDef.transitiveCompileScope)).directives.map(dir => dir.ngDirectiveDef || dir.ngComponentDef).filter(def => !!def);
    component.ngComponentDef.pipeDefs = () => /** @type {?} */ ((module.ngModuleDef.transitiveCompileScope)).pipes.map(pipe => pipe.ngPipeDef);
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
function isModuleWithProviders(value) {
    return value.ngModule !== undefined;
}
/**
 * @param {?} value
 * @return {?}
 */
function isNgModule(value) {
    return value.ngModuleDef !== undefined;
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9kdWxlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9qaXQvbW9kdWxlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBUUEsT0FBTyxFQUFpQyxlQUFlLEVBQUUsZUFBZSxJQUFJLGlCQUFpQixFQUFFLGFBQWEsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBS3ZJLE9BQU8sRUFBQyxPQUFPLEVBQUMsTUFBTSxTQUFTLENBQUM7QUFFaEMsT0FBTyxFQUFDLGNBQWMsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUU3Qyx1QkFBTSxXQUFXLEdBQWdCLEVBQUUsQ0FBQzs7Ozs7O0FBRXBDLE1BQU0sMEJBQTBCLElBQWUsRUFBRSxRQUFrQjtJQUNqRSx1QkFBTSxJQUFJLEdBQXVCO1FBQy9CLElBQUksRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDO1FBQ2hCLFNBQVMsRUFBRSxPQUFPLENBQUMsUUFBUSxDQUFDLFNBQVMsSUFBSSxXQUFXLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDO1FBQy9ELFlBQVksRUFBRSxPQUFPLENBQUMsUUFBUSxDQUFDLFlBQVksSUFBSSxXQUFXLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDO1FBQ3JFLE9BQU8sRUFBRSxPQUFPLENBQUMsUUFBUSxDQUFDLE9BQU8sSUFBSSxXQUFXLENBQUMsQ0FBQyxHQUFHLENBQUMseUJBQXlCLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDO1FBQzFGLE9BQU8sRUFBRSxPQUFPLENBQUMsUUFBUSxDQUFDLE9BQU8sSUFBSSxXQUFXLENBQUMsQ0FBQyxHQUFHLENBQUMseUJBQXlCLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDO1FBQzFGLFVBQVUsRUFBRSxJQUFJO0tBQ2pCLENBQUM7O0lBR0YsdUJBQU0sc0JBQXNCLEdBQUc7UUFDN0IsVUFBVSxFQUFFLElB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QUssQ0FBQyxFQUFFO1FBQ2hDLE9BQU8sS0FBSyxDQUFDLFFBQVEsQ0FBQztLQUN2QjtJQUNELE9BQU8sS0FBSyxDQUFDO0NBQ2Q7Ozs7O0FBRUQsY0FBYyxLQUFnQjtJQUM1QixPQUFPLElBQUksZUFBZSxDQUFDLEtBQUssQ0FBQyxDQUFDO0NBQ25DOzs7OztBQUVELCtCQUErQixLQUFVO0lBQ3ZDLE9BQU8sS0FBSyxDQUFDLFFBQVEsS0FBSyxTQUFTLENBQUM7Q0FDckM7Ozs7O0FBRUQsb0JBQW9CLEtBQVU7SUFDNUIsT0FBTyxLQUFLLENBQUMsV0FBVyxLQUFLLFNBQVMsQ0FBQztDQUN4QyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtFeHByZXNzaW9uLCBSM05nTW9kdWxlTWV0YWRhdGEsIFdyYXBwZWROb2RlRXhwciwgY29tcGlsZU5nTW9kdWxlIGFzIGNvbXBpbGVSM05nTW9kdWxlLCBqaXRFeHByZXNzaW9ufSBmcm9tICdAYW5ndWxhci9jb21waWxlcic7XG5cbmltcG9ydCB7TW9kdWxlV2l0aFByb3ZpZGVycywgTmdNb2R1bGUsIE5nTW9kdWxlRGVmfSBmcm9tICcuLi8uLi9tZXRhZGF0YS9uZ19tb2R1bGUnO1xuaW1wb3J0IHtUeXBlfSBmcm9tICcuLi8uLi90eXBlJztcbmltcG9ydCB7Q29tcG9uZW50RGVmfSBmcm9tICcuLi9pbnRlcmZhY2VzL2RlZmluaXRpb24nO1xuaW1wb3J0IHtmbGF0dGVufSBmcm9tICcuLi91dGlsJztcblxuaW1wb3J0IHthbmd1bGFyQ29yZUVudn0gZnJvbSAnLi9lbnZpcm9ubWVudCc7XG5cbmNvbnN0IEVNUFRZX0FSUkFZOiBUeXBlPGFueT5bXSA9IFtdO1xuXG5leHBvcnQgZnVuY3Rpb24gY29tcGlsZU5nTW9kdWxlKHR5cGU6IFR5cGU8YW55PiwgbmdNb2R1bGU6IE5nTW9kdWxlKTogdm9pZCB7XG4gIGNvbnN0IG1ldGE6IFIzTmdNb2R1bGVNZXRhZGF0YSA9IHtcbiAgICB0eXBlOiB3cmFwKHR5cGUpLFxuICAgIGJvb3RzdHJhcDogZmxhdHRlbihuZ01vZHVsZS5ib290c3RyYXAgfHwgRU1QVFlfQVJSQVkpLm1hcCh3cmFwKSxcbiAgICBkZWNsYXJhdGlvbnM6IGZsYXR0ZW4obmdNb2R1bGUuZGVjbGFyYXRpb25zIHx8IEVNUFRZX0FSUkFZKS5tYXAod3JhcCksXG4gICAgaW1wb3J0czogZmxhdHRlbihuZ01vZHVsZS5pbXBvcnRzIHx8IEVNUFRZX0FSUkFZKS5tYXAoZXhwYW5kTW9kdWxlV2l0aFByb3ZpZGVycykubWFwKHdyYXApLFxuICAgIGV4cG9ydHM6IGZsYXR0ZW4obmdNb2R1bGUuZXhwb3J0cyB8fCBFTVBUWV9BUlJBWSkubWFwKGV4cGFuZE1vZHVsZVdpdGhQcm92aWRlcnMpLm1hcCh3cmFwKSxcbiAgICBlbWl0SW5saW5lOiB0cnVlLFxuICB9O1xuXG4gIC8vIENvbXB1dGUgdHJhbnNpdGl2ZUNvbXBpbGVTY29wZVxuICBjb25zdCB0cmFuc2l0aXZlQ29tcGlsZVNjb3BlID0ge1xuICAgIGRpcmVjdGl2ZXM6IG5ldyBTZXQ8YW55PigpLFxuICAgIHBpcGVzOiBuZXcgU2V0PGFueT4oKSxcbiAgICBtb2R1bGVzOiBuZXcgU2V0PGFueT4oKSxcbiAgfTtcblxuICBmdW5jdGlvbiBhZGRFeHBvcnRzRnJvbShtb2R1bGU6IFR5cGU8YW55PiYge25nTW9kdWxlRGVmOiBOZ01vZHVsZURlZjxhbnk+fSk6IHZvaWQge1xuICAgIGlmICghdHJhbnNpdGl2ZUNvbXBpbGVTY29wZS5tb2R1bGVzLmhhcyhtb2R1bGUpKSB7XG4gICAgICBtb2R1bGUubmdNb2R1bGVEZWYuZXhwb3J0cy5mb3JFYWNoKChleHA6IGFueSkgPT4ge1xuICAgICAgICBpZiAoaXNOZ01vZHVsZShleHApKSB7XG4gICAgICAgICAgYWRkRXhwb3J0c0Zyb20oZXhwKTtcbiAgICAgICAgfSBlbHNlIGlmIChleHAubmdQaXBlRGVmKSB7XG4gICAgICAgICAgdHJhbnNpdGl2ZUNvbXBpbGVTY29wZS5waXBlcy5hZGQoZXhwKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0cmFuc2l0aXZlQ29tcGlsZVNjb3BlLmRpcmVjdGl2ZXMuYWRkKGV4cCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIGZsYXR0ZW4oW1xuICAgIChuZ01vZHVsZS5pbXBvcnRzIHx8IEVNUFRZX0FSUkFZKSwgKG5nTW9kdWxlLmV4cG9ydHMgfHwgRU1QVFlfQVJSQVkpXG4gIF0pLmZvckVhY2goaW1wb3J0RXhwb3J0ID0+IHtcbiAgICBjb25zdCBtYXliZU1vZHVsZSA9IGV4cGFuZE1vZHVsZVdpdGhQcm92aWRlcnMoaW1wb3J0RXhwb3J0KTtcbiAgICBpZiAoaXNOZ01vZHVsZShtYXliZU1vZHVsZSkpIHtcbiAgICAgIGFkZEV4cG9ydHNGcm9tKG1heWJlTW9kdWxlKTtcbiAgICB9XG4gIH0pO1xuXG4gIGZsYXR0ZW4obmdNb2R1bGUuZGVjbGFyYXRpb25zIHx8IEVNUFRZX0FSUkFZKS5mb3JFYWNoKGRlY2wgPT4ge1xuICAgIGlmIChkZWNsLm5nUGlwZURlZikge1xuICAgICAgdHJhbnNpdGl2ZUNvbXBpbGVTY29wZS5waXBlcy5hZGQoZGVjbCk7XG4gICAgfSBlbHNlIGlmIChkZWNsLm5nRGlyZWN0aXZlRGVmKSB7XG4gICAgICB0cmFuc2l0aXZlQ29tcGlsZVNjb3BlLmRpcmVjdGl2ZXMuYWRkKGRlY2wpO1xuICAgIH0gZWxzZSBpZiAoZGVjbC5uZ0NvbXBvbmVudERlZikge1xuICAgICAgdHJhbnNpdGl2ZUNvbXBpbGVTY29wZS5kaXJlY3RpdmVzLmFkZChkZWNsKTtcbiAgICAgIHBhdGNoQ29tcG9uZW50V2l0aFNjb3BlKGRlY2wsIHR5cGUgYXMgYW55KTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gQSBjb21wb25lbnQgdGhhdCBoYXMgbm90IGJlZW4gY29tcGlsZWQgeWV0IGJlY2F1c2UgdGhlIHRlbXBsYXRlIGlzIGJlaW5nIGZldGNoZWRcbiAgICAgIC8vIHdlIG5lZWQgdG8gc3RvcmUgYSByZWZlcmVuY2UgdG8gdGhlIG1vZHVsZSB0byB1cGRhdGUgdGhlIHNlbGVjdG9yIHNjb3BlIGFmdGVyXG4gICAgICAvLyB0aGUgY29tcG9uZW50IGdldHMgY29tcGlsZWRcbiAgICAgIHRyYW5zaXRpdmVDb21waWxlU2NvcGUuZGlyZWN0aXZlcy5hZGQoZGVjbCk7XG4gICAgICBkZWNsLm5nU2VsZWN0b3JTY29wZSA9IHR5cGU7XG4gICAgfVxuICB9KTtcblxuICBsZXQgZGVmOiBhbnkgPSBudWxsO1xuICBPYmplY3QuZGVmaW5lUHJvcGVydHkodHlwZSwgJ25nTW9kdWxlRGVmJywge1xuICAgIGdldDogKCkgPT4ge1xuICAgICAgaWYgKGRlZiA9PT0gbnVsbCkge1xuICAgICAgICBjb25zdCBtZXRhOiBSM05nTW9kdWxlTWV0YWRhdGEgPSB7XG4gICAgICAgICAgdHlwZTogd3JhcCh0eXBlKSxcbiAgICAgICAgICBib290c3RyYXA6IGZsYXR0ZW4obmdNb2R1bGUuYm9vdHN0cmFwIHx8IEVNUFRZX0FSUkFZKS5tYXAod3JhcCksXG4gICAgICAgICAgZGVjbGFyYXRpb25zOiBmbGF0dGVuKG5nTW9kdWxlLmRlY2xhcmF0aW9ucyB8fCBFTVBUWV9BUlJBWSkubWFwKHdyYXApLFxuICAgICAgICAgIGltcG9ydHM6XG4gICAgICAgICAgICAgIGZsYXR0ZW4obmdNb2R1bGUuaW1wb3J0cyB8fCBFTVBUWV9BUlJBWSkubWFwKGV4cGFuZE1vZHVsZVdpdGhQcm92aWRlcnMpLm1hcCh3cmFwKSxcbiAgICAgICAgICBleHBvcnRzOlxuICAgICAgICAgICAgICBmbGF0dGVuKG5nTW9kdWxlLmV4cG9ydHMgfHwgRU1QVFlfQVJSQVkpLm1hcChleHBhbmRNb2R1bGVXaXRoUHJvdmlkZXJzKS5tYXAod3JhcCksXG4gICAgICAgICAgZW1pdElubGluZTogdHJ1ZSxcbiAgICAgICAgfTtcbiAgICAgICAgY29uc3QgcmVzID0gY29tcGlsZVIzTmdNb2R1bGUobWV0YSk7XG4gICAgICAgIGRlZiA9IGppdEV4cHJlc3Npb24ocmVzLmV4cHJlc3Npb24sIGFuZ3VsYXJDb3JlRW52LCBgbmc6Ly8ke3R5cGUubmFtZX0vbmdNb2R1bGVEZWYuanNgKTtcbiAgICAgICAgZGVmLnRyYW5zaXRpdmVDb21waWxlU2NvcGUgPSB7XG4gICAgICAgICAgZGlyZWN0aXZlczogQXJyYXkuZnJvbSh0cmFuc2l0aXZlQ29tcGlsZVNjb3BlLmRpcmVjdGl2ZXMpLFxuICAgICAgICAgIHBpcGVzOiBBcnJheS5mcm9tKHRyYW5zaXRpdmVDb21waWxlU2NvcGUucGlwZXMpLFxuICAgICAgICB9O1xuICAgICAgfVxuICAgICAgcmV0dXJuIGRlZjtcbiAgICB9LFxuICB9KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHBhdGNoQ29tcG9uZW50V2l0aFNjb3BlPEMsIE0+KFxuICAgIGNvbXBvbmVudDogVHlwZTxDPiYge25nQ29tcG9uZW50RGVmOiBDb21wb25lbnREZWY8Qz59LFxuICAgIG1vZHVsZTogVHlwZTxNPiYge25nTW9kdWxlRGVmOiBOZ01vZHVsZURlZjxNPn0pIHtcbiAgY29tcG9uZW50Lm5nQ29tcG9uZW50RGVmLmRpcmVjdGl2ZURlZnMgPSAoKSA9PlxuICAgICAgbW9kdWxlLm5nTW9kdWxlRGVmLnRyYW5zaXRpdmVDb21waWxlU2NvcGUgIS5kaXJlY3RpdmVzXG4gICAgICAgICAgLm1hcChkaXIgPT4gZGlyLm5nRGlyZWN0aXZlRGVmIHx8IGRpci5uZ0NvbXBvbmVudERlZilcbiAgICAgICAgICAuZmlsdGVyKGRlZiA9PiAhIWRlZik7XG4gIGNvbXBvbmVudC5uZ0NvbXBvbmVudERlZi5waXBlRGVmcyA9ICgpID0+XG4gICAgICBtb2R1bGUubmdNb2R1bGVEZWYudHJhbnNpdGl2ZUNvbXBpbGVTY29wZSAhLnBpcGVzLm1hcChwaXBlID0+IHBpcGUubmdQaXBlRGVmKTtcbn1cblxuZnVuY3Rpb24gZXhwYW5kTW9kdWxlV2l0aFByb3ZpZGVycyh2YWx1ZTogVHlwZTxhbnk+fCBNb2R1bGVXaXRoUHJvdmlkZXJzKTogVHlwZTxhbnk+IHtcbiAgaWYgKGlzTW9kdWxlV2l0aFByb3ZpZGVycyh2YWx1ZSkpIHtcbiAgICByZXR1cm4gdmFsdWUubmdNb2R1bGU7XG4gIH1cbiAgcmV0dXJuIHZhbHVlO1xufVxuXG5mdW5jdGlvbiB3cmFwKHZhbHVlOiBUeXBlPGFueT4pOiBFeHByZXNzaW9uIHtcbiAgcmV0dXJuIG5ldyBXcmFwcGVkTm9kZUV4cHIodmFsdWUpO1xufVxuXG5mdW5jdGlvbiBpc01vZHVsZVdpdGhQcm92aWRlcnModmFsdWU6IGFueSk6IHZhbHVlIGlzIE1vZHVsZVdpdGhQcm92aWRlcnMge1xuICByZXR1cm4gdmFsdWUubmdNb2R1bGUgIT09IHVuZGVmaW5lZDtcbn1cblxuZnVuY3Rpb24gaXNOZ01vZHVsZSh2YWx1ZTogYW55KTogdmFsdWUgaXMgVHlwZTxhbnk+JntuZ01vZHVsZURlZjogTmdNb2R1bGVEZWY8YW55Pn0ge1xuICByZXR1cm4gdmFsdWUubmdNb2R1bGVEZWYgIT09IHVuZGVmaW5lZDtcbn1cbiJdfQ==