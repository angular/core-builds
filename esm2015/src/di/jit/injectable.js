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
import { NG_FACTORY_DEF } from '../../render3/fields';
import { getClosureSafeProperty } from '../../util/property';
import { resolveForwardRef } from '../forward_ref';
import { NG_PROV_DEF } from '../interface/defs';
import { angularCoreDiEnv } from './environment';
import { convertDependencies, reflectDependencies } from './util';
/**
 * Compile an Angular injectable according to its `Injectable` metadata, and patch the resulting
 * injectable def (`ɵprov`) onto the injectable type.
 * @param {?} type
 * @param {?=} srcMeta
 * @return {?}
 */
export function compileInjectable(type, srcMeta) {
    /** @type {?} */
    let ngInjectableDef = null;
    /** @type {?} */
    let ngFactoryDef = null;
    // if NG_PROV_DEF is already defined on this class then don't overwrite it
    if (!type.hasOwnProperty(NG_PROV_DEF)) {
        Object.defineProperty(type, NG_PROV_DEF, {
            get: (/**
             * @return {?}
             */
            () => {
                if (ngInjectableDef === null) {
                    ngInjectableDef = getCompilerFacade().compileInjectable(angularCoreDiEnv, `ng:///${type.name}/ɵprov.js`, getInjectableMetadata(type, srcMeta));
                }
                return ngInjectableDef;
            }),
        });
    }
    // if NG_FACTORY_DEF is already defined on this class then don't overwrite it
    if (!type.hasOwnProperty(NG_FACTORY_DEF)) {
        Object.defineProperty(type, NG_FACTORY_DEF, {
            get: (/**
             * @return {?}
             */
            () => {
                if (ngFactoryDef === null) {
                    /** @type {?} */
                    const metadata = getInjectableMetadata(type, srcMeta);
                    ngFactoryDef =
                        getCompilerFacade().compileFactory(angularCoreDiEnv, `ng:///${type.name}/ɵfac.js`, {
                            name: metadata.name,
                            type: metadata.type,
                            typeArgumentCount: metadata.typeArgumentCount,
                            deps: reflectDependencies(type),
                            injectFn: 'inject',
                            isPipe: false
                        });
                }
                return ngFactoryDef;
            }),
            // Leave this configurable so that the factories from directives or pipes can take precedence.
            configurable: true
        });
    }
}
const ɵ0 = getClosureSafeProperty;
/** @type {?} */
const USE_VALUE = getClosureSafeProperty({ provide: String, useValue: ɵ0 });
/**
 * @param {?} meta
 * @return {?}
 */
function isUseClassProvider(meta) {
    return ((/** @type {?} */ (meta))).useClass !== undefined;
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
    return ((/** @type {?} */ (meta))).useFactory !== undefined;
}
/**
 * @param {?} meta
 * @return {?}
 */
function isUseExistingProvider(meta) {
    return ((/** @type {?} */ (meta))).useExisting !== undefined;
}
/**
 * @param {?} type
 * @param {?=} srcMeta
 * @return {?}
 */
function getInjectableMetadata(type, srcMeta) {
    // Allow the compilation of a class with a `@Injectable()` decorator without parameters
    /** @type {?} */
    const meta = srcMeta || { providedIn: null };
    /** @type {?} */
    const compilerMeta = {
        name: type.name,
        type: type,
        typeArgumentCount: 0,
        providedIn: meta.providedIn,
        userDeps: undefined,
    };
    if ((isUseClassProvider(meta) || isUseFactoryProvider(meta)) && meta.deps !== undefined) {
        compilerMeta.userDeps = convertDependencies(meta.deps);
    }
    if (isUseClassProvider(meta)) {
        // The user explicitly specified useClass, and may or may not have provided deps.
        compilerMeta.useClass = resolveForwardRef(meta.useClass);
    }
    else if (isUseValueProvider(meta)) {
        // The user explicitly specified useValue.
        compilerMeta.useValue = resolveForwardRef(meta.useValue);
    }
    else if (isUseFactoryProvider(meta)) {
        // The user explicitly specified useFactory.
        compilerMeta.useFactory = meta.useFactory;
    }
    else if (isUseExistingProvider(meta)) {
        // The user explicitly specified useExisting.
        compilerMeta.useExisting = resolveForwardRef(meta.useExisting);
    }
    return compilerMeta;
}
export { ɵ0 };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5qZWN0YWJsZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL2RpL2ppdC9pbmplY3RhYmxlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBUUEsT0FBTyxFQUE2QixpQkFBaUIsRUFBQyxNQUFNLGdDQUFnQyxDQUFDO0FBRTdGLE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSxzQkFBc0IsQ0FBQztBQUNwRCxPQUFPLEVBQUMsc0JBQXNCLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUMzRCxPQUFPLEVBQUMsaUJBQWlCLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUVqRCxPQUFPLEVBQUMsV0FBVyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFHOUMsT0FBTyxFQUFDLGdCQUFnQixFQUFDLE1BQU0sZUFBZSxDQUFDO0FBQy9DLE9BQU8sRUFBQyxtQkFBbUIsRUFBRSxtQkFBbUIsRUFBQyxNQUFNLFFBQVEsQ0FBQzs7Ozs7Ozs7QUFRaEUsTUFBTSxVQUFVLGlCQUFpQixDQUFDLElBQWUsRUFBRSxPQUFvQjs7UUFDakUsZUFBZSxHQUFRLElBQUk7O1FBQzNCLFlBQVksR0FBUSxJQUFJO0lBRTVCLDBFQUEwRTtJQUMxRSxJQUFJLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxXQUFXLENBQUMsRUFBRTtRQUNyQyxNQUFNLENBQUMsY0FBYyxDQUFDLElBQUksRUFBRSxXQUFXLEVBQUU7WUFDdkMsR0FBRzs7O1lBQUUsR0FBRyxFQUFFO2dCQUNSLElBQUksZUFBZSxLQUFLLElBQUksRUFBRTtvQkFDNUIsZUFBZSxHQUFHLGlCQUFpQixFQUFFLENBQUMsaUJBQWlCLENBQ25ELGdCQUFnQixFQUFFLFNBQVMsSUFBSSxDQUFDLElBQUksV0FBVyxFQUMvQyxxQkFBcUIsQ0FBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQztpQkFDM0M7Z0JBQ0QsT0FBTyxlQUFl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LElBQUksQ0FBQyxFQUFFO1FBQ3JDLDRDQUE0QztRQUM1QyxZQUFZLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUM7S0FDM0M7U0FBTSxJQUFJLHFCQUFxQixDQUFDLElBQUksQ0FBQyxFQUFFO1FBQ3RDLDZDQUE2QztRQUM3QyxZQUFZLENBQUMsV0FBVyxHQUFHLGlCQUFpQixDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQztLQUNoRTtJQUNELE9BQU8sWUFBWSxDQUFDO0FBQ3RCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7UjNJbmplY3RhYmxlTWV0YWRhdGFGYWNhZGUsIGdldENvbXBpbGVyRmFjYWRlfSBmcm9tICcuLi8uLi9jb21waWxlci9jb21waWxlcl9mYWNhZGUnO1xuaW1wb3J0IHtUeXBlfSBmcm9tICcuLi8uLi9pbnRlcmZhY2UvdHlwZSc7XG5pbXBvcnQge05HX0ZBQ1RPUllfREVGfSBmcm9tICcuLi8uLi9yZW5kZXIzL2ZpZWxkcyc7XG5pbXBvcnQge2dldENsb3N1cmVTYWZlUHJvcGVydHl9IGZyb20gJy4uLy4uL3V0aWwvcHJvcGVydHknO1xuaW1wb3J0IHtyZXNvbHZlRm9yd2FyZFJlZn0gZnJvbSAnLi4vZm9yd2FyZF9yZWYnO1xuaW1wb3J0IHtJbmplY3RhYmxlfSBmcm9tICcuLi9pbmplY3RhYmxlJztcbmltcG9ydCB7TkdfUFJPVl9ERUZ9IGZyb20gJy4uL2ludGVyZmFjZS9kZWZzJztcbmltcG9ydCB7Q2xhc3NTYW5zUHJvdmlkZXIsIEV4aXN0aW5nU2Fuc1Byb3ZpZGVyLCBGYWN0b3J5U2Fuc1Byb3ZpZGVyLCBWYWx1ZVByb3ZpZGVyLCBWYWx1ZVNhbnNQcm92aWRlcn0gZnJvbSAnLi4vaW50ZXJmYWNlL3Byb3ZpZGVyJztcblxuaW1wb3J0IHthbmd1bGFyQ29yZURpRW52fSBmcm9tICcuL2Vudmlyb25tZW50JztcbmltcG9ydCB7Y29udmVydERlcGVuZGVuY2llcywgcmVmbGVjdERlcGVuZGVuY2llc30gZnJvbSAnLi91dGlsJztcblxuXG5cbi8qKlxuICogQ29tcGlsZSBhbiBBbmd1bGFyIGluamVjdGFibGUgYWNjb3JkaW5nIHRvIGl0cyBgSW5qZWN0YWJsZWAgbWV0YWRhdGEsIGFuZCBwYXRjaCB0aGUgcmVzdWx0aW5nXG4gKiBpbmplY3RhYmxlIGRlZiAoYMm1cHJvdmApIG9udG8gdGhlIGluamVjdGFibGUgdHlwZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbXBpbGVJbmplY3RhYmxlKHR5cGU6IFR5cGU8YW55Piwgc3JjTWV0YT86IEluamVjdGFibGUpOiB2b2lkIHtcbiAgbGV0IG5nSW5qZWN0YWJsZURlZjogYW55ID0gbnVsbDtcbiAgbGV0IG5nRmFjdG9yeURlZjogYW55ID0gbnVsbDtcblxuICAvLyBpZiBOR19QUk9WX0RFRiBpcyBhbHJlYWR5IGRlZmluZWQgb24gdGhpcyBjbGFzcyB0aGVuIGRvbid0IG92ZXJ3cml0ZSBpdFxuICBpZiAoIXR5cGUuaGFzT3duUHJvcGVydHkoTkdfUFJPVl9ERUYpKSB7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHR5cGUsIE5HX1BST1ZfREVGLCB7XG4gICAgICBnZXQ6ICgpID0+IHtcbiAgICAgICAgaWYgKG5nSW5qZWN0YWJsZURlZiA9PT0gbnVsbCkge1xuICAgICAgICAgIG5nSW5qZWN0YWJsZURlZiA9IGdldENvbXBpbGVyRmFjYWRlKCkuY29tcGlsZUluamVjdGFibGUoXG4gICAgICAgICAgICAgIGFuZ3VsYXJDb3JlRGlFbnYsIGBuZzovLy8ke3R5cGUubmFtZX0vybVwcm92LmpzYCxcbiAgICAgICAgICAgICAgZ2V0SW5qZWN0YWJsZU1ldGFkYXRhKHR5cGUsIHNyY01ldGEpKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbmdJbmplY3RhYmxlRGVmO1xuICAgICAgfSxcbiAgICB9KTtcbiAgfVxuXG4gIC8vIGlmIE5HX0ZBQ1RPUllfREVGIGlzIGFscmVhZHkgZGVmaW5lZCBvbiB0aGlzIGNsYXNzIHRoZW4gZG9uJ3Qgb3ZlcndyaXRlIGl0XG4gIGlmICghdHlwZS5oYXNPd25Qcm9wZXJ0eShOR19GQUNUT1JZX0RFRikpIHtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodHlwZSwgTkdfRkFDVE9SWV9ERUYsIHtcbiAgICAgIGdldDogKCkgPT4ge1xuICAgICAgICBpZiAobmdGYWN0b3J5RGVmID09PSBudWxsKSB7XG4gICAgICAgICAgY29uc3QgbWV0YWRhdGEgPSBnZXRJbmplY3RhYmxlTWV0YWRhdGEodHlwZSwgc3JjTWV0YSk7XG4gICAgICAgICAgbmdGYWN0b3J5RGVmID1cbiAgICAgICAgICAgICAgZ2V0Q29tcGlsZXJGYWNhZGUoKS5jb21waWxlRmFjdG9yeShhbmd1bGFyQ29yZURpRW52LCBgbmc6Ly8vJHt0eXBlLm5hbWV9L8m1ZmFjLmpzYCwge1xuICAgICAgICAgICAgICAgIG5hbWU6IG1ldGFkYXRhLm5hbWUsXG4gICAgICAgICAgICAgICAgdHlwZTogbWV0YWRhdGEudHlwZSxcbiAgICAgICAgICAgICAgICB0eXBlQXJndW1lbnRDb3VudDogbWV0YWRhdGEudHlwZUFyZ3VtZW50Q291bnQsXG4gICAgICAgICAgICAgICAgZGVwczogcmVmbGVjdERlcGVuZGVuY2llcyh0eXBlKSxcbiAgICAgICAgICAgICAgICBpbmplY3RGbjogJ2luamVjdCcsXG4gICAgICAgICAgICAgICAgaXNQaXBlOiBmYWxzZVxuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbmdGYWN0b3J5RGVmO1xuICAgICAgfSxcbiAgICAgIC8vIExlYXZlIHRoaXMgY29uZmlndXJhYmxlIHNvIHRoYXQgdGhlIGZhY3RvcmllcyBmcm9tIGRpcmVjdGl2ZXMgb3IgcGlwZXMgY2FuIHRha2UgcHJlY2VkZW5jZS5cbiAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICB9XG59XG5cbnR5cGUgVXNlQ2xhc3NQcm92aWRlciA9IEluamVjdGFibGUgJiBDbGFzc1NhbnNQcm92aWRlciAmIHtkZXBzPzogYW55W119O1xuXG5jb25zdCBVU0VfVkFMVUUgPVxuICAgIGdldENsb3N1cmVTYWZlUHJvcGVydHk8VmFsdWVQcm92aWRlcj4oe3Byb3ZpZGU6IFN0cmluZywgdXNlVmFsdWU6IGdldENsb3N1cmVTYWZlUHJvcGVydHl9KTtcblxuZnVuY3Rpb24gaXNVc2VDbGFzc1Byb3ZpZGVyKG1ldGE6IEluamVjdGFibGUpOiBtZXRhIGlzIFVzZUNsYXNzUHJvdmlkZXIge1xuICByZXR1cm4gKG1ldGEgYXMgVXNlQ2xhc3NQcm92aWRlcikudXNlQ2xhc3MgIT09IHVuZGVmaW5lZDtcbn1cblxuZnVuY3Rpb24gaXNVc2VWYWx1ZVByb3ZpZGVyKG1ldGE6IEluamVjdGFibGUpOiBtZXRhIGlzIEluamVjdGFibGUmVmFsdWVTYW5zUHJvdmlkZXIge1xuICByZXR1cm4gVVNFX1ZBTFVFIGluIG1ldGE7XG59XG5cbmZ1bmN0aW9uIGlzVXNlRmFjdG9yeVByb3ZpZGVyKG1ldGE6IEluamVjdGFibGUpOiBtZXRhIGlzIEluamVjdGFibGUmRmFjdG9yeVNhbnNQcm92aWRlciB7XG4gIHJldHVybiAobWV0YSBhcyBGYWN0b3J5U2Fuc1Byb3ZpZGVyKS51c2VGYWN0b3J5ICE9PSB1bmRlZmluZWQ7XG59XG5cbmZ1bmN0aW9uIGlzVXNlRXhpc3RpbmdQcm92aWRlcihtZXRhOiBJbmplY3RhYmxlKTogbWV0YSBpcyBJbmplY3RhYmxlJkV4aXN0aW5nU2Fuc1Byb3ZpZGVyIHtcbiAgcmV0dXJuIChtZXRhIGFzIEV4aXN0aW5nU2Fuc1Byb3ZpZGVyKS51c2VFeGlzdGluZyAhPT0gdW5kZWZpbmVkO1xufVxuXG5mdW5jdGlvbiBnZXRJbmplY3RhYmxlTWV0YWRhdGEodHlwZTogVHlwZTxhbnk+LCBzcmNNZXRhPzogSW5qZWN0YWJsZSk6IFIzSW5qZWN0YWJsZU1ldGFkYXRhRmFjYWRlIHtcbiAgLy8gQWxsb3cgdGhlIGNvbXBpbGF0aW9uIG9mIGEgY2xhc3Mgd2l0aCBhIGBASW5qZWN0YWJsZSgpYCBkZWNvcmF0b3Igd2l0aG91dCBwYXJhbWV0ZXJzXG4gIGNvbnN0IG1ldGE6IEluamVjdGFibGUgPSBzcmNNZXRhIHx8IHtwcm92aWRlZEluOiBudWxsfTtcbiAgY29uc3QgY29tcGlsZXJNZXRhOiBSM0luamVjdGFibGVNZXRhZGF0YUZhY2FkZSA9IHtcbiAgICBuYW1lOiB0eXBlLm5hbWUsXG4gICAgdHlwZTogdHlwZSxcbiAgICB0eXBlQXJndW1lbnRDb3VudDogMCxcbiAgICBwcm92aWRlZEluOiBtZXRhLnByb3ZpZGVkSW4sXG4gICAgdXNlckRlcHM6IHVuZGVmaW5lZCxcbiAgfTtcbiAgaWYgKChpc1VzZUNsYXNzUHJvdmlkZXIobWV0YSkgfHwgaXNVc2VGYWN0b3J5UHJvdmlkZXIobWV0YSkpICYmIG1ldGEuZGVwcyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgY29tcGlsZXJNZXRhLnVzZXJEZXBzID0gY29udmVydERlcGVuZGVuY2llcyhtZXRhLmRlcHMpO1xuICB9XG4gIGlmIChpc1VzZUNsYXNzUHJvdmlkZXIobWV0YSkpIHtcbiAgICAvLyBUaGUgdXNlciBleHBsaWNpdGx5IHNwZWNpZmllZCB1c2VDbGFzcywgYW5kIG1heSBvciBtYXkgbm90IGhhdmUgcHJvdmlkZWQgZGVwcy5cbiAgICBjb21waWxlck1ldGEudXNlQ2xhc3MgPSByZXNvbHZlRm9yd2FyZFJlZihtZXRhLnVzZUNsYXNzKTtcbiAgfSBlbHNlIGlmIChpc1VzZVZhbHVlUHJvdmlkZXIobWV0YSkpIHtcbiAgICAvLyBUaGUgdXNlciBleHBsaWNpdGx5IHNwZWNpZmllZCB1c2VWYWx1ZS5cbiAgICBjb21waWxlck1ldGEudXNlVmFsdWUgPSByZXNvbHZlRm9yd2FyZFJlZihtZXRhLnVzZVZhbHVlKTtcbiAgfSBlbHNlIGlmIChpc1VzZUZhY3RvcnlQcm92aWRlcihtZXRhKSkge1xuICAgIC8vIFRoZSB1c2VyIGV4cGxpY2l0bHkgc3BlY2lmaWVkIHVzZUZhY3RvcnkuXG4gICAgY29tcGlsZXJNZXRhLnVzZUZhY3RvcnkgPSBtZXRhLnVzZUZhY3Rvcnk7XG4gIH0gZWxzZSBpZiAoaXNVc2VFeGlzdGluZ1Byb3ZpZGVyKG1ldGEpKSB7XG4gICAgLy8gVGhlIHVzZXIgZXhwbGljaXRseSBzcGVjaWZpZWQgdXNlRXhpc3RpbmcuXG4gICAgY29tcGlsZXJNZXRhLnVzZUV4aXN0aW5nID0gcmVzb2x2ZUZvcndhcmRSZWYobWV0YS51c2VFeGlzdGluZyk7XG4gIH1cbiAgcmV0dXJuIGNvbXBpbGVyTWV0YTtcbn1cbiJdfQ==