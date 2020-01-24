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
export declare function assertFirstCreatePass(tView: TView, errMessage?: string): void;
export declare function assertFirstUpdatePass(tView: TView, errMessage?: string): void;
/**
 * This is a basic sanity check that an object is probably a directive def. DirectiveDef is
 * an interface, so we can't do a direct instanceof check.
 */
export declare function assertDirectiveDef(obj: any): void;
