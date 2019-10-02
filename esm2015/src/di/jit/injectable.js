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
import { NG_INJECTABLE_DEF } from '../interface/defs';
import { angularCoreDiEnv } from './environment';
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
    /** @nocollapse */ let ngInjectableDef = null;
    /** @type {?} */
    /** @nocollapse */ let ngFactoryDef = null;
    // if NG_INJECTABLE_DEF is already defined on this class then don't overwrite it
    if (!type.hasOwnProperty(NG_INJECTABLE_DEF)) {
        Object.defineProperty(type, NG_INJECTABLE_DEF, {
            get: (/**
             * @return {?}
             */
            () => {
                if (ngInjectableDef === null) {
                    ngInjectableDef = getCompilerFacade().compileInjectable(angularCoreDiEnv, `ng:///${type.name}/ngInjectableDef.js`, getInjectableMetadata(type, srcMeta));
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
                    ngFactoryDef = getCompilerFacade().compileFactory(angularCoreDiEnv, `ng:///${type.name}/ngFactoryDef.js`, {
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
/** @type {?} */
const USE_VALUE = getClosureSafeProperty({ provide: String, useValue: getClosureSafeProperty });
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5qZWN0YWJsZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL2RpL2ppdC9pbmplY3RhYmxlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBUUEsT0FBTyxFQUE2QixpQkFBaUIsRUFBQyxNQUFNLGdDQUFnQyxDQUFDO0FBRTdGLE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSxzQkFBc0IsQ0FBQztBQUNwRCxPQUFPLEVBQUMsc0JBQXNCLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUMzRCxPQUFPLEVBQUMsaUJBQWlCLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUVqRCxPQUFPLEVBQUMsaUJBQWlCLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUdwRCxPQUFPLEVBQUMsZ0JBQWdCLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFDL0MsT0FBTyxFQUFDLG1CQUFtQixFQUFFLG1CQUFtQixFQUFDLE1BQU0sUUFBUSxDQUFDOzs7Ozs7OztBQVFoRSxNQUFNLFVBQVUsaUJBQWlCLENBQUMsSUFBZSxFQUFFLE9BQW9COztRQUNqRSxlQUFlLEdBQVEsSUFBSTs7UUFDM0IsWUFBWSxHQUFRLElBQUk7SUFFNUIsZ0ZBQWdGO0lBQ2hGLElBQUksQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLGlCQUFpQixDQUFDLEVBQUU7UUFDM0MsTUFBTSxDQUFDLGNBQWMsQ0FBQyxJQUFJLEVBQUUsaUJBQWlCLEVBQUU7WUFDN0MsR0FBRzs7O1lBQUUsR0FBRyxFQUFFO2dCQUNSLElBQUksZUFBZSxLQUFLLElBQUksRUFBRTtvQkFDNUIsZUFBZSxHQUFHLGlCQUFpQixFQUFFLENBQUMsaUJBQWlCLENBQ25ELGdCQUFnQixFQUFFLFNBQVMsSUFBSSxDQUFDLElBQUkscUJBQXFCLEVBQ3pELHFCQUFxQixDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDO2lCQUMzQztnQkFDRCxP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QUMsSUFBSSxDQUFDLEVBQUU7UUFDckMsNENBQTRDO1FBQzVDLFlBQVksQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQztLQUMzQztTQUFNLElBQUkscUJBQXFCLENBQUMsSUFBSSxDQUFDLEVBQUU7UUFDdEMsNkNBQTZDO1FBQzdDLFlBQVksQ0FBQyxXQUFXLEdBQUcsaUJBQWlCLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDO0tBQ2hFO0lBQ0QsT0FBTyxZQUFZLENBQUM7QUFDdEIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtSM0luamVjdGFibGVNZXRhZGF0YUZhY2FkZSwgZ2V0Q29tcGlsZXJGYWNhZGV9IGZyb20gJy4uLy4uL2NvbXBpbGVyL2NvbXBpbGVyX2ZhY2FkZSc7XG5pbXBvcnQge1R5cGV9IGZyb20gJy4uLy4uL2ludGVyZmFjZS90eXBlJztcbmltcG9ydCB7TkdfRkFDVE9SWV9ERUZ9IGZyb20gJy4uLy4uL3JlbmRlcjMvZmllbGRzJztcbmltcG9ydCB7Z2V0Q2xvc3VyZVNhZmVQcm9wZXJ0eX0gZnJvbSAnLi4vLi4vdXRpbC9wcm9wZXJ0eSc7XG5pbXBvcnQge3Jlc29sdmVGb3J3YXJkUmVmfSBmcm9tICcuLi9mb3J3YXJkX3JlZic7XG5pbXBvcnQge0luamVjdGFibGV9IGZyb20gJy4uL2luamVjdGFibGUnO1xuaW1wb3J0IHtOR19JTkpFQ1RBQkxFX0RFRn0gZnJvbSAnLi4vaW50ZXJmYWNlL2RlZnMnO1xuaW1wb3J0IHtDbGFzc1NhbnNQcm92aWRlciwgRXhpc3RpbmdTYW5zUHJvdmlkZXIsIEZhY3RvcnlTYW5zUHJvdmlkZXIsIFZhbHVlUHJvdmlkZXIsIFZhbHVlU2Fuc1Byb3ZpZGVyfSBmcm9tICcuLi9pbnRlcmZhY2UvcHJvdmlkZXInO1xuXG5pbXBvcnQge2FuZ3VsYXJDb3JlRGlFbnZ9IGZyb20gJy4vZW52aXJvbm1lbnQnO1xuaW1wb3J0IHtjb252ZXJ0RGVwZW5kZW5jaWVzLCByZWZsZWN0RGVwZW5kZW5jaWVzfSBmcm9tICcuL3V0aWwnO1xuXG5cblxuLyoqXG4gKiBDb21waWxlIGFuIEFuZ3VsYXIgaW5qZWN0YWJsZSBhY2NvcmRpbmcgdG8gaXRzIGBJbmplY3RhYmxlYCBtZXRhZGF0YSwgYW5kIHBhdGNoIHRoZSByZXN1bHRpbmdcbiAqIGBuZ0luamVjdGFibGVEZWZgIG9udG8gdGhlIGluamVjdGFibGUgdHlwZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbXBpbGVJbmplY3RhYmxlKHR5cGU6IFR5cGU8YW55Piwgc3JjTWV0YT86IEluamVjdGFibGUpOiB2b2lkIHtcbiAgbGV0IG5nSW5qZWN0YWJsZURlZjogYW55ID0gbnVsbDtcbiAgbGV0IG5nRmFjdG9yeURlZjogYW55ID0gbnVsbDtcblxuICAvLyBpZiBOR19JTkpFQ1RBQkxFX0RFRiBpcyBhbHJlYWR5IGRlZmluZWQgb24gdGhpcyBjbGFzcyB0aGVuIGRvbid0IG92ZXJ3cml0ZSBpdFxuICBpZiAoIXR5cGUuaGFzT3duUHJvcGVydHkoTkdfSU5KRUNUQUJMRV9ERUYpKSB7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHR5cGUsIE5HX0lOSkVDVEFCTEVfREVGLCB7XG4gICAgICBnZXQ6ICgpID0+IHtcbiAgICAgICAgaWYgKG5nSW5qZWN0YWJsZURlZiA9PT0gbnVsbCkge1xuICAgICAgICAgIG5nSW5qZWN0YWJsZURlZiA9IGdldENvbXBpbGVyRmFjYWRlKCkuY29tcGlsZUluamVjdGFibGUoXG4gICAgICAgICAgICAgIGFuZ3VsYXJDb3JlRGlFbnYsIGBuZzovLy8ke3R5cGUubmFtZX0vbmdJbmplY3RhYmxlRGVmLmpzYCxcbiAgICAgICAgICAgICAgZ2V0SW5qZWN0YWJsZU1ldGFkYXRhKHR5cGUsIHNyY01ldGEpKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbmdJbmplY3RhYmxlRGVmO1xuICAgICAgfSxcbiAgICB9KTtcbiAgfVxuXG4gIC8vIGlmIE5HX0ZBQ1RPUllfREVGIGlzIGFscmVhZHkgZGVmaW5lZCBvbiB0aGlzIGNsYXNzIHRoZW4gZG9uJ3Qgb3ZlcndyaXRlIGl0XG4gIGlmICghdHlwZS5oYXNPd25Qcm9wZXJ0eShOR19GQUNUT1JZX0RFRikpIHtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodHlwZSwgTkdfRkFDVE9SWV9ERUYsIHtcbiAgICAgIGdldDogKCkgPT4ge1xuICAgICAgICBpZiAobmdGYWN0b3J5RGVmID09PSBudWxsKSB7XG4gICAgICAgICAgY29uc3QgbWV0YWRhdGEgPSBnZXRJbmplY3RhYmxlTWV0YWRhdGEodHlwZSwgc3JjTWV0YSk7XG4gICAgICAgICAgbmdGYWN0b3J5RGVmID0gZ2V0Q29tcGlsZXJGYWNhZGUoKS5jb21waWxlRmFjdG9yeShcbiAgICAgICAgICAgICAgYW5ndWxhckNvcmVEaUVudiwgYG5nOi8vLyR7dHlwZS5uYW1lfS9uZ0ZhY3RvcnlEZWYuanNgLCB7XG4gICAgICAgICAgICAgICAgbmFtZTogbWV0YWRhdGEubmFtZSxcbiAgICAgICAgICAgICAgICB0eXBlOiBtZXRhZGF0YS50eXBlLFxuICAgICAgICAgICAgICAgIHR5cGVBcmd1bWVudENvdW50OiBtZXRhZGF0YS50eXBlQXJndW1lbnRDb3VudCxcbiAgICAgICAgICAgICAgICBkZXBzOiByZWZsZWN0RGVwZW5kZW5jaWVzKHR5cGUpLFxuICAgICAgICAgICAgICAgIGluamVjdEZuOiAnaW5qZWN0JyxcbiAgICAgICAgICAgICAgICBpc1BpcGU6IGZhbHNlXG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBuZ0ZhY3RvcnlEZWY7XG4gICAgICB9LFxuICAgICAgLy8gTGVhdmUgdGhpcyBjb25maWd1cmFibGUgc28gdGhhdCB0aGUgZmFjdG9yaWVzIGZyb20gZGlyZWN0aXZlcyBvciBwaXBlcyBjYW4gdGFrZSBwcmVjZWRlbmNlLlxuICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gIH1cbn1cblxudHlwZSBVc2VDbGFzc1Byb3ZpZGVyID0gSW5qZWN0YWJsZSAmIENsYXNzU2Fuc1Byb3ZpZGVyICYge2RlcHM/OiBhbnlbXX07XG5cbmNvbnN0IFVTRV9WQUxVRSA9XG4gICAgZ2V0Q2xvc3VyZVNhZmVQcm9wZXJ0eTxWYWx1ZVByb3ZpZGVyPih7cHJvdmlkZTogU3RyaW5nLCB1c2VWYWx1ZTogZ2V0Q2xvc3VyZVNhZmVQcm9wZXJ0eX0pO1xuXG5mdW5jdGlvbiBpc1VzZUNsYXNzUHJvdmlkZXIobWV0YTogSW5qZWN0YWJsZSk6IG1ldGEgaXMgVXNlQ2xhc3NQcm92aWRlciB7XG4gIHJldHVybiAobWV0YSBhcyBVc2VDbGFzc1Byb3ZpZGVyKS51c2VDbGFzcyAhPT0gdW5kZWZpbmVkO1xufVxuXG5mdW5jdGlvbiBpc1VzZVZhbHVlUHJvdmlkZXIobWV0YTogSW5qZWN0YWJsZSk6IG1ldGEgaXMgSW5qZWN0YWJsZSZWYWx1ZVNhbnNQcm92aWRlciB7XG4gIHJldHVybiBVU0VfVkFMVUUgaW4gbWV0YTtcbn1cblxuZnVuY3Rpb24gaXNVc2VGYWN0b3J5UHJvdmlkZXIobWV0YTogSW5qZWN0YWJsZSk6IG1ldGEgaXMgSW5qZWN0YWJsZSZGYWN0b3J5U2Fuc1Byb3ZpZGVyIHtcbiAgcmV0dXJuIChtZXRhIGFzIEZhY3RvcnlTYW5zUHJvdmlkZXIpLnVzZUZhY3RvcnkgIT09IHVuZGVmaW5lZDtcbn1cblxuZnVuY3Rpb24gaXNVc2VFeGlzdGluZ1Byb3ZpZGVyKG1ldGE6IEluamVjdGFibGUpOiBtZXRhIGlzIEluamVjdGFibGUmRXhpc3RpbmdTYW5zUHJvdmlkZXIge1xuICByZXR1cm4gKG1ldGEgYXMgRXhpc3RpbmdTYW5zUHJvdmlkZXIpLnVzZUV4aXN0aW5nICE9PSB1bmRlZmluZWQ7XG59XG5cbmZ1bmN0aW9uIGdldEluamVjdGFibGVNZXRhZGF0YSh0eXBlOiBUeXBlPGFueT4sIHNyY01ldGE/OiBJbmplY3RhYmxlKTogUjNJbmplY3RhYmxlTWV0YWRhdGFGYWNhZGUge1xuICAvLyBBbGxvdyB0aGUgY29tcGlsYXRpb24gb2YgYSBjbGFzcyB3aXRoIGEgYEBJbmplY3RhYmxlKClgIGRlY29yYXRvciB3aXRob3V0IHBhcmFtZXRlcnNcbiAgY29uc3QgbWV0YTogSW5qZWN0YWJsZSA9IHNyY01ldGEgfHwge3Byb3ZpZGVkSW46IG51bGx9O1xuICBjb25zdCBjb21waWxlck1ldGE6IFIzSW5qZWN0YWJsZU1ldGFkYXRhRmFjYWRlID0ge1xuICAgIG5hbWU6IHR5cGUubmFtZSxcbiAgICB0eXBlOiB0eXBlLFxuICAgIHR5cGVBcmd1bWVudENvdW50OiAwLFxuICAgIHByb3ZpZGVkSW46IG1ldGEucHJvdmlkZWRJbixcbiAgICB1c2VyRGVwczogdW5kZWZpbmVkLFxuICB9O1xuICBpZiAoKGlzVXNlQ2xhc3NQcm92aWRlcihtZXRhKSB8fCBpc1VzZUZhY3RvcnlQcm92aWRlcihtZXRhKSkgJiYgbWV0YS5kZXBzICE9PSB1bmRlZmluZWQpIHtcbiAgICBjb21waWxlck1ldGEudXNlckRlcHMgPSBjb252ZXJ0RGVwZW5kZW5jaWVzKG1ldGEuZGVwcyk7XG4gIH1cbiAgaWYgKGlzVXNlQ2xhc3NQcm92aWRlcihtZXRhKSkge1xuICAgIC8vIFRoZSB1c2VyIGV4cGxpY2l0bHkgc3BlY2lmaWVkIHVzZUNsYXNzLCBhbmQgbWF5IG9yIG1heSBub3QgaGF2ZSBwcm92aWRlZCBkZXBzLlxuICAgIGNvbXBpbGVyTWV0YS51c2VDbGFzcyA9IHJlc29sdmVGb3J3YXJkUmVmKG1ldGEudXNlQ2xhc3MpO1xuICB9IGVsc2UgaWYgKGlzVXNlVmFsdWVQcm92aWRlcihtZXRhKSkge1xuICAgIC8vIFRoZSB1c2VyIGV4cGxpY2l0bHkgc3BlY2lmaWVkIHVzZVZhbHVlLlxuICAgIGNvbXBpbGVyTWV0YS51c2VWYWx1ZSA9IHJlc29sdmVGb3J3YXJkUmVmKG1ldGEudXNlVmFsdWUpO1xuICB9IGVsc2UgaWYgKGlzVXNlRmFjdG9yeVByb3ZpZGVyKG1ldGEpKSB7XG4gICAgLy8gVGhlIHVzZXIgZXhwbGljaXRseSBzcGVjaWZpZWQgdXNlRmFjdG9yeS5cbiAgICBjb21waWxlck1ldGEudXNlRmFjdG9yeSA9IG1ldGEudXNlRmFjdG9yeTtcbiAgfSBlbHNlIGlmIChpc1VzZUV4aXN0aW5nUHJvdmlkZXIobWV0YSkpIHtcbiAgICAvLyBUaGUgdXNlciBleHBsaWNpdGx5IHNwZWNpZmllZCB1c2VFeGlzdGluZy5cbiAgICBjb21waWxlck1ldGEudXNlRXhpc3RpbmcgPSByZXNvbHZlRm9yd2FyZFJlZihtZXRhLnVzZUV4aXN0aW5nKTtcbiAgfVxuICByZXR1cm4gY29tcGlsZXJNZXRhO1xufVxuIl19