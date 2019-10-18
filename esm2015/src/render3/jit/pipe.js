/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
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
import { NG_FACTORY_DEF, NG_PIPE_DEF } from '../fields';
import { angularCoreEnv } from './environment';
/**
 * @param {?} type
 * @param {?} meta
 * @return {?}
 */
export function compilePipe(type, meta) {
    /** @type {?} */
    let ngPipeDef = null;
    /** @type {?} */
    let ngFactoryDef = null;
    Object.defineProperty(type, NG_FACTORY_DEF, {
        get: (/**
         * @return {?}
         */
        () => {
            if (ngFactoryDef === null) {
                /** @type {?} */
                const metadata = getPipeMetadata(type, meta);
                ngFactoryDef = getCompilerFacade().compileFactory(angularCoreEnv, `ng:///${metadata.name}/ɵfac.js`, Object.assign(Object.assign({}, metadata), { injectFn: 'directiveInject', isPipe: true }));
            }
            return ngFactoryDef;
        }),
        // Make the property configurable in dev mode to allow overriding in tests
        configurable: !!ngDevMode,
    });
    Object.defineProperty(type, NG_PIPE_DEF, {
        get: (/**
         * @return {?}
         */
        () => {
            if (ngPipeDef === null) {
                /** @type {?} */
                const metadata = getPipeMetadata(type, meta);
                ngPipeDef = getCompilerFacade().compilePipe(angularCoreEnv, `ng:///${metadata.name}/ɵpipe.js`, metadata);
            }
            return ngPipeDef;
        }),
        // Make the property configurable in dev mode to allow overriding in tests
        configurable: !!ngDevMode,
    });
}
/**
 * @param {?} type
 * @param {?} meta
 * @return {?}
 */
function getPipeMetadata(type, meta) {
    return {
        type: type,
        typeArgumentCount: 0,
        name: type.name,
        deps: reflectDependencies(type),
        pipeName: meta.name,
        pure: meta.pure !== undefined ? meta.pure : true
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGlwZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvaml0L3BpcGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFRQSxPQUFPLEVBQXVCLGlCQUFpQixFQUFDLE1BQU0sZ0NBQWdDLENBQUM7QUFDdkYsT0FBTyxFQUFDLG1CQUFtQixFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFHdEQsT0FBTyxFQUFDLGNBQWMsRUFBRSxXQUFXLEVBQUMsTUFBTSxXQUFXLENBQUM7QUFFdEQsT0FBTyxFQUFDLGNBQWMsRUFBQyxNQUFNLGVBQWUsQ0FBQzs7Ozs7O0FBRTdDLE1BQU0sVUFBVSxXQUFXLENBQUMsSUFBZSxFQUFFLElBQVU7O1FBQ2pELFNBQVMsR0FBUSxJQUFJOztRQUNyQixZQUFZLEdBQVEsSUFBSTtJQUU1QixNQUFNLENBQUMsY0FBYyxDQUFDLElBQUksRUFBRSxjQUFjLEVBQUU7UUFDMUMsR0FBRzs7O1FBQUUsR0FBRyxFQUFFO1lBQ1IsSUFBSSxZQUFZLEtBQUssSUFBSSxFQUFFOztzQkFDbkIsUUFBUSxHQUFHLGVBQWUsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDO2dCQUM1QyxZQUFZLEdBQUcsaUJBQWlCLEVBQUUsQ0FBQyxjQUFjLENBQzdDLGNBQWMsRUFBRSxTQUFTLFFBQVEsQ0FBQyxJQUFJLFVBQVUsa0NBQzVDLFFBQVEsS0FBRSxRQUFRLEVBQUUsaUJBQWlCLEVBQUUsTUFBTSxFQUFFLElBQUksSUFBRSxDQUFDO2FBQy9EO1lBQ0QsT0FBTyxZQUFZLENBQUM7UUFDdEIsQ0FBQyxDQUFBOztRQUVELFlBQVksRUFBRSxDQUFDLENBQUMsU0FBUztLQUMxQixDQUFDLENBQUM7SUFFSCxNQUFNLENBQUMsY0FBYyxDQUFDLElBQUksRUFBRSxXQUFXLEVBQUU7UUFDdkMsR0FBRzs7O1FBQUUsR0FBRyxFQUFFO1lBQ1IsSUFBSSxTQUFTLEtBQUssSUFBSSxFQUFFOztzQkFDaEIsUUFBUSxHQUFHLGVBQWUsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDO2dCQUM1QyxTQUFTLEdBQUcsaUJBQWlCLEVBQUUsQ0FBQyxXQUFXLENBQ3ZDLGNBQWMsRUFBRSxTQUFTLFFBQVEsQ0FBQyxJQUFJLFdBQVcsRUFBRSxRQUFRLENBQUMsQ0FBQzthQUNsRTtZQUNELE9BQU8sU0FBUyxDQUFDO1FBQ25CLENBQUMsQ0FBQTs7UUFFRCxZQUFZLEVBQUUsQ0FBQyxDQUFDLFNBQVM7S0FDMUIsQ0FBQyxDQUFDO0FBQ0wsQ0FBQzs7Ozs7O0FBRUQsU0FBUyxlQUFlLENBQUMsSUFBZSxFQUFFLElBQVU7SUFDbEQsT0FBTztRQUNMLElBQUksRUFBRSxJQUFJO1FBQ1YsaUJBQWlCLEVBQUUsQ0FBQztRQUNwQixJQUFJLEVBQUUsSUFBSSxDQUFDLElBQUk7UUFDZixJQUFJLEVBQUUsbUJBQW1CLENBQUMsSUFBSSxDQUFDO1FBQy9CLFFBQVEsRUFBRSxJQUFJLENBQUMsSUFBSTtRQUNuQixJQUFJLEVBQUUsSUFBSSxDQUFDLElBQUksS0FBSyxTQUFTLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUk7S0FDakQsQ0FBQztBQUNKLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7UjNQaXBlTWV0YWRhdGFGYWNhZGUsIGdldENvbXBpbGVyRmFjYWRlfSBmcm9tICcuLi8uLi9jb21waWxlci9jb21waWxlcl9mYWNhZGUnO1xuaW1wb3J0IHtyZWZsZWN0RGVwZW5kZW5jaWVzfSBmcm9tICcuLi8uLi9kaS9qaXQvdXRpbCc7XG5pbXBvcnQge1R5cGV9IGZyb20gJy4uLy4uL2ludGVyZmFjZS90eXBlJztcbmltcG9ydCB7UGlwZX0gZnJvbSAnLi4vLi4vbWV0YWRhdGEvZGlyZWN0aXZlcyc7XG5pbXBvcnQge05HX0ZBQ1RPUllfREVGLCBOR19QSVBFX0RFRn0gZnJvbSAnLi4vZmllbGRzJztcblxuaW1wb3J0IHthbmd1bGFyQ29yZUVudn0gZnJvbSAnLi9lbnZpcm9ubWVudCc7XG5cbmV4cG9ydCBmdW5jdGlvbiBjb21waWxlUGlwZSh0eXBlOiBUeXBlPGFueT4sIG1ldGE6IFBpcGUpOiB2b2lkIHtcbiAgbGV0IG5nUGlwZURlZjogYW55ID0gbnVsbDtcbiAgbGV0IG5nRmFjdG9yeURlZjogYW55ID0gbnVsbDtcblxuICBPYmplY3QuZGVmaW5lUHJvcGVydHkodHlwZSwgTkdfRkFDVE9SWV9ERUYsIHtcbiAgICBnZXQ6ICgpID0+IHtcbiAgICAgIGlmIChuZ0ZhY3RvcnlEZWYgPT09IG51bGwpIHtcbiAgICAgICAgY29uc3QgbWV0YWRhdGEgPSBnZXRQaXBlTWV0YWRhdGEodHlwZSwgbWV0YSk7XG4gICAgICAgIG5nRmFjdG9yeURlZiA9IGdldENvbXBpbGVyRmFjYWRlKCkuY29tcGlsZUZhY3RvcnkoXG4gICAgICAgICAgICBhbmd1bGFyQ29yZUVudiwgYG5nOi8vLyR7bWV0YWRhdGEubmFtZX0vybVmYWMuanNgLFxuICAgICAgICAgICAgey4uLm1ldGFkYXRhLCBpbmplY3RGbjogJ2RpcmVjdGl2ZUluamVjdCcsIGlzUGlwZTogdHJ1ZX0pO1xuICAgICAgfVxuICAgICAgcmV0dXJuIG5nRmFjdG9yeURlZjtcbiAgICB9LFxuICAgIC8vIE1ha2UgdGhlIHByb3BlcnR5IGNvbmZpZ3VyYWJsZSBpbiBkZXYgbW9kZSB0byBhbGxvdyBvdmVycmlkaW5nIGluIHRlc3RzXG4gICAgY29uZmlndXJhYmxlOiAhIW5nRGV2TW9kZSxcbiAgfSk7XG5cbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHR5cGUsIE5HX1BJUEVfREVGLCB7XG4gICAgZ2V0OiAoKSA9PiB7XG4gICAgICBpZiAobmdQaXBlRGVmID09PSBudWxsKSB7XG4gICAgICAgIGNvbnN0IG1ldGFkYXRhID0gZ2V0UGlwZU1ldGFkYXRhKHR5cGUsIG1ldGEpO1xuICAgICAgICBuZ1BpcGVEZWYgPSBnZXRDb21waWxlckZhY2FkZSgpLmNvbXBpbGVQaXBlKFxuICAgICAgICAgICAgYW5ndWxhckNvcmVFbnYsIGBuZzovLy8ke21ldGFkYXRhLm5hbWV9L8m1cGlwZS5qc2AsIG1ldGFkYXRhKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBuZ1BpcGVEZWY7XG4gICAgfSxcbiAgICAvLyBNYWtlIHRoZSBwcm9wZXJ0eSBjb25maWd1cmFibGUgaW4gZGV2IG1vZGUgdG8gYWxsb3cgb3ZlcnJpZGluZyBpbiB0ZXN0c1xuICAgIGNvbmZpZ3VyYWJsZTogISFuZ0Rldk1vZGUsXG4gIH0pO1xufVxuXG5mdW5jdGlvbiBnZXRQaXBlTWV0YWRhdGEodHlwZTogVHlwZTxhbnk+LCBtZXRhOiBQaXBlKTogUjNQaXBlTWV0YWRhdGFGYWNhZGUge1xuICByZXR1cm4ge1xuICAgIHR5cGU6IHR5cGUsXG4gICAgdHlwZUFyZ3VtZW50Q291bnQ6IDAsXG4gICAgbmFtZTogdHlwZS5uYW1lLFxuICAgIGRlcHM6IHJlZmxlY3REZXBlbmRlbmNpZXModHlwZSksXG4gICAgcGlwZU5hbWU6IG1ldGEubmFtZSxcbiAgICBwdXJlOiBtZXRhLnB1cmUgIT09IHVuZGVmaW5lZCA/IG1ldGEucHVyZSA6IHRydWVcbiAgfTtcbn1cbiJdfQ==