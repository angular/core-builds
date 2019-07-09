import { TAttributes } from '../interfaces/node';
/**
 * Creates a logical container for other nodes (<ng-container>) backed by a comment node in the DOM.
 * The instruction must later be followed by `elementContainerEnd()` call.
 *
 * @param index Index of the element in the LView array
 * @param attrs Set of attributes to be used when matching directives.
 * @param localRefs A set of local reference bindings on the element.
 *
 * Even if this instruction accepts a set of attributes no actual attribute values are propagated to
 * the DOM (as a comment node can't have attributes). Attributes are here only for directive
 * matching purposes and setting initial inputs of directives.
 *
 * @codeGenApi
 */
export declare function ɵɵelementContainerStart(index: number, attrs?: TAttributes | null, localRefs?: string[] | null): void;
/**
 * Mark the end of the <ng-container>.
 *
 * @codeGenApi
 */
export declare function ɵɵelementContainerEnd(): void;
/**
 * Creates an empty logical container using {@link elementContainerStart}
 * and {@link elementContainerEnd}
 *
 * @param index Index of the element in the LView array
 * @param attrs Set of attributes to be used when matching directives.
 * @param localRefs A set of local reference bindings on the element.
 *
 * @codeGenApi
 */
export declare function ɵɵelementContainer(index: number, attrs?: TAttributes | null, localRefs?: string[] | null): void;
