/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { LContainer } from '../interfaces/container';
import { LContext } from '../interfaces/context';
import { TConstants, TNode } from '../interfaces/node';
import { RNode } from '../interfaces/renderer';
import { LView, TData, TView } from '../interfaces/view';
/**
 * For efficiency reasons we often put several different data types (`RNode`, `LView`, `LContainer`)
 * in same location in `LView`. This is because we don't want to pre-allocate space for it
 * because the storage is sparse. This file contains utilities for dealing with such data types.
 *
 * How do we know what is stored at a given location in `LView`.
 * - `Array.isArray(value) === false` => `RNode` (The normal storage value)
 * - `Array.isArray(value) === true` => then the `value[0]` represents the wrapped value.
 *   - `typeof value[TYPE] === 'object'` => `LView`
 *      - This happens when we have a component at a given location
 *   - `typeof value[TYPE] === true` => `LContainer`
 *      - This happens when we have `LContainer` binding at a given location.
 *
 *
 * NOTE: it is assumed that `Array.isArray` and `typeof` operations are very efficient.
 */
/**
 * Returns `RNode`.
 * @param value wrapped value of `RNode`, `LView`, `LContainer`
 */
export declare function unwrapRNode(value: RNode | LView | LContainer): RNode;
/**
 * Returns `LView` or `null` if not found.
 * @param value wrapped value of `RNode`, `LView`, `LContainer`
 */
export declare function unwrapLView(value: RNode | LView | LContainer): LView | null;
/**
 * Returns `LContainer` or `null` if not found.
 * @param value wrapped value of `RNode`, `LView`, `LContainer`
 */
export declare function unwrapLContainer(value: RNode | LView | LContainer): LContainer | null;
/**
 * Retrieves an element value from the provided `viewData`, by unwrapping
 * from any containers, component views, or style contexts.
 */
export declare function getNativeByIndex(index: number, lView: LView): RNode;
/**
 * Retrieve an `RNode` for a given `TNode` and `LView`.
 *
 * This function guarantees in dev mode to retrieve a non-null `RNode`.
 *
 * @param tNode
 * @param lView
 */
export declare function getNativeByTNode(tNode: TNode, lView: LView): RNode;
/**
 * Retrieve an `RNode` or `null` for a given `TNode` and `LView`.
 *
 * Some `TNode`s don't have associated `RNode`s. For example `Projection`
 *
 * @param tNode
 * @param lView
 */
export declare function getNativeByTNodeOrNull(tNode: TNode, lView: LView): RNode | null;
export declare function getTNode(tView: TView, index: number): TNode;
/** Retrieves a value from any `LView` or `TData`. */
export declare function load<T>(view: LView | TData, index: number): T;
export declare function getComponentLViewByIndex(nodeIndex: number, hostView: LView): LView;
/**
 * Returns the monkey-patch value data present on the target (which could be
 * a component, directive or a DOM node).
 */
export declare function readPatchedData(target: any): LView | LContext | null;
export declare function readPatchedLView(target: any): LView | null;
/** Checks whether a given view is in creation mode */
export declare function isCreationMode(view: LView): boolean;
/**
 * Returns a boolean for whether the view is attached to the change detection tree.
 *
 * Note: This determines whether a view should be checked, not whether it's inserted
 * into a container. For that, you'll want `viewAttachedToContainer` below.
 */
export declare function viewAttachedToChangeDetector(view: LView): boolean;
/** Returns a boolean for whether the view is attached to a container. */
export declare function viewAttachedToContainer(view: LView): boolean;
/** Returns a constant from `TConstants` instance. */
export declare function getConstant<T>(consts: TConstants | null, index: number | null | undefined): T | null;
/**
 * Resets the pre-order hook flags of the view.
 * @param lView the LView on which the flags are reset
 */
export declare function resetPreOrderHookFlags(lView: LView): void;
/**
 * Updates the `TRANSPLANTED_VIEWS_TO_REFRESH` counter on the `LContainer` as well as the parents
 * whose
 *  1. counter goes from 0 to 1, indicating that there is a new child that has a view to refresh
 *  or
 *  2. counter goes from 1 to 0, indicating there are no more descendant views to refresh
 */
export declare function updateTransplantedViewCount(lContainer: LContainer, amount: 1 | -1): void;
