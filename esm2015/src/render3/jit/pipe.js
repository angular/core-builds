/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { getCompilerFacade } from '../../compiler/compiler_facade';
import { reflectDependencies } from '../../di/jit/util';
import { NG_PIPE_DEF } from '../fields';
import { renderStringify } from '../util';
import { angularCoreEnv } from './environment';
/**
 * @param {?} type
 * @param {?} meta
 * @return {?}
 */
export function compilePipe(type, meta) {
    /** @type {?} */
    /** @nocollapse */ let ngPipeDef = null;
    Object.defineProperty(type, NG_PIPE_DEF, {
        get: () => {
            if (ngPipeDef === null) {
                ngPipeDef = getCompilerFacade().compilePipe(angularCoreEnv, `ng://${renderStringify(type)}/ngPipeDef.js`, {
                    type: type,
                    name: type.name,
                    deps: reflectDependencies(type),
                    pipeName: meta.name,
                    pure: meta.pure !== undefined ? meta.pure : true
                });
            }
            return ngPipeDef;
        },
        // Make the property configurable in dev mode to allow overriding in tests
        configurable: !!ngDevMode,
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGlwZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvaml0L3BpcGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFRQSxPQUFPLEVBQUMsaUJBQWlCLEVBQUMsTUFBTSxnQ0FBZ0MsQ0FBQztBQUNqRSxPQUFPLEVBQUMsbUJBQW1CLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUd0RCxPQUFPLEVBQUMsV0FBVyxFQUFDLE1BQU0sV0FBVyxDQUFDO0FBQ3RDLE9BQU8sRUFBQyxlQUFlLEVBQUMsTUFBTSxTQUFTLENBQUM7QUFFeEMsT0FBTyxFQUFDLGNBQWMsRUFBQyxNQUFNLGVBQWUsQ0FBQzs7Ozs7O0FBRTdDLE1BQU0sVUFBVSxXQUFXLENBQUMsSUFBZSxFQUFFLElBQVU7O1FBQ2pELFNBQVMsR0FBUSxJQUFJO0lBQ3pCLE1BQU0sQ0FBQyxjQUFjLENBQUMsSUFBSSxFQUFFLFdBQVcsRUFBRTtRQUN2QyxHQUFHLEVBQUUsR0FBRyxFQUFFO1lBQ1IsSUFBSSxTQUFTLEtBQUssSUFBSSxFQUFFO2dCQUN0QixTQUFTLEdBQUcsaUJBQWlCLEVBQUUsQ0FBQyxXQUFXLENBQ3ZDLGNBQWMsRUFBRSxRQUFRLGVBQWUsQ0FBQyxJQUFJLENBQUMsZUFBZSxFQUFFO29CQUM1RCxJQUFJLEVBQUUsSUFBSTtvQkFDVixJQUFJLEVBQUUsSUFBSSxDQUFDLElBQUk7b0JBQ2YsSUFBSSxFQUFFLG1CQUFtQixDQUFDLElBQUksQ0FBQztvQkFDL0IsUUFBUSxFQUFFLElBQUksQ0FBQyxJQUFJO29CQUNuQixJQUFJLEVBQUUsSUFBSSxDQUFDLElBQUksS0FBSyxTQUFTLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUk7aUJBQ2pELENBQUMsQ0FBQzthQUNSO1lBQ0QsT0FBTyxTQUFTLENBQUM7UUFDbkIsQ0FBQzs7UUFFRCxZQUFZLEVBQUUsQ0FBQyxDQUFDLFNBQVM7S0FDMUIsQ0FBQyxDQUFDO0FBQ0wsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtnZXRDb21waWxlckZhY2FkZX0gZnJvbSAnLi4vLi4vY29tcGlsZXIvY29tcGlsZXJfZmFjYWRlJztcbmltcG9ydCB7cmVmbGVjdERlcGVuZGVuY2llc30gZnJvbSAnLi4vLi4vZGkvaml0L3V0aWwnO1xuaW1wb3J0IHtUeXBlfSBmcm9tICcuLi8uLi9pbnRlcmZhY2UvdHlwZSc7XG5pbXBvcnQge1BpcGV9IGZyb20gJy4uLy4uL21ldGFkYXRhL2RpcmVjdGl2ZXMnO1xuaW1wb3J0IHtOR19QSVBFX0RFRn0gZnJvbSAnLi4vZmllbGRzJztcbmltcG9ydCB7cmVuZGVyU3RyaW5naWZ5fSBmcm9tICcuLi91dGlsJztcblxuaW1wb3J0IHthbmd1bGFyQ29yZUVudn0gZnJvbSAnLi9lbnZpcm9ubWVudCc7XG5cbmV4cG9ydCBmdW5jdGlvbiBjb21waWxlUGlwZSh0eXBlOiBUeXBlPGFueT4sIG1ldGE6IFBpcGUpOiB2b2lkIHtcbiAgbGV0IG5nUGlwZURlZjogYW55ID0gbnVsbDtcbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHR5cGUsIE5HX1BJUEVfREVGLCB7XG4gICAgZ2V0OiAoKSA9PiB7XG4gICAgICBpZiAobmdQaXBlRGVmID09PSBudWxsKSB7XG4gICAgICAgIG5nUGlwZURlZiA9IGdldENvbXBpbGVyRmFjYWRlKCkuY29tcGlsZVBpcGUoXG4gICAgICAgICAgICBhbmd1bGFyQ29yZUVudiwgYG5nOi8vJHtyZW5kZXJTdHJpbmdpZnkodHlwZSl9L25nUGlwZURlZi5qc2AsIHtcbiAgICAgICAgICAgICAgdHlwZTogdHlwZSxcbiAgICAgICAgICAgICAgbmFtZTogdHlwZS5uYW1lLFxuICAgICAgICAgICAgICBkZXBzOiByZWZsZWN0RGVwZW5kZW5jaWVzKHR5cGUpLFxuICAgICAgICAgICAgICBwaXBlTmFtZTogbWV0YS5uYW1lLFxuICAgICAgICAgICAgICBwdXJlOiBtZXRhLnB1cmUgIT09IHVuZGVmaW5lZCA/IG1ldGEucHVyZSA6IHRydWVcbiAgICAgICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgcmV0dXJuIG5nUGlwZURlZjtcbiAgICB9LFxuICAgIC8vIE1ha2UgdGhlIHByb3BlcnR5IGNvbmZpZ3VyYWJsZSBpbiBkZXYgbW9kZSB0byBhbGxvdyBvdmVycmlkaW5nIGluIHRlc3RzXG4gICAgY29uZmlndXJhYmxlOiAhIW5nRGV2TW9kZSxcbiAgfSk7XG59XG4iXX0=