/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { InjectionToken } from '../di/injection_token';
/**
 * Provide this token to set the locale of your application.
 * It is used for i18n extraction, by i18n pipes (DatePipe, I18nPluralPipe, CurrencyPipe,
 * DecimalPipe and PercentPipe) and by ICU expressions.
 *
 * See the {@linkDocs guide/i18n#setting-up-locale i18n guide} for more information.
 *
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
 * @experimental i18n support is experimental.
 */
export var LOCALE_ID = new InjectionToken('LocaleId');
/**
 * Use this token at bootstrap to provide the content of your translation file (`xtb`,
 * `xlf` or `xlf2`) when you want to translate your application in another language.
 *
 * See the {@linkDocs guide/i18n#merge i18n guide} for more information.
 *
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
 * @experimental i18n support is experimental.
 */
export var TRANSLATIONS = new InjectionToken('Translations');
/**
 * Provide this token at bootstrap to set the format of your {@link TRANSLATIONS}: `xtb`,
 * `xlf` or `xlf2`.
 *
 * See the {@linkDocs guide/i18n#merge i18n guide} for more information.
 *
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
 * @experimental i18n support is experimental.
 */
export var TRANSLATIONS_FORMAT = new InjectionToken('TranslationsFormat');
/**
 * Use this enum at bootstrap as an option of `bootstrapModule` to define the strategy
 * that the compiler should use in case of missing translations:
 * - Error: throw if you have missing translations.
 * - Warning (default): show a warning in the console and/or shell.
 * - Ignore: do nothing.
 *
 * See the {@linkDocs guide/i18n#missing-translation i18n guide} for more information.
 *
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
 * @experimental i18n support is experimental.
 */
export var MissingTranslationStrategy;
(function (MissingTranslationStrategy) {
    MissingTranslationStrategy[MissingTranslationStrategy["Error"] = 0] = "Error";
    MissingTranslationStrategy[MissingTranslationStrategy["Warning"] = 1] = "Warning";
    MissingTranslationStrategy[MissingTranslationStrategy["Ignore"] = 2] = "Ignore";
})(MissingTranslationStrategy || (MissingTranslationStrategy = {}));

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidG9rZW5zLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvaTE4bi90b2tlbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLGNBQWMsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBRXJEOzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztHQW9CRztBQUNILE1BQU0sQ0FBQyxJQUFNLFNBQVMsR0FBRyxJQUFJLGNBQWMsQ0FBUyxVQUFVLENBQUMsQ0FBQztBQUVoRTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztHQXNCRztBQUNILE1BQU0sQ0FBQyxJQUFNLFlBQVksR0FBRyxJQUFJLGNBQWMsQ0FBUyxjQUFjLENBQUMsQ0FBQztBQUV2RTs7Ozs7Ozs7Ozs7Ozs7Ozs7OztHQW1CRztBQUNILE1BQU0sQ0FBQyxJQUFNLG1CQUFtQixHQUFHLElBQUksY0FBYyxDQUFTLG9CQUFvQixDQUFDLENBQUM7QUFFcEY7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztHQXFCRztBQUNILE1BQU0sQ0FBTixJQUFZLDBCQUlYO0FBSkQsV0FBWSwwQkFBMEI7SUFDcEMsNkVBQVMsQ0FBQTtJQUNULGlGQUFXLENBQUE7SUFDWCwrRUFBVSxDQUFBO0FBQ1osQ0FBQyxFQUpXLDBCQUEwQixLQUExQiwwQkFBMEIsUUFJckMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7SW5qZWN0aW9uVG9rZW59IGZyb20gJy4uL2RpL2luamVjdGlvbl90b2tlbic7XG5cbi8qKlxuICogUHJvdmlkZSB0aGlzIHRva2VuIHRvIHNldCB0aGUgbG9jYWxlIG9mIHlvdXIgYXBwbGljYXRpb24uXG4gKiBJdCBpcyB1c2VkIGZvciBpMThuIGV4dHJhY3Rpb24sIGJ5IGkxOG4gcGlwZXMgKERhdGVQaXBlLCBJMThuUGx1cmFsUGlwZSwgQ3VycmVuY3lQaXBlLFxuICogRGVjaW1hbFBpcGUgYW5kIFBlcmNlbnRQaXBlKSBhbmQgYnkgSUNVIGV4cHJlc3Npb25zLlxuICpcbiAqIFNlZSB0aGUge0BsaW5rRG9jcyBndWlkZS9pMThuI3NldHRpbmctdXAtbG9jYWxlIGkxOG4gZ3VpZGV9IGZvciBtb3JlIGluZm9ybWF0aW9uLlxuICpcbiAqICMjIyBFeGFtcGxlXG4gKlxuICogYGBgdHlwZXNjcmlwdFxuICogaW1wb3J0IHsgTE9DQUxFX0lEIH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG4gKiBpbXBvcnQgeyBwbGF0Zm9ybUJyb3dzZXJEeW5hbWljIH0gZnJvbSAnQGFuZ3VsYXIvcGxhdGZvcm0tYnJvd3Nlci1keW5hbWljJztcbiAqIGltcG9ydCB7IEFwcE1vZHVsZSB9IGZyb20gJy4vYXBwL2FwcC5tb2R1bGUnO1xuICpcbiAqIHBsYXRmb3JtQnJvd3NlckR5bmFtaWMoKS5ib290c3RyYXBNb2R1bGUoQXBwTW9kdWxlLCB7XG4gKiAgIHByb3ZpZGVyczogW3twcm92aWRlOiBMT0NBTEVfSUQsIHVzZVZhbHVlOiAnZW4tVVMnIH1dXG4gKiB9KTtcbiAqIGBgYFxuICpcbiAqIEBleHBlcmltZW50YWwgaTE4biBzdXBwb3J0IGlzIGV4cGVyaW1lbnRhbC5cbiAqL1xuZXhwb3J0IGNvbnN0IExPQ0FMRV9JRCA9IG5ldyBJbmplY3Rpb25Ub2tlbjxzdHJpbmc+KCdMb2NhbGVJZCcpO1xuXG4vKipcbiAqIFVzZSB0aGlzIHRva2VuIGF0IGJvb3RzdHJhcCB0byBwcm92aWRlIHRoZSBjb250ZW50IG9mIHlvdXIgdHJhbnNsYXRpb24gZmlsZSAoYHh0YmAsXG4gKiBgeGxmYCBvciBgeGxmMmApIHdoZW4geW91IHdhbnQgdG8gdHJhbnNsYXRlIHlvdXIgYXBwbGljYXRpb24gaW4gYW5vdGhlciBsYW5ndWFnZS5cbiAqXG4gKiBTZWUgdGhlIHtAbGlua0RvY3MgZ3VpZGUvaTE4biNtZXJnZSBpMThuIGd1aWRlfSBmb3IgbW9yZSBpbmZvcm1hdGlvbi5cbiAqXG4gKiAjIyMgRXhhbXBsZVxuICpcbiAqIGBgYHR5cGVzY3JpcHRcbiAqIGltcG9ydCB7IFRSQU5TTEFUSU9OUyB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuICogaW1wb3J0IHsgcGxhdGZvcm1Ccm93c2VyRHluYW1pYyB9IGZyb20gJ0Bhbmd1bGFyL3BsYXRmb3JtLWJyb3dzZXItZHluYW1pYyc7XG4gKiBpbXBvcnQgeyBBcHBNb2R1bGUgfSBmcm9tICcuL2FwcC9hcHAubW9kdWxlJztcbiAqXG4gKiAvLyBjb250ZW50IG9mIHlvdXIgdHJhbnNsYXRpb24gZmlsZVxuICogY29uc3QgdHJhbnNsYXRpb25zID0gJy4uLi4nO1xuICpcbiAqIHBsYXRmb3JtQnJvd3NlckR5bmFtaWMoKS5ib290c3RyYXBNb2R1bGUoQXBwTW9kdWxlLCB7XG4gKiAgIHByb3ZpZGVyczogW3twcm92aWRlOiBUUkFOU0xBVElPTlMsIHVzZVZhbHVlOiB0cmFuc2xhdGlvbnMgfV1cbiAqIH0pO1xuICogYGBgXG4gKlxuICogQGV4cGVyaW1lbnRhbCBpMThuIHN1cHBvcnQgaXMgZXhwZXJpbWVudGFsLlxuICovXG5leHBvcnQgY29uc3QgVFJBTlNMQVRJT05TID0gbmV3IEluamVjdGlvblRva2VuPHN0cmluZz4oJ1RyYW5zbGF0aW9ucycpO1xuXG4vKipcbiAqIFByb3ZpZGUgdGhpcyB0b2tlbiBhdCBib290c3RyYXAgdG8gc2V0IHRoZSBmb3JtYXQgb2YgeW91ciB7QGxpbmsgVFJBTlNMQVRJT05TfTogYHh0YmAsXG4gKiBgeGxmYCBvciBgeGxmMmAuXG4gKlxuICogU2VlIHRoZSB7QGxpbmtEb2NzIGd1aWRlL2kxOG4jbWVyZ2UgaTE4biBndWlkZX0gZm9yIG1vcmUgaW5mb3JtYXRpb24uXG4gKlxuICogIyMjIEV4YW1wbGVcbiAqXG4gKiBgYGB0eXBlc2NyaXB0XG4gKiBpbXBvcnQgeyBUUkFOU0xBVElPTlNfRk9STUFUIH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG4gKiBpbXBvcnQgeyBwbGF0Zm9ybUJyb3dzZXJEeW5hbWljIH0gZnJvbSAnQGFuZ3VsYXIvcGxhdGZvcm0tYnJvd3Nlci1keW5hbWljJztcbiAqIGltcG9ydCB7IEFwcE1vZHVsZSB9IGZyb20gJy4vYXBwL2FwcC5tb2R1bGUnO1xuICpcbiAqIHBsYXRmb3JtQnJvd3NlckR5bmFtaWMoKS5ib290c3RyYXBNb2R1bGUoQXBwTW9kdWxlLCB7XG4gKiAgIHByb3ZpZGVyczogW3twcm92aWRlOiBUUkFOU0xBVElPTlNfRk9STUFULCB1c2VWYWx1ZTogJ3hsZicgfV1cbiAqIH0pO1xuICogYGBgXG4gKlxuICogQGV4cGVyaW1lbnRhbCBpMThuIHN1cHBvcnQgaXMgZXhwZXJpbWVudGFsLlxuICovXG5leHBvcnQgY29uc3QgVFJBTlNMQVRJT05TX0ZPUk1BVCA9IG5ldyBJbmplY3Rpb25Ub2tlbjxzdHJpbmc+KCdUcmFuc2xhdGlvbnNGb3JtYXQnKTtcblxuLyoqXG4gKiBVc2UgdGhpcyBlbnVtIGF0IGJvb3RzdHJhcCBhcyBhbiBvcHRpb24gb2YgYGJvb3RzdHJhcE1vZHVsZWAgdG8gZGVmaW5lIHRoZSBzdHJhdGVneVxuICogdGhhdCB0aGUgY29tcGlsZXIgc2hvdWxkIHVzZSBpbiBjYXNlIG9mIG1pc3NpbmcgdHJhbnNsYXRpb25zOlxuICogLSBFcnJvcjogdGhyb3cgaWYgeW91IGhhdmUgbWlzc2luZyB0cmFuc2xhdGlvbnMuXG4gKiAtIFdhcm5pbmcgKGRlZmF1bHQpOiBzaG93IGEgd2FybmluZyBpbiB0aGUgY29uc29sZSBhbmQvb3Igc2hlbGwuXG4gKiAtIElnbm9yZTogZG8gbm90aGluZy5cbiAqXG4gKiBTZWUgdGhlIHtAbGlua0RvY3MgZ3VpZGUvaTE4biNtaXNzaW5nLXRyYW5zbGF0aW9uIGkxOG4gZ3VpZGV9IGZvciBtb3JlIGluZm9ybWF0aW9uLlxuICpcbiAqICMjIyBFeGFtcGxlXG4gKiBgYGB0eXBlc2NyaXB0XG4gKiBpbXBvcnQgeyBNaXNzaW5nVHJhbnNsYXRpb25TdHJhdGVneSB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuICogaW1wb3J0IHsgcGxhdGZvcm1Ccm93c2VyRHluYW1pYyB9IGZyb20gJ0Bhbmd1bGFyL3BsYXRmb3JtLWJyb3dzZXItZHluYW1pYyc7XG4gKiBpbXBvcnQgeyBBcHBNb2R1bGUgfSBmcm9tICcuL2FwcC9hcHAubW9kdWxlJztcbiAqXG4gKiBwbGF0Zm9ybUJyb3dzZXJEeW5hbWljKCkuYm9vdHN0cmFwTW9kdWxlKEFwcE1vZHVsZSwge1xuICogICBtaXNzaW5nVHJhbnNsYXRpb246IE1pc3NpbmdUcmFuc2xhdGlvblN0cmF0ZWd5LkVycm9yXG4gKiB9KTtcbiAqIGBgYFxuICpcbiAqIEBleHBlcmltZW50YWwgaTE4biBzdXBwb3J0IGlzIGV4cGVyaW1lbnRhbC5cbiAqL1xuZXhwb3J0IGVudW0gTWlzc2luZ1RyYW5zbGF0aW9uU3RyYXRlZ3kge1xuICBFcnJvciA9IDAsXG4gIFdhcm5pbmcgPSAxLFxuICBJZ25vcmUgPSAyLFxufVxuIl19