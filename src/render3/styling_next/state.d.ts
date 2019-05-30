/**
* @license
* Copyright Google Inc. All Rights Reserved.
*
* Use of this source code is governed by an MIT-style license that can be
* found in the LICENSE file at https://angular.io/license
*/
import { Sanitizer } from '../../sanitization/security';
import { StyleSanitizeFn } from '../../sanitization/style_sanitizer';
/**
 * --------
 *
 * This file contains temporary code to incorporate the new styling refactor
 * code to work alongside the existing instruction set.
 *
 * This file will be removed once `select(n)` is fully functional (once
 * it is able to evaluate host bindings in sync element-by-element
 * with template code).
 *
 * --------
 */
/**
 * A temporary enum of states that inform the core whether or not
 * to defer all styling instruction calls to the old or new
 * styling implementation.
 */
export declare const enum RuntimeStylingMode {
    UseOld = 0,
    UseBothOldAndNew = 1,
    UseNew = 2
}
/**
 * Temporary function used to inform the existing styling algorithm
 * code to delegate all styling instruction calls to the new refactored
 * styling code.
 */
export declare function runtimeSetStylingMode(mode: RuntimeStylingMode): void;
export declare function runtimeIsNewStylingInUse(): boolean;
export declare function runtimeAllowOldStyling(): boolean;
export declare function setCurrentStyleSanitizer(sanitizer: Sanitizer | StyleSanitizeFn | null): void;
export declare function getCurrentStyleSanitizer(): StyleSanitizeFn | Sanitizer | null;
