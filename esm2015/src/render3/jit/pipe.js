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
    let def = null;
    Object.defineProperty(type, NG_PIPE_DEF, {
        get: () => {
            if (def === null) {
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
                def = jitExpression(res.expression, angularCoreEnv, sourceMapUrl, res.statements);
            }
            return def;
        }
    });
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGlwZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvaml0L3BpcGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFRQSxPQUFPLEVBQUMsZUFBZSxFQUFFLHVCQUF1QixFQUFFLGFBQWEsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBSTFGLE9BQU8sRUFBQyxTQUFTLEVBQUMsTUFBTSxTQUFTLENBQUM7QUFFbEMsT0FBTyxFQUFDLGNBQWMsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUM3QyxPQUFPLEVBQUMsV0FBVyxFQUFDLE1BQU0sVUFBVSxDQUFDO0FBQ3JDLE9BQU8sRUFBQyxtQkFBbUIsRUFBQyxNQUFNLFFBQVEsQ0FBQzs7Ozs7O0FBRTNDLE1BQU0sc0JBQXNCLElBQWUsRUFBRSxJQUFVOztJQUNyRCxJQUFJLEdBQUcsR0FBUSxJQUFJLENBQUM7SUFDcEIsTUFBTSxDQUFDLGNBQWMsQ0FBQyxJQUFJLEVBQUUsV0FBVyxFQUFFO1FBQ3ZDLEdBQUcsRUFBRSxHQUFHLEVBQUU7WUFDUixJQUFJLEdBQUcsS0FBSyxJQUFJLEVBQUU7O2dCQUNoQixNQUFNLFlBQVksR0FBRyxRQUFRLFNBQVMsQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDOztnQkFFNUQsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQzs7Z0JBQ3ZCLE1BQU0sR0FBRyxHQUFHLHVCQUF1QixDQUFDO29CQUNsQyxJQUFJO29CQUNKLElBQUksRUFBRSxJQUFJLGVBQWUsQ0FBQyxJQUFJLENBQUM7b0JBQy9CLElBQUksRUFBRSxtQkFBbUIsQ0FBQyxJQUFJLENBQUM7b0JBQy9CLFFBQVEsRUFBRSxJQUFJLENBQUMsSUFBSTtvQkFDbkIsSUFBSSxFQUFFLElBQUksQ0FBQyxJQUFJLEtBQUssU0FBUyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJO2lCQUNqRCxDQUFDLENBQUM7Z0JBRUgsR0FBRyxHQUFHLGFBQWEsQ0FBQyxHQUFHLENBQUMsVUFBVSxFQUFFLGNBQWMsRUFBRSxZQUFZLEVBQUUsR0FBRyxDQUFDLFVBQVUsQ0FBQyxDQUFDO2FBQ25GO1lBQ0QsT0FBTyxHQUFHLENBQUM7U0FDWjtLQUNGLENBQUMsQ0FBQztDQUNKIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1dyYXBwZWROb2RlRXhwciwgY29tcGlsZVBpcGVGcm9tTWV0YWRhdGEsIGppdEV4cHJlc3Npb259IGZyb20gJ0Bhbmd1bGFyL2NvbXBpbGVyJztcblxuaW1wb3J0IHtQaXBlfSBmcm9tICcuLi8uLi9tZXRhZGF0YS9kaXJlY3RpdmVzJztcbmltcG9ydCB7VHlwZX0gZnJvbSAnLi4vLi4vdHlwZSc7XG5pbXBvcnQge3N0cmluZ2lmeX0gZnJvbSAnLi4vdXRpbCc7XG5cbmltcG9ydCB7YW5ndWxhckNvcmVFbnZ9IGZyb20gJy4vZW52aXJvbm1lbnQnO1xuaW1wb3J0IHtOR19QSVBFX0RFRn0gZnJvbSAnLi9maWVsZHMnO1xuaW1wb3J0IHtyZWZsZWN0RGVwZW5kZW5jaWVzfSBmcm9tICcuL3V0aWwnO1xuXG5leHBvcnQgZnVuY3Rpb24gY29tcGlsZVBpcGUodHlwZTogVHlwZTxhbnk+LCBtZXRhOiBQaXBlKTogdm9pZCB7XG4gIGxldCBkZWY6IGFueSA9IG51bGw7XG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0eXBlLCBOR19QSVBFX0RFRiwge1xuICAgIGdldDogKCkgPT4ge1xuICAgICAgaWYgKGRlZiA9PT0gbnVsbCkge1xuICAgICAgICBjb25zdCBzb3VyY2VNYXBVcmwgPSBgbmc6Ly8ke3N0cmluZ2lmeSh0eXBlKX0vbmdQaXBlRGVmLmpzYDtcblxuICAgICAgICBjb25zdCBuYW1lID0gdHlwZS5uYW1lO1xuICAgICAgICBjb25zdCByZXMgPSBjb21waWxlUGlwZUZyb21NZXRhZGF0YSh7XG4gICAgICAgICAgbmFtZSxcbiAgICAgICAgICB0eXBlOiBuZXcgV3JhcHBlZE5vZGVFeHByKHR5cGUpLFxuICAgICAgICAgIGRlcHM6IHJlZmxlY3REZXBlbmRlbmNpZXModHlwZSksXG4gICAgICAgICAgcGlwZU5hbWU6IG1ldGEubmFtZSxcbiAgICAgICAgICBwdXJlOiBtZXRhLnB1cmUgIT09IHVuZGVmaW5lZCA/IG1ldGEucHVyZSA6IHRydWUsXG4gICAgICAgIH0pO1xuXG4gICAgICAgIGRlZiA9IGppdEV4cHJlc3Npb24ocmVzLmV4cHJlc3Npb24sIGFuZ3VsYXJDb3JlRW52LCBzb3VyY2VNYXBVcmwsIHJlcy5zdGF0ZW1lbnRzKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBkZWY7XG4gICAgfVxuICB9KTtcbn1cbiJdfQ==