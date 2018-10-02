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
import { LiteralExpr, R3ResolvedDependencyType, WrappedNodeExpr } from '@angular/compiler';
import { Injector } from '../../di/injector';
import { Host, Inject, Optional, Self, SkipSelf } from '../../di/metadata';
import { Attribute } from '../../metadata/di';
import { ReflectionCapabilities } from '../../reflection/reflection_capabilities';
/** @type {?} */
let _reflect = null;
/**
 * @return {?}
 */
export function getReflect() {
    return (_reflect = _reflect || new ReflectionCapabilities());
}
/**
 * @param {?} type
 * @return {?}
 */
export function reflectDependencies(type) {
    return convertDependencies(getReflect().parameters(type));
}
/**
 * @param {?} deps
 * @return {?}
 */
export function convertDependencies(deps) {
    return deps.map(dep => reflectDependency(dep));
}
/**
 * @param {?} dep
 * @return {?}
 */
function reflectDependency(dep) {
    /** @type {?} */
    const meta = {
        token: new LiteralExpr(null),
        host: false,
        optional: false,
        resolved: R3ResolvedDependencyType.Token,
        self: false,
        skipSelf: false,
    };
    /**
     * @param {?} token
     * @return {?}
     */
    function setTokenAndResolvedType(token) {
        if (token === Injector) {
            meta.resolved = R3ResolvedDependencyType.Injector;
        }
        else {
            meta.resolved = R3ResolvedDependencyType.Token;
        }
        meta.token = new WrappedNodeExpr(token);
    }
    if (Array.isArray(dep)) {
        if (dep.length === 0) {
            throw new Error('Dependency array must have arguments.');
        }
        for (let j = 0; j < dep.length; j++) {
            /** @type {?} */
            const param = dep[j];
            if (param instanceof Optional || param.__proto__.ngMetadataName === 'Optional') {
                meta.optional = true;
            }
            else if (param instanceof SkipSelf || param.__proto__.ngMetadataName === 'SkipSelf') {
                meta.skipSelf = true;
            }
            else if (param instanceof Self || param.__proto__.ngMetadataName === 'Self') {
                meta.self = true;
            }
            else if (param instanceof Host || param.__proto__.ngMetadataName === 'Host') {
                meta.host = true;
            }
            else if (param instanceof Inject) {
                meta.token = new WrappedNodeExpr(param.token);
            }
            else if (param instanceof Attribute) {
                if (param.attributeName === undefined) {
                    throw new Error(`Attribute name must be defined.`);
                }
                meta.token = new LiteralExpr(param.attributeName);
                meta.resolved = R3ResolvedDependencyType.Attribute;
            }
            else {
                setTokenAndResolvedType(param);
            }
        }
    }
    else {
        setTokenAndResolvedType(dep);
    }
    return meta;
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvaml0L3V0aWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFRQSxPQUFPLEVBQUMsV0FBVyxFQUF3Qix3QkFBd0IsRUFBRSxlQUFlLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUUvRyxPQUFPLEVBQUMsUUFBUSxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDM0MsT0FBTyxFQUFDLElBQUksRUFBRSxNQUFNLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUl6RSxPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDNUMsT0FBTyxFQUFDLHNCQUFzQixFQUFDLE1BQU0sMENBQTBDLENBQUM7O0FBR2hGLElBQUksUUFBUSxHQUFnQyxJQUFJLENBQUM7Ozs7QUFFakQsTUFBTSxVQUFVLFVBQVU7SUFDeEIsT0FBTyxDQUFDLFFBQVEsR0FBRyxRQUFRLElBQUksSUFBSSxzQkFBc0IsRUFBRSxDQUFDLENBQUM7Q0FDOUQ7Ozs7O0FBRUQsTUFBTSxVQUFVLG1CQUFtQixDQUFDLElBQWU7SUFDakQsT0FBTyxtQkFBbUIsQ0FBQyxVQUFVLEVBQUUsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztDQUMzRDs7Ozs7QUFFRCxNQUFNLFVBQVUsbUJBQW1CLENBQUMsSUFBVztJQUM3QyxPQUFPLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxpQkFBaUIsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO0NBQ2hEOzs7OztBQUVELFNBQVMsaUJBQWlCLENBQUMsR0FBZ0I7O0lBQ3pDLE1BQU0sSUFBSSxHQUF5QjtRQUNqQyxLQUFLLEVBQUUsSUFBSSxXQUFXLENBQUMsSUFBSSxDQUFDO1FBQzVCLElBQUksRUFBRSxLQUFLO1FBQ1gsUUFBUSxFQUFFLEtBQUs7UUFDZixRQUFRLEVBQUUsd0JBQXdCLENBQUMsS0FBSztRQUN4QyxJQUFJLEVBQUUsS0FBSztRQUNYLFFBQVEsRUFBRSxLQUFLO0tBQ2hCLENBQUM7Ozs7O0lBRUYsU0FBUyx1QkFBdUIsQ0FBQyxLQUFVO1FBQ3pDLElBQUksS0FBSyxLQUFLLFFBQVEsRUFBRTtZQUN0QixJQUFJLENBQUMsUUFBUSxHQUFHLHdCQUF3QixDQUFDLFFBQVEsQ0FBQztTQUNuRDthQUFNO1lBQ0wsSUFBSSxDQUFDLFFBQVEsR0FBRyx3QkFBd0IsQ0FBQyxLQUFLLENBQUM7U0FDaEQ7UUFDRCxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksZUFBZSxDQUFDLEtBQUssQ0FBQyxDQUFDO0tBQ3pDO0lBRUQsSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFO1FBQ3RCLElBQUksR0FBRyxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUU7WUFDcEIsTUFBTSxJQUFJLEtBQUssQ0FBQyx1Q0FBdUMsQ0FBQyxDQUFDO1NBQzFEO1FBQ0QsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7O1lBQ25DLE1BQU0sS0FBSyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNyQixJQUFJLEtBQUssWUFBWSxRQUFRLElBQUksS0FBSyxDQUFDLFNBQVMsQ0FBQyxjQUFjLEtBQUssVUFBVSxFQUFFO2dCQUM5RSxJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQzthQUN0QjtpQkFBTSxJQUFJLEtBQUssWUFBWSxRQUFRLElBQUksS0FBSyxDQUFDLFNBQVMsQ0FBQyxjQUFjLEtBQUssVUFBVSxFQUFFO2dCQUNyRixJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQzthQUN0QjtpQkFBTSxJQUFJLEtBQUssWUFBWSxJQUFJLElBQUksS0FBSyxDQUFDLFNBQVMsQ0FBQyxjQUFjLEtBQUssTUFBTSxFQUFFO2dCQUM3RSxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQzthQUNsQjtpQkFBTSxJQUFJLEtBQUssWUFBWSxJQUFJLElBQUksS0FBSyxDQUFDLFNBQVMsQ0FBQyxjQUFjLEtBQUssTUFBTSxFQUFFO2dCQUM3RSxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQzthQUNsQjtpQkFBTSxJQUFJLEtBQUssWUFBWSxNQUFNLEVBQUU7Z0JBQ2xDLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxlQUFlLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO2FBQy9DO2lCQUFNLElBQUksS0FBSyxZQUFZLFNBQVMsRUFBRTtnQkFDckMsSUFBSSxLQUFLLENBQUMsYUFBYSxLQUFLLFNBQVMsRUFBRTtvQkFDckMsTUFBTSxJQUFJLEtBQUssQ0FBQyxpQ0FBaUMsQ0FBQyxDQUFDO2lCQUNwRDtnQkFDRCxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksV0FBVyxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsQ0FBQztnQkFDbEQsSUFBSSxDQUFDLFFBQVEsR0FBRyx3QkFBd0IsQ0FBQyxTQUFTLENBQUM7YUFDcEQ7aUJBQU07Z0JBQ0wsdUJBQXVCLENBQUMsS0FBSyxDQUFDLENBQUM7YUFDaEM7U0FDRjtLQUNGO1NBQU07UUFDTCx1QkFBdUIsQ0FBQyxHQUFHLENBQUMsQ0FBQztLQUM5QjtJQUNELE9BQU8sSUFBSSxDQUFDO0NBQ2IiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7TGl0ZXJhbEV4cHIsIFIzRGVwZW5kZW5jeU1ldGFkYXRhLCBSM1Jlc29sdmVkRGVwZW5kZW5jeVR5cGUsIFdyYXBwZWROb2RlRXhwcn0gZnJvbSAnQGFuZ3VsYXIvY29tcGlsZXInO1xuXG5pbXBvcnQge0luamVjdG9yfSBmcm9tICcuLi8uLi9kaS9pbmplY3Rvcic7XG5pbXBvcnQge0hvc3QsIEluamVjdCwgT3B0aW9uYWwsIFNlbGYsIFNraXBTZWxmfSBmcm9tICcuLi8uLi9kaS9tZXRhZGF0YSc7XG5pbXBvcnQge0VsZW1lbnRSZWZ9IGZyb20gJy4uLy4uL2xpbmtlci9lbGVtZW50X3JlZic7XG5pbXBvcnQge1RlbXBsYXRlUmVmfSBmcm9tICcuLi8uLi9saW5rZXIvdGVtcGxhdGVfcmVmJztcbmltcG9ydCB7Vmlld0NvbnRhaW5lclJlZn0gZnJvbSAnLi4vLi4vbGlua2VyL3ZpZXdfY29udGFpbmVyX3JlZic7XG5pbXBvcnQge0F0dHJpYnV0ZX0gZnJvbSAnLi4vLi4vbWV0YWRhdGEvZGknO1xuaW1wb3J0IHtSZWZsZWN0aW9uQ2FwYWJpbGl0aWVzfSBmcm9tICcuLi8uLi9yZWZsZWN0aW9uL3JlZmxlY3Rpb25fY2FwYWJpbGl0aWVzJztcbmltcG9ydCB7VHlwZX0gZnJvbSAnLi4vLi4vdHlwZSc7XG5cbmxldCBfcmVmbGVjdDogUmVmbGVjdGlvbkNhcGFiaWxpdGllc3xudWxsID0gbnVsbDtcblxuZXhwb3J0IGZ1bmN0aW9uIGdldFJlZmxlY3QoKTogUmVmbGVjdGlvbkNhcGFiaWxpdGllcyB7XG4gIHJldHVybiAoX3JlZmxlY3QgPSBfcmVmbGVjdCB8fCBuZXcgUmVmbGVjdGlvbkNhcGFiaWxpdGllcygpKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlZmxlY3REZXBlbmRlbmNpZXModHlwZTogVHlwZTxhbnk+KTogUjNEZXBlbmRlbmN5TWV0YWRhdGFbXSB7XG4gIHJldHVybiBjb252ZXJ0RGVwZW5kZW5jaWVzKGdldFJlZmxlY3QoKS5wYXJhbWV0ZXJzKHR5cGUpKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNvbnZlcnREZXBlbmRlbmNpZXMoZGVwczogYW55W10pOiBSM0RlcGVuZGVuY3lNZXRhZGF0YVtdIHtcbiAgcmV0dXJuIGRlcHMubWFwKGRlcCA9PiByZWZsZWN0RGVwZW5kZW5jeShkZXApKTtcbn1cblxuZnVuY3Rpb24gcmVmbGVjdERlcGVuZGVuY3koZGVwOiBhbnkgfCBhbnlbXSk6IFIzRGVwZW5kZW5jeU1ldGFkYXRhIHtcbiAgY29uc3QgbWV0YTogUjNEZXBlbmRlbmN5TWV0YWRhdGEgPSB7XG4gICAgdG9rZW46IG5ldyBMaXRlcmFsRXhwcihudWxsKSxcbiAgICBob3N0OiBmYWxzZSxcbiAgICBvcHRpb25hbDogZmFsc2UsXG4gICAgcmVzb2x2ZWQ6IFIzUmVzb2x2ZWREZXBlbmRlbmN5VHlwZS5Ub2tlbixcbiAgICBzZWxmOiBmYWxzZSxcbiAgICBza2lwU2VsZjogZmFsc2UsXG4gIH07XG5cbiAgZnVuY3Rpb24gc2V0VG9rZW5BbmRSZXNvbHZlZFR5cGUodG9rZW46IGFueSk6IHZvaWQge1xuICAgIGlmICh0b2tlbiA9PT0gSW5qZWN0b3IpIHtcbiAgICAgIG1ldGEucmVzb2x2ZWQgPSBSM1Jlc29sdmVkRGVwZW5kZW5jeVR5cGUuSW5qZWN0b3I7XG4gICAgfSBlbHNlIHtcbiAgICAgIG1ldGEucmVzb2x2ZWQgPSBSM1Jlc29sdmVkRGVwZW5kZW5jeVR5cGUuVG9rZW47XG4gICAgfVxuICAgIG1ldGEudG9rZW4gPSBuZXcgV3JhcHBlZE5vZGVFeHByKHRva2VuKTtcbiAgfVxuXG4gIGlmIChBcnJheS5pc0FycmF5KGRlcCkpIHtcbiAgICBpZiAoZGVwLmxlbmd0aCA9PT0gMCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdEZXBlbmRlbmN5IGFycmF5IG11c3QgaGF2ZSBhcmd1bWVudHMuJyk7XG4gICAgfVxuICAgIGZvciAobGV0IGogPSAwOyBqIDwgZGVwLmxlbmd0aDsgaisrKSB7XG4gICAgICBjb25zdCBwYXJhbSA9IGRlcFtqXTtcbiAgICAgIGlmIChwYXJhbSBpbnN0YW5jZW9mIE9wdGlvbmFsIHx8IHBhcmFtLl9fcHJvdG9fXy5uZ01ldGFkYXRhTmFtZSA9PT0gJ09wdGlvbmFsJykge1xuICAgICAgICBtZXRhLm9wdGlvbmFsID0gdHJ1ZTtcbiAgICAgIH0gZWxzZSBpZiAocGFyYW0gaW5zdGFuY2VvZiBTa2lwU2VsZiB8fCBwYXJhbS5fX3Byb3RvX18ubmdNZXRhZGF0YU5hbWUgPT09ICdTa2lwU2VsZicpIHtcbiAgICAgICAgbWV0YS5za2lwU2VsZiA9IHRydWU7XG4gICAgICB9IGVsc2UgaWYgKHBhcmFtIGluc3RhbmNlb2YgU2VsZiB8fCBwYXJhbS5fX3Byb3RvX18ubmdNZXRhZGF0YU5hbWUgPT09ICdTZWxmJykge1xuICAgICAgICBtZXRhLnNlbGYgPSB0cnVlO1xuICAgICAgfSBlbHNlIGlmIChwYXJhbSBpbnN0YW5jZW9mIEhvc3QgfHwgcGFyYW0uX19wcm90b19fLm5nTWV0YWRhdGFOYW1lID09PSAnSG9zdCcpIHtcbiAgICAgICAgbWV0YS5ob3N0ID0gdHJ1ZTtcbiAgICAgIH0gZWxzZSBpZiAocGFyYW0gaW5zdGFuY2VvZiBJbmplY3QpIHtcbiAgICAgICAgbWV0YS50b2tlbiA9IG5ldyBXcmFwcGVkTm9kZUV4cHIocGFyYW0udG9rZW4pO1xuICAgICAgfSBlbHNlIGlmIChwYXJhbSBpbnN0YW5jZW9mIEF0dHJpYnV0ZSkge1xuICAgICAgICBpZiAocGFyYW0uYXR0cmlidXRlTmFtZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBBdHRyaWJ1dGUgbmFtZSBtdXN0IGJlIGRlZmluZWQuYCk7XG4gICAgICAgIH1cbiAgICAgICAgbWV0YS50b2tlbiA9IG5ldyBMaXRlcmFsRXhwcihwYXJhbS5hdHRyaWJ1dGVOYW1lKTtcbiAgICAgICAgbWV0YS5yZXNvbHZlZCA9IFIzUmVzb2x2ZWREZXBlbmRlbmN5VHlwZS5BdHRyaWJ1dGU7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzZXRUb2tlbkFuZFJlc29sdmVkVHlwZShwYXJhbSk7XG4gICAgICB9XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIHNldFRva2VuQW5kUmVzb2x2ZWRUeXBlKGRlcCk7XG4gIH1cbiAgcmV0dXJuIG1ldGE7XG59XG4iXX0=