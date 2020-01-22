/**
 * @fileoverview added by tsickle
 * Generated from: packages/core/src/i18n/locale_data_api.ts
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import localeEn from './locale_en';
import { global } from '../util/global';
/**
 * This const is used to store the locale data registered with `registerLocaleData`
 * @type {?}
 */
let LOCALE_DATA = {};
/**
 * Register locale data to be used internally by Angular. See the
 * ["I18n guide"](guide/i18n#i18n-pipes) to know how to import additional locale data.
 *
 * The signature `registerLocaleData(data: any, extraData?: any)` is deprecated since v5.1
 * @param {?} data
 * @param {?=} localeId
 * @param {?=} extraData
 * @return {?}
 */
export function registerLocaleData(data, localeId, extraData) {
    if (typeof localeId !== 'string') {
        extraData = localeId;
        localeId = data[LocaleDataIndex.LocaleId];
    }
    localeId = localeId.toLowerCase().replace(/_/g, '-');
    LOCALE_DATA[localeId] = data;
    if (extraData) {
        LOCALE_DATA[localeId][LocaleDataIndex.ExtraData] = extraData;
    }
}
/**
 * Finds the locale data for a given locale.
 *
 * @see [Internationalization (i18n) Guide](https://angular.io/guide/i18n)
 * @param {?} locale The locale code.
 * @return {?} The locale data.
 */
export function findLocaleData(locale) {
    /** @type {?} */
    const normalizedLocale = normalizeLocale(locale);
    /** @type {?} */
    let match = getLocaleData(normalizedLocale);
    if (match) {
        return match;
    }
    // let's try to find a parent locale
    /** @type {?} */
    const parentLocale = normalizedLocale.split('-')[0];
    match = getLocaleData(parentLocale);
    if (match) {
        return match;
    }
    if (parentLocale === 'en') {
        return localeEn;
    }
    throw new Error(`Missing locale data for the locale "${locale}".`);
}
/**
 * Retrieves the default currency code for the given locale.
 *
 * The default is defined as the first currency which is still in use.
 *
 * \@publicApi
 * @param {?} locale The code of the locale whose currency code we want.
 * @return {?} The code of the default currency for the given locale.
 *
 */
export function getLocaleCurrencyCode(locale) {
    /** @type {?} */
    const data = findLocaleData(locale);
    return data[LocaleDataIndex.CurrencyCode] || null;
}
/**
 * Retrieves the plural function used by ICU expressions to determine the plural case to use
 * for a given locale.
 * @see `NgPlural` / [Internationalization (i18n) Guide](https://angular.io/guide/i18n)
 * @param {?} locale A locale code for the locale format rules to use.
 * @return {?} The plural function for the locale.
 */
export function getLocalePluralCase(locale) {
    /** @type {?} */
    const data = findLocaleData(locale);
    return data[LocaleDataIndex.PluralCase];
}
/**
 * Helper function to get the given `normalizedLocale` from `LOCALE_DATA`
 * or from the global `ng.common.locale`.
 * @param {?} normalizedLocale
 * @return {?}
 */
export function getLocaleData(normalizedLocale) {
    if (!(normalizedLocale in LOCALE_DATA)) {
        LOCALE_DATA[normalizedLocale] = global.ng && global.ng.common && global.ng.common.locales &&
            global.ng.common.locales[normalizedLocale];
    }
    return LOCALE_DATA[normalizedLocale];
}
/**
 * Helper function to remove all the locale data from `LOCALE_DATA`.
 * @return {?}
 */
export function unregisterAllLocaleData() {
    LOCALE_DATA = {};
}
/** @enum {number} */
const LocaleDataIndex = {
    LocaleId: 0,
    DayPeriodsFormat: 1,
    DayPeriodsStandalone: 2,
    DaysFormat: 3,
    DaysStandalone: 4,
    MonthsFormat: 5,
    MonthsStandalone: 6,
    Eras: 7,
    FirstDayOfWeek: 8,
    WeekendRange: 9,
    DateFormat: 10,
    TimeFormat: 11,
    DateTimeFormat: 12,
    NumberSymbols: 13,
    NumberFormats: 14,
    CurrencyCode: 15,
    CurrencySymbol: 16,
    CurrencyName: 17,
    Currencies: 18,
    Directionality: 19,
    PluralCase: 20,
    ExtraData: 21,
};
export { LocaleDataIndex };
LocaleDataIndex[LocaleDataIndex.LocaleId] = 'LocaleId';
LocaleDataIndex[LocaleDataIndex.DayPeriodsFormat] = 'DayPeriodsFormat';
LocaleDataIndex[LocaleDataIndex.DayPeriodsStandalone] = 'DayPeriodsStandalone';
LocaleDataIndex[LocaleDataIndex.DaysFormat] = 'DaysFormat';
LocaleDataIndex[LocaleDataIndex.DaysStandalone] = 'DaysStandalone';
LocaleDataIndex[LocaleDataIndex.MonthsFormat] = 'MonthsFormat';
LocaleDataIndex[LocaleDataIndex.MonthsStandalone] = 'MonthsStandalone';
LocaleDataIndex[LocaleDataIndex.Eras] = 'Eras';
LocaleDataIndex[LocaleDataIndex.FirstDayOfWeek] = 'FirstDayOfWeek';
LocaleDataIndex[LocaleDataIndex.WeekendRange] = 'WeekendRange';
LocaleDataIndex[LocaleDataIndex.DateFormat] = 'DateFormat';
LocaleDataIndex[LocaleDataIndex.TimeFormat] = 'TimeFormat';
LocaleDataIndex[LocaleDataIndex.DateTimeFormat] = 'DateTimeFormat';
LocaleDataIndex[LocaleDataIndex.NumberSymbols] = 'NumberSymbols';
LocaleDataIndex[LocaleDataIndex.NumberFormats] = 'NumberFormats';
LocaleDataIndex[LocaleDataIndex.CurrencyCode] = 'CurrencyCode';
LocaleDataIndex[LocaleDataIndex.CurrencySymbol] = 'CurrencySymbol';
LocaleDataIndex[LocaleDataIndex.CurrencyName] = 'CurrencyName';
LocaleDataIndex[LocaleDataIndex.Currencies] = 'Currencies';
LocaleDataIndex[LocaleDataIndex.Directionality] = 'Directionality';
LocaleDataIndex[LocaleDataIndex.PluralCase] = 'PluralCase';
LocaleDataIndex[LocaleDataIndex.ExtraData] = 'ExtraData';
/** @enum {number} */
const ExtraLocaleDataIndex = {
    ExtraDayPeriodFormats: 0,
    ExtraDayPeriodStandalone: 1,
    ExtraDayPeriodsRules: 2,
};
export { ExtraLocaleDataIndex };
/** @enum {number} */
const CurrencyIndex = {
    Symbol: 0, SymbolNarrow: 1, NbOfDigits: 2,
};
export { CurrencyIndex };
/**
 * Returns the canonical form of a locale name - lowercase with `_` replaced with `-`.
 * @param {?} locale
 * @return {?}
 */
function normalizeLocale(locale) {
    return locale.toLowerCase().replace(/_/g, '-');
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9jYWxlX2RhdGFfYXBpLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvaTE4bi9sb2NhbGVfZGF0YV9hcGkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBT0EsT0FBTyxRQUFRLE1BQU0sYUFBYSxDQUFDO0FBQ25DLE9BQU8sRUFBQyxNQUFNLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQzs7Ozs7SUFLbEMsV0FBVyxHQUE4QixFQUFFOzs7Ozs7Ozs7OztBQVEvQyxNQUFNLFVBQVUsa0JBQWtCLENBQUMsSUFBUyxFQUFFLFFBQXVCLEVBQUUsU0FBZTtJQUNwRixJQUFJLE9BQU8sUUFBUSxLQUFLLFFBQVEsRUFBRTtRQUNoQyxTQUFTLEdBQUcsUUFBUSxDQUFDO1FBQ3JCLFFBQVEsR0FBRyxJQUFJLENBQUMsZUFBZSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0tBQzNDO0lBRUQsUUFBUSxHQUFHLFFBQVEsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxDQUFDO0lBRXJELFdBQVcsQ0FBQyxRQUFRLENBQUMsR0FBRyxJQUFJLENBQUM7SUFFN0IsSUFBSSxTQUFTLEVBQUU7UUFDYixXQUFXLENBQUMsUUFBUSxDQUFDLENBQUMsZUFBZSxDQUFDLFNBQVMsQ0FBQyxHQUFHLFNBQVMsQ0FBQztLQUM5RDtBQUNILENBQUM7Ozs7Ozs7O0FBU0QsTUFBTSxVQUFVLGNBQWMsQ0FBQyxNQUFjOztVQUNyQyxnQkFBZ0IsR0FBRyxlQUFlLENBQUMsTUFBTSxDQUFDOztRQUU1QyxLQUFLLEdBQUcsYUFBYSxDQUFDLGdCQUFnQixDQUFDO0lBQzNDLElBQUksS0FBSyxFQUFFO1FBQ1QsT0FBTyxLQUFLLENBQUM7S0FDZDs7O1VBR0ssWUFBWSxHQUFHLGdCQUFnQixDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDbkQsS0FBSyxHQUFHLGFBQWEsQ0FBQyxZQUFZLENBQUMsQ0FBQztJQUNwQyxJQUFJLEtBQUssRUFBRTtRQUNULE9BQU8sS0FBSyxDQUFDO0tBQ2Q7SUFFRCxJQUFJLFlBQVksS0FBSyxJQUFJLEVBQUU7UUFDekIsT0FBTyxRQUFRLENBQUM7S0FDakI7SUFFRCxNQUFNLElBQUksS0FBSyxDQUFDLHVDQUF1QyxNQUFNLElBQUksQ0FBQyxDQUFDO0FBQ3JFLENBQUM7Ozs7Ozs7Ozs7O0FBWUQsTUFBTSxVQUFVLHFCQUFxQixDQUFDLE1BQWM7O1VBQzVDLElBQUksR0FBRyxjQUFjLENBQUMsTUFBTSxDQUFDO0lBQ25DLE9BQU8sSUFBSSxDQUFDLGVBQWUsQ0FBQyxZQUFZLENBQUMsSUFBSSxJQUFJLENBQUM7QUFDcEQsQ0FBQzs7Ozs7Ozs7QUFVRCxNQUFNLFVBQVUsbUJBQW1CLENBQUMsTUFBYzs7VUFDMUMsSUFBSSxHQUFHLGNBQWMsQ0FBQyxNQUFNLENBQUM7SUFDbkMsT0FBTyxJQUFJLENBQUMsZUFBZSxDQUFDLFVBQVUsQ0FBQyxDQUFDO0FBQzFDLENBQUM7Ozs7Ozs7QUFRRCxNQUFNLFVBQVUsYUFBYSxDQUFDLGdCQUF3QjtJQUNwRCxJQUFJLENBQUMsQ0FBQyxnQkFBZ0IsSUFBSSxXQUFXLENBQUMsRUFBRTtRQUN0QyxXQUFXLENBQUMsZ0JBQWdCLENBQUMsR0FBRyxNQUFNLENBQUMsRUFBRSxJQUFJLE1BQU0sQ0FBQyxFQUFFLENBQUMsTUFBTSxJQUFJLE1BQU0sQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLE9BQU87WUFDckYsTUFBTSxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLGdCQUFnQixDQUFDLENBQUM7S0FDaEQ7SUFDRCxPQUFPLFdBQVcsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO0FBQ3ZDLENBQUM7Ozs7O0FBS0QsTUFBTSxVQUFVLHVCQUF1QjtJQUNyQyxXQUFXLEdBQUcsRUFBRSxDQUFDO0FBQ25CLENBQUM7O0FBS0QsTUFBWSxlQUFlO0lBQ3pCLFFBQVEsR0FBSTtJQUNaLGdCQUFnQixHQUFBO0lBQ2hCLG9CQUFvQixHQUFBO0lBQ3BCLFVBQVUsR0FBQTtJQUNWLGNBQWMsR0FBQTtJQUNkLFlBQVksR0FBQTtJQUNaLGdCQUFnQixHQUFBO0lBQ2hCLElBQUksR0FBQTtJQUNKLGNBQWMsR0FBQTtJQUNkLFlBQVksR0FBQTtJQUNaLFVBQVUsSUFBQTtJQUNWLFVBQVUsSUFBQTtJQUNWLGNBQWMsSUFBQTtJQUNkLGFBQWEsSUFBQTtJQUNiLGFBQWEsSUFBQTtJQUNiLFlBQVksSUFBQTtJQUNaLGNBQWMsSUFBQTtJQUNkLFlBQVksSUFBQTtJQUNaLFVBQVUsSUFBQTtJQUNWLGNBQWMsSUFBQTtJQUNkLFVBQVUsSUFBQTtJQUNWLFNBQVMsSUFBQTtFQUNWOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBS0QsTUFBa0Isb0JBQW9CO0lBQ3BDLHFCQUFxQixHQUFJO0lBQ3pCLHdCQUF3QixHQUFBO0lBQ3hCLG9CQUFvQixHQUFBO0VBQ3JCOzs7QUFLRCxNQUFrQixhQUFhO0lBQUUsTUFBTSxHQUFJLEVBQUUsWUFBWSxHQUFBLEVBQUUsVUFBVSxHQUFBO0VBQUM7Ozs7Ozs7QUFLdEUsU0FBUyxlQUFlLENBQUMsTUFBYztJQUNyQyxPQUFPLE1BQU0sQ0FBQyxXQUFXLEVBQUUsQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxDQUFDO0FBQ2pELENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5pbXBvcnQgbG9jYWxlRW4gZnJvbSAnLi9sb2NhbGVfZW4nO1xuaW1wb3J0IHtnbG9iYWx9IGZyb20gJy4uL3V0aWwvZ2xvYmFsJztcblxuLyoqXG4gKiBUaGlzIGNvbnN0IGlzIHVzZWQgdG8gc3RvcmUgdGhlIGxvY2FsZSBkYXRhIHJlZ2lzdGVyZWQgd2l0aCBgcmVnaXN0ZXJMb2NhbGVEYXRhYFxuICovXG5sZXQgTE9DQUxFX0RBVEE6IHtbbG9jYWxlSWQ6IHN0cmluZ106IGFueX0gPSB7fTtcblxuLyoqXG4gKiBSZWdpc3RlciBsb2NhbGUgZGF0YSB0byBiZSB1c2VkIGludGVybmFsbHkgYnkgQW5ndWxhci4gU2VlIHRoZVxuICogW1wiSTE4biBndWlkZVwiXShndWlkZS9pMThuI2kxOG4tcGlwZXMpIHRvIGtub3cgaG93IHRvIGltcG9ydCBhZGRpdGlvbmFsIGxvY2FsZSBkYXRhLlxuICpcbiAqIFRoZSBzaWduYXR1cmUgYHJlZ2lzdGVyTG9jYWxlRGF0YShkYXRhOiBhbnksIGV4dHJhRGF0YT86IGFueSlgIGlzIGRlcHJlY2F0ZWQgc2luY2UgdjUuMVxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVnaXN0ZXJMb2NhbGVEYXRhKGRhdGE6IGFueSwgbG9jYWxlSWQ/OiBzdHJpbmcgfCBhbnksIGV4dHJhRGF0YT86IGFueSk6IHZvaWQge1xuICBpZiAodHlwZW9mIGxvY2FsZUlkICE9PSAnc3RyaW5nJykge1xuICAgIGV4dHJhRGF0YSA9IGxvY2FsZUlkO1xuICAgIGxvY2FsZUlkID0gZGF0YVtMb2NhbGVEYXRhSW5kZXguTG9jYWxlSWRdO1xuICB9XG5cbiAgbG9jYWxlSWQgPSBsb2NhbGVJZC50b0xvd2VyQ2FzZSgpLnJlcGxhY2UoL18vZywgJy0nKTtcblxuICBMT0NBTEVfREFUQVtsb2NhbGVJZF0gPSBkYXRhO1xuXG4gIGlmIChleHRyYURhdGEpIHtcbiAgICBMT0NBTEVfREFUQVtsb2NhbGVJZF1bTG9jYWxlRGF0YUluZGV4LkV4dHJhRGF0YV0gPSBleHRyYURhdGE7XG4gIH1cbn1cblxuLyoqXG4gKiBGaW5kcyB0aGUgbG9jYWxlIGRhdGEgZm9yIGEgZ2l2ZW4gbG9jYWxlLlxuICpcbiAqIEBwYXJhbSBsb2NhbGUgVGhlIGxvY2FsZSBjb2RlLlxuICogQHJldHVybnMgVGhlIGxvY2FsZSBkYXRhLlxuICogQHNlZSBbSW50ZXJuYXRpb25hbGl6YXRpb24gKGkxOG4pIEd1aWRlXShodHRwczovL2FuZ3VsYXIuaW8vZ3VpZGUvaTE4bilcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGZpbmRMb2NhbGVEYXRhKGxvY2FsZTogc3RyaW5nKTogYW55IHtcbiAgY29uc3Qgbm9ybWFsaXplZExvY2FsZSA9IG5vcm1hbGl6ZUxvY2FsZShsb2NhbGUpO1xuXG4gIGxldCBtYXRjaCA9IGdldExvY2FsZURhdGEobm9ybWFsaXplZExvY2FsZSk7XG4gIGlmIChtYXRjaCkge1xuICAgIHJldHVybiBtYXRjaDtcbiAgfVxuXG4gIC8vIGxldCdzIHRyeSB0byBmaW5kIGEgcGFyZW50IGxvY2FsZVxuICBjb25zdCBwYXJlbnRMb2NhbGUgPSBub3JtYWxpemVkTG9jYWxlLnNwbGl0KCctJylbMF07XG4gIG1hdGNoID0gZ2V0TG9jYWxlRGF0YShwYXJlbnRMb2NhbGUpO1xuICBpZiAobWF0Y2gpIHtcbiAgICByZXR1cm4gbWF0Y2g7XG4gIH1cblxuICBpZiAocGFyZW50TG9jYWxlID09PSAnZW4nKSB7XG4gICAgcmV0dXJuIGxvY2FsZUVuO1xuICB9XG5cbiAgdGhyb3cgbmV3IEVycm9yKGBNaXNzaW5nIGxvY2FsZSBkYXRhIGZvciB0aGUgbG9jYWxlIFwiJHtsb2NhbGV9XCIuYCk7XG59XG5cbi8qKlxuICogUmV0cmlldmVzIHRoZSBkZWZhdWx0IGN1cnJlbmN5IGNvZGUgZm9yIHRoZSBnaXZlbiBsb2NhbGUuXG4gKlxuICogVGhlIGRlZmF1bHQgaXMgZGVmaW5lZCBhcyB0aGUgZmlyc3QgY3VycmVuY3kgd2hpY2ggaXMgc3RpbGwgaW4gdXNlLlxuICpcbiAqIEBwYXJhbSBsb2NhbGUgVGhlIGNvZGUgb2YgdGhlIGxvY2FsZSB3aG9zZSBjdXJyZW5jeSBjb2RlIHdlIHdhbnQuXG4gKiBAcmV0dXJucyBUaGUgY29kZSBvZiB0aGUgZGVmYXVsdCBjdXJyZW5jeSBmb3IgdGhlIGdpdmVuIGxvY2FsZS5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRMb2NhbGVDdXJyZW5jeUNvZGUobG9jYWxlOiBzdHJpbmcpOiBzdHJpbmd8bnVsbCB7XG4gIGNvbnN0IGRhdGEgPSBmaW5kTG9jYWxlRGF0YShsb2NhbGUpO1xuICByZXR1cm4gZGF0YVtMb2NhbGVEYXRhSW5kZXguQ3VycmVuY3lDb2RlXSB8fCBudWxsO1xufVxuXG4vKipcbiAqIFJldHJpZXZlcyB0aGUgcGx1cmFsIGZ1bmN0aW9uIHVzZWQgYnkgSUNVIGV4cHJlc3Npb25zIHRvIGRldGVybWluZSB0aGUgcGx1cmFsIGNhc2UgdG8gdXNlXG4gKiBmb3IgYSBnaXZlbiBsb2NhbGUuXG4gKiBAcGFyYW0gbG9jYWxlIEEgbG9jYWxlIGNvZGUgZm9yIHRoZSBsb2NhbGUgZm9ybWF0IHJ1bGVzIHRvIHVzZS5cbiAqIEByZXR1cm5zIFRoZSBwbHVyYWwgZnVuY3Rpb24gZm9yIHRoZSBsb2NhbGUuXG4gKiBAc2VlIGBOZ1BsdXJhbGBcbiAqIEBzZWUgW0ludGVybmF0aW9uYWxpemF0aW9uIChpMThuKSBHdWlkZV0oaHR0cHM6Ly9hbmd1bGFyLmlvL2d1aWRlL2kxOG4pXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRMb2NhbGVQbHVyYWxDYXNlKGxvY2FsZTogc3RyaW5nKTogKHZhbHVlOiBudW1iZXIpID0+IG51bWJlciB7XG4gIGNvbnN0IGRhdGEgPSBmaW5kTG9jYWxlRGF0YShsb2NhbGUpO1xuICByZXR1cm4gZGF0YVtMb2NhbGVEYXRhSW5kZXguUGx1cmFsQ2FzZV07XG59XG5cblxuXG4vKipcbiAqIEhlbHBlciBmdW5jdGlvbiB0byBnZXQgdGhlIGdpdmVuIGBub3JtYWxpemVkTG9jYWxlYCBmcm9tIGBMT0NBTEVfREFUQWBcbiAqIG9yIGZyb20gdGhlIGdsb2JhbCBgbmcuY29tbW9uLmxvY2FsZWAuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRMb2NhbGVEYXRhKG5vcm1hbGl6ZWRMb2NhbGU6IHN0cmluZyk6IGFueSB7XG4gIGlmICghKG5vcm1hbGl6ZWRMb2NhbGUgaW4gTE9DQUxFX0RBVEEpKSB7XG4gICAgTE9DQUxFX0RBVEFbbm9ybWFsaXplZExvY2FsZV0gPSBnbG9iYWwubmcgJiYgZ2xvYmFsLm5nLmNvbW1vbiAmJiBnbG9iYWwubmcuY29tbW9uLmxvY2FsZXMgJiZcbiAgICAgICAgZ2xvYmFsLm5nLmNvbW1vbi5sb2NhbGVzW25vcm1hbGl6ZWRMb2NhbGVdO1xuICB9XG4gIHJldHVybiBMT0NBTEVfREFUQVtub3JtYWxpemVkTG9jYWxlXTtcbn1cblxuLyoqXG4gKiBIZWxwZXIgZnVuY3Rpb24gdG8gcmVtb3ZlIGFsbCB0aGUgbG9jYWxlIGRhdGEgZnJvbSBgTE9DQUxFX0RBVEFgLlxuICovXG5leHBvcnQgZnVuY3Rpb24gdW5yZWdpc3RlckFsbExvY2FsZURhdGEoKSB7XG4gIExPQ0FMRV9EQVRBID0ge307XG59XG5cbi8qKlxuICogSW5kZXggb2YgZWFjaCB0eXBlIG9mIGxvY2FsZSBkYXRhIGZyb20gdGhlIGxvY2FsZSBkYXRhIGFycmF5XG4gKi9cbmV4cG9ydCBlbnVtIExvY2FsZURhdGFJbmRleCB7XG4gIExvY2FsZUlkID0gMCxcbiAgRGF5UGVyaW9kc0Zvcm1hdCxcbiAgRGF5UGVyaW9kc1N0YW5kYWxvbmUsXG4gIERheXNGb3JtYXQsXG4gIERheXNTdGFuZGFsb25lLFxuICBNb250aHNGb3JtYXQsXG4gIE1vbnRoc1N0YW5kYWxvbmUsXG4gIEVyYXMsXG4gIEZpcnN0RGF5T2ZXZWVrLFxuICBXZWVrZW5kUmFuZ2UsXG4gIERhdGVGb3JtYXQsXG4gIFRpbWVGb3JtYXQsXG4gIERhdGVUaW1lRm9ybWF0LFxuICBOdW1iZXJTeW1ib2xzLFxuICBOdW1iZXJGb3JtYXRzLFxuICBDdXJyZW5jeUNvZGUsXG4gIEN1cnJlbmN5U3ltYm9sLFxuICBDdXJyZW5jeU5hbWUsXG4gIEN1cnJlbmNpZXMsXG4gIERpcmVjdGlvbmFsaXR5LFxuICBQbHVyYWxDYXNlLFxuICBFeHRyYURhdGFcbn1cblxuLyoqXG4gKiBJbmRleCBvZiBlYWNoIHR5cGUgb2YgbG9jYWxlIGRhdGEgZnJvbSB0aGUgZXh0cmEgbG9jYWxlIGRhdGEgYXJyYXlcbiAqL1xuZXhwb3J0IGNvbnN0IGVudW0gRXh0cmFMb2NhbGVEYXRhSW5kZXgge1xuICBFeHRyYURheVBlcmlvZEZvcm1hdHMgPSAwLFxuICBFeHRyYURheVBlcmlvZFN0YW5kYWxvbmUsXG4gIEV4dHJhRGF5UGVyaW9kc1J1bGVzXG59XG5cbi8qKlxuICogSW5kZXggb2YgZWFjaCB2YWx1ZSBpbiBjdXJyZW5jeSBkYXRhICh1c2VkIHRvIGRlc2NyaWJlIENVUlJFTkNJRVNfRU4gaW4gY3VycmVuY2llcy50cylcbiAqL1xuZXhwb3J0IGNvbnN0IGVudW0gQ3VycmVuY3lJbmRleCB7U3ltYm9sID0gMCwgU3ltYm9sTmFycm93LCBOYk9mRGlnaXRzfVxuXG4vKipcbiAqIFJldHVybnMgdGhlIGNhbm9uaWNhbCBmb3JtIG9mIGEgbG9jYWxlIG5hbWUgLSBsb3dlcmNhc2Ugd2l0aCBgX2AgcmVwbGFjZWQgd2l0aCBgLWAuXG4gKi9cbmZ1bmN0aW9uIG5vcm1hbGl6ZUxvY2FsZShsb2NhbGU6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBsb2NhbGUudG9Mb3dlckNhc2UoKS5yZXBsYWNlKC9fL2csICctJyk7XG59XG4iXX0=