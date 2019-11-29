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
 */
var LOCALE_DATA = {};
/**
 * Register locale data to be used internally by Angular. See the
 * ["I18n guide"](guide/i18n#i18n-pipes) to know how to import additional locale data.
 *
 * The signature `registerLocaleData(data: any, extraData?: any)` is deprecated since v5.1
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
 * @param locale The locale code.
 * @returns The locale data.
 * @see [Internationalization (i18n) Guide](https://angular.io/guide/i18n)
 */
export function findLocaleData(locale) {
    var normalizedLocale = normalizeLocale(locale);
    var match = getLocaleData(normalizedLocale);
    if (match) {
        return match;
    }
    // let's try to find a parent locale
    var parentLocale = normalizedLocale.split('-')[0];
    match = getLocaleData(parentLocale);
    if (match) {
        return match;
    }
    if (parentLocale === 'en') {
        return localeEn;
    }
    throw new Error("Missing locale data for the locale \"" + locale + "\".");
}
/**
 * Retrieves the plural function used by ICU expressions to determine the plural case to use
 * for a given locale.
 * @param locale A locale code for the locale format rules to use.
 * @returns The plural function for the locale.
 * @see `NgPlural`
 * @see [Internationalization (i18n) Guide](https://angular.io/guide/i18n)
 */
export function getLocalePluralCase(locale) {
    var data = findLocaleData(locale);
    return data[LocaleDataIndex.PluralCase];
}
/**
 * Helper function to get the given `normalizedLocale` from `LOCALE_DATA`
 * or from the global `ng.common.locale`.
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
 */
export function unregisterAllLocaleData() {
    LOCALE_DATA = {};
}
/**
 * Index of each type of locale data from the locale data array
 */
export var LocaleDataIndex;
(function (LocaleDataIndex) {
    LocaleDataIndex[LocaleDataIndex["LocaleId"] = 0] = "LocaleId";
    LocaleDataIndex[LocaleDataIndex["DayPeriodsFormat"] = 1] = "DayPeriodsFormat";
    LocaleDataIndex[LocaleDataIndex["DayPeriodsStandalone"] = 2] = "DayPeriodsStandalone";
    LocaleDataIndex[LocaleDataIndex["DaysFormat"] = 3] = "DaysFormat";
    LocaleDataIndex[LocaleDataIndex["DaysStandalone"] = 4] = "DaysStandalone";
    LocaleDataIndex[LocaleDataIndex["MonthsFormat"] = 5] = "MonthsFormat";
    LocaleDataIndex[LocaleDataIndex["MonthsStandalone"] = 6] = "MonthsStandalone";
    LocaleDataIndex[LocaleDataIndex["Eras"] = 7] = "Eras";
    LocaleDataIndex[LocaleDataIndex["FirstDayOfWeek"] = 8] = "FirstDayOfWeek";
    LocaleDataIndex[LocaleDataIndex["WeekendRange"] = 9] = "WeekendRange";
    LocaleDataIndex[LocaleDataIndex["DateFormat"] = 10] = "DateFormat";
    LocaleDataIndex[LocaleDataIndex["TimeFormat"] = 11] = "TimeFormat";
    LocaleDataIndex[LocaleDataIndex["DateTimeFormat"] = 12] = "DateTimeFormat";
    LocaleDataIndex[LocaleDataIndex["NumberSymbols"] = 13] = "NumberSymbols";
    LocaleDataIndex[LocaleDataIndex["NumberFormats"] = 14] = "NumberFormats";
    LocaleDataIndex[LocaleDataIndex["CurrencySymbol"] = 15] = "CurrencySymbol";
    LocaleDataIndex[LocaleDataIndex["CurrencyName"] = 16] = "CurrencyName";
    LocaleDataIndex[LocaleDataIndex["Currencies"] = 17] = "Currencies";
    LocaleDataIndex[LocaleDataIndex["PluralCase"] = 18] = "PluralCase";
    LocaleDataIndex[LocaleDataIndex["ExtraData"] = 19] = "ExtraData";
})(LocaleDataIndex || (LocaleDataIndex = {}));
/**
 * Returns the canonical form of a locale name - lowercase with `_` replaced with `-`.
 */
function normalizeLocale(locale) {
    return locale.toLowerCase().replace(/_/g, '-');
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9jYWxlX2RhdGFfYXBpLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvaTE4bi9sb2NhbGVfZGF0YV9hcGkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBQ0gsT0FBTyxRQUFRLE1BQU0sYUFBYSxDQUFDO0FBQ25DLE9BQU8sRUFBQyxNQUFNLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUV0Qzs7R0FFRztBQUNILElBQUksV0FBVyxHQUE4QixFQUFFLENBQUM7QUFFaEQ7Ozs7O0dBS0c7QUFDSCxNQUFNLFVBQVUsa0JBQWtCLENBQUMsSUFBUyxFQUFFLFFBQXVCLEVBQUUsU0FBZTtJQUNwRixJQUFJLE9BQU8sUUFBUSxLQUFLLFFBQVEsRUFBRTtRQUNoQyxTQUFTLEdBQUcsUUFBUSxDQUFDO1FBQ3JCLFFBQVEsR0FBRyxJQUFJLENBQUMsZUFBZSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0tBQzNDO0lBRUQsUUFBUSxHQUFHLFFBQVEsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxDQUFDO0lBRXJELFdBQVcsQ0FBQyxRQUFRLENBQUMsR0FBRyxJQUFJLENBQUM7SUFFN0IsSUFBSSxTQUFTLEVBQUU7UUFDYixXQUFXLENBQUMsUUFBUSxDQUFDLENBQUMsZUFBZSxDQUFDLFNBQVMsQ0FBQyxHQUFHLFNBQVMsQ0FBQztLQUM5RDtBQUNILENBQUM7QUFFRDs7Ozs7O0dBTUc7QUFDSCxNQUFNLFVBQVUsY0FBYyxDQUFDLE1BQWM7SUFDM0MsSUFBTSxnQkFBZ0IsR0FBRyxlQUFlLENBQUMsTUFBTSxDQUFDLENBQUM7SUFFakQsSUFBSSxLQUFLLEdBQUcsYUFBYSxDQUFDLGdCQUFnQixDQUFDLENBQUM7SUFDNUMsSUFBSSxLQUFLLEVBQUU7UUFDVCxPQUFPLEtBQUssQ0FBQztLQUNkO0lBRUQsb0NBQW9DO0lBQ3BDLElBQU0sWUFBWSxHQUFHLGdCQUFnQixDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNwRCxLQUFLLEdBQUcsYUFBYSxDQUFDLFlBQVksQ0FBQyxDQUFDO0lBQ3BDLElBQUksS0FBSyxFQUFFO1FBQ1QsT0FBTyxLQUFLLENBQUM7S0FDZDtJQUVELElBQUksWUFBWSxLQUFLLElBQUksRUFBRTtRQUN6QixPQUFPLFFBQVEsQ0FBQztLQUNqQjtJQUVELE1BQU0sSUFBSSxLQUFLLENBQUMsMENBQXVDLE1BQU0sUUFBSSxDQUFDLENBQUM7QUFDckUsQ0FBQztBQUVEOzs7Ozs7O0dBT0c7QUFDSCxNQUFNLFVBQVUsbUJBQW1CLENBQUMsTUFBYztJQUNoRCxJQUFNLElBQUksR0FBRyxjQUFjLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDcEMsT0FBTyxJQUFJLENBQUMsZUFBZSxDQUFDLFVBQVUsQ0FBQyxDQUFDO0FBQzFDLENBQUM7QUFJRDs7O0dBR0c7QUFDSCxNQUFNLFVBQVUsYUFBYSxDQUFDLGdCQUF3QjtJQUNwRCxJQUFJLENBQUMsQ0FBQyxnQkFBZ0IsSUFBSSxXQUFXLENBQUMsRUFBRTtRQUN0QyxXQUFXLENBQUMsZ0JBQWdCLENBQUMsR0FBRyxNQUFNLENBQUMsRUFBRSxJQUFJLE1BQU0sQ0FBQyxFQUFFLENBQUMsTUFBTSxJQUFJLE1BQU0sQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLE9BQU87WUFDckYsTUFBTSxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLGdCQUFnQixDQUFDLENBQUM7S0FDaEQ7SUFDRCxPQUFPLFdBQVcsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO0FBQ3ZDLENBQUM7QUFFRDs7R0FFRztBQUNILE1BQU0sVUFBVSx1QkFBdUI7SUFDckMsV0FBVyxHQUFHLEVBQUUsQ0FBQztBQUNuQixDQUFDO0FBRUQ7O0dBRUc7QUFDSCxNQUFNLENBQU4sSUFBWSxlQXFCWDtBQXJCRCxXQUFZLGVBQWU7SUFDekIsNkRBQVksQ0FBQTtJQUNaLDZFQUFnQixDQUFBO0lBQ2hCLHFGQUFvQixDQUFBO0lBQ3BCLGlFQUFVLENBQUE7SUFDVix5RUFBYyxDQUFBO0lBQ2QscUVBQVksQ0FBQTtJQUNaLDZFQUFnQixDQUFBO0lBQ2hCLHFEQUFJLENBQUE7SUFDSix5RUFBYyxDQUFBO0lBQ2QscUVBQVksQ0FBQTtJQUNaLGtFQUFVLENBQUE7SUFDVixrRUFBVSxDQUFBO0lBQ1YsMEVBQWMsQ0FBQTtJQUNkLHdFQUFhLENBQUE7SUFDYix3RUFBYSxDQUFBO0lBQ2IsMEVBQWMsQ0FBQTtJQUNkLHNFQUFZLENBQUE7SUFDWixrRUFBVSxDQUFBO0lBQ1Ysa0VBQVUsQ0FBQTtJQUNWLGdFQUFTLENBQUE7QUFDWCxDQUFDLEVBckJXLGVBQWUsS0FBZixlQUFlLFFBcUIxQjtBQWdCRDs7R0FFRztBQUNILFNBQVMsZUFBZSxDQUFDLE1BQWM7SUFDckMsT0FBTyxNQUFNLENBQUMsV0FBVyxFQUFFLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxHQUFHLENBQUMsQ0FBQztBQUNqRCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0IGxvY2FsZUVuIGZyb20gJy4vbG9jYWxlX2VuJztcbmltcG9ydCB7Z2xvYmFsfSBmcm9tICcuLi91dGlsL2dsb2JhbCc7XG5cbi8qKlxuICogVGhpcyBjb25zdCBpcyB1c2VkIHRvIHN0b3JlIHRoZSBsb2NhbGUgZGF0YSByZWdpc3RlcmVkIHdpdGggYHJlZ2lzdGVyTG9jYWxlRGF0YWBcbiAqL1xubGV0IExPQ0FMRV9EQVRBOiB7W2xvY2FsZUlkOiBzdHJpbmddOiBhbnl9ID0ge307XG5cbi8qKlxuICogUmVnaXN0ZXIgbG9jYWxlIGRhdGEgdG8gYmUgdXNlZCBpbnRlcm5hbGx5IGJ5IEFuZ3VsYXIuIFNlZSB0aGVcbiAqIFtcIkkxOG4gZ3VpZGVcIl0oZ3VpZGUvaTE4biNpMThuLXBpcGVzKSB0byBrbm93IGhvdyB0byBpbXBvcnQgYWRkaXRpb25hbCBsb2NhbGUgZGF0YS5cbiAqXG4gKiBUaGUgc2lnbmF0dXJlIGByZWdpc3RlckxvY2FsZURhdGEoZGF0YTogYW55LCBleHRyYURhdGE/OiBhbnkpYCBpcyBkZXByZWNhdGVkIHNpbmNlIHY1LjFcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlZ2lzdGVyTG9jYWxlRGF0YShkYXRhOiBhbnksIGxvY2FsZUlkPzogc3RyaW5nIHwgYW55LCBleHRyYURhdGE/OiBhbnkpOiB2b2lkIHtcbiAgaWYgKHR5cGVvZiBsb2NhbGVJZCAhPT0gJ3N0cmluZycpIHtcbiAgICBleHRyYURhdGEgPSBsb2NhbGVJZDtcbiAgICBsb2NhbGVJZCA9IGRhdGFbTG9jYWxlRGF0YUluZGV4LkxvY2FsZUlkXTtcbiAgfVxuXG4gIGxvY2FsZUlkID0gbG9jYWxlSWQudG9Mb3dlckNhc2UoKS5yZXBsYWNlKC9fL2csICctJyk7XG5cbiAgTE9DQUxFX0RBVEFbbG9jYWxlSWRdID0gZGF0YTtcblxuICBpZiAoZXh0cmFEYXRhKSB7XG4gICAgTE9DQUxFX0RBVEFbbG9jYWxlSWRdW0xvY2FsZURhdGFJbmRleC5FeHRyYURhdGFdID0gZXh0cmFEYXRhO1xuICB9XG59XG5cbi8qKlxuICogRmluZHMgdGhlIGxvY2FsZSBkYXRhIGZvciBhIGdpdmVuIGxvY2FsZS5cbiAqXG4gKiBAcGFyYW0gbG9jYWxlIFRoZSBsb2NhbGUgY29kZS5cbiAqIEByZXR1cm5zIFRoZSBsb2NhbGUgZGF0YS5cbiAqIEBzZWUgW0ludGVybmF0aW9uYWxpemF0aW9uIChpMThuKSBHdWlkZV0oaHR0cHM6Ly9hbmd1bGFyLmlvL2d1aWRlL2kxOG4pXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBmaW5kTG9jYWxlRGF0YShsb2NhbGU6IHN0cmluZyk6IGFueSB7XG4gIGNvbnN0IG5vcm1hbGl6ZWRMb2NhbGUgPSBub3JtYWxpemVMb2NhbGUobG9jYWxlKTtcblxuICBsZXQgbWF0Y2ggPSBnZXRMb2NhbGVEYXRhKG5vcm1hbGl6ZWRMb2NhbGUpO1xuICBpZiAobWF0Y2gpIHtcbiAgICByZXR1cm4gbWF0Y2g7XG4gIH1cblxuICAvLyBsZXQncyB0cnkgdG8gZmluZCBhIHBhcmVudCBsb2NhbGVcbiAgY29uc3QgcGFyZW50TG9jYWxlID0gbm9ybWFsaXplZExvY2FsZS5zcGxpdCgnLScpWzBdO1xuICBtYXRjaCA9IGdldExvY2FsZURhdGEocGFyZW50TG9jYWxlKTtcbiAgaWYgKG1hdGNoKSB7XG4gICAgcmV0dXJuIG1hdGNoO1xuICB9XG5cbiAgaWYgKHBhcmVudExvY2FsZSA9PT0gJ2VuJykge1xuICAgIHJldHVybiBsb2NhbGVFbjtcbiAgfVxuXG4gIHRocm93IG5ldyBFcnJvcihgTWlzc2luZyBsb2NhbGUgZGF0YSBmb3IgdGhlIGxvY2FsZSBcIiR7bG9jYWxlfVwiLmApO1xufVxuXG4vKipcbiAqIFJldHJpZXZlcyB0aGUgcGx1cmFsIGZ1bmN0aW9uIHVzZWQgYnkgSUNVIGV4cHJlc3Npb25zIHRvIGRldGVybWluZSB0aGUgcGx1cmFsIGNhc2UgdG8gdXNlXG4gKiBmb3IgYSBnaXZlbiBsb2NhbGUuXG4gKiBAcGFyYW0gbG9jYWxlIEEgbG9jYWxlIGNvZGUgZm9yIHRoZSBsb2NhbGUgZm9ybWF0IHJ1bGVzIHRvIHVzZS5cbiAqIEByZXR1cm5zIFRoZSBwbHVyYWwgZnVuY3Rpb24gZm9yIHRoZSBsb2NhbGUuXG4gKiBAc2VlIGBOZ1BsdXJhbGBcbiAqIEBzZWUgW0ludGVybmF0aW9uYWxpemF0aW9uIChpMThuKSBHdWlkZV0oaHR0cHM6Ly9hbmd1bGFyLmlvL2d1aWRlL2kxOG4pXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRMb2NhbGVQbHVyYWxDYXNlKGxvY2FsZTogc3RyaW5nKTogKHZhbHVlOiBudW1iZXIpID0+IG51bWJlciB7XG4gIGNvbnN0IGRhdGEgPSBmaW5kTG9jYWxlRGF0YShsb2NhbGUpO1xuICByZXR1cm4gZGF0YVtMb2NhbGVEYXRhSW5kZXguUGx1cmFsQ2FzZV07XG59XG5cblxuXG4vKipcbiAqIEhlbHBlciBmdW5jdGlvbiB0byBnZXQgdGhlIGdpdmVuIGBub3JtYWxpemVkTG9jYWxlYCBmcm9tIGBMT0NBTEVfREFUQWBcbiAqIG9yIGZyb20gdGhlIGdsb2JhbCBgbmcuY29tbW9uLmxvY2FsZWAuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRMb2NhbGVEYXRhKG5vcm1hbGl6ZWRMb2NhbGU6IHN0cmluZyk6IGFueSB7XG4gIGlmICghKG5vcm1hbGl6ZWRMb2NhbGUgaW4gTE9DQUxFX0RBVEEpKSB7XG4gICAgTE9DQUxFX0RBVEFbbm9ybWFsaXplZExvY2FsZV0gPSBnbG9iYWwubmcgJiYgZ2xvYmFsLm5nLmNvbW1vbiAmJiBnbG9iYWwubmcuY29tbW9uLmxvY2FsZXMgJiZcbiAgICAgICAgZ2xvYmFsLm5nLmNvbW1vbi5sb2NhbGVzW25vcm1hbGl6ZWRMb2NhbGVdO1xuICB9XG4gIHJldHVybiBMT0NBTEVfREFUQVtub3JtYWxpemVkTG9jYWxlXTtcbn1cblxuLyoqXG4gKiBIZWxwZXIgZnVuY3Rpb24gdG8gcmVtb3ZlIGFsbCB0aGUgbG9jYWxlIGRhdGEgZnJvbSBgTE9DQUxFX0RBVEFgLlxuICovXG5leHBvcnQgZnVuY3Rpb24gdW5yZWdpc3RlckFsbExvY2FsZURhdGEoKSB7XG4gIExPQ0FMRV9EQVRBID0ge307XG59XG5cbi8qKlxuICogSW5kZXggb2YgZWFjaCB0eXBlIG9mIGxvY2FsZSBkYXRhIGZyb20gdGhlIGxvY2FsZSBkYXRhIGFycmF5XG4gKi9cbmV4cG9ydCBlbnVtIExvY2FsZURhdGFJbmRleCB7XG4gIExvY2FsZUlkID0gMCxcbiAgRGF5UGVyaW9kc0Zvcm1hdCxcbiAgRGF5UGVyaW9kc1N0YW5kYWxvbmUsXG4gIERheXNGb3JtYXQsXG4gIERheXNTdGFuZGFsb25lLFxuICBNb250aHNGb3JtYXQsXG4gIE1vbnRoc1N0YW5kYWxvbmUsXG4gIEVyYXMsXG4gIEZpcnN0RGF5T2ZXZWVrLFxuICBXZWVrZW5kUmFuZ2UsXG4gIERhdGVGb3JtYXQsXG4gIFRpbWVGb3JtYXQsXG4gIERhdGVUaW1lRm9ybWF0LFxuICBOdW1iZXJTeW1ib2xzLFxuICBOdW1iZXJGb3JtYXRzLFxuICBDdXJyZW5jeVN5bWJvbCxcbiAgQ3VycmVuY3lOYW1lLFxuICBDdXJyZW5jaWVzLFxuICBQbHVyYWxDYXNlLFxuICBFeHRyYURhdGFcbn1cblxuLyoqXG4gKiBJbmRleCBvZiBlYWNoIHR5cGUgb2YgbG9jYWxlIGRhdGEgZnJvbSB0aGUgZXh0cmEgbG9jYWxlIGRhdGEgYXJyYXlcbiAqL1xuZXhwb3J0IGNvbnN0IGVudW0gRXh0cmFMb2NhbGVEYXRhSW5kZXgge1xuICBFeHRyYURheVBlcmlvZEZvcm1hdHMgPSAwLFxuICBFeHRyYURheVBlcmlvZFN0YW5kYWxvbmUsXG4gIEV4dHJhRGF5UGVyaW9kc1J1bGVzXG59XG5cbi8qKlxuICogSW5kZXggb2YgZWFjaCB2YWx1ZSBpbiBjdXJyZW5jeSBkYXRhICh1c2VkIHRvIGRlc2NyaWJlIENVUlJFTkNJRVNfRU4gaW4gY3VycmVuY2llcy50cylcbiAqL1xuZXhwb3J0IGNvbnN0IGVudW0gQ3VycmVuY3lJbmRleCB7U3ltYm9sID0gMCwgU3ltYm9sTmFycm93LCBOYk9mRGlnaXRzfVxuXG4vKipcbiAqIFJldHVybnMgdGhlIGNhbm9uaWNhbCBmb3JtIG9mIGEgbG9jYWxlIG5hbWUgLSBsb3dlcmNhc2Ugd2l0aCBgX2AgcmVwbGFjZWQgd2l0aCBgLWAuXG4gKi9cbmZ1bmN0aW9uIG5vcm1hbGl6ZUxvY2FsZShsb2NhbGU6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBsb2NhbGUudG9Mb3dlckNhc2UoKS5yZXBsYWNlKC9fL2csICctJyk7XG59Il19