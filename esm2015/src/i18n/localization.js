/**
 * @fileoverview added by tsickle
 * Generated from: packages/core/src/i18n/localization.ts
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
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
 * @param {?} value
 * @param {?} locale
 * @return {?}
 */
export function getPluralCase(value, locale) {
    /** @type {?} */
    const plural = getLocalePluralCase(locale)(value);
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
/**
 * The locale id that the application is using by default (for translations and ICU expressions).
 * @type {?}
 */
export const DEFAULT_LOCALE_ID = 'en-US';
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9jYWxpemF0aW9uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvaTE4bi9sb2NhbGl6YXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBUUEsT0FBTyxFQUFDLG1CQUFtQixFQUFDLE1BQU0sbUJBQW1CLENBQUM7Ozs7Ozs7QUFLdEQsTUFBTSxVQUFVLGFBQWEsQ0FBQyxLQUFVLEVBQUUsTUFBYzs7VUFDaEQsTUFBTSxHQUFHLG1CQUFtQixDQUFDLE1BQU0sQ0FBQyxDQUFDLEtBQUssQ0FBQztJQUVqRCxRQUFRLE1BQU0sRUFBRTtRQUNkLEtBQUssQ0FBQztZQUNKLE9BQU8sTUFBTSxDQUFDO1FBQ2hCLEtBQUssQ0FBQztZQUNKLE9BQU8sS0FBSyxDQUFDO1FBQ2YsS0FBSyxDQUFDO1lBQ0osT0FBTyxLQUFLLENBQUM7UUFDZixLQUFLLENBQUM7WUFDSixPQUFPLEtBQUssQ0FBQztRQUNmLEtBQUssQ0FBQztZQUNKLE9BQU8sTUFBTSxDQUFDO1FBQ2hCO1lBQ0UsT0FBTyxPQUFPLENBQUM7S0FDbEI7QUFDSCxDQUFDOzs7OztBQUtELE1BQU0sT0FBTyxpQkFBaUIsR0FBRyxPQUFPIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge2dldExvY2FsZVBsdXJhbENhc2V9IGZyb20gJy4vbG9jYWxlX2RhdGFfYXBpJztcblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBwbHVyYWwgY2FzZSBiYXNlZCBvbiB0aGUgbG9jYWxlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRQbHVyYWxDYXNlKHZhbHVlOiBhbnksIGxvY2FsZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3QgcGx1cmFsID0gZ2V0TG9jYWxlUGx1cmFsQ2FzZShsb2NhbGUpKHZhbHVlKTtcblxuICBzd2l0Y2ggKHBsdXJhbCkge1xuICAgIGNhc2UgMDpcbiAgICAgIHJldHVybiAnemVybyc7XG4gICAgY2FzZSAxOlxuICAgICAgcmV0dXJuICdvbmUnO1xuICAgIGNhc2UgMjpcbiAgICAgIHJldHVybiAndHdvJztcbiAgICBjYXNlIDM6XG4gICAgICByZXR1cm4gJ2Zldyc7XG4gICAgY2FzZSA0OlxuICAgICAgcmV0dXJuICdtYW55JztcbiAgICBkZWZhdWx0OlxuICAgICAgcmV0dXJuICdvdGhlcic7XG4gIH1cbn1cblxuLyoqXG4gKiBUaGUgbG9jYWxlIGlkIHRoYXQgdGhlIGFwcGxpY2F0aW9uIGlzIHVzaW5nIGJ5IGRlZmF1bHQgKGZvciB0cmFuc2xhdGlvbnMgYW5kIElDVSBleHByZXNzaW9ucykuXG4gKi9cbmV4cG9ydCBjb25zdCBERUZBVUxUX0xPQ0FMRV9JRCA9ICdlbi1VUyc7XG4iXX0=