/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { RElement } from '../interfaces/renderer';
/**
 * Returns whether the values are different from a change detection stand point.
 *
 * Constraints are relaxed in checkNoChanges mode. See `devModeEqual` for details.
 */
export declare function isDifferent(a: any, b: any): boolean;
/**
 * Used for stringify render output in Ivy.
 */
export declare function renderStringify(value: any): string;
export declare const defaultScheduler: any;
export declare function resolveWindow(element: RElement & {
    ownerDocument: Document;
}): {
    name: string;
    target: Window | null;
};
export declare function resolveDocument(element: RElement & {
    ownerDocument: Document;
}): {
    name: string;
    target: Document;
};
export declare function resolveBody(element: RElement & {
    ownerDocument: Document;
}): {
    name: string;
    target: HTMLElement;
};
/**
 * The special delimiter we use to separate property names, prefixes, and suffixes
 * in property binding metadata. See storeBindingMetadata().
 *
 * We intentionally use the Unicode "REPLACEMENT CHARACTER" (U+FFFD) as a delimiter
 * because it is a very uncommon character that is unlikely to be part of a user's
 * property names or interpolation strings. If it is in fact used in a property
 * binding, DebugElement.properties will not return the correct value for that
 * binding. However, there should be no runtime effect for real applications.
 *
 * This character is typically rendered as a question mark inside of a diamond.
 * See https://en.wikipedia.org/wiki/Specials_(Unicode_block)
 *
 */
export declare const INTERPOLATION_DELIMITER = "\uFFFD";
/**
 * Determines whether or not the given string is a property metadata string.
 * See storeBindingMetadata().
 */
export declare function isPropMetadataString(str: string): boolean;
