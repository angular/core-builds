/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { I18nMutateOpCodes, I18nUpdateOpCodes, TIcu } from '../interfaces/i18n';
import { LView, TView } from '../interfaces/view';
export declare function pushI18nIndex(index: number): void;
export declare function setMaskBit(bit: boolean): void;
export declare function applyI18n(tView: TView, lView: LView, index: number): void;
/**
 * Apply `I18nMutateOpCodes` OpCodes.
 *
 * @param tView Current `TView`
 * @param rootIndex Pointer to the root (parent) tNode for the i18n.
 * @param createOpCodes OpCodes to process
 * @param lView Current `LView`
 */
export declare function applyCreateOpCodes(tView: TView, rootindex: number, createOpCodes: I18nMutateOpCodes, lView: LView): number[];
/**
 * Apply `I18nUpdateOpCodes` OpCodes
 *
 * @param tView Current `TView`
 * @param tIcus If ICUs present than this contains them.
 * @param lView Current `LView`
 * @param updateOpCodes OpCodes to process
 * @param bindingsStartIndex Location of the first `ɵɵi18nApply`
 * @param changeMask Each bit corresponds to a `ɵɵi18nExp` (Counting backwards from
 *     `bindingsStartIndex`)
 */
export declare function applyUpdateOpCodes(tView: TView, tIcus: TIcu[] | null, lView: LView, updateOpCodes: I18nUpdateOpCodes, bindingsStartIndex: number, changeMask: number): void;
/**
 * See `i18nEnd` above.
 */
export declare function i18nEndFirstPass(tView: TView, lView: LView): void;
