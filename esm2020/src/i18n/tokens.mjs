/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { InjectionToken } from '../di/injection_token';
import { inject } from '../di/injector_compatibility';
import { InjectFlags } from '../di/interface/injector';
import { DEFAULT_LOCALE_ID, USD_CURRENCY_CODE } from './localization';
/**
 * Work out the locale from the potential global properties.
 *
 * * Closure Compiler: use `goog.getLocale()`.
 * * Ivy enabled: use `$localize.locale`
 */
export function getGlobalLocale() {
    if (typeof ngI18nClosureMode !== 'undefined' && ngI18nClosureMode &&
        typeof goog !== 'undefined' && goog.getLocale() !== 'en') {
        // * The default `goog.getLocale()` value is `en`, while Angular used `en-US`.
        // * In order to preserve backwards compatibility, we use Angular default value over
        //   Closure Compiler's one.
        return goog.getLocale();
    }
    else {
        // KEEP `typeof $localize !== 'undefined' && $localize.locale` IN SYNC WITH THE LOCALIZE
        // COMPILE-TIME INLINER.
        //
        // * During compile time inlining of translations the expression will be replaced
        //   with a string literal that is the current locale. Other forms of this expression are not
        //   guaranteed to be replaced.
        //
        // * During runtime translation evaluation, the developer is required to set `$localize.locale`
        //   if required, or just to provide their own `LOCALE_ID` provider.
        return (typeof $localize !== 'undefined' && $localize.locale) || DEFAULT_LOCALE_ID;
    }
}
/**
 * Provide this token to set the locale of your application.
 * It is used for i18n extraction, by i18n pipes (DatePipe, I18nPluralPipe, CurrencyPipe,
 * DecimalPipe and PercentPipe) and by ICU expressions.
 *
 * See the [i18n guide](guide/i18n-common-locale-id) for more information.
 *
 * @usageNotes
 * ### Example
 *
 * ```typescript
 * import { LOCALE_ID } from '@angular/core';
 * import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
 * import { AppModule } from './app/app.module';
 *
 * platformBrowserDynamic().bootstrapModule(AppModule, {
 *   providers: [{provide: LOCALE_ID, useValue: 'en-US' }]
 * });
 * ```
 *
 * @publicApi
 */
export const LOCALE_ID = new InjectionToken('LocaleId', {
    providedIn: 'root',
    factory: () => inject(LOCALE_ID, InjectFlags.Optional | InjectFlags.SkipSelf) || getGlobalLocale(),
});
/**
 * Provide this token to set the default currency code your application uses for
 * CurrencyPipe when there is no currency code passed into it. This is only used by
 * CurrencyPipe and has no relation to locale currency. Defaults to USD if not configured.
 *
 * See the [i18n guide](guide/i18n-common-locale-id) for more information.
 *
 * <div class="alert is-helpful">
 *
 * **Deprecation notice:**
 *
 * The default currency code is currently always `USD` but this is deprecated from v9.
 *
 * **In v10 the default currency code will be taken from the current locale.**
 *
 * If you need the previous behavior then set it by creating a `DEFAULT_CURRENCY_CODE` provider in
 * your application `NgModule`:
 *
 * ```ts
 * {provide: DEFAULT_CURRENCY_CODE, useValue: 'USD'}
 * ```
 *
 * </div>
 *
 * @usageNotes
 * ### Example
 *
 * ```typescript
 * import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
 * import { AppModule } from './app/app.module';
 *
 * platformBrowserDynamic().bootstrapModule(AppModule, {
 *   providers: [{provide: DEFAULT_CURRENCY_CODE, useValue: 'EUR' }]
 * });
 * ```
 *
 * @publicApi
 */
export const DEFAULT_CURRENCY_CODE = new InjectionToken('DefaultCurrencyCode', {
    providedIn: 'root',
    factory: () => USD_CURRENCY_CODE,
});
/**
 * Use this token at bootstrap to provide the content of your translation file (`xtb`,
 * `xlf` or `xlf2`) when you want to translate your application in another language.
 *
 * See the [i18n guide](guide/i18n-common-merge) for more information.
 *
 * @usageNotes
 * ### Example
 *
 * ```typescript
 * import { TRANSLATIONS } from '@angular/core';
 * import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
 * import { AppModule } from './app/app.module';
 *
 * // content of your translation file
 * const translations = '....';
 *
 * platformBrowserDynamic().bootstrapModule(AppModule, {
 *   providers: [{provide: TRANSLATIONS, useValue: translations }]
 * });
 * ```
 *
 * @publicApi
 */
export const TRANSLATIONS = new InjectionToken('Translations');
/**
 * Provide this token at bootstrap to set the format of your {@link TRANSLATIONS}: `xtb`,
 * `xlf` or `xlf2`.
 *
 * See the [i18n guide](guide/i18n-common-merge) for more information.
 *
 * @usageNotes
 * ### Example
 *
 * ```typescript
 * import { TRANSLATIONS_FORMAT } from '@angular/core';
 * import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
 * import { AppModule } from './app/app.module';
 *
 * platformBrowserDynamic().bootstrapModule(AppModule, {
 *   providers: [{provide: TRANSLATIONS_FORMAT, useValue: 'xlf' }]
 * });
 * ```
 *
 * @publicApi
 */
export const TRANSLATIONS_FORMAT = new InjectionToken('TranslationsFormat');
/**
 * Use this enum at bootstrap as an option of `bootstrapModule` to define the strategy
 * that the compiler should use in case of missing translations:
 * - Error: throw if you have missing translations.
 * - Warning (default): show a warning in the console and/or shell.
 * - Ignore: do nothing.
 *
 * See the [i18n guide](guide/i18n-common-merge#report-missing-translations) for more information.
 *
 * @usageNotes
 * ### Example
 * ```typescript
 * import { MissingTranslationStrategy } from '@angular/core';
 * import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
 * import { AppModule } from './app/app.module';
 *
 * platformBrowserDynamic().bootstrapModule(AppModule, {
 *   missingTranslation: MissingTranslationStrategy.Error
 * });
 * ```
 *
 * @publicApi
 */
export var MissingTranslationStrategy;
(function (MissingTranslationStrategy) {
    MissingTranslationStrategy[MissingTranslationStrategy["Error"] = 0] = "Error";
    MissingTranslationStrategy[MissingTranslationStrategy["Warning"] = 1] = "Warning";
    MissingTranslationStrategy[MissingTranslationStrategy["Ignore"] = 2] = "Ignore";
})(MissingTranslationStrategy || (MissingTranslationStrategy = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidG9rZW5zLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvaTE4bi90b2tlbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLGNBQWMsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQ3JELE9BQU8sRUFBQyxNQUFNLEVBQUMsTUFBTSw4QkFBOEIsQ0FBQztBQUNwRCxPQUFPLEVBQUMsV0FBVyxFQUFDLE1BQU0sMEJBQTBCLENBQUM7QUFFckQsT0FBTyxFQUFDLGlCQUFpQixFQUFFLGlCQUFpQixFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFJcEU7Ozs7O0dBS0c7QUFDSCxNQUFNLFVBQVUsZUFBZTtJQUM3QixJQUFJLE9BQU8saUJBQWlCLEtBQUssV0FBVyxJQUFJLGlCQUFpQjtRQUM3RCxPQUFPLElBQUksS0FBSyxXQUFXLElBQUksSUFBSSxDQUFDLFNBQVMsRUFBRSxLQUFLLElBQUksRUFBRTtRQUM1RCw4RUFBOEU7UUFDOUUsb0ZBQW9GO1FBQ3BGLDRCQUE0QjtRQUM1QixPQUFPLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQztLQUN6QjtTQUFNO1FBQ0wsd0ZBQXdGO1FBQ3hGLHdCQUF3QjtRQUN4QixFQUFFO1FBQ0YsaUZBQWlGO1FBQ2pGLDZGQUE2RjtRQUM3RiwrQkFBK0I7UUFDL0IsRUFBRTtRQUNGLCtGQUErRjtRQUMvRixvRUFBb0U7UUFDcEUsT0FBTyxDQUFDLE9BQU8sU0FBUyxLQUFLLFdBQVcsSUFBSSxTQUFTLENBQUMsTUFBTSxDQUFDLElBQUksaUJBQWlCLENBQUM7S0FDcEY7QUFDSCxDQUFDO0FBRUQ7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztHQXFCRztBQUNILE1BQU0sQ0FBQyxNQUFNLFNBQVMsR0FBMkIsSUFBSSxjQUFjLENBQUMsVUFBVSxFQUFFO0lBQzlFLFVBQVUsRUFBRSxNQUFNO0lBQ2xCLE9BQU8sRUFBRSxHQUFHLEVBQUUsQ0FDVixNQUFNLENBQUMsU0FBUyxFQUFFLFdBQVcsQ0FBQyxRQUFRLEdBQUcsV0FBVyxDQUFDLFFBQVEsQ0FBQyxJQUFJLGVBQWUsRUFBRTtDQUN4RixDQUFDLENBQUM7QUFFSDs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztHQXFDRztBQUNILE1BQU0sQ0FBQyxNQUFNLHFCQUFxQixHQUFHLElBQUksY0FBYyxDQUFTLHFCQUFxQixFQUFFO0lBQ3JGLFVBQVUsRUFBRSxNQUFNO0lBQ2xCLE9BQU8sRUFBRSxHQUFHLEVBQUUsQ0FBQyxpQkFBaUI7Q0FDakMsQ0FBQyxDQUFDO0FBRUg7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBdUJHO0FBQ0gsTUFBTSxDQUFDLE1BQU0sWUFBWSxHQUFHLElBQUksY0FBYyxDQUFTLGNBQWMsQ0FBQyxDQUFDO0FBRXZFOzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztHQW9CRztBQUNILE1BQU0sQ0FBQyxNQUFNLG1CQUFtQixHQUFHLElBQUksY0FBYyxDQUFTLG9CQUFvQixDQUFDLENBQUM7QUFFcEY7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7R0FzQkc7QUFDSCxNQUFNLENBQU4sSUFBWSwwQkFJWDtBQUpELFdBQVksMEJBQTBCO0lBQ3BDLDZFQUFTLENBQUE7SUFDVCxpRkFBVyxDQUFBO0lBQ1gsK0VBQVUsQ0FBQTtBQUNaLENBQUMsRUFKVywwQkFBMEIsS0FBMUIsMEJBQTBCLFFBSXJDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7SW5qZWN0aW9uVG9rZW59IGZyb20gJy4uL2RpL2luamVjdGlvbl90b2tlbic7XG5pbXBvcnQge2luamVjdH0gZnJvbSAnLi4vZGkvaW5qZWN0b3JfY29tcGF0aWJpbGl0eSc7XG5pbXBvcnQge0luamVjdEZsYWdzfSBmcm9tICcuLi9kaS9pbnRlcmZhY2UvaW5qZWN0b3InO1xuXG5pbXBvcnQge0RFRkFVTFRfTE9DQUxFX0lELCBVU0RfQ1VSUkVOQ1lfQ09ERX0gZnJvbSAnLi9sb2NhbGl6YXRpb24nO1xuXG5kZWNsYXJlIGNvbnN0ICRsb2NhbGl6ZToge2xvY2FsZT86IHN0cmluZ307XG5cbi8qKlxuICogV29yayBvdXQgdGhlIGxvY2FsZSBmcm9tIHRoZSBwb3RlbnRpYWwgZ2xvYmFsIHByb3BlcnRpZXMuXG4gKlxuICogKiBDbG9zdXJlIENvbXBpbGVyOiB1c2UgYGdvb2cuZ2V0TG9jYWxlKClgLlxuICogKiBJdnkgZW5hYmxlZDogdXNlIGAkbG9jYWxpemUubG9jYWxlYFxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0R2xvYmFsTG9jYWxlKCk6IHN0cmluZyB7XG4gIGlmICh0eXBlb2YgbmdJMThuQ2xvc3VyZU1vZGUgIT09ICd1bmRlZmluZWQnICYmIG5nSTE4bkNsb3N1cmVNb2RlICYmXG4gICAgICB0eXBlb2YgZ29vZyAhPT0gJ3VuZGVmaW5lZCcgJiYgZ29vZy5nZXRMb2NhbGUoKSAhPT0gJ2VuJykge1xuICAgIC8vICogVGhlIGRlZmF1bHQgYGdvb2cuZ2V0TG9jYWxlKClgIHZhbHVlIGlzIGBlbmAsIHdoaWxlIEFuZ3VsYXIgdXNlZCBgZW4tVVNgLlxuICAgIC8vICogSW4gb3JkZXIgdG8gcHJlc2VydmUgYmFja3dhcmRzIGNvbXBhdGliaWxpdHksIHdlIHVzZSBBbmd1bGFyIGRlZmF1bHQgdmFsdWUgb3ZlclxuICAgIC8vICAgQ2xvc3VyZSBDb21waWxlcidzIG9uZS5cbiAgICByZXR1cm4gZ29vZy5nZXRMb2NhbGUoKTtcbiAgfSBlbHNlIHtcbiAgICAvLyBLRUVQIGB0eXBlb2YgJGxvY2FsaXplICE9PSAndW5kZWZpbmVkJyAmJiAkbG9jYWxpemUubG9jYWxlYCBJTiBTWU5DIFdJVEggVEhFIExPQ0FMSVpFXG4gICAgLy8gQ09NUElMRS1USU1FIElOTElORVIuXG4gICAgLy9cbiAgICAvLyAqIER1cmluZyBjb21waWxlIHRpbWUgaW5saW5pbmcgb2YgdHJhbnNsYXRpb25zIHRoZSBleHByZXNzaW9uIHdpbGwgYmUgcmVwbGFjZWRcbiAgICAvLyAgIHdpdGggYSBzdHJpbmcgbGl0ZXJhbCB0aGF0IGlzIHRoZSBjdXJyZW50IGxvY2FsZS4gT3RoZXIgZm9ybXMgb2YgdGhpcyBleHByZXNzaW9uIGFyZSBub3RcbiAgICAvLyAgIGd1YXJhbnRlZWQgdG8gYmUgcmVwbGFjZWQuXG4gICAgLy9cbiAgICAvLyAqIER1cmluZyBydW50aW1lIHRyYW5zbGF0aW9uIGV2YWx1YXRpb24sIHRoZSBkZXZlbG9wZXIgaXMgcmVxdWlyZWQgdG8gc2V0IGAkbG9jYWxpemUubG9jYWxlYFxuICAgIC8vICAgaWYgcmVxdWlyZWQsIG9yIGp1c3QgdG8gcHJvdmlkZSB0aGVpciBvd24gYExPQ0FMRV9JRGAgcHJvdmlkZXIuXG4gICAgcmV0dXJuICh0eXBlb2YgJGxvY2FsaXplICE9PSAndW5kZWZpbmVkJyAmJiAkbG9jYWxpemUubG9jYWxlKSB8fCBERUZBVUxUX0xPQ0FMRV9JRDtcbiAgfVxufVxuXG4vKipcbiAqIFByb3ZpZGUgdGhpcyB0b2tlbiB0byBzZXQgdGhlIGxvY2FsZSBvZiB5b3VyIGFwcGxpY2F0aW9uLlxuICogSXQgaXMgdXNlZCBmb3IgaTE4biBleHRyYWN0aW9uLCBieSBpMThuIHBpcGVzIChEYXRlUGlwZSwgSTE4blBsdXJhbFBpcGUsIEN1cnJlbmN5UGlwZSxcbiAqIERlY2ltYWxQaXBlIGFuZCBQZXJjZW50UGlwZSkgYW5kIGJ5IElDVSBleHByZXNzaW9ucy5cbiAqXG4gKiBTZWUgdGhlIFtpMThuIGd1aWRlXShndWlkZS9pMThuLWNvbW1vbi1sb2NhbGUtaWQpIGZvciBtb3JlIGluZm9ybWF0aW9uLlxuICpcbiAqIEB1c2FnZU5vdGVzXG4gKiAjIyMgRXhhbXBsZVxuICpcbiAqIGBgYHR5cGVzY3JpcHRcbiAqIGltcG9ydCB7IExPQ0FMRV9JRCB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuICogaW1wb3J0IHsgcGxhdGZvcm1Ccm93c2VyRHluYW1pYyB9IGZyb20gJ0Bhbmd1bGFyL3BsYXRmb3JtLWJyb3dzZXItZHluYW1pYyc7XG4gKiBpbXBvcnQgeyBBcHBNb2R1bGUgfSBmcm9tICcuL2FwcC9hcHAubW9kdWxlJztcbiAqXG4gKiBwbGF0Zm9ybUJyb3dzZXJEeW5hbWljKCkuYm9vdHN0cmFwTW9kdWxlKEFwcE1vZHVsZSwge1xuICogICBwcm92aWRlcnM6IFt7cHJvdmlkZTogTE9DQUxFX0lELCB1c2VWYWx1ZTogJ2VuLVVTJyB9XVxuICogfSk7XG4gKiBgYGBcbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBjb25zdCBMT0NBTEVfSUQ6IEluamVjdGlvblRva2VuPHN0cmluZz4gPSBuZXcgSW5qZWN0aW9uVG9rZW4oJ0xvY2FsZUlkJywge1xuICBwcm92aWRlZEluOiAncm9vdCcsXG4gIGZhY3Rvcnk6ICgpID0+XG4gICAgICBpbmplY3QoTE9DQUxFX0lELCBJbmplY3RGbGFncy5PcHRpb25hbCB8IEluamVjdEZsYWdzLlNraXBTZWxmKSB8fCBnZXRHbG9iYWxMb2NhbGUoKSxcbn0pO1xuXG4vKipcbiAqIFByb3ZpZGUgdGhpcyB0b2tlbiB0byBzZXQgdGhlIGRlZmF1bHQgY3VycmVuY3kgY29kZSB5b3VyIGFwcGxpY2F0aW9uIHVzZXMgZm9yXG4gKiBDdXJyZW5jeVBpcGUgd2hlbiB0aGVyZSBpcyBubyBjdXJyZW5jeSBjb2RlIHBhc3NlZCBpbnRvIGl0LiBUaGlzIGlzIG9ubHkgdXNlZCBieVxuICogQ3VycmVuY3lQaXBlIGFuZCBoYXMgbm8gcmVsYXRpb24gdG8gbG9jYWxlIGN1cnJlbmN5LiBEZWZhdWx0cyB0byBVU0QgaWYgbm90IGNvbmZpZ3VyZWQuXG4gKlxuICogU2VlIHRoZSBbaTE4biBndWlkZV0oZ3VpZGUvaTE4bi1jb21tb24tbG9jYWxlLWlkKSBmb3IgbW9yZSBpbmZvcm1hdGlvbi5cbiAqXG4gKiA8ZGl2IGNsYXNzPVwiYWxlcnQgaXMtaGVscGZ1bFwiPlxuICpcbiAqICoqRGVwcmVjYXRpb24gbm90aWNlOioqXG4gKlxuICogVGhlIGRlZmF1bHQgY3VycmVuY3kgY29kZSBpcyBjdXJyZW50bHkgYWx3YXlzIGBVU0RgIGJ1dCB0aGlzIGlzIGRlcHJlY2F0ZWQgZnJvbSB2OS5cbiAqXG4gKiAqKkluIHYxMCB0aGUgZGVmYXVsdCBjdXJyZW5jeSBjb2RlIHdpbGwgYmUgdGFrZW4gZnJvbSB0aGUgY3VycmVudCBsb2NhbGUuKipcbiAqXG4gKiBJZiB5b3UgbmVlZCB0aGUgcHJldmlvdXMgYmVoYXZpb3IgdGhlbiBzZXQgaXQgYnkgY3JlYXRpbmcgYSBgREVGQVVMVF9DVVJSRU5DWV9DT0RFYCBwcm92aWRlciBpblxuICogeW91ciBhcHBsaWNhdGlvbiBgTmdNb2R1bGVgOlxuICpcbiAqIGBgYHRzXG4gKiB7cHJvdmlkZTogREVGQVVMVF9DVVJSRU5DWV9DT0RFLCB1c2VWYWx1ZTogJ1VTRCd9XG4gKiBgYGBcbiAqXG4gKiA8L2Rpdj5cbiAqXG4gKiBAdXNhZ2VOb3Rlc1xuICogIyMjIEV4YW1wbGVcbiAqXG4gKiBgYGB0eXBlc2NyaXB0XG4gKiBpbXBvcnQgeyBwbGF0Zm9ybUJyb3dzZXJEeW5hbWljIH0gZnJvbSAnQGFuZ3VsYXIvcGxhdGZvcm0tYnJvd3Nlci1keW5hbWljJztcbiAqIGltcG9ydCB7IEFwcE1vZHVsZSB9IGZyb20gJy4vYXBwL2FwcC5tb2R1bGUnO1xuICpcbiAqIHBsYXRmb3JtQnJvd3NlckR5bmFtaWMoKS5ib290c3RyYXBNb2R1bGUoQXBwTW9kdWxlLCB7XG4gKiAgIHByb3ZpZGVyczogW3twcm92aWRlOiBERUZBVUxUX0NVUlJFTkNZX0NPREUsIHVzZVZhbHVlOiAnRVVSJyB9XVxuICogfSk7XG4gKiBgYGBcbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBjb25zdCBERUZBVUxUX0NVUlJFTkNZX0NPREUgPSBuZXcgSW5qZWN0aW9uVG9rZW48c3RyaW5nPignRGVmYXVsdEN1cnJlbmN5Q29kZScsIHtcbiAgcHJvdmlkZWRJbjogJ3Jvb3QnLFxuICBmYWN0b3J5OiAoKSA9PiBVU0RfQ1VSUkVOQ1lfQ09ERSxcbn0pO1xuXG4vKipcbiAqIFVzZSB0aGlzIHRva2VuIGF0IGJvb3RzdHJhcCB0byBwcm92aWRlIHRoZSBjb250ZW50IG9mIHlvdXIgdHJhbnNsYXRpb24gZmlsZSAoYHh0YmAsXG4gKiBgeGxmYCBvciBgeGxmMmApIHdoZW4geW91IHdhbnQgdG8gdHJhbnNsYXRlIHlvdXIgYXBwbGljYXRpb24gaW4gYW5vdGhlciBsYW5ndWFnZS5cbiAqXG4gKiBTZWUgdGhlIFtpMThuIGd1aWRlXShndWlkZS9pMThuLWNvbW1vbi1tZXJnZSkgZm9yIG1vcmUgaW5mb3JtYXRpb24uXG4gKlxuICogQHVzYWdlTm90ZXNcbiAqICMjIyBFeGFtcGxlXG4gKlxuICogYGBgdHlwZXNjcmlwdFxuICogaW1wb3J0IHsgVFJBTlNMQVRJT05TIH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG4gKiBpbXBvcnQgeyBwbGF0Zm9ybUJyb3dzZXJEeW5hbWljIH0gZnJvbSAnQGFuZ3VsYXIvcGxhdGZvcm0tYnJvd3Nlci1keW5hbWljJztcbiAqIGltcG9ydCB7IEFwcE1vZHVsZSB9IGZyb20gJy4vYXBwL2FwcC5tb2R1bGUnO1xuICpcbiAqIC8vIGNvbnRlbnQgb2YgeW91ciB0cmFuc2xhdGlvbiBmaWxlXG4gKiBjb25zdCB0cmFuc2xhdGlvbnMgPSAnLi4uLic7XG4gKlxuICogcGxhdGZvcm1Ccm93c2VyRHluYW1pYygpLmJvb3RzdHJhcE1vZHVsZShBcHBNb2R1bGUsIHtcbiAqICAgcHJvdmlkZXJzOiBbe3Byb3ZpZGU6IFRSQU5TTEFUSU9OUywgdXNlVmFsdWU6IHRyYW5zbGF0aW9ucyB9XVxuICogfSk7XG4gKiBgYGBcbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBjb25zdCBUUkFOU0xBVElPTlMgPSBuZXcgSW5qZWN0aW9uVG9rZW48c3RyaW5nPignVHJhbnNsYXRpb25zJyk7XG5cbi8qKlxuICogUHJvdmlkZSB0aGlzIHRva2VuIGF0IGJvb3RzdHJhcCB0byBzZXQgdGhlIGZvcm1hdCBvZiB5b3VyIHtAbGluayBUUkFOU0xBVElPTlN9OiBgeHRiYCxcbiAqIGB4bGZgIG9yIGB4bGYyYC5cbiAqXG4gKiBTZWUgdGhlIFtpMThuIGd1aWRlXShndWlkZS9pMThuLWNvbW1vbi1tZXJnZSkgZm9yIG1vcmUgaW5mb3JtYXRpb24uXG4gKlxuICogQHVzYWdlTm90ZXNcbiAqICMjIyBFeGFtcGxlXG4gKlxuICogYGBgdHlwZXNjcmlwdFxuICogaW1wb3J0IHsgVFJBTlNMQVRJT05TX0ZPUk1BVCB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuICogaW1wb3J0IHsgcGxhdGZvcm1Ccm93c2VyRHluYW1pYyB9IGZyb20gJ0Bhbmd1bGFyL3BsYXRmb3JtLWJyb3dzZXItZHluYW1pYyc7XG4gKiBpbXBvcnQgeyBBcHBNb2R1bGUgfSBmcm9tICcuL2FwcC9hcHAubW9kdWxlJztcbiAqXG4gKiBwbGF0Zm9ybUJyb3dzZXJEeW5hbWljKCkuYm9vdHN0cmFwTW9kdWxlKEFwcE1vZHVsZSwge1xuICogICBwcm92aWRlcnM6IFt7cHJvdmlkZTogVFJBTlNMQVRJT05TX0ZPUk1BVCwgdXNlVmFsdWU6ICd4bGYnIH1dXG4gKiB9KTtcbiAqIGBgYFxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGNvbnN0IFRSQU5TTEFUSU9OU19GT1JNQVQgPSBuZXcgSW5qZWN0aW9uVG9rZW48c3RyaW5nPignVHJhbnNsYXRpb25zRm9ybWF0Jyk7XG5cbi8qKlxuICogVXNlIHRoaXMgZW51bSBhdCBib290c3RyYXAgYXMgYW4gb3B0aW9uIG9mIGBib290c3RyYXBNb2R1bGVgIHRvIGRlZmluZSB0aGUgc3RyYXRlZ3lcbiAqIHRoYXQgdGhlIGNvbXBpbGVyIHNob3VsZCB1c2UgaW4gY2FzZSBvZiBtaXNzaW5nIHRyYW5zbGF0aW9uczpcbiAqIC0gRXJyb3I6IHRocm93IGlmIHlvdSBoYXZlIG1pc3NpbmcgdHJhbnNsYXRpb25zLlxuICogLSBXYXJuaW5nIChkZWZhdWx0KTogc2hvdyBhIHdhcm5pbmcgaW4gdGhlIGNvbnNvbGUgYW5kL29yIHNoZWxsLlxuICogLSBJZ25vcmU6IGRvIG5vdGhpbmcuXG4gKlxuICogU2VlIHRoZSBbaTE4biBndWlkZV0oZ3VpZGUvaTE4bi1jb21tb24tbWVyZ2UjcmVwb3J0LW1pc3NpbmctdHJhbnNsYXRpb25zKSBmb3IgbW9yZSBpbmZvcm1hdGlvbi5cbiAqXG4gKiBAdXNhZ2VOb3Rlc1xuICogIyMjIEV4YW1wbGVcbiAqIGBgYHR5cGVzY3JpcHRcbiAqIGltcG9ydCB7IE1pc3NpbmdUcmFuc2xhdGlvblN0cmF0ZWd5IH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG4gKiBpbXBvcnQgeyBwbGF0Zm9ybUJyb3dzZXJEeW5hbWljIH0gZnJvbSAnQGFuZ3VsYXIvcGxhdGZvcm0tYnJvd3Nlci1keW5hbWljJztcbiAqIGltcG9ydCB7IEFwcE1vZHVsZSB9IGZyb20gJy4vYXBwL2FwcC5tb2R1bGUnO1xuICpcbiAqIHBsYXRmb3JtQnJvd3NlckR5bmFtaWMoKS5ib290c3RyYXBNb2R1bGUoQXBwTW9kdWxlLCB7XG4gKiAgIG1pc3NpbmdUcmFuc2xhdGlvbjogTWlzc2luZ1RyYW5zbGF0aW9uU3RyYXRlZ3kuRXJyb3JcbiAqIH0pO1xuICogYGBgXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgZW51bSBNaXNzaW5nVHJhbnNsYXRpb25TdHJhdGVneSB7XG4gIEVycm9yID0gMCxcbiAgV2FybmluZyA9IDEsXG4gIElnbm9yZSA9IDIsXG59XG4iXX0=