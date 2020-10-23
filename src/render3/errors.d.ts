/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { InjectorType } from '../di/interface/defs';
import { TNode } from './interfaces/node';
import { LView } from './interfaces/view';
/** Called when directives inject each other (creating a circular dependency) */
export declare function throwCyclicDependencyError(token: string, path?: string[]): never;
/** Called when there are multiple component selectors that match a given node */
export declare function throwMultipleComponentError(tNode: TNode): never;
export declare function throwMixedMultiProviderError(): void;
export declare function throwInvalidProviderError(ngModuleType?: InjectorType<any>, providers?: any[], provider?: any): void;
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
/** Throws an error when a token is not found in DI. */
export declare function throwProviderNotFoundError(token: any, injectorName?: string): never;
