import { TAttributes, TNode } from '../interfaces/node';
/**
 * This file contains the core logic for how styling instructions are processed in Angular.
 *
 * To learn more about the algorithm see `TStylingContext`.
 */
/**
 * Temporary function to bridge styling functionality between this new
 * refactor (which is here inside of `styling_next/`) and the old
 * implementation (which lives inside of `styling/`).
 *
 * This function is executed during the creation block of an element.
 * Because the existing styling implementation issues a call to the
 * `styling()` instruction, this instruction will also get run. The
 * central idea here is that the directive index values are bound
 * into the context. The directive index is temporary and is only
 * required until the `select(n)` instruction is fully functional.
 */
export declare function stylingInit(): void;
/**
 * Mirror implementation of the `styleProp()` instruction (found in `instructions/styling.ts`).
 */
export declare function styleProp(prop: string, value: string | number | String | null, suffix?: string | null): void;
/**
 * Mirror implementation of the `classProp()` instruction (found in `instructions/styling.ts`).
 */
export declare function classProp(className: string, value: boolean | null): void;
/**
 * Temporary function to bridge styling functionality between this new
 * refactor (which is here inside of `styling_next/`) and the old
 * implementation (which lives inside of `styling/`).
 *
 * The new styling refactor ensures that styling flushing is called
 * automatically when a template function exits or a follow-up element
 * is visited (i.e. when `select(n)` is called). Because the `select(n)`
 * instruction is not fully implemented yet (it doesn't actually execute
 * host binding instruction code at the right time), this means that a
 * styling apply function is still needed.
 *
 * This function is a mirror implementation of the `stylingApply()`
 * instruction (found in `instructions/styling.ts`).
 */
export declare function stylingApply(): void;
/**
 * Searches and assigns provided all static style/class entries (found in the `attrs` value)
 * and registers them in their respective styling contexts.
 */
export declare function registerInitialStylingIntoContext(tNode: TNode, attrs: TAttributes, startIndex: number): void;
/**
 * Mirror implementation of the same function found in `instructions/styling.ts`.
 */
export declare function getActiveDirectiveStylingIndex(): number;
