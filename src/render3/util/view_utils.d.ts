/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { LContainer } from '../interfaces/container';
import { LContext } from '../interfaces/context';
import { ComponentDef, DirectiveDef } from '../interfaces/definition';
import { TNode } from '../interfaces/node';
import { RNode } from '../interfaces/renderer';
import { StylingContext } from '../interfaces/styling';
import { LView, TData } from '../interfaces/view';
/**
 * For efficiency reasons we often put several different data types (`RNode`, `LView`, `LContainer`,
 * `StylingContext`) in same location in `LView`. This is because we don't want to pre-allocate
 * space for it because the storage is sparse. This file contains utilities for dealing with such
 * data types.
 *
 * How do we know what is stored at a given location in `LView`.
 * - `Array.isArray(value) === false` => `RNode` (The normal storage value)
 * - `Array.isArray(value) === true` => then the `value[0]` represents the wrapped value.
 *   - `typeof value[TYPE] === 'object'` => `LView`
 *      - This happens when we have a component at a given location
 *   - `typeof value[TYPE] === 'number'` => `StylingContext`
 *      - This happens when we have style/class binding at a given location.
 *   - `typeof value[TYPE] === true` => `LContainer`
 *      - This happens when we have `LContainer` binding at a given location.
 *
 *
 * NOTE: it is assumed that `Array.isArray` and `typeof` operations are very efficient.
 */
/**
 * Returns `RNode`.
 * @param value wrapped value of `RNode`, `LView`, `LContainer`, `StylingContext`
 */
export declare function unwrapRNode(value: RNode | LView | LContainer | StylingContext): RNode;
/**
 * Returns `LView` or `null` if not found.
 * @param value wrapped value of `RNode`, `LView`, `LContainer`, `StylingContext`
 */
export declare function unwrapLView(value: RNode | LView | LContainer | StylingContext): LView | null;
/**
 * Returns `LContainer` or `null` if not found.
 * @param value wrapped value of `RNode`, `LView`, `LContainer`, `StylingContext`
 */
export declare function unwrapLContainer(value: RNode | LView | LContainer | StylingContext): LContainer | null;
/**
 * Returns `StylingContext` or `null` if not found.
 * @param value wrapped value of `RNode`, `LView`, `LContainer`, `StylingContext`
 */
export declare function unwrapStylingContext(value: RNode | LView | LContainer | StylingContext): StylingContext | null;
/**
 * True if `value` is `LView`.
 * @param value wrapped value of `RNode`, `LView`, `LContainer`, `StylingContext`
 */
export declare function isLView(value: RNode | LView | LContainer | StylingContext | {} | null): value is LView;
/**
 * True if `value` is `LContainer`.
 * @param value wrapped value of `RNode`, `LView`, `LContainer`, `StylingContext`
 */
export declare function isLContainer(value: RNode | LView | LContainer | StylingContext | {} | null): value is LContainer;
/**
 * True if `value` is `StylingContext`.
 * @param value wrapped value of `RNode`, `LView`, `LContainer`, `StylingContext`
 */
export declare function isStylingContext(value: RNode | LView | LContainer | StylingContext | {} | null): value is StylingContext;
/**
 * Retrieves an element value from the provided `viewData`, by unwrapping
 * from any containers, component views, or style contexts.
 */
export declare function getNativeByIndex(index: number, lView: LView): RNode;
export declare function getNativeByTNode(tNode: TNode, hostView: LView): RNode;
export declare function getTNode(index: number, view: LView): TNode;
/** Retrieves a value from any `LView` or `TData`. */
export declare function loadInternal<T>(view: LView | TData, index: number): T;
export declare function getComponentViewByIndex(nodeIndex: number, hostView: LView): LView;
export declare function isContentQueryHost(tNode: TNode): boolean;
export declare function isComponent(tNode: TNode): boolean;
export declare function isComponentDef<T>(def: DirectiveDef<T>): def is ComponentDef<T>;
export declare function isRootView(target: LView): boolean;
/**
 * Returns the monkey-patch value data present on the target (which could be
 * a component, directive or a DOM node).
 */
export declare function readPatchedData(target: any): LView | LContext | null;
export declare function readPatchedLView(target: any): LView | null;
/**
 * Returns a boolean for whether the view is attached to the change detection tree.
 *
 * Note: This determines whether a view should be checked, not whether it's inserted
 * into a container. For that, you'll want `viewAttachedToContainer` below.
 */
export declare function viewAttachedToChangeDetector(view: LView): boolean;
/** Returns a boolean for whether the view is attached to a container. */
export declare function viewAttachedToContainer(view: LView): boolean;
