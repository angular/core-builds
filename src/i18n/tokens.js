/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { InjectionToken } from '../di/injection_token';
/**
 * @experimental i18n support is experimental.
 */
export var /** @type {?} */ LOCALE_ID = new InjectionToken('LocaleId');
/**
 * @experimental i18n support is experimental.
 */
export var /** @type {?} */ TRANSLATIONS = new InjectionToken('Translations');
/**
 * @experimental i18n support is experimental.
 */
export var /** @type {?} */ TRANSLATIONS_FORMAT = new InjectionToken('TranslationsFormat');
export var MissingTranslationStrategy = {};
MissingTranslationStrategy.Error = 0;
MissingTranslationStrategy.Warning = 1;
MissingTranslationStrategy.Ignore = 2;
MissingTranslationStrategy[MissingTranslationStrategy.Error] = "Error";
MissingTranslationStrategy[MissingTranslationStrategy.Warning] = "Warning";
MissingTranslationStrategy[MissingTranslationStrategy.Ignore] = "Ignore";
//# sourceMappingURL=tokens.js.map