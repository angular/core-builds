/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import '../../util/ng_dev_mode';
import '../../util/ng_i18n_closure_mode';
import { I18nUpdateOpCodes, IcuExpression, TIcu } from '../interfaces/i18n';
import { SanitizerFn } from '../interfaces/sanitization';
import { LView, TView } from '../interfaces/view';
/**
 * Create dynamic nodes from i18n translation block.
 *
 * - Text nodes are created synchronously
 * - TNodes are linked into tree lazily
 *
 * @param tView Current `TView`
 * @parentTNodeIndex index to the parent TNode of this i18n block
 * @param lView Current `LView`
 * @param index Index of `ɵɵi18nStart` instruction.
 * @param message Message to translate.
 * @param subTemplateIndex Index into the sub template of message translation. (ie in case of
 *     `ngIf`) (-1 otherwise)
 */
export declare function i18nStartFirstCreatePass(tView: TView, parentTNodeIndex: number, lView: LView, index: number, message: string, subTemplateIndex: number): void;
/**
 * See `i18nAttributes` above.
 */
export declare function i18nAttributesFirstPass(lView: LView, tView: TView, index: number, values: string[]): void;
/**
 * Generate the OpCodes to update the bindings of a string.
 *
 * @param updateOpCodes Place where the update opcodes will be stored.
 * @param str The string containing the bindings.
 * @param destinationNode Index of the destination node which will receive the binding.
 * @param attrName Name of the attribute, if the string belongs to an attribute.
 * @param sanitizeFn Sanitization function used to sanitize the string after update, if necessary.
 */
export declare function generateBindingUpdateOpCodes(updateOpCodes: I18nUpdateOpCodes, str: string, destinationNode: number, attrName?: string, sanitizeFn?: SanitizerFn | null): number;
export declare function isRootTemplateMessage(subTemplateIndex: number): subTemplateIndex is -1;
/**
 * Extracts a part of a message and removes the rest.
 *
 * This method is used for extracting a part of the message associated with a template. A
 * translated message can span multiple templates.
 *
 * Example:
 * ```
 * <div i18n>Translate <span *ngIf>me</span>!</div>
 * ```
 *
 * @param message The message to crop
 * @param subTemplateIndex Index of the sub-template to extract. If undefined it returns the
 * external template and removes all sub-templates.
 */
export declare function getTranslationForTemplate(message: string, subTemplateIndex: number): string;
/**
 * Generate the OpCodes for ICU expressions.
 *
 * @param icuExpression
 * @param index Index where the anchor is stored and an optional `TIcuContainerNode`
 *   - `lView[anchorIdx]` points to a `Comment` node representing the anchor for the ICU.
 *   - `tView.data[anchorIdx]` points to the `TIcuContainerNode` if ICU is root (`null` otherwise)
 */
export declare function icuStart(tView: TView, lView: LView, updateOpCodes: I18nUpdateOpCodes, parentIdx: number, icuExpression: IcuExpression, anchorIdx: number): void;
/**
 * Parses text containing an ICU expression and produces a JSON object for it.
 * Original code from closure library, modified for Angular.
 *
 * @param pattern Text containing an ICU expression that needs to be parsed.
 *
 */
export declare function parseICUBlock(pattern: string): IcuExpression;
/**
 * Breaks pattern into strings and top level {...} blocks.
 * Can be used to break a message into text and ICU expressions, or to break an ICU expression
 * into keys and cases. Original code from closure library, modified for Angular.
 *
 * @param pattern (sub)Pattern to be broken.
 * @returns An `Array<string|IcuExpression>` where:
 *   - odd positions: `string` => text between ICU expressions
 *   - even positions: `ICUExpression` => ICU expression parsed into `ICUExpression` record.
 */
export declare function i18nParseTextIntoPartsAndICU(pattern: string): (string | IcuExpression)[];
/**
 * Parses a node, its children and its siblings, and generates the mutate & update OpCodes.
 *
 */
export declare function parseIcuCase(tView: TView, tIcu: TIcu, lView: LView, updateOpCodes: I18nUpdateOpCodes, parentIdx: number, caseName: string, unsafeCaseHtml: string, nestedIcus: IcuExpression[]): number;
