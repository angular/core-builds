import { SanitizerFn } from '../interfaces/sanitization';
import { LView } from '../interfaces/view';
import { NO_CHANGE } from '../tokens';
import { TsickleIssue1009 } from './shared';
/**
 * Update a property on a selected element.
 *
 * Operates on the element selected by index via the {@link select} instruction.
 *
 * If the property name also exists as an input property on one of the element's directives,
 * the component property will be set instead of the element property. This check must
 * be conducted at runtime so child components that add new `@Inputs` don't have to be re-compiled
 *
 * @param propName Name of property. Because it is going to DOM, this is not subject to
 *        renaming as part of minification.
 * @param value New value to write.
 * @param sanitizer An optional function used to sanitize the value.
 * @returns This function returns itself so that it may be chained
 * (e.g. `property('name', ctx.name)('title', ctx.title)`)
 *
 * @codeGenApi
 */
export declare function ɵɵproperty<T>(propName: string, value: T, sanitizer?: SanitizerFn | null): TsickleIssue1009;
/**
 * Creates a single value binding.
 *
 * @param lView Current view
 * @param value Value to diff
 */
export declare function bind<T>(lView: LView, value: T): T | NO_CHANGE;
