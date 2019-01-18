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
export function compilePipe(type, meta) {
    var ngPipeDef = null;
    Object.defineProperty(type, NG_PIPE_DEF, {
        get: function () {
            if (ngPipeDef === null) {
                ngPipeDef = getCompilerFacade().compilePipe(angularCoreEnv, "ng://" + renderStringify(type) + "/ngPipeDef.js", {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGlwZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvaml0L3BpcGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLGlCQUFpQixFQUFDLE1BQU0sZ0NBQWdDLENBQUM7QUFDakUsT0FBTyxFQUFDLG1CQUFtQixFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFHdEQsT0FBTyxFQUFDLFdBQVcsRUFBQyxNQUFNLFdBQVcsQ0FBQztBQUN0QyxPQUFPLEVBQUMsZUFBZSxFQUFDLE1BQU0sU0FBUyxDQUFDO0FBRXhDLE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFFN0MsTUFBTSxVQUFVLFdBQVcsQ0FBQyxJQUFlLEVBQUUsSUFBVTtJQUNyRCxJQUFJLFNBQVMsR0FBUSxJQUFJLENBQUM7SUFDMUIsTUFBTSxDQUFDLGNBQWMsQ0FBQyxJQUFJLEVBQUUsV0FBVyxFQUFFO1FBQ3ZDLEdBQUcsRUFBRTtZQUNILElBQUksU0FBUyxLQUFLLElBQUksRUFBRTtnQkFDdEIsU0FBUyxHQUFHLGlCQUFpQixFQUFFLENBQUMsV0FBVyxDQUN2QyxjQUFjLEVBQUUsVUFBUSxlQUFlLENBQUMsSUFBSSxDQUFDLGtCQUFlLEVBQUU7b0JBQzVELElBQUksRUFBRSxJQUFJO29CQUNWLElBQUksRUFBRSxJQUFJLENBQUMsSUFBSTtvQkFDZixJQUFJLEVBQUUsbUJBQW1CLENBQUMsSUFBSSxDQUFDO29CQUMvQixRQUFRLEVBQUUsSUFBSSxDQUFDLElBQUk7b0JBQ25CLElBQUksRUFBRSxJQUFJLENBQUMsSUFBSSxLQUFLLFNBQVMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSTtpQkFDakQsQ0FBQyxDQUFDO2FBQ1I7WUFDRCxPQUFPLFNBQVMsQ0FBQztRQUNuQixDQUFDO1FBQ0QsMEVBQTBFO1FBQzFFLFlBQVksRUFBRSxDQUFDLENBQUMsU0FBUztLQUMxQixDQUFDLENBQUM7QUFDTCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge2dldENvbXBpbGVyRmFjYWRlfSBmcm9tICcuLi8uLi9jb21waWxlci9jb21waWxlcl9mYWNhZGUnO1xuaW1wb3J0IHtyZWZsZWN0RGVwZW5kZW5jaWVzfSBmcm9tICcuLi8uLi9kaS9qaXQvdXRpbCc7XG5pbXBvcnQge1R5cGV9IGZyb20gJy4uLy4uL2ludGVyZmFjZS90eXBlJztcbmltcG9ydCB7UGlwZX0gZnJvbSAnLi4vLi4vbWV0YWRhdGEvZGlyZWN0aXZlcyc7XG5pbXBvcnQge05HX1BJUEVfREVGfSBmcm9tICcuLi9maWVsZHMnO1xuaW1wb3J0IHtyZW5kZXJTdHJpbmdpZnl9IGZyb20gJy4uL3V0aWwnO1xuXG5pbXBvcnQge2FuZ3VsYXJDb3JlRW52fSBmcm9tICcuL2Vudmlyb25tZW50JztcblxuZXhwb3J0IGZ1bmN0aW9uIGNvbXBpbGVQaXBlKHR5cGU6IFR5cGU8YW55PiwgbWV0YTogUGlwZSk6IHZvaWQge1xuICBsZXQgbmdQaXBlRGVmOiBhbnkgPSBudWxsO1xuICBPYmplY3QuZGVmaW5lUHJvcGVydHkodHlwZSwgTkdfUElQRV9ERUYsIHtcbiAgICBnZXQ6ICgpID0+IHtcbiAgICAgIGlmIChuZ1BpcGVEZWYgPT09IG51bGwpIHtcbiAgICAgICAgbmdQaXBlRGVmID0gZ2V0Q29tcGlsZXJGYWNhZGUoKS5jb21waWxlUGlwZShcbiAgICAgICAgICAgIGFuZ3VsYXJDb3JlRW52LCBgbmc6Ly8ke3JlbmRlclN0cmluZ2lmeSh0eXBlKX0vbmdQaXBlRGVmLmpzYCwge1xuICAgICAgICAgICAgICB0eXBlOiB0eXBlLFxuICAgICAgICAgICAgICBuYW1lOiB0eXBlLm5hbWUsXG4gICAgICAgICAgICAgIGRlcHM6IHJlZmxlY3REZXBlbmRlbmNpZXModHlwZSksXG4gICAgICAgICAgICAgIHBpcGVOYW1lOiBtZXRhLm5hbWUsXG4gICAgICAgICAgICAgIHB1cmU6IG1ldGEucHVyZSAhPT0gdW5kZWZpbmVkID8gbWV0YS5wdXJlIDogdHJ1ZVxuICAgICAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gbmdQaXBlRGVmO1xuICAgIH0sXG4gICAgLy8gTWFrZSB0aGUgcHJvcGVydHkgY29uZmlndXJhYmxlIGluIGRldiBtb2RlIHRvIGFsbG93IG92ZXJyaWRpbmcgaW4gdGVzdHNcbiAgICBjb25maWd1cmFibGU6ICEhbmdEZXZNb2RlLFxuICB9KTtcbn1cbiJdfQ==