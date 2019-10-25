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
                /** @type {?} */
                const compiler = getCompilerFacade();
                ngFactoryDef = compiler.compileFactory(angularCoreEnv, `ng:///${metadata.name}/ɵfac.js`, Object.assign(Object.assign({}, metadata), { injectFn: 'directiveInject', target: compiler.R3FactoryTarget.Pipe }));
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGlwZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvaml0L3BpcGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFRQSxPQUFPLEVBQXVCLGlCQUFpQixFQUFDLE1BQU0sZ0NBQWdDLENBQUM7QUFDdkYsT0FBTyxFQUFDLG1CQUFtQixFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFHdEQsT0FBTyxFQUFDLGNBQWMsRUFBRSxXQUFXLEVBQUMsTUFBTSxXQUFXLENBQUM7QUFFdEQsT0FBTyxFQUFDLGNBQWMsRUFBQyxNQUFNLGVBQWUsQ0FBQzs7Ozs7O0FBRTdDLE1BQU0sVUFBVSxXQUFXLENBQUMsSUFBZSxFQUFFLElBQVU7O1FBQ2pELFNBQVMsR0FBUSxJQUFJOztRQUNyQixZQUFZLEdBQVEsSUFBSTtJQUU1QixNQUFNLENBQUMsY0FBYyxDQUFDLElBQUksRUFBRSxjQUFjLEVBQUU7UUFDMUMsR0FBRzs7O1FBQUUsR0FBRyxFQUFFO1lBQ1IsSUFBSSxZQUFZLEtBQUssSUFBSSxFQUFFOztzQkFDbkIsUUFBUSxHQUFHLGVBQWUsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDOztzQkFDdEMsUUFBUSxHQUFHLGlCQUFpQixFQUFFO2dCQUNwQyxZQUFZLEdBQUcsUUFBUSxDQUFDLGNBQWMsQ0FDbEMsY0FBYyxFQUFFLFNBQVMsUUFBUSxDQUFDLElBQUksVUFBVSxrQ0FDNUMsUUFBUSxLQUFFLFFBQVEsRUFBRSxpQkFBaUIsRUFBRSxNQUFNLEVBQUUsUUFBUSxDQUFDLGVBQWUsQ0FBQyxJQUFJLElBQUUsQ0FBQzthQUN4RjtZQUNELE9BQU8sWUFBWSxDQUFDO1FBQ3RCLENBQUMsQ0FBQTs7UUFFRCxZQUFZLEVBQUUsQ0FBQyxDQUFDLFNBQVM7S0FDMUIsQ0FBQyxDQUFDO0lBRUgsTUFBTSxDQUFDLGNBQWMsQ0FBQyxJQUFJLEVBQUUsV0FBVyxFQUFFO1FBQ3ZDLEdBQUc7OztRQUFFLEdBQUcsRUFBRTtZQUNSLElBQUksU0FBUyxLQUFLLElBQUksRUFBRTs7c0JBQ2hCLFFBQVEsR0FBRyxlQUFlLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQztnQkFDNUMsU0FBUyxHQUFHLGlCQUFpQixFQUFFLENBQUMsV0FBVyxDQUN2QyxjQUFjLEVBQUUsU0FBUyxRQUFRLENBQUMsSUFBSSxXQUFXLEVBQUUsUUFBUSxDQUFDLENBQUM7YUFDbEU7WUFDRCxPQUFPLFNBQVMsQ0FBQztRQUNuQixDQUFDLENBQUE7O1FBRUQsWUFBWSxFQUFFLENBQUMsQ0FBQyxTQUFTO0tBQzFCLENBQUMsQ0FBQztBQUNMLENBQUM7Ozs7OztBQUVELFNBQVMsZUFBZSxDQUFDLElBQWUsRUFBRSxJQUFVO0lBQ2xELE9BQU87UUFDTCxJQUFJLEVBQUUsSUFBSTtRQUNWLGlCQUFpQixFQUFFLENBQUM7UUFDcEIsSUFBSSxFQUFFLElBQUksQ0FBQyxJQUFJO1FBQ2YsSUFBSSxFQUFFLG1CQUFtQixDQUFDLElBQUksQ0FBQztRQUMvQixRQUFRLEVBQUUsSUFBSSxDQUFDLElBQUk7UUFDbkIsSUFBSSxFQUFFLElBQUksQ0FBQyxJQUFJLEtBQUssU0FBUyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJO0tBQ2pELENBQUM7QUFDSixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1IzUGlwZU1ldGFkYXRhRmFjYWRlLCBnZXRDb21waWxlckZhY2FkZX0gZnJvbSAnLi4vLi4vY29tcGlsZXIvY29tcGlsZXJfZmFjYWRlJztcbmltcG9ydCB7cmVmbGVjdERlcGVuZGVuY2llc30gZnJvbSAnLi4vLi4vZGkvaml0L3V0aWwnO1xuaW1wb3J0IHtUeXBlfSBmcm9tICcuLi8uLi9pbnRlcmZhY2UvdHlwZSc7XG5pbXBvcnQge1BpcGV9IGZyb20gJy4uLy4uL21ldGFkYXRhL2RpcmVjdGl2ZXMnO1xuaW1wb3J0IHtOR19GQUNUT1JZX0RFRiwgTkdfUElQRV9ERUZ9IGZyb20gJy4uL2ZpZWxkcyc7XG5cbmltcG9ydCB7YW5ndWxhckNvcmVFbnZ9IGZyb20gJy4vZW52aXJvbm1lbnQnO1xuXG5leHBvcnQgZnVuY3Rpb24gY29tcGlsZVBpcGUodHlwZTogVHlwZTxhbnk+LCBtZXRhOiBQaXBlKTogdm9pZCB7XG4gIGxldCBuZ1BpcGVEZWY6IGFueSA9IG51bGw7XG4gIGxldCBuZ0ZhY3RvcnlEZWY6IGFueSA9IG51bGw7XG5cbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHR5cGUsIE5HX0ZBQ1RPUllfREVGLCB7XG4gICAgZ2V0OiAoKSA9PiB7XG4gICAgICBpZiAobmdGYWN0b3J5RGVmID09PSBudWxsKSB7XG4gICAgICAgIGNvbnN0IG1ldGFkYXRhID0gZ2V0UGlwZU1ldGFkYXRhKHR5cGUsIG1ldGEpO1xuICAgICAgICBjb25zdCBjb21waWxlciA9IGdldENvbXBpbGVyRmFjYWRlKCk7XG4gICAgICAgIG5nRmFjdG9yeURlZiA9IGNvbXBpbGVyLmNvbXBpbGVGYWN0b3J5KFxuICAgICAgICAgICAgYW5ndWxhckNvcmVFbnYsIGBuZzovLy8ke21ldGFkYXRhLm5hbWV9L8m1ZmFjLmpzYCxcbiAgICAgICAgICAgIHsuLi5tZXRhZGF0YSwgaW5qZWN0Rm46ICdkaXJlY3RpdmVJbmplY3QnLCB0YXJnZXQ6IGNvbXBpbGVyLlIzRmFjdG9yeVRhcmdldC5QaXBlfSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gbmdGYWN0b3J5RGVmO1xuICAgIH0sXG4gICAgLy8gTWFrZSB0aGUgcHJvcGVydHkgY29uZmlndXJhYmxlIGluIGRldiBtb2RlIHRvIGFsbG93IG92ZXJyaWRpbmcgaW4gdGVzdHNcbiAgICBjb25maWd1cmFibGU6ICEhbmdEZXZNb2RlLFxuICB9KTtcblxuICBPYmplY3QuZGVmaW5lUHJvcGVydHkodHlwZSwgTkdfUElQRV9ERUYsIHtcbiAgICBnZXQ6ICgpID0+IHtcbiAgICAgIGlmIChuZ1BpcGVEZWYgPT09IG51bGwpIHtcbiAgICAgICAgY29uc3QgbWV0YWRhdGEgPSBnZXRQaXBlTWV0YWRhdGEodHlwZSwgbWV0YSk7XG4gICAgICAgIG5nUGlwZURlZiA9IGdldENvbXBpbGVyRmFjYWRlKCkuY29tcGlsZVBpcGUoXG4gICAgICAgICAgICBhbmd1bGFyQ29yZUVudiwgYG5nOi8vLyR7bWV0YWRhdGEubmFtZX0vybVwaXBlLmpzYCwgbWV0YWRhdGEpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIG5nUGlwZURlZjtcbiAgICB9LFxuICAgIC8vIE1ha2UgdGhlIHByb3BlcnR5IGNvbmZpZ3VyYWJsZSBpbiBkZXYgbW9kZSB0byBhbGxvdyBvdmVycmlkaW5nIGluIHRlc3RzXG4gICAgY29uZmlndXJhYmxlOiAhIW5nRGV2TW9kZSxcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIGdldFBpcGVNZXRhZGF0YSh0eXBlOiBUeXBlPGFueT4sIG1ldGE6IFBpcGUpOiBSM1BpcGVNZXRhZGF0YUZhY2FkZSB7XG4gIHJldHVybiB7XG4gICAgdHlwZTogdHlwZSxcbiAgICB0eXBlQXJndW1lbnRDb3VudDogMCxcbiAgICBuYW1lOiB0eXBlLm5hbWUsXG4gICAgZGVwczogcmVmbGVjdERlcGVuZGVuY2llcyh0eXBlKSxcbiAgICBwaXBlTmFtZTogbWV0YS5uYW1lLFxuICAgIHB1cmU6IG1ldGEucHVyZSAhPT0gdW5kZWZpbmVkID8gbWV0YS5wdXJlIDogdHJ1ZVxuICB9O1xufVxuIl19