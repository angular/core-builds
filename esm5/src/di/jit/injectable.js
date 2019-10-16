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
 */
export function compileInjectable(type, srcMeta) {
    var ngInjectableDef = null;
    var ngFactoryDef = null;
    // if NG_PROV_DEF is already defined on this class then don't overwrite it
    if (!type.hasOwnProperty(NG_PROV_DEF)) {
        Object.defineProperty(type, NG_PROV_DEF, {
            get: function () {
                if (ngInjectableDef === null) {
                    ngInjectableDef = getCompilerFacade().compileInjectable(angularCoreDiEnv, "ng:///" + type.name + "/\u0275prov.js", getInjectableMetadata(type, srcMeta));
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5qZWN0YWJsZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL2RpL2ppdC9pbmplY3RhYmxlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBNkIsaUJBQWlCLEVBQUMsTUFBTSxnQ0FBZ0MsQ0FBQztBQUU3RixPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0sc0JBQXNCLENBQUM7QUFDcEQsT0FBTyxFQUFDLHNCQUFzQixFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFDM0QsT0FBTyxFQUFDLGlCQUFpQixFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFFakQsT0FBTyxFQUFDLFdBQVcsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBRzlDLE9BQU8sRUFBQyxnQkFBZ0IsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUMvQyxPQUFPLEVBQUMsbUJBQW1CLEVBQUUsbUJBQW1CLEVBQUMsTUFBTSxRQUFRLENBQUM7QUFJaEU7OztHQUdHO0FBQ0gsTUFBTSxVQUFVLGlCQUFpQixDQUFDLElBQWUsRUFBRSxPQUFvQjtJQUNyRSxJQUFJLGVBQWUsR0FBUSxJQUFJLENBQUM7SUFDaEMsSUFBSSxZQUFZLEdBQVEsSUFBSSxDQUFDO0lBRTdCLDBFQUEwRTtJQUMxRSxJQUFJLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxXQUFXLENBQUMsRUFBRTtRQUNyQyxNQUFNLENBQUMsY0FBYyxDQUFDLElBQUksRUFBRSxXQUFXLEVBQUU7WUFDdkMsR0FBRyxFQUFFO2dCQUNILElBQUksZUFBZSxLQUFLLElBQUksRUFBRTtvQkFDNUIsZUFBZSxHQUFHLGlCQUFpQixFQUFFLENBQUMsaUJBQWlCLENBQ25ELGdCQUFnQixFQUFFLFdBQVMsSUFBSSxDQUFDLElBQUksbUJBQVcsRUFDL0MscUJBQXFCLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFDLENB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Qyw0Q0FBNEM7UUFDNUMsWUFBWSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDO0tBQzNDO1NBQU0sSUFBSSxxQkFBcUIsQ0FBQyxJQUFJLENBQUMsRUFBRTtRQUN0Qyw2Q0FBNkM7UUFDN0MsWUFBWSxDQUFDLFdBQVcsR0FBRyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUM7S0FDaEU7SUFDRCxPQUFPLFlBQVksQ0FBQztBQUN0QixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1IzSW5qZWN0YWJsZU1ldGFkYXRhRmFjYWRlLCBnZXRDb21waWxlckZhY2FkZX0gZnJvbSAnLi4vLi4vY29tcGlsZXIvY29tcGlsZXJfZmFjYWRlJztcbmltcG9ydCB7VHlwZX0gZnJvbSAnLi4vLi4vaW50ZXJmYWNlL3R5cGUnO1xuaW1wb3J0IHtOR19GQUNUT1JZX0RFRn0gZnJvbSAnLi4vLi4vcmVuZGVyMy9maWVsZHMnO1xuaW1wb3J0IHtnZXRDbG9zdXJlU2FmZVByb3BlcnR5fSBmcm9tICcuLi8uLi91dGlsL3Byb3BlcnR5JztcbmltcG9ydCB7cmVzb2x2ZUZvcndhcmRSZWZ9IGZyb20gJy4uL2ZvcndhcmRfcmVmJztcbmltcG9ydCB7SW5qZWN0YWJsZX0gZnJvbSAnLi4vaW5qZWN0YWJsZSc7XG5pbXBvcnQge05HX1BST1ZfREVGfSBmcm9tICcuLi9pbnRlcmZhY2UvZGVmcyc7XG5pbXBvcnQge0NsYXNzU2Fuc1Byb3ZpZGVyLCBFeGlzdGluZ1NhbnNQcm92aWRlciwgRmFjdG9yeVNhbnNQcm92aWRlciwgVmFsdWVQcm92aWRlciwgVmFsdWVTYW5zUHJvdmlkZXJ9IGZyb20gJy4uL2ludGVyZmFjZS9wcm92aWRlcic7XG5cbmltcG9ydCB7YW5ndWxhckNvcmVEaUVudn0gZnJvbSAnLi9lbnZpcm9ubWVudCc7XG5pbXBvcnQge2NvbnZlcnREZXBlbmRlbmNpZXMsIHJlZmxlY3REZXBlbmRlbmNpZXN9IGZyb20gJy4vdXRpbCc7XG5cblxuXG4vKipcbiAqIENvbXBpbGUgYW4gQW5ndWxhciBpbmplY3RhYmxlIGFjY29yZGluZyB0byBpdHMgYEluamVjdGFibGVgIG1ldGFkYXRhLCBhbmQgcGF0Y2ggdGhlIHJlc3VsdGluZ1xuICogaW5qZWN0YWJsZSBkZWYgKGDJtXByb3ZgKSBvbnRvIHRoZSBpbmplY3RhYmxlIHR5cGUuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb21waWxlSW5qZWN0YWJsZSh0eXBlOiBUeXBlPGFueT4sIHNyY01ldGE/OiBJbmplY3RhYmxlKTogdm9pZCB7XG4gIGxldCBuZ0luamVjdGFibGVEZWY6IGFueSA9IG51bGw7XG4gIGxldCBuZ0ZhY3RvcnlEZWY6IGFueSA9IG51bGw7XG5cbiAgLy8gaWYgTkdfUFJPVl9ERUYgaXMgYWxyZWFkeSBkZWZpbmVkIG9uIHRoaXMgY2xhc3MgdGhlbiBkb24ndCBvdmVyd3JpdGUgaXRcbiAgaWYgKCF0eXBlLmhhc093blByb3BlcnR5KE5HX1BST1ZfREVGKSkge1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0eXBlLCBOR19QUk9WX0RFRiwge1xuICAgICAgZ2V0OiAoKSA9PiB7XG4gICAgICAgIGlmIChuZ0luamVjdGFibGVEZWYgPT09IG51bGwpIHtcbiAgICAgICAgICBuZ0luamVjdGFibGVEZWYgPSBnZXRDb21waWxlckZhY2FkZSgpLmNvbXBpbGVJbmplY3RhYmxlKFxuICAgICAgICAgICAgICBhbmd1bGFyQ29yZURpRW52LCBgbmc6Ly8vJHt0eXBlLm5hbWV9L8m1cHJvdi5qc2AsXG4gICAgICAgICAgICAgIGdldEluamVjdGFibGVNZXRhZGF0YSh0eXBlLCBzcmNNZXRhKSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG5nSW5qZWN0YWJsZURlZjtcbiAgICAgIH0sXG4gICAgfSk7XG4gIH1cblxuICAvLyBpZiBOR19GQUNUT1JZX0RFRiBpcyBhbHJlYWR5IGRlZmluZWQgb24gdGhpcyBjbGFzcyB0aGVuIGRvbid0IG92ZXJ3cml0ZSBpdFxuICBpZiAoIXR5cGUuaGFzT3duUHJvcGVydHkoTkdfRkFDVE9SWV9ERUYpKSB7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHR5cGUsIE5HX0ZBQ1RPUllfREVGLCB7XG4gICAgICBnZXQ6ICgpID0+IHtcbiAgICAgICAgaWYgKG5nRmFjdG9yeURlZiA9PT0gbnVsbCkge1xuICAgICAgICAgIGNvbnN0IG1ldGFkYXRhID0gZ2V0SW5qZWN0YWJsZU1ldGFkYXRhKHR5cGUsIHNyY01ldGEpO1xuICAgICAgICAgIG5nRmFjdG9yeURlZiA9XG4gICAgICAgICAgICAgIGdldENvbXBpbGVyRmFjYWRlKCkuY29tcGlsZUZhY3RvcnkoYW5ndWxhckNvcmVEaUVudiwgYG5nOi8vLyR7dHlwZS5uYW1lfS/JtWZhYy5qc2AsIHtcbiAgICAgICAgICAgICAgICBuYW1lOiBtZXRhZGF0YS5uYW1lLFxuICAgICAgICAgICAgICAgIHR5cGU6IG1ldGFkYXRhLnR5cGUsXG4gICAgICAgICAgICAgICAgdHlwZUFyZ3VtZW50Q291bnQ6IG1ldGFkYXRhLnR5cGVBcmd1bWVudENvdW50LFxuICAgICAgICAgICAgICAgIGRlcHM6IHJlZmxlY3REZXBlbmRlbmNpZXModHlwZSksXG4gICAgICAgICAgICAgICAgaW5qZWN0Rm46ICdpbmplY3QnLFxuICAgICAgICAgICAgICAgIGlzUGlwZTogZmFsc2VcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG5nRmFjdG9yeURlZjtcbiAgICAgIH0sXG4gICAgICAvLyBMZWF2ZSB0aGlzIGNvbmZpZ3VyYWJsZSBzbyB0aGF0IHRoZSBmYWN0b3JpZXMgZnJvbSBkaXJlY3RpdmVzIG9yIHBpcGVzIGNhbiB0YWtlIHByZWNlZGVuY2UuXG4gICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgfVxufVxuXG50eXBlIFVzZUNsYXNzUHJvdmlkZXIgPSBJbmplY3RhYmxlICYgQ2xhc3NTYW5zUHJvdmlkZXIgJiB7ZGVwcz86IGFueVtdfTtcblxuY29uc3QgVVNFX1ZBTFVFID1cbiAgICBnZXRDbG9zdXJlU2FmZVByb3BlcnR5PFZhbHVlUHJvdmlkZXI+KHtwcm92aWRlOiBTdHJpbmcsIHVzZVZhbHVlOiBnZXRDbG9zdXJlU2FmZVByb3BlcnR5fSk7XG5cbmZ1bmN0aW9uIGlzVXNlQ2xhc3NQcm92aWRlcihtZXRhOiBJbmplY3RhYmxlKTogbWV0YSBpcyBVc2VDbGFzc1Byb3ZpZGVyIHtcbiAgcmV0dXJuIChtZXRhIGFzIFVzZUNsYXNzUHJvdmlkZXIpLnVzZUNsYXNzICE9PSB1bmRlZmluZWQ7XG59XG5cbmZ1bmN0aW9uIGlzVXNlVmFsdWVQcm92aWRlcihtZXRhOiBJbmplY3RhYmxlKTogbWV0YSBpcyBJbmplY3RhYmxlJlZhbHVlU2Fuc1Byb3ZpZGVyIHtcbiAgcmV0dXJuIFVTRV9WQUxVRSBpbiBtZXRhO1xufVxuXG5mdW5jdGlvbiBpc1VzZUZhY3RvcnlQcm92aWRlcihtZXRhOiBJbmplY3RhYmxlKTogbWV0YSBpcyBJbmplY3RhYmxlJkZhY3RvcnlTYW5zUHJvdmlkZXIge1xuICByZXR1cm4gKG1ldGEgYXMgRmFjdG9yeVNhbnNQcm92aWRlcikudXNlRmFjdG9yeSAhPT0gdW5kZWZpbmVkO1xufVxuXG5mdW5jdGlvbiBpc1VzZUV4aXN0aW5nUHJvdmlkZXIobWV0YTogSW5qZWN0YWJsZSk6IG1ldGEgaXMgSW5qZWN0YWJsZSZFeGlzdGluZ1NhbnNQcm92aWRlciB7XG4gIHJldHVybiAobWV0YSBhcyBFeGlzdGluZ1NhbnNQcm92aWRlcikudXNlRXhpc3RpbmcgIT09IHVuZGVmaW5lZDtcbn1cblxuZnVuY3Rpb24gZ2V0SW5qZWN0YWJsZU1ldGFkYXRhKHR5cGU6IFR5cGU8YW55Piwgc3JjTWV0YT86IEluamVjdGFibGUpOiBSM0luamVjdGFibGVNZXRhZGF0YUZhY2FkZSB7XG4gIC8vIEFsbG93IHRoZSBjb21waWxhdGlvbiBvZiBhIGNsYXNzIHdpdGggYSBgQEluamVjdGFibGUoKWAgZGVjb3JhdG9yIHdpdGhvdXQgcGFyYW1ldGVyc1xuICBjb25zdCBtZXRhOiBJbmplY3RhYmxlID0gc3JjTWV0YSB8fCB7cHJvdmlkZWRJbjogbnVsbH07XG4gIGNvbnN0IGNvbXBpbGVyTWV0YTogUjNJbmplY3RhYmxlTWV0YWRhdGFGYWNhZGUgPSB7XG4gICAgbmFtZTogdHlwZS5uYW1lLFxuICAgIHR5cGU6IHR5cGUsXG4gICAgdHlwZUFyZ3VtZW50Q291bnQ6IDAsXG4gICAgcHJvdmlkZWRJbjogbWV0YS5wcm92aWRlZEluLFxuICAgIHVzZXJEZXBzOiB1bmRlZmluZWQsXG4gIH07XG4gIGlmICgoaXNVc2VDbGFzc1Byb3ZpZGVyKG1ldGEpIHx8IGlzVXNlRmFjdG9yeVByb3ZpZGVyKG1ldGEpKSAmJiBtZXRhLmRlcHMgIT09IHVuZGVmaW5lZCkge1xuICAgIGNvbXBpbGVyTWV0YS51c2VyRGVwcyA9IGNvbnZlcnREZXBlbmRlbmNpZXMobWV0YS5kZXBzKTtcbiAgfVxuICBpZiAoaXNVc2VDbGFzc1Byb3ZpZGVyKG1ldGEpKSB7XG4gICAgLy8gVGhlIHVzZXIgZXhwbGljaXRseSBzcGVjaWZpZWQgdXNlQ2xhc3MsIGFuZCBtYXkgb3IgbWF5IG5vdCBoYXZlIHByb3ZpZGVkIGRlcHMuXG4gICAgY29tcGlsZXJNZXRhLnVzZUNsYXNzID0gcmVzb2x2ZUZvcndhcmRSZWYobWV0YS51c2VDbGFzcyk7XG4gIH0gZWxzZSBpZiAoaXNVc2VWYWx1ZVByb3ZpZGVyKG1ldGEpKSB7XG4gICAgLy8gVGhlIHVzZXIgZXhwbGljaXRseSBzcGVjaWZpZWQgdXNlVmFsdWUuXG4gICAgY29tcGlsZXJNZXRhLnVzZVZhbHVlID0gcmVzb2x2ZUZvcndhcmRSZWYobWV0YS51c2VWYWx1ZSk7XG4gIH0gZWxzZSBpZiAoaXNVc2VGYWN0b3J5UHJvdmlkZXIobWV0YSkpIHtcbiAgICAvLyBUaGUgdXNlciBleHBsaWNpdGx5IHNwZWNpZmllZCB1c2VGYWN0b3J5LlxuICAgIGNvbXBpbGVyTWV0YS51c2VGYWN0b3J5ID0gbWV0YS51c2VGYWN0b3J5O1xuICB9IGVsc2UgaWYgKGlzVXNlRXhpc3RpbmdQcm92aWRlcihtZXRhKSkge1xuICAgIC8vIFRoZSB1c2VyIGV4cGxpY2l0bHkgc3BlY2lmaWVkIHVzZUV4aXN0aW5nLlxuICAgIGNvbXBpbGVyTWV0YS51c2VFeGlzdGluZyA9IHJlc29sdmVGb3J3YXJkUmVmKG1ldGEudXNlRXhpc3RpbmcpO1xuICB9XG4gIHJldHVybiBjb21waWxlck1ldGE7XG59XG4iXX0=