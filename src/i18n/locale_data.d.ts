/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/**
 * This const is used to store the locale data registered with `registerLocaleData`
 */
export declare const LOCALE_DATA: {
    [localeId: string]: any;
};
/**
 * Index of each type of locale data from the locale data array
 */
export declare enum LocaleDataIndex {
    LocaleId = 0,
    DayPeriodsFormat = 1,
    DayPeriodsStandalone = 2,
    DaysFormat = 3,
    DaysStandalone = 4,
    MonthsFormat = 5,
    MonthsStandalone = 6,
    Eras = 7,
    FirstDayOfWeek = 8,
    WeekendRange = 9,
    DateFormat = 10,
    TimeFormat = 11,
    DateTimeFormat = 12,
    NumberSymbols = 13,
    NumberFormats = 14,
    CurrencySymbol = 15,
    CurrencyName = 16,
    Currencies = 17,
    PluralCase = 18,
    ExtraData = 19
}
