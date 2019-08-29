import { NO_CHANGE } from '../tokens';
/**
 * Create static text node
 *
 * @param index Index of the node in the data array
 * @param value Static string value to write.
 *
 * @codeGenApi
 */
export declare function ɵɵtext(index: number, value?: string): void;
/**
 * Create text node with binding
 * Bindings should be handled externally with the proper interpolation(1-8) method
 *
 * @param value Stringified value to write.
 *
 * @codeGenApi
 */
export declare function ɵɵtextBinding<T>(value: T | NO_CHANGE): void;
