/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { RElement } from '../interfaces/renderer';
/**
 * Used for stringify render output in Ivy.
 * Important! This function is very performance-sensitive and we should
 * be extra careful not to introduce megamorphic reads in it.
 */
export declare function renderStringify(value: any): string;
/**
 * Used to stringify a value so that it can be displayed in an error message.
 * Important! This function contains a megamorphic read and should only be
 * used for error messages.
 */
export declare function stringifyForError(value: any): string;
export declare const defaultScheduler: typeof setTimeout | typeof requestAnimationFrame;
/**
 *
 * @codeGenApi
 */
export declare function ɵɵresolveWindow(element: RElement & {
    ownerDocument: Document;
}): {
    name: string;
    target: (Window & typeof globalThis) | null;
};
/**
 *
 * @codeGenApi
 */
export declare function ɵɵresolveDocument(element: RElement & {
    ownerDocument: Document;
}): {
    name: string;
    target: Document;
};
/**
 *
 * @codeGenApi
 */
export declare function ɵɵresolveBody(element: RElement & {
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
 * Unwrap a value which might be behind a closure (for forward declaration reasons).
 */
export declare function maybeUnwrapFn<T>(value: T | (() => T)): T;
