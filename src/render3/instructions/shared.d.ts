import { PropertyAliasValue } from '../interfaces/node';
import { LView } from '../interfaces/view';
/**
 * Set the inputs of directives at the current node to corresponding value.
 *
 * @param lView the `LView` which contains the directives.
 * @param inputAliases mapping between the public "input" name and privately-known,
 * possibly minified, property names to write to.
 * @param value Value to set.
 */
export declare function setInputsForProperty(lView: LView, inputs: PropertyAliasValue, value: any): void;
