/**
 * @fileoverview added by tsickle
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
    CurrencySymbol: 15,
    CurrencyName: 16,
    Currencies: 17,
    PluralCase: 18,
    ExtraData: 19,
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9jYWxlX2RhdGFfYXBpLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvaTE4bi9sb2NhbGVfZGF0YV9hcGkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFPQSxPQUFPLFFBQVEsTUFBTSxhQUFhLENBQUM7QUFDbkMsT0FBTyxFQUFDLE1BQU0sRUFBQyxNQUFNLGdCQUFnQixDQUFDOzs7OztJQUtsQyxXQUFXLEdBQThCLEVBQUU7Ozs7Ozs7Ozs7O0FBUS9DLE1BQU0sVUFBVSxrQkFBa0IsQ0FBQyxJQUFTLEVBQUUsUUFBdUIsRUFBRSxTQUFlO0lBQ3BGLElBQUksT0FBTyxRQUFRLEtBQUssUUFBUSxFQUFFO1FBQ2hDLFNBQVMsR0FBRyxRQUFRLENBQUM7UUFDckIsUUFBUSxHQUFHLElBQUksQ0FBQyxlQUFlLENBQUMsUUFBUSxDQUFDLENBQUM7S0FDM0M7SUFFRCxRQUFRLEdBQUcsUUFBUSxDQUFDLFdBQVcsRUFBRSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUM7SUFFckQsV0FBVyxDQUFDLFFBQVEsQ0FBQyxHQUFHLElBQUksQ0FBQztJQUU3QixJQUFJLFNBQVMsRUFBRTtRQUNiLFdBQVcsQ0FBQyxRQUFRLENBQUMsQ0FBQyxlQUFlLENBQUMsU0FBUyxDQUFDLEdBQUcsU0FBUyxDQUFDO0tBQzlEO0FBQ0gsQ0FBQzs7Ozs7Ozs7QUFTRCxNQUFNLFVBQVUsY0FBYyxDQUFDLE1BQWM7O1VBQ3JDLGdCQUFnQixHQUFHLGVBQWUsQ0FBQyxNQUFNLENBQUM7O1FBRTVDLEtBQUssR0FBRyxhQUFhLENBQUMsZ0JBQWdCLENBQUM7SUFDM0MsSUFBSSxLQUFLLEVBQUU7UUFDVCxPQUFPLEtBQUssQ0FBQztLQUNkOzs7VUFHSyxZQUFZLEdBQUcsZ0JBQWdCLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNuRCxLQUFLLEdBQUcsYUFBYSxDQUFDLFlBQVksQ0FBQyxDQUFDO0lBQ3BDLElBQUksS0FBSyxFQUFFO1FBQ1QsT0FBTyxLQUFLLENBQUM7S0FDZDtJQUVELElBQUksWUFBWSxLQUFLLElBQUksRUFBRTtRQUN6QixPQUFPLFFBQVEsQ0FBQztLQUNqQjtJQUVELE1BQU0sSUFBSSxLQUFLLENBQUMsdUNBQXVDLE1BQU0sSUFBSSxDQUFDLENBQUM7QUFDckUsQ0FBQzs7Ozs7Ozs7QUFVRCxNQUFNLFVBQVUsbUJBQW1CLENBQUMsTUFBYzs7VUFDMUMsSUFBSSxHQUFHLGNBQWMsQ0FBQyxNQUFNLENBQUM7SUFDbkMsT0FBTyxJQUFJLENBQUMsZUFBZSxDQUFDLFVBQVUsQ0FBQyxDQUFDO0FBQzFDLENBQUM7Ozs7Ozs7QUFRRCxNQUFNLFVBQVUsYUFBYSxDQUFDLGdCQUF3QjtJQUNwRCxJQUFJLENBQUMsQ0FBQyxnQkFBZ0IsSUFBSSxXQUFXLENBQUMsRUFBRTtRQUN0QyxXQUFXLENBQUMsZ0JBQWdCLENBQUMsR0FBRyxNQUFNLENBQUMsRUFBRSxJQUFJLE1BQU0sQ0FBQyxFQUFFLENBQUMsTUFBTSxJQUFJLE1BQU0sQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLE9BQU87WUFDckYsTUFBTSxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLGdCQUFnQixDQUFDLENBQUM7S0FDaEQ7SUFDRCxPQUFPLFdBQVcsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO0FBQ3ZDLENBQUM7Ozs7O0FBS0QsTUFBTSxVQUFVLHVCQUF1QjtJQUNyQyxXQUFXLEdBQUcsRUFBRSxDQUFDO0FBQ25CLENBQUM7OztJQU1DLFdBQVk7SUFDWixtQkFBZ0I7SUFDaEIsdUJBQW9CO0lBQ3BCLGFBQVU7SUFDVixpQkFBYztJQUNkLGVBQVk7SUFDWixtQkFBZ0I7SUFDaEIsT0FBSTtJQUNKLGlCQUFjO0lBQ2QsZUFBWTtJQUNaLGNBQVU7SUFDVixjQUFVO0lBQ1Ysa0JBQWM7SUFDZCxpQkFBYTtJQUNiLGlCQUFhO0lBQ2Isa0JBQWM7SUFDZCxnQkFBWTtJQUNaLGNBQVU7SUFDVixjQUFVO0lBQ1YsYUFBUzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQU9ULHdCQUF5QjtJQUN6QiwyQkFBd0I7SUFDeEIsdUJBQW9COzs7OztJQU1XLFNBQVUsRUFBRSxlQUFZLEVBQUUsYUFBVTs7Ozs7Ozs7QUFLckUsU0FBUyxlQUFlLENBQUMsTUFBYztJQUNyQyxPQUFPLE1BQU0sQ0FBQyxXQUFXLEVBQUUsQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxDQUFDO0FBQ2pELENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5pbXBvcnQgbG9jYWxlRW4gZnJvbSAnLi9sb2NhbGVfZW4nO1xuaW1wb3J0IHtnbG9iYWx9IGZyb20gJy4uL3V0aWwvZ2xvYmFsJztcblxuLyoqXG4gKiBUaGlzIGNvbnN0IGlzIHVzZWQgdG8gc3RvcmUgdGhlIGxvY2FsZSBkYXRhIHJlZ2lzdGVyZWQgd2l0aCBgcmVnaXN0ZXJMb2NhbGVEYXRhYFxuICovXG5sZXQgTE9DQUxFX0RBVEE6IHtbbG9jYWxlSWQ6IHN0cmluZ106IGFueX0gPSB7fTtcblxuLyoqXG4gKiBSZWdpc3RlciBsb2NhbGUgZGF0YSB0byBiZSB1c2VkIGludGVybmFsbHkgYnkgQW5ndWxhci4gU2VlIHRoZVxuICogW1wiSTE4biBndWlkZVwiXShndWlkZS9pMThuI2kxOG4tcGlwZXMpIHRvIGtub3cgaG93IHRvIGltcG9ydCBhZGRpdGlvbmFsIGxvY2FsZSBkYXRhLlxuICpcbiAqIFRoZSBzaWduYXR1cmUgYHJlZ2lzdGVyTG9jYWxlRGF0YShkYXRhOiBhbnksIGV4dHJhRGF0YT86IGFueSlgIGlzIGRlcHJlY2F0ZWQgc2luY2UgdjUuMVxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVnaXN0ZXJMb2NhbGVEYXRhKGRhdGE6IGFueSwgbG9jYWxlSWQ/OiBzdHJpbmcgfCBhbnksIGV4dHJhRGF0YT86IGFueSk6IHZvaWQge1xuICBpZiAodHlwZW9mIGxvY2FsZUlkICE9PSAnc3RyaW5nJykge1xuICAgIGV4dHJhRGF0YSA9IGxvY2FsZUlkO1xuICAgIGxvY2FsZUlkID0gZGF0YVtMb2NhbGVEYXRhSW5kZXguTG9jYWxlSWRdO1xuICB9XG5cbiAgbG9jYWxlSWQgPSBsb2NhbGVJZC50b0xvd2VyQ2FzZSgpLnJlcGxhY2UoL18vZywgJy0nKTtcblxuICBMT0NBTEVfREFUQVtsb2NhbGVJZF0gPSBkYXRhO1xuXG4gIGlmIChleHRyYURhdGEpIHtcbiAgICBMT0NBTEVfREFUQVtsb2NhbGVJZF1bTG9jYWxlRGF0YUluZGV4LkV4dHJhRGF0YV0gPSBleHRyYURhdGE7XG4gIH1cbn1cblxuLyoqXG4gKiBGaW5kcyB0aGUgbG9jYWxlIGRhdGEgZm9yIGEgZ2l2ZW4gbG9jYWxlLlxuICpcbiAqIEBwYXJhbSBsb2NhbGUgVGhlIGxvY2FsZSBjb2RlLlxuICogQHJldHVybnMgVGhlIGxvY2FsZSBkYXRhLlxuICogQHNlZSBbSW50ZXJuYXRpb25hbGl6YXRpb24gKGkxOG4pIEd1aWRlXShodHRwczovL2FuZ3VsYXIuaW8vZ3VpZGUvaTE4bilcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGZpbmRMb2NhbGVEYXRhKGxvY2FsZTogc3RyaW5nKTogYW55IHtcbiAgY29uc3Qgbm9ybWFsaXplZExvY2FsZSA9IG5vcm1hbGl6ZUxvY2FsZShsb2NhbGUpO1xuXG4gIGxldCBtYXRjaCA9IGdldExvY2FsZURhdGEobm9ybWFsaXplZExvY2FsZSk7XG4gIGlmIChtYXRjaCkge1xuICAgIHJldHVybiBtYXRjaDtcbiAgfVxuXG4gIC8vIGxldCdzIHRyeSB0byBmaW5kIGEgcGFyZW50IGxvY2FsZVxuICBjb25zdCBwYXJlbnRMb2NhbGUgPSBub3JtYWxpemVkTG9jYWxlLnNwbGl0KCctJylbMF07XG4gIG1hdGNoID0gZ2V0TG9jYWxlRGF0YShwYXJlbnRMb2NhbGUpO1xuICBpZiAobWF0Y2gpIHtcbiAgICByZXR1cm4gbWF0Y2g7XG4gIH1cblxuICBpZiAocGFyZW50TG9jYWxlID09PSAnZW4nKSB7XG4gICAgcmV0dXJuIGxvY2FsZUVuO1xuICB9XG5cbiAgdGhyb3cgbmV3IEVycm9yKGBNaXNzaW5nIGxvY2FsZSBkYXRhIGZvciB0aGUgbG9jYWxlIFwiJHtsb2NhbGV9XCIuYCk7XG59XG5cbi8qKlxuICogUmV0cmlldmVzIHRoZSBwbHVyYWwgZnVuY3Rpb24gdXNlZCBieSBJQ1UgZXhwcmVzc2lvbnMgdG8gZGV0ZXJtaW5lIHRoZSBwbHVyYWwgY2FzZSB0byB1c2VcbiAqIGZvciBhIGdpdmVuIGxvY2FsZS5cbiAqIEBwYXJhbSBsb2NhbGUgQSBsb2NhbGUgY29kZSBmb3IgdGhlIGxvY2FsZSBmb3JtYXQgcnVsZXMgdG8gdXNlLlxuICogQHJldHVybnMgVGhlIHBsdXJhbCBmdW5jdGlvbiBmb3IgdGhlIGxvY2FsZS5cbiAqIEBzZWUgYE5nUGx1cmFsYFxuICogQHNlZSBbSW50ZXJuYXRpb25hbGl6YXRpb24gKGkxOG4pIEd1aWRlXShodHRwczovL2FuZ3VsYXIuaW8vZ3VpZGUvaTE4bilcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldExvY2FsZVBsdXJhbENhc2UobG9jYWxlOiBzdHJpbmcpOiAodmFsdWU6IG51bWJlcikgPT4gbnVtYmVyIHtcbiAgY29uc3QgZGF0YSA9IGZpbmRMb2NhbGVEYXRhKGxvY2FsZSk7XG4gIHJldHVybiBkYXRhW0xvY2FsZURhdGFJbmRleC5QbHVyYWxDYXNlXTtcbn1cblxuXG5cbi8qKlxuICogSGVscGVyIGZ1bmN0aW9uIHRvIGdldCB0aGUgZ2l2ZW4gYG5vcm1hbGl6ZWRMb2NhbGVgIGZyb20gYExPQ0FMRV9EQVRBYFxuICogb3IgZnJvbSB0aGUgZ2xvYmFsIGBuZy5jb21tb24ubG9jYWxlYC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldExvY2FsZURhdGEobm9ybWFsaXplZExvY2FsZTogc3RyaW5nKTogYW55IHtcbiAgaWYgKCEobm9ybWFsaXplZExvY2FsZSBpbiBMT0NBTEVfREFUQSkpIHtcbiAgICBMT0NBTEVfREFUQVtub3JtYWxpemVkTG9jYWxlXSA9IGdsb2JhbC5uZyAmJiBnbG9iYWwubmcuY29tbW9uICYmIGdsb2JhbC5uZy5jb21tb24ubG9jYWxlcyAmJlxuICAgICAgICBnbG9iYWwubmcuY29tbW9uLmxvY2FsZXNbbm9ybWFsaXplZExvY2FsZV07XG4gIH1cbiAgcmV0dXJuIExPQ0FMRV9EQVRBW25vcm1hbGl6ZWRMb2NhbGVdO1xufVxuXG4vKipcbiAqIEhlbHBlciBmdW5jdGlvbiB0byByZW1vdmUgYWxsIHRoZSBsb2NhbGUgZGF0YSBmcm9tIGBMT0NBTEVfREFUQWAuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB1bnJlZ2lzdGVyQWxsTG9jYWxlRGF0YSgpIHtcbiAgTE9DQUxFX0RBVEEgPSB7fTtcbn1cblxuLyoqXG4gKiBJbmRleCBvZiBlYWNoIHR5cGUgb2YgbG9jYWxlIGRhdGEgZnJvbSB0aGUgbG9jYWxlIGRhdGEgYXJyYXlcbiAqL1xuZXhwb3J0IGVudW0gTG9jYWxlRGF0YUluZGV4IHtcbiAgTG9jYWxlSWQgPSAwLFxuICBEYXlQZXJpb2RzRm9ybWF0LFxuICBEYXlQZXJpb2RzU3RhbmRhbG9uZSxcbiAgRGF5c0Zvcm1hdCxcbiAgRGF5c1N0YW5kYWxvbmUsXG4gIE1vbnRoc0Zvcm1hdCxcbiAgTW9udGhzU3RhbmRhbG9uZSxcbiAgRXJhcyxcbiAgRmlyc3REYXlPZldlZWssXG4gIFdlZWtlbmRSYW5nZSxcbiAgRGF0ZUZvcm1hdCxcbiAgVGltZUZvcm1hdCxcbiAgRGF0ZVRpbWVGb3JtYXQsXG4gIE51bWJlclN5bWJvbHMsXG4gIE51bWJlckZvcm1hdHMsXG4gIEN1cnJlbmN5U3ltYm9sLFxuICBDdXJyZW5jeU5hbWUsXG4gIEN1cnJlbmNpZXMsXG4gIFBsdXJhbENhc2UsXG4gIEV4dHJhRGF0YVxufVxuXG4vKipcbiAqIEluZGV4IG9mIGVhY2ggdHlwZSBvZiBsb2NhbGUgZGF0YSBmcm9tIHRoZSBleHRyYSBsb2NhbGUgZGF0YSBhcnJheVxuICovXG5leHBvcnQgY29uc3QgZW51bSBFeHRyYUxvY2FsZURhdGFJbmRleCB7XG4gIEV4dHJhRGF5UGVyaW9kRm9ybWF0cyA9IDAsXG4gIEV4dHJhRGF5UGVyaW9kU3RhbmRhbG9uZSxcbiAgRXh0cmFEYXlQZXJpb2RzUnVsZXNcbn1cblxuLyoqXG4gKiBJbmRleCBvZiBlYWNoIHZhbHVlIGluIGN1cnJlbmN5IGRhdGEgKHVzZWQgdG8gZGVzY3JpYmUgQ1VSUkVOQ0lFU19FTiBpbiBjdXJyZW5jaWVzLnRzKVxuICovXG5leHBvcnQgY29uc3QgZW51bSBDdXJyZW5jeUluZGV4IHtTeW1ib2wgPSAwLCBTeW1ib2xOYXJyb3csIE5iT2ZEaWdpdHN9XG5cbi8qKlxuICogUmV0dXJucyB0aGUgY2Fub25pY2FsIGZvcm0gb2YgYSBsb2NhbGUgbmFtZSAtIGxvd2VyY2FzZSB3aXRoIGBfYCByZXBsYWNlZCB3aXRoIGAtYC5cbiAqL1xuZnVuY3Rpb24gbm9ybWFsaXplTG9jYWxlKGxvY2FsZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIGxvY2FsZS50b0xvd2VyQ2FzZSgpLnJlcGxhY2UoL18vZywgJy0nKTtcbn0iXX0=