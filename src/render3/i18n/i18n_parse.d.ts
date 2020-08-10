/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import '../../util/ng_dev_mode';
import '../../util/ng_i18n_closure_mode';
import { I18nUpdateOpCodes, IcuCase, IcuExpression, TIcu } from '../interfaces/i18n';
import { SanitizerFn } from '../interfaces/sanitization';
import { LView, TView } from '../interfaces/view';
/**
 * See `i18nStart` above.
 */
export declare function i18nStartFirstPass(lView: LView, tView: TView, index: number, message: string, subTemplateIndex?: number): void;
/**
 * See `i18nAttributes` above.
 */
export declare function i18nAttributesFirstPass(lView: LView, tView: TView, index: number, values: string[]): void;
/**
 * Generate the OpCodes to update the bindings of a string.
 *
 * @param str The string containing the bindings.
 * @param destinationNode Index of the destination node which will receive the binding.
 * @param attrName Name of the attribute, if the string belongs to an attribute.
 * @param sanitizeFn Sanitization function used to sanitize the string after update, if necessary.
 */
export declare function generateBindingUpdateOpCodes(str: string, destinationNode: number, attrName?: string, sanitizeFn?: SanitizerFn | null): I18nUpdateOpCodes;
export declare function isRootTemplateMessage(subTemplateIndex: number | undefined): subTemplateIndex is undefined;
/**
 * Extracts a part of a message and removes the rest.
 *
 * This method is used for extracting a part of the message associated with a template. A translated
 * message can span multiple templates.
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
export declare function getTranslationForTemplate(message: string, subTemplateIndex?: number): string;
/**
 * Generate the OpCodes for ICU expressions.
 *
 * @param tIcus
 * @param icuExpression
 * @param startIndex
 * @param expandoStartIndex
 */
export declare function icuStart(tIcus: TIcu[], icuExpression: IcuExpression, startIndex: number, expandoStartIndex: number): void;
/**
 * Parses text containing an ICU expression and produces a JSON object for it.
 * Original code from closure library, modified for Angular.
 *
 * @param pattern Text containing an ICU expression that needs to be parsed.
 *
 */
export declare function parseICUBlock(pattern: string): IcuExpression;
/**
 * Parses a node, its children and its siblings, and generates the mutate & update OpCodes.
 *
 * @param currentNode The first node to parse
 * @param icuCase The data for the ICU expression case that contains those nodes
 * @param parentIndex Index of the current node's parent
 * @param nestedIcus Data for the nested ICU expressions that this case contains
 * @param tIcus Data for all ICU expressions of the current message
 * @param expandoStartIndex Expando start index for the current ICU expression
 */
export declare function parseNodes(currentNode: Node | null, icuCase: IcuCase, parentIndex: number, nestedIcus: IcuExpression[], tIcus: TIcu[], expandoStartIndex: number): void;
