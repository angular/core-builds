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
 */
export function compileInjectable(type, srcMeta) {
    var ngInjectableDef = null;
    var ngFactoryDef = null;
    // if NG_INJECTABLE_DEF is already defined on this class then don't overwrite it
    if (!type.hasOwnProperty(NG_INJECTABLE_DEF)) {
        Object.defineProperty(type, NG_INJECTABLE_DEF, {
            get: function () {
                if (ngInjectableDef === null) {
                    ngInjectableDef = getCompilerFacade().compileInjectable(angularCoreDiEnv, "ng:///" + type.name + "/ngInjectableDef.js", getInjectableMetadata(type, srcMeta));
                }
                return ngInjectableDef;
            },
        });
    }
    // if NG_FACTORY_DEF is already defined on this class then don't overwrite it
    if (!type.hasOwnProperty(NG_FACTORY_DEF)) {
        Object.defineProperty(type, NG_FACTORY_DEF, {
            get: function () {
                if (ngFactoryDef === null) {
                    var metadata = getInjectableMetadata(type, srcMeta);
                    ngFactoryDef =
                        getCompilerFacade().compileFactory(angularCoreDiEnv, "ng:///" + type.name + "/\u0275fac.js", {
                            name: metadata.name,
                            type: metadata.type,
                            typeArgumentCount: metadata.typeArgumentCount,
                            deps: reflectDependencies(type),
                            injectFn: 'inject',
                            isPipe: false
                        });
                }
                return ngFactoryDef;
            },
            // Leave this configurable so that the factories from directives or pipes can take precedence.
            configurable: true
        });
    }
}
var ɵ0 = getClosureSafeProperty;
var USE_VALUE = getClosureSafeProperty({ provide: String, useValue: ɵ0 });
function isUseClassProvider(meta) {
    return meta.useClass !== undefined;
}
function isUseValueProvider(meta) {
    return USE_VALUE in meta;
}
function isUseFactoryProvider(meta) {
    return meta.useFactory !== undefined;
}
function isUseExistingProvider(meta) {
    return meta.useExisting !== undefined;
}
function getInjectableMetadata(type, srcMeta) {
    // Allow the compilation of a class with a `@Injectable()` decorator without parameters
    var meta = srcMeta || { providedIn: null };
    var compilerMeta = {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5qZWN0YWJsZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL2RpL2ppdC9pbmplY3RhYmxlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBNkIsaUJBQWlCLEVBQUMsTUFBTSxnQ0FBZ0MsQ0FBQztBQUU3RixPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0sc0JBQXNCLENBQUM7QUFDcEQsT0FBTyxFQUFDLHNCQUFzQixFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFDM0QsT0FBTyxFQUFDLGlCQUFpQixFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFFakQsT0FBTyxFQUFDLGlCQUFpQixFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFHcEQsT0FBTyxFQUFDLGdCQUFnQixFQUFDLE1BQU0sZUFBZSxDQUFDO0FBQy9DLE9BQU8sRUFBQyxtQkFBbUIsRUFBRSxtQkFBbUIsRUFBQyxNQUFNLFFBQVEsQ0FBQztBQUloRTs7O0dBR0c7QUFDSCxNQUFNLFVBQVUsaUJBQWlCLENBQUMsSUFBZSxFQUFFLE9BQW9CO0lBQ3JFLElBQUksZUFBZSxHQUFRLElBQUksQ0FBQztJQUNoQyxJQUFJLFlBQVksR0FBUSxJQUFJLENBQUM7SUFFN0IsZ0ZBQWdGO0lBQ2hGLElBQUksQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLGlCQUFpQixDQUFDLEVBQUU7UUFDM0MsTUFBTSxDQUFDLGNBQWMsQ0FBQyxJQUFJLEVBQUUsaUJBQWlCLEVBQUU7WUFDN0MsR0FBRyxFQUFFO2dCQUNILElBQUksZUFBZSxLQUFLLElBQUksRUFBRTtvQkFDNUIsZUFBZSxHQUFHLGlCQUFpQixFQUFFLENBQUMsaUJBQWlCLENBQ25ELGdCQUFnQixFQUFFLFdBQVMsSUFBSSxDQUFDLElBQUksd0JBQXFCLEVBQ3pELHFCQUFxQixDQUFDLElBQUksRUFBRSxPQUFPLENBQUMs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QUU7UUFDckMsNENBQTRDO1FBQzVDLFlBQVksQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQztLQUMzQztTQUFNLElBQUkscUJBQXFCLENBQUMsSUFBSSxDQUFDLEVBQUU7UUFDdEMsNkNBQTZDO1FBQzdDLFlBQVksQ0FBQyxXQUFXLEdBQUcsaUJBQWlCLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDO0tBQ2hFO0lBQ0QsT0FBTyxZQUFZLENBQUM7QUFDdEIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtSM0luamVjdGFibGVNZXRhZGF0YUZhY2FkZSwgZ2V0Q29tcGlsZXJGYWNhZGV9IGZyb20gJy4uLy4uL2NvbXBpbGVyL2NvbXBpbGVyX2ZhY2FkZSc7XG5pbXBvcnQge1R5cGV9IGZyb20gJy4uLy4uL2ludGVyZmFjZS90eXBlJztcbmltcG9ydCB7TkdfRkFDVE9SWV9ERUZ9IGZyb20gJy4uLy4uL3JlbmRlcjMvZmllbGRzJztcbmltcG9ydCB7Z2V0Q2xvc3VyZVNhZmVQcm9wZXJ0eX0gZnJvbSAnLi4vLi4vdXRpbC9wcm9wZXJ0eSc7XG5pbXBvcnQge3Jlc29sdmVGb3J3YXJkUmVmfSBmcm9tICcuLi9mb3J3YXJkX3JlZic7XG5pbXBvcnQge0luamVjdGFibGV9IGZyb20gJy4uL2luamVjdGFibGUnO1xuaW1wb3J0IHtOR19JTkpFQ1RBQkxFX0RFRn0gZnJvbSAnLi4vaW50ZXJmYWNlL2RlZnMnO1xuaW1wb3J0IHtDbGFzc1NhbnNQcm92aWRlciwgRXhpc3RpbmdTYW5zUHJvdmlkZXIsIEZhY3RvcnlTYW5zUHJvdmlkZXIsIFZhbHVlUHJvdmlkZXIsIFZhbHVlU2Fuc1Byb3ZpZGVyfSBmcm9tICcuLi9pbnRlcmZhY2UvcHJvdmlkZXInO1xuXG5pbXBvcnQge2FuZ3VsYXJDb3JlRGlFbnZ9IGZyb20gJy4vZW52aXJvbm1lbnQnO1xuaW1wb3J0IHtjb252ZXJ0RGVwZW5kZW5jaWVzLCByZWZsZWN0RGVwZW5kZW5jaWVzfSBmcm9tICcuL3V0aWwnO1xuXG5cblxuLyoqXG4gKiBDb21waWxlIGFuIEFuZ3VsYXIgaW5qZWN0YWJsZSBhY2NvcmRpbmcgdG8gaXRzIGBJbmplY3RhYmxlYCBtZXRhZGF0YSwgYW5kIHBhdGNoIHRoZSByZXN1bHRpbmdcbiAqIGBuZ0luamVjdGFibGVEZWZgIG9udG8gdGhlIGluamVjdGFibGUgdHlwZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbXBpbGVJbmplY3RhYmxlKHR5cGU6IFR5cGU8YW55Piwgc3JjTWV0YT86IEluamVjdGFibGUpOiB2b2lkIHtcbiAgbGV0IG5nSW5qZWN0YWJsZURlZjogYW55ID0gbnVsbDtcbiAgbGV0IG5nRmFjdG9yeURlZjogYW55ID0gbnVsbDtcblxuICAvLyBpZiBOR19JTkpFQ1RBQkxFX0RFRiBpcyBhbHJlYWR5IGRlZmluZWQgb24gdGhpcyBjbGFzcyB0aGVuIGRvbid0IG92ZXJ3cml0ZSBpdFxuICBpZiAoIXR5cGUuaGFzT3duUHJvcGVydHkoTkdfSU5KRUNUQUJMRV9ERUYpKSB7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHR5cGUsIE5HX0lOSkVDVEFCTEVfREVGLCB7XG4gICAgICBnZXQ6ICgpID0+IHtcbiAgICAgICAgaWYgKG5nSW5qZWN0YWJsZURlZiA9PT0gbnVsbCkge1xuICAgICAgICAgIG5nSW5qZWN0YWJsZURlZiA9IGdldENvbXBpbGVyRmFjYWRlKCkuY29tcGlsZUluamVjdGFibGUoXG4gICAgICAgICAgICAgIGFuZ3VsYXJDb3JlRGlFbnYsIGBuZzovLy8ke3R5cGUubmFtZX0vbmdJbmplY3RhYmxlRGVmLmpzYCxcbiAgICAgICAgICAgICAgZ2V0SW5qZWN0YWJsZU1ldGFkYXRhKHR5cGUsIHNyY01ldGEpKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbmdJbmplY3RhYmxlRGVmO1xuICAgICAgfSxcbiAgICB9KTtcbiAgfVxuXG4gIC8vIGlmIE5HX0ZBQ1RPUllfREVGIGlzIGFscmVhZHkgZGVmaW5lZCBvbiB0aGlzIGNsYXNzIHRoZW4gZG9uJ3Qgb3ZlcndyaXRlIGl0XG4gIGlmICghdHlwZS5oYXNPd25Qcm9wZXJ0eShOR19GQUNUT1JZX0RFRikpIHtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodHlwZSwgTkdfRkFDVE9SWV9ERUYsIHtcbiAgICAgIGdldDogKCkgPT4ge1xuICAgICAgICBpZiAobmdGYWN0b3J5RGVmID09PSBudWxsKSB7XG4gICAgICAgICAgY29uc3QgbWV0YWRhdGEgPSBnZXRJbmplY3RhYmxlTWV0YWRhdGEodHlwZSwgc3JjTWV0YSk7XG4gICAgICAgICAgbmdGYWN0b3J5RGVmID1cbiAgICAgICAgICAgICAgZ2V0Q29tcGlsZXJGYWNhZGUoKS5jb21waWxlRmFjdG9yeShhbmd1bGFyQ29yZURpRW52LCBgbmc6Ly8vJHt0eXBlLm5hbWV9L8m1ZmFjLmpzYCwge1xuICAgICAgICAgICAgICAgIG5hbWU6IG1ldGFkYXRhLm5hbWUsXG4gICAgICAgICAgICAgICAgdHlwZTogbWV0YWRhdGEudHlwZSxcbiAgICAgICAgICAgICAgICB0eXBlQXJndW1lbnRDb3VudDogbWV0YWRhdGEudHlwZUFyZ3VtZW50Q291bnQsXG4gICAgICAgICAgICAgICAgZGVwczogcmVmbGVjdERlcGVuZGVuY2llcyh0eXBlKSxcbiAgICAgICAgICAgICAgICBpbmplY3RGbjogJ2luamVjdCcsXG4gICAgICAgICAgICAgICAgaXNQaXBlOiBmYWxzZVxuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbmdGYWN0b3J5RGVmO1xuICAgICAgfSxcbiAgICAgIC8vIExlYXZlIHRoaXMgY29uZmlndXJhYmxlIHNvIHRoYXQgdGhlIGZhY3RvcmllcyBmcm9tIGRpcmVjdGl2ZXMgb3IgcGlwZXMgY2FuIHRha2UgcHJlY2VkZW5jZS5cbiAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICB9XG59XG5cbnR5cGUgVXNlQ2xhc3NQcm92aWRlciA9IEluamVjdGFibGUgJiBDbGFzc1NhbnNQcm92aWRlciAmIHtkZXBzPzogYW55W119O1xuXG5jb25zdCBVU0VfVkFMVUUgPVxuICAgIGdldENsb3N1cmVTYWZlUHJvcGVydHk8VmFsdWVQcm92aWRlcj4oe3Byb3ZpZGU6IFN0cmluZywgdXNlVmFsdWU6IGdldENsb3N1cmVTYWZlUHJvcGVydHl9KTtcblxuZnVuY3Rpb24gaXNVc2VDbGFzc1Byb3ZpZGVyKG1ldGE6IEluamVjdGFibGUpOiBtZXRhIGlzIFVzZUNsYXNzUHJvdmlkZXIge1xuICByZXR1cm4gKG1ldGEgYXMgVXNlQ2xhc3NQcm92aWRlcikudXNlQ2xhc3MgIT09IHVuZGVmaW5lZDtcbn1cblxuZnVuY3Rpb24gaXNVc2VWYWx1ZVByb3ZpZGVyKG1ldGE6IEluamVjdGFibGUpOiBtZXRhIGlzIEluamVjdGFibGUmVmFsdWVTYW5zUHJvdmlkZXIge1xuICByZXR1cm4gVVNFX1ZBTFVFIGluIG1ldGE7XG59XG5cbmZ1bmN0aW9uIGlzVXNlRmFjdG9yeVByb3ZpZGVyKG1ldGE6IEluamVjdGFibGUpOiBtZXRhIGlzIEluamVjdGFibGUmRmFjdG9yeVNhbnNQcm92aWRlciB7XG4gIHJldHVybiAobWV0YSBhcyBGYWN0b3J5U2Fuc1Byb3ZpZGVyKS51c2VGYWN0b3J5ICE9PSB1bmRlZmluZWQ7XG59XG5cbmZ1bmN0aW9uIGlzVXNlRXhpc3RpbmdQcm92aWRlcihtZXRhOiBJbmplY3RhYmxlKTogbWV0YSBpcyBJbmplY3RhYmxlJkV4aXN0aW5nU2Fuc1Byb3ZpZGVyIHtcbiAgcmV0dXJuIChtZXRhIGFzIEV4aXN0aW5nU2Fuc1Byb3ZpZGVyKS51c2VFeGlzdGluZyAhPT0gdW5kZWZpbmVkO1xufVxuXG5mdW5jdGlvbiBnZXRJbmplY3RhYmxlTWV0YWRhdGEodHlwZTogVHlwZTxhbnk+LCBzcmNNZXRhPzogSW5qZWN0YWJsZSk6IFIzSW5qZWN0YWJsZU1ldGFkYXRhRmFjYWRlIHtcbiAgLy8gQWxsb3cgdGhlIGNvbXBpbGF0aW9uIG9mIGEgY2xhc3Mgd2l0aCBhIGBASW5qZWN0YWJsZSgpYCBkZWNvcmF0b3Igd2l0aG91dCBwYXJhbWV0ZXJzXG4gIGNvbnN0IG1ldGE6IEluamVjdGFibGUgPSBzcmNNZXRhIHx8IHtwcm92aWRlZEluOiBudWxsfTtcbiAgY29uc3QgY29tcGlsZXJNZXRhOiBSM0luamVjdGFibGVNZXRhZGF0YUZhY2FkZSA9IHtcbiAgICBuYW1lOiB0eXBlLm5hbWUsXG4gICAgdHlwZTogdHlwZSxcbiAgICB0eXBlQXJndW1lbnRDb3VudDogMCxcbiAgICBwcm92aWRlZEluOiBtZXRhLnByb3ZpZGVkSW4sXG4gICAgdXNlckRlcHM6IHVuZGVmaW5lZCxcbiAgfTtcbiAgaWYgKChpc1VzZUNsYXNzUHJvdmlkZXIobWV0YSkgfHwgaXNVc2VGYWN0b3J5UHJvdmlkZXIobWV0YSkpICYmIG1ldGEuZGVwcyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgY29tcGlsZXJNZXRhLnVzZXJEZXBzID0gY29udmVydERlcGVuZGVuY2llcyhtZXRhLmRlcHMpO1xuICB9XG4gIGlmIChpc1VzZUNsYXNzUHJvdmlkZXIobWV0YSkpIHtcbiAgICAvLyBUaGUgdXNlciBleHBsaWNpdGx5IHNwZWNpZmllZCB1c2VDbGFzcywgYW5kIG1heSBvciBtYXkgbm90IGhhdmUgcHJvdmlkZWQgZGVwcy5cbiAgICBjb21waWxlck1ldGEudXNlQ2xhc3MgPSByZXNvbHZlRm9yd2FyZFJlZihtZXRhLnVzZUNsYXNzKTtcbiAgfSBlbHNlIGlmIChpc1VzZVZhbHVlUHJvdmlkZXIobWV0YSkpIHtcbiAgICAvLyBUaGUgdXNlciBleHBsaWNpdGx5IHNwZWNpZmllZCB1c2VWYWx1ZS5cbiAgICBjb21waWxlck1ldGEudXNlVmFsdWUgPSByZXNvbHZlRm9yd2FyZFJlZihtZXRhLnVzZVZhbHVlKTtcbiAgfSBlbHNlIGlmIChpc1VzZUZhY3RvcnlQcm92aWRlcihtZXRhKSkge1xuICAgIC8vIFRoZSB1c2VyIGV4cGxpY2l0bHkgc3BlY2lmaWVkIHVzZUZhY3RvcnkuXG4gICAgY29tcGlsZXJNZXRhLnVzZUZhY3RvcnkgPSBtZXRhLnVzZUZhY3Rvcnk7XG4gIH0gZWxzZSBpZiAoaXNVc2VFeGlzdGluZ1Byb3ZpZGVyKG1ldGEpKSB7XG4gICAgLy8gVGhlIHVzZXIgZXhwbGljaXRseSBzcGVjaWZpZWQgdXNlRXhpc3RpbmcuXG4gICAgY29tcGlsZXJNZXRhLnVzZUV4aXN0aW5nID0gcmVzb2x2ZUZvcndhcmRSZWYobWV0YS51c2VFeGlzdGluZyk7XG4gIH1cbiAgcmV0dXJuIGNvbXBpbGVyTWV0YTtcbn1cbiJdfQ==