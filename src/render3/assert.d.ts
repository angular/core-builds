/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { TNode } from './interfaces/node';
import { LView, TView } from './interfaces/view';
export declare function assertTNodeForLView(tNode: TNode, lView: LView): void;
export declare function assertComponentType(actual: any, msg?: string): void;
export declare function assertNgModuleType(actual: any, msg?: string): void;
export declare function assertPreviousIsParent(isParent: boolean): void;
export declare function assertHasParent(tNode: TNode | null): void;
export declare function assertDataNext(lView: LView, index: number, arr?: any[]): void;
export declare function assertLContainerOrUndefined(value: any): void;
export declare function assertLContainer(value: any): void;
export declare function assertLViewOrUndefined(value: any): void;
export declare function assertLView(value: any): void;
export declare function assertFirstTemplatePass(tView: TView, errMessage?: string): void;
