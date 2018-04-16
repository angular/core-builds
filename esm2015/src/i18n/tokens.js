/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes} checked by tsc
 */
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
 * See the {\@linkDocs guide/i18n#setting-up-locale i18n guide} for more information.
 *
 * ### Example
 *
 * ```typescript
 * import { LOCALE_ID } from '\@angular/core';
 * import { platformBrowserDynamic } from '\@angular/platform-browser-dynamic';
 * import { AppModule } from './app/app.module';
 *
 * platformBrowserDynamic().bootstrapModule(AppModule, {
 *   providers: [{provide: LOCALE_ID, useValue: 'en-US' }]
 * });
 * ```
 *
 * \@experimental i18n support is experimental.
 */
export const /** @type {?} */ LOCALE_ID = new InjectionToken('LocaleId');
/**
 * Use this token at bootstrap to provide the content of your translation file (`xtb`,
 * `xlf` or `xlf2`) when you want to translate your application in another language.
 *
 * See the {\@linkDocs guide/i18n#merge i18n guide} for more information.
 *
 * ### Example
 *
 * ```typescript
 * import { TRANSLATIONS } from '\@angular/core';
 * import { platformBrowserDynamic } from '\@angular/platform-browser-dynamic';
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
 * \@experimental i18n support is experimental.
 */
export const /** @type {?} */ TRANSLATIONS = new InjectionToken('Translations');
/**
 * Provide this token at bootstrap to set the format of your {\@link TRANSLATIONS}: `xtb`,
 * `xlf` or `xlf2`.
 *
 * See the {\@linkDocs guide/i18n#merge i18n guide} for more information.
 *
 * ### Example
 *
 * ```typescript
 * import { TRANSLATIONS_FORMAT } from '\@angular/core';
 * import { platformBrowserDynamic } from '\@angular/platform-browser-dynamic';
 * import { AppModule } from './app/app.module';
 *
 * platformBrowserDynamic().bootstrapModule(AppModule, {
 *   providers: [{provide: TRANSLATIONS_FORMAT, useValue: 'xlf' }]
 * });
 * ```
 *
 * \@experimental i18n support is experimental.
 */
export const /** @type {?} */ TRANSLATIONS_FORMAT = new InjectionToken('TranslationsFormat');
/** @enum {number} */
const MissingTranslationStrategy = {
    Error: 0,
    Warning: 1,
    Ignore: 2,
};
export { MissingTranslationStrategy };
MissingTranslationStrategy[MissingTranslationStrategy.Error] = "Error";
MissingTranslationStrategy[MissingTranslationStrategy.Warning] = "Warning";
MissingTranslationStrategy[MissingTranslationStrategy.Ignore] = "Ignore";
//# sourceMappingURL=tokens.js.map