/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { TNode } from './interfaces/node';
import { LView } from './interfaces/view';
export declare function assertComponentType(actual: any, msg?: string): void;
export declare function assertNgModuleType(actual: any, msg?: string): void;
export declare function assertPreviousIsParent(isParent: boolean): void;
export declare function assertHasParent(tNode: TNode): void;
export declare function assertDataNext(lView: LView, index: number, arr?: any[]): void;
