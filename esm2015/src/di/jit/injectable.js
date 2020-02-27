/**
 * @fileoverview added by tsickle
 * Generated from: packages/core/src/di/jit/injectable.ts
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
import { NG_PROV_DEF, NG_PROV_DEF_FALLBACK } from '../interface/defs';
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
        // On IE10 properties defined via `defineProperty` won't be inherited by child classes,
        // which will break inheriting the injectable definition from a grandparent through an
        // undecorated parent class. We work around it by defining a method which should be used
        // as a fallback. This should only be a problem in JIT mode, because in AOT TypeScript
        // seems to have a workaround for static properties. When inheriting from an undecorated
        // parent is no longer supported in v10, this can safely be removed.
        if (!type.hasOwnProperty(NG_PROV_DEF_FALLBACK)) {
            ((/** @type {?} */ (type)))[NG_PROV_DEF_FALLBACK] = (/**
             * @return {?}
             */
            () => ((/** @type {?} */ (type)))[NG_PROV_DEF]);
        }
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
                    /** @type {?} */
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5qZWN0YWJsZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL2RpL2ppdC9pbmplY3RhYmxlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQVFBLE9BQU8sRUFBNkIsaUJBQWlCLEVBQUMsTUFBTSxnQ0FBZ0MsQ0FBQztBQUU3RixPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0sc0JBQXNCLENBQUM7QUFDcEQsT0FBTyxFQUFDLHNCQUFzQixFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFDM0QsT0FBTyxFQUFDLGlCQUFpQixFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFFakQsT0FBTyxFQUFDLFdBQVcsRUFBRSxvQkFBb0IsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBR3BFLE9BQU8sRUFBQyxnQkFBZ0IsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUMvQyxPQUFPLEVBQUMsbUJBQW1CLEVBQUUsbUJBQW1CLEVBQUMsTUFBTSxRQUFRLENBQUM7Ozs7Ozs7O0FBUWhFLE1BQU0sVUFBVSxpQkFBaUIsQ0FBQyxJQUFlLEVBQUUsT0FBb0I7O1FBQ2pFLGVBQWUsR0FBUSxJQUFJOztRQUMzQixZQUFZLEdBQVEsSUFBSTtJQUU1QiwwRUFBMEU7SUFDMUUsSUFBSSxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsV0FBVyxDQUFDLEVBQUU7UUFDckMsTUFBTSxDQUFDLGNBQWMsQ0FBQyxJQUFJLEVBQUUsV0FBVyxFQUFFO1lBQ3ZDLEdBQUc7OztZQUFFLEdBQUcsRUFBRTtnQkFDUixJQUFJLGVBQWUsS0FBSyxJQUFJLEVBQUU7b0JBQzVCLGVBQWUsR0FBRyxpQkFBaUIsRUFBRSxDQUFDLGlCQUFpQixDQUNuRCxnQkFBZ0IsRUFBRSxTQUFTLElBQUksQ0FBQyxJQUFJLFdBQVcsRUFDL0MscUJBQXFCLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUM7aUJBQzNDO2dC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QUFHLG1CQUFtQixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztLQUN4RDtJQUNELElBQUksa0JBQWtCLENBQUMsSUFBSSxDQUFDLEVBQUU7UUFDNUIsaUZBQWlGO1FBQ2pGLFlBQVksQ0FBQyxRQUFRLEdBQUcsaUJBQWlCLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0tBQzFEO1NBQU0sSUFBSSxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsRUFBRTtRQUNuQywwQ0FBMEM7UUFDMUMsWUFBWSxDQUFDLFFBQVEsR0FBRyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7S0FDMUQ7U0FBTSxJQUFJLG9CQUFvQixDQUFDLElBQUksQ0FBQyxFQUFFO1FBQ3JDLDRDQUE0QztRQUM1QyxZQUFZLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUM7S0FDM0M7U0FBTSxJQUFJLHFCQUFxQixDQUFDLElBQUksQ0FBQyxFQUFFO1FBQ3RDLDZDQUE2QztRQUM3QyxZQUFZLENBQUMsV0FBVyxHQUFHLGlCQUFpQixDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQztLQUNoRTtJQUNELE9BQU8sWUFBWSxDQUFDO0FBQ3RCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7UjNJbmplY3RhYmxlTWV0YWRhdGFGYWNhZGUsIGdldENvbXBpbGVyRmFjYWRlfSBmcm9tICcuLi8uLi9jb21waWxlci9jb21waWxlcl9mYWNhZGUnO1xuaW1wb3J0IHtUeXBlfSBmcm9tICcuLi8uLi9pbnRlcmZhY2UvdHlwZSc7XG5pbXBvcnQge05HX0ZBQ1RPUllfREVGfSBmcm9tICcuLi8uLi9yZW5kZXIzL2ZpZWxkcyc7XG5pbXBvcnQge2dldENsb3N1cmVTYWZlUHJvcGVydHl9IGZyb20gJy4uLy4uL3V0aWwvcHJvcGVydHknO1xuaW1wb3J0IHtyZXNvbHZlRm9yd2FyZFJlZn0gZnJvbSAnLi4vZm9yd2FyZF9yZWYnO1xuaW1wb3J0IHtJbmplY3RhYmxlfSBmcm9tICcuLi9pbmplY3RhYmxlJztcbmltcG9ydCB7TkdfUFJPVl9ERUYsIE5HX1BST1ZfREVGX0ZBTExCQUNLfSBmcm9tICcuLi9pbnRlcmZhY2UvZGVmcyc7XG5pbXBvcnQge0NsYXNzU2Fuc1Byb3ZpZGVyLCBFeGlzdGluZ1NhbnNQcm92aWRlciwgRmFjdG9yeVNhbnNQcm92aWRlciwgVmFsdWVQcm92aWRlciwgVmFsdWVTYW5zUHJvdmlkZXJ9IGZyb20gJy4uL2ludGVyZmFjZS9wcm92aWRlcic7XG5cbmltcG9ydCB7YW5ndWxhckNvcmVEaUVudn0gZnJvbSAnLi9lbnZpcm9ubWVudCc7XG5pbXBvcnQge2NvbnZlcnREZXBlbmRlbmNpZXMsIHJlZmxlY3REZXBlbmRlbmNpZXN9IGZyb20gJy4vdXRpbCc7XG5cblxuXG4vKipcbiAqIENvbXBpbGUgYW4gQW5ndWxhciBpbmplY3RhYmxlIGFjY29yZGluZyB0byBpdHMgYEluamVjdGFibGVgIG1ldGFkYXRhLCBhbmQgcGF0Y2ggdGhlIHJlc3VsdGluZ1xuICogaW5qZWN0YWJsZSBkZWYgKGDJtXByb3ZgKSBvbnRvIHRoZSBpbmplY3RhYmxlIHR5cGUuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb21waWxlSW5qZWN0YWJsZSh0eXBlOiBUeXBlPGFueT4sIHNyY01ldGE/OiBJbmplY3RhYmxlKTogdm9pZCB7XG4gIGxldCBuZ0luamVjdGFibGVEZWY6IGFueSA9IG51bGw7XG4gIGxldCBuZ0ZhY3RvcnlEZWY6IGFueSA9IG51bGw7XG5cbiAgLy8gaWYgTkdfUFJPVl9ERUYgaXMgYWxyZWFkeSBkZWZpbmVkIG9uIHRoaXMgY2xhc3MgdGhlbiBkb24ndCBvdmVyd3JpdGUgaXRcbiAgaWYgKCF0eXBlLmhhc093blByb3BlcnR5KE5HX1BST1ZfREVGKSkge1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0eXBlLCBOR19QUk9WX0RFRiwge1xuICAgICAgZ2V0OiAoKSA9PiB7XG4gICAgICAgIGlmIChuZ0luamVjdGFibGVEZWYgPT09IG51bGwpIHtcbiAgICAgICAgICBuZ0luamVjdGFibGVEZWYgPSBnZXRDb21waWxlckZhY2FkZSgpLmNvbXBpbGVJbmplY3RhYmxlKFxuICAgICAgICAgICAgICBhbmd1bGFyQ29yZURpRW52LCBgbmc6Ly8vJHt0eXBlLm5hbWV9L8m1cHJvdi5qc2AsXG4gICAgICAgICAgICAgIGdldEluamVjdGFibGVNZXRhZGF0YSh0eXBlLCBzcmNNZXRhKSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG5nSW5qZWN0YWJsZURlZjtcbiAgICAgIH0sXG4gICAgfSk7XG5cbiAgICAvLyBPbiBJRTEwIHByb3BlcnRpZXMgZGVmaW5lZCB2aWEgYGRlZmluZVByb3BlcnR5YCB3b24ndCBiZSBpbmhlcml0ZWQgYnkgY2hpbGQgY2xhc3NlcyxcbiAgICAvLyB3aGljaCB3aWxsIGJyZWFrIGluaGVyaXRpbmcgdGhlIGluamVjdGFibGUgZGVmaW5pdGlvbiBmcm9tIGEgZ3JhbmRwYXJlbnQgdGhyb3VnaCBhblxuICAgIC8vIHVuZGVjb3JhdGVkIHBhcmVudCBjbGFzcy4gV2Ugd29yayBhcm91bmQgaXQgYnkgZGVmaW5pbmcgYSBtZXRob2Qgd2hpY2ggc2hvdWxkIGJlIHVzZWRcbiAgICAvLyBhcyBhIGZhbGxiYWNrLiBUaGlzIHNob3VsZCBvbmx5IGJlIGEgcHJvYmxlbSBpbiBKSVQgbW9kZSwgYmVjYXVzZSBpbiBBT1QgVHlwZVNjcmlwdFxuICAgIC8vIHNlZW1zIHRvIGhhdmUgYSB3b3JrYXJvdW5kIGZvciBzdGF0aWMgcHJvcGVydGllcy4gV2hlbiBpbmhlcml0aW5nIGZyb20gYW4gdW5kZWNvcmF0ZWRcbiAgICAvLyBwYXJlbnQgaXMgbm8gbG9uZ2VyIHN1cHBvcnRlZCBpbiB2MTAsIHRoaXMgY2FuIHNhZmVseSBiZSByZW1vdmVkLlxuICAgIGlmICghdHlwZS5oYXNPd25Qcm9wZXJ0eShOR19QUk9WX0RFRl9GQUxMQkFDSykpIHtcbiAgICAgICh0eXBlIGFzIGFueSlbTkdfUFJPVl9ERUZfRkFMTEJBQ0tdID0gKCkgPT4gKHR5cGUgYXMgYW55KVtOR19QUk9WX0RFRl07XG4gICAgfVxuICB9XG5cbiAgLy8gaWYgTkdfRkFDVE9SWV9ERUYgaXMgYWxyZWFkeSBkZWZpbmVkIG9uIHRoaXMgY2xhc3MgdGhlbiBkb24ndCBvdmVyd3JpdGUgaXRcbiAgaWYgKCF0eXBlLmhhc093blByb3BlcnR5KE5HX0ZBQ1RPUllfREVGKSkge1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0eXBlLCBOR19GQUNUT1JZX0RFRiwge1xuICAgICAgZ2V0OiAoKSA9PiB7XG4gICAgICAgIGlmIChuZ0ZhY3RvcnlEZWYgPT09IG51bGwpIHtcbiAgICAgICAgICBjb25zdCBtZXRhZGF0YSA9IGdldEluamVjdGFibGVNZXRhZGF0YSh0eXBlLCBzcmNNZXRhKTtcbiAgICAgICAgICBjb25zdCBjb21waWxlciA9IGdldENvbXBpbGVyRmFjYWRlKCk7XG4gICAgICAgICAgbmdGYWN0b3J5RGVmID0gY29tcGlsZXIuY29tcGlsZUZhY3RvcnkoYW5ndWxhckNvcmVEaUVudiwgYG5nOi8vLyR7dHlwZS5uYW1lfS/JtWZhYy5qc2AsIHtcbiAgICAgICAgICAgIG5hbWU6IG1ldGFkYXRhLm5hbWUsXG4gICAgICAgICAgICB0eXBlOiBtZXRhZGF0YS50eXBlLFxuICAgICAgICAgICAgdHlwZUFyZ3VtZW50Q291bnQ6IG1ldGFkYXRhLnR5cGVBcmd1bWVudENvdW50LFxuICAgICAgICAgICAgZGVwczogcmVmbGVjdERlcGVuZGVuY2llcyh0eXBlKSxcbiAgICAgICAgICAgIGluamVjdEZuOiAnaW5qZWN0JyxcbiAgICAgICAgICAgIHRhcmdldDogY29tcGlsZXIuUjNGYWN0b3J5VGFyZ2V0LkluamVjdGFibGVcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbmdGYWN0b3J5RGVmO1xuICAgICAgfSxcbiAgICAgIC8vIExlYXZlIHRoaXMgY29uZmlndXJhYmxlIHNvIHRoYXQgdGhlIGZhY3RvcmllcyBmcm9tIGRpcmVjdGl2ZXMgb3IgcGlwZXMgY2FuIHRha2UgcHJlY2VkZW5jZS5cbiAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICB9XG59XG5cbnR5cGUgVXNlQ2xhc3NQcm92aWRlciA9IEluamVjdGFibGUgJiBDbGFzc1NhbnNQcm92aWRlciAmIHtkZXBzPzogYW55W119O1xuXG5jb25zdCBVU0VfVkFMVUUgPVxuICAgIGdldENsb3N1cmVTYWZlUHJvcGVydHk8VmFsdWVQcm92aWRlcj4oe3Byb3ZpZGU6IFN0cmluZywgdXNlVmFsdWU6IGdldENsb3N1cmVTYWZlUHJvcGVydHl9KTtcblxuZnVuY3Rpb24gaXNVc2VDbGFzc1Byb3ZpZGVyKG1ldGE6IEluamVjdGFibGUpOiBtZXRhIGlzIFVzZUNsYXNzUHJvdmlkZXIge1xuICByZXR1cm4gKG1ldGEgYXMgVXNlQ2xhc3NQcm92aWRlcikudXNlQ2xhc3MgIT09IHVuZGVmaW5lZDtcbn1cblxuZnVuY3Rpb24gaXNVc2VWYWx1ZVByb3ZpZGVyKG1ldGE6IEluamVjdGFibGUpOiBtZXRhIGlzIEluamVjdGFibGUmVmFsdWVTYW5zUHJvdmlkZXIge1xuICByZXR1cm4gVVNFX1ZBTFVFIGluIG1ldGE7XG59XG5cbmZ1bmN0aW9uIGlzVXNlRmFjdG9yeVByb3ZpZGVyKG1ldGE6IEluamVjdGFibGUpOiBtZXRhIGlzIEluamVjdGFibGUmRmFjdG9yeVNhbnNQcm92aWRlciB7XG4gIHJldHVybiAobWV0YSBhcyBGYWN0b3J5U2Fuc1Byb3ZpZGVyKS51c2VGYWN0b3J5ICE9PSB1bmRlZmluZWQ7XG59XG5cbmZ1bmN0aW9uIGlzVXNlRXhpc3RpbmdQcm92aWRlcihtZXRhOiBJbmplY3RhYmxlKTogbWV0YSBpcyBJbmplY3RhYmxlJkV4aXN0aW5nU2Fuc1Byb3ZpZGVyIHtcbiAgcmV0dXJuIChtZXRhIGFzIEV4aXN0aW5nU2Fuc1Byb3ZpZGVyKS51c2VFeGlzdGluZyAhPT0gdW5kZWZpbmVkO1xufVxuXG5mdW5jdGlvbiBnZXRJbmplY3RhYmxlTWV0YWRhdGEodHlwZTogVHlwZTxhbnk+LCBzcmNNZXRhPzogSW5qZWN0YWJsZSk6IFIzSW5qZWN0YWJsZU1ldGFkYXRhRmFjYWRlIHtcbiAgLy8gQWxsb3cgdGhlIGNvbXBpbGF0aW9uIG9mIGEgY2xhc3Mgd2l0aCBhIGBASW5qZWN0YWJsZSgpYCBkZWNvcmF0b3Igd2l0aG91dCBwYXJhbWV0ZXJzXG4gIGNvbnN0IG1ldGE6IEluamVjdGFibGUgPSBzcmNNZXRhIHx8IHtwcm92aWRlZEluOiBudWxsfTtcbiAgY29uc3QgY29tcGlsZXJNZXRhOiBSM0luamVjdGFibGVNZXRhZGF0YUZhY2FkZSA9IHtcbiAgICBuYW1lOiB0eXBlLm5hbWUsXG4gICAgdHlwZTogdHlwZSxcbiAgICB0eXBlQXJndW1lbnRDb3VudDogMCxcbiAgICBwcm92aWRlZEluOiBtZXRhLnByb3ZpZGVkSW4sXG4gICAgdXNlckRlcHM6IHVuZGVmaW5lZCxcbiAgfTtcbiAgaWYgKChpc1VzZUNsYXNzUHJvdmlkZXIobWV0YSkgfHwgaXNVc2VGYWN0b3J5UHJvdmlkZXIobWV0YSkpICYmIG1ldGEuZGVwcyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgY29tcGlsZXJNZXRhLnVzZXJEZXBzID0gY29udmVydERlcGVuZGVuY2llcyhtZXRhLmRlcHMpO1xuICB9XG4gIGlmIChpc1VzZUNsYXNzUHJvdmlkZXIobWV0YSkpIHtcbiAgICAvLyBUaGUgdXNlciBleHBsaWNpdGx5IHNwZWNpZmllZCB1c2VDbGFzcywgYW5kIG1heSBvciBtYXkgbm90IGhhdmUgcHJvdmlkZWQgZGVwcy5cbiAgICBjb21waWxlck1ldGEudXNlQ2xhc3MgPSByZXNvbHZlRm9yd2FyZFJlZihtZXRhLnVzZUNsYXNzKTtcbiAgfSBlbHNlIGlmIChpc1VzZVZhbHVlUHJvdmlkZXIobWV0YSkpIHtcbiAgICAvLyBUaGUgdXNlciBleHBsaWNpdGx5IHNwZWNpZmllZCB1c2VWYWx1ZS5cbiAgICBjb21waWxlck1ldGEudXNlVmFsdWUgPSByZXNvbHZlRm9yd2FyZFJlZihtZXRhLnVzZVZhbHVlKTtcbiAgfSBlbHNlIGlmIChpc1VzZUZhY3RvcnlQcm92aWRlcihtZXRhKSkge1xuICAgIC8vIFRoZSB1c2VyIGV4cGxpY2l0bHkgc3BlY2lmaWVkIHVzZUZhY3RvcnkuXG4gICAgY29tcGlsZXJNZXRhLnVzZUZhY3RvcnkgPSBtZXRhLnVzZUZhY3Rvcnk7XG4gIH0gZWxzZSBpZiAoaXNVc2VFeGlzdGluZ1Byb3ZpZGVyKG1ldGEpKSB7XG4gICAgLy8gVGhlIHVzZXIgZXhwbGljaXRseSBzcGVjaWZpZWQgdXNlRXhpc3RpbmcuXG4gICAgY29tcGlsZXJNZXRhLnVzZUV4aXN0aW5nID0gcmVzb2x2ZUZvcndhcmRSZWYobWV0YS51c2VFeGlzdGluZyk7XG4gIH1cbiAgcmV0dXJuIGNvbXBpbGVyTWV0YTtcbn1cbiJdfQ==