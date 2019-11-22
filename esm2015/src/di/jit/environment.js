/**
 * @fileoverview added by tsickle
 * Generated from: packages/core/src/di/jit/environment.ts
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { isForwardRef, resolveForwardRef } from '../forward_ref';
import { ɵɵinject } from '../injector_compatibility';
import { getInjectableDef, getInjectorDef, ɵɵdefineInjectable, ɵɵdefineInjector } from '../interface/defs';
/**
 * A mapping of the \@angular/core API surface used in generated expressions to the actual symbols.
 *
 * This should be kept up to date with the public exports of \@angular/core.
 * @type {?}
 */
export const angularCoreDiEnv = {
    'ɵɵdefineInjectable': ɵɵdefineInjectable,
    'ɵɵdefineInjector': ɵɵdefineInjector,
    'ɵɵinject': ɵɵinject,
    'ɵɵgetFactoryOf': getFactoryOf,
};
/**
 * @template T
 * @param {?} type
 * @return {?}
 */
function getFactoryOf(type) {
    /** @type {?} */
    const typeAny = (/** @type {?} */ (type));
    if (isForwardRef(type)) {
        return (/** @type {?} */ (((/**
         * @return {?}
         */
        () => {
            /** @type {?} */
            const factory = getFactoryOf(resolveForwardRef(typeAny));
            return factory ? factory() : null;
        }))));
    }
    /** @type {?} */
    const def = getInjectableDef(typeAny) || getInjectorDef(typeAny);
    if (!def || def.factory === undefined) {
        return null;
    }
    return def.factory;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW52aXJvbm1lbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9kaS9qaXQvZW52aXJvbm1lbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBU0EsT0FBTyxFQUFDLFlBQVksRUFBRSxpQkFBaUIsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBQy9ELE9BQU8sRUFBQyxRQUFRLEVBQUMsTUFBTSwyQkFBMkIsQ0FBQztBQUNuRCxPQUFPLEVBQUMsZ0JBQWdCLEVBQUUsY0FBYyxFQUFFLGtCQUFrQixFQUFFLGdCQUFnQixFQUFDLE1BQU0sbUJBQW1CLENBQUM7Ozs7Ozs7QUFTekcsTUFBTSxPQUFPLGdCQUFnQixHQUErQjtJQUMxRCxvQkFBb0IsRUFBRSxrQkFBa0I7SUFDeEMsa0JBQWtCLEVBQUUsZ0JBQWdCO0lBQ3BDLFVBQVUsRUFBRSxRQUFRO0lBQ3BCLGdCQUFnQixFQUFFLFlBQVk7Q0FDL0I7Ozs7OztBQUVELFNBQVMsWUFBWSxDQUFJLElBQWU7O1VBQ2hDLE9BQU8sR0FBRyxtQkFBQSxJQUFJLEVBQU87SUFFM0IsSUFBSSxZQUFZLENBQUMsSUFBSSxDQUFDLEVBQUU7UUFDdEIsT0FBTyxtQkFBQTs7O1FBQUMsR0FBRyxFQUFFOztrQkFDTCxPQUFPLEdBQUcsWUFBWSxDQUFJLGlCQUFpQixDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQzNELE9BQU8sT0FBTyxDQUFDLENBQUMsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO1FBQ3BDLENBQUMsRUFBQyxFQUFPLENBQUM7S0FDWDs7VUFFSyxHQUFHLEdBQUcsZ0JBQWdCLENBQUksT0FBTyxDQUFDLElBQUksY0FBYyxDQUFJLE9BQU8sQ0FBQztJQUN0RSxJQUFJLENBQUMsR0FBRyxJQUFJLEdBQUcsQ0FBQyxPQUFPLEtBQUssU0FBUyxFQUFFO1FBQ3JDLE9BQU8sSUFBSSxDQUFDO0tBQ2I7SUFDRCxPQUFPLEdBQUcsQ0FBQyxPQUFPLENBQUM7QUFDckIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtUeXBlfSBmcm9tICcuLi8uLi9pbnRlcmZhY2UvdHlwZSc7XG5pbXBvcnQge2lzRm9yd2FyZFJlZiwgcmVzb2x2ZUZvcndhcmRSZWZ9IGZyb20gJy4uL2ZvcndhcmRfcmVmJztcbmltcG9ydCB7ybXJtWluamVjdH0gZnJvbSAnLi4vaW5qZWN0b3JfY29tcGF0aWJpbGl0eSc7XG5pbXBvcnQge2dldEluamVjdGFibGVEZWYsIGdldEluamVjdG9yRGVmLCDJtcm1ZGVmaW5lSW5qZWN0YWJsZSwgybXJtWRlZmluZUluamVjdG9yfSBmcm9tICcuLi9pbnRlcmZhY2UvZGVmcyc7XG5cblxuXG4vKipcbiAqIEEgbWFwcGluZyBvZiB0aGUgQGFuZ3VsYXIvY29yZSBBUEkgc3VyZmFjZSB1c2VkIGluIGdlbmVyYXRlZCBleHByZXNzaW9ucyB0byB0aGUgYWN0dWFsIHN5bWJvbHMuXG4gKlxuICogVGhpcyBzaG91bGQgYmUga2VwdCB1cCB0byBkYXRlIHdpdGggdGhlIHB1YmxpYyBleHBvcnRzIG9mIEBhbmd1bGFyL2NvcmUuXG4gKi9cbmV4cG9ydCBjb25zdCBhbmd1bGFyQ29yZURpRW52OiB7W25hbWU6IHN0cmluZ106IEZ1bmN0aW9ufSA9IHtcbiAgJ8m1ybVkZWZpbmVJbmplY3RhYmxlJzogybXJtWRlZmluZUluamVjdGFibGUsXG4gICfJtcm1ZGVmaW5lSW5qZWN0b3InOiDJtcm1ZGVmaW5lSW5qZWN0b3IsXG4gICfJtcm1aW5qZWN0JzogybXJtWluamVjdCxcbiAgJ8m1ybVnZXRGYWN0b3J5T2YnOiBnZXRGYWN0b3J5T2YsXG59O1xuXG5mdW5jdGlvbiBnZXRGYWN0b3J5T2Y8VD4odHlwZTogVHlwZTxhbnk+KTogKCh0eXBlPzogVHlwZTxUPikgPT4gVCl8bnVsbCB7XG4gIGNvbnN0IHR5cGVBbnkgPSB0eXBlIGFzIGFueTtcblxuICBpZiAoaXNGb3J3YXJkUmVmKHR5cGUpKSB7XG4gICAgcmV0dXJuICgoKSA9PiB7XG4gICAgICBjb25zdCBmYWN0b3J5ID0gZ2V0RmFjdG9yeU9mPFQ+KHJlc29sdmVGb3J3YXJkUmVmKHR5cGVBbnkpKTtcbiAgICAgIHJldHVybiBmYWN0b3J5ID8gZmFjdG9yeSgpIDogbnVsbDtcbiAgICB9KSBhcyBhbnk7XG4gIH1cblxuICBjb25zdCBkZWYgPSBnZXRJbmplY3RhYmxlRGVmPFQ+KHR5cGVBbnkpIHx8IGdldEluamVjdG9yRGVmPFQ+KHR5cGVBbnkpO1xuICBpZiAoIWRlZiB8fCBkZWYuZmFjdG9yeSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbiAgcmV0dXJuIGRlZi5mYWN0b3J5O1xufVxuIl19