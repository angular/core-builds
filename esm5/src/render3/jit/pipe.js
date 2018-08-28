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
export function compilePipe(type, meta) {
    var ngPipeDef = null;
    Object.defineProperty(type, NG_PIPE_DEF, {
        get: function () {
            if (ngPipeDef === null) {
                var sourceMapUrl = "ng://" + stringify(type) + "/ngPipeDef.js";
                var name_1 = type.name;
                var res = compilePipeFromMetadata({
                    name: name_1,
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGlwZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvaml0L3BpcGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLGVBQWUsRUFBRSx1QkFBdUIsRUFBRSxhQUFhLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUkxRixPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sU0FBUyxDQUFDO0FBRWxDLE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFDN0MsT0FBTyxFQUFDLFdBQVcsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUNyQyxPQUFPLEVBQUMsbUJBQW1CLEVBQUMsTUFBTSxRQUFRLENBQUM7QUFFM0MsTUFBTSxVQUFVLFdBQVcsQ0FBQyxJQUFlLEVBQUUsSUFBVTtJQUNyRCxJQUFJLFNBQVMsR0FBUSxJQUFJLENBQUM7SUFDMUIsTUFBTSxDQUFDLGNBQWMsQ0FBQyxJQUFJLEVBQUUsV0FBVyxFQUFFO1FBQ3ZDLEdBQUcsRUFBRTtZQUNILElBQUksU0FBUyxLQUFLLElBQUksRUFBRTtnQkFDdEIsSUFBTSxZQUFZLEdBQUcsVUFBUSxTQUFTLENBQUMsSUFBSSxDQUFDLGtCQUFlLENBQUM7Z0JBRTVELElBQU0sTUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUM7Z0JBQ3ZCLElBQU0sR0FBRyxHQUFHLHVCQUF1QixDQUFDO29CQUNsQyxJQUFJLFFBQUE7b0JBQ0osSUFBSSxFQUFFLElBQUksZUFBZSxDQUFDLElBQUksQ0FBQztvQkFDL0IsSUFBSSxFQUFFLG1CQUFtQixDQUFDLElBQUksQ0FBQztvQkFDL0IsUUFBUSxFQUFFLElBQUksQ0FBQyxJQUFJO29CQUNuQixJQUFJLEVBQUUsSUFBSSxDQUFDLElBQUksS0FBSyxTQUFTLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUk7aUJBQ2pELENBQUMsQ0FBQztnQkFFSCxTQUFTLEdBQUcsYUFBYSxDQUFDLEdBQUcsQ0FBQyxVQUFVLEVBQUUsY0FBYyxFQUFFLFlBQVksRUFBRSxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUM7YUFDekY7WUFDRCxPQUFPLFNBQVMsQ0FBQztRQUNuQixDQUFDO1FBQ0QsMEVBQTBFO1FBQzFFLFlBQVksRUFBRSxDQUFDLENBQUMsU0FBUztLQUMxQixDQUFDLENBQUM7QUFDTCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1dyYXBwZWROb2RlRXhwciwgY29tcGlsZVBpcGVGcm9tTWV0YWRhdGEsIGppdEV4cHJlc3Npb259IGZyb20gJ0Bhbmd1bGFyL2NvbXBpbGVyJztcblxuaW1wb3J0IHtQaXBlfSBmcm9tICcuLi8uLi9tZXRhZGF0YS9kaXJlY3RpdmVzJztcbmltcG9ydCB7VHlwZX0gZnJvbSAnLi4vLi4vdHlwZSc7XG5pbXBvcnQge3N0cmluZ2lmeX0gZnJvbSAnLi4vdXRpbCc7XG5cbmltcG9ydCB7YW5ndWxhckNvcmVFbnZ9IGZyb20gJy4vZW52aXJvbm1lbnQnO1xuaW1wb3J0IHtOR19QSVBFX0RFRn0gZnJvbSAnLi9maWVsZHMnO1xuaW1wb3J0IHtyZWZsZWN0RGVwZW5kZW5jaWVzfSBmcm9tICcuL3V0aWwnO1xuXG5leHBvcnQgZnVuY3Rpb24gY29tcGlsZVBpcGUodHlwZTogVHlwZTxhbnk+LCBtZXRhOiBQaXBlKTogdm9pZCB7XG4gIGxldCBuZ1BpcGVEZWY6IGFueSA9IG51bGw7XG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0eXBlLCBOR19QSVBFX0RFRiwge1xuICAgIGdldDogKCkgPT4ge1xuICAgICAgaWYgKG5nUGlwZURlZiA9PT0gbnVsbCkge1xuICAgICAgICBjb25zdCBzb3VyY2VNYXBVcmwgPSBgbmc6Ly8ke3N0cmluZ2lmeSh0eXBlKX0vbmdQaXBlRGVmLmpzYDtcblxuICAgICAgICBjb25zdCBuYW1lID0gdHlwZS5uYW1lO1xuICAgICAgICBjb25zdCByZXMgPSBjb21waWxlUGlwZUZyb21NZXRhZGF0YSh7XG4gICAgICAgICAgbmFtZSxcbiAgICAgICAgICB0eXBlOiBuZXcgV3JhcHBlZE5vZGVFeHByKHR5cGUpLFxuICAgICAgICAgIGRlcHM6IHJlZmxlY3REZXBlbmRlbmNpZXModHlwZSksXG4gICAgICAgICAgcGlwZU5hbWU6IG1ldGEubmFtZSxcbiAgICAgICAgICBwdXJlOiBtZXRhLnB1cmUgIT09IHVuZGVmaW5lZCA/IG1ldGEucHVyZSA6IHRydWUsXG4gICAgICAgIH0pO1xuXG4gICAgICAgIG5nUGlwZURlZiA9IGppdEV4cHJlc3Npb24ocmVzLmV4cHJlc3Npb24sIGFuZ3VsYXJDb3JlRW52LCBzb3VyY2VNYXBVcmwsIHJlcy5zdGF0ZW1lbnRzKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBuZ1BpcGVEZWY7XG4gICAgfSxcbiAgICAvLyBNYWtlIHRoZSBwcm9wZXJ0eSBjb25maWd1cmFibGUgaW4gZGV2IG1vZGUgdG8gYWxsb3cgb3ZlcnJpZGluZyBpbiB0ZXN0c1xuICAgIGNvbmZpZ3VyYWJsZTogISFuZ0Rldk1vZGUsXG4gIH0pO1xufVxuIl19