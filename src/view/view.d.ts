/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ViewEncapsulation } from '../metadata/view';
import { NodeDef, RootData, ViewData, ViewDefinition, ViewFlags, ViewHandleEventFn, ViewUpdateFn } from './types';
export declare function viewDef(flags: ViewFlags, nodesWithoutIndices: NodeDef[], updateDirectives?: ViewUpdateFn, updateRenderer?: ViewUpdateFn, handleEvent?: ViewHandleEventFn, compId?: string, encapsulation?: ViewEncapsulation, styles?: string[]): ViewDefinition;
export declare function createEmbeddedView(parent: ViewData, anchorDef: NodeDef, context?: any): ViewData;
export declare function createRootView(root: RootData, def: ViewDefinition, context?: any): ViewData;
export declare function checkNoChangesView(view: ViewData): void;
export declare function checkAndUpdateView(view: ViewData): void;
export declare function destroyView(view: ViewData): void;
