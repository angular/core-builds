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
import { WrappedNodeExpr, compilePipeFromMetadata, jitExpression } from '@angular/compiler';
import { stringify } from '../util';
import { angularCoreEnv } from './environment';
import { NG_PIPE_DEF } from './fields';
import { reflectDependencies } from './util';
/**
 * @param {?} type
 * @param {?} meta
 * @return {?}
 */
export function compilePipe(type, meta) {
    /** @type {?} */
    let ngPipeDef = null;
    Object.defineProperty(type, NG_PIPE_DEF, {
        get: () => {
            if (ngPipeDef === null) {
                /** @type {?} */
                const sourceMapUrl = `ng://${stringify(type)}/ngPipeDef.js`;
                /** @type {?} */
                const name = type.name;
                /** @type {?} */
                const res = compilePipeFromMetadata({
                    name,
                    type: new WrappedNodeExpr(type),
                    deps: reflectDependencies(type),
                    pipeName: meta.name,
                    pure: meta.pure !== undefined ? meta.pure : true,
                });
                ngPipeDef = jitExpression(res.expression, angularCoreEnv, sourceMapUrl, res.statements);
            }
            return ngPipeDef;
        },
        // Make the property configurable in dev mode to allow overriding in tests
        configurable: !!ngDevMode,
    });
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGlwZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvaml0L3BpcGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFRQSxPQUFPLEVBQUMsZUFBZSxFQUFFLHVCQUF1QixFQUFFLGFBQWEsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBSTFGLE9BQU8sRUFBQyxTQUFTLEVBQUMsTUFBTSxTQUFTLENBQUM7QUFFbEMsT0FBTyxFQUFDLGNBQWMsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUM3QyxPQUFPLEVBQUMsV0FBVyxFQUFDLE1BQU0sVUFBVSxDQUFDO0FBQ3JDLE9BQU8sRUFBQyxtQkFBbUIsRUFBQyxNQUFNLFFBQVEsQ0FBQzs7Ozs7O0FBRTNDLE1BQU0sVUFBVSxXQUFXLENBQUMsSUFBZSxFQUFFLElBQVU7O0lBQ3JELElBQUksU0FBUyxHQUFRLElBQUksQ0FBQztJQUMxQixNQUFNLENBQUMsY0FBYyxDQUFDLElBQUksRUFBRSxXQUFXLEVBQUU7UUFDdkMsR0FBRyxFQUFFLEdBQUcsRUFBRTtZQUNSLElBQUksU0FBUyxLQUFLLElBQUksRUFBRTs7Z0JBQ3RCLE1BQU0sWUFBWSxHQUFHLFFBQVEsU0FBUyxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUM7O2dCQUU1RCxNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDOztnQkFDdkIsTUFBTSxHQUFHLEdBQUcsdUJBQXVCLENBQUM7b0JBQ2xDLElBQUk7b0JBQ0osSUFBSSxFQUFFLElBQUksZUFBZSxDQUFDLElBQUksQ0FBQztvQkFDL0IsSUFBSSxFQUFFLG1CQUFtQixDQUFDLElBQUksQ0FBQztvQkFDL0IsUUFBUSxFQUFFLElBQUksQ0FBQyxJQUFJO29CQUNuQixJQUFJLEVBQUUsSUFBSSxDQUFDLElBQUksS0FBSyxTQUFTLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUk7aUJBQ2pELENBQUMsQ0FBQztnQkFFSCxTQUFTLEdBQUcsYUFBYSxDQUFDLEdBQUcsQ0FBQyxVQUFVLEVBQUUsY0FBYyxFQUFFLFlBQVksRUFBRSxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUM7YUFDekY7WUFDRCxPQUFPLFNBQVMsQ0FBQztTQUNsQjs7UUFFRCxZQUFZLEVBQUUsQ0FBQyxDQUFDLFNBQVM7S0FDMUIsQ0FBQyxDQUFDO0NBQ0oiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7V3JhcHBlZE5vZGVFeHByLCBjb21waWxlUGlwZUZyb21NZXRhZGF0YSwgaml0RXhwcmVzc2lvbn0gZnJvbSAnQGFuZ3VsYXIvY29tcGlsZXInO1xuXG5pbXBvcnQge1BpcGV9IGZyb20gJy4uLy4uL21ldGFkYXRhL2RpcmVjdGl2ZXMnO1xuaW1wb3J0IHtUeXBlfSBmcm9tICcuLi8uLi90eXBlJztcbmltcG9ydCB7c3RyaW5naWZ5fSBmcm9tICcuLi91dGlsJztcblxuaW1wb3J0IHthbmd1bGFyQ29yZUVudn0gZnJvbSAnLi9lbnZpcm9ubWVudCc7XG5pbXBvcnQge05HX1BJUEVfREVGfSBmcm9tICcuL2ZpZWxkcyc7XG5pbXBvcnQge3JlZmxlY3REZXBlbmRlbmNpZXN9IGZyb20gJy4vdXRpbCc7XG5cbmV4cG9ydCBmdW5jdGlvbiBjb21waWxlUGlwZSh0eXBlOiBUeXBlPGFueT4sIG1ldGE6IFBpcGUpOiB2b2lkIHtcbiAgbGV0IG5nUGlwZURlZjogYW55ID0gbnVsbDtcbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHR5cGUsIE5HX1BJUEVfREVGLCB7XG4gICAgZ2V0OiAoKSA9PiB7XG4gICAgICBpZiAobmdQaXBlRGVmID09PSBudWxsKSB7XG4gICAgICAgIGNvbnN0IHNvdXJjZU1hcFVybCA9IGBuZzovLyR7c3RyaW5naWZ5KHR5cGUpfS9uZ1BpcGVEZWYuanNgO1xuXG4gICAgICAgIGNvbnN0IG5hbWUgPSB0eXBlLm5hbWU7XG4gICAgICAgIGNvbnN0IHJlcyA9IGNvbXBpbGVQaXBlRnJvbU1ldGFkYXRhKHtcbiAgICAgICAgICBuYW1lLFxuICAgICAgICAgIHR5cGU6IG5ldyBXcmFwcGVkTm9kZUV4cHIodHlwZSksXG4gICAgICAgICAgZGVwczogcmVmbGVjdERlcGVuZGVuY2llcyh0eXBlKSxcbiAgICAgICAgICBwaXBlTmFtZTogbWV0YS5uYW1lLFxuICAgICAgICAgIHB1cmU6IG1ldGEucHVyZSAhPT0gdW5kZWZpbmVkID8gbWV0YS5wdXJlIDogdHJ1ZSxcbiAgICAgICAgfSk7XG5cbiAgICAgICAgbmdQaXBlRGVmID0gaml0RXhwcmVzc2lvbihyZXMuZXhwcmVzc2lvbiwgYW5ndWxhckNvcmVFbnYsIHNvdXJjZU1hcFVybCwgcmVzLnN0YXRlbWVudHMpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIG5nUGlwZURlZjtcbiAgICB9LFxuICAgIC8vIE1ha2UgdGhlIHByb3BlcnR5IGNvbmZpZ3VyYWJsZSBpbiBkZXYgbW9kZSB0byBhbGxvdyBvdmVycmlkaW5nIGluIHRlc3RzXG4gICAgY29uZmlndXJhYmxlOiAhIW5nRGV2TW9kZSxcbiAgfSk7XG59XG4iXX0=