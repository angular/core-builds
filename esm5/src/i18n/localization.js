/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { getLocalePluralCase } from './locale_data_api';
/**
 * Returns the plural case based on the locale
 */
export function getPluralCase(value, locale) {
    var plural = getLocalePluralCase(locale)(value);
    switch (plural) {
        case 0:
            return 'zero';
        case 1:
            return 'one';
        case 2:
            return 'two';
        case 3:
            return 'few';
        case 4:
            return 'many';
        default:
            return 'other';
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9jYWxpemF0aW9uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvaTE4bi9sb2NhbGl6YXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLG1CQUFtQixFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFFdEQ7O0dBRUc7QUFDSCxNQUFNLFVBQVUsYUFBYSxDQUFDLEtBQVUsRUFBRSxNQUFjO0lBQ3RELElBQU0sTUFBTSxHQUFHLG1CQUFtQixDQUFDLE1BQU0sQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBRWxELFFBQVEsTUFBTSxFQUFFO1FBQ2QsS0FBSyxDQUFDO1lBQ0osT0FBTyxNQUFNLENBQUM7UUFDaEIsS0FBSyxDQUFDO1lBQ0osT0FBTyxLQUFLLENBQUM7UUFDZixLQUFLLENBQUM7WUFDSixPQUFPLEtBQUssQ0FBQztRQUNmLEtBQUssQ0FBQztZQUNKLE9BQU8sS0FBSyxDQUFDO1FBQ2YsS0FBSyxDQUFDO1lBQ0osT0FBTyxNQUFNLENBQUM7UUFDaEI7WUFDRSxPQUFPLE9BQU8sQ0FBQztLQUNsQjtBQUNILENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7Z2V0TG9jYWxlUGx1cmFsQ2FzZX0gZnJvbSAnLi9sb2NhbGVfZGF0YV9hcGknO1xuXG4vKipcbiAqIFJldHVybnMgdGhlIHBsdXJhbCBjYXNlIGJhc2VkIG9uIHRoZSBsb2NhbGVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldFBsdXJhbENhc2UodmFsdWU6IGFueSwgbG9jYWxlOiBzdHJpbmcpOiBzdHJpbmcge1xuICBjb25zdCBwbHVyYWwgPSBnZXRMb2NhbGVQbHVyYWxDYXNlKGxvY2FsZSkodmFsdWUpO1xuXG4gIHN3aXRjaCAocGx1cmFsKSB7XG4gICAgY2FzZSAwOlxuICAgICAgcmV0dXJuICd6ZXJvJztcbiAgICBjYXNlIDE6XG4gICAgICByZXR1cm4gJ29uZSc7XG4gICAgY2FzZSAyOlxuICAgICAgcmV0dXJuICd0d28nO1xuICAgIGNhc2UgMzpcbiAgICAgIHJldHVybiAnZmV3JztcbiAgICBjYXNlIDQ6XG4gICAgICByZXR1cm4gJ21hbnknO1xuICAgIGRlZmF1bHQ6XG4gICAgICByZXR1cm4gJ290aGVyJztcbiAgfVxufVxuIl19