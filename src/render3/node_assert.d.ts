/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { TContainerNode, TElementContainerNode, TElementNode, TIcuContainerNode, TNode, TNodeType, TProjectionNode } from './interfaces/node';
export declare function assertNodeType(tNode: TNode, type: TNodeType.Container): asserts tNode is TContainerNode;
export declare function assertNodeType(tNode: TNode, type: TNodeType.Element): asserts tNode is TElementNode;
export declare function assertNodeType(tNode: TNode, type: TNodeType.ElementContainer): asserts tNode is TElementContainerNode;
export declare function assertNodeType(tNode: TNode, type: TNodeType.IcuContainer): asserts tNode is TIcuContainerNode;
export declare function assertNodeType(tNode: TNode, type: TNodeType.Projection): asserts tNode is TProjectionNode;
export declare function assertNodeType(tNode: TNode, type: TNodeType.View): asserts tNode is TContainerNode;
export declare function assertNodeOfPossibleTypes(tNode: TNode | null, ...types: TNodeType[]): void;
export declare function assertNodeNotOfTypes(tNode: TNode, types: TNodeType[], message?: string): void;
