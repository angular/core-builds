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
import { RComment, RElement, RText } from '../interfaces/renderer';
import { LView, TData } from '../interfaces/view';
/**
 * Takes the value of a slot in `LView` and returns the element node.
 *
 * Normally, element nodes are stored flat, but if the node has styles/classes on it,
 * it might be wrapped in a styling context. Or if that node has a directive that injects
 * ViewContainerRef, it may be wrapped in an LContainer. Or if that node is a component,
 * it will be wrapped in LView. It could even have all three, so we keep looping
 * until we find something that isn't an array.
 *
 * @param value The initial value in `LView`
 */
export declare function readElementValue(value: any): RElement;
/**
 * Retrieves an element value from the provided `viewData`, by unwrapping
 * from any containers, component views, or style contexts.
 */
export declare function getNativeByIndex(index: number, lView: LView): RElement;
export declare function getNativeByTNode(tNode: TNode, hostView: LView): RElement | RText | RComment;
export declare function getTNode(index: number, view: LView): TNode;
/**
 * Returns true if the value is an {@link LView}
 * @param value the value to check
 */
export declare function isLView(value: any): value is LView;
/** Retrieves a value from any `LView` or `TData`. */
export declare function loadInternal<T>(view: LView | TData, index: number): T;
export declare function getComponentViewByIndex(nodeIndex: number, hostView: LView): LView;
export declare function isContentQueryHost(tNode: TNode): boolean;
export declare function isComponent(tNode: TNode): boolean;
export declare function isComponentDef<T>(def: DirectiveDef<T>): def is ComponentDef<T>;
export declare function isLContainer(value: any): value is LContainer;
export declare function isRootView(target: LView): boolean;
/**
 * Returns the monkey-patch value data present on the target (which could be
 * a component, directive or a DOM node).
 */
export declare function readPatchedData(target: any): LView | LContext | null;
export declare function readPatchedLView(target: any): LView | null;
