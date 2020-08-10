/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { I18nMutateOpCodes, I18nUpdateOpCodes } from '../interfaces/i18n';
/**
 * Converts `I18nUpdateOpCodes` array into a human readable format.
 *
 * This function is attached to the `I18nUpdateOpCodes.debug` property if `ngDevMode` is enabled.
 * This function provides a human readable view of the opcodes. This is useful when debugging the
 * application as well as writing more readable tests.
 *
 * @param this `I18nUpdateOpCodes` if attached as a method.
 * @param opcodes `I18nUpdateOpCodes` if invoked as a function.
 */
export declare function i18nUpdateOpCodesToString(this: I18nUpdateOpCodes | void, opcodes?: I18nUpdateOpCodes): string[];
/**
 * Converts `I18nMutableOpCodes` array into a human readable format.
 *
 * This function is attached to the `I18nMutableOpCodes.debug` if `ngDevMode` is enabled. This
 * function provides a human readable view of the opcodes. This is useful when debugging the
 * application as well as writing more readable tests.
 *
 * @param this `I18nMutableOpCodes` if attached as a method.
 * @param opcodes `I18nMutableOpCodes` if invoked as a function.
 */
export declare function i18nMutateOpCodesToString(this: I18nMutateOpCodes | void, opcodes?: I18nMutateOpCodes): string[];
