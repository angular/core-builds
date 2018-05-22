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
import { WrappedNodeExpr, compileNgModule as compileIvyNgModule, jitPatchDefinition } from '@angular/compiler';
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
    const /** @type {?} */ res = compileIvyNgModule(meta);
    // Compute transitiveCompileScope
    const /** @type {?} */ transitiveCompileScope = {
        directives: /** @type {?} */ ([]),
        pipes: /** @type {?} */ ([]),
    };
    flatten(ngModule.declarations || EMPTY_ARRAY).forEach(decl => {
        if (decl.ngPipeDef) {
            transitiveCompileScope.pipes.push(decl);
        }
        else if (decl.ngComponentDef) {
            transitiveCompileScope.directives.push(decl);
            patchComponentWithScope(decl, /** @type {?} */ (type));
        }
        else {
            transitiveCompileScope.directives.push(decl);
            decl.ngSelectorScope = type;
        }
    });
    /**
     * @param {?} module
     * @return {?}
     */
    function addExportsFrom(module) {
        module.ngModuleDef.exports.forEach((exp) => {
            if (isNgModule(exp)) {
                addExportsFrom(exp);
            }
            else if (exp.ngPipeDef) {
                transitiveCompileScope.pipes.push(exp);
            }
            else {
                transitiveCompileScope.directives.push(exp);
            }
        });
    }
    flatten([(ngModule.imports || EMPTY_ARRAY), (ngModule.exports || EMPTY_ARRAY)])
        .filter(importExport => isNgModule(importExport))
        .forEach(mod => addExportsFrom(mod));
    jitPatchDefinition(type, 'ngModuleDef', res.expression, angularCoreEnv);
    (/** @type {?} */ ((/** @type {?} */ (type)).ngModuleDef)).transitiveCompileScope = transitiveCompileScope;
}
/**
 * @template C, M
 * @param {?} component
 * @param {?} module
 * @return {?}
 */
export function patchComponentWithScope(component, module) {
    component.ngComponentDef.directiveDefs = () => /** @type {?} */ ((module.ngModuleDef.transitiveCompileScope)).directives.map(dir => dir.ngDirectiveDef || dir.ngComponentDef);
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9kdWxlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9qaXQvbW9kdWxlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBUUEsT0FBTyxFQUFpQyxlQUFlLEVBQUUsZUFBZSxJQUFJLGtCQUFrQixFQUFFLGtCQUFrQixFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFLN0ksT0FBTyxFQUFDLE9BQU8sRUFBQyxNQUFNLFNBQVMsQ0FBQztBQUVoQyxPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0sZUFBZSxDQUFDO0FBRTdDLHVCQUFNLFdBQVcsR0FBZ0IsRUFBRSxDQUFDOzs7Ozs7QUFFcEMsTUFBTSwwQkFBMEIsSUFBZSxFQUFFLFFBQWtCO0lBQ2pFLHVCQUFNLElBQUksR0FBdUI7UUFDL0IsSUFBSSxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUM7UUFDaEIsU0FBUyxFQUFFLE9BQU8sQ0FBQyxRQUFRLENBQUMsU0FBUyxJQUFJLFdBQVcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUM7UUFDL0QsWUFBWSxFQUFFLE9BQU8sQ0FBQyxRQUFRLENBQUMsWUFBWSxJQUFJLFdBQVcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUM7UUFDckUsT0FBTyxFQUFFLE9BQU8sQ0FBQyxRQUFRLENBQUMsT0FBTyxJQUFJLFdBQVcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUM7UUFDMUYsT0FBTyxFQUFFLE9BQU8sQ0FBQyxRQUFRLENBQUMsT0FBTyxJQUFJLFdBQVcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUM7UUFDMUYsVUFBVSxFQUFFLElBQUk7S0FDakIsQ0FBQztJQUNGLHVCQUFNLEdBQUcsR0FBRyxrQkFBa0IsQ0FBQyxJQUFJLENB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QStCLEtBQVU7SUFDdkMsT0FBTyxLQUFLLENBQUMsUUFBUSxLQUFLLFNBQVMsQ0FBQztDQUNyQzs7Ozs7QUFFRCxvQkFBb0IsS0FBVTtJQUM1QixPQUFPLEtBQUssQ0FBQyxXQUFXLEtBQUssU0FBUyxDQUFDO0NBQ3hDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0V4cHJlc3Npb24sIFIzTmdNb2R1bGVNZXRhZGF0YSwgV3JhcHBlZE5vZGVFeHByLCBjb21waWxlTmdNb2R1bGUgYXMgY29tcGlsZUl2eU5nTW9kdWxlLCBqaXRQYXRjaERlZmluaXRpb259IGZyb20gJ0Bhbmd1bGFyL2NvbXBpbGVyJztcblxuaW1wb3J0IHtNb2R1bGVXaXRoUHJvdmlkZXJzLCBOZ01vZHVsZSwgTmdNb2R1bGVEZWZ9IGZyb20gJy4uLy4uL21ldGFkYXRhL25nX21vZHVsZSc7XG5pbXBvcnQge1R5cGV9IGZyb20gJy4uLy4uL3R5cGUnO1xuaW1wb3J0IHtDb21wb25lbnREZWZ9IGZyb20gJy4uL2ludGVyZmFjZXMvZGVmaW5pdGlvbic7XG5pbXBvcnQge2ZsYXR0ZW59IGZyb20gJy4uL3V0aWwnO1xuXG5pbXBvcnQge2FuZ3VsYXJDb3JlRW52fSBmcm9tICcuL2Vudmlyb25tZW50JztcblxuY29uc3QgRU1QVFlfQVJSQVk6IFR5cGU8YW55PltdID0gW107XG5cbmV4cG9ydCBmdW5jdGlvbiBjb21waWxlTmdNb2R1bGUodHlwZTogVHlwZTxhbnk+LCBuZ01vZHVsZTogTmdNb2R1bGUpOiB2b2lkIHtcbiAgY29uc3QgbWV0YTogUjNOZ01vZHVsZU1ldGFkYXRhID0ge1xuICAgIHR5cGU6IHdyYXAodHlwZSksXG4gICAgYm9vdHN0cmFwOiBmbGF0dGVuKG5nTW9kdWxlLmJvb3RzdHJhcCB8fCBFTVBUWV9BUlJBWSkubWFwKHdyYXApLFxuICAgIGRlY2xhcmF0aW9uczogZmxhdHRlbihuZ01vZHVsZS5kZWNsYXJhdGlvbnMgfHwgRU1QVFlfQVJSQVkpLm1hcCh3cmFwKSxcbiAgICBpbXBvcnRzOiBmbGF0dGVuKG5nTW9kdWxlLmltcG9ydHMgfHwgRU1QVFlfQVJSQVkpLm1hcChleHBhbmRNb2R1bGVXaXRoUHJvdmlkZXJzKS5tYXAod3JhcCksXG4gICAgZXhwb3J0czogZmxhdHRlbihuZ01vZHVsZS5leHBvcnRzIHx8IEVNUFRZX0FSUkFZKS5tYXAoZXhwYW5kTW9kdWxlV2l0aFByb3ZpZGVycykubWFwKHdyYXApLFxuICAgIGVtaXRJbmxpbmU6IHRydWUsXG4gIH07XG4gIGNvbnN0IHJlcyA9IGNvbXBpbGVJdnlOZ01vZHVsZShtZXRhKTtcblxuICAvLyBDb21wdXRlIHRyYW5zaXRpdmVDb21waWxlU2NvcGVcbiAgY29uc3QgdHJhbnNpdGl2ZUNvbXBpbGVTY29wZSA9IHtcbiAgICBkaXJlY3RpdmVzOiBbXSBhcyBhbnlbXSxcbiAgICBwaXBlczogW10gYXMgYW55W10sXG4gIH07XG4gIGZsYXR0ZW4obmdNb2R1bGUuZGVjbGFyYXRpb25zIHx8IEVNUFRZX0FSUkFZKS5mb3JFYWNoKGRlY2wgPT4ge1xuICAgIGlmIChkZWNsLm5nUGlwZURlZikge1xuICAgICAgdHJhbnNpdGl2ZUNvbXBpbGVTY29wZS5waXBlcy5wdXNoKGRlY2wpO1xuICAgIH0gZWxzZSBpZiAoZGVjbC5uZ0NvbXBvbmVudERlZikge1xuICAgICAgdHJhbnNpdGl2ZUNvbXBpbGVTY29wZS5kaXJlY3RpdmVzLnB1c2goZGVjbCk7XG4gICAgICBwYXRjaENvbXBvbmVudFdpdGhTY29wZShkZWNsLCB0eXBlIGFzIGFueSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRyYW5zaXRpdmVDb21waWxlU2NvcGUuZGlyZWN0aXZlcy5wdXNoKGRlY2wpO1xuICAgICAgZGVjbC5uZ1NlbGVjdG9yU2NvcGUgPSB0eXBlO1xuICAgIH1cbiAgfSk7XG5cbiAgZnVuY3Rpb24gYWRkRXhwb3J0c0Zyb20obW9kdWxlOiBUeXBlPGFueT4mIHtuZ01vZHVsZURlZjogTmdNb2R1bGVEZWY8YW55Pn0pOiB2b2lkIHtcbiAgICBtb2R1bGUubmdNb2R1bGVEZWYuZXhwb3J0cy5mb3JFYWNoKChleHA6IGFueSkgPT4ge1xuICAgICAgaWYgKGlzTmdNb2R1bGUoZXhwKSkge1xuICAgICAgICBhZGRFeHBvcnRzRnJvbShleHApO1xuICAgICAgfSBlbHNlIGlmIChleHAubmdQaXBlRGVmKSB7XG4gICAgICAgIHRyYW5zaXRpdmVDb21waWxlU2NvcGUucGlwZXMucHVzaChleHApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdHJhbnNpdGl2ZUNvbXBpbGVTY29wZS5kaXJlY3RpdmVzLnB1c2goZXhwKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIGZsYXR0ZW4oWyhuZ01vZHVsZS5pbXBvcnRzIHx8IEVNUFRZX0FSUkFZKSwgKG5nTW9kdWxlLmV4cG9ydHMgfHwgRU1QVFlfQVJSQVkpXSlcbiAgICAgIC5maWx0ZXIoaW1wb3J0RXhwb3J0ID0+IGlzTmdNb2R1bGUoaW1wb3J0RXhwb3J0KSlcbiAgICAgIC5mb3JFYWNoKG1vZCA9PiBhZGRFeHBvcnRzRnJvbShtb2QpKTtcbiAgaml0UGF0Y2hEZWZpbml0aW9uKHR5cGUsICduZ01vZHVsZURlZicsIHJlcy5leHByZXNzaW9uLCBhbmd1bGFyQ29yZUVudik7XG4gICgodHlwZSBhcyBhbnkpLm5nTW9kdWxlRGVmIGFzIE5nTW9kdWxlRGVmPGFueT4pLnRyYW5zaXRpdmVDb21waWxlU2NvcGUgPSB0cmFuc2l0aXZlQ29tcGlsZVNjb3BlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcGF0Y2hDb21wb25lbnRXaXRoU2NvcGU8QywgTT4oXG4gICAgY29tcG9uZW50OiBUeXBlPEM+JiB7bmdDb21wb25lbnREZWY6IENvbXBvbmVudERlZjxDPn0sXG4gICAgbW9kdWxlOiBUeXBlPE0+JiB7bmdNb2R1bGVEZWY6IE5nTW9kdWxlRGVmPE0+fSkge1xuICBjb21wb25lbnQubmdDb21wb25lbnREZWYuZGlyZWN0aXZlRGVmcyA9ICgpID0+XG4gICAgICBtb2R1bGUubmdNb2R1bGVEZWYudHJhbnNpdGl2ZUNvbXBpbGVTY29wZSAhLmRpcmVjdGl2ZXMubWFwKFxuICAgICAgICAgIGRpciA9PiBkaXIubmdEaXJlY3RpdmVEZWYgfHwgZGlyLm5nQ29tcG9uZW50RGVmKTtcbiAgY29tcG9uZW50Lm5nQ29tcG9uZW50RGVmLnBpcGVEZWZzID0gKCkgPT5cbiAgICAgIG1vZHVsZS5uZ01vZHVsZURlZi50cmFuc2l0aXZlQ29tcGlsZVNjb3BlICEucGlwZXMubWFwKHBpcGUgPT4gcGlwZS5uZ1BpcGVEZWYpO1xufVxuXG5mdW5jdGlvbiBleHBhbmRNb2R1bGVXaXRoUHJvdmlkZXJzKHZhbHVlOiBUeXBlPGFueT58IE1vZHVsZVdpdGhQcm92aWRlcnMpOiBUeXBlPGFueT4ge1xuICBpZiAoaXNNb2R1bGVXaXRoUHJvdmlkZXJzKHZhbHVlKSkge1xuICAgIHJldHVybiB2YWx1ZS5uZ01vZHVsZTtcbiAgfVxuICByZXR1cm4gdmFsdWU7XG59XG5cbmZ1bmN0aW9uIHdyYXAodmFsdWU6IFR5cGU8YW55Pik6IEV4cHJlc3Npb24ge1xuICByZXR1cm4gbmV3IFdyYXBwZWROb2RlRXhwcih2YWx1ZSk7XG59XG5cbmZ1bmN0aW9uIGlzTW9kdWxlV2l0aFByb3ZpZGVycyh2YWx1ZTogYW55KTogdmFsdWUgaXMgTW9kdWxlV2l0aFByb3ZpZGVycyB7XG4gIHJldHVybiB2YWx1ZS5uZ01vZHVsZSAhPT0gdW5kZWZpbmVkO1xufVxuXG5mdW5jdGlvbiBpc05nTW9kdWxlKHZhbHVlOiBhbnkpOiB2YWx1ZSBpcyBUeXBlPGFueT4me25nTW9kdWxlRGVmOiBOZ01vZHVsZURlZjxhbnk+fSB7XG4gIHJldHVybiB2YWx1ZS5uZ01vZHVsZURlZiAhPT0gdW5kZWZpbmVkO1xufVxuIl19