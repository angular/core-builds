/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { getCompilerFacade } from '../../compiler/compiler_facade';
import { NG_FACTORY_DEF } from '../../render3/fields';
import { getClosureSafeProperty } from '../../util/property';
import { resolveForwardRef } from '../forward_ref';
import { NG_PROV_DEF, NG_PROV_DEF_FALLBACK } from '../interface/defs';
import { angularCoreDiEnv } from './environment';
import { convertDependencies, reflectDependencies } from './util';
/**
 * Compile an Angular injectable according to its `Injectable` metadata, and patch the resulting
 * injectable def (`ɵprov`) onto the injectable type.
 */
export function compileInjectable(type, srcMeta) {
    let ngInjectableDef = null;
    let ngFactoryDef = null;
    // if NG_PROV_DEF is already defined on this class then don't overwrite it
    if (!type.hasOwnProperty(NG_PROV_DEF)) {
        Object.defineProperty(type, NG_PROV_DEF, {
            get: () => {
                if (ngInjectableDef === null) {
                    ngInjectableDef = getCompilerFacade().compileInjectable(angularCoreDiEnv, `ng:///${type.name}/ɵprov.js`, getInjectableMetadata(type, srcMeta));
                }
                return ngInjectableDef;
            },
        });
        // On IE10 properties defined via `defineProperty` won't be inherited by child classes,
        // which will break inheriting the injectable definition from a grandparent through an
        // undecorated parent class. We work around it by defining a method which should be used
        // as a fallback. This should only be a problem in JIT mode, because in AOT TypeScript
        // seems to have a workaround for static properties. When inheriting from an undecorated
        // parent is no longer supported (v11 or later), this can safely be removed.
        if (!type.hasOwnProperty(NG_PROV_DEF_FALLBACK)) {
            type[NG_PROV_DEF_FALLBACK] = () => type[NG_PROV_DEF];
        }
    }
    // if NG_FACTORY_DEF is already defined on this class then don't overwrite it
    if (!type.hasOwnProperty(NG_FACTORY_DEF)) {
        Object.defineProperty(type, NG_FACTORY_DEF, {
            get: () => {
                if (ngFactoryDef === null) {
                    const metadata = getInjectableMetadata(type, srcMeta);
                    const compiler = getCompilerFacade();
                    ngFactoryDef = compiler.compileFactory(angularCoreDiEnv, `ng:///${type.name}/ɵfac.js`, {
                        name: metadata.name,
                        type: metadata.type,
                        typeArgumentCount: metadata.typeArgumentCount,
                        deps: reflectDependencies(type),
                        injectFn: 'inject',
                        target: compiler.R3FactoryTarget.Injectable
                    });
                }
                return ngFactoryDef;
            },
            // Leave this configurable so that the factories from directives or pipes can take precedence.
            configurable: true
        });
    }
}
const USE_VALUE = getClosureSafeProperty({ provide: String, useValue: getClosureSafeProperty });
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
    const meta = srcMeta || { providedIn: null };
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5qZWN0YWJsZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL2RpL2ppdC9pbmplY3RhYmxlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBQyxpQkFBaUIsRUFBNkIsTUFBTSxnQ0FBZ0MsQ0FBQztBQUU3RixPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0sc0JBQXNCLENBQUM7QUFDcEQsT0FBTyxFQUFDLHNCQUFzQixFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFDM0QsT0FBTyxFQUFDLGlCQUFpQixFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFFakQsT0FBTyxFQUFDLFdBQVcsRUFBRSxvQkFBb0IsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBR3BFLE9BQU8sRUFBQyxnQkFBZ0IsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUMvQyxPQUFPLEVBQUMsbUJBQW1CLEVBQUUsbUJBQW1CLEVBQUMsTUFBTSxRQUFRLENBQUM7QUFJaEU7OztHQUdHO0FBQ0gsTUFBTSxVQUFVLGlCQUFpQixDQUFDLElBQWUsRUFBRSxPQUFvQjtJQUNyRSxJQUFJLGVBQWUsR0FBUSxJQUFJLENBQUM7SUFDaEMsSUFBSSxZQUFZLEdBQVEsSUFBSSxDQUFDO0lBRTdCLDBFQUEwRTtJQUMxRSxJQUFJLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxXQUFXLENBQUMsRUFBRTtRQUNyQyxNQUFNLENBQUMsY0FBYyxDQUFDLElBQUksRUFBRSxXQUFXLEVBQUU7WUFDdkMsR0FBRyxFQUFFLEdBQUcsRUFBRTtnQkFDUixJQUFJLGVBQWUsS0FBSyxJQUFJLEVBQUU7b0JBQzVCLGVBQWUsR0FBRyxpQkFBaUIsRUFBRSxDQUFDLGlCQUFpQixDQUNuRCxnQkFBZ0IsRUFBRSxTQUFTLElBQUksQ0FBQyxJQUFJLFdBQVcsRUFDL0MscUJBQXFCLENBQUMsSUFBSSxFQUFFLE9BQU8s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SUFBSSxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsRUFBRTtRQUM1QixpRkFBaUY7UUFDakYsWUFBWSxDQUFDLFFBQVEsR0FBRyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7S0FDMUQ7U0FBTSxJQUFJLGtCQUFrQixDQUFDLElBQUksQ0FBQyxFQUFFO1FBQ25DLDBDQUEwQztRQUMxQyxZQUFZLENBQUMsUUFBUSxHQUFHLGlCQUFpQixDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztLQUMxRDtTQUFNLElBQUksb0JBQW9CLENBQUMsSUFBSSxDQUFDLEVBQUU7UUFDckMsNENBQTRDO1FBQzVDLFlBQVksQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQztLQUMzQztTQUFNLElBQUkscUJBQXFCLENBQUMsSUFBSSxDQUFDLEVBQUU7UUFDdEMsNkNBQTZDO1FBQzdDLFlBQVksQ0FBQyxXQUFXLEdBQUcsaUJBQWlCLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDO0tBQ2hFO0lBQ0QsT0FBTyxZQUFZLENBQUM7QUFDdEIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge2dldENvbXBpbGVyRmFjYWRlLCBSM0luamVjdGFibGVNZXRhZGF0YUZhY2FkZX0gZnJvbSAnLi4vLi4vY29tcGlsZXIvY29tcGlsZXJfZmFjYWRlJztcbmltcG9ydCB7VHlwZX0gZnJvbSAnLi4vLi4vaW50ZXJmYWNlL3R5cGUnO1xuaW1wb3J0IHtOR19GQUNUT1JZX0RFRn0gZnJvbSAnLi4vLi4vcmVuZGVyMy9maWVsZHMnO1xuaW1wb3J0IHtnZXRDbG9zdXJlU2FmZVByb3BlcnR5fSBmcm9tICcuLi8uLi91dGlsL3Byb3BlcnR5JztcbmltcG9ydCB7cmVzb2x2ZUZvcndhcmRSZWZ9IGZyb20gJy4uL2ZvcndhcmRfcmVmJztcbmltcG9ydCB7SW5qZWN0YWJsZX0gZnJvbSAnLi4vaW5qZWN0YWJsZSc7XG5pbXBvcnQge05HX1BST1ZfREVGLCBOR19QUk9WX0RFRl9GQUxMQkFDS30gZnJvbSAnLi4vaW50ZXJmYWNlL2RlZnMnO1xuaW1wb3J0IHtDbGFzc1NhbnNQcm92aWRlciwgRXhpc3RpbmdTYW5zUHJvdmlkZXIsIEZhY3RvcnlTYW5zUHJvdmlkZXIsIFZhbHVlUHJvdmlkZXIsIFZhbHVlU2Fuc1Byb3ZpZGVyfSBmcm9tICcuLi9pbnRlcmZhY2UvcHJvdmlkZXInO1xuXG5pbXBvcnQge2FuZ3VsYXJDb3JlRGlFbnZ9IGZyb20gJy4vZW52aXJvbm1lbnQnO1xuaW1wb3J0IHtjb252ZXJ0RGVwZW5kZW5jaWVzLCByZWZsZWN0RGVwZW5kZW5jaWVzfSBmcm9tICcuL3V0aWwnO1xuXG5cblxuLyoqXG4gKiBDb21waWxlIGFuIEFuZ3VsYXIgaW5qZWN0YWJsZSBhY2NvcmRpbmcgdG8gaXRzIGBJbmplY3RhYmxlYCBtZXRhZGF0YSwgYW5kIHBhdGNoIHRoZSByZXN1bHRpbmdcbiAqIGluamVjdGFibGUgZGVmIChgybVwcm92YCkgb250byB0aGUgaW5qZWN0YWJsZSB0eXBlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY29tcGlsZUluamVjdGFibGUodHlwZTogVHlwZTxhbnk+LCBzcmNNZXRhPzogSW5qZWN0YWJsZSk6IHZvaWQge1xuICBsZXQgbmdJbmplY3RhYmxlRGVmOiBhbnkgPSBudWxsO1xuICBsZXQgbmdGYWN0b3J5RGVmOiBhbnkgPSBudWxsO1xuXG4gIC8vIGlmIE5HX1BST1ZfREVGIGlzIGFscmVhZHkgZGVmaW5lZCBvbiB0aGlzIGNsYXNzIHRoZW4gZG9uJ3Qgb3ZlcndyaXRlIGl0XG4gIGlmICghdHlwZS5oYXNPd25Qcm9wZXJ0eShOR19QUk9WX0RFRikpIHtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodHlwZSwgTkdfUFJPVl9ERUYsIHtcbiAgICAgIGdldDogKCkgPT4ge1xuICAgICAgICBpZiAobmdJbmplY3RhYmxlRGVmID09PSBudWxsKSB7XG4gICAgICAgICAgbmdJbmplY3RhYmxlRGVmID0gZ2V0Q29tcGlsZXJGYWNhZGUoKS5jb21waWxlSW5qZWN0YWJsZShcbiAgICAgICAgICAgICAgYW5ndWxhckNvcmVEaUVudiwgYG5nOi8vLyR7dHlwZS5uYW1lfS/JtXByb3YuanNgLFxuICAgICAgICAgICAgICBnZXRJbmplY3RhYmxlTWV0YWRhdGEodHlwZSwgc3JjTWV0YSkpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBuZ0luamVjdGFibGVEZWY7XG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgLy8gT24gSUUxMCBwcm9wZXJ0aWVzIGRlZmluZWQgdmlhIGBkZWZpbmVQcm9wZXJ0eWAgd29uJ3QgYmUgaW5oZXJpdGVkIGJ5IGNoaWxkIGNsYXNzZXMsXG4gICAgLy8gd2hpY2ggd2lsbCBicmVhayBpbmhlcml0aW5nIHRoZSBpbmplY3RhYmxlIGRlZmluaXRpb24gZnJvbSBhIGdyYW5kcGFyZW50IHRocm91Z2ggYW5cbiAgICAvLyB1bmRlY29yYXRlZCBwYXJlbnQgY2xhc3MuIFdlIHdvcmsgYXJvdW5kIGl0IGJ5IGRlZmluaW5nIGEgbWV0aG9kIHdoaWNoIHNob3VsZCBiZSB1c2VkXG4gICAgLy8gYXMgYSBmYWxsYmFjay4gVGhpcyBzaG91bGQgb25seSBiZSBhIHByb2JsZW0gaW4gSklUIG1vZGUsIGJlY2F1c2UgaW4gQU9UIFR5cGVTY3JpcHRcbiAgICAvLyBzZWVtcyB0byBoYXZlIGEgd29ya2Fyb3VuZCBmb3Igc3RhdGljIHByb3BlcnRpZXMuIFdoZW4gaW5oZXJpdGluZyBmcm9tIGFuIHVuZGVjb3JhdGVkXG4gICAgLy8gcGFyZW50IGlzIG5vIGxvbmdlciBzdXBwb3J0ZWQgKHYxMSBvciBsYXRlciksIHRoaXMgY2FuIHNhZmVseSBiZSByZW1vdmVkLlxuICAgIGlmICghdHlwZS5oYXNPd25Qcm9wZXJ0eShOR19QUk9WX0RFRl9GQUxMQkFDSykpIHtcbiAgICAgICh0eXBlIGFzIGFueSlbTkdfUFJPVl9ERUZfRkFMTEJBQ0tdID0gKCkgPT4gKHR5cGUgYXMgYW55KVtOR19QUk9WX0RFRl07XG4gICAgfVxuICB9XG5cbiAgLy8gaWYgTkdfRkFDVE9SWV9ERUYgaXMgYWxyZWFkeSBkZWZpbmVkIG9uIHRoaXMgY2xhc3MgdGhlbiBkb24ndCBvdmVyd3JpdGUgaXRcbiAgaWYgKCF0eXBlLmhhc093blByb3BlcnR5KE5HX0ZBQ1RPUllfREVGKSkge1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0eXBlLCBOR19GQUNUT1JZX0RFRiwge1xuICAgICAgZ2V0OiAoKSA9PiB7XG4gICAgICAgIGlmIChuZ0ZhY3RvcnlEZWYgPT09IG51bGwpIHtcbiAgICAgICAgICBjb25zdCBtZXRhZGF0YSA9IGdldEluamVjdGFibGVNZXRhZGF0YSh0eXBlLCBzcmNNZXRhKTtcbiAgICAgICAgICBjb25zdCBjb21waWxlciA9IGdldENvbXBpbGVyRmFjYWRlKCk7XG4gICAgICAgICAgbmdGYWN0b3J5RGVmID0gY29tcGlsZXIuY29tcGlsZUZhY3RvcnkoYW5ndWxhckNvcmVEaUVudiwgYG5nOi8vLyR7dHlwZS5uYW1lfS/JtWZhYy5qc2AsIHtcbiAgICAgICAgICAgIG5hbWU6IG1ldGFkYXRhLm5hbWUsXG4gICAgICAgICAgICB0eXBlOiBtZXRhZGF0YS50eXBlLFxuICAgICAgICAgICAgdHlwZUFyZ3VtZW50Q291bnQ6IG1ldGFkYXRhLnR5cGVBcmd1bWVudENvdW50LFxuICAgICAgICAgICAgZGVwczogcmVmbGVjdERlcGVuZGVuY2llcyh0eXBlKSxcbiAgICAgICAgICAgIGluamVjdEZuOiAnaW5qZWN0JyxcbiAgICAgICAgICAgIHRhcmdldDogY29tcGlsZXIuUjNGYWN0b3J5VGFyZ2V0LkluamVjdGFibGVcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbmdGYWN0b3J5RGVmO1xuICAgICAgfSxcbiAgICAgIC8vIExlYXZlIHRoaXMgY29uZmlndXJhYmxlIHNvIHRoYXQgdGhlIGZhY3RvcmllcyBmcm9tIGRpcmVjdGl2ZXMgb3IgcGlwZXMgY2FuIHRha2UgcHJlY2VkZW5jZS5cbiAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICB9XG59XG5cbnR5cGUgVXNlQ2xhc3NQcm92aWRlciA9IEluamVjdGFibGUmQ2xhc3NTYW5zUHJvdmlkZXIme2RlcHM/OiBhbnlbXX07XG5cbmNvbnN0IFVTRV9WQUxVRSA9XG4gICAgZ2V0Q2xvc3VyZVNhZmVQcm9wZXJ0eTxWYWx1ZVByb3ZpZGVyPih7cHJvdmlkZTogU3RyaW5nLCB1c2VWYWx1ZTogZ2V0Q2xvc3VyZVNhZmVQcm9wZXJ0eX0pO1xuXG5mdW5jdGlvbiBpc1VzZUNsYXNzUHJvdmlkZXIobWV0YTogSW5qZWN0YWJsZSk6IG1ldGEgaXMgVXNlQ2xhc3NQcm92aWRlciB7XG4gIHJldHVybiAobWV0YSBhcyBVc2VDbGFzc1Byb3ZpZGVyKS51c2VDbGFzcyAhPT0gdW5kZWZpbmVkO1xufVxuXG5mdW5jdGlvbiBpc1VzZVZhbHVlUHJvdmlkZXIobWV0YTogSW5qZWN0YWJsZSk6IG1ldGEgaXMgSW5qZWN0YWJsZSZWYWx1ZVNhbnNQcm92aWRlciB7XG4gIHJldHVybiBVU0VfVkFMVUUgaW4gbWV0YTtcbn1cblxuZnVuY3Rpb24gaXNVc2VGYWN0b3J5UHJvdmlkZXIobWV0YTogSW5qZWN0YWJsZSk6IG1ldGEgaXMgSW5qZWN0YWJsZSZGYWN0b3J5U2Fuc1Byb3ZpZGVyIHtcbiAgcmV0dXJuIChtZXRhIGFzIEZhY3RvcnlTYW5zUHJvdmlkZXIpLnVzZUZhY3RvcnkgIT09IHVuZGVmaW5lZDtcbn1cblxuZnVuY3Rpb24gaXNVc2VFeGlzdGluZ1Byb3ZpZGVyKG1ldGE6IEluamVjdGFibGUpOiBtZXRhIGlzIEluamVjdGFibGUmRXhpc3RpbmdTYW5zUHJvdmlkZXIge1xuICByZXR1cm4gKG1ldGEgYXMgRXhpc3RpbmdTYW5zUHJvdmlkZXIpLnVzZUV4aXN0aW5nICE9PSB1bmRlZmluZWQ7XG59XG5cbmZ1bmN0aW9uIGdldEluamVjdGFibGVNZXRhZGF0YSh0eXBlOiBUeXBlPGFueT4sIHNyY01ldGE/OiBJbmplY3RhYmxlKTogUjNJbmplY3RhYmxlTWV0YWRhdGFGYWNhZGUge1xuICAvLyBBbGxvdyB0aGUgY29tcGlsYXRpb24gb2YgYSBjbGFzcyB3aXRoIGEgYEBJbmplY3RhYmxlKClgIGRlY29yYXRvciB3aXRob3V0IHBhcmFtZXRlcnNcbiAgY29uc3QgbWV0YTogSW5qZWN0YWJsZSA9IHNyY01ldGEgfHwge3Byb3ZpZGVkSW46IG51bGx9O1xuICBjb25zdCBjb21waWxlck1ldGE6IFIzSW5qZWN0YWJsZU1ldGFkYXRhRmFjYWRlID0ge1xuICAgIG5hbWU6IHR5cGUubmFtZSxcbiAgICB0eXBlOiB0eXBlLFxuICAgIHR5cGVBcmd1bWVudENvdW50OiAwLFxuICAgIHByb3ZpZGVkSW46IG1ldGEucHJvdmlkZWRJbixcbiAgICB1c2VyRGVwczogdW5kZWZpbmVkLFxuICB9O1xuICBpZiAoKGlzVXNlQ2xhc3NQcm92aWRlcihtZXRhKSB8fCBpc1VzZUZhY3RvcnlQcm92aWRlcihtZXRhKSkgJiYgbWV0YS5kZXBzICE9PSB1bmRlZmluZWQpIHtcbiAgICBjb21waWxlck1ldGEudXNlckRlcHMgPSBjb252ZXJ0RGVwZW5kZW5jaWVzKG1ldGEuZGVwcyk7XG4gIH1cbiAgaWYgKGlzVXNlQ2xhc3NQcm92aWRlcihtZXRhKSkge1xuICAgIC8vIFRoZSB1c2VyIGV4cGxpY2l0bHkgc3BlY2lmaWVkIHVzZUNsYXNzLCBhbmQgbWF5IG9yIG1heSBub3QgaGF2ZSBwcm92aWRlZCBkZXBzLlxuICAgIGNvbXBpbGVyTWV0YS51c2VDbGFzcyA9IHJlc29sdmVGb3J3YXJkUmVmKG1ldGEudXNlQ2xhc3MpO1xuICB9IGVsc2UgaWYgKGlzVXNlVmFsdWVQcm92aWRlcihtZXRhKSkge1xuICAgIC8vIFRoZSB1c2VyIGV4cGxpY2l0bHkgc3BlY2lmaWVkIHVzZVZhbHVlLlxuICAgIGNvbXBpbGVyTWV0YS51c2VWYWx1ZSA9IHJlc29sdmVGb3J3YXJkUmVmKG1ldGEudXNlVmFsdWUpO1xuICB9IGVsc2UgaWYgKGlzVXNlRmFjdG9yeVByb3ZpZGVyKG1ldGEpKSB7XG4gICAgLy8gVGhlIHVzZXIgZXhwbGljaXRseSBzcGVjaWZpZWQgdXNlRmFjdG9yeS5cbiAgICBjb21waWxlck1ldGEudXNlRmFjdG9yeSA9IG1ldGEudXNlRmFjdG9yeTtcbiAgfSBlbHNlIGlmIChpc1VzZUV4aXN0aW5nUHJvdmlkZXIobWV0YSkpIHtcbiAgICAvLyBUaGUgdXNlciBleHBsaWNpdGx5IHNwZWNpZmllZCB1c2VFeGlzdGluZy5cbiAgICBjb21waWxlck1ldGEudXNlRXhpc3RpbmcgPSByZXNvbHZlRm9yd2FyZFJlZihtZXRhLnVzZUV4aXN0aW5nKTtcbiAgfVxuICByZXR1cm4gY29tcGlsZXJNZXRhO1xufVxuIl19