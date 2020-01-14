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
    PluralCase: 19,
    ExtraData: 20,
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9jYWxlX2RhdGFfYXBpLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvaTE4bi9sb2NhbGVfZGF0YV9hcGkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBT0EsT0FBTyxRQUFRLE1BQU0sYUFBYSxDQUFDO0FBQ25DLE9BQU8sRUFBQyxNQUFNLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQzs7Ozs7SUFLbEMsV0FBVyxHQUE4QixFQUFFOzs7Ozs7Ozs7OztBQVEvQyxNQUFNLFVBQVUsa0JBQWtCLENBQUMsSUFBUyxFQUFFLFFBQXVCLEVBQUUsU0FBZTtJQUNwRixJQUFJLE9BQU8sUUFBUSxLQUFLLFFBQVEsRUFBRTtRQUNoQyxTQUFTLEdBQUcsUUFBUSxDQUFDO1FBQ3JCLFFBQVEsR0FBRyxJQUFJLENBQUMsZUFBZSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0tBQzNDO0lBRUQsUUFBUSxHQUFHLFFBQVEsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxDQUFDO0lBRXJELFdBQVcsQ0FBQyxRQUFRLENBQUMsR0FBRyxJQUFJLENBQUM7SUFFN0IsSUFBSSxTQUFTLEVBQUU7UUFDYixXQUFXLENBQUMsUUFBUSxDQUFDLENBQUMsZUFBZSxDQUFDLFNBQVMsQ0FBQyxHQUFHLFNBQVMsQ0FBQztLQUM5RDtBQUNILENBQUM7Ozs7Ozs7O0FBU0QsTUFBTSxVQUFVLGNBQWMsQ0FBQyxNQUFjOztVQUNyQyxnQkFBZ0IsR0FBRyxlQUFlLENBQUMsTUFBTSxDQUFDOztRQUU1QyxLQUFLLEdBQUcsYUFBYSxDQUFDLGdCQUFnQixDQUFDO0lBQzNDLElBQUksS0FBSyxFQUFFO1FBQ1QsT0FBTyxLQUFLLENBQUM7S0FDZDs7O1VBR0ssWUFBWSxHQUFHLGdCQUFnQixDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDbkQsS0FBSyxHQUFHLGFBQWEsQ0FBQyxZQUFZLENBQUMsQ0FBQztJQUNwQyxJQUFJLEtBQUssRUFBRTtRQUNULE9BQU8sS0FBSyxDQUFDO0tBQ2Q7SUFFRCxJQUFJLFlBQVksS0FBSyxJQUFJLEVBQUU7UUFDekIsT0FBTyxRQUFRLENBQUM7S0FDakI7SUFFRCxNQUFNLElBQUksS0FBSyxDQUFDLHVDQUF1QyxNQUFNLElBQUksQ0FBQyxDQUFDO0FBQ3JFLENBQUM7Ozs7Ozs7Ozs7O0FBWUQsTUFBTSxVQUFVLHFCQUFxQixDQUFDLE1BQWM7O1VBQzVDLElBQUksR0FBRyxjQUFjLENBQUMsTUFBTSxDQUFDO0lBQ25DLE9BQU8sSUFBSSxDQUFDLGVBQWUsQ0FBQyxZQUFZLENBQUMsSUFBSSxJQUFJLENBQUM7QUFDcEQsQ0FBQzs7Ozs7Ozs7QUFVRCxNQUFNLFVBQVUsbUJBQW1CLENBQUMsTUFBYzs7VUFDMUMsSUFBSSxHQUFHLGNBQWMsQ0FBQyxNQUFNLENBQUM7SUFDbkMsT0FBTyxJQUFJLENBQUMsZUFBZSxDQUFDLFVBQVUsQ0FBQyxDQUFDO0FBQzFDLENBQUM7Ozs7Ozs7QUFRRCxNQUFNLFVBQVUsYUFBYSxDQUFDLGdCQUF3QjtJQUNwRCxJQUFJLENBQUMsQ0FBQyxnQkFBZ0IsSUFBSSxXQUFXLENBQUMsRUFBRTtRQUN0QyxXQUFXLENBQUMsZ0JBQWdCLENBQUMsR0FBRyxNQUFNLENBQUMsRUFBRSxJQUFJLE1BQU0sQ0FBQyxFQUFFLENBQUMsTUFBTSxJQUFJLE1BQU0sQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLE9BQU87WUFDckYsTUFBTSxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLGdCQUFnQixDQUFDLENBQUM7S0FDaEQ7SUFDRCxPQUFPLFdBQVcsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO0FBQ3ZDLENBQUM7Ozs7O0FBS0QsTUFBTSxVQUFVLHVCQUF1QjtJQUNyQyxXQUFXLEdBQUcsRUFBRSxDQUFDO0FBQ25CLENBQUM7O0FBS0QsTUFBWSxlQUFlO0lBQ3pCLFFBQVEsR0FBSTtJQUNaLGdCQUFnQixHQUFBO0lBQ2hCLG9CQUFvQixHQUFBO0lBQ3BCLFVBQVUsR0FBQTtJQUNWLGNBQWMsR0FBQTtJQUNkLFlBQVksR0FBQTtJQUNaLGdCQUFnQixHQUFBO0lBQ2hCLElBQUksR0FBQTtJQUNKLGNBQWMsR0FBQTtJQUNkLFlBQVksR0FBQTtJQUNaLFVBQVUsSUFBQTtJQUNWLFVBQVUsSUFBQTtJQUNWLGNBQWMsSUFBQTtJQUNkLGFBQWEsSUFBQTtJQUNiLGFBQWEsSUFBQTtJQUNiLFlBQVksSUFBQTtJQUNaLGNBQWMsSUFBQTtJQUNkLFlBQVksSUFBQTtJQUNaLFVBQVUsSUFBQTtJQUNWLFVBQVUsSUFBQTtJQUNWLFNBQVMsSUFBQTtFQUNWOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFLRCxNQUFrQixvQkFBb0I7SUFDcEMscUJBQXFCLEdBQUk7SUFDekIsd0JBQXdCLEdBQUE7SUFDeEIsb0JBQW9CLEdBQUE7RUFDckI7OztBQUtELE1BQWtCLGFBQWE7SUFBRSxNQUFNLEdBQUksRUFBRSxZQUFZLEdBQUEsRUFBRSxVQUFVLEdBQUE7RUFBQzs7Ozs7OztBQUt0RSxTQUFTLGVBQWUsQ0FBQyxNQUFjO0lBQ3JDLE9BQU8sTUFBTSxDQUFDLFdBQVcsRUFBRSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUM7QUFDakQsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cbmltcG9ydCBsb2NhbGVFbiBmcm9tICcuL2xvY2FsZV9lbic7XG5pbXBvcnQge2dsb2JhbH0gZnJvbSAnLi4vdXRpbC9nbG9iYWwnO1xuXG4vKipcbiAqIFRoaXMgY29uc3QgaXMgdXNlZCB0byBzdG9yZSB0aGUgbG9jYWxlIGRhdGEgcmVnaXN0ZXJlZCB3aXRoIGByZWdpc3RlckxvY2FsZURhdGFgXG4gKi9cbmxldCBMT0NBTEVfREFUQToge1tsb2NhbGVJZDogc3RyaW5nXTogYW55fSA9IHt9O1xuXG4vKipcbiAqIFJlZ2lzdGVyIGxvY2FsZSBkYXRhIHRvIGJlIHVzZWQgaW50ZXJuYWxseSBieSBBbmd1bGFyLiBTZWUgdGhlXG4gKiBbXCJJMThuIGd1aWRlXCJdKGd1aWRlL2kxOG4jaTE4bi1waXBlcykgdG8ga25vdyBob3cgdG8gaW1wb3J0IGFkZGl0aW9uYWwgbG9jYWxlIGRhdGEuXG4gKlxuICogVGhlIHNpZ25hdHVyZSBgcmVnaXN0ZXJMb2NhbGVEYXRhKGRhdGE6IGFueSwgZXh0cmFEYXRhPzogYW55KWAgaXMgZGVwcmVjYXRlZCBzaW5jZSB2NS4xXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZWdpc3RlckxvY2FsZURhdGEoZGF0YTogYW55LCBsb2NhbGVJZD86IHN0cmluZyB8IGFueSwgZXh0cmFEYXRhPzogYW55KTogdm9pZCB7XG4gIGlmICh0eXBlb2YgbG9jYWxlSWQgIT09ICdzdHJpbmcnKSB7XG4gICAgZXh0cmFEYXRhID0gbG9jYWxlSWQ7XG4gICAgbG9jYWxlSWQgPSBkYXRhW0xvY2FsZURhdGFJbmRleC5Mb2NhbGVJZF07XG4gIH1cblxuICBsb2NhbGVJZCA9IGxvY2FsZUlkLnRvTG93ZXJDYXNlKCkucmVwbGFjZSgvXy9nLCAnLScpO1xuXG4gIExPQ0FMRV9EQVRBW2xvY2FsZUlkXSA9IGRhdGE7XG5cbiAgaWYgKGV4dHJhRGF0YSkge1xuICAgIExPQ0FMRV9EQVRBW2xvY2FsZUlkXVtMb2NhbGVEYXRhSW5kZXguRXh0cmFEYXRhXSA9IGV4dHJhRGF0YTtcbiAgfVxufVxuXG4vKipcbiAqIEZpbmRzIHRoZSBsb2NhbGUgZGF0YSBmb3IgYSBnaXZlbiBsb2NhbGUuXG4gKlxuICogQHBhcmFtIGxvY2FsZSBUaGUgbG9jYWxlIGNvZGUuXG4gKiBAcmV0dXJucyBUaGUgbG9jYWxlIGRhdGEuXG4gKiBAc2VlIFtJbnRlcm5hdGlvbmFsaXphdGlvbiAoaTE4bikgR3VpZGVdKGh0dHBzOi8vYW5ndWxhci5pby9ndWlkZS9pMThuKVxuICovXG5leHBvcnQgZnVuY3Rpb24gZmluZExvY2FsZURhdGEobG9jYWxlOiBzdHJpbmcpOiBhbnkge1xuICBjb25zdCBub3JtYWxpemVkTG9jYWxlID0gbm9ybWFsaXplTG9jYWxlKGxvY2FsZSk7XG5cbiAgbGV0IG1hdGNoID0gZ2V0TG9jYWxlRGF0YShub3JtYWxpemVkTG9jYWxlKTtcbiAgaWYgKG1hdGNoKSB7XG4gICAgcmV0dXJuIG1hdGNoO1xuICB9XG5cbiAgLy8gbGV0J3MgdHJ5IHRvIGZpbmQgYSBwYXJlbnQgbG9jYWxlXG4gIGNvbnN0IHBhcmVudExvY2FsZSA9IG5vcm1hbGl6ZWRMb2NhbGUuc3BsaXQoJy0nKVswXTtcbiAgbWF0Y2ggPSBnZXRMb2NhbGVEYXRhKHBhcmVudExvY2FsZSk7XG4gIGlmIChtYXRjaCkge1xuICAgIHJldHVybiBtYXRjaDtcbiAgfVxuXG4gIGlmIChwYXJlbnRMb2NhbGUgPT09ICdlbicpIHtcbiAgICByZXR1cm4gbG9jYWxlRW47XG4gIH1cblxuICB0aHJvdyBuZXcgRXJyb3IoYE1pc3NpbmcgbG9jYWxlIGRhdGEgZm9yIHRoZSBsb2NhbGUgXCIke2xvY2FsZX1cIi5gKTtcbn1cblxuLyoqXG4gKiBSZXRyaWV2ZXMgdGhlIGRlZmF1bHQgY3VycmVuY3kgY29kZSBmb3IgdGhlIGdpdmVuIGxvY2FsZS5cbiAqXG4gKiBUaGUgZGVmYXVsdCBpcyBkZWZpbmVkIGFzIHRoZSBmaXJzdCBjdXJyZW5jeSB3aGljaCBpcyBzdGlsbCBpbiB1c2UuXG4gKlxuICogQHBhcmFtIGxvY2FsZSBUaGUgY29kZSBvZiB0aGUgbG9jYWxlIHdob3NlIGN1cnJlbmN5IGNvZGUgd2Ugd2FudC5cbiAqIEByZXR1cm5zIFRoZSBjb2RlIG9mIHRoZSBkZWZhdWx0IGN1cnJlbmN5IGZvciB0aGUgZ2l2ZW4gbG9jYWxlLlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldExvY2FsZUN1cnJlbmN5Q29kZShsb2NhbGU6IHN0cmluZyk6IHN0cmluZ3xudWxsIHtcbiAgY29uc3QgZGF0YSA9IGZpbmRMb2NhbGVEYXRhKGxvY2FsZSk7XG4gIHJldHVybiBkYXRhW0xvY2FsZURhdGFJbmRleC5DdXJyZW5jeUNvZGVdIHx8IG51bGw7XG59XG5cbi8qKlxuICogUmV0cmlldmVzIHRoZSBwbHVyYWwgZnVuY3Rpb24gdXNlZCBieSBJQ1UgZXhwcmVzc2lvbnMgdG8gZGV0ZXJtaW5lIHRoZSBwbHVyYWwgY2FzZSB0byB1c2VcbiAqIGZvciBhIGdpdmVuIGxvY2FsZS5cbiAqIEBwYXJhbSBsb2NhbGUgQSBsb2NhbGUgY29kZSBmb3IgdGhlIGxvY2FsZSBmb3JtYXQgcnVsZXMgdG8gdXNlLlxuICogQHJldHVybnMgVGhlIHBsdXJhbCBmdW5jdGlvbiBmb3IgdGhlIGxvY2FsZS5cbiAqIEBzZWUgYE5nUGx1cmFsYFxuICogQHNlZSBbSW50ZXJuYXRpb25hbGl6YXRpb24gKGkxOG4pIEd1aWRlXShodHRwczovL2FuZ3VsYXIuaW8vZ3VpZGUvaTE4bilcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldExvY2FsZVBsdXJhbENhc2UobG9jYWxlOiBzdHJpbmcpOiAodmFsdWU6IG51bWJlcikgPT4gbnVtYmVyIHtcbiAgY29uc3QgZGF0YSA9IGZpbmRMb2NhbGVEYXRhKGxvY2FsZSk7XG4gIHJldHVybiBkYXRhW0xvY2FsZURhdGFJbmRleC5QbHVyYWxDYXNlXTtcbn1cblxuXG5cbi8qKlxuICogSGVscGVyIGZ1bmN0aW9uIHRvIGdldCB0aGUgZ2l2ZW4gYG5vcm1hbGl6ZWRMb2NhbGVgIGZyb20gYExPQ0FMRV9EQVRBYFxuICogb3IgZnJvbSB0aGUgZ2xvYmFsIGBuZy5jb21tb24ubG9jYWxlYC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldExvY2FsZURhdGEobm9ybWFsaXplZExvY2FsZTogc3RyaW5nKTogYW55IHtcbiAgaWYgKCEobm9ybWFsaXplZExvY2FsZSBpbiBMT0NBTEVfREFUQSkpIHtcbiAgICBMT0NBTEVfREFUQVtub3JtYWxpemVkTG9jYWxlXSA9IGdsb2JhbC5uZyAmJiBnbG9iYWwubmcuY29tbW9uICYmIGdsb2JhbC5uZy5jb21tb24ubG9jYWxlcyAmJlxuICAgICAgICBnbG9iYWwubmcuY29tbW9uLmxvY2FsZXNbbm9ybWFsaXplZExvY2FsZV07XG4gIH1cbiAgcmV0dXJuIExPQ0FMRV9EQVRBW25vcm1hbGl6ZWRMb2NhbGVdO1xufVxuXG4vKipcbiAqIEhlbHBlciBmdW5jdGlvbiB0byByZW1vdmUgYWxsIHRoZSBsb2NhbGUgZGF0YSBmcm9tIGBMT0NBTEVfREFUQWAuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB1bnJlZ2lzdGVyQWxsTG9jYWxlRGF0YSgpIHtcbiAgTE9DQUxFX0RBVEEgPSB7fTtcbn1cblxuLyoqXG4gKiBJbmRleCBvZiBlYWNoIHR5cGUgb2YgbG9jYWxlIGRhdGEgZnJvbSB0aGUgbG9jYWxlIGRhdGEgYXJyYXlcbiAqL1xuZXhwb3J0IGVudW0gTG9jYWxlRGF0YUluZGV4IHtcbiAgTG9jYWxlSWQgPSAwLFxuICBEYXlQZXJpb2RzRm9ybWF0LFxuICBEYXlQZXJpb2RzU3RhbmRhbG9uZSxcbiAgRGF5c0Zvcm1hdCxcbiAgRGF5c1N0YW5kYWxvbmUsXG4gIE1vbnRoc0Zvcm1hdCxcbiAgTW9udGhzU3RhbmRhbG9uZSxcbiAgRXJhcyxcbiAgRmlyc3REYXlPZldlZWssXG4gIFdlZWtlbmRSYW5nZSxcbiAgRGF0ZUZvcm1hdCxcbiAgVGltZUZvcm1hdCxcbiAgRGF0ZVRpbWVGb3JtYXQsXG4gIE51bWJlclN5bWJvbHMsXG4gIE51bWJlckZvcm1hdHMsXG4gIEN1cnJlbmN5Q29kZSxcbiAgQ3VycmVuY3lTeW1ib2wsXG4gIEN1cnJlbmN5TmFtZSxcbiAgQ3VycmVuY2llcyxcbiAgUGx1cmFsQ2FzZSxcbiAgRXh0cmFEYXRhXG59XG5cbi8qKlxuICogSW5kZXggb2YgZWFjaCB0eXBlIG9mIGxvY2FsZSBkYXRhIGZyb20gdGhlIGV4dHJhIGxvY2FsZSBkYXRhIGFycmF5XG4gKi9cbmV4cG9ydCBjb25zdCBlbnVtIEV4dHJhTG9jYWxlRGF0YUluZGV4IHtcbiAgRXh0cmFEYXlQZXJpb2RGb3JtYXRzID0gMCxcbiAgRXh0cmFEYXlQZXJpb2RTdGFuZGFsb25lLFxuICBFeHRyYURheVBlcmlvZHNSdWxlc1xufVxuXG4vKipcbiAqIEluZGV4IG9mIGVhY2ggdmFsdWUgaW4gY3VycmVuY3kgZGF0YSAodXNlZCB0byBkZXNjcmliZSBDVVJSRU5DSUVTX0VOIGluIGN1cnJlbmNpZXMudHMpXG4gKi9cbmV4cG9ydCBjb25zdCBlbnVtIEN1cnJlbmN5SW5kZXgge1N5bWJvbCA9IDAsIFN5bWJvbE5hcnJvdywgTmJPZkRpZ2l0c31cblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBjYW5vbmljYWwgZm9ybSBvZiBhIGxvY2FsZSBuYW1lIC0gbG93ZXJjYXNlIHdpdGggYF9gIHJlcGxhY2VkIHdpdGggYC1gLlxuICovXG5mdW5jdGlvbiBub3JtYWxpemVMb2NhbGUobG9jYWxlOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gbG9jYWxlLnRvTG93ZXJDYXNlKCkucmVwbGFjZSgvXy9nLCAnLScpO1xufSJdfQ==