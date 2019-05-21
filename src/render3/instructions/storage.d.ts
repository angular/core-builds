/** Store a value in the `data` at a given `index`. */
export declare function store<T>(index: number, value: T): void;
/**
 * Retrieves a local reference from the current contextViewData.
 *
 * If the reference to retrieve is in a parent view, this instruction is used in conjunction
 * with a nextContext() call, which walks up the tree and updates the contextViewData instance.
 *
 * @param index The index of the local ref in contextViewData.
 *
 * @codeGenApi
 */
export declare function ɵɵreference<T>(index: number): T;
/**
 * Retrieves a value from current `viewData`.
 *
 * @codeGenApi
 */
export declare function ɵɵload<T>(index: number): T;
