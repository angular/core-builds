/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { LContainerNode, LElementContainerNode, LElementNode, TNode } from './interfaces/node';
import { LViewData, RootContext, TData } from './interfaces/view';
/**
 * Returns whether the values are different from a change detection stand point.
 *
 * Constraints are relaxed in checkNoChanges mode. See `devModeEqual` for details.
 */
export declare function isDifferent(a: any, b: any, checkNoChangesMode: boolean): boolean;
export declare function stringify(value: any): string;
/**
 *  Function that throws a "not implemented" error so it's clear certain
 *  behaviors/methods aren't yet ready.
 *
 * @returns Not implemented error
 */
export declare function notImplemented(): Error;
/**
 * Flattens an array in non-recursive way. Input arrays are not modified.
 */
export declare function flatten(list: any[]): any[];
/** Retrieves a value from any `LViewData` or `TData`. */
export declare function loadInternal<T>(index: number, arr: LViewData | TData): T;
export declare function assertDataInRangeInternal(index: number, arr: any[]): void;
/** Retrieves an element value from the provided `viewData`.
  *
  * Elements that are read may be wrapped in a style context,
  * therefore reading the value may involve unwrapping that.
  */
export declare function loadElementInternal(index: number, arr: LViewData): LElementNode;
export declare function getLNode(tNode: TNode, hostView: LViewData): LElementNode | LContainerNode | LElementContainerNode;
export declare function isContentQueryHost(tNode: TNode): boolean;
export declare function isComponent(tNode: TNode): boolean;
/**
 * Retrieve the root view from any component by walking the parent `LViewData` until
 * reaching the root `LViewData`.
 *
 * @param component any component
 */
export declare function getRootView(target: LViewData | {}): LViewData;
export declare function getRootContext(viewOrComponent: LViewData | {}): RootContext;
