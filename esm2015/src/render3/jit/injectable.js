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
import { LiteralExpr, WrappedNodeExpr, compileInjectable as compileIvyInjectable, jitExpression } from '@angular/compiler';
import { getClosureSafeProperty } from '../../util/property';
import { angularCoreEnv } from './environment';
import { convertDependencies, reflectDependencies } from './util';
/**
 * Compile an Angular injectable according to its `Injectable` metadata, and patch the resulting
 * `ngInjectableDef` onto the injectable type.
 * @param {?} type
 * @param {?=} meta
 * @return {?}
 */
export function compileInjectable(type, meta) {
    // TODO(alxhub): handle JIT of bare @Injectable().
    if (!meta) {
        return;
    }
    let /** @type {?} */ def = null;
    Object.defineProperty(type, 'ngInjectableDef', {
        get: () => {
            if (def === null) {
                // Check whether the injectable metadata includes a provider specification.
                const /** @type {?} */ hasAProvider = isUseClassProvider(meta) || isUseFactoryProvider(meta) ||
                    isUseValueProvider(meta) || isUseExistingProvider(meta);
                let /** @type {?} */ deps = undefined;
                if (!hasAProvider || (isUseClassProvider(meta) && type === meta.useClass)) {
                    deps = reflectDependencies(type);
                }
                else if (isUseClassProvider(meta)) {
                    deps = meta.deps && convertDependencies(meta.deps);
                }
                else if (isUseFactoryProvider(meta)) {
                    deps = meta.deps && convertDependencies(meta.deps) || [];
                }
                // Decide which flavor of factory to generate, based on the provider specified.
                // Only one of the use* fields should be set.
                let /** @type {?} */ useClass = undefined;
                let /** @type {?} */ useFactory = undefined;
                let /** @type {?} */ useValue = undefined;
                let /** @type {?} */ useExisting = undefined;
                if (!hasAProvider) {
                    // In the case the user specifies a type provider, treat it as {provide: X, useClass: X}.
                    // The deps will have been reflected above, causing the factory to create the class by
                    // calling
                    // its constructor with injected deps.
                    useClass = new WrappedNodeExpr(type);
                }
                else if (isUseClassProvider(meta)) {
                    // The user explicitly specified useClass, and may or may not have provided deps.
                    useClass = new WrappedNodeExpr(meta.useClass);
                }
                else if (isUseValueProvider(meta)) {
                    // The user explicitly specified useValue.
                    useValue = new WrappedNodeExpr(meta.useValue);
                }
                else if (isUseFactoryProvider(meta)) {
                    // The user explicitly specified useFactory.
                    useFactory = new WrappedNodeExpr(meta.useFactory);
                }
                else if (isUseExistingProvider(meta)) {
                    // The user explicitly specified useExisting.
                    useExisting = new WrappedNodeExpr(meta.useExisting);
                }
                else {
                    // Can't happen - either hasAProvider will be false, or one of the providers will be set.
                    throw new Error(`Unreachable state.`);
                }
                const { expression } = compileIvyInjectable({
                    name: type.name,
                    type: new WrappedNodeExpr(type),
                    providedIn: computeProvidedIn(meta.providedIn),
                    useClass,
                    useFactory,
                    useValue,
                    useExisting,
                    deps,
                });
                def = jitExpression(expression, angularCoreEnv, `ng://${type.name}/ngInjectableDef.js`);
            }
            return def;
        },
    });
}
/**
 * @param {?} providedIn
 * @return {?}
 */
function computeProvidedIn(providedIn) {
    if (providedIn == null || typeof providedIn === 'string') {
        return new LiteralExpr(providedIn);
    }
    else {
        return new WrappedNodeExpr(providedIn);
    }
}
/**
 * @param {?} meta
 * @return {?}
 */
function isUseClassProvider(meta) {
    return (/** @type {?} */ (meta)).useClass !== undefined;
}
const /** @type {?} */ GET_PROPERTY_NAME = /** @type {?} */ ({});
const ɵ0 = GET_PROPERTY_NAME;
const /** @type {?} */ USE_VALUE = getClosureSafeProperty({ provide: String, useValue: ɵ0 }, GET_PROPERTY_NAME);
/**
 * @param {?} meta
 * @return {?}
 */
function isUseValueProvider(meta) {
    return USE_VALUE in meta;
}
/**
 * @param {?} meta
 * @return {?}
 */
function isUseFactoryProvider(meta) {
    return (/** @type {?} */ (meta)).useFactory !== undefined;
}
/**
 * @param {?} meta
 * @return {?}
 */
function isUseExistingProvider(meta) {
    return (/** @type {?} */ (meta)).useExisting !== undefined;
}
export { ɵ0 };

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5qZWN0YWJsZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvaml0L2luamVjdGFibGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFRQSxPQUFPLEVBQWEsV0FBVyxFQUF3QixlQUFlLEVBQUUsaUJBQWlCLElBQUksb0JBQW9CLEVBQUUsYUFBYSxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFLM0osT0FBTyxFQUFDLHNCQUFzQixFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFFM0QsT0FBTyxFQUFDLGNBQWMsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUM3QyxPQUFPLEVBQUMsbUJBQW1CLEVBQUUsbUJBQW1CLEVBQUMsTUFBTSxRQUFRLENBQUM7Ozs7Ozs7O0FBT2hFLE1BQU0sNEJBQTRCLElBQWUsRUFBRSxJQUFpQjs7SUFFbEUsSUFBSSxDQUFDLElBQUksRUFBRTtRQUNULE9BQU87S0FDUjtJQUVELHFCQUFJLEdBQUcsR0FBUSxJQUFJLENBQUM7SUFDcEIsTUFBTSxDQUFDLGNBQWMsQ0FBQyxJQUFJLEVBQUUsaUJBQWlCLEVBQUU7UUFDN0MsR0FBRyxFQUFFLEdBQUcsRUFBRTtZQUNSLElBQUksR0FBRyxLQUFLLElBQUksRUFBRTs7Z0JBRWhCLHVCQUFNLFlBQVksR0FBRyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsSUFBSSxvQkFBb0IsQ0FBQyxJQUFJLENBQUM7b0JBQ3ZFLGtCQUFrQixDQUFDLElBQUksQ0FBQyxJQUFJLHFCQUFxQixDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUU1RCxxQkFBSSxJQUFJLEdBQXFDLFNBQVMsQ0FBQztnQkFDdkQsSUFBSSxDQUFDLFlBQVksSUFBSSxDQUFDLGtCQUFrQixDQUFDLElBQUksQ0FBQyxJQUFJLElBQUksS0FBSyxJQUFJLENBQUMsUUFBUSxDQUFDLEVBQUU7b0JBQ3pFLElBQUksR0FBRyxtQkFBbUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztpQkFDbEM7cUJBQU0sSUFBSSxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsRUFBRTtvQkFDbkMsSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLElBQUksbUJBQW1CLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO2lCQUNwRDtxQkFBTSxJQUFJLG9CQUFvQixDQUFDLElBQUksQ0FBQyxFQUFFO29CQUNyQyxJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksSUFBSSxtQkFBbUIsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO2lCQUMxRDs7O2dCQUlELHFCQUFJLFFBQVEsR0FBeUIsU0FBUyxDQUFDO2dCQUMvQyxxQkFBSSxVQUFVLEdBQXlCLFNBQVMsQ0FBQztnQkFDakQscUJBQUksUUFBUSxHQUF5QixTQUFTLENBQUM7Z0JBQy9DLHFCQUFJLFdBQVcsR0FBeUIsU0FBUyxDQUFDO2dCQUVsRCxJQUFJLENBQUMsWUFBWSxFQUFFOzs7OztvQkFLakIsUUFBUSxHQUFHLElBQUksZUFBZSxDQUFDLElBQUksQ0FBQyxDQUFDO2lCQUN0QztxQkFBTSxJQUFJLGtCQUFrQixDQUFDLElBQUksQ0FBQyxFQUFFOztvQkFFbkMsUUFBUSxHQUFHLElBQUksZUFBZSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztpQkFDL0M7cUJBQU0sSUFBSSxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsRUFBRTs7b0JBRW5DLFFBQVEsR0FBRyxJQUFJLGVBQWUsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7aUJBQy9DO3FCQUFNLElBQUksb0JBQW9CLENBQUMsSUFBSSxDQUFDLEVBQUU7O29CQUVyQyxVQUFVLEdBQUcsSUFBSSxlQUFlLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO2lCQUNuRDtxQkFBTSxJQUFJLHFCQUFxQixDQUFDLElBQUksQ0FBQyxFQUFFOztvQkFFdEMsV0FBVyxHQUFHLElBQUksZUFBZSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQztpQkFDckQ7cUJBQU07O29CQUVMLE1BQU0sSUFBSSxLQUFLLENBQUMsb0JBQW9CLENBQUMsQ0FBQztpQkFDdkM7Z0JBRUQsTUFBTSxFQUFDLFVBQVUsRUFBQyxHQUFHLG9CQUFvQixDQUFDO29CQUN4QyxJQUFJLEVBQUUsSUFBSSxDQUFDLElBQUk7b0JBQ2YsSUFBSSxFQUFFLElBQUksZUFBZSxDQUFDLElBQUksQ0FBQztvQkFDL0IsVUFBVSxFQUFFLGlCQUFpQixDQUFDLElBQUksQ0FBQyxVQUFVLENBQUM7b0JBQzlDLFFBQVE7b0JBQ1IsVUFBVTtvQkFDVixRQUFRO29CQUNSLFdBQVc7b0JBQ1gsSUFBSTtpQkFDTCxDQUFDLENBQUM7Z0JBRUgsR0FBRyxHQUFHLGFBQWEsQ0FBQyxVQUFVLEVBQUUsY0FBYyxFQUFFLFFBQVEsSUFBSSxDQUFDLElBQUkscUJBQXFCLENBQUMsQ0FBQzthQUN6RjtZQUNELE9BQU8sR0FBRyxDQUFDO1NBQ1o7S0FDRixDQUFDLENBQUM7Q0FDSjs7Ozs7QUFFRCwyQkFBMkIsVUFBZ0Q7SUFDekUsSUFBSSxVQUFVLElBQUksSUFBSSxJQUFJLE9BQU8sVUFBVSxLQUFLLFFBQVEsRUFBRTtRQUN4RCxPQUFPLElBQUksV0FBVyxDQUFDLFVBQVUsQ0FBQyxDQUFDO0tBQ3BDO1NBQU07UUFDTCxPQUFPLElBQUksZUFBZSxDQUFDLFVBQVUsQ0FBQyxDQUFDO0tBQ3hDO0NBQ0Y7Ozs7O0FBSUQsNEJBQTRCLElBQWdCO0lBQzFDLE9BQU8sbUJBQUMsSUFBd0IsRUFBQyxDQUFDLFFBQVEsS0FBSyxTQUFTLENBQUM7Q0FDMUQ7QUFFRCx1QkFBTSxpQkFBaUIscUJBQUcsRUFBUyxDQUFBLENBQUM7V0FFSixpQkFBaUI7QUFEakQsdUJBQU0sU0FBUyxHQUFHLHNCQUFzQixDQUNwQyxFQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsUUFBUSxJQUFtQixFQUFDLEVBQUUsaUJBQWlCLENBQUMsQ0FBQzs7Ozs7QUFFdkUsNEJBQTRCLElBQWdCO0lBQzFDLE9BQU8sU0FBUyxJQUFJLElBQUksQ0FBQztDQUMxQjs7Ozs7QUFFRCw4QkFBOEIsSUFBZ0I7SUFDNUMsT0FBTyxtQkFBQyxJQUEyQixFQUFDLENBQUMsVUFBVSxLQUFLLFNBQVMsQ0FBQztDQUMvRDs7Ozs7QUFFRCwrQkFBK0IsSUFBZ0I7SUFDN0MsT0FBTyxtQkFBQyxJQUE0QixFQUFDLENBQUMsV0FBVyxLQUFLLFNBQVMsQ0FBQztDQUNqRSIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtFeHByZXNzaW9uLCBMaXRlcmFsRXhwciwgUjNEZXBlbmRlbmN5TWV0YWRhdGEsIFdyYXBwZWROb2RlRXhwciwgY29tcGlsZUluamVjdGFibGUgYXMgY29tcGlsZUl2eUluamVjdGFibGUsIGppdEV4cHJlc3Npb259IGZyb20gJ0Bhbmd1bGFyL2NvbXBpbGVyJztcblxuaW1wb3J0IHtJbmplY3RhYmxlfSBmcm9tICcuLi8uLi9kaS9pbmplY3RhYmxlJztcbmltcG9ydCB7Q2xhc3NTYW5zUHJvdmlkZXIsIEV4aXN0aW5nU2Fuc1Byb3ZpZGVyLCBGYWN0b3J5U2Fuc1Byb3ZpZGVyLCBTdGF0aWNDbGFzc1NhbnNQcm92aWRlciwgVmFsdWVQcm92aWRlciwgVmFsdWVTYW5zUHJvdmlkZXJ9IGZyb20gJy4uLy4uL2RpL3Byb3ZpZGVyJztcbmltcG9ydCB7VHlwZX0gZnJvbSAnLi4vLi4vdHlwZSc7XG5pbXBvcnQge2dldENsb3N1cmVTYWZlUHJvcGVydHl9IGZyb20gJy4uLy4uL3V0aWwvcHJvcGVydHknO1xuXG5pbXBvcnQge2FuZ3VsYXJDb3JlRW52fSBmcm9tICcuL2Vudmlyb25tZW50JztcbmltcG9ydCB7Y29udmVydERlcGVuZGVuY2llcywgcmVmbGVjdERlcGVuZGVuY2llc30gZnJvbSAnLi91dGlsJztcblxuXG4vKipcbiAqIENvbXBpbGUgYW4gQW5ndWxhciBpbmplY3RhYmxlIGFjY29yZGluZyB0byBpdHMgYEluamVjdGFibGVgIG1ldGFkYXRhLCBhbmQgcGF0Y2ggdGhlIHJlc3VsdGluZ1xuICogYG5nSW5qZWN0YWJsZURlZmAgb250byB0aGUgaW5qZWN0YWJsZSB0eXBlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY29tcGlsZUluamVjdGFibGUodHlwZTogVHlwZTxhbnk+LCBtZXRhPzogSW5qZWN0YWJsZSk6IHZvaWQge1xuICAvLyBUT0RPKGFseGh1Yik6IGhhbmRsZSBKSVQgb2YgYmFyZSBASW5qZWN0YWJsZSgpLlxuICBpZiAoIW1ldGEpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICBsZXQgZGVmOiBhbnkgPSBudWxsO1xuICBPYmplY3QuZGVmaW5lUHJvcGVydHkodHlwZSwgJ25nSW5qZWN0YWJsZURlZicsIHtcbiAgICBnZXQ6ICgpID0+IHtcbiAgICAgIGlmIChkZWYgPT09IG51bGwpIHtcbiAgICAgICAgLy8gQ2hlY2sgd2hldGhlciB0aGUgaW5qZWN0YWJsZSBtZXRhZGF0YSBpbmNsdWRlcyBhIHByb3ZpZGVyIHNwZWNpZmljYXRpb24uXG4gICAgICAgIGNvbnN0IGhhc0FQcm92aWRlciA9IGlzVXNlQ2xhc3NQcm92aWRlcihtZXRhKSB8fCBpc1VzZUZhY3RvcnlQcm92aWRlcihtZXRhKSB8fFxuICAgICAgICAgICAgaXNVc2VWYWx1ZVByb3ZpZGVyKG1ldGEpIHx8IGlzVXNlRXhpc3RpbmdQcm92aWRlcihtZXRhKTtcblxuICAgICAgICBsZXQgZGVwczogUjNEZXBlbmRlbmN5TWV0YWRhdGFbXXx1bmRlZmluZWQgPSB1bmRlZmluZWQ7XG4gICAgICAgIGlmICghaGFzQVByb3ZpZGVyIHx8IChpc1VzZUNsYXNzUHJvdmlkZXIobWV0YSkgJiYgdHlwZSA9PT0gbWV0YS51c2VDbGFzcykpIHtcbiAgICAgICAgICBkZXBzID0gcmVmbGVjdERlcGVuZGVuY2llcyh0eXBlKTtcbiAgICAgICAgfSBlbHNlIGlmIChpc1VzZUNsYXNzUHJvdmlkZXIobWV0YSkpIHtcbiAgICAgICAgICBkZXBzID0gbWV0YS5kZXBzICYmIGNvbnZlcnREZXBlbmRlbmNpZXMobWV0YS5kZXBzKTtcbiAgICAgICAgfSBlbHNlIGlmIChpc1VzZUZhY3RvcnlQcm92aWRlcihtZXRhKSkge1xuICAgICAgICAgIGRlcHMgPSBtZXRhLmRlcHMgJiYgY29udmVydERlcGVuZGVuY2llcyhtZXRhLmRlcHMpIHx8IFtdO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gRGVjaWRlIHdoaWNoIGZsYXZvciBvZiBmYWN0b3J5IHRvIGdlbmVyYXRlLCBiYXNlZCBvbiB0aGUgcHJvdmlkZXIgc3BlY2lmaWVkLlxuICAgICAgICAvLyBPbmx5IG9uZSBvZiB0aGUgdXNlKiBmaWVsZHMgc2hvdWxkIGJlIHNldC5cbiAgICAgICAgbGV0IHVzZUNsYXNzOiBFeHByZXNzaW9ufHVuZGVmaW5lZCA9IHVuZGVmaW5lZDtcbiAgICAgICAgbGV0IHVzZUZhY3Rvcnk6IEV4cHJlc3Npb258dW5kZWZpbmVkID0gdW5kZWZpbmVkO1xuICAgICAgICBsZXQgdXNlVmFsdWU6IEV4cHJlc3Npb258dW5kZWZpbmVkID0gdW5kZWZpbmVkO1xuICAgICAgICBsZXQgdXNlRXhpc3Rpbmc6IEV4cHJlc3Npb258dW5kZWZpbmVkID0gdW5kZWZpbmVkO1xuXG4gICAgICAgIGlmICghaGFzQVByb3ZpZGVyKSB7XG4gICAgICAgICAgLy8gSW4gdGhlIGNhc2UgdGhlIHVzZXIgc3BlY2lmaWVzIGEgdHlwZSBwcm92aWRlciwgdHJlYXQgaXQgYXMge3Byb3ZpZGU6IFgsIHVzZUNsYXNzOiBYfS5cbiAgICAgICAgICAvLyBUaGUgZGVwcyB3aWxsIGhhdmUgYmVlbiByZWZsZWN0ZWQgYWJvdmUsIGNhdXNpbmcgdGhlIGZhY3RvcnkgdG8gY3JlYXRlIHRoZSBjbGFzcyBieVxuICAgICAgICAgIC8vIGNhbGxpbmdcbiAgICAgICAgICAvLyBpdHMgY29uc3RydWN0b3Igd2l0aCBpbmplY3RlZCBkZXBzLlxuICAgICAgICAgIHVzZUNsYXNzID0gbmV3IFdyYXBwZWROb2RlRXhwcih0eXBlKTtcbiAgICAgICAgfSBlbHNlIGlmIChpc1VzZUNsYXNzUHJvdmlkZXIobWV0YSkpIHtcbiAgICAgICAgICAvLyBUaGUgdXNlciBleHBsaWNpdGx5IHNwZWNpZmllZCB1c2VDbGFzcywgYW5kIG1heSBvciBtYXkgbm90IGhhdmUgcHJvdmlkZWQgZGVwcy5cbiAgICAgICAgICB1c2VDbGFzcyA9IG5ldyBXcmFwcGVkTm9kZUV4cHIobWV0YS51c2VDbGFzcyk7XG4gICAgICAgIH0gZWxzZSBpZiAoaXNVc2VWYWx1ZVByb3ZpZGVyKG1ldGEpKSB7XG4gICAgICAgICAgLy8gVGhlIHVzZXIgZXhwbGljaXRseSBzcGVjaWZpZWQgdXNlVmFsdWUuXG4gICAgICAgICAgdXNlVmFsdWUgPSBuZXcgV3JhcHBlZE5vZGVFeHByKG1ldGEudXNlVmFsdWUpO1xuICAgICAgICB9IGVsc2UgaWYgKGlzVXNlRmFjdG9yeVByb3ZpZGVyKG1ldGEpKSB7XG4gICAgICAgICAgLy8gVGhlIHVzZXIgZXhwbGljaXRseSBzcGVjaWZpZWQgdXNlRmFjdG9yeS5cbiAgICAgICAgICB1c2VGYWN0b3J5ID0gbmV3IFdyYXBwZWROb2RlRXhwcihtZXRhLnVzZUZhY3RvcnkpO1xuICAgICAgICB9IGVsc2UgaWYgKGlzVXNlRXhpc3RpbmdQcm92aWRlcihtZXRhKSkge1xuICAgICAgICAgIC8vIFRoZSB1c2VyIGV4cGxpY2l0bHkgc3BlY2lmaWVkIHVzZUV4aXN0aW5nLlxuICAgICAgICAgIHVzZUV4aXN0aW5nID0gbmV3IFdyYXBwZWROb2RlRXhwcihtZXRhLnVzZUV4aXN0aW5nKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBDYW4ndCBoYXBwZW4gLSBlaXRoZXIgaGFzQVByb3ZpZGVyIHdpbGwgYmUgZmFsc2UsIG9yIG9uZSBvZiB0aGUgcHJvdmlkZXJzIHdpbGwgYmUgc2V0LlxuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgVW5yZWFjaGFibGUgc3RhdGUuYCk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCB7ZXhwcmVzc2lvbn0gPSBjb21waWxlSXZ5SW5qZWN0YWJsZSh7XG4gICAgICAgICAgbmFtZTogdHlwZS5uYW1lLFxuICAgICAgICAgIHR5cGU6IG5ldyBXcmFwcGVkTm9kZUV4cHIodHlwZSksXG4gICAgICAgICAgcHJvdmlkZWRJbjogY29tcHV0ZVByb3ZpZGVkSW4obWV0YS5wcm92aWRlZEluKSxcbiAgICAgICAgICB1c2VDbGFzcyxcbiAgICAgICAgICB1c2VGYWN0b3J5LFxuICAgICAgICAgIHVzZVZhbHVlLFxuICAgICAgICAgIHVzZUV4aXN0aW5nLFxuICAgICAgICAgIGRlcHMsXG4gICAgICAgIH0pO1xuXG4gICAgICAgIGRlZiA9IGppdEV4cHJlc3Npb24oZXhwcmVzc2lvbiwgYW5ndWxhckNvcmVFbnYsIGBuZzovLyR7dHlwZS5uYW1lfS9uZ0luamVjdGFibGVEZWYuanNgKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBkZWY7XG4gICAgfSxcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIGNvbXB1dGVQcm92aWRlZEluKHByb3ZpZGVkSW46IFR5cGU8YW55Pnwgc3RyaW5nIHwgbnVsbCB8IHVuZGVmaW5lZCk6IEV4cHJlc3Npb24ge1xuICBpZiAocHJvdmlkZWRJbiA9PSBudWxsIHx8IHR5cGVvZiBwcm92aWRlZEluID09PSAnc3RyaW5nJykge1xuICAgIHJldHVybiBuZXcgTGl0ZXJhbEV4cHIocHJvdmlkZWRJbik7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIG5ldyBXcmFwcGVkTm9kZUV4cHIocHJvdmlkZWRJbik7XG4gIH1cbn1cblxudHlwZSBVc2VDbGFzc1Byb3ZpZGVyID0gSW5qZWN0YWJsZSAmIENsYXNzU2Fuc1Byb3ZpZGVyICYge2RlcHM/OiBhbnlbXX07XG5cbmZ1bmN0aW9uIGlzVXNlQ2xhc3NQcm92aWRlcihtZXRhOiBJbmplY3RhYmxlKTogbWV0YSBpcyBVc2VDbGFzc1Byb3ZpZGVyIHtcbiAgcmV0dXJuIChtZXRhIGFzIFVzZUNsYXNzUHJvdmlkZXIpLnVzZUNsYXNzICE9PSB1bmRlZmluZWQ7XG59XG5cbmNvbnN0IEdFVF9QUk9QRVJUWV9OQU1FID0ge30gYXMgYW55O1xuY29uc3QgVVNFX1ZBTFVFID0gZ2V0Q2xvc3VyZVNhZmVQcm9wZXJ0eTxWYWx1ZVByb3ZpZGVyPihcbiAgICB7cHJvdmlkZTogU3RyaW5nLCB1c2VWYWx1ZTogR0VUX1BST1BFUlRZX05BTUV9LCBHRVRfUFJPUEVSVFlfTkFNRSk7XG5cbmZ1bmN0aW9uIGlzVXNlVmFsdWVQcm92aWRlcihtZXRhOiBJbmplY3RhYmxlKTogbWV0YSBpcyBJbmplY3RhYmxlJlZhbHVlU2Fuc1Byb3ZpZGVyIHtcbiAgcmV0dXJuIFVTRV9WQUxVRSBpbiBtZXRhO1xufVxuXG5mdW5jdGlvbiBpc1VzZUZhY3RvcnlQcm92aWRlcihtZXRhOiBJbmplY3RhYmxlKTogbWV0YSBpcyBJbmplY3RhYmxlJkZhY3RvcnlTYW5zUHJvdmlkZXIge1xuICByZXR1cm4gKG1ldGEgYXMgRmFjdG9yeVNhbnNQcm92aWRlcikudXNlRmFjdG9yeSAhPT0gdW5kZWZpbmVkO1xufVxuXG5mdW5jdGlvbiBpc1VzZUV4aXN0aW5nUHJvdmlkZXIobWV0YTogSW5qZWN0YWJsZSk6IG1ldGEgaXMgSW5qZWN0YWJsZSZFeGlzdGluZ1NhbnNQcm92aWRlciB7XG4gIHJldHVybiAobWV0YSBhcyBFeGlzdGluZ1NhbnNQcm92aWRlcikudXNlRXhpc3RpbmcgIT09IHVuZGVmaW5lZDtcbn1cbiJdfQ==