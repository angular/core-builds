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
import { getClosureSafeProperty } from '../../util/property';
import { NG_INJECTABLE_DEF } from '../fields';
import { getCompilerFacade } from './compiler_facade';
import { angularCoreEnv } from './environment';
import { convertDependencies, reflectDependencies } from './util';
/**
 * Compile an Angular injectable according to its `Injectable` metadata, and patch the resulting
 * `ngInjectableDef` onto the injectable type.
 * @param {?} type
 * @param {?=} srcMeta
 * @return {?}
 */
export function compileInjectable(type, srcMeta) {
    /** @type {?} */
    let def = null;
    // if NG_INJECTABLE_DEF is already defined on this class then don't overwrite it
    if (type.hasOwnProperty(NG_INJECTABLE_DEF))
        return;
    Object.defineProperty(type, NG_INJECTABLE_DEF, {
        get: () => {
            if (def === null) {
                /** @type {?} */
                const meta = srcMeta || { providedIn: null };
                /** @type {?} */
                const hasAProvider = isUseClassProvider(meta) || isUseFactoryProvider(meta) ||
                    isUseValueProvider(meta) || isUseExistingProvider(meta);
                /** @type {?} */
                const compilerMeta = {
                    name: type.name,
                    type: type,
                    typeArgumentCount: 0,
                    providedIn: meta.providedIn,
                    ctorDeps: reflectDependencies(type),
                    userDeps: undefined
                };
                if ((isUseClassProvider(meta) || isUseFactoryProvider(meta)) && meta.deps !== undefined) {
                    compilerMeta.userDeps = convertDependencies(meta.deps);
                }
                if (!hasAProvider) {
                    // In the case the user specifies a type provider, treat it as {provide: X, useClass: X}.
                    // The deps will have been reflected above, causing the factory to create the class by
                    // calling
                    // its constructor with injected deps.
                    compilerMeta.useClass = type;
                }
                else if (isUseClassProvider(meta)) {
                    // The user explicitly specified useClass, and may or may not have provided deps.
                    compilerMeta.useClass = meta.useClass;
                }
                else if (isUseValueProvider(meta)) {
                    // The user explicitly specified useValue.
                    compilerMeta.useValue = meta.useValue;
                }
                else if (isUseFactoryProvider(meta)) {
                    // The user explicitly specified useFactory.
                    compilerMeta.useFactory = meta.useFactory;
                }
                else if (isUseExistingProvider(meta)) {
                    // The user explicitly specified useExisting.
                    compilerMeta.useExisting = meta.useExisting;
                }
                else {
                    // Can't happen - either hasAProvider will be false, or one of the providers will be set.
                    throw new Error(`Unreachable state.`);
                }
                def = getCompilerFacade().compileInjectable(angularCoreEnv, `ng://${type.name}/ngInjectableDef.js`, compilerMeta);
            }
            return def;
        },
    });
}
/** @typedef {?} */
var UseClassProvider;
const ɵ0 = getClosureSafeProperty;
/** @type {?} */
const USE_VALUE = getClosureSafeProperty({ provide: String, useValue: ɵ0 });
/**
 * @param {?} meta
 * @return {?}
 */
function isUseClassProvider(meta) {
    return (/** @type {?} */ (meta)).useClass !== undefined;
}
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5qZWN0YWJsZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvaml0L2luamVjdGFibGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFXQSxPQUFPLEVBQUMsc0JBQXNCLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUMzRCxPQUFPLEVBQUMsaUJBQWlCLEVBQUMsTUFBTSxXQUFXLENBQUM7QUFFNUMsT0FBTyxFQUE2QixpQkFBaUIsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQ2hGLE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFDN0MsT0FBTyxFQUFDLG1CQUFtQixFQUFFLG1CQUFtQixFQUFDLE1BQU0sUUFBUSxDQUFDOzs7Ozs7OztBQVFoRSxNQUFNLFVBQVUsaUJBQWlCLENBQUMsSUFBZSxFQUFFLE9BQW9COztJQUNyRSxJQUFJLEdBQUcsR0FBUSxJQUFJLENBQUM7O0lBR3BCLElBQUksSUFBSSxDQUFDLGNBQWMsQ0FBQyxpQkFBaUIsQ0FBQztRQUFFLE9BQU87SUFFbkQsTUFBTSxDQUFDLGNBQWMsQ0FBQyxJQUFJLEVBQUUsaUJBQWlCLEVBQUU7UUFDN0MsR0FBRyxFQUFFLEdBQUcsRUFBRTtZQUNSLElBQUksR0FBRyxLQUFLLElBQUksRUFBRTs7Z0JBRWhCLE1BQU0sSUFBSSxHQUFlLE9BQU8sSUFBSSxFQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUMsQ0FBQzs7Z0JBQ3ZELE1BQU0sWUFBWSxHQUFHLGtCQUFrQixDQUFDLElBQUksQ0FBQyxJQUFJLG9CQUFvQixDQUFDLElBQUksQ0FBQztvQkFDdkUsa0JBQWtCLENBQUMsSUFBSSxDQUFDLElBQUkscUJBQXFCLENBQUMsSUFBSSxDQUFDLENBQUM7O2dCQUc1RCxNQUFNLFlBQVksR0FBK0I7b0JBQy9DLElBQUksRUFBRSxJQUFJLENBQUMsSUFBSTtvQkFDZixJQUFJLEVBQUUsSUFBSTtvQkFDVixpQkFBaUIsRUFBRSxDQUFDO29CQUNwQixVQUFVLEVBQUUsSUFBSSxDQUFDLFVBQVU7b0JBQzNCLFFBQVEsRUFBRSxtQkFBbUIsQ0FBQyxJQUFJLENBQUM7b0JBQ25DLFFBQVEsRUFBRSxTQUFTO2lCQUNwQixDQUFDO2dCQUNGLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsSUFBSSxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsQ0FBQyxJQUFJLElBQUksQ0FBQyxJQUFJLEtBQUssU0FBUyxFQUFFO29CQUN2RixZQUFZLENBQUMsUUFBUSxHQUFHLG1CQUFtQixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztpQkFDeEQ7Z0JBQ0QsSUFBSSxDQUFDLFlBQVksRUFBRTs7Ozs7b0JBS2pCLFlBQVksQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDO2lCQUM5QjtxQkFBTSxJQUFJLGtCQUFrQixDQUFDLElBQUksQ0FBQyxFQUFFOztvQkFFbkMsWUFBWSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDO2lCQUN2QztxQkFBTSxJQUFJLGtCQUFrQixDQUFDLElBQUksQ0FBQyxFQUFFOztvQkFFbkMsWUFBWSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDO2lCQUN2QztxQkFBTSxJQUFJLG9CQUFvQixDQUFDLElBQUksQ0FBQyxFQUFFOztvQkFFckMsWUFBWSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDO2lCQUMzQztxQkFBTSxJQUFJLHFCQUFxQixDQUFDLElBQUksQ0FBQyxFQUFFOztvQkFFdEMsWUFBWSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDO2lCQUM3QztxQkFBTTs7b0JBRUwsTUFBTSxJQUFJLEtBQUssQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO2lCQUN2QztnQkFDRCxHQUFHLEdBQUcsaUJBQWlCLEVBQUUsQ0FBQyxpQkFBaUIsQ0FDdkMsY0FBYyxFQUFFLFFBQVEsSUFBSSxDQUFDLElBQUkscUJBQXFCLEVBQUUsWUFBWSxDQUFDLENBQUM7YUFDM0U7WUFDRCxPQUFPLEdBQUcsQ0FBQztTQUNaO0tBQ0YsQ0FBQyxDQUFDO0NBQ0o7OztXQUtxRSxzQkFBc0I7O0FBRDVGLE1BQU0sU0FBUyxHQUNYLHNCQUFzQixDQUFnQixFQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsUUFBUSxJQUF3QixFQUFDLENBQUMsQ0FBQzs7Ozs7QUFFL0YsU0FBUyxrQkFBa0IsQ0FBQyxJQUFnQjtJQUMxQyxPQUFPLG1CQUFDLElBQXdCLEVBQUMsQ0FBQyxRQUFRLEtBQUssU0FBUyxDQUFDO0NBQzFEOzs7OztBQUVELFNBQVMsa0JBQWtCLENBQUMsSUFBZ0I7SUFDMUMsT0FBTyxTQUFTLElBQUksSUFBSSxDQUFDO0NBQzFCOzs7OztBQUVELFNBQVMsb0JBQW9CLENBQUMsSUFBZ0I7SUFDNUMsT0FBTyxtQkFBQyxJQUEyQixFQUFDLENBQUMsVUFBVSxLQUFLLFNBQVMsQ0FBQztDQUMvRDs7Ozs7QUFFRCxTQUFTLHFCQUFxQixDQUFDLElBQWdCO0lBQzdDLE9BQU8sbUJBQUMsSUFBNEIsRUFBQyxDQUFDLFdBQVcsS0FBSyxTQUFTLENBQUM7Q0FDakUiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7SW5qZWN0YWJsZX0gZnJvbSAnLi4vLi4vZGkvaW5qZWN0YWJsZSc7XG5pbXBvcnQge0NsYXNzU2Fuc1Byb3ZpZGVyLCBFeGlzdGluZ1NhbnNQcm92aWRlciwgRmFjdG9yeVNhbnNQcm92aWRlciwgVmFsdWVQcm92aWRlciwgVmFsdWVTYW5zUHJvdmlkZXJ9IGZyb20gJy4uLy4uL2RpL3Byb3ZpZGVyJztcbmltcG9ydCB7VHlwZX0gZnJvbSAnLi4vLi4vdHlwZSc7XG5pbXBvcnQge2dldENsb3N1cmVTYWZlUHJvcGVydHl9IGZyb20gJy4uLy4uL3V0aWwvcHJvcGVydHknO1xuaW1wb3J0IHtOR19JTkpFQ1RBQkxFX0RFRn0gZnJvbSAnLi4vZmllbGRzJztcblxuaW1wb3J0IHtSM0luamVjdGFibGVNZXRhZGF0YUZhY2FkZSwgZ2V0Q29tcGlsZXJGYWNhZGV9IGZyb20gJy4vY29tcGlsZXJfZmFjYWRlJztcbmltcG9ydCB7YW5ndWxhckNvcmVFbnZ9IGZyb20gJy4vZW52aXJvbm1lbnQnO1xuaW1wb3J0IHtjb252ZXJ0RGVwZW5kZW5jaWVzLCByZWZsZWN0RGVwZW5kZW5jaWVzfSBmcm9tICcuL3V0aWwnO1xuXG5cblxuLyoqXG4gKiBDb21waWxlIGFuIEFuZ3VsYXIgaW5qZWN0YWJsZSBhY2NvcmRpbmcgdG8gaXRzIGBJbmplY3RhYmxlYCBtZXRhZGF0YSwgYW5kIHBhdGNoIHRoZSByZXN1bHRpbmdcbiAqIGBuZ0luamVjdGFibGVEZWZgIG9udG8gdGhlIGluamVjdGFibGUgdHlwZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbXBpbGVJbmplY3RhYmxlKHR5cGU6IFR5cGU8YW55Piwgc3JjTWV0YT86IEluamVjdGFibGUpOiB2b2lkIHtcbiAgbGV0IGRlZjogYW55ID0gbnVsbDtcblxuICAvLyBpZiBOR19JTkpFQ1RBQkxFX0RFRiBpcyBhbHJlYWR5IGRlZmluZWQgb24gdGhpcyBjbGFzcyB0aGVuIGRvbid0IG92ZXJ3cml0ZSBpdFxuICBpZiAodHlwZS5oYXNPd25Qcm9wZXJ0eShOR19JTkpFQ1RBQkxFX0RFRikpIHJldHVybjtcblxuICBPYmplY3QuZGVmaW5lUHJvcGVydHkodHlwZSwgTkdfSU5KRUNUQUJMRV9ERUYsIHtcbiAgICBnZXQ6ICgpID0+IHtcbiAgICAgIGlmIChkZWYgPT09IG51bGwpIHtcbiAgICAgICAgLy8gQWxsb3cgdGhlIGNvbXBpbGF0aW9uIG9mIGEgY2xhc3Mgd2l0aCBhIGBASW5qZWN0YWJsZSgpYCBkZWNvcmF0b3Igd2l0aG91dCBwYXJhbWV0ZXJzXG4gICAgICAgIGNvbnN0IG1ldGE6IEluamVjdGFibGUgPSBzcmNNZXRhIHx8IHtwcm92aWRlZEluOiBudWxsfTtcbiAgICAgICAgY29uc3QgaGFzQVByb3ZpZGVyID0gaXNVc2VDbGFzc1Byb3ZpZGVyKG1ldGEpIHx8IGlzVXNlRmFjdG9yeVByb3ZpZGVyKG1ldGEpIHx8XG4gICAgICAgICAgICBpc1VzZVZhbHVlUHJvdmlkZXIobWV0YSkgfHwgaXNVc2VFeGlzdGluZ1Byb3ZpZGVyKG1ldGEpO1xuXG5cbiAgICAgICAgY29uc3QgY29tcGlsZXJNZXRhOiBSM0luamVjdGFibGVNZXRhZGF0YUZhY2FkZSA9IHtcbiAgICAgICAgICBuYW1lOiB0eXBlLm5hbWUsXG4gICAgICAgICAgdHlwZTogdHlwZSxcbiAgICAgICAgICB0eXBlQXJndW1lbnRDb3VudDogMCxcbiAgICAgICAgICBwcm92aWRlZEluOiBtZXRhLnByb3ZpZGVkSW4sXG4gICAgICAgICAgY3RvckRlcHM6IHJlZmxlY3REZXBlbmRlbmNpZXModHlwZSksXG4gICAgICAgICAgdXNlckRlcHM6IHVuZGVmaW5lZFxuICAgICAgICB9O1xuICAgICAgICBpZiAoKGlzVXNlQ2xhc3NQcm92aWRlcihtZXRhKSB8fCBpc1VzZUZhY3RvcnlQcm92aWRlcihtZXRhKSkgJiYgbWV0YS5kZXBzICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICBjb21waWxlck1ldGEudXNlckRlcHMgPSBjb252ZXJ0RGVwZW5kZW5jaWVzKG1ldGEuZGVwcyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFoYXNBUHJvdmlkZXIpIHtcbiAgICAgICAgICAvLyBJbiB0aGUgY2FzZSB0aGUgdXNlciBzcGVjaWZpZXMgYSB0eXBlIHByb3ZpZGVyLCB0cmVhdCBpdCBhcyB7cHJvdmlkZTogWCwgdXNlQ2xhc3M6IFh9LlxuICAgICAgICAgIC8vIFRoZSBkZXBzIHdpbGwgaGF2ZSBiZWVuIHJlZmxlY3RlZCBhYm92ZSwgY2F1c2luZyB0aGUgZmFjdG9yeSB0byBjcmVhdGUgdGhlIGNsYXNzIGJ5XG4gICAgICAgICAgLy8gY2FsbGluZ1xuICAgICAgICAgIC8vIGl0cyBjb25zdHJ1Y3RvciB3aXRoIGluamVjdGVkIGRlcHMuXG4gICAgICAgICAgY29tcGlsZXJNZXRhLnVzZUNsYXNzID0gdHlwZTtcbiAgICAgICAgfSBlbHNlIGlmIChpc1VzZUNsYXNzUHJvdmlkZXIobWV0YSkpIHtcbiAgICAgICAgICAvLyBUaGUgdXNlciBleHBsaWNpdGx5IHNwZWNpZmllZCB1c2VDbGFzcywgYW5kIG1heSBvciBtYXkgbm90IGhhdmUgcHJvdmlkZWQgZGVwcy5cbiAgICAgICAgICBjb21waWxlck1ldGEudXNlQ2xhc3MgPSBtZXRhLnVzZUNsYXNzO1xuICAgICAgICB9IGVsc2UgaWYgKGlzVXNlVmFsdWVQcm92aWRlcihtZXRhKSkge1xuICAgICAgICAgIC8vIFRoZSB1c2VyIGV4cGxpY2l0bHkgc3BlY2lmaWVkIHVzZVZhbHVlLlxuICAgICAgICAgIGNvbXBpbGVyTWV0YS51c2VWYWx1ZSA9IG1ldGEudXNlVmFsdWU7XG4gICAgICAgIH0gZWxzZSBpZiAoaXNVc2VGYWN0b3J5UHJvdmlkZXIobWV0YSkpIHtcbiAgICAgICAgICAvLyBUaGUgdXNlciBleHBsaWNpdGx5IHNwZWNpZmllZCB1c2VGYWN0b3J5LlxuICAgICAgICAgIGNvbXBpbGVyTWV0YS51c2VGYWN0b3J5ID0gbWV0YS51c2VGYWN0b3J5O1xuICAgICAgICB9IGVsc2UgaWYgKGlzVXNlRXhpc3RpbmdQcm92aWRlcihtZXRhKSkge1xuICAgICAgICAgIC8vIFRoZSB1c2VyIGV4cGxpY2l0bHkgc3BlY2lmaWVkIHVzZUV4aXN0aW5nLlxuICAgICAgICAgIGNvbXBpbGVyTWV0YS51c2VFeGlzdGluZyA9IG1ldGEudXNlRXhpc3Rpbmc7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gQ2FuJ3QgaGFwcGVuIC0gZWl0aGVyIGhhc0FQcm92aWRlciB3aWxsIGJlIGZhbHNlLCBvciBvbmUgb2YgdGhlIHByb3ZpZGVycyB3aWxsIGJlIHNldC5cbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFVucmVhY2hhYmxlIHN0YXRlLmApO1xuICAgICAgICB9XG4gICAgICAgIGRlZiA9IGdldENvbXBpbGVyRmFjYWRlKCkuY29tcGlsZUluamVjdGFibGUoXG4gICAgICAgICAgICBhbmd1bGFyQ29yZUVudiwgYG5nOi8vJHt0eXBlLm5hbWV9L25nSW5qZWN0YWJsZURlZi5qc2AsIGNvbXBpbGVyTWV0YSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gZGVmO1xuICAgIH0sXG4gIH0pO1xufVxuXG50eXBlIFVzZUNsYXNzUHJvdmlkZXIgPSBJbmplY3RhYmxlICYgQ2xhc3NTYW5zUHJvdmlkZXIgJiB7ZGVwcz86IGFueVtdfTtcblxuY29uc3QgVVNFX1ZBTFVFID1cbiAgICBnZXRDbG9zdXJlU2FmZVByb3BlcnR5PFZhbHVlUHJvdmlkZXI+KHtwcm92aWRlOiBTdHJpbmcsIHVzZVZhbHVlOiBnZXRDbG9zdXJlU2FmZVByb3BlcnR5fSk7XG5cbmZ1bmN0aW9uIGlzVXNlQ2xhc3NQcm92aWRlcihtZXRhOiBJbmplY3RhYmxlKTogbWV0YSBpcyBVc2VDbGFzc1Byb3ZpZGVyIHtcbiAgcmV0dXJuIChtZXRhIGFzIFVzZUNsYXNzUHJvdmlkZXIpLnVzZUNsYXNzICE9PSB1bmRlZmluZWQ7XG59XG5cbmZ1bmN0aW9uIGlzVXNlVmFsdWVQcm92aWRlcihtZXRhOiBJbmplY3RhYmxlKTogbWV0YSBpcyBJbmplY3RhYmxlJlZhbHVlU2Fuc1Byb3ZpZGVyIHtcbiAgcmV0dXJuIFVTRV9WQUxVRSBpbiBtZXRhO1xufVxuXG5mdW5jdGlvbiBpc1VzZUZhY3RvcnlQcm92aWRlcihtZXRhOiBJbmplY3RhYmxlKTogbWV0YSBpcyBJbmplY3RhYmxlJkZhY3RvcnlTYW5zUHJvdmlkZXIge1xuICByZXR1cm4gKG1ldGEgYXMgRmFjdG9yeVNhbnNQcm92aWRlcikudXNlRmFjdG9yeSAhPT0gdW5kZWZpbmVkO1xufVxuXG5mdW5jdGlvbiBpc1VzZUV4aXN0aW5nUHJvdmlkZXIobWV0YTogSW5qZWN0YWJsZSk6IG1ldGEgaXMgSW5qZWN0YWJsZSZFeGlzdGluZ1NhbnNQcm92aWRlciB7XG4gIHJldHVybiAobWV0YSBhcyBFeGlzdGluZ1NhbnNQcm92aWRlcikudXNlRXhpc3RpbmcgIT09IHVuZGVmaW5lZDtcbn1cbiJdfQ==