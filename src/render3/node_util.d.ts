/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { RelativeInjectorLocation } from './interfaces/injector';
import { TContainerNode, TElementNode, TNode } from './interfaces/node';
import { LView } from './interfaces/view';
/**
 * If `startTNode.parent` exists and has an injector, returns TNode for that injector.
 * Otherwise, unwraps a parent injector location number to find the view offset from the current
 * injector, then walks up the declaration view tree until the TNode of the parent injector is
 * found.
 *
 * @param location The location of the parent injector, which contains the view offset
 * @param startView The LView instance from which to start walking up the view tree
 * @param startTNode The TNode instance of the starting element
 * @returns The TNode of the parent injector
 */
export declare function getParentInjectorTNode(location: RelativeInjectorLocation, startView: LView, startTNode: TNode): TElementNode | TContainerNode | null;
