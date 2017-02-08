/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { RenderComponentType } from '../render/api';
import { NodeDef, RootData, ViewData, ViewDefinition, ViewFlags, ViewHandleEventFn, ViewUpdateFn } from './types';
export declare function viewDef(flags: ViewFlags, nodesWithoutIndices: NodeDef[], update?: ViewUpdateFn, handleEvent?: ViewHandleEventFn, componentType?: RenderComponentType): ViewDefinition;
export declare function createEmbeddedView(parent: ViewData, anchorDef: NodeDef, context?: any): ViewData;
export declare function createRootView(root: RootData, def: ViewDefinition, context?: any): ViewData;
export declare const checkNoChangesView: (view: ViewData) => void;
export declare const checkAndUpdateView: (view: ViewData) => void;
export declare function checkNodeInline(v0?: any, v1?: any, v2?: any, v3?: any, v4?: any, v5?: any, v6?: any, v7?: any, v8?: any, v9?: any): any;
export declare function checkNodeDynamic(values: any[]): any;
export declare const destroyView: (view: ViewData) => void;
