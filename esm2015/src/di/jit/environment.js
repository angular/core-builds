/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { inject } from '../injector_compatibility';
import { defineInjectable, defineInjector, getInjectableDef, getInjectorDef } from '../interface/defs';
/**
 * A mapping of the \@angular/core API surface used in generated expressions to the actual symbols.
 *
 * This should be kept up to date with the public exports of \@angular/core.
 * @type {?}
 */
export const angularCoreDiEnv = {
    'defineInjectable': defineInjectable,
    'defineInjector': defineInjector,
    'inject': inject,
    'ɵgetFactoryOf': getFactoryOf,
};
/**
 * @template T
 * @param {?} type
 * @return {?}
 */
function getFactoryOf(type) {
    /** @type {?} */
    const typeAny = (/** @type {?} */ (type));
    /** @type {?} */
    const def = getInjectableDef(typeAny) || getInjectorDef(typeAny);
    if (!def || def.factory === undefined) {
        return null;
    }
    return def.factory;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW52aXJvbm1lbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9kaS9qaXQvZW52aXJvbm1lbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFTQSxPQUFPLEVBQUMsTUFBTSxFQUFDLE1BQU0sMkJBQTJCLENBQUM7QUFDakQsT0FBTyxFQUFDLGdCQUFnQixFQUFFLGNBQWMsRUFBRSxnQkFBZ0IsRUFBRSxjQUFjLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQzs7Ozs7OztBQVFyRyxNQUFNLE9BQU8sZ0JBQWdCLEdBQStCO0lBQzFELGtCQUFrQixFQUFFLGdCQUFnQjtJQUNwQyxnQkFBZ0IsRUFBRSxjQUFjO0lBQ2hDLFFBQVEsRUFBRSxNQUFNO0lBQ2hCLGVBQWUsRUFBRSxZQUFZO0NBQzlCOzs7Ozs7QUFFRCxTQUFTLFlBQVksQ0FBSSxJQUFlOztVQUNoQyxPQUFPLEdBQUcsbUJBQUEsSUFBSSxFQUFPOztVQUNyQixHQUFHLEdBQUcsZ0JBQWdCLENBQUksT0FBTyxDQUFDLElBQUksY0FBYyxDQUFJLE9BQU8sQ0FBQztJQUN0RSxJQUFJLENBQUMsR0FBRyxJQUFJLEdBQUcsQ0FBQyxPQUFPLEtBQUssU0FBUyxFQUFFO1FBQ3JDLE9BQU8sSUFBSSxDQUFDO0tBQ2I7SUFDRCxPQUFPLEdBQUcsQ0FBQyxPQUFPLENBQUM7QUFDckIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtUeXBlfSBmcm9tICcuLi8uLi9pbnRlcmZhY2UvdHlwZSc7XG5pbXBvcnQge2luamVjdH0gZnJvbSAnLi4vaW5qZWN0b3JfY29tcGF0aWJpbGl0eSc7XG5pbXBvcnQge2RlZmluZUluamVjdGFibGUsIGRlZmluZUluamVjdG9yLCBnZXRJbmplY3RhYmxlRGVmLCBnZXRJbmplY3RvckRlZn0gZnJvbSAnLi4vaW50ZXJmYWNlL2RlZnMnO1xuXG5cbi8qKlxuICogQSBtYXBwaW5nIG9mIHRoZSBAYW5ndWxhci9jb3JlIEFQSSBzdXJmYWNlIHVzZWQgaW4gZ2VuZXJhdGVkIGV4cHJlc3Npb25zIHRvIHRoZSBhY3R1YWwgc3ltYm9scy5cbiAqXG4gKiBUaGlzIHNob3VsZCBiZSBrZXB0IHVwIHRvIGRhdGUgd2l0aCB0aGUgcHVibGljIGV4cG9ydHMgb2YgQGFuZ3VsYXIvY29yZS5cbiAqL1xuZXhwb3J0IGNvbnN0IGFuZ3VsYXJDb3JlRGlFbnY6IHtbbmFtZTogc3RyaW5nXTogRnVuY3Rpb259ID0ge1xuICAnZGVmaW5lSW5qZWN0YWJsZSc6IGRlZmluZUluamVjdGFibGUsXG4gICdkZWZpbmVJbmplY3Rvcic6IGRlZmluZUluamVjdG9yLFxuICAnaW5qZWN0JzogaW5qZWN0LFxuICAnybVnZXRGYWN0b3J5T2YnOiBnZXRGYWN0b3J5T2YsXG59O1xuXG5mdW5jdGlvbiBnZXRGYWN0b3J5T2Y8VD4odHlwZTogVHlwZTxhbnk+KTogKCh0eXBlOiBUeXBlPFQ+fCBudWxsKSA9PiBUKXxudWxsIHtcbiAgY29uc3QgdHlwZUFueSA9IHR5cGUgYXMgYW55O1xuICBjb25zdCBkZWYgPSBnZXRJbmplY3RhYmxlRGVmPFQ+KHR5cGVBbnkpIHx8IGdldEluamVjdG9yRGVmPFQ+KHR5cGVBbnkpO1xuICBpZiAoIWRlZiB8fCBkZWYuZmFjdG9yeSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbiAgcmV0dXJuIGRlZi5mYWN0b3J5O1xufVxuIl19