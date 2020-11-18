import { TNode } from './interfaces/node';
import { LView } from './interfaces/view';
/** Called when there are multiple component selectors that match a given node */
export declare function throwMultipleComponentError(tNode: TNode): never;
/** Throws an ExpressionChangedAfterChecked error if checkNoChanges mode is on. */
export declare function throwErrorIfNoChangesMode(creationMode: boolean, oldValue: any, currValue: any, propName?: string): never | void;
/**
 * Constructs an object that contains details for the ExpressionChangedAfterItHasBeenCheckedError:
 * - property name (for property bindings or interpolations)
 * - old and new values, enriched using information from metadata
 *
 * More information on the metadata storage format can be found in `storePropertyBindingMetadata`
 * function description.
 */
export declare function getExpressionChangedErrorDetails(lView: LView, bindingIndex: number, oldValue: any, newValue: any): {
    propName?: string;
    oldValue: any;
    newValue: any;
};
