/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ComponentDef, DirectiveDef } from '..';
import { LContainer } from './container';
import { TNode } from './node';
import { RNode } from './renderer';
import { StylingContext } from './styling';
import { LView } from './view';
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
export declare function isContentQueryHost(tNode: TNode): boolean;
export declare function isComponent(tNode: TNode): boolean;
export declare function isComponentDef<T>(def: DirectiveDef<T>): def is ComponentDef<T>;
export declare function isRootView(target: LView): boolean;
