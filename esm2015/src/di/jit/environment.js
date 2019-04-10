/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Δinject } from '../injector_compatibility';
import { getInjectableDef, getInjectorDef, ΔdefineInjectable, ΔdefineInjector } from '../interface/defs';
/**
 * A mapping of the \@angular/core API surface used in generated expressions to the actual symbols.
 *
 * This should be kept up to date with the public exports of \@angular/core.
 * @type {?}
 */
export const angularCoreDiEnv = {
    'ΔdefineInjectable': ΔdefineInjectable,
    'ΔdefineInjector': ΔdefineInjector,
    'Δinject': Δinject,
    'ΔgetFactoryOf': getFactoryOf,
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW52aXJvbm1lbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9kaS9qaXQvZW52aXJvbm1lbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFTQSxPQUFPLEVBQUMsT0FBTyxFQUFDLE1BQU0sMkJBQTJCLENBQUM7QUFDbEQsT0FBTyxFQUFDLGdCQUFnQixFQUFFLGNBQWMsRUFBRSxpQkFBaUIsRUFBRSxlQUFlLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQzs7Ozs7OztBQVN2RyxNQUFNLE9BQU8sZ0JBQWdCLEdBQStCO0lBQzFELG1CQUFtQixFQUFFLGlCQUFpQjtJQUN0QyxpQkFBaUIsRUFBRSxlQUFlO0lBQ2xDLFNBQVMsRUFBRSxPQUFPO0lBQ2xCLGVBQWUsRUFBRSxZQUFZO0NBQzlCOzs7Ozs7QUFFRCxTQUFTLFlBQVksQ0FBSSxJQUFlOztVQUNoQyxPQUFPLEdBQUcsbUJBQUEsSUFBSSxFQUFPOztVQUNyQixHQUFHLEdBQUcsZ0JBQWdCLENBQUksT0FBTyxDQUFDLElBQUksY0FBYyxDQUFJLE9BQU8sQ0FBQztJQUN0RSxJQUFJLENBQUMsR0FBRyxJQUFJLEdBQUcsQ0FBQyxPQUFPLEtBQUssU0FBUyxFQUFFO1FBQ3JDLE9BQU8sSUFBSSxDQUFDO0tBQ2I7SUFDRCxPQUFPLEdBQUcsQ0FBQyxPQUFPLENBQUM7QUFDckIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtUeXBlfSBmcm9tICcuLi8uLi9pbnRlcmZhY2UvdHlwZSc7XG5pbXBvcnQge86UaW5qZWN0fSBmcm9tICcuLi9pbmplY3Rvcl9jb21wYXRpYmlsaXR5JztcbmltcG9ydCB7Z2V0SW5qZWN0YWJsZURlZiwgZ2V0SW5qZWN0b3JEZWYsIM6UZGVmaW5lSW5qZWN0YWJsZSwgzpRkZWZpbmVJbmplY3Rvcn0gZnJvbSAnLi4vaW50ZXJmYWNlL2RlZnMnO1xuXG5cblxuLyoqXG4gKiBBIG1hcHBpbmcgb2YgdGhlIEBhbmd1bGFyL2NvcmUgQVBJIHN1cmZhY2UgdXNlZCBpbiBnZW5lcmF0ZWQgZXhwcmVzc2lvbnMgdG8gdGhlIGFjdHVhbCBzeW1ib2xzLlxuICpcbiAqIFRoaXMgc2hvdWxkIGJlIGtlcHQgdXAgdG8gZGF0ZSB3aXRoIHRoZSBwdWJsaWMgZXhwb3J0cyBvZiBAYW5ndWxhci9jb3JlLlxuICovXG5leHBvcnQgY29uc3QgYW5ndWxhckNvcmVEaUVudjoge1tuYW1lOiBzdHJpbmddOiBGdW5jdGlvbn0gPSB7XG4gICfOlGRlZmluZUluamVjdGFibGUnOiDOlGRlZmluZUluamVjdGFibGUsXG4gICfOlGRlZmluZUluamVjdG9yJzogzpRkZWZpbmVJbmplY3RvcixcbiAgJ86UaW5qZWN0JzogzpRpbmplY3QsXG4gICfOlGdldEZhY3RvcnlPZic6IGdldEZhY3RvcnlPZixcbn07XG5cbmZ1bmN0aW9uIGdldEZhY3RvcnlPZjxUPih0eXBlOiBUeXBlPGFueT4pOiAoKHR5cGU6IFR5cGU8VD58IG51bGwpID0+IFQpfG51bGwge1xuICBjb25zdCB0eXBlQW55ID0gdHlwZSBhcyBhbnk7XG4gIGNvbnN0IGRlZiA9IGdldEluamVjdGFibGVEZWY8VD4odHlwZUFueSkgfHwgZ2V0SW5qZWN0b3JEZWY8VD4odHlwZUFueSk7XG4gIGlmICghZGVmIHx8IGRlZi5mYWN0b3J5ID09PSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuICByZXR1cm4gZGVmLmZhY3Rvcnk7XG59XG4iXX0=