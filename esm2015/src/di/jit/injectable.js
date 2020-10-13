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
import { NG_PROV_DEF } from '../interface/defs';
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5qZWN0YWJsZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL2RpL2ppdC9pbmplY3RhYmxlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBQyxpQkFBaUIsRUFBNkIsTUFBTSxnQ0FBZ0MsQ0FBQztBQUU3RixPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0sc0JBQXNCLENBQUM7QUFDcEQsT0FBTyxFQUFDLHNCQUFzQixFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFDM0QsT0FBTyxFQUFDLGlCQUFpQixFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFFakQsT0FBTyxFQUFDLFdBQVcsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBRzlDLE9BQU8sRUFBQyxnQkFBZ0IsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUMvQyxPQUFPLEVBQUMsbUJBQW1CLEVBQUUsbUJBQW1CLEVBQUMsTUFBTSxRQUFRLENBQUM7QUFJaEU7OztHQUdHO0FBQ0gsTUFBTSxVQUFVLGlCQUFpQixDQUFDLElBQWUsRUFBRSxPQUFvQjtJQUNyRSxJQUFJLGVBQWUsR0FBUSxJQUFJLENBQUM7SUFDaEMsSUFBSSxZQUFZLEdBQVEsSUFBSSxDQUFDO0lBRTdCLDBFQUEwRTtJQUMxRSxJQUFJLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxXQUFXLENBQUMsRUFBRTtRQUNyQyxNQUFNLENBQUMsY0FBYyxDQUFDLElBQUksRUFBRSxXQUFXLEVBQUU7WUFDdkMsR0FBRyxFQUFFLEdBQUcsRUFBRTtnQkFDUixJQUFJLGVBQWUsS0FBSyxJQUFJLEVBQUU7b0JBQzVCLGVBQWUsR0FBRyxpQkFBaUIsRUFBRSxDQUFDLGlCQUFpQixDQUNuRCxnQkFBZ0IsRUFBRSxTQUFTLElBQUksQ0FBQyxJQUFJLFdBQVcsRUFDL0MscUJBQXFCLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFDLENB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LENBQUM7S0FDMUQ7U0FBTSxJQUFJLG9CQUFvQixDQUFDLElBQUksQ0FBQyxFQUFFO1FBQ3JDLDRDQUE0QztRQUM1QyxZQUFZLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUM7S0FDM0M7U0FBTSxJQUFJLHFCQUFxQixDQUFDLElBQUksQ0FBQyxFQUFFO1FBQ3RDLDZDQUE2QztRQUM3QyxZQUFZLENBQUMsV0FBVyxHQUFHLGlCQUFpQixDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQztLQUNoRTtJQUNELE9BQU8sWUFBWSxDQUFDO0FBQ3RCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtnZXRDb21waWxlckZhY2FkZSwgUjNJbmplY3RhYmxlTWV0YWRhdGFGYWNhZGV9IGZyb20gJy4uLy4uL2NvbXBpbGVyL2NvbXBpbGVyX2ZhY2FkZSc7XG5pbXBvcnQge1R5cGV9IGZyb20gJy4uLy4uL2ludGVyZmFjZS90eXBlJztcbmltcG9ydCB7TkdfRkFDVE9SWV9ERUZ9IGZyb20gJy4uLy4uL3JlbmRlcjMvZmllbGRzJztcbmltcG9ydCB7Z2V0Q2xvc3VyZVNhZmVQcm9wZXJ0eX0gZnJvbSAnLi4vLi4vdXRpbC9wcm9wZXJ0eSc7XG5pbXBvcnQge3Jlc29sdmVGb3J3YXJkUmVmfSBmcm9tICcuLi9mb3J3YXJkX3JlZic7XG5pbXBvcnQge0luamVjdGFibGV9IGZyb20gJy4uL2luamVjdGFibGUnO1xuaW1wb3J0IHtOR19QUk9WX0RFRn0gZnJvbSAnLi4vaW50ZXJmYWNlL2RlZnMnO1xuaW1wb3J0IHtDbGFzc1NhbnNQcm92aWRlciwgRXhpc3RpbmdTYW5zUHJvdmlkZXIsIEZhY3RvcnlTYW5zUHJvdmlkZXIsIFZhbHVlUHJvdmlkZXIsIFZhbHVlU2Fuc1Byb3ZpZGVyfSBmcm9tICcuLi9pbnRlcmZhY2UvcHJvdmlkZXInO1xuXG5pbXBvcnQge2FuZ3VsYXJDb3JlRGlFbnZ9IGZyb20gJy4vZW52aXJvbm1lbnQnO1xuaW1wb3J0IHtjb252ZXJ0RGVwZW5kZW5jaWVzLCByZWZsZWN0RGVwZW5kZW5jaWVzfSBmcm9tICcuL3V0aWwnO1xuXG5cblxuLyoqXG4gKiBDb21waWxlIGFuIEFuZ3VsYXIgaW5qZWN0YWJsZSBhY2NvcmRpbmcgdG8gaXRzIGBJbmplY3RhYmxlYCBtZXRhZGF0YSwgYW5kIHBhdGNoIHRoZSByZXN1bHRpbmdcbiAqIGluamVjdGFibGUgZGVmIChgybVwcm92YCkgb250byB0aGUgaW5qZWN0YWJsZSB0eXBlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY29tcGlsZUluamVjdGFibGUodHlwZTogVHlwZTxhbnk+LCBzcmNNZXRhPzogSW5qZWN0YWJsZSk6IHZvaWQge1xuICBsZXQgbmdJbmplY3RhYmxlRGVmOiBhbnkgPSBudWxsO1xuICBsZXQgbmdGYWN0b3J5RGVmOiBhbnkgPSBudWxsO1xuXG4gIC8vIGlmIE5HX1BST1ZfREVGIGlzIGFscmVhZHkgZGVmaW5lZCBvbiB0aGlzIGNsYXNzIHRoZW4gZG9uJ3Qgb3ZlcndyaXRlIGl0XG4gIGlmICghdHlwZS5oYXNPd25Qcm9wZXJ0eShOR19QUk9WX0RFRikpIHtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodHlwZSwgTkdfUFJPVl9ERUYsIHtcbiAgICAgIGdldDogKCkgPT4ge1xuICAgICAgICBpZiAobmdJbmplY3RhYmxlRGVmID09PSBudWxsKSB7XG4gICAgICAgICAgbmdJbmplY3RhYmxlRGVmID0gZ2V0Q29tcGlsZXJGYWNhZGUoKS5jb21waWxlSW5qZWN0YWJsZShcbiAgICAgICAgICAgICAgYW5ndWxhckNvcmVEaUVudiwgYG5nOi8vLyR7dHlwZS5uYW1lfS/JtXByb3YuanNgLFxuICAgICAgICAgICAgICBnZXRJbmplY3RhYmxlTWV0YWRhdGEodHlwZSwgc3JjTWV0YSkpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBuZ0luamVjdGFibGVEZWY7XG4gICAgICB9LFxuICAgIH0pO1xuICB9XG5cbiAgLy8gaWYgTkdfRkFDVE9SWV9ERUYgaXMgYWxyZWFkeSBkZWZpbmVkIG9uIHRoaXMgY2xhc3MgdGhlbiBkb24ndCBvdmVyd3JpdGUgaXRcbiAgaWYgKCF0eXBlLmhhc093blByb3BlcnR5KE5HX0ZBQ1RPUllfREVGKSkge1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0eXBlLCBOR19GQUNUT1JZX0RFRiwge1xuICAgICAgZ2V0OiAoKSA9PiB7XG4gICAgICAgIGlmIChuZ0ZhY3RvcnlEZWYgPT09IG51bGwpIHtcbiAgICAgICAgICBjb25zdCBtZXRhZGF0YSA9IGdldEluamVjdGFibGVNZXRhZGF0YSh0eXBlLCBzcmNNZXRhKTtcbiAgICAgICAgICBjb25zdCBjb21waWxlciA9IGdldENvbXBpbGVyRmFjYWRlKCk7XG4gICAgICAgICAgbmdGYWN0b3J5RGVmID0gY29tcGlsZXIuY29tcGlsZUZhY3RvcnkoYW5ndWxhckNvcmVEaUVudiwgYG5nOi8vLyR7dHlwZS5uYW1lfS/JtWZhYy5qc2AsIHtcbiAgICAgICAgICAgIG5hbWU6IG1ldGFkYXRhLm5hbWUsXG4gICAgICAgICAgICB0eXBlOiBtZXRhZGF0YS50eXBlLFxuICAgICAgICAgICAgdHlwZUFyZ3VtZW50Q291bnQ6IG1ldGFkYXRhLnR5cGVBcmd1bWVudENvdW50LFxuICAgICAgICAgICAgZGVwczogcmVmbGVjdERlcGVuZGVuY2llcyh0eXBlKSxcbiAgICAgICAgICAgIGluamVjdEZuOiAnaW5qZWN0JyxcbiAgICAgICAgICAgIHRhcmdldDogY29tcGlsZXIuUjNGYWN0b3J5VGFyZ2V0LkluamVjdGFibGVcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbmdGYWN0b3J5RGVmO1xuICAgICAgfSxcbiAgICAgIC8vIExlYXZlIHRoaXMgY29uZmlndXJhYmxlIHNvIHRoYXQgdGhlIGZhY3RvcmllcyBmcm9tIGRpcmVjdGl2ZXMgb3IgcGlwZXMgY2FuIHRha2UgcHJlY2VkZW5jZS5cbiAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICB9XG59XG5cbnR5cGUgVXNlQ2xhc3NQcm92aWRlciA9IEluamVjdGFibGUmQ2xhc3NTYW5zUHJvdmlkZXIme2RlcHM/OiBhbnlbXX07XG5cbmNvbnN0IFVTRV9WQUxVRSA9XG4gICAgZ2V0Q2xvc3VyZVNhZmVQcm9wZXJ0eTxWYWx1ZVByb3ZpZGVyPih7cHJvdmlkZTogU3RyaW5nLCB1c2VWYWx1ZTogZ2V0Q2xvc3VyZVNhZmVQcm9wZXJ0eX0pO1xuXG5mdW5jdGlvbiBpc1VzZUNsYXNzUHJvdmlkZXIobWV0YTogSW5qZWN0YWJsZSk6IG1ldGEgaXMgVXNlQ2xhc3NQcm92aWRlciB7XG4gIHJldHVybiAobWV0YSBhcyBVc2VDbGFzc1Byb3ZpZGVyKS51c2VDbGFzcyAhPT0gdW5kZWZpbmVkO1xufVxuXG5mdW5jdGlvbiBpc1VzZVZhbHVlUHJvdmlkZXIobWV0YTogSW5qZWN0YWJsZSk6IG1ldGEgaXMgSW5qZWN0YWJsZSZWYWx1ZVNhbnNQcm92aWRlciB7XG4gIHJldHVybiBVU0VfVkFMVUUgaW4gbWV0YTtcbn1cblxuZnVuY3Rpb24gaXNVc2VGYWN0b3J5UHJvdmlkZXIobWV0YTogSW5qZWN0YWJsZSk6IG1ldGEgaXMgSW5qZWN0YWJsZSZGYWN0b3J5U2Fuc1Byb3ZpZGVyIHtcbiAgcmV0dXJuIChtZXRhIGFzIEZhY3RvcnlTYW5zUHJvdmlkZXIpLnVzZUZhY3RvcnkgIT09IHVuZGVmaW5lZDtcbn1cblxuZnVuY3Rpb24gaXNVc2VFeGlzdGluZ1Byb3ZpZGVyKG1ldGE6IEluamVjdGFibGUpOiBtZXRhIGlzIEluamVjdGFibGUmRXhpc3RpbmdTYW5zUHJvdmlkZXIge1xuICByZXR1cm4gKG1ldGEgYXMgRXhpc3RpbmdTYW5zUHJvdmlkZXIpLnVzZUV4aXN0aW5nICE9PSB1bmRlZmluZWQ7XG59XG5cbmZ1bmN0aW9uIGdldEluamVjdGFibGVNZXRhZGF0YSh0eXBlOiBUeXBlPGFueT4sIHNyY01ldGE/OiBJbmplY3RhYmxlKTogUjNJbmplY3RhYmxlTWV0YWRhdGFGYWNhZGUge1xuICAvLyBBbGxvdyB0aGUgY29tcGlsYXRpb24gb2YgYSBjbGFzcyB3aXRoIGEgYEBJbmplY3RhYmxlKClgIGRlY29yYXRvciB3aXRob3V0IHBhcmFtZXRlcnNcbiAgY29uc3QgbWV0YTogSW5qZWN0YWJsZSA9IHNyY01ldGEgfHwge3Byb3ZpZGVkSW46IG51bGx9O1xuICBjb25zdCBjb21waWxlck1ldGE6IFIzSW5qZWN0YWJsZU1ldGFkYXRhRmFjYWRlID0ge1xuICAgIG5hbWU6IHR5cGUubmFtZSxcbiAgICB0eXBlOiB0eXBlLFxuICAgIHR5cGVBcmd1bWVudENvdW50OiAwLFxuICAgIHByb3ZpZGVkSW46IG1ldGEucHJvdmlkZWRJbixcbiAgICB1c2VyRGVwczogdW5kZWZpbmVkLFxuICB9O1xuICBpZiAoKGlzVXNlQ2xhc3NQcm92aWRlcihtZXRhKSB8fCBpc1VzZUZhY3RvcnlQcm92aWRlcihtZXRhKSkgJiYgbWV0YS5kZXBzICE9PSB1bmRlZmluZWQpIHtcbiAgICBjb21waWxlck1ldGEudXNlckRlcHMgPSBjb252ZXJ0RGVwZW5kZW5jaWVzKG1ldGEuZGVwcyk7XG4gIH1cbiAgaWYgKGlzVXNlQ2xhc3NQcm92aWRlcihtZXRhKSkge1xuICAgIC8vIFRoZSB1c2VyIGV4cGxpY2l0bHkgc3BlY2lmaWVkIHVzZUNsYXNzLCBhbmQgbWF5IG9yIG1heSBub3QgaGF2ZSBwcm92aWRlZCBkZXBzLlxuICAgIGNvbXBpbGVyTWV0YS51c2VDbGFzcyA9IHJlc29sdmVGb3J3YXJkUmVmKG1ldGEudXNlQ2xhc3MpO1xuICB9IGVsc2UgaWYgKGlzVXNlVmFsdWVQcm92aWRlcihtZXRhKSkge1xuICAgIC8vIFRoZSB1c2VyIGV4cGxpY2l0bHkgc3BlY2lmaWVkIHVzZVZhbHVlLlxuICAgIGNvbXBpbGVyTWV0YS51c2VWYWx1ZSA9IHJlc29sdmVGb3J3YXJkUmVmKG1ldGEudXNlVmFsdWUpO1xuICB9IGVsc2UgaWYgKGlzVXNlRmFjdG9yeVByb3ZpZGVyKG1ldGEpKSB7XG4gICAgLy8gVGhlIHVzZXIgZXhwbGljaXRseSBzcGVjaWZpZWQgdXNlRmFjdG9yeS5cbiAgICBjb21waWxlck1ldGEudXNlRmFjdG9yeSA9IG1ldGEudXNlRmFjdG9yeTtcbiAgfSBlbHNlIGlmIChpc1VzZUV4aXN0aW5nUHJvdmlkZXIobWV0YSkpIHtcbiAgICAvLyBUaGUgdXNlciBleHBsaWNpdGx5IHNwZWNpZmllZCB1c2VFeGlzdGluZy5cbiAgICBjb21waWxlck1ldGEudXNlRXhpc3RpbmcgPSByZXNvbHZlRm9yd2FyZFJlZihtZXRhLnVzZUV4aXN0aW5nKTtcbiAgfVxuICByZXR1cm4gY29tcGlsZXJNZXRhO1xufVxuIl19